// The Dullahan, remade 2026-11-20 (the player's pick "Kitten in the Armour"): the watchmen of the
// Twilight Ruins' Sunken Crypt. A fallen knight's armour stands about with nobody in it: a ginger
// kitten has moved in and drives it, just its ears and eyes peeking over the empty collar (and its
// striped tail poking out under the cape). The armour carries its own empty helmet under one arm and
// leans on its sword. Live rig, outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    a 10 s act: the kitten keeping watch over the rim, looking about; ducking down inside
//           and peeking up again; popping right up for a stretch; a swish of the tail. The armour
//           itself stands still, leaning on its planted sword.
//   walk    a clanky, wobbly march (a kitten is driving), the sword lifted and trailing, the
//           kitten peeking higher to see where it's going.
//   fight   the kitten pops right up, paws on the rim, as the armour heaves the sword up overhead;
//           then chops it over and down in a white swoosh.
//   hit     the kitten ducks inside; the helmet jolts; it peeks back out.
//   dead    the armour sinks to its knees, the helmet drops, the sword leans on the floor; the
//           kitten pops out dizzy.
// Built in the concept's own units (drawn at K of them); the feet at y 0.

import { E, T, R, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, arcP, pairOf, faceSprite, hold, stepPhase, pawStep, put, MOODS, moodOf } from './rigkit.js';

const K = 1;
const STL = '#d3dbf4';
const STL2 = '#bcc6ea';
const STD = '#9da9d4';
const HOLE = '#2a2240';
const PLUM = '#8a70d8';
const GOLD = '#f2c860';
const CORAL = '#ff8a7a';
const KIT = '#f6b27a';
const KITD = '#e0905a';
const KITC = '#fff1e0';
const ka = pairOf('kitarm');

const smoothPts = (pts, n = 2) => {
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
const blob = (pts, c, n = 2) => T(smoothPts(pts, n), c);

// ---------- Parts ----------
// The cape, hung from the shoulders. Box 32 x 34; its top middle (16, 2).
const capeP = () => [blob([[5, 2], [27, 2], [31, 30], [16, 34], [1, 30]], PLUM)];
// The kitten's tail, poking out under the cape. Box 16 x 14; its root (14, 10).
const tailP = () => [taper([[14, 10], [8, 8.6], [4.4, 5.4], [3.4, 1.8]], 3.6, 2.6, KIT), F(R(9, 7.6, 1.2, 2.6, KITD)), F(R(5.4, 4.4, 2.4, 1.1, KITD))];
// The sword. Box 10 x 34; the grip (5, 7).
const swordP = () => [
  T([[3.7, 10.8], [6.3, 10.8], [6.3, 29.8], [5, 33.2], [3.7, 29.8]], '#eef3ff'), F(R(4.7, 11.8, 0.6, 16, '#c8d2f0')),
  R(1.2, 9, 7.6, 1.9, GOLD), R(4.2, 5, 1.6, 4.2, '#7a5a8a'), E(5, 4.4, 1.7, 1.7, GOLD),
];
// An arm in plate with a gold gauntlet. Box 8 x 12; the shoulder (4, 1.5).
const armFP = () => [taper([[4, 1.5], [4, 8]], 4, 3.6, STD), E(4, 8.6, 2.6, 2.6, GOLD)];
const armNP = () => [taper([[3, 1], [5.4, 6], [3, 10]], 4, 3.6, STL), E(2.2, 10.4, 2.6, 2.3, GOLD)];
// A leg: greave, knee cop, sabaton. Box 14 x 18; the hip (7, 1).
const legP = (far) => () => [R(4, 1, 6, 12, far ? STD : STL), E(7, 6.4, 3.2, 2.6, far ? STD : STL2), E(7.4, 14.4, far ? 4.6 : 5, far ? 2.6 : 2.8, far ? STD : STL)];
// The plates hanging from the belt. Box 22 x 8; the belt's middle (11, 1).
const fauldsP = () => [blob([[3, 1], [19, 1], [21, 6.4], [1, 6.4]], STD, 1)];
// The breastplate. Box 26 x 22; its middle (13, 10).
const torsoP = () => [
  blob([[1, 0], [25, 0], [24, 10], [20, 20], [6, 20], [2, 10]], STL), F(blob([[3.6, 2], [10.4, 1.6], [9.4, 9], [4.6, 11]], '#f4f7ff', 1)),
  F(R(12.6, 2.4, 0.8, 13.6, STL2)), F(R(4.4, 17, 17.2, 2.4, GOLD)), F(E(13, 18.2, 1.6, 1.6, CORAL)),
];
// The far pauldron. Box 12 x 9; its middle (6, 4.5).
const paulFP = () => [E(6, 4.5, 5, 3.6, STD)];
// The near pauldron, two plates. Box 14 x 12; (7, 4).
const paulNP = () => [E(7, 4, 5.6, 3.8, STL), E(7.6, 7.4, 4.8, 3, STL2)];
// The empty collar and the dark inside of the armour. Box 20 x 8; its middle (10, 4).
const collarP = () => [E(10, 4, 8.4, 2.6, STD), F(E(10, 4, 6.6, 1.8, HOLE))];
// The collar's front lip, in front of the kitten. Box 20 x 8; (10, 4).
const lipP = () => [T([...arcP(10, 4, 8.4, 2.6, 0, 180, 10), ...arcP(10, 5.8, 8.2, 2.2, 180, 0, 10)], STD)];
// The kitten: its head, and its body going down inside the armour. Box 16 x 28; the head's middle (8, 10).
const kittenP = () => [
  blob([[3.6, 12], [12.4, 12], [12.6, 26], [3.4, 26]], KIT, 1),
  T([[3, 8], [3.6, 1.4], [7, 5.6]], KIT), T([[9, 5.6], [12.4, 1.4], [13, 8]], KIT), F(T([[4, 7], [4.4, 3.4], [6, 5.8]], '#ffc0d0')), F(T([[10, 5.8], [11.6, 3.4], [12, 7]], '#ffc0d0')),
  E(8, 10, 5.8, 5, KIT), F(E(8, 12.2, 2.8, 1.8, KITC)), F(T([[5.4, 5.4], [6.6, 7.6], [7.4, 5.2]], KITD)), F(T([[8.6, 5.2], [9.4, 7.6], [10.6, 5.4]], KITD)),
];
// A paw. Box 6 x 6; its middle (3, 3).
const pawP = () => [E(3, 3, 1.8, 1.5, KIT)];
// The empty helmet. Box 20 x 18; its middle (9, 11).
const helmP = () => [
  taper([[6.2, 5.6], [9.6, 1.8], [14.6, 2.2]], 3, 1.6, CORAL), E(9, 11, 6.4, 6, STL), F(E(6.8, 8.4, 2, 1.4, '#ffffff')), F(R(9.6, 9.6, 5.8, 1.8, HOLE)), F(R(8.2, 4.6, 1.2, 4, GOLD)),
];
const PR = {
  CAPE: ka('cape', 32, 34, capeP, 3), TAIL: ka('tail', 16, 14, tailP, 3, 3), SWORD: ka('sword', 10, 34, swordP, 3, 3), ARMF: ka('armF', 8, 12, armFP, 3, 3), ARMN: ka('armN', 8, 12, armNP, 3, 3),
  LEG: [false, true].map((f) => ka(`leg${f ? 1 : 0}`, 14, 18, legP(f), 3)), FAULDS: ka('faulds', 22, 8, fauldsP, 3, 3), TORSO: ka('torso', 26, 22, torsoP, 3, 3),
  PAULF: ka('paulF', 12, 9, paulFP, 3, 3), PAULN: ka('paulN', 14, 12, paulNP, 3, 3), COLLAR: ka('collar', 20, 8, collarP, 3, 3), LIP: ka('lip', 20, 8, lipP, 3, 3),
  KITTEN: ka('kitten', 16, 28, kittenP, 3, 3), PAW: ka('paw', 6, 6, pawP, 3, 3), HELM: ka('helm', 20, 18, helmP, 3, 3),
};
// ---------- Its own face: big green kitten eyes with tall pupils, a pink nose, the little cat
// mouth and whiskers; it hisses with its fangs when cross and squeezes its eyes shut to yowl. ----------
const CDARK = '#2a2a3a';
const CGREEN = '#6ad08a';
const CPINK = '#ff8fab';
const CWHISK = '#b8703e';
const ln = (pts, w, c = CDARK) => [F(taper(pts, w, w * 0.85, c))];
const CEYES = [[6, 10.1, -1], [10, 10.1, 1]];
const kitFaceShapes = (mood) => {
  const out = [];
  for (const [x, y, s] of CEYES) {
    if (mood === 'blink' || mood === 'sleep') out.push(...ln(arcP(x, y, 1.3, 0.8, 15, 165, 6), 0.55));
    else if (mood === 'happy') out.push(...ln(arcP(x, y + 0.8, 1.3, 1.2, 200, 340, 6), 0.6));
    else if (mood === 'shout') out.push(...ln([[x + s * 1.1, y - 1], [x - s * 0.9, y], [x + s * 1.1, y + 1]], 0.6));
    else if (mood === 'dead') out.push(...ln([[x - 1.1, y + 0.2], [x, y + 0.5], [x + 1.1, y + 0.2]], 0.5));
    else if (mood === 'dizzy') {
      const pts = [];
      for (let i = 0; i <= 11; i++) pts.push([x + Math.cos(i * 0.9 * s) * (0.12 + i * 0.1), y + Math.sin(i * 0.9 * s) * (0.12 + i * 0.1)]);
      out.push(...ln(pts, 0.35, '#3a9a5a'));
    } else {
      const angry = mood === 'angry';
      let ring = Array.from({ length: 14 }, (_, i) => [x + Math.cos((i / 14) * Math.PI * 2) * 1.35, y + Math.sin((i / 14) * Math.PI * 2) * 1.5]);
      if (angry) ring = ring.map(([px, py]) => [px, Math.max(py, y - 0.5 + (px - x) * -s * 0.5)]);
      out.push(F(T(ring, CDARK)), F(E(x, y + 0.2, 1.05, angry ? 0.9 : 1.15, CGREEN)));
      const big = mood === 'hurt';
      out.push(F(E(x, y + 0.2, angry ? 0.2 : big ? 0.75 : 0.42, angry ? 0.8 : 0.95, CDARK)));
      if (!angry) out.push(F(E(x + 0.45, y - 0.45, 0.36, 0.36, '#ffffff')), F(E(x - 0.4, y + 0.7, 0.16, 0.16, '#ffffff')));
      if (big) out.push(F(E(x, y + 1.4, 1.1, 0.35, '#bfe8ff')));
    }
  }
  // Whiskers, the pink nose, the mouth.
  out.push(...ln([[1.6, 11.4], [3.6, 11.9]], 0.25, CWHISK), ...ln([[1.6, 12.9], [3.6, 12.6]], 0.25, CWHISK), ...ln([[14.4, 11.4], [12.4, 11.9]], 0.25, CWHISK), ...ln([[14.4, 12.9], [12.4, 12.6]], 0.25, CWHISK));
  out.push(F(T([[7.4, 11.2], [8.6, 11.2], [8, 11.9]], CPINK)));
  const [mx, my] = [8, 12.3];
  if (mood === 'happy') out.push(F(T(arcP(mx, my - 0.1, 1, 1, 0, 180, 8), '#7a3040')), F(E(mx, my + 0.5, 0.5, 0.3, CPINK)));
  else if (mood === 'shout') out.push(F(T([[mx - 1.2, my - 0.1], [mx + 1.2, my - 0.1], [mx, my + 2]], '#7a3040')), F(E(mx, my + 1.1, 0.45, 0.3, CPINK)));
  else if (mood === 'angry') out.push(F(T(arcP(mx, my - 0.1, 1.1, 0.9, 0, 180, 8), '#7a3040')), F(T([[mx - 0.8, my - 0.05], [mx - 0.4, my - 0.05], [mx - 0.6, my + 0.6]], '#fffaf2')), F(T([[mx + 0.4, my - 0.05], [mx + 0.8, my - 0.05], [mx + 0.6, my + 0.6]], '#fffaf2')));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...ln([[mx - 1, my + 0.3], [mx - 0.35, my], [mx + 0.35, my + 0.3], [mx + 1, my]], 0.3));
  else if (mood === 'dead') out.push(...ln([[mx - 0.6, my + 0.2], [mx + 0.6, my + 0.2]], 0.3));
  else out.push(...ln([[mx, my - 0.4], [mx, my]], 0.25), ...ln(arcP(mx - 0.5, my, 0.5, 0.45, 0, 180, 6), 0.28), ...ln(arcP(mx + 0.5, my, 0.5, 0.45, 0, 180, 6), 0.28));
  return out;
};
const kitFace = (mood) => faceSprite(`kitarm|face|${mood}`, 16, 28, () => kitFaceShapes(mood));

// The trunk (the breastplate's middle) sits 27 above the feet; the collar 10.4 above that.
const TRUNK_Y = 27;
const COLLAR_Y = -10.4;
const SH_F = [-10, -6];

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (far) => ({ name: `leg${far ? 1 : 0}${tag}`, parent: 'trunk', s: PR.LEG[far ? 1 : 0][i], pivot: [7, 1], at: (S) => [far ? -4 : 5.2, 11 - S[far ? 'yF' : 'yN']], rot: (S) => (S[far ? 'lF' : 'lN'] - S.tilt) * D2R });
  // (The kitten shows only above the collar's rim: the rest of it is inside the armour.)
  const kclip = (a, S) => [-12, -16, 24, 16 - S.ky + 0.3];
  const paw = (side) => ({
    name: `paw${side}${tag}`, parent: 'trunk', s: PR.PAW[i], pivot: [3, 3], alpha: (a, S) => clamp((-S.ky - 0.6) / 2.4, 0, 1),
    at: (S) => [side * 4.4 + (S.kx + side * 6.2 - side * 4.4) * S.paw, COLLAR_Y - 0.6 + (S.ky - 2.4) * S.paw],
  });
  return [
    { name: `tail${tag}`, parent: 'trunk', s: PR.TAIL[i], pivot: [14, 10], at: () => [-9, 10], rot: (S) => S.tail * D2R },
    { name: `cape${tag}`, parent: 'trunk', s: PR.CAPE[i], pivot: [16, 2], at: () => [0, -9], soft: { key: 'cape', dir: [0, 30], k: 60, c: 5, gain: 0.7, turn: 0.6, max: 18, flutter: 2, hz: 0.6 } },
    { name: `armF${tag}`, parent: 'trunk', s: PR.ARMF[i], pivot: [4, 1.5], at: () => SH_F, rot: (S) => S.aF * D2R },
    leg(true),
    leg(false),
    { name: `faulds${tag}`, parent: 'trunk', s: PR.FAULDS[i], pivot: [11, 1], at: () => [0, 9] },
    { name: `torso${tag}`, parent: 'trunk', s: PR.TORSO[i], pivot: [13, 10] },
    { name: `paulF${tag}`, parent: 'trunk', s: PR.PAULF[i], pivot: [6, 4.5], at: () => [-11, -8] },
    // (The sword is drawn in front of the breastplate, held by the far hand behind it: at rest it
    // stands clear at the side, overhead it is clear above, and the chop sweeps across the front.)
    { name: `sword${tag}`, parent: 'armF', s: PR.SWORD[i], pivot: [5, 7], at: () => [0, 7.1], rot: (S) => S.sw * D2R },
    { name: `collar${tag}`, parent: 'trunk', s: PR.COLLAR[i], pivot: [10, 4], at: () => [0, COLLAR_Y] },
    { name: `kitten${tag}`, parent: 'kitJ', s: PR.KITTEN[i], pivot: [8, 10], clip: kclip },
    ...(bare ? [{ name: 'face', parent: 'kitJ', s: (a) => kitFace(MOODS.has(a.kaMood) ? a.kaMood : 'idle'), pivot: [8, 10], clip: kclip }] : []),
    { name: `lip${tag}`, parent: 'trunk', s: PR.LIP[i], pivot: [10, 4], at: () => [0, COLLAR_Y] },
    paw(-1),
    paw(1),
    { name: `helm${tag}`, parent: 'trunk', s: PR.HELM[i], pivot: [9, 11], at: (S) => [14.4 + S.hx, 6.4 + S.hy], rot: (S) => S.hr * D2R },
    { name: `armN${tag}`, parent: 'trunk', s: PR.ARMN[i], pivot: [3, 1], at: () => [11.4, -5], rot: (S) => -S.aN * D2R },
    { name: `paulN${tag}`, parent: 'trunk', s: PR.PAULN[i], pivot: [7, 4], at: () => [11.2, -8.6] },
  ];
};

const sized = (rig, k) => {
  if (k === 1) return rig;
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
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

export const kittenArmourRig = sized(makeRig({
  w: 84, h: 76, soft: true, stride: 16, recover: 0.7,
  springs: {
    x: [240, 18], lift: [260, 17], tilt: [180, 13], lN: [340, 21], lF: [340, 21], yN: [400, 24], yF: [400, 24],
    aF: [200, 15], sw: [220, 15], aN: [180, 13], hx: [200, 14], hy: [240, 15], hr: [200, 13],
    // The kitten: quick to duck and pop, with a little overshoot.
    ky: [260, 15], kx: [160, 12], kr: [160, 11], paw: [220, 15], tail: [110, 8],
  },
  fast: ['x', 'lN', 'lF', 'yN', 'yF', 'aF', 'sw'],
  kick: { tilt: -110, ky: 160, hy: -90, hr: 260, kr: -120 },
  turnKick: { tilt: 90, tail: 240, kr: 120 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'kitarm', 16);
    const calm = a.calm ?? 1;
    const lu = t % 10;
    // The kitten's act: keeping watch; ducking down inside and peeking back up; a big stretch; a
    // swish of the tail.
    const duck = hold(lu, 3, 3.3, 4.3, 4.8) * calm;
    const pop = hold(lu, 6.2, 6.6, 7.8, 8.2) * calm;
    const swish = hold(lu, 8.6, 8.8, 9.4, 9.8) * calm;
    const look = Math.sin(t * 0.8);
    const idle = {
      x: 0, lift: 0, tilt: look * 0.5, lN: 0, lF: 0, yN: 0, yF: 0, aF: 22, sw: -22, aN: 4, hx: 0, hy: 0, hr: 0,
      ky: -2.4 + duck * 7.4 - pop * 6, kx: look * 1.2 * (1 - pop), kr: Math.sin(t * 0.9) * 8 * (1 - duck) + pop * Math.sin(t * 5) * 4, paw: pop,
      tail: -6 + Math.sin(t * 1.3) * 6 + swish * Math.sin(t * 14) * 16,
    };
    // A clanky, wobbly march.
    const s = Math.sin(u * TAU);
    const [dxN, upN] = pawStep(u, 0, 16, 0.6, 2.4);
    const [dxF, upF] = pawStep(u, 0.5, 16, 0.6, 2.4);
    const walk = {
      x: 0, lift: Math.abs(Math.cos(u * TAU)) * 1, tilt: 2 + s * 3, lN: -dxN * 2.6, lF: -dxF * 2.6, yN: upN, yF: upF,
      aF: 10 + s * 6, sw: 30, aN: 6 - s * 8, hx: 0, hy: Math.abs(s) * 0.6, hr: -s * 3,
      ky: -3.8 - Math.abs(s) * 0.8, kx: 0.8, kr: -s * 6, paw: 0, tail: -10 + s * 16,
    };
    // Heave the sword up overhead, the kitten popped right up; then chop it over and down.
    // (Angles that only ever wind forwards: up the front and over the top, then down in front.)
    const antic = { x: -1, lift: 0, tilt: -6, lN: 8, lF: -6, yN: 0, yF: 0, aF: -192, sw: -8, aN: 10, hx: -0.6, hy: 0, hr: -4, ky: -8, kx: -0.6, kr: -6, paw: 1, tail: 20 };
    const strike = { x: 5, lift: 0, tilt: 10, lN: -16, lF: 12, yN: 0, yF: 0, aF: -55, sw: 0, aN: -6, hx: 0.6, hy: 0, hr: 4, ky: -7, kx: 1.2, kr: 12, paw: 0.6, tail: -24 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: down on its knees, the helmet dropped, the sword leaning on the floor; the kitten
    // popped out, dizzy.
    if (m.hp <= 0) Object.assign(S, { x: -2, lift: -2, tilt: 8, lN: -46, lF: 50, yN: 0, yF: 0, aF: 10, sw: 16, aN: 20, hx: 6, hy: 9.6, hr: 30, ky: -8, kx: 0, kr: 16, paw: 0.8, tail: 20 });
    a.kaMood = m.hp <= 0 ? 'dizzy' : moodOf(a, pop > 0.5 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -TRUNK_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'kitJ', parent: 'trunk', at: (S) => [S.kx, COLLAR_Y + S.ky], rot: (S) => S.kr * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.22;
    ctx.fillStyle = '#2a2240';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 15, 3, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // The chop's swoosh: a white crescent over and down in front, fading.
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0 || !(a.ph.strike > 0)) return;
    const since = a.ph.since ?? 0;
    const al = clamp(1 - since / 0.32, 0, 1) * Math.min(1, a.ph.strike * 3);
    if (al <= 0.02) return;
    const M = mat('trunk');
    const R0 = 31;
    const pts = [];
    for (let k = 0; k <= 14; k++) {
      const ang = (-150 + (185 * k) / 14) * D2R;
      const w = Math.sin((Math.PI * k) / 14) * 3.6 + 0.4;
      pts.push([SH_F[0] + Math.cos(ang) * R0, SH_F[1] + Math.sin(ang) * R0, w]);
    }
    ctx.save();
    ctx.globalAlpha = a.alpha * al * 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    pts.forEach(([x, y], k) => {
      const [px, py] = at2(M, x, y);
      if (k) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    });
    for (let k = pts.length - 1; k >= 0; k--) {
      const [x, y, w] = pts[k];
      const d = Math.hypot(x - SH_F[0], y - SH_F[1]);
      const [px, py] = at2(M, SH_F[0] + ((x - SH_F[0]) * (d - w)) / d, SH_F[1] + ((y - SH_F[1]) * (d - w)) / d);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): keeping watch.
export function kittenArmourStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const ox = 30;
  const oy = 62;
  const ty = -TRUNK_Y;
  const ky = ty + COLLAR_Y - 2.4;
  const hand = [SH_F[0] - 7.1 * Math.sin(22 * D2R), ty + SH_F[1] + 7.1 * Math.cos(22 * D2R)];
  const kit = kittenP().slice(1);
  return { w: 64, h: 66, res: 3, shapes: put([
    ...put(tailP(), [14, 10], -9, ty + 10, -6), ...put(capeP(), [16, 2], 0, ty - 9), ...put(swordP(), [5, 7], hand[0], hand[1]), ...put(armFP(), [4, 1.5], SH_F[0], ty + SH_F[1], 22),
    ...put(legP(true)(), [7, 1], -4, ty + 11), ...put(legP(false)(), [7, 1], 5.2, ty + 11), ...put(fauldsP(), [11, 1], 0, ty + 9), ...put(torsoP(), [13, 10], 0, ty),
    ...put(paulFP(), [6, 4.5], -11, ty - 8), ...put(collarP(), [10, 4], 0, ty + COLLAR_Y), ...put(kit, [8, 10], 0, ky), ...put(kitFaceShapes(fm), [8, 10], 0, ky),
    ...put(lipP(), [10, 4], 0, ty + COLLAR_Y), ...put(pawP(), [3, 3], -4.4, ty + COLLAR_Y - 0.6), ...put(pawP(), [3, 3], 4.4, ty + COLLAR_Y - 0.6),
    ...put(helmP(), [9, 11], 14.4, ty + 6.4), ...put(armNP(), [3, 1], 11.4, ty - 5, -4), ...put(paulNP(), [7, 4], 11.2, ty - 8.6),
  ], [0, 0], ox, oy) };
}
