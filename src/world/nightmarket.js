// The Coinbridge Night Market (render/coinbridge.js draws it; the Masked Moth's page, ui/nightmarket.js).
//
// After dusk the cargo on the Canal Docks is cleared away and the night traders set up: lantern
// stalls on the quay, paper lanterns strung overhead, a lantern boat drifting on the canal, and the
// Masked Moth, who is only ever there at night (`night: true` townsfolk keep to the dark). Each
// night she has:
//   an oddity   one pricey thing you can't buy anywhere else (a capsule ticket, an Epic piece of
//               gear of your level, a crate of night finds), once
//   three wares rare one-offs near your level (a Rare or Epic roll, a stack of night-only finds,
//               glowing bait), a little under the market, each once
// Tonight's goods are the same all night and new the next (worked out from the night and your
// name). char.nightBought = { night, keys: [] }.

import { NPCS } from '../data/npcs.js';
import { ITEMS } from '../data/items.js';
import { TIER_FINDS, TIER_LV } from '../data/gathering.js';
import { makeEquip, itemName } from '../core/items.js';
import { addItem } from '../core/inventory.js';
import { clockNight } from './daytime.js';
import { marketValue, canTrade, itemLevel, counterOf, clockOf } from './auction.js';

// Someone who keeps to the dark, while it's light (they aren't there).
export const awayNow = (world, n) => Boolean(NPCS[n.id]?.night) && !clockNight(world);

function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
const fives = (n) => Math.max(5, Math.round(n / 5) * 5);

// Which night it is: the game's night runs from dusk past midnight, so the hours after midnight
// belong to the night before (a game day is DAY_MINUTES real minutes).
const nightOf = (world) => Math.floor((clockOf(world) - 6 * 60000) / (24 * 60000));
const tierFor = (lv) => (lv >= TIER_LV[4] ? 4 : lv >= TIER_LV[3] ? 3 : lv >= TIER_LV[2] ? 2 : 1);

// Tonight's goods: [oddity, ...wares], each { key, kind: 'gear' | 'stack', id, qty, rarity, price, name }.
export function tonight(world) {
  const char = world.char;
  const night = nightOf(world);
  if (world.nightCache?.night === night && world.nightCache.lv === char.level) return world.nightCache.list;
  const rng = seeded(`${night}|${char.name ?? ''}|moth`);
  const lv = char.level;
  const tier = tierFor(lv);
  const gear = Object.values(ITEMS).filter((d) => d.type === 'equip' && canTrade(d.id) && Math.abs(itemLevel(d.id) - lv) <= 6).map((d) => d.id);
  const pickGear = () => gear[Math.floor(rng() * gear.length)];
  const nightFind = TIER_FINDS[tier]?.night;
  const list = [];
  // The oddity.
  const o = Math.floor(rng() * 3);
  if (o === 0) list.push({ kind: 'stack', id: 'gacha_ticket', qty: 1, price: fives(4000 + lv * 120), name: 'A capsule ticket, from somewhere far away' });
  else if (o === 1 && gear.length) {
    const id = pickGear();
    list.push({ kind: 'gear', id, qty: 1, rarity: 2, price: fives(marketValue(world, id, 2) * 2.2), name: `An Epic ${ITEMS[id].name}` });
  } else list.push({ kind: 'stack', id: nightFind ?? 'stardust', qty: 20, price: fives(ITEMS[nightFind ?? 'stardust'].price * 20 * 2.4), name: 'A crate of things that only grow at night' });
  // Three wares.
  for (let i = 0; i < 3; i++) {
    const r = rng();
    if (r < 0.45 && gear.length) {
      const id = pickGear();
      const rarity = rng() < 0.7 ? 1 : 2;
      list.push({ kind: 'gear', id, qty: 1, rarity, price: fives(marketValue(world, id, rarity) * 0.85) });
    } else if (r < 0.75 && nightFind) list.push({ kind: 'stack', id: nightFind, qty: 5, price: fives(ITEMS[nightFind].price * 5 * 1.1) });
    else list.push({ kind: 'stack', id: 'lantern_bait', qty: 10, price: fives(ITEMS.lantern_bait.price * 10 * 0.8) });
  }
  list.forEach((x, i) => (x.key = `${night}|${i}`));
  world.nightCache = { night, lv: char.level, list };
  return list;
}

export const boughtTonight = (world, key) => {
  const b = world.char.nightBought;
  return b?.night === nightOf(world) && b.keys.includes(key);
};

// Buys one of tonight's goods. Returns why not, or null.
export function buyNight(world, key) {
  const char = world.char;
  if (!clockNight(world)) return 'The Night Market has packed up. Come back after dusk.';
  const g = tonight(world).find((x) => x.key === key);
  if (!g || boughtTonight(world, key)) return 'Sold out tonight.';
  if (char.gold < g.price) return 'Not enough gold.';
  const ok = g.kind === 'gear' ? addItem(char.inventory, makeEquip(g.id, { rarity: g.rarity, variant: 'roll' })) : addItem(char.inventory, g.id, g.qty);
  if (!ok) return 'Your bag is full.';
  char.gold -= g.price;
  const night = nightOf(world);
  if (char.nightBought?.night !== night) char.nightBought = { night, keys: [] };
  char.nightBought.keys.push(key);
  world.log(`The Masked Moth wraps up ${g.qty > 1 ? `${g.qty} ` : ''}${itemName(g.id)} for you. ${g.price.toLocaleString()} gold.`, '#c9a6ff');
  return null;
}
export { counterOf };
