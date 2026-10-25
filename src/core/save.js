// Saving and loading characters in localStorage, one key per character slot. Buffs and timers aren't saved.

import { setNextUid } from './items.js';
import { ITEMS } from '../data/items.js';

// Slot 0 keeps the original key so saves from before character slots still load.
export const SLOTS = 8;
const keyFor = (slot = 0) => (slot ? `twzt-save-v1-${slot}` : 'twzt-save-v1');

export function saveGame(char) {
  try {
    const data = { ...char, buffs: {}, savedAt: Date.now() };
    localStorage.setItem(keyFor(char.slot), JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(slot = 0) {
  try {
    const raw = localStorage.getItem(keyFor(slot));
    if (!raw) return null;
    const char = JSON.parse(raw);
    char.slot = slot;
    dropRetiredItems(char);
    // Keep new item ids from colliding with saved ones.
    const all = [...Object.values(char.equipment).filter(Boolean), ...char.inventory.equip];
    setNextUid(Math.max(0, ...all.map((i) => i.uid)) + 1);
    char.buffs = {};
    return char;
  } catch {
    return null;
  }
}

// Items removed from the game since the save was made (like the old weapon lines) are dropped,
// so an old save never refers to something that no longer exists.
export function dropRetiredItems(char) {
  for (const [slot, inst] of Object.entries(char.equipment)) if (inst && !ITEMS[inst.id]) char.equipment[slot] = null;
  for (const tab of Object.keys(char.inventory)) char.inventory[tab] = char.inventory[tab].filter((e) => ITEMS[e.id]);
  for (const [code, b] of Object.entries(char.hotkeys ?? {})) if (b?.item && !ITEMS[b.item]) char.hotkeys[code] = null;
  return char;
}

export function hasSave(slot = 0) {
  try {
    return Boolean(localStorage.getItem(keyFor(slot)));
  } catch {
    return false;
  }
}

export function deleteSave(slot = 0) {
  try {
    localStorage.removeItem(keyFor(slot));
  } catch {
    // Storage may be unavailable (private mode); nothing to delete.
  }
}
