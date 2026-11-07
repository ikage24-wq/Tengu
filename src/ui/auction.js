// The Auction House window (world/auction.js), opened from Madame Ledger at the door. Four
// counters of this hour's listings (weapons, armour, materials, fish), each row with its trader,
// how long it has left, the bid to beat, and its buyout, sorted by price or by ending soonest;
// and Yours: what you have up, your bids, your collection box, and your bag to list from.

import { auctionFee, auctionSlots, stallSize } from '../world/rep.js';
import { stockStall, unstock, collectTill } from '../world/stall.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { itemName } from '../core/items.js';
import { drawItemIcon } from '../render/icons.js';
import { listings, counterOf, buyNow, placeBid, nextBid, listItem, cancelListing, collectAll, tickAuction, marketValue, canTrade, clockOf, FEE, MAX_MINE } from '../world/auction.js';
import { COLORS, windowFrame, text, box, button, hover, clicked, tooltip, fit, tabs } from './kit.js';
import { itemTooltip } from './tooltips.js';

const W = 380;
const H = 270;
const ROW = 25;
const COUNTERS = ['weapon', 'armour', 'material', 'fish'];
const LABELS = ['Weapons', 'Armour', 'Materials', 'Fish', 'Yours'];
const mins = (ms) => (ms <= 0 ? 'ended' : ms < 60000 ? '<1m' : `${Math.ceil(ms / 60000)}m`);
const g = (n) => `${Math.round(n).toLocaleString()} g`;

export function auctionWindow(ui, state, world) {
  const win = state.windows.auction;
  // Only at the Auction House.
  if (world.map.id !== 'coinbridge') {
    win.open = false;
    return;
  }
  if (!windowFrame(ui, win, W, H, 'Auction House')) return;
  tickAuction(world);
  const { ctx } = ui;
  const char = world.char;
  const x = win.x + 8;
  const was = win.tab ?? 0;
  // (Your stall's tab, once you have a licence: world/rep.js.)
  const labels = stallSize(char) ? [...LABELS, 'Stall'] : LABELS;
  win.tab = Math.min(tabs(ui, x, win.y + 25, labels, was, { w: stallSize(char) ? 50 : 58, h: 14 }), labels.length - 1);
  if (win.tab !== was) win.scroll = 0;
  text(ctx, `Gold: ${char.gold.toLocaleString()}`, win.x + W - 10, win.y + 34, { size: 7, bold: true, align: 'right', color: COLORS.gold });
  if (win.tab === 4) return yoursTab(ui, win, world, x, win.y + 46);
  if (win.tab === 5) return stallTab(ui, win, world, x, win.y + 46);
  marketTab(ui, win, world, x, win.y + 46, COUNTERS[win.tab]);
}

function marketTab(ui, win, world, x, y, counter) {
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const now = clockOf(world);
  const bids = char.auction?.bids ?? {};
  let list = listings(world).filter((l) => counterOf(l.id) === counter && l.ends > now);
  win.sort ??= 'price';
  list = list.sort((a, b) => (win.sort === 'price' ? a.price / a.qty - b.price / b.qty : a.ends - b.ends));
  const next = 60 - new Date(now).getMinutes();
  text(ctx, `${list.length} up · new traders in ${next}m`, x + 2, y + 6, { size: 6.5, color: COLORS.muted });
  if (button(ui, x + W - 124, y - 1, 52, 12, 'By price', { size: 6, primary: win.sort === 'price' })) win.sort = 'price';
  if (button(ui, x + W - 70, y - 1, 52, 12, 'Ending', { size: 6, primary: win.sort === 'ends' })) win.sort = 'ends';
  y += 14;
  const rows = Math.floor((H - 76) / ROW);
  if (hover(ui, x, y, W - 16, rows * ROW)) win.scroll = (win.scroll ?? 0) + ui.mouse.wheel;
  win.scroll = Math.max(0, Math.min(win.scroll ?? 0, list.length - rows));
  if (!list.length) text(ctx, 'Nothing up at this counter right now. New traders come every hour!', x + 4, y + 14, { size: 7, color: COLORS.muted });
  for (const l of list.slice(win.scroll, win.scroll + rows)) {
    const mine = bids[l.key];
    const rar = RARITIES[l.rarity ?? 0];
    box(ctx, x, y, W - 16, ROW - 3, { fill: mine ? '#fff6e0' : '#ffffff', edge: mine ? '#f0c64a' : th.light, r: 7, width: 1 });
    drawItemIcon(ctx, l.id, x + 4, y + 3);
    if (hover(ui, x + 4, y + 3, 16, 16)) tooltip(ui, itemTooltip(char, l.id, l.rarity ? { id: l.id, rarity: l.rarity } : null));
    const name = `${l.rarity ? `★ ` : ''}${itemName(l.id)}${l.qty > 1 ? ` ×${l.qty}` : ''}`;
    text(ctx, fit(ctx, name, 120, 7, true), x + 24, y + 9, { size: 7, bold: true, color: l.rarity ? rar.color : COLORS.ink });
    text(ctx, fit(ctx, `${l.seller} · Lv ${ITEMS[l.id].reqLevel ?? '-'} · ${mins(l.ends - now)}`, 120, 5.8, false), x + 24, y + 17.5, { size: 5.8, color: COLORS.muted });
    // The bid to beat (yours, if you lead), and the buyout.
    text(ctx, mine ? `Your bid ${g(mine.amount)}` : `Bid ${g(l.bid)}`, x + 196, y + 9, { size: 6.5, bold: true, align: 'right', color: mine ? '#c88a1a' : COLORS.ink });
    text(ctx, `Buyout ${g(l.price)}`, x + 196, y + 17.5, { size: 6, align: 'right', color: COLORS.muted });
    const nb = nextBid(l, mine);
    if (button(ui, x + 202, y + 4, 74, 14, `Bid ${g(nb)}`, { size: 6, enabled: nb < l.price && char.gold >= nb - (mine?.amount ?? 0) })) {
      const why = placeBid(world, l.key);
      if (why) world.log(why, '#ffb3c6');
    }
    if (button(ui, x + 280, y + 4, 82, 14, `Buy ${g(l.price)}`, { size: 6, primary: true, enabled: !mine && char.gold >= l.price })) {
      const why = buyNow(world, l.key);
      if (why) world.log(why, '#ffb3c6');
    }
    y += ROW;
  }
}

function yoursTab(ui, win, world, x, y) {
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const a = (char.auction ??= { mine: [], box: [], bids: {}, bought: {} });
  const now = clockOf(world);
  const colW = 170;
  // Left: what you have up, your bids, your collection box.
  text(ctx, `Up for sale (${a.mine.length}/${auctionSlots(char)})`, x + 2, y + 6, { size: 7, bold: true, color: th.dark });
  let ly = y + 12;
  if (!a.mine.length) text(ctx, 'Nothing yet. Pick something from your bag.', x + 4, ly + 8, { size: 6.2, color: COLORS.muted });
  for (const m of a.mine) {
    box(ctx, x, ly, colW, 20, { fill: '#ffffff', edge: th.light, r: 6, width: 1 });
    drawItemIcon(ctx, m.id, x + 3, ly + 2);
    text(ctx, fit(ctx, `${itemName(m.inst ?? m.id)}${m.qty > 1 ? ` ×${m.qty}` : ''}`, 90, 6.2, true), x + 22, ly + 8, { size: 6.2, bold: true });
    text(ctx, `${g(m.price)} · ${mins(m.ends - now)}`, x + 22, ly + 15.5, { size: 5.6, color: COLORS.muted });
    if (button(ui, x + colW - 40, ly + 4, 36, 12, 'Take down', { size: 5.2 })) cancelListing(world, m.key);
    ly += 22;
  }
  const bids = Object.values(a.bids);
  if (bids.length) {
    text(ctx, `Your bids: ${bids.map((b) => `${itemName(b.id)} ${g(b.amount)}`).join(', ')}`, x + 2, ly + 7, { size: 5.8, color: '#c88a1a' });
    ly += 12;
  }
  ly = Math.max(ly + 4, y + 132);
  text(ctx, 'Collection box', x + 2, ly + 6, { size: 7, bold: true, color: th.dark });
  const gold = a.box.filter((e) => e.kind === 'gold').reduce((n, e) => n + e.gold, 0);
  const items = a.box.filter((e) => e.kind === 'item');
  text(ctx, a.box.length ? `${g(gold)}${items.length ? ` and ${items.length} item${items.length > 1 ? 's' : ''}` : ''} waiting` : 'Empty', x + 4, ly + 16, { size: 6.5, color: a.box.length ? COLORS.ink : COLORS.muted });
  items.slice(0, 8).forEach((e, i) => drawItemIcon(ctx, e.id, x + 4 + i * 19, ly + 22));
  if (button(ui, x + colW - 64, ly, 62, 13, 'Collect all', { size: 6.5, primary: true, enabled: a.box.length > 0 })) collectAll(world);
  // Right: your bag, to list from, and the price.
  sellPicker(ui, win, world, x + colW + 10, y, W - 16 - colW - 10, {
    fee: auctionFee(char), can: a.mine.length < auctionSlots(char), label: 'List it',
    list: (item, price) => listItem(world, item, price),
  });
}

// Your bag (what the market takes), the thing you picked, and its price with how fast it should
// go at it: for the Auction House and for your stall. `opts`: { fee, can, label, list(item, price) }.
function sellPicker(ui, win, world, rx, y, rw, opts) {
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  text(ctx, 'Sell from your bag', rx, y + 6, { size: 7, bold: true, color: th.dark });
  const bag = [...char.inventory.equip.filter((e) => canTrade(e.id)), ...char.inventory.etc.filter((s) => canTrade(s.id))];
  const cols = 9;
  const cell = 19;
  if (hover(ui, rx, y + 12, rw, cell * 4)) win.bagScroll = (win.bagScroll ?? 0) + ui.mouse.wheel;
  win.bagScroll = Math.max(0, Math.min(win.bagScroll ?? 0, Math.ceil(bag.length / cols) - 4));
  bag.slice(win.bagScroll * cols, (win.bagScroll + 4) * cols).forEach((it, i) => {
    const cx = rx + (i % cols) * cell;
    const cy = y + 12 + Math.floor(i / cols) * cell;
    const picked = win.pick === it;
    box(ctx, cx, cy, cell - 2, cell - 2, { fill: picked ? '#fff0c8' : '#ffffff', edge: picked ? '#f0b53a' : th.light, r: 4, width: picked ? 1.6 : 1 });
    drawItemIcon(ctx, it.id, cx, cy);
    if (it.qty > 1) text(ctx, String(it.qty), cx + cell - 4, cy + cell - 4, { size: 5, bold: true, align: 'right' });
    if (hover(ui, cx, cy, cell - 2, cell - 2)) tooltip(ui, itemTooltip(char, it.id, it.uid != null ? it : null));
    if (clicked(ui, cx, cy, cell - 2, cell - 2)) {
      win.pick = it;
      win.price = null;
    }
  });
  if (!bag.length) text(ctx, 'Nothing in your bag the market takes.', rx, y + 24, { size: 6.2, color: COLORS.muted });
  // The price for what you picked.
  const py = y + 12 + cell * 4 + 6;
  const it = win.pick && bag.includes(win.pick) ? win.pick : null;
  if (!it) {
    text(ctx, 'Pick something to sell.', rx, py + 8, { size: 6.5, color: COLORS.muted });
    return;
  }
  const qty = it.qty ?? 1;
  const market = Math.round(marketValue(world, it.id, it.rarity ?? 0) * qty);
  win.price ??= market;
  box(ctx, rx, py, rw, 78, { fill: '#fffaf0', edge: th.light, r: 7, width: 1 });
  drawItemIcon(ctx, it.id, rx + 4, py + 4);
  text(ctx, fit(ctx, `${itemName(it.uid != null ? it : it.id)}${qty > 1 ? ` ×${qty}` : ''}`, rw - 30, 7, true), rx + 24, py + 10, { size: 7, bold: true });
  text(ctx, `Market price about ${g(market)}`, rx + 24, py + 19, { size: 6, color: COLORS.muted });
  text(ctx, `Your price: ${g(win.price)}`, rx + 6, py + 34, { size: 8, bold: true, color: COLORS.gold });
  const ratio = win.price / Math.max(1, market);
  const pace = ratio > 1.6 ? 'Too dear: it won\'t sell' : ratio > 1.15 ? 'Dear: it may take a while' : ratio < 0.85 ? 'A bargain: it will go fast' : 'A fair price: it should sell soon';
  text(ctx, opts.fee ? `${pace} · you get ${g(win.price * (1 - opts.fee))} after the ${Math.round(opts.fee * 100)}% fee` : `${pace} · no fee at your own stall`, rx + 6, py + 44, { size: 5.6, color: ratio > 1.6 ? COLORS.bad : COLORS.muted });
  const step = (k) => (win.price = Math.max(5, Math.round((win.price * k) / 5) * 5));
  if (button(ui, rx + 6, py + 52, 30, 13, '-10%', { size: 6 })) step(0.9);
  if (button(ui, rx + 39, py + 52, 30, 13, '+10%', { size: 6 })) step(1.1);
  if (button(ui, rx + 72, py + 52, 36, 13, 'Market', { size: 6 })) win.price = market;
  if (button(ui, rx + rw - 52, py + 52, 46, 13, opts.label, { size: 6.5, primary: true, enabled: opts.can })) {
    const why = opts.list(it.uid != null ? it : { id: it.id, qty }, win.price);
    if (why) world.log(why, '#ffb3c6');
    else {
      win.pick = null;
      win.price = null;
    }
  }
}

// Your stall (a Merchant Friend's licence: world/stall.js): what's on its counter, the till, and
// your bag to stock it from.
function stallTab(ui, win, world, x, y) {
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const size = stallSize(char);
  const s = (char.stall ??= { items: [], till: 0 });
  const colW = 170;
  text(ctx, `Your stall (${s.items.length}/${size})`, x + 2, y + 6, { size: 7, bold: true, color: th.dark });
  text(ctx, "On the market canal. It sells while you're away.", x + 2, y + 15, { size: 5.8, color: COLORS.muted });
  let ly = y + 20;
  for (const it of s.items) {
    box(ctx, x, ly, colW, 20, { fill: '#ffffff', edge: th.light, r: 6, width: 1 });
    drawItemIcon(ctx, it.id, x + 3, ly + 2);
    text(ctx, fit(ctx, `${itemName(it.inst ?? it.id)}${it.qty > 1 ? ` ×${it.qty}` : ''}`, 92, 6.2, true), x + 22, ly + 8, { size: 6.2, bold: true });
    text(ctx, `${g(it.price)}${it.sellAt == null ? ' · too dear to sell' : ''}`, x + 22, ly + 15.5, { size: 5.6, color: it.sellAt == null ? COLORS.bad : COLORS.muted });
    if (button(ui, x + colW - 40, ly + 4, 36, 12, 'Take back', { size: 5.2 })) {
      const why = unstock(world, it.key);
      if (why) world.log(why, '#ffb3c6');
    }
    ly += 22;
  }
  if (!s.items.length) text(ctx, 'Empty. Pick something from your bag!', x + 4, ly + 8, { size: 6.2, color: COLORS.muted });
  const ty = y + 168;
  text(ctx, `Till: ${g(s.till ?? 0)}`, x + 2, ty + 6, { size: 8, bold: true, color: COLORS.gold });
  if (button(ui, x + colW - 64, ty - 2, 62, 13, 'Take the till', { size: 6.2, primary: true, enabled: (s.till ?? 0) > 0 })) collectTill(world);
  sellPicker(ui, win, world, x + colW + 10, y, W - 16 - colW - 10, {
    fee: 0, can: s.items.length < size, label: 'Put on stall',
    list: (item, price) => stockStall(world, item, price),
  });
}
