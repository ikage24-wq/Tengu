// The Pumpkin Goblin (new for Clover Hills, 2026-11-11, built from scratch): one of Old
// MacGoblin's farmhands. A live puppet on the boss rig (rig.js): every part drawn once and placed
// each frame, the loose bits on springs, nothing squashed or stretched, every part filtered smoothly.
//
// Its look: a little green goblin in patched denim overalls (like the old boss's), big floppy ears,
// a cheeky grin, and a hollowed-out pumpkin worn as a helmet, much too big for it, with a curly
// stem on top. It carries a little garden spade.
//   idle    it breathes and its ears drift; every so often the pumpkin slips down over its eyes, it
//           shakes its head, and shoves the pumpkin back up with its free hand.
//   walk    a jaunty little trot on two legs: a real walk cycle (each foot planted on the ground
//           while it pushes back, then lifted and swung forward), stepped by the distance walked on
//           an eased speed, so the feet never slide and the pace never twitches. The body is lowest
//           as a foot lands and highest as the other passes under it; the arms swing against the
//           legs; the loose pumpkin bobs and wobbles after the head; the ears and stem flop along.
//   attack  it hauls the spade back over its head (the pumpkin tipping back), then bonks it down in
//           front of it; the pumpkin jumps.
//   hit     knocked back on its tilt spring, the pumpkin rattling round on its head.
// `pumpgobStill(pose, f, mood)` gives the still pictures (portraits, the book) from the same shapes.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, simpleMouth, deadEye, tear, vein } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, makeRig, stateBlend, smooth, TAU } from './rig.js';
import { sprite } from '../pixel.js';

const SKIN = ramp('#8fd06a', { step: 9, turn: 16, sat: -6 });
const DENIM = ramp('#6f9fe0', { step: 10, turn: 14 });
const PUMP = ramp('#ff9a3c', { step: 10, turn: 10, sat: -4 });
const BOOT = ramp('#9a6a44', { step: 10, turn: 10 });
const STEM = '#7a8a3c';
const WOOD = '#c08a58';
const METAL = '#cdd6e2';
const INK = '#3a4a2a';
const D2R = Math.PI / 180;

// ---------- Shapes ----------

// The torso: the overalls' round belly and bib over green shoulders, two brass buttons, the straps
// and an orange patch. Box 14 x 12; it stands on its hips at (7, 10.6).
const torsoShapes = () => [
  E(7, 3, 5.2, 2.6, SKIN.base),
  E(7, 6.6, 6.2, 5.2, DENIM.base),
  T([[3.4, 1.8], [10.6, 1.8], [11, 5.4], [3, 5.4]], DENIM.base),
  crescent(7, 6.6, 6.2, 5.2, DENIM.sh, { k: 0.24, a0: 20, a1: 160 }),
  shine(7, 6.6, 6.2, 5.2, '#d8e8ff', 0, 0.6),
  ...stroke([[3.8, 2], [3.4, 0.4]], 0.9, DENIM.sh),
  ...stroke([[10.2, 2], [10.6, 0.4]], 0.9, DENIM.sh),
  E(4.3, 2.6, 0.65, 0.65, '#ffd65a'),
  E(9.7, 2.6, 0.65, 0.65, '#ffd65a'),
  T([[8.4, 6.4], [11, 6.2], [11.2, 8.8], [8.6, 9]], '#f3a35a'),
  F(T([[8.6, 7.4], [11.1, 7.3], [11.1, 7.7], [8.6, 7.8]], '#d8823a')),
  F(T([[9.6, 6.3], [10, 6.3], [10.1, 8.9], [9.7, 8.9]], '#d8823a')),
  // A seam down the bib.
  ...stroke([[7, 2], [7, 5.2]], 0.35, DENIM.sh),
];
// The head: a round green face. Box 18 x 14, its neck at (9, 13.4).
const headShapes = () => [E(9, 7.4, 7.8, 6.4, SKIN.base), crescent(9, 7.4, 7.8, 6.4, SKIN.sh, { k: 0.24, a0: 30, a1: 150 })];
// An ear from its root at (0.8, 2.2), pointing out +x (or -x for the far side): long and floppy,
// pink inside.
// (A leaf-shaped curve: wide at the root, sweeping up to a fine tip, its lower edge rounded.)
const earShapes = (dir) => {
  const p = (x, y) => [dir > 0 ? x : 9.6 - x, y];
  const outer = [[0.8, 1.6], [2.6, 1.2], [4.6, 0.8], [6.6, 0.4], [8.2, 0.1], [9.2, 0], [8.4, 0.9], [7.2, 1.9], [5.6, 3], [3.8, 3.9], [2, 4.4], [0.8, 4.4]];
  const inner = [[1.6, 2.3], [3.4, 1.9], [5.4, 1.5], [7.4, 1], [6.4, 1.9], [4.8, 2.8], [3, 3.5], [1.6, 3.7]];
  return [T(outer.map(([x, y]) => p(x, y)), SKIN.base), F(T(inner.map(([x, y]) => p(x, y)), '#f6a8b4')), F(T([[1, 1.7], [4.6, 0.9], [8.2, 0.2], [4.6, 1.2], [1, 2.1]].map(([x, y]) => p(x, y)), SKIN.hi))];
};
// The face (unoutlined, on the head): eyes, cheeks, a round nose, a grin with one tooth. Box 12 x 9,
// centre (6, 4.5).
const faceShapes = (mood) => {
  const out = [];
  if (mood === 'dead') out.push(...deadEye(3.6, 3.4, 1, { c: INK, th: 0.5 }), ...deadEye(8, 3.3, 1.1, { c: INK, th: 0.5 }));
  else {
    const so = { iris: '#3a2a18', ink: INK, lid: 0, mood: mood === 'shout' ? 'angry' : mood };
    out.push(...simpleEye(3.6, 3.4, { ...so, s: -1, w: 1.6, h: 2.2 }), ...simpleEye(8, 3.3, { ...so, s: 1, w: 1.8, h: 2.4 }));
    out.push(F(E(2, 6.3, 1.2, 0.7, '#ff9eb0')), F(E(9.8, 6.5, 1.2, 0.7, '#ff9eb0')));
  }
  out.push(E(10.8, 5, 1.2, 1, SKIN.sh), F(E(10.6, 4.6, 0.4, 0.3, '#e6ffd8')));
  out.push(...simpleMouth(6.6, 7, { k: 0.9, mood: mood === 'blink' ? 'happy' : mood === 'idle' ? 'happy' : mood, lip: INK }));
  if (mood !== 'dead') out.push(F(T([[6.2, 6.8], [7, 6.8], [6.6, 7.7]], '#ffffff')));
  if (mood === 'hurt') out.push(...tear(8.6, 4.8, 0.7, { type: 'stream', len: 2 }));
  if (mood === 'angry') out.push(...vein(1, 0.4, 0.6));
  return out;
};
// The pumpkin helmet: a plump round pumpkin, five soft ribs (the outer ones in shade), curved
// creases running from the dip where the stem goes in down to the rim, lit on its upper left; its
// lower rim cut flat where it was hollowed out, the pale flesh showing along the cut. Box 20 x 12,
// the middle of its rim at (10, 10.6).
const helmetShapes = () => [
  E(10, 6.2, 9.4, 5.6, PUMP.base),
  E(3.4, 6.6, 3.2, 4.6, PUMP.sh),
  E(16.6, 6.6, 3.2, 4.6, PUMP.sh),
  E(6.8, 6.2, 3.4, 5.4, PUMP.base),
  E(13.2, 6.2, 3.4, 5.4, PUMP.base),
  E(10, 6, 3, 5.6, PUMP.hi),
  crescent(10, 6.2, 9.4, 5.6, PUMP.sh, { k: 0.18, a0: 25, a1: 155 }),
  ...[
    [[8.8, 1.4], [6.6, 4], [5.2, 9.6]],
    [[11.2, 1.4], [13.4, 4], [14.8, 9.6]],
    [[8, 1.6], [3.8, 4], [1.8, 8.6]],
    [[12, 1.6], [16.2, 4], [18.2, 8.6]],
  ].flatMap((pts) => stroke(pts, 0.45, '#d9692a')),
  E(10, 1.4, 2.2, 0.8, PUMP.sh),
  F(E(6.4, 3.4, 1.8, 0.8, '#ffd2a0')),
  F(E(9.2, 3, 0.6, 1.6, '#ffe0b0')),
  T([[1.4, 9.4], [18.6, 9.4], [18, 11.2], [2, 11.2]], PUMP.sh),
  F(T([[2, 10.5], [18, 10.5], [17.8, 11.4], [2.2, 11.4]], '#ffe6a0')),
];
// The stem from its base at (2, 7.6): a stubby stalk, a curly tendril and a leaf.
const stemShapes = () => [
  ...stroke([[2, 7.6], [2.2, 4.6], [3, 2.6]], 1.6, STEM, false),
  ...stroke([[2.4, 5.6], [0.6, 5], [0, 3.6], [0.8, 2.8], [1.6, 3.4]], 0.45, '#6fae4c'),
  T([[3, 4.4], [5.4, 2.6], [7.6, 3.4], [6.4, 5.4], [4, 5.4]], '#7fc860'),
  F(T([[3.6, 4.6], [6.6, 3.6], [6.6, 3.9], [3.8, 4.9]], '#5fa04a')),
];
// An arm from its shoulder at (2, 1): a green arm and a little round hand.
const armShapes = (far) => [...stroke([[2, 1], [2, 5.6]], 2.2, far ? SKIN.sh : SKIN.base, false), E(2, 6.6, 1.6, 1.5, far ? SKIN.sh : SKIN.base)];
// The garden spade from the grip in its hand at (3, 1.6), pointing along +y: a wooden handle with a
// T-grip, then a rounded metal blade with a shine. `ang` turns it (for the still pictures).
const spadeShapes = (ang = 0) => {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const P = (x, y) => [3 + (x - 3) * c - (y - 1.6) * s, 1.6 + (x - 3) * s + (y - 1.6) * c];
  const poly = (pts, col) => T(pts.map(([x, y]) => P(x, y)), col);
  return [
    poly([[1.2, 0.2], [4.8, 0.2], [4.8, 1.2], [1.2, 1.2]], WOOD),
    poly([[2.5, 1], [3.5, 1], [3.5, 8.6], [2.5, 8.6]], WOOD),
    poly([[0.8, 8.4], [5.2, 8.4], [5.4, 11.6], [3, 13.6], [0.6, 11.6]], METAL),
    F(poly([[1.6, 9], [2.4, 9], [2.2, 12], [1.6, 11.6]], '#ffffff')),
    F(poly([[2.6, 8.4], [3.4, 8.4], [3.4, 9.4], [2.6, 9.4]], '#9aa4b2')),
  ];
};
// A leg's thigh (the overalls' leg) and shin, each from its top joint at (1.8, 0.6) pointing +y.
const THIGH = 4.8;
const SHIN = 4.6;
const thighShapes = (far) => [E(1.8, 2.4, 2, 2.6, far ? DENIM.sh : DENIM.base), T([[0, 1], [3.6, 1], [3.4, THIGH + 0.4], [0.2, THIGH + 0.4]], far ? DENIM.sh : DENIM.base), F(T([[0.2, THIGH - 0.4], [3.4, THIGH - 0.4], [3.4, THIGH + 0.4], [0.2, THIGH + 0.4]], DENIM.sh))];
const shinShapes = (far) => [...stroke([[1.8, 0.6], [1.8, SHIN + 0.4]], 1.8, far ? SKIN.sh : SKIN.base, false)];
// A boot from the ankle at (2.4, 0.8): a round brown boot, its toe forward.
const bootShapes = (far) => [E(3, 2, 2.9, 1.7, far ? BOOT.sh : BOOT.base), T([[0.4, 2.2], [5.8, 2.2], [5.8, 3.4], [0.4, 3.4]], BOOT.sh), F(E(3.8, 1.4, 1, 0.5, '#d8a87a'))];

// ---------- Parts ----------

const MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout']);
const torsoPart = () => part('pg|torso', 14, 12, torsoShapes, 4);
const headPart = () => part('pg|head', 18, 14, headShapes, 4);
const earPart = (dir) => part(`pg|ear|${dir}`, 10, 5, () => earShapes(dir), 4);
const facePart = (mood) => sprite(`rig|pg|face|${mood}`, () => ({ w: 12, h: 9, res: 2, soft: 'cel', crisp: true, bare: true, pad: 4, shapes: faceShapes(mood) }));
const helmetPart = () => part('pg|helmet', 20, 12, helmetShapes, 4);
const stemPart = () => part('pg|stem', 8, 8, stemShapes, 4);
const armPart = (far) => part(`pg|arm|${far ? 1 : 0}`, 4, 8, () => armShapes(far), 4);
const spadePart = () => part('pg|spade', 6, 14, () => spadeShapes(0), 4);
const thighPart = (far) => part(`pg|thigh|${far ? 1 : 0}`, 4, 6, () => thighShapes(far), 4);
const shinPart = (far) => part(`pg|shin|${far ? 1 : 0}`, 4, 6, () => shinShapes(far), 4);
const bootPart = (far) => part(`pg|boot|${far ? 1 : 0}`, 6, 4, () => bootShapes(far), 4);

const faceOf = (a) => {
  if (a.face === 'dead') return 'dead';
  if (a.ph.strike > 0.3) return 'shout';
  if (a.ph.atk) return 'angry';
  return MOODS.has(a.face) ? a.face : 'idle';
};

// ---------- The walk cycle ----------

// One cycle per STRIDE px walked, driven by its speed eased over a moment (the raw distance twitches
// with every little change of pace). Each foot spends half the cycle planted, sliding back under
// the body at exactly the speed the body moves (so it stays put on the ground), and half lifted,
// eased forward in an arc. The feet are half a cycle apart.
const STRIDE = 16;
const REACH = STRIDE / 4;
const HIP = 10.4;
const ANKLE = 2.4; // the ankle's height above the sole
const stepPhase = (m, a) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(160, Math.abs(odo - (st.pgOdo ?? odo)) / dt);
  st.pgOdo = odo;
  st.pgV = (st.pgV ?? 0) + (raw - (st.pgV ?? 0)) * Math.min(1, dt * 5);
  st.pgU = ((st.pgU ?? 0) + (st.pgV / STRIDE) * dt) % 1;
  return st.pgU;
};
// Where a foot is at cycle point u (0..1): [x, y above the ground (negative up), toe lift].
const footAt = (u) => {
  if (u < 0.5) return [REACH - (u / 0.5) * 2 * REACH, 0, 0];
  const s = (u - 0.5) / 0.5;
  // (The boot rolls: toe down as it pushes off, toe up as it reaches to land on its heel.)
  return [-REACH + smooth(s) * 2 * REACH, -Math.sin(Math.PI * s) * 2.4, Math.sin(Math.PI * s) * (0.4 - 0.75 * s)];
};
// Two-bone leg: the knee from the hip and foot, bending forward. Returns the thigh and shin turns
// (radians, 0 = straight down) and the knee point.
const leg = (hx, hy, fx, fy) => {
  const dx = fx - hx;
  const dy = fy - hy;
  const d = Math.min(THIGH + SHIN - 0.05, Math.max(0.5, Math.hypot(dx, dy)));
  const al = Math.atan2(dy, dx);
  const be = Math.acos(Math.min(1, Math.max(-1, (THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d))));
  const kx = hx + Math.cos(al - be) * THIGH;
  const ky = hy + Math.sin(al - be) * THIGH;
  return { kx, ky, th: Math.atan2(-(kx - hx), ky - hy), sh: Math.atan2(-(fx - kx), fy - ky) };
};
// Both legs for this frame (stashed on the animation state for the parts to read).
const legsOf = (a, S) => {
  const w = a.walkW;
  const u = a.pgU ?? 0;
  const out = {};
  for (const [k, off, x0] of [['n', 0, 1.6], ['f', 0.5, -1.6]]) {
    const [fx, fy, toe] = footAt((u + off) % 1);
    const hx = S.x + x0 * 0.6;
    const hy = -S.lift - HIP;
    const ft = [S.x + x0 + fx * w, fy * w - ANKLE];
    out[k] = { ...leg(hx, hy, ft[0], ft[1]), hx, hy, fx: ft[0], fy: ft[1], toe: toe * w };
  }
  return out;
};

// The idle gag, every 6 s: the pumpkin slips down over its eyes (eased), it shakes its head, then
// shoves it back up with its free hand.
const GAG = 6;
const gagOf = (t) => {
  const u = t % GAG;
  if (u < 3.6) return { slip: 0, push: 0, shake: 0 };
  if (u < 4.1) return { slip: smooth((u - 3.6) / 0.5), push: 0, shake: 0 };
  if (u < 4.8) return { slip: 1, push: 0, shake: Math.sin((u - 4.1) * 22) * Math.sin(((u - 4.1) / 0.7) * Math.PI) };
  if (u < 5.3) return { slip: 1 - smooth((u - 4.8) / 0.5), push: Math.sin(((u - 4.8) / 0.5) * Math.PI * 0.5), shake: 0 };
  if (u < 5.8) return { slip: 0, push: 1 - smooth((u - 5.3) / 0.5), shake: 0 };
  return { slip: 0, push: 0, shake: 0 };
};

export const pumpgobRig = makeRig({
  w: 28,
  h: 46,
  soft: true,
  stride: STRIDE,
  recover: 0.55,
  springs: {
    tilt: [150, 16],
    lift: [260, 20],
    x: [180, 18],
    nod: [140, 14],
    armN: [130, 13],
    armF: [110, 11],
    // The spade's angle in its hand: carried across its belly, the blade resting behind its
    // shoulder, at rest; turned for the bonk.
    spadeR: [140, 14],
    ear: [300, 16],
    look: [60, 10],
    slip: [160, 14],
    shake: [400, 18],
    // The pumpkin sits loose on its head: it trails the head and wobbles on.
    helmY: [120, 9],
    helmR: [90, 6],
    stem: [60, 4.5],
    earN: [70, 5],
    earF: [70, 5],
  },
  fast: ['tilt', 'x', 'armN', 'nod'],
  kick: { tilt: -260, helmR: 700, stem: 500 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 0.53;
    const u = stepPhase(m, a);
    a.pgU = u;
    // Idle: a breath, and the pumpkin gag.
    const g = gagOf(t);
    const br = Math.sin(t * 1.6);
    // (Between gags it looks about now and then, and an ear twitches.)
    const look = Math.max(0, Math.sin(t * 0.43 + 1) - 0.75) / 0.25;
    const tw = (t * 0.7) % 3.1 < 0.25 ? Math.sin((((t * 0.7) % 3.1) / 0.25) * Math.PI) : 0;
    const idle = { tilt: g.shake * 4, lift: (br + 1) * 0.2, x: 0, nod: g.slip * 6 + g.shake * 8 - look * 7, armN: 352 + br * 2, armF: -6 - br * 2 - g.push * 150, slip: g.slip, shake: g.shake, spadeR: 133, ear: tw, look };
    // Walk: lowest as a foot lands (u = 0, 0.5), highest as the other passes under (0.25, 0.75);
    // a forward lean; the arms against the legs; a little nod with each step.
    const bob = 0.5 - 0.5 * Math.cos(u * 4 * Math.PI);
    const sw = Math.sin(u * TAU);
    const walk = { tilt: 5 + sw * 1.2, lift: bob * 0.9, x: 0, nod: -bob * 3, armN: 350 - sw * 6, armF: sw * 28 - 6, slip: 0, shake: 0, spadeR: 133, ear: 0, look: 0 };
    // The bonk: the spade lifted up in front and over its head, then smashed down in front.
    // (The near arm's angles run past a full turn, 360 = hanging down, so the springs always swing
    // it forward and up for the wind-up, forward and down for the blow, and straight back after.
    // The spade's angle in its hand turns with it, so the spade stays up over its head while the
    // arm rises, and swings back up onto its shoulder after the blow.)
    const antic = { tilt: -9, lift: 0.4, x: -1.4, nod: -8, armN: 205, armF: 20, slip: 0, shake: 0, spadeR: 305, ear: 0, look: 0 };
    const strike = { tilt: 12, lift: 0, x: 3.4, nod: 10, armN: 318, armF: -30, slip: 0, shake: 0, spadeR: 305, ear: 0, look: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow(S) {
    return {
      // The pumpkin lags the head's bob and lean, and slips down for the gag.
      helmY: S.lift * 0.9 + S.slip * 4,
      helmR: -S.tilt * 0.6 - S.nod * 0.4 + S.shake * -10,
      stem: -S.tilt * 1.6 + S.lift * 10 - S.nod,
      earN: -S.lift * 14 - S.tilt * 1.2 + S.shake * 20 - S.ear * 22,
      earF: S.lift * 14 + S.tilt * 1.2 - S.shake * 20,
    };
  },
  parts: [
    // The far leg (thigh, shin, boot), drawn behind everything.
    { name: 'thighF', parent: null, s: () => thighPart(true), pivot: [1.8, 0.6], at: (S, a) => ((a.pgL = legsOf(a, S)), [a.pgL.f.hx, a.pgL.f.hy]), rot: (S, a) => a.pgL.f.th },
    { name: 'shinF', parent: null, s: () => shinPart(true), pivot: [1.8, 0.6], at: (S, a) => [a.pgL.f.kx, a.pgL.f.ky], rot: (S, a) => a.pgL.f.sh },
    { name: 'bootF', parent: null, s: () => bootPart(true), pivot: [2.4, 0.8], at: (S, a) => [a.pgL.f.fx, a.pgL.f.fy], rot: (S, a) => a.pgL.f.toe },
    // The body, leaning from its hips.
    { name: 'core', parent: null, at: (S) => [S.x, -S.lift - HIP], rot: (S) => S.tilt * D2R },
    { name: 'armF', parent: 'core', s: () => armPart(true), pivot: [2, 1], at: () => [-3.6, -8], rot: (S) => S.armF * D2R },
    { name: 'neck', parent: 'core', at: () => [0.6, -9.4], rot: (S) => S.nod * D2R },
    { name: 'earF', parent: 'neck', s: () => earPart(-1), pivot: [8.8, 3], at: () => [-6.6, -7.4], rot: (S) => (14 + S.earF) * D2R },
    { name: 'thighN', parent: null, s: () => thighPart(false), pivot: [1.8, 0.6], at: (S, a) => [a.pgL.n.hx, a.pgL.n.hy], rot: (S, a) => a.pgL.n.th },
    { name: 'shinN', parent: null, s: () => shinPart(false), pivot: [1.8, 0.6], at: (S, a) => [a.pgL.n.kx, a.pgL.n.ky], rot: (S, a) => a.pgL.n.sh },
    { name: 'bootN', parent: null, s: () => bootPart(false), pivot: [2.4, 0.8], at: (S, a) => [a.pgL.n.fx, a.pgL.n.fy], rot: (S, a) => a.pgL.n.toe },
    { name: 'torso', parent: 'core', s: torsoPart, pivot: [7, 10.6], at: () => [0, 1.2] },
    { name: 'head', parent: 'neck', s: headPart, pivot: [9, 13.4] },
    { name: 'face', parent: 'neck', s: (a) => facePart(faceOf(a)), pivot: [6, 4.5], at: () => [1.6, -5.4] },
    { name: 'helmet', parent: 'neck', s: helmetPart, pivot: [10, 10.6], at: (S) => [0, -10.2 + S.helmY], rot: (S) => S.helmR * D2R },
    { name: 'stem', parent: 'helmet', s: stemPart, pivot: [2, 7.6], at: () => [0.4, -9.6], rot: (S) => S.stem * D2R },
    { name: 'earN', parent: 'neck', s: () => earPart(1), pivot: [0.8, 3], at: () => [6.6, -7.6], rot: (S) => (-14 + S.earN) * D2R },
    // The near arm and its spade (held out in front, forward and down, swung with the arm).
    { name: 'armN', parent: 'core', s: () => armPart(false), pivot: [2, 1], at: () => [3.8, -8], rot: (S) => S.armN * D2R },
    { name: 'spade', parent: 'armN', s: spadePart, pivot: [3, 1.6], at: () => [0, 6.4], rot: (S) => S.spadeR * D2R },
  ],
});

// ---------- Stills ----------

const shift = (shapes, dx, dy) => shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: 0, y: 0, pts: s.pts.map(([x, y]) => [x + (s.x ?? 0) + dx, y + (s.y ?? 0) + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
export function pumpgobStill(pose, f, mood) {
  const fm = mood === 'dead' ? 'dead' : MOODS.has(mood) ? mood : 'idle';
  const ox = 13;
  const gy = 44;
  const hy = gy - HIP;
  const ny = hy - 9.4;
  return {
    w: 30,
    h: 46,
    res: 3,
    shapes: [
      ...shift(thighShapes(true), ox - 1 - 1.8, hy - 0.6),
      ...shift(shinShapes(true), ox - 1 - 1.8, hy + THIGH - 0.6),
      ...shift(bootShapes(true), ox - 1.6 - 2.4, gy - 2.4 - 0.8),
      ...shift(armShapes(true), ox - 3.6 - 2, hy - 8 - 1),
      ...shift(earShapes(-1), ox + 0.6 - 6.6 - 8.8, ny - 7.4 - 3),
      ...shift(thighShapes(false), ox + 1 - 1.8, hy - 0.6),
      ...shift(shinShapes(false), ox + 1 - 1.8, hy + THIGH - 0.6),
      ...shift(bootShapes(false), ox + 1.6 - 2.4, gy - 2.4 - 0.8),
      ...shift(torsoShapes(), ox - 7, hy + 1.2 - 10.6),
      ...shift(headShapes(), ox + 0.6 - 9, ny - 13.4),
      ...shift(faceShapes(fm), ox + 0.6 + 1.6 - 6, ny - 5.4 - 4.5),
      ...shift(helmetShapes(), ox + 0.6 - 10, ny - 10.2 - 10.6),
      ...shift(stemShapes(), ox + 0.6 + 0.4 - 2, ny - 10.2 - 9.6 - 7.6),
      ...shift(earShapes(1), ox + 0.6 + 6.6 - 0.8, ny - 7.6 - 3),
      ...shift(armShapes(false), ox + 3.8 - 2, hy - 8 - 1),
      ...shift(spadeShapes(125 * D2R), ox + 3.8 - 3, hy - 8 + 6.4 - 1.6),
    ],
  };
}
