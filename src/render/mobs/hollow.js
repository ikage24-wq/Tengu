// Rig, ramp and shape helpers (joint transforms, chains, four-tone ramps lit from the upper front,
// tapered limbs, swooshes), shared by the Crystal Dragon King in bosses.js. (This was Rootwood
// Hollow's first monster art; render/mobs/hollowfolk.js draws those monsters now.)

import { T, F, shade, mix, sparkLine } from './kit.js';
import { ovalPts } from './faces.js';

const TAU = Math.PI * 2;
const TEAL = '#5ff0d6';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (k) => k * k * (3 - 2 * k);

// ---------- Colour ramps ----------

function hsl(c) {
  const n = parseInt(c.slice(1, 7), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  let h = 0;
  let s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
  }
  return [h, s, l];
}
function hex(h, s, l) {
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return `#${[f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`;
}
// Turns hue h toward hue t by at most d degrees.
const toward = (h, t, d) => {
  const x = ((t - h + 540) % 360) - 180;
  return (h + Math.sign(x) * Math.min(Math.abs(x), d) + 360) % 360;
};
// A material's four tones: a highlight shifted warm and light, the base, and two shadows that turn
// toward magenta (warm materials) or blue-violet (cool ones) and gain saturation, never grey.
function ramp(c, cool = false, k = 1) {
  const [h, s, l] = hsl(c);
  const to = cool ? 250 : 330;
  return {
    hi: hex(toward(h, 55, 14), s * 0.95, l + 0.1 * k),
    base: c,
    sh: hex(toward(h, to, 10), s * 1.04 + 0.02, l - 0.1 * k),
    sh2: hex(toward(h, to, 20), s * 1.08 + 0.04, l - 0.21 * k),
  };
}

// ---------- Rig ----------

// A 2D affine transform [a, b, c, d, e, f]: (x, y) -> (a x + c y + e, b x + d y + f).
const ID = [1, 0, 0, 1, 0, 0];
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const at = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
// A joint: moves to (x, y) in the parent's space and turns by a (radians, + turns clockwise:
// forward for an upright part of a right-facing body).
const joint = (M, x, y, a = 0) => mul(M, [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), x, y]);
// Places shapes drawn in a part's own space through its joint transform.
function place(M, shapes) {
  return shapes.map((sh) => {
    if (!sh) return sh;
    if (sh.t === 'p') return { ...sh, x: 0, y: 0, pts: sh.pts.map(([x, y]) => at(M, x + sh.x, y + sh.y)) };
    if (sh.t === 'e') {
      const n = sh.rx + sh.ry > 6 ? 24 : 16;
      return { ...sh, t: 'p', x: 0, y: 0, pts: ovalPts(sh.x, sh.y, sh.rx, sh.ry, 0, n).map(([x, y]) => at(M, x, y)) };
    }
    const [x, y] = at(M, sh.x, sh.y);
    return { ...sh, x, y };
  });
}
// Squash and stretch about the feet: (sx, sy) about (cx, floor), so the feet never leave the ground.
function squash(shapes, cx, floor, sx, sy) {
  if (sx === 1 && sy === 1) return shapes;
  return place([sx, 0, 0, sy, cx - cx * sx, floor - floor * sy], shapes);
}

// Two-bone reach: the knee between hip and foot for bones a and b, bending toward dir (+1 forward).
function ik(h, ft, a, b, dir) {
  const dx = ft[0] - h[0];
  const dy = ft[1] - h[1];
  const d = clamp(Math.hypot(dx, dy), 0.01, a + b - 0.05);
  const base = Math.atan2(dy, dx);
  const A = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const k1 = [h[0] + Math.cos(base + A) * a, h[1] + Math.sin(base + A) * a];
  const k2 = [h[0] + Math.cos(base - A) * a, h[1] + Math.sin(base - A) * a];
  const k = (k1[0] - k2[0]) * dir > 0 ? k1 : k2;
  const fl = Math.hypot(ft[0] - k[0], ft[1] - k[1]) || 1;
  return [k, [k[0] + ((ft[0] - k[0]) / fl) * b, k[1] + ((ft[1] - k[1]) / fl) * b]];
}
// A chain of n segments from (x, y): segment i turns by bend(i) from the one before (+ clockwise).
function chainPts(x, y, a0, n, len, bend) {
  const pts = [[x, y]];
  let a = a0;
  for (let i = 0; i < n; i++) {
    a += bend(i);
    const l = typeof len === 'function' ? len(i) : len;
    x += Math.cos(a) * l;
    y += Math.sin(a) * l;
    pts.push([x, y]);
  }
  return { pts, a };
}

// Walk feet: one foot's offset from its hip (dx, lift) at phase q. It pushes back along the ground
// for the first half (planted, so it never slides) and swings forward through the air for the other.
function footStep(q, reach, lift) {
  const t = (((q / TAU) % 1) + 1) % 1;
  if (t < 0.5) return [reach - (t / 0.5) * reach * 2, 0];
  const s = (t - 0.5) / 0.5;
  return [-reach + smooth(s) * reach * 2, Math.sin(Math.PI * s) ** 0.8 * lift];
}

// Where the pose is: walk phase p (contacts at 0 and pi), idle phase it with its breath (in slowly,
// out quickly, held at the top), the attack frame, and the moods.
function timing(pose, f, mood) {
  const walk = pose === 'walk';
  const att = pose === 'attack' ? f : -1;
  const idle = !walk && att < 0;
  const p = walk ? (f / 8) * TAU : 0;
  const u = idle ? f / 6 : 0;
  const br = u < 0.6 ? smooth(u / 0.6) : 1 - smooth((u - 0.6) / 0.4);
  return { walk, att, idle, p, u, it: u * TAU, br, angry: mood === 'angry', hurt: mood === 'hurt', dead: mood === 'dead', happy: mood === 'happy', blink: mood === 'blink' };
}

// ---------- Shape helpers ----------

const pg = (pts, c) => T(pts, c);
const fp = (pts, c) => F(T(pts, c));
const ov = (x, y, rx, ry, c, a = 0, n = 18) => T(ovalPts(x, y, rx, ry, a, n), c);
const fov = (x, y, rx, ry, c, a = 0, n = 16) => F(ov(x, y, rx, ry, c, a, n));

// A polyline as one tapering polygon: width w0 at the start and w1 at the end.
function taper(pts, w0, w1, c) {
  const n = pts.length;
  const d = [0];
  for (let i = 1; i < n; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = d[n - 1] || 1;
  const left = [];
  const right = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / dl;
    const ny = (b[0] - a[0]) / dl;
    const w = (typeof w0 === 'function' ? w0(d[i] / len) : w0 + (w1 - w0) * (d[i] / len)) / 2;
    left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
    right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  return T([...left, ...right.reverse()], c);
}
// Pushes both ends of a polyline out by e.
function ext(pts, e) {
  const n = pts.length;
  const out = pts.map((q) => [...q]);
  const push = (i, j) => {
    const dx = pts[i][0] - pts[j][0];
    const dy = pts[i][1] - pts[j][1];
    const l = Math.hypot(dx, dy) || 1;
    out[i] = [pts[i][0] + (dx / l) * e, pts[i][1] + (dy / l) * e];
  };
  push(0, 1);
  push(n - 1, n - 2);
  return out;
}
// A tapered limb with its own interior line (the part's darkest tone, 1/3 px each side), so it
// reads where it crosses the body.
const limb = (pts, w0, w1, c, line = mix(shade(c, -38), "#2a2035", 0.4)) => [F(taper(ext(pts, 0.3), w0 + 0.7, w1 + 0.7, line)), taper(pts, w0, w1, c)];
// A limb with its form: the base tone, a shadow strip along its lower side.
function limbR(pts, w0, w1, R, under = 0.35) {
  const res = limb(pts, w0, w1, R.base, R.sh2);
  res.push(F(taper(pts.map(([x, y]) => [x, y + w0 * under * 0.5]), w0 * 0.45, w1 * 0.4, R.sh)));
  return res;
}
// A rounded mass lit from the upper front: the shadow tone underneath, the base shifted up and
// forward over it, and a small highlight (one light, so no pillow ring).
function ball(x, y, rx, ry, R, o = {}) {
  const out = [ov(x, y, rx, ry, o.dark ?? R.sh, 0, 24), fov(x + rx * 0.09, y - ry * 0.1, rx * 0.9, ry * 0.88, R.base, 0, 24)];
  if (o.hi !== false) out.push(fov(x + rx * 0.28, y - ry * 0.5, rx * 0.32, ry * 0.16, R.hi, -0.25, 12));
  return out;
}
// A slash streak: a flat crescent along an arc (degrees) with a hard leading edge, glow under a
// bright core and a darker rim so it reads on pastel maps.
function swoosh(cx, cy, r, a0, a1, th, glow = TEAL, core = '#ffffff') {
  const bandA = (w, rr, c) => {
    const outer = [];
    const inner = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
      const k = Math.sin(t * Math.PI * 0.5 + 0.02) ** 0.6 * (t > 0.9 ? (1 - t) * 10 * 0.6 + 0.4 : 1) * (0.25 + 0.75 * t);
      outer.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
      inner.push([cx + Math.cos(a) * (rr - w * k), cy + Math.sin(a) * (rr - w * k)]);
    }
    return F(T([...outer, ...inner.reverse()], c));
  };
  return [bandA(th + 1.2, r + 0.6, shade(glow, -30)), bandA(th + 0.6, r + 0.3, glow), bandA(th * 0.5, r, core)];
}
// A four-point impact star.
function star(x, y, r, c = '#ffffff') {
  const q = r * 0.28;
  return { ...F(T([[x, y - r], [x + q, y - q], [x + r, y], [x + q, y + q], [x, y + r], [x - q, y + q], [x - r, y], [x - q, y - q]], c)), line: sparkLine(c) };
}
// The creature face moods: eye options per mood from a species table (closed eyes, lids).
const actOf = (mood, table) => ({ idle: {}, blink: { closed: 'blink' }, happy: { closed: 'happy' }, hurt: { closed: 'squeeze' }, angry: { lid: 0.25, slant: 0.8, raise: 0.25 }, ...table })[mood] ?? {};

// The rig, ramp and shape helpers, shared with other modules (the bosses use them).
export { ramp, ID, joint, at, place, squash, ik, chainPts, footStep, timing, taper, limb, limbR, ball, swoosh, star, pg, fp, fov, actOf };
