// Combat math. Pure functions; pass `rng` (returns a number in [0, 1)) for deterministic tests.
// The structure follows classic side-scroller rules: a primary and secondary stat per weapon type,
// mastery narrowing the damage range, INT-driven magic, monster defense, and a level-gap penalty.

import { expToNext } from './exp.js';

// Weapon types: which stats drive damage and how strongly. `ranged` weapons fire projectiles.
export const WEAPON_TYPES = {
  none: { mult: 1.2, primary: 'str', secondary: ['dex'], ranged: false },
  sword: { mult: 1.8, primary: 'str', secondary: ['dex'], ranged: false },
  axe: { mult: 1.95, primary: 'str', secondary: ['dex'], ranged: false },
  spear: { mult: 2.3, primary: 'str', secondary: ['dex'], ranged: false },
  wand: { mult: 1.2, primary: 'str', secondary: ['dex'], ranged: false },
  staff: { mult: 1.3, primary: 'str', secondary: ['dex'], ranged: false },
  bow: { mult: 2.4, primary: 'dex', secondary: ['str'], ranged: true },
  crossbow: { mult: 2.6, primary: 'dex', secondary: ['str'], ranged: true },
  dagger: { mult: 1.6, primary: 'luk', secondary: ['str', 'dex'], ranged: false },
  gauntlet: { mult: 2.4, primary: 'luk', secondary: ['str', 'dex'], ranged: true },
};

export const BASE_CRIT_RATE = 0.05;
export const BASE_CRIT_DAMAGE = 0.2; // a crit deals +20%
export const DAMAGE_CAP = 99999;

// Weapon (physical) damage range for a skill of `skillPct` percent (100 = a basic attack).
// `mastery` is a fraction (0.1 base, up to about 0.6 with mastery skills) and only lifts the minimum.
export function physicalRange(stats, weaponType, skillPct = 100) {
  const w = WEAPON_TYPES[weaponType] ?? WEAPON_TYPES.none;
  const primary = stats[w.primary];
  const secondary = w.secondary.reduce((sum, key) => sum + stats[key], 0);
  // (`power` is the job's own damage tuning, data/jobs.js.)
  const s = (skillPct / 100) * (stats.power ?? 1);
  const max = s * stats.watk * (1 + (primary * w.mult + secondary) / 100);
  const min = s * stats.watk * (0.8 + (primary * stats.mastery * w.mult + secondary) / 100);
  return { min: Math.max(1, min), max: Math.max(1, max) };
}

// Spell damage range. Magic power is half of INT plus equipment and buffs.
export function magicRange(stats, skillPower) {
  const s = (skillPower / 100) * (stats.power ?? 1);
  const magic = Math.floor(stats.int / 2) + stats.matk;
  const max = s * magic * (1 + stats.int / 125);
  const min = s * magic * (1 + (stats.int * stats.mastery) / 125);
  return { min: Math.max(1, min), max: Math.max(1, max) };
}

// Damage multiplier when the monster outlevels the player.
export function levelGapFactor(playerLevel, mobLevel) {
  const gap = mobLevel - playerLevel;
  if (gap <= 0) return 1;
  if (gap < 10) return 1 / (1 + gap * gap * 0.005);
  return 1 / (1 + gap * 0.05);
}

export function afterDefense(raw, def) {
  return (raw * 100) / (Math.max(0, def) + 100);
}

// Rolls one hit against a monster. Returns { damage, crit }.
export function rollHit(range, stats, mob, playerLevel, rng = Math.random, extraCrit = 0, extraCritDamage = 0) {
  let dmg = range.min + (range.max - range.min) * rng();
  const crit = rng() < BASE_CRIT_RATE + stats.critRate + extraCrit;
  if (crit) dmg *= 1 + BASE_CRIT_DAMAGE + stats.critDamage + extraCritDamage;
  dmg = afterDefense(dmg, mob.def ?? 0) * levelGapFactor(playerLevel, mob.level);
  return { damage: Math.trunc(Math.min(DAMAGE_CAP, Math.max(1, dmg))), crit };
}

// Accuracy by job family. Magic users lean on INT instead of DEX.
export function accuracy(family, stats, level) {
  if (family === 'mage') return Math.floor((1.2 * stats.int + 2 * level + 0.6 * stats.luk) / 5.1 + 20) + stats.acc;
  const common = 1.2 * stats.dex + 2 * level + 0.6 * stats.luk;
  const byFamily = {
    beginner: common / 2.5 + 5,
    warrior: common / 2.5 + 10,
    archer: common / 4.8 + 20,
    thief: common / 4 + 15,
  };
  return Math.floor(byFamily[family] ?? byFamily.beginner) + stats.acc;
}

export function avoid(stats) {
  return Math.floor(stats.luk / 3) + Math.floor(stats.dex / 6) + 5 + stats.eva;
}

// Chance (0-1) that the player's attack lands on `mob`. Higher-level monsters are harder to hit.
export function hitChance(acc, playerLevel, mob) {
  const gap = Math.max(0, mob.level - playerLevel);
  const a = (acc * 100) / (10 * gap + 255);
  const eva = mob.eva ?? 0;
  if (a <= 0) return 0;
  const d = a - eva;
  if (d >= 25 + gap * (0.5 * playerLevel + 15)) return 1;
  const f = 0.15 + 0.2 / (1 + Math.exp(d / 12));
  const q = eva / a;
  if (q <= 1 - f) return 1;
  if (q >= 1 + f) return 0;
  return (1 + f - q) / (2 * f);
}

// Chance (0-1) that a monster's touch lands on the player.
export function mobHitChance(mobAcc, playerAvoid) {
  return Math.min(0.98, Math.max(0.35, mobAcc / (mobAcc + playerAvoid * 0.6)));
}

// Damage a monster deals to the player after weapon defense.
export function damageTaken(mobAtk, wdef, rng = Math.random) {
  const raw = mobAtk * (0.85 + 0.15 * rng());
  return Math.max(1, Math.round((raw * 100) / (100 + wdef)));
}

// EXP lost on death. Base LUK softens it; it never costs a level.
export function deathExpLoss(level, baseLuk) {
  const need = expToNext(level);
  if (!Number.isFinite(need)) return 0;
  return Math.floor((need * (5 + 20 / Math.max(1, baseLuk))) / 100);
}
