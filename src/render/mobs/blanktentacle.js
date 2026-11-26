// The tentacle base (2026-11-25, the player: "more bases ... sea critters"): soft sea critters made
// for themselves from the start, nothing carried over from any other base; only the engine is
// shared (rig.js's springs and the live two-pass drawing). A plain lilac mannequin to design on,
// never a finished character: no face but a soft eye line, no markings, no suckers. Drawn live:
// one smooth shape over its bones, outlined only on its outer edge (every part's outline first,
// then every part's fill over it, so a line only survives where nothing covers it), in a soft
// lilac ink, never near-black.
//
// The arms (all three): a chain of segments each, every segment's angle on its own damped spring
// that follows the segment before it (so a turn at the root runs down the arm as a wave and the tip
// trails, overshoots and settles), pushed by the body's own speeding up and slowing down; the width
// tapers to a round tip, the length never changes (volume kept). An arm on the ground is laid
// exactly along a guide (see `stanceJoints`), so the part touching the floor never slides.
//
// Presets (units: game px at scale 1, x forward, y down, 0 on the floor):
//   octopus    a big round mantle (its own soft hinge, trailing the body; breathing by its shape:
//              narrower and taller as it squeezes, rounder as it fills) over a short crown with
//              eight thick tapering arms, four near and four far: each comes out from under the
//              head, down and out to the floor, lies along it a little, and its tip curls up. It
//              creeps on its arms: each lifts in turn (a rolling wave front to back), peels up,
//              curls, reaches out and lays itself down again, its phase from the distance walked.
//              Jetting, its mantle squeezes and the arms stream behind in a bundle.
//   jellyfish  a round bell (built from bones: rim tips, shoulders, crown and the hollow under it)
//              over a frilly fringe, four soft oral arms from the middle and six fine trailing
//              tentacles from the rim. It floats (`fly: true`): the bell pulses (a quick squeeze
//              that lifts it, a slow relax as it drifts back down), faster as it travels, leaning
//              into the way it swims, surging on each stroke; everything under it trails.
//   starfish   five chubby tapering arms round a round middle, one smooth shape with soft webbed
//              crotches, seen face on. It stands on two arms and tiptoe-walks (each "leg" arm
//              reaching its tip to a planted spot by bending into a smooth arc), the side arms
//              swaying, the top arm nodding; going fast it cartwheels, rolling without slipping.
//              Its arms take their roles from where they point, so any fifth of a turn is the same
//              star again (it lands every roll and flip on whichever arms are down).
// Moves (TENTACLE_MOVES[kind]): octopus: slap (an arm cocked high, whipped down), grab (the front
// arms coil round a point in front and squeeze), ink (fills up, then a soft puff of ink); jellyfish:
// sting (the tentacles flicked forward, little sparks), slap (the oral arms swung), grab (arms and
// tentacles coiled round a point); starfish: slap (the front arm), grab (top and front arms hug a
// point), spin (a hop and a double spin, like a throwing star); all: jump, dash (octopus: a jet;
// jellyfish: two hard strokes; starfish: a cartwheel), dodge, hurt, knockdown, and a pleased act
// (stretch / bloom / cheer). Poses (m.pose): rest (settled flat), curl (curled up), sleep; a nap
// habit sleeps too.
// m.def.moves picks the attack pool (cycled), m.act = { name, at } plays any move by name.

import { makeRig, clamp, TAU } from './rig.js';
import { hold } from './kidrig.js';
import { E } from './kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299' };
// (the outline: a soft deeper lilac, never near-black)
const INK = '#7f6982'; // (the bases' shared soft ink, as the deertaur's)
const ease = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const easeOut = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
const mix = (a, b, u) => a + (b - a) * u;
const turn = ([x, y], r) => {
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [x * c - y * s, x * s + y * c];
};
const plus = (p, q) => [p[0] + q[0], p[1] + q[1]];
const less = (p, q) => [p[0] - q[0], p[1] - q[1]];
const times = (p, k) => [p[0] * k, p[1] * k];
const mixP = (p, q, u) => [mix(p[0], q[0], u), mix(p[1], q[1], u)];
const unit = (an) => [Math.cos(an), Math.sin(an)];
const wrapPi = (v) => Math.atan2(Math.sin(v), Math.cos(v));
const rgbOf = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rand = (n, seed) => {
  const q = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
  return q - Math.floor(q);
};

// ---------- Curves ----------
// (one point of a smooth curve through p1..p2, p0 and p3 steering it)
function spline(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (k) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3);
  return [f(0), f(1)];
}
// A closed smooth loop through points, `per` points to each span.
function loopCurve(pts, per) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < per; j++) out.push(spline(pts[(i + n - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n], j / per));
  return out;
}
// An open smooth line through points (its ends carried straight on).
function lineCurve(pts, per) {
  const n = pts.length;
  if (n < 2) return pts.slice();
  const P = [less(times(pts[0], 2), pts[1]), ...pts, less(times(pts[n - 1], 2), pts[n - 2])];
  const out = [];
  for (let i = 1; i < n; i++) for (let j = 0; j < per; j++) out.push(spline(P[i - 1], P[i], P[i + 1], P[i + 2], j / per));
  out.push(pts[n - 1]);
  return out;
}
function bezPts(p0, p1, p2, p3, n) {
  const out = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
  }
  return out;
}
const polyLen = (pts) => {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
};

// ---------- Chains ----------
// n + 1 joints a segment apart, laid along a guide line by its length (carried straight on past
// its end): the arm keeps its length whatever shape the guide takes.
function layAlong(guide, n, seg) {
  const out = [guide[0]];
  let at = guide[0];
  let i = 1;
  let left = seg;
  while (out.length <= n) {
    if (i >= guide.length) {
      const a = guide[guide.length - 2] ?? guide[0];
      const b = guide[guide.length - 1];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      at = plus(at, times(less(b, a), left / l));
      out.push(at);
      left = seg;
      continue;
    }
    const q = guide[i];
    const d = Math.hypot(q[0] - at[0], q[1] - at[1]);
    if (d >= left && d > 0) {
      at = mixP(at, q, left / d);
      out.push(at);
      left = seg;
    } else {
      left -= d;
      at = q;
      i++;
    }
  }
  return out;
}
// Each segment's angle (kept continuous: a curl can turn more than once).
function anglesOf(J) {
  const out = [];
  for (let i = 0; i < J.length - 1; i++) {
    let an = Math.atan2(J[i + 1][1] - J[i][1], J[i + 1][0] - J[i][0]);
    if (i) an = out[i - 1] + wrapPi(an - out[i - 1]);
    out.push(an);
  }
  return out;
}
function jointsOf(root, angs, seg) {
  const J = [root];
  for (const an of angs) J.push(plus(J[J.length - 1], [Math.cos(an) * seg, Math.sin(an) * seg]));
  return J;
}
// A list of angles turned whole turns so its root is near `ref`.
const alignTo = (list, ref) => {
  const k = Math.round((ref - list[0]) / TAU);
  return k ? list.map((v) => v + k * TAU) : list;
};
// Several shapes for one arm blended by weight, angle by angle (so the arm keeps its length).
function blendShapes(entries) {
  let tot = 0;
  let ref = null;
  const out = [];
  for (const [L, w] of entries) {
    if (!(w > 1e-4)) continue;
    const A = ref === null ? L : alignTo(L, ref);
    if (ref === null) ref = L[0];
    for (let i = 0; i < A.length; i++) out[i] = (out[i] ?? 0) + A[i] * w;
    tot += w;
  }
  return out.map((v) => v / tot);
}
// The springs along an arm: segment 0 follows its goal, every other one the segment before it plus
// its own bend, softer toward the tip, so a turn runs down the arm as a wave; the body's speeding up
// and slowing down pushes each one. `pin` holds segments exactly on their goal (an arm on the floor).
function chainOf(mem, goal, dt, o) {
  const n = goal.length;
  if (mem.length !== n || !(dt > 0) || !Number.isFinite(mem[0].x)) {
    mem.length = 0;
    for (const g of goal) mem.push({ x: g, v: 0 });
    return goal.slice();
  }
  const k0 = Math.round((goal[0] - mem[0].x) / TAU);
  if (k0) for (const s of mem) s.x += k0 * TAU;
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / steps;
  const [ax, ay] = o.push ?? [0, 0];
  const mx = o.max ?? 1.4;
  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < n; i++) {
      const f = n > 1 ? i / (n - 1) : 0;
      // (each follows the one before it, held partly to its own goal so a long arm still arrives)
      const tgt = i ? mix(mem[i - 1].x + (goal[i] - goal[i - 1]), goal[i], o.anchor ?? 0.3) : goal[0];
      const sp = mem[i];
      const kk = mix(o.k[0], o.k[1], f);
      const cc = mix(o.c[0], o.c[1], f);
      const push = (o.gain ?? 0) * (Math.sin(sp.x) * ax - Math.cos(sp.x) * ay) * (0.5 + f);
      sp.v += ((tgt - sp.x) * kk - sp.v * cc + push) * h;
      sp.x += sp.v * h;
      const pin = o.pin ? o.pin[i] : 0;
      if (pin > 0) {
        sp.x = mix(sp.x, goal[i], pin);
        sp.v *= 1 - pin;
      }
      const dev = sp.x - tgt;
      if (Math.abs(dev) > mx) {
        sp.x = tgt + Math.sign(dev) * mx;
        sp.v *= 0.5;
      }
    }
  }
  return mem.map((s) => s.x);
}
// Nothing goes through the floor.
const onFloor = (J, W, floor = 0) => {
  for (let i = 0; i < J.length; i++) if (J[i][1] > floor - W[i] / 2) J[i] = [J[i][0], floor - W[i] / 2];
  return J;
};
// How a point of the body moves in the world (smoothed), in the rig's own (maybe mirrored) frame.
function motionAt(st, key, p, m, a) {
  const s = (st[key] ??= {});
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const sx = a.flip ? -1 : 1;
  const wx = sx * p[0] + (m.x ?? 0);
  const wy = p[1] + (m.y ?? 0);
  if (dt > 0 && s.wx !== undefined && s.flip === a.flip && Math.hypot(wx - s.wx, wy - s.wy) < 30) {
    const f = Math.min(1, dt * 16);
    const vx = mix(s.vx, (wx - s.wx) / dt, f);
    const vy = mix(s.vy, (wy - s.wy) / dt, f);
    s.ax = mix(s.ax, clamp((vx - s.vx) / dt, -1500, 1500), f);
    s.ay = mix(s.ay, clamp((vy - s.vy) / dt, -1500, 1500), f);
    s.vx = vx;
    s.vy = vy;
  } else if (dt > 0 || s.wx === undefined) Object.assign(s, { vx: 0, vy: 0, ax: 0, ay: 0 });
  Object.assign(s, { wx, wy, flip: a.flip });
  return { vx: s.vx * sx, vy: s.vy, ax: s.ax * sx, ay: s.ay };
}

// ---------- Drawing ----------
const flashOf = (a) => Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
const tone = (a, hex, al = 1) => {
  const k = flashOf(a);
  if (k <= 0 && al >= 1) return hex;
  const [r, g, b] = rgbOf(hex);
  const f = (v) => Math.round(v + (255 - v) * k);
  return `rgba(${f(r)},${f(g)},${f(b)},${al})`;
};
const glowAt = (ctx, a, c, r, hex, al) => {
  const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
  gr.addColorStop(0, tone(a, hex, al));
  gr.addColorStop(1, tone(a, hex, 0));
  ctx.fillStyle = gr;
  ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
};
const edge = (ctx) => {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
};
const polyPath = (ctx, pts) => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
};
// A soft strand: a disc at every point, joined side to side (one shape, round at the tip).
function strandInto(ctx, pts, ws) {
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const r = Math.max(0.12, ws[i] / 2);
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
    if (!i) continue;
    const [x0, y0] = pts[i - 1];
    const r0 = Math.max(0.12, ws[i - 1] / 2);
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
// The joints smoothed into a dense line, each point's width eased between its joints'.
function strandPts(J, W, per = 3, wob = null) {
  const pts = lineCurve(J, per);
  const ws = pts.map((_, i) => {
    const f = i / per;
    const j = Math.min(W.length - 2, Math.floor(f));
    const w = mix(W[j], W[j + 1], f - j);
    return wob ? w * wob(f / (W.length - 1)) : w;
  });
  return [pts, ws];
}
// An arm: outlined, then filled, with a soft shade along its underside and a soft light along its top.
// (its edge: one clean line round it, out along one side, round the tip, back along the other)
function strandEdge(pts, ws) {
  const L = [];
  const R = [];
  for (let i = 0; i < pts.length; i++) {
    const q0 = pts[Math.max(0, i - 1)];
    const q1 = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1;
    const nx = -(q1[1] - q0[1]) / l;
    const ny = (q1[0] - q0[0]) / l;
    const h = ws[i] / 2;
    L.push([pts[i][0] + nx * h, pts[i][1] + ny * h]);
    R.push([pts[i][0] - nx * h, pts[i][1] - ny * h]);
  }
  const e = pts.length - 1;
  const an = Math.atan2(pts[e][1] - pts[e - 1][1], pts[e][0] - pts[e - 1][0]);
  const cap = [];
  for (let k = 1; k < 6; k++) {
    const q = an + Math.PI / 2 - (k * Math.PI) / 6;
    cap.push([pts[e][0] + Math.cos(q) * ws[e] / 2, pts[e][1] + Math.sin(q) * ws[e] / 2]);
  }
  return [...L, ...cap, ...R.reverse()];
}
// An arm: outlined, then filled, with a soft shade along its side away from the light and a soft
// rim just inside its edge where it lies over another arm, so the two still read apart.
function drawStrand(ctx, a, mode, pts, ws, look, beneath = null) {
  ctx.beginPath();
  strandInto(ctx, pts, ws);
  if (mode === 'line') return edge(ctx);
  ctx.fillStyle = tone(a, look.fill);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  strandInto(ctx, pts, ws);
  ctx.clip();
  // (each point's side away from the light, up and to the left)
  const away = pts.map((p, i) => {
    const q0 = pts[Math.max(0, i - 1)];
    const q1 = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1;
    let nx = -(q1[1] - q0[1]) / l;
    let ny = (q1[0] - q0[0]) / l;
    if (nx * 0.45 + ny * 0.9 < 0) [nx, ny] = [-nx, -ny];
    return [nx, ny];
  });
  // (the shade eased in from the root, so where it grows out of the body there's no band)
  if (look.shade) {
    ctx.beginPath();
    strandInto(ctx, pts.map(([x, y], i) => [x + away[i][0] * ws[i] * 0.36, y + away[i][1] * ws[i] * 0.36]), ws.map((v, i) => v * 0.5 * ease(i / (pts.length * 0.3))));
    ctx.fillStyle = tone(a, look.shade, look.shadeA ?? 0.6);
    ctx.fill();
  }
  // (only where it lies over something drawn before it)
  if (look.rim && beneath?.length) {
    ctx.beginPath();
    for (const [p2, w2] of beneath) strandInto(ctx, p2, w2);
    ctx.clip();
    polyPath(ctx, strandEdge(pts, ws));
    ctx.strokeStyle = tone(a, look.rim);
    ctx.lineWidth = 0.9;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  ctx.restore();
}
const NEAR = { fill: C.base, shade: C.sh, shadeA: 0.5, rim: C.sh };
const FAR = { fill: C.sh, shade: C.deep, shadeA: 0.4, rim: C.deep };
const NEAR_O = { fill: C.base };
const FAR_O = { fill: C.sh };
const BLANK = () => sprite('rig|tentblank', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));
// A soft guide line (where the eyes go, the middle of the face): faint, never a feature.
const guide = (ctx, a, p0, c, p1, w = 0.45) => {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  ctx.strokeStyle = tone(a, C.guide);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.stroke();
};
// A wandering glance: held, then turning to the next, every few seconds.
const glance = (t, seed) => {
  const blk = Math.floor(t / 5);
  const k = ease(((t / 5) % 1) / 0.18);
  return mix(rand(blk - 1, seed), rand(blk, seed), k) * 2 - 1;
};
// Round an arm into a coil about a point: out from the root to its near side, then round it
// (over the top clockwise, or under it the other way), tightening.
function coilGuide(R, a0, Pc, r, over) {
  const E0 = [Pc[0], Pc[1] + (over ? -r : r)];
  const d = Math.max(1, Math.hypot(E0[0] - R[0], E0[1] - R[1]));
  const pts = bezPts(R, plus(R, times(unit(a0), d * 0.45)), [E0[0] - d * 0.4, E0[1]], E0, 10);
  const a1 = over ? -Math.PI / 2 : Math.PI / 2;
  const sg = over ? 1 : -1;
  for (let k = 1; k <= 26; k++) {
    const f = k / 26;
    const an = a1 + sg * f * 1.7 * TAU;
    const rr = r * (1 - 0.32 * f);
    pts.push([Pc[0] + Math.cos(an) * rr, Pc[1] + Math.sin(an) * rr]);
  }
  return pts;
}

// ---------- The critters ----------
const OCTOPUS = {
  name: 'Octopus',
  speed: 16,
  // the arm crown's height off the floor (standing, settled flat)
  crown: 10.5,
  flatCrown: 5,
  // the mantle: hinged at its base (from the crown), its radii, leaning back
  mantle: { at: [-0.4, 1.4], rx: 11.2, ry: 11.6, tilt: -7 },
  // under the mantle, round the crown (back to front): the arms come straight out from under it
  waist: [[-9, 0.9], [-5.8, 3.2], [-1.8, 3.9], [1.8, 3.9], [5.6, 3.2], [8.8, 1.1]],
  // each arm: length, segments, widths (root, tip), the curl's length, how steeply it comes down
  // to the floor (deg), how much farther out it lands settled flat
  arm: { L: 20, n: 10, w0: 6.4, w1: 2.1, curlLen: 6.5, land: 30, flatD: 4 },
  // [root from the crown, its way out (deg), front (+1) or back (-1), its place in the wave, far?,
  // how far out it lands, how much its tip curls, slap and grab shares, coil over?, coil size]:
  // a long arm each side reaching out front and back, another a little behind it, and two short
  // middle ones peeking out between them (the rest of the eight hidden behind)
  arms: [
    { at: [6.2, 1.6], dir: 18, g: 1, ph: 0, far: false, D: 7.6, cf: 1, slap: 1, grab: 1, over: true, r: 3 },
    { at: [-6.6, 1.6], dir: 162, g: -1, ph: 0.5, far: false, D: 7.6, cf: 1 },
    { at: [4.2, 1.6], dir: 44, g: 1, ph: 0.62, far: true, D: 5, cf: 0.85, slap: 0.55, grab: 1, over: false, r: 3.4 },
    { at: [-4.6, 1.6], dir: 136, g: -1, ph: 0.12, far: true, D: 5, cf: 0.85 },
    { at: [2.2, 2.4], dir: 74, g: 1, ph: 0.25, far: true, mid: true, len: 0.62, D: 2.6, cf: 0.2, grab: 0.8, over: false, r: 4 },
    { at: [-2.6, 2.4], dir: 106, g: -1, ph: 0.75, far: true, mid: true, len: 0.62, D: 2.6, cf: 0.2 },
  ],
  // the crawl: px per wave, the share of it each arm is down, how high an arm lifts
  cycle: 8.5,
  duty: 0.72,
  lift: 3.4,
  moves: ['slap', 'grab', 'ink'],
};
const JELLYFISH = {
  name: 'Jellyfish',
  speed: 22,
  // the rim's height (floating), how far it sinks settling; the bell's half width and height
  rim: 24,
  sink: 13,
  bell: { w: 13, h: 15 },
  fringe: 6,
  // the four oral arms: [x under the bell, spread (deg), far?]
  oral: { L: 17, n: 8, w0: 3.6, w1: 0.9, at: [[-1.8, 14, true], [1.6, -12, true], [-0.8, 5, false], [0.9, -6, false]] },
  // the six fine tentacles: [place along the rim (-1..1), spread (deg), far?]
  fine: { L: 22, n: 10, w0: 1, w1: 0.45, at: [[-0.86, 12, true], [-0.48, 6, false], [-0.14, 2, true], [0.2, -3, false], [0.54, -7, true], [0.88, -12, false]] },
  // the swim: pulses a second floating, px swum per pulse
  hz: 0.55,
  cycle: 20,
  moves: ['sting', 'grab', 'slap'],
};
const STARFISH = {
  name: 'Starfish',
  speed: 20,
  // each arm: from r0 out of the middle, its length, segments, widths (root, tip)
  arm: { L: 16, n: 5, w0: 10.4, w1: 4.2, r0: 2.4 },
  // the web between two arms (from the middle); its middle's height standing, settled flat
  crotch: 7.8,
  stand: 15.2,
  flatStand: 6.2,
  // where a "foot" stands (out from the middle), the walk: px a stride, share down, lift
  foot: 12.2,
  cycle: 16,
  duty: 0.6,
  lift: 3.6,
  moves: ['slap', 'grab', 'spin'],
};
export const TENTACLE_PRESETS = { octopus: OCTOPUS, jellyfish: JELLYFISH, starfish: STARFISH };
export const TENTACLE_KINDS = ['octopus', 'jellyfish', 'starfish'];

// ---------- The moves (keys: [seconds, pose, ease into it]; x, hop in body heights, angles in degrees) ----------
// Channels: pitch (+ leans forward), tilt (octopus: the mantle's own lean; starfish: its lean),
// pump (+ the mantle or bell squeezes, - fills), crouch, raise (up tall, arms up), stream (arms
// trailing in a bundle), splay (arms flung out), slap + whip (an arm cocked at whip 0, struck through
// at 1), grab + squeeze (coiled round a point in front), zap (jellyfish tentacles flicked forward),
// roll (starfish turns, a fifth of a turn is the same star), free (starfish arms loose and straight),
// flat (settled), curl, sleep.
const OCT_MOVES = {
  slap: {
    anticT: 0.24,
    keys: [
      [0, { slap: 1, whip: 0, pitch: -9, tilt: -8, x: -0.03, crouch: 0.25 }],
      [0.07, { slap: 1, whip: 1, pitch: 13, tilt: 7, x: 0.07, crouch: 0.1 }, 'out'],
      [0.17, { slap: 1, whip: 1, pitch: 9, tilt: 3, x: 0.06 }],
      [0.44, { slap: 0, whip: 1, pitch: 2, x: 0.03 }, 'io'],
      [0.66, {}],
    ],
    spark: [0.08],
    sparkAt: 'slap',
    dust: [[0.08, 'slap']],
  },
  grab: {
    anticT: 0.22,
    keys: [
      [0, { pitch: -7, tilt: -6, crouch: 0.35, x: -0.02, splay: 0.25 }],
      [0.13, { grab: 1, pitch: 11, tilt: 4, x: 0.08 }, 'out'],
      [0.28, { grab: 1, squeeze: 1, pitch: 9, x: 0.08, pump: 0.35 }, 'io'],
      [0.42, { grab: 1, squeeze: 0.25, pitch: 9, x: 0.08 }, 'io'],
      [0.56, { grab: 1, squeeze: 1, pitch: 9, x: 0.08, pump: 0.35 }, 'io'],
      [0.82, { grab: 0, pitch: 2, x: 0.03 }, 'io'],
      [1.02, {}],
    ],
    spark: [0.28, 0.56],
    sparkAt: 'grab',
  },
  ink: {
    anticT: 0.3,
    keys: [
      [0, { pump: -0.5, tilt: -9, pitch: -5, splay: 0.15, lift: 0.8 }],
      [0.06, { pump: 1, tilt: 7, pitch: 6, x: -0.06, splay: 0.3 }, 'out'],
      [0.3, { pump: 0.55, tilt: 2, x: -0.07, splay: 0.1 }],
      [0.62, {}],
    ],
    ink: [0.05],
  },
  jump: {
    anticT: 0.18,
    keys: [
      [0, { crouch: 1, pitch: 3, pump: -0.25 }],
      [0.14, { hop: 0.62, crouch: 0, stream: 1, pump: 0.8 }, 'out'],
      [0.34, { hop: 0.7, stream: 0.15, splay: 0.75, pump: -0.25 }, 'out'],
      [0.52, { hop: 0.02, splay: 0.3, crouch: 0.1 }, 'in'],
      [0.6, { crouch: 0.85 }, 'out'],
      [0.92, {}],
    ],
    dust: [[0, 'feet'], [0.53, 'feet']],
  },
  dash: {
    anticT: 0.12,
    keys: [
      [0, { pump: -0.45, crouch: 0.45, tilt: -6 }],
      [0.06, { x: 0.25, hop: 0.14, pump: 1, pitch: 55, stream: 1 }, 'out'],
      [0.3, { x: 0.32, hop: 0.12, pump: 0.5, pitch: 50, stream: 1 }],
      [0.5, { x: 0.33, crouch: 0.4, pitch: 8, stream: 0.2 }, 'in'],
      [0.82, {}],
    ],
    bubbles: [0.04, 0.42],
    lines: [0.04, 0.34],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.5 }],
      [0.12, { x: -0.25, hop: 0.25, pitch: -18, stream: 0.6, pump: 0.6 }, 'out'],
      [0.32, { x: -0.28, crouch: 0.5, pitch: -4 }, 'in'],
      [0.64, {}],
    ],
    dust: [[0.32, 'feet']],
  },
  hurt: {
    anticT: 0,
    keys: [[0, {}], [0.05, { x: -0.05, pitch: -14, tilt: -12, splay: 0.6, pump: 0.5, crouch: 0.3 }, 'out'], [0.22, { x: -0.05, pitch: -9, tilt: -8, splay: 0.4, pump: 0.3, crouch: 0.25 }], [0.58, {}]],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.1, { x: -0.06, hop: 0.12, pitch: -24, splay: 0.7, pump: 0.4 }, 'out'],
      [0.38, { x: -0.1, flat: 1, tilt: -34, pitch: -6, splay: 0.15 }, 'in'],
      [0.46, { x: -0.1, flat: 0.9, tilt: -28, pitch: -4 }, 'out'],
      [1.05, { x: -0.1, flat: 1, tilt: -34, pitch: -6 }],
      [1.34, { x: -0.05, crouch: 0.5 }],
      [1.62, {}],
    ],
    dust: [[0.38, 'feet']],
  },
  // Pleased: up tall, the arms spread and uncurled, the mantle filled; then settling.
  stretch: {
    anticT: 0.2,
    keys: [
      [0, { crouch: 0.3 }],
      [0.35, { raise: 1, splay: 0.35, pump: -0.35, lift: 2.4 }, 'io'],
      [0.85, { raise: 1, splay: 0.35, pump: -0.35, lift: 2.4 }],
      [1.22, {}, 'io'],
    ],
  },
};
const JELLY_MOVES = {
  sting: {
    anticT: 0.26,
    keys: [
      [0, { pitch: -14, pump: -0.4, zap: -0.4, x: -0.03 }],
      [0.07, { pitch: 16, pump: 1, zap: 1, x: 0.12 }, 'out'],
      [0.22, { pitch: 12, pump: 0.6, zap: 0.9, x: 0.12 }],
      [0.5, { pitch: 3, zap: 0.15, x: 0.05 }, 'io'],
      [0.74, {}],
    ],
    zap: [0.06, 0.34],
    spark: [0.08],
    sparkAt: 'tips',
  },
  slap: {
    anticT: 0.22,
    keys: [
      [0, { pitch: -18, slap: 1, whip: 0, x: -0.03, pump: -0.2 }],
      [0.08, { pitch: 20, slap: 1, whip: 1, x: 0.08, pump: 0.7 }, 'out'],
      [0.36, { pitch: 5, slap: 0, whip: 1, x: 0.04 }, 'io'],
      [0.62, {}],
    ],
    spark: [0.09],
    sparkAt: 'slap',
  },
  grab: {
    anticT: 0.22,
    keys: [
      [0, { pitch: -9, pump: -0.35, splay: 0.3 }],
      [0.14, { grab: 1, pitch: 20, x: 0.1, pump: 0.7 }, 'out'],
      [0.3, { grab: 1, squeeze: 1, pitch: 18, x: 0.1, pump: 0.4 }, 'io'],
      [0.44, { grab: 1, squeeze: 0.25, pitch: 18, x: 0.1 }, 'io'],
      [0.58, { grab: 1, squeeze: 1, pitch: 18, x: 0.1, pump: 0.4 }, 'io'],
      [0.84, { grab: 0, pitch: 4, x: 0.04 }, 'io'],
      [1.04, {}],
    ],
    spark: [0.3, 0.58],
    sparkAt: 'grab',
  },
  jump: {
    anticT: 0.2,
    keys: [
      [0, { pump: -0.45, hop: -0.04 }],
      [0.12, { hop: 0.42, pump: 1, stream: 1 }, 'out'],
      [0.42, { hop: 0.52, pump: -0.35, splay: 0.45, stream: 0 }, 'out'],
      [0.85, { hop: 0.05, pump: 0 }, 'io'],
      [1.05, {}],
    ],
  },
  dash: {
    anticT: 0.12,
    keys: [
      [0, { pitch: -10, pump: -0.35 }],
      [0.06, { x: 0.16, pitch: 68, pump: 1, stream: 1 }, 'out'],
      [0.2, { x: 0.22, pitch: 68, pump: -0.25, stream: 1 }, 'io'],
      [0.27, { x: 0.33, pitch: 68, pump: 1, stream: 1 }, 'out'],
      [0.46, { x: 0.37, pitch: 36, pump: 0, stream: 0.4 }, 'io'],
      [0.78, {}],
    ],
    bubbles: [0.04, 0.5],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { pitch: 8, pump: -0.3 }],
      [0.1, { x: -0.22, hop: 0.08, pitch: -40, pump: 1, stream: 1 }, 'out'],
      [0.36, { x: -0.26, pitch: -10, pump: 0, stream: 0.2 }, 'io'],
      [0.64, {}],
    ],
  },
  hurt: {
    anticT: 0,
    keys: [[0, {}], [0.05, { x: -0.05, pitch: -24, pump: 0.8, splay: 0.8 }, 'out'], [0.24, { x: -0.05, pitch: -14, pump: 0.3, splay: 0.4 }], [0.6, {}]],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.12, { x: -0.08, pitch: -100, pump: 0.7, splay: 0.6 }, 'out'],
      [0.5, { x: -0.1, pitch: -140, hop: -0.18, pump: -0.2, splay: 0.2 }, 'io'],
      [1.0, { x: -0.1, pitch: -140, hop: -0.18, pump: -0.15 }],
      [1.42, { x: -0.05, pitch: -16, hop: -0.06, pump: 0.6 }, 'io'],
      [1.75, {}],
    ],
  },
  // Pleased: the bell opens slowly, wide, the arms and tentacles fanning out, then it settles.
  bloom: {
    anticT: 0.15,
    keys: [
      [0, { pump: 0.4 }],
      [0.45, { pump: -0.5, splay: 0.8, lift: 2.4 }, 'io'],
      [0.9, { pump: -0.5, splay: 0.8, lift: 2.4 }],
      [1.35, {}, 'io'],
    ],
  },
};
const STAR_MOVES = {
  slap: {
    anticT: 0.24,
    keys: [
      [0, { slap: 1, whip: 0, tilt: -12, crouch: 0.25 }],
      [0.07, { slap: 1, whip: 1, tilt: 13, x: 0.06, crouch: 0.15 }, 'out'],
      [0.17, { slap: 1, whip: 1, tilt: 10, x: 0.06 }],
      [0.44, { slap: 0, whip: 1, tilt: 2, x: 0.03 }, 'io'],
      [0.66, {}],
    ],
    spark: [0.08],
    sparkAt: 'slap',
  },
  grab: {
    anticT: 0.22,
    keys: [
      [0, { tilt: -8, crouch: 0.35, splay: 0.35 }],
      [0.13, { grab: 1, tilt: 12, x: 0.08 }, 'out'],
      [0.28, { grab: 1, squeeze: 1, tilt: 10, x: 0.08, crouch: 0.2 }, 'io'],
      [0.42, { grab: 1, squeeze: 0.25, tilt: 10, x: 0.08 }, 'io'],
      [0.56, { grab: 1, squeeze: 1, tilt: 10, x: 0.08, crouch: 0.2 }, 'io'],
      [0.82, { grab: 0, tilt: 2, x: 0.03 }, 'io'],
      [1.02, {}],
    ],
    spark: [0.28, 0.56],
    sparkAt: 'grab',
  },
  spin: {
    anticT: 0.24,
    keys: [
      [0, { crouch: 0.9, tilt: -14, roll: -0.03 }],
      [0.1, { hop: 0.34, crouch: 0, roll: 0.45, free: 1, x: 0.04 }, 'out'],
      [0.4, { hop: 0.4, roll: 1.6, free: 1, x: 0.1 }],
      [0.56, { hop: 0.02, roll: 2, free: 0.5, x: 0.1 }, 'in'],
      [0.64, { crouch: 0.75, roll: 2, x: 0.1 }, 'out'],
      [0.98, { roll: 2 }],
    ],
    trail: [0.08, 0.58],
    spark: [0.3],
    sparkAt: 'front',
    dust: [[0.57, 'feet']],
  },
  jump: {
    anticT: 0.18,
    keys: [
      [0, { crouch: 1 }],
      [0.14, { hop: 0.6, raise: 1 }, 'out'],
      [0.34, { hop: 0.66, raise: 0.6 }, 'out'],
      [0.52, { hop: 0.02, raise: 0.2 }, 'in'],
      [0.6, { crouch: 0.85 }, 'out'],
      [0.92, {}],
    ],
    dust: [[0, 'feet'], [0.53, 'feet']],
  },
  // A cartwheel: up off the feet and once round, landing on the next arms.
  dash: {
    anticT: 0.12,
    keys: [
      [0, { crouch: 0.6, tilt: -8 }],
      [0.08, { hop: 0.28, x: 0.14, roll: 0.3, free: 1 }, 'out'],
      [0.3, { hop: 0.26, x: 0.34, roll: 0.85, free: 1 }],
      [0.42, { x: 0.4, roll: 1, free: 0.3, crouch: 0.6 }, 'in'],
      [0.72, { x: 0.4, roll: 1 }],
      [0.92, { roll: 1 }],
    ],
    trail: [0.06, 0.4],
    dust: [[0.42, 'feet']],
  },
  // A tumble back onto the next arms.
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.5 }],
      [0.12, { x: -0.2, hop: 0.22, roll: -0.1, free: 0.7 }, 'out'],
      [0.3, { x: -0.26, roll: -0.2, crouch: 0.5 }, 'in'],
      [0.62, { roll: -0.2 }],
    ],
    dust: [[0.3, 'feet']],
  },
  hurt: {
    anticT: 0,
    keys: [[0, {}], [0.05, { x: -0.05, tilt: -16, splay: 0.7, crouch: 0.4 }, 'out'], [0.22, { x: -0.05, tilt: -10, splay: 0.45, crouch: 0.3 }], [0.58, {}]],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.1, { x: -0.06, hop: 0.14, roll: -0.07, splay: 0.6 }, 'out'],
      [0.4, { x: -0.1, roll: -0.2, flat: 1, sleep: 0.6 }, 'in'],
      [0.48, { x: -0.1, roll: -0.2, flat: 0.88, sleep: 0.6 }, 'out'],
      [1.05, { x: -0.1, roll: -0.2, flat: 1, sleep: 0.6 }],
      [1.34, { x: -0.05, roll: -0.2, crouch: 0.5 }],
      [1.62, { roll: -0.2 }],
    ],
    dust: [[0.4, 'feet']],
  },
  // Pleased: arms up and a happy sway on tiptoe.
  cheer: {
    anticT: 0.15,
    keys: [
      [0, { crouch: 0.35 }],
      [0.25, { raise: 1, lift: 2.2 }, 'out'],
      [0.5, { raise: 1, tilt: 7, lift: 1.4 }, 'io'],
      [0.75, { raise: 1, tilt: -7, lift: 2.2 }, 'io'],
      [1.0, { raise: 1, lift: 1.2 }, 'io'],
      [1.28, {}, 'io'],
    ],
  },
};
export const TENTACLE_MOVES = { octopus: OCT_MOVES, jellyfish: JELLY_MOVES, starfish: STAR_MOVES };
export const TENTACLE_SHOW = {
  octopus: ['slap', 'grab', 'ink', 'jump', 'dash', 'dodge', 'hurt', 'knockdown', 'stretch'],
  jellyfish: ['sting', 'slap', 'grab', 'jump', 'dash', 'dodge', 'hurt', 'knockdown', 'bloom'],
  starfish: ['slap', 'grab', 'spin', 'jump', 'dash', 'dodge', 'hurt', 'knockdown', 'cheer'],
};
const PLEASED = { octopus: 'stretch', jellyfish: 'bloom', starfish: 'cheer' };

const CH = ['x', 'hop', 'lift', 'pitch', 'tilt', 'look', 'pump', 'crouch', 'raise', 'stream', 'flat', 'curl', 'sleep', 'splay', 'slap', 'whip', 'grab', 'squeeze', 'roll', 'free', 'zap'];
const zero = () => Object.fromEntries(CH.map((c) => [c, 0]));
const EASES = { out: easeOut, in: (u) => clamp(u, 0, 1) ** 3, io: ease };
const moveLen = (mv) => mv.keys[mv.keys.length - 1][0];
// A move's pose at t (before 0: easing in from the base through its wind-up).
function posed(mv, t, antic, base) {
  if (t < 0) {
    const first = { ...base, ...mv.keys[0][1] };
    const o = {};
    for (const k of Object.keys(base)) o[k] = mix(base[k], first[k], ease(antic));
    return o;
  }
  let i = 0;
  while (i < mv.keys.length - 1 && t >= mv.keys[i + 1][0]) i++;
  const A0 = { ...base, ...mv.keys[i][1] };
  if (i >= mv.keys.length - 1) return A0;
  const [t1, k1, how] = mv.keys[i + 1];
  const B0 = { ...base, ...k1 };
  const u = (EASES[how] ?? ease)((t - mv.keys[i][0]) / Math.max(1e-6, t1 - mv.keys[i][0]));
  const o = {};
  for (const k of Object.keys(A0)) o[k] = mix(A0[k], B0[k], u);
  return o;
}
// (0..1 through `span` seconds after any of the moments, else -1)
const after = (moments, t, span) => {
  let best = -1;
  for (const s of moments ?? []) if (t >= s && t <= s + span) best = (t - s) / span;
  return best;
};

// ---------- The octopus ----------
function octopusRig(P) {
  const A = P.arm;
  const n = A.n;
  const seg = A.L / n;
  const wAt = (s) => A.w1 + (A.w0 - A.w1) * Math.max(0, 1 - s / A.L) ** 0.85;
  const W = Array.from({ length: n + 1 }, (_, i) => wAt(i * seg));
  const planted = Math.floor((A.L - A.curlLen) / seg) + 1;
  const reach = (P.cycle * P.duty) / 2;
  const M = P.mantle;
  const H = P.crown - M.at[1] + M.ry * 2;
  const prof = (a0, bend, tip) => Array.from({ length: n }, (_, i) => {
    const f = i / (n - 1);
    return a0 + bend * f + tip * f * f * f;
  });
  // An arm on the floor: from its root out in a soft arch (its start turning toward where it
  // lands, its bulge whatever keeps its length) down to `Cx`, where it touches (which stays put in
  // the world while it's down), arriving steeply, then its tip curling up and over: a soft J.
  // Lifted (`lift`), the same shape held up off the floor.
  // (`f`: the arm's length as a share of the full one: the middle arms, coming toward us, look
  // shorter)
  function stanceJoints(R, psiRest, Cx, g, lift, curl, f) {
    const L = A.L * f;
    const sg = L / n;
    const Lc = A.curlLen * f;
    const Lfree = L - Lc;
    const thIn = g > 0 ? A.land * D2R : Math.PI - A.land * D2R;
    // the tip first, from where it lands: on down a little, level along the floor, curling up;
    // set so its lowest point just rests on the floor
    const tail = [[0, 0]];
    const tot = curl * 2.4 + A.land * D2R;
    const N = 12;
    const step = (Lc + sg) / N;
    for (let k = 1; k <= N; k++) {
      const u = (k - 0.5) / N;
      const an = thIn - g * tot * Math.min(1.3, u * 1.15) ** 1.2;
      tail.push(plus(tail[tail.length - 1], times(unit(an), step)));
    }
    let low = 0;
    let lowI = 0;
    tail.forEach(([, y], i) => {
      if (y > low) {
        low = y;
        lowI = i;
      }
    });
    const wLow = wAt(Lfree + lowI * step);
    const c = [Cx, -wLow / 2 - low - lift];
    const d = Math.max(0.5, Math.hypot(c[0] - R[0], c[1] - R[1]));
    const chA = Math.atan2(c[1] - R[1], c[0] - R[0]);
    const u0 = unit(psiRest + wrapPi(chA - psiRest) * 0.2);
    const u1 = unit(thIn);
    // (the slack taken up by arching it outward, never by looping it)
    const nx = (c[1] - R[1]) / d;
    const ny = -(c[0] - R[0]) / d;
    const nrm = g > 0 ? [nx, ny] : [-nx, -ny];
    const make = (h) => bezPts(R, plus(plus(R, times(u0, 0.35 * d)), times(nrm, h)), plus(less(c, times(u1, 0.35 * d)), times(nrm, h)), c, 10);
    let lo = 0;
    let hi = 1.4 * d;
    let pts;
    if (polyLen(make(lo)) >= Lfree) pts = make(lo);
    else if (polyLen(make(hi)) <= Lfree) pts = make(hi);
    else {
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2;
        if (polyLen(make(mid)) > Lfree) hi = mid;
        else lo = mid;
      }
      pts = make((lo + hi) / 2);
    }
    for (let k = 1; k < tail.length; k++) pts.push(plus(c, tail[k]));
    return layAlong(pts, n, sg);
  }

  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const t = a.t + (m.uid % 7) * 1.1;
    const w = a.walkW ?? 0;
    const u = st.tnU ?? 0;
    const flat = clamp(S.flat, 0, 1);
    const curl = clamp(S.curl, 0, 1);
    const sleep = clamp(S.sleep, 0, 1);
    const crouch = clamp(S.crouch, 0, 1.2);
    const raise = clamp(S.raise, 0, 1);
    // The crown: lower crouching or settled, up tall stretching; bobbing gently as the wave rolls
    // under it, rocking a little.
    const crownH = mix(P.crown - crouch * 3 + raise * 2.2, P.flatCrown, Math.max(flat, curl * 0.85));
    const bob = (0.35 + 0.35 * Math.sin(TAU * 2 * u - 0.6)) * w;
    const rock = Math.sin(TAU * u) * 2.2 * w;
    const body = (S.pitch + rock) * D2R;
    const K = [S.x, -(crownH + S.lift + S.hop + bob)];
    const at = (p) => plus(K, turn(p, body));
    const mo = motionAt(st, 'tnK', K, m, a);
    // The mantle on its own soft hinge: it trails as the body speeds up and slows, and settles.
    const ms = (st.tnMantle ??= { x: 0, v: 0 });
    if (dt > 0) {
      ms.v += (-ms.x * 150 - ms.v * 14 - mo.ax * 0.0012 + mo.ay * 0.0004) * dt;
      ms.x = clamp(ms.x + ms.v * dt, -0.35, 0.35);
    }
    const pump = clamp(S.pump, -0.6, 1.2);
    const mAng = body + (M.tilt + S.tilt + S.look * 2.5 - sleep * 10) * D2R + ms.x;
    const Mb = at(M.at);
    const rx = M.rx * (1 - 0.1 * pump);
    const ry = M.ry * (1 + 0.11 * pump);
    const inM = (p) => plus(Mb, turn(p, mAng));
    // (an egg: full and round low where it meets the arms, tapering a little to its crown)
    const mantle = [44, 16, -12, -40, -65, -90, -115, -140, -168, -196, -224].map((ph) => {
      const sn = Math.sin(ph * D2R);
      return inM([rx * Math.cos(ph * D2R) * (1 + 0.1 * sn), -ry + ry * sn]);
    });
    const outline = loopCurve([...mantle, ...P.waist.map(at)], 4);
    // The arms.
    const airW = clamp(S.hop / 5, 0, 1);
    const stream = clamp(Math.max(S.stream, airW * (1 - clamp(S.splay, 0, 1))), 0, 1);
    const splay = clamp(S.splay + raise * 0.0, 0, 1);
    const grabP = at([15, -2.5]);
    const arms = [];
    for (const [k, ad] of P.arms.entries()) {
      const R = at(ad.at);
      const psi = ad.dir * D2R + body;
      // (the crawl: down for most of the wave, the floor sliding back under it; then up, curling,
      // and out ahead again)
      const q = (((u + ad.ph) % 1) + 1) % 1;
      let dx = 0;
      let lift = 0;
      let sw = 0;
      if (q < P.duty) dx = reach * (1 - 2 * (q / P.duty));
      else {
        const v = (q - P.duty) / (1 - P.duty);
        dx = -reach + 2 * reach * ease(v);
        sw = Math.sin(Math.PI * v);
        lift = P.lift * sw ** 0.9;
      }
      dx *= w;
      lift *= w;
      sw *= w;
      // (standing about: one arm at a time lifts a little and settles again; each tip curls in its
      // own time)
      const ev = hold((t + k * 2.05) % 16.4, 0, 0.9, 1.6, 2.6) * (a.calm ?? 0) * (1 - w) * (1 - sleep);
      lift += ev * 2.4;
      const curlAmt = (ad.cf ?? 1) * 0.62 + 0.16 * Math.sin(t * 0.6 + k * 2.4) * (1 - sleep * 0.7) + 0.35 * sw + 0.45 * ev - 0.3 * raise + 0.25 * sleep - 0.25 * flat;
      const D = ad.D + A.flatD * flat + raise * 1.2;
      const Cx = K[0] - S.x * 0.6 + ad.at[0] + ad.g * D + dx;
      const fl = ad.len ?? 1;
      const sgK = seg * fl;
      const ground = anglesOf(stanceJoints(R, psi, Cx, ad.g, lift, curlAmt, fl));
      // the other shapes: streaming behind in a bundle, flung out, curled up tight, slapping,
      // coiled round a point
      const wave = (i, amp, sp) => amp * Math.sin(t * sp - i * 0.85) * (i / (n - 1));
      const streamL = prof((90 + (ad.dir - 90) * 0.22) * D2R + body, -ad.g * 0.22, -ad.g * 0.5).map((v, i) => v + wave(i, 0.2, 9));
      const splayL = prof((ad.dir - ad.g * 34) * D2R + body, ad.g * 0.35, -ad.g * 1.5).map((v, i) => v + wave(i, 0.08, 5));
      const curlL = prof((ad.dir + ad.g * 12) * D2R + body, -ad.g * 2.3, -ad.g * 2.8);
      const parts = [];
      const wS = stream;
      const wP = splay * (1 - stream * 0.5);
      const wCu = curl;
      const wSl = clamp(S.slap, 0, 1) * (ad.slap ?? 0);
      const wG = clamp(S.grab, 0, 1) * (ad.grab ?? 0);
      if (wSl > 0) {
        const cocked = prof(-72 * D2R + body, -1.6, -0.8);
        const struck = prof(6 * D2R + body, 1.15, 0.45);
        parts.push([blendShapes([[cocked, 1 - clamp(S.whip, 0, 1)], [struck, clamp(S.whip, 0, 1)]]), wSl]);
      }
      if (wG > 0) {
        const aim = psi + wrapPi(Math.atan2(grabP[1] - R[1], grabP[0] - R[0]) - psi) * 0.5;
        const r = ad.r * (1 - 0.26 * clamp(S.squeeze, 0, 1));
        parts.push([anglesOf(layAlong(coilGuide(R, aim, plus(grabP, [ad.far ? 0.6 : 0, 0]), r, ad.over), n, sgK)), wG]);
      }
      let others = wS + wP + wCu + parts.reduce((s, p) => s + p[1], 0);
      const norm = others > 1 ? 1 / others : 1;
      const wGround = Math.max(0, 1 - others);
      const goal = blendShapes([[ground, wGround], [streamL, wS * norm], [splayL, wP * norm], [curlL, wCu * norm], ...parts.map(([L, ww]) => [L, ww * norm])]);
      // (down on the floor, the arm is laid exactly: no springs on the part that touches)
      const pinK = wGround * (1 - 0.9 * sw) * (1 - 0.8 * ev);
      const pin = goal.map((_, i) => (i < planted ? pinK : 0));
      const mem = ((st.tnArms ??= [])[k] ??= []);
      const quick = st.tnActive ? 2.4 : 1;
      const angs = chainOf(mem, goal, dt, { k: [380 * quick, 150 * quick], c: [30 * Math.sqrt(quick), 14 * Math.sqrt(quick)], gain: 0.03, push: [mo.ax, mo.ay], pin, max: 1.3 });
      const J = onFloor(jointsOf(R, angs, sgK), W);
      arms.push({ J, far: ad.far, k });
    }
    const slapArm = arms[0].J;
    return { K, body, at, outline, Mb, mAng, rx, ry, arms, grabP, siphon: at([7.8, 1.2]), front: clamp(Math.max(S.slap, S.grab) * 4, 0, 1) > 0.02, slapTip: slapArm[slapArm.length - 1], look: S.look };
  }

  // Drawing: the far arms (in shade), the near ones, then the body over their roots.
  // (the middle arms first, deep under the body, then the outer ones over them)
  const order = (far) => P.arms.map((ad, k) => [ad, k]).filter(([ad]) => ad.far === far).sort((p, q) => (q[0].mid ? 1 : 0) - (p[0].mid ? 1 : 0)).map(([, k]) => k);
  const FAR_K = order(true);
  const NEAR_K = order(false);
  function drawArms(ctx, a, mode, far) {
    const sk = a.tk;
    if (far) sk.drawn = [];
    for (const k of far ? FAR_K : NEAR_K) {
      // (the front arm, slapping or grabbing, comes round in front of the head instead)
      if (k === 0 && sk.front) continue;
      const [pts, ws] = strandPts(sk.arms[k].J, W);
      drawStrand(ctx, a, mode, pts, ws, far ? FAR_O : NEAR_O, null);
      if (mode === 'fill') sk.drawn.push([pts, ws]);
    }
    // one soft shade under the mantle over all of them, fading out along the arms
    if (!far && mode === 'fill' && sk.drawn.length) {
      ctx.save();
      ctx.beginPath();
      for (const [p2, w2] of sk.drawn) strandInto(ctx, p2, w2);
      ctx.clip();
      glowAt(ctx, a, sk.at([-0.4, 1.4]), 12, C.sh, 0.75);
      glowAt(ctx, a, sk.at([-0.4, 4]), 7, C.deep, 0.3);
      ctx.restore();
    }
  }
  // The front arm over the head: its line drawn with the others (so only its outer edge keeps
  // one), its fill over the body, its soft rim only where it crosses the head and the arms, fading
  // out toward its root so it grows out of the body with no seam.
  function drawFrontArm(ctx, a, mode) {
    const sk = a.tk;
    if (!sk.front) return;
    const [pts, ws] = strandPts(sk.arms[0].J, W);
    if (mode === 'line') {
      ctx.beginPath();
      strandInto(ctx, pts, ws);
      return edge(ctx);
    }
    drawStrand(ctx, a, mode, pts, ws, NEAR_O, null);
    // (a soft rim only where it crosses the head, fading out toward its root)
    const e = strandEdge(pts, ws);
    const i0 = Math.round(pts.length * 0.4);
    const run = e.slice(i0, e.length - i0);
    ctx.save();
    ctx.beginPath();
    strandInto(ctx, pts, ws);
    ctx.clip();
    polyPath(ctx, sk.outline);
    ctx.clip();
    ctx.beginPath();
    run.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = tone(a, C.sh);
    ctx.lineWidth = 0.9;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }
  function drawBody(ctx, a, mode) {
    const sk = a.tk;
    polyPath(ctx, sk.outline);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    polyPath(ctx, sk.outline);
    ctx.clip();
    const inM = (p) => plus(sk.Mb, turn(p, sk.mAng));
    // the dome lit from above, a soft shade round the back of it and under the mantle's rim
    glowAt(ctx, a, inM([-2.2, -sk.ry * 1.45]), sk.rx * 1.05, C.lt, 0.95);
    glowAt(ctx, a, inM([-sk.rx * 0.95, -sk.ry * 0.45]), sk.rx * 0.75, C.sh, 0.55);
    glowAt(ctx, a, inM([-sk.rx * 0.35, sk.ry * 0.05]), sk.rx * 0.6, C.sh, 0.3);
    // the soft line where the eyes go, round the front of the head
    const lk = (sk.look ?? 0) * 1.2;
    guide(ctx, a, inM([1.4 + lk, -6.6]), inM([5.6 + lk, -8.6]), inM([sk.rx * 0.84, -7.4]));
    ctx.restore();
  }

  function spot(sk, what) {
    if (what === 'slap') return sk.slapTip;
    if (what === 'grab') return sk.grabP;
    if (what === 'mouth') return sk.siphon;
    return [sk.K[0], 0];
  }
  const still = (wB, hB) => [E(wB / 2 - 1, hB - 15, 11, 12, C.base), E(wB / 2 + 7, hB - 3, 7, 2.6, C.base), E(wB / 2 - 9, hB - 3, 7, 2.6, C.base), E(wB / 2, hB - 6, 7, 4, C.base)];
  return {
    H,
    speed: P.speed,
    cycle: P.cycle,
    w: 32,
    h: Math.round(H * 1.08),
    boxW: 110,
    boxH: Math.ceil(H * 1.5),
    skeleton,
    spot,
    still,
    seq: [['armsFar', (c, a, md) => drawArms(c, a, md, true)], ['armsNear', (c, a, md) => drawArms(c, a, md, false)], ['body', drawBody], ['armFront', drawFrontArm]],
    base(t, m, a, w) {
      const o = zero();
      const breath = Math.sin(t * 1.25);
      const s = hold(t % 15, 10, 10.9, 12.1, 13.2) * (a.calm ?? 0);
      o.pump = 0.1 * breath * (1 - w) + 0.06 * w;
      o.tilt = breath * 1.2 * (1 - w) - 9 * w;
      o.look = glance(t, m.uid ?? 0) * (1 - w);
      o.pitch = 4 * w;
      o.raise = s * (1 - w);
      o.lift = s * 1.2 * (1 - w);
      return o;
    },
    poses(o, name, t) {
      const breath = Math.sin(t * 0.9);
      if (name === 'rest') Object.assign(o, { flat: 1, tilt: -6 + breath, pump: 0.06 * breath, pitch: 0, look: o.look * 0.5 });
      else if (name === 'curl') Object.assign(o, { curl: 1, tilt: 8, pump: 0.3 + 0.05 * breath, pitch: 4 });
      else if (name === 'sleep') Object.assign(o, { flat: 1, sleep: 1, tilt: -16 + breath * 1.5, pump: 0.1 * breath, pitch: 0, look: 0 });
      else if (name === 'dead') Object.assign(o, { flat: 1, sleep: 0.6, splay: 0.2, tilt: -24, pump: -0.2, pitch: 0, look: 0 });
    },
  };
}

// ---------- The jellyfish ----------
function jellyRig(P) {
  const B0 = P.bell;
  const OA = P.oral;
  const FT = P.fine;
  const oSeg = OA.L / OA.n;
  const fSeg = FT.L / FT.n;
  const oW = Array.from({ length: OA.n + 1 }, (_, i) => mix(OA.w0, OA.w1, (i / OA.n) ** 0.8));
  const fW = Array.from({ length: FT.n + 1 }, (_, i) => mix(FT.w0, FT.w1, i / FT.n));
  const H = P.rim + B0.h + 1;
  // One pulse: the quick squeeze (the rim sweeping in and down), a slow relax a little past round,
  // back to rest; the lift it gives (up through the squeeze, drifting back down as it relaxes).
  const pulseAt = (ph) => (ph < 0.28 ? easeOut(ph / 0.28) : ph < 0.7 ? mix(1, -0.14, ease((ph - 0.28) / 0.42)) : mix(-0.14, 0, ease((ph - 0.7) / 0.3)));
  const riseAt = (ph) => (ph < 0.06 ? 0 : ph < 0.46 ? easeOut((ph - 0.06) / 0.4) : 1 - ease((ph - 0.46) / 0.54));
  const prof = (nn, a0, bend, tip) => Array.from({ length: nn }, (_, i) => {
    const f = i / (nn - 1);
    return a0 + bend * f + tip * f * f * f;
  });

  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const t = a.t + (m.uid % 7) * 1.1;
    const alive = m.hp > 0 ? 1 : 0;
    const flat = clamp(S.flat, 0, 1);
    const sleep = clamp(S.sleep, 0, 1);
    const curl = clamp(S.curl, 0, 1);
    const go = st.tnGo ?? 0;
    // The pulse: its own slow beat floating, quicker the farther it swims.
    const rate = (P.hz * (1 - 0.6 * Math.max(sleep, flat * 0.5)) + ((st.tnV ?? 0) / P.cycle) * go) * alive;
    st.jp = ((st.jp ?? ((m.uid ?? 0) * 0.37) % 1) + rate * dt) % 1;
    const ph = st.jp;
    st.jBusy = mix(st.jBusy ?? 0, st.tnActive ? 1 : 0, Math.min(1, dt * 6));
    const amp = (1 - 0.75 * st.jBusy) * (1 - 0.5 * flat) * alive;
    const p = clamp(S.pump + pulseAt(ph) * amp * 0.9, -0.6, 1.15);
    const rise = riseAt(ph);
    const bob = rise * 2.6 * amp * (1 + go * 0.4);
    const surge = (rise - 0.45) * 2 * go * amp;
    const B = [S.x + surge, -(P.rim - flat * P.sink + S.lift + S.hop + bob)];
    const beta = (S.pitch + go * 14) * D2R;
    const toW = (q) => plus(B, turn(q, beta));
    // The bell from its bones: the rim tips sweep in and down as it squeezes, the dome rising to
    // keep its volume; relaxed, wide and low.
    const wr = B0.w * (1 - 0.26 * p);
    const ws = B0.w * (1.02 - 0.12 * p);
    const hh = B0.h * (1 + 0.17 * p);
    const drop = 2.2 * Math.max(0, p) - 0.6 * Math.max(0, -p);
    const bell = [
      [wr, drop], [ws, -0.42 * hh], [0.62 * ws, -0.86 * hh], [0, -hh], [-0.62 * ws, -0.86 * hh], [-ws, -0.42 * hh], [-wr, drop],
      [-0.74 * wr, -0.03 * hh + drop * 0.5], [0, -0.1 * hh], [0.74 * wr, -0.03 * hh + drop * 0.5],
    ].map(toW);
    const outline = loopCurve(bell, 5);
    const mo = motionAt(st, 'tnB', B, m, a);
    // The fringe: a soft scalloped frill under the rim, trailing a beat behind the bell.
    const fr = (st.jFr ??= { x: 0, v: 0 });
    if (dt > 0) {
      fr.v += (-fr.x * 120 - fr.v * 10 + clamp(mo.ay, -900, 900) * 0.004) * dt;
      fr.x = clamp(fr.x + fr.v * dt, -1.2, 1.6);
    }
    // (one soft band: its top tucked up under the rim, its hem in shallow scallops, a ripple
    // running along it with each pulse)
    const frill = [];
    const lean = clamp(mo.vx * 0.004, -0.8, 0.8);
    const M = 40;
    for (let k = 0; k <= M; k++) {
      const f = k / M;
      const x = mix(-wr, wr, f) * 0.96;
      const sag = Math.sin(Math.PI * f) * 0.45;
      const scal = Math.abs(Math.sin(Math.PI * P.fringe * f)) ** 0.7;
      frill.push(toW([x - lean * f, drop + 0.6 + sag + scal * 1.05 + fr.x * (0.5 + sag) + 0.28 * Math.sin(TAU * ph - f * 7)]));
    }
    for (let k = M; k >= 0; k--) {
      const f = k / M;
      frill.push(toW([mix(-wr, wr, f) * 0.9, drop - 0.9 + Math.sin(Math.PI * f) * 0.3]));
    }
    // Everything hanging under it: down, trailing behind as it swims, tighter as it rises,
    // fanning a little as it relaxes; each pulse sends a ripple down them.
    const trail = clamp(mo.vx * 0.014, -0.9, 0.9);
    const rising = clamp(-mo.vy * 0.02, -1, 1);
    const fan = 1 + 0.6 * Math.max(0, -p) - 0.3 * Math.max(0, p) - 0.3 * Math.max(0, rising);
    const hang = Math.PI / 2;
    const splay = clamp(S.splay, 0, 1);
    const stream = clamp(S.stream, 0, 1);
    const zap = clamp(S.zap, -1, 1);
    const grab = clamp(S.grab, 0, 1);
    const slap = clamp(S.slap, 0, 1);
    const whip = clamp(S.whip, 0, 1);
    const grabP = toW([12, 13]);
    const chainSet = (key, roots, nn, sg, Wl, spreadOf, opts) => roots.map((R, j) => {
      const spread = spreadOf(j) * D2R;
      const a0 = hang + 0.55 * beta + spread * fan;
      const hangL = Array.from({ length: nn }, (_, i) => {
        const f = i / (nn - 1);
        return mix(a0, hang + trail + spread * 0.4, ease(f) * 0.85) + (0.16 * amp * Math.sin(TAU * ph - i * 0.7 + j) + 0.07 * Math.sin(t * 0.7 + j * 1.9 - i * 0.4) * (1 - sleep * 0.5)) * f;
      });
      const streamL = prof(nn, hang + beta + spread * 0.25, 0, 0).map((v, i) => v + 0.1 * Math.sin(t * 8 - i) * (i / nn));
      const splayL = prof(nn, hang + spread * 4 + Math.sign(spread || 1) * 0.3, Math.sign(spread || 1) * 0.6, 0);
      const sgC = spread >= 0 ? 1 : -1;
      const curlL = prof(nn, hang + spread * 2, sgC * 2.4, sgC * 3);
      const extra = opts(R, j, nn, sg);
      let others = stream + splay * (1 - stream * 0.5) + curl + extra.reduce((s, e) => s + e[1], 0);
      const norm = others > 1 ? 1 / others : 1;
      const goal = blendShapes([[hangL, Math.max(0, 1 - others)], [streamL, stream * norm], [splayL, splay * norm * (1 - stream * 0.5)], [curlL, curl * norm], ...extra.map(([L, ww]) => [L, ww * norm])]);
      const mem = ((st[key] ??= [])[j] ??= []);
      // (quicker through a move, so a flick lands on its beat; loose and trailing otherwise)
      const q = st.tnActive ? 3 : 1;
      const angs = chainOf(mem, goal, dt, { k: [opts.k[0] * q, opts.k[1] * q], c: [opts.c[0] * Math.sqrt(q), opts.c[1] * Math.sqrt(q)], gain: opts.gain, push: [mo.ax, mo.ay], max: 1.6, anchor: st.tnActive ? 0.45 : 0.2 });
      return onFloor(jointsOf(R, angs, sg), Wl);
    });
    const oralRoots = OA.at.map(([x]) => toW([x, -0.12 * hh]));
    const oralOpts = (R, j, nn, sg) => {
      const out = [];
      if (slap > 0) out.push([blendShapes([[prof(nn, hang + 1.0, 0.5, 0.3), 1 - whip], [prof(nn, 0.45, -0.5, -0.6), whip]]), slap]);
      if (grab > 0) out.push([anglesOf(layAlong(coilGuide(R, hang - 0.4, plus(grabP, [0, j * 0.4 - 0.6]), 2.6 + j * 0.45, j % 2 === 0), nn, sg)), grab]);
      return out;
    };
    Object.assign(oralOpts, { k: [150, 70], c: [14, 8], gain: 0.05 });
    const oral = chainSet('jOral', oralRoots, OA.n, oSeg, oW, (j) => OA.at[j][1], oralOpts);
    const fineRoots = FT.at.map(([f]) => toW([f * wr * 0.94, drop + 0.6]));
    const fineOpts = (R, j, nn, sg) => {
      const out = [];
      if (zap > 0) out.push([prof(nn, 0.55, -0.7, -0.3), zap]);
      else if (zap < 0) out.push([prof(nn, hang + 0.75, 0.25, 0), -zap]);
      if (grab > 0 && FT.at[j][0] > 0) out.push([anglesOf(layAlong(coilGuide(R, hang - 0.3, grabP, 3.6 + j * 0.3, j % 2 === 1), nn, sg)), grab * 0.8]);
      return out;
    };
    Object.assign(fineOpts, { k: [110, 40], c: [11, 5], gain: 0.07 });
    const fine = chainSet('jFine', fineRoots, FT.n, fSeg, fW, (j) => FT.at[j][1], fineOpts);
    const tips = fine.filter((_, j) => FT.at[j][0] > 0).map((J) => J[J.length - 1]);
    return { B, beta, toW, wr, ws, hh, drop, outline, frill, oral, fine, grabP, tips, look: S.look, slapTip: oral[3][oral[3].length - 1] };
  }

  function drawFine(ctx, a, mode, far) {
    const sk = a.tk;
    for (const [j, J] of sk.fine.entries()) {
      if (FT.at[j][2] !== far) continue;
      const [pts, ws] = strandPts(J, fW, 2);
      ctx.beginPath();
      strandInto(ctx, pts, ws);
      ctx.fillStyle = tone(a, far ? C.sh : C.deep);
      ctx.fill();
    }
  }
  function drawOral(ctx, a, mode, far) {
    const sk = a.tk;
    const t = a.t;
    for (const [j, J] of sk.oral.entries()) {
      if (OA.at[j][2] !== far) continue;
      // (a soft ruffled edge along its length, more toward the end)
      const [pts, ws] = strandPts(J, oW, 3, (f) => 1 + 0.2 * Math.sin(f * 15 + t * 1.6 + j) * f);
      drawStrand(ctx, a, mode, pts, ws, far ? FAR : NEAR);
    }
  }
  function drawFringe(ctx, a, mode) {
    const sk = a.tk;
    polyPath(ctx, sk.frill);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    // (shaded under the rim, paler toward the hem)
    ctx.save();
    ctx.clip();
    const top = sk.toW([0, sk.drop - 0.4]);
    glowAt(ctx, a, top, sk.wr * 1.1, C.sh, 0.7);
    ctx.restore();
  }
  function drawBell(ctx, a, mode) {
    const sk = a.tk;
    polyPath(ctx, sk.outline);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    polyPath(ctx, sk.outline);
    ctx.clip();
    const w = B0.w;
    // the dome lit from above, shaded low; the hollow under it
    glowAt(ctx, a, sk.toW([-0.25 * w, -0.74 * sk.hh]), w * 0.85, C.lt, 0.95);
    glowAt(ctx, a, sk.toW([0, 0.1 * sk.hh]), w * 0.95, C.sh, 0.5);
    ctx.save();
    ctx.translate(...sk.toW([0, -0.05 * sk.hh + sk.drop * 0.5]));
    ctx.rotate(sk.beta);
    ctx.beginPath();
    ctx.ellipse(0, 0, sk.wr * 0.8, Math.max(0.5, 0.16 * sk.hh), 0, 0, TAU);
    ctx.fillStyle = tone(a, C.sh, 0.55);
    ctx.fill();
    ctx.restore();
    // guides: the line where the eyes go, the middle of the face (turned a little to the front)
    const lk = (sk.look ?? 0) * 1.3;
    guide(ctx, a, sk.toW([-0.2 * w + lk, -0.33 * sk.hh]), sk.toW([0.28 * w + lk, -0.46 * sk.hh]), sk.toW([0.78 * w, -0.36 * sk.hh]));
    guide(ctx, a, sk.toW([0.2 * w + lk * 0.6, -0.97 * sk.hh]), sk.toW([0.4 * w + lk, -0.55 * sk.hh]), sk.toW([0.32 * w + lk, -0.14 * sk.hh]), 0.35);
    ctx.restore();
  }
  function spot(sk, what) {
    if (what === 'tips') return sk.tips.reduce((s, p) => plus(s, times(p, 1 / sk.tips.length)), [0, 0]);
    if (what === 'grab') return sk.grabP;
    if (what === 'slap') return sk.slapTip;
    return [sk.B[0], sk.B[1] + 20];
  }
  const still = (wB, hB) => [E(wB / 2, hB - 30, 13, 10, C.base), E(wB / 2, hB - 16, 3, 9, C.sh)];
  return {
    H,
    speed: P.speed,
    cycle: P.cycle,
    fly: true,
    w: 26,
    h: Math.round(H * 1.02),
    boxW: 90,
    boxH: Math.ceil(H * 1.6),
    skeleton,
    spot,
    still,
    seq: [['fineFar', (c, a, md) => drawFine(c, a, md, true), true], ['oralFar', (c, a, md) => drawOral(c, a, md, true)], ['oralNear', (c, a, md) => drawOral(c, a, md, false)], ['fineNear', (c, a, md) => drawFine(c, a, md, false), true], ['fringe', drawFringe], ['bell', drawBell]],
    base(t, m, a, w) {
      const o = zero();
      o.look = glance(t, m.uid ?? 0) * (1 - w);
      o.pitch = 4 * Math.sin(t * 0.5) * (1 - w);
      o.lift = 1.4 * Math.sin(t * 0.37);
      return o;
    },
    poses(o, name, t) {
      if (name === 'rest') Object.assign(o, { flat: 1, pump: -0.2, pitch: 2 * Math.sin(t * 0.4) });
      else if (name === 'curl') Object.assign(o, { curl: 1, pump: 0.65, pitch: 4 });
      else if (name === 'sleep') Object.assign(o, { flat: 1, sleep: 1, pump: -0.15, pitch: 6 + 2 * Math.sin(t * 0.3), look: 0 });
      else if (name === 'dead') Object.assign(o, { flat: 1, sleep: 1, pump: -0.25, pitch: 34, look: 0 });
    },
  };
}

// ---------- The starfish ----------
function starRig(P) {
  const A = P.arm;
  const n = A.n;
  const seg = A.L / n;
  const W = Array.from({ length: n + 1 }, (_, i) => mix(A.w0, A.w1, (i / n) ** 0.9));
  const tipR = A.w1 / 2;
  // (the arms' places round the middle, from the top round to the front, the front "foot", the
  // back "foot", the back)
  const SLOT = [-90, -18, 54, 126, 198].map((d) => d * D2R);
  const FIFTH = TAU / 5;
  const Rtip = A.r0 + A.L + tipR;
  // (rolling: the tips' round, so a cartwheel never slips)
  const Reff = (5 * 2 * Rtip * Math.sin(Math.PI / 5)) / TAU;
  const reach = (P.cycle * P.duty) / 2;
  const H = P.stand + Rtip;
  // A smooth arc of length L from R to T, bowed to one side: where it starts and how far it turns.
  function arcTo(R, T, L, sg) {
    const dx = T[0] - R[0];
    const dy = T[1] - R[1];
    const r = Math.min(0.998, Math.hypot(dx, dy) / L);
    let lo = 1e-4;
    let hi = Math.PI - 1e-4;
    for (let i = 0; i < 22; i++) {
      const mid = (lo + hi) / 2;
      if (Math.sin(mid) / mid > r) lo = mid;
      else hi = mid;
    }
    const x = (lo + hi) / 2;
    return { psi: Math.atan2(dy, dx) - sg * x, bend: sg * 2 * x };
  }
  // An arm's outline, round from the web on one side, out to its round tip and back.
  function armOutline(J) {
    const pts = [];
    const dirAt = (i) => {
      const d = i < J.length - 1 ? less(J[i + 1], J[i]) : less(J[i], J[i - 1]);
      const l = Math.hypot(d[0], d[1]) || 1;
      return [d[0] / l, d[1] / l];
    };
    for (let i = 2; i <= n; i++) {
      const d = dirAt(i);
      pts.push(plus(J[i], times([d[1], -d[0]], W[i] / 2)));
    }
    const d = dirAt(n);
    const h = W[n] / 2;
    pts.push(plus(J[n], plus(times(d, h * 0.72), times([d[1], -d[0]], h * 0.72))));
    pts.push(plus(J[n], times(d, h)));
    pts.push(plus(J[n], plus(times(d, h * 0.72), times([-d[1], d[0]], h * 0.72))));
    for (let i = n; i >= 2; i--) {
      const dd = dirAt(i);
      pts.push(plus(J[i], times([-dd[1], dd[0]], W[i] / 2)));
    }
    return pts;
  }

  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const t = a.t + (m.uid % 7) * 1.1;
    const w = a.walkW ?? 0;
    const u = st.tnU ?? 0;
    const flat = clamp(S.flat, 0, 1);
    const curl = clamp(S.curl, 0, 1);
    const sleep = clamp(S.sleep, 0, 1);
    const raise = clamp(S.raise, 0, 1);
    const splay = clamp(S.splay, 0, 1);
    const crouch = clamp(S.crouch, 0, 1.2);
    // Cartwheeling when it goes fast: its turn from the distance rolled; slowing, it settles back
    // onto the nearest pair of arms.
    const v = st.tnV ?? 0;
    const wheelGoal = a.moving && m.hp > 0 ? clamp((v - P.speed * 1.5) / (P.speed * 0.5), 0, 1) : 0;
    st.sWG = mix(st.sWG ?? 0, wheelGoal, Math.min(1, dt * 5));
    const wheel = st.sWG;
    st.sWh = (st.sWh ?? 0) + ((v * dt) / Reff) * wheel;
    if (wheel < 0.05) st.sWh += (Math.round(st.sWh / FIFTH) * FIFTH - st.sWh) * Math.min(1, dt * 6);
    if (Math.abs(st.sWh) > FIFTH) {
      const nW = Math.trunc(st.sWh / FIFTH);
      st.sWh -= nW * FIFTH;
      st.sWrap = (st.sWrap ?? 0) - nW;
    }
    // (turned back a whole fifth: the same star, each arm now in its neighbour's place; its springs
    // handed over with it)
    if (st.sWrap && st.sArms) {
      const j = st.sWrap;
      const old = st.sArms;
      st.sArms = old.map((_, k) => (old[(((k + j) % 5) + 5) % 5] ?? []).map((q) => ({ x: q.x - j * FIFTH, v: q.v })));
    }
    st.sWrap = 0;
    const free = clamp(Math.max(S.free, wheel), 0, 1);
    const walk = w * (1 - wheel);
    // The tiptoe walk: up a little over each foot as it takes the weight, leaning onto it, the side
    // arms swaying.
    const bob = (0.5 + 0.5 * Math.cos(TAU * 2 * (u - 0.3))) * 1.1 * walk;
    const rockD = Math.sin(TAU * (u - 0.05)) * 3.5 * walk;
    const swing = Math.sin(TAU * (u - 0.3)) * 11 * walk;
    const roll = S.roll * TAU + st.sWh;
    const lean = (S.tilt + rockD) * D2R;
    const standH = mix(P.stand - crouch * 4.2 + raise * 0.8, P.flatStand, Math.max(flat, curl * 0.6));
    const air = clamp(S.hop / 4, 0, 1);
    let O = [S.x, -(standH + bob + S.lift + S.hop)];
    const breath = Math.sin(t * 1.3);
    const look = S.look;
    const lr = st.tnRoll?.v ?? 0;
    const arms = [];
    for (let k = 0; k < 5; k++) {
      const phi = SLOT[k] + roll;
      // its role from where it points now: a share of each of the two nearest places
      const roleW = SLOT.map((s0) => Math.max(0, 1 - Math.abs(wrapPi(phi - s0)) / FIFTH));
      const alpha = phi + lean;
      const R = plus(O, times(unit(alpha), A.r0));
      // [turn at the root, bend along it, tip curl] in degrees, per role, standing
      const idle = 3 * Math.sin(t * 0.9 + k * 1.3) * (1 - walk);
      const tipIdle = 10 * Math.sin(t * 0.6 + k * 2.1) * (1 - walk);
      const prm = [
        [3 + look * 4 + idle - sleep * 22, 4 + breath - sleep * 34, tipIdle * 0.5 - sleep * 40],
        [6 - raise * 40 + swing + idle - splay * 38 + flat * 22 - sleep * 6, 10 - raise * 22 + flat * 14 + sleep * 4, 10 + tipIdle + sleep * 26],
        null,
        null,
        [-6 + raise * 40 + swing + idle + splay * 38 - flat * 22 + sleep * 6, -10 + raise * 22 - flat * 14 - sleep * 4, -10 - tipIdle - sleep * 26],
      ];
      let d0 = 0;
      let bend = 0;
      let tip = 0;
      let legPin = 0;
      for (let r = 0; r < 5; r++) {
        if (roleW[r] <= 0) continue;
        let q = prm[r];
        if (!q) {
          // a "foot": its tip reaching a planted spot on the floor (stepping as it walks; tucked
          // up under it in the air), the arm one smooth arc out to it, bowed outward
          const front = r === 2;
          const sgn = front ? 1 : -1;
          const qq = (((u + (front ? 0 : 0.5)) % 1) + 1) % 1;
          let dx = 0;
          let lift = 0;
          let curlT = 0;
          let down = 1;
          if (qq < P.duty) dx = reach * (1 - 2 * (qq / P.duty));
          else {
            const vv = (qq - P.duty) / (1 - P.duty);
            dx = -reach + 2 * reach * ease(vv);
            lift = P.lift * Math.sin(Math.PI * vv);
            curlT = Math.sin(Math.PI * vv);
            down = 0;
          }
          const fx = (P.foot + flat * 5 + splay * 1.5) * sgn + dx * walk + S.x * 0.3;
          const fy = mix(-tipR - lift * walk, O[1] + standH - 2.5 - tipR, air);
          const ik = arcTo(R, [fx, fy], A.L, sgn);
          q = [wrapPi(ik.psi - alpha) / D2R - splay * 22 * sgn, ik.bend / D2R, curlT * 30 * sgn * walk + sleep * 24 * sgn];
          legPin += roleW[r] * (1 - air) * mix(1, down, walk);
        }
        d0 += q[0] * roleW[r];
        bend += q[1] * roleW[r];
        tip += q[2] * roleW[r];
      }
      // moves on the front arm (slap; with the top arm, grab), then curled up, then loose
      const fW = roleW[1];
      const tW = roleW[0];
      const to = (q, k2) => {
        if (!(k2 > 0)) return;
        d0 = mix(d0, q[0], k2);
        bend = mix(bend, q[1], k2);
        tip = mix(tip, q[2], k2);
      };
      const whip = clamp(S.whip, 0, 1);
      to([mix(-112, 42, whip), mix(-36, 52, whip), mix(-20, 30, whip)], clamp(S.slap, 0, 1) * fW);
      const sq = 1 + 0.18 * clamp(S.squeeze, 0, 1);
      to([62, 96 * sq, 70 * sq], clamp(S.grab, 0, 1) * tW);
      to([-14, -118 * sq, -70 * sq], clamp(S.grab, 0, 1) * fW);
      to([0, 100, 130], curl);
      to([0, clamp(-lr * 22, -28, 28), 0], free);
      const goal = Array.from({ length: n }, (_, i) => {
        const f = (i + 0.5) / n;
        return alpha + (d0 + bend * f + tip * Math.max(0, (f - 0.5) / 0.5) ** 2) * D2R;
      });
      const pinK = legPin * (1 - free) * (1 - curl);
      const mem = ((st.sArms ??= [])[k] ??= []);
      // (its springs turn with the star: a spin is the whole star turning, never the arms dragged)
      const angs = chainOf(mem, goal.map((g) => g - roll), dt, { k: [300, 170], c: [24, 14], gain: 0.03, push: [0, 0], pin: goal.map(() => pinK), max: 1.2 }).map((g) => g + roll);
      arms.push({ J: jointsOf(R, angs, seg), first: angs[0] });
    }
    // Never through the floor; curled up, settled or rolling, down onto it.
    let low = -Infinity;
    for (const { J } of arms) for (let i = 1; i < J.length; i++) low = Math.max(low, J[i][1] + W[i] / 2);
    const settle = Math.max(wheel, curl, flat * 0.6) * (1 - air);
    const dy = low > 0 ? -low : settle > 0 ? -low * settle : 0;
    if (dy) {
      O = plus(O, [0, dy]);
      for (const r of arms) r.J = r.J.map((p) => plus(p, [0, dy]));
    }
    // The one shape: each arm out and back, the soft web between each two.
    const ring = [];
    for (let k = 0; k < 5; k++) {
      const A0 = arms[k];
      const A1 = arms[(k + 1) % 5];
      ring.push(...armOutline(A0.J));
      const gap = Math.max(0.3, wrapPi(A1.first - A0.first) < 0 ? wrapPi(A1.first - A0.first) + TAU : wrapPi(A1.first - A0.first));
      ring.push(plus(O, times(unit(A0.first + gap / 2), P.crotch)));
    }
    const outline = loopCurve(ring, 3);
    return { O, rot: roll + lean, arms, outline, look, front: arms.reduce((b, r) => (r.J[n][0] > b[0] ? r.J[n] : b), [-1e9, 0]), grabP: plus(O, turn([17, -9], lean)) };
  }
  function drawStar(ctx, a, mode) {
    const sk = a.tk;
    polyPath(ctx, sk.outline);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    polyPath(ctx, sk.outline);
    ctx.clip();
    // round and soft: a little shade low on the middle and down each arm's lower edge, light on its
    // top edge and on the middle
    glowAt(ctx, a, plus(sk.O, [0, 7]), 9, C.sh, 0.4);
    for (const { J } of sk.arms) {
      const [pts, ws] = strandPts(J, W, 2);
      ctx.beginPath();
      strandInto(ctx, pts.map(([x, y], i) => [x + ws[i] * 0.1, y + ws[i] * 0.3]), ws.map((q) => q * 0.42));
      ctx.fillStyle = tone(a, C.sh, 0.35);
      ctx.fill();
      ctx.beginPath();
      strandInto(ctx, pts.map(([x, y], i) => [x - ws[i] * 0.08, y - ws[i] * 0.12]), ws.map((q) => q * 0.36));
      ctx.fillStyle = tone(a, C.lt, 0.55);
      ctx.fill();
    }
    glowAt(ctx, a, plus(sk.O, [-1.6, -2.4]), 8, C.lt, 0.85);
    // guides: where the eyes go, and the middle of the face, turned a little to the front
    const inO = (p) => plus(sk.O, turn(p, sk.rot));
    const f = 1.4 + (sk.look ?? 0) * 1.2;
    guide(ctx, a, inO([-4.4 + f, -2.4]), inO([f * 0.9, -3.8]), inO([4.6 + f * 0.8, -2.2]));
    guide(ctx, a, inO([f * 0.7, -8.4]), inO([f * 1.3 + 0.4, -2]), inO([f * 0.8 + 0.3, 5.4]), 0.35);
    ctx.restore();
  }
  function spot(sk, what) {
    if (what === 'slap' || what === 'front') return sk.front;
    if (what === 'grab') return sk.grabP;
    return [sk.O[0], 0];
  }
  const still = (wB, hB) => [E(wB / 2, hB - 15, 7, 7, C.base), E(wB / 2, hB - 27, 3.6, 8, C.base), E(wB / 2 + 9, hB - 18, 8, 3.4, C.base), E(wB / 2 - 9, hB - 18, 8, 3.4, C.base), E(wB / 2 + 7, hB - 6, 3.6, 7, C.base), E(wB / 2 - 7, hB - 6, 3.6, 7, C.base)];
  return {
    H,
    speed: P.speed,
    cycle: P.cycle,
    w: 34,
    h: Math.round(H * 1.06),
    boxW: 100,
    boxH: Math.ceil(H * 1.6),
    skeleton,
    spot,
    still,
    seq: [['star', drawStar]],
    base(t, m, a, w) {
      const o = zero();
      const breath = Math.sin(t * 1.3);
      const s = hold(t % 14, 9, 9.8, 11, 12) * (a.calm ?? 0);
      o.tilt = breath * 1.1 * (1 - w) + 2 * w;
      o.crouch = (0.06 + 0.06 * breath) * (1 - w);
      o.look = glance(t, m.uid ?? 0) * (1 - w);
      o.raise = s * 0.8 * (1 - w);
      o.lift = s * 1.4 * (1 - w);
      return o;
    },
    poses(o, name, t) {
      const breath = Math.sin(t * 0.9);
      if (name === 'rest') Object.assign(o, { flat: 1, tilt: breath * 1.2, crouch: 0 });
      else if (name === 'curl') Object.assign(o, { curl: 1, tilt: 0, crouch: 0 });
      else if (name === 'sleep') Object.assign(o, { flat: 1, sleep: 1, tilt: 4 + breath * 1.5, crouch: 0, look: 0 });
      else if (name === 'dead') Object.assign(o, { flat: 1, sleep: 1, tilt: 3, crouch: 0, look: 0 });
    },
  };
}

// ---------- Effects: hit sparkles, dust, an ink puff, sparks, bubbles, speed lines, spin trails ----------
const twinkle = (ctx, x, y, r, an, fill) => {
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
const puff = (ctx, x, y, r, al, fill = '#f3eefa', line = '#d6cbe6') => {
  ctx.globalAlpha = al;
  ctx.fillStyle = fill;
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(0.4, r * 0.12);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.stroke();
};
function drawFx(ctx, K, a) {
  const sk = a.tk;
  const mv = a.tnMove?.mv;
  const t = a.tnMove?.t ?? 0;
  if (!mv || !sk) return;
  const H = K.H;
  ctx.save();
  for (const s0 of mv.spark ?? []) {
    const sp = after([s0], t, 0.22);
    if (sp < 0) continue;
    const [sx, sy] = K.spot(sk, mv.sparkAt);
    const e = easeOut(sp);
    ctx.globalAlpha = 1 - sp;
    twinkle(ctx, sx, sy, H * 0.11 * (0.5 + 0.7 * e), sp * 0.8, '#ffffff');
    twinkle(ctx, sx, sy, H * 0.055 * (0.5 + 0.7 * e), sp * 0.8 + 0.4, '#fff2a8');
    for (let i = 0; i < 4; i++) {
      const q = (i * TAU) / 4 + 0.6;
      twinkle(ctx, sx + Math.cos(q) * H * 0.15 * e, sy + Math.sin(q) * H * 0.15 * e, H * 0.028, q, i % 2 ? '#ffc8de' : '#fff6c8');
    }
  }
  for (const [d0, where] of mv.dust ?? []) {
    const dp = after([d0], t, 0.4);
    if (dp < 0) continue;
    const [gx] = K.spot(sk, where);
    const e = 1 - (1 - dp) ** 2;
    for (let i = 0; i < 4; i++) {
      const dir = i < 2 ? -1 : 1;
      puff(ctx, gx + dir * (2 + (i % 2) * 3) * (0.4 + e), -(1 + (i % 2)) - e * 2.4, (1.4 + (i % 2) * 0.6) * (0.6 + 0.6 * e), (1 - dp) * 0.85);
    }
  }
  // the ink: a soft cloud of round puffs from under the mantle, billowing forward and fading
  for (const i0 of mv.ink ?? []) {
    const ip = after([i0], t, 0.9);
    if (ip < 0) continue;
    const [sx, sy] = K.spot(sk, 'mouth');
    for (let i = 0; i < 6; i++) {
      const k = clamp(ip * 1.25 - i * 0.05, 0, 1);
      if (k <= 0) continue;
      const e = easeOut(k);
      const ang = (i - 2.5) * 0.28;
      puff(ctx, sx + (3 + 15 * e * (1 + (i % 3) * 0.15)) * Math.cos(ang), sy + (2 + 10 * e) * Math.sin(ang) - e * 1.5, 1.4 + 3.2 * e, (1 - k) * 0.8, '#b3a8cb', '#9d91b8');
    }
  }
  // sparks: little soft zigzags flickering off the tentacle tips
  if (mv.zap && t >= mv.zap[0] && t <= mv.zap[1]) {
    const k = (t - mv.zap[0]) / (mv.zap[1] - mv.zap[0]);
    const step = Math.floor(t * 24);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [j, [tx, ty]] of (sk.tips ?? []).entries()) {
      for (const [col, lw] of [['#fff3a0', 1.1], ['#ffffff', 0.45]]) {
        ctx.globalAlpha = (1 - k) * 0.95;
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        let x = tx;
        let y = ty;
        ctx.moveTo(x, y);
        for (let s = 0; s < 3; s++) {
          x += 1.6 + rand(step + s, j) * 1.4;
          y += (rand(step + s, j + 9) - 0.5) * 3;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }
  // bubbles trailing a jet
  if (mv.bubbles && t >= mv.bubbles[0] && t <= mv.bubbles[1] + 0.4) {
    for (let i = 0; i < 5; i++) {
      const b0 = mv.bubbles[0] + i * 0.06;
      const bp = after([b0], t, 0.55);
      if (bp < 0) continue;
      const base = K.spot(sk, 'feet');
      ctx.globalAlpha = (1 - bp) * 0.85;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(base[0] - 6 - i * 2.5 - bp * 8, -8 - (i % 3) * 3 - bp * 6, 0.9 + (i % 2) * 0.6, 0, TAU);
      ctx.stroke();
    }
  }
  if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
    const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
    ctx.globalAlpha = 0.7 * (1 - k);
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.9;
    const c = K.spot(sk, 'feet');
    for (let i = 0; i < 3; i++) {
      const y = -10 - i * 5;
      ctx.beginPath();
      ctx.moveTo(c[0] - 14 - 6 * k, y);
      ctx.lineTo(c[0] - 24 - 10 * k, y);
      ctx.stroke();
    }
  }
  // spin trails: soft arcs round the star, following its turn
  if (mv.trail && t >= mv.trail[0] && t <= mv.trail[1] && sk.O) {
    const k = (t - mv.trail[0]) / (mv.trail[1] - mv.trail[0]);
    ctx.globalAlpha = 0.6 * Math.sin(Math.PI * k);
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 3; i++) {
      const a0 = sk.rot + i * (TAU / 3);
      ctx.beginPath();
      ctx.arc(sk.O[0], sk.O[1], H * 0.62, a0 - 0.9, a0);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------- One rig for a preset ----------
const BUILD = { octopus: octopusRig, jellyfish: jellyRig, starfish: starRig };
function tentacleRig(kind) {
  const P = TENTACLE_PRESETS[kind];
  const K = BUILD[kind](P);
  const table = TENTACLE_MOVES[kind];
  const pleased = PLEASED[kind];
  function moveNow(m, a, st) {
    if (m.act && table[m.act.name]) {
      const mv = table[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + moveLen(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.tnAtk) {
        const pool = m.def.moves ?? P.moves;
        st.tnN = (st.tnN ?? m.uid ?? 0) + 1;
        st.tnPick = m.move ?? pool[st.tnN % pool.length];
      }
      st.tnAtk = true;
      const mv = table[st.tnPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.tnAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < moveLen(table.hurt)) return [table.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < moveLen(table[pleased])) return [table[pleased], gl, 1];
    return [null, 0, 0];
  }
  const parts = [];
  for (const mode of ['line', 'fill']) {
    for (const [name, fn, fillOnly] of K.seq) {
      if (fillOnly && mode === 'line') continue;
      parts.push({ name: `${name}~${mode}`, parent: null, at: () => [0, 0], pivot: [0, 0], s: BLANK, paint: (ctx, a) => fn(ctx, a, mode) });
    }
  }
  const soft = ['look', 'tilt'];
  const rig = makeRig({
    w: K.boxW,
    h: K.boxH,
    soft: true,
    stride: K.cycle,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, c === 'look' ? [60, 14] : c === 'roll' ? [260, 30] : c === 'pump' ? [220, 22] : c === 'tilt' ? [150, 17] : [170, 21]])),
    walkStiff: { pitch: [300, 32], tilt: [200, 24] },
    fast: CH.filter((c) => !soft.includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.tnActive),
    kick: { pitch: -40, tilt: -60 },
    turnKick: { tilt: 18 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.1;
      // How far it has gone: the crawl's (or the pulse's, or the cartwheel's) phase comes from this.
      const dt = Math.max(1e-3, a.dt ?? 0);
      const odo = m.odo ?? 0;
      const raw = Math.min(400, Math.abs(odo - (st.tnOdo ?? odo)) / dt);
      st.tnOdo = odo;
      st.tnV = mix(st.tnV ?? 0, raw, Math.min(1, dt * 5));
      st.tnU = ((st.tnU ?? 0) + (st.tnV / K.cycle) * (a.dt ?? 0)) % 1;
      // (a floater is always "moving" to the game: how much it is swimming comes from its speed)
      st.tnGo = mix(st.tnGo ?? 0, clamp(st.tnV / (K.speed * 0.5), 0, 1), Math.min(1, dt * 4));
      const w = K.fly ? st.tnGo : (a.walkW ?? 0);
      const base = K.base(t, m, a, w);
      const [mv, mt, anticW] = moveNow(m, a, st);
      base.x /= K.H;
      base.hop /= K.H;
      const out = mv ? posed(mv, mt, anticW, base) : { ...base };
      const napping = m.habit?.kind === 'nap' && a.now < (m.habit.until ?? 0);
      if (m.pose && !mv) K.poses(out, m.pose === 'sleep' ? 'sleep' : m.pose, t);
      if (napping && !mv && m.hp > 0) K.poses(out, 'sleep', t);
      const mood = m.cine?.mood;
      if (mood === 'happy' && m.hp > 0 && !mv) Object.assign(out, { raise: Math.max(out.raise, 0.5), lift: out.lift + 1 + Math.sin(t * 5) * 0.8 });
      else if (mood === 'sad' && m.hp > 0 && !mv) Object.assign(out, { flat: Math.max(out.flat, 0.35), pitch: out.pitch + 8, look: 0 });
      if (m.hp <= 0) K.poses(out, 'dead', t);
      st.tnActive = Boolean(mv);
      // (a whole turn of the starfish is the same star: between moves its turn is taken back to
      // the nearest fifth, which changes nothing on screen)
      if (!mv && st.roll && Math.abs(st.roll.x) > 0.1) {
        const nW = Math.round(st.roll.x / 0.2);
        st.roll.x -= nW * 0.2;
        st.sWrap = (st.sWrap ?? 0) - nW;
      }
      st.tnRoll = st.roll;
      a.tnMove = mv ? { mv, t: mt } : null;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = out.x * K.H;
      res.hop = out.hop * K.H;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.mo.rig ??= {};
      a.tk = K.skeleton(S, a, m);
    },
    parts,
    fx: (ctx, m, a) => drawFx(ctx, K, a),
  });
  // (a still for the Monster Book: the body plain)
  const still = () => ({ w: K.boxW, h: K.boxH, res: 3, shapes: K.still(K.boxW, K.boxH) });
  return { rig, still, K };
}

export const TENTACLE_ARTS = {};
export const TENTACLE_DEFS = {};
for (const kind of TENTACLE_KINDS) {
  const { rig, still, K } = tentacleRig(kind);
  TENTACLE_ARTS[`blank_${kind}`] = { pad: 10, walk: 8, idle: 8, attack: 5, stride: K.cycle, atkMs: [110, 180, 340, 240], draw: still, rig };
  TENTACLE_DEFS[kind] = { id: `blank_${kind}`, name: `Blank ${kind}`, art: `blank_${kind}`, w: K.w, h: K.h, speed: K.speed, hp: 100, fight: { windup: 0.5 }, bodyH: K.H, beast: true, moves: TENTACLE_PRESETS[kind].moves, ...(K.fly ? { fly: true } : {}) };
}
