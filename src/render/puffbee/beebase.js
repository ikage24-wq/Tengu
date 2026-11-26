// The Puffbee's bee (2026-11-25): a copy of the round bug base (blankbug.js, its bee), kept here so
// the base itself stays clean for future builds (the player: "never edit the bases just copy the
// base and edit that"). What this copy adds: a dress, `look`, for a monster on it:
//   look.C      its own colours over the base's (lt, base, sh, deep, wing, wingRim, wingFar, ...)
//   look.P      its own shape over the bee's (body, head, sting, wing, ant, legs, leg, ...)
//   look.ink    its own soft outline colour (never near-black)
//   look.face   (ctx, a, sk, K) its own eyes and mouth, drawn in the head's frame (about its middle,
//               the face to the right; the base's guides are gone)
//   look.over   { part: (ctx, a, mode, K) } drawn over a part, in both passes (mode 'line': its
//               outline, 'fill': itself), so anything added keeps the outer-outline-only look;
//               parts: legF0, legF1, wingFH, wingFF, antF, sting, legN1, legN0, body, wingNH,
//               wingNF, antN, head, legN0o
//   look.under  the same, under a part
//   look.pose   (m, a, out, K, mv, mt) its own idle act and extras on top of the base's channels
//   look.fx     (ctx, m, a, S, K) live extras over everything
//   look.moves  its own moves over the base's (same form as the base's)
//   look.quietIdle  true: the base's own face rub and buzzing surge left out of its hovering
//   a.bgHold, a.bgHoldF  (set in look.pose) { k, at: [x, y] head frame }: the near / far front foot
//               held up there (a letter to read, a salute), the near one drawn over the body
// K, the kit handed to them: the skeleton is a.bk (pivot, th, at(p), hc, ha, r, wings, legs, ant,
// sting, bodyPts, spots, land, groom); C, P, H, sc, colour, tint, edge, bloom, twinkle, softPuff,
// headFrame(ctx, a), bodyFrame(ctx, a) (the body's own units: at(p)'s frame), bodyPath(ctx, a),
// wingPath(ctx, W), the curve helpers; moves (the base's and its own), poseAt, hold, chase.
//
// The base's own notes follow.
// (base) The round bug base (2026-11-25): blank chibi mascot insects to design little bug monsters on,
// made for bugs from the start, nothing carried over from another base; only the engine is shared
// (rig.js's springs and live parts). Cute, never gross (the player's rule): round soft shapes, no
// realistic bug detail, no stripes, spots, eyes or costume; a plain lilac mannequin with soft
// construction guides. Drawn live like the other blank bases: smooth shapes over its bones,
// outlined only on its outer edge (an outline pass, then a fill pass over it), in a soft ink.
// Every limb, wing and feeler grows out from inside the body it belongs to and is drawn under it,
// so no root ever shows.
//
// Three bodies, side on, facing right (units: game px at scale 1; x forward, y down):
//   bee          a round soft body, a rounder head on the front of it, a soft stinger nub; two small
//                round wings on the back that buzz (a smooth beat with a pale blur over its sweep,
//                each wing turning edge-on mid-stroke), folding back flat along the back when it
//                lands; two feelers with round tips, each two bones on springs that swing with the
//                head's travel and twitch on their own; four stubby legs tucked under, hanging and
//                trailing back in flight, standing when it lands. Always flying (`fly: true`): a
//                slow hover bob and drift, leaning into its travel and its speeding up.
//   ladybug      a round domed shell over a soft belly and a little chest, a small head tucked under
//                the shell's front; six stubby legs under the shell walking in two tripods (the
//                step's phase from the distance walked, so no foot slides); moving fast, the two
//                shell halves lift on their hinge and the folded wings under them open out (each
//                wing two panels, the tip folding over) and beat, and it flies, nose up.
//   caterpillar  a chain of five round segments and a bigger round head; it crawls by a hump rising
//                and travelling up the body from tail to head (each segment lifts and steps forward
//                only while the hump is under it, so nothing slides); moving fast it loops like an
//                inchworm (the tail drawn up to the head in a tall arch, then the front reaching on);
//                it curls round into a ball (`curl`) and rolls (its turn from the distance rolled),
//                rears its front up (`rear`), bunches into an arch (`arch`); little nub feet under
//                each segment, two small feelers.
// Moves (BUG_MOVES[kind]): bee: sting jab (reared back, swung under and in), dive bomb, buzz dash,
// pollen puff, waggle dance when pleased; ladybug: shell bash, shell spin (a hop and a rolling
// turn), hop slam (shell up, a short flight, down on its target), backflip knockdown (onto its
// shell, legs paddling, rocking, flipping back over), shell flutter when pleased; caterpillar:
// head bonk, roll up and roll in (bouncing off, rolling back), rear-up slam, happy wiggle; each
// with jump, dash, dodge, hurt, knockdown. Poses (m.pose): rest (landed, wings folded; lying
// flat), groom (rubbing its front legs over its face and feelers), sleep; a nap habit sleeps.

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { hold } from '../mobs/kidrig.js';
import { E } from '../mobs/kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C0 = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299', wing: '#f8f6fd', wingRim: '#e2dbee', wingFar: '#ece7f5' };

// ---------- Little helpers (this base's own) ----------
const ease = (u) => {
  const v = u < 0 ? 0 : u > 1 ? 1 : u;
  return v * v * (3 - 2 * v);
};
const mixN = (a, b, u) => a + (b - a) * u;
const mixP = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
const plus = (p, q) => [p[0] + q[0], p[1] + q[1]];
const turn = ([x, y], r) => {
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [x * c - y * s, x * s + y * c];
};
const polar = (p, ang, len) => [p[0] + Math.cos(ang) * len, p[1] + Math.sin(ang) * len];
const frac = (x) => x - Math.floor(x);
const rgbOf = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
// (the soft ink: the old outline lifted well toward the lilac, a deep soft plum, never near-black)
const LINE = '#7f6982'; // (the bases' shared soft ink, as the deertaur's)
const hash = (n, uid) => frac(Math.sin(n * 91.345 + (uid % 89) * 47.853) * 24634.6345);
// (a slow look about: held, then eased to the next, at its own pace)
const glance = (uid, t, per) => {
  const b = Math.floor(t / per);
  return mixN(hash(b - 1, uid), hash(b, uid), ease(frac(t / per) / 0.24)) * 2 - 1;
};

// A smooth closed curve through the points (Catmull-Rom), `steps` points per span.
function loopCurve(pts, steps = 4) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n];
    const b = pts[i];
    const c = pts[(i + 1) % n];
    const d = pts[(i + 2) % n];
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
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
const addLoop = (ctx, pts) => {
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
};
const pathOf = (ctx, pts) => {
  ctx.beginPath();
  addLoop(ctx, pts);
};
const addDisc = (ctx, x, y, r) => {
  ctx.moveTo(x + r, y);
  ctx.arc(x, y, Math.max(0.05, r), 0, TAU);
};
const addOval = (ctx, x, y, rx, ry, rot) => {
  ctx.moveTo(x + Math.cos(rot) * rx, y + Math.sin(rot) * rx);
  ctx.ellipse(x, y, Math.max(0.05, rx), Math.max(0.05, ry), rot, 0, TAU);
};
// A round-jointed limb: a disc at each joint and a band between each two, all wound the same way,
// so it fills as one shape.
function addLimb(ctx, pts, ws, grow = 0) {
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const r = Math.max(0.05, ws[i] / 2 + grow);
    addDisc(ctx, x, y, r);
    if (!i) continue;
    const [px, py] = pts[i - 1];
    const pr = Math.max(0.05, ws[i - 1] / 2 + grow);
    const d = Math.hypot(x - px, y - py) || 1;
    const nx = (py - y) / d;
    const ny = (x - px) / d;
    ctx.moveTo(px - nx * pr, py - ny * pr);
    ctx.lineTo(x - nx * r, y - ny * r);
    ctx.lineTo(x + nx * r, y + ny * r);
    ctx.lineTo(px + nx * pr, py + ny * pr);
    ctx.closePath();
  }
}
// (the hit flash lifts every colour toward white)
const flashRgb = (a, col) => {
  const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
  return rgbOf(col).map((v) => Math.round(v + (255 - v) * k));
};
const tone = (a, col) => `rgb(${flashRgb(a, col).join(',')})`;
function bloom(ctx, a, p, r, col, k) {
  if (!(r > 0.05)) return;
  const [cr, cg, cb] = flashRgb(a, col);
  const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
  g.addColorStop(0, `rgba(${cr},${cg},${cb},${k})`);
  g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
}
function ink(ctx) {
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}
// A spring value kept in `F` under `key`: eases to its goal with a little overshoot, in small steps.
function chase(F, key, goal, k, c, dt) {
  const f = (F[key] ??= { x: goal, v: 0 });
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt / 0.006));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      f.v += ((goal - f.x) * k - f.v * c) * h;
      f.x += f.v * h;
    }
  }
  if (!Number.isFinite(f.x)) Object.assign(f, { x: goal, v: 0 });
  return f.x;
}
// How a point is being pushed about in the world: its acceleration (smoothed over a few frames, so
// a landing is a firm push, never a one-frame kick), with the distance walked added, so travelling
// counts too. Starts again when the creature turns round.
function pushOf(F, key, p, dt, flip, odo) {
  const T = (F[key] ??= {});
  const wx = p[0] + odo;
  const wy = p[1];
  if (T.x !== undefined && dt > 0 && T.flip === flip && Math.abs(wx - T.x) < 30) {
    const vx = (wx - T.x) / dt;
    const vy = (wy - T.y) / dt;
    if (T.vx !== undefined) {
      const f = Math.min(1, dt * 18);
      T.ax = mixN(T.ax ?? 0, clamp((vx - T.vx) / dt, -900, 900), f);
      T.ay = mixN(T.ay ?? 0, clamp((vy - T.vy) / dt, -900, 900), f);
    }
    T.vx = vx;
    T.vy = vy;
  } else Object.assign(T, { vx: undefined, ax: 0, ay: 0 });
  Object.assign(T, { x: wx, y: wy, flip });
  return [T.ax ?? 0, T.ay ?? 0];
}
// How fast an angle is being turned about (its angular acceleration, smoothed).
function spinOf(F, key, ang, dt) {
  const T = (F[key] ??= { a: ang, w: 0, al: 0 });
  if (dt > 0) {
    const w = (ang - T.a) / dt;
    T.al = mixN(T.al, clamp((w - T.w) / dt, -400, 400), Math.min(1, dt * 18));
    T.w = w;
  }
  T.a = ang;
  return T.al;
}
// A feeler: two bones on springs, the base turning in the head, the tip in the base. Each lags the
// head's travel and turning (the push across it), overshoots and settles; never past its stops.
const ANT_K = [230, 18, 190, 13];
function feelerSim(F, key, g1, g2, ha, acc, spin, lens, dt) {
  const A = (F[key] ??= { a1: g1, v1: 0, a2: g2, v2: 0 });
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    const across = (ang, len) => (-(Math.cos(ang) * acc[1] - Math.sin(ang) * acc[0]) * 0.55) / Math.max(1, len);
    for (let i = 0; i < n; i++) {
      const w1 = ha + A.a1;
      A.v1 += (ANT_K[0] * (g1 - A.a1) - ANT_K[1] * A.v1 + across(w1, lens[0] + lens[1] * 0.7) - spin * 0.6) * h;
      A.v2 += (ANT_K[2] * (g2 - A.a2) - ANT_K[3] * A.v2 + across(w1 + A.a2, lens[1]) * 1.2 - spin * 0.3) * h;
      A.a1 += A.v1 * h;
      A.a2 += A.v2 * h;
      if (Math.abs(A.a1 - g1) > 0.7) A.a1 = g1 + Math.sign(A.a1 - g1) * 0.7;
      if (Math.abs(A.a2 - g2) > 0.9) A.a2 = g2 + Math.sign(A.a2 - g2) * 0.9;
    }
    if (!Number.isFinite(A.a1 + A.a2)) Object.assign(A, { a1: g1, v1: 0, a2: g2, v2: 0 });
  }
  return [A.a1, A.a2];
}
// A loose angle on a spring (a hanging leg, a folded wing), swung by pushes across it.
function swingOf(F, key, rest, len, acc, dt, k = 110, c = 10, max = 0.6) {
  const A = (F[key] ??= { th: 0, w: 0 });
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const ang = rest + A.th;
      const push = (-(Math.cos(ang) * acc[1] - Math.sin(ang) * acc[0]) * 0.5) / Math.max(1, len);
      A.w += (-k * A.th - c * A.w + push) * h;
      A.th += A.w * h;
      if (Math.abs(A.th) > max) {
        A.th = Math.sign(A.th) * max;
        A.w *= -0.3;
      }
    }
    if (!Number.isFinite(A.th)) Object.assign(A, { th: 0, w: 0 });
  }
  return A.th;
}
// Two bones from `A` to `B`, the knee to the side of `fwd` that `side` asks for (+1 ahead, -1
// behind); the foot pulled in if it can't reach. Returns [knee, foot].
function kneeOf(A, B, l1, l2, side, fwd) {
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const d = Math.hypot(dx, dy) || 1e-6;
  const dd = clamp(d, Math.abs(l1 - l2) + 0.05, (l1 + l2) * 0.998);
  const along = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const ux = dx / d;
  const uy = dy / d;
  let px = -uy;
  let py = ux;
  if ((px * fwd[0] + py * fwd[1]) * side < 0) {
    px = -px;
    py = -py;
  }
  return [[A[0] + ux * along + px * h, A[1] + uy * along + py * h], [A[0] + ux * dd, A[1] + uy * dd]];
}
// A sparkle: four soft curved points.
function twinkle(ctx, x, y, r, an, fill) {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const q = an + (i * Math.PI) / 2;
    const tip = [x + Math.cos(q) * r, y + Math.sin(q) * r];
    const next = [x + Math.cos(q + Math.PI / 2) * r, y + Math.sin(q + Math.PI / 2) * r];
    if (!i) ctx.moveTo(...tip);
    ctx.quadraticCurveTo(x + Math.cos(q + Math.PI / 4) * r * 0.18, y + Math.sin(q + Math.PI / 4) * r * 0.18, ...next);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
function softPuff(ctx, x, y, r, alpha, fill = '#f5f1fb', rim = '#dcd2ea') {
  if (alpha <= 0.01 || r <= 0.05) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(0.35, r * 0.14);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

// ---------- The bugs ----------
const BEE = {
  name: 'Bee',
  scale: 1.1,
  speed: 34,
  // body: a soft round oval behind the head, its rear full and round
  body: [[6.2, -1.2], [3.6, -5.2], [-0.8, -6.3], [-5.2, -5.4], [-8.3, -2.6], [-8.8, 1], [-6.8, 4.4], [-2.4, 5.9], [2.2, 5.6], [5.4, 3.2]],
  head: { joint: [4.6, -0.8], at: [8.9, -2.9], r: 5.6 },
  sting: { root: [-7.2, 1.1], ang: 168, len: 3.8, w: [2.9, 1.1] },
  // wings: two a side, rooted on top of the body just behind the head, a big fore wing over a
  // smaller hind one; folded (back along the body) and open (up and back) angles, degrees; the far
  // pair a little higher behind
  wing: {
    fore: { root: [1.4, -5.7], len: 9.6, w: 5.0, fold: 192, open: 217 },
    hind: { root: [-0.2, -5.2], len: 6.8, w: 3.9, fold: 180, open: 199 },
    far: [-1.1, -0.8],
    farUp: 14,
    hz: 9,
    amp: 28,
  },
  // feelers: roots in the head (about its middle), bone lengths, rest angles (from the head's
  // forward) of the base and of the tip on the base
  ant: { near: [1.8, -4.6], far: [-1.2, -4.7], len: [3.0, 2.6], w: 1.15, tip: 1.3, ang: -60, bend: 44 },
  legs: [{ root: [3.0, 4.2], foot: 4.0, knee: 1 }, { root: [-2.8, 4.8], foot: -3.4, knee: -1 }],
  far: [-1.5, -0.6],
  leg: { len: [2.3, 2.1], w: [2.4, 1.9], foot: 1.25 },
  stand: 8.2,
  hover: 7,
  moves: ['sting', 'dive', 'buzz', 'pollen'],
};

// ---------- The moves (x, hop in body heights; lift in px; angles in degrees, pitch + nose down;
// spin in degrees, played straight from the keys, never sprung, so a full turn ends where it began) ----------
const BUG_MOVES = {
  bee: {
    // Reared back, the stinger swung forward under the body, then a quick jab in and back out.
    sting: {
      anticT: 0.24,
      keys: [
        [0, { x: -0.1, hop: 0.12, pitch: -46, head: 24, ant: 0.7, buzz: 1.25, tuck: 0.4 }],
        [0.08, { x: 0.3, hop: -0.02, pitch: -88, head: 44, ant: -0.4, buzz: 1.5, tuck: 0.8 }, 'out'],
        [0.17, { x: 0.25, hop: 0, pitch: -76, head: 38, ant: -0.2, buzz: 1.3, tuck: 0.7 }, 'io'],
        [0.44, { x: 0.05, pitch: -10, head: 4, ant: 0.3 }, 'io'],
        [0.72, {}],
      ],
      spark: [0.08],
      sparkAt: 'sting',
    },
    // Up and back, tipping over, then a dive down onto its target and a bounce back up.
    dive: {
      anticT: 0.3,
      keys: [
        [0, { hop: 0.42, x: -0.12, pitch: -16, buzz: 1.3, ant: 0.8, tuck: 0.3 }],
        [0.12, { hop: 0.46, x: -0.1, pitch: 34, head: -10, buzz: 0.9, ant: -0.6, tuck: 0.9, wings: 0.75 }, 'io'],
        [0.27, { hop: -0.3, x: 0.38, pitch: 46, head: -16, buzz: 0.6, ant: -1, tuck: 1, wings: 0.65 }, 'in'],
        [0.36, { hop: -0.18, x: 0.42, pitch: 6, head: 0, buzz: 1.3, ant: 0.2, tuck: 0.6 }, 'out'],
        [0.7, { x: 0.18 }, 'io'],
        [1.0, {}],
      ],
      spark: [0.27],
      sparkAt: 'front',
    },
    // A zip forward, flat out, the wings a blur.
    buzz: {
      anticT: 0.14,
      keys: [
        [0, { x: -0.08, pitch: -12, buzz: 1.3, ant: 0.7, tuck: 0.6 }],
        [0.07, { x: 0.52, pitch: 18, head: -8, buzz: 1.7, ant: -0.9, tuck: 1 }, 'out'],
        [0.24, { x: 0.56, pitch: 9, head: -4, buzz: 1.4, ant: -0.6, tuck: 0.8 }, 'io'],
        [0.62, {}],
      ],
      lines: [0.03, 0.3],
      spark: [0.1],
      sparkAt: 'front',
    },
    // Gathered up, then a shake that sends a puff of pollen from its fluffy body.
    pollen: {
      anticT: 0.26,
      keys: [
        [0, { x: -0.05, hop: 0.08, pitch: -14, ant: 0.9, buzz: 1.1 }],
        [0.1, { x: 0.02, pitch: 6, ant: 0.4, buzz: 1.5, sway: 1 }, 'out'],
        [0.5, { x: 0.02, pitch: 4, ant: 0.3, buzz: 1.4, sway: 1 }],
        [0.82, {}, 'io'],
      ],
      pollen: [0.1, 0.55],
      spark: [0.3],
      sparkAt: 'ahead',
    },
    jump: {
      anticT: 0.14,
      keys: [
        [0, { hop: -0.05, pitch: 6, ant: -0.3 }],
        [0.14, { hop: 0.42, pitch: -14, buzz: 1.5, ant: 0.6, tuck: 0.5 }, 'out'],
        [0.4, { hop: 0.06, pitch: 6, ant: 0 }, 'io'],
        [0.64, {}],
      ],
    },
    dash: {
      anticT: 0.1,
      keys: [
        [0, { x: -0.05, pitch: -8, buzz: 1.2, tuck: 0.5 }],
        [0.08, { x: 0.36, pitch: 16, buzz: 1.6, ant: -0.8, tuck: 1 }, 'out'],
        [0.3, { x: 0.4, pitch: 8, buzz: 1.3, ant: -0.5, tuck: 0.7 }, 'io'],
        [0.6, {}],
      ],
      lines: [0.02, 0.3],
    },
    dodge: {
      anticT: 0.06,
      keys: [
        [0, { x: 0.02, pitch: 4 }],
        [0.1, { x: -0.32, hop: 0.18, pitch: -24, head: 10, buzz: 1.5, ant: -0.8, tuck: 0.7 }, 'out'],
        [0.32, { x: -0.3, hop: 0.06, pitch: -6 }, 'io'],
        [0.62, {}],
      ],
    },
    hurt: {
      anticT: 0,
      keys: [
        [0, {}],
        [0.05, { x: -0.11, hop: 0.07, pitch: -30, head: -16, ant: -1, buzz: 1.5, tuck: 0.7 }, 'out'],
        [0.22, { x: -0.09, hop: 0.03, pitch: -16, head: -10, ant: -0.7, buzz: 1.2, tuck: 0.4 }],
        [0.55, {}],
      ],
    },
    // Knocked down: tumbling out of the air, a bump on the ground, sitting dazed, wings drooping,
    // then a shake and a buzz back up.
    knockdown: {
      anticT: 0,
      keys: [
        [0, {}],
        [0.1, { x: -0.1, hop: 0.1, pitch: -30, head: -14, ant: -1, buzz: 1.2, tuck: 0.8 }, 'out'],
        [0.4, { x: -0.16, land: 1, pitch: 36, head: 22, ant: -1, wings: 0.55, buzz: 0, crouch: 1, tuck: 0, sleep: 0.6 }, 'in'],
        [0.48, { x: -0.16, land: 1, pitch: 26, head: 16, ant: -0.9, wings: 0.5, buzz: 0, crouch: 0.8, sleep: 0.6 }, 'out'],
        [0.7, { x: -0.16, land: 1, pitch: 34, head: 22, ant: -1, wings: 0.55, buzz: 0, crouch: 1, sleep: 0.6 }, 'io'],
        [0.88, { x: -0.16, land: 1, pitch: 28, head: 18, ant: -1, wings: 0.5, buzz: 0, crouch: 0.9, sleep: 0.6 }, 'io'],
        [1.05, { x: -0.16, land: 1, pitch: 33, head: 22, ant: -1, wings: 0.55, buzz: 0, crouch: 1, sleep: 0.6 }, 'io'],
        [1.25, { x: -0.12, land: 1, pitch: 0, head: 0, ant: 0.4, wings: 1, buzz: 1.2, crouch: 0.3 }, 'io'],
        [1.6, {}],
      ],
      dust: [[0.4, 'under']],
    },
    // Pleased: a waggle dance, its round rear wagging, wings humming.
    waggle: {
      anticT: 0.1,
      keys: [
        [0, { ant: 0.6 }],
        [0.2, { sway: 1, ant: 0.8, buzz: 1.3, head: -6 }, 'io'],
        [1.0, { sway: 1, ant: 0.8, buzz: 1.3, head: -6 }],
        [1.3, {}, 'io'],
      ],
    },
  },
};
const PLEASED = { bee: 'waggle' };

// Channels: x, hop (body heights), lift (px), pitch, crouch, tuck (legs in), air (ladybug: flying),
// land (bee: landed), sleep, groom, head, ant (feelers up + / down -), wings (open), buzz (wing
// beat), shell (ladybug: shell open), flip (lying on its shell / rolling on it), paddle (legs
// paddling), curl, rear, arch (caterpillar), sway (a waggle or a wiggle).
const CH = ['x', 'hop', 'lift', 'pitch', 'crouch', 'tuck', 'air', 'land', 'sleep', 'groom', 'head', 'ant', 'wings', 'buzz', 'shell', 'flip', 'paddle', 'curl', 'rear', 'arch', 'sway'];
const ZERO = Object.fromEntries(CH.map((c) => [c, 0]));
const EASES = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: ease, lin: (u) => u };
const moveLen = (mv) => mv.keys[mv.keys.length - 1][0];
// A move's pose at time t (before 0: easing from the pose it was in into the first key).
function sampleMove(mv, t, antic, base) {
  const keyAt = (i) => ({ ...base, ...mv.keys[i][1] });
  if (t < 0) {
    const first = keyAt(0);
    const w = ease(antic);
    const out = {};
    for (const k of Object.keys(base)) out[k] = mixN(base[k], first[k], w);
    return out;
  }
  let i = 0;
  while (i < mv.keys.length - 1 && t >= mv.keys[i + 1][0]) i++;
  const A = keyAt(i);
  if (i >= mv.keys.length - 1) return A;
  const B = keyAt(i + 1);
  const t0 = mv.keys[i][0];
  const t1 = mv.keys[i + 1][0];
  const u = (EASES[mv.keys[i + 1][2]] ?? ease)(clamp((t - t0) / Math.max(1e-6, t1 - t0), 0, 1));
  const out = {};
  for (const k of Object.keys(A)) out[k] = mixN(A[k], B[k], u);
  return out;
}
// (0..1 through [at, at + len] of a move's clock, or -1)
const within = (t, at, len) => (t >= at && t <= at + len ? (t - at) / len : -1);
// Which move it is playing: one asked for (m.act), an attack (wind-up and blow, cycling through
// its pool), a hit taken, or a pleased moment.
function pickMove(kind, pool, m, a, st, MV = BUG_MOVES[kind]) {
  if (m.act && MV[m.act.name]) {
    const mv = MV[m.act.name];
    const T = a.now - m.act.at;
    if (T >= 0 && T < mv.anticT + moveLen(mv)) {
      const t = T - mv.anticT;
      return [mv, t, t < 0 ? (mv.anticT > 0 ? T / mv.anticT : 1) : 1];
    }
  }
  if (a.ph.antic > 0 || a.ph.since >= 0) {
    if (!st.bgAtk) {
      const list = m.def.moves ?? pool;
      st.bgN = st.bgN === undefined ? (m.uid ?? 0) : st.bgN + 1;
      st.bgPick = m.move ?? list[st.bgN % list.length];
    }
    st.bgAtk = true;
    const mv = MV[st.bgPick];
    if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
  } else st.bgAtk = false;
  if (m.hp > 0 && (a.hurtAgo ?? 9) < moveLen(MV.hurt)) return [MV.hurt, a.hurtAgo, 1];
  const gl = a.now - (m.gloatAt ?? -9);
  const happy = MV[PLEASED[kind]];
  if (m.hp > 0 && gl >= 0 && gl < moveLen(happy)) return [happy, gl, 1];
  return [null, 0, 0];
}
// The distance it travels, as a speed (smoothed), and how fast that is changing.
function travelOf(st, m, a) {
  const dt = a.dt ?? 0;
  const odo = m.odo ?? 0;
  if (dt > 0) {
    const raw = Math.min(400, Math.abs(odo - (st.bgOdo ?? odo)) / dt);
    const v0 = st.bgV ?? 0;
    st.bgV = v0 + (raw - v0) * Math.min(1, dt * 5);
    st.bgAcc = mixN(st.bgAcc ?? 0, (st.bgV - v0) / dt, Math.min(1, dt * 4));
  }
  st.bgOdo = odo;
  return st.bgV ?? 0;
}
const napping = (m, a) => m.hp > 0 && m.habit?.kind === 'nap' && (m.habit.until == null || a.now < m.habit.until);
const EMPTY = () => sprite('rig|bugempty', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));
// The live parts: every one drawn as its outline, then every one again filled, in the same order,
// so only the creature's outer edge keeps a line.
function liveParts(list) {
  const one = (name, draw, mode) => ({ name, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a) => a.bk && draw(ctx, a, mode) });
  return [...list.map(([n, d]) => one(n, d, 'line')), ...list.map(([n, d]) => one(`${n}~b`, d, 'fill'))];
}
// The common springs: most channels a light overshoot; the head and the feelers softer.
const springsOf = () => Object.fromEntries(CH.map((c) => [c, c === 'head' || c === 'ant' ? [170, 22] : c === 'sway' ? [60, 14] : c === 'land' || c === 'curl' ? [150, 22] : [170, 21]]));
const LOOSE = ['head', 'ant', 'sway', 'sleep', 'groom'];

// ---------- The bee ----------
function beeRig(look = {}) {
  // (the dress, by a name the base's own code never uses)
  const DRESS = look;
  const LP = look.P ?? {};
  const P = { ...BEE, ...LP, head: { ...BEE.head, ...(LP.head ?? {}) }, sting: { ...BEE.sting, ...(LP.sting ?? {}) }, wing: { ...BEE.wing, ...(LP.wing ?? {}), fore: { ...BEE.wing.fore, ...(LP.wing?.fore ?? {}) }, hind: { ...BEE.wing.hind, ...(LP.wing?.hind ?? {}) } }, ant: { ...BEE.ant, ...(LP.ant ?? {}) }, leg: { ...BEE.leg, ...(LP.leg ?? {}) } };
  const C = { ...C0, ...(look.C ?? {}) };
  const MOVES = { ...BUG_MOVES.bee, ...(look.moves ?? {}) };
  // (its own soft ink)
  function ink(ctx) {
    ctx.strokeStyle = DRESS.ink ?? LINE;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  // A round head in its own frame (about its middle, the face to the right), with the soft guides
  // where the face goes: a line for the eyes and the curve of the face's front.
  function drawHead(ctx, a, mode, hc, ha, r, extra) {
    ctx.beginPath();
    addDisc(ctx, hc[0], hc[1], r);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    addDisc(ctx, hc[0], hc[1], r);
    ctx.clip();
    ctx.translate(hc[0], hc[1]);
    ctx.rotate(ha);
    // the crown lit, the back of the head and under the chin softly shaded
    bloom(ctx, a, [-r * 0.12, -r * 0.42], r * 0.95, C.lt, 0.95);
    bloom(ctx, a, [-r * 0.7, r * 0.55], r * 0.95, C.sh, 0.55);
    bloom(ctx, a, [r * 0.55, r * 0.05], r * 0.55, C.lt, 0.5);
    extra?.(ctx);
    ctx.restore();
    // its own face (the dress)
    ctx.save();
    ctx.translate(hc[0], hc[1]);
    ctx.rotate(ha);
    DRESS.face?.(ctx, a, a.bk, KIT);
    ctx.restore();
  }
  // A feeler: a tapering stalk with a round nub on the tip.
  function drawFeeler(ctx, a, mode, f, far) {
    ctx.beginPath();
    addLimb(ctx, [f.root, f.mid, f.tip], [f.w, f.w * 0.88, f.w * 0.78]);
    addDisc(ctx, f.tip[0], f.tip[1], f.r);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, far ? C.sh : C.base);
    ctx.fill('nonzero');
    ctx.save();
    ctx.beginPath();
    addDisc(ctx, f.tip[0], f.tip[1], f.r);
    ctx.clip();
    bloom(ctx, a, [f.tip[0] - f.r * 0.3, f.tip[1] - f.r * 0.35], f.r * 1.1, far ? C.base : C.lt, 0.9);
    ctx.restore();
  }
  // The outline round a chain of points with a width at each: one smooth loop (a soft root, a round tip).
  function ribbon(pts, ws) {
    const n = pts.length;
    const L = [];
    const R = [];
    const dirAt = (i) => {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[Math.min(n - 1, i + 1)];
      const d = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
      return [(p1[0] - p0[0]) / d, (p1[1] - p0[1]) / d];
    };
    for (let i = 0; i < n; i++) {
      const [dx, dy] = dirAt(i);
      L.push([pts[i][0] - dy * ws[i] * 0.5, pts[i][1] + dx * ws[i] * 0.5]);
      R.push([pts[i][0] + dy * ws[i] * 0.5, pts[i][1] - dx * ws[i] * 0.5]);
    }
    const d0 = dirAt(0);
    const d1 = dirAt(n - 1);
    const root = [pts[0][0] - d0[0] * ws[0] * 0.45, pts[0][1] - d0[1] * ws[0] * 0.45];
    const tip = [pts[n - 1][0] + d1[0] * ws[n - 1] * 0.55, pts[n - 1][1] + d1[1] * ws[n - 1] * 0.55];
    return loopCurve([root, ...L, tip, ...R.reverse()], 3);
  }
  // A stubby leg: a soft round upper bone, a shorter lower one and a little round foot; shaded
  // where it goes in under the body.
  function drawStub(ctx, a, mode, L) {
    const shape = (g = 0) => {
      ctx.beginPath();
      addLimb(ctx, [L.R, L.K, L.P], [L.w[0], L.w[1], L.w[1] * 0.9], g);
      addDisc(ctx, L.P[0] + L.toe[0], L.P[1] + L.toe[1], L.foot + g);
    };
    shape();
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, L.far ? C.sh : C.base);
    ctx.fill('nonzero');
    ctx.save();
    shape();
    ctx.clip('nonzero');
    bloom(ctx, a, L.R, Math.hypot(L.K[0] - L.R[0], L.K[1] - L.R[1]) * 1.35 + L.w[0] * 0.5, L.far ? C.deep : C.sh, 0.85);
    bloom(ctx, a, [L.P[0] + L.toe[0] - L.foot * 0.25, L.P[1] + L.toe[1] - L.foot * 0.4], L.foot * 1.2, L.far ? C.base : C.lt, 0.7);
    ctx.restore();
  }

  // A leg brought up in front (grooming): drawn only where it comes out of the body, the body itself
  // left untouched; where it comes out, a band of its colour over the body's edge, so no line shows.
  function drawStubOver(ctx, a, mode, L, cutters, head) {
    const outside = () => {
      for (const cut of cutters) {
        ctx.beginPath();
        ctx.rect(-1e4, -1e4, 2e4, 2e4);
        cut(ctx);
        ctx.clip('evenodd');
      }
    };
    ctx.save();
    outside();
    drawStub(ctx, a, mode, L);
    ctx.restore();
    if (mode === 'line') return;
    ctx.save();
    ctx.beginPath();
    addLimb(ctx, [L.R, L.K, L.P], [L.w[0], L.w[1], L.w[1] * 0.9]);
    ctx.clip('nonzero');
    ctx.strokeStyle = tone(a, C.base);
    ctx.lineWidth = 2.6;
    for (const cut of cutters) {
      ctx.beginPath();
      cut(ctx);
      ctx.stroke();
    }
    ctx.restore();
    // (in front of the face it is its own shape, with its own edge)
    if (!head) return;
    ctx.save();
    ctx.beginPath();
    addDisc(ctx, head[0], head[1], head[2]);
    ctx.clip();
    outside();
    ctx.beginPath();
    addLimb(ctx, [L.R, L.K, L.P], [L.w[0], L.w[1], L.w[1] * 0.9]);
    addDisc(ctx, L.P[0] + L.toe[0], L.P[1] + L.toe[1], L.foot);
    ctx.strokeStyle = DRESS.ink ?? LINE;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
    ctx.save();
    outside();
    drawStub(ctx, a, mode, L);
    ctx.restore();
  }

  const s = P.scale;
  const sc = (v) => v * s;
  const scP = (p) => [p[0] * s, p[1] * s];
  const curve = loopCurve(P.body, 4);
  const xs = P.body.map((p) => p[0]);
  const bodyLen = sc(Math.max(...xs) - Math.min(...xs));
  const H = sc(P.stand - (P.head.at[1] - P.head.r) + 3);
  const headOff = [P.head.at[0] - P.head.joint[0], P.head.at[1] - P.head.joint[1]];
  const reach = sc(P.leg.len[0] + P.leg.len[1]);
  // (a teardrop: narrow at the root, full and round at the tip)
  const PETAL = [[-0.04, 0], [0.16, -0.16], [0.42, -0.38], [0.72, -0.5], [0.95, -0.36], [1.03, -0.04], [0.96, 0.28], [0.74, 0.44], [0.44, 0.34], [0.16, 0.14]];
  const petal = (ctx, W) => addLoop(ctx, loopCurve(PETAL.map(([u, v]) => plus(W.root, turn([u * W.len, v * W.wid * W.chord], W.ang))), 3));

  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const F = (st.bgF ??= {});
    const t = a.t;
    const dt = clamp(a.dt ?? 0, 0, 0.05);
    const land = ease(clamp(S.land, 0, 1));
    const air = 1 - land;
    const v = st.bgV ?? 0;
    const fwd = clamp(v / P.speed, 0, 1.5) * air;
    // Hovering: a slow bob and a little drift (two slow waves, never in step), leaning into its
    // travel and into speeding up, a slow roll of its own; the waggle wags its rear.
    const bob = (Math.sin(t * 2.2) * 0.75 + Math.sin(t * 0.83 + 1.3) * 0.35) * air;
    const drift = Math.sin(t * 0.61 + 0.4) * 0.6 * air * (1 - Math.min(1, fwd));
    const lean = chase(F, 'lean', fwd * 12 + (st.bgLean ?? 0), 90, 16, dt);
    const wag = S.sway * Math.sin(t * 28);
    const th = (S.pitch + lean + Math.sin(t * 1.6) * 1.4 * air + wag * 8) * D2R;
    const standH = sc(P.stand) - sc(2.0) * clamp(S.crouch, 0, 1) * land;
    const pH = Math.max(sc(6.2), standH + (sc(P.hover) + sc(bob)) * air + S.hop + S.lift);
    const pivot = [S.x + sc(drift) + wag * sc(0.5), -pH];
    const at = (p) => plus(pivot, turn([sc(p[0]), sc(p[1])], th));
    const odo = m.odo ?? 0;
    const bodyAcc = pushOf(F, 'body', pivot, dt, a.flip, odo);
    // The head: on the front of the body, held steadier than it, nodding and glancing.
    const J = at(P.head.joint);
    const ha = chase(F, 'ha', th * 0.55 + (S.head + (a.bgLook ?? 0)) * D2R, 210, 22, dt);
    const hc = plus(J, turn(scP(headOff), ha));
    const r = sc(P.head.r);
    // The wings: folded back along the back, or up and beating; the beat's phase kept running, so a
    // change of speed never jumps it.
    const open = ease(clamp(S.wings, 0, 1));
    const buzz = clamp(S.buzz, 0, 1.8) * open;
    const ph = (st.bgBeat = frac((st.bgBeat ?? 0) + dt * P.wing.hz * (0.8 + 0.22 * Math.min(1.6, buzz))));
    const fold = swingOf(F, 'wfold', th + P.wing.fore.fold * D2R, sc(P.wing.fore.len), bodyAcc, dt, 160, 9, 0.35) * (1 - open);
    const wings = {};
    for (const far of [false, true]) {
      for (const which of ['fore', 'hind']) {
        const Wd = P.wing[which];
        // (the hind wing a beat behind the fore; the far pair a beat behind the near)
        const q = ph - (far ? 0.06 : 0) - (which === 'hind' ? 0.05 : 0);
        const amp = P.wing.amp * Math.min(1.4, buzz) * (which === 'hind' ? 0.85 : 1);
        const mid = mixN(Wd.fold, Wd.open - fwd * 14, open) + (far ? P.wing.farUp * open + 3 : 0);
        const osc = Math.sin(TAU * q);
        wings[`${far ? 'far' : 'near'}${which === 'fore' ? 'Fore' : 'Hind'}`] = {
          root: at(far ? plus(Wd.root, P.wing.far) : Wd.root),
          ang: th + (mid + amp * osc) * D2R + fold * (which === 'hind' ? 0.8 : 1),
          len: sc(Wd.len) * (far ? 0.95 : 1),
          wid: sc(Wd.w) * (far ? 0.95 : 1),
          // (edge-on mid-stroke, full at the top and the bottom of the beat)
          chord: 1 - 0.3 * Math.min(1, buzz) * (0.5 - 0.5 * Math.cos(TAU * 2 * q)),
          lo: th + (mid - amp) * D2R,
          hi: th + (mid + amp) * D2R,
          buzz: which === 'fore' ? buzz : 0,
          far,
        };
      }
    }
    // The legs: hanging under it in the air (back with its speed, swinging on a spring), drawn up
    // when it zips, standing when it lands; the front pair up at its face to groom.
    const fv = [Math.cos(th), Math.sin(th)];
    const legs = {};
    const groom = ease(clamp(S.groom, 0, 1));
    const tuck = ease(clamp(S.tuck + fwd * 0.25, 0, 1));
    for (const [i, L] of P.legs.entries()) {
      for (const far of [false, true]) {
        const rootB = far ? plus(L.root, P.far) : L.root;
        const R = at(rootB);
        const key = `l${i}${far ? 'f' : 'n'}`;
        const hangRest = th + (88 + (i ? 16 : 0) + Math.min(1, fwd) * 26 + (far ? 6 : 0)) * D2R;
        const dangle = swingOf(F, key, hangRest, reach, bodyAcc, dt, 90, 8, 0.7);
        const hang = polar(R, hangRest + dangle, reach * 0.86);
        // (drawn up: folded in close under the belly, never a point)
        const tucked = polar(R, hangRest + dangle + (i ? 0.25 : -0.2), reach * 0.5);
        let foot = mixP(hang, tucked, tuck);
        const ground = [S.x + sc(drift) + sc(L.foot + (far ? P.far[0] * 0.8 : 0)), 0];
        foot = mixP(foot, ground, land);
        if (i === 0 && groom > 0) {
          // (rubbing up over its face and the base of its feelers, the two legs in turn)
          const rub = t * 8 + (far ? Math.PI : 0);
          const face = plus(hc, turn([r * (0.22 + 0.12 * Math.cos(rub)), r * (0.9 + 0.08 * Math.sin(rub))], ha));
          foot = mixP(foot, face, groom);
        }
        // (the dress holding a front foot up somewhere of its own: a letter to read, a salute)
        // (eased in and out, and from one hold to the next: a move or a walk cutting its act short
        // used to snap the foot down in one frame, 2026-11-26)
        const held = i === 0 ? (far ? a.bgHoldF : a.bgHold) : null;
        if (i === 0) {
          const Hd = (F[`hold${key}`] ??= { k: 0, at: null });
          const f = dt > 0 ? 1 - Math.exp(-dt / 0.06) : 0;
          const goalK = held && held.k > 0 ? clamp(held.k, 0, 1) : 0;
          Hd.k += (goalK - Hd.k) * f;
          if (goalK > 0) Hd.at = Hd.at ? mixP(Hd.at, held.at, f) : held.at;
          if (Hd.k > 0.002 && Hd.at) foot = mixP(foot, plus(hc, turn(Hd.at, ha)), Hd.k);
          if (!far) a.bgHoldK = Hd.k;
        }
        const [K, Pt] = kneeOf(R, foot, sc(P.leg.len[0]), sc(P.leg.len[1]), L.knee, fv);
        legs[key] = { R, K, P: Pt, far, w: [sc(P.leg.w[0]), sc(P.leg.w[1])], foot: sc(P.leg.foot), toe: [sc(0.3), 0] };
      }
    }
    // The feelers, from the top of the head.
    const headAcc = pushOf(F, 'head', hc, dt, a.flip, odo);
    const headSpin = spinOf(F, 'hspin', ha, dt);
    const tw = a.bgTw ?? [0, 0];
    const ant = {};
    for (const far of [false, true]) {
      const A0 = P.ant;
      const g = far ? 0.4 : 1;
      // (asleep, they lie back over the head, the tips drooping behind)
      const zz = ease(clamp(S.sleep, 0, 1));
      const g1 = mixN(A0.ang - 22 * S.ant - tw[far ? 1 : 0] * 14 + (far ? -14 : 0) + groom * 26 * g, far ? -132 : -118, zz) * D2R;
      const g2 = mixN(A0.bend - 26 * S.ant + tw[far ? 1 : 0] * 24 + groom * 30 * g, -42, zz) * D2R;
      const lens = [sc(A0.len[0]), sc(A0.len[1])];
      const [a1, a2] = feelerSim(F, far ? 'af' : 'an', g1, g2, ha, headAcc, headSpin, lens, dt);
      const root = plus(hc, turn(scP(far ? A0.far : A0.near), ha));
      const mid = polar(root, ha + a1, lens[0]);
      ant[far ? 'far' : 'near'] = { root, mid, tip: polar(mid, ha + a1 + a2, lens[1]), w: sc(A0.w), r: sc(A0.tip) };
    }
    const sb = at(P.sting.root);
    const sAng = th + P.sting.ang * D2R;
    const sting = { root: sb, tip: polar(sb, sAng, sc(P.sting.len)) };
    const spots = {
      sting: sting.tip,
      front: plus(hc, turn([r * 1.02, r * 0.35], ha)),
      ahead: plus(hc, turn([r * 1.8, r * 0.2], ha)),
      under: [hc[0], 0],
      body: pivot,
      feet: [pivot[0], 0],
    };
    return { pivot, th, at, hc, ha, r, wings, legs, ant, sting, bodyPts: curve.map(at), spots, land, groom };
  }

  // The body: one soft round shape; the back lit, the belly shaded, a pale rim.
  function drawBody(ctx, a, mode) {
    const sk = a.bk;
    pathOf(ctx, sk.bodyPts);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    pathOf(ctx, sk.bodyPts);
    ctx.clip();
    bloom(ctx, a, sk.at([-0.8, -3.4]), sc(6.8), C.lt, 0.9);
    bloom(ctx, a, sk.at([-0.4, 6.8]), sc(6.6), C.sh, 0.8);
    bloom(ctx, a, sk.at([-7.2, 1.4]), sc(3.6), C.sh, 0.35);
    ctx.restore();
  }
  function drawSting(ctx, a, mode) {
    const sk = a.bk;
    ctx.beginPath();
    addLimb(ctx, [sk.sting.root, mixP(sk.sting.root, sk.sting.tip, 0.55), sk.sting.tip], [sc(P.sting.w[0]), sc(mixN(P.sting.w[0], P.sting.w[1], 0.6)), sc(P.sting.w[1])]);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill('nonzero');
    ctx.save();
    ctx.clip('nonzero');
    bloom(ctx, a, sk.sting.tip, sc(2.2), C.sh, 0.7);
    ctx.restore();
  }
  // A wing: a pale teardrop with a soft vein down it; while it beats, a see-through blur over its
  // sweep; where a near one lies over the body (or the fore over the hind) a soft edge, fading out
  // before its root.
  function drawWing(ctx, a, mode, side) {
    const sk = a.bk;
    const W = sk.wings[side];
    const far = W.far;
    if (mode === 'fill' && W.buzz > 0.05) {
      ctx.save();
      ctx.globalAlpha *= Math.min(1, W.buzz) * (far ? 0.2 : 0.28);
      ctx.beginPath();
      ctx.moveTo(...W.root);
      ctx.arc(W.root[0], W.root[1], W.len * 0.97, W.lo - 0.12, W.hi + 0.12);
      ctx.closePath();
      ctx.fillStyle = tone(a, C.wing);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    petal(ctx, W);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, far ? C.wingFar : C.wing);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    petal(ctx, W);
    ctx.clip();
    bloom(ctx, a, plus(W.root, turn([W.len * 0.58, -W.wid * 0.1], W.ang)), W.len * 0.5, '#ffffff', 0.7);
    ctx.beginPath();
    petal(ctx, W);
    ctx.strokeStyle = tone(a, C.wingRim);
    ctx.lineWidth = sc(1.1);
    ctx.stroke();
    // (a soft guide down its middle)
    ctx.beginPath();
    ctx.moveTo(...plus(W.root, turn([W.len * 0.16, 0], W.ang)));
    ctx.quadraticCurveTo(...plus(W.root, turn([W.len * 0.45, -W.wid * 0.12 * W.chord], W.ang)), ...plus(W.root, turn([W.len * 0.74, -W.wid * 0.04 * W.chord], W.ang)));
    ctx.lineWidth = sc(0.55);
    ctx.stroke();
    ctx.restore();
    // (its edge over what lies under it: the body, and for the fore wing its hind wing)
    const under = [];
    if (!far) under.push((c) => addLoop(c, sk.bodyPts));
    if (side.endsWith('Fore')) under.push((c) => petal(c, sk.wings[side.replace('Fore', 'Hind')]));
    for (const cut of under) {
      ctx.save();
      ctx.beginPath();
      cut(ctx);
      ctx.clip();
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      addDisc(ctx, W.root[0], W.root[1], sc(2.2));
      ctx.clip('evenodd');
      ctx.beginPath();
      petal(ctx, W);
      ctx.strokeStyle = tone(a, far ? C.sh : C.deep);
      ctx.lineWidth = sc(0.7);
      ctx.stroke();
      ctx.restore();
    }
  }
  const drawLeg = (key) => (ctx, a, mode) => drawStub(ctx, a, mode, a.bk.legs[key]);
  // (the dress's kit)
  const tint = (a, col, al) => `rgba(${flashRgb(a, col).join(',')},${al})`;
  const KIT = {
    C, P, H, sc, colour: tone, tint, edge: ink, bloom, twinkle, softPuff, loopCurve, addLoop, addLimb, addDisc, addOval, pathOf, ribbon,
    moves: MOVES, poseAt: sampleMove, hold, chase, ease, mixN, mixP, plus, turn, polar, TAU,
    headFrame: (ctx, a) => {
      ctx.translate(a.bk.hc[0], a.bk.hc[1]);
      ctx.rotate(a.bk.ha);
    },
    bodyFrame: (ctx, a) => {
      ctx.translate(a.bk.pivot[0], a.bk.pivot[1]);
      ctx.rotate(a.bk.th);
      ctx.scale(s, s);
    },
    bodyPath: (ctx, a) => pathOf(ctx, a.bk.bodyPts),
    wingPath: (ctx, W) => {
      ctx.beginPath();
      petal(ctx, W);
    },
  };
  const dressed = (list) => list.map(([name, fn]) => [name, (ctx, a, mode) => {
    if (DRESS.under?.[name]) {
      ctx.save();
      DRESS.under[name](ctx, a, mode, KIT);
      ctx.restore();
    }
    fn(ctx, a, mode);
    if (DRESS.over?.[name]) {
      ctx.save();
      DRESS.over[name](ctx, a, mode, KIT);
      ctx.restore();
    }
  }]);
  const parts = liveParts(dressed([
    ['legF0', drawLeg('l0f')],
    ['legF1', drawLeg('l1f')],
    ['wingFH', (ctx, a, mode) => drawWing(ctx, a, mode, 'farHind')],
    ['wingFF', (ctx, a, mode) => drawWing(ctx, a, mode, 'farFore')],
    ['antF', (ctx, a, mode) => drawFeeler(ctx, a, mode, a.bk.ant.far, true)],
    ['sting', drawSting],
    ['legN1', drawLeg('l1n')],
    ['legN0', (ctx, a, mode) => a.bk.groom <= 0.05 && !((a.bgHoldK ?? 0) > 0.05) && drawStub(ctx, a, mode, a.bk.legs.l0n)],
    ['body', drawBody],
    ['wingNH', (ctx, a, mode) => drawWing(ctx, a, mode, 'nearHind')],
    ['wingNF', (ctx, a, mode) => drawWing(ctx, a, mode, 'nearFore')],
    ['antN', (ctx, a, mode) => drawFeeler(ctx, a, mode, a.bk.ant.near, false)],
    ['head', (ctx, a, mode) => drawHead(ctx, a, mode, a.bk.hc, a.bk.ha, a.bk.r)],
    ['legN0o', (ctx, a, mode) => (a.bk.groom > 0.05 || (a.bgHoldK ?? 0) > 0.05) && drawStubOver(ctx, a, mode, a.bk.legs.l0n, [(c) => addLoop(c, a.bk.bodyPts)], [...a.bk.hc, a.bk.r])],
  ]));
  const W = Math.ceil(bodyLen * 3 + sc(40));
  const Ht = Math.ceil(H * 1.7 + sc(P.hover));
  const rig = makeRig({
    w: W,
    h: Ht,
    soft: true,
    stride: sc(30),
    recover: 1.4,
    springs: springsOf(),
    fast: CH.filter((c) => !LOOSE.includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.bgActive),
    kick: { pitch: -60, head: 50 },
    turnKick: { pitch: 30 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const uid = m.uid ?? 0;
      const t = a.t + (uid % 7) * 1.1;
      const v = travelOf(st, m, a);
      const fwd = clamp(v / P.speed, 0, 1.4);
      st.bgLean = clamp((st.bgAcc ?? 0) * 0.05, -7, 7);
      a.bgLook = glance(uid, t, 4.4) * 7;
      a.bgTw = [hold(t % 4.6, 1.6, 1.68, 1.76, 2.1), hold((t + 2.1) % 6.1, 2.2, 2.28, 2.36, 2.75)];
      // Hovering about: humming, a surge of buzzing now and then that lifts it a little, a rub of
      // its face with its front legs, a slow look about.
      const breath = Math.sin(t * 1.9);
      const quiet = DRESS.quietIdle ? 0 : 1;
      const rub = hold(t % 11.5, 6, 6.4, 7.9, 8.4) * quiet;
      const surge = hold(t % 7.3, 3, 3.35, 3.8, 4.5) * quiet;
      const idle = { ...ZERO, wings: 1, buzz: 1 + surge * 0.35, lift: surge * sc(1.1), ant: 0.2 + breath * 0.06, head: rub * 26, groom: rub, pitch: -2 + rub * 3 };
      const travel = { ...idle, ant: -0.35, head: -4, buzz: 1.25, groom: 0, lift: 0, pitch: 0 };
      const k = ease(clamp(fwd, 0, 1));
      const base = {};
      for (const c of CH) base[c] = mixN(idle[c], travel[c], k);
      base.x /= H;
      base.hop /= H;
      const [mv, mt, anticW] = pickMove('bee', P.moves, m, a, st, MOVES);
      const out = mv ? sampleMove(mv, mt, anticW, { ...base, spin: 0 }) : { ...base };
      // Landed poses: settled down on its legs, wings folded flat along the back (fluttered now
      // and then); grooming; asleep, the head drooping and the feelers down.
      const flutter = hold(t % 9.5, 4, 4.2, 4.8, 5.3);
      const sleep = m.pose === 'sleep' || napping(m, a);
      if (m.pose === 'rest') Object.assign(out, { land: 1, wings: 0.35 * flutter, buzz: 0.7 * flutter, crouch: 0.25, ant: 0.15 + breath * 0.05, head: 0, groom: 0, lift: 0, hop: 0, pitch: breath * 0.6 });
      else if (m.pose === 'groom') Object.assign(out, { land: 1, wings: 0, buzz: 0, crouch: 0.35, groom: 1, head: 30 + Math.sin(t * 4) * 4, ant: -0.15, lift: 0, hop: 0, pitch: 4 });
      else if (sleep) Object.assign(out, { land: 1, wings: 0, buzz: 0, crouch: 0.9, sleep: 1, head: 18 + breath * 1.5, ant: -1, groom: 0, lift: 0, hop: 0, pitch: 7 + breath * 0.8 });
      if (m.cine?.mood === 'sad') Object.assign(out, { ant: -0.9, head: 14 });
      DRESS.pose?.(m, a, out, KIT, mv, mt);
      if (m.hp <= 0) Object.assign(out, { land: 1, wings: 0.3, buzz: 0, crouch: 1, sleep: 1, head: 20, ant: -1, pitch: 18, tuck: 0, groom: 0 });
      st.bgActive = Boolean(mv);
      a.bgMove = mv ? { mv, t: mt } : null;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = (out.x ?? 0) * H;
      res.hop = (out.hop ?? 0) * H;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.bk = skeleton(S, a, m);
    },
    parts,
    fx: (ctx, m, a, S) => {
      drawFx(ctx, a, H, sc);
      KIT.H = H;
      DRESS.fx?.(ctx, m, a, S, KIT);
    },
  });
  const still = () => ({ w: W, h: Ht, res: 3, shapes: [E(W / 2, Ht - sc(P.stand + P.hover), sc(7.2), sc(6.4), C.base), E(W / 2 + sc(8.9), Ht - sc(P.stand + P.hover + 2.9), sc(P.head.r), sc(P.head.r), C.base)] });
  return { rig, still, stride: sc(30), speed: P.speed, H, w: Math.round(bodyLen * 1.6), h: Math.round(H + sc(P.hover)), moves: P.moves, fly: true };
}

// ---------- Effects: sparkles on a hit, dust, speed lines, a pollen puff ----------
function drawFx(ctx, a, H, sc) {
  const sk = a.bk;
  const mv = a.bgMove?.mv;
  const t = a.bgMove?.t ?? 0;
  if (!mv || !sk) return;
  ctx.save();
  for (const s0 of mv.spark ?? []) {
    const k = within(t, s0, 0.24);
    if (k < 0) continue;
    const [x, y] = sk.spots[mv.sparkAt] ?? sk.spots.front;
    const e = 1 - (1 - k) ** 3;
    ctx.globalAlpha = 1 - k * k;
    twinkle(ctx, x, y, H * 0.16 * (0.45 + 0.7 * e), k * 0.6, '#ffffff');
    twinkle(ctx, x, y, H * 0.08 * (0.45 + 0.7 * e), k * 0.6 + 0.4, '#fff1a6');
    for (let i = 0; i < 4; i++) {
      const q = (i * TAU) / 4 + 0.4;
      twinkle(ctx, x + Math.cos(q) * H * 0.22 * e, y + Math.sin(q) * H * 0.22 * e, H * 0.045 * (1 - k * 0.5), q, i % 2 ? '#ffc9e0' : '#fff6c8');
    }
  }
  for (const [d0, where] of mv.dust ?? []) {
    const k = within(t, d0, 0.42);
    if (k < 0) continue;
    const gx = (sk.spots[where] ?? sk.spots.feet)[0];
    const e = 1 - (1 - k) ** 2;
    for (let i = 0; i < 4; i++) {
      const dir = i < 2 ? -1 : 1;
      softPuff(ctx, gx + dir * sc(2.4 + (i % 2) * 3.2) * (0.4 + e), -sc(1 + (i % 2)) - e * sc(2.6), sc(1.4 + (i % 2) * 0.6) * (0.6 + 0.6 * e), (1 - k) * 0.85);
    }
  }
  if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
    const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
    const c = sk.spots.body ?? sk.pivot;
    const cy = sk.pivot[1];
    ctx.globalAlpha = 0.7 * (1 - k) * Math.min(1, k * 6);
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = sc(0.9);
    for (let i = 0; i < 3; i++) {
      const y = cy + sc((i - 1) * 4);
      ctx.beginPath();
      ctx.moveTo(c[0] - sc(12) - sc(5) * k, y);
      ctx.lineTo(c[0] - sc(21) - sc(9) * k - (i === 1 ? sc(4) : 0), y);
      ctx.stroke();
    }
  }
  if (mv.pollen) {
    // (a puff of soft pollen from its body, drifting out ahead and up, swelling and fading)
    const [p0, p1] = mv.pollen;
    for (let i = 0; i < 9; i++) {
      const born = p0 + ((p1 - p0) * i) / 9;
      const k = within(t, born, 0.55);
      if (k < 0) continue;
      const e = 1 - (1 - k) ** 2;
      const ang = -2.7 + ((i * 0.618) % 1) * 2.9;
      const d = sc(6.5) + e * sc(8 + (i % 3) * 3);
      const c = sk.pivot;
      softPuff(ctx, c[0] + Math.cos(ang) * d, c[1] + Math.sin(ang) * d - e * sc(2), sc(1 + (i % 3) * 0.45) * (0.6 + 0.6 * e), (1 - k) * 0.9, '#fff6cf', '#f0dea0');
    }
  }
  ctx.restore();
}

// One dressed bee: its art entry (for ARTS) and its size.
export function dressedBee(look) {
  const r = beeRig(look);
  return { art: { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig }, w: r.w, h: r.h, speed: r.speed, bodyH: r.H, fly: true };
}
