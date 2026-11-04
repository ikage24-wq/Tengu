// The Phantom Trickster's tricks (data/skills.js; docs/design/phantom-trickster.md; her moves are
// the `pt*` figures in render/moves.js, her effects the `pt*` strips):
//   Her copies       her gauge, Illusion (internally Bond, world/melee.js), is the see-through
//                    copies of her that stand just behind her (render/scene.js draws them): one at
//                    half, two when full, and a third at full with Hall of Mirrors. Each copy
//                    looses an arrow of its own beside hers, every other shot (every shot at full).
//   Vanishing Arrow  a shot sometimes vanishes in smoke and reappears behind its target, striking it
//                    again from behind.
//   Dove Arrow       a shot sometimes bursts into doves that fly on to the monsters round it.
//   Card Trick       a shot sometimes throws a fan of three cards that cut through the line.
//   Smoke Bomb       a puff of smoke round her: the monsters close by are stunned and lose her.
//   Mirror Dodge     a hit sometimes strikes one of her copies instead: it pops in smoke and comes
//                    back a few seconds later.
//   Showstopper      for a while her copies hit harder.
//   Grand Illusion   her finisher: she vanishes in smoke, a ring of copies appears round the screen
//                    and they all loose at once, then she bows.

import { phantomHit, hasBond, wild } from './melee.js';
import { procOf } from './combat.js';

const alive = (m) => m && m.hp > 0;
const mid = (m) => m.y - (m.air ?? 0) - m.def.h / 2;
// A copy's arrow, as a share of the shot it copies.
const COPY_PCT = 0.4;
// How long a copy that took a hit for her stays gone.
const POPPED = 3;

// How many copies stand behind her now.
export function copiesOf(world) {
  if (!hasBond(world.char)) return 0;
  const b = world.bond ?? 0;
  const n = b >= 100 ? 2 : b >= 50 ? 1 : 0;
  return n + (n === 2 && procOf(world.char, 'alpha') ? 1 : 0);
}
// Where copy `k` stands (0 nearest): just behind her and a little up, each further back; it bobs on
// its own clock. The drawing (render/scene.js) and the arrows use the same spot.
export function copyAt(world, k) {
  const b = world.body;
  return { x: b.x - b.facing * (20 + k * 16), y: b.y - [6, 16, 2][k] + Math.sin(world.now * 2 + k * 2.1) * 2 };
}
const copyLive = (world, k) => !(world.copyGone?.[k] > world.now);

// Every shot she looses: her copies loose one too, from where they stand (every other shot, or
// every one when Illusion is full). Called from world/melee.js `fire` with the shot and its target.
export function copiesShoot(world, s, fire) {
  const n = copiesOf(world);
  if (!n || s.copy || s.split || s.free || s.rain) return;
  world.copyBeat = ((world.copyBeat ?? 0) + 1) % 2;
  if (!wild(world) && world.copyBeat) return;
  const power = 1 + (world.char.buffs?.snacktime?.until > world.now ? world.char.buffs.snacktime.values.copyPower ?? 0 : 0);
  for (let k = 0; k < n; k++) {
    if (!copyLive(world, k)) continue;
    const c = copyAt(world, k);
    fire(world, { ...s, copy: true, from: c, lag: (s.lag ?? 0) + 0.06 * (k + 1), pct: s.pct * COPY_PCT * power, big: false, stop: 0, shake: 0, gauge: 1, muzzle: undefined, shot: 'ptarrow' });
  }
}

// ---------- Her tricks off a shot ----------
// Vanishing Arrow: the shot that hit `m` (landing `delay` s from now) vanishes and strikes again
// from behind a beat later.
export function vanishAgain(world, m, delay, p) {
  const at = delay + 0.28;
  world.fx.push({ kind: 'ptsmoke', small: true, x: m.x, y: m.y, t: -delay, dur: 0.5 });
  world.fx.push({ kind: 'ptsmoke', small: true, x: m.x + Math.sign(m.x - world.body.x) * 26, y: m.y, t: -at + 0.1, dur: 0.5 });
  phantomHit(world, m, { x: m.x + Math.sign(m.x - world.body.x) * 40, pct: p.pct, knock: 140, stop: 0.04, burst: 'pthit', key: 'procwildhunt' }, at);
}
// Dove Arrow: doves burst out of the hit and fly on to the monsters round it.
export function doveBurst(world, m, delay, p) {
  const near = world.mobs.filter((o) => alive(o) && o !== m && Math.abs(o.x - m.x) < 220 && Math.abs(o.y - m.y) < 120).sort((a, b) => Math.abs(a.x - m.x) - Math.abs(b.x - m.x)).slice(0, p.n);
  near.forEach((o, i) => {
    const fly = 0.22 + i * 0.06;
    world.fx.push({ kind: 'projectile', weapon: 'bow', shot: 'ptdove', x: m.x, y: mid(m), tx: o.x, ty: mid(o), mob: o, t: -delay, dur: fly });
    phantomHit(world, o, { x: m.x, pct: p.pct, knock: 60, burst: 'pthit', key: 'procwolfpounce' }, delay + fly);
  });
}

// ---------- Smoke Bomb ----------
// `params`: { r, stun, pct }. Stuns (and knocks back a little) every monster within `r`, loses
// them, and makes her hard to touch for a moment. Always true (it never fails).
export function smokeBomb(world, params) {
  const b = world.body;
  world.fx.push({ kind: 'ptsmoke', big: true, bomb: true, x: b.x, y: b.y, t: 0, dur: 0.7 });
  // A ring of smoke and cards rolls out to the edge of what it catches.
  world.fx.push({ kind: 'shock', name: 'celshockplum', x: b.x, y: b.y, r: params.r, t: 0, dur: 0.45 });
  world.invuln = Math.max(world.invuln ?? 0, 0.6);
  const caught = world.mobs.filter((m) => alive(m) && Math.abs(m.x - b.x) <= params.r + m.def.w / 2 && Math.abs(m.y - b.y) < 90);
  // (They lose track of her while the smoke hangs, blows and all: tickPhantom keeps them lost.)
  world.smoke = { mobs: caught, until: world.now + params.stun + 0.5 };
  caught.forEach((m, i) => phantomHit(world, m, { x: b.x, pct: params.pct, knock: 90, stun: params.stun, stop: i ? 0 : 0.04, burst: 'pthit', key: 'packhowl' }, 0.12));
  return true;
}

// ---------- Mirror Dodge ----------
// A hit coming at her: sometimes one of her copies takes it instead and pops in smoke. True if one
// did.
export function mirrorDodge(world, fromX, rng = Math.random) {
  const p = procOf(world.char, 'loyalguard');
  const n = copiesOf(world);
  if (!p || !n || rng() >= p.chance) return false;
  const k = [...Array(n).keys()].find((i) => copyLive(world, i));
  if (k == null) return false;
  const c = copyAt(world, k);
  (world.copyGone ??= [])[k] = world.now + POPPED;
  world.fx.push({ kind: 'ptsmoke', x: c.x, y: world.body.y, t: 0, dur: 0.6 });
  void fromX;
  return true;
}

// ---------- Grand Illusion ----------
// `s.grand`: { n (copies), r (how far round her they appear), at (s until they loose), pct, hide
// (s she stays hidden) }.
export function grandIllusion(world, s) {
  const I = s.grand;
  const b = world.body;
  const spots = Array.from({ length: I.n }, (_, i) => {
    const sd = i % 2 ? 1 : -1;
    const k = Math.floor(i / 2) + 1;
    const x = b.x + sd * (40 + (k * I.r) / Math.ceil(I.n / 2));
    const y = b.y - (i % 3) * 22;
    return { x, y, dir: -sd || 1, at: world.now + 0.12 + i * 0.03 };
  });
  world.illusion = { since: world.now, until: world.now + I.hide, spots, shoot: world.now + I.at };
  world.fx.push({ kind: 'ptillusion', x: b.x, y: b.y, t: 0, dur: I.hide + 0.4 });
  for (const sp of spots) world.fx.push({ kind: 'ptsmoke', small: true, x: sp.x, y: sp.y, t: -(sp.at - world.now), dur: 0.5 });
  world.invuln = Math.max(world.invuln ?? 0, I.hide);
  // Every copy looses at the monster nearest it, all at once.
  const targets = world.mobs.filter((m) => alive(m) && Math.abs(m.x - b.x) < I.r + 80 && Math.abs(m.y - b.y) < 160);
  spots.forEach((sp, i) => {
    const m = targets.sort((a, c) => Math.abs(a.x - sp.x) - Math.abs(c.x - sp.x))[0];
    if (!m) return;
    sp.dir = Math.sign(m.x - sp.x) || sp.dir;
    const fly = Math.max(0.1, Math.abs(m.x - sp.x) / 900);
    world.fx.push({ kind: 'projectile', weapon: 'bow', shot: 'ptbig', x: sp.x, y: sp.y - 22, tx: m.x, ty: mid(m), mob: m, t: -I.at, dur: fly });
    phantomHit(world, m, { x: sp.x, pct: I.pct, knock: 200, launch: 160, stun: 0.3, stop: i ? 0 : 0.08, shake: i ? 0 : 3, big: !i, burst: 'pthit', key: s.key }, I.at + fly);
  });
}

export function tickPhantom(world) {
  if (world.smoke) {
    if (world.now >= world.smoke.until) world.smoke = null;
    else for (const m of world.smoke.mobs) m.aggroUntil = 0;
  }
  if (world.illusion && world.now >= world.illusion.until) world.illusion = null;
}
