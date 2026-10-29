// The Onmyoji's tengu (see docs/design/spirit-mage-paths.md): the last of her yokai troupe, a
// handsome, smug mountain tengu dressed as a yamabushi, with black crow wings, a feather fan
// (hauchiwa) and a sword. Always out, he fights on his own: he strolls after the Onmyoji fanning
// himself, and when she gets ahead or the way is up a ledge he simply flies. He has a body of his
// own (physics.js) and walks the map (nav.js), or flies over it.
// His moves, from the tengu of the stories (masters of the sword who taught the boy Yoshitsune on
// Mount Kurama, lords of the wind with their feather fans, fliers who carry people off, throwers of
// stones out of a clear sky; render/tengu.js draws them):
//   Iai           a hand on the hilt, then one flash: he's past the monster, the cut opening
//                 behind him, and the blade back in its sheath with a click
//   Kurama Blade  the sword drawn: a rising cut, a cross cut, a down cut, stepping in, and a dash
//                 clean through it to finish (he ends up on its far side)
//   Fan Gust      a great sweep of the feather fan: a wall of wind blowing everything ahead away
//   Tengu Wind    the fan raised and turned: a whirlwind springs up under the monsters ahead,
//                 lifting them and battering them a while (on a cooldown)
//   Feather Storm his wings thrown wide: a volley of black feathers flying out like knives
//   Tengu Stones  (tengu-tsubute) a flick of the fan at the sky: stones hail down out of nowhere
//                 on the monsters round his mark (on a cooldown)
//   Spirited Away (kamikakushi) he swoops on a monster, carries it high into the air, and hurls it
//                 down into the ground (never a boss; on a cooldown)
// He's quick and light where the oni is heavy: snapping blows on a swift clock, a hairline stop on
// each hit. When what he was fighting goes down he's insufferably pleased with himself; when a
// move misses, a 'tch'.
// His hits are spells of the Onmyoji's own magic attack (melee.js dollHit).

import { dollHit, hasSpirit } from './melee.js';
import { jobChain } from '../data/jobs.js';
import { createBody, stepBody } from './physics.js';
import { navOf, findPath, followPath, surfaceBelow, surfaceOf } from './nav.js';

// Where he stands when there's nothing to fight: just behind the Onmyoji's shoulder (px).
const HOME = 40;
const LEASH = { x: 320, y: 170 };
// How fast he strolls (% of a walk), and when he'd rather fly: further than this from where he's
// going, or up or down to another ledge.
const WALK = 70;
const FLY_AT = 200;
const THINK = 0.25;
// How close he likes to stand to what he's fighting.
const CLOSE = 46;
export const TENGU_MOVES = {
  iai: { dur: 1.15, hits: [0.36], dash: [0.28, 0.34], dist: 74, reach: 40, pct: 120, knock: 50, targets: 4 },
  kurama: { dur: 1.75, hits: [0.18, 0.34, 0.5, 0.74], dash: [0.66, 0.74], dist: 84, step: 8, reach: 58, pct: [55, 55, 60, 110], knock: [20, 20, 30, 150], launch: [0, 0, 0, 120], targets: 4 },
  gust: { dur: 1.2, hits: [0.38], range: 190, h: 60, pct: 60, knock: 260, n: 3, every: 0.08 },
  whirlwind: { dur: 1.5, hits: [0.5], range: 240, r: 34, last: 1.6, every: 0.25, pct: 28, lift: 70, cool: 9 },
  feathers: { dur: 1.2, hits: [0.42], range: 270, n: 8, speed: 640, pct: 30 },
  stones: { dur: 1.1, hits: [0.4], range: 280, r: 60, n: 12, over: 0.9, pct: 26, cool: 7 },
  spirited: { dur: 2.5, swoop: [0.08, 0.24], rise: [0.26, 0.6], hurl: 0.68, slam: 0.8, land: [0.82, 1], high: 110, reach: 160, pct: 210, cool: 12 },
};
// The swift clock: a breath before each blow, then fast through it, a hairline stop on the hit.
const SWIFT = { before: 0.05, slow: 0.55, snap: 1.6, stop: 0.04, lastStop: 0.09 };
function swiftRate(M, u) {
  for (const h of M.hits ?? [M.slam]) {
    if (u >= h - SWIFT.before * 2 && u < h - SWIFT.before) return SWIFT.slow;
    if (u >= h - SWIFT.before && u < h) return SWIFT.snap;
  }
  return 1;
}
const REST = [0.35, 0.75];
const MOOD = { smug: 1.6, tch: 1.1 };
const NONE = { left: false, right: false, up: false, down: false, jump: false };
const alive = (m) => m && m.hp > 0;
const at = (v, i) => (Array.isArray(v) ? v[i] : v);
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, t)));

export const hasTengu = (char) => jobChain(char.job).includes('onmyoji');

// The tengu, made when he's first needed (null for anyone but an Onmyoji).
export function tenguOf(world) {
  if (!hasTengu(world.char) || !hasSpirit(world.char)) return (world.tengu = null);
  const b = world.body;
  world.tengu ??= { act: null, next: 0, last: null, map: null, mood: null, windAt: 3, stonesAt: 5, spiritedAt: 6, flight: null, air: 0 };
  const k = world.tengu;
  if (k.map !== world.map.id || !k.body) {
    k.map = world.map.id;
    k.body = createBody(b.x - b.facing * HOME, b.y);
    k.body.onGround = b.onGround;
    k.body.facing = b.facing;
    k.brain = { think: 0, target: null, goal: null, path: null, pathTo: -1, replanAt: 0, stall: 0, lastX: k.body.x };
    k.act = null;
    k.flight = null;
    k.air = 0;
    sync(k);
  }
  return k;
}
const sync = (k) => {
  k.x = k.body.x;
  k.y = k.body.y;
  k.dir = k.body.facing;
};

export function tickTengu(world, dt) {
  const k = tenguOf(world);
  if (!k) return;
  const { now } = world;
  // (His whirlwinds turn on whatever he's doing.)
  whirls(world);
  const had = k.brain.target;
  if (had && had.hp <= 0 && k.mood?.kind !== 'tch') k.mood = { kind: 'smug', until: now + MOOD.smug };
  if (k.mood && now >= k.mood.until) k.mood = null;
  if (k.act) act(world, k, dt);
  else if (k.flight) fly(world, k, dt);
  else {
    const br = k.brain;
    br.think -= dt;
    if (br.think <= 0) {
      br.think = THINK;
      think(world, k);
      takeOff(world, k);
    }
    if (!k.flight) {
      const intent = steer(world, k);
      stepBody(k.body, world.map, intent, dt, { speed: WALK, jump: 110 });
      stuck(world, k, intent, dt);
      sync(k);
      if (!world.dead) fight(world, k);
    }
  }
  k.vx = k.flight ? (k.flight.x1 - k.flight.x0) / k.flight.dur : k.body.vx;
  k.moving = !k.act && !k.flight && k.body.onGround && Math.abs(k.body.vx) > 8;
  k.flying = Boolean(k.flight);
}

// ---------- Flight ----------
// When where he's going is far off, or on another ledge, he spreads his wings and flies there in
// one long arc (a beat of the wings to lift off, a glide, and a light landing).
function takeOff(world, k) {
  const g = k.brain.goal;
  if (!g || !k.body.onGround) return;
  const nav = navOf(world.map);
  const surf = nav.surfaces[g.surface];
  if (!surf) return;
  const here = surfaceOf(nav, k.body);
  const y1 = surf.yAt(g.x);
  const d = Math.hypot(g.x - k.x, y1 - k.y);
  if (d < 24 || (here === g.surface && Math.abs(g.x - k.x) < FLY_AT)) return;
  const dur = Math.max(0.7, Math.min(1.7, d / 240));
  k.flight = { x0: k.x, y0: k.y, x1: g.x, y1, t: 0, dur, peak: 26 + Math.min(80, d * 0.18) + Math.max(0, k.y - y1) * 0.4 };
  k.body.facing = Math.sign(g.x - k.x) || k.body.facing;
  world.fx.push({ kind: 'tengutakeoff', x: k.x, y: k.y, dir: k.body.facing, t: 0, dur: 0.6 });
}
function fly(world, k, dt) {
  const f = k.flight;
  f.t += dt;
  const s = Math.min(1, f.t / f.dur);
  const e = soft(s);
  const body = k.body;
  body.x = f.x0 + (f.x1 - f.x0) * e;
  body.y = f.y0 + (f.y1 - f.y0) * e - f.peak * Math.sin(Math.PI * s);
  Object.assign(body, { vx: 0, vy: 0, onGround: false, rope: null });
  sync(k);
  if (s >= 1) {
    k.flight = null;
    body.y = f.y1 - 0.5;
    stepBody(body, world.map, NONE, dt, { speed: 0, jump: 0 });
    sync(k);
    k.brain.path = null;
    world.fx.push({ kind: 'tengutakeoff', x: k.x, y: k.y, dir: k.dir, land: true, t: 0, dur: 0.5 });
  }
}

// ---------- His moves ----------
function act(world, k, dt) {
  const a = k.act;
  const M = TENGU_MOVES[a.kind];
  if (a.kind !== 'spirited') stepBody(k.body, world.map, NONE, dt, { speed: 0, jump: 0 });
  a.clock ??= 0;
  const pace = swiftRate(M, a.clock / a.dur);
  a.rate = a.rate == null ? pace : a.rate + (pace - a.rate) * Math.min(1, dt * 24);
  if (a.freeze > 0) a.freeze -= dt;
  else a.clock += dt * a.rate;
  const u = a.clock / a.dur;
  if (M.dash) dash(world, k, a, M, u);
  if (a.kind === 'spirited') spirited(world, k, a, M, u);
  else {
    while (a.done < M.hits.length && u >= M.hits[a.done]) {
      const i = a.done++;
      const last = a.done === M.hits.length;
      if (M.step && !last) stepIn(world, k, M.step);
      a.landed = (a.landed ?? 0) + strike(world, k, a, M, i, last);
      a.freeze = last ? SWIFT.lastStop : SWIFT.stop;
    }
  }
  sync(k);
  if (u >= 1) {
    k.act = null;
    k.air = 0;
    if (!a.landed) k.mood = { kind: 'tch', until: world.now + MOOD.tch };
    k.next = world.now + REST[0] + Math.random() * (REST[1] - REST[0]);
  }
}
// Along his ledge: a step, or a dash (in one blink, between `M.dash` of the move).
function ledgeX(world, k, x) {
  const nav = navOf(world.map);
  const surf = nav.surfaces[surfaceOf(nav, k.body)];
  if (surf) x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, x));
  k.body.x = x;
  if (surf) k.body.y = surf.yAt(x);
}
const stepIn = (world, k, d) => ledgeX(world, k, k.body.x + k.dir * d);
function dash(world, k, a, M, u) {
  if (u < M.dash[0] || a.dashed) return;
  a.x0 ??= k.body.x;
  const s = Math.min(1, (u - M.dash[0]) / (M.dash[1] - M.dash[0]));
  ledgeX(world, k, a.x0 + k.dir * M.dist * s);
  if (!a.trail) {
    a.trail = true;
    world.fx.push({ kind: 'tengudash', x: a.x0, y: k.y, tx: a.x0 + k.dir * M.dist, dir: k.dir, t: 0, dur: 0.45 });
  }
  if (s >= 1) {
    a.dashed = true;
    // (Through it and out the other side: he turns back to it.)
    if (a.kind === 'kurama' || a.kind === 'iai') a.turn = true;
  }
}

// One blow (`i` of the move's). Returns how many it hit.
function strike(world, k, a, M, i, last) {
  const dir = k.dir;
  if (a.kind === 'iai' || a.kind === 'kurama') {
    // (A dashing cut catches everything along the dash; the others, what's in reach ahead.)
    const through = M.dash && i === M.hits.length - 1;
    const x0 = through ? (a.x0 ?? k.x) : k.x;
    const x1 = through ? k.x : k.x + dir * M.reach;
    const lo = Math.min(x0, x1) - 10;
    const hi = Math.max(x0, x1) + 10;
    const hit = world.mobs
      .filter((m) => alive(m) && Math.abs(m.y - k.y) < 70 && m.x + m.def.w / 2 > lo && m.x - m.def.w / 2 < hi)
      .slice(0, M.targets);
    const cut = ['up', 'across', 'down', 'through'][a.kind === 'iai' ? 3 : i];
    world.fx.push({ kind: 'tengucut', cut, x: through ? (x0 + x1) / 2 : k.x + dir * M.reach * 0.55, y: k.y - 22, dir, big: last, w: Math.abs(x1 - x0), t: through ? -0.04 : 0, dur: 0.4 });
    hit.forEach((m, j) => dollHit(world, m, { pct: at(M.pct, i), x: x0, knock: at(M.knock, i), launch: at(M.launch, i) ?? 0, stop: j ? 0 : last ? 0.08 : 0.03, shake: !j && last ? 2.5 : 0, big: last && !j, burst: 'tenguhit', gauge: 2, key: 'tengu' }, through ? 0.06 : 0));
    if (through) a.sheathe = true;
    return hit.length;
  }
  if (a.kind === 'gust') {
    world.fx.push({ kind: 'tengugust', x: k.x + dir * 16, y: k.y - 24, dir, r: M.range, t: 0, dur: 0.7 });
    const hit = world.mobs.filter((m) => alive(m) && (m.x - k.x) * dir > -8 && Math.abs(m.x - k.x) < M.range + m.def.w / 2 && Math.abs(m.y - k.y) < M.h + 20);
    hit.forEach((m) => {
      for (let j = 0; j < M.n; j++) dollHit(world, m, { pct: M.pct, x: k.x, knock: j === M.n - 1 ? M.knock : 30, stop: j ? 0 : 0.03, burst: 'tenguwind', gauge: 1, key: 'tengu' }, (Math.abs(m.x - k.x) / M.range) * 0.25 + j * M.every);
    });
    world.juice.push({ type: 'shake', mag: 1.5, dur: 0.2 });
    return hit.length;
  }
  if (a.kind === 'whirlwind') {
    const list = world.mobs.filter((m) => alive(m) && (m.x - k.x) * dir > -20 && Math.abs(m.x - k.x) < M.range && Math.abs(m.y - k.y) < 100)
      .sort((m, o) => Math.abs(m.x - k.x) - Math.abs(o.x - k.x));
    const m0 = list[0];
    const x = m0 ? m0.x : k.x + dir * 90;
    const y = m0 ? m0.y : k.y;
    world.fx.push({ kind: 'tenguwhirl', x, y, r: M.r, t: 0, dur: M.last + 0.3 });
    (k.whirls ??= []).push({ x, y, until: world.now + M.last, next: world.now, M });
    return list.length || 1;
  }
  if (a.kind === 'feathers') {
    const list = world.mobs.filter((m) => alive(m) && (m.x - k.x) * dir > 0 && Math.abs(m.x - k.x) < M.range && Math.abs(m.y - k.y) < 100)
      .sort((m, o) => Math.abs(m.x - k.x) - Math.abs(o.x - k.x));
    for (let j = 0; j < M.n; j++) {
      const m = list[j % Math.max(1, list.length)];
      const spread = (j - (M.n - 1) / 2) * 7;
      const tx = m ? m.x : k.x + dir * M.range;
      const ty = m ? m.y - m.def.h * 0.55 + spread * 0.4 : k.y - 30 + spread;
      const ox = k.x - dir * 6;
      const oy = k.y - 40 + spread * 0.6;
      const fly = Math.hypot(tx - ox, ty - oy) / M.speed;
      world.fx.push({ kind: 'tengufeather', x: ox, y: oy, tx, ty, mob: m ?? null, fly, t: -j * 0.025, dur: fly + 0.05 + j * 0.025, seed: Math.random() });
      if (m) dollHit(world, m, { pct: M.pct, x: k.x, knock: 20, stop: 0.01, burst: 'tenguhit', gauge: 1, key: 'tengu' }, fly + j * 0.025);
    }
    world.fx.push({ kind: 'tengufeatherburst', x: k.x, y: k.y - 30, dir, t: 0, dur: 0.8 });
    return list.length;
  }
  if (a.kind === 'stones') {
    const list = world.mobs.filter((m) => alive(m) && Math.abs(m.x - k.x) < M.range && Math.abs(m.y - k.y) < 120)
      .sort((m, o) => Math.abs(m.x - k.x) - Math.abs(o.x - k.x));
    const m0 = list[0];
    const cx = m0 ? m0.x : k.x + dir * 120;
    const cy = m0 ? m0.y : k.y;
    for (let j = 0; j < M.n; j++) {
      const x = cx + (Math.random() * 2 - 1) * M.r;
      const when = (j / M.n) * M.over;
      world.fx.push({ kind: 'tengustone', x, y: cy, t: -when, dur: when + 0.55, seed: Math.random(), big: j % 4 === 0 });
      for (const m of world.mobs) if (alive(m) && Math.abs(m.x - x) < 14 + m.def.w / 2 && Math.abs(m.y - cy) < 50) dollHit(world, m, { pct: M.pct, x, knock: 10, stun: 0.15, burst: 'tenguhit', gauge: 1, key: 'tengu' }, when + 0.3);
    }
    return list.length;
  }
  return 0;
}

// His whirlwinds, ticked while they last: everything in one is lifted and battered.
function whirls(world) {
  const k = world.tengu;
  if (!k?.whirls?.length) return;
  for (const w of k.whirls) {
    if (world.now < w.next) continue;
    w.next = world.now + w.M.every;
    for (const m of world.mobs) {
      if (!alive(m) || Math.abs(m.x - w.x) > w.M.r + m.def.w / 2 || Math.abs(m.y - w.y) > 60) continue;
      // (Drawn into the middle of it as it lifts them.)
      if (!m.def.boss) m.x += (w.x - m.x) * 0.4;
      dollHit(world, m, { pct: w.M.pct, x: w.x, knock: 0, launch: m.def.boss ? 0 : w.M.lift, burst: 'tenguwind', gauge: 1, key: 'tengu' });
    }
  }
  k.whirls = k.whirls.filter((w) => world.now < w.until);
}

// Spirited Away: he swoops down on the monster, catches it, carries it high up, hurls it down and
// drops after it to land.
function spirited(world, k, a, M, u) {
  const m = a.mob;
  const dir = k.dir;
  if (!a.from) {
    a.from = { x: k.body.x, y: k.body.y };
    world.fx.push({ kind: 'tengutakeoff', x: k.x, y: k.y, dir, t: 0, dur: 0.6 });
  }
  // Swooping in to it.
  if (u < M.swoop[1]) {
    const s = soft((u - M.swoop[0]) / (M.swoop[1] - M.swoop[0]));
    const tx = alive(m) ? m.x - dir * 18 : a.from.x;
    ledgeX(world, k, a.from.x + (tx - a.from.x) * s);
    k.air = 34 * Math.sin(Math.PI * s);
    return;
  }
  if (!a.caught) {
    a.caught = true;
    a.held = alive(m) && !m.def.boss && Math.abs(m.x - k.x) < 60 && Math.abs(m.y - k.y) < 60 ? m : null;
    if (a.held) {
      world.fx.push({ kind: 'tengufeatherburst', x: k.x + dir * 12, y: k.y - 20, dir, t: 0, dur: 0.7 });
      world.juice.push({ type: 'shake', mag: 1.5, dur: 0.12 });
    }
  }
  const held = a.held;
  // Carried up high, then hurled down.
  const up = soft((u - M.rise[0]) / (M.rise[1] - M.rise[0]));
  const down = soft((u - M.land[0]) / (M.land[1] - M.land[0]));
  k.air = M.high * up * (1 - down);
  if (held && alive(held) && !a.hurled) {
    held.x = Math.max(held.x1 ?? -Infinity, Math.min(held.x2 ?? Infinity, k.x + dir * 14));
    held.air = Math.max(4, k.air - 4);
    held.airV = 0;
    held.knockVx = 0;
    held.stagger = Math.max(held.stagger ?? 0, 0.3);
  }
  if (u >= M.hurl && !a.hurled) {
    a.hurled = true;
    a.dropFrom = held ? held.air : 0;
    world.fx.push({ kind: 'tengufeatherburst', x: k.x, y: k.y - k.air - 20, dir, t: 0, dur: 0.8 });
  }
  if (held && alive(held) && a.hurled && !a.slammed) {
    const s = Math.min(1, (u - M.hurl) / (M.slam - M.hurl));
    held.air = a.dropFrom * (1 - s * s);
    held.airV = 0;
  }
  if (u >= M.slam && !a.slammed) {
    a.slammed = true;
    if (held && alive(held)) {
      held.air = 0;
      dollHit(world, held, { pct: M.pct, x: k.x, knock: 80, launch: 160, stun: 0.6, stop: 0.12, shake: 6, big: true, burst: 'tenguhit', gauge: 3, key: 'tengu' });
      world.fx.push({ kind: 'crack', school: 'storm', x: held.x, y: held.y, w: 100, t: 0, dur: 0.8, seed: Math.random() });
      world.juice.push({ type: 'dust', x: held.x, y: held.y, count: 10 });
      for (const o of world.mobs) if (o !== held && alive(o) && Math.abs(o.x - held.x) < 50 && Math.abs(o.y - held.y) < 50) dollHit(world, o, { pct: M.pct * 0.4, x: held.x, knock: 140, launch: 120, burst: 'tenguhit', gauge: 1, key: 'tengu' });
      a.landed = 1;
    }
    world.juice.push({ type: 'shake', mag: held ? 6 : 2, dur: 0.35 });
  }
}

// ---------- His brain ----------
// The monster nearest the Onmyoji, and a spot just short of it; with nothing to fight, at the
// Onmyoji's shoulder.
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
    const side = Math.sign(k.x - m.x) || 1;
    br.goal = { x: Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, m.x + side * CLOSE)), surface: ms };
    return;
  }
  br.target = null;
  const bs = surfaceBelow(nav, b.x, b.y);
  const surf = nav.surfaces[bs];
  if (!surf) return;
  let x = b.x - b.facing * HOME;
  if (x < surf.x1 + 6 || x > surf.x2 - 6) x = b.x + b.facing * HOME;
  br.goal = { x: Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, x)), surface: bs, home: true };
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
    if (!br.path) return NONE;
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

// Stuck, fallen off the map, or left very far behind: he vanishes in a whirl of black feathers and
// steps out of another beside the Onmyoji.
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
  if (off || Math.hypot(b.x - body.x, b.y - body.y) > 620) {
    world.fx.push({ kind: 'tenguvanish', x: body.x, y: body.y, t: 0, dur: 0.7 });
    Object.assign(body, { x: b.x - b.facing * HOME, y: b.y, vx: 0, vy: 0, rope: null, onGround: b.onGround, surface: b.surface, facing: b.facing });
    sync(k);
    world.fx.push({ kind: 'tenguvanish', x: body.x, y: body.y, t: 0, dur: 0.7 });
    br.path = null;
  }
}

// What he does next: Spirited Away now and then on a monster he can reach; Tengu Wind or Tengu
// Stones when they're ready; otherwise his sword when he's close, the fan and his feathers when
// he isn't, never the same twice running.
function fight(world, k) {
  const m = k.brain.target;
  if (!alive(m) || !k.body.onGround || k.act || world.now < k.next) return;
  const dx = Math.abs(m.x - k.x);
  const dy = Math.abs(m.y - k.y);
  if (dx > TENGU_MOVES.stones.range || dy > 110) return;
  const start = (kind) => {
    k.last = kind;
    k.body.facing = Math.sign(m.x - k.x) || k.body.facing;
    k.body.vx = 0;
    sync(k);
    k.act = { kind, t0: world.now, dur: TENGU_MOVES[kind].dur, done: 0, mob: m };
  };
  const level = dy < 40;
  if (level && !m.def.boss && dx < TENGU_MOVES.spirited.reach && world.now >= k.spiritedAt && Math.random() < 0.35) {
    k.spiritedAt = world.now + TENGU_MOVES.spirited.cool;
    return start('spirited');
  }
  if (world.now >= k.windAt && dx < TENGU_MOVES.whirlwind.range && Math.random() < 0.4) {
    k.windAt = world.now + TENGU_MOVES.whirlwind.cool;
    return start('whirlwind');
  }
  if (world.now >= k.stonesAt && Math.random() < 0.35) {
    k.stonesAt = world.now + TENGU_MOVES.stones.cool;
    return start('stones');
  }
  const close = level && dx < 70;
  const pool = (close ? ['iai', 'kurama', 'kurama', 'gust', 'feathers'] : level && dx < 190 ? ['gust', 'feathers', 'iai'] : ['feathers']).filter((n) => n !== k.last);
  start(pool[Math.floor(Math.random() * pool.length)] ?? 'feathers');
}
