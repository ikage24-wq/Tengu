// The Queen Bee (redrawn 2026-11-19, the player's pick "A, the Royal Bumble"): Petal Meadow's area
// boss, a big round fuzzy bumble queen: yellow and black bands, a lace ruff, a cream face, a
// honeycomb crown, bobbly antennae, two pairs of wings buzzing at her back, little black legs
// dangling as she hovers, and a honey dipper for a sceptre.
//
// How she moves (she flies: her walk is the flight, her idle a hover):
//   idle    a 10 s act: a flourish of the dipper; chin up, haughty, sniffing; a pleased little wiggle.
//   walk    leaning into the flight, buzzing harder.
//   fight   her slam (m.special, world/mobs.js): up high with the dipper raised as it winds up,
//           then a dive and the dipper brought down in a splash of honey.

import { E, T, F, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, put, shift, MOODS, moodOf, faceShapes, dot } from './rigkit.js';

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
const hex = (x, y, r, c) => T(Array.from({ length: 6 }, (_, i) => [x + Math.cos((i / 6) * TAU) * r, y + Math.sin((i / 6) * TAU) * r]), c);
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

const YEL = ramp('#ffd34a', { step: 9, turn: 8 });
const BLK = ramp('#3a2a3a', { step: 6, turn: 8 });
const CREAMF = '#fff4d0';
const WING = '#e4f6ff';
const HONEY = '#ffb030';
const GOLD = '#ffd36b';
const qb = pairOf('qb2');

// ---------- The pieces (each facing right) ----------
// Her body: round, two black bands, fuzz. Box 46 x 44; its middle at (23, 22).
const bodyP = () => [
  E(23, 22, 21, 19, YEL.base), F(blob([[5, 18], [41, 16], [43, 24], [3, 26]], BLK.base, 2)), F(blob([[9, 33], [37, 32], [33, 39], [13, 39]], BLK.base, 2)),
  crescent(23, 22, 21, 19, YEL.sh, { k: 0.15, a0: 100, a1: 210 }), F(E(16, 10, 5, 2.4, '#fff0a0')),
];
// The lace ruff at her neck. Box 30 x 10; the neck at (15, 4).
const ruffP = () => [0, 1, 2, 3, 4, 5, 6].map((k) => E(3 + k * 4, 4.6 + (k % 2) * 0.8, 3.4, 3, '#ffffff')).concat([F(taper([[2, 6], [28, 6]], 0.6, 0.6, '#e0e4f0'))]);
// Her head: fuzzy yellow, a cream face, the honeycomb crown. Box 34 x 40; the neck at (17, 36),
// the head's middle at (17, 24).
const headP = () => [
  E(17, 24, 15, 14, YEL.base), crescent(17, 24, 15, 14, YEL.sh, { k: 0.15, a0: 110, a1: 220 }), F(E(19, 27, 11, 9, CREAMF)),
  T([...arcP(17, 24, 15.4, 14.4, 214, 326, 8).map(([x, y]) => [x, y + 0.4]), [29, 8], [26, 2], [22, 6], [17, 0], [12, 6], [8, 2], [5, 9]], GOLD), ...[[11, 8], [17, 6], [23, 8]].map(([x, y]) => F(hex(x, y, 1.8, HONEY))),
];
const FACE = { eyes: [[23.4, 25.6, 3.4, 4.2, 1], [14, 26, 3, 3.8, -1]], mouth: [19.6, 32.4, 2.4], blush: [[25.4, 30, 2.2], [12, 30.4, 1.8]], iris: '#3a2a3a', k: 1.6, lid: 0, lashes: 1 };
const qbFace = (mood) => faceSprite(`qb2|face|${mood}`, 34, 40, () => faceShapes(mood, FACE));
// An antenna: a black stalk, a round knob. Box 8 x 14; rooted at (4, 13).
const antP = () => [taper([[4, 13], [4, 3]], 1.3, 1.1, BLK.base), E(4, 2.6, 2.4, 2.4, BLK.base), F(E(3.4, 2, 0.8, 0.8, '#7a6a7a'))];
// A wing: see-through white-blue, a vein. Box 26 x 14; rooted at (2, 7).
const wingP = (far) => () => [E(13, 7, 11.5, 6, far ? '#c8e4f4' : WING), F(E(14, 6, 7.4, 3.4, far ? '#dceef8' : '#ffffff')), ...line([[2, 7], [22, 6]], 0.5, '#a8c8e0')];
// A dangling leg: black, a little foot. Box 7 x 12; hung from (3.5, 1).
const legP = (far) => () => [taper([[3.5, 1], [3.5, 9]], 3.6, 3, far ? BLK.sh : BLK.base), E(3.8, 9.6, 2.4, 1.8, far ? BLK.sh : BLK.base)];
// An arm: black, stubby. Box 12 x 7; the shoulder at (2, 3.5).
const armP = (far) => () => [taper([[2, 3.5], [9, 3.5]], 4.4, 4, far ? BLK.sh : BLK.base), E(9.4, 3.5, 2.6, 2.6, far ? BLK.sh : BLK.base)];
// The honey dipper: a wooden stem, a grooved honey knob dripping. Box 14 x 40; gripped at (7, 32).
const dipperP = () => [taper([[7, 38], [7, 10]], 2.2, 2, '#c8905a'), E(7, 7, 4.4, 6, HONEY), ...[0, 1, 2].map((k) => F(taper([[2.8, 4.4 + k * 2.6], [11.2, 4.4 + k * 2.6]], 0.8, 0.8, '#d88a20'))), blob([[6, 12], [8, 12], [7, 16]], HONEY, 1), F(E(5.4, 4.6, 1.2, 1.6, '#ffe0a0'))];

const SP = {
  BODY: qb('body', 46, 44, bodyP, 2), RUFF: qb('ruff', 30, 10, ruffP, 2), HEAD: qb('head', 34, 40, headP, 2), ANT: qb('ant', 8, 14, antP, 2),
  WING: [false, true].map((f) => qb(`wing${f ? 1 : 0}`, 26, 14, wingP(f), 2)), LEG: [false, true].map((f) => qb(`leg${f ? 1 : 0}`, 7, 12, legP(f), 2)),
  ARM: [false, true].map((f) => qb(`arm${f ? 1 : 0}`, 12, 7, armP(f), 2)), DIP: qb('dipper', 14, 40, dipperP, 2),
};

const BODY_Y = 38;
export const queenBeeRig = sized(makeRig({
  w: 110, h: 110, soft: true, stride: 1e9, recover: 0.6,
  springs: { x: [160, 14], lift: [120, 11], tilt: [140, 11], head: [130, 10], armN: [200, 14], armF: [180, 13], dip: [200, 14] },
  fast: ['x', 'armN', 'dip'],
  kick: { tilt: -120, head: -160 },
  turnKick: { head: 60, tilt: -40 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.3;
    const t = a.t + a.uidOff;
    const walkW = a.walkW ?? 0;
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const lu = fr(t / 10) * 10;
    const busy = active || walkW > 0.05 || m.cine || m.aggroUntil === Infinity;
    const twirl = busy ? 0 : hold(lu, 1.6, 2, 3.6, 4);
    const sniff = busy ? 0 : hold(lu, 5.6, 6, 7.4, 7.8);
    const wiggle = busy ? 0 : hold(lu, 8.4, 8.6, 9.4, 9.6);
    const bob = Math.sin(t * 2.4);
    // (A flourish of the dipper out at her side: never swung round past her face.)
    a.qbSpin = Math.sin(t * 9) * 45 * twirl;
    const idle = { x: 0, lift: bob * 3 + sniff * 2, tilt: Math.sin(t * 1.3) * 3 - sniff * 8 + wiggle * Math.sin(t * 14) * 6, head: Math.sin(t * 1.1) * 4 - sniff * 14, armN: 40 - twirl * 20 + sniff * 20, armF: 110 - sniff * 40, dip: 35 + sniff * 10 };
    const walk = { ...idle, lift: Math.sin(t * 4) * 2.4, tilt: 12, head: -8, armN: 30, armF: 140, dip: 55 };
    // The slam: up high, dipper raised; then a dive, the dipper brought down.
    const antic = { ...idle, x: -3, lift: 14, tilt: -12, head: -10, armN: -100, armF: 160, dip: 10 };
    const strike = { ...idle, x: 8, lift: -8, tilt: 22, head: 10, armN: 30, armF: 60, dip: 120 };
    const S = stateBlend(a, idle, walk, antic, strike);
    if (m.hp <= 0) Object.assign(S, { lift: -12, tilt: 20, head: 18, armN: 90, armF: 120, dip: 160 });
    a.qbSplash = a.ph.since >= 0 && a.ph.since < 0.6 ? 1 - a.ph.since / 0.6 : 0;
    a.qbMood = m.hp <= 0 ? 'dead' : moodOf(a, sniff > 0.4 || wiggle > 0.4 || twirl > 0.4 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => [3, -17], rot: (S) => (S.head - S.tilt * 0.4) * D2R },
    { name: 'pawN', parent: 'armN', at: () => [9, 0] },
    ...[0, 1].flatMap((pass) => {
      const i = pass;
      const tg = pass ? 'b' : '';
      const wing = (far, k) => ({ name: `wing${far ? 'F' : 'N'}${k}${tg}`, parent: 'bodyJ', s: SP.WING[far ? 1 : 0][i], pivot: [2, 7], at: () => [far ? -6 : -3, -12 + k * 7], rot: (S, a) => ((k ? -150 : -128) + (far ? -8 : 0) + Math.sin(a.t * 40 + k + (far ? 1 : 0)) * 14) * D2R });
      const leg = (far) => ({ name: `leg${far ? 'F' : 'N'}${tg}`, parent: 'bodyJ', s: SP.LEG[far ? 1 : 0][i], pivot: [3.5, 1], at: () => [far ? -5 : 5, 16], rot: (S, a) => (Math.sin(a.t * 3 + (far ? 1.4 : 0)) * 10 - S.tilt * 0.6) * D2R, soft: { key: far ? 'lF' : 'lN', dir: [0, 8], k: 60, c: 5, gain: 0.9, turn: 0.9, hang: 0.8, max: 30 } });
      return [
        wing(true, 0), wing(true, 1), leg(true),
        { name: `armF${tg}`, parent: 'bodyJ', s: SP.ARM[1][i], pivot: [2, 3.5], at: () => [-12, -6], rot: (S) => S.armF * D2R },
        wing(false, 0), wing(false, 1), leg(false),
        { name: `body${tg}`, parent: 'bodyJ', s: SP.BODY[i], pivot: [23, 22] },
        { name: `antF${tg}`, parent: 'headJ', s: SP.ANT[i], pivot: [4, 13], at: () => [-9, -22], rot: () => -35 * D2R, soft: { key: 'aF', dir: [0, -8], k: 120, c: 5, gain: 0.42, turn: 0.8, max: 26, flutter: 3, hz: 0.8 } },
        { name: `antN${tg}`, parent: 'headJ', s: SP.ANT[i], pivot: [4, 13], at: () => [10, -23], rot: () => 30 * D2R, soft: { key: 'aN', dir: [0, -8], k: 120, c: 5, gain: 0.42, turn: 0.8, max: 26, flutter: 3, hz: 0.8 } },
        { name: `ruff${tg}`, parent: 'bodyJ', s: SP.RUFF[i], pivot: [15, 4], at: () => [3, -16] },
        { name: `head${tg}`, parent: 'headJ', s: SP.HEAD[i], pivot: [17, 36] },
        ...(pass ? [{ name: 'face', parent: 'headJ', s: (a) => qbFace(a.qbMood ?? 'idle'), pivot: [17, 36] }] : []),
        { name: `dip${tg}`, parent: 'pawN', s: SP.DIP[i], pivot: [7, 32], rot: (S, a) => (S.dip - S.tilt - S.armN + (a.qbSpin ?? 0)) * D2R },
        { name: `armN${tg}`, parent: 'bodyJ', s: SP.ARM[0][i], pivot: [2, 3.5], at: () => [12, -6], rot: (S) => S.armN * D2R },
      ];
    }),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.16;
    ctx.fillStyle = '#2a2a1a';
    ctx.beginPath();
    ctx.ellipse(0, 6, 18, 3, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Honey: a drip off the dipper now and then; a splash of drops as it comes down.
    const [hx, hy] = at2(mat('dip'), 0, -22);
    const u = fr(a.now * 0.6);
    if (u < 0.5) dot(ctx, a, hx, hy + 8 + u * 30, 1.4, 1 - u * 2, HONEY);
    if (a.qbSplash > 0) for (let k = 0; k < 8; k++) {
      const q = (k / 8) * Math.PI;
      const r = (1 - a.qbSplash) * 22;
      dot(ctx, a, hx + Math.cos(q) * r, hy - Math.sin(q) * r * 0.7 + (1 - a.qbSplash) * 10, 2.2 * a.qbSplash + 0.6, a.qbSplash, HONEY);
    }
  },
}), 0.8);
// A still of her hovering (for anywhere a sprite is wanted), her mood's face.
export function queenBeeStill(pose, f, mood) {
  const by = -BODY_Y;
  return {
    w: 90,
    h: 90,
    res: 2,
    shapes: shift([
      ...put(wingP(true)(), [2, 7], -6, by - 12, -136), ...put(wingP(true)(), [2, 7], -6, by - 5, -158), ...put(legP(true)(), [3.5, 1], -5, by + 16),
      ...put(armP(true)(), [2, 3.5], -12, by - 6, 110), ...put(wingP(false)(), [2, 7], -3, by - 12, -128), ...put(wingP(false)(), [2, 7], -3, by - 5, -150), ...put(legP(false)(), [3.5, 1], 5, by + 16),
      ...put(bodyP(), [23, 22], 0, by), ...put(antP(), [4, 13], -6, by - 39, -35), ...put(antP(), [4, 13], 13, by - 40, 30), ...put(ruffP(), [15, 4], 3, by - 16),
      ...put(headP(), [17, 36], 3, by - 17), ...put(faceShapes(MOODS.has(mood) ? mood : 'idle', FACE), [17, 36], 3, by - 17),
      ...put(dipperP(), [7, 32], 12 + Math.cos(40 * D2R) * 9, by - 6 + Math.sin(40 * D2R) * 9, 35), ...put(armP(false)(), [2, 3.5], 12, by - 6, 40),
    ], 45, 80),
  };
}
