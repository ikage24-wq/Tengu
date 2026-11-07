// The Coinbridge Auction House (Madame Ledger; ui/auction.js draws it).
//
// The market: every real hour the traders of the world put up a fresh batch of listings, picked
// around your level (gear, monster drops and finds, fish), each with a buyout price and a bid.
// Prices are alive: each item's value drifts day to day, and the more copies are up at once the
// cheaper each one goes, so whatever everyone is farming comes down (a dungeon's drops, a week's
// popular fish).
//   buy    pay the buyout, it's yours at once
//   bid    put your gold down on it (held while you lead); when it ends you win it, unless
//          another trader outbids you first (likelier the lower your bid), and then your gold
//          comes back
//   sell   list up to MAX_MINE things from your bag at your price; traders buy it sooner the
//          cheaper it is against the market (never, if it's far too dear: it comes back unsold
//          when it ends). Madame Ledger keeps a FEE on a sale.
// Whatever you win, sell or get back waits in your collection box at the Auction House.
//
// Value (the money scale: 100 gold is little, 1k decent, 100k a lot): gear goes for a fifth of
// what a shop asks (the shops pay a tenth, and gear must not out-earn hunting), more for a rare
// roll; drops, finds and fish for a little over what a shop pays.
// char.auction = { mine: [...], box: [...], bids: { key: {...} }, bought: { key: hour } }.

import { ITEMS } from '../data/items.js';
import { MOBS } from '../data/mobs.js';
import { FISH_BY_ID } from '../data/fishing.js';
import { FIND_TIER, TIER_LV } from '../data/gathering.js';
import { makeEquip, itemName } from '../core/items.js';
import { addItem, removeItem, countItem } from '../core/inventory.js';

export const FEE = 0.05;
export const MAX_MINE = 5;
const HOUR = 3600000;
const PER_HOUR = 44;
const LIST_MINUTES = 45;

// A small seeded random.
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
const tens = (n) => Math.max(5, Math.round(n / 5) * 5);
export const clockOf = (world) => (world.dayClock?.() ?? new Date()).getTime();

// ---------- What can be traded, and its level ----------

// The level an etc item belongs to: the weakest monster that drops it, or its find's region.
const DROP_LEVEL = {};
for (const m of Object.values(MOBS)) for (const d of m.drops ?? []) DROP_LEVEL[d.id] = Math.min(DROP_LEVEL[d.id] ?? 99, m.level ?? 1);
export function itemLevel(id) {
  const def = ITEMS[id];
  if (def.type === 'equip') return def.reqLevel ?? 1;
  if (FISH_BY_ID[id]) return TIER_LV[FISH_BY_ID[id].tier] ?? 1;
  if (FIND_TIER[id]) return TIER_LV[FIND_TIER[id]] ?? 1;
  return DROP_LEVEL[id] ?? 1;
}
// The four counters: weapons, armour (the rest of the gear), materials, fish.
export function counterOf(id) {
  const def = ITEMS[id];
  if (def.type === 'equip') return def.slot === 'weapon' ? 'weapon' : 'armour';
  return FISH_BY_ID[id] ? 'fish' : 'material';
}
const tradable = (def) => def && def.price > 0 && !def.quest && !def.unique && !def.starter && def.type !== 'cash' && def.type !== 'use'
  && !(def.type === 'equip' && (def.reqLevel == null || def.design === 'cash'))
  && !(def.type === 'etc' && FISH_BY_ID[def.id] && (FISH_BY_ID[def.id].legend || FISH_BY_ID[def.id].boss))
  && !(def.type === 'etc' && !FISH_BY_ID[def.id] && DROP_LEVEL[def.id] == null && !FIND_TIER[def.id]);
let CATALOGUE = null;
const catalogue = () => (CATALOGUE ??= Object.values(ITEMS).filter(tradable).map((d) => d.id));
export const canTrade = (id) => tradable(ITEMS[id]);

// ---------- Prices ----------

// What an item is worth on the market today (a single copy, a plain roll): its base, times the
// day's drift (0.8 - 1.25, its own each day).
export function marketValue(world, id, rarity = 0) {
  const def = ITEMS[id];
  const base = def.type === 'equip' ? def.price * 0.2 * (1 + 0.8 * rarity) : def.price * 1.3;
  const day = Math.floor(clockOf(world) / (24 * HOUR));
  const drift = 0.8 + 0.45 * seeded(`${day}|${id}`)();
  return Math.max(2, base * drift);
}

// ---------- The listings ----------

const NAMES = ['Mochi', 'Pippin', 'Saffy', 'Tumble', 'Juno', 'Biscuit', 'Wren', 'Kiko', 'Bramblepaw', 'Nova', 'Lumi', 'Fable', 'Pebble', 'Clementine', 'Sora', 'Taffy', 'Rook', 'Nim', 'Quill', 'Marigold'];
const sellerNames = (world) => {
  const live = (world.bots?.list ?? []).map((b) => b.name).filter(Boolean);
  return live.length >= 6 ? live : NAMES;
};

// This hour's listings for your level (the same all hour, and the same for everyone at your
// level, so it feels like one market).
export function listings(world) {
  const now = clockOf(world);
  const hour = Math.floor(now / HOUR);
  const lv = world.char.level;
  const band = Math.floor(lv / 5);
  const cache = world.auctionCache;
  if (cache?.hour === hour && cache.band === band) return cache.list.filter((l) => !world.char.auction?.bought?.[l.key]);
  const rng = seeded(`${hour}|${band}`);
  // Each counter gets its share (there is far more gear than anything else).
  const COUNTERS = [['weapon', 0.24], ['armour', 0.3], ['material', 0.3], ['fish', 0.16]];
  const byCounter = Object.fromEntries(COUNTERS.map(([c]) => [c, catalogue().filter((id) => counterOf(id) === c)]));
  const nearOf = Object.fromEntries(COUNTERS.map(([c]) => [c, byCounter[c].filter((id) => Math.abs(itemLevel(id) - lv) <= 12)]));
  const names = sellerNames(world);
  const list = [];
  const picks = [];
  for (let i = 0; i < PER_HOUR; i++) {
    let u = rng();
    const counter = COUNTERS.find(([, w]) => (u -= w) < 0)?.[0] ?? 'material';
    const pool = rng() < 0.85 && nearOf[counter].length ? nearOf[counter] : byCounter[counter];
    // Some items come up several times (somebody's been farming).
    const id = pool[Math.floor(rng() * pool.length)];
    const copies = rng() < 0.2 ? 2 + Math.floor(rng() * 3) : 1;
    for (let c = 0; c < copies && picks.length < PER_HOUR; c++) picks.push(id);
  }
  const supply = {};
  for (const id of picks) supply[id] = (supply[id] ?? 0) + 1;
  picks.forEach((id, i) => {
    const def = ITEMS[id];
    const rarity = def.type === 'equip' && rng() < 0.25 ? (rng() < 0.75 ? 1 : 2) : 0;
    const qty = def.type === 'equip' ? 1 : [1, 3, 5, 10, 20][Math.floor(rng() * 5)];
    // The more copies up, the cheaper each: 6% off for each one past the first, down to 70%.
    const crowd = Math.max(0.7, 1 - 0.06 * (supply[id] - 1));
    const each = marketValue(world, id, rarity) * crowd * (0.88 + rng() * 0.3);
    const price = tens(each * qty);
    list.push({
      key: `${hour}|${band}|${i}`, id, qty, rarity, seller: names[Math.floor(rng() * names.length)],
      price, bid: tens(price * (0.5 + rng() * 0.15)), ends: hour * HOUR + (12 + rng() * 47) * 60000,
    });
  });
  world.auctionCache = { hour, band, list };
  return list.filter((l) => !world.char.auction?.bought?.[l.key]);
}

const state = (char) => (char.auction ??= { mine: [], box: [], bids: {}, bought: {} });
// What a listing gives you: a fresh piece of gear of its roll, or the stack.
const goodsOf = (l) => (ITEMS[l.id].type === 'equip' ? { inst: makeEquip(l.id, { rarity: l.rarity }) } : { id: l.id, qty: l.qty });

// Buys a listing outright. Returns why not, or null.
export function buyNow(world, key) {
  const char = world.char;
  const l = listings(world).find((x) => x.key === key);
  if (!l || l.ends <= clockOf(world)) return 'That one has just sold.';
  if (state(char).bids[key]) return 'You have a bid on it already: wait and see!';
  if (char.gold < l.price) return 'Not enough gold.';
  const g = goodsOf(l);
  if (!(g.inst ? addItem(char.inventory, g.inst) : addItem(char.inventory, g.id, g.qty))) return 'Your bag is full.';
  char.gold -= l.price;
  state(char).bought[key] = true;
  world.log(`You bought ${l.qty > 1 ? `${l.qty} ` : ''}${itemName(g.inst ?? l.id)} from ${l.seller} for ${l.price.toLocaleString()} gold.`, '#ffe36b');
  return null;
}

// The lowest bid that beats the current one.
export const nextBid = (l, mine) => tens(Math.max(l.bid, mine?.amount ?? 0) * 1.08 + 5);

// Bids on a listing: your gold is held while you lead. Returns why not, or null.
export function placeBid(world, key) {
  const char = world.char;
  const l = listings(world).find((x) => x.key === key);
  const now = clockOf(world);
  if (!l || l.ends <= now) return 'That auction has ended.';
  const a = state(char);
  const mine = a.bids[key];
  const amount = nextBid(l, mine);
  if (amount >= l.price) return 'At that price, just buy it outright!';
  const more = amount - (mine?.amount ?? 0);
  if (char.gold < more) return 'Not enough gold.';
  char.gold -= more;
  // Will someone outbid you before it ends? The lower your bid against the buyout, the likelier.
  const r = seeded(`${key}|${amount}`)();
  const lowness = 1 - amount / l.price;
  const outbidAt = r < Math.min(0.75, 0.1 + lowness) ? now + (l.ends - now) * (0.2 + 0.7 * seeded(`${key}|t|${amount}`)()) : null;
  a.bids[key] = { key, id: l.id, qty: l.qty, rarity: l.rarity, seller: l.seller, amount, ends: l.ends, outbidAt };
  world.log(`You bid ${amount.toLocaleString()} gold on ${itemName(l.id)}. Ends in ${Math.max(1, Math.ceil((l.ends - now) / 60000))} min.`, '#ffe9a6');
  return null;
}

// Lists something from your bag: `item` is an equip instance or { id, qty } (the whole stack of
// that id up to qty). Returns why not, or null.
export function listItem(world, item, price) {
  const char = world.char;
  const a = state(char);
  if (a.mine.length >= MAX_MINE) return `You can have ${MAX_MINE} things up at once.`;
  if (!canTrade(item.id)) return "Madame Ledger won't take that.";
  price = tens(price);
  if (price < 5) return 'Set a price first.';
  let goods;
  if (item.uid != null || ITEMS[item.id].type === 'equip') {
    const i = char.inventory.equip.indexOf(item);
    if (i < 0) return 'That is not in your bag.';
    char.inventory.equip.splice(i, 1);
    goods = { inst: item };
  } else {
    const qty = Math.min(item.qty, countItem(char.inventory, item.id));
    if (qty <= 0) return 'You have none left.';
    removeItem(char.inventory, item.id, qty);
    goods = { id: item.id, qty };
  }
  const now = clockOf(world);
  const rarity = goods.inst?.rarity ?? 0;
  const qty = goods.qty ?? 1;
  const market = marketValue(world, item.id, rarity) * qty;
  // How soon a trader buys it: about 3 minutes at the market price, sooner when it's a bargain,
  // much later when it's dear, never past 1.6x.
  const ratio = price / market;
  const wait = ratio > 1.6 ? null : 3 * 60000 * Math.exp((ratio - 1) * 3.2) * (0.6 + 0.8 * seeded(`${now}|${item.id}|${price}`)());
  const ends = now + LIST_MINUTES * 60000;
  a.mine.push({ key: `mine|${now}|${item.id}`, ...goods, id: item.id, price, listed: now, ends, sellAt: wait != null && now + wait < ends ? now + wait : null });
  world.log(`You listed ${qty > 1 ? `${qty} ` : ''}${itemName(goods.inst ?? item.id)} for ${price.toLocaleString()} gold.`, '#ffe9a6');
  return null;
}
// Takes a listing of yours down (it goes to your collection box).
export function cancelListing(world, key) {
  const a = state(world.char);
  const i = a.mine.findIndex((m) => m.key === key);
  if (i < 0) return;
  const [m] = a.mine.splice(i, 1);
  a.box.push({ kind: 'item', inst: m.inst, id: m.id, qty: m.qty, why: 'Taken down' });
}

// Settles whatever has happened since you last looked: your listings selling or coming back,
// your bids won or outbid. Runs every second or so (and when the window opens).
export function tickAuction(world) {
  const char = world.char;
  const a = char.auction;
  if (!a) return;
  const now = clockOf(world);
  for (const m of [...a.mine]) {
    if (m.sellAt != null && m.sellAt <= now) {
      const gold = Math.max(1, Math.round(m.price * (1 - FEE)));
      a.box.push({ kind: 'gold', gold, why: `Sold ${itemName(m.inst ?? m.id)}` });
      a.mine.splice(a.mine.indexOf(m), 1);
      world.log?.(`Your ${itemName(m.inst ?? m.id)} sold for ${m.price.toLocaleString()} gold! Collect it at the Auction House.`, '#ffe36b');
    } else if (m.ends <= now) {
      a.box.push({ kind: 'item', inst: m.inst, id: m.id, qty: m.qty, why: 'Unsold' });
      a.mine.splice(a.mine.indexOf(m), 1);
      world.log?.(`Nobody bought your ${itemName(m.inst ?? m.id)}. It's back in your collection box.`, '#d4cbe8');
    }
  }
  for (const b of Object.values(a.bids)) {
    if (b.outbidAt != null && b.outbidAt <= now) {
      a.box.push({ kind: 'gold', gold: b.amount, why: `Outbid on ${itemName(b.id)}` });
      delete a.bids[b.key];
      a.bought[b.key] = true;
      world.log?.(`Someone outbid you on ${itemName(b.id)}! Your ${b.amount.toLocaleString()} gold is back in your collection box.`, '#ffb3c6');
    } else if (b.ends <= now) {
      const l = { id: b.id, qty: b.qty, rarity: b.rarity };
      const g = goodsOf(l);
      a.box.push({ kind: 'item', inst: g.inst, id: b.id, qty: g.qty, why: `Won from ${b.seller}` });
      delete a.bids[b.key];
      a.bought[b.key] = true;
      world.log?.(`You won the auction for ${itemName(b.id)}! Collect it at the Auction House.`, '#ffe36b');
    }
  }
  // (Old purchases from past hours are forgotten.)
  const hour = Math.floor(now / HOUR);
  for (const k of Object.keys(a.bought)) if (Number(k.split('|')[0]) < hour - 1) delete a.bought[k];
}

// Takes everything in the collection box that fits. Returns how much is left.
export function collectAll(world) {
  const char = world.char;
  const a = state(char);
  const left = [];
  for (const e of a.box) {
    if (e.kind === 'gold') char.gold += e.gold;
    else if (!(e.inst ? addItem(char.inventory, e.inst) : addItem(char.inventory, e.id, e.qty))) left.push(e);
  }
  a.box = left;
  if (left.length) world.log('Your bag is full: the rest stays in your collection box.', '#ffb3c6');
  return left.length;
}
