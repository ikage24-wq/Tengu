// The Puffbee, remade 2026-11-20 (the player's pick "Fluffball Bee"): a round ball of yellow fuzz
// from Petal Meadow's giant hive, brown-striped, with a cream fluff collar, little wings and pom-pom
// antennae. A darting flyer: drawn round its hover point. Live rig, outer outline only, the face
// bare, no squash.
//
// How it moves:
//   idle    an 8 s act: hovering, wings buzzing, antennae bobbing; a bee's waggle dance, wiggling
//           side to side; a happy bounce.
//   walk    darting along, leaning in, the wings a blur.
//   fight   it draws back, stinger first; then darts at you, speed lines streaming.
//   hit     knocked back, the antennae flicking.
//   dead    it drops low and droops, the wings still, dizzy.
// Built in the concept's own units and drawn at K of them.

import { E, T, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, put, shift, MOODS, moodOf, arcP } from './rigkit.js';

const K = 0.6;
const BEE = '#ffd44a';
const BEED = '#5a3a2a';
const fb = pairOf('fluffbee');

const smoothPts = (pts, n = 1) => {
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
const blob = (pts, c, n = 1) => T(smoothPts(pts, n), c);
const at = (shapes, [px, py], [bx, by]) => shift(shapes, bx - px, by - py);
const ln = (pts, w, c) => [F(taper(pts, w, w * 0.85, c))];
const ring = (x, y, rx, ry, n = 16) => Array.from({ length: n }, (_, i) => [x + Math.cos((i / n) * TAU) * rx, y + Math.sin((i / n) * TAU) * ry]);

// ---------- Parts ----------
// The fuzzball: the yellow ball with its fuzzy edge, the brown stripes, the cream collar, the
// stinger. Box 38 x 32; its middle (21, 16) = (32, 39).
const bodyP = () => at([
  T([[18, 40], [12, 42], [18.6, 44]], BEED),
  E(32, 39, 14, 13, BEE), ...Array.from({ length: 16 }, (_, i) => E(32 + Math.cos((i / 16) * TAU) * 13.6, 39 + Math.sin((i / 16) * TAU) * 12.6, 2, 2, BEE)),
  F(taper(arcP(22, 39, 5, 12, -70, 70, 8), 2.6, 2.6, BEED)), F(taper(arcP(28, 39, 4, 13, -76, 76, 8), 2.6, 2.6, BEED)),
  ...[[42, 45], [44, 41], [45, 46], [40, 48], [43, 50], [38, 50.6]].map(([x, y]) => F(E(x, y, 2.2, 2, '#fff6e0'))),
], [32, 39], [21, 16]);
// A little wing, from its root on the back. Box 14 x 18; the root (6, 16).
const wingP = (front) => () => [blob(front ? [[6, 16], [5, 4], [12, 1], [12, 13]] : [[6, 16], [1, 5], [7, 1], [10, 12]], front ? '#f4faff' : '#e8f6ff'), ...ln(front ? [[6.4, 14], [8.6, 5]] : [[6, 14], [5, 5]], 0.4, '#c8dcef')];
// An antenna with its pom-pom. Box 10 x 14; the root (2, 12).
const antP = () => [taper([[2, 12], [4, 5], [7, 2]], 1, 0.8, BEED), E(7.4, 2, 2.2, 2.2, BEE)];
// Three tiny legs, dangling. Box 16 x 6; hung from (8, 1).
const legsP = () => [E(2, 3, 1.4, 2, BEED), E(8, 4, 1.4, 2, BEED), E(14, 3, 1.4, 2, BEED)];
const PR = {
  BODY: fb('body', 38, 32, bodyP, 3, 3), WINGB: fb('wingB', 14, 18, wingP(false), 3, 3), WINGF: fb('wingF', 14, 18, wingP(true), 3, 3), ANT: fb('ant', 10, 14, antP, 3, 3), LEGS: fb('legs', 16, 6, legsP, 3, 3),
};

// ---------- Its own face: big glossy black eyes with two shines each, fuzzy pink cheeks and a tiny
// "v" mouth; to dart it narrows its eyes and its mouth makes an "o". ----------
const BDARK = '#2a2030';
const BEYES = [[27.4, 13, -1], [33.6, 12.6, 1]];
const beeFaceShapes = (mood) => {
  const out = [];
  for (const [x, y, s] of BEYES) {
    if (mood === 'blink' || mood === 'sleep') out.push(...ln(arcP(x, y + 0.2, 1.9, 1.1, 15, 165, 6), 0.6, BDARK));
    else if (mood === 'happy') out.push(...ln(arcP(x, y + 1.2, 1.9, 1.8, 200, 340, 6), 0.65, BDARK));
    else if (mood === 'hurt') out.push(...ln([[x + s * 1.6, y - 1.5], [x - s * 1.2, y], [x + s * 1.6, y + 1.5]], 0.65, BDARK));
    else if (mood === 'dizzy') {
      const pts = [];
      for (let i = 0; i <= 11; i++) pts.push([x + Math.cos(i * 0.9 * s) * (0.12 + i * 0.13), y + Math.sin(i * 0.9 * s) * (0.12 + i * 0.13)]);
      out.push(...ln(pts, 0.45, BDARK));
    } else if (mood === 'dead') out.push(...ln([[x - 1.6, y + 0.3], [x, y + 0.8], [x + 1.6, y + 0.3]], 0.6, BDARK));
    else {
      const cross = mood === 'angry' || mood === 'shout';
      let e = ring(x, y, 2.1, 2.7, 14);
      if (cross) e = e.map(([px, py]) => [px, Math.max(py, y - 0.8 + (px - x) * -s * 0.5)]);
      out.push(F(T(e, BDARK)));
      if (cross) out.push(F(E(x + 0.5, y + 0.6, 0.5, 0.5, '#ffffff')));
      else out.push(F(E(x + 0.7, y - 1, 0.85, 0.85, '#ffffff')), F(E(x - 0.6, y + 1, 0.4, 0.4, '#ffffff')));
    }
  }
  if (mood !== 'dead') out.push(F(E(25, 17.6, 1.6, 1, '#ffaac0')), F(E(35.8, 17, 1.2, 0.9, '#ffaac0')));
  const [mx, my] = [30.6, 17.6];
  if (mood === 'shout' || mood === 'angry') out.push(F(E(mx + 0.2, my + 0.4, 1, 1.2, '#8a3040')));
  else if (mood === 'happy') out.push(F(T(arcP(mx, my - 0.2, 1.3, 1.2, 0, 180, 6), '#8a3040')));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...ln([[mx - 1, my + 0.2], [mx - 0.35, my - 0.1], [mx + 0.35, my + 0.2], [mx + 1, my - 0.1]], 0.4, '#8a3040'));
  else if (mood === 'dead') out.push(F(E(mx, my + 0.3, 0.5, 0.55, '#8a3040')));
  else out.push(...ln([[mx - 1, my - 0.4], [mx, my + 0.6], [mx + 1, my - 0.4]], 0.5, '#8a3040'));
  return out;
};
const beeFace = (mood) => faceSprite(`fluffbee|face|${mood}`, 38, 32, () => beeFaceShapes(mood));

// The ball's middle floats 14 above its hover point; the rest hangs off it.
const BODY_Y = 14;
const WING_B = [-5, -14];
const WING_F = [1, -15];
const ANT_L = [7, -10];
const ANT_R = [11, -8];
const LEGS = [-1, 13.4];

// (Flyers are always "moving" to the game: go by how far it really travelled.)
const flyGait = (m, a) => {
  const st = (a.mo.fly ??= { odo: m.odo ?? 0, w: 0, calm: 1, still: 9 });
  const v = Math.abs((m.odo ?? 0) - st.odo) / Math.max(a.dt, 1e-3);
  st.odo = m.odo ?? 0;
  const going = v > 6 ? 1 : 0;
  st.w += (going - st.w) * (1 - Math.exp(-a.dt * 4));
  st.still = going ? 0 : st.still + a.dt;
  const calm = !a.ph.atk && m.hp > 0 && (a.hurtAgo ?? 9) > 3 && st.still > 0.3 ? 1 : 0;
  st.calm += (calm - st.calm) * (1 - Math.exp(-a.dt * 3));
  a.walkW = st.w;
  a.calm = st.calm;
};

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `wingB${tag}`, parent: 'bodyJ', s: PR.WINGB[i], pivot: [6, 16], at: () => WING_B, rot: (S, a) => (S.wb - 10 + (a.mbBuzz ?? 0)) * D2R },
    { name: `legs${tag}`, parent: 'bodyJ', s: PR.LEGS[i], pivot: [8, 1], at: () => LEGS, rot: (S) => S.lg * D2R, soft: { key: 'legs', dir: [0, 4], k: 90, c: 6, gain: 0.8, turn: 0.6, max: 30 } },
    { name: `antL${tag}`, parent: 'bodyJ', s: PR.ANT[i], pivot: [2, 12], at: () => ANT_L, rot: (S) => (S.aL - 12) * D2R },
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [21, 16] },
    ...(bare ? [{ name: 'face', parent: 'bodyJ', s: (a) => beeFace(MOODS.has(a.fbMood) ? a.fbMood : 'idle'), pivot: [21, 16] }] : []),
    { name: `antR${tag}`, parent: 'bodyJ', s: PR.ANT[i], pivot: [2, 12], at: () => ANT_R, rot: (S) => (S.aR + 14) * D2R },
    { name: `wingF${tag}`, parent: 'bodyJ', s: PR.WINGF[i], pivot: [6, 16], at: () => WING_F, rot: (S, a) => (S.wb + 6 - (a.mbBuzz ?? 0)) * D2R },
  ];
};

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
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

export const fluffBeeRig = sized(makeRig({
  w: 80, h: 80, soft: true, stride: 30, recover: 0.5,
  springs: { x: [220, 16], lift: [160, 12], tilt: [200, 13], wb: [200, 12], aL: [120, 6], aR: [120, 6], lg: [120, 8] },
  fast: ['x', 'tilt'],
  kick: { tilt: -170, aL: -500, aR: -600 },
  turnKick: { tilt: 120, aL: -260, aR: -300 },
  pose(m, a) {
    flyGait(m, a);
    a.uidOff = (m.uid % 13) * 0.67;
    const t = a.t + a.uidOff;
    const calm = a.calm ?? 1;
    const lu = t % 8;
    // Its act: a bee's waggle dance; a happy bounce.
    const waggle = hold(lu, 1.4, 1.6, 3.4, 3.6) * calm;
    const bounce = hold(lu, 5.4, 5.6, 6.6, 6.8) * calm;
    const bob = Math.sin(t * 3);
    const idle = {
      x: waggle * Math.sin(t * 14) * 2.4, lift: bob * 1.4 + bounce * Math.abs(Math.sin(t * 8)) * 3, tilt: waggle * Math.sin(t * 14) * 12 + bob * 2, wb: 0,
      aL: Math.sin(t * 2.6) * 8 + waggle * Math.sin(t * 14) * 10, aR: Math.sin(t * 2.9 + 1) * 8 - waggle * Math.sin(t * 14) * 10, lg: 0,
    };
    // Darting along, leaning in.
    const walk = { x: 0, lift: bob, tilt: 12, wb: -6, aL: -20, aR: -24, lg: 0 };
    // Drawn back, stinger first; then the dart.
    const antic = { x: -4, lift: 1, tilt: -16, wb: 6, aL: -30, aR: -34, lg: 0 };
    const strike = { x: 7, lift: -1, tilt: 18, wb: -10, aL: -40, aR: -46, lg: 0 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: dropped low, drooping, the wings still.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -8, tilt: 28, wb: 20, aL: 30, aR: 40, lg: 0 });
    // The wings buzz (a fast flutter on top of their pose), stopping when it is beaten.
    a.mbBuzz = m.hp > 0 ? Math.sin(a.now * (a.walkW > 0.5 || a.ph.atk ? 70 : 46)) * 16 : 0;
    a.fbMood = m.hp <= 0 ? 'dizzy' : moodOf(a, waggle > 0.4 || bounce > 0.4 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    ...pass(false),
    ...pass(true),
  ],
  // Speed lines streaming behind the dart.
  fx(ctx, m, a, S, mat) {
    const since = a.ph.since ?? -1;
    if (m.hp <= 0 || since < 0 || since > 0.4) return;
    const p = since / 0.4;
    const B = mat('bodyJ');
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    for (const [y, l] of [[-6, 9], [0, 12], [6, 8]]) {
      const [x0, y0] = at2(B, -18 - p * 6, y);
      const [x1, y1] = at2(B, -18 - p * 6 - l, y);
      ctx.globalAlpha = a.alpha * (1 - p);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): hovering.
export function fluffBeeStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const sh = [
    ...put(wingP(false)(), [6, 16], WING_B[0], by + WING_B[1], -10), ...put(legsP(), [8, 1], LEGS[0], by + LEGS[1]), ...put(antP(), [2, 12], ANT_L[0], by + ANT_L[1], -12),
    ...put(bodyP(), [21, 16], 0, by), ...put(beeFaceShapes(fm), [21, 16], 0, by), ...put(antP(), [2, 12], ANT_R[0], by + ANT_R[1], 14), ...put(wingP(true)(), [6, 16], WING_F[0], by + WING_F[1], 6),
  ];
  const ox = 18;
  const oy = 34;
  return { w: 36, h: 38, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
