// The Sky Seahorse's body (2026-11-27): a copy of the fish base (render/mobs/blankfish.js), its seahorse,
// kept here so the base itself stays clean (the player: "never edit the bases just copy the base and edit
// that"). What this copy changes: a dress, `look` (dressedSeahorse(look)):
//   look.C      its own colours over the base's (lt, base, sh, deep, guide, ...)
//   look.ink    its own soft outline colour (never near-black)
//   look.face   (ctx, a, sk, KIT, at) its face on the head, in place of the base's guides (at(x, y): a
//               point in the head's own frame, base units, the snout to the right)
//   look.over / look.under  { part: (ctx, a, mode, KIT) } round the parts pecF, mouth, anal, tail,
//               dorsal, body, head, pecN (both passes: mode 'line' its outline, 'fill' itself)
//   look.pose   (m, a, out, KIT, mv, mt) its act on the base's channels
//   look.fx     (ctx, m, a, KIT) extras over everything (KIT.mirrored(a): drawn turned back to front)
// KIT: { C, tone, H, sc, mirrored }; the skeleton is a.fk (head: { centre, hA, rx, ry, tip, sd, sv },
// along(s, off), S, jaw ...).
//
// The base's own notes follow.
// The fish base (2026-11-25): blank chibi swimmers that float through the air, made for a fish from
// the start, nothing carried over from another base; only the engine is shared (rig.js's springs).
// Drawn live like the other blank bases: one smooth shape over its bones, outlined only on its outer
// edge (an outline pass, then a fill pass), in a soft ink, never near-black.
//
// The body, side on, facing right:
//   spine   a chain of joints from the nose (or the seahorse's head) to the tail's root (or the
//           tip of its tail), each with its own girth over the back and under the belly; the body
//           is one smooth outline over them. It turns about its middle (`pitch`), curls toward the
//           back or the belly (`bend`), nods its head end (`head`); the seahorse's tail curls up
//           tighter or lets go (`curl`)
//   swim    a travelling wave runs down the spine from the middle to the tail fin, its phase run
//           on by the distance swum (never the clock), so it never looks as if it slides: about two
//           to three tail beats a second at its own speed (the whale slower and heavier); at rest a
//           slow scull. The head recoils a touch against each beat. The seahorse swims upright,
//           leaning in, its dorsal fin fluttering
//   fins    pectorals (near over the body, far behind it), a dorsal (an anal fin under the round
//           fish), the tail fin; each rooted inside the body and carried on its own damped spring,
//           so the body's starts, stops and turns swing them on, overshooting and settling. Fins
//           spread out (`fins` +), or tuck back flat (`fins` −); the dorsal raises or folds
//           (`dorsal`); the tail fans (`spread`)
//   head    the round fish's big head with its wide mouth (the jaw drops about its hinge, `jaw`);
//           the whale calf's big round head with its long mouth line and a blowhole spot; the
//           seahorse's own head on its curved neck, a tube snout and a little crown. Faceless: a
//           soft line where the eyes go, a centre line down the side, a mouth guide, a gill line
//           that breathes (`gill`)
//   turning it mirrors round as the other bases do, but staying level and never on the spot: a
//           quick swish of the tail first, the flip, then a little overshoot wiggle the new way,
//           settling
// Presets: a round fish (chubby, a big head and a wide mouth; a small dorsal, pectorals, a fan
// tail), a seahorse (upright: a head on a curved neck, a round belly, a tail curling under into a
// spiral, a fluttering dorsal), a whale calf (a big round head, a tapering body, flukes, small
// flippers, a blowhole; heavier and slower).
// Moves (FISH_MOVES): chomp (the round fish), tail slap (the tail whipping round over the back),
// tail whip (the seahorse's tail uncurling forward), ram, bubble spit, spout (the whale), leap,
// dash, dodge, hurt, knockdown (tumbling over backward, dazed, righting itself); a happy wiggle
// when pleased. Poses (m.pose): rest (drifting, fins slow), curl (the seahorse curled up tight,
// a fish curled round), sleep (sinking slowly, settled; a nap in the game is the same).

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { hold } from '../mobs/kidrig.js';
import { E } from '../mobs/kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299' };
// (the soft ink: a deeper lilac with a touch of plum; and the inside of an open mouth)
const INK = '#7f6982'; // (the bases' shared soft ink, as the deertaur's)
const GULLET = '#b3a6c8';
// (the dress in use: set as the rig is built)
let DRESS = {};

const ease = (u) => {
  const v = Math.min(1, Math.max(0, u));
  return v * v * (3 - 2 * v);
};
const mix = (a, b, u) => a + (b - a) * u;
const plus = (p, q) => [p[0] + q[0], p[1] + q[1]];
const minus = (p, q) => [p[0] - q[0], p[1] - q[1]];
const times = (p, k) => [p[0] * k, p[1] * k];
const between = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
const dirOf = (an) => [Math.cos(an), Math.sin(an)];
const turned = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const unit = ([x, y]) => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};
const wrapPi = (v) => Math.atan2(Math.sin(v), Math.cos(v));
const frac = (v) => v - Math.floor(v);
const rgbOf = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
// A closed smooth curve through every point (each span a cubic whose ends lean along the
// neighbours, so the curve passes through the points with no corners).
function loopPath(ctx, pts) {
  const k = pts.length;
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < k; i++) {
    const a0 = pts[(i + k - 1) % k];
    const a1 = pts[i];
    const a2 = pts[(i + 1) % k];
    const a3 = pts[(i + 2) % k];
    ctx.bezierCurveTo(a1[0] + (a2[0] - a0[0]) / 6, a1[1] + (a2[1] - a0[1]) / 6, a2[0] - (a3[0] - a1[0]) / 6, a2[1] - (a3[1] - a1[1]) / 6, a2[0], a2[1]);
  }
  ctx.closePath();
}
// The same through an open run of points (a guide line).
function linePath(ctx, pts) {
  const k = pts.length;
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < k - 1; i++) {
    const a0 = pts[Math.max(0, i - 1)];
    const a1 = pts[i];
    const a2 = pts[i + 1];
    const a3 = pts[Math.min(k - 1, i + 2)];
    ctx.bezierCurveTo(a1[0] + (a2[0] - a0[0]) / 6, a1[1] + (a2[1] - a0[1]) / 6, a2[0] - (a3[0] - a1[0]) / 6, a2[1] - (a3[1] - a1[1]) / 6, a2[0], a2[1]);
  }
}

// ---------- The fish (units: game px at scale 1; x forward, y down; about the middle) ----------
// spine: joints from the nose (the seahorse: its head) to the tail's root (its tail's tip):
//   [x, y, girth over the back, girth under the belly]; `pivot` the joint it turns about.
// nose: how far the blunt front reaches past the first joint.
// mouth: `lip` where the lips meet round the front (degrees from straight ahead, + toward the
//   back), `hinge` [along the spine from the nose, off the centre line (+ toward the back)], `jaw`
//   how far it drops open (degrees).
// pec: the pectoral fins: [along, off] root, length, width, rest angle (degrees from forward,
//   + toward the belly), how far it sculls, its angle tucked back and spread out.
// dorsal / anal: a sail rooted along [s0, s1] on the back / belly: height, lean back (degrees).
// tail: the tail fin at the last joint: 'fan' or 'flukes', length, half width at its root, half
//   its spread (degrees), how deep the notch in its edge (1 none).
// guides: eye [along, off], gill (along), centre [from, to] (along), blowhole (along).
// swim: amp (degrees each joint bends at the tail), fin (how much more the tail fin swings), lag
//   (radians between joints), beats (a second at its speed), idle (beats a second at rest), scull
//   (fin strokes a second at rest), paddle (degrees the pectorals stroke swimming), recoil (degrees
//   the head yaws against each beat), bob (px up and down with each beat).
// turn: [seconds of the swish before the flip, seconds of the wiggle after, degrees of swish].
const ROUNDFISH = {
  name: 'Round fish',
  scale: 1,
  spine: [[11, 0.8, 6.2, 5.8], [7, -0.2, 9.4, 8.8], [2, -0.6, 10.4, 9.8], [-3, -0.4, 9.6, 9], [-7.6, 0, 7, 6.4], [-11.6, 0.3, 4, 3.7], [-14.4, 0.2, 2.4, 2.2]],
  pivot: 2,
  nose: 2.6,
  mouth: { lip: -10, hinge: [7.6, -1.8], jaw: 34 },
  pec: { at: [10.6, -2.2], len: 6, w: 4.2, ang: 142, scull: 22, tuck: 170, out: 96 },
  dorsal: { s0: 12.6, s1: 20.4, h: 5.2, lean: 30 },
  anal: { s0: 17.6, s1: 22.2, h: 3.2, lean: 38 },
  tail: { kind: 'fan', len: 8.8, w: 2.4, spread: 30, notch: 0.86 },
  guides: { eye: [4.6, 4], gill: 9.6, centre: [15.6, 24] },
  swim: { amp: 19, fin: 1.9, lag: 0.85, beats: 2.6, idle: 0.55, scull: 0.9, paddle: 24, recoil: 4, bob: 0.8 },
  speed: 26,
  lean: 2,
  swimFins: -0.15,
  turn: [0.13, 0.42, 34],
  moves: ['chomp', 'bubble', 'tailSlap'],
};
const SEAHORSE = {
  name: 'Seahorse',
  scale: 1,
  upright: true,
  // (from the head down the curved neck, out over the round belly, down the tail and round into
  // its spiral, curling forward under the belly)
  spine: [[1.4, -12.6, 3.3, 3.3], [-0.6, -8.8, 2.8, 3], [-0.6, -4.4, 3.1, 4.6], [0, 0.2, 3.3, 6], [-0.6, 4.6, 3, 5], [-1.8, 8.4, 2.5, 3.1], [-2.6, 11.8, 2.05, 2.25], [-2.3, 14.8, 1.7, 1.8], [-0.8, 17.1, 1.4, 1.45], [1.5, 17.8, 1.15, 1.2], [3.2, 16.6, 0.95, 1], [3.4, 14.8, 0.8, 0.8], [2.3, 13.9, 0.62, 0.62]],
  pivot: 3,
  tailFrom: 5,
  nose: 1.6,
  head: { at: [1.4, -2.4], rx: 4.9, ry: 3.9, snout: 16, snoutLen: 5.6, w0: 2.9, w1: 2.4, crown: -108, bump: 1.3 },
  pec: { at: [6.2, -0.6], len: 3.6, w: 2.5, ang: -142, scull: 16, tuck: -165, out: -100 },
  dorsal: { s0: 9.4, s1: 15.8, h: 3.4, lean: 6, flutter: 34 },
  guides: { eye: [0.6, -0.9], centre: [6, 22] },
  swim: { amp: 6, fin: 1, lag: 0.7, beats: 1.1, idle: 0.35, scull: 1.6, paddle: 26, recoil: 4.5, bob: 0.7, flutter: 9 },
  speed: 16,
  lean: 9,
  swimFins: 0,
  moveTilt: 0.45,
  turn: [0.12, 0.38, 30],
  moves: ['bubble', 'tailWhip', 'ram'],
};
const WHALE = {
  name: 'Whale calf',
  scale: 1,
  spine: [[14, 1.4, 8.2, 7.6], [9, 0, 11.4, 10], [3, -0.4, 12, 10.4], [-3, -0.2, 11, 9.4], [-9, 0.4, 8.4, 7], [-14.4, 0.6, 5.2, 4.3], [-18.8, 0.4, 3.1, 2.7], [-22.2, 0.2, 2.2, 2]],
  pivot: 2,
  nose: 3.8,
  mouth: { lip: -30, hinge: [12.6, -4.6], jaw: 16 },
  pec: { at: [13.2, -5.4], len: 8.2, w: 4.4, ang: 134, scull: 16, tuck: 162, out: 114 },
  dorsal: { s0: 28.4, s1: 32.6, h: 2.2, lean: 40 },
  tail: { kind: 'flukes', len: 9.6, w: 2.1, spread: 50, notch: 0.6 },
  guides: { eye: [12.6, -0.6], gill: 0, centre: [15, 33], blowhole: 8.4 },
  swim: { amp: 14, fin: 1.9, lag: 0.75, beats: 1.6, idle: 0.35, scull: 0.6, paddle: 18, recoil: 3, bob: 1 },
  speed: 20,
  lean: 1,
  swimFins: -0.1,
  turn: [0.17, 0.55, 26],
  moves: ['tailSlap', 'spout', 'ram'],
};
const FISH_PRESETS = { roundfish: ROUNDFISH, seahorse: SEAHORSE, whale: WHALE };
const FISH_KINDS = ['roundfish', 'seahorse', 'whale'];

// ---------- The moves (units: x, rise in body heights; angles in degrees) ----------
// pitch: + nose down; bend: + the tail curling up over the back; head: + nodding down; jaw: open
// (0..1); gill: the gills opening; fins: + spread out, − tucked back; dorsal: + raised, − folded
// flat; spread: the tail fanned; thrash: beating the tail hard; curl: the seahorse's tail tighter
// (+) or let go straight (−); tumble: whole turns over (− backward), not on a spring.
const FISH_MOVES = {
  // The round fish: the mouth thrown wide, two quick snapping bites.
  chomp: {
    anticT: 0.2,
    keys: [
      [0, { x: -0.06, pitch: -14, head: -10, jaw: 1, gill: 1, fins: 0.7, dorsal: 1, spread: 0.6 }],
      [0.07, { x: 0.14, pitch: 9, head: 9, jaw: 0, gill: 0.2, fins: -0.5, thrash: 0.7, spread: 0.3 }, 'out'],
      [0.13, { x: 0.12, pitch: -3, head: -6, jaw: 0.85, fins: 0.2 }, 'io'],
      [0.2, { x: 0.15, pitch: 8, head: 8, jaw: 0, thrash: 0.5 }, 'out'],
      [0.38, { x: 0.07, pitch: 0, head: 0, jaw: 0.08, fins: 0.2, thrash: 0, dorsal: 0.5 }, 'io'],
      [0.7, {}],
    ],
    spark: [0.07, 0.2],
    sparkAt: 'mouth',
  },
  // A slap: coiled with the tail tucked under, then it whips round up over the back and down on
  // the target in front, the nose ducking under it.
  tailSlap: {
    anticT: 0.22,
    keys: [
      [0, { x: -0.04, pitch: -16, bend: -42, head: -6, fins: 0.7, dorsal: 1, spread: 0.5 }],
      [0.1, { x: 0.05, pitch: 30, bend: 118, head: 10, fins: -0.4, dorsal: 0.2, spread: 1 }, 'out'],
      [0.18, { x: 0.06, pitch: 24, bend: 96, spread: 0.9 }, 'in'],
      [0.36, { x: 0.03, pitch: 2, bend: -10, head: 0, fins: 0.3, dorsal: 0.4, spread: 0.4 }, 'io'],
      [0.66, {}],
    ],
    spark: [0.1],
    sparkAt: 'slap',
    gust: [0.07],
  },
  // The seahorse's: wound up tight and leaning back, its tail lets go and whips forward.
  tailWhip: {
    anticT: 0.22,
    keys: [
      [0, { x: -0.03, pitch: -10, curl: 0.8, bend: 30, head: -10, fins: 0.7, dorsal: 1 }],
      [0.09, { x: 0.05, pitch: 12, curl: -1, bend: -135, head: 8, fins: -0.2, dorsal: 0.4 }, 'out'],
      [0.17, { x: 0.05, pitch: 9, curl: -0.8, bend: -112 }, 'in'],
      [0.38, { x: 0.02, pitch: 1, curl: 0, bend: -4, head: 0, fins: 0.2 }, 'io'],
      [0.68, {}],
    ],
    spark: [0.09],
    sparkAt: 'tail',
  },
  // A charge: drawing back, fins out, then shooting forward head first, the tail thrashing, a
  // bonk and a little bounce back.
  ram: {
    anticT: 0.26,
    keys: [
      [0, { x: -0.13, pitch: -6, head: -8, fins: 0.8, dorsal: -0.4, spread: 0.4, thrash: 0.5, curl: 0.3 }],
      [0.1, { x: 0.38, pitch: 6, head: 8, fins: -1, dorsal: -1, spread: 0.2, thrash: 1, curl: -0.4 }, 'out'],
      [0.17, { x: 0.3, pitch: -10, head: -12, fins: 0.6, dorsal: 0.6, spread: 0.9, thrash: 0.3, curl: 0.2 }, 'out'],
      [0.34, { x: 0.25, pitch: -2, head: 0, fins: 0.2, thrash: 0, dorsal: 0.2, curl: 0 }, 'io'],
      [0.72, {}],
    ],
    spark: [0.1],
    sparkAt: 'nose',
    lines: [0, 0.15],
  },
  // Bubble spit: a breath in, rearing back, then two puffs of bubbles out of the mouth.
  bubble: {
    anticT: 0.24,
    keys: [
      [0, { x: -0.04, pitch: -10, head: -9, jaw: 0.12, gill: 1, fins: 0.5, dorsal: 0.7 }],
      [0.08, { x: 0.04, pitch: 6, head: 8, jaw: 0.75, gill: 0, fins: -0.2, spread: 0.6, bend: 10 }, 'out'],
      [0.2, { x: 0.03, pitch: 1, head: 3, jaw: 0.4 }, 'io'],
      [0.3, { x: 0.05, pitch: 5, head: 7, jaw: 0.7, bend: 8 }, 'out'],
      [0.5, { x: 0.01, pitch: 0, head: 0, jaw: 0, gill: 0.3 }, 'io'],
      [0.82, {}],
    ],
    bubbles: [0.08, 0.3],
    spark: [0.42],
    sparkAt: 'ahead',
  },
  // The whale's spout: a dip to fill up, then up it surges and blows, the spray falling round it.
  spout: {
    anticT: 0.3,
    keys: [
      [0, { rise: -0.07, pitch: 7, head: 5, fins: 0.3, bend: -16, gill: 1, spread: 0.3 }],
      [0.12, { rise: 0.14, pitch: -10, head: -8, fins: 0.9, bend: 20, gill: 0, spread: 1 }, 'out'],
      [0.48, { rise: 0.1, pitch: -6, head: -4, fins: 0.6, bend: 8 }, 'io'],
      [0.74, { rise: 0, pitch: 0, head: 0, bend: 0, fins: 0, spread: 0.4 }, 'io'],
      [1.05, {}],
    ],
    spout: [0.12],
    spark: [0.34],
    sparkAt: 'rain',
  },
  // A leap: a dip, up nose first, level over the top, down nose first and a wobble to recover.
  jump: {
    anticT: 0.16,
    keys: [
      [0, { rise: -0.08, pitch: 12, bend: -20, fins: -0.2 }],
      [0.16, { rise: 0.7, pitch: -38, bend: 26, fins: -0.8, spread: 1, dorsal: -0.5, thrash: 0.7, curl: -0.3 }, 'out'],
      [0.36, { rise: 0.86, pitch: 0, bend: 0, fins: -0.6, thrash: 0.2, curl: 0 }, 'io'],
      [0.56, { rise: 0.16, pitch: 30, bend: -14, fins: 0.1, dorsal: 0, curl: 0.3 }, 'in'],
      [0.66, { rise: -0.06, pitch: 6, bend: 12, fins: 0.8, spread: 0.8, dorsal: 0.6 }, 'out'],
      [0.94, {}, 'io'],
    ],
    splash: [0.04, 0.66],
  },
  dash: {
    anticT: 0.06,
    keys: [
      [0, { x: -0.03, fins: 0.5, bend: -8 }],
      [0.08, { x: 0.24, pitch: 4, fins: -1, dorsal: -1, thrash: 1, spread: 0.3, curl: -0.3 }, 'out'],
      [0.3, { x: 0.28, pitch: 2, fins: -0.8, thrash: 0.7 }],
      [0.46, { x: 0.26, pitch: -6, fins: 0.8, thrash: 0, dorsal: 0.5, spread: 0.9, bend: 14, curl: 0.2 }, 'io'],
      [0.82, {}],
    ],
    lines: [0, 0.32],
  },
  // A dart away: back and up, the tail tucking forward under it, fins flared.
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { fins: 0.4 }],
      [0.12, { x: -0.28, rise: 0.22, pitch: -22, bend: -30, fins: 1, dorsal: 1, spread: 1, thrash: 0.6, curl: 0.5 }, 'out'],
      [0.32, { x: -0.3, rise: 0.08, pitch: -4, bend: 6, fins: 0.5, thrash: 0 }, 'in'],
      [0.5, { x: -0.28, rise: 0, pitch: 2, bend: 0, fins: 0.2, curl: 0 }, 'io'],
      [0.84, {}],
    ],
  },
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.06, pitch: -16, head: -10, bend: 30, fins: 1, dorsal: 1, spread: 1, jaw: 0.4, gill: 0.9, curl: 0.4 }, 'out'],
      [0.2, { x: -0.06, pitch: -9, bend: 12, fins: 0.6, jaw: 0.2 }],
      [0.4, { x: -0.03, pitch: -2, bend: 0, fins: 0.2, dorsal: 0.3, jaw: 0, curl: 0 }, 'io'],
      [0.76, {}],
    ],
    burst: [0.05],
  },
  // Knocked over: thrown back, tumbling over backward once, sinking a little, dazed and limp; a
  // shake and it rights itself.
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.08, { x: -0.06, pitch: -10, bend: 30, fins: 1, jaw: 0.5, dorsal: 1, spread: 1 }, 'out'],
      [0.52, { x: -0.16, rise: -0.12, pitch: 14, bend: -16, fins: -0.7, dorsal: -1, spread: 0, jaw: 0.2, curl: -0.5, tumble: -1 }, 'io'],
      [0.62, { rise: -0.09, pitch: 11, tumble: -1 }, 'out'],
      [1.1, { x: -0.16, rise: -0.14, pitch: 16, bend: -18, fins: -0.7, dorsal: -1, jaw: 0.2, curl: -0.5, tumble: -1 }, 'io'],
      [1.38, { x: -0.08, rise: 0.02, pitch: -6, bend: 10, fins: 0.8, dorsal: 0.6, spread: 0.8, thrash: 0.6, tumble: -1 }, 'io'],
      [1.7, { tumble: -1 }, 'io'],
    ],
    burst: [0.08],
  },
  // Pleased: a happy wiggle, up a little, the tail wagging fast, everything fanned out.
  wiggle: {
    anticT: 0.1,
    keys: [
      [0, { rise: -0.03, fins: 0.4 }],
      [0.14, { rise: 0.16, pitch: -12, fins: 1, dorsal: 1, spread: 1, thrash: 1, curl: -0.3 }, 'out'],
      [0.6, { rise: 0.12, pitch: -9, fins: 0.9, dorsal: 1, spread: 1, thrash: 1, curl: -0.2 }],
      [0.76, { rise: 0, pitch: 2, fins: 0.2, thrash: 0, curl: 0 }, 'in'],
      [1.05, {}],
    ],
    splash: [0.2],
  },
};
const FISH_SHOW = ['chomp', 'bubble', 'tailSlap', 'tailWhip', 'ram', 'spout', 'jump', 'dash', 'dodge', 'hurt', 'knockdown', 'wiggle'];
const POOL = ['bubble', 'tailSlap', 'ram'];
const lengthOf = (mv) => mv.keys[mv.keys.length - 1][0];
const EASES = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: ease };
// A move's pose at t (before 0: easing from the rest pose into its first key by `antic`).
function poseIn(mv, t, antic, rest) {
  const keys = mv.keys.map(([kt, pose, how]) => [kt, { ...rest, ...pose }, how]);
  const out = {};
  if (t < 0) {
    for (const k of Object.keys(rest)) out[k] = mix(rest[k], keys[0][1][k], ease(antic));
    return out;
  }
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return { ...keys[keys.length - 1][1] };
  const [t0, p0] = keys[i];
  const [t1, p1, how] = keys[i + 1];
  const u = (EASES[how] ?? ease)(clamp((t - t0) / Math.max(1e-6, t1 - t0), 0, 1));
  for (const k of Object.keys(p0)) out[k] = mix(p0[k], p1[k], u);
  return out;
}
// (0..1 through the `len` seconds after the latest of these moments, or −1)
const after = (moments, t, len) => {
  let u = -1;
  for (const m0 of moments ?? []) if (t >= m0 && t <= m0 + len) u = (t - m0) / len;
  return u;
};

const CH = ['x', 'rise', 'lift', 'sink', 'pitch', 'head', 'bend', 'curl', 'jaw', 'gill', 'fins', 'dorsal', 'spread', 'thrash'];
const EMPTY = () => sprite('rig|blankempty', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// ---------- One rig for a preset ----------
function fishRig(kind, look = {}) {
  // (this copy: its dress, and its colours over the base's)
  DRESS = look;
  Object.assign(C, look.C ?? {});
  const P = FISH_PRESETS[kind];
  const s = P.scale;
  const sc = (v) => v * s;
  const REST = P.spine.map(([x, y]) => [sc(x), sc(y)]);
  const n = REST.length;
  const pv = P.pivot;
  const LEN = [];
  const ANG = [];
  for (let i = 0; i < n - 1; i++) {
    LEN.push(Math.hypot(REST[i + 1][0] - REST[i][0], REST[i + 1][1] - REST[i][1]));
    ANG.push(Math.atan2(REST[i + 1][1] - REST[i][1], REST[i + 1][0] - REST[i][0]));
  }
  // (each joint's rest bend: the turn from the segment before it to the one after)
  const REL = [0];
  for (let j = 1; j < n - 1; j++) REL.push(wrapPi(ANG[j] - ANG[j - 1]));
  const SJ = [0];
  for (let i = 0; i < n - 1; i++) SJ.push(SJ[i] + LEN[i]);
  const BACK = P.spine.map((r) => sc(r[2]));
  const BELLY = P.spine.map((r) => sc(r[3]));
  const tailFrom = P.tailFrom ?? pv + 1;
  // (how much of a bend or a wave each joint behind the middle takes: more toward the tail)
  const WAVEW = REST.map((_, j) => (j > pv ? ((j - pv) / (n - 1 - pv)) ** 1.2 : 0));
  const WSUM = WAVEW.reduce((x, y) => x + y, 0) + 1;
  // (a bend: on a fish mostly toward the tail; down the seahorse's long tail more evenly, so it
  // swings from the belly as a whole)
  const BENDW = REST.map((_, j) => (j > pv ? (P.upright ? ((j - pv) / (n - 1 - pv)) ** 0.35 : WAVEW[j]) : 0));
  const BSUM = BENDW.reduce((x, y) => x + y, 0) + 1;
  // Its size at rest: how high its middle floats so the lowest of it clears its feet, its height.
  const restN = REST.map((_, j) => {
    const d0 = dirOf(ANG[Math.max(0, j - 1)]);
    const d1 = dirOf(ANG[Math.min(n - 2, j)]);
    const d = unit(plus(d0, d1));
    return [-d[1], d[0]];
  });
  let top = Infinity;
  let bottom = -Infinity;
  let fore = -Infinity;
  let aft = Infinity;
  REST.forEach((q, j) => {
    for (const r of [BACK[j], -BELLY[j]]) {
      const e = plus(q, times(restN[j], r));
      top = Math.min(top, e[1]);
      bottom = Math.max(bottom, e[1]);
      fore = Math.max(fore, e[0]);
      aft = Math.min(aft, e[0]);
    }
  });
  if (P.head) {
    top = Math.min(top, REST[0][1] + sc(P.head.at[1] - P.head.ry - P.head.bump));
    fore = Math.max(fore, REST[0][0] + sc(P.head.at[0] + P.head.rx + P.head.snoutLen * 0.9));
  } else fore += sc(P.nose);
  if (P.dorsal && !P.upright) top -= sc(P.dorsal.h * 0.7);
  if (P.tail) aft -= sc(P.tail.len);
  const FLOAT = bottom - REST[pv][1] + sc(2.4);
  const H = FLOAT + (REST[pv][1] - top);
  const bodyLen = fore - aft;
  const CYC = P.speed / P.swim.beats;
  const FLUT = P.speed / (P.swim.flutter ?? 6);

  // ---------- The skeleton: the posed spine, its outline, the fins ----------
  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    // (turning round: the swish before the flip and the wiggle after it, laid over the pose)
    const TB = st.fsTB ?? 0;
    const swim = ease(st.fsSwim ?? 0);
    const ph = st.fsPh ?? 0;
    const thr = clamp(S.thrash, 0, 1.5);
    // The wave down the body: small at rest (a scull), full swimming, bigger thrashing.
    const amp = (P.swim.amp * mix(0.35, 1, swim) + P.swim.amp * 0.9 * thr) * (st.fsCalm ?? 1) * D2R;
    const tumble = (a.fsTumble ?? 0) * TAU;
    // (the head recoiling a touch against each beat)
    const recoil = -P.swim.recoil * D2R * Math.sin(ph + 0.6) * mix(0.35, 1, swim);
    // The middle: floating at its height, bobbing with the beat as it swims.
    const swimBob = Math.sin(ph * 2 - 0.4) * sc(P.swim.bob) * swim;
    const px = REST[pv][0] + S.x;
    // (rising a little as it turns over, so its tail clears the ground)
    const py = REST[pv][1] - FLOAT - S.rise - S.lift - swimBob + S.sink;
    const angP = ANG[pv] + (S.pitch + (st.fsTP ?? 0)) * D2R + tumble + recoil;
    const curl = clamp(S.curl, -1, 1.5);
    const curlK = curl >= 0 ? 1 + curl * 0.45 : 1 + curl;
    const relAt = (j) => {
      if (j > pv) {
        const restBend = REL[j] * (j >= tailFrom ? curlK : 1);
        return restBend + ((S.bend + TB) * D2R * BENDW[j]) / BSUM + amp * WAVEW[j] * Math.sin(ph - P.swim.lag * (j - pv));
      }
      // (in front of the middle: the head nodding)
      return REL[j] - (S.head * D2R) / Math.max(1, pv);
    };
    const ang = new Array(n - 1);
    ang[pv] = angP;
    for (let j = pv + 1; j < n - 1; j++) ang[j] = ang[j - 1] + relAt(j);
    for (let i = pv - 1; i >= 0; i--) ang[i] = ang[i + 1] - relAt(i + 1);
    const pos = new Array(n);
    pos[pv] = [px, py];
    for (let j = pv; j < n - 1; j++) pos[j + 1] = plus(pos[j], times(dirOf(ang[j]), LEN[j]));
    for (let i = pv - 1; i >= 0; i--) pos[i] = minus(pos[i + 1], times(dirOf(ang[i]), LEN[i]));
    const dirs = ang.map(dirOf);
    const nrm = pos.map((_, j) => {
      const d = unit(plus(dirs[Math.max(0, j - 1)], dirs[Math.min(n - 2, j)]));
      return [-d[1], d[0]];
    });
    const back = BACK;
    const belly = BELLY;
    const sk = { pos, dirs, nrm, back, belly, ang, swim, ph, S };
    // A point along the body `sPos` from the front, `off` from the centre line (+ the back).
    sk.along = (sPos, off) => {
      if (sPos <= 0) return plus(plus(pos[0], times(dirs[0], sPos)), times(nrm[0], off));
      let i = 0;
      while (i < n - 2 && sPos > SJ[i + 1]) i++;
      const u = Math.min(1.4, (sPos - SJ[i]) / LEN[i]);
      const q = between(pos[i], pos[i + 1], u);
      const nn = unit(between(nrm[i], nrm[i + 1], Math.min(1, u)));
      return plus(q, times(nn, off));
    };
    sk.girth = (sPos, side) => {
      const R = side > 0 ? back : belly;
      let i = 0;
      while (i < n - 2 && sPos > SJ[i + 1]) i++;
      return mix(R[i], R[i + 1], clamp((sPos - SJ[i]) / LEN[i], 0, 1));
    };
    sk.fwdAt = (sPos) => {
      let i = 0;
      while (i < n - 2 && sPos > SJ[i + 1]) i++;
      return times(dirs[i], -1);
    };
    // The front: round over the nose, the mouth in it; the jaw dropping about its hinge.
    const f0 = times(dirs[0], -1);
    const n0 = nrm[0];
    const capAt = (deg) => {
      const r = deg * D2R;
      return plus(plus(pos[0], times(f0, sc(P.nose) * Math.cos(r))), times(n0, Math.sin(r) * (r > 0 ? back[0] : belly[0])));
    };
    const M = P.mouth;
    const jaw = clamp(S.jaw, 0, 1.2);
    let hinge = null;
    let jawA = 0;
    if (M) {
      hinge = sk.along(sc(M.hinge[0]), sc(M.hinge[1]));
      jawA = jaw * M.jaw * D2R;
    }
    const dropped = (q, w) => (M && w > 0 ? plus(hinge, turned(minus(q, hinge), jawA * w)) : q);
    const cap = [];
    if (M) {
      // (the front sampled evenly, the lips and the corner of the mouth on three of the samples:
      // the lower lip dropped with the jaw, the corner drawn back into the hinge as it opens)
      const step = 13;
      const k0 = Math.round((M.lip + 78) / step);
      const degs = Array.from({ length: 13 }, (_, k) => -78 + k * step);
      const lipL = dropped(capAt(degs[k0 - 1]), 1);
      const lipU = capAt(degs[k0 + 1]);
      const gape = between(capAt(degs[k0]), plus(hinge, times(f0, sc(0.8))), ease(jaw * 2.6));
      degs.forEach((deg, k) => {
        if (k === k0 - 1) cap.push(lipL);
        else if (k === k0) cap.push(gape);
        else if (k === k0 + 1) cap.push(lipU);
        else cap.push(k < k0 ? dropped(capAt(deg), 1) : capAt(deg));
      });
      sk.lipU = lipU;
      sk.lipL = lipL;
      sk.gape = gape;
      sk.hinge = hinge;
      sk.jaw = jaw;
      sk.mouthPt = between(lipU, lipL, 0.5);
    } else for (let deg = -72; deg <= 72; deg += 18) cap.push(capAt(deg));
    sk.nosePt = capAt(0);
    // The outline: along the back nose to tail, round the tail's root, back along the belly (the
    // chin with the jaw), round the front.
    const outl = [];
    for (let j = 0; j < n; j++) outl.push(plus(pos[j], times(nrm[j], back[j])));
    const dl = dirs[n - 2];
    outl.push(plus(pos[n - 1], times(dl, Math.min(back[n - 1], belly[n - 1]) * 0.85)));
    for (let j = n - 1; j >= 0; j--) {
      const q = plus(pos[j], times(nrm[j], -belly[j]));
      const w = M ? ease((sc(M.hinge[0]) + sc(1) - SJ[j]) / sc(3)) : 0;
      outl.push(dropped(q, w));
    }
    outl.push(...cap);
    sk.outline = outl;

    // ---------- The fins: each on its own damped spring ----------
    // The middle's push (its acceleration, worked out in the world, turned into the rig's way
    // round) and the body's turning swing the fins on; they overshoot and settle.
    const flipS = st.fsShown ? -1 : 1;
    const wx = (m.x ?? 0) + flipS * px;
    const wy = (m.y ?? 0) + py;
    let ax = 0;
    let ay = 0;
    let al = 0;
    const steady = dt > 0 && st.fsW !== undefined && Math.hypot(wx - st.fsW[0], wy - st.fsW[1]) < 30;
    if (steady) {
      const vx = (wx - st.fsW[0]) / dt;
      const vy = (wy - st.fsW[1]) / dt;
      const om = wrapPi(angP - st.fsA) / dt;
      if (st.fsVel) {
        const f = Math.min(1, dt * 20);
        st.fsAcc = [mix(st.fsAcc[0], clamp((vx - st.fsVel[0]) / dt, -1800, 1800), f), mix(st.fsAcc[1], clamp((vy - st.fsVel[1]) / dt, -1800, 1800), f), mix(st.fsAcc[2], clamp((om - st.fsVel[2]) / dt, -300, 300), f)];
        [ax, ay, al] = st.fsAcc;
        ax *= flipS;
      }
      st.fsVel = [vx, vy, om];
    } else {
      st.fsVel = null;
      st.fsAcc = [0, 0, 0];
    }
    st.fsW = [wx, wy];
    st.fsA = angP;
    const FS = (st.fsFin ??= {});
    // (one fin: `u` the way it points; returns its swing, radians)
    const swing = (key, u, k, c, gain, lag) => {
      const f = (FS[key] ??= { o: 0, w: 0 });
      if (!(dt > 0)) return f.o;
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      const push = gain * (u[1] * -ax - u[0] * -ay) * -1 - lag * al;
      for (let i = 0; i < steps; i++) {
        f.w += (-k * f.o - c * f.w + push) * h;
        f.o += f.w * h;
        if (Math.abs(f.o) > 0.7) {
          f.o = Math.sign(f.o) * 0.7;
          f.w *= -0.3;
        }
      }
      if (!Number.isFinite(f.o)) Object.assign(f, { o: 0, w: 0 });
      return f.o;
    };
    const fins = clamp(S.fins, -1, 1.2);
    // The pectorals: sculling slowly at rest (near and far out of step), tucked back and
    // paddling a little in time with the tail swimming; spread or tucked by `fins`.
    const pecs = {};
    if (P.pec) {
      const F = P.pec;
      const fp = st.fsFp ?? 0;
      for (const side of ['near', 'far']) {
        const far = side === 'far';
        const stroke = Math.sin(fp + (far ? 2.1 : 0)) * F.scull * (1 - swim) * (st.fsCalm ?? 1) + Math.sin(ph - 1.2 + (far ? 1.4 : 0)) * P.swim.paddle * swim + Math.sin(ph * 2) * 10 * thr;
        let goal = mix(F.ang, F.tuck, swim * 0.4) + stroke;
        goal = fins > 0 ? mix(goal, F.out, fins * 0.75) : mix(goal, F.tuck, -fins);
        goal += (far ? -9 : 0) + (st.fsTF ?? 0) * 30;
        const root = sk.along(sc(F.at[0] - (far ? 0.7 : 0)), sc(F.at[1] + (far ? 1.1 : 0)));
        const fwd = sk.fwdAt(sc(F.at[0]));
        let an = Math.atan2(fwd[1], fwd[0]) + goal * D2R;
        an += swing(`pec${side}`, dirOf(an), 150, 11, 0.03, 0.5);
        pecs[side] = { root, ang: an, len: sc(F.len), w: sc(F.w) };
      }
    }
    sk.pecs = pecs;
    // The dorsal (and the round fish's anal fin): raised or folded flat, swaying a beat behind;
    // the seahorse's fluttering in a ripple along its edge.
    const sail = (F, side, key) => {
      const raise = side > 0 ? clamp(S.dorsal, -1, 1.2) : clamp(S.dorsal * 0.6 + 0.2, -1, 1);
      const fold = ease((0.4 - raise) / 1.4) * 64;
      const mid0 = sk.along(sc((F.s0 + F.s1) / 2), 0);
      const out0 = unit(minus(sk.along(sc((F.s0 + F.s1) / 2), side), mid0));
      const sway = swing(key, out0, 120, 9, 0.025, 0.6) / D2R;
      const pts = [];
      const prof = [0.7, 1, 0.82, 0.5];
      const tips = [];
      for (let i = 0; i < 4; i++) {
        const sPos = sc(mix(F.s0, F.s1, i / 3));
        const inset = sc(1.3);
        const b = sk.along(sPos, side * (sk.girth(sPos, side) - inset));
        const nn = unit(minus(sk.along(sPos, side), sk.along(sPos, 0)));
        const tail = times(sk.fwdAt(sPos), -1);
        const flut = F.flutter ? F.flutter * Math.sin((st.fsFl ?? 0) - i * 1.9) * mix(0.55, 1, swim) : 0;
        const th = (F.lean + fold + sway * 0.6 + flut + (i - 1.5) * 4) * D2R;
        const rd = unit(plus(times(nn, Math.cos(th)), times(tail, Math.sin(th))));
        tips.push(plus(b, times(rd, sc(F.h) * prof[i] + inset)));
      }
      const b0 = sk.along(sc(F.s0) - sc(0.4), side * (sk.girth(sc(F.s0), side) - sc(1.6)));
      const b1 = sk.along(sc(F.s1) + sc(0.4), side * (sk.girth(sc(F.s1), side) - sc(1.6)));
      const bm = sk.along(sc((F.s0 + F.s1) / 2), side * (sk.girth(sc((F.s0 + F.s1) / 2), side) - sc(3)));
      pts.push(b0, ...tips, b1, bm);
      return { pts, tips, base: [b0, b1] };
    };
    sk.dorsal = P.dorsal ? sail(P.dorsal, 1, 'dorsal') : null;
    sk.anal = P.anal ? sail(P.anal, -1, 'anal') : null;
    // The tail fin: the wave carried on into it, a beat behind the last joint, swung on by the
    // body's moves; fanned open by `spread`.
    if (P.tail) {
      const T = P.tail;
      const root = pos[n - 1];
      const waveFin = amp * P.swim.fin * Math.sin(ph - P.swim.lag * (n - pv));
      const bendFin = (S.bend * D2R * 1.4) / WSUM;
      let ta = ang[n - 2] + waveFin + bendFin;
      ta += swing('tail', dirOf(ta), 200, 13, 0.035, 0.9);
      const half = (T.spread + clamp(S.spread, 0, 1.2) * T.spread * 0.45 - (1 - clamp(S.spread, 0, 1)) * 6) * D2R;
      sk.tail = { root, ang: ta, half, tip: plus(root, times(dirOf(ta), sc(T.len) * 0.9)) };
    }
    // The seahorse's head: a round skull, the tube snout, the little crown; it nods.
    if (P.head) {
      const Hd = P.head;
      const restA = wrapPi(ang[0] - ANG[0]) + S.head * D2R;
      const hA = restA;
      const centre = plus(pos[0], turned([sc(Hd.at[0]), sc(Hd.at[1])], hA));
      const sn = hA + Hd.snout * D2R;
      const cr = hA + Hd.crown * D2R;
      const rx = sc(Hd.rx);
      const ry = sc(Hd.ry);
      const onSkull = (al2, grow = 0) => {
        const q = turned([Math.cos(al2 - hA) * (rx + grow), Math.sin(al2 - hA) * (ry + grow)], hA);
        return plus(centre, q);
      };
      // (round the skull from under the snout, back over the crown, to the top of the snout;
      // under the head it flows down into the neck in front (the throat) and behind (the nape),
      // so the head and the neck are one shape with no crease)
      const pts = [];
      const gap = 0.62;
      const K = 15;
      const under = hA + Math.PI / 2;
      const throat = plus(pos[1], times(nrm[1], -belly[1] * 0.92));
      const nape = plus(pos[1], times(nrm[1], back[1] * 0.92));
      let neckIn = false;
      for (let i = 0; i < K; i++) {
        const al2 = sn + gap + ((TAU - 2 * gap) * i) / (K - 1);
        if (Math.abs(wrapPi(al2 - under)) < 1.05) {
          if (!neckIn) pts.push(throat, nape);
          neckIn = true;
          continue;
        }
        const bump = sc(Hd.bump) * Math.exp(-(((wrapPi(al2 - cr)) / 0.42) ** 2));
        pts.push(onSkull(al2, bump));
      }
      if (!neckIn) pts.unshift(throat, nape);
      const sd = dirOf(sn);
      const sv = [sd[1], -sd[0]];
      const r0 = plus(centre, times(sd, Math.min(rx, ry) * 0.72));
      const tip = plus(r0, times(sd, sc(Hd.snoutLen)));
      const w0 = sc(Hd.w0) / 2;
      const w1 = sc(Hd.w1) / 2;
      const flare = 1 + clamp(S.jaw, 0, 1) * 0.12;
      pts.push(plus(between(r0, tip, 0.1), times(sv, w0 * 1.05)), plus(between(r0, tip, 0.6), times(sv, w1 * 0.92)), plus(tip, times(sv, w1 * flare)), plus(tip, times(sd, w1 * 0.85)), plus(tip, times(sv, -w1 * flare)), plus(between(r0, tip, 0.6), times(sv, -w1 * 0.95)), plus(between(r0, tip, 0.1), times(sv, -w0 * 1.1)));
      sk.head = { pts, centre, hA, sn, tip, sd, sv, rx, ry };
      sk.mouthPt = plus(tip, times(sd, w1 * 0.7));
      sk.nosePt = sk.mouthPt;
      sk.jaw = clamp(S.jaw, 0, 1);
    }
    // (where the hits land and the spray comes from)
    sk.slapPt = sk.tail ? plus(sk.tail.root, times(dirOf(sk.tail.ang), sc(P.tail.len) * 0.8)) : pos[n - 1];
    sk.tailPt = P.upright ? pos[n - 3] : sk.slapPt;
    sk.blowPt = P.guides.blowhole ? sk.along(sc(P.guides.blowhole), back[1] * 0.96) : sk.along(sc(4), back[0]);
    sk.pivot = pos[pv];
    sk.fwd = times(dirs[pv], -1);
    return sk;
  }

  // ---------- Drawing ----------
  const tone = (a, c, al = 1) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = rgbOf(c);
    const f = (v) => Math.round(v + (255 - v) * k);
    return al >= 1 ? `rgb(${f(r)},${f(g)},${f(b)})` : `rgba(${f(r)},${f(g)},${f(b)},${al})`;
  };
  const ink = (ctx) => {
    ctx.strokeStyle = DRESS.ink ?? INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const soft = (ctx, at, r, col, al) => {
    const [cr, cg, cb] = rgbOf(col);
    const g = ctx.createRadialGradient(at[0], at[1], 0, at[0], at[1], r);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},${al})`);
    g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(at[0] - r, at[1] - r, r * 2, r * 2);
  };
  const guide = (ctx, a, pts, al = 1, col = C.guide, w = 0.5) => {
    if (al <= 0.02) return;
    ctx.save();
    ctx.globalAlpha *= al;
    ctx.strokeStyle = tone(a, col);
    ctx.lineWidth = Math.max(0.35, sc(w));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    linePath(ctx, pts);
    ctx.stroke();
    ctx.restore();
  };
  const bodyPath = (ctx, sk) => {
    ctx.beginPath();
    loopPath(ctx, sk.outline);
  };
  // The body: one smooth shape; lit along the back, softly shaded under the belly.
  function drawBody(ctx, a, mode) {
    const sk = a.fk;
    bodyPath(ctx, sk);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    bodyPath(ctx, sk);
    ctx.clip();
    const sMid = SJ[pv];
    const big = Math.max(...BACK);
    if (P.upright) {
      soft(ctx, sk.along(SJ[2], -sk.belly[2] * 0.25), big * 1.8, C.lt, 0.9);
      soft(ctx, sk.along(SJ[pv + 1], sk.back[pv + 1] * 0.5), big * 1.3, C.lt, 0.5);
      soft(ctx, sk.along(SJ[n - 4], 0), big * 1.6, C.sh, 0.45);
    } else {
      soft(ctx, sk.along(SJ[1], sk.back[1] * 0.42), sk.back[1] * 1.05, C.lt, 0.9);
      soft(ctx, sk.along(sMid + sc(3), sk.back[pv] * 0.5), big * 1.2, C.lt, 0.6);
      soft(ctx, sk.along(sMid + sc(1), -sk.belly[pv] * 0.95), sk.belly[pv] * 1.05, C.sh, 0.6);
      soft(ctx, sk.pos[n - 1], sc(5), C.sh, 0.35);
    }
    ctx.restore();
    drawGuides(ctx, a, sk);
  }
  // The soft guides: where the eyes go, the centre line, the mouth, the gills (breathing), the
  // whale's blowhole.
  function drawGuides(ctx, a, sk) {
    const G = P.guides;
    if (G.centre && !P.upright) {
      const pts = [];
      for (let i = 0; i <= 4; i++) {
        const sPos = sc(mix(G.centre[0], G.centre[1], i / 4));
        pts.push(sk.along(sPos, sk.back[pv] * 0.08 * (1 - i / 4)));
      }
      guide(ctx, a, pts, 0.9);
    } else if (G.centre) {
      const pts = [];
      for (let i = 0; i <= 4; i++) {
        const sPos = sc(mix(G.centre[0], G.centre[1], i / 4));
        pts.push(sk.along(sPos, -sk.girth(sPos, -1) * 0.12));
      }
      guide(ctx, a, pts, 0.8);
    }
    if (P.head) return;
    const S = sk.S;
    // the eye line: a short soft curve
    const [es, eo] = G.eye.map(sc);
    guide(ctx, a, [sk.along(es - sc(1.7), eo - sc(0.1)), sk.along(es, eo + sc(0.45)), sk.along(es + sc(1.7), eo - sc(0.1))], 1, C.sh, 0.55);
    // the gill line, opening a little with each breath
    if (G.gill) {
      const gs = sc(G.gill);
      const op = clamp(S.gill, 0, 1.2) * sc(0.7);
      const up = sk.girth(gs, 1);
      const dn = sk.girth(gs, -1);
      guide(ctx, a, [sk.along(gs - sc(0.5), up * 0.42), sk.along(gs + sc(0.9) + op, up * 0.08), sk.along(gs + sc(0.4) + op * 0.6, -dn * 0.3)], 0.85);
    }
    // the mouth's line while it's shut
    if (P.mouth && sk.jaw < 0.35) {
      const hs = sc(P.mouth.hinge[0]);
      guide(ctx, a, [sk.gape, between(sk.gape, sk.hinge, 0.55), sk.hinge, sk.along(hs + sc(0.9), sc(P.mouth.hinge[1]) + sc(0.7))], (1 - sk.jaw / 0.35), C.sh, 0.6);
    }
    if (G.blowhole) {
      const b = sc(G.blowhole);
      const r0 = sk.back[1] * 0.86;
      guide(ctx, a, [sk.along(b - sc(1.1), r0), sk.along(b, r0 - sc(0.55)), sk.along(b + sc(1.1), r0)], 1, C.sh, 0.6);
    }
  }
  // The inside of the mouth, behind the lips, when it's open.
  function drawMouth(ctx, a, mode) {
    const sk = a.fk;
    if (!P.mouth || sk.jaw < 0.03) return;
    const back = plus(sk.hinge, times(unit(minus(sk.hinge, sk.mouthPt)), sc(0.6)));
    const front = between(sk.mouthPt, sk.hinge, 0.18);
    ctx.beginPath();
    ctx.moveTo(...sk.lipU);
    ctx.quadraticCurveTo(front[0], front[1], sk.lipL[0], sk.lipL[1]);
    ctx.lineTo(...back);
    ctx.closePath();
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, GULLET);
    ctx.fill();
  }
  function headPath(ctx, sk) {
    ctx.beginPath();
    loopPath(ctx, sk.head.pts);
  }
  // The seahorse's head.
  function drawHead(ctx, a, mode) {
    const sk = a.fk;
    if (!sk.head) return;
    const Hh = sk.head;
    headPath(ctx, sk);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    headPath(ctx, sk);
    ctx.clip();
    soft(ctx, plus(Hh.centre, turned([-Hh.rx * 0.1, -Hh.ry * 0.5], Hh.hA)), Hh.rx * 1.05, C.lt, 0.95);
    soft(ctx, plus(Hh.centre, turned([-Hh.rx * 0.5, Hh.ry * 0.7], Hh.hA)), Hh.ry * 0.9, C.sh, 0.4);
    ctx.restore();
    const at = (x, y) => plus(Hh.centre, turned([sc(x), sc(y)], Hh.hA));
    if (DRESS.face) {
      ctx.save();
      DRESS.face(ctx, a, sk, DRESS.KIT, at);
      ctx.restore();
      return;
    }
    const [ex, ey] = P.guides.eye;
    guide(ctx, a, [at(ex - 1.5, ey + 0.1), at(ex, ey - 0.4), at(ex + 1.5, ey + 0.1)], 1, C.sh, 0.55);
    // the gill line behind the eye, breathing
    const op = clamp(sk.S.gill, 0, 1.2) * 0.5;
    guide(ctx, a, [at(-2.4 - op * 0.3, -2), at(-3.3 - op, 0.3), at(-2.6 - op * 0.5, 2.4)], 0.9);
    // the little mouth at the snout's tip
    if (sk.jaw > 0.05) {
      ctx.fillStyle = tone(a, GULLET);
      ctx.beginPath();
      ctx.ellipse(Hh.tip[0] + Hh.sd[0] * sc(0.5), Hh.tip[1] + Hh.sd[1] * sc(0.5), sc(0.45 + sk.jaw * 0.45), sc(0.55 + sk.jaw * 0.35), Math.atan2(Hh.sd[1], Hh.sd[0]), 0, TAU);
      ctx.fill();
    } else guide(ctx, a, [plus(Hh.tip, plus(times(Hh.sv, sc(0.55)), times(Hh.sd, sc(0.6)))), plus(Hh.tip, plus(times(Hh.sv, -sc(0.55)), times(Hh.sd, sc(0.6))))], 1, C.sh, 0.5);
  }
  // A pectoral fin: a rounded paddle from its root inside the body.
  const leafPts = (f) => {
    const u = dirOf(f.ang);
    const v = [-u[1], u[0]];
    const at = (x, y) => plus(f.root, plus(times(u, x * f.len), times(v, y * f.w)));
    return [at(-0.3, 0), at(0.02, -0.44), at(0.5, -0.5), at(0.88, -0.32), at(1, 0.02), at(0.86, 0.36), at(0.48, 0.5), at(0.02, 0.42)];
  };
  function drawPec(ctx, a, mode, side) {
    const sk = a.fk;
    const f = sk.pecs[side];
    if (!f) return;
    const far = side === 'far';
    const pts = leafPts(f);
    ctx.beginPath();
    loopPath(ctx, pts);
    if (mode === 'line') return ink(ctx);
    if (!far) {
      // (lying over the body: a soft deeper edge where it does, fading out at its root)
      ctx.save();
      bodyPath(ctx, sk);
      if (sk.head) loopPath(ctx, sk.head.pts);
      ctx.clip();
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      const hole = plus(f.root, times(dirOf(f.ang), f.len * 0.12));
      ctx.moveTo(hole[0] + f.len * 0.5, hole[1]);
      ctx.arc(hole[0], hole[1], f.len * 0.5, 0, TAU);
      ctx.clip('evenodd');
      ctx.beginPath();
      loopPath(ctx, pts);
      ctx.strokeStyle = tone(a, C.sh);
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    loopPath(ctx, pts);
    ctx.fillStyle = tone(a, far ? C.sh : C.base);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    loopPath(ctx, pts);
    ctx.clip();
    const u = dirOf(f.ang);
    const v = [-u[1], u[0]];
    if (!far) soft(ctx, plus(f.root, times(u, f.len * 0.3)), f.len * 0.6, C.lt, 0.75);
    // a few soft rays fanning out from the root
    ctx.strokeStyle = tone(a, far ? C.deep : C.sh);
    ctx.lineWidth = Math.max(0.35, sc(0.42));
    ctx.lineCap = 'round';
    ctx.globalAlpha *= 0.8;
    for (const y of [-0.16, 0.18]) {
      ctx.beginPath();
      ctx.moveTo(...plus(f.root, plus(times(u, f.len * 0.42), times(v, y * f.w * 0.4))));
      ctx.lineTo(...plus(f.root, plus(times(u, f.len * 0.84), times(v, y * f.w))));
      ctx.stroke();
    }
    ctx.restore();
  }
  // A sail of a fin (the dorsal, the anal fin).
  function drawSail(ctx, a, mode, which) {
    const sk = a.fk;
    const F = sk[which];
    if (!F) return;
    ctx.beginPath();
    loopPath(ctx, F.pts);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, C.sh);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    loopPath(ctx, F.pts);
    ctx.clip();
    const mid = between(F.base[0], F.base[1], 0.5);
    soft(ctx, mid, Math.hypot(...minus(F.tips[1], mid)) * 0.95, C.base, 0.95);
    ctx.strokeStyle = tone(a, C.deep);
    ctx.lineWidth = Math.max(0.35, sc(0.4));
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const b = between(F.base[0], F.base[1], 0.15 + i * 0.23);
      ctx.beginPath();
      ctx.moveTo(...b);
      ctx.lineTo(...between(b, F.tips[i], 0.85));
      ctx.stroke();
    }
    ctx.restore();
  }
  // The tail fin: a rounded fan, or a whale's flukes (two pointed lobes, a notch between).
  const tailPts = (sk) => {
    const T = P.tail;
    const { root, ang, half } = sk.tail;
    const L0 = sc(T.len);
    const u = dirOf(ang);
    const v = [-u[1], u[0]];
    const w0 = sc(T.w);
    const ray = (k, l) => plus(root, times(dirOf(ang + half * k), L0 * l));
    if (T.kind === 'flukes') {
      return [plus(root, times(u, -w0)), plus(root, times(v, w0)), plus(between(plus(root, times(v, w0)), ray(1, 1), 0.5), times(v, sc(0.7))), ray(1.02, 1.02), ray(0.78, 0.9), ray(0.4, 0.78), ray(0, T.notch), ray(-0.4, 0.78), ray(-0.78, 0.9), ray(-1.02, 1.02), plus(between(plus(root, times(v, -w0)), ray(-1, 1), 0.5), times(v, -sc(0.7))), plus(root, times(v, -w0))];
    }
    return [plus(root, times(u, -w0)), plus(root, times(v, w0)), plus(between(plus(root, times(v, w0)), ray(1, 1), 0.55), times(v, -sc(0.3))), ray(1, 1), ray(0.62, 1.02), ray(0.22, 0.95), ray(0, T.notch), ray(-0.22, 0.95), ray(-0.62, 1.02), ray(-1, 1), plus(between(plus(root, times(v, -w0)), ray(-1, 1), 0.55), times(v, sc(0.3))), plus(root, times(v, -w0))];
  };
  function drawTail(ctx, a, mode) {
    const sk = a.fk;
    if (!sk.tail) return;
    const pts = tailPts(sk);
    ctx.beginPath();
    loopPath(ctx, pts);
    if (mode === 'line') return ink(ctx);
    const whale = P.tail.kind === 'flukes';
    ctx.fillStyle = tone(a, whale ? C.base : C.sh);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    loopPath(ctx, pts);
    ctx.clip();
    const { root, ang, half } = sk.tail;
    soft(ctx, plus(root, times(dirOf(ang), sc(P.tail.len) * 0.25)), sc(P.tail.len) * 0.75, whale ? C.lt : C.base, 0.9);
    if (!whale) {
      ctx.strokeStyle = tone(a, C.deep);
      ctx.lineWidth = Math.max(0.35, sc(0.42));
      ctx.lineCap = 'round';
      for (const k of [-0.62, -0.2, 0.2, 0.62]) {
        ctx.beginPath();
        ctx.moveTo(...plus(root, times(dirOf(ang + half * k * 0.6), sc(P.tail.len) * 0.3)));
        ctx.lineTo(...plus(root, times(dirOf(ang + half * k), sc(P.tail.len) * 0.82)));
        ctx.stroke();
      }
    } else {
      // (the flukes' soft middle line)
      ctx.strokeStyle = tone(a, C.sh);
      ctx.lineWidth = Math.max(0.35, sc(0.45));
      ctx.beginPath();
      ctx.moveTo(...plus(root, times(dirOf(ang), sc(1.5))));
      ctx.lineTo(...plus(root, times(dirOf(ang), sc(P.tail.len) * P.tail.notch * 0.85)));
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- Effects: sparkles, bubbles, the spout, speed lines ----------
  const twinkle = (ctx, x, y, r, an, fill) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(an);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const q = (i * Math.PI) / 2;
      const q2 = q + Math.PI / 2;
      if (i === 0) ctx.moveTo(r, 0);
      ctx.quadraticCurveTo(Math.cos(q + Math.PI / 4) * r * 0.18, Math.sin(q + Math.PI / 4) * r * 0.18, Math.cos(q2) * r, Math.sin(q2) * r);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(176,150,200,0.8)';
    ctx.lineWidth = Math.max(0.3, r * 0.1);
    ctx.stroke();
    ctx.restore();
  };
  const bubbleAt = (ctx, x, y, r, al) => {
    if (al <= 0.01 || r <= 0.05) return;
    ctx.save();
    ctx.globalAlpha *= al;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = 'rgba(236,244,255,0.62)';
    ctx.fill();
    ctx.strokeStyle = '#94aedb';
    ctx.lineWidth = Math.max(0.3, r * 0.2);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(0.3, r * 0.22);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.6, -2.5, -1.6);
    ctx.stroke();
    ctx.restore();
  };
  const popAt = (ctx, x, y, r, u) => {
    ctx.save();
    ctx.globalAlpha *= 1 - u;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(0.3, r * 0.25);
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const q = (i * TAU) / 6 + 0.3;
      const r0 = r * (0.6 + u * 1.2);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(q) * r0, y + Math.sin(q) * r0);
      ctx.lineTo(x + Math.cos(q) * (r0 + r * 0.6), y + Math.sin(q) * (r0 + r * 0.6));
      ctx.stroke();
    }
    ctx.restore();
  };
  const spot = (sk, what) => {
    if (what === 'mouth') return sk.mouthPt ?? sk.nosePt;
    if (what === 'nose') return sk.nosePt;
    if (what === 'slap') return sk.slapPt;
    if (what === 'tail') return sk.tailPt;
    if (what === 'ahead') return plus(sk.mouthPt ?? sk.nosePt, [sc(15), sc(1)]);
    if (what === 'rain') return plus(sk.nosePt, [sc(7), sc(3)]);
    return sk.pivot;
  };
  function drawFx(ctx, m, a) {
    const sk = a.fk;
    if (!sk) return;
    ctx.save();
    const mv = a.fsMove?.mv;
    const t = a.fsMove?.t ?? 0;
    const mouth = sk.mouthPt ?? sk.nosePt;
    // Now and then at rest, a little bubble drifts up from the mouth.
    if (m.hp > 0 && !mv) {
      const q = (a.t + (m.uid % 5) * 1.7) % 6.4;
      if (q < 2.2) {
        const u = q / 2.2;
        bubbleAt(ctx, mouth[0] + sc(1 + u * 2) + Math.sin(u * 9) * sc(0.5), mouth[1] - sc(1 + u * 10), sc(0.7 + u * 0.4), Math.sin(Math.PI * Math.min(1, u * 1.1)) * 0.9);
      }
    }
    if (!mv) {
      ctx.restore();
      return;
    }
    for (const b0 of mv.bubbles ?? []) {
      for (let i = 0; i < 3; i++) {
        const u = after([b0 + i * 0.05], t, 0.55);
        if (u < 0) continue;
        const e = 1 - (1 - u) ** 2;
        const x = mouth[0] + sc(2.5 + e * (12 + i * 4));
        const y = mouth[1] + sc((i - 1) * 1.6) * e + Math.sin(u * 10 + i) * sc(0.6);
        const r = sc(1.7 + i * 0.6) * (0.55 + 0.45 * e);
        if (u < 0.86) bubbleAt(ctx, x, y, r, 1);
        else popAt(ctx, x, y, r, (u - 0.86) / 0.14);
      }
    }
    for (const s0 of mv.spark ?? []) {
      const u = after([s0], t, 0.24);
      if (u < 0) continue;
      const [x, y] = spot(sk, mv.sparkAt);
      const e = 1 - (1 - u) ** 3;
      ctx.globalAlpha = 1 - u;
      twinkle(ctx, x, y, H * 0.13 * (0.5 + 0.7 * e), u * 0.7, '#ffffff');
      twinkle(ctx, x, y, H * 0.06 * (0.5 + 0.7 * e), u * 0.7 + 0.4, '#fff2a8');
      for (let i = 0; i < 4; i++) {
        const q = (i * TAU) / 4 + 0.5;
        twinkle(ctx, x + Math.cos(q) * H * 0.18 * e, y + Math.sin(q) * H * 0.18 * e, H * 0.035, q, i % 2 ? '#ffd2e6' : '#fff6c8');
      }
      ctx.globalAlpha = 1;
    }
    for (const g0 of mv.gust ?? []) {
      const u = after([g0], t, 0.3);
      if (u < 0) continue;
      const [x, y] = sk.slapPt;
      ctx.globalAlpha = (1 - u) * 0.8;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = sc(0.9);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x + sc(2), y + sc(3), sc(5 + i * 2.4 + u * 4), -2.4 + u * 0.8, -1.1 + u * 0.8);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    for (const b0 of mv.burst ?? []) {
      const u = after([b0], t, 0.7);
      if (u < 0) continue;
      const e = 1 - (1 - u) ** 2;
      for (let i = 0; i < 4; i++) {
        const q = -2.4 + i * 0.75;
        bubbleAt(ctx, sk.pivot[0] + Math.cos(q) * sc(8 + e * 8), sk.pivot[1] + Math.sin(q) * sc(6 + e * 6) - e * sc(4), sc(0.7 + (i % 2) * 0.5), 1 - u);
      }
    }
    for (const b0 of mv.splash ?? []) {
      const u = after([b0], t, 0.6);
      if (u < 0) continue;
      const e = 1 - (1 - u) ** 2;
      const at = sk.tail ? sk.tail.root : sk.pos[n - 1];
      for (let i = 0; i < 4; i++) bubbleAt(ctx, at[0] - sc(2 + i * 1.5) * e, at[1] + sc((i - 1.5) * 2) - e * sc(3 + i), sc(0.6 + (i % 2) * 0.4), 1 - u);
    }
    // The spout: a soft column of spray up out of the blowhole, its top puffing out, then
    // drops falling away to either side.
    for (const s0 of mv.spout ?? []) {
      const u = after([s0], t, 0.85);
      if (u < 0) continue;
      const [bx, by] = sk.blowPt;
      const up = ease(u / 0.25) * (1 - ease((u - 0.55) / 0.4));
      const hgt = sc(16) * up;
      if (hgt > 0.3) {
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = 'rgba(234,245,255,0.94)';
        ctx.strokeStyle = '#a9c7e6';
        ctx.lineWidth = sc(0.6);
        // (a soft fan of spray widening as it rises, a puffy crown on top)
        const w0 = sc(1.3);
        const w1 = sc(3.4) * (0.6 + 0.4 * up);
        ctx.beginPath();
        ctx.moveTo(bx - w0, by + sc(0.4));
        ctx.bezierCurveTo(bx - w0 * 0.8, by - hgt * 0.45, bx - w1 * 0.7, by - hgt * 0.7, bx - w1, by - hgt);
        ctx.lineTo(bx + w1, by - hgt);
        ctx.bezierCurveTo(bx + w1 * 0.7, by - hgt * 0.7, bx + w0 * 0.8, by - hgt * 0.45, bx + w0, by + sc(0.4));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        for (const [dx, dy, r] of [[-1, 0.1, 0.62], [1, 0.1, 0.62], [-0.5, -0.45, 0.7], [0.5, -0.45, 0.7], [0, -0.75, 0.66]]) {
          const cx = bx + dx * w1 * 1.05;
          const cy = by - hgt + dy * w1;
          ctx.moveTo(cx + r * w1 * up, cy);
          ctx.arc(cx, cy, r * w1 * up, 0, TAU);
        }
        ctx.fill('nonzero');
        ctx.stroke();
        ctx.fillStyle = 'rgba(234,245,255,1)';
        ctx.fill('nonzero');
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = sc(0.5);
        ctx.beginPath();
        ctx.moveTo(bx - sc(0.2), by - sc(1));
        ctx.quadraticCurveTo(bx - sc(0.6), by - hgt * 0.6, bx - w1 * 0.45, by - hgt * 0.95);
        ctx.stroke();
      }
      if (u > 0.3) {
        const w = (u - 0.3) / 0.7;
        for (let i = 0; i < 6; i++) {
          const side = i % 2 ? 1 : -1;
          const sp = sc(4 + (i >> 1) * 3.2);
          const x = bx + side * sp * w;
          const y = by - sc(16) + sc(30) * w * w + sc(i >> 1) * 0.6;
          ctx.globalAlpha = 1 - w;
          ctx.fillStyle = '#e8f4ff';
          ctx.strokeStyle = '#a9c7e6';
          ctx.lineWidth = sc(0.4);
          ctx.beginPath();
          ctx.ellipse(x, y, sc(0.8), sc(1.1), 0, 0, TAU);
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
    if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
      const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
      ctx.globalAlpha = 0.7 * (1 - k);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = sc(0.9);
      const back = minus(sk.pivot, times(sk.fwd, bodyLen * 0.5));
      for (let i = 0; i < 3; i++) {
        const y = back[1] + sc((i - 1) * 4.5);
        ctx.beginPath();
        ctx.moveTo(back[0] - sc(2) - sc(6) * k, y);
        ctx.lineTo(back[0] - sc(11) - sc(10) * k, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    const has = (nm) => FISH_MOVES[nm];
    if (m.act && has(m.act.name)) {
      const mv = FISH_MOVES[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + lengthOf(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.fsAtk) {
        const pool = m.def.moves ?? P.moves ?? POOL;
        st.fsN = (st.fsN ?? m.uid) + 1;
        st.fsPick = m.move ?? pool[st.fsN % pool.length];
      }
      st.fsAtk = true;
      const mv = FISH_MOVES[st.fsPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.fsAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lengthOf(FISH_MOVES.hurt)) return [FISH_MOVES.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < lengthOf(FISH_MOVES.wiggle)) return [FISH_MOVES.wiggle, gl, 1];
    return [null, 0, 0];
  }
  // Turning round: it mirrors like the other bases, staying level, but not on the spot: the way
  // it's shown lags the way it faces for a moment while its tail swishes, then it flips and a
  // little overshoot wiggle plays the new way and settles. (Changing its mind before the flip, it
  // simply doesn't flip; the wiggle still eases it out.) The swish and wiggle are laid over the
  // pose directly (`fsTB` bend, `fsTP` pitch, `fsTF` fins), eased so a restart never jumps.
  const [PRE, POST, SWISH] = P.turn;
  function turning(st, a, m, dt) {
    if (st.fsShown === undefined || m.hp <= 0) {
      st.fsShown = a.flip;
      st.fsTt = null;
      st.fsTB = st.fsTP = st.fsTF = 0;
      return;
    }
    if (!(dt > 0)) return;
    if (st.fsTt == null ? a.flip !== st.fsShown : st.fsTt >= PRE && a.flip !== st.fsShown) st.fsTt = 0;
    let tb = 0;
    let tp = 0;
    let tf = 0;
    if (st.fsTt != null) {
      const t0 = st.fsTt;
      st.fsTt += dt;
      if (t0 < PRE && st.fsTt >= PRE) st.fsShown = a.flip;
      const tt = st.fsTt;
      if (tt < PRE) {
        // the swish: the tail sweeping up and round, the nose lifting, the fins flaring
        const h = Math.sin(Math.PI * ease(tt / PRE));
        tb = SWISH * h;
        tp = -6 * h;
        tf = 0.7 * h;
      } else if (tt < PRE + POST) {
        // the wiggle: overshooting the other way, back, and settling
        const q = (tt - PRE) / POST;
        const decay = (1 - q) ** 1.4;
        tb = -SWISH * 0.75 * Math.sin(TAU * q) * decay;
        tp = 5 * Math.sin(TAU * q) * decay;
        tf = 0.5 * Math.sin(Math.PI * q) * decay;
      } else st.fsTt = null;
    }
    const f = Math.min(1, dt * 40);
    st.fsTB = mix(st.fsTB ?? 0, tb, f);
    st.fsTP = mix(st.fsTP ?? 0, tp, f);
    st.fsTF = mix(st.fsTF ?? 0, tf, f);
  }
  const mirrored = (a) => a.mo.rig?.fsShown !== undefined && a.mo.rig.fsShown !== a.flip;
  const live = (name, draw) => ({ name, draw });
  const seq = [
    live('pecF', (ctx, a, mode) => drawPec(ctx, a, mode, 'far')),
    live('mouth', drawMouth),
    live('anal', (ctx, a, mode) => drawSail(ctx, a, mode, 'anal')),
    live('tail', drawTail),
    live('dorsal', (ctx, a, mode) => drawSail(ctx, a, mode, 'dorsal')),
    live('body', drawBody),
    live('head', drawHead),
    live('pecN', (ctx, a, mode) => drawPec(ctx, a, mode, 'near')),
  ];
  // (this copy: each part with the dress's under / over round it)
  const paintOf = (name, draw, mode) => (ctx, a) => {
    if (!a.fk) return;
    const back = mirrored(a);
    if (back) {
      ctx.save();
      ctx.scale(-1, 1);
    }
    if (DRESS.under?.[name]) {
      ctx.save();
      DRESS.under[name](ctx, a, mode, DRESS.KIT);
      ctx.restore();
    }
    draw(ctx, a, mode);
    if (DRESS.over?.[name]) {
      ctx.save();
      DRESS.over[name](ctx, a, mode, DRESS.KIT);
      ctx.restore();
    }
    if (back) ctx.restore();
  };
  const parts = [...seq.map((q) => ({ name: q.name, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: paintOf(q.name, q.draw, 'line') })), ...seq.map((q) => ({ name: `${q.name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: paintOf(q.name, q.draw, 'fill') }))];
  const BOX_W = Math.ceil(bodyLen * 2.6 + sc(30));
  const BOX_H = Math.ceil(H * 1.9 + sc(16));
  const rig = makeRig({
    w: BOX_W,
    h: BOX_H,
    soft: true,
    stride: CYC,
    recover: 1.4,
    springs: Object.fromEntries(
      CH.map((c) => [
        c,
        {
          jaw: [480, 32],
          sink: [10, 6.4],
          lift: [90, 14],
          gill: [60, 12],
          bend: [150, 17],
          curl: [110, 15],
          dorsal: [150, 16],
          fins: [190, 19],
          spread: [170, 17],
          thrash: [110, 18],
          head: [190, 22],
        }[c] ?? [170, 21],
      ]),
    ),
    fast: CH.filter((c) => !['sink', 'lift', 'gill', 'dorsal', 'spread'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.fsActive),
    kick: { pitch: -50, bend: 160, fins: 4 },
    turnKick: {},
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.1;
      const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
      turning(st, a, m, dt);
      // How fast it's swimming: from the distance it has travelled (flyers are always "moving").
      const odo = m.odo ?? 0;
      const step = Math.min(30, Math.abs(odo - (st.fsOdo ?? odo)));
      st.fsOdo = odo;
      if (dt > 0) st.fsV = (st.fsV ?? 0) + (step / dt - (st.fsV ?? 0)) * Math.min(1, dt * 6);
      const swimGoal = clamp((st.fsV ?? 0) / (P.speed * 0.55), 0, 1);
      st.fsSwim = (st.fsSwim ?? 0) + (swimGoal - (st.fsSwim ?? 0)) * Math.min(1, dt * 4);
      const swim = ease(st.fsSwim);
      const nap = m.hp > 0 && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && a.now < m.habit.until));
      const calm = nap ? 0.3 : m.pose === 'rest' ? 0.55 : 1;
      st.fsCalm = mix(st.fsCalm ?? calm, calm, Math.min(1, dt * 2));
      // The beats: run on by the distance swum (and the body's own travel and thrashing within a
      // move); at rest, slowly.
      const mx = st.x?.x ?? 0;
      const moved = Math.min(20, Math.abs(mx - (st.fsMx ?? mx)));
      st.fsMx = mx;
      const thr = clamp(st.thrash?.x ?? 0, 0, 1.5);
      const cm = st.fsCalm;
      st.fsPh = ((st.fsPh ?? m.uid * 1.3) + TAU * ((step + moved) / CYC + dt * (P.swim.idle * (1 - swim) * cm + thr * P.swim.beats * 1.6))) % (TAU * 1000);
      st.fsFp = ((st.fsFp ?? 0) + TAU * ((step / CYC) * 0.5 + dt * (P.swim.scull * (1 - swim) * cm + thr * 2))) % (TAU * 1000);
      st.fsFl = ((st.fsFl ?? 0) + TAU * (step / FLUT + dt * (1.4 * (1 - swim) * cm + thr * 5))) % (TAU * 1000);
      // At rest: breathing (the gills), a slow bob, an easy glance up or down, a flick of the tail
      // now and then, and every so often a playful little flip.
      const breath = Math.sin(t * (nap ? 1.2 : 2.1));
      const rnd = (k) => frac(Math.sin(k * 12.9898 + (m.uid % 97) * 78.233) * 43758.5453);
      const per = 3.1;
      const blk = Math.floor(t / per);
      const look = mix(rnd(blk - 1), rnd(blk), ease(((t / per) % 1) / 0.4)) * 2 - 1;
      const flick = hold(t % 6.3, 3, 3.14, 3.3, 3.9);
      const flip = hold(t % 14.3, 9.2, 9.45, 9.65, 10.4);
      const idle = P.upright
        ? { x: 0, rise: flip * sc(2.2), lift: Math.sin(t * 1.15) * sc(0.8) + breath * sc(0.18), sink: 0, pitch: look * 2 - flip * 5, head: look * 6 - flip * 10, bend: flick * 6, curl: breath * 0.05 + flick * 0.25 - flip * 0.35, jaw: 0, gill: 0.5 + 0.5 * breath, fins: 0.1, dorsal: 0.3 + flip * 0.5, spread: 0, thrash: 0 }
        : { x: 0, rise: 0, lift: Math.sin(t * 1.15) * sc(0.8) + breath * sc(0.18), sink: 0, pitch: look * 3 - flip * 16, head: look * 4, bend: flip * 36 + flick * 12, curl: 0, jaw: 0, gill: 0.5 + 0.5 * breath, fins: 0.15 + flip * 0.6, dorsal: 0.35 + flip * 0.5, spread: 0.45 + flip * 0.5, thrash: 0 };
      const cruise = { ...idle, rise: 0, lift: 0, pitch: P.lean, head: 0, bend: 0, curl: 0, fins: P.swimFins, dorsal: P.upright ? 0.6 : 0.1, spread: 0.25, gill: 0.5 };
      const [mv, mt, anticW] = moveNow(m, a, st);
      const base = { tumble: 0 };
      for (const c of CH) base[c] = mix(idle[c], cruise[c], swim);
      base.x /= H;
      base.rise /= H;
      const out = mv ? poseIn(mv, mt, anticW, base) : { ...base };
      DRESS.pose?.(m, a, out, DRESS.KIT, mv, mt);
      if (mv && P.moveTilt) for (const k of ['pitch']) out[k] = base[k] + (out[k] - base[k]) * P.moveTilt;
      a.fsTumble = mv ? out.tumble ?? 0 : 0;
      if (m.pose === 'rest') Object.assign(out, { pitch: 1 + look, head: look * 2, fins: 0.05, dorsal: 0.1, spread: 0.3, bend: 0, lift: Math.sin(t * 0.6) * sc(0.9) });
      else if (m.pose === 'curl') Object.assign(out, P.upright ? { curl: 1.5, head: 22, pitch: 6, bend: -20, fins: -0.2, dorsal: -0.4 } : { bend: -60, head: 14, pitch: 4, fins: -0.3, dorsal: -0.5, spread: 0.2 });
      if (nap) Object.assign(out, { sink: sc(2.4) + H * 0.1, pitch: P.upright ? 4 : 7, head: P.upright ? 12 : 4, bend: P.upright ? 4 : -12, curl: P.upright ? 0.6 : 0, fins: -0.35, dorsal: -0.9, spread: 0.1, jaw: 0, gill: 0.5 + 0.5 * breath, lift: Math.sin(t * 0.7) * sc(0.25) });
      if (m.cine?.mood === 'sad' && m.hp > 0) Object.assign(out, { pitch: 8, head: 10, fins: -0.6, dorsal: -0.6, spread: 0.1 });
      else if (m.cine?.mood === 'happy' && m.hp > 0 && !mv) Object.assign(out, { fins: 0.8, dorsal: 1, spread: 1, thrash: 0.5 + 0.5 * Math.sin(t * 2) });
      if (m.hp <= 0) Object.assign(out, { pitch: 16, head: 6, bend: -16, jaw: 0.35, fins: -0.8, dorsal: -1, spread: 0, thrash: 0, curl: -0.4, gill: 0 });
      st.fsActive = Boolean(mv);
      a.fsMove = mv ? { mv, t: mt } : null;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = out.x * H;
      res.rise = out.rise * H;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.fk = skeleton(S, a, m);
    },
    parts,
    fx: (ctx, m, a) => {
      const back = mirrored(a);
      ctx.save();
      if (back) ctx.scale(-1, 1);
      drawFx(ctx, m, a);
      if (DRESS.fx && a.fk) DRESS.fx(ctx, m, a, DRESS.KIT);
      ctx.restore();
    },
  });
  // (the kit handed to the dress)
  DRESS.KIT = { C, tone, H, sc, mirrored };
  // (a still for the Monster Book: the body plain)
  const still = () => ({
    w: BOX_W,
    h: BOX_H,
    res: 3,
    shapes: P.upright
      ? [E(BOX_W / 2, BOX_H - FLOAT, sc(4.6), sc(7), C.base), E(BOX_W / 2 + sc(1.4), BOX_H - FLOAT - sc(14), sc(4.8), sc(3.9), C.base)]
      : [E(BOX_W / 2, BOX_H - FLOAT, bodyLen * 0.4, (Math.max(...BACK) + Math.max(...BELLY)) / 2, C.base)],
  });
  return { rig, still, stride: CYC, speed: P.speed, H, w: Math.round(P.upright ? sc(16) : bodyLen * 0.85), h: Math.round(H * 1.05), moves: P.moves };
}

// (the dressed seahorse: its rig with the dress's hooks; its art for the monster drawer)
export function dressedSeahorse(look) {
  const r = fishRig('seahorse', look);
  return { art: { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig }, w: r.w, h: r.h, speed: r.speed, bodyH: r.H, fly: true };
}
