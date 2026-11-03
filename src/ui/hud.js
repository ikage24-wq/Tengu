// Always-on HUD: status bar, hotkeys, minimap, buffs, quest tracker, message log, map banner.

import { SKILLS, skillAt } from '../data/skills.js';
import { JOBS } from '../data/jobs.js';
import { expToNext } from '../core/exp.js';
import { countItem } from '../core/inventory.js';
import { HOTKEYS } from '../core/character.js';
import { drawItemIcon, drawSkillIcon } from '../render/icons.js';
import { COLORS, THEMES, softShadow, text, box, bar, hover, clicked, tooltip, icon, sparkle, font, roundRect, lighten, darken } from './kit.js';
import { calmOf, soothes, CALM, SOUR } from '../world/calm.js';
import { drawHero } from '../render/hero.js';
import { heartbeat } from '../render/aura.js';
import { settings } from '../core/settings.js';
import { partyMembers, PLAYSTYLES } from '../world/party.js';
import { price } from '../world/chatter.js';
import { itemTooltip, skillTooltip } from './tooltips.js';
import { DUNGEONS } from '../data/dungeons.js';
import { gaugeOf } from '../world/melee.js';
import { HITS_WINDOW } from '../world/world.js';
import { taskProgress, clock } from '../world/dungeon.js';
import { groundAt } from '../world/physics.js';
import { MATERIALS } from '../render/terrain.js';
import { questMarker } from './npc.js';
import { drawQuestTracker } from './quests.js';
import { THEMES as SCENE_THEMES } from '../render/scenery.js';
import { currentLesson, skipLesson } from '../world/tutorial.js';
import { othersHere } from '../net/online.js';
import { inParty } from '../net/together.js';
import { drawMinimapPings } from './grouping.js';
import { groupReady, NEAR_BONUS } from '../world/teamwork.js';

const KEY_LABEL = (code) => code.replace('Key', '').replace('Digit', '');
const LAV = THEMES.lavender;
// The HUD floats over the world as three soft pastel trays instead of one strip across the
// bottom: you (portrait, bars, EXP, gold) on the left, the menu buttons in the middle, and the
// hotkeys on the right as round candy buttons.
const TRAY_Y = 322;
const TRAY_H = 34;
const MENU_X = 221;
const MENU_STEP = 14.4;
// The menu buttons' radius (ten of them fit between the other two trays).
const MENU_R = 7;
const HK_X = 380;
const HK_STEP = 21;
const HK_D = 19;
const HK_Y = TRAY_Y + (TRAY_H - HK_D) / 2;
// A tray: a cream pill with a pink rim, a white inner line and a soft drop shadow.
function tray(ctx, x, w, edge = '#f4bcd8') {
  softShadow(ctx, x, TRAY_Y, w, TRAY_H, TRAY_H / 2, 3);
  box(ctx, x, TRAY_Y, w, TRAY_H, { fill: '#fffaf8', edge, r: TRAY_H / 2, width: 2 });
  roundRect(ctx, x + 2.5, TRAY_Y + 2.5, w - 5, TRAY_H - 5, TRAY_H / 2 - 2.5);
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Bar feedback, from how a value changed since last frame: the chunk just lost holds for a
// moment and then drains; a heal flashes the bar white and sweeps a shine across it; a blow
// nudges it, and one of a tenth of the bar or more shakes it hard.
function meter(state, key, ratio, t) {
  const hud = (state.hud ??= {});
  const m = (hud[key] ??= { v: ratio, trail: ratio, hold: 0, at: t, healAt: -9, hitAt: -9, hurtAt: -9 });
  const dt = Math.max(0, Math.min(0.1, t - m.at));
  m.at = t;
  if (ratio > m.v + 0.0005) {
    if (ratio - m.v > 0.02) m.healAt = t;
    m.gainAt = t;
    m.trail = Math.max(m.trail, ratio);
  } else if (ratio < m.v - 0.0005) {
    if (m.trail <= m.v + 0.001) m.hold = t + 0.6;
    m.trail = Math.max(m.trail, m.v);
    m.hurtAt = t;
    m.hitAt = t;
    m.big = m.v - ratio >= 0.1;
  }
  m.v = ratio;
  if (t > m.hold) m.trail = ratio + (m.trail - ratio) * Math.exp(-dt * 4);
  const heal = t - m.healAt;
  const hit = t - m.hitAt;
  return {
    trail: m.trail,
    flash: heal < 0.15 ? 1 - heal / 0.15 : 0,
    shine: heal < 0.4 ? heal / 0.4 : null,
    shake: hit < 0.22 ? Math.round(Math.sin(hit * 80) * (m.big ? 2 : 1) * (1 - hit / 0.22)) : 0,
    hurt: t - m.hurtAt,
    // Refilling: true for a moment after it last went up.
    filling: t - (m.gainAt ?? -9) < 0.6,
  };
}

// The amount just lost or gained, popping out beside a bar and floating off (the HUD redraw):
// "-123" in the bar's warning red, "+80" in its own colour. Changes close together add up.
function changes(state, key, value, t) {
  const hud = state.hud;
  const c = (hud[`${key}Pop`] ??= { last: value, pops: [] });
  const d = value - c.last;
  c.last = value;
  if (d !== 0) {
    const top = c.pops[c.pops.length - 1];
    if (top && t - top.at < 0.25 && Math.sign(top.d) === Math.sign(d)) top.d += d;
    else c.pops.push({ d, at: t });
  }
  c.pops = c.pops.filter((p) => t - p.at < 1);
  return c.pops;
}
function drawPops(ctx, pops, x, y, t, gain) {
  for (const p of pops) {
    const a = t - p.at;
    // Losses pop out on the right of the bar's middle, gains a little to the left, so both read.
    const px = x + (p.d > 0 ? -22 : 0);
    const pop = a < 0.12 ? 1 + 0.5 * (1 - a / 0.12) : 1;
    const k = Math.min(1, (1 - a) / 0.35);
    ctx.globalAlpha = Math.max(0, k);
    text(ctx, `${p.d > 0 ? '+' : '-'}${Math.abs(p.d).toLocaleString()}`, px, y - a * 10, { size: 6 * pop, bold: true, color: p.d > 0 ? gain : '#ff4f6b', outline: '#ffffff' });
    ctx.globalAlpha = 1;
  }
}

// The red edge that pulses on the world while HP is low: drawn once, then faded in and out.
let vignette = null;
function lowHpVignette(ctx, k) {
  if (!vignette) {
    vignette = document.createElement('canvas');
    vignette.width = 320;
    vignette.height = 180;
    const v = vignette.getContext('2d');
    const g = v.createRadialGradient(160, 90, 70, 160, 90, 190);
    g.addColorStop(0, 'rgba(255,60,100,0)');
    g.addColorStop(0.55, 'rgba(255,60,100,0.3)');
    g.addColorStop(1, 'rgba(230,30,80,0.85)');
    v.fillStyle = g;
    v.fillRect(0, 0, 320, 180);
  }
  ctx.globalAlpha = k;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(vignette, 0, 0, 640, 360);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1;
}

export function drawHud(ui, state, world) {
  const { ctx } = ui;
  const char = world.char;
  const s = world.stats;
  const t = world.now;

  // ----- You: portrait, name, HP and MP pills, EXP, gold -----
  const need = expToNext(char.level);
  const pct = Number.isFinite(need) ? char.exp / need : 1;
  const hpR = char.hp / s.maxHp;
  const hp = meter(state, 'hp', hpR, t);
  const mp = meter(state, 'mp', char.mp / s.maxMp, t);
  const low = hpR < 0.2 && char.hp > 0;
  const beat = low ? 0.5 + 0.5 * Math.sin(t * 7) : 0;
  if (low) lowHpVignette(ctx, 0.25 + 0.3 * beat);
  tray(ctx, 4, 216, low && beat > 0.5 ? '#ff9fb4' : '#f4bcd8');

  const hud = state.hud;
  if (hud.level != null && char.level > hud.level) hud.levelAt = t;
  hud.level = char.level;
  drawPortrait(ctx, char, world, { hurt: hp.hurt < 0.35, low, cheer: t - (hud.levelAt ?? -9) < 3 });
  text(ctx, char.name, 46, TRAY_Y + 10, { size: 8, bold: true });
  ctx.font = font(8, true);
  text(ctx, JOBS[char.job].name, 46 + ctx.measureText(char.name).width + 4, TRAY_Y + 10, { size: 6.5, color: COLORS.muted });

  bar(ctx, 56 + hp.shake, TRAY_Y + 13, 112, 8, hpR, low ? (beat > 0.5 ? '#ff4f6b' : COLORS.hp) : COLORS.hp, `${char.hp} / ${s.maxHp}`, { size: 6, trail: hp.trail, trailColor: '#ffd3dc', flash: hp.flash, shine: hp.shine, pulse: low ? 0.25 + 0.5 * beat : 0, rim: true, ticks: true, stripes: hp.filling ? 1 : 0 });
  bar(ctx, 56, TRAY_Y + 23, 112, 8, char.mp / s.maxMp, COLORS.mp, `${char.mp} / ${s.maxMp}`, { size: 6, trail: mp.trail, trailColor: '#d6ebff', flash: mp.flash, shine: mp.shine, rim: true, ticks: true, stripes: mp.filling ? 1 : 0 });
  drawPops(ctx, changes(state, 'hp', char.hp, t), 150 + hp.shake, TRAY_Y + 10, t, '#4fc97a');
  drawPops(ctx, changes(state, 'mp', char.mp, t), 150, TRAY_Y + 20, t, '#4fa8ff');
  badge(ctx, 52 + hp.shake, TRAY_Y + 17, 'heart', COLORS.hp, low ? 1 + beat * 0.25 : 1 + hp.flash * 0.2);
  badge(ctx, 52, TRAY_Y + 27, 'drop', COLORS.mp, 1 + mp.flash * 0.2);

  // EXP: a little pill of its own beside the bars, filling up in gold, with the percent.
  const ex = 174;
  box(ctx, ex, TRAY_Y + 7, 40, 9, { fill: '#fff4d6', edge: '#f2d17a', r: 4.5, width: 1 });
  if (pct > 0) box(ctx, ex + 1, TRAY_Y + 8, Math.max(7, 38 * Math.min(1, pct)), 7, { fill: '#ffd66b', edge: null, r: 3.5 });
  text(ctx, Number.isFinite(need) ? `${(pct * 100).toFixed(1)}%` : 'MAX', ex + 20, TRAY_Y + 14, { size: 5.5, bold: true, align: 'center', color: '#ffffff', outline: '#c99a1f' });
  if (hover(ui, ex, TRAY_Y + 7, 40, 9)) tooltip(ui, [{ text: 'Experience', bold: true, color: COLORS.gold }, { text: Number.isFinite(need) ? `${char.exp.toLocaleString()} / ${need.toLocaleString()} (${(pct * 100).toFixed(1)}%)` : 'Max level', size: 8 }]);

  // Loot lands with a bump: the coin when gold comes in, the Bag button when an item does.
  const items = Object.values(char.inventory).reduce((n, tab) => n + tab.reduce((m, e) => m + (e ? e.qty ?? 1 : 0), 0), 0);
  // Loot picked up in the world bumps the button when its icon lands there (drawPickups) instead.
  const flying = world.pickups?.some((f) => world.now - f.at < 0.1);
  if (hud.items != null && items > hud.items && !flying) hud.bagAt = t;
  if (hud.gold != null && char.gold > hud.gold) hud.goldAt = t;
  hud.items = items;
  hud.gold = char.gold;
  const bump = (at) => {
    const a = t - (at ?? -9);
    return a < 0.25 ? 1 + 0.22 * Math.sin((a / 0.25) * Math.PI) : 1;
  };
  icon(ctx, 'coin', ex + 4, TRAY_Y + 25, 8 * bump(hud.goldAt), '#f0b53a');
  // Big fortunes shorten (1.2m) so they always fit.
  text(ctx, char.gold >= 10000 ? price(char.gold) : char.gold.toLocaleString(), ex + 10, TRAY_Y + 28, { size: 7, bold: true, color: COLORS.gold });
  if (hover(ui, ex, TRAY_Y + 19, 44, 11)) tooltip(ui, [{ text: `${char.gold.toLocaleString()} gold`, bold: true, color: COLORS.gold }]);

  // ----- Menu buttons: round candy buttons in their own tray, a dot when points are waiting -----
  const menus = [['Bag', 'bag', 'I', 'bag', 'peach'], ['Stats', 'stats', 'C', 'star', 'pink'], ['Skills', 'skills', 'K', 'book', 'lavender'], ['Quests', 'quests', 'L', 'scroll', 'mint'], ['Life Skills', 'life', 'G', 'leaf', 'mint'], ['World Map', 'worldmap', 'M', 'map', 'sky'], ['Cash Shop', 'cashshop', 'O', 'gift', 'pink'], ['Mochi', 'pet', 'P', 'heart', 'pink'], ['Friends', 'online', 'N', 'friends', 'sky'], ['Options', 'options', 'Esc', 'gear', 'gold']];
  tray(ctx, MENU_X, (menus.length - 1) * MENU_STEP + 2 * MENU_R + 8.5);
  menus.forEach(([label, key, hotkey, ic, theme], i) => {
    const cx = MENU_X + MENU_R + 4.5 + i * MENU_STEP;
    const cy = TRAY_Y + TRAY_H / 2 - 1;
    const th = THEMES[theme];
    const hot = hover(ui, cx - 8, cy - 8, 16, 16);
    const open = state.windows[key].open;
    // Lifts under the mouse and sinks onto its lip the moment it's pressed.
    const lift = hot && ui.mouse.down ? 1.5 : hot ? -1.5 : 0;
    const k = key === 'bag' ? bump(hud.bagAt) : 1;
    ctx.fillStyle = th.dark;
    ctx.beginPath();
    ctx.arc(cx, cy + 1.5, MENU_R * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = open ? th.main : hot ? '#ffffff' : th.light;
    ctx.beginPath();
    ctx.arc(cx, cy + lift, MENU_R * k, 0, Math.PI * 2);
    ctx.fill();
    // A gloss along the top of the bubble.
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(cx - 1.5, cy + lift - 4, 4, 2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = th.dark;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy + lift, MENU_R * k, 0, Math.PI * 2);
    ctx.stroke();
    icon(ctx, ic, cx, cy + lift, 8.4 * k, open ? '#ffffff' : th.dark);
    if (hot) tooltip(ui, [{ text: label, bold: true, color: th.dark }, { text: `Hotkey: ${hotkey}`, size: 8, color: COLORS.muted }]);
    if (clicked(ui, cx - 8, cy - 8, 16, 16)) state.windows[key].open = !open;
    const alert = (key === 'stats' && char.ap > 0) || (key === 'skills' && char.sp > 0);
    if (alert) {
      ctx.fillStyle = COLORS.bad;
      ctx.beginPath();
      ctx.arc(cx + 6.5, cy - 6.5 + lift, 3 + Math.sin(t * 6) * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  drawPickups(ctx, state, world, hud, t);

  // Hotkeys: little keycaps with a lip, the key printed in a corner tab. A key sinks when pressed;
  // a skill it casts pops with a white flash, and one you can't afford shakes instead. Skills
  // without the MP for them grey out under a blue veil and flash a white rim when they're ready
  // again.
  const keys = (hud.keys ??= {});
  const typing = state.chat?.typing != null;
  const carrying = Boolean(state.windows.skills?.carry?.live || (state.windows.bag?.carry?.live && state.windows.bag.tab === 1));
  tray(ctx, HK_X - 6, HOTKEYS.length * HK_STEP + 10, '#d9c4f4');
  HOTKEYS.forEach((code, i) => {
    const b = char.hotkeys[code];
    const k = (keys[code] ??= { at: -9, ok: true, readyAt: -9, short: false });
    const lv = b?.skill ? char.skills[b.skill] ?? 0 : 0;
    const noMp = Boolean(lv && SKILLS[b.skill].type !== 'passive' && char.mp < skillAt(b.skill, lv).mp);
    if (b?.skill && !noMp && !k.ok) k.readyAt = t;
    k.ok = !noMp;
    if (!typing && ui.input.pressed?.has(code)) {
      k.at = t;
      k.short = noMp;
    }
    const age = t - k.at;
    const sink = age < 0.09 ? 1.5 : 0;
    const rise = hover(ui, HK_X + i * HK_STEP, HK_Y, HK_D, HK_D) && age >= 0.09 ? -1 : 0;
    const shake = k.short && age < 0.2 ? Math.round(Math.sin(age * 90) * 1.5) : 0;
    const x = HK_X + i * HK_STEP + shake;
    const y = HK_Y + rise;
    const D = HK_D;
    const hot = hover(ui, x, y, D, D);
    box(ctx, x, y + 1.5, D, D, { fill: '#dccbee', edge: null, r: D / 2 });
    // While a skill or potion is being dragged from a window, every slot shows it can take it,
    // and the one under the mouse lights up. An empty slot is a dimmer, dashed bubble.
    const target = carrying && hot;
    box(ctx, x, y + sink, D, D, { fill: target ? '#fff3c4' : hot ? '#ffffff' : b ? '#fffdfb' : '#f7f0fc', edge: target ? COLORS.select : carrying ? LAV.dark : b ? LAV.main : null, r: D / 2, width: target ? 2 : 1.2 });
    if (!b && !carrying) {
      ctx.save();
      ctx.setLineDash([2, 2]);
      roundRect(ctx, x + 0.5, y + 0.5 + sink, D - 1, D - 1, D / 2);
      ctx.strokeStyle = '#d6c4ec';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    const c0 = D / 2;
    if (b?.skill) {
      const pop = !k.short && age < 0.16 ? 1 + 0.15 * Math.sin((age / 0.16) * Math.PI) : 1;
      ctx.save();
      ctx.translate(x + c0, y + c0 + sink);
      ctx.scale(pop, pop);
      ctx.beginPath();
      ctx.arc(0, 0, D / 2 - 1, 0, Math.PI * 2);
      ctx.clip();
      drawSkillIcon(ctx, b.skill, -8, -8);
      if (noMp) {
        roundRect(ctx, -8, -8, 16, 16, 3);
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = '#808080';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(70,110,190,0.42)';
        ctx.fill();
      }
      if (!k.short && age < 0.12) {
        roundRect(ctx, -8, -8, 16, 16, 3);
        ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - age / 0.12)})`;
        ctx.fill();
      }
      ctx.restore();
      // A cast sends a ring rippling out of the bubble.
      if (!k.short && age < 0.3) {
        const u = age / 0.3;
        ctx.globalAlpha = 1 - u;
        ctx.strokeStyle = LAV.main;
        ctx.lineWidth = 2 * (1 - u) + 0.5;
        ctx.beginPath();
        ctx.arc(x + c0, y + c0 + sink, D / 2 + 1 + 7 * u, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      const ready = t - k.readyAt;
      if (ready < 0.3) {
        ctx.globalAlpha = 1 - ready / 0.3;
        box(ctx, x - 1, y - 1 + sink, D + 2, D + 2, { fill: null, edge: '#ffffff', r: D / 2 + 1, width: 2 });
        ctx.globalAlpha = 1;
      }
      if (hot) tooltip(ui, skillTooltip(char, b.skill));
    } else if (b?.item) {
      const n = countItem(char.inventory, b.item);
      ctx.globalAlpha = n ? 1 : 0.35;
      drawItemIcon(ctx, b.item, x + c0 - 8, y + c0 - 8 + sink);
      ctx.globalAlpha = 1;
      text(ctx, `${n}`, x + D, y + D + sink, { size: 6, bold: true, align: 'right', color: '#ffffff', outline: COLORS.ink });
      if (hot) tooltip(ui, itemTooltip(char, b.item));
    }
    // The key, on a little round tag at the top-left of the bubble.
    ctx.fillStyle = b ? LAV.main : '#cdb8ec';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2 + sink, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    text(ctx, KEY_LABEL(code), x + 2, y + 4.2 + sink, { size: 5.5, bold: true, align: 'center', color: '#ffffff' });
    if (b && ui.mouse.right && hot) {
      delete char.hotkeys[code];
      ui.used = true;
    }
    clicked(ui, x, y, D, D);
  });

  drawHits(ui, state, world);
  const gauge = gaugeOf(char);
  if (gauge) drawGauge(ui, world, gauge, world[gauge] ?? 0);
  drawSideBySide(ui, world, gauge ? 548 : 620);
  if (settings.minimap) drawMinimap(ui, world);
  drawBuffs(ui, world);
  if (world.dungeon) {
    drawDungeonTracker(ui, world);
    drawCallout(ctx, world);
  } else if (settings.questTracker) drawQuestTracker(ui, state, world);
  if (settings.messageLog || state.chat?.typing != null) drawLog(ui, world, state);
  if (settings.mapBanner) drawBanner(ctx, world, state);
  drawTutorial(ui, world);
  if (settings.showFps) drawFps(ctx, state);
}

// Loot you pick up flies into the Bag button: from where it lay, up and over on a curve, shrinking
// as it goes, and the button bumps when it lands (fx research: pickup juice).
const FLIGHT = 0.5;
function drawPickups(ctx, state, world, hud, t) {
  const cam = state.cam;
  if (!world.pickups?.length) return;
  world.pickups = world.pickups.filter((f) => {
    const age = world.now - f.at;
    if (age >= FLIGHT || age < 0) {
      if (age >= FLIGHT) hud.bagAt = t;
      return false;
    }
    if (!cam) return true;
    const k = age / FLIGHT;
    // Ease in: it lifts off gently and speeds into the button.
    const e = k * k * (3 - 2 * k) * 0.4 + k * k * 0.6;
    const sx = f.x - cam.x;
    const sy = f.y - cam.y;
    const ex = MENU_X + MENU_R + 4.5;
    const ey = TRAY_Y + TRAY_H / 2 - 1;
    const cx = (sx + ex) / 2;
    const cy = Math.min(sy, ey) - 70;
    const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * ex;
    const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * ey;
    const s = 1 - 0.45 * e;
    ctx.globalAlpha = k < 0.85 ? 1 : (1 - k) / 0.15 + 0.3;
    drawItemIcon(ctx, f.id, x - 8 * s, y - 8 * s, s, f.variant);
    ctx.globalAlpha = 1;
    return true;
  });
}

// The hotkey slot under a point on screen (for dragging items onto the bar), or null.
export function hotkeyAt(x, y) {
  const i = Math.floor((x - HK_X) / HK_STEP);
  if (i < 0 || i >= HOTKEYS.length || x > HK_X + i * HK_STEP + HK_D) return null;
  return y >= HK_Y && y < HK_Y + HK_D ? HOTKEYS[i] : null;
}

// A job's gauge over the hotkeys: a Warrior's Valor (a shield), an Archer's Momentum (a feather), a
// Berserker's Rage (a flame), a Paladin's Faith (a star) a Beastmaster's Bond (Snow wolf's Patience, a moon) or a Stormcaller's Charge (a bolt). It fills as blows land, with a notch where Rampage opens up; full, it burns bright, pulses,
// names the state (BERSERK, SANCTIFIED), and tints the edges of the screen.
const GAUGES = {
  valor: { color: '#4f7fe0', hot: '#9fd2ff', icon: 'shield', name: 'Valor', full: 'UNBROKEN', notch: () => null, edge: 'rgba(110,160,255,', ink: '#24307a',
    tip: 'Your blows build it, faster the more monsters one blow hits; it drains once the fighting stops. Full, your blows land heavier and nothing knocks you back, and Titan Breaker is ready.' },
  momentum: { color: '#2a9a78', hot: '#ffd36a', icon: 'star5', name: 'Combo', full: 'SHOWTIME', notch: () => null, edge: 'rgba(94,214,168,', ink: '#145a4a',
    tip: 'Your shots build it, more for each one landed in a row; your flips and rolls keep it from fading, and taking a hit knocks half of it away. Full (Showtime), every shot you loose splits into three arrows, and Grand Somersault is ready.' },
  grace: { color: '#e0609e', hot: '#ffd36a', icon: 'note', name: 'Applause', full: 'LIVE SHOW', notch: () => null, edge: 'rgba(255,143,192,', ink: '#8a2a5e',
    tip: 'The crowd cheers for you: your heals build it most, more for every ally they reach, and your songs and notes that land build it too; it fades once the fighting stops. Full, your songs reach twice as far and mend more, and Grand Concert is ready.' },
  binding: { color: '#6a4ac8', hot: '#e8e8ff', icon: 'planet', name: 'Orbit', full: 'FULL ORBIT', notch: () => null, ticks: 5, label: (v) => `${Math.min(5, Math.floor((v * 5) / 100 + 1e-9))}/5`, edge: 'rgba(212,216,238,', ink: '#2a1a6a',
    tip: 'The moons round you: one joins your orbit for every fifth of it, built by your spells that land, and each in turn flies off at a monster close by; it fades once the fighting stops. With all five (Full Orbit), they fly out twice as often, and Planetary Alignment is ready.' },
  spirit: { color: '#2c3590', hot: '#ffd36a', icon: 'star5', name: 'Constellation', full: 'ALL STARS LIT', notch: () => null, ticks: 7, label: (v) => `${Math.min(7, Math.floor((v * 7) / 100 + 1e-9))}/7`, edge: 'rgba(255,211,106,', ink: '#141a4a',
    tip: 'Your spells that land and your heals light its stars, half again when you turn from one to the other; it fades once the fighting stops. With all seven lit, every star bolt and comet you cast splits into three, and Starfall is ready.' },
  ki: { color: '#d26d6a', hot: '#ffd36a', icon: 'chakram', name: 'Ricochet', full: 'CAROUSEL', notch: () => null, edge: 'rgba(246,173,148,', ink: '#7e3450',
    tip: 'Every ring of yours that lands builds it, and every bounce builds more; it fades once the fighting stops. Full, two rose-gold rings orbit you and cut whatever comes close, and Golden Carousel is ready.' },
  tails: { color: '#4e9fe6', hot: '#ffe6a0', icon: 'wing', name: 'Tailwind', full: 'TAILWIND', notch: () => null, edge: 'rgba(154,214,255,', ink: '#2a4f9e',
    tip: 'Your hits build it, three times as fast while you dance in the air; it fades once the fighting stops. Full, a whirlwind under your feet lets you fly freely (Up and Down), your gusts are twice as big, and Sky Waltz is ready.' },
  shadow: { color: '#f2655c', hot: '#ffe6bc', icon: 'star', name: 'Encore', full: 'STANDING OVATION', notch: () => null, edge: 'rgba(242,101,92,', ink: '#7a2a40',
    tip: 'Your hits build it, faster when they land in a quick chain; it fades fast once the fighting stops. Full, every attack you make strikes twice, and Grand Finale is ready.' },
  rage: { color: '#c0102e', hot: '#ff6a3a', icon: 'flame', name: 'Rage', full: 'BERSERK', notch: () => SKILLS.rampage?.rageCost ?? 30,
    tip: 'Your blows build it and it drains once the fighting stops. The fuller it is, the harder you hit. Rampage spends it all; full, it powers Crimson Eclipse.' },
  faith: { color: '#e8b02a', hot: '#ffe36b', icon: 'star', name: 'Faith', full: 'SANCTIFIED', notch: () => null,
    tip: 'Your blows and the hits you take build it; it drains once the fighting stops. The fuller it is, the less damage you take; full, it powers Grand Verdict.' },
  bond: { color: '#9a4a9a', hot: '#f2eeff', icon: 'tophat', name: 'Illusion', full: 'ALL COPIES', notch: () => null, edge: 'rgba(216,180,232,', ink: '#3a1446',
    tip: 'Your shots that land build it; it fades once the fighting stops. Half full, a see-through copy of you stands behind you and shoots with you every other arrow; full, two (a third with Hall of Mirrors) shoot with every arrow, and Grand Illusion is ready.' },
  charge: { color: '#b8782a', hot: '#4fe0d0', icon: 'cog', name: 'Pressure', full: 'OVERDRIVE', notch: () => null, edge: 'rgba(79,224,208,', ink: '#5a3818',
    tip: 'Every bolt of yours that lands builds steam pressure; it fades once the fighting stops. Full (Overdrive), your crossbow vents steam and every shot fires a second bolt, and Big Bertha is ready.' },
};
function drawGauge(ui, world, kind, value) {
  const { ctx } = ui;
  const G = GAUGES[kind];
  const x = 566;
  const y = TRAY_Y - 22;
  const k = Math.min(1, value / 100);
  const full = k >= 1;
  // Full, a slow pulse (about a second); every gain flashes the bar white for a moment, and from
  // 80 it turns its hot colour, almost there (FFXIV's gauges; research/archery.md 31).
  const beat = full ? 0.5 + 0.5 * Math.sin(world.now * 7) : 0;
  const gainAt = world[`${kind}At`] ?? -9;
  const gained = !full && world.now - gainAt < 0.09;
  // Berserk's edges are dark blood that thumps with a heartbeat (lub-dub, render/aura.js), with
  // the demon behind him; every other full gauge glows its colour on a slow pulse.
  if (full && kind === 'rage') {
    const h = heartbeat(world.now);
    edgeTint(ctx, 'rgba(110,4,28,', 0.3 + 0.28 * (1 - h) * (h < 1 ? 1 : 0));
  } else if (full) edgeTint(ctx, G.edge ?? 'rgba(255,214,90,', 0.22 + 0.12 * beat);
  box(ctx, x, y, 70, 16, { fill: 'rgba(255,250,248,0.94)', edge: full ? (beat > 0.5 ? G.color : G.hot) : '#f4bcd8', r: 8, width: full ? 1.8 : 1.5 });
  badge(ctx, x + 8, y + 8, G.icon, G.color, 1 + beat * 0.15);
  bar(ctx, x + 16, y + 5, 40, 6, k, gained ? '#ffffff' : (full && beat > 0.5) || (!full && k >= 0.8) ? G.hot : G.color, '', { pulse: full ? 0.3 * beat : 0 });
  const notch = G.notch();
  if (notch) {
    ctx.fillStyle = value >= notch ? '#ffffff' : 'rgba(74,53,96,0.55)';
    ctx.fillRect(Math.round(x + 16 + 40 * (notch / 100)), y + 4, 1, 8);
  }
  // A gauge counted in steps (the Kitsune's nine tails) shows each step on the bar.
  if (G.ticks) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let k = 1; k < G.ticks; k++) ctx.fillRect(Math.round(x + 16 + (40 * k) / G.ticks), y + 5, 1, 6);
  }
  text(ctx, G.label ? G.label(value) : `${Math.floor(value)}`, x + 66, y + 11, { size: 7, bold: true, align: 'right', color: full ? G.color : COLORS.ink });
  if (full) {
    text(ctx, G.full, x + 35, y - 3, { size: 8, bold: true, align: 'center', color: beat > 0.5 ? '#ffffff' : G.hot, outline: G.ink ?? (kind === 'rage' ? '#7a1030' : '#a8661a') });
    // A full gauge is what a finisher spends: say so when you know one.
    if (Object.values(SKILLS).some((k) => k.fullGauge && (world.char.skills[k.id] ?? 0) > 0)) {
      const group = groupReady(world);
      text(ctx, group ? 'GROUP FINISHER READY' : 'FINISHER READY', x + 35, y - 13, { size: 8, bold: true, align: 'center', color: beat > 0.5 ? (group ? '#ffc58a' : '#ffe36b') : '#ffffff', outline: group ? '#c4567a' : '#c8243a' });
    }
  }
  if (hover(ui, x, y, 70, 16)) tooltip(ui, [{ text: G.name, bold: true, color: G.color }, { text: G.tip, size: 8, color: COLORS.muted }]);
}

// Side by side (world/teamwork.js): a little party badge by the gauge while members fight near
// you, a pip for each (up to three), easing in and out and bumping when one joins.
const sideHud = new WeakMap();
function drawSideBySide(ui, world, x) {
  const { ctx } = ui;
  const n = world.team?.near ?? 0;
  const hud = sideHud.get(world) ?? sideHud.set(world, { a: 0, n: 0, bump: -9 }).get(world);
  if (n > hud.n) hud.bump = world.now;
  hud.n = n;
  hud.a += ((n ? 1 : 0) - hud.a) * 0.15;
  if (hud.a < 0.02) return;
  const y = TRAY_Y - 14;
  const pop = Math.max(0, 1 - (world.now - hud.bump) / 0.25);
  ctx.save();
  ctx.globalAlpha = hud.a;
  box(ctx, x - 8, y - 8, 16, 16, { fill: 'rgba(255,250,248,0.94)', edge: '#ff9670', r: 8, width: 1.5 });
  badge(ctx, x, y, 'friends', '#c4567a', 1 + pop * 0.3 + Math.sin(world.now * 3) * 0.03);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < hud.n ? '#ff9670' : 'rgba(196,86,122,0.25)';
    ctx.beginPath();
    ctx.arc(x - 4 + i * 4, y + 11, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  if (hover(ui, x - 8, y - 8, 16, 16)) tooltip(ui, [{ text: 'Side by Side', bold: true, color: '#c4567a' }, { text: `Fighting near ${hud.n} party member${hud.n === 1 ? '' : 's'}: +${Math.round(hud.n * NEAR_BONUS * 100)}% damage (up to 3).`, size: 8, color: COLORS.muted }]);
}

// A soft colour around the screen's edges (a full gauge's state).
function edgeTint(ctx, rgba, a) {
  ctx.save();
  const g = ctx.createRadialGradient(320, 170, 140, 320, 170, 380);
  g.addColorStop(0, `${rgba}0)`);
  g.addColorStop(1, `${rgba}${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 640, 360);
  ctx.restore();
}

// The hit counter, on the right: the count pops each time it climbs, takes a warmer colour as it
// grows, and fades as the combo is about to drop.
const HIT_TIERS = [
  [100, '#ff5ab4'],
  [50, '#ff8a3c'],
  [25, '#ffc83c'],
  [10, '#6fd0ff'],
  [0, '#ffffff'],
];
function drawHits(ui, state, world) {
  const { ctx } = ui;
  const hud = (state.hud ??= {});
  const n = world.hits ?? 0;
  const now = performance.now() / 1000;
  if (n !== hud.hits) {
    if (n > (hud.hits ?? 0)) hud.hitsPop = now;
    hud.hits = n;
  }
  if (n < 2) return;
  const left = HITS_WINDOW - (world.now - (world.hitsAt ?? world.now));
  const a = Math.max(0, Math.min(1, left / 0.6));
  const pop = Math.max(0, 1 - (now - (hud.hitsPop ?? -9)) / 0.16);
  const [, color] = HIT_TIERS.find(([min]) => n >= min);
  const x = 628;
  const y = 150;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.scale(1 + pop * 0.45, 1 + pop * 0.45);
  ctx.rotate(-0.06);
  text(ctx, `${n}`, 0, 0, { size: 24, bold: true, align: 'right', color, outline: '#4a3560' });
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = a;
  text(ctx, 'HITS', x, y + 11, { size: 8, bold: true, align: 'right', color: '#ffffff', outline: '#4a3560' });
  // The bar under it drains toward the drop.
  box(ctx, x - 52, y + 26, 52, 3, { fill: 'rgba(74,53,96,0.4)', edge: null, r: 1.5 });
  box(ctx, x - 52, y + 26, 52 * Math.max(0, left / HITS_WINDOW), 3, { fill: color, edge: null, r: 1.5 });
  ctx.restore();
}

// Frames per second, smoothed.
function drawFps(ctx, state) {
  const now = performance.now();
  const hud = (state.hud ??= {});
  if (hud.lastFrame) hud.fps = (hud.fps ?? 60) * 0.95 + (1000 / Math.max(1, now - hud.lastFrame)) * 0.05;
  hud.lastFrame = now;
  box(ctx, 290, 4, 60, 13, { fill: 'rgba(40,36,60,0.55)', edge: null, r: 6.5 });
  text(ctx, `${Math.round(hud.fps ?? 60)} FPS`, 320, 13.5, { size: 7.5, bold: true, align: 'center', color: '#bff0dc' });
}

// A round badge with an icon, sitting on the end of a bar.
function badge(ctx, x, y, name, color, k) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  icon(ctx, name, 0, 0.3, 7.5, color);
  ctx.restore();
}

// The hero's face in a round medallion with a level ribbon. The face reacts: a wince when hit,
// a worried pout while HP is low, and a cheer after a level up.
function drawPortrait(ctx, char, world, { hurt = false, low = false, cheer = false } = {}) {
  const cx = 24;
  const cy = TRAY_Y + 12;
  const r = 17;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const bg = ctx.createRadialGradient(cx, cy - 4, 2, cx, cy, r);
  bg.addColorStop(0, low ? '#fff0f2' : '#fff3fa');
  bg.addColorStop(1, low ? '#ff9fb4' : '#ffc2df');
  ctx.fillStyle = bg;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  const face = cheer ? 'excited' : low ? 'nervous' : char.appearance.face;
  const look = face === char.appearance.face ? char.appearance : { ...char.appearance, face };
  drawHero(ctx, look, null, cx, cy + 27, { pose: 'idle', time: world.now, scale: 1.25, facing: 1, hurt });
  ctx.restore();
  ctx.strokeStyle = low && Math.sin(world.now * 7) > 0 ? '#ff4f6b' : COLORS.accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // A little ribbon tied at the top of the frame, its tails swaying.
  const sw = Math.sin(world.now * 1.6) * 0.6;
  ctx.fillStyle = COLORS.accent;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 4, cy - r - 1);
    ctx.lineTo(cx + dir * 9 + sw, cy - r + 6);
    ctx.lineTo(cx + dir * 6 + sw, cy - r + 7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + dir * 4, cy - r - 2.5, 4, 2.6, dir * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy - r - 2.4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  box(ctx, cx - 14, cy + 14, 28, 10, { fill: COLORS.accent, edge: '#ffffff', r: 5, width: 1.5 });
  text(ctx, `Lv ${char.level}`, cx, cy + 21.6, { size: 6.5, bold: true, align: 'center', color: '#ffffff', outline: '#c95a8f' });
}

const SKY = THEMES.sky;

function luma(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function drawMinimap(ui, world) {
  const { ctx } = ui;
  const map = world.map;
  // (The minimap redraw: wider, and framed on the band of the map where things are, that band
  // shown taller than it is wide-for-wide, so a flat town isn't a three-pixel strip.)
  const w = 150;
  const scale = w / map.width;
  const tops = [...(map.terrain ?? [[0, map.groundY]]).map(([, ty]) => ty), ...map.platforms.map((p) => p.y), ...map.ropes.map((r) => r.top)];
  const top = Math.max(0, Math.min(...tops) - 70);
  const span = map.height - top;
  const h = Math.max(44, Math.min(96, Math.round(span * scale * 1.6)));
  const sy = h / span;

  const x = 8;
  const y = 20;
  const X = (v) => x + v * scale;
  const Y = (v) => y + (v - top) * sy;
  softShadow(ctx, x - 4, y - 16, w + 8, h + 20, 12, 3);
  box(ctx, x - 4, y - 16, w + 8, h + 20, { fill: 'rgba(255,250,248,0.94)', edge: '#f4bcd8', r: 12, width: 2 });
  box(ctx, x - 1, y - 13, w + 2, 11, { fill: SKY.main, edge: null, r: 5.5 });
  icon(ctx, 'map', x + 6, y - 7.5, 8, '#ffffff');
  text(ctx, map.name, x + 13, y - 4.5, { size: 7.5, bold: true, color: '#ffffff', outline: SKY.ink });
  ctx.save();
  roundRect(ctx, x, y, w, h, 6);
  ctx.clip();
  // The map's own colors: its sky, and its hills for the ground, so each map's box has its own
  // tint and the ground reads as a solid shape.
  const look = { ...(SCENE_THEMES[map.theme] ?? SCENE_THEMES.meadow), ...map.look };
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, lighten(look.sky[0], 0.55));
  sky.addColorStop(1, lighten(look.sky[1], 0.6));
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // Pale town hills would vanish into the sky, so those use the ground's own color.
  const land = luma(look.mid) > 0.85 ? look.ground : look.mid;
  const edge = darken(land, 0.35);
  // The ground's shape: hills, plateaus, and cliffs.
  const line = map.terrain ?? [[0, map.groundY], [map.width, map.groundY]];
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  for (const [tx, ty] of line) ctx.lineTo(x + tx * scale, Y(ty));
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = land;
  ctx.fill();
  // A soft shade down into the ground, and its top in the map's own grass (or sand, or snow).
  const deep = ctx.createLinearGradient(0, y + h * 0.5, 0, y + h);
  deep.addColorStop(0, 'rgba(58,45,79,0)');
  deep.addColorStop(1, 'rgba(58,45,79,0.22)');
  ctx.fillStyle = deep;
  ctx.fill();
  ctx.strokeStyle = (MATERIALS[map.look?.material ?? map.theme] ?? MATERIALS.meadow).lip;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  line.forEach(([tx, ty], i) => (i ? ctx.lineTo(X(tx), Y(ty) + 1) : ctx.moveTo(X(tx), Y(ty) + 1)));
  ctx.stroke();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  line.forEach(([tx, ty], i) => (i ? ctx.lineTo(x + tx * scale, Y(ty)) : ctx.moveTo(x + tx * scale, Y(ty))));
  ctx.stroke();
  // Footholds as solid ledges, ropes as thin lines.
  ctx.fillStyle = edge;
  for (const p of map.platforms) ctx.fillRect(x + p.x * scale, Y(p.y) - 0.5, Math.max(1, p.w * scale), 2);
  ctx.fillStyle = '#b8875a';
  for (const r of map.ropes) ctx.fillRect(x + r.x * scale - 0.5, Y(r.top), 1, (r.bottom - r.top) * sy);
  // Portals as little violet arches.
  for (const p of map.portals) {
    if (p.hidden) continue;
    const px = x + p.x * scale;
    const py = Y(p.y);
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, px - 3, py - 8, 6, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#9b6cff';
    roundRect(ctx, px - 2.2, py - 7.2, 4.4, 7.2, 2.2);
    ctx.fill();
    ctx.fillStyle = '#e6dcff';
    roundRect(ctx, px - 1, py - 5, 2, 5, 1);
    ctx.fill();
  }
  // People: yellow pips, with a "!" or "?" when they have a quest for you.
  for (const n of map.npcs) {
    const nx = x + n.x * scale;
    const ny = Y(groundAt(map, n.x)) - 2.5;
    const mark = questMarker(world.char, n.id);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(nx, ny, mark ? 3.2 : 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mark === '?' ? '#3fc48a' : '#ffbf2f';
    ctx.beginPath();
    ctx.arc(nx, ny, mark ? 2.4 : 1.6, 0, Math.PI * 2);
    ctx.fill();
    if (mark) text(ctx, mark, nx, ny + 1.6, { size: 4.5, bold: true, align: 'center', color: '#ffffff' });
  }
  ctx.fillStyle = '#ff5f86';
  for (const m of world.mobs) if (m.hp > 0) ctx.fillRect(x + m.x * scale - 0.75, Y(m.y) - 1.5, 1.5, 1.5);
  // Party members, out hunting on their own, in their playstyle's color.
  for (const b of partyMembers(world.bots)) {
    if (!b.body || b.map !== map.id) continue;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + b.body.x * scale, Y(b.body.y) - 2, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PLAYSTYLES[b.ai?.kind]?.color ?? '#3fc48a';
    ctx.beginPath();
    ctx.arc(x + b.body.x * scale, Y(b.body.y) - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Other players hunting here: small cream dots.
  for (const b of world.bots?.list ?? []) {
    if (!b.hunter || !b.body || b.map !== map.id) continue;
    ctx.fillStyle = '#7a6a92';
    ctx.beginPath();
    ctx.arc(x + b.body.x * scale, Y(b.body.y) - 2, 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(x + b.body.x * scale, Y(b.body.y) - 2, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Friends online: sky-blue dots, party friends a bigger rose dot with a white heart-ring.
  for (const g of othersHere(world)) {
    const gx = x + g.body.x * scale;
    const gy = Y(g.body.y) - 2.5;
    const mate = inParty(g.id);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(gx, gy, mate ? 3.3 : 2.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = g.dead ? '#b8a8c8' : mate ? '#ff6b9a' : '#4f95e0';
    ctx.beginPath();
    ctx.arc(gx, gy, mate ? 2.3 : 1.9, 0, Math.PI * 2);
    ctx.fill();
  }
  // The party's pings.
  drawMinimapPings(ctx, world, X, Y);
  // You: a pink arrow pointing the way you face, with a ring pulsing out from it.
  const px = x + world.body.x * scale;
  const py = Y(world.body.y) - 3;
  const f = world.body.facing ?? 1;
  const pulse = (world.now * 1.5) % 1;
  ctx.strokeStyle = COLORS.accent;
  ctx.globalAlpha = 1 - pulse;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(px, py, 2 + pulse * 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const arrow = (k) => {
    ctx.beginPath();
    ctx.moveTo(px + f * 3.6 * k, py);
    ctx.lineTo(px - f * 2.6 * k, py - 3 * k);
    ctx.lineTo(px - f * 1.2 * k, py);
    ctx.lineTo(px - f * 2.6 * k, py + 3 * k);
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = '#ffffff';
  ctx.lineJoin = 'round';
  arrow(1.45);
  ctx.fillStyle = '#ff5fa2';
  arrow(1);
  ctx.restore();
  // The map's calm (world/calm.js) on the right of the title bar: a petal and a little bar that
  // fills pink as the map calms, and glows once it's calm.
  if (soothes(map)) {
    const v = calmOf(world);
    const bx = x + w - 40;
    const by = y - 10;
    box(ctx, bx, by, 36, 5, { fill: 'rgba(255,255,255,0.85)', edge: null, r: 2.5 });
    box(ctx, bx, by, Math.max(5, 36 * v), 5, { fill: v >= CALM ? '#ff7fb6' : v < SOUR ? '#b8b0c8' : '#ffb3d1', edge: null, r: 2.5 });
    icon(ctx, 'heart', bx - 6, by + 2.5, 6, v >= CALM ? '#ff5fa2' : '#ffffff');
    if (hover(ui, bx - 10, by - 3, 48, 11)) tooltip(ui, v >= CALM ? 'Calm: its spirit is back. More EXP here, extra finds when gathering.' : v < SOUR ? 'Souring: hunt here to calm it.' : `Calming: ${Math.round(v * 100)}%. Hunt here to calm it.`);
  }
}

// Active buffs: round icons with a ring that runs down as the buff wears off.
function drawBuffs(ui, world) {
  const { ctx } = ui;
  const buffs = Object.entries(world.char.buffs);
  const map = world.map;
  const y = settings.minimap ? 20 + Math.max(24, Math.round(map.height * (128 / map.width))) + 8 : 8;
  buffs.forEach(([id, b], i) => {
    const x = 8 + i * 22;
    const left = Math.max(0, b.until - world.now);
    const total = b.until - (b.since ?? b.until - 60);
    const frac = total > 0 ? Math.min(1, left / total) : 1;
    box(ctx, x - 1, y - 1, 20, 20, { fill: '#ffffff', edge: null, r: 10 });
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 9, y + 9, 9, 0, Math.PI * 2);
    ctx.clip();
    if (b.food) drawItemIcon(ctx, b.food, x + 1, y + 1);
    else drawSkillIcon(ctx, id, x + 1, y + 1);
    ctx.restore();
    ctx.strokeStyle = left < 5 && Math.sin(world.now * 10) > 0 ? COLORS.bad : COLORS.select;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 9, y + 9, 9.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();
    text(ctx, `${Math.ceil(left)}`, x + 9, y + 26, { size: 6.5, bold: true, align: 'center', color: '#ffffff', outline: COLORS.ink });
    if (hover(ui, x, y, 18, 18)) tooltip(ui, [{ text: SKILLS[id]?.name ?? b.name, bold: true }, { text: `${Math.ceil(left)}s left`, color: COLORS.muted }]);
  });
}

// The message log: each line on its own soft pill so it reads over any background.
function drawLog(ui, world, state) {
  const { ctx } = ui;
  // While chatting the log sits above the chat bar and shows in full (on the Party tab, the
  // party's lines only).
  const typing = state.chat?.typing != null;
  const msgs = typing && state.chat.channel === 'party' && !state.chat.sendTo ? world.partyLog ?? [] : world.messages;
  ctx.font = font(8, true);
  msgs.forEach((m, i) => {
    const y = TRAY_Y - (typing ? 24 : 6) - (msgs.length - 1 - i) * 12;
    const a = typing ? 1 : Math.min(1, m.t);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    const w = ctx.measureText(m.text).width;
    box(ctx, 4, y - 8.5, w + 10, 11, { fill: 'rgba(58,40,82,0.55)', edge: null, r: 5.5 });
    text(ctx, m.text, 9, y, { size: 8, bold: true, color: m.color });
  });
  ctx.globalAlpha = 1;
}

// The map name drops in on a ribbon when you arrive somewhere.
function drawBanner(ctx, world, state) {
  if (state.banner <= 0) return;
  const age = 2.5 - state.banner;
  const drop = Math.min(1, age / 0.35);
  const ease = 1 - Math.pow(1 - drop, 3);
  const y = 30 + (1 - ease) * -24;
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.banner * 1.5, drop * 2);
  ctx.font = font(15, true);
  const w = ctx.measureText(world.map.name).width + 40;
  const x = 320 - w / 2;
  const th = THEMES.lavender;
  // Ribbon tails.
  ctx.fillStyle = th.dark;
  for (const sd of [-1, 1]) {
    const ex = sd < 0 ? x : x + w;
    ctx.beginPath();
    ctx.moveTo(ex, y + 4);
    ctx.lineTo(ex + sd * 14, y + 4);
    ctx.lineTo(ex + sd * 8, y + 12);
    ctx.lineTo(ex + sd * 14, y + 20);
    ctx.lineTo(ex, y + 20);
    ctx.fill();
  }
  box(ctx, x, y, w, 22, { fill: th.main, edge: '#ffffff', r: 11, width: 2 });
  text(ctx, world.map.name, 320, y + 16, { size: 15, bold: true, align: 'center', color: '#ffffff', outline: th.ink });
  sparkle(ctx, x + 10, y + 11, 3 + Math.sin(world.now * 4), '#ffffff');
  sparkle(ctx, x + w - 10, y + 11, 3 + Math.cos(world.now * 4), '#ffffff');
  ctx.restore();
}

// ---------- Dungeon ----------

// The run at the top right: the dungeon, this room, what's left to do, and the clock.
function drawDungeonTracker(ui, world) {
  const { ctx } = ui;
  const run = world.dungeon;
  const def = DUNGEONS[run.id];
  const th = THEMES.mint;
  const w = 138;
  const x = 640 - w - 6;
  const y = 6;
  const rows = [];
  const bosses = world.mobs.filter((m) => m.def.boss && m.hp > 0);
  const left = world.mobs.filter((m) => m.hp > 0 && !m.def.boss && !m.add).length;
  if (bosses.length) rows.push({ label: `Defeat ${bosses[0].def.name}`, done: false });
  else if (left) rows.push({ label: `Clear the room (${left} left)`, done: false });
  const task = taskProgress(world);
  if (task) rows.push({ label: `${task.label} ${task.have}/${task.need}`, done: task.have >= task.need });
  if (run.room?.cleared) rows.push({ label: run.done ? 'Open the chest, then exit' : 'Head through the exit', done: false, next: true });
  const h = 30 + rows.length * 10;
  box(ctx, x, y, w, h, { fill: 'rgba(255,250,246,0.85)', edge: th.main, r: 8, width: 1.2 });
  box(ctx, x + 2, y + 2, w - 4, 11, { fill: th.main, edge: null, r: 5.5 });
  text(ctx, def.name, x + 8, y + 10.5, { size: 7, bold: true, color: '#ffffff', outline: th.ink });
  text(ctx, clock(world.now - run.start), x + w - 7, y + 10.5, { size: 7, bold: true, align: 'right', color: '#ffffff', outline: th.ink });
  const n = def.rooms.indexOf(world.map.id) + 1;
  text(ctx, `${n}/${def.rooms.length}  ${world.map.name}`, x + 6, y + 22, { size: 7, bold: true, color: COLORS.ink });
  rows.forEach((r, i) => text(ctx, `${r.done ? '✓' : r.next ? '➜' : '•'} ${r.label}`, x + 8, y + 32 + i * 10, { size: 6.5, color: r.done ? COLORS.good : r.next ? th.dark : COLORS.muted, bold: r.next }));
  if (run.wipes) text(ctx, `Wipes: ${run.wipes}`, x + w - 6, y + 22, { size: 6, align: 'right', color: COLORS.bad });
}

// Boss moves and milestones, called out big across the middle of the screen.
function drawCallout(ctx, world) {
  const c = world.dungeon.callout;
  if (!c) return;
  const age = 2.6 - c.t;
  const k = Math.min(1, age / 0.18);
  ctx.save();
  ctx.globalAlpha = Math.min(1, c.t * 2);
  const size = 16 * (1 + (1 - k) * 0.4);
  text(ctx, c.title, 320, 112, { size, bold: true, align: 'center', color: '#ffffff', outline: '#8f3f6f' });
  if (c.sub) text(ctx, c.sub, 320, 126, { size: 8, bold: true, align: 'center', color: '#fff3c9', outline: '#5a3f7a' });
  ctx.restore();
}

// ---------- Tutorial ----------

// The tutorial's hint (world/tutorial.js): a pastel card at the top of the screen with the
// lesson's number and what to do, keys drawn as little keycaps; it pops in fresh for each lesson.
function drawTutorial(ui, world) {
  const lesson = currentLesson(world.char);
  if (!lesson) return;
  const { ctx } = ui;
  // On a phone, the hint for the touch controls.
  const hint = ui.input?.touch && lesson.phone ? lesson.phone : lesson.hint;
  const parts = hint.split(/(\[[^\]]+\])/).filter(Boolean);
  const size = 8.5;
  ctx.font = font(size, true);
  const widths = parts.map((p) => (p.startsWith('[') ? ctx.measureText(p.slice(1, -1)).width + 10 : ctx.measureText(p).width));
  const w = Math.min(600, widths.reduce((a, b) => a + b, 0) + 92);
  const h = 24;
  const x = 320 - w / 2;
  const age = world.now - (world.char.tutorial.at ?? -9);
  const pop = age < 0.25 ? 1 + 0.12 * Math.sin((age / 0.25) * Math.PI) : 1;
  const y = 54;
  ctx.save();
  ctx.translate(320, y + h / 2);
  ctx.scale(pop, pop);
  ctx.translate(-320, -(y + h / 2));
  softShadow(ctx, x, y, w, h, h / 2, 3);
  box(ctx, x, y, w, h, { fill: 'rgba(255,250,248,0.97)', edge: '#f4bcd8', r: h / 2, width: 2 });
  // The lesson's number, in a pink bubble.
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.arc(x + 14, y + h / 2, 9, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, `${lesson.step + 1}`, x + 14, y + h / 2 + 3, { size: 8, bold: true, align: 'center', color: '#ffffff' });
  text(ctx, `/${lesson.of}`, x + 26, y + h / 2 + 3, { size: 6.5, bold: true, color: COLORS.muted });
  let cx = x + 44;
  parts.forEach((p, i) => {
    if (p.startsWith('[')) {
      const k = p.slice(1, -1);
      box(ctx, cx, y + 5, widths[i] - 2, 14, { fill: '#ffffff', edge: COLORS.panelEdge, r: 4, width: 1.2 });
      box(ctx, cx, y + 16, widths[i] - 2, 3, { fill: 'rgba(180,140,255,0.25)', edge: null, r: 1.5 });
      text(ctx, k, cx + (widths[i] - 2) / 2, y + 15, { size: 7.5, bold: true, align: 'center', color: COLORS.ink });
    } else text(ctx, p, cx, y + 15.5, { size, bold: true, color: COLORS.ink });
    cx += widths[i];
  });
  // Skip this lesson.
  const sx = x + w - 34;
  const hot = hover(ui, sx, y + 5, 28, 14);
  box(ctx, sx, y + 5, 28, 14, { fill: hot ? '#ffffff' : '#fdeef6', edge: '#f4bcd8', r: 7, width: 1 });
  text(ctx, 'Skip', sx + 14, y + 15, { size: 6.5, bold: true, align: 'center', color: hot ? COLORS.accent : COLORS.muted });
  ctx.restore();
  if (clicked(ui, sx, y + 5, 28, 14)) skipLesson(world);
}
