// The Barnacle Knight, remade 2026-11-20 (the player's pick "Penguin Lancer"): a round little
// penguin in a cream barnacle-shell helm with a coral plume, a driftwood lance with a coral tip tucked
// under its flipper. Live rig, outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    a 9 s act: standing guard, lance up; a shuffle on the spot; a push of the helm back up
//           off its eyes; a look round.
//   walk    a rocking penguin waddle, flippers out.
//   fight   it crouches and leans in, lance levelled; then flops onto its belly and toboggans in,
//           lance first, and pops back up.
//   hit     knocked back, the helm wobbling.
//   dead    flat on its back, feet up, dizzy.
// Built in the concept's own units and drawn at K of them; the feet at y 0.

import { E, T, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, arcP } from './rigkit.js';

const K = 0.68;
const PEN = '#2e3450';
const PENL = '#46507a';
const FOOT = '#ffa040';
const SHELL = '#ece6d6';
const CORAL = '#ff7a6a';
const pl = pairOf('penlance');

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
const barnacle = (x, y, k = 1) => [T([[x - 2.2 * k, y + 2 * k], [x + 2.2 * k, y + 2 * k], [x + 1.2 * k, y - 1.4 * k], [x - 1.2 * k, y - 1.4 * k]], '#d8d0bc'), F(E(x, y - 1.2 * k, 1 * k, 0.5 * k, '#7a6a6a'))];
// (Drawn in the concept's own coordinates; `at` moves a part's pivot to its place in its box.)
const at = (shapes, [px, py], [bx, by]) => shift(shapes, bx - px, by - py);

// ---------- Parts ----------
// A foot. Box 10 x 6; its top (5, 1).
const footP = () => [E(5, 2.4, 3.6, 2, FOOT)];
// The round body and white belly. Box 34 x 36; its middle (17, 18) = (29, 46).
const bodyP = () => at([
  blob([[17, 46], [16, 36], [22, 30], [30, 29], [37, 31], [41, 40], [40, 52], [33, 59], [23, 59]], PEN), F(blob([[25, 38], [33, 36], [38, 44], [36, 54], [28, 57], [24, 50]], '#ffffff')),
], [29, 46], [17, 18]);
// The far flipper. Box 12 x 14; the shoulder (8, 2) = (18, 40).
const flipperP = () => at([T([[18, 40], [11, 50], [17, 50]], PENL)], [18, 40], [8, 2]);
// The head: dark, the white face, the orange beak. Box 34 x 24; its middle (14, 12) = (29, 26).
const headP = () => at([E(29, 26, 9.4, 8.6, PEN), F(blob([[29, 24], [36, 22], [38, 28], [34, 32], [29, 31]], '#ffffff')), T([[36.6, 26.6], [43, 28.4], [36.6, 30]], FOOT)], [29, 26], [14, 12]);
// The barnacle-shell helm and its coral plume. Box 30 x 22; its base (14, 16) = (29, 20.6).
const helmP = () => at([
  blob([[19, 24], [20, 17], [29, 13.6], [38, 17], [39, 22], [34, 20.4], [24, 20.6]], SHELL, 1), ...barnacle(23, 18, 0.9), ...barnacle(30, 15.4, 1), ...barnacle(35.6, 18.4, 0.8),
  taper([[29, 13.6], [24, 7], [18, 8]], 3, 1.6, CORAL),
], [29, 20.6], [14, 16]);
// The lance: driftwood, a coral tip, a little shell guard. Box 44 x 12; the grip (8, 6).
const lanceP = () => [taper([[2, 6], [36, 6]], 2.4, 1.8, '#c8a27a'), T([[35, 3.8], [44, 6], [35, 8.2]], CORAL), F(E(37, 5, 1, 0.8, '#ffb0a0')), T([[15, 4.8], [19, 2.6], [19, 9.4], [15, 7.2]], SHELL)];
// The near flipper, gripping the lance. Box 8 x 8; (4, 4).
const gripP = () => [E(4, 4, 3.2, 3, PENL)];
const PR = {
  FOOT: pl('foot', 10, 6, footP, 3, 3), BODY: pl('body', 34, 36, bodyP, 3, 3), FLIP: pl('flip', 12, 14, flipperP, 3, 3), HEAD: pl('head', 34, 24, headP, 3, 3),
  HELM: pl('helm', 30, 22, helmP, 3, 3), LANCE: pl('lance', 44, 12, lanceP, 3, 3), GRIP: pl('grip', 8, 8, gripP, 3, 3),
};
// ---------- Its own face: an earnest little squire. Round eager eyes with a sunny gold glint low
// in them, short stubby brows that knit to look brave, a rosy cheek, and the beak that opens to
// cheer or bellow a charge. ----------
const PDARK = '#22263e';
const PGLINT = '#ffb84a';
const ln = (pts, w, c = PDARK) => [F(taper(pts, w, w * 0.85, c))];
const beakOpen = (gape, tongue = false) => [
  F(T([[21.8, 14], [27.4, 14.4], [22, 15.2 + gape]], '#7a3040')),
  ...(tongue ? [F(E(23, 14.9 + gape * 0.6, 1, 0.45, '#ff8fab'))] : []),
  F(T([[21.6, 14.9 + gape], [27, 14.6 + gape * 0.5], [21.8, 16.4 + gape]], FOOT)),
];
const PEYES = [[15.6, 11.8, -1, 1], [20, 11.5, 1, 0.88]];
const penFaceShapes = (mood) => {
  const out = [];
  for (const [x, y, s, k] of PEYES) {
    const angry = mood === 'angry' || mood === 'shout';
    // The brows: knit brave, level when calm, up when hurt.
    const brow = angry ? [[x - s * 1.4 * k, y - 2.2 * k], [x + s * 1.2 * k, y - 3.2 * k]] : mood === 'hurt' ? [[x - s * 1.3 * k, y - 3.2 * k], [x + s * 1.3 * k, y - 2.5 * k]] : [[x - s * 1.3 * k, y - 2.7 * k], [x + s * 1.3 * k, y - 3 * k]];
    if (mood !== 'dead' && mood !== 'dizzy') out.push(...ln(brow, 0.75 * k));
    if (mood === 'blink' || mood === 'sleep' || mood === 'dead') out.push(...ln(arcP(x, y, 1.4 * k, 0.8 * k, 15, 165, 6), 0.6 * k));
    else if (mood === 'happy') out.push(...ln(arcP(x, y + 0.8 * k, 1.4 * k, 1.3 * k, 200, 340, 6), 0.65 * k));
    else if (mood === 'hurt') out.push(...ln([[x + s * 1.2 * k, y - 1.1 * k], [x - s * 0.9 * k, y], [x + s * 1.2 * k, y + 1.1 * k]], 0.6 * k));
    else if (mood === 'dizzy') {
      const pts = [];
      for (let i = 0; i <= 11; i++) pts.push([x + Math.cos(i * 0.9) * (0.12 + i * 0.11) * k, y + Math.sin(i * 0.9) * (0.12 + i * 0.11) * k]);
      out.push(...ln(pts, 0.4 * k));
    } else {
      let eye = Array.from({ length: 16 }, (_, i) => [x + Math.cos((i / 16) * Math.PI * 2) * 1.5 * k, y + Math.sin((i / 16) * Math.PI * 2) * 1.8 * k]);
      if (angry) eye = eye.map(([px, py]) => [px, Math.max(py, y - 0.7 * k + (px - x) * -s * 0.4)]);
      out.push(F(T(eye, PDARK)), F(E(x, y + 0.9 * k, 1 * k, 0.6 * k, PGLINT)));
      if (!angry) out.push(F(E(x + 0.5 * k, y - 0.6 * k, 0.5 * k, 0.5 * k, '#ffffff')), F(E(x - 0.45 * k, y + 0.3 * k, 0.2 * k, 0.2 * k, '#ffffff')));
    }
  }
  if (mood !== 'dead') out.push(F(E(14.6, 15.4, 1.3, 0.65, mood === 'happy' ? '#ff8aa8' : '#ffb0c4')));
  if (mood === 'happy') out.push(...beakOpen(1));
  else if (mood === 'shout') out.push(...beakOpen(2.2, true));
  else if (mood === 'hurt' || mood === 'dizzy' || mood === 'dead') out.push(...beakOpen(0.6));
  return out;
};
const penFace = (mood) => faceSprite(`penlance|face|${mood}`, 34, 24, () => penFaceShapes(mood));

// The body's middle sits 16 above the feet (12 when it's down on its belly); the head 20 above.
const BODY_Y = 16;
const HEAD_AT = [0, -20];

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (far) => ({ name: `foot${far ? 1 : 0}${tag}`, parent: 'bodyJ', s: PR.FOOT[i], pivot: [5, 1], at: (S) => [far ? -4 : 4, 13 - S[far ? 'yF' : 'yN']], rot: (S) => (S[far ? 'lF' : 'lN'] - S.tilt * (1 - S.slide)) * D2R });
  return [
    foot(true),
    { name: `flip${tag}`, parent: 'bodyJ', s: PR.FLIP[i], pivot: [8, 2], at: () => [-11, -6], rot: (S) => S.fF * D2R },
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [17, 18] },
    foot(false),
    { name: `head${tag}`, parent: 'headJ', s: PR.HEAD[i], pivot: [14, 12] },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => penFace(MOODS.has(a.plMood) ? a.plMood : 'idle'), pivot: [14, 12] }] : []),
    { name: `helm${tag}`, parent: 'helmJ', s: PR.HELM[i], pivot: [14, 16] },
    { name: `lance${tag}`, parent: 'lanceJ', s: PR.LANCE[i], pivot: [8, 6] },
    { name: `grip${tag}`, parent: 'lanceJ', s: PR.GRIP[i], pivot: [4, 4] },
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

export const penguinLancerRig = sized(makeRig({
  w: 110, h: 80, soft: true, stride: 14, recover: 0.6,
  springs: {
    x: [200, 16], lift: [260, 16], tilt: [160, 12], slide: [160, 14], hr: [160, 11], helm: [150, 7], fF: [200, 12], ln: [200, 14],
    lN: [340, 21], lF: [340, 21], yN: [400, 24], yF: [400, 24],
  },
  fast: ['x', 'slide', 'tilt', 'lift', 'ln'],
  kick: { tilt: -170, helm: -380, hr: -160 },
  turnKick: { tilt: 120, helm: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.71;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'penlance', 14);
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: standing guard; a shuffle on the spot; pushing the helm back up; a look round.
    const shuffle = hold(lu, 2, 2.3, 3.4, 3.7) * calm;
    const push = hold(lu, 5, 5.3, 6, 6.4) * calm;
    const look = hold(lu, 7.2, 7.5, 8.2, 8.6) * calm;
    const sh = Math.sin(t * 9);
    const br = Math.sin(t * 1.4);
    const idle = {
      x: 0, lift: (br + 1) * 0.3, tilt: shuffle * sh * 6, slide: 0, hr: look * 20 - push * 8, helm: 14 * push * (1 - clamp((lu - 5.6) * 3, 0, 1)) + br * 2, fF: push * -70 + shuffle * sh * 14,
      ln: -40, lN: shuffle * Math.max(0, sh) * -12, lF: shuffle * Math.max(0, -sh) * -12, yN: shuffle * Math.max(0, sh) * 1.4, yF: shuffle * Math.max(0, -sh) * 1.4,
    };
    // A rocking waddle.
    const s = Math.sin(u * TAU);
    const [, upN] = pawStep(u, 0, 14, 0.55, 1.8);
    const [, upF] = pawStep(u, 0.5, 14, 0.55, 1.8);
    const walk = { x: 0, lift: Math.abs(s) * 0.8, tilt: s * 9, slide: 0, hr: -s * 4, helm: s * 6, fF: -30 + s * 12, ln: -30 + s * 6, lN: 0, lF: 0, yN: upN, yF: upF };
    // Crouched and leaning in, lance levelled; then down on its belly, tobogganing in.
    const antic = { x: -2, lift: -1.5, tilt: 20, slide: 0, hr: -10, helm: 6, fF: 40, ln: -20, lN: -10, lF: -10, yN: 0, yF: 0 };
    const strike = { x: 14, lift: 0, tilt: 0, slide: 1, hr: -14, helm: -10, fF: 70, ln: 0, lN: 0, lF: 0, yN: 0, yF: 0 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: flat on its back, feet up.
    if (m.hp <= 0) Object.assign(S, { x: -2, lift: -4, tilt: -88, slide: 0, hr: 10, helm: -30, fF: -40, ln: 20, lN: -20, lF: 20, yN: 0, yF: 0 });
    a.plMood = m.hp <= 0 ? 'dizzy' : moodOf(a, shuffle > 0.5 || push > 0.5 ? 'happy' : null);
    return S;
  },
  parts: [
    // (Down on its belly the whole body turns nose-first and lowers; the lance keeps pointing ahead.)
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift + 4.6 * S.slide], rot: (S) => (S.tilt + 76 * S.slide) * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => HEAD_AT, rot: (S) => (S.hr - S.tilt * 0.3) * D2R },
    { name: 'helmJ', parent: 'headJ', at: () => [0, -5.4], rot: (S) => S.helm * D2R },
    { name: 'lanceJ', parent: 'bodyJ', at: () => [3, 0], rot: (S) => (S.ln - S.tilt - 76 * S.slide) * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.2;
    ctx.fillStyle = '#2a4a7a';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 12, 2.8, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // Tobogganing: streaks behind and a spray of little puffs off its belly.
  fx(ctx, m, a, S) {
    const sl = S.slide ?? 0;
    if (m.hp <= 0 || sl < 0.3) return;
    ctx.save();
    ctx.globalAlpha = a.alpha * clamp((sl - 0.3) * 2, 0, 1);
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.4;
    for (const [y, l] of [[-16, 14], [-9, 18], [-3, 12]]) {
      ctx.beginPath();
      ctx.moveTo(S.x - 16, y);
      ctx.lineTo(S.x - 16 - l, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 4; k++) {
      const q = (a.now * 3 + k / 4) % 1;
      ctx.beginPath();
      ctx.arc(S.x - 10 - q * 16, -1.5 - q * 4 - (k % 2) * 2, 2.4 * (1 - q) + 0.6, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): on guard.
export function penguinLancerStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const head = [HEAD_AT[0], by + HEAD_AT[1]];
  const sh = [
    ...put(footP(), [5, 1], -4, by + 13), ...put(flipperP(), [8, 2], -11, by - 6), ...put(bodyP(), [17, 18], 0, by), ...put(footP(), [5, 1], 4, by + 13),
    ...put(headP(), [14, 12], head[0], head[1]), ...put(penFaceShapes(fm), [14, 12], head[0], head[1]), ...put(helmP(), [14, 16], head[0], head[1] - 5.4),
    ...put(lanceP(), [8, 6], 3, by, -40), ...put(gripP(), [4, 4], 3, by),
  ];
  const ox = 22;
  const oy = 46;
  return { w: 50, h: 50, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
