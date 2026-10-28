// The Beastmaster's companion (see data/skills.js): Snow wolf, a small wolf girl in an oversized
// kimono who drags the Fang of the Wolf Queen, a greatsword far too big for her, wherever she
// goes. She'd rather not be here, but she's very good at this. She has a body of her own
// (physics.js) and finds her own way round the map (nav.js: walking, jumping up to ledges,
// dropping through them, climbing ropes), picks her own fights, and only comes back to the
// Beastmaster when there's nothing left to cut. Her brain, every few tenths of a second: the best
// monster to go after (close by path, not already given up on, and first of all whatever is
// closing in on the Beastmaster), then a spot beside it on its own ledge; between swings she
// walks there. Close in she swings or slams the greatsword; further off (even a ledge above or
// below) she flicks a crescent of moonlight. The Beastmaster's skills also make her act
// (Fine, I'll Go; Moonfall; Lunar Howl; Moon Ward), and her Patience (the Bond gauge) running out
// makes her Fed Up: she hits harder and quicker, faster still with Queen's Awakening. Her hits
// land the way the Beastmaster's shots do (melee.js's beastHit). render/snowwolf.js draws her.

import { hasBond, wild, beastHit } from './melee.js';
import { procOf } from './combat.js';
import { createBody, stepBody } from './physics.js';
import { navOf, findPath, followPath, surfaceBelow, surfaceOf } from './nav.js';

const HOME = 40; // where she waits beside the Beastmaster when there's nothing to fight
const BOLT = 700; // px/s, a crescent of moonlight in flight
const MELEE = 64; // how close she gets before she swings or slams
// Her cleaves hit everything in reach of the greatsword: a spin cuts all round her (CLEAVE), a
// slam crashes down ahead of her (SLAM_AT out, SLAM wide either side of that).
const CLEAVE = 84;
const SLAM_AT = 44;
const SLAM = 64;
const FLICK = 300; // reach of a flicked crescent
const THINK = 0.25; // seconds between decisions
// How often she attacks (seconds) and how hard (% of a shot), calm and Fed Up.
const EVERY = 1.5;
const FED_EVERY = 1.0;
const PCT = 70;
const FED_PCT = 130;
export const WILD_POWER = 1.4;

const NONE = { left: false, right: false, up: false, down: false, jump: false };
const ease = (p) => p * p * (3 - 2 * p);
const alive = (m) => m && m.hp > 0;

// Snow wolf, made when she's first needed (null for anyone but a Beastmaster). She arrives on a
// new map right beside the Beastmaster.
export function petsOf(world) {
  if (!hasBond(world.char)) return (world.pets = null);
  const b = world.body;
  world.pets ??= { snow: { x: b.x, y: b.y, dir: b.facing, act: null, next: 0, moving: false, vx: 0, map: null } };
  const s = world.pets.snow;
  if (s.map !== world.map.id || !s.body) {
    s.map = world.map.id;
    s.body = createBody(b.x - b.facing * HOME, b.y);
    s.body.onGround = b.onGround;
    s.body.facing = b.facing;
    s.brain = { think: 0, target: null, goal: null, path: null, pathTo: -1, replanAt: 0, skip: new Map(), stall: 0, lastX: s.body.x, lost: 0 };
    s.act = null;
    sync(s);
  }
  return world.pets;
}
const snowOf = (world) => petsOf(world)?.snow;
const sync = (s) => {
  s.x = s.body.x;
  s.y = s.body.y;
  s.dir = s.body.facing;
};
// She takes a new order only when she isn't already carrying one out (an order cuts short a fight
// she picked herself).
const busy = (s) => Boolean(s.act) && !s.act.own;
const sameLedge = (s, m) => s.body.onGround && Math.abs(m.y - s.body.y) < 24;

// Hits every monster within `r` of x (only those in front of her, when `ahead`).
function hitAround(world, s, x, r, f, ahead = false) {
  for (const m of world.mobs) {
    if (!alive(m) || Math.abs(m.x - x) > r || Math.abs(m.y - s.y) > 70) continue;
    if (ahead && Math.sign(m.x - s.x) === -s.dir && Math.abs(m.x - s.x) > 16) continue;
    beastHit(world, m, { x, burst: 'moonhit', ...f });
  }
}

// A crescent of moonlight flicked at `m`: it flies, and lands a beat later (the hit waits for it).
function bolt(world, s, m, pct, gauge) {
  const dur = Math.max(0.08, Math.hypot(m.x - s.x, m.y - s.y) / BOLT);
  world.fx.push({ kind: 'moonbolt', x: s.x + s.dir * 10, y: s.y - 14, tx: m.x, ty: m.y - m.def.h / 2, dir: Math.sign(m.x - s.x) || s.dir, t: 0, dur });
  (world.bolts ??= []).push({ mob: m, at: world.now + dur, pct, x: s.x, gauge });
}

// ---------- What the Beastmaster's skills make her do ----------

// Fine, I'll Go: on its ledge and close enough, she drags herself over to `m` and spins the
// greatsword round in a full circle; anywhere else, she flicks a great crescent at it instead.
export function sendSnow(world, m, pct) {
  const s = snowOf(world);
  if (!s || busy(s) || !alive(m)) return false;
  s.body.facing = Math.sign(m.x - s.x) || s.body.facing;
  sync(s);
  if (sameLedge(s, m) && Math.abs(m.x - s.x) < 320) {
    s.act = { kind: 'go', phase: 'dash', mob: m, from: s.x, t0: world.now, dur: 0.22 + Math.min(0.28, Math.abs(m.x - s.x) / 1000), pct };
  } else {
    s.act = { kind: 'flick', t0: world.now, dur: 0.35, mob: m, pct, gauge: 5 };
  }
  return true;
}

// Moonfall: she plants the sword with a sigh and a beam of moonlight crashes down on `m`, however
// far off it is.
export function moonfall(world, m, pct) {
  const s = snowOf(world);
  if (!s || busy(s) || !alive(m)) return false;
  s.body.facing = Math.sign(m.x - s.x) || s.body.facing;
  s.act = { kind: 'cast', mob: m, at: [m.x, m.y], t0: world.now, dur: 0.6, pct };
  return true;
}

// Lunar Howl: a grudging howl, a pale moon rising behind her; everything close round her is
// knocked away and stunned.
export function howl(world, p) {
  const s = snowOf(world);
  if (!s || busy(s) || !s.body.onGround) return false;
  s.act = { kind: 'howl', t0: world.now, dur: 0.8, p };
  world.fx.push({ kind: 'lunarhowl', x: s.x, y: s.y, dir: s.dir, r: p.r, t: 0, dur: 0.8 });
  return true;
}

// Moon Ward: wherever she is, she's there in a flash of moonlight, plants the greatsword between
// the Beastmaster and a hit from `fromX` behind a crescent shield, and flicks a crescent back at
// the nearest monster that way.
export function guard(world, fromX, p) {
  const s = snowOf(world);
  if (!s || busy(s)) return false;
  const b = world.body;
  const side = Math.sign((fromX ?? b.x + b.facing) - b.x) || b.facing;
  if (Math.hypot(s.x - b.x, s.y - b.y) > 40) world.fx.push({ kind: 'moonhit', x: s.x, y: s.y, h: 30, t: 0, dur: 0.3 });
  Object.assign(s.body, { x: b.x + side * 18, y: b.y, vx: 0, vy: 0, rope: null, onGround: b.onGround, surface: b.surface, facing: side });
  sync(s);
  s.brain.path = null;
  s.act = { kind: 'ward', t0: world.now, dur: 0.7 };
  world.fx.push({ kind: 'moonward', x: s.x + side * 6, y: s.y, dir: side, t: 0, dur: 0.6 });
  const m = world.mobs.filter((o) => alive(o) && Math.sign(o.x - b.x) === side && Math.abs(o.x - b.x) < 200 && Math.abs(o.y - b.y) < 80).sort((a, o) => Math.abs(a.x - b.x) - Math.abs(o.x - b.x))[0];
  if (m) bolt(world, s, m, p.pct, 5);
  return true;
}

// ---------- Every tick ----------

export function tickPets(world, dt) {
  const pets = petsOf(world);
  if (!pets) return;
  const s = pets.snow;
  const fed = wild(world);
  const awake = fed ? procOf(world.char, 'alpha') : null;
  const power = fed ? WILD_POWER : 1;
  // Crescents in flight land.
  if (world.bolts?.length) {
    world.bolts = world.bolts.filter((o) => {
      if (world.now < o.at) return true;
      if (alive(o.mob)) beastHit(world, o.mob, { pct: o.pct, x: o.x, knock: 120, stop: 0.03, burst: 'moonhit', gauge: o.gauge });
      return false;
    });
  }
  const br = s.brain;
  if (s.act) {
    act(world, s, dt, power);
  } else {
    br.think -= dt;
    if (br.think <= 0) {
      br.think = THINK;
      think(world, s);
    }
    const intent = steer(world, s);
    stepBody(s.body, world.map, intent, dt, { speed: br.hurry ? 150 : 100, jump: 100 });
    stuck(world, s, intent, dt);
    sync(s);
    if (!world.dead) attack(world, s, fed, awake);
  }
  s.vx = s.body.vx;
  s.moving = s.body.onGround && Math.abs(s.body.vx) > 8;
}

// Plays out what she's in the middle of (rooted where she stands, but still falling if she's in
// the air).
function act(world, s, dt, power) {
  const a = s.act;
  const t = world.now - a.t0;
  if (a.kind === 'go' && a.phase === 'dash') {
    // Hauling herself and the sword over to it along its ledge, the blade skidding behind her.
    const p = Math.min(1, t / a.dur);
    const surf = s.body.surface;
    const tx = alive(a.mob) ? a.mob.x - Math.sign(a.mob.x - a.from) * 18 : a.from;
    let nx = a.from + (tx - a.from) * ease(p);
    if (surf) nx = Math.max(surf.x1 + 4, Math.min(surf.x2 - 4, nx));
    s.body.vx = (nx - s.body.x) / Math.max(dt, 1e-3);
    s.body.x = nx;
    if (surf?.yAt) s.body.y = surf.yAt(nx);
    sync(s);
    if (p >= 1) {
      a.phase = 'spin';
      a.t0 = world.now;
      s.body.vx = 0;
      world.fx.push({ kind: 'moonslash', x: s.x, y: s.y, dir: s.dir, t: 0, dur: 0.4 });
    }
    return;
  }
  stepBody(s.body, world.map, NONE, dt, { speed: 0, jump: 0 });
  sync(s);
  if (a.kind === 'go') {
    if (!a.hit && t >= 0.14) {
      a.hit = true;
      hitAround(world, s, s.x, CLEAVE, { pct: a.pct * power, knock: 200, launch: 160, stop: 0.05, shake: 2, big: true });
    }
    if (t >= 0.4) s.act = null;
  } else if (a.kind === 'cast') {
    if (!a.fx && t >= 0.15) {
      a.fx = true;
      if (alive(a.mob)) a.at = [a.mob.x, a.mob.y];
      world.fx.push({ kind: 'moonfall', x: a.at[0], y: a.at[1], t: 0, dur: 0.5 });
    }
    if (!a.hit && t >= 0.36) {
      a.hit = true;
      for (const m of world.mobs) {
        if (!alive(m) || Math.abs(m.x - a.at[0]) > 34 || Math.abs(m.y - a.at[1]) > 60) continue;
        beastHit(world, m, { pct: a.pct * power, x: a.at[0], knock: 60, launch: 220, stop: 0.04, shake: 2, big: true, burst: 'moonhit' });
      }
    }
    if (t >= a.dur) s.act = null;
  } else if (a.kind === 'howl') {
    if (!a.hit && t >= 0.2) {
      a.hit = true;
      hitAround(world, s, s.x, a.p.r, { pct: a.p.pct * power, knock: 240, launch: 120, stun: a.p.stun, stop: 0.05, shake: 2 });
      world.juice.push({ type: 'shake', mag: 2, dur: 0.2 });
    }
    if (t >= a.dur) s.act = null;
  } else if (a.kind === 'ward') {
    if (t >= a.dur) s.act = null;
  } else if (a.kind === 'swing' || a.kind === 'slam') {
    if (!a.hit && t >= a.hitAt) {
      a.hit = true;
      const slam = a.kind === 'slam';
      world.fx.push({ kind: slam ? 'moonslam' : 'moonslash', x: slam ? s.x + s.dir * SLAM_AT : s.x, y: s.y, dir: s.dir, t: 0, dur: 0.45 });
      hitAround(world, s, slam ? s.x + s.dir * SLAM_AT : s.x, slam ? SLAM : CLEAVE, { pct: a.pct, knock: slam ? 90 : 200, launch: slam ? 300 : 120, stop: slam ? 0.07 : 0.04, shake: slam ? 3 : 1, big: slam, gauge: a.gauge }, slam);
      // Queen's Awakening: every swing throws a crescent at the farthest monster in reach too.
      if (a.awake) {
        const far = world.mobs.filter((m) => alive(m) && Math.sign(m.x - s.x) === s.dir && Math.abs(m.x - s.x) < FLICK && Math.abs(m.y - s.y) < 120).sort((m, o) => Math.abs(o.x - s.x) - Math.abs(m.x - s.x))[0];
        if (far) bolt(world, s, far, a.pct * 0.6, a.gauge);
      }
    }
    if (t >= a.dur) s.act = null;
  } else if (a.kind === 'flick') {
    if (!a.hit && t >= 0.1) {
      a.hit = true;
      if (alive(a.mob)) bolt(world, s, a.mob, a.pct * (a.gauge === 5 ? power : 1), a.gauge);
    }
    if (t >= a.dur) s.act = null;
  }
}

// ---------- Her brain ----------

// Picks what to fight and where to stand for it, or, with nothing to fight, a spot beside the
// Beastmaster. Monsters are weighed by how far she'd have to go to reach them (ledges climbed and
// dropped count extra), how close they are to the Beastmaster (those closing in on her come first),
// how hurt they are (finish what's started), and she sticks with the one she's on unless another is
// clearly better. One she couldn't find a way to is left alone for a while.
function think(world, s) {
  const br = s.brain;
  const nav = navOf(world.map);
  const b = world.body;
  const here = surfaceOf(nav, s.body);
  for (const [m, until] of br.skip) if (world.now > until || !alive(m)) br.skip.delete(m);
  const near = world.map.isTown ? [] : world.mobs.filter((m) => alive(m) && !br.skip.has(m) && !(m.air > 60)).sort((m, o) => Math.hypot(m.x - s.x, m.y - s.y) - Math.hypot(o.x - s.x, o.y - s.y)).slice(0, 8);
  let best = null;
  let bestScore = Infinity;
  for (const m of near) {
    const ms = surfaceBelow(nav, m.x, m.y);
    const path = here >= 0 ? findPath(nav, here, s.x, ms, m.x) : [];
    if (path == null) {
      // No way there: unless a crescent reaches it from where she is, leave it be for a while.
      if (Math.abs(m.x - s.x) > FLICK || Math.abs(m.y - s.y) > 160) br.skip.set(m, world.now + 6);
      continue;
    }
    let score = Math.abs(m.x - s.x) + Math.abs(m.y - s.y) * 0.5 + path.length * 90;
    const threat = Math.hypot(m.x - b.x, m.y - b.y);
    if (threat < 220) score -= (220 - threat) * 1.2;
    score -= (1 - m.hp / (m.def.hp || m.hp)) * 80;
    if (m !== br.target) score += 60;
    if (score < bestScore) {
      bestScore = score;
      best = { m, ms };
    }
  }
  if (best) {
    const { m, ms } = best;
    br.target = m;
    br.hurry = false;
    const surf = nav.surfaces[ms];
    // Her side of it (the other side if that runs off the ledge), just inside a swing's reach.
    let side = Math.sign(s.x - m.x) || -m.facing || 1;
    let x = m.x + side * 36;
    if (x < surf.x1 + 6 || x > surf.x2 - 6) {
      side = -side;
      x = m.x + side * 36;
    }
    x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, x));
    br.goal = { x, surface: ms };
    return;
  }
  // Nothing to fight: back beside the Beastmaster (hurrying if she's far behind).
  br.target = null;
  const bs = surfaceBelow(nav, b.x, b.y);
  const surf = nav.surfaces[bs];
  let x = b.x - b.facing * HOME;
  if (x < surf.x1 + 6 || x > surf.x2 - 6) x = b.x + b.facing * HOME;
  x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, x));
  br.goal = { x, surface: bs, home: true };
  br.hurry = Math.hypot(b.x - s.x, b.y - s.y) > 200;
}

// Walks her to her goal along a path over ledges and ropes, planned again when the goal moves to
// another surface, she ends up somewhere unexpected, or every so often.
function steer(world, s) {
  const br = s.brain;
  const g = br.goal;
  const body = s.body;
  if (!g || g.surface < 0) return NONE;
  const nav = navOf(world.map);
  const here = surfaceOf(nav, body);
  if (here >= 0 && (!br.path || br.pathTo !== g.surface || world.now > br.replanAt)) {
    br.path = findPath(nav, here, body.x, g.surface, g.x);
    br.pathTo = g.surface;
    br.replanAt = world.now + 1;
    if (!br.path) {
      if (br.target) br.skip.set(br.target, world.now + 6);
      br.target = null;
      br.goal = null;
      return NONE;
    }
  }
  if (!br.path) return NONE;
  // On the goal's ledge: walk to the spot and stop (facing her target).
  if (!br.path.length && here === g.surface) {
    const intent = { ...NONE };
    if (Math.abs(g.x - body.x) > (g.home ? 10 : 4)) {
      intent.right = g.x > body.x;
      intent.left = g.x < body.x;
    } else if (br.target) body.facing = Math.sign(br.target.x - body.x) || body.facing;
    return intent;
  }
  const { intent, lost } = followPath(nav, body, br.path, g.x);
  if (lost) br.path = null;
  return intent;
}

// Walking into something and getting nowhere: plan again and give up on that monster for a
// while. Lost for good (fallen off the map, stuck a long while): back beside the Beastmaster in a
// flash of moonlight.
function stuck(world, s, intent, dt) {
  const br = s.brain;
  const body = s.body;
  const pushing = (intent.left || intent.right) && body.onGround;
  br.stall = pushing && Math.abs(body.x - br.lastX) < 0.3 ? br.stall + dt : 0;
  br.lastX = body.x;
  if (br.stall > 1.2) {
    br.path = null;
    if (br.target) br.skip.set(br.target, world.now + 6);
    br.target = null;
    br.goal = null;
    br.stall = 0;
  }
  const b = world.body;
  const off = body.y > world.map.height + 200 || body.x < -100 || body.x > world.map.width + 100;
  br.lost = br.goal?.home && Math.hypot(b.x - body.x, b.y - body.y) > 500 ? br.lost + dt : 0;
  if (off || br.lost > 4) {
    world.fx.push({ kind: 'moonhit', x: b.x - b.facing * HOME, y: b.y, h: 30, t: 0, dur: 0.3 });
    Object.assign(body, { x: b.x - b.facing * HOME, y: b.y, vx: 0, vy: 0, rope: null, onGround: b.onGround, surface: b.surface, facing: b.facing });
    br.path = null;
    br.lost = 0;
  }
}

// Swings, slams or flicks at her target once her last attack is done with. Close in on its ledge
// she swings or slams; further off, even a ledge above or below, she flicks a crescent.
function attack(world, s, fed, awake) {
  const m = s.brain.target;
  if (!alive(m) || world.now < s.next || !s.body.onGround) return;
  const dx = Math.abs(m.x - s.x);
  const dy = Math.abs(m.y - s.y);
  const pct = awake ? awake.pct : fed ? FED_PCT : PCT;
  const gauge = fed ? 0 : 2;
  const every = awake ? awake.every : fed ? FED_EVERY : EVERY;
  s.body.facing = Math.sign(m.x - s.x) || s.body.facing;
  sync(s);
  if (dx < MELEE + m.def.w / 2 && dy < 40) {
    const slam = Math.random() < 0.45;
    s.act = { kind: slam ? 'slam' : 'swing', own: true, t0: world.now, dur: slam ? 0.62 : 0.5, hitAt: slam ? 0.42 : 0.22, pct, gauge, awake: Boolean(awake) };
  } else if (dx < FLICK && dy < 160) {
    s.act = { kind: 'flick', own: true, t0: world.now, dur: 0.35, mob: m, pct: pct * 0.8, gauge };
  } else return;
  s.body.vx = 0;
  s.next = world.now + every;
}
