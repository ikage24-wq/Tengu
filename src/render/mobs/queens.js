// Monster art: the queens. Four majestic humanoid bosses with full walk, idle, and attack motion:
//   tamamo   Tamamo, the Nine-Tailed Empress: a kitsune empress in layered imperial robes, nine
//            fanned tails tipped in blue fox-fire, a golden kanzashi crown, and a folding fan
//   sylvana  Sylvana, the Dryad Queen: a birch-skinned tree spirit with willow-leaf hair, a
//            blossoming branch crown, a gown of leaves and moss that roots into the ground
//   lilith   Lilith, the Succubus Queen: a horned demon queen with bat wings, a gothic gown,
//            a heart-tipped tail, and a heart-gem scepter
//   selene   Selene, the Moon Valkyrie: a warrior goddess in silver plate under a starry cape,
//            with a crescent halo, a winged helm, a moon spear, and a crescent shield
// Each has her own eyes and her own gait. Parts are polygons pushed through a small transform
// stack (`within`) so a torso, a head, or an arm can tilt as one piece. All face right, feet at
// the bottom.

import { E, T, F, C, L, INK, shade, mix } from './kit.js';
import { heroineHead, heroineBrows, heroineTop } from './heroine.js';

const TAU = Math.PI * 2;
const PI = Math.PI;

// ---------- Transform stack and shape helpers ----------

let X = (x, y) => [x, y];
function within(f, fn) {
  const prev = X;
  X = (x, y) => prev(...f(x, y));
  try {
    return fn();
  } finally {
    X = prev;
  }
}
const rot = (cx, cy, a) => (x, y) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
};
const shift = (dx, dy) => (x, y) => [x + dx, y + dy];
const chain = (...fs) => (x, y) => fs.reduceRight((p, f) => f(...p), [x, y]);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
// Picks a value from a per-frame list (attack keys).
const key = (list, a) => list[clamp(a, 0, list.length - 1)];

const poly = (pts, c) => T(pts.map(([x, y]) => X(x, y)), c);
const fpoly = (pts, c) => F(poly(pts, c));
const lpoly = (pts, c) => L(poly(pts, c));
function ovalPts(cx, cy, rx, ry, n = 28, a = 0, a0 = 0, a1 = TAU) {
  const out = [];
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const full = Math.abs(a1 - a0 - TAU) < 1e-6;
  const m = full ? n : n + 1;
  for (let i = 0; i < m; i++) {
    const t = a0 + ((a1 - a0) * i) / n;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    out.push([cx + x * ca - y * sa, cy + x * sa + y * ca]);
  }
  return out;
}
const oval = (cx, cy, rx, ry, c, a = 0, n = 28) => poly(ovalPts(cx, cy, rx, ry, n, a), c);
const foval = (cx, cy, rx, ry, c, a = 0, n = 22) => F(oval(cx, cy, rx, ry, c, a, n));
const dot = (x, y, rx, c, ry = rx) => {
  const [px, py] = X(x, y);
  return F(E(px, py, rx, ry, c));
};
const arcPts = (cx, cy, rx, ry, a0, a1, n = 8) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * PI) / 180;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });

function spline(pts, n = 4) {
  if (pts.length < 3 || n <= 1) return pts;
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// A strip along a smooth curve whose width follows wf(t) (t from 0 to 1), as one polygon.
function strip(pts, wf, c, { n = 4, flat = false, tip = 0, cast = false, lit = false } = {}) {
  const p = spline(pts, n).map(([x, y]) => X(x, y));
  const m = p.length;
  const left = [];
  const right = [];
  for (let i = 0; i < m; i++) {
    const a = p[Math.max(0, i - 1)];
    const b = p[Math.min(m - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const w = wf(i / (m - 1), i) / 2;
    left.push([p[i][0] - dy * w, p[i][1] + dx * w]);
    right.push([p[i][0] + dy * w, p[i][1] - dx * w]);
  }
  const pts2 = [...left];
  if (tip) {
    const a = p[m - 2];
    const b = p[m - 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    pts2.push([b[0] + ((b[0] - a[0]) / len) * tip, b[1] + ((b[1] - a[1]) / len) * tip]);
  }
  pts2.push(...right.reverse());
  let s = T(pts2, c);
  if (flat) s = F(s);
  if (cast) s = C(s);
  if (lit) s = L(s);
  return s;
}
const taper = (pts, w0, w1, c, o = {}) => strip(pts, (t) => lerp(w0, w1, t), c, { ...o, tip: o.tip ? w1 * 1.4 : 0 });
const line = (pts, th, c, n = 1) => taper(pts, th, th, c, { n, flat: true });

// A rounded mass with a darker rim at the lower back and a soft highlight up front.
function ball(cx, cy, rx, ry, c, o = {}) {
  const a = o.a ?? 0;
  const out = [oval(cx, cy, rx, ry, o.dark ?? shade(c, -11), a)];
  out.push(oval(cx + rx * 0.08, cy - ry * 0.09, rx * 0.89, ry * 0.87, c, a));
  if (o.hi !== false) out.push(foval(cx + rx * 0.3, cy - ry * 0.5, rx * 0.34, ry * 0.15, o.light ?? mix(c, '#ffffff', 0.3), a - 0.25));
  return out;
}

function sparkle(x, y, r, c) {
  return fpoly([[x, y - r], [x + r * 0.28, y - r * 0.28], [x + r, y], [x + r * 0.28, y + r * 0.28], [x, y + r], [x - r * 0.28, y + r * 0.28], [x - r, y], [x - r * 0.28, y - r * 0.28]], c);
}

// A flame tongue (three nested layers) rising from (x, y), leaning `lean` px at the tip.
function flame(x, y, h, w, lean, cols) {
  const out = [];
  [1, 0.66, 0.36].forEach((k, i) => {
    const hh = h * (i === 0 ? 1 : k * 1.05);
    const ww = w * k;
    out.push(fpoly([[x - ww, y], [x - ww * 0.95, y - hh * 0.35], [x - ww * 0.35 + lean * 0.4, y - hh * 0.72], [x + lean, y - hh], [x + ww * 0.55 + lean * 0.3, y - hh * 0.55], [x + ww, y - hh * 0.2], [x + ww * 0.7, y]], cols[i]));
  });
  return out;
}

function gem(x, y, r, c, o = {}) {
  const pts = [];
  const k = o.sides ?? 6;
  const tall = o.tall ?? 1;
  for (let i = 0; i < k; i++) {
    const a = -PI / 2 + (i / k) * TAU;
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * tall]);
  }
  const out = [fpoly(pts.map(([px, py]) => [x + (px - x) * 1.25, y + (py - y) * 1.25]), o.rim ?? shade(c, -30))];
  out.push(fpoly(pts, c));
  out.push(fpoly([[x, y - r * tall], [x + r * 0.86, y - r * 0.5 * tall], [x, y], [x - r * 0.86, y - r * 0.5 * tall]], mix(c, '#ffffff', 0.45)));
  out.push(dot(x - r * 0.3, y - r * 0.45, Math.max(0.45, r * 0.22), '#ffffff'));
  return out;
}

// A heart, point down, centered on (x, y) with half-width r, turned by `a`.
function heartPts(x, y, r, a = 0) {
  const pts = [];
  for (let i = 0; i < 20; i++) {
    const t = (i / 20) * TAU;
    const hx = 16 * Math.sin(t) ** 3;
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    const px = (hx / 16) * r;
    const py = (hy / 16) * r + r * 0.15;
    pts.push([x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)]);
  }
  return pts;
}
const heart = (x, y, r, c, a = 0) => fpoly(heartPts(x, y, r, a), c);

// A leaf from (x, y) toward `ang`, with a midrib.
function leaf(x, y, ang, len, w, c, o = {}) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const nx = -dy;
  const ny = dx;
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const ww = Math.sin(PI * t ** 0.8) * w * 0.5;
    pts.push([x + dx * len * t + nx * ww, y + dy * len * t + ny * ww]);
  }
  for (let i = 5; i >= 1; i--) {
    const t = i / 6;
    const ww = Math.sin(PI * t ** 0.8) * w * 0.5;
    pts.push([x + dx * len * t - nx * ww, y + dy * len * t - ny * ww]);
  }
  const out = [o.flat === false ? poly(pts, c) : fpoly(pts, c)];
  if (o.rib) out.push(line([[x + dx * len * 0.1, y + dy * len * 0.1], [x + dx * len * 0.8, y + dy * len * 0.8]], 0.45, o.rib));
  return out;
}

// A five-petal blossom: one scalloped shape and a center.
function blossom(x, y, r, c, mid, a = 0) {
  const pts = [];
  for (let k = 0; k < 30; k++) {
    const t = a + (k / 30) * TAU;
    const rr = r * (0.55 + 0.45 * Math.abs(Math.cos((t - a) * 2.5)));
    pts.push([x + Math.cos(t) * rr, y + Math.sin(t) * rr]);
  }
  return [fpoly(pts, c), dot(x, y, r * 0.3, mid)];
}

// A five-point star.
function star(x, y, r, c) {
  const pts = [];
  for (let k = 0; k < 10; k++) {
    const t = -PI / 2 + (k / 10) * TAU;
    const rr = k % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(t) * rr, y + Math.sin(t) * rr]);
  }
  return fpoly(pts, c);
}

// Two-bone reach: the joint between root and end, bending toward `dir` (+1 forward, -1 back).
function bend(h, ft, a, b, dir) {
  const dx = ft[0] - h[0];
  const dy = ft[1] - h[1];
  const d = clamp(Math.hypot(dx, dy), 0.01, a + b - 0.2);
  const base = Math.atan2(dy, dx);
  const A = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const k1 = [h[0] + Math.cos(base + A) * a, h[1] + Math.sin(base + A) * a];
  const k2 = [h[0] + Math.cos(base - A) * a, h[1] + Math.sin(base - A) * a];
  const kn = (k1[0] - k2[0]) * dir > 0 ? k1 : k2;
  const fl = Math.hypot(ft[0] - kn[0], ft[1] - kn[1]) || 1;
  return { k: kn, f: [kn[0] + ((ft[0] - kn[0]) / fl) * Math.min(b, fl), kn[1] + ((ft[1] - kn[1]) / fl) * Math.min(b, fl)] };
}

// A slender hand at (x, y), fingers toward angle `a`; `open` spreads them.
function hand(x, y, a, skin, dk, open = 0) {
  const out = [];
  within(rot(x, y, a), () => {
    out.push(oval(x, y, 2.5, 2.1, dk, 0, 14), oval(x + 0.2, y - 0.2, 2.2, 1.8, skin, 0, 14));
    for (let k = 0; k < 3; k++) {
      const sp = (k - 1) * (0.25 + open * 0.3);
      out.push(taper([[x + 1.4, y - 0.6 + k * 0.7], [x + 1.4 + Math.cos(sp) * 3.4, y - 0.6 + k * 0.7 + Math.sin(sp) * 3.4]], 1.1, 0.8, skin, { n: 1 }));
    }
    out.push(taper([[x, y - 1.2], [x + 1.6, y - 3 - open]], 1.1, 0.8, skin, { n: 1 }));
  });
  return out;
}

// ---------- Faces ----------

// A queen's head and face come from the heroine kit (heroine.js), drawn in the head's own space
// around (hx, hy) through the current transform, so the face follows every tilt of the head.
// The hair goes on top; then queenTop adds the brows (they show through the bangs) and any sweat.
const headAt = (hx, hy) => {
  const Xh = X;
  // Snap the head's origin to the cell grid so the features rasterise alike in every frame.
  const [ox, oy] = Xh(hx, hy);
  const dx = Math.round(ox * 3) / 3 - ox;
  const dy = Math.round(oy * 3) / 3 - oy;
  return (x, y) => {
    const [px, py] = Xh(hx + x, hy + y);
    return [px + dx, py + dy];
  };
};
const queenHead = (hx, hy, mood, look) => heroineHead(headAt(hx, hy), mood, { ...look, browsOnTop: true });
const queenTop = (hx, hy, mood, look) => [...heroineBrows(headAt(hx, hy), mood, look), ...heroineTop(headAt(hx, hy), mood, look)];

// ---------- Hair ----------

// Draws fn() in the head's own space (0, 0 = middle of the skull), its origin snapped to the cell
// grid exactly as headAt does, so the hair and the face move as one in every frame.
function inHead(hx, hy, fn) {
  const prev = X;
  const [ox, oy] = prev(hx, hy);
  const dx = Math.round(ox * 3) / 3 - ox;
  const dy = Math.round(oy * 3) / 3 - oy;
  X = (x, y) => {
    const p = prev(hx + x, hy + y);
    return [p[0] + dx, p[1] + dy];
  };
  try {
    return fn();
  } finally {
    X = prev;
  }
}

// Secondary motion. Returns lag(t, len, layer): the offset of a point a fraction t of the way down
// a lock, `len` px below its root. The bend travels down the lock: the root follows the body
// `layer.lag` frames late (side locks about one, back hair two and more, each lock a little later
// than the one before) and the tip about a frame later still, so no two frames of the loop repeat
// the same shape. Short locks swing fast and small (`layer.fq` 2, `layer.amp` under 1), long hair
// slow and wide, and every tip traces a figure-8 (a sideways swing with a half-period lift).
// Locks are dragged back on the walk and hang with gravity when the head and body tilt (`turn`).
function hairMotion(tm, o) {
  const turn = o.turn ?? 0;
  return (t, len = 0, layer = {}) => {
    let dx = 0;
    let dy = 0;
    if (tm.atk) dx = (o.swing ?? 0) * t ** (layer.fq > 1 ? 0.9 : 1.2) * (layer.amp ?? 1);
    else if (!o.still) {
      const p = tm.phAt(tm.f - (layer.lag ?? 1) - t * (layer.travel ?? 1));
      const q = (o.fq ?? 1) * (layer.fq ?? 1) * p + (o.p0 ?? 0);
      const w = t ** 1.3;
      const a = o.amp * (layer.amp ?? 1) * w;
      dx = (o.drag ?? 0) * w + a * Math.sin(q);
      dy = a * 0.35 * Math.sin(2 * q);
      if (o.sway) dx += (o.sway(p) - o.sway(tm.ph)) * t;
      dy += (o.bob(p) - o.bob(tm.ph)) * t;
    }
    dx += Math.sin(turn) * len * t * 0.7;
    dy -= (1 - Math.cos(turn)) * len * t * 0.7;
    return [dx, dy];
  };
}
// A lock's spine pushed through the motion: point i sits i/(n-1) of the way down.
const flow = (pts, lag, layer) => pts.map(([x, y], i) => {
  const [dx, dy] = lag(i / (pts.length - 1), Math.max(0, y - pts[0][1]), layer);
  return [x + dx, y + dy];
});
// Layers: the short locks before the ears (fast and small) and the long hair behind (slow, wide,
// each lock `k` a further half frame late).
const SIDE = { lag: 1, fq: 2, amp: 0.45, travel: 0.6 };
const backLayer = (k) => ({ lag: 2 + k * 0.5, fq: 1, amp: 1, travel: 1.2 });
// The hair behind the head, one step darker than the crown and fringe, so the front reads first.
const backRamp = (R) => ({ hi: mix(R.hi, R.base, 0.55), base: mix(R.base, R.sh1, 0.45), sh1: mix(R.sh1, R.sh2, 0.45), sh2: shade(R.sh2, -6) });

// One clump of hair along a spine: a little narrower at the root, full by `pk`, then tapering to
// a point.
function clump(pts, w, c, o = {}) {
  const r0 = o.r0 ?? 0.8;
  const pk = o.pk ?? 0.22;
  const end = o.end ?? 0.1;
  const wf = (t) => w * (t < pk ? lerp(r0, 1, t / pk) : lerp(1, end, ((t - pk) / (1 - pk)) ** (o.k ?? 1.2)));
  return strip(pts, wf, c, { n: 3, flat: true, tip: o.tip ?? Math.max(0.8, w * 0.3) });
}

// A lock in two tones: shadow 1 underneath, the base laid over it toward the light, so the back
// edge and the tip stay in shadow (where the lock passes under its neighbour). `hi` adds a short
// sheen high on the lock; `line` a fading interior line along the front edge (over skin).
function lock(pts, w, R, o = {}) {
  const out = [clump(pts, w, o.dark ?? R.sh1, o)];
  const lx = o.lx ?? w * 0.17;
  const base = pts.map(([x, y], i) => [x + lx * (i ? 1 : 0.5), y]);
  out.push(clump(base, w * 0.66, o.c ?? R.base, { ...o, tip: (o.tip ?? Math.max(0.8, w * 0.3)) * 0.4, end: 0.18 }));
  const sp = spline(pts, 3);
  const m = sp.length;
  if (o.hi) {
    const [a, b] = o.hi;
    const seg = sp.slice(Math.round(a * (m - 1)), Math.round(b * (m - 1)) + 1).map(([x, y]) => [x + lx * 1.4, y]);
    if (seg.length > 1) out.push(strip(seg, (t) => w * 0.3 * Math.sin(PI * clamp(t, 0.08, 0.92)) ** 0.6, R.hi, { n: 1, flat: true }));
  }
  if (o.line) {
    const seg = sp.slice(1, Math.round(m * 0.8)).map(([x, y], i) => [x + w * 0.42, y]);
    if (seg.length > 1) out.push(strip(seg, (t) => 0.7 * Math.sin(PI * clamp(t, 0.05, 0.95)) ** 0.5 * (1 - t * 0.5), R.sh2, { n: 1, flat: true }));
  }
  return out;
}

// A lock that splits into two pointed ends of different lengths (pa, pb: the two spines, root to
// tip): both ends in shadow 1, the base over the shared upper part, the gap reading as a V.
function pair(pa, pb, wa, wb, R, o = {}) {
  const out = [clump(pa, wa, R.sh1, o), clump(pb, wb, R.sh1, o)];
  const m = Math.min(pa.length, pb.length);
  const mid = [];
  for (let i = 0; i < m; i++) mid.push([lerp(pa[i][0], pb[i][0], 0.5) + (o.lx ?? 0.5), lerp(pa[i][1], pb[i][1], 0.5) - (i === m - 1 ? (o.short ?? 2) : 0)]);
  const w = Math.max(wa, wb) + Math.hypot(pa[0][0] - pb[0][0], pa[0][1] - pb[0][1]) * 0.6;
  out.push(clump(mid, w * 0.72, R.base, { ...o, end: 0.3, tip: 0.6 }));
  const sp = spline(mid, 3);
  const n = sp.length;
  if (o.hi) {
    const [a, b] = o.hi;
    const seg = sp.slice(Math.round(a * (n - 1)), Math.round(b * (n - 1)) + 1).map(([x, y]) => [x + w * 0.12, y]);
    if (seg.length > 1) out.push(strip(seg, (t) => w * 0.22 * Math.sin(PI * clamp(t, 0.08, 0.92)) ** 0.6, R.hi, { n: 1, flat: true }));
  }
  if (o.line) {
    const front = pa[0][0] > pb[0][0] ? pa : pb;
    const seg = spline(front, 3).slice(1, -2).map(([x, y]) => [x + (front === pa ? wa : wb) * 0.4, y]);
    if (seg.length > 1) out.push(strip(seg, (t) => 0.7 * Math.sin(PI * clamp(t, 0.05, 0.95)) ** 0.5 * (1 - t * 0.5), R.sh2, { n: 1, flat: true }));
  }
  return out;
}

// The crown and fringe, in head space, on the ramp R = { hi, base, sh1, sh2 }.
//   cap    { cx, cy, rx, ry, a0, a1 }: the hair's outer edge, an arc (degrees) from the nape at a0
//          over the top to the front temple at a1
//   edge   the fringe's lower edge from the front temple to the back: [x, y, kind] with kind
//          't' a clump tip, 'n' the notch between clumps, 'p' a plain point
//   part   where the clumps spring from; the gaps between clumps run from each notch toward it,
//          `sepLen` of the way, bowed by `curl` (or away from the part on both sides, `split`)
//   crown  more gaps over the crown, behind the fringe
//   back   [aS, ...pts]: the shadow side, from the arc at aS down to the nape
//   nape   [span, w]: shadow 2 under the crown, along the nape
//   ring   { cx, cy, rx, ry, a0, a1, w }: the angel ring, broken where the gaps cross it
function hairCap(R, o) {
  const out = [];
  const c = o.cap;
  const arcAt = (a, d = 0) => [c.cx + Math.cos((a * PI) / 180) * (c.rx - d), c.cy + Math.sin((a * PI) / 180) * (c.ry - d)];
  const e = [[...arcAt(c.a1), 'a'], ...o.edge, [...arcAt(c.a0), 'a']];
  // The fringe: clump sides bow outward and meet in sharp tips and V notches.
  const fr = [];
  for (let i = 0; i < e.length; i++) {
    const [x, y, k] = e[i];
    fr.push([x, y]);
    if (i === e.length - 1) break;
    const [x2, y2, k2] = e[i + 1];
    if (k !== 't' && k2 !== 't') continue;
    const dx = x2 - x;
    const dy = y2 - y;
    const len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len;
    let ny = dx / len;
    if (ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    // A rounded shoulder by the notch, running straight into a sharp tip.
    const bu = (o.bulge ?? 0.25) * Math.abs(dy) + 0.12;
    for (const t of [0.22, 0.5, 0.78]) {
      const u = k === 't' ? 1 - t : t;
      const b = bu * Math.sin(PI * Math.min(1, u * 1.6)) ** 0.7 * (1 - u) * 1.6;
      fr.push([x + dx * t + nx * b, y + dy * t + ny * b]);
    }
  }
  // A rim line where the crown overlaps whatever is behind it (tails, wings, collars).
  if (o.rim) out.push(strip(arcPts(c.cx, c.cy, c.rx + 0.3, c.ry + 0.3, c.a0 + 4, c.a1 - 4, 18), (t) => 1.1 * Math.sin(PI * clamp(t, 0.03, 0.97)) ** 0.4, o.rim, { n: 1, flat: true }));
  out.push(fpoly([...fr, ...arcPts(c.cx, c.cy, c.rx, c.ry, c.a0, c.a1, 22)], R.base));
  // The shadow side of the crown, its edge following the clumps down to the nape.
  if (o.back) {
    const [aS, ...pts] = o.back;
    out.push(fpoly([...arcPts(c.cx, c.cy, c.rx, c.ry, c.a0, aS, 8), ...pts], R.sh1));
  }
  // Gaps between clumps, shadow 1, tapering up toward the part.
  const P = o.part;
  const seps = [];
  let ni = 0;
  e.forEach(([x, y, k]) => {
    if (k !== 'n') return;
    const L = Array.isArray(o.sepLen) ? o.sepLen[ni++ % o.sepLen.length] : o.sepLen ?? 0.7;
    const bow = (o.curl ?? 0) * (o.split ? Math.sign(x - P[0]) : 1);
    seps.push([[x, y], [lerp(x, P[0], L * 0.45) + bow, lerp(y, P[1], L * 0.45)], [lerp(x, P[0], L) + bow * 0.6, lerp(y, P[1], L)]]);
  });
  for (const s of seps) out.push(strip(s, (t) => lerp(1.1, 0.15, t ** 0.6), R.sh1, { n: 3, flat: true, tip: 0.8 }));
  for (const s of o.crown ?? []) out.push(strip(s, (t) => 0.95 * Math.sin(PI * lerp(0.12, 1, t)) ** 0.5, s.c ?? R.sh1, { n: 3, flat: true, tip: 0.6 }));
  // Shadow 2 under the crown, along the nape.
  if (o.nape) {
    const [span, nw] = o.nape;
    const outer = [];
    const inner = [];
    for (let i = 0; i <= 8; i++) {
      const a = c.a0 + (span * i) / 8;
      outer.push(arcAt(a));
      inner.push(arcAt(a, nw * (1 - i / 8) ** 0.8));
    }
    out.push(fpoly([...outer, ...inner.reverse()], R.sh2));
  }
  // The angel ring: a band following the skull, broken where the gaps cross it, with a zigzag
  // lower edge, widest at the top.
  if (o.ring) {
    const r = o.ring;
    const mx = r.rx - r.w / 2;
    const my = r.ry - r.w / 2;
    const gaps = [];
    for (const s of [...seps, ...(o.crown ?? [])]) {
      const sp = spline(s, 4);
      for (let i = 1; i < sp.length; i++) {
        const f = ([x, y]) => Math.hypot((x - r.cx) / mx, (y - r.cy) / my) - 1;
        const f0 = f(sp[i - 1]);
        const f1 = f(sp[i]);
        if (f0 * f1 > 0) continue;
        const u = f0 / (f0 - f1 || 1);
        const x = lerp(sp[i - 1][0], sp[i][0], u);
        const y = lerp(sp[i - 1][1], sp[i][1], u);
        let a = (Math.atan2((y - r.cy) / my, (x - r.cx) / mx) * 180) / PI;
        if (a < r.a0 - 180) a += 360;
        if (a > r.a0 && a < r.a1) gaps.push(a);
        break;
      }
    }
    if (r.gaps) gaps.splice(0, gaps.length, ...r.gaps);
    gaps.sort((p, q) => p - q);
    const h = ((r.gap ?? 0.55) / r.rx) * (180 / PI);
    const cuts = [r.a0];
    for (const g of gaps) cuts.push(g - h, g + h);
    cuts.push(r.a1);
    const tooth = ((r.tooth ?? 1.9) / r.rx) * (180 / PI);
    for (let i = 0; i < cuts.length; i += 2) {
      const s0 = cuts[i];
      const s1 = cuts[i + 1];
      if (s1 - s0 < tooth * 0.6) continue;
      const wq = (a) => r.w * (0.4 + 0.6 * Math.sin(PI * clamp((a - r.a0) / (r.a1 - r.a0), 0, 1)) ** 0.7);
      const at = (a, d) => [r.cx + Math.cos((a * PI) / 180) * (r.rx - d), r.cy + Math.sin((a * PI) / 180) * (r.ry - d)];
      const n = Math.max(2, Math.round((s1 - s0) / tooth) * 2);
      const top = [];
      const low = [];
      for (let j = 0; j <= n; j++) {
        const a = lerp(s0, s1, j / n);
        top.push(at(a, 0));
        const end = j === 0 || j === n;
        low.push(at(a, end ? wq(a) * 0.45 : wq(a) * (j % 2 ? 1.65 : 0.9)));
      }
      out.push(fpoly([...top, ...low.reverse()], R.hi));
    }
  }
  // Pale hair: the clump tips darken toward the skin so the hairline reads.
  if (o.tipShade) {
    const ln = fr.filter(([x]) => x >= (o.lineX ?? -5.5)).map(([x, y]) => [x, y - o.tipShade * 0.45]);
    out.push(strip(ln, (t) => o.tipShade * Math.sin(PI * clamp(t, 0.03, 0.97)) ** 0.3, R.sh1, { n: 1, flat: true }));
  }
  // A fine line where the fringe overlaps the face, fading at both ends.
  const lx = o.lineX ?? -5.5;
  const ln = fr.filter(([x]) => x >= lx).map(([x, y]) => [x, y - 0.22]);
  out.push(strip(ln, (t) => 0.72 * Math.sin(PI * clamp(t, 0.03, 0.97)) ** 0.35, R.sh2, { n: 1, flat: true }));
  return out;
}
// The fringe's lower edge, left to right, for the face's forehead shadow (look.bangs).
const bangsOf = (edge) => edge.filter(([x, , k]) => k !== 'p' && x < 12.8).map(([x, y]) => [x, y]).reverse();

// ---------- Shared motion ----------

// The idle's eight frames, as points on the breathing cycle (in turns; the body is lowest at a
// quarter turn and highest at three quarters). It rises slowly over four frames, holds the top for
// a frame, then drops quickly back over three: settle slow, drop fast, with one held extreme.
const IDLE_U = [0.25, 0.4, 0.55, 0.68, 0.75, 0.75, 0.95, 1.12];
function timing(pose, f) {
  const walk = pose === 'walk';
  const atk = pose === 'attack';
  const idle = !walk && !atk;
  const n = walk ? 8 : atk ? 5 : IDLE_U.length;
  // The body's phase at any (fractional) frame, so trailing parts can sample it a frame or two back.
  const phAt = (fr) => {
    if (!idle) return (fr / n) * TAU;
    const k = Math.floor(fr);
    const i = ((k % n) + n) % n;
    const turns = Math.floor(k / n);
    const u0 = IDLE_U[i];
    const u1 = i === n - 1 ? IDLE_U[0] + 1 : IDLE_U[i + 1];
    return (lerp(u0, u1, fr - k) + turns) * TAU;
  };
  return { walk, atk, idle, f, a: atk ? f : -1, ph: atk ? 0 : phAt(f), phAt, n };
}
function moods(mood) {
  return { angry: mood === 'angry', hurt: mood === 'hurt', dead: mood === 'dead', happy: mood === 'happy' };
}
// The defeated pose fades toward a pale lavender.
const FADE = '#e6def0';
function finish(out, w, h, dead) {
  const shapes = dead ? out.map((q) => (q.c && q.c.startsWith('#') && q.c !== INK ? { ...q, c: mix(q.c, FADE, 0.32) } : q)) : out;
  return { w, h, res: 3, shapes };
}

// ---------- Tamamo, the Nine-Tailed Empress ----------

const K = {
  skin: '#fff2ea', skinDk: '#f1d2cf', hair: '#ffd27a', hairDk: '#e89a3c', hairLt: '#fff3c4', hairSh2: '#b8682a', tail: '#ffd284', tailDk: '#e6a24c', tip: '#fffaf3',
  earIn: '#ffc2d2', fire: '#5ec5ff', fire2: '#a8e8ff', fire3: '#f2fdff', hot: '#9a7bff', robe: '#fff8f1', robeDk: '#eadbe3', robeLt: '#ffffff',
  crimson: '#dc3a60', crimsonDk: '#a82448', pink: '#ffa3bd', gold: '#ffd36b', goldDk: '#d39a42', goldLt: '#fff1b6', wood: '#8a4a3c', lip: '#e2486c',
};
const FIRE = [K.fire, K.fire2, K.fire3];
const FIRE_HOT = ['#8c74ff', '#c4b4ff', '#ffffff'];

// Tamamo's hime cut: a straight-cut fringe of five clumps with small V notches, chin-length side
// locks, and long straight hair down her back.
const TAMAMO_HAIR = {
  cap: { cx: 0, cy: -1.2, rx: 14.8, ry: 15.2, a0: 160, a1: 357 },
  edge: [[13, -0.9, 't'], [11.3, -2.6, 'n'], [9.3, -1.5, 't'], [7.2, -2.7, 'n'], [5.1, -1.1, 't'], [3, -2.5, 'n'], [0.9, -1.7, 't'], [-1.2, -2.8, 'n'], [-3.3, -1.2, 't'], [-5, -2.4, 'n'], [-8.2, 5.2, 'p']],
  part: [2.5, -15.5],
  sepLen: [0.5, 0.74, 0.58, 0.8],
  curl: 0.3,
  bulge: 0.18,
  rim: K.hairDk,
  crown: [[[0, -14.6], [-5, -9.6], [-8.6, -2.4]], [[-2.4, -15], [-9, -10.4], [-12.6, -1.4]]],
  back: [215, [-10.6, -7.4], [-11.2, -3], [-9.8, 1], [-10.8, 4.6]],
  nape: [32, 2.4],
  ring: { cx: 1, cy: -0.6, rx: 12.6, ry: 9.4, a0: 200, a1: 332, w: 1.4 },
};
const TAMAMO_RAMP = { hi: K.hairLt, base: K.hair, sh1: K.hairDk, sh2: K.hairSh2 };

// Tamamo's face: a sly fox empress. Matched almond eyes of jade teal (the hue opposite her gold
// hair, so the face holds the sprite's strongest contrast) lifted at the corners, slit pupils, a
// soft rose eyeshadow where a long red liner used to streak (it smeared at sprite size), a smug
// curl of a smile on a softer chin; she bares a fang only when roused.
const TAMAMO_FACE = {
  skin: K.skin, skinSh: '#f8d0ca', skinSh2: '#e6a6ab', blush: '#ff9fb2', lip: '#e2486c', lipLine: '#a8344f',
  bangs: bangsOf(TAMAMO_HAIR.edge),
  head: { chin: [7.6, 15.4], cheek: 14.4, jaw: -0.4 },
  eye: { nearX: 2.4, farX: 9.8, rx: 3.7, ry: 2.6, far: 0.8, iris: '#22b8a8', irisDk: '#0a5c62', irisLt: '#b6fff0', hot: '#ff3d63', hotDk: '#9a1030', pupil: 'slit', pupilC: '#06303a', tilt: 0.38, wing: 1.2, flicks: 2, lashLen: 1.1, shadow: '#ffb0bc', smoky: 0.2, lowerLash: '#c86478', ink: '#3a1a1c' },
  brow: { c: '#c07a3a', kind: 'soft', w: 0.7, lift: 0.3 },
  mouth: [8.2, 12.2],
  nose: [9.2, 9.6],
  blushK: 0.8,
  fang: 'angry',
  moods: { idle: { open: 0.82, mouth: 'smirk', gaze: [0.12, 0] }, angry: { mouth: 'snarl', pupil: 0.55 }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } },
};

function tamamo(pose, f, mood) {
  const W = 164;
  const H = 150;
  const G = H - 0.6;
  const bx = 82;
  const tm = timing(pose, f);
  const { walk, atk, a, ph } = tm;
  const { angry, hurt, dead, happy } = moods(mood);
  // A stately glide: she floats along without steps, the train sweeping behind, and the body
  // rises a touch once per cycle; idle is a slow breath.
  let bob = walk ? -1.6 * Math.sin(ph) : 0.6 * Math.sin(ph);
  let lean = walk ? 1.6 + 0.9 * Math.sin(ph - 0.5) : 0;
  let tilt = walk ? 0.03 + 0.012 * Math.sin(ph - 0.9) : 0;
  let headA = walk ? -0.02 + 0.03 * Math.sin(ph - 1.3) : 0.03 * Math.sin(ph - 0.6);
  let drop = 0;
  // Secondary motion: hair, sleeves, and the train lag behind the body.
  let swing = walk ? -2.4 + Math.sin(ph - 1.2) * 1.9 : Math.sin(ph - 1.1) * 1.1;
  let spread = 1;
  let tlen = 1;
  let burst = 0;
  let handAt = [bx + 22, G - 64 + bob];
  let fanOpen = 1;
  let fanAng = -62;
  if (angry) {
    spread = 1.08;
    tlen = 1.04;
  }
  if (atk) {
    lean = key([-3, 4, 5, 3, 1], a);
    tilt = key([-0.08, 0.06, 0.07, 0.04, 0.01], a);
    bob = key([0.5, -1, -0.6, 0, 0], a);
    headA = key([-0.1, 0.05, 0.06, 0.03, 0], a);
    swing = key([3, -3.6, -2, 0.6, 0.6], a);
    spread = key([0.82, 1.26, 1.22, 1.12, 1.04], a);
    tlen = key([0.92, 1.12, 1.1, 1.05, 1], a);
    burst = key([0.35, 1, 1.25, 0.7, 0.25], a);
    handAt = key([[bx + 18, G - 80], [bx + 36, G - 84], [bx + 37, G - 80], [bx + 32, G - 74], [bx + 24, G - 66]], a);
    fanOpen = key([1, 1, 1, 0.9, 0.6], a);
    fanAng = key([-88, -8, 2, 10, -40], a);
  }
  if (hurt) {
    lean -= 3;
    tilt -= 0.07;
    headA -= 0.14;
    spread *= 0.9;
  }
  if (dead) {
    drop = 24;
    lean = 3;
    tilt = 0.16;
    headA = 0.32;
    spread = 1.18;
    tlen = 0.9;
    swing = 0;
    handAt = [bx + 22, G - 22];
    fanOpen = 0.5;
    fanAng = 20;
  }
  const hipY = G - 50;
  const Tu = chain(shift(lean, bob + drop), rot(bx, hipY, tilt));
  const hx = bx + 3;
  const hy = G - 100;
  const Th = chain(Tu, rot(hx, hy + 13, headA));
  const out = [];
  const fireC = angry || atk ? FIRE_HOT : FIRE;

  // ---- Nine tails, fanned like a peacock's train behind her. A wave runs across them.
  const root = Tu(bx - 5, hipY - 1);
  const tails = [];
  for (let i = 0; i < 9; i++) {
    const side = (i - 4) / 4;
    const wave = atk ? Math.sin(a * 1.2 - i * 0.6) * 0.04 : (walk ? 0.09 : 0.075) * Math.sin(ph - i * 0.7);
    let ang = -PI / 2 + side * 1.22 * spread + wave - (walk ? 0.1 : 0);
    if (dead) ang = -PI * 0.62 - (i / 8) * PI * 0.36;
    tails.push({ i, side, ang, wave });
  }
  tails.sort((p, q) => Math.abs(q.side) - Math.abs(p.side));
  for (const { i, side, ang, wave } of tails) {
    const len = (dead ? 54 : 62 + (1 - Math.abs(side)) * 8) * tlen;
    const pts = [root];
    let aa = ang;
    let p = root;
    for (let k = 1; k <= 5; k++) {
      aa += (k < 3 ? side * 0.07 : -side * 0.12) + wave * 1.4 * (k / 5) + (walk ? -0.03 * k * Math.sin(ph * 2 - i) : 0);
      if (dead) aa = lerp(aa, -PI * 1.04, 0.3 + 0.12 * k);
      p = [p[0] + Math.cos(aa) * (len / 5), p[1] + Math.sin(aa) * (len / 5)];
      if (dead) p[1] = Math.min(p[1], G - 3);
      pts.push(p);
    }
    // A plume: slim at the root, broad and round toward the tip, with a little flick.
    const prof = (t) => 3.6 + 17 * (t < 0.62 ? Math.sin((PI / 2) * (t / 0.62)) : Math.sqrt(Math.max(0, 1 - ((t - 0.62) / 0.4) ** 2)));
    const wf = (t, j) => prof(t) * (j % 2 && t > 0.2 ? 1.06 : 1);
    out.push(strip(pts, (t, j) => wf(t, j) + 1.8, K.tailDk, { n: 3, tip: 3 }), strip(pts, (t, j) => wf(t, j) * 0.86, i % 2 ? K.tail : mix(K.tail, K.tailDk, 0.22), { n: 3, tip: 2 }));
    // Fur strokes and the white tip.
    const sp = spline(pts, 3);
    const m = sp.length;
    out.push(line(sp.slice(Math.round(m * 0.15), Math.round(m * 0.6)).map(([x, y]) => [x - 2, y + 1]), 0.7, K.tailDk, 1), line(sp.slice(Math.round(m * 0.25), Math.round(m * 0.7)).map(([x, y]) => [x + 2, y - 1]), 0.6, mix(K.tail, '#ffffff', 0.5), 1));
    const i0 = Math.round(m * 0.68);
    const i1 = Math.round(m * 0.78);
    out.push(strip(sp.slice(i0), (t) => prof(lerp(i0 / (m - 1), 1, t)) * 0.8, mix(K.tail, K.tip, 0.55), { n: 1, flat: true, tip: 1.6 }));
    out.push(strip(sp.slice(i1), (t) => prof(lerp(i1 / (m - 1), 1, t)) * 0.84 * (0.95 + 0.05 * Math.sin(t * 13)), K.tip, { n: 1, flat: true, tip: 1.8 }));
    const tp = sp[m - 1];
    const prev = sp[m - 3];
    const dir = Math.atan2(tp[1] - prev[1], tp[0] - prev[0]);
    const tipX = tp[0] + Math.cos(dir) * 2;
    const tipY = tp[1] + Math.sin(dir) * 2;
    // Fox-fire on every tip.
    if (!dead) {
      const fl = (1 + 0.25 * Math.sin(ph * 2 + i * 1.7)) * (1 + burst * 0.7);
      out.push(foval(tipX, tipY - 1, 4.4 * fl, 4 * fl, mix(fireC[1], '#ffffff', 0.3)));
      out.push(...flame(tipX, tipY + 2.4, 11 * fl, 3.6 * Math.min(1.5, fl), -side * 2 + Math.sin(ph * 2 + i) * 1.4, fireC));
    } else {
      out.push(dot(tipX, tipY - 3, 1.4, '#d8d0ec'));
    }
  }

  // Hair trails the glide by a frame and hangs with gravity as she tilts.
  const lag = hairMotion(tm, { amp: walk ? 1 : 1.1, drag: walk ? -2.2 : 0, bob: (p) => (walk ? -0.8 : 0.6) * Math.sin(p), swing, still: dead, turn: tilt + headA });
  const R = TAMAMO_RAMP;

  // ---- Long straight back hair in four locks, ends cut to points of different lengths.
  // It widens below the jaw (never tucking in under the skull) and is a shade darker than the crown.
  const RB = backRamp(R);
  within(Th, () => inHead(hx, hy, () => {
    out.push(clump(flow([[-12, -6], [-16, 8], [-18, 24], [-18.6, 40], [-17.2, 56]], lag, backLayer(0)), 8.4, RB.sh2, { end: 0.3 }));
    out.push(...lock(flow([[-10.4, -4], [-14.4, 10], [-15.6, 26], [-15.2, 42], [-13.8, 57.5]], lag, backLayer(1)), 6.8, RB, { hi: [0.1, 0.3] }));
    out.push(...lock(flow([[-7, -2], [-10.2, 12], [-11.2, 28], [-10.8, 42], [-10.4, 53]], lag, backLayer(2)), 6.2, RB, { hi: [0.14, 0.3] }));
    out.push(...lock(flow([[-3.6, 2], [-5.6, 14], [-6.4, 28], [-6, 40], [-6.6, 47.5]], lag, backLayer(3)), 4.8, RB));
  }));
  within(Tu, () => {
    const sw = swing;
    const top = G - 82;
    out.push(poly([[bx - 6, top + 2], [bx - 14, top + 6], [bx - 20 + sw * 0.3, top + 24], [bx - 25 + sw, top + 44], [bx - 23 + sw, top + 50], [bx - 15 + sw * 0.8, top + 52], [bx - 9 + sw * 0.6, top + 47], [bx - 6, top + 26]], K.robeDk));
    out.push(line([[bx - 25 + sw, top + 44], [bx - 23 + sw, top + 50], [bx - 15 + sw * 0.8, top + 52], [bx - 9 + sw * 0.6, top + 47]], 1.8, K.crimson, 1));
    out.push(line([[bx - 23 + sw, top + 50.6], [bx - 15 + sw * 0.8, top + 52.4]], 0.8, K.gold, 1));
  });

  // ---- The robes: an inner crimson kimono, layered collars, a gold obi, and the long white
  // uchikake hanging open over them, its hem padded and sweeping into a train.
  {
    const top = G - 82;
    const P = (x, y) => Tu(x, y);
    const wv = (k) => Math.sin(ph * (walk ? 2 : 1) + k) * (walk ? 1.9 : 0.5);
    const hem = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = lerp(bx + 26 + (dead ? 6 : 0) + (atk ? lean * 0.5 : 0), bx - 34 - (walk ? 6 : 0) - (dead ? 8 : 0), t) + wv(t * 6) * 0.6;
      hem.push([x, G - 0.4 - 3.2 * (1 - t) ** 5 - Math.abs(Math.sin(t * 7 + ph * 2)) * 0.9 * (1 - t) * t * 3]);
    }
    const train = [[bx - 46 - (walk ? 9 : 0) + wv(2) - (dead ? 6 : 0), G - 0.2], [bx - 36 - (walk ? 6 : 0) + wv(3), G - 3.6], [bx - 28 + wv(4) * 0.4, G - 12]];
    const back = [P(bx - 10, top + 3), P(bx - 12, top + 16), P(bx - 10.5, top + 26), P(bx - 14, top + 38), ...(drop ? [] : [[bx - 21 + lean * 0.3, G - 28]])];
    const front = [P(bx + 10, top + 3), P(bx + 12.6, top + 11), P(bx + 9, top + 24), P(bx + 12, top + 36), ...(drop ? [] : [[bx + 17 + lean * 0.5, G - 22]])];
    // Inner kimono, crimson with little gold blossoms.
    out.push(T([...front, hem[0], ...hem, ...train, ...back.slice().reverse()], K.crimson));
    for (let k = 0; k < 5; k++) {
      const t = 0.15 + k * 0.17;
      const [x0, y0] = front[3];
      const x = lerp(x0, hem[0][0], t) - 4 - (k % 2) * 5;
      const y = lerp(y0, G, t);
      if (y < G - 3) out.push(F(T(ovalPts(x, y, 1.4, 1.4, 8), k % 2 ? K.goldLt : K.gold)));
    }
    // The open uchikake: from the shoulders, its front edge running down behind the obi.
    const edge = [P(bx + 6, top + 1), P(bx + 7, top + 13), P(bx + 1, top + 26), P(bx + 1, top + 38), [bx + 4 + lean * 0.4, G - 18], [hem[3][0] - 2, G - 1.2]];
    const outer = [...edge, ...hem.slice(4), ...train, ...back.slice().reverse()];
    out.push(T(outer, K.robe));
    // Soft folds falling from the hips, and the shadowed back of the train.
    for (const [x0, x1, w] of [[bx - 1, bx + 1, 1.6], [bx - 4, bx - 6, 2.2], [bx - 7, bx - 11, 1.4], [bx - 10, bx - 18, 2.6], [bx - 13, bx - 25, 2]]) {
      const t0 = Tu(x0, top + 40);
      out.push(strip([t0, [lerp(t0[0], x1, 0.5) + wv(x0) * 0.6, lerp(t0[1], G, 0.5)], [x1 + wv(x0 + 1), G - 2]], (t) => w * Math.sin(PI * Math.min(1, t * 1.1 + 0.05)), K.robeDk, { n: 3, flat: true }));
    }
    out.push(F(T([train[0], train[1], train[2], [train[2][0] + 6, train[2][1] + 6], [train[1][0] + 10, G - 2]], K.robeDk)));
    out.push(strip([P(bx + 3.4, top + 8), P(bx - 1, top + 26), P(bx - 1, top + 38), [bx + 1 + lean * 0.4, G - 16]], (t) => 2.4 * Math.sin(PI * Math.min(1, t * 1.05 + 0.04)), K.robeLt, { n: 3, flat: true }));
    // Embroidered gold clouds and fox-fire.
    const emb = [[bx - 20, G - 12, 1], [bx - 6, G - 22, -1], [bx - 30, G - 9, -1], [bx - 15, G - 33, 1]];
    for (const [x, y, d] of emb) {
      const pp = drop ? Tu(x, y - drop * 0.3) : [x, y];
      if (drop && pp[1] > G - 3) continue;
      out.push(F(T(arcPts(pp[0], pp[1], 3, 2.2, 180, 360, 6).concat(arcPts(pp[0] + 3 * d, pp[1], 2.4, 1.8, 0, -180, 6)), K.gold)), F(T(ovalPts(pp[0] + 0.5 * d, pp[1] - 0.6, 1.5, 1, 8), K.goldLt)));
    }
    // Layered edges along the opening (gold, pink) and the padded crimson hem.
    const es = spline(edge, 3);
    out.push(T(es.map(([x, y]) => [x + 1.6, y]).concat(es.slice().reverse()), K.gold));
    out.push(T(es.map(([x, y]) => [x + 2.8, y]).concat(es.map(([x, y]) => [x + 1.6, y]).reverse()), K.pink));
    const hemOut = [...hem.slice(3), ...train.slice(0, 1)];
    // A crimson hem band with gold waves and white fox-fire above the padded roll.
    const nh = hemOut.length - 1;
    const bw = (t) => 4.4 * Math.min(1, 0.4 + t * 6) * lerp(1, 0.45, t * t);
    const hb = hemOut.map(([x, y], i) => [x, y - 1.6 - bw(i / nh) / 2 + Math.sin(i * 1.3 + ph * 2) * 0.5 * (i / nh)]);
    out.push(strip(hb, bw, K.crimson, { n: 2, flat: true, tip: 2 }));
    out.push(line(spline(hb.map(([x, y], i) => [x, y - bw(i / nh) / 2 - 0.6]), 2), 1, K.gold));
    hb.forEach(([x, y], i) => {
      if (i % 2 === 0 && i > 0 && i < nh) out.push(...blossom(x - 2, y + 0.2, 1.7 * lerp(1, 0.7, i / nh), K.goldLt, K.crimsonDk, i));
    });
    out.push(strip(hemOut.map(([x, y]) => [x, y - 1.2]), (t) => 3 * lerp(1, 0.55, t), K.crimsonDk, { n: 2, tip: 2 }), strip(hemOut.map(([x, y]) => [x, y - 1.7]), (t) => 1.6 * lerp(1, 0.55, t), K.crimson, { n: 2, flat: true, tip: 2 }));
    // The obi: a broad gold sash with a crimson cord, and its great bow at the back.
    within(Tu, () => {
      const oy = top + 22;
      // The bow: two hanging ends that sway, two broad loops, and the knot.
      for (const [dx, len] of [[-1, 16], [1.5, 20]]) out.push(strip([[bx - 14 + dx, oy + 2], [bx - 17 + dx + swing * 0.5, oy + len * 0.5], [bx - 18 + dx + swing, oy + len]], (t) => 5.4 - t, K.goldDk, { n: 3 }), strip([[bx - 14 + dx, oy + 2], [bx - 17 + dx + swing * 0.5, oy + len * 0.5], [bx - 18 + dx + swing, oy + len]], (t) => 3.6 - t, K.gold, { n: 3, flat: true }));
      for (const [ang, r] of [[-2.3, 8], [2.5, 7]]) {
        const cx = bx - 14 + Math.cos(ang) * r * 0.9 + swing * 0.2;
        const cy = oy + Math.sin(ang) * r * 0.75;
        out.push(oval(cx, cy, r, r * 0.55, K.goldDk, ang, 18), oval(cx + 0.4, cy - 0.3, r * 0.82, r * 0.42, K.gold, ang, 18), line([[cx - Math.cos(ang) * r * 0.6, cy - Math.sin(ang) * r * 0.45], [cx + Math.cos(ang) * r * 0.5, cy + Math.sin(ang) * r * 0.4]], 0.7, K.crimson));
      }
      out.push(oval(bx - 14, oy, 3, 3.4, K.goldDk, 0, 12), oval(bx - 13.8, oy - 0.3, 2.3, 2.7, K.gold, 0, 12));
      out.push(poly([[bx - 12, oy - 5], [bx + 10, oy - 5.4], [bx + 11.5, oy + 4.6], [bx - 13, oy + 5]], K.goldDk), poly([[bx - 11.4, oy - 4.4], [bx + 9.6, oy - 4.6], [bx + 10.6, oy + 3.6], [bx - 12, oy + 4]], K.gold));
      out.push(line([[bx - 12, oy - 1.2], [bx + 10.8, oy - 1.6]], 0.7, K.goldLt), line([[bx - 12.4, oy + 1.4], [bx + 11, oy + 1]], 1.2, K.crimson));
      out.push(...gem(bx + 8.6, oy + 1.2, 1.7, K.crimson), line([[bx + 8.6, oy + 3], [bx + 9.4 + swing * 0.2, oy + 12]], 0.8, K.crimson, 1), dot(bx + 9.6 + swing * 0.2, oy + 13, 1.2, K.gold));
      // The crossed collar: layered bands in a V.
      const nx = bx + 2;
      const ny = top - 1;
      out.push(poly([[nx - 9, ny + 2], [nx + 9, ny + 2], [nx + 7, oy - 4.6], [nx + 2, oy - 5]], K.robe));
      const bands = [[K.robe, 0], [K.crimson, 1.5], [K.gold, 2.7], [K.pink, 3.8]];
      for (const [c, d] of bands) out.push(line([[nx - 5 + d, ny + 1], [nx + 6.5, oy - 5]], 1.6, c), line([[nx + 9 - d * 0.4, ny + 2], [nx + 5, oy - 9]], 1.4, c));
      out.push(lpoly([[nx - 3, ny + 1], [nx + 5.8, ny + 1.6], [nx + 4.2, ny + 7]], K.skin));
    });
  }

  // ---- Head, hair, ears, and crown.
  const headPart = () => within(Th, () => {
    const earTw = hurt ? -0.55 : dead ? -0.8 : angry ? -0.2 : 0.05 * Math.sin(ph * 2 + 0.4) + (walk ? -0.12 : 0);
    const ear = (ex, ey, a0, sc) =>
      within(rot(ex, ey, a0 + earTw), () => {
        out.push(poly([[ex - 6 * sc, ey + 2], [ex - 4.6 * sc, ey - 9 * sc], [ex - 1 * sc, ey - 17 * sc], [ex + 2.4 * sc, ey - 9 * sc], [ex + 5 * sc, ey + 2]], K.hairDk));
        out.push(poly([[ex - 5 * sc, ey + 1.4], [ex - 3.8 * sc, ey - 8.6 * sc], [ex - 1 * sc, ey - 15.6 * sc], [ex + 1.6 * sc, ey - 8.6 * sc], [ex + 4 * sc, ey + 1.4]], K.hair));
        out.push(fpoly([[ex - 3 * sc, ey], [ex - 2 * sc, ey - 8 * sc], [ex - 0.9 * sc, ey - 12 * sc], [ex + 0.6 * sc, ey - 7.6 * sc], [ex + 2.4 * sc, ey]], K.earIn));
        out.push(fpoly([[ex - 1.6 * sc, ey - 13.4 * sc], [ex - 1 * sc, ey - 17 * sc], [ex + 0.2 * sc, ey - 13 * sc]], K.tailDk));
        for (let k = 0; k < 3; k++) out.push(line([[ex - 2 + k * 1.6, ey + 0.6], [ex - 1.6 + k * 1.3 + Math.sin(ph + k) * 0.4, ey - 4.6 - k]], 0.7, K.tip));
      });
    ear(hx - 7, hy - 9, -0.45, 0.92);
    out.push(...queenHead(hx, hy, mood, TAMAMO_FACE));
    // Hime-cut hair: the crown and straight-cut fringe, and the chin-length side locks.
    inHead(hx, hy, () => {
      out.push(...hairCap(R, TAMAMO_HAIR));
      out.push(...pair(flow([[-7.6, -3], [-8.6, 5], [-8.8, 12], [-8.8, 16.4]], lag, SIDE), flow([[-4.8, -3], [-5.1, 5], [-5, 11], [-4.8, 14.4]], lag, SIDE), 3.6, 3.4, R, { r0: 1, pk: 0.55, k: 2.4, end: 0.15, line: true, short: 3 }));
    });
    out.push(...queenTop(hx, hy, mood, TAMAMO_FACE));
    ear(hx + 4.5, hy - 11.5, 0.12, 1);
    // Kanzashi, reduced to two glyphs that still read at 1x: a gold tiara of three points around
    // one crimson jewel, and a crimson flower pin with a single gold chain swinging a beat behind.
    const cy0 = hy - 14.6;
    out.push(poly(arcPts(hx + 1, cy0 + 3, 11, 4, 200, 340, 8).concat(arcPts(hx + 1, cy0 + 4.8, 11, 4, 340, 200, 8)), K.goldDk));
    for (const [t, h] of [[-0.55, 5], [0, 8.4], [0.55, 5]]) {
      const ang = -PI / 2 + t * 0.9;
      const x = hx + 1 + Math.cos(ang) * 4;
      const y = cy0 + 0.8 + Math.sin(ang) * 2;
      out.push(poly([[x - 2.2, y + 1.6], [x + Math.cos(ang) * h, y + Math.sin(ang) * h], [x + 2.2, y + 1.6]], K.gold));
    }
    out.push(line(arcPts(hx + 1, cy0 + 3.4, 10.6, 3.6, 212, 328, 8), 0.8, K.goldLt));
    out.push(...gem(hx + 1, cy0 + 1.8, 2.2, K.crimson));
    const px = hx - 11;
    const py = hy - 7;
    {
      const sx = swing * 0.6 + (atk ? -lean * 0.3 : 0);
      const c0 = [px - 0.4, py + 2];
      const c1 = [c0[0] + sx * 0.5 - 0.4, c0[1] + 5.5];
      const c2 = [c0[0] + sx - 0.8, c0[1] + 11];
      out.push(line(spline([c0, c1, c2], 3), 0.7, K.goldDk), foval(c2[0], c2[1] + 1.2, 1.3, 1.8, K.gold, 0, 10));
    }
    out.push(...blossom(px, py, 3.6, K.crimson, K.gold, 0.3), dot(px - 0.5, py - 0.5, 0.5, '#ffffff'));
  });

  // ---- The near arm in its long hanging sleeve, and the fan.
  const nearArm = () => within(Tu, () => {
    const sh = [bx + 6, G - 80];
    const tgt = handAt.map((v, i) => v - (i ? bob + drop : lean));
    const { k: el, f: wr } = bend(sh, tgt, 14, 13, -1);
    const sw = swing;
    // Sleeve: fitted along the arm, then hanging in a long swallowtail drape.
    const hang = 19;
    const drape = [[el[0] + 2, el[1] - 3], [wr[0] + 1.2, wr[1] - 3], [wr[0] + 2, wr[1] + 2.6], [wr[0] - 2 + sw * 0.5, wr[1] + hang * 0.6], [wr[0] - 6 + sw, wr[1] + hang], [el[0] - 8 + sw, Math.max(el[1], wr[1]) + hang + 2], [el[0] - 7 + sw * 0.6, el[1] + hang * 0.5], [el[0] - 3.4, el[1] + 2]];
    out.push(taper([sh, el], 9, 8, K.robeDk, { n: 1 }), taper([[sh[0] + 0.5, sh[1] - 0.5], el], 7.6, 7, K.robe, { n: 1 }));
    out.push(poly(spline(drape, 2), K.robe), line(spline(drape.slice(3, 6), 2), 2, K.crimson), line(spline(drape.slice(3, 6), 2).map(([x, y]) => [x, y + 1.2]), 0.8, K.gold));
    out.push(line([drape[1], drape[2]], 1.6, K.crimson), line([[drape[1][0] + 0.8, drape[1][1]], [drape[2][0] + 0.8, drape[2][1]]], 0.7, K.pink));
    out.push(fpoly([[wr[0] - 4 + sw * 0.6, wr[1] + 10], [wr[0] - 6 + sw * 0.8, wr[1] + 16], [wr[0] - 9 + sw * 0.8, wr[1] + 14]], K.gold));
    // The fan: crimson leaves with a gold band and sakura, opening from the hand.
    const fa = (fanAng * PI) / 180;
    const span = 0.06 + fanOpen * 1.9;
    const hx2 = wr[0] + Math.cos(fa) * 1.4;
    const hy2 = wr[1] + Math.sin(fa) * 1.4;
    const R = 14;
    const outerA = arcPts(hx2, hy2, R, R, ((fa - span / 2) * 180) / PI, ((fa + span / 2) * 180) / PI, 10);
    const innerA = arcPts(hx2, hy2, R * 0.42, R * 0.42, ((fa + span / 2) * 180) / PI, ((fa - span / 2) * 180) / PI, 6);
    const midA = arcPts(hx2, hy2, R * 0.78, R * 0.78, ((fa + span / 2) * 180) / PI, ((fa - span / 2) * 180) / PI, 10);
    out.push(poly([...outerA, ...innerA], K.crimsonDk), poly([...outerA.map(([x, y]) => [hx2 + (x - hx2) * 0.96, hy2 + (y - hy2) * 0.96]), ...midA], K.crimson), poly([...midA.slice().reverse(), ...innerA], K.goldLt));
    for (let k = 0; k <= 10; k += 2) {
      const [x, y] = outerA[k];
      out.push(line([[hx2 + (x - hx2) * 0.42, hy2 + (y - hy2) * 0.42], [hx2 + (x - hx2) * 0.97, hy2 + (y - hy2) * 0.97]], 0.45, K.goldDk));
    }
    if (fanOpen > 0.5) {
      out.push(...blossom(lerp(hx2, outerA[3][0], 0.86), lerp(hy2, outerA[3][1], 0.86), 2.2, '#ffe1ea', K.gold, 0.3), ...blossom(lerp(hx2, outerA[7][0], 0.88), lerp(hy2, outerA[7][1], 0.88), 1.8, '#ffe1ea', K.gold, 0.9));
      out.push(line(outerA.map(([x, y]) => [hx2 + (x - hx2) * 1.02, hy2 + (y - hy2) * 1.02]), 0.8, K.gold));
    }
    out.push(taper([[hx2 - Math.cos(fa) * 2, hy2 - Math.sin(fa) * 2], [hx2 + Math.cos(fa - span / 2) * R, hy2 + Math.sin(fa - span / 2) * R]], 1.4, 1, K.wood, { n: 1 }));
    out.push(...hand(wr[0], wr[1], fa + 0.2, K.skin, K.skinDk));
    out.push(dot(hx2, hy2, 0.8, K.gold));
    // Fox-fire: gathering at the fan in the wind-up, bursting forward on the snap.
    if (burst > 0 && !dead) {
      const cx = Math.min(146, hx2 + Math.cos(fa) * (a === 0 ? 8 : 12 + burst * 4));
      const cy = hy2 + Math.sin(fa) * (a === 0 ? 8 : 12) - (a === 0 ? 4 : 0);
      const n = a === 0 ? 3 : 7;
      for (let k = 0; k < n; k++) {
        const t = (k / n) * TAU + a * 0.7;
        const r = a === 0 ? 5 : 4 + burst * 6;
        const x = cx + Math.cos(t) * r;
        const y = cy + Math.sin(t) * r * 0.8;
        const s = a === 0 ? 0.7 : 0.6 + burst * 0.5;
        out.push(foval(x, y, 3.2 * s, 3 * s, mix(FIRE_HOT[1], '#ffffff', 0.3)), ...flame(x, y + 2 * s, 9 * s, 2.6 * s, Math.cos(t) * 2, FIRE_HOT));
      }
      if (a >= 1 && a <= 2) out.push(sparkle(cx, cy, 6 + burst * 3, '#ffffff'), foval(cx, cy, 3.4, 3.4, FIRE_HOT[1]));
    }
  });

  headPart();
  nearArm();

  // Fox-fire wisps drifting around her when roused.
  if ((angry || happy) && !atk && !dead) {
    for (let k = 0; k < 3; k++) {
      const t = ph + (k / 3) * TAU;
      const x = bx + Math.cos(t) * 40;
      const y = G - 70 + Math.sin(t) * 10;
      out.push(foval(x, y, 2.6, 2.4, mix(fireC[1], '#ffffff', 0.3)), ...flame(x, y + 1.8, 7, 2, -1, fireC));
    }
  }
  // The dropped fan lies at her knees when she falls; the hand rests on the floor.
  return finish(out, W, H, dead);
}

// ---------- Sylvana, the Dryad Queen ----------

const S = {
  hair: '#bde27e', hairDk: '#86b45a', hairLt: '#d9f29a', hairHi: '#efffc4', hairSh: '#7fbf63', hairSh2: '#4b8a5c',
  skin: '#f7f2e8', skinDk: '#ddd2c2', mark: '#7f7068', vein: '#7dffb0', veinHot: '#e4ff6a', leaf: '#62c48e', leafDk: '#3f9a70', leafLt: '#a8ecc0',
  leaf2: '#4fb0a0', leaf2Dk: '#357f7a', moss: '#86b86a', mossDk: '#5f8f4f', wood: '#8b6a58', woodDk: '#634a40', woodLt: '#b48f74', bloom: '#ffc6dd',
  bloomDk: '#f08fb4', wis: '#c3a2ff', wisLt: '#e6d8ff', fly: '#fff6a6', flyGlow: '#efffc4', thorn: '#4f3a3a', lip: '#e8879f',
};

// Sylvana's willow hair: a fringe of six leaf-pointed clumps swept from the crown, two willow
// locks before the shoulder, and a long cascade of tapering locks behind.
const SYLVANA_HAIR = {
  cap: { cx: 0, cy: -1, rx: 14.6, ry: 15.2, a0: 160, a1: 358 },
  edge: [[13.6, 1.4, 't'], [11.6, -2.8, 'n'], [9.6, -0.7, 't'], [7.6, -3.4, 'n'], [5.3, -1.3, 't'], [3.3, -3.4, 'n'], [1, -0.5, 't'], [-1.1, -3, 'n'], [-3.4, -0.9, 't'], [-5.4, -2.6, 'n'], [-8.6, 5.4, 'p']],
  part: [1.5, -15.5],
  sepLen: [0.62, 0.8, 0.55, 0.76, 0.6],
  curl: 0.9,
  bulge: 0.34,
  rim: S.hairSh,
  crown: [[[-0.6, -15], [-6, -10.4], [-9, -2.4]], [[-2.6, -14.8], [-9.6, -9.8], [-12.8, -1.2]]],
  back: [215, [-10.8, -7.2], [-11.4, -3], [-10, 1], [-11, 4.8]],
  nape: [32, 2.4],
  ring: { cx: 0.5, cy: -1, rx: 12.4, ry: 10.2, a0: 200, a1: 334, w: 1.4 },
};
const SYLVANA_RAMP = { hi: S.hairHi, base: S.hair, sh1: S.hairSh, sh2: S.hairSh2 };

// Sylvana's face: matched round gentle eyes of deep rose (a blossom's colour, the strongest
// contrast against her green hair and pale birch skin) with leaf-shaped lashes, soft arched brows
// and a kind small smile on a soft chin; she gasps when hurt. A fine dark line where the bangs
// meet the skin keeps the pale green hair apart from the pale face.
const SYLVANA_FACE = {
  skin: S.skin, skinSh: '#e2dccb', skinSh2: '#b9c4ae', blush: '#ff9ab4', lip: S.lip, lipLine: '#b0546c',
  bangs: bangsOf(SYLVANA_HAIR.edge),
  bangLine: S.hairSh2,
  head: { chin: [7.6, 15.4], cheek: 14.4, jaw: -0.4 },
  eye: { nearX: 2.4, farX: 9.8, rx: 3.8, ry: 2.9, far: 0.82, iris: '#e2587a', irisDk: '#7a1e42', irisLt: '#ffd6c4', hot: '#ffc23a', hotDk: '#9a5a08', pupil: 'round', pupilC: '#3a0e26', tilt: 0.1, wing: 1, flicks: 1, lashLen: 1.2, leafLash: S.leafDk, crease: false, lower: '#9cc4a8', ink: '#16302a', sparkle: true },
  brow: { c: '#3f7a52', kind: 'soft', w: 0.7, lift: 0.3 },
  mouth: [8.2, 12.2],
  nose: [9.2, 9.6],
  blushK: 1.05,
  moods: { idle: { mouth: 'soft' }, angry: { mouth: 'shout' }, hurt: { mouth: 'gasp' } },
};

function sylvana(pose, f, mood) {
  const W = 140;
  const H = 150;
  const G = H - 0.6;
  const bx = 70;
  const tm = timing(pose, f);
  const { walk, atk, a, ph } = tm;
  const { angry, hurt, dead, happy } = moods(mood);
  // She flows rather than walks: the body rises and settles on a slow wave and sways side to
  // side while the roots under her gown ripple backward along the ground.
  let bob = walk ? -1.9 * Math.sin(ph) : 0.7 * Math.sin(ph);
  let lean = walk ? 1 + Math.sin(ph) * 1.1 : 0;
  let tilt = walk ? 0.035 * Math.sin(ph + 0.4) : 0.01 * Math.sin(ph);
  let headA = walk ? -0.035 * Math.sin(ph + 0.4) : 0.035 * Math.sin(ph - 0.8);
  let drop = 0;
  let swing = walk ? -1.8 + Math.sin(ph - 1.3) * 2.3 : Math.sin(ph - 1.2) * 1;
  let handAt = [bx + 20, G - 66 + bob];
  let backHand = [bx - 15, G - 54 + bob];
  let lash = 0;
  let coil = 0;
  if (atk) {
    lean = key([-3, 5, 6, 3, 1], a);
    tilt = key([-0.08, 0.07, 0.08, 0.04, 0.01], a);
    bob = key([-1.5, 0.5, 0.8, 0.2, 0], a);
    headA = key([-0.12, 0.06, 0.07, 0.03, 0], a);
    swing = key([2.6, -3.6, -2.4, 0.4, 0.4], a);
    handAt = key([[bx + 19, G - 108], [bx + 36, G - 82], [bx + 38, G - 72], [bx + 30, G - 70], [bx + 22, G - 66]], a);
    backHand = key([[bx - 22, G - 62], [bx - 18, G - 58], [bx - 18, G - 56], [bx - 16, G - 55], [bx - 15, G - 54]], a);
    lash = key([0, 0.75, 1, 0.55, 0.15], a);
    coil = key([1, 0.3, 0, 0, 0], a);
  }
  if (hurt) {
    lean -= 3;
    tilt -= 0.07;
    headA -= 0.15;
    handAt = [bx + 14, G - 76];
  }
  if (dead) {
    drop = 22;
    lean = 2;
    tilt = 0.14;
    headA = 0.36;
    swing = 0;
    handAt = [bx + 18, G - 18];
    backHand = [bx - 16, G - 20];
  }
  const glow = angry || atk ? S.veinHot : dead ? '#cfe6d6' : mix(S.vein, '#ffffff', 0.2 + 0.2 * Math.sin(ph));
  const top = G - 82;
  const hipY = G - 50;
  const Tu = chain(shift(lean, bob + drop), rot(bx, hipY, tilt));
  const hx = bx + 3;
  const hy = G - 100;
  const Th = chain(Tu, rot(hx, hy + 13, headA));
  const out = [];

  // Fireflies circling her; the far half of the orbit is drawn behind.
  const flies = (front) => {
    if (dead) return;
    for (let k = 0; k < 6; k++) {
      const t = ph + (k / 6) * TAU + (atk ? a * 0.5 : 0);
      if (Math.sin(t) > 0 !== front) continue;
      const r = atk ? 40 + lash * 12 : angry ? 44 : 38;
      const x = bx + Math.cos(t) * r;
      const y = G - 66 + Math.sin(t) * 12 + Math.sin(t * 3 + k) * 4 - k * 3;
      const s = front ? 1.15 : 0.8;
      out.push(sparkle(x, y, (2.2 + Math.sin(t * 2 + k) * 0.6) * s, S.flyGlow), dot(x, y, 0.8 * s, angry ? '#fff27a' : S.fly));
    }
  };
  flies(false);

  // Willow hair trails her flowing sway by a frame and hangs with gravity as she tilts.
  const lag = hairMotion(tm, { amp: walk ? 1.3 : 1, drag: walk ? -1.8 : 0, bob: (p) => (walk ? -1.3 : 0.7) * Math.sin(p), sway: walk ? (p) => Math.sin(p) * 0.6 : null, swing, still: dead, turn: tilt + headA });
  const R = SYLVANA_RAMP;
  const RB = backRamp(R);

  // ---- Willow hair cascading down her back: long locks in S-curves, split into points at the
  // ends, with a few leaves and blossoms caught in them.
  within(Th, () => inHead(hx, hy, () => {
    const wv = (k, y) => Math.sin(y * 0.11 + k * 2.1 - ph * (walk ? 1 : 0.5)) * 2.6;
    const locks = [
      [-12.4, -6, 54, 8, R.sh2, -1.8],
      [-10.6, -4, 52, 6.8, null, -2.2],
      [-15, 2, 42, 5.2, null, -0.6],
      [-7.6, -2, 47, 6.2, null, -1.2],
      [-4.4, 2, 36, 5, null, -2.4],
    ];
    locks.forEach(([x0, y0, len, w, dark, drift], k) => {
      const pts = [];
      for (let j = 0; j <= 4; j++) {
        const y = y0 + (len * j) / 4;
        pts.push([x0 + j * drift + wv(k, y) * Math.min(1, j / 2), y]);
      }
      const sp = flow(pts, lag, backLayer(k));
      if (dark) out.push(clump(sp, w, RB.sh2, { end: 0.25 }));
      else out.push(...lock(sp, w, RB, { hi: k === 1 ? [0.1, 0.28] : k === 3 ? [0.14, 0.3] : null }));
      if (k > 0) {
        const s2 = spline(sp, 3);
        const m = s2.length;
        for (const [u, side] of [[0.45, 1], [0.72, -1]]) {
          const [x, y] = s2[Math.round(u * (m - 1))];
          out.push(...leaf(x + side * w * 0.3, y, PI / 2 + side * 0.75, 4.4, 2.2, k % 2 ? S.hairLt : S.hair));
        }
        if (k % 2) out.push(...blossom(s2[Math.round(m * 0.6)][0], s2[Math.round(m * 0.6)][1], 1.6, k === 1 ? S.bloom : '#ffffff', '#fff6a0', k));
      }
    });
  }));

  // ---- Roots spreading from the hem along the ground; they ripple as she flows.
  const roots = [];
  for (let k = 0; k < 8; k++) {
    const side = k < 4 ? -1 : 1;
    const j = k < 4 ? k : k - 4;
    const ripple = walk ? Math.sin(ph - k * 0.9) : atk ? 0.4 * Math.sin(a + k) : Math.sin(ph - k * 0.7) * 0.4;
    const x0 = bx + side * (8 + j * 6) + lean * 0.4;
    const len = (10 + j * 5) * (1 + ripple * 0.18) * (dead ? 1.3 : 1) * (atk && side > 0 ? 1 + lash * 0.3 : 1);
    const rise = Math.max(0, ripple) * 2.2;
    roots.push({ pts: [[x0, G - 6], [x0 + side * len * 0.4, G - 2.5 - rise], [x0 + side * len * 0.8, G - 1 - rise * 0.5], [x0 + side * len, G - 0.6]], w: 4.8 - j * 0.5 });
  }
  for (const r of roots) {
    out.push(taper(r.pts, r.w + 1.2, 1, S.woodDk, { tip: true, n: 3 }), taper(r.pts, r.w, 0.6, S.wood, { n: 3 }));
    out.push(line(spline(r.pts, 2).slice(1, 4).map(([x, y]) => [x, y - r.w * 0.2]), 0.6, S.woodLt));
  }

  // ---- A long mantle of layered leaves falling from her shoulders into a train behind.
  within(Tu, () => {
    const sw = swing;
    const edge = [];
    for (let i = 0; i <= 9; i++) {
      const t = i / 9;
      edge.push([lerp(bx - 9, bx - 34 + sw * 1.4 - (walk ? 4 : 0), t) - Math.sin(t * PI) * 4, lerp(top + 1, G - drop - 1, t)]);
    }
    const hemPts = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      hemPts.push([lerp(edge[9][0], bx - 4 + sw * 0.4, t), G - drop - 1 - Math.sin(t * PI) * 2 + (i % 2 ? 2.4 : 0)]);
    }
    out.push(poly([...edge, ...hemPts, [bx - 2, top + 30], [bx - 4, top + 4]], S.leaf2Dk));
    for (let i = 1; i <= 9; i++) {
      const [x, y] = edge[i];
      out.push(...leaf(x + 2, y - 3, PI * 0.6 + sw * 0.02, 9, 5, i % 2 ? S.leaf2 : S.leaf, { rib: S.leafDk, flat: false }));
    }
    for (let i = 1; i < 6; i++) out.push(...leaf(hemPts[i][0], hemPts[i][1] - 6, PI / 2 + (i % 2 ? 0.3 : -0.3), 7, 4.4, i % 2 ? S.leaf : S.leaf2, { rib: S.leafDk }));
    out.push(line(spline([[bx - 8, top + 6], [bx - 18 + sw * 0.5, G - 50], [bx - 26 + sw, G - 18]], 3), 0.6, glow));
  });

  // ---- The far arm, resting on the gown.
  within(Tu, () => {
    const sh = [bx - 7, top + 2];
    const tgt = [backHand[0] - lean, backHand[1] - bob - drop];
    const { k: el, f: wr } = bend(sh, tgt, 14, 13, -1);
    out.push(taper([sh, el], 6.4, 5.2, S.skinDk, { n: 1 }), taper([el, wr], 5.2, 4, S.skinDk, { n: 1 }), oval(el[0], el[1], 2.6, 2.6, S.skinDk, 0, 12));
    out.push(...hand(wr[0], wr[1], Math.atan2(wr[1] - el[1], wr[0] - el[0]), S.skinDk, shade(S.skinDk, -8)));
  });

  // ---- The gown: three tiers of leaves, the lowest turning to moss and root.
  within(Tu, () => {
    const waist = top + 24;
    const tierAt = (y0, y1, w0, w1, c, cDk, scal, sw, seed) => {
      const ys = (y) => y;
      const yb = drop ? Math.min(y1, G - drop - 2) : y1;
      const n = scal;
      const left = [bx - w0, y0];
      const right = [bx + w0, y0];
      const pts = [left];
      const bl = [bx - w1 + sw - (dead ? 6 : 0), yb];
      const br = [bx + w1 + sw * 0.5 + (dead ? 6 : 0), yb];
      pts.push([lerp(left[0], bl[0], 0.55) - 1.5, lerp(y0, yb, 0.55)]);
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = lerp(bl[0], br[0], t);
        const tipY = yb + 4 + Math.sin(i * 1.7 + seed + ph * (walk ? 2 : 1)) * (walk ? 1.2 : 0.6);
        if (i > 0) pts.push([x - (br[0] - bl[0]) / n / 2, ys(yb - 0.5)]);
        pts.push([x, ys(tipY)]);
      }
      pts.push([lerp(right[0], br[0], 0.55) + 1.5, lerp(y0, yb, 0.55)], right);
      out.push(poly(pts.map(([x, y]) => [x, y + 0.9]), cDk), poly(pts, c));
      for (let i = 1; i < n; i += 2) {
        const x = lerp(bl[0], br[0], i / n);
        out.push(line([[x, yb + 2.6], [x + (bx - x) * 0.12, yb - (yb - y0) * 0.45]], 0.5, cDk));
      }
    };
    const sw = swing;
    tierAt(G - 26 - drop * 0.1, G - 6 - drop * 0.1, 19, 33, S.moss, S.mossDk, 9, sw * 0.9, 0);
    tierAt(G - 40, G - 22, 15, 26, S.leaf2, S.leaf2Dk, 7, sw * 0.6, 2);
    tierAt(waist - 2, G - 36, 9.5, 18, S.leaf, S.leafDk, 6, sw * 0.3, 4);
    // Blossoms tucked into the tiers.
    for (const [x, y, r] of [[bx - 14, G - 24, 2.2], [bx + 10, G - 30, 1.8], [bx + 19, G - 9, 2.2], [bx - 22, G - 8, 1.8], [bx + 2, G - 12, 1.6]]) out.push(...blossom(x + sw * 0.5, y, r, S.bloom, '#fff6a0', x * 0.1));
    // Bodice of overlapping leaf scales, with a moss sash at the waist.
    const bod = [[bx - 9, top + 2], [bx - 10.5, top + 12], [bx - 8, waist], [bx + 8.6, waist], [bx + 11.6, top + 10], [bx + 9.4, top + 2], [bx + 2, top - 1]];
    out.push(poly(bod.map(([x, y]) => [x + (x - bx) * 0.08, y + 0.6]), S.leafDk), poly(bod, S.leaf));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const x = bx - 6 + c * 4.6 + (r % 2) * 2.2;
        const y = top + 6 + r * 6;
        out.push(...leaf(x, y - 3, PI / 2 + 0.15, 6, 4, r % 2 ? S.leafLt : mix(S.leaf, S.leafLt, 0.4)));
      }
    }
    out.push(strip([[bx - 9, waist - 1], [bx, waist + 0.5], [bx + 9, waist - 1]], () => 3.4, S.mossDk, { n: 2 }), strip([[bx - 9, waist - 1.4], [bx, waist], [bx + 9, waist - 1.4]], () => 2.2, S.moss, { n: 2, flat: true }));
    out.push(...blossom(bx + 6, waist - 0.6, 2.6, S.bloom, '#fff6a0', 0.4), ...blossom(bx + 1.6, waist + 0.2, 1.8, '#ffffff', S.bloomDk, 1));
    // A neckline of moss and tiny flowers, and leafy capelets on the shoulders.
    out.push(lpoly([[bx - 3, top - 1], [bx + 7, top - 0.6], [bx + 5, top + 5], [bx + 1, top + 6]], S.skin));
    out.push(line(spline([[bx - 7, top + 1], [bx - 1, top + 6.4], [bx + 5, top + 6], [bx + 10, top + 1]], 3), 1.8, S.moss));
    for (const [x, y] of [[bx - 4, top + 4.4], [bx + 1, top + 6.4], [bx + 6, top + 5]]) out.push(dot(x, y, 0.9, S.bloom), dot(x, y, 0.35, '#ffffff'));
    for (const [x, y, a0] of [[bx - 9, top + 1, 2.3], [bx - 8, top + 3, 2.0], [bx - 10, top + 4, 2.6]]) out.push(...leaf(x, y, a0 + sw * 0.03, 10, 5, S.leaf2, { rib: S.leaf2Dk, flat: false }));
    // Glowing veins running down the gown like sap.
    out.push(line(spline([[bx + 2, waist + 2], [bx + 4 + sw * 0.2, G - 40], [bx + 2 + sw * 0.4, G - 24], [bx + 6 + sw * 0.6, G - 10]], 3), 0.7, glow));
  });

  // ---- Head: birch skin with glowing veins, willow hair, and the blossoming branch crown.
  within(Th, () => {
    out.push(...queenHead(hx, hy, mood, SYLVANA_FACE));
    // A glowing vein down the jaw, clear of the eyes.
    if (!dead) out.push(line(spline([[hx + 12.6, hy + 6.4], [hx + 12.2, hy + 9], [hx + 10.4, hy + 11.6], [hx + 10.8, hy + 13.4]], 3), 0.5, glow), dot(hx + 10.8, hy + 13.4, 0.55, glow));
    // The willow crown of hair, and two willow locks falling before the shoulder.
    inHead(hx, hy, () => {
      out.push(...hairCap(R, SYLVANA_HAIR));
      const pa = flow([[-8, -3], [-9, 8], [-10.6, 18], [-9.4, 27], [-10.6, 33]], lag, SIDE);
      const pb = flow([[-4.8, -3], [-5.4, 8], [-7, 16], [-6.2, 23], [-7, 27]], lag, SIDE);
      out.push(...pair(pa, pb, 3.8, 3.4, R, { r0: 1, pk: 0.35, k: 1.4, end: 0.12, line: true, hi: [0.1, 0.3], short: 4 }));
      for (const [sp, u, side] of [[pa, 0.55, -1], [pb, 0.8, 1], [pa, 0.85, 1]]) {
        const s2 = spline(sp, 3);
        const [x, y] = s2[Math.round(u * (s2.length - 1))];
        out.push(...leaf(x + side * 1.4, y, PI / 2 + side * 0.8, 4.4, 2.2, side > 0 ? S.hairLt : S.hair));
      }
    });
    out.push(...queenTop(hx, hy, mood, SYLVANA_FACE));
    // The crown: two branching antlers of living wood, blossoms at the forks, wisteria hanging.
    const brSw = Math.sin(ph - 0.5) * (walk ? 0.8 : 0.5);
    const branches = [
      { m: [[hx - 3, hy - 12], [hx - 8, hy - 21], [hx - 14, hy - 27], [hx - 21, hy - 30]], t: [[1, [hx - 6, hy - 33]], [2, [hx - 15, hy - 37]]] },
      { m: [[hx + 4, hy - 13], [hx + 9, hy - 22], [hx + 15, hy - 27], [hx + 22, hy - 29]], t: [[1, [hx + 8, hy - 32]], [2, [hx + 17, hy - 36]]] },
    ];
    for (const b of branches) {
      const up = (p) => [hx + (p[0] - hx) * 1.18, hy - 12 + (p[1] - hy + 12) * 1.25];
      b.m = b.m.map(up);
      b.t = b.t.map(([i, e]) => [i, up(e)]);
      out.push(taper(b.m, 3.6, 1.2, S.woodDk, { n: 3, tip: true }), taper(b.m.map(([x, y]) => [x + 0.3, y - 0.3]), 2.4, 0.6, S.wood, { n: 3 }));
      for (const [i, end] of b.t) out.push(taper([b.m[i], [lerp(b.m[i][0], end[0], 0.5) + 0.8, lerp(b.m[i][1], end[1], 0.5)], end], 2.6, 0.8, S.woodDk, { n: 2, tip: true }), line([b.m[i], end], 0.6, S.woodLt));
      out.push(...leaf(b.m[1][0], b.m[1][1], -2.4, 5, 2.6, S.leaf), ...leaf(b.m[2][0], b.m[2][1], -0.6, 5, 2.6, S.leaf2));
      out.push(...blossom(b.m[1][0], b.m[1][1] - 0.6, 2.3, S.bloom, '#fff6a0', 0.3), ...blossom(b.t[1][1][0], b.t[1][1][1] + 1, 1.7, '#ffffff', S.bloomDk, 0.9));
      // Wisteria hanging from the branch tip, swinging a beat behind.
      const [wx, wy] = b.m[3];
      for (let j = 0; j < 5; j++) {
        const t = j / 4;
        const x = wx + brSw * t * 2 + swing * t * 0.6;
        const y = wy + 2 + j * 3.2;
        out.push(foval(x - 0.6, y, 1.6 - t * 0.6, 1.3 - t * 0.3, j % 2 ? S.wisLt : S.wis, 0, 10), foval(x + 0.8, y + 1.2, 1.5 - t * 0.6, 1.2 - t * 0.3, j % 2 ? S.wis : S.wisLt, 0, 10));
      }
    }
    out.push(...blossom(hx + 9, hy - 10, 2.8, S.bloom, '#fff6a0', 0.1), ...blossom(hx + 12.4, hy - 7.2, 1.8, '#ffffff', S.bloomDk, 0.6));
  });

  // ---- The near arm: birch skin, a leaf bracelet, and a glowing seed above the open palm.
  // In the attack she lifts it and thorned vines whip out from the ground ahead.
  within(Tu, () => {
    const sh = [bx + 7, top + 2];
    const tgt = [handAt[0] - lean, handAt[1] - bob - drop];
    const { k: el, f: wr } = bend(sh, tgt, 14, 13, -1);
    out.push(taper([sh, el], 6.6, 5.4, S.skinDk, { n: 1 }), taper([[sh[0] + 0.3, sh[1] - 0.3], el], 5.2, 4.2, S.skin, { n: 1 }), oval(el[0], el[1], 2.6, 2.6, S.skin, 0, 12));
    out.push(taper([el, wr], 5.2, 4, S.skinDk, { n: 1 }), taper([[el[0] + 0.2, el[1] - 0.2], wr], 4, 3, S.skin, { n: 1 }));
    out.push(line([[lerp(sh[0], el[0], 0.3), lerp(sh[1], el[1], 0.3) - 0.5], [lerp(sh[0], el[0], 0.3) + 1.6, lerp(sh[1], el[1], 0.3) - 0.2]], 0.5, mix(S.mark, S.skin, 0.5)), line([[lerp(el[0], wr[0], 0.5) - 0.8, lerp(el[1], wr[1], 0.5) + 0.4], [lerp(el[0], wr[0], 0.5) + 0.8, lerp(el[1], wr[1], 0.5) + 0.6]], 0.5, mix(S.mark, S.skin, 0.5)));
    out.push(line([[lerp(el[0], wr[0], 0.1), lerp(el[1], wr[1], 0.1) + 1], [lerp(el[0], wr[0], 0.85), lerp(el[1], wr[1], 0.85) + 0.8]], 0.5, glow));
    const fa = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
    out.push(...leaf(lerp(el[0], wr[0], 0.8), lerp(el[1], wr[1], 0.8), fa + 2.4, 5, 2.6, S.leaf), ...leaf(lerp(el[0], wr[0], 0.8), lerp(el[1], wr[1], 0.8), fa - 2.4, 5, 2.6, S.leaf2));
    out.push(...hand(wr[0], wr[1], atk && a === 0 ? -1.4 : fa - 0.3, S.skin, S.skinDk, atk ? 1 : 0.6));
    if (!atk && !dead) {
      const gy = wr[1] - 7 + Math.sin(ph * 2) * 1;
      out.push(dot(wr[0] + 2, gy, 3.6, mix(glow, '#ffffff', 0.5)), dot(wr[0] + 2, gy, 2, glow), ...leaf(wr[0] + 2, gy - 1, -1.2, 3.4, 2, S.leaf), dot(wr[0] + 1.4, gy - 0.6, 0.6, '#ffffff'));
    }
    if (atk && a === 0) {
      // Green light gathering in the raised hand.
      out.push(dot(wr[0] + 1, wr[1] - 4, 5, mix(glow, '#ffffff', 0.55)), dot(wr[0] + 1, wr[1] - 4, 2.8, glow), sparkle(wr[0] + 1, wr[1] - 4, 6, '#ffffff'));
    }
  });

  // ---- Thorned vines. In the wind-up they coil out of the ground beside her; then they lash forward.
  if (atk && !dead) {
    const vine = (x0, y0, pts, w, n) => {
      const all = [[x0, y0], ...pts];
      out.push(taper(all, w + 1.4, 1.2, S.woodDk, { n: 3, tip: true }), taper(all, w, 0.7, S.leaf2Dk, { n: 3 }), line(spline(all, 3).slice(1, -2).map(([x, y]) => [x, y - w * 0.22]), 0.5, S.leafLt));
      const sp = spline(all, 3);
      for (let j = 2; j < sp.length - 1; j += 3) {
        const [x, y] = sp[j];
        const [px, py] = sp[j - 1];
        const ang = Math.atan2(y - py, x - px) + (j % 4 ? -1.6 : 1.6);
        const tw = w * (1 - j / sp.length) + 1.2;
        out.push(fpoly([[x - Math.cos(ang + 1.6) * 0.8, y - Math.sin(ang + 1.6) * 0.8], [x + Math.cos(ang) * tw, y + Math.sin(ang) * tw], [x + Math.cos(ang - 1.6) * 0.8, y + Math.sin(ang - 1.6) * 0.8]], S.thorn));
        if (j % 9 === 5) out.push(...leaf(x, y, ang + PI, 4, 2.2, S.leaf));
      }
      if (n) {
        const e = sp[sp.length - 1];
        out.push(...blossom(e[0], e[1], 2.2, S.bloomDk, '#fff6a0', 0.2));
      }
    };
    if (coil > 0.5) {
      for (const [x0, s, h] of [[bx + 24, 1, 7], [bx + 34, -1, 5.4], [bx + 44, 1, 4]]) {
        const pts = [];
        for (let k = 1; k <= 6; k++) pts.push([x0 + Math.sin(k * 1.3) * 4.4 * s, G - k * h]);
        vine(x0, G, pts, 4.4, true);
      }
    } else {
      const reach = 30 + lash * 32;
      for (const [y0, dy, s, x0] of [[G, -40, 1, bx + 20], [G - 1, -14, -1, bx + 26], [G, -26, 1, bx + 30]]) {
        const pts = [];
        for (let k = 1; k <= 5; k++) {
          const t = k / 5;
          pts.push([Math.min(W - 3, x0 + reach * t), y0 + dy * Math.sin(t * PI * 0.9) * (0.5 + lash * 0.5) + s * Math.sin(t * 7 + a) * 3 * (1 - lash * 0.5)]);
        }
        vine(x0, y0, pts, 4.6, lash > 0.6);
      }
      if (lash > 0.7) {
        for (let k = 0; k < 4; k++) out.push(...leaf(W - 14 + k * 2, G - 30 - k * 5, -0.4 + k * 0.5, 4, 2.4, k % 2 ? S.leaf : S.leafLt));
        out.push(sparkle(W - 10, G - 34, 5, '#ffffff'));
      }
    }
  }
  flies(true);
  return finish(out, W, H, dead);
}

// ---------- Lilith, the Succubus Queen ----------

const D = {
  skin: '#ffe5ea', skinDk: '#f0c3cf', hair: '#6c47ab', hairDk: '#4a3080', hairSh2: '#2c1d55', hairHi: '#b9a0ff', horn: '#7a5e8e', hornLt: '#b9a0d2',
  gold: '#ffcc66', goldDk: '#cf9440', goldLt: '#fff0b8', black: '#3d3150', blackDk: '#2a2139', blackLt: '#5d4c78', wine: '#b43b60', wineDk: '#842a49',
  wineLt: '#de6c90', wing: '#9b4a88', wingDk: '#6f3064', wingLt: '#c777b0', bone: '#4b2b50', gem: '#ff4f9c', pink: '#ff9fd0', violet: '#b884ff', lip: '#c8386a',
};

// Lilith's hair: long, wavy, and dark violet; the fringe sweeps from a part over the near brow
// toward the back in long pointed clumps, a wavy lock falls over the front shoulder, and the
// mass behind waves down her back and splits into three locks.
const LILITH_HAIR = {
  cap: { cx: 0, cy: -1, rx: 14.6, ry: 15.2, a0: 158, a1: 363 },
  edge: [[13.8, 3, 't'], [12, -1.8, 'n'], [8.8, -0.2, 't'], [7.2, -3.3, 'n'], [3.8, -0.8, 't'], [2.2, -3, 'n'], [-1.4, 0, 't'], [-3, -1.8, 'n'], [-6, 1.6, 't'], [-9, 7, 'p']],
  part: [10, -14.5],
  sepLen: [0.7, 0.82, 0.62, 0.78],
  curl: -1.3,
  bulge: 0.34,
  rim: '#3a2470',
  crown: [[[8, -15], [0, -12], [-7, -6], [-9.6, 1]], [[6, -15.4], [-3, -13.6], [-11, -7], [-13, 1]]],
  back: [222, [-9.6, -8.4], [-10.8, -4], [-10, 0.6], [-11.4, 5.6]],
  nape: [34, 2.6],
  ring: { cx: 0.5, cy: -0.4, rx: 12.8, ry: 8, a0: 205, a1: 335, w: 1.3 },
};
const LILITH_RAMP = { hi: D.hairHi, base: D.hair, sh1: D.hairDk, sh2: D.hairSh2 };

// Lilith's face: heavy smoky lids half lowered, heart pupils, a beauty mark, full dark lips in a
// smouldering smirk with a fang.
const LILITH_FACE = {
  skin: D.skin, skinSh: '#f2c0d1', skinSh2: '#d593b5', blush: '#ff9cbc', lip: '#c8306a', lipLine: '#8a1c46',
  bangs: bangsOf(LILITH_HAIR.edge),
  eye: { ry: 3, iris: '#ff3f9e', irisDk: '#7a0f4a', irisLt: '#ffc2e4', hot: '#ff2a5c', hotDk: '#8a0a2a', pupil: 'heart', pupilC: '#4a0a2c', tilt: 0.3, wing: 2, flicks: 3, lashLen: 1.6, shadow: '#c98ac6', smoky: 1, lowerLash: '#7a3a6a', ink: '#24112e' },
  brow: { c: '#2c1d55', kind: 'arch', w: 0.7 },
  mole: [-1.4, 9.4],
  fang: 'always',
  moods: { idle: { open: 0.62, mouth: 'smirk', gaze: [0.1, 0.03] }, angry: { open: 0.85, mouth: 'snarl' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } },
};

function lilith(pose, f, mood) {
  const W = 156;
  const H = 148;
  const G = H - 0.6;
  const bx = 78;
  const tm = timing(pose, f);
  const { walk, atk, a, ph } = tm;
  const { angry, hurt, dead, happy } = moods(mood);
  // A sultry runway stride: the feet cross toward the line, the hips roll with each step
  // (twice per cycle), the shoulders counter, and hair and tail swing against the hips.
  const step = Math.sin(ph * 2);
  let bob = walk ? -1.1 * Math.abs(Math.cos(ph)) + 0.5 : 0.5 * Math.sin(ph);
  let lean = walk ? 0.6 : 0;
  let tilt = walk ? 0.045 * step : 0.012 * Math.sin(ph);
  let headA = walk ? -0.03 * step : 0.04 * Math.sin(ph - 0.7) - 0.02;
  let drop = 0;
  let swing = walk ? -1.4 - 1.4 * Math.sin(ph * 2 - 1.1) : Math.sin(ph - 1.1) * 1;
  let wingA = walk ? -0.1 + 0.08 * Math.sin(ph * 2 - 0.6) : 0.1 * Math.sin(ph - 0.3);
  let curl = walk ? Math.sin(ph * 2 + 1.4) : Math.sin(ph - 0.4);
  let handAt = [bx + 14, G - 54];
  let hearts = 0;
  if (atk) {
    lean = key([-2, 4, 5, 3, 1], a);
    tilt = key([-0.06, 0.06, 0.07, 0.03, 0.01], a);
    bob = key([0.4, -0.6, -0.4, 0, 0], a);
    headA = key([0.08, -0.06, -0.04, 0, 0], a);
    swing = key([1.6, -3, -2.4, 0, 0.6], a);
    wingA = key([-0.45, 0.5, 0.42, 0.2, 0.06], a);
    curl = key([1, -1, -0.6, 0.2, 0.6], a);
    handAt = key([[bx + 14, G - 90], [bx + 38, G - 84], [bx + 40, G - 82], [bx + 32, G - 76], [bx + 20, G - 62]], a);
    hearts = key([0, 0.5, 1, 1.4, 1.8], a);
  }
  if (hurt) {
    lean -= 3;
    tilt -= 0.07;
    headA -= 0.16;
    wingA -= 0.25;
  }
  if (dead) {
    drop = 26;
    lean = 2;
    tilt = 0.12;
    headA = 0.38;
    swing = 0;
    wingA = -0.9;
    curl = -1;
    handAt = [bx + 16, G - 18];
  }
  if (angry && !atk) wingA += 0.18;
  const top = G - 82;
  const hipY = G - 48;
  const Tu = chain(shift(lean, bob + drop), rot(bx, hipY, tilt));
  const hx = bx + 3;
  const hy = G - 100;
  const Th = chain(Tu, rot(hx, hy + 13, headA));
  const out = [];

  // ---- Bat wings: an arm bone, a wrist, four fingers, and scalloped membrane between them.
  const wing = (root, base, k, far) => {
    const A = base + wingA * (far ? -0.8 : 1);
    const E = [root[0] + Math.cos(A) * 17 * k, root[1] + Math.sin(A) * 17 * k];
    const A2 = A + (far ? -0.5 : 0.5);
    const Wr = [E[0] + Math.cos(A2) * 14 * k, E[1] + Math.sin(A2) * 14 * k];
    const tips = [];
    const fan = far ? [0.5, 1.15, 1.75, 2.3] : [-0.5, -1.15, -1.75, -2.3];
    const lens = [30, 34, 30, 24];
    fan.forEach((d, i) => {
      const ang = A2 + d * (1 + wingA * 0.25);
      tips.push([Wr[0] + Math.cos(ang) * lens[i] * k, Wr[1] + Math.sin(ang) * lens[i] * k]);
    });
    const tail = Tu(bx - 6, G - 64);
    const mem = [root, E, Wr, tips[0]];
    for (let i = 1; i < 4; i++) {
      const p = tips[i - 1];
      const q = tips[i];
      const m = [lerp(lerp(p[0], q[0], 0.5), Wr[0], 0.32), lerp(lerp(p[1], q[1], 0.5), Wr[1], 0.32)];
      mem.push(...spline([p, m, q], 3).slice(1));
    }
    const last = tips[3];
    mem.push(...spline([last, [lerp(lerp(last[0], tail[0], 0.5), Wr[0], 0.25), lerp(lerp(last[1], tail[1], 0.5), Wr[1], 0.25)], tail], 3).slice(1));
    out.push(T(mem, far ? D.wingDk : D.wing));
    if (!far) {
      // Lit panels near the bones and dark veins.
      for (let i = 0; i < 3; i++) out.push(F(T([Wr, tips[i], [lerp(tips[i][0], tips[i + 1][0], 0.3), lerp(tips[i][1], tips[i + 1][1], 0.3)]], D.wingLt)));
    }
    const bone = far ? shade(D.bone, -4) : D.bone;
    out.push(taper([root, E], 3.4 * k, 2.6 * k, bone, { n: 1 }), taper([E, Wr], 2.6 * k, 2.2 * k, bone, { n: 1 }), dot(E[0], E[1], 1.7 * k, bone));
    tips.forEach((t) => out.push(taper([Wr, t], 1.8 * k, 0.5 * k, bone, { n: 1, tip: true })));
    out.push(fpoly([[Wr[0] - 1, Wr[1]], [Wr[0] + Math.cos(A2 + (far ? -1.6 : 1.6)) * 5, Wr[1] + Math.sin(A2 + (far ? -1.6 : 1.6)) * 5 - 2], [Wr[0] + 1, Wr[1] - 1]], D.goldLt));
  };
  if (!dead) wing(Tu(bx - 2, top + 6), -0.8, 0.95, true);
  wing(Tu(bx - 7, top + 8), dead ? -2.3 : -2.3, 1.12, false);

  // ---- The tail: slim, swinging against the hips, curling into a heart.
  {
    const r0 = Tu(bx - 9, G - 52);
    const c = curl;
    const pts = [r0, [r0[0] - 10 - swing, r0[1] + 10], [r0[0] - 22 - swing * 1.4, r0[1] + 20 + c * 2], [r0[0] - 34 - swing, r0[1] + 18 - c * 4], [r0[0] - 40 - swing * 0.6 + c * 2, r0[1] + 8 - c * 6], [r0[0] - 36 + c * 4, r0[1] - 2 - c * 4]];
    if (dead) pts.splice(2, 4, [r0[0] - 20, G - 3], [r0[0] - 34, G - 2], [r0[0] - 44, G - 4]);
    out.push(taper(pts, 3.4, 1.6, D.blackDk, { n: 3 }), taper(pts.map(([x, y]) => [x + 0.3, y - 0.3]), 2.2, 1, D.blackLt, { n: 3, flat: true }));
    const e = pts[pts.length - 1];
    const p = pts[pts.length - 2];
    const ang = Math.atan2(e[1] - p[1], e[0] - p[0]) - PI / 2;
    out.push(heart(e[0] + Math.cos(ang + PI / 2) * 3, e[1] + Math.sin(ang + PI / 2) * 3, 4.4, D.wineDk, ang + PI), heart(e[0] + Math.cos(ang + PI / 2) * 3, e[1] + Math.sin(ang + PI / 2) * 3, 3.2, D.gem, ang + PI));
  }

  // Hair swings against the hips a frame late and hangs with gravity as she tilts.
  const lag = hairMotion(tm, { amp: walk ? 1.3 : 1, fq: walk ? 2 : 1, p0: walk ? -1.1 : 0, drag: walk ? -1.4 : 0, bob: walk ? (p) => -1.1 * Math.abs(Math.cos(p)) : (p) => 0.5 * Math.sin(p), swing, still: dead, turn: tilt + headA });
  const R = LILITH_RAMP;
  // A wave running down the locks (S-curves that travel toward the tips).
  const wave = (y, k) => (dead ? 0.5 : 1) * Math.sin(y * 0.2 + k - ph * (walk ? 2 : 1)) * 1.7;
  const wavy = (x0, y0, len, dx, k, layer) => {
    const pts = [];
    for (let j = 0; j <= 5; j++) {
      const y = y0 + (len * j) / 5;
      pts.push([x0 + dx * (j / 5) + wave(y, k) * Math.min(1, j / 2), y]);
    }
    return flow(pts, lag, layer);
  };
  const RB = backRamp(R);

  // ---- Long wavy hair falling down her back, splitting into locks at the ends.
  within(Th, () => inHead(hx, hy, () => {
    out.push(clump(wavy(-12, -6, 62, -8, 0, backLayer(0)), 10, RB.sh2, { end: 0.3, r0: 0.9 }));
    out.push(...lock(wavy(-11, -4, 64, -5, 0.6, backLayer(1)), 7, RB, { hi: [0.08, 0.24] }));
    out.push(...lock(wavy(-7, -2, 56, -4, 1.4, backLayer(2)), 6.6, RB, { hi: [0.12, 0.26] }));
    out.push(...lock(wavy(-3.6, 2, 46, -3, 2.2, backLayer(3)), 5, RB));
  }));

  // ---- Legs in tall heeled boots, glimpsed through the slit as she strides.
  const legAt = (hip, phase, far) => {
    const h = Tu(...hip);
    let fx;
    let fy = G - 6;
    if (dead) {
      fx = h[0] + (far ? -10 : 14);
      fy = G - 3;
    } else if (walk) {
      const th = ph + phase;
      fx = h[0] + 9 * Math.cos(th) + (far ? 1.5 : -1);
      fy = G - 6 - 6 * Math.max(0, -Math.sin(th));
    } else if (atk) {
      fx = h[0] + (far ? -5 : key([2, 9, 10, 8, 5], a));
    } else {
      fx = h[0] + (far ? -3 : 4.5);
    }
    const { k, f: an } = bend(h, [fx, fy], 22, 21, 1);
    const c = far ? D.blackDk : D.black;
    const res = [];
    res.push(taper([h, k], 8, 6, c, { n: 1 }), oval(k[0], k[1], 3.2, 3.2, c, 0, 12), taper([k, an], 6, 3.6, c, { n: 1 }));
    const toe = [an[0] + 5, an[1] + 5.4];
    res.push(poly([[an[0] - 2, an[1] - 1], [an[0] + 2, an[1] - 1], [toe[0] + 1, toe[1]], [toe[0] - 2.6, toe[1] + 0.6], [an[0] - 1.6, an[1] + 2]], c));
    res.push(taper([[an[0] - 1.2, an[1] + 1.6], [an[0] - 1.8, an[1] + 5.8]], 1.4, 0.8, D.wineDk, { n: 1 }));
    if (!far) res.push(line([[k[0] - 1, k[1] - 6], [k[0] + 2.2, k[1] - 5.4]], 1.4, D.wine), line([[lerp(k[0], an[0], 0.2) + 1.6, lerp(k[1], an[1], 0.2)], [lerp(k[0], an[0], 0.8) + 1, lerp(k[1], an[1], 0.8)]], 0.6, D.blackLt));
    return res;
  };

  // ---- The gown: a long black skirt lined in wine with a slit at the front, a wine corset
  // laced in gold, and a high standing collar.
  const hem = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    hem.push([lerp(bx + 14 + (dead ? 8 : 0), bx - 26 - (dead ? 6 : 0) - (walk ? 2 : 0), t) + Math.sin(t * 7 + ph * (walk ? 2 : 1)) * 0.8, G - 0.4 - (i % 2 ? 1.2 : 0)]);
  }
  const train = [bx - 34 - (walk ? 3 : 0) - swing, G - 0.2];
  {
    const back = [Tu(bx - 8.6, G - 58), Tu(bx - 11, G - 48), ...(drop ? [] : [[bx - 16 + lean * 0.3, G - 28]])];
    out.push(T([Tu(bx + 4, G - 58), Tu(bx + 6, G - 40), ...hem, train, ...back.slice().reverse()], D.blackDk));
    out.push(T([Tu(bx + 2, G - 56), ...hem.slice(1, 8).map(([x, y]) => [x, y - 1]), Tu(bx - 8, G - 54)], D.black));
    for (const [x0, x1] of [[bx - 4, bx - 12], [bx - 8, bx - 22]]) {
      const t0 = Tu(x0, G - 50);
      out.push(strip([t0, [lerp(t0[0], x1, 0.5), lerp(t0[1], G, 0.5)], [x1 + swing * 0.5, G - 2]], (t) => 2.2 * Math.sin(PI * Math.min(1, t + 0.1)), D.blackLt, { n: 3, flat: true }));
    }
  }
  if (walk || atk) out.push(T([Tu(bx + 7, G - 36), [bx + 19, G - 1], [bx - 4, G - 1], Tu(bx - 2, G - 34)], D.wineDk));
  if (!dead) out.push(...legAt([bx - 2, hipY], PI, true), ...legAt([bx + 1, hipY], 0, false));
  {
    // The front panel covers the hips and falls to the floor; its wine-lined edge is the slit.
    const slitTop = Tu(bx + 8, G - 36);
    const hemFront = [bx + 17 + (walk ? -Math.cos(ph) * 3 : 0) + (dead ? 10 : 0), G - 0.6];
    const panel = [Tu(bx + 9.5, G - 58), Tu(bx + 11, G - 47), slitTop, [lerp(slitTop[0], hemFront[0], 0.5) - 1.5, lerp(slitTop[1], G, 0.5)], hemFront, hem[3], [bx + 2, G - 20], Tu(bx + 1, G - 50), Tu(bx + 2, G - 58)];
    if (walk || atk) {
      // In stride, the near leg passes in front of the panel's lower half.
      out.push(T(panel.slice(0, 3).concat([Tu(bx + 4, G - 30), Tu(bx + 1, G - 50), Tu(bx + 2, G - 58)]), D.black));
    } else {
      out.push(T(panel, D.black));
      out.push(strip(spline([slitTop, panel[3], hemFront], 3), (t) => 1.4 + t, D.wine, { n: 1, flat: true }));
    }
    out.push(strip([Tu(bx + 9.5, G - 58), Tu(bx + 11, G - 47), slitTop], () => 1.6, D.wine, { n: 2, flat: true }));
    out.push(strip(hem.slice(0, 10).map(([x, y]) => [x, y - 0.8]), () => 1.4, D.gold, { n: 1, flat: true }));
  }

  // ---- Torso: corset, sleeves, collar.
  within(Tu, () => {
    const waist = G - 58;
    out.push(poly([[bx - 8.4, top + 2], [bx - 10, top + 12], [bx - 8, waist + 2], [bx + 9.4, waist + 2], [bx + 11.6, top + 11], [bx + 9.6, top + 2], [bx + 2, top - 2]], D.black));
    // The corset: wine panels with gold boning and lacing, dipping to a point.
    out.push(poly([[bx - 8.6, top + 13], [bx + 11.4, top + 12], [bx + 10, waist + 1], [bx + 3, waist + 5], [bx - 8, waist + 1]], D.wineDk), poly([[bx - 7.8, top + 13.6], [bx + 10.6, top + 12.6], [bx + 9.2, waist + 0.4], [bx + 3, waist + 4], [bx - 7.4, waist + 0.4]], D.wine));
    for (const x of [bx - 4, bx + 0.6, bx + 6]) out.push(line([[x, top + 14], [x + (x - bx) * 0.05, waist + 1.5]], 0.6, D.goldDk));
    for (let k = 0; k < 4; k++) out.push(line([[bx + 1.8, top + 15 + k * 2.4], [bx + 4.2, top + 16.4 + k * 2.4]], 0.5, D.goldLt), line([[bx + 4.2, top + 15 + k * 2.4], [bx + 1.8, top + 16.4 + k * 2.4]], 0.5, D.goldLt));
    out.push(line([[bx - 8.6, top + 12.8], [bx + 11.6, top + 11.8]], 1, D.gold), line([[bx - 8, waist + 0.8], [bx + 3, waist + 4.6], [bx + 10, waist + 0.6]], 1, D.gold));
    // A gold heart brooch at the throat on a black lace neckline.
    out.push(line([[bx - 4, top + 1], [bx + 2, top + 4], [bx + 8, top + 1]], 0.7, D.blackLt), ...gem(bx + 3, top + 2.4, 1.8, D.gem));
    // The high standing collar fanning up behind the head: black outside, wine within.
    const cl = [[bx - 9, top + 2], [bx - 15, top - 12], [bx - 11, top - 16], [bx - 5, top - 13], [bx - 1, top - 4]];
    out.push(poly(cl, D.blackDk), poly([[bx - 9, top + 1], [bx - 13.6, top - 11], [bx - 10.6, top - 14], [bx - 6, top - 11.6], [bx - 2, top - 3]], D.wine), line([[bx - 15, top - 12], [bx - 11, top - 16], [bx - 5, top - 13]], 0.8, D.gold));
    for (const [x, y] of [[bx - 13, top - 9], [bx - 10, top - 12], [bx - 7, top - 9]]) out.push(line([[bx - 6, top - 1], [x, y]], 0.4, D.wineDk));
    // Puffed shoulder caps.
    out.push(...ball(bx - 7, top + 4, 5.4, 4.4, D.black, { dark: D.blackDk, light: D.blackLt }));
  });

  // ---- The far arm holds the heart scepter upright.
  within(Tu, () => {
    const sh = [bx - 7, top + 3];
    const hand0 = dead ? [bx - 16, G - 20 - drop] : [bx - 19, G - 62 + (atk ? key([-6, 2, 2, 1, 0], a) : 0)];
    const { k: el, f: wr } = bend(sh, hand0, 13, 12, -1);
    out.push(taper([sh, el], 6, 5, D.blackDk, { n: 1 }), taper([el, wr], 5, 4.6, D.blackDk, { n: 1 }), poly([[wr[0] - 3, wr[1] - 3], [wr[0] + 3, wr[1] - 3], [wr[0] + 4, wr[1] + 2], [wr[0] - 4, wr[1] + 2]], D.wineDk));
    if (!dead) {
      const sx = wr[0];
      const st = wr[1] - 24;
      out.push(taper([[sx + 0.5, G - 4 - drop], [sx, st]], 2.6, 2.2, D.goldDk, { n: 1 }), line([[sx + 0.6, G - 6], [sx + 0.2, st + 2]], 0.6, D.goldLt));
      out.push(...hand(wr[0], wr[1], -PI / 2, D.skinDk, shade(D.skinDk, -8)));
      // The heart gem with gold wings on top.
      const gy = st - 5;
      for (const s of [-1, 1]) out.push(poly([[sx, gy + 1], [sx + s * 5, gy - 4], [sx + s * 9, gy - 3], [sx + s * 7, gy], [sx + s * 8, gy + 2], [sx + s * 3, gy + 3]], D.goldDk), fpoly([[sx + s * 1.4, gy], [sx + s * 5, gy - 3], [sx + s * 8, gy - 2.4], [sx + s * 3, gy + 1.4]], D.gold));
      out.push(heart(sx, gy + 0.6, 5, D.wineDk), heart(sx, gy + 0.2, 4, angry || atk ? '#ff3f8a' : D.gem), heart(sx - 0.6, gy - 0.6, 1.8, '#ffc2df'), dot(sx - 1.6, gy - 1.6, 0.7, '#ffffff'));
      out.push(oval(sx, st + 1, 2.4, 1.4, D.gold, 0, 10));
    } else {
      // Dropped beside her.
      out.push(taper([[bx - 30, G - 2 - drop], [bx + 4, G - 1.4 - drop]], 2.4, 2.4, D.goldDk, { n: 1 }), heart(bx + 8, G - 3.6 - drop, 3.6, D.gem, PI / 2));
    }
  });

  // ---- Head: dark violet hair, curling horns, a jewelled tiara.
  within(Th, () => {
    // Ram horns: from the crown they sweep up and back, then curl down and forward.
    const hornPts = (far) => (far
      ? [[hx - 5, hy - 10], [hx - 8, hy - 18], [hx - 14, hy - 22.5], [hx - 20, hy - 21], [hx - 22, hy - 15.5], [hx - 18.6, hy - 12.4]]
      : [[hx + 4, hy - 11.5], [hx + 3, hy - 20], [hx - 2, hy - 26], [hx - 9, hy - 27], [hx - 13.6, hy - 23], [hx - 12.4, hy - 18], [hx - 8.6, hy - 17.6]]);
    const horn = (far, c) => {
      const hp = hornPts(far);
      const sp = spline(hp, 3);
      out.push(strip(hp, (t) => lerp(far ? 5.4 : 6.6, 1.2, t ** 0.9), shade(c, -14), { n: 3, tip: 1.6 }), strip(hp, (t) => lerp(far ? 4 : 5, 0.8, t ** 0.9), c, { n: 3, flat: true }));
      out.push(line(sp.slice(1, sp.length - 4).map(([x, y]) => [x + 0.9, y - 0.9]), 0.8, D.hornLt));
      for (let i = 2; i < sp.length - 3; i += 3) {
        const [x, y] = sp[i];
        const [px, py] = sp[i - 1];
        const an = Math.atan2(y - py, x - px) + PI / 2;
        const w = lerp(far ? 2.6 : 3.2, 0.8, i / sp.length);
        out.push(line([[x - Math.cos(an) * w, y - Math.sin(an) * w], [x + Math.cos(an) * w, y + Math.sin(an) * w]], 0.5, shade(c, -18)));
      }
      const [gx, gy] = sp[2];
      out.push(line([[gx - 3, gy + 0.8], [gx + 3, gy - 0.4]], 1.6, D.gold), dot(gx, gy + 0.2, 0.7, D.gem));
    };
    horn(true, shade(D.horn, -6));
    out.push(...queenHead(hx, hy, mood, LILITH_FACE));
    // Hair: the crown and side-swept fringe.
    inHead(hx, hy, () => out.push(...hairCap(R, LILITH_HAIR)));
    out.push(...queenTop(hx, hy, mood, LILITH_FACE));
    horn(false, D.horn);
    // Tiara: a gold band with a heart ruby and small points.
    out.push(line(arcPts(hx + 1, hy - 7, 11.5, 6.6, 205, 330, 8), 1.6, D.goldDk), line(arcPts(hx + 1, hy - 7.4, 11.5, 6.6, 210, 325, 8), 0.8, D.gold));
    for (const t of [235, 260, 295, 315]) {
      const x = hx + 1 + Math.cos((t * PI) / 180) * 11.5;
      const y = hy - 7 + Math.sin((t * PI) / 180) * 6.6;
      out.push(fpoly([[x - 1, y], [x, y - 2.4], [x + 1, y]], D.gold));
    }
    const tx = hx + 1 + Math.cos((278 * PI) / 180) * 11.5;
    const ty = hy - 7 + Math.sin((278 * PI) / 180) * 6.6;
    out.push(heart(tx, ty - 0.6, 3, D.goldDk), heart(tx, ty - 0.8, 2.2, D.gem), dot(tx - 0.6, ty - 1.4, 0.45, '#ffffff'));
    // The wavy lock over the front shoulder.
    inHead(hx, hy, () => out.push(...pair(wavy(-8.2, -3, 40, -1.2, 3, SIDE), wavy(-5, -3, 30, -0.6, 3.6, SIDE), 4.6, 3.6, R, { r0: 1, pk: 0.3, k: 1.3, end: 0.1, line: true, hi: [0.08, 0.26], short: 5 })));
  });

  // ---- The near arm: a hand on the hip, or blowing a kiss in the attack.
  within(Tu, () => {
    const sh = [bx + 6.5, top + 3];
    const tgt = [handAt[0] - lean, handAt[1] - bob - drop];
    const { k: el, f: wr } = bend(sh, tgt, 13.5, 12.5, atk ? -1 : 1);
    out.push(...ball(sh[0], sh[1] + 1, 5.2, 4.4, D.black, { dark: D.blackDk, light: D.blackLt }));
    out.push(taper([sh, el], 5.6, 4.6, D.blackDk, { n: 1 }), taper([[sh[0] + 0.3, sh[1] - 0.3], el], 4.4, 3.6, D.black, { n: 1 }), oval(el[0], el[1], 2.4, 2.4, D.black, 0, 12));
    out.push(taper([el, wr], 4.6, 3.6, D.blackDk, { n: 1 }), taper([[el[0] + 0.2, el[1] - 0.2], wr], 3.6, 2.8, D.black, { n: 1 }));
    // A flared wine cuff.
    const ang = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
    const cx = lerp(el[0], wr[0], 0.82);
    const cy = lerp(el[1], wr[1], 0.82);
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    out.push(poly([[cx - nx * 2, cy - ny * 2], [cx + nx * 2, cy + ny * 2], [wr[0] + nx * 4.4, wr[1] + ny * 4.4], [wr[0] - nx * 4.4, wr[1] - ny * 4.4]], D.wine), line([[wr[0] + nx * 4.4, wr[1] + ny * 4.4], [wr[0] - nx * 4.4, wr[1] - ny * 4.4]], 0.8, D.gold));
    const fa = atk && a === 0 ? -2.4 : atk ? -0.25 : ang + 0.9;
    out.push(...hand(wr[0] + Math.cos(ang) * 1.5, wr[1] + Math.sin(ang) * 1.5, fa, D.skin, D.skinDk, atk && a > 0 ? 1 : 0));
    if (atk && a === 0) out.push(heart(wr[0] + 3, wr[1] - 5, 2.2, D.pink), sparkle(wr[0] + 6, wr[1] - 7, 2.2, '#ffffff'));
  });

  // ---- The kiss: a stream of hearts bursting from her palm, then drifting.
  if (hearts > 0 && !dead) {
    const ox = handAt[0] + 6;
    const oy = handAt[1] - 2;
    for (let k = 0; k < 8; k++) {
      const t = clamp(hearts - (k % 3) * 0.15, 0, 2);
      if (t <= 0) continue;
      const ang = -1.25 + (k / 7) * 1.55 + Math.sin(t * 3 + k) * 0.08;
      const d = 6 + t * 16 * (0.75 + (k % 3) * 0.2);
      const x = Math.min(W - 6, ox + Math.cos(ang) * d);
      const y = oy + Math.sin(ang) * d - t * 5;
      const r = (k % 2 ? 4.4 : 6) * (t > 1.4 ? 1.6 - (t - 1.4) : Math.min(1.2, 0.6 + t * 0.6));
      const c = k % 3 === 0 ? D.violet : k % 3 === 1 ? D.gem : D.pink;
      out.push(heart(x, y, r + 1, '#ffffff', Math.sin(k + t) * 0.3), heart(x, y, r, c, Math.sin(k + t) * 0.3), dot(x - r * 0.35, y - r * 0.3, Math.max(0.4, r * 0.18), '#ffffff'));
    }
    if (a === 1 || a === 2) out.push(sparkle(ox + 4, oy - 2, 8, '#ffffff'), heart(ox + 4, oy - 2, 3, '#ffd6ec'));
  }
  // A few hearts float about her when she is pleased or roused.
  if ((happy || angry) && !atk && !dead) {
    for (let k = 0; k < 3; k++) {
      const t = (ph / TAU + k / 3) % 1;
      const x = bx + (k === 1 ? -36 : 30 + k * 4) + Math.sin(t * TAU + k) * 3;
      const y = G - 60 - t * 30 - k * 6;
      out.push(heart(x, y, 2.4 + (1 - t), '#ffffff'), heart(x, y, 1.8 + (1 - t), angry ? D.gem : D.pink));
    }
  }
  return finish(out, W, H, dead);
}

// ---------- Selene, the Moon Valkyrie ----------

const M = {
  skin: '#fff0e8', skinDk: '#efcec9', hair: '#eceaff', hairDk: '#c6c1ee', hairSh2: '#8f8ad0', hairLt: '#ffffff', silver: '#e3e6f6', silverDk: '#a4a8d0', silverLt: '#ffffff',
  steel: '#8a8ec0', lav: '#c5b0ff', lavDk: '#9580df', lavLt: '#e6dcff', gold: '#ffe08a', goldDk: '#d4a748', cape: '#40439a', capeDk: '#2b2d70',
  capeIn: '#5c62c8', star: '#fffbe0', halo: '#fff4c2', haloDk: '#efd27e', moon: '#fff8d8', glow: '#bfe9ff', lip: '#e07a92',
};

// A crescent around (cx, cy), radius r, thickest (w) in the middle, opening toward `dir`.
function crescentPts(cx, cy, r, w, dir) {
  const pts = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = dir + PI * 0.3 + (i / n) * PI * 1.4;
    pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]);
  }
  for (let i = n - 1; i >= 1; i--) {
    const u = i / n;
    const t = dir + PI * 0.3 + u * PI * 1.4;
    const rr = r - w * Math.sin(u * PI);
    pts.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]);
  }
  return pts;
}

// Selene's platinum hair under the helm: a fringe parted over the far brow into six clumps, a
// side lock before the ear, and a long braid behind. The ring of light sits just below the brim.
const SELENE_HAIR = {
  cap: { cx: 0, cy: -1, rx: 14.6, ry: 15, a0: 160, a1: 358 },
  edge: [[13.8, 2, 't'], [11.9, -3, 'n'], [9.6, 0, 't'], [7.4, -3.3, 'n'], [5.1, -0.8, 't'], [2.8, -4.8, 'n'], [0.5, -0.4, 't'], [-1.8, -3.2, 'n'], [-4.2, 0.2, 't'], [-6, -2.4, 'n'], [-8.6, 6, 'p']],
  part: [3, -15],
  sepLen: [0.24, 0.3, 0.36, 0.26, 0.22],
  curl: 0.9,
  split: true,
  bulge: 0.3,
  crown: [[[-1, -9], [-8, -5.4], [-11.4, 1.6]]],
  back: [218, [-10.6, -6], [-11.2, -2], [-10, 2], [-11, 5.2]],
  nape: [30, 2.4],
  tipShade: 1.2,
  ring: { cx: 0.5, cy: -0.8, rx: 13, ry: 5.4, a0: 212, a1: 332, w: 1.2, tooth: 1.5, gaps: [242, 281] },
};
const SELENE_RAMP = { hi: M.hairLt, base: M.hair, sh1: M.hairDk, sh2: M.hairSh2 };

// Selene's face: clear, steady eyes with clean strong lashes and straight brows, a calm resolve;
// she grits her teeth when struck.
const SELENE_FACE = {
  skin: M.skin, skinSh: '#ecd1d6', skinSh2: '#c7b0c9', blush: '#ffb0c0', blushK: 0.8, lip: M.lip, lipLine: '#b0566a',
  bangs: bangsOf(SELENE_HAIR.edge),
  eye: { ry: 2.9, iris: '#8e9be6', irisDk: '#3d3f8f', irisLt: '#d8e6ff', hot: '#7fd8ff', hotDk: '#2a6a9a', pupil: 'round', pupilC: '#23245a', tilt: 0, wing: 1.3, flicks: 2, lashLen: 1.2, ink: '#2c2d5a', sparkle: true },
  brow: { c: '#8f8ad0', kind: 'straight', w: 0.8, lift: -0.3 },
  moods: { idle: { open: 0.94, mouth: 'calm' }, angry: { mouth: 'grit', brow: { inner: 1.4, outer: 0.2, arch: -0.8, w: 1.4 } }, hurt: { mouth: 'grimace' } },
};

function selene(pose, f, mood) {
  const W = 164;
  const H = 150;
  const G = H - 0.6;
  const bx = 76;
  const tm = timing(pose, f);
  const { walk, atk, a, ph } = tm;
  const { angry, hurt, dead, happy } = moods(mood);
  // A heroic armoured march: high knees, a firm footfall that drops the body on each step,
  // a counter-swing of the shield arm, and the cape billowing behind.
  const fall = walk ? Math.abs(Math.sin(ph)) : 0;
  let bob = walk ? -2 + fall * 2.4 : 0.5 * Math.sin(ph);
  let lean = walk ? 1.4 : 0;
  let tilt = walk ? 0.02 + 0.015 * Math.sin(ph * 2) : 0;
  let headA = walk ? -0.03 : 0.025 * Math.sin(ph - 0.7);
  let drop = 0;
  let swing = walk ? -2.6 + Math.sin(ph * 2 - 1.2) * 1.4 : Math.sin(ph - 1.1) * 2;
  let spearHand = walk ? [bx + 16, G - 70 + bob] : [bx + 18, G - 64 + bob];
  let spearA = walk ? -1.15 : -1.52;
  let shieldHand = walk ? [bx - 16 + Math.sin(ph) * 3, G - 60 + bob] : [bx - 17, G - 60 + bob];
  let flash = 0;
  let stance = 0;
  if (atk) {
    lean = key([-5, 6, 7, 4, 1], a);
    tilt = key([-0.08, 0.08, 0.1, 0.05, 0.01], a);
    bob = key([1.5, 0.5, 1, 0.5, 0], a);
    headA = key([0.06, 0.04, 0.05, 0.02, 0], a);
    swing = key([3.6, -4.4, -3.6, -1, 0.4], a);
    spearHand = key([[bx - 2, G - 80], [bx + 34, G - 76], [bx + 38, G - 74], [bx + 30, G - 72], [bx + 22, G - 66]], a);
    spearA = key([-0.12, 0.02, 0.04, -0.2, -0.9], a);
    shieldHand = key([[bx - 10, G - 66], [bx - 22, G - 62], [bx - 24, G - 61], [bx - 20, G - 60], [bx - 18, G - 60]], a);
    flash = key([0.4, 1, 1.25, 0.5, 0], a);
    stance = key([1, 1, 1, 0.7, 0.3], a);
  }
  if (hurt) {
    lean -= 3;
    tilt -= 0.07;
    headA -= 0.14;
  }
  if (dead) {
    drop = 20;
    lean = 3;
    tilt = 0.18;
    headA = 0.4;
    swing = 0;
    shieldHand = [bx - 18, G - 14];
  }
  const top = G - 82;
  const hipY = G - 48;
  const Tu = chain(shift(lean, bob + drop), rot(bx, hipY, tilt));
  const hx = bx + 3;
  const hy = G - 100;
  const Th = chain(Tu, rot(hx, hy + 13, headA));
  const out = [];
  const moonGlow = angry || atk ? M.glow : M.halo;

  // ---- The crescent halo behind her head, with a soft glow and (when roused) rays.
  if (!dead) {
    const [cx, cy] = Th(hx - 3, hy - 4);
    const pulse = 1 + 0.03 * Math.sin(ph);
    if (angry || atk) {
      for (let k = 0; k < 8; k++) {
        const t = (k / 8) * TAU + ph * 0.25;
        out.push(F(T([[cx + Math.cos(t - 0.06) * 18, cy + Math.sin(t - 0.06) * 18], [cx + Math.cos(t) * (25 + (k % 2) * 3), cy + Math.sin(t) * (25 + (k % 2) * 3)], [cx + Math.cos(t + 0.06) * 18, cy + Math.sin(t + 0.06) * 18]], mix(M.glow, '#ffffff', 0.4))));
      }
    }
    out.push(F(T(crescentPts(cx, cy, 22 * pulse, 6.4, -0.2), mix(moonGlow, '#ffffff', 0.45))), F(T(crescentPts(cx, cy, 21 * pulse, 5.2, -0.2), moonGlow)), F(T(crescentPts(cx, cy, 20 * pulse, 2.2, -0.2), '#ffffff')));
    for (const k of [0.15, 0.5, 0.85]) {
      const t = -0.2 + PI * 0.3 + k * PI * 1.4;
      out.push(star(cx + Math.cos(t) * 25, cy + Math.sin(t) * 25, 1.8, M.star));
    }
  }

  // ---- The cape: indigo outside, a starry lining that shows as it billows.
  within(Tu, () => {
    const sw = swing;
    const edge = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      edge.push([bx - 8 - t * 28 + sw * t * 1.8 - Math.sin(t * PI) * 5 + Math.sin(t * 4 + ph * (walk ? 2 : 1)) * t * 1.6, top + t * (G - drop - top - 3)]);
    }
    const hemC = [];
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      hemC.push([lerp(edge[8][0], bx - 2 + sw * 0.4, t), G - drop - 3 + Math.sin(t * PI * 2 + ph * 2) * 1.2]);
    }
    out.push(poly([[bx + 2, top - 1], ...edge, ...hemC, [bx - 2, top + 30]], M.capeDk));
    out.push(poly([[bx, top], ...edge.slice(0, 8).map(([x, y]) => [x + 2.4, y]), [lerp(edge[8][0], hemC[3][0], 0.3), G - drop - 6], [bx - 4, top + 30]], M.cape));
    // The lining turned out along the trailing edge, scattered with stars.
    const lin = edge.slice(3).map(([x, y], i) => [x - 0.4, y + i * 0.3]);
    out.push(strip(lin, (t) => 2 + t * 4.5, M.capeIn, { n: 2 }));
    for (let i = 1; i < lin.length; i++) out.push(star(lin[i][0] + 0.8, lin[i][1] - 1, 1.1 + (i % 2) * 0.5, M.star));
    for (const [x, y] of [[bx - 14, G - 60], [bx - 20, G - 40], [bx - 10, G - 30], [bx - 24, G - 20]]) out.push(dot(x + sw * 0.5, y, 0.5, M.lavLt));
  });

  // ---- Long platinum braid swinging behind, a frame behind each footfall.
  const lag = hairMotion(tm, { amp: walk ? 1.4 : 1.2, fq: walk ? 2 : 1, p0: walk ? -1.2 : 0, drag: walk ? -2.4 : 0, bob: walk ? (p) => 2.4 * Math.abs(Math.sin(p)) : (p) => 0.5 * Math.sin(p), swing, still: dead, turn: tilt + headA });
  const R = SELENE_RAMP;
  const RB = backRamp(R);
  within(Th, () => inHead(hx, hy, () => {
    const R = RB;
    const sp = spline(flow([[-10, 2], [-14, 14], [-16, 28], [-15.6, 42], [-14.6, 52]], lag, backLayer(1)), 3);
    out.push(clump(sp, 6.4, R.sh2, { r0: 0.9, pk: 0.1, end: 0.55, tip: 0.4 }));
    // Interlaced strands: each lobe a pointed clump crossing the braid on a slant, alternating
    // sides, shaded where it tucks under the next and lit on its upper front.
    for (let i = 0; i < sp.length - 1; i++) {
      const [x, y] = sp[i];
      const [x2, y2] = sp[i + 1];
      const len = Math.hypot(x2 - x, y2 - y) || 1;
      const d = [(x2 - x) / len, (y2 - y) / len];
      const nrm = [-d[1], d[0]];
      const r = 3.4 - (i / sp.length) * 1.3;
      const s = i % 2 ? 1 : -1;
      const a = [x + nrm[0] * r * s - d[0] * 1.6, y + nrm[1] * r * s - d[1] * 1.6];
      const m = [x + d[0] * len * 0.35, y + d[1] * len * 0.35];
      const b = [x - nrm[0] * r * s * 0.7 + d[0] * len * 1.05, y - nrm[1] * r * s * 0.7 + d[1] * len * 1.05];
      out.push(clump([a, m, b], r * 1.3, R.sh2, { r0: 0.7, pk: 0.4, end: 0.3, tip: 0.8 }));
      out.push(clump([[a[0] + d[0] * 0.3, a[1] + d[1] * 0.3 - 0.2], [m[0], m[1] - 0.4], [b[0] - d[0] * 0.8, b[1] - d[1] * 0.8 - 0.3]], r * 1.0, i % 2 ? R.sh1 : R.base, { r0: 0.6, pk: 0.4, end: 0.3, tip: 0.4 }));
      out.push(clump([[a[0] + d[0] * 0.6, a[1] + d[1] * 0.6 - 0.5], [m[0] - d[0] * 0.3, m[1] - 0.8]], r * 0.42, i % 2 ? R.base : R.hi, { r0: 0.6, pk: 0.5, end: 0.4, tip: 0.3 }));
    }
    // The gold tie and the tail splitting into two points.
    const e = sp[sp.length - 1];
    const [tx, ty] = lag(1, 54, backLayer(1)).map((v, i) => v - lag(0.9, 50, backLayer(1))[i]);
    out.push(oval(e[0], e[1] - 0.6, 2.4, 1.6, M.goldDk, 0, 10), foval(e[0] + 0.2, e[1] - 0.9, 1.8, 1, M.gold, 0, 10));
    out.push(...pair([[e[0] - 0.6, e[1] + 0.4], [e[0] - 1.4 + tx * 3, e[1] + 4], [e[0] - 1.6 + tx * 5, e[1] + 7.4 + ty * 2]], [[e[0] + 0.8, e[1] + 0.4], [e[0] + 1.4 + tx * 3, e[1] + 3.6], [e[0] + 1.8 + tx * 5, e[1] + 5.6 + ty * 2]], 2.6, 2.4, R, { r0: 1, pk: 0.3, short: 1.4, lx: 0.3 }));
  }));

  // ---- The round shield on the far arm: lavender with a silver rim and a gold crescent crest.
  const drawShield = () => {
    const [sx, sy] = shieldHand;
    const r = 13;
    const tl = dead ? 1.3 : 0.12;
    out.push(T(ovalPts(sx, sy, r + 1.4, r + 1.4, 26, tl), M.silverDk), T(ovalPts(sx + 0.3, sy - 0.3, r, r, 26, tl), M.silver), T(ovalPts(sx + 0.6, sy - 0.4, r - 2.4, r - 2.4, 24, tl), M.lav));
    out.push(F(T(ovalPts(sx + 2, sy - 3, r - 5, r - 6, 20, tl - 0.6), M.lavLt)));
    out.push(F(T(crescentPts(sx + 0.6, sy - 0.4, 7.4, 3.2, -0.5), M.goldDk)), F(T(crescentPts(sx + 0.8, sy - 0.6, 6.8, 2.4, -0.5), M.gold)));
    out.push(star(sx + 3, sy - 2, 1.8, '#ffffff'));
    for (let k = 0; k < 6; k++) {
      const t = (k / 6) * TAU + 0.3;
      out.push(dot(sx + 0.3 + Math.cos(t) * (r - 1.1), sy - 0.3 + Math.sin(t) * (r - 1.1), 0.7, M.silverDk));
    }
  };
  if (!dead) {
    within(Tu, () => {
      const sh = [bx - 7, top + 3];
      const tgt = [shieldHand[0] - lean, shieldHand[1] - bob];
      const { k: el, f: wr } = bend(sh, tgt, 13, 12, -1);
      out.push(taper([sh, el], 6, 5, M.silverDk, { n: 1 }), taper([el, wr], 5.4, 4.6, M.silverDk, { n: 1 }));
    });
    drawShield();
  }

  // ---- Legs: lavender tights under silver greaves, knee cops, and pointed sabatons.
  const legAt = (hip, phase, far) => {
    const h = Tu(...hip);
    let fx;
    let fy = G - 4.4;
    if (dead) {
      fx = h[0] + (far ? -12 : 16);
      fy = G - 3;
    } else if (walk) {
      const th = ph + phase;
      fx = h[0] + 10 * Math.cos(th);
      fy = G - 4.4 - 9 * Math.max(0, -Math.sin(th));
    } else if (atk) {
      fx = h[0] + (far ? lerp(-3, -13, stance) : lerp(4, 13, stance));
    } else {
      fx = h[0] + (far ? -5 : 5);
    }
    const { k, f: an } = bend(h, [fx, fy], 21, 21, 1);
    const res = [];
    const dk = far ? shade(M.silverDk, -6) : M.silverDk;
    res.push(taper([h, k], 8.4, 6.6, far ? M.lavDk : M.lav, { n: 1 }));
    res.push(taper([k, an], 6.8, 4.6, dk, { n: 1 }), taper([[k[0] + 0.4, k[1]], [an[0] + 0.3, an[1]]], 5.2, 3.4, far ? M.silverDk : M.silver, { n: 1 }));
    res.push(oval(k[0] + 0.6, k[1], 3.8, 3.4, dk, 0, 12), oval(k[0] + 0.9, k[1] - 0.3, 2.8, 2.4, far ? M.silverDk : M.silver, 0, 12), dot(k[0] + 1.2, k[1] - 0.4, 0.8, M.gold));
    res.push(poly([[an[0] - 3, an[1] - 1.4], [an[0] + 2.4, an[1] - 1.6], [an[0] + 8, an[1] + 3.4], [an[0] + 6, an[1] + 4.4], [an[0] - 3, an[1] + 4.4]], dk), fpoly([[an[0] - 2.2, an[1] - 0.8], [an[0] + 2, an[1] - 1], [an[0] + 6.6, an[1] + 3], [an[0] - 2, an[1] + 3]], far ? M.silverDk : M.silver));
    if (!far) res.push(line([[k[0] + 1.6, k[1] + 3], [an[0] + 1.6, an[1] - 2]], 0.6, M.silverLt));
    return res;
  };
  out.push(...legAt([bx - 2, hipY], PI, true));
  out.push(...legAt([bx + 1.5, hipY], 0, false));

  // ---- Torso: a lavender skirt under silver tassets, a sculpted breastplate, gorget, pauldrons.
  within(Tu, () => {
    const waist = G - 58;
    const sk = (t) => Math.sin(ph * 2 + t) * (walk ? 1.4 : 0.4);
    out.push(poly([[bx - 9, waist], [bx + 9.6, waist], [bx + 14 + sk(1) + stance * 2, G - 30], [bx + 4, G - 27.6], [bx - 4, G - 29], [bx - 14 + sk(0) - stance * 2, G - 31]], M.lavDk));
    out.push(poly([[bx - 8.4, waist], [bx + 9, waist], [bx + 13 + sk(1) + stance * 2, G - 31.4], [bx + 4, G - 29], [bx - 4, G - 30.4], [bx - 12 + sk(0) - stance * 2, G - 32]], M.lav));
    for (const x of [bx - 5, bx + 1, bx + 7]) out.push(line([[x, waist + 2], [x + (x - bx) * 0.25 + sk(x), G - 31]], 0.6, M.lavDk));
    out.push(line([[bx - 12 + sk(0) - stance * 2, G - 31.6], [bx - 4, G - 30], [bx + 4, G - 28.6], [bx + 13 + sk(1) + stance * 2, G - 31]], 1, M.gold));
    // Tassets.
    for (const [x0, dx, c] of [[bx - 9, -3, M.silverDk], [bx + 2, 4, M.silver]]) {
      out.push(poly([[x0, waist], [x0 + 9, waist], [x0 + 9 + dx, waist + 12], [x0 + dx, waist + 13]], shade(c, -10)), poly([[x0 + 0.6, waist + 0.4], [x0 + 8.4, waist + 0.4], [x0 + 8.4 + dx, waist + 11.4], [x0 + 0.6 + dx, waist + 12.2]], c));
      out.push(line([[x0 + dx * 0.5 + 0.6, waist + 6.4], [x0 + dx * 0.5 + 8.6, waist + 6]], 0.6, M.silverDk), line([[x0 + dx + 0.6, waist + 12], [x0 + dx + 8.4, waist + 11.4]], 0.8, M.gold));
    }
    // Breastplate.
    const bp = [[bx - 9, top + 2], [bx - 10.6, top + 12], [bx - 8.6, waist + 1], [bx + 9, waist + 1], [bx + 11.8, top + 12], [bx + 10, top + 2], [bx + 2, top - 1]];
    out.push(poly(bp, M.silverDk), poly(bp.map(([x, y]) => [x + (bx + 2 - x) * 0.08, y + 0.4]), M.silver));
    out.push(F(T(ovalPts(bx + 6, top + 10, 4.4, 3.6, 16, -0.3).map(([x, y]) => X(x, y)), M.silverLt)), line(spline([[bx - 2, top + 6], [bx + 4, top + 12.4], [bx + 11, top + 9]], 3), 0.6, M.silverDk));
    out.push(line([[bx - 8.6, waist + 0.6], [bx + 9, waist + 0.6]], 1.6, M.gold), ...gem(bx + 2, waist + 0.4, 1.6, M.lavDk));
    out.push(F(T(crescentPts(bx + 1.5, top + 13, 3.2, 1.4, 0.2).map(([x, y]) => X(x, y)), M.goldDk)));
    // Gorget and a lavender collar.
    out.push(poly([[bx - 5, top - 1], [bx + 8, top - 1.6], [bx + 9, top + 3], [bx + 2, top + 5], [bx - 6, top + 3]], M.silverDk), line([[bx - 5, top + 1.6], [bx + 2, top + 3.4], [bx + 8.6, top + 1]], 0.9, M.gold));
    out.push(lpoly([[bx - 1, top - 2], [bx + 6, top - 2.4], [bx + 5, top + 1], [bx, top + 1]], M.skinDk));
  });

  // ---- Head: platinum hair, a winged silver circlet-helm.
  within(Th, () => {
    out.push(...queenHead(hx, hy, mood, SELENE_FACE));
    // Hair: the crown and parted fringe, a thin shadow under the helm's brim, and the side lock.
    inHead(hx, hy, () => {
      out.push(...hairCap(R, SELENE_HAIR));
      out.push(fpoly([[14.6, -6.6], [8, -9.2], [2, -10.6], [-5, -10.2], [-10, -7.6], [-14, -3], [-13.8, -1.4], [-10.4, -5.4], [-5, -7.6], [2, -8], [8, -6.8], [14.6, -3.6]], R.sh1));
      out.push(...pair(flow([[-7.6, -3], [-8.6, 7], [-8.4, 15], [-7.8, 20]], lag, SIDE), flow([[-5, -3], [-5.4, 6], [-5, 12.6], [-4.6, 16.4]], lag, SIDE), 3.4, 3, R, { r0: 1, pk: 0.3, k: 1.4, end: 0.12, line: true, hi: [0.1, 0.3], short: 3 }));
    });
    out.push(...queenTop(hx, hy, mood, SELENE_FACE));
    // The helm: a silver cap with a lavender gem at the brow and white wings sweeping back.
    const brim = [[hx + 14.4, hy - 5], [hx + 8, hy - 7.6], [hx + 2, hy - 9], [hx - 5, hy - 8.6], [hx - 10, hy - 6], [hx - 13.4, hy - 1.6]];
    out.push(poly([...arcPts(hx, hy - 4.6, 15.4, 13.4, 165, 360, 16), ...brim.map(([x, y]) => [x, y + 1.2])], M.silverDk));
    out.push(poly([...arcPts(hx + 0.3, hy - 4.8, 14.4, 12.4, 168, 358, 16), ...brim], M.silver));
    out.push(taper(arcPts(hx, hy - 4.6, 14.6, 12.8, 230, 300, 6), 1.6, 0.8, M.silverLt, { n: 1, flat: true }));
    out.push(line(brim.map(([x, y]) => [x, y + 0.4]), 1, M.gold));
    out.push(...gem(hx + 6, hy - 9, 1.9, M.lavDk));
    const wf = Math.sin(ph * (walk ? 2 : 1) - 0.6) * (walk ? 0.08 : 0.05) + (hurt ? -0.2 : 0);
    const helmWing = (x0, y0, k, c, cd) =>
      within(rot(x0, y0, wf), () => {
        const fs = [[0.55, 9], [0.25, 13], [-0.05, 15], [-0.35, 14], [-0.62, 11]];
        fs.forEach(([an, l], i) => {
          const ang = -PI * 0.78 + an;
          const tip = [x0 + Math.cos(ang) * l * k, y0 + Math.sin(ang) * l * k];
          out.push(...leaf(x0, y0, ang, l * k, (4.6 - Math.abs(i - 2) * 0.5) * k, i % 2 ? cd : c, { flat: false }));
          out.push(line([[x0, y0], [lerp(x0, tip[0], 0.72), lerp(y0, tip[1], 0.72)]], 0.45, M.silverDk));
        });
        out.push(dot(x0, y0, 2, M.gold), dot(x0 - 0.4, y0 - 0.4, 0.7, '#ffffff'));
      });
    helmWing(hx - 7, hy - 9, 1.15, '#ffffff', '#d6dcf6');
  });

  // ---- The near arm and the moon spear.
  within(Tu, () => {
    const sh = [bx + 6.5, top + 3];
    const tgt = [spearHand[0] - lean, spearHand[1] - bob - drop];
    const { k: el, f: wr } = bend(sh, tgt, 13, 12.5, atk && a === 0 ? -1 : 1);
    // Pauldron: two layered crescent plates.
    out.push(...ball(sh[0] - 0.5, sh[1] + 1, 6.4, 5.2, M.silver, { dark: M.silverDk, light: M.silverLt }));
    out.push(line(arcPts(sh[0] - 0.5, sh[1] + 2, 6.2, 4, 10, 170, 6), 1, M.gold), line(arcPts(sh[0] - 0.5, sh[1] + 4.6, 6.6, 3.4, 15, 165, 6), 0.8, M.silverDk));
    out.push(taper([sh, el], 5.4, 4.6, M.lavDk, { n: 1 }), oval(el[0], el[1], 2.6, 2.6, M.silverDk, 0, 12));
    out.push(taper([el, wr], 5.6, 4.6, M.silverDk, { n: 1 }), taper([[el[0] + 0.3, el[1] - 0.3], wr], 4.2, 3.4, M.silver, { n: 1 }), line([[lerp(el[0], wr[0], 0.75), lerp(el[1], wr[1], 0.75) - 2], [lerp(el[0], wr[0], 0.75), lerp(el[1], wr[1], 0.75) + 2]], 0.8, M.gold));
    // The spear.
    if (!dead) {
      const d = [Math.cos(spearA), Math.sin(spearA)];
      const butt = [wr[0] - d[0] * 58, wr[1] - d[1] * 58];
      const head = [wr[0] + d[0] * 26, wr[1] + d[1] * 26];
      const tipP = [head[0] + d[0] * 15, head[1] + d[1] * 15];
      const nx = -d[1];
      const ny = d[0];
      out.push(taper([butt, head], 2.4, 2.2, M.steel, { n: 1 }), line([[butt[0] + nx * 0.5, butt[1] + ny * 0.5], [head[0] + nx * 0.5, head[1] + ny * 0.5]], 0.6, M.lavLt));
      for (const t of [0.1, 0.62, 0.7]) {
        const p = [lerp(butt[0], head[0], t), lerp(butt[1], head[1], t)];
        out.push(line([[p[0] - d[0] * 1.2, p[1] - d[1] * 1.2], [p[0] + d[0] * 1.2, p[1] + d[1] * 1.2]], 3.2, M.gold));
      }
      out.push(dot(butt[0], butt[1], 1.6, M.goldDk));
      // Blade, and a crescent guard cradling it.
      out.push(poly([[head[0] + nx * 2.6, head[1] + ny * 2.6], [head[0] + d[0] * 6 + nx * 3.4, head[1] + d[1] * 6 + ny * 3.4], tipP, [head[0] + d[0] * 6 - nx * 3.4, head[1] + d[1] * 6 - ny * 3.4], [head[0] - nx * 2.6, head[1] - ny * 2.6]], M.silverDk));
      out.push(fpoly([[head[0], head[1]], [head[0] + d[0] * 6 + nx * 2.6, head[1] + d[1] * 6 + ny * 2.6], tipP], M.silverLt), fpoly([[head[0], head[1]], tipP, [head[0] + d[0] * 6 - nx * 2.6, head[1] + d[1] * 6 - ny * 2.6]], M.silver));
      const ga = Math.atan2(d[1], d[0]) + PI;
      out.push(F(T(crescentPts(head[0] - d[0] * 1.5, head[1] - d[1] * 1.5, 6.4, 2.8, ga), M.goldDk)), F(T(crescentPts(head[0] - d[0] * 1.4, head[1] - d[1] * 1.4, 5.8, 2, ga), M.gold)));
      out.push(...gem(head[0] - d[0] * 1, head[1] - d[1] * 1, 1.5, M.lav));
      // Ribbon tied under the head.
      out.push(taper([[head[0] - d[0] * 3, head[1] - d[1] * 3], [head[0] - d[0] * 6 + swing * -0.8, head[1] - d[1] * 6 + 6], [head[0] - d[0] * 10 + swing * -1.4, head[1] - d[1] * 10 + 9]], 1.8, 0.8, M.lav, { n: 2, flat: true }));
      // The crescent flash of the thrust.
      if (flash > 0) {
        const fx = tipP[0] + d[0] * (a === 0 ? 0 : 4);
        const fy = tipP[1] + d[1] * (a === 0 ? 0 : 4);
        if (a === 0) {
          out.push(dot(tipP[0], tipP[1], 3.4, mix(M.glow, '#ffffff', 0.5)), sparkle(tipP[0], tipP[1], 5, '#ffffff'));
        } else {
          const r = 9 + flash * 7;
          const cx = Math.min(W - r - 1, fx - r * 0.3);
          out.push(F(T(crescentPts(cx, fy, r, r * 0.42, PI), mix(M.glow, '#ffffff', 0.5))), F(T(crescentPts(cx, fy, r * 0.92, r * 0.26, PI), '#ffffff')));
          out.push(sparkle(Math.min(W - 6, fx + 2), fy, 4 + flash * 3, '#ffffff'));
        }
      }
    }
    out.push(...hand(wr[0], wr[1], spearA, M.lav, M.lavDk));
  });

  // Fallen: the shield lies at her side and the spear on the ground.
  if (dead) {
    out.push(taper([[bx - 40, G - 2], [bx + 44, G - 3]], 2.4, 2.2, M.steel, { n: 1 }), poly([[bx + 44, G - 5.4], [bx + 58, G - 3], [bx + 44, G - 0.8]], M.silver), F(T(crescentPts(bx + 43, G - 3, 5, 2, PI), M.gold)));
    drawShield();
  }
  // Moonlit motes drifting up when roused or pleased.
  if ((angry || happy) && !atk && !dead) {
    for (let k = 0; k < 4; k++) {
      const t = (ph / TAU + k / 4) % 1;
      out.push(star(bx - 30 + k * 20 + Math.sin(t * TAU + k) * 3, G - 30 - t * 70, 1.2 + Math.sin(t * PI) * 1.2, k % 2 ? M.star : M.lavLt));
    }
  }
  return finish(out, W, H, dead);
}

export const ART = {
  tamamo: { walk: 8, idle: 8, attack: 5, stride: 60, atkMs: [70, 140, 360, 200], draw: tamamo },
  sylvana: { walk: 8, idle: 8, attack: 5, stride: 50, atkMs: [80, 150, 400, 220], draw: sylvana },
  lilith: { walk: 8, idle: 8, attack: 5, stride: 36, atkMs: [70, 140, 360, 200], draw: lilith },
  selene: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 40, atkMs: [60, 140, 380, 200], draw: selene },
};

export const INFO = {
  tamamo: { name: 'Tamamo, the Nine-Tailed Empress', w: 70, h: 118 },
  sylvana: { name: 'Sylvana, the Dryad Queen', w: 64, h: 122 },
  lilith: { name: 'Lilith, the Succubus Queen', w: 62, h: 120 },
  selene: { name: 'Selene, the Moon Valkyrie', w: 62, h: 122 },
};
