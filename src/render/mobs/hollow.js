// Monster art: hollow. Rootwood Hollow's minions, the creatures of a giant tree gone sour: root
// imps, mushroom shamans, bramble bears, spore mites, and the corrupted saplings that feed its
// heart. Bark and fungus in soft browns, lilacs, and mossy greens, with the corruption showing as
// glowing teal eyes and purple veins.
//
// Every design is a rig: parts are drawn in their own space around a real joint (hip, knee,
// shoulder, elbow, neck, tail root) and placed through a chain of joint transforms, so limbs keep
// their length, feet plant, the head and face follow the neck, and props ride the hand. Tails,
// ears, leaves, caps and branches are chains whose segments lag the one before (root leads, tip
// follows). Materials use hue-shifted four-tone ramps lit from the upper front; faces come from
// the creature face kit (faces.js) and hold the sprite's strongest contrast.

import { T, F, C, shade, mix, sparkLine, keyAt } from './kit.js';
import { eye, glowEye, brow, mouth, blush, sweat, tear, vein, deadEye, band, ovalPts } from './faces.js';

const TAU = Math.PI * 2;
const TEAL = '#5ff0d6';
const TEAL_HI = '#d9fff8';
const TEAL_DK = '#1f8f86';
const PURP = '#b86cff';
const PURP_HI = '#f1ddff';
const PURP_DK = '#6a2fa8';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (k) => k * k * (3 - 2 * k);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
// Picks the attack frame's value from a list (or the fallback outside an attack).
const key = (att, list, other) => (att >= 0 ? list[Math.min(att, list.length - 1)] : other);

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
// The same joint with its origin snapped to the 1/3 px grid (heads, so faces never boil).
const snapJ = (M) => {
  const o = M.slice();
  o[4] = Math.round(o[4] * 3) / 3;
  o[5] = Math.round(o[5] * 3) / 3;
  return o;
};
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
// A forward-kinematic arm: shoulder S, bone lengths l1, l2, angles a1 (from +x) and a2 (relative).
function arm2(S, l1, l2, a1, a2) {
  const E1 = [S[0] + Math.cos(a1) * l1, S[1] + Math.sin(a1) * l1];
  return [E1, [E1[0] + Math.cos(a1 + a2) * l2, E1[1] + Math.sin(a1 + a2) * l2], a1 + a2];
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
// A glowing spore mote with a darker rim.
const mote = (x, y, r, c = TEAL) => [fov(x, y, r + 0.34, r + 0.34, shade(c, -26), 0, 10), fov(x, y, r, r, c, 0, 10), fov(x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.4, '#ffffff', 0, 8)];
// The creature face moods: eye options per mood from a species table (closed eyes, lids).
const actOf = (mood, table) => ({ idle: {}, blink: { closed: 'blink' }, happy: { closed: 'happy' }, hurt: { closed: 'squeeze' }, angry: { lid: 0.25, slant: 0.8, raise: 0.25 }, ...table })[mood] ?? {};

// ---------- Bramble Bear (thornback) ----------
// A hulking bear armored in bark. Signature: a ridge of bark plates down its humped back, each
// with a pale thorn spike, over a heavy rounded bear body; glowing toadstools sprout from the rump
// and corruption glows in two seams. Small fierce glowing eyes under a bark brow-plate, a pale
// muzzle. Rig: spine (pitch) > rump and shoulders > four IK legs; shoulders > neck > head (ears,
// jaw); the plate ridge rides the spine; a two-segment thorn tail. A walking quadruped: each foot
// stays planted for 60% of the stride, hind and fore a quarter-cycle apart, so the shoulders roll.

const BEAR = {
  fur: ramp('#9b7360'),
  furFar: ramp('#7f5c4f'),
  belly: ramp('#cba68a'),
  muzzle: ramp('#e0c3a6'),
  plate: ramp('#6e5b50', true),
  thorn: ramp('#efe2c6'),
  moss: ramp('#79b46e', true),
  cap: ramp('#4fbab0', true),
  ink: '#3e2430',
};

// A foot's offset on a walking quadruped: planted (pushing back) for `duty` of the cycle.
function pawStep(q, reach, lift, duty = 0.6) {
  const t = (((q / TAU) % 1) + 1) % 1;
  if (t < duty) return [reach - (t / duty) * reach * 2, 0];
  const s = (t - duty) / (1 - duty);
  return [-reach + smooth(s) * reach * 2, Math.sin(Math.PI * s) ** 0.8 * lift];
}

function brambleBear(pose, f, mood) {
  const { walk, att, p, it, br, hurt, dead, angry, happy } = timing(pose, f, mood);
  const P = BEAR;
  const floor = 46.4;
  let by;
  let pitch;
  let dx = 0;
  let sq = 0;
  if (walk) {
    // The shoulders roll over each planted forefoot; the body dips twice a cycle.
    by = 0.7 * Math.cos(2 * p - 0.9);
    pitch = 0.03 * Math.sin(2 * p - 0.4);
  } else if (att >= 0) {
    // Rears up (held), crashes down into the rake, the planted impact held, settles.
    [by, pitch, dx, sq] = [[-1.4, -0.26, -1.4, 0.03], [1, 0.08, 1.4, -0.03], [1.6, 0.11, 1.8, -0.06], [0.6, 0.03, 0.6, 0]][att];
  } else {
    by = -0.5 * br;
    pitch = -0.012 * br;
    dx = 0.3 * Math.sin(it + 1);
    sq = 0.018 * br;
  }
  if (angry && att < 0) {
    pitch += 0.04;
    by += 0.8;
  }
  if (hurt) {
    pitch = -0.1;
    dx -= 1.6;
  }
  if (dead) {
    pitch = 0.04;
    by = 4.6;
  }
  // Rearing pivots on the hind legs; otherwise the spine turns about the middle of the body.
  const MB = att >= 0 ? joint(joint(ID, 15 + dx, 34 + by, pitch), 11, -2) : joint(ID, 26 + dx, 32 + by, pitch);
  const headA = (walk ? 0.05 * Math.sin(2 * p - 1.6) : att >= 0 ? [-0.2, 0.12, 0.16, 0.04][att] : 0.03 * Math.sin(it - 0.9)) + (angry && att < 0 ? 0.08 : 0) + (hurt ? -0.2 : 0) + (dead ? 0.2 : 0);
  const MH = snapJ(joint(MB, 13.6, -3.4, headA));
  const out = [];

  // Legs: IK from hip or shoulder to a planted paw with three pale claws.
  const legOf = (hx, hy, q, R, fore, near, paw) => {
    const H = at(MB, hx, hy);
    const restX = 26 + dx + hx;
    let ft;
    if (paw) ft = paw;
    else if (walk) {
      const [ox, lift] = pawStep(q, 3.4, 2.6);
      ft = [restX + ox, floor - lift];
    } else if (dead) ft = [restX + (fore ? 3 : -3), floor];
    else if (att >= 0) ft = [restX + (fore ? 1.4 : -1.2), floor];
    else ft = [restX + (fore ? 0.6 : -0.6), floor];
    const L = fore ? 6.3 : 6.6;
    const [K, Ft] = ik(H, ft, L, L, fore ? -1 : 1);
    const w = fore ? 6.8 : 7.6;
    const res = [];
    res.push(...ball(H[0], H[1] + 1, w * 0.62, w * 0.66, R, { hi: false }));
    // The limb bends through a rounded knee or elbow: a curve from mid-thigh round the joint to
    // mid-shin (never a hard corner), and a soft joint pad over it.
    const mid = (A, B) => [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const m0 = mid(H, K);
    const m1 = mid(K, Ft);
    const bend = [0.25, 0.5, 0.75].map((t) => [(1 - t) ** 2 * m0[0] + 2 * t * (1 - t) * K[0] + t * t * m1[0], (1 - t) ** 2 * m0[1] + 2 * t * (1 - t) * K[1] + t * t * m1[1]]);
    res.push(...limbR([H, m0, ...bend, m1, Ft], w, w * 0.72, R, 0.5));
    res.push(fov(bend[1][0], bend[1][1], w * 0.42, w * 0.42, R.base, 0, 12));
    res.push(...ball(Ft[0] + 0.9, Ft[1] - 0.2, 3.4, 1.9, R, { hi: false }));
    for (const k of [0, 1, 2]) {
      const cx = Ft[0] + 3.3 - k * 0.3;
      const cy = Ft[1] - 0.8 + k * 0.85;
      res.push(fp([[cx - 0.4, cy - 0.5], [cx + 1.6, cy - 0.1], [cx + 2.5, cy + 0.6], [cx - 0.2, cy + 0.6]], near ? P.thorn.base : P.thorn.sh));
    }
    return res;
  };

  // Far legs (darker), a quarter-cycle apart from their near partners.
  out.push(...legOf(-11.4, 2, p + Math.PI, P.furFar, false, false));
  out.push(...legOf(10.6, 1.2, p + Math.PI * 1.5, P.furFar, true, false));

  // Tail: a thorny stub that wags a beat behind the hips.
  {
    const tw = walk ? 0.25 * Math.sin(2 * p - 1.6) : 0.15 * Math.sin(it - 1.2) + (hurt ? 0.4 : 0);
    const { pts } = chainPts(-18, -3, Math.PI + 0.5 + tw, 2, 1.8, (i) => 0.3 + tw * i);
    out.push(...place(MB, [...limbR(pts, 4.4, 2.6, P.fur), fp([[pts[2][0] + 0.4, pts[2][1] - 0.6], [pts[2][0] - 2.4, pts[2][1] - 2.6], [pts[2][0] - 0.4, pts[2][1] + 1]], P.thorn.base)]));
  }

  // Body: rump, belly and the big shoulder hump, lit from the upper front.
  {
    const b = [];
    const R = P.fur;
    b.push(ov(-9.6, -1, 9.4, 9.4 + br * 0.3, R.sh, 0, 24), ov(0, -1.4, 17, 11 + br * 0.4, R.sh, 0, 28), ov(10, -3.8, 10, 10.2 + br * 0.3, R.sh, 0, 24));
    b.push(fov(-8.8, -1.8, 8.4, 8.4, R.base, 0, 22), fov(0.8, -2.4, 15.6, 9.8, R.base, 0, 26), fov(10.8, -4.8, 9, 9.2, R.base, 0, 22));
    b.push(fov(12, -11, 4.6, 1.6, R.hi, -0.2, 14));
    // Belly fur, shaggy along the underside.
    b.push(fov(1, 5.4, 12.6, 3.6, P.belly.base, 0, 20));
    for (const x of [-9, -3, 3, 9]) b.push(fp([[x - 2, 7.4], [x + 2, 7.4], [x + 0.3, 10], [x - 0.6, 8.6]], R.sh));
    b.push(band([[-6, 4.6], [-5, 6.4]], 0.67, P.belly.sh), band([[4, 5.2], [4.6, 7]], 0.67, P.belly.sh));
    out.push(...place(MB, b));
  }

  // The plate ridge: bark plates along the spine, each with a thorn; corruption in two seams.
  {
    const r = [];
    const plates = [[-17.6, -4, -2.4, 6, 5.2], [-12.6, -9.8, -2.0, 7.6, 6], [-5, -12.6, -1.7, 8.4, 6.4], [3.2, -12.8, -1.45, 8.4, 6.4], [10.6, -13.6, -1.2, 7.4, 5.8]];
    plates.forEach(([x, y, a, pw, ph], i) => {
      const M = joint(ID, x, y, a + Math.PI / 2);
      const quad = [[-pw / 2, ph * 0.45], [-pw * 0.48, -ph * 0.2], [-pw * 0.2, -ph * 0.5], [pw * 0.2, -ph * 0.5], [pw * 0.48, -ph * 0.2], [pw / 2, ph * 0.45]];
      const spike = angry ? 1.35 : 1;
      const tl = (i % 2 ? 4.4 : 5.8) * spike;
      const sp = [];
      if (i > 0) sp.push(fp([[-1.8, -ph * 0.4], [-0.6, -ph * 0.5 - tl], [1.8, -ph * 0.4]], P.thorn.sh), fp([[-1.2, -ph * 0.42], [-0.6, -ph * 0.5 - tl], [1.4, -ph * 0.42]], P.thorn.base), fp([[-0.9, -ph * 0.45], [-0.6, -ph * 0.5 - tl * 0.8], [-0.1, -ph * 0.45]], P.thorn.hi));
      r.push(...place(M, [...sp, C(pg(quad, P.plate.sh)), fp(quad.map(([qx, qy]) => [qx * 0.84 + 0.4, qy * 0.8 - 0.5]), P.plate.base), F(taper([[-pw * 0.3, -ph * 0.32], [pw * 0.3, -ph * 0.32]], 0.8, 0.8, P.plate.hi))]));
    });
    // Corruption glowing in two seams between plates.
    for (const [x, y] of [[-8.6, -11.4], [7, -13.6]]) r.push(band([[x - 0.3, y - 1.6], [x + 0.3, y + 1.8]], 0.9, PURP), fov(x, y, 0.45, 0.45, PURP_HI, 0, 8));
    // Moss and two glowing toadstools on the rump plate.
    r.push(fov(-12.4, -11, 2.2, 1.3, P.moss.sh), fov(-12, -11.4, 1.8, 1, P.moss.base), fov(-11.6, -11.8, 0.8, 0.4, P.moss.hi, 0, 8));
    for (const [x, y, k] of [[-14.2, -12.8, 1], [-11, -14.2, 0.8]]) r.push(...limb([[x, y + 2.6 * k], [x + 0.2, y]], 0.9, 0.8, P.thorn.base, P.thorn.sh2), fov(x + 0.2, y - 0.3, 2 * k + 0.3, 1.3 * k + 0.3, P.cap.sh2, 0, 14), fov(x + 0.2, y - 0.4, 2 * k, 1.3 * k, P.cap.base, 0, 14), fov(x + 0.6, y - 0.9, 0.7 * k, 0.4 * k, TEAL_HI, 0, 8));
    out.push(...place(MB, r));
  }

  // Near hind leg.
  out.push(...legOf(-10.4, 2.6, p, P.fur, false, true));
  // The near foreleg: in the swipe it's raised beside the head, raked down, planted, drawn back.
  const paw = att >= 0 ? [[48, 26], [52, 41], [53.6, floor], [47, floor]][att] : null;
  out.push(...legOf(11.4, 1.6, p + Math.PI * 0.5, P.fur, true, true, paw && !dead ? [paw[0] + dx * 0.4, paw[1]] : null));

  // Head: ears, skull, cheek ruff, brow-plate, muzzle, jaw, eyes.
  {
    const h = [];
    const R = P.fur;
    const earW = walk ? 0.12 * Math.sin(2 * p - 2) : 0.08 * Math.sin(it - 1.4) + (f === 4 && att < 0 && !walk ? -0.2 : 0);
    const ear = (x, y, a, R2) => place(joint(ID, x, y, a), [ov(0, 0, 2.9, 2.9, R2.sh, 0, 16), fov(0.2, -0.3, 2.4, 2.4, R2.base, 0, 14), fov(0.4, 0.2, 1.3, 1.3, '#8c64b0', 0, 12)]);
    h.push(...ear(-1, -8.6, earW - (hurt ? 0.5 : 0), P.furFar));
    // Cheek ruff behind the jaw.
    for (const [x, y] of [[-4.6, 3], [-3.4, 6], [-0.6, 7.6]]) h.push(pg([[x - 1.8, y - 2.2], [x + 1.8, y - 1.4], [x - 1.2, y + 2.2]], R.sh));
    h.push(C(ov(3.6, -1, 9, 8.2, R.sh, 0, 26)), fov(4.3, -1.8, 8.1, 7.3, R.base, 0, 24), fov(6.6, -6.8, 3, 1.2, R.hi, -0.2, 12));
    h.push(...ear(5.2, -9.2, -earW * 1.4 - (hurt ? 0.4 : 0) + (dead ? 0.6 : 0), R));
    // The jaw opens to roar; the muzzle over it.
    const jaw = att >= 0 ? [2.4, 2, 1.4, 0.6][att] : angry ? 2.2 : hurt ? 1.1 : dead ? 1 : happy ? 0.8 : 0;
    const mx = 10.4;
    const my = 2.6;
    h.push(...ball(mx + 0.2, my + 2.2 + jaw * 0.6, 3.6, 2.1, P.muzzle, { hi: false }));
    if (jaw > 0) h.push(...mouth(mx + 0.6, my + 1.6, { s: 1, type: angry || att >= 0 ? 'snarl' : hurt ? 'pained' : 'grin', w: 2.8, h: 1.2 + jaw, open: 1, teeth: angry || att >= 0 ? 'both' : 'none', fangs: angry || att >= 0 ? 2 : 0, ink: P.ink, tongue: dead || happy ? undefined : false, tongueOut: dead }));
    h.push(...ball(mx, my, 4.6, 3, P.muzzle));
    if (jaw === 0) h.push(...mouth(mx + 0.6, my + 1.7, { s: 1, type: 'smirk', w: 2.6, tilt: 0.3, ink: P.ink, tusks: 1, tuskAt: 0.7 }));
    h.push(fp([[mx + 2.4, my - 2.4], [mx + 5.4, my - 2.2], [mx + 5.2, my - 0.2], [mx + 3.6, my + 0.6], [mx + 2.6, my - 0.6]], '#4a3548'), fov(mx + 3.6, my - 1.6, 0.8, 0.4, '#a08fbf', 0, 8));
    // Bark brow-plate with a horn thorn.
    h.push(fp([[-3.4, -7], [1.4, -9.2], [7.2, -7.8], [8.6, -5], [3.4, -5.2], [-2, -4.4]], P.plate.sh2), fp([[-2.8, -7.1], [1.4, -8.7], [6.8, -7.4], [7.8, -5.6], [3.2, -5.8], [-1.8, -5.2]], P.plate.base), F(taper([[-1.6, -7], [1.4, -8], [5.6, -7]], 0.67, 0.67, P.plate.hi)));
    h.push(fp([[-1.8, -7.6], [-4.4, -12.2], [0.6, -8.6]], P.thorn.sh), fp([[-1.4, -7.8], [-4, -11.6], [0.2, -8.6]], P.thorn.base));
    // Eyes: small, fierce glow under the plate; the plate's shadow carves them when angry.
    const glance = walk || att >= 0 ? 0.5 : 0.7 * Math.sin(it + 0.5);
    const ge = { shape: 'heavy', c: TEAL, bg: '#2b1f36', look: [glance, 0.1], flick: (f % 3) / 3 };
    const act = actOf(mood, { idle: { lid: 0.42, slant: 0.35 }, angry: { lid: 0.32, slant: 1, raise: 0.3 } });
    const eF = [2.4, -2.8];
    const eN = [7.2, -3];
    if (dead) h.push(...deadEye(eF[0], eF[1], 1.2, { c: P.ink, th: 0.6 }), ...deadEye(eN[0], eN[1], 1.35, { c: P.ink, th: 0.65 }));
    else if (hurt) h.push(...glowEye(eF[0], eF[1], { ...ge, s: -1, w: 1.4, h: 1.5, closed: 'squeeze' }), ...glowEye(eN[0], eN[1], { ...ge, s: 1, w: 1.6, h: 1.6, closed: 'squeeze' }), ...tear(eN[0] + 1.6, eN[1] + 1.2, 0.8));
    else h.push(...glowEye(eF[0], eF[1], { ...ge, ...act, s: -1, w: 1.4, h: 1.6 }), ...glowEye(eN[0], eN[1], { ...ge, ...act, s: 1, w: 1.65, h: 1.75 }));
    if (!dead && !angry && att < 0) h.push(...blush(1.2, 1.6, 1.2, { on: R.base, lines: happy ? 2 : 0 }));
    if (angry && att < 0) h.push(...vein(0.4, -12.4, 0.9));
    out.push(...place(MH, h));
  }

  // The swipe: a claw smear on the strike, then sparks and dust where the paw lands (held).
  if (att === 1) out.push(...swoosh(46, 34, 9.6, -70, 75, 3.4));
  if (att === 2) {
    out.push(...swoosh(46, 34, 9.6, 10, 85, 1.8), star(57.4, 44, 2.6), star(51.4, 40.6, 1.5, TEAL_HI));
    for (const [x, r] of [[48.6, 1.8], [58.4, 1.4], [52, 1.2]]) out.push(fov(x, floor + 0.2 - r * 0.4, r + 0.4, r * 0.7 + 0.3, '#c9b3a2'), fov(x - 0.3, floor - r * 0.5, r, r * 0.6, '#f2e6d6'));
  }
  const shapes = squash(out, 26, floor + 1, 1 - sq * 0.6, 1 + sq);
  return { w: 62, h: 48, res: 3, shapes: place([1, 0, 0, 1, 1, 0], shapes) };
}

// ---------- Root Imp (rootling) ----------
// A little horned demon of twisted roots. Signature: two root horns curling back off a big knotty
// head, and a long root tail ending in a corrupted spade leaf. Glowing teal seed eyes, a fang, a
// leaf loincloth, thorn claws, and corruption glowing through a crack in its chest.
// Rig: pelvis > torso > neck > head (horns, ears, face); hips > IK legs > root toes; shoulders >
// elbows > thorn hands; pelvis > five-segment tail. A quick, low scurry: lean in, claws pumping.

const IMP = {
  bark: ramp('#b07f5c'),
  head: ramp('#c79870'),
  horn: ramp('#7a5546'),
  leaf: ramp('#7fb46e', true),
  leaf2: ramp('#5f9a6c', true),
  claw: ramp('#f3e4c8'),
  ink: '#4a2733',
};

function rootImp(pose, f, mood) {
  const { walk, att, p, it, br, hurt, dead, angry, happy } = timing(pose, f, mood);
  const P = IMP;
  // Body pose: drop, forward lean, shift, squash.
  let by;
  let lean;
  let dx = 0;
  let sq = 0;
  if (walk) {
    by = 0.75 * Math.cos(2 * p - 0.7) + 0.2;
    lean = 0.14 + 0.04 * Math.sin(2 * p - 1.2);
    dx = 0.5;
  } else if (att >= 0) {
    // Crouch back (held), lunge, the follow-through held past the target, settle.
    [by, lean, dx, sq] = [[1.7, -0.3, -1.2, -0.07], [0.1, 0.34, 1.8, 0.04], [0.5, 0.4, 2.2, -0.04], [0.3, 0.12, 0.8, 0]][att];
  } else {
    by = -0.6 * br;
    lean = 0.03 + 0.03 * Math.sin(it + 0.6);
    dx = 0.45 * Math.sin(it + 0.9);
    sq = 0.025 * br;
  }
  if (angry && att < 0) lean += 0.06;
  if (hurt) {
    lean = -0.26;
    dx -= 1.4;
    by += 0.5;
    sq = -0.04;
  }
  if (dead) {
    lean = 0.26;
    by = 3.6;
    dx = 0.4;
  }
  const floor = 36.6;
  const hipY = 29.8 + by;
  const MP = joint(ID, 16.4 + dx, hipY, lean);
  // The head lags the body a beat (overlap) and acts the mood.
  const headA = (walk ? -lean * 0.6 + 0.06 * Math.sin(2 * p - 1.9) : att >= 0 ? [-0.16, 0.14, 0.1, 0.03][att] : -lean * 0.5 + 0.045 * Math.sin(it - 0.8)) + (hurt ? -0.24 : 0) + (dead ? 0.22 : 0) + (angry && att < 0 ? 0.05 : 0);
  const MH = snapJ(joint(MP, 0.8, -9.2, headA));
  const out = [];

  // Tail: a root curling up behind, each segment lagging the one before.
  {
    const wave = (i) => (walk ? 0.2 * Math.sin(2 * p - 1.2 - i * 0.7) : att >= 0 ? [0.14, -0.22, -0.12, 0.04][att] * (1 + i * 0.3) : 0.12 * Math.sin(it - 1 - i * 0.75)) * (0.5 + i * 0.25);
    const a0 = Math.PI + (dead ? -0.4 : walk ? 0.05 : 0.25) + key(att, [0.3, -0.2, -0.25, 0], 0);
    const { pts, a } = chainPts(-4.4, -0.4, a0, 5, (i) => 2.6 - i * 0.2, (i) => (dead ? 0.05 : 0.3) + wave(i));
    const tl = [...limbR(pts, 2.4, 0.9, P.bark)];
    // The corrupted spade leaf at the tip.
    const L = joint(ID, pts[5][0], pts[5][1], a);
    tl.push(...place(L, [fp([[-0.4, 0], [1.4, -1.9], [4.2, 0], [1.4, 1.9]], PURP_DK), fp([[0, 0], [1.4, -1.35], [3.6, 0], [1.4, 1.35]], PURP), fp([[0.3, 0], [1.3, -0.55], [2.7, 0]], PURP_HI)]));
    out.push(...place(MP, tl));
  }

  // Legs: IK from the hips to planted feet; root toes splay on the ground.
  const leg = (hx, q, R, back) => {
    const H = at(MP, hx, 0.4);
    let ft;
    if (walk) {
      const [ox, lift] = footStep(q, 3.4, 2.4);
      ft = [16.4 + dx + hx + ox, floor - lift];
    } else if (att >= 0) ft = [16.4 + hx + (back ? -1.6 : [-0.6, 2.8, 3.2, 1.6][att]), floor];
    else if (dead) ft = [16.4 + hx + (back ? -2.4 : 2.6), floor];
    else ft = [16.4 + hx + (back ? -1.2 : 1.1) + dx * 0.3, floor];
    const [K, Ft] = ik(H, ft, 3.7, 3.7, 1);
    const res = [...limbR([H, K, Ft], 3.2, 2.5, R)];
    const toe = (a, l, w) => {
      const tp = [Ft[0] + Math.cos(a) * l, Math.min(floor + 1.1, Ft[1] + 0.6 + Math.sin(a) * l)];
      return limb([[Ft[0], Ft[1] + 0.4], lerp([Ft[0], Ft[1] + 0.4], tp, 0.55), tp], w, 0.4, R.base, R.sh2);
    };
    res.push(...toe(Math.PI - 0.15, 2.6, 1.5), ...toe(0.12, 3.6, 1.9), fov(Ft[0] + 0.3, Ft[1] + 0.5, 1.5, 1.1, R.base));
    return res;
  };
  // Arms: shoulder and elbow angles per pose; three thorn claws in the hand's own frame.
  const armAngles = (front) => {
    if (dead) return [1.65, 0.1];
    if (att >= 0) return front ? [[-2.75, -0.25], [0.45, 0.15], [0.95, 0.35], [1.25, -0.6]][att] : [[1.0, -0.6], [2.25, -0.4], [2.2, -0.5], [1.8, -0.6]][att];
    if (hurt) return front ? [0.2, -0.5] : [-2.4, -0.4];
    if (angry) return front ? [0.55, -1.35] : [1.15, -1.2];
    if (walk) return front ? [Math.PI / 2 + 0.75 * Math.cos(p), -0.95] : [Math.PI / 2 - 0.75 * Math.cos(p), -0.85];
    return front ? [1.2 + 0.07 * Math.sin(it - 0.6), -1.15] : [1.75 + 0.05 * Math.sin(it - 0.9), -0.65];
  };
  const armOf = (S, front, R) => {
    const [a1, a2] = armAngles(front);
    // The wind-up stretches the cocked arm so the claws clear the back of the head.
    const st = front && att === 0 ? 1.3 : 1;
    const [El, Hd, ha] = arm2(S, 3.9 * st, 3.6 * st, a1, a2);
    const res = [...limbR([S, El, Hd], 2.5, 2, R)];
    const spread = front && att === 0 ? 0.62 : 0.45;
    const claws = [];
    for (const k of [-1, 0, 1]) {
      const l = k === 0 ? 3.9 : 3.1;
      claws.push(fp([[0, -0.75], [l * 0.55, -0.55], [l, 0.25], [l * 0.45, 0.6], [0, 0.6]].map(([x, y]) => [x * Math.cos(k * spread) - y * Math.sin(k * spread), x * Math.sin(k * spread) + y * Math.cos(k * spread)]), front ? P.claw.base : P.claw.sh));
    }
    res.push(...place(joint(ID, Hd[0], Hd[1], ha + (front ? -0.25 : 0)), [fp([[-0.2, -1.05], [3.8, -0.4], [3.8, 0.9], [-0.2, 1.05]].map(([x, y]) => [x * 0.9, y * 1.15]), P.claw.sh2), ...claws]), fov(Hd[0], Hd[1], 1.35, 1.25, R.base));
    return res;
  };

  out.push(...leg(-2, p + Math.PI, P.horn, true));
  out.push(...place(MP, armOf([-2.6, -6.6], false, P.horn)));

  // Torso: a knot of roots, lit from the upper front, with corruption glowing through a crack.
  {
    const t = [];
    t.push(...ball(0.2, -4.2, 5.8, 5.6 + br * 0.25, P.bark));
    t.push(fov(-0.6, 0.2, 4.6, 2.2, P.bark.sh), ov(0.4, -0.4, 4.6, 2.4, P.bark.base, 0, 16));
    t.push(band([[-4.4, -6.6], [-2.6, -4.4], [-3.4, -1.6]], 0.67, P.bark.sh2), band([[3.4, -7.6], [2.4, -5]], 0.67, P.bark.sh));
    t.push(band([[0.6, -9], [1.6, -7.2], [0.8, -5.2], [1.8, -3.4]], (u) => 0.9 - u * 0.4, PURP), fov(1.4, -6.4, 1.3, 1.5, PURP_DK), fov(1.4, -6.5, 0.85, 1.0, PURP), fov(1.2, -6.8, 0.38, 0.42, PURP_HI));
    out.push(...place(MP, t));
  }
  out.push(...leg(2, p, P.bark, false));

  // Leaf loincloth on a vine belt: the leaves swing a beat behind the hips.
  {
    const lv = [];
    for (let i = 0; i < 5; i++) {
      const x = -4.4 + i * 2.2;
      const s = walk ? 0.55 * Math.sin(2 * p - 1.6 - i * 0.5) - 0.4 : att >= 0 ? [0.6, -1, -0.8, -0.2][att] : 0.3 * Math.sin(it - 1.2 - i * 0.4);
      const R = i === 2 ? null : i % 2 ? P.leaf2 : P.leaf;
      const c = R ? R.base : PURP;
      const l = 3.2 + (i % 2) * 0.8;
      lv.push(fp([[x - 1.35, -0.6], [x + 1.35, -0.6], [x + 0.6 + s, l], [x - 0.2 + s, l + 0.3]], R ? R.sh2 : PURP_DK));
      lv.push(fp([[x - 1, -0.4], [x + 1, -0.4], [x + 0.45 + s, l - 0.6], [x - 0.1 + s, l - 0.4]], c));
      lv.push(fp([[x + 0.1, -0.2], [x + 0.9, -0.3], [x + 0.35 + s * 0.6, l * 0.55]], R ? R.hi : PURP_HI));
    }
    lv.push(band([[-5.6, -1], [0.2, -0.3], [5.8, -1.2]], 1, '#4d7a4a'));
    out.push(...place(MP, lv));
  }

  // Head: the back horn and ear, the knotty skull, the face, then the front horn and ear.
  {
    const h = [];
    const earW = walk ? 0.25 * Math.sin(2 * p - 2.2) : att >= 0 ? [-0.3, 0.35, 0.2, 0][att] : (f === 3 ? -0.35 : f === 4 ? 0.15 : 0) + 0.06 * Math.sin(it - 1.4);
    const droop = dead ? 0.6 : hurt ? 0.4 : 0;
    const ear = (x, y, a, l, R) => {
      const tip = [x + Math.cos(a) * l, y + Math.sin(a) * l];
      const nrm = [-Math.sin(a), Math.cos(a)];
      return [fp([[x - nrm[0] * 2, y - nrm[1] * 2], tip, [x + nrm[0] * 2, y + nrm[1] * 2]].map((q, i) => (i === 1 ? q : [q[0], q[1]])), R.sh2), fp([[x - nrm[0] * 1.5, y - nrm[1] * 1.5], lerp([x, y], tip, 0.9), [x + nrm[0] * 1.5, y + nrm[1] * 1.5]], R.base), fp([[x - nrm[0] * 0.6, y - nrm[1] * 0.6], lerp([x, y], tip, 0.62), [x + nrm[0] * 0.8, y + nrm[1] * 0.8]], R.sh)];
    };
    // A root horn: a chain curling back, ridged, with a glowing tip.
    const horn = (x, y, a0, n, R, far) => {
      const { pts } = chainPts(x, y, a0, n, (i) => 2.6 - i * 0.3, (i) => -0.38 - i * 0.1 + (walk ? 0.03 * Math.sin(2 * p - 2 - i) : 0));
      const res = [...limb(pts, 3.2, 0.9, R.base, R.sh2), F(taper(pts.slice(0, -1).map(([px, py]) => [px + 0.5, py - 0.4]), 0.9, 0.5, far ? R.base : R.hi))];
      for (const i of [1, 2]) res.push(band([[pts[i][0] - 0.9, pts[i][1] + 0.6], [pts[i][0] + 0.6, pts[i][1] - 0.6]], 0.6, R.sh2));
      res.push(fov(pts[n][0], pts[n][1], 0.8, 0.8, PURP), fov(pts[n][0] - 0.2, pts[n][1] - 0.2, 0.34, 0.34, PURP_HI, 0, 8));
      return res;
    };
    h.push(...ear(-6.4, -6.6, Math.PI + 0.55 + earW + droop, 5, P.horn));
    h.push(...horn(-2.6, -11.4, -1.95, 3, ramp(P.horn.sh), true));
    // Skull and cheek, lit from the upper front.
    h.push(...ball(1.4, -5.6, 8.6, 7.4, P.head, { hi: false }), ov(4.8, -2.2, 5.4, 3.6, P.head.base, 0, 20), fov(3.6, -1.2, 4.6, 2, P.head.sh));
    h.push(fov(4.6, -2.7, 4.8, 2.4, P.head.base, 0, 18));
    h.push(fov(3.8, -10.4, 3.2, 1.3, P.head.hi, -0.2, 12));
    // Bark grain and a knot on the back of the head (kept off the face).
    h.push(band([[-6.2, -3], [-4.8, -6], [-2.6, -8.4]], 0.67, P.head.sh), band([[-6.8, 0], [-5.2, -1.6]], 0.67, P.head.sh));
    h.push(fov(-3.6, -1.6, 1.3, 1.1, P.head.sh), fov(-3.5, -1.5, 0.6, 0.5, P.head.sh2));
    // Face.
    const ey = -5;
    const eN = [6.2, ey];
    const eF = [1.4, ey + 0.1];
    const glance = walk || att >= 0 ? 0.5 : 0.7 * Math.sin(it + 0.4);
    const ge = { shape: 'sharp', c: TEAL, bg: P.head.sh2, hot: TEAL_HI, look: [glance, 0], flick: (f % 3) / 3 };
    const act = actOf(mood, { idle: { lid: 0.12, slant: 0.15 }, angry: { lid: 0.2, slant: 0.95, raise: 0.3 }, hurt: { closed: 'squeeze' } });
    if (dead) h.push(...deadEye(eF[0], eF[1], 1.3, { type: 'swirl', s: -1, c: P.ink, th: 0.6 }), ...deadEye(eN[0], eN[1], 1.6, { type: 'swirl', c: P.ink, th: 0.67 }));
    else if (hurt) {
      // One eye screwed shut, the other wide and darting: a wince that's the imp's own.
      h.push(...glowEye(eF[0], eF[1], { ...ge, s: -1, w: 1.3, h: 1.7, closed: 'squeeze' }), ...glowEye(eN[0], eN[1], { ...ge, s: 1, w: 1.8, h: 2.3, look: [-0.8, -0.3] }));
    } else h.push(...glowEye(eF[0], eF[1], { ...ge, ...act, s: -1, w: 1.3, h: 1.8 }), ...glowEye(eN[0], eN[1], { ...ge, ...act, s: 1, w: 1.75, h: 2.1 }));
    const [ba, bu] = { idle: [-8, 0], angry: [30, -0.7], hurt: [-26, 0.6], happy: [-14, 0.5], blink: [-4, 0], dead: [-12, 0.2] }[mood] ?? [0, 0];
    h.push(...brow(eF[0], ey - 3 - bu, { s: -1, len: 1.2, angle: ba, th: 0.8, c: P.horn.sh2, shape: 'tuft' }), ...brow(eN[0] + 0.2, ey - 3.3 - bu, { s: 1, len: 1.5, angle: ba, th: 0.85, c: P.horn.sh2, shape: 'tuft' }));
    if (!dead && !angry) h.push(...blush(eN[0] - 0.4, ey + 2.6, 1.1, { on: P.head.base, lines: happy ? 2 : 0 }), ...blush(eF[0] - 1.2, ey + 2.4, 0.8, { on: P.head.base }));
    const mo = { s: 1, ink: P.ink };
    const mx = 4.6;
    const my = -0.6;
    if (att >= 1 && att <= 2) h.push(...mouth(mx, my, { ...mo, type: 'shout', w: 2.4, h: 2.8, open: 1, teeth: 'top', fangs: 2 }));
    else if (angry) h.push(...mouth(mx, my, { ...mo, type: 'snarl', w: 2.5, h: 2.6, open: 1, teeth: 'both', fangs: 2, tongue: false }));
    else if (happy) h.push(...mouth(mx, my - 0.2, { ...mo, type: 'grin', w: 2.1, h: 2.4, open: 1, fangs: 1, fangAt: 0.72, teeth: 'none' }));
    else if (hurt) h.push(...mouth(mx - 0.2, my, { ...mo, type: 'pained', w: 1.9, h: 1.8, open: 1 }), ...sweat(-5.6, -11.6, 1));
    else if (dead) h.push(...mouth(mx, my, { ...mo, type: 'wavy', w: 1.6, amp: 0.25, tongueOut: true, tongueLen: 1.5 }));
    else h.push(...mouth(mx, my, { ...mo, type: 'smirk', w: 1.8, tilt: 0.6, fangs: 1, fangAt: 0.7 }));
    if (angry) h.push(...vein(-3.4, -9.6, 0.85));
    // Front horn and ear.
    h.push(...horn(2.4, -12.2, -1.2, 4, P.horn, false));
    h.push(...ear(8.8, -7.6, -0.7 - earW * 1.2 + droop * 1.4 + (f === 3 && !walk && att < 0 ? -0.35 : 0), 4.4, P.head));
    out.push(...place(MH, h));
  }

  out.push(...place(MP, armOf([2.8, -6.4], true, P.bark)));
  // The swipe: a smear on the strike, sparks on the held impact.
  if (att === 1) out.push(...swoosh(20.6, 22 + by, 9.4, 150, -30, 3.2));
  if (att === 2) out.push(...swoosh(20.6, 22 + by, 9.4, 40, -60, 1.6), star(29.8, 17.4 + by, 2.4), star(31, 22.4 + by, 1.3, TEAL_HI));
  // Drawn 3 px in from the left so the lunge has room; the sprite stays centred on the body.
  return { w: 40, h: 38, res: 3, shapes: place([1, 0, 0, 1, 3, 0], squash(out, 17, floor + 1.4, 1 - sq * 0.8, 1 + sq)) };
}

// ---------- Spore Mite (sporeling) ----------
// A tiny scuttling puffball bug. Signature: a round fluffy body with a glowing spore sac swelling
// off its rear, two glow-tipped antennae. Big glossy dark eyes on a shiny head, little mandibles.
// Rig: body (pitch) > head > mandibles and two three-segment antennae; body > sac (it pulses and
// lags); six IK legs on a tripod gait (three plant while three swing).

const MITE = {
  puff: ramp('#efd0ec'),
  shell: ramp('#a68ad2', true),
  leg: ramp('#8a6fae', true),
  sac: ramp('#6fd6c6', true),
  ink: '#3f2450',
};

function sporeMite(pose, f, mood) {
  const { walk, att, p, it, br, hurt, dead, angry, happy } = timing(pose, f, mood);
  const P = MITE;
  const floor = 19.4;
  let by;
  let pitch;
  let dx = 0;
  let sq = 0;
  if (walk) {
    by = -0.45 * Math.abs(Math.sin(p)) + 0.15;
    pitch = 0.03 * Math.sin(2 * p);
  } else if (att >= 0) {
    // Rears back with the mandibles wide (held), lunges, the snap held, settles.
    [by, pitch, dx, sq] = [[0.5, -0.24, -1.2, -0.08], [-0.6, 0.12, 1.6, 0.06], [-0.2, 0.16, 1.9, -0.05], [0, 0.04, 0.6, 0]][att];
  } else {
    by = -0.35 * br;
    pitch = 0.015 * Math.sin(it + 0.6);
    dx = 0.3 * Math.sin(it + 1.2);
    sq = 0.03 * br;
  }
  if (hurt) {
    pitch = -0.18;
    dx -= 1;
  }
  if (dead) {
    by = 2.6;
    pitch = 0.1;
  }
  const MB = joint(ID, 10.6 + dx, 11.4 + by, pitch);
  const headA = (walk ? 0.05 * Math.sin(2 * p - 1.5) : att >= 0 ? [-0.18, 0.1, 0.16, 0.04][att] : 0.04 * Math.sin(it - 1)) + (hurt ? -0.25 : 0) + (dead ? 0.3 : 0);
  const MH = snapJ(joint(MB, 5.8, 0.2, headA));
  const out = [];

  // Legs: hip on the body, a high knee, a planted foot (tripod: legs 0, 2 of one side with 1 of
  // the other move together).
  const legOf = (i, far) => {
    const hx = [-3.4, 0.2, 3.6][i];
    const H = at(MB, hx + (far ? 0.8 : 0), 2.2 - (far ? 0.7 : 0));
    const grp = (i === 1) !== far ? 0 : Math.PI;
    const rest = 10.6 + dx + hx + [-2.6, 0.4, 3][i] + (far ? 0.8 : 0);
    let ft;
    if (walk) {
      const [ox, lift] = footStep(p + grp, 2, 1.6);
      ft = [rest + ox, floor - lift - (far ? 0.4 : 0)];
    } else if (dead) ft = [rest + [-1.2, 0, 1.2][i], 11.2 + by];
    else ft = [rest + (att >= 0 ? [-0.6, 0.6, 0.8, 0.2][att] : 0), floor - (far ? 0.4 : 0)];
    const R = far ? ramp(P.leg.sh, true) : P.leg;
    const [K, Ft] = ik(H, ft, 3.8, 4.4, i === 0 ? -1 : 1);
    return [...limb([H, K, Ft], 0.95, 0.55, R.base, R.sh2), fov(K[0], K[1], 0.45, 0.45, R.hi, 0, 8)];
  };
  for (let i = 0; i < 3; i++) out.push(...legOf(i, true));

  // The spore sac on the rear: it swells with each breath or step and lags the body.
  const pulse = att >= 0 ? [1, 0.2, 0.5, 0.7][att] : walk ? 0.5 + 0.5 * Math.cos(p * 2) : 0.4 + 0.6 * br;
  const sacA = (walk ? 0.08 * Math.sin(2 * p - 1.8) : att >= 0 ? [0.25, -0.2, -0.15, 0][att] : 0.05 * Math.sin(it - 1.4)) + (dead ? 0.3 : 0);
  {
    const s = [];
    const r = 3 + pulse * 0.45;
    const R = P.sac;
    const gC = dead ? '#a49cb0' : TEAL;
    s.push(...limb([[0.6, -1.4], [-0.3, -3]], 1.5, 1.1, R.sh, R.sh2), fov(-0.35, -3.3, 0.85, 0.5, TEAL_HI, 0, 8));
    s.push(ov(-0.6, 1.6, r, r * 0.95, R.sh2, 0, 20), fov(-0.3, 1.3, r * 0.8, r * 0.76, dead ? R.sh : mix(gC, R.base, 0.3), 0, 18));
    for (const [x, y, rr] of [[-1.4, 2.2, 0.7], [0.6, 0.6, 0.55], [0.2, 2.9, 0.45]]) s.push(fov(x, y, rr * (0.8 + pulse * 0.4), rr * (0.8 + pulse * 0.4), dead ? R.hi : TEAL_HI, 0, 10));
    s.push(fov(0.6, -0.6, 0.9, 0.55, '#ffffff', -0.3, 10));
    out.push(...place(joint(MB, -5.6, -2.6, sacA), s));
  }

  // The puffball body: fluff along the top edge, the shadow underneath, light on the upper front.
  {
    const b = [];
    const R = P.puff;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.05 + (i / 6) * 0.95);
      const w = walk ? 0.25 * Math.sin(2 * p - 1 - i * 0.6) : 0.15 * Math.sin(it - i * 0.5);
      b.push(ov(Math.cos(a) * 5.4, Math.sin(a) * 4.2 + w, 1.9, 1.7, R.base, 0, 12));
    }
    b.push(ov(0, 0, 6.2, 4.8, R.sh, 0, 24), fov(0.5, -0.5, 5.6, 4.1, R.base, 0, 22), fov(-0.6, 3.1, 4.8, 1.3, R.sh2, 0, 16));
    b.push(fov(1.6, -2.6, 2.2, 0.9, R.hi, -0.2, 12));
    for (const [x, y, r] of [[-3, 0.4, 0.55], [-0.6, -1.6, 0.5], [1.8, 1, 0.5]]) b.push(fov(x, y, r, r * 0.8, R.sh2, 0, 10), fov(x + 0.15, y - 0.15, r * 0.4, r * 0.4, PURP_HI, 0, 8));
    out.push(...place(MB, b));
  }
  for (let i = 0; i < 3; i++) out.push(...legOf(i, false));

  // Head: a shiny shell with big glossy eyes, mandibles, and glow-tipped antennae.
  {
    const h = [];
    const R = P.shell;
    const aw = walk ? 0.18 * Math.sin(2 * p - 1.6) : att >= 0 ? [0.5, -0.4, -0.3, 0.1][att] : 0.12 * Math.sin(it - 0.6) + (f === 2 ? -0.25 : 0);
    const ant = (x, far) => {
      const a0 = dead ? -0.6 : -1.45 + (angry ? 0.15 : 0);
      const { pts } = chainPts(x, -3.2, a0, 3, 1.9, (i) => (dead ? 0.35 : 0.22) + aw * (0.4 + i * 0.35));
      const AR = far ? ramp(R.sh, true) : R;
      const tip = pts[3];
      return [...limb(pts, 0.85, 0.6, AR.base, AR.sh2), fov(tip[0], tip[1], 1.2, 1.2, TEAL_DK, 0, 12), fov(tip[0], tip[1], 0.9, 0.9, dead ? '#a49cb0' : TEAL, 0, 12), fov(tip[0] - 0.25, tip[1] - 0.25, 0.38, 0.38, TEAL_HI, 0, 8)];
    };
    h.push(...ant(-0.6, true));
    const mo = att >= 0 ? [1.4, 0.2, -0.3, 0.4][att] : angry ? 0.7 : walk ? Math.max(0, Math.sin(p * 2)) * 0.3 : 0.1 * br;
    for (const s of [-1, 1]) {
      const MR = s < 0 ? P.puff : ramp('#f6ead8');
      h.push(...limb([[3.4, 1.6 + s * 0.5], [5.4, 1.8 + s * (0.8 + mo)], [6.2, 1.1 + s * (0.1 + mo)]], 1.1, 0.35, s < 0 ? MR.sh : MR.base, MR.sh2));
    }
    h.push(C(ov(0, 0, 4.6, 4.2, R.sh, 0, 22)), fov(0.4, -0.4, 4.1, 3.7, R.base, 0, 20), fov(1.3, -2.6, 1.8, 0.8, R.hi, -0.2, 10));
    h.push(...ant(1.4, false));
    // Big glossy dark eyes (no white) with two catchlights: the face's strongest contrast.
    const glance = walk || att >= 0 ? 0.6 : 0.8 * Math.sin(it * 2);
    const me = { shape: 'animal', iris: ['#0e2f3a', '#1f6f78', '#7fe6d8'], pupil: 'round', pupilC: '#0a1a24', lashC: P.ink, look: [glance, 0.1], shine: 1.2 };
    const act = actOf(mood, { idle: {}, angry: { lid: 0.35, slant: 0.9, raise: 0.2 } });
    const eF = [-0.6, 0.3];
    const eN = [2.4, 0.2];
    if (dead) h.push(...deadEye(eF[0], eF[1], 0.95, { type: 'swirl', s: -1, c: P.ink, th: 0.5 }), ...deadEye(eN[0], eN[1], 1.1, { type: 'swirl', c: P.ink, th: 0.55 }));
    else h.push(...eye(eF[0], eF[1], { ...me, ...act, s: -1, w: 1.15, h: 1.4 }), ...eye(eN[0], eN[1], { ...me, ...act, s: 1, w: 1.35, h: 1.55 }));
    if (!dead && !angry) h.push(...blush(-1.6, 2.6, 0.8, { on: R.base }));
    if (happy) h.push(...mouth(1.2, 2.9, { s: 1, type: 'grin', w: 0.9, h: 1.1, open: 1, teeth: 'none', ink: P.ink }));
    else if (angry || att >= 0) h.push(...mouth(1.2, 2.8, { s: 1, type: 'snarl', w: 1, h: 1.1, open: 1, teeth: 'top', tongue: false, ink: P.ink }));
    else if (hurt) h.push(...mouth(1.2, 2.9, { s: 1, type: 'o', w: 0.6, h: 0.9, open: 1, tongue: false, ink: P.ink }), ...sweat(3.6, -3.2, 0.7));
    out.push(...place(MH, h));
  }

  // Puffs from the vent as it scuttles; the bite snaps with a spark.
  if (!dead) {
    const v = walk ? f / 8 : f / 6;
    const V = at(MB, -6, -6.4);
    out.push(...mote(V[0] - 1 - v * 1.4, V[1] - 1 - v * 1.4, 0.6 - v * 0.2, TEAL), ...mote(V[0] + 0.6 + v, V[1] - 1.8 - v * 1.2, 0.45, PURP));
  }
  const M = at(MH, 6.4, 1.4);
  if (att === 1) out.push(star(M[0] + 0.6, M[1], 1.9));
  if (att === 2) out.push(star(M[0] + 0.4, M[1] - 0.6, 1.3, TEAL_HI), star(M[0] + 1.6, M[1] + 0.8, 0.8));
  const shapes = squash(out, 11, floor + 0.2, 1 - sq * 0.8, 1 + sq);
  return { w: 26, h: 21, res: 3, shapes: place([1, 0, 0, 1, 1, 1], shapes) };
}

// ---------- Myconid Shaman (sporecap) ----------
// A mushroom-folk caster. Signature: a broad frilled cap whose floppy tip flops behind, over a
// stout stem body; a gnarled staff topped with a glowing spore pod in a cage of roots. Its face
// sits in the cap's shade, sleepy glowing eyes over violet war paint; a leaf mantle and a bead
// necklace. Rig: pelvis > stem > neck > cap > four-segment floppy tip; shoulders > IK arms; the
// staff rides the front hand (it runs from its foot through the grip, so it plants and swings with
// the hand); hips > stubby feet. A hobbling march: the staff plants, the body limps past it.

const MYC = {
  stem: ramp('#f2e2c9'),
  cap: ramp('#8c6fd4', true),
  gill: ramp('#e7b9dc'),
  frill: ramp('#f6c3dc'),
  wood: ramp('#8f6a50'),
  leaf: ramp('#74a87c', true),
  paint: '#8d5fd6',
  ink: '#5a2c4a',
};

function myconid(pose, f, mood) {
  const { walk, att, p, it, br, hurt, dead, angry, happy } = timing(pose, f, mood);
  const P = MYC;
  const floor = 43.4;
  const u = f / 8;
  // Body: the limp dips deep onto the bad leg and hitches up off the good one.
  let by;
  let lean;
  let dx = 0;
  let sq = 0;
  if (walk) {
    by = 0.9 * Math.max(0, Math.sin(p)) ** 1.5 - 0.35 * Math.max(0, -Math.sin(p));
    lean = 0.05 * Math.sin(p) + 0.02;
  } else if (att >= 0) {
    // Rears back with the staff overhead (held), swings it down, the burst held, settle.
    [by, lean, dx, sq] = [[-0.6, -0.16, -0.8, 0.05], [0.4, 0.12, 0.8, -0.03], [0.9, 0.16, 1.1, -0.06], [0.3, 0.05, 0.4, 0]][att];
  } else {
    by = -0.5 * br;
    lean = 0.02 * Math.sin(it + 0.7);
    dx = 0.4 * Math.sin(it + 1);
    sq = 0.02 * br;
  }
  if (hurt) {
    lean = -0.2;
    dx -= 1.2;
    sq = -0.04;
  }
  if (dead) {
    lean = 0.18;
    by = 2.2;
  }
  const MP = joint(ID, 16.6 + dx, 37.6 + by, lean);
  // The cap lags the stem (overlap) and acts the mood: tipped back in pain, forward when dead.
  const capA = (walk ? -0.05 * Math.sin(p - 1.1) : att >= 0 ? [-0.16, 0.1, 0.14, 0.04][att] : -0.03 * Math.sin(it - 0.9)) + (hurt ? -0.2 : 0) + (dead ? 0.22 : 0) + (angry && att < 0 ? 0.06 : 0);
  const MC = joint(MP, 0.4, -15.2, capA);
  const out = [];

  // Staff: it runs from its foot through the grip, so it rides the hand. Walking, the foot plants
  // (the body passes it) and the hand carries it ahead; elsewhere the hand sets its angle.
  const S = at(MP, 4.4, -5.4);
  let grip;
  let sa;
  if (walk) {
    const planted = u < 0.5;
    const k = planted ? u / 0.5 : (u - 0.5) / 0.5;
    const bx = planted ? 30 - k * 7 : 23 + smooth(k) * 7;
    const lift = planted ? 0 : Math.sin(k * Math.PI) * 2.4;
    const foot = [bx + dx, floor - lift];
    grip = [bx - 2.2 + dx, S[1] + 2.4 - lift * 0.4];
    sa = Math.atan2(grip[1] - foot[1], grip[0] - foot[0]);
  } else if (att >= 0) {
    grip = [[S[0] + 1.6, S[1] - 6.4], [S[0] + 5, S[1] - 2.4], [S[0] + 5.6, S[1] + 0.2], [S[0] + 5, S[1] + 2.2]][att];
    sa = [-1.72, -0.95, -0.55, -1.3][att];
  } else if (dead) {
    grip = [S[0] + 3, S[1] + 4.4];
    sa = -0.35;
  } else {
    const r = angry ? 3 : 0.4 * br;
    grip = [S[0] + 5.2 + (hurt ? -1.2 : 0), S[1] + 3.6 - r];
    sa = -1.66 + (hurt ? -0.2 : 0) + 0.02 * Math.sin(it - 0.8);
  }
  const gd = 11.5;
  const sLen = 28;
  const MS = joint(ID, grip[0] - Math.cos(sa) * gd, grip[1] - Math.sin(sa) * gd, sa);
  const top = at(MS, sLen, 0);

  // Back foot and back arm (the free hand: it gestures, and flares open for the cast).
  const footOf = (hx, q, R) => {
    const H = at(MP, hx, 0.6);
    let ft;
    if (walk) {
      const [ox, lift] = footStep(q, 3.6, hx > 0 ? 2.4 : 1.1);
      ft = [16.6 + hx + ox, floor - 1 - lift];
    } else ft = [16.6 + hx + (dead ? (hx > 0 ? 2.4 : -2.4) : att >= 0 ? (hx > 0 ? [-0.6, 1.4, 1.6, 0.6][att] : -0.6) : 0) + dx * 0.4, floor - 1];
    return [...limbR([H, ft], 3, 2.8, R), ...ball(ft[0] + 0.7, ft[1], 2.8, 1.5, R, { hi: false })];
  };
  const backHand = () => {
    const Sb = [-5.4, -7.4];
    const [a1, a2] = dead ? [1.75, 0] : hurt ? [-2.5, -0.5] : att >= 0 ? [[-2.2, 0.4], [2.6, -0.3], [2.5, -0.5], [2, -0.6]][att] : walk ? [Math.PI / 2 + 0.4 + 0.45 * Math.cos(p), -0.5] : angry ? [-2.4, 0.5] : [2 - 0.08 * br, -0.6];
    const [El, Hd] = arm2(Sb, 3.4, 3, a1, a2);
    const res = [...limbR([Sb, El, Hd], 2.6, 2.1, P.stem), ...ball(Hd[0], Hd[1], 1.4, 1.35, P.stem, { hi: false })];
    if (att === 0 || (angry && att < 0)) res.push(...mote(Hd[0] - 1.4, Hd[1] - 2.2, 0.7, TEAL), ...mote(Hd[0] + 0.8, Hd[1] - 3, 0.5, PURP));
    return res;
  };
  out.push(...footOf(-2.6, p + Math.PI, ramp(P.stem.sh)));
  out.push(...place(MP, backHand()));
  out.push(...footOf(2.8, p, P.stem));

  // The stem body: lit from the upper front, darker under the cap's shade.
  {
    const b = [];
    b.push(...ball(0, -5.6, 7.2, 9.4 + br * 0.3, P.stem, { hi: false }), ov(0, 0.4, 7, 3.4, P.stem.base, 0, 18), fov(-1, 1.6, 6, 2, P.stem.sh));
    b.push(fov(2.6, -1.2, 2.4, 2, P.stem.hi, 0, 12));
    // The cap's shade across the top of the stem, where the face sits.
    b.push(fp([[-6.4, -14.4], [6.4, -14.4], [6.8, -12.4], [3, -11.9], [-3, -12], [-6.5, -12.6]], P.stem.sh));
    // Leaf mantle: each leaf swings a beat after the one before.
    for (let i = 0; i < 6; i++) {
      const x = -6 + i * 2.5;
      const s = walk ? 0.6 * Math.sin(p - 1.4 - i * 0.5) : att >= 0 ? [-0.7, 0.9, 0.5, 0][att] * (0.6 + i * 0.1) : 0.25 * Math.sin(it - 1 - i * 0.45);
      const R = i % 2 ? ramp(P.leaf.sh, true) : P.leaf;
      const y0 = -5.2 + Math.abs(i - 2.5) * 0.35;
      const l = 3.6 + (i % 2) * 0.6;
      b.push(fp([[x - 1.7, y0], [x + 1.7, y0], [x + 0.4 + s, y0 + l + 0.4], [x - 0.5 + s, y0 + l]], R.sh2), fp([[x - 1.3, y0 + 0.1], [x + 1.3, y0 + 0.1], [x + 0.35 + s, y0 + l - 0.3], [x - 0.35 + s, y0 + l - 0.5]], R.base), fp([[x + 0.1, y0 + 0.2], [x + 1, y0 + 0.2], [x + 0.3 + s * 0.6, y0 + l * 0.55]], R.hi));
    }
    // Bead necklace with a fang pendant.
    const beads = [TEAL, PURP, TEAL, PURP, TEAL];
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.2 + (i / 4) * 0.6);
      const x = 0.8 + Math.cos(a) * 5;
      const y = -2.6 + Math.sin(a) * 2.4;
      b.push(fov(x, y, 0.95, 0.95, shade(beads[i], -32), 0, 10), fov(x, y, 0.65, 0.65, beads[i], 0, 10));
    }
    b.push(fp([[-0.4, -1.3], [2, -1.3], [0.9, 1.6]], P.stem.sh2), fp([[0, -1.2], [1.6, -1.2], [0.85, 1]], '#fffaf0'));
    // The face: sleepy glowing eyes in the shade, war paint, a small mouth.
    const fx = 2.6;
    const fy = -9.6;
    const eN = [fx + 2.6, fy];
    const eF = [fx - 2.6, fy + 0.1];
    const glance = walk || att >= 0 ? 0.5 : 0.8 * Math.sin(it + 1);
    const ge = { shape: 'heavy', c: TEAL, bg: mix(P.stem.sh2, '#3a2046', 0.55), look: [glance, 0.2], flick: (f % 4) / 4 };
    const act = actOf(mood, { idle: { lid: 0.48 }, blink: { closed: 'sleep' }, angry: { lid: 0.3, slant: 0.85, raise: 0.2 } });
    if (dead) b.push(...deadEye(eF[0], eF[1], 1.3, { c: P.ink, th: 0.6 }), ...deadEye(eN[0], eN[1], 1.45, { c: P.ink, th: 0.65 }));
    else b.push(...glowEye(eF[0], eF[1], { ...ge, ...act, s: -1, w: 1.55, h: 1.7 }), ...glowEye(eN[0], eN[1], { ...ge, ...act, s: 1, w: 1.8, h: 1.85 }));
    const [ba, bu] = { idle: [-4, 0], angry: [28, -0.6], hurt: [-26, 0.5], happy: [-10, 0.4], blink: [-4, 0], dead: [-10, 0] }[mood] ?? [0, 0];
    b.push(...brow(eF[0], fy - 2.8 - bu, { s: -1, len: 1.3, angle: ba, th: 0.7, c: P.ink, shape: 'flat', arch: 0.2 }), ...brow(eN[0], fy - 2.9 - bu, { s: 1, len: 1.5, angle: ba, th: 0.75, c: P.ink, shape: 'flat', arch: 0.2 }));
    if (!dead && !hurt) for (const [x, s] of [[eF[0] - 0.6, -1], [eN[0] + 0.4, 1]]) b.push(band([[x - 1, fy + 2.4], [x, fy + 3.1], [x + 1, fy + 2.4]], 0.67, P.paint));
    const mo = { s: 1, ink: P.ink };
    const my = fy + 3.6;
    if (att === 0 || att === 1) b.push(...mouth(fx + 0.4, my - 0.2, { ...mo, type: 'shout', w: 1.6, h: 2.2, open: 1, teeth: 'top' }));
    else if (angry) b.push(...mouth(fx + 0.4, my, { ...mo, type: 'snarl', w: 1.7, h: 1.8, open: 1, teeth: 'top', fangs: 2, tongue: false }));
    else if (happy) b.push(...mouth(fx + 0.4, my, { ...mo, type: 'grin', w: 1.5, h: 1.8, open: 1, teeth: 'none' }));
    else if (hurt) b.push(...mouth(fx + 0.4, my, { ...mo, type: 'o', w: 0.8, h: 1.4, open: 1, tongue: false }), ...tear(eN[0] + 1.4, fy + 1.4, 0.8));
    else if (dead) b.push(...mouth(fx + 0.4, my, { ...mo, type: 'wavy', w: 1.3, amp: 0.2 }));
    else b.push(...mouth(fx + 0.4, my, { ...mo, type: 'smile', w: 1.2, curve: 0.35 }));
    if (!dead && !angry) b.push(...blush(eN[0] + 0.8, fy + 2.1, 0.8, { on: P.stem.base, lines: happy ? 2 : 0 }));
    out.push(...place(MP, b));
  }

  // The cap: a frilled dome over gills, glowing spots, and a floppy tip that flops behind.
  {
    const c = [];
    const R = P.cap;
    const rx = 14.6 * (dead ? 0.97 : 1);
    const ry = 10.2;
    const cx = -1;
    const cy = -2.6;
    // The floppy tip: a chain that trails the cap's motion, root first.
    const wave = (i) => (walk ? 0.16 * Math.sin(p - 1.4 - i * 0.8) : att >= 0 ? [0.2, -0.25, -0.15, 0.05][att] * (0.6 + i * 0.3) : 0.1 * Math.sin(it - 1.2 - i * 0.8)) + (hurt ? 0.12 : 0) + (dead ? 0.25 : 0);
    const { pts } = chainPts(cx - 3.4, cy - 8.4, -1.75, 4, (i) => 3.4 - i * 0.4, (i) => -0.5 - i * 0.12 + wave(i));
    c.push(...limb(pts, 6.4, 1.2, R.sh, R.sh2), F(taper(pts.slice(0, 4).map(([x, y]) => [x + 0.6, y - 0.2]), 3.4, 0.9, R.base)), F(taper(pts.slice(0, 3).map(([x, y]) => [x + 1.4, y - 0.5]), 1, 0.4, R.hi)));
    const dome = [];
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI * (1 + i / 16);
      dome.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    c.push(C(pg([...dome, [cx + rx, cy + 1.6], [cx - rx, cy + 1.6]], R.sh)));
    const lit = dome.map(([x, y]) => [cx + (x - cx) * 0.9 + 1.4, cy + (y - cy) * 0.86 - 0.8]);
    c.push(fp([...lit, [cx + rx * 0.98, cy + 0.6], [cx - rx * 0.6, cy + 0.2]], R.base));
    c.push(fov(cx + 3.6, cy - 7.2, 5.6, 1.7, R.hi, -0.12, 16));
    // Gills, then the ruffled frill along the brim: alternating scallops, each swaying a beat late.
    c.push(fp([[cx - rx + 0.6, cy + 1.2], [cx + rx - 0.6, cy + 1.2], [cx + rx - 2, cy + 3.2], [cx - rx + 2, cy + 3.2]], P.gill.sh));
    for (let i = 0; i < 9; i++) {
      const x = cx - rx + 1.6 + i * ((2 * rx - 3.2) / 8);
      const w = walk ? 0.4 * Math.sin(p - 1.6 - i * 0.6) : 0.25 * Math.sin(it - 1 - i * 0.5);
      const yy = cy + 2.4 + (i % 2) * 0.4 + w;
      const FR = i % 2 ? P.frill : ramp(P.frill.sh);
      c.push(ov(x, yy, 2.1, 1.5, FR.base, 0, 14), fov(x - 0.5, yy + 0.5, 1.3, 0.6, FR.sh, 0, 10));
    }
    // Glowing spots, pulsing (five clean clusters).
    const pulse = att >= 0 ? [1, 0.6, 0.2, 0.4][att] : walk ? 0.5 + 0.5 * Math.sin(p) : 0.5 + 0.5 * Math.sin(it);
    // Pale spots on the cap; the two biggest glow (the accent stays small).
    const spot = mix(R.hi, '#ffffff', 0.45);
    for (const [x, y, r, g] of [[-8, -4.4, 2, 1], [0.4, -8.2, 2.3, 1], [7.4, -4.6, 1.9, 0], [-2.6, -1.4, 1.3, 0], [4.4, -0.8, 1.2, 0]]) {
      const rr = r * (g ? 0.94 + 0.12 * pulse : 1);
      c.push(fov(cx + x, cy + y, rr + 0.45, rr * 0.8 + 0.4, R.sh2, 0, 14), fov(cx + x, cy + y, rr, rr * 0.8, spot, 0, 14));
      if (g && !dead) c.push(fov(cx + x - 0.2, cy + y + 0.2, rr * 0.6, rr * 0.48, TEAL, 0, 12), fov(cx + x + 0.2, cy + y - 0.1, rr * 0.25, rr * 0.22, TEAL_HI, 0, 8));
    }
    out.push(...place(MC, c));
  }

  // Staff (it rides the front hand) with the caged pod, then the front arm gripping it.
  {
    const s = [];
    const W = P.wood;
    s.push(...limb([[0, 0], [sLen * 0.5, 0.3], [sLen, 0]], 2.2, 1.7, W.base, W.sh2), F(taper([[1, -0.5], [sLen - 1, -0.5]], 0.67, 0.67, W.hi)));
    for (const t of [0.25, 0.62]) s.push(fov(sLen * t, 0, 0.6, 1.25, W.sh, 0, 10));
    // Cloth wrap under the pod and a charm swinging from it a beat behind.
    const sw = walk ? 0.5 * Math.sin(p * 2 - 1.6) : att >= 0 ? [-0.6, 0.7, 0.4, -0.1][att] : 0.25 * Math.sin(it - 0.6);
    s.push(fp([[sLen * 0.86, -1.3], [sLen * 0.9, -1.3], [sLen * 0.9, 1.3], [sLen * 0.86, 1.3]], '#c46f8c'), fp([[sLen * 0.9, -1.3], [sLen * 0.93, -1.3], [sLen * 0.93, 1.3], [sLen * 0.9, 1.3]], '#e08aa6'));
    s.push(band([[sLen * 0.88, 1.2], [sLen * 0.88 - 2.4, 1.6 + sw * 1.4]], 0.5, W.sh2), fov(sLen * 0.88 - 3, 1.8 + sw * 1.6, 0.8, 0.8, PURP, 0, 10));
    // The pod in its root cage.
    const pg2 = 1 + (att === 0 ? 0.25 : att === 1 ? 0.1 : 0) + (angry ? 0.1 : 0) + 0.06 * br;
    const o = [sLen + 3.2, 0];
    const gC = dead ? '#a49cb0' : TEAL;
    s.push(...limb([[sLen, 0], [o[0] - 0.6, -2.8], [o[0] + 2.8, -2.6], [o[0] + 3.6, -1.2]], 1.3, 0.5, W.sh, W.sh2));
    s.push(fov(o[0], o[1], 3.3 * pg2, 3.3 * pg2, TEAL_DK, 0, 20), fov(o[0], o[1], 2.8 * pg2, 2.8 * pg2, gC, 0, 18), fov(o[0] + 0.5, o[1] - 0.3, 1.3 * pg2, 1.3 * pg2, TEAL_HI, 0, 12), fov(o[0] + 1.3, o[1] - 1.2, 0.6, 0.6, '#ffffff', 0, 8));
    s.push(...limb([[sLen, 0], [o[0] - 0.4, 2.8], [o[0] + 2.8, 2.8], [o[0] + 3.6, 1.2]], 1.3, 0.5, W.base, W.sh2));
    out.push(...place(MS, s));
    // Motes rising off the pod, more of them when it's raised.
    const n = att === 0 || angry ? 4 : 2;
    const mt = walk ? f / 8 : f / 6;
    for (let i = 0; i < n; i++) {
      const v = (mt + i / n) % 1;
      out.push(...mote(top[0] + 3 + Math.sin(v * TAU + i * 2) * 2.6, top[1] - 4 - v * 3.6, 0.6 - v * 0.2, i % 2 ? PURP : TEAL));
    }
    // The front arm reaches the grip (IK), the hand closes over the staff.
    const [El, Hd] = ik(S, grip, 3.6, 3.6, 1);
    out.push(...limbR([S, El, Hd], 2.6, 2.1, P.stem), ...ball(Hd[0], Hd[1], 1.6, 1.5, P.stem, { hi: false }), fp([[Hd[0] - 0.4, Hd[1] - 1], [Hd[0] + 0.4, Hd[1] - 1], [Hd[0] + 0.4, Hd[1] + 1], [Hd[0] - 0.4, Hd[1] + 1]], P.stem.sh));
  }

  // The cast: spores gather into the raised pod (held), then burst out as it swings down.
  if (att === 0) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.4;
      const d = 4.6 + (i % 2) * 1.2;
      out.push(...mote(top[0] + 3 + Math.cos(a) * d, top[1] + Math.sin(a) * d * 0.8, 0.55, i % 2 ? PURP : TEAL));
    }
  }
  if (att === 1) out.push(...swoosh(top[0] - 4, top[1] + 6, 9, -110, -10, 2.6));
  if (att === 2 || att === 3) {
    const k = att === 2 ? 1 : 0.7;
    const pc = [top[0] + 3, top[1] - 0.5];
    const puffs = [[-1, -1, 3.2], [-4.2, -3.4, 2.6], [0.4, -5.6, 2.6], [-5.8, 0.6, 2.2], [-2.4, 2.6, 2.2]];
    for (const [x, y, r] of puffs) out.push(fov(pc[0] + x * k, pc[1] + y * k, r * k + 0.5, r * k + 0.4, mix(TEAL, '#2f9f9a', 0.5), 0, 16));
    for (const [x, y, r] of puffs) out.push(fov(pc[0] + x * k + 0.3, pc[1] + y * k - 0.3, r * k, r * k * 0.9, mix(TEAL, '#ffffff', att === 2 ? 0.6 : 0.4), 0, 16));
    if (att === 2) out.push(star(pc[0] + 1, pc[1] - 1, 2.6));
  }
  const shapes = squash(out, 17, floor + 0.4, 1 - sq * 0.8, 1 + sq);
  return { w: 46, h: 46, res: 3, shapes: place([1, 0, 0, 1, 6, 2], shapes) };
}

// ---------- Corrupted Sapling (sapling) ----------
// A twisted young tree rooted to the floor, its trunk spiraling around a hollow where a corrupted
// heart pulses with purple light, veins of glow spreading through the bark, two weeping branches
// hung with leaves (some gone violet), a leafy crown with a curled shoot, and a sleepy knot-hole
// face. Signature: the lit heart in the hollow under a mop of weeping leaves. Rig: four planted
// roots > a four-segment trunk chain (each segment lags the one below: root leads, crown follows)
// > hollow, face and crown ride their segments > two branch chains > hanging leaf chains. It never
// walks: its "walk" frames are a heartbeat dance (lub-dub, rest).

const SAP = {
  bark: ramp('#a98468'),
  leaf: ramp('#8cc286', true),
  vio: ramp('#b08ad8', true),
  ink: '#4a3548',
};

// A pointed leaf from its stalk at (x, y) toward angle a: dark rim, the blade, a lit midrib.
function leafAt(x, y, a, l, w, R) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const p = (u, v) => [x + c * u - s * v, y + s * u + c * v];
  return [
    fp([p(-0.4, 0), p(l * 0.4, w + 0.45), p(l + 0.6, 0), p(l * 0.4, -w - 0.45)], R.sh2),
    fp([p(0, 0), p(l * 0.4, w), p(l, 0), p(l * 0.45, -w * 0.7)], R.base),
    fp([p(0.4, -0.1), p(l * 0.45, -w * 0.62), p(l * 0.8, -0.1)], R.hi),
  ];
}

function sapling(pose, f, mood) {
  const { walk, att, it, br, hurt, dead, angry, happy } = timing(pose, f, mood);
  const P = SAP;
  const floor = 45.5;
  const grey = (R) => (dead ? ramp(mix(R.base, '#9b93a0', 0.65), true) : R);
  const bark = P.bark;
  const leaf = grey(P.leaf);
  const vio = grey(P.vio);
  // Heartbeat: lub-dub, rest (walk); a slow breath (idle); flaring in the wind-up.
  const beat = dead ? 0 : att >= 0 ? [1, 0.55, 0.8, 0.3][att] : walk ? keyAt([0.15, 1, 0.45, 0.75, 0.25, 0.08, 0, 0.05], f) : 0.2 + 0.3 * br;
  const ph = walk ? (f / 8) * TAU : it;
  // Trunk lean at the root and the lag that rides up the chain (overlap: the crown arrives late).
  const lean = (walk ? 0.05 * Math.sin(ph) : att >= 0 ? [-0.08, 0.05, 0.07, 0.02][att] : 0.02 * Math.sin(it - 0.4)) + (hurt ? -0.06 : 0) + (dead ? 0.05 : 0);
  const lag = (walk ? 0.05 * Math.sin(ph - 1.1) : att >= 0 ? [-0.06, 0.06, 0.04, 0][att] : 0.02 * Math.sin(it - 1.5)) + (hurt ? -0.05 : 0) + (dead ? 0.06 : 0);
  const twist = [0.1, -0.16, 0.14, -0.08];
  const { pts: tr } = chainPts(15, 42.4, -Math.PI / 2, 4, (i) => [8, 8, 7.4, 6.6][i], (i) => (i ? 0 : lean) + twist[i] + lag * i * 0.5);
  const angs = tr.slice(1).map((q, i) => Math.atan2(q[1] - tr[i][1], q[0] - tr[i][0]) + Math.PI / 2);
  const M = tr.map((q, i) => joint(ID, q[0], q[1], angs[Math.min(i, 3)]));
  const out = [];

  // Roots: planted tips, bases riding the trunk's foot; walking, the toes grip with each beat.
  const curl = walk || att >= 0 ? beat * 0.7 : 0;
  for (const [bx, mx, my, tx, R, w] of [[-1.6, -6.6, 2.4, -12.4, ramp(bark.sh), 2.6], [1.4, 7, 2.2, 12.8, ramp(bark.sh), 2.6], [-2.6, -5.6, 1.6, -9, bark, 3.4], [2.4, 5.4, 1.8, 8.6, bark, 3.4], [0.6, 1.6, 2.6, 3.6, ramp(bark.hi), 2.4]]) {
    const B = at(M[0], bx, 0);
    const tip = [15 + tx, floor - 0.8 - curl * (Math.abs(tx) > 9 ? 1 : 0.4)];
    out.push(...limbR([B, [15 + mx, floor - 3 + my * 0.6], [15 + tx * 0.85, floor - 0.8], tip], w, 0.7, R));
  }

  // Back branch, then the trunk over it.
  const wave = (i, side) => (walk ? 0.12 * Math.sin(ph - 1.3 - i * 0.7 + side) : att >= 0 && side > 0 ? [-0.55, 0.3, 0.42, 0.1][att] * (0.55 + i * 0.22) : att >= 0 ? [-0.2, 0.1, 0.12, 0][att] : 0.06 * Math.sin(it - 1.6 - i * 0.7 + side)) + (angry && att < 0 ? -0.12 : 0) + (hurt ? -0.14 : 0) + (dead ? 0.3 : 0);
  const branch = (side, R) => {
    const base = at(M[4], side * 1.6, 2.6);
    const { pts } = chainPts(base[0], base[1], angs[3] - Math.PI / 2 + side * 1.22, 4, (i) => [4.2, 3.8, 3.2, 2.6][i], (i) => side * (i ? 0.36 : 0) + side * wave(i, side));
    const res = [...limbR(pts, 2.4, 0.8, R)];
    // The chain starts up-and-out and droops toward the tip; leaves hang from each node and swing
    // a beat after it.
    for (let i = 1; i <= 4; i++) {
      const sw = (walk ? 0.3 * Math.sin(ph - 2 - i * 0.8) : att >= 0 ? [-0.4, 0.5, 0.3, 0][att] * side : 0.12 * Math.sin(it - 2 - i * 0.8)) + (dead ? 0.2 : 0);
      const L = i === 2 ? vio : i % 2 ? leaf : ramp(leaf.sh, true);
      const [x, y] = pts[i];
      res.push(...leafAt(x, y, Math.PI / 2 - side * 0.35 + sw, 3.6 + (i % 2) * 0.7 + (dead ? 0.8 : 0), 1.05, L));
      if (i === 2 && !dead) res.push(...mote(x + Math.cos(Math.PI / 2 - side * 0.35 + sw) * 4.4, y + Math.sin(Math.PI / 2 - side * 0.35 + sw) * 4.4, 0.45, TEAL));
    }
    return { res, tip: pts[4] };
  };
  out.push(...branch(-1, ramp(bark.sh)).res);

  // The twisted trunk: dark rim, base, a back shadow strip and a lit front strip, spiral grooves.
  out.push(...limb(tr, 9.2, 5, bark.base, bark.sh2));
  out.push(F(taper(tr.map((q, i) => at(M[i], -2.6 + i * 0.4, 0)), 3, 1.4, bark.sh)), F(taper(tr.slice(0, 4).map((q, i) => at(M[i], 2.4 - i * 0.3, 0)), 1, 0.6, bark.hi)));
  for (const [i, y] of [[0, -1.6], [2, -2], [3, -1.4]]) out.push(...place(M[i], [band([[-3.6, y + 1.4], [0, y], [3.4, y - 1.4]], 0.6, bark.sh2)]));

  // The hollow and its heart, pulsing; corruption veins spread from it through the bark.
  {
    const h = [];
    const hy = -1.2;
    const vein = dead ? bark.sh2 : mix(bark.sh2, PURP, 0.4 + 0.45 * beat);
    for (const v of [[[-2.4, hy - 3.4], [-3.4, hy - 6], [-2.6, hy - 8.2]], [[2.6, hy - 3], [3.4, hy - 5.6]], [[-2.8, hy + 3], [-3.6, hy + 5.8]], [[2.6, hy + 3.2], [3.4, hy + 6]]]) {
      h.push(band(v, 0.6 + beat * 0.2, vein));
      if (!dead) h.push(fov(v[v.length - 1][0], v[v.length - 1][1], 0.5 + beat * 0.3, 0.5 + beat * 0.3, mix(PURP, PURP_HI, beat), 0, 10));
    }
    h.push(fov(0.2, hy, 4.4, 5.2, bark.hi, 0, 20), fov(0.4, hy + 0.3, 3.8, 4.6, '#24182f', 0, 20));
    h.push(fov(0.4, hy + 0.6, 2.7 + beat * 0.9, 3.3 + beat * 0.9, dead ? '#3a3040' : mix('#3a1f55', PURP, 0.3 + beat * 0.45), 0, 18));
    const s = 0.95 + beat * 0.4;
    const hc = dead ? '#8f8599' : '#e05cf0';
    const heart = (k, c) => [fov(-1 * s + 0.4, hy - 0.4 * s, 1.2 * s * k, 1.15 * s * k, c, 0, 12), fov(1 * s + 0.4, hy - 0.4 * s, 1.2 * s * k, 1.15 * s * k, c, 0, 12), fp([[0.4 - 2.15 * s * k, hy - 0.15 * s], [0.4 + 2.15 * s * k, hy - 0.15 * s], [0.4, hy + 2.6 * s * k]], c)];
    h.push(...heart(1.14, '#6a1f6e'), ...heart(1, hc));
    h.push(fov(-0.7 * s, hy - 0.8 * s, 0.55 * s, 0.45 * s, dead ? '#c0b8c8' : PURP_HI, 0, 10), fov(0.9, hy + 0.5, 0.8 * s, 0.8 * s, dead ? hc : mix(hc, '#ffb8f0', 0.3 + beat * 0.3), 0, 10));
    // Rootlets curling over the rim.
    h.push(...limb([[-4, hy - 3.2], [-2.2, hy - 4.4], [-0.6, hy - 3.8]], 0.9, 0.4, bark.sh, bark.sh2), ...limb([[4.4, hy + 3], [3, hy + 4.6], [1.2, hy + 4.6]], 0.9, 0.4, bark.sh, bark.sh2));
    out.push(...place(M[1], h));
  }

  // The face: a knotty swell on the third segment, knot-hole eyes glowing with sap.
  {
    const MF = snapJ(joint(M[3], hurt ? -0.4 : 0, 1.6 + (dead ? 0.6 : 0)));
    const b = [...ball(0.4, 0, 5.6, 4.6, bark), fp([[-4.4, -1.8], [-1.6, -3.6], [1.8, -3.6]], bark.hi)];
    const fx = 0.6;
    const eN = [fx + 2.4, 0];
    const eF = [fx - 2.1, 0.1];
    const sap = angry || att >= 0 ? mix('#ff8ad8', PURP_HI, 0.3 * beat) : mix('#ffc964', '#ffe9a8', 0.5 * beat);
    const look = [walk ? 0.4 * Math.sin(ph) : att >= 0 ? 0.8 : 0.7 * Math.sin(it + 1), 0.15];
    const act = actOf(mood, { idle: { lid: 0.42 }, blink: { closed: 'sleep' }, angry: { lid: 0.28, slant: 0.9, raise: 0.25 } });
    const aAct = att >= 0 && att < 3 ? { lid: 0.2, slant: 0.9, raise: 0.2, closed: undefined } : {};
    // Knot rims around the holes.
    for (const [e, w] of [[eF, 1.6], [eN, 1.85]]) b.push(fov(e[0], e[1], w, w * 0.88, bark.sh2, 0, 14));
    if (dead) b.push(...deadEye(eF[0], eF[1], 1.1, { c: P.ink, th: 0.6 }), ...deadEye(eN[0], eN[1], 1.25, { c: P.ink, th: 0.65 }));
    else {
      const ge = { shape: 'round', c: sap, bg: '#2a1830', look, flick: (f % 4) / 4, ...act, ...aAct };
      b.push(...glowEye(eF[0], eF[1], { ...ge, s: -1, w: 1.15, h: 1.05 }), ...glowEye(eN[0], eN[1], { ...ge, s: 1, w: 1.35, h: 1.2 }));
    }
    const fierce = angry || (att >= 0 && att < 3);
    const [ba, bu] = fierce ? [26, -0.4] : ({ hurt: [-24, 0.5], happy: [-10, 0.4] }[mood] ?? [-6, 0]);
    b.push(...brow(eF[0], -2.3 - bu, { s: -1, len: 1.2, angle: ba, th: 0.7, c: bark.sh2, shape: 'flat', arch: 0.2 }), ...brow(eN[0], -2.4 - bu, { s: 1, len: 1.4, angle: ba, th: 0.75, c: bark.sh2, shape: 'flat', arch: 0.2 }));
    const mo = { s: 1, ink: P.ink };
    const my = 2.7;
    if (att === 0 || att === 1) b.push(...mouth(fx + 0.3, my, { ...mo, type: 'shout', w: 1.4, h: 1.8, open: 1, teeth: 'top' }));
    else if (angry) b.push(...mouth(fx + 0.3, my, { ...mo, type: 'snarl', w: 1.5, h: 1.4, open: 1, teeth: 'top', fangs: 2, tongue: false }));
    else if (happy) b.push(...mouth(fx + 0.3, my, { ...mo, type: 'grin', w: 1.3, h: 1.4, open: 1, teeth: 'none' }));
    else if (hurt) b.push(...mouth(fx + 0.3, my, { ...mo, type: 'o', w: 0.7, h: 1.1, open: 1, tongue: false }));
    else if (dead) b.push(...mouth(fx + 0.3, my, { ...mo, type: 'wavy', w: 1.2, amp: 0.2 }));
    else b.push(...mouth(fx + 0.3, my, { ...mo, type: 'wavy', w: 1.1, amp: 0.15 }));
    if (!dead && !angry && att < 0) b.push(...blush(eN[0] + 0.8, 1.7, 0.75, { on: bark.base }));
    out.push(...place(MF, b));
  }

  // The crown: clumps of leaves lit from the upper front, each swaying a beat after the trunk tip,
  // a fringe of short weeping leaves under it, and a curled shoot with a violet bud on top.
  {
    const c = [];
    const cy = -5 + (dead ? 1.4 : 0);
    const sw = (k) => (walk ? 0.7 * Math.sin(ph - 1.6 - k) : att >= 0 ? [-0.9, 0.5, 0.6, 0.2][att] * (0.5 + k * 0.4) : 0.3 * Math.sin(it - 1.8 - k)) + (hurt ? -0.6 : 0);
    const { pts: sh } = chainPts(0.4, cy - 3.6, -Math.PI / 2, 3, (i) => [2.2, 1.8, 1.4][i], (i) => (i ? -0.7 : 0.1) + sw(i) * 0.15);
    c.push(...limbR(sh, 1.4, 0.6, bark));
    c.push(fov(sh[3][0] - 0.3, sh[3][1], 0.95, 0.95, vio.sh2, 0, 10), fov(sh[3][0] - 0.3, sh[3][1], 0.7, 0.7, dead ? vio.base : PURP, 0, 10), fov(sh[3][0] - 0.5, sh[3][1] - 0.25, 0.28, 0.28, PURP_HI, 0, 8));
    const clumps = [[-5.2, 1.2, 3.8, 0], [5.2, 1, 3.8, 0.3], [-2.4, -1.6, 3.8, 0.6], [2.6, -1.8, 3.6, 0.8], [0.2, 0.6, 5.4, 0.4], [0.2, -3.4, 2.8, 1]];
    for (const [x, y, r, k] of clumps) c.push(ov(x + sw(k), cy + y, r + 0.6, r * 0.82 + 0.5, leaf.sh2, 0, 16));
    for (const [x, y, r, k] of clumps) c.push(fov(x + sw(k), cy + y, r, r * 0.82, leaf.sh, 0, 16));
    for (const [x, y, r, k] of clumps) c.push(fov(x + sw(k) + r * 0.18, cy + y - r * 0.24, r * 0.78, r * 0.6, x > 3 && y < 0 ? vio.base : leaf.base, 0, 16));
    for (const [x, y, r, k] of clumps.slice(2)) c.push(fov(x + sw(k) + r * 0.32, cy + y - r * 0.45, r * 0.34, r * 0.2, leaf.hi, -0.2, 10));
    for (let i = 0; i < 5; i++) {
      const x = -6 + i * 3 + sw(i * 0.3);
      const a = Math.PI / 2 + (i - 2) * 0.22 + (walk ? 0.25 * Math.sin(ph - 2.2 - i * 0.7) : att >= 0 ? [-0.3, 0.4, 0.3, 0][att] : 0.1 * Math.sin(it - 2.2 - i * 0.7)) + (dead ? 0.15 : 0);
      c.push(...leafAt(x, cy + 3.2 + Math.abs(i - 2) * -0.3, a, 2.8 + (i % 2) * 0.7, 0.9, i === 3 ? vio : i % 2 ? leaf : ramp(leaf.sh, true)));
    }
    for (const [x, y] of [[-3.8, 0], [3.6, 0.6], [0.8, -1.6]]) if (!dead) c.push(fov(x + sw(0.5), cy + y, 0.6, 0.6, PURP, 0, 8), fov(x + sw(0.5) - 0.2, cy + y - 0.2, 0.24, 0.24, PURP_HI, 0, 6));
    out.push(...place(M[4], c));
  }

  // Front branch last (it lashes across the body).
  const fb = branch(1, bark);
  out.push(...fb.res);
  // Spore motes drift off as the heart beats.
  const H = at(M[1], 0.4, -1.2);
  if (!dead && beat > 0.4) out.push(...mote(H[0] + 5.6, H[1] - 3.6 - beat * 2, 0.6, PURP), ...mote(H[0] - 5, H[1] - 6 - beat, 0.5, TEAL));
  // The lash: the wind-up gathers glow in the hollow; the whip leaves a streak, then sparks crack.
  if (att === 0) for (let i = 0; i < 4; i++) out.push(...mote(H[0] + Math.cos(i * 1.6) * 5.4, H[1] + Math.sin(i * 1.6) * 4.4, 0.5, i % 2 ? PURP : TEAL));
  if (att === 1) out.push(...swoosh(17.6, 18.4, 8, -75, 55, 2.4));
  if (att === 2) out.push(...swoosh(17.6, 18.4, 8, 10, 72, 1.5), star(fb.tip[0] + 0.6, fb.tip[1] + 0.6, 2.2), star(fb.tip[0] - 2.4, fb.tip[1] + 3, 1.1, TEAL_HI), ...mote(fb.tip[0] - 1, fb.tip[1] - 3.4, 0.6, PURP));
  // The trunk swells and settles with each beat (about the floor, so the roots stay put).
  const sq = beat * 0.025 + key(att, [-0.04, 0.03, -0.02, 0], 0);
  // Drawn about x = 15; the canvas is widened around it so the weeping branches never clip.
  return { w: 44, h: 46, res: 3, shapes: place([1, 0, 0, 1, 7, 0], squash(out, 15, floor, 1 + sq * 0.5, 1 - sq * 0.3)) };
}

export const ART = {
  rootling: { walk: 8, idle: 6, attack: 4, stride: 14, atkMs: [45, 190, 140], draw: rootImp },
  sporecap: { pad: 13, walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [65, 250, 190], draw: myconid },
  thornback: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 310, 230], draw: brambleBear },
  sporeling: { walk: 8, idle: 6, attack: 4, stride: 12, atkMs: [40, 170, 120], draw: sporeMite },
  sapling: { walk: 8, idle: 6, attack: 4, cycle: 2.4, atkMs: [60, 240, 180], draw: sapling },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  rootling: { name: 'Root Imp', w: 22, h: 30 },
  sporecap: { name: 'Myconid Shaman', w: 22, h: 34 },
  thornback: { name: 'Bramble Bear', w: 46, h: 34 },
  sporeling: { name: 'Spore Mite', w: 18, h: 14 },
  sapling: { name: 'Corrupted Sapling', w: 18, h: 36 },
};

// The rig, ramp and shape helpers, shared with other modules (the bosses use them).
export { TAU, TEAL, TEAL_HI, PURP, PURP_HI, clamp, smooth, key, ramp, ID, joint, at, snapJ, place, squash, ik, chainPts, arm2, footStep, pawStep, timing, taper, ext, limb, limbR, ball, swoosh, star, mote, pg, fp, ov, fov, actOf };
