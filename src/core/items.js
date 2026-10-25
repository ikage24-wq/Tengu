// Item instances: what a specific sword or hat in your bag looks like.
// Definitions live in data/items.js; instances carry rolled stats and upgrade state.

import { ITEMS, UPGRADE_SLOTS, RARITIES, variantsFor } from '../data/items.js';
import { FAMILY_STATS } from '../data/jobs.js';

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

// The stats a color variant adds, growing with the item's level. Job gear knows its family's main
// and second stat; weapons use their type's main stat (and a mage's for wands and staves).
export function variantStats(def, key) {
  const table = variantsFor(def);
  if (!table?.[key]) return {};
  const L = def.reqLevel;
  const n = 2 + Math.floor(L / 6);
  if (def.slot === 'earring') {
    const stat = table[key].stat;
    return stat === 'all' ? { str: Math.ceil(n / 2), dex: Math.ceil(n / 2), int: Math.ceil(n / 2), luk: Math.ceil(n / 2) } : { [stat]: n };
  }
  const family = def.family ?? (def.weaponType === 'wand' || def.weaponType === 'staff' ? 'mage' : null);
  const fam = FAMILY_STATS[family] ?? { primary: def.main ?? 'str', secondary: 'dex' };
  const magic = family === 'mage';
  switch (key) {
    case 'dark': return { [fam.primary]: n };
    case 'white': return { [fam.secondary]: n };
    case 'crimson': return { [magic ? 'matk' : 'watk']: 1 + Math.floor(L / 12) };
    case 'azure': return { wdef: 2 + Math.floor(L / 5), mdef: 2 + Math.floor(L / 5), hp: 15 + L * 3 };
    case 'gilded': return { str: Math.ceil(n / 3), dex: Math.ceil(n / 3), int: Math.ceil(n / 3), luk: Math.ceil(n / 3), [magic ? 'matk' : 'watk']: 1 + Math.floor(L / 25) };
    default: return {};
  }
}

// Picks a variant for dropped gear: most come in a color, rarer colors less often.
export function rollVariant(def, rng = Math.random, chance = 0.75) {
  const table = variantsFor(def);
  if (!table || rng() >= chance) return null;
  const entries = Object.entries(table);
  let r = rng() * entries.reduce((sum, [, v]) => sum + v.weight, 0);
  for (const [k, v] of entries) if ((r -= v.weight) < 0) return k;
  return entries[0][0];
}

// What a shop charges for an item in a color: a bit more, and a lot more for Gilded or Diamond.
export function variantPrice(def, key) {
  if (!key) return def.price;
  return Math.round(def.price * (key === 'gilded' || key === 'diamond' ? 2 : 1.4));
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

// Creates an equipment instance. Drops pass `variance` so no two are quite alike, a rarity, and a
// color variant (`variant: 'roll'` picks one at random).
export function makeEquip(id, { variance = 0, rng = Math.random, rarity = 0, variant = null } = {}) {
  const def = ITEMS[id];
  if (variant === 'roll') variant = rollVariant(def, rng);
  if (variant && !variantsFor(def)?.[variant]) variant = null;
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
  for (const [k, v] of Object.entries(variantStats(def, variant))) stats[k] = (stats[k] ?? 0) + v;
  return { uid: nextUid++, id, stats, slotsLeft: UPGRADE_SLOTS, upgrades: 0, rarity, ...(variant ? { variant } : {}) };
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
