// The cat base (2026-11-23, the player: "NEVER reuse another base when making a new one, that
// defeats the purpose ... redo this to be perfect"): a blank chibi cat made for a cat from the
// start, nothing carried over from the dog base; only the engine is shared (rig.js's springs, and
// blankquad.js's three-bone leg joints, drawn so a leg never shows on the body it comes out of).
// Drawn live like the other blank bases: one smooth shape over its bones, outlined only on its
// outer edge.
//
// The body, side on, facing right:
//   spine   two bones from the middle of the back: the lumbar (to the hips) and the thoracic (to
//           the shoulders), each turning on its own, so it arches (`arch`: the middle up, as when
//           it hisses), flattens, lifts its rump (`hipLift`), and sits truly upright (`sit`: the
//           hips down on the haunches, the chest straight up, worked out for each cat so its
//           forepaws always reach the ground); the shoulder blades roll up on the topline as each
//           forepaw takes the weight
//   body    compact and supple: a round chest, a tucked waist, a full round haunch; the bottom of
//           the chest follows the forelegs' upper arms and the haunch the thighs; a soft bib, the
//           back lit, the belly shaded between the legs
//   legs    a cat's: slim straight forelegs on small round paws, the elbow tucked back; hind legs
//           with a long foot from a hock set well behind; a lateral walk (hind, then the fore on
//           the same side), each paw lifted high and set down neatly, the forepaw curling under as
//           it swings; galloping, the back flexes, gathered and stretched in turn
//   head    big and round: the skull, full cheeks (the ruff), a small muzzle and chin, a little
//           nose, a soft 'w' of a mouth, a few faint whiskers, a soft line where the eyes go;
//           held level as the body moves; upright triangular ears on springs (forward, up, flat
//           back), each twitching on its own; the jaw opens to hiss and bite
//   tail    a long even tail, a chain of springs: held up in a question mark (its tip hooked),
//           swaying slowly, the tip flicking now and then; streaming back as it runs; bottle-
//           brushed (`puff`) when it hisses
// Presets: a house cat; a tiger cub (chunky, big paws, small round ears, a thick tail hung low,
// its tip curling up); a lynx (long legs, big paws, tall tufted ears, a full ruff, a bobtail).
// Moves (CAT_MOVES): a double paw swipe (claw marks), a stalk (crouched flat, the hips shifting,
// then the pounce), a hiss (arched back, up on its toes, the tail bottle-brushed), a bite, jump,
// dash, dodge, hurt, knockdown; a big stretch and a yawn when pleased. Poses (m.pose): sit, loaf
// (every paw tucked under), lie (a sphinx), groom (sitting, licking a forepaw).

import { makeRig, clamp, TAU } from './rig.js';
import { hold } from './kidrig.js';
import { E } from './kit.js';
import { OUTLINE, sprite } from '../pixel.js';
import { legDefs as legDefsOf, placeLeg, legDrawer } from './blankquad.js';

const D2R = Math.PI / 180;
const C = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299' };
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
// (a smooth closed curve through points, every number each point carries eased along with it)
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

// ---------- The cats (units: game px at scale 1, about the middle of the back; x forward, y down) ----------
// body: its outline round from the top of the neck, back over the back and round the rump, along
// the belly and up the chest: [x, y, follows the near foreleg's upper arm, follows the near thigh,
// lifts with the shoulder blade].
const HOUSE = {
  name: 'Cat',
  scale: 1,
  body: [
    [9, -6.8, 0, 0, 0.5], [4.8, -8.2, 0, 0, 1], [0, -7.9, 0, 0, 0.3], [-4.8, -7.6, 0, 0, 0], [-9, -7.8, 0, 0.1, 0], [-12.2, -6, 0, 0.3, 0],
    [-13.8, -2.2, 0, 0.55, 0], [-13.4, 2.4, 0, 0.8, 0], [-11, 5.6, 0, 0.85, 0], [-7.2, 6, 0, 0.35, 0], [-3, 4.8, 0, 0, 0], [1.4, 5.6, 0, 0, 0],
    [5.4, 6.6, 0.45, 0, 0], [8.8, 5.4, 0.75, 0, 0], [11.2, 2.2, 0.3, 0, 0], [11.4, -1.8, 0, 0, 0], [10.4, -4.8, 0, 0, 0],
  ],
  bib: [9.2, 2.6, 4.2],
  fore: { top: [6.4, 0.4], bones: [[-1.3, 5.2], [0.4, 5.4], [0.6, 2.4]], w: [6.4, 4.4, 3.1, 2.9] },
  hind: { top: [-8.8, -1.2], bones: [[3.6, 5.6], [-4.6, 4.6], [0.6, 4.6]], w: [9.8, 5.8, 3.3, 2.9] },
  far: [-1.6, -0.6],
  paw: { w: 4.2, h: 2.5, up: 1, toes: true },
  neck: { base: [8.8, -4.4], len: 4.6, w: 6.2, ang: -64 },
  head: {
    skull: [0, 0, 9.6, 8.8],
    cheek: [-1.8, 3.6, 7.4, 5.4],
    muzzle: [7.4, 3, 3.3, 2.6],
    chin: [5.8, 5.4, 2.3, 1.5],
    nose: [9.9, 1.5, 1.2],
    whiskers: 3,
  },
  ears: { kind: 'tri', near: [0.4, -7.4], far: [-3.6, -6.9], w: 7.2, h: 8.4, tilt: 0.16 },
  tail: { root: [-12.8, -4.6], n: 8, seg: 2.9, w: [3.3, 2.6], base: -112, curl0: -2, curl1: 34, tip: 0 },
  sit: { lumbar: 22, chest: 66 },
  moves: ['swipe', 'stalk', 'bite'],
};
const TIGERCUB = {
  name: 'Tiger cub',
  scale: 1.04,
  body: [
    [9.2, -7.6, 0, 0, 0.5], [4.8, -9.2, 0, 0, 1], [0, -8.9, 0, 0, 0.3], [-4.8, -8.6, 0, 0, 0], [-9, -8.6, 0, 0.1, 0], [-12.6, -6.6, 0, 0.3, 0],
    [-14.4, -2.4, 0, 0.55, 0], [-14, 2.8, 0, 0.8, 0], [-11.4, 6.6, 0, 0.85, 0], [-7.2, 7.2, 0, 0.35, 0], [-3, 6.2, 0, 0, 0], [1.4, 6.8, 0, 0, 0],
    [5.6, 7.6, 0.45, 0, 0], [9.2, 6.2, 0.75, 0, 0], [11.8, 2.6, 0.3, 0, 0], [12, -2, 0, 0, 0], [10.8, -5.4, 0, 0, 0],
  ],
  bib: [9.6, 3, 4.8],
  fore: { top: [6.8, 0.6], bones: [[-1.4, 5.4], [0.4, 5.2], [0.6, 2.2]], w: [8.2, 5.8, 4.4, 4] },
  hind: { top: [-9.2, -1.2], bones: [[3.8, 5.8], [-4.8, 4.4], [0.6, 4.4]], w: [12, 7.2, 4.6, 4] },
  far: [-1.8, -0.6],
  paw: { w: 6, h: 3.3, up: 1.4, toes: true },
  neck: { base: [9.2, -4.8], len: 4.6, w: 7.6, ang: -62 },
  head: {
    skull: [0, 0, 10.6, 9.8],
    cheek: [-1.6, 4, 8.6, 6.2],
    muzzle: [8, 3.4, 4, 3.2],
    chin: [6.2, 6, 2.8, 1.8],
    nose: [11, 1.8, 1.6],
    whiskers: 3,
  },
  ears: { kind: 'round', near: [-0.6, -8.4], far: [-4.4, -7.8], w: 6.4, h: 5.4, tilt: 0 },
  tail: { root: [-13.4, -4.8], n: 6, seg: 3.4, w: [4.6, 3.8], base: 112, curl0: 4, curl1: 46, tip: 0.18 },
  sit: { lumbar: 24, chest: 62 },
  moves: ['swipe', 'stalk', 'bite'],
};
const LYNX = {
  name: 'Lynx',
  scale: 1,
  body: [
    [9, -7.2, 0, 0, 0.5], [4.6, -8.8, 0, 0, 1], [0, -8.4, 0, 0, 0.3], [-4.4, -8, 0, 0, 0], [-8.4, -8.2, 0, 0.1, 0], [-11.6, -6.4, 0, 0.3, 0],
    [-13, -2.4, 0, 0.55, 0], [-12.6, 2.4, 0, 0.8, 0], [-10.4, 5.8, 0, 0.85, 0], [-6.8, 6.2, 0, 0.35, 0], [-2.6, 5, 0, 0, 0], [1.6, 5.8, 0, 0, 0],
    [5.6, 7, 0.45, 0, 0], [9, 5.8, 0.75, 0, 0], [11.4, 2.4, 0.3, 0, 0], [11.6, -1.8, 0, 0, 0], [10.6, -5.2, 0, 0, 0],
  ],
  bib: [9.4, 3, 4.6],
  fore: { top: [6.6, 0.4], bones: [[-1.4, 6], [0.5, 6.6], [0.7, 2.8]], w: [7, 4.8, 3.4, 3.4] },
  hind: { top: [-8.4, -1.2], bones: [[3.8, 6.6], [-5.2, 5.4], [0.7, 5.6]], w: [10.4, 6.2, 3.6, 3.4] },
  far: [-1.6, -0.6],
  paw: { w: 5.6, h: 3, up: 1.2, toes: true },
  neck: { base: [8.8, -4.6], len: 5, w: 6.6, ang: -64 },
  head: {
    skull: [0, 0, 9.4, 8.6],
    cheek: [-1.8, 4.2, 8.4, 6.4],
    ruff: true,
    muzzle: [7.4, 3, 3.4, 2.7],
    chin: [5.8, 5.6, 2.4, 1.6],
    nose: [9.9, 1.6, 1.25],
    whiskers: 2,
  },
  ears: { kind: 'tuft', near: [0.2, -7.2], far: [-3.6, -6.8], w: 6.8, h: 10, tilt: 0.1 },
  tail: { root: [-12.2, -5], n: 2, seg: 2.6, w: [4.4, 3.8], base: -128, curl0: 10, curl1: 10, tip: 0.45 },
  sit: { lumbar: 26, chest: 70 },
  moves: ['swipe', 'stalk', 'bite'],
};
export const CAT_PRESETS = { cat: HOUSE, tigercub: TIGERCUB, lynx: LYNX };
export const CAT_KINDS = ['cat', 'tigercub', 'lynx'];

// ---------- The cat moves (units: x, hop in body heights; lift in px; fp in foreleg lengths; angles in degrees) ----------
// pitch: + nose down; arch: + the middle of the back up; hipLift: + the rump up.
export const CAT_MOVES = {
  swipe: {
    anticT: 0.15,
    keys: [
      [0, { pitch: -9, crouch: 0.1, fpX: -0.15, fpY: 1.15, ears: -0.4, neck: -4, flick: 0.6 }],
      [0.06, { pitch: 4, x: 0.05, fpX: 0.85, fpY: 0.3, ears: -0.8, jaw: 0.35, flick: 0.6 }, 'out'],
      [0.15, { pitch: -7, x: 0.03, fpX: -0.1, fpY: 1.05, ears: -0.7, jaw: 0.15 }, 'io'],
      [0.22, { pitch: 5, x: 0.08, fpX: 0.95, fpY: 0.2, ears: -0.9, jaw: 0.5 }, 'out'],
      [0.42, { pitch: 2, x: 0.05, fpX: 0.5, fpY: 0.08, ears: -0.3 }],
      [0.64, {}],
    ],
    claws: [0.06, 0.22],
  },
  stalk: {
    anticT: 0.25,
    keys: [
      [0, { x: -0.04, crouch: 0.95, arch: -8, pitch: 4, neck: 18, head: -14, ears: 0.7, tailDrop: 0.45, flick: 1 }],
      [0.1, { x: -0.03, crouch: 0.95, arch: -8, hipLift: 9, pitch: 4, neck: 18, head: -14, ears: 0.7, tailDrop: 0.45, flick: 1 }, 'io'],
      [0.2, { x: -0.05, crouch: 0.95, arch: -8, hipLift: 2, pitch: 4, neck: 18, head: -14, ears: 0.7, tailDrop: 0.45, flick: 1 }, 'io'],
      [0.3, { x: -0.03, crouch: 0.95, arch: -8, hipLift: 9, pitch: 4, neck: 18, head: -14, ears: 0.7, tailDrop: 0.45, flick: 1 }, 'io'],
      [0.42, { x: -0.06, crouch: 1, arch: -6, hipLift: 3, pitch: 5, neck: 18, head: -14, ears: 0.8, tailDrop: 0.4, flick: 0.3 }, 'io'],
      [0.56, { x: 0.32, hop: 0.48, crouch: 0, arch: -16, pitch: -12, neck: -10, head: -4, ears: -0.4, tailDrop: 0.2, tailUp: -40, fly: 1, jaw: 0.5, flick: 0 }, 'out'],
      [0.74, { x: 0.46, hop: 0.12, arch: 4, pitch: 10, neck: -2, fly: 0.4, jaw: 0.3 }, 'in'],
      [0.84, { x: 0.48, hop: 0, crouch: 0.55, arch: 6, pitch: 5, neck: 6, ears: 0.3, jaw: 0 }, 'in'],
      [1.2, {}],
    ],
    spark: [0.83],
    sparkAt: 'paws',
    dust: [[0.56, 'feet'], [0.84, 'paws']],
  },
  hiss: {
    anticT: 0.14,
    keys: [
      [0, { x: -0.02, crouch: 0.25, arch: 8, ears: -0.6, tailRaise: 0.5, puff: 0.4 }],
      [0.14, { x: -0.05, lift: 1.4, arch: 44, neck: 18, head: -12, ears: -1, jaw: 0.95, tailRaise: 1, tailCurl: -30, puff: 1 }, 'out'],
      [0.74, { x: -0.05, lift: 1.4, arch: 44, neck: 18, head: -12, ears: -1, jaw: 0.8, tailRaise: 1, tailCurl: -30, puff: 1 }],
      [1.02, {}],
    ],
    spark: [0.16],
    sparkAt: 'mouth',
    hiss: [0.14, 0.74],
  },
  bite: {
    anticT: 0.2,
    keys: [
      [0, { x: -0.06, crouch: 0.35, pitch: 4, neck: 12, head: 6, ears: -0.3, jaw: 0.2 }],
      [0.07, { x: 0.11, crouch: 0, pitch: -3, neck: -12, head: -6, ears: -0.6, jaw: 1 }, 'out'],
      [0.13, { x: 0.12, pitch: -2, neck: -10, head: -2, ears: -0.5, jaw: 0 }, 'out'],
      [0.32, { x: 0.1, neck: -6, ears: 0, jaw: 0.05 }],
      [0.56, {}],
    ],
    spark: [0.13],
    sparkAt: 'mouth',
  },
  jump: {
    anticT: 0.16,
    keys: [
      [0, { crouch: 0.7, pitch: 3, arch: -4, ears: 0.5 }],
      [0.16, { hop: 0.62, crouch: 0, pitch: -10, arch: -10, ears: -0.3, tailUp: -30, fly: 0.5 }, 'out'],
      [0.32, { hop: 0.68, pitch: 0, arch: 8, ears: 0, tailUp: -20 }, 'out'],
      [0.5, { hop: 0.03, pitch: 8, arch: 4, ears: 0.2 }, 'in'],
      [0.56, { crouch: 0.5, pitch: 3 }, 'out'],
      [0.86, {}],
    ],
    dust: [[0, 'feet'], [0.54, 'paws']],
  },
  dash: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.35, arch: -4 }],
      [0.08, { x: 0.2, crouch: 0.2, pitch: -4, arch: -12, neck: -8, ears: -1, tailUp: -45, fly: 0.7 }, 'out'],
      [0.3, { x: 0.24, crouch: 0.15, pitch: -3, arch: -8, neck: -8, ears: -1, tailUp: -45, fly: 0.5 }],
      [0.62, {}],
    ],
    lines: [0, 0.32],
    dust: [[0.02, 'feet']],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.35 }],
      [0.12, { hop: 0.26, x: -0.22, pitch: -12, arch: 22, neck: 4, head: -6, ears: -0.9, tailRaise: 0.7, puff: 0.5 }, 'out'],
      [0.3, { x: -0.26, crouch: 0.4, pitch: 2, arch: 6, ears: -0.4, puff: 0.2 }, 'in'],
      [0.64, {}],
    ],
    dust: [[0.3, 'feet']],
  },
  hurt: {
    anticT: 0,
    keys: [[0, {}], [0.05, { x: -0.05, pitch: -6, arch: 14, neck: 10, head: -10, ears: -1, crouch: 0.3, tailDrop: 0.7, jaw: 0.4, puff: 0.4 }, 'out'], [0.2, { x: -0.05, pitch: -4, arch: 10, neck: 8, head: -8, ears: -1, crouch: 0.25, tailDrop: 0.6, jaw: 0.2, puff: 0.3 }], [0.56, {}]],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.1, { x: -0.06, pitch: -10, head: -12, ears: -1, tailDrop: 0.6, jaw: 0.4, puff: 0.4 }, 'out'],
      [0.38, { lie: 1, x: -0.08, neck: 12, head: 14, ears: -1, tailDrop: 0.9, jaw: 0.1 }, 'in'],
      [0.46, { lie: 0.94, x: -0.08, neck: 10, head: 10, ears: -1, tailDrop: 0.9 }, 'out'],
      [1.05, { lie: 1, x: -0.08, neck: 14, head: 16, ears: -0.9, tailDrop: 0.9 }],
      [1.32, { crouch: 0.4, x: -0.04, ears: 0.2 }],
      [1.6, {}],
    ],
    dust: [[0.38, 'body']],
  },
  // Pleased: a long stretch, the forepaws reaching out along the ground, the rump up, the tail up,
  // and a big yawn.
  stretch: {
    anticT: 0.2,
    keys: [
      [0, { crouch: 0.2, ears: 0.2 }],
      [0.3, { reach: 1, pitch: 10, hipLift: 12, arch: -10, neck: -6, head: -16, jaw: 0.95, ears: -0.5, tailRaise: 0.6 }, 'io'],
      [0.75, { reach: 1, pitch: 10, hipLift: 12, arch: -10, neck: -6, head: -16, jaw: 0.9, ears: -0.5, tailRaise: 0.6 }],
      [1.05, { jaw: 0 }, 'io'],
      [1.3, {}],
    ],
  },
};
export const CAT_SHOW = ['swipe', 'stalk', 'hiss', 'bite', 'jump', 'dash', 'dodge', 'hurt', 'knockdown', 'stretch'];
const POOL = ['swipe', 'stalk', 'bite'];
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

const CH = ['x', 'lift', 'hop', 'pitch', 'arch', 'hipLift', 'crouch', 'sit', 'lie', 'loaf', 'groom', 'reach', 'fly', 'neck', 'head', 'jaw', 'ears', 'tailUp', 'tailRaise', 'tailDrop', 'tailCurl', 'puff', 'flick', 'fpX', 'fpY'];
const EMPTY = () => sprite('rig|blankempty', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// ---------- A cat's walk: when each paw steps (a share of the stride), how it moves, how its foot slants ----------
// (a lateral walk: a hind paw, then the forepaw on the same side; trotting in diagonal pairs; a
// galloping bound: the hinds together, then the fores)
const WALK = { hindN: 0, foreN: 0.22, hindF: 0.5, foreF: 0.72 };
const TROT = { hindN: 0, foreF: 0, hindF: 0.5, foreN: 0.5 };
const BOUND = { hindN: 0, hindF: 0.06, foreN: 0.46, foreF: 0.52 };
const phaseOf = (k, trot, run) => WALK[k] * (1 - trot) * (1 - run) + TROT[k] * trot * (1 - run) + BOUND[k] * run;
// A paw at phase u (+ ph): planted for less of the stride the faster it goes; a high, neat lift.
function pawAt(u, ph, r, cyc, LF) {
  const duty = 0.62 - 0.26 * r;
  const reach = (cyc * duty) / 2;
  const q = (((u + ph) % 1) + 1) % 1;
  if (q < duty) {
    const t = q / duty;
    return { dx: reach - 2 * reach * t, lift: 0, s: t, v: -1 };
  }
  const v = (q - duty) / (1 - duty);
  return { dx: -reach + 2 * reach * smoothstep(v), lift: LF * (0.26 + 0.18 * r) * Math.sin(Math.PI * v) ** 0.8, s: -1, v };
}
// The slant of a leg's lowest bone: planted, it tips back as the body goes over; a forepaw's wrist
// curls it right under as it swings, then reaches it out to land; a hind foot flexes at the hock.
function footAngle(L, g) {
  const r0 = L.a3;
  if (g.v < 0) return r0 + lerp(0.14, -0.42, g.s);
  const v = g.v;
  if (!L.hind) return v < 0.45 ? lerp(r0 - 0.42, -2.1, smoothstep(v / 0.45)) : lerp(-2.1, r0 + 0.22, smoothstep((v - 0.45) / 0.55));
  return v < 0.4 ? lerp(r0 - 0.42, -1.2, smoothstep(v / 0.4)) : lerp(-1.2, r0 + 0.12, smoothstep((v - 0.4) / 0.6));
}

// ---------- One rig for a preset ----------
function catRig(kind) {
  const P = CAT_PRESETS[kind];
  const s = P.scale;
  const sc = (v) => v * s;
  const legDefs = legDefsOf(P, sc);
  const hb = sc((legDefs.foreN.rest[3][1] + legDefs.hindN.rest[3][1]) / 2 + P.paw.up);
  const xs = P.body.map((p) => p[0]);
  const bodyLen = sc(Math.max(...xs) - Math.min(...xs));
  const H = hb + sc(-Math.min(...P.body.map((p) => p[1])) + P.neck.len * 0.8 + P.head.skull[3] * 1.7);
  const LF = legDefs.foreN.lens.reduce((x, y) => x + y, 0);
  const LH = legDefs.hindN.lens.reduce((x, y) => x + y, 0);
  const stride = LF * 1.2;
  const walkSpeed = stride * 1.45;
  const cycle = (r) => stride * (1 + 0.8 * r);
  // (the spine: points behind the middle turn with the lumbar bone, ahead of it with the
  // thoracic, blended across the waist)
  const kOf = (x) => smoothstep((x + 4) / 8);
  const spineAt = (p, aL, aT) => {
    const k = kOf(p[0]);
    return add(rot(p, aL).map((v) => v * (1 - k)), rot(p, aT).map((v) => v * k));
  };
  // How it sits, worked out once: the lumbar tipped back so the haunch rests on the ground, the
  // chest as upright as the preset wants but never so high its forepaws can't reach the ground.
  const SIT = (() => {
    const aL = -P.sit.lumbar * D2R;
    let aT = -P.sit.chest * D2R;
    const back = P.body.filter((p) => p[0] < -3);
    const hM = Math.max(...back.map((p) => spineAt(p, aL, aT)[1])) + 0.15;
    const reach = (legDefs.foreN.reach / s) * 0.96 + P.paw.up;
    for (let i = 0; i < 60; i++) {
      const sh = spineAt(P.fore.top, aL, aT);
      if (hM - sh[1] <= reach) break;
      aT += 1.2 * D2R;
    }
    return { aL, aT, hM };
  })();
  // How low it lies: its belly on the ground.
  const LIE_H = Math.max(...P.body.map((p) => p[1])) * 0.92;

  function skeleton(S, a) {
    const t = a.t;
    const w = a.walkW ?? 0;
    const st = a.mo.rig;
    const run = st.ctRun ?? 0;
    const trot = st.ctTrot ?? 0;
    const u = st.ctU ?? 0;
    const sit = clamp(S.sit, 0, 1);
    const down = clamp(Math.max(S.lie, S.loaf), 0, 1);
    // The step: each paw's place; how low each end is held by its legs slanting; the shoulder blades.
    const steps = {};
    let fS = 0;
    let hS = 0;
    let any = false;
    let scap = 0;
    for (const [k, L] of Object.entries(legDefs)) {
      const g = pawAt(u, phaseOf(k, trot, run), run, cycle(run), LF);
      steps[k] = g;
      if (g.v >= 0) continue;
      any = true;
      const sink = L.reach - Math.sqrt(Math.max(0, L.reach * L.reach - g.dx * g.dx));
      if (L.hind) hS = Math.max(hS, sink);
      else {
        fS = Math.max(fS, sink);
        scap = Math.max(scap, Math.sin(Math.PI * g.s));
      }
    }
    const float = any ? 0 : LF * 0.08 * run;
    const rock = Math.atan2((fS - hS) * w, bodyLen * 1.5);
    // The spine's two bones: the body's tip, the arch, the rump lifted, the gallop's flex (gathered,
    // stretched); then sitting and lying.
    const flex = Math.sin(TAU * u + 0.6) * 9 * run * w;
    let aL = (S.pitch - S.arch / 2 + S.hipLift - flex / 2) * D2R + rock;
    let aT = (S.pitch + S.arch / 2 + flex / 2) * D2R + rock;
    aL = lerp(aL, SIT.aL, sit);
    aT = lerp(aT, SIT.aT, sit);
    aL = lerp(aL, 0, down);
    aT = lerp(aT, 0, down);
    let pH = hb + S.lift - clamp(S.crouch, 0, 1.2) * hb * 0.34;
    pH = lerp(pH, sc(SIT.hM), sit);
    pH = lerp(pH, sc(LIE_H), down);
    const pivot = [S.x, -pH - S.hop + ((fS + hS) * 0.35 - float) * w];
    const at = (p) => add(pivot, spineAt([sc(p[0]), sc(p[1])], aL, aT));
    // The neck and the head, on the chest, the head held level as the body moves.
    const nb = at(P.neck.base);
    const na = aT * 0.55 + (P.neck.ang + S.neck) * D2R;
    const hp = add(nb, [Math.cos(na) * sc(P.neck.len), Math.sin(na) * sc(P.neck.len)]);
    const ha = aT * 0.3 + (S.head + S.neck * 0.35) * D2R + Math.sin(TAU * 2 * u - 1) * 1.2 * w * D2R;
    const H0 = P.head;
    const mouth = add(hp, rot([sc(H0.muzzle[0]), sc(H0.muzzle[1] + H0.muzzle[3] * 0.8)], ha));
    // Each leg: its paw's place (the step, or a pose), its foot's slant, then its upper bones.
    const tuck = clamp(S.hop / (hb * 0.5), 0, 1) * (1 - clamp(S.fly, 0, 1));
    const ground = -sc(P.paw.up);
    const Lg = {};
    for (const [k, L] of Object.entries(legDefs)) {
      const g = steps[k];
      // (the shoulder blade slides along the ribs with the foreleg's swing)
      const T = at(L.hind ? L.top : [L.top[0] + (g.dx / s) * 0.05 * w, L.top[1]]);
      let paw = [sc(L.rest[3][0]) + S.x * 0.35 * (1 - w) + g.dx * w, ground - g.lift * w - S.hop];
      let a3 = lerp(L.a3, footAngle(L, g), w);
      const to = (q, ang, k2) => {
        if (!(k2 > 0)) return;
        paw = lerp2(paw, q, k2);
        a3 = lerp(a3, ang, k2);
      };
      const near = k === 'foreN';
      if (near && (S.fpX || S.fpY)) {
        paw = add(paw, [S.fpX * LF, -S.fpY * LF]);
        a3 = lerp(a3, 0.7, clamp(S.fpY, 0, 1));
      }
      to(add(T, L.hind ? [-LH * 0.82, LH * 0.34] : [LF * 0.92, LF * 0.34]), L.hind ? -1.2 : 0.8, clamp(S.fly, 0, 1));
      to(add(T, L.hind ? [LH * 0.1, LH * 0.42] : [LF * 0.12, LF * 0.48]), L.hind ? -1.0 : -2.1, tuck);
      to([T[0] + LF * 0.95, ground], 1.45, L.hind ? 0 : clamp(S.reach, 0, 1));
      to(L.hind ? [T[0] + LH * 0.32, ground] : [T[0] + LF * 0.85, ground], L.hind ? 1.45 : 1.42, clamp(S.lie, 0, 1));
      to(L.hind ? [T[0] + LH * 0.3, ground] : [T[0] + LF * 0.1, ground], L.hind ? 1.45 : -2.2, clamp(S.loaf, 0, 1));
      to(L.hind ? [T[0] + LH * 0.42, ground] : [T[0] + LF * 0.04, ground], L.hind ? 1.35 : L.a3, sit);
      // (grooming: the near forepaw up to its mouth)
      if (near) to(add(mouth, [-sc(1.2), sc(1.4)]), -1.7, clamp(S.groom, 0, 1));
      const bones = placeLeg(L, T, paw, a3);
      const flat = g.v < 0 && Math.max(sit, down, tuck) < 0.5 ? 0.22 : 0.62;
      Lg[k] = { hind: L.hind, ...bones, rot: (a3 - L.a3) * flat, w: L.w };
    }
    // The outline: each point on the spine, near the near legs following their upper bones, and the
    // shoulder blades rolling up on the topline as a forepaw takes the weight.
    const dF = (Lg.foreN.up - (legDefs.foreN.up + aT)) * 0.5;
    const dH = (Lg.hindN.up - (legDefs.hindN.up + aL)) * 0.5;
    const turnAbout = (q, c, an) => add(c, rot([q[0] - c[0], q[1] - c[1]], an));
    const up = scap * sc(0.7) * w * (1 - run);
    const bodyPt = (p) => {
      let q = at(p);
      if (p[2]) q = lerp2(q, turnAbout(q, Lg.foreN.T, dF), p[2]);
      if (p[3]) q = lerp2(q, turnAbout(q, Lg.hindN.T, dH), p[3]);
      if (p[4]) q = add(q, rot([0, -up * p[4]], aT));
      return q;
    };
    // The ears: a spring trailing the head's turn and bouncing with the body; each twitching alone.
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const e = (st.ctEar ??= { x: 0, v: 0, last: ha, py: pivot[1], vy: 0 });
    const spin = dt > 0 ? (ha - e.last) / dt : 0;
    e.last = ha;
    const vy = dt > 0 ? (pivot[1] - e.py) / dt : 0;
    const ay = dt > 0 ? (vy - e.vy) / dt : 0;
    e.py = pivot[1];
    e.vy = vy;
    e.v += (-(e.x * 200) - e.v * 18 - spin * 2.5 + clamp(ay, -900, 900) * 0.0014) * dt;
    e.x = clamp(e.x + e.v * dt, -0.3, 0.3);
    // The tail: from the rump, a chain of springs (each following the one before, softer toward the
    // tip); its curve a question mark (straight from the base, the tip hooked), swaying slowly, the
    // tip flicking; trailing as it walks, streaming back as it runs.
    const tr = bodyPt(P.tail.root);
    const tail = [tr];
    const T0 = P.tail;
    const ch = (st.ctTail ??= []);
    let prev = null;
    for (let i = 1; i <= T0.n; i++) {
      const kf = i / T0.n;
      let goal;
      if (i === 1) {
        // (its base angle: held as the preset holds it; raised straight up, or dropped low and on
        // round to wrap the paws, turning round by its back, never over its body; trailing back as
        // it walks, streaming as it runs)
        const b0 = T0.base;
        const upA = b0 < 0 ? -90 : 270;
        const downA = b0 < 0 ? -255 : 105;
        const b1 = lerp(lerp(b0, upA, clamp(S.tailRaise, 0, 1)), downA, clamp(S.tailDrop, 0, 1));
        goal = aL + (b1 + S.tailUp + (w * 10 + run * 50) * Math.sign(b0) * (1 - clamp(S.tailDrop, 0, 1))) * D2R;
      }
      else {
        const curl = (T0.curl0 * (1 - kf) + (T0.curl1 + S.tailCurl) * kf * kf) * D2R * (1 - run * 0.8) * (1 - w * 0.25);
        goal = prev + curl + Math.sin(t * 0.9 - i * 0.55) * 0.035 + S.flick * Math.sin(t * 15 - i) * 0.32 * smoothstep((kf - 0.5) / 0.5);
      }
      const sp = (ch[i] ??= { x: goal, v: 0 });
      const kk = 320 - kf * 140;
      const cc = 24 - kf * 7;
      for (let n = 0; n < 2; n++) {
        sp.v += ((goal - sp.x) * kk - sp.v * cc) * (dt / 2);
        sp.x += sp.v * (dt / 2);
      }
      if (!(Math.abs(sp.x - goal) < 1.2)) sp.x = goal + clamp(sp.x - goal, -1.2, 1.2);
      prev = sp.x;
      const next = add(tail[i - 1], [Math.cos(sp.x) * sc(T0.seg), Math.sin(sp.x) * sc(T0.seg)]);
      next[1] = Math.min(next[1], -sc(T0.w[1]) * 0.5);
      tail.push(next);
    }
    return { pivot, aL, aT, at, bodyPt, legs: Lg, nb, hp, ha, mouth, jaw: clamp(S.jaw, 0, 1), ears: S.ears, ear: e.x, twitch: a.ctTwitch ?? [0, 0], tail, puff: clamp(S.puff, 0, 1) };
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
  // A leg: the far ones under the body, the near ones over its side, grown out of it; the paw a
  // small soft round, its toes just showing at the front.
  function drawLeg(ctx, a, mode, k) {
    const sk = a.bk;
    const Lg = sk.legs[k];
    const far = k.endsWith('F');
    const pw = sc(P.paw.w);
    const ph = sc(P.paw.h);
    const path = (c2, grow = 0) => {
      const [cx, cy] = add(Lg.P, rot([pw * 0.14, ph * 0.06], Lg.rot));
      c2.moveTo(cx + pw * 0.5 + grow, cy);
      c2.ellipse(cx, cy, pw * 0.5 + grow, ph * 0.5 + grow, Lg.rot, 0, TAU);
    };
    QD.drawLeg(ctx, mode, Lg, { far, colour: (c) => colour(a, c), tint: (c, al) => tint(a, c, al), bodyPts: far ? null : bodyPtsOf(sk), foot: { path }, unit: s });
    if (mode === 'line' || !P.paw.toes || Lg.rot < -0.9) return;
    // (the toes: two tiny soft creases at the front of the paw; only where the paw shows)
    ctx.save();
    if (!far) {
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      bodyPtsOf(sk).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.clip('evenodd');
    }
    ctx.translate(...add(Lg.P, rot([pw * 0.14, ph * 0.06], Lg.rot)));
    ctx.rotate(Lg.rot);
    ctx.strokeStyle = colour(a, far ? C.deep : C.sh);
    ctx.lineWidth = Math.max(0.35, sc(0.35));
    ctx.lineCap = 'round';
    for (const x of [0.12, 0.3]) {
      ctx.beginPath();
      ctx.moveTo(pw * x, ph * 0.18);
      ctx.lineTo(pw * (x + 0.04), ph * 0.46);
      ctx.stroke();
    }
    ctx.restore();
  }
  // The body: its outline over the spine; the back lit along the top, the belly shaded softly
  // between the legs (fading out before them, so where a leg comes out there's no seam), a pale
  // bib on the chest with a few soft tufts, the haunch and the shoulder lit round.
  const glow = (ctx, c, r, k, col) => {
    const [cr, cg, cb] = hexRgb(col);
    const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
    gr.addColorStop(0, `rgba(${cr},${cg},${cb},${k})`);
    gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
  };
  const topline = P.body.filter((p) => p[1] < -5.5);
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
    // the back's light: soft along the topline, following the spine however it bends
    for (const p of topline) glow(ctx, sk.bodyPt([p[0], p[1] + 2.6, p[2], p[3], p[4]]), sc(4.4), 0.32, C.lt);
    // the belly's shade: a soft round between the legs, fading out before them
    {
      const c = sk.at([(hindJ1 + foreJ1) / 2, bellyY + 1.5]);
      const rx = sc((foreJ1 - hindJ1) / 2 - 2);
      const ry = sc(5.5);
      ctx.save();
      ctx.translate(c[0], c[1]);
      ctx.rotate((sk.aL + sk.aT) / 2);
      ctx.scale(rx / ry, 1);
      const [sr, sg, sb] = hexRgb(C.sh);
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
      gr.addColorStop(0, `rgba(${sr},${sg},${sb},0.8)`);
      gr.addColorStop(0.5, `rgba(${sr},${sg},${sb},0.45)`);
      gr.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(-ry, -ry, ry * 2, ry * 2);
      ctx.restore();
    }
    // the bib, and its soft tufts
    const bib = sk.at(P.bib);
    glow(ctx, bib, sc(P.bib[2]) * 1.25, 0.9, C.lt);
    ctx.strokeStyle = colour(a, C.lt);
    ctx.lineWidth = Math.max(0.5, sc(0.7));
    ctx.lineCap = 'round';
    for (const [dx, dy] of [[-1.2, 1.6], [0.6, 2.6], [2, 1.2]]) {
      const p0 = sk.at([P.bib[0] + dx, P.bib[1] + dy]);
      const p1 = sk.at([P.bib[0] + dx + 0.6, P.bib[1] + dy + 1.4]);
      ctx.beginPath();
      ctx.moveTo(...p0);
      ctx.lineTo(...p1);
      ctx.stroke();
    }
    // the haunch and the shoulder lit round, soft, moving with the legs under them
    const Lf = sk.legs.foreN;
    const Lh = sk.legs.hindN;
    glow(ctx, add(lerp2(Lh.T, Lh.J1, 0.25), [-sc(1.2), -sc(1)]), sc(6), 0.5, C.lt);
    glow(ctx, add(lerp2(Lf.T, Lf.J1, 0.3), [-sc(0.3), -sc(0.6)]), sc(4), 0.4, C.lt);
    ctx.restore();
  }
  // The neck: short, from the chest up into the head; only where it comes up out of the body.
  function drawNeck(ctx, a, mode) {
    const sk = a.bk;
    const pts = [sk.nb, lerp2(sk.nb, sk.hp, 0.5), sk.hp];
    const wl = pts.map(() => sc(P.neck.w));
    tubePath(ctx, pts, wl);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
  }
  // The head, in its own frame (about the middle of the skull, the face to the right): the skull,
  // the cheeks' ruff, the muzzle and the chin, one shape; the jaw opening under the muzzle.
  const E4 = (ctx, [x, y, rx, ry], g = 0) => {
    ctx.moveTo(sc(x + rx) + g, sc(y));
    ctx.ellipse(sc(x), sc(y), sc(rx) + g, sc(ry) + g, 0, 0, TAU);
  };
  function headPath(ctx, grow = 0) {
    const Hd = P.head;
    ctx.beginPath();
    E4(ctx, Hd.skull, grow);
    E4(ctx, Hd.cheek, grow);
    E4(ctx, Hd.muzzle, grow);
    E4(ctx, Hd.chin, grow);
    if (Hd.ruff) {
      // (a lynx's ruff: the cheeks drawn down to soft points)
      const [cx, cy, rx, ry] = Hd.cheek;
      for (const [px, py] of [[cx - rx * 0.55, cy + ry * 1.25], [cx + rx * 0.05, cy + ry * 1.35]]) {
        ctx.moveTo(sc(px) + grow, sc(py - 2.4));
        ctx.lineTo(sc(px + 1.4) + grow, sc(py - 2.6));
        ctx.lineTo(sc(px + 0.2), sc(py) + grow);
        ctx.lineTo(sc(px - 1.4) - grow, sc(py - 2.4));
        ctx.closePath();
      }
    }
  }
  function drawHead(ctx, a, mode) {
    const sk = a.bk;
    const Hd = P.head;
    ctx.save();
    ctx.translate(sk.hp[0], sk.hp[1]);
    ctx.rotate(sk.ha);
    // the jaw, hinged under the cheek, opening down
    const [mx, my, mrx, mry] = Hd.muzzle;
    const hinge = [sc(mx - mrx * 1.1), sc(my + mry * 0.6)];
    const jawShape = (c2, g = 0) => {
      const [jx, jy, jrx, jry] = [sc(mx - mrx * 0.2), sc(my + mry * 0.95), sc(mrx * 0.95) + g, sc(mry * 0.55) + g];
      c2.beginPath();
      c2.moveTo(jx + jrx, jy);
      c2.ellipse(jx, jy, jrx, jry, 0, 0, TAU);
    };
    ctx.save();
    ctx.translate(...hinge);
    ctx.rotate(sk.jaw * 0.55);
    ctx.translate(-hinge[0], -hinge[1]);
    jawShape(ctx);
    if (mode === 'line') edge(ctx);
    else {
      ctx.fillStyle = colour(a, C.sh);
      ctx.fill();
    }
    ctx.restore();
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
    // the crown lit, the cheeks' ruff pale and full, the muzzle pale, a soft shade behind the cheek
    const [sx, sy, srx, sry] = Hd.skull;
    glow(ctx, [sc(sx - srx * 0.15), sc(sy - sry * 0.45)], sc(srx * 0.85), 0.95, C.lt);
    const [cx, cy, crx, cry] = Hd.cheek;
    glow(ctx, [sc(cx + crx * 0.15), sc(cy + cry * 0.1)], sc(crx * 0.8), 0.7, C.lt);
    glow(ctx, [sc(mx), sc(my)], sc(mrx * 1.3), 0.9, C.lt);
    glow(ctx, [sc(cx - crx * 0.75), sc(cy + cry * 0.1)], sc(cry * 1.1), 0.55, C.sh);
    ctx.restore();
    // the mouth open (hissing, biting): dark inside, a pale tongue
    if (sk.jaw > 0.15) {
      ctx.save();
      ctx.beginPath();
      const open = sk.jaw;
      ctx.ellipse(sc(mx - mrx * 0.1), sc(my + mry * 0.95), sc(mrx * 0.7), sc(mry * 0.45) * open, 0.25 * open, 0, TAU);
      ctx.fillStyle = colour(a, C.mouth);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sc(mx - mrx * 0.15), sc(my + mry * 1.15), sc(mrx * 0.38), sc(mry * 0.22) * open, 0.2, 0, TAU);
      ctx.fillStyle = colour(a, '#d8b4cf');
      ctx.fill();
      ctx.restore();
    }
    // the nose, the 'w' of the mouth, the whiskers, the soft line where the eyes go
    const [nx, ny, nr] = Hd.nose;
    ctx.fillStyle = colour(a, C.nose);
    ctx.beginPath();
    ctx.moveTo(sc(nx - nr), sc(ny - nr * 0.5));
    ctx.quadraticCurveTo(sc(nx + nr * 0.2), sc(ny - nr * 0.9), sc(nx + nr * 0.6), sc(ny - nr * 0.3));
    ctx.quadraticCurveTo(sc(nx + nr * 0.2), sc(ny + nr * 0.8), sc(nx - nr * 0.4), sc(ny + nr * 0.5));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = colour(a, C.guide);
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(0.35, sc(0.45));
    if (sk.jaw <= 0.15) {
      ctx.beginPath();
      ctx.moveTo(sc(nx - nr * 0.2), sc(ny + nr * 0.5));
      ctx.lineTo(sc(nx - nr * 0.3), sc(ny + nr * 1.5));
      ctx.quadraticCurveTo(sc(nx - nr * 0.8), sc(ny + nr * 2.3), sc(nx - nr * 1.6), sc(ny + nr * 1.6));
      ctx.stroke();
    }
    ctx.globalAlpha *= 0.65;
    for (let i = 0; i < (Hd.whiskers ?? 0); i++) {
      const y0 = my + mry * (-0.1 + i * 0.32);
      ctx.beginPath();
      ctx.moveTo(sc(mx + mrx * 0.35), sc(y0));
      ctx.quadraticCurveTo(sc(mx + mrx * 1.6), sc(y0 - 0.6 + i * 0.5), sc(mx + mrx * 2.5), sc(y0 - 0.2 + i * 1.1));
      ctx.stroke();
    }
    ctx.globalAlpha /= 0.65;
    ctx.beginPath();
    ctx.moveTo(sc(srx * 0.05), sc(-sry * 0.08));
    ctx.quadraticCurveTo(sc(srx * 0.45), sc(-sry * 0.22), sc(srx * 0.8), sc(-sry * 0.02));
    ctx.stroke();
    ctx.restore();
  }
  // The ears, in the head's frame: a cat's triangles (a soft round tip, a wide base, a pale inner ear
  // with two little tufts), a tiger cub's small rounds, a lynx's tall ones with a soft tuft; on a
  // spring, perking forward, laid flat back, each twitching on its own.
  function earShape(kind, wd, ht) {
    if (kind === 'round') return [[-wd / 2, 0.6], [-wd * 0.52, -ht * 0.5], [-wd * 0.25, -ht * 0.95], [wd * 0.15, -ht], [wd * 0.46, -ht * 0.6], [wd * 0.5, 0.6]];
    return [[-wd / 2, 0.7], [-wd * 0.34, -ht * 0.48], [-wd * 0.1, -ht * 0.94], [wd * 0.06, -ht], [wd * 0.24, -ht * 0.52], [wd * 0.5, 0.7]];
  }
  function drawEar(ctx, a, mode, which) {
    const sk = a.bk;
    const E0 = P.ears;
    const far = which === 'far';
    const root = E0[far ? 'far' : 'near'].map(sc);
    const tw = sk.twitch[far ? 1 : 0];
    // (forward and up at +1, laid flat back at -1; the spring's bounce; a twitch back)
    const flat = Math.max(0, -sk.ears);
    const ang = E0.tilt + Math.max(0, sk.ears) * 0.12 - flat * 1.15 + sk.ear * 0.5 - tw * 0.35 - (far ? 0.14 : 0);
    const squash = 1 - flat * 0.22;
    const pts = ring(earShape(E0.kind, sc(E0.w), sc(E0.h) * squash), 3);
    ctx.save();
    ctx.translate(...sk.hp);
    ctx.rotate(sk.ha);
    ctx.translate(...root);
    ctx.rotate(ang);
    poly(ctx, pts);
    if (E0.kind === 'tuft') {
      // (the tuft: a soft little flick off the tip, round-ended)
      const tip = [sc(E0.w) * 0.06, -sc(E0.h) * squash];
      const tp = [tip, add(tip, [sc(0.4), -sc(1.4)]), add(tip, [sc(1.1), -sc(2.6)]), add(tip, [sc(2), -sc(3.4)])];
      QD.tubeInto(ctx, tp, [sc(1.5), sc(1.1), sc(0.7), sc(0.3)]);
    }
    if (mode === 'line') {
      edge(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = colour(a, far ? C.sh : C.base);
    ctx.fill('nonzero');
    poly(ctx, pts.map(([x, y]) => [x * 0.55, y * 0.66 - sc(0.6)]));
    ctx.fillStyle = colour(a, far ? C.deep : C.sh);
    ctx.fill();
    if (E0.kind !== 'round') {
      // (two little tufts of fur in the ear)
      ctx.strokeStyle = colour(a, far ? C.sh : C.lt);
      ctx.lineWidth = Math.max(0.35, sc(0.4));
      ctx.lineCap = 'round';
      for (const dx of [-0.12, 0.08]) {
        ctx.beginPath();
        ctx.moveTo(sc(E0.w) * dx, -sc(0.6));
        ctx.lineTo(sc(E0.w) * (dx + 0.06), -sc(E0.h) * squash * 0.38);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  // The tail: one even tube along the chain, round at its tip, bottle-brushed when it puffs; a soft
  // shade down its underside, a pale tip on some.
  function drawTail(ctx, a, mode) {
    const sk = a.bk;
    const T = sk.tail;
    const n = T.length;
    const fat = 1 + sk.puff * 0.75;
    const W = T.map((_, i) => sc(lerp(P.tail.w[0], P.tail.w[1], i / (n - 1))) * fat * (i === n - 1 ? 0.92 : 1));
    tubePath(ctx, T, W);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
    ctx.save();
    tubePath(ctx, T, W);
    ctx.clip('nonzero');
    tubePath(ctx, T.map(([x, y], i) => [x, y + W[i] * 0.32]), W.map((v) => v * 0.42));
    ctx.fillStyle = colour(a, C.sh);
    ctx.fill('nonzero');
    if (P.tail.tip > 0) {
      const k0 = Math.max(1, Math.floor(n * (1 - P.tail.tip)));
      tubePath(ctx, T.slice(k0 - 1), W.slice(k0 - 1).map((v) => v * 1.1));
      ctx.fillStyle = colour(a, C.lt);
      ctx.fill('nonzero');
    }
    ctx.restore();
  }

  // ---------- Effects: claw marks, sparkles, dust, a hiss's puffs, speed lines ----------
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
  const spot = (sk, what) => {
    if (what === 'mouth') return sk.mouth;
    if (what === 'paws') return lerp2(sk.legs.foreN.P, sk.legs.foreF.P, 0.5);
    if (what === 'feet') return lerp2(sk.legs.hindN.P, sk.legs.foreN.P, 0.5);
    if (what === 'body') return add(sk.pivot, [0, sc(6)]);
    return sk.legs.foreN.P;
  };
  function drawFx(ctx, m, a) {
    const sk = a.bk;
    const mv = a.ctMove?.mv;
    const t = a.ctMove?.t ?? 0;
    if (!mv) return;
    ctx.save();
    // claw marks: three curved scratches where the paw swept, drawn on, then fading
    for (const c0 of mv.claws ?? []) {
      const k = since([c0], t, 0.26);
      if (k < 0) continue;
      const [px, py] = sk.legs.foreN.P;
      const draw = Math.min(1, k / 0.35);
      ctx.globalAlpha = 1 - smoothstep((k - 0.4) / 0.6);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const oy = (i - 1) * sc(2.4);
        ctx.lineWidth = sc(1.1) * (1 - Math.abs(i - 1) * 0.25);
        ctx.beginPath();
        const x0 = px - sc(5);
        const y0 = py - sc(5) + oy;
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(x0 + sc(5) * draw, y0 + sc(3.5) * draw - sc(1), x0 + sc(9) * draw, y0 + sc(6) * draw);
        ctx.stroke();
      }
      ctx.strokeStyle = '#ffc8de';
      ctx.globalAlpha *= 0.6;
      for (let i = 0; i < 3; i++) {
        const oy = (i - 1) * sc(2.4) + sc(0.5);
        ctx.lineWidth = sc(0.5);
        ctx.beginPath();
        const x0 = px - sc(5);
        const y0 = py - sc(5) + oy;
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(x0 + sc(5) * draw, y0 + sc(3.5) * draw - sc(1), x0 + sc(9) * draw, y0 + sc(6) * draw);
        ctx.stroke();
      }
    }
    // sparkles on a hit
    for (const s0 of mv.spark ?? []) {
      const sp = since([s0], t, 0.22);
      if (sp < 0) continue;
      const [sx, sy] = spot(sk, mv.sparkAt);
      const e = 1 - (1 - sp) ** 3;
      ctx.globalAlpha = 1 - sp;
      star(ctx, sx, sy, H * 0.11 * (0.5 + 0.7 * e), sp * 0.8, '#ffffff');
      star(ctx, sx, sy, H * 0.055 * (0.5 + 0.7 * e), sp * 0.8 + 0.4, '#fff2a8');
      for (let i = 0; i < 4; i++) {
        const q = (i * TAU) / 4 + 0.6;
        star(ctx, sx + Math.cos(q) * H * 0.15 * e, sy + Math.sin(q) * H * 0.15 * e, H * 0.028, q, i % 2 ? '#ffc8de' : '#fff6c8');
      }
    }
    // a hiss: little soft puffs of breath from the mouth
    if (mv.hiss) {
      const [h0, h1] = mv.hiss;
      if (t >= h0 && t <= h1 + 0.2) {
        for (let i = 0; i < 3; i++) {
          const ph = ((t - h0) * 2.4 + i / 3) % 1;
          const [mx, my] = sk.mouth;
          puffAt(ctx, mx + sc(2 + ph * 7), my + sc(-1 + (i - 1) * 1.6) * ph, sc(0.8 + ph * 1.3), (1 - ph) * 0.7 * (t > h1 ? 1 - (t - h1) / 0.2 : 1));
        }
      }
    }
    // dust where it lands or pushes off
    for (const [d0, where] of mv.dust ?? []) {
      const dp = since([d0], t, 0.4);
      if (dp < 0) continue;
      const [gx] = spot(sk, where);
      const e = 1 - (1 - dp) ** 2;
      for (let i = 0; i < 4; i++) {
        const dir = i < 2 ? -1 : 1;
        puffAt(ctx, gx + dir * sc(2 + (i % 2) * 3) * (0.4 + e), -sc(1 + (i % 2)) - e * sc(2.4), sc(1.4 + (i % 2) * 0.6) * (0.6 + 0.6 * e), (1 - dp) * 0.85);
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
        const y = sk.pivot[1] + sc((i - 1) * 4);
        ctx.beginPath();
        ctx.moveTo(sk.pivot[0] - sc(14) - sc(6) * k, y);
        ctx.lineTo(sk.pivot[0] - sc(24) - sc(10) * k, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    if (m.act && CAT_MOVES[m.act.name]) {
      const mv = CAT_MOVES[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + lengthOf(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.ctAtk) {
        const pool = m.def.moves ?? POOL;
        st.ctN = (st.ctN ?? m.uid) + 1;
        st.ctPick = m.move ?? pool[st.ctN % pool.length];
      }
      st.ctAtk = true;
      const mv = CAT_MOVES[st.ctPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.ctAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lengthOf(CAT_MOVES.hurt)) return [CAT_MOVES.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < lengthOf(CAT_MOVES.stretch)) return [CAT_MOVES.stretch, gl, 1];
    return [null, 0, 0];
  }
  const live = (name, draw) => ({ name, draw });
  const seq = [
    live('hindF', (ctx, a, mode) => drawLeg(ctx, a, mode, 'hindF')),
    live('foreF', (ctx, a, mode) => drawLeg(ctx, a, mode, 'foreF')),
    live('tail', drawTail),
    live('body', drawBody),
    live('hindN', (ctx, a, mode) => drawLeg(ctx, a, mode, 'hindN')),
    live('foreN', (ctx, a, mode) => drawLeg(ctx, a, mode, 'foreN')),
    live('neck', drawNeck),
    live('earF', (ctx, a, mode) => drawEar(ctx, a, mode, 'far')),
    live('head', drawHead),
    live('earN', (ctx, a, mode) => drawEar(ctx, a, mode, 'near')),
  ];
  const parts = [...seq.map((p) => ({ name: p.name, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a) => p.draw(ctx, a, 'line') })), ...seq.map((p) => ({ name: `${p.name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a) => p.draw(ctx, a, 'fill') }))];
  const rig = makeRig({
    w: Math.ceil(bodyLen * 2.4 + sc(34)),
    h: Math.ceil(H * 1.4),
    soft: true,
    stride,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, c === 'jaw' ? [400, 30] : c === 'flick' ? [80, 14] : c === 'neck' || c === 'head' || c === 'ears' ? [170, 23] : [170, 21]])),
    walkStiff: { x: [400, 36], lift: [900, 60], pitch: [400, 38], neck: [260, 28], head: [260, 28] },
    fast: CH.filter((c) => !['neck', 'head', 'ears', 'tailUp', 'tailRaise', 'tailDrop', 'tailCurl', 'flick'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.ctActive),
    kick: { pitch: -40, head: 50 },
    turnKick: { pitch: 16 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.1;
      // The gait: its phase from the distance walked; trotting, then bounding, as it speeds up.
      const dt = Math.max(1e-3, a.dt);
      const odo = m.odo ?? 0;
      const raw = Math.min(400, Math.abs(odo - (st.ctOdo ?? odo)) / dt);
      st.ctOdo = odo;
      st.ctV = (st.ctV ?? 0) + (raw - (st.ctV ?? 0)) * Math.min(1, dt * 5);
      const v = st.ctV;
      const trotGoal = a.moving ? clamp((v - walkSpeed * 1.15) / (walkSpeed * 0.45), 0, 1) : 0;
      const runGoal = a.moving ? clamp((v - walkSpeed * 1.9) / (walkSpeed * 0.6), 0, 1) : 0;
      st.ctTrot = (st.ctTrot ?? 0) + (trotGoal - (st.ctTrot ?? 0)) * Math.min(1, dt * 4);
      st.ctRun = (st.ctRun ?? 0) + (runGoal - (st.ctRun ?? 0)) * Math.min(1, dt * 4);
      st.ctU = ((st.ctU ?? 0) + (v / cycle(st.ctRun)) * dt) % 1;
      // Standing about: breathing, a slow look round now and then (held, then turning), each ear
      // twitching on its own, the tail swaying slowly, its tip flicking.
      const breath = Math.sin(t * 1.4);
      const rnd = (n) => {
        const q = Math.sin(n * 12.9898 + (m.uid % 97) * 78.233) * 43758.5453;
        return q - Math.floor(q);
      };
      const blk = Math.floor(t / 5);
      const turn = smoothstep(((t / 5) % 1) / 0.2);
      const look = lerp(rnd(blk - 1), rnd(blk), turn) * 2 - 1;
      a.ctTwitch = [hold(t % 4.7, 2, 2.05, 2.1, 2.3), hold(t % 6.3, 3.1, 3.15, 3.2, 3.4)];
      const idle = {
        x: 0, lift: breath * 0.15, hop: 0, pitch: 0, arch: breath * 0.8, hipLift: 0, crouch: 0, sit: 0, lie: 0, loaf: 0, groom: 0, reach: 0, fly: 0,
        neck: look * 4, head: look * 3 + breath * 0.4, jaw: 0, ears: 0.15, tailUp: 0, tailRaise: 0, tailDrop: 0, tailCurl: 0, puff: 0, flick: 0.6 * hold(t % 7.5, 2, 2.3, 3.4, 3.8), fpX: 0, fpY: 0,
      };
      const r = st.ctRun;
      const walk = { ...idle, x: 0.3, neck: -5 - r * 6, head: 4 + r * 2, ears: 0.1 - r * 0.7, tailUp: 4, arch: 0, jaw: r * 0.2, flick: 0 };
      const [mv, mt, anticW] = moveNow(m, a, st);
      const base = {};
      for (const c of CH) base[c] = idle[c] * (1 - a.walkW) + walk[c] * a.walkW;
      base.x /= H;
      base.hop /= H;
      const out = mv ? poseAt(mv, mt, anticW, base) : { ...base };
      const wrap = { tailUp: 0, tailRaise: 0, tailDrop: 1, tailCurl: -78 };
      if (m.pose === 'sit') Object.assign(out, { sit: 1, neck: -24, head: 24, ears: 0.25, ...wrap });
      else if (m.pose === 'groom') Object.assign(out, { sit: 1, neck: -6, head: 30 + Math.sin(t * 9) * 5, ears: 0.1, ...wrap, groom: 1, jaw: 0.15 + 0.15 * Math.sin(t * 9) });
      else if (m.pose === 'loaf') Object.assign(out, { loaf: 1, neck: 4, head: 6, ears: 0.2, ...wrap });
      else if (m.pose === 'lie') Object.assign(out, { lie: 1, neck: -2, head: 4, ears: 0.25, tailUp: 0, tailRaise: 0, tailDrop: 0.85, tailCurl: -30 });
      if (m.hp <= 0) Object.assign(out, { lie: 1, neck: 14, head: 18, ears: -1, tailUp: 0, tailDrop: 1, tailCurl: -20, jaw: 0.2 });
      st.ctActive = Boolean(mv);
      a.ctMove = mv ? { mv, t: mt } : null;
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
  // (a still for the Monster Book: the body and the head at rest, plain)
  const still = () => ({ w: Math.ceil(bodyLen * 2.4 + sc(34)), h: Math.ceil(H * 1.4), res: 3, shapes: [E(bodyLen * 1.2, H * 1.4 - hb, bodyLen * 0.5, sc(7.5), C.base), E(bodyLen * 1.2 + sc(14), H * 1.4 - hb - sc(15), sc(P.head.skull[2]), sc(P.head.skull[3]), C.base)] });
  return { rig, still, stride, speed: walkSpeed, H, w: Math.round(bodyLen * 1.4), h: Math.round(H * 1.1), moves: P.moves };
}

export const CAT_ARTS = {};
export const CAT_DEFS = {};
for (const kind of CAT_KINDS) {
  const r = catRig(kind);
  CAT_ARTS[`blank_${kind}`] = { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig };
  CAT_DEFS[kind] = { id: `blank_${kind}`, name: `Blank ${kind}`, art: `blank_${kind}`, w: r.w, h: r.h, speed: r.speed, hp: 100, fight: { windup: 0.5 }, bodyH: r.H, beast: true, moves: r.moves };
}
