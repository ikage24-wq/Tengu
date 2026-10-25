// Using attacks and skills: checks, target selection, hit rolls, buffs, heals, and visual effects.
// Hits are queued with a delay (projectile travel, multi-hit spacing) and applied by the world.

import { SKILLS, skillAt } from '../data/skills.js';
import { JOBS } from '../data/jobs.js';
import { WEAPON_TYPES, physicalRange, magicRange, rollHit, accuracy, hitChance } from '../core/formulas.js';
import { mobBox } from './mobs.js';

const BASE_DELAY = 0.5; // seconds between attacks at normal speed
const PROJECTILE_SPEED = 620;

const BASIC_MELEE = { pct: 100, hits: 1, targets: 1, range: { w: 62, h: 52 }, mp: 0 };
const BASIC_RANGED = { pct: 100, hits: 1, targets: 1, range: { w: 260, h: 52 }, mp: 0, projectile: true };

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// The skill's hit box in world space, in front of the player (or around them).
export function hitBox(body, range) {
  const cy = body.y - body.h / 2;
  if (range.around) return { x: body.x - range.w / 2, y: cy - range.h / 2, w: range.w, h: range.h };
  const x = body.facing > 0 ? body.x - 6 : body.x + 6 - range.w;
  return { x, y: cy - range.h / 2, w: range.w, h: range.h };
}

// Live monsters in the box, nearest first, up to `targets`.
export function pickTargets(mobs, body, range, targets) {
  const box = hitBox(body, range);
  return mobs
    .filter((m) => m.hp > 0 && overlaps(box, mobBox(m)))
    .sort((a, b) => Math.abs(a.x - body.x) - Math.abs(b.x - body.x))
    .slice(0, targets);
}

// Why a skill can't be used right now, or null if it can.
export function castBlocker(world, skillId) {
  const { char, stats, now } = world;
  if (world.attackTimer > 0) return 'busy';
  if (!skillId) return null;
  const s = SKILLS[skillId];
  const lv = char.skills[skillId] ?? 0;
  if (!s || lv <= 0) return 'unlearned';
  if (s.type === 'passive') return 'passive';
  if ((world.cooldowns[skillId] ?? 0) > now) return 'cooldown';
  if (s.weapons && !s.weapons.includes(stats.weaponType)) return 'weapon';
  if (char.mp < skillAt(skillId, lv).mp) return 'mp';
  return null;
}

// Uses a skill (or a basic attack when skillId is null). Returns { ok, reason }.
export function cast(world, skillId, rng = Math.random) {
  const blocker = castBlocker(world, skillId);
  if (blocker) return { ok: false, reason: blocker };

  const { char, stats, body, now } = world;
  const s = skillId ? SKILLS[skillId] : null;
  const ranged = WEAPON_TYPES[stats.weaponType]?.ranged;
  const params = s ? skillAt(skillId, char.skills[skillId]) : ranged ? BASIC_RANGED : BASIC_MELEE;
  const type = s ? s.type : 'attack';

  char.mp -= params.mp ?? 0;
  if (s?.cooldown) world.cooldowns[skillId] = now + s.cooldown;

  const delay = BASE_DELAY * (1 - stats.attackSpeed);
  world.attackTimer = type === 'buff' ? 0.35 : delay;
  const pose = type === 'magic' || type === 'heal' || type === 'buff' ? 'cast' : ranged || params.projectile ? 'shoot' : 'swing';
  world.pose = { kind: pose, t: Math.min(0.35, world.attackTimer), dur: Math.min(0.35, world.attackTimer) };

  if (type === 'buff') {
    char.buffs[skillId] = { until: now + params.duration, values: params.buff, name: s.name };
    world.fx.push({ kind: 'buff', x: body.x, y: body.y, t: 0, dur: 0.7, color: '#ffe36b' });
    world.log(`${s.name} is active.`, '#ffe36b');
    return { ok: true };
  }

  if (type === 'heal') {
    const amount = Math.round(stats.maxHp * params.healPct);
    char.hp = Math.min(stats.maxHp, char.hp + amount);
    world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: `+${amount}`, color: '#7ee081', t: 0, big: false });
    world.fx.push({ kind: 'heal', x: body.x, y: body.y, t: 0, dur: 0.8 });
  }

  const targets = pickTargets(world.mobs, body, params.range, params.targets);
  const family = JOBS[char.job].family;
  const acc = accuracy(family, stats, char.level);
  const range = type === 'attack' ? physicalRange(stats, stats.weaponType, params.pct) : magicRange(stats, params.power);
  const fxKind = s?.fx ?? (ranged ? 'arrow' : 'swing');

  if (!params.projectile) {
    const box = hitBox(body, params.range);
    world.fx.push({ kind: fxKind, x: body.x, y: body.y, dir: body.facing, box, t: 0, dur: 0.3 });
  }

  targets.forEach((m, ti) => {
    const dist = Math.abs(m.x - body.x);
    const travel = params.projectile ? dist / PROJECTILE_SPEED : 0.1;
    for (let n = 0; n < params.hits; n++) {
      const at = now + travel + n * 0.09 + ti * 0.02;
      const miss = rng() >= hitChance(acc, char.level, m.def);
      const roll = miss ? null : rollHit(range, stats, m.def, char.level, rng, params.critRate ?? 0);
      world.pending.push({ at, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: body.x, stack: n });
      if (params.projectile) {
        world.fx.push({
          kind: 'projectile', shot: fxKind, x: body.x + body.facing * 10, y: body.y - body.h * 0.55,
          tx: m.x, ty: m.y - m.def.h / 2, t: -(n * 0.09 + ti * 0.02), dur: Math.max(0.08, travel),
        });
      }
    }
    if (!params.projectile && (type === 'magic' || type === 'heal')) {
      world.fx.push({ kind: fxKind, x: m.x, y: m.y, t: 0, dur: 0.45 });
    }
  });

  // A projectile with nothing in range still flies, so the shot doesn't feel swallowed.
  if (params.projectile && !targets.length) {
    world.fx.push({
      kind: 'projectile', shot: fxKind, x: body.x + body.facing * 10, y: body.y - body.h * 0.55,
      tx: body.x + body.facing * params.range.w, ty: body.y - body.h * 0.55, t: 0, dur: params.range.w / PROJECTILE_SPEED,
    });
  }
  return { ok: true, targets: targets.length };
}
