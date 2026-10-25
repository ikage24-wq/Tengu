// Item instances: what a specific sword or hat in your bag looks like.
// Definitions live in data/items.js; instances carry rolled stats and upgrade state.

import { ITEMS, UPGRADE_SLOTS, RARITIES } from '../data/items.js';

let nextUid = 1;

export function setNextUid(n) {
  nextUid = Math.max(nextUid, n);
}

// Rolls a rarity for dropped gear: 0 Normal, 1 Rare, 2 Epic, 3 Legendary.
export function rollRarity(rng = Math.random) {
  const r = rng();
  for (let i = RARITIES.length - 1; i > 0; i--) if (r < RARITIES[i].chance) return i;
  return 0;
}

const MAIN_STATS = ['str', 'dex', 'int', 'luk'];
// Rarer gear multiplies its stats and adds main stats: Rare one, Epic two, Legendary all four.
const RARITY_BONUS = [
  { mult: 1, stats: 0, amount: 0 },
  { mult: 1.1, stats: 1, amount: 3 },
  { mult: 1.2, stats: 2, amount: 4 },
  { mult: 1.35, stats: 4, amount: 5 },
];

// Creates an equipment instance. Drops pass `variance` so no two are quite alike, and a rarity.
export function makeEquip(id, { variance = 0, rng = Math.random, rarity = 0 } = {}) {
  const def = ITEMS[id];
  const bonus = RARITY_BONUS[rarity];
  const stats = {};
  for (const [k, v] of Object.entries(def.stats)) {
    const swing = variance ? Math.round((rng() * 2 - 1) * Math.max(1, v * variance)) : 0;
    stats[k] = Math.max(1, Math.round((v + swing) * bonus.mult));
  }
  const pool = [...MAIN_STATS];
  for (let i = 0; i < bonus.stats; i++) {
    const k = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    stats[k] = (stats[k] ?? 0) + bonus.amount;
  }
  return { uid: nextUid++, id, stats, slotsLeft: UPGRADE_SLOTS, upgrades: 0, rarity };
}

export function canScroll(inst, scrollDef) {
  const def = ITEMS[inst.id];
  return inst.slotsLeft > 0 && scrollDef.scroll.slots.includes(def.slot);
}

// Applies an upgrade scroll. Spends a slot either way; on success, adds the scroll's stats.
export function applyScroll(inst, scrollDef, rng = Math.random) {
  if (!canScroll(inst, scrollDef)) return { ok: false, used: false };
  inst.slotsLeft -= 1;
  const ok = rng() < scrollDef.scroll.chance;
  if (ok) {
    inst.upgrades += 1;
    for (const [k, v] of Object.entries(scrollDef.scroll.stats)) inst.stats[k] = (inst.stats[k] ?? 0) + v;
  }
  return { ok, used: true };
}
