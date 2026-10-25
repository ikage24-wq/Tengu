// Mob definitions, simple patrol AI, and death rewards.
// Pure logic: rendering and collision are handled by the game loop.

import { rollGear } from './gear.js';

export const MOB_TYPES = {
  snail: { name: 'Snail', level: 1, hp: 30, atk: 4, exp: 8, goldMin: 2, goldMax: 6, w: 34, h: 24, speed: 40, color: '#9ccf6b' },
  mushroom: { name: 'Mushroom', level: 8, hp: 70, atk: 8, exp: 20, goldMin: 5, goldMax: 14, w: 32, h: 36, speed: 60, color: '#d9733c' },
  wolf: { name: 'Wolf', level: 18, hp: 160, atk: 16, exp: 55, goldMin: 12, goldMax: 30, w: 48, h: 34, speed: 95, color: '#8d8fa6' },
  golem: { name: 'Golem', level: 30, hp: 420, atk: 30, exp: 150, goldMin: 30, goldMax: 70, w: 60, h: 64, speed: 35, color: '#a58a6a' },
};

// Chance a mob drops gear. Bosses and higher-tier mobs roll gear more often.
const GEAR_DROP_CHANCE = { snail: 0.02, mushroom: 0.04, wolf: 0.08, golem: 0.25 };

export function createMob(typeId, x, y, patrolRange = 160) {
  const t = MOB_TYPES[typeId];
  return {
    typeId,
    x,
    y,
    w: t.w,
    h: t.h,
    hp: t.hp,
    maxHp: t.hp,
    homeX: x,
    range: patrolRange,
    dir: 1,
    alive: true,
    hitCooldown: 0,
  };
}

export function updateMob(mob, dt) {
  if (!mob.alive) return;
  const t = MOB_TYPES[mob.typeId];
  mob.x += mob.dir * t.speed * dt;
  if (mob.x > mob.homeX + mob.range) mob.dir = -1;
  if (mob.x < mob.homeX - mob.range) mob.dir = 1;
  mob.hitCooldown = Math.max(0, mob.hitCooldown - dt);
}

// Applies damage. Returns true if this hit killed the mob.
export function damageMob(mob, amount) {
  if (!mob.alive) return false;
  mob.hp -= amount;
  if (mob.hp <= 0) {
    mob.hp = 0;
    mob.alive = false;
    return true;
  }
  return false;
}

// Rewards for killing a mob: EXP, gold, and an optional gear drop.
// `rng` is injectable so tests are deterministic.
export function rollDeathRewards(mob, rng = Math.random, playerLevel = 1) {
  const t = MOB_TYPES[mob.typeId];
  // Mobs far below the player's level give less EXP, which discourages farming trivial spots.
  const levelPenalty = Math.max(0.2, Math.min(1, t.level / playerLevel));
  const exp = Math.round(t.exp * levelPenalty);
  const gold = t.goldMin + Math.floor(rng() * (t.goldMax - t.goldMin + 1));
  const gear = rng() < GEAR_DROP_CHANCE[mob.typeId] ? rollGear(playerLevel, rng) : null;
  return { exp, gold, gear };
}
