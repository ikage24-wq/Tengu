// The Paperclip Fiddler's crab (2026-11-27, dressed in render/fiddler/index.js): a copy of the blank crab
// base (blankcrab.js, its fiddler), with the same
// dress hooks as the Root Imp's copy, kept here so the base itself stays clean (the player: "never edit
// the bases just copy the base and edit that"). Its own fixes: a claw's hand turn and its door are
// taken the way they went last frame (never flipped round), and an elbow stays on its side as a wrist
// passes the shoulder. What this copy adds: a dress, `look`, for a monster on it:
//   look.kind   the preset (crab, fiddler, hermit; default crab)
//   look.hide   { part: true } leaves one of the base's parts out (its hooks still draw)
//   look.clip   { part: (ctx, a, K) } sets a clip a part is drawn inside (both passes)
//   look.pick   (m, a, pool, n) which of its moves an attack plays (else each in turn; a move named
//               in m.move, as a stage or a dungeon's own move asks, always wins)
//   a.gait      (set by the base as it walks) its pace and steps, for the walk-pace check
//   look.C      its own colours over the base's (lt, base, sh, deep, guide, nose, mouth)
//   look.CC     the claws' and legs' own colours over the body's
//   look.P      its own shape over the crab's (an object merges one level deep)
//   look.ink    its own soft outline colour (never near-black)
//   look.mouth  (ctx, a, sk, K) its own mouth, in place of the base's guide
//   look.over   { part: (ctx, a, mode, K) } drawn over a part, in both passes (mode 'line': its
//               outline, 'fill': itself); parts shell, belly, legsLead, body, legsTrail, eyes,
//               clawLead, clawTrail (the eyes' own faces go over 'eyes')
//   look.under  the same, under a part
//   look.moves  its own moves over the base's (same form)
//   look.pose   (m, a, out, K, mv, mt) its own act on top of the base's channels (x, hop in body
//               heights)
//   look.after  (m, a, out, K, mv, mt) the same, after the base's poses (asleep, beaten)
//   look.seam   the colour of the light seam where a part crosses in front of another
//   look.fx     (ctx, m, a, K) live extras over everything
//   a.sink      (set by the dress) px the whole crab is sunk into the ground: a burrow
// K, the kit handed to them: the skeleton is a.bk (hull, top, far, rim, front, ridge, mouth, roll,
// eyes [{ root, tip }], claws, legs ...); C, P, sc, tone, outline, glow, pathOf, H, moves.
//
// The base's own notes follow.
// (base) The crab base (2026-11-25): a blank chibi crab made for a crab from the start, nothing carried
// over from another base; only the engine is shared (rig.js's springs). A plain lilac mannequin for
// designing crab monsters on: no eyes, no markings, soft construction guides only. Drawn live like
// the other blank bases: smooth shapes over its bones, outlined only on the outer edge (an outline
// pass, then a fill pass), in a soft plum ink, never near-black.
//
// The body, seen a little from the front and from above (a three-quarter view turned toward the way
// it faces), worked out in 3D and projected, so every leg fans out in depth:
//   carapace  a wide soft dome over a rim a touch wider at the front, with a shallow underside below
//             the front rim; drawn as one silhouette round the three; the top lit, the underside
//             shaded, the far side turning away; guides: the front rim, the middle line of the dome,
//             a little mouth under the front
//   legs      four walking legs a side (a hermit shows two), each three chunky segments (the long
//             upper one, the middle one, the pointed tip) arching up from under the rim and down to
//             the ground; the far side's legs behind the body a shade darker, the near side's
//             coming out from under it with no root showing
//   gait      crabs walk sideways, so it scuttles along its path with one side's legs leading and the
//             other's trailing; an alternating pattern (legs 1 and 3 of one side with 2 and 4 of the
//             other), driven by the distance walked (and by its own sideways lunges), so a planted tip
//             never slides; the body rides level with a tiny bob and sway
//   claws     two claws on two-boned arms coming out from under the front: a round palm, a fixed
//             finger and a hinged one that opens and closes; held in front, pointed the way it faces
//   eyes      two short stalks on the front of the dome, plain stubs with round caps, turning on their
//             own, folding down flat when it flinches, guards or sleeps
// Presets: crab (equal claws), fiddler (one big claw and one small, long stalks), hermit (a small
// body, a soft curled abdomen tucked into a plain spiral shell on its back; it can pull back into
// the shell, the claws closing the opening).
// Moves (CRAB_MOVES): pinch (one claw drawn back wide open, a lunge and a snap), snap (both claws in
// turn), guard (claws up in front of its face, stalks folded; a hermit ducks into its shell), froth
// (a stream of bubbles), dash (a sideways scuttle out and back), jump, dodge, hurt, knockdown
// (flipped onto its back, legs waving, rolling back up); a happy claw-clack dance (the fiddler waves
// its big claw instead). Poses (m.pose): rest (body down on the ground, legs folded), tuck (claws
// folded in front; a hermit hides in its shell), sleep (rest, stalks down, a slow bubble).

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { hold } from '../mobs/kidrig.js';
import { E } from '../mobs/kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C0 = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299' };
// (the soft ink round the outer edge, and the lighter seam where a part crosses in front of another)
const INK = '#7f6982'; // (the bases' shared soft ink, as the deertaur's)
const SEAM = '#a497bf';

const ease = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const mix = (a, b, u) => a + (b - a) * u;
const plus = (p, q) => [p[0] + q[0], p[1] + q[1]];
const minus = (p, q) => [p[0] - q[0], p[1] - q[1]];
const times = (p, k) => [p[0] * k, p[1] * k];
const mix2 = (p, q, u) => [mix(p[0], q[0], u), mix(p[1], q[1], u)];
const turnBy = (p, r) => {
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};
const add3 = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const scale3 = (p, k) => [p[0] * k, p[1] * k, p[2] * k];
const lerp3 = (p, q, u) => [mix(p[0], q[0], u), mix(p[1], q[1], u), mix(p[2], q[2], u)];
const cycleOf = (x) => ((x % 1) + 1) % 1;
const wrapAngle = (a) => a - TAU * Math.round(a / TAU);
const rgbOf = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
// (a soft limit: follows v, then leans into the limit instead of stopping dead at it)
const softLimit = (v, lim) => lim * Math.tanh(v / lim);

// A closed smooth curve through the points (Catmull-Rom), `n` steps between each two.
function smoothLoop(pts, n) {
  const out = [];
  const N = pts.length;
  for (let i = 0; i < N; i++) {
    const a = pts[(i - 1 + N) % N];
    const b = pts[i];
    const c = pts[(i + 1) % N];
    const d = pts[(i + 2) % N];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const h1 = -0.5 * t3 + t2 - 0.5 * t;
      const h2 = 1.5 * t3 - 2.5 * t2 + 1;
      const h3 = -1.5 * t3 + 2 * t2 + 0.5 * t;
      const h4 = 0.5 * t3 - 0.5 * t2;
      out.push([a[0] * h1 + b[0] * h2 + c[0] * h3 + d[0] * h4, a[1] * h1 + b[1] * h2 + c[1] * h3 + d[1] * h4]);
    }
  }
  return out;
}
// Every outline turned the same way round, so any of them filled together (nonzero) make one union.
function sameWay(pts) {
  let area = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) area += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  return area < 0 ? pts.slice().reverse() : pts;
}
// The outline round a set of points (its convex hull).
function hullOf(pts) {
  const p = pts.slice().sort((A, B) => A[0] - B[0] || A[1] - B[1]);
  const turn = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  const hi = [];
  for (const q of p) {
    while (lo.length >= 2 && turn(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (hi.length >= 2 && turn(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  }
  lo.pop();
  hi.pop();
  return lo.concat(hi);
}
// A polygon cut to the part of it above a level (y < yCut).
function above(pts, yCut) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const pin = p[1] < yCut;
    const qin = q[1] < yCut;
    if (pin) out.push(p);
    if (pin !== qin) {
      const u = (yCut - p[1]) / (q[1] - p[1]);
      out.push([mix(p[0], q[0], u), yCut]);
    }
  }
  return out;
}
const ellipsePts = (c, rx, ry, r0, n = 24) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const q = (i / n) * TAU;
    out.push(plus(c, turnBy([Math.cos(q) * rx, Math.sin(q) * ry], r0)));
  }
  return sameWay(out);
};
// One chunky limb segment from p0 to p1: round at both ends, a little fuller in the middle (so the
// joints read as soft waists between segments), r0/rm/r1 its half-widths at the start, middle, end.
function segment(p0, p1, r0, rm, r1) {
  const d = minus(p1, p0);
  const len = Math.hypot(d[0], d[1]) || 1e-3;
  const u = [d[0] / len, d[1] / len];
  const n = [-u[1], u[0]];
  const mid = mix2(p0, p1, 0.5);
  const at = (b, ku, kn) => [b[0] + u[0] * ku + n[0] * kn, b[1] + u[1] * ku + n[1] * kn];
  return sameWay(smoothLoop([at(p0, -r0, 0), at(p0, -r0 * 0.4, r0 * 0.92), at(mid, 0, rm), at(p1, r1 * 0.4, r1 * 0.92), at(p1, r1, 0), at(p1, r1 * 0.4, -r1 * 0.92), at(mid, 0, -rm), at(p0, -r0 * 0.4, -r0 * 0.92)], 5));
}
const addPoly = (ctx, pts) => {
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
};
const pathOf = (ctx, list) => {
  ctx.beginPath();
  for (const pts of list) addPoly(ctx, pts);
};

// ---------- The crabs (units: game px at scale 1; the model: x to its leading side, y up, z to its front) ----------
// cara: the carapace (rim half-width a, half-depth b, the dome's height, `fw` how much wider at the
// front, `under` its underside [a, b, y]); hb: the body's middle above the ground standing;
// legs.n: each leg on a side [z of its root, its angle out from straight sideways, + to the front];
// legs.root: [x as a share of a, y]; bones: the three segments; w: widths at the root, the two
// joints and the tip's base; reach: how far out its tip stands; claws: each arm's root, its wrist at
// rest, the arm's two bones, widths, the hand [length, width] and its angle at rest (degrees on the
// screen); reach: a lunge's [px along its path, z]; up: a raise; eyes: the stalks' roots [x, z as a
// share of b], length, width, caps, splay; mouth: [y, z as a share of b].
const CRAB = {
  name: 'Crab',
  scale: 1,
  yaw: 12,
  pitch: 20,
  hb: 7.8,
  cara: { a: 13, b: 10, dome: 10, fw: 0.1, under: [10, 7, -2.4] },
  legs: { n: [[4.4, 44, 0.8], [1.6, 12, 0.94], [-1.4, -22, 1.06], [-4.2, -58, 1.1]], root: [0.72, -0.6], bones: [8, 6.6, 4.2], w: [4, 3.5, 2.9, 1.3], reach: 9 },
  gait: { half: 2.5, lift: 2.8, duty: 0.56 },
  claws: {
    lead: { root: [9.6, -0.8, 5.2], rest: [11, 1.4, 8.4], arm: [3.4, 3.2], w: [4.2, 3.6, 3.9], hand: [9, 6.8], ang: -62 },
    trail: { root: [-9.6, -0.8, 5.2], rest: [-12.4, 1.1, 9], arm: [3.4, 3.2], w: [4.2, 3.6, 3.9], hand: [9, 6.8], ang: -70 },
    reach: [7, 1.5],
    up: [0, 6, -1.2],
  },
  eyes: { x: 2.8, z: 0.55, len: 5.6, w: 2.6, cap: 2, splay: 14 },
  mouth: [-0.5, 0.96],
  moves: ['pinch', 'snap', 'froth'],
  happy: 'dance',
};
const FIDDLER = {
  name: 'Fiddler',
  scale: 1,
  yaw: 12,
  pitch: 20,
  hb: 7.2,
  cara: { a: 11.5, b: 8.5, dome: 8.6, fw: 0.16, under: [8.6, 6, -2.2] },
  legs: { n: [[3.8, 44, 0.8], [1.4, 12, 0.94], [-1.2, -22, 1.06], [-3.6, -58, 1.1]], root: [0.72, -0.5], bones: [7, 5.8, 3.8], w: [3.6, 3.1, 2.6, 1.2], reach: 8 },
  gait: { half: 2.3, lift: 2.6, duty: 0.56 },
  claws: {
    lead: { root: [8.4, -0.6, 4.6], rest: [11.5, 1.8, 7.5], arm: [3.8, 3.6], w: [4.4, 4, 4.6], hand: [12.5, 8.4], ang: -40 },
    trail: { root: [-8.4, -0.6, 4.6], rest: [-10.6, 0.6, 7.8], arm: [3, 2.8], w: [2.8, 2.5, 2.7], hand: [4.8, 3.4], ang: -66 },
    reach: [6.5, 1.5],
    up: [0, 6, -1.2],
  },
  eyes: { x: 2.3, z: 0.5, len: 7.4, w: 2.2, cap: 1.7, splay: 8 },
  mouth: [-0.5, 0.96],
  moves: ['pinch', 'snap', 'froth'],
  happy: 'beckon',
};
// (the hermit's shell, on the body's own screen frame about its middle: its outline round from the
// mouth of the shell, the spire up and back; the opening low at the front; the abdomen's curl)
const HERMIT = {
  name: 'Hermit crab',
  scale: 1,
  yaw: 12,
  pitch: 20,
  hb: 6.6,
  cara: { a: 8, b: 6.4, dome: 6.4, fw: 0.08, under: [6, 4.4, -1.8] },
  legs: { n: [[-0.8, -4, 0.9], [-3, -40, 1]], root: [0.66, -0.6], bones: [5.4, 4.6, 3.2], w: [3.4, 3, 2.5, 1.1], reach: 5.8 },
  gait: { half: 2, lift: 2.2, duty: 0.56 },
  claws: {
    lead: { root: [6.2, -1, 4], rest: [10.4, -1.6, 6], arm: [3.2, 3], w: [3.4, 3, 3.4], hand: [7.4, 5.6], ang: -24 },
    trail: { root: [-6.2, -1, 4], rest: [-11.4, -2.4, 6.6], arm: [3, 2.8], w: [3, 2.7, 3], hand: [6, 4.6], ang: -48 },
    reach: [5.5, 1.2],
    up: [0, 5, -1],
  },
  eyes: { x: 2, z: 0.42, len: 6.2, w: 2.2, cap: 1.7, splay: 9 },
  mouth: [-0.4, 0.96],
  // (the shell: a round spiral [rx, ry, turned], its coil's middle up and back, the opening low on\n  // its front)
  shell: {
    c: [-6.6, -6.4],
    r: [9.8, 9.2, -0.3],
    coil: [-1.4, -1.6],
    ap: { c: [4.2, 4.4], rx: 4.6, ry: 3.8, rot: 0.62 },
  },
  moves: ['pinch', 'snap', 'froth'],
  happy: 'dance',
};
export const CRAB_PRESETS = { crab: CRAB, fiddler: FIDDLER, hermit: HERMIT };
export const CRAB_KINDS = ['crab', 'fiddler', 'hermit'];

// ---------- The crab moves (x, hop in body heights; lift in px; angles in degrees) ----------
// lR/tR: the leading/trailing claw's lunge (0 at rest, 1 out); lU/tU: raised (+) or lowered (-);
// lO/tO: open (0 shut, 1 wide); lA/tA: the hand's angle on the screen (0 pointing ahead, - up);
// crouch: the body down (1 on the ground); tilt: the body rolled (+ toward its front); flip: over
// onto its back; eyeF: stalks folded down; fold: legs drawn in on the ground; tuckL: legs tucked up
// in the air; wave: legs waving in the air; hide: (a hermit) into its shell; mouth: open.
const BASE_MOVES = {
  pinch: {
    anticT: 0.22,
    keys: [
      [0, { x: -0.04, crouch: 0.25, tilt: -4, lR: -0.35, lU: 0.75, lO: 1, lA: -48, tU: 0.2, eyeL: 0.3 }],
      [0.07, { x: 0.09, crouch: 0.05, tilt: 5, lR: 1.2, lU: 0.15, lO: 0.95, lA: -6, tU: 0.1 }, 'out'],
      [0.11, { x: 0.1, crouch: 0.05, tilt: 6, lR: 1.25, lU: 0.1, lO: 0, lA: 2 }, 'out'],
      [0.22, { x: 0.08, tilt: 3, lR: 1.05, lU: 0.12, lO: 0.05, lA: 0 }],
      [0.46, { x: 0.03, tilt: 1, lR: 0.4, lU: 0.1, lO: 0.25 }],
      [0.74, {}],
    ],
    spark: [0.11],
    sparkAt: 'lead',
  },
  snap: {
    anticT: 0.2,
    keys: [
      [0, { crouch: 0.25, tilt: -3, lR: -0.15, tR: -0.15, lU: 0.6, tU: 0.6, lO: 1, tO: 1, lA: -36, tA: -40 }],
      [0.08, { x: 0.05, tilt: 3, lR: 0.95, lU: 0.15, lO: 0, lA: -4, tR: 0.2, tU: 0.55, tO: 1, tA: -40 }, 'out'],
      [0.2, { x: 0.05, tilt: 1, lR: 0.5, lU: 0.4, lO: 0.85, lA: -20, tR: 0.9, tU: 0.25, tO: 1, tA: -8 }, 'io'],
      [0.27, { x: 0.08, tilt: 4, lR: 0.45, lU: 0.4, lO: 0.8, tR: 1.05, tU: 0.15, tO: 0, tA: -2 }, 'out'],
      [0.44, { x: 0.05, tilt: 1, lR: 0.4, tR: 0.6, lO: 0.25, tO: 0.2, lU: 0.2, tU: 0.15 }],
      [0.74, {}],
    ],
    spark: [0.08, 0.27],
    sparkAt: ['lead', 'trail'],
  },
  guard: {
    anticT: 0.12,
    keys: [
      [0, { crouch: 0.3, lU: 0.4, tU: 0.4, lO: 0.3, tO: 0.3 }],
      [0.12, { x: -0.03, crouch: 0.6, tilt: -2, lR: 0.15, tR: 0.45, lU: 1.15, tU: 1.05, lA: -82, tA: -66, lO: 0, tO: 0, eyeF: 1, fold: 0.4, hide: 0.85 }, 'out'],
      [0.8, { x: -0.03, crouch: 0.6, tilt: -2, lR: 0.15, tR: 0.45, lU: 1.15, tU: 1.05, lA: -82, tA: -66, lO: 0, tO: 0, eyeF: 1, fold: 0.4, hide: 0.85 }],
      [1.08, {}],
    ],
  },
  froth: {
    anticT: 0.24,
    keys: [
      [0, { crouch: 0.3, tilt: -4, lU: 0.3, tU: 0.3, lO: 0.5, tO: 0.5, lR: -0.2, tR: -0.2, mouth: 0.3 }],
      [0.14, { lift: 1.4, tilt: 4, mouth: 1, lU: 0.55, tU: 0.55, lR: -0.3, tR: -0.35, lA: -30, tA: -34, lO: 0.7, tO: 0.7 }, 'out'],
      [0.5, { lift: 1, tilt: 1, mouth: 0.9, lU: 0.5, tU: 0.5, lR: -0.3, tR: -0.35, lA: -26, tA: -30, lO: 0.55, tO: 0.55 }, 'io'],
      [0.86, { lift: 1.2, tilt: 3, mouth: 0.9, lU: 0.55, tU: 0.55, lR: -0.3, tR: -0.35, lA: -30, tA: -34, lO: 0.7, tO: 0.7 }, 'io'],
      [1.12, {}],
    ],
    bubbles: [0.1, 0.86],
    spark: [0.3],
    sparkAt: 'froth',
  },
  dash: {
    anticT: 0.08,
    keys: [
      [0, { crouch: 0.35, x: -0.03, tilt: -3 }],
      [0.26, { x: 0.55, crouch: 0.15, tilt: 4, lU: 0.25, tU: 0.25, eyeL: -0.6 }, 'out'],
      [0.42, { x: 0.6, crouch: 0.12, tilt: 0, lU: 0.2, tU: 0.2 }, 'io'],
      [0.9, {}],
    ],
    lines: [0, 0.32],
    dust: [[0.02, 'feet']],
  },
  jump: {
    anticT: 0.16,
    keys: [
      [0, { crouch: 0.75, tilt: -2, lU: 0.2, tU: 0.2 }],
      [0.16, { hop: 0.8, crouch: 0, tuckL: 0.75, tilt: 3, lU: 0.7, tU: 0.7, lO: 0.6, tO: 0.6, lA: -30, tA: -30 }, 'out'],
      [0.32, { hop: 0.86, tuckL: 0.85, tilt: 0, lU: 0.8, tU: 0.8, lO: 0.7, tO: 0.7, lA: -40, tA: -40 }, 'out'],
      [0.5, { hop: 0.02, tuckL: 0.1, tilt: -2, lU: 0.3, tU: 0.3 }, 'in'],
      [0.56, { crouch: 0.55 }, 'out'],
      [0.88, {}],
    ],
    dust: [[0, 'feet'], [0.52, 'feet']],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.35 }],
      [0.12, { hop: 0.24, x: -0.36, tilt: -9, tuckL: 0.5, eyeF: 0.7, lU: 0.5, tU: 0.5, lO: 0.5, tO: 0.5 }, 'out'],
      [0.3, { x: -0.4, crouch: 0.4, tilt: 2, eyeF: 0.3 }, 'in'],
      [0.8, {}],
    ],
    dust: [[0.3, 'feet']],
  },
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.04, tilt: -7, crouch: 0.3, eyeF: 1, lU: 0.6, tU: 0.6, lO: 0.85, tO: 0.85, lR: -0.2, tR: -0.2, mouth: 0.4, hide: 0.3 }, 'out'],
      [0.22, { x: -0.04, tilt: -4, crouch: 0.25, eyeF: 0.9, lU: 0.4, tU: 0.4, lO: 0.5, tO: 0.5, mouth: 0.2, hide: 0.25 }],
      [0.6, {}],
    ],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.12, { x: -0.05, tilt: -12, crouch: 0.2, eyeF: 1, lU: 0.8, tU: 0.8, lO: 1, tO: 1 }, 'out'],
      [0.4, { flip: 0.7, x: -0.12, hop: 0.3, eyeF: 1, wave: 0.4, lU: 0.5, tU: 0.5, lO: 0.8, tO: 0.8 }, 'io'],
      [0.56, { flip: 1, x: -0.14, hop: 0, eyeF: 1, wave: 1, lO: 0.6, tO: 0.6 }, 'in'],
      [0.64, { flip: 0.96, x: -0.14, eyeF: 1, wave: 1 }, 'out'],
      [1.3, { flip: 1, x: -0.14, eyeF: 1, wave: 1 }],
      [1.56, { flip: 0.45, x: -0.1, hop: 0.24, wave: 0.3, eyeF: 1 }, 'io'],
      [1.74, { flip: 0, x: -0.06, hop: 0, crouch: 0.5, eyeF: 0.5 }, 'in'],
      [2.05, {}],
    ],
    dust: [[0.56, 'body'], [1.74, 'feet']],
  },
  // Pleased: claws up high, clacking open and shut in time while it shuffles from side to side.
  dance: {
    anticT: 0.16,
    keys: [
      [0, { lU: 1.2, tU: 1.2, lA: -92, tA: -80, lO: 1, tO: 1, lR: 0.1, tR: 0.2, crouch: 0.15 }],
      [0.2, { x: 0.06, tilt: 5, lU: 1.3, tU: 1.15, lA: -92, tA: -80, lO: 0, tO: 0, lR: 0.1, tR: 0.2, lift: 1.2 }, 'io'],
      [0.4, { x: 0, tilt: 0, lU: 1.2, tU: 1.2, lA: -92, tA: -80, lO: 1, tO: 1, lR: 0.1, tR: 0.2, crouch: 0.15 }, 'io'],
      [0.6, { x: -0.06, tilt: -5, lU: 1.15, tU: 1.3, lA: -92, tA: -80, lO: 0, tO: 0, lR: 0.1, tR: 0.2, lift: 1.2 }, 'io'],
      [0.8, { x: 0, tilt: 0, lU: 1.2, tU: 1.2, lA: -92, tA: -80, lO: 1, tO: 1, lR: 0.1, tR: 0.2, crouch: 0.15 }, 'io'],
      [1, { x: 0.06, tilt: 5, lU: 1.3, tU: 1.15, lA: -92, tA: -80, lO: 0, tO: 0, lR: 0.1, tR: 0.2, lift: 1.2 }, 'io'],
      [1.22, { x: 0, tilt: 0, lU: 1.1, tU: 1.1, lA: -80, tA: -70, lO: 0.5, tO: 0.5, lR: 0.1, tR: 0.2 }, 'io'],
      [1.6, {}],
    ],
    clack: [0.2, 0.6, 1],
  },
  // (the fiddler's: its big claw raised high and waved down and up, beckoning, the body bobbing)
  beckon: {
    anticT: 0.18,
    keys: [
      [0, { lU: 1.3, lA: -96, lO: 0.2, lR: 0.1, crouch: 0.1, tilt: -2 }],
      [0.24, { lU: 0.55, lA: -40, lO: 0.1, lR: 0.3, lift: 1, tilt: 3 }, 'io'],
      [0.48, { lU: 1.35, lA: -98, lO: 0.25, lR: 0.1, crouch: 0.1, tilt: -2 }, 'io'],
      [0.72, { lU: 0.55, lA: -40, lO: 0.1, lR: 0.3, lift: 1, tilt: 3 }, 'io'],
      [0.96, { lU: 1.35, lA: -98, lO: 0.25, lR: 0.1, crouch: 0.1, tilt: -2 }, 'io'],
      [1.2, { lU: 0.55, lA: -40, lO: 0.1, lR: 0.3, lift: 1, tilt: 3 }, 'io'],
      [1.6, {}],
    ],
  },
};
export const CRAB_SHOW = ['pinch', 'snap', 'guard', 'froth', 'dash', 'jump', 'dodge', 'hurt', 'knockdown', 'dance', 'beckon'];
const POOL = ['pinch', 'snap', 'froth'];
const lastKey = (mv) => mv.keys[mv.keys.length - 1][0];
const EASES = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: ease };
// A move's pose at time t (before 0: the wind-up, easing from the rest pose into the first key).
function keyed(mv, t, windW, rest) {
  const keys = mv.keys;
  const full = (i) => ({ ...rest, ...keys[i][1] });
  if (t < 0) {
    const k0 = full(0);
    const out = {};
    for (const c of Object.keys(rest)) out[c] = mix(rest[c], k0[c], ease(windW));
    return out;
  }
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return full(keys.length - 1);
  const p0 = full(i);
  const p1 = full(i + 1);
  const span = Math.max(1e-6, keys[i + 1][0] - keys[i][0]);
  const u = (EASES[keys[i + 1][2]] ?? ease)(clamp((t - keys[i][0]) / span, 0, 1));
  const out = {};
  for (const c of Object.keys(p0)) out[c] = mix(p0[c], p1[c], u);
  return out;
}
// (0..1 through a short window after a moment, or -1)
const after = (moment, t, len) => (t >= moment && t <= moment + len ? (t - moment) / len : -1);

const CH = ['x', 'lift', 'hop', 'crouch', 'tilt', 'flip', 'turn', 'lR', 'lU', 'lO', 'lA', 'tR', 'tU', 'tO', 'tA', 'eyeF', 'eyeL', 'fold', 'tuckL', 'wave', 'hide', 'mouth'];
const NOTHING = () => sprite('rig|crabblank', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// ---------- One rig for a preset ----------
function crabRig(look = {}) {
  // (the dress, by a name the base's own code never uses)
  const DRESS = look;
  const LP = look.P ?? {};
  const P0 = CRAB_PRESETS[look.kind ?? 'crab'];
  const P = { ...P0 };
  for (const [k, v] of Object.entries(LP)) P[k] = v && typeof v === 'object' && !Array.isArray(v) ? { ...(P0[k] ?? {}), ...v } : v;
  const C = { ...C0, ...(look.C ?? {}) };
  // (the claws' and legs' own colours, over the body's)
  const CC = { ...C, ...(look.CC ?? {}) };
  const CRAB_MOVES = { ...BASE_MOVES, ...(look.moves ?? {}) };
  const s = P.scale;
  const sc = (v) => v * s;
  const v3 = (p) => p.map(sc);
  const CP = Math.cos(P.pitch * D2R);
  const SP = Math.sin(P.pitch * D2R);
  const K = P.cara;
  const A = sc(K.a);
  const B = sc(K.b);
  const DOME = sc(K.dome);
  // The view: the model turned (yaw) toward the way it faces, then seen from a little above.
  const viewOf = (yawDeg) => {
    const cy = Math.cos(yawDeg * D2R);
    const sy = Math.sin(yawDeg * D2R);
    // (a step along its path in the model: what moves a point straight along the screen)
    const along = [cy, 0, sy];
    const proj = (p) => {
      const x = p[0] * cy + p[2] * sy;
      const z = -p[0] * sy + p[2] * cy;
      return [x, -p[1] * CP + z * SP, z];
    };
    return { proj, along };
  };
  // The carapace, as rings of points round it: the rim, the dome's rings up to the top, the
  // underside; projected and wrapped each frame.
  const rimAt = (q, a, b, fw) => [a * Math.cos(q) * (1 + fw * Math.sin(q)), b * Math.sin(q)];
  const RIM = [];
  const SOLID = [];
  for (let i = 0; i < 40; i++) {
    const q = (i / 40) * TAU;
    const [x, z] = rimAt(q, A, B, K.fw);
    RIM.push([x, 0, z, q]);
    SOLID.push([x, 0, z]);
    for (const th of [18, 36, 54, 72]) {
      const k = Math.cos(th * D2R);
      SOLID.push([x * k, DOME * Math.sin(th * D2R), z * k]);
    }
    const [ux, uz] = rimAt(q, sc(K.under[0]), sc(K.under[1]), K.fw);
    SOLID.push([ux, sc(K.under[2]), uz]);
  }
  SOLID.push([0, DOME, 0]);
  // (a point on the dome above x, z)
  const domeY = (x, z) => DOME * Math.sqrt(Math.max(0, 1 - (x / A) ** 2 - (z / B) ** 2));

  // The legs: each one's root under the rim, the way it points out, its rest tip, its step's phase
  // (the alternating pattern: 1 and 3 of one side with 2 and 4 of the other).
  const LG = P.legs;
  const [l1, l2, l3] = LG.bones.map(sc);
  const LW = LG.w.map(sc);
  const legs = [];
  for (const side of [1, -1]) {
    LG.n.forEach(([z, az, k = 1], i) => {
      const root = [side * A * LG.root[0], sc(LG.root[1]), sc(z)];
      const out = [side * Math.cos(az * D2R), 0, Math.sin(az * D2R)];
      const four = LG.n.length === 4 ? i : i + 1;
      legs.push({ side, i, root, out, k, reach: sc(LG.reach) * k, lens: [l1 * k, l2 * k, l3 * mix(1, k, 0.5)], tip: add3(root, scale3(out, sc(LG.reach) * k)), ph: ((four + (side > 0 ? 0 : 1)) % 2) * 0.5 + four * 0.035, key: `${side > 0 ? 'L' : 'T'}${i}` });
    });
  }
  const G = { half: sc(P.gait.half), lift: sc(P.gait.lift), duty: P.gait.duty };
  const cycle = (2 * G.half) / G.duty;
  const walkSpeed = cycle * 2.1;
  // A tip's place through its step at phase q: planted (sliding back under the body exactly as far
  // as the body goes), then lifted in an eased arc and set down ahead.
  const stepAt = (u, ph) => {
    const q = cycleOf(u + ph);
    if (q < G.duty) {
      const k = q / G.duty;
      return { dx: G.half - 2 * G.half * k, lift: 0, v: -1 };
    }
    const v = (q - G.duty) / (1 - G.duty);
    return { dx: -G.half + 2 * G.half * (0.5 - 0.5 * Math.cos(Math.PI * v)), lift: G.lift * Math.sin(Math.PI * v) ** 0.85, v };
  };
  // A leg's three segments reaching its tip (`foot`, model), the tip segment slanting `a3` out from
  // straight down: worked out in the upright plane through its root and its tip, the knee arching up.
  const legBones = (L, foot, a3) => {
    const R = L.root;
    const [l1, l2, l3] = L.lens;
    const hx = foot[0] - R[0];
    const hz = foot[2] - R[2];
    const hd = Math.hypot(hx, hz) || 1e-3;
    const e = [hx / hd, hz / hd];
    const fv = foot[1] - R[1];
    const jh = hd + Math.sin(a3) * l3;
    const jv = fv + Math.cos(a3) * l3;
    const d0 = Math.hypot(jh, jv) || 1e-3;
    const d = clamp(d0, 0.5, l1 + l2 - 0.01);
    const phi = Math.atan2(jv, jh);
    const bend = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const k = phi + bend;
    const J1 = [Math.cos(k) * l1, Math.sin(k) * l1];
    const J2 = [Math.cos(phi) * d, Math.sin(phi) * d];
    const T = [J2[0] - Math.sin(a3) * l3, J2[1] - Math.cos(a3) * l3];
    const to = ([h, v]) => [R[0] + e[0] * h, R[1] + v, R[2] + e[1] * h];
    return [R, to(J1), to(J2), to(T)];
  };
  // The claws, the eyes, the mouth in the model.
  const CL = P.claws;
  const CLAW = {};
  for (const k of ['lead', 'trail']) {
    const c = CL[k];
    CLAW[k] = { root: v3(c.root), rest: v3(c.rest), arm: c.arm.map(sc), w: c.w.map(sc), L: sc(c.hand[0]), W: sc(c.hand[1]), ang: c.ang, side: k === 'lead' ? 1 : -1 };
  }
  const EY = P.eyes;
  const eyeRoot = (side) => {
    const x = side * sc(EY.x);
    const z = B * EY.z;
    return [x, domeY(x, z) - sc(0.5), z];
  };
  const MOUTH = [0, sc(P.mouth[0]), B * P.mouth[1]];
  // The hermit's shell, in the body's own screen frame.
  const SH = P.shell
    ? (() => {
        const c = v3(P.shell.c);
        const [rx, ry, r0] = P.shell.r;
        const out = ellipsePts(c, sc(rx), sc(ry), r0, 44);
        const coil = plus(c, v3(P.shell.coil));
        const ap = P.shell.ap;
        const apC = plus(c, v3(ap.c));
        return { c, coil, R: sc(Math.min(rx, ry)), out, apC, ap: ellipsePts(apC, sc(ap.rx), sc(ap.ry), ap.rot, 28), apR: [sc(ap.rx), sc(ap.ry), ap.rot], top: Math.min(...out.map((p) => p[1])), bottom: Math.max(...out.map((p) => p[1])) };
      })()
    : null;

  // Sizes, from the rest pose.
  const V0 = viewOf(P.yaw);
  const hull0 = hullOf(SOLID.map((p) => V0.proj(p)));
  const hullTop = -Math.min(...hull0.map((p) => p[1]));
  const hullLow = Math.max(...hull0.map((p) => p[1]));
  const eyeTop = -V0.proj(add3(eyeRoot(1), [0, sc(EY.len), 0]))[1] + sc(EY.cap);
  const GY = sc(P.hb) * CP;
  const H = GY + Math.max(hullTop, eyeTop, SH ? -SH.top : 0);
  const span = (A * LG.root[0] + sc(LG.reach) + l3 * 0.4) * 2;
  // (resting: the underside down on the ground)
  const GY_LOW = hullLow + sc(0.3);

  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const t = a.t + (m.uid % 7) * 1.3;
    const dt = clamp(a.dt ?? 0, 0, 0.05);
    const { proj, along } = viewOf(P.yaw + S.turn);
    // The step: its phase from the distance walked and from its own lunges, so planted tips stay put.
    const odo = m.odo ?? 0;
    const dO = odo - (st.crOdo ?? odo);
    st.crOdo = odo;
    const dX = S.x - (st.crX ?? S.x);
    st.crX = S.x;
    const went = (Math.abs(dO) < 40 ? dO : 0) + dX;
    st.crU = cycleOf((st.crU ?? 0) + went / cycle);
    const u = st.crU;
    const pace = dt > 0 ? Math.abs(went) / dt : 0;
    st.crPace = (st.crPace ?? 0) + (pace - (st.crPace ?? 0)) * Math.min(1, dt * 9);
    const wGoal = clamp(st.crPace / (walkSpeed * 0.3), 0, 1);
    st.crW = (st.crW ?? 0) + (wGoal - (st.crW ?? 0)) * Math.min(1, dt * 10);
    // (its pace, for the walk-pace check: it only ever scuttles, one step of each leg per cycle)
    a.gait = { run: 0, v: st.crPace, walkSpeed: m.def?.speed ?? walkSpeed, cadence: st.crPace / cycle };
    const w = st.crW;
    // The body: its height (crouched, rested, hidden in its shell), a tiny bob as each set of legs
    // takes the weight, a small sway; rolled (tilt, and right over onto its back); never into the
    // ground, however it rolls.
    const flip = clamp(S.flip, -0.2, 1.2);
    const hide = SH ? clamp(S.hide, 0, 1) : 0;
    const shift = SH ? times(minus(SH.apC, [sc(1.2), sc(-0.4)]), ease(hide)) : [0, 0];
    const bob = w * sc(0.3) * Math.cos(2 * TAU * (u - G.duty / 2));
    const sway = w * 1.1 * Math.sin(TAU * (u - G.duty / 2));
    const roll = (S.tilt + sway) * D2R - flip * Math.PI;
    let gy = mix(GY, GY_LOW, clamp(S.crouch, -0.3, 1.1)) + S.lift + bob;
    if (SH) gy = mix(gy, SH.bottom + sc(0.2), ease(hide));
    const hullB = hullOf(SOLID.map((p) => proj(p)));
    let low = 0;
    for (const p of hullB) low = Math.max(low, turnBy(plus(p, shift), roll)[1]);
    if (SH) for (const p of SH.out) low = Math.max(low, turnBy(p, roll)[1]);
    gy = Math.max(gy, low + sc(0.2) * Math.min(1, Math.abs(flip) * 3));
    // (the dress may sink it into the ground itself: a burrow; a.sink px)
    const pivot = [S.x, -gy - S.hop + (a.sink ?? 0)];
    const world = (p) => plus(pivot, turnBy(p, roll));
    const body = (p3) => world(plus(proj(p3), shift));
    // (a planted tip is held where it is on the ground, whatever the body does above it)
    const groundY = -gy / CP;
    const plant = 1 - clamp(Math.abs(flip) * 2.5, 0, 1);
    const anchor = (F) => {
      const fs = proj(F);
      const want = minus(turnBy(fs, -roll), shift);
      const dx = (want[0] - fs[0]) * plant;
      const dy = (want[1] - fs[1]) * plant;
      return [F[0] + along[0] * dx, F[1] - dy / CP, F[2] + along[2] * dx];
    };
    // The legs.
    const fold = clamp(S.fold, 0, 1);
    const tuck = Math.max(clamp(S.tuckL, 0, 1), ease(hide) * 0.95);
    const wave = ease(S.wave);
    const tap = a.crTap ?? 0;
    const LEG = [];
    for (const L of legs) {
      const g = stepAt(u, L.ph);
      let F = [L.tip[0] + along[0] * g.dx * w, groundY + (g.lift * w) / CP, L.tip[2] + along[2] * g.dx * w];
      F = lerp3(F, [L.root[0] + L.out[0] * L.reach * 0.62, groundY, L.root[2] + L.out[2] * L.reach * 0.62], fold * (1 - w));
      if (L.side < 0 && L.i === 0) F[1] += (tap * sc(1.6)) / CP;
      F = anchor(F);
      F = lerp3(F, add3(L.root, [L.out[0] * L.reach * 0.55, -sc(2.4), L.out[2] * L.reach * 0.55]), tuck);
      const wv = Math.sin(t * 12 + L.i * 1.9 + (L.side > 0 ? 0.8 : 0));
      const waveTip = add3(L.root, [L.out[0] * L.reach * 0.72 + along[0] * wv * sc(1.6), -sc(8.6) + Math.cos(t * 12 + L.i * 1.9) * sc(2), L.out[2] * L.reach * 0.72 + along[2] * wv * sc(1.6)]);
      F = lerp3(F, waveTip, wave);
      const a3 = 0.28 + (g.v >= 0 ? 0.3 * Math.sin(Math.PI * g.v) * w : 0) - tuck * 0.6 - wave * 0.4 + fold * 0.15;
      const bones = legBones(L, F, a3);
      const pts = bones.map((p) => body(p));
      LEG.push({ L, pts, depth: proj(bones[1])[2] + proj(bones[3])[2] });
    }
    const legsOf = (side) => LEG.filter((g) => g.L.side === side).sort((p, q) => p.depth - q.depth);
    // The claws: each wrist where its pose puts it (never under the ground), the arm's two bones
    // reaching it (the elbow out and down), the hand turned as the pose turns it, but never bent back
    // too far against the forearm.
    const CLW = {};
    const flail = wave;
    for (const k of ['lead', 'trail']) {
      const c = CLAW[k];
      const R = k === 'lead' ? S.lR : S.tR;
      const U = k === 'lead' ? S.lU : S.tU;
      const Wm = add3(add3(c.rest, add3(scale3(along, sc(CL.reach[0]) * R), [0, 0, sc(CL.reach[1]) * R])), scale3(v3(CL.up), U));
      if (Math.abs(flip) < 0.3) Wm[1] = Math.max(Wm[1], groundY + (c.W * 0.5) / CP);
      const rs = plus(proj(c.root), shift);
      let ws = plus(proj(Wm), shift);
      // (a hermit hiding: the claws closing the shell's opening like a door, one over the other)
      const door = SH ? ease(hide) : 0;
      if (door > 0) ws = mix2(ws, plus(SH.apC, k === 'lead' ? [sc(2.4), sc(0.8)] : [-sc(2.8), sc(2.6)]), door);
      const [a1, a2] = c.arm;
      const dv = minus(ws, rs);
      const d0 = Math.hypot(dv[0], dv[1]) || 1e-3;
      const d = clamp(d0, Math.abs(a1 - a2) + 0.3, a1 + a2 - 0.02);
      const phi = Math.atan2(dv[1], dv[0]);
      const bend = Math.acos(clamp((a1 * a1 + d * d - a2 * a2) / (2 * a1 * d), -1, 1));
      // (the elbow on the side of a pole out and down from the shoulder)
      const pole = plus(rs, [c.side * sc(6), sc(8)]);
      const cand = [phi + bend, phi - bend].map((q) => plus(rs, [Math.cos(q) * a1, Math.sin(q) * a1]));
      // (the copy's fix: the elbow stays on the side it was on last frame, so it never flips across as
      // a wrist passes the shoulder; only with the arm near straight, where both sides meet, does it
      // go back to out and down)
      const prevE = st[`crElb${k}`];
      const near = d > (a1 + a2) * 0.993 || !prevE;
      const ref = near ? pole : prevE;
      const elbow = Math.hypot(...minus(cand[0], ref)) < Math.hypot(...minus(cand[1], ref)) ? cand[0] : cand[1];
      st[`crElb${k}`] = elbow;
      const wrist = plus(rs, [Math.cos(phi) * d, Math.sin(phi) * d]);
      const fore = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]);
      const want = (k === 'lead' ? S.lA : S.tA) * D2R;
      // (each turn the hand makes is taken the way it went last frame, never flipped round the other
      // way as it passes straight back: a copy's fix, so a hand raised high or a door closing never pops)
      const unwrap = (key, d) => {
        const prev = st[key];
        let v = prev == null || !Number.isFinite(prev) ? d : prev + wrapAngle(d - prev);
        if (Math.abs(v) > 1.5 * Math.PI) v = wrapAngle(v);
        st[key] = v;
        return v;
      };
      let ang = fore + softLimit(unwrap(`crHand${k}`, wrapAngle(want - fore)), 1.9);
      if (door > 0) ang += unwrap(`crDoor${k}`, wrapAngle((k === 'lead' ? Math.PI : 0) - ang)) * door;
      else st[`crDoor${k}`] = null;
      let open = clamp(k === 'lead' ? S.lO : S.tO, 0, 1.15) * (1 - door);
      open = mix(open, 0.5 + 0.45 * Math.sin(t * 10 + (k === 'lead' ? 0 : 1.7)), flail * 0.8);
      CLW[k] = { c, S: world(rs), E: world(elbow), W: world(wrist), ang: ang + roll, open };
    }
    // The eye stalks: up from the front of the dome, splayed a little, each turning on its own,
    // folding out and down flat.
    const EYE = [];
    const look = a.crLook ?? [0, 0];
    for (const side of [1, -1]) {
      const r = eyeRoot(side);
      const f = clamp(S.eyeF, 0, 1);
      const sp = (EY.splay + f * 72) * D2R;
      const lean = (6 + f * 30) * D2R;
      const lk = (look[side > 0 ? 0 : 1] * 22 + S.eyeL * 18) * D2R;
      let dvec = [side * Math.sin(sp) * Math.cos(lean), Math.cos(sp) * Math.cos(lean), Math.sin(lean)];
      dvec = [dvec[0] * Math.cos(lk) + dvec[2] * Math.sin(lk), dvec[1], -dvec[0] * Math.sin(lk) + dvec[2] * Math.cos(lk)];
      const tip = add3(r, scale3(dvec, sc(EY.len)));
      EYE.push({ side, root: body(r), tip: body(tip), mid: body(lerp3(r, tip, 0.5)) });
    }
    // The carapace's outline, its rim, the shell.
    const hullW = hullB.map((p) => world(plus(p, shift)));
    const rimP = RIM.map((p) => proj(p));
    let i0 = rimP.findIndex((p, i) => p[2] > 0 && rimP[(i - 1 + rimP.length) % rimP.length][2] <= 0);
    if (i0 < 0) i0 = 0;
    const front = [];
    for (let k = 0; k < rimP.length; k++) {
      const p = rimP[(i0 + k) % rimP.length];
      if (p[2] <= 0) break;
      front.push(world(plus(p, shift)));
    }
    const rimW = sameWay(rimP.map((p) => world(plus(p, shift))));
    let shell = null;
    if (SH) {
      // (the shell sways a touch on the abdomen, a damped spring jolted as the body moves)
      const sw = (st.crShell ??= { x: 0, v: 0, px: pivot[0], vx: 0 });
      const vx = dt > 0 ? (pivot[0] - sw.px) / dt : 0;
      const ax = dt > 0 ? (vx - sw.vx) / dt : 0;
      sw.px = pivot[0];
      sw.vx = vx;
      sw.v += (-sw.x * 160 - sw.v * 17 - clamp(ax, -2000, 2000) * 0.00035) * dt;
      sw.x = clamp(sw.x + sw.v * dt, -0.12, 0.12);
      const sR = roll + sw.x;
      const sW = (p) => plus(pivot, turnBy(p, sR));
      // (the curtain: as it hides, whatever is above it and over the shell is inside the shell)
      const cut = mix(SH.top - sc(4), SH.bottom + sc(5), ease(hide));
      shell = {
        out: SH.out.map(sW),
        ap: SH.ap.map(sW),
        apC: sW(SH.apC),
        apR: SH.apR,
        rot: sR,
        sw: sW,
        hidden: hide > 0.002 ? [[[-1e3, -1e3], [1e3, -1e3], [1e3, cut], [-1e3, cut]].map(sW), above(SH.ap, cut).map(sW)] : null,
        belly: [plus(shift, [-sc(3.2), -sc(0.6)]), plus(SH.apC, [-sc(1.4), sc(0.2)]), plus(SH.apC, [-sc(2.6), -sc(2.2)])].map(sW),
      };
    }
    // (where things happen, for the effects)
    const tipOf = (k) => {
      const c = CLW[k];
      return plus(c.W, turnBy([c.c.L * 0.92, 0], c.ang));
    };
    return {
      pivot, roll, world, body, gy, flip, hide, shift,
      hull: hullW, rim: rimW, front,
      top: body([0, DOME * 0.82, -B * 0.12]), far: body([A * 0.9, 0, -B * 0.2]), under: body([0, sc(K.under[2]), sc(K.under[1]) * 0.9]),
      ridge: [0.95, 0.7, 0.4, 0, -0.45].map((k) => body([0, domeY(0, B * k) + sc(0.05), B * k])),
      mouth: body(MOUTH), mouthOpen: clamp(S.mouth, 0, 1),
      legsLead: legsOf(1), legsTrail: legsOf(-1),
      claws: CLW, eyes: EYE, eyeFold: clamp(S.eyeF, 0, 1), shell,
      spots: { lead: tipOf('lead'), trail: tipOf('trail'), mouth: body(MOUTH), feet: [pivot[0], 0], body: [pivot[0], -sc(3)] },
    };
  }

  // ---------- Drawing ----------
  const tone = (a, c, al = 1) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = rgbOf(c);
    const f = (v) => Math.round(v + (255 - v) * k);
    return al >= 1 ? `rgb(${f(r)},${f(g)},${f(b)})` : `rgba(${f(r)},${f(g)},${f(b)},${al})`;
  };
  const outline = (ctx) => {
    ctx.strokeStyle = DRESS.ink ?? INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  // A soft light (or shade) round a point.
  const glow = (ctx, c, r, col, k) => {
    const [cr, cg, cb] = rgbOf(col);
    const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
    gr.addColorStop(0, `rgba(${cr},${cg},${cb},${k})`);
    gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
  };
  // A seam: where a part crosses in front of others (`over`: their outlines), a soft line just
  // outside its own edge, drawn before its fill so only the outer half shows; `except`: outlines
  // where it grows out of something and must show no line.
  const seam = (ctx, a, shapes, over, except = []) => {
    if (!over.length) return;
    ctx.save();
    pathOf(ctx, over);
    ctx.clip('nonzero');
    if (except.length) {
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      for (const e of except) addPoly(ctx, e);
      ctx.clip('evenodd');
    }
    pathOf(ctx, shapes);
    ctx.strokeStyle = tone(a, DRESS.seam ?? SEAM);
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  };
  // (keeps drawing outside a shape)
  const outside = (ctx, shape) => {
    ctx.beginPath();
    ctx.rect(-1e4, -1e4, 2e4, 2e4);
    addPoly(ctx, shape);
    ctx.clip('evenodd');
  };
  // (a hermit's parts: as it hides, wiped away from the top down, except in the shell's opening)
  const inShell = (ctx, sk) => {
    if (!sk.shell?.hidden) return;
    const [o, ap] = sk.shell.hidden;
    if (o.length < 3) return;
    ctx.beginPath();
    ctx.rect(-1e4, -1e4, 2e4, 2e4);
    addPoly(ctx, o);
    if (ap.length >= 3) addPoly(ctx, ap);
    ctx.clip('evenodd');
  };
  // A soft rim of shade along a shape's lower edge: the shape in shade, then in its own colour
  // nudged up and back, over it.
  const rimShade = (ctx, a, shapes, base, shade, nudge) => {
    pathOf(ctx, shapes);
    ctx.fillStyle = tone(a, shade);
    ctx.fill('nonzero');
    ctx.save();
    pathOf(ctx, shapes);
    ctx.clip('nonzero');
    ctx.translate(-nudge * 0.55, -nudge);
    pathOf(ctx, shapes);
    ctx.fillStyle = tone(a, base);
    ctx.fill('nonzero');
    ctx.restore();
  };

  // A leg's shape: its three segments, chunky, the tip a soft point.
  const legShape = (g) => {
    const [R, J1, J2, T] = g.pts;
    return [segment(R, J1, LW[0] / 2, LW[0] * 0.54, LW[1] / 2), segment(J1, J2, LW[1] / 2, LW[1] * 0.52, LW[2] / 2), segment(J2, T, LW[2] / 2, LW[2] * 0.4, LW[3] / 2)];
  };
  // Where a leg crosses in front of the legs already drawn: no line, only a soft shade it casts on them.
  const contact = (ctx, a, shapes, over, col) => {
    if (!over.length) return;
    ctx.save();
    pathOf(ctx, over);
    ctx.clip('nonzero');
    ctx.translate(sc(0.5), sc(0.8));
    pathOf(ctx, shapes);
    ctx.fillStyle = tone(a, col, 0.6);
    ctx.fill('nonzero');
    ctx.restore();
  };
  // The far side's legs, behind the body, a shade darker.
  function drawLegsLead(ctx, a, mode) {
    const sk = a.bk;
    ctx.save();
    inShell(ctx, sk);
    const done = [];
    for (const g of sk.legsLead) {
      const sh = legShape(g);
      pathOf(ctx, sh);
      if (mode === 'line') outline(ctx);
      else {
        contact(ctx, a, sh, done, CC.deep);
        rimShade(ctx, a, sh, CC.sh, CC.deep, sc(0.7));
        done.push(...sh);
      }
    }
    ctx.restore();
  }
  // The near side's legs: only where they come out from under the body, so no root ever shows; where
  // one crosses another, only a soft shade.
  function drawLegsTrail(ctx, a, mode) {
    const sk = a.bk;
    ctx.save();
    inShell(ctx, sk);
    if (mode === 'line') {
      for (const g of sk.legsTrail) {
        pathOf(ctx, legShape(g));
        outline(ctx);
      }
      ctx.restore();
      return;
    }
    outside(ctx, sk.hull);
    const done = [];
    for (const g of sk.legsTrail) {
      const sh = legShape(g);
      contact(ctx, a, sh, done, CC.sh);
      rimShade(ctx, a, sh, CC.base, CC.sh, sc(0.75));
      done.push(...sh);
    }
    ctx.restore();
    // (over the body's edge where a leg comes out, its own colour, so not even a hairline shows)
    for (const g of sk.legsTrail) {
      ctx.save();
      pathOf(ctx, legShape(g));
      ctx.clip('nonzero');
      ctx.beginPath();
      addPoly(ctx, sk.hull);
      ctx.strokeStyle = tone(a, CC.base);
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }
    a.bk.trailShapes = sk.legsTrail.flatMap(legShape).map((p) => p);
  }
  // The carapace: one silhouette; the dome lit, the far side turning away into shade, the underside
  // shaded below the front rim; guides along the front rim and the dome's middle; the mouth.
  function drawBody(ctx, a, mode) {
    const sk = a.bk;
    ctx.save();
    inShell(ctx, sk);
    pathOf(ctx, [sk.hull]);
    if (mode === 'line') {
      outline(ctx);
      ctx.restore();
      return;
    }
    if (sk.shell) seam(ctx, a, [sk.hull], [sk.shell.out]);
    pathOf(ctx, [sk.hull]);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    pathOf(ctx, [sk.hull]);
    ctx.clip();
    glow(ctx, sk.far, A * 0.75, C.sh, 0.55);
    glow(ctx, sk.top, A * 0.9, C.lt, 0.95);
    // the underside, below the front rim
    ctx.save();
    outside(ctx, sk.rim);
    glow(ctx, sk.under, A * 1.05, C.sh, 0.7);
    ctx.restore();
    // guides: the front rim, the dome's middle line
    ctx.strokeStyle = tone(a, C.guide);
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(0.45, sc(0.5));
    if (sk.front.length > 2) {
      ctx.beginPath();
      sk.front.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
    ctx.globalAlpha *= 0.8;
    ctx.beginPath();
    sk.ridge.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.globalAlpha /= 0.8;
    ctx.restore();
    // the mouth: a soft little curve under the front, open as it froths (or the dress's own)
    if (DRESS.mouth) {
      DRESS.mouth(ctx, a, sk, KIT);
      ctx.restore();
      return;
    }
    const [mx, my] = sk.mouth;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(sk.roll);
    const op = sk.mouthOpen;
    if (op > 0.12) {
      ctx.beginPath();
      ctx.ellipse(0, sc(0.4), sc(1.5), sc(0.25 + 1.05 * op), 0, 0, TAU);
      ctx.fillStyle = tone(a, C.mouth);
      ctx.fill();
    } else {
      ctx.strokeStyle = tone(a, C.mouth);
      ctx.lineWidth = Math.max(0.4, sc(0.5));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-sc(1.5), 0);
      ctx.quadraticCurveTo(-sc(0.75), sc(0.75), 0, sc(0.1));
      ctx.quadraticCurveTo(sc(0.75), sc(0.75), sc(1.5), 0);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }
  // The eye stalks: plain stubs with round caps, standing on the front of the dome (no root shows:
  // the stalk's foot is one with the dome).
  const eyeShape = (e) => {
    const r = sc(EY.w) / 2;
    return [segment(e.root, e.tip, r * 1.08, r, r * 0.95), ellipsePts(e.tip, sc(EY.cap), sc(EY.cap), 0, 18)];
  };
  function drawEyes(ctx, a, mode) {
    const sk = a.bk;
    ctx.save();
    inShell(ctx, sk);
    const done = [];
    for (const e of sk.eyes) {
      const sh = eyeShape(e);
      pathOf(ctx, sh);
      if (mode === 'line') {
        outline(ctx);
        continue;
      }
      const foot = ellipsePts(e.root, sc(EY.w) * 0.9, sc(EY.w) * 0.9, 0, 16);
      // (folded down flat, a stalk lies in the dome: its seam fades so it's a soft bump, not a hook)
      ctx.globalAlpha *= 1 - 0.85 * ease(sk.eyeFold);
      seam(ctx, a, sh, [sk.hull, ...done, ...(sk.shell ? [sk.shell.out] : [])], [foot]);
      ctx.globalAlpha /= 1 - 0.85 * ease(sk.eyeFold);
      pathOf(ctx, sh);
      ctx.fillStyle = tone(a, C.base);
      ctx.fill('nonzero');
      ctx.save();
      pathOf(ctx, sh);
      ctx.clip('nonzero');
      glow(ctx, plus(e.tip, [-sc(0.6), -sc(0.7)]), sc(EY.cap) * 1.3, C.lt, 1);
      ctx.restore();
      done.push(...sh);
    }
    sk.eyeShapes = done;
    ctx.restore();
  }
  // A claw: the arm's two bones out from under the front, the hand (a round palm with the fixed
  // finger below, the hinged finger above, opening up) in its own frame.
  const handShapes = (cw) => {
    const { L, W } = cw.c;
    const to = (p) => plus(cw.W, turnBy(p, cw.ang));
    // (the palm, round and chunky, running on into the fixed finger along its lower side; the notch\n    // between the fingers comes well back into the palm, so the pincer reads even shut)
    const palm = sameWay(smoothLoop([[-0.04 * L, 0.02 * W], [0.02 * L, -0.36 * W], [0.2 * L, -0.5 * W], [0.4 * L, -0.46 * W], [0.5 * L, -0.26 * W], [0.55 * L, -0.03 * W], [0.74 * L, 0.02 * W], [0.92 * L, 0.04 * W], [1.0 * L, 0.12 * W], [0.95 * L, 0.24 * W], [0.78 * L, 0.32 * W], [0.56 * L, 0.44 * W], [0.3 * L, 0.52 * W], [0.08 * L, 0.42 * W]], 4).map(to));
    const hinge = [0.47 * L, -0.24 * W];
    const op = -cw.open * 0.78;
    const fing = sameWay(smoothLoop([[0.36 * L, -0.42 * W], [0.6 * L, -0.42 * W], [0.82 * L, -0.32 * W], [0.98 * L, -0.15 * W], [1.02 * L, -0.05 * W], [0.93 * L, -0.03 * W], [0.74 * L, -0.08 * W], [0.56 * L, -0.12 * W], [0.42 * L, -0.18 * W]], 4).map((p) => to(plus(hinge, turnBy(minus(p, hinge), op)))));
    return { palm, fing, to };
  };
  const armShapes = (cw) => {
    const [w0, w1, w2] = cw.c.w;
    return [segment(cw.S, cw.E, w0 / 2, w0 * 0.52, w1 / 2), segment(cw.E, cw.W, w1 / 2, w1 * 0.55, w2 / 2)];
  };
  function drawClaw(ctx, a, mode, k) {
    const sk = a.bk;
    const cw = sk.claws[k];
    const arm = armShapes(cw);
    const { palm, fing, to } = handShapes(cw);
    ctx.save();
    inShell(ctx, sk);
    if (mode === 'line') {
      pathOf(ctx, [...arm, palm, fing]);
      outline(ctx);
      ctx.restore();
      return;
    }
    const over = [sk.hull, ...(sk.trailShapes ?? []), ...sk.legsLead.flatMap(legShape), ...(sk.eyeShapes ?? []), ...(sk.clawShapes ?? []), ...(sk.shell ? [sk.shell.out] : [])];
    // (the upper arm grows out from under the front: no line round it there)
    const shoulder = segment(cw.S, cw.E, cw.c.w[0] / 2 + sc(1.2), cw.c.w[0] * 0.52 + sc(1.2), cw.c.w[1] / 2 + sc(0.4));
    seam(ctx, a, [...arm, palm], over, [shoulder]);
    rimShade(ctx, a, [...arm, palm], CC.base, CC.sh, sc(0.7));
    ctx.save();
    pathOf(ctx, [palm]);
    ctx.clip('nonzero');
    glow(ctx, to([0.3 * cw.c.L, -0.2 * cw.c.W]), cw.c.W * 0.62, CC.lt, 0.95);
    ctx.restore();
    // the hinged finger: one with the palm at its hinge, a seam where it closes on the fixed finger
    const gape = sameWay([to([0.56 * cw.c.L, -2 * cw.c.W]), to([3 * cw.c.L, -2 * cw.c.W]), to([3 * cw.c.L, 2 * cw.c.W]), to([0.56 * cw.c.L, 2 * cw.c.W])]);
    ctx.save();
    pathOf(ctx, [gape]);
    ctx.clip();
    seam(ctx, a, [fing], [palm, ...over]);
    ctx.restore();
    rimShade(ctx, a, [fing], CC.base, CC.sh, sc(0.55));
    ctx.restore();
    (sk.clawShapes ??= []).push(...arm, palm, fing);
  }
  // The hermit's shell: a plain spiral, the opening low at its front, dark inside, with a soft lip.
  function drawShell(ctx, a, mode) {
    const sk = a.bk;
    const sh = sk.shell;
    if (!sh) return;
    pathOf(ctx, [sh.out]);
    if (mode === 'line') return outline(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    pathOf(ctx, [sh.out]);
    ctx.clip();
    glow(ctx, sh.sw(plus(SH.c, [-sc(3), -sc(5)])), sc(10), C.lt, 0.95);
    glow(ctx, sh.sw(plus(SH.c, [sc(2), sc(8)])), sc(9), C.sh, 0.7);
    // the coil: one soft guide line spiralling out from the middle, two turns and a bit, to the top
    // of the opening; a faint light along its outer turn
    const turns = 2.25 * TAU;
    const coilAt = (k, grow = 0) => {
      const an = 20 * D2R - turns + k * turns;
      const r = SH.R * 0.86 * k ** 0.9 + grow;
      return sh.sw(plus(SH.coil, [Math.cos(an) * r, Math.sin(an) * r * 0.94]));
    };
    ctx.lineCap = 'round';
    ctx.strokeStyle = tone(a, C.lt);
    ctx.lineWidth = Math.max(0.6, sc(0.8));
    ctx.beginPath();
    for (let j = 30; j <= 90; j++) (j > 30 ? ctx.lineTo : ctx.moveTo).call(ctx, ...coilAt(j / 90, -sc(0.7)));
    ctx.stroke();
    ctx.strokeStyle = tone(a, C.sh);
    ctx.lineWidth = Math.max(0.5, sc(0.6));
    ctx.beginPath();
    for (let j = 2; j <= 90; j++) (j > 2 ? ctx.lineTo : ctx.moveTo).call(ctx, ...coilAt(j / 90));
    ctx.stroke();
    ctx.restore();
    // the opening
    pathOf(ctx, [sh.ap]);
    ctx.fillStyle = tone(a, C.deep);
    ctx.fill();
    ctx.save();
    pathOf(ctx, [sh.ap]);
    ctx.clip();
    glow(ctx, plus(sh.apC, turnBy([-sc(1.5), -sc(1.5)], sh.rot)), sc(5), C.nose, 0.6);
    ctx.restore();
    ctx.strokeStyle = tone(a, C.sh);
    ctx.lineWidth = Math.max(0.6, sc(0.8));
    pathOf(ctx, [sh.ap]);
    ctx.stroke();
  }
  // The hermit's soft abdomen, curled up into the shell: seen only in the opening.
  function drawBelly(ctx, a, mode) {
    const sk = a.bk;
    const sh = sk.shell;
    if (!sh || mode === 'line') return;
    const [p0, p1, p2] = sh.belly;
    const shape = [segment(p0, p1, sc(3.4), sc(3.3), sc(2.9)), segment(p1, p2, sc(2.9), sc(2.6), sc(2))];
    ctx.save();
    pathOf(ctx, [sh.ap]);
    ctx.clip();
    seam(ctx, a, shape, [sh.out]);
    rimShade(ctx, a, shape, C.base, C.sh, sc(0.6));
    // (a soft crease or two: the abdomen's rings)
    ctx.strokeStyle = tone(a, C.guide);
    ctx.lineWidth = Math.max(0.4, sc(0.45));
    for (const k of [0.35, 0.75]) {
      const c = mix2(p0, p1, k);
      const d = minus(p1, p0);
      const n = times([-d[1], d[0]], 1 / (Math.hypot(d[0], d[1]) || 1));
      ctx.beginPath();
      ctx.moveTo(...plus(c, times(n, sc(2.4))));
      ctx.quadraticCurveTo(...plus(c, times(d, 0.08)), ...plus(c, times(n, -sc(2.4))));
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- Effects: sparkles on a hit, clacks, bubbles, dust, speed lines ----------
  const sparkle = (ctx, x, y, r, an, fill) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? r * 0.3 : r;
      const q = an + (i * Math.PI) / 4;
      ctx.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const bubble = (ctx, x, y, r, al) => {
    ctx.globalAlpha = al;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = 'rgba(246,242,255,0.45)';
    ctx.fill();
    ctx.strokeStyle = '#b8acd6';
    ctx.lineWidth = Math.max(0.35, r * 0.16);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  };
  const puff = (ctx, x, y, r, al) => {
    ctx.globalAlpha = al;
    ctx.fillStyle = '#f3eefa';
    ctx.strokeStyle = '#d6cbe6';
    ctx.lineWidth = Math.max(0.4, r * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
  };
  // A bubble's life (0..1): rising and drifting ahead from the mouth, wobbling, a sparkle as it pops.
  const bubbleLife = (ctx, sk, k, seed, spread) => {
    const [mx, my] = sk.spots.mouth;
    const e = 1 - (1 - k) ** 2;
    const x = mx + sc(1) + e * sc(3 + seed * 5) * spread + Math.sin(k * 8 + seed * 7) * sc(1.1);
    const y = my - sc(1) - e * sc(9 + seed * 8);
    const r = sc(1 + seed * 1.3) * (0.55 + 0.45 * ease(k * 3));
    if (k < 0.88) bubble(ctx, x, y, r, 0.95);
    else {
      const p = (k - 0.88) / 0.12;
      ctx.globalAlpha = 1 - p;
      sparkle(ctx, x, y, r * (1 + p), p, '#ffffff');
    }
  };
  function drawFx(ctx, m, a) {
    const sk = a.bk;
    const mv = a.crMove?.mv;
    const t = a.crMove?.t ?? 0;
    ctx.save();
    if (mv) {
      // sparkles where a claw snaps shut (or in the froth)
      (mv.spark ?? []).forEach((s0, i) => {
        const k = after(s0, t, 0.24);
        if (k < 0) return;
        const where = Array.isArray(mv.sparkAt) ? mv.sparkAt[i] : mv.sparkAt;
        const [x, y] = where === 'froth' ? plus(sk.spots.mouth, [sc(9), -sc(4)]) : sk.spots[where] ?? sk.spots.lead;
        const e = 1 - (1 - k) ** 3;
        ctx.globalAlpha = 1 - k;
        sparkle(ctx, x, y, H * 0.16 * (0.5 + 0.7 * e), k * 0.8, '#ffffff');
        sparkle(ctx, x, y, H * 0.08 * (0.5 + 0.7 * e), k * 0.8 + 0.4, '#fff2a8');
        for (let j = 0; j < 4; j++) {
          const q = (j * TAU) / 4 + 0.6;
          sparkle(ctx, x + Math.cos(q) * H * 0.2 * e, y + Math.sin(q) * H * 0.2 * e, H * 0.04, q, j % 2 ? '#ffc8de' : '#fff6c8');
        }
      });
      // a clack: two small sparkles at the claw tips as they snap together
      for (const c0 of mv.clack ?? []) {
        const k = after(c0, t, 0.2);
        if (k < 0) continue;
        ctx.globalAlpha = 1 - k;
        for (const w of ['lead', 'trail']) {
          const [x, y] = sk.spots[w];
          sparkle(ctx, x, y - sc(1), H * 0.07 * (0.6 + k), k, '#ffffff');
        }
      }
      // froth: a stream of bubbles from the mouth
      if (mv.bubbles) {
        const [b0, b1] = mv.bubbles;
        for (let i = 0; ; i++) {
          const born = b0 + i * 0.055;
          if (born > b1) break;
          const k = (t - born) / 0.7;
          if (k < 0 || k > 1) continue;
          const seed = cycleOf(Math.sin(i * 12.9898) * 43758.5);
          bubbleLife(ctx, sk, k, seed, 1.4);
        }
      }
      // dust where it lands or pushes off
      for (const [d0, where] of mv.dust ?? []) {
        const k = after(d0, t, 0.4);
        if (k < 0) continue;
        const [gx] = sk.spots[where];
        const e = 1 - (1 - k) ** 2;
        for (let i = 0; i < 4; i++) {
          const dir = i < 2 ? -1 : 1;
          puff(ctx, gx + dir * sc(4 + (i % 2) * 4) * (0.5 + e), -sc(1 + (i % 2)) - e * sc(2.4), sc(1.4 + (i % 2) * 0.6) * (0.6 + 0.6 * e), (1 - k) * 0.85);
        }
      }
      // speed lines on a dash
      if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
        const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
        ctx.globalAlpha = 0.7 * (1 - k);
        ctx.strokeStyle = '#ffffff';
        ctx.lineCap = 'round';
        ctx.lineWidth = sc(0.9);
        for (let i = 0; i < 3; i++) {
          const y = sk.pivot[1] + sc((i - 1) * 3.5);
          ctx.beginPath();
          ctx.moveTo(sk.pivot[0] - A - sc(4) - sc(5) * k, y);
          ctx.lineTo(sk.pivot[0] - A - sc(13) - sc(9) * k, y);
          ctx.stroke();
        }
      }
    } else if (m.hp > 0 && a.crBubble != null) {
      // standing about now and then: a few bubbles; asleep: one slow bubble swelling and popping
      const [k0, sleepy] = a.crBubble;
      if (sleepy) {
        const k = k0;
        if (k < 0.9) {
          const [mx, my] = sk.spots.mouth;
          bubble(ctx, mx + sc(1.6) + ease(k) * sc(0.8), my - sc(0.6) - ease(k) * sc(1.6), sc(0.5) + ease(k / 0.9) * sc(2.4), 0.95);
        } else {
          const [mx, my] = sk.spots.mouth;
          ctx.globalAlpha = (1 - k) * 10;
          sparkle(ctx, mx + sc(2.4), my - sc(2.2), sc(2.6), k * 3, '#ffffff');
        }
      } else
        for (let i = 0; i < 3; i++) {
          const k = (k0 - i * 0.16) / 0.68;
          if (k >= 0 && k <= 1) bubbleLife(ctx, sk, k, [0.2, 0.7, 0.45][i], 0.6);
        }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    if (m.act && CRAB_MOVES[m.act.name]) {
      const mv = CRAB_MOVES[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + lastKey(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.crAtk) {
        const pool = m.def.moves ?? POOL;
        st.crN = (st.crN ?? m.uid) + 1;
        // (a dungeon's own move is an object, { kind: 'burrow', ... }: only a move's name forces one)
        st.crPick = typeof m.move === 'string' && CRAB_MOVES[m.move] ? m.move : DRESS.pick?.(m, a, pool, st.crN) ?? pool[st.crN % pool.length];
      }
      st.crAtk = true;
      const mv = CRAB_MOVES[st.crPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.crAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lastKey(CRAB_MOVES.hurt)) return [CRAB_MOVES.hurt, a.hurtAgo, 1];
    const happy = CRAB_MOVES[P.happy];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < happy.anticT + lastKey(happy)) return [happy, gl - happy.anticT, gl < happy.anticT ? gl / happy.anticT : 1];
    // (a happy beat in a cutscene: dancing on a loop)
    if (m.hp > 0 && m.cine?.mood === 'happy') {
      const len = happy.anticT + lastKey(happy) + 0.4;
      const T = (a.now % len) - happy.anticT;
      return [happy, T, T < 0 ? 1 + T / happy.anticT : 1];
    }
    return [null, 0, 0];
  }
  const seq = [
    ['shell', drawShell],
    ['belly', drawBelly],
    ['legsLead', drawLegsLead],
    ['body', drawBody],
    ['legsTrail', drawLegsTrail],
    ['eyes', drawEyes],
    ['clawLead', (ctx, a, mode) => drawClaw(ctx, a, mode, 'lead')],
    ['clawTrail', (ctx, a, mode) => drawClaw(ctx, a, mode, 'trail')],
  ];
  // (the dress's kit, and its hooks round each part)
  const KIT = { C, P, sc, tone, outline, glow, pathOf, H, moves: CRAB_MOVES };
  const hooked = ([name, draw]) => [
    name,
    (ctx, a, mode) => {
      if (DRESS.under?.[name]) {
        ctx.save();
        DRESS.under[name](ctx, a, mode, KIT);
        ctx.restore();
      }
      if (!DRESS.hide?.[name]) {
        // (the dress may cut a part to a region of its own: a crab sat inside something)
        if (DRESS.clip?.[name]) {
          ctx.save();
          DRESS.clip[name](ctx, a, KIT);
          draw(ctx, a, mode);
          ctx.restore();
        } else draw(ctx, a, mode);
      }
      if (DRESS.over?.[name]) {
        ctx.save();
        DRESS.over[name](ctx, a, mode, KIT);
        ctx.restore();
      }
    },
  ];
  seq.splice(0, seq.length, ...seq.map(hooked));
  const parts = [
    ...seq.map(([name, draw]) => ({ name, parent: null, at: () => [0, 0], pivot: [0, 0], s: NOTHING, paint: (ctx, a) => draw(ctx, a, 'line') })),
    ...seq.map(([name, draw]) => ({ name: `${name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: NOTHING, paint: (ctx, a) => draw(ctx, a, 'fill') })),
  ];
  const RW = Math.ceil(span * 1.5 + sc(24));
  const RH = Math.ceil(H * 2.2 + sc(10));
  const REST = { lA: CL.lead.ang, tA: CL.trail.ang };
  const rig = makeRig({
    w: RW,
    h: RH,
    soft: true,
    stride: cycle,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, ['lO', 'tO'].includes(c) ? [420, 30] : c === 'eyeF' ? [300, 26] : c === 'eyeL' || c === 'turn' ? [90, 15] : c === 'mouth' ? [300, 28] : c === 'lA' || c === 'tA' ? [200, 23] : [170, 21]])),
    walkStiff: { lift: [600, 48], tilt: [300, 32] },
    fast: CH.filter((c) => !['eyeL', 'turn'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.crActive),
    kick: { tilt: -70, eyeF: 9, lU: 4, tU: 4 },
    turnKick: { turn: 240, lift: -20 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.3;
      const rnd = (n) => {
        const q = Math.sin(n * 12.9898 + (m.uid % 97) * 78.233) * 43758.5453;
        return q - Math.floor(q);
      };
      // Standing about: breathing; each claw flexing and now and then clicking; each eye stalk turning
      // on its own (held, then turning), both dipping now and then; a leg tapping; a little side
      // shuffle; a few bubbles.
      const breath = Math.sin(t * 1.25);
      const clickL = hold(t % 5.3, 1.9, 1.98, 2.04, 2.16) + hold(t % 5.3, 2.32, 2.4, 2.46, 2.6);
      const clickT = hold(t % 6.9, 4.1, 4.2, 4.26, 4.42);
      const lookOf = (per, off) => {
        const q = t / per + off;
        const blk = Math.floor(q);
        return mix(rnd(blk - 1 + off * 31), rnd(blk + off * 31), ease((q - blk) / 0.16)) * 2 - 1;
      };
      a.crLook = [lookOf(3.7, 0), lookOf(4.9, 0.37)];
      const dip = hold(t % 8.1, 5, 5.12, 5.3, 5.5);
      const calm = (1 - a.walkW) * (a.calm ?? 1);
      a.crTap = (hold(t % 9.3, 3, 3.1, 3.16, 3.3) + hold(t % 9.3, 3.42, 3.52, 3.58, 3.72)) * calm;
      const shuffle = hold(t % 13, 6, 6.7, 9.4, 10.1) * (Math.floor(t / 13) % 2 ? 1 : -1);
      const idle = {
        x: shuffle * 0.08 * H, lift: breath * 0.18, hop: 0, crouch: 0.04, tilt: Math.sin(t * 0.55) * 0.8, flip: 0, turn: 0,
        lR: 0.06 * Math.sin(t * 0.8), lU: 0.08 * Math.sin(t * 0.9 + 1), lO: (0.36 + 0.07 * Math.sin(t * 0.7)) * (1 - clickL * 0.95), lA: REST.lA + 4 * Math.sin(t * 0.6),
        tR: 0.06 * Math.sin(t * 0.7 + 2), tU: 0.08 * Math.sin(t * 0.85 + 2.4), tO: (0.34 + 0.07 * Math.sin(t * 0.75 + 1)) * (1 - clickT * 0.95), tA: REST.tA + 4 * Math.sin(t * 0.5 + 1),
        eyeF: dip * 0.4, eyeL: 0, fold: 0, tuckL: 0, wave: 0, hide: 0, mouth: 0,
      };
      const walk = { ...idle, x: 0, lift: 0, crouch: 0.02, tilt: 0, lR: 0.05, tR: 0.05, lU: 0.18, tU: 0.18, lO: 0.3, tO: 0.3, lA: REST.lA - 6, tA: REST.tA - 6, eyeF: 0 };
      const [mv, mt, windW] = moveNow(m, a, st);
      const base = {};
      for (const c of CH) base[c] = mix(idle[c], walk[c], a.walkW);
      base.x /= H;
      base.hop /= H;
      const out = mv ? keyed(mv, mt, windW, base) : { ...base };
      // Poses, and asleep (a nap), beaten.
      const nap = m.habit?.kind === 'nap' && a.now < (m.habit.until ?? 0) && m.hp > 0;
      const slow = Math.sin(t * 0.8);
      const pose = nap ? 'sleep' : m.pose;
      if (pose === 'rest') Object.assign(out, { crouch: 1, fold: 1, lR: -0.1, tR: -0.1, lU: -0.3, tU: -0.3, lO: 0.08, tO: 0.08, lA: -34, tA: -42, lift: breath * 0.12 });
      else if (pose === 'tuck') Object.assign(out, { crouch: 0.6, fold: 0.5, lR: -0.3, tR: 0.3, lU: 0.5, tU: 0.5, lO: 0, tO: 0, lA: -100, tA: -78, eyeF: 1, hide: 1 });
      else if (pose === 'sleep') Object.assign(out, { crouch: 1, fold: 1, lR: -0.15, tR: -0.1, lU: -0.3, tU: -0.3, lO: 0.02, tO: 0.02, lA: -30, tA: -40, eyeF: 1, hide: 1, lift: slow * 0.25, tilt: slow * 0.6, mouth: 0 });
      DRESS.pose?.(m, a, out, KIT, mv, mt);
      if (m.hp <= 0) Object.assign(out, { crouch: 1, fold: 0.7, tilt: 5, lR: 0.1, tR: 0, lU: -0.35, tU: -0.35, lA: -10, tA: -30, lO: 0.5, tO: 0.45, eyeF: 1, mouth: 0.3, hide: 0.5, wave: 0, flip: 0, tuckL: 0 });
      else if (!mv && m.cine?.mood === 'sad') Object.assign(out, { crouch: 0.5, lU: -0.4, tU: -0.4, lO: 0.05, tO: 0.05, eyeF: 0.55 });
      else if (!mv && m.cine?.mood === 'angry') Object.assign(out, { lU: 0.6, tU: 0.6, lO: 0.9, tO: 0.9, lA: -40, tA: -40, crouch: 0.2 });
      // (bubbles now and then: a few standing about, one slow one asleep)
      a.crBubble = !mv && m.hp > 0 ? (pose === 'sleep' ? [(t % 4.2) / 4.2, true] : (t % 9.7) < 1.4 && a.walkW < 0.2 ? [(t % 9.7) / 1.4, false] : null) : null;
      DRESS.after?.(m, a, out, KIT, mv, mt);
      st.crActive = Boolean(mv);
      a.crMove = mv ? { mv, t: mt } : null;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = out.x * H;
      res.hop = out.hop * H;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.bk = skeleton(S, a, m);
    },
    parts,
    fx: (ctx, m, a) => {
      drawFx(ctx, m, a);
      DRESS.fx?.(ctx, m, a, KIT);
    },
  });
  // (a still for the Monster Book: the carapace and the claws at rest, plain)
  const still = () => ({ w: RW, h: RH, res: 3, shapes: [E(RW / 2, RH - GY, A, (hullTop + hullLow) / 2, C.base), E(RW / 2 + A * 0.9, RH - GY + sc(3), sc(CL.lead.hand[0]) * 0.5, sc(CL.lead.hand[1]) * 0.5, C.base), E(RW / 2 - A * 0.2, RH - GY + sc(4.5), sc(CL.trail.hand[0]) * 0.5, sc(CL.trail.hand[1]) * 0.5, C.base)] });
  return { rig, still, stride: cycle, speed: walkSpeed, H, w: Math.round(span * 0.85), h: Math.round(H * 1.1), moves: P.moves };
}

// One dressed crab: its art entry (for ARTS), its size and its walking pace.
export function dressedCrab(look) {
  const r = crabRig(look);
  return { art: { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig }, w: r.w, h: r.h, speed: r.speed, bodyH: r.H, moves: r.moves };
}
