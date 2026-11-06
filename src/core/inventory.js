// Inventory with five tabs: Equip, Use, Etc, Materials and Cash. Equipment and Cash pieces are one
// item per cell; Use, Etc and Materials items stack (up to STACK_MAX, or the item's own `stack`).
// Materials are the life skills' haul (fish, gathered finds, crafted materials): they are Etc
// items by type, kept in a pocket of their own so they never crowd out monster drops and quest
// things (the player's call, 2026-11-06, with the tabs doubled to 64).

import { ITEMS } from '../data/items.js';
import { makeEquip } from './items.js';

export const TAB_SIZE = 64;
export const STACK_MAX = 200;

export function createInventory() {
  return { equip: [], use: [], etc: [], mats: [], cash: [] };
}

// A life-skill material: a fish, a gathered find, or something crafted to craft with (not a tool).
export const isMaterial = (def) => Boolean(def && def.type === 'etc' && (def.fish || def.gathered || (def.crafted && !def.tool)));

// The bag tab an item goes in: 'equip' | 'use' | 'etc' | 'mats' | 'cash'.
export function tabFor(id) {
  const def = ITEMS[id];
  return isMaterial(def) ? 'mats' : def.type;
}

// An old bag (or chest) from before the Materials pocket: give it the pocket and move its
// materials over from Etc.
export function settleBag(inv) {
  if (!inv) return inv;
  for (const tab of Object.keys(createInventory())) inv[tab] ??= [];
  const moving = inv.etc.filter((e) => isMaterial(ITEMS[e.id]));
  if (moving.length) {
    inv.etc = inv.etc.filter((e) => !moving.includes(e));
    inv.mats.push(...moving);
  }
  return inv;
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
  const list = (inv[tab] ??= []);
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
  return (inv[tab] ?? []).filter((s) => s.id === id).reduce((n, s) => n + s.qty, 0);
}

// Removes up to `qty` of a stackable item. Returns how many were removed.
export function removeItem(inv, id, qty = 1) {
  const list = inv[tabFor(id)] ?? [];
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

// Tidies a tab: partial stacks of the same item merge, then items line up by kind. Equipment
// goes by slot, then highest level and rarity first; stackables follow the catalogue's order.
const SLOT_ORDER = ['weapon', 'hat', 'face', 'top', 'bottom', 'shoes', 'gloves', 'cape', 'earring', 'ring', 'charm'];
let catalogue = null;
export function sortTab(inv, tab) {
  const list = inv[tab];
  if (!list) return;
  catalogue ??= new Map(Object.keys(ITEMS).map((id, i) => [id, i]));
  if (tab === 'use' || tab === 'etc' || tab === 'mats') {
    const merged = [];
    for (const e of list) {
      const def = ITEMS[e.id];
      const max = def.stack ?? STACK_MAX;
      let left = e.qty;
      for (const m of merged) {
        if (m.id !== e.id || m.qty >= max) continue;
        const take = Math.min(left, max - m.qty);
        m.qty += take;
        left -= take;
        if (!left) break;
      }
      if (left) merged.push({ ...e, qty: left });
    }
    list.splice(0, list.length, ...merged);
  }
  const rank = (e) => {
    const def = ITEMS[e.id];
    if (tab === 'equip' || tab === 'cash') return [SLOT_ORDER.indexOf(def.slot), -(def.reqLevel ?? 0), -(e.rarity ?? 0), catalogue.get(e.id)];
    return [catalogue.get(e.id)];
  };
  const keyed = list.map((e, i) => ({ e, k: [...rank(e), i] }));
  keyed.sort((a, b) => {
    for (let j = 0; j < a.k.length; j++) if (a.k[j] !== b.k[j]) return a.k[j] - b.k[j];
    return 0;
  });
  list.splice(0, list.length, ...keyed.map((x) => x.e));
}

// Moves the item in cell `from` to cell `to` of a tab: onto another item they swap places, onto
// the same stackable item they merge (as far as the stack allows), and past the end it goes
// last. Returns true when anything moved.
export function moveItem(inv, tab, from, to) {
  const list = inv[tab];
  const a = list?.[from];
  if (!a || from === to) return false;
  if (to >= list.length) {
    list.splice(from, 1);
    list.push(a);
    return true;
  }
  const b = list[to];
  const def = ITEMS[a.id];
  if (b.id === a.id && a.uid == null && b.uid == null) {
    const max = def.stack ?? STACK_MAX;
    const take = Math.min(a.qty, max - b.qty);
    if (take <= 0) {
      list[from] = b;
      list[to] = a;
      return true;
    }
    b.qty += take;
    a.qty -= take;
    if (a.qty <= 0) list.splice(from, 1);
    return true;
  }
  list[from] = b;
  list[to] = a;
  return true;
}
