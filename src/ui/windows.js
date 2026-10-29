// The Stats window (the Bag lives in bag.js, Skills in skills.js, Quests in quests.js).

import { JOBS, FAMILY_STATS } from '../data/jobs.js';
import { expToNext } from '../core/exp.js';
import { physicalRange, magicRange, accuracy, avoid } from '../core/formulas.js';
import { spendAp, autoAssignAp, apPlan, STAT_KEYS, stats, wornGear } from '../core/character.js';
import { drawHero } from '../render/hero.js';
import { COLORS, windowFrame, button, text, box, bar, hover, tooltip, well, sparkle, roundRect, fit, font, darken } from './kit.js';

// ---------- Stats ----------

const STAT_COLORS = { str: '#ff7a6b', dex: '#3fc48a', int: '#5aa8ff', luk: '#f0b53a' };
const STAT_ABOUT = {
  str: 'Strength: attack for warriors and novices, and some defense.',
  dex: 'Dexterity: attack for archers, accuracy for everyone, a little avoid.',
  int: 'Intelligence: magic and MP for mages, and magic defense.',
  luk: 'Luck: attack for thieves, avoid, and a softer fall when you faint.',
};
const GREEN = '#2f9f58';

// Your combat numbers, worked out from a set of stats: [label, value, what it means].
function combatRows(char, s) {
  const phys = physicalRange(s, s.weaponType, 100);
  const mag = magicRange(s, 100);
  const family = JOBS[char.job].family;
  return [
    ['Attack', Math.round(phys.max), `${Math.round(phys.min)} ~ ${Math.round(phys.max)}`, 'Damage range of a basic hit.'],
    ['Magic', family === 'mage' ? Math.round(mag.max) : Math.floor(s.int / 2) + s.matk, family === 'mage' ? `${Math.round(mag.min)} ~ ${Math.round(mag.max)}` : `${Math.floor(s.int / 2) + s.matk}`, 'How hard spells and heals land.'],
    ['Defense', s.wdef, `${s.wdef}`, 'Cuts the damage of hits.'],
    ['M. Defense', s.mdef, `${s.mdef}`, 'Cuts the damage of magic.'],
    ['Accuracy', accuracy(family, s, char.level), `${accuracy(family, s, char.level)}`, 'Chance to hit, against higher-level monsters too.'],
    ['Avoid', avoid(s), `${avoid(s)}`, 'Chance to dodge a hit.'],
    ['Critical', Math.round((0.05 + s.critRate) * 100), `${Math.round((0.05 + s.critRate) * 100)}%`, 'Chance of a critical hit.'],
    ['Speed', s.speed, `${s.speed}%`, 'How fast you walk.'],
    ['Jump', s.jump, `${s.jump}%`, 'How high you jump.'],
  ];
}

// The Stats window (C): who you are on the left (portrait, level, EXP, HP and MP, then your four
// stats and the AP to spend on them, with your job's main stat marked), and what they add up to
// on the right. Hovering a stat's + previews what one more point there changes.
export function statsWindow(ui, state, world) {
  const win = state.windows.stats;
  const W = 272;
  const H = 228;
  if (!windowFrame(ui, win, W, H, 'Stats')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const s = world.stats;
  const job = JOBS[char.job];
  // A Novice's main stat follows the weapon in hand.
  const { primary, secondary } = apPlan(char);
  const x = win.x + 8;
  const lw = 132;

  // ---- Who you are ----
  well(ctx, x, win.y + 25, lw, 54, th);
  ctx.save();
  roundRect(ctx, x + 4, win.y + 29, 34, 46, 7);
  ctx.clip();
  ctx.fillStyle = th.light;
  ctx.fillRect(x + 4, win.y + 29, 34, 46);
  drawHero(ctx, char.appearance, wornGear(char), x + 21, win.y + 96, { pose: 'idle', time: world.now, scale: 1.3 });
  ctx.restore();
  text(ctx, fit(ctx, char.name, lw - 48, 10), x + 43, win.y + 39, { size: 10, bold: true, color: COLORS.ink });
  text(ctx, `Lv ${char.level} ${job.name}`, x + 43, win.y + 49, { size: 7, bold: true, color: th.dark });
  const need = expToNext(char.level);
  const pct = Number.isFinite(need) ? char.exp / need : 1;
  bar(ctx, x + 43, win.y + 53, lw - 48, 6, pct, COLORS.exp, null);
  text(ctx, Number.isFinite(need) ? `EXP ${(pct * 100).toFixed(1)}%` : 'MAX LEVEL', x + 43, win.y + 66, { size: 6.5, bold: true, color: '#c99a1f' });
  bar(ctx, x + 43, win.y + 68, (lw - 52) / 2, 7, char.hp / s.maxHp, COLORS.hp, null);
  bar(ctx, x + 43 + (lw - 52) / 2 + 4, win.y + 68, (lw - 52) / 2, 7, char.mp / s.maxMp, COLORS.mp, null);
  if (hover(ui, x + 43, win.y + 66, lw - 48, 10)) tooltip(ui, [{ text: `HP ${char.hp} / ${s.maxHp}`, bold: true, color: COLORS.hp }, { text: `MP ${char.mp} / ${s.maxMp}`, bold: true, color: COLORS.mp }]);
  if (hover(ui, x + 43, win.y + 52, lw - 48, 8)) tooltip(ui, [{ text: 'Experience', bold: true, color: COLORS.gold }, { text: Number.isFinite(need) ? `${char.exp.toLocaleString()} / ${need.toLocaleString()}` : 'Max level', size: 8 }]);

  // ---- Ability points ----
  let y = win.y + 86;
  // Unspent points glow and bounce a little to say "spend me".
  const bounce = char.ap ? Math.abs(Math.sin(world.now * 4)) * 1.5 : 0;
  box(ctx, x, y - bounce, 82, 15, { fill: char.ap ? th.main : COLORS.cell, edge: char.ap ? th.dark : null, r: 7.5 });
  text(ctx, `${char.ap} AP to spend`, x + 41, y + 10.5 - bounce, { size: 7.5, bold: true, align: 'center', color: char.ap ? '#ffffff' : COLORS.muted, outline: char.ap ? th.ink : null });
  if (char.ap) sparkle(ctx, x + 80, y - bounce, 2 + bounce, '#ffffff');
  if (button(ui, x + 86, y - 1, lw - 86, 16, 'Auto', { enabled: char.ap > 0, size: 7.5 })) autoAssignAp(char);
  if (hover(ui, x + 86, y - 1, lw - 86, 16)) tooltip(ui, [{ text: 'Auto-assign', bold: true }, { text: `Mostly ${primary.toUpperCase()}, with enough ${secondary.toUpperCase()} to keep hitting.`, size: 8, color: COLORS.muted }]);
  y += 20;
  let preview = null;
  for (const k of STAT_KEYS) {
    const main = k === primary;
    const hotRow = hover(ui, x, y, lw, 19);
    box(ctx, x, y, lw, 19, { fill: hotRow ? '#ffffff' : main ? '#fffaf0' : '#fffdfb', edge: main ? STAT_COLORS[k] : th.light, r: 7, width: main ? 1.5 : 1 });
    box(ctx, x + 2, y + 2, 30, 15, { fill: STAT_COLORS[k], edge: null, r: 6 });
    text(ctx, k.toUpperCase(), x + 17, y + 13, { size: 8, bold: true, align: 'center', color: '#ffffff', outline: darken(STAT_COLORS[k], 0.3) });
    const bonus = s[k] - char.base[k];
    text(ctx, `${s[k]}`, x + 37, y + 13.5, { size: 9.5, bold: true, color: COLORS.ink });
    ctx.font = font(9.5, true);
    const vw = ctx.measureText(`${s[k]}`).width;
    if (bonus) text(ctx, `${char.base[k]}+${bonus}`, x + 40 + vw, y + 13, { size: 6.5, color: GREEN });
    // Your job's main stat, and the one it leans on.
    if (main || k === secondary) {
      const tag = main ? 'MAIN' : '2ND';
      box(ctx, x + lw - 49, y + 5, 22, 9, { fill: main ? STAT_COLORS[k] : '#f1e9f8', edge: null, r: 4.5 });
      text(ctx, tag, x + lw - 38, y + 12, { size: 5.5, bold: true, align: 'center', color: main ? '#ffffff' : COLORS.muted });
    }
    const bx = x + lw - 21;
    if (button(ui, bx, y + 2, 18, 15, '+', { enabled: char.ap > 0, primary: char.ap > 0, size: 9 })) spendAp(char, k, ui.input.held.has('ShiftLeft') ? 5 : 1);
    if (char.ap > 0 && hover(ui, bx, y + 2, 18, 15)) preview = k;
    if (hotRow && !hover(ui, bx, y + 2, 18, 15)) tooltip(ui, [{ text: k.toUpperCase(), bold: true, color: STAT_COLORS[k] }, { text: STAT_ABOUT[k], size: 8 }, ...(bonus ? [{ text: `${char.base[k]} from AP, +${bonus} from gear and skills`, size: 8, color: COLORS.muted }] : [])]);
    y += 22;
  }
  text(ctx, 'Shift + click: 5 at once', x + lw / 2, y + 6, { size: 6, align: 'center', color: COLORS.muted });

  // ---- What it adds up to ----
  const rx = x + lw + 6;
  const rw = win.x + W - 8 - rx;
  const ry = win.y + 25;
  well(ctx, rx, ry, rw, H - 33, th);
  text(ctx, 'Combat', rx + 8, ry + 12, { size: 7.5, bold: true, color: th.dark });
  const now = combatRows(char, s);
  const n = preview ? Math.min(char.ap, ui.input.held.has('ShiftLeft') ? 5 : 1) : 0;
  const next = preview ? combatRows(char, stats({ ...char, base: { ...char.base, [preview]: char.base[preview] + n } }, world.now)) : null;
  // Some points only show once a few add up (defense steps every 4 STR, say).
  if (preview) text(ctx, next.some((r, i) => r[1] !== now[i][1]) ? `+${n} ${preview.toUpperCase()}` : `+${n} ${preview.toUpperCase()}: builds up`, rx + rw - 8, ry + 12, { size: 7, bold: true, align: 'right', color: GREEN });
  now.forEach(([label, v, shown, about], i) => {
    const cy = ry + 19 + i * 20;
    const d = next ? next[i][1] - v : 0;
    const hot = hover(ui, rx + 4, cy, rw - 8, 18);
    box(ctx, rx + 4, cy, rw - 8, 18, { fill: d > 0 ? '#eaf8ef' : hot ? '#ffffff' : 'rgba(255,255,255,0.6)', edge: null, r: 6 });
    text(ctx, label, rx + 9, cy + 12, { size: 7, color: COLORS.muted, bold: true });
    text(ctx, d > 0 ? next[i][2] : shown, rx + rw - 9 - (d > 0 ? 18 : 0), cy + 12.5, { size: 8.5, bold: true, align: 'right', color: d > 0 ? GREEN : COLORS.ink });
    if (d > 0) text(ctx, `+${d}`, rx + rw - 9, cy + 12, { size: 6.5, bold: true, align: 'right', color: GREEN });
    if (hot) tooltip(ui, [{ text: label, bold: true }, { text: about, size: 8, color: COLORS.muted }]);
  });
}
