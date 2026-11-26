// The arachne base (2026-11-25): a blank spider-taur, built for a spider-taur from the start, nothing
// carried over from another base; only the engine is shared (rig.js's springs). A plain lilac
// mannequin to design spider-folk monsters on: a bald mannequin head with soft construction guides
// only (no face), no clothes, no markings, calm neutral shading. Drawn live like the other blank
// bases: smooth shapes over its bones, outlined only on the outer edge (an outline pass, then a fill
// pass), in the bases' soft plum ink, never near-black.
//
// The body, side on with a slight three-quarter turn (worked out in 3D for the legs, then an oblique
// view: the near side's legs a little lower and ahead, the far side's a little higher and behind,
// so the two sides never tangle):
//   rider    a chibi young woman's upper body (the Maidens' build, or the Kid base's for spiderkid),
//            facing out like the other human bases: a round bald head with soft ears and two guide
//            lines, a neck, shoulders, a chest, a waist, arms with elbows and wrists, mitten hands;
//            her spine bends at the waist (navel) and the chest (ribs), each collarbone shrugs
//   join     her hips run on down into the spider's front body (the cephalothorax) as ONE outline,
//            skinned to her chest, waist and hips and to the spider body: no seam, no belt line;
//            her light and shade ease away to its plain colour toward the hips
//   spider   the cephalothorax under her waist, a big soft round abdomen behind on its own pivot (a
//            damped spring jolted by every footfall, bobbing softly as it breathes), eight chunky
//            legs, four a side, three rounded segments each (a long femur up to a knee raised high,
//            a tibia down, a short tarsus to a round tip); the far side's legs behind, a shade darker
//   gait     an alternating 4-4 walk (near 1 and 3 with far 2 and 4), driven by the distance walked
//            (m.odo, and its own dashes), so a planted tip never slides; the body rocks a touch and
//            the rider rides it, swaying at the waist, the arms easing with it
// Presets: arachne (the Maidens' upper body), spiderkid (the Kid base's: a bigger head, short limbs,
// on a smaller, rounder spider with chunkier legs).
// Moves (ARACHNE_MOVES): webShot (both hands drawn back, then a throw: a soft silk line), legStab
// (the front legs rear up and stab down), webWrap (the hands spin a soft cocoon swirl in front),
// spell (gathered at the chest, pushed out with both hands), jump, dash, dodge, hurt, knockdown (the
// spider tips back onto its abdomen, legs curling, then rolls back up), curtsy (a dip and a wave,
// pleased). Poses (m.pose): sit (body lowered, legs folded), rest (lowered, hands in the lap), sleep
// (slumped forward on folded arms; also a nap, m.habit.kind === 'nap').

import { makeRig, clamp, TAU } from './rig.js';
import { hold } from './kidrig.js';
import { E } from './kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299' };
const INK = '#7f6982'; // (the bases' shared soft ink)
const SEAM = '#b3a7cb'; // (a soft line where a part crosses in front of the body)

// ---------- Small maths ----------
const ease = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const mix = (a, b, u) => a + (b - a) * u;
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const mul = (p, k) => [p[0] * k, p[1] * k];
const lerp2 = (p, q, u) => [mix(p[0], q[0], u), mix(p[1], q[1], u)];
// (turned clockwise on the screen, y down)
const spin = (p, r) => {
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};
const len3 = (p) => Math.hypot(p[0], p[1], p[2]);
const add3 = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const sub3 = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const mul3 = (p, k) => [p[0] * k, p[1] * k, p[2] * k];
const lerp3 = (p, q, u) => [mix(p[0], q[0], u), mix(p[1], q[1], u), mix(p[2], q[2], u)];
const unit3 = (p) => {
  const l = len3(p) || 1e-6;
  return [p[0] / l, p[1] / l, p[2] / l];
};
const dot3 = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const frac = (x) => ((x % 1) + 1) % 1;
const hex = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};

// A closed smooth loop through control points (cardinal spline, `n` steps a span).
function loop(pts, n = 4) {
  const out = [];
  const N = pts.length;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i + N - 1) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const a = 2 * t3 - 3 * t2 + 1;
      const b = t3 - 2 * t2 + t;
      const c = -2 * t3 + 3 * t2;
      const d = t3 - t2;
      const m1 = mul(sub(p2, p0), 0.5);
      const m2 = mul(sub(p3, p1), 0.5);
      out.push([a * p1[0] + b * m1[0] + c * p2[0] + d * m2[0], a * p1[1] + b * m1[1] + c * p2[1] + d * m2[1]]);
    }
  }
  return out;
}
// An open smooth line through points.
function line(pts, n = 4) {
  if (pts.length < 3) return pts;
  const ext = [add(pts[0], sub(pts[0], pts[1])), ...pts, add(pts[pts.length - 1], sub(pts[pts.length - 1], pts[pts.length - 2]))];
  const out = [];
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const m1 = mul(sub(p2, p0), 0.5);
      const m2 = mul(sub(p3, p1), 0.5);
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([(2 * t3 - 3 * t2 + 1) * p1[0] + (t3 - 2 * t2 + t) * m1[0] + (-2 * t3 + 3 * t2) * p2[0] + (t3 - t2) * m2[0], (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1[1] + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2[1]]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// Every shape wound the same way round, so any of them filled together (nonzero) make one union.
function oneWay(pts) {
  let s = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) s += (pts[j][0] - pts[i][0]) * (pts[j][1] + pts[i][1]);
  return s > 0 ? pts.slice().reverse() : pts;
}
const oval = (c, rx, ry, r0 = 0, n = 22) => oneWay(Array.from({ length: n }, (_, i) => add(c, spin([Math.cos((i / n) * TAU) * rx, Math.sin((i / n) * TAU) * ry], r0))));
// A rounded limb piece from p0 to p1 (half-widths r0 at the start, r1 at the end, fuller by `full`
// in its middle), round at both ends, so pieces meet as soft round joints.
function capsule(p0, p1, r0, r1, full = 0) {
  const d = sub(p1, p0);
  const L = Math.hypot(d[0], d[1]) || 1e-4;
  const u = [d[0] / L, d[1] / L];
  const n = [-u[1], u[0]];
  const r = (t) => mix(r0, r1, t) + full * Math.sin(Math.PI * t);
  const pts = [];
  for (const t of [0.2, 0.4, 0.6, 0.8]) pts.push(add(add(p0, mul(d, t)), mul(n, r(t))));
  for (let k = 0; k <= 8; k++) {
    const q = Math.PI / 2 - (k / 8) * Math.PI;
    pts.push(add(p1, add(mul(u, Math.cos(q) * r1), mul(n, Math.sin(q) * r1))));
  }
  for (const t of [0.8, 0.6, 0.4, 0.2]) pts.push(add(add(p0, mul(d, t)), mul(n, -r(t))));
  for (let k = 0; k <= 8; k++) {
    const q = -Math.PI / 2 - (k / 8) * Math.PI;
    pts.push(add(p0, add(mul(u, Math.cos(q) * r0), mul(n, Math.sin(q) * r0))));
  }
  return oneWay(pts);
}
const trace = (ctx, list) => {
  ctx.beginPath();
  for (const pts of list) {
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }
};
const outside = (ctx, pts) => {
  ctx.beginPath();
  ctx.rect(-1e4, -1e4, 2e4, 2e4);
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.clip('evenodd');
};

// ---------- The presets (game px; the rider in her own frame, y down from the middle of her hips) ----------
// hu: the rider (dx the head's nudge toward the front; head [y, half-width, half-height, jaw];
// chin; neckTop where the head turns; neck [base y, half-width]; sh [y, half-width] the shoulder
// joints; chest, waist [y, half-width]; hips the hips' half-width at y 0; arm [upper, forearm,
// width at the shoulder, at the wrist, the hand's radius]; ear [out, down, rx, ry]).
// ceph: the spider's front body, its outline on from her near hip round under to behind her far
// hip, its middle and radii (for the shading). abd: the abdomen, its pivot (the pedicel), middle,
// radii, rest turn (+ raises the back) and egg (narrower at the front).
// legs: each leg's root on the side of the front body [x, y down, out], its tip on the ground
// [x from her hips, out], the bones [femur, tibia, tarsus], widths [root, knee, ankle, tip], the
// tarsus' slant out from straight down; gait: half a step, the lift, the share of the cycle planted,
// the body's bob; view: the oblique view (kx, ky: how far a point out toward us moves ahead and
// down; zg: how far out the near tips stand, set on the ground line).
const ARACHNE = {
  name: 'Arachne',
  k: 1,
  hip: 22,
  hu: { dx: 0.33, head: [-23.33, 7, 7.67, 0.35], chin: -16, neckTop: -17.9, neck: [-14.33, 1.53], sh: [-12, 4.4], chest: [-9.33, 4.47], waist: [-4.33, 3.47], hips: 4.53, arm: [5.87, 5.67, 2.47, 1.8, 1.4], ear: [6.75, 0.92, 1.14, 1.71] },
  ceph: { pts: [[5.38, 2.45], [6.45, 4.63], [5.78, 7.42], [2.99, 9.8], [-1.4, 11.31], [-6.55, 11.68], [-11.5, 10.83], [-15.33, 8.93], [-17.32, 6.33], [-17.09, 3.52], [-14.69, 1.02], [-10.57, -0.69], [-6.6, -1.3], [-4.55, -2.0]], c: [-5.5, 5.2], rx: 12, ry: 6.5 },
  abd: { ped: [-16, 4.6], c: [-27, 1.0], rx: 11.2, ry: 9.6, rot: 12, egg: 0.1 },
  legs: { roots: [[2.6, 8.6, 3.6], [-4.2, 6.6, 4.4, 4.2], [-9.8, 6.6, 4.4, 4.2], [-14.6, 8.0, 3.6]], tips: [[17.5, 7.6], [5.5, 6.6], [-19.5, 6.6], [-29.5, 7.6]], knee: [7.2, 0.5], tarsus: [6.5, 0.5], w: [4.4, 3.8, 3.2, 2.2] },
  gait: { half: 4.6, lift: 3.2, duty: 0.6, bob: 0.35 },
  view: { kx: 0.12, ky: 0.14, zg: 7.2 },
};
const SPIDERKID = {
  name: 'Spider kid',
  k: 0.72,
  hip: 16,
  hu: { dx: 0.33, head: [-14.5, 7.04, 6.8, 0.12], chin: -8.33, neckTop: -10.33, neck: [-7.2, 1.45], sh: [-5, 4.33], chest: [-2.9, 4.6], waist: [-1.4, 3.9], hips: 4.6, arm: [3.4, 2.8, 2.47, 1.87, 1.4], ear: [6.8, 1.76, 0.97, 1.32] },
  ceph: { pts: [[4.7, 2.12], [5.56, 3.93], [5.02, 6.25], [2.79, 8.22], [-0.72, 9.47], [-4.84, 9.78], [-8.8, 9.08], [-11.86, 7.5], [-13.45, 5.34], [-13.27, 3.0], [-11.35, 0.93], [-8.06, -0.49], [-5.9, -0.95]], c: [-4, 4.4], rx: 9.6, ry: 5.4 },
  abd: { ped: [-12.6, 3.8], c: [-21.4, 0.6], rx: 9, ry: 8.4, rot: 10, egg: 0.06 },
  legs: { roots: [[2.0, 7.0, 3.0], [-3.6, 5.4, 3.6, 3.4], [-7.6, 5.4, 3.6, 3.4], [-11.0, 6.8, 3.0]], tips: [[13.5, 6.4], [3.6, 5.6], [-15, 5.6], [-22.5, 6.4]], knee: [5.8, 0.5], tarsus: [5.2, 0.5], w: [4.3, 3.8, 3.3, 2.4] },
  gait: { half: 3.6, lift: 2.6, duty: 0.6, bob: 0.3 },
  view: { kx: 0.12, ky: 0.14, zg: 6 },
};
export const ARACHNE_PRESETS = { arachne: ARACHNE, spiderkid: SPIDERKID };
export const ARACHNE_KINDS = ['arachne', 'spiderkid'];

// ---------- The moves (x, hop in body heights; lift in px at the arachne's size; angles in degrees) ----------
// crouch: the body lowered (1: down on its belly); pitch: the spider body turned nose up (+);
// abd: the abdomen raised (+); curl: every leg curled in; fold: legs drawn in, folded (sitting);
// fUp: the front pair raised; fFwd: the front pair stabbing down ahead; wave: curled legs waving;
// waist, chest, neck, head: her spine bending forward (+); look: her head turned (-1 back .. 1
// ahead); turnC: her chest turned; shN/shF: each upper arm from hanging (0) toward the front (+);
// elN/elF: each elbow bent toward the front (+); hwN/hwF: the wrists; shrugN/shrugF: shoulders up.
const CH = ['x', 'lift', 'hop', 'crouch', 'pitch', 'abd', 'curl', 'fold', 'fUp', 'fFwd', 'wave', 'waist', 'chest', 'neck', 'head', 'look', 'turnC', 'shN', 'elN', 'shF', 'elF', 'hwN', 'hwF', 'shrugN', 'shrugF'];
export const ARACHNE_MOVES = {
  // Both hands drawn back to the hip, the body turning away and down; the throw: hips, waist, chest
  // and arm in turn, the near hand flung out ahead, a soft silk line shooting from it.
  webShot: {
    anticT: 0.26,
    keys: [
      [0, { x: -0.025, crouch: 0.16, pitch: 3, abd: 5, waist: -10, chest: -7, neck: -2, head: -4, look: -0.25, turnC: -0.45, shN: -42, elN: 78, hwN: 20, shF: -24, elF: 46, shrugN: 0.6 }],
      [0.05, { x: 0.02, crouch: 0.08, pitch: -1, waist: 6, chest: 2, turnC: 0.2, shN: 30, elN: 50, shF: 6, elF: 40 }, 'in'],
      [0.1, { x: 0.045, crouch: 0.05, pitch: -3, abd: -3, waist: 12, chest: 9, head: 4, look: 0.3, turnC: 0.55, shN: 94, elN: 4, hwN: -12, shF: 34, elF: 52 }, 'out'],
      [0.24, { x: 0.04, pitch: -2, waist: 10, chest: 7, head: 3, look: 0.3, turnC: 0.45, shN: 90, elN: 8, hwN: -6, shF: 30, elF: 50 }],
      [0.52, { x: 0.015, waist: 4, chest: 2, turnC: 0.15, shN: 44, elN: 34, shF: 8, elF: 26 }, 'io'],
      [0.86, {}],
    ],
    web: [0.08, 0.66],
    spark: [0.2],
    sparkAt: 'web',
  },
  // The front legs rear up (the body pitching up, the rider leaning back, arms up), then stab down
  // ahead, the body coming forward over them.
  legStab: {
    anticT: 0.3,
    keys: [
      [0, { x: -0.03, fUp: 1, pitch: 15, crouch: 0.12, abd: -5, waist: -9, chest: -6, head: -6, look: 0.1, shN: 128, elN: 34, shF: -126, elF: -30, shrugN: 1, shrugF: 1 }],
      [0.09, { x: 0.05, fUp: 0, fFwd: 1, pitch: -7, crouch: 0.22, abd: 5, waist: 13, chest: 8, head: 5, shN: 52, elN: 18, shF: -24, elF: 26 }, 'in'],
      [0.14, { x: 0.055, fFwd: 1, pitch: -9, crouch: 0.26, abd: 7, waist: 15, chest: 9, head: 6, shN: 46, elN: 20, shF: -20, elF: 24 }, 'out'],
      [0.34, { x: 0.04, fFwd: 0.8, pitch: -5, crouch: 0.15, abd: 2, waist: 8, chest: 4, shN: 30, elN: 22, shF: -12, elF: 18 }],
      [0.8, {}],
    ],
    spark: [0.1],
    sparkAt: 'front',
    dust: [[0.1, 'front']],
  },
  // Both hands forward, circling about each other, spinning a soft cocoon of silk in front; then
  // pushed away with both hands.
  webWrap: {
    anticT: 0.24,
    keys: [
      [0, { crouch: 0.18, pitch: 2, waist: -5, chest: -3, head: -3, shN: 58, elN: 70, shF: 52, elF: 76 }],
      [0.12, { waist: 3, chest: 2, shN: 92, elN: 26, shF: 66, elF: 58, hwN: -10 }, 'io'],
      [0.24, { waist: 5, chest: 3, shN: 66, elN: 70, shF: 90, elF: 26, hwF: -10 }, 'io'],
      [0.36, { waist: 3, chest: 2, shN: 92, elN: 26, shF: 66, elF: 58, hwN: -10 }, 'io'],
      [0.48, { waist: 5, chest: 3, shN: 66, elN: 70, shF: 90, elF: 26, hwF: -10 }, 'io'],
      [0.6, { x: 0.035, crouch: 0.06, pitch: -2, waist: 12, chest: 6, head: 3, shN: 92, elN: 6, shF: 86, elF: 10, hwN: -18, hwF: -18 }, 'out'],
      [0.76, { x: 0.03, waist: 9, chest: 5, shN: 86, elN: 10, shF: 80, elF: 14 }],
      [1.08, {}],
    ],
    cocoon: [-0.1, 0.62, 0.95],
    spark: [0.62],
    sparkAt: 'cocoon',
  },
  // A spell: both hands gathered at the chest, a glow growing between them; pushed out ahead.
  spell: {
    anticT: 0.4,
    keys: [
      [0, { crouch: 0.12, pitch: 1, waist: -5, chest: -4, head: -5, neck: -2, shN: 36, elN: 112, shF: 40, elF: 108, hwN: 10, hwF: 10, shrugN: 0.5, shrugF: 0.5 }],
      [0.08, { x: 0.03, crouch: 0.04, pitch: -2, waist: 11, chest: 6, head: 3, shN: 88, elN: 8, shF: 82, elF: 14, hwN: -22, hwF: -22 }, 'out'],
      [0.26, { x: 0.025, waist: 9, chest: 5, shN: 86, elN: 10, shF: 80, elF: 16, hwN: -16, hwF: -16 }],
      [0.6, { waist: 3, shN: 36, elN: 30, shF: 26, elF: 30 }, 'io'],
      [0.95, {}],
    ],
    glow: [-0.4, 0.07],
    burst: 0.08,
  },
  jump: {
    anticT: 0.18,
    keys: [
      [0, { crouch: 0.62, pitch: -3, waist: 8, chest: 3, head: 3, shN: -34, elN: 22, shF: -34, elF: 22 }],
      [0.16, { hop: 0.3, crouch: 0, curl: 0.7, pitch: 5, abd: -6, waist: -5, chest: -3, head: -4, shN: 150, elN: 16, shF: -150, elF: -16 }, 'out'],
      [0.32, { hop: 0.33, curl: 0.75, pitch: 1, abd: -2, waist: -2, shN: 140, elN: 24, shF: -140, elF: -24 }, 'out'],
      [0.5, { hop: 0.02, curl: 0.12, pitch: -3, abd: 4, waist: 4, shN: 60, elN: 30, shF: -60, elF: -30 }, 'in'],
      [0.57, { crouch: 0.5, pitch: -2, abd: 7, waist: 8, head: 3, shN: 20, elN: 26, shF: -24, elF: 24 }, 'out'],
      [0.92, {}],
    ],
    dust: [[0, 'feet'], [0.52, 'feet']],
  },
  dash: {
    anticT: 0.1,
    keys: [
      [0, { crouch: 0.3, x: -0.03, waist: -6, pitch: 2, shN: -16, elN: 20 }],
      [0.26, { x: 0.55, crouch: 0.12, pitch: -3, abd: -5, waist: 12, chest: 6, head: 4, shN: -40, elN: 34, shF: -44, elF: 30 }, 'out'],
      [0.42, { x: 0.6, crouch: 0.1, waist: 6, chest: 3, shN: -20, elN: 26, shF: -24, elF: 22 }, 'io'],
      [0.95, {}],
    ],
    lines: [0, 0.32],
    dust: [[0.02, 'feet']],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.3 }],
      [0.12, { hop: 0.12, x: -0.3, pitch: 10, curl: 0.25, abd: -6, waist: -14, chest: -8, head: -8, look: -0.4, shN: 40, elN: 74, shF: 48, elF: 80 }, 'out'],
      [0.3, { x: -0.34, crouch: 0.38, pitch: -2, abd: 4, waist: -4, chest: -2, shN: 20, elN: 40, shF: 10, elF: 30 }, 'in'],
      [0.8, {}],
    ],
    dust: [[0.3, 'feet']],
  },
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.04, crouch: 0.36, pitch: 8, abd: 10, curl: 0.16, waist: -17, chest: -10, neck: -4, head: -14, look: -0.3, turnC: -0.3, shN: 34, elN: 100, hwN: 16, shF: 28, elF: 96, hwF: 16, shrugN: 1.6, shrugF: 1.6 }, 'out'],
      [0.24, { x: -0.035, crouch: 0.26, pitch: 4, abd: 4, waist: -10, chest: -6, head: -8, look: -0.15, shN: 26, elN: 74, shF: 20, elF: 66, shrugN: 0.8, shrugF: 0.8 }],
      [0.62, {}],
    ],
  },
  // Knocked off its feet: the spider tips back onto its abdomen, legs curling up (and waving), the
  // rider thrown back, arms out; then it rolls forward and rights itself.
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.1, { x: -0.04, pitch: 14, crouch: 0.2, curl: 0.2, waist: -14, chest: -6, head: -10, shN: 60, elN: 40, shF: -60, elF: -40 }, 'out'],
      [0.4, { x: -0.12, hop: 0.06, pitch: 62, curl: 0.9, abd: 4, waist: -12, chest: -6, head: -14, look: -0.2, shN: 118, elN: 30, shF: -118, elF: -30 }, 'io'],
      [0.56, { x: -0.13, pitch: 72, curl: 1, wave: 0.4, waist: -8, chest: -4, head: -10, shN: 100, elN: 40, shF: -100, elF: -40 }, 'in'],
      [0.66, { x: -0.13, pitch: 68, curl: 1, wave: 1, waist: -10, head: -12, shN: 108, elN: 36, shF: -108, elF: -36 }, 'out'],
      [1.26, { x: -0.13, pitch: 70, curl: 0.95, wave: 1, waist: -6, head: -8, shN: 96, elN: 50, shF: -96, elF: -50 }],
      [1.5, { x: -0.1, hop: 0.1, pitch: 28, curl: 0.55, wave: 0.3, waist: 8, chest: 4, head: 4, shN: 40, elN: 50, shF: -30, elF: 40 }, 'io'],
      [1.72, { x: -0.06, pitch: -4, crouch: 0.5, curl: 0, wave: 0, abd: 6, waist: 6, chest: 2, shN: 16, elN: 30, shF: -16, elF: 24 }, 'in'],
      [2.08, {}],
    ],
    dust: [[0.56, 'body'], [1.72, 'feet']],
  },
  // Pleased: the front legs bend in a dip and she bows, then rises and waves.
  curtsy: {
    anticT: 0.16,
    keys: [
      [0, { crouch: 0.06, waist: 2 }],
      [0.32, { crouch: 0.32, pitch: -9, abd: 5, waist: 14, chest: 5, neck: 2, head: 8, shN: -22, elN: 14, shF: -36, elF: 18, hwN: 14 }, 'io'],
      [0.6, { crouch: 0.32, pitch: -9, abd: 5, waist: 14, chest: 5, neck: 2, head: 8, shN: -22, elN: 14, shF: -36, elF: 18, hwN: 14 }],
      [0.86, { crouch: 0, pitch: 2, abd: -2, waist: -4, chest: -2, head: -5, look: 0.25, shN: 138, elN: 26, hwN: 6, shF: -14, elF: 12 }, 'io'],
      [1.0, { pitch: 2, waist: -3, head: -4, look: 0.25, shN: 136, elN: -14, hwN: -14, shF: -14, elF: 12 }, 'io'],
      [1.14, { pitch: 2, waist: -3, head: -4, look: 0.25, shN: 138, elN: 28, hwN: 12, shF: -14, elF: 12 }, 'io'],
      [1.28, { pitch: 2, waist: -3, head: -4, look: 0.25, shN: 136, elN: -14, hwN: -14, shF: -14, elF: 12 }, 'io'],
      [1.42, { pitch: 2, waist: -3, head: -4, look: 0.25, shN: 138, elN: 20, hwN: 8, shF: -14, elF: 12 }, 'io'],
      [1.8, {}],
    ],
    twinkle: [0.9, 1.2],
  },
};
export const ARACHNE_SHOW = ['webShot', 'legStab', 'webWrap', 'spell', 'jump', 'dash', 'dodge', 'hurt', 'knockdown', 'curtsy'];
const POOL = ['webShot', 'legStab', 'webWrap', 'spell'];
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
const after = (at, t, len) => (t >= at && t <= at + len ? (t - at) / len : -1);
const NOTHING = () => sprite('rig|arachneblank', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// ---------- One rig for a preset ----------
function arachneRig(kind) {
  const P = ARACHNE_PRESETS[kind];
  const k = P.k;
  const U = P.hu;
  const [headY, headRx, headRy, jaw] = U.head;
  const [neckY, neckW] = U.neck;
  const [shY, shW] = U.sh;
  const [chY, chW] = U.chest;
  const [wY, wW] = U.waist;
  const [ua, fa, aw0, aw1, hr] = U.arm;
  const ew = (aw0 + aw1) / 2;
  const ball = aw0 * 0.56;
  // The rider's spine: the top of the breastbone, the ribs (the chest bends there), the navel (the
  // waist bends there).
  const STERN = neckY + (shY - neckY) * 0.3;
  const RIB = chY + (wY - chY) * 0.6;
  const NAV = wY * 0.65;
  const { kx, ky, zg } = P.view;
  const Z0 = zg * ky;
  const CEPH = P.ceph;
  const cephLow = Math.max(...CEPH.pts.map((p) => p[1]));
  const DROP = P.hip - cephLow - 0.4;
  const H = P.hip - (headY - headRy) + Z0;
  const AB = P.abd;

  // Her torso's outline at rest, down the near side (the front) from the neck to the hip; the far
  // side is its mirror (the neck's points nudged with the head).
  const pitY = shY + aw0 * 0.95;
  const chestSide = [chW, chY + (wY - chY) * 0.25];
  const nearSide = [
    [U.dx + neckW * 1.05, neckY - 0.13],
    [neckW + (shW - neckW) * 0.45, neckY + (shY - ball - neckY) * 0.6],
    [shW - aw0 * 0.12, shY - ball],
    [shW + aw0 * 0.2, shY - aw0 * 0.05],
    [Math.max(chW, shW * 0.94), pitY],
    ...(chestSide[1] > pitY + aw0 * 0.3 ? [chestSide] : []),
    [wW, wY],
    [U.hips, 0],
  ];
  const farSide = nearSide.map(([x, y], i) => [i === 0 ? U.dx - neckW * 1.05 : -x, y]);
  // The whole trunk: her near side down, on round the spider's front body, up her far side.
  const trunkRest = [...nearSide, ...CEPH.pts, ...farSide.slice(0, -1).reverse()];
  // How much each point follows each bone [hips (the spider body), waist, chest] and its side's
  // shoulder (shrugging): by height, blended across each bend; the spider body's points only it.
  const dB = (NAV - RIB) * 0.5;
  const weightsOf = ([x, y], spider) => {
    if (spider) return [1, 0, 0, 0];
    let w;
    if (y <= RIB - dB) w = [0, 0, 1];
    else if (y < RIB + dB) {
      const u = ease((y - (RIB - dB)) / (2 * dB));
      w = [0, u, 1 - u];
    } else if (y <= NAV - dB * 0.6) w = [0, 1, 0];
    else if (y < NAV + dB * 1.4) {
      const u = ease((y - (NAV - dB * 0.6)) / (dB * 2));
      w = [u, 1 - u, 0];
    } else w = [1, 0, 0];
    const up = 1 - ease((y - (shY - aw0 * 0.2)) / (aw0 * 1.4));
    const side = ease((Math.abs(x) - neckW * 1.1) / Math.max(0.5, shW - neckW * 1.1));
    return [...w, up * side * w[2] * Math.sign(x)];
  };
  const TRUNK = trunkRest.map((p, i) => ({ p, w: weightsOf(p, i >= nearSide.length && i < nearSide.length + CEPH.pts.length) }));
  // (the near edge from the armpit down to the waist, the far edge from the shoulder to the hip:
  // where the light and the shade run)
  // The abdomen at rest, about its pivot: an egg, rounder at the back.
  const ABD = [];
  for (let i = 0; i < 36; i++) {
    const q = (i / 36) * TAU;
    const c = Math.cos(q);
    ABD.push(add(AB.c, [c * AB.rx, Math.sin(q) * AB.ry * (1 - AB.egg * c)]));
  }
  const abdRest = oneWay(ABD);
  // (its long axis, from the pedicel out through its middle, and the way across it a bend goes)
  const AXL = Math.hypot(AB.c[0] - AB.ped[0], AB.c[1] - AB.ped[1]) + AB.rx;
  const AXU = (() => {
    const d = sub(AB.c, AB.ped);
    const l = Math.hypot(d[0], d[1]) || 1;
    return [d[0] / l, d[1] / l];
  })();
  const AXN = [-AXU[1], AXU[0]];
  // The legs (side: 1 near, -1 far), their step's phase: 1 and 3 of one side with 2 and 4 of the
  // other.
  const LG = P.legs;
  const LW = LG.w;
  const [KH, KF] = LG.knee;
  const [L3, A3] = LG.tarsus;
  // (the rest bend at the joint between the patella and the tibia)
  const B0 = 0.42;
  const LEGS = [];
  for (const side of [1, -1]) {
    LG.roots.forEach(([x, y, z, kh = KH], i) => {
      const [tx, tz] = LG.tips[i];
      // (its bones' lengths from its rest pose: the knee raised KH over the root, KF of the way out
      // to the ankle; the tarsus slanting A3 out from straight down)
      const R = [x, P.hip - y, z * side];
      const T = [tx, 0, tz * side];
      const flat = unit3([T[0] - R[0], 0, T[2] - R[2]]);
      const J2 = sub3(T, add3(mul3(flat, L3 * Math.sin(A3)), [0, -L3 * Math.cos(A3), 0]));
      const hj = Math.hypot(J2[0] - R[0], J2[2] - R[2]);
      const K = add3(add3(R, mul3(flat, hj * KF)), [0, kh, 0]);
      // (the knee-to-ankle run split into the patella, short, and the tibia, bent a little at rest
      // at the joint between them: lengths that give the same reach at the rest bend B0)
      const L2 = len3(sub3(J2, K));
      const Lp = L2 * 0.27;
      const Lt = -Lp * Math.cos(B0) + Math.sqrt(Lp * Lp * Math.cos(B0) ** 2 - Lp * Lp + L2 * L2);
      LEGS.push({ side, i, root: [x, y], rz: z * side, tip: [tx, tz * side], lens: [len3(sub3(K, R)), Lp, Lt, L3], ph: ((i + (side > 0 ? 0 : 1)) % 2) * 0.5 + i * 0.03, key: `${side > 0 ? 'N' : 'F'}${i}` });
    });
  }
  const GT = { half: P.gait.half, lift: P.gait.lift, duty: P.gait.duty };
  const cycle = (2 * GT.half) / GT.duty;
  const walkSpeed = cycle * 1.45;
  // A tip's place through its step: planted (going back under the body exactly as far as the body
  // goes on), then lifted in an eased arc and set down ahead.
  const stepAt = (u, ph) => {
    const q = frac(u + ph);
    if (q < GT.duty) return { dx: GT.half - (2 * GT.half * q) / GT.duty, lift: 0, v: -1 };
    const v = (q - GT.duty) / (1 - GT.duty);
    return { dx: -GT.half + 2 * GT.half * ease(v), lift: GT.lift * Math.sin(Math.PI * v) ** 0.9, v };
  };
  // (the oblique view: a 3D point [x, height, out] on the screen)
  const view = (p) => [p[0] + p[2] * kx, -p[1] + (p[2] - zg) * ky];
  // A leg's bones from its root to its tip (3D): the femur up from the root (its coxa hidden in the
  // body) to the knee, bending toward `pole`; the patella and the tibia, bent `beta` at the joint
  // between them (more bend: the leg drawn in shorter); the metatarsus slanting `a3` out from `down`
  // to the round tip. Every segment keeps its length. Too far to reach, the tip is drawn in toward
  // the root (off the ground).
  const legBones = (Lg, R, T0, a3, beta, down, pole) => {
    const [L1, Lp, Lt] = Lg.lens;
    const L2 = Math.sqrt(Lp * Lp + Lt * Lt + 2 * Lp * Lt * Math.cos(beta));
    const flat = [T0[0] - R[0], 0, T0[2] - R[2]];
    const out = len3(flat) > 1e-3 ? unit3(flat) : [1, 0, 0];
    const dT = unit3(add3(mul3(down, Math.cos(a3)), mul3(out, Math.sin(a3))));
    let A = sub3(T0, mul3(dT, L3));
    const D = sub3(A, R);
    let d = len3(D);
    const e = unit3(D);
    const dc = clamp(d, Math.abs(L1 - L2) + 0.6, L1 + L2 - 0.05);
    if (dc !== d) {
      A = add3(R, mul3(e, dc));
      d = dc;
    }
    let n = sub3(pole, mul3(e, dot3(pole, e)));
    if (len3(n) < 1e-3) n = [0, 1, 0];
    n = unit3(n);
    const a = (L1 * L1 + d * d - L2 * L2) / (2 * d);
    const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const K = add3(add3(R, mul3(e, a)), mul3(n, h));
    // (the patella joint: on the outer side of the knee-to-ankle line, carrying on the femur's way)
    const e2 = unit3(sub3(A, K));
    const fem = unit3(sub3(K, R));
    let n2 = sub3(fem, mul3(e2, dot3(fem, e2)));
    if (len3(n2) < 1e-3) n2 = n;
    n2 = unit3(n2);
    const a2 = (Lp * Lp + L2 * L2 - Lt * Lt) / (2 * L2);
    const h2 = Math.sqrt(Math.max(0, Lp * Lp - a2 * a2));
    const Pt = add3(add3(K, mul3(e2, a2)), mul3(n2, h2));
    return [R, K, Pt, A, add3(A, mul3(dT, L3))];
  };

  // ---------- The skeleton, each frame ----------
  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const t = a.t + (m.uid % 7) * 1.3;
    const dt = clamp(a.dt ?? 0, 0, 0.05);
    // The step's phase: from the distance walked and from its own dashes, so planted tips stay put.
    const odo = m.odo ?? 0;
    const dO = odo - (st.arOdo ?? odo);
    st.arOdo = odo;
    const dX = S.x - (st.arX ?? S.x);
    st.arX = S.x;
    const went = (Math.abs(dO) < 40 ? dO : 0) + dX;
    st.arU = frac((st.arU ?? 0) + went / cycle);
    const u = st.arU;
    const pace = dt > 0 ? Math.abs(went) / dt : 0;
    st.arPace = (st.arPace ?? 0) + (pace - (st.arPace ?? 0)) * Math.min(1, dt * 9);
    st.arW = (st.arW ?? 0) + (clamp(st.arPace / (walkSpeed * 0.3), 0, 1) - (st.arW ?? 0)) * Math.min(1, dt * 10);
    const w = st.arW;
    // The body: a small bob as each set of legs takes the weight and a touch of rock, lowered by a
    // crouch, up in a hop; turned nose up (pitch) about the middle of its front body.
    const beat = 2 * TAU * (u - GT.duty / 2);
    const bob = w * P.gait.bob * Math.cos(beat);
    const rock = w * 0.7 * Math.sin(beat + 0.6);
    const pitch = S.pitch + rock;
    const rB = -pitch * D2R;
    const crouch = clamp(S.crouch, -0.3, 1.05);
    const hipH = P.hip + S.lift * k + S.hop + bob - crouch * DROP;
    const cc = CEPH.c;
    const pivot = [S.x + cc[0], -hipH + cc[1] - Z0];
    const bw = (p) => add(pivot, spin(sub(p, cc), rB));
    // How the body is being thrown about this frame (its speed along its way and up and down, and
    // their change), and a blow landing: these jolt the legs' joints and the abdomen.
    const bv = (st.arBV ??= { y: pivot[1], vx: 0, vy: 0, ax: 0, ay: 0, hit: a.mo.hitT });
    let ax = 0;
    let ay = 0;
    let hit = false;
    if (dt > 0) {
      const vx = went / dt;
      const vy = (pivot[1] - bv.y) / dt;
      bv.ax += (clamp((vx - bv.vx) / dt, -4000, 4000) - bv.ax) * Math.min(1, dt * 30);
      bv.ay += (clamp((vy - bv.vy) / dt, -4000, 4000) - bv.ay) * Math.min(1, dt * 30);
      Object.assign(bv, { vx, vy });
      ax = bv.ax;
      ay = bv.ay;
    }
    bv.y = pivot[1];
    if (bv.hit !== a.mo.hitT) {
      bv.hit = a.mo.hitT;
      hit = m.hp > 0;
    }
    const jKick = { b: clamp(-ay * dt * 0.02, -1.2, 1.2) + (hit ? 2.6 : 0), a: clamp(ax * dt * 0.012, -1, 1) - (hit ? 1.4 : 0) };
    // The abdomen, a soft body (like Fawnelle's): it sways about its pedicel and bends along its
    // length (the far end lagging, its area kept), each on its own damped spring, jolted by every
    // footfall, by landing, by starting and stopping, by a blow; a soft bounce, one or two overshoots,
    // then still.
    const sw = (st.arAbd ??= { x: 0, v: 0, bx: 0, bv: 0, foot: 0 });
    if (dt > 0) {
      sw.v += clamp(ay * dt * 0.0016 - ax * dt * 0.0009, -0.6, 0.6) + sw.foot * 0.1 + (hit ? 1.8 : 0);
      sw.bv += clamp((ay * dt * 0.012 - ax * dt * 0.0075) * k, -5, 5) + sw.foot * 1.6 * k + (hit ? 14 * k : 0);
      const n = Math.max(1, Math.ceil(dt / (1 / 240)));
      for (let i = 0; i < n; i++) {
        const h = dt / n;
        sw.v += (-sw.x * 120 - sw.v * 9.5) * h;
        sw.x = clamp(sw.x + sw.v * h, -0.35, 0.35);
        sw.bv += (-sw.bx * 190 - sw.bv * 11) * h;
        sw.bx = clamp(sw.bx + sw.bv * h, -3.5 * k, 3.5 * k);
      }
    }
    sw.foot = 0;
    if (!Number.isFinite(sw.x + sw.bx)) Object.assign(sw, { x: 0, v: 0, bx: 0, bv: 0 });
    const rA = (AB.rot + S.abd) * D2R + sw.x;
    const bend = sw.bx;
    const aw = (p) => {
      const d = sub(p, AB.ped);
      const s2 = clamp((d[0] * AXU[0] + d[1] * AXU[1]) / AXL, 0, 1.3);
      return bw(add(AB.ped, spin(add(d, mul(AXN, bend * s2 * s2)), rA)));
    };
    // (never into the ground, however it tips: it rests on its lowest point instead)
    let low = -1e9;
    for (const p of CEPH.pts) low = Math.max(low, bw(p)[1]);
    for (const p of abdRest) low = Math.max(low, aw(p)[1]);
    const floor = -Z0 + 4 * ky;
    if (low > floor) pivot[1] -= low - floor;
    const groundGap = floor - low;

    // The rider: her hips ride the spider body; the waist bends at the navel, the chest at the ribs,
    // the neck from the breastbone, the head on it; each shoulder lifts with its shrug.
    const rW = rB + S.waist * D2R;
    const navW = bw([0, NAV]);
    const waistAt = (p) => add(navW, spin(sub(p, [0, NAV]), rW));
    const rC = rW + S.chest * D2R;
    const ribW = waistAt([0, RIB]);
    const chestAt = (p) => add(ribW, spin(sub(p, [0, RIB]), rC));
    const upC = spin([0, -1], rC);
    const skin = ({ p, w: wt }) => {
      let q = [0, 0];
      if (wt[0]) q = add(q, mul(bw(p), wt[0]));
      if (wt[1]) q = add(q, mul(waistAt(p), wt[1]));
      if (wt[2]) q = add(q, mul(chestAt(p), wt[2]));
      if (wt[3]) q = add(q, mul(upC, Math.abs(wt[3]) * k * (wt[3] > 0 ? S.shrugN : S.shrugF)));
      return q;
    };
    const trunkCtl = TRUNK.map(skin);
    const trunk = loop(trunkCtl, 4);
    const abd = abdRest.map(aw);
    // The neck and the head.
    const rN = rC + S.neck * D2R;
    const sternW = chestAt([U.dx, STERN]);
    const neckTopW = add(sternW, spin([0, U.neckTop - STERN], rN));
    const rH = rN + S.head * D2R;
    const headAt = (p) => add(neckTopW, spin(sub(p, [U.dx, U.neckTop]), rH));
    // The arms: each from its shoulder joint (on its collarbone), the upper arm `sh` from hanging
    // toward the front, the forearm on from it by `el`; the hand on the wrist.
    const arms = {};
    for (const [key, s] of [['N', 1], ['F', -1]]) {
      const shrug = (key === 'N' ? S.shrugN : S.shrugF) * k;
      const sj = add(chestAt([s * shW, shY]), mul(upC, shrug));
      const inner = add(chestAt([s * (shW - aw0 * 0.62), shY + aw0 * 0.25]), mul(upC, shrug * 0.5));
      const a1 = (key === 'N' ? S.shN : S.shF) * D2R;
      const a2 = a1 + (key === 'N' ? S.elN : S.elF) * D2R;
      const el = add(sj, spin([Math.sin(a1) * ua, Math.cos(a1) * ua], rC));
      const dir = spin([Math.sin(a2), Math.cos(a2)], rC);
      const wr = add(el, mul(dir, fa));
      const rHand = Math.atan2(-dir[0], dir[1]) + (key === 'N' ? S.hwN : S.hwF) * D2R;
      const handAt = (p) => add(wr, spin(p, rHand));
      arms[key] = { sj, inner, el, wr, rHand, handAt, hand: handAt([0, hr * 0.9]) };
    }

    // The legs. Each tip's place: planted on the ground (stepping as it walks; now and then, standing
    // about, one tapping), drawn in folded (sitting), raised up in front (the front pair rearing),
    // stabbing down ahead, curled up under the body (tipped over, leaping); its bones reach it.
    const upB = spin([0, -1], rB);
    const bodyUp = [upB[0], -upB[1], 0];
    const to3 = (p, z) => {
      const s = bw(p);
      return [s[0], -s[1] - Z0, z];
    };
    const calm = (1 - w) * (a.calm ?? 1) * (1 - clamp(S.curl * 3, 0, 1)) * (1 - clamp(S.fold * 2, 0, 1));
    // (the idle tap: every 2.6 s the next leg in turn lifts a little and sets down again, just ahead)
    const tapN = Math.floor(t / 2.6);
    const tapK = (t % 2.6) / 0.7;
    const tapOrder = [0, 5, 2, 7, 1, 4, 3, 6];
    const tapLeg = tapOrder[((tapN % 8) + 8) % 8];
    const fold = clamp(S.fold, 0, 1);
    const curl = clamp(S.curl, 0, 1);
    const jS = (st.arJoint ??= {});
    const air = ease(clamp(S.hop / (5 * k), 0, 1));
    let footfall = 0;
    const LEG = [];
    LEGS.forEach((L, li) => {
      const g = stepAt(u, L.ph);
      const R = to3(L.root, L.rz);
      let T = [S.x + L.tip[0] + g.dx * w, g.lift * w, L.tip[1]];
      if (li === tapLeg && tapK < 1) {
        const e = Math.sin(Math.PI * ease(tapK));
        T[1] += 1.5 * k * e * calm;
        T[0] += 0.7 * k * e * calm * (L.tip[0] > 0 ? 1 : -1);
      }
      // (off the ground (leaping), the tips no longer reach for it: they hang with the body, bent)
      T = lerp3(T, [T[0] - (L.tip[0] - L.root[0]) * 0.12, R[1] - (P.hip - L.root[1]) + 3 * k, T[2] * 0.92], air);
      // (folded: the tips drawn in toward the body, so the knees rise high)
      T = lerp3(T, [mix(R[0], T[0], 0.68), 0, L.tip[1] * 0.82], fold);
      const front = L.i === 0;
      if (front) {
        // (stabbing: down onto the ground well ahead)
        T = lerp3(T, [S.x + L.tip[0] + 7 * k, 0, L.tip[1] * 0.9], clamp(S.fFwd, 0, 1));
        // (rearing: raised up and out in front of the body)
        T = lerp3(T, to3(add(L.root, [8.5 * k, -12 * k]), L.rz + 2.5 * L.side), ease(clamp(S.fUp, 0, 1)));
      }
      // (tucked: held in their standing shape but drawn in close under the body, so off the ground
      // (leaping, or tipped over onto its back) they keep a tidy fan; waving a little, each in turn)
      const wvA = clamp(S.wave, 0, 1);
      const ph = t * 9 + L.i * 1.7 + (L.side > 0 ? 0 : 1.1);
      const curlTip = to3([mix(L.root[0], L.tip[0], 0.6) + Math.sin(ph) * 1.8 * k * wvA, L.root[1] + 8 * k - Math.max(0, Math.cos(ph)) * 2.2 * k * wvA], L.tip[1] * 0.8);
      T = lerp3(T, curlTip, ease(curl));
      // (planted tips never under the ground)
      T[1] = Math.max(T[1], 0);
      const down = unit3(lerp3([0, -1, 0], mul3(bodyUp, -1), curl));
      // The joints' goals through the step: lifting, the knee joints bend and the tip curls in under;
      // swinging through, the metatarsus trails, then reaches out ahead; planted, the joints give as
      // the weight comes on and straighten as it pushes off. Folding, curling, rearing fold them up;
      // stabbing straightens them. Standing about, each flexes a little in its own time.
      const sw2 = g.v >= 0 ? g.v : -1;
      const sq = g.v >= 0 ? 0 : frac(u + L.ph) / GT.duty;
      const lift2 = sw2 >= 0 ? Math.sin(Math.PI * sw2) : 0;
      const load = sw2 < 0 ? Math.sin(Math.PI * Math.min(1, sq * 1.7)) - 0.8 * ease((sq - 0.62) / 0.38) : 0;
      const tapE = li === tapLeg && tapK < 1 ? Math.sin(Math.PI * ease(tapK)) * calm : 0;
      const fU = front ? ease(clamp(S.fUp, 0, 1)) : 0;
      const fF = front ? clamp(S.fFwd, 0, 1) : 0;
      const idleFlex = Math.sin(t * 1.3 + li * 0.9) * calm;
      const bGoal = B0 + (0.38 * lift2 + 0.16 * load) * w + 0.4 * tapE + 0.35 * fold + 0.75 * ease(curl) + 0.65 * fU - 0.3 * fF + 0.35 * air + 0.05 * idleFlex;
      const aGoal = A3 + (-0.38 * lift2 + 0.22 * Math.sin(TAU * Math.max(0, sw2)) + 0.1 * load) * w - 0.5 * tapE - 0.1 * fold - 0.7 * ease(curl) - 0.6 * fU - 0.3 * fF - 0.35 * air + 0.05 * idleFlex;
      // (each on a damped spring, so the lower joints lag the upper a little and a jolt makes them
      // overshoot and settle)
      const J = (jS[L.key] ??= { b: { x: bGoal, v: 0 }, a: { x: aGoal, v: 0 } });
      if (dt > 0) {
        J.b.v += jKick.b * (0.8 + 0.4 * (L.i % 2));
        J.a.v += jKick.a * (L.tip[0] > 0 ? 1 : -1) + jKick.b * -0.4;
        const n2 = Math.max(1, Math.ceil(dt / (1 / 240)));
        for (let i2 = 0; i2 < n2; i2++) {
          const h2 = dt / n2;
          J.b.v += (-(J.b.x - bGoal) * 300 - J.b.v * 17) * h2;
          J.b.x += J.b.v * h2;
          J.a.v += (-(J.a.x - aGoal) * 340 - J.a.v * 19) * h2;
          J.a.x += J.a.v * h2;
        }
        J.b.x = clamp(J.b.x, 0, 2.2);
        J.a.x = clamp(J.a.x, -1.6, 1.4);
        if (!Number.isFinite(J.b.x + J.a.x)) Object.assign(J, { b: { x: bGoal, v: 0 }, a: { x: aGoal, v: 0 } });
      }
      const pole = unit3(add3(bodyUp, [0, 0, L.side * 0.15]));
      const bones = legBones(L, R, T, J.a.x, J.b.x, down, pole);
      // (a footfall: the abdomen feels it)
      const planted = g.v < 0 || w < 0.05;
      if (planted && st.arPlant?.[L.key] === false) footfall += w;
      (st.arPlant ??= {})[L.key] = planted;
      LEG.push({ L, pts: bones.map(view), depth: bones[1][2] + bones[4][2] });
    });
    sw.foot = footfall;
    const legsOf = (side) => LEG.filter((g) => g.L.side === side).sort((p, q) => side > 0 ? p.depth - q.depth : p.depth - q.depth);
    // (the near side's legs all in front, fanning out along the front body's lower edge)
    const near = legsOf(1);
    const mid = [];
    const far = legsOf(-1);
    const frontTip = LEG.find((g) => g.L.side > 0 && g.L.i === 0).pts[4];
    const hands = lerp2(arms.N.hand, arms.F.hand, 0.5);
    return {
      pivot, rB, rA, bw, aw, trunk, abd, arms, near, mid, far,
      chestAt, waistAt, headAt, rC, rH, sternW, neckTopW, look: S.look, turnC: S.turnC, groundGap,
      spots: { handN: arms.N.hand, handF: arms.F.hand, hands, front: frontTip, feet: [S.x, 0], body: [pivot[0], -Z0 * 0.5], web: null, cocoon: null },
    };
  }

  // ---------- Drawing ----------
  const tone = (a, c, al = 1) => {
    const f = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = hex(c);
    const v = (x) => Math.round(x + (255 - x) * f);
    return al >= 1 ? `rgb(${v(r)},${v(g)},${v(b)})` : `rgba(${v(r)},${v(g)},${v(b)},${al})`;
  };
  const ink = (ctx) => {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const glow = (ctx, a, c, r, col, al) => {
    if (r <= 0) return;
    const [cr, cg, cb] = hex(col);
    const f = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const v = (x) => Math.round(x + (255 - x) * f);
    const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
    gr.addColorStop(0, `rgba(${v(cr)},${v(cg)},${v(cb)},${al})`);
    gr.addColorStop(1, `rgba(${v(cr)},${v(cg)},${v(cb)},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
  };
  // (a part's own colour held out to a soft edge: where a limb grows out of the body)
  const seat = (ctx, a, c, r, k0) => {
    const [cr, cg, cb] = hex(C.base);
    const f = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const v = (x) => Math.round(x + (255 - x) * f);
    const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
    gr.addColorStop(0, `rgba(${v(cr)},${v(cg)},${v(cb)},1)`);
    gr.addColorStop(k0, `rgba(${v(cr)},${v(cg)},${v(cb)},1)`);
    gr.addColorStop(1, `rgba(${v(cr)},${v(cg)},${v(cb)},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
  };
  // A soft rim of shade along a shape's lower back edge: the shape in shade, then in its own colour
  // nudged up and forward over it.
  const rimFill = (ctx, a, shapes, base, shade, nudge) => {
    trace(ctx, shapes);
    ctx.fillStyle = tone(a, shade);
    ctx.fill('nonzero');
    ctx.save();
    trace(ctx, shapes);
    ctx.clip('nonzero');
    ctx.translate(nudge * 0.45, -nudge);
    trace(ctx, shapes);
    ctx.fillStyle = tone(a, base);
    ctx.fill('nonzero');
    ctx.restore();
  };
  // Where a part lies in front of others already drawn: a soft shade it casts on them (never a line).
  const contact = (ctx, a, shapes, over, col, al = 0.55) => {
    if (!over.length) return;
    ctx.save();
    trace(ctx, over);
    ctx.clip('nonzero');
    ctx.translate(-0.5 * k, 0.9 * k);
    trace(ctx, shapes);
    ctx.fillStyle = tone(a, col, al);
    ctx.fill('nonzero');
    ctx.restore();
  };
  // A soft light seam where a part crosses in front of the body (`skip`: the part's root, where it
  // grows out of it and shows none).
  const seam = (ctx, a, shapes, over, skip) => {
    if (!over.length) return;
    ctx.save();
    trace(ctx, over);
    ctx.clip('nonzero');
    if (skip) {
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      ctx.moveTo(skip[0][0] + skip[1], skip[0][1]);
      ctx.arc(skip[0][0], skip[0][1], skip[1], 0, TAU);
      ctx.clip('evenodd');
    }
    trace(ctx, shapes);
    ctx.strokeStyle = tone(a, SEAM);
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  };

  // A leg's shape: its three rounded segments, chunky, fuller in the middle, the tip round.
  const legShape = (g) => {
    const [R, K, Pt, A, T] = g.pts;
    const wp = mix(LW[1], LW[2], 0.25);
    return [capsule(R, K, LW[0] / 2, LW[1] / 2, LW[0] * 0.06), capsule(K, Pt, LW[1] / 2, wp / 2, LW[1] * 0.03), capsule(Pt, A, wp / 2, LW[2] / 2, wp * 0.05), capsule(A, T, LW[2] / 2, LW[3] / 2, LW[2] * 0.04)];
  };
  // The far side's legs, behind everything, a shade darker; where one crosses another, a soft shade.
  function drawFar(ctx, a, mode) {
    const sk = a.ak;
    const done = [];
    for (const g of sk.far) {
      const sh = legShape(g);
      trace(ctx, sh);
      if (mode === 'line') {
        ink(ctx);
        continue;
      }
      contact(ctx, a, sh, done, C.deep, 0.6);
      rimFill(ctx, a, sh, C.sh, C.deep, 0.75 * k);
      done.push(...sh);
    }
  }
  // The abdomen: one soft round, lit along its top, shaded underneath; a faint guide down its middle.
  function drawAbd(ctx, a, mode) {
    const sk = a.ak;
    trace(ctx, [sk.abd]);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    trace(ctx, [sk.abd]);
    ctx.clip();
    const A = (p) => sk.aw(add(AB.c, p));
    glow(ctx, a, A([0, AB.ry * 1.25]), AB.rx * 1.05, C.sh, 0.95);
    glow(ctx, a, A([-AB.rx * 0.55, AB.ry * 0.3]), AB.rx * 0.6, C.sh, 0.4);
    glow(ctx, a, A([-AB.rx * 0.1, -AB.ry * 0.5]), AB.rx * 0.72, C.lt, 0.95);
    // (the guide: a soft line round its middle, over the top from the pedicel back)
    ctx.strokeStyle = tone(a, C.guide);
    ctx.lineWidth = Math.max(0.35, 0.4 * k);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const q = -0.25 - (i / 16) * 2.3;
      const [x, y] = A([Math.cos(q) * AB.rx * 0.98, Math.sin(q) * AB.ry * 0.5 + AB.ry * 0.12]);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.globalAlpha *= 0.8;
    ctx.stroke();
    ctx.globalAlpha /= 0.8;
    ctx.restore();
  }
  // An arm: one rounded shape from a point inside the shoulder through the elbow to the wrist, a soft
  // darker line just inside its edge (so an arm over the body reads); its root plain, melting into
  // the body; a mitten hand with a thumb.
  const armShapes = (r, grow = 0) => [
    capsule(r.inner, r.sj, aw0 * 0.45 + grow, aw0 * 0.5 + grow),
    capsule(r.sj, r.el, aw0 / 2 + grow, ew / 2 + grow, aw0 * 0.03),
    capsule(r.el, r.wr, ew / 2 + grow, aw1 / 2 + grow, ew * 0.06),
  ];
  const handShapes = (r, grow = 0) => [oval(r.handAt([0, hr * 0.9]), hr + grow, hr * 0.95 + grow, r.rHand, 18), oval(r.handAt([hr * 0.72, hr * 0.55]), hr * 0.42 + grow, hr * 0.4 + grow, r.rHand, 12)];
  function drawArm(ctx, a, mode, key) {
    const sk = a.ak;
    const r = sk.arms[key];
    const far = key === 'F';
    const body = armShapes(r);
    const hand = handShapes(r);
    const ballP = oval(r.sj, ball, ball, 0, 18);
    if (mode === 'line') {
      trace(ctx, [...body, ballP, ...hand]);
      return ink(ctx);
    }
    const base = far ? C.sh : C.base;
    const shade = far ? C.deep : C.sh;
    // (the limb: its edge in shade, its inside laid over it)
    trace(ctx, body.slice(1));
    ctx.fillStyle = tone(a, shade);
    ctx.fill('nonzero');
    trace(ctx, armShapes(r, -0.55).slice(1));
    ctx.fillStyle = tone(a, base);
    ctx.fill('nonzero');
    // (a shade down its underside, a light along its top: soft)
    ctx.save();
    trace(ctx, armShapes(r, -0.55).slice(1));
    ctx.clip('nonzero');
    const off = (p, q, s) => {
      const d = sub(q, p);
      const L = Math.hypot(d[0], d[1]) || 1;
      let n = [-d[1] / L, d[0] / L];
      if (n[0] * -0.42 + n[1] * 0.91 < 0) n = mul(n, -1);
      return mul(n, s);
    };
    for (const [p, q, wd] of [[r.sj, r.el, aw0], [r.el, r.wr, ew]]) {
      const o = off(p, q, wd * 0.36);
      trace(ctx, [capsule(add(p, o), add(q, o), wd * 0.2, wd * 0.18)]);
      ctx.fillStyle = tone(a, shade, 0.8);
      ctx.fill('nonzero');
      if (!far) {
        trace(ctx, [capsule(sub(p, o), sub(q, o), wd * 0.07, wd * 0.06)]);
        ctx.fillStyle = tone(a, C.lt, 0.9);
        ctx.fill('nonzero');
      }
    }
    ctx.restore();
    // (the root and the round of the shoulder: plain, one with the body)
    trace(ctx, [body[0], ballP]);
    ctx.fillStyle = tone(a, base);
    ctx.fill('nonzero');
    // the hand
    trace(ctx, hand);
    ctx.fillStyle = tone(a, shade);
    ctx.fill('nonzero');
    trace(ctx, handShapes(r, -0.5));
    ctx.fillStyle = tone(a, base);
    ctx.fill('nonzero');
    ctx.save();
    trace(ctx, handShapes(r, -0.5));
    ctx.clip('nonzero');
    trace(ctx, [oval(r.handAt([-hr * 0.15, hr * 1.35]), hr * 0.62, hr * 0.32, r.rHand, 14)]);
    ctx.fillStyle = tone(a, shade, 0.85);
    ctx.fill();
    ctx.restore();
  }
  // The trunk: her torso and the spider's front body as one shape. Her forms (the chest's light, the
  // far side's shade, a light down the near edge, construction lines) ease away to the plain colour
  // toward her hips, so she runs on down into the spider body with no edge; the spider body shaded
  // underneath, lit along its top behind her; where the near legs and her near arm come out of it,
  // plain.
  function drawTrunk(ctx, a, mode) {
    const sk = a.ak;
    trace(ctx, [sk.trunk]);
    if (mode === 'line') return ink(ctx);
    // (a soft shade where the trunk lies over the abdomen (the pedicel's crease) and the middle legs)
    contact(ctx, a, [sk.trunk], [sk.abd, ...(sk.midShapes ?? [])], C.sh, 0.75);
    trace(ctx, [sk.trunk]);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    trace(ctx, [sk.trunk]);
    ctx.clip();
    const al = ctx.globalAlpha;
    // her forms
    glow(ctx, a, sk.chestAt([chW * (0.3 + sk.turnC * 0.3), chY - (chY - shY) * 0.45]), chW * 0.85, C.lt, 0.8);
    // (the far side in soft shade: a band in from the far edge, from the shoulders down to the
    // waist, no ends to it)
    {
      const g0 = sk.chestAt([-chW * 1.15, chY]);
      const g1 = sk.chestAt([-chW * 0.35, chY]);
      const [r0, g0c, b0] = hex(C.sh);
      const gr = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]);
      gr.addColorStop(0, `rgba(${r0},${g0c},${b0},0.85)`);
      gr.addColorStop(1, `rgba(${r0},${g0c},${b0},0)`);
      ctx.fillStyle = gr;
      ctx.globalAlpha = al * (a.flash > 0.01 ? 0.3 : 1);
      trace(ctx, [[[-chW * 2, shY - aw0], [chW * 2, shY - aw0], [chW * 2, NAV + 1], [-chW * 2, NAV + 1]].map((p) => (p[1] < RIB ? sk.chestAt(p) : sk.waistAt(p)))]);
      ctx.fill();
      ctx.globalAlpha = al;
    }
    // construction lines: down the middle (its top turning with the chest), under the chest
    ctx.strokeStyle = tone(a, C.guide);
    ctx.lineWidth = Math.max(0.32, 0.36 * k);
    ctx.globalAlpha = al * 0.8;
    const mid = [];
    for (let i = 0; i <= 8; i++) {
      const y = mix(neckY + (shY - neckY) * 0.65, NAV, i / 8);
      const x = Math.sin(sk.turnC * 0.7) * mix(chW, wW, i / 8) * 0.9 * (1 - i / 8);
      mid.push(y < RIB ? sk.chestAt([x, y]) : sk.waistAt([x, y]));
    }
    ctx.beginPath();
    line(mid, 3).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    const cy = chY + (wY - chY) * 0.3;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const q = -1.2 + (i / 10) * 2.4 + sk.turnC * 0.6;
      const [x, y] = sk.chestAt([Math.sin(q) * chW * 0.95, cy + Math.cos(q) * 0.5 * k]);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = al;
    ctx.strokeStyle = tone(a, C.sh);
    ctx.lineWidth = Math.max(0.32, 0.4 * k);
    for (const s of [-1, 1]) {
      const c = line([[U.dx + neckW * 0.75 * s, neckY + 1], [U.dx + shW * 0.45 * s, neckY + 1.25], [U.dx + shW * 0.74 * s, neckY + 1.05]], 3).map(sk.chestAt);
      ctx.beginPath();
      c.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
    // (her forms fade to the plain colour from her navel down to her hips: no line round her waist)
    if (!(a.flash > 0.01)) {
      const g0 = sk.bw([0, NAV - 0.4]);
      const g1 = sk.bw([0, 1.2]);
      const [r0, g0c, b0] = hex(C.base);
      const gr = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]);
      gr.addColorStop(0, `rgba(${r0},${g0c},${b0},0)`);
      gr.addColorStop(1, `rgba(${r0},${g0c},${b0},1)`);
      ctx.fillStyle = gr;
      const pts = [[-30, NAV - 0.4], [30, NAV - 0.4], [30, 1.2], [-30, 1.2]].map(sk.bw);
      trace(ctx, [pts]);
      ctx.fill();
    }
    // the spider body: shade underneath, a light along its top behind her
    const B = (p) => sk.bw(add(CEPH.c, p));
    // (one long soft shade along its underside and one long light along its back: an oval, each
    // stretched along it, so it reads as one smooth body)
    for (const [p, r, col, al2] of [[[0, CEPH.ry * 1.05], CEPH.ry * 1.25, C.sh, 0.95], [[-CEPH.rx * 0.28, -CEPH.ry * 0.62], CEPH.ry * 0.85, C.lt, 0.85]]) {
      ctx.save();
      const c = B(p);
      ctx.translate(c[0], c[1]);
      ctx.rotate(sk.rB);
      ctx.scale(CEPH.rx / CEPH.ry, 1);
      glow(ctx, a, [0, 0], r, col, al2);
      ctx.restore();
    }
    // (where the near legs come out of it and her near arm's shoulder sits: plain)
    if (!(a.flash > 0.01)) {
      seat(ctx, a, sk.arms.N.sj, ball * 2.1, 0.5);
    }
    ctx.restore();
  }
  // The neck: a short tube up into the head, only where it comes up out of the body; a soft shadow
  // under the chin.
  function drawNeck(ctx, a, mode) {
    const sk = a.ak;
    const base = sk.chestAt([U.dx, neckY + 0.9]);
    const top = sk.neckTopW;
    const shape = [capsule(base, top, neckW, neckW * 0.97)];
    trace(ctx, shape);
    if (mode === 'line') return ink(ctx);
    ctx.save();
    outside(ctx, sk.trunk);
    trace(ctx, shape);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill('nonzero');
    ctx.restore();
    // (the body's edge, inside the neck, in the neck's colour: not even a hairline where it rises)
    ctx.save();
    trace(ctx, shape);
    ctx.clip('nonzero');
    trace(ctx, [sk.trunk]);
    ctx.strokeStyle = tone(a, C.base);
    ctx.lineWidth = 2.6;
    ctx.stroke();
    const ch = sk.headAt([U.dx, U.chin + 0.45 * k]);
    ctx.translate(ch[0], ch[1]);
    ctx.rotate(sk.rH);
    ctx.scale(1, 0.42);
    glow(ctx, a, [0, 0], neckW * 1.3, C.sh, 0.75);
    ctx.restore();
  }
  // The head: round, the jaw drawn in a little; soft ears at the sides; the far side in shade, a
  // light on the crown; two faint guides to place a face by (the middle and the eye line), turning
  // with the head's look. No face.
  const headShape = () => {
    const pts = [];
    for (let i = 0; i < 36; i++) {
      const q = (i / 36) * TAU - Math.PI / 2;
      const s = Math.sin(q);
      const lo = Math.max(0, s);
      pts.push([Math.cos(q) * headRx * (1 - jaw * 0.32 * lo * lo), s * headRy * (1 + jaw * 0.07 * lo)]);
    }
    return pts;
  };
  const HEAD = headShape();
  const [eOut, eDown, eRx, eRy] = U.ear;
  function drawHead(ctx, a, mode) {
    const sk = a.ak;
    const hc = [U.dx, headY];
    const at = (p) => sk.headAt(add(hc, p));
    const lk = clamp(sk.look, -1, 1);
    const head = oneWay(HEAD.map(at));
    const ears = [-1, 1].map((s) => oval(at([s * eOut - lk * 1.8 * k, eDown]), eRx, eRy, sk.rH, 16));
    if (mode === 'line') {
      trace(ctx, [head, ...ears]);
      return ink(ctx);
    }
    // ears (the far one in shade), each with a soft hollow
    for (const s of [-1, 1]) {
      const e = ears[s < 0 ? 0 : 1];
      trace(ctx, [e]);
      ctx.fillStyle = tone(a, s < 0 ? C.sh : C.base);
      ctx.fill();
      trace(ctx, [oval(at([s * (eOut + 0.15) - lk * 1.8 * k, eDown + 0.1]), eRx * 0.5, eRy * 0.6, sk.rH, 12)]);
      ctx.fillStyle = tone(a, s < 0 ? C.deep : C.sh);
      ctx.fill();
    }
    trace(ctx, [head]);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    trace(ctx, [head]);
    ctx.clip();
    // the far side in shade, rounding with the head: a crescent, outside the head moved toward us
    ctx.save();
    outside(ctx, oneWay(HEAD.map((p) => at([p[0] * 1.08 + headRx * (0.2 - lk * 0.08), p[1] * 1.1 - headRy * 0.04]))));
    trace(ctx, [head]);
    ctx.fillStyle = tone(a, C.sh);
    ctx.fill();
    ctx.restore();
    glow(ctx, a, at([0, headRy * 0.95]), headRx * 0.75, C.sh, 0.45);
    // the crown's light
    trace(ctx, [oval(at([-headRx * 0.24 + lk * 0.6 * k, -headRy * 0.66]), headRx * 0.34, headRy * 0.1, sk.rH, 16)]);
    ctx.fillStyle = tone(a, C.lt);
    ctx.fill();
    // the guides
    ctx.strokeStyle = tone(a, C.guide);
    ctx.lineWidth = Math.max(0.3, 0.32 * k + 0.05);
    ctx.lineCap = 'round';
    const mx = lk * headRx * 0.42;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const y = mix(-headRy * 0.82, headRy * 0.92, i / 12);
      const [x, yy] = at([mx * Math.sqrt(Math.max(0, 1 - (y / headRy) ** 2)), y]);
      if (i) ctx.lineTo(x, yy);
      else ctx.moveTo(x, yy);
    }
    ctx.stroke();
    const ey = headRy * 0.2;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const q = -1.25 + (i / 12) * 2.5 + lk * 0.45;
      const [x, yy] = at([Math.sin(q) * headRx * 0.94, ey + Math.cos(q) * 0.55 * k]);
      if (i) ctx.lineTo(x, yy);
      else ctx.moveTo(x, yy);
    }
    ctx.stroke();
    ctx.restore();
  }
  // The near side's legs, in front: each comes out from UNDER the front body's lower edge (all of
  // it inside the body is covered by the body, so no root, cap or line shows on it; the body's edge
  // stays one smooth curve), a soft shade from the body on the legs just under its edge; where one
  // crosses another or the abdomen, only a soft shade, never a line.
  function drawNear(ctx, a, mode, which = 'near') {
    const sk = a.ak;
    const done = [];
    const front = which === 'near';
    if (mode === 'line') {
      for (const g of sk[which]) {
        trace(ctx, legShape(g));
        ink(ctx);
      }
      return;
    }
    ctx.save();
    outside(ctx, sk.trunk);
    for (const g of sk[which]) {
      const sh = legShape(g);
      contact(ctx, a, sh, [sk.abd, ...done], C.sh, 0.7);
      rimFill(ctx, a, sh, C.base, C.sh, 0.8 * k);
      // (a light along the top of the femur)
      ctx.save();
      trace(ctx, sh);
      ctx.clip('nonzero');
      const [R, K] = g.pts;
      trace(ctx, [capsule(add(lerp2(R, K, 0.35), [0, -LW[0] * 0.22]), add(K, [0, -LW[1] * 0.25]), LW[0] * 0.12, LW[1] * 0.14)]);
      ctx.fillStyle = tone(a, C.lt, 0.9);
      ctx.fill();
      ctx.restore();
      done.push(...sh);
    }
    ctx.restore();
    if (!done.length) return;
    // (the body's outline, where a leg comes out from under it, in the leg's own colour: not even a
    // hairline; then the body's soft shade on the legs, just under its edge)
    ctx.save();
    trace(ctx, done);
    ctx.clip('nonzero');
    outside(ctx, sk.trunk);
    trace(ctx, [sk.trunk]);
    ctx.strokeStyle = tone(a, C.base);
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
    ctx.save();
    trace(ctx, done);
    ctx.clip('nonzero');
    outside(ctx, sk.trunk);
    ctx.translate(0, 1.1 * k);
    trace(ctx, [sk.trunk]);
    ctx.lineWidth = 1.6 * k + 0.6;
    ctx.strokeStyle = tone(a, C.sh, 0.75);
    ctx.stroke();
    ctx.restore();
    if (!front) sk.midShapes = done;
  }

  // ---------- Effects: silk, the cocoon, magic, sparkles, dust, speed lines ----------
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
  const silk = (ctx, pts, wd, al) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = al;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = '#d8cdea';
    ctx.lineWidth = wd + 0.7;
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = wd;
    ctx.stroke();
  };
  const orb = (ctx, x, y, r) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)');
    gr.addColorStop(0.45, 'rgba(232,214,255,0.75)');
    gr.addColorStop(1, 'rgba(206,180,255,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  };
  function drawFx(ctx, m, a) {
    const sk = a.ak;
    const st = a.mo.rig;
    const mv = a.arMove?.mv;
    const t = a.arMove?.t ?? 0;
    if (!mv) {
      st.arWeb = null;
      st.arCoc = null;
      st.arOrb = null;
      return;
    }
    ctx.save();
    // A silk line thrown from the hand: it shoots out ahead, sagging less as it flies, a soft splat
    // where it lands; then it falls slack and fades.
    if (mv.web) {
      const [w0, w1] = mv.web;
      if (t < w0) st.arWeb = null;
      else if (t <= w1) {
        const from = sk.spots.handN;
        st.arWeb ??= { end: add(from, [H * 1.25, H * 0.1]) };
        const end = st.arWeb.end;
        const fly = 1 - (1 - clamp((t - w0) / 0.12, 0, 1)) ** 3;
        const tip = lerp2(from, end, fly);
        const slack = clamp((t - w0 - 0.22) / 0.3, 0, 1);
        const sag = H * (0.05 * (1 - fly) + 0.09 * ease(slack));
        const al = 1 - ease((t - (w1 - 0.18)) / 0.18);
        const pts = [];
        for (let i = 0; i <= 14; i++) {
          const s = i / 14;
          const p = lerp2(from, tip, s);
          pts.push([p[0], p[1] + Math.sin(Math.PI * s) * sag + Math.sin(s * 9 - t * 30) * 0.25 * (1 - fly) * k]);
        }
        silk(ctx, pts, 0.75 * k + 0.25, al);
        sk.spots.web = tip;
        if (fly >= 1) {
          const sp = after(w0 + 0.12, t, 0.3);
          if (sp >= 0) {
            ctx.globalAlpha = al * (1 - sp * 0.6);
            puff(ctx, tip[0], tip[1], (1.2 + sp * 1.4) * k, al * (1 - sp));
          }
        }
      }
    }
    // The cocoon: silk spun round and round in front of the hands into a soft white oval, growing;
    // pushed away it rolls on ahead and fades in a puff.
    if (mv.cocoon) {
      const [c0, c1, c2] = mv.cocoon;
      if (t < c0) st.arCoc = null;
      else if (t <= c2) {
        const hands = sk.spots.hands;
        st.arCoc ??= { at: add(hands, [H * 0.2, -H * 0.02]) };
        if (t <= c1) st.arCoc.at = lerp2(st.arCoc.at, add(hands, [H * 0.2, -H * 0.02]), 0.25);
        const g = ease((t - c0) / (c1 - c0));
        const go = clamp((t - c1) / (c2 - c1), 0, 1);
        const c = add(st.arCoc.at, [H * 0.9 * (1 - (1 - go) ** 2), -H * 0.05 * Math.sin(Math.PI * go)]);
        const al = 1 - ease((go - 0.55) / 0.45);
        const rx = H * (0.045 + 0.065 * g);
        const ry = H * (0.07 + 0.1 * g);
        // its body, soft: a white oval with a pale lilac rim
        ctx.globalAlpha = al * (0.35 + 0.6 * g);
        ctx.fillStyle = '#fbf9ff';
        ctx.strokeStyle = '#d8cdea';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(c[0], c[1], rx, ry, 0.12, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(c[0], c[1], rx, ry, 0.12, 0, TAU);
        ctx.clip();
        // the silk wrapping round it: soft full bands across its front, rolling over as it spins
        for (let i = 0; i < 4; i++) {
          const tilt = 0.55 + i * (Math.PI / 4) + t * 5.5;
          const y0 = Math.sin(tilt) * ry * 0.8;
          const pts = [];
          for (let j = 0; j <= 14; j++) {
            const q = (j / 14) * Math.PI;
            pts.push(add(c, [Math.cos(q) * rx * 1.05, y0 + Math.sin(q) * ry * 0.24 * Math.cos(tilt)]));
          }
          silk(ctx, pts, (0.7 * k + 0.35) * (0.6 + 0.4 * g), al * (0.45 + 0.5 * Math.abs(Math.cos(tilt))));
        }
        ctx.restore();
        // (a light on its upper side)
        ctx.globalAlpha = al * 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(c[0] - rx * 0.3, c[1] - ry * 0.45, rx * 0.28, ry * 0.14, -0.4, 0, TAU);
        ctx.fill();
        // (a strand from the hands to it while it's being spun)
        if (t <= c1) silk(ctx, line([hands, lerp2(hands, c, 0.5), add(c, [-rx, 0])], 4), 0.4 * k + 0.2, 0.8);
        sk.spots.cocoon = c;
      }
    }
    // Magic gathering between the hands: a soft glow, pulsing, sparkles circling in.
    if (mv.glow && t >= mv.glow[0] && t <= mv.glow[1]) {
      const g = clamp(Math.min((t - mv.glow[0]) / 0.15, (mv.glow[1] - t) / 0.06), 0, 1);
      const [gx, gy] = add(sk.spots.hands, [H * 0.03, 0]);
      const rr = H * 0.1 * (1 + 0.1 * Math.sin(a.now * 22));
      ctx.globalAlpha = g;
      orb(ctx, gx, gy, rr);
      for (let i = 0; i < 3; i++) {
        const an = a.now * 5 + (i * TAU) / 3;
        const d = rr * (1.6 - ((a.now * 1.4 + i / 3) % 1) * 0.9);
        sparkle(ctx, gx + Math.cos(an) * d, gy + Math.sin(an) * d, H * 0.022, an, '#fff6c8');
      }
    }
    // The spell going off: a flash, a ring of sparkles opening out, an orb flying on ahead.
    if (mv.burst != null) {
      const bp = after(mv.burst, t, 0.4);
      const op = after(mv.burst, t, 0.5);
      if (op < 0) st.arOrb = null;
      else st.arOrb ??= add(sk.spots.hands, [H * 0.04, 0]);
      if (bp >= 0 && st.arOrb) {
        const [bx, by] = st.arOrb;
        const e = 1 - (1 - bp) ** 3;
        ctx.globalAlpha = 1 - bp;
        orb(ctx, bx, by, H * 0.13 * (1 - bp * 0.5));
        for (let i = 0; i < 8; i++) {
          const an = (i * TAU) / 8 + 0.3;
          sparkle(ctx, bx + Math.cos(an) * H * 0.22 * e, by + Math.sin(an) * H * 0.22 * e, H * 0.035 * (1 - bp * 0.5), an, i % 2 ? '#e8d8ff' : '#fff2b8');
        }
      }
      if (op >= 0 && st.arOrb) {
        const [bx, by] = st.arOrb;
        const ox = bx + H * 2.2 * op;
        ctx.globalAlpha = Math.min(1, (1 - op) * 3);
        orb(ctx, ox, by, H * 0.09);
        for (let i = 1; i < 4; i++) sparkle(ctx, ox - i * H * 0.07, by + Math.sin(a.now * 30 + i) * H * 0.018, H * 0.026 * (1 - i * 0.2), a.now * 8 + i, '#fff6c8');
      }
    }
    // Hit sparkles: a four-point star and a few little ones flying out.
    (mv.spark ?? []).forEach((s0, i) => {
      const sp = after(s0, t, 0.24);
      if (sp < 0) return;
      const where = Array.isArray(mv.sparkAt) ? mv.sparkAt[i] : mv.sparkAt;
      const at = sk.spots[where] ?? sk.spots.handN;
      const [sx, sy] = at;
      const e = 1 - (1 - sp) ** 3;
      ctx.globalAlpha = 1 - sp;
      sparkle(ctx, sx, sy, H * 0.1 * (0.5 + 0.7 * e), sp * 0.8, '#ffffff');
      sparkle(ctx, sx, sy, H * 0.05 * (0.5 + 0.7 * e), sp * 0.8 + 0.4, '#fff2a8');
      for (let j = 0; j < 4; j++) {
        const q = (j * TAU) / 4 + 0.6;
        sparkle(ctx, sx + Math.cos(q) * H * 0.14 * e, sy + Math.sin(q) * H * 0.14 * e, H * 0.025, q, j % 2 ? '#ffc8de' : '#fff6c8');
      }
    });
    // (a pleased twinkle by the waving hand)
    for (const s0 of mv.twinkle ?? []) {
      const sp = after(s0, t, 0.4);
      if (sp < 0) continue;
      const [x, y] = add(sk.spots.handN, [H * 0.06, -H * 0.05 - sp * H * 0.06]);
      ctx.globalAlpha = Math.sin(Math.PI * sp);
      sparkle(ctx, x, y, H * 0.04, sp * 2, '#fff6c8');
    }
    // Dust where it lands or pushes off.
    for (const [d0, where] of mv.dust ?? []) {
      const dp = after(d0, t, 0.42);
      if (dp < 0) continue;
      const gx = (sk.spots[where] ?? sk.spots.feet)[0];
      const e = 1 - (1 - dp) ** 2;
      for (let i = 0; i < 4; i++) {
        const dir = i < 2 ? -1 : 1;
        puff(ctx, gx + dir * H * (0.07 + (i % 2) * 0.07) * (0.5 + e), -H * (0.015 + 0.012 * (i % 2)) - e * H * 0.03, H * (0.03 + (i % 2) * 0.01) * (0.6 + 0.6 * e), (1 - dp) * 0.8);
      }
    }
    // Speed lines behind a dash.
    if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
      const q = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
      ctx.globalAlpha = 0.7 * (1 - q);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(0.5, H * 0.018);
      for (let i = 0; i < 4; i++) {
        const y = -H * (0.2 + i * 0.15);
        const x0 = sk.pivot[0] - H * (0.45 + ((t * 3 + i * 0.37) % 1) * 0.2);
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 - H * (0.2 + (i % 2) * 0.1), y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    if (m.act && ARACHNE_MOVES[m.act.name]) {
      const mv = ARACHNE_MOVES[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + lastKey(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.arAtk) {
        const pool = m.def.moves ?? POOL;
        st.arN = (st.arN ?? m.uid) + 1;
        st.arPick = m.move ?? pool[st.arN % pool.length];
      }
      st.arAtk = true;
      const mv = ARACHNE_MOVES[st.arPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.arAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lastKey(ARACHNE_MOVES.hurt)) return [ARACHNE_MOVES.hurt, a.hurtAgo, 1];
    const happy = ARACHNE_MOVES.curtsy;
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < happy.anticT + lastKey(happy)) return [happy, gl - happy.anticT, gl < happy.anticT ? gl / happy.anticT : 1];
    // (a happy beat in a cutscene: curtsying on a loop)
    if (m.hp > 0 && m.cine?.mood === 'happy') {
      const len = happy.anticT + lastKey(happy) + 0.5;
      const T = (a.now % len) - happy.anticT;
      return [happy, T, T < 0 ? 1 + T / happy.anticT : 1];
    }
    return [null, 0, 0];
  }
  const seq = [
    ['far', drawFar],
    ['abd', drawAbd],
    ['mid', (ctx, a, mode) => drawNear(ctx, a, mode, 'mid')],
    ['armF', (ctx, a, mode) => drawArm(ctx, a, mode, 'F')],
    ['trunk', drawTrunk],
    ['neck', drawNeck],
    ['head', drawHead],
    ['near', drawNear],
    ['armN', (ctx, a, mode) => drawArm(ctx, a, mode, 'N')],
  ];
  const parts = [
    ...seq.map(([name, draw]) => ({ name, parent: null, at: () => [0, 0], pivot: [0, 0], s: NOTHING, paint: (ctx, a) => draw(ctx, a, 'line') })),
    ...seq.map(([name, draw]) => ({ name: `${name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: NOTHING, paint: (ctx, a) => draw(ctx, a, 'fill') })),
  ];
  const span = Math.max(...LG.tips.map((p) => Math.abs(p[0]))) + Math.abs(AB.c[0]) + AB.rx;
  const RW = Math.ceil(span * 2 + 24);
  const RH = Math.ceil(H * 1.9 + 10);
  const springs = Object.fromEntries(CH.map((c) => [c, ['shN', 'elN', 'shF', 'elF'].includes(c) ? [160, 19] : ['hwN', 'hwF'].includes(c) ? [220, 22] : c === 'look' ? [70, 14] : ['head', 'neck'].includes(c) ? [130, 17] : ['curl', 'fold', 'wave'].includes(c) ? [150, 21] : [170, 21]]));
  const rig = makeRig({
    w: RW,
    h: RH,
    soft: true,
    stride: cycle,
    recover: 1.4,
    springs,
    walkStiff: { waist: [300, 30], chest: [300, 30], shN: [260, 28], shF: [260, 28], pitch: [300, 30] },
    fast: CH.filter((c) => !['look', 'turnC'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.arActive),
    kick: { waist: -70, head: -90, abd: 60 },
    turnKick: { waist: 45, head: -40, abd: -30 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.3;
      // Standing about: breathing (the chest, the shoulders, a soft bob of the abdomen); now and then
      // a glance back over the shoulder, a hand to the cheek, a stretch, each in its turn on a 24 s
      // round; the legs tapping in turn (skeleton).
      const breath = Math.sin(t * 1.5);
      const cyc = t % 24;
      const glance = hold(cyc, 2.6, 3.3, 4.9, 5.6) - 0.8 * hold(cyc, 13.4, 14, 15.2, 15.8);
      const cheek = hold(cyc, 7.4, 8.2, 10.6, 11.4);
      const stretch = hold(cyc, 18, 18.9, 19.9, 20.8);
      const calm = a.calm ?? 1;
      const idle = {
        x: 0, lift: breath * 0.12, hop: 0, crouch: 0.02, pitch: Math.sin(t * 0.5) * 0.6, abd: Math.sin(t * 1.5 - 0.9) * 1.6 + Math.sin(t * 0.37) * 1.2, curl: 0, fold: 0, fUp: 0, fFwd: 0, wave: 0,
        waist: 1 + Math.sin(t * 0.45) * 0.8, chest: -breath * 0.7, neck: -breath * 0.3, head: 0.4 * breath, look: 0.38, turnC: 0.3 + Math.sin(t * 0.45) * 0.06,
        shN: 6 + breath * 1.2, elN: 9 + breath, shF: -6 - breath * 1.2, elF: 7 + breath, hwN: 4, hwF: -4, shrugN: 0.15 + breath * 0.2, shrugF: 0.15 + breath * 0.2,
      };
      // (the glance: the head turns, the neck after it)
      idle.look -= glance * 0.95 * calm;
      idle.head += -glance * 3 * calm;
      idle.neck += -glance * 2 * calm;
      idle.turnC -= glance * 0.15 * calm;
      // (a hand to the cheek: the elbow out, the head tipping into it)
      const ck = cheek * calm;
      idle.shN = mix(idle.shN, 136, ck);
      idle.elN = mix(idle.elN, 76, ck);
      idle.hwN = mix(idle.hwN, -18, ck);
      idle.head += 6 * ck;
      idle.look += 0.2 * ck;
      idle.shrugN += 0.5 * ck;
      // (a stretch: both arms up high, the back arching, the abdomen lifting)
      const sk2 = stretch * calm;
      idle.shN = mix(idle.shN, 166, sk2);
      idle.elN = mix(idle.elN, 14, sk2);
      idle.shF = mix(idle.shF, -166, sk2);
      idle.elF = mix(idle.elF, -14, sk2);
      idle.chest -= 6 * sk2;
      idle.waist -= 5 * sk2;
      idle.head -= 6 * sk2;
      idle.abd += 4 * sk2;
      idle.shrugN += 1.2 * sk2;
      idle.shrugF += 1.2 * sk2;
      // Walking: the rider leans in a touch and rides the steps, swaying at the waist a beat behind
      // the body's rock, her arms easing back and forth (never pumping).
      const u = st.arU ?? 0;
      const sw = Math.sin(TAU * u);
      const walk = { ...idle, x: 0, lift: 0, crouch: 0.05, pitch: 0.5, abd: Math.sin(2 * TAU * u - 1.2) * 1.4, waist: 4 + Math.sin(2 * TAU * u - 0.4) * 1.2, chest: 1 - Math.sin(2 * TAU * u - 0.9) * 0.8, neck: 0, head: -1 + Math.sin(2 * TAU * u - 1.3) * 0.8, look: 0.4, turnC: 0.32 + sw * 0.1, shN: 8 + sw * 9, elN: 14 + sw * 4, shF: -8 - sw * 9, elF: 12 - sw * 4, hwN: 6, hwF: -6 };
      const [mv, mt, windW] = moveNow(m, a, st);
      const base = {};
      for (const c of CH) base[c] = mix(idle[c], walk[c], a.walkW);
      base.x /= H;
      base.hop /= H;
      const out = mv ? keyed(mv, mt, windW, base) : { ...base };
      // Poses, asleep (a nap), beaten.
      const nap = m.habit?.kind === 'nap' && a.now < (m.habit.until ?? 0) && m.hp > 0;
      const slow = Math.sin(t * 0.9);
      const pose = nap ? 'sleep' : m.pose;
      if (!mv && pose === 'sit') Object.assign(out, { crouch: 0.82, fold: 1, pitch: 0, waist: 3, chest: -breath * 0.6, shN: 18, elN: 62, shF: 6, elF: 70, hwN: -10, hwF: -10, lift: breath * 0.1 });
      else if (!mv && pose === 'rest') Object.assign(out, { crouch: 1, fold: 1, pitch: -1, abd: -3 + slow * 1.2, waist: 7, chest: 3 - slow * 0.8, neck: 2, head: 7 + slow * 0.8, look: -0.1, shN: 26, elN: 84, shF: 24, elF: 90, hwN: -16, hwF: -14, lift: slow * 0.12 });
      else if (!mv && pose === 'sleep') Object.assign(out, { crouch: 1, fold: 1, pitch: -2, abd: -4 + slow * 1.6, waist: 36 + slow * 1.2, chest: 16 + slow * 0.8, neck: 8, head: 16, look: 0.3, turnC: 0.2, shN: 52, elN: 96, shF: 58, elF: 94, hwN: -6, hwF: -6, shrugN: 1.4, shrugF: 1.4, lift: slow * 0.15 });
      if (m.hp <= 0) Object.assign(out, { crouch: 1, fold: 0.8, curl: 0.25, pitch: -3, abd: -5, waist: 30, chest: 12, neck: 6, head: 18, look: -0.1, shN: 22, elN: 30, shF: -8, elF: 24, fUp: 0, fFwd: 0, wave: 0 });
      else if (!mv && m.cine?.mood === 'sad') Object.assign(out, { crouch: 0.45, fold: 0.4, waist: 14, chest: 6, head: 12, shN: 10, elN: 50, shF: 8, elF: 56, abd: -4 });
      else if (!mv && m.cine?.mood === 'angry') Object.assign(out, { crouch: 0.2, pitch: 4, waist: 6, shN: 70, elN: 50, shF: -70, elF: 50, fUp: 0.3 });
      st.arActive = Boolean(mv);
      a.arMove = mv ? { mv, t: mt } : null;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = out.x * H;
      res.hop = out.hop * H;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.ak = skeleton(S, a, m);
    },
    parts,
    fx: (ctx, m, a) => drawFx(ctx, m, a),
  });
  // (a still for the Monster Book: the abdomen, the front body, the rider, plain)
  const still = () => {
    const ox = RW / 2;
    const gy = RH;
    const hb = gy - P.hip;
    return {
      w: RW,
      h: RH,
      res: 3,
      shapes: [
        E(ox + AB.c[0], hb + AB.c[1], AB.rx, AB.ry, C.base),
        E(ox + CEPH.c[0], hb + CEPH.c[1], CEPH.rx, CEPH.ry, C.base),
        E(ox, hb + (shY + 0) / 2, chW, -shY / 2 + 1, C.base),
        E(ox + U.dx, hb + headY, headRx, headRy, C.base),
      ],
    };
  };
  return { rig, still, stride: cycle, speed: walkSpeed, H, w: Math.round(span * 1.1), h: Math.round(H * 1.02) };
}

export const ARACHNE_ARTS = {};
export const ARACHNE_DEFS = {};
for (const kind of ARACHNE_KINDS) {
  const r = arachneRig(kind);
  ARACHNE_ARTS[`blank_${kind}`] = { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig };
  ARACHNE_DEFS[kind] = { id: `blank_${kind}`, name: `Blank ${kind}`, art: `blank_${kind}`, w: r.w, h: r.h, speed: r.speed, hp: 100, fight: { windup: 0.5 }, bodyH: r.H, moves: POOL };
}
