// The Feather Monk, remade 2026-11-20 (the player's pick "Puffin Monk"): a puffin in saffron monk's
// robes with a string of prayer beads and its big striped beak. Live rig, outer outline only, the face
// bare, no squash.
//
// How it moves:
//   idle    a 10 s act: wings together in prayer; floating up off the ground in meditation, eyes
//           shut; a polite bow.
//   walk    a brisk shuffle, the robe swaying.
//   fight   it draws its palm back, gathering the wind (a little swirl); then pushes it out and a
//           gust rolls off it in rings.
//   hit     knocked back, beads swinging.
//   dead    it sits down hard, dizzy.
// Built in the concept's own units and drawn at K of them; the feet at y 0.

import { E, T, R, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, arcP } from './rigkit.js';

const K = 0.75;
const PUFD = '#2a2a3a';
const ROBE = '#ffb347';
const ROBED = '#e07a2a';
const FOOT = '#ff8a3a';
const pm = pairOf('pufmonk');

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
// A foot. Box 10 x 6; its top (5, 1).
const footP = () => [E(5, 2.4, 3.7, 2.1, FOOT)];
// The robe: saffron, a darker fold and sash, a string of prayer beads. Box 34 x 26; (17, 12) = (29, 47).
const robeP = () => at([
  blob([[19, 36], [39, 36], [43, 58], [14, 58]], ROBE), F(blob([[30, 37], [36, 37], [32, 58], [26, 58]], ROBED, 1)), F(R(17, 46, 25, 2.6, ROBED)),
  ...[0, 1, 2, 3, 4, 5, 6].map((k) => F(E(21 + k * 2.6, 39 + Math.sin(k * 0.9) * 1.2 + k * 0.4, 1.1, 1.1, '#8a5a3a'))),
], [29, 47], [17, 12]);
// The head: dark cap, white face, the big striped beak. Box 32 x 24; its middle (12, 12) = (30, 26).
const headP = () => at([
  E(30, 26, 10, 9.4, PUFD), F(blob([[28, 22], [35, 20], [39, 26], [36, 33], [28, 33]], '#ffffff')),
  blob([[37, 24], [47, 27.4], [47, 29.6], [37, 32]], '#ff7a3a', 1), F(T([[37, 24.6], [40, 25.6], [40, 31], [37, 31.4]], '#ffd84a')), F(taper([[42, 26.4], [42, 30.4]], 0.8, 0.8, '#e0402a')),
], [30, 26], [12, 12]);
// An arm in its wide sleeve (a lighter saffron, so it reads over the robe), a dark wingtip for a
// hand. Box 22 x 10; the shoulder (3, 4).
const armP = (far) => () => [taper([[3, 4], [14, 4.6]], 5, 4.4, far ? ROBED : '#ffc66a'), E(16, 4.6, 3, 3.2, PUFD)];
const PR = {
  FOOT: pm('foot', 10, 6, footP, 3, 3), ROBE: pm('robe', 34, 26, robeP, 3, 3), HEAD: pm('head', 32, 24, headP, 3, 3),
  ARM: [false, true].map((f) => pm(`arm${f ? 1 : 0}`, 22, 10, armP(f), 3, 3)),
};
// ---------- Its own face: a puffin's. Small calm eyes with a red-orange eye ring and the puffin's
// soft grey marks above and behind them, the lids gently lowered in meditation; it opens them wide and
// lets out a martial "kiai!" from the big beak to fight. ----------
const MDARK = '#22222e';
const MRING = '#ff6a3a';
const MMARK = '#a8a8be';
const ln = (pts, w, c = MDARK) => [F(taper(pts, w, w * 0.85, c))];
const beakOpen = (gape, tongue = false) => [
  F(T([[19.4, 14.4], [28.6, 14.6], [27.6, 15.4 + gape], [19.6, 17.4 + gape]], '#7a3040')),
  ...(tongue ? [F(E(22, 16.2 + gape, 1.6, 0.6, '#ff8fab'))] : []),
  F(T([[19.2, 16.4 + gape], [28.4, 14.8 + gape], [28, 16.2 + gape], [19.4, 18.6 + gape]], '#ff7a3a')),
];
const MEYES = [[13.6, 11.2, -1, 1], [18, 11, 1, 0.85]];
const pufFaceShapes = (mood) => {
  const out = [];
  const angry = mood === 'angry' || mood === 'shout';
  for (const [x, y, s, k] of MEYES) {
    // The puffin's marks: a little grey triangle over the eye, a line back from it.
    const tilt = angry ? 0.6 : mood === 'hurt' ? -0.5 : 0;
    out.push(F(T([[x - 0.75 * k, y - 1.75 * k + tilt * s], [x + 0.75 * k, y - 1.75 * k - tilt * s], [x + s * 0.15 * k, y - 2.8 * k]], MMARK)), ...ln([[x - s * 1.3 * k, y + 0.3 * k], [x - s * 2.6 * k, y + 0.8 * k]], 0.4 * k, MMARK));
    if (mood === 'blink' || mood === 'sleep' || mood === 'dead') out.push(...ln(arcP(x, y, 1.3 * k, 0.75 * k, 15, 165, 6), 0.55 * k));
    else if (mood === 'happy') out.push(...ln(arcP(x, y + 0.8 * k, 1.3 * k, 1.2 * k, 200, 340, 6), 0.6 * k));
    else if (mood === 'hurt') out.push(...ln([[x + s * 1.1 * k, y - 1 * k], [x - s * 0.9 * k, y], [x + s * 1.1 * k, y + 1 * k]], 0.55 * k));
    else if (mood === 'dizzy') {
      const pts = [];
      for (let i = 0; i <= 11; i++) pts.push([x + Math.cos(i * 0.9) * (0.12 + i * 0.1) * k, y + Math.sin(i * 0.9) * (0.12 + i * 0.1) * k]);
      out.push(...ln(pts, 0.38 * k, MRING));
    } else {
      // Calm: lids lowered (the eye cut level); to fight: wide open, the pupil small.
      const lid = angry ? () => -99 : (px) => y + 0.35 * k - 1.05 * k * Math.sqrt(Math.max(0, 1 - ((px - x) / (1.5 * k)) ** 2));
      const ring = Array.from({ length: 14 }, (_, i) => [x + Math.cos((i / 14) * Math.PI * 2) * 1.35 * k, y + Math.sin((i / 14) * Math.PI * 2) * 1.35 * k]).map(([px, py]) => [px, Math.max(py, lid(px))]);
      const pup = Array.from({ length: 12 }, (_, i) => [x + Math.cos((i / 12) * Math.PI * 2) * (angry ? 0.5 : 0.85) * k, y + 0.15 * k + Math.sin((i / 12) * Math.PI * 2) * (angry ? 0.55 : 0.85) * k]).map(([px, py]) => [px, Math.max(py, lid(px) + 0.15)]);
      out.push(F(T(ring, MRING)), F(T(pup, MDARK)));
      if (!angry) out.push(...ln(Array.from({ length: 7 }, (_, i) => x - 1.5 * k + (i * 3 * k) / 6).map((px) => [px, lid(px)]), 0.5 * k));
      else out.push(F(E(x + 0.35 * k, y - 0.3 * k, 0.22 * k, 0.22 * k, '#ffffff')));
    }
  }
  if (mood === 'happy') out.push(F(E(11.4, 14.8, 1.2, 0.6, '#ffb0c4')));
  if (mood === 'shout') out.push(...beakOpen(2, true));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...beakOpen(0.6));
  return out;
};
const pufFace = (mood) => faceSprite(`pufmonk|face|${mood}`, 32, 24, () => pufFaceShapes(mood));

// The robe's middle sits 16.2 above the feet; the head 21 above that.
const BODY_Y = 16.2;
const HEAD_AT = [1, -21];
// The shoulders.
const SH_N = [5, -7];
const SH_F = [-3, -7];

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (far) => ({ name: `foot${far ? 1 : 0}${tag}`, parent: 'bodyJ', s: PR.FOOT[i], pivot: [5, 1], at: (S) => [far ? -5 : 4, 12.6 - S[far ? 'yF' : 'yN'] + S.float], rot: (S) => (S[far ? 'lF' : 'lN'] - S.tilt) * D2R });
  return [
    { name: `armF${tag}`, parent: 'bodyJ', s: PR.ARM[1][i], pivot: [3, 4], at: () => SH_F, rot: (S) => S.aF * D2R },
    foot(true),
    foot(false),
    { name: `robe${tag}`, parent: 'bodyJ', s: PR.ROBE[i], pivot: [17, 12] },
    { name: `head${tag}`, parent: 'headJ', s: PR.HEAD[i], pivot: [12, 12] },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => pufFace(MOODS.has(a.pmMood) ? a.pmMood : 'idle'), pivot: [12, 12] }] : []),
    { name: `armN${tag}`, parent: 'bodyJ', s: PR.ARM[0][i], pivot: [3, 4], at: () => SH_N, rot: (S) => S.aN * D2R },
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

export const puffinMonkRig = sized(makeRig({
  w: 100, h: 76, soft: true, stride: 18, recover: 0.6,
  springs: {
    x: [240, 18], lift: [200, 14], float: [60, 10], tilt: [180, 12], hr: [160, 11], aN: [220, 14], aF: [220, 14],
    lN: [340, 21], lF: [340, 21], yN: [400, 24], yF: [400, 24],
  },
  fast: ['x', 'aN', 'lN', 'lF', 'yN', 'yF'],
  kick: { tilt: -150, hr: -160 },
  turnKick: { tilt: 100 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.93;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'pufmonk', 18);
    const calm = a.calm ?? 1;
    const lu = t % 10;
    // Its act: wings together in prayer; floating up in meditation, eyes shut; a polite bow.
    const float = hold(lu, 1.8, 2.6, 5, 5.8) * calm;
    const bow = hold(lu, 7.2, 7.6, 8.2, 8.6) * calm;
    const br = Math.sin(t * 1.4);
    const idle = {
      x: 0, lift: (br + 1) * 0.3 + float * (5 + br * 1.4), float: float * 3, tilt: bow * 24 + br * 0.8, hr: bow * 10 + Math.sin(t * 0.7) * 2 * (1 - float),
      aN: -58 + br * 3, aF: -30 - br * 3, lN: float * -26, lF: float * 30, yN: 0, yF: 0,
    };
    // A brisk shuffle.
    const s = Math.sin(u * TAU);
    const [dxN, upN] = pawStep(u, 0, 18, 0.6, 1.8);
    const [dxF, upF] = pawStep(u, 0.5, 18, 0.6, 1.8);
    const walk = { x: 0, lift: Math.abs(Math.cos(u * TAU)) * 1.2, float: 0, tilt: 4 + s * 3, hr: -2, aN: 20 + s * 24, aF: 20 - s * 24, lN: -dxN * 2.6, lF: -dxF * 2.6, yN: upN, yF: upF };
    // The palm drawn back, gathering wind; then pushed out.
    const antic = { x: -2, lift: -1, float: 0, tilt: -6, hr: -6, aN: 200, aF: -50, lN: 8, lF: -8, yN: 0, yF: 0 };
    const strike = { x: 4, lift: 0, float: 0, tilt: 8, hr: 6, aN: -6, aF: 40, lN: -14, lF: 12, yN: 0, yF: 0 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: sat down hard.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -1, float: 0, tilt: -10, hr: 12, aN: 50, aF: 60, lN: -40, lF: 36, yN: 0, yF: 0 });
    a.pmMood = m.hp <= 0 ? 'dizzy' : moodOf(a, float > 0.4 ? 'sleep' : bow > 0.4 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => HEAD_AT, rot: (S) => (S.hr - S.tilt * 0.3) * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a, S) {
    ctx.globalAlpha = a.alpha * clamp(0.22 - (S.lift ?? 0) * 0.012, 0.08, 0.22);
    ctx.fillStyle = '#2a4a7a';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 13, 2.8, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // The wind: a little swirl gathering at the drawn-back palm; rings of gust rolling off the push.
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const M = mat('bodyJ');
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    if (a.ph.antic > 0.2) {
      const [cx, cy] = at2(M, -6, -12);
      ctx.globalAlpha = a.alpha * a.ph.antic * 0.9;
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 2; k++) {
        const r = 4 + k * 3;
        const s0 = a.now * 9 + k * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, s0, s0 + 2.2);
        ctx.stroke();
      }
    }
    const since = a.ph.since ?? -1;
    if (since >= 0 && since < 0.6) {
      const [hx, hy] = at2(M, SH_N[0] + 18, SH_N[1] + 1);
      for (let k = 0; k < 3; k++) {
        const q = clamp((since - k * 0.06) / 0.5, 0, 1);
        if (q <= 0) continue;
        ctx.globalAlpha = a.alpha * (1 - q);
        ctx.lineWidth = 2.8 - k * 0.5;
        ctx.beginPath();
        ctx.ellipse(hx + 4 + q * 30 + k * 5, hy, 4 + q * 6, 8 + q * 10, 0, -1.15, 1.15);
        ctx.stroke();
      }
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): wings together in prayer.
export function puffinMonkStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const head = [HEAD_AT[0], by + HEAD_AT[1]];
  const sh = [
    ...put(armP(true)(), [3, 4], SH_F[0], by + SH_F[1], -30), ...put(footP(), [5, 1], -5, by + 12.6), ...put(footP(), [5, 1], 4, by + 12.6), ...put(robeP(), [17, 12], 0, by),
    ...put(headP(), [12, 12], head[0], head[1]), ...put(pufFaceShapes(fm), [12, 12], head[0], head[1]), ...put(armP(false)(), [3, 4], SH_N[0], by + SH_N[1], -58),
  ];
  const ox = 22;
  const oy = 46;
  return { w: 50, h: 50, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
