// Crafting at a town bench (data/crafting.js): which recipes you can make, the quality odds for a
// piece, and making it (materials used, the result in the bag, Crafting EXP and character EXP).
// And the life tools it makes: equipped into `char.lifeTools[slot]` (the tool's `life.slot`: the
// skill it serves, or 'chopping' for a woodaxe), read back with `lifeTool`.

import { ITEMS } from '../data/items.js';
import { RECIPES, QUALITIES, familyMain, TOOL_SLOTS } from '../data/crafting.js';
import { JOBS } from '../data/jobs.js';
import { countItem, removeItem, addItem, TAB_SIZE, tabFor } from './inventory.js';
import { makeEquip } from './items.js';
import { addLifeExp, lifeLevel, charExpFor } from './life.js';

// The recipes a category shows: gear only for your own job's family (a Novice has none yet).
export function recipesIn(char, cat) {
  const family = JOBS[char.job]?.family;
  return RECIPES.filter((r) => r.cat === cat && (!r.family || r.family === family || family === 'gm')).sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));
}

export const hasMaterials = (char, r) => Object.entries(r.needs).every(([id, n]) => countItem(char.inventory, id) >= n);

// Why `r` can't be made right now ('level', 'materials', 'bag'), or null.
export function craftBlocker(char, r) {
  // Furniture needs an island to put it on, built far enough along (data/furniture.js).
  if (r.cat === 'home' && !char.home) return 'island';
  if (r.stage && (char.home?.stage ?? 0) < r.stage) return 'stage';
  if (lifeLevel(char, 'crafting') < r.level) return 'level';
  if (!hasMaterials(char, r)) return 'materials';
  const def = ITEMS[r.makes];
  const tab = tabFor(r.makes);
  const list = char.inventory[tab] ?? [];
  const stacks = tab !== 'equip' && list.some((e) => e.id === r.makes && e.qty + r.qty <= (def.stack ?? 200));
  if (!stacks && list.length >= TAB_SIZE) return 'bag';
  return null;
}
export const BLOCKER_TEXT = { island: 'You need an island to put it on: ask Captain Rook in Pastel Harbor.', stage: 'Shelly needs to build your island further first.', level: 'Your Crafting level is too low.', materials: 'Missing materials.', bag: 'Your bag is full.' };

// The chance of each quality [Fine, Superb, Masterwork] for a quality recipe, rising with your
// Crafting level and with every level you are past the recipe's own.
export function qualityOdds(char, r) {
  if (!r.quality) return [1, 0, 0];
  const lv = lifeLevel(char, 'crafting');
  const past = Math.max(0, lv - r.level);
  const master = Math.min(0.3, 0.03 + 0.012 * past + 0.002 * lv);
  const superb = Math.min(0.5, 0.15 + 0.02 * past + 0.004 * lv);
  return [1 - superb - master, superb, master];
}
export function rollQuality(odds, rng = Math.random) {
  const u = rng();
  return u < odds[2] ? 2 : u < odds[2] + odds[1] ? 1 : 0;
}

// A crafted equipment piece of quality `q` (0-2): the piece's stats lifted by its quality, and on a
// Superb or Masterwork piece some of the wearer's main stat.
export function makeCrafted(id, q, rng = Math.random) {
  const def = ITEMS[id];
  const inst = makeEquip(id, { rng });
  const Q = QUALITIES[q];
  for (const k of Object.keys(inst.stats)) inst.stats[k] = Math.max(1, Math.round(def.stats[k] * Q.mult));
  if (Q.main) {
    const main = def.family ? familyMain(def.family) : def.main;
    if (main) inst.stats[main] = (inst.stats[main] ?? 0) + Q.main;
    else for (const k of ['str', 'dex', 'int', 'luk']) inst.stats[k] = (inst.stats[k] ?? 0) + Math.ceil(Q.main / 2);
  }
  inst.quality = q;
  inst.crafted = true;
  return inst;
}

// Crafting EXP and character EXP for making `r`: more for gear and for higher recipes.
const CAT_WEIGHT = { gear: 2, accessory: 1.6, tool: 1.5, stone: 0.8, potion: 0.6 };
const CAT_CHAR = { gear: 1.5, accessory: 1.2, tool: 1, stone: 0.6, potion: 0.5 };
export const craftExp = (r) => Math.round((12 + r.level * 4) * (CAT_WEIGHT[r.cat] ?? 1));
export const craftCharExp = (r) => Math.round(charExpFor(r.tier, 'craft') * (CAT_CHAR[r.cat] ?? 1));

// Makes `r` for the world's character. Returns { ok, why, inst, qty, quality, levels }.
export function craft(world, r, rng = Math.random) {
  const char = world.char;
  const why = craftBlocker(char, r);
  if (why) return { ok: false, why };
  const odds = qualityOdds(char, r);
  for (const [id, n] of Object.entries(r.needs)) removeItem(char.inventory, id, n);
  let inst = null;
  let quality = null;
  if (ITEMS[r.makes].type === 'equip') {
    quality = r.quality ? rollQuality(odds, rng) : 0;
    inst = makeCrafted(r.makes, quality, rng);
    addItem(char.inventory, inst);
  } else addItem(char.inventory, r.makes, r.qty);
  const levels = addLifeExp(world, 'crafting', craftExp(r), { charExp: craftCharExp(r) });
  return { ok: true, why: null, inst, qty: r.qty, quality, levels };
}

// ---------- Life tools ----------

export const isTool = (id) => Boolean(ITEMS[id]?.life);

// Equips a tool from the bag into its slot (it stays in the bag; selling or dropping it unequips
// it). Returns false if it isn't a tool you have.
export function equipTool(char, id) {
  const def = ITEMS[id];
  if (!def?.life || countItem(char.inventory, id) < 1) return false;
  (char.lifeTools ??= {})[def.life.slot] = id;
  return true;
}
export function unequipTool(char, slot) {
  if (char.lifeTools) delete char.lifeTools[slot];
}
export const toolEquipped = (char, id) => Boolean(ITEMS[id]?.life) && char.lifeTools?.[ITEMS[id].life.slot] === id;

// The tool in use for a slot ('fishing', 'mining', 'gathering', 'chopping'), as its `life`
// numbers, or null (none equipped, or it's no longer in the bag).
export function lifeTool(char, slot) {
  const id = char.lifeTools?.[slot];
  if (!id || !ITEMS[id]?.life || countItem(char.inventory, id) < 1) return null;
  return { id, ...ITEMS[id].life };
}
export { TOOL_SLOTS };
