// The scorptaur base (2026-11-25): a blank scorpion-person, the myth's scorpion folk, made for it
// from the start; nothing is carried over from another base, only the engine is shared (rig.js's
// springs). A plain lilac mannequin to design scorpion-folk monsters on: a bald mannequin head with
// soft construction guides only (no eyes, no mouth), no clothes, no markings. Drawn live like the
// other blank bases: smooth shapes over its bones, outlined only on the outer edge (an outline pass,
// then a fill pass), in the bases' soft plum ink, never near-black.
//
// The body, side-on with a touch of three-quarter (the near legs in front of the body, the far ones
// behind it, a shade darker, their tips a little higher up the ground):
//   upper body  a young woman's, the Maidens' build (the kid's for the kid): head, neck, collarbones,
//               a chest and waist that bend from the hips, arms with elbows and wrists, small mitten
//               hands; seen from the front as the taur bases are, its guides sliding round as the
//               chest and the hips turn
//   join        her hips go down into the front of the scorpion body as one skinned shape: inside
//               her outline the body fades in from its top to her hips, so there's no seam and no
//               belt line
//   body        a low, rounded scorpion body under her waist, a soft segmented back (guides only)
//   legs        six (three a side), each three chunky segments with a soft rounded tip, coming out
//               from under the body; they step in an alternating tripod (front and back of one side
//               with the middle of the other), driven by the distance walked, so a planted tip never
//               slides
//   tail        five rounded segments and a soft bulb stinger with a small rounded point, a chain of
//               damped springs: it sways with the gait a beat late, arches over her head to threaten,
//               swings round the far side low along the ground to sweep
// Presets: scorptaur (the Maidens' upper body on a scorpion body), scorpkid (the kid's: a bigger head
// and shorter limbs, on a smaller, rounder body with chunkier legs and a shorter tail).
// Moves (SCORPTAUR_MOVES): sting (the tail cocks back, arcs over her head and strikes forward), palm
// (a double palm strike), cast (a spell gathered in the hands and thrown), sandburst (rearing, the
// front legs stamp, a soft sand wave rolls out), sweep (the tail swings low round along the ground),
// jump, dash, dodge, hurt, knockdown (rocks back and tips over, legs and tail curled, rights itself),
// flick (pleased: a hair-flick, a little shrug and a wave). Poses (m.pose): sit (the body down, the
// legs folded, the tail curled round), rest, sleep (slumped forward on folded arms, tail curled).

import { makeRig, clamp, TAU } from './rig.js';
import { hold } from './kidrig.js';
import { E } from './kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299' };
// (the soft ink round the outer edge; a lighter line where a part crosses in front of another)
const INK = '#7f6982';
const SEAM = '#a99dc2';

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
const rot = (p, r) => {
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};
const unit = (r) => [Math.cos(r), Math.sin(r)];
const frac = (x) => ((x % 1) + 1) % 1;
const rgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};

// A closed smooth curve through the points (a cardinal spline), `n` steps a span.
function loop(pts, n = 4) {
  const out = [];
  const N = pts.length;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    for (let j = 0; j < n; j++) out.push(spline(p0, p1, p2, p3, j / n));
  }
  return out;
}
// The same, open, through its ends.
function strand(pts, n = 4) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) out.push(spline(p0, pts[i], pts[i + 1], p3, j / n));
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function spline(p0, p1, p2, p3, u) {
  const u2 = u * u;
  const u3 = u2 * u;
  const f = (k) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * u3);
  return [f(0), f(1)];
}
// Every closed shape wound the same way round (clockwise on the screen, as the canvas draws an arc),
// so any of them filled together (nonzero) make one union.
function wound(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return s < 0 ? pts.slice().reverse() : pts;
}
const oval = (c, rx, ry, r0 = 0, n = 22) => wound(Array.from({ length: n }, (_, i) => add(c, rot([Math.cos((i / n) * TAU) * rx, Math.sin((i / n) * TAU) * ry], r0))));
// One chunky rounded segment from p0 to p1: round ends, a little fuller across its middle (rm), so
// between two segments the joint reads as a soft waist.
function pod(p0, p1, r0, rm, r1) {
  const d = sub(p1, p0);
  const L = Math.hypot(d[0], d[1]) || 1e-3;
  const u = [d[0] / L, d[1] / L];
  const n = [-u[1], u[0]];
  const at = (b, ku, kn) => [b[0] + u[0] * ku + n[0] * kn, b[1] + u[1] * ku + n[1] * kn];
  const ring = [];
  for (let i = 0; i <= 4; i++) {
    const q = Math.PI / 2 + (i * Math.PI) / 4;
    ring.push(at(p0, Math.cos(q) * r0, Math.sin(q) * r0));
  }
  ring.push(at(lerp2(p0, p1, 0.5), 0, -rm));
  for (let i = 0; i <= 4; i++) {
    const q = -Math.PI / 2 + (i * Math.PI) / 4;
    ring.push(at(p1, Math.cos(q) * r1, Math.sin(q) * r1));
  }
  ring.push(at(lerp2(p0, p1, 0.5), 0, rm));
  return wound(loop(ring, 3));
}
const addPoly = (ctx, pts) => {
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
};
const pathOf = (ctx, list) => {
  ctx.beginPath();
  for (const pts of list) if (pts.length > 2) addPoly(ctx, pts);
};
// (a tube: a round at each point and the band between each two, all wound the same way)
function tubeInto(ctx, pts, wl, grow = 0) {
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const r = Math.max(0.1, wl[i] / 2 + grow);
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
    if (!i) continue;
    const [x0, y0] = pts[i - 1];
    const r0 = Math.max(0.1, wl[i - 1] / 2 + grow);
    const L = Math.hypot(x - x0, y - y0) || 1;
    const nx = -(y - y0) / L;
    const ny = (x - x0) / L;
    ctx.moveTo(x0 + nx * r0, y0 + ny * r0);
    ctx.lineTo(x0 - nx * r0, y0 - ny * r0);
    ctx.lineTo(x - nx * r, y - ny * r);
    ctx.lineTo(x + nx * r, y + ny * r);
    ctx.closePath();
  }
}
// (points along a run of joints, straight along each bone, the width eased joint to joint)
function along(joints, widths, n = 4) {
  const pts = [];
  const wl = [];
  for (let i = 0; i < joints.length - 1; i++) {
    for (let j = 0; j < n; j++) {
      pts.push(lerp2(joints[i], joints[i + 1], j / n));
      wl.push(mix(widths[i], widths[i + 1], ease(j / n)));
    }
  }
  pts.push(joints[joints.length - 1]);
  wl.push(widths[widths.length - 1]);
  return [pts, wl];
}
// (whether a point is inside a polygon)
function inside(p, poly) {
  let inn = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inn = !inn;
  }
  return inn;
}

// ---------- The presets (game px; y down, the ground at 0; x toward the way it faces) ----------
// up: the upper body, measured from her hip joint: the torso's near side down from the neck (the far
// side mirrors it), the spine's joints (the top of the breastbone, the ribs, the navel), the
// shoulders [half-width, y], the neck's half-width; neck: its base, its top inside the head, the
// chin, its width; head: its middle above the neck's top, its half-width, half-height, how square
// the jaw, the ears [rx, ry]; arm: upper arm, forearm, widths at the shoulder, elbow and wrist, the
// hand's radius, the shoulder's round.
// seat: her hip joint on the scorpion body at rest; body: its outline round, its middle (it pitches
// about it), where the tail comes out of it; legs: each one's root inside the body [x, y, z (toward
// the viewer)], its angle out from straight sideways (+ toward the front), its reach; bones, widths;
// gait: half a step's length, its lift, the share of the step a tip is planted; tail: its segments'
// lengths and widths, the bulb [rx, ry], the sting's length; kz/kx: how much depth moves a point
// down and forward on the screen (the three-quarter view); speed: its walking pace.
const SCORPTAUR = {
  name: 'Scorptaur',
  up: {
    side: [[1.6, -14.45], [2.85, -13.75], [4.1, -13.35], [4.9, -12.1], [4.55, -9.6], [4.45, -8.1], [3.45, -4.3], [4.5, 0], [4.25, 2.2], [3.1, 4.1]],
    low: 4.9,
    stern: -13.6,
    ribs: -6.3,
    navel: -2.8,
    chest: -8.4,
    sh: [4.4, -12],
    neckW: 1.55,
  },
  neck: { base: -14.2, top: -17.9, chin: -16, w: 3.1 },
  head: { c: -5.45, rx: 7, ry: 7.7, jaw: 0.35, ear: [1.2, 1.8] },
  arm: { ua: 5.9, fa: 5.7, w0: 2.45, ew: 2.1, w1: 1.8, hr: 1.4, ball: 1.38 },
  seat: [9, -18.6],
  body: {
    pts: [[12.6, -19.0], [15, -15.6], [15.7, -11.8], [14, -8.3], [9.4, -6.2], [1.5, -5.5], [-6.5, -5.6], [-12.8, -6.6], [-17, -8.8], [-18.2, -11.6], [-16.4, -14.0], [-9.6, -15.2], [-2.2, -16.2], [4.4, -18.4], [8.8, -19.8]],
    c: [0, -11.5],
    tail: [-15.6, -11.4],
    plates: [-12.6, -8.4, -4.2],
  },
  legs: { roots: [[7.4, -8.5, 2.4, 60, 9.2], [-0.4, -8, 2.6, 14, 8.8], [-8.2, -8.4, 2.4, -58, 9.6]], bones: [4.8, 7, 6.4], w: [4, 3.6, 3, 1.9], el: 0.66 },
  gait: { half: 4.2, lift: 2.6, duty: 0.6 },
  tail: { segs: [9.2, 8.4, 7.8, 7.2, 6.8], w: [5.4, 4.6, 3.9, 3.4, 3], bulb: [3.7, 3], sting: 2 },
  kz: 0.15,
  kx: 0.2,
  hang: [-4, -6],
  bow: 1,
  speed: 18,
  moves: ['cast', 'sting', 'palm', 'sandburst', 'sweep'],
};
const SCORPKID = {
  name: 'Scorpion kid',
  up: {
    side: [[1.6, -7.47], [2.87, -6.93], [4.03, -6.37], [4.87, -5.1], [4.77, -2.87], [3.93, -1.67], [4.8, 0.67], [4.27, 2.67], [2.6, 4.3]],
    low: 4.9,
    stern: -6.73,
    ribs: -2.47,
    navel: -0.87,
    chest: -3.9,
    sh: [4.33, -5],
    neckW: 1.6,
  },
  neck: { base: -6.67, top: -10.3, chin: -8.33, w: 2.8 },
  head: { c: -5.4, rx: 7.5, ry: 7.3, jaw: 0.14, ear: [1.25, 1.9] },
  arm: { ua: 3.6, fa: 3, w0: 2.47, ew: 2.2, w1: 1.9, hr: 1.45, ball: 1.37 },
  seat: [6.6, -13.9],
  body: {
    pts: [[9.6, -14.8], [11.8, -12.3], [12.3, -9.3], [10.8, -6.4], [6.7, -4.9], [0.5, -4.5], [-5.5, -4.7], [-10, -5.8], [-12.9, -8.1], [-13.4, -10.7], [-11.4, -12.9], [-6, -13.7], [-0.6, -14.0], [3.3, -14.7], [6.6, -15.5]],
    c: [0, -9.5],
    tail: [-11.4, -9.9],
    plates: [-9.2, -5.6],
  },
  legs: { roots: [[5.6, -6.8, 2.2, 60, 7.6], [-0.4, -6.4, 2.4, 14, 7.3], [-6.4, -6.8, 2.2, -58, 8]], bones: [4.2, 5.8, 5.4], w: [4.3, 3.9, 3.3, 2.2], el: 0.6 },
  gait: { half: 3.3, lift: 2.2, duty: 0.6 },
  tail: { segs: [6.8, 6.2, 5.7, 5.3, 4.9], w: [5.2, 4.5, 3.9, 3.4, 3], bulb: [3.4, 2.8], sting: 1.8, strike: [Math.PI + 1.4, 0.14, 0.16, 0.22, 0.34, 0.85] },
  // (her short arms hang a little forward, so her hands stay clear of the body below)
  hang: [-14, -34],
  // (her big head: she ducks under the sting less deeply)
  bow: 0.5,
  kz: 0.15,
  kx: 0.2,
  speed: 14,
  moves: ['cast', 'sting', 'palm', 'sandburst', 'sweep'],
};
export const SCORPTAUR_PRESETS = { scorptaur: SCORPTAUR, scorpkid: SCORPKID };
export const SCORPTAUR_KINDS = ['scorptaur', 'scorpkid'];

// ---------- The moves (x, hop in body heights; lift in px; angles in degrees) ----------
// The body: crouch (1 down on the ground), pitch (+ its front up), fall (1 tipped right over on its
// back), lift. Her: tilt (the spine's lean, + forward), pelvis, waist, chest (each bend on top),
// turnC/turnP (the chest and the hips turning toward -1 / away 1 from us: the guides slide round),
// neck, head (+ down), hT (the head turning, its guides sliding); the arms hang at 0, shN/shF going
// negative bring an arm forward and up (-90 straight ahead, -180 straight up), elN/elF bend the
// forearm forward as they go negative, hwN/hwF turn the hand at the wrist, shrugN/shrugF lift the
// shoulders. The tail: tR raised (0 resting, 1 arched over her head), tC curled tighter, tX struck
// forward (- cocked back), tS laid low along the ground, tY swung round the far side (degrees),
// tW turned (degrees). The legs: fold (folded under), tuck (drawn up in the air), wave (waving in
// the air), stamp (the front legs raised to stamp).
export const SCORPTAUR_MOVES = {
  // The tail cocks back over her, then arcs over her head and strikes forward; she leans in behind it.
  sting: {
    anticT: 0.42,
    keys: [
      [0, { tR: 1, tX: -1, crouch: 0.3, pitch: 2, tilt: 7, waist: 2, chest: -2, head: -9, shN: -40, elN: -86, shF: -34, elF: -80, hwN: 10, hwF: 10, x: -0.02 }],
      [0.09, { tR: 1, tX: 1.08, crouch: 0.32, pitch: -4, tilt: 30, waist: 12, chest: 7, neck: 6, head: 14, shN: -34, elN: -66, shF: -28, elF: -60, x: 0.05 }, 'out'],
      [0.17, { tR: 1, tX: 1.14, crouch: 0.32, pitch: -4.5, tilt: 31, waist: 12, chest: 7, neck: 6, head: 15, shN: -32, elN: -64, shF: -26, elF: -58, x: 0.055 }, 'out'],
      [0.44, { tR: 0.7, tX: 0.45, crouch: 0.12, tilt: 10, waist: 4, chest: 2, head: 5, pitch: -1, x: 0.025, shN: -14, elN: -32, shF: -10, elF: -28 }],
      [0.84, {}],
    ],
    spark: [0.11],
    sparkAt: 'sting',
  },
  // Both hands drawn back to the chest, then thrust out flat, palms forward, her weight behind them.
  palm: {
    anticT: 0.3,
    keys: [
      [0, { shN: 30, elN: -128, hwN: -10, shF: 24, elF: -120, hwF: -10, tilt: -7, waist: -4, turnC: -0.3, turnP: 0.12, x: -0.025, tR: 0.15, head: -2, crouch: 0.15 }],
      [0.07, { shN: -86, elN: -6, hwN: -72, shF: -80, elF: -10, hwF: -70, tilt: 12, waist: 5, chest: 4, turnC: 0.32, turnP: -0.12, x: 0.07, tR: 0.3, head: 3, crouch: 0.05 }, 'out'],
      [0.24, { shN: -82, elN: -12, hwN: -64, shF: -76, elF: -14, hwF: -62, tilt: 9, waist: 3, chest: 3, turnC: 0.25, turnP: -0.08, x: 0.06, tR: 0.3, head: 2 }],
      [0.62, {}],
    ],
    spark: [0.07],
    sparkAt: 'hands',
  },
  // A spell: the hands cupped before her chest gather a soft light, then throw it forward.
  cast: {
    anticT: 0.48,
    keys: [
      [0, { shN: -36, elN: -108, hwN: 12, shF: -32, elF: -104, hwF: 12, tilt: -5, head: -8, chest: -3, tR: 0.35, crouch: 0.14 }],
      [0.1, { shN: -100, elN: -12, hwN: -58, shF: -92, elF: -14, hwF: -56, tilt: 8, head: 2, chest: 4, x: 0.04, tR: 0.5 }, 'out'],
      [0.34, { shN: -96, elN: -16, hwN: -50, shF: -88, elF: -18, hwF: -48, tilt: 6, head: 1, chest: 3, x: 0.035, tR: 0.45 }],
      [0.86, {}],
    ],
    glow: [-0.48, 0.07],
    burst: [0.1],
  },
  // Rearing on her back legs, her arms up; the front legs stamp down and a soft wave of sand rolls out.
  sandburst: {
    anticT: 0.36,
    keys: [
      [0, { pitch: 7, stamp: 1, crouch: 0.02, lift: 1.4, tilt: -7, chest: -4, shN: -150, elN: -28, shF: -142, elF: -32, head: -6, tR: 0.2, tW: -28 }],
      [0.07, { pitch: -3, stamp: 0, crouch: 0.42, lift: 0, tilt: 11, chest: 4, shN: -42, elN: -22, shF: -36, elF: -22, head: 5, tR: 0.3 }, 'in'],
      [0.18, { pitch: -1.5, crouch: 0.32, tilt: 7, chest: 2, shN: -34, elN: -24, shF: -30, elF: -24, head: 3, tR: 0.32 }, 'out'],
      [0.66, {}],
    ],
    sand: [0.07],
    dust: [[0.07, 'front']],
  },
  // The tail lifts, coiled, as she looks back; it drops low and swings round the far side along the
  // ground to the front, her body turning with it.
  sweep: {
    anticT: 0.36,
    keys: [
      [0, { tR: 0.75, tC: -0.1, tW: -14, tY: -12, turnC: -0.45, turnP: -0.18, hT: -0.55, head: -5, tilt: -4, shN: -18, elN: -55, shF: 22, elF: -35, crouch: 0.15 }],
      [0.1, { tR: 0, tS: 1, tC: 0.05, tY: 25, turnC: -0.15, hT: -0.2, tilt: 4, crouch: 0.3, x: -0.02, shN: -30, elN: -40, shF: 30, elF: -30 }, 'in'],
      [0.3, { tS: 1, tC: 0.1, tY: 150, turnC: 0.45, turnP: 0.2, hT: 0.3, tilt: 7, crouch: 0.3, shN: -55, elN: -30, shF: 42, elF: -20 }, 'out'],
      [0.44, { tS: 1, tC: 0.1, tY: 140, turnC: 0.35, turnP: 0.1, hT: 0.2, tilt: 5, crouch: 0.24, shN: -40, elN: -30, shF: 30, elF: -20 }],
      [0.74, { tS: 0.95, tC: 0, tY: 8, turnC: -0.1, turnP: 0, hT: 0, tilt: 2, crouch: 0.15, shN: -16, elN: -24, shF: 12, elF: -14 }, 'io'],
      [1.08, {}],
    ],
    dust: [[0.12, 'tail'], [0.2, 'tail'], [0.28, 'tail']],
    spark: [0.28],
    sparkAt: 'tail',
  },
  jump: {
    anticT: 0.2,
    keys: [
      [0, { crouch: 0.7, tilt: -5, shN: 25, elN: -20, shF: 28, elF: -20, tR: 0.2, tC: 0.2 }],
      [0.16, { hop: 0.42, crouch: 0, tuck: 0.85, tilt: 4, pitch: 4, shN: -120, elN: -30, shF: -110, elF: -30, tR: 0.5, tC: 0.4 }, 'out'],
      [0.34, { hop: 0.46, tuck: 0.9, tilt: 0, pitch: 1, shN: -100, elN: -40, shF: -95, elF: -40, tR: 0.6, tC: 0.5 }, 'out'],
      [0.52, { hop: 0.02, tuck: 0.1, tilt: -3, shN: -30, elN: -20, shF: -25, elF: -20, tR: 0.2 }, 'in'],
      [0.58, { crouch: 0.55, tilt: 6, shN: 10, elN: -25, shF: 14, elF: -25 }, 'out'],
      [0.95, {}],
    ],
    dust: [[0, 'feet'], [0.54, 'feet']],
  },
  dash: {
    anticT: 0.1,
    keys: [
      [0, { crouch: 0.35, x: -0.02, tilt: -5, shN: -20, shF: -15 }],
      [0.26, { x: 0.55, crouch: 0.12, tilt: 12, pitch: -3, shN: 45, elN: -30, shF: 50, elF: -30, tR: -0.3, tX: -0.4, head: -4 }, 'out'],
      [0.42, { x: 0.6, crouch: 0.1, tilt: 4, shN: 20, elN: -15, shF: 22, elF: -15, tR: -0.1 }, 'io'],
      [0.92, {}],
    ],
    lines: [0, 0.32],
    dust: [[0.02, 'feet']],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.35 }],
      [0.12, { hop: 0.14, x: -0.32, tilt: -14, pitch: 5, tuck: 0.5, shN: -60, elN: -100, shF: -55, elF: -95, head: -8, tR: 0.7, tC: 0.3 }, 'out'],
      [0.3, { x: -0.36, crouch: 0.35, tilt: 2, shN: -20, elN: -40, shF: -15, elF: -40 }, 'in'],
      [0.8, {}],
    ],
    dust: [[0.3, 'feet']],
  },
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.04, tilt: -11, chest: -4, head: -9, hT: 0.3, shN: 28, elN: -45, shF: 32, elF: -45, crouch: 0.22, pitch: 3, tR: -0.35, tW: -10 }, 'out'],
      [0.24, { x: -0.04, tilt: -6, chest: -2, head: -5, hT: 0.15, shN: 15, elN: -30, shF: 18, elF: -30, crouch: 0.15, pitch: 1, tR: -0.15, tW: -4 }],
      [0.6, {}],
    ],
  },
  // Rocked back off its front legs, it tips right over onto its back, legs drawn up and waving and
  // the tail curled in; then it rolls back onto its legs.
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.12, { x: -0.05, tilt: -16, head: -12, pitch: 12, stamp: 0.8, shN: 40, elN: -60, shF: 45, elF: -60, tX: -0.5, tW: -22 }, 'out'],
      [0.36, { fall: 0.55, x: -0.1, hop: 0.06, pitch: 6, tuck: 0.7, tR: -0.3, tC: 0.5, tilt: -28, waist: -8, head: -10, shN: -100, elN: -40, shF: -90, elF: -40 }, 'io'],
      [0.52, { fall: 1, x: -0.13, tuck: 1, wave: 0.5, tR: -0.6, tC: 0.9, tS: 0.6, tilt: -32, waist: -10, chest: -5, head: -12, shN: -150, elN: -30, shF: -140, elF: -30 }, 'in'],
      [0.62, { fall: 0.92, x: -0.13, tuck: 1, wave: 0.8, tR: -0.6, tC: 1, tS: 0.6, tilt: -34, waist: -10, chest: -5, head: -8, shN: -145, elN: -30, shF: -135, elF: -30 }, 'out'],
      [1.3, { fall: 1, x: -0.13, tuck: 1, wave: 1, tR: -0.6, tC: 1, tS: 0.6, tilt: -31, waist: -9, chest: -5, head: -4, shN: -150, elN: -45, shF: -140, elF: -45 }],
      [1.55, { fall: 0.45, x: -0.09, hop: 0.06, tuck: 0.5, wave: 0.2, tC: 0.4, tS: 0.2, tilt: 10, waist: 4, head: 4, shN: -40, elN: -40, shF: -35, elF: -40 }, 'io'],
      [1.75, { fall: 0, x: -0.05, crouch: 0.55, tilt: 6, head: 3, shN: -10, elN: -20, shF: -10, elF: -20 }, 'in'],
      [2.1, {}],
    ],
    dust: [[0.58, 'body'], [1.75, 'feet']],
  },
  // Pleased: a hand swept up behind her head and flicked out (a hair-flick, though she has no hair
  // yet), a little shrug, palms up, and a wave; the tail swaying.
  flick: {
    anticT: 0.15,
    keys: [
      [0, { shN: -160, elN: -105, hwN: 20, head: -9, hT: -0.2, tilt: -2, waist: -4, turnC: 0.25, turnP: -0.1, tR: 0.3 }],
      [0.22, { shN: -130, elN: -35, hwN: -30, head: 7, hT: 0.25, tilt: -3, waist: 2, turnC: -0.1, tR: 0.45, tW: 8 }, 'out'],
      [0.44, { shN: -20, elN: -70, hwN: -40, shF: 22, elF: -60, hwF: -40, shrugN: 9, shrugF: 9, head: 5, tilt: -2, tR: 0.4, tW: -6 }, 'io'],
      [0.62, { shN: -15, elN: -65, hwN: -35, shF: 20, elF: -55, hwF: -35, shrugN: 2, shrugF: 2, head: 2, tR: 0.35, tW: 6 }, 'io'],
      [0.86, { shN: -100, elN: -82, hwN: 12, head: 3, tR: 0.35, tW: -5 }, 'io'],
      [1.02, { shN: -100, elN: -48, hwN: -20, head: 3, tR: 0.35, tW: 5 }, 'io'],
      [1.18, { shN: -100, elN: -84, hwN: 14, head: 3, tR: 0.35, tW: -3 }, 'io'],
      [1.52, {}],
    ],
  },
};
export const SCORPTAUR_SHOW = ['sting', 'palm', 'cast', 'sandburst', 'sweep', 'jump', 'dash', 'dodge', 'hurt', 'knockdown', 'flick'];
const lastKey = (mv) => mv.keys[mv.keys.length - 1][0];
const CURVES = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: ease };
// A move's pose at time t (before 0: the wind-up, eased from the rest pose into the first key).
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
  const u = (CURVES[keys[i + 1][2]] ?? ease)(clamp((t - keys[i][0]) / Math.max(1e-6, keys[i + 1][0] - keys[i][0]), 0, 1));
  const out = {};
  for (const c of Object.keys(p0)) out[c] = mix(p0[c], p1[c], u);
  return out;
}
// (0..1 through a short window after a moment, or -1)
const after = (moment, t, span) => (t >= moment && t <= moment + span ? (t - moment) / span : -1);

const CH = ['x', 'hop', 'lift', 'crouch', 'pitch', 'fall', 'tilt', 'pelvis', 'waist', 'chest', 'turnC', 'turnP', 'neck', 'head', 'hT', 'shN', 'elN', 'hwN', 'shF', 'elF', 'hwF', 'shrugN', 'shrugF', 'reachN', 'reachF', 'tR', 'tC', 'tX', 'tS', 'tY', 'tW', 'fold', 'tuck', 'wave', 'stamp'];
const NOTHING = () => sprite('rig|scorptaurblank', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// ---------- One rig for a preset ----------
function scorptaurRig(kind) {
  const P = SCORPTAUR_PRESETS[kind];
  const U = P.up;
  const AR = P.arm;
  const NK = P.neck;
  const HD = P.head;
  const KZ = P.kz;
  const KX = P.kx;
  const proj = (p) => [p[0] + p[2] * KX, p[1] + p[2] * KZ];

  // Her height (to the crown), for the moves' distances.
  const H = -(P.seat[1] + NK.top + HD.c - HD.ry);
  // The scorpion body's outline at rest, its top edge (where her hips go into it), its bottom.
  const BODY = wound(loop(P.body.pts, 5));
  const topAt = (x) => {
    let best = 0;
    for (let i = 0; i < BODY.length; i++) {
      const p = BODY[i];
      const q = BODY[(i + 1) % BODY.length];
      if ((p[0] - x) * (q[0] - x) <= 0 && p[0] !== q[0]) best = Math.min(best, mix(p[1], q[1], (x - p[0]) / (q[0] - p[0])));
    }
    return best;
  };
  const bodyLow = Math.max(...BODY.map((p) => p[1]));
  const bodyBack = Math.min(...BODY.map((p) => p[0]));
  const bodyFront = Math.max(...BODY.map((p) => p[0]));
  const seatTop = topAt(P.seat[0]);

  // The torso at rest (from her hip joint): one outline down the near side, round under, up the far.
  const sideN = strand(U.side, 5);
  const sideF = sideN.map(([x, y]) => [-x, y]);
  const [qn] = U.side.slice(-1);
  const under = strand([qn, [0, U.low], [-qn[0], qn[1]]], 4).slice(1, -1);
  const HULL = [...sideN, ...under, ...sideF.slice().reverse()];
  const edgeX = (pts, y) => {
    for (let i = 0; i < pts.length - 1; i++) if ((pts[i][1] - y) * (pts[i + 1][1] - y) <= 0) return mix(pts[i][0], pts[i + 1][0], (y - pts[i][1]) / (pts[i + 1][1] - pts[i][1] || 1));
    return pts[pts.length - 1][0];
  };
  const halfAt = (y) => Math.abs(edgeX(sideN, y));
  // How much each point of the torso follows each bone: the hips below the navel, the waist between,
  // the chest above the ribs, blended across each joint; near the shoulders, its collarbone.
  const dj = (U.navel - U.ribs) * 0.5;
  const [shW, shY] = U.sh;
  const weights = ([x, y]) => {
    let w;
    if (y <= U.ribs - dj) w = [0, 0, 1];
    else if (y < U.ribs + dj) {
      const u = ease((y - (U.ribs - dj)) / (2 * dj));
      w = [0, u, 1 - u];
    } else if (y <= U.navel - dj * 0.6) w = [0, 1, 0];
    else if (y < U.navel + dj * 1.2) {
      const u = ease((y - (U.navel - dj * 0.6)) / (dj * 1.8));
      w = [u, 1 - u, 0];
    } else w = [1, 0, 0];
    const up = 1 - ease((y - (shY - AR.w0 * 0.2)) / (AR.w0 * 1.4));
    const side = ease((Math.abs(x) - U.neckW * 1.1) / Math.max(0.5, shW - U.neckW * 1.1));
    const cl = w[2] * up * side;
    return [w[0], w[1], w[2] - cl, x > 0 ? cl : 0, x < 0 ? cl : 0];
  };
  const HULLW = HULL.map(weights);
  // Its shading at rest: the far side's shade, the near side's light, the waist drawn in, the
  // collarbones, the guide down the middle and across under the chest.
  const shadeBand = (() => {
    const e = sideF.filter(([, y]) => y > shY);
    return [...e, ...e.slice().reverse().map(([x, y]) => [x * 0.7, y])];
  })();
  const litBand = (() => {
    const e = sideN.filter(([, y]) => y > shY + AR.w0 * 0.6 && y < 2);
    return [...e.map(([x, y]) => [x * 0.95, y]), ...e.slice().reverse().map(([x, y]) => [x * 0.84, y])];
  })();
  const pinch = (pts, k) => {
    const lo = U.ribs - dj * 0.6;
    const hi = U.navel + dj;
    const e = pts.filter(([, y]) => y > lo && y < hi);
    return [...e, ...e.slice().reverse().map(([x, y]) => [x - x * k * Math.sin(Math.PI * ease((y - lo) / (hi - lo))), y])];
  };
  const pinchN = pinch(sideN, 0.16);
  const pinchF = pinch(sideF, 0.2);
  const collar = [-1, 1].map((s) => strand([[s * U.neckW * 0.75, U.stern + 0.9], [s * shW * 0.45, U.stern + 1.15], [s * shW * 0.75, U.stern + 0.95]], 3));
  const bandsW = [shadeBand, litBand, pinchN, pinchF, ...collar].map((b) => b.map(weights));

  // The legs: each one's root, the way it points out, its tip at rest, its step's phase (the
  // tripod: the front and back legs of one side with the middle of the other).
  const LG = P.legs;
  const [l1, l2, l3] = LG.bones;
  const legs = [];
  for (const side of [1, -1]) {
    LG.roots.forEach(([x, y, z, az, reach], i) => {
      const out = [Math.sin(az * D2R), 0, Math.cos(az * D2R) * side];
      const root = [x, y, z * side];
      legs.push({ side, i, root, out, reach, tip: [x + out[0] * reach, 0, root[2] + out[2] * reach], ph: ((i + (side > 0 ? 0 : 1)) % 2) * 0.5 + i * 0.035 });
    });
  }
  const G = P.gait;
  const cycle = (2 * G.half) / G.duty;
  const walkSpeed = P.speed;
  // A tip's place through its step: planted (sliding back under the body just as far as the body
  // goes on), then lifted in an eased arc and set down ahead.
  const stepAt = (u, ph, k = 1) => {
    const q = frac(u + ph);
    const hf = G.half * k;
    if (q < G.duty) return { dx: hf - (2 * hf * q) / G.duty, lift: 0, v: -1, q };
    const v = (q - G.duty) / (1 - G.duty);
    return { dx: -hf + 2 * hf * ease(v), lift: G.lift * Math.sin(Math.PI * v) ** 0.8, v, q };
  };
  // A leg's three bones reaching its tip F (3D, y down), in the upright plane through its root and its
  // tip: the first rises out and up from under the body's edge to a knee above it (`up`: how steeply),
  // then the other two reach down and out to the tip, bending out at the joint between them.
  const legBones = (L, F, up) => {
    const R = L.root;
    const hx = F[0] - R[0];
    const hz = F[2] - R[2];
    const hd = Math.hypot(hx, hz) || 1e-3;
    const e = [hx / hd, hz / hd];
    const K = [Math.cos(up) * l1, -Math.sin(up) * l1];
    const dh = hd - K[0];
    const dv = F[1] - R[1] - K[1];
    const d0 = Math.hypot(dh, dv) || 1e-3;
    const d = clamp(d0, Math.abs(l2 - l3) + 0.4, l2 + l3 - 0.02);
    const phi = Math.atan2(dv, dh);
    const bend = Math.acos(clamp((l2 * l2 + d * d - l3 * l3) / (2 * l2 * d), -1, 1));
    const J2 = [K[0] + Math.cos(phi - bend) * l2, K[1] + Math.sin(phi - bend) * l2];
    const T = [K[0] + Math.cos(phi) * d, K[1] + Math.sin(phi) * d];
    const to = ([h, v]) => [R[0] + e[0] * h, R[1] + v, R[2] + e[1] * h];
    return [R, to(K), to(J2), to(T)];
  };

  // The tail: its rest curl (from straight back, each segment turning on up and over), held raised
  // over her head, laid low along the ground. (Angles on the screen, y down: pi points back, 3pi/2
  // straight up, 2pi forward.)
  const TL = P.tail;
  // (cocked: drawn back up behind her; struck: arched forward over her head, the sting jabbing down)
  const CURL = {
    rest: [Math.PI + 0.55, 0.5, 0.62, 0.75, 0.85, 0.9],
    threat: [Math.PI + 1.35, 0.25, 0.35, 0.45, 0.55, 0.85],
    cock: [Math.PI + 0.98, 0.22, 0.3, 0.4, 0.55, 0.95],
    strike: TL.strike ?? [Math.PI + 1.62, 0.2, 0.24, 0.3, 0.42, 0.8],
    low: [Math.PI - 0.5, 0.32, 0.16, 0.06, 0.02, 0.45],
  };
  const TAILK = [[230, 21], [205, 19], [185, 17], [165, 15], [150, 14], [140, 13]];

  // ---------- The skeleton, each frame ----------
  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const t = a.t + (m.uid % 7) * 1.3;
    const dt = clamp(a.dt ?? 0, 0, 0.05);
    // The step's phase: from the distance walked and its own lunges, so planted tips stay put.
    const odo = m.odo ?? 0;
    const dO = odo - (st.sOdo ?? odo);
    st.sOdo = odo;
    const dX = S.x - (st.sX ?? S.x);
    st.sX = S.x;
    const went = (Math.abs(dO) < 40 ? dO : 0) + dX;
    st.sU = frac((st.sU ?? 0) + went / cycle);
    const u = st.sU;
    const pace = dt > 0 ? Math.abs(went) / dt : 0;
    st.sPace = (st.sPace ?? 0) + (pace - (st.sPace ?? 0)) * Math.min(1, dt * 9);
    st.sW = (st.sW ?? 0) + (clamp(st.sPace / (walkSpeed * 0.35), 0, 1) - (st.sW ?? 0)) * Math.min(1, dt * 10);
    const w = st.sW;

    // The body: lowered (crouch), lifted, hopping; a small bob as each tripod takes the weight and a
    // gentle rock; pitched about its middle; tipped over backward about its back end (fall), never
    // into the ground.
    // (tipped over: down on the ground, rolled back a little onto its back end)
    const fallK = clamp(S.fall, -0.2, 1.15);
    const crouch = Math.max(clamp(S.crouch, -0.3, 1.1), fallK);
    const bob = w * 0.32 * Math.cos(2 * TAU * (u - G.duty / 2));
    const rock = w * 0.7 * Math.sin(2 * TAU * u - 0.6);
    const drop = (bodyLow - 0.5) * crouch;
    const pitch = -(S.pitch + rock) * D2R;
    const off = [S.x, -drop - S.lift - S.hop + bob];
    const bc = P.body.c;
    const MB = (p) => add(add(bc, rot(sub(p, bc), pitch)), off);
    const fallA = -fallK * 16 * D2R;
    const piv = [bodyBack + 3 + S.x, -1];
    let fixY = 0;
    const FR = (p) => add(add(piv, rot(sub(p, piv), fallA)), [0, fixY]);
    // (never into the ground: lifted by however far its lowest point would go under, once tipping)
    if (Math.abs(fallA) > 1e-3 || S.hop < 0) {
      let low = -99;
      for (const p of BODY) low = Math.max(low, FR(MB(p))[1]);
      fixY = -Math.max(0, low + 0.3);
    }
    const W0 = (p) => FR(MB(p));
    const bodyAng = pitch + fallA;
    // Soft body: the body's back half bends gently about a point behind her seat, on a damped spring
    // (soft, one or two overshoots, then still), jolted as the body speeds up or slows (a landing, a
    // dash pulling up), by each tripod's footfall and by a hit; a bend (each point turned about the
    // hinge, more the further back), never a stretch, so its volume is kept.
    const fx0 = W0(P.body.c);
    const lastC = st.sBodyP ?? fx0;
    const bv = dt > 0 ? mul(sub(fx0, lastC), 1 / dt) : [0, 0];
    const lastBv = st.sBodyV ?? bv;
    const ba = dt > 0 ? mul(sub(bv, lastBv), 1 / dt) : [0, 0];
    st.sBodyP = fx0;
    st.sBodyV = bv;
    st.sBa = lerp2(st.sBa ?? [0, 0], [clamp(ba[0], -1500, 1500), clamp(ba[1], -1500, 1500)], Math.min(1, dt * 25));
    const fl = (st.sFlex ??= { x: 0, v: 0 });
    if (Math.abs(fx0[0] - lastC[0]) > 20) Object.assign(fl, { x: 0, v: 0 });
    // (footfalls: a tripod setting down)
    let falls = 0;
    const qs = (st.sLegQ ??= {});
    for (const L of legs) {
      const q = frac(u + L.ph);
      const key = `${L.side}${L.i}`;
      if (qs[key] != null && qs[key] >= G.duty && q < G.duty && q > G.duty - 0.3) falls++;
      qs[key] = q;
    }
    if (falls) fl.v -= 0.22 * w * Math.min(falls, 3) / 3;
    if (a.mo.hitT !== st.sHitSeen) {
      if (st.sHitSeen !== undefined && m.hp > 0) fl.v -= 2.4;
      st.sHitSeen = a.mo.hitT;
    }
    {
      const n = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        fl.v += (-150 * fl.x - 8.5 * fl.v + st.sBa[1] * 0.0011 - st.sBa[0] * 0.00035) * h;
        fl.x += fl.v * h;
      }
      if (Math.abs(fl.x) > 0.3) {
        fl.x = Math.sign(fl.x) * 0.3;
        fl.v *= -0.3;
      }
      if (!Number.isFinite(fl.x)) Object.assign(fl, { x: 0, v: 0 });
    }
    const hingeX = P.seat[0] - 6;
    const hinge = [hingeX, bc[1]];
    const bendAt = (x) => (x >= hingeX ? 0 : fl.x * ease((hingeX - x) / (hingeX - bodyBack)));
    const bend = (p) => (p[0] >= hingeX ? p : add(hinge, rot(sub(p, hinge), bendAt(p[0]))));
    const W = (p) => W0(bend(p));
    const hull = BODY.map(W);

    // Her spine: the hips on the body, the waist bending at the navel, the chest at the ribs; a lean
    // shared up it (least in the hips); the collarbones from the top of the breastbone.
    const hipW = W(P.seat);
    const tl = S.tilt * D2R;
    const aP = bodyAng + tl * 0.25 + S.pelvis * D2R;
    const aW = aP + tl * 0.35 + S.waist * 0.55 * D2R;
    const aC = aW + tl * 0.4 + (S.waist * 0.45 + S.chest) * D2R;
    const navelW = add(hipW, rot([0, U.navel], aP));
    const ribsW = add(navelW, rot([0, U.ribs - U.navel], aW));
    const sternW = add(ribsW, rot([0, U.stern - U.ribs], aC));
    const aKN = aC - S.shrugN * D2R;
    const aKF = aC + S.shrugF * D2R;
    const kN = add(sternW, rot([S.reachN, 0], aC));
    const kF = add(sternW, rot([S.reachF * 0.6, 0], aC));
    const bones = [
      [hipW, aP, [0, 0]],
      [navelW, aW, [0, U.navel]],
      [ribsW, aC, [0, U.ribs]],
      [kN, aKN, [0, U.stern]],
      [kF, aKF, [0, U.stern]],
    ];
    const skinPt = (p, wt) => {
      let x = 0;
      let y = 0;
      for (let i = 0; i < 5; i++) {
        if (!wt[i]) continue;
        const [o, an, r] = bones[i];
        const q = add(o, rot(sub(p, r), an));
        x += q[0] * wt[i];
        y += q[1] * wt[i];
      }
      return [x, y];
    };
    const torso = HULL.map((p, i) => skinPt(p, HULLW[i]));
    const bands = [shadeBand, litBand, pinchN, pinchF, ...collar].map((b, j) => b.map((p, i) => skinPt(p, bandsW[j][i])));
    const torsoAt = (p) => skinPt(p, weights(p));

    // The neck from the breastbone; the head on it.
    const aN = aC + S.neck * D2R;
    const neckTop = add(sternW, rot([0, NK.top - U.stern], aN));
    const aH = aN + S.head * D2R;
    const headC = add(neckTop, rot([0, HD.c], aH));
    const chin = add(neckTop, rot([0, NK.chin - NK.top], aH));

    // The arms, on the collarbones: the shoulder, the elbow, the wrist, the hand turned at the wrist.
    const arm = (k) => {
      const near = k === 'N';
      const s = near ? 1 : -1;
      const kk = near ? kN : kF;
      const ak = near ? aKN : aKF;
      const sh = add(kk, rot([s * shW, shY - U.stern], ak));
      const root = add(kk, rot([s * (shW - AR.w0 * 0.5), shY - U.stern + AR.w0 * 0.15], ak));
      const a1 = aC + (near ? S.shN : S.shF) * D2R;
      const el = add(sh, rot([0, AR.ua], a1));
      const a2 = a1 + (near ? S.elN : S.elF) * D2R;
      const wr = add(el, rot([0, AR.fa], a2));
      const a3 = a2 + (near ? S.hwN : S.hwF) * D2R;
      const hand = add(wr, rot([0, AR.hr * 0.9], a3));
      return { root, sh, el, wr, hand, ang: a3 };
    };
    const arms = { N: arm('N'), F: arm('F') };

    // The legs.
    const fold = clamp(S.fold, 0, 1);
    const tuck = Math.max(clamp(S.tuck, 0, 1), clamp(Math.abs(S.fall) * 2.2, 0, 1) * 0.9);
    const wave = ease(S.wave);
    const plant = 1 - clamp(Math.abs(S.fall) * 2, 0, 1);
    const stamp = clamp(S.stamp, 0, 1.2);
    const tap = a.sTap ?? [0, 0];
    const LEG = [];
    const calmL = (1 - w) * (a.calm ?? 1) * plant * (1 - fold);
    const ls = (st.sLegs ??= {});
    for (const L of legs) {
      const g = stepAt(u, L.ph, L.i === 1 ? 0.78 : 1);
      // (each leg's joints on their own damped springs: the knee rising and the tip curling in as it
      // lifts, trailing the step a little; compressing as it takes the weight, then springing back)
      const key = `${L.side}${L.i}`;
      const js = (ls[key] ??= { r: 0, rv: 0, c: 0, cv: 0, q: g.q });
      const swing = g.v >= 0 ? Math.sin(Math.PI * g.v) * w : 0;
      // (standing about, now and then a leg lifts, shifts a touch and sets down again)
      const adj = hold((t + L.i * 2.9 + (L.side > 0 ? 0 : 4.1)) % 10.7, 0, 0.16, 0.24, 0.52) * calmL;
      if (js.q >= G.duty && g.q < G.duty && g.q > G.duty - 0.3) js.rv -= 2.6 * w;
      js.q = g.q;
      {
        const n = Math.max(1, Math.ceil(dt / (1 / 240)));
        const h = dt / n;
        for (let i = 0; i < n; i++) {
          js.rv += (-240 * (js.r - (0.34 * swing + 0.25 * adj)) - 15 * js.rv) * h;
          js.r += js.rv * h;
          js.cv += (-200 * (js.c - (swing + adj * 0.8)) - 16 * js.cv) * h;
          js.c += js.cv * h;
        }
        if (!Number.isFinite(js.r + js.c)) Object.assign(js, { r: 0, rv: 0, c: 0, cv: 0 });
      }
      // (planted on the ground where its step puts it; folded in under the body as it sits)
      let F = [S.x + L.tip[0] + g.dx * w, -g.lift * w, L.tip[2]];
      const inF = [S.x + L.root[0] + L.out[0] * L.reach * 0.62, 0, L.root[2] + L.out[2] * L.reach * 0.62];
      F = [mix(F[0], inF[0], fold * (1 - w)), F[1], mix(F[2], inF[2], fold * (1 - w))];
      // (a front leg raised to stamp; a leg tapping as it stands about)
      if (L.i === 0) {
        F[0] += stamp * 1.6;
        F[1] -= stamp * (L.side > 0 ? 5.2 : 4.4);
      }
      if (L.i === tap[0] && L.side > 0) F[1] -= tap[1] * 1.7;
      F[1] -= adj * 1.3;
      F[0] += adj * 0.5 * Math.sign(L.out[0] || 1);
      // (the tip drawn in toward the root as the leg curls)
      F[0] -= L.out[0] * js.c * 1.1;
      F[2] -= L.out[2] * js.c * 1.1;
      // (on the ground in the stand's frame, so tipping over carries it with the body)
      const R2 = MB([L.root[0], L.root[1]]);
      const Fs = [F[0], F[1], F[2]];
      // (drawn up in the air, or waving there, in the body's frame)
      const up = [L.root[0] + L.out[0] * L.reach * 0.55, L.root[1] + 1.2, L.root[2] + L.out[2] * L.reach * 0.6];
      const wv = Math.sin(t * 11 + L.i * 1.9 + (L.side > 0 ? 0.8 : 0));
      // (knocked over, they stick out and kick, front ones forward, back ones back)
      const kick = [L.root[0] + L.out[0] * L.reach * 1.05 + Math.sign(L.out[0] || 0.01) * 1.5 + wv * 1.3, L.root[1] + 2.4 - Math.cos(t * 11 + L.i * 1.9) * 1.4, L.root[2] + L.out[2] * L.reach * 0.55];
      const upW = [mix(up[0], kick[0], wave), mix(up[1], kick[1], wave), mix(up[2], kick[2], wave)];
      const upS = [...MB([upW[0], upW[1]]), upW[2]];
      // (in the stand's frame, then the root's frame for the bones)
      const toLocal = (p) => {
        const q = rot(sub([p[0], p[1]], R2), -pitch);
        return [L.root[0] + q[0], L.root[1] + q[1], p[2]];
      };
      let Fl = toLocal(Fs);
      Fl = [mix(Fl[0], upW[0], 1 - plant), mix(Fl[1], upW[1], 1 - plant), mix(Fl[2], upW[2], 1 - plant)];
      const Fu = toLocal(upS);
      Fl = [mix(Fl[0], Fu[0], tuck), mix(Fl[1], Fu[1], tuck), mix(Fl[2], Fu[2], tuck)];
      const rise = LG.el + js.r + tuck * 0.35 + stamp * 0.3 - fold * 0.25;
      const bn = legBones(L, Fl, rise);
      // (its root rides the body's soft bend; the bend fades out down the leg, so the tip stays put)
      const rb = sub(bend([L.root[0], L.root[1]]), [L.root[0], L.root[1]]);
      const pts = bn.map((p, j) => {
        const k = [1, 0.55, 0.2, 0][j];
        const q = W0([p[0] + rb[0] * k, p[1] + rb[1] * k]);
        return [q[0] + p[2] * KX, q[1] + p[2] * KZ];
      });
      LEG.push({ L, pts, depth: bn[1][2] + bn[3][2] });
    }
    const legsOf = (side) => LEG.filter((g) => g.L.side === side).sort((p, q) => p.depth - q.depth || q.L.i - p.L.i);

    // The tail: its curl's targets from the channels (rest, raised, curled, struck, low), swaying with
    // the gait a beat late and on its own at rest, each joint on its own damped spring, so it trails,
    // overshoots and settles; then laid out from its root, never into the ground, swung round the
    // far side as far as tY.
    const R = clamp(S.tR, -0.6, 1.3);
    const tgt = CURL.rest.map((v, i) => (R >= 0 ? mix(v, CURL.threat[i], R) : mix(v, CURL.low[i], -R * 0.5)));
    const tx = clamp(S.tX, -1.2, 1.25);
    for (let i = 0; i < 6; i++) tgt[i] = tx >= 0 ? mix(tgt[i], CURL.strike[i], tx) : mix(tgt[i], CURL.cock[i], -tx);
    const tc = S.tC;
    for (let i = 1; i < 5; i++) tgt[i] += 0.26 * tc;
    tgt[5] += 0.3 * tc;
    tgt[0] -= 0.2 * tc;
    const lowK = ease(S.tS);
    for (let i = 0; i < 6; i++) tgt[i] = mix(tgt[i], CURL.low[i] + (i ? 0.35 * Math.max(0, tc) : 0), lowK);
    tgt[0] += S.tW * D2R;
    const calmT = 1 - w;
    for (let i = 0; i < 6; i++) {
      const k = i / 5;
      tgt[i] += (Math.sin(t * 1.1 - i * 0.55) * 0.045 * calmT + Math.sin(2 * TAU * u - 1.3 - i * 0.5) * 0.07 * w) * (0.5 + k);
    }
    const tw = a.sTwitch ?? 0;
    tgt[4] += tw * 0.35;
    tgt[5] += tw * 0.5;
    // (the springs, in small steps; the body's own pushes jolt them: lunging on leaves it behind)
    const ts = (st.sTail ??= { a: tgt.slice(), v: tgt.map(() => 0) });
    const root0 = W(P.body.tail);
    const lastR = st.sTailRoot ?? root0;
    const vR = dt > 0 ? mul(sub(root0, lastR), 1 / dt) : [0, 0];
    const lastV = st.sTailV ?? vR;
    const acc = dt > 0 ? mul(sub(vR, lastV), 1 / dt) : [0, 0];
    st.sTailRoot = root0;
    st.sTailV = vR;
    const jolt = [clamp(acc[0], -900, 900), clamp(acc[1], -900, 900)];
    if (Math.abs(root0[0] - lastR[0]) > 20) for (let i = 0; i < 6; i++) Object.assign(ts, { a: tgt.slice(), v: tgt.map(() => 0) });
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    // (stiffer while it acts, so a strike lands on its beat and still trails a little)
    const firm = st.sActive ? 1 : 0;
    st.sFirm = (st.sFirm ?? 0) + (firm - (st.sFirm ?? 0)) * Math.min(1, dt * 8);
    for (let s = 0; s < n; s++) {
      for (let i = 0; i < 6; i++) {
        const k = TAILK[i][0] * (1 + 1.6 * st.sFirm);
        const c = TAILK[i][1] * (1 + 0.6 * st.sFirm);
        // (a push sideways to the tail swings it back; a drop down curls it)
        // (and the body's soft bend swinging under it leaves each segment behind a beat)
        const push = (i === 0 ? jolt[0] * 0.0035 - jolt[1] * 0.002 : jolt[1] * 0.0012 * (i / 5)) - fl.v * (i === 0 ? 2.2 : 1.1);
        ts.v[i] += (-k * (ts.a[i] - tgt[i]) - c * ts.v[i] + push) * h;
        ts.a[i] += ts.v[i] * h;
      }
    }
    for (let i = 0; i < 6; i++) if (!Number.isFinite(ts.a[i])) Object.assign(ts, { a: tgt.slice(), v: tgt.map(() => 0) });
    // (laid out in its own upright plane from the root, back being -x; then swung round)
    const yaw = S.tY * D2R;
    const segs = TL.segs;
    const tp = [[0, 0]];
    let head = ts.a[0] + bodyAng + bendAt(P.body.tail[0]);
    const heads = [];
    for (let i = 0; i < 5; i++) {
      if (i) head += ts.a[i];
      let d = mul(unit(head), segs[i]);
      const p0 = tp[i];
      let p1 = add(p0, d);
      // (never into the ground)
      const r = TL.w[i + 1 < 5 ? i + 1 : 4] / 2;
      const floor = -root0[1] - r;
      if (p1[1] > floor) {
        const dy = clamp(floor - p0[1], -segs[i], segs[i]);
        const dx = Math.sqrt(Math.max(0, segs[i] * segs[i] - dy * dy)) * (d[0] < 0 ? -1 : 1);
        const nh = Math.atan2(dy, dx);
        head = nh;
        d = [dx, dy];
        p1 = add(p0, d);
      }
      heads.push(head);
      tp.push(p1);
    }
    const bulbHead = head + ts.a[5];
    const swing = (p) => {
      const back = p[0];
      const x = back * Math.cos(yaw);
      const z = back * Math.sin(yaw);
      return [root0[0] + x + z * KX, root0[1] + p[1] + z * KZ];
    };
    const tailPts = tp.map(swing);
    // (the bulb: a little beyond the last joint, turned along the way the tail runs there on screen)
    const lastDir = sub(tailPts[5], tailPts[4]);
    const sAng = Math.atan2(lastDir[1], lastDir[0]) + (bulbHead - head) * Math.max(0.35, Math.abs(Math.cos(yaw)));
    const bulbC = add(tailPts[5], mul(unit(sAng), TL.bulb[0] * 0.72));
    const tipDir = sAng + 0.55 * Math.sign(Math.cos(yaw) || 1);
    const sting = add(bulbC, mul(unit(tipDir), TL.bulb[0] * 0.85 + TL.sting));

    // (where things happen, for the effects)
    const frontLegs = LEG.filter((g) => g.L.i === 0);
    const spots = {
      sting,
      hands: lerp2(arms.N.hand, arms.F.hand, 0.3),
      tail: sting,
      front: [(frontLegs[0].pts[3][0] + frontLegs[1].pts[3][0]) / 2, 0],
      feet: [hipW[0] - 6, 0],
      body: [W(P.body.c)[0], 0],
    };
    return {
      W, bodyAng, hull, hipW, torso, bands, torsoAt, sternW, neckTop, headC, chin, aH, aC, arms,
      legsNear: legsOf(1), legsFar: legsOf(-1), tailPts, bulbC, sAng, sting, tipDir, yaw, spots,
      plates: P.body.plates.map((x) => {
        const y0 = topAt(x);
        return [[x + 0.4, y0 - 0.4], [x - 0.5, mix(y0, bodyLow, 0.33)], [x - 0.9, mix(y0, bodyLow, 0.62)]].map(W);
      }),
      flex: fl.x,
      seatTop: W([P.seat[0], seatTop]),
      seatLow: W([P.seat[0], P.seat[1] + 1.8]),
      tailRoot: root0,
    };
  }

  // ---------- Drawing ----------
  const tone = (a, c, al = 1) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = rgb(c);
    const f = (v) => Math.round(v + (255 - v) * k);
    return al >= 1 ? `rgb(${f(r)},${f(g)},${f(b)})` : `rgba(${f(r)},${f(g)},${f(b)},${al})`;
  };
  const outline = (ctx) => {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const glow = (ctx, a, c, r, col, k) => {
    const [cr, cg, cb] = rgb(col);
    const f = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const lift = (v) => Math.round(v + (255 - v) * f);
    const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], Math.max(0.1, r));
    gr.addColorStop(0, `rgba(${lift(cr)},${lift(cg)},${lift(cb)},${k})`);
    gr.addColorStop(1, `rgba(${lift(cr)},${lift(cg)},${lift(cb)},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
  };
  // A soft line just outside a part's edge where it crosses in front of others (`over`), drawn before
  // its fill so only its outer half shows; `except`: where it grows out of them (no line there).
  const seam = (ctx, a, shapes, over, except = []) => {
    const ov = over.filter((p) => p && p.length > 2);
    if (!ov.length) return;
    ctx.save();
    pathOf(ctx, ov);
    ctx.clip('nonzero');
    if (except.length) {
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      for (const e of except) addPoly(ctx, e);
      ctx.clip('evenodd');
    }
    pathOf(ctx, shapes);
    ctx.strokeStyle = tone(a, SEAM);
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  };
  const outside = (ctx, shape) => {
    ctx.beginPath();
    ctx.rect(-1e4, -1e4, 2e4, 2e4);
    addPoly(ctx, shape);
    ctx.clip('evenodd');
  };
  // A soft shade along a shape's lower back edge: the shape in shade, then its own colour nudged up
  // and forward over it (the light comes from above and in front).
  const rimShade = (ctx, a, shapes, base, shade, nudge) => {
    pathOf(ctx, shapes);
    ctx.fillStyle = tone(a, shade);
    ctx.fill('nonzero');
    ctx.save();
    pathOf(ctx, shapes);
    ctx.clip('nonzero');
    ctx.translate(nudge * 0.45, -nudge);
    pathOf(ctx, shapes);
    ctx.fillStyle = tone(a, base);
    ctx.fill('nonzero');
    ctx.restore();
  };

  // The tail: five rounded segments and the bulb, one shape; lit along its top, a soft crease at
  // each joint, a light on the bulb; the sting a small rounded point.
  const tailShapes = (sk) => {
    const p = sk.tailPts;
    const out = [];
    for (let i = 0; i < 5; i++) {
      const r0 = TL.w[i] / 2;
      const r1 = TL.w[Math.min(4, i + 1)] / 2 * (i === 4 ? 0.92 : 1);
      out.push(pod(p[i], p[i + 1], r0 * 0.92, r0 * 1.04, r1 * 0.92));
    }
    out.push(oval(sk.bulbC, TL.bulb[0], TL.bulb[1], sk.sAng, 24));
    // (the sting: a soft cone off the bulb's front, curving down, its tip round)
    const d = unit(sk.tipDir);
    const nrm = [-d[1], d[0]];
    const base = add(sk.bulbC, mul(d, TL.bulb[0] * 0.5));
    const tip = sk.sting;
    const wb = TL.bulb[1] * 0.62;
    const mid = add(lerp2(base, tip, 0.55), mul(nrm, TL.sting * 0.18));
    out.push(wound(loop([add(base, mul(nrm, wb)), add(mid, mul(nrm, wb * 0.42)), add(tip, mul(d, 0.25)), add(tip, mul(nrm, -0.45)), add(mid, mul(nrm, -wb * 0.3)), add(base, mul(nrm, -wb))], 4)));
    return out;
  };
  function drawTail(ctx, a, mode) {
    const sk = a.sk;
    const shapes = tailShapes(sk);
    sk.tailShapes = shapes;
    pathOf(ctx, shapes);
    if (mode === 'line') return outline(ctx);
    rimShade(ctx, a, shapes, C.base, C.sh, 0.9);
    ctx.save();
    pathOf(ctx, shapes);
    ctx.clip('nonzero');
    // (a soft crease at each joint, across the tail)
    ctx.strokeStyle = tone(a, C.sh);
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.7;
    const p = sk.tailPts;
    for (let i = 1; i < 5; i++) {
      const d = sub(p[i + 1] ?? p[i], p[i - 1]);
      const L = Math.hypot(d[0], d[1]) || 1;
      const n = [-d[1] / L, d[0] / L];
      const r = TL.w[i] * 0.42;
      const bow = mul(d, -0.06);
      ctx.beginPath();
      ctx.moveTo(...add(p[i], mul(n, r)));
      ctx.quadraticCurveTo(...add(p[i], bow), ...add(p[i], mul(n, -r)));
      ctx.globalAlpha = 0.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    glow(ctx, a, add(sk.bulbC, rot([-TL.bulb[0] * 0.2, -TL.bulb[1] * 0.45], 0)), TL.bulb[0] * 0.9, C.lt, 0.9);
    ctx.restore();
  }

  // A leg: its three segments, chunky, the tip a soft round point.
  const legShape = (g) => {
    const [Rt, J1, J2, T] = g.pts;
    const LW = LG.w;
    return [pod(Rt, J1, LW[0] / 2, LW[0] * 0.53, LW[1] / 2), pod(J1, J2, LW[1] / 2, LW[1] * 0.53, LW[2] / 2), pod(J2, T, LW[2] / 2, LW[2] * 0.46, LW[3] / 2)];
  };
  // (where a leg crosses in front of legs already drawn: no line, only the soft shade it casts)
  const contact = (ctx, a, shapes, over, col) => {
    if (!over.length) return;
    ctx.save();
    pathOf(ctx, over);
    ctx.clip('nonzero');
    ctx.translate(-0.5, 0.7);
    pathOf(ctx, shapes);
    ctx.fillStyle = tone(a, col, 0.55);
    ctx.fill('nonzero');
    ctx.restore();
  };
  // The far legs, behind the body, a shade darker.
  function drawLegsFar(ctx, a, mode) {
    const sk = a.sk;
    const done = [];
    sk.farShapes = [];
    for (const g of sk.legsFar) {
      const sh = legShape(g);
      pathOf(ctx, sh);
      if (mode === 'line') {
        outline(ctx);
        continue;
      }
      seam(ctx, a, sh, sk.tailShapes ?? []);
      contact(ctx, a, sh, done, C.deep);
      rimShade(ctx, a, sh, C.sh, C.deep, 0.7);
      done.push(...sh);
    }
    sk.farShapes = done;
  }
  // The near legs: only where they come out from under the body, so no root ever shows; over the
  // body's edge where one comes out, its own colour, so not even a hairline shows there.
  function drawLegsNear(ctx, a, mode) {
    const sk = a.sk;
    ctx.save();
    if (mode === 'line') {
      for (const g of sk.legsNear) {
        pathOf(ctx, legShape(g));
        outline(ctx);
      }
      ctx.restore();
      return;
    }
    outside(ctx, sk.hull);
    const done = [];
    for (const g of sk.legsNear) {
      const sh = legShape(g);
      seam(ctx, a, sh, [...(sk.farShapes ?? []), ...(sk.tailShapes ?? [])]);
      contact(ctx, a, sh, done, C.sh);
      rimShade(ctx, a, sh, C.base, C.sh, 0.75);
      done.push(...sh);
    }
    // (the belly's shade runs on down over the tops of the legs, so where each comes out from under
    // the body it's the body's own tone there: no pale lip)
    if (done.length && sk.bellyShade) {
      pathOf(ctx, done);
      ctx.clip('nonzero');
      sk.bellyShade();
    }
    ctx.restore();
    for (const g of sk.legsNear) {
      ctx.save();
      pathOf(ctx, legShape(g));
      ctx.clip('nonzero');
      ctx.beginPath();
      addPoly(ctx, sk.hull);
      ctx.strokeStyle = tone(a, C.base);
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }
    // Over the body's side: each leg rises from under its edge to a knee above it. There it has a
    // soft line just outside its edge (lighter than the outline), and its first bone fades in from
    // nothing toward its root, so it grows out of the body and no root ever shows.
    ctx.save();
    pathOf(ctx, [sk.hull]);
    ctx.clip();
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    for (const g of sk.legsNear) {
      const [fem, tib, tip] = legShape(g);
      const [R, K] = g.pts;
      const p0 = lerp2(R, K, 0.25);
      const p1 = lerp2(R, K, 0.8);
      const fade = (col) => {
        const gr = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
        gr.addColorStop(0, tone(a, col, 0.001));
        gr.addColorStop(1, tone(a, col, 0.999));
        return gr;
      };
      pathOf(ctx, [tib, tip]);
      ctx.strokeStyle = tone(a, SEAM);
      ctx.stroke();
      pathOf(ctx, [fem]);
      ctx.strokeStyle = fade(SEAM);
      ctx.stroke();
      pathOf(ctx, [fem]);
      ctx.fillStyle = fade(C.base);
      ctx.fill();
      rimShade(ctx, a, [tib, tip], C.base, C.sh, 0.75);
      // (a soft light on the knee)
      glow(ctx, a, add(K, [0.3, -0.5]), LG.w[1] * 0.6, C.lt, 0.8);
    }
    ctx.restore();
  }

  // The scorpion body: one silhouette; inside her outline it fades in from its top to her hips, so her
  // body runs on down into it; lit along its back, shaded under; soft guides across the back plates.
  function drawBody(ctx, a, mode) {
    const sk = a.sk;
    pathOf(ctx, [sk.hull]);
    if (mode === 'line') return outline(ctx);
    // (a soft line where it crosses in front of the far legs or the tail, not where the tail grows out)
    seam(ctx, a, [sk.hull], [...(sk.farShapes ?? []), ...(sk.tailShapes ?? [])], [oval(sk.tailRoot, TL.w[0] * 0.9, TL.w[0] * 0.9, 0, 18), ...(sk.tailShapes ?? []).slice(0, 1)]);
    const [br, bgc, bb] = rgb(C.base);
    const f = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const lift = (v) => Math.round(v + (255 - v) * f);
    const col = (al) => `rgba(${lift(br)},${lift(bgc)},${lift(bb)},${al})`;
    ctx.save();
    outside(ctx, sk.torso);
    pathOf(ctx, [sk.hull]);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.restore();
    const fade = ctx.createLinearGradient(sk.seatTop[0], sk.seatTop[1], sk.seatLow[0], sk.seatLow[1]);
    fade.addColorStop(0, col(0));
    fade.addColorStop(1, col(1));
    ctx.save();
    pathOf(ctx, [sk.torso]);
    ctx.clip();
    pathOf(ctx, [sk.hull]);
    ctx.fillStyle = fade;
    ctx.fill();
    ctx.restore();
    // (her own edge, inside it, laid over in its colour, fading the same way)
    ctx.save();
    pathOf(ctx, [sk.hull]);
    ctx.clip();
    pathOf(ctx, [sk.torso]);
    ctx.strokeStyle = fade;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
    // its forms, clear of her
    ctx.save();
    pathOf(ctx, [sk.hull]);
    ctx.clip();
    const W = sk.W;
    const P0 = P.body.pts;
    const len = bodyFront - bodyBack;
    const thick = bodyLow - Math.min(...P0.map((p) => p[1]));
    // (a soft shade under the belly; the far side turning away along the bottom; a light along the
    // back behind her)
    const belly = (sk.belly = { c: W([mix(bodyBack, bodyFront, 0.45), bodyLow + thick * 0.15]), r: thick * 0.62 });
    const bellyShade = () => {
      ctx.save();
      ctx.translate(...belly.c);
      ctx.rotate(sk.bodyAng);
      ctx.scale(1.9, 1);
      glow(ctx, a, [0, 0], belly.r, C.sh, 0.9);
      ctx.restore();
    };
    sk.bellyShade = bellyShade;
    bellyShade();
    ctx.save();
    const lc = W([mix(bodyBack, bodyFront, 0.32), bodyLow - thick * 0.78]);
    ctx.translate(lc[0], lc[1]);
    ctx.rotate(sk.bodyAng);
    ctx.scale(2.1, 1);
    glow(ctx, a, [0, 0], thick * 0.42, C.lt, 0.85);
    ctx.restore();
    glow(ctx, a, W([bodyFront - len * 0.14, bodyLow - thick * 0.42]), thick * 0.32, C.lt, 0.45);
    // (the plates: faint guides across the back, coming in narrow at each end)
    ctx.strokeStyle = tone(a, C.guide);
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.6;
    for (const pl of sk.plates) {
      ctx.beginPath();
      ctx.moveTo(...pl[0]);
      ctx.quadraticCurveTo(...pl[1], ...pl[2]);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- Her: the torso, the neck and head, the arms ----------
  function drawTorso(ctx, a, mode) {
    const sk = a.sk;
    pathOf(ctx, [sk.torso]);
    if (mode === 'line') return outline(ctx);
    seam(ctx, a, [sk.torso], [...(sk.tailShapes ?? [])]);
    pathOf(ctx, [sk.torso]);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    pathOf(ctx, [sk.torso]);
    ctx.clip();
    const S = a.sS;
    const tcN = S.turnC;
    const tpN = S.turnP;
    const [shade, lit, pN, pF, ...cols] = sk.bands;
    // (the chest's light, sliding with its turn; the hips' light)
    glow(ctx, a, sk.torsoAt([halfAt(U.chest) * (0.3 + tcN * 0.3), U.chest - (U.chest - shY) * 0.45]), halfAt(U.chest) * 0.8, C.lt, 0.75);
    glow(ctx, a, sk.torsoAt([halfAt(-0.5) * (0.4 + tpN * 0.25), -0.3]), halfAt(-0.5) * 0.6, C.lt, 0.4);
    pathOf(ctx, [shade]);
    ctx.fillStyle = tone(a, C.sh);
    ctx.fill();
    ctx.globalAlpha = 0.75;
    pathOf(ctx, [pN]);
    ctx.fill();
    pathOf(ctx, [pF]);
    ctx.fill();
    ctx.globalAlpha = 1;
    pathOf(ctx, [lit]);
    ctx.fillStyle = tone(a, C.lt);
    ctx.fill();
    if (!(a.flash > 0)) {
      // (where the neck and the near arm come out of her, her light and shade ease to her plain
      // colour, the colour they are, so they meet her with no edge)
      const [br, bgc, bb] = rgb(C.base);
      const seat = (c, r, k0) => {
        const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
        gr.addColorStop(0, `rgba(${br},${bgc},${bb},1)`);
        gr.addColorStop(k0, `rgba(${br},${bgc},${bb},1)`);
        gr.addColorStop(1, `rgba(${br},${bgc},${bb},0)`);
        ctx.fillStyle = gr;
        ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
      };
      seat(sk.torsoAt([0, NK.base]), NK.w * 0.9, 0.4);
      seat(sk.arms.N.sh, AR.ball * 2.2, 0.56);
      // (toward her hips, fading to her plain colour, so she runs on into the body below with no edge)
      const g0 = sk.torsoAt([0, U.navel]);
      const g1 = sk.torsoAt([0, 0.6]);
      const gr = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]);
      gr.addColorStop(0, `rgba(${br},${bgc},${bb},0)`);
      gr.addColorStop(1, `rgba(${br},${bgc},${bb},1)`);
      ctx.fillStyle = gr;
      pathOf(ctx, [sk.torso]);
      ctx.fill();
    }
    // Construction lines: down the middle (its top turning with the chest, its foot with the hips),
    // across under the chest; the collarbones; all faint, like the head's.
    ctx.strokeStyle = tone(a, C.guide);
    ctx.lineWidth = 0.5;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.8;
    const top = U.stern + 1.4;
    const ys = Array.from({ length: 12 }, (_, i) => mix(top, U.navel + 1, i / 11));
    ctx.beginPath();
    ys.forEach((y, i) => {
      const k = ease((y - U.ribs) / Math.max(1, U.navel + 1 - U.ribs));
      const tt = tcN * (1 - k) + tpN * k;
      const p = sk.torsoAt([Math.sin(tt * 0.7) * halfAt(y) * 0.98, y]);
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    });
    ctx.stroke();
    const yc = U.chest;
    const hw = halfAt(yc);
    ctx.beginPath();
    let first = true;
    for (let i = 0; i <= 12; i++) {
      const th = -1.25 + (i / 12) * 2.5 + tcN * 0.7;
      if (Math.cos(th - tcN * 0.7) < -0.1) continue;
      const p = sk.torsoAt([Math.sin(th) * hw * 0.98, yc + Math.cos(th) * (yc - shY) * 0.12]);
      if (first) ctx.moveTo(...p);
      else ctx.lineTo(...p);
      first = false;
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = tone(a, C.sh);
    ctx.lineWidth = 0.45;
    for (const c of cols) {
      ctx.beginPath();
      c.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
      ctx.stroke();
    }
    ctx.restore();
  }
  // The neck: a tube from inside her chest up into the head, showing only where it comes up out of
  // her; a soft shadow under the chin.
  function drawNeck(ctx, a, mode) {
    const sk = a.sk;
    const base = sk.torsoAt([0, NK.base + 0.4]);
    const pts = strand([base, lerp2(base, sk.neckTop, 0.5), sk.neckTop], 3);
    const wl = pts.map(() => NK.w);
    ctx.beginPath();
    tubeInto(ctx, pts, wl);
    if (mode === 'line') return outline(ctx);
    ctx.save();
    outside(ctx, sk.torso);
    ctx.beginPath();
    tubeInto(ctx, pts, wl);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill('nonzero');
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    tubeInto(ctx, pts, wl);
    ctx.clip('nonzero');
    pathOf(ctx, [sk.torso]);
    ctx.strokeStyle = tone(a, C.base);
    ctx.lineWidth = 2.6;
    ctx.stroke();
    outside(ctx, sk.torso);
    ctx.save();
    ctx.translate(...sk.chin);
    ctx.rotate(sk.aH);
    ctx.scale(1, 0.4);
    glow(ctx, a, [0, NK.w * 0.25], NK.w * 0.55, C.sh, 0.7);
    ctx.restore();
    ctx.restore();
  }
  // The head: a bald mannequin head, round on top, the cheeks drawn in a little toward the chin, ears
  // at the sides; a soft shade on the far side, a light on the crown; faint guides: down the middle
  // and the eye line, sliding round as it turns.
  const headOutline = (sk) => {
    const n = 34;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const q = (i / n) * TAU - Math.PI / 2;
      const s = Math.sin(q);
      const low = Math.max(0, s);
      const kx = 1 - HD.jaw * 0.34 * low * low;
      const ky = 1 + HD.jaw * 0.08 * low;
      pts.push(add(sk.headC, rot([Math.cos(q) * HD.rx * kx, s * HD.ry * ky], sk.aH)));
    }
    return wound(pts);
  };
  const ears = (sk) => [-1, 1].map((s) => oval(add(sk.headC, rot([s * (HD.rx - 0.27), HD.ry * 0.12], sk.aH)), HD.ear[0], HD.ear[1], sk.aH, 16));
  function drawHead(ctx, a, mode) {
    const sk = a.sk;
    const head = headOutline(sk);
    const [earF, earN] = ears(sk);
    pathOf(ctx, [earF, earN, head]);
    if (mode === 'line') return outline(ctx);
    seam(ctx, a, [earF, earN, head], [...(sk.tailShapes ?? [])]);
    pathOf(ctx, [earF]);
    ctx.fillStyle = tone(a, C.sh);
    ctx.fill();
    pathOf(ctx, [earN]);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    for (const s of [-1, 1]) {
      pathOf(ctx, [oval(add(sk.headC, rot([s * (HD.rx - 0.13), HD.ry * 0.14], sk.aH)), HD.ear[0] * 0.5, HD.ear[1] * 0.6, sk.aH, 12)]);
      ctx.fillStyle = tone(a, C.sh);
      ctx.fill();
    }
    pathOf(ctx, [head]);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    pathOf(ctx, [head]);
    ctx.clip();
    const hp = (x, y) => add(sk.headC, rot([x * HD.rx, y * HD.ry], sk.aH));
    const S = a.sS;
    const turn = clamp(S.hT + S.turnC * 0.35, -0.9, 0.9);
    // (the far side's shade, a soft crescent; the crown's light)
    ctx.save();
    const sc = hp(-0.95 - turn * 0.25, 0.12);
    ctx.translate(...sc);
    ctx.rotate(sk.aH);
    ctx.scale(0.55, 1);
    glow(ctx, a, [0, 0], HD.ry * 0.95, C.sh, 0.75);
    ctx.restore();
    ctx.save();
    const lc = hp(-0.22 + turn * 0.2, -0.62);
    ctx.translate(...lc);
    ctx.rotate(sk.aH);
    ctx.scale(1.6, 0.55);
    glow(ctx, a, [0, 0], HD.rx * 0.42, C.lt, 0.95);
    ctx.restore();
    // guides: down the middle, and the eye line across, curving round the head as it turns
    ctx.strokeStyle = tone(a, C.guide);
    ctx.lineWidth = 0.55;
    ctx.lineCap = 'round';
    const mx = Math.sin(turn) * 0.92;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const y = -0.86 + (i / 10) * 1.8;
      const k = Math.sqrt(Math.max(0, 1 - y * y * 0.8));
      const p = hp(mx * k, y);
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    ctx.stroke();
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 16; i++) {
      const th = -1.35 + (i / 16) * 2.7 + turn;
      if (Math.cos(th - turn) < -0.05) continue;
      const p = hp(Math.sin(th) * 0.92, 0.2 + Math.cos(th) * 0.07);
      if (started) ctx.lineTo(...p);
      else ctx.moveTo(...p);
      started = true;
    }
    ctx.stroke();
    ctx.restore();
  }
  // An arm: one tube from a point inside the shoulder through the elbow to the wrist (the upper arm
  // full under the shoulder, the forearm fuller just below the elbow); its root and the shoulder's
  // round drawn plain in her colour, melting into her; a soft line inside its edge, so an arm over
  // her body still reads; the far arm a shade darker.
  function drawArm(ctx, a, mode, k) {
    const sk = a.sk;
    const A = sk.arms[k];
    const far = k === 'F';
    const [pts, wl] = along([A.root, A.sh, lerp2(A.sh, A.el, 0.42), A.el, lerp2(A.el, A.wr, 0.3), A.wr], [AR.w0 * 0.9, AR.w0, AR.w0 * 0.94, AR.ew, AR.ew * 1.06, AR.w1], 4);
    pts.unshift(A.sh);
    wl.unshift(AR.ball * 2);
    let rootN = 6;
    while (rootN < pts.length - 2 && Math.hypot(pts[rootN][0] - A.sh[0], pts[rootN][1] - A.sh[1]) < AR.ball * 0.92) rootN++;
    ctx.beginPath();
    tubeInto(ctx, pts, wl);
    if (mode === 'line') return outline(ctx);
    const body = tone(a, far ? C.sh : C.base);
    // (a soft line where it crosses in front of the tail)
    if (sk.tailShapes?.length) {
      ctx.save();
      pathOf(ctx, sk.tailShapes);
      ctx.clip('nonzero');
      ctx.beginPath();
      tubeInto(ctx, pts.slice(rootN - 1), wl.slice(rootN - 1));
      ctx.strokeStyle = tone(a, SEAM);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    const n0 = rootN - 1;
    const op = pts.slice(n0);
    const ow = wl.slice(n0);
    ctx.beginPath();
    tubeInto(ctx, op, ow);
    ctx.fillStyle = tone(a, far ? C.deep : C.sh);
    ctx.fill('nonzero');
    ctx.beginPath();
    tubeInto(ctx, op, ow, -0.55);
    ctx.fillStyle = body;
    ctx.fill('nonzero');
    ctx.beginPath();
    tubeInto(ctx, pts.slice(0, rootN), wl.slice(0, rootN));
    ctx.fill('nonzero');
    // (a shade down each bone's underside, a light down the near arm's top, fading out at the joints)
    ctx.save();
    ctx.beginPath();
    tubeInto(ctx, op, ow, -0.55);
    ctx.clip('nonzero');
    for (const [p0, p1, w0, w1] of [[A.sh, A.el, AR.w0, AR.ew], [A.el, A.wr, AR.ew, AR.w1]]) {
      const d = sub(p1, p0);
      const L = Math.hypot(d[0], d[1]) || 1;
      let nx = -d[1] / L;
      let ny = d[0] / L;
      const dd = nx * -0.42 + ny * 0.91;
      if (dd < 0) {
        nx = -nx;
        ny = -ny;
      }
      const fade = ease(Math.abs(dd) / 0.3);
      const q0 = lerp2(p0, p1, 0.12);
      const q1 = lerp2(p0, p1, 0.9);
      ctx.globalAlpha = fade;
      ctx.beginPath();
      tubeInto(ctx, [[q0[0] + nx * w0 * 0.3, q0[1] + ny * w0 * 0.3], [q1[0] + nx * w1 * 0.3, q1[1] + ny * w1 * 0.3]], [w0 * 0.3, w1 * 0.36]);
      ctx.fillStyle = tone(a, far ? C.deep : C.sh);
      ctx.fill('nonzero');
      if (!far) {
        ctx.beginPath();
        tubeInto(ctx, [[q0[0] - nx * w0 * 0.3, q0[1] - ny * w0 * 0.3], [q1[0] - nx * w1 * 0.3, q1[1] - ny * w1 * 0.3]], [w0 * 0.12, w1 * 0.12]);
        ctx.fillStyle = tone(a, C.lt);
        ctx.fill('nonzero');
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  // A hand: a mitten with a thumb, turned at the wrist, a soft shade under it.
  function drawHand(ctx, a, mode, k) {
    const sk = a.sk;
    const A = sk.arms[k];
    const far = k === 'F';
    ctx.save();
    ctx.translate(...A.wr);
    ctx.rotate(A.ang);
    const c = [0, AR.hr * 0.9];
    ctx.beginPath();
    for (const [x, y, rx, ry] of [[c[0], c[1], AR.hr, AR.hr * 0.95], [c[0] + AR.hr * 0.71, c[1] - AR.hr * 0.33, AR.hr * 0.4, AR.hr * 0.38]]) {
      ctx.moveTo(x + rx, y);
      ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    }
    if (mode === 'line') {
      outline(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = tone(a, far ? C.deep : C.sh);
    ctx.fill();
    ctx.beginPath();
    for (const [x, y, rx, ry] of [[c[0], c[1], AR.hr - 0.5, AR.hr * 0.95 - 0.5], [c[0] + AR.hr * 0.71, c[1] - AR.hr * 0.33, Math.max(0.2, AR.hr * 0.4 - 0.5), Math.max(0.2, AR.hr * 0.38 - 0.5)]]) {
      ctx.moveTo(x + rx, y);
      ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    }
    ctx.fillStyle = tone(a, far ? C.sh : C.base);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(c[0] - AR.hr * 0.14, c[1] + AR.hr * 0.36, AR.hr * 0.54, AR.hr * 0.3, 0, 0, TAU);
    ctx.fillStyle = tone(a, far ? C.deep : C.sh);
    ctx.fill();
    ctx.restore();
  }

  // ---------- Effects: sparkles on a hit, the spell's light, the sand wave, dust, speed lines ----------
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
  const puff = (ctx, x, y, r, al, sand = false) => {
    ctx.globalAlpha = al;
    ctx.fillStyle = sand ? '#f6eedd' : '#f3eefa';
    ctx.strokeStyle = sand ? '#e3d4b6' : '#d6cbe6';
    ctx.lineWidth = Math.max(0.4, r * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
  };
  const orb = (ctx, x, y, r) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)');
    gr.addColorStop(0.45, 'rgba(226,206,255,0.75)');
    gr.addColorStop(1, 'rgba(200,170,255,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  };
  function drawFx(ctx, m, a) {
    const sk = a.sk;
    const mv = a.sMove?.mv;
    const t = a.sMove?.t ?? 0;
    const st = a.mo.rig;
    if (!mv) {
      st.sOrb = null;
      return;
    }
    ctx.save();
    for (const s0 of mv.spark ?? []) {
      const k = after(s0, t, 0.24);
      if (k < 0) continue;
      const [x, y] = sk.spots[mv.sparkAt] ?? sk.spots.hands;
      const e = 1 - (1 - k) ** 3;
      ctx.globalAlpha = 1 - k;
      sparkle(ctx, x, y, H * 0.1 * (0.5 + 0.7 * e), k * 0.8, '#ffffff');
      sparkle(ctx, x, y, H * 0.05 * (0.5 + 0.7 * e), k * 0.8 + 0.4, '#fff2a8');
      for (let j = 0; j < 4; j++) {
        const q = (j * TAU) / 4 + 0.6;
        sparkle(ctx, x + Math.cos(q) * H * 0.13 * e, y + Math.sin(q) * H * 0.13 * e, H * 0.025, q, j % 2 ? '#ffc8de' : '#fff6c8');
      }
    }
    // a spell gathering in her hands: a soft pulsing light, sparkles circling in; then thrown on
    if (mv.glow && t >= mv.glow[0] && t <= mv.glow[1]) {
      const k = Math.max(0, Math.min(1, (t - mv.glow[0]) / 0.15, (mv.glow[1] - t) / 0.08));
      const [gx, gy] = add(sk.spots.hands, [H * 0.03, 0]);
      const rr = H * 0.1 * (1 + 0.12 * Math.sin(a.now * 24));
      ctx.globalAlpha = k;
      orb(ctx, gx, gy, rr);
      for (let i = 0; i < 3; i++) {
        const an = a.now * 5 + (i * TAU) / 3;
        const d = rr * (1.5 - ((a.now * 1.5 + i / 3) % 1) * 0.9);
        sparkle(ctx, gx + Math.cos(an) * d, gy + Math.sin(an) * d, H * 0.022, an, '#fff6c8');
      }
    }
    for (const b0 of mv.burst ?? []) {
      const k = after(b0, t, 0.5);
      if (k < 0) {
        st.sOrb = null;
        continue;
      }
      st.sOrb ??= add(sk.spots.hands, [H * 0.05, 0]);
      const [bx, by] = st.sOrb;
      const e = 1 - (1 - Math.min(1, k * 2.2)) ** 3;
      if (k < 0.45) {
        ctx.globalAlpha = 1 - k / 0.45;
        for (let i = 0; i < 8; i++) {
          const an = (i * TAU) / 8 + 0.3;
          sparkle(ctx, bx + Math.cos(an) * H * 0.2 * e, by + Math.sin(an) * H * 0.2 * e, H * 0.035, an, i % 2 ? '#e8d8ff' : '#fff2b8');
        }
      }
      const ox = bx + H * 2.2 * ease(k);
      ctx.globalAlpha = Math.min(1, (1 - k) * 3);
      orb(ctx, ox, by, H * 0.09);
      for (let i = 1; i < 4; i++) sparkle(ctx, ox - i * H * 0.07, by + Math.sin(a.now * 30 + i) * H * 0.02, H * 0.026 * (1 - i * 0.2), a.now * 8 + i, '#fff6c8');
    }
    // the sand wave: a soft crest of sand rolling out ahead along the ground (and a little behind),
    // rising and settling, a few sparkles lifting off it
    for (const s0 of mv.sand ?? []) {
      const k = after(s0, t, 0.6);
      if (k < 0) continue;
      const x0 = sk.spots.front[0];
      for (const dir of [1, -0.45]) {
        const reach = H * (0.15 + 1.0 * ease(k)) * Math.abs(dir);
        for (let i = 0; i < 6; i++) {
          const q = i / 5;
          const x = x0 + Math.sign(dir) * (reach - q * H * 0.32 * Math.abs(dir));
          const rise = Math.sin(Math.PI * Math.min(1, k * 1.3)) * (1 - q * 0.55);
          const r = H * (0.06 + 0.05 * rise) * (1 - q * 0.4) * Math.abs(dir) ** 0.4;
          puff(ctx, x, -r * 0.6 - H * 0.05 * rise, r, 0.92 * Math.min(1, (1 - k) * 1.6) * (1 - q * 0.35), true);
        }
      }
      ctx.globalAlpha = Math.max(0, 1 - k * 1.3);
      for (let i = 0; i < 3; i++) sparkle(ctx, x0 + H * (0.25 + i * 0.22) * ease(k), -H * (0.12 + 0.1 * i) * Math.sin(Math.PI * Math.min(1, k * 1.2)), H * 0.03, k * 4 + i, '#fff6d8');
    }
    for (const [d0, where] of mv.dust ?? []) {
      const k = after(d0, t, 0.42);
      if (k < 0) continue;
      const gx = (sk.spots[where] ?? sk.spots.feet)[0];
      const e = 1 - (1 - k) ** 2;
      for (let i = 0; i < 4; i++) {
        const dir = i < 2 ? -1 : 1;
        puff(ctx, gx + dir * H * (0.06 + (i % 2) * 0.07) * (0.5 + e), -H * (0.02 + (i % 2) * 0.015) - e * H * 0.04, H * (0.03 + (i % 2) * 0.012) * (0.6 + 0.6 * e), (1 - k) * 0.85);
      }
    }
    if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
      const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
      ctx.globalAlpha = 0.7 * (1 - k);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(0.5, H * 0.02);
      for (let i = 0; i < 4; i++) {
        const y = -H * (0.15 + i * 0.15);
        const x0 = sk.hipW[0] + bodyBack - H * (0.08 + 0.1 * k);
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
    const MV = SCORPTAUR_MOVES;
    if (m.act && MV[m.act.name]) {
      const mv = MV[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + lastKey(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    // An attack: the next move off its list, picked as it starts winding up.
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.sAtk) {
        const pool = m.def.moves ?? P.moves;
        st.sN = (st.sN ?? m.uid) + 1;
        st.sPick = m.move ?? pool[st.sN % pool.length];
      }
      st.sAtk = true;
      const mv = MV[st.sPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.sAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lastKey(MV.hurt)) return [MV.hurt, a.hurtAgo, 1];
    const happy = MV.flick;
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < happy.anticT + lastKey(happy)) return [happy, gl - happy.anticT, gl < happy.anticT ? gl / happy.anticT : 1];
    if (m.hp > 0 && m.cine?.mood === 'happy') {
      const span = happy.anticT + lastKey(happy) + 0.5;
      const T = (a.now % span) - happy.anticT;
      return [happy, T, T < 0 ? 1 + T / happy.anticT : 1];
    }
    return [null, 0, 0];
  }
  const seq = [
    ['tail', drawTail],
    ['legsFar', drawLegsFar],
    ['armF', (ctx, a, mode) => drawArm(ctx, a, mode, 'F')],
    ['handF', (ctx, a, mode) => drawHand(ctx, a, mode, 'F')],
    ['torso', drawTorso],
    ['body', drawBody],
    ['legsNear', drawLegsNear],
    ['neck', drawNeck],
    ['head', drawHead],
    ['armN', (ctx, a, mode) => drawArm(ctx, a, mode, 'N')],
    ['handN', (ctx, a, mode) => drawHand(ctx, a, mode, 'N')],
  ];
  const parts = [
    ...seq.map(([name, draw]) => ({ name, parent: null, at: () => [0, 0], pivot: [0, 0], s: NOTHING, paint: (ctx, a) => draw(ctx, a, 'line') })),
    ...seq.map(([name, draw]) => ({ name: `${name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: NOTHING, paint: (ctx, a) => draw(ctx, a, 'fill') })),
  ];
  const RW = Math.ceil((bodyFront - bodyBack) * 2.4 + 40);
  const RH = Math.ceil(H * 2.3 + 10);
  const springs = {};
  for (const c of CH) springs[c] = [170, 21];
  for (const c of ['shN', 'elN', 'shF', 'elF']) springs[c] = [160, 16];
  for (const c of ['hwN', 'hwF']) springs[c] = [200, 18];
  for (const c of ['neck', 'head', 'hT']) springs[c] = [120, 15];
  for (const c of ['tR', 'tC', 'tX', 'tS', 'tW']) springs[c] = [130, 17];
  springs.tY = [110, 17];
  springs.fall = [150, 19];
  const rig = makeRig({
    w: RW,
    h: RH,
    soft: true,
    stride: cycle,
    recover: 1.4,
    springs,
    walkStiff: { tilt: [260, 30], pelvis: [260, 30], waist: [260, 30], chest: [260, 30], shN: [240, 28], shF: [240, 28], turnC: [240, 28], turnP: [240, 28] },
    fast: CH.filter((c) => !['hT', 'tW'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.sActive),
    kick: { tilt: -60, head: 50, tW: -70 },
    turnKick: { tilt: 30, tW: 60 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.3;
      const calm = (1 - a.walkW) * (a.calm ?? 1);
      const u = st.sU ?? 0;
      // Standing about: breathing (the chest and the shoulders, never the whole body); the weight
      // shifting; now and then a glance back, a hand on the hip, a long stretch; a leg tapping; the
      // tail swaying and, now and then, twitching.
      const breath = Math.sin(t * 1.5);
      const shift = Math.sin(t * 0.45);
      // (her front turned a little the way she goes: a three-quarter view, her guides slid forward)
      const TQ = 0.24;
      const glance = hold(t % 9.5, 4, 4.6, 6.1, 6.8) * calm;
      const stretch = hold(t % 23, 12.5, 13.8, 15, 16.4) * calm;
      const onHip = hold(t % 17, 2, 2.9, 8.4, 9.4) * calm * (1 - stretch);
      const twitch = (hold(t % 5.9, 3, 3.08, 3.14, 3.34) - 0.6 * hold(t % 5.9, 3.34, 3.42, 3.46, 3.7)) * calm;
      a.sTwitch = twitch;
      const tapK = hold(t % 7.3, 4, 4.1, 4.16, 4.3) + hold(t % 7.3, 4.42, 4.52, 4.58, 4.74);
      a.sTap = [Math.floor(t / 7.3) % 3, tapK * calm];
      const idle = {
        x: 0, hop: 0, lift: breath * 0.08, crouch: 0.03 + shift * 0.02, pitch: Math.sin(t * 0.5) * 0.5, fall: 0,
        tilt: 1 + shift * 0.6, pelvis: shift * 1.6, waist: -shift * 1.2, chest: -shift * 0.6 - breath * 0.8, turnC: TQ + shift * 0.06 - glance * 0.18, turnP: TQ * 0.7 - shift * 0.05, neck: -breath * 0.4 - glance * 2.6, head: breath * 0.3 - glance * 4.2, hT: TQ - glance * 0.8,
        shN: P.hang[0] - breath * 1.2, elN: P.hang[1] - breath, hwN: 4 + breath, shF: -P.hang[0] * 0.4 + 4 + breath * 1.2, elF: P.hang[1] * 0.8 + breath, hwF: -4 - breath, shrugN: 0.8 + breath * 1.3, shrugF: 0.8 + breath * 1.3, reachN: 0, reachF: 0,
        tR: 0.12 + breath * 0.03, tC: 0, tX: 0, tS: 0, tY: 0, tW: Math.sin(t * 0.7) * 3,
        fold: 0, tuck: 0, wave: 0, stamp: 0,
      };
      // (a hand on the hip; a stretch, both arms up, the back arching)
      const lay = (o, p, k) => {
        for (const [c, v] of Object.entries(p)) o[c] = mix(o[c], v, k);
      };
      lay(idle, { shN: -34, elN: 62, hwN: -40, turnC: -0.12, pelvis: -2.5, waist: 2, head: 1 }, onHip);
      lay(idle, { shN: -168, elN: -18, hwN: -10, shF: -162, elF: -20, hwF: -10, chest: -6, waist: -4, tilt: -3, head: -9, neck: -3, shrugN: 9, shrugF: 9, tR: 0.45 }, stretch);
      // Walking: she rides the scuttle, swaying a little with each tripod, the arms swinging softly.
      const sw = Math.sin(TAU * u * 2 - 0.9);
      const sa = Math.sin(TAU * u);
      const walk = {
        ...idle,
        x: 0, lift: 0, crouch: 0, pitch: 0, tilt: 3 + sw * 0.8, pelvis: sw * 1.2, waist: -sw * 1.4, chest: -sw * 0.6, turnC: TQ - sa * 0.1, turnP: TQ * 0.7 + sa * 0.07, neck: -1, head: -1 + sw * 0.4, hT: TQ,
        shN: P.hang[0] + sa * 10, elN: P.hang[1] - 6 - Math.max(0, sa) * 8, hwN: 6, shF: 4 - sa * 10, elF: P.hang[1] * 0.6 + Math.max(0, -sa) * 8, hwF: -6, shrugN: 1.2 + sa * 0.8, shrugF: 1.2 - sa * 0.8,
        tR: 0.16, tW: 0,
      };
      const [mv, mt, windW] = moveNow(m, a, st);
      const base = {};
      for (const c of CH) base[c] = mix(idle[c], walk[c], a.walkW);
      base.x /= H;
      base.hop /= H;
      const out = mv ? keyed(mv, mt, windW, base) : { ...base };
      if (mv === SCORPTAUR_MOVES.sting && P.bow !== 1) for (const c of ['tilt', 'waist', 'chest', 'neck', 'head', 'crouch']) out[c] = base[c] + (out[c] - base[c]) * P.bow;
      // Poses; asleep (a nap); beaten; a cutscene's mood.
      const nap = m.habit?.kind === 'nap' && a.now < (m.habit.until ?? 0) && m.hp > 0;
      const slow = Math.sin(t * 0.9);
      const pose = nap ? 'sleep' : m.pose;
      // (sitting, resting and asleep, the tail lies along the ground and round the far side of her body)
      const lie = { tR: 0, tS: 1, tC: 0, tX: 0, tW: 0 };
      if (pose === 'sit') Object.assign(out, lie, { crouch: 1, fold: 1, lift: 0, pitch: 0, tilt: 3, waist: 1, head: 3 + breath * 0.3, shN: -26, elN: -46, hwN: -10, shF: -20, elF: -44, hwF: -10, tY: 72 });
      else if (pose === 'rest') Object.assign(out, lie, { crouch: 1, fold: 1, lift: 0, pitch: 0, tilt: -4, waist: -2, head: -3 + breath * 0.3, neck: -2, shN: -20, elN: -40, shF: 32, elF: 12, hwF: -50, tY: 70 });
      else if (pose === 'sleep') Object.assign(out, lie, { crouch: 1, fold: 1, lift: slow * 0.12, pitch: 0, tilt: 20 + slow * 1.2, pelvis: 2, waist: 8, chest: 6 + slow * 1.5, neck: 8, head: 26, hT: 0.1, turnC: 0, shN: -78, elN: -108, hwN: -10, shF: -72, elF: -104, hwF: -10, shrugN: 4 + slow * 1.5, shrugF: 4 + slow * 1.5, tY: 78 });
      if (m.hp <= 0) Object.assign(out, lie, { crouch: 1, fold: 0.8, tuck: 0, wave: 0, fall: 0, pitch: 0, tilt: 26, waist: 10, chest: 4, neck: 6, head: 22, shN: -12, elN: -12, shF: -6, elF: -8, tY: 20, stamp: 0 });
      else if (!mv && m.cine?.mood === 'sad') Object.assign(out, { crouch: 0.45, tilt: 10, head: 14, neck: 4, shN: -10, elN: -30, shF: -6, elF: -26, tR: -0.2, tS: 0.35 });
      else if (!mv && m.cine?.mood === 'angry') Object.assign(out, { tR: 1, tC: 0.2, shN: -32, elN: -92, shF: -28, elF: -90, tilt: 4, crouch: 0.15 });
      st.sActive = Boolean(mv);
      a.sMove = mv ? { mv, t: mt } : null;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = out.x * H;
      res.hop = out.hop * H;
      res.elN = clamp(res.elN, -150, 150);
      res.elF = clamp(res.elF, -150, 150);
      // The shoulders follow the arms: an arm raised past the shoulder lifts its collarbone; an arm
      // reaching ahead brings its shoulder forward and turns the chest into it, the hips a little
      // against it; so a strike comes from the shoulder and the body.
      const set = Boolean(pose) || m.hp <= 0;
      const raise = (v) => ease((Math.abs(v) - 55) / 125);
      res.shrugN += 14 * raise(res.shN);
      res.shrugF += 14 * raise(res.shF);
      const ext = (el) => 1 - Math.min(1, Math.abs(el) / 130);
      const fwdN = Math.max(0, -Math.sin(res.shN * D2R)) * (0.4 + 0.6 * ext(res.elN));
      const backN = Math.max(0, Math.sin(res.shN * D2R));
      const fwdF = Math.max(0, -Math.sin(res.shF * D2R)) * (0.4 + 0.6 * ext(res.elF));
      if (!set) {
        res.reachN += H * (0.03 * fwdN - 0.018 * backN);
        res.reachF += H * 0.022 * fwdF;
        const turn = 0.38 * fwdN - 0.3 * backN - 0.18 * fwdF;
        res.turnC = clamp(res.turnC + turn, -0.85, 0.85);
        res.turnP = clamp(res.turnP - turn * 0.35, -0.6, 0.6);
      }
      // Follow-through: a hand trails its arm's swing at the wrist and snaps through after it; the
      // neck and the head trail the chest's turn a beat.
      const vel = (n) => st[n]?.v ?? 0;
      res.hwN += clamp(-(vel('shN') + vel('elN')) * 0.02, -18, 18);
      res.hwF += clamp(-(vel('shF') + vel('elF')) * 0.02, -18, 18);
      const chestV = vel('tilt') * 0.4 + vel('pelvis') + vel('waist') * 0.45 + vel('chest');
      res.neck += clamp(-chestV * 0.012, -6, 6);
      res.head += clamp(-chestV * 0.02, -9, 9);
      return res;
    },
    under: (ctx, m, a, S) => {
      a.sS = S;
      a.sk = skeleton(S, a, m);
    },
    parts,
    fx: (ctx, m, a) => drawFx(ctx, m, a),
  });
  // (a still for the Monster Book: the body, her, the tail, plain)
  const still = () => {
    const gx = RW / 2;
    const gy = RH - 2;
    const [hx, hy] = P.seat;
    return {
      w: RW,
      h: RH,
      res: 3,
      shapes: [
        E(gx + P.body.tail[0] - 3, gy + P.body.tail[1] - 10, TL.w[0] * 0.6, 10, C.sh),
        E(gx + P.body.c[0], gy + P.body.c[1], (bodyFront - bodyBack) / 2, (bodyLow - Math.min(...P.body.pts.map((p) => p[1]))) / 2, C.base),
        E(gx + hx, gy + hy + U.ribs, shW, -U.stern / 2, C.base),
        E(gx + hx, gy + hy + NK.top + HD.c, HD.rx, HD.ry, C.base),
      ],
    };
  };
  return { rig, still, stride: cycle, speed: walkSpeed, H, w: Math.round((bodyFront - bodyBack) * 1.05), h: Math.round(H * 1.05), moves: P.moves };
}

export const SCORPTAUR_ARTS = {};
export const SCORPTAUR_DEFS = {};
for (const kind of SCORPTAUR_KINDS) {
  const r = scorptaurRig(kind);
  SCORPTAUR_ARTS[`blank_${kind}`] = { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig };
  SCORPTAUR_DEFS[kind] = { id: `blank_${kind}`, name: `Blank ${kind}`, art: `blank_${kind}`, w: r.w, h: r.h, speed: r.speed, hp: 100, fight: { windup: 0.5 }, bodyH: r.H, moves: r.moves };
}
