// The Onmyoji's oni (see data/jobs.js and docs/design/spirit-mage-paths.md): the first of her yokai
// troupe, a cute and badass oni girl with red skin, crimson horns and a huge spiked club, bored by
// everything. Always out, she fights on her own: she strolls after the Onmyoji with the club on her
// shoulder, lazily, and wades into whatever comes near, swinging it with all its weight. She has a
// body of her own (physics.js) and walks the map (nav.js) on her own feet.
// Her moves (render/oni.js draws them):
//   Lazy Jab      a bored one-handed shove of the club's head into a face
//   Swat          a huge two-handed swing that bats monsters away across the ground
//   Smash         the club hauled up overhead and brought straight down, cracking the ground
//   Upswing       from low, the club ripped up over her head, throwing them into the air
//   Ground Pound  the club raised high in both hands and driven into the ground beside her: a
//                 shock both ways that throws everything round her
// Each plays on a heavy clock (it hangs at the top of the wind-up, freezes on the impact, drags
// through the follow-through). When a blow hits nothing she sulks a moment; when what she was
// hitting goes down, a smug smirk.
// Her hits are spells of the Onmyoji's own magic attack (melee.js dollHit).

import { dollHit, hasSpirit } from './melee.js';
import { jobChain } from '../data/jobs.js';
import { createBody, stepBody } from './physics.js';
import { navOf, findPath, followPath, surfaceBelow, surfaceOf } from './nav.js';

// Where she stands when there's nothing to fight: a stride ahead of the Onmyoji (px).
const HOME = 62;
// How far from the Onmyoji she'll go after a fight.
const LEASH = { x: 300, y: 150 };
// How fast she goes (% of a walk): a lazy stroll; a stomping run when she's fallen behind.
const WALK = 58;
const RUN = 150;
const RUN_AT = 170;
const THINK = 0.25;
// Her moves: how long each lasts (s), when its blows land (0-1), reach, how hard (% of a spell),
// knockback, launch, stun, how many it can catch, the shake, a crack in the ground, and whether it
// hits all round her (`around`).
export const ONI_MOVES = {
  jab: { dur: 0.9, hits: [0.42], reach: 95, pct: 70, knock: 140, targets: 2, shake: 1.2 },
  swat: { dur: 1.2, hits: [0.5], reach: 115, pct: 115, knock: 300, targets: 4, shake: 3 },
  smash: { dur: 1.35, hits: [0.52], reach: 95, pct: 165, knock: 90, stun: 0.5, targets: 3, shake: 5, crack: true },
  upper: { dur: 1.2, hits: [0.48], reach: 90, pct: 120, knock: 60, launch: 380, targets: 3, shake: 3 },
  pound: { dur: 1.5, hits: [0.56], reach: 120, pct: 130, knock: 220, launch: 160, stun: 0.4, targets: 6, shake: 6, crack: true, around: true },
};
// The heavy clock: how her blows run (see world/kitsune.js for the same idea in the guardian's).
const HEAVY = { hang: [0.16, 0.035], hangRate: 0.35, snap: 1.8, drag: 0.16, dragRate: 0.5, freeze: 0.09, lastFreeze: 0.2, recover: 0.8 };
function heavyRate(M, u) {
  const h = M.hits[M.hits.length - 1];
  if (u >= h - HEAVY.hang[0] && u < h - HEAVY.hang[1]) return HEAVY.hangRate;
  if (u >= h - HEAVY.hang[1] && u < h) return HEAVY.snap;
  if (u >= h && u < h + HEAVY.drag) return HEAVY.dragRate;
  return u > h ? HEAVY.recover : 1;
}
// The rest she takes between blows (s): she's in no hurry.
const REST = [0.45, 0.9];
// Her moods: how long a sulk (a blow that hit nothing) and a smirk (her target went down) last.
const MOOD = { sulk: 1.6, smug: 1.3 };
const SMEAR = { jab: [80, 30, 5], swat: [-110, 230, 11], smash: [-30, 170, 12], upper: [130, -220, 10], pound: [-20, 200, 12] };
const NONE = { left: false, right: false, up: false, down: false, jump: false };
const alive = (m) => m && m.hp > 0;

export const hasOni = (char) => jobChain(char.job).includes('onmyoji');

// The oni, made when she's first needed (null for anyone but an Onmyoji). On a new map she arrives
// beside the Onmyoji.
export function oniOf(world) {
  if (!hasOni(world.char) || !hasSpirit(world.char)) return (world.oni = null);
  const b = world.body;
  world.oni ??= { act: null, next: 0, last: null, map: null, mood: null };
  const k = world.oni;
  if (k.map !== world.map.id || !k.body) {
    k.map = world.map.id;
    k.body = createBody(b.x + b.facing * HOME, b.y);
    k.body.onGround = b.onGround;
    k.body.facing = b.facing;
    k.brain = { think: 0, target: null, goal: null, path: null, pathTo: -1, replanAt: 0, stall: 0, lastX: k.body.x, run: false };
    k.act = null;
    sync(k);
  }
  return k;
}
const sync = (k) => {
  k.x = k.body.x;
  k.y = k.body.y;
  k.dir = k.body.facing;
};

export function tickOni(world, dt) {
  const k = oniOf(world);
  if (!k) return;
  const { now } = world;
  const had = k.brain.target;
  if (had && had.hp <= 0 && k.mood?.kind !== 'sulk') k.mood = { kind: 'smug', until: now + MOOD.smug };
  if (k.mood && now >= k.mood.until) k.mood = null;
  if (k.act) act(world, k, dt);
  else {
    const br = k.brain;
    br.think -= dt;
    if (br.think <= 0) {
      br.think = THINK;
      think(world, k);
    }
    const intent = steer(world, k);
    stepBody(k.body, world.map, intent, dt, { speed: br.run ? RUN : WALK, jump: 110 });
    stuck(world, k, intent, dt);
    sync(k);
    if (!world.dead) fight(world, k);
  }
  k.vx = k.body.vx;
  k.moving = !k.act && k.body.onGround && Math.abs(k.body.vx) > 8;
  k.running = k.moving && k.brain.run;
}

// Plays out a blow on its heavy clock, rooted where she stands.
function act(world, k, dt) {
  const a = k.act;
  const M = ONI_MOVES[a.kind];
  stepBody(k.body, world.map, NONE, dt, { speed: 0, jump: 0 });
  sync(k);
  if (!M) {
    if (world.now - a.t0 >= a.dur) k.act = null;
    return;
  }
  a.clock ??= 0;
  if (a.freeze > 0) a.freeze -= dt;
  else a.clock += dt * heavyRate(M, a.clock / a.dur);
  const t = a.clock;
  if (!a.dust && t >= M.hits[0] * M.dur - 0.05) {
    a.dust = true;
    world.juice.push({ type: 'dust', x: k.x + k.dir * 14, y: k.y, count: 4, dir: -k.dir });
  }
  while (a.done < M.hits.length && t >= M.hits[a.done] * M.dur) {
    const last = a.done === M.hits.length - 1;
    a.done += 1;
    const n = strike(world, k, a.kind, M, last);
    a.freeze = last ? HEAVY.lastFreeze : HEAVY.freeze;
    // A blow that hit nothing at all: she sulks.
    if (last && !n) {
      a.whiffed = true;
      k.mood = { kind: 'sulk', until: world.now + MOOD.sulk };
    }
  }
  if (t >= a.dur) {
    k.act = null;
    k.next = world.now + REST[0] + Math.random() * (REST[1] - REST[0]) + (a.whiffed ? 0.8 : 0);
  }
}

// One of her blows: everything in the club's reach in front of her (or all round her). Returns how
// many it hit.
function strike(world, k, kind, M, last) {
  const dir = k.dir;
  const [start, sweep, thick] = SMEAR[kind];
  world.fx.push({ kind: 'arc', x: k.x + dir * 14, y: k.y - 34, dir, r: M.reach * 0.66, start, sweep, thick, big: last, color: '#ff6a4a', t: 0, dur: 0.32 });
  const hit = world.mobs
    .filter((m) => alive(m) && Math.abs(m.y - k.y) < 80 && (M.around || (m.x - k.x) * dir > -14) && Math.abs(m.x - k.x) < M.reach + m.def.w / 2)
    .sort((m, o) => Math.abs(m.x - k.x) - Math.abs(o.x - k.x))
    .slice(0, M.targets);
  hit.forEach((m, i) => dollHit(world, m, { pct: M.pct, x: k.x, knock: M.knock, launch: M.launch ?? 0, stun: M.stun, stop: i ? 0 : 0.06, shake: !i ? M.shake : 0, big: !i, burst: 'onihit', gauge: 2, key: 'oni' }));
  world.juice.push({ type: 'shake', mag: M.shake * (hit.length ? 1 : 0.4), dur: 0.2 });
  world.juice.push({ type: 'dust', x: k.x + dir * M.reach * 0.6, y: k.y, count: 5 });
  if (M.crack) world.fx.push({ kind: 'crack', school: 'rage', x: k.x + (M.around ? 0 : dir * M.reach * 0.6), y: k.y, w: M.around ? M.reach * 2 : 110, t: 0, dur: 0.8, seed: Math.random() });
  if (M.around) world.fx.push({ kind: 'onipound', x: k.x, y: k.y, r: M.reach, t: 0, dur: 0.7 });
  return hit.length;
}

// Her brain: the monster nearest the Onmyoji, and a spot just short of it; with nothing to fight,
// a stride ahead of the Onmyoji.
function think(world, k) {
  const br = k.brain;
  const nav = navOf(world.map);
  const b = world.body;
  const near = world.map.isTown ? [] : world.mobs.filter((m) => alive(m) && !(m.air > 60) && Math.abs(m.x - b.x) <= LEASH.x && Math.abs(m.y - b.y) <= LEASH.y);
  const m = near.sort((p, o) => Math.hypot(p.x - k.x, p.y - k.y) - Math.hypot(o.x - k.x, o.y - k.y))[0];
  if (m) {
    br.target = m;
    const ms = surfaceBelow(nav, m.x, m.y);
    const surf = nav.surfaces[ms];
    if (!surf) return;
    const side = Math.sign(k.x - m.x) || 1;
    const x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, m.x + side * 64));
    br.goal = { x, surface: ms };
    br.run = Math.abs(k.x - x) > RUN_AT;
    return;
  }
  br.target = null;
  const bs = surfaceBelow(nav, b.x, b.y);
  const surf = nav.surfaces[bs];
  if (!surf) return;
  let x = b.x + b.facing * HOME;
  if (x < surf.x1 + 6 || x > surf.x2 - 6) x = b.x - b.facing * HOME;
  x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, x));
  br.goal = { x, surface: bs, home: true };
  br.run = Math.hypot(b.x - k.x, b.y - k.y) > RUN_AT;
}

// Walks her to her goal over ledges and ropes.
function steer(world, k) {
  const br = k.brain;
  const g = br.goal;
  const body = k.body;
  if (!g || g.surface < 0) return NONE;
  const nav = navOf(world.map);
  const here = surfaceOf(nav, body);
  if (here >= 0 && (!br.path || br.pathTo !== g.surface || world.now > br.replanAt)) {
    br.path = findPath(nav, here, body.x, g.surface, g.x);
    br.pathTo = g.surface;
    br.replanAt = world.now + 1;
    if (!br.path) {
      br.goal = null;
      return NONE;
    }
  }
  if (!br.path) return NONE;
  if (!br.path.length && here === g.surface) {
    const intent = { ...NONE };
    if (Math.abs(g.x - body.x) > (g.home ? 12 : 6)) {
      intent.right = g.x > body.x;
      intent.left = g.x < body.x;
    } else body.facing = br.target ? Math.sign(br.target.x - body.x) || body.facing : world.body.facing;
    return intent;
  }
  const { intent, lost } = followPath(nav, body, br.path, g.x);
  if (lost) br.path = null;
  return intent;
}

// Stuck, fallen off the map, or left far behind: she stomps out of a puff of red smoke beside the
// Onmyoji.
function stuck(world, k, intent, dt) {
  const br = k.brain;
  const body = k.body;
  const pushing = (intent.left || intent.right) && body.onGround;
  br.stall = pushing && Math.abs(body.x - br.lastX) < 0.3 ? br.stall + dt : 0;
  br.lastX = body.x;
  if (br.stall > 1.2) {
    br.path = null;
    br.goal = null;
    br.stall = 0;
  }
  const b = world.body;
  const off = body.y > world.map.height + 200 || body.x < -100 || body.x > world.map.width + 100;
  if (off || Math.hypot(b.x - body.x, b.y - body.y) > 560) {
    world.fx.push({ kind: 'onipuff', x: body.x, y: body.y, t: 0, dur: 0.6 });
    Object.assign(body, { x: b.x - b.facing * 30, y: b.y, vx: 0, vy: 0, rope: null, onGround: b.onGround, surface: b.surface, facing: b.facing });
    sync(k);
    world.fx.push({ kind: 'onipuff', x: body.x, y: body.y, t: 0, dur: 0.6 });
    br.path = null;
  }
}

// A blow at her target once she's rested and in reach: never the same twice running, Ground Pound
// and Swat when they crowd her, a lazy jab now and then.
function fight(world, k) {
  const m = k.brain.target;
  if (!alive(m) || !k.body.onGround || k.act || world.now < k.next) return;
  if (Math.abs(m.y - k.y) > 40) return;
  const dx = Math.abs(m.x - k.x);
  if (dx > ONI_MOVES.swat.reach + m.def.w / 2 - 8) return;
  const crowd = world.mobs.filter((o) => alive(o) && Math.abs(o.x - k.x) < 110 && Math.abs(o.y - k.y) < 50).length;
  const pool = (crowd >= 3 ? ['pound', 'pound', 'swat', 'swat', 'smash', 'upper'] : ['smash', 'swat', 'upper', 'jab', 'pound']).filter((n) => n !== k.last);
  const kind = pool[Math.floor(Math.random() * pool.length)];
  k.last = kind;
  k.body.facing = Math.sign(m.x - k.x) || k.body.facing;
  k.body.vx = 0;
  sync(k);
  k.act = { kind, t0: world.now, dur: ONI_MOVES[kind].dur, done: 0 };
}
