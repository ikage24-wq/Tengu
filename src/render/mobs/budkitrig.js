// The Blossom Kit, remade 2026-11-19 (the player's pick "Bud-to-Bloom Kit"): Petal Meadow's first
// monster, a little fox kit grown from a cherry tree. Pink fur, a cream muzzle and tummy, petal
// ears with notched tips, a budding twig for a tail. It wanders with its petals folded up behind
// its head into one pointed bud; to attack, the bud opens and its petals spread round its face like
// a flower mane (that bloom is its wind-up), then it pounces. Live rig, outer outline only, the
// face bare, no squash.
//
// How it moves:
//   idle    a 9 s act: sniffing about; an ear-flick... the bud half opens for a peek (happy), closes.
//   walk    a quick little dart, leaning in, the twig tail swinging, the bud bobbing a beat behind.
//   fight   the bloom: the bud fades as the petals turn out round its face, it crouches and
//           rears; then a pounce, hopping in; the petals fold back up as it settles.
//   hit     knocked back, a few petals shaken loose.
//   dead    it wilts: head drooping, petals half open and limp, a puff of petals.
// Built in the concept's own units and drawn at K of that (render size); the feet at y 0.

import { E, T, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, MOODS, moodOf, faceShapes, INK } from './rigkit.js';

const K = 0.62;
const FUR = '#ffc4d6';
const FURD = '#f79bbb';
const CREAM = '#fff3ea';
const EARIN = '#ffe3ec';
const PAW = '#e8789c';
const PET = '#ffb2cc';
const PETL = '#ffd6e4';
const BARK = '#9a6a4a';
const LEAF = '#8fd07a';
const bk = pairOf('budkit');

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
// A sakura petal from (cx, cy) pointing at `deg` (0 up), its notch at the tip.
const petalShape = (cx, cy, deg, l, w, c) => {
  const a = deg * D2R;
  const at = (u, v) => [cx + Math.sin(a) * u + Math.cos(a) * v, cy - Math.cos(a) * u + Math.sin(a) * v];
  return blob([at(0, 0), at(l * 0.3, -w * 0.42), at(l * 0.72, -w * 0.55), at(l, -w * 0.24), at(l * 0.86, 0), at(l, w * 0.24), at(l * 0.72, w * 0.55), at(l * 0.3, w * 0.42)], c, 1);
};

// ---------- Parts (each in its own box) ----------
// The tail: a budding twig. Box 20 x 28; its root at (18, 26).
const tailP = () => [
  taper([[18, 26], [12, 22], [9, 14], [11, 7]], 2.4, 1.6, BARK), T([[9.6, 7.6], [11.6, 4.4], [13.4, 7.6]], LEAF), E(11.6, 3.6, 3, 3.4, PET), F(E(11, 2.8, 1.2, 1, PETL)),
  T([[8.6, 15.6], [6, 13], [9.8, 13.8]], LEAF), E(7, 12.4, 2.4, 2.6, PET),
];
// A leg: a short pink thigh and a round pink paw. Box 10 x 10; the hip at (5, 1).
const legP = (far) => () => [E(5, 3, 3.4, 4, far ? FURD : FUR), E(5, 5.8, 3.8, 2.3, PAW)];
// The body with its cream tummy. Box 20 x 20; its middle at (10, 10).
const bodyP = () => [E(10, 10, 8.6, 8.8, FUR), F(E(11, 12, 5, 5.8, CREAM))];
// A stubby arm. Box 8 x 9; the shoulder at (4, 1.6).
const armP = (far) => () => [E(4, 4.4, 2.6, 3.4, far ? FURD : FUR)];
// The head: round, cheek tufts, a cream muzzle, a nose. Box 30 x 26; its middle at (15, 13).
const headP = () => [
  E(15, 13, 11, 10, FUR), T([[4.4, 14], [2, 18], [6.4, 18]], FUR), T([[25.6, 14], [28, 18], [23.6, 18]], FUR),
  F(E(17, 17.6, 5, 3.4, CREAM)), F(E(18.2, 16.2, 1.3, 1, INK)),
];
// A petal ear with its pale inside. Box 10 x 13; its root at (5, 12).
const earP = () => [petalShape(5, 12, 0, 11, 8, FUR), F(petalShape(5, 11.6, 0, 7.4, 4.6, EARIN))];
// One petal of the bloom. Box 14 x 20; its base at (7, 19).
const petalP = () => [petalShape(7, 19, 0, 18, 12, PET), F(petalShape(7, 18.6, 0, 11, 6.4, PETL))];
// The closed bud: one pointed bud, its seams and two green sepals at the base. Box 28 x 34; its
// base at (14, 30).
const budP = () => [
  petalShape(8, 27, -48, 7, 4.6, LEAF), petalShape(20, 27, 48, 7, 4.6, LEAF),
  blob([[2, 27], [3, 15], [8, 7], [14, 0.6], [20, 7], [25, 15], [26, 27], [14, 32]], PET),
  F(blob([[12, 27], [12.6, 11], [14, 3.6], [15.4, 11], [16, 27]], PETL)),
  F(taper([[7, 24], [9.4, 11], [13.4, 3.6]], 0.8, 0.6, '#f08aaa')), F(taper([[21, 24], [18.6, 11], [14.6, 3.6]], 0.8, 0.6, '#f08aaa')),
];
const P = {
  TAIL: bk('tail', 20, 28, tailP, 3), LEG: [false, true].map((f) => bk(`leg${f ? 1 : 0}`, 10, 10, legP(f), 3)), BODY: bk('body', 20, 20, bodyP, 3),
  ARM: [false, true].map((f) => bk(`arm${f ? 1 : 0}`, 8, 9, armP(f), 3)), HEAD: bk('head', 30, 26, headP, 3), EAR: bk('ear', 10, 13, earP, 3),
  PETAL: bk('petal', 14, 20, petalP, 3), BUD: bk('bud', 28, 34, budP, 3),
};
// The face (bare), over the head. Box 30 x 26.
const FACE = { eyes: [[11.2, 12.6, 2.6, 3.2, -1], [19.4, 12.6, 2.6, 3.2, 1]], mouth: [18, 19.2, 2.2], blush: [[7.4, 16.6, 1.7], [23.6, 16.6, 1.5]], iris: '#c8507a', lid: 0, lashes: 0 };
const kitFace = (mood) => faceSprite(`budkit|face|${mood}`, 30, 26, () => faceShapes(mood, FACE));

// The petals: bunched up inside the bud, they turn out round its face as it blooms (each the near
// way round, so none spins).
const CLOSED = [-10, -6, -2, 2, 6, 10];
const OPEN = [-150, -90, -30, 30, 90, 150];
const HEAD_AT = [0.2, -17];
const opened = (S) => clamp(S.bloom, 0, 1.15);
const petalAlpha = (S) => {
  const u = clamp(S.bloom * 2.4 - 0.1, 0, 1);
  return u * u * (3 - 2 * u);
};

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (k, far) => ({ name: `leg${k}${tag}`, parent: 'trunk', s: P.LEG[far ? 1 : 0][i], pivot: [5, 1], at: (S) => [far ? -4.8 : 4.8, 4 - S[far ? 'yF' : 'yN']], rot: (S) => (S[far ? 'lF' : 'lN'] - S.tilt) * D2R });
  return [
    { name: `tail${tag}`, parent: 'trunk', s: P.TAIL[i], pivot: [18, 26], at: () => [-7, 2], rot: (S) => S.tail * D2R, soft: { key: 'tail', dir: [-8, -12], k: 70, c: 5, gain: 0.7, turn: 0.6, max: 22 } },
    leg(1, true),
    { name: `armF${tag}`, parent: 'trunk', s: P.ARM[1][i], pivot: [4, 1.6], at: () => [-7.4, -4], rot: (S) => S.aF * D2R },
    { name: `body${tag}`, parent: 'trunk', s: P.BODY[i], pivot: [10, 10] },
    { name: `bud${tag}`, parent: 'headJ', s: P.BUD[i], pivot: [14, 30], at: () => [0, 2], alpha: (a, S) => 1 - petalAlpha(S) },
    ...CLOSED.map((c, k) => ({
      name: `pet${k}${tag}`, parent: 'headJ', s: P.PETAL[i], pivot: [7, 19], at: (S) => [0, -5 * (1 - Math.min(1, opened(S)))],
      rot: (S) => (c + (OPEN[k] - c) * Math.min(1, opened(S)) + (OPEN[k] > 0 ? 1 : -1) * S.droop) * D2R, alpha: (a, S) => petalAlpha(S),
    })),
    { name: `earF${tag}`, parent: 'headJ', s: P.EAR[i], pivot: [5, 12], at: () => [-6, -7], rot: (S) => (-26 - S.earF) * D2R, alpha: (a, S) => petalAlpha(S) },
    { name: `earN${tag}`, parent: 'headJ', s: P.EAR[i], pivot: [5, 12], at: () => [6, -7], rot: (S) => (26 + S.earN) * D2R, alpha: (a, S) => petalAlpha(S) },
    { name: `head${tag}`, parent: 'headJ', s: P.HEAD[i], pivot: [15, 13] },
    leg(0, false),
    { name: `armN${tag}`, parent: 'trunk', s: P.ARM[0][i], pivot: [4, 1.6], at: () => [8.2, -4], rot: (S) => S.aN * D2R },
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

export const budKitRig = sized(makeRig({
  w: 64, h: 70, soft: true, stride: 14, recover: 0.6,
  springs: {
    x: [240, 18], lift: [260, 17], tilt: [200, 14], head: [160, 11], lN: [360, 22], lF: [360, 22], yN: [400, 24], yF: [400, 24],
    aN: [220, 13], aF: [220, 13], tail: [90, 7], bloom: [150, 13], droop: [120, 12], earN: [120, 8], earF: [120, 8],
  },
  fast: ['x', 'lift', 'tilt', 'lN', 'lF', 'yN', 'yF', 'aN', 'aF'],
  kick: { tilt: -220, head: -260, earN: 320, earF: 320, bloom: 2.2 },
  turnKick: { head: 140, earN: 200, earF: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.87;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'budkit', 14);
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: sniffing about; an ear flick; the bud half opening for a peek, then closing.
    const sniff = hold(lu, 1, 1.3, 2.4, 2.7) * calm;
    const peek = hold(lu, 5.2, 5.9, 6.8, 7.6) * calm;
    const br = Math.sin(t * 2.2);
    a.bkPeek = peek;
    const idle = {
      x: 0, lift: (br + 1) * 0.3, tilt: br * 1.4 + sniff * 5, head: sniff * Math.sin(t * 9) * 4 - peek * 5, lN: 0, lF: 0, yN: 0, yF: 0,
      aN: 12 + br * 4, aF: -12 - br * 4, tail: Math.sin(t * 1.6) * 8, bloom: peek * 0.5, droop: 0, earN: peek * 10, earF: peek * 10,
    };
    // A quick little dart: leaning in, short steps, the tail swinging.
    const s = Math.sin(u * TAU);
    const [dxN, upN] = pawStep(u, 0, 14, 0.55, 2.4);
    const [dxF, upF] = pawStep(u, 0.5, 14, 0.55, 2.4);
    const walk = {
      x: 0, lift: Math.abs(Math.cos(u * TAU)) * 1.4, tilt: 8 + s * 2, head: -4 - s * 3, lN: -dxN * 4, lF: -dxF * 4, yN: upN, yF: upF,
      aN: 26 + s * 28, aF: -26 - s * 28, tail: -14 + s * 16, bloom: 0, droop: 0, earN: 0, earF: 0,
    };
    // The bloom, crouched and rearing (its wind-up); then a pounce.
    const antic = { x: -2, lift: -1.4, tilt: -10, head: -8, lN: 10, lF: -8, yN: 0, yF: 0, aN: -50, aF: 50, tail: 22, bloom: 1, droop: 0, earN: 18, earF: 18 };
    const strike = { x: 9, lift: 5, tilt: 16, head: 6, lN: -36, lF: 28, yN: 2, yF: 2, aN: 70, aF: 50, tail: -30, bloom: 1, droop: 0, earN: -16, earF: -16 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: it wilts, head hanging, the petals half open and drooping.
    if (m.hp <= 0) Object.assign(S, { lift: -0.6, tilt: 18, head: 22, aN: 70, aF: 60, tail: 26, bloom: 0.75, droop: 34, earN: 34, earF: 34 });
    a.bkMood = m.hp <= 0 ? 'dead' : moodOf(a, a.ph.strike > 0.25 ? 'shout' : peek > 0.5 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -11 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'trunk', at: () => HEAD_AT, rot: (S) => S.head * D2R },
    ...pass(false),
    ...pass(true),
    { name: 'face', parent: 'headJ', s: (a) => kitFace(MOODS.has(a.bkMood) ? a.bkMood : 'idle'), pivot: [15, 13] },
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.2;
    ctx.fillStyle = '#5a2a40';
    ctx.beginPath();
    ctx.ellipse(0, -0.4, 11, 2.6, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // Petals shaken loose when it's hit, and a puff of them as it wilts.
  fx(ctx, m, a, S, mat) {
    const since = a.now - (a.mo?.hitT ?? -9);
    const burst = m.hp <= 0 ? Math.min(1, (m.dying ?? 0) / 0.6) : since >= 0 && since < 0.7 ? since / 0.7 : -1;
    if (burst < 0 || burst >= 1) return;
    const [hx, hy] = at2(mat('headJ'), 0, -4);
    const n = m.hp <= 0 ? 9 : 5;
    for (let k = 0; k < n; k++) {
      const ang = -Math.PI / 2 + (k - (n - 1) / 2) * 0.6 + (m.uid % 5) * 0.1;
      const d = 6 + burst * 16;
      const x = hx + Math.cos(ang) * d + Math.sin(burst * 6 + k) * 2;
      const y = hy + Math.sin(ang) * d + burst * burst * 18;
      ctx.globalAlpha = a.alpha * (1 - burst);
      ctx.fillStyle = k % 2 ? PET : PETL;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(burst * 5 + k);
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.4, 1.5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = a.alpha;
  },
}), K);

// A still of it (the Monster Book and anywhere a sprite is wanted): wandering, the bud closed.
export function budKitStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const ox = 20;
  const oy = 40;
  const sc = (shapes) => shapes.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.w != null && s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) }));
  const head = [HEAD_AT[0], -11 + HEAD_AT[1]];
  return { w: 40, h: 44, res: 3, shapes: sc([
    ...put(tailP(), [18, 26], -7, -9), ...put(legP(true)(), [5, 1], -4.8, -7), ...put(armP(true)(), [4, 1.6], -7.4, -15, -12), ...put(bodyP(), [10, 10], 0, -11),
    ...put(budP(), [14, 30], head[0], head[1] + 2), ...put(headP(), [15, 13], head[0], head[1]), ...put(faceShapes(fm, FACE), [15, 13], head[0], head[1]),
    ...put(legP(false)(), [5, 1], 4.8, -7), ...put(armP(false)(), [4, 1.6], 8.2, -15, 12),
  ]) };
}
