// Your own stall on Coinbridge's market canal (a Merchant Friend's licence: world/rep.js).
//
// Put up to your standing's `stall` things on its counter at your price. Unlike the Auction House
// they never come down: they stay until a passer-by buys them, and the stall keeps selling while
// you're away (worked out when you come back, core/save.js). A sale's gold waits in the stall's
// till (no fee: it's your stall), and each sale is a little rep. Passers-by buy at about the
// market's pace, a bit slower (STALL_PACE): cheaper goes sooner, too dear never.
// char.stall = { items: [{ key, inst?, id, qty, price, sellAt }], till }.

import { ITEMS } from '../data/items.js';
import { itemName } from '../core/items.js';
import { countItem, removeItem, addItem } from '../core/inventory.js';
import { marketValue, canTrade, clockOf } from './auction.js';
import { stallSize, addRep, REP_FOR } from './rep.js';

const STALL_PACE = 8 * 60000;

const stallOf = (char) => (char.stall ??= { items: [], till: 0 });

// When a passer-by buys it: about STALL_PACE at the market price (sooner when cheap), never past 1.6x.
function saleTime(world, item, price, now) {
  const market = marketValue(world, item.id, item.inst?.rarity ?? 0) * (item.qty ?? 1);
  const ratio = price / Math.max(1, market);
  if (ratio > 1.6) return null;
  let h = 0;
  for (const c of `${now}|${item.id}|${price}`) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return now + STALL_PACE * Math.exp((ratio - 1) * 3.2) * (0.6 + 0.8 * (h / 9973));
}

// Puts something from your bag on your stall. `item` is an equip instance or { id, qty }.
export function stockStall(world, item, price) {
  const char = world.char;
  const s = stallOf(char);
  const size = stallSize(char);
  if (!size) return 'You need a stall licence first (Merchant Friend, from Penny).';
  if (s.items.length >= size) return `Your stall holds ${size} things.`;
  if (!canTrade(item.id)) return "That won't sell at a market stall.";
  price = Math.max(5, Math.round(price / 5) * 5);
  let goods;
  if (item.uid != null || ITEMS[item.id].type === 'equip') {
    const i = char.inventory.equip.indexOf(item);
    if (i < 0) return 'That is not in your bag.';
    char.inventory.equip.splice(i, 1);
    goods = { inst: item, id: item.id, qty: 1 };
  } else {
    const qty = Math.min(item.qty, countItem(char.inventory, item.id));
    if (qty <= 0) return 'You have none left.';
    removeItem(char.inventory, item.id, qty);
    goods = { id: item.id, qty };
  }
  const now = clockOf(world);
  s.items.push({ key: `stall|${now}|${item.id}`, ...goods, price, sellAt: saleTime(world, goods, price, now) });
  world.log(`${itemName(goods.inst ?? goods.id)} is on your stall for ${price.toLocaleString()} gold.`, '#ffe9a6');
  return null;
}

// Takes something back off the stall into your bag.
export function unstock(world, key) {
  const s = stallOf(world.char);
  const i = s.items.findIndex((x) => x.key === key);
  if (i < 0) return 'It already sold!';
  const it = s.items[i];
  if (!(it.inst ? addItem(world.char.inventory, it.inst) : addItem(world.char.inventory, it.id, it.qty))) return 'Your bag is full.';
  s.items.splice(i, 1);
  return null;
}

// Sells whatever has had its buyer by `now` (online every second or so, and on loading a save for
// the time you were away). Returns the gold it made.
export function settleStall(char, now, world = null) {
  const s = char.stall;
  if (!s?.items.length) return 0;
  let made = 0;
  for (const it of [...s.items]) {
    if (it.sellAt == null || it.sellAt > now) continue;
    s.items.splice(s.items.indexOf(it), 1);
    s.till = (s.till ?? 0) + it.price;
    made += it.price;
    addRep(world, char, REP_FOR.stallSale());
    world?.log?.(`Someone bought your ${itemName(it.inst ?? it.id)} at your stall! ${it.price.toLocaleString()} gold in the till.`, '#ffe36b');
  }
  if (made && !world) char.stallNews = (char.stallNews ?? 0) + made;
  return made;
}
export function tickStall(world) {
  settleStall(world.char, clockOf(world), world);
  // What your stall shows on the market canal (render/coinbridge.js).
  if (world.map.id === 'coinbridge') world.map.myStall = { licensed: stallSize(world.char) > 0, name: world.char.name, ids: (world.char.stall?.items ?? []).map((i) => i.id) };
  if (world.char.stallNews) {
    world.log(`While you were away, your stall sold ${world.char.stallNews.toLocaleString()} gold of goods. It's in the till.`, '#ffe36b');
    world.char.stallNews = 0;
  }
}

// Empties the till into your purse.
export function collectTill(world) {
  const s = stallOf(world.char);
  const g = s.till ?? 0;
  if (!g) return 0;
  world.char.gold += g;
  s.till = 0;
  world.log(`You took ${g.toLocaleString()} gold from your stall's till.`, '#ffe36b');
  return g;
}
