// The spider base (2026-11-25): a blank chibi spider made for a spider from the start, nothing
// carried over from another base; only the engine is shared (rig.js's springs and live parts). A
// plain lilac mannequin for designing spider monsters on. Cute, never gross (the player's rule):
// round soft shapes, chunky rounded legs (thin spindly legs read as gross), no fangs, no hair, no
// eyes, no markings; soft construction guides only. Drawn live like the other blank bases: smooth
// shapes over its bones, outlined only on the outer edge (an outline pass, then a fill pass over
// it), in the soft plum ink, never near-black.
//
// The body, side on and facing right, turned a little toward us and seen a little from above, worked
// out in 3D and projected (so the near legs stand in front of the body and the far ones behind it,
// a shade darker):
//   head-body  the cephalothorax: a round soft dome at the front, the body's own frame; the legs and
//              the palps grow out of its lower half. Guides: a soft curved line across its front
//              where the eyes go, and a faint line along the top of the dome behind it (the two
//              never meet, so they never read as a cross)
//   abdomen    a round soft ball behind, hung from a small waist (the pedicel) and turned about it:
//              it breathes (a slow rise and fall), lifts to aim its silk, swings on a damped spring
//              when the body bobs, hops or lands; a little round nub at its tip (the spinnerets),
//              where the silk comes from
//   legs       four a side, each three chunky rounded segments (the long thigh up to a knee held
//              high, the shin down, a short rounded tip), with a soft ball at the knee; worked out
//              in the upright plane through the leg's root and its tip: the thigh held up at its own
//              angle (lowered only as far as the leg must to reach), the ankle bowed outward, so each
//              leg is one high soft arch. The far legs stand behind the body, a shade darker; the
//              near legs come out from under the head-body (its round side bulges over their roots,
//              so no root ever shows) and pass in front of the abdomen; a raised front leg comes
//              round in front of the face, fading in over its root
//   gait       an alternating 4-4 pattern (near 1, far 2, near 3, far 4 with far 1, near 2, far 3,
//              near 4), with a small ripple from back to front; the step's phase comes from the
//              distance walked (and from its own lunges along the ground), so a planted tip never
//              slides; each tip lifts in an eased arc; a light bob and roll as each set of four
//              takes the weight
//   palps      two short round feelers in front of the face, rubbing as it grooms
// Presets: jumper (a jumping spider: compact, a big round head-body, a smaller abdomen, short thick
// front legs held a little up; quick steps, a little hop now and then), orbweaver (a small head-body,
// a big round abdomen carried high, long legs; careful high steps; it hangs and drops on a thread),
// fuzzy (a chunky tarantula-shaped body, thick stubby legs; a slow heavy walk). All faceless.
// Moves (SPIDER_MOVES): pounce (coiled, a leap and a bite on landing), nip (a quick lunge), stomp
// (rearing up, front legs slammed down), web (abdomen up, a soft silk strand shot in an arc over its
// back), rear (a threat: reared up, front legs raised and waving), drop (the orbweaver's signature:
// a thread shot up, zipping up it, hanging head-down, dropping on its target, bouncing on the thread
// and lowering itself back down), jump, dash, dodge, hurt, knockdown (tumbling onto its back, legs
// curled in and wiggling, rolling back over), dance (pleased: reared up, front legs waving, abdomen
// bobbing). Poses (m.pose): rest (body down, legs folded), curl (legs curled in round it), sleep
// (legs tucked, slow breathing); a nap habit sleeps.

import { makeRig, clamp, TAU } from './rig.js';
import { hold } from './kidrig.js';
import { E } from './kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299' };
// (the bases' shared soft outline ink)
const INK = '#7f6982';

const smooth = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const mix = (a, b, u) => a + (b - a) * u;
const frac = (x) => x - Math.floor(x);
const add3 = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const sub3 = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const mul3 = (p, k) => [p[0] * k, p[1] * k, p[2] * k];
const mix3 = (p, q, u) => [mix(p[0], q[0], u), mix(p[1], q[1], u), mix(p[2], q[2], u)];
// (turned about the z axis, the one pointing at us: + lifts the nose)
const spinZ = (p, r) => {
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};
const rgbOf = (h) => {
  const n = parseInt(h.slice(1, 7), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
// (0 -> 1 -> 0, smooth at both ends, over the window a..b)
const swell = (u, a, b) => (u <= a || u >= b ? 0 : Math.sin((Math.PI * (u - a)) / (b - a)) ** 2);

// ---------- Outlines (all turned the same way round, so filled together they make one union) ----------
function arcInto(out, c, r, a0, a1, n) {
  for (let i = 0; i <= n; i++) {
    const q = a0 + ((a1 - a0) * i) / n;
    out.push([c[0] + Math.cos(q) * r, c[1] + Math.sin(q) * r]);
  }
}
function disc(c, r, n = 18) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const q = (i / n) * TAU;
    out.push([c[0] + Math.cos(q) * r, c[1] + Math.sin(q) * r]);
  }
  return out;
}
// A rounded tapering bone from p0 (half-width r0) to p1 (r1): two round ends joined by their
// tangents.
function pill(p0, r0, p1, r1) {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const L = Math.hypot(dx, dy);
  if (L <= Math.abs(r0 - r1) + 1e-3) return disc(r0 >= r1 ? p0 : p1, Math.max(r0, r1));
  const th = Math.atan2(dy, dx);
  const f = Math.PI / 2 - Math.asin((r0 - r1) / L);
  const out = [];
  arcInto(out, p1, r1, th - f, th + f, 7);
  arcInto(out, p0, r0, th + f, th + TAU - f, 11);
  return out;
}
const trace = (ctx, polys) => {
  ctx.beginPath();
  for (const p of polys) {
    if (p.length < 3) continue;
    p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }
};

// ---------- The view: turned a little toward us (yaw), seen a little from above (pitch) ----------
// Model space: x forward, y up, z toward us. Three orthonormal rows: screen x, screen y (down), and
// depth (toward us).
function viewOf(yawDeg, pitchDeg) {
  const cy = Math.cos(yawDeg * D2R);
  const sy = Math.sin(yawDeg * D2R);
  const cp = Math.cos(pitchDeg * D2R);
  const sp = Math.sin(pitchDeg * D2R);
  const RX = [cy, 0, -sy];
  const RY = [sy * sp, -cp, cy * sp];
  const RD = [sy * cp, sp, cy * cp];
  const dot = (r, p) => r[0] * p[0] + r[1] * p[1] + r[2] * p[2];
  return { pt: (p) => [dot(RX, p), dot(RY, p)], depth: (p) => dot(RD, p), RX, RY, RD, dot };
}
// The outline of a round body (an ellipsoid: middle c, half-sizes r, turned th about z) as seen: an
// ellipse, worked out exactly (the shadow of the ellipsoid along the view).
function ellipsoidOutline(V, c, r, th, n = 40) {
  const axes = [[Math.cos(th), Math.sin(th), 0], [-Math.sin(th), Math.cos(th), 0], [0, 0, 1]];
  const B = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const rows = [V.RX, V.RY, V.RD];
  axes.forEach((e, i) => {
    const f = rows.map((row) => V.dot(row, e));
    const k = 1 / (r[i] * r[i]);
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) B[a][b] += f[a] * f[b] * k;
  });
  const m00 = B[0][0] - (B[0][2] * B[0][2]) / B[2][2];
  const m01 = B[0][1] - (B[0][2] * B[1][2]) / B[2][2];
  const m11 = B[1][1] - (B[1][2] * B[1][2]) / B[2][2];
  const ang = 0.5 * Math.atan2(2 * m01, m00 - m11);
  const l1 = (m00 + m11) / 2 + ((m00 - m11) / 2) * Math.cos(2 * ang) + m01 * Math.sin(2 * ang);
  const l2 = m00 + m11 - l1;
  const A = 1 / Math.sqrt(Math.max(1e-6, l1));
  const Bb = 1 / Math.sqrt(Math.max(1e-6, l2));
  const [cx, cy] = V.pt(c);
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const out = [];
  for (let i = 0; i < n; i++) {
    const q = (i / n) * TAU;
    const x = Math.cos(q) * A;
    const y = Math.sin(q) * Bb;
    out.push([cx + x * ca - y * sa, cy + x * sa + y * ca]);
  }
  return out;
}

// ---------- The spiders (units: game px at scale 1) ----------
// hb: the head-body's middle above the ground, standing; ceph: its half length, height, width;
// abd: the abdomen's half-sizes, its waist (in the head-body's frame), its rest tilt (degrees, + up);
// legs: y of the roots (head-body frame), z of the roots (a share of its half width), and each pair
// front to back [x of its root, x and z of its tip at rest (fanned out ahead or behind, a little out
// to the side), the three bones (thigh, shin, tip), the widths at the root, the knee, the ankle and
// the tip, the angle the thigh is held up at (degrees)];
// palp: its root [x, y, z as shares of the head-body], its two bones, widths; gait: half a stride,
// the lift, the share of the cycle a tip is down, cycles a second, the bob and the roll; front: how
// far the front legs are held up at rest; hop: little idle hops; soft: the soft body (the abdomen's
// spring [k, c], how hard a footfall jolts it, how hard the body's moves push it, and how much the
// whole body wobbles with it).
const JUMPER = {
  name: 'Jumping spider',
  scale: 1.7,
  yaw: 12,
  pitch: 16,
  hb: 6.2,
  ceph: [5.4, 4.9, 4.8],
  abd: { r: [5.0, 4.4, 4.2], at: [-4.2, 0], tilt: 4 },
  legs: {
    y: -2.5,
    z: 0.5,
    n: [
      [3.1, 11.4, 3.4, [7.4, 7.4, 1.9], [3.4, 3.1, 2.7, 2.1], 36],
      [1.0, 5.2, 5.2, [5.0, 6.8, 1.9], [3.0, 2.8, 2.5, 1.9], 56],
      [-0.8, -3.2, 5.2, [5.0, 6.5, 1.9], [3.0, 2.8, 2.5, 1.9], 56],
      [-3.0, -9.8, 3.6, [6.2, 7.0, 2.0], [3.0, 2.8, 2.5, 1.9], 40],
    ],
  },
  palp: { at: [0.8, -0.5, 0.36], len: [1.5, 1.4], w: [1.8, 1.6, 1.6] },
  gait: { half: 2.3, lift: 2.4, duty: 0.56, cadence: 2.4, bob: 0.28, roll: 1.2 },
  soft: { k: 150, c: 8.5, foot: 22, gain: 0.4, body: 0.25 },
  front: 0.14,
  hop: true,
  moves: ['pounce', 'stomp', 'web'],
};
const ORBWEAVER = {
  name: 'Orb weaver',
  scale: 1.25,
  yaw: 12,
  pitch: 16,
  hb: 6.6,
  ceph: [4.4, 3.7, 3.8],
  abd: { r: [7.6, 7.6, 7.0], at: [-3.4, 0.6], tilt: 36 },
  legs: {
    y: -1.8,
    z: 0.55,
    n: [
      [2.5, 11.4, 3.4, [7.0, 11.2, 2.5], [2.7, 2.5, 2.2, 1.7], 64],
      [0.8, 5.6, 5.6, [6.6, 9.9, 2.4], [2.6, 2.4, 2.1, 1.6], 70],
      [-0.7, -4.0, 5.6, [6.2, 9.3, 2.3], [2.6, 2.4, 2.1, 1.6], 70],
      [-2.4, -10.4, 3.6, [6.8, 10.4, 2.5], [2.6, 2.4, 2.1, 1.6], 62],
    ],
  },
  palp: { at: [0.8, -0.5, 0.36], len: [1.3, 1.2], w: [1.5, 1.4, 1.4] },
  gait: { half: 2.6, lift: 3.4, duty: 0.6, cadence: 2.1, bob: 0.22, roll: 0.8 },
  soft: { k: 115, c: 7.5, foot: 20, gain: 0.42, body: 0.3 },
  front: 0,
  hop: false,
  moves: ['drop', 'web', 'nip'],
};
const FUZZY = {
  name: 'Fuzzy spider',
  scale: 1.6,
  yaw: 12,
  pitch: 16,
  hb: 6.2,
  ceph: [6.0, 4.9, 5.4],
  abd: { r: [7.0, 6.2, 6.2], at: [-4.6, 0], tilt: 6 },
  legs: {
    y: -2.6,
    z: 0.52,
    n: [
      [3.5, 12.0, 3.8, [7.6, 6.8, 2.2], [3.9, 3.6, 3.2, 2.5], 32],
      [1.2, 5.6, 5.8, [5.0, 6.0, 2.2], [3.8, 3.5, 3.1, 2.4], 50],
      [-0.9, -3.6, 5.8, [5.0, 5.8, 2.2], [3.8, 3.5, 3.1, 2.4], 50],
      [-3.3, -10.6, 4.0, [6.4, 6.6, 2.3], [3.8, 3.5, 3.1, 2.4], 36],
    ],
  },
  palp: { at: [0.8, -0.5, 0.36], len: [1.7, 1.5], w: [2.2, 2.0, 2.0] },
  gait: { half: 2.1, lift: 1.8, duty: 0.66, cadence: 1.75, bob: 0.45, roll: 1.6 },
  soft: { k: 72, c: 6, foot: 26, gain: 0.45, body: 1 },
  front: 0.04,
  hop: false,
  moves: ['stomp', 'nip', 'web'],
};
export const SPIDER_PRESETS = { jumper: JUMPER, orbweaver: ORBWEAVER, fuzzy: FUZZY };
export const SPIDER_KINDS = ['jumper', 'orbweaver', 'fuzzy'];

// ---------- The moves (x, hop in body heights; lift in px; tip, abd in degrees) ----------
// Each move: anticT (its wind-up, played before its moment 0, the blow) and keys [time, pose, ease]
// from -anticT on (anything not in a key rests); the channels: x along its path, hop, lift (the
// body up), crouch (1 down on the ground), tip (the body turned, + nose up), flip (over onto its
// back), abd (the abdomen tilted, + up), fl (the front legs raised), fw (waving them), reach (front
// legs reaching ahead), fold (legs drawn in on the ground), tuck (legs tucked in the air), splay
// (legs spread), palp (palps raised, - lowered), groom, silk (its thread out).
// Effects: spark [times] at sparkAt (head, front, web), dust [[time, where]], web [shot, hits,
// gone], lines [from, to].
export const SPIDER_MOVES = {
  pounce: {
    anticT: 0.32,
    keys: [
      [-0.14, { crouch: 0.5, x: -0.04, tip: 9, fl: 0.55, palp: 0.6, abd: -4 }, 'io'],
      [0, { crouch: 0.78, x: -0.07, tip: 13, fl: 0.75, palp: 0.9, abd: -8 }, 'io'],
      [0.12, { hop: 0.55, x: 0.42, crouch: 0, tip: -2, fl: 0.15, reach: 1, tuck: 0.3, palp: 0.4, abd: 8 }, 'out'],
      [0.25, { hop: 0.06, x: 0.84, tip: -12, reach: 1, tuck: 0.1, abd: 10, palp: -0.2 }, 'in'],
      [0.31, { hop: 0, x: 0.88, crouch: 0.55, tip: -6, reach: 0.35, splay: 0.5, abd: -8 }, 'out'],
      [0.56, { x: 0.86, crouch: 0.12, tip: 2, fl: 0.2 }, 'io'],
      [1.12, {}, 'io'],
    ],
    spark: [0.27],
    sparkAt: 'head',
    dust: [[0.01, 'feet'], [0.31, 'front']],
  },
  nip: {
    anticT: 0.24,
    keys: [
      [-0.1, { x: -0.04, crouch: 0.3, tip: 7, fl: 0.35, palp: 0.7, abd: -3 }, 'io'],
      [0, { x: -0.06, crouch: 0.4, tip: 10, fl: 0.45, palp: 0.9, abd: -5 }, 'io'],
      [0.07, { x: 0.13, crouch: 0.1, tip: -10, fl: 0.05, reach: 0.65, palp: -0.3, abd: 6 }, 'out'],
      [0.2, { x: 0.11, tip: -6, reach: 0.45, abd: 3 }, 'io'],
      [0.62, {}, 'io'],
    ],
    spark: [0.08],
    sparkAt: 'head',
  },
  stomp: {
    anticT: 0.36,
    keys: [
      [-0.16, { tip: 15, lift: 1.4, fl: 1, palp: 0.6, abd: -8 }, 'io'],
      [0, { tip: 21, lift: 2.1, fl: 1.15, palp: 0.85, abd: -11 }, 'io'],
      [0.08, { tip: -5, lift: 0, crouch: 0.38, fl: 0, splay: 0.55, abd: 7, palp: -0.4 }, 'in'],
      [0.22, { tip: -2, crouch: 0.2, splay: 0.3, abd: -2 }, 'out'],
      [0.72, {}, 'io'],
    ],
    spark: [0.08],
    sparkAt: 'front',
    dust: [[0.08, 'front']],
  },
  web: {
    anticT: 0.3,
    keys: [
      [-0.12, { tip: -5, abd: 18, crouch: 0.2, palp: 0.3 }, 'io'],
      [0, { tip: -9, abd: 30, crouch: 0.3 }, 'io'],
      [0.06, { tip: -4, abd: 22, crouch: 0.15, x: -0.04 }, 'out'],
      [0.45, { tip: -3, abd: 17, crouch: 0.1, x: -0.03 }, 'io'],
      [0.92, {}, 'io'],
    ],
    web: [0, 0.22, 0.95],
    spark: [0.22],
    sparkAt: 'web',
  },
  rear: {
    anticT: 0.26,
    keys: [
      [0, { tip: 19, lift: 1.8, fl: 1.1, fw: 1, palp: 1, abd: -10 }, 'io'],
      [1.0, { tip: 19, lift: 1.8, fl: 1.1, fw: 1, palp: 1, abd: -10 }],
      [1.38, {}, 'io'],
    ],
  },
  drop: {
    anticT: 0.5,
    keys: [
      [-0.38, { crouch: 0.5, abd: 30, tip: -6, palp: 0.4 }, 'io'],
      [-0.3, { crouch: 0.6, abd: 36, tip: -8, silk: 1 }, 'out'],
      [-0.03, { hop: 1.55, crouch: 0, tip: -90, abd: 4, tuck: 0.1, splay: 0.7, silk: 1, palp: 0.3 }, 'io'],
      [0, { hop: 1.55, tip: -90, abd: 4, tuck: 0.1, splay: 0.7, silk: 1, palp: 0.3 }],
      [0.12, { hop: 0.42, tip: -88, abd: -4, tuck: 0, splay: 0.6, reach: 0.6, silk: 1, palp: 0.6 }, 'in'],
      [0.3, { hop: 0.8, tip: -92, abd: 8, tuck: 0.25, splay: 0.4, silk: 1 }, 'out'],
      [0.48, { hop: 0.6, tip: -89, abd: 2, tuck: 0.1, splay: 0.6, silk: 1 }, 'io'],
      [0.82, { hop: 0.22, tip: -36, abd: 0, splay: 0.4, silk: 1 }, 'io'],
      [1.0, { hop: 0, tip: 0, crouch: 0.45, silk: 0, splay: 0.3 }, 'in'],
      [1.3, {}, 'io'],
    ],
    spark: [0.12],
    sparkAt: 'head',
    dust: [[1.0, 'feet']],
  },
  jump: {
    anticT: 0.2,
    keys: [
      [0, { crouch: 0.7, tip: -3, abd: -4 }],
      [0.14, { hop: 0.9, crouch: 0, tuck: 0.8, tip: 4, abd: 8, palp: 0.5 }, 'out'],
      [0.3, { hop: 1, tuck: 0.9, tip: 0, abd: 4 }, 'out'],
      [0.48, { hop: 0.03, tuck: 0.1, splay: 0.3, tip: -3, abd: -6 }, 'in'],
      [0.54, { crouch: 0.55, splay: 0.4, abd: -9 }, 'out'],
      [0.9, {}, 'io'],
    ],
    dust: [[0, 'feet'], [0.5, 'feet']],
  },
  dash: {
    anticT: 0.1,
    keys: [
      [0, { crouch: 0.3, x: -0.03, tip: -3 }],
      [0.22, { x: 0.7, crouch: 0.15, tip: -5, abd: -6 }, 'out'],
      [0.38, { x: 0.75, tip: 2, abd: 4 }, 'io'],
      [0.95, {}, 'io'],
    ],
    lines: [0, 0.3],
    dust: [[0.02, 'feet']],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.35 }],
      [0.13, { hop: 0.3, x: -0.42, tip: 14, tuck: 0.55, fl: 0.4, abd: -10 }, 'out'],
      [0.3, { x: -0.48, crouch: 0.4, tip: -2, splay: 0.3 }, 'in'],
      [0.8, {}, 'io'],
    ],
    dust: [[0.3, 'feet']],
  },
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.05, tip: 12, crouch: 0.2, fl: 0.5, palp: 1, abd: -12, splay: 0.3 }, 'out'],
      [0.22, { x: -0.05, tip: 6, crouch: 0.15, fl: 0.25, palp: 0.5, abd: -5 }, 'io'],
      [0.6, {}, 'io'],
    ],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.1, { x: -0.06, tip: 20, crouch: 0.15, fl: 0.6, palp: 1, abd: -14 }, 'out'],
      [0.38, { flip: 0.75, x: -0.14, hop: 0.35, tuck: 0.9, abd: -6 }, 'io'],
      [0.52, { flip: 1, x: -0.16, tuck: 1, abd: -4 }, 'in'],
      [0.6, { flip: 0.97, x: -0.16, tuck: 1 }, 'out'],
      [1.3, { flip: 1, x: -0.16, tuck: 1 }],
      [1.55, { flip: 0.5, x: -0.12, hop: 0.3, tuck: 0.6 }, 'io'],
      [1.72, { flip: 0, x: -0.08, crouch: 0.5, splay: 0.4 }, 'in'],
      [2.1, {}, 'io'],
    ],
    dust: [[0.52, 'body'], [1.72, 'feet']],
  },
  dance: {
    anticT: 0.2,
    keys: [
      [0, { tip: 11, lift: 1, fl: 0.9, fw: 1, abd: 22, palp: 0.8 }],
      [0.25, { tip: 12, lift: 1.4, fl: 0.9, fw: 1, abd: 32, palp: 0.8, x: 0.03 }, 'io'],
      [0.5, { tip: 11, lift: 1, fl: 0.9, fw: 1, abd: 18, palp: 0.8, x: 0 }, 'io'],
      [0.75, { tip: 12, lift: 1.4, fl: 0.9, fw: 1, abd: 32, palp: 0.8, x: -0.03 }, 'io'],
      [1.0, { tip: 11, lift: 1, fl: 0.9, fw: 1, abd: 18, palp: 0.8, x: 0 }, 'io'],
      [1.25, { tip: 12, lift: 1.4, fl: 0.9, fw: 1, abd: 30, palp: 0.8 }, 'io'],
      [1.6, {}, 'io'],
    ],
  },
};
export const SPIDER_SHOW = ['pounce', 'nip', 'stomp', 'web', 'rear', 'drop', 'jump', 'dash', 'dodge', 'hurt', 'knockdown', 'dance'];
const CH = ['x', 'hop', 'lift', 'crouch', 'tip', 'flip', 'abd', 'fl', 'fw', 'reach', 'fold', 'tuck', 'splay', 'palp', 'groom', 'silk'];
const EASE = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: smooth };
const endOf = (mv) => mv.keys[mv.keys.length - 1][0];
// A move's pose at time t: from rest at -anticT through its keys (x and hop turned into px).
function poseAt(mv, t, rest, H) {
  const keys = mv.keys[0][0] > -mv.anticT ? [[-mv.anticT, {}], ...mv.keys] : mv.keys;
  const full = (k) => {
    const o = { ...rest, ...k[1] };
    if ('x' in k[1]) o.x = k[1].x * H;
    if ('hop' in k[1]) o.hop = k[1].hop * H;
    return o;
  };
  if (t <= keys[0][0]) return full(keys[0]);
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return full(keys[keys.length - 1]);
  const p0 = full(keys[i]);
  const p1 = full(keys[i + 1]);
  const u = (EASE[keys[i + 1][2]] ?? smooth)(clamp((t - keys[i][0]) / Math.max(1e-6, keys[i + 1][0] - keys[i][0]), 0, 1));
  const out = {};
  for (const c of CH) out[c] = mix(p0[c] ?? 0, p1[c] ?? 0, u);
  return out;
}
// (0..1 through a short window after a moment, or -1)
const since = (at, t, len) => (t >= at && t <= at + len ? (t - at) / len : -1);
const EMPTY = () => sprite('rig|spiderblank', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// (a preset at its own size: every length in it times its scale)
function sized(P) {
  const k = P.scale ?? 1;
  const m = (v) => v * k;
  return {
    ...P,
    hb: m(P.hb),
    ceph: P.ceph.map(m),
    abd: { ...P.abd, r: P.abd.r.map(m), at: P.abd.at.map(m) },
    legs: { ...P.legs, y: m(P.legs.y), n: P.legs.n.map(([x, fx, fz, lens, w, up]) => [m(x), m(fx), m(fz), lens.map(m), w.map(m), up]) },
    palp: { ...P.palp, len: P.palp.len.map(m), w: P.palp.w.map(m) },
    gait: { ...P.gait, half: m(P.gait.half), lift: m(P.gait.lift), bob: m(P.gait.bob) },
  };
}

// ---------- One spider ----------
function spiderRig(kind) {
  const P = sized(SPIDER_PRESETS[kind]);
  const K = P.scale;
  const V = viewOf(P.yaw, P.pitch);
  const [RX, RY, RZ] = P.ceph;
  const AB = P.abd;
  const HB = P.hb;
  // The legs: roots in the head-body's frame, the way each points out, its step's phase.
  const legs = [];
  for (const side of [1, -1]) {
    P.legs.n.forEach(([x, fx, fz, lens, w, up], i) => {
      const root = [x, P.legs.y, side * RZ * P.legs.z];
      // (its tip at rest: fanned out ahead or behind, a little out to the side)
      const reach = Math.hypot(fx - x, fz - RZ * P.legs.z);
      const out = [(fx - x) / reach, 0, (side * (fz - RZ * P.legs.z)) / reach];
      // (the 4-4 pattern, with a small ripple from the back legs forward)
      const ph = ((i + (side > 0 ? 0 : 1)) % 2) * 0.5 + (3 - i) * 0.03;
      legs.push({ side, i, root, out, reach, lens, w, ph, up: up * D2R });
    });
  }
  const G = P.gait;
  const cycle = (2 * G.half) / G.duty;
  const speed = cycle * G.cadence;
  // A tip through its step: down (sliding back under the body exactly as far as the body goes),
  // then lifted in an eased arc and set down ahead.
  const stepAt = (u, ph) => {
    const q = frac(u + ph);
    if (q < G.duty) return { dx: G.half - (2 * G.half * q) / G.duty, lift: 0, v: -1 };
    const v = (q - G.duty) / (1 - G.duty);
    return { dx: -G.half + 2 * G.half * smooth(v), lift: G.lift * Math.sin(Math.PI * v) ** 0.8, v };
  };
  // The leg's three bones reaching the tip F (head-body frame), in the upright plane through the
  // root and the tip. A spider holds its thighs up: the thigh rises at its own angle (`up`, radians),
  // lowered only as far as it must be for the shin and the tip to reach F; the shin and the tip then
  // reach F with the ankle bowed outward, so the leg is one high soft arch.
  const legBones = (L, F, up) => {
    const R = L.root;
    const [l1, l2, l3] = L.lens;
    const dx = F[0] - R[0];
    const dz = F[2] - R[2];
    const hd = Math.hypot(dx, dz);
    // (right under its root the plane would be lost: it leans to the leg's own way out)
    const k = clamp(hd / 1.5, 0, 1);
    let ex = mix(L.out[0], hd > 1e-6 ? dx / hd : 0, k);
    let ez = mix(L.out[2], hd > 1e-6 ? dz / hd : 0, k);
    const el = Math.hypot(ex, ez) || 1;
    ex /= el;
    ez /= el;
    const fh = dx * ex + dz * ez;
    const fv = F[1] - R[1];
    const rho = Math.max(1e-3, Math.hypot(fh, fv));
    const phi = Math.atan2(fv, fh);
    // (the highest the thigh may stand with the rest still reaching: |F - knee| = the reach left)
    const reachOf = (D) => phi + Math.acos(clamp((rho * rho + l1 * l1 - D * D) / (2 * l1 * rho), -1, 1));
    const hi = reachOf((l2 + l3) * 0.985);
    const lo = reachOf(Math.abs(l2 - l3) + 0.4);
    // (a soft limit: eases into the highest it may go rather than stopping dead at it)
    const soft = 0.18;
    let a1 = up > hi - soft ? hi - soft * Math.exp(-(up - (hi - soft)) / soft) : up;
    a1 = Math.max(a1, Math.min(lo, hi - 0.05));
    const kn = [Math.cos(a1) * l1, Math.sin(a1) * l1];
    const kx = fh - kn[0];
    const ky = fv - kn[1];
    const dk = clamp(Math.hypot(kx, ky), Math.abs(l2 - l3) + 0.05, l2 + l3 - 0.005);
    const psi = Math.atan2(ky, kx);
    const g = Math.acos(clamp((l2 * l2 + dk * dk - l3 * l3) / (2 * l2 * dk), -1, 1));
    const an = [kn[0] + Math.cos(psi + g) * l2, kn[1] + Math.sin(psi + g) * l2];
    const tq = Math.atan2(fv - an[1], fh - an[0]);
    const tp = [an[0] + Math.cos(tq) * l3, an[1] + Math.sin(tq) * l3];
    const at = ([ph, pv]) => [R[0] + ex * ph, R[1] + pv, R[2] + ez * ph];
    return [R, at(kn), at(an), at(tp)];
  };
  // Sizes, from the rest pose.
  const abdRest = (() => {
    const th = AB.tilt * D2R;
    const c = [AB.at[0] - AB.r[0] * 0.84 * Math.cos(th), AB.at[1] + AB.r[0] * 0.84 * Math.sin(th)];
    return c;
  })();
  const H = HB + Math.max(RY, abdRest[1] + Math.hypot(AB.r[0] * Math.sin(AB.tilt * D2R), AB.r[1] * Math.cos(AB.tilt * D2R)));
  const SPAN = Math.max(...legs.map((L) => Math.abs(L.root[0] + L.out[0] * L.reach))) * 2 + 4;
  const REST_Y = RY + 0.25;

  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const t = a.t + (m.uid % 7) * 1.3;
    const dt = clamp(a.dt ?? 0, 0, 0.05);
    // The step: its phase from the distance walked, and from its own moves along the ground.
    const odo = m.odo ?? 0;
    const dO = odo - (st.spOdo ?? odo);
    st.spOdo = odo;
    const dX = S.x - (st.spX ?? S.x);
    st.spX = S.x;
    const tipDeg = S.tip + 180 * clamp(S.flip, -0.2, 1.2);
    // (in the air, hanging head-down, or on its back: no tip is on the ground)
    const air = Math.max(smooth((S.hop - 0.6) / (HB * 0.7)), smooth((Math.abs(tipDeg) - 35) / 30));
    const went = (Math.abs(dO) < 40 ? dO : 0) + dX * (1 - air);
    st.spU = frac((st.spU ?? 0) + went / cycle);
    const u = st.spU;
    const pace = dt > 0 ? Math.abs(went) / dt : 0;
    st.spPace = (st.spPace ?? 0) + (pace - (st.spPace ?? 0)) * Math.min(1, dt * 9);
    st.spW = (st.spW ?? 0) + (clamp(st.spPace / (speed * 0.3), 0, 1) - (st.spW ?? 0)) * Math.min(1, dt * 10);
    const w = st.spW;
    // The body: its height (crouched down to the ground, lifted, hopping), a light bob as each set of
    // four takes the weight and a small roll; never into the ground, however it turns.
    const bob = w * G.bob * Math.cos(2 * TAU * u);
    const roll = w * G.roll * Math.sin(TAU * u);
    // The soft body (volume kept: parts only turn and shift about their roots, nothing is scaled).
    // The abdomen hangs on its waist on damped springs: it turns (th, degrees) and slides a little
    // fore and aft (sx, px), lagging the body, jolted by each footfall, thrown by hops, landings, hits
    // and sudden stops, then wobbling once or twice and settling; its tip lags its middle a little
    // more, so it bends rather than swinging stiffly. The whole body rocks a little with it (a heavy
    // spider most).
    const SB = P.soft;
    const ab = (st.spAb ??= { th: 0, w: 0, sx: 0, sv: 0, bt: 0, bw: 0, y: null, vy: 0, ay: 0, vx: 0, ax: 0, u: null, hit: a.mo.hitT });
    let by = mix(HB, REST_Y, clamp(S.crouch, -0.3, 1.1)) + S.lift * K + bob + S.hop;
    if (dt > 0) {
      const vx = went / dt;
      if (ab.y !== null) {
        const vy = (by - ab.y) / dt;
        const f = Math.min(1, dt * 20);
        ab.ay += (clamp((vy - ab.vy) / dt, -3000, 3000) - ab.ay) * f;
        ab.ax += (clamp((vx - ab.vx) / dt, -2500, 2500) - ab.ax) * f;
        ab.vy = vy;
      }
      ab.vx = vx;
      ab.y = by;
      // (a footfall: either set of four coming down)
      if (ab.u !== null && w > 0.05) {
        for (const ph of [0, 0.5]) {
          const q0 = frac(ab.u + ph);
          const q1 = frac(u + ph);
          if (Math.abs(went) < cycle * 0.5 && ((went > 0 && q1 < q0) || (went < 0 && q1 > q0))) {
            ab.w -= SB.foot * w;
            ab.bw -= SB.foot * 0.25 * w;
          }
        }
      }
      ab.u = u;
      // (a hit lands)
      if (a.mo.hitT !== ab.hit) {
        ab.hit = a.mo.hitT;
        if (m.hp > 0) {
          ab.w -= 90;
          ab.sv -= 14 * K;
          ab.bw += 30;
        }
      }
      const n = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / n;
      for (let k = 0; k < n; k++) {
        ab.w += (-SB.k * ab.th - SB.c * ab.w - SB.gain * ab.ay + 0.12 * ab.ax) * h;
        ab.th += ab.w * h;
        ab.sv += (-SB.k * 1.3 * ab.sx - SB.c * 1.2 * ab.sv - 0.0016 * K * ab.ax) * h;
        ab.sx += ab.sv * h;
        ab.bw += (-SB.k * 1.6 * ab.bt - SB.c * 1.3 * ab.bw - SB.gain * 0.25 * ab.ay - 0.03 * ab.ax) * h;
        ab.bt += ab.bw * h;
      }
      ab.th = clamp(ab.th, -16, 16);
      ab.sx = clamp(ab.sx, -0.9 * K, 0.9 * K);
      ab.bt = clamp(ab.bt, -6, 6);
      if (![ab.th, ab.w, ab.sx, ab.sv, ab.bt, ab.bw].every(Number.isFinite)) Object.assign(ab, { th: 0, w: 0, sx: 0, sv: 0, bt: 0, bw: 0 });
    }
    const wob = ab.bt * SB.body * D2R;
    const tip = (tipDeg + roll) * D2R + wob;
    const thA = (AB.tilt + S.abd + ab.th - ab.bt * SB.body) * D2R;
    // (the shape turns a little further than its middle swings: a soft bend at the waist)
    const thS = thA + ab.th * 0.35 * D2R;
    const abC = [AB.at[0] - AB.r[0] * 0.84 * Math.cos(thA) + ab.sx, AB.at[1] + AB.r[0] * 0.84 * Math.sin(thA), 0];
    const cephLow = Math.hypot(RX * Math.sin(tip), RY * Math.cos(tip));
    const abW = spinZ(abC, tip);
    const abLow = -abW[1] + Math.hypot(AB.r[0] * Math.sin(tip - thS), AB.r[1] * Math.cos(tip - thS));
    by = Math.max(by, Math.max(cephLow, abLow) + 0.2);
    const pos = [S.x, by, 0];
    const world = (p) => add3(pos, spinZ(p, tip));
    const toLocal = (p) => spinZ(sub3(p, pos), -tip);
    const scr = (p) => V.pt(world(p));
    // The legs: each tip where the step, the pose and the move put it.
    const tuck = clamp(S.tuck, 0, 1.1);
    const fold = clamp(S.fold, 0, 1);
    const splay = clamp(S.splay, 0, 1);
    const reachK = clamp(S.reach, 0, 1.2);
    const fl = clamp(S.fl + P.front, 0, 1.25);
    const groom = clamp(S.groom, 0, 1);
    const onBack = smooth(clamp(S.flip, 0, 1) * 2 - 1);
    const taps = a.spTap ?? [];
    const LEG = [];
    for (const L of legs) {
      const g = stepAt(u, L.ph);
      const k = L.reach * (1 + 0.14 * splay - 0.42 * fold);
      // (standing about, a leg now and then lifts, shifts a touch ahead and sets down again)
      const tap = taps[L.i + (L.side > 0 ? 0 : 4)] ?? 0;
      const Fw = [S.x + L.root[0] + L.out[0] * k + g.dx * w + tap * 0.45 * K, g.lift * w + tap * 1.3 * K, L.root[2] + L.out[2] * k];
      let F = toLocal(Fw);
      // (in the air: hanging relaxed, spread a little)
      // (hanging: drooping the way the ground is, whichever way the body is turned)
      const Fa = add3(L.root, add3(mul3(L.out, L.reach * (0.82 + 0.22 * splay)), add3([0, -HB * 0.15, 0], spinZ([0, -HB * 0.22, 0], -tip))));
      F = mix3(F, Fa, air);
      // (tucked in close; on its back, wiggling)
      const wig = onBack * Math.sin(t * 9 + L.i * 1.7 + (L.side > 0 ? 0 : 2.2));
      const Ft = add3(L.root, add3(mul3(L.out, L.reach * 0.4), [wig * 0.5 * K, (-1.3 + Math.cos(t * 9 + L.i * 1.7) * onBack * 0.45) * K, 0]));
      F = mix3(F, Ft, tuck);
      // (the thigh's angle: its own, a little higher as the tip swings, folded up, tucked; lower
      // spread out or hanging in the air)
      // (the thigh's angle: its own; the knee lifting as the tip swings (and as it taps), dipping as
      // the weight comes onto a leg just set down, breathing a little standing about; higher folded
      // up or tucked, lower spread out or hanging in the air)
      const q = frac(u + L.ph);
      const swing = g.v >= 0 ? Math.sin(Math.PI * g.v) * w : 0;
      const press = g.v < 0 ? swell(q, 0, G.duty * 0.5) * w : 0;
      let up = L.up + 0.24 * swing + 0.2 * tap - 0.1 * press + 0.035 * Math.sin(t * 1.3 + L.i * 1.9 + L.side) * (1 - w) + 0.26 * fold - 0.14 * splay - 0.1 * air + 0.3 * Math.min(1, tuck);
      let curl = swing + 0.8 * tap + 0.5 * Math.min(1, tuck);
      if (L.i === 0) {
        // the front legs: raised (waving, one side then the other), reaching ahead, grooming
        const wv = S.fw * Math.sin(t * 6.5 + (L.side > 0 ? 0 : Math.PI));
        const Fr = add3(L.root, [L.reach * 0.62 + wv * 0.8 * K, HB * 0.55 + (wv * 1.5 + Math.cos(t * 6.5) * S.fw * 0.3) * K, L.side * L.reach * 0.2]);
        F = mix3(F, Fr, clamp(fl, 0, 1));
        up = mix(up, 82 * D2R, clamp(fl, 0, 1));
        const Fre = add3(L.root, [L.reach * 1.05, -HB * 0.3, L.side * L.reach * 0.28]);
        F = mix3(F, Fre, Math.min(1, reachK));
        up = mix(up, 30 * D2R, Math.min(1, reachK));
        const gw = groom * (L.side > 0 ? 1 : 0.85);
        const gq = t * 8 + (L.side > 0 ? 0 : 2.4);
        const Fg = [RX * 1.02 + Math.cos(gq) * 0.7 * K, -RY * 0.2 + Math.sin(gq) * 0.8 * K, L.side * RZ * 0.3];
        F = mix3(F, Fg, gw);
        up = mix(up, 76 * D2R, gw);
      } else if (L.i === 1) {
        const Fr = add3(L.root, [L.reach * 0.5, HB * 0.15, L.side * L.reach * 0.5]);
        F = mix3(F, Fr, clamp(fl, 0, 1) * 0.3);
        const Fre = add3(L.root, [L.reach * 0.9, -HB * 0.35, L.side * L.reach * 0.45]);
        F = mix3(F, Fre, Math.min(1, reachK) * 0.6);
      }
      // (the knee and the tip on their own damped springs: they lag the foot a little, and overshoot
      // and settle after a fast move)
      const sl = ((st.spLeg ??= {})[`${L.side}${L.i}`] ??= { up, uv: 0, cu: curl, cv: 0 });
      if (dt > 0) {
        const n = Math.max(1, Math.ceil(dt / (1 / 240)));
        for (let j = 0; j < n; j++) {
          sl.uv += (-340 * (sl.up - up) - 21 * sl.uv) * (dt / n);
          sl.up += sl.uv * (dt / n);
          sl.cv += (-260 * (sl.cu - curl) - 18 * sl.cv) * (dt / n);
          sl.cu += sl.cv * (dt / n);
        }
        if (!Number.isFinite(sl.up + sl.cu)) Object.assign(sl, { up, uv: 0, cu: curl, cv: 0 });
      } else Object.assign(sl, { up, cu: curl });
      // (a lifted tip curls in a little; on the ground it is exactly where it was set down)
      const offGround = smooth(Math.max((g.lift * w + tap * 1.3 * K) / (G.lift * 0.35), air, Math.min(1, tuck)));
      const cu = clamp(sl.cu, -0.3, 1.4) * offGround;
      F = add3(F, [-L.out[0] * L.lens[2] * 0.4 * cu, L.lens[2] * 0.3 * cu, -L.out[2] * L.lens[2] * 0.4 * cu]);
      const bones = legBones(L, F, sl.up);
      LEG.push({ L, pts: bones.map(scr), depth: V.depth(world(bones[1])), root: scr(L.root), foot: world(bones[3]), len: L.lens[0] + L.lens[1] });
    }
    const legsOf = (side) => LEG.filter((g) => g.L.side === side).sort((p, q) => p.depth - q.depth);
    // The palps: two short bones down in front of the face, raised as it rears, rubbing as it grooms.
    const PA = P.palp;
    const PALP = [];
    for (const side of [1, -1]) {
      const r = [RX * PA.at[0], RY * PA.at[1], side * RZ * PA.at[2]];
      const rub = groom * Math.sin(t * 8 + (side > 0 ? 1.2 : 3.6));
      const a1 = (-38 + clamp(S.palp, -1, 1.2) * 46 + rub * 20) * D2R;
      const a2 = a1 - (26 - clamp(S.palp, -1, 1.2) * 8 + rub * 10) * D2R;
      const p1 = add3(r, [Math.cos(a1) * PA.len[0], Math.sin(a1) * PA.len[0], 0]);
      const p2 = add3(p1, [Math.cos(a2) * PA.len[1], Math.sin(a2) * PA.len[1], 0]);
      PALP.push({ side, pts: [r, p1, p2].map(scr) });
    }
    // The body's two round parts, seen.
    const cephO = [0, 0, 0];
    const ceph = ellipsoidOutline(V, world(cephO), [RX, RY, RZ], tip);
    const abd = ellipsoidOutline(V, world(abC), AB.r, tip - thS);
    const spinLocal = add3(abC, spinZ([-AB.r[0] * 0.93, -AB.r[1] * 0.16, 0], -thS));
    const nub = ellipsoidOutline(V, world(spinLocal), [1.4 * K, 1.2 * K, 1.3 * K], tip - thS, 20);
    const spinTip = add3(abC, spinZ([-AB.r[0] * 1.04, -AB.r[1] * 0.2, 0], -thS));
    // Guides on the head-body: the eye line across its front, the middle line along the top (only
    // where they face us).
    const surf = (lat, lon) => {
      const q = [RX * Math.cos(lat) * Math.cos(lon), RY * Math.sin(lat), RZ * Math.cos(lat) * Math.sin(lon)];
      const nrm = spinZ([q[0] / (RX * RX), q[1] / (RY * RY), q[2] / (RZ * RZ)], tip);
      return { p: scr(q), vis: V.dot(V.RD, nrm) / Math.hypot(...nrm) };
    };
    const eyeLine = [];
    for (let k = 0; k <= 24; k++) eyeLine.push(surf(20 * D2R, mix(-40, 85, k / 24) * D2R));
    const midLine = [];
    for (let k = 0; k <= 16; k++) midLine.push(surf(mix(64, 150, k / 16) * D2R, 0));
    // (where things happen, for the effects)
    const fronts = LEG.filter((g) => g.L.i === 0).map((g) => V.pt(g.foot));
    return {
      pos, tip, by,
      ceph, abd, nub,
      cephLit: scr([RX * 0.15, RY * 0.6, RZ * 0.45]), cephShade: scr([-RX * 0.5, -RY * 0.7, RZ * 0.2]),
      abdLit: scr(add3(abC, spinZ([AB.r[0] * 0.1, AB.r[1] * 0.62, 0], -thS))), abdShade: scr(add3(abC, spinZ([-AB.r[0] * 0.3, -AB.r[1] * 0.8, 0], -thS))),
      eyeLine, midLine,
      far: legsOf(-1), near: legsOf(1), palpFar: PALP[1], palpNear: PALP[0],
      palpUp: smooth((clamp(S.palp, 0, 1) + groom) * 1.4),
      raise: smooth(Math.max(clamp(fl, 0, 1) - P.front, groom, Math.min(1, reachK)) * 1.6),
      spots: {
        head: scr([RX * 1.02, -RY * 0.1, 0]),
        front: [(fronts[0][0] + fronts[1][0]) / 2, Math.max(fronts[0][1], fronts[1][1])],
        feet: [S.x, 0],
        body: [S.x, -RY],
        spin: scr(spinTip),
        web: [RX + H * 2.3, -H * 0.42],
      },
    };
  }

  // ---------- Drawing ----------
  const toneRgb = (a, col) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 7));
    return rgbOf(col).map((v) => Math.round(v + (255 - v) * k));
  };
  const tone = (a, col, al = 1) => {
    const [r, g, b] = toneRgb(a, col);
    return al >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${al})`;
  };
  // (a colour fading out round a point: where a near limb grows out of the body)
  const fade = (ctx, a, col, at, r0, r1, al = 1) => {
    const [r, g, b] = toneRgb(a, col);
    const gr = ctx.createRadialGradient(at[0], at[1], r0, at[0], at[1], r1);
    gr.addColorStop(0, `rgba(${r},${g},${b},0)`);
    gr.addColorStop(1, `rgba(${r},${g},${b},${al})`);
    return gr;
  };
  // (a soft light or shade round a point)
  const glow = (ctx, a, at, r, col, k) => {
    const [cr, cg, cb] = toneRgb(a, col);
    const gr = ctx.createRadialGradient(at[0], at[1], 0, at[0], at[1], r);
    gr.addColorStop(0, `rgba(${cr},${cg},${cb},${k})`);
    gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(at[0] - r, at[1] - r, r * 2, r * 2);
  };
  const ink = (ctx) => {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const legPolys = (g) => {
    const [R, K, A, T] = g.pts;
    const [w0, w1, w2, w3] = g.L.w;
    return [pill(R, w0 / 2, K, w1 / 2), pill(K, w1 / 2, A, w2 / 2), pill(A, w2 / 2, T, w3 / 2), disc(K, w1 * 0.53)];
  };
  const palpPolys = (pp) => {
    const [r, p1, p2] = pp.pts;
    const [w0, w1, w2] = P.palp.w;
    return [pill(r, w0 / 2, p1, w1 / 2), pill(p1, w1 / 2, p2, w2 / 2)];
  };
  // A limb's fill: where it crosses limbs already drawn, the soft shade it casts on them (`shadeOn`);
  // where it crosses them or the body (`seamOn`), a faint seam just outside its edge (drawn before
  // its fill, so only the outer half shows; never a full line); its own colour, with a soft rim of
  // shade along its lower edge. A near limb fades into the body over its root, so no root ever shows.
  function limbFill(ctx, a, polys, shadeOn, seamOn, col, shade, root, r0 = 0, r1 = 0) {
    const paint = (c, al = 1) => (root ? fade(ctx, a, c, root, r0, r1, al) : tone(a, c, al));
    if (shadeOn.length) {
      ctx.save();
      trace(ctx, shadeOn);
      ctx.clip('nonzero');
      ctx.translate(0.4, 0.7);
      trace(ctx, polys);
      ctx.fillStyle = paint(shade, 0.45);
      ctx.fill('nonzero');
      ctx.restore();
    }
    if (seamOn.length) {
      ctx.save();
      trace(ctx, seamOn);
      ctx.clip('nonzero');
      trace(ctx, polys);
      ctx.strokeStyle = root ? fade(ctx, a, C.deep, root, r1, r1 + (r1 - r0) * 1.4, 0.85) : tone(a, C.deep, 0.85);
      ctx.lineWidth = 1.3;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
    trace(ctx, polys);
    ctx.fillStyle = paint(shade);
    ctx.fill('nonzero');
    ctx.save();
    trace(ctx, polys);
    ctx.clip('nonzero');
    ctx.translate(-0.3, -0.75);
    trace(ctx, polys);
    ctx.fillStyle = paint(col);
    ctx.fill('nonzero');
    ctx.restore();
  }
  // (keeps drawing outside the head-body)
  const outsideCeph = (ctx, sk) => {
    ctx.beginPath();
    ctx.rect(-1e4, -1e4, 2e4, 2e4);
    sk.ceph.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.clip('evenodd');
  };
  // The legs. The far side's behind the body, a shade darker. The near side's in front: they come
  // out from under the head-body (its round side bulges over their roots, so no root ever shows) and
  // pass in front of the abdomen; a front leg raised in front of the face (rearing, grooming,
  // reaching) comes round in front of the head-body too, fading in over its root as it rises.
  function drawLegs(ctx, a, mode, near) {
    const sk = a.sp;
    const list = near ? sk.near : sk.far;
    if (mode === 'line') {
      trace(ctx, list.flatMap(legPolys));
      return ink(ctx);
    }
    const done = [];
    for (const g of list) {
      const polys = legPolys(g);
      if (near) {
        ctx.save();
        outsideCeph(ctx, sk);
        limbFill(ctx, a, polys, done, [sk.abd, sk.nub, ...done], C.base, C.sh, null, 0);
        ctx.restore();
        // (raised in front of the face, it is drawn whole and solid over the head-body with its own
        // outline, like any near limb crossing the body; only its root, under the body, stays hidden)
        if (g.L.i === 0 && sk.raise > 0.35) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(-1e4, -1e4, 2e4, 2e4);
          disc(g.root, g.L.w[0] * 0.95, 20).forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath();
          ctx.clip('evenodd');
          trace(ctx, polys);
          ink(ctx);
          limbFill(ctx, a, polys, [], [], C.base, C.sh, null);
          ctx.restore();
        }
        // (over the head-body's edge where it comes out: its own colour, so not even a hairline shows)
        ctx.save();
        trace(ctx, polys);
        ctx.clip('nonzero');
        trace(ctx, [sk.ceph]);
        ctx.strokeStyle = tone(a, C.base);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      } else limbFill(ctx, a, polys, done, done, C.sh, C.deep, null, 0);
      done.push(...polys);
    }
  }
  function drawPalp(ctx, a, mode, near) {
    const sk = a.sp;
    const pp = near ? sk.palpNear : sk.palpFar;
    const polys = palpPolys(pp);
    if (mode === 'line') {
      trace(ctx, polys);
      return ink(ctx);
    }
    if (!near) return limbFill(ctx, a, polys, [], [], C.sh, C.deep, null, 0);
    // (like a near leg: from under the face, round in front of it as it rises)
    ctx.save();
    outsideCeph(ctx, sk);
    limbFill(ctx, a, polys, [], [], C.base, C.sh, null, 0);
    ctx.restore();
    if (sk.palpUp > 0.01) {
      const r0 = mix((P.palp.len[0] + P.palp.len[1]) * 1.2, P.palp.w[0] * 0.15, sk.palpUp);
      limbFill(ctx, a, polys, [], [sk.ceph], C.base, C.sh, pp.pts[0], r0, r0 + P.palp.w[0] * 0.6);
    }
  }
  // A round body part: its own colour, a soft rim of shade along the bottom, lit on top, shaded
  // low at the back.
  function roundFill(ctx, a, polys, lit, shadeAt, r) {
    trace(ctx, polys);
    ctx.fillStyle = tone(a, C.sh);
    ctx.fill('nonzero');
    ctx.save();
    trace(ctx, polys);
    ctx.clip('nonzero');
    ctx.save();
    ctx.translate(-0.35, -0.9);
    trace(ctx, polys);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill('nonzero');
    ctx.restore();
    glow(ctx, a, shadeAt, r * 0.9, C.sh, 0.5);
    glow(ctx, a, lit, r * 0.95, C.lt, 0.95);
    ctx.restore();
  }
  function drawAbdomen(ctx, a, mode) {
    const sk = a.sp;
    trace(ctx, [sk.abd, sk.nub]);
    if (mode === 'line') return ink(ctx);
    roundFill(ctx, a, [sk.abd, sk.nub], sk.abdLit, sk.abdShade, Math.max(...AB.r));
  }
  function drawCeph(ctx, a, mode) {
    const sk = a.sp;
    trace(ctx, [sk.ceph]);
    if (mode === 'line') return ink(ctx);
    // (a soft seam and shade where the head-body sits in front of the abdomen)
    ctx.save();
    trace(ctx, [sk.abd, sk.nub]);
    ctx.clip('nonzero');
    ctx.save();
    ctx.translate(-0.6, 0.5);
    trace(ctx, [sk.ceph]);
    ctx.fillStyle = tone(a, C.sh, 0.55);
    ctx.fill();
    ctx.restore();
    trace(ctx, [sk.ceph]);
    ctx.strokeStyle = tone(a, C.deep, 0.8);
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.restore();
    roundFill(ctx, a, [sk.ceph], sk.cephLit, sk.cephShade, Math.max(RX, RY));
    // the guides
    ctx.save();
    trace(ctx, [sk.ceph]);
    ctx.clip();
    ctx.strokeStyle = tone(a, C.guide);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const line = (pts, wdt, al) => {
      ctx.lineWidth = wdt;
      for (let k = 1; k < pts.length; k++) {
        const v = Math.min(pts[k - 1].vis, pts[k].vis);
        if (v <= 0.04) continue;
        ctx.globalAlpha = al * smooth((v - 0.04) / 0.2);
        ctx.beginPath();
        ctx.moveTo(...pts[k - 1].p);
        ctx.lineTo(...pts[k].p);
        ctx.stroke();
      }
    };
    const al0 = ctx.globalAlpha;
    line(sk.eyeLine, 0.6, al0);
    line(sk.midLine, 0.5, al0 * 0.75);
    ctx.restore();
  }

  // ---------- Effects: sparkles on a hit, silk, dust, speed lines ----------
  const twinkle = (ctx, x, y, r, rot, col) => {
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const q = rot + (i * Math.PI) / 2;
      const q2 = q + Math.PI / 4;
      const qn = q + Math.PI / 2;
      if (!i) ctx.moveTo(x + Math.cos(q) * r, y + Math.sin(q) * r);
      ctx.quadraticCurveTo(x + Math.cos(q2) * r * 0.14, y + Math.sin(q2) * r * 0.14, x + Math.cos(qn) * r, y + Math.sin(qn) * r);
    }
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  };
  const puff = (ctx, x, y, r, al) => {
    ctx.globalAlpha = al;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = '#f4f0fa';
    ctx.fill();
    ctx.strokeStyle = '#d8cee8';
    ctx.lineWidth = Math.max(0.4, r * 0.14);
    ctx.stroke();
  };
  // A silk strand: soft white with a faint lilac edge, so it reads on any ground.
  const silk = (ctx, draw, al) => {
    ctx.globalAlpha = al;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(176,164,206,0.75)';
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    draw();
    ctx.stroke();
    ctx.strokeStyle = '#fdfcff';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    draw();
    ctx.stroke();
  };
  const bez = (p0, c, p1, k) => [mix(mix(p0[0], c[0], k), mix(c[0], p1[0], k), k), mix(mix(p0[1], c[1], k), mix(c[1], p1[1], k), k)];
  function drawFx(ctx, m, a) {
    const sk = a.sp;
    const st = a.mo.rig;
    const mv = a.spMove?.mv;
    const t = a.spMove?.t ?? 0;
    ctx.save();
    // the thread it hangs on (its top far above, following the body with a little lag)
    const sl = clamp(a.spSilk ?? 0, 0, 1);
    const sp0 = sk.spots.spin;
    if (sl > 0.02) {
      st.spAnchor = st.spAnchor == null ? sp0[0] : st.spAnchor + (sp0[0] - st.spAnchor) * Math.min(1, (a.dt ?? 0) * 3);
      const top = [st.spAnchor, -H * 4.6];
      const end = [mix(sp0[0], top[0], sl), mix(sp0[1], top[1], sl)];
      silk(ctx, () => {
        ctx.moveTo(...sp0);
        ctx.lineTo(...end);
      }, Math.min(1, sl * 2.5));
    } else st.spAnchor = null;
    if (mv) {
      // the web shot: a strand in an arc over its back to the target, a soft round splat there
      if (mv.web) {
        const [w0, w1, w2] = mv.web;
        if (t >= w0 && t <= w2) {
          const T = sk.spots.web;
          const c = [(sp0[0] + T[0]) / 2, Math.min(sp0[1], T[1]) - H * 1.15];
          const p = smooth((t - w0) / (w1 - w0));
          const gone = smooth((t - w1) / (w2 - w1));
          const sag = [c[0], c[1] + gone * H * 0.9];
          const n = 22;
          silk(ctx, () => {
            for (let k = 0; k <= n; k++) {
              const q = bez(sp0, sag, T, (k / n) * p);
              if (k) ctx.lineTo(...q);
              else ctx.moveTo(...q);
            }
          }, 1 - gone);
          const head = bez(sp0, sag, T, p);
          if (t < w1) {
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(head[0], head[1], 1.3, 0, TAU);
            ctx.fillStyle = '#fdfcff';
            ctx.fill();
            ctx.strokeStyle = 'rgba(176,164,206,0.8)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          } else {
            // (the splat: a soft little web, five round lobes, spreading and fading)
            const k = smooth((t - w1) / 0.2);
            ctx.globalAlpha = 0.9 * (1 - gone);
            ctx.fillStyle = '#fbf9ff';
            ctx.strokeStyle = 'rgba(176,164,206,0.8)';
            ctx.lineWidth = 0.5;
            for (let j = 0; j < 5; j++) {
              const q = (j / 5) * TAU + 0.3;
              ctx.beginPath();
              ctx.arc(T[0] + Math.cos(q) * 2.2 * k, T[1] + Math.sin(q) * 2.2 * k, 1.5 * k, 0, TAU);
              ctx.fill();
              ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(T[0], T[1], 2.2 * k, 0, TAU);
            ctx.fill();
          }
        }
      }
      // sparkles where it lands a blow
      for (const s0 of mv.spark ?? []) {
        const k = since(s0, t, 0.24);
        if (k < 0) continue;
        const [x, y] = sk.spots[mv.sparkAt] ?? sk.spots.head;
        const e = 1 - (1 - k) ** 3;
        ctx.globalAlpha = 1 - k;
        twinkle(ctx, x, y, H * 0.3 * (0.5 + 0.6 * e), k * 0.7, '#ffffff');
        twinkle(ctx, x, y, H * 0.15 * (0.5 + 0.6 * e), k * 0.7 + 0.5, '#fff2a8');
        for (let j = 0; j < 4; j++) {
          const q = (j * TAU) / 4 + 0.4;
          twinkle(ctx, x + Math.cos(q) * H * 0.36 * e, y + Math.sin(q) * H * 0.36 * e, H * 0.08, q, j % 2 ? '#ffc8de' : '#fff6c8');
        }
      }
      // dust where it lands or pushes off
      for (const [d0, where] of mv.dust ?? []) {
        const k = since(d0, t, 0.42);
        if (k < 0) continue;
        const gx = sk.spots[where][0];
        const e = 1 - (1 - k) ** 2;
        for (let j = 0; j < 4; j++) {
          const dir = j < 2 ? -1 : 1;
          puff(ctx, gx + dir * (4 + (j % 2) * 4) * (0.5 + e), -1 - (j % 2) - e * 2.4, (1.4 + (j % 2) * 0.6) * (0.6 + 0.6 * e), (1 - k) * 0.85);
        }
      }
      // speed lines on a dash
      if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
        const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
        ctx.globalAlpha = 0.7 * (1 - k);
        ctx.strokeStyle = '#ffffff';
        ctx.lineCap = 'round';
        ctx.lineWidth = 0.9;
        for (let j = 0; j < 3; j++) {
          const y = -sk.by + (j - 1) * 3.4;
          ctx.beginPath();
          ctx.moveTo(sk.pos[0] - RX - AB.r[0] * 2 - 3 - 5 * k, y);
          ctx.lineTo(sk.pos[0] - RX - AB.r[0] * 2 - 12 - 9 * k, y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    if (m.act && SPIDER_MOVES[m.act.name]) {
      const mv = SPIDER_MOVES[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + endOf(mv)) return [mv, T - mv.anticT];
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.spAtk) {
        const pool = m.def.moves ?? P.moves;
        st.spN = (st.spN ?? m.uid) + 1;
        st.spPick = m.move ?? pool[st.spN % pool.length];
      }
      st.spAtk = true;
      const mv = SPIDER_MOVES[st.spPick];
      if (mv) return [mv, a.ph.since >= 0 ? a.ph.since : -(1 - a.ph.antic) * mv.anticT];
    } else st.spAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < endOf(SPIDER_MOVES.hurt)) return [SPIDER_MOVES.hurt, a.hurtAgo];
    const happy = SPIDER_MOVES.dance;
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < happy.anticT + endOf(happy)) return [happy, gl - happy.anticT];
    // (a happy beat in a cutscene: dancing on a loop)
    if (m.hp > 0 && m.cine?.mood === 'happy') {
      const len = happy.anticT + endOf(happy) + 0.4;
      return [happy, (a.now % len) - happy.anticT];
    }
    return [null, 0];
  }
  const seq = [
    ['legsFar', (ctx, a, mode) => drawLegs(ctx, a, mode, false)],
    ['palpFar', (ctx, a, mode) => drawPalp(ctx, a, mode, false)],
    ['abdomen', drawAbdomen],
    ['ceph', drawCeph],
    ['legsNear', (ctx, a, mode) => drawLegs(ctx, a, mode, true)],
    ['palpNear', (ctx, a, mode) => drawPalp(ctx, a, mode, true)],
  ];
  const parts = [
    ...seq.map(([name, draw]) => ({ name, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a) => draw(ctx, a, 'line') })),
    ...seq.map(([name, draw]) => ({ name: `${name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a) => draw(ctx, a, 'fill') })),
  ];
  const RW = Math.ceil(SPAN * 1.6 + 20);
  const RH = Math.ceil(H * 2.4 + 10);
  const rig = makeRig({
    w: RW,
    h: RH,
    soft: true,
    stride: cycle,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, c === 'silk' ? [500, 40] : c === 'palp' || c === 'groom' ? [150, 19] : c === 'tip' || c === 'flip' ? [190, 23] : [170, 21]])),
    walkStiff: { lift: [500, 44], tip: [300, 32] },
    fast: CH.filter((c) => !['palp', 'groom', 'fw'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.spActive),
    kick: { tip: 90, abd: -120, palp: 6 },
    turnKick: { tip: 50, lift: -14 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.3;
      const rnd = (n) => {
        const q = Math.sin(n * 12.9898 + (m.uid % 97) * 78.233) * 43758.5453;
        return q - Math.floor(q);
      };
      // Standing about: the abdomen breathing; a glance now and then (held, then turning); the legs
      // shifting, tapping one after another; grooming its face with its front legs and palps; (a
      // jumper) a little hop.
      const calm = (1 - a.walkW) * (a.calm ?? 1);
      const breath = Math.sin(t * 1.3);
      const blk = Math.floor(t / 4.3);
      const look = mix(rnd(blk - 1), rnd(blk), smooth(((t / 4.3) % 1) / 0.18)) * 2 - 1;
      const tt = t % 7.7;
      const order = [3, 7, 2, 6, 1, 5, 0, 4];
      const tap = new Array(8).fill(0);
      order.forEach((li, k) => {
        tap[li] = hold(tt, 3 + k * 0.16, 3.09 + k * 0.16, 3.14 + k * 0.16, 3.28 + k * 0.16) * calm;
      });
      a.spTap = tap;
      const gr = hold(t % 12.1, 6.5, 6.9, 8.7, 9.1) * calm;
      const ht = t % 9.3;
      const hopNow = P.hop ? calm : 0;
      const idle = {
        x: 0, hop: swell(ht, 4.25, 4.6) * H * 0.16 * hopNow, lift: breath * 0.12, crouch: 0.04 + hold(ht, 3.95, 4.15, 4.2, 4.3) * 0.35 * hopNow + swell(ht, 4.58, 4.85) * 0.25 * hopNow,
        tip: look * 3 * (1 - gr) + gr * -4, flip: 0, abd: breath * 1.6, fl: 0, fw: 0, reach: 0, fold: 0, tuck: swell(ht, 4.25, 4.6) * 0.25 * hopNow, splay: 0,
        palp: 0.1 + look * 0.15 + gr * 0.5, groom: gr, silk: 0,
      };
      const walk = { ...idle, hop: 0, lift: 0, crouch: 0.02, tip: -1.5, abd: 2, palp: 0.2, groom: 0, tuck: 0 };
      const [mv, mt] = moveNow(m, a, st);
      const base = {};
      for (const c of CH) base[c] = mix(idle[c], walk[c], a.walkW);
      const out = mv ? poseAt(mv, mt, base, H) : { ...base };
      // Poses, asleep (a nap), beaten, a mood in a cutscene.
      const nap = m.habit?.kind === 'nap' && a.now < (m.habit.until ?? 0) && m.hp > 0;
      const pose = nap ? 'sleep' : m.pose;
      const slow = Math.sin(t * 0.8);
      if (pose === 'rest') Object.assign(out, { crouch: 0.92, fold: 1, palp: -0.3, abd: -3 + breath * 1.2, lift: breath * 0.1, groom: 0, fl: 0 });
      else if (pose === 'curl') Object.assign(out, { crouch: 1, tuck: 0.85, fold: 0.6, palp: -0.7, abd: -5, tip: -3, groom: 0, fl: 0 });
      else if (pose === 'sleep') Object.assign(out, { crouch: 1, fold: 1, tuck: 0.35, palp: -0.8, abd: -5 + slow * 2, tip: -4, lift: slow * 0.18, groom: 0, fl: 0, hop: 0 });
      if (m.hp <= 0) Object.assign(out, { crouch: 1, tuck: 0.7, fold: 0.6, tip: -5, palp: -1, abd: -6, fl: 0, fw: 0, flip: 0, hop: 0, groom: 0, reach: 0, silk: 0 });
      else if (!mv && m.cine?.mood === 'sad') Object.assign(out, { crouch: 0.55, palp: -0.8, tip: -6, abd: -6, fl: 0, groom: 0 });
      else if (!mv && m.cine?.mood === 'angry') Object.assign(out, { tip: 14, lift: 1.2, fl: 0.9, fw: 0.6, palp: 0.9, abd: -8, groom: 0 });
      st.spActive = Boolean(mv);
      a.spMove = mv ? { mv, t: mt } : null;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.sp = skeleton(S, a, m);
      a.spSilk = S.silk;
    },
    parts,
    fx: (ctx, m, a) => drawFx(ctx, m, a),
  });
  // (a still for the Monster Book: the abdomen and the head-body, plain)
  const still = () => {
    const cx = RW / 2;
    const gy = RH - HB;
    return { w: RW, h: RH, res: 3, shapes: [E(cx + abdRest[0], gy - abdRest[1], AB.r[0], AB.r[1], C.base), E(cx, gy, RX, RY, C.base)] };
  };
  return { rig, still, stride: cycle, speed, H, w: Math.round(SPAN * 0.8), h: Math.round(H * 1.1), moves: P.moves };
}

export const SPIDER_ARTS = {};
export const SPIDER_DEFS = {};
for (const kind of SPIDER_KINDS) {
  const r = spiderRig(kind);
  SPIDER_ARTS[`blank_${kind}`] = { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig };
  SPIDER_DEFS[kind] = { id: `blank_${kind}`, name: `Blank ${kind}`, art: `blank_${kind}`, w: r.w, h: r.h, speed: r.speed, hp: 100, fight: { windup: 0.5 }, bodyH: r.H, beast: true, moves: r.moves };
}
