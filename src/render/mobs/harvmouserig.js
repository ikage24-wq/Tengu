// The Harvest Mouse (new for Clover Hills' Hayloft Ridge, 2026-11-11, built from scratch): a tiny
// golden field mouse. A live puppet on the boss rig (rig.js): every part drawn once and placed
// each frame, the loose bits on springs, nothing squashed or stretched, every part filtered
// smoothly.
//
// Its look: a round little body in warm golden fur with a cream belly, a round head with big
// glossy eyes, rosy cheeks, a pink button nose and whiskers, two big round ears (pink inside), a
// long thin tail, and tiny pink feet under a soft fringe of fur.
//   idle    it sniffs (nose and whiskers twitching in bursts), shifts its weight, looks about, flicks
//           an ear, sways its tail; every few seconds it sits up on its hind
//           legs, holding a grain of wheat in its front paws, nibbles it with its nose going, then
//           drops back down onto all fours.
//   walk    a little rodent's scamper, low to the ground (never a hop): plump paws peeking out
//           under its fur, the hind pair pushing together and the front pair landing together, stepped by the distance walked on an eased speed; its body bobs
//           and rocks on springs that overshoot and settle; the ears and tail jiggle after it.
//   attack  it crouches and wiggles, then pounces in with a little bite; its ears fly back.
//   hit     knocked back on its tilt spring, ears and tail flicking.
// `harvmouseStill(pose, f, mood)` gives the still pictures (portraits, the book) from the same shapes.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, simpleMouth, deadEye, tear, vein } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, makeRig, stateBlend, smooth, TAU } from './rig.js';
import { sprite } from '../pixel.js';

const FUR = ramp('#f2b45e', { step: 9, turn: 14, sat: -6 });
const CREAM = ramp('#fff1dc', { step: 6, turn: 24 });
const PINK = '#ffaab8';
const TAILC = '#c47e5c';
const INK = '#3a2418';
const GRAIN = '#f4cf6a';
const D2R = Math.PI / 180;

// ---------- Shapes ----------

// The body: a round bean of golden fur, a cream belly, a soft scalloped fringe along the bottom
// (the legs hide under it), lit on top. Box 18 x 12; its hips at (4, 9.6).
const bodyShapes = () => {
  const out = [E(9, 6.6, 8, 5.4, FUR.base)];
  for (let i = 0; i < 5; i++) out.push(E(3.4 + i * 3, 10.6, 1.8, 1.3, i % 2 ? FUR.base : FUR.sh));
  out.push(E(11.6, 9, 4, 2.4, CREAM.base));
  out.push(crescent(9, 6.6, 8, 5.4, FUR.sh, { k: 0.22, a0: 30, a1: 150 }), shine(9, 6.6, 8, 5.4, '#fff4dc', 0, 0.8));
  // A darker stripe down its back, as harvest mice have.
  out.push(F(T([[2.4, 4.2], [8, 1.6], [13, 2], [13, 2.6], [8, 2.4], [2.6, 5]], FUR.sh)));
  return out;
};
// The head: a round golden head with a short snout and cream cheeks. Box 13 x 11, the neck at (3, 8).
const headShapes = () => [
  E(6, 5.4, 4.8, 4.4, FUR.base),
  E(9.6, 6.6, 2.8, 2.2, FUR.base),
  E(7.4, 7.6, 3, 2.2, CREAM.base),
  crescent(6, 5.4, 4.8, 4.4, FUR.sh, { k: 0.2, a0: 40, a1: 150 }),
  F(E(5, 2.6, 1.8, 0.8, '#ffe2b0')),
];
// The face (unoutlined, on the head): big glossy eyes, cheeks, the nose, whiskers and a little
// mouth. Box 13 x 10, centre (6.5, 5).
const faceShapes = (mood) => {
  const out = [];
  if (mood === 'dead') out.push(...deadEye(4.3, 4.4, 1, { c: INK, th: 0.5 }), ...deadEye(9, 4.3, 1.1, { c: INK, th: 0.5 }));
  else {
    const so = { iris: '#5a3420', ink: INK, lid: 0, mood: mood === 'shout' ? 'angry' : mood };
    out.push(...simpleEye(4.3, 4.4, { ...so, s: -1, w: 1.25, h: 1.7 }), ...simpleEye(9, 4.3, { ...so, s: 1, w: 1.4, h: 1.9 }));
    out.push(F(E(3.4, 6.7, 1, 0.55, '#ff9eb0')), F(E(9.8, 6.9, 1, 0.55, '#ff9eb0')));
  }
  out.push(...simpleMouth(10.8, 7.4, { k: 0.5, mood: mood === 'idle' || mood === 'blink' ? 'happy' : mood, lip: INK }));
  if (mood === 'hurt') out.push(...tear(8.8, 5.4, 0.7, { type: 'stream', len: 2 }));
  if (mood === 'angry') out.push(...vein(2.4, 1, 0.6));
  return out;
};
// The nose and whiskers, from the tip of the snout at (2, 2.5): a pink button nose with a shine,
// two fine whiskers fanning out each side. Box 7 x 5.
const noseShapes = () => {
  const out = [];
  for (const [x0, y0, x1, y1] of [[1.4, 2.9, 4.6, 1.8], [1.4, 3.3, 4.6, 4], [0.4, 3, -2.2, 2.2], [0.4, 3.4, -2.2, 4]]) out.push(...stroke([[x0 + 1.6, y0], [x1 + 1.6, y1]], 0.22, '#8a6a52'));
  out.push(E(2.4, 2.5, 0.95, 0.8, '#ff7f98'), F(E(2.1, 2.2, 0.32, 0.26, '#ffffff')));
  return out;
};
// An ear: a big round ear, pink inside, from its root at (2.6, 4.6).
const earShapes = (far) => [E(2.6, 2.6, 2.6, 2.5, far ? FUR.sh : FUR.base), F(E(2.7, 2.8, 1.6, 1.6, far ? '#f08aa0' : PINK))];
// A paw, from its heel at (0.8, 0.3): a plump pink pad peeking out under the fur, toes forward; the
// hind paws longer, as a mouse's are. No legs show: they're tucked up under its round body.
const pawShapes = (far, hind) => [
  E(hind ? 1.9 : 1.5, 1, hind ? 2 : 1.5, 0.95, far ? '#e88a9c' : PINK),
  F(E(hind ? 2.9 : 2.2, 0.75, 0.5, 0.3, '#ffd2dc')),
];
// The front paws holding a grain of wheat (when it sits up). Box 6 x 6, centre (3, 3).
const pawsShapes = () => [
  T([[1.8, 0.4], [3.4, 0.4], [4, 3.2], [2.6, 5], [1.2, 3.2]], GRAIN),
  F(T([[2.2, 0.8], [2.8, 0.8], [2.8, 4], [2.2, 3.8]], '#fff0a8')),
  E(1.4, 3.4, 1, 0.9, PINK),
  E(4, 3.2, 1, 0.9, PINK),
];

// ---------- Parts ----------

const MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout']);
const bodyPart = () => part('hm|body', 18, 12, bodyShapes, 4);
const headPart = () => part('hm|head', 13, 11, headShapes, 4);
const facePart = (mood) => sprite(`rig|hm|face|${mood}`, () => ({ w: 13, h: 10, res: 2, soft: 'cel', crisp: true, bare: true, pad: 4, shapes: faceShapes(mood) }));
const earPart = (far) => part(`hm|ear|${far ? 1 : 0}`, 6, 5, () => earShapes(far), 4);
const pawPart = (far, hind) => part(`hm|paw|${far ? 1 : 0}|${hind ? 1 : 0}`, 4, 2, () => pawShapes(far, hind), 4);
const pawsPart = () => part('hm|paws', 6, 6, pawsShapes, 4);
const nosePart = () => sprite('rig|hm|nose', () => ({ w: 7, h: 5, res: 2, soft: 'cel', crisp: true, bare: true, pad: 4, shapes: noseShapes() }));

const faceOf = (a) => {
  if (a.face === 'dead') return 'dead';
  if (a.ph.strike > 0.3) return 'shout';
  if (a.ph.atk) return 'angry';
  return MOODS.has(a.face) ? a.face : 'idle';
};

// ---------- Motion ----------

// The scurry: one cycle per STRIDE px walked, on its speed eased over a moment. Each foot makes a
// soft loop: forward as it lifts (easing off the ground and back down with no corner), back as it
// pushes; diagonal pairs together.
const STRIDE = 16;
const REACH = 1.6;
const stepPhase = (m, a) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(160, Math.abs(odo - (st.hmOdo ?? odo)) / dt);
  st.hmOdo = odo;
  st.hmV = (st.hmV ?? 0) + (raw - (st.hmV ?? 0)) * Math.min(1, dt * 5);
  st.hmU = ((st.hmU ?? 0) + (st.hmV / STRIDE) * dt) % 1;
  return st.hmU;
};
const pawAt = (a, S, x0, phase) => {
  const p = ((a.hmU ?? 0) + phase) * TAU;
  const w = a.walkW;
  const s = Math.sin(p);
  const up = s > 0 ? s * s : 0;
  // (Relative to the hips: on the ground, lifting in a soft loop as it comes forward; they only
  // leave the ground with the body on a pounce. The third value is its roll: toe down pushing
  // off, toe up reaching to land.)
  return [x0 - Math.cos(p) * REACH * w, HIP - 1.9 - up * 0.9 * w - Math.max(0, S.lift - 1.3), s > 0 ? Math.cos(p) * s * 0.4 * w : 0];
};
// The four paws: [name, x under the body, phase, hind?]. A little rodent's scamper: the two hind
// paws push off together, then the two front paws land together (the far one a hair behind its
// near twin, so the pair reads as two).
const PAWS = [
  ['HF', -0.4, 0.06, true],
  ['FF', 8, 0.56, false],
  ['HN', 1.2, 0, true],
  ['FN', 9.4, 0.5, false],
];
const pawPartDef = ([n, x0, phase, hind], far) => ({
  name: `paw${n}`,
  parent: 'hips',
  s: () => pawPart(far, hind),
  pivot: [0.8, 0.3],
  at: (S, a) => {
    const [x, y] = pawAt(a, S, x0, phase);
    return hind ? [x, y] : frontFoot([x, y], S);
  },
  rot: (S, a) => pawAt(a, S, x0, phase)[2],
  alpha: hind ? undefined : (a, S) => frontAlpha(S),
});
// (Sitting up, the front feet lift off with the body and fade quickly, as they become the paws
// that hold the grain, so no ghost of them lingers on the ground.)
const frontFoot = ([x, y], S) => [x - S.sit * 2, y - Math.max(0, S.sit) * 4];
const frontAlpha = (S) => 1 - Math.min(1, Math.max(0, S.sit) * 3);
// An ear twitch: a quick flick back and a springy return, every `every` seconds.
const twitch = (t, every, off) => {
  const u = (t + off) % every;
  return u < 0.32 ? Math.sin((u / 0.32) * Math.PI) : 0;
};
// The sit-up, every 6 s while it stands: up in 0.45 s, a nibble for 1.4 s, down in 0.4 s.
const SIT = 6;
const sitOf = (t) => {
  const u = t % SIT;
  if (u < 3.4) return 0;
  if (u < 3.85) return smooth((u - 3.4) / 0.45);
  if (u < 5.25) return 1;
  if (u < 5.65) return 1 - smooth((u - 5.25) / 0.4);
  return 0;
};
const HIP = 3.8; // the hips above the ground

// The tail: a chain of thin segments with round ends, unoutlined (an outline on each would ring
// it like a rat's tail), each hung from the end of the one before: a soft upward curve hooking at
// the tip, a wave rolling down it (slower standing, quicker scurrying), trailing the body's moves.
const TAIL = [
  [2.6, 1.5, 1.3],
  [2.6, 1.3, 1.1],
  [2.6, 1.1, 0.95],
  [2.6, 0.95, 0.8],
  [2.2, 0.8, 0.6],
];
const tailSeg = (i) =>
  sprite(`rig|hm|tail|${i}`, () => {
    const [len, w0, w1] = TAIL[i];
    return { w: Math.ceil(len + 4), h: 4, res: 2, soft: 'cel', crisp: true, bare: true, pad: 2, shapes: [E(1, 2, w0 / 2, w0 / 2, TAILC), T([[1, 2 - w0 / 2], [1 + len, 2 - w1 / 2], [1 + len, 2 + w1 / 2], [1, 2 + w0 / 2]], TAILC), E(1 + len, 2, w1 / 2, w1 / 2, TAILC), F(T([[1, 2 - w0 / 2 + 0.15], [1 + len, 2 - w1 / 2 + 0.15], [1 + len, 2 - w1 / 2 + 0.4], [1, 2 - w0 / 2 + 0.45]], '#f6c4a4'))] };
  });
function tailParts() {
  return TAIL.map((seg, i) => ({
    name: `tail${i}`,
    parent: i ? `tail${i - 1}` : 'torso',
    s: () => tailSeg(i),
    pivot: [1, 2],
    at: i ? () => [TAIL[i - 1][0], 0] : () => [-4.6, -1.4],
    rot: (S, a) => {
      const w = a.walkW;
      // (Each segment curls a little more upward than the one before, so it hooks at the tip; the
      // wave lags a little more down each one, so it rolls down the tail. Scurrying, it lifts and
      // the wave quickens.)
      const wave = Math.sin(a.t * (1.6 + w * 1.4) - i * 0.6) * (2.6 + w * 1.4);
      return (i ? -6 + wave : 184 + w * 5 + S.tail + S.sit * 18 + wave) * D2R;
    },
  }));
}

export const harvmouseRig = makeRig({
  w: 30,
  h: 26,
  soft: true,
  stride: STRIDE,
  recover: 0.5,
  springs: {
    // (Springy, so each move overshoots a touch and settles: that's its bounce.)
    tilt: [150, 13],
    lift: [200, 14],
    x: [220, 18],
    sit: [130, 10],
    head: [130, 11],
    nib: [500, 20],
    sniff: [500, 22],
    look: [70, 11],
    // Loose: the ears and tail jiggle on after every move.
    earN: [70, 3.5],
    earF: [70, 3.5],
    tail: [50, 8],
  },
  fast: ['tilt', 'x', 'head'],
  kick: { tilt: -220, earN: 400, earF: 400, tail: 160 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 0.61;
    const u = stepPhase(m, a);
    a.hmU = u;
    // Idle: a breath, and the sit-up with its nibbling.
    const sit = sitOf(t);
    const nib = sit > 0.6 ? Math.sin(t * 9) : 0;
    // (And now and then a happy little ear wiggle.)
    const wig = (t % 5.3) < 0.7 ? Math.sin((t % 5.3) * 14) * Math.sin(((t % 5.3) / 0.7) * Math.PI) * 0.7 : 0;
    // (A sniff: quick little twitches of the nose in bursts, every 1.7 s or so; more often, lighter,
    // while it scurries. A slow weight shift and, now and then, a look up and about.)
    const su = t % 2.4;
    const sniffing = su < 0.7 ? Math.sin(su * 22) * Math.sin((su / 0.7) * Math.PI) * 0.8 : 0;
    const shift = Math.sin(t * 0.9);
    const look = Math.max(0, Math.sin(t * 0.45 + 1.3) - 0.6) / 0.4;
    const idle = { tilt: wig * 1.5 + shift * 1.2 - look * 4, lift: (Math.sin(t * 2.2) + 1) * 0.25, x: shift * 0.3, sit, head: -sit * 6 + nib * 3 + wig * 3 - look * 10, nib, sniff: sniffing + nib * 0.6, look };
    // Walk: a little scamper. The body rocks with each stride (dipping at the front as the hind
    // paws push, rising as the front paws land) and bobs a hair; the head counters the rock a
    // little, so it rides steadier than the body.
    const bob = 0.5 - 0.5 * Math.cos(u * TAU);
    const rock = Math.sin(u * TAU - 0.4) * 2.2;
    const walk = { tilt: 3 + rock, lift: bob * 0.8, x: 0, sit: 0, head: 1 - rock * 0.7 - bob * 2, nib: 0, sniff: Math.sin(a.t * 11) * 0.35, look: 0 };
    // The pounce: crouched with a wiggle, then a lunge in with a bite.
    const antic = { tilt: -4 + Math.sin(a.t * 18) * 1.5, lift: -0.6, x: -2, sit: 0, head: -6, nib: 0, sniff: 1, look: 0 };
    const strike = { tilt: 10, lift: 2.2, x: 7, sit: 0, head: 12, nib: 0, sniff: 0, look: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow(S, a) {
    return {
      earN: -S.lift * 30 - S.tilt * 2.6 - S.x * 3 + S.nib * 4 + twitch(a.t, 3.4, 0) * -18,
      earF: -S.lift * 30 - S.tilt * 2.6 - S.x * 3 - S.nib * 4 + twitch(a.t, 4.1, 1.3) * -16,
      tail: S.tilt * 1.2 - S.lift * 5,
    };
  },
  parts: [
    // The paws (far, then near), peeking out under the body's fringe, so drawn before it.
    { name: 'hips', parent: null, at: (S) => [S.x, -HIP] },
    pawPartDef(PAWS[0], true),
    pawPartDef(PAWS[1], true),
    pawPartDef(PAWS[2], false),
    pawPartDef(PAWS[3], false),
    // The body: it rocks and sits up about its hips (the hind feet stay on the ground).
    { name: 'torso', parent: null, at: (S) => [S.x, -S.lift - HIP], rot: (S) => (S.tilt - S.sit * 40) * D2R },
    // The tail from its root at the back, flowing in a slow wave that runs down it.
    ...tailParts(),
    { name: 'body', parent: 'torso', s: bodyPart, pivot: [4, 9.6] },
    { name: 'neck', parent: 'torso', at: () => [9.6, -3.6], rot: (S) => (S.head + S.sit * 36) * D2R },
    { name: 'earF', parent: 'neck', s: () => earPart(true), pivot: [2.6, 4.6], at: () => [-0.8, -7.2], rot: (S) => (-14 + S.earF) * D2R },
    { name: 'head', parent: 'neck', s: headPart, pivot: [3, 8] },
    { name: 'face', parent: 'neck', s: (a) => facePart(faceOf(a)), pivot: [6.5, 5], at: () => [3.6, -3] },
    { name: 'nose', parent: 'neck', s: nosePart, pivot: [2.4, 2.5], at: (S) => [9.1 + S.sniff * 0.25, -2.4 - Math.abs(S.sniff) * 0.2], rot: (S) => S.sniff * 7 * D2R },
    { name: 'earN', parent: 'neck', s: () => earPart(false), pivot: [2.6, 4.6], at: () => [1.8, -6.6], rot: (S) => (6 + S.earN) * D2R },
    // The paws with the grain, at its chest, only while it sits up.
    { name: 'paws', parent: 'torso', s: pawsPart, pivot: [3, 3], at: () => [11, -0.4], rot: (S) => (S.sit * 40 + S.nib * 4) * D2R, alpha: (a, S) => Math.max(0, (S.sit - 0.4) / 0.6) },
  ],
});

// ---------- Stills ----------

const shift = (shapes, dx, dy) => shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: 0, y: 0, pts: s.pts.map(([x, y]) => [x + (s.x ?? 0) + dx, y + (s.y ?? 0) + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
export function harvmouseStill(pose, f, mood) {
  const fm = mood === 'dead' ? 'dead' : MOODS.has(mood) ? mood : 'idle';
  const ox = 12;
  const gy = 24;
  const hy = gy - HIP;
  const nx = ox + 9.6;
  const ny = hy - 3.6;
  const tail = [];
  for (let i = 0; i < 12; i++) {
    const u = i / 11;
    tail.push([ox - 4.4 - u * 13, hy - 1.2 - Math.sin(u * Math.PI) * 3 + u * 1.5]);
  }
  return {
    w: 34,
    h: 26,
    res: 3,
    shapes: [
      ...shift(pawShapes(true, true), ox - 0.4 - 0.8, gy - 1.9 - 0.3 + 0.3),
      ...shift(pawShapes(true, false), ox + 8 - 0.8, gy - 1.9 - 0.3 + 0.3),
      ...stroke(tail, 1.1, TAILC, false),
      ...shift(bodyShapes(), ox - 4, hy - 9.6),
      ...shift(earShapes(true), nx - 0.8 - 2.6, ny - 7.2 - 4.6),
      ...shift(headShapes(), nx - 3, ny - 8),
      ...shift(faceShapes(fm), nx + 3.6 - 6.5, ny - 3 - 5),
      ...shift(noseShapes(), nx + 9.1 - 2.4, ny - 2.4 - 2.5),
      ...shift(earShapes(false), nx + 1.8 - 2.6, ny - 6.6 - 4.6),
      ...shift(pawShapes(false, true), ox + 1.2 - 0.8, gy - 1.9),
      ...shift(pawShapes(false, false), ox + 9.4 - 0.8, gy - 1.9),
    ],
  };
}
