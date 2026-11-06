// The Astronomer's sky (data/skills.js; docs/design/astronomer.md; her moves are the `as*`
// figures in render/moves.js, her effects the `as*` strips):
//   Her moons            her gauge, Orbit (internally Binding, world/melee.js), is the moons round
//                        her: one for every fifth of it, ORBIT_MOONS at most. Each in turn flies off
//                        at a monster close by, strikes it and rejoins the orbit; together they
//                        go about once every MOON_EVERY s, twice as often on Full Orbit, and Lunar
//                        Tide makes them quicker and harder still.
//   Gravity Well         a small world hangs where she points for a while, pulling the monsters
//                        round it in and crushing them again and again.
//   Planetary Alignment  her finisher: five planets fall into a row across the screen ahead of
//                        her and fire one beam through every monster in it.
// (Ringed Planet is a plain shot: a great ringed planet rolling through the line.)

import { dollHit, hasBinding, fullOrbit } from './melee.js';

const alive = (m) => m && m.hp > 0;
const mid = (m) => m.y - (m.air ?? 0) - m.def.h / 2;
export const ORBIT_MOONS = 5;
// Seconds between one moon going out and the next (all her moons share it), and how far out a
// moon will go for a monster.
const MOON_EVERY = 0.9;
const MOON_REACH = 240;
const MOON_PCT = 70;

// How many moons ride her orbit right now.
// (The Sorcerer's Spellstorm replaced the Astronomer's Orbit, so no moons ride round her now;
// docs/design/mage-line.md. Her skills here are next to be remade.)
export const moonsOf = () => 0;
// Lunar Tide's lift on her moons (0 when it's not on her).
const tideOf = (world) => {
  const b = world.char.buffs?.yokairally;
  return b && b.until > world.now ? b.values : null;
};

// Where moon `k` of `n` rides round her at time `t` (the orbit renderers draw the same): a flat
// ellipse round her middle, turning slowly (faster under Lunar Tide).
export function moonAt(body, k, n, t, tide = false) {
  const a = t * (tide ? 1.6 : 0.9) + (k / Math.max(1, n)) * Math.PI * 2;
  return { x: body.x + Math.cos(a) * 26, y: body.y - 22 + Math.sin(a) * 7, front: Math.sin(a) > 0 };
}

function tickMoons(world) {
  const n = moonsOf(world);
  if (!n || world.dead) return;
  if (world.now < (world.moonNext ?? 0)) return;
  const b = world.body;
  const m = world.mobs.filter((o) => alive(o) && Math.abs(o.x - b.x) <= MOON_REACH && Math.abs(o.y - b.y) < 140).sort((p, q) => Math.abs(p.x - b.x) - Math.abs(q.x - b.x))[(world.moonTurn ?? 0) % 2];
  const target = m ?? world.mobs.find((o) => alive(o) && Math.abs(o.x - b.x) <= MOON_REACH && Math.abs(o.y - b.y) < 140);
  if (!target) {
    world.moonNext = world.now + 0.2;
    return;
  }
  const tide = tideOf(world);
  const k = (world.moonTurn = ((world.moonTurn ?? 0) + 1) % n);
  world.moonNext = world.now + (MOON_EVERY / Math.max(1, n / 2)) * (fullOrbit(world) ? 0.5 : 1) * (tide ? tide.moonHaste : 1);
  const from = moonAt(b, k, n, world.now, Boolean(tide));
  const travel = Math.max(0.08, Math.hypot(target.x - from.x, mid(target) - from.y) / 520);
  world.fx.push({ kind: 'projectile', weapon: 'staff', shot: 'asmoon', x: from.x, y: from.y, tx: target.x, ty: mid(target), mob: target, t: 0, dur: travel });
  dollHit(world, target, { x: b.x, pct: MOON_PCT * (1 + (tide?.moonPower ?? 0)), knock: 30, stop: 0.02, burst: 'ashit', gauge: 0, key: 'procmoon' }, travel);
}

// ---------- Gravity Well ----------
// `s.well`: { r, ahead (how far in front of her it opens), dur, every, pct, pull (px each beat) }.
export function gravityWell(world, s) {
  const b = world.body;
  const W = s.well;
  world.well = { ...W, key: s.key, map: world.map.id, x: b.x + b.facing * W.ahead, y: b.y, until: world.now + W.dur, next: world.now + 0.15 };
  world.fx.push({ kind: 'somaw', well: world.well, x: world.well.x, y: world.well.y, t: 0, dur: W.dur });
}
function tickWell(world) {
  const Z = world.well;
  if (!Z) return;
  if (world.now >= Z.until || Z.map !== world.map.id) {
    world.well = null;
    return;
  }
  if (world.now < Z.next) return;
  Z.next = world.now + Z.every;
  for (const m of world.mobs) {
    if (!alive(m) || Math.abs(m.x - Z.x) > Z.r + m.def.w / 2 || Math.abs(m.y - Z.y) > 80) continue;
    // Drawn in toward its heart (never past it), and crushed.
    const d = Z.x - m.x;
    if (!m.def.boss) m.x += Math.sign(d) * Math.min(Math.abs(d), Z.pull);
    dollHit(world, m, { pct: Z.pct, x: Z.x, knock: 0, stop: 0, burst: 'ashit', gauge: 1, key: Z.key });
  }
}

// ---------- Planetary Alignment ----------
// `s.align`: { span (how far ahead the row reaches), at (s until the beam fires), pct }.
export function planetaryAlignment(world, s) {
  const A = s.align;
  const b = world.body;
  const dir = b.facing;
  world.fx.push({ kind: 'asalign', span: A.span, x: b.x + dir * 50, y: b.y - 40, dir, t: 0, dur: A.at + 0.9 });
  world.juice.push({ type: 'shake', mag: 1.5, dur: 0.2 });
  world.mobs
    .filter((m) => alive(m) && (m.x - b.x) * dir > -20 && Math.abs(m.x - b.x) < A.span && Math.abs(mid(m) - (b.y - 40)) < 90)
    .forEach((m, i) => dollHit(world, m, { pct: A.pct, x: b.x, knock: 260, launch: 200, stun: 0.4, stop: i ? 0 : 0.1, shake: i ? 0 : 4, big: !i, burst: 'ashit', gauge: 0, key: s.key }, A.at));
}

export function tickAstro(world) {
  tickMoons(world);
  tickWell(world);
}
