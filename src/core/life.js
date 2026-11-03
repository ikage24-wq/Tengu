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
//   charExpFor(tier, kind)            character EXP for one life action of a region tier (1-4)
//   tierOf(level)                     the region tier a skill level unlocks (1-4)
//   TIER_LEVEL[tier]                  the skill level a tier's spots and recipes need

import { gainExp } from './character.js';

export const LIFE_SKILLS = ['fishing', 'gathering', 'mining', 'cooking', 'crafting'];
export const LIFE_NAMES = { fishing: 'Fishing', gathering: 'Gathering', mining: 'Mining', cooking: 'Cooking', crafting: 'Crafting' };
export const LIFE_MAX = 50;
export const TIER_LEVEL = [0, 1, 12, 24, 36];

const table = [0];
for (let lv = 1; lv < LIFE_MAX; lv++) table[lv] = Math.round(20 + 8 * lv + 1.6 * lv * lv);
export const lifeExpToNext = (level) => (level >= LIFE_MAX ? Infinity : table[level]);

const slot = (char, skill) => ((char.life ??= {})[skill] ??= { level: 1, exp: 0 });
export const lifeLevel = (char, skill) => char.life?.[skill]?.level ?? 1;
export const lifeExp = (char, skill) => char.life?.[skill]?.exp ?? 0;
export const tierOf = (level) => (level >= TIER_LEVEL[4] ? 4 : level >= TIER_LEVEL[3] ? 3 : level >= TIER_LEVEL[2] ? 2 : 1);

// Character EXP for one life action in a region of `tier`: about what a hunter earns in the same
// time on that tier's maps (tuned in tests/life.test.js). `kind` weighs the action: a quick pick
// less, a long craft more.
const KIND_WEIGHT = { gather: 1, mine: 1.2, fish: 1.5, cook: 1, craft: 2 };
const TIER_EXP = [0, 18, 70, 190, 420];
export const charExpFor = (tier, kind = 'gather') => Math.round(TIER_EXP[Math.max(1, Math.min(4, tier))] * (KIND_WEIGHT[kind] ?? 1));

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
  if (charExp > 0) gainExp(world.char, charExp);
  return gained;
}
