// Saving and loading in localStorage. There are three save files (FILES), and each is a world of
// its own with up to PER_FILE characters (the player's call, 2026-11-05). A world keeps what its
// characters share: the home island (each keeps their own way back from it), the Monster Book, the
// wardrobe of every cash look any of them has owned, and the storage chest. Everything else (level,
// job, gear, gold, the story) is each character's own. Buffs and timers aren't saved.

import { setNextUid, makeEquip } from './items.js';
import { createInventory, settleBag } from './inventory.js';
import { ITEMS, RENAMED_ITEMS } from '../data/items.js';
import { STARTING_CASH } from '../data/cash.js';
import { JOBS, RETIRED_JOBS } from '../data/jobs.js';
import { SKILLS } from '../data/skills.js';
import { settleSkills, ECON } from './character.js';
import { MAX_LEVEL } from './exp.js';

export const FILES = 3;
export const PER_FILE = 4;
export const charKey = (file, slot) => `twzt-w${file}-c${slot}`;
const worldKey = (file) => `twzt-w${file}`;
// Before save files: eight loose character slots.
const OLD_SLOTS = 8;
export const oldKey = (slot = 0) => (slot ? `twzt-save-v1-${slot}` : 'twzt-save-v1');
const MIGRATED = 'twzt-files-v1';

const read = (k) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
};
const remove = (k) => {
  try {
    localStorage.removeItem(k);
  } catch {
    // Storage may be unavailable (private mode); nothing to remove.
  }
};

// The worlds in play, so every character loaded from one file shares the very same island, book
// and chest (kept per storage, so a fresh storage starts fresh).
let openFor = null;
let open = new Map();
function opened() {
  const store = globalThis.localStorage ?? null;
  if (openFor !== store) {
    openFor = store;
    open = new Map();
  }
  return open;
}

export function newWorld(name) {
  return { name, createdAt: Date.now(), lastPlayed: 0, playSeconds: 0, home: null, book: {}, wardrobe: [], storage: createInventory() };
}

// The world in save file `file` (null when the file is empty).
export function loadWorld(file) {
  migrateOldSaves();
  const worlds = opened();
  if (worlds.has(file)) return worlds.get(file);
  const w = read(worldKey(file));
  if (!w) return null;
  w.book ??= {};
  w.wardrobe ??= [];
  w.storage ??= createInventory();
  for (const tab of Object.keys(createInventory())) w.storage[tab] ??= [];
  settleBag(w.storage);
  w.playSeconds ??= 0;
  worlds.set(file, w);
  return w;
}

export function createWorldFile(file, name) {
  const w = newWorld(name);
  opened().set(file, w);
  saveWorld(file);
  return w;
}

// Writes the world (its island without anyone's way back: that's each character's own).
export function saveWorld(file) {
  const w = opened().get(file);
  if (!w) return false;
  return write(worldKey(file), { ...w, home: w.home ? { ...w.home, back: null } : null });
}

export function deleteWorld(file) {
  for (let s = 0; s < PER_FILE; s++) remove(charKey(file, s));
  remove(worldKey(file));
  opened().delete(file);
}

// Copies a whole save file (its world and characters) into an empty one.
export function copyWorld(from, to) {
  if (!loadWorld(from) || read(worldKey(to))) return false;
  saveWorld(from);
  const w = read(worldKey(from));
  w.name = `${w.name} (copy)`;
  write(worldKey(to), w);
  for (let s = 0; s < PER_FILE; s++) {
    const c = read(charKey(from, s));
    if (c) write(charKey(to, s), { ...c, file: to });
  }
  opened().delete(to);
  return true;
}

// Time played in a world, kept as it's played.
export function addPlayTime(file, secs) {
  const w = opened().get(file);
  if (w) w.playSeconds += secs;
}

// Every character in a file, by slot (null where a slot is free). (Loading them doesn't change
// whose way back from the island is current: the hero being played keeps theirs.)
export function worldChars(file) {
  const home = loadWorld(file)?.home;
  const back = home?.back;
  const list = Array.from({ length: PER_FILE }, (_, s) => (hasSave(s, file) ? loadGame(s, file) : null));
  if (home) home.back = back ?? null;
  return list;
}

// The cash looks a character has (in the Cash tab or worn), for the world's wardrobe.
const looksOf = (char) => [...(char.inventory?.cash ?? []), ...Object.values(char.outfit ?? {})].filter(Boolean).map((e) => e.id);
const addLooks = (w, ids) => {
  for (const id of ids) if (!w.wardrobe.includes(id)) w.wardrobe.push(id);
};
// Two books in one: each monster's count is the higher of the two.
const mergeBook = (into, from) => {
  for (const [id, n] of Object.entries(from ?? {})) into[id] = Math.max(into[id] ?? 0, n);
  return into;
};

export function saveGame(char) {
  const file = char.file ?? 0;
  const w = loadWorld(file) ?? createWorldFile(file, `World ${file + 1}`);
  // What's shared lives in the world; the character keeps only their own way back from the island.
  if (char.home) w.home = char.home;
  if (char.book && char.book !== w.book) w.book = mergeBook(w.book, char.book);
  char.book = w.book;
  addLooks(w, looksOf(char));
  w.lastPlayed = Date.now();
  const data = { ...char, buffs: {}, savedAt: Date.now(), home: undefined, book: undefined, homeBack: char.home?.back ?? null, file };
  return write(charKey(file, char.slot ?? 0), data) && saveWorld(file);
}

export function loadGame(slot = 0, file = 0) {
  try {
    loadWorld(file);
    const char = read(charKey(file, slot));
    if (!char) return null;
    char.slot = slot;
    char.file = file;
    // The world's shared parts: its island (with this character's own way back), its book.
    const w = loadWorld(file) ?? createWorldFile(file, `World ${file + 1}`);
    if (char.home && !w.home) w.home = { ...char.home, back: null };
    if (w.home) {
      w.home.back = char.homeBack ?? char.home?.back ?? null;
      char.home = w.home;
    }
    if (char.book && char.book !== w.book) mergeBook(w.book, char.book);
    char.book = w.book;
    // Saves from before outfits get the starting Cash and empty outfit slots.
    char.outfit ??= {};
    char.cash ??= STARTING_CASH;
    char.inventory.cash ??= [];
    // Saves from before life skills (core/life.js) start every skill at level 1.
    char.life ??= {};
    // (A character from before the level cap came down to 50 is at the cap.)
    char.level = Math.min(char.level, MAX_LEVEL);
    // Saves from before gold was rebalanced (everything now pays and costs about a quarter of
    // what it did) keep a quarter of their gold, so an old character isn't suddenly rich.
    if ((char.econ ?? 1) < ECON) {
      char.gold = Math.round((char.gold ?? 0) * 0.25);
      char.econ = ECON;
    }
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
  // An outfit piece that moved slot (glasses went from the hat slot to the face slot) moves with it,
  // or back to the Cash tab if that slot is taken.
  for (const [slot, inst] of Object.entries(char.outfit ?? {})) {
    const to = inst && ITEMS[inst.id].slot;
    if (!to || to === slot) continue;
    char.outfit[slot] = null;
    if (char.outfit[to]) char.inventory.cash.push(inst);
    else char.outfit[to] = inst;
  }
  for (const tab of Object.keys(char.inventory)) char.inventory[tab] = char.inventory[tab].filter((e) => ITEMS[e.id]);
  // (From before the Materials pocket: materials move out of Etc into it.)
  settleBag(char.inventory);
  for (const [code, b] of Object.entries(char.hotkeys ?? {})) if (b?.item && !ITEMS[b.item]) char.hotkeys[code] = null;
  return char;
}

// Jobs that were renamed move to their new job (any other that no longer exists, like the old Mage,
// starts over as a Novice), and skills that were removed give their SP back.
export function updateRetiredJobs(char) {
  // A job that exists today is never retired, even if an old job once had its id (the Ranger).
  if (!JOBS[char.job]) char.job = RETIRED_JOBS[char.job] ?? 'novice';
  for (const [id, lv] of Object.entries(char.skills ?? {})) {
    if (SKILLS[id]) continue;
    char.sp += lv;
    delete char.skills[id];
  }
  settleSkills(char);
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

export function hasSave(slot = 0, file = 0) {
  migrateOldSaves();
  return Boolean(read(charKey(file, slot)));
}

export function deleteSave(slot = 0, file = 0) {
  remove(charKey(file, slot));
}

// Saves from before save files (eight loose character slots) move into the files, four to a
// file in slot order, once. Each file's characters then share: the most built-up island among
// them, their Monster Books (the higher count of each), and every cash look any of them had.
// (The old saves are left where they were, untouched, as a backup.)
export function migrateOldSaves() {
  if (read(MIGRATED)) return;
  if (!write(MIGRATED, 1)) return;
  const old = [];
  for (let s = 0; s < OLD_SLOTS; s++) {
    const c = read(oldKey(s));
    if (c) old.push(c);
  }
  for (let file = 0; file * PER_FILE < old.length && file < FILES; file++) {
    const group = old.slice(file * PER_FILE, (file + 1) * PER_FILE);
    const w = newWorld(`World ${file + 1}`);
    const times = group.map((c) => c.savedAt ?? Date.now());
    w.createdAt = Math.min(...times);
    w.lastPlayed = Math.max(...times);
    const homes = group.filter((c) => c.home).sort((p, q) => (q.home.stage ?? 1) - (p.home.stage ?? 1) || (q.home.placed?.length ?? 0) - (p.home.placed?.length ?? 0));
    if (homes.length) w.home = { ...homes[0].home, back: null };
    group.forEach((c, slot) => {
      mergeBook(w.book, c.book);
      addLooks(w, looksOf(c));
      c.homeBack = c.home?.back ?? null;
      delete c.home;
      delete c.book;
      c.slot = slot;
      c.file = file;
      write(charKey(file, slot), c);
    });
    write(worldKey(file), w);
  }
}
