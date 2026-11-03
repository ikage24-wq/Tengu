// Life skills (docs/design/life-skills.md): Fishing, Gathering, Mining, Cooking and Crafting, each
// with its own level (1 to LIFE_MAX) and EXP, kept on the character (`char.life`). Using a skill
// raises it; a life action also gives the character some EXP of their own, so a character can be
// levelled mostly through life skills (the player's pick: a full alternate path).
//
// The shared API every life feature uses:
//   lifeLevel(char, skill)            the skill's level (1 if never used)
//   lifeExp(char, skill)              EXP into the current level
//   lifeExpToNext(level)              EXP from `level` to `level + 1`
//   addLifeExp(world, skill, n, opts) adds EXP; returns levels gained. Pushes a world event
//                                     { type: 'lifelevel', skill, level } on each level up.
//                                     opts.charExp: character EXP to give along with it (the caller
//                                     works it out with charExpFor).
//   charExpFor(tier, kind, level)     character EXP for one life action of a region tier (1-4), for
//                                     a character of `level` (the tier's middle if left out)
//   tierOf(level)                     the region tier a skill level unlocks (1-4)
//   TIER_LEVEL[tier]                  the skill level a tier's spots and recipes need
//
// And for the actions themselves:
//   lifePerks(char, skill)            what the skill's level (and tool) does: { level, time (a
//                                     multiplier on how long an action takes), extra (the chance
//                                     of one more find), rare (a multiplier on rare chances), rest
//                                     (a multiplier on how long a spot rests), react (on a bite's
//                                     window), tool (the tool's ITEMS entry, or null) }
//   needFor(spot)                     the skill level a spot (or recipe) needs: its `lv`, or its
//                                     `tier`'s level (tier 1 when it has none)
//   lifeExpFor(tier, kind, level)     life EXP for one action of a tier at a skill level
//   lifeAction(world, skill, o)       one finished action: gives the life EXP and character EXP
//                                     and shows them over the hero. o: { tier, kind, scale }

import { gainExp } from './character.js';
import { MOBS } from '../data/mobs.js';
import { ITEMS } from '../data/items.js';
import { celebrateLevels } from '../world/levelup.js';

export const LIFE_SKILLS = ['fishing', 'gathering', 'mining', 'cooking', 'crafting'];
export const LIFE_NAMES = { fishing: 'Fishing', gathering: 'Gathering', mining: 'Mining', cooking: 'Cooking', crafting: 'Crafting' };
export const LIFE_MAX = 50;
export const TIER_LEVEL = [0, 1, 12, 24, 36];
// The life-skill colour: a job-neutral mint, for its words, bars and level-up moment.
export const LIFE_COLOR = '#7fe0b4';

const table = [0];
for (let lv = 1; lv < LIFE_MAX; lv++) table[lv] = Math.round(20 + 8 * lv + 1.6 * lv * lv);
export const lifeExpToNext = (level) => (level >= LIFE_MAX ? Infinity : table[level]);

const slot = (char, skill) => ((char.life ??= {})[skill] ??= { level: 1, exp: 0 });
export const lifeLevel = (char, skill) => char.life?.[skill]?.level ?? 1;
export const lifeExp = (char, skill) => char.life?.[skill]?.exp ?? 0;
export const tierOf = (level) => (level >= TIER_LEVEL[4] ? 4 : level >= TIER_LEVEL[3] ? 3 : level >= TIER_LEVEL[2] ? 2 : 1);
const clampTier = (tier) => Math.max(1, Math.min(4, Math.round(tier ?? 1) || 1));
export const needFor = (spot) => spot?.lv ?? TIER_LEVEL[clampTier(spot?.tier)];

// ---------- Character EXP: a full alternate path ----------
// An hour of life skills in a region pays about what an hour of hunting there does (checked in
// tests/life.test.js). A hunter is taken to down a monster every KILL_SECS; each kind of action
// takes about PACE seconds, walking between spots included, and is paid LIFE_SHARE of what a
// hunter of the same level earns in that time. A character past a tier's top level earns that
// tier's top (so the next region pays better), and one below it earns their own level's worth.
export const KILL_SECS = 5;
export const PACE = { gather: 9, mine: 9.5, fish: 7.5, cook: 3, craft: 12 };
const LIFE_SHARE = 0.8;
const TIER_TOP = [0, 12, 24, 36, 50];
const TIER_MID = [0, 7, 18, 30, 43];

// What a hunter of `level` gets for a kill: the average of the monsters around that level.
const huntMemo = new Map();
export function huntExpAt(level) {
  const lv = Math.max(1, Math.min(50, Math.round(level)));
  if (huntMemo.has(lv)) return huntMemo.get(lv);
  const mobs = Object.values(MOBS).filter((m) => !m.boss && m.exp > 0);
  let near = [];
  for (let r = 1; r <= 8 && !near.length; r++) near = mobs.filter((m) => Math.abs(m.level - lv) <= r);
  const exp = near.length ? near.reduce((n, m) => n + m.exp, 0) / near.length : 8;
  huntMemo.set(lv, exp);
  return exp;
}

export function charExpFor(tier, kind = 'gather', level = null) {
  const t = clampTier(tier);
  const lv = Math.min(level ?? TIER_MID[t], TIER_TOP[t]);
  return Math.max(1, Math.round(huntExpAt(lv) * ((PACE[kind] ?? PACE.gather) / KILL_SECS) * LIFE_SHARE));
}

// ---------- Life EXP ----------
// A tier's spots pay a base amount (a long action a little more); spots a tier or more below what
// the skill has opened pay half for each tier, so the next region is always worth the trip.
const TIER_LIFE = [0, 10, 22, 40, 65];
const LIFE_WEIGHT = { gather: 1, mine: 1.1, fish: 1, cook: 2.5, craft: 2.5 };
export function lifeExpFor(tier, kind = 'gather', level = 1) {
  const t = clampTier(tier);
  const below = Math.max(0, tierOf(level) - t);
  return Math.max(1, Math.round(TIER_LIFE[t] * (LIFE_WEIGHT[kind] ?? 1) * 0.5 ** below));
}

export function addLifeExp(world, skill, n, { charExp = 0 } = {}) {
  const s = slot(world.char, skill);
  s.exp += Math.max(0, Math.round(n));
  let gained = 0;
  while (s.level < LIFE_MAX && s.exp >= lifeExpToNext(s.level)) {
    s.exp -= lifeExpToNext(s.level);
    s.level += 1;
    gained += 1;
    world.events?.push({ type: 'lifelevel', skill, level: s.level });
  }
  if (s.level >= LIFE_MAX) s.exp = 0;
  if (gained) celebrateLife(world, skill, s.level);
  if (charExp > 0) celebrateLevels(world, gainExp(world.char, charExp));
  return gained;
}

// A skill's level up: a line in the log (and what it opened), a word over the hero and a mint
// burst at their feet (render/life-fx.js).
function celebrateLife(world, skill, level) {
  const b = world.body;
  const opened = TIER_LEVEL.indexOf(level);
  world.log?.(`${LIFE_NAMES[skill]} is now Lv ${level}!${opened > 1 ? ` Tier ${opened} spots and recipes are open to you.` : ''}`, LIFE_COLOR);
  if (!b) return;
  world.fx?.push({ kind: 'lifelevel', skill, level, x: b.x, y: b.y, t: 0, dur: 1.5 });
  world.numbers?.push({ x: b.x, y: b.y - (b.h ?? 40) - 30, text: `${LIFE_NAMES[skill]} Lv ${level}!`, color: LIFE_COLOR, t: -0.15 });
}

// EXP boosts that count for life actions too: dishes (+% EXP) and a GM's Double EXP.
function expBoost(world) {
  const food = Object.values(world.char.buffs ?? {}).reduce((k, b) => k + (b.until > (world.now ?? 0) ? b.values?.expPct ?? 0 : 0), 0);
  return (1 + food) * (world.expEvent ?? 1);
}

// One finished life action. Returns { life, char, levels } (the EXP given, skill levels gained).
export function lifeAction(world, skill, { tier = 1, kind = 'gather', scale = 1 } = {}) {
  const char = world.char;
  const life = Math.round(lifeExpFor(tier, kind, lifeLevel(char, skill)) * scale);
  const charExp = Math.round(charExpFor(tier, kind, char.level) * scale * expBoost(world));
  const b = world.body;
  if (b) {
    world.numbers?.push({ x: b.x, y: b.y - (b.h ?? 40) - 14, text: `+${charExp} EXP`, color: '#ffe36b', t: 0, small: true });
    world.numbers?.push({ x: b.x, y: b.y - (b.h ?? 40) - 2, text: `+${life} ${LIFE_NAMES[skill]}`, color: LIFE_COLOR, t: -0.12, small: true });
  }
  const levels = addLifeExp(world, skill, life, { charExp });
  return { life, char: charExp, levels };
}

// ---------- What levels and tools do ----------
// Per level past 1: 1.2% quicker, 1.2% likelier to find one more, 2% better rare chances, spots
// rest 0.6% less, and a bite's window is 0.6% longer. A tool (`char.lifeTools[skill]`, an item id
// whose ITEMS entry has `life: { skill, speed, yield, rare }`) adds its own on top.
// (A tool sits in its own slot: the same as its skill, except the woodaxe, `chopping`, a Gathering
// tool kept apart from the sickle.)
export function toolFor(char, skill, slot = skill) {
  const held = char.lifeTools?.[slot];
  const id = typeof held === 'string' ? held : held?.id;
  const def = id ? ITEMS[id] : null;
  return def?.life && (def.life.skill ?? skill) === skill ? def : null;
}

export function perksAt(level, tool = null) {
  const k = Math.max(0, level - 1);
  const t = tool?.life ?? {};
  return {
    level,
    time: 1 / (1 + 0.012 * k + (t.speed ?? 0)),
    extra: Math.min(0.85, 0.012 * k + (t.yield ?? 0)),
    rare: 1 + 0.02 * k + (t.rare ?? 0),
    rest: Math.max(0.5, 1 - 0.006 * k),
    react: 1 + 0.006 * k,
    tool,
  };
}

export const lifePerks = (char, skill, slot = skill) => perksAt(lifeLevel(char, skill), toolFor(char, skill, slot));

// How many of a find you get, with the level's chance of one more.
export const withExtra = (n, perks, rng = Math.random) => n + Math.floor(perks.extra) + (rng() < perks.extra % 1 ? 1 : 0);

// Which skill a gathering kind trains (a kind's own `skill` wins).
const KIND_SKILL = { ore: 'mining', gem: 'mining', crystal: 'mining' };
export const skillOfKind = (kind, def = null) => def?.skill ?? KIND_SKILL[kind] ?? 'gathering';
