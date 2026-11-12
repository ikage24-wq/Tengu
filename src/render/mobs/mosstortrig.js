// The Moss Tortoise (new for Mossy Woods' forest floor, 2026-11-12, built from scratch): a slow,
// sleepy old tortoise with a little moss garden growing on its high round shell. A live puppet on
// the boss rig (rig.js): every part drawn once and placed each frame, the loose bits on springs,
// nothing squashed or stretched, every part filtered smoothly.
//
// Its look: a tall dome of warm brown shell with paler six-sided plates and a cream rim, a cushion
// of moss on top where a curled fern, a pink flower and a tiny red mushroom grow; a round sage
// head with one big sleepy eye, on a wrinkly neck that slides in and out of the shell; four stubby
// pillar legs with round toenailed feet, and a little pointed tail.
//   walk    a heavy, steady plod in diagonal pairs, stepped by the distance walked on an eased
//           speed: a planted foot stays put while it walks over it, a lifted foot tucks up under
//           the shell and swings forward; the shell rocks a hair with each step and the garden on
//           top sways on after it.
//   idle    it breathes slowly, looks up for a long moment with a slow blink, and now and then
//           stretches its neck down to munch a leaf off the floor.
//   attack  it pulls its head right into its shell and hunkers, then its neck shoots out in a snap.
//   hit     its head ducks into the shell and peeks back out; the garden shivers.
// `mosstortStill(pose, f, mood)` gives the still pictures (portraits, the book) from the same shapes.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, deadEye, tear, vein } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, partBare, outerOutline, makeRig, stateBlend, smooth, clamp, TAU } from './rig.js';
import { sprite } from '../pixel.js';

const SHELL = ramp('#a8704a', { step: 10, turn: 10 });
const PLATE = ramp('#d6a46c', { step: 9, turn: 12 });
const RIM = ramp('#ecd2a2', { step: 8, turn: 14 });
const SKIN = ramp('#a9c48e', { step: 9, turn: 14, sat: -4 });
const JAW = '#e6efc8';
const MOSS = ramp('#78c266', { step: 9, turn: 12 });
const FERN = '#4fa456';
const INK = '#2c2a36';
const D2R = Math.PI / 180;

// Points round an oval from a0 to a1 degrees (0 = front, 90 = down).
const arcP = (cx, cy, rx, ry, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => {
  const a = (a0 + ((a1 - a0) * i) / n) * D2R;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
const hexP = (cx, cy, rx, ry) => Array.from({ length: 6 }, (_, i) => [cx + Math.cos((i * 60 + 30) * D2R) * rx, cy + Math.sin((i * 60 + 30) * D2R) * ry]);

// ---------- Shapes ----------

// The shell: a tall dome with paler plates, a cream rim of edge plates, and a cushion of moss on
// top. Box 36 x 22; the middle of its underside at (18, 21).
const shellShapes = () => {
  const out = [T([...arcP(18, 17, 16.4, 15, 180, 360, 20)], SHELL.base)];
  // The plates: a big one in the middle and one either side.
  out.push(F(T(hexP(18, 11.6, 4.6, 4.2), PLATE.base)), F(T(hexP(9.4, 13.2, 3.8, 3.8), PLATE.base)), F(T(hexP(26.6, 13.2, 3.8, 3.8), PLATE.base)));
  out.push(F(T(hexP(18, 11.6, 2.6, 2.3), PLATE.hi)), F(T(hexP(9.4, 13.2, 2, 2), PLATE.hi)), F(T(hexP(26.6, 13.2, 2, 2), PLATE.hi)));
  out.push(crescent(18, 17, 16.4, 15, SHELL.sh, { k: 0.16, a0: 200, a1: 250 }), shine(18, 17, 16.4, 15, SHELL.hi, 0, 0.6));
  // The rim: a band of cream edge plates, notched.
  out.push(T([[1.4, 16.4], [34.6, 16.4], [33.4, 21], [2.6, 21]], RIM.base));
  for (let i = 0; i < 6; i++) out.push(F(T([[4.4 + i * 5.4, 16.8], [4.4 + i * 5.4 + 0.5, 16.8], [4.4 + i * 5.4 + 0.5, 20.6], [4.4 + i * 5.4, 20.6]], RIM.sh)));
  out.push(F(T([[2, 16.6], [34, 16.6], [33.8, 17.6], [2.2, 17.6]], RIM.hi)));
  // The moss cushion on top, lumpy, with a little moss trickling down the sides.
  for (const [x, y, rx, ry] of [[12, 4.4, 4.6, 2.8], [18, 2.8, 5.6, 3], [24, 4.2, 4.6, 2.8], [8.2, 7.4, 2.4, 1.8], [28, 7, 2.2, 1.6]]) out.push(E(x, y, rx, ry, MOSS.base));
  for (const [x, y, rx, ry] of [[11.4, 3.4, 2.6, 1.2], [17.4, 1.6, 3.4, 1.3], [23.6, 3.2, 2.4, 1.1]]) out.push(F(E(x, y, rx, ry, MOSS.hi)));
  for (const [x, y] of [[14, 6.4], [21.4, 6], [16.6, 5.2]]) out.push(F(E(x, y, 0.7, 0.6, MOSS.sh)));
  return out;
};
// A leg: a stubby pillar with a round foot and three toenails. Box 7 x 7; the hip at (3.5, 0.5),
// the sole at y 5.6.
const legShapes = (far) => {
  const c = far ? SKIN.sh : SKIN.base;
  const out = [E(3.5, 2.6, 2.5, 2.6, c), E(3.6, 4.4, 2.9, 1.5, c), F(E(2.8, 2.2, 0.9, 1.4, far ? SKIN.base : SKIN.hi))];
  for (const x of [1.6, 3.6, 5.6]) out.push(F(E(x, 5.1, 0.7, 0.5, far ? '#d2c6a8' : '#f2e8cc')));
  return out;
};
// The tail: a little pointed cone. Box 6 x 4; its root at (5, 2).
const tailShapes = () => [T([[5.4, 0.6], [5.4, 3.4], [0.6, 2.6]], SKIN.sh)];
// A ring of the neck: a soft disc of skin with a wrinkle. Box 7 x 7; its middle at (3.5, 3.5).
const neckShapes = (i) => [E(3.5, 3.5, 2.9 - i * 0.2, 2.9 - i * 0.2, SKIN.base), F(T(arcP(3.4, 3.6, 2, 2.2, 230, 310, 6).concat(arcP(3.4, 3.9, 1.6, 1.7, 310, 230, 6)), SKIN.sh))];
// The head: a round sage head with a blunt beaky snout and a pale jaw. Box 13 x 10; the neck
// joins at (2.6, 6).
const headShapes = () => [
  E(5.4, 5, 4.5, 4, SKIN.base),
  T([[8, 2.6], [11, 3.2], [12.8, 4.8], [12.4, 6.6], [9, 7.6]], SKIN.base),
  E(7.6, 7.8, 4.2, 1.6, JAW),
  crescent(5.4, 5, 4.5, 4, SKIN.sh, { k: 0.2, a0: 70, a1: 170 }),
  F(E(4.6, 2.2, 2.2, 0.9, SKIN.hi)),
  // A few soft scales on its crown.
  F(E(3.2, 3.6, 0.9, 0.7, SKIN.sh)),
  F(E(5, 2.9, 0.8, 0.6, SKIN.sh)),
  F(E(2.6, 5.4, 0.7, 0.6, SKIN.sh)),
];
// The face (unoutlined, on the head): one big sleepy eye with a heavy lid, a blush, a nostril and
// a little smile; snapping, the beak opens wide. Box 13 x 10, centre (6.5, 5).
const MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout']);
const faceShapes = (mood) => {
  const out = [];
  if (mood === 'dead') out.push(...deadEye(5.6, 3.6, 1.2, { c: INK, th: 0.5 }));
  else out.push(...simpleEye(5.6, 3.6, { iris: '#4a3a2a', ink: INK, lid: 0, mood: mood === 'shout' ? 'angry' : mood, s: 1, w: 1.4, h: 1.7 }));
  if (mood !== 'dead') out.push(F(E(6.4, 6.2, 1, 0.5, '#ffa8ba')));
  out.push(F(E(11.6, 4.5, 0.32, 0.28, INK)));
  if (mood === 'shout') out.push(F(T([[7.4, 7.2], [12.2, 6.4], [12, 9.4], [8, 8.6]], '#8a3a48')), F(E(10.2, 8.4, 1.2, 0.5, '#ff8a9a')));
  else out.push(...stroke([[8.4, 6.4], [10.2, 6.9], [12, 6.3]], 0.36, INK));
  if (mood === 'hurt') out.push(...tear(7.4, 5, 0.7, { type: 'stream', len: 2 }));
  if (mood === 'angry') out.push(...vein(3.6, 1.6, 0.6));
  return out;
};
// The garden on its shell. A seedling: a stem with two round leaves: box 9 x 9, its base at
// (4.5, 8.6).
const sproutShapes = () => [...stroke([[4.5, 8.6], [4.4, 5.6], [4.6, 3.8]], 0.6, FERN, false), E(2.4, 3.4, 2.2, 1.4, '#6cc468'), E(6.8, 2.8, 2.2, 1.4, '#7ccc70'), F(E(2.2, 3, 1.2, 0.5, '#a6e494')), F(E(6.6, 2.4, 1.2, 0.5, '#a6e494'))];
// A clover sprig: three round leaves on a short stem: box 8 x 8, its base at (4, 7.6).
const cloverShapes = () => [...stroke([[4, 7.6], [4.2, 4.6]], 0.5, FERN, false), E(2.6, 3.6, 1.6, 1.5, '#5fb85e'), E(5.8, 3.6, 1.6, 1.5, '#5fb85e'), E(4.2, 1.9, 1.6, 1.5, '#6cc468'), F(E(4.2, 3.4, 0.6, 0.6, '#3f8c46'))];
// A pink flower on a thin stem: box 7 x 10, its base at (3.5, 9.6).
const flowerShapes = () => {
  const out = [...stroke([[3.5, 9.6], [3.3, 6], [3.6, 3.4]], 0.5, FERN, false), E(2.2, 7.2, 1.2, 0.6, '#6cc468')];
  for (let i = 0; i < 5; i++) {
    const a = (-90 + i * 72) * D2R;
    out.push(E(3.6 + Math.cos(a) * 1.4, 2.6 + Math.sin(a) * 1.4, 1.2, 1.2, '#ffa8cc'));
  }
  out.push(F(E(3.6, 2.6, 0.9, 0.9, '#ffe36b')));
  return out;
};
// A tiny red mushroom: box 6 x 6, its base at (3, 5.8).
const shroomShapes = () => [E(3, 4.6, 1.1, 1.4, '#fff2e0'), T(arcP(3, 3.4, 2.6, 2.6, 180, 360, 10), '#ee5a5e'), F(E(2.2, 1.8, 0.5, 0.45, '#ffffff')), F(E(3.9, 2.3, 0.45, 0.4, '#ffffff'))];
// A clover leaf it munches: box 5 x 4, held at (0.6, 2).
const leafShapes = () => [E(2.4, 1.4, 1.2, 1, '#78c266'), E(3.6, 2.2, 1.2, 1, '#6cbc5e'), E(2.4, 3, 1.1, 0.9, '#84cc70'), ...stroke([[0.4, 2.2], [2.4, 2.2]], 0.35, FERN)];

const shellPart = () => part('mt|shell', 36, 22, shellShapes, 4);
const legPart = (far) => part(`mt|leg|${far ? 1 : 0}`, 7, 7, () => legShapes(far), 3);
const tailPart = () => part('mt|tail', 6, 4, tailShapes, 3);
const neckPart = (i) => part(`mt|neck|${i}`, 7, 7, () => neckShapes(i), 3);
const headPart = () => part('mt|head', 13, 10, headShapes, 4);
const facePart = (mood) => sprite(`rig|mt|face|${mood}`, () => ({ w: 13, h: 10, res: 2, soft: 'cel', crisp: true, bare: true, pad: 4, shapes: faceShapes(mood) }));
const sproutPart = () => part('mt|sprout', 9, 9, sproutShapes, 3);
const cloverPart = () => part('mt|clover', 8, 8, cloverShapes, 3);
const flowerPart = () => part('mt|flower', 7, 10, flowerShapes, 3);
const shroomPart = () => part('mt|shroom', 6, 6, shroomShapes, 3);
const leafPart = () => part('mt|leaf', 5, 4, leafShapes, 3);
// Their bare twins, for the outer-outline pass (rig.js outerOutline).
const shellBare = () => partBare('mt|shell', 36, 22, shellShapes, 4);
const legBare = (far) => partBare(`mt|leg|${far ? 1 : 0}`, 7, 7, () => legShapes(far), 3);
const tailBare = () => partBare('mt|tail', 6, 4, tailShapes, 3);
const neckBare = (i) => partBare(`mt|neck|${i}`, 7, 7, () => neckShapes(i), 3);
const headBare = () => partBare('mt|head', 13, 10, headShapes, 4);
const sproutBare = () => partBare('mt|sprout', 9, 9, sproutShapes, 3);
const cloverBare = () => partBare('mt|clover', 8, 8, cloverShapes, 3);
const flowerBare = () => partBare('mt|flower', 7, 10, flowerShapes, 3);
const shroomBare = () => partBare('mt|shroom', 6, 6, shroomShapes, 3);
const leafBare = () => partBare('mt|leaf', 5, 4, leafShapes, 3);

const faceOf = (a) => {
  if (a.face === 'dead') return 'dead';
  if (a.ph.strike > 0.25) return 'shout';
  if (a.ph.atk) return 'angry';
  if (a.blinkT) return 'blink';
  return MOODS.has(a.face) ? a.face : 'idle';
};

// ---------- Motion ----------

// The plod: one full cycle of all four feet per STRIDE px walked, on its speed eased over a
// moment. A planted foot moves back at exactly the walking speed (so it stays put on the ground),
// a lifted one swings forward on an eased arc, tucked up under the shell.
const STRIDE = 14;
const REACH = STRIDE / 4;
const LEG = 5.4; // hip to sole
const HIPY = 5.4; // the hips above the ground
const stepPhase = (m, a) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(120, Math.abs(odo - (st.mtOdo ?? odo)) / dt);
  st.mtOdo = odo;
  st.mtV = (st.mtV ?? 0) + (raw - (st.mtV ?? 0)) * Math.min(1, dt * 4);
  st.mtU = ((st.mtU ?? 0) + (st.mtV / STRIDE) * dt) % 1;
  return st.mtU;
};
// A foot: [x off its hip, lift] at walk phase u.
const footAt = (u, ph) => {
  const q = (((u + ph) % 1) + 1) % 1;
  if (q < 0.5) return [REACH - 4 * REACH * q, 0];
  const s = (q - 0.5) / 0.5;
  return [-REACH + 2 * REACH * smooth(s), Math.sin(Math.PI * s) * 1.5];
};
// The legs: [name, hip x, phase, far?]. Diagonal pairs: near-front with far-hind, far-front with
// near-hind.
const LEGS = [
  ['HF', -9.6, 0, true],
  ['FF', 8.6, 0.5, true],
  ['HN', -7.4, 0.5, false],
  ['FN', 10.8, 0, false],
];
const legDef = ([n, hx, ph, far]) => {
  const pose = (S, a) => {
    const [dx, lift] = footAt(a.mtU ?? 0, ph);
    const w = a.walkW;
    const fx = dx * w + (far ? 0 : 0);
    const th = -Math.asin(clamp(fx / LEG, -0.8, 0.8));
    // (Turned at the hip, a planted leg's sole would rise off the ground: it slides down by as
    // much, the top hidden under the rim.)
    return [hx + S.x, -HIPY - S.lift * 0.3 + LEG * (1 - Math.cos(th)) - lift * w + (far ? -0.6 : 0), th];
  };
  return { name: `leg${n}`, parent: null, s: () => legPart(far), b: () => legBare(far), pivot: [3.5, 0.5], at: (S, a) => pose(S, a), rot: (S, a) => pose(S, a)[2] };
};
// The neck: from its root under the front of the shell, out along `nAng` by `ext`.
const NECK = [13.4, -4.2];
const neckPt = (S, k) => [NECK[0] + Math.cos(S.nAng * D2R) * S.ext * k, NECK[1] + Math.sin(S.nAng * D2R) * S.ext * k];

// The idle loop, every 11 s: a rest, a long slow look up with a blink, a rest, a munch.
const LOOP = 11;
const ramp01 = (u, a, b, c, d) => (u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u < c ? 1 : 1 - smooth((u - c) / (d - c)));

export const mosstortRig = makeRig({
  w: 40,
  h: 30,
  soft: true,
  stride: STRIDE,
  recover: 0.6,
  springs: {
    // (Heavy and slow: the shell eases, the neck slides.)
    x: [160, 18],
    lift: [140, 16],
    tilt: [110, 12],
    ext: [90, 13],
    nAng: [70, 12],
    hRot: [90, 12],
    munch: [120, 16],
    // Loose: the garden on top sways on after every move.
    fern: [60, 4],
    fern2: [70, 4.5],
    flower: [80, 4],
    shroom: [140, 9],
  },
  fast: ['ext', 'nAng', 'tilt', 'x'],
  kick: { ext: -70, tilt: -120, fern: 300, fern2: -260, flower: 280 },
  turnKick: { tilt: 90, fern: 160, flower: 140 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 1.23;
    const u = stepPhase(m, a);
    a.mtU = u;
    const lu = t % LOOP;
    const up = ramp01(lu, 1.6, 2.8, 4.6, 5.8);
    const munch = ramp01(lu, 7.2, 8, 9.6, 10.3);
    const chew = munch > 0.8 ? Math.sin(t * 6) : 0;
    a.blinkT = up > 0.9 && (lu % 1.8) < 0.22;
    a.munching = munch;
    const breath = Math.sin(t * 1.4);
    const idle = {
      x: 0,
      lift: breath * 0.15,
      tilt: breath * 0.4 - up * 1.5,
      ext: 7 + breath * 0.25 + up * 1 + munch * 1.6,
      nAng: -6 - up * 26 + munch * 34,
      hRot: -up * 12 + munch * 16 + chew * 3,
      munch,
    };
    // The plod: the shell rocks forward and back a hair with each step and rises over the planted
    // feet; the head nods with it, a beat behind.
    const p = u * TAU * 2;
    const walk = { x: 0, lift: (0.5 - 0.5 * Math.cos(p)) * 0.5, tilt: Math.sin(p) * 1.1, ext: 7.6, nAng: -4 + Math.sin(p - 0.8) * 3, hRot: Math.sin(p - 1.2) * 3, munch: 0 };
    // The snap: head pulled right in, hunkered and rocked back; then the neck shoots out.
    const antic = { x: -1.5, lift: -0.6, tilt: -3, ext: 0, nAng: -4, hRot: 0, munch: 0 };
    const strike = { x: 3, lift: 0.2, tilt: 5, ext: 15, nAng: 4, hRot: 6, munch: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow(S, a) {
    // (A slow breeze sways the garden too.)
    const breeze = Math.sin(a.t * 0.8 + 1.1);
    return {
      fern: -S.tilt * 4 - S.x * 2 + breeze * 4,
      fern2: -S.tilt * 3.6 - S.x * 2 + breeze * 3,
      flower: -S.tilt * 5 - S.x * 2.4 + breeze * 5,
      shroom: -S.tilt * 1.5,
    };
  },
  // (Only its outer edge outlined: rig.js outerOutline.)
  parts: outerOutline([
    // Far legs and the tail behind the shell; the neck and head behind it too, so the head pulls
    // in behind the rim.
    legDef(LEGS[0]),
    legDef(LEGS[1]),
    { name: 'body', parent: null, at: (S) => [S.x, -HIPY + 1.4 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'tail', parent: 'body', s: tailPart, b: tailBare, pivot: [5, 2], at: () => [-16.4, -1.2], rot: (S, a) => (Math.sin(a.t * 1.3) * 6 - S.tilt) * D2R },
    // (Four rings, so even stretched right out for a snap the neck stays whole.)
    ...[0.2, 0.42, 0.64, 0.84].map((k, i) => ({ name: `neck${i}`, parent: 'body', s: () => neckPart(i % 2), b: () => neckBare(i % 2), pivot: [3.5, 3.5], at: (S) => neckPt(S, k) })),
    { name: 'neckEnd', parent: 'body', at: (S) => neckPt(S, 1), rot: (S) => (S.nAng * 0.6 + S.hRot) * D2R },
    { name: 'head', parent: 'neckEnd', s: headPart, b: headBare, pivot: [2.6, 6], at: () => [0, 0] },
    { name: 'face', parent: 'neckEnd', top: true, s: (a) => facePart(faceOf(a)), pivot: [6.5, 5], at: () => [3.9, -1] },
    { name: 'leaf', parent: 'neckEnd', s: leafPart, b: leafBare, pivot: [0.6, 2], at: () => [9.6, 1.6], rot: () => 20 * D2R, alpha: (a, S) => clamp((S.munch - 0.75) * 5, 0, 1) },
    // The shell, then the near legs in front of its rim.
    { name: 'shell', parent: 'body', s: shellPart, b: shellBare, pivot: [18, 21] },
    { name: 'fern2', parent: 'body', s: cloverPart, b: cloverBare, pivot: [4, 7.6], at: () => [-8.4, -19], rot: (S) => (-16 + S.fern2) * D2R },
    { name: 'fern', parent: 'body', s: sproutPart, b: sproutBare, pivot: [4.5, 8.6], at: () => [-2.6, -20.6], rot: (S) => (-4 + S.fern) * D2R },
    { name: 'shroom', parent: 'body', s: shroomPart, b: shroomBare, pivot: [3, 5.8], at: () => [7.8, -17.4], rot: (S) => (10 + S.shroom) * D2R },
    { name: 'flower', parent: 'body', s: flowerPart, b: flowerBare, pivot: [3.5, 9.6], at: () => [3.2, -19.8], rot: (S) => (8 + S.flower) * D2R },
    legDef(LEGS[2]),
    legDef(LEGS[3]),
  ]),
});

// ---------- Stills ----------

const shift = (shapes, dx, dy) => shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: 0, y: 0, pts: s.pts.map(([x, y]) => [x + (s.x ?? 0) + dx, y + (s.y ?? 0) + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));

// Standing, head out.
export function mosstortStill(pose, f, mood) {
  const fm = mood === 'dead' ? 'dead' : MOODS.has(mood) ? mood : 'idle';
  const ox = 20;
  const gy = 31;
  const by = gy - HIPY + 1.4;
  const nx = ox + NECK[0] + 7;
  const ny = by + NECK[1] - 0.8;
  return {
    w: 44,
    h: 34,
    res: 3,
    shapes: [
      ...shift(legShapes(true), ox - 9.6 - 3.5, gy - HIPY - 0.6 - 0.5),
      ...shift(legShapes(true), ox + 8.6 - 3.5, gy - HIPY - 0.6 - 0.5),
      ...shift(tailShapes(), ox - 16.4 - 5, by - 1.2 - 2),
      ...shift(neckShapes(0), ox + NECK[0] + 2.9 - 3.5, by + NECK[1] - 0.3 - 3.5),
      ...shift(neckShapes(1), ox + NECK[0] + 5.4 - 3.5, by + NECK[1] - 0.6 - 3.5),
      ...shift(headShapes(), nx - 2.6, ny - 6),
      ...shift(faceShapes(fm), nx + 3.9 - 6.5, ny - 1 - 5),
      ...shift(shellShapes(), ox - 18, by - 21),
      ...shift(cloverShapes(), ox - 8.4 - 4, by - 19 - 7.6),
      ...shift(sproutShapes(), ox - 2.6 - 4.5, by - 20.6 - 8.6),
      ...shift(shroomShapes(), ox + 7.8 - 3, by - 17.4 - 5.8),
      ...shift(flowerShapes(), ox + 3.2 - 3.5, by - 19.8 - 9.6),
      ...shift(legShapes(false), ox - 7.4 - 3.5, gy - HIPY - 0.5),
      ...shift(legShapes(false), ox + 10.8 - 3.5, gy - HIPY - 0.5),
    ],
  };
}
