// The storage chest every hero in a world shares (the world's `storage`, core/save.js): an
// inventory of its own (Equip, Use and Etc, TAB_SIZE cells each). A move takes the whole cell
// (one piece of gear, or a whole stack) from one side to the other, and only when all of it fits,
// so nothing is ever split, lost or doubled.

import { ITEMS } from '../data/items.js';
import { TAB_SIZE, STACK_MAX } from './inventory.js';

export const STORAGE_TABS = ['equip', 'use', 'etc'];

// Whether `qty` of a stackable `id` fits in a tab (topping up stacks first, then new cells).
function fits(list, entry) {
  if (entry.qty == null) return list.length < TAB_SIZE;
  const max = ITEMS[entry.id].stack ?? STACK_MAX;
  let left = entry.qty;
  for (const s of list) if (s.id === entry.id) left -= Math.max(0, max - s.qty);
  return left <= 0 || list.length + Math.ceil(left / max) <= TAB_SIZE;
}

function put(list, entry) {
  if (entry.qty == null) {
    list.push(entry);
    return;
  }
  const max = ITEMS[entry.id].stack ?? STACK_MAX;
  let left = entry.qty;
  for (const s of list) {
    if (s.id !== entry.id || s.qty >= max) continue;
    const take = Math.min(left, max - s.qty);
    s.qty += take;
    left -= take;
  }
  while (left > 0) {
    const take = Math.min(left, max);
    list.push({ id: entry.id, qty: take });
    left -= take;
  }
}

// Puts `qty` of an Etc item straight into a world's storage (whoever lives on your island picking
// your ripe crops for you: world/home.js), only if all of it fits. Returns true when it went in.
export function stashItem(world, id, qty) {
  world.storage ??= {};
  const list = (world.storage.etc ??= []);
  const entry = { id, qty };
  if (!ITEMS[id] || !fits(list, entry)) return false;
  put(list, entry);
  return true;
}

// Moves cell `i` of `tab` from one inventory to the other. Returns true when it moved.
function move(from, to, tab, i) {
  const list = from[tab];
  const entry = list?.[i];
  if (!entry || !STORAGE_TABS.includes(tab)) return false;
  to[tab] ??= [];
  if (!fits(to[tab], entry)) return false;
  list.splice(i, 1);
  put(to[tab], entry);
  return true;
}

export const storeItem = (char, world, tab, i) => move(char.inventory, world.storage, tab, i);
// (A retired piece of gear left in the chest from before, data/items.js, sells itself back to the
// hero who takes it, for what a shop pays, instead of landing in the bag as a look.)
export function takeItem(char, world, tab, i) {
  const entry = world.storage[tab]?.[i];
  if (entry && ITEMS[entry.id]?.retiredGear) {
    world.storage[tab].splice(i, 1);
    char.gold = (char.gold ?? 0) + Math.max(1, Math.floor((ITEMS[entry.id].price || 0) * 0.1)) * (entry.qty ?? 1);
    return true;
  }
  return move(world.storage, char.inventory, tab, i);
}
