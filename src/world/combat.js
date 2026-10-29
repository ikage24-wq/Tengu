// Using attacks and skills: checks, target selection, hit rolls, buffs, heals, and visual effects.
// Hits are queued with a delay (projectile travel, multi-hit spacing) and applied by the world.

import { SKILLS, skillAt } from '../data/skills.js';
import { JOBS } from '../data/jobs.js';
import { WEAPON_TYPES, physicalRange, magicRange, rollHit, accuracy, hitChance } from '../core/formulas.js';
import { mobBox } from './mobs.js';
import { ITEMS } from '../data/items.js';
import { MOVE_MIN, basicMove, defaultMove } from '../render/moves.js';
import { healMembers, buffMembers, reviveTarget, reviveMember, provoke } from './dungeon.js';
import { guard } from './pets.js';
import { kitsuneGuard } from './kitsune.js';
import { hasCombo, hasPathCombo, basicCombo, skillCombo, addRage, addAim, addKi, RAGE_MAX, outgoing, gaugeOf, gaugeFull, AFTER, pathSchool, schoolFor, SCHOOL_TEXT, bulwarkWave, inForm, formSkill, hasFaith, hasRage } from './melee.js';
import { activeStar, useStars } from '../core/inventory.js';

// The element of the player's weapon (endgame weapons only); attack effects take it on.
export function weaponElement(char) {
  const w = char.equipment.weapon;
  return w ? ITEMS[w.id]?.element ?? null : null;
}

// Hit-stop for a spell or shot landing: shots stop half as long as a blow, an ultimate longest.
function spellStop(params, ultimate) {
  return ultimate ? 0.09 : params.projectile ? 0.02 : 0.035;
}

const BASE_DELAY = 0.5; // seconds between attacks at normal speed
// Linking a skill onto a finisher: how soon after it connects, and the bonus (% damage).
export const LINK_WINDOW = 0.7;
const LINK_BONUS = 25;
// Shots and spells leave from the hands, chest high above the feet.
const HAND_Y = 17;
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
  // A dash's path: the stretch just crossed, behind where the player now stands.
  if (range.back) return { x: body.facing > 0 ? body.x + 20 - range.w : body.x - 20, y: cy - range.h / 2, w: range.w, h: range.h };
  const x = body.facing > 0 ? body.x - 6 : body.x + 6 - range.w;
  // `dy` shifts the box down (or up), for shots aimed below or above you.
  return { x, y: cy - range.h / 2 + (range.dy ?? 0), w: range.w, h: range.h };
}

// A monster's box stretched up to wherever it's been knocked into the air, so blows reach it both
// on the ground under it and up where it flies (air combos).
function airBox(m) {
  const b = mobBox(m);
  const air = Math.max(0, m.air ?? 0);
  return air ? { ...b, y: b.y - air, h: b.h + air } : b;
}

// Live monsters in the box, nearest first, up to `targets`.
export function pickTargets(mobs, body, range, targets) {
  const box = hitBox(body, range);
  return mobs
    .filter((m) => m.hp > 0 && overlaps(box, airBox(m)))
    .sort((a, b) => Math.abs(a.x - body.x) - Math.abs(b.x - body.x))
    .slice(0, targets);
}

// Once a move's blows have landed it can be cut short (see `recovering`): walking or jumping ends
// it, a basic attack can flow straight into a skill, and a skill into a basic attack. But every
// skill plays out its own motion before the next skill can start (moving doesn't skip that), and
// basic attacks keep their own rhythm.
export function recovering(world) {
  return world.recoverAt != null && world.now >= world.recoverAt;
}

// Why a skill can't be used right now, or null if it can.
export function castBlocker(world, skillId) {
  const { char, stats } = world;
  if (world.attackTimer > 0 || world.lockTimer > 0) {
    if (!recovering(world) || world.recoverKind === (skillId ? 'skill' : 'basic')) return 'busy';
  }
  if (!skillId && world.now < (world.basicReadyAt ?? 0)) return 'busy';
  if (skillId && world.now < (world.skillReadyAt ?? 0)) return 'busy';
  // A gauntlet throws stars from your bag: none left, nothing to throw.
  const throwsStars = stats.weaponType === 'gauntlet' && (!skillId || SKILLS[skillId]?.weapons?.includes('gauntlet'));
  if (throwsStars && SKILLS[skillId]?.type !== 'passive' && (!skillId || char.skills[skillId] > 0) && !activeStar(char)) return 'stars';
  if (!skillId) return null;
  const s = SKILLS[skillId];
  const lv = char.skills[skillId] ?? 0;
  if (!s || lv <= 0) return 'unlearned';
  if (s.type === 'passive') return 'passive';
  if (s.weapons && !s.weapons.includes(stats.weaponType)) return 'weapon';
  if (char.mp < skillAt(skillId, lv).mp) return 'mp';
  if (s.rageCost && (world.rage ?? 0) < s.rageCost) return 'rage';
  if (s.fullGauge && !gaugeFull(world)) return `gauge:${gaugeOf(char) ?? 'none'}`;
  if (s.type === 'revive' && !reviveTarget(world, hitBox(world.body, skillAt(skillId, lv).range))) return 'noone';
  return null;
}

// Puts a buff skill's bonuses on you for its `duration` (from a cast, or set off by a proc): a
// war cry also turns the monsters in range on you, and party buffs land on the party around you.
export function applyBuff(world, skillId, params) {
  const { char, stats, body, now } = world;
  const s = SKILLS[skillId];
  char.buffs[skillId] = { until: now + params.duration, since: now, values: params.buff, name: s.name };
  if (params.buff.barrier) char.buffs[skillId].shield = Math.round(stats.maxHp * params.buff.barrier);
  world.fx.push({ kind: 'buffcast', skill: skillId, name: s.name, school: schoolFor(char, s.school), x: body.x, y: body.y, dir: body.facing, t: 0, dur: 1.1 });
  // A Shinobi's Smoke Bomb: she's untouchable a moment in the smoke, the monsters lose track of
  // her, and it builds Ki.
  if (params.ki) addKi(world, params.ki);
  if (params.guard) world.invuln = Math.max(world.invuln, params.guard);
  if (params.lose) {
    for (const m of world.mobs) if (m.hp > 0 && Math.abs(m.x - body.x) < params.lose) m.aggroUntil = 0;
  }
  if (params.taunt) {
    if (world.dungeon) provoke(world, 'you', body, params.range.w / 2, params.taunt);
    else {
      const box = hitBox(body, params.range);
      for (const m of world.mobs) {
        if (m.hp <= 0 || !overlaps(box, mobBox(m))) continue;
        m.aggroUntil = now + 6;
        m.dir = Math.sign(body.x - m.x) || m.dir;
      }
    }
    world.juice?.push({ type: 'shake', mag: 1.5, dur: 0.2 });
  }
  if (s.party && world.dungeon) buffMembers(world, skillId, s.name, params, hitBox(body, params.range));
  world.log(`${s.name} is active.`, '#ffe36b');
}

// ---------- Procs: skills that set themselves off ----------
// A proc skill (`proc` in data/skills.js) goes off on its own from what happens in a fight. The
// blade ones (Blade Rush, Whirlwind) live with the combos in world/melee.js; these two answer to
// the fight itself.

// The proc values of a learned proc skill, or null.
export function procOf(char, skillId) {
  const lv = char.skills?.[skillId] ?? 0;
  return lv > 0 ? skillAt(skillId, lv).proc ?? null : null;
}

// War Cry: your gauge just filled, so you shout.
export function cryOut(world) {
  const p = procOf(world.char, 'warcry');
  if (!p || world.dead) return;
  applyBuff(world, 'warcry', p);
  world.fx.push({ kind: 'powerup', school: pathSchool(world.char), x: world.body.x, y: world.body.y, t: 0, dur: 0.6, big: true });
}

// Iron Guard: a hit that took at least `hard` of your max HP may make you brace (not while
// already braced). `rng` for tests.
export function braceOnHit(world, dmg, rng = Math.random) {
  const p = procOf(world.char, 'ironguard');
  if (!p || world.dead || dmg < world.stats.maxHp * p.hard) return;
  if ((world.char.buffs.ironguard?.until ?? 0) > world.now || rng() >= p.chance) return;
  applyBuff(world, 'ironguard', p);
}

// Divine Aegis (Paladin): a hit that leaves you under `low` of your max HP makes you raise your
// blade, guarding and mending you and the party around you (not while it's already up).
export function rallyOnHit(world) {
  const p = procOf(world.char, 'divineaegis');
  const { char, stats } = world;
  if (!p || world.dead || char.hp >= stats.maxHp * p.low) return;
  if ((char.buffs.divineaegis?.until ?? 0) > world.now) return;
  applyBuff(world, 'divineaegis', p);
  world.fx.push({ kind: 'powerup', school: 'holy', x: world.body.x, y: world.body.y, t: 0, dur: 0.6, big: true });
}

// Before a hit lands, it may not land at all. Sacred Bulwark (Paladin): a shield of light flashes
// up and blocks it, then a holy shockwave answers it. Moon Ward (Beastmaster): Snow wolf plants her
// greatsword in front of it (from `fromX`) behind a crescent of moonlight, and flicks one back. True if the hit is gone. `rng` for tests.
export function blockOnHit(world, fromX = null, rng = Math.random) {
  const { body } = world;
  if (world.dead) return false;
  const p = procOf(world.char, 'sacredbulwark');
  if (p && rng() < p.chance) {
    world.invuln = Math.max(world.invuln, 0.5);
    world.fx.push({ kind: 'aegis', school: 'holy', x: body.x, y: body.y, dir: body.facing, t: 0, dur: 0.6 });
    world.fx.push({ kind: 'powerup', school: 'holy', x: body.x, y: body.y, t: 0, dur: 0.5 });
    world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: 'BLOCK', color: SCHOOL_TEXT.holy, t: 0 });
    world.juice.push({ type: 'shake', mag: 1.5, dur: 0.15 });
    bulwarkWave(world, p);
    return true;
  }
  // The Shrine Maiden's kitsune guardian steps in front of it and takes it on the haft.
  if (kitsuneGuard(world, fromX, rng)) {
    world.invuln = Math.max(world.invuln, 0.5);
    world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: 'GUARD', color: '#ffd2a8', t: 0 });
    return true;
  }
  const lg = procOf(world.char, 'loyalguard');
  if (lg && rng() < lg.chance && guard(world, fromX, lg)) {
    world.invuln = Math.max(world.invuln, 0.5);
    world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: 'WARD', color: '#bcd6ff', t: 0 });
    return true;
  }
  return false;
}

// A warrior path's form: his Rage (Demon Form) or her Faith (Judgment) just filled, so the form
// takes them for a while (not while it already has).
export function transform(world) {
  const id = formSkill(world.char);
  const p = procOf(world.char, id);
  if (!p || world.dead || inForm(world)) return;
  world.formUntil = world.now + p.duration;
  applyBuff(world, id, p);
  world.juice.push({ type: 'shake', mag: 3, dur: 0.3 });
}

// Bloodlust (Berserker): a blow that lands heals him for a share of its damage, more the lower his
// HP. The healing is added up and shown about twice a second, not on every hit.
export function drinkBlood(world, dmg) {
  const p = procOf(world.char, 'bloodlust');
  const { char, stats, body } = world;
  if (!p || world.dead || dmg <= 0 || char.hp >= stats.maxHp) return 0;
  const missing = 1 - char.hp / stats.maxHp;
  const heal = Math.min(stats.maxHp - char.hp, Math.max(1, Math.round(dmg * p.steal * (1 + (p.low - 1) * missing))));
  char.hp += heal;
  world.drunk = (world.drunk ?? 0) + heal;
  if (world.now - (world.drunkAt ?? -9) >= 0.5) {
    world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: `+${world.drunk}`, color: '#ff8a9a', t: 0 });
    world.fx.push({ kind: 'healglow', x: body.x, y: body.y, t: 0, dur: 0.5 });
    world.drunk = 0;
    world.drunkAt = world.now;
  }
  return heal;
}

// Everything that answers a hit you take.
export function hurtProcs(world, dmg) {
  braceOnHit(world, dmg);
  rallyOnHit(world);
}

// Blood Frenzy (Berserker): a critical hit may send you into a frenzy, with a quarter of your Rage
// at once (not while you're already in one). `rng` for tests.
export function frenzyOnCrit(world, rng = Math.random) {
  const p = procOf(world.char, 'bloodfrenzy');
  if (!p || world.dead || (world.char.buffs.bloodfrenzy?.until ?? 0) > world.now || rng() >= p.chance) return;
  applyBuff(world, 'bloodfrenzy', p);
  addRage(world, p.rageGain);
  world.fx.push({ kind: 'powerup', school: 'rage', x: world.body.x, y: world.body.y, t: 0, dur: 0.6, big: true });
}

// Uses a skill (or a basic attack when skillId is null). Returns { ok, reason }.
export function cast(world, skillId, rng = Math.random) {
  const blocker = castBlocker(world, skillId);
  if (blocker) return { ok: false, reason: blocker };

  const { char, stats, body, now } = world;
  const s = skillId ? SKILLS[skillId] : null;
  const element = weaponElement(char);
  const ranged = WEAPON_TYPES[stats.weaponType]?.ranged;
  let params = s ? skillAt(skillId, char.skills[skillId]) : ranged ? BASIC_RANGED : BASIC_MELEE;
  const type = s ? s.type : 'attack';

  char.mp -= params.mp ?? 0;

  // Melee basic attacks and combo skills play out as timed strikes (see melee.js).
  if (!s && (hasCombo(stats.weaponType) || hasPathCombo(world))) {
    basicCombo(world);
    return { ok: true };
  }
  if (params.combo) {
    // A skill a warrior path does its own way (Shoulder Charge: Shield Rush, Reckless Charge).
    const path = hasFaith(char) ? 'paladin' : hasRage(char) ? 'berserker' : null;
    if (params.paths?.[path]) params = { ...params, combo: params.paths[path] };
    if (s.school && params.flare) world.fx.push({ kind: 'powerup', school: s.school, x: body.x, y: body.y, t: 0, dur: 0.5, big: true });
    // Rampage spends all your Rage: the more there was, the harder every blow hits (double at full).
    let scale = 100;
    // A Link: a skill started right after a combo finisher connects (a basic combo's last blow, or
    // another skill's) hits harder.
    const f = world.finisherAt;
    if (f && world.now - f.at <= LINK_WINDOW && f.key !== skillId) {
      scale += LINK_BONUS;
      world.finisherAt = null;
      world.numbers.push({ x: body.x, y: body.y - body.h - 18, text: 'LINK!', color: '#ffd24f', t: 0, link: true });
      world.fx.push({ kind: 'powerup', school: s.school, x: body.x, y: body.y, t: 0, dur: 0.4 });
    }
    // A finisher spends the path's whole gauge.
    if (s.fullGauge) world[gaugeOf(char)] = 0;
    if (params.rageGain) addRage(world, params.rageGain);
    if (params.aimGain) addAim(world, params.aimGain);
    if (s.rageCost) {
      scale += Math.round((100 * world.rage) / RAGE_MAX);
      if (world.rage >= RAGE_MAX) world.juice?.push({ type: 'shake', mag: 2, dur: 0.25 });
      world.rage = 0;
    }
    skillCombo(world, skillId, { ...params, school: schoolFor(char, s.school), fullGauge: s.fullGauge }, scale);
    return { ok: true };
  }

  const delay = BASE_DELAY * (1 - stats.attackSpeed);
  world.attackTimer = type === 'buff' ? 0.35 : delay;
  // Big skills plant you for their wind-up and play their pose slower, as one heavy motion.
  const lock = s?.lock ?? 0;
  world.lockTimer = Math.max(world.lockTimer ?? 0, lock);
  // The move to play: the skill's own, or the next step of the weapon's basic-attack combo
  // (the combo resets after a short pause).
  let pose;
  if (s) pose = s.anim ?? defaultMove(type, stats.weaponType, params);
  else {
    world.combo = now - (world.lastBasic ?? -9) < 0.9 ? (world.combo ?? 0) + 1 : 0;
    world.lastBasic = now;
    pose = basicMove(stats.weaponType, world.combo);
  }
  const poseDur = Math.max(lock, s ? MOVE_MIN[pose] ?? 0 : 0, Math.min(0.35, world.attackTimer));
  if (s && !lock) world.lockTimer = Math.max(world.lockTimer ?? 0, poseDur * 0.8);
  world.pose = { from: outgoing(world), kind: pose, t: poseDur, dur: poseDur, since: world.now };
  // Free to move (or use something else) once the move has done its thing.
  world.recoverAt = now + (lock || (s ? poseDur * 0.55 : Math.min(0.2, world.attackTimer)));
  world.recoverKind = s ? 'skill' : 'basic';
  if (!s) world.basicReadyAt = now + world.attackTimer;
  else {
    // A skill plays out its whole motion, then a beat of recovery (AFTER, melee.js): a quick
    // buff or dash a short one, a big wind-up a long one.
    const after = type === 'buff' || type === 'blink' ? AFTER.command : lock >= 1 ? AFTER.finisher : AFTER.skill;
    world.skillReadyAt = now + Math.max(world.attackTimer, world.lockTimer, poseDur) + after;
    world.basicReadyAt = Math.max(world.basicReadyAt ?? 0, now + poseDur * 0.9);
  }
  // Spells glow with a magic circle at your feet in their school's color; big weapon skills
  // flare with a burst of power instead.
  const magical = type === 'magic' || type === 'heal' || JOBS[s?.job]?.family === 'mage';
  if (s?.school && magical) world.fx.push({ kind: 'castcircle', school: s.school, x: body.x, y: body.y, t: 0, dur: Math.max(0.5, lock + 0.2), big: lock >= 1 });
  else if (s?.school && (lock || type === 'buff')) world.fx.push({ kind: 'powerup', school: s.school, x: body.x, y: body.y, t: 0, dur: Math.max(0.5, lock + 0.15), big: lock >= 1 });

  let area = params.range;
  if (type === 'blink') {
    // Vanish (or dash), reappear ahead, and shake off monsters for a moment. A negative
    // distance flips you backward. Dashes with `pct` hit everything along the way.
    const from = body.x;
    body.x = Math.max(body.w / 2, Math.min(world.map.width - body.w / 2, body.x + body.facing * params.distance));
    world.invuln = Math.max(world.invuln, 0.4);
    if (s.fx === 'charge') {
      world.fx.push({ kind: 'chargetrail', school: s.school, x: from, y: body.y, tx: body.x, dir: body.facing, t: 0, dur: 0.5 });
    } else {
      world.fx.push({ kind: 'blink', school: s.school, x: from, y: body.y, tx: body.x, dir: body.facing, t: 0, dur: 0.45 });
      world.fx.push({ kind: 'blinkin', school: s.school, x: body.x, y: body.y, t: 0, dur: 0.4 });
    }
    if (!params.pct) return { ok: true };
    area = { w: Math.abs(body.x - from) + 40, h: 64, back: true };
  }

  if (type === 'buff') {
    applyBuff(world, skillId, params);
    if (params.rageGain) addRage(world, params.rageGain);
    if (params.aimGain) addAim(world, params.aimGain);
    return { ok: true };
  }

  if (type === 'revive') {
    reviveMember(world, reviveTarget(world, hitBox(body, params.range)), params.healPct);
    world.fx.push({ kind: 'heal', x: body.x, y: body.y, t: 0, dur: 0.8 });
    return { ok: true };
  }

  if (type === 'heal') {
    const amount = Math.round(stats.maxHp * params.healPct);
    char.hp = Math.min(stats.maxHp, char.hp + amount);
    world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: `+${amount}`, color: '#7ee081', t: 0, big: false });
    world.fx.push({ kind: 'heal', x: body.x, y: body.y, t: 0, dur: 0.8 });
    if (world.dungeon) healMembers(world, params.healPct, hitBox(body, area));
  }

  const targets = pickTargets(world.mobs, body, area, params.targets);
  const family = JOBS[char.job].family;
  const acc = accuracy(family, stats, char.level);
  const range = params.pct != null ? physicalRange(stats, stats.weaponType, params.pct) : magicRange(stats, params.power);
  const fxKind = s?.fx ?? (ranged ? 'arrow' : 'swing');
  const ultimate = Boolean(s?.ultimate);
  const look = { school: s?.school, variant: s?.variant };

  if (!params.projectile && type !== 'blink') {
    const box = hitBox(body, area);
    world.fx.push({ kind: fxKind, ...look, x: body.x, y: body.y, dir: body.facing, box, t: 0, dur: ultimate ? 0.9 : 0.3, element });
    if (ultimate) {
      world.juice?.push({ type: 'shake', mag: 3, dur: 0.9, delay: 0.3 });
      world.fx.push({ kind: 'ultcue', school: s.school, x: body.x, y: body.y, t: 0, dur: 0.7 });
    }
  }

  // Thrown stars come out of your bag, one per star, and carry its look and element.
  const star = params.projectile && fxKind === 'star' ? useStars(char, targets.length * params.hits) : null;
  const shotElement = star?.star.element ?? element;

  targets.forEach((m, ti) => {
    const dist = Math.abs(m.x - body.x);
    const travel = params.projectile ? dist / PROJECTILE_SPEED : params.delay ?? 0.1;
    for (let n = 0; n < params.hits; n++) {
      const at = now + travel + n * 0.09 + ti * 0.02;
      const miss = rng() >= hitChance(acc, char.level, m.def);
      const roll = miss ? null : rollHit(range, stats, m.def, char.level, rng, params.critRate ?? 0);
      // Spells land with weight too: the first blow (and a long string's last) stops the world
      // for a moment, but the hits in between don't, so a multi-hit flows.
      const weighty = ti === 0 && type !== 'heal' && (n === 0 || (n === params.hits - 1 && params.hits > 2));
      world.pending.push({
        at, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: body.x, stack: n, knock: params.knock, launch: params.launch,
        stop: weighty ? spellStop(params, ultimate) : undefined,
        freeze: params.freeze, poison: params.poison, stun: params.stun, bleed: params.bleed,
        school: s?.school, element: star?.star.element,
        // What landed (for its sound): the shot, a spell, or a blade.
        via: params.projectile || fxKind === 'rain' ? fxKind : type === 'magic' || type === 'heal' ? 'spell' : 'blade',
      });
      if (params.projectile) {
        world.fx.push({
          kind: 'projectile', shot: fxKind, school: s?.school, x: body.x + body.facing * 10, y: body.y - HAND_Y,
          tx: m.x, ty: m.y - m.def.h / 2, t: -(n * 0.09 + ti * 0.02), dur: Math.max(0.08, travel), element: shotElement, starColor: star?.color,
        });
      }
    }
    // An effect on each monster hit: the skill's own `hitFx`, or the spell itself landing.
    const hitKind = s?.hitFx ?? ((type === 'magic' || type === 'heal' || ultimate) && !params.projectile ? fxKind : null);
    if (hitKind) {
      const t = ultimate ? -ti * 0.025 : type === 'blink' ? -0.05 - ti * 0.04 : -(params.delay ?? 0) * 0.5;
      world.fx.push({ kind: hitKind, ...look, x: m.x, y: m.y, h: m.def.h, t, dur: ultimate ? 0.9 : 0.55, seed: rng() });
    }
  });

  // A projectile with nothing in range still flies, so the shot doesn't feel swallowed.
  if (params.projectile && !targets.length) {
    world.fx.push({
      kind: 'projectile', shot: fxKind, x: body.x + body.facing * 10, y: body.y - HAND_Y,
      tx: body.x + body.facing * params.range.w, ty: body.y - HAND_Y, t: 0, dur: params.range.w / PROJECTILE_SPEED, element, school: s?.school,
    });
  }
  return { ok: true, targets: targets.length };
}

