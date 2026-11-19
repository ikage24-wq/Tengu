// The Eclipse Twins (redrawn 2026-11-18, the player's pick "B, the Sun Knight and the Moon
// Knight"): Sol, a little sun fox knight, and Luna, a little moon bunny knight. No dresses: each
// wears a breastplate over a tabard, a two-piece cape, boots, and her own circlet; their legs show,
// so their walks read.
//
//   Sol    bright and bouncy. A gold breastplate with a sun on it over a red-orange tabard, a red
//          cape lined gold, a gold circlet with a star, a big fluffy fox tail. Her weapon is the
//          round sun shield. She marches with high knees and a bounce, swinging her free arm; she
//          bounces on her toes, twirls her shield, hops.
//   Luna   dreamy and slow. A pale silver breastplate with a crescent over a starry night-blue
//          tabard, a night-blue cape, a crescent circlet, long ears, a puff of a tail. Her weapon
//          is a tall crescent glaive. She glides in long calm steps, the glaive upright at her
//          side; she sways sleepily, yawns, nods off and jolts awake.
//   Alone (her sister down), each droops: Sol's ears and tail fall, Luna's ears flop, both sad.
//
// Rigged on rig.js, outer outline only (an outlined pass, then the same parts bare), faces bare.
// Their props never cover their faces: whenever the shield or the glaive would overlap the head,
// it (and the forearm holding it) is drawn behind the head. Each cast has its own move
// (world/observatory.js sets m.castPose).

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, faceShapes, sparkle, puff } from './rigkit.js';

const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const sized = (rig, k) => {
  const draw = rig.draw;
  rig.draw = (ctx, m, a) => {
    ctx.save();
    ctx.scale(k, k);
    draw(ctx, m, a);
    ctx.restore();
  };
  rig.w = Math.round(rig.w * k);
  rig.h = Math.round(rig.h * k);
  return rig;
};
const star5 = (x, y, r, c) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return T(pts, c);
};
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
const blob = (pts, c) => T(smoothPts(pts), c);
const ovl = (cx, cy, rx, ry, deg, c, n = 14) => {
  const r = deg * D2R;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    pts.push([cx + Math.cos(a) * rx * Math.cos(r) - Math.sin(a) * ry * Math.sin(r), cy + Math.cos(a) * rx * Math.sin(r) + Math.sin(a) * ry * Math.cos(r)]);
  }
  return T(pts, c);
};
const INK = '#2e1c26';
const line = (pts, w, c = INK) => stroke(pts, w, c).map(F);
const aim = (want, arm, elb, tilt = 0) => want - arm - elb - tilt;

const FOX = ramp('#ffa04a', { step: 9, turn: 10 });
const BUN = ramp('#eceaff', { step: 7, turn: 10, lift: 3 });
const SUN = ramp('#ffd36b', { step: 10, turn: 8 });
const NIGHT = ramp('#4a5ac8', { step: 10, turn: 8, lift: 12 });
const SILVER = ramp('#c8d4f0', { step: 8, turn: 8, lift: 6 });
const MOON = '#d8e4ff';
const tw = pairOf('tw2');

// ---------- Parts (box w x h; the pivot is where each hangs) ----------
// (Chest space: the chest joint sits 2 above the hip, 18 above the floor; shoulders at (7, -21)
// and (-7, -22); the neck at (0, -24); the head's centre 13 above the neck.)
const HX = 18;
const HY = 16;
// The fox head: round, cheek fluff, a cream muzzle reaching forward, a dark nose, a gold circlet
// with a star. Box 36 x 32; the neck at (19, 29).
const foxHead = () => [
  blob([[HX - 13, HY + 2], [HX - 17, HY + 8], [HX - 12, HY + 8], [HX - 13, HY + 12], [HX - 7, HY + 10]], FOX.base),
  E(HX, HY, 14, 12.6, FOX.base), crescent(HX, HY, 14, 12.6, FOX.sh, { k: 0.15, a0: 110, a1: 210 }),
  F(blob([[HX - 2, HY + 3], [HX + 6, HY + 1], [HX + 15.4, HY + 4.4], [HX + 13, HY + 9], [HX + 4, HY + 12.4], [HX - 4, HY + 9]], '#fff4e8')),
  F(E(HX - 4, HY - 7, 4, 1.8, '#ffc890')),
  E(HX + 14.6, HY + 4.2, 1.8, 1.3, '#4a2a2a'), F(E(HX + 14, HY + 3.7, 0.6, 0.4, '#ffffff')),
  ...line(arcP(HX + 1, HY - 4, 13.4, 5.4, 200, 340, 10), 1.2, SUN.base), F(star5(HX + 1, HY - 9.4, 2.2, '#ff9a3a')), F(star5(HX + 1, HY - 9.3, 1, '#fff8d8')),
];
// The bunny head: round, cheek fluff, a white muzzle, a pink nose, a silver crescent circlet.
const bunHead = () => [
  blob([[HX - 12, HY + 3], [HX - 16, HY + 9], [HX - 10, HY + 8], [HX - 11, HY + 12], [HX - 6, HY + 10]], BUN.base),
  E(HX, HY, 13.6, 12.4, BUN.base), crescent(HX, HY, 13.6, 12.4, BUN.sh, { k: 0.15, a0: 110, a1: 210 }),
  F(E(HX + 7, HY + 6, 6.6, 4.4, '#ffffff')), F(E(HX + 11.6, HY + 4.2, 1.5, 1.1, '#ff9ab8')), F(E(HX - 4, HY - 7, 4, 1.8, '#ffffff')),
  ...line(arcP(HX + 1, HY - 4, 13, 5.2, 200, 340, 10), 1, SILVER.sh), T([...arcP(HX + 1, HY - 8.6, 3.6, 3.8, 90, 270, 9), ...arcP(HX + 2.4, HY - 8.6, 2.6, 3, 270, 90, 9)], MOON),
];
// Ears, rooted inside the head. Fox: a point (box 12 x 18 from (5, 16)). Bunny: a long ear (box
// 10 x 26 from (5, 24)).
const foxEar = (far) => () => [T([[0.6, 16], [5, 0.6], [11, 15]], far ? FOX.sh : FOX.base), F(T([[2.4, 14.6], [5, 4], [9, 13.6]], far ? '#ffd0b0' : '#fff0e0'))];
const bunEar = (far) => () => [ovl(5, 13, 3.8, 11, 0, far ? BUN.sh : BUN.base), F(ovl(5, 13.6, 1.7, 8, 0, far ? '#f0b8d4' : '#ffc8dc'))];
// The body under the armour. Box 22 x 28; the chest joint at (11, 25).
const torso = (c) => () => [blob([[4, 4], [18, 4], [20, 16], [19, 27], [3, 27], [2, 16]], c)];
// The breastplate, with her emblem. Box 24 x 18; hung at (12, 1).
const plate = (sun) => () => {
  const c = sun ? SUN : SILVER;
  return [
    blob([[3, 2], [21, 2], [23, 10], [19, 16], [12, 17.4], [5, 16], [1, 10]], c.base), F(blob([[4, 3], [9, 3], [6, 13], [3, 10]], c.hi)),
    ...line([[4, 2.6], [12, 4.6], [20, 2.6]], 0.6, c.sh),
    ...(sun
      ? [E(12, 9, 3, 3, '#ff7a3a'), ...[0, 1, 2, 3, 4, 5].map((k) => F(T([[12 + Math.cos(k * 1.05) * 3, 9 + Math.sin(k * 1.05) * 3], [12 + Math.cos(k * 1.05 + 0.26) * 5.4, 9 + Math.sin(k * 1.05 + 0.26) * 5.4], [12 + Math.cos(k * 1.05 + 0.52) * 3, 9 + Math.sin(k * 1.05 + 0.52) * 3]], '#ff7a3a'))), F(E(12, 9, 1.3, 1.3, '#ffe08a'))]
      : [T([...arcP(12, 9, 3.6, 4, 90, 270, 10), ...arcP(13.4, 9, 2.4, 3.2, 270, 90, 10)], '#6a7ad8'), F(star5(16, 6, 1.1, '#ffffff'))]),
  ];
};
// The tabard below the breastplate, with a belt. Box 26 x 22; hung at (13, 1).
const tabard = (sun) => () => [
  T([[3, 1], [23, 1], [25.4, 18], [13, 21], [0.6, 18]], sun ? '#ff7a3a' : NIGHT.base), F(T([[3, 1], [6.6, 1], [3.6, 18], [0.6, 18]], sun ? '#ffa070' : NIGHT.hi)),
  ...(sun ? line([[0.8, 17.6], [13, 20.4], [25.2, 17.6]], 0.9, SUN.base) : [F(star5(7, 13, 1.4, '#ffffff')), F(star5(18, 15, 1.2, '#ffe68a')), F(star5(13, 9, 1, '#ffffff'))]),
  R(1, 3.4, 24, 2.6, sun ? '#7a4a2a' : '#3a3a6a'), F(R(10.6, 2.8, 3.4, 3.8, sun ? SUN.base : MOON)),
];
// The cape, in two pieces: the top from her shoulders (box 22 x 16 from (17, 1)) and the hem
// hanging from it (box 24 x 12 from (12, 1)).
const capeTop = (sun) => () => [T([[13, 1], [21, 1], [18, 15], [1, 15], [4, 6]], sun ? '#d8503a' : '#3a4498'), F(T([[13, 1], [16, 1], [6, 15], [1.4, 15]], sun ? '#e8705a' : '#4a54b0'))];
const capeHem = (sun) => () => [T([[2, 1], [22, 1], [23, 8], [17, 10.6], [12, 8.4], [7, 10.6], [1, 8]], sun ? '#c8443a' : '#343c8a'), ...line([[1, 8], [7, 10.6], [12, 8.4], [17, 10.6], [23, 8]], 0.9, sun ? SUN.base : MOON)];
// Sol's fox tail (box 28 x 16, its root at (25, 10)), Luna's puff (box 9 x 9 from (6, 4.5)).
const foxTail = () => [blob([[26, 12], [20, 13.4], [12, 12.6], [5, 8.6], [2, 3.4], [6, 2], [12, 5], [19, 8], [25, 8]], FOX.base), F(blob([[2, 3.4], [6, 2], [8.4, 5], [4.6, 7.4]], '#fff4e8')), F(blob([[12, 6], [19, 9], [16, 10]], FOX.hi))];
const bunPuff = () => [E(4.5, 4.5, 3.8, 3.6, '#ffffff'), F(E(3.4, 3.4, 1.4, 1, '#ffffff'))];
// An arm: the upper with a round pauldron (box 11 x 8 from the shoulder (2, 4); the elbow 6.5 on),
// the forearm in a gauntlet (box 10 x 7 from (1.5, 3.5); the grip 6.5 on), the hand (box 7 x 7,
// about (3.5, 3.5)).
const upper = (sun, far) => () => {
  const metal = sun ? SUN : SILVER;
  const cloth = sun ? (far ? '#c8603a' : '#ff7a3a') : far ? '#3a4498' : NIGHT.base;
  return [taper([[2, 4], [8.5, 4]], 3.8, 3.4, cloth), E(3, 3.4, 3.4, 3, far ? metal.sh : metal.base), F(E(2.4, 2.4, 1.6, 0.8, far ? metal.base : metal.hi))];
};
const fore = (sun, far) => () => {
  const metal = sun ? SUN : SILVER;
  return [taper([[1.5, 3.5], [7.5, 3.5]], 3.4, 3.2, far ? metal.sh : metal.base), F(R(5.6, 1.8, 1.2, 3.4, far ? metal.base : metal.hi))];
};
const hand = (sun, far) => () => [E(3.5, 3.5, 2.4, 2.3, sun ? (far ? '#e8d0b8' : '#fff4e8') : far ? '#d8d4ec' : '#f4f2ff')];
// A leg: the thigh (box 8 x 10 from the hip (4, 1.5); the knee 7 down), the shin (box 8 x 10 from
// (4, 1); the ankle 7.6 down) and the boot (box 13 x 8 from the ankle (4, 2)).
const thigh = (c, far) => () => [taper([[4, 1.5], [4, 8.5]], 4.8, 4.2, far ? ramp(c).sh : c)];
const shin = (c, far) => () => [taper([[4, 1], [4, 7.6]], 4.2, 3.8, far ? ramp(c).sh : c)];
const boot = (c, cuff, far) => () => [blob([[1.2, 0.4], [6.8, 0.4], [7.2, 3.4], [10.6, 4.2], [11, 6.6], [0.8, 6.6]], far ? ramp(c).sh : c), F(R(0.8, 0.2, 6.8, 1.8, far ? ramp(cuff).sh : cuff)), F(R(1, 6, 9.8, 0.8, '#3a2a2a'))];
// Sol's sun shield (box 20 x 20, held at its middle (10, 10)).
const shield = () => [
  E(10, 10, 8.6, 8.6, SUN.sh), E(10, 10, 7.2, 7.2, SUN.base), E(10, 10, 3.4, 3.4, '#fff2b0'),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => F(taper([[10 + Math.cos(k * 0.785) * 3.9, 10 + Math.sin(k * 0.785) * 3.9], [10 + Math.cos(k * 0.785) * 6.4, 10 + Math.sin(k * 0.785) * 6.4]], 1.3, 0.4, '#ff9a3a'))),
  F(E(7, 7, 1.8, 1.2, '#ffffff')), ...line(arcP(10, 10, 7.9, 7.9, 200, 290, 8), 0.6, '#fff2b0'),
];
// Luna's crescent glaive (box 26 x 74, held at (13, 44)): a long pole, a crescent blade on top.
const glaive = () => [
  R(12, 14, 2, 58, '#8a7ab8'), F(R(12, 14, 0.7, 58, '#c8b8e8')), E(13, 72, 1.8, 1.5, SILVER.sh), R(11.2, 14, 3.6, 2.2, SILVER.base),
  T([...arcP(15, 12, 9.4, 11, 200, 340, 14), ...arcP(15, 15.4, 7.2, 7.4, 340, 200, 14)], MOON), F(T([...arcP(15, 12, 8.4, 10, 215, 270, 8), [15, 6]], '#ffffff')),
  F(star5(13, 15, 1.8, '#ffe68a')),
];

// ---------- Faces ----------
const EN = [HX + 7.4, HY + 0.6, 3];
const EF = [HX - 2.4, HY + 0.6, 2.6];
const eye = ([x, y, r], iris, { lid = 0, lx = 0, ly = 0, small = false } = {}) => [
  F(E(x, y, r, r * 1.15, INK)), F(E(x + lx * 0.4, y + r * 0.35 + ly * 0.4, r * 0.8, r * 0.7, iris)),
  ...(small ? [F(E(x + lx * 0.4, y + ly * 0.4, r * 0.3, r * 0.34, '#ffffff'))] : [F(E(x - r * 0.3 + lx * 0.3, y - r * 0.4 + ly * 0.3, r * 0.38, r * 0.4, '#ffffff')), F(E(x + r * 0.35, y + r * 0.4, r * 0.15, r * 0.15, '#ffffff'))]),
  ...(lid > 0 ? [F(T([...arcP(x, y, r * 1.12, r * 1.25, 180, 360, 8), ...arcP(x, y - r * 1.15 * (1 - lid * 2), r * 1.12, r * 0.35, 0, 180, 8)], '#ffffff')), ...line(arcP(x, y - r * 1.15 * (1 - lid * 2), r * 1.05, r * 0.32, 15, 165, 7), 0.6)] : []),
];
const shutE = ([x, y, r], up = false) => line(arcP(x, y + 0.6, r, r * 0.6, up ? 200 : 20, up ? 340 : 160, 7), 0.7);
const xEye = ([x, y, r]) => [...line([[x - r * 0.8, y - r * 0.8], [x + r * 0.8, y + r * 0.8]], 0.7), ...line([[x + r * 0.8, y - r * 0.8], [x - r * 0.8, y + r * 0.8]], 0.7)];
const tight = ([x, y, r]) => [...line([[x - r, y - r * 0.6], [x + r * 0.6, y], [x - r, y + r * 0.6]], 0.7)];
const browP = (n, f, c) => [F(taper(n, 1.1, 0.6, c)), F(taper(f, 1, 0.5, c))];
const BN = [[HX + 4.6, HY - 4], [HX + 10, HY - 3.6]];
const BF = [[HX - 5, HY - 3.4], [HX - 0.4, HY - 3.8]];
const browsAt = (dn, df = dn) => [BN.map(([x, y], k) => [x, y + dn[k]]), BF.map(([x, y], k) => [x, y + df[k]])];
const mouthAt = (fox) => [HX + (fox ? 9.6 : 8), HY + (fox ? 8.6 : 9)];
const smileM = (fox, c) => line(arcP(...mouthAt(fox), 1.8, 1.1, 20, 160, 6), 0.6, c);
const openM = (fox, c, k = 1) => [F(E(mouthAt(fox)[0], mouthAt(fox)[1] + 0.6, 1.7 * k, 1.5 * k, c)), F(E(mouthAt(fox)[0], mouthAt(fox)[1] + 1.2, 0.9 * k, 0.6 * k, '#ff9ab0'))];
const frownM = (fox, c) => line(arcP(mouthAt(fox)[0], mouthAt(fox)[1] + 1.2, 1.6, 0.9, 200, 340, 6), 0.6, c);
const fang = (fox) => (fox ? [F(T([[HX + 10.4, HY + 8.8], [HX + 11.4, HY + 8.8], [HX + 10.9, HY + 10.2]], '#ffffff'))] : []);
const blushF = (k = 1) => [F(E(HX - 7, HY + 5.6, 2 * k, 1 * k, '#ffb0c4')), F(E(HX + 12, HY + 5.4, 1.8 * k, 0.9 * k, '#ffb0c4'))];
const tearF = () => [E(HX + 10.6, HY + 3.4, 0.9, 1.4, '#6ec4ff'), F(E(HX + 10.4, HY + 2.9, 0.3, 0.4, '#ffffff'))];
const faceSet = (fox) => {
  const iris = fox ? '#e85a2a' : '#6a7ad8';
  const brow = fox ? '#c8603a' : '#9a9ad8';
  const lip = fox ? '#7a3040' : '#a04070';
  const sleepy = fox ? 0 : 0.35;
  return {
    idle: () => [...eye(EN, iris, { lid: sleepy }), ...eye(EF, iris, { lid: sleepy }), ...browP(...browsAt(fox ? [-0.4, -0.8] : [0.4, 0.2]), brow), ...smileM(fox, lip), ...fang(fox), ...blushF()],
    blink: () => [...shutE(EN), ...shutE(EF), ...browP(...browsAt([0, 0]), brow), ...smileM(fox, lip), ...fang(fox), ...blushF()],
    happy: () => [...shutE(EN, true), ...shutE(EF, true), ...browP(...browsAt([-1, -1.2]), brow), ...openM(fox, lip, 0.9), ...blushF(1.2)],
    // Sol's determined frown, fang showing; Luna's cool narrow look.
    angry: () => [...eye(EN, iris, { lid: fox ? 0.2 : 0.45, small: fox }), ...eye(EF, iris, { lid: fox ? 0.2 : 0.45, small: fox }), ...browP([[HX + 4.4, HY - 2.6], [HX + 10.2, HY - 4.8]], [[HX - 5.2, HY - 4.2], [HX - 0.4, HY - 2.6]], INK), ...(fox ? [...openM(fox, lip, 0.6), ...fang(fox)] : frownM(fox, lip)), ...blushF(0.7)],
    shout: () => [...eye(EN, iris, { small: true }), ...eye(EF, iris, { small: true }), ...browP(...browsAt([-1.6, -2]), INK), ...openM(fox, lip, 1.3), ...fang(fox), ...blushF(0.8)],
    hurt: () => [...tight(EN), ...line([[EF[0] + EF[2], EF[1] - EF[2] * 0.6], [EF[0] - EF[2] * 0.6, EF[1]], [EF[0] + EF[2], EF[1] + EF[2] * 0.6]], 0.7), ...browP(...browsAt([1, -1]), brow), ...frownM(fox, lip), ...tearF()],
    sad: () => [...eye(EN, iris, { lid: 0.3, ly: 1 }), ...eye(EF, iris, { lid: 0.3, ly: 1 }), ...browP([[HX + 4.4, HY - 4.8], [HX + 10.2, HY - 2.8]], [[HX - 5.2, HY - 2.8], [HX - 0.4, HY - 4.6]], brow), ...frownM(fox, lip), ...tearF(), ...blushF(0.8)],
    yawn: () => [...shutE(EN), ...shutE(EF), ...browP(...browsAt([0.6, 0.6]), brow), F(E(mouthAt(fox)[0], mouthAt(fox)[1] + 1, 1.6, 2.2, lip)), ...blushF()],
    sleep: () => [...shutE(EN), ...shutE(EF), ...browP(...browsAt([0.6, 0.6]), brow), ...smileM(fox, lip), ...blushF()],
    dead: () => [...xEye(EN), ...xEye(EF), ...openM(fox, lip, 0.6)],
  };
};
const FACE_FB = { eyes: [[EN[0], EN[1], 2.6, 3, 1], [EF[0], EF[1], 2.2, 2.6, -1]], mouth: [HX + 9, HY + 8.6, 1], blush: [[HX - 7, HY + 5.6, 1.6], [HX + 12, HY + 5.4, 1.6]], iris: '#e85a2a', lid: 0, lashes: 1 };

// ---------- The skeleton ----------
const HIP = 18;
const L1 = 7;
const L2 = 7.6;
const LEG_DY = 13.4;
function legIK(dx, dy, hipDeg) {
  const d = Math.min(L1 + L2 - 0.05, Math.max(3, Math.hypot(dx, dy)));
  const h = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const k = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return [(-Math.atan2(dx, dy) - h) / D2R - hipDeg, (Math.PI - k) / D2R];
}
const [ST, SS] = legIK(0, LEG_DY, 0);
const legs = (tn, sn, tf, sf) => ({ thighN: tn, shinN: sn, thighF: tf, shinF: sf, rollN: 0, rollF: 0 });
const STAND = legs(ST, SS, ST, SS);
const CROUCH = legs(ST - 22, SS + 36, ST - 18, SS + 32);

// Would the prop overlap her head (chest space)? The prop's sample points (in its own space about
// its grip) against the head, a little enlarged.
const propBehind = (pts) => (a, S) => {
  if (a.twFront) return false;
  if (a.twBehind != null) return a.twBehind;
  const ar = S.armN * D2R;
  const er = (S.armN + S.elbN) * D2R;
  const wx = 7 + 6.5 * Math.cos(ar) + 6.5 * Math.cos(er);
  const wy = -21 + 6.5 * Math.sin(ar) + 6.5 * Math.sin(er);
  const pr = (S.armN + S.elbN + S.prop) * D2R;
  const hr = (S.head - S.tilt * 0.5) * D2R;
  const hx = -1 * Math.cos(hr) + 13 * Math.sin(hr);
  const hy = -24 - 1 * Math.sin(hr) - 13 * Math.cos(hr);
  const res = pts.some(([px, py]) => {
    const x = wx + px * Math.cos(pr) - py * Math.sin(pr);
    const y = wy + px * Math.sin(pr) + py * Math.cos(pr);
    return ((x - hx) / 16) ** 2 + ((y - hy) / 14.6) ** 2 < 1;
  });
  return res;
};

function twinParts(sister) {
  const sun = sister === 'sol';
  const fur = sun ? FOX.base : BUN.base;
  const P = {
    HEAD: tw(`${sister}head`, 36, 32, sun ? foxHead : bunHead, 2),
    EAR: [false, true].map((f) => (sun ? tw(`${sister}ear${f ? 1 : 0}`, 12, 18, foxEar(f), 2) : tw(`${sister}ear${f ? 1 : 0}`, 10, 26, bunEar(f), 2))),
    TORSO: tw(`${sister}torso`, 22, 28, torso(fur), 2), PLATE: tw(`${sister}plate`, 24, 18, plate(sun), 2), TABARD: tw(`${sister}tabard`, 26, 22, tabard(sun), 2),
    CAPE: [tw(`${sister}cape0`, 22, 16, capeTop(sun), 2), tw(`${sister}cape1`, 24, 12, capeHem(sun), 2)],
    TAIL: sun ? tw(`${sister}tail`, 28, 16, foxTail, 2) : tw(`${sister}tail`, 9, 9, bunPuff, 2),
    UP: [false, true].map((f) => tw(`${sister}up${f ? 1 : 0}`, 11, 8, upper(sun, f), 2)), FORE: [false, true].map((f) => tw(`${sister}fore${f ? 1 : 0}`, 10, 7, fore(sun, f), 2)), HAND: [false, true].map((f) => tw(`${sister}hand${f ? 1 : 0}`, 7, 7, hand(sun, f), 2)),
    THIGH: [false, true].map((f) => tw(`${sister}thigh${f ? 1 : 0}`, 8, 10, thigh(fur, f), 2)), SHIN: [false, true].map((f) => tw(`${sister}shin${f ? 1 : 0}`, 8, 10, shin(fur, f), 2)),
    BOOT: [false, true].map((f) => tw(`${sister}boot${f ? 1 : 0}`, 13, 8, boot(sun ? '#a06a42' : '#6a7ad8', sun ? SUN.base : MOON, f), 2)),
    PROP: sun ? tw('solshield2', 20, 20, shield, 2) : tw('lunaglaive', 26, 74, glaive, 2),
  };
  const PIV = sun ? [10, 10] : [13, 44];
  const ring = [[0, 0], ...Array.from({ length: 8 }, (_, k) => [Math.cos(k * 0.785) * 8, Math.sin(k * 0.785) * 8])];
  const pole = [[2, -32], [8, -34], [-5, -34], ...Array.from({ length: 16 }, (_, k) => [0, -28 + k * 3.8])];
  const behind = propBehind(sun ? ring : pole);
  const before = (a, S) => !behind(a, S);
  const faces = faceSet(sun);
  const faceOf = (mood) => faceSprite(`tw2|${sister}|face|${mood}`, 36, 32, () => (faces[mood] ?? (() => faceShapes(mood, FACE_FB)))());
  const pass = (bare) => {
    const i = bare ? 1 : 0;
    const t = bare ? 'b' : '';
    const leg = (far) => {
      const k = far ? 'F' : 'N';
      const j = far ? 1 : 0;
      return [
        { name: `boot${k}${t}`, parent: `ankle${k}`, s: P.BOOT[j][i], pivot: [4, 2], rot: (S) => -(S.tilt * 0.3 + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
        { name: `shin${k}${t}`, parent: `knee${k}`, s: P.SHIN[j][i], pivot: [4, 1], rot: (S) => S[`shin${k}`] * D2R },
        { name: `thigh${k}${t}`, parent: 'hip', s: P.THIGH[j][i], pivot: [4, 1.5], at: () => [far ? -4.6 : 4, 0], rot: (S) => S[`thigh${k}`] * D2R },
      ];
    };
    const arm = (far) => {
      const k = far ? 'F' : 'N';
      const j = far ? 1 : 0;
      return {
        up: { name: `up${k}${t}`, parent: 'chest', s: P.UP[j][i], pivot: [2, 4], at: () => (far ? [-7, -22] : [7, -21]), rot: (S) => S[`arm${k}`] * D2R },
        fore: { name: `fore${k}${t}`, parent: `elbow${k}`, s: P.FORE[j][i], pivot: [1.5, 3.5], rot: (S) => S[`elb${k}`] * D2R },
        hand: { name: `hand${k}${t}`, parent: `grip${k}`, s: P.HAND[j][i], pivot: [3.5, 3.5] },
      };
    };
    const an = arm(false);
    const af = arm(true);
    const prop = { name: `prop${t}`, parent: 'gripN', s: P.PROP[i], pivot: PIV, rot: (S) => S.prop * D2R };
    // (Sol's paw is behind her shield; Luna's paw closes round the glaive's pole, over it.)
    const front = sun ? [{ ...an.fore, when: before }, { ...an.hand, when: before }, { ...prop, when: before }] : [{ ...an.fore, when: before }, { ...prop, when: before }, { ...an.hand, when: before }];
    const back = sun ? [{ ...an.fore, name: `foreNk${t}`, when: behind }, { ...an.hand, name: `handNk${t}`, when: behind }, { ...prop, name: `propk${t}`, when: behind }] : [{ ...an.fore, name: `foreNk${t}`, when: behind }, { ...prop, name: `propk${t}`, when: behind }, { ...an.hand, name: `handNk${t}`, when: behind }];
    return [
      { name: `cape0${t}`, parent: 'chest', s: P.CAPE[0][i], pivot: [17, 1], at: () => [-1, -23], rot: (S) => S.capeA * D2R },
      { name: `cape1${t}`, parent: 'cape0', s: P.CAPE[1][i], pivot: [12, 1], at: () => [-7, 14], rot: (S) => S.capeB * D2R },
      sun
        ? { name: `tail${t}`, parent: 'hip', s: P.TAIL[i], pivot: [25, 10], at: () => [-6, -1], rot: (S) => S.tail * D2R }
        : { name: `tail${t}`, parent: 'hip', s: P.TAIL[i], pivot: [6, 4.5], at: () => [-9, -1], rot: (S) => S.tail * D2R },
      sun
        ? { name: `earF${t}`, parent: 'nk', s: P.EAR[1][i], pivot: [5, 16], at: () => [-8, -19], rot: (S) => (-16 + S.earF) * D2R }
        : { name: `earF${t}`, parent: 'nk', s: P.EAR[1][i], pivot: [5, 24], at: () => [-7, -22], rot: (S) => (-10 + S.earF) * D2R },
      af.up, af.fore, af.hand,
      ...leg(true),
      { name: `torso${t}`, parent: 'chest', s: P.TORSO[i], pivot: [11, 25] },
      ...leg(false),
      { name: `tabard${t}`, parent: 'chest', s: P.TABARD[i], pivot: [13, 1], at: () => [0, -12], rot: (S) => S.tab * D2R },
      { name: `plate${t}`, parent: 'chest', s: P.PLATE[i], pivot: [12, 1], at: () => [0, -25] },
      an.up,
      ...back,
      sun
        ? { name: `earN${t}`, parent: 'nk', s: P.EAR[0][i], pivot: [5, 16], at: () => [5, -21], rot: (S) => (12 + S.earN) * D2R }
        : { name: `earN${t}`, parent: 'nk', s: P.EAR[0][i], pivot: [5, 24], at: () => [3, -23], rot: (S) => (10 + S.earN) * D2R },
      { name: `head${t}`, parent: 'nk', s: P.HEAD[i], pivot: [19, 29] },
      ...(bare ? [{ name: 'face', parent: 'nk', s: (a) => faceOf(a.twMood), pivot: [19, 29] }] : []),
      ...front,
    ];
  };
  return { P, pass, sun };
}

// ---------- Moves ----------
// Each: [antic (the wind-up), strike (the blow)]. `prop` is the prop's turn in her grip, worked
// out (aim) so the shield faces, or the glaive points, where it should on screen.
function solMove(kind) {
  const base = { capeA: 6, capeB: 4, tab: 0, tail: 24, earN: 0, earF: 0, armF: 100, elbF: -40 };
  if (kind === 'rise') return [
    // Sunrise: a deep crouch, the shield low and blazing...
    { ...base, x: -1, lift: -4, tilt: 10, head: 10, armN: 110, elbN: -60, prop: aim(0, 110, -60, 10), armF: 130, elbF: -20, tail: 40, earN: -8, earF: -8, ...CROUCH },
    // ...then a leap, the sun shield thrust high over her head, knees tucked.
    { ...base, x: 1, lift: 7, tilt: -10, head: -16, armN: -40, elbN: -10, prop: aim(0, -40, -10, -10), armF: -70, elbF: -30, capeA: 26, capeB: 22, tail: 56, earN: 20, earF: 18, ...legs(ST - 34, SS + 50, ST - 24, SS + 56) },
  ];
  if (kind === 'flare') return [
    // Corona: the shield raised before her face... (behind her head while it overlaps)
    { ...base, x: 0, lift: 1, tilt: -4, head: -6, armN: -24, elbN: -70, prop: aim(30, -24, -70, -4), armF: 120, elbF: -30, tail: 30, earN: 8, earF: 8, ...STAND },
    // ...thrust up and out, scattering sparks, the far paw flung high.
    { ...base, x: 2, lift: 3, tilt: -8, head: -12, armN: -50, elbN: -10, prop: aim(120, -50, -10, -8), armF: -120, elbF: -10, capeA: 18, capeB: 16, tail: 48, earN: 18, earF: 16, ...legs(ST + 6, SS - 10, ST + 6, SS - 10) },
  ];
  if (kind === 'eclipse' || kind === 'total') {
    const big = kind === 'total' ? 1.3 : 1;
    return [
      // Eclipse: the shield raised to the sky in both paws, up on her toes...
      { ...base, x: -1, lift: 3 * big, tilt: -10, head: -16, armN: -40, elbN: -14, prop: aim(0, -40, -14, -10), armF: -110, elbF: -10, tail: 40, earN: 14, earF: 12, ...legs(ST + 8, SS - 14, ST + 8, SS - 14) },
      // ...brought down as she drops to one knee, the shield planted before her.
      { ...base, x: 4, lift: -5 * big, tilt: 14, head: 8, armN: 46, elbN: -36, prop: aim(0, 46, -36, 14), armF: 70, elbF: -30, capeA: 26, capeB: 24, tail: 10, earN: -14, earF: -12, ...legs(ST - 40, SS + 60, ST + 34, SS + 56) },
    ];
  }
  // A shield bash (and Solar Fang, the same blow, bigger): drawn back, then a lunge, shield first.
  const big = kind === 'fang' ? 1.25 : 1;
  return [
    { ...base, x: -3, lift: -1, tilt: -8, head: -6, armN: 150, elbN: -30, prop: aim(0, 150, -30, -8), armF: 60, elbF: -60, tail: 36, earN: 12, earF: 10, ...legs(ST + 8, SS + 6, ST - 8, SS + 10) },
    { ...base, x: 9 * big, lift: -1, tilt: 18, head: 8, armN: -6, elbN: 4, prop: aim(0, -6, 4, 18), armF: 150, elbF: -20, capeA: 28, capeB: 24, tab: -8, tail: 52, earN: -20, earF: -18, ...legs(ST - 30, SS + 12, ST + 24, SS - 4) },
  ];
}
// What Sol does through each cast (t: seconds into the cast), each its own shape: Sunrise, a deep
// crouch, head bowed over the shield held low by the ground, trembling as it blazes; Corona,
// standing tall, the sun shield thrust out at arm's length and spinning, the other paw flung up; Eclipse (and Total
// Eclipse), up on her toes and leaning back, the shield thrust up and out to the sky, the other
// paw raised too, swaying; the bash and Solar Fang, leaning in low, the shield pulled right back
// behind her, quivering to spring.
function solHold(kind, w, t) {
  const p = { ...w };
  if (kind === 'rise') Object.assign(p, { x: Math.sin(t * 26) * 0.7, lift: -6, tilt: 16, head: 18, armN: 96, elbN: 30, prop: aim(0, 96, 30, 16), armF: 120, elbF: -20, ...legs(ST - 30, SS + 48, ST - 26, SS + 44) });
  else if (kind === 'flare') Object.assign(p, { x: 1, lift: 1, tilt: -4, head: -6, armN: -8, elbN: 0, prop: aim(t * 300, -8, 0, -4), armF: -120, elbF: -20, earN: 14, earF: 12, ...STAND });
  else if (kind === 'eclipse' || kind === 'total') {
    const sw = Math.sin(t * 2) * 5;
    Object.assign(p, { tilt: -14 + sw, head: -18, armN: -40, elbN: -10, prop: aim(0, -40, -10, -14 + sw), armF: -110, elbF: -10 });
  } else Object.assign(p, { x: -3 + Math.sin(t * 22) * 0.8, lift: -2, tilt: 12, head: 6, armN: 168, elbN: -20, prop: aim(0, 168, -20, 12), armF: 40, elbF: -40, ...CROUCH });
  return p;
}
function lunaMove(kind) {
  const base = { capeA: 4, capeB: 3, tab: 0, tail: 0, earN: 0, earF: 0, armF: 100, elbF: -40 };
  if (kind === 'fall' || kind === 'total') {
    const big = kind === 'total' ? 1.3 : 1;
    return [
      // Moonfall: the glaive raised high, blade to the sky, up on her toes...
      { ...base, x: -1, lift: 3 * big, tilt: -10, head: -14, armN: -40, elbN: -10, prop: aim(15, -40, -10, -10), armF: -100, elbF: -20, earN: 14, earF: 12, ...legs(ST + 8, SS - 14, ST + 8, SS - 14) },
      // ...brought down point first into the floor before her, dropping to a knee.
      { ...base, x: 5, lift: -5 * big, tilt: 18, head: 10, armN: 70, elbN: 10, prop: aim(110, 70, 10, 18), armF: 60, elbF: -30, capeA: 26, capeB: 24, earN: -18, earF: -16, ...legs(ST - 40, SS + 60, ST + 34, SS + 56) },
    ];
  }
  if (kind === 'sweep') return [
    // Crescent Sweep: the glaive drawn back low behind her, blade trailing...
    { ...base, x: -3, lift: -1, tilt: -10, head: -4, armN: 160, elbN: 10, prop: aim(-80, 160, 10, -10), armF: 60, elbF: -50, earN: 10, earF: 8, ...legs(ST + 10, SS + 4, ST - 10, SS + 12) },
    // ...swept round in front of her, a long low arc.
    { ...base, x: 8, lift: -1, tilt: 16, head: 8, armN: 10, elbN: 0, prop: aim(100, 10, 0, 16), armF: 150, elbF: -10, capeA: 30, capeB: 26, tab: -8, earN: -20, earF: -18, ...legs(ST - 30, SS + 14, ST + 22, SS - 4) },
  ];
  if (kind === 'pull') return [
    // Tide Pull: the glaive reached out forward and up...
    { ...base, x: 2, lift: 1, tilt: 8, head: 2, armN: -36, elbN: -20, prop: aim(50, -36, -20, 8), armF: 110, elbF: -30, earN: 6, earF: 6, ...legs(ST - 12, SS + 6, ST + 8, SS) },
    // ...hauled back in to her chest, leaning back against the pull.
    { ...base, x: -4, lift: -1, tilt: -14, head: -8, armN: 70, elbN: -110, prop: aim(-10, 70, -110, -14), armF: 140, elbF: -40, capeA: 2, capeB: 2, earN: 16, earF: 14, ...legs(ST + 14, SS + 10, ST - 6, SS + 18) },
  ];
  // A thrust: the glaive drawn back, then driven forward.
  return [
    { ...base, x: -2, lift: 0, tilt: -6, head: -4, armN: 130, elbN: -40, prop: aim(70, 130, -40, -6), armF: 70, elbF: -50, earN: 8, earF: 6, ...legs(ST + 8, SS + 4, ST - 8, SS + 8) },
    { ...base, x: 8, lift: -1, tilt: 14, head: 6, armN: -10, elbN: 10, prop: aim(92, -10, 10, 14), armF: 150, elbF: -20, capeA: 24, capeB: 20, tab: -6, earN: -16, earF: -14, ...legs(ST - 28, SS + 12, ST + 22, SS - 4) },
  ];
}
// (A full turn's gap between a held prop and where it's going (a twirl cut short by a move or a
// walk) is the same angle: the spring is wound round to it, never spun back.)
const unwind = (st, name, goal) => {
  const sp = st?.[name];
  if (!sp) return;
  if (sp.x - goal > 270) sp.x -= 360;
  else if (goal - sp.x > 270) sp.x += 360;
};
const SOL_KINDS = ['bash', 'rise', 'fang', 'flare', 'eclipse', 'total'];
const LUNA_KINDS = ['poke', 'fall', 'sweep', 'pull', 'total'];

// ---------- The rig ----------
const K = 1.55;
function twinRig(sister) {
  const { pass, sun } = twinParts(sister);
  const KINDS = sun ? SOL_KINDS : LUNA_KINDS;
  const STRIDE = sun ? 22 : 26;
  const DUTY = sun ? 0.55 : 0.62;
  const LIFT = sun ? 4.6 : 3;
  return sized(makeRig({
    w: 60, h: 92, soft: true, stride: 8, recover: 0.6,
    springs: {
      x: [220, 16], lift: [200, 14], tilt: [170, 12], head: [140, 10], armN: [220, 15], elbN: [230, 16], armF: [170, 12], elbF: [180, 12], prop: [220, 15],
      thighN: [300, 18], thighF: [300, 18], shinN: [300, 18], shinF: [300, 18], rollN: [300, 18], rollF: [300, 18],
      capeA: [70, 6], capeB: [55, 4.6], tab: [120, 8], tail: sun ? [70, 5] : [120, 6], earN: sun ? [130, 7] : [80, 4.6], earF: sun ? [130, 7] : [80, 4.6],
    },
    fast: ['x', 'armN', 'elbN', 'prop', 'armF', 'elbF', 'thighN', 'thighF', 'shinN', 'shinF'],
    kick: { tilt: -160, head: -220, earN: 260, earF: 260, capeA: 220, capeB: 260, tail: 240 },
    turnKick: { capeA: 260, capeB: 300, tail: 260, earN: 200, earF: 200, tab: 160 },
    pose(m, a) {
      a.uidOff = (m.uid % 13) * 0.93;
      const t = a.t + a.uidOff;
      const mo = a.mo ?? {};
      const st = mo.rig;
      a.twU = stepPhase(m, a, 'tw2', STRIDE * K);
      const alone = m.mech?.alone ? 1 : 0;
      a.twAlone = alone;
      const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
      if (m.castPose && KINDS.includes(m.castPose)) mo.twForce = m.castPose;
      else if (!active) mo.twForce = null;
      const kind = mo.twForce ?? KINDS[0];
      a.twKind = kind;
      const cast = m.cast && m.castPose ? clamp((a.now - m.cast.t0) / 0.45, 0, 1) : 0;
      a.twCast = cast;
      const still = 1 - (a.walkW ?? 0);
      let idle;
      let act = {};
      if (sun) {
        // Sol's idle, a 10 s act: bouncing on her toes; a twirl of her shield; a happy hop.
        const lu = fr(t / 10) * 10;
        const bob = Math.abs(Math.sin(t * 2.8));
        // (The twirl stops the moment she does anything else.)
        const busy = active || m.castPose || (a.walkW ?? 0) > 0.05;
        const twirl = !busy && lu >= 3.4 && lu < 6 ? smooth(clamp((lu - 3.4) / 1.1, 0, 1)) : 0;
        const hop = hold(lu, 7, 7.15, 7.3, 7.6);
        act = { happy: hop + (twirl > 0 && twirl < 1 ? 0.6 : 0) };
        idle = {
          x: 0, lift: bob * 1.2 - alone * 2 + hop * 5, tilt: 2 + bob * 1.4 + alone * 10, head: -bob * 2 + alone * 16 - hop * 6,
          armN: 58 - twirl * 20 * (1 - twirl), elbN: -38, prop: aim(0, 58, -38, 2) + twirl * 360, armF: 104 - bob * 6 - hop * 60, elbF: -44 - hop * 40,
          thighN: ST + bob * 3 - hop * 18, shinN: SS - bob * 6 + hop * 30, thighF: ST + bob * 3 - hop * 14, shinF: SS - bob * 6 + hop * 34, rollN: -bob * 8, rollF: -bob * 8,
          capeA: 6 + bob * 2, capeB: 4 + bob * 2, tab: 0, tail: 24 + Math.sin(t * 2.2) * 10 - alone * 30 + hop * 20, earN: bob * 4 - alone * 30, earF: bob * 3 - alone * 26,
        };
      } else {
        // Luna's idle, a 12 s act: a slow sleepy sway leaning on her glaive; a big yawn; nodding
        // off, then jolting awake.
        const lu = fr(t / 12) * 12;
        const sway = Math.sin(t * 0.9);
        const yawn = hold(lu, 4.6, 5.1, 6.1, 6.7);
        const nod = hold(lu, 8.6, 9.6, 10.2, 10.3);
        const jolt = hold(lu, 10.3, 10.36, 10.5, 11);
        act = { yawn, nod, jolt };
        idle = {
          x: 0, lift: sway * 0.4 - alone * 2 - nod * 1.2, tilt: sway * 1.4 + alone * 8 + nod * 4, head: -sway * 2 - yawn * 14 + nod * 16 + alone * 14 - jolt * 4,
          armN: 62, elbN: -100, prop: aim(sway * 2, 62, -100, sway * 1.4 + alone * 8) , armF: 104 - yawn * 120, elbF: -40 - yawn * 80,
          ...STAND, capeA: 4 + sway, capeB: 3 + sway, tab: sway * 0.6, tail: Math.sin(t * 3.1) * 10, earN: sway * 6 - yawn * 10 - nod * 24 + jolt * 30 - alone * 40, earF: -sway * 5 - yawn * 8 - nod * 20 + jolt * 26 - alone * 36,
        };
      }
      a.twAct = Object.fromEntries(Object.entries(act).map(([k, v]) => [k, v * still]));
      // Walking, on planted feet (her knees bend to wherever each foot is, so nothing slides).
      // Sol marches: high knees, a bounce on every step, her free arm swinging, tail and ears
      // bouncing. Luna glides: long calm steps, a soft rise and fall, the glaive steady at her side.
      const u = a.twU;
      const lead = ((st?.tw2V ?? 0) / (STRIDE * K)) * 0.05;
      const [dxN, upN] = pawStep(u + lead, 0, STRIDE, DUTY, LIFT);
      const [dxF, upF] = pawStep(u + lead, 0.5, STRIDE, DUTY, LIFT);
      const w2 = u * TAU * 2;
      const land = (1 + Math.cos(w2)) / 2;
      const sw = Math.sin(u * TAU);
      const wLift = sun ? 0.8 - land * 2.6 : 0.3 - land * 1.3;
      const wTilt = sun ? 6 + land * 3 : 3 + land * 1.4;
      const [thN, shN] = legIK(dxN, LEG_DY + wLift - upN, wTilt * 0.3);
      const [thF, shF] = legIK(dxF, LEG_DY + wLift - upF, wTilt * 0.3);
      const walk = sun
        ? {
            x: 0, lift: wLift, tilt: wTilt, head: -wTilt * 0.4 + land * 3, armN: 60 - sw * 10, elbN: -36, prop: aim(0, 60 - sw * 10, -36, wTilt), armF: 100 + sw * 40, elbF: -30 - Math.max(0, -sw) * 30,
            thighN: thN, shinN: shN, thighF: thF, shinF: shF, rollN: upN * 4, rollF: upF * 4,
            capeA: 14 + land * 6, capeB: 10 + Math.sin(w2 - 2) * 6, tab: -sw * 2, tail: 30 + Math.sin(w2 - 1) * 16, earN: -4 + Math.sin(w2 - 1.2) * 10, earF: -4 + Math.sin(w2 - 1.5) * 9,
          }
        : {
            x: 0, lift: wLift, tilt: wTilt, head: -wTilt * 0.4 + land * 1.4, armN: 62 + sw * 3, elbN: -100, prop: aim(sw * 3, 62 + sw * 3, -100, wTilt), armF: 100 + sw * 22, elbF: -36,
            thighN: thN, shinN: shN, thighF: thF, shinF: shF, rollN: upN * 3, rollF: upF * 3,
            capeA: 12 + land * 3, capeB: 9 + Math.sin(w2 - 2) * 5, tab: -sw * 1.4, tail: Math.sin(w2) * 8, earN: -6 + Math.sin(w2 - 1.4) * 8, earF: -5 + Math.sin(w2 - 1.8) * 7,
          };
      // Alone, the walk droops too.
      if (alone) Object.assign(walk, { tilt: walk.tilt + 6, head: walk.head + 10, earN: walk.earN - 30, earF: walk.earF - 26, tail: walk.tail - 30 });
      const [antic, strike] = sun ? solMove(kind) : lunaMove(kind);
      let base = idle;
      if (cast > 0) {
        // (Sol takes up her cast's wind-up all the way and acts it out, so each cast reads as its own
        // pose: 2026-11-19, they all looked like her shield held out. Luna's read already.)
        const ct = m.cast ? a.now - m.cast.t0 : 0;
        const hold = sun ? solHold(kind, antic, ct) : antic;
        const k = cast * (sun ? 1 : 0.7);
        base = Object.fromEntries(Object.keys(idle).map((key) => [key, idle[key] + ((hold[key] ?? idle[key]) - idle[key]) * k]));
        a.twAct = {};
      }
      a.twFront = false;
      a.twMood = moodOf2(a, m, sun);
      const S = stateBlend(a, base, walk, antic, strike);
      unwind(st, 'prop', S.prop);
      return S;
    },
    parts: [
      { name: 'hip', parent: null, at: (S) => [S.x, -HIP - S.lift], rot: (S) => S.tilt * 0.3 * D2R },
      { name: 'chest', parent: 'hip', at: () => [0, -2], rot: (S) => S.tilt * 0.7 * D2R },
      { name: 'nk', parent: 'chest', at: () => [0, -24], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
      { name: 'elbowN', parent: 'upN', at: () => [6.5, 0] },
      { name: 'elbowF', parent: 'upF', at: () => [6.5, 0] },
      { name: 'gripN', parent: 'foreN', at: () => [6.5, 0] },
      { name: 'gripF', parent: 'foreF', at: () => [6.5, 0] },
      { name: 'kneeN', parent: 'thighN', at: () => [0, 7] },
      { name: 'kneeF', parent: 'thighF', at: () => [0, 7] },
      { name: 'ankleN', parent: 'shinN', at: () => [0, 7.6] },
      { name: 'ankleF', parent: 'shinF', at: () => [0, 7.6] },
      ...pass(false),
      ...pass(true),
    ],
    // The glows go under her, so they never wash over her face.
    under(ctx, m, a, S, mat) {
      if (m.hp <= 0) return;
      const [px, py] = sun ? at2(mat('prop'), 0, 0) : at2(mat('prop'), 2, -32);
      const since = a.ph.since;
      const blow = since >= 0 && since < 0.6 ? 1 - since / 0.6 : 0;
      const charge = Math.max(a.ph.antic, a.twCast * 0.6);
      const big = sun && (a.twKind === 'rise' || a.twKind === 'eclipse' || a.twKind === 'total') ? Math.max(charge * 0.7, blow) : 0;
      const r = (sun ? 16 : 12) + big * 26;
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, sun ? `rgba(255,224,140,${(0.3 + big * 0.35) * a.alpha})` : `rgba(216,228,255,${0.3 * a.alpha})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    },
    fx(ctx, m, a, S, mat) {
      if (m.hp <= 0) return;
      const since = a.ph.since;
      const kind = a.twKind;
      const [px, py] = sun ? at2(mat('prop'), 0, 0) : at2(mat('prop'), 2, -32);
      const blow = since >= 0 && since < 0.6 ? 1 - since / 0.6 : 0;
      const charge = Math.max(a.ph.antic, a.twCast * 0.6);
      if (sun) {
        // Sunrise / Eclipse: the shield blazes (its glow under her) with sparks round it; Corona:
        // sparks thrown out; a bash: a flash.
        if ((kind === 'rise' || kind === 'eclipse' || kind === 'total') && (charge > 0.1 || blow > 0)) {
          const on = Math.max(charge * 0.7, blow);
          for (let k = 0; k < 6; k++) sparkle(ctx, a, px + Math.cos(a.now * 2 + k) * (10 + on * 10), py + Math.sin(a.now * 2 + k) * (10 + on * 10), 2.2 * on, a.alpha * on, k % 2 ? '#ffffff' : '#ffd36b');
        }
        if (kind === 'flare' && blow > 0) for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * TAU + 0.3;
          const r = 8 + (1 - blow) * 30;
          sparkle(ctx, a, px + Math.cos(ang) * r, py + Math.sin(ang) * r, 2.6 * blow, a.alpha * blow, k % 2 ? '#ffffff' : '#ffb84a');
        }
        if ((kind === 'bash' || kind === 'fang') && blow > 0.3) sparkle(ctx, a, px + 8, py, 6 * blow, a.alpha * blow, '#fff2b0');
      } else {
        // Crescent Sweep: a pale crescent trail; Moonfall: a puff where the point lands; Tide
        // Pull: rings of water drawing in to her.
        if (kind === 'sweep' && blow > 0) {
          ctx.globalAlpha = a.alpha * blow * 0.8;
          ctx.strokeStyle = MOON;
          ctx.lineWidth = 2.2;
          const [cx, cy] = at2(mat('chest'), 0, -10);
          ctx.beginPath();
          ctx.ellipse(cx + 6, cy, 30, 14, 0, -1.1 + (1 - blow) * 0.6, 1.1);
          ctx.stroke();
          ctx.globalAlpha = a.alpha;
        }
        if ((kind === 'fall' || kind === 'total') && blow > 0.2) {
          const [tx, ty] = at2(mat('prop'), 2, -36);
          puff(ctx, a, tx, ty, 7 * blow, a.alpha * blow * 0.5);
          for (let k = 0; k < 5; k++) sparkle(ctx, a, tx + Math.cos(k * 1.4) * (6 + (1 - blow) * 14), ty - (1 - blow) * 8 + Math.sin(k * 1.4) * 4, 2 * blow, a.alpha * blow, k % 2 ? '#ffffff' : MOON);
        }
        if (kind === 'pull' && (charge > 0.2 || blow > 0)) {
          const [cx, cy] = at2(mat('chest'), 0, -10);
          for (let k = 0; k < 2; k++) {
            const u = 1 - fr(a.now * 1.2 + k / 2);
            ctx.globalAlpha = a.alpha * (1 - u) * 0.6;
            ctx.strokeStyle = '#9fd8ff';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(cx + 10 + u * 30, cy + 8, 3 + u * 6, 8 + u * 10, 0, -1.2, 1.2);
            ctx.stroke();
          }
          ctx.globalAlpha = a.alpha;
        }
      }
    },
  }), K);
}
// Which face: the blow's, the wind-up's, alone and sad, the idle act's, a blink.
function moodOf2(a, m, sun) {
  if (m.hp <= 0) return 'dead';
  if (a.ph.strike > 0.25) return 'shout';
  if (a.ph.atk || a.ph.antic > 0.3 || a.twCast > 0.5) return 'angry';
  if (a.mood === 'hurt' || a.face === 'hurt') return 'hurt';
  if (a.twAlone) return 'sad';
  const t = a.t + (a.uidOff ?? 0);
  const act = a.twAct ?? {};
  if (!sun && act.yawn > 0.4) return 'yawn';
  if (!sun && act.nod > 0.5) return 'sleep';
  if (sun && act.happy > 0.4) return 'happy';
  if (t % (sun ? 3.7 : 5.1) < 0.13) return 'blink';
  return 'idle';
}
export const solRig = twinRig('sol');
export const lunaRig = twinRig('luna');

// ---------- Stills (portraits) ----------
function still(sister, mood) {
  const sun = sister === 'sol';
  const fur = sun ? FOX.base : BUN.base;
  const faces = faceSet(sun);
  const fm = faces[mood] ? mood : 'idle';
  const hip = [0, -HIP];
  const ch = [0, -HIP - 2];
  const nk = [ch[0], ch[1] - 24];
  const legAt = (far) => {
    const x = far ? -4.6 : 4;
    const tr = ST * D2R;
    const kx = x - Math.sin(tr) * L1;
    const ky = hip[1] + Math.cos(tr) * L1;
    const sr = (ST + SS) * D2R;
    const ax = kx - Math.sin(sr) * L2;
    const ay = ky + Math.cos(sr) * L2;
    return [...put(boot(sun ? '#a06a42' : '#6a7ad8', sun ? SUN.base : MOON, far)(), [4, 2], ax, ay, 0), ...put(shin(fur, far)(), [4, 1], kx, ky, ST + SS), ...put(thigh(fur, far)(), [4, 1.5], x, hip[1], ST)];
  };
  const arm = (far, armA, elbA) => {
    const [sx, sy] = far ? [-7, ch[1] - 22] : [7, ch[1] - 21];
    const ex = sx + Math.cos(armA * D2R) * 6.5;
    const ey = sy + Math.sin(armA * D2R) * 6.5;
    const fa = armA + elbA;
    const gx = ex + Math.cos(fa * D2R) * 6.5;
    const gy = ey + Math.sin(fa * D2R) * 6.5;
    return { up: put(upper(sun, far)(), [2, 4], sx, sy, armA), fore: put(fore(sun, far)(), [1.5, 3.5], ex, ey, fa), hand: put(hand(sun, far)(), [3.5, 3.5], gx, gy, 0), grip: [gx, gy] };
  };
  const an = sun ? arm(false, 58, -38) : arm(false, 62, -100);
  const af = arm(true, 104, -44);
  const propS = sun ? put(shield(), [10, 10], an.grip[0], an.grip[1], 0) : put(glaive(), [13, 44], an.grip[0], an.grip[1], 0);
  return { w: 60, h: 92, res: 2, shapes: shift([
    ...put(capeTop(sun)(), [17, 1], -1, ch[1] - 23, sun ? 6 : 4), ...put(capeHem(sun)(), [12, 1], -1 - 7, ch[1] - 23 + 14, sun ? 10 : 7),
    ...(sun ? put(foxTail(), [25, 10], -6, hip[1] - 1, 24) : put(bunPuff(), [6, 4.5], -9, hip[1] - 1, 0)),
    ...(sun ? put(foxEar(true)(), [5, 16], nk[0] - 8, nk[1] - 19, -16) : put(bunEar(true)(), [5, 24], nk[0] - 7, nk[1] - 22, -10)),
    ...af.up, ...af.fore, ...af.hand,
    ...legAt(true), ...put(torso(fur)(), [11, 25], ch[0], ch[1]), ...legAt(false),
    ...put(tabard(sun)(), [13, 1], 0, ch[1] - 12), ...put(plate(sun)(), [12, 1], 0, ch[1] - 25),
    ...an.up,
    ...(sun ? put(foxEar(false)(), [5, 16], nk[0] + 5, nk[1] - 21, 12) : put(bunEar(false)(), [5, 24], nk[0] + 3, nk[1] - 23, 10)),
    ...put(sun ? foxHead() : bunHead(), [19, 29], nk[0], nk[1]), ...put(faces[fm](), [19, 29], nk[0], nk[1]),
    ...(sun ? [...an.fore, ...an.hand, ...propS] : [...an.fore, ...propS, ...an.hand]),
  ], 30, 91) };
}
export const solStill = (pose, f, mood) => still('sol', MOODS.has(mood) ? mood : 'idle');
export const lunaStill = (pose, f, mood) => still('luna', MOODS.has(mood) ? mood : 'idle');
