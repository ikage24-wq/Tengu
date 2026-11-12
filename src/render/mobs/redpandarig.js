// The Red Panda (new for Mossy Woods' canopy, 2026-11-12, built from scratch; redone chibi the same
// day): a round, fluffy little red panda with a big head, a white-masked face with tear marks, big
// white-rimmed ears, and a huge ringed tail curling up behind. A live puppet on the boss rig
// (rig.js): every part drawn once and placed each frame, the loose bits on springs, nothing squashed
// or stretched, every part filtered smoothly.
//
//   walk    a soft, bouncy pad: no legs show, just round dark paws peeking out under its fluffy
//           fringe, stepping in diagonal pairs, stepped by the distance walked on an eased speed (a
//           planted paw stays exactly put, a lifted one tucks up under the fur and comes down
//           ahead); the body bobs on a springy lift that overshoots and settles with each step, the
//           big head bobs a beat behind, and the tail swishes in a slow wave.
//   idle    it breathes, looks about, flicks an ear, and every so often sits up on its hind legs
//           with its paws held at its chest to look around, then drops back down.
//   attack  the red panda's threat pose: it rears up tall, paws flung up beside its head, then
//           drops forward and bops you.
//   hit     knocked back on its lean, ears and tail flicking.
// `redpandaStill(pose, f, mood)` gives the still pictures (portraits, the book) from the same shapes.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, deadEye, tear, vein } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, makeRig, stateBlend, smooth, clamp, lerp, TAU } from './rig.js';
import { sprite } from '../pixel.js';

const RUST = ramp('#dd6a3c', { step: 9, turn: 10 });
const PALE = '#f6b082';
const DARK = ramp('#4a3034', { step: 7, turn: 10 });
const WHITE = '#fff6ea';
const TEARC = '#b04a2e';
const INK = '#221618';
const D2R = Math.PI / 180;

// ---------- Shapes ----------

// The body: short, round and fluffy, rust on top, a dark belly, and a soft fringe of fur all along
// the bottom that the legs hide under. Box 20 x 15; the hips at (5, 12).
const bodyShapes = () => {
  const out = [E(10.6, 11.6, 7.6, 3, DARK.base), E(10, 7.4, 8.8, 6.6, RUST.base)];
  for (const [x, y, r] of [[2, 6.6, 2.2], [2.6, 9.6, 2]]) out.push(E(x, y, r, r * 0.9, RUST.base));
  for (let i = 0; i < 6; i++) out.push(E(3.6 + i * 2.6, 13 + (i % 2) * 0.4, 1.7, 1.3, i % 2 ? DARK.base : DARK.sh));
  out.push(crescent(10, 7.4, 8.8, 6.6, RUST.sh, { k: 0.2, a0: 20, a1: 160 }), shine(10, 7.4, 8.8, 6.6, RUST.hi, 0, 0.8));
  for (const [x, y] of [[5, 4.4], [9, 2.8], [3.4, 7.6]]) out.push(...stroke([[x, y], [x - 1.2, y + 1.4]], 0.5, RUST.sh));
  return out;
};
// The head: big and round (it's mostly head), rust with a white muzzle and cheeks. Box 20 x 17; the
// neck at (4, 14).
const headShapes = () => [
  E(10, 8.6, 8.6, 7.6, RUST.base),
  E(11.8, 12.4, 3, 2.1, WHITE),
  E(16.4, 11.6, 3.8, 2.8, WHITE),
  crescent(10, 8.6, 8.6, 7.6, RUST.sh, { k: 0.2, a0: 100, a1: 200 }),
  F(E(8.6, 3.6, 3.2, 1.4, RUST.hi)),
];
// An ear: big and pointed-round, a white rim around a dark middle. Box 9 x 9; its root at (4.5, 8.4).
const earShapes = (far) => [
  T([[0.4, 8.4], [1.6, 3], [4.5, 0.4], [7.4, 3], [8.6, 8.4]], far ? '#e8dccc' : WHITE),
  T([[2.2, 8.4], [3, 4.4], [4.5, 2.6], [6, 4.4], [6.8, 8.4]], far ? '#4a2a26' : '#5c3028'),
];
// The face (unoutlined, over the head): big dark glossy eyes, white brows, the tear marks running
// down to the muzzle, a black nose and a small smile. Box 20 x 17, matching the head's box.
const MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout']);
const faceShapes = (mood) => {
  const out = [];
  out.push(...stroke([[11.4, 10.4], [11.2, 12], [12.2, 13.6]], 1, TEARC), ...stroke([[15.6, 10], [15.8, 11]], 0.8, TEARC));
  out.push(F(E(11.2, 5.4, 1.6, 0.9, WHITE)), F(E(15.4, 5.4, 1.3, 0.8, WHITE)));
  if (mood === 'dead') out.push(...deadEye(11.6, 8.2, 1.3, { c: INK, th: 0.5 }), ...deadEye(15.6, 8, 1.1, { c: INK, th: 0.5 }));
  else {
    const so = { iris: '#2a1a16', ink: INK, lid: 0, mood: mood === 'shout' ? 'angry' : mood };
    out.push(...simpleEye(11.6, 8.2, { ...so, s: -1, w: 1.7, h: 2.1 }), ...simpleEye(15.6, 8, { ...so, s: 1, w: 1.4, h: 1.8 }));
    out.push(F(E(9.6, 11, 1.3, 0.65, '#ff9eae')));
  }
  out.push(E(19, 10.6, 1.2, 0.95, INK), F(E(18.7, 10.3, 0.45, 0.32, '#8a7a7a')));
  if (mood === 'shout') out.push(F(E(17, 13.2, 1.4, 1.1, '#7a2a30')));
  else out.push(...stroke([[15.8, 12.6], [16.9, 13.3], [18.2, 12.4]], 0.4, INK));
  if (mood === 'hurt') out.push(...tear(12.2, 9.6, 0.7, { type: 'stream', len: 2 }));
  if (mood === 'angry') out.push(...vein(6, 3, 0.6));
  return out;
};
// A paw: a round dark paw with a hint of toes. Box 5 x 4; its middle at (2.5, 2).
const pawShapes = (far) => [E(2.5, 2, 2.2, 1.6, far ? DARK.sh : DARK.base), F(E(1.9, 1.4, 0.9, 0.45, far ? DARK.base : DARK.hi))];
// A ring of the tail: a fat fluffy disc, rust or pale. Box (2r + 2) square; its middle in the middle.
const TAILR = [3.4, 3.8, 4, 4, 3.8, 3.4, 3];
const TAILC = [RUST.base, PALE, RUST.base, PALE, RUST.base, PALE, RUST.base];
const ringShapes = (i) => {
  const r = TAILR[i];
  const c = TAILC[i];
  return [E(r + 1, r + 1, r, r * 0.94, c), E(r + 1 - r * 0.7, r + 1 + r * 0.4, r * 0.35, r * 0.3, c), F(E(r + 1 - 0.6, r + 1 - r * 0.4, r * 0.5, r * 0.25, i % 2 ? '#ffd8ba' : RUST.hi))];
};

const bodyPart = () => part('rp2|body', 20, 15, bodyShapes, 4);
const headPart = () => part('rp2|head', 20, 17, headShapes, 4);
const earPart = (far) => part(`rp2|ear|${far ? 1 : 0}`, 9, 9, () => earShapes(far), 3);
const facePart = (mood) => sprite(`rig|rp2|face|${mood}`, () => ({ w: 20, h: 17, res: 2, soft: 'cel', crisp: true, bare: true, pad: 4, shapes: faceShapes(mood) }));
const pawPart = (far) => part(`rp2|paw|${far ? 1 : 0}`, 5, 4, () => pawShapes(far), 3);
const ringPart = (i) => part(`rp2|ring|${i}`, Math.ceil(TAILR[i] * 2 + 2), Math.ceil(TAILR[i] * 2 + 2), () => ringShapes(i), 3);
// Every part again with no outline (`bare`), at the same size. The puppet is drawn twice: first
// all the outlined parts (their outlines grow outward from each shape), then all the bare ones over
// them in the same order, covering every outline that falls inside the panda. Only its outer edge
// keeps a line, and it reads as one soft fluffy shape, not a stack of pieces.
const bare = (key, w, h, shapes) => sprite(`rig|rp2|bare|${key}`, () => ({ w, h, res: 2, soft: 'cel', crisp: true, bare: true, pad: 4, shapes: shapes() }));
const bodyBare = () => bare('body', 20, 15, bodyShapes);
const headBare = () => bare('head', 20, 17, headShapes);
const earBare = (far) => bare(`ear${far ? 1 : 0}`, 9, 9, () => earShapes(far));
const pawBare = (far) => bare(`paw${far ? 1 : 0}`, 5, 4, () => pawShapes(far));
const ringBare = (i) => bare(`ring${i}`, Math.ceil(TAILR[i] * 2 + 2), Math.ceil(TAILR[i] * 2 + 2), () => ringShapes(i));

const faceOf = (a) => {
  if (a.face === 'dead') return 'dead';
  if (a.ph.strike > 0.25) return 'shout';
  if (a.ph.atk) return 'angry';
  return MOODS.has(a.face) ? a.face : 'idle';
};

// ---------- Motion ----------

const HIPH = 3.4; // the hips above the ground (the legs are short and hidden under the fur)
const HIPX = -5; // the hips, back from the middle
const STRIDE = 22;
const DUTY = 0.55; // the share of a cycle each paw stays planted
const R = (STRIDE * DUTY) / 2; // how far a planted paw travels back
const torsoAng = (S) => (S.tilt - S.stand * 62) * D2R;
const hipAt = (S) => [S.x + HIPX, -HIPH - S.lift];
const torsoPt = (S, lx, ly) => {
  const r = torsoAng(S);
  const [hx, hy] = hipAt(S);
  return [hx + lx * Math.cos(r) - ly * Math.sin(r), hy + lx * Math.sin(r) + ly * Math.cos(r)];
};
// The pad: one full cycle per STRIDE px walked, on its speed eased over a moment.
const stepPhase = (m, a) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(140, Math.abs(odo - (st.rpOdo ?? odo)) / dt);
  st.rpOdo = odo;
  st.rpV = (st.rpV ?? 0) + (raw - (st.rpV ?? 0)) * Math.min(1, dt * 4);
  st.rpU = ((st.rpU ?? 0) + (st.rpV / STRIDE) * dt) % 1;
  return st.rpU;
};
// A paw at phase u: planted (sliding back at exactly the walking speed, so it stays put on the
// ground), then tucked up under the fur and brought forward on an eased arc. [x off its rest, lift].
const pawAt = (u, ph) => {
  const q = (((u + ph) % 1) + 1) % 1;
  if (q < DUTY) return [R - (2 * R * q) / DUTY, 0];
  const s = (q - DUTY) / (1 - DUTY);
  return [-R + 2 * R * smooth(s), Math.sin(Math.PI * s) * 2.4];
};
// The paws: [x of its rest spot off the hips, phase, front?, far?]. Diagonal pairs.
const PAWS = {
  HF: [-0.6, 0.5, false, true],
  FF: [9.6, 0, true, true],
  HN: [1.2, 0, false, false],
  FN: [11.4, 0.5, true, false],
};
// Where a paw is: on the ground, stepping; reared up, the front paws held at the chest or flung up
// beside the head (the threat pose); dropping down from it they bop forward.
const pawPos = (S, a, key) => {
  const [rx, ph, front, far] = PAWS[key];
  const w = a.walkW;
  const [dx, lift] = pawAt(a.rpU ?? 0, ph);
  let x = hipAt(S)[0] + rx + dx * w;
  let y = -1.6 - lift * w;
  if (front) {
    const up = clamp(S.stand, 0, 1);
    const chest = torsoPt(S, 12.4 - (far ? 1 : 0), 1.6);
    const flung = torsoPt(S, 15.4 - (far ? 2 : 0), far ? -7 : -4);
    x = lerp(x, lerp(chest[0], flung[0], S.arms), up) + S.bop * 4;
    y = lerp(y, lerp(chest[1], flung[1], S.arms), up);
  }
  return [x, y];
};
const pawDef = (key, after, fill) => {
  const [, , front, far] = PAWS[key];
  return {
    name: `paw${key}${after ? 'x' : ''}${fill ? 'b' : ''}`,
    parent: null,
    s: () => (fill ? pawBare(far) : pawPart(far)),
    pivot: [2.5, 2],
    at: (S, a) => pawPos(S, a, key),
    // (A front paw comes round in front of the body as it rears up.)
    alpha: front ? (a, S) => (after ? clamp((S.stand - 0.3) * 3, 0, 1) : 1 - clamp((S.stand - 0.3) * 3, 0, 1)) : undefined,
  };
};
// The head on its neck at the front of the body; reared up, it turns back level to keep looking ahead.
const NECK = [11, -5.4];
const headAng = (S) => torsoAng(S) + (S.head + S.stand * 56) * D2R;
// The tail: a chain of fat rings from its root at the back, curling up behind, a slow wave rolling
// down it (quicker as it walks), lagging the body's moves.
const TAILROOT = [-3.4, -3.6];
const tailParts = () =>
  TAILR.map((r, i) => ({
    name: `tail${i}`,
    parent: i ? `tail${i - 1}` : 'torso',
    s: () => ringPart(i),
    pivot: [r + 1, r + 1],
    at: i ? () => [2.3, 0] : () => TAILROOT,
    rot: (S, a) => {
      // (A heavy bushy tail: one slow, steady sway from the root (never quickening, so it can't
      // jump between paces), each ring lagging only a hair behind the one before, and a soft dip
      // with each step while it walks. Calm, never whippy.)
      const w = a.walkW;
      const sway = Math.sin(a.t * 1.1 - i * 0.35);
      const step = Math.sin((a.rpU ?? 0) * TAU * 2 - 1 - i * 0.3) * w;
      return (i ? 9 + sway * 0.9 + step * 0.6 + S.tail * 0.08 : 200 + S.tail + sway * 4 + step * 2.5) * D2R;
    },
  }));

// The idle loop, every 12 s: a look about, an ear flick, a sit-up to look around.
const LOOP = 12;
const hold = (u, a, b, c, d) => (u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u < c ? 1 : 1 - smooth((u - c) / (d - c)));
const twitch = (t, every, off) => {
  const u = (t + off) % every;
  return u < 0.3 ? Math.sin((u / 0.3) * Math.PI) : 0;
};

export const redpandaRig = makeRig({
  w: 36,
  h: 32,
  soft: true,
  stride: STRIDE,
  recover: 0.6,
  springs: {
    x: [200, 18],
    // (Springy: each step's bob overshoots a touch and settles. That's its bounce.)
    lift: [170, 9],
    tilt: [140, 11],
    stand: [90, 12],
    // The big head rides a beat behind the body.
    head: [80, 8],
    arms: [140, 12],
    bop: [400, 26],
    earN: [90, 5],
    earF: [90, 5],
    tail: [45, 10],
  },
  fast: ['x', 'stand', 'arms', 'bop'],
  kick: { tilt: -200, earN: 380, earF: 380, tail: 110 },
  turnKick: { tilt: 120, tail: 80, earN: 160 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 1.37;
    a.rpU = stepPhase(m, a);
    const lu = t % LOOP;
    const look = hold(lu, 1.2, 2, 3.2, 4);
    const rear = hold(lu, 6, 6.7, 9, 9.7);
    const peer = rear > 0.9 ? Math.sin((lu - 6.7) * 1.4) : 0;
    const breath = Math.sin(t * 1.5);
    const idle = { x: 0, lift: breath * 0.15, tilt: breath * 0.5, stand: rear, head: -look * 12 + peer * 9 + Math.sin(t * 0.6) * 2, arms: 0, bop: 0 };
    // The pad: a soft bob up off each planted pair, a gentle sway; the head nods a beat behind.
    const p = a.rpU * TAU * 2;
    const walk = { x: 0, lift: 0.4 + (0.5 - 0.5 * Math.cos(p)) * 0.9, tilt: Math.sin(p - 0.5) * 1.6, stand: 0, head: 2 + Math.sin(p - 1.2) * 3, arms: 0, bop: 0 };
    // The threat pose, then the bop.
    const antic = { x: -1, lift: 0, tilt: 0, stand: 1.05, head: -8, arms: 1, bop: 0 };
    const strike = { x: 6, lift: 0.6, tilt: 12, stand: 0, head: 6, arms: 0, bop: 1 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow(S, a) {
    return {
      earN: -S.tilt * 1.6 - S.lift * 9 + twitch(a.t, 4.3, 0) * -26,
      earF: -S.tilt * 1.6 - S.lift * 9 + twitch(a.t, 5.7, 2) * -22,
      tail: -S.tilt * 1 + S.stand * 30 - S.x * 1.5 - S.lift * 2,
    };
  },
  parts: [
    // First pass, outlined: the tail behind everything, the paws peeking from under the fringe,
    // the body over them, the ears and the big head.
    { name: 'torso', parent: null, at: (S) => hipAt(S), rot: (S) => torsoAng(S) },
    ...tailParts(),
    pawDef('HF'),
    pawDef('FF'),
    pawDef('HN'),
    pawDef('FN'),
    { name: 'body', parent: 'torso', s: bodyPart, pivot: [5, 12] },
    { name: 'neck', parent: null, at: (S) => torsoPt(S, ...NECK), rot: (S) => headAng(S) },
    { name: 'earF', parent: 'neck', s: () => earPart(true), pivot: [4.5, 8.4], at: () => [1.8, -11.8], rot: (S) => (-24 + S.earF) * D2R },
    { name: 'head', parent: 'neck', s: headPart, pivot: [4, 14] },
    { name: 'earN', parent: 'neck', s: () => earPart(false), pivot: [4.5, 8.4], at: () => [8, -14], rot: (S) => (8 + S.earN) * D2R },
    // Second pass, bare, in the same order over them (see `bare` above), with the face on the
    // head and the front paws in front while it's reared up.
    ...TAILR.map((r, i) => ({ name: `tailB${i}`, parent: `tail${i}`, s: () => ringBare(i), pivot: [r + 1, r + 1] })),
    pawDef('HF', false, true),
    pawDef('FF', false, true),
    pawDef('HN', false, true),
    pawDef('FN', false, true),
    { name: 'bodyB', parent: 'torso', s: bodyBare, pivot: [5, 12] },
    { name: 'earFB', parent: 'neck', s: () => earBare(true), pivot: [4.5, 8.4], at: () => [1.8, -11.8], rot: (S) => (-24 + S.earF) * D2R },
    { name: 'headB', parent: 'neck', s: headBare, pivot: [4, 14] },
    { name: 'face', parent: 'neck', s: (a) => facePart(faceOf(a)), pivot: [4, 14] },
    { name: 'earNB', parent: 'neck', s: () => earBare(false), pivot: [4.5, 8.4], at: () => [8, -14], rot: (S) => (8 + S.earN) * D2R },
    pawDef('FF', true, true),
    pawDef('FN', true, true),
  ],
});

// ---------- Stills ----------

const shift = (shapes, dx, dy) => shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: 0, y: 0, pts: s.pts.map(([x, y]) => [x + (s.x ?? 0) + dx, y + (s.y ?? 0) + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));

// Standing on all fours, tail curled up behind.
export function redpandaStill(pose, f, mood) {
  const fm = mood === 'dead' ? 'dead' : MOODS.has(mood) ? mood : 'idle';
  const S = { x: 0, lift: 0, tilt: 0, stand: 0, head: 0, arms: 0, bop: 0 };
  const A = { walkW: 0, rpU: 0 };
  const [hx, hy] = hipAt(S);
  const [nx, ny] = torsoPt(S, ...NECK);
  const tail = [];
  let [tx, ty] = [hx + TAILROOT[0], hy + TAILROOT[1]];
  let ang = 200;
  TAILR.forEach((r, i) => {
    tail.push(...shift(ringShapes(i), tx - r - 1, ty - r - 1));
    ang += 9;
    tx += Math.cos(ang * D2R) * 2.3;
    ty += Math.sin(ang * D2R) * 2.3;
  });
  const paw = (key) => {
    const [x, y] = pawPos(S, A, key);
    return shift(pawShapes(PAWS[key][3]), x - 2.5, y - 2);
  };
  return {
    w: 44,
    h: 36,
    res: 3,
    shapes: shift(
      [
        ...tail,
        ...paw('HF'),
        ...paw('FF'),
        ...paw('HN'),
        ...paw('FN'),
        ...shift(bodyShapes(), hx - 5, hy - 12),
        ...shift(earShapes(true), nx + 1.8 - 4.5, ny - 11.8 - 8.4),
        ...shift(headShapes(), nx - 4, ny - 14),
        ...shift(faceShapes(fm), nx - 4, ny - 14),
        ...shift(earShapes(false), nx + 8 - 4.5, ny - 14 - 8.4),
      ],
      20,
      34,
    ),
  };
}
