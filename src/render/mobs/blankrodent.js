// The rodent base (2026-11-23, the player: "nice next base animals"): a blank chibi rodent made for a
// rodent from the start, nothing carried over from another base; only the engine is shared (rig.js's
// springs, and blankquad.js's three-bone leg joints, drawn so a leg never shows on the body it comes
// out of). Drawn live like the other blank bases: one smooth shape over its bones, outlined only on
// its outer edge.
//
// The body, side on, facing right:
//   spine   one bendy arc through the whole body, so it curls (`curl`: + bunched up round, − stretched
//           out long) as a rodent does all the time: bunched as its hind feet land up by its
//           forepaws, stretched out in the air; curled right round into a ball (`ball`) to roll or to
//           sleep; sat up on its haunches (`sit`)
//   body    a soft bean: a small chest, a big round haunch, a pale belly
//   legs    short forelegs with little hands that come up to hold things (`hold`: to the chest, then
//           to the mouth), wash its face (`wash`) and throw (`throwArm`); long-footed hind legs, the
//           foot flat when it stands, rolling up onto its toes to push off
//   gait    a squirrel bounds (the forepaws down, the hind feet landing up by them as the back
//           bunches, a push and a long stretched-out flight); a mouse scurries (quick little trotting
//           steps) and bounds when it runs; a hamster scurries on its tiny legs, its round body bobbing
//   head    a round skull and a muzzle (short and blunt, round and cheeky, or long and pointed),
//           cheeks (a hamster's pouches puff up, `cheeks`), a twitching nose (`nose`), buck teeth, a
//           jaw that chatters (`jaw`), faint whiskers, a soft line where the eyes go
//   ears    small and upright with a soft tuft, small and round, or big round dishes; on springs,
//           perking up or laid flat back (`ears`)
//   tail    a squirrel's great plume in an S over its back, flowing a beat behind every move; a
//           mouse's long thin tail trailing in a lazy curve; a hamster's little nub
// Presets: squirrel, hamster, mouse.
// Moves (RODENT_MOVES): bite (a lunge, quick chomps), tail whip, toss (an acorn, a seed or a berry),
// chitter (a scolding chatter), roll (curled into a ball, bowling forward), jump, dash, dodge, hurt,
// knockdown (flipped onto its back, paws paddling, rolling on back up); washing its face when
// pleased. Poses (m.pose): sit (up on its haunches, paws at its chest), eat (a nut held to its mouth,
// nibbling), sleep (curled up, its tail round it).

import { makeRig, clamp, TAU } from './rig.js';
import { hold } from './kidrig.js';
import { E } from './kit.js';
import { OUTLINE, sprite } from '../pixel.js';
import { legDefs as legDefsOf, placeLeg, legDrawer } from './blankquad.js';

const D2R = Math.PI / 180;
const C = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#a593bf', inner: '#ecdcec', tooth: '#fdfbff', mouth: '#a698be' };
const smoothstep = (u) => {
  const v = Math.min(1, Math.max(0, u));
  return v * v * (3 - 2 * v);
};
const lerp = (a, b, u) => a + (b - a) * u;
const rot = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const mul = (p, k) => [p[0] * k, p[1] * k];
const lerp2 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
const dir = (an) => [Math.cos(an), Math.sin(an)];
const wrap = (x) => ((x % 1) + 1) % 1;
const wrapPi = (x) => x - TAU * Math.round(x / TAU);
const hexRgb = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
// (a smooth closed curve through the points, `n` steps between each two)
function smoothLoop(pts, n) {
  const out = [];
  const N = pts.length;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t * t * t)));
    }
  }
  return out;
}
// (the same through an open chain, ends included)
function smoothChain(pts, n) {
  const out = [];
  const N = pts.length;
  for (let i = 0; i < N - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(N - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t * t * t)));
    }
  }
  out.push(pts[N - 1]);
  return out;
}

// ---------- The rodents (units: game px at scale 1, about the middle of the spine; x forward, y down) ----------
// body: its outline round from the front of the chest, over the back, round the haunch, along the
// belly; seat: the bottom of the haunch it sits on. fore/hind: each leg's top joint, its bones (each
// joint from the last), its widths. neck: its base on the chest, length, width, angle (degrees).
// head: skull [rx, ry]; muzzle [x, y, rx, ry]; nose [x, y, r]; cheek [x, y, rx, ry]; teeth [x, y,
// height]. ears: where each ear sits on the skull, its length, width, angle. tail: its root on the
// rump; a chain's segment length, rest angles (degrees, in the body's frame) and widths at each
// joint. sitAng: how far the body tips back to sit up.
const SQUIRREL = {
  name: 'Squirrel',
  scale: 1,
  gait: { walk: 'bound', run: 'bound' },
  body: [[9.4, -1.2], [8, -4.4], [4.4, -6.6], [-1, -7.2], [-6, -7.4], [-10.4, -6.2], [-13.2, -2.8], [-13.4, 1.4], [-11.4, 5], [-7.6, 6.6], [-3, 6.2], [1.6, 5.8], [5.6, 5], [8.6, 2.4]],
  seat: [-10.4, 6],
  haunch: [-8.4, -0.4, 6.4],
  fore: { top: [5.4, 1.4], bones: [[-0.4, 3], [0.4, 2.8], [0.8, 1.4]], w: [5, 3.2, 2.4, 2.2] },
  hind: { top: [-8.6, 0.6], bones: [[4.4, 3.6], [-4.6, 4], [6.4, 0.4]], w: [11, 6, 4.2, 2.8] },
  far: [-1.4, -0.5],
  neck: { base: [7, -3.2], len: 3, w: 7.5, ang: -46 },
  head: { skull: [8.4, 7.6], muzzle: [6, 2.2, 3.8, 3.1], nose: [9.5, 1.3, 1], cheek: [1.4, 3.2, 5.6, 4], teeth: [8.3, 4.6, 1.5] },
  ears: { kind: 'tall', near: [-0.4, -6.4], far: [-3, -6], len: 5.6, w: 4.2, ang: -96, tuft: 2 },
  tail: { kind: 'plume', root: [-12.2, -2.2], seg: 3.9, ang: [-156, -126, -98, -76, -60, -64, -88], w: [4.4, 8.6, 11.2, 12.4, 12.6, 11.8, 9.6, 6.2] },
  sitAng: -64,
  nut: 'acorn',
  moves: ['bite', 'tailWhip', 'toss'],
};
// (a hamster: a ball of a body on tiny legs, a round head straight on it, big pouchy cheeks)
const HAMSTER = {
  name: 'Hamster',
  scale: 0.84,
  round: true,
  gait: { walk: 'scurry', run: 'scurry' },
  body: [[9.4, -2.4], [6.8, -6.8], [1.8, -8.8], [-3.6, -8.8], [-8.2, -6.6], [-10.6, -2.4], [-10.4, 2.6], [-7.8, 6.6], [-3.2, 8.4], [2, 8.4], [6.6, 6.6], [9.4, 2.6]],
  seat: [-6.4, 7.8],
  haunch: [-5.4, 1, 6.6],
  fore: { top: [5.6, 4.6], bones: [[-0.3, 1.9], [0.3, 1.8], [0.6, 1]], w: [4, 2.8, 2.2, 2] },
  hind: { top: [-5.4, 4.2], bones: [[2.2, 2.1], [-2.2, 2.6], [3.8, 0.4]], w: [7, 4.2, 3.2, 2.4] },
  far: [-1.2, -0.4],
  neck: { base: [6.6, -3.4], len: 1.6, w: 9, ang: -26 },
  head: { skull: [8.2, 7.4], muzzle: [5.6, 2.4, 3.1, 2.7], nose: [8.4, 1.6, 0.85], cheek: [0.8, 3.4, 6.4, 4.8], pouch: 0.6, teeth: [7.5, 4.3, 1.3] },
  ears: { kind: 'round', near: [-0.8, -6.4], far: [-3.2, -6], len: 3.2, w: 3.8, ang: -100 },
  tail: { kind: 'nub', root: [-10.4, 0.6], r: 1.8 },
  sitAng: -46,
  nut: 'seed',
  moves: ['bite', 'roll', 'toss'],
};
// (a mouse: a slim pear of a body, a long pointed muzzle, big round ears, a long thin tail)
const MOUSE = {
  name: 'Mouse',
  scale: 0.78,
  gait: { walk: 'scurry', run: 'bound' },
  body: [[8.4, -0.4], [7, -3.6], [3.4, -6], [-1.8, -7], [-6.8, -6.6], [-10.6, -4], [-12, 0], [-10.8, 4.2], [-7, 6.4], [-2, 6.4], [2.8, 5.4], [6.6, 3.6]],
  seat: [-8.6, 5.8],
  haunch: [-7.4, 0, 5.6],
  fore: { top: [4.6, 2], bones: [[-0.3, 2.4], [0.3, 2.4], [0.7, 1.2]], w: [4.2, 2.6, 2, 1.8] },
  hind: { top: [-7.2, 1.4], bones: [[3.6, 2.8], [-3.6, 3.4], [5.2, 0.4]], w: [9, 5, 3.4, 2.2] },
  far: [-1.2, -0.4],
  neck: { base: [6.4, -2.4], len: 2.6, w: 6.5, ang: -36 },
  head: { skull: [7.4, 6.6], muzzle: [6.4, 2, 4.6, 2.7], nose: [10.8, 1.6, 0.85], cheek: [1.2, 2.8, 4.6, 3.4], teeth: [9.6, 3.7, 1.1] },
  ears: { kind: 'big', near: [-1.4, -5.2], far: [-4, -4.6], len: 6.8, w: 7.2, ang: -106 },
  tail: { kind: 'string', root: [-11.6, 1.2], seg: 3, ang: [128, 140, 158, 176, 188, 196, 204, 214, 226], w: [2, 1.7, 1.45, 1.25, 1.1, 0.95, 0.82, 0.7, 0.6, 0.5] },
  sitAng: -60,
  nut: 'berry',
  moves: ['bite', 'chitter', 'tailWhip'],
};
export const RODENT_PRESETS = { squirrel: SQUIRREL, hamster: HAMSTER, mouse: MOUSE };
export const RODENT_KINDS = ['squirrel', 'hamster', 'mouse'];

// ---------- The rodent moves (units: x, hop in body heights; angles in degrees) ----------
// curl: the spine (+ bunched round, − stretched); sit: up on its haunches; ball: curled into a ball;
// free: the legs off the ground, hanging from the body; flop: lying on its back; reach: the head
// reaching forward (−: pulled in); jaw: open; ears: + perked, − flat back; hold: the forepaws up (0.5
// at the chest, 1 at the mouth); wash: rubbing its face; throwArm: −1 wound back over its head, +1
// thrown forward; tailUp: the tail curled further over; swish: the tail whipped forward over it.
// `spin`: whole turns of the body (rolling forward +, flipping back −), [from, to, turns], added up.
export const RODENT_MOVES = {
  bite: {
    anticT: 0.14,
    keys: [
      [0, { x: -0.04, crouch: 0.35, pitch: -4, curl: 0.35, head: -8, reach: -0.3, ears: -0.5, jaw: 0.2 }],
      [0.06, { x: 0.12, pitch: 6, curl: -0.35, head: 10, reach: 1, jaw: 1, ears: -0.8 }, 'out'],
      [0.1, { x: 0.13, pitch: 7, curl: -0.3, head: 9, reach: 0.9, jaw: 0, ears: -0.8 }, 'in'],
      [0.15, { x: 0.14, pitch: 7, curl: -0.3, head: 12, reach: 1, jaw: 1, ears: -0.8 }, 'out'],
      [0.19, { x: 0.14, pitch: 6, curl: -0.25, head: 8, reach: 0.9, jaw: 0, ears: -0.7 }, 'in'],
      [0.32, { x: 0.12, pitch: 2, curl: 0.12, head: 2, reach: 0.3, ears: -0.1 }, 'io'],
      [0.5, { x: 0.1, pitch: -1, curl: -0.04, reach: -0.05, ears: 0.2 }, 'io'],
      [0.8, {}],
    ],
    spark: [0.06, 0.15],
    sparkAt: 'teeth',
  },
  tailWhip: {
    anticT: 0.2,
    keys: [
      [0, { x: -0.02, crouch: 0.25, pitch: -4, curl: 0.3, swish: -0.3, tailUp: 10, ears: -0.4, head: -4 }],
      [0.1, { x: 0.05, crouch: 0.3, pitch: 7, curl: 0.55, swish: 1, tailUp: 0, ears: -0.6, head: 8 }, 'out'],
      [0.2, { x: 0.06, crouch: 0.25, pitch: 5, curl: 0.4, swish: 0.86, ears: -0.4, head: 6 }, 'io'],
      [0.44, { x: 0.04, crouch: 0.05, pitch: 0, curl: 0.05, swish: 0.08, tailUp: 4 }, 'io'],
      [0.84, {}],
    ],
    spark: [0.1],
    sparkAt: 'tail',
    gust: [0.09],
  },
  toss: {
    anticT: 0.18,
    keys: [
      [0, { sit: 0.6, hold: 0.6, throwArm: -1, pitch: -4, head: -10, ears: 0.4, tailUp: 6 }],
      [0.08, { sit: 0.55, hold: 0.6, throwArm: 1, pitch: 6, head: 8, x: 0.03, ears: 0.2 }, 'out'],
      [0.22, { sit: 0.35, hold: 0.35, throwArm: 0.55, pitch: 3, head: 4, x: 0.03 }, 'io'],
      [0.44, { sit: 0.05, hold: 0.05, throwArm: 0.05, pitch: -1, x: 0.02 }, 'io'],
      [0.76, {}],
    ],
    nut: 0.08,
  },
  chitter: {
    anticT: 0.12,
    keys: [
      [0, { sit: 0.7, hold: 0.5, pitch: -2, ears: 0.6, head: -8, tailUp: 10 }],
      [0.05, { sit: 0.75, hold: 0.5, pitch: -3, ears: 0.6, head: -12, jaw: 1, nose: 1, tailUp: 24 }, 'out'],
      [0.09, { sit: 0.75, hold: 0.5, pitch: -2, ears: 0.6, head: -8, jaw: 0.1, nose: 0.4, tailUp: 10 }],
      [0.13, { sit: 0.75, hold: 0.5, pitch: -3, ears: 0.6, head: -12, jaw: 1, nose: 1, tailUp: 24 }, 'out'],
      [0.17, { sit: 0.75, hold: 0.5, pitch: -2, ears: 0.6, head: -8, jaw: 0.1, nose: 0.4, tailUp: 10 }],
      [0.21, { sit: 0.75, hold: 0.5, pitch: -3, ears: 0.6, head: -12, jaw: 1, nose: 1, tailUp: 24 }, 'out'],
      [0.26, { sit: 0.72, hold: 0.5, pitch: -2, ears: 0.5, head: -6, jaw: 0, tailUp: 8 }],
      [0.42, { sit: 0.25, hold: 0.2, pitch: 0, ears: 0.3, head: 0, tailUp: 4 }, 'io'],
      [0.74, {}],
    ],
    chatter: [0.05, 0.13, 0.21],
  },
  roll: {
    anticT: 0.2,
    keys: [
      [0, { ball: 0.55, curl: 1.3, crouch: 0.4, pitch: 6, head: 20, reach: -0.6, ears: -0.8 }],
      [0.08, { ball: 1, curl: 2.8, x: 0.05, hop: 0.05, reach: -1, head: 40, ears: -1 }, 'out'],
      [0.52, { ball: 1, curl: 2.8, x: 0.72, hop: 0, reach: -1, head: 40, ears: -1 }, 'lin'],
      [0.62, { ball: 0.35, curl: 0.7, x: 0.78, hop: 0.06, reach: -0.3, head: 10, ears: -0.4 }, 'out'],
      [0.74, { crouch: 0.35, curl: 0.2, x: 0.78, ears: 0.3 }, 'in'],
      [1, { x: 0.75, ears: 0.1 }, 'io'],
      [1.6, {}],
    ],
    spin: [[0.04, 0.6, 1]],
    spark: [0.5],
    sparkAt: 'front',
    dust: [[0.08, 'body'], [0.3, 'body'], [0.6, 'feet']],
    lines: [0.08, 0.56],
  },
  jump: {
    anticT: 0.16,
    keys: [
      [0, { crouch: 0.7, curl: 0.5, pitch: 4, ears: 0.3, tailUp: -6 }],
      [0.12, { hop: 0.8, curl: -0.5, pitch: -14, free: 0.7, ears: -0.6, tailUp: 16 }, 'out'],
      [0.3, { hop: 0.95, curl: 0.3, pitch: 0, free: 1, ears: -0.2, tailUp: 10 }, 'out'],
      [0.48, { hop: 0.1, curl: -0.1, pitch: 10, free: 0.5, ears: 0.4 }, 'in'],
      [0.54, { crouch: 0.55, curl: 0.45, pitch: 4, ears: 0.6, tailUp: -8 }, 'out'],
      [0.68, { crouch: 0.1, curl: 0.05, pitch: -2, ears: 0.2, tailUp: 6 }, 'io'],
      [1, {}],
    ],
    dust: [[0, 'feet'], [0.54, 'feet']],
  },
  dash: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.45, curl: 0.5 }],
      [0.08, { x: 0.32, hop: 0.1, curl: -0.6, pitch: -6, free: 0.5, ears: -1, tailUp: -10 }, 'out'],
      [0.24, { x: 0.38, crouch: 0.3, curl: 0.4, pitch: 6, ears: -0.6 }, 'in'],
      [0.4, { x: 0.37, crouch: 0.05, curl: -0.05, pitch: -1, ears: 0.2 }, 'io'],
      [0.76, {}],
    ],
    lines: [0, 0.3],
    dust: [[0.02, 'feet'], [0.24, 'feet']],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.4, curl: 0.3 }],
      [0.12, { x: -0.3, hop: 0.3, curl: 0.8, pitch: -18, free: 0.6, ears: -1, tailUp: 18 }, 'out'],
      [0.3, { x: -0.34, crouch: 0.5, curl: 0.4, pitch: 4, ears: -0.4 }, 'in'],
      [0.46, { x: -0.33, crouch: 0.1, pitch: -2, ears: 0.3 }, 'io'],
      [0.84, {}],
    ],
    dust: [[0.3, 'feet']],
  },
  hurt: {
    anticT: 0,
    keys: [[0, {}], [0.05, { x: -0.06, hop: 0.06, curl: 0.7, pitch: -10, head: -14, ears: -1, jaw: 0.5, tailUp: 20 }, 'out'], [0.2, { x: -0.06, curl: 0.4, pitch: -4, head: -8, ears: -0.6, jaw: 0.1 }], [0.38, { x: -0.04, curl: 0.1, pitch: -1, ears: -0.2 }, 'io'], [0.76, {}]],
    stars: [0.05],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.1, { x: -0.05, hop: 0.3, curl: 0.6, free: 0.8, ears: -1, jaw: 0.4, head: -10 }, 'out'],
      [0.34, { x: -0.1, curl: 0.2, free: 1, flop: 1, ears: -0.8, jaw: 0.2 }, 'in'],
      [0.42, { x: -0.1, curl: 0.3, free: 1, flop: 1, ears: -0.6 }, 'out'],
      [0.98, { x: -0.1, curl: 0.25, free: 1, flop: 1, ears: -0.5 }],
      [1.2, { x: -0.08, hop: 0.12, curl: 0.6, free: 0.7, flop: 0.5, ears: -0.3 }, 'io'],
      [1.36, { x: -0.06, crouch: 0.4, curl: 0.2 }, 'in'],
      [1.66, {}],
    ],
    spin: [[0.04, 0.34, -0.5], [1, 1.36, -0.5]],
    dust: [[0.34, 'body'], [1.36, 'feet']],
    dizzy: [0.36, 1],
  },
  // Pleased: sat up, washing its face with both paws.
  wash: {
    anticT: 0.1,
    keys: [
      [0, { sit: 0.6, hold: 0.6, head: -4, ears: 0.2 }],
      [0.16, { sit: 1, hold: 1, wash: 1, head: 6, ears: -0.2 }, 'out'],
      [1, { sit: 1, hold: 1, wash: 1, head: 8, ears: -0.3 }],
      [1.2, { sit: 0.9, hold: 0.5, head: -6, ears: 0.6 }, 'io'],
      [1.42, { sit: 0.2, hold: 0.1, ears: 0.3 }, 'io'],
      [1.72, {}],
    ],
    bubbles: [0.3, 0.55, 0.8],
  },
};
export const RODENT_SHOW = ['bite', 'tailWhip', 'toss', 'chitter', 'roll', 'jump', 'dash', 'dodge', 'hurt', 'knockdown', 'wash'];
const POOL = ['bite', 'toss', 'chitter'];
const lengthOf = (mv) => mv.keys[mv.keys.length - 1][0];
const EASE = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: smoothstep, lin: (u) => u };
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
// (whole turns of the body at move time t: each [from, to, turns] eased in and out, added up)
const spinAt = (mv, t) => (mv?.spin ?? []).reduce((s, [a, b, n]) => s + n * smoothstep((t - a) / (b - a)), 0);
const since = (moments, t, len) => {
  let best = -1;
  for (const m of moments ?? []) if (t >= m && t <= m + len) best = (t - m) / len;
  return best;
};

const CH = ['x', 'lift', 'hop', 'pitch', 'crouch', 'curl', 'sit', 'ball', 'free', 'flop', 'head', 'reach', 'jaw', 'nose', 'cheeks', 'ears', 'hold', 'wash', 'throwArm', 'tailUp', 'swish'];
const EMPTY = () => sprite('rig|blankempty', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));
// (a smooth hump over [s, e] of a cycle)
const bump = (u, s0, e0) => {
  const f = wrap(u - s0);
  const len = e0 - s0;
  return f < len ? (1 - Math.cos((TAU * f) / len)) / 2 : 0;
};
// (a curve from p0 to p1 leaving with slope m0, arriving with slope m1)
const herm = (p0, p1, m0, m1, v) => {
  const v2 = v * v;
  const v3 = v2 * v;
  return (2 * v3 - 3 * v2 + 1) * p0 + (v3 - 2 * v2 + v) * m0 + (-2 * v3 + 3 * v2) * p1 + (v3 - v2) * m1;
};
// A foot through the stride: planted (sliding back under the body as it goes on), then lifted and
// carried forward to land, leaving and landing at the ground's own speed, so it never jerks; `bias`
// carries it ahead early (+, a foreleg reaching out) or holds it back late (−, a hind leg trailing).
function step(u, start, duty, cyc, liftH, bias) {
  const q = wrap(u - start);
  const reach = (cyc * duty) / 2;
  if (q < duty) return { dx: reach - 2 * reach * (q / duty), lift: 0, s: q / duty, v: -1 };
  const v = (q - duty) / (1 - duty);
  const m = (-2 * reach * (1 - duty)) / duty;
  const sn = Math.sin(Math.PI * v);
  return { dx: herm(-reach, reach, m, m, v) + bias * reach * sn * sn, lift: liftH * sn ** 1.3, s: -1, v };
}
// (a bent spine: `curl` radians from one end of the body to the other, the body's outline carried round
// the arc, the back on the outside of a bunch, the belly on the outside of a stretch)
function bendOf(curl, len) {
  const k = curl / Math.max(1, len);
  if (Math.abs(k) < 1e-5) return { pt: (p) => p, ang: () => 0 };
  const R = 1 / k;
  return {
    pt: ([x, y]) => {
      const ph = x / R;
      return [(R - y) * Math.sin(ph), R - (R - y) * Math.cos(ph)];
    },
    ang: (x) => x / R,
  };
}

// ---------- One rig for a preset ----------
function rodentRig(kind) {
  const P = RODENT_PRESETS[kind];
  const s = P.scale;
  const sc = (v) => v * s;
  const scp = (p) => [sc(p[0]), sc(p[1])];
  const defs = legDefsOf({ fore: P.fore, hind: P.hind, far: P.far }, sc);
  const pawUp = sc(P.fore.w[3] * 0.45);
  const hb = sc(defs.foreN.rest[3][1]) + pawUp;
  const LF = defs.foreN.reach;
  const xs = P.body.map((p) => p[0]);
  const bodyLen = sc(Math.max(...xs) - Math.min(...xs));
  const topY = Math.min(...P.body.map((p) => p[1]));
  const neckTop = add(P.neck.base, mul(dir(P.neck.ang * D2R), P.neck.len));
  const headTop = neckTop[1] - P.head.skull[1] - (P.ears.kind === 'round' ? 1.6 : P.ears.len * 0.6);
  const H = hb + sc(-Math.min(topY, headTop));
  const tailH = P.tail.kind === 'plume' ? sc(P.tail.seg * 5) : 0;
  const strideB = LF * 2.6;
  const strideS = LF * 1.5;
  const walkB = P.gait.walk === 'bound';
  const walkSpeed = walkB ? strideB * 1.25 : strideS * 1.8;
  const outline0 = smoothLoop(P.body, 4);
  const CURL = [-bodyLen / (sc(-topY) * 1.15), bodyLen / (sc(Math.max(...P.body.map((p) => p[1]))) * 1.15)];
  const T0 = P.tail;

  // The gaits, each a function of the stride phase u and how much it runs r: where each foot is, and
  // how the body bunches, rises and tips.
  function bound(u, r, cyc) {
    const dF = lerp(0.4, 0.3, r);
    const dH = lerp(0.5, 0.42, r);
    const hS = lerp(0.66, 0.72, r);
    const k = 0.75 + 0.5 * r;
    return {
      steps: {
        foreN: step(u, 0.4, dF, cyc, LF * 0.34, 0.5),
        foreF: step(u, 0.45, dF, cyc, LF * 0.34, 0.5),
        hindN: step(u, hS, dH, cyc, LF * 0.3, -0.45),
        hindF: step(u, hS + 0.02, dH, cyc, LF * 0.3, -0.45),
      },
      curl: (0.7 * bump(u, 0.54, 1) - 0.55 * bump(u, 0.04, 0.44)) * k,
      rise: LF * (0.78 * bump(u, 0.06, 0.46) + 0.1 * bump(u, 0.64, 0.98)) * k,
      pitch: (-8 * bump(u, -0.06, 0.3) + 10 * bump(u, 0.34, 0.68) - 3 * bump(u, 0.7, 1.02)) * k,
      surge: Math.cos(TAU * (u - 0.3)) * cyc * 0.05,
      wave: (i) => Math.sin(TAU * u - 0.9 - i * 0.7) * 12 * k,
      trail: bump(u, 0.04, 0.52),
    };
  }
  function scurry(u, r, cyc) {
    const d = lerp(0.6, 0.46, r);
    const lift = LF * (0.26 + 0.1 * r);
    const b2 = 0.5 - 0.5 * Math.cos(TAU * 2 * (u - 0.12));
    return {
      steps: {
        foreN: step(u, 0, d, cyc, lift, 0.25),
        hindF: step(u, 0.03, d, cyc, lift * 0.9, 0),
        foreF: step(u, 0.5, d, cyc, lift, 0.25),
        hindN: step(u, 0.53, d, cyc, lift * 0.9, 0),
      },
      curl: Math.sin(TAU * 2 * u) * (0.05 + 0.08 * r),
      rise: LF * b2 * (0.06 + 0.16 * r),
      pitch: Math.sin(TAU * 2 * u + 0.6) * (P.round ? 3.5 : 1.5),
      surge: 0,
      wave: (i) => Math.sin(TAU * 2 * u - i * 0.8) * 5,
      trail: 0,
    };
  }
  const boundW = (r) => (walkB ? 1 : P.gait.run === 'bound' ? smoothstep((r - 0.35) / 0.4) : 0);
  const cycleOf = (r) => lerp(strideS * (1 + 0.45 * r), strideB * (1 + 0.7 * r), boundW(r));

  function skeleton(S, a) {
    const st = a.mo.rig;
    const t = a.t;
    const w = a.walkW ?? 0;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    // (following a beat behind and settling, never snapping)
    const F = (st.rdF ??= {});
    const follow = (key, goal, k, c) => {
      const f = (F[key] ??= [goal, 0]);
      for (let n = 0; n < 2; n++) {
        f[1] += ((goal - f[0]) * k - f[1] * c) * (dt / 2);
        f[0] += f[1] * (dt / 2);
      }
      return f[0];
    };
    // (an angle: the nearest way round, so a whole turn never spins it back)
    const followA = (key, goal, k, c) => (F[key] ? follow(key, F[key][0] + wrapPi(goal - F[key][0]), k, c) : follow(key, goal, k, c));
    const u = st.rdU ?? 0;
    const r = st.rdRun ?? 0;
    const cyc = cycleOf(r);
    const bw = boundW(r);
    const gB = bw > 0 ? bound(u, r, cyc) : null;
    const gS = bw < 1 ? scurry(u, r, cyc) : null;
    const G = !gS ? gB : !gB ? gS : {
      steps: Object.fromEntries(Object.keys(gS.steps).map((k) => {
        const p = gS.steps[k];
        const q = gB.steps[k];
        return [k, { dx: lerp(p.dx, q.dx, bw), lift: lerp(p.lift, q.lift, bw), s: bw < 0.5 ? p.s : q.s, v: bw < 0.5 ? p.v : q.v }];
      })),
      curl: lerp(gS.curl, gB.curl, bw), rise: lerp(gS.rise, gB.rise, bw), pitch: lerp(gS.pitch, gB.pitch, bw), surge: lerp(gS.surge, gB.surge, bw),
      wave: (i) => lerp(gS.wave(i), gB.wave(i), bw), trail: gB.trail * bw,
    };
    const sit = clamp(S.sit, 0, 1);
    const ball = clamp(S.ball, 0, 1);
    const flop = clamp(S.flop, 0, 1);
    const free = clamp(S.free, 0, 1);
    const gw = w * (1 - sit) * (1 - ball) * (1 - flop);
    // The body: its spine bent, tipped (sitting up, tipping with each bound), and turned whole by a
    // roll or a flip.
    // (never bent so tight the belly folds through itself: a round hamster curls only so far)
    const curl = clamp(S.curl + follow('curlG', G.curl * gw, 320, 26), CURL[0], CURL[1]);
    const bend = bendOf(curl, bodyLen);
    const spinA = (a.rdSpin ?? 0) * TAU;
    const posture = (S.pitch + follow('pitchG', G.pitch * gw, 300, 26) + sit * P.sitAng) * D2R;
    const th = posture + spinA;
    const bent = outline0.map((p) => bend.pt(scp(p)));
    let cen = [0, 0];
    if (ball > 0) {
      for (const p of bent) cen = add(cen, p);
      cen = mul(cen, ball / bent.length);
    }
    const local = (p) => rot(sub(bend.pt(scp(p)), cen), th);
    // (how high its spine rides: on its legs, or resting on the ground on whatever is lowest of it,
    // its haunch sitting, curled up, or on its back; never sunk into the ground)
    let lowY = 0;
    for (const p of bent) lowY = Math.max(lowY, rot(sub(p, cen), th)[1]);
    const support = clamp(1 - Math.max(sit, ball, flop), 0, 1);
    const pLegs = hb + S.lift - clamp(S.crouch, 0, 1.2) * hb * 0.3;
    let pH = Math.max(lowY + sc(0.15), lerp(lowY + sc(0.15), pLegs, support));
    pH += S.hop + follow('rise', G.rise * gw, 300, 24);
    // (sitting up: it tips back about its seat, the seat staying put)
    const seatNow = local(P.seat);
    const shiftX = (sc(P.seat[0]) - seatNow[0]) * sit;
    const pivot = [S.x + follow('surge', G.surge * gw, 260, 26) + shiftX, -pH];
    const at = (p) => add(pivot, local(p));
    const tangent = (x) => th + bend.ang(sc(x));
    const ground = -pawUp;
    // The head: on its neck from the chest, held steadier than the body; tucked in curled up.
    const nb = at(P.neck.base);
    const reach = clamp(S.reach, -1, 1.2);
    const na = tangent(P.neck.base[0]) + (P.neck.ang + 34 * Math.max(0, reach) - 30 * Math.max(0, -reach) + sit * 30 + ball * 110) * D2R;
    const nlen = sc(P.neck.len) * (1 + 0.6 * Math.max(0, reach) - 0.45 * Math.max(0, -reach) - ball * 0.4);
    const hp = add(nb, mul(dir(na), nlen));
    const ha = followA('head', spinA + posture * 0.12 + bend.ang(sc(P.neck.base[0])) * 0.4 + (S.head + ball * 46 + (a.rdLook ?? 0)) * D2R, 230, 24);
    const headPt = (p) => add(hp, rot(scp(p), ha));
    const Hd = P.head;
    const mouth = headPt([Hd.teeth[0] - 0.3, Hd.teeth[1] + 0.2]);
    // The forepaws held up: at the chest, then at the mouth; rubbing the face; wound back over the
    // head and thrown out forward.
    const chestPaw = add(nb, rot(scp([2.2, 3.6]), posture * 0.2));
    const mouthPaw = headPt([Hd.muzzle[0] - 1.4, Hd.muzzle[1] + Hd.muzzle[3] + 1.1]);
    const behind = headPt([-3, -Hd.skull[1] - 1.6]);
    const ahead = headPt([Hd.muzzle[0] + 4, Hd.muzzle[1] + 1]);
    const hk = clamp(Math.max(S.hold * 2, S.wash, Math.abs(S.throwArm)), 0, 1);
    const heldAt = (side) => {
      let p = lerp2(chestPaw, mouthPaw, clamp(S.hold * 2 - 1, 0, 1));
      const ta = S.throwArm;
      p = ta < 0 ? lerp2(p, behind, -ta) : lerp2(p, ahead, ta);
      if (S.wash > 0) {
        const ph = t * 15 + (side ? Math.PI : 0);
        const face = headPt([Hd.muzzle[0] - 2.6, -0.4 + Math.sin(ph) * 1.4]);
        p = lerp2(p, add(face, [Math.cos(ph) * sc(1.6), 0]), clamp(S.wash, 0, 1));
      }
      return side ? add(p, scp([-0.8, -0.6])) : p;
    };
    // The legs.
    const Lg = {};
    for (const [k, L] of Object.entries(defs)) {
      const g = G.steps[k];
      const T = at(L.top);
      const fore = !L.hind;
      let foot = [sc(L.rest[3][0]) + (S.x + shiftX) * 0.35 * (1 - w) + g.dx * gw, ground - g.lift * gw];
      let a3 = L.a3;
      if (fore) a3 += gw * (g.v < 0 ? lerp(0.25, -0.5, g.s) : lerp(-0.9, 0.4, smoothstep(g.v)));
      else a3 += gw * (g.v < 0 ? -0.9 * smoothstep((g.s - 0.45) / 0.55) : lerp(-0.85, 0, smoothstep((g.v - 0.3) / 0.7)) - G.trail * 1.4 * Math.sin(Math.PI * Math.min(1, g.v / 0.6)));
      const to = (q, an, k2) => {
        if (!(k2 > 0)) return;
        foot = lerp2(foot, q, k2);
        a3 = lerp(a3, an, k2);
      };
      // (sitting: the hind feet flat under the haunch, the forepaws up at the chest)
      if (!fore) to([seatNow[0] + pivot[0] + sc(P.hind.bones[2][0] * 0.55) + (L.far ? sc(-0.6) : 0), ground], L.a3, sit);
      else to(heldAt(L.far), Math.PI - 0.5, hk);
      // (off the ground: hanging from the body, paddling on its back; curled up: tucked in)
      const hang = at([L.rest[3][0] + (fore ? 1.2 : -1.6), L.rest[3][1] - (fore ? 1.4 : 2)]);
      const paddle = flop * Math.sin(t * 13 + (fore ? 0 : 1.7) + (L.far ? 2.4 : 0)) * sc(1);
      to(add(hang, [paddle, paddle * 0.6]), L.a3 - th + (fore ? 0.4 : -0.6), free * (1 - hk));
      to(at([L.top[0] * 0.55, L.top[1] + 1]), L.a3 - th, ball);
      if (free < 0.5 && ball < 0.5) foot[1] = Math.min(foot[1], ground);
      const bones = placeLeg(L, T, foot, a3);
      Lg[k] = { hind: L.hind, ...bones, w: L.w };
    }
    // The ears: each on a spring, swinging with the head's turn, perked up or laid flat back.
    const E0 = (st.rdEar ??= { x: 0, v: 0, y: 0, u: 0, last: ha });
    const spin = dt > 0 ? wrapPi(ha - E0.last) / dt : 0;
    E0.last = ha;
    const earGoal = S.ears >= 0 ? S.ears * 16 : S.ears * 58;
    E0.v += ((earGoal - E0.x) * 200 - E0.v * 15 - spin * 30) * dt;
    E0.x = clamp(E0.x + E0.v * dt, -80, 40);
    E0.u += ((earGoal - E0.y) * 160 - E0.u * 13 - spin * 34) * dt;
    E0.y = clamp(E0.y + E0.u * dt, -80, 40);
    // The tail: a chain on springs, each piece a beat behind the one before, flowing with the gait,
    // swaying idle, flicking now and then; curled over; whipped forward.
    const tail = { kind: T0.kind };
    const rootT = at(T0.root);
    if (T0.kind === 'nub') {
      const nb2 = (st.rdNub ??= { x: 0, y: 0, u: 0, v: 0, last: rootT });
      const acc = dt > 0 ? sub(rootT, nb2.last) : [0, 0];
      nb2.last = rootT;
      nb2.u += (-nb2.x * 260 - nb2.u * 14 - acc[0] * 40) * dt;
      nb2.v += (-nb2.y * 260 - nb2.v * 14 - acc[1] * 40) * dt;
      nb2.x = clamp(nb2.x + nb2.u * dt, -sc(1.2), sc(1.2));
      nb2.y = clamp(nb2.y + nb2.v * dt, -sc(1.2), sc(1.2));
      tail.at = add(rootT, [nb2.x, nb2.y]);
      tail.ang = tangent(T0.root[0]);
    } else {
      const n = T0.ang.length;
      const pts = [rootT];
      const b0 = tangent(T0.root[0]);
      const sway = (i) => Math.sin(t * 1.3 - i * 0.55) * 4 * (1 - w);
      const flick = a.rdFlick ?? 0;
      for (let i = 0; i < n; i++) {
        const f = (i + 1) / n;
        const swish = S.swish * (T0.kind === 'plume' ? 125 : 105) * Math.min(1, (i + 1) / 3);
        const extra = S.tailUp * f + swish + G.wave(i) * gw * (T0.kind === 'string' ? 0.6 + f : 1) + sway(i) + flick * 16 * Math.sin(t * 22 - i * 0.9);
        // (curled up: a plume drapes forward over its back like a blanket; a thin tail curls round)
        let goal = b0 + (T0.ang[i] + extra) * D2R;
        if (ball > 0) goal = lerp(goal, th + (T0.kind === 'plume' ? -118 + i * 30 : [110, 70, 30, 6, 0, -4, -14, -30, -52][i]) * D2R, ball);
        const an = followA(`t${i}`, goal, (240 - i * 14) * (1 + 4 * ball), (20 - i * 0.8) * (1 + 1.2 * ball));
        const prev = pts[pts.length - 1];
        const nx = add(prev, mul(dir(an), sc(T0.seg)));
        nx[1] = Math.min(nx[1], -sc(T0.w[i + 1]) * 0.5 - 0.2);
        pts.push(nx);
      }
      tail.pts = pts;
    }
    return {
      pivot, th, posture, at, bend, legs: Lg, nb, hp, ha, headPt, mouth, earN: E0.x, earF: E0.y,
      jaw: clamp(S.jaw, 0, 1), nose: clamp(S.nose, 0, 1), cheeks: clamp(S.cheeks, 0, 1), tail, sit, ball, flop, hk,
      pts: outline0.map(at),
    };
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
  const { tubePath, tubeInto, poly } = QD;
  const glow = (ctx, c, r, k, col) => {
    const [cr, cg, cb] = hexRgb(col);
    const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
    gr.addColorStop(0, `rgba(${cr},${cg},${cb},${k})`);
    gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
  };
  // A forepaw: a little mitten with two finger bumps on its front; a hind foot's toes, round.
  const pawPath = (Lg, fore) => (c2, grow = 0) => {
    const d = sub(Lg.P, Lg.J2);
    const an = Math.atan2(d[1], d[0]);
    const w3 = Lg.w[3];
    const c = add(Lg.P, rot([w3 * (fore ? 0.2 : 0.1), 0], an));
    const rx = w3 * (fore ? 0.72 : 0.66) + grow;
    const ry = w3 * (fore ? 0.52 : 0.5) + grow;
    c2.moveTo(c[0] + Math.cos(an) * rx, c[1] + Math.sin(an) * rx);
    c2.ellipse(c[0], c[1], rx, ry, an, 0, TAU);
    for (const f of fore ? [-0.42, 0.34] : [-0.3, 0.12, 0.5]) {
      const q = add(c, rot([w3 * 0.6, w3 * f * 0.8], an));
      const rr = Math.max(0.2, w3 * 0.27 + grow);
      c2.moveTo(q[0] + rr, q[1]);
      c2.arc(q[0], q[1], rr, 0, TAU);
    }
  };
  function drawLeg(ctx, a, mode, k) {
    const sk = a.bk;
    const Lg = sk.legs[k];
    const far = k.endsWith('F');
    QD.drawLeg(ctx, mode, Lg, { far, colour: (c) => colour(a, c), tint: (c, al) => tint(a, c, al), bodyPts: far ? null : sk.pts, foot: { path: pawPath(Lg, !Lg.hind) }, unit: s * 0.7 });
  }
  // The body: the bean; the back lit, the haunch round and lit, the belly pale, a soft shade low
  // between the legs.
  function drawBody(ctx, a, mode) {
    const sk = a.bk;
    poly(ctx, sk.pts);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill();
    ctx.save();
    poly(ctx, sk.pts);
    ctx.clip();
    const [hx, hy, hr] = P.haunch;
    glow(ctx, sk.at([hx - 0.6, hy - 2.4]), sc(hr) * 1.1, 0.75, C.lt);
    glow(ctx, sk.at([1, topYOf(1) + 2.2]), sc(8), 0.7, C.lt);
    // (the pale belly: along its underside, front to back)
    const bl = Math.max(...P.body.map((p) => p[1]));
    for (const x of [-4, 0, 4]) glow(ctx, sk.at([x, bl - 1.6]), sc(4.6), 0.55, '#ffffff');
    glow(ctx, sk.at([P.fore.top[0] - 1, bl - 0.4]), sc(3.4), 0.3, C.sh);
    glow(ctx, sk.at([hx + 3.2, bl]), sc(3.6), 0.3, C.sh);
    ctx.restore();
  }
  function topYOf(x) {
    // (the back's height above the spine at x, read off the outline)
    let best = 0;
    for (const p of P.body) if (p[1] < best && Math.abs(p[0] - x) < 6) best = p[1];
    return best;
  }
  function drawNeck(ctx, a, mode) {
    const sk = a.bk;
    const pts = [sk.nb, lerp2(sk.nb, sk.hp, 0.5), sk.hp];
    tubePath(ctx, pts, pts.map(() => sc(P.neck.w)));
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
  }
  // The head's shape, in its own frame: the skull, the muzzle, the cheeks (puffing with `cheeks`),
  // and the chin, dropping as the jaw opens.
  const Hd = P.head;
  function headShape(c2, sk) {
    const [rx, ry] = Hd.skull.map(sc);
    const [mx, my, mrx, mry] = Hd.muzzle.map(sc);
    const [cx, cy, crx, cry] = Hd.cheek.map(sc);
    const puff = 1 + sk.cheeks * (Hd.pouch ?? 0.15);
    const [tx, ty] = Hd.teeth.map(sc);
    c2.moveTo(rx, 0);
    c2.ellipse(0, 0, rx, ry, 0, 0, TAU);
    c2.moveTo(mx + mrx, my);
    c2.ellipse(mx, my, mrx, mry, 0, 0, TAU);
    c2.moveTo(cx + crx * puff, cy + (puff - 1) * cry * 0.4);
    c2.ellipse(cx, cy + (puff - 1) * cry * 0.4, crx * puff, cry * puff, 0, 0, TAU);
    const chin = [tx - sc(1.8), ty + sc(0.2) + sk.jaw * sc(1.3)];
    c2.moveTo(chin[0] + sc(2.2), chin[1]);
    c2.ellipse(chin[0], chin[1], sc(2.2), sc(1.4), 0, 0, TAU);
  }
  function drawHead(ctx, a, mode) {
    const sk = a.bk;
    ctx.save();
    ctx.translate(...sk.hp);
    ctx.rotate(sk.ha);
    ctx.beginPath();
    headShape(ctx, sk);
    if (mode === 'line') {
      edge(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
    const [rx, ry] = Hd.skull.map(sc);
    const [mx, my, mrx, mry] = Hd.muzzle.map(sc);
    const [cx, cy, crx, cry] = Hd.cheek.map(sc);
    const [nx, ny, nr] = Hd.nose.map(sc);
    const [tx, ty, th0] = Hd.teeth.map(sc);
    ctx.save();
    ctx.beginPath();
    headShape(ctx, sk);
    ctx.clip('nonzero');
    glow(ctx, [-rx * 0.15, -ry * 0.45], rx * 0.85, 0.95, C.lt);
    glow(ctx, [cx + crx * 0.1, cy + cry * 0.1], crx * (0.9 + sk.cheeks * 0.4), 0.8, '#ffffff');
    glow(ctx, [mx, my - mry * 0.3], mrx * 0.9, 0.7, '#ffffff');
    glow(ctx, [-rx * 0.62, ry * 0.4], ry * 0.6, 0.4, C.sh);
    ctx.restore();
    // the mouth: a small gap opening under the nose, the buck teeth at its top
    const nz = sk.nose * Math.sin(a.t * 40) * sc(0.22);
    if (sk.jaw > 0.04) {
      ctx.beginPath();
      ctx.ellipse(tx - sc(0.5), ty + sc(0.3) + sk.jaw * sc(0.5), sc(1.3), sk.jaw * sc(0.9) + sc(0.2), 0, 0, TAU);
      ctx.fillStyle = colour(a, C.mouth);
      ctx.fill();
    }
    const tH = th0 * (0.55 + 0.45 * sk.jaw);
    for (const ox of [-0.62, 0.06]) {
      const x0 = tx + ox * sc(1.2) * (th0 / sc(1.5)) - sc(0.2);
      const wT = sc(0.62) * (th0 / sc(1.5));
      ctx.beginPath();
      ctx.moveTo(x0, ty - sc(0.4));
      ctx.lineTo(x0 + wT, ty - sc(0.4));
      ctx.lineTo(x0 + wT, ty - sc(0.4) + tH - wT * 0.4);
      ctx.quadraticCurveTo(x0 + wT, ty - sc(0.4) + tH, x0 + wT * 0.5, ty - sc(0.4) + tH);
      ctx.quadraticCurveTo(x0, ty - sc(0.4) + tH, x0, ty - sc(0.4) + tH - wT * 0.4);
      ctx.closePath();
      ctx.fillStyle = colour(a, C.tooth);
      ctx.fill();
      ctx.strokeStyle = colour(a, C.sh);
      ctx.lineWidth = Math.max(0.3, sc(0.3));
      ctx.stroke();
    }
    // the split lip from the nose down to the teeth
    ctx.strokeStyle = colour(a, C.deep);
    ctx.lineWidth = Math.max(0.35, sc(0.4));
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(nx - sc(0.3), ny + nr * 0.7 + nz);
    ctx.quadraticCurveTo(nx - sc(0.5), ty - sc(0.9), tx - sc(0.9), ty - sc(0.5));
    ctx.stroke();
    // the nose: a soft rounded triangle, twitching
    ctx.beginPath();
    ctx.moveTo(nx - nr * 1.1, ny - nr * 0.5 + nz);
    ctx.quadraticCurveTo(nx, ny - nr * 1.2 + nz, nx + nr * 1.05, ny - nr * 0.45 + nz);
    ctx.quadraticCurveTo(nx + nr * 0.6, ny + nr * 0.9 + nz, nx - nr * 0.1, ny + nr * 0.8 + nz);
    ctx.quadraticCurveTo(nx - nr * 0.9, ny + nr * 0.6 + nz, nx - nr * 1.1, ny - nr * 0.5 + nz);
    ctx.fillStyle = colour(a, C.nose);
    ctx.fill();
    glow(ctx, [nx - nr * 0.2, ny - nr * 0.35 + nz], nr * 0.6, 0.7, '#ffffff');
    // faint whiskers fanning from the muzzle, twitching with the nose
    ctx.strokeStyle = colour(a, C.guide);
    ctx.lineWidth = Math.max(0.3, sc(0.32));
    for (let i = 0; i < 3; i++) {
      const y0 = my + mry * (0.05 + i * 0.22);
      const x0 = mx + mrx * 0.35;
      const sp = (i - 1) * 0.22 + nz * 0.4;
      const L = sc(5.4) - i * sc(0.6);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x0 + L * 0.5, y0 + L * (sp - 0.04), x0 + L * Math.cos(sp), y0 + L * Math.sin(sp) + sc(0.5));
      ctx.stroke();
    }
    // the soft line where the eyes go
    ctx.strokeStyle = colour(a, C.guide);
    ctx.lineWidth = Math.max(0.35, sc(0.45));
    ctx.beginPath();
    ctx.moveTo(rx * 0.12, -ry * 0.08);
    ctx.quadraticCurveTo(rx * 0.42, -ry * 0.24, rx * 0.7, -ry * 0.05);
    ctx.stroke();
    ctx.restore();
  }
  // An ear, in the head's frame: from its base on the skull along its angle.
  function earPath(c2, base, an, grow = 0) {
    const E0 = P.ears;
    const L = sc(E0.len) + grow;
    const W = sc(E0.w) / 2 + grow;
    const R = (p) => add(base, rot(p, an));
    if (E0.kind === 'tall') {
      const p = [[0, -W], [L * 0.55, -W * 0.95], [L * 0.95, -W * 0.45], [L, 0], [L * 0.92, W * 0.5], [L * 0.5, W * 0.85], [0, W]].map(R);
      c2.moveTo(...p[0]);
      c2.quadraticCurveTo(...p[1], ...p[2]);
      c2.quadraticCurveTo(...p[3], ...p[4]);
      c2.quadraticCurveTo(...p[5], ...p[6]);
      c2.closePath();
      if (E0.tuft) {
        const tf = sc(E0.tuft);
        tubeInto(c2, [R([L * 0.7, -W * 0.1]), R([L + tf * 0.5, -tf * 0.25]), R([L + tf, -tf * 0.55])], [W * 1.1 + grow * 2, W * 0.7 + grow * 2, W * 0.32 + grow * 2]);
      }
    } else {
      const k = E0.kind === 'big' ? 0.52 : 0.6;
      const c = R([L * k, 0]);
      c2.moveTo(c[0] + L * k, c[1]);
      c2.ellipse(c[0], c[1], L * k, W, an, 0, TAU);
    }
  }
  function drawEar(ctx, a, mode, side) {
    const sk = a.bk;
    const E0 = P.ears;
    const far = side === 'far';
    const base = scp(far ? E0.far : E0.near);
    const an = (E0.ang + (far ? sk.earF : sk.earN) + (far ? -8 : 0)) * D2R;
    ctx.save();
    ctx.translate(...sk.hp);
    ctx.rotate(sk.ha);
    ctx.beginPath();
    earPath(ctx, base, an);
    if (mode === 'line') {
      edge(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = colour(a, far ? C.sh : C.base);
    ctx.fill('nonzero');
    // the pale inside, off the base
    const L = sc(E0.len);
    const W = sc(E0.w) / 2;
    ctx.save();
    ctx.beginPath();
    earPath(ctx, base, an);
    ctx.clip('nonzero');
    const k = E0.kind === 'tall' ? 0.5 : E0.kind === 'big' ? 0.52 : 0.62;
    const ic = add(base, rot([L * k + sc(0.4), W * 0.1], an));
    ctx.beginPath();
    ctx.ellipse(ic[0], ic[1], L * k * (E0.kind === 'tall' ? 0.8 : 0.72), W * 0.62, an, 0, TAU);
    ctx.fillStyle = far ? tint(a, C.deep, 0.5) : colour(a, C.inner);
    ctx.fill();
    if (!far) glow(ctx, add(base, rot([L * 0.2, -W * 0.5], an)), W * 1.1, 0.6, C.lt);
    ctx.restore();
    ctx.restore();
  }
  // The tail.
  function plumeOutline(sk) {
    const T = sk.tail;
    const sp = smoothChain(T.pts, 4);
    const n = sp.length;
    const wAt = (i) => {
      const f = (i / (n - 1)) * (T0.w.length - 1);
      const j = Math.min(T0.w.length - 2, Math.floor(f));
      return sc(lerp(T0.w[j], T0.w[j + 1], f - j));
    };
    const L = [];
    const R = [];
    for (let i = 0; i < n; i++) {
      const p = sp[i];
      const q = sp[Math.min(n - 1, i + 1)];
      const o = sp[Math.max(0, i - 1)];
      const d = sub(q, o);
      const len = Math.hypot(...d) || 1;
      const nn = [-d[1] / len, d[0] / len];
      // (a soft ripple of fur along each side, never spiky)
      const fur = 1 + 0.07 * Math.sin(i * 1.7);
      const hw = (wAt(i) / 2) * fur;
      L.push(add(p, mul(nn, hw)));
      R.push(add(p, mul(nn, -hw * (1 + 0.05 * Math.cos(i * 2.1)))));
    }
    // (round at the tip)
    const tip = sp[n - 1];
    const td = sub(sp[n - 1], sp[n - 2]);
    const tl = Math.hypot(...td) || 1;
    const cap = add(tip, mul(td, (wAt(n - 1) * 0.42) / tl));
    return { pts: [...L, cap, ...R.reverse()], sp, wAt };
  }
  function drawTail(ctx, a, mode) {
    const sk = a.bk;
    const T = sk.tail;
    if (T.kind === 'nub') {
      ctx.beginPath();
      ctx.ellipse(T.at[0], T.at[1], sc(T0.r) * 1.15, sc(T0.r), T.ang, 0, TAU);
      if (mode === 'line') return edge(ctx);
      ctx.fillStyle = colour(a, C.base);
      ctx.fill();
      return;
    }
    if (T.kind === 'string') {
      const sp = smoothChain(T.pts, 3);
      const wl = sp.map((_, i) => {
        const f = (i / (sp.length - 1)) * (T0.w.length - 1);
        const j = Math.min(T0.w.length - 2, Math.floor(f));
        return sc(lerp(T0.w[j], T0.w[j + 1], f - j));
      });
      tubePath(ctx, sp, wl);
      if (mode === 'line') return edge(ctx);
      ctx.fillStyle = colour(a, C.sh);
      ctx.fill('nonzero');
      tubePath(ctx, sp.map((p) => add(p, [0, -sc(0.15)])), wl.map((v) => v * 0.45));
      ctx.fillStyle = colour(a, C.base);
      ctx.fill('nonzero');
      return;
    }
    const { pts, sp, wAt } = plumeOutline(sk);
    poly(ctx, smoothLoop(pts, 2));
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill();
    ctx.save();
    poly(ctx, smoothLoop(pts, 2));
    ctx.clip();
    // (the fur's soft light down the middle, a shade along its under side)
    tubePath(ctx, sp.map((p) => add(p, [0, -sc(0.6)])), sp.map((_, i) => wAt(i) * 0.5));
    ctx.fillStyle = tint(a, C.lt, 0.85);
    ctx.fill('nonzero');
    for (let i = 2; i < sp.length; i += 3) {
      const d = sub(sp[i], sp[i - 2]);
      const len = Math.hypot(...d) || 1;
      const side = d[0] / len > 0 ? 1 : -1;
      glow(ctx, add(sp[i], mul([-d[1] / len, d[0] / len], wAt(i) * 0.45 * side)), wAt(i) * 0.42, 0.45, C.sh);
    }
    ctx.restore();
  }
  // The near forepaw held up in front of it: wherever it lies over the body or the face, its own soft
  // deeper edge (like the near wing over a bird), the same all round, so it reads as one little hand.
  function drawHands(ctx, a, mode) {
    const sk = a.bk;
    if (mode === 'line') return;
    // (only while its paw is truly up; fading as it comes down, so a leg standing on the ground never
    // shows on the body)
    const up = smoothstep((sk.hk - 0.45) / 0.3);
    if (up <= 0.01) {
      if (sk.nutAt) drawNut(ctx, sk.nutAt, sk.nutSpin ?? 0);
      return;
    }
    const Lg = sk.legs.foreN;
    const [lp, lw] = QD.limb([Lg.J1, Lg.J2, Lg.P], [Lg.w[1], Lg.w[2], Lg.w[3]], 4);
    const hand = (grow) => {
      tubePath(ctx, lp, lw, grow);
      pawPath(Lg, true)(ctx, grow);
    };
    const paint = () => {
      // (first its colour a touch wider, over any line drawn under it, then its edge, then itself)
      hand(1.2);
      ctx.fillStyle = colour(a, C.base);
      ctx.fill('nonzero');
      hand(0);
      ctx.strokeStyle = colour(a, C.deep);
      ctx.lineWidth = 1.7;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.fill('nonzero');
      ctx.save();
      hand(0);
      ctx.clip('nonzero');
      // (round, not flat: shaded along its underside, lit on its knuckles)
      glow(ctx, add(lerp2(Lg.J2, Lg.P, 0.4), [0, Lg.w[2] * 0.5]), Lg.w[2] * 1.3, 0.55, C.sh);
      glow(ctx, add(Lg.P, [Lg.w[3] * 0.2, -Lg.w[3] * 0.3]), Lg.w[3] * 1.1, 0.9, C.lt);
      ctx.restore();
    };
    const headPath = () => {
      ctx.save();
      ctx.translate(...sk.hp);
      ctx.rotate(sk.ha);
      ctx.beginPath();
      headShape(ctx, sk);
      ctx.restore();
    };
    ctx.save();
    ctx.globalAlpha = up;
    // over the body
    ctx.save();
    poly(ctx, sk.pts);
    ctx.clip();
    paint();
    ctx.restore();
    // over the head and the neck, off the body
    ctx.save();
    headPath();
    tubeInto(ctx, [sk.nb, sk.hp], [sc(P.neck.w), sc(P.neck.w)]);
    ctx.clip('nonzero');
    poly(ctx, sk.pts);
    ctx.rect(-1e4, -1e4, 2e4, 2e4);
    ctx.clip('evenodd');
    paint();
    ctx.restore();
    ctx.restore();
    // (and the nut in front of its paws)
    if (sk.nutAt) drawNut(ctx, sk.nutAt, sk.nutSpin ?? 0);
  }
  // A nut: an acorn (a cap over a round nut), a striped seed, or a berry.
  function drawNut(ctx, [x, y], spin) {
    const r = sc(1.7);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = OUTLINE;
    ctx.lineJoin = 'round';
    if (P.nut === 'acorn') {
      ctx.beginPath();
      ctx.ellipse(0, r * 0.25, r * 0.85, r * 1.05, 0, 0, TAU);
      ctx.fillStyle = C.sh;
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.45, r * 1.05, r * 0.55, 0, Math.PI, TAU);
      ctx.lineTo(r * 1.05, -r * 0.3);
      ctx.lineTo(-r * 1.05, -r * 0.3);
      ctx.closePath();
      ctx.fillStyle = C.deep;
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.95);
      ctx.lineTo(r * 0.15, -r * 1.35);
      ctx.stroke();
    } else if (P.nut === 'seed') {
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.2);
      ctx.quadraticCurveTo(r * 0.95, -r * 0.2, 0, r * 1.1);
      ctx.quadraticCurveTo(-r * 0.95, -r * 0.2, 0, -r * 1.2);
      ctx.fillStyle = C.sh;
      ctx.stroke();
      ctx.fill();
      ctx.strokeStyle = C.lt;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.lineTo(0, r * 0.8);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fillStyle = C.deep;
      ctx.stroke();
      ctx.fill();
      glow(ctx, [-r * 0.3, -r * 0.35], r * 0.55, 0.9, '#ffffff');
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 0.3, -r * 1.5, r * 0.7, -r * 1.4);
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- Effects: sparkles, a gust, chatter, stars, bubbles, dust, speed lines, a thrown nut ----------
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
    if (what === 'teeth') return sk.mouth;
    if (what === 'tail') return sk.tail.pts ? sk.tail.pts[sk.tail.pts.length - 1] : sk.tail.at;
    if (what === 'feet') return lerp2(sk.legs.hindN.P, sk.legs.foreN.P, 0.5);
    if (what === 'front') return add(sk.pivot, [sc(9), 0]);
    if (what === 'body') return [sk.pivot[0], 0];
    return sk.hp;
  };
  // (where the thrown nut is, `k` 0..1 through its flight: out ahead in an arc to the ground)
  const nutFlight = (sk, start, k) => {
    const end = [start[0] + sc(46), -sc(1.7)];
    return [lerp(start[0], end[0], k), lerp(start[1], end[1], k * k) - sc(12) * 4 * k * (1 - k)];
  };
  function drawFx(ctx, m, a) {
    const sk = a.bk;
    const mv = a.rdMove?.mv;
    const t = a.rdMove?.t ?? 0;
    if (!mv) return;
    ctx.save();
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
    for (const g0 of mv.gust ?? []) {
      const gp = since([g0], t, 0.3);
      if (gp < 0) continue;
      const [gx, gy] = spot(sk, 'tail');
      ctx.globalAlpha = (1 - gp) * 0.8;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = sc(0.9);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(gx + sc(3 + gp * 9), gy + sc((i - 1) * 3), sc(3 + i), -0.9, 0.9);
        ctx.stroke();
      }
    }
    for (const c0 of mv.chatter ?? []) {
      const cp = since([c0], t, 0.24);
      if (cp < 0) continue;
      const [mx, my] = sk.mouth;
      ctx.globalAlpha = 1 - cp;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = sc(0.8);
      for (let i = 0; i < 3; i++) {
        const q = -0.7 + i * 0.5;
        const r0 = sc(2.6 + cp * 4);
        ctx.beginPath();
        ctx.moveTo(mx + Math.cos(q) * r0, my + Math.sin(q) * r0);
        ctx.lineTo(mx + Math.cos(q) * (r0 + sc(2.2)), my + Math.sin(q) * (r0 + sc(2.2)));
        ctx.stroke();
      }
    }
    if (mv.nut !== undefined && t >= mv.nut) {
      const k = (t - mv.nut) / 0.5;
      if (k <= 1) drawNut(ctx, nutFlight(sk, a.rdRelease ?? sk.hp, k), k * 9);
      else if (k < 1.5) {
        const [gx] = nutFlight(sk, a.rdRelease ?? sk.hp, 1);
        for (let i = 0; i < 3; i++) puffAt(ctx, gx + sc((i - 1) * 2.4) * (k - 0.6), -sc(1 + i % 2) - sc(2) * (k - 1), sc(1.2), (1.5 - k) * 1.6);
      }
    }
    for (const s0 of mv.stars ?? []) {
      const sp = since([s0], t, 0.5);
      if (sp < 0) continue;
      ctx.globalAlpha = 1 - sp;
      for (let i = 0; i < 3; i++) {
        const q = -Math.PI / 2 + (i - 1) * 0.8;
        const d = sc(7 + sp * 7);
        star(ctx, sk.hp[0] + Math.cos(q) * d, sk.hp[1] + Math.sin(q) * d, sc(1.6) * (1 - sp * 0.4), sp * 2 + i, i === 1 ? '#fff2a8' : '#ffffff');
      }
    }
    if (mv.dizzy && t >= mv.dizzy[0] && t <= mv.dizzy[1]) {
      const k = (t - mv.dizzy[0]) / (mv.dizzy[1] - mv.dizzy[0]);
      ctx.globalAlpha = Math.min(1, k * 6, (1 - k) * 6);
      const [cx, cy] = sk.hp;
      for (let i = 0; i < 3; i++) {
        const q = t * 7 + (i * TAU) / 3;
        star(ctx, cx + Math.cos(q) * sc(7), cy + sc(3) + Math.sin(q) * sc(2.2), sc(1.4), q, i ? '#ffffff' : '#fff2a8');
      }
    }
    for (const b0 of mv.bubbles ?? []) {
      const bp = since([b0], t, 0.8);
      if (bp < 0) continue;
      const [fx0, fy0] = sk.headPt([Hd.muzzle[0] - 1, -1]);
      for (let i = 0; i < 2; i++) {
        ctx.globalAlpha = (1 - bp) * 0.9;
        const bx = fx0 + sc(2 + i * 3) + Math.sin(bp * 9 + i) * sc(1.2);
        const by = fy0 - sc(2 + bp * 12 + i * 2);
        ctx.beginPath();
        ctx.arc(bx, by, sc(1 + i * 0.4), 0, TAU);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fill();
        ctx.strokeStyle = '#d6cbe6';
        ctx.lineWidth = sc(0.3);
        ctx.stroke();
        glow(ctx, [bx - sc(0.3), by - sc(0.3)], sc(0.5), 1, '#ffffff');
      }
    }
    for (const [d0, where] of mv.dust ?? []) {
      const dp = since([d0], t, 0.4);
      if (dp < 0) continue;
      const [gx] = spot(sk, where);
      const e = 1 - (1 - dp) ** 2;
      for (let i = 0; i < 4; i++) {
        const side = i < 2 ? -1 : 1;
        puffAt(ctx, gx + side * sc(2 + (i % 2) * 3) * (0.4 + e), -sc(1 + (i % 2)) - e * sc(2.4), sc(1.3 + (i % 2) * 0.6) * (0.6 + 0.6 * e), (1 - dp) * 0.85);
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
        ctx.moveTo(sk.pivot[0] - sc(14) - sc(6) * k, y);
        ctx.lineTo(sk.pivot[0] - sc(24) - sc(10) * k, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    if (m.act && RODENT_MOVES[m.act.name]) {
      const mv = RODENT_MOVES[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + lengthOf(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.rdAtk) {
        const pool = m.def.moves ?? POOL;
        st.rdN = (st.rdN ?? m.uid) + 1;
        st.rdPick = m.move ?? pool[st.rdN % pool.length];
      }
      st.rdAtk = true;
      const mv = RODENT_MOVES[st.rdPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.rdAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lengthOf(RODENT_MOVES.hurt)) return [RODENT_MOVES.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < lengthOf(RODENT_MOVES.wash)) return [RODENT_MOVES.wash, gl, 1];
    return [null, 0, 0];
  }
  const live = (name, draw) => ({ name, draw });
  const seq = [
    live('earF', (ctx, a, mode) => drawEar(ctx, a, mode, 'far')),
    live('tail', drawTail),
    live('foreF', (ctx, a, mode) => drawLeg(ctx, a, mode, 'foreF')),
    live('hindF', (ctx, a, mode) => drawLeg(ctx, a, mode, 'hindF')),
    live('body', drawBody),
    live('hindN', (ctx, a, mode) => drawLeg(ctx, a, mode, 'hindN')),
    live('foreN', (ctx, a, mode) => drawLeg(ctx, a, mode, 'foreN')),
    live('neck', drawNeck),
    live('head', drawHead),
    live('earN', (ctx, a, mode) => drawEar(ctx, a, mode, 'near')),
    live('hands', drawHands),
  ];
  const parts = [...seq.map((p) => ({ name: p.name, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a) => p.draw(ctx, a, 'line') })), ...seq.map((p) => ({ name: `${p.name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a) => p.draw(ctx, a, 'fill') }))];
  const RW = Math.ceil(bodyLen * 3.4 + sc(30));
  const RH = Math.ceil((H + tailH) * 1.7);
  const rig = makeRig({
    w: RW,
    h: RH,
    soft: true,
    stride: strideB,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, c === 'jaw' ? [520, 34] : c === 'nose' ? [600, 30] : c === 'ears' ? [240, 22] : c === 'head' || c === 'reach' ? [200, 24] : c === 'hold' || c === 'wash' || c === 'throwArm' ? [230, 25] : [170, 21]])),
    walkStiff: { x: [400, 36], lift: [900, 60], pitch: [400, 38], curl: [400, 38], head: [260, 28] },
    fast: CH.filter((c) => !['head', 'tailUp', 'ears', 'nose'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.rdActive),
    kick: { pitch: -36, head: 44, curl: 2 },
    turnKick: { pitch: 12 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.1;
      const dt = Math.max(1e-3, a.dt);
      const odo = m.odo ?? 0;
      const raw = Math.min(400, Math.abs(odo - (st.rdOdo ?? odo)) / dt);
      st.rdOdo = odo;
      st.rdV = (st.rdV ?? 0) + (raw - (st.rdV ?? 0)) * Math.min(1, dt * 5);
      const v = st.rdV;
      st.rdRun = clamp((v - walkSpeed * 1.15) / (walkSpeed * 0.9), 0, 1);
      st.rdU = ((st.rdU ?? 0) + (v / cycleOf(st.rdRun)) * dt) % 1;
      // Standing about: breathing; the nose twitching in bursts of sniffing; quick glances (a
      // rodent looks in little jerks, then holds still); the ears turning; a tail flick now and
      // then; every so often sitting up to have a look round.
      const breath = Math.sin(t * 4.2);
      const rnd = (n) => {
        const q = Math.sin(n * 12.9898 + (m.uid % 97) * 78.233) * 43758.5453;
        return q - Math.floor(q);
      };
      const per = 1.5;
      const blk = Math.floor(t / per);
      const look = lerp(rnd(blk - 1), rnd(blk), smoothstep(((t / per) % 1) / 0.08)) * 2 - 1;
      const sniff = hold(t % 3.1, 0.2, 0.35, 1.3, 1.5);
      const peek = hold(t % 12.5, 6, 6.5, 7.9, 8.5);
      a.rdFlick = hold(t % 5.3, 2, 2.08, 2.5, 2.8) * (1 - a.walkW);
      a.rdLook = 0;
      const idle = {
        x: 0, lift: breath * 0.14, hop: 0, pitch: -1 - peek * 4, crouch: 0, curl: 0.05 + breath * 0.02, sit: peek * 0.9, ball: 0, free: 0, flop: 0,
        head: look * 9 - peek * 6, reach: 0, jaw: 0, nose: sniff * (0.5 + 0.5 * Math.sin(t * 34)), cheeks: 0, ears: 0.15 + peek * 0.7 + look * 0.1,
        hold: peek * 0.5, wash: 0, throwArm: 0, tailUp: peek * 8, swish: 0,
      };
      const walk = { ...idle, sit: 0, hold: 0, pitch: 0, head: look * 3, ears: 0.1, nose: 0.3, curl: 0, tailUp: 0 };
      const [mv, mt, anticW] = moveNow(m, a, st);
      const base = {};
      for (const c of CH) base[c] = idle[c] * (1 - a.walkW) + walk[c] * a.walkW;
      base.x /= H;
      base.hop /= H;
      const out = mv ? poseAt(mv, mt, anticW, base) : { ...base };
      if (m.pose === 'sit') Object.assign(out, { sit: 1, hold: 0.5, pitch: 0, head: look * 8 - 4, ears: 0.5, curl: 0.1 });
      else if (m.pose === 'eat') {
        const nib = 0.5 - 0.5 * Math.cos(t * 17);
        Object.assign(out, { sit: 1, hold: 1, pitch: 0, head: 10 + nib * 2, ears: 0.2, jaw: nib * 0.6, cheeks: 0.35 + nib * 0.25, nose: 0.5 + 0.5 * Math.sin(t * 30), curl: 0.15 });
      } else if (m.pose === 'sleep') Object.assign(out, { ball: 0.85, curl: 2.7 + breath * 0.04, pitch: 4, head: 34, reach: -0.9, ears: -0.7, tailUp: 34, sit: 0, hold: 0, nose: 0 });
      if (m.hp <= 0) Object.assign(out, { ball: 0.5, curl: 1.4, pitch: 10, head: 20, reach: -0.5, ears: -0.8, jaw: 0.2, sit: 0, hold: 0 });
      st.rdActive = Boolean(mv);
      a.rdMove = mv ? { mv, t: mt } : null;
      // (whole turns: followed closely, the short way round if a move is cut off mid-turn)
      const spinGoal = mv ? spinAt(mv, mt) * TAU : 0;
      st.rdSpinA = (st.rdSpinA ?? spinGoal) + wrapPi(spinGoal - (st.rdSpinA ?? spinGoal)) * Math.min(1, dt * 30);
      a.rdSpin = st.rdSpinA / TAU;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = out.x * H;
      res.hop = out.hop * H;
      return res;
    },
    under: (ctx, m, a, S) => {
      const sk = skeleton(S, a);
      // (a nut in its paws: eating, or held ready to throw until it lets go)
      const mv = a.rdMove?.mv;
      const t = a.rdMove?.t ?? 0;
      const pa = sk.legs.foreN.P;
      const pf = sk.legs.foreF.P;
      if (m.pose === 'eat' && !mv) sk.nutAt = add(lerp2(pa, pf, 0.5), [sc(1), -sc(1.4)]);
      else if (mv?.nut !== undefined && t < mv.nut) {
        sk.nutAt = add(pa, [sc(0.6), -sc(1.6)]);
        sk.nutSpin = 0;
        a.mo.rig.rdRelease = sk.nutAt;
      }
      a.rdRelease = a.mo.rig.rdRelease;
      a.bk = sk;
    },
    parts,
    fx: (ctx, m, a) => drawFx(ctx, m, a),
  });
  const still = () => ({ w: RW, h: RH, res: 3, shapes: [E(RW / 2, RH - hb - sc(4), bodyLen * 0.5, sc(7), C.base), E(RW / 2 + sc(9), RH - hb - sc(12), sc(P.head.skull[0]), sc(P.head.skull[1]), C.base)] });
  return { rig, still, stride: strideB, speed: walkSpeed, H, w: Math.round(bodyLen * 1.4), h: Math.round(H * 1.1), moves: P.moves };
}

export const RODENT_ARTS = {};
export const RODENT_DEFS = {};
for (const kind of RODENT_KINDS) {
  const r = rodentRig(kind);
  RODENT_ARTS[`blank_${kind}`] = { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig };
  RODENT_DEFS[kind] = { id: `blank_${kind}`, name: `Blank ${kind}`, art: `blank_${kind}`, w: r.w, h: r.h, speed: r.speed, hp: 100, fight: { windup: 0.5 }, bodyH: r.H, beast: true, moves: r.moves };
}
