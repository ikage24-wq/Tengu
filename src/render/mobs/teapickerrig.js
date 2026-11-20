// The Tanuki Picker, remade 2026-11-20 (the player's pick "Tea Picker"): a round tanuki in a straw
// cone hat with its shapeshifting leaf tucked in the band, a wicker basket of fresh tea on its back
// and a pair of tea shears. Live rig, outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    a 9 s act: snipping at the tea bushes (bending to them, the shears going); tossing a
//           sprig back over its shoulder into the basket; fanning itself with a paw.
//   walk    a round little waddle, the basket bobbing, the tail swinging.
//   fight   shears up and open; then snip-snip at you, tea leaves flying.
//   hit     knocked back, the hat bouncing, the leaf fluttering loose a moment.
//   dead    it sits down hard, the hat tipped over its eyes, dizzy.
// Built in the concept's own units and drawn at K of them; the feet at y 0.

import { E, T, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, INK } from './rigkit.js';

const K = 0.72;
const TFUR = '#d9a476';
const TFURD = '#b47e58';
const TMASK = '#8f6650';
const TCREAM = '#fff0dc';
const LEAF = '#8fd07a';
const LEAFD = '#5aa84a';
const tp = pairOf('teapick');

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
const leaf = (x, y, s, deg, c = LEAF) => put([blob([[0, 0], [s * 0.5, -s * 0.36], [s, 0], [s * 0.5, s * 0.36]], c, 1), F(taper([[0, 0], [s * 0.86, 0]], 0.5, 0.3, LEAFD))], [0, 0], x, y, deg);

// ---------- Parts ----------
// The striped tail. Box 14 x 14; its root (12, 12).
const tailP = () => at([taper([[0, 0], [-6, -3], [-9, -9]], 6, 4.2, TFUR), F(taper([[-3.4, -1.6], [-4.6, -2.4]], 4.4, 4.2, TMASK)), F(taper([[-7.4, -6], [-8.2, -7.4]], 3.8, 3.4, TMASK))], [0, 0], [12, 12]);
// The wicker basket of tea. Box 20 x 30; its strap point (12, 12) = (19, 37).
const basketP = () => at([
  blob([[10, 34], [22, 34], [21, 50], [11, 50]], '#c8945a', 1), F(taper([[11, 39], [21, 39]], 0.8, 0.8, '#a06a3a')), F(taper([[11, 44], [21, 44]], 0.8, 0.8, '#a06a3a')),
  ...leaf(12, 33, 7, -60), ...leaf(16, 32, 8, -90), ...leaf(19, 33, 7, -120),
], [19, 37], [12, 12]);
// A foot. Box 10 x 8; its top (5, 1).
const footP = (far) => () => [E(5, 3, far ? 3.6 : 3.8, far ? 2.6 : 2.8, far ? TFURD : TFUR)];
// The round body and cream tummy. Box 26 x 18; its middle (13, 9) = (28, 50).
const bodyP = () => at([blob([[19, 44], [37, 44], [39, 53], [34, 57], [22, 57], [17, 53]], TFUR), F(E(29, 51, 5.4, 5, TCREAM))], [28, 50], [13, 9]);
// The arm, the paw holding the shears. Box 12 x 8; the shoulder (2, 4).
const armP = () => [taper([[2, 4], [8, 4]], 3.4, 3, TFUR), E(8.6, 4, 2.2, 2, TFURD)];
// One blade of the shears and its red handle. Box 16 x 8; the pivot (4, 4).
const bladeP = (lower) => () => [taper([[4, 4], [15, lower ? 4.6 : 3.4]], 1.6, 0.8, lower ? '#c8ccd8' : '#d8dce8'), E(2.6, lower ? 5.2 : 2.8, 2, 1.6, '#c8382a')];
// The head: round ears, the mask, the cream muzzle. Box 26 x 24; its middle (13, 14) = (29, 30).
const headP = () => at([
  E(22.6, 23.4, 3.4, 3.2, TFURD), E(35.4, 23.4, 3.4, 3.2, TFUR), F(E(22.6, 23.4, 1.7, 1.5, TMASK)), F(E(35.4, 23.4, 1.7, 1.5, TMASK)),
  E(29, 30, 9.4, 8.5, TFUR), F(E(25.4, 30.4, 3.2, 2.6, TMASK)), F(E(33, 30.4, 3.2, 2.6, TMASK)), F(E(29.6, 34.4, 4.2, 2.8, TCREAM)), F(E(30, 33, 1.2, 0.9, INK)),
], [29, 30], [13, 14]);
// The straw cone hat and its band. Box 38 x 16; the middle of the brim (19, 12) = (29, 24.6).
const hatP = () => at([
  T([[12, 26], [29, 13], [46, 26], [40, 25], [29, 23.4], [18, 25]], '#e8c47a'), F(taper([[16, 25], [29, 22.6], [42, 25]], 1.6, 1.6, '#c8382a')), F(taper([[22, 19.6], [29, 14.6], [36, 19.6]], 0.6, 0.6, '#c8a05a')),
], [29, 24.6], [19, 12]);
// The shapeshifting leaf in the band. Box 12 x 10; its stem (2, 6).
const bandLeafP = () => [...leaf(2, 6, 8, -40)];
const PR = {
  TAIL: tp('tail', 14, 14, tailP, 3, 3), BASKET: tp('basket', 20, 30, basketP, 3, 3), FOOT: [false, true].map((f) => tp(`foot${f ? 1 : 0}`, 10, 8, footP(f), 3)),
  BODY: tp('body', 26, 18, bodyP, 3, 3), ARM: tp('arm', 12, 8, armP, 3, 3), BLADE: [false, true].map((l) => tp(`blade${l ? 1 : 0}`, 16, 8, bladeP(l), 3, 3)),
  HEAD: tp('head', 26, 24, headP, 3, 3), HAT: tp('hat', 38, 16, hatP, 3, 3), LEAF: tp('leaf', 12, 10, bandLeafP, 3, 3),
};
const FACE = { eyes: [[9.6, 14.2, 1.8, 2.4, -1], [17.2, 14.2, 1.8, 2.4, 1]], mouth: [14, 19.4, 1.6], blush: [[6.6, 17.4, 1.4], [20.4, 17.4, 1.4]], iris: '#5a3a2a', lid: 0, lashes: 0 };
const pickFace = (mood) => faceSprite(`teapick|face|${mood}`, 26, 24, () => faceShapes(mood, FACE));

// The body's middle sits 10.2 above the feet; the head 20 above that.
const BODY_Y = 10.2;
const HEAD_AT = [1, -20];
const SH = [6, -6];

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (far) => ({ name: `foot${far ? 1 : 0}${tag}`, parent: 'bodyJ', s: PR.FOOT[far ? 1 : 0][i], pivot: [5, 1], at: (S) => [far ? -4 : 4.4, 4.8 - S[far ? 'yF' : 'yN']], rot: (S) => (S[far ? 'lF' : 'lN'] - S.tilt) * D2R });
  return [
    { name: `tail${tag}`, parent: 'bodyJ', s: PR.TAIL[i], pivot: [12, 12], at: () => [-11, 0], rot: (S) => (S.tail - 6) * D2R },
    { name: `basket${tag}`, parent: 'bodyJ', s: PR.BASKET[i], pivot: [12, 12], at: () => [-9, -13], rot: (S) => S.bk * D2R, soft: { key: 'basket', dir: [0, 14], k: 90, c: 6, gain: 0.6, turn: 0.6, max: 14 } },
    foot(true),
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [13, 9] },
    foot(false),
    { name: `head${tag}`, parent: 'headJ', s: PR.HEAD[i], pivot: [13, 14] },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => pickFace(MOODS.has(a.tpMood) ? a.tpMood : 'idle'), pivot: [13, 14] }] : []),
    { name: `hat${tag}`, parent: 'hatJ', s: PR.HAT[i], pivot: [19, 12] },
    { name: `leaf${tag}`, parent: 'hatJ', s: PR.LEAF[i], pivot: [2, 6], at: () => [4, -2], rot: (S) => S.lf * D2R, alpha: (a, S) => 1 - clamp(S.loose, 0, 1) },
    { name: `blade1${tag}`, parent: 'shearJ', s: PR.BLADE[1][i], pivot: [4, 4], rot: (S) => S.sn * D2R },
    { name: `arm${tag}`, parent: 'bodyJ', s: PR.ARM[i], pivot: [2, 4], at: () => SH, rot: (S) => S.aN * D2R },
    { name: `blade0${tag}`, parent: 'shearJ', s: PR.BLADE[0][i], pivot: [4, 4], rot: (S) => -S.sn * D2R },
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
const leafPath = (ctx, x, y, s, rot) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(-s / 2, 0);
  ctx.quadraticCurveTo(0, -s * 0.4, s / 2, 0);
  ctx.quadraticCurveTo(0, s * 0.4, -s / 2, 0);
  ctx.fill();
  ctx.restore();
};

export const teaPickerRig = sized(makeRig({
  w: 90, h: 80, soft: true, stride: 18, recover: 0.6,
  springs: {
    x: [240, 18], lift: [280, 16], tilt: [180, 13], hr: [160, 11], hat: [140, 7], tail: [110, 7], bk: [140, 9], aN: [260, 15], sn: [600, 24], lf: [120, 6], loose: [60, 9],
    lN: [340, 21], lF: [340, 21], yN: [400, 24], yF: [400, 24],
  },
  fast: ['x', 'aN', 'sn', 'lN', 'lF', 'yN', 'yF'],
  kick: { tilt: -150, hat: -400, hr: -160, lf: 600 },
  turnKick: { tilt: 100, tail: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.81;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'teapick', 18);
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: snipping at the bushes; tossing a sprig back into the basket; fanning itself.
    const snip = hold(lu, 0.6, 1, 3, 3.4) * calm;
    const toss = hold(lu, 4.2, 4.5, 4.9, 5.3) * calm;
    const fan = hold(lu, 6.6, 6.9, 8, 8.4) * calm;
    const br = Math.sin(t * 1.5);
    const idle = {
      x: 0, lift: (br + 1) * 0.3, tilt: snip * 6 + br * 0.8, hr: snip * 10 - fan * 4, hat: snip * 4 + fan * Math.sin(t * 9) * 3, tail: Math.sin(t * 1.8) * 8, bk: 0,
      aN: snip * 22 - toss * 150 - fan * 110 + fan * Math.sin(t * 10) * 18, sn: snip * Math.max(0, Math.sin(t * 9)) * 26 + 4, lf: Math.sin(t * 2.4) * 6, loose: 0, lN: 0, lF: 0, yN: 0, yF: 0,
    };
    // A round little waddle.
    const s = Math.sin(u * TAU);
    const [dxN, upN] = pawStep(u, 0, 18, 0.6, 2);
    const [dxF, upF] = pawStep(u, 0.5, 18, 0.6, 2);
    const walk = { x: 0, lift: Math.abs(Math.cos(u * TAU)) * 1.2, tilt: 3 + s * 4, hr: -s * 3, hat: s * 4, tail: s * 12, bk: s * 6, aN: 30 + s * 12, sn: 4, lf: s * 8, loose: 0, lN: -dxN * 3, lF: -dxF * 3, yN: upN, yF: upF };
    // Shears up and open; then snip-snip.
    const antic = { x: -2, lift: -0.6, tilt: -4, hr: -6, hat: -4, tail: 14, bk: -6, aN: -50, sn: 34, lf: 10, loose: 0, lN: 6, lF: -6, yN: 0, yF: 0 };
    const strike = { x: 4, lift: 0, tilt: 8, hr: 6, hat: 6, tail: -8, bk: 8, aN: -14, sn: 4 + Math.max(0, Math.sin(t * 40)) * 30, lf: -10, loose: 0, lN: -12, lF: 10, yN: 0, yF: 0 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // (Hurt, the leaf flutters loose a moment and comes back.)
    S.loose = (a.hurtAgo ?? 9) < 0.9 && m.hp > 0 ? 1 : 0;
    // Beaten: sat down hard, the hat tipped over its eyes.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -1.6, tilt: -8, hr: 14, hat: 26, tail: 20, bk: 10, aN: 70, sn: 30, lf: 20, loose: 0, lN: -50, lF: 46, yN: 0, yF: 0 });
    a.tpMood = m.hp <= 0 ? 'dizzy' : moodOf(a, fan > 0.4 || toss > 0.4 ? 'happy' : null);
    a.tpSnip = snip;
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => HEAD_AT, rot: (S) => (S.hr - S.tilt * 0.3) * D2R },
    { name: 'hatJ', parent: 'headJ', at: () => [0, -5.4], rot: (S) => S.hat * D2R },
    { name: 'shearJ', parent: 'bodyJ', at: (S) => [SH[0] + Math.cos(S.aN * D2R) * 8.6, SH[1] + Math.sin(S.aN * D2R) * 8.6], rot: (S) => (S.aN + 20) * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.2;
    ctx.fillStyle = '#3a5a2a';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 11, 2.6, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // Tea leaves: snipped off the bush in its act, flying off the shears in a fight, and the hat's
  // leaf fluttering loose when it's hit.
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const t = a.now + (m.uid % 7);
    const [bx, by] = at2(mat('shearJ'), 14, 0);
    ctx.save();
    ctx.fillStyle = '#8fd07a';
    const since = a.ph.since ?? -1;
    if (since >= 0 && since < 0.7) {
      const q = since / 0.7;
      for (let k = 0; k < 4; k++) {
        ctx.globalAlpha = a.alpha * (1 - q);
        leafPath(ctx, bx + q * (10 + k * 5), by - 3 + k * 2 - Math.sin(q * Math.PI) * 6 + q * q * 8, 5, q * 6 + k);
      }
    }
    if ((a.tpSnip ?? 0) > 0.5) {
      const q = (t * 1.4) % 1;
      ctx.globalAlpha = a.alpha * (1 - q) * 0.9;
      leafPath(ctx, bx + 2 + q * 4, by + q * 10, 4, q * 5);
    }
    if ((S.loose ?? 0) > 0.05) {
      const [hx, hy] = at2(mat('hatJ'), 6, -6);
      const q = clamp((a.hurtAgo ?? 0) / 0.9, 0, 1);
      ctx.globalAlpha = a.alpha * Math.sin(q * Math.PI);
      leafPath(ctx, hx - q * 6 + Math.sin(q * 9) * 3, hy - q * 8, 7, Math.sin(q * 7) * 0.8 - 0.6);
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): picking.
export function teaPickerStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const head = [HEAD_AT[0], by + HEAD_AT[1]];
  const ang = 30;
  const hand = [SH[0] + Math.cos(ang * D2R) * 8.6, by + SH[1] + Math.sin(ang * D2R) * 8.6];
  const sh = [
    ...put(tailP(), [12, 12], -11, by, -6), ...put(basketP(), [12, 12], -9, by - 13), ...put(footP(true)(), [5, 1], -4, by + 4.8), ...put(bodyP(), [13, 9], 0, by), ...put(footP(false)(), [5, 1], 4.4, by + 4.8),
    ...put(headP(), [13, 14], head[0], head[1]), ...put(faceShapes(fm, FACE), [13, 14], head[0], head[1]), ...put(hatP(), [19, 12], head[0], head[1] - 5.4), ...put(bandLeafP(), [2, 6], head[0] + 4, head[1] - 7.4),
    ...put(bladeP(true)(), [4, 4], hand[0], hand[1], ang + 24), ...put(armP(), [2, 4], SH[0], by + SH[1], ang), ...put(bladeP(false)(), [4, 4], hand[0], hand[1], ang + 16),
  ];
  const ox = 22;
  const oy = 44;
  return { w: 46, h: 48, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
