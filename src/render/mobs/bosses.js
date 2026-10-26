// Monster art: bosses. Four big, layered designs with multi-frame motion:
//   mothercapper  the Myconid Queen: a mushroom matriarch in a lace veil and mycelium robe
//   tuskar        the Behemoth: an armored demon boar with burning eyes and a mane of flame
//   gnarlroot     the Hollow Heart: an ancient corrupted treant with a glowing purple heart
//   crystalking   the Crystal Dragon King: a crowned crystal dragon with a prism scepter
// Everything is built from polygons pushed through a small transform stack (`within`), so whole
// parts (a cap, a head, a wing) can tilt and bob as one piece. All face right, feet at the bottom.

import { E, T, F, C, INK, BLUSH, MOUTH, shade, mix } from './kit.js';

const TAU = Math.PI * 2;

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
const lerp2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
const rnd = (i) => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const poly = (pts, c) => T(pts.map(([x, y]) => X(x, y)), c);
const fpoly = (pts, c) => F(poly(pts, c));
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
// Small flat dots (eye shines, gems, spores); the transform only moves their center.
const dot = (x, y, rx, c, ry = rx) => {
  const [px, py] = X(x, y);
  return F(E(px, py, rx, ry, c));
};
// Points along an elliptical arc, angles in degrees.
const arcPts = (cx, cy, rx, ry, a0, a1, n = 8) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });

// Catmull-Rom through the points, `n` steps per span.
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

// A tapered limb along a smooth curve: width w0 at the start, w1 at the end, as one polygon.
function taper(pts, w0, w1, c, { n = 4, flat = false, tip = false, cast = false } = {}) {
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
    const w = lerp(w0, w1, i / (m - 1)) / 2;
    left.push([p[i][0] - dy * w, p[i][1] + dx * w]);
    right.push([p[i][0] + dy * w, p[i][1] - dx * w]);
  }
  const pts2 = [...left];
  if (tip) {
    const a = p[m - 2];
    const b = p[m - 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    pts2.push([b[0] + ((b[0] - a[0]) / len) * w1 * 1.4, b[1] + ((b[1] - a[1]) / len) * w1 * 1.4]);
  }
  pts2.push(...right.reverse());
  let s = T(pts2, c);
  if (flat) s = F(s);
  if (cast) s = C(s);
  return s;
}
const line = (pts, th, c, n = 1) => taper(pts, th, th, c, { n, flat: true });

// A rounded mass with a soft shadow crescent at the lower back and a highlight up front.
function ball(cx, cy, rx, ry, c, o = {}) {
  const a = o.a ?? 0;
  const out = [oval(cx, cy, rx, ry, o.dark ?? shade(c, -11), a)];
  out.push(oval(cx + rx * 0.08, cy - ry * 0.09, rx * 0.89, ry * 0.87, c, a));
  if (o.hi !== false) out.push(foval(cx + rx * 0.3, cy - ry * 0.5, rx * 0.34, ry * 0.15, o.light ?? mix(c, '#ffffff', 0.3), a - 0.25));
  return out;
}

// A slash or gore streak: a crescent along an arc (degrees) that swells toward its leading end.
function swoosh(cx, cy, r, a0, a1, th, glow, core = '#ffffff') {
  const band = (w, rr, c) => {
    const outer = [];
    const inner = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
      const k = Math.sin(t * Math.PI) ** 0.8 * (0.35 + 0.65 * t);
      outer.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
      inner.push([cx + Math.cos(a) * (rr - w * k), cy + Math.sin(a) * (rr - w * k)]);
    }
    return fpoly([...outer, ...inner.reverse()], c);
  };
  return [band(th + 2, r + 1, glow), band(th * 0.55, r, core)];
}

// A four-point sparkle.
function sparkle(x, y, r, c) {
  return fpoly([[x, y - r], [x + r * 0.28, y - r * 0.28], [x + r, y], [x + r * 0.28, y + r * 0.28], [x, y + r], [x - r * 0.28, y + r * 0.28], [x - r, y], [x - r * 0.28, y - r * 0.28]], c);
}

// A flame tongue (three nested layers), leaning `lean` px at the tip.
function flame(x, y, h, w, lean, cols) {
  const out = [];
  [1, 0.66, 0.36].forEach((k, i) => {
    const hh = h * (i === 0 ? 1 : k * 1.05);
    const ww = w * k;
    out.push(fpoly([[x - ww, y], [x - ww * 0.95, y - hh * 0.35], [x - ww * 0.35 + lean * 0.4, y - hh * 0.72], [x + lean, y - hh], [x + ww * 0.55 + lean * 0.3, y - hh * 0.55], [x + ww, y - hh * 0.2], [x + ww * 0.7, y]], cols[i]));
  });
  return out;
}

// A crystal shard from a base point toward `ang`: two-tone facets and a shine.
function shard(x, y, ang, len, w, pal, o = {}) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const px = -dy * w * 0.5;
  const py = dx * w * 0.5;
  const tip = [x + dx * len, y + dy * len];
  const m = 0.68;
  const b1 = [x + px, y + py];
  const b2 = [x - px, y - py];
  const m1 = [x + dx * len * m + px * 0.85, y + dy * len * m + py * 0.85];
  const m2 = [x + dx * len * m - px * 0.85, y + dy * len * m - py * 0.85];
  const out = [poly([b1, m1, tip, m2, b2], pal[0])];
  out.push(fpoly([[x, y], m2, tip, [x + dx * len * 0.5, y + dy * len * 0.5]], pal[1]));
  if (!o.noShine) out.push(line([[x + dx * len * 0.2 - px * 0.3, y + dy * len * 0.2 - py * 0.3], [x + dx * len * 0.62 - px * 0.35, y + dy * len * 0.62 - py * 0.35]], Math.max(0.6, w * 0.13), pal[2]));
  return out;
}

// A faceted gem: a dark rim, a body, a lit upper facet, and a shine.
function gem(x, y, r, c, o = {}) {
  const pts = [];
  const k = o.sides ?? 6;
  for (let i = 0; i < k; i++) {
    const a = -Math.PI / 2 + (i / k) * TAU;
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * (o.tall ?? 1)]);
  }
  const out = [fpoly(pts.map(([px, py]) => [x + (px - x) * 1.22, y + (py - y) * 1.22]), o.rim ?? shade(c, -30))];
  out.push(fpoly(pts, c));
  out.push(fpoly([[x, y - r * (o.tall ?? 1)], [x + r * 0.86, y - r * 0.5 * (o.tall ?? 1)], [x, y], [x - r * 0.86, y - r * 0.5 * (o.tall ?? 1)]], mix(c, '#ffffff', 0.45)));
  out.push(fpoly([[x - r * 0.86, y + r * 0.5 * (o.tall ?? 1)], [x, y], [x, y + r * (o.tall ?? 1)]], shade(c, -12)));
  out.push(dot(x - r * 0.3, y - r * 0.45, Math.max(0.5, r * 0.22), '#ffffff'));
  return out;
}

// Two-bone reach: the knee between hip and foot, bending toward `dir` (+1 forward, -1 back).
function knee(h, ft, a, b, dir) {
  const dx = ft[0] - h[0];
  const dy = ft[1] - h[1];
  const d = clamp(Math.hypot(dx, dy), 0.01, a + b - 0.2);
  const base = Math.atan2(dy, dx);
  const A = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const k1 = [h[0] + Math.cos(base + A) * a, h[1] + Math.sin(base + A) * a];
  const k2 = [h[0] + Math.cos(base - A) * a, h[1] + Math.sin(base - A) * a];
  const kn = (k1[0] - k2[0]) * dir > 0 ? k1 : k2;
  // The foot actually reached (when the target is too far, the leg straightens toward it).
  const fl = Math.hypot(ft[0] - kn[0], ft[1] - kn[1]) || 1;
  return { k: kn, f: [kn[0] + ((ft[0] - kn[0]) / fl) * Math.min(b, fl), kn[1] + ((ft[1] - kn[1]) / fl) * Math.min(b, fl)] };
}

// ---------- Motion ----------

const smooth = (k) => k * k * (3 - 2 * k);
// Picks the attack frame's value from a list (or the fallback outside an attack).
const key = (att, list, other) => (att >= 0 ? list[Math.min(att, list.length - 1)] : other);

// Bends a finished drawing like a body over planted feet: a point takes the motion more the higher
// it sits (fully at `top` and above), turning by `a` about (cx, top) and shifting by (dx, dy); then
// the whole figure squashes by (sx, sy) about (cx, floor), so the feet never leave the ground.
function bend(shapes, { cx, top, floor, a = 0, dx = 0, dy = 0, sx = 1, sy = 1 }) {
  if (!a && !dx && !dy && sx === 1 && sy === 1) return shapes;
  const map = (x, y) => {
    const k = smooth(clamp((floor - y) / (floor - top), 0, 1));
    const c = Math.cos(a * k);
    const s = Math.sin(a * k);
    const ox = x - cx;
    const oy = y - top;
    const nx = cx + ox * c - oy * s + dx * k;
    const ny = top + ox * s + oy * c + dy * k;
    return [cx + (nx - cx) * sx, floor - (floor - ny) * sy];
  };
  return shapes.map((sh) => {
    if (sh.t === 'p') return { ...sh, x: 0, y: 0, pts: sh.pts.map(([x, y]) => map(x + sh.x, y + sh.y)) };
    const [x, y] = map(sh.x, sh.y);
    if (sh.t === 'e') return { ...sh, x, y, rx: sh.rx * sx, ry: sh.ry * sy };
    return { ...sh, x, y };
  });
}

// An impact on the ground at (x, y): a flat shock ring, a flash star, and debris kicked up.
// k grows the ring (0..1 as it spreads); cols = [ring, light, debris].
function impact(x, y, r, k, cols, seed = 1) {
  const out = [];
  const rr = r * (0.5 + k * 0.7);
  for (const [a0, a1] of [[Math.PI, TAU], [0, Math.PI]]) {
    out.push(F(poly([...ovalPts(x, y, rr + 2.4, (rr + 2.4) * 0.26, 16, 0, a0, a1), ...ovalPts(x, y, rr, rr * 0.2, 16, 0, a1, a0)], cols[0])));
  }
  if (k < 0.6) out.push(sparkle(x, y - r * 0.25, r * (0.55 - k * 0.4), cols[1]), sparkle(x, y - r * 0.25, r * (0.3 - k * 0.2), '#ffffff'));
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (1.12 + (i / 5) * 0.76);
    const d = r * (0.35 + k * 0.75) * (0.8 + rnd(seed + i) * 0.4);
    const px = x + Math.cos(a) * d;
    const py = y + Math.sin(a) * d * 0.9 + k * k * r * 0.25;
    const sz = (1.2 + rnd(seed + i + 9) * 1.4) * (1 - k * 0.35);
    out.push(fpoly([[px - sz, py], [px - sz * 0.2, py - sz * 1.1], [px + sz, py - sz * 0.2], [px + sz * 0.3, py + sz * 0.8]], cols[2]));
  }
  return out;
}

// ---------- Eyes ----------

// A boss eye: an inked almond with a glowing iris, a pupil, shines, and a lid that slants down
// toward the nose (menacing), lower still when angry, half-closed when smug. `s` is the side:
// +1 for the eye toward the front (right), -1 for the far one.
function eye(ex, ey, rx, ry, mood, o = {}) {
  const ink = o.ink ?? INK;
  const s = o.s ?? 1;
  const th = Math.max(0.8, ry * 0.3);
  if (mood === 'blink') return line(arcPts(ex, ey - ry * 0.1, rx * 1.05, ry * 0.45, 12, 168), th, ink);
  if (mood === 'happy' && !o.smug) return line(arcPts(ex, ey + ry * 0.45, rx * 1.05, ry * 0.85, 200, 340), th * 1.15, ink);
  if (mood === 'hurt') return line([[ex - s * rx, ey - ry * 0.8], [ex + s * rx * 0.75, ey], [ex - s * rx, ey + ry * 0.8]], th * 1.1, ink);
  if (mood === 'dead') return [line([[ex - rx * 0.85, ey - ry * 0.75], [ex + rx * 0.85, ey + ry * 0.75]], th, ink), line([[ex - rx * 0.85, ey + ry * 0.75], [ex + rx * 0.85, ey - ry * 0.75]], th, ink)];
  const angry = mood === 'angry';
  const smug = mood === 'happy';
  const out = [];
  out.push(foval(ex, ey, rx + 0.7, ry + 0.7, ink), foval(ex, ey, rx, ry, o.white ?? '#ffffff'));
  const ic = angry ? o.hot ?? o.iris : o.iris;
  const ix = ex + s * rx * 0.16 * (o.look ?? 1) + (o.glance ?? 0) * rx * 0.22;
  out.push(foval(ix, ey + ry * 0.06, rx * 0.8, ry * 0.86, shade(ic, -16)), foval(ix, ey + ry * 0.14, rx * 0.66, ry * 0.7, ic), foval(ix, ey + ry * 0.42, rx * 0.5, ry * 0.32, mix(ic, '#ffffff', 0.45)));
  if (angry) {
    out.push(foval(ix, ey + ry * 0.08, rx * 0.34, ry * 0.36, '#fffbe8'));
  } else if (o.slit) {
    out.push(foval(ix, ey + ry * 0.05, rx * 0.16, ry * 0.62, o.pupil ?? INK));
  } else {
    out.push(foval(ix, ey + ry * 0.05, rx * 0.36, ry * 0.42, o.pupil ?? INK));
  }
  out.push(dot(ix - rx * 0.3, ey - ry * 0.32, Math.max(0.6, rx * 0.26), '#ffffff'), dot(ix + rx * 0.28, ey + ry * 0.38, Math.max(0.4, rx * 0.12), '#ffffff'));
  if (o.lid) {
    const dIn = angry ? 0.5 : smug ? 0.5 : o.dIn ?? 0.2;
    const dOut = angry ? 0.14 : smug ? 0.44 : o.dOut ?? 0.02;
    const xin = ex - s * rx * 1.3;
    const xout = ex + s * rx * 1.3;
    const yin = ey - ry + 2 * ry * dIn;
    const yout = ey - ry + 2 * ry * dOut;
    out.push(fpoly([[xin, ey - ry * 1.8], [xout, ey - ry * 1.8], [xout, yout], [xin, yin]], o.lid));
    out.push(line([[xin + s * rx * 0.25, yin + (yout - yin) * 0.1], [xout, yout], [xout + s * rx * 0.35, yout - ry * 0.25]], th * 1.2, ink));
  }
  return out;
}

// ---------- The Myconid Queen ----------

const Q = {
  cap: '#e2679f', capDk: '#b44a83', capLt: '#f58cbd', capHi: '#ffd2e6', frill: '#ffb3d6', gill: '#ffe1ef', glow: '#6ff0da', hot: '#ff5fc8',
  wart: '#fff3cf', robe: '#6f50ae', robeDk: '#523a8c', robeLt: '#8e73d0', thread: '#a58fe0', gown: '#f6ecdf', gownDk: '#e1d2e2',
  gold: '#ffd36b', goldDk: '#d39a42', skin: '#fff3e6', skinDk: '#efd2cf', lace: '#f8f0ff', laceDk: '#d9c6ee', wood: '#86665a', woodLt: '#a9877a',
};

// Points inside a polygon (for lace holes).
function inside(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function queen(pose, f, mood) {
  const walk = pose === 'walk';
  const att = pose === 'attack' ? f : -1;
  const n = walk ? 8 : 6;
  const ph = att >= 0 ? 0 : (f / n) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  // A stately glide: one slow rise and settle per stride, a sway from side to side, and the heavy
  // cap and veil following a beat behind. The slam rises up tall, then drives the staff down.
  const bob = (walk ? Math.sin(ph * 2) * 1.1 : Math.sin(ph) * 0.7) + key(att, [-1.2, 0.4, 2.2, 1.4, 0.4], 0);
  const lag = walk ? Math.sin(ph * 2 - 1.3) : key(att, [-1, 0.6, 1.4, 0.8, 0.2], Math.sin(ph - 1.1));
  const pulse = att >= 0 ? [1, 0.8, 1, 0.6, 0.4][att] : (Math.sin(ph) + 1) / 2;
  const sway = walk ? Math.sin(ph) * 1.6 : key(att, [-1.6, 1, 2, 1.2, 0.3], Math.sin(ph) * 0.4);
  const look = walk ? 0.8 : att >= 0 ? 1.4 : Math.sin(ph + 0.8) * 1.4;
  let lean = 0;
  let drop = 0;
  let tilt = sway * 0.02 + key(att, [-0.07, 0.03, 0.08, 0.05, 0.02], 0);
  let lift = key(att, [-2.4, -1.4, 0, 0, 0], 0);
  if (angry && att < 0) {
    lift = -3;
    tilt = 0.06;
  }
  if (hurt) {
    lean = -4;
    tilt = -0.13;
  }
  if (dead) {
    drop = 13;
    tilt = 0.22;
    lean = 2;
  }
  const top = 63 + bob * 0.6 + drop * 0.7;
  const hx = 55 + lean;
  const hy = 52 + bob + drop;
  const capX = 50 + lean * 1.2;
  const capY = 40 + bob + lag * 1.5 + drop + lift;
  const glow = angry ? Q.hot : dead ? '#bdb4cc' : mix(Q.glow, '#ffffff', pulse * 0.4);
  const out = [];

  // Spores drifting up through the air (the far ones first).
  const spores = (front) => {
    const res = [];
    for (let i = 0; i < 9; i++) {
      if ((i % 2 === 0) !== front) continue;
      const u = (rnd(i) + (att >= 0 ? 0.2 : f / n) + (walk ? 0 : 0.5)) % 1;
      const x = 6 + rnd(i + 20) * 88 + Math.sin(u * TAU + i) * 3;
      const y = 104 - u * 96;
      const r = 0.9 + rnd(i + 40) * 1.3;
      const c = angry ? (i % 3 ? '#ff8ad8' : '#c86bff') : dead ? '#d9d2e4' : i % 3 ? '#c9fff4' : '#ffd6f0';
      res.push(dot(x, y, r + 0.7, mix(c, '#ffffff', 0.55)), dot(x, y, r, c));
      if (i % 3 === 0 && !dead) res.push(dot(x - r * 0.3, y - r * 0.3, 0.45, '#ffffff'));
    }
    return res;
  };
  out.push(...spores(false));

  // The lace veil: a bell of netting hanging from under the cap and flaring behind the shoulders,
  // ending in deep scallops.
  {
    const vb = capY + 40 - drop * 0.4;
    const veil = [[capX - 34, capY + 1]];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      veil.push([capX - 34 - 8 * Math.sin(t * 1.6) + sway * t, capY + 1 + t * (vb - capY - 1)]);
    }
    const sc = 8;
    for (let i = 0; i < sc; i++) {
      const x0 = capX - 42 + sway + (i / sc) * 84;
      const x1 = capX - 42 + sway + ((i + 1) / sc) * 84;
      for (let k = 1; k <= 4; k++) {
        const t = k / 4;
        veil.push([lerp(x0, x1, t), vb + Math.sin(t * Math.PI) * 4.4 + Math.sin(i + ph) * 0.8]);
      }
    }
    for (let i = 8; i >= 0; i--) {
      const t = i / 8;
      veil.push([capX + 34 + 8 * Math.sin(t * 1.6) + sway * t, capY + 1 + t * (vb - capY - 1)]);
    }
    out.push(poly(veil, Q.lace));
    // Net: diagonal threads both ways, clipped to the veil.
    const net = (dir) => {
      for (let k = -12; k <= 12; k++) {
        const pts = [];
        for (let y = capY + 3; y <= vb + 4; y += 1.5) {
          const x = capX + k * 6.4 + dir * (y - capY) * 0.55;
          if (inside(veil, x, y) && inside(veil, x - 1, y + 1) && inside(veil, x + 1, y + 1)) pts.push([x, y]);
          else if (pts.length) break;
        }
        if (pts.length > 2) out.push(line([pts[0], pts[pts.length - 1]], 0.5, Q.laceDk));
      }
    };
    net(1);
    net(-1);
    for (let i = 0; i < 8; i++) out.push(dot(capX - 42 + sway + ((i + 0.5) / 8) * 84, vb + 3.8, 1.2, i % 2 ? Q.capLt : Q.glow));
  }

  // Back arm: a bell sleeve, the hand lifting the robe's edge.
  out.push(poly([[38, top + 2], [30, top + 12], [22, top + 26], [16, top + 33], [30, top + 34], [34, top + 22], [42, top + 8]], Q.robeDk),
    line([[16, top + 33], [30, top + 34]], 1.6, Q.goldDk), oval(22, top + 33, 3.6, 3, Q.skinDk));

  // The robe: a long bell gown that ripples along its hem as she glides.
  const hemY = (t) => Math.min(111.5, 108.4 + Math.sin(t * TAU * 3 + ph * 2) * 1.5 + (dead ? 1 : 0));
  const hem = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    hem.push([11 + t * 78, hemY(t)]);
  }
  const wide = dead ? 3 : 0;
  out.push(poly([[45 + lean * 0.5, top - 3], [35, top + 1], [27, top + 14], [19 - wide, top + 32], [12 - wide, 104], ...hem, [88 + wide, 104], [82 + wide, top + 32], [73, top + 14], [65, top + 1], [57 + lean * 0.5, top - 3]], Q.robe));
  // Its shaded back half and soft folds.
  out.push(poly([[35, top + 1], [27, top + 14], [19 - wide, top + 32], [12 - wide, 104], [11, hemY(0)], [26, hemY(0.2)], [28, top + 34], [33, top + 16], [40, top + 2]], Q.robeDk));
  for (const [x0, x1, c] of [[30, 25, Q.robeDk], [40, 36, Q.robeDk], [70, 76, Q.robeLt], [80, 84, Q.robeLt]]) {
    out.push(taper([[x0, top + 12], [lerp(x0, x1, 0.5) + sway, top + 30], [x1, 106]], 0.8, 2.4, c, { flat: true }));
  }
  // Mycelium threads woven over the robe.
  for (let i = 0; i < 5; i++) {
    const x = 18 + i * 15 + rnd(i) * 4;
    const pts = [[x, 106]];
    for (let k = 1; k <= 4; k++) pts.push([x + Math.sin(k * 1.9 + i) * 4, 106 - k * 9]);
    out.push(line(pts, 0.6, Q.thread, 3));
    out.push(line([pts[2], [pts[2][0] + (i % 2 ? 5 : -5), pts[2][1] - 6]], 0.5, Q.thread), dot(pts[4][0], pts[4][1], 0.8, Q.thread));
  }
  // The gown's front panel of woven mycelium, edged in gold.
  const gL = [[53 + lean * 0.4, top], [42, 108]];
  const gR = [[61 + lean * 0.4, top], [78, 108]];
  out.push(poly([gL[0], gR[0], [70, top + 26], gR[1], [60, hemY(0.62)], gL[1], [48, top + 26]], Q.gown));
  for (let k = 0; k < 6; k++) {
    const y = top + 10 + k * 7.4;
    const w = lerp(4, 15, k / 5);
    out.push(line(arcPts(58 + lean * 0.3 * (1 - k / 5), y, w, 2, 20, 160, 6), 0.6, Q.gownDk));
  }
  out.push(line([gL[0], [48, top + 26], gL[1]], 1.8, Q.gold, 3), line([gR[0], [70, top + 26], gR[1]], 1.8, Q.gold, 3));
  for (let k = 1; k < 5; k++) {
    const t = k / 5;
    out.push(dot(lerp(53, 42, t) - 0.5, lerp(top, 108, t), 1.1, k % 2 ? Q.glow : '#ff9ad2'), dot(lerp(61, 78, t) + 0.5, lerp(top, 108, t), 1.1, k % 2 ? '#ff9ad2' : Q.glow));
  }
  // Ruffled hem frill, with little glowing mushrooms sprouting from it and root threads trailing.
  for (let i = 0; i <= 13; i++) {
    const t = i / 13;
    const x = 12 + t * 76;
    out.push(oval(x, hemY(t) - 0.8, 3.4, 2.2, i % 2 ? Q.frill : Q.capLt, 0, 14));
  }
  for (const [x, h, c] of [[19, 6, Q.glow], [25, 4, '#ff9ad2'], [73, 5, Q.glow], [83, 7, '#ff9ad2']]) {
    const y = hemY((x - 11) / 78) - 2;
    out.push(line([[x, y], [x + 0.4, y - h]], 1.4, Q.gown), oval(x + 0.4, y - h, 2.8, 1.8, dead ? '#cfc6d8' : c, 0, 12), dot(x - 0.4, y - h - 0.6, 0.7, '#ffffff'));
  }

  // The ruff collar of pleated gills.
  for (let k = 0; k <= 10; k++) {
    const a = Math.PI * (0.05 + (k / 10) * 0.9);
    const x = hx - 1 + Math.cos(a) * 15;
    const y = top + 1 + Math.sin(a) * 6;
    out.push(oval(x, y, 3.8, 4.4, k % 2 ? Q.frill : Q.capLt, 0, 14), line([[x, y - 2.6], [x, y + 3]], 0.5, Q.capDk));
  }
  out.push(...gem(hx + 1, top + 7, 2.4, angry ? Q.hot : Q.glow));

  // The face: a pale stem-head with big regal eyes.
  out.push(...ball(hx, hy, 14.5, 13.5, Q.skin, { dark: Q.skinDk, hi: false }));
  const ex1 = hx - 3.6;
  const ex2 = hx + 7.4;
  const ey = hy - 0.6;
  // Regal almond eyes: wide, heavy-lidded, winged at the outer corner, with long upswept lashes.
  const eo = { iris: '#2fc4b4', hot: Q.hot, lid: Q.skin, slit: false, dIn: 0.3, dOut: 0.26, glance: look };
  out.push(...[].concat(eye(ex1, ey, 3.4, 3.1, mood, { ...eo, s: -1, smug: happy })), ...[].concat(eye(ex2, ey, 3.8, 3.3, mood, { ...eo, s: 1, smug: happy })));
  if (!['hurt', 'dead', 'blink'].includes(mood) && !happy) {
    // Lower lids, so the open eye reads as an almond.
    out.push(line(arcPts(ex1, ey + 0.2, 3.5, 3, 35, 150, 6), 0.6, Q.skinDk), line(arcPts(ex2, ey + 0.2, 3.9, 3.2, 30, 145, 6), 0.6, Q.skinDk));
  }
  if (!['hurt', 'dead'].includes(mood)) {
    const ly = mood === 'blink' ? ey - 0.2 : ey - 1.8;
    out.push(line([[ex1 - 3.6, ly + 0.8], [ex1 - 5.6, ly - 1.2], [ex1 - 6.2, ly - 2.8]], 0.8, INK, 3), line([[ex1 - 2.6, ly - 0.4], [ex1 - 3.8, ly - 2.6]], 0.6, INK));
    out.push(line([[ex2 + 3.8, ly + 0.8], [ex2 + 5.8, ly - 1.2], [ex2 + 6.4, ly - 2.8]], 0.8, INK, 3), line([[ex2 + 2.8, ly - 0.4], [ex2 + 4, ly - 2.6]], 0.6, INK), line([[ex2 + 1.4, ly - 0.8], [ex2 + 1.8, ly - 2.8]], 0.5, INK));
  }
  if (angry) {
    out.push(line([[ex1 - 3.4, ey - 6.6], [ex1 + 2.4, ey - 4.4]], 1.3, Q.capDk), line([[ex2 + 4, ey - 6.8], [ex2 - 2.4, ey - 4.4]], 1.3, Q.capDk));
  }
  if (!dead) out.push(dot(ex1 - 1.6, hy + 4.4, 2.4, BLUSH, 1.1), dot(ex2 + 1.8, hy + 4.4, 2.6, BLUSH, 1.2));
  {
    const mx = hx + 2.6;
    const my = hy + 7.4;
    if (angry) {
      out.push(fpoly([[mx - 4, my - 1], [mx + 4, my - 1.4], [mx + 2.6, my + 3.6], [mx - 2.6, my + 3.4]], MOUTH), fpoly([[mx - 2.6, my + 1.8], [mx + 1.6, my + 1.6], [mx, my + 3.4]], '#ff8fb0'),
        fpoly([[mx - 3, my - 1], [mx - 1.8, my - 1], [mx - 2.4, my + 1]], '#ffffff'), fpoly([[mx + 1.8, my - 1.2], [mx + 3, my - 1.3], [mx + 2.4, my + 0.8]], '#ffffff'));
    } else if (hurt) {
      out.push(foval(mx, my + 0.6, 1.6, 1.9, MOUTH));
    } else if (dead) {
      out.push(line([[mx - 3, my + 0.6], [mx - 1, my - 0.4], [mx + 1, my + 0.6], [mx + 3, my - 0.4]], 0.8, INK));
    } else if (happy) {
      out.push(line([[mx - 3.4, my - 0.4], [mx - 0.6, my + 1], [mx + 2.6, my + 0.2], [mx + 4, my - 1.6]], 0.9, INK, 3));
    } else {
      out.push(line([[mx - 2.6, my], [mx, my + 1.1], [mx + 2.8, my - 0.3]], 0.8, Q.capDk, 3));
    }
  }

  // The cap: a vast frilled dome with glowing gills beneath, warts that glow, and a tiara.
  within(chain(rot(capX, capY, tilt), shift(capX, capY)), () => {
    const rx = 46 * (1 + 0.025 * lag) * (angry ? 1.04 : 1);
    const ry = 31 * (1 - 0.04 * lag) * (dead ? 0.92 : 1);
    const droop = angry ? -0.4 : dead ? 1.6 : 1;
    // Gills on the underside, glowing (radial lines from the rim toward the stem).
    out.push(poly(ovalPts(0, 0.6, rx - 4, 8, 24, 0, 0, Math.PI), Q.gill));
    for (let k = -9; k <= 9; k++) {
      const t = k / 9.6;
      const bx = t * (rx - 5);
      const by = 0.6 + 7.4 * Math.sqrt(Math.max(0, 1 - t * t));
      out.push(line([[bx, by], [t * 9, 0.4]], k % 2 ? 0.9 : 0.6, k % 2 ? glow : Q.frill));
    }
    // The dome: a dark base, the lit color, and a broad highlight.
    const dome = (sx, sy, ox, oy) => {
      const pts = [];
      for (let i = 0; i <= 18; i++) {
        const a = Math.PI + (i / 18) * Math.PI;
        pts.push([ox + Math.cos(a) * rx * sx, oy + Math.sin(a) * ry * sy]);
      }
      for (let j = 0; j <= 26; j++) {
        const t = j / 26;
        const u = 1 - 2 * t;
        pts.push([ox + rx * sx * u, oy + droop * 7 * u ** 4 + Math.sin(t * 34 + ph * 2) * 1.1 - 0.4]);
      }
      return pts;
    };
    out.push(C(poly(dome(1, 1, 0, 0), Q.capDk)), poly(dome(0.93, 0.92, 2.4, -2.4), Q.cap));
    out.push(foval(rx * 0.22, -ry * 0.62, rx * 0.34, ry * 0.13, Q.capLt, -0.12), foval(rx * 0.3, -ry * 0.68, rx * 0.16, ry * 0.06, Q.capHi, -0.12));
    // Frilled lace trim along the rim.
    for (let j = 0; j <= 20; j++) {
      const t = j / 20;
      const u = 1 - 2 * t;
      const x = rx * u * 0.99;
      const y = droop * 7 * u ** 4 + 0.8;
      out.push(oval(x, y, 3.2, 2.3, j % 2 ? Q.frill : '#ffc8e2', 0, 12));
      if (j % 2 === 0) out.push(dot(x, y + 1.2, 0.7, '#ffffff'));
    }
    // Glowing warts.
    const warts = [[-28, -13, 4.4, 3.2], [-10, -23, 5, 3.4], [12, -22, 4.2, 3], [28, -12, 4.6, 3.2], [1, -9, 3, 2.2], [-20, -4.5, 2.6, 1.8], [19, -4, 2.4, 1.7], [36, -4.6, 2, 1.5], [-37, -5, 2, 1.5]];
    for (const [x, y, r1, r2] of warts) {
      const yy = y * (ry / 31);
      out.push(foval(x, yy, r1 + 1, r2 + 0.9, angry ? '#ff9ad8' : '#ffbfdc'), foval(x, yy, r1, r2, angry ? '#fff0fb' : Q.wart), dot(x - r1 * 0.3, yy - r2 * 0.35, r1 * 0.25, '#ffffff', r2 * 0.25));
    }
    // A slim gold tiara crowning the cap.
    const ty = -ry + 1.4;
    out.push(fpoly([[-13, ty + 2.2], [13, ty + 2.2], [12, ty - 1], [-12, ty - 1]], Q.gold));
    [5, 8, 12, 8, 5].forEach((h, i) => {
      const x = (i - 2) * 5.6;
      out.push(poly([[x - 2.6, ty], [x, ty - h], [x + 2.6, ty]], Q.gold), fpoly([[x, ty - h], [x + 2.6, ty], [x + 0.4, ty]], Q.goldDk));
      out.push(dot(x, ty - h + 0.4, i === 2 ? 1.8 : 1.1, i === 2 ? (angry ? Q.hot : '#ff7fb8') : Q.glow));
    });
    out.push(line([[-12, ty + 0.6], [12, ty + 0.6]], 0.6, Q.goldDk), ...gem(0, ty + 0.2, 1.9, angry ? '#ff4fae' : '#ff8fc8'));
  });

  // Front arm and the staff: a gnarled crook with a glowing mushroom lantern in a bubble.
  const lift2 = angry && att < 0 ? -9 : 0;
  // The slam: the staff hoisted high (held through the wind-up), driven down, planted.
  const su = key(att, [-17, -6, 0, 0, -1.5], 0);
  within(dead ? rot(88, 111, -0.07) : shift(0, su), () => {
    const sy = 30 + bob * 0.6 + lift2;
    out.push(taper([[88, 111], [86.6, 80], [86, 50 + lift2 * 0.5], [85, sy]], 4.2, 3, Q.wood), line([[87.8, 105], [86.4, 72], [86, sy + 6]], 0.8, Q.woodLt, 3),
      oval(86.4, 96, 2.8, 2, Q.wood), oval(85.4, 58 + lift2 * 0.5, 2.6, 1.8, Q.wood));
    out.push(taper([[85, sy + 1], [84, sy - 6], [87, sy - 12], [93, sy - 12.5], [95.4, sy - 8], [93, sy - 4.8]], 3.6, 1.8, Q.wood), line([[84.6, sy - 3], [86.4, sy - 10.4], [92, sy - 11.6]], 0.7, Q.woodLt, 3));
    const ox = 91;
    const oy = sy - 1;
    const orb = att === 0 || att === 2 ? 8.4 : angry ? 7.6 : 6.4 + pulse * 0.5;
    out.push(foval(ox, oy, orb + 1, orb + 1, angry ? '#ffb3e6' : dead ? '#d8d2e2' : '#b6fff0'), foval(ox, oy, orb, orb, angry ? '#ffd6f2' : dead ? '#ece8f2' : '#e2fffa'));
    out.push(line([[92.8, sy - 5], [91.6, oy - 1]], 0.8, Q.gown), oval(91.4, oy + 0.4, 3.6, 2.3, glow, 0, 14), line([[91.4, oy + 1.4], [91.4, oy + 4]], 1.2, Q.gown), dot(90.2, oy - 0.2, 0.9, '#ffffff'));
    out.push(dot(ox + orb * 0.45, oy - orb * 0.5, 1, '#ffffff'));
    if (angry) {
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * TAU + 0.4 + (att === 0 ? 0.4 : 0);
        out.push(sparkle(ox + Math.cos(a) * (orb + 4), oy + Math.sin(a) * (orb + 4), 2.6, k % 2 ? '#ffffff' : '#ffc6ec'));
      }
    }
  });
  // The sleeve and the hand gripping the staff.
  const hy2 = top + 13 + (angry ? -6 : 0) + (dead ? 4 : 0) + su;
  out.push(poly([[62, top + 1], [71, top + 3], [80, hy2 - 6], [88, hy2 + 2], [77, hy2 + 7], [66, top + 14]], Q.robe), poly([[62, top + 1], [66, top + 14], [71, top + 12], [68, top + 3]], Q.robeDk),
    line([[79, hy2 - 6], [88.5, hy2 + 2], [77, hy2 + 7]], 1.6, Q.gold), ...ball(85.6, hy2 + 0.6, 3.8, 3.6, Q.skin, { dark: Q.skinDk, hi: false }), line([[83.6, hy2 + 2.6], [87.6, hy2 + 1.4]], 0.6, Q.skinDk));
  out.push(...spores(true));
  // The slam's spore burst: speed streaks as the staff drops, a shock ring and a puff of spores
  // where it strikes, billowing out and drifting away.
  if (att === 1) for (const dx of [-6, 0, 6]) out.push(line([[91 + dx, 30], [91 + dx * 0.8, 44]], 0.9, '#ffffff'));
  if (att >= 2 && att <= 4) {
    const k = [0, 0, 0.15, 0.6, 1][att];
    out.push(...impact(88, 110.6, 18, k, ['#ffd6f0', '#c9fff4', Q.capLt], 3));
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (1.05 + (i / 10) * 0.9);
      const d = 8 + k * 26 + (i % 3) * 3;
      const r = (2.2 + (i % 3) * 0.8) * (1 - k * 0.45);
      const x = Math.min(97 - r, 82 + Math.cos(a) * d * 1.15);
      const y = 106 + Math.sin(a) * d * 0.75 - k * 6;
      const c = i % 3 ? Q.glow : '#ff9ad2';
      out.push(dot(x, y, r + 0.8, mix(c, '#ffffff', 0.55)), dot(x, y, r, c), dot(x - r * 0.3, y - r * 0.3, r * 0.35, '#ffffff'));
    }
  }
  // Weight: she rises tall as the staff goes up and sinks into the robe as it lands.
  const sq = key(att, [0.012, -0.005, -0.025, -0.012, 0], walk ? Math.sin(ph * 2) * -0.012 : Math.sin(ph) * 0.008);
  const shapes = bend(out, { cx: 52, top: 70, floor: 111, sx: 1 - sq * 0.6, sy: 1 + sq });
  // Headroom for the tiara.
  return { w: 100, h: 122, res: 3, shapes: shapes.map((q) => ({ ...q, y: q.y + 10 })) };
}

// ---------- The Behemoth ----------

const B = {
  fur: '#8e5170', furDk: '#6b3a58', furLt: '#b27390', belly: '#d49bab', mane: '#552c49', plate: '#6970b6', plateDk: '#4a4e8e', plateLt: '#9ca3e2',
  gold: '#ffd36b', goldDk: '#cf9440', horn: '#4b3c66', hornLt: '#7a68a6', tusk: '#fff3dc', tuskDk: '#dfcaa6', hoof: '#3e3250', snout: '#e7a2b9',
  fire: '#ff7a45', fire2: '#ffbf4d', fire3: '#fff2b8', smoke: '#cbbfd9', mouth: '#4a1f3a',
};

// The Behemoth's eye: no white at all, just an ember in a sooty socket, a flame licking back off it.
// Squints, blinks, and x's still read through it.
function ember(ex, ey, mood, glance = 0, flick = 0.5) {
  const angry = mood === 'angry';
  const out = [foval(ex, ey, 4.8, 4.4, '#2a1830'), foval(ex + 0.3, ey + 0.3, 4, 3.6, '#4a1f3a')];
  if (mood === 'blink') return [...out, line(arcPts(ex, ey, 3.6, 1.4, 15, 165), 1.3, B.fire2)];
  if (mood === 'hurt') return [...out, line([[ex + 3, ey - 2.6], [ex - 2.2, ey], [ex + 3, ey + 2.6]], 1.4, B.fire2)];
  if (mood === 'dead') return [...out, line([[ex - 2.4, ey - 2.4], [ex + 2.4, ey + 2.4]], 1.1, '#8a7d92'), line([[ex - 2.4, ey + 2.4], [ex + 2.4, ey - 2.4]], 1.1, '#8a7d92')];
  if (mood === 'happy') return [...out, line(arcPts(ex, ey + 1.6, 3.4, 2.8, 200, 340), 1.5, B.fire2), line(arcPts(ex, ey + 1.6, 3.4, 2.8, 225, 315), 0.6, B.fire3)];
  const gx = ex + glance * 0.9;
  const big = angry ? 1.25 : 1;
  // The flame trail streaming back from the eye.
  const fl = (angry ? 7 : 4.6) + flick * 1.4;
  out.push(fpoly([[gx - 1.6, ey - 2.2 * big], [gx - fl * 0.6, ey - 3.6 * big - flick], [gx - fl, ey - 2.4 * big], [gx - fl * 0.7, ey - 1], [gx - 2.4, ey + 0.4]], angry ? '#ff5a4a' : B.fire));
  out.push(fpoly([[gx - 1.4, ey - 1.4], [gx - fl * 0.55, ey - 2.6 * big - flick * 0.6], [gx - fl * 0.6, ey - 1.4], [gx - 2, ey + 0.2]], B.fire2));
  out.push(foval(gx, ey, 3.2 * big, 3 * big, angry ? '#ff7a45' : '#ff9a4a'), foval(gx + 0.2, ey + 0.2, 2.3 * big, 2.2 * big, B.fire2), foval(gx + 0.4, ey + 0.3, 1.3 * big, 1.3 * big, angry ? '#ffffff' : B.fire3));
  out.push(dot(gx - 1, ey - 1, 0.7, '#ffffff'));
  return out;
}

function behemoth(pose, f, mood) {
  const walk = pose === 'walk';
  const att = pose === 'attack' ? f : -1;
  const n = walk ? 8 : 6;
  const p = att >= 0 ? att / 5 : f / n;
  const ph = p * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  // A heavy charging gallop: one big bound per stride, the head and flames trailing it. The attack
  // rears up on the hind legs, crashes the forehooves down, and gores upward.
  let bob = walk ? -2.8 * Math.sin(ph + 0.5) : Math.sin(ph) * 0.6;
  let pitch = walk ? 0.055 * Math.sin(ph) : 0;
  let headA = walk ? 0.07 * Math.sin(ph - 0.6) : 0.03 * Math.sin(ph) + (f === 3 && !walk ? -0.03 : 0);
  let jaw = walk ? 0.05 + 0.05 * Math.sin(ph * 2) : 0;
  let lower = 0;
  if (att >= 0) {
    bob = [-1, 2.6, 3.4, 1.2, 0.3][att];
    pitch = [-0.15, 0.04, 0.07, 0.02, 0][att];
    headA = [-0.12, 0.12, 0.2, -0.2, -0.04][att];
    jaw = [0.42, 0.3, 0.18, 0.45, 0.2][att];
  } else if (angry) {
    headA += 0.12;
    pitch += 0.04;
    bob += 1.4;
    jaw = 0.36;
  }
  if (hurt) {
    headA -= 0.26;
    pitch -= 0.06;
    jaw = 0.14;
  }
  if (dead) {
    lower = 10;
    headA = 0.02;
    pitch = 0.03;
    bob = 0;
    jaw = 0.2;
  }
  // Rearing pivots on the hind legs; everything else rocks about the middle of the body.
  const Tb = att >= 0 ? chain(shift(0, bob), rot(38, 64, pitch)) : chain(shift(0, bob + lower), rot(62, 54, pitch));
  const Th = chain(Tb, rot(88, 50, headA));
  const out = [];
  const flick = (k) => 1 + 0.22 * Math.sin(ph * 2 + k * 1.9);

  // Legs: a galloping rotary cycle; each foot sweeps back on the ground and swings forward in the air.
  const leg = (hip, phase, front, far) => {
    const h = Tb(...hip);
    let fx;
    let fy = 87.5;
    if (dead) {
      fx = h[0] + (front ? 11 : -11);
    } else if (att >= 0) {
      // Forehooves pawing high in the rear, then slammed down; hind hooves dug in.
      fx = h[0] + (front ? [9, 9, 7, 6, 4][att] : -7);
      fy = front ? [Math.min(87.5, h[1] + 16), 84, 87.5, 87.5, 87.5][att] : 87.5;
    } else if (walk) {
      const th = ph + phase * TAU;
      fx = h[0] + (front ? 3 : -2) + (front ? 9.5 : 8.5) * Math.cos(th);
      fy = 87.5 - (front ? 9 : 7.5) * Math.max(0, -Math.sin(th)) ** 0.8;
    } else if (angry) {
      fx = h[0] + (front ? 8 : -7);
    } else {
      fx = h[0] + (front ? 2 + Math.sin(ph) * 0.5 : -1.5);
    }
    const { k, f: ft } = knee(h, [fx, fy], 15.5, 15.5, front ? 1 : -1);
    const c = far ? B.furDk : B.fur;
    const res = [];
    res.push(oval(h[0], h[1] + 3, front ? 10 : 12, front ? 13 : 14, c), taper([h, k], front ? 15 : 16, 10.4, c, { n: 1 }), oval(k[0], k[1], 5.4, 5.2, c, 0, 16), taper([k, ft], 9.6, 7.4, far ? shade(B.furDk, -4) : B.furDk, { n: 1 }));
    // Shaggy fetlock tufts and an armored hoof with an ember crack.
    const ax = ft[0];
    const ay = ft[1];
    res.push(fpoly([[ax - 5, ay - 3], [ax - 6.4, ay + 0.6], [ax - 3, ay - 0.6], [ax - 1.6, ay + 1.6], [ax + 0.8, ay - 0.4], [ax + 3, ay + 1.4], [ax + 4.6, ay - 3]], far ? B.mane : shade(B.mane, 6)));
    res.push(poly([[ax - 4.8, ay], [ax + 4.6, ay], [ax + 5.8, ay + 4], [ax - 4.6, ay + 4]], B.hoof), line([[ax + 0.6, ay + 0.4], [ax + 0.6, ay + 3.8]], 0.6, shade(B.hoof, -10)));
    if (!far) res.push(line([[ax - 3, ay + 1.4], [ax - 1.4, ay + 2.4], [ax - 2.2, ay + 3.4]], 0.6, dead ? '#7a6a80' : B.fire2), line([[ax - 4, ay + 0.6], [ax + 4.4, ay + 0.6]], 0.9, B.plateLt));
    return res;
  };

  // The tail with a flame tuft.
  within(Tb, () => {
    const tw = walk ? Math.sin(ph - 1.2) * 2.6 : key(att, [-2.4, 2.6, 1.6, -0.8, 0], Math.sin(ph - 0.8) * 1);
    out.push(taper([[16, 44], [9, 40 + tw * 0.3], [5, 34 + tw * 0.5], [6, 28 + tw]], 5, 2.4, B.furDk));
    if (!dead) out.push(...flame(6, 30 + tw, 9 * flick(5) * (angry ? 1.4 : 1), 3.4, -3 + tw, [B.fire, B.fire2, B.fire3]));
    else out.push(dot(5, 24 + tw, 2.4, B.smoke), dot(3, 19 + tw, 1.6, B.smoke));
  });

  // Far legs, then the body masses.
  out.push(...leg([42, 60], walk ? 0.08 : 0, false, true), ...leg([86, 60], 0.58, true, true));
  within(Tb, () => {
    out.push(...ball(32, 53, 22, 21, B.fur, { dark: B.furDk }), ...ball(58, 52, 32, 22, B.fur, { dark: B.furDk }), ...ball(76, 44, 22, 21, B.fur, { dark: B.furDk }));
    out.push(foval(60, 66, 25, 7.4, B.belly));
    for (let i = 0; i < 5; i++) {
      const x = 38 + i * 9;
      const y = 70.5 - (i > 3 ? 1.5 : 0);
      out.push(poly([[x - 5, y - 1], [x - 2, y + 4.4], [x, y + 1.4], [x + 2.6, y + 5.2], [x + 5, y - 1]], B.furDk));
    }
    // Fur strokes over the haunch and shoulder.
    for (const [x, y, a] of [[24, 46, 0.6], [30, 52, 0.5], [22, 56, 0.7], [70, 40, -0.4], [78, 46, -0.2], [64, 44, -0.3]]) {
      out.push(line([[x, y], [x + Math.cos(a) * 6, y + Math.sin(a) * 6 + 2]], 0.8, x < 50 ? B.furDk : B.furLt, 3));
    }
  });

  // A mane of flame licking up between the armor plates.
  within(Tb, () => {
    const base = [[16, 40], [24, 33], [33, 30], [41, 30], [50, 30], [58, 28], [65, 24], [72, 20], [80, 18], [87, 21]];
    base.forEach(([x, y], i) => {
      if (dead) {
        if (i % 2 === 0) out.push(dot(x - 1, y - 5 - (f % 2) * 2, 2.4, B.smoke), dot(x - 3, y - 10 - (f % 2) * 2, 1.6, B.smoke));
        return;
      }
      const flare = att >= 0 ? [1.05, 1, 1.35, 1.25, 1.1][att] : angry ? 1.55 : hurt ? 0.6 : 1;
      const h = Math.min(y + 7, (11 + (i % 3) * 4 + Math.min(i, 6) * 0.9) * flick(i) * flare);
      // The flames stream back with speed and whip a beat behind the body's bound.
      const lean = walk ? -5 - (i % 2) * 2.5 - Math.sin(ph - 1 - i * 0.25) * 2.5 : att >= 0 ? [3, -6, -2, 4, 0][att] - (i % 2) : -1.5 + Math.sin(ph * 2 + i) * 2;
      out.push(...flame(x, y + 3, h, 5.4 + (angry ? 1.2 : 0), lean, angry ? ['#ff5a4a', B.fire, '#fff6d0'] : [B.fire, B.fire2, B.fire3]));
    });
  });

  // The armored carapace: banded plates, a gold trim, rivets, and spikes.
  within(Tb, () => {
    const top = [[12, 50], [13, 40], [19, 33], [31, 29], [45, 29], [58, 27], [69, 21], [81, 18], [91, 22]];
    const outer = top.map(([x, y]) => [x, y - 2]);
    const inner = top.map(([x, y], i) => [x + (i < 2 ? 4 : 0), y + (i === 0 ? 6 : 11)]);
    out.push(C(poly([...outer, ...[...inner].reverse()], B.plate)));
    out.push(line(spline(top.slice(1, 9).map(([x, y]) => [x, y + 1]), 3), 1.6, B.plateLt));
    for (let i = 1; i < 8; i++) {
      const a = outer[i];
      const b = inner[i];
      out.push(line([a, b], 1.4, B.plateDk), line([[a[0] + 1.2, a[1] + 1], [b[0] + 1.2, b[1] - 0.5]], 0.6, B.plateLt));
    }
    out.push(taper(spline(inner, 3), 2.8, 2.8, B.gold, { n: 1, flat: true }));
    for (let i = 1; i < 8; i++) out.push(dot(lerp(inner[i][0], inner[i + 1][0], 0.5), lerp(inner[i][1], inner[i + 1][1], 0.5) - 0.2, 0.8, B.goldDk));
    for (let i = 2; i < 9; i++) {
      const [x, y] = outer[i];
      const hgt = 7 + (i > 5 ? 3 : 0);
      out.push(poly([[x - 3.2, y + 1.5], [x - 2.6, y - hgt], [x + 3.2, y + 1.5]], B.plateDk), fpoly([[x - 2.6, y - hgt], [x + 3.2, y + 1.5], [x, y + 1.5]], B.plate), dot(x - 2.2, y - hgt + 2, 0.5, B.plateLt));
    }
  });

  // Near rear leg.
  out.push(...leg([34, 62], walk ? 0 : 0, false, false));

  // The head: helm plate, horns, ember eye, snout, and great tusks.
  within(Th, () => {
    out.push(taper([[88, 44], [83, 33], [77, 25], [77, 16], [81, 10]], 7, 1.2, shade(B.horn, -8), { tip: true }));
    // Shaggy mane around the neck.
    out.push(poly([[78, 30], [86, 34], [90, 42], [92, 56], [94, 70], [88, 66], [86, 74], [82, 66], [78, 72], [76, 62], [72, 64], [74, 52], [70, 46]], B.mane));
    // Far tusk peeking out beyond the snout.
    out.push(taper([[103, 70], [110, 70], [115, 63], [117, 55], [116, 48]], 5, 0.8, B.tuskDk, { tip: true }));
    // Ear.
    out.push(poly([[86, 42], [76, 32], [75, 40], [80, 49]], B.furDk), fpoly([[84, 42], [78, 35.6], [77.6, 40.6], [81, 46]], '#c77d98'));
    // Skull and snout.
    out.push(...ball(96, 55, 16, 15, B.fur, { dark: B.furDk }));
    out.push(poly([[99, 46], [110, 51], [117, 55], [120.5, 60], [121, 68], [116, 72.5], [104, 72], [96, 66]], B.fur), fpoly([[100, 64], [116, 70], [104, 71.6], [97, 67]], B.belly));
    // The jaw (opens when roaring) and the mouth inside.
    within(rot(98, 68, jaw), () => {
      if (jaw > 0.05) {
        out.push(fpoly([[98, 64], [116, 68], [114, 74], [99, 72]], B.mouth));
        out.push(fpoly([[103, 65.4], [105, 69.4], [107, 65.8]], '#fffaf0'), fpoly([[109, 66.4], [110.6, 70], [112.4, 66.8]], '#fffaf0'));
        if (angry) out.push(dot(104, 69, 2.2, B.fire, 1.6), dot(104, 69, 1, B.fire3));
        if (dead) out.push(oval(108, 74, 3.4, 2.4, '#ff8fb0', 0.2, 14), line([[106.6, 73.2], [109.6, 75]], 0.4, '#d9667f'));
      }
      out.push(poly([[96, 67], [112, 71.4], [115, 73.4], [105, 78.4], [94, 74]], B.furDk), fpoly([[99, 70], [111, 72.8], [104, 76], [96, 73]], shade(B.belly, -6)));
      out.push(fpoly([[105, 72], [106.6, 68.6], [108.2, 72.4]], '#fffaf0'));
    });
    // Nose disc.
    out.push(...ball(118.4, 63, 3.6, 5.6, B.snout, { dark: shade(B.snout, -14), hi: false }), foval(119.2, 60.6, 0.8, 1.3, B.mouth), foval(119.2, 65.2, 0.8, 1.3, B.mouth), dot(117.6, 58.6, 0.9, '#ffe4ee'));
    // The helm plate over brow and snout, with a ridge spike.
    out.push(C(poly([[84, 42], [96, 37], [107, 43], [116, 51], [117, 55.6], [109, 53.6], [101, 50.4], [91, 53]], B.plate)));
    out.push(line([[90, 52], [101, 49.6], [109, 52.6], [116.4, 55]], 1.6, B.gold, 3), line([[90, 43.4], [100, 40], [108, 45.2]], 0.9, B.plateLt, 3));
    out.push(poly([[95, 39.6], [99, 29], [104, 41]], B.plateDk), fpoly([[99, 29], [104, 41], [100, 40.6]], B.plate));
    out.push(dot(94, 46, 0.9, B.goldDk), dot(106, 47.6, 0.9, B.goldDk));
    // One burning ember eye in a sooty socket under the helm.
    out.push(...ember(102.6, 55.6, mood, walk ? 0.4 : att >= 0 ? 0.6 : Math.sin(ph + 0.6) * 0.9, (Math.sin(ph * 2) + 1) / 2));
    if (angry) out.push(line([[97, 50.6], [107, 53.8]], 1.8, B.plateDk));
    // Huge curved tusks with gold rings.
    out.push(taper([[106, 72], [113.4, 73], [119, 67], [122, 57.6], [121, 47]], 7, 1, B.tusk, { tip: true }), line([[108, 73.4], [114, 72.6], [119.4, 66], [121.6, 57]], 0.8, B.tuskDk, 3));
    out.push(line([[109, 70], [109.6, 75.4]], 2.4, B.gold), line([[109.6, 70.2], [110, 75.2]], 0.6, '#fff0b0'));
    for (const t of [0.45, 0.62]) {
      const q = spline([[106, 72], [113.4, 73], [119, 67], [122, 57.6], [121, 47]], 4)[Math.round(t * 16)];
      out.push(line([[q[0] - 2.2, q[1] - 0.6], [q[0] + 2.2, q[1] + 0.6]], 0.5, B.tuskDk));
    }
    // The near horn: obsidian with ridged rings, sweeping back and up.
    const hp = [[92, 44], [88, 32], [82, 23], [82, 13], [87, 7]];
    out.push(taper(hp, 9.4, 1.4, B.horn, { tip: true }), line(spline(hp, 3).slice(1, 9).map(([x, y]) => [x + 1.6, y]), 0.9, B.hornLt));
    const hs = spline(hp, 4);
    for (const i of [3, 6, 9, 12]) {
      const [x, y] = hs[i];
      out.push(line([[x - 3.6 + i * 0.2, y + 0.6], [x + 3.2 - i * 0.2, y - 0.8]], 0.7, shade(B.horn, -12)));
    }
  });

  // Near front leg, in front of the chest.
  out.push(...leg([80, 62], 0.5, true, false));

  // Smoke snorting out of the nostrils (and blasting during the wind-up).
  if (!dead) {
    const [nx, ny] = Th(119.5, 66);
    const puffs = angry ? 4 : happy ? 3 : walk ? 2 : 1;
    for (let k = 0; k < puffs; k++) {
      const u = (k / puffs + p) % 1;
      const r = (angry ? 2.6 : 1.8) + u * (angry ? 3.4 : 2.4);
      const x = Math.min(124 - r, nx + 1 + u * 4);
      const y = Math.min(90 - r, ny + 6 + u * (angry ? 14 : 11));
      const c = mix(B.smoke, '#ffffff', 0.25 + u * 0.35);
      out.push(oval(x, y, r, r * 0.8, c, 0, 16), oval(x - r * 0.7, y + r * 0.35, r * 0.62, r * 0.55, c, 0, 14), oval(x + r * 0.6, y + r * 0.3, r * 0.55, r * 0.5, c, 0, 14), foval(x + r * 0.2, y - r * 0.3, r * 0.4, r * 0.25, '#ffffff'));
    }
    if (angry) out.push(sparkle(nx + 2, ny - 6, 2.2, B.fire2), sparkle(nx - 6, ny + 10, 1.6, B.fire3));
  }
  // The stomp: a shock ring of embers and dust under the forehooves; then the gore's fiery streak.
  if (att >= 2) out.push(...impact(94, 91.6, 26, [0, 0, 0.15, 0.55, 0.95][att], ['#ffcf8a', B.fire3, B.smoke], 5));
  if (att === 3) out.push(...swoosh(100, 64, 15, 85, -55, 4, B.fire2, '#fff6d0'));
  if (att === 2) out.push(sparkle(108, 84, 5, B.fire3), sparkle(84, 86, 3, '#ffffff'));
  // Weight: the body gathers low before rearing and squashes as the hooves land.
  const sq = key(att, [0.015, -0.01, -0.035, -0.01, 0], walk ? Math.cos(ph + 0.5) * 0.018 : Math.sin(ph) * 0.008);
  const shapes = bend(out, { cx: 62, top: 60, floor: 91.5, sx: 1 - sq * 0.5, sy: 1 + sq });
  // Extra headroom for the flames.
  return { w: 124, h: 100, res: 3, shapes: shapes.map((q) => ({ ...q, y: q.y + 8 })) };
}

// ---------- The Hollow Heart (Elder Treant) ----------

const G = {
  bark: '#8a6a80', barkDk: '#654a63', deep: '#3d2b40', barkLt: '#ad8ea4', root: '#7b5d72', moss: '#86c99a', mossDk: '#5fa67c', mossLt: '#bfeec4',
  hole: '#24182d', vein: '#c77dff', veinHot: '#ff8af0', heart: '#d65cff', core: '#ffe0ff', eye: '#ffd84a', eyeHot: '#ff8a3d',
  leaf: '#e58cff', leaf2: '#8ff0d8', fungus: '#ffae8a', fungusLt: '#ffd8bf', tooth: '#f1e3cb',
};

// The trunk's left and right edges, top to bottom.
const TRUNK_L = [[58, 40], [52, 46], [46, 56], [41, 70], [40, 86], [44, 104], [47, 122], [45, 140], [38, 156], [28, 167]];
const TRUNK_R = [[94, 40], [100, 46], [106, 56], [111, 70], [113, 86], [109, 104], [105, 122], [108, 140], [115, 156], [124, 167]];
const edgeAt = (side, y) => {
  for (let i = 1; i < side.length; i++) {
    if (y <= side[i][1]) {
      const [x0, y0] = side[i - 1];
      const [x1, y1] = side[i];
      return lerp(x0, x1, clamp((y - y0) / (y1 - y0), 0, 1));
    }
  }
  return side[side.length - 1][0];
};

function treant(pose, f, mood) {
  const walk = pose === 'walk';
  const att = pose === 'attack' ? f : -1;
  const n = walk ? 8 : 6;
  const ph = att >= 0 ? att * 0.9 : (f / n) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const pulse = att >= 0 ? [1, 0.7, 1, 0.8, 0.5][att] : (Math.sin(ph) + 1) / 2;
  // A slow lurch: the trunk heaves forward and slumps onto it, then hauls its roots after it.
  // The slam heaves both root arms overhead and brings them crashing down.
  const heave = walk ? Math.sin(ph) + 0.35 * Math.sin(ph * 2) : 0;
  let sway = walk ? 3.4 * heave : att >= 0 ? [-3, 1.5, 4, 3, 1][att] : 0.8 * Math.sin(ph);
  let lean = att >= 0 ? [-0.06, 0.01, 0.045, 0.035, 0.01][att] : walk ? 0.012 * heave : 0;
  let drop = att >= 0 ? [-2, 1.5, 5, 4, 1][att] : walk ? 2.2 * Math.max(0, Math.sin(ph - 0.4)) ** 2 : (1 + Math.sin(ph)) * 0.5;
  const look = walk ? 0.6 : att >= 0 ? 0.4 : Math.sin(ph + 1) * 1.6;
  if (angry && att < 0) lean = -0.05;
  if (hurt) lean = -0.08;
  if (dead) {
    lean = 0.06;
    drop = 9;
    sway = 0;
  }
  // The trunk sways from its roots: the higher, the further; it slumps when dead.
  const Tw = (x, y) => {
    const k = Math.max(0, 162 - y) / 120;
    const [rx, ry] = rot(76, 164, lean)(x + sway * k, y);
    return [rx, ry + drop * k];
  };
  const glowC = angry ? G.veinHot : dead ? '#8a7d92' : mix(G.vein, G.veinHot, pulse * 0.6);
  const out = [];

  // Roots: far ones behind, near ones in front. Their tips writhe.
  const root = (pts, w, c) => {
    // Walking, the root tips drag back along the floor and slide up again as the trunk lurches on.
    const drag = walk && !dead ? -3.2 * Math.sin(ph - 1) : 0;
    const wob = pts.map(([x, y], i) => (i < 2 ? [x, y] : [x + (Math.sin(ph + i + pts[0][0]) * (dead ? 0 : 1.2) + drag) * (i / pts.length), Math.min(169.5, y + Math.cos(ph + i) * (dead ? 0 : 1) * (i / pts.length))]));
    return [taper(wob, w, 2, c, { tip: true }), line(wob.slice(0, -1).map(([x, y]) => [x + 1, y - w * 0.18]), 1, G.barkLt, 3)];
  };
  out.push(...root([[52, 154], [38, 160], [24, 163], [12, 162], [6, 157]], 12, G.barkDk), ...root([[100, 154], [116, 158], [130, 160], [140, 157], [144, 151]], 12, G.barkDk));

  // Root-tentacle arms: a chain of segments that curl and writhe, ending in three claws.
  const arm = (base, a0, bend, segs, len, w0, phase, far) => {
    const pts = [base];
    let a = a0;
    let [x, y] = base;
    for (let i = 0; i < segs; i++) {
      a += bend + (dead ? 0 : (walk ? 0.16 : att >= 0 ? 0.03 : 0.08) * Math.sin(ph + phase - i * 0.9)) + (att === 1 ? 0.06 * (far ? 1 : -1) : 0);
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      if (dead) y = Math.min(y, 164);
      x = clamp(x, 8, 142);
      y = clamp(y, 8, 166);
      pts.push([x, y]);
    }
    const c = far ? G.barkDk : G.bark;
    const res = [];
    // Claws.
    for (const da of [-0.65, 0, 0.65]) {
      const ca = a + da;
      const cx = x + Math.cos(ca) * 10;
      const cy = y + Math.sin(ca) * 10;
      res.push(taper([[x, y], [lerp(x, cx, 0.5) + Math.cos(ca + 1.2) * 1.6, lerp(y, cy, 0.5) + Math.sin(ca + 1.2) * 1.6], [cx, cy]], 4.6, 0.6, far ? G.deep : G.barkDk, { tip: true }));
    }
    res.push(taper(pts, w0, 5, c));
    res.push(line(spline(pts, 3).map(([px, py]) => [px, py - 1.6]).slice(1, -2), 1, far ? G.bark : G.barkLt, 1));
    // Thorny twigs and a knot along the arm.
    for (const i of [2, 4]) {
      const [px, py] = pts[i];
      res.push(taper([[px, py], [px + 3, py - 6]], 2.2, 0.4, c, { tip: true }));
    }
    res.push(oval(pts[1][0], pts[1][1], 3, 2.4, far ? G.deep : G.barkDk, 0, 12));
    hands.push([x, y]);
    return res;
  };
  const hands = [];
  let fa = { a0: 2.75, bend: -0.13 };
  let na = { a0: 0.3, bend: 0.13 };
  if (angry) {
    fa = { a0: -2.45, bend: 0.17 };
    na = { a0: -0.75, bend: -0.17 };
  } else if (hurt) {
    fa = { a0: 2.8, bend: 0.12 };
    na = { a0: 0.25, bend: -0.12 };
  } else if (dead) {
    fa = { a0: 2.0, bend: 0.0 };
    na = { a0: 1.1, bend: -0.05 };
  }
  if (att >= 0 && !dead) {
    // Raised high and curled over (held), sweeping out, slammed flat on the floor, then lifting.
    fa = { a0: [-1.95, -3.05, -3.9, -3.9, -3.55][att], bend: [0.13, 0.08, -0.02, -0.02, -0.06][att] };
    na = { a0: [-1.2, -0.15, 0.78, 0.78, 0.45][att], bend: [-0.13, -0.08, 0.02, 0.02, 0.06][att] };
  } else if (walk && !angry && !hurt && !dead) {
    // The arms swing heavily against the lurch.
    fa = { a0: fa.a0 - 0.12 * heave, bend: fa.bend };
    na = { a0: na.a0 - 0.12 * heave, bend: na.bend };
  }
  out.push(...arm(Tw(48, 86), fa.a0, fa.bend, 7, 9, 13, 0, true));

  // A crown of dead branches with a few glowing leaves.
  const tips = [];
  const branch = (x, y, a, len, w, d, seed) => {
    const bend = (rnd(seed) - 0.5) * 0.5 + (dead ? 0.25 : 0);
    const mx = x + Math.cos(a) * len * 0.5 + Math.cos(a + 1.57) * bend * 4;
    const my = y + Math.sin(a) * len * 0.5 + Math.sin(a + 1.57) * bend * 4;
    const ex = x + Math.cos(a + bend * 0.4) * len;
    const ey = Math.max(4, y + Math.sin(a + bend * 0.4) * len);
    out.push(taper([[x, y], [mx, my], [ex, ey]], w, Math.max(1.2, w * 0.55), d === 0 ? G.barkDk : G.barkDk, { n: 3 }));
    if (d < 2) {
      const spread = 0.5 + rnd(seed + 3) * 0.15;
      branch(ex, ey, a - spread + (dead ? 0.35 : 0), len * 0.62, w * 0.58, d + 1, seed * 3 + 1);
      branch(ex, ey, a + spread * 0.8 + (dead ? 0.35 : 0), len * 0.55, w * 0.55, d + 1, seed * 3 + 2);
    } else {
      out.push(taper([[ex, ey], [ex + Math.cos(a) * 4, ey + Math.sin(a) * 4]], 1.2, 0.3, G.barkDk, { tip: true }));
      tips.push([ex, ey, a, seed]);
    }
  };
  within(Tw, () => {
    branch(54, 56, -2.75, 21, 9, 0, 1);
    branch(60, 46, -2.2, 19, 10, 0, 2);
    branch(71, 42, -1.8, 17, 10, 0, 3);
    branch(84, 42, -1.28, 17, 10, 0, 4);
    branch(94, 46, -0.9, 19, 10, 0, 5);
    branch(100, 56, -0.4, 21, 9, 0, 6);
  });
  // Glowing leaves on some branch tips (fallen, dull ones when dead).
  tips.forEach(([x, y, a, seed], i) => {
    if (i % 2 && i % 3) return;
    const flut = Math.sin(ph * 2 + i) * 0.35;
    const la = a + 0.9 + flut;
    const c = angry ? (i % 2 ? '#ff6b9a' : '#ff9a4a') : dead ? '#9b8aa0' : i % 3 === 0 ? G.leaf2 : G.leaf;
    let [lx, ly] = Tw(x, y);
    if (dead) {
      // Fallen, dull leaves on the floor.
      lx = 14 + ((i * 37) % 118);
      ly = 165;
      out.push(foval(lx, ly, 3.4, 1.4, c));
      return;
    }
    out.push(foval(lx + Math.cos(la) * 2.6, ly + Math.sin(la) * 2.6, 4.2, 2.2, mix(c, '#ffffff', 0.5), la), foval(lx + Math.cos(la) * 2.6, ly + Math.sin(la) * 2.6, 3.2, 1.5, c, la),
      dot(lx + Math.cos(la) * 3.2, ly + Math.sin(la) * 3.2, 0.7, '#ffffff'));
  });

  // The trunk.
  within(Tw, () => {
    const body = [...TRUNK_L, ...[...TRUNK_R].reverse()];
    out.push(poly(body, G.bark));
    // Shaded back side and lit front ridge.
    out.push(poly([...TRUNK_L, ...TRUNK_L.map(([x, y]) => [x + (y > 150 ? 14 : 9), y]).reverse()], G.barkDk));
    out.push(F(taper(TRUNK_R.slice(1, 8).map(([x, y]) => [x - 4, y]), 2.2, 2.2, G.barkLt, { n: 3 })));
    // Bark ridges running up the trunk (kept off the face).
    for (let i = 0; i < 9; i++) {
      const u = 0.08 + i * 0.105;
      const central = u > 0.26 && u < 0.8;
      const spans = central ? [[44, 58], [108, 160]] : [[46, 162]];
      for (const [y0, y1] of spans) {
        const pts = [];
        for (let y = y0; y <= y1; y += 8) {
          const l = edgeAt(TRUNK_L, y);
          const r = edgeAt(TRUNK_R, y);
          pts.push([l + (r - l) * u + Math.sin(y * 0.11 + i * 2.3) * 1.6, y]);
        }
        if (pts.length > 1) out.push(taper(pts, 1.1, 2.4, u < 0.3 ? G.deep : G.barkDk, { flat: true, n: 3 }));
      }
    }
    // Knots.
    for (const [x, y, r] of [[52, 146, 3], [100, 134, 2.4], [96, 52, 2]]) out.push(foval(x, y, r + 1, r + 1.4, G.barkDk), foval(x + 0.3, y + 0.2, r * 0.6, r * 0.8, G.deep));
    // Moss on the shoulders.
    for (const [x, y, rx, ry] of [[52, 52, 9, 5], [62, 46, 8, 4.6], [97, 50, 9, 5], [106, 62, 5, 4], [44, 64, 5, 4.4]]) {
      out.push(oval(x, y, rx, ry, G.mossDk, 0, 18), oval(x + 0.8, y - 0.8, rx * 0.84, ry * 0.76, G.moss, 0, 18), dot(x + rx * 0.3, y - ry * 0.4, 1, G.mossLt));
    }
    // Bracket fungi stacked on the side.
    for (const [x, y, r] of [[45, 114, 6], [43, 121, 5], [47, 127, 4]]) {
      out.push(poly(ovalPts(x, y, r, r * 0.5, 14, 0, Math.PI, TAU), G.fungus), line(arcPts(x, y - 0.4, r * 0.8, r * 0.36, 200, 340, 6), 0.6, G.fungusLt), line([[x - r, y], [x + r, y]], 0.8, shade(G.fungus, -18)));
    }
    // Corruption veins branching out from the heart.
    const veins = [[[76, 126], [62, 118], [52, 108], [48, 96]], [[76, 126], [90, 116], [100, 108], [104, 96]], [[76, 126], [60, 138], [50, 150], [44, 158]], [[76, 126], [92, 140], [102, 152], [112, 160]],
      [[76, 126], [76, 140], [72, 152], [74, 162]], [[62, 118], [56, 124], [50, 126]], [[90, 116], [98, 122], [104, 120]], [[52, 108], [46, 104]]];
    for (const v of veins) out.push(taper(v, 2.4, 0.8, mix(glowC, G.deep, 0.15), { flat: true, n: 3 }), line(v.slice(0, 3), 0.7, mix(glowC, '#ffffff', 0.4), 3));
    for (const [x, y] of [[52, 108], [100, 108], [50, 150], [102, 152], [48, 96]]) out.push(dot(x, y, 1.3, mix(glowC, '#ffffff', 0.4)));
    // The heart cavity: a jagged split in the bark with the corrupted heart beating inside.
    const hole = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      const r = i % 2 ? 0.78 : 1;
      hole.push([76 + Math.cos(a) * 13 * r, 127 + Math.sin(a) * 16 * r]);
    }
    out.push(poly(hole.map(([x, y]) => [76 + (x - 76) * 1.2, 127 + (y - 127) * 1.15]), G.barkDk), F(poly(hole, G.hole)));
    const hk = dead ? 0.62 : 0.74 + pulse * 0.1 + (angry ? 0.14 : 0);
    const hc = dead ? '#7d6f86' : angry ? '#ff5ce0' : G.heart;
    if (!dead) out.push(foval(76, 128, 10.4, 12.4, mix(hc, G.hole, 0.72)), foval(76, 128, 13 * hk, 14 * hk, mix(hc, G.hole, 0.5)));
    const hp = (k, c) => fpoly([[76, 140 * 1 - (1 - k) * 0 + (k - 1) * 12], ...arcPts(70.5, 124, 6.2 * k, 6.4 * k, 140, 330, 7).map(([x, y]) => [76 + (x - 76) * 1, 128 + (y - 128) * 1]), ...arcPts(81.5, 124, 6.2 * k, 6.4 * k, 210, 400, 7)].map(([x, y]) => [76 + (x - 76) * k, 128 + (y - 128) * k]), c);
    out.push(hp(hk, shade(hc, -18)), hp(hk * 0.86, hc), hp(hk * 0.45, dead ? '#9b90a2' : G.core));
    out.push(dot(72 - hk, 122.6, 1.5 * hk, '#ffffff'));
    if (dead) out.push(line([[74, 120], [78, 128], [74, 134]], 0.8, G.hole));
    // Splinters jutting over the cavity edge.
    for (const [x, y, a] of [[64, 120, -0.4], [88, 118, -2.6], [66, 138, 0.5], [87, 139, 2.7]]) out.push(taper([[x, y], [x + Math.cos(a) * 6, y + Math.sin(a) * 6]], 2.6, 0.4, G.barkLt, { tip: true }));

    // The face: heavy brows over glowing hollows, a knot nose, and a jagged maw.
    const eyes = [[65, 73, -1], [90, 73, 1]];
    for (const [x, y, s] of eyes) {
      const ry = angry ? 7.4 : 9;
      out.push(foval(x, y, 9.4, ry + 1, G.deep), foval(x + s * 0.4, y + 0.6, 8.2, ry, G.hole));
      const ec = angry ? G.eyeHot : G.eye;
      const ex = x + 1.2 + look * 1.3;
      const ey = y + 1.4;
      if (mood === 'blink') out.push(line(arcPts(ex, ey - 1, 5, 2, 15, 165), 1.6, G.eye));
      else if (mood === 'happy') out.push(line(arcPts(ex, ey + 2, 5, 4.4, 200, 340), 2, G.eye), line(arcPts(ex, ey + 2, 5, 4.4, 220, 320), 0.8, '#fffbe0'));
      else if (hurt) out.push(line([[ex - s * 4.6, ey - 4], [ex + s * 3, ey], [ex - s * 4.6, ey + 4]], 1.8, G.eye));
      else if (dead) out.push(line([[ex - 3.6, ey - 3.6], [ex + 3.6, ey + 3.6]], 1.4, '#7a6d84'), line([[ex - 3.6, ey + 3.6], [ex + 3.6, ey - 3.6]], 1.4, '#7a6d84'));
      else {
        const r = angry ? 4.6 : 4 + pulse * 0.3;
        out.push(foval(ex, ey, r + 1.6, r + 1.8, mix(ec, G.hole, 0.55)), foval(ex, ey, r, r * 1.08, ec), foval(ex, ey + 0.4, r * 0.5, r * 0.56, angry ? '#fff3c0' : '#fffbe0'), dot(ex - r * 0.4, ey - r * 0.5, 1.1, '#ffffff'));
        if (!angry) out.push(foval(ex + s * 0.6, ey + 0.4, 1, r * 0.72, G.hole));
      }
    }
    // Brows: grumpy by default, fierce when angry, lifted when smug, slack when dead.
    const browDrop = { angry: 6, happy: -3, hurt: -2, dead: -1 }[mood] ?? 3;
    const browY = { angry: 66, happy: 60, dead: 67, hurt: 62 }[mood] ?? 65;
    for (const [x, s] of [[65, -1], [90, 1]]) {
      const inner = x - s * 9;
      const outer = x + s * 12;
      const yi = browY + (mood === 'hurt' ? -2 : browDrop);
      const yo = browY - (mood === 'hurt' ? -3 : browDrop * 0.4);
      out.push(C(poly([[outer + s * 2, yo - 6], [inner + s * 1, yi - 7], [inner - s * 3, yi + 0.5], [lerp(inner, outer, 0.5), lerp(yi, yo, 0.5) + 2], [outer + s * 1, yo + 1.5]], G.deep)));
      out.push(fpoly([[outer + s * 1.5, yo - 5.2], [inner + s * 1, yi - 6.2], [inner - s * 1.6, yi - 1.6], [lerp(inner, outer, 0.5), lerp(yi, yo, 0.5) - 1]], G.barkDk));
      out.push(line([[outer + s * 1, yo - 5], [inner + s * 0.6, yi - 6]], 1.1, G.barkLt));
    }
    // A knot nose.
    out.push(oval(80, 86, 4.6, 3.6, G.barkDk, 0, 16), oval(80.6, 85.2, 3.6, 2.8, G.bark, 0, 16), dot(81.6, 84.2, 1, G.barkLt), foval(78.4, 87.6, 1, 0.7, G.deep), foval(82.6, 87.6, 1, 0.7, G.deep));
    // The maw.
    const mouths = {
      idle: { top: [[60, 96], [70, 98], [79, 98.6], [88, 98], [97, 95]], bot: [[93, 101], [86, 106], [78, 107], [70, 106], [63, 101]] },
      angry: { top: [[58, 92], [68, 94], [79, 93], [90, 94], [99, 91]], bot: [[97, 102], [92, 113], [80, 118], [68, 113], [60, 102]] },
      hurt: { top: [[70, 98], [75, 96], [80, 97], [85, 96], [89, 98]], bot: [[88, 104], [84, 107], [79, 106], [74, 107], [70, 104]] },
      dead: { top: [[63, 99], [72, 98], [80, 98], [88, 99], [94, 100]], bot: [[92, 103], [86, 109], [79, 110], [71, 109], [65, 103]] },
      happy: { top: [[57, 90], [67, 96], [79, 97.6], [90, 96], [100, 89]], bot: [[95, 98], [87, 105], [78, 107], [69, 105], [62, 98]] },
    };
    const mo = mouths[mood] ?? mouths.idle;
    const maw = [...mo.top, ...mo.bot];
    out.push(poly(maw.map(([x, y]) => [79 + (x - 79) * 1.08, 100 + (y - 100) * 1.14]), G.barkDk), F(poly(maw, G.hole)));
    const mb = mo.bot;
    const gy = (mb[1][1] + mb[3][1]) / 2;
    out.push(foval(79, gy - 2, 8, 3.4, angry ? '#a03fd0' : mix(G.vein, G.hole, 0.5)), foval(79, gy - 1.4, 4, 1.6, angry ? '#ff8af0' : mix(G.vein, G.hole, 0.2)));
    // Splintered teeth from both lips.
    const tline = spline(mo.top, 3);
    for (let i = 2; i < tline.length - 2; i += 3) {
      const [x, y] = tline[i];
      const h = angry ? 5 : 3.4;
      out.push(fpoly([[x - 1.8, y - 0.4], [x + 0.2, y + h], [x + 1.8, y - 0.4]], G.tooth));
    }
    const bline = spline(mo.bot, 3);
    for (let i = 3; i < bline.length - 3; i += 4) {
      const [x, y] = bline[i];
      out.push(fpoly([[x - 1.6, y + 0.4], [x + 0.4, y - (angry ? 4.4 : 3)], [x + 1.6, y + 0.4]], G.tooth));
    }
  });

  // Near roots over the base.
  out.push(...root([[60, 158], [46, 164], [30, 167.5], [16, 167], [8, 162]], 14, G.bark), ...root([[76, 160], [80, 166], [90, 169], [102, 169]], 11, G.bark), ...root([[94, 158], [110, 164], [126, 167], [138, 164], [145, 158]], 14, G.bark));
  // Glowing toadstools at the base.
  for (const [x, h, c] of [[34, 6, G.leaf], [40, 4, G.leaf2], [118, 5, G.leaf]]) {
    const y = 163;
    out.push(line([[x, y], [x, y - h]], 1.6, '#f1e3cb'), oval(x, y - h, 3, 2, dead ? '#9b8aa0' : c, 0, 12), dot(x - 0.8, y - h - 0.6, 0.6, '#ffffff'));
  }
  // The near arm.
  out.push(...arm(Tw(104, 86), na.a0, na.bend, 7, 10, 15, 1.7, false));

  // Corrupted motes drifting around.
  if (!dead) {
    for (let i = 0; i < 6; i++) {
      const u = (rnd(i + 7) + f / n) % 1;
      const x = 14 + rnd(i) * 122 + Math.sin(u * TAU + i) * 4;
      const y = 150 - u * 130;
      out.push(dot(x, y, 1.6, mix(glowC, '#ffffff', 0.5)), dot(x, y, 0.9, glowC));
    }
  }
  // The slam: the heart flares in the wind-up, then the floor cracks and heaves where each arm lands.
  if (att === 0 && !dead) {
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU + 0.3;
      const [hx, hy] = Tw(76 + Math.cos(a) * 19, 128 + Math.sin(a) * 21);
      out.push(sparkle(hx, hy, k % 2 ? 2.6 : 3.6, k % 2 ? G.veinHot : '#ffffff'));
    }
  }
  if (att >= 2 && !dead) {
    const k = [0, 0, 0.1, 0.55, 0.95][att];
    hands.forEach(([x], i) => out.push(...impact(clamp(x, 26, 124), 167, 24, k, [mix(G.veinHot, '#ffffff', 0.4), '#ffe0ff', G.barkDk], 11 + i * 7)));
  }
  if (att === 1) for (const [x, y] of hands) out.push(sparkle(x, y, 4, '#ffe0ff'));
  return { w: 150, h: 170, res: 3, shapes: out };
}

// ---------- The Crystal Dragon King ----------

const D = {
  body: '#ad9cf0', bodyDk: '#8574d0', bodyLt: '#d4c9ff', belly: '#f1e9ff', bellyDk: '#cdbff2', crys: '#bdf1ff', crysDk: '#82c7e6', crysLt: '#f2fdff',
  pink: '#ffbfe6', pinkDk: '#e98ac4', lav: '#ddd0ff', gold: '#ffd36b', goldDk: '#d0943f', goldLt: '#fff1b6', gem: '#ff5fa8', gem2: '#4fdcff', gem3: '#6effb0',
  ermine: '#fffaf4', ermineDk: '#e7dcf0', mouth: '#3d2a6b', eye: '#46ddff',
};
const CRYS = [D.crys, D.crysLt, '#ffffff'];
const CRYS_DK = [D.crysDk, D.crys, D.crysLt];
const PINK = [D.pink, '#ffe3f4', '#ffffff'];

function dragon(pose, f, mood) {
  const walk = pose === 'walk';
  const att = pose === 'attack' ? f : -1;
  const n = walk ? 8 : 6;
  const ph = att >= 0 ? att * 1.1 : (f / n) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const s = Math.sin(ph);
  const pulse = (s + 1) / 2;
  // A heavy royal stomp: each foot lifts high and slams down, the body dropping onto it with a jolt;
  // the wings, tail, and head settle a beat behind. The attack raises the scepter overhead, wings
  // flared, then slams it down with a crystal flash.
  const liftN = walk ? Math.max(0, s) ** 0.8 * 8 : 0;
  const liftF = walk ? Math.max(0, -s) ** 0.8 * 8 : 0;
  const step = walk ? Math.cos(ph) * 7.5 : 0;
  let bob = walk ? -Math.abs(Math.sin(ph - 0.35)) * 2.8 + 0.8 : Math.sin(ph) * 0.8;
  let flap = walk ? Math.sin(ph * 2 - 0.8) * 0.08 : Math.sin(ph) * 0.05;
  const tail = walk ? Math.sin(ph - 1) * 1.3 : att >= 0 ? [-1.2, 1, 1.6, 0.6, 0][att] : Math.sin(ph - 0.7) * 0.7;
  let headA = walk ? Math.sin(ph * 2 - 1.2) * 0.04 : Math.sin(ph) * 0.025;
  let bodyA = walk ? Math.sin(ph) * 0.025 : 0;
  const look = walk ? 0.5 : att >= 0 ? 0.8 : Math.sin(ph + 1) * 1.3;
  let open = 0;
  let drop = 0;
  if (angry) {
    open = 0.3;
    headA = -0.1;
    flap = 0;
  }
  if (att >= 0) {
    bob = [-1.4, 0.6, 2.6, 1.6, 0.4][att];
    bodyA = [-0.05, 0.015, 0.04, 0.025, 0.005][att];
    headA = [-0.16, -0.02, 0.1, 0.05, -0.02][att];
    open = [0.4, 0.35, 0.3, 0.2, 0.1][att];
    flap = [0.2, -0.04, -0.12, -0.06, 0][att];
  }
  if (happy) headA -= 0.06;
  if (hurt) {
    headA = -0.2;
    bodyA = -0.06;
    open = 0.05;
  }
  if (dead) {
    headA = 0.45;
    drop = 8;
    open = -0.45;
    bodyA = 0.08;
    flap = 0;
    bob = 0;
  }
  const Tb = chain(shift(0, bob + drop), rot(78, 140, bodyA));
  const wingA = att >= 0 ? flap : flap + open;
  const Th = chain(Tb, rot(90, 70, headA));
  const out = [];

  // Wings: crystal panes between gold-jointed spars, half spread behind the back.
  const wing = (sx, sy, k, a, dark) => {
    within(chain(Tb, rot(sx, sy, a), shift(sx, sy)), () => {
      const P = (x, y) => [x * k, y * k];
      const S = [0, 0];
      const El = P(-18, -28);
      const W = P(-40, -46);
      const tipsW = [P(-60, -40), P(-63, -16), P(-53, 6), P(-35, 17)];
      const panes = [[W, tipsW[0], tipsW[1]], [W, tipsW[1], tipsW[2]], [W, tipsW[2], tipsW[3], El], [El, tipsW[3], P(-14, 14), S]];
      const cols = dark ? [D.crysDk, '#b7a6e8', '#d79ad0', '#a99ae0'] : [D.crys, D.lav, D.pink, '#cfe9ff'];
      panes.forEach((pn, i) => {
        const a1 = pn[1];
        const a2 = pn[2];
        const mid = lerp2(lerp2(a1, a2, 0.5), pn[0], 0.24);
        const pts = [pn[0], a1, mid, a2, ...pn.slice(3)];
        out.push(poly(pts, cols[i]));
        const cx = pts.reduce((v, q) => v + q[0], 0) / pts.length;
        const cy = pts.reduce((v, q) => v + q[1], 0) / pts.length;
        out.push(fpoly([lerp2(pn[0], [cx, cy], 0.3), lerp2(a1, [cx, cy], 0.35), [cx, cy]], mix(cols[i], '#ffffff', dark ? 0.2 : 0.55)));
        out.push(fpoly([[cx, cy], lerp2(a2, [cx, cy], 0.4), lerp2(mid, [cx, cy], 0.2)], shade(cols[i], -8)));
        if (!dark) out.push(line([lerp2(pn[0], a1, 0.3), lerp2(pn[0], a1, 0.62)], 0.8, '#ffffff'));
      });
      const spar = dark ? D.bodyDk : D.body;
      for (const t of tipsW) out.push(taper([W, t], 3.2 * k, 1, spar, { tip: true }));
      out.push(taper([S, El, W], 8 * k, 4.6 * k, spar), line([lerp2(S, El, 0.2), El, lerp2(El, W, 0.8)], 1, dark ? D.body : D.bodyLt, 3));
      out.push(...shard(W[0], W[1], -1.9, 11 * k, 4 * k, dark ? CRYS_DK : CRYS, { noShine: dark }));
      out.push(foval(El[0], El[1], 2.6, 2.6, dark ? D.goldDk : D.gold), foval(W[0], W[1], 3, 3, dark ? D.goldDk : D.gold), dot(W[0] - 0.6, W[1] - 0.8, 1, D.goldLt));
    });
  };
  wing(74, 68, 0.84, 0.16 + flap * 1.2 + (att >= 0 ? flap * 0.4 : open * 0.9), true);

  // Tail: a faceted, tapering crystal tail that sways, tipped with a shard cluster.
  {
    const [hx, hy] = Tb(62, 124);
    const tp = [[hx, hy], [46, 132], [30, 139 - tail], [17, 141 - tail * 0.5], [9 + tail * 2, 133 - tail * 2], [11 + tail * 3, 122 - tail * 2]];
    const sp = spline(tp, 4);
    out.push(taper(tp, 22, 4, D.bodyDk));
    out.push(taper(tp.map(([x, y], i) => [x + (i ? 0.5 : 0), y - 1.6]), 16, 2.6, D.body));
    for (let i = 2; i < sp.length - 3; i += 2) {
      const [x, y] = sp[i];
      const w = lerp(8, 2.2, i / sp.length);
      out.push(fpoly([[x - w * 0.6, y - w * 0.15], [x, y - w * 0.5], [x + w * 0.6, y - w * 0.15], [x, y + w * 0.2]], i % 4 ? D.bodyLt : D.lav));
      if (i % 4 === 0) {
        const [x2, y2] = sp[i + 1];
        const a = Math.atan2(y2 - y, x2 - x) - Math.PI / 2 - 0.5;
        out.push(...shard(x, y - w * 0.4, a, w * 1.1 + 2, w * 0.8 + 1, CRYS, { noShine: true }));
      }
    }
    const [ex, ey] = sp[sp.length - 1];
    out.push(...shard(ex, ey + 2, -1.2, 11, 5, CRYS), ...shard(ex - 1, ey + 3, -2.1, 9, 4.4, PINK), ...shard(ex + 1, ey + 3, -0.4, 8, 4, CRYS));
  }

  // Legs: chunky digitigrade legs with crystal claws.
  const leg = (hipX, footX, lift, far) => {
    const [tx, ty] = Tb(hipX, 116);
    const ay = 141.5 - lift;
    const ax = footX;
    const c = far ? D.bodyDk : D.body;
    const res = [];
    const k = knee([tx, ty + 4], [ax, ay], 14, 14, 1).k;
    res.push(taper([[tx, ty + 4], k], 15, 10, far ? shade(D.bodyDk, -4) : D.bodyDk, { n: 1 }), taper([k, [ax, ay]], 10, 8, far ? shade(D.bodyDk, -4) : D.bodyDk, { n: 1 }));
    res.push(...ball(tx, ty + 2, 12.5, 15, c, { dark: far ? shade(D.bodyDk, -6) : D.bodyDk, hi: false }));
    if (!far) res.push(fpoly([[tx - 2, ty - 8], [tx + 6, ty - 10], [tx + 9, ty - 1], [tx + 2, ty + 1]], D.bodyLt), fpoly([[tx - 9, ty + 6], [tx - 3, ty + 3], [tx - 1, ty + 12], [tx - 7, ty + 13]], shade(D.body, -6)));
    res.push(poly([[ax - 7, ay - 3], [ax + 9, ay - 1], [ax + 14, ay + 4], [ax + 13, ay + 8], [ax - 7, ay + 8]], c), line([[ax - 5, ay + 5], [ax + 10, ay + 5]], 0.7, far ? D.bodyDk : D.bodyDk));
    for (const [dx, dy] of [[14, 6], [10, 7.2], [5, 7.8]]) res.push(...shard(ax + dx - 1, ay + dy - 1.4, 0.35, 4.4, 3, far ? CRYS_DK : CRYS, { noShine: true }));
    res.push(...shard(ax - 6, ay + 2, 2.9, 5, 3, far ? CRYS_DK : CRYS, { noShine: true }));
    return res;
  };
  out.push(...leg(62, 58 - step, liftF, true));

  // Near wing.
  wing(66, 72, 1, wingA, false);

  // Crystal spines along the back and neck.
  within(Tb, () => {
    for (const [x, y, a, l] of [[60, 104, -2.95, 10], [58, 92, -2.75, 12], [62, 80, -2.5, 12], [72, 70, -2.2, 11], [84, 60, -2.1, 10]]) {
      out.push(...shard(x, y, a, l * (angry ? 1.25 : 1), 6, angry ? PINK : CRYS));
    }
  });

  // Far arm, tucked behind the body.
  within(Tb, () => {
    out.push(taper([[70, 88], [62, 100], [68, 108]], 9, 6.4, D.bodyDk), oval(69, 108, 4.4, 3.8, D.bodyDk, 0, 16), ...shard(72, 110, 0.9, 4, 2.4, CRYS_DK, { noShine: true }));
  });

  // The body: a crystal torso with a scaled belly, facets, and a gem-studded chest.
  within(Tb, () => {
    out.push(...ball(79, 103, 26, 31, D.body, { dark: D.bodyDk, hi: false }));
    out.push(fpoly([[62, 88], [70, 80], [74, 92], [66, 100]], shade(D.body, -5)), fpoly([[90, 78], [100, 88], [94, 92]], D.bodyLt), fpoly([[60, 112], [68, 106], [70, 122], [62, 124]], shade(D.body, -7)));
    out.push(oval(91, 108, 14, 23, D.bellyDk, 0, 26), oval(92, 107, 12.6, 21.6, D.belly, 0, 26));
    for (let k = 0; k < 6; k++) {
      const y = 98 + k * 5.6;
      const w = 12 * Math.sqrt(Math.max(0, 1 - ((y - 107) / 22) ** 2));
      out.push(line(arcPts(92, y - 2.2, w, 3, 25, 155, 6), 0.8, D.bellyDk));
    }
    // Chest plate: a gold shield set with a great heart gem and smaller stones.
    const cy = 95;
    out.push(poly([[78, cy - 8], [98, cy - 9], [100, cy + 1], [89, cy + 12], [77, cy + 2]], D.goldDk), poly([[79, cy - 7], [97, cy - 8], [98.6, cy + 0.6], [89, cy + 10.4], [78.4, cy + 1.6]], D.gold));
    out.push(line([[80, cy - 6], [96, cy - 7]], 0.8, D.goldLt));
    const hk = 1 + pulse * 0.08 + (angry ? 0.15 : 0);
    const heart = (k, c) => fpoly([[88.5, cy + 7 * k], ...arcPts(85.5, cy - 1, 3.4 * k, 3.4 * k, 140, 330, 6).map(([x, y]) => [88.5 + (x - 88.5) * k, cy + (y - cy)]), ...arcPts(91.5, cy - 1, 3.4 * k, 3.4 * k, 210, 400, 6).map(([x, y]) => [88.5 + (x - 88.5) * k, cy + (y - cy)])], c);
    out.push(heart(hk * 1.2, '#a8336f'), heart(hk, angry ? '#ff3f98' : D.gem), heart(hk * 0.5, '#ffb3d6'), dot(86.6, cy - 2, 1.1, '#ffffff'));
    out.push(...gem(80.6, cy - 4, 1.5, D.gem2), ...gem(96.2, cy - 5, 1.5, D.gem3), ...gem(81, cy + 3, 1.2, D.gem3), ...gem(95.4, cy + 2.4, 1.2, D.gem2));
    if (angry) out.push(sparkle(88.5, cy - 1, 7, '#ffffff'));
  });

  // Near leg.
  out.push(...leg(80, 92 + step, liftN, false));

  // Neck and head.
  within(Th, () => {
    out.push(taper([[84, 84], [89, 68], [96, 54]], 24, 17, D.body), taper([[93, 82], [97, 68], [102, 56]], 8, 6, D.belly));
    for (let k = 0; k < 4; k++) out.push(line([[92 + k * 2.4, 78 - k * 6.6], [99 + k * 1.8, 77 - k * 6.4]], 0.7, D.bellyDk));
    // Far horn, behind the head.
    out.push(...shard(94, 28, -2.55, 22, 7, CRYS_DK, { noShine: true }));
    // Cheek frills.
    out.push(...shard(91, 46, 2.75, 12, 6, CRYS), ...shard(92, 51, 2.4, 9, 5, PINK));
    // Skull, snout, and jaw.
    out.push(...ball(99, 40, 16, 14.4, D.body, { dark: D.bodyDk }));
    out.push(fpoly([[90, 30], [100, 26], [106, 32], [96, 36]], D.bodyLt));
    within(rot(103, 51, angry ? 0.42 : hurt ? 0.12 : dead ? 0.16 : 0), () => {
      if (angry || hurt || dead) {
        out.push(fpoly([[102, 47], [127, 48], [124, 56], [104, 56]], D.mouth));
        if (angry) out.push(foval(110, 52, 7, 3, '#7fe8ff'), foval(110, 52, 3.6, 1.6, '#ffffff'));
      }
      out.push(poly([[100, 50], [116, 52], [127, 51], [125, 55.6], [113, 58.6], [101, 57]], D.bodyDk), fpoly([[103, 53], [117, 54.4], [124, 53.2], [114, 57]], D.lav));
      // Crystal goatee, regal.
      out.push(...shard(106, 57, 1.9, 8, 4, CRYS), ...shard(110, 57.6, 1.6, 6, 3.4, PINK, { noShine: true }));
      out.push(fpoly([[120, 52], [121.4, 48.6], [122.8, 52.2]], '#ffffff'), fpoly([[113, 52.4], [114.2, 49.4], [115.4, 52.6]], '#ffffff'));
    });
    out.push(poly([[100, 31], [113, 33], [124, 37], [130, 42], [130, 48], [124, 50.4], [111, 51], [100, 50]], D.body));
    out.push(fpoly([[102, 33], [113, 34.6], [124, 38.4], [128.6, 42.6], [114, 38]], D.bodyLt), line([[105, 47.4], [126, 48.4]], 0.6, D.bodyDk));
    out.push(foval(127, 42, 1.3, 0.9, D.mouth), dot(121, 41.4, 0.9, D.bodyLt));
    if (!(angry || hurt || dead)) {
      if (happy) out.push(line([[108, 49.4], [117, 50.6], [125, 48.4], [127.4, 46]], 0.9, INK, 3));
      else out.push(line([[109, 49.8], [118, 50.6], [126, 49.4]], 0.8, INK, 3));
      out.push(fpoly([[117.6, 50.4], [118.8, 53.6], [120.2, 50.4]], '#ffffff'));
    }
    // Brow crest and the glowing eye.
    // A dragon's eye: all glowing iris (no white) split by a slit pupil.
    out.push(...[].concat(eye(107.6, 39.6, 4.4, 5.2, mood, { iris: D.eye, hot: '#ff4fc8', white: angry ? '#ffd1ef' : '#c9f6ff', lid: D.body, slit: true, s: 1, look: 1.1, glance: look * 0.6, smug: happy, dIn: 0.24 })));
    out.push(C(poly([[100, 33], [108, 31.4], [116, 34.4], [114, 35.6], [107, 34], [101, 36]], D.bodyDk)));
    if (angry) out.push(line([[101, 34.4], [113, 37.2]], 1.6, D.bodyDk));
    if (!dead) out.push(dot(113.6, 45.6, 2.2, BLUSH, 1));
    // Near horn.
    out.push(...shard(97, 28, -2.75, 27, 8.4, CRYS));
    out.push(...shard(104, 28, -2.1, 10, 4.4, PINK, { noShine: true }));
    // The crown, a touch askew (and slipping off when defeated).
    within(dead ? chain(shift(-6, 4), rot(100, 26, -0.6)) : rot(100, 26, -0.12), () => {
      const ty = 25;
      out.push(poly([[88, ty + 3], [112, ty + 3], [111, ty - 2], [89, ty - 2]], D.goldDk), fpoly([[89, ty + 2.2], [111, ty + 2.2], [110.4, ty - 1.4], [89.6, ty - 1.4]], D.gold));
      [6, 9, 13, 9, 6].forEach((h, i) => {
        const x = 90 + i * 5;
        out.push(poly([[x - 2.6, ty - 1.6], [x, ty - h], [x + 2.6, ty - 1.6]], D.gold), fpoly([[x, ty - h], [x + 2.6, ty - 1.6], [x + 0.6, ty - 1.6]], D.goldDk), dot(x, ty - h, i === 2 ? 1.7 : 1.1, i % 2 ? D.gem2 : D.gem));
      });
      out.push(line([[89.6, ty + 0.4], [110.4, ty + 0.4]], 0.6, D.goldLt), ...gem(100, ty + 0.4, 2, D.gem));
    });
  });

  // An ermine collar wrapped around the base of the neck: a fluffy scalloped band with dark tail tips.
  within(Tb, () => {
    const topE = arcPts(87, 72, 15, 5, 160, 20, 10);
    const bot = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      const a = Math.PI * (0.06 + t * 0.88);
      bot.push([87 + Math.cos(a) * 17, 75 + Math.sin(a) * 9 + (k % 2 ? 2 : 0)]);
    }
    out.push(poly([...topE, ...bot], D.ermineDk), poly([...topE.map(([x, y]) => [x + 0.6, y + 0.4]), ...bot.map(([x, y]) => [x + (x - 87) * -0.06, y - 1.6])], D.ermine));
    for (const [x, y] of [[75, 79], [87, 84.6], [98.6, 79]]) out.push(fpoly([[x - 0.9, y - 1.8], [x + 0.9, y - 1.8], [x + 0.4, y + 1.8], [x - 0.4, y + 1.8]], INK));
    out.push(line(arcPts(89, 74.6, 11, 4, 150, 30, 6), 0.6, D.ermineDk));
  });

  // The near arm and the prism scepter. The scepter is drawn upright about the hand, then turned:
  // resting it stands tall; the slam swings it from high over the head down into the floor.
  {
    const raise = angry && att < 0;
    let hand = dead ? Tb(104, 126) : raise ? [138, 82 + bob] : [129, 108 + bob];
    let ang = 0;
    let el = dead ? [94, 112] : raise ? [114, 90] : [108, 112];
    if (att >= 0 && !dead) {
      hand = [[133, 60], [124, 84], [123, 101], [124, 101], [129, 104]][att];
      ang = [0.12, 0.6, 2.7, 2.62, 0.1][att];
      el = [[116, 84], [112, 98], [106, 106], [106, 106], [108, 110]][att];
      hand = [hand[0], hand[1] + bob];
    }
    const drawScepter = () => {
      if (dead) {
        // Dropped on the floor.
        out.push(taper([[98, 148], [138, 146]], 3.2, 3.2, D.gold), line([[98, 147], [138, 145]], 0.8, D.goldLt));
        out.push(...shard(138, 146, -0.05, 11, 6, PINK), dot(98, 148, 2.2, D.goldDk));
        return;
      }
      const x = hand[0];
      const y0 = hand[1] + (raise ? 18 : 20);
      const y1 = hand[1] - (raise ? 40 : 26);
      within(rot(hand[0], hand[1], ang), () => {
        out.push(taper([[x, y0], [x, y1]], 3.4, 3.4, D.goldDk), line([[x + 0.6, y0 - 2], [x + 0.6, y1 + 2]], 1, D.goldLt));
        for (const t of [0.15, 0.5, 0.85]) out.push(line([[x - 2.6, lerp(y0, y1, t)], [x + 2.6, lerp(y0, y1, t)]], 1.6, D.gold));
        out.push(foval(x, y0, 2.8, 2.4, D.gold), oval(x, y1 + 1, 5.6, 2.6, D.gold, 0, 16), dot(x + 1.4, y1 + 0.4, 1, D.goldLt));
        // Prongs cradling the prism.
        out.push(taper([[x - 4.6, y1 + 1], [x - 6, y1 - 5], [x - 4, y1 - 9]], 1.8, 1, D.gold), taper([[x + 4.6, y1 + 1], [x + 6, y1 - 5], [x + 4, y1 - 9]], 1.8, 1, D.gold));
        const charged = att === 0 || att === 2;
        const gk = angry || charged ? 1.15 : 1;
        const gy = y1 - 9;
        const rr = (angry || charged ? 11 : 8.4 + pulse * 0.6) * gk * (att === 1 ? 0.8 : 1);
        out.push(foval(x, gy, rr, rr, angry || charged ? '#d4f7ff' : mix('#e6fbff', D.lav, 0.3)));
        out.push(fpoly([[x, gy - 13 * gk], [x + 5 * gk, gy - 4], [x + 4 * gk, gy + 5], [x, gy + 8 * gk], [x - 4 * gk, gy + 5], [x - 5 * gk, gy - 4]], D.pinkDk));
        out.push(fpoly([[x, gy - 13 * gk], [x + 5 * gk, gy - 4], [x + 4 * gk, gy + 5], [x, gy + 8 * gk], [x + 0.5, gy - 3]], D.pink), fpoly([[x, gy - 13 * gk], [x - 5 * gk, gy - 4], [x - 1, gy - 3]], '#ffe3f4'));
        out.push(fpoly([[x - 5 * gk, gy - 4], [x + 0.5, gy - 3], [x - 4 * gk, gy + 5]], D.crys), dot(x - 1.6, gy - 6, 1.2, '#ffffff'));
        const m = angry || charged ? 4 : 2;
        for (let k = 0; k < m; k++) {
          const a = ph + (k / m) * TAU;
          out.push(sparkle(x + Math.cos(a) * (rr + 2), gy + Math.sin(a) * (rr + 2), angry ? 3 : 2, k % 2 ? '#ffffff' : D.gem2));
        }
        if (att === 0) out.push(sparkle(x, gy - 2, 9, '#ffffff'), sparkle(x, gy - 2, 5, D.gem2));
        // Speed streaks behind the swing.
        if (att === 1) for (const dx of [-7, 0, 7]) out.push(line([[x + dx, gy - 4], [x + dx * 1.4 - 9, gy + 10]], 0.9, '#ffffff'));
      });
    };
    within(Tb, () => {
      const sh = [86, 90];
      const [ex, ey] = X(...el);
      out.push(taper([sh, el], 14, 11, D.bodyDk, { n: 1 }), taper([[sh[0] + 1, sh[1] - 1], el], 11, 9, D.body, { n: 1 }), oval(el[0], el[1], 5.6, 5.4, D.bodyDk, 0, 16), oval(el[0] + 0.5, el[1] - 0.5, 4.6, 4.4, D.body, 0, 16));
      out.push(T([[ex - 4.4, ey - 4], [hand[0] - 3, hand[1] - 4.4], [hand[0] - 2, hand[1] + 4.4], [ex + 2.4, ey + 5]], D.body), dot(ex, ey - 1, 1.6, D.bodyLt));
    });
    drawScepter();
    out.push(...ball(hand[0], hand[1], 5.2, 4.8, D.body, { dark: D.bodyDk, hi: false }));
    for (const dy of [-2.4, 0.4, 3.2]) out.push(...shard(hand[0] + 3, hand[1] + dy, 0.3 + dy * 0.05, 3.6, 2.4, CRYS, { noShine: true }));
  }

  // The slam's crystal flash: a burst of light where the prism strikes, and shards erupting from
  // the floor around it, shrinking back as the flash fades.
  if (att >= 2 && !dead) {
    const k = [0, 0, 0.15, 0.6, 0.95][att];
    const cx = 129;
    out.push(...impact(cx, 146, 18, k, ['#c9f6ff', '#ffffff', D.crysDk], 21));
    const grow = [0, 0, 1, 0.75, 0.35][att];
    for (const [dx, a, l] of [[-14, -2.1, 10], [-7, -1.85, 15], [8, -1.2, 13], [14, -0.95, 8], [0, -1.55, 18]]) {
      if (cx + dx > 146) continue;
      out.push(...shard(cx + dx, 147, a, l * grow, 5 * Math.max(0.5, grow), dx % 2 ? PINK : CRYS));
    }
    if (att === 2) out.push(foval(cx, 132, 14, 14, mix('#ffffff', D.crys, 0.3)), sparkle(cx, 132, 17, '#ffffff'), sparkle(cx, 132, 9, D.gem2), sparkle(cx - 12, 120, 4, D.pink));
    if (att === 3) out.push(sparkle(cx - 10, 124, 4, '#ffffff'), sparkle(cx + 8, 118, 3, D.gem2));
  }

  // Glints in the air.
  if (!dead) {
    for (let i = 0; i < 4; i++) {
      const u = (rnd(i + 3) + f / n) % 1;
      const x = 20 + rnd(i) * 110;
      const y = 20 + rnd(i + 9) * 90 - u * 10;
      out.push(sparkle(x, y, 1.6 + Math.sin(u * Math.PI) * 1.4, i % 2 ? '#ffffff' : '#c9f6ff'));
    }
  }
  // Weight: each stomp lands with a little squash; the slam sinks the whole body onto its legs.
  const sq = key(att, [0.012, -0.004, -0.03, -0.015, 0], walk ? -Math.max(0, Math.cos(ph * 2)) * 0.015 : Math.sin(ph) * 0.006);
  const shapes = bend(out, { cx: 80, top: 110, floor: 149, sx: 1 - sq * 0.5, sy: 1 + sq });
  return { w: 150, h: 150, res: 3, shapes };
}

export const ART = {
  mothercapper: { walk: 8, idle: 6, attack: 5, stride: 30, atkMs: [80, 150, 420, 220], draw: queen },
  tuskar: { walk: 8, idle: 6, attack: 5, stride: 34, atkMs: [70, 150, 380, 220], draw: behemoth },
  gnarlroot: { walk: 8, idle: 6, attack: 5, stride: 22, atkMs: [90, 160, 520, 260], draw: treant },
  crystalking: { walk: 8, idle: 6, attack: 5, stride: 30, atkMs: [80, 150, 450, 240], draw: dragon },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  mothercapper: { name: 'Myconid Queen', w: 70, h: 100 },
  tuskar: { name: 'Tuskar the Behemoth', w: 96, h: 72 },
  gnarlroot: { name: 'Gnarlroot, the Hollow Heart', w: 100, h: 150 },
  crystalking: { name: 'Prismaris, the Crystal King', w: 100, h: 130 },
};
