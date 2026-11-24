// What the adventurers know of the world, read from the game's own data (never made up): where to
// hunt at each level and what it pays, every boss and where it stands, the gear ladder's tiers and
// what each costs on the money scale (100 gold is little, 1,000 decent, 100,000 a lot).
import { MAPS } from '../../data/maps.js';
import { MOBS } from '../../data/mobs.js';
import { expToNext, MAX_LEVEL } from '../../core/exp.js';
import { BRANCHES } from '../../data/adventurers.js';

let HUNT = null;
let BOSSES = null;

// Hunting maps: every open field map with monsters, its monsters' average level, and what a kill
// pays on average (EXP, gold), sorted by level.
export function huntingMaps() {
  if (HUNT) return HUNT;
  HUNT = [];
  for (const m of Object.values(MAPS)) {
    if (m.isTown || m.dungeon || m.private || !m.spawns?.length) continue;
    const mobs = m.spawns.map((s) => MOBS[s.mob]).filter((d) => d && !d.boss && (d.exp ?? 0) > 0);
    if (!mobs.length) continue;
    const avg = (f) => mobs.reduce((a, d) => a + f(d), 0) / mobs.length;
    HUNT.push({ id: m.id, name: m.name, town: m.town, level: avg((d) => d.level), exp: avg((d) => d.exp), gold: avg((d) => ((d.gold?.[0] ?? 0) + (d.gold?.[1] ?? 0)) / 2), mobs: [...new Set(mobs.map((d) => d.id))] });
  }
  HUNT.sort((a, b) => a.level - b.level);
  return HUNT;
}

// The map that suits a level best: the highest whose monsters are no more than a level or two above,
// so a kill is quick; `prefer` (learned values by map id) can tip it toward a map they like.
export function bestHunt(level, prefer = null) {
  const maps = huntingMaps();
  let best = maps[0];
  let bestScore = -Infinity;
  for (const m of maps) {
    const gap = m.level - level;
    if (gap > 2.5) continue;
    // (too easy pays little: monsters far below give a fraction of their worth in time)
    const score = -Math.abs(gap + 1) + (prefer?.[m.id] ?? 0) * 2;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

// Every boss: its level, the map it stands on, and whether it takes a group (a dungeon's boss).
export function bosses() {
  if (BOSSES) return BOSSES;
  const where = {};
  for (const m of Object.values(MAPS)) for (const s of m.spawns ?? []) if (MOBS[s.mob]?.boss) where[s.mob] ??= m;
  BOSSES = Object.values(MOBS).filter((d) => d.boss).map((d) => ({ id: d.id, name: d.name, level: d.level, map: where[d.id]?.id ?? null, group: Boolean(where[d.id]?.dungeon), dungeon: where[d.id]?.dungeon ?? null })).sort((a, b) => a.level - b.level);
  return BOSSES;
}
export const bossById = (id) => bosses().find((b) => b.id === id) ?? null;
// The next boss at or above a level, one they haven't beaten: their wall.
export function nextWall(level, beaten = {}) {
  return bosses().find((b) => b.level >= level - 1 && b.level <= level + 2 && !beaten[b.id]) ?? null;
}

// The gear ladder (data/items.js: Sprout 5, Rootwood 10, Tidepearl 20, Starglass 30, Dreamsilk 40,
// Regalia 50), what a full set costs, and the tier a level wears.
export const TIERS = [
  { id: 'sprout', level: 5, cost: 300 },
  { id: 'rootwood', level: 10, cost: 1500 },
  { id: 'tidepearl', level: 20, cost: 7000 },
  { id: 'starglass', level: 30, cost: 20000 },
  { id: 'dreamsilk', level: 40, cost: 48000 },
  { id: 'regalia', level: 50, cost: 120000 },
];
export const tierFor = (level) => [...TIERS].reverse().find((t) => level >= t.level) ?? null;
export const tierIndex = (id) => TIERS.findIndex((t) => t.id === id);

// The job an adventurer holds at a level, the way a player's job line goes: a novice until 5, the
// first job until 30, then its branch. A peer or veteran's branch is their own (`def.job`); a rookie
// picks theirs at 30 by who they've become: the caring and patient take the support branch, the
// proud and bold the damage one.
const SUPPORT = new Set(['stormwall', 'tidecaller', 'silkweaver', 'songbird']);
const BASE_OF = {};
for (const [base, list] of Object.entries(BRANCHES)) for (const b of list) BASE_OF[b] = base;
export function branchFor(def) {
  const list = BRANCHES[def.path];
  if (!list) return def.path;
  const t = def.traits;
  const wantsSupport = t.warmth + t.patience > t.pride + t.bravery;
  return list.find((b) => SUPPORT.has(b) === wantsSupport) ?? list[0];
}
export function jobAt(def, level) {
  if (level < 5) return 'novice';
  const base = def.path ?? BASE_OF[def.job] ?? def.job;
  if (level < 30) return base;
  return def.path ? branchFor(def) : def.job;
}
// The role a job fights as in a group.
export const roleOf = (job) =>
  ({ stormwall: 'tank', warrior: 'tank', tidecaller: 'healer', songbird: 'healer', silkweaver: 'control', tidemage: 'support', novice: 'novice' })[job] ?? 'damage';

// EXP to go from `level` to the next (the player's own curve).
export const expNeed = (level) => (level >= MAX_LEVEL ? Infinity : expToNext(level));
export { MAX_LEVEL };
