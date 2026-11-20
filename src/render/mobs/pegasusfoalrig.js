// The Pegasus Foal, remade 2026-11-20 (the player's pick "Chibi Pegasus"): a cream foal with a big
// head, a pink-blue-lilac mane and tail, little white wings and fluffy cloud hooves. Four-legged, done
// chibi (a big head, short legs that read, no loaf). Live rig, outer outline only, the face bare, no
// squash.
//
// How it moves:
//   idle    a 9 s act: grazing (the head dipping down to nibble), the tail swishing, wings
//           fluttering; a happy little hop; a shake of the mane.
//   walk    a bouncy trot on diagonal pairs, the wings fluttering, the head bobbing.
//   fight   it rears up, wings spread high; then kicks out with its front hooves in a twinkle.
//   hit     knocked back, the wings flapping.
//   dead    it lies down with its legs folded, head down, dizzy.
// Built in the concept's own units and drawn at K of them; the hooves at y 0.

import { E, T, R, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, arcP } from './rigkit.js';

const K = 0.85;
const CREAM = '#fff4ec';
const CREAMD = '#f2e0d4';
const MANE = ['#ffb4d0', '#a8c8ff', '#d4b8ff'];
const pf = pairOf('pegfoal');

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
const puffHoof = (x, y) => [E(x, y, 3.6, 2.4, '#ffffff'), E(x - 2, y - 1, 2.2, 1.8, '#ffffff'), E(x + 2, y - 1, 2.2, 1.8, '#ffffff')];

// ---------- Parts ----------
// The tail, three locks. Box 16 x 18; its root (13, 4) = (16, 41).
const tailP = () => at(MANE.map((c, i) => taper([[16, 40 + i * 1.6], [8, 38 + i * 3], [6, 46 + i * 2.4]], 4.4 - i * 0.6, 2.4, c)), [16, 41], [13, 4]);
// A leg with its cloud hoof. Box 10 x 14; the hip (5, 1).
const legP = (far) => () => [R(2.8, 1, 4.4, 8.6, far ? CREAMD : CREAM), ...puffHoof(5, 10.6)];
// The body. Box 32 x 20; its middle (16, 10) = (28, 45).
const bodyP = () => at([E(28, 45, 14, 8.6, CREAM), F(E(25, 41, 7, 2.4, '#ffffff'))], [28, 45], [16, 10]);
// A wing, white, tipped with blue. Box 22 x 12; its root (2, 7).
const wingP = (len, c, tip) => () => at([
  blob([[0, 0], [len * 0.4, -len * 0.3], [len, -len * 0.18], [len * 0.9, len * 0.12], [len * 0.5, len * 0.2], [0, 3]], c),
  F(blob([[len * 0.62, -len * 0.22], [len, -len * 0.18], [len * 0.9, len * 0.1], [len * 0.66, len * 0.06]], tip, 1)),
], [0, 0], [2, 7]);
// The neck and the big head with its mane. Box 32 x 36; the neck's base (6, 30) = (38, 42).
const headP = () => at([
  taper([[36, 44], [41, 37], [44, 32]], 9, 8, CREAM), T([[42, 22], [43, 13], [47.6, 20]], CREAM), F(T([[43, 20.6], [43.6, 15.6], [46.2, 20]], '#ffd0e2')),
  E(47, 29, 10, 9, CREAM), E(53.6, 33.4, 5.6, 4.4, '#ffe8f0'), F(E(56.6, 32.4, 0.8, 0.6, '#c8909a')),
  ...MANE.map((c, i) => blob([[39 + i * 3, 22 + i * 4], [45 + i * 2, 19 + i * 4], [44 + i * 2, 25 + i * 4], [38 + i * 3, 29 + i * 4]], c, 1)),
  F(blob([[44, 19], [49, 20], [47, 24], [43, 23]], MANE[1], 1)),
], [38, 42], [6, 30]);
const PR = {
  TAIL: pf('tail', 16, 18, tailP, 3, 3), LEG: [false, true].map((f) => pf(`leg${f ? 1 : 0}`, 10, 14, legP(f), 3)), BODY: pf('body', 32, 20, bodyP, 3, 3),
  WINGF: pf('wingF', 22, 12, wingP(17, '#ffffff', '#a8c8ff'), 3, 3), WINGN: pf('wingN', 22, 12, wingP(15, '#f4f8ff', '#8ab4f8'), 3, 3), HEAD: pf('head', 32, 36, headP, 3, 3),
};
// ---------- Its own face (side on): one big dreamy pony eye, its iris fading pink to blue like the
// mane, a sweep of lashes, and a sweet little smile on the muzzle; its nostril flares to huff. ----------
const GDARK = '#2e2448';
const ln = (pts, w, c = GDARK) => [F(taper(pts, w, w * 0.85, c))];
const plash = (x, y, up = 1) => [...ln([[x + 1.7, y - 1.6 * up], [x + 2.8, y - 2.6 * up]], 0.5), ...ln([[x + 0.9, y - 2.2 * up], [x + 1.6, y - 3.2 * up]], 0.45), ...ln([[x + 0.1, y - 2.5 * up], [x + 0.4, y - 3.5 * up]], 0.4)];
const PE = [18, 16.2];
const pegFaceShapes = (mood) => {
  const out = [];
  const [x, y] = PE;
  const angry = mood === 'angry';
  if (mood === 'blink' || mood === 'sleep' || mood === 'dead') out.push(...ln(arcP(x, y, 2, 1.1, 15, 165, 8), 0.75), ...ln([[x + 1.8, y + 0.5], [x + 2.6, y + 1.2]], 0.45), ...ln([[x + 0.8, y + 1], [x + 1.1, y + 1.9]], 0.4));
  else if (mood === 'happy') out.push(...ln(arcP(x, y + 1.1, 2, 1.8, 200, 340, 8), 0.8), ...plash(x, y + 1.2));
  else if (mood === 'hurt') out.push(...ln([[x - 1.6, y - 1.5], [x + 1.3, y], [x - 1.6, y + 1.5]], 0.75), F(E(x - 0.6, y + 2.6, 0.5, 0.8, '#9ad8ff')));
  else if (mood === 'dizzy') {
    const pts = [];
    for (let i = 0; i <= 13; i++) pts.push([x + Math.cos(i * 0.85) * (0.15 + i * 0.13), y + Math.sin(i * 0.85) * (0.15 + i * 0.13)]);
    out.push(...ln(pts, 0.5, '#8a6ad0'));
  } else {
    const wide = mood === 'shout' ? 1.1 : 1;
    let eye = Array.from({ length: 18 }, (_, i) => [x + Math.cos((i / 18) * Math.PI * 2) * 2 * wide, y + Math.sin((i / 18) * Math.PI * 2) * 2.6 * wide]);
    let top = Array.from({ length: 14 }, (_, i) => [x + 0.1 + Math.cos((i / 14) * Math.PI * 2) * 1.5, y + 0.2 + Math.sin((i / 14) * Math.PI * 2) * 1.9]);
    if (angry) {
      eye = eye.map(([px, py]) => [px, Math.max(py, y - 1.2 + (px - x) * 0.5)]);
      top = top.map(([px, py]) => [px, Math.max(py, y - 0.9 + (px - x) * 0.5)]);
    }
    // The iris: pink over blue, like the mane.
    out.push(F(T(eye, GDARK)), F(T(top, '#f0a0d0')), F(T(top.map(([px, py]) => [px, Math.max(py, y + 0.5)]), '#8ab4f8')));
    out.push(F(E(x + 0.1, y + 0.3, mood === 'shout' ? 0.45 : 0.75, mood === 'shout' ? 0.6 : 1, GDARK)));
    if (!angry) out.push(F(E(x + 0.6, y - 0.9, 0.65, 0.65, '#ffffff')), F(E(x - 0.6, y + 1.3, 0.3, 0.3, '#ffffff')));
    out.push(...ln(angry ? [[x - 2.2, y - 2.2], [x + 2.3, y - 0.1]] : arcP(x, y + 0.1, 2.15, 2.75, 200, 345, 8), 0.7));
    if (!angry) out.push(...plash(x, y + 0.3));
  }
  // The muzzle: the nostril (flared to huff) and the mouth.
  const [mx, my] = [23.2, 24.2];
  if (angry || mood === 'shout') out.push(F(E(24.5, 20.4, 0.9, 0.7, '#c8909a')));
  if (mood === 'happy') out.push(F(T(arcP(mx, my - 0.4, 1.4, 1.3, 0, 180, 8), '#a8506a')));
  else if (mood === 'shout') out.push(F(E(mx, my + 0.3, 1.1, 1.3, '#a8506a')), F(E(mx, my + 0.9, 0.6, 0.4, '#ff8fab')));
  else if (angry) out.push(...ln([[mx - 1.2, my + 0.3], [mx, my - 0.2], [mx + 1.2, my + 0.3]], 0.4, '#a8506a'));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...ln([[mx - 1.1, my + 0.3], [mx - 0.4, my - 0.1], [mx + 0.4, my + 0.3], [mx + 1.1, my - 0.1]], 0.38, '#a8506a'));
  else if (mood === 'dead') out.push(F(E(mx, my, 0.5, 0.55, '#a8506a')));
  else out.push(...ln(arcP(mx, my - 0.6, 1.3, 0.9, 20, 160, 8), 0.4, '#a8506a'));
  return out;
};
const pegFace = (mood) => faceSprite(`pegfoal|face|${mood}`, 32, 36, () => pegFaceShapes(mood));

// The body's middle sits 15 above the hooves; the hips 3 below it.
const BODY_Y = 15;
const HIPS = { hf: [-7.8, 3], ff: [8.2, 3], hn: [-3.8, 3], fn: [12.2, 3] };

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (k, far) => ({ name: `leg_${k}${tag}`, parent: 'bodyJ', s: PR.LEG[far ? 1 : 0][i], pivot: [5, 1], at: (S) => [HIPS[k][0], HIPS[k][1] - S[`y_${k}`]], rot: (S) => (S[`l_${k}`] - S.tilt) * D2R });
  return [
    { name: `tail${tag}`, parent: 'bodyJ', s: PR.TAIL[i], pivot: [13, 4], at: () => [-12, -4], rot: (S) => S.tail * D2R },
    leg('hf', true),
    leg('ff', true),
    { name: `wingF${tag}`, parent: 'bodyJ', s: PR.WINGF[i], pivot: [2, 7], at: () => [-4, -6], rot: (S) => (-150 + S.wg) * D2R },
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [16, 10] },
    leg('hn', false),
    leg('fn', false),
    { name: `head${tag}`, parent: 'headJ', s: PR.HEAD[i], pivot: [6, 30] },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => pegFace(MOODS.has(a.pfMood) ? a.pfMood : 'idle'), pivot: [6, 30] }] : []),
    { name: `wingN${tag}`, parent: 'bodyJ', s: PR.WINGN[i], pivot: [2, 7], at: () => [2, -6], rot: (S) => (-128 + S.wg * 1.1) * D2R },
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
const legs = (v) => ({ l_hf: v[0], l_ff: v[1], l_hn: v[2], l_fn: v[3] });
const lifts = (v) => ({ y_hf: v[0], y_ff: v[1], y_hn: v[2], y_fn: v[3] });

export const pegasusFoalRig = sized(makeRig({
  w: 90, h: 76, soft: true, stride: 18, recover: 0.6,
  springs: {
    x: [240, 18], lift: [280, 16], tilt: [180, 13], hd: [140, 11], tail: [110, 7], wg: [260, 12],
    l_hf: [340, 21], l_ff: [340, 21], l_hn: [340, 21], l_fn: [340, 21], y_hf: [400, 24], y_ff: [400, 24], y_hn: [400, 24], y_fn: [400, 24],
  },
  fast: ['x', 'lift', 'tilt', 'l_ff', 'l_fn', 'y_ff', 'y_fn'],
  kick: { tilt: -140, wg: 600, hd: -160 },
  turnKick: { tilt: 100, tail: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.79;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'pegfoal', 18);
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: grazing; a happy hop; a shake of the mane.
    const graze = hold(lu, 1, 1.6, 3.6, 4.2) * calm;
    const hop = hold(lu, 5, 5.15, 5.5, 5.8) * calm;
    const shake = hold(lu, 7, 7.2, 7.8, 8) * calm;
    const br = Math.sin(t * 1.5);
    const idle = {
      x: 0, lift: (br + 1) * 0.2 + hop * 5, tilt: br * 0.8 + shake * Math.sin(t * 22) * 3, hd: graze * (34 + Math.sin(t * 9) * 3) + shake * Math.sin(t * 22) * 10, tail: Math.sin(t * 2) * 12,
      wg: Math.sin(t * 3) * 6 + hop * -40 + Math.sin(t * 16) * 14 * hop, ...legs([0, 0, 0, 0]), ...lifts([0, 0, 0, 0]),
    };
    // A bouncy trot on diagonal pairs.
    const s = Math.sin(u * TAU);
    const st = (ph) => pawStep(u, ph, 18, 0.55, 2.6);
    const [dHF, uHF] = st(0.5);
    const [dFF, uFF] = st(0);
    const [dHN, uHN] = st(0);
    const [dFN, uFN] = st(0.5);
    const walk = {
      x: 0, lift: Math.abs(Math.cos(u * TAU)) * 1.8, tilt: s * 2, hd: -4 + s * 6, tail: 10 + s * 14, wg: Math.sin(u * TAU * 2) * 18,
      ...legs([-dHF * 2.6, -dFF * 2.6, -dHN * 2.6, -dFN * 2.6]), ...lifts([uHF, uFF, uHN, uFN]),
    };
    // Rearing up, wings high; then the kick with both front hooves.
    const antic = { x: -2, lift: 5, tilt: -22, hd: -10, tail: 20, wg: -60, ...legs([18, 50, 18, 60]), ...lifts([0, 2, 0, 2]) };
    const strike = { x: 4, lift: 3, tilt: -12, hd: 6, tail: -10, wg: -30, ...legs([10, -60, 10, -50]), ...lifts([0, 0, 0, 0]) };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: lying down, legs folded, head down.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -5, tilt: 0, hd: 30, tail: 30, wg: 50, ...legs([80, -80, 80, -80]), ...lifts([0, 0, 0, 0]) });
    a.pfMood = m.hp <= 0 ? 'dizzy' : moodOf(a, hop > 0.4 || shake > 0.4 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => [10, -3], rot: (S) => S.hd * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.2;
    ctx.fillStyle = '#4a6a9a';
    ctx.beginPath();
    ctx.ellipse(2, -0.5, 17, 3, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // The kick: a twinkle of four-pointed sparkles off the front hooves.
  fx(ctx, m, a, S, mat) {
    const since = a.ph.since ?? -1;
    if (m.hp <= 0 || since < 0 || since > 0.5) return;
    const q = since / 0.5;
    const [hx, hy] = at2(mat('bodyJ'), 22, 6);
    ctx.save();
    ctx.fillStyle = '#ffffff';
    for (const [dx, dy, r] of [[6, -4, 3], [10, 3, 2.4], [3, 6, 2]]) {
      ctx.globalAlpha = a.alpha * (1 - q);
      const x = hx + dx + q * 8;
      const y = hy + dy - q * 3;
      const rr = r * (0.6 + q * 0.6);
      ctx.beginPath();
      ctx.moveTo(x, y - rr);
      ctx.quadraticCurveTo(x, y, x + rr, y);
      ctx.quadraticCurveTo(x, y, x, y + rr);
      ctx.quadraticCurveTo(x, y, x - rr, y);
      ctx.quadraticCurveTo(x, y, x, y - rr);
      ctx.fill();
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): standing.
export function pegasusFoalStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const hip = (k) => [HIPS[k][0], by + HIPS[k][1]];
  const sh = [
    ...put(tailP(), [13, 4], -12, by - 4), ...put(legP(true)(), [5, 1], ...hip('hf')), ...put(legP(true)(), [5, 1], ...hip('ff')), ...put(wingP(17, '#ffffff', '#a8c8ff')(), [2, 7], -4, by - 6, -150),
    ...put(bodyP(), [16, 10], 0, by), ...put(legP(false)(), [5, 1], ...hip('hn')), ...put(legP(false)(), [5, 1], ...hip('fn')),
    ...put(headP(), [6, 30], 10, by - 3), ...put(pegFaceShapes(fm), [6, 30], 10, by - 3), ...put(wingP(15, '#f4f8ff', '#8ab4f8')(), [2, 7], 2, by - 6, -128),
  ];
  const ox = 28;
  const oy = 46;
  return { w: 60, h: 50, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
