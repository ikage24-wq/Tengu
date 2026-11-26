// The scorpion base (2026-11-25): a blank chibi scorpion made for a scorpion from the start, nothing
// carried over from another base; only the engine is shared (rig.js's springs and attack timing). A
// plain lilac mannequin for designing scorpion monsters on: no eyes, no markings, soft construction
// guides only. Drawn live like the other blank bases: smooth shapes over its bones, outlined only on
// the outer edge (an ink pass round everything, then a fill pass over it), in the bases' soft plum
// ink, never near-black.
//
// The body, side on and turned a little toward us (a three-quarter view toward the way it faces), and
// seen a little from above; worked out in 3D (x ahead, y up, z toward us) and projected, so the near
// legs and pincer stand in front and the far ones sit behind, a shade darker:
//   body     one low rounded loaf, the front (the head end) round and blunt, tapering a touch to the
//            back; lit on top, shaded underneath and on its far side; guides: a soft curved eye line
//            over the front, a faint centre line down the back that stops well short of it
//   legs     eight, four a side, each three chunky rounded segments (the upper leg arching up and
//            out from under the body, the shin coming down, the soft round tip); front legs reaching
//            ahead, back ones behind, so the silhouette fans out instead of bunching
//   gait     an alternating four-and-four (front and third of one side with second and fourth of
//            the other), its phase driven by the distance walked (and by its own lunges), so every
//            planted tip stays exactly where it was put down; the body bobs a little with each set
//            and rolls a touch side to side
//   pincers  two, each on a two-boned arm from under the front: a round palm, a fixed lower finger
//            and a hinged upper one that opens and closes, a V notch between them; held forward
//   tail     five round beads and a soft bulb with a small rounded point, a chain of springs, each
//            piece following the one before a beat late: arched up and over the back at rest,
//            swaying with the gait, coiling tighter when it threatens, laid along the ground to rest,
//            curled round the body asleep
// Presets: scorpion (the classic), desertling (slim, long-legged, a long slender tail, small
// pincers, quick), emperor (chunky, huge pincers, a short thick tail, a slow heavy walk).
// Moves (SCORPION_MOVES): sting (the tail cocks back, then arcs over and strikes past its head),
// snap (a lunge and a snap of the near pincer), grab (both pincers wide, a lunge, a clamp and a
// tug), dig (its signature: burrows into the sand, a mound runs ahead, it pops up pincers high and
// scuttles back), dash, jump, dodge, hurt, knockdown (rolled onto its back, legs pedalling and the tail
// curling, then rolling back over); a pincer-clacking cheer when pleased. Poses (m.pose): rest (body
// down, tail laid along the ground), guard (pincers up, tail high and coiled), sleep (body down, the
// tail curled round it).

import { makeRig, clamp, TAU } from './rig.js';
import { hold } from './kidrig.js';
import { E } from './kit.js';

const DEG = Math.PI / 180;
const C = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299' };
const INK = '#7f6982';
// (where one part lies across another: a soft lilac edge, never the ink)
const EDGE = '#a89cc4';

// ---------- Little maths ----------
const lerp = (p, q, k) => p + (q - p) * k;
const ease = (k) => {
  const v = clamp(k, 0, 1);
  return v * v * (3 - 2 * v);
};
const frac = (v) => v - Math.floor(v);
const v2add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const v2sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const v2mul = (p, k) => [p[0] * k, p[1] * k];
const v2mix = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];
const v2turn = (p, r) => [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)];
const add3 = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const sub3 = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const mul3 = (p, k) => [p[0] * k, p[1] * k, p[2] * k];
const mix3 = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k), lerp(p[2], q[2], k)];
const dot3 = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const len3 = (p) => Math.hypot(p[0], p[1], p[2]);
const unit3 = (p, fallback = [0, 1, 0]) => {
  const l = len3(p);
  return l > 1e-5 ? mul3(p, 1 / l) : fallback;
};
const wrapPi = (v) => Math.atan2(Math.sin(v), Math.cos(v));
// (leans into a limit softly rather than stopping dead at it)
const soften = (v, lim) => lim * Math.tanh(v / lim);
const hexRgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// A smooth curve through points (Catmull-Rom), `n` samples a span; closed or open (an open one keeps
// both ends, with mirrored phantom points beyond them).
function curve(pts, n, closed) {
  const N = pts.length;
  const out = [];
  const pick = (i) => {
    if (closed) return pts[((i % N) + N) % N];
    if (i < 0) return v2sub(v2mul(pts[0], 2), pts[1]);
    if (i > N - 1) return v2sub(v2mul(pts[N - 1], 2), pts[N - 2]);
    return pts[i];
  };
  const spans = closed ? N : N - 1;
  for (let i = 0; i < spans; i++) {
    const p0 = pick(i - 1);
    const p1 = pick(i);
    const p2 = pick(i + 1);
    const p3 = pick(i + 2);
    for (let j = 0; j < n; j++) {
      const s = j / n;
      const s2 = s * s;
      const s3 = s2 * s;
      out.push([
        0.5 * (2 * p1[0] + (p2[0] - p0[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * s3),
        0.5 * (2 * p1[1] + (p2[1] - p0[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * s3),
      ]);
    }
  }
  if (!closed) out.push(pts[N - 1]);
  return out;
}
// Every outline wound the same way, so any of them filled together (nonzero) make one union.
function wound(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    s += (q[0] - p[0]) * (q[1] + p[1]);
  }
  return s > 0 ? pts.slice().reverse() : pts;
}
// A soft tube along points (`rad` its half-width at each), round at both ends.
function tube(pts, rad, n = 4) {
  const line = curve(pts, n, false);
  const M = line.length;
  const spans = pts.length - 1;
  const rAt = (j) => {
    const f = (j / (M - 1)) * spans;
    const i = Math.min(spans - 1, Math.floor(f));
    return lerp(rad[i], rad[i + 1], f - i);
  };
  const left = [];
  const right = [];
  for (let j = 0; j < M; j++) {
    const a = line[Math.max(0, j - 1)];
    const b = line[Math.min(M - 1, j + 1)];
    const an = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const r = rAt(j);
    left.push([line[j][0] - Math.sin(an) * r, line[j][1] + Math.cos(an) * r]);
    right.push([line[j][0] + Math.sin(an) * r, line[j][1] - Math.cos(an) * r]);
  }
  const cap = (c, an, r, from) => {
    const out = [];
    for (let k = 1; k < 6; k++) {
      const q = from - (Math.PI * k) / 6;
      out.push([c[0] + Math.cos(q) * r, c[1] + Math.sin(q) * r]);
    }
    return out;
  };
  const e0 = line[M - 2];
  const e1 = line[M - 1];
  const aEnd = Math.atan2(e1[1] - e0[1], e1[0] - e0[0]);
  const s0 = line[0];
  const s1 = line[1];
  const aStart = Math.atan2(s1[1] - s0[1], s1[0] - s0[0]);
  return wound([...left, ...cap(e1, aEnd, rAt(M - 1), aEnd + Math.PI / 2), ...right.reverse(), ...cap(s0, aStart, rAt(0), aStart - Math.PI / 2)]);
}
// A round bead from p to q: a little fuller in the middle than at its ends.
const bead = (p, q, r0, rm, r1) => tube([p, v2mix(p, q, 0.5), q], [r0, rm, r1], 4);
const disc = (c, r, n = 20) => {
  const out = [];
  for (let i = 0; i < n; i++) out.push([c[0] + Math.cos((i / n) * TAU) * r, c[1] + Math.sin((i / n) * TAU) * r]);
  return wound(out);
};
// The convex outline round a cloud of points (a monotone chain).
function outlineOf(cloud) {
  const p = cloud.slice().sort((A, B) => A[0] - B[0] || A[1] - B[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const h = [];
    for (const q of list) {
      while (h.length > 1 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
      h.push(q);
    }
    h.pop();
    return h;
  };
  return wound([...half(p), ...half(p.slice().reverse())]);
}
const knee = (R, J, l1, l2, pole) => {
  // Two bones from R toward J, the joint toward `pole`; returns the joint and where the second
  // bone really ends (short of J when J is out of reach).
  const v = sub3(J, R);
  const D = len3(v) || 1e-3;
  const e = mul3(v, 1 / D);
  const d = clamp(D, Math.abs(l1 - l2) + 0.05, l1 + l2 - 0.02);
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const up = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const side = unit3(sub3(pole, mul3(e, dot3(pole, e))));
  return [add3(R, add3(mul3(e, along), mul3(side, up))), add3(R, mul3(e, d))];
};
const addPoly = (ctx, pts) => {
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
};
const trace = (ctx, list) => {
  ctx.beginPath();
  for (const pts of list) if (pts.length > 2) addPoly(ctx, pts);
};

// ---------- The scorpions (game px at scale 1; the model: x ahead, y up, z toward us) ----------
// body: half-length a, half-width zr, half-height yr, its middle hb above the ground standing, `end`
// how square its ends are, `taper` how much the back narrows, `nose` the front a touch higher.
// legs: roots along the body x, the tips' rest places [x, z out], each leg's length factor k, the
// three bones, widths [root, knee, ankle, tip], how far the tip segment slants out.
// gait: planted travel per step, the share of a cycle planted, the lift, steps a second, the
// body's bob (px) and roll (degrees).
// claw: the shoulder [x, y from hb, z], the wrist at rest, the arm's two bones and widths [shoulder,
// elbow, wrist], the hand [length, width], its angle at rest (degrees on screen, - up), how far a
// reach and a raise carry the wrist.
// tail: its root [x, y from hb], the five beads' lengths and widths, the bulb's radius and point,
// its rest pose (the root's angle and the bend at each joint, degrees in the model, + up and back).
const SCORPION = {
  name: 'Scorpion',
  pitch: 21,
  yaw: 14,
  body: { a: 9, zr: 6.2, yr: 3.5, hb: 5.6, end: 2.3, taper: 0.42, nose: 0.4 },
  legs: { x: [4.4, 1.5, -1.3, -3.9], foot: [[12.8, 5.8], [7.2, 6.8], [-5.4, 6.8], [-12, 6]], k: [0.92, 0.97, 1.02, 1.08], bones: [3.8, 5, 2.6], w: [3, 2.7, 2.3, 1.5], slant: 0.32 },
  gait: { step: 5, duty: 0.6, lift: 3.2, rate: 2.4, bob: 0.45, roll: 3, rock: 1.4 },
  claw: { root: [6.6, -1.3, 3], wrist: [13, 1.2, 5.6], arm: [4.4, 4.2], w: [3.1, 2.8, 3], hand: [9.2, 6.3], ang: -12, reach: 5, up: 5.5 },
  tail: { root: [-7.3, 1.7], len: [4.5, 4.5, 4.5, 4.5, 4.4], w: [5.2, 4.8, 4.4, 4, 3.6], bulb: 3, point: 2.4, a0: 100, bend: [-24, -28, -30, -30, -34] },
  moves: ['sting', 'snap', 'grab'],
};
const DESERTLING = {
  name: 'Desertling',
  pitch: 21,
  yaw: 14,
  body: { a: 8, zr: 4.9, yr: 2.9, hb: 6.8, end: 2.2, taper: 0.48, nose: 0.5 },
  legs: { x: [3.8, 1.3, -1.1, -3.4], foot: [[13.8, 6], [7.8, 7.2], [-6, 7.2], [-13.6, 6.4]], k: [0.92, 0.97, 1.03, 1.1], bones: [4.4, 6.3, 3], w: [2.5, 2.3, 2, 1.3], slant: 0.36, kneeOut: 1.5, farUp: 0.45 },
  gait: { step: 6.2, duty: 0.55, lift: 3.4, rate: 3, bob: 0.35, roll: 2.2, rock: 1.2 },
  claw: { root: [5.8, -1, 2.5], wrist: [11.6, 1.6, 4.6], arm: [3.9, 3.7], w: [2.4, 2.2, 2.3], hand: [5.8, 3.8], ang: -10, reach: 4.4, up: 5 },
  tail: { root: [-6.6, 1.4], len: [5.2, 5.2, 5.2, 5.2, 5], w: [3.9, 3.6, 3.3, 3, 2.7], bulb: 2.4, point: 2.2, a0: 112, bend: [-24, -28, -30, -32, -34] },
  moves: ['sting', 'snap', 'dig'],
};
const EMPEROR = {
  name: 'Emperor',
  pitch: 21,
  yaw: 14,
  body: { a: 10.4, zr: 7.4, yr: 4.3, hb: 6, end: 2.4, taper: 0.36, nose: 0.3 },
  legs: { x: [5, 1.8, -1.5, -4.6], foot: [[14.2, 7], [8, 8.2], [-6, 8.2], [-13.4, 7.4]], k: [0.92, 0.97, 1.02, 1.07], bones: [4, 5.1, 2.6], w: [3.5, 3.1, 2.7, 1.7], slant: 0.3 },
  gait: { step: 4.8, duty: 0.66, lift: 2.7, rate: 1.8, bob: 0.55, roll: 3.6, rock: 1.6 },
  claw: { root: [7.8, -1.6, 3.6], wrist: [15, 1.4, 6.6], arm: [4.9, 4.7], w: [3.8, 3.4, 3.8], hand: [11.6, 7.8], ang: -14, reach: 5, up: 5.5 },
  tail: { root: [-8.6, 2], len: [3.8, 3.8, 3.8, 3.7, 3.6], w: [6, 5.6, 5.2, 4.8, 4.3], bulb: 3.5, point: 2.6, a0: 98, bend: [-24, -27, -28, -28, -28] },
  moves: ['grab', 'snap', 'sting'],
};
export const SCORPION_PRESETS = { scorpion: SCORPION, desertling: DESERTLING, emperor: EMPEROR };
export const SCORPION_KINDS = ['scorpion', 'desertling', 'emperor'];

// The tail's shapes for its moves (each piece's direction in the model, degrees: 0 ahead, 90 up):
// struck forward past the head; laid back along the ground; curled round the body's near side.
const STRUCK = [52, 22, -4, -28, -50, -74];
const LAID = [214, 196, 182, 178, 176, 172];
const CURLED = [200, 250, 298, 342, 372, 398];

// ---------- The moves (x and hop in half body lengths; angles in degrees) ----------
// nR/fR: the near/far pincer's reach (0 rest, 1 out, - drawn back); nU/fU: raised (+) or lowered;
// nO/fO: open (0 shut, 1 wide); nA/fA: the hand's angle on screen (0 ahead, - up); crouch: the body
// down (1 on the ground); tilt: nose up (+) or down; flip: rolled onto its back; yaw: turned toward
// us; tUp: the tail's root raised (+) or drawn back; tCurl: the tail coiled tighter (+) or opened;
// tStrike: the tail struck forward; tLay: laid along the ground; tWrap: curled round the body; fold:
// legs folded in at rest; tuck: legs drawn up in the air; wave: legs pedalling in the air; dig: sunk
// into the ground; scrab: legs scrabbling on the spot.
export const SCORPION_MOVES = {
  sting: {
    prep: 0.32,
    keys: [
      [0, { x: -0.22, crouch: 0.4, tilt: 9, tUp: 20, tCurl: 0.25, nR: -0.2, fR: -0.2, nU: 0.4, fU: 0.4, nO: 0.7, fO: 0.7, nA: -36, fA: -40 }],
      [0.08, { x: 0.5, crouch: 0.12, tilt: -10, tStrike: 1, tUp: 0, tCurl: 0, nR: -0.7, fR: -0.6, nU: 0.9, fU: 0.95, nO: 0.95, fO: 0.95, nA: -72, fA: -76 }, 'out'],
      [0.26, { x: 0.5, crouch: 0.12, tilt: -8, tStrike: 0.97, nR: -0.65, fR: -0.55, nU: 0.85, fU: 0.9, nO: 0.8, fO: 0.8, nA: -66, fA: -70 }],
      [0.56, { x: 0.1, tilt: -1, tStrike: 0.15, nU: 0.2, fU: 0.2, nO: 0.4, fO: 0.4 }, 'io'],
      [0.88, {}, 'io'],
    ],
    spark: [[0.12, 'sting']],
  },
  snap: {
    prep: 0.26,
    keys: [
      [0, { x: -0.1, crouch: 0.26, tilt: 3, nR: -0.45, nU: 0.6, nO: 1.05, nA: -44, fU: 0.25, fO: 0.5, tUp: 6, tCurl: 0.2 }],
      [0.07, { x: 0.24, crouch: 0.05, tilt: -5, nR: 1.25, nU: 0.05, nO: 0.95, nA: -2, tUp: -6, tCurl: -0.05 }, 'out'],
      [0.11, { x: 0.25, tilt: -6, nR: 1.3, nU: 0.05, nO: 0, nA: 4 }, 'out'],
      [0.26, { x: 0.18, tilt: -2, nR: 1.05, nO: 0.06, nU: 0.1 }],
      [0.52, { x: 0.04, nR: 0.3, nO: 0.32 }, 'io'],
      [0.8, {}, 'io'],
    ],
    spark: [[0.11, 'near']],
  },
  grab: {
    prep: 0.32,
    keys: [
      [0, { x: -0.12, crouch: 0.3, tilt: 6, nR: -0.15, fR: -0.15, nU: 1, fU: 1, nO: 1.08, fO: 1.08, nA: -64, fA: -68, tCurl: 0.3, tUp: 8 }],
      [0.08, { x: 0.32, crouch: 0.05, tilt: -6, nR: 1.15, fR: 1.1, nU: 0.1, fU: 0.15, nO: 1, fO: 1, nA: -4, fA: -8 }, 'out'],
      [0.13, { x: 0.34, tilt: -7, nR: 1.2, fR: 1.15, nU: 0.05, fU: 0.1, nO: 0, fO: 0, nA: 2, fA: -2 }, 'out'],
      [0.36, { x: 0.12, tilt: 3, crouch: 0.15, nR: 0.45, fR: 0.4, nU: 0.35, fU: 0.4, nO: 0, fO: 0, nA: -14, fA: -18, tCurl: 0.2 }, 'io'],
      [0.47, { x: 0.16, tilt: -1, nR: 0.55, fR: 0.5, nU: 0.28, fU: 0.32, nO: 0, fO: 0, nA: -8, fA: -12 }, 'io'],
      [0.64, { x: 0.04, nR: 0.2, fR: 0.2, nO: 0.75, fO: 0.75, nU: 0.2, fU: 0.2 }, 'io'],
      [0.95, {}, 'io'],
    ],
    spark: [[0.13, 'near'], [0.13, 'far']],
  },
  // Burrows in nose first, a mound runs ahead under the sand, it pops up pincers high, then
  // scuttles back to where it was.
  dig: {
    prep: 0.22,
    keys: [
      [0, { crouch: 0.3, tilt: -10, nU: -0.5, fU: -0.5, nR: 0.3, fR: 0.3, nO: 0.6, fO: 0.6, nA: 40, fA: 40, tUp: -6, scrab: 1 }],
      [0.14, { crouch: 0.5, tilt: -15, dig: 0.3, nU: -0.6, fU: -0.6, nA: 52, fA: 52, scrab: 1 }, 'in'],
      [0.44, { crouch: 0.5, tilt: -6, dig: 1, tUp: -30, tLay: 0.6, scrab: 1 }, 'io'],
      [0.5, { crouch: 0.5, dig: 1, tLay: 0.6 }],
      [0.86, { x: 1.9, crouch: 0.5, dig: 1, tLay: 0.6 }, 'io'],
      [1, { x: 1.9, dig: 0, hop: 0.9, tilt: 12, nU: 1.05, fU: 1.05, nO: 1, fO: 1, nA: -72, fA: -72, tUp: 10, tCurl: 0.3, tuck: 0.6 }, 'out'],
      [1.18, { x: 1.9, hop: 0, crouch: 0.45, tilt: -2, nU: 0.4, fU: 0.4, nO: 0.4, fO: 0.4, tuck: 0 }, 'in'],
      [1.3, { x: 1.9, crouch: 0.1 }, 'io'],
      [1.74, {}, 'io'],
    ],
    dust: [[0.04, 'front'], [0.3, 'body'], [1, 'body'], [1.18, 'feet']],
    mound: [0.42, 1.02],
    spray: [1],
  },
  dash: {
    prep: 0.1,
    keys: [
      [0, { crouch: 0.3, x: -0.06, tilt: 3 }],
      [0.24, { x: 1.6, crouch: 0.1, tilt: -4, nU: 0.2, fU: 0.2, tUp: -14, tCurl: -0.12 }, 'out'],
      [0.4, { x: 1.7, tilt: 2, tUp: 4 }, 'io'],
      [0.95, {}, 'io'],
    ],
    lines: [0, 0.32],
    dust: [[0.02, 'feet']],
  },
  jump: {
    prep: 0.18,
    keys: [
      [0, { crouch: 0.8, tilt: 4, tCurl: 0.3 }],
      [0.16, { hop: 1.15, crouch: 0, tuck: 0.8, tilt: -4, nU: 0.6, fU: 0.6, nO: 0.6, fO: 0.6, nA: -30, fA: -30, tUp: -12, tCurl: -0.15 }, 'out'],
      [0.32, { hop: 1.25, tuck: 0.85, tilt: 2, nU: 0.7, fU: 0.7, tUp: 6, tCurl: 0.2 }, 'out'],
      [0.5, { hop: 0, tuck: 0.1, tilt: -3 }, 'in'],
      [0.56, { crouch: 0.6, tCurl: 0.35 }, 'out'],
      [0.9, {}, 'io'],
    ],
    dust: [[0, 'feet'], [0.52, 'feet']],
  },
  dodge: {
    prep: 0.06,
    keys: [
      [0, { crouch: 0.35 }],
      [0.12, { hop: 0.4, x: -0.9, tilt: 10, tuck: 0.5, nU: 0.5, fU: 0.5, nO: 0.5, fO: 0.5, tUp: 12, tCurl: 0.3 }, 'out'],
      [0.3, { x: -0.95, crouch: 0.4, tilt: -2 }, 'in'],
      [0.8, {}, 'io'],
    ],
    dust: [[0.3, 'feet']],
  },
  hurt: {
    prep: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.14, tilt: 8, crouch: 0.3, nU: 0.6, fU: 0.6, nO: 0.9, fO: 0.9, nR: -0.25, fR: -0.25, tCurl: 0.2, tUp: 12 }, 'out'],
      [0.22, { x: -0.14, tilt: 4, crouch: 0.25, nU: 0.4, fU: 0.4, nO: 0.5, fO: 0.5, tCurl: 0.12 }],
      [0.6, {}, 'io'],
    ],
  },
  knockdown: {
    prep: 0,
    keys: [
      [0, {}],
      [0.12, { x: -0.2, tilt: 12, crouch: 0.2, nU: 0.8, fU: 0.8, nO: 1, fO: 1, tCurl: 0.4 }, 'out'],
      [0.36, { flip: 0.55, x: -0.4, hop: 0.7, tuck: 0.8, nU: 0.4, fU: 0.4, nO: 0.8, fO: 0.8 }, 'io'],
      [0.54, { flip: 1, x: -0.45, hop: 0, wave: 1, tuck: 0, tCurl: 0.5, nO: 0.7, fO: 0.7 }, 'in'],
      [0.62, { flip: 0.96, x: -0.45, wave: 1, tCurl: 0.65 }, 'out'],
      [1.3, { flip: 1, x: -0.45, wave: 1, tCurl: 0.65 }],
      [1.55, { flip: 0.45, x: -0.32, hop: 0.6, wave: 0.2, tuck: 0.7 }, 'io'],
      [1.74, { flip: 0, x: -0.2, hop: 0, crouch: 0.55, tuck: 0 }, 'in'],
      [2.05, {}, 'io'],
    ],
    dust: [[0.54, 'body'], [1.74, 'feet']],
  },
  // Pleased: both pincers up high, clacking in turn, the body bobbing and the tail wagging.
  cheer: {
    prep: 0.16,
    keys: [
      [0, { nU: 1.1, fU: 1.1, nA: -80, fA: -72, nO: 1, fO: 1, crouch: 0.15, tUp: 4, nR: 0.1, fR: 0.15 }],
      [0.2, { nU: 1.25, fU: 1.05, nA: -86, fA: -70, nO: 0, fO: 0.9, lift: 1, tUp: 14, tilt: 4, nR: 0.1, fR: 0.15 }, 'io'],
      [0.4, { nU: 1.1, fU: 1.1, nA: -80, fA: -72, nO: 1, fO: 1, crouch: 0.15, tUp: -2, nR: 0.1, fR: 0.15 }, 'io'],
      [0.6, { nU: 1.05, fU: 1.25, nA: -76, fA: -80, nO: 0.9, fO: 0, lift: 1, tUp: 14, tilt: -3, nR: 0.1, fR: 0.15 }, 'io'],
      [0.8, { nU: 1.1, fU: 1.1, nA: -80, fA: -72, nO: 1, fO: 1, crouch: 0.15, tUp: -2, nR: 0.1, fR: 0.15 }, 'io'],
      [1, { nU: 1.25, fU: 1.05, nA: -86, fA: -70, nO: 0, fO: 0, lift: 1, tUp: 14, tilt: 4, nR: 0.1, fR: 0.15 }, 'io'],
      [1.25, { nU: 0.6, fU: 0.6, nA: -40, fA: -40, nO: 0.5, fO: 0.5 }, 'io'],
      [1.6, {}, 'io'],
    ],
    clack: [[0.2, 'near'], [0.6, 'far'], [1, 'near'], [1, 'far']],
  },
};
export const SCORPION_SHOW = ['sting', 'snap', 'grab', 'dig', 'dash', 'jump', 'dodge', 'hurt', 'knockdown', 'cheer'];
const lastOf = (mv) => mv.keys[mv.keys.length - 1][0];
const CURVES = { out: (k) => 1 - (1 - k) ** 3, in: (k) => k * k * k, io: ease };
// A move's pose at t (before 0: the wind-up, easing from `base` into the first key by `prepW`).
function poseAt(mv, t, prepW, base) {
  const ks = mv.keys;
  const at = (i) => Object.assign({}, base, ks[i][1]);
  if (t < 0) {
    const first = at(0);
    const k = ease(prepW);
    const out = {};
    for (const c in base) out[c] = lerp(base[c], first[c], k);
    return out;
  }
  let i = 0;
  while (i < ks.length - 1 && t >= ks[i + 1][0]) i++;
  if (i >= ks.length - 1) return at(ks.length - 1);
  const p = at(i);
  const q = at(i + 1);
  const k = (CURVES[ks[i + 1][2]] ?? ease)(clamp((t - ks[i][0]) / Math.max(1e-6, ks[i + 1][0] - ks[i][0]), 0, 1));
  const out = {};
  for (const c in p) out[c] = lerp(p[c], q[c], k);
  return out;
}
// (0..1 through a short window after a moment, else -1)
const windowOf = (from, t, len) => (t >= from && t <= from + len ? (t - from) / len : -1);

const CH = ['x', 'lift', 'hop', 'crouch', 'tilt', 'flip', 'yaw', 'nR', 'nU', 'nO', 'nA', 'fR', 'fU', 'fO', 'fA', 'tUp', 'tCurl', 'tStrike', 'tLay', 'tWrap', 'fold', 'tuck', 'wave', 'dig', 'scrab'];

// ---------- One rig for a preset ----------
function scorpionRig(kind) {
  const P = SCORPION_PRESETS[kind];
  const B = P.body;
  const A = B.a;
  const HB = B.hb;
  const CP = Math.cos(P.pitch * DEG);
  const SP = Math.sin(P.pitch * DEG);
  // (the world, x along its path, y up, z toward us, onto the screen, y down)
  const scr = (p) => [p[0], -p[1] * CP + p[2] * SP];

  // The body's shape: at each place along it (u from -1 at the back to 1 at the front), its half
  // width, half height and middle.
  const env = (u) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), B.end)), 1 / B.end);
  const zrAt = (u) => B.zr * env(u) * (u < 0 ? 1 - B.taper * u * u : 1);
  const yrAt = (u) => B.yr * env(u) * (u < 0 ? 1 - 0.5 * B.taper * u * u : 1 + 0.05 * u);
  const midAt = (u) => HB + B.nose * u;
  // (its surface, round about its middle, as rings of points)
  const SKIN = [];
  for (let i = 0; i <= 16; i++) {
    const u = -Math.cos((i / 16) * Math.PI);
    const x = u * A;
    const zr = zrAt(u);
    const yr = yrAt(u);
    const n = zr < 0.05 ? 1 : 18;
    for (let j = 0; j < n; j++) {
      const q = (j / n) * TAU;
      SKIN.push([x, midAt(u) - HB + Math.sin(q) * yr, Math.cos(q) * zr]);
    }
  }
  // (a point on the body's skin, round from its top: `around` 0 on top, + toward us)
  const skinAt = (u, around, k = 1) => [u * A, midAt(u) - HB + Math.cos(around) * yrAt(u) * k, Math.sin(around) * zrAt(u) * k];
  const SPINE = [];
  for (let i = 0; i <= 12; i++) SPINE.push(skinAt(lerp(-0.72, 0.22, i / 12), 0, 1.0));
  const BROW = [];
  for (let i = 0; i <= 14; i++) BROW.push(skinAt(0.7, lerp(-80, 84, i / 14) * DEG, 1.0));

  // The legs: each one's root under the body, its tip at rest, its phase in the step (front and
  // third of one side with second and fourth of the other).
  const LG = P.legs;
  const LEGS = [];
  for (const s of [1, -1]) {
    LG.x.forEach((x, i) => {
      const u = x / A;
      const root = [x, midAt(u) - yrAt(u) * 0.7, s * zrAt(u) * 0.7];
      const [fx, fz] = LG.foot[i];
      const k = LG.k[i];
      LEGS.push({
        s, i, k, root,
        foot: [fx, 0, s * fz],
        // (resting, the body down: legs splayed out low and flat round it)
        tucked: [x + (fx - x) * 1.12, 0, s * fz * 1.12],
        l1: LG.bones[0] * k, l2: LG.bones[1] * k, l3: LG.bones[2] * lerp(1, k, 0.5),
        w: LG.w.map((v) => v * lerp(1, k, 0.4)),
        ph: ((i + (s > 0 ? 0 : 1)) % 2) * 0.5 + i * 0.04,
      });
    });
  }
  const G = P.gait;
  // (how far out to the side, rather than up, a knee bends: kept low so no knee pokes over the back)
  const KNEE_OUT = LG.kneeOut ?? 0.9;
  const CYCLE = G.step / G.duty;
  const SPEED = CYCLE * G.rate;
  // A tip's place through its step at phase q: planted (moving back under the body exactly as fast
  // as the body goes on), then lifted in an eased arc and set down ahead.
  const stepAt = (u, ph) => {
    const q = frac(u + ph);
    if (q < G.duty) return { dx: G.step / 2 - (G.step * q) / G.duty, lift: 0, v: -1 };
    const v = (q - G.duty) / (1 - G.duty);
    return { dx: -G.step / 2 + G.step * ease(v), lift: G.lift * Math.pow(Math.sin(Math.PI * v), 0.8), v };
  };

  const CL = P.claw;
  const HAND_L = CL.hand[0];
  const HAND_W = CL.hand[1];
  const TL = P.tail;
  const PIECES = TL.len.length + 1;
  const tailRoot = [TL.root[0], TL.root[1], 0];

  // Sizes, from the rest pose: the top of the arched tail.
  let top = HB + B.yr;
  {
    let p = [TL.root[0], HB + TL.root[1]];
    let an = TL.a0;
    for (let i = 0; i < TL.len.length; i++) {
      if (i) an += TL.bend[i - 1];
      p = v2add(p, v2mul([Math.cos(an * DEG), Math.sin(an * DEG)], TL.len[i]));
      top = Math.max(top, p[1] + TL.w[i] / 2);
    }
  }
  const H = top * CP + 1;
  const DEPTH = H + 3;

  // ---------- The skeleton, posed ----------
  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const dt = clamp(a.dt ?? 0, 0, 0.05);
    const t = a.t + (m.uid % 5) * 1.7;
    // The step's phase: from the distance walked and its own lunges (so planted tips never slide),
    // and on the spot while it scrabbles at the sand.
    const odo = m.odo ?? 0;
    const dO = odo - (st.scOdo ?? odo);
    st.scOdo = odo;
    const dX = S.x - (st.scX ?? S.x);
    st.scX = S.x;
    const went = (Math.abs(dO) < 40 ? dO : 0) + dX;
    const scrab = clamp(S.scrab, 0, 1);
    st.scU = frac((st.scU ?? 0) + went / CYCLE + dt * scrab * 4.5);
    const u = st.scU;
    const pace = dt > 0 ? Math.abs(went) / dt : 0;
    st.scPace = lerp(st.scPace ?? 0, pace, Math.min(1, dt * 10));
    st.scW = lerp(st.scW ?? 0, Math.max(clamp(st.scPace / (SPEED * 0.3), 0, 1), scrab), Math.min(1, dt * 9));
    const w = st.scW;

    // The body: lowered (crouched, resting, sunk in the sand), a little bob as each set of legs takes
    // the weight, a touch of roll; tilted, turned toward us, rolled over onto its back.
    const flip = clamp(S.flip, -0.1, 1.1);
    const dig = clamp(S.dig, 0, 1);
    const bob = w * G.bob * Math.cos(2 * TAU * (u - G.duty * 0.25));
    // The soft settle: the body rides on a damped spring (its height and its nose's pitch), pushed by
    // each set of feet coming down, by landings, by hits and by sudden starts and stops; it overshoots
    // once or twice and settles. Nothing scales: the body only moves and turns.
    const body0 = lerp(HB, B.yr * 0.98, clamp(S.crouch, -0.3, 1.1)) + S.lift + S.hop;
    const bs = (st.scBody ??= { y: 0, vy: 0, p: 0, vp: 0, g0: body0, gv: 0, x0: 0, xv: 0 });
    let kickY = 0;
    let kickP = 0;
    if (dt > 0) {
      const gv = (body0 - bs.g0) / dt;
      const gA = clamp((gv - bs.gv) / dt, -900, 900);
      const xv = went / dt;
      const xA = clamp((xv - bs.xv) / dt, -900, 900);
      bs.g0 = body0;
      bs.gv = gv;
      bs.xv = xv;
      kickY -= gA * 0.0045;
      kickP += xA * 0.006;
    }
    // (feet coming down: each set of legs landing gives the body a little dip, nose first for the front ones)
    const qs = (st.scQ ??= LEGS.map(() => 0));
    LEGS.forEach((L, i) => {
      const q = frac(u + L.ph);
      if (q < qs[i] - 0.5 && w > 0.25) {
        kickY -= 1.6 * w;
        kickP -= (L.i === 0 ? 3 : L.i === 3 ? -2 : 0) * w;
      }
      qs[i] = q;
    });
    if (a.mo.hitT !== st.scHitT) {
      if (st.scHitT !== undefined && m.hp > 0) {
        kickY -= 9;
        kickP += 26;
        st.scTailKick = 1;
      }
      st.scHitT = a.mo.hitT;
    }
    bs.vy += kickY;
    bs.vp += kickP;
    {
      const n = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / n;
      for (let j = 0; j < n; j++) {
        bs.vy += (-260 * bs.y - 2 * 0.3 * Math.sqrt(260) * bs.vy) * h;
        bs.vp += (-220 * bs.p - 2 * 0.3 * Math.sqrt(220) * bs.vp) * h;
        bs.y = soften(bs.y + bs.vy * h, 1.8);
        bs.p = soften(bs.p + bs.vp * h, 7);
      }
      if (!Number.isFinite(bs.y + bs.p)) Object.assign(bs, { y: 0, vy: 0, p: 0, vp: 0 });
    }
    const settle = 1 - clamp(Math.abs(flip) * 2, 0, 1);
    const roll = w * G.roll * Math.sin(TAU * (u - G.duty * 0.25)) * DEG + flip * Math.PI;
    // (and rocks a touch nose up and down with each set of legs)
    const tilt = (S.tilt + bs.p * settle + w * (G.rock ?? 0) * Math.sin(2 * TAU * (u - G.duty * 0.25) + 0.8)) * DEG;
    const yaw = (P.yaw + S.yaw) * DEG;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    const ct = Math.cos(tilt);
    const stt = Math.sin(tilt);
    const turn = (p) => {
      const x = p[0] * ct - p[1] * stt;
      const y = p[0] * stt + p[1] * ct;
      const y2 = y * cr - p[2] * sr;
      const z2 = y * sr + p[2] * cr;
      return [x * cy - z2 * sy, y2, x * sy + z2 * cy];
    };
    const skinW = SKIN.map(turn);
    let gy = body0 + bob + bs.y * settle;
    let low = Infinity;
    for (const p of skinW) low = Math.min(low, p[1]);
    gy = Math.max(gy, 0.15 - low);
    gy -= ease(dig) * DEPTH;
    const pivot = [S.x, gy, 0];
    // (a point of the model, its body's middle at [0, HB, 0], into the world)
    const T = (p) => add3(pivot, turn([p[0], p[1] - HB, p[2]]));
    const Tdir = (d) => turn(d);
    // (which side faces us: the near legs and pincer are drawn in front of the body)
    const nearSide = turn([0, 0, 1])[2] >= 0 ? 1 : -1;
    const hull = outlineOf(skinW.map((p) => scr(add3(pivot, p))));

    // The legs.
    const fold = clamp(S.fold, 0, 1);
    const tuck = clamp(S.tuck, 0, 1);
    const wave = ease(clamp(S.wave, 0, 1));
    const air = Math.max(tuck, wave);
    const worldUp = [0, 1, 0];
    const bodyUp = Tdir([0, 1, 0]);
    const pole = unit3(mix3(worldUp, bodyUp, air));
    const tap = a.scTap ?? 0;
    const tapF = a.scTapF ?? 0;
    const shift = a.scShift ?? 0;
    const legs = [];
    for (const L of LEGS) {
      const g = stepAt(u, L.ph);
      // planted (or stepping) on the ground, where the turned body puts it at rest
      const restM = mix3(L.foot, L.tucked, fold * (1 - w));
      const rw = [restM[0] * cy - restM[2] * sy, 0, restM[0] * sy + restM[2] * cy];
      // (off the ground with the body as it hops)
      const adj = L.s < 0 && L.i === 0 ? tapF : L.s > 0 && L.i === 3 ? shift : 0;
      let F = [S.x + rw[0] + g.dx * w + Math.sin(Math.PI * adj) * 0.9 * (L.i === 3 ? -1 : 1), g.lift * w + (L.s > 0 && L.i === 1 ? tap * 1.7 : 0) + adj * 1.4 + Math.max(0, S.hop), rw[2]];
      if (air > 0) {
        // drawn up under the body (a jump, a roll), or pedalling in the air on its back
        const reachX = (L.foot[0] - L.root[0]) * 0.45;
        const tuckM = add3(L.root, [reachX, -1.4, L.s * 2.8]);
        const q = t * 10 + L.i * 1.8 + (L.s > 0 ? 0 : 1.3);
        const waveM = add3(L.root, [reachX * 1.1 + Math.sin(q) * 1.3, -4.4 - Math.cos(q) * 1.1, L.s * 3.4]);
        F = mix3(F, T(mix3(tuckM, waveM, wave)), air);
      }
      if (dig < 0.02) F[1] = Math.max(F[1], L.w[3] * 0.5 * (1 - air));
      const R = T(L.root);
      const d = sub3(F, R);
      const flat = sub3(d, mul3(pole, dot3(d, pole)));
      const out = unit3(flat, Tdir([0, 0, L.s]));
      // (the tip segment on its own damped spring: it curls in as the leg lifts, lags a little, flicks
      // out and settles as the tip comes down and the joints take the weight)
      const lift3 = (g.v >= 0 ? 0.75 * Math.sin(Math.PI * g.v) * w : 0) + ((L.s > 0 && L.i === 1 ? tap : 0) + adj) * 0.5;
      const goal3 = LG.slant + lift3 - air * 0.5 + fold * 0.25;
      const ls = (st.scLeg ??= {})[`${L.s}${L.i}`] ??= { a: goal3, v: 0, q: 0 };
      const q3 = frac(u + L.ph);
      if (q3 < ls.q - 0.5 && w > 0.25) ls.v -= 7 * w;
      ls.q = q3;
      {
        const n = Math.max(1, Math.ceil(dt / (1 / 240)));
        const h = dt / n;
        for (let j = 0; j < n; j++) {
          ls.v += (-340 * (ls.a - goal3) - 2 * 0.38 * Math.sqrt(340) * ls.v) * h;
          ls.a += ls.v * h;
        }
        if (!Number.isFinite(ls.a)) Object.assign(ls, { a: goal3, v: 0 });
      }
      const a3 = clamp(ls.a, -0.4, 1.5);
      const J = add3(F, add3(mul3(pole, L.l3 * Math.cos(a3)), mul3(out, -L.l3 * Math.sin(a3))));
      const kneeUp = L.s * nearSide < 0 ? LG.farUp ?? 1 : 1;
      const [K, J2] = knee(R, J, L.l1, L.l2, add3(mul3(pole, kneeUp), mul3(out, KNEE_OUT)));
      const tip = add3(J2, sub3(F, J));
      legs.push({ L, pts: [R, K, J2, tip].map(scr), depth: K[2] + tip[2], side: L.s * nearSide });
    }

    // The pincers: each wrist where its pose puts it, the arm's two bones reaching it (the elbow out
    // and a little up), the hand turned as the pose turns it but never folded back on the forearm.
    const claws = {};
    const mir = cr >= 0 ? 1 : -1;
    for (const s of [1, -1]) {
      const key = s > 0 ? 'n' : 'f';
      const R = S[`${key}R`];
      const U = S[`${key}U`];
      const sh = [CL.root[0], HB + CL.root[1], s * CL.root[2]];
      const wr = [CL.wrist[0] + CL.reach * R - 1.6 * U, HB + CL.wrist[1] + CL.up * U, s * (CL.wrist[2] - 1.4 * Math.max(0, U))];
      const [el, wr2] = knee(sh, wr, CL.arm[0], CL.arm[1], [-0.3, 0.55, s]);
      const Sw = T(sh);
      const Ew = T(el);
      const Ww = T(wr2);
      // (kept off the ground when it stands)
      if (flip < 0.3 && dig < 0.02) {
        const lift = Math.max(0, HAND_W * 0.46 - Ww[1]);
        Ww[1] += lift;
        Ew[1] += lift * 0.5;
      }
      const ws = scr(Ww);
      const es = scr(Ew);
      const fore = Math.atan2(ws[1] - es[1], ws[0] - es[0]);
      const want = (S[`${key}A`] - S.tilt) * DEG * mir;
      const angGoal = fore + soften(wrapPi(want - fore), 1.5);
      // (the hand follows its arm on a soft spring: a little lag, and a wobble that settles after a snap)
      const hs = (st.scHand ??= {})[key] ??= { a: angGoal, v: 0 };
      {
        const n = Math.max(1, Math.ceil(dt / (1 / 240)));
        const h = dt / n;
        for (let j = 0; j < n; j++) {
          hs.v += (-520 * wrapPi(hs.a - angGoal) - 2 * 0.36 * Math.sqrt(520) * hs.v) * h;
          hs.a += hs.v * h;
        }
        if (!Number.isFinite(hs.a)) Object.assign(hs, { a: angGoal, v: 0 });
      }
      const ang = angGoal + soften(wrapPi(hs.a - angGoal), 0.5);
      let open = clamp(S[`${key}O`], 0, 1.15);
      open = lerp(open, 0.5 + 0.45 * Math.sin(t * 9 + s * 1.4), wave * 0.8);
      claws[key] = { s, side: s * nearSide, S: scr(Sw), E: es, W: ws, ang, open, mir };
    }

    // The tail: a chain of springs, each piece following the one before a beat late. Its goal: the
    // rest arch (raised, coiled), blended into a strike, laid down or curled round; mirrored as it
    // rolls onto its back so it curls up off the ground; swaying with the gait and idling.
    const ts = (st.scTail ??= { ang: null, vel: new Array(PIECES).fill(0) });
    const tUp = S.tUp;
    const coil = 1 + S.tCurl;
    const root0 = TL.a0 + tUp;
    const bends = TL.bend.map((b) => b * coil);
    const shapeOf = (abs) => [abs[0], ...abs.slice(1).map((v, i) => v - abs[i])];
    const blendIn = (target, k) => {
      if (k <= 0) return;
      const [r, ...bs] = shapeOf(target);
      rootG = lerp(rootG, r, k);
      for (let i = 0; i < bendG.length; i++) bendG[i] = lerp(bendG[i], bs[i], k);
    };
    let rootG = root0;
    const bendG = bends.slice();
    blendIn(STRUCK, clamp(S.tStrike, 0, 1.1));
    blendIn(LAID, ease(clamp(S.tLay, 0, 1)));
    blendIn(CURLED, ease(clamp(S.tWrap, 0, 1)));
    // (life: a slow idle sway, a beat-late sway with each step, a wriggle on its back)
    const calm = a.scCalm ?? 1;
    rootG += Math.sin(t * 0.85) * 3 * calm + w * 7 * Math.sin(2 * TAU * u - 0.9);
    for (let i = 0; i < bendG.length; i++) bendG[i] += Math.sin(t * 1.1 - i * 0.6) * 1.4 * calm + wave * 9 * Math.sin(t * 8 - i * 0.9);
    // (rolled over: the same shape mirrored, curling up off the ground)
    const fl = ease(clamp(flip, 0, 1));
    rootG = lerp(rootG, 360 - rootG, fl);
    for (let i = 0; i < bendG.length; i++) bendG[i] *= 1 - 2 * fl;
    // The springs: stiff and quick through a move, softer standing about; the body's own pushes
    // (walking off, stopping, lunging, landing) swing it.
    const vx = dt > 0 ? went / dt : 0;
    const vy = dt > 0 ? (gy - (st.scGy ?? gy)) / dt : 0;
    st.scGy = gy;
    const ax = dt > 0 ? clamp((vx - (st.scVx ?? vx)) / dt, -700, 700) : 0;
    const ay = dt > 0 ? clamp((vy - (st.scVy ?? vy)) / dt, -700, 700) : 0;
    st.scVx = vx;
    st.scVy = vy;
    st.scAx = lerp(st.scAx ?? 0, ax, Math.min(1, dt * 20));
    st.scAy = lerp(st.scAy ?? 0, ay, Math.min(1, dt * 20));
    const k0 = a.scBusy ? 900 : 190;
    // (each piece's goal: partly the piece before it plus its bend, so a wave runs down a beat late,
    // partly its own place in the whole shape, so a strike moves the whole tail at once)
    const own = a.scBusy ? 0.7 : 0.45;
    const absG = [rootG];
    for (let i = 1; i < PIECES; i++) absG.push(absG[i - 1] + bendG[i - 1]);
    if (!ts.ang) {
      ts.ang = [];
      let an = rootG;
      for (let i = 0; i < PIECES; i++) {
        if (i) an += bendG[i - 1];
        ts.ang.push(an);
      }
    }
    // (the body's settle swings it too: as the body pitches, the tail is left behind a beat; a hit
    // flicks it)
    const pitchAcc = dt > 0 ? clamp((bs.vp - (st.scVp ?? bs.vp)) / dt, -3000, 3000) * settle : 0;
    st.scVp = bs.vp;
    if (st.scTailKick) {
      for (let i = 0; i < PIECES; i++) ts.vel[i] += 90 + 30 * i;
      st.scTailKick = 0;
    }
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let n = 0; n < steps; n++) {
      for (let i = 0; i < PIECES; i++) {
        const goal = i ? lerp(ts.ang[i - 1] + bendG[i - 1], absG[i], own) : rootG;
        const k = k0 * (1 - 0.08 * i);
        const c = 2 * 0.56 * Math.sqrt(k);
        const th = ts.ang[i] * DEG;
        const push = (st.scAx * Math.sin(th) - st.scAy * Math.cos(th)) * (0.05 + 0.012 * i) * (1 - fl);
        const acc = -k * (ts.ang[i] - goal) - c * ts.vel[i] + push / DEG - pitchAcc * (0.25 + 0.08 * i);
        ts.vel[i] += acc * h;
        ts.ang[i] += ts.vel[i] * h;
      }
    }
    for (let i = 0; i < PIECES; i++) if (!Number.isFinite(ts.ang[i])) ts.ang = null;
    // (the tail never curls shut onto its back: if the bulb or the last bead comes down too near the
    // back, the end of the tail is opened up again, softly, so a clear gap always shows)
    if (ts.ang && fl < 0.5 && clamp(S.tLay, 0, 1) + clamp(S.tWrap, 0, 1) < 0.3) {
      // (seen from a little above, the far side of the back shows higher than its middle line)
      const GAP = 1.8 + B.zr * SP * 0.7;
      const topAt = (x) => (Math.abs(x) < A * 0.98 ? midAt(x / A) + yrAt(x / A) : -1e3);
      for (let pass = 0; pass < 4; pass++) {
        let p = [tailRoot[0], HB + tailRoot[1]];
        let worst = 0;
        for (let i = 0; i < PIECES; i++) {
          const an = ts.ang[i] * DEG;
          const len = i < TL.len.length ? TL.len[i] : TL.bulb * 0.72;
          p = [p[0] + Math.cos(an) * len, p[1] + Math.sin(an) * len];
          if (i < 2) continue;
          const r = i < TL.len.length ? TL.w[i] * 0.5 : TL.bulb;
          worst = Math.max(worst, topAt(p[0]) + r + GAP - p[1]);
          if (i === PIECES - 1) {
            // (and the stinger's point, curving down off the bulb)
            const tq = [p[0] + Math.cos(an - 30 * DEG) * (TL.bulb + TL.point), p[1] + Math.sin(an - 30 * DEG) * (TL.bulb + TL.point)];
            worst = Math.max(worst, topAt(tq[0]) + 0.6 + GAP - tq[1]);
          }
        }
        if (worst <= 0) break;
        for (let i = 2; i < PIECES; i++) {
          const k = (i - 1) / (PIECES - 2);
          ts.ang[i] += worst * 5 * k;
          ts.vel[i] = Math.max(ts.vel[i], 0);
        }
      }
    }
    const angs = ts.ang ?? new Array(PIECES).fill(TL.a0);
    const wrap = ease(clamp(S.tWrap, 0, 1));
    const joints = [[tailRoot[0], HB + tailRoot[1], 0]];
    for (let i = 0; i < TL.len.length; i++) {
      const an = angs[i] * DEG;
      const p = joints[i];
      const z = wrap * (B.zr + 3) * ease((i + 1) / TL.len.length) * nearSide;
      joints.push([p[0] + Math.cos(an) * TL.len[i], p[1] + Math.sin(an) * TL.len[i], z]);
    }
    const bulbAn = angs[PIECES - 1] * DEG;
    const end = joints[joints.length - 1];
    const dir2 = (an) => [Math.cos(an), Math.sin(an), 0];
    const bulbC = add3(end, mul3(dir2(bulbAn), TL.bulb * 0.72));
    const pointMid = add3(bulbC, mul3(dir2(bulbAn - 12 * DEG), TL.bulb + TL.point * 0.45));
    const pointTip = add3(bulbC, mul3(dir2(bulbAn - 30 * DEG), TL.bulb + TL.point));
    const tailW = [...joints, bulbC, pointMid, pointTip].map(T);
    // (never through the ground while it stands on it)
    if (dig < 0.02) {
      tailW.forEach((p, i) => {
        const r = i < joints.length ? TL.w[Math.min(i, TL.w.length - 1)] * 0.45 : TL.bulb * 0.8;
        p[1] = Math.max(p[1], r);
      });
    }
    const tailS = tailW.map(scr);

    // (the light and the shade on the body, and the guides)
    const visible = (around) => dot3(Tdir([0, Math.cos(around), Math.sin(around)]), [0, SP, CP]) > 0.05;
    return {
      pivot, gy, flip, dig, nearSide, mir, wrapped: wrap > 0.5,
      hull,
      light: scr(T([A * 0.22, HB + B.yr * 1.1, B.zr * 0.3])),
      under: scr(T([A * 0.05, HB - B.yr * 1.5, B.zr * 0.95])),
      farSide: scr(T([-A * 0.2, HB + B.yr * 0.1, -B.zr * 1.3])),
      spine: visible(0) ? SPINE.map((p) => scr(T([p[0], p[1] + HB, p[2]]))) : null,
      brow: BROW.map((p, i) => ({ p: scr(T([p[0], p[1] + HB, p[2]])), on: visible(lerp(-80, 84, i / 14) * DEG) })),
      legs, claws,
      tail: { pts: tailS.slice(0, joints.length), bulb: tailS[joints.length], mid: tailS[joints.length + 1], tip: tailS[joints.length + 2] },
      spots: {
        sting: tailS[joints.length + 2],
        near: null,
        far: null,
        feet: [pivot[0], 0],
        body: [pivot[0], -Math.max(gy, 0) * CP - 2],
        front: [pivot[0] + A * 0.9, 0],
      },
    };
  }

  // ---------- Drawing ----------
  const tone = (a, hex, al = 1) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = hexRgb(hex);
    const f = (v) => Math.round(v + (255 - v) * k);
    return `rgba(${f(r)},${f(g)},${f(b)},${al})`;
  };
  const ink = (ctx, list) => {
    trace(ctx, list);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const glowAt = (ctx, c, r, hex, k) => {
    const [cr, cg, cb] = hexRgb(hex);
    const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
    gr.addColorStop(0, `rgba(${cr},${cg},${cb},${k})`);
    gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
  };
  // Where a part lies across others already drawn (`under`), a soft lilac edge just outside its own
  // edge (stroked before its fill, so only the outer half shows); none in the `keep` places, where
  // it grows out of them.
  const edgeOver = (ctx, a, shapes, under, keep = []) => {
    if (!under.length) return;
    ctx.save();
    trace(ctx, under);
    ctx.clip('nonzero');
    for (const k of keep) {
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      addPoly(ctx, k);
      ctx.clip('evenodd');
    }
    trace(ctx, shapes);
    ctx.strokeStyle = tone(a, EDGE);
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  };
  // A shape filled in its colour with a soft band of shade along its underside (the light from above).
  const fillShaded = (ctx, a, shapes, hex, shadeHex, band) => {
    trace(ctx, shapes);
    ctx.fillStyle = tone(a, shadeHex);
    ctx.fill('nonzero');
    ctx.save();
    trace(ctx, shapes);
    ctx.clip('nonzero');
    ctx.translate(band * 0.25, -band);
    trace(ctx, shapes);
    ctx.fillStyle = tone(a, hex);
    ctx.fill('nonzero');
    ctx.restore();
  };
  // Where a leg crosses in front of legs already drawn: only a soft shade it casts on them.
  const castShade = (ctx, a, shapes, under, hex) => {
    if (!under.length) return;
    ctx.save();
    trace(ctx, under);
    ctx.clip('nonzero');
    ctx.translate(0.45, 0.75);
    trace(ctx, shapes);
    ctx.fillStyle = tone(a, hex, 0.55);
    ctx.fill('nonzero');
    ctx.restore();
  };

  const legShapes = (g) => {
    const [R, K, J, F] = g.pts;
    const [w0, w1, w2, w3] = g.L.w;
    return [bead(R, K, w0 / 2, w0 * 0.55, w1 / 2), bead(K, J, w1 / 2, w1 * 0.52, w2 / 2), bead(J, F, w2 / 2, w2 * 0.46, w3 / 2)];
  };
  // The hand in its own frame (x along it, y toward its fixed finger), turned onto the screen: a
  // round palm running on into the fixed lower finger, the hinged upper finger opening up; a V notch
  // between them comes well back toward the palm, so it reads as a pincer even shut.
  const handShapes = (cw) => {
    const L = HAND_L;
    const W = HAND_W;
    const to = (p) => v2add(cw.W, v2turn([p[0], p[1] * cw.mir], cw.ang));
    const palm = wound(curve([[-0.06 * L, 0.02 * W], [0.04 * L, -0.34 * W], [0.24 * L, -0.5 * W], [0.46 * L, -0.46 * W], [0.6 * L, -0.26 * W], [0.62 * L, -0.06 * W], [0.6 * L, 0.2 * W], [0.42 * L, 0.46 * W], [0.2 * L, 0.48 * W], [0.02 * L, 0.36 * W]], 4, true).map(to));
    const fixed = tube([[0.46 * L, 0.24 * W], [0.74 * L, 0.18 * W], [0.97 * L, 0.0 * W]], [0.22 * W, 0.15 * W, 0.085 * W], 4).map(to);
    const hinge = [0.5 * L, -0.3 * W];
    const swing = -cw.open * 0.8;
    const moving = tube([[0.46 * L, -0.34 * W], [0.76 * L, -0.32 * W], [0.98 * L, -0.1 * W]], [0.2 * W, 0.14 * W, 0.08 * W], 4).map((p) => to(v2add(hinge, v2turn(v2sub(p, hinge), swing))));
    const pinch = to(v2add(hinge, v2turn([0.47 * L, 0.2 * W], swing * 0.5)));
    return { palm, fixed, moving, to, pinch };
  };
  const armShapes = (cw) => {
    const [w0, w1, w2] = CL.w;
    return [bead(cw.S, cw.E, w0 / 2, w0 * 0.53, w1 / 2), bead(cw.E, cw.W, w1 / 2, w1 * 0.56, w2 / 2)];
  };
  const tailShapes = (tk) => {
    const out = [];
    for (let i = 0; i < tk.pts.length - 1; i++) {
      const r = TL.w[i] / 2;
      out.push(bead(tk.pts[i], tk.pts[i + 1], r * 0.82, r, r * 0.86));
    }
    return out;
  };
  const bulbShapes = (tk) => [disc(tk.bulb, TL.bulb, 22), tube([tk.bulb, tk.mid, tk.tip], [TL.bulb * 0.55, TL.bulb * 0.34, 0.45], 4)];

  // Each layer: its outline shapes (for the ink pass) and how it fills; drawn back to front.
  function layers(sk) {
    const nearLegs = sk.legs.filter((g) => g.side > 0).sort((p, q) => p.depth - q.depth);
    const farLegs = sk.legs.filter((g) => g.side < 0).sort((p, q) => p.depth - q.depth);
    const nearClaw = sk.claws.n.side > 0 ? sk.claws.n : sk.claws.f;
    const farClaw = sk.claws.n.side > 0 ? sk.claws.f : sk.claws.n;
    const drawn = { body: [], tail: [], legs: [], far: [] };
    const legLayer = (list, near) => ({
      shapes: () => list.flatMap(legShapes),
      fill(ctx, a) {
        const done = [];
        for (const g of list) {
          const sh = legShapes(g);
          castShade(ctx, a, sh, done, near ? C.sh : C.deep);
          fillShaded(ctx, a, sh, near ? C.base : C.sh, near ? C.sh : C.deep, 0.75);
          if (near) {
            // (one soft shade where it comes out from under the body)
            ctx.save();
            trace(ctx, sh);
            ctx.clip('nonzero');
            glowAt(ctx, g.pts[0], g.L.w[0] * 1.6, C.sh, 0.75);
            ctx.restore();
          }
          done.push(...sh);
        }
        if (near) drawn.legs.push(...done);
        else drawn.far.push(...done);
      },
    });
    const clawLayer = (cw, near) => ({
      shapes: () => {
        const hs = handShapes(cw);
        return [...armShapes(cw), hs.palm, hs.fixed, hs.moving];
      },
      fill(ctx, a) {
        const arm = armShapes(cw);
        const hs = handShapes(cw);
        const base = near ? C.base : C.sh;
        const shade = near ? C.sh : C.deep;
        const under = near ? [...drawn.body, ...drawn.tail, ...drawn.legs] : drawn.far;
        // (the upper arm grows out from under the front: no edge round it there)
        const shoulder = bead(cw.S, cw.E, CL.w[0] / 2 + 1.1, CL.w[0] * 0.53 + 1.1, CL.w[1] / 2 + 0.2);
        edgeOver(ctx, a, [...arm, hs.palm, hs.fixed], under, [shoulder]);
        fillShaded(ctx, a, [...arm, hs.palm, hs.fixed], base, shade, 0.7);
        ctx.save();
        trace(ctx, [hs.palm]);
        ctx.clip('nonzero');
        glowAt(ctx, hs.to([0.28 * HAND_L, -0.2 * HAND_W]), HAND_W * 0.62, near ? C.lt : C.base, near ? 0.95 : 0.7);
        ctx.restore();
        // the hinged finger: one with the palm at its hinge, a soft edge where it lies over the rest
        edgeOver(ctx, a, [hs.moving], [...under, ...arm, hs.palm, hs.fixed], [disc(hs.to([0.5 * HAND_L, -0.3 * HAND_W]), HAND_W * 0.3, 12)]);
        fillShaded(ctx, a, [hs.moving], base, shade, 0.5);
        if (!near) drawn.far.push(...arm, hs.palm, hs.fixed, hs.moving);
      },
    });
    const bodyLayer = {
      shapes: () => [sk.hull],
      fill(ctx, a) {
        trace(ctx, [sk.hull]);
        ctx.fillStyle = tone(a, C.base);
        ctx.fill();
        ctx.save();
        trace(ctx, [sk.hull]);
        ctx.clip();
        glowAt(ctx, sk.farSide, A * 0.95, C.sh, 0.55);
        glowAt(ctx, sk.under, B.yr * 2.1, C.sh, 0.8);
        glowAt(ctx, sk.light, A * 0.95, C.lt, 0.95);
        // guides: a soft curved eye line over the front, a faint centre line down the back
        ctx.strokeStyle = tone(a, C.guide);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 0.55;
        ctx.beginPath();
        let pen = false;
        for (const b of sk.brow) {
          if (!b.on) {
            pen = false;
            continue;
          }
          if (pen) ctx.lineTo(b.p[0], b.p[1]);
          else ctx.moveTo(b.p[0], b.p[1]);
          pen = true;
        }
        ctx.stroke();
        if (sk.spine) {
          ctx.globalAlpha *= 0.75;
          ctx.beginPath();
          sk.spine.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
          ctx.stroke();
        }
        ctx.restore();
        drawn.body.push(sk.hull);
      },
    };
    const tailLayer = {
      shapes: () => [...tailShapes(sk.tail), ...bulbShapes(sk.tail)],
      fill(ctx, a) {
        const beads = tailShapes(sk.tail);
        const bulb = bulbShapes(sk.tail);
        const rootKeep = disc(sk.tail.pts[0], TL.w[0] * 0.95, 14);
        edgeOver(ctx, a, [...beads, ...bulb], [...drawn.body, ...drawn.legs], [rootKeep]);
        const done = [];
        beads.forEach((b, i) => {
          castShade(ctx, a, [b], done, C.sh);
          fillShaded(ctx, a, [b], C.base, C.sh, 0.7);
          ctx.save();
          trace(ctx, [b]);
          ctx.clip('nonzero');
          glowAt(ctx, v2add(v2mix(sk.tail.pts[i], sk.tail.pts[i + 1], 0.5), [-0.3, -TL.w[i] * 0.22]), TL.w[i] * 0.55, C.lt, 0.85);
          ctx.restore();
          done.push(b);
        });
        castShade(ctx, a, bulb, done, C.sh);
        fillShaded(ctx, a, bulb, C.base, C.sh, 0.7);
        ctx.save();
        trace(ctx, bulb);
        ctx.clip('nonzero');
        glowAt(ctx, v2add(sk.tail.bulb, [-TL.bulb * 0.3, -TL.bulb * 0.35]), TL.bulb * 0.9, C.lt, 0.95);
        ctx.restore();
        drawn.tail.push(...beads, ...bulb);
      },
    };
    // (the near legs come out from under the body: drawn before it, so their upper parts are tucked
    // under its lower edge and no leg edge crosses its side)
    return [legLayer(farLegs, false), clawLayer(farClaw, false), legLayer(nearLegs, true), bodyLayer, tailLayer, clawLayer(nearClaw, true)];
  }

  // ---------- Effects: twinkles where it lands a blow, clacks, dust, sand, a mound, speed lines ----------
  const twinkle = (ctx, x, y, r, spin, fill) => {
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const q = spin + (i * Math.PI) / 2;
      const p = [x + Math.cos(q) * r, y + Math.sin(q) * r];
      if (i === 0) ctx.moveTo(p[0], p[1]);
      else ctx.quadraticCurveTo(x, y, p[0], p[1]);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const puff = (ctx, x, y, r, al) => {
    ctx.globalAlpha = al;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = '#f4f0fa';
    ctx.fill();
    ctx.strokeStyle = '#d8cee8';
    ctx.lineWidth = Math.max(0.35, r * 0.14);
    ctx.stroke();
  };
  function drawFx(ctx, m, a, sk) {
    const mv = a.scMove?.mv;
    const t = a.scMove?.t ?? 0;
    if (!mv) return;
    ctx.save();
    for (const [s0, where] of mv.spark ?? []) {
      const k = windowOf(s0, t, 0.26);
      if (k < 0) continue;
      const [x, y] = sk.spots[where] ?? sk.spots.front;
      const e = 1 - (1 - k) ** 3;
      ctx.globalAlpha = 1 - k;
      twinkle(ctx, x, y, H * 0.22 * (0.45 + 0.7 * e), k * 0.9, '#ffffff');
      twinkle(ctx, x, y, H * 0.11 * (0.45 + 0.7 * e), k * 0.9 + 0.78, '#fff3b0');
      for (let j = 0; j < 4; j++) {
        const q = (j * TAU) / 4 + 0.4 + k;
        twinkle(ctx, x + Math.cos(q) * H * 0.24 * e, y + Math.sin(q) * H * 0.24 * e, H * 0.05, q, j % 2 ? '#ffcfe2' : '#fff6cc');
      }
    }
    for (const [c0, where] of mv.clack ?? []) {
      const k = windowOf(c0, t, 0.2);
      if (k < 0) continue;
      const [x, y] = sk.spots[where];
      ctx.globalAlpha = 1 - k;
      twinkle(ctx, x, y - 1, H * 0.09 * (0.6 + k), k, '#ffffff');
    }
    for (const [d0, where] of mv.dust ?? []) {
      const k = windowOf(d0, t, 0.42);
      if (k < 0) continue;
      const gx = sk.spots[where][0];
      const e = 1 - (1 - k) ** 2;
      for (let i = 0; i < 4; i++) {
        const side = i < 2 ? -1 : 1;
        puff(ctx, gx + side * (3 + (i % 2) * 4) * (0.5 + e), -1 - (i % 2) - e * 2.4, (1.3 + (i % 2) * 0.6) * (0.6 + 0.6 * e), (1 - k) * 0.85);
      }
    }
    // the mound running ahead under the sand
    if (mv.mound && t >= mv.mound[0] && t <= mv.mound[1]) {
      const k = (t - mv.mound[0]) / (mv.mound[1] - mv.mound[0]);
      const grow = ease(k / 0.15) * (1 - ease((k - 0.85) / 0.15));
      const x = sk.pivot[0];
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.ellipse(x, 0.6, A * 0.75, 3.2 * grow + 0.01, 0, Math.PI, TAU);
      ctx.closePath();
      ctx.fillStyle = '#efe8f6';
      ctx.fill();
      ctx.strokeStyle = '#cbbfdc';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const q = frac(t * 2.4 + i / 3);
        puff(ctx, x - A * 0.6 - q * 5, -0.6 - q * 2, (1 - q) * 1.4 + 0.3, (1 - q) * 0.8 * grow);
      }
    }
    // sand thrown up as it pops out
    for (const s0 of mv.spray ?? []) {
      const k = windowOf(s0, t, 0.5);
      if (k < 0) continue;
      const x = sk.pivot[0];
      for (let i = 0; i < 9; i++) {
        const q = (i / 8 - 0.5) * 2.2;
        const sp = 9 + (i % 3) * 3;
        const gx = x + Math.sin(q) * sp * k * 1.3;
        const gyy = -(Math.cos(q) * sp * 1.6 * k - 20 * k * k);
        ctx.globalAlpha = (1 - k) * 0.95;
        ctx.beginPath();
        ctx.arc(gx, Math.min(gyy, 0), 0.55 + (i % 2) * 0.35, 0, TAU);
        ctx.fillStyle = '#efe6f4';
        ctx.fill();
        ctx.strokeStyle = '#c9bcd9';
        ctx.lineWidth = 0.3;
        ctx.stroke();
      }
    }
    if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
      const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
      ctx.globalAlpha = 0.7 * (1 - k);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.9;
      for (let i = 0; i < 3; i++) {
        const y = -sk.gy * CP + (i - 1) * 3.2;
        ctx.beginPath();
        ctx.moveTo(sk.pivot[0] - A - 4 - 5 * k, y);
        ctx.lineTo(sk.pivot[0] - A - 12 - 9 * k, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function draw(ctx, m, a, S) {
    const sk = skeleton(S, a, m);
    // (where the claws' tips are, for the effects)
    for (const key of ['n', 'f']) {
      const hs = handShapes(sk.claws[key]);
      sk.spots[key === 'n' ? 'near' : 'far'] = hs.to([0.98 * HAND_L, -0.05 * HAND_W]);
    }
    ctx.save();
    ctx.globalAlpha = a.alpha ?? 1;
    if (sk.dig > 0.002) {
      // (sinking into the sand: nothing below the ground shows)
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 1e4 + 1.6);
      ctx.clip();
    }
    const list = layers(sk);
    for (const L of list) ink(ctx, L.shapes());
    for (const L of list) L.fill(ctx, a);
    ctx.restore();
    drawFx(ctx, m, a, sk);
  }

  // ---------- The rig ----------
  function playing(m, a, st) {
    if (m.act && SCORPION_MOVES[m.act.name]) {
      const mv = SCORPION_MOVES[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.prep + lastOf(mv)) return [mv, T - mv.prep, mv.prep > 0 ? Math.min(1, T / mv.prep) : 1];
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.scAtk) {
        const pool = m.def.moves ?? P.moves;
        st.scN = (st.scN ?? m.uid) + 1;
        st.scPick = m.move ?? pool[st.scN % pool.length];
      }
      st.scAtk = true;
      const mv = SCORPION_MOVES[st.scPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.prep, a.ph.antic];
    } else st.scAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lastOf(SCORPION_MOVES.hurt)) return [SCORPION_MOVES.hurt, a.hurtAgo, 1];
    const happy = SCORPION_MOVES.cheer;
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < happy.prep + lastOf(happy)) return [happy, gl - happy.prep, gl < happy.prep ? gl / happy.prep : 1];
    if (m.hp > 0 && m.cine?.mood === 'happy') {
      const len = happy.prep + lastOf(happy) + 0.4;
      const T = (a.now % len) - happy.prep;
      return [happy, T, T < 0 ? 1 + T / happy.prep : 1];
    }
    return [null, 0, 0];
  }
  const RW = Math.ceil((A + CL.wrist[0] + HAND_L + 8) * 2 + 12);
  const RH = Math.ceil(H * 2 + 12);
  const rig = makeRig({
    w: RW,
    h: RH,
    soft: true,
    stride: CYCLE,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, ['nO', 'fO'].includes(c) ? [420, 30] : c === 'yaw' ? [70, 13] : c === 'flip' ? [180, 22] : c === 'nA' || c === 'fA' ? [200, 23] : c === 'tWrap' || c === 'tLay' ? [110, 19] : [170, 21]])),
    walkStiff: { lift: [600, 48], tilt: [300, 32] },
    fast: CH.filter((c) => !['yaw', 'tWrap', 'tLay'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.scActive),
    kick: { tilt: 60, nO: 6, fO: 6, nU: 3, fU: 3 },
    turnKick: { yaw: 150, lift: -10 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 5) * 1.7;
      // Standing about: breathing; the pincers flexing, each now and then clicking shut twice; the tail
      // swaying (in its springs) with a quick twitch now and then; a leg tapping; a glance our way;
      // now and then cleaning the near pincer at its mouth.
      const calm = (1 - a.walkW) * (a.calm ?? 1);
      a.scCalm = 0.4 + 0.6 * calm;
      const breath = Math.sin(t * 1.3);
      const clickN = hold(t % 5.7, 2, 2.07, 2.11, 2.2) + hold(t % 5.7, 2.34, 2.41, 2.45, 2.56);
      const clickF = hold(t % 7.3, 4.6, 4.68, 4.72, 4.84);
      const twitch = hold(t % 6.1, 3, 3.08, 3.14, 3.5) * calm;
      a.scTap = (hold(t % 8.3, 1.2, 1.3, 1.36, 1.5) + hold(t % 8.3, 1.62, 1.72, 1.78, 1.92)) * calm;
      // (now and then another leg is lifted and set down again: a far front leg tapping, a back leg
      // shifting its weight)
      a.scTapF = hold(t % 9.7, 5.1, 5.24, 5.3, 5.46) * calm;
      a.scShift = hold(t % 12.7, 3.6, 3.85, 3.95, 4.3) * calm;
      const glance = hold(t % 11.3, 6, 6.5, 7.6, 8.2) * calm;
      const clean = hold(t % 17.9, 10, 10.6, 12.8, 13.4) * calm;
      const nibble = clean * (0.5 + 0.5 * Math.sin(t * 13));
      const idle = {
        x: 0, lift: breath * 0.16, hop: 0, crouch: 0.04, tilt: Math.sin(t * 0.5) * 0.8 + glance * 2 - clean * 3, flip: 0, yaw: glance * 18,
        nR: 0.05 * Math.sin(t * 0.8) - clean * 0.7, nU: 0.07 * Math.sin(t * 0.9 + 1) + clean * 0.55, nO: (0.34 + 0.08 * Math.sin(t * 0.7)) * (1 - clickN * 0.95) * (1 - clean) + nibble * 0.35, nA: CL.ang + 4 * Math.sin(t * 0.6) - clean * 96,
        fR: 0.05 * Math.sin(t * 0.7 + 2) + clean * 0.15, fU: 0.07 * Math.sin(t * 0.85 + 2.4), fO: (0.32 + 0.08 * Math.sin(t * 0.75 + 1)) * (1 - clickF * 0.95), fA: CL.ang - 3 + 4 * Math.sin(t * 0.5 + 1),
        tUp: twitch * 12, tCurl: -twitch * 0.12, tStrike: 0, tLay: 0, tWrap: 0, fold: 0, tuck: 0, wave: 0, dig: 0, scrab: 0,
      };
      const walk = { ...idle, lift: 0, crouch: 0.02, tilt: 0, yaw: 0, nR: 0.08, fR: 0.08, nU: 0.16, fU: 0.16, nO: 0.28, fO: 0.28, nA: CL.ang - 6, fA: CL.ang - 8, tUp: 0, tCurl: 0 };
      const [mv, mt, prepW] = playing(m, a, st);
      const base = {};
      for (const c of CH) base[c] = lerp(idle[c], walk[c], a.walkW);
      const out = mv ? poseAt(mv, mt, prepW, base) : { ...base };
      // Poses, asleep (a nap), beaten.
      const nap = m.habit?.kind === 'nap' && a.now < (m.habit.until ?? 0) && m.hp > 0;
      const slow = Math.sin(t * 0.75);
      const pose = nap ? 'sleep' : m.pose;
      if (pose === 'rest') Object.assign(out, { crouch: 1, fold: 1, tLay: 1, tUp: 0, tCurl: 0, nR: -0.1, fR: -0.05, nU: -0.35, fU: -0.35, nO: 0.08, fO: 0.08, nA: 4, fA: 0, lift: breath * 0.1, yaw: 0 });
      else if (pose === 'guard') Object.assign(out, { crouch: 0.22, nR: 0.1, fR: 0.25, nU: 1, fU: 1, nA: -58, fA: -50, nO: 0.2, fO: 0.2, tUp: 8, tCurl: 0.22, yaw: 0 });
      else if (pose === 'sleep') Object.assign(out, { crouch: 1, fold: 1, tWrap: 1, tUp: 0, tCurl: 0, nR: -0.25, fR: -0.2, nU: -0.4, fU: -0.4, nO: 0.03, fO: 0.03, nA: 10, fA: 8, lift: slow * 0.18, tilt: -1.5 + slow * 0.4, yaw: 0 });
      if (m.hp <= 0) Object.assign(out, { crouch: 1, fold: 1, tLay: 0.85, tCurl: -0.2, tUp: 0, tStrike: 0, nR: 0.1, fR: 0, nU: -0.4, fU: -0.4, nO: 0.5, fO: 0.45, nA: 12, fA: 4, tilt: -2, flip: 0, wave: 0, tuck: 0, dig: 0, yaw: 0 });
      else if (!mv && m.cine?.mood === 'sad') Object.assign(out, { crouch: 0.55, nU: -0.4, fU: -0.4, nO: 0.05, fO: 0.05, tLay: 0.45, tCurl: -0.1 });
      else if (!mv && m.cine?.mood === 'angry') Object.assign(out, { nU: 0.6, fU: 0.6, nO: 0.9, fO: 0.9, nA: -40, fA: -40, crouch: 0.2, tCurl: 0.4, tUp: 8 });
      st.scActive = Boolean(mv);
      a.scBusy = Boolean(mv);
      a.scMove = mv ? { mv, t: mt } : null;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = out.x * A;
      res.hop = out.hop * A;
      return res;
    },
    parts: [],
    fx: (ctx, m, a, S) => draw(ctx, m, a, S),
  });
  // (a still for the Monster Book: the body, the arched tail and the near pincer, plain)
  const still = () => {
    const w = RW;
    const h = Math.ceil(H * 1.3 + 4);
    const gx = w / 2;
    const gy = h - 1;
    return { w, h, res: 3, shapes: [E(gx, gy - HB, A, B.yr, C.base), E(gx - A * 0.55, gy - H * 0.72, TL.w[1] * 1.1, H * 0.3, C.base), E(gx + CL.wrist[0] + HAND_L * 0.35, gy - HB - 1, HAND_L * 0.5, HAND_W * 0.5, C.base)] };
  };
  return { rig, still, stride: CYCLE, speed: SPEED, H, w: Math.round(A * 3.2), h: Math.round(H * 1.0), moves: P.moves };
}

export const SCORPION_ARTS = {};
export const SCORPION_DEFS = {};
for (const kind of SCORPION_KINDS) {
  const r = scorpionRig(kind);
  SCORPION_ARTS[`blank_${kind}`] = { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig };
  SCORPION_DEFS[kind] = { id: `blank_${kind}`, name: `Blank ${kind}`, art: `blank_${kind}`, w: r.w, h: r.h, speed: r.speed, hp: 100, fight: { windup: 0.5 }, bodyH: r.H, beast: true, moves: r.moves };
}
