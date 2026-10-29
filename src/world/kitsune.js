// The Shrine Maiden's companion (see data/jobs.js): her kitsune shrine guardian (the player picked
// "Silver Moon": silver-white hair, a red-tipped fox tail, amber eyes, white shrine robes), a tall,
// serene fox woman with a naginata. She stands in front: of the Maiden when there's nothing to
// fight, and between the Maiden and whatever comes for her when there is. She has a body of her
// own (physics.js) and walks the map like Snow wolf does (nav.js), on her own feet, never floating;
// she never hurries: she walks, slow, and when the Maiden gets too far ahead she vanishes in fox fire
// and steps out of it again at the Maiden's side.
// Her own moves, with weight and reach (render/kitsune.js draws them):
//   Thrust        a long lunge, the blade driven straight through one monster
//   Sweep         the naginata swept wide and low in front of her, catching everything there
//   Rising Cut    a cut from low up over her head that throws it into the air
//   Twin Strike   two quick thrusts, high then low
//   Cleave        the naginata raised over her head and brought straight down, cracking the ground
//   Low Reap      a low scything cut along the ground that takes their feet and pops them up
//   Haft Strike   the butt driven into a face (dazing it), then the blade over the top and down
// her skills, each on its own cooldown:
//   Moonfall      she raises the naginata high and charges it: a vortex of fox fire drags every
//                 monster round her in to her feet, and she brings the blade down on all of them
//   Crescent Moon one huge diagonal cut, the blade trailing a great crescent of moonlight, through
//                 everything in front of her
//   Hundred Thrusts  a storm of thrusts at whatever's in front of her, ending in one that throws it
// (She has no range: everything she does is the naginata, at arm's length or pulled in to it.)
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
import { toriiCut } from './shrine.js';

// Where she stands when there's nothing to fight: a step in front of the Maiden (px; far enough
// that her big frame doesn't hide the Maiden's dance).
const HOME = 58;
// How far from the Maiden she'll go after a fight (across, and up or down): she never strays.
const LEASH = { x: 300, y: 150 };
// How fast she goes (% of a walk): she's big and in no hurry, so she only ever walks, slow and
// unbothered.
const WALK = 52;
// Her teleport: when the Maiden is more than `far` px away (or on another ledge `apart` seconds and
// more than `near` px off, or she's stuck), she dissolves in fox fire (`out` s) and steps out of it
// at the Maiden's side (`in` s).
export const TELE = { far: 230, near: 110, apart: 1.6, out: 0.55, in: 0.7 };
const THINK = 0.25; // seconds between decisions
// Her moves: how long each lasts (s), when its blows land (0-1), how far the blade reaches past
// her, how hard (% of a spell), knockback, launch, and how many it can catch.
export const KMOVES = {
  thrust: { dur: 1.0, hits: [0.46], reach: 120, pct: 110, knock: 130, targets: 3, shake: 2 },
  sweep: { dur: 1.25, hits: [0.52], reach: 105, pct: 95, knock: 190, targets: 5, shake: 3 },
  rising: { dur: 1.1, hits: [0.48], reach: 90, pct: 100, knock: 60, launch: 320, targets: 3, shake: 2.5 },
  twin: { dur: 1.15, hits: [0.32, 0.64], reach: 115, pct: 65, knock: 70, targets: 1, shake: 1.5 },
  cleave: { dur: 1.25, hits: [0.5], reach: 100, pct: 145, knock: 70, stun: 0.35, targets: 3, shake: 4, crack: true },
  reap: { dur: 1.15, hits: [0.47], reach: 130, pct: 90, knock: 50, launch: 200, targets: 5, shake: 2 },
  haft: { dur: 1.2, hits: [0.28, 0.6], reach: 105, pct: 70, knock: 110, stun: 0.4, targets: 2, shake: 2 },
};
// Her skills: how long each takes (s), its cooldown (`every`), how far it reaches, how hard.
//   Moonfall: the charge (from `charge[0]` of the move to `hit`) drags monsters within `r` in at up
//   to `pull` px/s, to `close` px in front of her; the blade comes down at `hit`, and everything
//   within `blast` is hit and thrown.
export const MOONFALL = { dur: 2.5, every: 14, r: 290, charge: 0.16, pull: 240, close: 34, hit: 0.75, blast: 120, pct: 230, launch: 300, knock: 160, stun: 0.6 };
//   Crescent Moon and Hundred Thrusts are blows like her moves (KMOVES), at the blade's reach; the
//   last of Hundred Thrusts' blows hits harder (`lastPct`) and throws (`lastKnock`, `launch`).
export const CRESCENT = { dur: 1.15, every: 7, hits: [0.42], reach: 150, pct: 175, knock: 210, targets: 6, shake: 4 };
export const FLURRY = { dur: 1.7, every: 9, hits: [0.2, 0.28, 0.36, 0.44, 0.52, 0.7], reach: 125, pct: 42, knock: 15, lastPct: 130, lastKnock: 220, launch: 180, targets: 2, shake: 1 };
// The rest she takes between moves (seconds, a random span): steady, never frantic.
const REST = [0.3, 0.55];
// Fox-Fire Call: how often (s), how close to the Maiden the monsters must be, how long it takes,
// when the fire goes out, how far it throws them, and how long they're dazed.
export const CALL = { every: 7, range: 160, dur: 1.0, hit: 0.5, push: 170, daze: 0.8, pct: 40 };
// Guard: the chance she takes a hit for the Maiden, how often she can, and how near she must be.
export const GUARD = { chance: 0.3, every: 2.5, near: 110 };
const BOW = 1.5; // how long her bow after a fight lasts
// Each move's smear: where its arc starts and how far it sweeps (degrees), and how thick it is.
const SMEAR = { crescent: [-40, 200, 12], flurry: [80, 24, 4], thrust: [72, 36, 5], sweep: [-70, 190, 9], rising: [120, -210, 8], twin: [70, 40, 4], cleave: [-20, 160, 10], reap: [150, -70, 7], haft: [-10, 150, 7] };
const NONE = { left: false, right: false, up: false, down: false, jump: false };
const alive = (m) => m && m.hp > 0;

export const hasGuardian = (char) => jobChain(char.job).includes('shrinemaiden');

// The guardian, made when she's first needed (null for anyone but a Shrine Maiden). On a new map
// she arrives beside the Maiden.
export function guardianOf(world) {
  if (!hasGuardian(world.char) || !hasSpirit(world.char)) return (world.guardian = null);
  const b = world.body;
  world.guardian ??= { act: null, next: 0, last: null, callAt: 0, guardAt: 0, map: null, skillAt: { moonfall: 6, crescent: 2, flurry: 4 } };
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
    // The Maiden too far ahead (or her stuck, or lost): she vanishes in fox fire.
    if (farOff(world, k, dt)) vanish(world, k);
    else {
      const intent = steer(world, k);
      stepBody(k.body, world.map, intent, dt, { speed: WALK, jump: 100 });
      stuck(world, k, intent, dt);
      sync(k);
      if (!world.dead) fight(world, k);
    }
  }
  k.vx = k.body.vx;
  k.moving = !k.act && k.body.onGround && Math.abs(k.body.vx) > 8;
}

// Whether she's too far from the Maiden to walk to her: further than TELE.far, or on another ledge
// and some way off for a while, or stuck, or fallen off the map.
function farOff(world, k, dt) {
  const b = world.body;
  const body = k.body;
  const d = Math.hypot(b.x - body.x, b.y - body.y);
  const nav = navOf(world.map);
  const apart = b.onGround && body.onGround && surfaceOf(nav, b) !== surfaceOf(nav, body) && d > TELE.near;
  k.brain.apart = apart ? (k.brain.apart ?? 0) + dt : 0;
  const off = body.y > world.map.height + 200 || body.x < -100 || body.x > world.map.width + 100;
  return off || d > TELE.far || k.brain.apart > TELE.apart || k.brain.lost;
}
// The teleport: she dissolves into fox fire where she stands; when that's done (act), she steps out
// of fox fire at the Maiden's side.
function vanish(world, k) {
  const body = k.body;
  body.vx = 0;
  k.brain.path = null;
  k.brain.apart = 0;
  k.brain.lost = false;
  k.act = { kind: 'vanish', t0: world.now, dur: TELE.out, done: 0 };
  world.fx.push({ kind: 'kitsuneport', x: body.x, y: body.y, t: 0, dur: 0.9, out: true });
}
function arrive(world, k) {
  const b = world.body;
  const nav = navOf(world.map);
  const surf = nav.surfaces[surfaceBelow(nav, b.x, b.y)];
  // A step behind her, on her ledge (she comes out at the Maiden's back, and walks round in front).
  let x = b.x - b.facing * HOME;
  if (surf) x = Math.max(surf.x1 + 6, Math.min(surf.x2 - 6, x));
  const y = surf && b.onGround ? surf.yAt(x) : b.y;
  Object.assign(k.body, { x, y, vx: 0, vy: 0, rope: null, onGround: b.onGround, surface: b.surface, facing: b.facing });
  sync(k);
  k.brain.path = null;
  k.act = { kind: 'arrive', t0: world.now, dur: TELE.in, done: 0 };
  world.fx.push({ kind: 'kitsuneport', x, y, t: 0, dur: 0.9, out: false });
  world.juice.push({ type: 'dust', x, y, count: 4 });
}

// Her blows are heavy, so they don't run at an even pace: each plays on its own clock (`a.clock`,
// which render/kitsune.js follows too) that hangs at the top of the wind-up (the weight of the
// naginata held there a breath), snaps through the strike, freezes on the impact (`a.freeze`,
// longer for the last blow), and drags through the follow-through as she hauls it back. Only her
// clock is slowed: the game runs on round her.
export const HEAVY = { hang: [0.15, 0.035], hangRate: 0.38, snap: 1.7, drag: 0.14, dragRate: 0.55, freeze: 0.08, lastFreeze: 0.17, recover: 0.85 };
export function heavyRate(M, u) {
  const H = HEAVY;
  // (A flurry's quick jabs run straight; only its last, big thrust is weighted.)
  const hits = M.lastPct ? M.hits.slice(-1) : M.hits.length > 1 ? M.hits.slice(-1) : M.hits;
  for (const h of hits) {
    if (u >= h - H.hang[0] && u < h - H.hang[1]) return H.hangRate;
    if (u >= h - H.hang[1] && u < h) return H.snap;
    if (u >= h && u < h + H.drag) return H.dragRate;
  }
  return u > M.hits[M.hits.length - 1] ? H.recover : 1;
}

// Thousand Torii (world/shrine.js): the Maiden's finisher sends her down the corridor of gates.
// At each gate's moment she vanishes in fox fire and steps out of it just before the gate, facing
// down the corridor, and cuts down everything there; after the last, she goes back to the Maiden
// the same way. False if she isn't there to go.
export function toriiRun(world, T) {
  const k = guardianOf(world);
  if (!k) return false;
  const last = T.gates[T.gates.length - 1].at;
  k.brain.path = null;
  k.act = { kind: 'torii', t0: world.now, dur: last - world.now + 0.7, torii: T, i: 0, cutAt: world.now, done: 0 };
  return true;
}
function toriiStep(world, k, a) {
  const T = a.torii;
  while (a.i < T.gates.length && world.now >= T.gates[a.i].at + 0.05) {
    const g = T.gates[a.i++];
    world.fx.push({ kind: 'kitsuneport', x: k.x, y: k.y, t: 0, dur: 0.6, out: true });
    const x = g.x - T.dir * 26;
    Object.assign(k.body, { x, y: g.y, vx: 0, vy: 0, rope: null, onGround: true, facing: T.dir });
    sync(k);
    world.fx.push({ kind: 'kitsuneport', x, y: g.y, t: 0, dur: 0.6, out: false });
    world.fx.push({ kind: 'arc', x: x + T.dir * 12, y: g.y - 28, dir: T.dir, r: 62, start: -20, sweep: 160, thick: 10, big: true, color: '#ff8a7a', t: 0, dur: 0.3 });
    a.cutAt = world.now;
    toriiCut(world, T, g);
  }
  if (a.i >= T.gates.length && world.now - a.cutAt > 0.55) {
    k.act = null;
    k.next = world.now + 0.4;
    vanish(world, k);
  }
}

// Plays out what she's in the middle of, rooted where she stands.
function act(world, k, dt) {
  const a = k.act;
  if (a.kind === 'torii') return toriiStep(world, k, a);
  const M = KMOVES[a.kind] ?? BLOWS[a.kind];
  if (M) {
    a.clock ??= 0;
    if (a.freeze > 0) a.freeze -= dt;
    else a.clock += dt * heavyRate(M, a.clock / a.dur);
  }
  const t = M ? a.clock : world.now - a.t0;
  if (a.kind === 'vanish') {
    if (t >= a.dur) arrive(world, k);
    return;
  }
  stepBody(k.body, world.map, NONE, dt, { speed: 0, jump: 0 });
  sync(k);
  if (a.kind === 'moonfall') moonfall(world, k, a, t, dt);
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
      // The impact: she's stopped dead a moment by what she hit.
      a.freeze = last ? HEAVY.lastFreeze : a.kind === 'flurry' ? 0.03 : HEAVY.freeze;
    }
  } else if (a.kind === 'call' && !a.hit && t >= CALL.hit * CALL.dur) {
    a.hit = true;
    foxFireCall(world, k);
  }
  if (t >= a.dur) {
    k.act = null;
    k.next = world.now + REST[0] + Math.random() * (REST[1] - REST[0]) + (SKILLS[a.kind] ? 0.3 : 0);
  }
}

// One of her blows landing: everything in the blade's reach in front of her.
function strike(world, k, kind, M, last) {
  const dir = k.dir;
  // The naginata's smear in the shrine's white and vermilion: a long low arc for the sweep, a cut
  // from low up over her for the rising cut, a short sharp line ahead for a thrust.
  const [start, sweep, thick] = SMEAR[kind];
  // (Hundred Thrusts' jabs are straight streaks of light down the blade's line, not arcs.)
  if (kind === 'flurry' && !last) world.fx.push({ kind: 'kitsunejab', x: k.x + dir * 70, y: k.y - 30 + (Math.random() - 0.5) * 10, dir, t: 0, dur: 0.22 });
  else world.fx.push({ kind: 'arc', x: k.x + dir * 12, y: k.y - 28, dir, r: M.reach * 0.62, start, sweep, thick, big: last && kind !== 'twin', color: last ? '#ff8a7a' : '#fff4ec', t: 0, dur: 0.3 });
  const hit = world.mobs
    .filter((m) => alive(m) && Math.abs(m.y - k.y) < 70 && (m.x - k.x) * dir > -12 && Math.abs(m.x - k.x) < M.reach + m.def.w / 2)
    .sort((m, o) => Math.abs(m.x - k.x) - Math.abs(o.x - k.x))
    .slice(0, M.targets);
  // The naginata is very heavy: every blow lands with a jolt, a long hit-stop and the ground shaking.
  // (Haft Strike's first blow is the butt, which dazes; its second is the blade.)
  const stun = kind === 'haft' && last ? 0 : M.stun;
  // (Hundred Thrusts' last blow is the big one: it throws.)
  const final = last && M.lastPct;
  const pct = final ? M.lastPct : M.pct;
  const knock = final ? M.lastKnock : M.knock;
  const launch = M.lastPct && !last ? 0 : M.launch ?? 0;
  if (kind === 'crescent') world.fx.push({ kind: 'kitsunecrescent', x: k.x + dir * 58, y: k.y - 36, dir, t: 0, dur: 0.55 });
  hit.forEach((m, i) => dollHit(world, m, { pct, x: k.x, knock, launch, stun, stop: i ? 0 : last ? 0.06 : 0.03, shake: !i && last ? M.shake : 0, big: last && !i, burst: 'spirithit', gauge: 2, key: 'kitsune' }));
  world.juice.push({ type: 'shake', mag: last ? M.shake : M.shake * 0.5, dur: 0.18 });
  world.juice.push({ type: 'dust', x: k.x + dir * M.reach * 0.6, y: k.y, count: last ? 5 : 3 });
  // Cleave buries the blade in the ground ahead: it cracks.
  if (M.crack) world.fx.push({ kind: 'crack', school: 'holy', x: k.x + dir * M.reach * 0.7, y: k.y, w: 90, t: 0, dur: 0.7, seed: Math.random() });
}

// ---------- Her skills ----------
const SKILLS = { moonfall: MOONFALL, crescent: CRESCENT, flurry: FLURRY };
// Her skills that are blows of the blade, played out like her moves.
const BLOWS = { crescent: CRESCENT, flurry: FLURRY };
const near = (world, k, r, h = 90) => world.mobs.filter((m) => alive(m) && !(m.air > 60) && Math.abs(m.x - k.x) < r && Math.abs(m.y - k.y) < h);

// Moonfall: the naginata held high and charging; the vortex drags everything round her in to her
// feet (they can't fight it); then the blade comes down on them all.
function moonfall(world, k, a, t, dt) {
  const M = MOONFALL;
  const u = t / M.dur;
  if (u >= M.charge && !a.vortex) {
    a.vortex = true;
    world.fx.push({ kind: 'kitsunegather', x: k.x, y: k.y, dir: k.dir, r: M.r, t: 0, dur: (M.hit - M.charge) * M.dur });
  }
  if (u >= M.charge && u < M.hit) {
    for (const m of near(world, k, M.r, 110)) {
      const dx = k.x + k.dir * M.close - m.x;
      if (Math.abs(dx) < 6) continue;
      // (Faster the further off they are, so they all arrive together.)
      const v = Math.min(Math.abs(dx) / dt, M.pull * (0.6 + Math.abs(dx) / M.r));
      m.x = Math.max(m.x1 ?? -Infinity, Math.min(m.x2 ?? Infinity, m.x + Math.sign(dx) * v * dt));
      m.knockVx = 0;
      m.stagger = Math.max(m.stagger ?? 0, 0.15);
      m.dir = Math.sign(k.x - m.x) || m.dir;
    }
    if (Math.random() < dt * 8) world.juice.push({ type: 'shake', mag: 0.6, dur: 0.1 });
  }
  if (u >= M.hit && !a.hit) {
    a.hit = true;
    const x = k.x + k.dir * 36;
    world.fx.push({ kind: 'kitsunemoonfall', x, y: k.y, t: 0, dur: 1 });
    world.fx.push({ kind: 'crack', school: 'holy', x, y: k.y, w: M.blast * 2, t: 0, dur: 0.9, seed: Math.random() });
    world.juice.push({ type: 'shake', mag: 6, dur: 0.4 });
    world.juice.push({ type: 'dust', x, y: k.y, count: 12 });
    world.mobs
      .filter((m) => alive(m) && Math.abs(m.x - x) < M.blast + m.def.w / 2 && Math.abs(m.y - k.y) < 90)
      .forEach((m, i) => dollHit(world, m, { pct: M.pct, x, knock: M.knock, launch: M.launch, stun: M.stun, stop: i ? 0 : 0.16, shake: i ? 0 : 6, big: !i, burst: 'spirithit', gauge: 3, key: 'kitsune' }));
  }
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

// Stuck: she gives up on where she was going (and if it goes on, teleports to the Maiden).
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
  // Stuck a long while with somewhere to be, away from the Maiden: she teleports to her.
  br.stuckFor = pushing && Math.abs(body.vx) < 4 ? (br.stuckFor ?? 0) + dt : 0;
  if (br.stuckFor > 2.5) {
    br.stuckFor = 0;
    br.lost = Math.hypot(world.body.x - body.x, world.body.y - body.y) > TELE.near;
  }
}

// Her own moves at her target, once she's rested: never the same twice running; and her skills
// when they're ready and worth it (Moonfall at several round her, or one she can't reach, which it
// drags in; Crescent Moon and Hundred Thrusts at what's in front of her).
function fight(world, k) {
  const m = k.brain.target;
  if (!alive(m) || !k.body.onGround || k.act || world.now < k.next) return;
  const dx = Math.abs(m.x - k.x);
  const level = Math.abs(m.y - k.y) <= 40;
  const inReach = level && dx <= KMOVES.thrust.reach + m.def.w / 2 - 6;
  const ready = (id) => world.now >= (k.skillAt[id] ?? 0);
  const round = near(world, k, MOONFALL.r * 0.8).length;
  let kind = null;
  if (ready('moonfall') && (round >= 3 || (round >= 2 && Math.random() < 0.5) || (!inReach && level && dx < MOONFALL.r * 0.8 && Math.random() < 0.3))) kind = 'moonfall';
  else if (!inReach) return;
  else if (ready('crescent') && (near(world, k, CRESCENT.reach).length >= 2 || Math.random() < 0.4)) kind = 'crescent';
  else if (ready('flurry') && Math.random() < 0.5) kind = 'flurry';
  if (kind) k.skillAt[kind] = world.now + SKILLS[kind].every;
  else {
    const crowd = world.mobs.filter((o) => alive(o) && Math.abs(o.x - k.x) < 80 && Math.abs(o.y - k.y) < 40).length;
    const pool = (crowd >= 2 ? ['sweep', 'sweep', 'reap', 'reap', 'cleave', 'thrust', 'rising', 'twin', 'haft'] : ['thrust', 'rising', 'twin', 'sweep', 'cleave', 'reap', 'haft']).filter((n) => n !== k.last);
    kind = pool[Math.floor(Math.random() * pool.length)];
  }
  k.last = kind;
  k.body.facing = Math.sign(m.x - k.x) || k.body.facing;
  k.body.vx = 0;
  sync(k);
  k.act = { kind, t0: world.now, dur: (KMOVES[kind] ?? SKILLS[kind]).dur, done: 0 };
}
