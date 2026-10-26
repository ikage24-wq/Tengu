// Inventory with three tabs. Equipment is one item per cell; Use and Etc items stack (up to
// STACK_MAX, or the item's own `stack`, like a set of throwing stars).

import { ITEMS } from '../data/items.js';
import { makeEquip } from './items.js';

export const TAB_SIZE = 32;
export const STACK_MAX = 200;

export function createInventory() {
  return { equip: [], use: [], etc: [], cash: [] };
}

export function tabFor(id) {
  return ITEMS[id].type; // 'equip' | 'use' | 'etc' | 'cash'
}

// Adds an item. `item` is either an equip instance or an item id. Returns true if it fit.
export function addItem(inv, item, qty = 1) {
  if (typeof item === 'object') {
    // Equipment and cash outfits are one item per cell.
    const list = (inv[tabFor(item.id)] ??= []);
    if (list.length >= TAB_SIZE) return false;
    list.push(item);
    return true;
  }
  const tab = tabFor(item);
  if (tab === 'equip') {
    for (let i = 0; i < qty; i++) if (!addItem(inv, makeEquip(item))) return false;
    return true;
  }
  const list = inv[tab];
  const max = ITEMS[item].stack ?? STACK_MAX;
  let left = qty;
  for (const stack of list) {
    if (stack.id !== item || stack.qty >= max) continue;
    const take = Math.min(left, max - stack.qty);
    stack.qty += take;
    left -= take;
    if (!left) return true;
  }
  while (left > 0) {
    if (list.length >= TAB_SIZE) return false;
    const take = Math.min(left, max);
    list.push({ id: item, qty: take });
    left -= take;
  }
  return true;
}

export function countItem(inv, id) {
  const tab = tabFor(id);
  if (tab === 'equip') return inv.equip.filter((e) => e.id === id).length;
  return inv[tab].filter((s) => s.id === id).reduce((n, s) => n + s.qty, 0);
}

// Removes up to `qty` of a stackable item. Returns how many were removed.
export function removeItem(inv, id, qty = 1) {
  const list = inv[tabFor(id)];
  let left = qty;
  for (let i = list.length - 1; i >= 0 && left > 0; i--) {
    if (list[i].id !== id) continue;
    const take = Math.min(left, list[i].qty);
    list[i].qty -= take;
    left -= take;
    if (list[i].qty <= 0) list.splice(i, 1);
  }
  return qty - left;
}

// The throwing stars a gauntlet throws: the topmost set in the Use tab your level allows.
export function activeStar(char) {
  return char.inventory.use.find((e) => ITEMS[e.id].star && e.qty > 0 && char.level >= ITEMS[e.id].reqLevel) ?? null;
}

// Uses up `n` stars from the active set (a set that runs out is gone). Returns the set's item
// def, or null if there were none.
export function useStars(char, n = 1) {
  const stack = activeStar(char);
  if (!stack) return null;
  stack.qty -= n;
  if (stack.qty <= 0) char.inventory.use.splice(char.inventory.use.indexOf(stack), 1);
  return ITEMS[stack.id];
}

// Recharging a set of throwing stars back to full costs what the missing stars are worth.
export function rechargePrice(def, qty) {
  return Math.ceil(((def.stack - qty) * def.price) / def.stack);
}
