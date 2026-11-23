// The bunny base (2026-11-23, the player: "NEVER reuse another base when making a new one ... redo
// this to be perfect"): a blank chibi rabbit made for a rabbit from the start, nothing carried
// over from another base; only the engine is shared (rig.js's springs, and blankquad.js's
// three-bone leg joints, drawn so a leg never shows on the body it comes out of). Drawn live like
// the other blank bases: one smooth shape over its bones, outlined only on its outer edge.
//
// The body, side on, facing right:
//   spine   two bones from the middle of the back (the lumbar to the haunch, the thoracic to the
//           chest), so it hunches round, stretches long, and sits bolt upright on its haunches
//           (`sit`, its forepaws held up to its chest)
//   body    an egg: a small chest, a big round haunch; a fluffy pale chest tuft, the back lit, the
//           belly shaded softly between the legs
//   legs    short slim forelegs; a rabbit's hind legs, folded at rest (the thigh inside the round
//           haunch, the shank down and back to the heel, the long foot flat on the ground from heel
//           to toe)
//   gait    hopping: each stride one hop (the forepaws land, the hind feet swing down ahead, the
//           forepaws lift, the hind legs push off, rolling up onto their toes, and it flies, the
//           hind legs trailing out long behind), the body arcing up nose first, landing nose down
//   head    a big egg: the skull, puffy cheeks, a round nose end, a little split-lip 'Y' under a
//           small nose that twitches now and then, faint whiskers, a soft line where the eyes go
//   ears    long, each in two pieces on springs (the base and the tip), so they sway back as it
//           leaps and flop forward as it lands, the tips a beat behind; standing up for a bunny or
//           a hare, hanging down the sides of the head for a lop; pale inside
//   tail    a cotton-ball puff, bouncing on its own spring
// Presets: a bunny; a lop (rounder, its ears hanging); a hare (lean and long-legged, very long ears).
// Moves (BUNNY_MOVES): a head bonk, a foot thump (a warning stamp, twice), a nibble, a binky (a
// happy twisting leap, when pleased), jump, dash, dodge, hurt, knockdown. Poses (m.pose): sit
// (upright, paws up), loaf (a round lump, every paw tucked), lie (a sploot: flat out, the hind legs
// stretched straight back).

import { makeRig, clamp, TAU } from './rig.js';
import { hold } from './kidrig.js';
import { E } from './kit.js';
import { OUTLINE, sprite } from '../pixel.js';
import { legDefs as legDefsOf, placeLeg, legDrawer } from './blankquad.js';

const D2R = Math.PI / 180;
const C = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#9c8fb8', inner: '#dcc9e2' };
const smoothstep = (u) => {
  const v = Math.min(1, Math.max(0, u));
  return v * v * (3 - 2 * v);
};
const lerp = (a, b, u) => a + (b - a) * u;
const rot = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const lerp2 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
const hexRgb = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
function ring(pts, n) {
  const P = [pts[pts.length - 1], ...pts, pts[0], pts[1]];
  const out = [];
  for (let i = 1; i <= pts.length; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(p1.map((_, k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  return out;
}

// ---------- The bunnies (units: game px at scale 1, about the middle of the back; x forward, y down) ----------
// body: its outline round from the top of the neck, back over the back and round the haunch, along
// the belly and up the chest: [x, y, follows the near foreleg's upper arm, follows the near thigh].
const BUNNY = {
  name: 'Bunny',
  scale: 1,
  body: [
    [6.6, -7.4, 0, 0], [1.8, -9.4, 0, 0], [-3.6, -10.2, 0, 0], [-8.6, -9.6, 0, 0.1], [-12.8, -7.2, 0, 0.25], [-15.2, -3.2, 0, 0.45],
    [-15.4, 1.2, 0, 0.6], [-13.8, 5.2, 0, 0.8], [-10.2, 7.4, 0, 0.85], [-5.2, 7.6, 0, 0.3], [0, 7, 0, 0], [4.4, 6.4, 0.5, 0],
    [7.6, 4.6, 0.6, 0], [9, 1.2, 0.2, 0], [8.8, -2.4, 0, 0], [7.8, -5.4, 0, 0],
  ],
  tuft: [7.4, 2.4],
  fore: { top: [5.6, 1.6], bones: [[-0.6, 3.6], [0.5, 3.4], [0.7, 2]], w: [5.4, 3.6, 2.8, 2.6] },
  hind: { top: [-10.6, -1], bones: [[5.6, 5], [-6.4, 6], [7.6, 0.6]], w: [13, 7, 5.4, 3.4] },
  far: [-1.4, -0.6],
  paw: { w: 3.8, h: 2.3, up: 0.9 },
  neck: { base: [6.8, -4.6], len: 2.6, w: 7, ang: -72 },
  head: {
    skull: [0, 0, 9.4, 8.2],
    cheek: [-0.2, 3.8, 7.6, 5.2],
    muzzle: [7, 2, 3.6, 3.1],
    nose: [10.2, 0.8, 1.05],
    whiskers: 3,
  },
  ears: { hang: false, near: [-1.8, -7.2], far: [-4.6, -6.8], len: [7, 8.4], w: [3.4, 4.8, 4.2], ang: -98, bend: 6, spread: 8 },
  tail: { at: [-15.6, -3], r: 3.4 },
  sit: { lumbar: 48, chest: 84 },
  moves: ['bonk', 'thump', 'nibble'],
};
const LOP = {
  name: 'Lop',
  scale: 1.02,
  body: [
    [6.6, -7.8, 0, 0], [1.6, -10, 0, 0], [-3.8, -10.8, 0, 0], [-9, -10.2, 0, 0.1], [-13.4, -7.6, 0, 0.25], [-15.8, -3.4, 0, 0.45],
    [-16, 1.4, 0, 0.6], [-14.2, 5.6, 0, 0.8], [-10.4, 7.8, 0, 0.85], [-5.2, 8, 0, 0.3], [0, 7.4, 0, 0], [4.6, 6.8, 0.5, 0],
    [7.8, 4.8, 0.6, 0], [9.2, 1.2, 0.2, 0], [9, -2.6, 0, 0], [8, -5.8, 0, 0],
  ],
  tuft: [7.6, 2.6],
  fore: { top: [5.8, 1.8], bones: [[-0.6, 3.6], [0.5, 3.2], [0.7, 2]], w: [6, 4, 3, 2.8] },
  hind: { top: [-11, -1], bones: [[5.6, 5], [-6.4, 6], [7.4, 0.6]], w: [14, 7.4, 5.6, 3.6] },
  far: [-1.4, -0.6],
  paw: { w: 4, h: 2.4, up: 0.9 },
  neck: { base: [7, -4.8], len: 2.4, w: 7.6, ang: -72 },
  head: {
    skull: [0, 0, 9.8, 8.8],
    cheek: [-0.2, 4.2, 8, 5.6],
    muzzle: [7, 2.4, 3.4, 3.2],
    nose: [10, 1.2, 1],
    whiskers: 3,
  },
  ears: { hang: true, near: [-3.4, -6.4], far: [-5.6, -6], len: [6.6, 10], w: [4.2, 6, 5.2], ang: 98, bend: 10, spread: 5 },
  tail: { at: [-16.2, -3], r: 3.6 },
  sit: { lumbar: 46, chest: 82 },
  moves: ['bonk', 'thump', 'nibble'],
};
const HARE = {
  name: 'Hare',
  scale: 1,
  body: [
    [7.2, -7, 0, 0], [2, -8.8, 0, 0], [-3.8, -9.4, 0, 0], [-9.2, -9, 0, 0.1], [-13.6, -6.6, 0, 0.25], [-16, -2.8, 0, 0.45],
    [-16, 1.4, 0, 0.6], [-14.2, 4.8, 0, 0.8], [-10.6, 6.6, 0, 0.85], [-5.4, 6.4, 0, 0.3], [0, 5.6, 0, 0], [4.8, 5.4, 0.5, 0],
    [8.2, 4, 0.6, 0], [9.8, 0.8, 0.2, 0], [9.6, -2.6, 0, 0], [8.6, -5.2, 0, 0],
  ],
  tuft: [8.2, 2],
  fore: { top: [6.2, 1.2], bones: [[-0.7, 4.4], [0.5, 4.6], [0.7, 2.2]], w: [5, 3.4, 2.6, 2.4] },
  hind: { top: [-11.4, -1.2], bones: [[6.2, 5.8], [-7.2, 7.2], [9, 0.6]], w: [12, 6.4, 4.8, 3] },
  far: [-1.4, -0.6],
  paw: { w: 3.6, h: 2.2, up: 0.8 },
  neck: { base: [7.6, -4.4], len: 3.4, w: 6.4, ang: -66 },
  head: {
    skull: [0, 0, 9, 7.8],
    cheek: [-0.2, 3.4, 7, 4.8],
    muzzle: [7.2, 1.8, 3.6, 2.8],
    nose: [10.4, 0.6, 1],
    whiskers: 3,
  },
  ears: { hang: false, near: [-1.6, -6.8], far: [-4.4, -6.4], len: [8.4, 10], w: [3, 4.2, 3.4], ang: -104, bend: 4, spread: 10, tips: true },
  tail: { at: [-16.2, -2.6], r: 2.6 },
  sit: { lumbar: 46, chest: 84 },
  moves: ['bonk', 'thump', 'nibble'],
};
export const BUNNY_PRESETS = { bunny: BUNNY, lop: LOP, hare: HARE };
export const BUNNY_KINDS = ['bunny', 'lop', 'hare'];

// ---------- The bunny moves (units: x, hop in body heights; lift in px; angles in degrees) ----------
// pitch: + nose down; hunch: + the back rounded up; ears: + up / forward, - laid back.
export const BUNNY_MOVES = {
  bonk: {
    anticT: 0.18,
    keys: [
      [0, { x: -0.05, crouch: 0.45, pitch: 6, hunch: 6, neck: 6, head: -6, ears: 0.6 }],
      [0.09, { x: 0.17, hop: 0.12, pitch: -6, hunch: -4, neck: -4, head: 18, ears: -0.8 }, 'out'],
      [0.18, { x: 0.19, hop: 0, pitch: -2, neck: -2, head: 8, ears: -0.4 }, 'in'],
      [0.32, { x: 0.18, pitch: 2, hunch: 3, neck: 1, head: -3, ears: 0.3 }, 'io'],
      [0.72, {}],
    ],
    spark: [0.09],
    sparkAt: 'brow',
  },
  thump: {
    anticT: 0.2,
    keys: [
      [0, { pitch: -12, hunch: -6, crouch: 0.05, ears: 1, stamp: 0.7, neck: -10 }],
      [0.07, { pitch: 2, hunch: 4, crouch: 0.4, ears: 0.9, stamp: 0, neck: -4 }, 'in'],
      [0.18, { pitch: -10, hunch: -4, crouch: 0.1, ears: 1, stamp: 0.6, neck: -8 }, 'out'],
      [0.25, { pitch: 2, hunch: 4, crouch: 0.4, ears: 0.9, stamp: 0, neck: -4 }, 'in'],
      [0.4, { pitch: -2, hunch: 1, crouch: 0.2, ears: 0.7, neck: -3 }, 'io'],
      [0.8, {}],
    ],
    spark: [0.07, 0.25],
    sparkAt: 'heels',
    rings: [0.07, 0.25],
  },
  nibble: {
    anticT: 0.16,
    keys: [
      [0, { x: -0.03, crouch: 0.3, pitch: 4, neck: 6, head: -4, ears: 0.3 }],
      [0.06, { x: 0.08, pitch: 2, neck: -6, head: 12, ears: 0.5, jaw: 0.7 }, 'out'],
      [0.12, { x: 0.08, neck: -6, head: 10, jaw: 0 }, 'in'],
      [0.18, { x: 0.09, neck: -6, head: 12, jaw: 0.6 }, 'out'],
      [0.24, { x: 0.08, neck: -5, head: 8, jaw: 0 }, 'in'],
      [0.36, { x: 0.06, neck: -2, head: 3 }, 'io'],
      [0.66, {}],
    ],
    spark: [0.06, 0.18],
    sparkAt: 'mouth',
  },
  binky: {
    anticT: 0.12,
    keys: [
      [0, { crouch: 0.55, ears: 0.6 }],
      [0.14, { hop: 0.55, hunch: 14, pitch: -10, neck: -10, head: 18, ears: -0.5, kick: 0.6 }, 'out'],
      [0.27, { hop: 0.6, hunch: -12, pitch: 8, neck: 6, head: -18, ears: 0.8, kick: 0.2 }, 'io'],
      [0.42, { hop: 0, crouch: 0.45, pitch: 0, hunch: 0, kick: 0 }, 'in'],
      [0.54, { crouch: 0.15, pitch: -2, hunch: -3, ears: 0.5 }, 'io'],
      [0.95, {}],
    ],
    spark: [0.2],
    sparkAt: 'head',
    hearts: [0.16],
  },
  jump: {
    anticT: 0.16,
    keys: [
      [0, { crouch: 0.75, pitch: 4, hunch: 6, ears: 0.6 }],
      [0.16, { hop: 0.7, crouch: 0, pitch: -14, hunch: -10, ears: -0.6, fly: 1 }, 'out'],
      [0.32, { hop: 0.74, pitch: 2, hunch: 0, ears: 0, fly: 0.4 }, 'out'],
      [0.5, { hop: 0.02, pitch: 10, ears: 0.6 }, 'in'],
      [0.56, { crouch: 0.5, pitch: 3, ears: 0.3 }, 'out'],
      [0.7, { crouch: 0.1, pitch: -1, ears: 0.5 }, 'io'],
      [1.05, {}],
    ],
    dust: [[0, 'feet'], [0.54, 'paws']],
  },
  dash: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.4 }],
      [0.08, { x: 0.22, hop: 0.12, crouch: 0.1, pitch: -6, hunch: -10, neck: -6, ears: -1, fly: 0.9 }, 'out'],
      [0.3, { x: 0.26, hop: 0.04, crouch: 0.2, pitch: -2, hunch: -6, neck: -6, ears: -1, fly: 0.5 }],
      [0.46, { x: 0.25, crouch: 0.3, pitch: 4, hunch: 4, ears: 0.1 }, 'io'],
      [0.82, {}],
    ],
    lines: [0, 0.32],
    dust: [[0.02, 'feet']],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.4 }],
      [0.12, { hop: 0.3, x: -0.24, pitch: -10, hunch: 10, neck: 4, head: -6, ears: -0.9, kick: 0.4 }, 'out'],
      [0.3, { x: -0.28, crouch: 0.45, pitch: 2, ears: -0.3 }, 'in'],
      [0.46, { x: -0.27, crouch: 0.2, pitch: -2, ears: 0.2 }, 'io'],
      [0.84, {}],
    ],
    dust: [[0.3, 'feet']],
  },
  hurt: {
    anticT: 0,
    keys: [[0, {}], [0.05, { x: -0.05, pitch: -6, hunch: 12, neck: 8, head: -10, ears: -1, crouch: 0.35, jaw: 0.3 }, 'out'], [0.2, { x: -0.05, pitch: -4, hunch: 10, neck: 6, head: -8, ears: -1, crouch: 0.3 }], [0.36, { x: -0.03, pitch: -1, hunch: 4, crouch: 0.1, ears: -0.4 }, 'io'], [0.74, {}]],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.1, { x: -0.06, pitch: -10, head: -10, ears: -1, jaw: 0.3 }, 'out'],
      [0.38, { lie: 1, x: -0.08, neck: 8, head: 10, ears: -1 }, 'in'],
      [0.46, { lie: 0.94, x: -0.08, neck: 6, head: 8, ears: -1 }, 'out'],
      [1.05, { lie: 1, x: -0.08, neck: 8, head: 12, ears: -0.9 }],
      [1.32, { crouch: 0.4, x: -0.04, ears: 0.3 }],
      [1.6, {}],
    ],
    dust: [[0.38, 'body']],
  },
};
export const BUNNY_SHOW = ['bonk', 'thump', 'nibble', 'binky', 'jump', 'dash', 'dodge', 'hurt', 'knockdown'];
const POOL = ['bonk', 'thump', 'nibble'];
const lengthOf = (mv) => mv.keys[mv.keys.length - 1][0];
const EASE = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: smoothstep };
function poseAt(mv, t, antic, base) {
  const keys = mv.keys.map(([kt, pose, ease]) => [kt, { ...base, ...pose }, ease]);
  if (t < 0) {
    const out = {};
    for (const k of Object.keys(base)) out[k] = base[k] + (keys[0][1][k] - base[k]) * smoothstep(antic);
    return out;
  }
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return { ...keys[keys.length - 1][1] };
  const [t0, p0] = keys[i];
  const [t1, p1, ease] = keys[i + 1];
  const u = (EASE[ease] ?? smoothstep)(clamp((t - t0) / Math.max(1e-6, t1 - t0), 0, 1));
  const out = {};
  for (const k of Object.keys(p0)) out[k] = p0[k] + (p1[k] - p0[k]) * u;
  return out;
}
const since = (moments, t, len) => {
  let best = -1;
  for (const m of moments ?? []) if (typeof m === 'number' && t >= m && t <= m + len) best = (t - m) / len;
  return best;
};

const CH = ['x', 'lift', 'hop', 'pitch', 'hunch', 'crouch', 'sit', 'lie', 'loaf', 'fly', 'kick', 'stamp', 'paws', 'neck', 'head', 'jaw', 'ears'];
const EMPTY = () => sprite('rig|blankempty', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// ---------- The hop ----------
// Every part of a hop moves; nothing freezes: the forepaws touch down and the body dips to take it,
// the back rounds as the hind feet swing in under it and land (the gather), the forepaws lift and
// reach, the hind legs push, rolling up onto their toes as the body stretches out long and lifts,
// nose first, and it flies, the hind legs trailing out behind, then swinging forward to land again.
// The body surges ahead through the flight and gathers back over its feet on the ground (only
// itself: the planted feet stay where they are). Faster, the hops are longer and higher, the feet
// down for less of each.
const wrap = (x) => ((x % 1) + 1) % 1;
// (a smooth hump, 0 outside [s, e] of the stride, round across it)
const bump = (u, s0, e0) => {
  const f = wrap(u - s0);
  const len = e0 - s0;
  return f < len ? (1 - Math.cos((TAU * f) / len)) / 2 : 0;
};
// When each foot is down ([lands, share of the stride]) and when the hind feet leave, at `r` speed.
const hopTimes = (r) => ({
  foreN: [0, lerp(0.34, 0.24, r)],
  foreF: [0.03, lerp(0.34, 0.24, r)],
  hindN: [lerp(0.18, 0.14, r), lerp(0.46, 0.34, r)],
  hindF: [lerp(0.2, 0.16, r), lerp(0.46, 0.34, r)],
  push: lerp(0.64, 0.48, r),
});
// A foot at stride u: planted, it slides back under the body as the body goes on; lifted, a forepaw
// folds up under the chest and then reaches ahead to land; a hind foot kicks out behind first, then
// swings forward under the body.
// (a curve from p0 to p1 leaving with slope m0 and arriving with slope m1)
const herm = (p0, p1, m0, m1, v) => {
  const v2 = v * v;
  const v3 = v2 * v;
  return (2 * v3 - 3 * v2 + 1) * p0 + (v3 - 2 * v2 + v) * m0 + (-2 * v3 + 3 * v2) * p1 + (v3 - v2) * m1;
};
// (Smooth: a foot leaves the ground and touches it moving just as the ground does under the body,
// so it never jerks as it lifts or lands; it rises and comes down gently.)
function hopFoot(u, [start, duty], cyc, hind, LF, LH) {
  const q = wrap(u - start);
  const reach = (cyc * duty) / 2;
  if (q < duty) {
    const t = q / duty;
    return { dx: reach - 2 * reach * t, lift: 0, s: t, v: -1 };
  }
  const v = (q - duty) / (1 - duty);
  const m = (-2 * reach * (1 - duty)) / duty;
  const lift = (h) => h * Math.sin(Math.PI * v) ** 1.5;
  if (hind) {
    const back = LH * 0.14;
    const k = 0.3;
    const dx = v < k ? herm(-reach, -reach - back, m * k, 0, v / k) : herm(-reach - back, reach, 0, m * (1 - k), (v - k) / (1 - k));
    return { dx, lift: lift(LH * 0.13), s: -1, v };
  }
  return { dx: herm(-reach, reach, m, m, v), lift: lift(LF * 0.42), s: -1, v };
}
// The slant of a foot: a hind foot flat from heel to toe, rolling up onto its toes as it pushes,
// trailing long behind (the soles back), then swung forward, flat to land; a forepaw rocking over
// as the body goes on, its wrist curling it up under the chest as it lifts, then reaching it out.
function hopSlant(L, g) {
  const v = g.v;
  if (L.hind) {
    if (v < 0) return L.a3 - 1.3 * smoothstep((g.s - 0.55) / 0.45);
    if (v < 0.3) return lerp(L.a3 - 1.3, -0.8, smoothstep(v / 0.3));
    if (v < 0.8) return lerp(-0.8, L.a3 + 0.25, smoothstep((v - 0.3) / 0.5));
    return lerp(L.a3 + 0.25, L.a3, smoothstep((v - 0.8) / 0.2));
  }
  if (v < 0) return L.a3 + lerp(0.18, -0.38, smoothstep(g.s));
  if (v < 0.32) return lerp(L.a3 - 0.38, -1.7, smoothstep(v / 0.32));
  if (v < 0.78) return lerp(-1.7, L.a3 + 0.5, smoothstep((v - 0.32) / 0.46));
  return lerp(L.a3 + 0.5, L.a3 + 0.18, smoothstep((v - 0.78) / 0.22));
}

// ---------- One rig for a preset ----------
function bunnyRig(kind) {
  const P = BUNNY_PRESETS[kind];
  const s = P.scale;
  const sc = (v) => v * s;
  const legDefs = legDefsOf(P, sc);
  const hb = sc((legDefs.foreN.rest[3][1] + legDefs.hindN.rest[3][1]) / 2 + P.paw.up);
  const xs = P.body.map((p) => p[0]);
  const bodyLen = sc(Math.max(...xs) - Math.min(...xs));
  const earTall = P.ears.hang ? 0 : P.ears.len[0] + P.ears.len[1];
  const H = hb + sc(-Math.min(...P.body.map((p) => p[1])) + P.neck.len + P.head.skull[3] * 1.6);
  const LF = legDefs.foreN.lens.reduce((x, y) => x + y, 0);
  const LH = legDefs.hindN.lens.reduce((x, y) => x + y, 0);
  const stride = LH * 0.9;
  const walkSpeed = stride * 1.7;
  const cycle = (r) => stride * (1 + 0.9 * r);
  const kOf = (x) => smoothstep((x + 4) / 8);
  const spineAt = (p, aL, aT) => {
    const k = kOf(p[0]);
    return add(rot(p, aL).map((v) => v * (1 - k)), rot(p, aT).map((v) => v * k));
  };
  // How it sits up, worked out once: the haunch down on its folded hind legs, the back and the chest
  // tipped up bolt upright.
  const SIT = (() => {
    const aL = -P.sit.lumbar * D2R;
    const aT = -P.sit.chest * D2R;
    const back = P.body.filter((p) => p[0] < -3);
    const hM = Math.max(...back.map((p) => spineAt(p, aL, aT)[1])) + 0.1;
    return { aL, aT, hM };
  })();
  const LIE_H = Math.max(...P.body.map((p) => p[1])) * 0.9;
  const LOAF_H = Math.max(...P.body.map((p) => p[1])) * 0.98;

  function skeleton(S, a) {
    const t = a.t;
    const w = a.walkW ?? 0;
    const st = a.mo.rig;
    const run = st.bnRun ?? 0;
    const u = st.bnU ?? 0;
    const sit = clamp(S.sit, 0, 1);
    const lie = clamp(S.lie, 0, 1);
    const loaf = clamp(S.loaf, 0, 1);
    // The hop: each foot's place; the body's height (the dip as it lands, the rise as it pushes, the
    // arc of the flight), its surge (gathering back over its feet, then ahead through the air), the
    // back rounding in the gather and stretching long as it pushes, the nose down to land and up to
    // leave.
    const HT = hopTimes(run);
    const steps = {};
    for (const [k, L] of Object.entries(legDefs)) steps[k] = hopFoot(u, HT[k], cycle(run), L.hind, LF, LH);
    const push = HT.push;
    const fl = wrap(u - push);
    const span = 1 - push;
    const air = fl < span ? Math.sin((Math.PI * fl) / span) : 0;
    const arc0 = (air * LH * (0.26 + 0.3 * run) + bump(u, push - 0.22, push + 0.08) * LH * 0.06 - bump(u, -0.03, 0.26) * LH * 0.07) * w;
    const surge0 = Math.cos(TAU * (u - 0.95)) * stride * (0.12 + 0.06 * run) * w;
    const gather0 = (bump(u, 0.06, 0.52) * 14 - bump(u, push - 0.16, push + 0.24) * 12) * w;
    const tilt0 = (bump(u, push - 0.16, push + 0.2) * 12 - bump(u, 0.86, 1.18) * 10) * (1 + 0.4 * run) * w;
    // (End lag: the body doesn't hit each pose of the hop dead on; it follows a beat behind and
    // settles, so a landing sinks a touch past and comes back up, and every change eases in.)
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const F = (st.bnF ??= {});
    const follow = (key, goal, k, c) => {
      const f = (F[key] ??= [goal, 0]);
      for (let n = 0; n < 2; n++) {
        f[1] += ((goal - f[0]) * k - f[1] * c) * (dt / 2);
        f[0] += f[1] * (dt / 2);
      }
      return f[0];
    };
    const tilt = follow('tilt', tilt0, 230, 21);
    const arc = follow('arc', arc0, 300, 23);
    const surge = follow('surge', surge0, 260, 28);
    const gather = follow('gather', gather0, 200, 21);
    // The spine: tipped, hunched (the back rounded up) or stretched; sitting up, lying, loafing.
    let aL = (S.pitch - tilt - (S.hunch + gather) / 2) * D2R;
    let aT = (S.pitch - tilt + (S.hunch + gather) / 2) * D2R;
    aL = lerp(aL, SIT.aL, sit);
    aT = lerp(aT, SIT.aT, sit);
    aL = lerp(aL, 0.06, Math.max(lie, loaf));
    aT = lerp(aT, -0.04, Math.max(lie, loaf));
    let pH = hb + S.lift - clamp(S.crouch, 0, 1.2) * hb * 0.3;
    pH = lerp(pH, sc(SIT.hM), sit);
    pH = lerp(pH, sc(LIE_H), lie);
    pH = lerp(pH, sc(LOAF_H), loaf);
    const pivot = [S.x + surge, -pH - S.hop - arc];
    const at = (p) => add(pivot, spineAt([sc(p[0]), sc(p[1])], aL, aT));
    // The head, on its short neck, held fairly level; its nose and mouth.
    const nb = at(P.neck.base);
    const na = aT * 0.6 + (P.neck.ang + S.neck) * D2R;
    const hp = add(nb, [Math.cos(na) * sc(P.neck.len), Math.sin(na) * sc(P.neck.len)]);
    // (the head steadier than the body: it rides the hop, tipping a little less than the back)
    // (and the head a beat behind the body again, settling after it)
    const ha = follow('head', aT * 0.45 + (S.head + S.neck * 0.3 + sit * 30) * D2R + tilt * 0.2 * D2R, 200, 22);
    const H0 = P.head;
    const mouth = add(hp, rot([sc(H0.muzzle[0] + 0.6), sc(H0.muzzle[1] + H0.muzzle[3] * 0.85)], ha));
    const brow = add(hp, rot([sc(H0.skull[2] * 0.95), -sc(H0.skull[3] * 0.2)], ha));
    // The legs.
    const tuck = clamp(S.hop / (hb * 0.5), 0, 1) * (1 - clamp(S.fly, 0, 1));
    const ground = -sc(P.paw.up);
    const Lg = {};
    for (const [k, L] of Object.entries(legDefs)) {
      const g = steps[k];
      const T = at(L.top);
      // (a lifted foot rides up with the body through the flight, so the legs keep their shape and
      // never dangle; a planted one stays on the ground)
      let paw = [sc(L.rest[3][0]) + S.x * 0.35 * (1 - w) + g.dx * w, Math.min(ground, ground - g.lift * w - S.hop - (g.v < 0 ? 0 : arc))];
      let a3 = lerp(L.a3, hopSlant(L, g), w);
      if (L.hind && g.v >= 0) {
        // (Through the middle of its swing a hind leg holds a clear pose on the body, never folded
        // away inside the haunch: stretched out long behind as it leaves, the soles back, then swung
        // forward and tucked under the belly, the foot flat, to land; at the very start and end of
        // the swing it's the foot's own path, so it leaves and lands smoothly.)
        const v = g.v;
        const b = Math.sin(Math.PI * v) ** 0.7 * w * (1 - sit);
        const ext = 1 - smoothstep((v - 0.28) / 0.4);
        const rel = lerp2(add(T, [LH * 0.2, LH * 0.44]), add(T, [-LH * 0.7, LH * 0.38]), ext);
        paw = lerp2(paw, rel, b);
        paw[1] = Math.min(paw[1], ground);
        a3 = lerp(a3, lerp(L.a3 + 0.1, -0.95, ext), b);
      }
      const to = (q, an, k2) => {
        if (!(k2 > 0)) return;
        paw = lerp2(paw, q, k2);
        a3 = lerp(a3, an, k2);
      };
      // (leaping: the forelegs reaching ahead, the hind legs out long behind; tucked in a small hop)
      to(add(T, L.hind ? [-LH * 0.7, LH * 0.3] : [LF * 0.7, LF * 0.55]), L.hind ? -1.1 : 0.7, clamp(S.fly, 0, 1));
      to(add(T, L.hind ? [LH * 0.12, LH * 0.36] : [LF * 0.1, LF * 0.6]), L.hind ? L.a3 : -1.8, tuck);
      // (kicking out behind in a binky or a dodge; stamping in a thump: the hind feet up, then down)
      to(add(T, [-LH * 0.62, LH * 0.42]), -0.9, L.hind ? clamp(S.kick, 0, 1) : 0);
      to(add(paw, [-sc(1.5), -sc(2.6)]), L.a3 - 0.5, L.hind ? clamp(S.stamp, 0, 1) : 0);
      // (sitting up: the hind feet flat under it, the forepaws held up to its chest)
      to(L.hind ? [T[0] + LH * 0.32, ground] : add(T, [LF * 0.5, LF * 0.35]), L.hind ? L.a3 : -1.5, sit * (L.hind ? 1 : clamp(S.paws, 0, 1)));
      // (a sploot: flat out, the hind legs straight back, the soles up; the forepaws forward)
      to(L.hind ? [T[0] - LH * 0.92, ground] : [T[0] + LF * 0.9, ground], L.hind ? -1.5 : 1.45, lie);
      // (a loaf: a round lump, the forepaws tucked under the chest, the hind feet under the haunch)
      to(L.hind ? [T[0] + LH * 0.3, ground] : [T[0] + LF * 0.15, ground], L.hind ? L.a3 : -2.2, loaf);
      const bones = placeLeg(L, T, paw, a3);
      const flat = g.v < 0 && Math.max(sit, lie, loaf, tuck) < 0.5 ? (L.hind ? 0.05 : 0.2) : 0.55;
      Lg[k] = { hind: L.hind, ...bones, rot: (a3 - L.a3) * flat, w: L.w };
    }
    const dF = (Lg.foreN.up - (legDefs.foreN.up + aT)) * 0.5;
    const dH = (Lg.hindN.up - (legDefs.hindN.up + aL)) * 0.4;
    const turnAbout = (q, c, an) => add(c, rot([q[0] - c[0], q[1] - c[1]], an));
    const bodyPt = (p) => {
      let q = at(p);
      if (p[2]) q = lerp2(q, turnAbout(q, Lg.foreN.T, dF), p[2]);
      if (p[3]) q = lerp2(q, turnAbout(q, Lg.hindN.T, dH), p[3]);
      return q;
    };
    // The ears: two springs each (the base, then the tip), swinging with the head's turn and the
    // body's rise and fall, the tip a beat behind; up or laid back by `ears`; twitching now and then.
    const E0 = P.ears;
    const bob = (st.bnBob ??= { py: pivot[1], vy: 0, last: ha });
    const vy = dt > 0 ? (pivot[1] - bob.py) / dt : 0;
    const ay0 = dt > 0 ? (vy - bob.vy) / dt : 0;
    // (the rise and fall felt smoothly, never as a jolt)
    bob.ay = (bob.ay ?? 0) + (clamp(ay0, -1600, 1600) - (bob.ay ?? 0)) * Math.min(1, dt * 14);
    const ay = bob.ay;
    const spin = dt > 0 ? (ha - bob.last) / dt : 0;
    // (its speeding up and slowing down, felt smoothly: setting off, the ears and the tail swing
    // back; stopping, they swing on forward and settle)
    const vx = (st.bnV ?? 0) + (dt > 0 ? (surge - (bob.sx ?? surge)) / dt : 0);
    bob.sx = surge;
    const ax0 = dt > 0 ? (vx - (bob.vx ?? vx)) / dt : 0;
    bob.vx = vx;
    bob.ax = (bob.ax ?? 0) + (clamp(ax0, -1600, 1600) - (bob.ax ?? 0)) * Math.min(1, dt * 10);
    const ax = bob.ax;
    bob.py = pivot[1];
    bob.vy = vy;
    bob.last = ha;
    // (the hop sweeps the ears back as it launches and flops them forward as it lands, the tips a
    // beat behind; hanging ears swing out and back)
    const sweep = (x) => (bump(x, push - 0.04, push + 0.3) * 16 - bump(x, 0.9, 1.2) * 13) * w * (1 + 0.5 * run);
    const swBase = sweep(u) * (E0.hang ? -0.7 : 1);
    const swTip = sweep(u - 0.06) * (E0.hang ? -0.9 : 1.3);
    const ears = {};
    for (const [side, i] of [['near', 0], ['far', 1]]) {
      const es = (st.bnEar ??= [{ a: 0, v: 0, b: 0, w: 0 }, { a: 0, v: 0, b: 0, w: 0 }])[i];
      const tw = (a.bnTwitch ?? [0, 0])[i];
      // (for upright ears `ears` + perks them up and forward, - lays them back along the back; for
      // hanging ears it lifts or flattens them a little)
      const lay = E0.hang ? S.ears * 14 : -Math.max(0, -S.ears) * 62 + Math.max(0, S.ears) * 6;
      const swivel = (a.bnSwivel ?? [0, 0])[i];
      const goal = (E0.ang + (side === 'far' ? -E0.spread : E0.spread * 0.4) + lay - tw * 14 + swivel - swBase) * D2R;
      const force = ay * 0.0016 * (E0.hang ? -1 : 1) + spin * 0.08 - ax * 0.0012;
      for (let n = 0; n < 2; n++) {
        es.v += (-es.a * 130 - es.v * 13 + force) * (dt / 2);
        es.a += es.v * (dt / 2);
        es.w += (-es.b * 95 - es.w * 10 + force * 1.5 - es.v * 2.5) * (dt / 2);
        es.b += es.w * (dt / 2);
      }
      es.a = clamp(es.a, -0.6, 0.6);
      es.b = clamp(es.b, -0.8, 0.8);
      const root = add(hp, rot(E0[side].map(sc), ha));
      const a1 = ha + goal + es.a;
      const a2 = a1 + (E0.bend * D2R) * (E0.hang ? 1 : -1) + es.b - (swTip - swBase) * D2R;
      const mid = add(root, [Math.cos(a1) * sc(E0.len[0]), Math.sin(a1) * sc(E0.len[0])]);
      const tip = add(mid, [Math.cos(a2) * sc(E0.len[1]), Math.sin(a2) * sc(E0.len[1])]);
      ears[side] = { root, mid, tip, a1, a2 };
    }
    // The tail: a puff on a spring, bouncing as it lands.
    const tl = (st.bnTail ??= { y: 0, v: 0, x: 0, u: 0 });
    tl.v += (-tl.y * 200 - tl.v * 13 + ay * 0.004) * dt;
    tl.y = clamp(tl.y + tl.v * dt, -sc(1.6), sc(1.6));
    tl.u += (-tl.x * 180 - tl.u * 13 - ax * 0.003) * dt;
    tl.x = clamp(tl.x + tl.u * dt, -sc(1.4), sc(1.4));
    const tail = add(bodyPt(P.tail.at), [tl.x, tl.y]);
    return { pivot, aL, aT, at, bodyPt, legs: Lg, nb, hp, ha, mouth, brow, jaw: clamp(S.jaw, 0, 1), ears, tail };
  }

  // ---------- Drawing ----------
  const colour = (a, c) => {
    const k = Math.min(0.85, (a.flash ?? 0) * 6);
    if (k <= 0) return c;
    const [r, g, b] = hexRgb(c);
    return `rgb(${Math.round(r + (255 - r) * k)},${Math.round(g + (255 - g) * k)},${Math.round(b + (255 - b) * k)})`;
  };
  const tint = (a, c, al) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = hexRgb(c);
    const f = (v) => Math.round(v + (255 - v) * k);
    return `rgba(${f(r)},${f(g)},${f(b)},${al})`;
  };
  const edge = (ctx) => {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const QD = legDrawer({ C, edge });
  const { tubePath, poly } = QD;
  const outline = ring(P.body, 4);
  const bodyPtsOf = (sk) => (sk.pts ??= outline.map(sk.bodyPt));
  const glow = (ctx, c, r, k, col) => {
    const [cr, cg, cb] = hexRgb(col);
    const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
    gr.addColorStop(0, `rgba(${cr},${cg},${cb},${k})`);
    gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
  };
  // A leg: the far ones under the body, the near ones over its side, grown out of it; a forepaw a
  // small round, a hind foot's toe end a soft round at the end of the long foot.
  function drawLeg(ctx, a, mode, k) {
    const sk = a.bk;
    const Lg = sk.legs[k];
    const far = k.endsWith('F');
    const pw = sc(P.paw.w) * (Lg.hind ? 1.08 : 1);
    const ph = sc(P.paw.h);
    const path = (c2, grow = 0) => {
      const [cx, cy] = add(Lg.P, rot([pw * 0.12, ph * 0.04], Lg.rot));
      c2.moveTo(cx + pw * 0.5 + grow, cy);
      c2.ellipse(cx, cy, pw * 0.5 + grow, ph * 0.5 + grow, Lg.rot, 0, TAU);
    };
    QD.drawLeg(ctx, mode, Lg, { far, colour: (c) => colour(a, c), tint: (c, al) => tint(a, c, al), bodyPts: far ? null : bodyPtsOf(sk), foot: { path }, unit: s * 0.9 });
  }
  // The body: the egg over its spine; the back lit along the top, the belly shaded softly between
  // the legs (fading out before them), a fluffy pale tuft on the chest, the haunch lit round.
  const topline = P.body.filter((p) => p[1] < -6);
  const hindJ1 = legDefs.hindN.rest[1][0];
  const foreJ1 = legDefs.foreN.rest[1][0];
  const bellyY = Math.max(...P.body.map((p) => p[1]));
  function drawBody(ctx, a, mode) {
    const sk = a.bk;
    const pts = bodyPtsOf(sk);
    poly(ctx, pts);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill();
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    for (const p of topline) glow(ctx, sk.bodyPt([p[0], p[1] + 3, p[2], p[3]]), sc(5.2), 0.3, C.lt);
    {
      const c = sk.at([(hindJ1 + foreJ1) / 2, bellyY + 1.2]);
      const rx = sc((foreJ1 - hindJ1) / 2 - 1.5);
      const ry = sc(5);
      ctx.save();
      ctx.translate(c[0], c[1]);
      ctx.rotate((sk.aL + sk.aT) / 2);
      ctx.scale(rx / ry, 1);
      const [sr, sg, sb] = hexRgb(C.sh);
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
      gr.addColorStop(0, `rgba(${sr},${sg},${sb},0.75)`);
      gr.addColorStop(0.5, `rgba(${sr},${sg},${sb},0.4)`);
      gr.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(-ry, -ry, ry * 2, ry * 2);
      ctx.restore();
    }
    // the chest's tuft: pale and fluffy, a few soft wisps
    const tuft = sk.at(P.tuft);
    glow(ctx, tuft, sc(4.8), 0.95, C.lt);
    ctx.strokeStyle = colour(a, C.lt);
    ctx.lineWidth = Math.max(0.5, sc(0.8));
    ctx.lineCap = 'round';
    for (const [dx, dy, ex, ey] of [[-1, 1.4, -0.4, 3.6], [0.6, 2, 1.2, 4], [1.8, 0.6, 2.8, 2.2]]) {
      ctx.beginPath();
      ctx.moveTo(...sk.at([P.tuft[0] + dx, P.tuft[1] + dy]));
      ctx.lineTo(...sk.at([P.tuft[0] + ex, P.tuft[1] + ey]));
      ctx.stroke();
    }
    const Lh = sk.legs.hindN;
    glow(ctx, add(lerp2(Lh.T, Lh.J1, 0.2), [-sc(1.6), -sc(1.4)]), sc(7.5), 0.45, C.lt);
    ctx.restore();
  }
  function drawNeck(ctx, a, mode) {
    const sk = a.bk;
    const pts = [sk.nb, lerp2(sk.nb, sk.hp, 0.5), sk.hp];
    const wl = pts.map(() => sc(P.neck.w));
    tubePath(ctx, pts, wl);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
  }
  // The head, in its own frame: the egg of the skull, the puffy cheeks, the round nose end, one shape.
  const E4 = (ctx, [x, y, rx, ry], g = 0) => {
    ctx.moveTo(sc(x + rx) + g, sc(y));
    ctx.ellipse(sc(x), sc(y), sc(rx) + g, sc(ry) + g, 0, 0, TAU);
  };
  function headPath(ctx) {
    const Hd = P.head;
    ctx.beginPath();
    E4(ctx, Hd.skull);
    E4(ctx, Hd.cheek);
    E4(ctx, Hd.muzzle);
  }
  function drawHead(ctx, a, mode) {
    const sk = a.bk;
    const Hd = P.head;
    ctx.save();
    ctx.translate(...sk.hp);
    ctx.rotate(sk.ha);
    headPath(ctx);
    if (mode === 'line') {
      edge(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
    ctx.save();
    headPath(ctx);
    ctx.clip('nonzero');
    const [, , srx, sry] = Hd.skull;
    const [cx, cy, crx, cry] = Hd.cheek;
    const [mx, my, mrx, mry] = Hd.muzzle;
    glow(ctx, [sc(-srx * 0.15), sc(-sry * 0.45)], sc(srx * 0.85), 0.95, C.lt);
    glow(ctx, [sc(cx + crx * 0.2), sc(cy)], sc(crx * 0.75), 0.75, C.lt);
    glow(ctx, [sc(mx), sc(my + mry * 0.2)], sc(mrx * 1.25), 0.9, C.lt);
    glow(ctx, [sc(cx - crx * 0.8), sc(cy + cry * 0.1)], sc(cry * 1.1), 0.5, C.sh);
    ctx.restore();
    // the nose (twitching now and then), the split lip, the whiskers, the soft line for the eyes
    const [nx, ny, nr] = Hd.nose;
    const wig = Math.sin(a.t * 24) * hold(a.t % 3.4, 0.3, 0.4, 1.2, 1.3) * 0.25;
    ctx.fillStyle = colour(a, C.nose);
    ctx.beginPath();
    ctx.ellipse(sc(nx - nr * 0.3), sc(ny + wig), sc(nr), sc(nr * 0.72), 0.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = colour(a, C.guide);
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(0.35, sc(0.45));
    const lipY = ny + nr * 0.6 + wig;
    ctx.beginPath();
    ctx.moveTo(sc(nx - nr * 0.5), sc(lipY));
    ctx.lineTo(sc(nx - nr * 0.7), sc(lipY + nr * 1.3));
    ctx.moveTo(sc(nx - nr * 0.7), sc(lipY + nr * 1.3));
    ctx.quadraticCurveTo(sc(nx - nr * 1.3), sc(lipY + nr * 2.1 + sk.jaw * 1.2), sc(nx - nr * 2), sc(lipY + nr * 1.6));
    ctx.moveTo(sc(nx - nr * 0.7), sc(lipY + nr * 1.3));
    ctx.quadraticCurveTo(sc(nx - nr * 0.3), sc(lipY + nr * 2.1 + sk.jaw * 1.2), sc(nx + nr * 0.2), sc(lipY + nr * 1.7));
    ctx.stroke();
    ctx.globalAlpha *= 0.6;
    for (let i = 0; i < (Hd.whiskers ?? 0); i++) {
      const y0 = my + mry * (-0.15 + i * 0.3);
      ctx.beginPath();
      ctx.moveTo(sc(mx + mrx * 0.2), sc(y0));
      ctx.quadraticCurveTo(sc(mx + mrx * 1.4), sc(y0 - 0.5 + i * 0.5), sc(mx + mrx * 2.2), sc(y0 - 0.2 + i * 1));
      ctx.stroke();
    }
    ctx.globalAlpha /= 0.6;
    ctx.beginPath();
    ctx.moveTo(sc(srx * 0.05), sc(-sry * 0.1));
    ctx.quadraticCurveTo(sc(srx * 0.42), sc(-sry * 0.24), sc(srx * 0.74), sc(-sry * 0.05));
    ctx.stroke();
    ctx.restore();
  }
  // An ear: a long soft leaf along its two pieces (narrow at the root, widest past the bend, a
  // round tip), pale inside.
  function earPts(e, scale = 1, inset = 0) {
    const E0 = P.ears;
    const [w0, w1, w2] = E0.w.map((v) => sc(v) * scale);
    const n1 = [-Math.sin(e.a1), Math.cos(e.a1)];
    const n2 = [-Math.sin(e.a2), Math.cos(e.a2)];
    const nm = [(n1[0] + n2[0]) / 2, (n1[1] + n2[1]) / 2];
    const d2 = [Math.cos(e.a2), Math.sin(e.a2)];
    const tipC = add(e.tip, d2.map((v) => -v * w2 * 0.45));
    const side = (sgn) => [
      add(lerp2(e.root, e.mid, 0.05), n1.map((v) => v * sgn * w0 / 2)),
      add(lerp2(e.root, e.mid, 0.6), n1.map((v) => v * sgn * lerp(w0, w1, 0.6) / 2)),
      add(e.mid, nm.map((v) => v * sgn * w1 / 2)),
      add(lerp2(e.mid, e.tip, 0.5), n2.map((v) => v * sgn * lerp(w1, w2, 0.5) / 2)),
      add(tipC, n2.map((v) => v * sgn * w2 / 2)),
    ];
    const L = side(1);
    const R = side(-1).reverse();
    const pts = [...L, add(e.tip, d2.map((v) => v * inset)), ...R];
    return ring(pts, 3);
  }
  function drawEar(ctx, a, mode, side) {
    const sk = a.bk;
    const e = sk.ears[side];
    const far = side === 'far';
    const outer = earPts(e);
    poly(ctx, outer);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, far ? C.sh : C.base);
    ctx.fill();
    if (P.ears.hang) {
      // (a hanging ear lies over the side of the head: a soft line just inside its edge and a shade
      // down its lower half, so it reads against the head)
      ctx.fillStyle = colour(a, far ? C.deep : C.sh);
      ctx.fill();
      poly(ctx, earPts(e, 0.84, -sc(0.7)));
      ctx.fillStyle = colour(a, far ? C.sh : C.base);
      ctx.fill();
    }
    // inside: pale, from just above the root
    const inner = earPts({ ...e, root: lerp2(e.root, e.mid, 0.25), tip: lerp2(e.mid, e.tip, 0.88) }, 0.5, -sc(0.4));
    poly(ctx, inner);
    ctx.fillStyle = colour(a, far ? C.deep : C.inner);
    ctx.fill();
    if (P.ears.tips) {
      // (a hare's dark ear tips)
      ctx.save();
      poly(ctx, outer);
      ctx.clip();
      const r = sc(P.ears.w[2]) * 1.25;
      const [tx, ty] = lerp2(e.mid, e.tip, 0.96);
      const gr = ctx.createRadialGradient(tx, ty, 0, tx, ty, r);
      const [dr, dg, db] = hexRgb(far ? '#9a8fb6' : C.deep);
      gr.addColorStop(0, `rgba(${dr},${dg},${db},0.95)`);
      gr.addColorStop(0.7, `rgba(${dr},${dg},${db},0.9)`);
      gr.addColorStop(1, `rgba(${dr},${dg},${db},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(tx - r, ty - r, r * 2, r * 2);
      ctx.restore();
    }
  }
  function drawTail(ctx, a, mode) {
    const sk = a.bk;
    const [x, y] = sk.tail;
    const r = sc(P.tail.r);
    // a puff: one round with three little tufts on its outer side
    const puffs = [[0, 0, r], [-r * 0.7, -r * 0.45, r * 0.55], [-r * 0.85, r * 0.25, r * 0.5], [-r * 0.2, -r * 0.82, r * 0.5]];
    ctx.beginPath();
    for (const [dx, dy, rr] of puffs) {
      ctx.moveTo(x + dx + rr, y + dy);
      ctx.arc(x + dx, y + dy, rr, 0, TAU);
    }
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
    glow(ctx, [x - r * 0.3, y - r * 0.3], r * 1.1, 0.95, C.lt);
  }

  // ---------- Effects: sparkles, stamp rings, dust, hearts, speed lines ----------
  const star = (ctx, x, y, r, an, fill) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? r * 0.32 : r;
      const q = an + (i * Math.PI) / 4;
      ctx.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const puffAt = (ctx, x, y, r, alpha) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f3eefa';
    ctx.strokeStyle = '#d6cbe6';
    ctx.lineWidth = Math.max(0.4, r * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
  };
  const heart = (ctx, x, y, r, fill) => {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.35);
    ctx.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9);
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const spot = (sk, what) => {
    if (what === 'mouth') return sk.mouth;
    if (what === 'brow') return sk.brow;
    if (what === 'head') return add(sk.hp, [0, -sc(P.head.skull[3]) * 1.3]);
    if (what === 'heels') return [lerp2(sk.legs.hindN.J2, sk.legs.hindN.P, 0.4)[0], -sc(1)];
    if (what === 'paws') return lerp2(sk.legs.foreN.P, sk.legs.foreF.P, 0.5);
    if (what === 'feet') return lerp2(sk.legs.hindN.P, sk.legs.foreN.P, 0.5);
    if (what === 'body') return add(sk.pivot, [0, sc(6)]);
    return sk.legs.foreN.P;
  };
  function drawFx(ctx, m, a) {
    const sk = a.bk;
    const mv = a.bnMove?.mv;
    const t = a.bnMove?.t ?? 0;
    if (!mv) return;
    ctx.save();
    for (const s0 of mv.spark ?? []) {
      const sp = since([s0], t, 0.22);
      if (sp < 0) continue;
      const [sx, sy] = spot(sk, mv.sparkAt);
      const e = 1 - (1 - sp) ** 3;
      ctx.globalAlpha = 1 - sp;
      star(ctx, sx, sy, H * 0.1 * (0.5 + 0.7 * e), sp * 0.8, '#ffffff');
      star(ctx, sx, sy, H * 0.05 * (0.5 + 0.7 * e), sp * 0.8 + 0.4, '#fff2a8');
      for (let i = 0; i < 4; i++) {
        const q = (i * TAU) / 4 + 0.6;
        star(ctx, sx + Math.cos(q) * H * 0.14 * e, sy + Math.sin(q) * H * 0.14 * e, H * 0.026, q, i % 2 ? '#ffc8de' : '#fff6c8');
      }
    }
    // a thump: a ring spreading along the ground from the heels
    for (const r0 of mv.rings ?? []) {
      const rp = since([r0], t, 0.35);
      if (rp < 0) continue;
      const [gx] = spot(sk, 'heels');
      ctx.globalAlpha = (1 - rp) * 0.8;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = sc(1.1) * (1 - rp * 0.6);
      ctx.beginPath();
      ctx.ellipse(gx, -sc(0.4), sc(3 + rp * 12), sc(1 + rp * 3), 0, 0, TAU);
      ctx.stroke();
    }
    for (const h0 of mv.hearts ?? []) {
      const hp = since([h0], t, 0.6);
      if (hp < 0) continue;
      const [hx, hy] = spot(sk, 'head');
      ctx.globalAlpha = 1 - hp;
      heart(ctx, hx - sc(3) - hp * sc(3), hy - hp * sc(8), sc(1.8), '#ffc8de');
      heart(ctx, hx + sc(3) + hp * sc(2), hy - sc(2) - hp * sc(10), sc(1.4), '#ffd9e8');
    }
    for (const [d0, where] of mv.dust ?? []) {
      const dp = since([d0], t, 0.4);
      if (dp < 0) continue;
      const [gx] = spot(sk, where);
      const e = 1 - (1 - dp) ** 2;
      for (let i = 0; i < 4; i++) {
        const dir = i < 2 ? -1 : 1;
        puffAt(ctx, gx + dir * sc(2 + (i % 2) * 3) * (0.4 + e), -sc(1 + (i % 2)) - e * sc(2.4), sc(1.3 + (i % 2) * 0.6) * (0.6 + 0.6 * e), (1 - dp) * 0.85);
      }
    }
    if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
      const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
      ctx.globalAlpha = 0.7 * (1 - k);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = sc(0.9);
      for (let i = 0; i < 3; i++) {
        const y = sk.pivot[1] + sc((i - 1) * 4);
        ctx.beginPath();
        ctx.moveTo(sk.pivot[0] - sc(15) - sc(6) * k, y);
        ctx.lineTo(sk.pivot[0] - sc(25) - sc(10) * k, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    if (m.act && BUNNY_MOVES[m.act.name]) {
      const mv = BUNNY_MOVES[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + lengthOf(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.bnAtk) {
        const pool = m.def.moves ?? POOL;
        st.bnN = (st.bnN ?? m.uid) + 1;
        st.bnPick = m.move ?? pool[st.bnN % pool.length];
      }
      st.bnAtk = true;
      const mv = BUNNY_MOVES[st.bnPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.bnAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lengthOf(BUNNY_MOVES.hurt)) return [BUNNY_MOVES.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < lengthOf(BUNNY_MOVES.binky)) return [BUNNY_MOVES.binky, gl, 1];
    return [null, 0, 0];
  }
  const live = (name, draw) => ({ name, draw });
  const seq = [
    live('hindF', (ctx, a, mode) => drawLeg(ctx, a, mode, 'hindF')),
    live('foreF', (ctx, a, mode) => drawLeg(ctx, a, mode, 'foreF')),
    live('earF', (ctx, a, mode) => drawEar(ctx, a, mode, 'far')),
    live('body', drawBody),
    live('tail', drawTail),
    live('hindN', (ctx, a, mode) => drawLeg(ctx, a, mode, 'hindN')),
    live('foreN', (ctx, a, mode) => drawLeg(ctx, a, mode, 'foreN')),
    live('neck', drawNeck),
    live('head', drawHead),
    live('earN', (ctx, a, mode) => drawEar(ctx, a, mode, 'near')),
  ];
  const parts = [...seq.map((p) => ({ name: p.name, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a) => p.draw(ctx, a, 'line') })), ...seq.map((p) => ({ name: `${p.name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a) => p.draw(ctx, a, 'fill') }))];
  const rig = makeRig({
    w: Math.ceil(bodyLen * 2.4 + sc(34)),
    h: Math.ceil(H * 1.4 + sc(earTall)),
    soft: true,
    stride,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, c === 'jaw' ? [420, 30] : c === 'neck' || c === 'head' || c === 'ears' ? [170, 23] : [170, 21]])),
    walkStiff: { x: [400, 36], lift: [900, 60], pitch: [400, 38], neck: [260, 28], head: [260, 28] },
    fast: CH.filter((c) => !['neck', 'head', 'ears'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.bnActive),
    kick: { pitch: -36, head: 40 },
    turnKick: { pitch: 14 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.1;
      const dt = Math.max(1e-3, a.dt);
      const odo = m.odo ?? 0;
      const raw = Math.min(400, Math.abs(odo - (st.bnOdo ?? odo)) / dt);
      st.bnOdo = odo;
      st.bnV = (st.bnV ?? 0) + (raw - (st.bnV ?? 0)) * Math.min(1, dt * 5);
      const v = st.bnV;
      const runGoal = a.moving ? clamp((v - walkSpeed * 1.3) / (walkSpeed * 0.6), 0, 1) : 0;
      st.bnRun = (st.bnRun ?? 0) + (runGoal - (st.bnRun ?? 0)) * Math.min(1, dt * 4);
      st.bnU = ((st.bnU ?? 0) + (v / cycle(st.bnRun)) * dt) % 1;
      // Sitting about: breathing quick and light, a slow look round now and then, each ear turning
      // on its own, the nose twitching (drawn), now and then sitting up to look.
      const breath = Math.sin(t * 2.6);
      const rnd = (n) => {
        const q = Math.sin(n * 12.9898 + (m.uid % 97) * 78.233) * 43758.5453;
        return q - Math.floor(q);
      };
      const blk = Math.floor(t / 4.6);
      const turn = smoothstep(((t / 4.6) % 1) / 0.2);
      const look = lerp(rnd(blk - 1), rnd(blk), turn) * 2 - 1;
      a.bnTwitch = [hold(t % 5.1, 2, 2.06, 2.14, 2.36), hold(t % 6.7, 3.1, 3.16, 3.24, 3.46)];
      // (each ear turning on its own, listening: a new way every few seconds, eased round to it)
      const ear = (i, per) => {
        const b2 = Math.floor(t / per);
        return lerp(rnd(b2 * 3 + i * 17 - 3), rnd(b2 * 3 + i * 17), smoothstep(((t / per) % 1) / 0.25)) * 2 - 1;
      };
      a.bnSwivel = [ear(0, 3.3) * 14, ear(1, 4.1) * 16];
      // (now and then it sits up a little to look round, ears up, then settles)
      const peek = hold(t % 11, 6, 6.6, 8.2, 8.9);
      const idle = {
        x: 0, lift: breath * 0.12, hop: 0, pitch: -peek * 6, hunch: 4 + breath * 0.6 - peek * 6, crouch: 0, sit: peek * 0.35, lie: 0, loaf: 0, fly: 0, kick: 0, stamp: 0, paws: 0,
        neck: look * 3 - peek * 8, head: look * 3 + peek * 4, jaw: 0, ears: 0.3 + peek * 0.5,
      };
      const r = st.bnRun;
      const walk = { ...idle, pitch: 0, sit: 0, hunch: 0, neck: -2, head: 2, ears: 0.15 - r * 0.45 };
      const [mv, mt, anticW] = moveNow(m, a, st);
      const base = {};
      for (const c of CH) base[c] = idle[c] * (1 - a.walkW) + walk[c] * a.walkW;
      base.x /= H;
      base.hop /= H;
      const out = mv ? poseAt(mv, mt, anticW, base) : { ...base };
      if (m.pose === 'sit') Object.assign(out, { sit: 1, paws: 1, neck: -10, head: 2, ears: 0.6, hunch: 0 });
      else if (m.pose === 'loaf') Object.assign(out, { loaf: 1, neck: 2, head: 4, ears: -0.2, hunch: 10 });
      else if (m.pose === 'lie') Object.assign(out, { lie: 1, neck: 4, head: 8, ears: -0.6, hunch: -4 });
      if (m.hp <= 0) Object.assign(out, { lie: 1, neck: 8, head: 14, ears: -1, jaw: 0.1 });
      st.bnActive = Boolean(mv);
      a.bnMove = mv ? { mv, t: mt } : null;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = out.x * H;
      res.hop = out.hop * H;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.bk = skeleton(S, a);
    },
    parts,
    fx: (ctx, m, a) => drawFx(ctx, m, a),
  });
  const still = () => ({ w: Math.ceil(bodyLen * 2.4 + sc(34)), h: Math.ceil(H * 1.4 + sc(earTall)), res: 3, shapes: [E(bodyLen * 1.2, H * 1.4 + sc(earTall) - hb, bodyLen * 0.5, sc(8.5), C.base), E(bodyLen * 1.2 + sc(10), H * 1.4 + sc(earTall) - hb - sc(14), sc(P.head.skull[2]), sc(P.head.skull[3]), C.base)] });
  return { rig, still, stride, speed: walkSpeed, H: H + sc(earTall * 0.6), w: Math.round(bodyLen * 1.4), h: Math.round(H * 1.1), moves: P.moves };
}

export const BUNNY_ARTS = {};
export const BUNNY_DEFS = {};
for (const kind of BUNNY_KINDS) {
  const r = bunnyRig(kind);
  BUNNY_ARTS[`blank_${kind}`] = { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig };
  BUNNY_DEFS[kind] = { id: `blank_${kind}`, name: `Blank ${kind}`, art: `blank_${kind}`, w: r.w, h: r.h, speed: r.speed, hp: 100, fight: { windup: 0.5 }, bodyH: r.H, beast: true, moves: r.moves };
}
