// Saving and loading the character in localStorage. Buffs and timers aren't saved.

import { setNextUid } from './items.js';

const KEY = 'twzt-save-v1';

export function saveGame(char) {
  try {
    const data = { ...char, buffs: {}, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const char = JSON.parse(raw);
    // Keep new item ids from colliding with saved ones.
    const all = [...Object.values(char.equipment).filter(Boolean), ...char.inventory.equip];
    setNextUid(Math.max(0, ...all.map((i) => i.uid)) + 1);
    char.buffs = {};
    return char;
  } catch {
    return null;
  }
}

export function hasSave() {
  try {
    return Boolean(localStorage.getItem(KEY));
  } catch {
    return false;
  }
}

export function deleteSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Storage may be unavailable (private mode); nothing to delete.
  }
}
