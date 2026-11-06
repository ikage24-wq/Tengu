// The storage chest's window, opened from a storage keeper (Pip in Sprout Village, Marlo at the
// harbour): your bag on the left, the world's chest on the right, a tab for Equip, Use, Etc and
// Materials; each side shows four rows and scrolls (the wheel, or the bar beside it).
// Click a cell to send it across (a whole stack at a time); anything stored here can be picked up
// by every hero in this save file. Saved straight away, so nothing goes missing.

import { NPCS } from '../data/npcs.js';
import { ITEMS } from '../data/items.js';
import { TAB_SIZE } from '../core/inventory.js';
import { loadWorld, saveGame } from '../core/save.js';
import { storeItem, takeItem, STORAGE_TABS } from '../core/storage.js';
import { COLORS, windowFrame, tabs, text, button, hover, clicked, itemSlot, tooltip, box } from './kit.js';
import { itemTooltip } from './tooltips.js';

const W = 404;
const H = 176;
const COLS = 8;
const CELL = 22;
const ROWS = 4;

function grid(ui, world, list, x, y, label, dir, onPick, scroll, key) {
  const { ctx } = ui;
  text(ctx, label, x, y - 4, { size: 8, bold: true, color: COLORS.ink });
  text(ctx, `${list.length}/${TAB_SIZE}`, x + COLS * CELL - 2, y - 4, { size: 7, bold: true, align: 'right', color: list.length >= TAB_SIZE ? COLORS.bad : COLORS.muted });
  const max = TAB_SIZE / COLS - ROWS;
  if (hover(ui, x, y, COLS * CELL + 6, ROWS * CELL)) scroll[key] = (scroll[key] ?? 0) + ui.mouse.wheel;
  const top = (scroll[key] = Math.max(0, Math.min(max, scroll[key] ?? 0)));
  // The bar: the thumb shows the rows in view; a click above or below it pages there.
  const bx = x + COLS * CELL;
  const bh = ROWS * CELL - 2;
  box(ctx, bx, y, 4, bh, { fill: 'rgba(200,140,100,0.18)', edge: null, r: 2 });
  const t0 = y + (top / (TAB_SIZE / COLS)) * bh;
  box(ctx, bx, t0, 4, (ROWS / (TAB_SIZE / COLS)) * bh, { fill: hover(ui, bx - 2, y, 8, bh) ? '#e98450' : '#ffab7a', edge: null, r: 2 });
  if (clicked(ui, bx - 2, y, 8, bh)) scroll[key] = Math.max(0, Math.min(max, top + (ui.mouse.y < t0 ? -ROWS : ROWS)));
  for (let k = 0; k < COLS * ROWS; k++) {
    const i = top * COLS + k;
    const cx = x + (k % COLS) * CELL;
    const cy = y + Math.floor(k / COLS) * CELL;
    const item = list[i] ?? null;
    const hot = hover(ui, cx, cy, CELL - 2, CELL - 2);
    itemSlot(ctx, cx, cy, CELL - 2, item, { state: hot && item ? 'hot' : null });
    if (!item) continue;
    if (hot) tooltip(ui, [...itemTooltip(world.char, item.id, item.qty == null ? item : null), { text: dir, size: 7, bold: true, color: '#7a5ad8' }]);
    if (clicked(ui, cx, cy, CELL - 2, CELL - 2)) onPick(i);
  }
}

export function storageWindow(ui, state, world) {
  const dlg = state.npc;
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  if (!dlg.placedStore) {
    win.x = Math.round((640 - W) / 2);
    win.y = Math.max(20, 326 - H - 8);
    dlg.placedStore = true;
  }
  const w = loadWorld(world.char.file ?? 0);
  if (!w || !windowFrame(ui, win, W, H, `${w.name}'s Storage`, { theme: 'peach', icon: 'bag' })) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  const char = world.char;
  const t = (dlg.storeTab = tabs(ui, win.x + 9, win.y + 26, ['Equip', 'Use', 'Etc', 'Mats'], dlg.storeTab ?? 0, { w: 36, h: 14 }));
  dlg.storeScroll ??= {};
  const tab = STORAGE_TABS[t];
  text(ctx, `${npc.name} keeps it safe for every hero in this world.`, win.x + W - 10, win.y + 36, { size: 6.5, align: 'right', color: COLORS.muted });
  const gy = win.y + 56;
  const note = (msg, color = COLORS.bad) => (dlg.storeNote = { at: world.now, msg, color });
  grid(ui, world, char.inventory[tab] ?? [], win.x + 10, gy, 'Your bag', 'Click to store it', (i) => {
    const name = ITEMS[char.inventory[tab][i].id].name;
    if (storeItem(char, w, tab, i)) {
      saveGame(char);
      note(`Stored ${name}.`, COLORS.good);
    } else note('The chest is full in this tab.');
  }, dlg.storeScroll, `bag|${tab}`);
  // The arrows between the two sides, nudging back and forth.
  const ax = win.x + W / 2;
  const nudge = Math.sin(world.now * 3) * 1.5;
  ctx.fillStyle = '#e0a070';
  for (const [dir, ay] of [[1, gy + 36], [-1, gy + 50]]) {
    ctx.beginPath();
    ctx.moveTo(ax + dir * (6 + nudge), ay);
    ctx.lineTo(ax - dir * (2 - nudge), ay - 5);
    ctx.lineTo(ax - dir * (2 - nudge), ay + 5);
    ctx.closePath();
    ctx.fill();
  }
  grid(ui, world, w.storage[tab] ?? [], win.x + W - 10 - COLS * CELL, gy, 'Storage', 'Click to take it', (i) => {
    const name = ITEMS[w.storage[tab][i].id].name;
    if (takeItem(char, w, tab, i)) {
      saveGame(char);
      note(`Took ${name}.`, COLORS.good);
    } else note('Your bag is full in this tab.');
  }, dlg.storeScroll, `chest|${tab}`);
  const fy = win.y + H - 22;
  const n = dlg.storeNote;
  if (n && world.now - n.at < 2) text(ctx, n.msg, win.x + 12, fy + 11, { size: 7.5, bold: true, color: n.color });
  else text(ctx, 'Click an item to move it across.', win.x + 12, fy + 11, { size: 7, color: COLORS.muted });
  if (button(ui, win.x + W - 62, fy, 54, 16, 'Back', { size: 8 })) dlg.mode = null;
}
