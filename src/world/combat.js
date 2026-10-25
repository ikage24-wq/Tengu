// Using attacks and skills: checks, target selection, hit rolls, buffs, heals, and visual effects.
// Hits are queued with a delay (projectile travel, multi-hit spacing) and applied by the world.

import { SKILLS, skillAt } from '../data/skills.js';
import { JOBS } from '../data/jobs.js';
import { WEAPON_TYPES, physicalRange, magicRange, rollHit, accuracy, hitChance } from '../core/formulas.js';
import { mobBox } from './mobs.js';
import { ITEMS } from '../data/items.js';

// The element of the player's weapon (endgame weapons only); attack effects take it on.
export function weaponElement(char) {
  const w = char.equipment.weapon;
  return w ? ITEMS[w.id]?.element ?? null : null;
}

// Ultimates that light up the whole screen, and area spells whose sweep lasts longer than a slash.
const STORMS = new Set(['meteor', 'judgment', 'tempest']);
const SWEEPS = { mist: 0.9, toxicblaze: 0.8, icespire: 0.7, thunder: 0.5, shiningray: 0.7, burst: 0.45 };

// What a spell shot does when it lands: an elemental impact, or a spell effect by kind.
const SHOT_IMPACTS = { bolt: 'burst', fire: 'fire', holy: 'holy', venomfire: 'mist' };

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
  const { char, stats } = world;
  if (world.attackTimer > 0 || world.lockTimer > 0) return 'busy';
  if (!skillId) return null;
  const s = SKILLS[skillId];
  const lv = char.skills[skillId] ?? 0;
  if (!s || lv <= 0) return 'unlearned';
  if (s.type === 'passive') return 'passive';
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
  const element = weaponElement(char);
  const ranged = WEAPON_TYPES[stats.weaponType]?.ranged;
  const params = s ? skillAt(skillId, char.skills[skillId]) : ranged ? BASIC_RANGED : BASIC_MELEE;
  const type = s ? s.type : 'attack';

  char.mp -= params.mp ?? 0;

  const delay = BASE_DELAY * (1 - stats.attackSpeed);
  world.attackTimer = type === 'buff' ? 0.35 : delay;
  // Big skills plant you for their wind-up and play their pose slower, as one heavy motion.
  const lock = s?.lock ?? 0;
  world.lockTimer = Math.max(world.lockTimer ?? 0, lock);
  const pose = type === 'magic' || type === 'heal' || type === 'buff' ? 'cast' : ranged || params.projectile ? 'shoot' : 'swing';
  const poseDur = lock || Math.min(0.35, world.attackTimer);
  world.pose = { kind: pose, t: poseDur, dur: poseDur };
  // Spells glow with a magic circle at your feet in their school's color.
  if (s?.school) world.fx.push({ kind: 'castcircle', school: s.school, x: body.x, y: body.y, t: 0, dur: Math.max(0.5, lock + 0.2), big: lock >= 1 });

  if (type === 'blink') {
    // Vanish, reappear ahead, and shake off monsters for a moment.
    const from = body.x;
    body.x = Math.max(body.w / 2, Math.min(world.map.width - body.w / 2, body.x + body.facing * params.distance));
    world.invuln = Math.max(world.invuln, 0.4);
    world.fx.push({ kind: 'blink', x: from, y: body.y, tx: body.x, dir: body.facing, t: 0, dur: 0.45 });
    world.fx.push({ kind: 'blinkin', x: body.x, y: body.y, t: 0, dur: 0.4 });
    return { ok: true };
  }

  if (type === 'buff') {
    // Summons ride on a buff: they attack on their own timer until the buff ends.
    const summon = params.summon ? { ...params.summon, timer: 0.6 } : null;
    char.buffs[skillId] = { until: now + params.duration, values: params.buff, name: s.name, summon };
    world.fx.push({ kind: 'buff', x: body.x, y: body.y, t: 0, dur: 0.7, school: s.school });
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
    world.fx.push({ kind: fxKind, x: body.x, y: body.y, dir: body.facing, box, t: 0, dur: STORMS.has(fxKind) ? 0.9 : SWEEPS[fxKind] ?? 0.3, element });
    if (STORMS.has(fxKind)) world.juice?.push({ type: 'shake', mag: 3, dur: 0.9, delay: 0.3 });
    if (fxKind === 'thunder' || fxKind === 'chain' || fxKind === 'icespire') world.juice?.push({ type: 'shake', mag: 1.5, dur: 0.25, delay: 0.1 });
  }
  // Chain lightning: one bolt that hops from the caster through each target in turn.
  if (params.chain && targets.length) {
    const points = [{ x: body.x + body.facing * 10, y: body.y - body.h * 0.6 }, ...targets.map((m) => ({ x: m.x, y: m.y - m.def.h / 2 }))];
    world.fx.push({ kind: 'chainbolt', points, x: 0, y: 0, t: 0, dur: 0.5, seed: rng() });
  }

  targets.forEach((m, ti) => {
    const dist = Math.abs(m.x - body.x);
    const travel = params.projectile ? dist / PROJECTILE_SPEED : params.delay ?? 0.1;
    for (let n = 0; n < params.hits; n++) {
      const at = now + travel + n * 0.09 + ti * 0.02;
      const miss = rng() >= hitChance(acc, char.level, m.def);
      const roll = miss ? null : rollHit(range, stats, m.def, char.level, rng, params.critRate ?? 0);
      const chainAt = params.chain ? ti * 0.06 : 0;
      world.pending.push({
        at: at + chainAt, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: body.x, stack: n,
        freeze: params.freeze, poison: params.poison, burst: params.projectile && s?.school ? SHOT_IMPACTS[fxKind] : null,
      });
      if (params.projectile) {
        world.fx.push({
          kind: 'projectile', shot: fxKind, x: body.x + body.facing * 10, y: body.y - body.h * 0.55,
          tx: m.x, ty: m.y - m.def.h / 2, t: -(n * 0.09 + ti * 0.02), dur: Math.max(0.08, travel), element,
        });
      }
    }
    if (!params.projectile && (type === 'magic' || type === 'heal') && !params.chain) {
      const storm = STORMS.has(fxKind);
      world.fx.push({ kind: fxKind, x: m.x, y: m.y, h: m.def.h, t: storm ? -ti * 0.025 : -(params.delay ?? 0) * 0.5, dur: storm ? 0.9 : 0.55, seed: rng() });
    }
  });

  // A projectile with nothing in range still flies, so the shot doesn't feel swallowed.
  if (params.projectile && !targets.length) {
    world.fx.push({
      kind: 'projectile', shot: fxKind, x: body.x + body.facing * 10, y: body.y - body.h * 0.55,
      tx: body.x + body.facing * params.range.w, ty: body.y - body.h * 0.55, t: 0, dur: params.range.w / PROJECTILE_SPEED, element,
    });
  }
  return { ok: true, targets: targets.length };
}

// Where a summon floats: just behind the player's shoulder, bobbing gently.
export function summonPosition(world, index = 0) {
  const b = world.body;
  return { x: b.x - b.facing * (24 + index * 18), y: b.y - 62 + Math.sin(world.now * 3 + index) * 3 };
}

// One summon attack: magic bolts from the summon to nearby monsters.
export function summonStrike(world, summon, from, rng = Math.random) {
  const { char, stats, body, now } = world;
  const targets = pickTargets(world.mobs, body, summon.range, summon.targets);
  if (!targets.length) return 0;
  const range = magicRange(stats, summon.power);
  const acc = accuracy(JOBS[char.job].family, stats, char.level);
  targets.forEach((m, i) => {
    const travel = Math.hypot(m.x - from.x, m.y - from.y) / 700;
    const miss = rng() >= hitChance(acc, char.level, m.def);
    const roll = miss ? null : rollHit(range, stats, m.def, char.level, rng);
    world.pending.push({
      at: now + travel + i * 0.03, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: from.x, stack: 0,
      freeze: summon.freeze, poison: summon.poison, burst: SHOT_IMPACTS[summon.fx],
    });
    world.fx.push({ kind: 'projectile', shot: summon.fx, x: from.x, y: from.y, tx: m.x, ty: m.y - m.def.h / 2, t: -i * 0.03, dur: Math.max(0.08, travel) });
  });
  return targets.length;
}
