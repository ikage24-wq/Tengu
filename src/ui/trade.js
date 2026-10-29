// The trade window (net/together.js), open while you trade with a friend: your bag's tradable
// things on the left (tap to offer one; Shift or a double tap for the whole stack), your offer and
// your gold in the middle, theirs on the right, and Ready. When you're both ready the swap happens.

import { ITEMS } from '../data/items.js';
import { online } from '../net/online.js';
import { offerItem, takeBack, offerGold, setReady, cancelTrade, TRADE_SLOTS } from '../net/together.js';
import { COLORS, windowFrame, tabs, text, box, button, itemSlot, hover, clicked, tooltip, fit } from './kit.js';
import { itemTooltip } from './tooltips.js';

const W = 420;
const H = 230;
const TABS = ['Equip', 'Use', 'Etc'];

export function tradeWindow(ui, state, world) {
  const tr = online.trade;
  const win = state.windows.trade;
  win.open = Boolean(tr);
  if (!tr) return;
  const friend = online.ghosts.get(tr.with)?.name ?? 'Friend';
  if (!windowFrame(ui, win, W, H, `Trade with ${friend}`)) {
    cancelTrade(world);
    return;
  }
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const x = win.x + 8;
  const y = win.y + 24;
  // Your bag.
  win.tab = tabs(ui, x, y, TABS, win.tab ?? 0, { w: 42, h: 14 });
  const key = ['equip', 'use', 'etc'][win.tab];
  const list = char.inventory[key].filter((e) => e && ITEMS[e.id] && !ITEMS[e.id].quest && ITEMS[e.id].type !== 'cash');
  list.slice(0, 24).forEach((e, i) => {
    const sx = x + (i % 6) * 22;
    const sy = y + 20 + Math.floor(i / 6) * 22;
    itemSlot(ctx, sx, sy, 20, e, { shadow: false });
    if (hover(ui, sx, sy, 20, 20)) tooltip(ui, itemTooltip(char, e.id, e.uid ? e : null));
    if (clicked(ui, sx, sy, 20, 20)) offerItem(world, key, e, ui.input.held.has('ShiftLeft') || ui.mouse.double);
  });
  text(ctx, 'Tap to offer (Shift: all)', x, y + 116, { size: 6.5, color: COLORS.muted });
  // An offer: its slots and gold.
  const offer = (o, ox, mine, ready) => {
    box(ctx, ox, y, 128, 150, { fill: ready ? '#effcf3' : '#ffffff', edge: ready ? COLORS.good : th.light, r: 10, width: ready ? 2 : 1.2 });
    text(ctx, mine ? 'You give' : `${fit(ctx, friend, 70, 8, true)} gives`, ox + 6, y + 12, { size: 8, bold: true, color: th.dark });
    for (let i = 0; i < TRADE_SLOTS; i++) {
      const it = o.items[i];
      const sx = ox + 8 + (i % 3) * 38;
      const sy = y + 20 + Math.floor(i / 3) * 40;
      box(ctx, sx, sy, 34, 34, { fill: '#f7f0fc', edge: '#e2d3f0', r: 8 });
      if (!it) continue;
      const inst = it.inst ?? (it.uid ? char.inventory.equip.find((e) => e.uid === it.uid) : null);
      itemSlot(ctx, sx + 7, sy + 4, 20, inst ?? { id: it.id, qty: it.qty }, { shadow: false });
      if (hover(ui, sx, sy, 34, 34)) tooltip(ui, itemTooltip(char, inst?.id ?? it.id, inst));
      if (mine && clicked(ui, sx, sy, 34, 34)) takeBack(world, i);
    }
    text(ctx, `${o.gold.toLocaleString()} gold`, ox + 8, y + 112, { size: 8, bold: true, color: COLORS.gold });
    if (ready) text(ctx, 'Ready!', ox + 120, y + 12, { size: 7.5, bold: true, align: 'right', color: COLORS.good });
  };
  offer(tr.mine, x + 140, true, tr.ready.me);
  offer(tr.theirs, x + 276, false, tr.ready.them);
  // Gold.
  for (const [i, n] of [100, 1000, 10000].entries()) {
    if (button(ui, x + 140 + i * 30, y + 122, 28, 14, `+${n >= 1000 ? `${n / 1000}k` : n}`, { size: 6.5 })) offerGold(world, tr.mine.gold + n);
  }
  if (button(ui, x + 232, y + 122, 30, 14, 'Clear', { size: 6.5 })) offerGold(world, 0);
  // Ready, or call it off.
  const by = win.y + H - 26;
  text(ctx, 'When you are both Ready, the trade happens.', x, by + 11, { size: 7, color: COLORS.muted });
  if (button(ui, win.x + W - 150, by, 70, 18, tr.ready.me ? 'Waiting...' : 'Ready', { primary: true, enabled: !tr.ready.me, size: 8 })) setReady(world);
  if (button(ui, win.x + W - 76, by, 66, 18, 'Cancel', { size: 8 })) cancelTrade(world);
}
