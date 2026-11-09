// A Mochi's care panel, opened with Up beside one of your Mochi in your garden
// (world/garden-life.js): how it's feeling, its five stats, and what you can do with it: care for
// it (gentle care leans it angelic, rough play devilish) and feed it a sweet from your bag (sweets
// are what raise its stats). Walk away and the panel closes.

import { STAGES } from '../data/mochi-genes.js';
import { CARE, MOCHI_SWEETS, expToNext } from '../data/mochi-raise.js';
import { countItem } from '../core/inventory.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, windowFrame, text, box, button, hover, clicked, tooltip, bar } from './kit.js';
import { itemTooltip } from './tooltips.js';
import { careFor, feedMochi } from '../world/garden-life.js';

const W = 236;
const H = 182;
const STAT_ROWS = [['run', 'Run'], ['fly', 'Fly'], ['power', 'Power'], ['stamina', 'Stamina'], ['swim', 'Swim']];
const GRADE_COLOR = { E: '#9a9aa8', D: '#6fae6a', C: '#4a9ad0', B: '#9a6ad8', A: '#e08a3a', S: '#e8485e' };
const CARE_ROWS = [
  ['pet', 'Pet', 'Gentle: leans it angelic.'],
  ['play', 'Play', 'A game of catch. Trains a little Run.'],
  ['cheer', 'Cheer', 'Cheer it on. Leans it angelic.'],
  ['tickle', 'Tickle', 'Cheeky: leans it devilish.'],
  ['wrestle', 'Wrestle', 'Rough play: trains a little Power, leans it devilish.'],
  ['prank', 'Prank', 'Mischief: leans it devilish.'],
];
const sweetName = (kind) => MOCHI_SWEETS.find((s) => s.kind === kind)?.name ?? kind;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');

export function mochiCareWindow(ui, state, world) {
  const win = state.windows.mochi;
  const life = world.gardenLife;
  const e = life?.caring;
  // Walk away (or leave the garden) and it closes.
  if (!e || !life.mochi.includes(e) || e.hidden || e.scene || Math.abs((e.x ?? 1e9) - world.body.x) > 90) {
    win.open = false;
    if (life) life.caring = null;
    return;
  }
  // (It stays by you while the panel's open.)
  const now = Date.now() / 1000;
  e.busyUntil = Math.max(e.busyUntil ?? 0, now + 0.4);
  const rec = e.rec;
  if (!windowFrame(ui, win, W, H, STAGES[rec.stage] ?? 'Mochi')) return;
  const { ctx } = ui;
  const x = win.x + 10;
  let y = win.y + 32;
  text(ctx, `${cap(rec.personality)} ${STAGES[rec.stage] ?? 'Mochi'}`, x, y, { size: 8.5, bold: true });
  text(ctx, `Loves ${sweetName(rec.loves)}`, win.x + W - 10, y, { size: 6.5, align: 'right', color: COLORS.muted });
  y += 7;
  // How it's feeling.
  const bw = (W - 28) / 3;
  bar(ctx, x, y, bw, 9, (rec.mood ?? 0) / 100, '#ff8fb0', 'Mood', { size: 6 });
  bar(ctx, x + bw + 4, y, bw, 9, Math.min(1, (rec.bond ?? 0) / 1000), '#f0b53a', 'Bond', { size: 6 });
  bar(ctx, x + (bw + 4) * 2, y, bw, 9, (rec.tummy ?? 0) / 100, rec.hungry ? '#e8485e' : '#f0a070', rec.hungry ? 'Hungry!' : 'Tummy', { size: 6 });
  y += 15;
  // Its stats: level, grade, and how far to the next level.
  const cw = (W - 20) / 5;
  STAT_ROWS.forEach(([st, name], i) => {
    const s = rec.stats[st];
    const cx = x + i * cw;
    box(ctx, cx, y, cw - 3, 30, { fill: '#fffaf6', edge: '#f0dce4', r: 6, width: 1 });
    text(ctx, name, cx + (cw - 3) / 2, y + 8, { size: 6, align: 'center', color: COLORS.muted });
    text(ctx, `Lv ${s.level}`, cx + (cw - 3) / 2 - 3, y + 18, { size: 7.5, bold: true, align: 'center' });
    text(ctx, s.grade, cx + cw - 9, y + 18, { size: 7, bold: true, align: 'center', color: GRADE_COLOR[s.grade] ?? COLORS.muted });
    box(ctx, cx + 4, y + 22, cw - 11, 3, { fill: '#f3e6ee', edge: null, r: 1.5 });
    box(ctx, cx + 4, y + 22, Math.max(1, (cw - 11) * Math.min(1, s.exp / expToNext(s.level))), 3, { fill: GRADE_COLOR[s.grade] ?? '#ff8fb0', edge: null, r: 1.5 });
    if (hover(ui, cx, y, cw - 3, 30)) tooltip(ui, [{ text: `${name}: Lv ${s.level}, grade ${s.grade}`, bold: true }, { text: `${s.points} points`, color: COLORS.muted }]);
  });
  y += 36;
  // Care.
  text(ctx, 'Care', x, y + 6, { size: 7, bold: true, color: COLORS.muted });
  const bw2 = (W - 20 - 8) / 3;
  CARE_ROWS.forEach(([what, label, tip], i) => {
    const bx = x + (i % 3) * (bw2 + 4);
    const by = y + 10 + Math.floor(i / 3) * 19;
    if (button(ui, bx, by, bw2, 16, label, { size: 7.5, primary: CARE[what]?.lean >= 0 })) careFor(world, e, what);
    if (hover(ui, bx, by, bw2, 16)) tooltip(ui, [{ text: label, bold: true }, { text: tip, color: COLORS.muted }]);
  });
  y += 52;
  // Feed: the sweets in your bag.
  text(ctx, 'Feed', x, y + 6, { size: 7, bold: true, color: COLORS.muted });
  const sweets = MOCHI_SWEETS.filter((sw) => countItem(world.char.inventory, sw.id) > 0);
  if (!sweets.length) text(ctx, 'No sweets. Cook some at the kitchen!', x + 30, y + 6, { size: 6.5, color: COLORS.muted });
  sweets.slice(0, 10).forEach((sw, i) => {
    const ix = x + i * 21;
    const iy = y + 10;
    const on = hover(ui, ix, iy, 19, 19);
    box(ctx, ix, iy, 19, 19, { fill: on ? '#fff0f5' : '#ffffff', edge: on ? '#ff8fb0' : '#f0dce4', r: 5, width: 1 });
    drawItemIcon(ctx, sw.id, ix + 1.5, iy + 1.5);
    text(ctx, String(countItem(world.char.inventory, sw.id)), ix + 17, iy + 18, { size: 5.5, bold: true, align: 'right' });
    if (on) tooltip(ui, [...itemTooltip(world.char, sw.id), { text: sw.kind === rec.loves ? 'Its favourite!' : sw.kind === rec.hates ? 'It hates this one...' : 'Click to feed', color: sw.kind === rec.loves ? COLORS.good : sw.kind === rec.hates ? COLORS.bad : COLORS.muted }]);
    if (clicked(ui, ix, iy, 19, 19)) feedMochi(world, e, sw.id);
  });
}
