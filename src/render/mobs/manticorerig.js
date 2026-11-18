// The Manticore Cub (Windy Canyon, remade from scratch 2026-11-18 for Chapter 3): a chubby lion cub
// with a huge dandelion-puff mane, tiny lilac felt wings it can't fly with yet, and a soft tail that
// ends in a little pink heart (the "stinger" it drops). A live puppet on the rig (rig.js): every part
// drawn once and placed each frame, nothing squashed or stretched, outer outline only.
//
//   walk    a proud little strut: no legs show, just round mitten paws peeking out under the fluffy
//           fringe of its belly, the near pair stepping together and then the far pair (a toddler's
//           waddle, not a trot), stepped by the distance walked on an eased speed (a planted paw stays
//           put, a lifted one tucks up under the fur). Chest out and head high, it bobs on a springy
//           lift, its mane bouncing a beat behind, its felt wings fluttering for balance, its tail
//           held up. Creeping slowly (its gait is a stalk) it sinks low, tail tip flicking.
//   wind    every puff of its mane streams downwind with the canyon's gusts (the same wind the
//           grass and pennants lean in), each on its own flutter.
//   idle    it looks about; sits down and tries to fly (the felt wings buzz, it lifts a hair, gives
//           up); bats at a dandelion seed drifting past its nose; sneezes, mane puffing out.
//   attack  the pounce: it crouches, its rump wiggling, then leaps paws-first, wings flared.
//   hit     knocked back on its tilt, the mane puffing out.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, deadEye, tear, vein } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, partBare, makeRig, stateBlend, smooth, clamp, lerp, kick, TAU } from './rig.js';
import { sprite } from '../pixel.js';
import { windAt } from '../terrain.js';

const FUR = ramp('#f4c27a', { step: 9, turn: 12 });
const CREAM = '#fff3dc';
const MANE = [ramp('#ffab76', { step: 8, turn: 10 }), ramp('#ffc490', { step: 8, turn: 10 })];
const WING = ramp('#c9a8ec', { step: 8, turn: 10 });
const HEART = ramp('#ff7fa2', { step: 8, turn: 8 });
const PAW = '#ffe9c8';
const INK = '#2a1a20';
const D2R = Math.PI / 180;

// Every picture twice: outlined for the first pass, bare for the second, so only the cub's outer edge
// keeps a line (one soft shape, not a stack of pieces).
const pair = (key, w, h, shapes, pad = 3) => [() => part(`mc|${key}`, w, h, shapes, pad), () => partBare(`mc|${key}`, w, h, shapes, pad)];

// ---------- Shapes ----------

// The body: a plump little barrel, golden on top, a cream belly, a couple of faint cub dapples, and a
// soft fringe of fluff all along its underside that the legs hide under. Box 20 x 15; its joint
// (middle of its underside) at (10, 9).
const bodyShapes = () => {
  const out = [E(10, 6.6, 9, 5.8, FUR.base), E(11.4, 9.6, 6.6, 2.8, CREAM)];
  for (let i = 0; i < 7; i++) out.push(E(2.8 + i * 2.5, 11.6 + (i % 2) * 0.5, 1.9, 1.5, i % 2 ? '#f6e0bc' : CREAM));
  out.push(crescent(10, 6.6, 9, 5.8, FUR.sh, { k: 0.2, a0: 25, a1: 155 }), shine(10, 6.6, 9, 5.8, FUR.hi, 0, 0.8), F(E(5.4, 5.2, 1.5, 1.1, FUR.hi)), F(E(8.4, 4, 1.2, 0.9, FUR.hi)));
  return out;
};
// A paw: a round soft mitten with two little toe creases. Box 6 x 5; its middle at (3, 2.5).
const pawShapes = (far) => () => [
  E(3, 2.5, 2.9, 2.2, far ? FUR.sh : FUR.base),
  F(E(3.6, 3.4, 2, 1, far ? FUR.base : PAW)),
  F(E(2.2, 1.6, 1.1, 0.55, far ? FUR.base : FUR.hi)),
  ...(far ? [] : [...stroke([[3.6, 3.2], [3.7, 4.3]], 0.35, FUR.sh), ...stroke([[4.8, 3], [5, 4]], 0.35, FUR.sh)]),
];
// The head: big and round with a cream muzzle. Box 20 x 18; the neck at (5, 14), the head's middle
// at (10, 9).
const headShapes = () => [
  E(10, 9, 7.6, 7.2, FUR.base),
  E(15.6, 11.8, 3.8, 2.8, CREAM),
  E(12.2, 13, 3.4, 2.2, CREAM),
  crescent(10, 9, 7.6, 7.2, FUR.sh, { k: 0.2, a0: 100, a1: 210 }),
  F(E(8.4, 4.4, 3, 1.3, FUR.hi)),
];
// An ear: small and round, pink inside. Box 7 x 7; its root at (3.5, 6.4).
const earShapes = (far) => () => [E(3.5, 3.6, 3.2, 3.2, far ? FUR.sh : FUR.base), F(E(3.6, 3.9, 1.8, 1.8, far ? '#e8a0a8' : '#ffb4bc'))];
// A puff of the mane: a fat round tuft, lit along its top. Box (2r + 2) square, its middle in the middle.
const puffShapes = (r, k) => () => {
  const c = MANE[k % 2];
  return [E(r + 1, r + 1, r, r * 0.92, c.base), F(E(r + 1 - r * 0.25, r + 1 - r * 0.32, r * 0.55, r * 0.3, c.hi)), F(E(r + 1 + r * 0.2, r + 1 + r * 0.45, r * 0.5, r * 0.22, c.sh))];
};
// A felt wing: a little scalloped fan, stitched round its edge. Box 14 x 10; its root at (2, 9).
const WS = 1.28;
const wingShapes = (far) => () => {
  const c = far ? WING.sh : WING.base;
  const P = (pts) => pts.map(([x, y]) => [x * WS, y * WS]);
  const out = [T(P([[1.6, 7], [0.6, 4.2], [2, 1.2], [5, 0.2], [8.6, 1], [10.6, 3.4], [9.8, 5.4], [7.8, 4.8], [6.8, 6.6], [4.8, 6], [3.6, 7.4]]), c)];
  if (!far) {
    out.push(F(T(P([[2.4, 5.6], [3, 2.4], [5.2, 1.4], [5.6, 2.2], [3.8, 3.2], [3.4, 5.8]]), WING.hi)));
    for (const [x0, y0, x1, y1] of [[3.2, 1.8, 4.4, 1.2], [6.2, 1.1, 7.6, 1.2], [9.2, 2.4, 9.9, 3.4], [8.2, 5.1, 9.2, 5.3], [5.4, 6.1, 6.2, 6.4]]) out.push(...stroke(P([[x0, y0], [x1, y1]]), 0.4, '#f6eeff'));
  }
  return out;
};
// The heart at the tail's tip (the "stinger"): its point at (1, 4), its lobes out along +x.
const heartShapes = () => [E(5, 2.4, 2.4, 2.3, HEART.base), E(5, 5.6, 2.4, 2.3, HEART.base), T([[1, 4], [4.2, 0.6], [6.4, 4], [4.2, 7.4]], HEART.base), F(E(5.4, 2, 1, 0.7, HEART.hi))];
// A tail bone: a slim tapered tube along +x. Box 8 x 4; its root at (1.6, 2).
const TAILLEN = 4.4;
const tailShapes = (i) => () => {
  const w0 = 2.6 - i * 0.3;
  const w1 = w0 - 0.3;
  const e = 1.6 + TAILLEN;
  return [E(1.6, 2, w0 / 2 + 0.2, w0 / 2 + 0.2, FUR.base), T([[1.6, 2 - w0 / 2], [e, 2 - w1 / 2], [e, 2 + w1 / 2], [1.6, 2 + w0 / 2]], FUR.base), E(e, 2, w1 / 2, w1 / 2, FUR.base)];
};
// The face (bare, over the head): big glossy eyes, a pink nose, a little cat mouth, a blush.
const MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout']);
const faceShapes = (mood) => () => {
  const out = [];
  if (mood === 'dead') out.push(...deadEye(12.4, 8.6, 1.4, { c: INK, th: 0.5 }), ...deadEye(16.8, 8.2, 1.1, { c: INK, th: 0.5 }));
  else {
    const so = { iris: '#7a4a1e', ink: INK, lid: 0, mood: mood === 'shout' ? 'angry' : mood };
    out.push(...simpleEye(12.4, 8.6, { ...so, s: -1, w: 1.9, h: 2.4 }), ...simpleEye(16.8, 8.2, { ...so, s: 1, w: 1.5, h: 2 }));
    out.push(F(E(11.2, 12, 1.5, 0.75, '#ffa4b4')));
  }
  out.push(F(T([[18.4, 10], [20.2, 10], [19.3, 11.2]], '#ff8ea2')));
  if (mood === 'shout') out.push(F(E(17.8, 13.2, 1.5, 1.3, '#8a3040')), F(E(17.8, 13.8, 0.9, 0.5, '#ff9ab0')));
  else out.push(...stroke([[17.4, 12.4], [18.3, 13], [19.3, 12.2]], 0.4, INK), ...stroke([[19.3, 12.2], [19.6, 11.4]], 0.35, INK));
  if (mood === 'hurt') out.push(...tear(13, 10, 0.7, { type: 'stream', len: 2 }));
  if (mood === 'angry') out.push(...vein(7, 4, 0.6));
  return out;
};

const BODY = pair('body', 20, 15, bodyShapes);
const HEAD = pair('head', 20, 18, headShapes);
const EAR = [false, true].map((far) => pair(`ear${far ? 1 : 0}`, 7, 7, earShapes(far)));
const WINGP = [false, true].map((far) => pair(`wing${far ? 1 : 0}`, 14, 10, wingShapes(far)));
const HEARTP = pair('heart', 8, 8, heartShapes);
const TAILP = [0, 1, 2].map((i) => pair(`tail${i}`, 8, 4, tailShapes(i)));
const facePart = (mood) => sprite(`rig|mc|face|${mood}`, () => ({ w: 20, h: 18, res: 2, soft: 'cel', crisp: true, bare: true, pad: 3, shapes: faceShapes(mood)() }));
const faceOf = (a) => {
  if (a.face === 'dead') return 'dead';
  if (a.ph.strike > 0.2) return 'shout';
  if (a.ph.atk) return 'angry';
  if (a.sneeze) return a.sneeze > 0.6 ? 'shout' : 'happy';
  if (a.face === 'idle' && (a.t + (a.uidOff ?? 0)) % 3.7 < 0.12) return 'blink';
  return MOODS.has(a.face) ? a.face : 'idle';
};

const PAWP = [false, true].map((far) => pair(`paw${far ? 1 : 0}`, 6, 5, pawShapes(far)));

// The mane: puffs round the back of the head, from the forehead over the top and round to the chin.
// [angle (0 = ahead, 90 = down), distance from the head's middle, radius].
const PUFFS = [[314, 7.6, 3.5], [272, 9, 4.6], [230, 9.8, 5], [188, 10, 5], [146, 9.6, 4.8], [108, 8.8, 4.3], [74, 7.8, 3.7]];
const PUFFP = PUFFS.map(([, , r], k) => pair(`puff${k}`, r * 2 + 2, r * 2 + 2, puffShapes(r, k)));

// ---------- Motion ----------

const STRIDE = 24;
const DUTY = 0.6;
const R = (STRIDE * DUTY) / 2;
// The paws: [rest x, step phase, front?, far?]. The near pair steps together, then the far pair.
const PAWS = {
  HF: [-4.4, 0.5, false, true],
  FF: [7.6, 0.5, true, true],
  HN: [-6.2, 0, false, false],
  FN: [5.8, 0, true, false],
};
const torsoAng = (S) => (S.tilt + S.crouch * 6 - S.sit * 12) * D2R;
const torsoAt = (S) => [S.x - S.sit * 1.2, -6.4 - S.lift - S.air + S.crouch * 1.4 - S.sit * 0.4];
const torsoPt = (S, lx, ly) => {
  const r = torsoAng(S);
  const [hx, hy] = torsoAt(S);
  return [hx + lx * Math.cos(r) - ly * Math.sin(r), hy + lx * Math.sin(r) + ly * Math.cos(r)];
};
// The walk's phase: one cycle per STRIDE px walked, on its speed eased over a moment.
const stepPhase = (m, a) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(160, Math.abs(odo - (st.mcOdo ?? odo)) / dt);
  st.mcOdo = odo;
  st.mcV = (st.mcV ?? 0) + (raw - (st.mcV ?? 0)) * Math.min(1, dt * 4);
  st.mcU = ((st.mcU ?? 0) + (st.mcV / STRIDE) * dt) % 1;
  a.mcV = st.mcV;
  return st.mcU;
};
// A paw at phase u: planted (sliding back at exactly the walking speed, so it stays put on the
// ground), then tucked up under the fur and brought forward on an eased arc. [x off its rest, lift].
const pawStep = (u, ph) => {
  const q = (((u + ph) % 1) + 1) % 1;
  if (q < DUTY) return [R - (2 * R * q) / DUTY, 0];
  const s = (q - DUTY) / (1 - DUTY);
  return [-R + 2 * R * smooth(s), Math.sin(Math.PI * s) * 2.4];
};
// Where a paw is: stepping on the ground; up in the air with the body when it leaps; the near fore
// paw raised to bat at the seed; the fore paws reaching out ahead as it pounces.
const pawPos = (S, a, key) => {
  const [rx, ph, front, far] = PAWS[key];
  const w = a.walkW;
  const [dx, lift] = pawStep(a.mcU ?? 0, ph);
  let x = S.x + rx + dx * w;
  let y = -2.4 - lift * w - S.air;
  if (!front) x += S.sit * 1.6;
  if (front) {
    const reach = clamp(S.reach, 0, 1.2);
    x += reach * (far ? 4.4 : 6);
    y -= reach * (far ? 2.6 : 3.4);
    if (!far) {
      x += S.bat * 3.6;
      y -= S.bat * 8;
    }
  }
  return [x, y];
};
// A near fore paw comes round in front of the chest when it's raised (batting, pouncing).
const raised = (S) => clamp(Math.max(S.bat, S.reach) * 2.5 - 0.4, 0, 1);
const pawPart = (key, bare, after = false) => {
  const far = PAWS[key][3];
  const front = PAWS[key][2];
  return {
    name: `paw${key}${bare ? 'b' : ''}${after ? 'x' : ''}`,
    parent: null,
    s: PAWP[far ? 1 : 0][bare ? 1 : 0],
    pivot: [3, 2.5],
    at: (S, a) => pawPos(S, a, key),
    alpha: front && !far ? (a, S) => (after ? raised(S) : 1 - raised(S)) : undefined,
  };
};

// The head, on its neck at the front of the torso, kept nearly level as the body tilts.
const NECK = [7.4, -3.6];
const headAng = (S) => torsoAng(S) * 0.35 + S.head * D2R;
// The mane's wind: which way is downwind in the cub's own space, and how hard it's blowing.
const gustOf = (m, a) => {
  const w = windAt(a.t, m.x ?? 0);
  return { push: clamp((w - 0.55) * 1.6, 0, 1.3), dir: a.flip ? -1 : 1 };
};
const puffAt = (k) => (S, a) => {
  const [ang, d] = PUFFS[k];
  const g = a.gust ?? { push: 0, dir: 1 };
  const back = 0.6 + 0.4 * Math.cos((ang - 180) * D2R) ** 2;
  const flutter = Math.sin(a.t * 5.3 + k * 1.9) * 0.45 + Math.sin(a.t * 8.1 + k) * 0.2;
  const out = 1 + S.puff * 0.28;
  const bounce = Math.sin(((a.mcU ?? 0) * 2 - 0.18 - k * 0.025) * TAU) * 0.55 * a.walkW;
  return [5 + Math.cos(ang * D2R) * d * out + g.dir * g.push * (1.4 + flutter) * back - S.pounceWind * 2.2, -5 + Math.sin(ang * D2R) * d * out + flutter * 0.4 * g.push + bounce];
};
// The tail: a slim chain curling up behind, a slow sway, its tip flicking when it creeps or wiggles.
const TAILROOT = [-9, -1.6];

// The idle loop, every 14 s.
const LOOP = 14;
const hold = (u, a, b, c, d) => (u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u < c ? 1 : 1 - smooth((u - c) / (d - c)));

const outlinedAndBare = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    ...[0, 1, 2].map((k) => ({
      name: `tail${k}${tag}`,
      parent: k ? `tail${k - 1}${tag}` : 'torso',
      s: TAILP[k][i],
      pivot: [1.6, 2],
      at: k ? () => [TAILLEN, 0] : () => TAILROOT,
      rot: (S, a) => (k ? 30 + S.tailCurl * 0.4 + Math.sin(a.t * 1.3 - k * 0.6) * 5 + S.flick * Math.sin(a.t * 9 - k) * 12 : 196 + S.tail) * D2R,
    })),
    { name: `heart${tag}`, parent: `tail2${tag}`, s: HEARTP[i], pivot: [1, 4], at: () => [TAILLEN + 0.2, 0], rot: (S, a) => (14 + Math.sin(a.t * 1.3 - 2.6) * 6) * D2R },
    pawPart('HF', bare),
    pawPart('FF', bare),
    { name: `wingF${tag}`, parent: 'torso', s: WINGP[1][i], pivot: [2, 9], at: () => [-2.6, -5.6], rot: (S, a) => (-34 + S.wing - S.buzz - S.flap) * D2R },
    pawPart('HN', bare),
    pawPart('FN', bare),
    { name: `body${tag}`, parent: 'torso', s: BODY[i], pivot: [10, 9] },
    pawPart('FN', bare, true),
    { name: `wingN${tag}`, parent: 'torso', s: WINGP[0][i], pivot: [2, 9], at: () => [-5, -4.8], rot: (S) => (-24 + S.wing + S.buzz + S.flap) * D2R },
    ...PUFFS.map((p, k) => ({ name: `puff${k}${tag}`, parent: 'neck', s: PUFFP[k][i], pivot: [p[2] + 1, p[2] + 1], at: puffAt(k) })),
    { name: `earF${tag}`, parent: 'neck', s: EAR[1][i], pivot: [3.5, 6.4], at: () => [2.6, -11.2], rot: (S) => (-14 + S.ear) * D2R },
    { name: `earN${tag}`, parent: 'neck', s: EAR[0][i], pivot: [3.5, 6.4], at: () => [6.8, -12], rot: (S) => (12 + S.ear) * D2R },
    { name: `head${tag}`, parent: 'neck', s: HEAD[i], pivot: [5, 14] },
  ];
};

export const manticoreRig = makeRig({
  w: 44,
  h: 38,
  soft: true,
  stride: STRIDE,
  recover: 0.6,
  springs: {
    x: [220, 20],
    // (Springy: each step's bob overshoots a touch and settles.)
    lift: [170, 9],
    air: [200, 16],
    flap: [200, 12],
    tilt: [150, 12],
    crouch: [120, 14],
    sit: [70, 13],
    head: [90, 9],
    reach: [260, 18],
    bat: [260, 16],
    wing: [160, 10],
    buzz: [600, 30],
    puff: [120, 7],
    pounceWind: [140, 12],
    flick: [80, 12],
  },
  fast: ['x', 'air', 'tilt', 'reach', 'crouch'],
  kick: { tilt: -220, ear: 300, puff: 6, tail: 120 },
  turnKick: { tilt: 120, tail: 90, ear: 140, puff: 2 },
  pose(m, a) {
    const t = a.t + (m.uid % 11) * 1.29;
    a.uidOff = (m.uid % 11) * 1.29;
    a.mcU = stepPhase(m, a);
    a.gust = gustOf(m, a);
    const lu = t % LOOP;
    const look = hold(lu, 0.6, 1.4, 2.4, 3.1);
    const sit = hold(lu, 3.4, 4.2, 7.4, 8.1);
    const tryFly = hold(lu, 4.8, 5.1, 6.2, 6.5);
    const batW = hold(lu, 8.4, 8.8, 10.2, 10.6);
    const bat = batW * Math.max(0, Math.sin((lu - 8.4) * 5.2)) ** 2;
    const sneeze = hold(lu, 11, 11.5, 11.7, 12.3);
    a.sneeze = sneeze > 0.05 && a.walkW < 0.3 ? sneeze : 0;
    a.batSeed = batW;
    a.seedU = (lu - 8) / 3;
    const breath = Math.sin(t * 1.6);
    const idle = {
      x: 0, lift: breath * 0.15, air: tryFly * (0.8 + Math.sin(t * 9) * 0.3), tilt: breath * 0.4, crouch: 0, sit,
      head: -look * 10 + Math.sin(t * 0.7) * 2 - sit * 8 - bat * 10 + (sneeze > 0.6 ? -14 : sneeze * 8),
      reach: 0, bat, wing: tryFly * -18, buzz: tryFly * Math.sin(t * 46) * 16, flap: 0, puff: sneeze > 0.6 ? 1 : 0, pounceWind: 0, flick: 0,
    };
    // The strut: chest out and head high, a springy bob with each pair's step, the wings fluttering
    // for balance; creeping slow, it sinks low, tail tip flicking.
    const p = a.mcU * TAU;
    const creep = clamp((40 - (a.mcV ?? 0)) / 22, 0, 1);
    const walk = {
      x: 0, lift: (0.5 - 0.5 * Math.cos(p * 2)) * 0.9 * (1 - creep * 0.6), air: 0, tilt: -2.4 + Math.sin(p * 2 - 0.6) * 1.2 + creep * 3, crouch: creep * 0.8, sit: 0,
      head: -5 + Math.sin(p * 2 - 1.1) * 2.2 + creep * 9, reach: 0, bat: 0, wing: 2, buzz: 0, flap: Math.sin(p * 2) * 7 * (1 - creep), puff: 0, pounceWind: 0, flick: creep,
    };
    // The pounce: crouched, rump up and wiggling, then the leap, paws first, wings flared.
    const wig = Math.sin(a.t * 22) * 4;
    const antic = { x: -2, lift: 0, air: 0, tilt: wig, crouch: 1.3, sit: 0, head: 8, reach: 0, bat: 0, wing: 8, buzz: 0, flap: 0, puff: 0, pounceWind: 0, flick: 1 };
    const strike = { x: 9, lift: 0, air: 6, tilt: -14, crouch: 0, sit: 0, head: -6, reach: 1, bat: 0, wing: -30, buzz: 0, flap: 0, puff: 0.4, pounceWind: 1, flick: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow(S, a) {
    return {
      ear: -S.tilt * 1.4 - S.lift * 6 + S.pounceWind * -30,
      tail: -S.tilt * 0.8 + S.crouch * 14 - S.lift * 2 + S.sit * -26 - a.walkW * (1 - S.crouch) * 16,
      tailCurl: S.sit * -30 + S.crouch * 10,
    };
  },
  parts: [
    { name: 'torso', parent: null, at: (S) => torsoAt(S), rot: (S) => torsoAng(S) },
    { name: 'neck', parent: null, at: (S) => torsoPt(S, ...NECK), rot: (S) => headAng(S) },
    ...outlinedAndBare(false),
    ...outlinedAndBare(true),
    { name: 'face', parent: 'neck', s: (a) => facePart(faceOf(a)), pivot: [5, 14] },
  ],
  // The dandelion seed it bats at: a little parachute of fluff drifting past its nose.
  fx(ctx, m, a, S, matOf) {
    if (!(a.batSeed > 0.02) || a.walkW > 0.3 || m.hp <= 0) return;
    const u = clamp(a.seedU, 0, 1);
    const x = 16 + Math.sin(u * 7) * 2 + u * 5;
    const y = -15 + Math.sin(u * 11) * 2 - u * 4;
    ctx.globalAlpha = (a.alpha ?? 1) * a.batSeed;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.45;
    for (let k = 0; k < 7; k++) {
      const ang = -Math.PI / 2 + (k - 3) * 0.32 + Math.sin(a.t * 3) * 0.08;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * 2.6, y + Math.sin(ang) * 2.6);
      ctx.stroke();
    }
    ctx.strokeStyle = '#d8c8a8';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 2.6);
    ctx.stroke();
    ctx.fillStyle = '#c8a878';
    ctx.fillRect(x - 0.4, y + 2.4, 0.8, 1);
    ctx.globalAlpha = 1;
  },
});

// ---------- Still (portraits, the monster book) ----------

const shift = (shapes, dx, dy) => shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: 0, y: 0, pts: s.pts.map(([x, y]) => [x + (s.x ?? 0) + dx, y + (s.y ?? 0) + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
const rot = (shapes, ang, px, py) => {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const R2 = ([x, y]) => [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c];
  return shapes.filter(Boolean).map((sh) => (sh.t === 'p' ? { ...sh, x: 0, y: 0, pts: sh.pts.map(([x, y]) => R2([x + (sh.x ?? 0), y + (sh.y ?? 0)])) } : { ...sh, ...(([x, y]) => ({ x, y }))(R2([sh.x, sh.y])) }));
};
export function manticoreStill(pose, f, mood) {
  const fm = mood === 'dead' ? 'dead' : MOODS.has(mood) ? mood : 'idle';
  const S = { x: 0, lift: 0, air: 0, tilt: 0, crouch: 0, sit: 0, head: 0, reach: 0, bat: 0, wing: 0, buzz: 0, flap: 0, puff: 0, pounceWind: 0, tail: 0, tailCurl: 0, ear: 0, flick: 0 };
  const A = { walkW: 0, mcU: 0, t: 0, gust: { push: 0, dir: 1 } };
  const [tx, ty] = torsoAt(S);
  const [nx, ny] = torsoPt(S, ...NECK);
  const leg = (key) => {
    const [x, y] = pawPos(S, A, key);
    return shift(pawShapes(PAWS[key][3])(), x - 3, y - 2.5);
  };
  // The tail, curled up behind, with its heart.
  const tail = [];
  let [px, py] = [tx + TAILROOT[0], ty + TAILROOT[1]];
  let ang = 196;
  for (let k = 0; k < 3; k++) {
    tail.push(...rot(shift(tailShapes(k)(), px - 1.6, py - 2), ang * D2R, px, py));
    px += Math.cos(ang * D2R) * TAILLEN;
    py += Math.sin(ang * D2R) * TAILLEN;
    ang += 30;
  }
  tail.push(...rot(shift(heartShapes(), px - 1, py - 4), (ang - 8) * D2R, px, py));
  const mane = PUFFS.flatMap(([a, d, r], k) => shift(puffShapes(r, k)(), nx + 5 + Math.cos(a * D2R) * d - r - 1, ny - 5 + Math.sin(a * D2R) * d - r - 1));
  return {
    w: 50,
    h: 42,
    res: 3,
    shapes: shift(
      [
        ...tail,
        ...leg('HF'),
        ...leg('FF'),
        ...rot(shift(wingShapes(true)(), tx - 2.6 - 2, ty - 5.6 - 9), -34 * D2R, tx - 2.6, ty - 5.6),
        ...leg('HN'),
        ...leg('FN'),
        ...shift(bodyShapes(), tx - 10, ty - 9),
        ...rot(shift(wingShapes(false)(), tx - 5 - 2, ty - 4.8 - 9), -24 * D2R, tx - 5, ty - 4.8),
        ...mane,
        ...shift(earShapes(true)(), nx + 2.6 - 3.5, ny - 11.2 - 6.4),
        ...shift(earShapes(false)(), nx + 6.8 - 3.5, ny - 12 - 6.4),
        ...shift(headShapes(), nx - 5, ny - 14),
        ...shift(faceShapes(fm)(), nx - 5, ny - 14),
      ],
      22,
      40,
    ),
  };
}
