// The Dumbo Lamplighter's body (2026-11-26): a copy of the tentacle base (render/mobs/blanktentacle.js),
// its octopus only, kept here so the base itself stays clean (the player: "never edit the bases just
// copy the base and edit that"). What this copy changes, to make a dumbo octopus of it:
//   - it hovers instead of creeping: the crown floats `P.hover` px over the floor on two fins that
//     flap (a quick down-stroke that lifts it, a slower up-stroke as it sinks back), their phase from
//     the distance travelled when it moves and a slow beat of its own at rest; the arms hang under it
//     on their springs, trailing as it swims, a ripple running down them with each flap;
//   - the two fins (`P.fins`, "ears"), rooted inside the mantle's upper sides, behind it, each on a
//     sprung root with a lagging tip, so a flap curls through them;
//   - a web (`P.webs`) between neighbouring arms down to `P.webF` of their length, its hem curving up
//     between them, so arms and web read as a skirt of round scallops;
//   - no breathing by squeezing the mantle (the player's rule: no squash or stretch, ever): the mantle
//     keeps its shape; it breathes by bobbing and leaning;
//   - arms flagged `front` are drawn over the body, arms flagged `free` stay out of the web, and an arm
//     flagged `held` (holding something) takes only the dress's shapes (look.goals), none of the base's.
// And a dress, `look`, for a monster on it (dressedOcto(look)):
//   look.P      its own shape over the preset (hover, mantle, waist, arm, arms, webs, fins, flap ...)
//   look.C      its own colours over the base's (lt, base, sh, deep); look.CA the arms' and web's,
//               look.CF the fins', each over look.C
//   look.ink    its own soft outline (never near-black)
//   look.paint  (ctx, a, sk, K) its own markings on the mantle, clipped to it
//   look.face   (ctx, a, sk, K) its own face (the base's guide line is gone); K.mantleFrame puts the
//               canvas in the mantle's own frame (0 at its base, x forward, y down)
//   look.over / look.under  { part: (ctx, a, mode, K) } over / under a part, in both passes (mode
//               'line': its outline, 'fill': itself); parts armsFar, armsNear, fins, body, armFront
//   look.moves  its own moves over the base's; look.pick (m, a, st) which one an attack plays;
//               look.pleased the move a gloat plays
//   look.pose   (m, a, out, K, mv, mt) its own act on the channels (d1..d9 are the dress's own)
//   look.goals  (j, n, S, { hang, prof, t, body, a, R, seg }) its own shapes for arm j:
//               [[angles (one a segment, in the rig's frame), weight], ...], blended with the base's
//   look.pin    (j, n, a) per segment, how much arm j is held to its shape each 240th of a second
//   look.spot   (sk, what) its own place for an effect (else the base's)
//   look.moveStiff  how much stiffer the arms' springs are while a move plays (the base: 2.4)
//   look.fx     (ctx, m, a, K) live extras over everything
// The base's own notes follow (its creeping walk is replaced by the hover above).
//
// (base) The tentacle base (2026-11-25, the player: "more bases ... sea critters"): soft sea critters made
// (base) for themselves from the start, nothing carried over from any other base; only the engine is
// (base) shared (rig.js's springs and the live two-pass drawing). Drawn live: one smooth shape over its
// (base) bones, outlined only on its outer edge (every part's outline first, then every part's fill over
// (base) it, so a line only survives where nothing covers it), in a soft ink, never near-black.
// (base) The arms: a chain of segments each, every segment's angle on its own damped spring that follows
// (base) the segment before it (so a turn at the root runs down the arm as a wave and the tip trails,
// (base) overshoots and settles), pushed by the body's own speeding up and slowing down; the width
// (base) tapers to a round tip, the length never changes (volume kept).
// (base) Moves: slap (an arm cocked high, whipped down), ink (a soft puff of ink); jump, dash (a jet),
// (base) dodge, hurt, knockdown, and a pleased act (stretch). Poses (m.pose): rest (settled), curl, sleep;
// (base) a nap habit sleeps too. m.def.moves picks the attack pool (cycled), m.act = { name, at } plays
// (base) any move by name.

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { E } from '../mobs/kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C0 = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6' };
// (the outline: a soft deeper lilac, never near-black)
const INK = '#7f6982';
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
// and slowing down pushes each one. `pin` holds segments to their goal.
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
      // (the swing limit: a soft stop, a stiff damped spring past it, so a segment never halts in one
      // frame; a hard stop only well beyond it)
      const dev = sp.x - tgt;
      const over = Math.abs(dev) - mx;
      if (over > 0) {
        sp.v -= Math.sign(dev) * (over * 2600 + Math.max(0, sp.v * Math.sign(dev)) * 40) * h;
        if (over > 0.7) {
          sp.x = tgt + Math.sign(dev) * (mx + 0.7);
          sp.v *= 0.5;
        }
      }
    }
  }
  return mem.map((s) => s.x);
}
// Nothing goes through the floor: an arm reaching it is bent along it from there on (each segment
// keeps its length: the joints below the floor are laid along it, never squashed up).
const onFloor = (J, W, floor = 0) => {
  // (laid along it the way the arm as a whole reaches, so a nearly upright segment never flips sides)
  const way = J[J.length - 1][0] >= J[0][0] ? 1 : -1;
  for (let i = 1; i < J.length; i++) {
    const lim = floor - W[i] / 2;
    if (J[i][1] <= lim) continue;
    const p = J[i - 1];
    const seg = Math.hypot(J[i][0] - p[0], J[i][1] - p[1]);
    const dy = Math.max(-seg, Math.min(seg, lim - p[1]));
    const dx = Math.sqrt(Math.max(0, seg * seg - dy * dy)) * way;
    J[i] = [p[0] + dx, p[1] + dy];
  }
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
  if (al <= 0.005 || !(r > 0)) return;
  const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
  gr.addColorStop(0, tone(a, hex, al));
  gr.addColorStop(1, tone(a, hex, 0));
  ctx.fillStyle = gr;
  ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
};
const edge = (ctx, ink = INK) => {
  ctx.strokeStyle = ink;
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
function strandPts(J, W, per = 3) {
  const pts = lineCurve(J, per);
  const ws = pts.map((_, i) => {
    const f = i / per;
    const j = Math.min(W.length - 2, Math.floor(f));
    return mix(W[j], W[j + 1], f - j);
  });
  return [pts, ws];
}
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
// An arm: outlined, then filled, with a soft shade along its side away from the light.
function drawStrand(ctx, a, mode, pts, ws, look) {
  ctx.beginPath();
  strandInto(ctx, pts, ws);
  if (mode === 'line') return edge(ctx, look.ink);
  ctx.fillStyle = tone(a, look.fill);
  ctx.fill();
  if (!look.shade) return;
  ctx.save();
  ctx.beginPath();
  strandInto(ctx, pts, ws);
  ctx.clip();
  // (each point's side away from the light, up and to the left; eased across, never flipped)
  const away = pts.map((p, i) => {
    const q0 = pts[Math.max(0, i - 1)];
    const q1 = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1;
    const nx = -(q1[1] - q0[1]) / l;
    const ny = (q1[0] - q0[0]) / l;
    const k = clamp((nx * 0.45 + ny * 0.9) / 0.35, -1, 1);
    return [nx * k, ny * k];
  });
  // (the shade eased in from the root, so where it grows out of the body there's no band)
  ctx.beginPath();
  strandInto(ctx, pts.map(([x, y], i) => [x + away[i][0] * ws[i] * 0.36, y + away[i][1] * ws[i] * 0.36]), ws.map((v, i) => v * 0.5 * ease(i / (pts.length * 0.3))));
  ctx.fillStyle = tone(a, look.shade, look.shadeA ?? 0.6);
  ctx.fill();
  ctx.restore();
}
const BLANK = () => sprite('rig|dumboblank', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));
// A wandering glance: held, then turning to the next, every few seconds.
const glance = (t, seed) => {
  const blk = Math.floor(t / 5);
  const k = ease(((t / 5) % 1) / 0.18);
  return mix(rand(blk - 1, seed), rand(blk, seed), k) * 2 - 1;
};

// ---------- The critter ----------
// (units: game px at scale 1, x forward, y down, 0 on the floor)
const OCTOPUS = {
  name: 'Octopus',
  speed: 16,
  // the crown's height over the floor, hovering and settled
  hover: 12,
  flatHover: 4.6,
  // the mantle: hinged at its base (from the crown), its radii, leaning back
  mantle: { at: [-0.4, 1.4], rx: 10.5, ry: 10, tilt: -4 },
  // under the mantle, round the crown (back to front)
  waist: [[-8.6, 0.9], [-5.6, 3.0], [-1.8, 3.6], [1.8, 3.6], [5.4, 3.0], [8.4, 1.1]],
  // each arm: length, segments, widths (root, tip)
  arm: { L: 11, n: 7, w0: 4.4, w1: 2.2 },
  // [root from the crown, its way down (deg, + toward the back), far?, length share, front (drawn over
  // the body)?, free (out of the web)?, stiffness]
  arms: [
    { at: [-5.6, 2.2], dir: 24, far: true },
    { at: [-1.2, 3.0], dir: 6, far: true },
    { at: [3.4, 2.6], dir: -14, far: true },
    { at: [-6.6, 1.8], dir: 30, far: false },
    { at: [-2.0, 3.2], dir: 10, far: false },
    { at: [2.6, 3.2], dir: -10, far: false },
    { at: [5.6, 2.4], dir: -26, far: false, free: true, slap: true },
  ],
  // the web: pairs of arms joined, how far down their length, how deep the hem curves up between
  webs: [[0, 1], [1, 2], [3, 4], [4, 5]],
  webF: 0.62,
  notch: 0.42,
  // the fins: their roots on the mantle (shares of rx and ry from its base, back then front), length,
  // half width, rest (deg above level) and flap (deg either way)
  fins: { at: [[-0.62, -1.62], [0.55, -1.66]], L: 10, W: 3.4, rest: 26, amp: 32 },
  // the flap: beats a second hovering, px swum a beat, how far each beat lifts it
  flapHz: 0.75,
  cycle: 24,
  bob: 1.5,
  moves: ['slap', 'ink'],
};

// ---------- The moves (keys: [seconds, pose, ease into it]; x, hop in body heights, angles in degrees) ----------
// Channels: pitch (+ leans forward), tilt (the mantle's own lean), crouch (lower), raise (up, arms
// out), stream (arms trailing in a bundle), splay (arms flung out), slap + whip (an arm cocked at whip
// 0, struck through at 1), flat (settled on the floor), curl, sleep, fin (the fins raised, radians),
// sweep (the fins swung forward, radians), beat (extra flaps a second), still (the fins held still).
const OCT_MOVES = {
  slap: {
    anticT: 0.24,
    keys: [
      [0, { slap: 1, whip: 0, pitch: -9, tilt: -8, x: -0.03, fin: 0.3 }],
      [0.07, { slap: 1, whip: 1, pitch: 13, tilt: 7, x: 0.07 }, 'out'],
      [0.17, { slap: 1, whip: 1, pitch: 9, tilt: 3, x: 0.06 }],
      [0.44, { slap: 0, whip: 1, pitch: 2, x: 0.03 }, 'io'],
      [0.66, {}],
    ],
    spark: [0.08],
    sparkAt: 'slap',
  },
  ink: {
    anticT: 0.3,
    keys: [
      [0, { tilt: -9, pitch: -5, splay: 0.15, lift: 0.8, fin: 0.4 }],
      [0.06, { tilt: 7, pitch: 6, x: -0.06, splay: 0.3, fin: -0.3 }, 'out'],
      [0.3, { tilt: 2, x: -0.07, splay: 0.1 }],
      [0.62, {}],
    ],
    ink: [0.05],
  },
  jump: {
    anticT: 0.18,
    keys: [
      [0, { crouch: 1, fin: 0.5 }],
      [0.14, { hop: 0.5, crouch: 0, stream: 1, fin: -0.6, beat: 3 }, 'out'],
      [0.34, { hop: 0.58, stream: 0.15, splay: 0.6, fin: 0.3, beat: 3 }, 'out'],
      [0.6, { hop: 0.04, splay: 0.2 }, 'io'],
      [0.92, {}],
    ],
  },
  dash: {
    anticT: 0.12,
    keys: [
      [0, { crouch: 0.45, tilt: -6, fin: 0.5 }],
      [0.06, { x: 0.25, hop: 0.06, pitch: 40, stream: 1, fin: -0.5 }, 'out'],
      [0.3, { x: 0.32, hop: 0.05, pitch: 36, stream: 1 }],
      [0.5, { x: 0.33, pitch: 8, stream: 0.2 }, 'in'],
      [0.82, {}],
    ],
    bubbles: [0.04, 0.42],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.5 }],
      [0.12, { x: -0.25, hop: 0.2, pitch: -18, stream: 0.6, fin: 0.6 }, 'out'],
      [0.32, { x: -0.28, crouch: 0.3, pitch: -4 }, 'in'],
      [0.64, {}],
    ],
  },
  hurt: {
    anticT: 0,
    keys: [[0, {}], [0.05, { x: -0.05, pitch: -14, tilt: -12, splay: 0.5, crouch: 0.3, fin: -0.5 }, 'out'], [0.22, { x: -0.05, pitch: -9, tilt: -8, splay: 0.3, crouch: 0.25, fin: -0.3 }], [0.58, {}]],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.1, { x: -0.06, hop: 0.12, pitch: -24, splay: 0.7 }, 'out'],
      [0.38, { x: -0.1, flat: 1, tilt: -30, pitch: -6, splay: 0.15, still: 1 }, 'in'],
      [1.05, { x: -0.1, flat: 1, tilt: -30, pitch: -6, still: 1 }],
      [1.34, { x: -0.05, crouch: 0.5 }],
      [1.62, {}],
    ],
  },
  // Pleased: up, the arms spread, the fins high; then settling.
  stretch: {
    anticT: 0.2,
    keys: [
      [0, { crouch: 0.3 }],
      [0.35, { raise: 1, splay: 0.35, lift: 2.4, fin: 0.5 }, 'io'],
      [0.85, { raise: 1, splay: 0.35, lift: 2.4, fin: 0.5 }],
      [1.22, {}, 'io'],
    ],
  },
};

const CH = ['x', 'hop', 'lift', 'pitch', 'tilt', 'look', 'pump', 'crouch', 'raise', 'stream', 'flat', 'curl', 'sleep', 'splay', 'slap', 'whip', 'fin', 'sweep', 'beat', 'still', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9'];
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

// ---------- The hovering octopus ----------
function octoRig(P, look = {}) {
  const DRESS = look;
  const C = { ...C0, ...(look.C ?? {}) };
  const CA = { ...C, ...(look.CA ?? {}) };
  const CF = { ...C, ...(look.CF ?? {}) };
  const INKD = look.ink ?? INK;
  const NEAR = { fill: CA.base, shade: CA.sh, shadeA: 0.45, ink: INKD };
  const FAR = { fill: CA.sh, shade: CA.deep, shadeA: 0.4, ink: INKD };
  const A = P.arm;
  const n = A.n;
  const seg = A.L / n;
  const W = Array.from({ length: n + 1 }, (_, i) => mix(A.w0, A.w1, (i / n) ** 0.85));
  const M = P.mantle;
  const H = P.hover - M.at[1] + M.ry * 2;
  const prof = (nn, a0, bend, tip) => Array.from({ length: nn }, (_, i) => {
    const f = i / (nn - 1);
    return a0 + bend * f + tip * f * f * f;
  });
  // One beat of the fins: the quick down-stroke (up to down), then the slower up-stroke; the lift it
  // gives (up through the down-stroke, drifting back down as they rise again).
  const flapAt = (ph) => {
    const p = ((ph % 1) + 1) % 1;
    return p < 0.4 ? mix(1, -1, ease(p / 0.4)) : mix(-1, 1, ease((p - 0.4) / 0.6));
  };
  const riseAt = (ph) => (ph < 0.06 ? 0 : ph < 0.46 ? easeOut((ph - 0.06) / 0.4) : 1 - ease((ph - 0.46) / 0.54));
  const FA = P.fins;

  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const t = a.t + (m.uid % 7) * 1.1;
    const alive = m.hp > 0 ? 1 : 0;
    const flat = clamp(S.flat, 0, 1);
    const curl = clamp(S.curl, 0, 1);
    const sleep = clamp(S.sleep, 0, 1);
    const crouch = clamp(S.crouch, 0, 1.2);
    const raise = clamp(S.raise, 0, 1);
    const go = st.tnGo ?? 0;
    // The flap: a slow beat of its own hovering, quicker the farther it swims (from the distance).
    const still = clamp(S.still, 0, 1);
    const rate = alive * (P.flapHz * (1 - 0.65 * Math.max(sleep, flat)) + ((st.tnV ?? 0) / P.cycle) * go + Math.max(0, S.beat)) * (1 - 0.8 * still);
    st.fp = ((st.fp ?? ((m.uid ?? 0) * 0.37) % 1) + rate * dt) % 1;
    const ph = st.fp;
    st.tnBusy = mix(st.tnBusy ?? 0, st.tnActive ? 1 : 0, Math.min(1, dt * 6));
    const amp = (1 - still) * (1 - 0.7 * Math.max(flat, sleep)) * alive;
    const rise = riseAt(ph);
    const bob = (rise - 0.45) * 2 * P.bob * amp * (1 - 0.5 * st.tnBusy) * (1 + 0.3 * go);
    const hoverH = mix(P.hover - crouch * 3 + raise * 1.5, P.flatHover, Math.max(flat, curl * 0.6));
    const body = (S.pitch + go * 8) * D2R;
    const K = [S.x, -(hoverH + S.lift + S.hop + bob)];
    const at = (p) => plus(K, turn(p, body));
    const mo = motionAt(st, 'tnK', K, m, a);
    // The mantle on its own soft hinge: it trails as the body speeds up and slows, and settles.
    const ms = (st.tnMantle ??= { x: 0, v: 0 });
    if (dt > 0) {
      ms.v += (-ms.x * 150 - ms.v * 14 - mo.ax * 0.0012 + mo.ay * 0.0004) * dt;
      ms.x = clamp(ms.x + ms.v * dt, -0.3, 0.3);
    }
    const mAng = body + (M.tilt + S.tilt + S.look * 2.5 - sleep * 8) * D2R + ms.x;
    const Mb = at(M.at);
    const rx = M.rx;
    const ry = M.ry;
    const inM = (p) => plus(Mb, turn(p, mAng));
    // (round, a little fuller low where it meets the arms; it never squeezes)
    const mantle = [44, 16, -12, -40, -65, -90, -115, -140, -168, -196, -224].map((d) => {
      const sn = Math.sin(d * D2R);
      return inM([rx * Math.cos(d * D2R) * (1 + 0.06 * sn), -ry + ry * sn]);
    });
    const outline = loopCurve([...mantle, ...P.waist.map(at)], 4);
    // The fins: each root on its own spring (overshooting a little at each turn of the beat), each
    // tip lagging its root, so a flap curls through it.
    const fins = (st.tnFins ??= [{ x: null, v: 0, b: 0, bv: 0 }, { x: null, v: 0, b: 0, bv: 0 }]);
    const finOut = [];
    for (let i = 0; i < 2; i++) {
      const el = (FA.rest + FA.amp * amp * flapAt(ph + i * 0.035) * (1 - 0.4 * sleep)) * D2R + S.fin - sleep * 0.75 - flat * 0.2;
      const goal = (i ? Math.atan2(-Math.sin(el), Math.cos(el)) : Math.atan2(-Math.sin(el), -Math.cos(el))) + S.sweep;
      const f = fins[i];
      if (f.x === null || !(dt > 0) || !Number.isFinite(f.x)) {
        f.x = goal;
        f.b = goal;
        f.v = 0;
        f.bv = 0;
      } else {
        const g = f.x + wrapPi(goal - f.x);
        const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
        const h = dt / steps;
        for (let s = 0; s < steps; s++) {
          f.v += ((g - f.x) * 620 - f.v * 34 + mo.ay * 0.02 * Math.cos(f.x)) * h;
          f.x += f.v * h;
          const gb = f.b + wrapPi(f.x - f.b);
          f.bv += ((gb - f.b) * 210 - f.bv * 16) * h;
          f.b += f.bv * h;
        }
      }
      const bend = clamp(wrapPi(f.b - f.x), -0.7, 0.7);
      const root = [FA.at[i][0] * rx, FA.at[i][1] * ry];
      // its middle line in the mantle's frame, turning through the bend toward the tip
      const N = 6;
      const mid = [root];
      const sg = FA.L / N;
      for (let k = 1; k <= N; k++) {
        const u = k / N;
        mid.push(plus(mid[k - 1], times(unit(f.x + bend * u ** 1.4), sg)));
      }
      // (a round paddle: narrow at its root, widest past the middle, its end a round lobe)
      const HW = FA.hw ?? [0.46, 0.72, 0.9, 1, 1, 0.92, 0.72];
      const L = [];
      const R = [];
      for (let k = 0; k <= N; k++) {
        const an = f.x + bend * (k / N) ** 1.4;
        const nrm = [-Math.sin(an), Math.cos(an)];
        const hw = FA.W * HW[k];
        L.push(plus(mid[k], times(nrm, hw)));
        R.push(plus(mid[k], times(nrm, -hw)));
      }
      const tipAn = f.x + bend;
      const re = FA.W * HW[N];
      const cap = [-1.0, -0.5, 0, 0.5, 1.0].map((q) => plus(mid[N], times(unit(tipAn + q * 1.25), re * (1 - 0.06 * Math.abs(q)))));
      const loopPts = [...L.slice(0, N + 1), ...cap.reverse(), ...R.slice(0, N + 1).reverse()];
      finOut.push({ back: i === 0, ang: f.x, bend, root: inM(root), mid: mid.map(inM), shape: loopCurve(loopPts, 3).map(inM) });
    }
    // The arms: hanging under it, trailing as it swims, a ripple down them at each beat.
    const trail = clamp(mo.vx * 0.012, -0.8, 0.8);
    const rising = clamp(-mo.vy * 0.02, -1, 1);
    const fan = 1 + 0.25 * rise * amp - 0.25 * Math.max(0, rising);
    const hang = Math.PI / 2;
    const stream = clamp(S.stream, 0, 1);
    const splay = clamp(S.splay, 0, 1);
    const slap = clamp(S.slap, 0, 1);
    const whip = clamp(S.whip, 0, 1);
    const arms = [];
    for (const [k, ad] of P.arms.entries()) {
      const R = at(ad.at);
      const fl = ad.len ?? 1;
      const sgK = seg * fl;
      const spread = ad.dir * D2R;
      const sgn = spread >= 0 ? 1 : -1;
      const a0 = hang + 0.5 * body + spread * fan;
      const hangL = Array.from({ length: n }, (_, i) => {
        const f = i / (n - 1);
        return mix(a0, hang + trail + spread * 0.55, ease(f) * 0.85) + 0.32 * sgn * f * f * f + (0.17 * amp * Math.sin(TAU * ph - i * 0.8 + k * 0.4) + 0.06 * Math.sin(t * 0.8 + k * 1.9 - i * 0.4) * (1 - sleep * 0.5)) * f;
      });
      const streamL = prof(n, hang + body + spread * 0.25, 0, 0).map((v, i) => v + 0.1 * Math.sin(t * 8 - i) * (i / n));
      const splayL = prof(n, hang + spread * 3 + sgn * 0.35, sgn * 0.5, sgn * 0.3);
      const curlL = prof(n, hang + spread * 2, sgn * 2.2, sgn * 2.4);
      // (settled on the floor: each arm laid out along it, out front or behind, its tip curled up)
      const flatL = prof(n, hang + sgn * 0.95 + spread * 0.5, sgn * 0.35, sgn * 0.55);
      const extra = [];
      if (slap > 0 && ad.slap) extra.push([blendShapes([[prof(n, -1.2 + body, -1.4, -0.6), 1 - whip], [prof(n, 0.1 + body, 1.1, 0.4), whip]]), slap]);
      for (const g of DRESS.goals?.(k, n, S, { hang, prof, t, body, a, R, seg: sgK, sk: st.tnLast }) ?? []) if (g[1] > 0) extra.push(g);
      // (an arm `held` (holding something) takes only the dress's shapes, never the base's)
      const hk = ad.held ? 0 : 1;
      const others = (stream + splay * (1 - stream * 0.5) + curl + flat) * hk + extra.reduce((s, e) => s + e[1], 0);
      const norm = others > 1 ? 1 / others : 1;
      const goal = blendShapes([[hangL, Math.max(0, 1 - others)], [streamL, stream * norm * hk], [splayL, splay * norm * (1 - stream * 0.5) * hk], [curlL, curl * norm * hk], [flatL, flat * norm * hk], ...extra.map(([L, ww]) => [L, ww * norm])]);
      const mem = ((st.tnArms ??= [])[k] ??= []);
      const q = (st.tnActive ? (DRESS.moveStiff ?? 2.4) : 1) * (ad.stiff ?? 1);
      const pin = DRESS.pin?.(k, n, a);
      const angs = chainOf(mem, goal, dt, { k: [210 * q, 95 * q], c: [19 * Math.sqrt(q), 9 * Math.sqrt(q)], gain: 0.04, push: [mo.ax, mo.ay], max: 1.4, anchor: st.tnActive ? 0.45 : 0.25, pin });
      const J = onFloor(jointsOf(R, angs, sgK), W);
      arms.push({ J, far: ad.far, front: Boolean(ad.front), free: Boolean(ad.free), k });
    }
    const slapK = P.arms.findIndex((ad) => ad.slap);
    const slapArm = arms[Math.max(0, slapK)].J;
    const sk = { K, body, at, inM, outline, Mb, mAng, rx, ry, arms, fins: finOut, ph, rise, amp, siphon: at([7.2, 1.2]), slapTip: slapArm[slapArm.length - 1], look: S.look, S, go };
    // (kept for the dress's arm shapes next frame: where its props were)
    st.tnLast = sk;
    return sk;
  }

  // The web between two arms: down the first to `webF` of its length, across in a hem that curves
  // up between them, and back up the second (its top hidden under the mantle).
  const webIdx = Math.round(n * P.webF);
  function webPath(ctx, Ji, Jj) {
    const pi = Ji[webIdx];
    const pj = Jj[webIdx];
    const c = mixP(mixP(pi, pj, 0.5), mixP(Ji[0], Jj[0], 0.5), P.notch);
    ctx.moveTo(...Ji[0]);
    for (let i = 1; i <= webIdx; i++) ctx.lineTo(...Ji[i]);
    ctx.quadraticCurveTo(...c, ...pj);
    for (let i = webIdx - 1; i >= 0; i--) ctx.lineTo(...Jj[i]);
    ctx.closePath();
  }
  // Drawing: the far arms and their web (in shade), the near ones; the front (held) arms over the body.
  function drawArms(ctx, a, mode, far) {
    const sk = a.tk;
    const L = far ? FAR : NEAR;
    // the web first, under the arms it joins
    const webs = P.webs.filter(([i, j]) => sk.arms[i].far === far && sk.arms[j].far === far);
    if (webs.length) {
      ctx.beginPath();
      for (const [i, j] of webs) webPath(ctx, sk.arms[i].J, sk.arms[j].J);
      if (mode === 'line') edge(ctx, INKD);
      else {
        ctx.fillStyle = tone(a, L.fill);
        ctx.fill();
        // (its hem a little deeper in shade, a lilac blush underneath)
        ctx.save();
        ctx.clip();
        for (const [i, j] of webs) {
          const p = mixP(sk.arms[i].J[webIdx], sk.arms[j].J[webIdx], 0.5);
          glowAt(ctx, a, p, 4.5, far ? CA.deep : CA.sh, 0.55);
        }
        ctx.restore();
      }
    }
    for (const arm of sk.arms) {
      if (arm.far !== far || arm.front) continue;
      const [pts, ws] = strandPts(arm.J, W);
      drawStrand(ctx, a, mode, pts, ws, L);
    }
    // one soft shade under the mantle over them, fading out along the arms
    if (!far && mode === 'fill') {
      ctx.save();
      ctx.beginPath();
      for (const arm of sk.arms) {
        if (arm.far || arm.front) continue;
        const [pts, ws] = strandPts(arm.J, W);
        strandInto(ctx, pts, ws);
      }
      for (const [i, j] of webs) webPath(ctx, sk.arms[i].J, sk.arms[j].J);
      ctx.clip();
      glowAt(ctx, a, sk.at([-0.4, 1.6]), 9, CA.sh, 0.6);
      ctx.restore();
    }
  }
  // The front arms over the body: their line drawn with the others (so only the outer edge keeps
  // one), their fill over the body, a soft rim only where they cross it, fading out toward the root.
  function drawFrontArm(ctx, a, mode) {
    const sk = a.tk;
    for (const arm of sk.arms) {
      if (!arm.front) continue;
      const [pts, ws] = strandPts(arm.J, W);
      if (mode === 'line') {
        ctx.beginPath();
        strandInto(ctx, pts, ws);
        edge(ctx, INKD);
        continue;
      }
      drawStrand(ctx, a, mode, pts, ws, NEAR);
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
      ctx.strokeStyle = tone(a, CA.sh);
      ctx.lineWidth = 0.8;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }
  // The fins, behind the mantle: outlined, filled, lit along their top, a paler middle.
  function drawFins(ctx, a, mode) {
    const sk = a.tk;
    ctx.beginPath();
    for (const f of sk.fins) {
      const [x0, y0] = f.shape[0];
      ctx.moveTo(x0, y0);
      for (const p of f.shape) ctx.lineTo(...p);
      ctx.closePath();
    }
    if (mode === 'line') return edge(ctx, INKD);
    for (const f of sk.fins) {
      polyPath(ctx, f.shape);
      ctx.fillStyle = tone(a, f.back ? CF.sh : CF.base);
      ctx.fill();
      ctx.save();
      ctx.clip();
      const tipM = f.mid[f.mid.length - 2];
      glowAt(ctx, a, tipM, FA.W * 1.6, f.back ? CF.base : CF.lt, 0.7);
      glowAt(ctx, a, f.mid[1], FA.W * 1.3, CF.deep, f.back ? 0.5 : 0.35);
      ctx.restore();
    }
  }
  function drawBody(ctx, a, mode) {
    const sk = a.tk;
    polyPath(ctx, sk.outline);
    if (mode === 'line') return edge(ctx, INKD);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    polyPath(ctx, sk.outline);
    ctx.clip();
    // the dome lit from above, a soft shade round the back of it and under it
    glowAt(ctx, a, sk.inM([-1.8, -sk.ry * 1.45]), sk.rx * 1.05, C.lt, 0.95);
    glowAt(ctx, a, sk.inM([-sk.rx * 0.95, -sk.ry * 0.5]), sk.rx * 0.7, C.sh, 0.5);
    glowAt(ctx, a, sk.inM([-sk.rx * 0.2, sk.ry * 0.12]), sk.rx * 0.6, C.sh, 0.35);
    // its own markings (the dress), clipped to the mantle
    DRESS.paint?.(ctx, a, sk, KIT);
    ctx.restore();
    // its own face (the dress)
    ctx.save();
    DRESS.face?.(ctx, a, sk, KIT);
    ctx.restore();
  }
  function spot(sk, what) {
    if (DRESS.spot) {
      const p = DRESS.spot(sk, what);
      if (p) return p;
    }
    if (what === 'slap') return sk.slapTip;
    if (what === 'mouth') return sk.siphon;
    return [sk.K[0], 0];
  }
  const KIT = {
    C, CA, CF, P, ink: INKD, tone, edge: (ctx) => edge(ctx, INKD), glowAt, polyPath, strandPts, strandInto, drawStrand, NEAR, FAR, W, mix, ease, easeOut, turn, plus, less, times, unit, mixP, wrapPi,
    layAlong, anglesOf, bezPts, lineCurve, loopCurve, motionAt,
    mantleFrame: (ctx, a) => {
      ctx.translate(...a.tk.Mb);
      ctx.rotate(a.tk.mAng);
    },
    mantlePath: (ctx, a) => polyPath(ctx, a.tk.outline),
  };
  const still = (wB, hB) => [E(wB / 2 - 1, hB - 22, 10.5, 10, C.base), E(wB / 2 - 1, hB - 8, 8, 5, CA.base)];
  return {
    H,
    speed: P.speed,
    cycle: P.cycle,
    w: 26,
    h: Math.round(H),
    boxW: 90,
    boxH: 64,
    skeleton,
    spot,
    still,
    KIT,
    seq: [['armsFar', (c, a, md) => drawArms(c, a, md, true)], ['armsNear', (c, a, md) => drawArms(c, a, md, false)], ['fins', drawFins], ['body', drawBody], ['armFront', drawFrontArm]],
    base(t, m, a, w) {
      const o = zero();
      const breath = Math.sin(t * 1.1);
      o.tilt = breath * 1.2 * (1 - w) - 6 * w;
      o.look = glance(t, m.uid ?? 0) * (1 - w);
      o.pitch = 2 * Math.sin(t * 0.5) * (1 - w);
      o.lift = 0.7 * Math.sin(t * 0.37) * (1 - w);
      return o;
    },
    poses(o, name, t) {
      const breath = Math.sin(t * 0.9);
      if (name === 'rest') Object.assign(o, { flat: 1, tilt: -4 + breath, pitch: 0, look: o.look * 0.5 });
      else if (name === 'curl') Object.assign(o, { curl: 1, tilt: 6, pitch: 4 });
      else if (name === 'sleep') Object.assign(o, { flat: 1, sleep: 1, tilt: -10 + breath * 1.2, pitch: 0, look: 0, still: 0.5 });
      else if (name === 'dead') Object.assign(o, { flat: 1, sleep: 0.6, splay: 0.15, tilt: -18, pitch: 0, look: 0, still: 1 });
    },
  };
}

// ---------- Effects: hit sparkles, an ink puff, bubbles ----------
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
  // bubbles trailing a jet
  if (mv.bubbles && t >= mv.bubbles[0] && t <= mv.bubbles[1] + 0.4) {
    for (let i = 0; i < 5; i++) {
      const bp = after([mv.bubbles[0] + i * 0.06], t, 0.55);
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
  ctx.restore();
}

// ---------- One rig for a dress ----------
function octoDressRig(look = {}) {
  const LP = look.P ?? {};
  const P = { ...OCTOPUS };
  for (const [k, v] of Object.entries(LP)) P[k] = v && typeof v === 'object' && !Array.isArray(v) && P[k] && typeof P[k] === 'object' && !Array.isArray(P[k]) ? { ...P[k], ...v } : v;
  const K = octoRig(P, look);
  const DRESS = look;
  const KIT = K.KIT;
  const table = { ...OCT_MOVES, ...(look.moves ?? {}) };
  KIT.moves = table;
  const pleased = look.pleased ?? 'stretch';
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
        st.tnPick = DRESS.pick ? DRESS.pick(m, a, st) : typeof m.move === 'string' && table[m.move] ? m.move : pool[st.tnN % pool.length];
      }
      st.tnAtk = true;
      const mv = table[st.tnPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.tnAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) >= 0 && (a.hurtAgo ?? 9) < moveLen(table.hurt)) return [table.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < moveLen(table[pleased])) return [table[pleased], gl, 1];
    return [null, 0, 0];
  }
  const parts = [];
  for (const mode of ['line', 'fill']) {
    for (const [name, fn] of K.seq) {
      parts.push({
        name: `${name}~${mode}`,
        parent: null,
        at: () => [0, 0],
        pivot: [0, 0],
        s: BLANK,
        paint: (ctx, a) => {
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
        },
      });
    }
  }
  const soft = ['look', 'tilt', 'beat', 'still'];
  const rig = makeRig({
    w: K.boxW,
    h: K.boxH,
    soft: true,
    stride: K.cycle,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, c === 'look' ? [60, 14] : c === 'tilt' ? [150, 17] : c === 'beat' ? [60, 13] : c === 'still' ? [80, 15] : c === 'fin' || c === 'sweep' ? [240, 22] : [170, 21]])),
    walkStiff: { pitch: [300, 32], tilt: [200, 24] },
    fast: CH.filter((c) => !soft.includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.tnActive),
    kick: { pitch: -40, tilt: -60 },
    turnKick: { tilt: 18 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.1;
      // How far it has gone: the flap's phase comes from this while it swims.
      const dt = Math.max(1e-3, a.dt ?? 0);
      const odo = m.odo ?? 0;
      const raw = Math.min(400, Math.abs(odo - (st.tnOdo ?? odo)) / dt);
      st.tnOdo = odo;
      st.tnV = mix(st.tnV ?? 0, raw, Math.min(1, dt * 5));
      // (a hoverer: how much it is swimming comes from its speed)
      st.tnGo = mix(st.tnGo ?? 0, clamp(st.tnV / (K.speed * 0.5), 0, 1), Math.min(1, dt * 4));
      const w = st.tnGo;
      const base = K.base(t, m, a, w);
      const [mv, mt, anticW] = moveNow(m, a, st);
      base.x /= K.H;
      base.hop /= K.H;
      const out = mv ? posed(mv, mt, anticW, base) : { ...base };
      const napping = m.habit?.kind === 'nap' && a.now < (m.habit.until ?? 0);
      if (m.pose && !mv) K.poses(out, m.pose === 'sleep' ? 'sleep' : m.pose, t);
      if (napping && !mv && m.hp > 0) K.poses(out, 'sleep', t);
      const mood = m.cine?.mood;
      if (mood === 'happy' && m.hp > 0 && !mv) Object.assign(out, { lift: out.lift + 1 + Math.sin(t * 5) * 0.8, fin: out.fin + 0.3 });
      else if (mood === 'sad' && m.hp > 0 && !mv) Object.assign(out, { crouch: Math.max(out.crouch, 0.5), pitch: out.pitch + 6, look: 0, fin: out.fin - 0.4 });
      if (m.hp <= 0) K.poses(out, 'dead', t);
      DRESS.pose?.(m, a, out, KIT, mv, mt);
      st.tnActive = Boolean(mv);
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
    fx: (ctx, m, a) => {
      drawFx(ctx, K, a);
      DRESS.fx?.(ctx, m, a, KIT);
    },
  });
  // (a still for the Monster Book: the body plain)
  const still = () => ({ w: K.boxW, h: K.boxH, res: 3, shapes: K.still(K.boxW, K.boxH) });
  return { rig, still, K };
}

// One dressed hovering octopus: its art entry (for ARTS), its size and its swimming pace.
export function dressedOcto(look) {
  const { rig, still, K } = octoDressRig(look);
  return { art: { pad: 10, walk: 8, idle: 8, attack: 5, stride: K.cycle, atkMs: [110, 180, 340, 240], draw: still, rig }, w: K.w, h: K.h, speed: K.speed, bodyH: K.H };
}
