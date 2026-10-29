// The Shrine Maiden's companion (see data/jobs.js): her kitsune shrine guardian (the player picked
// "Silver Moon": silver-white hair, a red-tipped fox tail, amber eyes, white shrine robes), a tall,
// serene fox woman with a naginata. She stands in front: of the Maiden when there's nothing to
// fight, and between the Maiden and whatever comes for her when there is. She has a body of her
// own (physics.js) and walks the map like Snow wolf does (nav.js), on her own feet, never floating.
// Her own moves, with weight and reach (render/kitsune.js draws them):
//   Thrust        a long lunge, the blade driven straight through one monster
//   Sweep         the naginata swept wide and low in front of her, catching everything there
//   Rising Cut    a cut from low up over her head that throws it into the air
//   Twin Strike   two quick thrusts, high then low
// and her duties as a guardian:
//   Fox-Fire Call every so often, when monsters crowd the Maiden, she plants the naginata's butt
//                 with a ring of fox fire that throws them back off the Maiden, dazed
//   Guard         now and then she steps in front of a hit meant for the Maiden and takes it on the
//                 haft (combat.js blockOnHit)
//   a bow         when a fight is over she turns to the Maiden and bows
// Her hits are spells of the Maiden's own magic attack, in the shrine's white light (melee.js dollHit).

import { dollHit, hasSpirit } from './melee.js';
import { jobChain } from '../data/jobs.js';
import { createBody, stepBody } from './physics.js';
import { navOf, findPath, followPath, surfaceBelow, surfaceOf } from './nav.js';

// Where she stands when there's nothing to fight: a step in front of the Maiden (px).
const HOME = 34;
// How far from the Maiden she'll go after a fight (across, and up or down): she never strays.
const LEASH = { x: 240, y: 150 };
// How fast she goes (% of a walk): she's big and in no hurry, so she walks slow and unbothered;
// when she must get somewhere fast she leaps (LEAP), and only runs where a leap won't do (up a
// rope, over a ledge).
const WALK = 52;
const HURRY = 135;
// Her leap: how far she must have to go before she leaps rather than walks, the furthest one leap
// carries her, how high it arcs, how long it takes (crouch to landing), and the breath between leaps.
export const LEAP = { min: 110, far: 170, high: 46, dur: 0.8, every: 0.35 };
const THINK = 0.25; // seconds between decisions
// Her moves: how long each lasts (s), when its blows land (0-1), how far the blade reaches past
// her, how hard (% of a spell), knockback, launch, and how many it can catch.
export const KMOVES = {
  thrust: { dur: 0.85, hits: [0.42], reach: 120, pct: 95, knock: 90, targets: 3 },
  sweep: { dur: 1.05, hits: [0.5], reach: 105, pct: 80, knock: 140, targets: 5 },
  rising: { dur: 0.95, hits: [0.46], reach: 90, pct: 85, knock: 40, launch: 280, targets: 3 },
  twin: { dur: 1.0, hits: [0.3, 0.62], reach: 115, pct: 55, knock: 50, targets: 1 },
};
// The rest she takes between moves (seconds, a random span): steady, never frantic.
const REST = [0.3, 0.55];
// Fox-Fire Call: how often (s), how close to the Maiden the monsters must be, how long it takes,
// when the fire goes out, how far it throws them, and how long they're dazed.
export const CALL = { every: 7, range: 160, dur: 1.0, hit: 0.5, push: 170, daze: 0.8, pct: 40 };
// Guard: the chance she takes a hit for the Maiden, how often she can, and how near she must be.
export const GUARD = { chance: 0.3, every: 2.5, near: 110 };
const BOW = 1.5; // how long her bow after a fight lasts
// Each move's smear: where its arc starts and how far it sweeps (degrees), and how thick it is.
const SMEAR = { thrust: [72, 36, 5], sweep: [-70, 190, 9], rising: [120, -210, 8], twin: [70, 40, 4] };
const NONE = { left: false, right: false, up: false, down: false, jump: false };
const alive = (m) => m && m.hp > 0;

export const hasGuardian = (char) => jobChain(char.job).includes('shrinemaiden');

// The guardian, made when she's first needed (null for anyone but a Shrine Maiden). On a new map
// she arrives beside the Maiden.
export function guardianOf(world) {
  if (!hasGuardian(world.char) || !hasSpirit(world.char)) return (world.guardian = null);
  const b = world.body;
  world.guardian ??= { act: null, next: 0, last: null, callAt: 0, guardAt: 0, map: null };
  const k = world.guardian;
  if (k.map !== world.map.id || !k.body) {
    k.map = world.map.id;
    k.body = createBody(b.x + b.facing * HOME, b.y);
    k.body.onGround = b.onGround;
    k.body.facing = b.facing;
    k.brain = { think: 0, target: null, goal: null, path: null, pathTo: -1, replanAt: 0, stall: 0, lastX: k.body.x, fought: false };
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

// How long her moods show (seconds): cross when the Maiden is hurt, pleased when what she was
// fighting goes down, attentive when the Maiden's Blessing or Ward goes up.
const MOOD = { cross: 1.4, pleased: 1.2, attend: 1.1 };

export function tickGuardian(world, dt) {
  const k = guardianOf(world);
  if (!k) return;
  // Her moods (render/kitsune.js acts them out).
  const { now } = world;
  if (world.char.hp < (k.hp ?? world.char.hp) && !world.dead) k.mood = { kind: 'cross', until: now + MOOD.cross };
  k.hp = world.char.hp;
  const had = k.brain.target;
  if (had && had.hp <= 0 && k.mood?.kind !== 'cross') k.mood = { kind: 'pleased', until: now + MOOD.pleased };
  if (['blessing', 'spiritward'].some((id) => world.char.buffs?.[id]?.since === now)) k.mood = { kind: 'attend', until: now + MOOD.attend };
  if (k.mood && now >= k.mood.until) k.mood = null;
  if (k.act) act(world, k, dt);
  else {
    const br = k.brain;
    br.think -= dt;
    if (br.think <= 0) {
      br.think = THINK;
      think(world, k);
    }
    if (br.hurry && leap(world, k)) {
      act(world, k, dt);
      k.vx = k.body.vx;
      k.moving = false;
      k.hurry = false;
      return;
    }
    const intent = steer(world, k);
    stepBody(k.body, world.map, intent, dt, { speed: br.hurry ? HURRY : WALK, jump: 100 });
    stuck(world, k, intent, dt);
    sync(k);
    if (!world.dead) fight(world, k);
  }
  k.vx = k.body.vx;
  k.moving = k.body.onGround && Math.abs(k.body.vx) > 8;
  k.hurry = Boolean(k.brain.hurry) && !k.act;
}

// A leap, when she has a long way to go along the ledge she's on: a crouch, one great bound in an
// arc toward where she's going, and a heavy landing. False if a leap won't do.
function leap(world, k) {
  const br = k.brain;
  const g = br.goal;
  const body = k.body;
  if (!g || !body.onGround || world.now < (k.leapAt ?? 0)) return false;
  const nav = navOf(world.map);
  const here = surfaceOf(nav, body);
  const dx = g.x - body.x;
  if (here < 0 || here !== g.surface || Math.abs(dx) < LEAP.min) return false;
  const surf = nav.surfaces[here];
  const tx = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, body.x + Math.sign(dx) * Math.min(Math.abs(dx) - 30, LEAP.far)));
  body.facing = Math.sign(dx);
  sync(k);
  k.act = { kind: 'leap', t0: world.now, dur: LEAP.dur, done: 0, from: [body.x, body.y], to: [tx, surf.yAt(tx)] };
  k.leapAt = world.now + LEAP.dur + LEAP.every;
  return true;
}
// Where a leap carries her at `t` seconds in: a crouch where she stands, the bound (an arc, fast
// off the ground and hanging at the top), then the landing where she comes down.
const CROUCH = 0.16;
const LAND = 0.12;
function leaping(world, k, a, t) {
  const body = k.body;
  const air = LEAP.dur - CROUCH - LAND;
  const u = Math.max(0, Math.min(1, (t - CROUCH) / air));
  const e = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) ** 2;
  if (t >= CROUCH && !a.launched) {
    a.launched = true;
    world.juice.push({ type: 'dust', x: body.x, y: body.y, count: 4, dir: -k.dir });
  }
  body.x = a.from[0] + (a.to[0] - a.from[0]) * e;
  body.y = a.from[1] + (a.to[1] - a.from[1]) * e - LEAP.high * Math.sin(Math.PI * u);
  body.vx = t >= CROUCH && u < 1 ? (a.to[0] - a.from[0]) / air : 0;
  body.vy = 0;
  body.onGround = u <= 0 || u >= 1;
  if (u >= 1 && !a.landed) {
    a.landed = true;
    Object.assign(body, { x: a.to[0], y: a.to[1], onGround: true });
    // She's big: the ground feels it.
    world.juice.push({ type: 'dust', x: body.x, y: body.y, count: 6 });
    world.juice.push({ type: 'shake', mag: 1.2, dur: 0.15 });
  }
  sync(k);
}

// Plays out what she's in the middle of, rooted where she stands (or carried by a leap).
function act(world, k, dt) {
  const a = k.act;
  const t = world.now - a.t0;
  if (a.kind === 'leap') {
    leaping(world, k, a, t);
    if (t >= a.dur) {
      k.act = null;
      k.brain.path = null;
    }
    return;
  }
  stepBody(k.body, world.map, NONE, dt, { speed: 0, jump: 0 });
  sync(k);
  const M = KMOVES[a.kind];
  // Her lunges kick up dust from the front foot as she drives in, and her planted heel when she
  // slams the naginata down.
  const stamp = M ? M.hits[0] * M.dur - 0.06 : a.kind === 'call' ? CALL.hit * CALL.dur : null;
  if (stamp != null && !a.dust && t >= stamp) {
    a.dust = true;
    world.juice.push({ type: 'dust', x: k.x + k.dir * (a.kind === 'call' ? 4 : 14), y: k.y, count: a.kind === 'sweep' || a.kind === 'call' ? 5 : 3, dir: a.kind === 'call' ? 0 : -k.dir });
  }
  if (M) {
    while (a.done < M.hits.length && t >= M.hits[a.done] * M.dur) {
      const last = a.done === M.hits.length - 1;
      a.done += 1;
      strike(world, k, a.kind, M, last);
    }
  } else if (a.kind === 'call' && !a.hit && t >= CALL.hit * CALL.dur) {
    a.hit = true;
    foxFireCall(world, k);
  }
  if (t >= a.dur) {
    k.act = null;
    k.next = world.now + REST[0] + Math.random() * (REST[1] - REST[0]);
  }
}

// One of her blows landing: everything in the blade's reach in front of her.
function strike(world, k, kind, M, last) {
  const dir = k.dir;
  // The naginata's smear in the shrine's white and vermilion: a long low arc for the sweep, a cut
  // from low up over her for the rising cut, a short sharp line ahead for a thrust.
  const [start, sweep, thick] = SMEAR[kind];
  world.fx.push({ kind: 'arc', x: k.x + dir * 12, y: k.y - 28, dir, r: M.reach * 0.62, start, sweep, thick, big: last && kind !== 'twin', color: last ? '#ff8a7a' : '#fff4ec', t: 0, dur: 0.3 });
  const hit = world.mobs
    .filter((m) => alive(m) && Math.abs(m.y - k.y) < 70 && (m.x - k.x) * dir > -12 && Math.abs(m.x - k.x) < M.reach + m.def.w / 2)
    .sort((m, o) => Math.abs(m.x - k.x) - Math.abs(o.x - k.x))
    .slice(0, M.targets);
  hit.forEach((m, i) => dollHit(world, m, { pct: M.pct, x: k.x, knock: M.knock, launch: M.launch ?? 0, stop: i ? 0 : last ? 0.06 : 0.03, shake: !i && last && kind !== 'twin' ? 2 : 0, big: last && !i, burst: 'spirithit', gauge: 2, key: 'kitsune' }));
}

// Fox-Fire Call: the naginata's butt planted, and a ring of fox fire throws the monsters crowding
// the Maiden back off her, dazed.
function foxFireCall(world, k) {
  const b = world.body;
  world.fx.push({ kind: 'kitsunecall', x: k.x, y: k.y, t: 0, dur: 0.8 });
  world.juice.push({ type: 'shake', mag: 1.5, dur: 0.2 });
  for (const m of world.mobs) {
    if (!alive(m) || Math.abs(m.x - b.x) > CALL.range || Math.abs(m.y - b.y) > 80) continue;
    dollHit(world, m, { pct: CALL.pct, x: b.x, knock: CALL.push, launch: 120, stun: CALL.daze, stop: 0.03, burst: 'spirithit', gauge: 2, key: 'kitsune' });
  }
}

// Guard (combat.js blockOnHit): she steps in front of a hit meant for the Maiden, if she's close by,
// rested, and not mid-move, and takes it on the haft. True if she did.
export function kitsuneGuard(world, fromX, rng = Math.random) {
  const k = guardianOf(world);
  if (!k || k.act || world.now < k.guardAt || rng() >= GUARD.chance) return false;
  const b = world.body;
  if (Math.hypot(k.x - b.x, k.y - b.y) > GUARD.near) return false;
  k.guardAt = world.now + GUARD.every;
  const side = Math.sign((fromX ?? b.x + b.facing) - b.x) || b.facing;
  Object.assign(k.body, { x: b.x + side * 20, y: b.y, vx: 0, vy: 0, rope: null, onGround: b.onGround, surface: b.surface, facing: side });
  sync(k);
  k.brain.path = null;
  k.act = { kind: 'block', t0: world.now, dur: 0.6, done: 0 };
  world.fx.push({ kind: 'kitsuneblock', x: k.x + side * 8, y: k.y, dir: side, t: 0, dur: 0.5 });
  return true;
}

// Her brain: the monster most dangerous to the Maiden, and a spot between the two of them; with
// nothing to fight, a step in front of the Maiden (and a bow, when a fight has just ended).
function think(world, k) {
  const br = k.brain;
  const nav = navOf(world.map);
  const b = world.body;
  const near = world.map.isTown ? [] : world.mobs.filter((m) => alive(m) && !(m.air > 60) && Math.abs(m.x - b.x) <= LEASH.x && Math.abs(m.y - b.y) <= LEASH.y);
  const m = near.sort((p, o) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(o.x - b.x, o.y - b.y))[0];
  if (m) {
    br.target = m;
    br.fought = true;
    const ms = surfaceBelow(nav, m.x, m.y);
    const surf = nav.surfaces[ms];
    if (!surf) return;
    // On the Maiden's side of it, just inside the naginata's reach.
    const side = Math.sign(b.x - m.x) || -m.facing || 1;
    // (Her naginata is huge, so she keeps a good way back from it.)
    const x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, m.x + side * 70));
    br.goal = { x, surface: ms };
    br.hurry = Math.abs(k.x - x) > 90;
    // The monsters crowding the Maiden: time for a Fox-Fire Call.
    if (world.now >= k.callAt && !k.act && near.some((o) => Math.abs(o.x - b.x) < CALL.range * 0.7)) {
      k.callAt = world.now + CALL.every;
      k.act = { kind: 'call', t0: world.now, dur: CALL.dur, done: 0 };
      k.body.facing = Math.sign(m.x - k.x) || k.body.facing;
      sync(k);
    }
    return;
  }
  br.target = null;
  // A fight just ended: she turns to the Maiden and bows.
  if (br.fought && !k.act && b.onGround) {
    br.fought = false;
    k.body.facing = Math.sign(b.x - k.x) || k.body.facing;
    sync(k);
    k.act = { kind: 'bow', t0: world.now, dur: BOW, done: 0 };
    return;
  }
  const bs = surfaceBelow(nav, b.x, b.y);
  const surf = nav.surfaces[bs];
  if (!surf) return;
  let x = b.x + b.facing * HOME;
  if (x < surf.x1 + 6 || x > surf.x2 - 6) x = b.x - b.facing * HOME;
  x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, x));
  br.goal = { x, surface: bs, home: true };
  br.hurry = Math.hypot(b.x - k.x, b.y - k.y) > 160;
}

// Walks her to her goal along a path over ledges and ropes (planned again when the goal moves to
// another surface, or every second).
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
    if (Math.abs(g.x - body.x) > (g.home ? 10 : 5)) {
      intent.right = g.x > body.x;
      intent.left = g.x < body.x;
    } else body.facing = br.target ? Math.sign(br.target.x - body.x) || body.facing : world.body.facing;
    return intent;
  }
  const { intent, lost } = followPath(nav, body, br.path, g.x);
  if (lost) br.path = null;
  return intent;
}

// Stuck, fallen off the map, or left far behind: back in front of the Maiden in a flurry of light.
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
  // (She leaps to catch up from far off; only very far, or lost, does she reappear.)
  if (off || Math.hypot(b.x - body.x, b.y - body.y) > 640) {
    world.fx.push({ kind: 'dollpop', x: b.x + b.facing * HOME, y: b.y - 24, t: 0, dur: 0.4 });
    Object.assign(body, { x: b.x + b.facing * HOME, y: b.y, vx: 0, vy: 0, rope: null, onGround: b.onGround, surface: b.surface, facing: b.facing });
    br.path = null;
  }
}

// Her own moves at her target, once she's rested: never the same twice running.
function fight(world, k) {
  const m = k.brain.target;
  if (!alive(m) || world.now < k.next || !k.body.onGround || k.act) return;
  if (Math.abs(m.y - k.y) > 40) return;
  const dx = Math.abs(m.x - k.x);
  const crowd = world.mobs.filter((o) => alive(o) && Math.abs(o.x - k.x) < 80 && Math.abs(o.y - k.y) < 40).length;
  if (dx > KMOVES.thrust.reach + m.def.w / 2 - 6) return;
  const pool = (crowd >= 2 ? ['sweep', 'sweep', 'thrust', 'rising', 'twin'] : ['thrust', 'rising', 'twin', 'sweep']).filter((n) => n !== k.last);
  const kind = pool[Math.floor(Math.random() * pool.length)];
  k.last = kind;
  k.body.facing = Math.sign(m.x - k.x) || k.body.facing;
  k.body.vx = 0;
  sync(k);
  k.act = { kind, t0: world.now, dur: KMOVES[kind].dur, done: 0 };
}
