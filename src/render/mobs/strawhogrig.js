// The Strawhog (new for Clover Hills, 2026-11-11, built from scratch): a little hedgehog made of
// hay. A live puppet on the boss rig (rig.js): every part drawn once and placed each frame, the
// loose bits on springs, nothing squashed or stretched, every part filtered smoothly.
//
// Its look: a round cream body with a soft fur fringe at the bottom, three clumps of golden straw
// spines over its back (each its own part, so they ripple), a cream face with big dark eyes, a
// short snout with a pink button nose, a tiny round ear, and little toes peeking from under the
// fringe.
//   idle    it breathes (the spines rise and settle), stops to sniff (its snout lifts and its nose
//           twitches), and now and then lifts its head to look about.
//   walk    a quick little scurry, stepped by the distance walked so the toes never slide: the body
//           bobs a hair over its planted toes (never leaving the ground), sways slowly, the snout
//           nods, and the spines and ear jiggle on after every step.
//   attack  it tucks up into a spiky straw ball, rocks back, rolls in at you (a real roll: the ball
//           turns by the distance it travels), and uncurls.
//   hit     knocked back on its tilt spring, spines bristling, and it settles.
// `strawhogStill(pose, f, mood)` gives the still pictures (portraits, the book) from the same parts.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, blush as cheek, deadEye, tear, vein } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, makeRig, stateBlend, smooth, TAU } from './rig.js';
import { sprite } from '../pixel.js';

const STRAW = ramp('#f2c766', { step: 9, turn: 12, sat: -6 });
const CREAM = ramp('#fff0d8', { step: 7, turn: 24 });
const FUR = ramp('#f0d4b0', { step: 7, turn: 20 });
const NOSE = '#f0758f';
const INK = '#4a3020';
const D2R = Math.PI / 180;

// ---------- Shapes ----------

// The body: a round cream bun, its lower edge a soft scalloped fur fringe (it hides the legs; only
// the toes peek out). Box 22 x 16, centre (11, 9); the face's cream patch at the front.
const bodyShapes = () => {
  const out = [E(11, 9, 9.6, 6.4, FUR.base)];
  // The fringe: soft scallops in two tones, so it reads as fluff, not a hem.
  for (let i = 0; i < 6; i++) out.push(E(3.6 + i * 3, 14, 2, 1.6, i % 2 ? FUR.base : FUR.sh));
  out.push(E(11, 12.6, 8.4, 1.6, FUR.sh), crescent(11, 9, 9.6, 6.4, FUR.sh, { k: 0.22, a0: 30, a1: 150 }));
  // Depth where the coat sits on it, and a little warm light on the belly.
  out.push(crescent(11, 9, 9.6, 6.4, FUR.sh, { k: 0.2, a0: 205, a1: 320 }), F(E(9.4, 11.6, 3.6, 0.8, '#fbe6cc')));
  out.push(E(15.6, 9.2, 5.4, 4.8, CREAM.base), crescent(15.6, 9.2, 5.4, 4.8, CREAM.sh, { k: 0.2, a0: 40, a1: 140 }), F(E(14.6, 7.2, 2.6, 1.2, '#fff8ec')));
  return out;
};
// A clump of straw spines: a soft mound with rounded spikes fanned over its upper edge, lighter
// at the tips, a straw line and a shine. `rx`, `ry` its mound; `a0`..`a1` (degrees) the arc the
// spikes fan over; box w x h centred (w/2, h/2).
const RIM = '#7a5230';
const clumpShapes = (w, h, rx, ry, a0, a1, n, clover, rim) => () => {
  const cx = w / 2;
  const cy = h / 2;
  const out = [];
  // (A front clump has no outline of its own, so where it lies over the one behind it blends in
  // with no dark seam. Instead a warm brown rim is drawn by hand round its spikes and the top of
  // its mound, where it meets the sky.)
  if (rim) {
    for (let i = 0; i < n; i++) {
      const a = (a0 + ((a1 - a0) * i) / (n - 1)) * D2R;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const bx = cx + ca * rx * 0.86;
      const by = cy + sa * ry * 0.86;
      out.push(T([[bx - sa * 2.1, by + ca * 2.1], [cx + ca * (rx + 3.3), cy + sa * (ry + 3.3)], [bx + sa * 2.1, by - ca * 2.1]], RIM));
    }
    out.push(crescent(cx, cy, rx + 0.6, ry + 0.6, RIM, { k: 0.2, a0: a0 - 10, a1: a1 + 10 }));
  }
  out.push(E(cx, cy, rx, ry, STRAW.base));
  for (let i = 0; i < n; i++) {
    const a = (a0 + ((a1 - a0) * i) / (n - 1)) * D2R;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const bx = cx + ca * rx * 0.86;
    const by = cy + sa * ry * 0.86;
    const nx = -sa * 1.5;
    const ny = ca * 1.5;
    const tx = cx + ca * (rx + 2.6);
    const ty = cy + sa * (ry + 2.6);
    out.push(T([[bx + nx, by + ny], [tx, ty], [bx - nx, by - ny]], i % 2 ? STRAW.base : STRAW.hi));
    // A sheen along each spike toward its tip, like the shine down a stalk of straw.
    out.push(F(T([[bx + nx * 0.3 + ca * 0.6, by + ny * 0.3 + sa * 0.6], [tx - ca * 0.5, ty - sa * 0.5], [bx + nx * 0.7 + ca * 0.6, by + ny * 0.7 + sa * 0.6]], '#fff1c4')));
  }
  out.push(crescent(cx, cy, rx, ry, STRAW.sh, { k: 0.28, a0: 30, a1: 160 }), shine(cx, cy, rx, ry, '#fff6d8', 0, 0.55));
  // A few straw strands combed through the mound, fanning out with the spikes.
  for (const f of [0.25, 0.6, 0.9]) {
    const a = (a0 + (a1 - a0) * f) * D2R;
    out.push(...stroke([[cx + Math.cos(a) * rx * 0.15, cy + Math.sin(a) * ry * 0.15 + ry * 0.2], [cx + Math.cos(a) * rx * 0.72, cy + Math.sin(a) * ry * 0.72]], 0.35, STRAW.sh));
  }
  // A little clover sprig tucked in the top: three round leaves on a stalk.
  if (clover) {
    const [x, y] = [cx + rx * 0.3, cy - ry - 0.4];
    out.push(...stroke([[x, y + 2.6], [x + 0.2, y]], 0.5, '#4f9a4c'));
    // Three round leaves, each rimmed, so they read apart even this small.
    const leaves = [[-1.3, -0.6], [1.3, -0.7], [0, -1.9]];
    for (const [dx, dy] of leaves) out.push(E(x + 0.2 + dx, y + dy, 1.25, 1.15, '#3f7a3e'));
    for (const [dx, dy] of leaves) out.push(E(x + 0.2 + dx, y + dy, 0.85, 0.78, '#86d872'));
    for (const [dx, dy] of leaves) out.push(F(E(x + dx - 0.1, y + dy - 0.3, 0.35, 0.25, '#d6f7c2')));
  }
  return out;
};
// The three clumps, back to front: [w, h, rx, ry, a0, a1, spikes].
const CLUMPS = [
  [18, 17, 5.8, 5.2, 120, 270, 6],
  [18, 16, 6, 4.6, 190, 300, 5, false, true],
  [16, 14, 4.6, 3.4, 215, 330, 4, true, true],
];
// The face (unoutlined, it sits on the body): eyes, cheeks. Box 12 x 8, centre (6, 4).
const faceShapes = (mood) => {
  const out = [];
  if (mood === 'dead') out.push(...deadEye(4.2, 3.4, 1, { c: INK, th: 0.5 }), ...deadEye(8.4, 3.3, 1.1, { c: INK, th: 0.5 }));
  else {
    const so = { iris: '#3a2418', ink: INK, lid: 0, mood: mood === 'shout' ? 'angry' : mood };
    out.push(...simpleEye(4.2, 3.4, { ...so, s: -1, w: 1.25, h: 1.75 }), ...simpleEye(8.4, 3.3, { ...so, s: 1, w: 1.45, h: 1.95 }));
    out.push(...cheek(2.8, 5.8, 1, { on: CREAM.base }), ...cheek(10, 6, 1, { on: CREAM.base }));
  }
  if (mood === 'hurt') out.push(...tear(9, 4.8, 0.7, { type: 'stream', len: 2 }));
  if (mood === 'angry') out.push(...vein(1.4, 0.4, 0.6));
  return out;
};
// The snout from its root at (0.6, 2.6): a short cream nub, the pink button nose, a little mouth.
const snoutShapes = (open) => [
  E(2.2, 2.8, 2.6, 1.9, CREAM.base), F(E(2.4, 3.8, 2.2, 0.8, CREAM.sh)), F(E(1.8, 1.9, 1.2, 0.45, '#fffaf2')),
  E(4.6, 2.3, 1.3, 1.15, NOSE), F(E(4.3, 1.9, 0.45, 0.35, '#ffffff')),
  open ? E(2.4, 4.1, 0.8, 0.6, '#7a3a48') : T([[1.6, 3.9], [2.3, 4.4], [3, 3.9], [3, 4.1], [2.3, 4.6], [1.6, 4.1]], INK),
];
// A tiny round ear from its root at (2, 2.8).
const earShapes = () => [E(2, 1.8, 1.6, 1.4, FUR.base), F(E(2.2, 2.1, 0.75, 0.6, '#ffb0c0'))];
// A toe nub from its top at (1.5, 0): just its tip shows under the fringe.
const toeShapes = (far) => [E(1.5, 0.9, 1.5, 0.9, far ? FUR.sh : FUR.base)];
// The curled-up ball: a round straw bun with spikes all the way round, its shine, and a peek of
// cream belly and pink nose where it's tucked (so it reads as the hog curled up, not a hay bale).
// Box 22 x 22, centre (11, 11).
const ballShapes = () => {
  const out = [E(11, 11, 7.4, 7.4, STRAW.base)];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    out.push(T([[11 + ca * 6.6 - sa * 1.6, 11 + sa * 6.6 + ca * 1.6], [11 + ca * 10, 11 + sa * 10], [11 + ca * 6.6 + sa * 1.6, 11 + sa * 6.6 - ca * 1.6]], i % 2 ? STRAW.base : STRAW.hi));
  }
  out.push(crescent(11, 11, 7.4, 7.4, STRAW.sh, { k: 0.3, a0: 20, a1: 170 }), shine(11, 11, 7.4, 7.4, '#fff6d8', 0, 0.7));
  for (const a of [0.6, 2.2, 3.8, 5.2]) out.push(...stroke([[11 + Math.cos(a) * 1.4, 11 + Math.sin(a) * 1.4], [11 + Math.cos(a) * 5.4, 11 + Math.sin(a) * 5.4]], 0.35, STRAW.sh));
  out.push(F(E(14.6, 13.8, 2.6, 1.8, FUR.base)), F(E(15.4, 13.4, 0.7, 0.6, NOSE)));
  return out;
};

// ---------- Parts ----------

const MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout']);
const bodyPart = () => part('hog2|body', 22, 16, bodyShapes, 4);
const clumpPart = (i) =>
  CLUMPS[i][8]
    ? sprite(`rig|hog2|clump|${i}`, () => ({ w: CLUMPS[i][0], h: CLUMPS[i][1], res: 2, soft: 'cel', crisp: true, bare: true, pad: 4, shapes: clumpShapes(...CLUMPS[i])() }))
    : part(`hog2|clump|${i}`, CLUMPS[i][0], CLUMPS[i][1], clumpShapes(...CLUMPS[i]), 4);
const facePart = (mood) => sprite(`rig|hog2|face|${mood}`, () => ({ w: 12, h: 8, res: 2, soft: 'cel', crisp: true, bare: true, pad: 4, shapes: faceShapes(mood) }));
const snoutPart = (open) => part(`hog2|snout|${open ? 1 : 0}`, 8, 6, () => snoutShapes(open), 4);
const earPart = () => part('hog2|ear', 4, 3, earShapes, 4);
const toePart = (far) => part(`hog2|toe|${far ? 1 : 0}`, 3, 2, () => toeShapes(far), 4);
const ballPart = () => part('hog2|ball', 22, 22, ballShapes, 4);

const faceOf = (a) => {
  if (a.face === 'dead') return 'dead';
  if (a.ph.strike > 0.3) return 'shout';
  if (a.ph.atk) return 'angry';
  return MOODS.has(a.face) ? a.face : 'idle';
};

// ---------- Motion ----------

// The walk cycle: one cycle per STRIDE px walked, but driven by its speed eased over a moment
// (not the raw distance, which twitches with every little change of pace), so the steps flow
// evenly and still keep up with the ground. Diagonal pairs of toes in turn: a lifted toe swings
// forward, easing off the ground and back down with no corner; a planted toe pushes back. It all
// fades in and out with walking.
const STRIDE = 16;
const REACH = 1.6;
const stepPhase = (m, a) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(120, Math.abs(odo - (st.hogOdo ?? odo)) / dt);
  st.hogOdo = odo;
  st.hogV = (st.hogV ?? 0) + (raw - (st.hogV ?? 0)) * Math.min(1, dt * 5);
  st.hogP = ((st.hogP ?? 0) + (st.hogV / STRIDE) * TAU * dt) % (TAU * 4);
  return st.hogP;
};
const toeAt = (a, S, x0, y0, phase) => {
  const p = (a.stepP ?? 0) + phase;
  const w = a.walkW;
  const s = Math.sin(p);
  const up = s > 0 ? s * s : 0;
  return [x0 - Math.cos(p) * REACH * w, y0 + S.lift - up * 0.8 * w];
};
// The ball's spin as it rolls in: once round over the roll, eased.
const ROLL = 0.5;
const spinOf = (a) => (a.ph.since >= 0 && a.ph.since < ROLL ? smooth(a.ph.since / ROLL) * TAU : 0);
const curlOf = (S) => Math.min(1, Math.max(0, S.curl));
const R = 8; // the ball's radius, for rolling by the distance moved

export const strawhogRig = makeRig({
  w: 30,
  h: 22,
  soft: true,
  stride: STRIDE,
  recover: 0.55,
  springs: {
    tilt: [140, 15],
    // (Lift a little springy: it overshoots each step a hair, which is the bounce.)
    lift: [180, 17],
    x: [160, 18],
    snout: [120, 13],
    twitch: [700, 22],
    puff: [80, 9],
    curl: [260, 30],
    // The three spine clumps trail at different speeds, so a move ripples through them.
    // Loose, so each step sets them jiggling.
    sp0: [55, 4.5],
    sp1: [70, 5],
    sp2: [85, 5.5],
    ear: [70, 4.5],
  },
  fast: ['tilt', 'x', 'curl'],
  kick: { tilt: -240, sp0: 420, sp1: 360, sp2: 300 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 0.41;
    // Idle: a slow breath through the spines, a sniff every 2.8 s (the snout lifts, the nose
    // twitches), and now and then a long look up about it.
    const u = t % 2.8;
    const sniffing = u < 0.9 ? Math.sin((u / 0.9) * Math.PI) : 0;
    const look = Math.max(0, Math.sin(t * 0.37) - 0.7) / 0.3;
    const idle = { tilt: -look * 5, lift: 0, x: 0, snout: -sniffing * 8 - look * 10, twitch: u < 0.9 ? Math.sin(u * 26) * 2.4 * sniffing : 0, puff: (Math.sin(t * 1.5) + 1) * 0.5, curl: 0 };
    // Walk: a quick little scurry. The body is highest as a toe passes under it and settles just
    // after each contact (its springy lift lags a touch, giving the weight), never leaving the
    // ground; it leans into the walk with a slow sway over a few steps, the snout nodding along.
    const p = stepPhase(m, a);
    a.stepP = p;
    // (A smooth rise and fall twice a cycle, once per step: no corner at the landing.)
    const bump = 0.5 - 0.5 * Math.cos(2 * p);
    const walk = { tilt: 2.2 + Math.sin(p * 0.5) * 1, lift: bump * 0.7, x: 0, snout: 3 - bump * 2, twitch: 0, puff: 0.5, curl: 0 };
    // The attack: curled, rocked back, then rolled in.
    const antic = { tilt: 0, lift: 0, x: -2.4, snout: 0, twitch: 0, puff: 1, curl: 1 };
    const strike = { tilt: 0, lift: 0, x: 9, snout: 0, twitch: 0, puff: 1, curl: 1 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow(S, a) {
    // The spines and ear trail the body: as it rises they lag down, as it lands they flick up,
    // and their loose springs let them jiggle on after each step.
    return {
      sp0: -S.tilt * 1.2 - S.puff * 6 + S.lift * 4,
      sp1: -S.tilt * 1 - S.puff * 3 + S.lift * 3.5,
      sp2: -S.tilt * 0.8 + S.puff * 2 + S.lift * 2.4,
      ear: S.twitch * 6 - S.tilt * 2 + S.lift * 9,
    };
  },
  parts: [
    // The toes, from the hips (the bun's base, level: they never tilt with the rock).
    { name: 'hips', parent: null, at: (S) => [S.x, -S.lift - 2.2] },
    { name: 'toeBF', parent: 'hips', s: () => toePart(true), pivot: [1.5, 0], at: (S, a) => toeAt(a, S, -4.4, 0, Math.PI), alpha: (a, S) => 1 - curlOf(S) },
    { name: 'toeFF', parent: 'hips', s: () => toePart(true), pivot: [1.5, 0], at: (S, a) => toeAt(a, S, 5, 0, 0), alpha: (a, S) => 1 - curlOf(S) },
    // The bun, rocking from its middle.
    { name: 'core', parent: null, at: (S) => [S.x, -S.lift - 8.6], rot: (S) => S.tilt * D2R },
    { name: 'body', parent: 'core', s: bodyPart, pivot: [11, 9], alpha: (a, S) => 1 - curlOf(S) },
    { name: 'clump0', parent: 'core', s: () => clumpPart(0), pivot: [9, 8.5], at: () => [-5.6, -1.6], rot: (S) => S.sp0 * D2R, alpha: (a, S) => 1 - curlOf(S) },
    { name: 'clump1', parent: 'core', s: () => clumpPart(1), pivot: [9, 8], at: () => [-2.4, -4], rot: (S) => S.sp1 * D2R, alpha: (a, S) => 1 - curlOf(S) },
    { name: 'clump2', parent: 'core', s: () => clumpPart(2), pivot: [8, 7], at: () => [0.6, -5.2], rot: (S) => S.sp2 * D2R, alpha: (a, S) => 1 - curlOf(S) },
    { name: 'ear', parent: 'core', s: earPart, pivot: [2, 2.8], at: () => [5.2, -3.6], rot: (S) => S.ear * D2R, alpha: (a, S) => 1 - curlOf(S) },
    { name: 'face', parent: 'core', s: (a) => facePart(faceOf(a)), pivot: [6, 4], at: () => [5, 0.4], alpha: (a, S) => 1 - curlOf(S) },
    { name: 'snout', parent: 'core', s: (a) => snoutPart(faceOf(a) === 'shout'), pivot: [0.6, 2.6], at: () => [9, 1.2], rot: (S) => (S.snout + S.twitch) * D2R, alpha: (a, S) => 1 - curlOf(S) },
    { name: 'toeBN', parent: 'hips', s: () => toePart(false), pivot: [1.5, 0], at: (S, a) => toeAt(a, S, -6, 0.3, 0), alpha: (a, S) => 1 - curlOf(S) },
    { name: 'toeFN', parent: 'hips', s: () => toePart(false), pivot: [1.5, 0], at: (S, a) => toeAt(a, S, 3.2, 0.3, Math.PI), alpha: (a, S) => 1 - curlOf(S) },
    // The ball: it turns by the distance it moves (a real roll), plus its spin as it rolls in.
    { name: 'ball', parent: null, s: ballPart, pivot: [11, 11], at: (S) => [S.x, -S.lift - 8], rot: (S, a) => S.x / R + spinOf(a), alpha: (a, S) => curlOf(S) },
  ],
});

// ---------- Stills ----------

const shift = (shapes, dx, dy) => shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: 0, y: 0, pts: s.pts.map(([x, y]) => [x + (s.x ?? 0) + dx, y + (s.y ?? 0) + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
export function strawhogStill(pose, f, mood) {
  const fm = mood === 'dead' ? 'dead' : MOODS.has(mood) ? mood : 'idle';
  const ox = 15;
  const gy = 23;
  const cy = gy - 8.6;
  const hy = gy - 2.2;
  if (pose === 'attack' && Math.floor(f) >= 1 && Math.floor(f) <= 2) return { w: 30, h: 24, res: 3, shapes: shift(ballShapes(), ox - 11, gy - 8 - 11) };
  const clump = (i, at, pv) => shift(clumpShapes(...CLUMPS[i])(), ox + at[0] - pv[0], cy + at[1] - pv[1]);
  return {
    w: 30,
    h: 24,
    res: 3,
    shapes: [
      ...shift(toeShapes(true), ox - 4.4 - 1.5, hy),
      ...shift(toeShapes(true), ox + 5 - 1.5, hy),
      ...shift(bodyShapes(), ox - 11, cy - 9),
      ...clump(0, [-5.6, -1.6], [9, 8.5]),
      ...clump(1, [-2.4, -4], [9, 8]),
      ...clump(2, [0.6, -5.2], [8, 7]),
      ...shift(earShapes(), ox + 5.2 - 2, cy - 3.6 - 2.8),
      ...shift(faceShapes(fm), ox + 5 - 6, cy + 0.4 - 4),
      ...shift(snoutShapes(false), ox + 9 - 0.6, cy + 1.2 - 2.6),
      ...shift(toeShapes(false), ox - 6 - 1.5, hy + 0.3),
      ...shift(toeShapes(false), ox + 3.2 - 1.5, hy + 0.3),
    ],
  };
}
