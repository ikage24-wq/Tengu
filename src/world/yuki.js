// The Onmyoji's yuki-onna (see docs/design/spirit-mage-paths.md): the second of her yokai troupe, a
// calm, aloof snow ghost. Always out, she floats after the Onmyoji (she has no feet: she drifts a
// hand's width above the ground, leaving frost where she passes), keeps her distance from what she
// fights, and kills with cold. She has a body of her own (physics.js) and goes over the map on it
// (nav.js), drifting.
// Her moves (render/yuki.js draws them), from the snow woman of the stories and the games:
//   White Breath   (Hearn's Kwaidan: she bent over the old man and breathed on him, her breath
//                  "like a bright white smoke") she glides in, bends over the monster and breathes a
//                  long stream of white smoke on it: it frosts over, more and more, and freezes
//   Answer Me      (in the stories, whoever answers her loses their life) she glides up close,
//                  tilts her head and asks; a pale soul-wisp is drawn out of the monster into her
//                  cupped hands, then she lets it go and it drifts to the Onmyoji and heals her
//                  (on a cooldown)
//   Ice Spikes     (Nioh's snow woman) she bends and presses her palm to the snow: ice spikes
//                  burst up out of the ground in a line ahead of her, one after another, and throw
//                  what they catch into the air
//   Icicle Fall    a hand raised slowly and brought down: icicles drop on up to three monsters; a
//                  frozen one shatters (it takes far more)
//   Whiteout       (she leads travellers astray in the snowstorm) she rises, arms spread, and the
//                  world goes white round her: lost in it, the monsters wander in toward her, chilled
//                  through, and freeze where they stand (on a cooldown)
//   Snowball,      her lighter blows (Onmyoji's snow woman throws snowballs): a lazy underhand
//   Ice Needles    toss of a snowball that bursts on the monster, or a flick of her sleeve that
//                  fans ice needles at the monsters ahead
//   Into the Mist  (O-Yuki melts into white mist at the end of Hearn's tale) anything right on her:
//                  she melts into a drift of white mist and gathers again out of reach
// Her cold builds up on a monster (`chill`, up to five): it frosts over as it does (render/spirit-fx.js
// 'yukifrost'), and at five it freezes solid. Her hits are spells of the Onmyoji's own magic attack
// (melee.js dollHit); the freezes are the game's own (world.js: frozen solid, bosses shrug it off).

import { dollHit, hasSpirit, healAround, troupeRest } from './melee.js';
import { comboStep } from './onmyoji.js';
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
  // (`glide`: she drifts in to `close` px from the monster over the first part of the move.)
  breath: { dur: 2.3, glide: 0.24, close: 52, from: 0.34, to: 0.84, every: 0.14, reach: 118, h: 34, pct: 22, last: 60, chill: 1 },
  ask: { dur: 2.8, glide: 0.2, close: 30, ask: 0.24, from: 0.4, to: 0.8, every: 0.13, pct: 16, let: 0.84, fly: 0.45, heal: 0.05, cool: 10 },
  spikes: { dur: 1.5, hit: 0.44, n: 7, start: 26, gap: 30, every: 0.06, pct: 70, launch: 240, chill: 1 },
  icicle: { dur: 1.35, hit: 0.5, range: 300, n: 3, fall: 0.32, pct: 100, shatter: 2.5, chill: 2 },
  whiteout: { dur: 3.8, from: 0.2, to: 0.88, every: 0.3, r: 170, pull: 38, pct: 20, chill: 1, cool: 12 },
  snowball: { dur: 0.9, hit: 0.42, range: 250, speed: 260, pct: 45, chill: 1 },
  needles: { dur: 1.0, hit: 0.42, range: 290, n: 4, speed: 520, pct: 36, chill: 1 },
  mist: { dur: 1.2, out: 0.3, back: 0.7, dist: 130, cool: 3 },
};
// Her cold on a monster: up to `max`, gone after `last` s without more, frozen solid at `max`.
export const CHILL = { max: 5, last: 4, freeze: 1.8 };
const REST = [0.5, 0.95];
const MOOD = { pleased: 1.4 };
const NONE = { left: false, right: false, up: false, down: false, jump: false };
const alive = (m) => m && m.hp > 0;

export const hasYuki = (char) => jobChain(char.job).includes('onmyoji');

// The yuki-onna, made when she's first needed (null for anyone but an Onmyoji).
export function yukiOf(world) {
  if (!hasYuki(world.char) || !hasSpirit(world.char)) return (world.yuki = null);
  const b = world.body;
  world.yuki ??= { act: null, next: 0, last: null, map: null, mood: null, whiteoutAt: 5, askAt: 3, stepAt: 0, prints: [] };
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
  if (k.thaw?.length) {
    for (const t of k.thaw) if (world.now >= t.at) t.m.frozenUntil = Math.min(t.m.frozenUntil ?? 0, world.now);
    k.thaw = k.thaw.filter((t) => world.now < t.at);
  }
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
  k.moving = (!k.act && k.body.onGround && Math.abs(k.body.vx) > 8) || Boolean(k.gliding);
  // Frost where she passes: a print left on the ground every so often while she drifts.
  if (k.moving && Math.abs(k.x - (k.printX ?? -1e9)) > 18) {
    k.printX = k.x;
    world.fx.push({ kind: 'yukiprint', x: k.x, y: k.y, dir: k.dir, t: 0, dur: 3.2, seed: Math.random() });
  }
}

// Plays out what she's in the middle of.
function act(world, k, dt) {
  const a = k.act;
  // (Her part in the Onmyoji's Troupe Combo: world/onmyoji.js plays it.)
  if (a.kind === 'combo') return comboStep(world, k);
  const M = YUKI_MOVES[a.kind];
  stepBody(k.body, world.map, NONE, dt, { speed: 0, jump: 0 });
  const u = (world.now - a.t0) / a.dur;
  // Gliding in to the monster (or melting away through the mist).
  if (a.gx != null) {
    const g = a.kind === 'mist' ? soft((u - M.out) / (M.back - M.out)) : soft(u / M.glide);
    k.body.x = a.x0 + (a.gx - a.x0) * g;
    if (a.surf) k.body.y = a.surf.yAt(k.body.x);
    k.body.vx = 0;
  }
  sync(k);
  k.gliding = a.gx != null && a.kind !== 'mist' && u < M.glide;
  if (a.kind === 'breath') breath(world, k, a, M, u);
  else if (a.kind === 'ask') ask(world, k, a, M, u);
  else if (a.kind === 'spikes' && !a.done && u >= M.hit) spikes(world, k, a, M);
  else if (a.kind === 'icicle' && !a.done && u >= M.hit) icicles(world, k, a, M);
  else if (a.kind === 'whiteout') whiteout(world, k, a, M, u, dt);
  else if (a.kind === 'snowball' && !a.done && u >= M.hit) snowball(world, k, a, M);
  else if (a.kind === 'needles' && !a.done && u >= M.hit) needles(world, k, a, M);
  else if (a.kind === 'mist') mist(world, k, a, M, u);
  if (u >= 1) {
    k.act = null;
    k.gliding = false;
    k.next = world.now + (REST[0] + Math.random() * (REST[1] - REST[0])) * troupeRest(world);
  }
}
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, t)));

// One of her cold hits: `chill` more cold on the monster, and frozen solid when it reaches the most.
function coldHit(world, m, f, chill = 0, at = 0) {
  let freeze = f.freeze ?? 0;
  if (chill && !(m.frozenUntil > world.now)) {
    const c = (m.yukiChill = m.yukiChill && m.yukiChill.until > world.now ? m.yukiChill : { n: 0, until: 0 });
    c.n = Math.min(CHILL.max, c.n + chill);
    c.until = world.now + at + CHILL.last;
    if (c.n >= CHILL.max) {
      freeze = Math.max(freeze, CHILL.freeze);
      c.n = 0;
      c.until = 0;
    }
    const fx = m.yukiFrost && world.fx.includes(m.yukiFrost) ? m.yukiFrost : null;
    if (fx) fx.t = Math.min(fx.t, 0.2);
    else world.fx.push((m.yukiFrost = { kind: 'yukifrost', x: m.x, y: m.y, mob: m, t: 0, dur: CHILL.last + at }));
  }
  dollHit(world, m, { burst: 'yukihit', gauge: 1, key: 'yuki', ...f, freeze }, at);
}
const ahead = (world, k, reach, h) => world.mobs.filter((m) => alive(m) && (m.x - k.x) * k.dir > -10 && Math.abs(m.x - k.x) < reach + m.def.w / 2 && Math.abs(m.y - k.y) < h);

// White Breath: bent over the monster, a long stream of white smoke; everything in it is chilled
// every `every` s, and once more, harder, with the last of it.
function breath(world, k, a, M, u) {
  if (!a.fx && u >= M.from) {
    a.fx = true;
    world.fx.push({ kind: 'yukistream', x: k.x + k.dir * 14, y: k.y - 34, yuki: k, dir: k.dir, r: M.reach, t: 0, dur: (M.to - M.from) * M.dur + 0.5 });
  }
  if (u < M.from || a.ended) return;
  const last = u >= M.to;
  if (!last && world.now < (a.tickAt ?? 0)) return;
  a.tickAt = world.now + M.every;
  if (last) a.ended = true;
  for (const m of ahead(world, k, M.reach, M.h + 20)) coldHit(world, m, { pct: last ? M.last : M.pct, x: k.x, knock: last ? 50 : 4, stop: last ? 0.05 : 0 }, M.chill);
}
// Answer Me: she asks; its soul is drawn out into her hands a while (a hit every `every` s), then
// she lets it go and it drifts to the Onmyoji, healing her.
function ask(world, k, a, M, u) {
  const m = a.mob;
  if (!a.asked && u >= M.ask) {
    a.asked = true;
    world.fx.push({ kind: 'yukiask', x: k.x + k.dir * 6, y: k.y - 52, yuki: k, dir: k.dir, t: 0, dur: 1 });
  }
  if (u >= M.from && !a.drawn && alive(m)) {
    a.drawn = true;
    world.fx.push({ kind: 'yukisoul', x: k.x + k.dir * 9, y: k.y - 30, mob: m, t: 0, dur: (M.to - M.from) * M.dur });
  }
  if (u >= M.from && u < M.to && alive(m) && world.now >= (a.tickAt ?? 0)) {
    a.tickAt = world.now + M.every;
    a.drank = (a.drank ?? 0) + 1;
    dollHit(world, m, { pct: M.pct, x: k.x, knock: 0, stun: 0.3, burst: 'yukihit', gauge: 1, key: 'yuki' });
  }
  if (u >= M.let && !a.let) {
    a.let = true;
    if (!a.drank) return;
    const b = world.body;
    world.fx.push({ kind: 'yukisoulfly', x: k.x + k.dir * 6, y: k.y - 40, tx: b.x, ty: b.y - 24, t: 0, dur: M.fly });
    a.healAt = world.now + M.fly;
  }
  if (a.healAt && world.now >= a.healAt) {
    a.healAt = 0;
    healAround(world, world.body.x, world.body.y, M.heal, 60, false);
  }
}
// Ice Spikes: a line of ice spikes bursting up out of the ground ahead of her, one after another.
function spikes(world, k, a, M) {
  a.done = true;
  const nav = navOf(world.map);
  const surf = nav.surfaces[surfaceOf(nav, k.body)];
  const hit = new Set();
  for (let i = 0; i < M.n; i++) {
    const x = k.x + k.dir * (M.start + i * M.gap);
    if (surf && (x < surf.x1 || x > surf.x2)) break;
    const y = surf ? surf.yAt(x) : k.y;
    const at = i * M.every;
    world.fx.push({ kind: 'yukispike', x, y, dir: k.dir, big: i === M.n - 1, t: -at, dur: at + 0.9, seed: Math.random() });
    for (const m of world.mobs) {
      if (!alive(m) || hit.has(m) || Math.abs(m.x - x) > M.gap / 2 + m.def.w / 2 || Math.abs(m.y - y) > 40) continue;
      hit.add(m);
      coldHit(world, m, { pct: M.pct, x: k.x, knock: 30, launch: M.launch, stop: 0.04, shake: 1.5 }, M.chill, at);
    }
  }
  world.juice.push({ type: 'shake', mag: 1.2, dur: 0.3 });
}
// Icicle Fall: icicles drop out of the sky onto up to three monsters round her; a frozen one shatters.
function icicles(world, k, a, M) {
  a.done = true;
  const list = world.mobs
    .filter((m) => alive(m) && Math.abs(m.x - k.x) < M.range && Math.abs(m.y - k.y) < 120)
    .sort((m, o) => (o.frozenUntil > world.now) - (m.frozenUntil > world.now) || Math.abs(m.x - k.x) - Math.abs(o.x - k.x))
    .slice(0, M.n);
  list.forEach((m, i) => {
    const at = M.fall + i * 0.12;
    const frozen = m.frozenUntil > world.now + at;
    world.fx.push({ kind: 'yukiicicle', x: m.x, y: m.y, mob: m, fall: at, shatter: frozen, t: 0, dur: at + 0.7 });
    if (frozen) {
      // (A frozen monster shatters: the ice comes off it.)
      dollHit(world, m, { pct: M.pct * M.shatter, x: m.x, knock: 60, launch: 120, stop: 0.1, shake: 4, big: true, burst: 'yukishatter', gauge: 3, key: 'yuki' }, at);
      thawAfter(world, m, at);
    } else coldHit(world, m, { pct: M.pct, x: m.x, knock: 20, stop: 0.06, shake: 2, big: true, gauge: 2 }, M.chill, at);
  });
  world.juice.push({ type: 'shake', mag: 1, dur: 0.15, delay: M.fall });
}
// (Once it's shattered, it's thawed.)
function thawAfter(world, m, at) {
  (world.yuki.thaw ??= []).push({ m, at: world.now + at });
}
// Whiteout: the world goes white round her; the monsters lost in it wander in toward her, chilled
// every `every` s, and freeze where they stand at the end.
function whiteout(world, k, a, M, u, dt) {
  if (!a.fx && u >= M.from) {
    a.fx = true;
    world.fx.push({ kind: 'yukiwhiteout', x: k.x, y: k.y, r: M.r, dir: k.dir, t: 0, dur: (M.to - M.from) * M.dur + 0.6 });
  }
  if (u < M.from || a.ended) return;
  const near = world.mobs.filter((m) => alive(m) && !(m.air > 60) && Math.abs(m.x - k.x) < M.r + m.def.w / 2 && Math.abs(m.y - k.y) < 90);
  // Lost: they drift in toward her, turning this way and that.
  for (const m of near) {
    if (m.frozenUntil > world.now || m.def.boss) continue;
    const dx = k.x - m.x;
    if (Math.abs(dx) > 20) m.x = Math.max(m.x1 ?? -Infinity, Math.min(m.x2 ?? Infinity, m.x + Math.sign(dx) * M.pull * dt));
    m.knockVx = 0;
    m.stagger = Math.max(m.stagger ?? 0, 0.15);
    if (Math.random() < dt * 1.5) m.dir = -(m.dir || 1);
  }
  const last = u >= M.to;
  if (!last && world.now < (a.tickAt ?? 0)) return;
  a.tickAt = world.now + M.every;
  if (last) a.ended = true;
  for (const m of near) coldHit(world, m, { pct: last ? M.pct * 3 : M.pct, x: k.x, knock: last ? 40 : 0, stop: last ? 0.06 : 0 }, last ? CHILL.max : M.chill);
  if (last) world.juice.push({ type: 'shake', mag: 2.5, dur: 0.25 });
}
// Snowball: a lazy underhand toss at the monster.
function snowball(world, k, a, M) {
  a.done = true;
  const m = a.mob;
  if (!alive(m)) return;
  const fly = Math.max(0.25, Math.abs(m.x - k.x) / M.speed);
  world.fx.push({ kind: 'yukisnowball', x: k.x + k.dir * 10, y: k.y - 26, tx: m.x, ty: m.y - m.def.h * 0.5, mob: m, fly, t: 0, dur: fly + 0.02 });
  world.fx.push({ kind: 'yukipuff', x: m.x, y: m.y - m.def.h * 0.5, mob: m, dir: k.dir, t: -fly, dur: fly + 0.5 });
  coldHit(world, m, { pct: M.pct, x: k.x, knock: 40, stop: 0.03, burst: 'yukihit' }, M.chill, fly);
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
    if (m) coldHit(world, m, { pct: M.pct, x: k.x, knock: 30, stop: 0.02 }, M.chill, fly);
  }
}
// Into the Mist: she melts into a drift of white mist (act() carries her off through it) and
// gathers again out of reach.
function mist(world, k, a, M, u) {
  if (!a.gone && u >= M.out) {
    a.gone = true;
    world.fx.push({ kind: 'yukistep', x: a.x0, y: k.y, t: 0, dur: 0.7 });
    world.fx.push({ kind: 'yukimist', x: a.x0, y: k.y, tx: a.gx, ty: a.surf ? a.surf.yAt(a.gx) : k.y, t: 0, dur: (M.back - M.out) * M.dur + 0.5 });
  }
  if (!a.back && u >= M.back) {
    a.back = true;
    world.fx.push({ kind: 'yukistep', x: k.x, y: k.y, t: 0, dur: 0.7 });
  }
}

// Her brain: the monster nearest the Onmyoji, and a spot at her distance from it, on the Onmyoji's
// side; with nothing to fight, at the Onmyoji's shoulder.
function think(world, k) {
  const br = k.brain;
  const nav = navOf(world.map);
  const b = world.body;
  const near = world.map.isTown ? [] : world.mobs.filter((m) => alive(m) && !(m.air > 60) && Math.abs(m.x - b.x) <= LEASH.x && Math.abs(m.y - b.y) <= LEASH.y);
  // (The tengu leads the troupe: what he's marked comes first.)
  const mark = world.tengu?.mark?.mob;
  const m = mark && near.includes(mark) ? mark : near.sort((p, o) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(o.x - b.x, o.y - b.y))[0];
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

// What she does next: into the mist away from anything right on her; a Whiteout when they crowd
// round, Answer Me now and then (both on cooldowns); Icicle Fall on something frozen (to shatter
// it); else White Breath or Ice Spikes at what's close, a snowball, needles or icicles at what's
// further off, never the same twice running.
function fight(world, k) {
  const m = k.brain.target;
  if (!alive(m) || !k.body.onGround || k.act || world.now < k.next) return;
  const dx = Math.abs(m.x - k.x);
  const dy = Math.abs(m.y - k.y);
  const nav = navOf(world.map);
  const surf = nav.surfaces[surfaceOf(nav, k.body)];
  const clampX = (x) => (surf ? Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, x)) : x);
  const start = (kind) => {
    const M = YUKI_MOVES[kind];
    k.last = kind;
    k.body.facing = Math.sign(m.x - k.x) || k.body.facing;
    k.body.vx = 0;
    sync(k);
    k.act = { kind, t0: world.now, dur: M.dur, done: false, mob: m, x0: k.x, surf };
    // Gliding in close (only on her own ground), or away through the mist.
    if (M.glide && surf && surfaceBelow(nav, m.x, m.y) === surfaceOf(nav, k.body)) k.act.gx = clampX(m.x - k.dir * M.close);
    if (kind === 'mist') k.act.gx = clampX(k.x - k.dir * M.dist);
  };
  if (dx < TOO_CLOSE && world.now >= k.stepAt && dy < 40) {
    k.stepAt = world.now + YUKI_MOVES.mist.cool;
    return start('mist');
  }
  if (dx > YUKI_MOVES.needles.range || dy > 120) return;
  const crowd = world.mobs.filter((o) => alive(o) && Math.abs(o.x - k.x) < YUKI_MOVES.whiteout.r && Math.abs(o.y - k.y) < 60).length;
  if (crowd >= 3 && world.now >= k.whiteoutAt) {
    k.whiteoutAt = world.now + YUKI_MOVES.whiteout.cool;
    return start('whiteout');
  }
  const level = dy < 40;
  if (level && dx < 220 && world.now >= k.askAt && Math.random() < 0.4) {
    k.askAt = world.now + YUKI_MOVES.ask.cool;
    return start('ask');
  }
  if (m.frozenUntil > world.now + 0.6 && k.last !== 'icicle') return start('icicle');
  const close = level && dx < 200;
  const pool = (close ? ['breath', 'breath', 'spikes', 'spikes', 'snowball', 'needles', 'icicle'] : ['snowball', 'needles', 'icicle', ...(level && dx < 230 ? ['spikes'] : [])]).filter((n) => n !== k.last);
  start(pool[Math.floor(Math.random() * pool.length)] ?? 'snowball');
}
