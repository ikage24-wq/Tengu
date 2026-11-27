// Monster art: wilds (Windy Canyon and Mossy Woods).
//   rockhound  Rockhound Kid: Yodel, a cliff goat kid in a woven sunset poncho with a brass bell who
//              yodels for the canyon's echo, on its own copy of the hoofed base's goat kid
//              (render/pebblet/, 2026-11-25)
//   scorpip    Manticore Cub: the Sunset Manticub, a lion cub with bat wings and a scorpion tail, on its
//              own copy of the cat base's tiger cub (render/manticore/, 2026-11-25)
//   (leafling, the Dryad, is the Rootling Dryad now: render/dryad/, listed in hollowfolk.js)
//   boarlet    Warg: Tuskar's Hound, a scrappy charcoal-blue wolf pup in a red bandana and a
//              tusk-charm collar, on its own copy of the wolf base (render/warg/, 2026-11-25)
// Every design faces right with its feet on the bottom edge, and is built from small helpers
// (rotated ovals, smooth blobs, tapered tubes, two-bone legs and a gait cycle) so the walk
// cycles can plant, lift, and swing each leg while tails, manes, and leaves follow through.
// Each has its own gait (a low reptile wiggle, a cat's prowl, a graceful glide, a loping trot,
// a lumbering sway), its own eyes, an idle fidget loop, and a four-frame attack (wind-up,
// strike, impact, recover).

import { R, E, T, F, mix, sparkLine } from './kit.js';
import { vein, band } from './faces.js';
import { ramp, hue, crescent, shine, chain, sway } from './meadow.js';
import { MANTICUB } from '../manticore/index.js';
import { PEBBLET } from '../pebblet/index.js';
import { WARG } from '../warg/index.js';

// ---------- Geometry helpers ----------

const TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const wave = (t) => Math.sin(t * TAU);
const wrap = (p) => ((p % 1) + 1) % 1;
// A smooth bump that peaks (1) at phase c and fades to 0 within w either side; phases wrap.
function bump(p, c, w) {
  const d = Math.abs(wrap(p - c + 0.5) - 0.5);
  return d >= w ? 0 : 0.5 + 0.5 * Math.cos((Math.PI * d) / w);
}

// Points of an ellipse rotated by `a` degrees.
function ovalPts(cx, cy, rx, ry, a = 0, n = 20) {
  const ca = Math.cos(rad(a));
  const sa = Math.sin(rad(a));
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    out.push([cx + x * ca - y * sa, cy + x * sa + y * ca]);
  }
  return out;
}
const ov = (cx, cy, rx, ry, a, c) => (a ? T(ovalPts(cx, cy, rx, ry, a), c) : E(cx, cy, rx, ry, c));

// A Catmull-Rom spline through the points (closed loops for blobs, open for tubes).
function spline(pts, closed, seg = 4) {
  const n = pts.length;
  if (n < 3) return pts.slice();
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const out = [];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    for (let s = 0; s < seg; s++) {
      const t = s / seg;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
const blob = (pts, c, seg = 4) => T(spline(pts, true, seg), c);

// A smooth tapered tube along the points, with round caps; `ws` are widths spread along it.
function tubePts(pts, ws, seg = 4) {
  const path = spline(pts, false, seg);
  const lens = [0];
  for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = lens[lens.length - 1] || 1;
  const wAt = (u) => {
    const x = u * (ws.length - 1);
    const i = Math.min(ws.length - 2, Math.floor(x));
    return lerp(ws[i], ws[i + 1], x - i);
  };
  const left = [];
  const right = [];
  const dirs = [];
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const dx = (b[0] - a[0]) / l;
    const dy = (b[1] - a[1]) / l;
    dirs.push([dx, dy]);
    const h = wAt(lens[i] / total) / 2;
    left.push([path[i][0] - dy * h, path[i][1] + dx * h]);
    right.push([path[i][0] + dy * h, path[i][1] - dx * h]);
  }
  const cap = (p, d, h, sign) => {
    const out = [];
    for (let k = 1; k < 4; k++) {
      const a = (k / 4) * Math.PI;
      // Sweep from one side to the other around the end.
      const nx = -d[1];
      const ny = d[0];
      const c = Math.cos(a);
      const s = Math.sin(a) * sign;
      out.push([p[0] + (nx * c + d[0] * s) * h, p[1] + (ny * c + d[1] * s) * h]);
    }
    return out;
  };
  const n = path.length - 1;
  const endCap = cap(path[n], dirs[n], wAt(1) / 2, 1);
  const startCap = cap(path[0], dirs[0], wAt(0) / 2, -1).map(([x, y]) => [2 * path[0][0] - x, 2 * path[0][1] - y]);
  return [...left, ...endCap, ...right.reverse(), ...startCap];
}
const tube = (pts, ws, c, seg) => T(tubePts(pts, ws, seg), c);
// Inner line color for a part (the auto outline only wraps the whole silhouette): the part's
// own deepest tone, hue-shifted, never a neutral ink.
const edges = new Map();
const edge = (c) => {
  if (!edges.has(c)) edges.set(c, hue(ramp(c, { step: 15, turn: 14 }).deep, 0, -8, -4));
  return edges.get(c);
};
// A tube with its own thin dark line, so a limb in front of the body still reads.
const tubeL = (pts, ws, c, seg, lw = 0.9) => [F(tube(pts, ws.map((w) => w + lw), edge(c), seg)), tube(pts, ws, c, seg)];
// An oval with its own thin line.
const ovL = (cx, cy, rx, ry, a, c, lw = 0.45) => [F(ov(cx, cy, rx + lw, ry + lw, a, edge(c))), ov(cx, cy, rx, ry, a, c)];

// A foot's place in a walk cycle: planted and sliding back for `duty` of it (stance), then
// lifted and swung forward in an arc that rises quickly and sets down softly (swing).
// Returns [dx, lift] (lift negative = up).
function gait(p, stride, lift, duty = 0.5) {
  p = wrap(p);
  if (p < duty) return [stride / 2 - stride * (p / duty), 0];
  const t = (p - duty) / (1 - duty);
  const e = 0.5 - 0.5 * Math.cos(Math.PI * t);
  return [-stride / 2 + stride * e, -lift * Math.sin(Math.PI * Math.pow(t, 0.8))];
}

// Rotates points about (cx, cy) by `a` degrees.
const turn = (pts, cx, cy, a) => {
  const c = Math.cos(rad(a));
  const s = Math.sin(rad(a));
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};
// Rotates whole shapes about (cx, cy) (ellipses and rects keep their axes, fine for small turns).
const spin = (shapes, cx, cy, a) => (!a ? shapes : shapes.map((s) => {
  if (!s) return s;
  if (s.t === 'p') return { ...s, x: 0, y: 0, pts: turn(s.pts.map(([x, y]) => [x + s.x, y + s.y]), cx, cy, a) };
  if (s.t === 'e') {
    const [[x, y]] = turn([[s.x, s.y]], cx, cy, a);
    return { ...s, x, y };
  }
  const [[x, y]] = turn([[s.x + s.w / 2, s.y + s.h / 2]], cx, cy, a);
  return { ...s, x: x - s.w / 2, y: y - s.h / 2 };
}));

// A shaded ball: the base, its form shadow as a crescent on the back and underside (light from
// the upper front, so never a ring), and one small highlight on the top front. `jag` notches the
// shadow into fur tufts; `sh`/`hi` override the ramp's tones.
function ball(cx, cy, rx, ry, c, a = 0, { hi = true, k = 0.3, jag = 0, sh, light, a0 = 40, a1 = 225 } = {}) {
  const r = ramp(c, { step: 10, turn: 14, sat: -6 });
  const out = [ov(cx, cy, rx, ry, a, c), crescent(cx, cy, rx, ry, sh ?? r.sh, { k, jag, rot: a, a0, a1 })];
  if (hi) out.push(shine(cx, cy, rx, ry, light ?? r.hi, a));
  return out;
}

// Scales shapes about (cx, cy), to grow a head or shrink a detail.
const grow = (shapes, cx, cy, k) => shapes.map((s) => {
  if (!s) return s;
  if (s.t === 'p') return { ...s, x: 0, y: 0, pts: s.pts.map(([px, py]) => [cx + (s.x + px - cx) * k, cy + (s.y + py - cy) * k]) };
  if (s.t === 'e') return { ...s, x: cx + (s.x - cx) * k, y: cy + (s.y - cy) * k, rx: s.rx * k, ry: s.ry * k };
  return { ...s, x: cx + (s.x - cx) * k, y: cy + (s.y - cy) * k, w: s.w * k, h: s.h * k };
});
const shift = (shapes, dx, dy) => shapes.map((s) => (s ? { ...s, x: s.x + dx, y: s.y + dy } : s));

// A four-point sparkle (impact stars, glints).
function star(x, y, r, c, core = '#ffffff') {
  const k = r * 0.28;
  return [{ ...F(T([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]], c)), line: sparkLine(c) }, F(E(x, y, k * 0.9, k * 0.9, core))];
}
// Little dust puffs kicked up where something hits the ground.
const dust = (x, y, k, c = '#f3e6d6') => [E(x - 2.4 * k, y - 0.8 * k, 1.6 * k, 1.2 * k, c), E(x, y - 1.6 * k, 2 * k, 1.6 * k, mix(c, '#ffffff', 0.4)), E(x + 2.4 * k, y - 0.7 * k, 1.5 * k, 1.1 * k, c)];

function leaf(x, y, len, wid, a, R, bend = 0, vein = true) {
  const b = typeof bend === 'function' ? bend : (i) => (i ? bend : 0);
  const pts = chain(x, y, a, [len * 0.42, len * 0.58], b).map(([px, py]) => [px, py]);
  const out = [tube(pts, [0.5, wid, 0.25], R.base, 3)];
  if (wid > 2.4) out.push(F(tube(pts.map(([px, py]) => [px + wid * 0.08, py + wid * 0.2]), [0.3, wid * 0.5, 0.15], R.sh, 3)));
  if (vein && len > 4.5) out.push(band([pts[0], pts[1], [lerp(pts[1][0], pts[2][0], 0.6), lerp(pts[1][1], pts[2][1], 0.6)]], 0.35, R.deep));
  return out;
}

export const ART = {
  // (Windy Canyon's two, remade from scratch 2026-11-18: live rigs, their stills from the same shapes.)
  // (The Basilisk Hatchling was wiped 2026-11-22; the Rockhound Kid took its place, remade 2026-11-25
  // as Yodel, the cliff goat kid.)
  rockhound: PEBBLET.art,
  scorpip: MANTICUB.art,
  // (Remade 2026-11-20 as the Wolf Pup: a live rig.)
  boarlet: WARG.art,
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  rockhound: { name: 'Rockhound Kid', w: PEBBLET.w, h: PEBBLET.h },
  scorpip: { name: 'Manticore Cub', w: MANTICUB.w, h: MANTICUB.h },
  boarlet: { name: 'Warg', w: WARG.w, h: WARG.h },
};
