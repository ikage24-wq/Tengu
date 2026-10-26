// Monster art: bosses. Four big, layered designs with multi-frame motion:
//   mothercapper  the Myconid Queen: a mushroom matriarch in a lace veil and mycelium robe
//   tuskar        the Behemoth: an armored demon boar with burning eyes and a mane of flame
//   gnarlroot     the Hollow Heart: an ancient corrupted treant with a glowing purple heart
//   crystalking   the Crystal Dragon King: a crowned crystal dragon with a prism scepter
// Everything is built from polygons pushed through a small transform stack (`within`), so whole
// parts (a cap, a head, a wing) can tilt and bob as one piece. All face right, feet at the bottom.

import { E, T, F, C, INK, BLUSH, MOUTH, shade, mix } from './kit.js';
import { heroineHead, heroineBrows, heroineTop } from './heroine.js';
import { glowEye, brow, deadEye } from './faces.js';
import * as H from './hollow.js';

// The Myconid Queen and Tuskar are rigs built on the hollow module's joint transforms, ramps and
// shape helpers (the older two still use the transform stack below).
const { ID, joint, at, snapJ, place, squash, ik, chainPts, arm2, pawStep, timing, limb, limbR, fp, ov, fov, pg, mote, star, ramp, actOf, PURP } = H;
const rball = H.ball;
const rtaper = H.taper;
const rswoosh = H.swoosh;

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
// A mushroom matriarch: a huge spotted pink cap crowned with a tiara, a lace veil falling from its
// rim, silver-lilac hair, a mycelium-violet robe open over a cream gown, and a crooked staff with a
// glowing spore orb. Signature: the wide cap over a small regal face. Rig: waist > chest > neck >
// head (heroine face kit) > cap (lags the head); robe edges, hem, veil strands and hair locks are
// chains that trail the body a beat late; the staff rides the front hand (IK arm). She glides:
// the hem ripples back while the staff foot plants and the hand carries it on. The slam is
// telegraphed: the staff rises overhead and holds while the orb swells and a glowing ring marks
// the floor where it will land.

const QR = {
  cap: ramp('#e2679f'),
  wart: ramp('#fff1cf'),
  gill: ramp('#ffd9ea'),
  frill: ramp('#ffb3d6'),
  robe: ramp('#6f50ae', true),
  gown: ramp('#f6ecdf'),
  gold: ramp('#ffd36b'),
  wood: ramp('#86665a'),
  hair: ramp('#e3d4f4', true),
  skin: ramp('#fff3e6'),
  lace: ramp('#f6eefe', true),
  glow: '#6ff0da',
  glowHi: '#e6fff9',
  ink: '#3a2448',
};
const QK = 0.8;
const QFACE = {
  k: QK,
  lineK: 1.15,
  skin: '#fff3e6', skinSh: '#f2d3d6', skinSh2: '#d9aec4', blush: '#ff9fc0', lip: '#e0708f', lipLine: '#a8456a',
  bangs: [[-5.4, -2.6], [-3.4, -0.9], [-1.1, -3], [1, -0.5], [3.3, -3.4], [5.3, -1.3], [7.6, -3.4], [9.6, -0.7], [11.6, -2.8]],
  eye: { ry: 3.1, iris: '#2fae9c', irisDk: '#145466', irisLt: '#c6fff0', hot: '#ff5fc8', hotDk: '#8a1f66', pupil: 'round', pupilC: '#173040', tilt: 0.05, wing: 1.2, flicks: 1, lashLen: 1.4, ink: '#3a2448', crease: false, lower: '#e9b8cc', sparkle: true },
  brow: { c: '#9a82c0', kind: 'arch', w: 0.7 },
  moods: { idle: { mouth: 'soft' }, angry: { mouth: 'shout' }, hurt: { mouth: 'gasp' } },
};

function queen(pose, f, mood) {
  const { walk, att, p, it, br, hurt, dead, angry } = timing(pose, f, mood);
  const P = QR;
  const floor = 121;
  const u = f / 8;
  // The body: a stately glide (rise and settle twice a stride, a slow sway), a breathing idle with
  // a held top, and the slam: rise tall with the staff up (held), drive it down, sink, settle.
  let by;
  let lean;
  let dx = 0;
  let sq = 0;
  if (walk) {
    by = -1.1 * Math.sin(2 * p);
    lean = 0.03 + 0.02 * Math.sin(p);
    dx = 0.8 * Math.sin(p);
  } else if (att >= 0) {
    [by, lean, dx, sq] = [[-2.2, -0.08, -1.4, 0.03], [-3, -0.11, -1.8, 0.04], [2.8, 0.11, 1.8, -0.045], [2.2, 0.09, 1.5, -0.03], [0.6, 0.03, 0.4, 0]][att];
  } else {
    by = -0.9 * br;
    lean = 0.015 * Math.sin(it + 0.7);
    dx = 0.5 * Math.sin(it + 1);
    sq = 0.012 * br;
  }
  if (hurt) {
    lean = -0.12;
    dx -= 2;
    sq = -0.02;
  }
  if (dead) {
    lean = 0.12;
    by = 7;
    dx = 1;
  }
  const headA = (walk ? 0.03 * Math.sin(p - 0.8) : att >= 0 ? [-0.1, -0.14, 0.12, 0.1, 0.02][att] : 0.03 * Math.sin(it - 0.9)) + (hurt ? -0.16 : 0) + (dead ? 0.34 : 0) + (angry && att < 0 ? 0.06 : 0);
  const capA = (walk ? -0.03 * Math.sin(p - 1.6) : att >= 0 ? [-0.05, -0.07, 0.09, 0.06, -0.01][att] : -0.02 * Math.sin(it - 1.8)) + (hurt ? -0.06 : 0) + (dead ? 0.1 : 0);
  // Cloth lag: how far the hem, veil and hair trail behind (+ = swept back) per chain segment.
  const trail = (i, k = 1) => k * ((walk ? 0.05 + 0.05 * Math.sin(p - 1 - i * 0.7) : att >= 0 ? [-0.03, -0.05, 0.07, 0.05, 0.01][att] * (0.6 + i * 0.25) : 0.025 * Math.sin(it - 1.2 - i * 0.7)) + (hurt ? 0.08 : 0) + (dead ? -0.04 : 0));
  const MW = joint(ID, 50 + dx, 84 + by, lean);
  const MC = joint(MW, 0.6, -16, lean * 0.4 + (hurt ? -0.05 : 0));
  const MH = snapJ(joint(MC, 2, -11, headA));
  const MK = joint(MH, -0.4, -5.6, capA);
  const out = [];
  const hk = (pts) => pts.map(([x, y]) => [x * QK, y * QK]);

  // The veil: lace strands from under the cap's rim, behind her, each a chain trailing the cap.
  {
    const strands = [-31, -25, -19, -13, -7].map((x, j) => {
      const len = x < 0 ? 34 - Math.abs(x + 19) * 0.25 : 16;
      const top = at(MK, x, 2.6 + (Math.abs(x) / 32) ** 2 * 2.4);
      const a0 = Math.PI / 2 + headA + capA * 2;
      return chainPts(top[0], top[1], a0, 4, () => len / 4, (i) => trail(i, 1.3) * (0.6 + j * 0.03) + (x < 0 ? 0.02 : -0.03)).pts;
    });
    for (let j = 0; j < strands.length - 1; j++) {
      const A = strands[j];
      const B = strands[j + 1];
      out.push(fp([...A, ...[...B].reverse()], j % 2 ? P.lace.base : P.lace.sh));
      // Lace: two diamond holes per panel and a scalloped edge.
      for (const t of [1.5, 3]) {
        const m = [(A[Math.floor(t)][0] + B[Math.floor(t)][0]) / 2, (A[Math.floor(t)][1] + B[Math.floor(t)][1]) / 2 + (t % 1) * 4];
        out.push(fp([[m[0], m[1] - 1.4], [m[0] + 1, m[1]], [m[0], m[1] + 1.4], [m[0] - 1, m[1]]], P.lace.sh2));
      }
    }
    for (const S of strands) out.push(fov(S[4][0], S[4][1], 2.6, 1.5, P.lace.base, 0, 12), fov(S[4][0] - 0.4, S[4][1] + 0.5, 1.6, 0.7, P.lace.sh, 0, 10));
  }

  // Back hair: two long locks falling down her back, each a chain lagging the head.
  for (const [x, y, w, R] of [[-11, -1, 8, ramp(P.hair.sh, true)], [-6, 2, 7, P.hair]]) {
    const top = at(MH, x * QK, y * QK);
    const { pts } = chainPts(top[0], top[1], Math.PI / 2 + headA + 0.25, 4, () => 6.2, (i) => trail(i, 0.9) + (i ? -0.05 : 0));
    out.push(...limb(pts, w, 2.4, R.base, R.sh2), F(rtaper(pts.slice(0, 3).map(([a, b]) => [a + 1.6, b]), 1.4, 0.6, R.hi)));
  }

  // The robe: a mycelium-violet bell from the waist, its edges and hem hanging as chains.
  const hem = (x0, x1, k) => {
    const top = at(MW, x0, 0);
    const pts = [top];
    let ox = 0;
    for (let i = 1; i <= 4; i++) {
      const t = i / 4;
      ox -= trail(i, 1) * 6 * k;
      pts.push([lerp(top[0], 50 + dx * 0.4 + x1, t ** 0.85) + ox * t, lerp(top[1], floor - 0.6, t)]);
    }
    return pts;
  };
  {
    const L = hem(-10, -30, 1);
    const Rr = hem(10, 27, 0.8);
    const hemPts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = lerp(L[4][0], Rr[4][0], t);
      hemPts.push([x, floor - 0.6 - (i % 2 ? 1.6 : 0) - (walk ? 0.6 * Math.max(0, Math.sin(p * 2 - i * 0.8)) : 0)]);
    }
    out.push(pg([...L, ...hemPts.slice(1, 8), ...[...Rr].reverse()], P.robe.base));
    // The back of the robe in shadow, the fold lines lagging with the hem.
    const L2 = hem(-6, -15, 0.7);
    out.push(fp([...L, ...[...L2].reverse()], P.robe.sh));
    out.push(F(rtaper(hem(-1, -6, 0.5), 1, 2.4, P.robe.sh)), F(rtaper(hem(-12, -24, 0.9).slice(1), 0.8, 2, P.robe.sh2)));
    // The open front: the cream gown between gold-trimmed edges, with soft folds.
    const G1 = hem(1, -2, 0.55);
    const G2 = hem(9.4, 20, 0.75);
    out.push(fp([...G1, ...[...G2].reverse()], P.gown.base));
    out.push(fp([...G1, ...[...hem(4, 6, 0.6)].reverse()], P.gown.sh));
    for (const t of [0.45, 0.72]) {
      const a = lerp2(G1[Math.floor(t * 4)], G1[Math.ceil(t * 4)], (t * 4) % 1);
      const b = lerp2(G2[Math.floor(t * 4)], G2[Math.ceil(t * 4)], (t * 4) % 1);
      out.push(F(rtaper([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 1.4], b], 0.8, 0.8, P.gown.sh)));
    }
    for (const E2 of [G1, G2]) out.push(...limb(E2, 2.2, 2.6, P.gold.base, P.gold.sh2), F(rtaper(E2.map(([a, b]) => [a + 0.3, b]), 0.7, 0.8, P.gold.hi)));
    // Glowing mycelium threads and little toadstools along the hem.
    const pulse = dead ? 0 : att >= 0 ? [0.8, 1, 0.6, 0.4, 0.3][att] : 0.5 + 0.5 * Math.sin(walk ? p : it);
    out.push(F(rtaper([L[2], [L[2][0] + 5, L[2][1] + 6], [L[3][0] + 8, L[3][1] + 2], [L[4][0] + 12, L[4][1] - 3]], 0.7, 0.5, dead ? P.robe.hi : mix(P.robe.hi, P.glow, 0.5 + 0.4 * pulse))));
    for (const [t, s, c] of [[0.12, 1, P.glow], [0.28, 0.8, '#ff9ad2'], [0.86, 0.9, P.glow]]) {
      const x = lerp(L[4][0], Rr[4][0], t);
      out.push(...limb([[x, floor - 0.4], [x + 0.2, floor - 3 * s]], 1.2, 1, P.gown.base, P.gown.sh2), fov(x + 0.2, floor - 3.4 * s, 2.3 * s, 1.4 * s, shade(c, -30), 0, 12), fov(x + 0.4, floor - 3.6 * s, 1.8 * s, 1 * s, dead ? P.lace.sh : c, 0, 12));
    }
  }

  // Back arm: a bell sleeve that gestures (and flares open over the orb for the cast).
  {
    const Sb = at(MC, -6.4, 2);
    const [a1, a2] = dead ? [1.7, 0.1] : hurt ? [-2.4, -0.6] : att >= 0 ? [[-2.3, -0.4], [-2.5, -0.3], [2.2, -0.2], [2, -0.3], [1.9, -0.5]][att] : walk ? [1.9 + 0.12 * Math.sin(p + Math.PI), -0.5] : angry ? [-2.2, -0.5] : [2 - 0.05 * br, -0.6];
    const [El, Hd] = arm2(Sb, 9, 8, a1, a2);
    out.push(...limbR([Sb, El, Hd], 6.4, 8.4, ramp(P.robe.sh, true)), ...rball(Hd[0], Hd[1], 2.2, 2.1, P.skin, { hi: false }));
  }

  // The bodice and the ruffled collar.
  {
    const b = [];
    b.push(pg([[-9, 2], [9, 2], [10.4, 16], [-10.4, 16]], P.robe.base), fp([[-9, 2.4], [-2, 2.4], [-4, 16], [-10.2, 16]], P.robe.sh));
    b.push(fp([[1, 2.6], [8.6, 2.6], [8.2, 16], [2.4, 16]], P.gown.base), fp([[1, 2.6], [3.6, 2.6], [4, 16], [2.4, 16]], P.gown.sh));
    b.push(...limb([[1, 3], [2.4, 16]], 1.6, 1.8, P.gold.base, P.gold.sh2), ...limb([[8.6, 3], [8.6, 16]], 1.6, 1.8, P.gold.base, P.gold.sh2));
    b.push(fp([[-10.4, 14.4], [10.4, 14.4], [10.6, 16.4], [-10.6, 16.4]], P.gold.sh), fp([[-10, 14.4], [10, 14.4], [10, 15.4], [-10, 15.4]], P.gold.base));
    out.push(...place(MC, b));
  }

  // The head: back of the hair, the heroine face, bangs and the front lock, brows over the bangs.
  {
    const A = (x, y) => at(MH, x, y);
    out.push(...place(MH, [fp(hk([[-13.6, -9], [-5.4, -2.6], [-8.6, 5.4], [-12.4, 8], [-14.2, 1]]), P.hair.sh)]));
    out.push(...heroineHead(A, mood, { ...QFACE, browsOnTop: true }));
    const edge = QFACE.bangs;
    out.push(...place(MH, [pg(hk([[-13.4, -10], [-6, -12.6], [6, -12.4], [13.8, -8], [13.8, 1.6], ...[...edge].reverse()]), P.hair.base), fp(hk([[-12.6, -8.6], [-5.4, -2.6], [-3.4, -6], [-6, -9.4]]), P.hair.sh)]));
    const lt = at(MH, 12.4 * QK, -1 * QK);
    const { pts: lock } = chainPts(lt[0], lt[1], Math.PI / 2 + headA - 0.12, 3, () => 4.4, (i) => trail(i, 0.8) + 0.04);
    out.push(...limb(lock, 3.4, 1.2, P.hair.base, P.hair.sh2), F(rtaper(lock.slice(0, 3).map(([a, b]) => [a + 0.5, b]), 1, 0.5, P.hair.hi)));
    out.push(...heroineBrows(A, mood, QFACE), ...heroineTop(A, mood, QFACE));
    // The collar ruffle, over the neck.
    const c = [];
    for (let i = 0; i < 6; i++) {
      const x = -8 + i * 3.2;
      const y = 2.4 + Math.abs(i - 2.5) * -0.3;
      const FR = i % 2 ? P.frill : ramp(P.frill.sh);
      c.push(ov(x, y, 2.2, 1.7, FR.base, 0, 12), fov(x - 0.5, y + 0.5, 1.4, 0.7, FR.sh, 0, 10));
    }
    c.push(fov(4.6, 4.4, 1.7, 1.7, '#1f8f86', 0, 12), fov(4.6, 4.4, 1.25, 1.25, P.glow, 0, 12), fov(4.2, 4, 0.5, 0.5, '#ffffff', 0, 8));
    out.push(...place(MC, c));
  }

  // The cap: a spotted dome over pale gills, its frilled brim drooping at the ends like heavy
  // cloth (the ends lag the cap), the tiara on top.
  {
    const c = [];
    const R = P.cap;
    const rx = 32;
    const ry = 21;
    const droop = (x) => (x / rx) ** 2 * (2.6 + (walk ? 1.2 * Math.sin(p - 1.8 + x * 0.04) : att >= 0 ? [-1.4, -2, 2.4, 1.6, 0.4][att] : 0.6 * Math.sin(it - 2 + x * 0.04)) + (dead ? 1.6 : 0));
    const dome = [];
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI * (1 + i / 18);
      dome.push([Math.cos(a) * rx, Math.sin(a) * ry]);
    }
    const rim = [];
    for (let i = 0; i <= 10; i++) {
      const x = rx - (i / 10) * 2 * rx;
      rim.push([x, 1.4 + droop(x)]);
    }
    c.push(fp([[rx - 2, 1.6 + droop(rx)], [-rx + 2, 1.6 + droop(-rx)], [-rx + 6, 5.2], [rx - 6, 5.2]], P.gill.sh));
    for (let i = 0; i < 8; i++) c.push(fp([[-rx + 7 + i * 7.4, 2.6], [-rx + 8.6 + i * 7.4, 2.6], [-rx + 8 + i * 7.4, 5]], P.gill.sh2));
    c.push(C(pg([...dome, ...rim.slice(1, 10)], R.base)));
    // Form shadow: a crescent on the back and underside, tapering out toward the light.
    const inner = dome.map(([x, y]) => [x * 0.86 + 4, y * 0.82 - 1]);
    c.push(fp([...dome.slice(0, 10), ...inner.slice(0, 10).reverse()], R.sh), fp([...rim.slice(4), ...rim.slice(4).reverse().map(([x, y]) => [x * 0.9 + 2, y - 2.6])], R.sh));
    c.push(fov(9, -15.6, 10, 2.8, R.hi, -0.12, 16));
    // Warts: pale, each with its own shade underneath.
    for (const [x, y, r] of [[-20, -8, 3.4], [-6, -15, 3.8], [10, -10, 3.2], [22, -5, 2.6], [-26, -1.6, 2.2], [-11, -4, 2.4], [2, -4, 2], [16, -16, 2]]) {
      c.push(fov(x, y + 0.4, r + 0.5, r * 0.72 + 0.4, R.sh2, 0, 14), fov(x, y, r, r * 0.72, P.wart.base, 0, 14), fov(x + r * 0.25, y - r * 0.25, r * 0.4, r * 0.24, '#ffffff', 0, 8));
    }
    // The frill along the brim: scallops swinging a beat after the cap.
    for (let i = 0; i < 11; i++) {
      const x = rx - 1.5 - i * ((2 * rx - 3) / 10);
      const w = walk ? 0.5 * Math.sin(p - 1.8 - i * 0.5) : 0.3 * Math.sin(it - 1.4 - i * 0.5);
      const y = 2.6 + droop(x) + (i % 2) * 0.5 + w;
      const FR = i % 2 ? P.frill : ramp(P.frill.sh);
      c.push(ov(x, y, 3.4, 2, FR.base, 0, 12), fov(x - 0.6, y + 0.6, 2.2, 0.8, FR.sh, 0, 10));
    }
    // The tiara: a gold band with three points and gems, lit on the front.
    const ty = -ry + 1.4;
    c.push(pg([[-7, ty + 1.4], [7, ty + 1.4], [7.4, ty - 2], [5, ty - 5], [3, ty - 2.2], [0, ty - 7.4], [-3, ty - 2.2], [-5, ty - 5], [-7.4, ty - 2]], P.gold.base));
    c.push(fp([[-7, ty + 1.4], [-1, ty + 1.4], [-1, ty - 1], [-3, ty - 2.2], [-5, ty - 5], [-7.4, ty - 2]], P.gold.sh), fp([[1, ty - 1], [0, ty - 6.4], [2.4, ty - 2]], P.gold.hi), fp([[-7, ty + 0.4], [7, ty + 0.4], [7, ty + 1.4], [-7, ty + 1.4]], P.gold.sh2));
    for (const [x, y, r, g] of [[0, ty - 7.6, 1.5, '#ff6fb5'], [-5, ty - 5.2, 1, P.glow], [5, ty - 5.2, 1, P.glow], [0, ty - 0.6, 1.3, P.glow]]) c.push(fov(x, y, r + 0.4, r + 0.4, shade(g, -40), 0, 10), fov(x, y, r, r, g, 0, 10), fov(x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.35, '#ffffff', 0, 6));
    out.push(...place(MK, c));
  }

  // The staff rides the front hand: walking, its foot plants and the body passes it; for the slam
  // it rises overhead (held), then drives down into the floor ahead.
  const S = at(MC, 7.4, 2.4);
  let grip;
  let sa;
  if (walk) {
    const planted = u < 0.5;
    const k = planted ? u / 0.5 : (u - 0.5) / 0.5;
    const bx = planted ? 84 - k * 9 : 75 + smooth(k) * 9;
    const lift = planted ? 0 : Math.sin(k * Math.PI) * 3;
    const foot = [bx + dx, floor - lift];
    grip = [bx - 4 + dx, S[1] + 8 - lift * 0.4];
    sa = Math.atan2(grip[1] - foot[1], grip[0] - foot[0]);
  } else if (att >= 0) {
    grip = [[S[0] + 3, S[1] - 13], [S[0] + 2, S[1] - 14.4], [S[0] + 10, S[1] + 3], [S[0] + 9.8, S[1] + 4], [S[0] + 10, S[1] + 6]][att];
    sa = [-1.95, -2.05, -0.98, -0.96, -1.25][att];
  } else if (dead) {
    grip = [S[0] + 7, S[1] + 12];
    sa = -1.15;
  } else {
    grip = [S[0] + 10 + (hurt ? -2 : 0), S[1] + 7 - (angry ? 3 : 0.6 * br)];
    sa = -1.62 + (hurt ? -0.2 : 0) + 0.02 * Math.sin(it - 0.8);
  }
  const gd = 34;
  const sLen = 66;
  const MS = joint(ID, grip[0] - Math.cos(sa) * gd, grip[1] - Math.sin(sa) * gd, sa);
  const orbAt = at(MS, sLen + 5.6, 0);
  const charge = att === 0 ? 1.3 : att === 1 ? 1.55 : angry && att < 0 ? 1.12 : 1;
  {
    const s = [];
    const W = P.wood;
    s.push(...limb([[0, 0], [sLen * 0.5, 0.4], [sLen, 0]], 3, 2.4, W.base, W.sh2), F(rtaper([[1.6, -0.7], [sLen - 2, -0.7]], 0.8, 0.8, W.hi)));
    for (const t of [0.2, 0.46, 0.74]) s.push(fov(sLen * t, 0.2, 0.8, 1.6, W.sh, 0, 10));
    // The crook curls around the orb; a gold collar ties it on.
    s.push(...limb([[sLen, 0], [sLen + 3, -4.6], [sLen + 8.4, -5], [sLen + 10.6, -0.6], [sLen + 9, 3.6]], 2.6, 1.2, W.base, W.sh2));
    s.push(fp([[sLen - 3.4, -2], [sLen - 0.8, -2], [sLen - 0.8, 2], [sLen - 3.4, 2]], P.gold.sh), fp([[sLen - 3, -2], [sLen - 1.8, -2], [sLen - 1.8, 2], [sLen - 3, 2]], P.gold.base));
    const r = 3.6 * charge;
    s.push(fov(sLen + 5.6, 0, r + 0.8, r + 0.8, '#1f8f86', 0, 20), fov(sLen + 5.6, 0, r, r, dead ? '#b8c6c4' : P.glow, 0, 20), fov(sLen + 6.4, 0.6, r * 0.5, r * 0.5, P.glowHi, 0, 12), fov(sLen + 4.6, -1.2, r * 0.22, r * 0.22, '#ffffff', 0, 8));
    out.push(...place(MS, s));
  }
  // The front arm reaches the grip; the sleeve hangs from the forearm.
  {
    const [El, Hd] = ik(S, grip, 9, 8.6, -1);
    out.push(...limbR([S, El, Hd], 6.4, 8, P.robe), ...rball(Hd[0], Hd[1], 2.4, 2.3, P.skin, { hi: false }), fp([[Hd[0] - 0.6, Hd[1] - 2], [Hd[0] + 0.6, Hd[1] - 2], [Hd[0] + 0.6, Hd[1] + 2], [Hd[0] - 0.6, Hd[1] + 2]], P.skin.sh));
    out.push(...limb([[El[0], El[1]], [(El[0] + Hd[0]) / 2 - 1, (El[1] + Hd[1]) / 2 + 2]], 2, 1.6, P.gold.base, P.gold.sh2));
  }

  // Spores drift off the orb; the wind-up gathers them in, and a glowing ring marks the floor where
  // the staff will land (the telegraph), held over two frames.
  const n = att === 0 || att === 1 || angry ? 4 : 2;
  const mt = walk ? f / 8 : f / 6;
  if (att < 0 && !dead) for (let i = 0; i < n; i++) {
    const v = (mt + i / n) % 1;
    out.push(...mote(orbAt[0] + Math.sin(v * TAU + i * 2) * 3.6, orbAt[1] - 5 - v * 6, 0.8 - v * 0.3, i % 2 ? PURP : P.glow));
  }
  if (att === 0 || att === 1) {
    const k = att === 1 ? 1 : 0.7;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + att;
      const d = (att ? 7 : 10) + (i % 2) * 2;
      out.push(...mote(orbAt[0] + Math.cos(a) * d, orbAt[1] + Math.sin(a) * d, 0.8, i % 2 ? '#ff9ad2' : P.glow));
    }
    out.push(fp(ringPts(80, floor - 0.6, 15 * k, 3.2 * k, 2), mix(P.glow, '#ffffff', 0.3)), fp(ringPts(80, floor - 0.6, 15 * k - 1.6, 3.2 * k - 0.6, 1.2), P.glow));
  }
  if (att === 2) out.push(...rswoosh(56, 88, 26, -95, -25, 4, P.glow));
  if (att === 2 || att === 3) {
    const k = att === 2 ? 0.3 : 0.75;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.05 + (i / 8) * 0.9);
      const d = 6 + k * 20 + (i % 3) * 2.4;
      const r = (2.2 + (i % 3) * 0.8) * (1 - k * 0.4);
      const x = Math.min(97 - r, 82 + Math.cos(a) * d);
      const y = floor - 2 + Math.sin(a) * d * 0.6;
      out.push(...mote(x, y, r, i % 3 ? P.glow : '#ff9ad2'));
    }
    if (att === 2) out.push(star(82, floor - 6, 7, '#ffffff'), star(82, floor - 6, 4, P.glowHi));
  }
  const shapes = squash(out, 50, floor, 1 - sq * 0.6, 1 + sq);
  return { w: 100, h: 122, res: 3, shapes };
}

// A flat ring on the floor (an ellipse band) for telegraphs.
function ringPts(x, y, rx, ry, w) {
  const o = [];
  const i = [];
  for (let k = 0; k <= 20; k++) {
    const a = (k / 20) * TAU;
    o.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]);
    i.push([x + Math.cos(a) * (rx - w), y + Math.sin(a) * Math.max(0.3, ry - w * 0.3)]);
  }
  return [...o, ...i.reverse()];
}

// ---------- Tuskar the Behemoth ----------
// An armoured demon boar: a heavy barrel body under riveted plates, a mane of flame streaming off
// the ridge, curled horns, ivory tusks, and one burning eye in a sooty socket. Signature: the
// flaming ridge over a wedge-shaped head. Rig: hips > body (pitch about the hips when rearing,
// about the middle when galloping) > four two-bone IK legs with planted hooves; body > neck >
// head > jaw, ear and horn; the mane tongues and the tail are chains whose tips trail the body.
// The gallop is a transverse gallop: hinds then fores land in turn, a gathered and a suspended
// phase, the body rocking over them. The attack rears up (held), stomps both forehooves down
// with a shock ring of embers, holds the impact, and settles.

const BR = {
  fur: ramp('#8e5170'),
  belly: ramp('#d49bab'),
  plate: ramp('#6970b6', true),
  gold: ramp('#ffd36b'),
  horn: ramp('#5a4878', true),
  tusk: ramp('#fff3dc'),
  hoof: ramp('#4a3c60', true),
  snout: ramp('#e7a2b9'),
  fire: ['#e2462e', '#ff7a45', '#ffbf4d', '#fff2b8'],
  smoke: '#cbbfd9',
  mouth: '#4a1f3a',
};

// A flame tongue as a chain from its root along angle a: three nested layers whose tips trail.
function tongue(x, y, a, len, w, bend, cols) {
  const out = [];
  [[1, cols[0]], [0.72, cols[1]], [0.42, cols[2]]].forEach(([k, c], li) => {
    const { pts } = chainPts(x, y + li * len * 0.06, a, 3, () => (len * (li ? k * 1.05 : 1)) / 3, (i) => bend * (i + 1) * 0.5);
    out.push(F(rtaper(pts, w * k, 0.3, c)));
  });
  return out;
}

function behemoth(pose, f, mood) {
  const { walk, att, p, it, br, hurt, dead, angry, happy } = timing(pose, f, mood);
  const P = BR;
  const floor = 99.5;
  // Body pose: the gallop rocks over the legs (low as the hinds gather, high in suspension); the
  // idle breathes with a held top and paws the floor; the rear pivots on the hind hooves.
  let by = 0;
  let pitch = 0;
  let headA = 0;
  let jaw = 0.06;
  let pivot = [62, 64];
  if (walk) {
    by = -2.4 * Math.sin(p + 0.6);
    pitch = 0.045 * Math.sin(p - 0.4);
    headA = 0.06 * Math.sin(p - 1.2);
    jaw = 0.08 + 0.05 * Math.sin(2 * p);
  } else if (att >= 0) {
    pivot = [40, 92];
    pitch = [-0.26, -0.33, 0.04, 0.06, 0][att];
    by = [0, -1, 3.2, 2.6, 0.6][att];
    headA = [-0.12, -0.18, 0.2, 0.16, 0.02][att];
    jaw = [0.36, 0.44, 0.2, 0.3, 0.1][att];
  } else {
    by = 0.7 * br;
    headA = 0.03 * Math.sin(it - 0.8) + (f === 3 || f === 4 ? 0.05 : 0);
    jaw = 0.05;
  }
  if (angry && att < 0) {
    headA += 0.12;
    by += 1.2;
    jaw = 0.32;
  }
  if (hurt) {
    headA -= 0.26;
    pitch -= 0.06;
    jaw = 0.18;
  }
  if (dead) {
    by = 14;
    pitch = 0.04;
    headA = 0.14;
    jaw = 0.22;
  }
  // The body's own space has its origin at the hips; it turns about `pivot`.
  const MP = joint(ID, pivot[0], pivot[1], pitch);
  const MB = joint(MP, 40 - pivot[0], 67 + by - pivot[1]);
  const MN = joint(MB, 44, -6, headA);
  const MJ = joint(MN, 12, 9, jaw);
  const out = [];
  const flare = dead ? 0 : angry || att === 0 || att === 1 ? 1.35 : att >= 2 ? 1.15 : 1;
  // How far the flames and tail trail per segment: streamed back in the gallop, up in the rear.
  const trail = (i) => (walk ? -0.18 - 0.08 * Math.sin(p - 1 - i * 0.8) : att >= 0 ? [-0.05, 0.05, -0.3, -0.22, -0.1][att] : -0.06 * Math.sin(it - 1.4 - i * 0.8) - 0.04) + (hurt ? 0.12 : 0);

  // Legs: hip/shoulder sockets in body space; the hooves plant on the floor (sprite space).
  const legs = [
    { s: [-1, 4], home: 34, q: 0, dir: -1, R: ramp(P.fur.sh), far: 1 },
    { s: [38, 5], home: 78, q: 0.5, dir: 1, R: ramp(P.fur.sh), far: 1 },
    { s: [2, 6], home: 40, q: 0.12, dir: -1, R: P.fur, far: 0 },
    { s: [41, 7], home: 84, q: 0.62, dir: 1, R: P.fur, far: 0 },
  ];
  const leg = (L) => {
    const Hp = at(MB, L.s[0], L.s[1]);
    const fore = L.dir > 0;
    let ft;
    if (dead) ft = [Hp[0] + (fore ? 9 : -10), floor - 1.4];
    else if (walk) {
      const [ox, lift] = pawStep(p + L.q * TAU, 7, 6, 0.42);
      ft = [L.home + ox, floor - 1.4 - lift];
    } else if (att >= 0 && fore) {
      ft = att < 2 ? [Hp[0] + 7 + L.far * -2, Hp[1] + 17 - att * 2] : [L.home + 4 - L.far * 3, floor - 1.4];
    } else {
      // Idle: the near forehoof paws the floor (scrapes back, lifts, comes down).
      const paw = !fore || L.far || angry ? [0, 0] : [[0, 0], [0, 0], [-2, 0], [-4, 3], [1, 4], [0, 0]][f] ?? [0, 0];
      ft = [L.home + paw[0] + (hurt ? -2 : 0), floor - 1.4 - paw[1]];
    }
    const [K, Ft] = ik(Hp, ft, 17, 16, L.dir);
    const R = L.R;
    const res = [...limbR([Hp, K], 13, 8.6, R), ...limbR([K, Ft], 7.6, 5.8, R)];
    // A shaggy fetlock tuft and an armoured hoof with an ember crack.
    res.push(fp([[Ft[0] - 4, Ft[1] - 3.4], [Ft[0] + 3.4, Ft[1] - 3.6], [Ft[0] + 2.4, Ft[1] - 0.4], [Ft[0] - 3, Ft[1] - 0.2]], R.sh2));
    res.push(pg([[Ft[0] - 3.6, Ft[1] - 0.6], [Ft[0] + 3.6, Ft[1] - 0.6], [Ft[0] + 4.6, Ft[1] + 1.4], [Ft[0] - 3.6, Ft[1] + 1.4]], L.far ? P.hoof.sh : P.hoof.base), fp([[Ft[0] - 3.2, Ft[1] - 0.6], [Ft[0] + 3.4, Ft[1] - 0.6], [Ft[0] + 3.6, Ft[1]], [Ft[0] - 3.2, Ft[1]]], P.hoof.hi));
    if (!dead) res.push(F(rtaper([[Ft[0] + 0.6, Ft[1] - 0.4], [Ft[0] + 0.9, Ft[1] + 1.2]], 0.67, 0.5, P.fire[2])));
    return { res, Ft };
  };
  const L = legs.map(leg);
  out.push(...L[0].res, ...L[1].res);

  // The tail: a chain from the rump, a flame tuft at its tip.
  {
    const r0 = at(MB, -15, -6);
    const { pts, a } = chainPts(r0[0], r0[1], Math.PI + 0.7 - pitch * 0.2 - (att === 0 || att === 1 ? 0.5 : 0), 4, () => 3.4, (i) => -0.35 + trail(i) * 1.2);
    out.push(...limb(pts, 2.6, 1.2, P.fur.sh, P.fur.sh2));
    if (!dead) out.push(...tongue(pts[4][0], pts[4][1], a - 0.4, 7 * flare, 4, trail(4), P.fire.slice(1)));
  }

  // The body: a heavy barrel, the belly lighter underneath, the form shadow along the back and
  // belly line, and the bristled neck mass.
  {
    const b = [];
    b.push(C(pg([[-16, -4], [-12, -14], [4, -18], [26, -21], [42, -16], [50, -6], [48, 10], [36, 15], [12, 14], [-6, 12], [-16, 6]], P.fur.base)));
    b.push(fp([[-16, -4], [-12, -14], [-6, -12], [-10, 2], [-6, 12], [-16, 6]], P.fur.sh));
    b.push(fp([[-6, 12], [12, 14], [36, 15], [44, 11], [36, 9], [12, 9], [-2, 8]], P.belly.base), fp([[-4, 11.6], [12, 13.4], [34, 14], [36, 12], [12, 11], [0, 10.2]], P.belly.sh));
    b.push(fp([[6, 3], [26, 4], [30, 8], [8, 8]], P.fur.sh), fp([[38, -2], [46, -8], [48, 4], [42, 8]], P.fur.hi));
    // Bristles at the scruff, each tuft a short chain lagging the head.
    for (let i = 0; i < 3; i++) {
      const x = 42 + i * 3;
      b.push(fp([[x - 2, -12 + i * 3], [x + 4 + trail(i) * 6, -16 + i * 2.6], [x + 2, -9 + i * 3]], P.fur.sh2));
    }
    out.push(...place(MB, b));
  }

  // Armour plates along the spine (riveted, three-step metal shine, gold trim), and the flame mane
  // streaming off their ridge: each tongue is a chain whose tip trails a beat behind.
  {
    const plates = [[-10, -12, 12, -0.3], [2, -17, 14, -0.12], [16, -20, 14, 0], [30, -19, 13, 0.14], [42, -13, 10, 0.4]];
    const flames = [];
    plates.forEach(([x, y, w, a], i) => {
      const MPl = joint(MB, x, y, a);
      const pl = [];
      pl.push(pg([[-w / 2 - 1, 6], [-w / 2, -1.4], [-w / 4, -4.4], [w / 2, -3.6], [w / 2 + 1.6, 5]], P.plate.base));
      pl.push(fp([[-w / 2 - 1, 6], [-w / 2, -1.4], [-w / 4, -4.4], [-w / 4 + 2, 6]], P.plate.sh), fp([[w / 6, -3.8], [w / 2, -3.4], [w / 2 + 0.4, -0.6], [w / 6 + 1, -1.2]], P.plate.hi), fp([[w / 2 - 1.4, -3.4], [w / 2, -3.4], [w / 2, -2]], '#ffffff'));
      pl.push(...limb([[-w / 2 - 0.6, 5], [w / 2 + 1.4, 4.4]], 1.6, 1.6, P.gold.base, P.gold.sh2));
      pl.push(fov(0, 1.6, 0.7, 0.7, P.plate.sh2, 0, 8), fov(-0.2, 1.4, 0.35, 0.35, P.plate.hi, 0, 6));
      out.push(...place(MPl, pl));
      if (!dead) {
        const root = at(MPl, 0, -3.6);
        const len = (13 + (i % 2) * 4 + (i === 2 ? 4 : 0)) * flare * (1 + 0.12 * Math.sin((walk ? p : it) * 2 + i * 1.9));
        flames.push(...tongue(root[0], root[1], -Math.PI / 2 + a + pitch - 0.35, len, 8.4, trail(i) * 1.4, P.fire));
      } else if (i % 2) flames.push(...mote(at(MPl, 0, -6)[0], at(MPl, 0, -6)[1] - (f % 3), 1.2, P.smoke));
    });
    out.push(...flames);
  }

  // Near legs over the body.
  out.push(...L[2].res, ...L[3].res);

  // The head: a wedge skull under a horned helm, the snout disc, one burning eye, the ear (a short
  // chain lagging the head), and the jaw with its tusk turning on its hinge.
  {
    const h = [];
    // The jaw first (under the skull).
    const j = [pg([[-2, -2], [16, -1], [18, 2.6], [8, 5], [-4, 3]], P.fur.sh), fp([[0, 1], [15, 0.4], [16, 2], [8, 3.6], [-2, 2.6]], P.belly.sh)];
    j.push(fp([[3, -1.6], [15, -1], [14, 0.4], [4, 0.4]], P.mouth));
    out.push(...place(MJ, j));
    // Ear behind the helm.
    const e0 = at(MN, -2, -10);
    const { pts: ear } = chainPts(e0[0], e0[1], -Math.PI / 2 - 0.9 + headA, 2, () => 4, (i) => -0.3 + trail(i) * 1.5 + (hurt ? -0.3 : 0) + (angry ? -0.2 : 0));
    out.push(...limb(ear, 5.4, 1.4, P.fur.sh, P.fur.sh2));
    h.push(C(pg([[-6, -10], [6, -12], [16, -6], [26, -1], [28, 6], [22, 9], [6, 10], [-6, 6]], P.fur.base)));
    h.push(fp([[-6, -10], [-1, -11], [-2, 4], [6, 10], [-6, 6]], P.fur.sh), fp([[4, 6], [20, 7.4], [22, 9], [6, 10]], P.fur.sh));
    // The snout disc, lit on its front face.
    h.push(...rball(27.6, 3.4, 3, 4.2, P.snout), fov(28.6, 2, 0.8, 1.1, P.snout.sh2, 0, 8), fov(28.4, 5, 0.8, 1.1, P.snout.sh2, 0, 8));
    // The helm: a plate over the brow and down the nose ridge, with a gold trim.
    h.push(pg([[-5, -11], [7, -13.4], [20, -6], [22, -3], [12, -3], [2, -4], [-4, -4]], P.plate.base), fp([[-5, -11], [1, -12.4], [0, -4], [-4, -4]], P.plate.sh), fp([[8, -12], [19, -6.2], [16, -5.2], [7, -10]], P.plate.hi));
    h.push(...limb([[-4, -4.4], [4, -4], [12, -3.2], [21, -3.2]], 1.4, 1.2, P.gold.base, P.gold.sh2));
    // Horn: a curled chain from the helm, sweeping back and up.
    const { pts: horn } = chainPts(2, -12, -Math.PI / 2 - 0.5, 4, (i) => [4.6, 4.4, 4, 3.4][i], () => -0.45);
    h.push(...limb(horn, 5, 1.2, P.horn.base, P.horn.sh2), F(rtaper(horn.slice(1).map(([x, y]) => [x + 0.8, y + 0.4]), 1.2, 0.5, P.horn.hi)));
    // The upper tusk, curving up from the lip.
    h.push(...limb([[18, 6], [22, 5.4], [25, 1.6], [25.4, -3]], 2.6, 0.8, P.tusk.base, P.tusk.sh2), F(rtaper([[19, 5.2], [22.6, 4.4], [24.4, 1]], 0.7, 0.4, '#ffffff')));
    // The burning eye in its sooty socket, a flame licking back off it (faces.js glowEye).
    const ex = 12;
    const ey = -1.4;
    h.push(fov(ex, ey, 4.4, 3.6, '#2a1830', 0, 16));
    if (dead) h.push(...deadEye(ex, ey, 1.9, { c: '#8a7d92', th: 0.8 }));
    else {
      const big = angry || att >= 0 ? 1.18 : 1;
      if (!hurt && mood !== 'blink' && !happy) {
        const fl = (angry || att >= 0 ? 6.6 : 4.4) * (1 + 0.15 * Math.sin((walk ? p : it) * 2));
        h.push(...tongue(ex - 1.8, ey - 0.6, Math.PI + 0.35, fl, 3.4, 0.25, P.fire.slice(1)));
      }
      const act = actOf(mood, { idle: { lid: 0.18 }, angry: { lid: 0.2, slant: 0.9, raise: 0.25 } });
      h.push(...glowEye(ex, ey, { shape: 'round', s: 1, w: 2.6 * big, h: 2.3 * big, c: angry || att >= 0 ? '#ff6a3a' : '#ff9a4a', hot: '#fff2b8', bg: '#2a1830', look: [0.4, 0.1], flick: (f % 4) / 4, ...act, ...(att >= 0 ? { lid: 0.16, slant: 0.9, closed: undefined } : {}) }));
      h.push(...brow(ex - 0.4, ey - 3.6, { s: 1, len: 3.2, angle: angry || att >= 0 ? 28 : hurt ? -20 : 8, th: 1.1, c: P.plate.sh2, shape: 'flat', arch: 0.1 }));
    }
    out.push(...place(MN, h));
    // The lower tusk rides the jaw.
    out.push(...place(MJ, [...limb([[13, 1], [16, -1.4], [17.4, -5]], 2, 0.7, P.tusk.base, P.tusk.sh2)]));
  }

  // Snorts: smoke puffs off the snout in the gallop and the paw; embers fly in the stomp.
  const nose = at(MN, 30, 3);
  if (!dead && (walk || att === 4 || f === 4)) {
    const k = walk ? (f % 4) / 4 : 0.4;
    for (let i = 0; i < 2; i++) out.push(fov(Math.min(118, nose[0] + 2 + k * 5 + i * 2.4), nose[1] + 2 - i * 2, 1.8 + k * 1.6 - i * 0.4, 1.5 + k * 1.2, mix(P.smoke, '#ffffff', 0.3 + k * 0.4), 0, 12));
  }
  if (att >= 2 && att <= 3) {
    const k = att === 2 ? 0.25 : 0.7;
    const hx = (L[2].Ft[0] + L[3].Ft[0]) / 2 + 2;
    out.push(fp(ringPts(hx, floor - 0.6, 10 + k * 20, 2.4 + k * 4, 2.4), mix(P.fire[2], '#ffffff', 0.3)));
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.08 + (i / 6) * 0.84);
      const d = 8 + k * 22 + (i % 3) * 2;
      out.push(...mote(Math.min(120, hx + Math.cos(a) * d), floor - 2 + Math.sin(a) * d * 0.55, 1.4 - k * 0.5, i % 2 ? P.fire[2] : P.fire[1]));
    }
    if (att === 2) out.push(star(hx, floor - 7, 8, P.fire[3]), star(hx, floor - 7, 4.6, '#ffffff'));
  }
  if (angry && att < 0) out.push(star(nose[0] - 6, nose[1] - 18, 2.2, P.fire[2]));
  const sq = key(att, [0.02, 0.025, -0.04, -0.02, 0], walk ? Math.cos(p + 0.6) * 0.015 : 0.008 * br);
  return { w: 124, h: 100, res: 3, shapes: squash(out, 62, floor, 1 - sq * 0.5, 1 + sq) };
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
