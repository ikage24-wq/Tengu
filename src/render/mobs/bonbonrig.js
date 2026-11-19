// Queen Bonbon (redrawn 2026-11-19, the player's pick "A, the Walking Cake"): the Candy Volcano's
// queen, a three-tier cake that walks. Her tiers are her body: the bottom tier (pink frosting,
// cherries round it) her hips, the middle (a caramel band dripping, gold stars) her chest, the top
// (a pink frosting cap) her head, with her face on it and a gold crown with a big cherry on top.
// Stubby chocolate legs in pink boots, frosting arms with little white mitts, and her sceptre: a
// great spoon, a gold handle, a silver bowl heaped with frosting and a cherry, gripped at the end of
// its handle so the bowl stands beside her face, never over it (when a swing would carry it across
// her head, it goes behind).
//
// Each tier turns on the one below it on its own spring, so she wobbles like a jelly, tier after
// tier, whenever she moves (all turning, nothing squashed).
//
// How she moves:
//   idle    a 12 s act: a regal sway; a royal wave; admiring her spoon, held up to the light.
//   walk    a stubby waddle on planted feet (knees bend to wherever each foot is, so nothing
//           slides), a big bob on every step, the tiers wobbling after it, arms swinging.
//   fight   (world/volcano.js) a plain swing: the spoon over the top and down (a bonk); Sugar
//           Bombs (m.bombAt): a scoop of frosting off the floor, flung high; the caramel rising
//           (m.floodAt): arms flung up to summon it, then out wide; the Eruption (m.castPose
//           'erupt', a cast bar): a deep crouch, a leap, and she lands with the whole crater.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, blend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, faceShapes, sparkle, puff } from './rigkit.js';

const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
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
const ovl = (cx, cy, rx, ry, deg, c, n = 16) => {
  const r = deg * D2R;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    pts.push([cx + Math.cos(t) * rx * Math.cos(r) - Math.sin(t) * ry * Math.sin(r), cy + Math.cos(t) * rx * Math.sin(r) + Math.sin(t) * ry * Math.cos(r)]);
  }
  return T(pts, c);
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
const INK = '#2e1c26';
const line = (pts, w, c = INK) => stroke(pts, w, c).map(F);
const aim = (want, arm, elb, tilt = 0) => want - arm - elb - tilt;
const unwind = (st, name, goal) => {
  const sp = st?.[name];
  if (!sp) return;
  if (sp.x - goal > 270) sp.x -= 360;
  else if (goal - sp.x > 270) sp.x += 360;
};

const CAKE = ramp('#fff0dc', { step: 7, turn: 8 });
const FROST = ramp('#ffc8dc', { step: 7, turn: 8 });
const CARAMEL = ramp('#e8902a', { step: 10, turn: 8 });
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
const PINK = ramp('#ff9ac0', { step: 8, turn: 8 });
const CHERRY = '#e8384a';
const bb = pairOf('bb2');
const drips = (x0, x1, y, c, n, seed = 0) => Array.from({ length: n }, (_, i) => {
  const x = x0 + ((i + 0.5) * (x1 - x0)) / n;
  const l = 2 + (((i + seed) * 7) % 4);
  return T([[x - 1.6, y], [x + 1.6, y], [x + 1.2, y + l], [x, y + l + 1.6], [x - 1.2, y + l]], c);
});

// ---------- Parts ----------
// A cake tier, a cylinder seen from a little above: straight cream sides with a softly rounded
// base, the top surface frosted (an oval), the frosting dripping down the side.
const tierShapes = (w, h, top, drip, nd, seed) => {
  const cx = w / 2;
  const rx = cx - 2;
  return [
    E(cx, h - 2, rx, 2.6, CAKE.sh), R(2, 6, w - 4, h - 8, CAKE.base), F(R(2, 6, 3, h - 8, CAKE.hi)), F(R(w - 6, 6, 4, h - 8, CAKE.sh)),
    ...drips(4, w - 4, 7, drip, nd, seed), E(cx, 6, rx + 0.6, 3.6, top), F(E(cx - rx * 0.35, 5.2, rx * 0.4, 1.2, '#ffffff')),
  ];
};
// The bottom tier (her hips): pink frosting on top, cherries round its side. Box 54 x 28; it sits
// on its bottom middle (27, 26).
const tier0 = () => [...tierShapes(54, 28, FROST.base, FROST.base, 7, 0), ...[9, 21, 33, 45].map((x) => [E(x, 19, 2.6, 2.4, CHERRY), F(E(x - 0.8, 18.2, 0.8, 0.6, '#ffffff'))]).flat()];
// The middle tier (her chest): caramel on top, dripping, gold stars round it. Box 42 x 28; on (21, 26).
const tier1 = () => [...tierShapes(42, 28, CARAMEL.base, CARAMEL.base, 6, 2), ...[[10, 18], [21, 17], [32, 18]].map(([x, y]) => F(star5(x, y, 2.2, GOLD.base)))];
// The top tier (her head): a pink frosting cap with scalloped drips. Box 36 x 34; on (18, 32).
const tier2 = () => {
  const out = tierShapes(36, 34, FROST.base, FROST.base, 5, 4);
  return [...out, ...[5, 11, 17, 23, 29].map((x, k) => E(x, 8.6 + (k % 2) * 0.8, 3.2, 2.4, FROST.base))];
};
// Her crown, a big cherry on a stem on top (box 26 x 26 from its base (13, 24)).
const crownP = () => [T([[3, 24], [3, 15], [8, 19], [13, 12], [18, 19], [23, 15], [23, 24]], GOLD.base), F(R(3, 22.4, 20, 1.6, GOLD.sh)), F(T([[4, 23], [4, 17], [7, 20]], GOLD.hi)), E(13, 12, 1.8, 1.8, CHERRY), E(3, 15, 1.4, 1.4, '#7ae0c0'), E(23, 15, 1.4, 1.4, '#7ae0c0'), E(13, 7, 4, 4, CHERRY), F(E(11.8, 5.8, 1.2, 0.9, '#ffffff')), ...line([[13, 3.4], [15, 0.6]], 0.7, '#5a8a3a'), F(E(16.4, 1.2, 1.6, 0.8, '#7ac04a'))];
// A frosting arm: the upper (box 11 x 9 from the shoulder (2, 4.5); the elbow 7 on), the forearm
// (box 11 x 8 from (2, 4); the grip 7 on), a white mitt (box 10 x 10 about (5, 5)).
const upperA = (far) => () => [taper([[2, 4.5], [9, 4.5]], 6.4, 5.8, far ? FROST.sh : FROST.base), F(E(4, 3, 2.2, 1, '#ffe0ec'))];
const foreA = (far) => () => [taper([[2, 4], [9, 4]], 5.8, 5.2, far ? FROST.sh : FROST.base), ...[3.6, 6.4].map((x) => F(E(x, 6.4, 0.9, 0.6, far ? '#e8a8c0' : '#ffd8e8')))];
const mitt = (far) => () => [E(5, 5, 4, 3.8, far ? '#e8e0f0' : '#ffffff'), F(E(3.8, 3.8, 1.2, 0.8, '#ffffff'))];
// A stubby chocolate leg: the thigh (box 12 x 10 from (6, 1.5); the knee 6 down), the shin (box
// 12 x 10 from (6, 1); the ankle 6.4 down), a pink boot (box 18 x 10 from the ankle (6, 2)).
const LEGC = ramp('#6a4a2a', { step: 8, turn: 8 });
const thighP = (far) => () => [taper([[6, 1.5], [6, 7.6]], 9, 8.4, far ? LEGC.sh : LEGC.base)];
const shinP = (far) => () => [taper([[6, 1], [6, 7.4]], 8.4, 7.8, far ? LEGC.sh : LEGC.base), F(E(4, 3, 1.4, 2, far ? LEGC.base : LEGC.hi))];
const bootP = (far) => () => [blob([[1.2, 0.4], [10.8, 0.4], [11.4, 3.4], [16, 4.6], [16.4, 8.4], [0.8, 8.4]], far ? PINK.sh : PINK.base), F(R(0.8, 0.2, 10.6, 2.2, '#ffffff')), F(R(1, 7.6, 15.2, 0.8, '#7a2a4a')), F(E(13, 4.8, 1.2, 0.7, '#ffd0e4'))];
// The spoon sceptre, gripped at the end of its handle (11, 58): the gold handle up to a silver bowl
// heaped with frosting and a cherry. Box 22 x 68.
const spoonP = () => [
  taper([[11, 62], [11, 21]], 3, 2.4, GOLD.base), F(taper([[10.4, 60], [10.4, 23]], 0.7, 0.6, '#fff3c4')), E(11, 63, 2.6, 2.4, GOLD.sh), E(11, 21.4, 2.2, 1.6, GOLD.sh),
  ovl(11, 13, 7.4, 9.4, 0, '#d8dcec'), F(ovl(9, 12, 4.6, 6.6, 0, '#f4f6ff')),
  blob([[4, 12], [7, 5], [12, 7], [16, 3], [19, 10], [15, 14], [7, 15]], PINK.base), F(blob([[7, 8], [11, 7], [9, 10]], '#ffd0e4')),
  E(13, 3, 2.4, 2.4, CHERRY), F(E(12.2, 2.2, 0.8, 0.6, '#ffffff')),
];
const BB = {
  T0: bb('tier0', 54, 28, tier0, 2), T1: bb('tier1', 42, 28, tier1, 2), T2: bb('tier2', 36, 34, tier2, 2), CROWN: bb('crown', 26, 26, crownP, 2),
  UP: [false, true].map((f) => bb(`up${f ? 1 : 0}`, 11, 9, upperA(f), 2)), FORE: [false, true].map((f) => bb(`fore${f ? 1 : 0}`, 11, 8, foreA(f), 2)), MITT: [false, true].map((f) => bb(`mitt${f ? 1 : 0}`, 10, 10, mitt(f), 2)),
  THIGH: [false, true].map((f) => bb(`thigh${f ? 1 : 0}`, 12, 10, thighP(f), 2)), SHIN: [false, true].map((f) => bb(`shin${f ? 1 : 0}`, 12, 10, shinP(f), 2)), BOOT: [false, true].map((f) => bb(`boot${f ? 1 : 0}`, 18, 10, bootP(f), 2)),
  SPOON: bb('spoon', 22, 68, spoonP, 2),
};

// ---------- Faces (on the top tier; box 36 x 34 as it) ----------
const EN = [26.6, 20, 3.4];
const EF = [15.6, 20, 3];
const eye = ([x, y, r], { lid = 0, small = false } = {}) => [
  F(E(x, y, r, r * 1.15, INK)), F(E(x, y + r * 0.35, r * 0.8, r * 0.7, '#c83a6a')),
  ...(small ? [F(E(x, y, r * 0.3, r * 0.34, '#ffffff'))] : [F(E(x - r * 0.3, y - r * 0.4, r * 0.4, r * 0.42, '#ffffff')), F(E(x + r * 0.35, y + r * 0.4, r * 0.15, r * 0.15, '#ffffff'))]),
  ...(lid > 0 ? [F(T([...arcP(x, y, r * 1.12, r * 1.25, 180, 360, 8), ...arcP(x, y - r * 1.15 * (1 - lid * 2), r * 1.12, r * 0.35, 0, 180, 8)], CAKE.base)), ...line(arcP(x, y - r * 1.15 * (1 - lid * 2), r * 1.05, r * 0.32, 15, 165, 7), 0.6)] : []),
  // (Lashes: she is a queen.)
  ...line([[x + r * 0.8, y - r * 0.9], [x + r * 1.3, y - r * 1.3]], 0.6), ...line([[x + r * 0.2, y - r * 1.12], [x + r * 0.4, y - r * 1.6]], 0.6),
];
const shutE = ([x, y, r], up = false) => line(arcP(x, y + 0.6, r, r * 0.6, up ? 200 : 20, up ? 340 : 160, 7), 0.8);
const BROW = '#c86a8a';
const brows = (n, f, c = BROW) => [F(taper(n, 1.2, 0.6, c)), F(taper(f, 1.1, 0.5, c))];
const BN = [[23, 14.6], [30, 14]];
const BF = [[12.6, 15], [18, 14.6]];
const up = (pts, k) => pts.map(([x, y]) => [x, y - k]);
const MOUTH = [25, 28];
const smileM = () => line(arcP(...MOUTH, 2.6, 1.4, 20, 160, 6), 0.8, '#a02a4a');
const openM = (k = 1) => [F(E(MOUTH[0], MOUTH[1] + 0.6, 2.4 * k, 2 * k, '#a02a4a')), F(E(MOUTH[0], MOUTH[1] + 1.4, 1.3 * k, 0.8 * k, '#ff9ab0'))];
const pout = () => [F(E(MOUTH[0], MOUTH[1] + 0.6, 1.4, 1.1, '#c83a6a'))];
const blush = (k = 1) => [F(E(10, 25, 2.6 * k, 1.3 * k, '#ff9ab0')), F(E(31, 25, 2.2 * k, 1.1 * k, '#ff9ab0'))];
const BB_FACES = {
  // Regal and pleased with herself.
  idle: () => [...eye(EN, { lid: 0.2 }), ...eye(EF, { lid: 0.2 }), ...brows(BN, BF), ...smileM(), ...blush()],
  blink: () => [...shutE(EN), ...shutE(EF), ...brows(BN, BF), ...smileM(), ...blush()],
  happy: () => [...shutE(EN, true), ...shutE(EF, true), ...brows(up(BN, 1), up(BF, 1)), ...openM(0.9), ...blush(1.2)],
  // Imperious: a royal pout, brows down.
  angry: () => [...eye(EN, { lid: 0.35, small: true }), ...eye(EF, { lid: 0.35, small: true }), ...brows([[22.6, 13.2], [30.4, 15.6]], [[12.4, 16], [18.4, 13.6]], INK), ...pout(), ...blush(0.8)],
  shout: () => [...eye(EN, { small: true }), ...eye(EF, { small: true }), ...brows(up(BN, 1.6), up(BF, 1.6), INK), ...openM(1.3), ...blush(0.8)],
  hurt: () => [...line([[EN[0] - 3, EN[1] - 2.2], [EN[0] + 1.6, EN[1]], [EN[0] - 3, EN[1] + 2.2]], 0.8), ...line([[EF[0] + 2.6, EF[1] - 2], [EF[0] - 1.4, EF[1]], [EF[0] + 2.6, EF[1] + 2]], 0.8), ...brows([[23, 13], [30, 15.4]], [[12.6, 15.4], [18, 13]]), ...pout(), E(31, 22, 1.1, 1.6, '#6ec4ff')],
  dead: () => [...line([[EN[0] - 2.6, EN[1] - 2.6], [EN[0] + 2.6, EN[1] + 2.6]], 0.8), ...line([[EN[0] + 2.6, EN[1] - 2.6], [EN[0] - 2.6, EN[1] + 2.6]], 0.8), ...line([[EF[0] - 2.2, EF[1] - 2.2], [EF[0] + 2.2, EF[1] + 2.2]], 0.7), ...line([[EF[0] + 2.2, EF[1] - 2.2], [EF[0] - 2.2, EF[1] + 2.2]], 0.7), ...openM(0.6)],
};
const FACE_FB = { eyes: [[EN[0], EN[1], 3, 3.4, 1], [EF[0], EF[1], 2.6, 3, -1]], mouth: [MOUTH[0], MOUTH[1], 1], blush: [[10, 25, 1.6], [31, 25, 1.6]], iris: '#c83a6a', lid: 0, lashes: 1 };
const bbFace = (mood) => faceSprite(`bb2|face|${mood}`, 36, 34, () => (BB_FACES[mood] ?? (() => faceShapes(mood, FACE_FB)))());

// ---------- Skeleton ----------
// (The hip 20 above the floor; the bottom tier sits 2 under it, the middle tier on top of that
// (22 up), the top on the middle (22 up). Shoulders on the middle tier, 14 up its side.)
const HIP = 20;
const L1 = 6;
const L2 = 6.4;
const LEG_DY = 11.8;
const UA = 7;
const FA = 7;
function legIK(dx, dy, hipDeg) {
  const d = Math.min(L1 + L2 - 0.05, Math.max(3, Math.hypot(dx, dy)));
  const h = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const k = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return [(-Math.atan2(dx, dy) - h) / D2R - hipDeg, (Math.PI - k) / D2R];
}
const [ST, SS] = legIK(0, LEG_DY, 0);
const legs = (tn, sn, tf, sf) => ({ thighN: tn, shinN: sn, thighF: tf, shinF: sf, rollN: 0, rollF: 0 });
const SQUAT = legs(ST - 22, SS + 40, ST - 18, SS + 36);
// Would the spoon overlap her head (the top tier)? Worked in the middle tier's space: the
// shoulder at (14, -14), the head's middle about 36 above the tier's base, turned by tC.
const SPOON_PTS = [[0, -45], [-6, -45], [6, -45], [0, -52], [0, -38], [0, -30], [0, -20], [0, -10]];
const behind = (a, S) => {
  const ar = S.armN * D2R;
  const er = (S.armN + S.elbN) * D2R;
  const wx = 14 + UA * Math.cos(ar) + FA * Math.cos(er);
  const wy = -14 + UA * Math.sin(ar) + FA * Math.sin(er);
  const pr = (S.armN + S.elbN + S.spoon) * D2R;
  const hr = S.tC * D2R;
  const hx = 14 * Math.sin(hr);
  const hy = -22 - 14 * Math.cos(hr);
  return SPOON_PTS.some(([px, py]) => {
    const x = wx + px * Math.cos(pr) - py * Math.sin(pr);
    const y = wy + px * Math.sin(pr) + py * Math.cos(pr);
    return ((x - hx) / 17.6) ** 2 + ((y - hy) / 15.6) ** 2 < 1;
  });
};
const before = (a, S) => !behind(a, S);

const bbPass = (bare) => {
  const i = bare ? 1 : 0;
  const t = bare ? 'b' : '';
  const leg = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `boot${k}${t}`, parent: `ankle${k}`, s: BB.BOOT[j][i], pivot: [6, 2], rot: (S) => -(S.tilt * 0.3 + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
      { name: `shin${k}${t}`, parent: `knee${k}`, s: BB.SHIN[j][i], pivot: [6, 1], rot: (S) => S[`shin${k}`] * D2R },
      { name: `thigh${k}${t}`, parent: 'hip', s: BB.THIGH[j][i], pivot: [6, 1.5], at: () => [far ? -8 : 8, 0], rot: (S) => S[`thigh${k}`] * D2R },
    ];
  };
  const arm = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return {
      up: { name: `up${k}${t}`, parent: 'tier1', s: BB.UP[j][i], pivot: [2, 4.5], at: () => (far ? [-18, -14] : [14, -14]), rot: (S) => S[`arm${k}`] * D2R },
      fore: { name: `fore${k}${t}`, parent: `elbow${k}`, s: BB.FORE[j][i], pivot: [2, 4], rot: (S) => S[`elb${k}`] * D2R },
      mitt: { name: `mitt${k}${t}`, parent: `grip${k}`, s: BB.MITT[j][i], pivot: [5, 5] },
    };
  };
  const an = arm(false);
  const af = arm(true);
  const spoon = { name: `spoon${t}`, parent: 'gripN', s: BB.SPOON[i], pivot: [11, 58], rot: (S) => S.spoon * D2R };
  return [
    af.up, af.fore, af.mitt,
    ...leg(true), ...leg(false),
    { name: `tier0${t}`, parent: 'hip', s: BB.T0[i], pivot: [27, 26], at: () => [1, 2], rot: (S) => S.tA * D2R },
    { name: `tier1${t}`, parent: 'tier0', s: BB.T1[i], pivot: [21, 26], at: () => [0, -22], rot: (S) => S.tB * D2R },
    an.up,
    { ...an.fore, name: `foreNk${t}`, when: behind }, { ...an.mitt, name: `mittNk${t}`, when: behind }, { ...spoon, name: `spoonk${t}`, when: behind },
    { name: `tier2${t}`, parent: 'tier1', s: BB.T2[i], pivot: [18, 32], at: () => [0, -22], rot: (S) => S.tC * D2R },
    ...(bare ? [{ name: 'face', parent: 'tier2', s: (a) => bbFace(a.bbMood), pivot: [18, 32] }] : []),
    { name: `crown${t}`, parent: 'tier2', s: BB.CROWN[i], pivot: [13, 24], at: () => [0, -27], rot: (S) => S.crown * D2R },
    { ...an.fore, when: before }, { ...an.mitt, when: before }, { ...spoon, when: before },
  ];
};

// ---------- Moves ----------
// The spoon's world angle (in the middle tier's space): 0 bowl up, 90 pointing forward, 180 down.
function bbMove(kind, t) {
  const base = { crown: 0, armF: 100, elbF: -30 };
  if (kind === 'bombs') return [
    // Sugar Bombs: the spoon dipped to the floor before her, scooping...
    { ...base, x: 2, lift: -3, tilt: 14, tA: 4, tB: 6, tC: 8, armN: 70, elbN: 10, spoon: aim(150, 70, 10, 0), armF: 120, elbF: -20, crown: 8, ...legs(ST - 14, SS + 24, ST + 4, SS + 14) },
    // ...and flung high over her shoulder, frosting flying.
    { ...base, x: -2, lift: 2, tilt: -10, tA: -4, tB: -6, tC: -8, armN: -100, elbN: -20, spoon: aim(-40, -100, -20, 0), armF: 60, elbF: -40, crown: -10, ...legs(ST + 6, SS - 8, ST + 6, SS - 8) },
  ];
  if (kind === 'flood') return [
    // The caramel rising: both arms flung up to summon it, the spoon high...
    { ...base, x: 0, lift: 3, tilt: -8, tA: -3, tB: -5, tC: -10, armN: -60, elbN: -20, spoon: aim(-6, -60, -20, 0), armF: -120, elbF: -10, crown: -8, ...legs(ST + 6, SS - 10, ST + 6, SS - 10) },
    // ...then thrown out wide, a stamp, every tier wobbling.
    { ...base, x: 0, lift: -3, tilt: 4, tA: 6, tB: -6, tC: 8, armN: 10, elbN: 0, spoon: aim(60, 10, 0, 0), armF: 170, elbF: 0, crown: 10, ...legs(ST - 16, SS + 26, ST - 12, SS + 22) },
  ];
  if (kind === 'erupt') return [
    // The Eruption: up in the air out of her crouch, legs tucked, the spoon held high...
    { ...base, x: 0, lift: 16, tilt: -6, tA: -6, tB: -8, tC: -10, armN: -70, elbN: -20, spoon: aim(-10, -70, -20, 0), armF: -110, elbF: -10, crown: -10, ...legs(ST - 30, SS + 50, ST - 26, SS + 54) },
    // ...and down, every tier thumping onto the one below.
    { ...base, x: 0, lift: -5, tilt: 10, tA: 8, tB: -10, tC: 12, armN: 20, elbN: 0, spoon: aim(110, 20, 0, 0), armF: 170, elbF: 0, crown: 16, ...SQUAT },
  ];
  // A bonk: the spoon back, up behind her head and over the top, down on you.
  return [
    { ...base, x: -2, lift: 1, tilt: -8, tA: -3, tB: -5, tC: -7, armN: 230, elbN: -20, spoon: aim(-30, -130, -20, 0), armF: 70, elbF: -40, crown: -6, ...legs(ST + 6, SS - 4, ST - 4, SS + 6) },
    { ...base, x: 7, lift: -2, tilt: 14, tA: 5, tB: 8, tC: 10, armN: 400, elbN: -10, spoon: aim(110, 40, -10, 0), armF: 130, elbF: -20, crown: 10, ...legs(ST - 22, SS + 16, ST + 16, SS) },
  ];
}
const OVER = new Set(['bonk']);
// The Eruption's crouch, held through the cast.
const PREP = { x: 0, lift: -5, tilt: 6, tA: 4, tB: 6, tC: 4, armN: 60, elbN: -40, spoon: aim(20, 60, -40, 0), armF: 130, elbF: -20, crown: 6, ...SQUAT };

export const bonbonRig = makeRig({
  w: 80, h: 120, soft: true, stride: 8, recover: 0.6,
  springs: {
    x: [200, 16], lift: [200, 14], tilt: [150, 12], tA: [110, 7], tB: [80, 5], tC: [70, 4.4], crown: [70, 4.6],
    armN: [200, 15], elbN: [210, 15], armF: [160, 12], elbF: [170, 12], spoon: [200, 15],
    thighN: [300, 18], thighF: [300, 18], shinN: [300, 18], shinF: [300, 18], rollN: [300, 18], rollF: [300, 18],
  },
  fast: ['x', 'armN', 'elbN', 'spoon', 'armF', 'elbF', 'thighN', 'thighF', 'shinN', 'shinF', 'lift'],
  kick: { tilt: -120, tA: 160, tB: -220, tC: 280, crown: 300 },
  turnKick: { tA: 160, tB: 220, tC: 260, crown: 300 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const mo = a.mo ?? {};
    const st = mo.rig;
    const now = a.now;
    a.bbU = stepPhase(m, a, 'bb2', 18);
    const act = (at, wind, dur) => (at != null && now >= at - wind && now < at + dur ? { antic: now < at ? smooth(1 - (at - now) / wind) : 0, strike: now >= at ? (now - at < 0.07 ? smooth((now - at) / 0.07) : 1 - smooth(clamp((now - at - 0.25) / (dur - 0.25), 0, 1))) : 0 } : null);
    const bombA = act(m.bombAt, 0.6, 1);
    const floodA = act(m.floodAt, 0.8, 1.4);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    if (m.castPose === 'erupt') mo.bbForce = 'erupt';
    else if (!active) mo.bbForce = null;
    let kind = mo.bbForce ?? 'bonk';
    let ph = a.ph;
    if (!active && !m.castPose && (bombA || floodA)) {
      kind = floodA ? 'flood' : 'bombs';
      ph = { ...a.ph, ...(floodA ?? bombA), since: -1 };
    }
    a.bbKind = kind;
    a.bbPh = ph;
    const cast = m.cast && m.castPose ? clamp((now - m.cast.t0) / 0.5, 0, 1) : 0;
    a.bbCast = cast;
    const still = 1 - (a.walkW ?? 0);
    // Her idle, a 12 s act: a regal sway; a royal wave; the spoon held up to the light, admired.
    const lu = fr(t / 12) * 12;
    const sway = Math.sin(t * 1.1);
    const busy = active || bombA || floodA || m.castPose || (a.walkW ?? 0) > 0.05;
    const wave = busy ? 0 : hold(lu, 3.4, 3.8, 5.4, 5.8);
    const admire = busy ? 0 : hold(lu, 8, 8.4, 9.8, 10.2);
    a.bbAct = { wave: wave * still, admire: admire * still };
    const idle = {
      x: 0, lift: Math.max(0, sway) * 0.6, tilt: sway * 1.2, tA: sway * 1.6, tB: -sway * 1.4, tC: sway * 2 + admire * -4,
      armN: 62 - admire * 110, elbN: -40 + admire * 10, spoon: aim(14 - admire * 4, 62 - admire * 110, -40 + admire * 10), armF: 110 - wave * 230 + Math.sin(t * 9) * 16 * wave, elbF: -30 - wave * 30 + Math.sin(t * 9 + 1) * 20 * wave,
      ...legs(ST, SS, ST, SS), crown: -sway * 3,
    };
    // A stubby waddle on planted feet: a big bob on each step, the tiers wobbling after it.
    const u = a.bbU;
    const lead = ((st?.bb2V ?? 0) / 18) * 0.05;
    const [dxN, upN] = pawStep(u + lead, 0, 18, 0.58, 4.4);
    const [dxF, upF] = pawStep(u + lead, 0.5, 18, 0.58, 4.4);
    const w2 = u * TAU * 2;
    const land = (1 + Math.cos(w2)) / 2;
    const sw = Math.sin(u * TAU);
    const wLift = 0.6 - land * 2.6;
    const wTilt = 3 + land * 2;
    const [thN, shN] = legIK(dxN, LEG_DY + wLift - upN, wTilt * 0.3);
    const [thF, shF] = legIK(dxF, LEG_DY + wLift - upF, wTilt * 0.3);
    const walk = {
      x: 0, lift: wLift, tilt: wTilt, tA: sw * 3 + land * 2, tB: -Math.sin(u * TAU - 0.8) * 3 - land * 1.5, tC: Math.sin(u * TAU - 1.6) * 4 + land * 2,
      armN: 62 + sw * 10, elbN: -40, spoon: aim(14 + land * 3, 62 + sw * 10, -40), armF: 100 - sw * 30, elbF: -30,
      thighN: thN, shinN: shN, thighF: thF, shinF: shF, rollN: upN * 3, rollF: upF * 3, crown: Math.sin(w2 - 1.4) * 6,
    };
    const [antic, strike] = bbMove(kind, t);
    let base = idle;
    if (cast > 0 && kind === 'erupt') base = blend([[idle, 1 - cast * 0.9], [{ ...idle, ...PREP }, cast * 0.9]]);
    // (The over-the-top bonk: the rest pose a turn round until the move is over.)
    if (OVER.has(kind) && ph.since >= 0) mo.bbWrap = 360;
    if (mo.bbWrap && !active) {
      mo.bbWrap = 0;
      if (st?.armN && st.armN.x > 200) st.armN.x -= 360;
    }
    base = { ...base, armN: base.armN + (mo.bbWrap ?? 0) };
    walk.armN += mo.bbWrap ?? 0;
    a.bbMood = bbMood(a, m);
    const S = stateBlend({ ...a, ph }, base, walk, antic, strike);
    unwind(st, 'spoon', S.spoon);
    return S;
  },
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -HIP - S.lift], rot: (S) => S.tilt * 0.3 * D2R },
    { name: 'elbowN', parent: 'upN', at: () => [UA, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [UA, 0] },
    { name: 'gripN', parent: 'foreN', at: () => [FA, 0] },
    { name: 'gripF', parent: 'foreF', at: () => [FA, 0] },
    { name: 'kneeN', parent: 'thighN', at: () => [0, L1] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, L1] },
    { name: 'ankleN', parent: 'shinN', at: () => [0, L2] },
    { name: 'ankleF', parent: 'shinF', at: () => [0, L2] },
    ...bbPass(false),
    ...bbPass(true),
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const ph = a.bbPh ?? a.ph;
    const kind = a.bbKind;
    const [bx, by] = at2(mat('spoon'), 0, -45);
    // Sugar Bombs: frosting flung up out of the spoon.
    if (kind === 'bombs' && ph.strike > 0.1) for (let k = 0; k < 4; k++) {
      const u = 1 - ph.strike;
      ctx.globalAlpha = a.alpha * ph.strike;
      ctx.fillStyle = k % 2 ? '#ff9ac0' : '#ffc8dc';
      ctx.beginPath();
      ctx.arc(bx + (k - 1.5) * 8 * (0.3 + u), by - 6 - u * 40 - k * 4, 3.4, 0, TAU);
      ctx.fill();
      sparkle(ctx, a, bx + (k - 1.5) * 10 * u, by - 14 - u * 30, 1.8 * ph.strike, a.alpha * ph.strike, '#ffffff');
    }
    // The caramel rising: caramel welling over her middle tier and splashing round her feet.
    if (kind === 'flood' && (ph.antic > 0.3 || ph.strike > 0.1)) {
      const on = Math.max(ph.antic * 0.6, ph.strike);
      const [fx2, fy2] = at2(mat('hip'), 0, 20);
      ctx.globalAlpha = a.alpha * on * 0.8;
      ctx.strokeStyle = '#e8902a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(fx2, fy2, 14 + (1 - on) * 30, 3 + (1 - on) * 4, 0, 0, TAU);
      ctx.stroke();
      for (let k = 0; k < 5; k++) {
        const [dx2, dy2] = at2(mat('tier1'), -16 + k * 8, -18);
        const l = 3 + fr(a.now * 1.2 + k * 0.3) * 8 * on;
        ctx.fillStyle = '#e8902a';
        ctx.fillRect(dx2 - 1, dy2, 2, l);
      }
    }
    // A bonk and the Eruption: a puff and a splash of frosting where she lands.
    if ((kind === 'bonk' && ph.strike > 0.3) || (kind === 'erupt' && ph.strike > 0.2)) {
      const big = kind === 'erupt' ? 1.8 : 1;
      const [px, py] = kind === 'erupt' ? at2(mat('hip'), 0, 20) : [bx, by];
      puff(ctx, a, px, py, 8 * big * ph.strike, a.alpha * ph.strike * 0.5);
      for (let k = 0; k < 6; k++) {
        const ang = Math.PI + (k / 5) * Math.PI;
        const r = (8 + (1 - ph.strike) * 18) * big;
        ctx.globalAlpha = a.alpha * ph.strike;
        ctx.fillStyle = k % 2 ? '#ff9ac0' : '#ffd0e4';
        ctx.beginPath();
        ctx.ellipse(px + Math.cos(ang) * r, py + Math.sin(ang) * r * 0.4, 2.2, 1.7, 0, 0, TAU);
        ctx.fill();
      }
    }
    // Admiring her spoon: a twinkle on the bowl.
    if ((a.bbAct?.admire ?? 0) > 0.5) sparkle(ctx, a, bx + 4, by - 6, 2.6 + Math.sin(a.now * 6), a.alpha, '#ffffff');
    ctx.globalAlpha = a.alpha;
  },
});
function bbMood(a, m) {
  if (m.hp <= 0) return 'dead';
  const ph = a.bbPh ?? a.ph;
  if (ph.strike > 0.25) return 'shout';
  if (a.ph.atk || ph.antic > 0.3 || a.bbCast > 0.5) return 'angry';
  if (a.mood === 'hurt' || a.face === 'hurt') return 'hurt';
  const act = a.bbAct ?? {};
  if (act.wave > 0.4 || act.admire > 0.4) return 'happy';
  const t = a.t + (a.uidOff ?? 0);
  if (t % 4.4 < 0.13) return 'blink';
  return 'idle';
}

// ---------- The still (portraits) ----------
export function bonbonStill(pose, f, mood) {
  const fm = BB_FACES[mood] ? mood : MOODS.has(mood) ? mood : 'idle';
  const hip = [0, -HIP];
  const t0 = [1, hip[1] + 2];
  const t1 = [t0[0], t0[1] - 22];
  const t2 = [t1[0], t1[1] - 22];
  const legAt = (far) => {
    const x = far ? -8 : 8;
    const tr = ST * D2R;
    const kx = x - Math.sin(tr) * L1;
    const ky = hip[1] + Math.cos(tr) * L1;
    const sr = (ST + SS) * D2R;
    return [...put(bootP(far)(), [6, 2], kx - Math.sin(sr) * L2, ky + Math.cos(sr) * L2, 0), ...put(shinP(far)(), [6, 1], kx, ky, ST + SS), ...put(thighP(far)(), [6, 1.5], x, hip[1], ST)];
  };
  const arm = (far, armA, elbA) => {
    const [sx, sy] = far ? [t1[0] - 18, t1[1] - 14] : [t1[0] + 14, t1[1] - 14];
    const ex = sx + Math.cos(armA * D2R) * UA;
    const ey = sy + Math.sin(armA * D2R) * UA;
    const fa = armA + elbA;
    const gx = ex + Math.cos(fa * D2R) * FA;
    const gy = ey + Math.sin(fa * D2R) * FA;
    return { up: put(upperA(far)(), [2, 4.5], sx, sy, armA), fore: put(foreA(far)(), [2, 4], ex, ey, fa), mitt: put(mitt(far)(), [5, 5], gx, gy, 0), grip: [gx, gy] };
  };
  const an = arm(false, 62, -40);
  const af = arm(true, 110, -30);
  return { w: 80, h: 120, res: 2, shapes: shift([
    ...af.up, ...af.fore, ...af.mitt,
    ...legAt(true), ...legAt(false),
    ...put(tier0(), [27, 26], t0[0], t0[1]), ...put(tier1(), [21, 26], t1[0], t1[1]),
    ...an.up,
    ...put(tier2(), [18, 32], t2[0], t2[1]), ...put((BB_FACES[fm] ?? BB_FACES.idle)(), [18, 32], t2[0], t2[1]), ...put(crownP(), [13, 24], t2[0], t2[1] - 27),
    ...an.fore, ...an.mitt, ...put(spoonP(), [11, 58], an.grip[0], an.grip[1], 36),
  ], 40, 119) };
}
