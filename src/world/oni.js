// The Onmyoji's oni (see data/jobs.js and docs/design/spirit-mage-paths.md): the first of her yokai
// troupe, a cute and badass oni girl with red skin, crimson horns and a huge spiked club, bored by
// everything. Always out, she fights on her own: she strolls after the Onmyoji with the club on her
// shoulder, lazily, and wades into whatever comes near. She has a body of her own (physics.js) and
// walks the map (nav.js) on her own feet.
// Her moves, built from how oni fight (folklore's kanabo-swinging brutes, and the games that do
// oni well: heavy swing chains that hit behind them too and end in a finisher, grabs and throws,
// charges, stomps, whirling clubs, roars; render/oni.js draws them):
//   Kesagiri      a chain of three heavy diagonal swings, stepping in with each (down, back up,
//                 down again), wide enough to catch what's behind her too, and then a huge
//                 overhead finisher that cracks the ground
//   Grab & Slam   she plants the club, grabs a monster in her fist, hoists it over her head and
//                 slams it into the ground in front of her
//   Stomp         her knee up high and a stomp that sends a shock out both ways, throwing
//                 everything round her into the air
//   Charge        a burst of red aura, then she barrels forward shoulder-first, trampling
//                 everything in her way (how she closes in on a monster out of reach)
//   Whirl         the club whirled round and round over her head, battering everything round her,
//                 then brought down
//   Roar          she throws her head back and roars: everything round her is blasted back and
//                 dazed, and for a while she fights faster (her fury)
//   Club Toss     she hurls the club like a boomerang: it spins out low, battering everything it
//                 passes, and comes back round to her hand (how she reaches a monster further off)
// Each plays on a heavy clock (it hangs before its big blow, freezes on the impact, drags through
// the follow-through). When a move hits nothing at all she sulks a moment; when what she was hitting
// goes down, a smug smirk.
// Her hits are spells of the Onmyoji's own magic attack (melee.js dollHit).

import { dollHit, hasSpirit, troupeRest } from './melee.js';
import { comboStep } from './onmyoji.js';
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
// Her moves. For a chain, `pct`, `knock`, `launch`, `shake` and `around` can be lists, one per blow.
export const ONI_MOVES = {
  kesa: { dur: 2.3, hits: [0.17, 0.34, 0.51, 0.78], reach: 112, pct: [70, 70, 80, 175], knock: [60, 60, 80, 260], launch: [0, 0, 0, 160], stun: [0, 0, 0, 0.4], targets: 4, around: [true, true, true, false], shake: [1.5, 1.5, 2, 5], crack: [false, false, false, true], step: 7 },
  grab: { dur: 1.9, catch: 0.2, lift: [0.2, 0.55], slam: 0.64, reach: 82, pct: 190, stun: 0.8, shake: 6 },
  stomp: { dur: 1.25, hits: [0.5], reach: 135, pct: 80, knock: 120, launch: 230, stun: 0.6, targets: 8, around: true, shake: 6, crack: true },
  charge: { dur: 1.35, run: [0.3, 0.66], dist: 210, pct: 110, knock: 280, launch: 220, shake: 3, every: 5, min: 130, far: 260 },
  whirl: { dur: 1.7, hits: [0.3, 0.42, 0.54, 0.72], reach: 105, pct: [55, 55, 55, 125], knock: [40, 40, 40, 240], launch: [0, 0, 0, 140], targets: 6, around: true, shake: [1, 1, 1, 4], crack: [false, false, false, true] },
  toss: { dur: 1.9, light: true, out: 0.26, back: 0.74, dist: 170, pct: 80, knock: 90, min: 70, far: 200 },
  roar: { dur: 1.5, hits: [0.42], reach: 170, pct: 40, knock: 220, stun: 0.6, targets: 10, around: true, shake: 4, every: 12, fury: 6 },
};
const at = (v, i) => (Array.isArray(v) ? v[i] : v);
// The heavy clock (see world/kitsune.js for the same idea in the guardian's): it hangs before the
// last (biggest) blow of a move; in her fury it all runs faster.
const HEAVY = { hang: [0.16, 0.035], hangRate: 0.35, snap: 1.8, drag: 0.16, dragRate: 0.5, freeze: 0.07, lastFreeze: 0.24, recover: 0.8 };
function heavyRate(M, u) {
  // (A throw has no big blow to hang on.)
  if (M.light) return 1;
  const h = M.hits ? M.hits[M.hits.length - 1] : M.slam ?? 0.5;
  if (u >= h - HEAVY.hang[0] && u < h - HEAVY.hang[1]) return HEAVY.hangRate;
  if (u >= h - HEAVY.hang[1] && u < h) return HEAVY.snap;
  if (u >= h && u < h + HEAVY.drag) return HEAVY.dragRate;
  return u > h ? HEAVY.recover : 1;
}
// The rest she takes between moves (s); half that in her fury.
const REST = [0.45, 0.9];
const MOOD = { sulk: 1.6, smug: 1.3 };
const NONE = { left: false, right: false, up: false, down: false, jump: false };
const alive = (m) => m && m.hp > 0;

export const hasOni = (char) => jobChain(char.job).includes('onmyoji');

// The oni, made when she's first needed (null for anyone but an Onmyoji). On a new map she arrives
// beside the Onmyoji.
export function oniOf(world) {
  if (!hasOni(world.char) || !hasSpirit(world.char)) return (world.oni = null);
  const b = world.body;
  world.oni ??= { act: null, next: 0, last: null, map: null, mood: null, chargeAt: 0, roarAt: 4, furyUntil: 0 };
  const k = world.oni;
  if (k.map !== world.map.id || !k.body) {
    k.map = world.map.id;
    k.body = createBody(b.x + b.facing * HOME, b.y);
    k.body.onGround = b.onGround;
    k.body.facing = b.facing;
    k.brain = { think: 0, target: null, goal: null, path: null, pathTo: -1, replanAt: 0, stall: 0, lastX: k.body.x, run: false };
    k.act = null;
    // (Whatever she was in the middle of stays on the last map.)
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

export function tickOni(world, dt) {
  const k = oniOf(world);
  if (!k) return;
  const { now } = world;
  const had = k.brain.target;
  if (had && had.hp <= 0 && k.mood?.kind !== 'sulk') k.mood = { kind: 'smug', until: now + MOOD.smug };
  if (k.mood && now >= k.mood.until) k.mood = null;
  k.fury = now < k.furyUntil;
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

// Plays out a move on its heavy clock.
function act(world, k, dt) {
  const a = k.act;
  // (Her part in the Onmyoji's Troupe Combo: world/onmyoji.js plays it.)
  if (a.kind === 'combo') return comboStep(world, k);
  const M = ONI_MOVES[a.kind];
  stepBody(k.body, world.map, NONE, dt, { speed: 0, jump: 0 });
  a.clock ??= 0;
  // (Her clock eases from one pace to the next, never jumps, so the motion stays smooth: fast
  // into a snap, but no hitch where the pace changes.)
  const pace = heavyRate(M, a.clock / a.dur) * (k.fury ? 1.3 : 1);
  a.rate = a.rate == null ? pace : a.rate + (pace - a.rate) * Math.min(1, dt * 22);
  if (a.freeze > 0) a.freeze -= dt;
  else a.clock += dt * a.rate;
  const u = a.clock / a.dur;
  if (a.kind === 'grab') grabbing(world, k, a, M, u);
  else if (a.kind === 'toss') tossing(world, k, a, M, u);
  else if (a.kind === 'charge') charging(world, k, a, M, u, dt);
  else {
    while (a.done < M.hits.length && u >= M.hits[a.done]) {
      const i = a.done++;
      const last = a.done === M.hits.length;
      // A chain steps her in with every blow.
      if (M.step) stepIn(world, k, M.step);
      a.landed = (a.landed ?? 0) + strike(world, k, a.kind, M, i, last);
      a.freeze = last ? HEAVY.lastFreeze : HEAVY.freeze;
      if (a.kind === 'roar') {
        k.furyUntil = world.now + M.fury;
        world.fx.push({ kind: 'oniroar', x: k.x, y: k.y, dir: k.dir, t: 0, dur: 0.9 });
      }
    }
  }
  sync(k);
  if (u >= 1) {
    k.act = null;
    // A move that hit nothing at all: she sulks.
    if (!a.landed && a.kind !== 'roar') k.mood = { kind: 'sulk', until: world.now + MOOD.sulk };
    k.next = world.now + (REST[0] + Math.random() * (REST[1] - REST[0])) * (k.fury ? 0.5 : 1) * troupeRest(world) + (a.landed || a.kind === 'roar' ? 0 : 0.8);
  }
}
// A step forward along her ledge.
function stepIn(world, k, d) {
  const nav = navOf(world.map);
  const surf = nav.surfaces[surfaceOf(nav, k.body)];
  let x = k.body.x + k.dir * d;
  if (surf) x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, x));
  k.body.x = x;
  if (surf) k.body.y = surf.yAt(x);
}

// One blow (`i` of the move's): everything in the club's reach in front of her (or all round
// her). Returns how many it hit.
function strike(world, k, kind, M, i, last) {
  const dir = k.dir;
  const around = at(M.around, i);
  const reach = M.reach;
  if (kind !== 'roar') world.fx.push({ kind: 'arc', snd: 'rage', x: k.x + dir * 14, y: k.y - 36, dir, r: reach * 0.66, start: around ? -100 : -30, sweep: around ? 300 : 180, thick: last ? 12 : 8, big: last, color: '#ff5a3a', t: 0, dur: 0.3 });
  const hit = world.mobs
    .filter((m) => alive(m) && Math.abs(m.y - k.y) < 90 && (around || (m.x - k.x) * dir > -14) && Math.abs(m.x - k.x) < reach + m.def.w / 2)
    .sort((m, o) => Math.abs(m.x - k.x) - Math.abs(o.x - k.x))
    .slice(0, M.targets);
  hit.forEach((m, j) => dollHit(world, m, { pct: at(M.pct, i), x: k.x, knock: at(M.knock, i), launch: at(M.launch, i) ?? 0, stun: at(M.stun, i), stop: j ? 0 : last ? 0.12 : 0.05, shake: !j ? at(M.shake, i) * 1.3 : 0, big: last && !j, burst: 'onihit', gauge: 2, key: 'oni' }));
  world.juice.push({ type: 'shake', mag: at(M.shake, i) * (hit.length ? 1.4 : 0.5), dur: last ? 0.3 : 0.18 });
  world.juice.push({ type: 'dust', x: k.x + dir * reach * 0.5, y: k.y, count: last ? 9 : 4 });
  // Where the club comes down: a burst of light and, on a big blow, rubble and embers flying.
  if (kind !== 'roar') impact(world, around && !at(M.crack, i) ? k.x : k.x + dir * reach * 0.62, k.y, dir, last || at(M.crack, i));
  if (at(M.crack, i) || (kind === 'stomp')) world.fx.push({ kind: 'crack', school: 'rage', x: k.x + (around ? 0 : dir * reach * 0.6), y: k.y, w: around ? reach * 2 : 120, t: 0, dur: 0.8, seed: Math.random() });
  if (kind === 'stomp') world.fx.push({ kind: 'onipound', x: k.x, y: k.y, r: reach, t: 0, dur: 0.7 });
  return hit.length;
}

// The punch of a blow landing: a starburst where the club strikes, and on a big blow the ground
// bursting (rubble, embers), a red flash and a ring.
function impact(world, x, y, dir, big) {
  world.juice.push({ type: 'oniimpact', x, y: y - 8, dir, big });
  if (big) world.juice.push({ type: 'slam', school: 'rage', x, y, range: 80 });
  world.fx.push({ kind: 'oniimpact', x, y, dir, big, t: 0, dur: big ? 0.5 : 0.3 });
}

// Grab & Slam: she catches the nearest monster in front in her fist (never a boss), hoists it up
// over her head, and slams it down into the ground in front of her (and whatever's under it).
function grabbing(world, k, a, M, u) {
  const dir = k.dir;
  if (!a.caught && u >= M.catch) {
    a.caught = true;
    a.held = world.mobs
      .filter((m) => alive(m) && !m.def.boss && Math.abs(m.y - k.y) < 50 && (m.x - k.x) * dir > -10 && Math.abs(m.x - k.x) < M.reach + m.def.w / 2)
      .sort((m, o) => Math.abs(m.x - k.x) - Math.abs(o.x - k.x))[0] ?? null;
    if (a.held) world.juice.push({ type: 'shake', mag: 1.5, dur: 0.12 });
  }
  const m = a.held;
  if (m && alive(m) && !a.slammed) {
    // Held in her fist: carried up from in front of her to over her head.
    const l = Math.max(0, Math.min(1, (u - M.lift[0]) / (M.lift[1] - M.lift[0])));
    const e = l * l * (3 - 2 * l);
    // (Held up and forward, clear of her head.)
    m.x = Math.max(m.x1 ?? -Infinity, Math.min(m.x2 ?? Infinity, k.x + dir * (30 + 4 * e)));
    m.air = 10 + 62 * e;
    m.airV = 0;
    m.knockVx = 0;
    m.stagger = Math.max(m.stagger ?? 0, 0.3);
  }
  if (!a.slammed && u >= M.slam) {
    a.slammed = true;
    const x = k.x + dir * 36;
    world.fx.push({ kind: 'crack', school: 'rage', x, y: k.y, w: 110, t: 0, dur: 0.8, seed: Math.random() });
    world.fx.push({ kind: 'onipound', x, y: k.y, r: 70, t: 0, dur: 0.6 });
    world.juice.push({ type: 'shake', mag: M.shake * 1.4, dur: 0.35 });
    world.juice.push({ type: 'dust', x, y: k.y, count: 10 });
    impact(world, x, k.y, dir, true);
    if (m && alive(m)) {
      m.x = Math.max(m.x1 ?? -Infinity, Math.min(m.x2 ?? Infinity, x));
      m.air = 26;
      m.airV = -760;
      dollHit(world, m, { pct: M.pct, x: k.x, knock: 60, stun: M.stun, stop: 0.12, shake: M.shake, big: true, burst: 'onihit', gauge: 3, key: 'oni' });
      a.landed = 1;
      // What it lands on gets hit too.
      for (const o of world.mobs) if (o !== m && alive(o) && Math.abs(o.x - x) < 50 && Math.abs(o.y - k.y) < 50) dollHit(world, o, { pct: M.pct * 0.5, x, knock: 160, launch: 140, burst: 'onihit', gauge: 1, key: 'oni' });
    }
    a.freeze = HEAVY.lastFreeze;
  }
}

// Club Toss: the club out and back along her ledge, spinning (render/oni.js draws it there), hitting
// each monster it passes once on the way out and once on the way back; she catches it.
export const tossAt = (M, u) => (u < M.out || u > M.back ? 0 : Math.sin(Math.PI * ((u - M.out) / (M.back - M.out))));
function tossing(world, k, a, M, u) {
  if (u < M.out || u > M.back) return;
  if (!a.thrown) {
    a.thrown = true;
    world.juice.push({ type: 'shake', mag: 1.5, dur: 0.15 });
    world.fx.push({ kind: 'arc', snd: 'rage', x: k.x + k.dir * 14, y: k.y - 36, dir: k.dir, r: 40, start: -80, sweep: 150, thick: 7, color: '#ff5a3a', t: 0, dur: 0.25 });
  }
  const s = (u - M.out) / (M.back - M.out);
  const x = k.x + k.dir * M.dist * tossAt(M, u);
  const way = s < 0.5 ? 'out' : 'back';
  a.hitSet ??= { out: new Set(), back: new Set() };
  for (const m of world.mobs) {
    if (!alive(m) || a.hitSet[way].has(m) || Math.abs(m.y - k.y) > 60 || Math.abs(m.x - x) > 18 + m.def.w / 2) continue;
    a.hitSet[way].add(m);
    a.landed = (a.landed ?? 0) + 1;
    dollHit(world, m, { pct: M.pct, x: x - k.dir * (way === 'out' ? 20 : -20), knock: M.knock, stop: 0.04, shake: 2, burst: 'onihit', gauge: 2, key: 'oni' });
    impact(world, m.x, k.y, k.dir, false);
  }
}

// Charge: red aura, then she barrels forward shoulder-first along her ledge, trampling every
// monster in her way (each once), and skids to a stop.
function charging(world, k, a, M, u, dt) {
  const dir = k.dir;
  if (!a.aura && u >= 0.05) {
    a.aura = true;
    world.fx.push({ kind: 'oniaura', x: k.x, y: k.y, dir, t: 0, dur: 0.6 });
  }
  if (u < M.run[0] || u > M.run[1]) return;
  a.hitSet ??= new Set();
  const speed = M.dist / ((M.run[1] - M.run[0]) * M.dur);
  const nav = navOf(world.map);
  const surf = nav.surfaces[surfaceOf(nav, k.body)];
  let x = k.body.x + dir * speed * dt * (k.fury ? 1.3 : 1);
  if (surf) x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, x));
  k.body.x = x;
  if (surf) k.body.y = surf.yAt(x);
  if (Math.random() < dt * 14) world.juice.push({ type: 'dust', x: x - dir * 10, y: k.body.y, count: 2, dir: -dir });
  for (const m of world.mobs) {
    if (!alive(m) || a.hitSet.has(m) || Math.abs(m.y - k.body.y) > 60 || Math.abs(m.x - x) > 22 + m.def.w / 2) continue;
    a.hitSet.add(m);
    a.landed = (a.landed ?? 0) + 1;
    dollHit(world, m, { pct: M.pct, x: x - dir * 30, knock: M.knock, launch: M.launch, stop: 0.08, shake: M.shake * 1.3, big: true, burst: 'onihit', gauge: 2, key: 'oni' });
    impact(world, m.x, k.body.y, dir, true);
  }
}

// Her brain: the monster nearest her within the Onmyoji's reach, and a spot just short of it; with
// nothing to fight, a stride ahead of the Onmyoji.
function think(world, k) {
  const br = k.brain;
  const nav = navOf(world.map);
  const b = world.body;
  const near = world.map.isTown ? [] : world.mobs.filter((m) => alive(m) && !(m.air > 60) && Math.abs(m.x - b.x) <= LEASH.x && Math.abs(m.y - b.y) <= LEASH.y);
  // (The tengu leads the troupe: what he's marked comes first.)
  const mark = world.tengu?.mark?.mob;
  const m = mark && near.includes(mark) ? mark : near.sort((p, o) => Math.hypot(p.x - k.x, p.y - k.y) - Math.hypot(o.x - k.x, o.y - k.y))[0];
  if (m) {
    br.target = m;
    const ms = surfaceBelow(nav, m.x, m.y);
    const surf = nav.surfaces[ms];
    if (!surf) return;
    const side = Math.sign(k.x - m.x) || 1;
    const x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, m.x + side * 60));
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

// What she does next: a Charge at a monster out of reach on her ledge; a Roar when they crowd her
// (now and then); otherwise one of her blows, never the same twice running, Whirl and Stomp more
// often when they crowd her.
function fight(world, k) {
  const m = k.brain.target;
  if (!alive(m) || !k.body.onGround || k.act || world.now < k.next) return;
  if (Math.abs(m.y - k.y) > 40) return;
  const dx = Math.abs(m.x - k.x);
  const C = ONI_MOVES.charge;
  const face = () => {
    k.body.facing = Math.sign(m.x - k.x) || k.body.facing;
    k.body.vx = 0;
    sync(k);
  };
  const start = (kind) => {
    k.last = kind;
    face();
    k.act = { kind, t0: world.now, dur: ONI_MOVES[kind].dur, done: 0 };
  };
  if (dx > C.min && dx < C.far && world.now >= k.chargeAt) {
    const nav = navOf(world.map);
    if (surfaceOf(nav, k.body) === surfaceBelow(nav, m.x, m.y)) {
      k.chargeAt = world.now + C.every;
      return start('charge');
    }
  }
  // A monster out of her reach: now and then she throws the club at it.
  const T = ONI_MOVES.toss;
  if (dx > T.min && dx < T.far && k.last !== 'toss' && Math.random() < 0.35) return start('toss');
  if (dx > ONI_MOVES.kesa.reach + m.def.w / 2 - 10) return;
  const crowd = world.mobs.filter((o) => alive(o) && Math.abs(o.x - k.x) < 120 && Math.abs(o.y - k.y) < 50).length;
  if (crowd >= 3 && world.now >= k.roarAt && !k.fury) {
    k.roarAt = world.now + ONI_MOVES.roar.every;
    return start('roar');
  }
  const pool = (crowd >= 3 ? ['whirl', 'whirl', 'stomp', 'stomp', 'kesa', 'grab'] : ['kesa', 'kesa', 'grab', 'stomp', 'whirl']).filter((n) => n !== k.last);
  start(pool[Math.floor(Math.random() * pool.length)]);
}
