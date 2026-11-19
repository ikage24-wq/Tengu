// Prismaris, the Crystal King (redrawn 2026-11-19, the player's pick "A, the Crystal Dragon Kid"): a
// little upright dragon of faceted crystal who has been drinking the island's light because he is
// afraid of the dark. Pale blue crystal, amethyst plates down his back, tiny wings, a pale snout
// under and between his eyes, a gold crown far too big for him (it wobbles), a purple royal cape
// trimmed with ermine, a crystal tail, and a glowing nightlight he never lets go of: since Chapter 10
// (2026-11-19) the Queen's own alarm clock, the 'star' that fell ringing on festival night.
//
// How he moves:
//   idle    a 10 s act: the lantern hugged close; nervous glances into the dark, left and right;
//           a peek at the lantern's light, happy.
//   walk    a careful little waddle, the lantern held out ahead, swinging.
//   fight   his slam (m.special, world/mobs.js): the lantern raised high, flaring, as it winds up;
//           then a stomp and a slap of his tail in a burst of crystal sparkles.
//   scenes  a sad face (his "...Can I keep a nightlight?").

import { E, T, F, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { simpleEye } from './faces.js';
import { D2R, INK, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, puff, sparkle } from './rigkit.js';
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
const line = (pts, w, c = INK) => stroke(pts, w, c).map(F);
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const gem = (x, y, r, c) => T([[x, y - r], [x + r, y], [x, y + r], [x - r, y]], c);
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

const CRY = ramp('#bfe8ff', { step: 9, turn: 8 });
const AME = ramp('#b48ae8', { step: 9, turn: 8 });
const ROYAL = ramp('#7a3ab8', { step: 9, turn: 8 });
const GOLD = '#ffd36b';
const PALE = '#e8f8ff';
const ck = pairOf('ck2');

// ---------- The pieces (each facing right) ----------
// His body: faceted crystal, a pale belly, amethyst plates down his back. Box 40 x 40; bodyJ at (20, 34).
const bodyP = () => [
  ...[[6, 12, 3.6], [4, 20, 3.4], [4, 28, 3]].map(([x, y, r]) => E(x, y, r, r, AME.base)),
  E(20, 20, 16, 16, CRY.base), crescent(20, 20, 16, 16, CRY.sh, { k: 0.18, a0: 100, a1: 210 }), F(E(23, 24, 9, 10, PALE)),
  ...[[16, 14], [26, 18], [18, 28]].map(([x, y]) => F(gem(x, y, 2.6, CRY.hi))),
];
// His head: crystal, a pale snout under and between his eyes with two nostrils, little horn nubs.
// Box 36 x 38; the neck at (18, 34), the head's middle at (18, 18).
const headP = () => [
  E(8, 6, 2.6, 3.4, AME.base), E(26, 5, 2.6, 3.4, AME.base),
  E(18, 18, 15, 14, CRY.base), crescent(18, 18, 15, 14, CRY.sh, { k: 0.15, a0: 110, a1: 220 }),
  F(E(21, 25, 7, 4.6, PALE)), F(E(22, 23.6, 0.9, 0.7, '#4a6a8a')), F(E(25, 23.4, 0.9, 0.7, '#4a6a8a')), F(gem(11, 10, 2, CRY.hi)),
];
const FACE = { eyes: [[23, 16.4, 3.6, 4.4, 1], [13.6, 16.8, 3.1, 4, -1]], mouth: [22.6, 28.4, 2.4], blush: [[25.6, 21.6, 2.2], [11.6, 22, 1.8]], iris: '#8a5ad8', k: 1.7, lid: 0, lashes: 0 };
// (His sad face for his scene: brows drawn up, a small frown.)
const ckFaceShapes = (mood) => {
  if (mood !== 'sad') return faceShapes(mood, FACE);
  const out = [];
  for (const [x, y, w, h, sd] of FACE.eyes) out.push(...simpleEye(x, y, { s: -sd, w, h, mood: 'angry', iris: FACE.iris, ink: INK, wing: 0 }));
  for (const [x, y, rx] of FACE.blush) out.push(F(E(x, y, rx, rx * 0.5, '#ff9fb4')));
  out.push(...stroke(arcP(22.6, 29.6, 1.4, 0.9, 200, 340, 6), 0.7, INK));
  return out;
};
const ckFace = (mood) => faceSprite(`ck2|face|${mood}`, 36, 38, () => ckFaceShapes(mood));
// The crown: gold, too big, two amethysts. Box 32 x 16; sits on his head at (16, 14).
const crownP = () => [T([[2, 14], [30, 11], [30, 3], [25, 7], [21, 0], [16, 6], [11, 0], [7, 8], [2, 5]], GOLD), F(taper([[2, 13], [30, 10]], 1.4, 1.4, '#e8b040')), F(E(10, 10, 1.6, 1.6, AME.base)), F(E(21, 9, 1.6, 1.6, AME.base)), F(E(16, 4, 1, 1, '#fff6c8'))];
// The cape: purple, ermine at the hem. Box 30 x 46; tied on at (24, 2).
const capeP = () => [blob([[24, 1], [12, 6], [4, 26], [2, 42], [20, 44], [26, 20]], ROYAL.base, 2), crescent(14, 24, 12, 20, ROYAL.sh, { k: 0.25, a0: 100, a1: 200 }), ...[[4, 42], [10, 43], [16, 43]].map(([x, y]) => E(x, y, 3, 2.6, '#ffffff')), F(E(10, 43, 0.7, 1.1, INK))];
// A little wing: crystal, two ribs. Box 18 x 14; rooted at (16, 12).
const wingP = () => [blob([[16, 12], [6, 2], [2, 6], [6, 10], [10, 13]], CRY.sh, 2), F(blob([[14, 11], [7, 5], [6, 9]], PALE, 1))];
// The tail, in two: root box 24 x 12 at (2, 6); tip box 22 x 12 at (2, 6), a gem on the end.
const tail1P = () => [taper([[2, 6], [21, 6]], 9, 6.4, CRY.base), ...[7, 14].map((x) => F(E(x, 2.4, 2, 1.6, AME.base)))];
const tail2P = () => [E(2, 6, 3.2, 3.2, CRY.base), taper([[2, 6], [15, 6]], 6.4, 3, CRY.base), gem(18, 6, 3.6, AME.base)];
// Legs: crystal, round at the knee, little clawed feet.
const thighP = (far) => () => [taper([[4.5, 2], [4.5, 7.6]], 7.4, 7, far ? CRY.sh : CRY.base), E(4.5, 7.6, 3.5, 3.5, far ? CRY.sh : CRY.base)];
const shinP = (far) => () => [E(4.5, 2, 3.5, 3.5, far ? CRY.sh : CRY.base), taper([[4.5, 2], [4.5, 7]], 7, 6.6, far ? CRY.sh : CRY.base)];
const footP = (far) => () => [blob([[0.6, 0.4], [8.4, 0.4], [12, 3.6], [11, 5.6], [0.4, 5.6]], far ? CRY.sh : CRY.base, 1), ...[8, 10.6].map((x) => F(E(x, 5, 0.8, 0.8, AME.base)))];
// Arms: stubby crystal. Upper: box 11 x 9 at (2, 4.5); fore: box 13 x 9 at (2, 4.5).
const upP = (far) => () => [taper([[2, 4.5], [8, 4.5]], 7, 6.4, CRY.deep), E(8, 4.5, 3.3, 3.3, CRY.deep), taper([[2, 4.5], [8, 4.5]], 5.6, 5, far ? CRY.sh : CRY.base), E(8, 4.5, 2.6, 2.6, far ? CRY.sh : CRY.base)];
const foreP = (far) => () => [E(2, 4.5, 3.3, 3.3, CRY.deep), taper([[2, 4.5], [7, 4.5]], 6.4, 6, CRY.deep), E(2, 4.5, 2.6, 2.6, far ? CRY.sh : CRY.base), taper([[2, 4.5], [7, 4.5]], 5, 4.6, far ? CRY.sh : CRY.base), E(9.4, 4.5, 3, 2.8, far ? CRY.sh : CRY.base)];
// His nightlight: the Queen's alarm clock, glowing like a little star; held by the handle between its
// two bells, a white face, a star at twelve, little feet. Box 16 x 22; held at (8, 2).
// The little star of his own the Queen gives him (Chapter 10, his trial's end: m.cine.gift), held
// the same way. Box 16 x 22; held at (8, 2).
const starP = () => {
  const pts = [];
  for (let k = 0; k < 10; k++) {
    const a = (-90 + k * 36) * D2R;
    const r = k % 2 ? 3.2 : 7;
    pts.push([8 + Math.cos(a) * r, 13 + Math.sin(a) * r]);
  }
  return [...stroke([[8, 2], [8, 6]], 0.8, GOLD, false), T(pts, '#ffe066'), F(E(7, 12, 2, 1.6, '#fff8d0'))];
};
const lanternP = () => [
  ...stroke(arcP(8, 3, 2.6, 2.2, 180, 360, 8), 1, GOLD, false), F(taper([[8, 4], [8, 7]], 1, 1, GOLD)),
  E(3.6, 8.4, 2.7, 2.3, GOLD), E(12.4, 8.4, 2.7, 2.3, GOLD), F(E(3.2, 7.8, 1, 0.7, '#fff6c8')), F(E(12, 7.8, 1, 0.7, '#fff6c8')),
  T([[4.4, 18.6], [6, 18.6], [4.6, 21.6]], GOLD), T([[10, 18.6], [11.6, 18.6], [11.4, 21.6]], GOLD),
  E(8, 13.6, 6.4, 6.4, '#ffc94a'), F(E(8, 13.6, 4.9, 4.9, '#fffbe8')), F(E(8, 9.8, 0.9, 0.9, '#ffb03a')),
  ...stroke([[8, 13.6], [8, 10.6]], 0.6, '#7a5a2a'), ...stroke([[8, 13.6], [10.4, 14.8]], 0.6, '#7a5a2a'),
];

const SP = {
  BODY: ck('body', 40, 40, bodyP, 2), HEAD: ck('head', 36, 38, headP, 2), CROWN: ck('crown', 32, 16, crownP, 2), CAPE: ck('cape', 30, 46, capeP, 2), WING: ck('wing', 18, 14, wingP, 2),
  T1: ck('tail1', 24, 12, tail1P, 2), T2: ck('tail2', 24, 12, tail2P, 2),
  THIGH: [false, true].map((f) => ck(`thigh${f ? 1 : 0}`, 9, 12, thighP(f), 2)), SHIN: [false, true].map((f) => ck(`shin${f ? 1 : 0}`, 9, 11, shinP(f), 2)), FOOT: [false, true].map((f) => ck(`foot${f ? 1 : 0}`, 13, 7, footP(f), 2)),
  UP: [false, true].map((f) => ck(`up${f ? 1 : 0}`, 11, 9, upP(f), 2)), FORE: [false, true].map((f) => ck(`fore${f ? 1 : 0}`, 13, 9, foreP(f), 2)), LANTERN: ck('lantern', 16, 22, lanternP, 2), STAR: ck('star', 16, 22, starP, 2),
};

// ---------- The skeleton ----------
const BODY_Y = 20;
const L1 = 6.6;
const L2 = 6.6;
const LEGS = chibiLegs({ bodyY: BODY_Y, l1: L1, l2: L2, sole: 6, hips: [[6, 2], [-6, 2]], feet: [7, -6] });
const FEET = [7, -6];
const SHN = [10, -26];
const SHF = [-9, -26];
const NECK = [1, -30];
const UA = 6.4;
export const crystalKingRig = sized(makeRig({
  w: 110, h: 120, soft: true, stride: 1e9, recover: 0.6,
  springs: {
    x: [200, 15], lift: [220, 16], tilt: [160, 12], head: [140, 10], tail: [100, 9], tail2: [90, 8], crown: [90, 6], lamp: [160, 12],
    armN: [220, 16], elbN: [220, 16], armF: [200, 15], elbF: [200, 15],
    thighN: [340, 21], thighF: [340, 21], shinN: [340, 21], shinF: [340, 21], rollN: [320, 20], rollF: [320, 20],
  },
  fast: ['x', 'lift', 'tilt', 'armN', 'elbN', 'armF', 'elbF', 'thighN', 'thighF', 'shinN', 'shinF'],
  kick: { tilt: -110, head: -150, crown: 220 },
  turnKick: { crown: 200, head: 60, tail: 160 },
  pose(m, a) {
    // (Given his own star by the Queen at his trial's end, he holds that instead of her clock.)
    a.ckStar = Boolean(m.cine?.freed && m.cine?.mood === 'happy');
    a.uidOff = (m.uid % 7) * 1.3;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'ck2', 16);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const lu = fr(t / 10) * 10;
    const busy = active || walkW > 0.05 || m.cine || m.aggroUntil === Infinity;
    const glance = busy ? 0 : hold(lu, 2.6, 3, 5, 5.4);
    const peek = busy ? 0 : hold(lu, 7, 7.4, 8.8, 9.2);
    const br = Math.sin(t * 1.5);
    const liftI = br * 0.5;
    const tiltI = br * 1.2 + peek * 8;
    // (The lantern hugged to his chest, both paws round it.)
    const idle = {
      x: 0, lift: liftI, tilt: tiltI, head: Math.sin(t * 1.1) * 2 + glance * Math.sin(t * 2.4) * 16 + peek * 14, tail: 165 + Math.sin(t * 1.8) * 8, tail2: 30 + Math.sin(t * 1.8 - 1) * 12, crown: Math.sin(t * 1.2) * 3, lamp: 0,
      armN: 60 - peek * 20, elbN: -90 + peek * 10, armF: 70, elbF: -100,
      ...LEGS.at(liftI, tiltI),
    };
    // The careful waddle, the lantern held out ahead.
    const steps = [pawStep(u, 0, 16, 0.6, 3.4), pawStep(u, 0.5, 16, 0.6, 3.4)];
    const sw = Math.sin(u * TAU);
    const liftW = Math.abs(Math.cos(u * TAU)) * 1.2;
    const tiltW = 4 + sw * 3;
    const walk = { ...idle, lift: liftW, tilt: tiltW, head: -2, tail: 172 + sw * 12, tail2: 20 - sw * 18, crown: -sw * 5, armN: 20, elbN: -30, armF: 100 + sw * 20, elbF: -30, ...LEGS.at(liftW, tiltW, [FEET[0] + steps[0][0], steps[0][1]], [FEET[1] + steps[1][0], steps[1][1]]) };
    // The slam: the lantern raised up high, a foot lifted; then a stomp and a slap of the tail.
    const antic = { ...idle, x: -2, lift: 1, tilt: -10, head: -12, tail: 150, tail2: 50, crown: 8, armN: -30, elbN: -60, armF: 120, elbF: -20, ...LEGS.at(1, -10, [FEET[0] + 3, 10], [FEET[1] - 2, 0]) };
    const strike = { ...idle, x: 6, lift: -3, tilt: 14, head: 8, tail: 190, tail2: -20, crown: -10, armN: 30, elbN: -40, armF: 60, elbF: -60, ...LEGS.at(-3, 14, [FEET[0] + 7, 0], [FEET[1] - 2, 0]) };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Down: sat on the floor, hugging his lantern.
    if (m.hp <= 0) Object.assign(S, { lift: -12, tilt: -6, head: 14, armN: 60, elbN: -100, armF: 70, elbF: -100, crown: 14, ...LEGS.at(-12, -6, [FEET[0] + 10, 2], [FEET[1] + 13, 2]) });
    a.ckFlare = a.ph.antic;
    a.ckBurst = a.ph.since >= 0.04 && a.ph.since < 0.8 ? 1 - (a.ph.since - 0.04) / 0.76 : 0;
    a.ckMood = m.hp <= 0 ? 'sad' : a.face === 'sad' && !a.ph.atk ? 'sad' : moodOf(a, peek > 0.4 ? 'happy' : glance > 0.4 ? 'sad' : null);
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
    { name: 'pawN', parent: 'foreN', at: () => [9.4, 1] },
    { name: 'tailEnd', parent: 'tail1', at: () => [20, 0] },
    ...[0, 1].flatMap((pass) => {
      const i = pass;
      const tg = pass ? 'b' : '';
      const leg = (far) => {
        const k = far ? 'F' : 'N';
        const j = far ? 1 : 0;
        return [
          { name: `foot${k}${tg}`, parent: `ankle${k}`, s: SP.FOOT[j][i], pivot: [4, 1], rot: (S) => -(S.tilt + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
          { name: `shin${k}${tg}`, parent: `knee${k}`, s: SP.SHIN[j][i], pivot: [4.5, 2], rot: (S) => S[`shin${k}`] * D2R },
          { name: `thigh${k}${tg}`, parent: 'bodyJ', s: SP.THIGH[j][i], pivot: [4.5, 2], at: () => (far ? [-6, 2] : [6, 2]), rot: (S) => S[`thigh${k}`] * D2R },
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
        { name: `cape${tg}`, parent: 'bodyJ', s: SP.CAPE[i], pivot: [24, 2], at: () => [-4, -30], soft: { key: 'cape', dir: [-8, 20], k: 95, c: 6.5, gain: 0.55, turn: 0.9, hang: 0.55, max: 16 } },
        { name: `tail2${tg}`, parent: 'tailEnd', s: SP.T2[i], pivot: [2, 6], rot: (S) => S.tail2 * D2R, soft: { key: 'tail2', dir: [12, 0], k: 90, c: 6, gain: 0.5, turn: 0.8, max: 22 } },
        { name: `tail1${tg}`, parent: 'bodyJ', s: SP.T1[i], pivot: [2, 6], at: () => [-10, 0], rot: (S) => S.tail * D2R },
        { name: `wing${tg}`, parent: 'bodyJ', s: SP.WING[i], pivot: [16, 12], at: () => [-6, -26], rot: (S, a) => (Math.sin(a.t * 3) * 8) * D2R, soft: { key: 'wing', dir: [-8, -6], k: 120, c: 5, gain: 0.42, turn: 0.8, max: 26, flutter: 3, hz: 0.8 } },
        ...arm(true),
        ...leg(true), ...leg(false),
        { name: `body${tg}`, parent: 'bodyJ', s: SP.BODY[i], pivot: [20, 34] },
        { name: `head${tg}`, parent: 'headJ', s: SP.HEAD[i], pivot: [18, 34] },
        ...(pass ? [{ name: 'face', parent: 'headJ', s: (a) => ckFace(a.ckMood ?? 'idle'), pivot: [18, 34] }] : []),
        { name: `crown${tg}`, parent: 'headJ', s: SP.CROWN[i], pivot: [16, 14], at: () => [0, -27], rot: (S) => (-6 + S.crown) * D2R },
        { name: `lantern${tg}`, parent: 'pawN', s: (a) => (a.ckStar ? SP.STAR[i] : SP.LANTERN[i])(), pivot: [8, 2], rot: (S) => -(S.tilt + S.armN + S.elbN) * D2R, soft: { key: 'lamp', dir: [0, 12], k: 85, c: 5.5, gain: 0.25, turn: 0.6, max: 24, flutter: 2, hz: 0.5 } },
        ...arm(false),
      ];
    }),
  ],
  under(ctx, m, a, S, mat) {
    ctx.globalAlpha = a.alpha * 0.22;
    ctx.fillStyle = '#1a1a3a';
    ctx.beginPath();
    ctx.ellipse(-4, -0.6, 26, 3.4, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
    // The nightlight's warm glow, flaring as he raises it: behind him, so it never washes over his
    // face (2026-11-19: on the wind-up it did).
    const [lx, ly] = at2(mat('lantern'), 0, 11.6);
    puff(ctx, a, lx, ly, 12 + a.ckFlare * 12, 0.35 + a.ckFlare * 0.3, '255,240,170');
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // The stomp: crystal sparkles bursting up off the floor.
    if (a.ckBurst > 0) for (let k = 0; k < 7; k++) {
      const q = (k / 7) * Math.PI;
      const r = 10 + (1 - a.ckBurst) * 30;
      sparkle(ctx, a, Math.cos(q) * r, -2 - Math.sin(q) * r * 0.8, 3 + a.ckBurst * 2, a.ckBurst, k % 2 ? '#bfe8ff' : '#d8c4ff');
    }
  },
}), 1.3);
// A still of him (for anywhere a sprite is wanted), his mood's face.
export function crystalKingStill(pose, f, mood) {
  const by = -BODY_Y;
  const [nx, ny] = [NECK[0], by + NECK[1]];
  const Lg = LEGS.at(0, 0);
  const leg = (k, far) => {
    const [hx, hy] = far ? [-6, 2] : [6, 2];
    const th = Lg[`thigh${k}`];
    const sh = Lg[`shin${k}`];
    const kx = hx - Math.sin(th * D2R) * L1;
    const ky = by + hy + Math.cos(th * D2R) * L1;
    const ax = kx - Math.sin((th + sh) * D2R) * L2;
    const ay = ky + Math.cos((th + sh) * D2R) * L2;
    return [...put(thighP(far)(), [4.5, 2], hx, by + hy, th), ...put(shinP(far)(), [4.5, 2], kx, ky, th + sh), ...put(footP(far)(), [4, 1], ax, ay, 0)];
  };
  const arm = (far, a1, a2) => {
    const [sx, sy] = far ? SHF : SHN;
    const ex = sx + Math.cos(a1 * D2R) * UA;
    const ey = by + sy + Math.sin(a1 * D2R) * UA;
    return [...put(upP(far)(), [2, 4.5], sx, by + sy, a1), ...put(foreP(far)(), [2, 4.5], ex, ey, a1 + a2)];
  };
  const [px, py] = [SHN[0] + Math.cos(60 * D2R) * UA + Math.cos(-30 * D2R) * 9.4, by + SHN[1] + Math.sin(60 * D2R) * UA + Math.sin(-30 * D2R) * 9.4];
  return {
    w: 110,
    h: 120,
    res: 2,
    shapes: shift([
      ...put(capeP(), [24, 2], -4, by - 30), ...put(tail2P(), [2, 6], -10 + Math.cos(165 * D2R) * 20, by + Math.sin(165 * D2R) * 20, 195), ...put(tail1P(), [2, 6], -10, by, 165), ...put(wingP(), [16, 12], -6, by - 26),
      ...arm(true, 70, -100), ...leg('F', true), ...leg('N', false), ...put(bodyP(), [20, 34], 0, by),
      ...put(headP(), [18, 34], nx, ny), ...put(ckFaceShapes(MOODS.has(mood) || mood === 'sad' ? mood : 'idle'), [18, 34], nx, ny), ...put(crownP(), [16, 14], nx, ny - 27, -6),
      ...put(lanternP(), [8, 2], px, py), ...arm(false, 60, -90),
    ], 55, 116),
  };
}
