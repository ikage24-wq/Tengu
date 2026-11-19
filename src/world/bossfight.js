// Boss fights built the way FFXIV builds its dungeon bosses (2026-11-18): a fixed, learnable
// rotation of named casts, each shown on a cast bar under the boss's health bar and telegraphed on
// the floor, so a group can read the fight and learn it; a handful of shared patterns; phases that
// swap the rotation at health marks and layer one new idea on what came before.
//
// The patterns (zone kinds, drawn by render/dungeon.js, resolved by world/dungeon.js tickZones):
//   raid    everyone takes a hit; no dodging it (a check on the healer)
//   buster  a big hit on one member, the tank (a marker follows them; anyone beside them is hit too)
//   stack   a marker on one member: everyone gathers in it to share the hit (too few, and it hurts)
//   spread  a marker on each member: keep apart, or two markers overlapping hit twice
//   circle  a patch round a spot (round the boss: "get out")
//   donut   a ring round the boss, its middle safe ("get in")
//   band    the floor from x to x + w (a cleave to one side, a line across the room)
//   floor   the whole floor (jump it)
// Markers follow their member until a beat before they land (`lock`), then stay put.
//
// A rotation is a list of steps { gap, cast, dur, sub, pose, run(world, m, up, ctx) }: wait `gap`
// seconds, start casting `cast` for `dur` seconds (run() lays out the telegraphs, set to land as the
// cast ends), and on to the next, round and round. The boss doesn't swing at the tank while it
// casts. In the last half second of a cast the boss winds up (m.windup, the rigs' wind-up pose) and
// lets fly as it ends (m.attackAt, the strike pose); `pose` tells a rig which of its moves to use.

import { addZone, callout } from './dungeon.js';

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// ---------- The patterns ----------
export const raidwide = (world, m, damage, dur) => addZone(world, { kind: 'raid', x: m.x, y: m.y, w: world.map.width, warn: dur, damage, from: m });
export const buster = (world, m, g, damage, dur, w = 80) => g && addZone(world, { kind: 'buster', target: g.id, x: g.body.x, y: g.body.y, w, warn: dur, lock: 0.5, damage, from: m });
export const stack = (world, m, g, damage, dur, need, w = 96) => g && addZone(world, { kind: 'stack', target: g.id, x: g.body.x, y: g.body.y, w, warn: dur, lock: 0.7, damage, need, from: m });
export const spread = (world, m, up, damage, dur, w = 70) => { for (const g of up) addZone(world, { kind: 'spread', target: g.id, x: g.body.x, y: g.body.y, w, warn: dur, lock: 0.6, damage, from: m }); };
export const out = (world, m, r, damage, dur) => addZone(world, { kind: 'circle', x: m.x, y: world.map.groundY, w: r * 2, warn: dur, damage, from: m, noSprout: true });
export const donut = (world, m, inner, r, damage, dur) => addZone(world, { kind: 'donut', x: m.x, y: world.map.groundY, w: r * 2, inner, warn: dur, damage, from: m });
export const band = (world, m, x0, x1, damage, dur) => addZone(world, { kind: 'band', x: Math.min(x0, x1), w: Math.abs(x1 - x0), dir: x1 >= x0 ? 1 : -1, warn: dur, damage, from: m });
// A cleave from the boss across `len` of the floor, the way it faces.
export const cleave = (world, m, len, damage, dur) => (m.dir < 0 ? band(world, m, m.x + 20, m.x + 20 - len, damage, dur) : band(world, m, m.x - 20, m.x - 20 + len, damage, dur));

// How long each look's landing plays (s): render/bossfx.js draws it over that long.
export const LOOK_HOLD = { overdue: 0.9, books: 0.8, study: 0.9, bookmark: 0.7, comet: 0.75, crescentsweep: 0.75, eclipse: 1.3, total: 1.3, night: 1.3, shush: 0.9, nova: 0.9, lines: 0.8, starfall: 0.7,
  // (The Queen's dream: render/dreamfx.js.)
  drizzle: 0.7, bolt: 0.6, downpour: 0.8, grumble: 1, forked: 0.6, cloudburst: 1.1, umbrella: 0.9,
  memo: 0.7, stamp: 0.8, coffee: 0.8, files: 0.9, steam: 0.9, noodle: 0.7, broth: 0.7, chopsticks: 0.6, boil: 1.1, email: 0.7, redpen: 0.8, alarm: 1, invite: 0.8, deadline: 1.1 };

// ---------- Who ----------
export const tankOf = (up) => up.find((g) => g.role === 'tank') ?? up[0];
export const healerOf = (up) => up.find((g) => g.role === 'healer') ?? pick(up);
export const dpsOf = (up) => { const d = up.filter((g) => g.role !== 'tank' && g.role !== 'healer'); return d.length ? pick(d) : pick(up); };

// ---------- The rotation ----------
// Runs `list` for boss m (its state in m.mech.rot, so a wipe resets it). Returns true while m is
// casting (it doesn't swing at the tank then). `ctx` is passed on to each step's run().
export function runRotation(world, m, list, up, dt, ctx = {}) {
  const s = (m.mech.rot ??= { i: 0, wait: list[0]?.gap ?? 2, list });
  // A new list (a new phase): start it from the top, after its first gap.
  if (s.list !== list) Object.assign(s, { i: 0, wait: list[0]?.gap ?? 2, list, end: null });
  const caster = ctx.caster ?? m;
  if (s.end != null) {
    // (The one actually casting: for a pair, the sister whose turn it is.)
    const c = s.who ?? caster;
    const left = s.end - world.now;
    const total = Math.max(0.2, c.def.fight?.windup ?? 0.5);
    c.windup = left > 0 && left < total ? left : 0;
    if (left <= 0 || c.hp <= 0) {
      c.cast = null;
      c.castPose = null;
      c.windup = 0;
      c.attackAt = world.now;
      s.who = null;
      s.end = null;
      s.i = (s.i + 1) % list.length;
      s.wait = list[s.i].gap ?? 2;
    }
    return true;
  }
  if (!up.length) return false;
  s.wait -= dt;
  if (s.wait > 0) return false;
  const step = list[s.i];
  const who = step.by ? ctx[step.by] ?? caster : caster;
  if (!who || who.hp <= 0) {
    s.i = (s.i + 1) % list.length;
    s.wait = 0.5;
    return false;
  }
  who.cast = { name: step.cast, t0: world.now, dur: step.dur };
  who.castPose = step.pose ?? null;
  world.dungeon.nextLook = step.look ?? null;
  world.dungeon.lookI = 0;
  step.run(world, who, up, ctx);
  world.dungeon.nextLook = null;
  if (step.sub) callout(world, step.cast, step.sub);
  s.end = world.now + step.dur;
  s.who = who;
  return true;
}
