// The player character: progression, points, skills, equipment, and consumables.
// Pure state changes, no rendering. Game time is passed in where buffs care about it.

import { MAX_LEVEL, expToNext } from './exp.js';
import { JOBS, FAMILY_STATS, jobChain, nextJobs } from '../data/jobs.js';
import { SKILLS } from '../data/skills.js';
import { ITEMS } from '../data/items.js';
import { STARTING_CASH, CASH_PER_LEVEL } from '../data/cash.js';
import { computeStats } from './stats.js';
import { createInventory, addItem, removeItem } from './inventory.js';
import { makeEquip } from './items.js';
import { deathExpLoss } from './formulas.js';

export const STAT_KEYS = ['str', 'dex', 'int', 'luk'];
const NOVICE_SP_LEVEL_CAP = 10;

export function createCharacter(name, appearance) {
  return {
    name,
    appearance,
    job: 'novice',
    level: 1,
    exp: 0,
    base: { str: 4, dex: 4, int: 4, luk: 4 },
    ap: 9,
    sp: 0,
    baseHp: 50,
    baseMp: 5,
    hp: 50,
    mp: 5,
    gold: 0,
    skills: {},
    // Dressed in the outfit picked in the creator (pieces that come off; see items.js).
    equipment: { weapon: null, hat: null, top: makeEquip('outfit_top'), bottom: makeEquip('outfit_bottom'), shoes: makeEquip('outfit_shoes'), gloves: null, cape: null, earring: null },
    gotOutfit: true,
    // Cash outfit pieces worn over the gear, by slot, and the Cash to buy them with.
    outfit: {},
    cash: STARTING_CASH,
    inventory: createInventory(),
    quests: {},
    buffs: {},
    hotkeys: {},
    mapId: 'sprout',
  };
}

export function stats(char, now = 0) {
  return computeStats(char, now);
}

// Keeps HP/MP inside their (possibly changed) maximums.
export function clampVitals(char, now = 0) {
  const s = computeStats(char, now);
  char.hp = Math.min(char.hp, s.maxHp);
  char.mp = Math.min(char.mp, s.maxMp);
  return s;
}

// Adds EXP and applies level-ups. Returns the number of levels gained.
export function gainExp(char, amount) {
  let gained = 0;
  char.exp += Math.max(0, Math.round(amount));
  while (char.level < MAX_LEVEL && char.exp >= expToNext(char.level)) {
    char.exp -= expToNext(char.level);
    char.level += 1;
    gained += 1;
    const job = JOBS[char.job];
    char.ap += 5;
    if (job.tier === 0) {
      if (char.level <= NOVICE_SP_LEVEL_CAP) char.sp += 1;
    } else {
      char.sp += 3;
    }
    char.baseHp += job.hp;
    char.baseMp += job.mp;
    char.cash = (char.cash ?? 0) + CASH_PER_LEVEL;
  }
  if (char.level >= MAX_LEVEL) char.exp = 0;
  if (gained) {
    const s = computeStats(char);
    char.hp = s.maxHp;
    char.mp = s.maxMp;
  }
  return gained;
}

export function canAdvance(char, jobId) {
  return nextJobs(char.job, char.level, char.quests).some((j) => j.id === jobId);
}

export function advanceJob(char, jobId) {
  if (!canAdvance(char, jobId)) return false;
  const job = JOBS[jobId];
  char.job = jobId;
  char.baseHp += job.advanceHp;
  char.baseMp += job.advanceMp;
  char.sp += 1;
  // New thieves get a set of stars to throw.
  if (jobId === 'thief') {
    addItem(char.inventory, 'star_pebble', ITEMS.star_pebble.stack);
    char.gotStars = true;
  }
  const s = computeStats(char);
  char.hp = s.maxHp;
  char.mp = s.maxMp;
  return true;
}

export function spendAp(char, stat, amount = 1) {
  if (!STAT_KEYS.includes(stat)) return 0;
  const n = Math.min(amount, char.ap);
  char.base[stat] += n;
  char.ap -= n;
  return n;
}

// Spends all AP: mostly into the family's primary stat, enough into the secondary to keep accuracy up.
export function autoAssignAp(char) {
  const { primary, secondary } = FAMILY_STATS[JOBS[char.job].family];
  while (char.ap > 0) {
    const wantSecondary = char.base[secondary] < 4 + Math.floor(char.level * 0.8);
    spendAp(char, wantSecondary ? secondary : primary);
  }
}

// Skills the character can see in their skill book (every job in their chain).
export function availableSkills(char) {
  const chain = jobChain(char.job);
  return Object.values(SKILLS).filter((s) => chain.includes(s.job));
}

export function canLearn(char, skillId) {
  const s = SKILLS[skillId];
  if (!s || char.sp <= 0) return false;
  if (!jobChain(char.job).includes(s.job)) return false;
  return (char.skills[skillId] ?? 0) < s.maxLevel;
}

export function learnSkill(char, skillId) {
  if (!canLearn(char, skillId)) return false;
  char.skills[skillId] = (char.skills[skillId] ?? 0) + 1;
  char.sp -= 1;
  // New attack and buff skills drop onto the first free hotkey.
  if (char.skills[skillId] === 1 && SKILLS[skillId].type !== 'passive') bindFreeHotkey(char, { skill: skillId });
  clampVitals(char);
  return true;
}

export const HOTKEYS = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'Digit1', 'Digit2', 'Digit3', 'Digit4'];

export function bindFreeHotkey(char, binding) {
  const taken = (b) => Object.values(char.hotkeys).some((h) => JSON.stringify(h) === JSON.stringify(b));
  if (taken(binding)) return null;
  const key = HOTKEYS.find((k) => !char.hotkeys[k]);
  if (key) char.hotkeys[key] = binding;
  return key ?? null;
}

// ---------- Equipment ----------

export function equipBlocker(char, inst) {
  const def = ITEMS[inst.id];
  if (def.type !== 'equip') return 'not equipment';
  if (JOBS[char.job].family === 'gm') return null;
  if (char.level < def.reqLevel) return `needs level ${def.reqLevel}`;
  // Starter job sets fit a Novice too, so they can dress for the job they're aiming at.
  if (def.family && JOBS[char.job].family !== def.family && !(def.starter && char.job === 'novice')) return `for ${def.family}s only`;
  if (def.slot === 'weapon' && !JOBS[char.job].weapons.includes(def.weaponType)) return `${JOBS[char.job].name}s can't use this`;
  return null;
}

// Equips the bag item at `index`, swapping out whatever was in that slot.
export function equipFromBag(char, index) {
  const inst = char.inventory.equip[index];
  if (!inst || equipBlocker(char, inst)) return false;
  const slot = ITEMS[inst.id].slot;
  char.inventory.equip.splice(index, 1);
  if (char.equipment[slot]) char.inventory.equip.push(char.equipment[slot]);
  char.equipment[slot] = inst;
  clampVitals(char);
  return true;
}

export function unequip(char, slot) {
  const inst = char.equipment[slot];
  if (!inst || !addItem(char.inventory, inst)) return false;
  char.equipment[slot] = null;
  clampVitals(char);
  return true;
}

// ---------- Outfits ----------

// Wears the cash item at `index` in the Cash tab, putting back whatever was in that outfit slot.
export function wearOutfit(char, index) {
  const inst = char.inventory.cash[index];
  if (!inst) return false;
  const def = ITEMS[inst.id];
  char.outfit ??= {};
  char.inventory.cash.splice(index, 1);
  // Anything worn that dresses the same slots comes off (a onesie and a pair of shorts don't mix).
  const dresses = (d) => [d.slot, ...Object.keys(d.covers ?? {})];
  for (const [slot, worn] of Object.entries(char.outfit)) {
    if (worn && dresses(ITEMS[worn.id]).some((s) => dresses(def).includes(s))) {
      char.inventory.cash.push(worn);
      char.outfit[slot] = null;
    }
  }
  char.outfit[def.slot] = inst;
  return true;
}

export function removeOutfit(char, slot) {
  const inst = char.outfit?.[slot];
  if (!inst || !addItem(char.inventory, inst)) return false;
  char.outfit[slot] = null;
  return true;
}

// What a hero looks like they're wearing: their gear, with each outfit piece covering the look of
// its slot (a weapon cover reskins the weapon they hold, which keeps its type). Stats always come
// from the gear itself. `over` previews outfit pieces on top (the Cash Shop's fitting room).
export function wornGear(char, over = null) {
  const outfit = over ? { ...char.outfit, ...over } : char.outfit;
  if (!outfit) return char.equipment;
  let g = null;
  for (const [slot, inst] of Object.entries(outfit)) {
    if (!inst) continue;
    const def = ITEMS[inst.id];
    g ??= { ...char.equipment };
    if (def.cover) {
      if (g.weapon) g.weapon = { ...g.weapon, cover: def.cover, coverVariant: inst.variant ?? null };
      continue;
    }
    g[slot] = { id: def.skin, variant: inst.variant ?? null };
    for (const [s, look] of Object.entries(def.covers ?? {})) g[s] = { id: look, variant: inst.variant ?? null };
  }
  return g ?? char.equipment;
}

// ---------- Consumables ----------

// Uses a potion. Returns false if there isn't one. Return scrolls are handled by the game.
export function usePotion(char, id, now = 0) {
  const def = ITEMS[id];
  if (!def?.effect || def.effect.returnTown) return false;
  if (removeItem(char.inventory, id, 1) < 1) return false;
  const s = computeStats(char, now);
  const e = def.effect;
  char.hp = Math.min(s.maxHp, char.hp + (e.hp ?? 0) + Math.round((e.hpPct ?? 0) * s.maxHp));
  char.mp = Math.min(s.maxMp, char.mp + (e.mp ?? 0) + Math.round((e.mpPct ?? 0) * s.maxMp));
  return true;
}

// Death: lose some EXP (softened by base LUK), come back with half HP.
export function applyDeath(char) {
  const loss = deathExpLoss(char.level, char.base.luk);
  char.exp = Math.max(0, char.exp - loss);
  const s = computeStats(char);
  char.hp = Math.ceil(s.maxHp * 0.5);
  char.mp = Math.ceil(s.maxMp * 0.5);
  char.buffs = {};
  return loss;
}
