// Item instances: what a specific sword or hat in your bag looks like.
// Definitions live in data/items.js; instances carry rolled stats and upgrade state.

import { ITEMS, UPGRADE_SLOTS } from '../data/items.js';

let nextUid = 1;

export function setNextUid(n) {
  nextUid = Math.max(nextUid, n);
}

// Creates an equipment instance. Drops pass `variance` so no two are quite alike.
export function makeEquip(id, { variance = 0, rng = Math.random } = {}) {
  const def = ITEMS[id];
  const stats = {};
  for (const [k, v] of Object.entries(def.stats)) {
    const swing = variance ? Math.round((rng() * 2 - 1) * Math.max(1, v * variance)) : 0;
    stats[k] = Math.max(1, v + swing);
  }
  return { uid: nextUid++, id, stats, slotsLeft: UPGRADE_SLOTS, upgrades: 0 };
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
