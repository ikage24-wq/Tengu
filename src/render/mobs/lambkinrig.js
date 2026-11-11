// The Lambkin (new for Clover Hills' Hayloft Ridge, 2026-11-11, built from scratch): a little lamb.
// A live puppet on the boss rig (rig.js): every part drawn once and placed each frame, the loose
// bits on springs, nothing squashed or stretched, every part filtered smoothly.
//
// Its look: a round cloud of curly cream wool, a soft peach face with big shiny eyes and a pink nose
// peeking out under a woolly fringe, floppy ears, a daisy tucked by its ear, a thin red ribbon
// with a little gold bell, a puff of a tail, and four thin legs with dark hooves.
//   idle    it chews, flicks an ear, wiggles its tail, looks about, now and then dips its head to
//           nibble the grass, and now and then gives a happy little skip in place (lambs do).
//   walk    a prancing little trot: diagonal pairs of legs, each hoof planted while it pushes back
//           (so it stays put) and lifted in a soft arc with its knee bending as it comes forward;
//           the body vaults over the planted legs, rising and dipping with each step, the head
//           nodding; the wool, tail, ears and bell jiggle after it. Never a hop.
//   attack  it rears back with its head up, then charges in head down for a headbutt.
//   hit     knocked back on its tilt spring, the wool and ears bouncing.
// `lambkinStill(pose, f, mood)` gives the still pictures (portraits, the book) from the same shapes.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, simpleMouth, deadEye, tear, vein } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, makeRig, stateBlend, smooth, TAU } from './rig.js';
import { sprite } from '../pixel.js';

const WOOL = ramp('#fff6ec', { step: 6, turn: 26 });
const FACE = ramp('#fbe0cf', { step: 7, turn: 22 });
const LEG = ramp('#d0a58a', { step: 8, turn: 16 });
const HOOF = '#6a4a3e';
const RIBBON = '#ff5f7e';
const BELL = '#ffcf4a';
const INK = '#2e1e18';
const D2R = Math.PI / 180;

// ---------- Shapes ----------

// The fleece: a round cloud, its rim a ring of soft bumps (so its outline reads as wool), little
// curls swirled in, shaded underneath, lit on top. Box 26 x 18, centre (13, 9.6).
const woolShapes = () => {
  const out = [E(13, 9.6, 11, 6.6, WOOL.base)];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    out.push(E(13 + Math.cos(a) * 10.2, 9.6 + Math.sin(a) * 6, 2.8, 2.6, WOOL.base));
  }
  out.push(crescent(13, 9.6, 11.6, 7.2, WOOL.sh, { k: 0.26, a0: 25, a1: 155 }), shine(13, 9.6, 11, 6.6, '#ffffff', 0, 0.8));
  // Curls all over, in rows, each a little swirl: warm shade on its lower side, a white glint on
  // its upper side where the light catches it (brighter toward the top of the fleece).
  const CURL = '#efd6c8';
  for (const [x, y, r] of [
    [6, 5.4, 1.6], [10, 4.2, 1.7], [14.4, 4, 1.7], [18.6, 5, 1.6],
    [4, 8.8, 1.5], [8.2, 8, 1.7], [12.6, 7.6, 1.8], [17, 8, 1.7], [21, 8.6, 1.5],
    [6.2, 12, 1.6], [10.6, 11.6, 1.7], [15, 11.6, 1.7], [19.2, 11.6, 1.5],
  ]) {
    out.push(crescent(x, y, r, r * 0.9, CURL, { k: 0.42, a0: 10, a1: 200 }));
    if (y < 9) out.push(F(crescent(x, y, r * 0.9, r * 0.8, '#ffffff', { k: 0.3, a0: 200, a1: 300 })));
  }
  return out;
};
// The tail: a little puff. Box 6 x 6, its root at (4.6, 3.4).
const tailShapes = () => [E(3, 3, 2.6, 2.4, WOOL.base), F(E(2.4, 2.2, 1, 0.7, '#ffffff'))];
// The head, facing right: a peach face, longer at the muzzle, a woolly fringe on top, a daisy
// tucked behind the near ear. Box 16 x 14, the neck at (4, 12).
const headShapes = () => [
  E(7.6, 7.8, 5.4, 5.4, FACE.base),
  E(10.6, 9.8, 3.4, 2.8, FACE.base),
  crescent(7.6, 7.8, 5.4, 5.4, FACE.sh, { k: 0.2, a0: 40, a1: 160 }),
  F(E(11.2, 10.4, 2.2, 1.4, FACE.hi)),
  E(4.6, 2.6, 2.6, 2.4, WOOL.base),
  E(7.8, 1.8, 2.8, 2.5, WOOL.base),
  E(10.6, 2.8, 2.2, 2, WOOL.base),
  E(2.8, 4.6, 1.9, 1.8, WOOL.base),
  F(E(7.2, 1.2, 1.2, 0.7, '#ffffff')),
  crescent(4.6, 2.6, 1.6, 1.4, '#efd6c8', { k: 0.42, a0: 10, a1: 200 }),
  crescent(7.8, 1.8, 1.7, 1.5, '#efd6c8', { k: 0.42, a0: 10, a1: 200 }),
  crescent(10.6, 2.8, 1.4, 1.2, '#efd6c8', { k: 0.42, a0: 10, a1: 200 }),
];
// The face (unoutlined, on the head): big glossy eyes, pink cheeks, the nose and a little mouth.
// Box 12 x 10, centre (6, 5).
const faceShapes = (mood) => {
  const out = [];
  if (mood === 'dead') out.push(...deadEye(4.2, 4.6, 1, { c: INK, th: 0.5 }), ...deadEye(9, 4.5, 1.1, { c: INK, th: 0.5 }));
  else {
    const so = { iris: '#4a2a1c', ink: INK, lid: 0, mood: mood === 'shout' ? 'angry' : mood };
    out.push(...simpleEye(4.2, 4.6, { ...so, s: -1, w: 1.4, h: 1.9 }), ...simpleEye(9, 4.5, { ...so, s: 1, w: 1.6, h: 2.1 }));
    out.push(F(E(3, 7.1, 1.1, 0.6, '#ff9eb0')), F(E(10, 7.3, 1.1, 0.6, '#ff9eb0')));
  }
  out.push(E(11, 6.6, 1, 0.8, '#ff8fa8'), F(E(10.7, 6.3, 0.35, 0.3, '#ffffff')));
  out.push(...simpleMouth(9.8, 8.2, { k: 0.6, mood: mood === 'idle' || mood === 'blink' ? 'happy' : mood, lip: INK }));
  if (mood === 'hurt') out.push(...tear(9, 5.6, 0.7, { type: 'stream', len: 2 }));
  if (mood === 'angry') out.push(...vein(2, 1.2, 0.6));
  return out;
};
// An ear from its root at (0.6, 1.6), pointing out +x (mirrored, -x, from (7.4, 1.6)): soft and
// floppy, pink inside. Both hang back and droop from the sides of its head.
const earShapes = (dir) => {
  const p = (x, y) => [dir > 0 ? x : 8 - x, y];
  return [T([p(0.6, 0.4), p(3.6, 0.2), p(6.6, 1), p(7.6, 2), p(6.4, 3), p(3.4, 3.2), p(0.6, 2.8)].map(([x, y]) => [x, y]), FACE.base), F(T([p(1.4, 1.1), p(5.6, 1.3), p(6.4, 2), p(5.2, 2.5), p(1.4, 2.2)].map(([x, y]) => [x, y]), '#f6a8b4'))];
};
// The daisy behind its ear. Box 6 x 6, centre (3, 3).
const daisyShapes = () => {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    out.push(E(3 + Math.cos(a) * 1.15, 3 + Math.sin(a) * 1.15, 0.85, 0.8, '#ffffff'));
  }
  out.push(E(3, 3, 0.8, 0.8, '#ffd23a'), F(E(2.8, 2.8, 0.3, 0.28, '#fff3a8')));
  return out;
};
// The collar: a thin red ribbon round its neck (tucked behind its head; no bow, so nothing sits
// over the bell). Box 8 x 3, centre (4, 1.5).
const collarShapes = () => [T([[0.4, 0.6], [7.6, 1], [7.6, 2.4], [0.4, 2.1]], RIBBON), F(T([[0.6, 0.8], [7.4, 1.2], [7.4, 1.5], [0.6, 1.2]], '#ff9ab0'))];
// The bell, hanging from its loop at (2, 0.4): a round gold bell, a slit and a shine.
// (A real little bell: a domed top flaring out to a rim, the clapper peeking out below, a shine
// down its side. Box 5 x 6, hung from its loop at (2.5, 0.5).)
const bellShapes = () => {
  const dome = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    dome.push([2.5 + Math.cos(a) * 1.75, 3.2 + Math.sin(a) * 1.9]);
  }
  return [
    E(2.5, 0.9, 0.6, 0.55, '#c8902a'),
    E(2.5, 5.2, 0.6, 0.5, '#9a6a1c'),
    T([...dome, [4.25, 4], [4.6, 4.7], [0.4, 4.7], [0.75, 4]], BELL),
    F(T([[0.6, 4.2], [4.4, 4.2], [4.6, 4.7], [0.4, 4.7]], '#e0a630')),
    F(T([[1.4, 2.4], [1.9, 1.8], [2, 3.8], [1.4, 3.9]], '#fff6c8')),
  ];
};
// A leg in two pieces, each from its top joint at (1.6, 0.6) pointing +y: the upper with a woolly
// cuff (tucked under the fleece), the lower with a round knee cap at the top (so the joint reads
// as one smooth leg, no seam) and a dark hoof below its ankle.
const UPPER = 3.9;
const LOWER = 3.9;
const ANKLE = 1.2; // the hoof below the ankle
const upperShapes = (far) => [
  ...stroke([[1.6, 0.6], [1.6, UPPER + 0.6]], 2.2, far ? LEG.sh : LEG.base, false),
  F(T([[0.9, 1], [1.3, 1], [1.3, UPPER + 0.4], [0.9, UPPER + 0.4]], far ? LEG.base : LEG.hi)),
  E(1.6, 1.8, 2.1, 2, far ? WOOL.sh : WOOL.base),
];
const lowerShapes = (far) => [
  E(1.6, 0.6, 1.2, 1.2, far ? LEG.sh : LEG.base),
  ...stroke([[1.6, 0.6], [1.6, LOWER + 0.4]], 1.9, far ? LEG.sh : LEG.base, false),
  F(T([[1, 1], [1.35, 1], [1.35, LOWER + 0.1], [1, LOWER + 0.1]], far ? LEG.base : LEG.hi)),
  T([[0.4, LOWER + 0.2], [2.8, LOWER + 0.2], [3, LOWER + 0.6 + ANKLE], [0.2, LOWER + 0.6 + ANKLE]], far ? '#4a332c' : HOOF),
  F(T([[0.7, LOWER + 0.4], [2, LOWER + 0.4], [1.9, LOWER + 0.8], [0.7, LOWER + 0.8]], '#a07a6a')),
];

// ---------- Parts ----------

const MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout']);
const woolPart = () => part('lk|wool', 26, 18, woolShapes, 4);
const tailPart = () => part('lk|tail', 6, 6, tailShapes, 4);
const headPart = () => part('lk|head', 16, 14, headShapes, 4);
const facePart = (mood) => sprite(`rig|lk|face|${mood}`, () => ({ w: 12, h: 10, res: 2, soft: 'cel', crisp: true, bare: true, pad: 4, shapes: faceShapes(mood) }));
const earPart = (dir) => part(`lk|ear|${dir}`, 8, 4, () => earShapes(dir), 4);
const daisyPart = () => part('lk|daisy', 6, 6, daisyShapes, 4);
const collarPart = () => part('lk|collar', 8, 3, collarShapes, 4);
const bellPart = () => part('lk|bell', 5, 6, bellShapes, 4);
const upperPart = (far) => part(`lk|upper|${far ? 1 : 0}`, 4, 7, () => upperShapes(far), 4);
const lowerPart = (far) => part(`lk|lower|${far ? 1 : 0}`, 4, 8, () => lowerShapes(far), 4);

const faceOf = (a) => {
  if (a.face === 'dead') return 'dead';
  if (a.ph.strike > 0.3) return 'shout';
  if (a.ph.atk) return 'angry';
  return MOODS.has(a.face) ? a.face : 'idle';
};

// ---------- The trot ----------

// One cycle per STRIDE px walked, on its speed eased over a moment, so the pace never twitches.
// Diagonal pairs move together (near fore with far hind). Each hoof spends half the cycle planted,
// sliding back under the body at the body's own speed (so it stays put on the ground), and half
// lifted in a soft prancing arc, its knee bending as it comes forward. The planted legs stay
// nearly straight and the body vaults over them, highest as they pass under it and lowest as the
// hooves land: that rise and dip is its bounce.
const STRIDE = 16;
const REACH = 3.8;
const LEGR = UPPER + LOWER - 0.2; // a planted leg's reach, hip to ankle
const BODY = LEGR + ANKLE + 5; // the body's middle above the ground at rest
const stepPhase = (m, a) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(160, Math.abs(odo - (st.lkOdo ?? odo)) / dt);
  st.lkOdo = odo;
  st.lkV = (st.lkV ?? 0) + (raw - (st.lkV ?? 0)) * Math.min(1, dt * 5);
  st.lkU = ((st.lkU ?? 0) + (st.lkV / STRIDE) * dt) % 1;
  return st.lkU;
};
const easeIO = (u) => u * u * (3 - 2 * u);
// Where a hoof is at cycle point u: [x from its hip, height off the ground].
const hoofAt = (u) => {
  if (u < 0.5) return [REACH - (u / 0.5) * 2 * REACH, 0];
  const s = (u - 0.5) / 0.5;
  return [-REACH + easeIO(s) * 2 * REACH, Math.pow(Math.sin(Math.PI * s), 0.8) * 2];
};
// How far the body sits below its rest height so the planted legs (nearly straight) reach the
// ground: it vaults over them.
const vaultAt = (u) => {
  const [fx] = hoofAt(u % 0.5);
  return LEGR - Math.sqrt(Math.max(0, LEGR * LEGR - fx * fx));
};
// The four legs: [name, hip x on the body, phase (in cycles), front?].
const LEGS = [
  ['bf', -6.4, 0.5, false],
  ['ff', 5.4, 0, true],
  ['bn', -5, 0, false],
  ['fn', 6.8, 0.5, true],
];
// Two-bone leg from hip to ankle: front knees bend forward, hind hocks bend back.
const leg = (hx, hy, fx, fy, front) => {
  const dx = fx - hx;
  const dy = fy - hy;
  const d = Math.min(UPPER + LOWER - 0.02, Math.max(0.5, Math.hypot(dx, dy)));
  const al = Math.atan2(dy, dx);
  const be = Math.acos(Math.min(1, Math.max(-1, (UPPER * UPPER + d * d - LOWER * LOWER) / (2 * UPPER * d))));
  const k = front ? al - be : al + be;
  const kx = hx + Math.cos(k) * UPPER;
  const ky = hy + Math.sin(k) * UPPER;
  return { kx, ky, up: Math.atan2(-(kx - hx), ky - hy), lo: Math.atan2(-(fx - kx), fy - ky) };
};
// All four legs for this frame, in the body's (rocked) space, worked out once per frame: each
// ankle's target on the ground is turned into that space, so the legs stand upright however the
// body rocks.
const legsOf = (a, S) => {
  const w = a.walkW;
  const u = a.lkU ?? 0;
  const c = Math.cos(-S.tilt * D2R);
  const sn = Math.sin(-S.tilt * D2R);
  const out = {};
  for (const [k, x0, phase, front] of LEGS) {
    const [fx, fy] = hoofAt((u + phase) % 1);
    // The ankle's target relative to the body's middle (on a skip the hooves tuck up a little).
    const wx = x0 + 0.4 + fx * w;
    const wy = BODY + S.lift - ANKLE - fy * w - S.skip * 1.8;
    const tx = wx * c - wy * sn;
    const ty = wx * sn + wy * c;
    out[k] = { ...leg(x0, 5, tx, ty, front), hx: x0, hy: 5 };
  }
  return out;
};
const legAt = (a, S, k) => {
  if (a.lkK !== a.t) {
    a.lkK = a.t;
    a.lkL = legsOf(a, S);
  }
  return a.lkL[k];
};

// A happy skip every 7 s (idle only): up and down in 0.5 s, eased.
const SKIP = 7;
const skipOf = (t) => {
  const u = t % SKIP;
  return u > 5.4 && u < 5.9 ? Math.sin(((u - 5.4) / 0.5) * Math.PI) : 0;
};

export const lambkinRig = makeRig({
  w: 34,
  h: 34,
  soft: true,
  stride: STRIDE,
  recover: 0.55,
  springs: {
    tilt: [150, 16],
    lift: [300, 22],
    x: [180, 18],
    head: [140, 13],
    chew: [400, 20],
    skip: [300, 24],
    // Loose: the fleece's bounce, the ears, the tail and the bell all jiggle on after a move.
    wool: [80, 5],
    earN: [70, 4.5],
    earF: [70, 4.5],
    tail: [80, 4],
    bell: [60, 3.5],
  },
  fast: ['tilt', 'x', 'head'],
  kick: { tilt: -260, wool: 300, earN: 500, earF: 500, bell: 600 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 0.47;
    const u = stepPhase(m, a);
    a.lkU = u;
    // Idle: chewing, a look about now and then, the happy skip, and every 10 s it dips its head
    // to nibble the grass for a moment (leaning forward into it), then lifts it, still chewing.
    const sk = skipOf(t);
    const gu = t % 10;
    const graze = gu > 7.2 && gu < 9.2 ? Math.min(smooth((gu - 7.2) / 0.45), 1 - smooth((gu - 8.75) / 0.45)) : 0;
    const chew = Math.sin(t * (graze > 0.5 ? 12 : 9)) * (Math.sin(t * 0.8) > -0.2 || graze > 0 ? 1 : 0);
    const look = Math.max(0, Math.sin(t * 0.5 + 2) - 0.7) / 0.3;
    const idle = { tilt: -sk * 3 + graze * 6, lift: (Math.sin(t * 1.4) + 1) * 0.2 + sk * 4.2, x: graze * 0.6, head: chew * (1.6 + graze * 1.4) - look * 12 * (1 - graze) - sk * 8 + graze * 34, chew, skip: sk };
    // Walk: the body vaults over its planted legs (highest as they pass under it, lowest as the
    // hooves land), a little rock, the head nodding with each step.
    const v = vaultAt(u);
    const walk = { tilt: Math.sin(u * TAU) * 1.2, lift: -v, x: 0, head: 2 + v * 3, chew: 0, skip: 0 };
    // The headbutt: reared back with its head up, then a charge, head down.
    const antic = { tilt: -8, lift: 0.8, x: -2.6, head: -22, chew: 0, skip: 0 };
    const strike = { tilt: 6, lift: 0, x: 5.4, head: 26, chew: 0, skip: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow(S, a) {
    const t = a.t;
    // (A tail wiggle in bursts while it stands.)
    const wig = (t % 2.3 < 0.6 ? Math.sin(t * 30) * 22 : 0) * (1 - a.walkW);
    const flick = (t * 0.9) % 3.7 < 0.2 ? 30 : 0;
    return {
      wool: S.lift * 2.2 - S.tilt * 0.3,
      earN: -S.lift * 16 - S.tilt * 1.5 + S.head * 0.4 - flick,
      earF: -S.lift * 16 - S.tilt * 1.5 + S.head * 0.4,
      tail: -S.lift * 14 + S.tilt * 2 + wig,
      bell: -S.tilt * 2.4 - S.x * 3 + S.lift * 8 + S.head * 0.6,
    };
  },
  parts: [
    // The body (rocking about its middle) and what hangs from it; the far legs behind everything.
    { name: 'core', parent: null, at: (S) => [S.x, -S.lift - BODY], rot: (S) => S.tilt * D2R },
    ...legParts('bf', true),
    ...legParts('ff', true),
    { name: 'tail', parent: 'core', s: tailPart, pivot: [4.6, 3.4], at: () => [-10.6, -3.4], rot: (S) => S.tail * D2R },
    { name: 'neck', parent: 'core', at: () => [9.4, -3.6], rot: (S) => S.head * D2R },
    { name: 'earF', parent: 'neck', s: () => earPart(-1), pivot: [7.4, 1.6], at: () => [1.4, -7.8], rot: (S) => (-20 + S.earF) * D2R },
    ...legParts('bn', false),
    ...legParts('fn', false),
    { name: 'wool', parent: 'core', s: woolPart, pivot: [13, 9.6], at: (S) => [0, S.wool * 0.4] },
    { name: 'collar', parent: 'neck', s: collarPart, pivot: [4, 1.5], at: () => [1.4, -0.6], rot: () => -14 * D2R },
    { name: 'head', parent: 'neck', s: headPart, pivot: [4, 12] },
    { name: 'face', parent: 'neck', s: (a) => facePart(faceOf(a)), pivot: [6, 5], at: () => [4, -4.6] },
    // (The bell hangs from the ribbon under its chin, in front of everything there; it swings a
    // little, never wildly.)
    { name: 'bell', parent: 'neck', s: bellPart, pivot: [2.5, 0.5], at: () => [3.4, 0.4], rot: (S) => Math.max(-30, Math.min(30, S.bell)) * D2R },
    { name: 'earN', parent: 'neck', s: () => earPart(-1), pivot: [7.4, 1.6], at: () => [-1.4, -7.2], rot: (S) => (-48 + S.earN) * D2R },
    { name: 'daisy', parent: 'neck', s: daisyPart, pivot: [3, 3], at: () => [1.2, -8.6], rot: (S) => S.earN * 0.3 * D2R },
  ],
});

// One leg's two parts, hung from the body.
function legParts(k, far) {
  return [
    { name: `up${k}`, parent: 'core', s: () => upperPart(far), pivot: [1.6, 0.6], at: (S, a) => [legAt(a, S, k).hx, legAt(a, S, k).hy], rot: (S, a) => legAt(a, S, k).up },
    { name: `lo${k}`, parent: 'core', s: () => lowerPart(far), pivot: [1.6, 0.6], at: (S, a) => [legAt(a, S, k).kx, legAt(a, S, k).ky], rot: (S, a) => legAt(a, S, k).lo },
  ];
}

// ---------- Stills ----------

const shift = (shapes, dx, dy) => shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: 0, y: 0, pts: s.pts.map(([x, y]) => [x + (s.x ?? 0) + dx, y + (s.y ?? 0) + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
export function lambkinStill(pose, f, mood) {
  const fm = mood === 'dead' ? 'dead' : MOODS.has(mood) ? mood : 'idle';
  const ox = 16;
  const gy = Math.ceil(BODY) + 18;
  const cy = gy - BODY;
  const hy = cy + 5;
  const nx = ox + 9.4;
  const ny = cy - 3.6;
  const legStill = (x0, far) => [...shift(upperShapes(far), ox + x0 - 1.6, hy - 0.6), ...shift(lowerShapes(far), ox + x0 - 1.6, hy + UPPER - 0.6)];
  return {
    w: 36,
    h: Math.ceil(BODY) + 20,
    res: 3,
    shapes: [
      ...legStill(-6.4, true),
      ...legStill(5.4, true),
      ...shift(tailShapes(), ox - 10.6 - 4.6, cy - 3.4 - 3.4),
      ...shift(earShapes(-1), nx + 1.4 - 7.4, ny - 7.8 - 1.6),
      ...legStill(-5, false),
      ...legStill(6.8, false),
      ...shift(woolShapes(), ox - 13, cy - 9.6),
      ...shift(collarShapes(), nx + 1.4 - 4, ny - 0.6 - 1.5),
      ...shift(headShapes(), nx - 4, ny - 12),
      ...shift(faceShapes(fm), nx + 4 - 6, ny - 4.6 - 5),
      ...shift(bellShapes(), nx + 3.4 - 2.5, ny + 0.4 - 0.5),
      ...shift(earShapes(-1), nx - 1.4 - 7.4, ny - 7.2 - 1.6),
      ...shift(daisyShapes(), nx + 1.2 - 3, ny - 8.6 - 3),
    ],
  };
}
