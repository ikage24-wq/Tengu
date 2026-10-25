// Inventory with three tabs. Equipment is one item per cell; Use and Etc items stack.

import { ITEMS } from '../data/items.js';
import { makeEquip } from './items.js';

export const TAB_SIZE = 32;
export const STACK_MAX = 200;

export function createInventory() {
  return { equip: [], use: [], etc: [] };
}

export function tabFor(id) {
  return ITEMS[id].type; // 'equip' | 'use' | 'etc'
}

// Adds an item. `item` is either an equip instance or an item id. Returns true if it fit.
export function addItem(inv, item, qty = 1) {
  if (typeof item === 'object') {
    if (inv.equip.length >= TAB_SIZE) return false;
    inv.equip.push(item);
    return true;
  }
  const tab = tabFor(item);
  if (tab === 'equip') {
    for (let i = 0; i < qty; i++) if (!addItem(inv, makeEquip(item))) return false;
    return true;
  }
  const list = inv[tab];
  let left = qty;
  for (const stack of list) {
    if (stack.id !== item || stack.qty >= STACK_MAX) continue;
    const take = Math.min(left, STACK_MAX - stack.qty);
    stack.qty += take;
    left -= take;
    if (!left) return true;
  }
  while (left > 0) {
    if (list.length >= TAB_SIZE) return false;
    const take = Math.min(left, STACK_MAX);
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
