// Item instances: what a specific sword or hat in your bag looks like.
// Definitions live in data/items.js; instances carry their stats, rarity, color and polish.

import { ITEMS, RARITIES, variantsFor } from '../data/items.js';

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

// Picks a variant for dropped gear: most come in a color, rarer colors less often.
export function rollVariant(def, rng = Math.random, chance = 0.75) {
  const table = variantsFor(def);
  if (!table || rng() >= chance) return null;
  const entries = Object.entries(table);
  let r = rng() * entries.reduce((sum, [, v]) => sum + v.weight, 0);
  for (const [k, v] of entries) if ((r -= v.weight) < 0) return k;
  return entries[0][0];
}

// A cash outfit piece: no stats, just its look and color.
export function makeCash(id, variant = null) {
  if (variant && !variantsFor(ITEMS[id])?.[variant]) variant = null;
  return { uid: nextUid++, id, ...(variant ? { variant } : {}) };
}

// An item's display name, with its color or gem in front ("Dark Knight Helm", "Ruby Pearl Drops").
export function itemName(idOrInst) {
  const inst = typeof idOrInst === 'string' ? null : idOrInst;
  const def = ITEMS[inst ? inst.id : idOrInst];
  if (!def) return '???';
  const v = inst?.variant ? variantsFor(def)?.[inst.variant] : null;
  return v ? `${v.name} ${def.name}` : def.name;
}

// The colors an item is shown in: its variant's, or its own.
export function itemColors(idOrInst) {
  const inst = typeof idOrInst === 'string' ? null : idOrInst;
  const def = ITEMS[inst ? inst.id : idOrInst];
  const v = inst?.variant ? variantsFor(def)?.[inst.variant] : null;
  return { main: v?.main ?? def?.color ?? '#ffffff', accent: v?.accent ?? null, variant: v ? inst.variant : null };
}

// Creates an equipment instance: a rarity, and a color (a look only; `variant: 'roll'` picks one
// at random).
export function makeEquip(id, { rng = Math.random, rarity = 0, variant = null } = {}) {
  const def = ITEMS[id];
  if (variant === 'roll') variant = rollVariant(def, rng);
  if (variant && !variantsFor(def)?.[variant]) variant = null;
  const bonus = RARITY_BONUS[rarity];
  const stats = {};
  for (const [k, v] of Object.entries(def.stats)) stats[k] = Math.max(1, Math.round(v * bonus.mult));
  const pool = [...MAIN_STATS];
  for (let i = 0; i < bonus.stats; i++) {
    const k = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    stats[k] = (stats[k] ?? 0) + bonus.amount;
  }
  return { uid: nextUid++, id, stats, rarity, ...(variant ? { variant } : {}) };
}

// ---------- Polishing (Tora's forge) ----------
// A favourite piece can be polished up to +10, a little stronger each time. Each try costs gold
// (more for higher levels and higher polish) and gets less likely to take; a try that doesn't take
// only costs the gold, never the item.
export const POLISH_MAX = 10;
const POLISH_CHANCE = [0.95, 0.9, 0.85, 0.8, 0.7, 0.6, 0.5, 0.42, 0.36, 0.3];

export const polishChance = (inst) => POLISH_CHANCE[inst.polish ?? 0] ?? 0;
export function polishCost(inst) {
  const L = ITEMS[inst.id].reqLevel ?? 0;
  return Math.round((150 + L * L * 3 + L * 40) * (1 + (inst.polish ?? 0) * 0.6));
}
// What one more step adds: attack on a weapon (magic attack on a wand or staff), magic and MP on an
// earring, defense and HP on everything else.
export function polishGain(inst) {
  const def = ITEMS[inst.id];
  const L = def.reqLevel ?? 0;
  if (def.slot === 'weapon') return { [def.weaponType === 'wand' || def.weaponType === 'staff' ? 'matk' : 'watk']: 1 + Math.floor(L / 15) };
  if (def.slot === 'earring') return { matk: 1 + Math.floor(L / 20), mp: 10 + L };
  return { wdef: 2 + Math.floor(L / 8), hp: 5 + L };
}
// One try. Returns { ok, why } (why: 'max' or 'gold' when it couldn't be tried).
export function polish(char, inst, rng = Math.random) {
  if ((inst.polish ?? 0) >= POLISH_MAX) return { ok: false, why: 'max' };
  const cost = polishCost(inst);
  if (char.gold < cost) return { ok: false, why: 'gold' };
  char.gold -= cost;
  if (rng() >= polishChance(inst)) return { ok: false, why: null };
  for (const [k, v] of Object.entries(polishGain(inst))) inst.stats[k] = (inst.stats[k] ?? 0) + v;
  inst.polish = (inst.polish ?? 0) + 1;
  return { ok: true, why: null };
}
