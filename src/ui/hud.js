// Always-on HUD: status bar, hotkeys, minimap, buffs, quest tracker, message log, map banner.

import { SKILLS, skillAt } from '../data/skills.js';
import { JOBS } from '../data/jobs.js';
import { expToNext } from '../core/exp.js';
import { countItem, activeStar } from '../core/inventory.js';
import { HOTKEYS } from '../core/character.js';
import { drawItemIcon, drawSkillIcon } from '../render/icons.js';
import { COLORS, THEMES, softShadow, text, box, bar, hover, clicked, tooltip, icon, sparkle, font, roundRect, lighten, darken } from './kit.js';
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
import { questMarker } from './npc.js';
import { drawQuestTracker } from './quests.js';
import { THEMES as SCENE_THEMES } from '../render/scenery.js';

const KEY_LABEL = (code) => code.replace('Key', '').replace('Digit', '');
const LAV = THEMES.lavender;
// The HUD floats over the world as three soft pastel trays instead of one strip across the
// bottom: you (portrait, bars, EXP, gold) on the left, the menu buttons in the middle, and the
// hotkeys on the right as round candy buttons.
const TRAY_Y = 322;
const TRAY_H = 34;
const MENU_X = 226;
const MENU_STEP = 19;
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
  };
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

  bar(ctx, 56 + hp.shake, TRAY_Y + 13, 112, 8, hpR, low ? (beat > 0.5 ? '#ff4f6b' : COLORS.hp) : COLORS.hp, `${char.hp} / ${s.maxHp}`, { size: 6, trail: hp.trail, trailColor: '#ffd3dc', flash: hp.flash, shine: hp.shine, pulse: low ? 0.25 + 0.5 * beat : 0 });
  bar(ctx, 56, TRAY_Y + 23, 112, 8, char.mp / s.maxMp, COLORS.mp, `${char.mp} / ${s.maxMp}`, { size: 6, trail: mp.trail, trailColor: '#d6ebff', flash: mp.flash, shine: mp.shine });
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
  const menus = [['Bag', 'bag', 'I', 'bag', 'peach'], ['Stats', 'stats', 'C', 'star', 'pink'], ['Skills', 'skills', 'K', 'book', 'lavender'], ['Quests', 'quests', 'L', 'scroll', 'mint'], ['World Map', 'worldmap', 'M', 'map', 'sky'], ['Cash Shop', 'cashshop', 'O', 'gift', 'pink'], ['Options', 'options', 'Esc', 'gear', 'gold']];
  tray(ctx, MENU_X, menus.length * MENU_STEP + 9);
  menus.forEach(([label, key, hotkey, ic, theme], i) => {
    const cx = MENU_X + 14 + i * MENU_STEP;
    const cy = TRAY_Y + TRAY_H / 2 - 1;
    const th = THEMES[theme];
    const hot = hover(ui, cx - 9, cy - 9, 18, 18);
    const open = state.windows[key].open;
    // Lifts under the mouse and sinks onto its lip the moment it's pressed.
    const lift = hot && ui.mouse.down ? 1.5 : hot ? -1.5 : 0;
    const k = key === 'bag' ? bump(hud.bagAt) : 1;
    ctx.fillStyle = th.dark;
    ctx.beginPath();
    ctx.arc(cx, cy + 1.5, 8.2 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = open ? th.main : hot ? '#ffffff' : th.light;
    ctx.beginPath();
    ctx.arc(cx, cy + lift, 8.2 * k, 0, Math.PI * 2);
    ctx.fill();
    // A gloss along the top of the bubble.
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(cx - 1.5, cy + lift - 4, 4, 2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = th.dark;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy + lift, 8.2 * k, 0, Math.PI * 2);
    ctx.stroke();
    icon(ctx, ic, cx, cy + lift, 9.5 * k, open ? '#ffffff' : th.dark);
    if (hot) tooltip(ui, [{ text: label, bold: true, color: th.dark }, { text: `Hotkey: ${hotkey}`, size: 8, color: COLORS.muted }]);
    if (clicked(ui, cx - 9, cy - 9, 18, 18)) state.windows[key].open = !open;
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
  if (s.weaponType === 'gauntlet') drawStars(ui, world);
  const gauge = gaugeOf(char);
  if (gauge) drawGauge(ui, world, gauge, world[gauge] ?? 0);
  if (settings.minimap) drawMinimap(ui, world);
  drawBuffs(ui, world);
  if (world.dungeon) {
    drawDungeonTracker(ui, world);
    drawCallout(ctx, world);
  } else if (settings.questTracker) drawQuestTracker(ui, state, world);
  if (settings.messageLog || state.chat?.typing != null) drawLog(ui, world, state);
  if (settings.mapBanner) drawBanner(ctx, world, state);
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
    const ex = MENU_X + 14;
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

// The throwing stars a gauntlet is throwing, and how many are left in the set.
function drawStars(ui, world) {
  const { ctx } = ui;
  const char = world.char;
  const set = activeStar(char);
  const x = 584;
  const y = TRAY_Y - 22;
  const low = !set || set.qty < 50;
  box(ctx, x, y, 52, 16, { fill: 'rgba(255,250,248,0.94)', edge: low && Math.sin(world.now * 8) > 0 ? COLORS.bad : '#f4bcd8', r: 8, width: 1.5 });
  if (set) drawItemIcon(ctx, set.id, x + 2, y);
  text(ctx, set ? `${set.qty}` : 'No stars', set ? x + 48 : x + 26, y + 11, { size: set ? 8 : 7, bold: true, align: set ? 'right' : 'center', color: low ? COLORS.bad : COLORS.ink });
  if (hover(ui, x, y, 52, 16)) tooltip(ui, set ? itemTooltip(char, set.id) : [{ text: 'No throwing stars', bold: true, color: COLORS.bad }, { text: 'Shops sell them by the set.', size: 8, color: COLORS.muted }]);
}

// A job's gauge over the hotkeys: a Warrior's Valor (a shield), an Archer's Momentum (a feather), a
// Berserker's Rage (a flame), a Paladin's Faith (a star) a Beastmaster's Bond (Snow wolf's Patience, a moon) or a Stormcaller's Charge (a bolt). It fills as blows land, with a notch where Rampage opens up; full, it burns bright, pulses,
// names the state (BERSERK, SANCTIFIED), and tints the edges of the screen.
const GAUGES = {
  valor: { color: '#4f7fe0', hot: '#9fd2ff', icon: 'shield', name: 'Valor', full: 'UNBROKEN', notch: () => null, edge: 'rgba(110,160,255,', ink: '#24307a',
    tip: 'Your blows build it, faster the more monsters one blow hits; it drains once the fighting stops. Full, your blows land heavier and nothing knocks you back, and Titan Breaker is ready.' },
  momentum: { color: '#e8962a', hot: '#7fcfff', icon: 'feather', name: 'Momentum', full: 'HAWKEYE', notch: () => null, edge: 'rgba(255,200,90,', ink: '#8a4a1a',
    tip: 'Your shots build it, more for each one landed in a row; taking a hit knocks half of it away. Full, your arrows fly faster and curve to find monsters, and Falcon Dive is ready.' },
  grace: { color: '#d8352c', hot: '#ffd36a', icon: 'torii', name: 'Grace', full: 'DIVINE GRACE', notch: () => null, edge: 'rgba(255,214,140,', ink: '#7a1a14',
    tip: 'Your heals and wards build it, more for every ally they reach (your spells that land, a little); it fades once the fighting stops. Full, every heal you give also wards whoever it mends, and Thousand Torii is ready.' },
  binding: { color: '#3a2e8a', hot: '#ff3a46', icon: 'seiman', name: 'Binding', full: 'ALL BOUND', notch: () => null, edge: 'rgba(255,70,80,', ink: '#1a1440',
    tip: 'How tightly you hold your yokai troupe. Your spells that land build it, and so does every blow your troupe lands; it fades once the fighting stops. Full, your troupe fights faster, and Troupe Combo is ready.' },
  spirit: { color: '#9a8cd0', hot: '#ffd36a', icon: 'shide', name: 'Spirit', full: "KAMI'S FAVOUR", notch: () => null, edge: 'rgba(230,220,255,', ink: '#3a2e70',
    tip: 'Your spells that land and your heals build it, half again when you turn from one to the other; it fades once the fighting stops. Full, every damage spell also mends allies near where it lands, and your finisher is ready.' },
  ki: { color: '#2a2230', hot: '#ff5a46', icon: 'seal', name: 'Ki', full: 'SHADOW CLONES', notch: () => null, edge: 'rgba(200,30,40,', ink: '#14101a',
    tip: 'Your hits build it, and so does every blow you dodge (and Smoke Bomb and Log Swap); it fades once the fighting stops. Full, two ink clones of you repeat every attack, and Thousand Cuts is ready.' },
  tails: { color: '#2f6cf0', hot: '#ffd36a', icon: 'foxtail', name: 'Tails', full: 'NINE TAILS', notch: () => null, ticks: 9, label: (v) => `${Math.min(9, Math.floor((v * 9) / 100 + 1e-9))}/9`, edge: 'rgba(60,120,255,', ink: '#0c1a6a',
    tip: 'One fox-fire tail to nine. Your stars that land grow it, more on monsters already burning; it fades once the fighting stops. Every three tails, a fox-fire illusion throws a star beside each of yours; with all nine, three of them, and Nine-Tail Blaze is ready.' },
  shadow: { color: '#7a52e0', hot: '#d2cff0', icon: 'moon', name: 'Shadow', full: 'PHANTOM', notch: () => null, edge: 'rgba(90,60,200,', ink: '#2a1a6a',
    tip: 'Your hits build it, faster when they land in a quick chain; it fades fast once the fighting stops. Full, a shadow copy of you repeats every attack, and your finisher is ready.' },
  rage: { color: '#c0102e', hot: '#ff6a3a', icon: 'flame', name: 'Rage', full: 'BERSERK', notch: () => SKILLS.rampage?.rageCost ?? 30,
    tip: 'Your blows build it and it drains once the fighting stops. The fuller it is, the harder you hit. Rampage spends it all; full, it powers Crimson Eclipse.' },
  faith: { color: '#e8b02a', hot: '#ffe36b', icon: 'star', name: 'Faith', full: 'SANCTIFIED', notch: () => null,
    tip: 'Your blows and the hits you take build it; it drains once the fighting stops. The fuller it is, the less damage you take; full, it powers Grand Verdict.' },
  bond: { color: '#6f8fe0', hot: '#d6e8ff', icon: 'moon', name: 'Patience', full: 'FED UP', notch: () => null, edge: 'rgba(170,200,255,', ink: '#2a3a7a',
    tip: 'Snow wolf\'s patience running out: your shots and her hits wear it down, and it recovers once the fighting stops. Gone, she\'s Fed Up and fights on her own, and Last Straw is ready.' },
  charge: { color: '#7a5ce8', hot: '#e2d2ff', icon: 'bolt', name: 'Charge', full: 'SUPERCHARGED', notch: () => null, edge: 'rgba(160,120,255,', ink: '#2a3394',
    tip: 'Your bolts that land build it, and so does every monster your lightning jumps to; it fades once the fighting stops. Full, every bolt jumps on to one more monster, and Thunderhead is ready.' },
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
      text(ctx, 'FINISHER READY', x + 35, y - 13, { size: 8, bold: true, align: 'center', color: beat > 0.5 ? '#ffe36b' : '#ffffff', outline: '#c8243a' });
    }
  }
  if (hover(ui, x, y, 70, 16)) tooltip(ui, [{ text: G.name, bold: true, color: G.color }, { text: G.tip, size: 8, color: COLORS.muted }]);
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

// The hit counter, on the right: the count pops each time it climbs, takes a warmer colour and a
// word at each tier, and fades as the combo is about to drop. Once it's long enough for a finisher
// you know, it says so.
const HIT_TIERS = [
  [100, '#ff5ab4', 'LEGENDARY!'],
  [50, '#ff8a3c', 'AWESOME!'],
  [25, '#ffc83c', 'GREAT!'],
  [10, '#6fd0ff', 'NICE!'],
  [0, '#ffffff', ''],
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
  const [, color, word] = HIT_TIERS.find(([min]) => n >= min);
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
  if (word) text(ctx, word, x, y + 22, { size: 9, bold: true, align: 'right', color, outline: '#4a3560' });
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
  const w = 128;
  const scale = w / map.width;
  const h = Math.max(24, Math.round(map.height * scale));
  const x = 8;
  const y = 20;
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
  for (const [tx, ty] of line) ctx.lineTo(x + tx * scale, y + ty * scale);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = land;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  line.forEach(([tx, ty], i) => (i ? ctx.lineTo(x + tx * scale, y + ty * scale) : ctx.moveTo(x + tx * scale, y + ty * scale)));
  ctx.stroke();
  // Footholds as solid ledges, ropes as thin lines.
  ctx.fillStyle = edge;
  for (const p of map.platforms) ctx.fillRect(x + p.x * scale, y + p.y * scale - 0.5, Math.max(1, p.w * scale), 2);
  ctx.fillStyle = '#b8875a';
  for (const r of map.ropes) ctx.fillRect(x + r.x * scale - 0.5, y + r.top * scale, 1, (r.bottom - r.top) * scale);
  // Portals as little violet arches.
  for (const p of map.portals) {
    if (p.hidden) continue;
    const px = x + p.x * scale;
    const py = y + p.y * scale;
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
    const ny = y + groundAt(map, n.x) * scale - 2.5;
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
  for (const m of world.mobs) if (m.hp > 0) ctx.fillRect(x + m.x * scale - 0.75, y + m.y * scale - 1.5, 1.5, 1.5);
  // Party members, out hunting on their own, in their playstyle's color.
  for (const b of partyMembers(world.bots)) {
    if (!b.body || b.map !== map.id) continue;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + b.body.x * scale, y + b.body.y * scale - 2, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PLAYSTYLES[b.ai?.kind]?.color ?? '#3fc48a';
    ctx.beginPath();
    ctx.arc(x + b.body.x * scale, y + b.body.y * scale - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // You: a pink arrow pointing the way you face, with a ring pulsing out from it.
  const px = x + world.body.x * scale;
  const py = y + world.body.y * scale - 3;
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
    drawSkillIcon(ctx, id, x + 1, y + 1);
    ctx.restore();
    ctx.strokeStyle = left < 5 && Math.sin(world.now * 10) > 0 ? COLORS.bad : COLORS.select;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 9, y + 9, 9.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();
    text(ctx, `${Math.ceil(left)}`, x + 9, y + 26, { size: 6.5, bold: true, align: 'center', color: '#ffffff', outline: COLORS.ink });
    if (hover(ui, x, y, 18, 18)) tooltip(ui, [{ text: SKILLS[id].name, bold: true }, { text: `${Math.ceil(left)}s left`, color: COLORS.muted }]);
  });
}

// The message log: each line on its own soft pill so it reads over any background.
function drawLog(ui, world, state) {
  const { ctx } = ui;
  const msgs = world.messages;
  // While chatting the log sits above the chat bar and shows in full.
  const typing = state.chat?.typing != null;
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
