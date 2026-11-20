// The Warg, remade 2026-11-20 (the player's pick "Wolf Pup"): a chunky chibi wolf pup of Mossy Woods,
// blue-grey with a fluffy cream ruff and a red spotted bandana. Four-legged, done chibi (a big head,
// short legs that read, no loaf). Tuskar calls them into his den, where they fight like his own. Live
// rig, outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    a 9 s act: sniffing about, the tail wagging; a play bow, rump up and tail going; a big
//           yawn-howl.
//   walk    a loping gallop, front and back pairs together, ears back.
//   fight   it crouches low and wiggles its rump; then pounces with a chomp.
//   hit     knocked back with a yelp, the ears flat.
//   dead    it flops down flat, legs folded, dizzy.
// Built in the concept's own units and drawn at K of them; the paws at y 0.

import { E, T, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, INK } from './rigkit.js';

const K = 0.72;
const WOLF = '#8a96c0';
const WOLFD = '#6e78a4';
const WCREAM = '#eef0fa';
const BAND = '#d8584a';
const wp = pairOf('wolfpup');

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
// The bushy tail. Box 16 x 16; its root (13, 13) = (12, 40).
const tailP = () => at([blob([[12, 40], [4, 34], [2, 28], [8, 32], [14, 36]], WOLF, 1), F(blob([[3, 29], [6, 31], [4, 33]], WCREAM, 1))], [12, 40], [13, 13]);
// A leg and its paw. Box 10 x 14; the hip (5, 1).
const legP = (far) => () => [taper([[5, 1], [5, 10]], 4.4, 4, far ? WOLFD : WOLF), E(5.6, 11.6, 3.2, 2.2, far ? WOLFD : WOLF)];
// The body. Box 28 x 20; its middle (14, 10) = (23, 44).
const bodyP = () => at([E(23, 44, 12, 8, WOLF), F(E(26, 47, 7, 3.4, WCREAM))], [23, 44], [14, 10]);
// The fluffy ruff and the bandana. Box 20 x 18; (8, 8) = (34, 40).
const ruffP = () => at([
  blob([[28, 34], [36, 32], [40, 40], [34, 46], [28, 44]], WCREAM), blob([[30, 36], [44, 36], [45, 39], [36, 40], [29, 39]], BAND, 1), T([[32, 38], [28, 44], [33, 42]], BAND),
  F(E(37, 38, 1, 1, '#ffffff')), F(E(41, 38, 1, 1, '#ffffff')),
], [34, 40], [8, 8]);
// The head: pointy ears, the cream muzzle and nose. Box 30 x 32; the neck (6, 26) = (34, 36).
const headP = () => at([
  T([[32, 20], [33, 9], [39, 18]], WOLF), T([[42, 18], [46, 8], [48, 20]], WOLF), F(T([[33.6, 18.4], [34, 12], [37.6, 18]], '#ffc8d4')), F(T([[43.4, 18], [45.6, 11], [46.6, 18.6]], '#ffc8d4')),
  E(40, 28, 11, 10, WOLF), F(E(43, 32, 7, 5, WCREAM)), E(49, 31, 4.4, 3.4, WCREAM), F(E(52.4, 30, 1.6, 1.2, INK)),
], [34, 36], [6, 26]);
const PR = {
  TAIL: wp('tail', 16, 16, tailP, 3, 3), LEG: [false, true].map((f) => wp(`leg${f ? 1 : 0}`, 10, 14, legP(f), 3, 3)), BODY: wp('body', 28, 20, bodyP, 3, 3),
  RUFF: wp('ruff', 20, 18, ruffP, 3, 3), HEAD: wp('head', 30, 32, headP, 3, 3),
};
const FACE = { eyes: [[13, 17, 1.9, 2.4, -1], [18.6, 17, 1.7, 2.2, 1]], mouth: [20, 25, 1.2], blush: [[10, 21, 1.3]], iris: '#c8862a', lid: 0, lashes: 0 };
const pupFace = (mood) => faceSprite(`wolfpup|face|${mood}`, 30, 32, () => faceShapes(mood, FACE));

// The body's middle sits 14.8 above the paws; the hips 2 below it.
const BODY_Y = 14.8;
const HIPS = { hf: [-7, 2], ff: [7, 2], hn: [-3, 2], fn: [11, 2] };

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (k, far) => ({ name: `leg_${k}${tag}`, parent: 'bodyJ', s: PR.LEG[far ? 1 : 0][i], pivot: [5, 1], at: (S) => [HIPS[k][0], HIPS[k][1] - S[`y_${k}`]], rot: (S) => (S[`l_${k}`] - S.tilt) * D2R });
  return [
    { name: `tail${tag}`, parent: 'bodyJ', s: PR.TAIL[i], pivot: [13, 13], at: () => [-11, -4], rot: (S) => S.tail * D2R },
    leg('hf', true),
    leg('ff', true),
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [14, 10] },
    leg('hn', false),
    leg('fn', false),
    { name: `ruff${tag}`, parent: 'bodyJ', s: PR.RUFF[i], pivot: [8, 8], at: () => [11, -4] },
    { name: `head${tag}`, parent: 'headJ', s: PR.HEAD[i], pivot: [6, 26] },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => pupFace(MOODS.has(a.wpMood) ? a.wpMood : 'idle'), pivot: [6, 26] }] : []),
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
const legs = (v) => ({ l_hf: v[0], l_ff: v[1], l_hn: v[2], l_fn: v[3] });
const lifts = (v) => ({ y_hf: v[0], y_ff: v[1], y_hn: v[2], y_fn: v[3] });

export const wolfPupRig = sized(makeRig({
  w: 90, h: 76, soft: true, stride: 30, recover: 0.6,
  springs: {
    x: [240, 18], lift: [280, 16], tilt: [180, 13], hd: [160, 11], tail: [160, 8],
    l_hf: [340, 21], l_ff: [340, 21], l_hn: [340, 21], l_fn: [340, 21], y_hf: [400, 24], y_ff: [400, 24], y_hn: [400, 24], y_fn: [400, 24],
  },
  fast: ['x', 'lift', 'tilt', 'l_ff', 'l_fn', 'l_hf', 'l_hn'],
  kick: { tilt: -160, hd: -220 },
  turnKick: { tilt: 100, tail: 300 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.73;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'wolfpup', 30);
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: sniffing about; a play bow; a big yawn-howl.
    const sniff = hold(lu, 0.6, 1, 2.6, 3) * calm;
    const bow = hold(lu, 4, 4.4, 5.6, 6) * calm;
    const howl = hold(lu, 7, 7.4, 8.2, 8.6) * calm;
    const br = Math.sin(t * 1.6);
    const idle = {
      x: 0, lift: (br + 1) * 0.2, tilt: bow * 12 - howl * 6, hd: sniff * (9 + Math.sin(t * 14) * 3) + bow * -6 - howl * 34, tail: Math.sin(t * (bow ? 14 : 5)) * (8 + bow * 18) - 6,
      ...legs([bow * -8, bow * -42, bow * -8, bow * -46]), ...lifts([0, 0, 0, 0]),
    };
    // A loping gallop: front and back pairs together.
    const s = Math.sin(u * TAU);
    const [dF, uF] = pawStep(u, 0, 30, 0.45, 3);
    const [dH, uH] = pawStep(u, 0.45, 30, 0.45, 3);
    const walk = {
      x: 0, lift: Math.abs(Math.sin(u * TAU)) * 2.4, tilt: Math.cos(u * TAU) * 6, hd: -6 + s * 5, tail: 16 + s * 10,
      ...legs([-dH * 2.4, -dF * 2.4, -dH * 2.4 + 6, -dF * 2.4 + 6]), ...lifts([uH, uF, uH, uF]),
    };
    // Crouched low, rump wiggling; then the pounce.
    const antic = { x: -3, lift: -2.6, tilt: 8, hd: 10, tail: Math.sin(t * 18) * 14, ...legs([24, -30, 24, -30]), ...lifts([0, 0, 0, 0]) };
    const strike = { x: 10, lift: 5, tilt: -14, hd: -6, tail: 20, ...legs([30, -70, 30, -64]), ...lifts([0, 2, 0, 2]) };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: flopped down flat, legs folded.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -5, tilt: 0, hd: 22, tail: 20, ...legs([80, -80, 80, -80]), ...lifts([0, 0, 0, 0]) });
    a.wpMood = m.hp <= 0 ? 'dizzy' : moodOf(a, howl > 0.4 ? 'shout' : bow > 0.4 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => [11, -8], rot: (S) => S.hd * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.2;
    ctx.fillStyle = '#2a4a3a';
    ctx.beginPath();
    ctx.ellipse(2, -0.5, 16, 3, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // The pounce: a few streaks behind, and a white chomp mark off its jaws as it lands.
  fx(ctx, m, a, S, mat) {
    const since = a.ph.since ?? -1;
    if (m.hp <= 0 || since < 0 || since > 0.4) return;
    const q = since / 0.4;
    const M = mat('headJ');
    const x = M[0] * 22 + M[2] * -10 + M[4];
    const y = M[1] * 22 + M[3] * -10 + M[5];
    ctx.save();
    ctx.globalAlpha = a.alpha * (1 - q);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + 4, y, 5 + q * 3, d > 0 ? 0.3 : -2.4, d > 0 ? 1.4 : -1.2);
      ctx.stroke();
    }
    for (const [yy, l] of [[-24, 10], [-16, 14]]) {
      ctx.beginPath();
      ctx.moveTo(S.x - 16, yy);
      ctx.lineTo(S.x - 16 - l * (1 - q), yy);
      ctx.stroke();
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): prowling.
export function wolfPupStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const hip = (k) => [HIPS[k][0], by + HIPS[k][1]];
  const sh = [
    ...put(tailP(), [13, 13], -11, by - 4), ...put(legP(true)(), [5, 1], ...hip('hf')), ...put(legP(true)(), [5, 1], ...hip('ff')), ...put(bodyP(), [14, 10], 0, by),
    ...put(legP(false)(), [5, 1], ...hip('hn')), ...put(legP(false)(), [5, 1], ...hip('fn')), ...put(headP(), [6, 26], 11, by - 8), ...put(faceShapes(fm, FACE), [6, 26], 11, by - 8),
    ...put(ruffP(), [8, 8], 11, by - 4),
  ];
  const ox = 24;
  const oy = 44;
  return { w: 54, h: 48, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
