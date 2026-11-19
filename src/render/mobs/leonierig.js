// Leonie, the Lioness Acrobat (redrawn 2026-11-19, the player's pick "A, the Lion Tamer
// Lioness"): the Big Top's star in the tamer's own clothes: a red tamer's jacket with gold frogging
// and epaulettes, a fluffy cream ruff, a red kepi with a gold star, white breeches, tall black
// boots, a lioness's tail with a dark tuft. A gold hoop with ribbons in one paw, a feather baton in
// the other.
//
// How she moves:
//   idle    a 10 s act: a wave to the crowd with the baton; the hoop twirled round her wrist; a
//           "ta-da!", both arms flung out, chin up.
//   walk    a proud parade march, knees high, baton swinging.
//   fight   (world/carnival.js) a plain swing is a crack of the baton; the pounce (m.aloft): a
//           crouch, up to the trapeze (out of sight), then down on the mark, tucked, landing in a
//           crouch; the rings of fire (m.hoopsAt) the hoop held high; the roar (m.roarAt) at half
//           health, leaning in, and angry from then on (m.mech.roared).

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, window1, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, sparkle, puff } from './rigkit.js';
import { chibiLegs } from './chibilegs.js';

const smoothPts = (pts, n = 3) => {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const out = [];
    for (let i = 0; i < q.length; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      out.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    q = out;
  }
  return q;
};
const blob = (pts, c, n = 3) => T(smoothPts(pts, n), c);
const INK = '#2e1c26';
const line = (pts, w, c = INK) => stroke(pts, w, c).map(F);
const star = (x, y, r, c, k = 0.45) => T(Array.from({ length: 10 }, (_, i) => { const q = (i / 10) * TAU - Math.PI / 2; const rr = i % 2 ? r * k : r; return [x + Math.cos(q) * rr, y + Math.sin(q) * rr]; }), c);
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

const FUR = ramp('#e8a850', { step: 9, turn: 10 });
const TUFT = '#a8682a';
const CREAM = '#fff0d0';
const RED = ramp('#d83a4a', { step: 9, turn: 8 });
const GOLD = ramp('#f6c84a', { step: 9, turn: 8 });
const BOOT = ramp('#3a2a34', { step: 7, turn: 8 });
const WHITE = ramp('#faf4ee', { step: 6, turn: 8 });
const lo = pairOf('lo2');

// ---------- The pieces (each facing right) ----------
// Her head: round, ears out at the sides, cheek fluff, a cream muzzle with a nose under and
// between the eyes, and her red kepi with its gold band, black peak and star. Box 44 x 50; the
// neck at (22, 46), the head's middle at (22, 29).
const headP = () => [
  E(8, 23, 5, 5, FUR.base), F(E(8, 23.4, 2.6, 2.6, '#ffb0a0')), E(36.4, 22, 5, 5, FUR.base), F(E(36.4, 22.4, 2.6, 2.6, '#ffb0a0')),
  blob([[8, 34], [5, 40], [11, 38], [12, 42], [16, 39]], FUR.base, 1),
  E(22, 29, 15.5, 14.5, FUR.base), crescent(22, 29, 15.5, 14.5, FUR.sh, { k: 0.15, a0: 110, a1: 220 }),
  F(E(24.6, 35.6, 6.2, 4.4, CREAM)), F(T([[23, 32.6], [26.6, 32.6], [24.8, 34.6]], '#a04a4a')), ...line([[24.8, 34.6], [24.8, 35.8]], 0.5),
  blob([[9.6, 22], [34.4, 20], [32, 9], [13, 10]], RED.base, 2), crescent(22, 15, 11, 7, RED.sh, { k: 0.25, a0: 150, a1: 220 }),
  F(taper([[10, 21.4], [34, 19.4]], 3, 3, GOLD.base)), blob([[26, 20.4], [39, 19.6], [37, 23.4], [27, 23]], BOOT.base, 1), F(star(22, 14.6, 3, GOLD.base)),
];
const FACE = { eyes: [[27.6, 27.8, 3.4, 4.2, 1], [17.8, 28.2, 3, 3.8, -1]], mouth: [24.8, 37.6, 2.6], blush: [[29.8, 32.6, 2.2], [15.4, 32.8, 1.8]], iris: '#c87a1a', k: 1.7, lid: 0, lashes: 1 };
const loFace = (mood) => faceSprite(`lo2|face|${mood}`, 44, 50, () => faceShapes(mood, FACE));
// The fluffy cream ruff at her collar. Box 32 x 12; the neck at (16, 5).
const ruffP = () => [...[[4, 6], [9, 4], [16, 3.4], [23, 4], [28, 6]].map(([x, y]) => E(x, y, 4.6, 4, CREAM)), F(E(16, 8, 10, 2.4, '#f4dcb0'))];
// The jacket: red, gold frogging, epaulettes, a black belt with a gold buckle. Box 30 x 32; bodyJ at (15, 26).
const jacketP = () => [
  blob([[4, 3], [26, 3], [28, 18], [26, 30], [4, 30], [2, 18]], RED.base, 2), crescent(15, 17, 13, 14, RED.sh, { k: 0.2, a0: 100, a1: 200 }),
  ...[9, 14, 19].map((y) => F(taper([[14, y], [25, y - 0.4]], 1.4, 1.4, GOLD.base))), ...[9, 14, 19].map((y) => F(E(14, y, 1.1, 1.1, GOLD.hi))),
  F(R(3, 23, 24, 3.2, BOOT.base)), F(E(16, 24.6, 2, 1.8, GOLD.base)),
];
const epauletteP = () => [E(5, 3, 4, 2.8, GOLD.base), ...[2.4, 4, 5.6, 7.2].flatMap((x) => line([[x, 4.6], [x - 0.4, 7.4]], 0.5, GOLD.sh))];
// The jacket's tails behind. Box 16 x 18; hung from (12, 1).
const tailsP = () => [blob([[13, 1], [4, 3], [1, 16], [8, 14], [13, 8]], RED.sh, 2), F(taper([[3, 14], [8, 12.6]], 1, 0.8, GOLD.base))];
// Legs: white breeches to the knee, tall black boots with a gold cuff.
const thighP = (far) => () => [taper([[4.5, 2], [4.5, 9.6]], 7.6, 7, far ? WHITE.sh : WHITE.base), E(4.5, 9.6, 3.5, 3.5, far ? WHITE.sh : WHITE.base)];
const shinP = (far) => () => [E(4.5, 2, 3.5, 3.5, far ? BOOT.sh : BOOT.base), taper([[4.5, 2], [4.5, 9]], 7, 6.6, far ? BOOT.sh : BOOT.base), F(taper([[1.4, 3.4], [7.6, 3.4]], 1.2, 1.2, GOLD.base))];
const bootP = (far) => () => [blob([[1, 0.4], [7.6, 0.4], [11.6, 3.6], [11, 6], [0.6, 6]], far ? BOOT.sh : BOOT.base, 1), F(taper([[1, 5.4], [11, 5.4]], 1.2, 1.2, BOOT.deep)), F(E(8, 2.4, 1.4, 0.7, '#6a5a64'))];
// Arms: a red sleeve, a gold cuff, a paw. Upper: box 12 x 9 at (2, 4.5); fore: box 14 x 9 at (2, 4.5).
const upP = (far) => () => [taper([[2, 4.5], [8, 4.5]], 7, 6.4, RED.deep), E(8, 4.5, 3.3, 3.3, RED.deep), taper([[2, 4.5], [8, 4.5]], 5.6, 5, far ? RED.sh : RED.base), E(8, 4.5, 2.6, 2.6, far ? RED.sh : RED.base)];
const foreP = (far) => () => [E(2, 4.5, 3.3, 3.3, RED.deep), taper([[2, 4.5], [7, 4.5]], 6.4, 6, RED.deep), E(2, 4.5, 2.6, 2.6, far ? RED.sh : RED.base), taper([[2, 4.5], [7, 4.5]], 5, 4.6, far ? RED.sh : RED.base), F(taper([[6.6, 2.4], [6.6, 6.6]], 1.4, 1.4, GOLD.base)), E(9.8, 4.5, 3.2, 3, far ? FUR.sh : FUR.base)];
// The tail: a curving rope of fur, then the dark tuft. Root: box 22 x 10 at (2, 5); tip: box 22 x 14 at (2, 7).
const tail1P = () => [taper([[2, 5], [19, 5]], 4.6, 3.8, FUR.base)];
const tail2P = () => [E(2, 7, 1.9, 1.9, FUR.base), taper([[2, 7], [13, 7]], 3.8, 3.2, FUR.base), E(16.4, 7, 4.6, 5, TUFT), F(E(15, 5.4, 1.4, 1, '#c88a4a'))];
// The hoop: a gold ring, ribbons at the grip. Box 30 x 32; gripped at (15, 29).
const hoopP = () => [...stroke(arcP(15, 15, 12.6, 12.6, 0, 360, 30), 2.4, GOLD.base, false), F(E(15, 28, 2.2, 1.8, GOLD.sh)), F(blob([[15, 28], [10, 31], [12, 26]], '#ff6a8a', 1)), F(blob([[15, 28], [20, 31.4], [18, 26]], '#ffd0e0', 1))];
// The baton: gold, a pink feather plume on top. Box 12 x 32; gripped at (6, 26).
const batonP = () => [taper([[6, 30], [6, 9]], 1.8, 1.4, GOLD.base), E(6, 30, 1.6, 1.6, GOLD.sh), blob([[6, 10], [3, 4], [5, 0.6], [9, 2], [8.4, 7]], '#ff8ab0', 2), F(taper([[6, 9], [6.6, 2]], 0.5, 0.3, '#ffd0e0'))];

const SP = {
  HEAD: lo('head', 44, 50, headP, 2), RUFF: lo('ruff', 32, 12, ruffP, 2), JACKET: lo('jacket', 30, 32, jacketP, 2), EPA: lo('epa', 10, 9, epauletteP, 2), TAILS: lo('tails', 16, 18, tailsP, 2),
  THIGH: [false, true].map((f) => lo(`thigh${f ? 1 : 0}`, 9, 14, thighP(f), 2)), SHIN: [false, true].map((f) => lo(`shin${f ? 1 : 0}`, 9, 12, shinP(f), 2)), BOOT: [false, true].map((f) => lo(`boot${f ? 1 : 0}`, 13, 7, bootP(f), 2)),
  UP: [false, true].map((f) => lo(`up${f ? 1 : 0}`, 12, 9, upP(f), 2)), FORE: [false, true].map((f) => lo(`fore${f ? 1 : 0}`, 14, 9, foreP(f), 2)),
  T1: lo('tail1', 22, 10, tail1P, 2), T2: lo('tail2', 22, 14, tail2P, 2), HOOP: lo('hoop', 30, 32, hoopP, 2), BATON: lo('baton', 12, 32, batonP, 2),
};

// ---------- The skeleton ----------
const BODY_Y = 22;
const L1 = 8;
const L2 = 8;
const LEGS = chibiLegs({ bodyY: BODY_Y, l1: L1, l2: L2, sole: 5, hips: [[5, 2], [-4, 2]], feet: [6, -5] });
const FEET = [6, -5];
const SHN = [8, -17];
const SHF = [-7, -17];
const NECK = [1, -22];
const UA = 7;
// The pounce, from world/carnival.js's m.aloft = { x, at } (1.8 s): a crouch, up to the trapeze,
// hanging there out of sight, then down onto the mark, tucked, and a landing crouch.
function leap(m, now) {
  const L = m.aloft;
  if (!L) return { jump: 0, dx: 0, tuck: 0, crouch: 0 };
  const u = clamp(1 - (L.at - now) / 1.8, 0, 1);
  const up = smooth(clamp((u - 0.08) / 0.2, 0, 1));
  const down = smooth(clamp((u - 0.74) / 0.26, 0, 1));
  return { jump: 300 * up * (1 - down) + Math.sin(down * Math.PI) * 26, dx: (L.x - m.x) * down, tuck: Math.max(Math.sin(up * Math.PI), Math.sin(down * Math.PI)), crouch: u < 0.1 ? Math.sin((u / 0.1) * Math.PI) : 0 };
}
export const leonieRig = makeRig({
  w: 120, h: 120, soft: true, stride: 1e9, recover: 0.55,
  springs: {
    x: [240, 17], lift: [240, 17], tilt: [180, 13], head: [150, 11], tail: [90, 8], tail2: [80, 7], baton: [200, 14], hoop: [160, 12],
    armN: [240, 17], elbN: [240, 17], armF: [220, 16], elbF: [220, 16],
    thighN: [360, 22], thighF: [360, 22], shinN: [360, 22], shinF: [360, 22], rollN: [340, 20], rollF: [340, 20],
  },
  fast: ['x', 'lift', 'tilt', 'armN', 'elbN', 'armF', 'elbF', 'thighN', 'thighF', 'shinN', 'shinF', 'baton'],
  kick: { tilt: -120, head: -160, tail: 160 },
  turnKick: { tail: 200, head: 60 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 1.13;
    const t = a.t + a.uidOff;
    const now = a.now;
    const u = stepPhase(m, a, 'lo2', 22);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const mad = m.mech?.roared ? 1 : 0;
    const L = (a.loLeap = leap(m, now));
    const lu = fr(t / 10) * 10;
    const busy = active || walkW > 0.05 || m.aloft || m.cine || m.aggroUntil === Infinity;
    const wave = busy ? 0 : hold(lu, 1.6, 2, 3.4, 3.8);
    const twirl = busy ? 0 : hold(lu, 4.8, 5.2, 7.2, 7.6);
    const tada = busy ? 0 : hold(lu, 8.2, 8.5, 9.4, 9.8);
    // (The hoop goes round her wrist a whole number of times, speeding up and slowing down.)
    a.loSpin = 360 * 4 * smooth(clamp((lu - 4.8) / 2.8, 0, 1)) * (busy ? 0 : 1);
    const br = Math.sin(t * 1.6);
    const liftI = br * 0.5 - mad * 0.6;
    const tiltI = br * 1.2 + mad * 4 - tada * 4;
    const idle = {
      x: 0, lift: liftI, tilt: tiltI, head: Math.sin(t * 1.1) * 3 - tada * 10 + mad * 4, tail: 165 + Math.sin(t * 2.4) * 8 + mad * Math.sin(t * 9) * 8, tail2: 70 + Math.sin(t * 2.4 - 1) * 14,
      armN: 70 - wave * 80 - tada * 110, elbN: -40 - wave * 30 + wave * Math.sin(t * 10) * 14 + tada * 30, baton: -20 + wave * 50 + wave * Math.sin(t * 10) * 16,
      armF: 140 - twirl * 60 - tada * 190, elbF: -20 - twirl * 20 + tada * -10, hoop: 0,
      ...LEGS.at(liftI, tiltI, [FEET[0] + tada * 3, 0], [FEET[1] - tada * 2, 0]),
    };
    // The parade march: knees high, the baton swinging, chin up.
    const steps = [pawStep(u, 0, 22, 0.58, 6), pawStep(u, 0.5, 22, 0.58, 6)];
    const sw = Math.sin(u * TAU);
    const bob = Math.abs(Math.cos(u * TAU));
    const liftW = 0.6 + bob * 1.8;
    const tiltW = 3;
    const walk = {
      ...idle, lift: liftW, tilt: tiltW, head: -4 + sw * 2, tail: 170 + sw * 10, tail2: 60 - sw * 18,
      armN: 70 + sw * 36, elbN: -50, baton: -10 + sw * 20, armF: 130 - sw * 20, elbF: -20,
      ...LEGS.at(liftW, tiltW, [FEET[0] + steps[0][0], steps[0][1]], [FEET[1] + steps[1][0], steps[1][1]]),
    };
    // The baton's crack: raised high behind her head, then down and out ahead.
    const antic = { ...idle, x: -3, lift: 0.6, tilt: -10, head: -8, armN: 170, elbN: -30, baton: -100, armF: 30, elbF: -30, tail: 140, ...LEGS.at(0.6, -10, [FEET[0] - 2, 0], [FEET[1] - 3, 0]) };
    const strike = { ...idle, x: 7, lift: -1.6, tilt: 16, head: 6, armN: 0, elbN: 0, baton: 80, armF: -100, elbF: -30, tail: 175, ...LEGS.at(-1.6, 16, [FEET[0] + 7, 0], [FEET[1] - 1, 0]) };
    const S = stateBlend(a, idle, walk, antic, strike);
    const over = (P, w) => {
      if (w <= 0.001) return;
      for (const k of Object.keys(P)) S[k] += (P[k] - S[k]) * w;
    };
    // The pounce: crouch, then tucked in the air; a landing crouch.
    if (m.aloft) {
      over({ lift: -6, tilt: 14, head: -10, armN: 40, elbN: -60, armF: 40, elbF: -60, ...LEGS.at(-6, 14, [FEET[0] + 2, 0], [FEET[1] - 2, 0]) }, L.crouch);
      over({ tilt: 20, head: -16, armN: -20, elbN: -40, armF: -30, elbF: -40, tail: 120, thighN: -80, shinN: 120, thighF: -70, shinF: 110, rollN: 0, rollF: 0 }, L.tuck);
    }
    // The rings of fire: the hoop held up high.
    const rings = window1(now, m.hoopsAt, 2, 0.25, 0.4);
    over({ armF: -130, elbF: -40, hoop: 0, head: -8, tilt: -4 }, rings);
    // The roar: leaning in, arms flung back, mouth wide.
    const roar = window1(now, m.roarAt, 1.4, 0.15, 0.4);
    over({ lift: -2, tilt: 18, head: 10, armN: 150, elbN: -20, armF: 140, elbF: -20, tail: 200, ...LEGS.at(-2, 18, [FEET[0] + 4, 0], [FEET[1] - 6, 0]) }, roar);
    if (m.hp <= 0) over({ lift: -12, tilt: -10, head: 16, armN: 70, elbN: 20, armF: 100, elbF: 20, ...LEGS.at(-12, -10, [FEET[0] + 10, 2], [FEET[1] + 14, 2]) }, 1);
    a.loRings = rings;
    a.loRoar = roar;
    a.loMood = m.hp <= 0 ? 'dead' : moodOf(a, roar > 0.3 ? 'shout' : mad || m.aloft ? 'angry' : wave > 0.4 || tada > 0.4 || twirl > 0.4 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S, a) => [S.x + (a.loLeap?.dx ?? 0), -BODY_Y - S.lift - (a.loLeap?.jump ?? 0)], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => NECK, rot: (S) => (S.head - S.tilt * 0.3) * D2R },
    { name: 'kneeN', parent: 'thighN', at: () => [0, L1] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, L1] },
    { name: 'ankleN', parent: 'shinN', at: () => [0, L2] },
    { name: 'ankleF', parent: 'shinF', at: () => [0, L2] },
    { name: 'elbowN', parent: 'upN', at: () => [UA, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [UA, 0] },
    { name: 'pawN', parent: 'foreN', at: () => [10, 0] },
    { name: 'pawF', parent: 'foreF', at: () => [10, 0] },
    { name: 'tailEnd', parent: 'tail1', at: () => [18, 0] },
    ...[0, 1].flatMap((pass) => {
      const i = pass;
      const tg = pass ? 'b' : '';
      const leg = (far) => {
        const k = far ? 'F' : 'N';
        const j = far ? 1 : 0;
        return [
          { name: `boot${k}${tg}`, parent: `ankle${k}`, s: SP.BOOT[j][i], pivot: [4, 1], rot: (S) => -(S.tilt + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
          { name: `shin${k}${tg}`, parent: `knee${k}`, s: SP.SHIN[j][i], pivot: [4.5, 2], rot: (S) => S[`shin${k}`] * D2R },
          { name: `thigh${k}${tg}`, parent: 'bodyJ', s: SP.THIGH[j][i], pivot: [4.5, 2], at: () => (far ? [-4, 2] : [5, 2]), rot: (S) => S[`thigh${k}`] * D2R },
        ];
      };
      const arm = (far) => {
        const k = far ? 'F' : 'N';
        const j = far ? 1 : 0;
        return [
          { name: `up${k}${tg}`, parent: 'bodyJ', s: SP.UP[j][i], pivot: [2, 4.5], at: () => (far ? SHF : SHN), rot: (S) => S[`arm${k}`] * D2R },
          { name: `fore${k}${tg}`, parent: `elbow${k}`, s: SP.FORE[j][i], pivot: [2, 4.5], rot: (S) => S[`elb${k}`] * D2R },
        ];
      };
      return [
        { name: `hoop${tg}`, parent: 'pawF', s: SP.HOOP[i], pivot: [15, 29], rot: (S, a) => (-(S.tilt + S.armF + S.elbF) + S.hoop + (a.loSpin ?? 0)) * D2R },
        { name: `tail2${tg}`, parent: 'tailEnd', s: SP.T2[i], pivot: [2, 7], rot: (S) => S.tail2 * D2R, soft: { key: 'tail2', dir: [14, 0], k: 90, c: 6, gain: 0.5, turn: 0.8, max: 22 } },
        { name: `tail1${tg}`, parent: 'bodyJ', s: SP.T1[i], pivot: [2, 5], at: () => [-10, 0], rot: (S) => S.tail * D2R },
        { name: `tails${tg}`, parent: 'bodyJ', s: SP.TAILS[i], pivot: [12, 1], at: () => [-8, 2], soft: { key: 'tails', dir: [-4, 8], k: 95, c: 6.5, gain: 0.55, turn: 0.9, hang: 0.55, max: 16 } },
        ...arm(true),
        ...leg(true), ...leg(false),
        { name: `jacket${tg}`, parent: 'bodyJ', s: SP.JACKET[i], pivot: [15, 26] },
        { name: `epaF${tg}`, parent: 'bodyJ', s: SP.EPA[i], pivot: [5, 3], at: () => [-9, -20] },
        { name: `ruff${tg}`, parent: 'headJ', s: SP.RUFF[i], pivot: [16, 5], at: () => [0, 1] },
        { name: `head${tg}`, parent: 'headJ', s: SP.HEAD[i], pivot: [22, 46] },
        ...(pass ? [{ name: 'face', parent: 'headJ', s: (a) => loFace(a.loMood ?? 'idle'), pivot: [22, 46] }] : []),
        { name: `epaN${tg}`, parent: 'bodyJ', s: SP.EPA[i], pivot: [5, 3], at: () => [9, -20] },
        { name: `baton${tg}`, parent: 'pawN', s: SP.BATON[i], pivot: [6, 26], rot: (S) => (S.baton - S.tilt - S.armN - S.elbN) * D2R },
        ...arm(false),
      ];
    }),
  ],
  under(ctx, m, a) {
    const k = clamp(1 - (a.loLeap?.jump ?? 0) / 120, 0.3, 1);
    ctx.globalAlpha = a.alpha * 0.22 * k;
    ctx.fillStyle = '#2a1a2a';
    ctx.beginPath();
    ctx.ellipse(a.loLeap?.dx ?? 0, -0.6, 22 * k, 3.4 * k, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // The hoop held up for the rings: little flames licking round it.
    if (a.loRings > 0.05) {
      const M = mat('hoop');
      for (let k = 0; k < 9; k++) {
        const q = (k / 9) * TAU + a.now * 3;
        const [x, y] = at2(M, Math.cos(q) * 12.6, -14 + Math.sin(q) * 12.6);
        const f = 0.6 + 0.4 * Math.sin(a.now * 14 + k * 1.7);
        puff(ctx, a, x, y - 2 * f, 3.4 * f, a.loRings * 0.7, k % 2 ? '255,170,60' : '255,220,90');
      }
    }
    // The roar: rings of sound rolling out.
    if (a.loRoar > 0.05) {
      const [hx, hy] = at2(mat('headJ'), 8, -14);
      for (let k = 0; k < 3; k++) {
        const u = fr(a.now * 2 + k / 3);
        ctx.globalAlpha = a.alpha * a.loRoar * (1 - u);
        ctx.strokeStyle = '#fff2c8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hx + 6, hy, 8 + u * 40, -0.7, 0.7);
        ctx.stroke();
      }
    }
    // A sparkle off the baton as it cracks.
    if (a.ph.strike > 0.2) {
      const [bx, by] = at2(mat('baton'), 0, -22);
      sparkle(ctx, a, bx, by, 6 * a.ph.strike, a.ph.strike);
    }
  },
});
// A still of her standing (for anywhere a sprite is wanted), her mood's face.
export function leonieStill(pose, f, mood) {
  const by = -BODY_Y;
  const [nx, ny] = [NECK[0], by + NECK[1]];
  const Lg = LEGS.at(0, 0);
  const leg = (k, far) => {
    const [hx, hy] = far ? [-4, 2] : [5, 2];
    const th = Lg[`thigh${k}`];
    const sh = Lg[`shin${k}`];
    const kx = hx - Math.sin(th * D2R) * L1;
    const ky = by + hy + Math.cos(th * D2R) * L1;
    const ax = kx - Math.sin((th + sh) * D2R) * L2;
    const ay = ky + Math.cos((th + sh) * D2R) * L2;
    return [...put(thighP(far)(), [4.5, 2], hx, by + hy, th), ...put(shinP(far)(), [4.5, 2], kx, ky, th + sh), ...put(bootP(far)(), [4, 1], ax, ay, 0)];
  };
  const arm = (far, a1, a2) => {
    const [sx, sy] = far ? SHF : SHN;
    const ex = sx + Math.cos(a1 * D2R) * UA;
    const ey = by + sy + Math.sin(a1 * D2R) * UA;
    return [...put(upP(far)(), [2, 4.5], sx, by + sy, a1), ...put(foreP(far)(), [2, 4.5], ex, ey, a1 + a2)];
  };
  return {
    w: 120,
    h: 120,
    res: 2,
    shapes: shift([
      ...put(tail2P(), [2, 7], -10 + Math.cos(165 * D2R) * 18, by + Math.sin(165 * D2R) * 18, 235), ...put(tail1P(), [2, 5], -10, by, 165), ...put(tailsP(), [12, 1], -8, by + 2),
      ...arm(true, 140, -20), ...leg('F', true), ...leg('N', false), ...put(jacketP(), [15, 26], 0, by),
      ...put(ruffP(), [16, 5], nx, ny + 1), ...put(headP(), [22, 46], nx, ny), ...put(faceShapes(MOODS.has(mood) ? mood : 'idle', FACE), [22, 46], nx, ny),
      ...arm(false, 70, -40),
    ], 60, 116),
  };
}
