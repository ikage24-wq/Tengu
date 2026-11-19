// Old MacGoblin (redrawn 2026-11-19, the player's pick "A, the Pumpkin-Hat Farmer"): Clover Hills'
// area boss, the Pumpkin Goblins' grumpy old farmer chief: round and green, long droopy ears, a
// bulbous nose, bushy white brows and a walrus moustache, a whole pumpkin worn as a helmet (stem
// and a leaf on top), a cream shirt, patched denim overalls, big boots, his pitchfork.
//
// How he moves:
//   idle    a 10 s act: leaning on the pitchfork, tapping a boot; "Shoo!", a fist shaken at you;
//           a big yawn and a stretch.
//   walk    a heavy stomping waddle, the fork swung like a walking staff.
//   fight   his slam (m.special, world/mobs.js): the fork hauled up high as it winds up, then
//           driven down into the ground ahead in a burst of dirt.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, puff } from './rigkit.js';
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
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

const GOB = ramp('#8ac85a', { step: 9, turn: 10 });
const DENIM = ramp('#4a6ab0', { step: 9, turn: 8 });
const PUMP = ramp('#ff9a3a', { step: 9, turn: 8 });
const SHIRT = ramp('#eadcbc', { step: 7, turn: 8 });
const BOOT = ramp('#4a3226', { step: 7, turn: 8 });
const WHITE = '#f4f0ea';
const mg = pairOf('mg2');

// ---------- The pieces (each facing right) ----------
// His head: round and green, a bulbous nose, bushy white brows, a walrus moustache. Box 36 x 34;
// the neck at (18, 32), the head's middle at (18, 18).
const headP = () => [
  E(18, 18, 14, 13.4, GOB.base), crescent(18, 18, 14, 13.4, GOB.sh, { k: 0.15, a0: 110, a1: 220 }),
  E(21.4, 22, 4.4, 3.8, GOB.hi), F(E(20.4, 20.8, 1.4, 1, '#d0f0b0')),
  blob([[9, 26], [15, 23], [20, 25], [25, 23], [30, 26], [28, 30], [22, 28], [19, 29], [15, 28], [10, 30]], WHITE, 2),
  ...line([[12, 11.6], [17, 12.4]], 1.8, WHITE), ...line([[22, 12], [28, 11]], 2, WHITE),
];
const FACE = { eyes: [[25, 16.4, 2.6, 3.2, 1], [15.4, 16.8, 2.2, 2.8, -1]], mouth: [20, 31.4, 2.4], blush: [[27.4, 20, 1.8], [12.6, 20.4, 1.6]], iris: '#7a5a2a', k: 1.5, lid: 0.3, lashes: 0 };
const mgFace = (mood) => faceSprite(`mg2|face|${mood}`, 36, 34, () => faceShapes(mood, FACE));
// A droopy ear: long, a darker inside. Box 18 x 10; rooted at (2, 4).
const earP = (far) => () => [blob([[1, 2], [17, 6], [16, 8.6], [2, 7]], far ? GOB.sh : GOB.base, 2), F(blob([[4, 4], [14, 6.4], [4, 6]], '#5a8a3a', 1))];
// The pumpkin helmet: ribbed, a hole cut for his head, a stem and a leaf. Box 36 x 26; sits on his
// head at (18, 22).
const pumpkinP = () => [
  E(18, 13, 16.6, 11, PUMP.base), ...[-9, -3, 3, 9].map((d) => F(taper([[18 + d, 3], [18 + d * 1.1, 23]], 1, 1, PUMP.sh))), crescent(18, 13, 16.6, 11, PUMP.sh, { k: 0.18, a0: 120, a1: 220 }), F(E(13, 7, 4, 1.6, '#ffc080')),
  taper([[18, 3], [19, -3]], 2.6, 2.2, '#6a8a3a'),
];
const leafP = () => [blob([[1, 4], [8, 0.6], [13, 2], [9, 6]], '#7ab84a', 1), F(taper([[2, 4], [11, 2.4]], 0.5, 0.4, '#4a8a2a'))];
// His body: a cream shirt round his belly, the overalls' bib and straps, a red patch. Box 40 x 38;
// bodyJ at (20, 30).
const bodyP = () => [
  E(20, 17, 18, 17, SHIRT.base), crescent(20, 17, 18, 17, SHIRT.sh, { k: 0.18, a0: 100, a1: 210 }),
  blob([[3, 18], [37, 18], [38, 34], [2, 34]], DENIM.base, 2), T([[13, 8], [27, 8], [27, 20], [13, 20]], DENIM.base), ...[[11, 0], [29, 0]].map(([x]) => F(taper([[x, 2], [x + (x < 20 ? 3 : -3), 10]], 2.6, 2.6, DENIM.sh))),
  F(E(14.4, 10, 1.6, 1.6, '#ffd36b')), F(E(25.6, 10, 1.6, 1.6, '#ffd36b')), F(R(22, 24, 7, 6, '#d86a4a')), ...line([[22, 24], [29, 30]], 0.4), ...line([[29, 24], [22, 30]], 0.4),
  F(taper([[3, 32], [37, 32]], 1.4, 1.4, DENIM.sh)),
];
// Legs: denim, round at the knee; big boots.
const thighP = (far) => () => [taper([[5, 2], [5, 8]], 9, 8.6, far ? DENIM.sh : DENIM.base), E(5, 8, 4.3, 4.3, far ? DENIM.sh : DENIM.base)];
const shinP = (far) => () => [E(5, 2, 4.3, 4.3, far ? DENIM.sh : DENIM.base), taper([[5, 2], [5, 7.4]], 8.6, 8.2, far ? DENIM.sh : DENIM.base)];
const bootP = (far) => () => [blob([[0.6, 0.4], [9.6, 0.4], [14, 4], [13.6, 7], [0.4, 7]], far ? BOOT.sh : BOOT.base, 1), F(taper([[0.6, 6.4], [13.4, 6.4]], 1.2, 1.2, BOOT.deep))];
// Arms: a rolled cream sleeve, a green forearm and a big hand. Upper: box 13 x 10 at (2, 5); fore: box 15 x 10 at (2, 5).
const upP = (far) => () => [taper([[2, 5], [9, 5]], 8, 7.4, SHIRT.deep), E(9, 5, 3.8, 3.8, SHIRT.deep), taper([[2, 5], [9, 5]], 6.4, 5.8, far ? SHIRT.sh : SHIRT.base), E(9, 5, 3.1, 3.1, far ? SHIRT.sh : SHIRT.base)];
const foreP = (far) => () => [E(2, 5, 3.6, 3.6, GOB.deep), taper([[2, 5], [8, 5]], 6.6, 6.2, GOB.deep), E(2, 5, 2.9, 2.9, far ? GOB.sh : GOB.base), taper([[2, 5], [8, 5]], 5.4, 5, far ? GOB.sh : GOB.base), E(10.6, 5, 3.8, 3.6, far ? GOB.sh : GOB.base)];
// The pitchfork: an ash handle, an iron head, three tines. Box 16 x 78; gripped at (8, 40).
const forkP = () => [taper([[8, 76], [8, 14]], 2.2, 2, '#a87a4a'), taper([[2, 14], [14, 14]], 1.8, 1.8, '#9aa0b0'), ...[2.6, 8, 13.4].map((x) => taper([[x, 14], [x, 2]], 1.6, 0.6, '#b8c0cc')), F(taper([[7.4, 70], [7.4, 18]], 0.5, 0.5, '#c89a6a'))];

const SP = {
  HEAD: mg('head', 36, 34, headP, 2), EAR: [false, true].map((f) => mg(`ear${f ? 1 : 0}`, 18, 10, earP(f), 2)), PUMP: mg('pumpkin', 36, 26, pumpkinP, 6), LEAF: mg('leaf', 14, 7, leafP, 2), BODY: mg('body', 40, 38, bodyP, 2),
  THIGH: [false, true].map((f) => mg(`thigh${f ? 1 : 0}`, 10, 13, thighP(f), 2)), SHIN: [false, true].map((f) => mg(`shin${f ? 1 : 0}`, 10, 11, shinP(f), 2)), BOOT: [false, true].map((f) => mg(`boot${f ? 1 : 0}`, 15, 8, bootP(f), 2)),
  UP: [false, true].map((f) => mg(`up${f ? 1 : 0}`, 13, 10, upP(f), 2)), FORE: [false, true].map((f) => mg(`fore${f ? 1 : 0}`, 15, 10, foreP(f), 2)), FORK: mg('fork', 16, 78, forkP, 2),
};

// ---------- The skeleton ----------
const BODY_Y = 21;
const L1 = 6.4;
const L2 = 6.4;
const LEGS = chibiLegs({ bodyY: BODY_Y, l1: L1, l2: L2, sole: 7, hips: [[6, 2], [-6, 2]], feet: [8, -7] });
const FEET = [8, -7];
const SHN = [12, -20];
const SHF = [-11, -20];
const NECK = [2, -26];
const UA = 7;
export const macGoblinRig = makeRig({
  w: 120, h: 120, soft: true, stride: 1e9, recover: 0.6,
  springs: {
    x: [220, 16], lift: [220, 16], tilt: [160, 12], head: [140, 10], fork: [200, 14],
    armN: [220, 16], elbN: [220, 16], armF: [200, 15], elbF: [200, 15],
    thighN: [340, 21], thighF: [340, 21], shinN: [340, 21], shinF: [340, 21], rollN: [320, 20], rollF: [320, 20],
  },
  fast: ['x', 'lift', 'tilt', 'armN', 'elbN', 'armF', 'elbF', 'thighN', 'thighF', 'shinN', 'shinF', 'fork'],
  kick: { tilt: -110, head: -160 },
  turnKick: { head: 60 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.3;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'mg2', 18);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const lu = fr(t / 10) * 10;
    const busy = active || walkW > 0.05 || m.cine || m.aggroUntil === Infinity;
    const shoo = busy ? 0 : hold(lu, 3, 3.4, 4.8, 5.2);
    const yawn = busy ? 0 : hold(lu, 7.4, 7.9, 9, 9.5);
    const tap = busy ? 0 : Math.max(0, Math.sin(t * 7)) * (1 - shoo) * (1 - yawn);
    const br = Math.sin(t * 1.4);
    const liftI = br * 0.6 + yawn * 1.6;
    const tiltI = br * 1.4 - 4 - yawn * 10 + shoo * 6;
    const idle = {
      x: 0, lift: liftI, tilt: tiltI, head: Math.sin(t * 1.1) * 2 - yawn * 16 + shoo * 6 + shoo * Math.sin(t * 16) * 4, fork: -4,
      armN: 40, elbN: -60, armF: 110 - shoo * 190 - yawn * 160, elbF: -20 - shoo * 30 + shoo * Math.sin(t * 18) * 30 - yawn * 30,
      ...LEGS.at(liftI, tiltI, [FEET[0] + tap * 1.4, tap * 2.6], [FEET[1], 0]),
    };
    // A heavy stomping waddle, the fork swung like a staff.
    const steps = [pawStep(u, 0, 18, 0.6, 3.6), pawStep(u, 0.5, 18, 0.6, 3.6)];
    const sw = Math.sin(u * TAU);
    const liftW = Math.abs(Math.cos(u * TAU)) * 1.4 - 0.4;
    const tiltW = 3 + sw * 4;
    const walk = { ...idle, lift: liftW, tilt: tiltW, head: -2 - sw * 3, fork: sw * 12, armN: 30 + sw * 14, elbN: -50, armF: 100 - sw * 24, elbF: -20, ...LEGS.at(liftW, tiltW, [FEET[0] + steps[0][0], steps[0][1]], [FEET[1] + steps[1][0], steps[1][1]]) };
    // The slam: the fork hauled up high, then driven down ahead.
    const antic = { ...idle, x: -3, lift: 1, tilt: -12, head: -10, fork: 10, armN: -30, elbN: -60, armF: 30, elbF: -30, ...LEGS.at(1, -12, [FEET[0] - 2, 0], [FEET[1] - 3, 0]) };
    const strike = { ...idle, x: 8, lift: -2.4, tilt: 18, head: 8, fork: 180, armN: 10, elbN: 20, armF: 60, elbF: -20, ...LEGS.at(-2.4, 18, [FEET[0] + 8, 0], [FEET[1] - 2, 0]) };
    const S = stateBlend(a, idle, walk, antic, strike);
    if (m.hp <= 0) Object.assign(S, { lift: -12, tilt: -10, head: 16, fork: 70, armN: 60, elbN: 10, armF: 120, elbF: 20, ...LEGS.at(-12, -10, [FEET[0] + 10, 2], [FEET[1] + 13, 2]) });
    a.mgDust = a.ph.since >= 0.04 && a.ph.since < 0.7 ? 1 - (a.ph.since - 0.04) / 0.66 : 0;
    a.mgMood = m.hp <= 0 ? 'dead' : moodOf(a, shoo > 0.4 ? 'angry' : yawn > 0.4 ? 'sleep' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => NECK, rot: (S) => (S.head - S.tilt * 0.3) * D2R },
    { name: 'kneeN', parent: 'thighN', at: () => [0, L1] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, L1] },
    { name: 'ankleN', parent: 'shinN', at: () => [0, L2] },
    { name: 'ankleF', parent: 'shinF', at: () => [0, L2] },
    { name: 'elbowN', parent: 'upN', at: () => [UA, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [UA, 0] },
    { name: 'handN', parent: 'foreN', at: () => [10.6, 0] },
    ...[0, 1].flatMap((pass) => {
      const i = pass;
      const tg = pass ? 'b' : '';
      const leg = (far) => {
        const k = far ? 'F' : 'N';
        const j = far ? 1 : 0;
        return [
          { name: `boot${k}${tg}`, parent: `ankle${k}`, s: SP.BOOT[j][i], pivot: [5, 1], rot: (S) => -(S.tilt + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
          { name: `shin${k}${tg}`, parent: `knee${k}`, s: SP.SHIN[j][i], pivot: [5, 2], rot: (S) => S[`shin${k}`] * D2R },
          { name: `thigh${k}${tg}`, parent: 'bodyJ', s: SP.THIGH[j][i], pivot: [5, 2], at: () => (far ? [-6, 2] : [6, 2]), rot: (S) => S[`thigh${k}`] * D2R },
        ];
      };
      const arm = (far) => {
        const k = far ? 'F' : 'N';
        const j = far ? 1 : 0;
        return [
          { name: `up${k}${tg}`, parent: 'bodyJ', s: SP.UP[j][i], pivot: [2, 5], at: () => (far ? SHF : SHN), rot: (S) => S[`arm${k}`] * D2R },
          { name: `fore${k}${tg}`, parent: `elbow${k}`, s: SP.FORE[j][i], pivot: [2, 5], rot: (S) => S[`elb${k}`] * D2R },
        ];
      };
      return [
        { name: `earF${tg}`, parent: 'headJ', s: SP.EAR[1][i], pivot: [2, 4], at: () => [-10, -16], rot: () => 160 * D2R, soft: { key: 'eF', dir: [-12, 2], k: 170, c: 6, gain: 0.28, turn: 0.7, max: 24 } },
        ...arm(true),
        ...leg(true), ...leg(false),
        { name: `body${tg}`, parent: 'bodyJ', s: SP.BODY[i], pivot: [20, 30] },
        { name: `head${tg}`, parent: 'headJ', s: SP.HEAD[i], pivot: [18, 32] },
        ...(pass ? [{ name: 'face', parent: 'headJ', s: (a) => mgFace(a.mgMood ?? 'idle'), pivot: [18, 32] }] : []),
        { name: `earN${tg}`, parent: 'headJ', s: SP.EAR[0][i], pivot: [2, 4], at: () => [12, -16], rot: () => 15 * D2R, soft: { key: 'eN', dir: [12, 2], k: 170, c: 6, gain: 0.28, turn: 0.7, max: 24 } },
        { name: `pumpkin${tg}`, parent: 'headJ', s: SP.PUMP[i], pivot: [18, 22], at: () => [0, -23] },
        { name: `leaf${tg}`, parent: 'headJ', s: SP.LEAF[i], pivot: [1, 4], at: () => [1, -44], soft: { key: 'leaf', dir: [8, -2], k: 120, c: 5, gain: 0.42, turn: 0.8, max: 26, flutter: 3, hz: 0.8 } },
        { name: `fork${tg}`, parent: 'handN', s: SP.FORK[i], pivot: [8, 40], rot: (S) => (S.fork - S.tilt - S.armN - S.elbN) * D2R },
        ...arm(false),
      ];
    }),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.22;
    ctx.fillStyle = '#2a3a1a';
    ctx.beginPath();
    ctx.ellipse(0, -0.6, 26, 3.6, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // A burst of dirt where the tines go in.
    if (a.mgDust > 0) {
      const [fx, fy] = at2(mat('fork'), 0, -38);
      for (let k = 0; k < 6; k++) puff(ctx, a, fx - 14 + k * 6, fy - (k % 2) * 6 - (1 - a.mgDust) * 10, 5 + (1 - a.mgDust) * 6, a.mgDust * 0.5, '160,120,80');
    }
  },
});
// A still of him (for anywhere a sprite is wanted), his mood's face.
export function macGoblinStill(pose, f, mood) {
  const by = -BODY_Y;
  const [nx, ny] = [NECK[0], by + NECK[1]];
  const Lg = LEGS.at(0, -4);
  const leg = (k, far) => {
    const [hx, hy] = far ? [-6, 2] : [6, 2];
    const r = -4 * D2R;
    const hpx = hx * Math.cos(r) - hy * Math.sin(r);
    const hpy = by + hx * Math.sin(r) + hy * Math.cos(r);
    const th = Lg[`thigh${k}`] - 4;
    const sh = Lg[`shin${k}`];
    const kx = hpx - Math.sin(th * D2R) * L1;
    const ky = hpy + Math.cos(th * D2R) * L1;
    const ax = kx - Math.sin((th + sh) * D2R) * L2;
    const ay = ky + Math.cos((th + sh) * D2R) * L2;
    return [...put(thighP(far)(), [5, 2], hpx, hpy, th), ...put(shinP(far)(), [5, 2], kx, ky, th + sh), ...put(bootP(far)(), [5, 1], ax, ay, 0)];
  };
  const arm = (far, a1, a2) => {
    const [sx, sy] = far ? SHF : SHN;
    const ex = sx + Math.cos(a1 * D2R) * UA;
    const ey = by + sy + Math.sin(a1 * D2R) * UA;
    return [...put(upP(far)(), [2, 5], sx, by + sy, a1), ...put(foreP(far)(), [2, 5], ex, ey, a1 + a2)];
  };
  const [hx2, hy2] = [SHN[0] + Math.cos(40 * D2R) * UA + Math.cos(-20 * D2R) * 10.6, by + SHN[1] + Math.sin(40 * D2R) * UA + Math.sin(-20 * D2R) * 10.6];
  return {
    w: 120,
    h: 120,
    res: 2,
    shapes: shift([
      ...put(earP(true)(), [2, 4], nx - 10, ny - 16, 160), ...arm(true, 110, -20), ...leg('F', true), ...leg('N', false), ...put(bodyP(), [20, 30], 0, by),
      ...put(headP(), [18, 32], nx, ny), ...put(faceShapes(MOODS.has(mood) ? mood : 'idle', FACE), [18, 32], nx, ny), ...put(earP(false)(), [2, 4], nx + 12, ny - 16, 15),
      ...put(pumpkinP(), [18, 22], nx, ny - 23), ...put(leafP(), [1, 4], nx + 1, ny - 44), ...put(forkP(), [8, 40], hx2, hy2, -4), ...arm(false, 40, -60),
    ], 60, 116),
  };
}
