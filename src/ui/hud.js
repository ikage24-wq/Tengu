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
import { COLORS, text, box, bar, hover, clicked, tooltip, button } from './kit.js';
import { itemTooltip, skillTooltip } from './tooltips.js';

const BAR_Y = 330;
const KEY_LABEL = (code) => code.replace('Key', '').replace('Digit', '');

export function drawHud(ui, state, world) {
  const { ctx } = ui;
  const char = world.char;
  const s = world.stats;

  // ----- Bottom bar -----
  const g = ctx.createLinearGradient(0, BAR_Y, 0, 360);
  g.addColorStop(0, 'rgba(255,240,250,0.95)');
  g.addColorStop(1, 'rgba(240,226,255,0.97)');
  ctx.fillStyle = g;
  ctx.fillRect(0, BAR_Y, 640, 30);
  ctx.fillStyle = COLORS.panelEdge;
  ctx.fillRect(0, BAR_Y, 640, 1);

  // Level badge
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.arc(18, BAR_Y + 15, 12, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'Lv', 18, BAR_Y + 11, { size: 6, bold: true, align: 'center', color: '#ffffff' });
  text(ctx, `${char.level}`, 18, BAR_Y + 21, { size: 10, bold: true, align: 'center', color: '#ffffff' });
  text(ctx, char.name, 34, BAR_Y + 12, { size: 9, bold: true });
  text(ctx, JOBS[char.job].name, 34, BAR_Y + 23, { size: 8, color: COLORS.muted });

  bar(ctx, 100, BAR_Y + 4, 112, 10, char.hp / s.maxHp, COLORS.hp, `HP ${char.hp}/${s.maxHp}`);
  bar(ctx, 100, BAR_Y + 16, 112, 10, char.mp / s.maxMp, COLORS.mp, `MP ${char.mp}/${s.maxMp}`);
  const need = expToNext(char.level);
  const pct = Number.isFinite(need) ? char.exp / need : 1;
  bar(ctx, 218, BAR_Y + 4, 100, 10, pct, COLORS.exp, Number.isFinite(need) ? `EXP ${(pct * 100).toFixed(1)}%` : 'MAX LEVEL');
  text(ctx, `${char.gold.toLocaleString()}g`, 222, BAR_Y + 25, { size: 8, bold: true, color: COLORS.gold });

  // Menu buttons, with a dot when there are points to spend.
  const menus = [['Bag', 'bag', 'I'], ['Stat', 'stats', 'C'], ['Skill', 'skills', 'K'], ['Quest', 'quests', 'L'], ['Map', 'worldmap', 'M']];
  menus.forEach(([label, key, hotkey], i) => {
    const x = 262 + i * 25.6;
    if (button(ui, x, BAR_Y + 16, 24.6, 12, label, { size: 7 })) state.windows[key].open = !state.windows[key].open;
    if (hover(ui, x, BAR_Y + 16, 24.6, 12)) tooltip(ui, [{ text: `${label} (${hotkey})`, bold: true }]);
    const alert = (key === 'stats' && char.ap > 0) || (key === 'skills' && char.sp > 0);
    if (alert) {
      ctx.fillStyle = COLORS.bad;
      ctx.beginPath();
      ctx.arc(x + 23, BAR_Y + 17, 2.5 + Math.sin(world.now * 6) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Hotkeys
  HOTKEYS.forEach((code, i) => {
    const x = 392 + i * 20;
    const y = BAR_Y + 6;
    const b = char.hotkeys[code];
    box(ctx, x, y, 19, 19, { fill: '#fdf3fb', edge: COLORS.cellEdge, r: 4 });
    if (b?.skill) {
      drawSkillIcon(ctx, b.skill, x + 1.5, y + 1.5);
      const lv = char.skills[b.skill] ?? 0;
      const cdLeft = (world.cooldowns[b.skill] ?? 0) - world.now;
      const noMp = lv && SKILLS[b.skill].type !== 'passive' && char.mp < skillAt(b.skill, lv).mp;
      if (cdLeft > 0) {
        ctx.fillStyle = 'rgba(58,45,79,0.55)';
        ctx.fillRect(x + 1, y + 1, 17, 17 * Math.min(1, cdLeft / (SKILLS[b.skill].cooldown || 1)));
      } else if (noMp) {
        ctx.fillStyle = 'rgba(111,184,255,0.45)';
        ctx.fillRect(x + 1, y + 1, 17, 17);
      }
      if (hover(ui, x, y, 19, 19)) tooltip(ui, skillTooltip(char, b.skill));
    } else if (b?.item) {
      const n = countItem(char.inventory, b.item);
      ctx.globalAlpha = n ? 1 : 0.35;
      drawItemIcon(ctx, b.item, x + 1.5, y + 1.5);
      ctx.globalAlpha = 1;
      text(ctx, `${n}`, x + 18, y + 18, { size: 6, bold: true, align: 'right', color: '#ffffff', outline: COLORS.ink });
      if (hover(ui, x, y, 19, 19)) tooltip(ui, itemTooltip(char, b.item));
    }
    text(ctx, KEY_LABEL(code), x + 2, y + 7, { size: 6, bold: true, color: '#ffffff', outline: COLORS.ink });
    if (b && ui.mouse.right && hover(ui, x, y, 19, 19)) {
      delete char.hotkeys[code];
      ui.used = true;
    }
    clicked(ui, x, y, 19, 19);
  });

  drawMinimap(ui, world);
  drawBuffs(ui, world);
  drawTracker(ui, world);
  drawLog(ui, world, state);

  // Map name banner
  if (state.banner > 0) {
    ctx.globalAlpha = Math.min(1, state.banner);
    text(ctx, world.map.name, 320, 52, { size: 18, bold: true, align: 'center', color: '#ffffff', outline: '#b87ac9' });
    ctx.globalAlpha = 1;
  }
}

function drawMinimap(ui, world) {
  const { ctx } = ui;
  const map = world.map;
  const w = 128;
  const scale = w / map.width;
  const h = Math.max(24, Math.round(map.height * scale));
  const x = 6;
  const y = 16;
  box(ctx, x - 2, y - 13, w + 4, h + 16, { fill: 'rgba(255,247,252,0.85)', edge: COLORS.panelEdge, r: 6 });
  text(ctx, map.name, x + 2, y - 3, { size: 8, bold: true, color: COLORS.ink });
  ctx.fillStyle = '#e8dcf5';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#c9a6e8';
  ctx.fillRect(x, y + map.groundY * scale, w, Math.max(1, h - map.groundY * scale));
  for (const p of map.platforms) ctx.fillRect(x + p.x * scale, y + p.y * scale, Math.max(1, p.w * scale), 1.2);
  ctx.fillStyle = '#c99a6b';
  for (const r of map.ropes) ctx.fillRect(x + r.x * scale, y + r.top * scale, 1, (r.bottom - r.top) * scale);
  for (const p of map.portals) {
    if (p.hidden) continue;
    ctx.fillStyle = '#9b6cff';
    ctx.fillRect(x + p.x * scale - 1.5, y + p.y * scale - 4, 3, 4);
  }
  ctx.fillStyle = '#ffd66b';
  for (const n of map.npcs) ctx.fillRect(x + n.x * scale - 1, y + map.groundY * scale - 3, 2, 3);
  ctx.fillStyle = '#ff6b8a';
  for (const m of world.mobs) if (m.hp > 0) ctx.fillRect(x + m.x * scale - 0.5, y + m.y * scale - 1.5, 1, 1.5);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + world.body.x * scale - 2, y + world.body.y * scale - 4, 4, 4);
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(x + world.body.x * scale - 1.5, y + world.body.y * scale - 3.5, 3, 3);
}

function drawBuffs(ui, world) {
  const { ctx } = ui;
  const buffs = Object.entries(world.char.buffs);
  const map = world.map;
  const y = 16 + Math.max(24, Math.round(map.height * (128 / map.width))) + 8;
  buffs.forEach(([id, b], i) => {
    const x = 6 + i * 22;
    drawSkillIcon(ctx, id, x, y);
    const left = Math.max(0, Math.ceil(b.until - world.now));
    text(ctx, `${left}`, x + 8, y + 26, { size: 7, bold: true, align: 'center', color: '#ffffff', outline: COLORS.ink });
    if (hover(ui, x, y, 18, 18)) tooltip(ui, [{ text: SKILLS[id].name, bold: true }, { text: `${left}s left`, color: COLORS.muted }]);
  });
}

function drawTracker(ui, world) {
  const { ctx } = ui;
  const char = world.char;
  const active = Object.keys(QUESTS).filter((id) => ['active', 'ready'].includes(questState(char, id))).slice(0, 3);
  let y = 14;
  for (const id of active) {
    const ready = questState(char, id) === 'ready';
    text(ctx, `${ready ? '✓ ' : ''}${QUESTS[id].name}`, 632, y, { size: 8, bold: true, align: 'right', color: ready ? '#3f9f5f' : '#ffffff', outline: ready ? '#ffffff' : '#8f6cb0' });
    for (const o of objectiveProgress(char, id)) {
      y += 10;
      const name = o.type === 'kill' ? MOBS[o.mob].name : ITEMS[o.item].name;
      text(ctx, `${name} ${o.have}/${o.count}`, 632, y, { size: 7, align: 'right', color: '#ffffff', outline: '#8f6cb0' });
    }
    y += 13;
  }
}

function drawLog(ui, world) {
  const { ctx } = ui;
  const msgs = world.messages;
  msgs.forEach((m, i) => {
    const y = BAR_Y - 6 - (msgs.length - 1 - i) * 11;
    ctx.globalAlpha = Math.min(1, m.t);
    text(ctx, m.text, 6, y, { size: 8, bold: true, color: m.color, outline: 'rgba(58,45,79,0.85)' });
  });
  ctx.globalAlpha = 1;
}
