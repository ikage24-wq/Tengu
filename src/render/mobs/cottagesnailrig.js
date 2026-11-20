// The Bud Snail, remade 2026-11-20 (the player's pick "Mushroom Cottage"): Petal Meadow's sleepy
// lavender snail, whose shell is a little cottage: a round cream wall with a wooden door and a lit
// window, a red-and-white mushroom roof and a chimney that puffs smoke. Live rig, outer outline
// only, the face bare, no squash.
//
// How it moves:
//   idle    a 10 s act: drowsing, its feelers waving; a big yawn; nodding off (a "z" floats up)
//           and waking with a start; the chimney puffing now and then.
//   walk    gliding along, the head bobbing, the cottage rocking, the feelers trailing.
//   fight   it draws its head back, the cottage leaning; then bonks you with its head, the
//           chimney puffing hard.
//   hit     rocked, the feelers flicking.
//   dead    its head flops down on the grass, the cottage tipped, dizzy.
// Built in the concept's own units and drawn at K of them; the foot on y 0.

import { E, T, R, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, stepPhase, put, shift, MOODS, moodOf, arcP } from './rigkit.js';

const K = 0.66;
const LAV = '#efe2fa';
const LAVD = '#d8c8ec';
const ROOF = '#ff6a6a';
const cs = pairOf('cotsnail');

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
// The foot, the long soft body it glides on. Box 54 x 13; the middle of its sole (27, 11) = (33, 63).
const footP = () => at([blob([[8, 63], [14, 58], [40, 57], [48, 53], [52, 58], [58, 63]], LAV), F(blob([[12, 62], [40, 60], [54, 62]], LAVD))], [33, 63], [27, 11]);
// The neck and head. Box 20 x 23; the neck's root (6, 19) = (45, 57).
const headP = () => at([taper([[44, 58], [49, 50]], 10, 9, LAV), E(50, 46, 8, 7.6, LAV)], [45, 57], [6, 19]);
// A feeler with its pink tip. Box 6 x 10; its root (3, 8).
const feelerP = () => [taper([[3, 8], [3, 2.6]], 1.6, 1.4, LAV), E(3, 2.2, 1.6, 1.6, '#ffb0c8')];
// The cottage: the round wall, the door, the lit window, the mushroom roof, the chimney. Box 38 x 42;
// where it sits on the foot (19, 40) = (29, 58).
const houseP = () => at([
  R(34, 21, 4, 8, '#b8a090'), F(R(34, 21, 4, 1.4, '#9a8070')),
  E(29, 47, 14, 12, '#fff4e0'), F(T([[36, 38], [42, 42], [42.6, 52], [38, 56]], '#f0e0c8')),
  blob([[24, 58.6], [24, 50], [26, 46.6], [30, 46.6], [32, 50], [32, 58.6]], '#a0704a'), F(E(30.4, 53, 0.6, 0.6, '#f2c860')),
  E(37.6, 48, 2.6, 2.6, '#7a5a3a'), F(E(37.6, 48, 2, 2, '#ffe27a')), F(taper([[35.6, 48], [39.6, 48]], 0.5, 0.5, '#7a5a3a')), F(taper([[37.6, 46], [37.6, 50]], 0.5, 0.5, '#7a5a3a')),
  blob([[11, 40], [14, 30], [24, 24], [36, 24], [45, 30], [47, 40], [38, 37], [20, 37]], ROOF, 2), F(blob([[16, 33], [22, 27], [28, 26], [22, 31]], '#ff9a9a', 2)),
  ...[[22, 31, 2.2], [32, 28, 2.6], [41, 33, 1.8], [16, 36, 1.4], [29, 34.4, 1.4]].map(([x, y, r]) => F(E(x, y, r, r * 0.8, '#ffffff'))),
], [29, 58], [19, 40]);
const PR = {
  FOOT: cs('foot', 54, 13, footP, 3, 3), HEAD: cs('head', 20, 23, headP, 3, 3), FEELER: cs('feeler', 6, 10, feelerP, 3, 3), HOUSE: cs('house', 38, 42, houseP, 3, 3),
};

// ---------- Its own face: drowsy half-moon eyes, the lids drooping at the outer corners; a tiny
// yawning "o"; sleepy pink cheeks. It squints happily to bonk, and nods off with a "z". ----------
const SINK = '#4a3050';
const SEYES = [[8.2, 7.4, -1], [14.2, 7.2, 1]];
const snailFaceShapes = (mood) => {
  const out = [];
  for (const [x, y, s] of SEYES) {
    if (mood === 'blink' || mood === 'sleep' || mood === 'dead') out.push(...ln(arcP(x, y + 0.2, 1.8, 1.1, 15, 165, 6), 0.65, SINK));
    else if (mood === 'happy' || mood === 'shout') out.push(...ln(arcP(x, y + 1, 1.8, 1.6, 200, 340, 6), 0.7, SINK));
    else if (mood === 'hurt') out.push(...ln([[x + s * 1.5, y - 1.3], [x - s * 1.1, y], [x + s * 1.5, y + 1.3]], 0.65, SINK), F(E(x - s * 0.2, y + 2.4, 0.45, 0.7, '#9ad8ff')));
    else if (mood === 'dizzy') {
      const pts = [];
      for (let i = 0; i <= 11; i++) pts.push([x + Math.cos(i * 0.9 * s) * (0.12 + i * 0.12), y + Math.sin(i * 0.9 * s) * (0.12 + i * 0.12)]);
      out.push(...ln(pts, 0.45, SINK));
    } else {
      // Drowsy: lids drooping to the outer corners; cross: lids dropped to the middle.
      const lid = mood === 'angry' ? (px) => y - 0.9 + (px - x) * -s * 0.45 : (px) => y - 0.6 + (px - x) * s * 0.35;
      out.push(F(T(ring(x, y + 0.2, 1.9, 2, 14).map(([px, py]) => [px, Math.max(py, lid(px))]), SINK)), ...ln([[x - 2.1, lid(x - 2.1)], [x + 2.1, lid(x + 2.1)]], 0.7, SINK), F(E(x + 0.5, y + 1, 0.45, 0.45, '#ffffff')));
    }
  }
  const [mx, my] = [11.4, 11];
  if (mood === 'shout') out.push(F(T(arcP(mx, my - 0.8, 2, 1.8, 0, 180, 8), '#8a3040')));
  else if (mood === 'happy') out.push(...ln(arcP(mx, my - 0.6, 1.4, 1, 20, 160, 6), 0.5, '#8a3040'));
  else if (mood === 'angry') out.push(...ln([[mx - 1.1, my + 0.3], [mx, my - 0.3], [mx + 1.1, my + 0.3]], 0.45, '#8a3040'));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...ln([[mx - 1.1, my + 0.2], [mx - 0.35, my - 0.2], [mx + 0.35, my + 0.2], [mx + 1.1, my - 0.2]], 0.4, '#8a3040'));
  else if (mood === 'dead' || mood === 'sleep') out.push(F(E(mx, my, 0.55, 0.6, '#8a3040')));
  else out.push(F(E(mx, my, 0.8, 1, '#8a3040')));
  if (mood !== 'dead') out.push(F(E(6, 10.4, 1.5, 0.8, '#ffb8d0')), F(E(17, 10, 1.2, 0.7, '#ffb8d0')));
  return out;
};
const snailFace = (mood) => faceSprite(`cotsnail|face|${mood}`, 20, 23, () => snailFaceShapes(mood));

// Where the parts hang off the foot (its sole's middle on the ground).
const NECK = [12, -6];
const HOUSE = [-4, -5];
const FEELER_L = [3, -16.4];
const FEELER_R = [8, -16.6];

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `foot${tag}`, parent: 'footJ', s: PR.FOOT[i], pivot: [27, 11] },
    { name: `feelerL${tag}`, parent: 'headJ', s: PR.FEELER[i], pivot: [3, 8], at: () => FEELER_L, rot: (S) => (S.fL - 14) * D2R },
    { name: `feelerR${tag}`, parent: 'headJ', s: PR.FEELER[i], pivot: [3, 8], at: () => FEELER_R, rot: (S) => (S.fR + 8) * D2R },
    { name: `head${tag}`, parent: 'headJ', s: PR.HEAD[i], pivot: [6, 19] },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => snailFace(MOODS.has(a.csMood) ? a.csMood : 'idle'), pivot: [6, 19] }] : []),
    { name: `house${tag}`, parent: 'houseJ', s: PR.HOUSE[i], pivot: [19, 40] },
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

export const cottageSnailRig = sized(makeRig({
  w: 100, h: 80, soft: true, stride: 12, recover: 0.6,
  springs: { x: [200, 18], lift: [300, 18], hr: [160, 12], hx: [200, 16], hs: [150, 10], fL: [110, 6], fR: [110, 6], puff: [80, 12] },
  fast: ['x', 'hr', 'hx'],
  kick: { hs: -160, hr: -200, fL: 500, fR: -500 },
  turnKick: { hs: 120, fL: 260, fR: -260 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.97;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'cotsnail', 12);
    const calm = a.calm ?? 1;
    const lu = t % 10;
    // Its act: a big yawn; nodding off and waking with a start; puffs from the chimney.
    const yawn = hold(lu, 1, 1.4, 2.4, 2.8) * calm;
    const doze = hold(lu, 4.6, 5.4, 7.2, 7.4) * calm;
    const start = hold(lu, 7.4, 7.5, 7.8, 8.2) * calm;
    const br = Math.sin(t * 1.4);
    const idle = {
      x: 0, lift: 0, hr: -yawn * 12 + doze * 16 - start * 8 + br * 1.4, hx: 0, hs: br * 1.2 + doze * 2, fL: Math.sin(t * 1.9) * 8 - doze * 20 + start * 30, fR: Math.sin(t * 2.3 + 1) * 8 - doze * 22 - start * 30, puff: hold(lu, 0.2, 0.4, 0.8, 1.4) + hold(lu, 8.6, 8.8, 9.2, 9.8),
    };
    // Gliding along, the head bobbing, the cottage rocking.
    const s = Math.sin(u * TAU);
    const walk = { x: 0, lift: 0, hr: s * 3, hx: Math.max(0, s) * 1.2, hs: s * 2.4, fL: -18 + s * 6, fR: -14 + s * 6, puff: 0.3 };
    // Head drawn back, the cottage leaning; then the bonk.
    const antic = { x: -1.5, lift: 0, hr: -22, hx: -2, hs: -5, fL: -24, fR: -26, puff: 0 };
    const strike = { x: 2, lift: 0, hr: 16, hx: 4, hs: 4, fL: -30, fR: -34, puff: 1 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: the head flopped down on the grass, the cottage tipped.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: 0, hr: 34, hx: 1, hs: -8, fL: 40, fR: 50, puff: 0 });
    a.csMood = m.hp <= 0 ? 'dizzy' : doze > 0.5 ? 'sleep' : moodOf(a, yawn > 0.4 ? 'shout' : start > 0.4 ? 'hurt' : null);
    a.csDoze = doze;
    return S;
  },
  parts: [
    { name: 'footJ', parent: null, at: (S) => [S.x, -S.lift] },
    { name: 'headJ', parent: 'footJ', at: (S) => [NECK[0] + S.hx, NECK[1]], rot: (S) => S.hr * D2R },
    { name: 'houseJ', parent: 'footJ', at: () => HOUSE, rot: (S) => S.hs * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.2;
    ctx.fillStyle = '#3a5a2a';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 24, 3, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // Chimney smoke, puffing now and then; a "z" floating up when it dozes; a sparkle off the bonk.
  fx(ctx, m, a, S, mat) {
    const H = mat('houseJ');
    const t = a.now + (m.uid % 7) * 0.53;
    ctx.save();
    const [cx, cy] = at2(H, 7, -40);
    const n = m.hp > 0 ? 2 + Math.round(clamp(S.puff, 0, 1) * 2) : 0;
    for (let k = 0; k < n; k++) {
      const p = (t * 0.45 + k / n) % 1;
      ctx.globalAlpha = a.alpha * 0.75 * (1 - p);
      ctx.fillStyle = '#f4f0ff';
      ctx.beginPath();
      ctx.arc(cx + Math.sin(p * 5 + k) * 1.6 + p * 3, cy - p * 16, 1.6 + p * 2.6, 0, TAU);
      ctx.fill();
    }
    if (a.csDoze > 0.3 && m.hp > 0) {
      const J = mat('headJ');
      const p = (t * 0.6) % 1;
      const [zx, zy] = at2(J, 12 + p * 4, -26 - p * 10);
      ctx.globalAlpha = a.alpha * a.csDoze * (1 - p);
      ctx.strokeStyle = '#7a5aa8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(zx - 2, zy - 2);
      ctx.lineTo(zx + 2, zy - 2);
      ctx.lineTo(zx - 2, zy + 2);
      ctx.lineTo(zx + 2, zy + 2);
      ctx.stroke();
    }
    const since = a.ph.since ?? -1;
    if (since >= 0 && since < 0.4 && m.hp > 0) {
      const p = since / 0.4;
      const J = mat('headJ');
      const [bx, by] = at2(J, 16, -12);
      const r = 4 * (1 - p * 0.4);
      ctx.globalAlpha = a.alpha * (1 - p);
      ctx.fillStyle = '#fff6a8';
      ctx.beginPath();
      ctx.moveTo(bx + p * 4, by - r);
      ctx.quadraticCurveTo(bx + p * 4, by, bx + p * 4 + r, by);
      ctx.quadraticCurveTo(bx + p * 4, by, bx + p * 4, by + r);
      ctx.quadraticCurveTo(bx + p * 4, by, bx + p * 4 - r, by);
      ctx.quadraticCurveTo(bx + p * 4, by, bx + p * 4, by - r);
      ctx.fill();
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): drowsing.
export function cottageSnailStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const hx = NECK[0];
  const hy = NECK[1];
  const sh = [
    ...put(footP(), [27, 11], 0, 0), ...put(feelerP(), [3, 8], hx + FEELER_L[0], hy + FEELER_L[1], -14), ...put(feelerP(), [3, 8], hx + FEELER_R[0], hy + FEELER_R[1], 8),
    ...put(headP(), [6, 19], hx, hy), ...put(snailFaceShapes(fm), [6, 19], hx, hy), ...put(houseP(), [19, 40], HOUSE[0], HOUSE[1]),
  ];
  const ox = 22;
  const oy = 34;
  return { w: 44, h: 38, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
