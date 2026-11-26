// The mermaid base (2026-11-25): blank chibi sea folk that float and swim through the air like the
// game's other sea monsters, made for a mermaid from the start, nothing carried over from another
// base; only the engine is shared (rig.js's springs). A plain lilac mannequin like the other bases
// (bald, faceless but for its soft construction guides, nothing worn), drawn live: one smooth shape
// over its bones, outlined only on its outer edge (an outline pass, then a fill pass), in the soft
// ink, never near-black.
//
// The body, facing right (the upper body seen from the front like the human bases, the tail from
// the side, as a serpent's is):
//   upper body  a skinned shape over its own bones: the hips (the root), the waist bending from them
//               at the navel, the chest from the waist at the ribs, a collarbone each side from the
//               top of the breastbone (the shoulder lifting, `shrug`, and coming forward, `reach`),
//               the neck from the breastbone and the head on it; each point of the outline follows
//               the bones it belongs to, blended where two meet, so it bends and never opens a seam;
//               the neck is part of that same shape, running up under the jaw
//   arms        each one smooth tube from a root inside the shoulder, a round shoulder, the elbow,
//               the wrist, a mitten hand turning at the wrist; the near arm rimmed softly so it
//               reads over the body; the far one in shade behind it
//   tail        a spine chain from the hips to the fluke; the body's outline runs on down its front
//               and back up its back, so the hips flow into the tail with no join; a wide fan fluke
//               on the end and a small fin at each hip, each rooted inside the body and carried on
//               its own damped spring
//   head        a bald round mannequin head with small ears, a soft line down its middle and a soft
//               eye line across, sliding round as it glances (`look`)
//   swimming    a dolphin kick: a wave travelling from the hips down the tail to the fluke, its
//               phase run on by the distance swum (never the clock), about two kicks a second at
//               its own speed; the body leans into it and rides each kick with a gentle counter-
//               sway, the arms trailing; hovering, a slow sway of the tail and the arms sculling
//   turning     it mirrors round level like the other bases, never on the spot: a flick of the tail
//               first, the flip, then a little overshoot the new way, settling
// Presets: mermaid (the Maidens' build on a long tail), merkid (the Kid base's build on a shorter,
// chubbier tail).
// Moves (MERMAID_MOVES): tail slap (the tail whipped round under and up in front), water orb (both
// hands gather a bubble of water, then push it out), wave splash (an arm sweeping a soft arc of
// water forward), sing (hands to the chest, head back, soft notes), leap (an arcing dolphin jump),
// dash, dodge, hurt, knockdown (tumbling over backward, dazed, righting herself), twirl (a happy
// loop, when pleased); idle acts preen (brushing back imaginary hair) and stretch. Poses (m.pose):
// sit (resting on her tail curled along the ground), rest (lying along the ground up on one elbow,
// the tail curled up behind), sleep (lying with her head on her arms; a nap in the game is the
// same).

import { makeRig, clamp, TAU } from './rig.js';
import { hold } from './kidrig.js';
import { E } from './kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299' };
const INK = '#7f6982';

const ease = (u) => {
  const v = Math.min(1, Math.max(0, u));
  return v * v * (3 - 2 * v);
};
const mix = (a, b, u) => a + (b - a) * u;
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const mul = (p, k) => [p[0] * k, p[1] * k];
const lerp2 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
const rot = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const dirOf = (r) => [Math.cos(r), Math.sin(r)];
const unit = ([x, y]) => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};
const frac = (v) => v - Math.floor(v);
const rgbOf = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
// A smooth closed curve through every point (each span a cubic leaning along its neighbours).
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
// The same through an open run of points.
function runPath(ctx, pts) {
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
// An open run of points resampled smoothly, `n` steps a span, every number on each point eased
// along with it (the outline's bone weights ride along with its points).
function smoothRun(pts, n) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(p1.map((_, k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}

// ---------- The two builds (game px about the middle of the hips; x forward, y down) ----------
// head: y of its middle, half-width, half-height, how much the jaw draws in, ears [half-width,
//   half-height, how far down the head (of its half-height)].
// neck: top (the joint the head turns on, inside the head), chin, base, half-width.
// stern / ribs / navel: the spine's joints (the top of the breastbone, under the chest, the navel).
// sh: the shoulder joint [half-spread, y]; side: the near side of the body at rest, from up under the
//   jaw, down the neck, over the shoulder, past the armpit, in at the waist, out to the hips.
// lines: where the soft guide under the chest sits.
// arm: upper arm and forearm lengths, widths at the shoulder, the elbow, the wrist; the hand's
//   radius; the round of the shoulder.
// tail: each piece's length, the half-width at each joint (from the hips); `shapes`, its rest
//   curve (degrees each joint turns, + curling back behind; the first is its lean from straight
//   down, the last the fluke's) hovering, swimming, and in each pose; amp (degrees each joint swings
//   in a kick), flukeAmp, lag (radians between joints), bend (how a bend shares out).
// fluke: length, half-width at its root, how far the notch reaches in (of its length).
// fin: the hip fins' root [x, y], length, width, angle out from straight across (degrees, down).
// speed (px a second), beats (kicks a second at that speed), idle (sways a second hovering),
// pitch (its lean swimming), moves (its attacks in turn).
const MERMAID = {
  name: 'Mermaid',
  head: { y: -22.3, rx: 7.33, ry: 8, jaw: 0.35, ear: [1.2, 1.8, 0.12] },
  neck: { top: -16.7, chin: -14.7, base: -13.2, w: 1.6 },
  stern: -12.8,
  ribs: -6.67,
  navel: -3.03,
  sh: [4.53, -12.33],
  side: [[1.42, -16.5], [1.58, -14.8], [1.74, -13.3], [3.0, -13.35], [4.22, -13.72], [5.12, -12.5], [4.72, -10.1], [4.6, -8.4], [3.55, -4.67], [4.45, -1.9], [4.93, 0]],
  lines: { chest: -8.2 },
  arm: { up: 6.2, fore: 6.0, w0: 2.53, we: 2.2, w1: 1.87, hand: 1.47, ball: 1.42 },
  tail: {
    len: [5.2, 5.0, 4.8, 4.6, 4.4, 4.0],
    hw: [4.93, 4.72, 3.98, 3.1, 2.3, 1.6, 1.05],
    shapes: {
      hover: [-4, 4, 10, 20, 30, 34, 10],
      swim: [-4, 2, 3, 4, 3, 2, 6],
      sit: [-2, -20, -56, -16, -26, -42, -22],
      rest: [-4, 20, 2, -2, 16, 34, 18],
      sleep: [-4, 8, 4, 0, 14, 28, 14],
    },
    amp: [1.5, 3.5, 5.5, 7.5, 9.5, 11.5],
    flukeAmp: 16,
    lag: 0.75,
    bend: [0.4, 0.7, 1, 1.2, 1.3, 1.3],
  },
  fluke: { len: 9.2, w: 1.15, notch: 0.8 },
  fin: { j: 4, len: 4.4, w: 2.1, ang: 34 },
  speed: 30,
  beats: 1.8,
  idle: 0.42,
  pitch: 66,
  moves: ['orb', 'tailSlap', 'splash', 'sing'],
};
const MERKID = {
  name: 'Merkid',
  head: { y: -15.2, rx: 7.0, ry: 6.8, jaw: 0.2, ear: [1.0, 1.35, 0.18] },
  neck: { top: -10.2, chin: -9.0, base: -8.1, w: 1.45 },
  stern: -7.4,
  ribs: -3.13,
  navel: -1.53,
  sh: [4.33, -5.67],
  side: [[1.3, -10.3], [1.42, -9.1], [1.58, -8.05], [2.85, -7.6], [4.02, -7.06], [4.86, -5.8], [4.76, -3.6], [4.2, -2.3], [4.6, -1.0], [4.8, 0]],
  lines: { chest: null },
  arm: { up: 3.4, fore: 2.75, w0: 2.47, we: 2.2, w1: 1.87, hand: 1.4, ball: 1.37 },
  tail: {
    len: [4.0, 3.8, 3.5, 3.2, 2.9],
    hw: [4.8, 4.68, 3.95, 2.95, 2.05, 1.3],
    shapes: {
      hover: [-4, 8, 20, 32, 38, 8],
      swim: [-4, 3, 4, 3, 2, 6],
      sit: [-4, -30, -50, -6, -30, -30],
      rest: [-4, 22, 0, 18, 34, 18],
      sleep: [-4, 10, 2, 16, 30, 14],
    },
    amp: [1.5, 4.5, 7, 9.5, 12],
    flukeAmp: 16,
    lag: 0.85,
    bend: [0.5, 0.8, 1.1, 1.3, 1.3],
  },
  fluke: { len: 6.6, w: 1.3, notch: 0.8 },
  fin: { j: 3, len: 3.4, w: 1.7, ang: 34 },
  speed: 24,
  beats: 2.2,
  idle: 0.5,
  pitch: 64,
  moves: ['splash', 'tailSlap', 'orb', 'sing'],
};
export const MERMAID_PRESETS = { mermaid: MERMAID, merkid: MERKID };
export const MERMAID_KINDS = ['mermaid', 'merkid'];

// ---------- The moves ----------
// Channels: x, rise (body heights), pitch (the whole body leaning forward +), tilt (the upper body
// leaning forward from the hips +), pelvis, waist, chest (each bending forward +), turnC (the chest
// turning toward us + / away −), neck, head (nodding down +), look (the face turning toward the
// way it faces + / back −), shrugN/F, reachN/F (px), shN/F (the upper arm from hanging: − toward
// the front, + toward the back), elN/F (the forearm from the upper arm, the same way), hwN/F (the
// hand at the wrist), bend (the whole tail curling back behind + / forward under −), whip (a lash
// out at its end), curl (its rest curve tighter + / let go −), thrash (kicking hard), fins (the hip
// fins spread + / tucked −), fan (the fluke spread), tumble (whole turns, + forward; not sprung).
// A key may also set a hand by where it goes (hN / hF: [forward, down] from that arm's own
// shoulder, in its arm's reach; `bN` / `bF` 'out' bends its elbow out to the side, else down),
// worked out for each build.
// Effects: spark (a hit sparkle, at sparkAt), orb (gathered on the wind-up, thrown at its time),
// wave (the arc of water thrown), notes (a note sung at each), ring (sound rippling out), splash
// (bubbles), burst (a hit's bubbles), lines (speed lines), twirl (a ring of sparkles).
export const MERMAID_MOVES = {
  tailSlap: {
    anticT: 0.24,
    keys: [
      [0, { x: -0.03, pitch: 14, tilt: 8, bend: 60, whip: 12, shN: -40, elN: -50, shF: -30, elF: -40, fins: 0.6, fan: 0.6, head: 4 }],
      [0.09, { x: 0.05, pitch: -30, tilt: -12, bend: -178, whip: -40, shN: 40, elN: -20, shF: 50, elF: 10, fins: 1, fan: 1, head: -8 }, 'out'],
      [0.17, { x: 0.05, pitch: -26, bend: -160, whip: 26, fan: 0.9 }, 'io'],
      [0.42, { x: 0.02, pitch: 4, tilt: 0, bend: 8, whip: 0, shN: -12, elN: -34, shF: 12, elF: 30, fins: 0.3, fan: 0.4, head: 0 }, 'io'],
      [0.74, {}],
    ],
    spark: [0.09],
    sparkAt: 'fluke',
  },
  orb: {
    anticT: 0.36,
    keys: [
      [0, { x: -0.02, pitch: -5, tilt: -6, chest: -3, head: -4, look: 0.3, hN: [0.44, 0.3], hF: [0.95, 0.34], hwN: 36, hwF: 30, bend: -24, fins: 0.4, fan: 0.6 }],
      [0.1, { x: 0.05, pitch: 10, tilt: 8, chest: 2, head: 4, look: 0.5, hN: [0.98, 0.05], hF: [0.99, 0.14], hwN: -14, hwF: -10, bend: 26, whip: 10, fins: -0.2, fan: 1 }, 'out'],
      [0.3, { x: 0.04, pitch: 6, tilt: 4, hN: [0.9, 0.14], hF: [0.94, 0.22], bend: 18, whip: 0 }, 'io'],
      [0.66, {}, 'io'],
    ],
    orb: [0.1],
    spark: [0.5],
    sparkAt: 'orb',
  },
  splash: {
    anticT: 0.3,
    keys: [
      [0, { x: -0.02, pitch: -4, tilt: -6, chest: -6, turnC: -0.5, shN: 58, elN: -36, shF: -24, elF: -36, bend: 32, head: 2, look: -0.2, fins: 0.5 }],
      [0.1, { x: 0.04, pitch: 8, tilt: 8, chest: 6, turnC: 0.6, shN: -142, elN: -14, shF: 30, elF: 24, bend: -40, whip: -20, head: -6, look: 0.4, fan: 1 }, 'out'],
      [0.2, { shN: -150, elN: -26, bend: -30, whip: 14 }, 'io'],
      [0.46, { x: 0.02, pitch: 2, tilt: 2, chest: 0, turnC: 0, shN: -36, elN: -30, shF: 12, elF: 24, bend: 0, whip: 0, head: 0, look: 0 }, 'io'],
      [0.8, {}],
    ],
    wave: [0.08],
    spark: [0.36],
    sparkAt: 'wave',
  },
  sing: {
    anticT: 0.3,
    keys: [
      [0, { tilt: -3, head: -4, look: 0.2, hN: [-0.22, 0.4], hF: [0.36, 0.4], bN: 'out', hwN: 50, hwF: 40, fins: 0.3 }],
      [0.12, { rise: 0.04, tilt: -9, chest: -6, neck: -8, head: -16, look: 0.35, hN: [-0.2, 0.36], hF: [0.34, 0.36], bN: 'out', fins: 0.9, fan: 1, bend: 14 }, 'out'],
      [0.75, { rise: 0.05, tilt: -10, chest: -6, neck: -9, head: -18, look: 0.4, hN: [-0.2, 0.36], hF: [0.34, 0.36], bN: 'out', fins: 0.8, fan: 1, bend: 18 }, 'io'],
      [1.05, {}, 'io'],
    ],
    notes: [0.04, 0.26, 0.48],
    ring: [0.1, 0.42],
    spark: [0.4],
    sparkAt: 'song',
  },
  jump: {
    anticT: 0.18,
    keys: [
      [0, { rise: -0.06, pitch: 8, tilt: 4, bend: 34, shN: 30, shF: 30 }],
      [0.18, { x: 0.06, rise: 0.5, pitch: 48, tilt: -4, bend: -12, thrash: 1, shN: 64, elN: 12, shF: 64, elF: 12, fins: -0.6, fan: 0.8, head: -10 }, 'out'],
      [0.4, { x: 0.12, rise: 0.66, pitch: 92, tilt: -6, bend: 10, thrash: 0.4, shN: 40, shF: 40 }, 'io'],
      [0.6, { x: 0.16, rise: 0.22, pitch: 126, tilt: -2, bend: 26, thrash: 0.2, shN: -60, elN: -10, shF: -50, elF: -10 }, 'in'],
      [0.78, { x: 0.14, rise: -0.04, pitch: 66, tilt: -6, bend: -22, fins: 0.6, fan: 1, shN: 20, shF: 20 }, 'out'],
      [1.12, {}, 'io'],
    ],
    splash: [0.02, 0.72],
  },
  dash: {
    anticT: 0.08,
    keys: [
      [0, { x: -0.03, pitch: 16, bend: 22 }],
      [0.08, { x: 0.22, pitch: 52, tilt: -8, thrash: 1.2, shN: 70, elN: 6, shF: 70, elF: 6, fins: -1, fan: 0.4, head: -10 }, 'out'],
      [0.3, { x: 0.25, pitch: 48, thrash: 0.9 }],
      [0.46, { x: 0.22, pitch: 8, tilt: 0, thrash: 0, fins: 0.7, fan: 1, bend: 22, head: 0 }, 'io'],
      [0.82, {}],
    ],
    lines: [0, 0.32],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { fins: 0.4 }],
      [0.12, { x: -0.24, rise: 0.17, pitch: -22, tilt: -8, bend: -46, whip: -14, shN: -70, elN: -30, shF: 60, elF: 24, fins: 1, fan: 1, thrash: 0.6, head: 6 }, 'out'],
      [0.32, { x: -0.26, rise: 0.06, pitch: -6, tilt: -2, bend: 4, whip: 0, thrash: 0 }, 'in'],
      [0.5, { x: -0.24, rise: 0, pitch: 2, tilt: 0, bend: 0, shN: -20, elN: -30, shF: 15, elF: 22, fins: 0.2, head: 0 }, 'io'],
      [0.86, {}],
    ],
  },
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.05, pitch: -16, tilt: -10, neck: -6, head: -14, shN: -110, elN: -40, shF: 100, elF: 40, bend: 36, whip: 20, fins: 1, fan: 1 }, 'out'],
      [0.2, { x: -0.05, pitch: -9, tilt: -4, neck: -2, head: -6, shN: -60, elN: -40, shF: 50, elF: 30, bend: 14, whip: 0 }],
      [0.42, { x: -0.02, pitch: -2, tilt: 0, neck: 0, head: 0, shN: -20, elN: -26, shF: 15, elF: 22, bend: 0, fins: 0.2 }, 'io'],
      [0.76, {}],
    ],
    burst: [0.05],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.08, { x: -0.06, pitch: -14, tilt: -10, head: -14, shN: -120, elN: -30, shF: 110, elF: 30, bend: 30, fins: 1, fan: 1 }, 'out'],
      [0.56, { x: -0.16, rise: -0.1, pitch: 10, tilt: 12, head: 18, shN: -30, elN: -12, shF: 30, elF: 12, bend: -10, fins: -0.7, fan: 0, tumble: -1 }, 'io'],
      [0.66, { x: -0.16, rise: -0.08, pitch: 8, tumble: -1 }, 'out'],
      [1.1, { x: -0.16, rise: -0.12, pitch: 12, tilt: 14, head: 20, shN: -26, elN: -8, shF: 26, elF: 8, bend: -14, fins: -0.8, fan: 0, tumble: -1 }, 'io'],
      [1.38, { x: -0.08, rise: 0.02, pitch: -6, tilt: -4, head: -4, shN: -64, elN: -20, shF: 60, elF: 20, bend: 12, thrash: 0.7, fins: 0.8, fan: 1, tumble: -1 }, 'io'],
      [1.74, { tumble: -1 }, 'io'],
    ],
    burst: [0.08],
  },
  twirl: {
    anticT: 0.12,
    keys: [
      [0, { rise: -0.03, shN: -24, shF: 24, fins: 0.4 }],
      [0.14, { rise: 0.12, pitch: -8, shN: -96, elN: -10, shF: 96, elF: 10, fins: 1, fan: 1, head: -8, look: 0.3, bend: 24, tumble: 0.08 }, 'out'],
      [0.72, { rise: 0.12, pitch: -6, shN: -100, elN: -14, shF: 100, elF: 14, fins: 1, fan: 1, bend: 34, tumble: 0.94 }, 'io'],
      [0.92, { rise: 0.05, pitch: 3, tilt: -4, head: -10, look: 0.4, hN: [-0.2, 0.36], hF: [0.34, 0.36], bN: 'out', hwN: 50, bend: 6, fins: 0.8, tumble: 1 }, 'out'],
      [1.3, { tumble: 1 }, 'io'],
    ],
    twirl: [0.14, 0.92],
  },
  // (idle acts, played now and then while she's calm)
  preen: {
    anticT: 0.32,
    idle: true,
    keys: [
      [0, { tilt: -2, chest: -2, neck: 3, head: 6, look: 0.25, hN: [0.26, -0.8], bN: 'out', hwN: 10 }],
      [0.38, { tilt: -4, chest: -3, neck: 4, head: 10, look: 0.35, hN: [-0.12, -0.97], bN: 'out', hwN: -34 }, 'io'],
      [0.6, { tilt: -4, neck: 4, head: 9, look: 0.3, hN: [-0.2, -0.9], bN: 'out', hwN: -46 }, 'io'],
      [1.1, {}, 'io'],
    ],
  },
  stretch: {
    anticT: 0.42,
    idle: true,
    keys: [
      [0, { tilt: -3, head: -6, shN: -150, elN: -40, shF: 150, elF: 40, fins: 0.3 }],
      [0.5, { rise: 0.03, tilt: -7, chest: -4, neck: -4, head: -14, shN: -172, elN: -8, shF: 172, elF: 8, bend: 20, curl: -0.3, fins: 0.9, fan: 1 }, 'io'],
      [1.05, { rise: 0.03, tilt: -8, chest: -5, neck: -4, head: -15, shN: -174, elN: -6, shF: 174, elF: 6, bend: 24, curl: -0.35, fins: 1, fan: 1 }, 'io'],
      [1.6, { tilt: 1, head: 3, shN: -36, elN: -30, shF: 30, elF: 26, bend: -6 }, 'io'],
      [2.05, {}, 'io'],
    ],
  },
};
export const MERMAID_SHOW = ['tailSlap', 'orb', 'splash', 'sing', 'jump', 'dash', 'dodge', 'hurt', 'knockdown', 'twirl', 'preen', 'stretch'];
const lengthOf = (mv) => mv.keys[mv.keys.length - 1][0];
const EASES = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: ease };
// A move's pose at t (before 0: easing from the rest pose into its first key by `antic`).
function poseAt(mv, t, antic, rest) {
  const out = {};
  if (t < 0) {
    const k0 = { ...rest, ...mv.keys[0][1] };
    const u = ease(antic);
    for (const k of Object.keys(rest)) out[k] = mix(rest[k], k0[k], u);
    return out;
  }
  let i = 0;
  while (i < mv.keys.length - 1 && t >= mv.keys[i + 1][0]) i++;
  if (i >= mv.keys.length - 1) return { ...rest, ...mv.keys[mv.keys.length - 1][1] };
  const [t0, p0] = mv.keys[i];
  const [t1, p1, how] = mv.keys[i + 1];
  const u = (EASES[how] ?? ease)(clamp((t - t0) / Math.max(1e-6, t1 - t0), 0, 1));
  const a = { ...rest, ...p0 };
  const b = { ...rest, ...p1 };
  for (const k of Object.keys(rest)) out[k] = mix(a[k], b[k], u);
  return out;
}
// (0..1 through the `len` seconds after the latest of these moments, or −1)
const after = (moments, t, len) => {
  let u = -1;
  for (const m0 of moments ?? []) if (t >= m0 && t <= m0 + len) u = (t - m0) / len;
  return u;
};
// An arm reaching for a point `T` from its shoulder (game px), its upper arm `Lu` and forearm `Lf`
// long: the upper arm's and the forearm's turns (degrees, from hanging), the elbow bent down, or
// out to its side.
function reachFor(T, Lu, Lf, far, how) {
  const d = clamp(Math.hypot(T[0], T[1]), Math.abs(Lu - Lf) + 0.2, (Lu + Lf) * 0.985);
  const aT = Math.atan2(-T[0], T[1]);
  const al = Math.acos(clamp((Lu * Lu + d * d - Lf * Lf) / (2 * Lu * d), -1, 1));
  const be = Math.PI - Math.acos(clamp((Lu * Lu + Lf * Lf - d * d) / (2 * Lu * Lf), -1, 1));
  const sols = [[aT + al, -be], [aT - al, be]];
  const elbow = ([u]) => [-Math.sin(u) * Lu, Math.cos(u) * Lu];
  const pick = how === 'out' ? (s) => (far ? -elbow(s)[0] : elbow(s)[0]) : (s) => elbow(s)[1];
  const [u, e] = pick(sols[0]) >= pick(sols[1]) ? sols[0] : sols[1];
  return [u / D2R, e / D2R];
}

const CH = ['x', 'rise', 'pitch', 'tilt', 'pelvis', 'waist', 'chest', 'turnC', 'neck', 'head', 'look', 'shrugN', 'shrugF', 'reachN', 'reachF', 'shN', 'elN', 'hwN', 'shF', 'elF', 'hwF', 'bend', 'whip', 'curl', 'thrash', 'fins', 'fan', 'sitW', 'restW', 'sleepW', 'side'];
const EMPTY = () => sprite('rig|blankempty', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// ---------- One rig for a build ----------
function mermaidRig(kind) {
  const P = MERMAID_PRESETS[kind];
  const A = P.arm;
  const T = P.tail;
  const nSeg = T.len.length;
  const SHX = P.sh[0];
  const SHY = P.sh[1];
  const REACH = A.up + A.fore;
  const BSUM = T.bend.reduce((x, y) => x + y, 0);
  const BW = T.bend.map((v) => v / BSUM);
  const WW = T.len.map((_, j) => ((j + 1) / nSeg) ** 2);
  const WSUM = WW.reduce((x, y) => x + y, 0);
  const WWn = WW.map((v) => v / WSUM);
  const CYC = P.speed / P.beats;

  // The moves for this build: hands set by where they go worked out to arm turns.
  const MV = {};
  for (const [name, mv] of Object.entries(MERMAID_MOVES)) {
    MV[name] = {
      ...mv,
      keys: mv.keys.map(([kt, pose, how]) => {
        const q = { ...pose };
        for (const s of ['N', 'F']) {
          const h = q[`h${s}`];
          if (!h) continue;
          const [u, e] = reachFor([h[0] * REACH, h[1] * REACH], A.up, A.fore, s === 'F', q[`b${s}`]);
          q[`sh${s}`] = u;
          q[`el${s}`] = e;
          delete q[`h${s}`];
          delete q[`b${s}`];
        }
        delete q.bN;
        delete q.bF;
        return [kt, q, how];
      }),
    };
  }

  // ---------- The body's outline at rest, each point with its bones ----------
  // Bones: 0 the hips, 1 the waist, 2 the chest, 3 the neck, 4 the far collarbone, 5 the near.
  const NB = P.neck.base;
  const NW = P.neck.w;
  const d0 = (P.navel - P.ribs) * 0.5;
  const weightsAt = ([x, y]) => {
    let p = 0;
    let w = 0;
    let c = 0;
    if (y <= P.ribs - d0) c = 1;
    else if (y < P.ribs + d0) {
      const u = ease((y - (P.ribs - d0)) / (2 * d0));
      w = u;
      c = 1 - u;
    } else if (y <= P.navel - d0 * 0.6) w = 1;
    else if (y < P.navel + d0 * 1.4) {
      const u = ease((y - (P.navel - d0 * 0.6)) / (d0 * 2));
      p = u;
      w = 1 - u;
    } else p = 1;
    // (up the neck, the neck's bone; round the shoulder, its collarbone)
    const nk = c * ease((NB + 0.5 - y) / 1.8) * (1 - ease((Math.abs(x) - NW * 1.5) / NW));
    c -= nk;
    const up = 1 - ease((y - (SHY - A.w0 * 0.1)) / (A.w0 * 1.1));
    const side = ease((Math.abs(x) - NW * 1.15) / Math.max(0.5, SHX - NW * 1.15));
    const k = c * up * side;
    c -= k;
    return [p, w, c, nk, x < 0 ? k : 0, x < 0 ? 0 : k];
  };
  const withW = (p) => [p[0], p[1], ...weightsAt(p)];
  const NEAR = smoothRun(P.side, 3).map(withW);
  const FAR = NEAR.map(([x, y]) => withW([-x, y]));
  // (the bands of light and shade, and the guides, as rest points with their bones)
  const sideBand = (from, to, k0, k1, sgn) => {
    const e = smoothRun(P.side, 3).filter(([, y]) => y >= from && y <= to);
    const edge = e.map(([x, y]) => withW([sgn * x * k0, y]));
    const inner = e.map(([x, y]) => {
      const k = k1 * ease((y - from) / 2.2);
      return withW([sgn * x * (k0 - k), y]);
    });
    return { edge, inner };
  };
  const SHADE = sideBand(SHY + 0.6, 0, 1, 0.32, -1);
  const LIGHT = sideBand(SHY + A.w0 * 1.05, 0, 0.97, 0.1, 1);
  const halfAt = (y) => {
    const s = P.side;
    for (let i = 0; i < s.length - 1; i++) if ((s[i][1] - y) * (s[i + 1][1] - y) <= 0) return mix(s[i][0], s[i + 1][0], (y - s[i][1]) / ((s[i + 1][1] - s[i][1]) || 1));
    return s[s.length - 1][0];
  };
  const CENTRE = Array.from({ length: 9 }, (_, i) => mix(NB + 0.9, P.navel + 1.2, i / 8));
  const COLLAR = [-1, 1].map((s) => [[NW * 0.72 * s, SHY + 0.33], [SHX * 0.45 * s, SHY + 0.6], [SHX * 0.74 * s, SHY + 0.4]].map(withW));
  const glowRest = { chest: withW([SHX * 0.3, mix(SHY, P.lines.chest, 0.55)]), hip: withW([halfAt(-1) * 0.36, -0.8]) };

  // ---------- The skeleton: every bone placed, the outline over them ----------
  // `o`: what isn't a sprung channel: the kick's phase and size, the swim, each pose's weight, the
  // turn's flick, the float.
  function geometry(S, o) {
    const kick = o.kick;
    const ph = o.ph;
    // (riding the kick: the body pitching and bobbing a touch, the chest and the head countering)
    const wP = kick * 2.2 * Math.sin(ph + 0.5);
    const wC = -kick * 1.8 * Math.sin(ph - 0.4);
    const wH = -kick * 1.3 * Math.sin(ph - 1.0);
    const bob = kick * 0.7 * Math.sin(ph - 0.6);
    const pitch = (S.pitch + o.tp + wP) * D2R;
    const aP = pitch + (S.tilt * 0.2 + S.pelvis) * D2R;
    const aW = aP + (S.tilt * 0.35 + S.waist) * D2R;
    const aC = aW + (S.tilt * 0.45 + S.chest + wC) * D2R;
    const Hc = [S.x, -(o.float + S.rise + bob)];
    const frame = (O, a, R) => ({ O, a, R });
    const at = (f, p) => add(f.O, rot(sub(p, f.R), f.a));
    const pel = frame(Hc, aP, [0, 0]);
    const wai = frame(at(pel, [0, P.navel]), aW, [0, P.navel]);
    const che = frame(at(wai, [0, P.ribs]), aC, [0, P.ribs]);
    const st0 = at(che, [0, P.stern]);
    const nec = frame(st0, aC + S.neck * D2R, [0, P.stern]);
    const claF = frame(add(st0, rot([S.reachF, 0], aC)), aC + S.shrugF * D2R, [0, P.stern]);
    const claN = frame(add(st0, rot([S.reachN, 0], aC)), aC - S.shrugN * D2R, [0, P.stern]);
    const bones = [pel, wai, che, nec, claF, claN];
    // (turned toward the side as she swims, `side`: the body narrows, most across the shoulders,
    // the chest turning to face the way she goes; the shoulders close in toward the middle)
    const sd = clamp(S.side, 0, 1);
    const narrow = (x, y) => {
      if (sd <= 0) return x;
      const t = clamp((y - SHY) / -SHY, 0, 1);
      const nk = ease((y - (SHY - 1.8)) / 1.8);
      const k = x > 0 ? mix(0.5, 0.86, ease(t * 2.2)) : mix(0.56, 0.8, t);
      return x * mix(1, mix(1, k, nk), sd);
    };
    const skin = (q0) => {
      const q = [narrow(q0[0], q0[1]), q0[1]];
      let x = 0;
      let y = 0;
      for (let i = 0; i < 6; i++) {
        const w = q0[2 + i];
        if (!w) continue;
        const p = at(bones[i], q);
        x += p[0] * w;
        y += p[1] * w;
      }
      return [x, y];
    };
    const sk = { S, o, Hc, aP, aC, pel, che, nec, skin, at };
    // The head, on the neck's top.
    const hd = frame(at(nec, [0, P.neck.top]), nec.a + (S.head + wH) * D2R, [0, P.neck.top]);
    sk.head = { f: hd, c: at(hd, [0, P.head.y]), a: hd.a };
    // The arms, on their collarbones.
    sk.arms = {};
    for (const s of ['F', 'N']) {
      const cla = s === 'N' ? claN : claF;
      const sx = (s === 'N' ? SHX : -SHX) * (1 - 0.72 * sd);
      const sh = at(cla, [sx, SHY]);
      const root = at(cla, [sx - Math.sign(sx) * A.w0 * 0.6 * (1 - 0.6 * sd), SHY + A.w0 * 0.3]);
      const aU = aC + S[`sh${s}`] * D2R;
      const el = add(sh, rot([0, A.up], aU));
      const aF = aU + S[`el${s}`] * D2R;
      const wr = add(el, rot([0, A.fore], aF));
      const aH = aF + S[`hw${s}`] * D2R;
      sk.arms[s] = { root, sh, el, wr, aH, hand: add(wr, rot([0, A.hand * 0.9], aH)) };
    }
    // The tail: each piece turned from the one before by its rest curve, the bend, the lash and
    // the kick's wave, travelling down it.
    const shapes = T.shapes;
    const sw = o.swim;
    const w3 = [o.sit, o.rest, o.sleep];
    const wsum = w3[0] + w3[1] + w3[2];
    const curlK = 1 + clamp(S.curl, -0.9, 1.5);
    const shape = shapes.hover.map((v, j) => {
      let r = mix(v, shapes.swim[j], sw);
      if (wsum > 0.001) {
        const pz = (w3[0] * shapes.sit[j] + w3[1] * shapes.rest[j] + w3[2] * shapes.sleep[j]) / wsum;
        r = mix(r, pz, Math.min(1, wsum));
      }
      return r;
    });
    const bendAll = S.bend + o.tb;
    const pos = [Hc];
    const ang = [];
    for (let j = 0; j < nSeg; j++) {
      const rel = shape[j] * (j ? curlK : 1) + bendAll * BW[j] + S.whip * WWn[j] + kick * T.amp[j] * Math.sin(ph - T.lag * j) + (o.soft?.[j] ?? 0) / D2R;
      const a0 = (j ? ang[j - 1] : aP + Math.PI / 2) + rel * D2R;
      ang.push(a0);
      pos.push(add(pos[j], mul(dirOf(a0), T.len[j])));
    }
    const front = [];
    const back = [];
    const nrm = [];
    for (let j = 1; j <= nSeg; j++) {
      const d = j < nSeg ? unit(add(dirOf(ang[j - 1]), dirOf(ang[j]))) : dirOf(ang[nSeg - 1]);
      const nn = [d[1], -d[0]];
      nrm.push(nn);
      front.push(add(pos[j], mul(nn, T.hw[j])));
      back.push(sub(pos[j], mul(nn, T.hw[j])));
    }
    const tip = add(pos[nSeg], mul(dirOf(ang[nSeg - 1]), T.hw[nSeg] * 0.85));
    sk.tail = { pos, ang, front, back, nrm, tip };
    sk.flukeRest = ang[nSeg - 1] + (shape[nSeg] + kick * T.flukeAmp * Math.sin(ph - T.lag * nSeg) + S.whip * 0.35 + bendAll * 0.12) * D2R;
    // The outline: down the near side, down the tail's front, round its end, back up its back,
    // up the far side; it closes across under the jaw, inside the head.
    const near = NEAR.map(skin);
    const far = FAR.map(skin);
    sk.near = near;
    sk.far = far;
    sk.outline = [...near, ...front, tip, ...back.slice().reverse(), ...far.slice().reverse()];
    return sk;
  }

  // ---------- Its size at rest ----------
  const REST0 = Object.fromEntries(CH.map((c) => [c, 0]));
  const O0 = { kick: 0, ph: 0, swim: 0, sit: 0, rest: 0, sleep: 0, tp: 0, tb: 0, float: 0 };
  const sk0 = geometry(REST0, O0);
  const flukePts = (root, ang, spread, flex) => {
    const L = P.fluke.len;
    const w = P.fluke.w;
    const sK = 0.78 + 0.32 * clamp(spread, 0, 1.3);
    const q = (u, v) => add(root, rot([u, v], ang + flex * (Math.max(0, u) / L) ** 1.5));
    const side = (s) => [q(-w * 0.8, s * w * 0.8), q(L * 0.22, s * (w + L * 0.1)), q(L * 0.5, s * L * 0.36 * sK), q(L * 0.78, s * L * 0.7 * sK), q(L * 0.96, s * L * 0.66 * sK), q(L * 1.04, s * L * 0.42 * sK), q(L * 0.98, s * L * 0.18 * sK)];
    const up = side(-1);
    const dn = side(1);
    return [...up, q(L * P.fluke.notch, 0), ...dn.reverse()];
  };
  let low = -Infinity;
  for (const p of [...sk0.outline, ...flukePts(sk0.tail.pos[nSeg], sk0.flukeRest, 0.4, 0)]) low = Math.max(low, p[1]);
  const FLOAT = low + 2;
  const crown = sk0.head.c[1] - P.head.ry;
  const H = FLOAT - crown;
  const GROUND = 4.5;

  // ---------- The loose parts on springs: the hip fins and the fluke ----------
  function loose(sk, st, m, a, dt) {
    const flipS = st.mmShown ? -1 : 1;
    const wx = (m.x ?? 0) + flipS * sk.Hc[0];
    const wy = (m.y ?? 0) + sk.Hc[1] + (a.mmDy ?? 0);
    let ax = 0;
    let ay = 0;
    let al = 0;
    const steady = dt > 0 && st.mmW !== undefined && Math.hypot(wx - st.mmW[0], wy - st.mmW[1]) < 30;
    if (steady) {
      const vx = (wx - st.mmW[0]) / dt;
      const vy = (wy - st.mmW[1]) / dt;
      const om = (sk.aP - st.mmA) / dt;
      if (st.mmVel) {
        const f = Math.min(1, dt * 18);
        st.mmAcc = [mix(st.mmAcc[0], clamp((vx - st.mmVel[0]) / dt, -1500, 1500), f), mix(st.mmAcc[1], clamp((vy - st.mmVel[1]) / dt, -1500, 1500), f), mix(st.mmAcc[2], clamp((om - st.mmVel[2]) / dt, -260, 260), f)];
        [ax, ay, al] = st.mmAcc;
        ax *= flipS;
      }
      st.mmVel = [vx, vy, om];
    } else {
      st.mmVel = null;
      st.mmAcc = [0, 0, 0];
    }
    st.mmW = [wx, wy];
    st.mmA = sk.aP;
    const FS = (st.mmSpr ??= {});
    const swing = (key, u, k, c, gain, lagA, extra = 0) => {
      const f = (FS[key] ??= { o: 0, w: 0 });
      if (!(dt > 0)) return f.o;
      const n = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / n;
      const push = gain * (u[1] * ax - u[0] * ay) - lagA * al + extra;
      for (let i = 0; i < n; i++) {
        f.w += (-k * f.o - c * f.w + push) * h;
        f.o += f.w * h;
        if (Math.abs(f.o) > 0.65) {
          f.o = Math.sign(f.o) * 0.65;
          f.w *= -0.3;
        }
      }
      if (!Number.isFinite(f.o)) Object.assign(f, { o: 0, w: 0 });
      return f.o;
    };
    const S = sk.S;
    const kick = sk.o.kick;
    const t = a.t ?? 0;
    // The tail fins: a small pair where the tail narrows, one off its front, one off its back,
    // swept back toward the fluke, fluttering a beat behind each kick; spread or tucked (`fins`).
    sk.fins = {};
    {
      const j = P.fin.j;
      const tl = sk.tail;
      const da = tl.ang[Math.min(j, nSeg - 1)];
      for (const s of ['F', 'N']) {
        const sg = s === 'N' ? -1 : 1;
        const flut = 8 * kick * Math.sin(sk.o.ph - T.lag * j - 1.0) + 2 * Math.sin(t * 1.4 + (s === 'N' ? 0 : 1.7));
        const spread = clamp(S.fins, -1, 1.2) * 18;
        let an = da + sg * (P.fin.ang + spread + flut) * D2R;
        an += swing(`fin${s}`, dirOf(an), 160, 10, 0.024, 0.4);
        const root = add(tl.pos[j], mul(tl.nrm[j - 1], -sg * T.hw[j] * 0.35));
        sk.fins[s] = { root, ang: an, len: P.fin.len, w: P.fin.w, sg: -sg };
      }
    }
    // The fluke: the tail's wave carried on into it, trailing the tail's turns and the body's moves.
    const last = sk.tail.ang[nSeg - 1];
    const prev = st.mmLast;
    let aa = 0;
    if (dt > 0 && prev !== undefined && Math.abs(last - prev) < 1.5) {
      const om = (last - prev) / dt;
      st.mmLastA = mix(st.mmLastA ?? 0, clamp((om - (st.mmLastV ?? om)) / dt, -400, 400), Math.min(1, dt * 18));
      st.mmLastV = om;
      aa = st.mmLastA;
    } else st.mmLastV = undefined;
    st.mmLast = last;
    const fa = sk.flukeRest;
    const flex = swing('fluke', dirOf(fa), 150, 8.5, 0.02, 0.0, -0.022 * aa);
    sk.fluke = { root: sk.tail.pos[nSeg], ang: fa + flex * 0.6, flex, spread: S.fan };
    sk.fluke.pts = flukePts(sk.fluke.root, sk.fluke.ang, S.fan, flex * 0.9);
  }

  // ---------- The soft tail ----------
  // Each joint of the tail has a little wobble of its own on a damped spring, laid over its pose: the
  // body's starts and stops (pushing across each piece the way it points), its turns, a hit's jolt
  // and a twirl's spin swing the first piece, and each piece's swing drives the next, a beat later,
  // so a wobble runs down the tail to the fluke and settles in a bounce or two. Only turning about
  // each joint: the tail keeps its shape and size.
  function softTail(st, a, dt) {
    const TS = (st.mmTS ??= T.len.map(() => ({ o: 0, w: 0 })));
    if (!(dt > 0)) return TS.map((q) => q.o);
    const [ax, ay, al] = st.mmAcc ?? [0, 0, 0];
    // (a twirl or a tumble's spin, as it speeds up and slows)
    const tum = (a.mmTumble ?? 0) * TAU;
    const tv = st.mmTumP !== undefined ? (tum - st.mmTumP) / dt : 0;
    const tacc = st.mmTumV !== undefined ? clamp((tv - st.mmTumV) / dt, -300, 300) : 0;
    st.mmTumP = tum;
    st.mmTumV = tv;
    st.mmTumA = mix(st.mmTumA ?? 0, tacc, Math.min(1, dt * 18));
    const dirs = st.mmTailDirs ?? T.len.map(() => [0, 1]);
    const n = TS.length;
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    let drive = clamp(al + st.mmTumA, -160, 160);
    for (let j = 0; j < n; j++) {
      const q = TS[j];
      const u = j / Math.max(1, n - 1);
      const k = mix(120, 70, u);
      const c = 2 * 0.27 * Math.sqrt(k);
      const d = dirs[j] ?? [0, 1];
      const push = 0.045 * (0.5 + 0.5 * u) * (d[1] * ax - d[0] * ay) - (j ? 0.32 : 0.12) * drive;
      const w0 = q.w;
      for (let i = 0; i < steps; i++) {
        q.w += (-k * q.o - c * q.w + push) * h;
        q.o += q.w * h;
        if (Math.abs(q.o) > 0.24) {
          q.o = Math.sign(q.o) * 0.24;
          q.w *= -0.3;
        }
      }
      if (!Number.isFinite(q.o)) Object.assign(q, { o: 0, w: 0 });
      drive = clamp((q.w - w0) / dt, -160, 160);
    }
    return TS.map((q) => q.o);
  }

  // ---------- Drawing ----------
  const tone = (a, c, al = 1) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = rgbOf(c);
    const f = (v) => Math.round(v + (255 - v) * k);
    return al >= 1 ? `rgb(${f(r)},${f(g)},${f(b)})` : `rgba(${f(r)},${f(g)},${f(b)},${al})`;
  };
  const ink = (ctx) => {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const glow = (ctx, a, at, r, col, al, inner = 0) => {
    const [cr, cg, cb] = rgbOf(col);
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const f = (v) => Math.round(v + (255 - v) * k);
    const g = ctx.createRadialGradient(at[0], at[1], 0, at[0], at[1], r);
    g.addColorStop(0, `rgba(${f(cr)},${f(cg)},${f(cb)},${al})`);
    if (inner) g.addColorStop(inner, `rgba(${f(cr)},${f(cg)},${f(cb)},${al})`);
    g.addColorStop(1, `rgba(${f(cr)},${f(cg)},${f(cb)},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(at[0] - r, at[1] - r, r * 2, r * 2);
  };
  const guide = (ctx, a, pts, al = 1, col = C.guide, w = 0.32) => {
    if (al <= 0.02 || pts.length < 2) return;
    ctx.save();
    ctx.globalAlpha *= al;
    ctx.strokeStyle = tone(a, col);
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    runPath(ctx, pts);
    ctx.stroke();
    ctx.restore();
  };
  const bodyPath = (ctx, sk) => {
    ctx.beginPath();
    loopPath(ctx, sk.outline);
  };
  // (a shape's own edge, soft, only where it lies over the body, and never round its root)
  const rimOver = (ctx, a, sk, path, hole, r, col = C.sh, w = 1.1) => {
    ctx.save();
    bodyPath(ctx, sk);
    ctx.clip();
    if (hole) {
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      ctx.moveTo(hole[0] + r, hole[1]);
      ctx.arc(hole[0], hole[1], r, 0, TAU);
      ctx.clip('evenodd');
    }
    ctx.beginPath();
    path();
    ctx.strokeStyle = tone(a, col);
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  };

  // The body: one smooth shape, the upper body over its bones running on into the tail; a hard
  // band of shade down the far side and the tail's back, a thin light down the near side and the
  // tail's front, a soft light on the chest and the near hip, the shoulder plain where the near arm
  // comes out of it; faint construction lines; a soft shadow under the chin.
  function drawBody(ctx, a, mode) {
    const sk = a.mm;
    bodyPath(ctx, sk);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    bodyPath(ctx, sk);
    ctx.clip();
    const tl = sk.tail;
    const n = nSeg;
    // (the far side's shade, on down the tail's back, narrowing to its end)
    {
      const edge = [...SHADE.edge.map(sk.skin), ...tl.back];
      const inner = [...SHADE.inner.map(sk.skin), ...tl.pos.slice(1).map((p, j) => sub(p, mul(tl.nrm[j], T.hw[j + 1] * (0.62 + 0.3 * (j / n)))))];
      ctx.beginPath();
      loopPath(ctx, [...edge, ...inner.reverse()]);
      ctx.fillStyle = tone(a, C.sh);
      ctx.fill();
    }
    // (a light down the near side, on down the tail's front)
    {
      const edge = [...LIGHT.edge.map(sk.skin), ...tl.front.slice(0, n - 1).map((p, j) => sub(p, mul(tl.nrm[j], T.hw[j + 1] * 0.04)))];
      const inner = [...LIGHT.inner.map(sk.skin), ...tl.pos.slice(1, n).map((p, j) => add(p, mul(tl.nrm[j], T.hw[j + 1] * (0.82 + 0.1 * (j / n)))))];
      ctx.beginPath();
      loopPath(ctx, [...edge, ...inner.reverse()]);
      ctx.fillStyle = tone(a, C.lt);
      ctx.fill();
    }
    // (soft lights: the chest turning with it, the near hip, down the tail's middle)
    const tc = clamp(sk.S.turnC + clamp(sk.S.side, 0, 1) * 0.8, -1, 1);
    glow(ctx, a, sk.skin(withW([glowRest.chest[0] + SHX * 0.3 * tc, glowRest.chest[1]])), SHX * 0.78, C.lt, 0.8);
    glow(ctx, a, sk.skin(glowRest.hip), halfAt(-1) * 0.6, C.lt, 0.45);
    glow(ctx, a, add(lerp2(tl.pos[1], tl.pos[2], 0.5), mul(tl.nrm[0], T.hw[1] * 0.25)), T.hw[1] * 0.9, C.lt, 0.35);
    // (where the near arm comes out, the body eased to its plain colour, so the arm melts in)
    if (!(a.flash > 0)) glow(ctx, a, sk.arms.N.sh, A.ball * 2.3, C.base, 1, 0.5);
    // Construction lines: down the middle (sliding round as the chest turns), under the chest, the
    // collarbones.
    guide(ctx, a, CENTRE.map((y) => sk.skin(withW([Math.sin(tc * 0.7) * halfAt(y) * 0.95 * (1 - ease((y - P.ribs) / (P.navel - P.ribs + 1))), y]))), 0.75);
    if (P.lines.chest != null) {
      const y0 = P.lines.chest;
      const hw = halfAt(y0);
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const th = -1.2 + (i / 10) * 2.4 + tc * 0.6;
        if (Math.cos(th - tc * 0.6) < -0.05) continue;
        pts.push(sk.skin(withW([Math.sin(th) * hw * 0.92, y0 + Math.cos(th) * 0.35])));
      }
      guide(ctx, a, pts, 0.75);
    }
    for (const c of COLLAR) guide(ctx, a, c.map(sk.skin), 0.9, C.sh, 0.34);
    // (a soft shadow on the neck under the chin)
    {
      const hf = sk.head.f;
      const ch = sk.at(hf, [0, P.head.y + P.head.ry * 0.9]);
      ctx.save();
      ctx.translate(ch[0], ch[1] + 0.2);
      ctx.rotate(sk.head.a);
      ctx.scale(1, 0.42);
      glow(ctx, a, [0, 0], NW * 1.5, C.sh, 0.75);
      ctx.restore();
    }
    ctx.restore();
  }

  // The head: round, the jaw drawn in a little, small ears; bald and faceless but for a soft line
  // down its middle and the eye line across, both sliding round as it glances.
  const headPts = (() => {
    const { rx, ry, jaw } = P.head;
    return Array.from({ length: 36 }, (_, i) => {
      const th = (i / 36) * TAU - Math.PI / 2;
      const s = Math.sin(th);
      const lo = Math.max(0, s);
      return [Math.cos(th) * rx * (1 - jaw * 0.34 * lo ** 1.6), s * ry * (1 + jaw * 0.07 * lo)];
    });
  })();
  function drawHead(ctx, a, mode) {
    const sk = a.mm;
    const { f } = sk.head;
    const Hd = P.head;
    const look = clamp(sk.S.look, -1, 1);
    const sd = clamp(sk.S.side, 0, 1);
    ctx.save();
    ctx.translate(...sk.head.c);
    ctx.rotate(f.a);
    const [ew, eh, ey] = Hd.ear;
    const earX = (s) => mix(s * (Hd.rx - ew * 0.22), s > 0 ? -Hd.rx * 0.12 : -Hd.rx * 0.45, sd) - look * ew * 0.35;
    const path = () => {
      for (const s of [-1, 1]) {
        ctx.moveTo(earX(s) + ew, Hd.ry * ey);
        ctx.ellipse(earX(s), Hd.ry * ey, ew, eh, 0, 0, TAU);
      }
      ctx.moveTo(...headPts[0]);
      loopPath(ctx, headPts);
    };
    ctx.beginPath();
    path();
    if (mode === 'line') {
      ink(ctx);
      ctx.restore();
      return;
    }
    // (the ears first, the far one in shade, a soft hollow in each)
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(earX(s), Hd.ry * ey, ew, eh, 0, 0, TAU);
      ctx.fillStyle = tone(a, s < 0 ? C.sh : C.base);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(earX(s) + s * ew * 0.18, Hd.ry * (ey + 0.02), ew * 0.48, eh * 0.56, 0, 0, TAU);
      ctx.fillStyle = tone(a, s < 0 ? C.deep : C.sh);
      ctx.fill();
    }
    ctx.beginPath();
    loopPath(ctx, headPts);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    loopPath(ctx, headPts);
    ctx.clip();
    // (the far side in soft shade, a light on top toward the near side)
    glow(ctx, a, [-Hd.rx * 1.02 - look * Hd.rx * 0.15, Hd.ry * 0.28], Hd.rx * 0.62, C.sh, 0.95, 0.35);
    glow(ctx, a, [-Hd.rx * 0.12 + look * Hd.rx * 0.12, -Hd.ry * 0.55], Hd.rx * 0.62, C.lt, 0.9);
    // Guides: down the middle (round the head as it turns) and the eye line across.
    const tw = clamp(look * 0.5 + sd * 0.95, -1.2, 1.2);
    const mid = [];
    for (let i = 0; i <= 8; i++) {
      const v = -0.82 + (i / 8) * 1.7;
      mid.push([Math.sin(tw) * Hd.rx * Math.sqrt(Math.max(0, 1 - v * v * 0.8)) * 0.96, v * Hd.ry]);
    }
    guide(ctx, a, mid, 0.95);
    const eyeY = Hd.ry * 0.2;
    const eye = [];
    for (let i = 0; i <= 12; i++) {
      const th = -1.25 + (i / 12) * 2.5;
      if (Math.cos(th) < 0.08) continue;
      eye.push([Math.sin(th + tw) * Hd.rx * 0.93 * (1 - P.head.jaw * 0.06), eyeY + Math.cos(th + tw * 0.3) * 0.55]);
    }
    guide(ctx, a, eye, 0.95);
    ctx.restore();
    ctx.restore();
    // (its edge, soft, where it lies over the body: the jaw over the neck)
    rimOver(ctx, a, sk, () => {
      const q = headPts.map((p) => add(sk.head.c, rot(p, f.a)));
      loopPath(ctx, q);
    }, null, 0, C.sh, 0.9);
  }

  // A tube through points with a width at each: round all along (a disc at each point and the
  // strip between), so a bend is one smooth round.
  const tubePath = (ctx, pts, ws, grow = 0) => {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      const r = Math.max(0.05, ws[i] / 2 + grow);
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
      if (i) {
        const [x0, y0] = pts[i - 1];
        const r0 = Math.max(0.05, ws[i - 1] / 2 + grow);
        const l = Math.hypot(x - x0, y - y0) || 1;
        const nx = -(y - y0) / l;
        const ny = (x - x0) / l;
        ctx.moveTo(x0 + nx * r0, y0 + ny * r0);
        ctx.lineTo(x0 - nx * r0, y0 - ny * r0);
        ctx.lineTo(x - nx * r, y - ny * r);
        ctx.lineTo(x + nx * r, y + ny * r);
        ctx.closePath();
      }
    }
  };
  // An arm: from its root inside the body, the round shoulder, the upper arm full under it, the
  // elbow, the forearm fuller below it narrowing to the wrist; drawn plain where it's still inside
  // the shoulder, a soft rim and a shade along its underside past that; the hand at the wrist.
  function armLine(arm) {
    const { root, sh, el, wr } = arm;
    const pts = [root, lerp2(root, sh, 0.5), sh, lerp2(sh, el, 0.3), lerp2(sh, el, 0.65), el, lerp2(el, wr, 0.3), lerp2(el, wr, 0.66), wr];
    const ws = [A.w0 * 0.9, A.w0 * 0.96, A.w0, A.w0 * 0.98, mix(A.w0, A.we, 0.7), A.we, A.we * 1.05, mix(A.we, A.w1, 0.6), A.w1];
    return [pts, ws];
  }
  const handShape = (ctx, arm, grow = 0) => {
    const r = A.hand;
    const c = add(arm.wr, rot([0, r * 0.9], arm.aH));
    const th = add(arm.wr, rot([r * 0.72, r * 0.5], arm.aH));
    ctx.moveTo(c[0] + r + grow, c[1]);
    ctx.ellipse(c[0], c[1], r + grow, r * 0.95 + grow, arm.aH, 0, TAU);
    ctx.moveTo(th[0] + r * 0.42 + grow, th[1]);
    ctx.ellipse(th[0], th[1], r * 0.42 + grow, r * 0.38 + grow, arm.aH, 0, TAU);
  };
  function drawArm(ctx, a, mode, s) {
    const sk = a.mm;
    const arm = sk.arms[s];
    const far = s === 'F';
    const [pts, ws] = armLine(arm);
    const disc = () => {
      ctx.moveTo(arm.sh[0] + A.ball, arm.sh[1]);
      ctx.arc(arm.sh[0], arm.sh[1], A.ball, 0, TAU);
    };
    if (mode === 'line') {
      tubePath(ctx, pts, ws);
      disc();
      handShape(ctx, arm);
      ink(ctx);
      return;
    }
    const body = tone(a, far ? C.sh : C.base);
    const rim = tone(a, far ? C.deep : C.sh);
    // (past the shoulder's round: a soft rim just inside its edge, so it reads over the body)
    const k0 = 3;
    tubePath(ctx, pts.slice(k0), ws.slice(k0));
    ctx.fillStyle = rim;
    ctx.fill('nonzero');
    tubePath(ctx, pts.slice(k0), ws.slice(k0), -0.42);
    ctx.fillStyle = body;
    ctx.fill('nonzero');
    // (its root and the shoulder plain, melting into the body)
    tubePath(ctx, pts.slice(0, k0 + 1), ws.slice(0, k0 + 1));
    disc();
    ctx.fill('nonzero');
    // (a shade down the underside of each bone, fading in past the shoulder and out at the joints)
    ctx.save();
    tubePath(ctx, pts.slice(k0), ws.slice(k0), -0.42);
    ctx.clip('nonzero');
    for (const [p0, p1, w0, w1] of [[arm.sh, arm.el, A.w0, A.we], [arm.el, arm.wr, A.we, A.w1]]) {
      const d = unit(sub(p1, p0));
      let nn = [-d[1], d[0]];
      if (nn[0] * -0.42 + nn[1] * 0.91 < 0) nn = mul(nn, -1);
      const sp = [0.18, 0.5, 0.86].map((u) => add(lerp2(p0, p1, u), mul(nn, mix(w0, w1, u) * 0.32)));
      const sw = [0.18, 0.5, 0.86].map((u, i) => mix(w0, w1, u) * (i === 1 ? 0.44 : 0.22));
      tubePath(ctx, sp, sw);
      ctx.fillStyle = tone(a, far ? C.deep : C.sh, 0.85);
      ctx.fill('nonzero');
    }
    ctx.restore();
    // The hand: a mitten and a thumb, its palm side shaded.
    ctx.beginPath();
    handShape(ctx, arm);
    ctx.fillStyle = rim;
    ctx.fill('nonzero');
    ctx.beginPath();
    handShape(ctx, arm, -0.4);
    ctx.fillStyle = body;
    ctx.fill('nonzero');
    const pc = add(arm.wr, rot([-A.hand * 0.15, A.hand * 1.25], arm.aH));
    ctx.beginPath();
    ctx.ellipse(pc[0], pc[1], A.hand * 0.5, A.hand * 0.26, arm.aH, 0, TAU);
    ctx.fillStyle = rim;
    ctx.fill();
  }

  // A hip fin: a soft rounded fan from its root inside the hips, two faint rays.
  const finPts = (f) => {
    const u = dirOf(f.ang);
    const v = [-u[1], u[0]];
    const q = (x, y) => add(f.root, add(mul(u, x * f.len), mul(v, y * f.w)));
    const sg = f.sg ?? 1;
    return [q(-0.35, 0), q(0.1, -0.34 * sg), q(0.55, -0.46 * sg), q(0.92, -0.3 * sg), q(1.04, 0.02 * sg), q(0.86, 0.2 * sg), q(0.5, 0.36 * sg), q(0.1, 0.32 * sg)];
  };
  function drawFin(ctx, a, mode, s) {
    const sk = a.mm;
    const f = sk.fins?.[s];
    if (!f) return;
    const far = s === 'F';
    const pts = finPts(f);
    ctx.beginPath();
    loopPath(ctx, pts);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, far ? C.sh : C.base);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    loopPath(ctx, pts);
    ctx.clip();
    const u = dirOf(f.ang);
    const v = [-u[1], u[0]];
    if (!far) glow(ctx, a, add(f.root, mul(u, f.len * 0.45)), f.len * 0.55, C.lt, 0.7);
    ctx.strokeStyle = tone(a, far ? C.deep : C.sh);
    ctx.lineWidth = 0.32;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(...add(f.root, mul(u, f.len * 0.3)));
    ctx.quadraticCurveTo(...add(f.root, add(mul(u, f.len * 0.62), mul(v, -0.06 * f.w * (f.sg ?? 1)))), ...add(f.root, add(mul(u, f.len * 0.9), mul(v, -0.16 * f.w * (f.sg ?? 1)))));
    ctx.stroke();
    ctx.restore();
  }
  // The fluke: a wide fan of two rounded lobes and a soft notch, rooted inside the tail's end; soft
  // rays fanning out, lit from its root.
  function drawFluke(ctx, a, mode) {
    const sk = a.mm;
    const F = sk.fluke;
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
    const L = P.fluke.len;
    const u = dirOf(F.ang);
    glow(ctx, a, add(F.root, mul(u, L * 0.15)), L * 0.85, C.base, 1, 0.3);
    glow(ctx, a, add(F.root, mul(u, L * 0.3)), L * 0.4, C.lt, 0.6);
    ctx.strokeStyle = tone(a, C.deep);
    ctx.lineWidth = 0.3;
    ctx.lineCap = 'round';
    const sK = 0.78 + 0.32 * clamp(F.spread, 0, 1.3);
    for (const k of [-0.62, -0.28, 0.28, 0.62]) {
      const q = (uu, vv) => add(F.root, rot([uu, vv], F.ang + F.flex * 0.9 * (Math.max(0, uu) / L) ** 1.5));
      ctx.beginPath();
      ctx.moveTo(...q(L * 0.34, k * L * 0.1));
      ctx.lineTo(...q(L * 0.84, k * L * 0.58 * sK));
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- Effects ----------
  const twinkle = (ctx, x, y, r, an, fill) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(an);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const q = (i * Math.PI) / 2;
      const q2 = q + Math.PI / 2;
      if (i === 0) ctx.moveTo(r, 0);
      ctx.quadraticCurveTo(Math.cos(q + Math.PI / 4) * r * 0.2, Math.sin(q + Math.PI / 4) * r * 0.2, Math.cos(q2) * r, Math.sin(q2) * r);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(176,150,200,0.8)';
    ctx.lineWidth = Math.max(0.25, r * 0.1);
    ctx.stroke();
    ctx.restore();
  };
  const bubble = (ctx, x, y, r, al) => {
    if (al <= 0.01 || r <= 0.05) return;
    ctx.save();
    ctx.globalAlpha *= al;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = 'rgba(236,244,255,0.62)';
    ctx.fill();
    ctx.strokeStyle = '#94aedb';
    ctx.lineWidth = Math.max(0.25, r * 0.2);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(0.25, r * 0.22);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.6, -2.5, -1.6);
    ctx.stroke();
    ctx.restore();
  };
  // A bubble of water held or thrown: clear blue, a glint, a ring of light round its edge.
  const waterOrb = (ctx, x, y, r, al, t) => {
    if (r <= 0.05 || al <= 0.01) return;
    ctx.save();
    ctx.globalAlpha *= al;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(250,253,255,0.95)');
    g.addColorStop(0.55, 'rgba(196,226,250,0.85)');
    g.addColorStop(1, 'rgba(140,190,236,0.85)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#86aee0';
    ctx.lineWidth = Math.max(0.3, r * 0.1);
    ctx.stroke();
    // (a soft swirl inside, turning)
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = Math.max(0.25, r * 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, t * 4, t * 4 + 1.6);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.38, y - r * 0.4, r * 0.22, r * 0.14, -0.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  };
  // A little sung note: a round head, a stem and a flag, pastel, softly outlined.
  const note = (ctx, x, y, s, an, fill, two) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(an);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.55, s * 0.4, -0.4, 0, TAU);
    if (two) ctx.ellipse(s * 1.2, -s * 0.3, s * 0.55, s * 0.4, -0.4, 0, TAU);
    ctx.fillStyle = fill;
    ctx.strokeStyle = '#b48fc8';
    ctx.lineWidth = Math.max(0.25, s * 0.14);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.48, -s * 0.1);
    ctx.lineTo(s * 0.48, -s * 1.7);
    if (two) {
      ctx.lineTo(s * 1.68, -s * 2.0);
      ctx.lineTo(s * 1.68, -s * 0.4);
    } else ctx.quadraticCurveTo(s * 1.35, -s * 1.4, s * 1.1, -s * 0.7);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#b48fc8';
    ctx.lineWidth = Math.max(0.3, s * 0.3);
    ctx.stroke();
    ctx.strokeStyle = fill;
    ctx.lineWidth = Math.max(0.2, s * 0.14);
    ctx.stroke();
    ctx.restore();
  };
  const spot = (sk, what) => {
    const hc = sk.head.c;
    if (what === 'fluke') return add(sk.fluke.root, mul(dirOf(sk.fluke.ang), P.fluke.len * 0.75));
    if (what === 'hands') return lerp2(sk.arms.N.hand, sk.arms.F.hand, 0.35);
    if (what === 'song') return add(hc, [H * 0.62, H * 0.08]);
    if (what === 'orb') return add(sk.orbAt ?? hc, [H * 1.05, 0]);
    if (what === 'wave') return add(sk.Hc, [H * 0.75, -H * 0.42]);
    return hc;
  };
  function drawFx(ctx, m, a) {
    const sk = a.mm;
    const st = a.mo.rig;
    if (!sk) return;
    const mv = a.mmMove?.mv;
    const t = a.mmMove?.t ?? 0;
    const anticW = a.mmMove?.antic ?? 0;
    ctx.save();
    if (!mv) {
      st.mmOrb = null;
      st.mmWave = null;
      // (asleep: a little bubble now and then, drifting up)
      if (a.mmNap > 0.5 && m.hp > 0) {
        const q = ((a.t ?? 0) + (m.uid % 5) * 1.7) % 4.2;
        if (q < 2.4) {
          const u = q / 2.4;
          const hc = sk.head.c;
          bubble(ctx, hc[0] + P.head.rx * 0.9 + u * 2 + Math.sin(u * 8) * 0.6, hc[1] - u * 10, 0.6 + u * 0.4, Math.sin(Math.PI * Math.min(1, u * 1.1)) * 0.85);
        }
      }
      ctx.restore();
      return;
    }
    // The water orb: gathered between the hands as she winds up, a swirl of bubbles drawn in; then
    // pushed out, flying on with a trail of little bubbles, and bursting.
    if (mv.orb) {
      const rel = mv.orb[0];
      const hands = spot(sk, 'hands');
      const R = H * 0.085;
      if (t < rel) {
        const k = t < 0 ? ease(anticW) : 1;
        waterOrb(ctx, hands[0] + H * 0.02, hands[1], R * (0.25 + 0.75 * k), Math.min(1, k * 2), a.now ?? 0);
        for (let i = 0; i < 4; i++) {
          const an = (a.now ?? 0) * 4 + (i * TAU) / 4;
          const dd = R * (1.4 + 1.2 * (1 - frac((a.now ?? 0) * 1.3 + i / 4)));
          bubble(ctx, hands[0] + Math.cos(an) * dd, hands[1] + Math.sin(an) * dd * 0.8, 0.45 + 0.2 * (i % 2), k * 0.9);
        }
        st.mmOrb = null;
      } else {
        st.mmOrb ??= [hands[0] + H * 0.02, hands[1]];
        sk.orbAt = st.mmOrb;
        const u = (t - rel) / 0.42;
        if (u < 1) {
          const e = 1 - (1 - u) ** 2;
          const ox = st.mmOrb[0] + H * 1.05 * e;
          const oy = st.mmOrb[1] - Math.sin(Math.PI * u) * H * 0.03;
          for (let i = 1; i < 4; i++) bubble(ctx, ox - i * R * 0.9, oy + Math.sin((a.now ?? 0) * 20 + i) * R * 0.2, R * (0.35 - i * 0.06), (1 - u * 0.5) * (1 - i * 0.2));
          waterOrb(ctx, ox, oy, R * (1 + 0.1 * Math.sin(u * 20)), 1, a.now ?? 0);
        }
      }
    }
    // The wave: a soft crest of water thrown forward off the sweeping arm, curling over, spray
    // flying from its lip, rolling on and fading.
    for (const w0 of mv.wave ?? []) {
      const u = after([w0], t, 0.62);
      if (u < 0) continue;
      const e = 1 - (1 - u) ** 2;
      const cx = sk.Hc[0] + H * (0.2 + 0.7 * e);
      const cy = sk.Hc[1] - H * 0.2;
      const R0 = H * (0.26 + 0.12 * e);
      const al = u < 0.12 ? u / 0.12 : 1 - ease((u - 0.45) / 0.55);
      ctx.save();
      ctx.globalAlpha *= al;
      // (the crest: a full crescent of water, deep at its foot, its lip curling over forward)
      const arc = (r, a0, a1, k, sq = 1.1) => Array.from({ length: k + 1 }, (_, i) => {
        const an = mix(a0, a1, i / k);
        return [cx + Math.cos(an) * r, cy + Math.sin(an) * r * sq];
      });
      const outer = arc(R0, 2.0, -0.35, 12);
      const lip = add(outer[outer.length - 1], [-R0 * 0.08, R0 * 0.3]);
      const inner = arc(R0 * 0.5, 0.1, 1.85, 10, 1.3);
      ctx.beginPath();
      loopPath(ctx, [...outer, lip, ...inner]);
      const g = ctx.createLinearGradient(cx, cy - R0, cx, cy + R0);
      g.addColorStop(0, 'rgba(236,247,255,0.85)');
      g.addColorStop(1, 'rgba(176,216,248,0.7)');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#86aee0';
      ctx.lineWidth = 0.55;
      ctx.stroke();
      // (foam along its top, a soft inner curl)
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 0.9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      runPath(ctx, arc(R0 * 0.86, 1.5, -0.25, 7));
      ctx.stroke();
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      runPath(ctx, arc(R0 * 0.66, 1.2, 0.2, 5, 1.2));
      ctx.stroke();
      ctx.restore();
      // (spray off the lip)
      for (let i = 0; i < 5; i++) {
        const sp = after([w0 + 0.05 + i * 0.03], t, 0.5);
        if (sp < 0) continue;
        const lip = [cx + Math.cos(-0.35) * R0, cy + Math.sin(-0.35) * R0 * 1.1];
        const an = -0.9 + i * 0.32;
        bubble(ctx, lip[0] + Math.cos(an) * H * 0.18 * sp, lip[1] + Math.sin(an) * H * 0.18 * sp + H * 0.12 * sp * sp, 0.5 + (i % 2) * 0.3, 1 - sp);
      }
    }
    // Sung notes: rising from her, drifting forward with a sway; and the song rippling out ahead.
    for (let i = 0; i < (mv.notes ?? []).length; i++) {
      const u = after([mv.notes[i]], t, 0.9);
      if (u < 0) continue;
      const hc = sk.head.c;
      const x = hc[0] + P.head.rx * 0.9 + H * 0.4 * u + Math.sin(u * 6 + i) * 1.2;
      const y = hc[1] + P.head.ry * 0.3 - H * 0.3 * u;
      const al = Math.min(1, u * 5) * (1 - ease((u - 0.6) / 0.4));
      ctx.save();
      ctx.globalAlpha *= al;
      note(ctx, x, y, H * 0.05, Math.sin(u * 5 + i) * 0.25, ['#ffe0f0', '#e4f2ff', '#fff4cc'][i % 3], i === 1);
      ctx.restore();
    }
    for (const r0 of mv.ring ?? []) {
      const u = after([r0], t, 0.55);
      if (u < 0) continue;
      const hc = sk.head.c;
      ctx.save();
      ctx.globalAlpha *= (1 - u) * 0.85;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.6;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(hc[0] + P.head.rx * 0.6, hc[1] + P.head.ry * 0.3, H * (0.16 + 0.5 * u + i * 0.08), -0.7, 0.7);
        ctx.stroke();
      }
      ctx.restore();
    }
    // A hit's sparkle.
    for (const s0 of mv.spark ?? []) {
      const u = after([s0], t, 0.24);
      if (u < 0) continue;
      const [x, y] = spot(sk, mv.sparkAt);
      const e = 1 - (1 - u) ** 3;
      ctx.save();
      ctx.globalAlpha *= 1 - u;
      twinkle(ctx, x, y, H * 0.11 * (0.5 + 0.7 * e), u * 0.7, '#ffffff');
      twinkle(ctx, x, y, H * 0.05 * (0.5 + 0.7 * e), u * 0.7 + 0.4, '#fff2a8');
      for (let i = 0; i < 4; i++) {
        const q = (i * TAU) / 4 + 0.5;
        twinkle(ctx, x + Math.cos(q) * H * 0.15 * e, y + Math.sin(q) * H * 0.15 * e, H * 0.03, q, i % 2 ? '#ffd2e6' : '#e0f2ff');
      }
      ctx.restore();
    }
    // Bubbles: a hit's, or where she leaves and meets the air.
    for (const b0 of mv.burst ?? []) {
      const u = after([b0], t, 0.7);
      if (u < 0) continue;
      const e = 1 - (1 - u) ** 2;
      const c0 = sk.skin(withW([0, P.ribs]));
      for (let i = 0; i < 4; i++) {
        const q = -2.5 + i * 0.7;
        bubble(ctx, c0[0] + Math.cos(q) * H * (0.16 + e * 0.14), c0[1] + Math.sin(q) * H * (0.12 + e * 0.1) - e * H * 0.06, 0.55 + (i % 2) * 0.4, 1 - u);
      }
    }
    for (const b0 of mv.splash ?? []) {
      const u = after([b0], t, 0.6);
      if (u < 0) continue;
      const e = 1 - (1 - u) ** 2;
      const at = sk.fluke.root;
      for (let i = 0; i < 5; i++) bubble(ctx, at[0] - (1.5 + i * 1.4) * e, at[1] + (i - 2) * 1.6 - e * (2.5 + i), 0.5 + (i % 2) * 0.4, 1 - u);
    }
    if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
      const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
      ctx.save();
      ctx.globalAlpha *= 0.7 * (1 - k);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) {
        const y = sk.Hc[1] - H * (0.32 - i * 0.18);
        const x0 = sk.Hc[0] - H * (0.3 + ((t * 3 + i * 0.37) % 1) * 0.2);
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 - H * (0.24 + (i % 2) * 0.1), y);
        ctx.stroke();
      }
      ctx.restore();
    }
    // The twirl: sparkles strewn along the way round, twinkling out.
    if (mv.twirl) {
      for (let i = 0; i < 6; i++) {
        const born = mix(mv.twirl[0], mv.twirl[1], i / 5);
        const u = after([born], t, 0.5);
        if (u < 0) continue;
        const an = -Math.PI / 2 + (i / 5) * TAU;
        const c0 = sk.skin(withW([0, P.ribs]));
        const x = c0[0] + Math.cos(an) * H * 0.42;
        const y = c0[1] + Math.sin(an) * H * 0.36 - u * H * 0.05;
        ctx.save();
        ctx.globalAlpha *= 1 - u;
        twinkle(ctx, x, y, H * 0.045 * (1 - u * 0.4), u * 2 + i, i % 2 ? '#ffe6f2' : '#fff6c8');
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    if (m.act && MV[m.act.name]) {
      const mv = MV[m.act.name];
      const Tm = a.now - m.act.at;
      if (Tm >= 0 && Tm < mv.anticT + lengthOf(mv)) {
        const t = Tm - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, Tm / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.mmAtk) {
        const pool = m.def.moves ?? P.moves;
        st.mmN = (st.mmN ?? m.uid) + 1;
        st.mmPick = m.move ?? pool[st.mmN % pool.length];
      }
      st.mmAtk = true;
      const mv = MV[st.mmPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.mmAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lengthOf(MV.hurt)) return [MV.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < lengthOf(MV.twirl)) return [MV.twirl, gl, 1];
    // (an idle act of her own)
    if (st.mmIdle) {
      const mv = MV[st.mmIdle.name];
      const Tm = a.now - st.mmIdle.at;
      if (Tm >= 0 && Tm < mv.anticT + lengthOf(mv)) {
        const t = Tm - mv.anticT;
        return [mv, t, t < 0 ? Math.min(1, Tm / mv.anticT) : 1];
      }
      st.mmIdle = null;
    }
    return [null, 0, 0];
  }
  // Turning round: mirrored like the other bases, level, but not on the spot: the way she's shown
  // lags the way she faces for a moment while her tail flicks, then she flips, and a little
  // overshoot plays the new way and settles. Laid over the pose directly (`mmTB` the tail's bend,
  // `mmTP` the lean), eased so a restart never jumps.
  const PRE = 0.13;
  const POST = 0.44;
  function turning(st, a, m, dt) {
    if (st.mmShown === undefined || m.hp <= 0) {
      st.mmShown = a.flip;
      st.mmTt = null;
      st.mmTB = st.mmTP = 0;
      return;
    }
    if (!(dt > 0)) return;
    if (st.mmTt == null ? a.flip !== st.mmShown : st.mmTt >= PRE && a.flip !== st.mmShown) st.mmTt = 0;
    let tb = 0;
    let tp = 0;
    if (st.mmTt != null) {
      const t0 = st.mmTt;
      st.mmTt += dt;
      if (t0 < PRE && st.mmTt >= PRE) st.mmShown = a.flip;
      const tt = st.mmTt;
      if (tt < PRE) {
        const h = Math.sin(Math.PI * ease(tt / PRE));
        tb = 38 * h;
        tp = -7 * h;
      } else if (tt < PRE + POST) {
        const q = (tt - PRE) / POST;
        const decay = (1 - q) ** 1.4;
        tb = -26 * Math.sin(TAU * q) * decay;
        tp = 5 * Math.sin(TAU * q) * decay;
      } else st.mmTt = null;
    }
    const f = Math.min(1, dt * 40);
    st.mmTB = mix(st.mmTB ?? 0, tb, f);
    st.mmTP = mix(st.mmTP ?? 0, tp, f);
  }
  const mirrored = (a) => a.mo.rig?.mmShown !== undefined && a.mo.rig.mmShown !== a.flip;
  // (the way she's drawn this frame: mirrored while a turn lags, brought down onto the ground in a
  // pose, turned about her middle in a tumble)
  const view = (ctx, a) => {
    if (mirrored(a)) ctx.scale(-1, 1);
    if (a.mmDy) ctx.translate(0, a.mmDy);
    if (a.mmTumble) {
      const c = a.mmMid;
      ctx.translate(c[0], c[1]);
      ctx.rotate(a.mmTumble * TAU);
      ctx.translate(-c[0], -c[1]);
    }
  };
  const seq = [
    ['armF', (ctx, a, mode) => drawArm(ctx, a, mode, 'F')],
    ['finF', (ctx, a, mode) => drawFin(ctx, a, mode, 'F')],
    ['finN', (ctx, a, mode) => drawFin(ctx, a, mode, 'N')],
    ['fluke', drawFluke],
    ['body', drawBody],
    ['head', drawHead],
    ['armN', (ctx, a, mode) => drawArm(ctx, a, mode, 'N')],
  ];
  const paintOf = (draw, mode) => (ctx, a) => {
    if (!a.mm) return;
    ctx.save();
    view(ctx, a);
    draw(ctx, a, mode);
    ctx.restore();
  };
  const parts = [...seq.map(([name, draw]) => ({ name, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: paintOf(draw, 'line') })), ...seq.map(([name, draw]) => ({ name: `${name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: paintOf(draw, 'fill') }))];
  const BOX_W = Math.ceil(H * 2.4);
  const BOX_H = Math.ceil(H * 1.5);
  const SPR = {
    x: [170, 20], rise: [140, 18], pitch: [120, 15.5], tilt: [140, 15], pelvis: [150, 15], waist: [150, 15], chest: [150, 15], turnC: [140, 14],
    neck: [120, 13], head: [115, 12.5], look: [50, 11], shrugN: [170, 15], shrugF: [170, 15], reachN: [170, 15], reachF: [170, 15],
    shN: [135, 14], elN: [140, 14], hwN: [200, 16], shF: [135, 14], elF: [140, 14], hwF: [200, 16],
    bend: [110, 13], whip: [170, 12], curl: [80, 13], thrash: [110, 18], fins: [150, 14], fan: [150, 14], sitW: [26, 10], restW: [26, 10], sleepW: [22, 9.5], side: [45, 11.5],
  };
  const rig = makeRig({
    w: BOX_W,
    h: BOX_H,
    soft: true,
    stride: CYC,
    recover: 1.4,
    springs: SPR,
    fast: CH.filter((c) => !['look', 'curl', 'sitW', 'restW', 'sleepW', 'side'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.mmFast),
    kick: { pitch: -60, head: 50, bend: 140, fins: 4 },
    turnKick: {},
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = (a.t ?? 0) + (m.uid % 7) * 1.3;
      const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
      turning(st, a, m, dt);
      // How fast she's swimming: from the distance she has travelled (flyers are always "moving").
      const odo = m.odo ?? 0;
      const step = Math.min(30, Math.abs(odo - (st.mmOdo ?? odo)));
      st.mmOdo = odo;
      if (dt > 0) st.mmV = (st.mmV ?? 0) + (step / dt - (st.mmV ?? 0)) * Math.min(1, dt * 6);
      const swimGoal = clamp((st.mmV ?? 0) / (P.speed * 0.55), 0, 1);
      st.mmSwim = (st.mmSwim ?? 0) + (swimGoal - (st.mmSwim ?? 0)) * Math.min(1, dt * 3.5);
      const swim = ease(st.mmSwim);
      const nap = m.hp > 0 && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && a.now < m.habit.until));
      const posed = m.hp > 0 && (m.pose === 'sit' || m.pose === 'rest' || nap);
      const calm = m.hp <= 0 ? 0.1 : nap ? 0.25 : posed ? 0.5 : 1;
      st.mmCalm = mix(st.mmCalm ?? calm, calm, Math.min(1, dt * 2));
      // The kicks: run on by the distance swum (and her own travel within a move, and thrashing);
      // hovering, a slow sway.
      const mx = st.x?.x ?? 0;
      const moved = Math.min(20, Math.abs(mx - (st.mmMx ?? mx)));
      st.mmMx = mx;
      const thr = clamp(st.thrash?.x ?? 0, 0, 1.5);
      st.mmPh = ((st.mmPh ?? m.uid * 1.3) + TAU * ((step + moved * 0.5) / CYC + dt * (P.idle * (1 - swim) * st.mmCalm + thr * P.beats * 1.4))) % (TAU * 1000);
      st.mmKick = mix(0.38, 1, swim) * st.mmCalm + thr * 0.9;
      // Quiet (hovering, nothing going on, a few seconds since she was hit): her idle acts.
      const quiet = m.hp > 0 && !posed && a.ph.antic <= 0 && a.ph.since < 0 && (a.hurtAgo ?? 9) > 3 && swim < 0.08 && !m.act;
      st.mmQuiet = mix(st.mmQuiet ?? 0, quiet ? 1 : 0, Math.min(1, dt * 1.5));
      const cyc = t % 30;
      const was = st.mmCyc ?? cyc;
      st.mmCyc = cyc;
      if (quiet && st.mmQuiet > 0.9 && !st.mmIdle && cyc > was) {
        for (const [at, name] of [[7, 'preen'], [15.5, 'stretch'], [24, 'twirl']]) if (was < at && cyc >= at) st.mmIdle = { name, at: a.now };
      }
      if (!quiet && st.mmIdle && MV[st.mmIdle.name] && a.now - st.mmIdle.at < MV[st.mmIdle.name].anticT * 0.5) st.mmIdle = null;
      // Hovering: breathing, a slow bob, the arms sculling, a glance now and then.
      const breath = Math.sin(t * 1.5);
      const scull = Math.sin(t * 1.7);
      const scull2 = Math.sin(t * 1.7 - 1.1);
      const glance = hold(t % 9, 3.6, 4.3, 5.6, 6.3) - 0.6 * hold(t % 11, 1.2, 1.8, 2.6, 3.2);
      const hover = Math.sin(t * 1.2) * 0.7;
      const idle = {
        x: 0, rise: hover + breath * 0.12, pitch: 2 + Math.sin(t * 0.9) * 1.2, tilt: -1 + breath * 0.4, pelvis: Math.sin(t * 0.7) * 1.2, waist: -Math.sin(t * 0.7 - 0.5) * 1.4, chest: -breath * 0.8, turnC: Math.sin(t * 0.45) * 0.08,
        neck: -breath * 0.4 - glance * 1.5, head: breath * 0.4 - glance * 3, look: glance * 0.7,
        shrugN: 1 + breath * 1.4, shrugF: 1 + breath * 1.4, reachN: 0, reachF: 0,
        shN: -12 + scull * 5, elN: -34 + scull2 * 12, hwN: 8 + Math.sin(t * 1.7 + 0.4) * 16, shF: 12 - scull * 5, elF: 30 - scull2 * 12, hwF: -8 - Math.sin(t * 1.7 + 0.4) * 16,
        bend: 0, whip: 0, curl: 0, thrash: 0, fins: 0.2 + breath * 0.08, fan: 0.45, sitW: 0, restW: 0, sleepW: 0, side: 0,
      };
      // Swimming: leaning into it, the head up, the arms trailing back along her, swaying a beat
      // behind each kick.
      const ph = st.mmPh;
      const cruise = {
        ...idle, rise: 0, pitch: P.pitch, tilt: -6, pelvis: 0, waist: 0, chest: -2, turnC: 0, neck: -16, head: -26, look: 0.2, side: 1,
        shN: 10 + Math.sin(ph - 1.7) * 6, elN: 8 + Math.sin(ph - 2.2) * 6, hwN: 12, shF: -6 + Math.sin(ph - 1.9) * 3, elF: -4 + Math.sin(ph - 2.4) * 3, hwF: 8, shrugN: 1, shrugF: 1,
        fins: -0.45, fan: 0.3,
      };
      const [mv, mt, anticW] = moveNow(m, a, st);
      const base = {};
      for (const c of CH) base[c] = mix(idle[c], cruise[c], swim);
      base.x /= H;
      base.rise /= H;
      base.tumble = 0;
      const out = mv ? poseAt(mv, mt, anticW, base) : { ...base };
      a.mmTumble = mv ? out.tumble ?? 0 : 0;
      const lay = (pose) => Object.assign(out, pose);
      // Poses: sitting up on her tail curled along the ground; lying along the ground up on one
      // elbow; asleep with her head on her arms. (Brought down to the ground by `under`.)
      const R = (x, y, s) => {
        const [u, e] = reachFor([x * REACH, y * REACH], A.up, A.fore, s === 'F');
        return s === 'N' ? { shN: u, elN: e } : { shF: u, elF: e };
      };
      if (m.hp > 0 && m.pose === 'sit') lay({ sitW: 1, pitch: 0, tilt: 6 + breath * 0.4, waist: 2, head: 4 - glance * 3, neck: 2, ...R(0.32, 0.86, 'N'), ...R(0.62, 0.82, 'F'), hwN: 30, hwF: 20, fins: -0.2, fan: 0.35, bend: 0, rise: 0 });
      else if (m.hp > 0 && m.pose === 'rest') lay({ restW: 1, pitch: 72, tilt: -40, chest: -4 + breath * 0.5, neck: -8, head: -18 - glance * 3, ...{ shN: -32, elN: -58, hwN: -30 }, shF: -40, elF: -50, hwF: 0, fins: -0.3, fan: 0.6, bend: 0, rise: 0, x: 0 });
      if (nap) lay({ sleepW: 1, pitch: 84, tilt: -16, chest: -2 + breath * 0.8, neck: -4, head: 16, look: 0, shN: -70, elN: -122, hwN: -20, shF: -60, elF: -128, hwF: 0, fins: -0.5, fan: 0.25, bend: 0, whip: 0, rise: 0, x: 0, shrugN: 3 + breath * 0.8, shrugF: 3 + breath * 0.8 });
      if (m.cine?.mood === 'sad' && m.hp > 0) lay({ tilt: 10, neck: 8, head: 14, look: -0.2, shN: -24, elN: -60, shF: 24, elF: 60, fins: -0.7, fan: 0.1, bend: -8 });
      else if (m.cine?.mood === 'happy' && m.hp > 0 && !mv) lay({ fins: 0.9, fan: 1, tilt: -4, head: -6, shN: -60 + Math.sin(t * 3) * 10, elN: -40, shF: 60 - Math.sin(t * 3) * 10, elF: 40, thrash: 0.3 });
      // Beaten: she goes limp, eased in over a second: the head lolls, the arms drift loose, the tail
      // goes slack, and she sinks down onto the ground on her side.
      if (m.hp <= 0) {
        st.mmDeadAt ??= a.now;
        const dT = a.now - st.mmDeadAt;
        const k1 = ease(dT / 0.45);
        const k2 = ease((dT - 0.15) / 1.1);
        const drift = Math.sin(t * 0.8);
        const limp = { tilt: 16, waist: 6, chest: 4, neck: 12, head: 30, look: -0.1, shN: -14 + drift * 4, elN: -20, hwN: 18, shF: 34 - drift * 4, elF: 26, hwF: -10, bend: 14, whip: 0, curl: -0.35, thrash: 0, fins: -0.8, fan: 0.05, sitW: 0, restW: 0, side: 0.3 };
        const down = { pitch: 80, tilt: -2, neck: 8, head: 26, shN: -10 + drift * 3, elN: -14, shF: 4 - drift * 3, elF: 10, bend: 6, sleepW: 1, rise: 0, x: 0 };
        for (const [k, v] of Object.entries(limp)) out[k] = mix(out[k], v, k1);
        for (const [k, v] of Object.entries(down)) out[k] = mix(out[k], v, k2);
      } else st.mmDeadAt = undefined;
      // The shoulders follow the arms: an arm raised past the shoulder lifts its collarbone, one
      // reaching ahead brings its shoulder forward and turns the chest a touch into it.
      const raise = (v) => ease((Math.abs(v) - 55) / 120);
      out.shrugN += 14 * raise(out.shN);
      out.shrugF += 14 * raise(out.shF);
      const fwd = Math.max(0, -Math.sin(out.shN * D2R));
      out.reachN += fwd * H * 0.022 - Math.max(0, Math.sin(out.shN * D2R)) * H * 0.012;
      out.reachF += Math.max(0, -Math.sin(out.shF * D2R)) * H * 0.016;
      out.turnC = clamp(out.turnC + 0.3 * fwd, -0.85, 0.85);
      // Follow-through: a hand trails its arm's swing at the wrist; the head trails the body's turn.
      const vel = (n) => st[n]?.v ?? 0;
      out.hwN += clamp(-(vel('shN') + vel('elN')) * 0.02, -22, 22);
      out.hwF += clamp(-(vel('shF') + vel('elF')) * 0.02, -22, 22);
      out.elN += clamp(-vel('shN') * 0.05, -16, 16);
      out.elF += clamp(-vel('shF') * 0.05, -16, 16);
      const lagX = clamp((st.mmAcc?.[0] ?? 0) * 0.025, -9, 9);
      if (m.hp > 0) {
        out.shN += lagX;
        out.shF += lagX;
      }
      out.head += clamp(-(vel('pitch') + vel('tilt')) * 0.015, -8, 8);
      out.elN = clamp(out.elN, -160, 160);
      out.elF = clamp(out.elF, -160, 160);
      st.mmFast = Boolean(mv) && !mv.idle;
      a.mmMove = mv ? { mv, t: mt, antic: anticW } : null;
      a.mmNap = nap ? 1 : 0;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = out.x * H;
      res.rise = out.rise * H;
      return res;
    },
    under: (ctx, m, a, S) => {
      const st = a.mo.rig;
      const sitW = clamp(S.sitW, 0, 1);
      const restW = clamp(S.restW, 0, 1);
      const sleepW = clamp(S.sleepW, 0, 1);
      const o = { kick: st.mmKick ?? 0.38, ph: st.mmPh ?? 0, swim: ease(st.mmSwim ?? 0), sit: sitW, rest: restW, sleep: sleepW, tp: st.mmTP ?? 0, tb: st.mmTB ?? 0, float: FLOAT };
      o.soft = softTail(st, a, Math.min(0.05, Math.max(0, a.dt ?? 0)));
      const sk = geometry(S, o);
      st.mmTailDirs = sk.tail.ang.map(dirOf);
      // (brought down onto the ground in a pose: its lowest point there, eased in with the pose)
      const g = clamp(Math.max(sitW, restW, sleepW), 0, 1);
      let dy = 0;
      if (g > 0.001) {
        let lo = -Infinity;
        for (const p of sk.outline) lo = Math.max(lo, p[1]);
        for (const s of ['N', 'F']) for (const k of ['el', 'hand']) lo = Math.max(lo, sk.arms[s][k][1] + (k === 'hand' ? A.hand : A.we * 0.5));
        dy = ease(g) * (GROUND - lo);
      }
      a.mmDy = dy;
      loose(sk, st, m, a, Math.min(0.05, Math.max(0, a.dt ?? 0)));
      a.mmMid = sk.skin(withW([0, P.navel]));
      a.mm = sk;
    },
    parts,
    fx: (ctx, m, a) => {
      if (!a.mm) return;
      view(ctx, a);
      drawFx(ctx, m, a);
    },
  });
  // (a still for the Monster Book: the body plain)
  const still = () => ({
    w: BOX_W,
    h: BOX_H,
    res: 3,
    shapes: [
      E(BOX_W / 2 - 2, BOX_H - FLOAT + nSeg * 2.2, T.hw[1] * 0.9, nSeg * 2.6, C.base),
      E(BOX_W / 2, BOX_H - FLOAT + (SHY + 0) / 2, SHX * 1.05, -SHY / 2 + 1, C.base),
      E(BOX_W / 2, BOX_H - FLOAT + P.head.y, P.head.rx, P.head.ry, C.base),
    ],
  });
  return { rig, still, stride: CYC, speed: P.speed, H, w: Math.round(SHX * 3.2), h: Math.round(H * 0.95), moves: P.moves };
}

export const MERMAID_ARTS = {};
export const MERMAID_DEFS = {};
for (const kind of MERMAID_KINDS) {
  const r = mermaidRig(kind);
  MERMAID_ARTS[`blank_${kind}`] = { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig };
  MERMAID_DEFS[kind] = { id: `blank_${kind}`, name: `Blank ${kind}`, art: `blank_${kind}`, w: r.w, h: r.h, speed: r.speed, hp: 100, fight: { windup: 0.5 }, bodyH: r.H, fly: true, moves: r.moves };
}
