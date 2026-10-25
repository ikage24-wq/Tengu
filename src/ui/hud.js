// Always-on HUD: status bar, hotkeys, minimap, buffs, quest tracker, message log, map banner.

import { SKILLS, skillAt } from '../data/skills.js';
import { ITEMS } from '../data/items.js';
import { JOBS } from '../data/jobs.js';
import { QUESTS } from '../data/quests.js';
import { MOBS } from '../data/mobs.js';
import { expToNext } from '../core/exp.js';
import { countItem } from '../core/inventory.js';
import { HOTKEYS } from '../core/character.js';
import { questState, objectiveProgress } from '../core/quests.js';
import { drawItemIcon, drawSkillIcon } from '../render/icons.js';
import { COLORS, THEMES, softShadow, text, box, bar, hover, clicked, tooltip, icon, sparkle } from './kit.js';
import { drawHero } from '../render/hero.js';
import { settings } from '../core/settings.js';
import { partyMembers, PLAYSTYLES } from '../world/party.js';
import { price } from '../world/chatter.js';
import { itemTooltip, skillTooltip } from './tooltips.js';
import { DUNGEONS, PROVOKE } from '../data/dungeons.js';
import { taskProgress, clock } from '../world/dungeon.js';

const BAR_Y = 330;
const KEY_LABEL = (code) => code.replace('Key', '').replace('Digit', '');
const LAV = THEMES.lavender;

// Smoothly trailing values for the HP/MP "just lost" trail.
function trailOf(state, key, value) {
  const hud = (state.hud ??= {});
  const prev = hud[key] ?? value;
  hud[key] = value > prev ? value : prev + (value - prev) * 0.04;
  return hud[key];
}

export function drawHud(ui, state, world) {
  const { ctx } = ui;
  const char = world.char;
  const s = world.stats;
  const t = world.now;

  // ----- Bottom bar: a cream ribbon with a scalloped top edge -----
  ctx.save();
  const g = ctx.createLinearGradient(0, BAR_Y, 0, 360);
  g.addColorStop(0, '#fffaf6');
  g.addColorStop(1, '#f3e8ff');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.lineTo(0, BAR_Y + 2);
  for (let x = 0; x < 640; x += 10) ctx.arc(x + 5, BAR_Y + 2, 5, Math.PI, 0);
  ctx.lineTo(640, 360);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // EXP: a thin strip running along the whole top of the bar.
  const need = expToNext(char.level);
  const pct = Number.isFinite(need) ? char.exp / need : 1;
  ctx.fillStyle = 'rgba(74,53,96,0.18)';
  ctx.fillRect(0, BAR_Y + 3, 640, 3);
  const eg = ctx.createLinearGradient(0, 0, 640, 0);
  eg.addColorStop(0, '#ffe98a');
  eg.addColorStop(1, '#ffc94f');
  ctx.fillStyle = eg;
  ctx.fillRect(0, BAR_Y + 3, 640 * pct, 3);
  if (pct > 0 && pct < 1) {
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5);
    sparkle(ctx, 640 * pct, BAR_Y + 4.5, 3, '#ffffff');
    ctx.globalAlpha = 1;
  }
  if (hover(ui, 0, BAR_Y, 640, 7)) tooltip(ui, [{ text: 'Experience', bold: true, color: COLORS.gold }, { text: Number.isFinite(need) ? `${char.exp.toLocaleString()} / ${need.toLocaleString()} (${(pct * 100).toFixed(1)}%)` : 'Max level', size: 8 }]);

  drawPortrait(ctx, char, world);
  text(ctx, char.name, 44, BAR_Y + 17, { size: 9, bold: true });
  text(ctx, JOBS[char.job].name, 44, BAR_Y + 27, { size: 7, color: COLORS.muted });

  // HP and MP capsules with a heart and a drop.
  const hpT = trailOf(state, 'hp', char.hp / s.maxHp);
  const mpT = trailOf(state, 'mp', char.mp / s.maxMp);
  const low = char.hp / s.maxHp < 0.25;
  bar(ctx, 106, BAR_Y + 9, 110, 9, char.hp / s.maxHp, low ? (Math.sin(t * 10) > 0 ? '#ff4f6b' : COLORS.hp) : COLORS.hp, `${char.hp} / ${s.maxHp}`, { trail: hpT });
  bar(ctx, 106, BAR_Y + 20, 110, 9, char.mp / s.maxMp, COLORS.mp, `${char.mp} / ${s.maxMp}`, { trail: mpT });
  badge(ctx, 104, BAR_Y + 13.5, 'heart', COLORS.hp, low ? 1 + Math.abs(Math.sin(t * 8)) * 0.25 : 1);
  badge(ctx, 104, BAR_Y + 24.5, 'drop', COLORS.mp, 1);

  // EXP percent and gold.
  text(ctx, Number.isFinite(need) ? `EXP ${(pct * 100).toFixed(1)}%` : 'MAX LEVEL', 226, BAR_Y + 17, { size: 7, bold: true, color: '#c99a1f' });
  icon(ctx, 'coin', 230, BAR_Y + 24.5, 8, '#f0b53a');
  // Big fortunes shorten (1.2m) so they never run into the menu buttons.
  text(ctx, char.gold >= 100000 ? price(char.gold) : char.gold.toLocaleString(), 237, BAR_Y + 27.5, { size: 8, bold: true, color: COLORS.gold });
  if (hover(ui, 226, BAR_Y + 19, 44, 11)) tooltip(ui, [{ text: `${char.gold.toLocaleString()} gold`, bold: true, color: COLORS.gold }]);

  // Menu buttons: round candy buttons with icons, a dot when there are points to spend.
  const menus = [['Bag', 'bag', 'I', 'bag', 'peach'], ['Stats', 'stats', 'C', 'star', 'pink'], ['Skills', 'skills', 'K', 'book', 'lavender'], ['Quests', 'quests', 'L', 'scroll', 'mint'], ['World Map', 'worldmap', 'M', 'map', 'sky'], ['Cash Shop', 'cashshop', 'O', 'gift', 'pink'], ['Options', 'options', 'Esc', 'gear', 'gold']];
  menus.forEach(([label, key, hotkey, ic, theme], i) => {
    const cx = 277 + i * 18.6;
    const cy = BAR_Y + 18;
    const th = THEMES[theme];
    const hot = hover(ui, cx - 9, cy - 9, 18, 18);
    const open = state.windows[key].open;
    const lift = hot ? -1.5 : 0;
    ctx.fillStyle = th.dark;
    ctx.beginPath();
    ctx.arc(cx, cy + 1.5, 8.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = open ? th.main : hot ? '#ffffff' : th.light;
    ctx.beginPath();
    ctx.arc(cx, cy + lift, 8.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = th.dark;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    icon(ctx, ic, cx, cy + lift, 10, open ? '#ffffff' : th.dark);
    if (hot) tooltip(ui, [{ text: label, bold: true, color: th.dark }, { text: `Hotkey: ${hotkey}`, size: 8, color: COLORS.muted }]);
    if (clicked(ui, cx - 9, cy - 9, 18, 18)) state.windows[key].open = !open;
    const alert = (key === 'stats' && char.ap > 0) || (key === 'skills' && char.sp > 0);
    if (alert) {
      ctx.fillStyle = COLORS.bad;
      ctx.beginPath();
      ctx.arc(cx + 7, cy - 7 + lift, 3 + Math.sin(t * 6) * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  // Hotkeys: little keycaps with a lip, the key printed in a corner tab.
  HOTKEYS.forEach((code, i) => {
    const x = 400 + i * 19.6;
    const y = BAR_Y + 9;
    const b = char.hotkeys[code];
    const hot = hover(ui, x, y, 18, 18);
    box(ctx, x, y + 1.5, 18, 18, { fill: '#dccbee', edge: null, r: 5 });
    box(ctx, x, y, 18, 18, { fill: hot ? '#ffffff' : '#fffdfb', edge: b ? LAV.main : '#e2d3f0', r: 5, width: 1.2 });
    if (b?.skill) {
      drawSkillIcon(ctx, b.skill, x + 1, y + 1);
      const lv = char.skills[b.skill] ?? 0;
      const noMp = lv && SKILLS[b.skill].type !== 'passive' && char.mp < skillAt(b.skill, lv).mp;
      if (noMp) {
        ctx.fillStyle = 'rgba(111,184,255,0.5)';
        ctx.fillRect(x + 1, y + 1, 16, 16);
      }
      if (hot) tooltip(ui, skillTooltip(char, b.skill));
    } else if (b?.item) {
      const n = countItem(char.inventory, b.item);
      ctx.globalAlpha = n ? 1 : 0.35;
      drawItemIcon(ctx, b.item, x + 1, y + 1);
      ctx.globalAlpha = 1;
      text(ctx, `${n}`, x + 17, y + 17, { size: 6, bold: true, align: 'right', color: '#ffffff', outline: COLORS.ink });
      if (hot) tooltip(ui, itemTooltip(char, b.item));
    }
    box(ctx, x - 1, y - 2, 8, 7, { fill: LAV.main, edge: null, r: 3 });
    text(ctx, KEY_LABEL(code), x + 3, y + 3.5, { size: 5.5, bold: true, align: 'center', color: '#ffffff' });
    if (b && ui.mouse.right && hot) {
      delete char.hotkeys[code];
      ui.used = true;
    }
    clicked(ui, x, y, 18, 18);
  });

  if (settings.minimap) drawMinimap(ui, world);
  drawBuffs(ui, world);
  if (world.dungeon) {
    drawDungeonTracker(ui, world);
    drawProvoke(ui, world);
    drawCallout(ctx, world);
  } else if (settings.questTracker) drawTracker(ui, world);
  if (settings.messageLog || state.chat?.typing != null) drawLog(ui, world, state);
  if (settings.mapBanner) drawBanner(ctx, world, state);
  if (settings.showFps) drawFps(ctx, state);
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

// The hero's face in a round medallion with a level ribbon.
function drawPortrait(ctx, char, world) {
  const cx = 22;
  const cy = BAR_Y + 6;
  const r = 15;
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
  bg.addColorStop(0, '#fff3fa');
  bg.addColorStop(1, '#ffc2df');
  ctx.fillStyle = bg;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  drawHero(ctx, char.appearance, null, cx, cy + 27, { pose: 'idle', time: world.now, scale: 1.25, facing: 1 });
  ctx.restore();
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  box(ctx, cx - 14, cy + 12, 28, 11, { fill: COLORS.accent, edge: '#ffffff', r: 5.5, width: 1.5 });
  text(ctx, `Lv ${char.level}`, cx, cy + 20.5, { size: 7, bold: true, align: 'center', color: '#ffffff', outline: '#c95a8f' });
}

const SKY = THEMES.sky;

function drawMinimap(ui, world) {
  const { ctx } = ui;
  const map = world.map;
  const w = 128;
  const scale = w / map.width;
  const h = Math.max(24, Math.round(map.height * scale));
  const x = 8;
  const y = 20;
  softShadow(ctx, x - 3, y - 15, w + 6, h + 18, 8, 2);
  box(ctx, x - 3, y - 15, w + 6, h + 18, { fill: 'rgba(255,250,246,0.9)', edge: SKY.dark, r: 8, width: 1.5 });
  box(ctx, x - 1, y - 13, w + 2, 11, { fill: SKY.main, edge: null, r: 5.5 });
  icon(ctx, 'map', x + 6, y - 7.5, 8, '#ffffff');
  text(ctx, map.name, x + 13, y - 4.5, { size: 7.5, bold: true, color: '#ffffff', outline: SKY.ink });
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#e6f2ff');
  sky.addColorStop(1, '#f6e8ff');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#b9e3b0';
  ctx.fillRect(x, y + map.groundY * scale, w, Math.max(1, h - map.groundY * scale));
  ctx.fillStyle = '#8fcf86';
  ctx.fillRect(x, y + map.groundY * scale, w, 1);
  ctx.fillStyle = '#c9a6e8';
  for (const p of map.platforms) ctx.fillRect(x + p.x * scale, y + p.y * scale, Math.max(1, p.w * scale), 1.5);
  ctx.fillStyle = '#c99a6b';
  for (const r of map.ropes) ctx.fillRect(x + r.x * scale, y + r.top * scale, 1, (r.bottom - r.top) * scale);
  for (const p of map.portals) {
    if (p.hidden) continue;
    ctx.fillStyle = '#9b6cff';
    ctx.beginPath();
    ctx.ellipse(x + p.x * scale, y + p.y * scale - 2.5, 1.8, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const n of map.npcs) {
    ctx.fillStyle = '#ffc94f';
    ctx.beginPath();
    ctx.arc(x + n.x * scale, y + map.groundY * scale - 2, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ff6b8a';
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
  const px = x + world.body.x * scale;
  const py = y + world.body.y * scale - 2;
  const pulse = (world.now * 1.5) % 1;
  ctx.strokeStyle = COLORS.accent;
  ctx.globalAlpha = 1 - pulse;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(px, py, 2 + pulse * 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(px, py, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.arc(px, py, 1.8, 0, Math.PI * 2);
  ctx.fill();
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

// Tracked quests: a small card in the corner with progress bars.
function drawTracker(ui, world) {
  const { ctx } = ui;
  const char = world.char;
  const active = Object.keys(QUESTS).filter((id) => ['active', 'ready'].includes(questState(char, id))).slice(0, 3);
  if (!active.length) return;
  const th = THEMES.mint;
  const w = 128;
  const x = 640 - w - 6;
  const rows = active.map((id) => ({ id, objs: objectiveProgress(char, id), ready: questState(char, id) === 'ready' }));
  const h = 16 + rows.reduce((n, r) => n + 12 + r.objs.length * 10, 0);
  const y = 6;
  box(ctx, x, y, w, h, { fill: 'rgba(255,250,246,0.82)', edge: th.main, r: 8, width: 1.2 });
  box(ctx, x + 2, y + 2, w - 4, 11, { fill: th.main, edge: null, r: 5.5 });
  icon(ctx, 'scroll', x + 9, y + 7.5, 8, '#ffffff');
  text(ctx, 'Quests', x + 16, y + 10.5, { size: 7, bold: true, color: '#ffffff', outline: th.ink });
  let ty = y + 24;
  for (const r of rows) {
    text(ctx, `${r.ready ? '✓ ' : ''}${QUESTS[r.id].name}`, x + 6, ty, { size: 7.5, bold: true, color: r.ready ? '#2f8f52' : COLORS.ink });
    for (const o of r.objs) {
      ty += 10;
      const name = o.type === 'kill' ? MOBS[o.mob].name : ITEMS[o.item].name;
      text(ctx, name, x + 9, ty, { size: 6.5, color: COLORS.muted });
      bar(ctx, x + w - 46, ty - 6, 40, 6, o.have / o.count, o.have >= o.count ? COLORS.good : th.main, `${o.have}/${o.count}`, { size: 5 });
    }
    ty += 12;
  }
}

// The message log: each line on its own soft pill so it reads over any background.
function drawLog(ui, world, state) {
  const { ctx } = ui;
  const msgs = world.messages;
  // While chatting the log sits above the chat bar and shows in full.
  const typing = state.chat?.typing != null;
  ctx.font = `bold 8px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
  msgs.forEach((m, i) => {
    const y = BAR_Y - (typing ? 26 : 8) - (msgs.length - 1 - i) * 12;
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
  ctx.font = `bold 15px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
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
  box(ctx, x, y, w, 22, { fill: th.main, edge: '#ffffff', r: 6, width: 2 });
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

// Tanks get a reminder of their Provoke key, just above the hotkeys.
function drawProvoke(ui, world) {
  if (world.dungeon.roles.you !== 'tank') return;
  const { ctx } = ui;
  const ok = world.char.mp >= PROVOKE.mp;
  box(ctx, 536, 312, 96, 13, { fill: ok ? 'rgba(90,168,255,0.9)' : 'rgba(150,160,190,0.8)', edge: '#ffffff', r: 6.5, width: 1 });
  roleIcon(ctx, 'tank', 545, 318.5, '#ffffff');
  text(ctx, `T  Provoke · ${PROVOKE.mp} MP`, 586, 321.5, { size: 6.5, bold: true, align: 'center', color: '#ffffff' });
}

// Shield for tanks, a cross for healers, a sword for damage.
function roleIcon(ctx, role, x, y, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (role === 'tank') {
    ctx.moveTo(x - 4, y - 4);
    ctx.lineTo(x + 4, y - 4);
    ctx.lineTo(x + 4, y);
    ctx.quadraticCurveTo(x + 4, y + 3, x, y + 5);
    ctx.quadraticCurveTo(x - 4, y + 3, x - 4, y);
    ctx.closePath();
  } else if (role === 'healer') {
    for (const [a, b, c, d] of [[-1.5, -4.5, 3, 9], [-4.5, -1.5, 9, 3]]) ctx.rect(x + a, y + b, c, d);
  } else {
    ctx.moveTo(x - 4, y + 4);
    ctx.lineTo(x + 3, y - 3);
    ctx.lineTo(x + 4.5, y - 4.5);
    ctx.lineTo(x + 3.5, y - 2);
    ctx.lineTo(x - 3, y + 5);
    ctx.closePath();
    ctx.rect(x - 4, y + 1, 3, 1.4);
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
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
