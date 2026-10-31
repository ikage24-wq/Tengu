// The Collection window (B): the Monster Book (a card for every monster: shown once you've
// defeated one, a silhouette until then, with a star once mastered) and the fish you've caught.

import { MOBS } from '../data/mobs.js';
import { masteryAt } from '../core/collection.js';
import { drawMonster } from '../render/monsters.js';
import { drawItemIcon } from '../render/icons.js';
import { FISH, RARITY_NAMES, RARITY_COLORS } from '../data/fishing.js';
import { COLORS, windowFrame, tabs, text, box, hover, tooltip, sparkle, fit } from './kit.js';

const W = 340;
const H = 250;
const TABS = ['Monster Book', 'Fish'];

// Monsters by level, the bosses after.
const ORDER = Object.keys(MOBS).sort((a, b) => (MOBS[a].boss ? 1 : 0) - (MOBS[b].boss ? 1 : 0) || MOBS[a].level - MOBS[b].level);

export function collectionWindow(ui, state, world) {
  const win = state.windows.collection;
  if (!windowFrame(ui, win, W, H, 'Collection')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const tab = tabs(ui, win.x + 10, win.y + 26, TABS, win.tab ?? 0, { w: 62, h: 15 });
  if (tab !== win.tab) Object.assign(win, { tab, scroll: 0 });
  const x = win.x + 10;
  const y = win.y + 48;
  if (win.tab === 0) book(ui, win, char, world, x, y, th);
  else fishPage(ui, char, x, y, th);
}

// The book: a grid of cards, scrolled by the wheel, with what it's all worth along the bottom.
function book(ui, win, char, world, x, y, th) {
  const { ctx } = ui;
  const cols = 6;
  const cw = 52;
  const ch = 58;
  const rows = 3;
  const lines = Math.ceil(ORDER.length / cols);
  if (hover(ui, x, y, cols * cw, rows * ch)) win.scroll = (win.scroll ?? 0) + ui.mouse.wheel;
  win.scroll = Math.max(0, Math.min(win.scroll ?? 0, lines - rows));
  ORDER.slice(win.scroll * cols, (win.scroll + rows) * cols).forEach((id, i) => {
    const def = MOBS[id];
    const n = char.book?.[id] ?? 0;
    const seen = n > 0;
    const master = n >= masteryAt(id);
    const cx = x + (i % cols) * cw;
    const cy = y + Math.floor(i / cols) * ch;
    box(ctx, cx, cy, cw - 4, ch - 4, { fill: master ? '#fff6d6' : seen ? '#ffffff' : '#f2ecf8', edge: master ? '#f0c64a' : seen ? th.light : '#e2d8ee', r: 8, width: master ? 2 : 1.2 });
    // The monster itself, fitted into the card (a dark silhouette until you've met it).
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 2, cy + 2, cw - 8, ch - 20);
    ctx.clip();
    const k = Math.min(0.55, 34 / def.h, 40 / def.w);
    ctx.translate(cx + (cw - 4) / 2, cy + ch - 20);
    ctx.scale(k, k);
    if (!seen) {
      ctx.filter = 'brightness(0) opacity(0.25)';
    }
    drawMonster(ctx, { def, x: 0, y: 0, hp: def.hp, dir: 1, state: 'idle', flash: 0, stagger: 0, phase: 0, age: 9, dying: 0, uid: 7000 + i, aggroUntil: 0, attackAt: -9, gloatAt: -9 }, 0, 0, world.now, world.now);
    ctx.restore();
    text(ctx, seen ? fit(ctx, def.name.split(',')[0], cw - 8, 6, true) : '???', cx + (cw - 4) / 2, cy + ch - 12, { size: 6, bold: true, align: 'center', color: seen ? COLORS.ink : COLORS.muted });
    if (master) sparkle(ctx, cx + cw - 11, cy + 7, 3, '#f0b53a');
    if (hover(ui, cx, cy, cw - 4, ch - 4)) {
      tooltip(ui, seen ? [
        { text: def.name, bold: true },
        { text: `Lv ${def.level}${def.boss ? ' boss' : ''}`, size: 8, color: COLORS.muted },
        { text: `Defeated ${n.toLocaleString()} / ${masteryAt(id)} to master`, size: 8, color: master ? '#3f9f5f' : COLORS.ink },
        ...(master ? [{ text: 'Mastered!', size: 8, color: '#3f9f5f' }] : []),
      ] : [{ text: 'Not met yet', bold: true }, { text: `Lv ${def.level}`, size: 8, color: COLORS.muted }]);
    }
  });
  const cards = Object.keys(char.book ?? {}).filter((id) => MOBS[id]).length;
  text(ctx, `${cards} / ${ORDER.length} cards`, x, y + rows * ch + 10, { size: 8, bold: true, color: th.dark });
  if (lines > rows) text(ctx, 'Scroll for more', x + cols * cw - 6, y + rows * ch + 10, { size: 6.5, align: 'right', color: COLORS.muted });
}

// The fish you've caught: each one's card with how many (a dark shape until then),
// in its rarity's colour.
function fishPage(ui, char, x, y, th) {
  const { ctx } = ui;
  const cols = 5;
  const cw = 64;
  const ch = 50;
  FISH.forEach((f, i) => {
    const rec = char.fishBook?.[f.id];
    const cx = x + (i % cols) * cw;
    const cy = y + Math.floor(i / cols) * ch;
    box(ctx, cx, cy, cw - 4, ch - 4, { fill: rec ? '#ffffff' : '#f2ecf8', edge: rec ? RARITY_COLORS[f.rarity] : '#e2d8ee', r: 8, width: rec ? 1.5 : 1 });
    ctx.save();
    if (!rec) ctx.filter = 'brightness(0) opacity(0.25)';
    drawItemIcon(ctx, f.id, cx + (cw - 4) / 2 - 12, cy + 3, 1.5);
    ctx.restore();
    text(ctx, rec ? fit(ctx, f.name, cw - 8, 6, true) : '???', cx + (cw - 4) / 2, cy + 35, { size: 6, bold: true, align: 'center', color: rec ? COLORS.ink : COLORS.muted });
    if (rec) text(ctx, `x${rec.n}`, cx + (cw - 4) / 2, cy + 42, { size: 5.5, align: 'center', color: COLORS.muted });
    if (hover(ui, cx, cy, cw - 4, ch - 4)) tooltip(ui, rec ? [{ text: f.name, bold: true }, { text: RARITY_NAMES[f.rarity], size: 8, color: RARITY_COLORS[f.rarity] }, { text: `Caught ${rec.n}`, size: 8 }] : [{ text: 'Not caught yet', bold: true }, { text: RARITY_NAMES[f.rarity], size: 8, color: RARITY_COLORS[f.rarity] }]);
  });
  const got = FISH.filter((f) => char.fishBook?.[f.id]).length;
  text(ctx, `${got} / ${FISH.length} fish  ·  Get a rod from Pip or Marlo, and look for the fish signs by the water.`, x, y + Math.ceil(FISH.length / cols) * ch + 8, { size: 7, bold: true, color: th.dark });
}
