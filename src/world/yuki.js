// The Onmyoji's yuki-onna (see docs/design/spirit-mage-paths.md): the second of her yokai troupe, a
// calm, aloof snow ghost. Always out, she floats after the Onmyoji (she has no feet: she drifts a
// hand's width above the ground, leaving frost where she passes), keeps her distance from what she
// fights, and kills with cold. She has a body of her own (physics.js) and goes over the map on it
// (nav.js), drifting.
// Her moves (render/yuki.js draws them), from the snow woman of the stories (her breath freezes
// travellers, she comes and goes in the blizzard):
//   Frost Breath   she leans in and breathes out a cone of freezing mist: everything in it is
//                  chilled, again and again, and frozen solid at the end
//   Ice Needles    a flick of her sleeve: a fan of ice needles flies at the monsters ahead
//   Icicle Fall    she raises a hand and brings it down: great icicles drop from the sky onto up
//                  to three monsters
//   Blizzard       her arms spread wide and a blizzard whirls round her a while, freezing what's in
//                  it (on a cooldown)
//   Snow Step      anything that gets right up close: she dissolves into snow and drifts back out
//                  of reach
// Her hits are spells of the Onmyoji's own magic attack (melee.js dollHit); the freezes are the
// game's own (world.js: frozen solid, bosses shrug it off).

import { dollHit, hasSpirit } from './melee.js';
import { jobChain } from '../data/jobs.js';
import { createBody, stepBody } from './physics.js';
import { navOf, findPath, followPath, surfaceBelow, surfaceOf } from './nav.js';

// Where she floats when there's nothing to fight: a little behind the Onmyoji, at her shoulder.
const HOME = 34;
const LEASH = { x: 300, y: 150 };
// How fast she drifts (% of a walk): unhurried; quicker when she's fallen behind.
const DRIFT = 66;
const HURRY = 130;
const HURRY_AT = 170;
const THINK = 0.25;
// How far she likes to keep from what she fights, and how close is too close (Snow Step).
const KEEP = 115;
const TOO_CLOSE = 46;
export const YUKI_MOVES = {
  breath: { dur: 1.7, from: 0.32, to: 0.78, every: 0.15, reach: 150, h: 60, pct: 26, last: 70, freeze: 1.4 },
  needles: { dur: 1.0, hit: 0.42, range: 290, n: 4, speed: 520, pct: 55 },
  icicle: { dur: 1.35, hit: 0.5, range: 300, n: 3, fall: 0.32, pct: 110, freeze: 0.6 },
  blizzard: { dur: 3.2, from: 0.22, to: 0.86, every: 0.3, r: 150, pct: 30, freeze: 1.2, cool: 11 },
  step: { dur: 0.9, out: 0.4, dist: 120, cool: 3 },
};
const REST = [0.5, 0.95];
const MOOD = { pleased: 1.4 };
const NONE = { left: false, right: false, up: false, down: false, jump: false };
const alive = (m) => m && m.hp > 0;

export const hasYuki = (char) => jobChain(char.job).includes('onmyoji');

// The yuki-onna, made when she's first needed (null for anyone but an Onmyoji).
export function yukiOf(world) {
  if (!hasYuki(world.char) || !hasSpirit(world.char)) return (world.yuki = null);
  const b = world.body;
  world.yuki ??= { act: null, next: 0, last: null, map: null, mood: null, blizzardAt: 5, stepAt: 0, prints: [] };
  const k = world.yuki;
  if (k.map !== world.map.id || !k.body) {
    k.map = world.map.id;
    k.body = createBody(b.x - b.facing * HOME, b.y);
    k.body.onGround = b.onGround;
    k.body.facing = b.facing;
    k.brain = { think: 0, target: null, goal: null, path: null, pathTo: -1, replanAt: 0, stall: 0, lastX: k.body.x, hurry: false };
    k.act = null;
    k.prints = [];
    sync(k);
  }
  return k;
}
const sync = (k) => {
  k.x = k.body.x;
  k.y = k.body.y;
  k.dir = k.body.facing;
};

export function tickYuki(world, dt) {
  const k = yukiOf(world);
  if (!k) return;
  const { now } = world;
  const had = k.brain.target;
  if (had && had.hp <= 0) k.mood = { kind: 'pleased', until: now + MOOD.pleased };
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
    stepBody(k.body, world.map, intent, dt, { speed: br.hurry ? HURRY : DRIFT, jump: 110 });
    stuck(world, k, intent, dt);
    sync(k);
    if (!world.dead) fight(world, k);
  }
  k.vx = k.body.vx;
  k.moving = !k.act && k.body.onGround && Math.abs(k.body.vx) > 8;
  // Frost where she passes: a print left on the ground every so often while she drifts.
  if (k.moving && k.body.onGround && Math.abs(k.x - (k.printX ?? -1e9)) > 18) {
    k.printX = k.x;
    world.fx.push({ kind: 'yukiprint', x: k.x, y: k.y, dir: k.dir, t: 0, dur: 3.2, seed: Math.random() });
  }
}

// Plays out what she's in the middle of.
function act(world, k, dt) {
  const a = k.act;
  const M = YUKI_MOVES[a.kind];
  stepBody(k.body, world.map, NONE, dt, { speed: 0, jump: 0 });
  sync(k);
  const u = (world.now - a.t0) / a.dur;
  if (a.kind === 'breath') breath(world, k, a, M, u);
  else if (a.kind === 'needles' && !a.done && u >= M.hit) needles(world, k, a, M);
  else if (a.kind === 'icicle' && !a.done && u >= M.hit) icicles(world, k, a, M);
  else if (a.kind === 'blizzard') blizzard(world, k, a, M, u);
  else if (a.kind === 'step' && !a.done && u >= M.out) snowStep(world, k, a, M);
  if (u >= 1) {
    k.act = null;
    k.next = world.now + REST[0] + Math.random() * (REST[1] - REST[0]);
  }
}

// Frost Breath: a cone of freezing mist ahead of her; everything in it is chilled every `every` s,
// and frozen solid with the last breath.
function breath(world, k, a, M, u) {
  if (!a.fx && u >= M.from) {
    a.fx = true;
    world.fx.push({ kind: 'yukibreath', x: k.x + k.dir * 18, y: k.y - 30, dir: k.dir, r: M.reach, t: 0, dur: (M.to - M.from) * M.dur + 0.4 });
  }
  if (u < M.from) return;
  const last = u >= M.to && !a.ended;
  if (u > M.to && !last) return;
  if (!last && world.now < (a.tickAt ?? 0)) return;
  a.tickAt = world.now + M.every;
  if (last) a.ended = true;
  for (const m of world.mobs) {
    if (!alive(m) || (m.x - k.x) * k.dir < -10 || Math.abs(m.x - k.x) > M.reach + m.def.w / 2) continue;
    // (The cone widens as it goes.)
    const along = Math.abs(m.x - k.x) / M.reach;
    if (Math.abs(m.y - k.y) > 20 + M.h * along) continue;
    dollHit(world, m, { pct: last ? M.last : M.pct, x: k.x, knock: last ? 60 : 8, freeze: last ? M.freeze : 0, stop: last ? 0.05 : 0, burst: 'yukihit', gauge: 1, key: 'yuki' });
  }
}
// Ice Needles: a fan of needles at the monsters ahead, nearest first.
function needles(world, k, a, M) {
  a.done = true;
  const dir = k.dir;
  const list = world.mobs
    .filter((m) => alive(m) && (m.x - k.x) * dir > 0 && Math.abs(m.x - k.x) < M.range && Math.abs(m.y - k.y) < 90)
    .sort((m, o) => Math.abs(m.x - k.x) - Math.abs(o.x - k.x));
  for (let i = 0; i < M.n; i++) {
    const m = list[i % Math.max(1, list.length)];
    const tx = m ? m.x : k.x + dir * M.range * (0.5 + 0.12 * i);
    const ty = m ? m.y - m.def.h * 0.6 : k.y - 30 + (i - 1.5) * 8;
    const fly = Math.abs(tx - k.x) / M.speed + i * 0.05;
    world.fx.push({ kind: 'yukineedle', x: k.x + dir * 14, y: k.y - 30 + (i - 1.5) * 5, tx, ty, mob: m ?? null, fly, t: -i * 0.05, dur: fly + 0.05 });
    if (m) dollHit(world, m, { pct: M.pct, x: k.x, knock: 30, stop: 0.02, burst: 'yukihit', gauge: 1, key: 'yuki' }, fly);
  }
}
// Icicle Fall: icicles drop out of the sky onto up to three monsters round her.
function icicles(world, k, a, M) {
  a.done = true;
  const list = world.mobs
    .filter((m) => alive(m) && Math.abs(m.x - k.x) < M.range && Math.abs(m.y - k.y) < 120)
    .sort((m, o) => Math.abs(m.x - k.x) - Math.abs(o.x - k.x))
    .slice(0, M.n);
  list.forEach((m, i) => {
    const at = M.fall + i * 0.12;
    world.fx.push({ kind: 'yukiicicle', x: m.x, y: m.y, mob: m, fall: at, t: 0, dur: at + 0.6 });
    dollHit(world, m, { pct: M.pct, x: m.x, knock: 20, freeze: M.freeze, stop: 0.06, shake: 2, big: true, burst: 'yukihit', gauge: 2, key: 'yuki' }, at);
  });
  world.juice.push({ type: 'shake', mag: 1, dur: 0.15, delay: M.fall });
}
// Blizzard: snow whirling round her, hitting and chilling everything near every `every` s, and
// freezing them with its last gust.
function blizzard(world, k, a, M, u) {
  if (!a.fx && u >= M.from) {
    a.fx = true;
    world.fx.push({ kind: 'yukiblizzard', x: k.x, y: k.y, r: M.r, t: 0, dur: (M.to - M.from) * M.dur + 0.5 });
  }
  if (u < M.from || a.ended) return;
  const last = u >= M.to;
  if (!last && world.now < (a.tickAt ?? 0)) return;
  a.tickAt = world.now + M.every;
  if (last) a.ended = true;
  for (const m of world.mobs) {
    if (!alive(m) || Math.abs(m.x - k.x) > M.r + m.def.w / 2 || Math.abs(m.y - k.y) > 90) continue;
    dollHit(world, m, { pct: last ? M.pct * 3 : M.pct, x: k.x, knock: last ? 120 : 10, freeze: last ? M.freeze : 0, stop: last ? 0.05 : 0, burst: 'yukihit', gauge: 1, key: 'yuki' });
  }
  if (last) world.juice.push({ type: 'shake', mag: 2.5, dur: 0.25 });
}
// Snow Step: she comes apart into snow and gathers again further off, away from what was on her.
function snowStep(world, k, a, M) {
  a.done = true;
  const nav = navOf(world.map);
  const surf = nav.surfaces[surfaceOf(nav, k.body)];
  let x = k.x - k.dir * M.dist;
  if (surf) x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, x));
  world.fx.push({ kind: 'yukistep', x: k.x, y: k.y, t: 0, dur: 0.7 });
  k.body.x = x;
  if (surf) k.body.y = surf.yAt(x);
  sync(k);
  world.fx.push({ kind: 'yukistep', x: k.x, y: k.y, t: 0, dur: 0.7 });
}

// Her brain: the monster nearest the Onmyoji, and a spot at her distance from it, on the Onmyoji's
// side; with nothing to fight, at the Onmyoji's shoulder.
function think(world, k) {
  const br = k.brain;
  const nav = navOf(world.map);
  const b = world.body;
  const near = world.map.isTown ? [] : world.mobs.filter((m) => alive(m) && !(m.air > 60) && Math.abs(m.x - b.x) <= LEASH.x && Math.abs(m.y - b.y) <= LEASH.y);
  const m = near.sort((p, o) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(o.x - b.x, o.y - b.y))[0];
  if (m) {
    br.target = m;
    const ms = surfaceBelow(nav, m.x, m.y);
    const surf = nav.surfaces[ms];
    if (!surf) return;
    const side = Math.sign(b.x - m.x) || Math.sign(k.x - m.x) || 1;
    const x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, m.x + side * KEEP));
    br.goal = { x, surface: ms };
    br.hurry = Math.abs(k.x - x) > HURRY_AT;
    return;
  }
  br.target = null;
  const bs = surfaceBelow(nav, b.x, b.y);
  const surf = nav.surfaces[bs];
  if (!surf) return;
  let x = b.x - b.facing * HOME;
  if (x < surf.x1 + 6 || x > surf.x2 - 6) x = b.x + b.facing * HOME;
  x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, x));
  br.goal = { x, surface: bs, home: true };
  br.hurry = Math.hypot(b.x - k.x, b.y - k.y) > HURRY_AT;
}

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
    if (Math.abs(g.x - body.x) > (g.home ? 12 : 8)) {
      intent.right = g.x > body.x;
      intent.left = g.x < body.x;
    } else body.facing = br.target ? Math.sign(br.target.x - body.x) || body.facing : world.body.facing;
    return intent;
  }
  const { intent, lost } = followPath(nav, body, br.path, g.x);
  if (lost) br.path = null;
  return intent;
}

// Stuck, fallen off the map, or left far behind: she gathers again out of snow at the Onmyoji's side.
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
  if (off || Math.hypot(b.x - body.x, b.y - body.y) > 520) {
    world.fx.push({ kind: 'yukistep', x: body.x, y: body.y, t: 0, dur: 0.7 });
    Object.assign(body, { x: b.x - b.facing * HOME, y: b.y, vx: 0, vy: 0, rope: null, onGround: b.onGround, surface: b.surface, facing: b.facing });
    sync(k);
    world.fx.push({ kind: 'yukistep', x: body.x, y: body.y, t: 0, dur: 0.7 });
    br.path = null;
  }
}

// What she does next: Snow Step away from anything right on her; a Blizzard when they crowd round
// (on its cooldown); else Frost Breath at what's close, Icicle Fall or Ice Needles at what's
// further off, never the same twice running.
function fight(world, k) {
  const m = k.brain.target;
  if (!alive(m) || !k.body.onGround || k.act || world.now < k.next) return;
  const dx = Math.abs(m.x - k.x);
  const start = (kind) => {
    k.last = kind;
    k.body.facing = kind === 'step' ? Math.sign(m.x - k.x) || k.body.facing : Math.sign(m.x - k.x) || k.body.facing;
    k.body.vx = 0;
    sync(k);
    k.act = { kind, t0: world.now, dur: YUKI_MOVES[kind].dur, done: false };
  };
  if (dx < TOO_CLOSE && world.now >= k.stepAt && Math.abs(m.y - k.y) < 40) {
    k.stepAt = world.now + YUKI_MOVES.step.cool;
    return start('step');
  }
  if (dx > YUKI_MOVES.needles.range || Math.abs(m.y - k.y) > 120) return;
  const crowd = world.mobs.filter((o) => alive(o) && Math.abs(o.x - k.x) < YUKI_MOVES.blizzard.r && Math.abs(o.y - k.y) < 60).length;
  if (crowd >= 3 && world.now >= k.blizzardAt) {
    k.blizzardAt = world.now + YUKI_MOVES.blizzard.cool;
    return start('blizzard');
  }
  const pool = (dx < YUKI_MOVES.breath.reach - 10 && Math.abs(m.y - k.y) < 40 ? ['breath', 'breath', 'needles', 'icicle'] : ['needles', 'icicle']).filter((n) => n !== k.last);
  start(pool[Math.floor(Math.random() * pool.length)] ?? 'needles');
}
