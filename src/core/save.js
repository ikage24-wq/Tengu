// Saving and loading characters in localStorage, one key per character slot. Buffs and timers aren't saved.

import { setNextUid, makeEquip } from './items.js';
import { ITEMS, RENAMED_ITEMS } from '../data/items.js';
import { STARTING_CASH } from '../data/cash.js';
import { JOBS, RETIRED_JOBS } from '../data/jobs.js';
import { SKILLS } from '../data/skills.js';

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
    // Saves from before outfits get the starting Cash and empty outfit slots.
    char.outfit ??= {};
    char.cash ??= STARTING_CASH;
    char.inventory.cash ??= [];
    dropRetiredItems(char);
    updateRetiredJobs(char);
    // Keep new item ids from colliding with saved ones.
    const all = [...Object.values(char.equipment).filter(Boolean), ...Object.values(char.outfit).filter(Boolean), ...char.inventory.equip, ...char.inventory.cash];
    setNextUid(Math.max(0, ...all.map((i) => i.uid)) + 1);
    giveStartingOutfit(char);
    char.buffs = {};
    return char;
  } catch {
    return null;
  }
}

// Items removed from the game since the save was made (like the old weapon lines) are dropped,
// so an old save never refers to something that no longer exists.
export function dropRetiredItems(char) {
  // Renamed items (the old weapon tiers) become their replacements first.
  const rename = (e) => e && RENAMED_ITEMS[e.id] && (e.id = RENAMED_ITEMS[e.id]);
  Object.values(char.equipment).forEach(rename);
  for (const tab of Object.keys(char.inventory)) char.inventory[tab].forEach(rename);
  for (const b of Object.values(char.hotkeys ?? {})) if (b?.item && RENAMED_ITEMS[b.item]) b.item = RENAMED_ITEMS[b.item];
  for (const [slot, inst] of Object.entries(char.equipment)) if (inst && !ITEMS[inst.id]) char.equipment[slot] = null;
  for (const [slot, inst] of Object.entries(char.outfit ?? {})) if (inst && !ITEMS[inst.id]) char.outfit[slot] = null;
  for (const tab of Object.keys(char.inventory)) char.inventory[tab] = char.inventory[tab].filter((e) => ITEMS[e.id]);
  for (const [code, b] of Object.entries(char.hotkeys ?? {})) if (b?.item && !ITEMS[b.item]) char.hotkeys[code] = null;
  return char;
}

// Jobs that were renamed move to their new job, and skills that were removed give their SP back.
export function updateRetiredJobs(char) {
  // A job that exists today is never retired, even if an old job once had its id (the Ranger).
  if (!JOBS[char.job]) char.job = RETIRED_JOBS[char.job] ?? char.job;
  for (const [id, lv] of Object.entries(char.skills ?? {})) {
    if (SKILLS[id]) continue;
    char.sp += lv;
    delete char.skills[id];
  }
  // A key bound to a skill that's gone, or that now sets itself off (a Warrior's procs), is freed.
  for (const [code, b] of Object.entries(char.hotkeys ?? {})) if (b?.skill && (!SKILLS[b.skill] || SKILLS[b.skill].type === 'passive')) char.hotkeys[code] = null;
  return char;
}

// Saves from before the starting outfit came off: whatever top, bottoms and shoes slot is empty
// (where the creator outfit was drawn) gets the matching outfit piece, once.
export function giveStartingOutfit(char) {
  if (char.gotOutfit) return char;
  char.gotOutfit = true;
  for (const slot of ['top', 'bottom', 'shoes']) if (!char.equipment[slot]) char.equipment[slot] = makeEquip(`outfit_${slot}`);
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
