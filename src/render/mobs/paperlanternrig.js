// The Lantern Tanuki, remade 2026-11-20 (the player's pick "Paper Lantern"): a tanuki pretending to
// be a red-and-white paper lantern in the Mist Hollow at night, its face peeking through a round hole
// in the paper, its ears on top, little feet and a striped tail. A candle glows inside. Live rig,
// outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    a 9 s act: glowing, the candle flickering; a wiggle of the ears; a little hop on the spot.
//   walk    bounding along in little hops (its gait), feet tucking up.
//   fight   it leans back and the candle flares bright; then puffs a lick of flame out of its hole.
//   hit     knocked back, rocking, ears flicking.
//   dead    it topples over, the candle gone out, dizzy.
// Built in the concept's own units and drawn at K of them; the feet at y 0.

import { E, T, R, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, arcP, pairOf, faceSprite, hold, stepPhase, put, shift, MOODS, moodOf, faceShapes, INK } from './rigkit.js';

const K = 0.82;
const TFUR = '#d9a476';
const TFURD = '#b47e58';
const TMASK = '#8f6650';
const TCREAM = '#fff0dc';
const PAPER = '#fff4dc';
const PAPERD = '#f0dcb4';
const LACQ = '#c8463c';
const pl = pairOf('paperlant');

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
const at = (shapes, [px, py], [bx, by]) => shift(shapes, bx - px, by - py);

// ---------- Parts ----------
// The striped tail. Box 14 x 14; its root (12, 12).
const tailP = () => at([taper([[0, 0], [-6, -3], [-9, -9]], 6, 4.2, TFUR), F(taper([[-3.4, -1.6], [-4.6, -2.4]], 4.4, 4.2, TMASK)), F(taper([[-7.4, -6], [-8.2, -7.4]], 3.8, 3.4, TMASK))], [0, 0], [12, 12]);
// A foot. Box 10 x 8; its top (5, 1).
const footP = (far) => () => [E(5, 3, far ? 3.4 : 3.6, far ? 2.4 : 2.6, far ? TFURD : TFUR)];
// An ear. Box 10 x 10; its base (5, 7).
const earP = (far) => () => [E(5, 5, 3.4, 3.2, far ? TFURD : TFUR), F(E(5, 5, 1.7, 1.5, TMASK))];
// The lantern: paper, its ribs, the lacquered rims, and the round hole with the tanuki's face in it.
// Box 40 x 36; its middle (20, 18) = (28, 40).
const lanternP = () => at([
  blob([[14, 26], [42, 26], [46, 40], [42, 54], [14, 54], [10, 40]], PAPER),
  ...[0, 1, 2, 3].map((k) => F(taper(arcP(28, 40, 17, 2 + k * 0.4, 0, 180, 10).map(([x, y]) => [x, y - 9 + k * 6]), 0.6, 0.6, PAPERD))),
  R(13, 24, 30, 4, LACQ), R(13, 52, 30, 4, LACQ), F(R(13, 24.6, 30, 0.8, '#e86a5a')),
  E(29, 38, 9, 8, TFUR), F(E(25.4, 38.4, 3, 2.4, TMASK)), F(E(32.8, 38.4, 3, 2.4, TMASK)), F(E(29.6, 42, 4, 2.6, TCREAM)), F(E(30, 40.8, 1.1, 0.8, INK)),
  F(taper(arcP(29, 38, 9.4, 8.4, 0, 360, 16), 1, 1, PAPERD)),
], [28, 40], [20, 18]);
const PR = {
  TAIL: pl('tail', 14, 14, tailP, 3, 3), FOOT: [false, true].map((f) => pl(`foot${f ? 1 : 0}`, 10, 8, footP(f), 3)), EAR: [false, true].map((f) => pl(`ear${f ? 1 : 0}`, 10, 10, earP(f), 3, 3)),
  LANTERN: pl('lantern', 40, 36, lanternP, 3, 3),
};
const FACE = { eyes: [[17.6, 15.6, 1.7, 2.2, -1], [24.6, 15.6, 1.7, 2.2, 1]], mouth: [21.6, 21.4, 1.3], blush: [[14.6, 18.6, 1.2], [27.6, 18.6, 1.2]], iris: '#5a3a2a', lid: 0, lashes: 0 };
const lanFace = (mood) => faceSprite(`paperlant|face|${mood}`, 40, 36, () => faceShapes(mood, FACE));

// The lantern's middle sits 20.2 above the feet.
const BODY_Y = 20.2;

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (far) => ({ name: `foot${far ? 1 : 0}${tag}`, parent: 'bodyJ', s: PR.FOOT[far ? 1 : 0][i], pivot: [5, 1], at: (S) => [far ? -5 : 5, 15.8 - S.tuck * 3 - S[far ? 'yF' : 'yN']], rot: (S) => (S[far ? 'lF' : 'lN'] - S.tilt) * D2R });
  const ear = (far) => ({ name: `ear${far ? 1 : 0}${tag}`, parent: 'bodyJ', s: PR.EAR[far ? 1 : 0][i], pivot: [5, 7], at: () => [far ? -8 : 8, -16], rot: (S) => (far ? -S.ear : S.ear) * D2R });
  return [
    { name: `tail${tag}`, parent: 'bodyJ', s: PR.TAIL[i], pivot: [12, 12], at: () => [-14, 10], rot: (S) => (S.tail - 10) * D2R },
    ear(true),
    ear(false),
    foot(true),
    foot(false),
    { name: `lantern${tag}`, parent: 'bodyJ', s: PR.LANTERN[i], pivot: [20, 18] },
    ...(bare ? [{ name: 'face', parent: 'bodyJ', s: (a) => lanFace(MOODS.has(a.plMood) ? a.plMood : 'idle'), pivot: [20, 18] }] : []),
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

export const paperLanternRig = sized(makeRig({
  w: 100, h: 80, soft: true, stride: 20, recover: 0.6,
  springs: { x: [240, 18], lift: [300, 15], tilt: [170, 10], ear: [260, 9], tail: [120, 8], tuck: [300, 18], lN: [340, 21], lF: [340, 21], yN: [400, 24], yF: [400, 24] },
  fast: ['x', 'lift', 'tuck'],
  kick: { tilt: -220, ear: 600 },
  turnKick: { tilt: 120, tail: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.91;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'paperlant', 20);
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: glowing; an ear wiggle; a little hop on the spot.
    const wiggle = hold(lu, 2.4, 2.6, 3.6, 3.8) * calm;
    const hop = hold(lu, 6, 6.12, 6.4, 6.6) * calm;
    const br = Math.sin(t * 1.4);
    const idle = { x: 0, lift: (br + 1) * 0.3 + hop * 5, tilt: br * 1.4, ear: br * 4 + wiggle * Math.sin(t * 24) * 22, tail: Math.sin(t * 1.8) * 10, tuck: hop, lN: 0, lF: 0, yN: 0, yF: 0 };
    // Bounding along in little hops.
    const s = Math.sin(u * TAU);
    const air = Math.abs(s);
    const walk = { x: 0, lift: air * 6, tilt: 4 - Math.cos(u * TAU) * 5, ear: -8 + air * 10, tail: 14 + air * 10, tuck: air, lN: -air * 14, lF: air * 14, yN: 0, yF: 0 };
    // Leaning back as the candle flares; then the flame puff.
    const antic = { x: -2, lift: 0, tilt: -10, ear: -16, tail: 18, tuck: 0, lN: 6, lF: -6, yN: 0, yF: 0 };
    const strike = { x: 3, lift: 1, tilt: 10, ear: 14, tail: -10, tuck: 0, lN: -10, lF: 8, yN: 0, yF: 0 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: toppled over, the candle out.
    if (m.hp <= 0) Object.assign(S, { x: -2, lift: 0, tilt: -72, ear: 30, tail: 30, tuck: 0, lN: -40, lF: 40, yN: 0, yF: 0 });
    a.plMood = m.hp <= 0 ? 'dizzy' : moodOf(a, wiggle > 0.4 || hop > 0.4 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    ...pass(false),
    ...pass(true),
  ],
  // The candle's warm glow round the paper (flickering, brighter as it flares), and the flame puff.
  under(ctx, m, a, S, mat) {
    ctx.save();
    ctx.globalAlpha = a.alpha * 0.2;
    ctx.fillStyle = '#2a2240';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 13, 2.8, 0, 0, TAU);
    ctx.fill();
    if (m.hp > 0) {
      const [cx, cy] = at2(mat('bodyJ'), 0, 0);
      const fl = 0.85 + Math.sin(a.now * 13 + m.uid) * 0.08 + Math.sin(a.now * 7.3) * 0.07;
      const glow = (0.32 + a.ph.antic * 0.35) * fl;
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 30 + a.ph.antic * 8);
      g.addColorStop(0, `rgba(255,214,120,${glow * a.alpha})`);
      g.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(cx - 40, cy - 40, 80, 80);
    }
    ctx.restore();
  },
  fx(ctx, m, a, S, mat) {
    const since = a.ph.since ?? -1;
    if (m.hp <= 0 || since < 0 || since > 0.6) return;
    const q = since / 0.6;
    const [hx, hy] = at2(mat('bodyJ'), 10, 0);
    const t = a.now;
    ctx.save();
    // (A lick of flame: a soft orange tongue with a yellow core, curling up as it fades.)
    for (const [c, k] of [['#ffb040', 1], ['#ffe680', 0.55]]) {
      ctx.globalAlpha = a.alpha * (1 - q);
      ctx.fillStyle = c;
      const L = (14 + q * 14) * k;
      const w = (5 + q * 3) * k;
      const lift = q * 6;
      ctx.beginPath();
      ctx.moveTo(hx, hy - w * 0.4);
      ctx.quadraticCurveTo(hx + L * 0.5, hy - w - lift + Math.sin(t * 20) * 1.2, hx + L, hy - lift * 1.4);
      ctx.quadraticCurveTo(hx + L * 0.5, hy + w * 0.8 - lift * 0.4, hx, hy + w * 0.4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): glowing.
export function paperLanternStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const sh = [
    ...put(tailP(), [12, 12], -14, by + 10, -10), ...put(earP(true)(), [5, 7], -8, by - 16), ...put(earP(false)(), [5, 7], 8, by - 16),
    ...put(footP(true)(), [5, 1], -5, by + 15.8), ...put(footP(false)(), [5, 1], 5, by + 15.8), ...put(lanternP(), [20, 18], 0, by), ...put(faceShapes(fm, FACE), [20, 18], 0, by),
  ];
  const ox = 22;
  const oy = 46;
  return { w: 46, h: 48, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
