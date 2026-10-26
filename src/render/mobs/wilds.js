// Monster art: wilds (Windy Canyon and Mossy Woods).
//   pebblet    Basilisk Hatchling: a stocky lizard with a rocky frill and stone-scale back
//   scorpip    Manticore Cub: a lion cub with a mane, bat wings, and a curled scorpion tail
//   leafling   Dryad: a forest nymph with leaf hair, bark limbs, and a budding twig staff
//   boarlet    Warg: a shaggy, scarred dire wolf that lopes after you
//   mossgolem  Treant: a slow, wise walking tree with root feet and a bird's nest in its crown
// Every design faces right with its feet on the bottom edge, and is built from small helpers
// (rotated ovals, smooth blobs, tapered tubes, two-bone legs and a gait cycle) so the walk
// cycles can plant, lift, and swing each leg while tails, manes, and leaves follow through.

import { R, E, T, F, C, shade, mix, arc, stroke, face, INK, BLUSH, MOUTH } from './kit.js';

// ---------- Geometry helpers ----------

const TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const wave = (t) => Math.sin(t * TAU);

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
// Inner line color for a part (the auto outline only wraps the whole silhouette).
const edge = (c) => mix(shade(c, -38), INK, 0.45);
// A tube with its own thin dark line, so a limb in front of the body still reads.
const tubeL = (pts, ws, c, seg, lw = 0.9) => [F(tube(pts, ws.map((w) => w + lw), edge(c), seg)), tube(pts, ws, c, seg)];
// An oval with its own thin line.
const ovL = (cx, cy, rx, ry, a, c, lw = 0.45) => [F(ov(cx, cy, rx + lw, ry + lw, a, edge(c))), ov(cx, cy, rx, ry, a, c)];

// Two-bone reach: the knee between hip and foot. bend +1 puts the knee behind (left), -1 in front.
function knee(hx, hy, fx, fy, l1, l2, bend) {
  const dx = fx - hx;
  const dy = fy - hy;
  const d = Math.max(0.01, Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01));
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / (Math.hypot(dx, dy) || 1);
  const uy = dy / (Math.hypot(dx, dy) || 1);
  return [hx + ux * a - uy * h * bend, hy + uy * a + ux * h * bend];
}

// A foot's place in a walk cycle: planted and sliding back for the first half (stance), then
// lifted and swung forward in an arc (swing). Returns [dx, lift].
function gait(p, stride, lift) {
  p = ((p % 1) + 1) % 1;
  if (p < 0.5) return [stride / 2 - stride * (p / 0.5), 0];
  const t = (p - 0.5) / 0.5;
  const e = 0.5 - 0.5 * Math.cos(Math.PI * t);
  return [-stride / 2 + stride * e, -lift * Math.sin(Math.PI * t)];
}

// Points spaced evenly along a smooth path through `pts` (n of them, from start to end).
function along(pts, n) {
  const path = spline(pts, false, 6);
  const lens = [0];
  for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = lens[lens.length - 1];
  const out = [];
  let j = 1;
  for (let k = 0; k < n; k++) {
    const d = (k / (n - 1)) * total;
    while (j < path.length - 1 && lens[j] < d) j++;
    const t = (d - lens[j - 1]) / (lens[j] - lens[j - 1] || 1);
    const a = path[j - 1];
    const b = path[j];
    out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), Math.atan2(b[1] - a[1], b[0] - a[0])]);
  }
  return out;
}

// Rotates points about (cx, cy) by `a` degrees.
const turn = (pts, cx, cy, a) => {
  const c = Math.cos(rad(a));
  const s = Math.sin(rad(a));
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};

// A shaded ball: a darker underside, the base, and a soft highlight on top.
function ball(cx, cy, rx, ry, c, a = 0, { hi = true, dark = -10 } = {}) {
  const out = [ov(cx, cy, rx, ry, a, shade(c, dark)), ov(cx - rx * 0.04, cy - ry * 0.1, rx * 0.95, ry * 0.86, a, c)];
  if (hi) out.push(F(ov(cx - rx * 0.25, cy - ry * 0.45, rx * 0.42, ry * 0.25, a, mix(c, '#ffffff', 0.35))));
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

// Expressive eyes for the beasts. (x, y) is the eye's center; `slope` +1/-1 tilts the angry lid
// toward the face's middle. Moods: closed arcs for blink, ^ for happy, >< for hurt, x for dead,
// and a lowered lid with a glowing iris for angry.
function eye(x, y, rx, ry, mood, { iris = '#ffd24a', glow = '#fff0a0', pupil = 'round', lid = null, slope = 1, ink = INK, white = '#ffffff' } = {}) {
  const out = [];
  const k = Math.min(rx, ry);
  switch (mood) {
    case 'blink':
      return [arc(x, y - ry * 0.2, rx * 0.95, ry * 0.6, 15, 165, 0.55, ink)];
    case 'happy':
      return [arc(x, y + ry * 0.45, rx * 0.95, ry * 0.75, 195, 345, 0.6, ink)];
    case 'hurt':
      return stroke([[x - slope * rx * 0.8, y - ry * 0.7], [x + slope * rx * 0.7, y], [x - slope * rx * 0.8, y + ry * 0.7]], 0.65, ink);
    case 'dead':
      return [...stroke([[x - k * 0.8, y - k * 0.8], [x + k * 0.8, y + k * 0.8]], 0.6, ink), ...stroke([[x - k * 0.8, y + k * 0.8], [x + k * 0.8, y - k * 0.8]], 0.6, ink)];
    default:
      break;
  }
  const angry = mood === 'angry';
  if (angry) out.push(F(E(x, y, rx + 1, ry + 1, glow)));
  out.push(F(E(x, y, rx + 0.45, ry + 0.45, ink)), F(E(x, y, rx, ry, white)), F(E(x + 0.2, y + 0.1, rx * 0.86, ry * 0.9, angry ? '#ff8a3a' : iris)));
  if (pupil === 'slit') out.push(F(E(x + 0.25, y + 0.1, Math.max(0.35, rx * (angry ? 0.16 : 0.24)), ry * 0.78, ink)));
  else out.push(F(E(x + 0.3, y + 0.2, rx * (angry ? 0.36 : 0.52), ry * (angry ? 0.42 : 0.6), ink)));
  out.push(F(E(x - rx * 0.3, y - ry * 0.38, k * 0.32, k * 0.32, '#ffffff')), F(E(x + rx * 0.35, y + ry * 0.4, k * 0.15, k * 0.15, '#ffffff')));
  if (angry && lid) {
    // A heavy lid slanting down toward the middle of the face.
    const s = slope;
    out.push(F(T([[x - s * (rx + 1.4), y - ry - 1.6], [x + s * (rx + 1.4), y - ry - 1.6], [x + s * (rx + 1.4), y - ry * 0.05], [x - s * (rx + 1.4), y - ry * 0.75]], lid)),
      ...stroke([[x - s * (rx + 1.2), y - ry * 0.85], [x + s * (rx + 1.2), y - ry * 0.05]], 0.7, ink));
  }
  return out;
}

// ---------- Basilisk Hatchling (pebblet) ----------

function pebblet(pose, f, mood) {
  const W = 40;
  const H = 32;
  // Laid out on a 30-tall box; the extra headroom keeps the crown horns clear of the top edge.
  const G = 30;
  const walk = pose === 'walk';
  const p = walk ? f / 6 : f / 4;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const skin = '#a6d69a';
  const skinD = shade(skin, -12);
  const belly = '#f7eccb';
  const stone = '#c9b7a3';
  const stoneL = '#e6dccd';
  const stoneD = '#a08d7b';
  const frill = angry ? '#ff8c6e' : '#f6a88c';
  const frillD = shade(frill, -12);
  const breathe = walk ? 0 : wave(p) * 0.35;
  // The body rides high enough that the stubby legs show under it.
  const by = dead ? 1.4 : (walk ? 0.45 * Math.cos(p * TAU * 2) - 0.2 : breathe) - 1.6;
  const hx = (hurt ? -1.4 : 0) + (walk ? 0.4 * Math.sin(p * TAU * 2) : 0);
  const hy = (dead ? 3.4 : hurt ? -1 : 0) + by + (walk ? 0.4 * Math.sin(p * TAU * 2 + 0.6) : wave(p + 0.15) * 0.3);
  const out = [];

  // Tail: a thick root that tapers into a curled tip, swaying in a wave.
  const tw = (i) => (dead ? 0 : (walk ? 1 : 0.6) * Math.sin(p * TAU - i * 0.9) * i * 0.3);
  const tail = [[11, 23 + by], [6.5, 24.2 + by + tw(1)], [3, 22.2 + by + tw(2)], [1.8, 18.6 + by + tw(3)], [3.6, 15.8 + by + tw(4)], [6, 16.8 + by + tw(4.5)]];
  if (dead) tail.splice(3, 3, [0.8, 26.5], [-0.2, 27.6]);
  out.push(tube(tail, [7, 5, 3.4, 2.2, 1.4, 1], skin));
  // Stone scales riding the tail.
  for (const [i, s] of [[1, 1.8], [2, 1.4], [3, 1.1]]) {
    if (!tail[i]) continue;
    const [tx, ty] = tail[i];
    out.push(T([[tx - s, ty - 1.4], [tx, ty - 1.4 - s], [tx + s, ty - 1.4], [tx, ty - 0.6]], stone));
  }

  // Legs: a sprawling trot (diagonal pairs move together).
  const legPhase = { nf: 0, fb: 0, nb: 0.5, ff: 0.5 };
  const leg = (key, hipX, hipY, near, front) => {
    const [dx, lift] = dead ? [front ? 3 : -3, 0] : walk ? gait(p + legPhase[key], 6.4, 2.8) : [0, 0];
    const fx = hipX + dx + (front ? 1 : -0.5);
    const fy = G - 1.3 + lift + (dead ? -0.6 : 0);
    const kn = knee(hipX, hipY, fx, fy, 4.2, 4.2, front ? 1 : -1);
    const c = near ? skin : skinD;
    const parts = near
      ? [...ovL(fx + 1.1, fy + 0.2, 2.8, 1.35, 0, c), ...tubeL([[hipX, hipY], kn, [fx, fy]], [5, 3.8, 3.2], c, 4, 0.6), ov(fx + 1.1, fy + 0.2, 2.8, 1.35, 0, c)]
      : [tube([[hipX, hipY], kn, [fx, fy]], [5, 3.8, 3.2], c), ov(fx + 1.1, fy + 0.2, 2.8, 1.35, 0, c), ...stroke([[kn[0] - 1, kn[1] + 1], [fx - 1, fy]], 0.4, edge(c))];
    // Little cream claws.
    for (const k of [0, 1, 2]) parts.push(F(E(fx + 2.4 + k * 0.1, fy + 0.6 - k * 0.65 + 0.5, 0.55, 0.42, '#fff6e0')));
    return parts;
  };
  out.push(...leg('fb', 14.5, 23 + by, false, false), ...leg('ff', 26.5, 23 + by, false, true));

  // Body with a cream belly and scute lines.
  out.push(...ball(18.5, 21.5 + by, 10.4, 6.8, skin));
  out.push(E(19.5, 24.6 + by, 8.2, 2.9, belly), F(E(18, 23.6 + by, 4, 0.8, mix(belly, '#ffffff', 0.5))));
  // Freckles of a darker green.
  for (const [x, y] of [[12.5, 20], [16, 22.4], [21, 21.6], [24, 23]]) out.push(F(E(x, y + by, 0.7, 0.55, skinD)));

  // Stone plates along the spine, each with a lit top face and a crack.
  for (let i = 0; i < 5; i++) {
    const x = 9.4 + i * 3.6;
    const y = 15.8 + by - Math.sin((i / 4) * Math.PI) * 1.6 + (i === 0 ? 1.4 : 0);
    const s = i === 2 ? 2.6 : 2.2;
    const lift = angry ? -0.8 : 0;
    out.push(C(T([[x - s, y + 2], [x - s * 0.8, y - 0.6 + lift], [x, y - s - 0.4 + lift], [x + s * 0.9, y - 0.4 + lift], [x + s, y + 2]], stone)),
      F(T([[x - s * 0.6, y - 0.3 + lift], [x, y - s + 0.2 + lift], [x + s * 0.55, y - 0.2 + lift], [x, y + 0.5]], stoneL)),
      ...stroke([[x + 0.3, y + 0.4], [x + 0.9, y + 1.6]], 0.3, stoneD));
  }

  out.push(...leg('nb', 13, 24 + by, true, false), ...leg('nf', 25, 24 + by, true, true));

  // The rocky frill fanned behind the head: a coral web on stone ribs.
  const fx0 = 24 + hx;
  const fy0 = 11.4 + hy;
  const fr = (angry ? 11.4 : hurt ? 7.6 : 9.6) + (walk ? 0 : wave(p) * 0.25);
  const web = [[fx0, fy0 + 2]];
  for (let i = 0; i <= 8; i++) {
    const a = rad(lerp(140, 290, i / 8));
    const r = i % 2 ? fr * 0.78 : fr;
    web.push([fx0 + Math.cos(a) * r, fy0 + Math.sin(a) * r]);
  }
  out.push(T(web, frill));
  for (let i = 0; i <= 8; i += 2) {
    const a = rad(lerp(140, 290, i / 8));
    out.push(tube([[fx0 + Math.cos(a) * 2, fy0 + Math.sin(a) * 2], [fx0 + Math.cos(a) * (fr + 0.6), fy0 + Math.sin(a) * (fr + 0.6)]], [1.6, 0.9], stoneD));
    out.push(F(E(fx0 + Math.cos(a) * (fr + 0.4), fy0 + Math.sin(a) * (fr + 0.4), 0.9, 0.9, stone)));
  }
  out.push(F(T(web.map(([x, y]) => [lerp(fx0, x, 0.55), lerp(fy0 + 1, y, 0.55)]), frillD)));

  // Head: a big round skull with a blunt snout.
  const X = 29.2 + hx;
  const Y = 13.4 + hy;
  const tilt = dead ? 14 : hurt ? -8 : 0;
  out.push(F(ov(X, Y, 8.9, 7.9, tilt, edge(skin))), ...ball(X, Y, 8.4, 7.4, skin, tilt));
  out.push(C(ov(X + 5.2, Y + 2.6, 4.8, 3.8, tilt, skin)), F(ov(X + 4.4, Y + 1.2, 3, 1.2, tilt, mix(skin, '#ffffff', 0.3))));
  // Jaw and chin in belly cream.
  out.push(F(ov(X + 3.4, Y + 5.5, 5.6, 1.9, tilt, belly)));
  // Stone horns on the crown, leaning back.
  for (const [ox, oy, s, ang] of [[-3.6, -5.6, 2.3, -150], [-0.4, -6.8, 2, -125], [2.6, -6.6, 1.5, -105]]) {
    const bx = X + ox;
    const by2 = Y + oy;
    const a = rad(ang + (angry ? 12 : 0));
    const tipX = bx + Math.cos(a) * (s * 2.6);
    const tipY = by2 + Math.sin(a) * (s * 2.6);
    out.push(T([[bx - s, by2 + 1], [tipX, tipY], [bx + s, by2 + 1]], stone), F(T([[bx - s * 0.2, by2 + 0.6], [tipX, tipY], [bx + s * 0.7, by2 + 0.8]], stoneL)));
  }
  // Brow ridge stones.
  out.push(C(T([[X - 0.6, Y - 3.6], [X + 2, Y - 5.4], [X + 5.2, Y - 4.4], [X + 6.8, Y - 2.6], [X + 3.6, Y - 3.2]], stone)));
  out.push(F(E(X + 9.3, Y + 1.4, 0.55, 0.45, shade(skin, -30))));

  // Eyes: a big near eye and a smaller far one, slit-pupiled; they glow when angry.
  const eo = { iris: '#ffd24a', glow: '#fff09a', pupil: 'slit', lid: skin, slope: 1 };
  out.push(...eye(X + 1.4, Y - 0.6, 2.3, 2.6, mood, eo), ...eye(X + 6.4, Y - 0.9, 1.5, 2.2, mood, { ...eo, slope: -1 }));
  if (mood !== 'dead') out.push(F(E(X + 0.4, Y + 3, 1.4, 0.7, BLUSH)));

  // Mouth along the snout.
  const my = Y + 4.6;
  if (angry) {
    out.push(F(T([[X + 2.6, my - 0.6], [X + 9.6, my - 1.2], [X + 8.6, my + 2], [X + 4, my + 2.2]], MOUTH)));
    out.push(F(T([[X + 4.4, my - 0.6], [X + 5.2, my + 0.9], [X + 6, my - 0.7]], '#ffffff')), F(T([[X + 7.2, my - 0.9], [X + 7.9, my + 0.5], [X + 8.6, my - 1]], '#ffffff')));
  } else if (hurt) {
    out.push(F(E(X + 6.4, my + 0.4, 1.3, 1.1, MOUTH)));
  } else if (dead) {
    out.push(...stroke([[X + 3.4, my + 0.6], [X + 9, my + 0.4]], 0.5, INK), F(ov(X + 6.4, my + 1.6, 0.9, 1.4, 10, '#ff8fa8')));
  } else if (mood === 'happy') {
    out.push(F(T([[X + 3.4, my - 0.4], [X + 9.2, my - 0.8], [X + 6.6, my + 1.8]], MOUTH)), F(E(X + 6.6, my + 1, 0.9, 0.5, '#ff9fb0')));
  } else {
    out.push(...stroke([[X + 3, my - 0.1], [X + 5.6, my + 0.5], [X + 9.2, my - 0.4]], 0.45, INK));
  }

  if (hurt) out.push(F(E(37, 4, 0.8, 1.2, '#9fd8ff')));
  return { w: W, h: H, res: 3, shapes: shift(out, 0, 2) };
}

// ---------- Manticore Cub (scorpip) ----------

function scorpip(pose, f, mood) {
  const W = 46;
  const H = 38;
  const G = H;
  const walk = pose === 'walk';
  const p = walk ? f / 6 : f / 4;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const fur = '#f4c27e';
  const furD = shade(fur, -12);
  const cream = '#fff0d4';
  const mane = angry ? '#e8623e' : '#e5774c';
  const maneD = shade(mane, -14);
  const maneL = mix(mane, '#ffd0a0', 0.45);
  const wing = '#e79bb4';
  const wingD = shade(wing, -16);
  const shell = '#8e5ca8';
  const shellL = mix(shell, '#ffffff', 0.35);
  const sting = '#ffd65a';
  const by = dead ? 3 : walk ? 0.5 * Math.cos(p * TAU * 2) - 0.2 : wave(p) * 0.35;
  const hx = (hurt ? -1.6 : 0) + (walk ? 0.3 * Math.sin(p * TAU * 2) : 0);
  const hy = (dead ? 4.6 : hurt ? -1 : 0) + by + (walk ? 0.5 * Math.sin(p * TAU * 2 + 0.8) : wave(p + 0.2) * 0.35);
  const out = [];

  // The scorpion tail: armored segments arching over the back to a hooked stinger.
  const sway = dead ? 0 : walk ? Math.sin(p * TAU) : wave(p) * 0.6;
  const rise = angry ? -2 : 0;
  const tailPts = dead
    ? [[13, 29 + by], [10, 31.6], [8.4, 33.6], [8.2, 35.2]]
    : [[12, 28 + by], [7.5, 26 + by], [5.4 + sway * 0.3, 20 + by], [7 + sway * 0.7, 13.4 + rise], [11.6 + sway, 9.6 + rise], [17 + sway, 8.6 + rise]];
  const segs = along(tailPts, 9);
  segs.forEach(([x, y, a], i) => {
    const r = lerp(2.7, 1.5, i / 8);
    out.push(...ovL(x, y, r, r * 0.85, (a * 180) / Math.PI, shell, 0.45), F(ov(x - 0.2, y - r * 0.35, r * 0.6, r * 0.3, (a * 180) / Math.PI, shellL)));
  });
  {
    const [x, y, a] = segs[8];
    const d = dead ? 0 : 1;
    const ang = (a * 180) / Math.PI;
    const hook = turn([[x - 1.2, y - 1.6], [x + 3.4, y - 1.6], [x + 5.8, y + 0.8], [x + 5.4, y + 4.4], [x + 4.6, y + 1.8], [x + 2.6, y + 1.6], [x - 0.6, y + 1.6]], x, y, d ? Math.max(-20, Math.min(20, ang)) * 0.4 : ang);
    out.push(F(T(hook.map(([px, py]) => [px + (px - x) * 0.12, py + (py - y) * 0.12]), edge(sting))), T(hook, sting), F(E(hook[2][0] - 1, hook[2][1] - 0.6, 0.8, 0.6, '#fff6c8')));
    if (angry) out.push(F(E(hook[4][0], hook[4][1] + 1.2, 0.7, 0.9, '#c6ff7a')));
  }

  // Wings: small bat wings, the far one darker behind the body. They flick as it trots.
  const flap = dead ? -28 : walk ? wave(p * 2) * 12 : wave(p) * 6 + (angry ? -10 : 0);
  const wingShape = (rx, ry, a, c, cd, s) => {
    const pts = [[rx, ry], [rx - 2.4 * s, ry - 6.4], [rx - 5 * s, ry - 9.6], [rx - 11.6 * s, ry - 9.4], [rx - 9.4 * s, ry - 6.4], [rx - 12.4 * s, ry - 3.6], [rx - 9.2 * s, ry - 2], [rx - 9.6 * s, ry + 1.2], [rx - 6.4 * s, ry - 0.2], [rx - 4.6 * s, ry + 2], [rx - 2 * s, ry + 1.2]];
    const w = turn(pts, rx, ry, a);
    const elbow = w[2];
    return [T(w, c), ...stroke([w[0], w[1], elbow], 0.9, cd), ...stroke([elbow, w[3]], 0.55, cd), ...stroke([elbow, w[5]], 0.5, cd), ...stroke([elbow, w[7]], 0.45, cd), F(T([[elbow[0] + 0.5, elbow[1]], [elbow[0] + 1.6, elbow[1] - 1.6], [elbow[0] + 0.2, elbow[1] - 0.8]], cream))];
  };
  out.push(...wingShape(23 + hx * 0.3, 21.5 + by, flap - 6, wingD, shade(wingD, -16), 1));

  // Legs: short, chubby cub legs with big paws.
  const legPhase = { nf: 0, fb: 0, nb: 0.5, ff: 0.5 };
  const leg = (key, hipX, hipY, near, front) => {
    const [dx, lift] = dead ? [front ? 2.6 : -2.6, 0] : walk ? gait(p + legPhase[key], 5.5, 2.6) : [0, 0];
    const fx = hipX + dx + (front ? 0.6 : 0);
    const fy = G - 1.7 + lift;
    const kn = knee(hipX, hipY, fx, fy, 4.4, 4.2, front ? 1 : -1);
    const c = near ? fur : furD;
    const parts = near ? [...tubeL([[hipX, hipY], kn, [fx, fy]], [5.6, 4.4, 4], c, 4, 0.6), ...ovL(fx + 0.8, fy + 0.2, 2.9, 1.6, 0, c)] : [tube([[hipX, hipY], kn, [fx, fy]], [5.6, 4.4, 4], c), ov(fx + 0.8, fy + 0.2, 2.9, 1.6, 0, c)];
    if (near) parts.push(...stroke([[fx + 1.6, fy - 0.4], [fx + 1.6, fy + 1.2]], 0.35, edge(c)), ...stroke([[fx + 2.7, fy - 0.2], [fx + 2.7, fy + 1.2]], 0.35, edge(c)));
    return parts;
  };
  out.push(...leg('fb', 15, 29 + by, false, false), ...leg('ff', 27.5, 29 + by, false, true));

  // Body: a round cub belly, a cream tummy, and a tuft of fur on the rump.
  out.push(...ball(20.5, 27.6 + by, 11, 7.2, fur));
  out.push(F(E(22, 31.6 + by, 7.4, 2.8, cream)), C(T([[10, 23 + by], [8, 21.6 + by], [10.4, 21 + by], [9.4, 19.6 + by], [12.6, 20.6 + by]], fur)));
  // Faint stripes on the back, like a young lion's spots.
  for (const [x, y] of [[14, 23.4], [17.6, 22.4], [13.4, 27.2]]) out.push(F(ov(x, y + by, 1.2, 0.7, -20, furD)));
  out.push(...leg('nb', 14, 30 + by, true, false), ...leg('nf', 26.5, 30 + by, true, true));

  // Near wing over the shoulder.
  out.push(...wingShape(20.5 + hx * 0.3, 23 + by, flap + 4, wing, wingD, 1));

  // The mane: a fluffy flame of rusty fur around the head that bristles when angry.
  const X = 33.4 + hx;
  const Y = 18.6 + hy;
  const tilt = dead ? 18 : hurt ? -8 : 0;
  const ruff = [];
  const ruffIn = [];
  const n = 13;
  const big = angry ? 1.18 : 1;
  for (let i = 0; i < n; i++) {
    const a = rad(lerp(70, 330, i / (n - 1)));
    const lag = walk ? Math.sin(p * TAU * 2 - i * 0.4) * 0.5 : wave(p - i * 0.05) * 0.3;
    const r1 = (11.2 + lag) * big;
    const r0 = 8.4 * big;
    ruff.push([X - 1.4 + Math.cos(a) * r1, Y + Math.sin(a) * r1 * 0.92]);
    const am = rad(lerp(70, 330, (i + 0.5) / (n - 1)));
    if (i < n - 1) ruff.push([X - 1.4 + Math.cos(am) * r0, Y + Math.sin(am) * r0 * 0.92]);
    ruffIn.push([X - 1 + Math.cos(a) * r1 * 0.72, Y + Math.sin(a) * r1 * 0.68]);
  }
  out.push(T([[X + 3, Y + 6], ...ruff, [X + 5, Y - 6]], mane));
  out.push(F(T([[X + 2, Y + 5], ...ruffIn, [X + 4, Y - 5]], maneL)));
  for (let i = 1; i < n - 1; i += 2) {
    const [x, y] = ruff[i * 2];
    out.push(...stroke([[lerp(X, x, 0.62), lerp(Y, y, 0.62)], [lerp(X, x, 0.86), lerp(Y, y, 0.86)]], 0.45, maneD));
  }
  // Round cub ears poking out of the mane.
  for (const [ex, ey, s] of [[X - 4.2, Y - 8.4, 1], [X + 3.2, Y - 9.2, 0.9]]) {
    out.push(...ovL(ex, ey, 2.9 * s, 2.7 * s, 0, fur), F(E(ex + 0.2, ey + 0.4, 1.6 * s, 1.5 * s, '#ffb3b8')));
  }

  // Head.
  out.push(F(ov(X, Y, 8.4, 7.6, tilt, edge(fur))), ...ball(X, Y, 7.9, 7.1, fur, tilt));
  // Forehead tuft of mane falling between the ears.
  out.push(C(T([[X - 4, Y - 6.2], [X - 1.6, Y - 8], [X + 1.2, Y - 7.2], [X + 0.4, Y - 4.4], [X - 0.8, Y - 5.6], [X - 2, Y - 3.8]], mane)));
  // Muzzle, nose, chin.
  out.push(...ovL(X + 5.4, Y + 3.4, 3.8, 2.8, tilt, cream, 0.35), F(T([[X + 7, Y + 1.3], [X + 9.6, Y + 1.1], [X + 8.4, Y + 2.9]], '#e8708a')), F(E(X + 7.8, Y + 1.5, 0.5, 0.3, '#ffc4d0')));
  // Whisker dots and whiskers.
  for (const [x, y] of [[X + 4.6, Y + 3], [X + 5.6, Y + 3.8], [X + 4.4, Y + 4.4]]) out.push(F(E(x, y, 0.28, 0.28, shade(fur, -30))));
  out.push(...stroke([[X + 9.4, Y + 3.4], [X + 12, Y + 2.6]], 0.3, shade(fur, -35)), ...stroke([[X + 9.4, Y + 4.4], [X + 11.8, Y + 4.8]], 0.3, shade(fur, -35)));

  // Eyes: big teal kitten eyes.
  const eo = { iris: '#5fd0c4', glow: '#fff09a', lid: fur, slope: 1 };
  out.push(...eye(X + 0.6, Y - 0.6, 2.2, 2.5, mood, eo), ...eye(X + 5.6, Y - 0.8, 1.5, 2.2, mood, { ...eo, slope: -1 }));
  if (!dead) out.push(F(E(X - 1.4, Y + 2.8, 1.5, 0.75, BLUSH)));

  // Mouth.
  const mx = X + 7;
  const my = Y + 4.2;
  if (angry) {
    out.push(F(T([[mx - 2.8, my - 0.2], [mx + 1.6, my - 0.4], [mx + 0.8, my + 2.6], [mx - 2, my + 2.4]], MOUTH)),
      F(T([[mx - 2.4, my - 0.2], [mx - 1.7, my + 1.6], [mx - 1.1, my - 0.2]], '#ffffff')), F(T([[mx + 0.2, my - 0.3], [mx + 0.8, my + 1.4], [mx + 1.4, my - 0.4]], '#ffffff')));
  } else if (hurt) {
    out.push(F(E(mx - 0.6, my + 0.8, 1.1, 1.2, MOUTH)));
  } else if (dead) {
    out.push(...stroke([[mx - 2.6, my + 0.4], [mx + 1, my + 0.2]], 0.45, INK), F(E(mx - 0.4, my + 1.4, 0.7, 1, '#ff8fa8')));
  } else if (mood === 'happy') {
    out.push(F(T([[mx - 2.4, my - 0.2], [mx + 1.4, my - 0.3], [mx - 0.4, my + 2.2]], MOUTH)), F(E(mx - 0.4, my + 1.3, 0.8, 0.5, '#ff9fb0')));
  } else {
    out.push(arc(mx - 1.6, my - 0.3, 0.9, 0.9, 20, 160, 0.35, INK), arc(mx + 0.2, my - 0.3, 0.9, 0.9, 20, 160, 0.35, INK));
  }
  if (hurt) out.push(F(E(43.6, 6, 0.8, 1.2, '#9fd8ff')));
  return { w: W, h: H, res: 3, shapes: out };
}

// A pointed leaf from its stem (x, y), `len` long and `wid` wide, pointing at angle `a` degrees.
function leaf(x, y, len, wid, a, c, vein = true) {
  const pts = turn([[x, y], [x + len * 0.3, y - wid * 0.5], [x + len * 0.7, y - wid * 0.42], [x + len, y], [x + len * 0.7, y + wid * 0.42], [x + len * 0.3, y + wid * 0.5]], x, y, a);
  const out = [blob(pts, c, 3)];
  if (vein && len > 3) out.push(...stroke(turn([[x + len * 0.12, y], [x + len * 0.8, y]], x, y, a), 0.3, shade(c, -16)));
  return out;
}

// ---------- Dryad (leafling) ----------

function leafling(pose, f, mood) {
  const W = 36;
  const H = 46;
  const G = H;
  const walk = pose === 'walk';
  const p = walk ? f / 6 : f / 4;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const wilt = (c) => (dead ? mix(c, '#c9a36a', 0.45) : c);
  const skin = '#e4f6d2';
  const bark = '#b98a66';
  const barkD = shade(bark, -14);
  const leafA = wilt('#7cc96e');
  const leafB = wilt('#9be08a');
  const leafC = wilt('#5eaf62');
  const leafL = wilt('#c4f0b0');
  const bob = walk ? -Math.abs(Math.sin(p * TAU)) * 1 + 0.4 : wave(p) * 0.35;
  const lean = hurt ? -1.6 : dead ? 1 : walk ? 0.5 : 0;
  const by = bob + (dead ? 2.4 : 0);
  const out = [];
  const hip = [16.6 + lean * 0.3, 37 + by];

  // Legs: slim bark legs with root toes, stepping in turn.
  const leg = (ph, near) => {
    const [dx, lift] = dead ? [near ? 2 : -2, 0] : walk ? gait(p + ph, 6, 2.4) : [near ? 1.2 : -1.2, 0];
    const hx = hip[0] + (near ? 1.2 : -1.2);
    const fx = hx + dx;
    const fy = G - 1.4 + lift;
    const kn = knee(hx, hip[1], fx, fy, 4.4, 4.4, -1);
    const c = near ? bark : barkD;
    return [...tubeL([[hx, hip[1]], kn, [fx, fy]], [3, 2.4, 2], c, 4, 0.5), ...ovL(fx + 0.9, fy + 0.4, 2, 1.1, 0, c, 0.4), ...stroke([[fx + 1.8, fy + 0.8], [fx + 3, fy + 1.1]], 0.6, c, false)];
  };
  out.push(...leg(0.5, false));

  // Long leafy hair trailing behind, lagging the head.
  const X = 17 + lean;
  const Y = 16.6 + by * 0.9 + (dead ? 2.2 : 0) + (hurt ? -0.6 : 0);
  const lag = (i) => (walk ? Math.sin(p * TAU * 2 - 1 - i * 0.5) * 6 : wave(p - i * 0.1) * 4) + (dead ? 25 : 0) + (angry ? -8 : 0);
  for (let i = 0; i < 5; i++) {
    const a = 100 + i * 14 + lag(i);
    out.push(...leaf(X - 6 + i * 0.4, Y + 1 - i * 1.2, 9 - i * 0.6, 4.6, a, i % 2 ? leafC : leafA, false));
  }
  out.push(E(X - 0.6, Y - 0.8, 10.6, 9.8, leafC));

  // The back arm swinging opposite the near leg.
  const swing = walk ? Math.sin(p * TAU) * 2.4 : wave(p) * 0.4;
  const sh = [X - 3.4, 29 + by];
  out.push(...tubeL([sh, [sh[0] - 1.6 - swing * 0.5, sh[1] + 3.4], [sh[0] - 1.2 - swing, sh[1] + 6.2]], [2.2, 1.9, 1.7], barkD, 4, 0.5), E(sh[0] - 1.2 - swing, sh[1] + 6.6, 1.3, 1.2, barkD));

  // Dress of layered leaves, swishing as she walks.
  const sw = walk ? Math.sin(p * TAU * 2) * 4 : wave(p) * 2;
  const skirt = [];
  for (let i = 0; i < 6; i++) {
    const a = 96 - (i - 2.5) * 16 + sw * (i % 2 ? 1 : -0.6);
    skirt.push(...leaf(X + (i - 2.5) * 1.3 - 0.4, 30.4 + by, 8.6 - Math.abs(i - 2.5) * 0.6, 5, a, i % 2 ? leafB : leafA));
  }
  out.push(...skirt);
  // A small bodice with a bark belt.
  out.push(...ovL(X - 0.4, 29.2 + by, 3.8, 3.4, 0, leafA, 0.4), F(R(X - 4, 30.6 + by, 7.4, 1.2, bark)), F(E(X + 1, 31.2 + by, 0.9, 0.9, '#ffb3c8')));
  // Front leaves of the skirt.
  for (let i = 0; i < 3; i++) out.push(...leaf(X - 1.6 + i * 1.8, 31.4 + by, 6.6, 3.6, 92 - (i - 1) * 22 + sw * 0.6, i === 1 ? leafB : leafA));
  out.push(...leg(0, true));

  // The twig staff, held out front: knots, a curl, a little leaf, and a glowing bud.
  const sx = X + 10.6 + (walk ? Math.sin(p * TAU) * 0.6 : 0);
  const sy = 31 + by;
  const st = dead ? 14 : hurt ? -10 : walk ? Math.sin(p * TAU) * 3 : wave(p) * 1.4;
  const staff = turn([[sx - 0.8, sy + 13], [sx, sy + 4], [sx - 0.2, sy - 6], [sx + 0.6, sy - 13], [sx + 0.1, sy - 16.4]], sx, sy, st);
  out.push(...tubeL(staff, [1.2, 1.6, 1.6, 1.4, 1], bark, 4, 0.5));
  const top = staff[4];
  const mid = staff[3];
  out.push(...tubeL([mid, [mid[0] + 2, mid[1] - 1.4], [mid[0] + 2.4, mid[1] - 3]], [0.9, 0.7, 0.5], bark, 3, 0.4), ...leaf(mid[0] - 0.2, mid[1] + 1.6, 3.6, 2.2, 200 + st, leafB, false));
  for (const k of [1, 2]) out.push(F(E(staff[k][0] + 0.2, staff[k][1] - 1.2, 0.5, 0.6, barkD)));
  const pulse = walk ? 0 : wave(p) * 0.4;
  const budC = angry ? '#ff5fa8' : dead ? '#c8a8a0' : '#ffb6d8';
  if (!dead) out.push(F(E(top[0], top[1] - 2, 3.6 + pulse + (angry ? 1 : 0), 3.6 + pulse + (angry ? 1 : 0), angry ? '#ffd0e8' : '#fff4c8')));
  out.push(...leaf(top[0], top[1], 2.6, 2, 210 + st, leafA, false), ...leaf(top[0], top[1], 2.6, 2, 330 + st, leafA, false));
  out.push(...ovL(top[0], top[1] - 2, 1.9, 2.6, st, budC, 0.4), F(ov(top[0] - 0.6, top[1] - 2.8, 0.6, 1, st, '#ffffff')));
  if (!dead && (walk ? f % 2 === 0 : f < 2)) out.push(F(T([[top[0] + 4, top[1] - 6.4], [top[0] + 4.4, top[1] - 5.4], [top[0] + 5.4, top[1] - 5], [top[0] + 4.4, top[1] - 4.6], [top[0] + 4, top[1] - 3.6], [top[0] + 3.6, top[1] - 4.6], [top[0] + 2.6, top[1] - 5], [top[0] + 3.6, top[1] - 5.4]], '#fff6b0')));

  // Front arm, hand wrapped around the staff.
  const hand = [sx - 0.1 + Math.sin(rad(st)) * 0, sy];
  out.push(...tubeL([[X + 2.6, 28.6 + by], [X + 6, 31.4 + by], hand], [2.2, 2, 1.8], bark, 4, 0.5), ...ovL(hand[0], hand[1], 1.4, 1.3, 0, bark, 0.4));

  // Head and face.
  out.push(F(E(X, Y, 8.8, 8.4, edge(skin))), E(X, Y, 8.3, 7.9, skin), F(E(X - 2.6, Y - 4, 3.4, 1.6, '#f6fff0')));
  // A pointed leaf-ear.
  out.push(...leaf(X - 4.8, Y + 1, 4.4, 2.8, 200 + (angry ? -15 : 0), skin, false));
  // Leaf hair: a crown of overlapping leaves and bangs that shade the brow.
  const rustle = walk ? Math.sin(p * TAU * 2) * 5 : wave(p) * 4 + (angry ? 0 : 0);
  const crown = [[-8, -2, 150], [-7, -6, 165], [-4, -9, 200], [0, -10, 245], [4, -9.4, 285], [7, -7, 315], [8.6, -3, 345]];
  crown.forEach(([dx, dy, a], i) => out.push(...leaf(X + dx * 0.6, Y + dy * 0.6, angry ? 7.4 : 6.4, 4.4, a + rustle * (i % 2 ? 1 : -0.6), i % 2 ? leafB : leafA)));
  // Bangs: a solid cap of leaves, then pointed leaf-tips falling over the brow.
  out.push(blob([[X - 8.4, Y - 1.4], [X - 7, Y - 7], [X - 1, Y - 9.6], [X + 6, Y - 8], [X + 8.8, Y - 3.4], [X + 4, Y - 5.2], [X - 4, Y - 5]], leafA));
  const fringe = [[-6.6, -4.6, 112, leafC], [-3.4, -5.4, 100, leafA], [-0.2, -5.8, 86, leafB], [3, -5.4, 74, leafA], [6, -4.6, 60, leafB]];
  fringe.forEach(([dx, dy, a, c], i) => out.push(...leaf(X + dx, Y + dy, 4.4 - Math.abs(i - 2) * 0.4, 3.2, a + rustle * 0.3, c, false).map((sh) => C(sh))));
  out.push(F(E(X - 2.6, Y - 7, 2.6, 1, leafL)), F(E(X + 2.6, Y - 7.6, 1.2, 0.6, leafL)));
  // A sprout curling up from the crown, bobbing with each step.
  const sp = walk ? Math.sin(p * TAU * 2 - 1.2) * 10 : wave(p) * 6;
  const sprout = turn([[X + 0.4, Y - 9], [X + 1, Y - 12], [X + 0.2, Y - 14]], X + 0.4, Y - 9, sp + (dead ? 50 : 0));
  out.push(...tubeL(sprout, [0.9, 0.7, 0.6], leafC, 3, 0.4), ...leaf(sprout[2][0], sprout[2][1], 3.6, 2.4, -150 + sp, leafB, false), ...leaf(sprout[2][0], sprout[2][1], 3.2, 2.2, -30 + sp, leafA, false));
  // A pink blossom tucked in the hair.
  const fx = X - 5.4;
  const fy = Y - 5.6;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + (walk ? p : 0);
    out.push(F(E(fx + Math.cos(a) * 1.4, fy + Math.sin(a) * 1.4, 1.2, 1.2, dead ? '#d8b8a8' : '#ffb6d0')));
  }
  out.push(F(E(fx, fy, 0.8, 0.8, '#ffe36b')));

  // Face: big green eyes.
  out.push(...face(X + 2.2, Y + 1.8, 1.72, mood, { gap: 3.5, eye: '#3f8a4e' }));
  // Lashes flicking out at the eyes' outer corners, and a leaf-green iris ring.
  if (mood === 'idle' || mood === 'angry') {
    for (const sd of [-1, 1]) {
      const ex = X + 2.2 + sd * 3;
      out.push(...stroke([[ex + sd * 1.3, Y + 0.2], [ex + sd * 2.2, Y - 0.8]], 0.45, INK));
      out.push(F(E(ex + 0.25, Y + 2.6, 0.9, 0.45, '#7fd08a')));
    }
  }
  if (angry) out.push(F(E(X + 7.2, Y - 1, 0.5, 0.5, '#ff6b9a')));
  if (hurt) out.push(F(E(X + 9, Y - 6, 0.8, 1.2, '#9fd8ff')));
  // Falling leaves on the walk, sparkles of pollen on idle.
  return { w: W, h: H, res: 3, shapes: shift(out, 1, 0) };
}

// ---------- Warg (boarlet) ----------

function boarlet(pose, f, mood) {
  const W = 54;
  const H = 38;
  const G = H;
  const walk = pose === 'walk';
  const p = walk ? f / 6 : f / 4;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const fur = '#9ea6d2';
  const furD = shade(fur, -13);
  const furDD = shade(fur, -24);
  const ruff = '#e8e6f6';
  const ruffD = shade(ruff, -10);
  const scar = '#ff9fb4';
  const out = [];
  // A bounding lope: the body rocks nose-down as the front paws land, then rises as the hind
  // legs drive.
  const pitch = dead ? 4 : hurt ? -6 : walk ? Math.sin(p * TAU) * 5 : 0;
  const by = dead ? 4.6 : walk ? -Math.sin(p * TAU * 2 + 0.6) * 0.9 - 0.4 : wave(p) * 0.4;
  const cx = 26;
  const cy = 23 + by;
  const rot = (pts) => turn(pts, cx, cy, pitch);
  const pt = (x, y) => rot([[x, y + by]])[0];

  // Bushy tail streaming behind, lagging the body.
  const tl = dead ? 0 : walk ? Math.sin(p * TAU - 1.4) : wave(p - 0.2) * 0.6;
  const up = angry ? -3 : hurt ? 3 : 0;
  const tail = dead ? [pt(13, 22), [8, 30], [4, 34], [1.6, 35.4]] : [pt(13, 21), [8, 18.6 + by + tl + up], [4.2, 17 + by + tl * 2 + up], [1.6, 18.6 + tl * 3 + up]];
  out.push(tube(tail, [4.6, 7.4, 6.4, 2.6], furD), F(tube(tail.slice(1), [3.6, 3.6, 1.6], fur)), ...stroke([tail[1], tail[2]], 0.4, furDD));
  out.push(F(E(tail[3][0] + 0.6, tail[3][1], 1.6, 1.4, ruff)));

  // Legs. Hind legs: thigh, a forward knee, a hock kicked back, then the paw.
  const ph = { hb: 0, hn: 0.12, fb: 0.5, fn: 0.62 };
  const hind = (key, near) => {
    const [dx, lift] = dead ? [-4, 0] : walk ? gait(p + ph[key], 10, 3.6) : [near ? -0.8 : 0.8, 0];
    const [hx, hy] = pt(16 + (near ? 0 : 1), 25);
    const fx = hx + dx + 0.6;
    const fy = G - 1.4 + lift;
    const hock = [fx - 2.2 - (lift ? 1 : 0), fy - 4.8];
    const kn = knee(hx, hy, hock[0], hock[1], 5.2, 4.6, -1);
    const c = near ? fur : furDD;
    const leg = [[hx, hy], kn, hock, [fx, fy]];
    return near
      ? [...tubeL(leg, [7, 4, 2.8, 2.4], c, 4, 0.6), ...ovL(fx + 1, fy + 0.3, 2.4, 1.3, 0, c, 0.4), F(E(fx + 3, fy + 0.6, 0.5, 0.4, '#fffaf0'))]
      : [tube(leg, [6.4, 3.6, 2.6, 2.2], c), ov(fx + 1, fy + 0.3, 2.3, 1.2, 0, c)];
  };
  const front = (key, near) => {
    const [dx, lift] = dead ? [4, 0] : walk ? gait(p + ph[key], 10, 3.2) : [near ? 0.6 : -0.6, 0];
    const [hx, hy] = pt(34 - (near ? 0 : 1.2), 25.6);
    const fx = hx + dx + 0.6;
    const fy = G - 1.4 + lift;
    const kn = knee(hx, hy, fx, fy, 5.6, 6, 1);
    const c = near ? fur : furDD;
    const leg = [[hx, hy], kn, [fx, fy]];
    return near
      ? [...tubeL(leg, [5, 3, 2.6], c, 4, 0.6), ...ovL(fx + 1, fy + 0.3, 2.4, 1.3, 0, c, 0.4), F(E(fx + 3, fy + 0.6, 0.5, 0.4, '#fffaf0'))]
      : [tube(leg, [4.4, 2.8, 2.4], c), ov(fx + 1, fy + 0.3, 2.3, 1.2, 0, c)];
  };
  out.push(...hind('hb', false), ...front('fb', false));

  // Shaggy body: jagged tufts along the back and belly.
  const body = rot([[12, 22], [13.4, 17.6], [16, 16.6], [17, 15], [19.4, 16], [21, 14.4], [23.4, 15.6], [25.6, 14], [28, 15.2], [30.4, 13.6], [34, 15], [37, 18.6], [37.4, 24], [36, 28.6], [33.4, 29.6], [31, 28.4], [28.6, 30], [26, 28.6], [23.4, 30], [21, 28.4], [18, 30], [14.6, 28.6], [12.4, 26]].map(([x, y]) => [x, y + by]));
  out.push(T(body.map(([x, y]) => [x + (x - cx) * 0.03, y + (y - cy) * 0.06]), edge(fur)), T(body, fur));
  // Darker saddle along the spine with fur strokes.
  out.push(F(T(rot([[14, 19.4], [17, 16.4], [21, 15.6], [26, 15], [31, 15], [33.6, 17.6], [29, 18.4], [24, 18.8], [19, 19.6], [15.4, 21.4]].map(([x, y]) => [x, y + by])), furD)));
  for (const [x, y] of [[18, 22], [22, 21.4], [26, 22.4], [20, 25.4], [24, 25.6]]) out.push(...stroke(rot([[x, y + by], [x - 1.6, y + 1.8 + by]]), 0.4, furD));
  // A healed claw scar across the flank.
  for (const k of [0, 1, 2]) out.push(...stroke(rot([[19.6 + k * 1.6, 19.6 + by], [21.4 + k * 1.6, 24 + by]]), 0.5, scar));

  out.push(...hind('hn', true));

  // The ruff: a thick collar of pale fur wrapping the neck and chest.
  const rl = walk ? Math.sin(p * TAU * 2 - 1) * 0.7 : wave(p) * 0.3;
  const rf = angry ? 1.35 : 1.15;
  const ruffPts = [];
  for (let i = 0; i <= 12; i++) {
    const a = rad(lerp(-100, 150, i / 12));
    const r = (i % 2 ? 6.6 : 9) * rf + (i % 2 ? 0 : rl);
    ruffPts.push([35 + Math.cos(a) * r * 0.85, 22 + Math.sin(a) * r]);
  }
  out.push(C(T(rot(ruffPts.map(([x, y]) => [x, y + by])), ruff)));
  out.push(F(T(rot(ruffPts.map(([x, y]) => [35 + (x - 35) * 0.6, 23 + (y - 22) * 0.6 + by])), mix(ruff, '#ffffff', 0.5))));
  for (let i = 1; i < 12; i += 2) {
    const [x, y] = ruffPts[i];
    out.push(...stroke(rot([[lerp(35, x, 0.7), lerp(22, y, 0.7) + by], [lerp(35, x, 1.05), lerp(22, y, 1.05) + by]]), 0.4, ruffD));
  }
  out.push(...front('fn', true));

  // Head: a broad skull, a long muzzle, tall ears, and a scar over the eye.
  const [X, Y0] = pt(38.8, 16.2);
  const Y = Y0 + (dead ? 3 : 0) + (walk ? Math.sin(p * TAU + 2) * 0.5 : wave(p + 0.3) * 0.3);
  const tilt = pitch * 0.6 + (dead ? 16 : hurt ? -10 : angry ? 4 : 0);
  const ear = (ex, ey, c, a) => {
    const pts = turn([[ex - 2.2, ey + 1], [ex - 0.6, ey - 5.6], [ex + 2.4, ey + 0.6]], ex, ey, a);
    return [T(pts, c), F(T(turn([[ex - 1.1, ey + 0.6], [ex - 0.5, ey - 3.6], [ex + 1.2, ey + 0.4]], ex, ey, a), '#ffb8c8'))];
  };
  const headAt = out.length;
  const earA = (angry ? -30 : hurt ? -40 : dead ? -55 : -10) + (walk ? Math.sin(p * TAU * 2 - 2) * 6 : wave(p) * 3);
  out.push(...ear(X - 3.4, Y - 4.4, furD, earA - 10));
  // Lower jaw (opens in a snarl).
  const gape = angry ? 2.6 : hurt ? 1.6 : mood === 'happy' ? 1.4 : 0.4;
  const jaw = turn([[X + 1, Y + 3.6], [X + 9.6, Y + 4 + gape], [X + 8.6, Y + 5.6 + gape], [X + 2, Y + 6.4]], X, Y, tilt);
  out.push(T(jaw, ruff));
  if (gape > 1) out.push(F(T(turn([[X + 3, Y + 3.6], [X + 9.6, Y + 3], [X + 9.2, Y + 3.8 + gape], [X + 3.6, Y + 5]], X, Y, tilt), MOUTH)));
  out.push(F(ov(X, Y, 7.4, 6.4, tilt, edge(fur))), ...ball(X, Y, 6.9, 5.9, fur, tilt));
  const muzzle = turn([[X + 2, Y - 1.6], [X + 8.6, Y - 0.4], [X + 11, Y + 0.6], [X + 11.2, Y + 2.6], [X + 9.6, Y + 3.8], [X + 3, Y + 4]], X, Y, tilt);
  out.push(F(T(muzzle.map(([x, y]) => [x + 0.35, y + 0.35]), edge(fur))), blob(muzzle, fur, 3), F(blob(turn([[X + 4, Y + 1.6], [X + 10, Y + 2.4], [X + 9.4, Y + 3.6], [X + 4, Y + 3.8]], X, Y, tilt), ruff, 3)));
  const nose = turn([[X + 10.8, Y + 0.6]], X, Y, tilt)[0];
  out.push(F(E(nose[0], nose[1], 1.3, 1, '#4a3d63')), F(E(nose[0] - 0.4, nose[1] - 0.4, 0.4, 0.3, '#9c8fc0')));
  // Fangs: always peeking, bared when angry.
  const fang = (x, len) => {
    const [a, b, c] = turn([[x - 0.5, Y + 3.6], [x, Y + 3.6 + len], [x + 0.5, Y + 3.6]], X, Y, tilt);
    return F(T([a, b, c], '#fffaf0'));
  };
  out.push(fang(X + 5.6, angry ? 2.2 : 1.3), fang(X + 8.6, angry ? 1.8 : 1));
  // Cheek fur tuft over the jaw hinge.
  out.push(C(T(turn([[X - 4, Y + 1], [X - 1, Y + 6.6], [X - 0.4, Y + 4.2], [X + 1.6, Y + 6], [X + 1.4, Y + 2]], X, Y, tilt), ruff)));
  out.push(...ear(X + 0.2, Y - 5, fur, earA));
  // Eyes: a near eye crossed by an old scar, and a smaller far eye.
  const [ex1, ey1] = turn([[X + 1.4, Y - 1.4]], X, Y, tilt)[0];
  const [ex2, ey2] = turn([[X + 5.4, Y - 1.8]], X, Y, tilt)[0];
  const eo = { iris: '#ffd04a', glow: '#fff4a0', lid: fur, slope: 1, pupil: angry ? 'slit' : 'round' };
  out.push(...eye(ex1, ey1, 1.7, 1.9, mood, eo), ...eye(ex2, ey2, 1.2, 1.6, mood, { ...eo, slope: -1 }));
  out.push(...stroke([[ex1 - 1.4, ey1 - 3.6], [ex1 - 0.6, ey1 - 1.6]], 0.55, scar), ...stroke([[ex1 + 0.4, ey1 + 1.8], [ex1 + 1.2, ey1 + 3.4]], 0.55, scar));
  // Brow: a heavy scowl when angry, a single furrow otherwise.
  if (!angry && !dead && mood !== 'hurt') out.push(...stroke([[ex1 - 0.6, ey1 - 2.8], [ex2 + 0.8, ey2 - 2.8]], 0.4, furDD));
  if (dead) out.push(F(ov(nose[0] - 3, nose[1] + 4.4, 0.9, 1.6, tilt, '#ff8fa8')));
  out.push(...grow(out.splice(headAt), X + 2, Y + 4, 1.22));
  if (hurt) out.push(F(E(51, 6, 0.8, 1.2, '#9fd8ff')));
  return { w: W, h: H, res: 3, shapes: out };
}

// ---------- Treant (mossgolem) ----------

function mossgolem(pose, f, mood) {
  const W = 62;
  const H = 70;
  const G = H;
  const walk = pose === 'walk';
  const p = walk ? f / 6 : f / 4;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const happy = mood === 'happy';
  const bark = '#a9826a';
  const barkD = shade(bark, -13);
  const barkDD = shade(bark, -26);
  const barkL = mix(bark, '#fff0dc', 0.3);
  const moss = '#9cd486';
  const mossD = shade(moss, -14);
  const leafA = dead ? '#b8b07a' : '#76c27a';
  const leafB = dead ? '#c9c08a' : '#92d690';
  const leafC = dead ? '#a89c68' : '#5ea86a';
  const leafL = dead ? '#e0d8a8' : '#c2efb4';
  const out = [];
  // A heavy, rolling stomp: the trunk sinks as each root foot lands and leans into the step.
  const step = walk ? Math.sin(p * TAU * 2) : 0;
  const by = dead ? 5 : walk ? Math.abs(Math.sin(p * TAU)) * -1.4 + 0.4 : wave(p) * 0.5;
  const lean = dead ? 3.5 : hurt ? -2.6 : walk ? Math.sin(p * TAU) * 2 : 0;
  const cx = 30;
  // The crown sits this much lower than it was laid out, leaving headroom for the nest's bird.
  const CY = 3;
  const pivot = [30, 62];
  const tr = (pts) => turn(pts.map(([x, y]) => [x, y + by]), pivot[0], pivot[1], lean);
  const tp = (x, y) => tr([[x, y]])[0];
  const sw = (walk ? Math.sin(p * TAU - 1) * 1.6 : wave(p) * 0.9) + (hurt ? -1.4 : 0);

  // Root feet: a splay of root toes that lift and plant in turn.
  const foot = (ph, near) => {
    const [dx, lift] = dead ? [near ? 4 : -4, 0] : walk ? gait(p + ph, 9, 3.4) : [near ? 1 : -1, 0];
    const fx = cx + (near ? 6 : -6) + dx;
    const fy = G - 1.6 + lift;
    const c = near ? bark : barkD;
    const top = tp(cx + (near ? 6 : -6), 57);
    const parts = near ? tubeL([top, [fx, fy - 4], [fx, fy]], [9, 7, 6], c, 4, 0.7) : [tube([top, [fx, fy - 4], [fx, fy]], [9, 7, 6], c)];
    for (const [ox, len, a] of [[-2, 4.6, 165], [0, 5.4, 20], [2.4, 5.4, 5]]) {
      const end = [fx + ox + Math.cos(rad(a)) * len, fy + 0.6 + Math.sin(rad(a)) * 0.4 + (lift ? -lift * 0.1 + 0.6 : 0)];
      parts.push(...(near ? tubeL([[fx + ox, fy - 1], end], [3, 1.4], c, 3, 0.6) : [tube([[fx + ox, fy - 1], end], [3, 1.4], c)]));
    }
    if (near) parts.push(F(E(fx - 1, fy - 4, 1.4, 1, mossD)));
    return parts;
  };

  // Branch arms: a crooked bough with twig fingers and a tuft of leaves, swinging with the step.
  const arm = (near) => {
    const sh = tp(near ? 43 : 17, 31);
    const s = near ? 1 : -1;
    const swing = (walk ? Math.sin(p * TAU) * (near ? -3 : 3) : wave(p + (near ? 0 : 0.5)) * 0.8) + (angry ? -4 : 0) + (dead ? 8 : 0) + (hurt ? -2 : 0);
    const elbow = [sh[0] + 6.4 * s, sh[1] + 4 + swing * 0.4];
    const hand = [sh[0] + 9.4 * s + swing * 0.5 * s, sh[1] + 11 + swing];
    const c = near ? bark : barkDD;
    const out2 = near ? tubeL([sh, elbow, hand], [6, 4, 3], c, 4, 0.7) : [tube([sh, elbow, hand], [6, 4, 3], c)];
    // Twig fingers.
    for (const a of near ? [40, 80, 120] : [60, 100, 140]) {
      const tip = [hand[0] + Math.cos(rad(a + (angry ? -30 : 0))) * 3.6, hand[1] + Math.sin(rad(a + (angry ? -30 : 0))) * 3.6];
      out2.push(...(near ? tubeL([hand, tip], [1.6, 0.8], c, 2, 0.5) : [tube([hand, tip], [1.6, 0.8], c)]));
    }
    // A sprig of leaves sprouting at the elbow.
    const lc = near ? leafB : leafC;
    out2.push(...leaf(elbow[0], elbow[1] - 1, 5.4, 3.4, near ? -60 + sw * 6 : -120 + sw * 6, lc), ...leaf(elbow[0], elbow[1] - 1, 4.6, 3, near ? -15 + sw * 5 : -165 + sw * 5, lc));
    return out2;
  };

  // Crown back layer.
  const crown = (x, y, rx, ry, c, k = 1) => {
    const ox = sw * k * (1 - y / 40);
    const [px, py] = tp(x + ox, y + CY);
    return ball(px, py, rx, ry, c, 0, { dark: -12 });
  };
  out.push(...arm(false));
  out.push(...foot(0.5, false));
  for (const [x, y, rx, ry] of [[14, 16, 10, 8], [46, 15, 10, 8], [30, 10, 15, 9], [22, 22, 9, 6], [40, 22, 9, 6]]) out.push(...crown(x, y, rx, ry, leafC));

  // The trunk.
  const trunk = tr([[17, 60], [18.4, 50], [16.6, 38], [17.6, 26], [21, 18], [39, 18], [42.4, 26], [43.4, 38], [41.6, 50], [43, 60], [36, 62], [30, 61], [24, 62]]);
  out.push(T(trunk.map(([x, y]) => [x + (x - cx) * 0.035, y + 0.3]), edge(bark)), blob(trunk, bark, 3));
  // Bark grooves and a lighter front plate where the face sits.
  out.push(F(blob(tr([[21, 32], [25, 27], [35, 27], [39.6, 33], [39, 48], [33, 52], [26, 52], [21.4, 47]]), mix(bark, barkL, 0.45), 3)));
  for (const line of [[[19.6, 56], [20.6, 48], [19.4, 40]], [[40.4, 58], [39.4, 50], [41, 42]], [[22.4, 22], [21.2, 28]], [[38, 21], [39.4, 27]], [[29.6, 54], [30.4, 60]], [[25, 55], [24.4, 60]], [[35, 55], [35.8, 60]]]) {
    out.push(...stroke(tr(line), 0.7, barkD), ...stroke(tr(line).map(([x, y]) => [x + 0.6, y]), 0.35, barkL));
  }
  // A knothole on the side.
  const [kx, ky] = tp(20.4, 44);
  out.push(F(E(kx, ky, 1.6, 2.2, barkDD)), F(E(kx + 0.3, ky + 0.4, 0.9, 1.4, '#4a3448')));
  // Mushrooms growing up the side.
  for (const [x, y, r] of [[17.6, 36, 2.6], [18.6, 32, 1.8]]) {
    const [mx, my] = tp(x, y);
    out.push(F(R(mx - 0.5, my, 1.2, 1.8, '#fff0dc')), ...ovL(mx - 0.6, my, r, r * 0.6, 0, dead ? '#c8a8a0' : '#ff9eb8', 0.35), F(E(mx - 1, my - 0.3, 0.5, 0.35, '#ffffff')), F(E(mx + 0.6, my - 0.1, 0.35, 0.3, '#ffffff')));
  }
  // Moss draped over the shoulders.
  out.push(C(blob(tr([[16.4, 27], [19, 20], [25, 17.4], [26.4, 21], [23.4, 22.4], [22, 26], [19.4, 25.6], [18.6, 30]]), moss, 3)));
  out.push(C(blob(tr([[43.6, 28], [41.4, 20], [35, 17.4], [34, 21], [37, 21.6], [38.4, 24.6], [41, 25], [42, 31]]), moss, 3)));

  out.push(...foot(0, true));

  // The face: deep knot eyes with a warm glow, moss brows, a knobby nose, a mouth crack, and a
  // mossy beard.
  const [ex1, ey1] = tp(27.4, 37);
  const [ex2, ey2] = tp(36.6, 37);
  const glow = angry ? '#ff8a3a' : '#ffd36a';
  const hollow = (x, y, s) => {
    const o = [F(E(x, y, 3.3, 2.9, barkDD)), F(E(x, y + 0.2, 2.7, 2.3, '#4a3448'))];
    switch (mood) {
      case 'blink':
        o.push(F(E(x, y - 0.6, 3, 2.2, barkD)), ...stroke([[x - 2.4, y + 0.6], [x, y + 1.2], [x + 2.4, y + 0.6]], 0.6, '#4a3448'));
        break;
      case 'happy':
        o.push(arc(x, y + 1, 1.8, 1.6, 200, 340, 0.8, glow));
        break;
      case 'hurt':
        o.push(...stroke([[x - s * 1.6, y - 1.4], [x + s * 1.2, y], [x - s * 1.6, y + 1.4]], 0.8, '#ffd36a'));
        break;
      case 'dead':
        o.push(...stroke([[x - 1.2, y - 1.2], [x + 1.2, y + 1.2]], 0.7, '#8a7a8a'), ...stroke([[x - 1.2, y + 1.2], [x + 1.2, y - 1.2]], 0.7, '#8a7a8a'));
        break;
      default:
        o.push(F(E(x + 0.4, y + 0.3, angry ? 1.8 : 1.5, angry ? 1.4 : 1.7, angry ? '#ffd27a' : '#fff1b0')), F(E(x + 0.4, y + 0.3, angry ? 1.1 : 1, angry ? 0.8 : 1.2, glow)), F(E(x - 0.2, y - 0.4, 0.45, 0.45, '#ffffff')));
    }
    return o;
  };
  out.push(...hollow(ex1, ey1, 1), ...hollow(ex2, ey2, -1));
  // Moss brows: heavy, wise, and expressive.
  const lift = happy ? -1.6 : hurt ? -1 : 0;
  const tilt = angry ? 2.6 : happy ? -0.6 : hurt ? -1.4 : 0.8;
  const brow = (x, y, s) => C(blob([[x - s * 4.4, y - 3.6 + lift + tilt * 0.2], [x - s * 1, y - 5 + lift - tilt * 0.4], [x + s * 2.6, y - 4.4 + lift + tilt], [x + s * 3.6, y - 2.6 + lift + tilt * 1.2], [x + s * 0.6, y - 3 + lift + tilt * 0.4], [x - s * 3.6, y - 2.2 + lift]], moss, 3));
  out.push(brow(ex1, ey1, 1), brow(ex2, ey2, -1));
  out.push(...stroke([[ex1 - 3, ey1 - 4.2 + lift], [ex1, ey1 - 4.6 + lift]], 0.4, mossD), ...stroke([[ex2 + 3, ey2 - 4.2 + lift], [ex2, ey2 - 4.6 + lift]], 0.4, mossD));
  // Nose knot.
  const [nx, ny] = tp(32.4, 41.4);
  out.push(...ovL(nx, ny, 2.2, 1.8, 0, mix(bark, barkL, 0.6), 0.4), F(E(nx - 0.6, ny - 0.6, 0.7, 0.5, '#fff6e6')));
  // Mouth.
  const [mx, my] = tp(32, 46);
  if (angry) {
    out.push(F(T([[mx - 4.4, my - 1], [mx + 4.4, my - 1], [mx + 3, my + 2.6], [mx - 3, my + 2.6]], '#4a3448')));
    for (const k of [-3, -1, 1, 3]) out.push(F(T([[mx + k - 0.7, my - 1], [mx + k + 0.7, my - 1], [mx + k, my + 0.6]], '#fff0dc')));
  } else if (hurt) {
    out.push(F(E(mx, my + 0.6, 1.6, 1.6, '#4a3448')));
  } else if (dead) {
    out.push(...stroke([[mx - 3, my + 0.6], [mx - 1, my], [mx + 1, my + 0.6], [mx + 3, my]], 0.6, '#4a3448'));
  } else if (happy) {
    out.push(F(T([[mx - 3.4, my - 0.6], [mx + 3.4, my - 0.6], [mx, my + 2.4]], '#4a3448')), F(E(mx, my + 1.2, 1.2, 0.6, '#e9849a')));
  } else {
    out.push(arc(mx, my - 1.4, 3, 2, 30, 150, 0.7, '#4a3448'));
  }
  if (!dead) out.push(F(E(ex1 - 1.6, ey1 + 4.4, 1.6, 0.8, '#f2a0a8')), F(E(ex2 + 1.6, ey2 + 4.4, 1.6, 0.8, '#f2a0a8')));
  // Mossy beard hanging from the chin, swaying.
  const bw = sw * 0.6;
  out.push(C(blob(tr([[25.4, 49.4], [29, 50.6], [35, 50.2], [38.6, 48.8], [38 + bw, 53.4], [35.6 + bw, 52.4], [34 + bw, 57], [31.6 + bw, 53], [29.4 + bw, 56], [27.6 + bw, 52], [25.6 + bw, 54]]), moss, 3)));
  out.push(F(E(...tp(30, 51.6), 1.6, 0.7, mix(moss, '#ffffff', 0.4))));
  out.push(...arm(true));

  // Crown front: big leafy clouds with highlights, a few blossoms, and the bird's nest.
  for (const [x, y, rx, ry, c] of [[11, 22, 7.6, 5.6, leafA], [49, 21, 7.6, 5.6, leafA], [18, 12, 9, 6.6, leafB], [30, 7, 10, 6.4, leafB], [42, 12, 9, 6.6, leafA], [25, 19, 6, 3.6, leafA], [36, 19, 6, 3.6, leafB]]) out.push(...crown(x, y, rx, ry, c));
  // A fringe of leaves hanging from the crown's underside, swaying.
  for (let i = 0; i < 9; i++) {
    const x = 9 + i * 5.2;
    const y = 23.4 + CY + Math.sin(i * 1.7) * 1.2 - (i === 0 || i === 8 ? 2 : 0);
    const [px, py] = tp(x + sw * 0.6, y);
    out.push(...leaf(px, py, 3.6, 2.6, 90 + sw * 8 + (i - 4) * 4, i % 2 ? leafA : leafC, false));
  }
  const leafRing = [[6, 18, 200], [5, 24, 160], [12, 7, 230], [22, 2, 260], [38, 2, 285], [48, 7, 310], [55, 17, 340], [55, 24, 20]];
  for (const [x, y, a] of leafRing) {
    const [px, py] = tp(x + sw * (1 - y / 40), y + CY);
    out.push(...leaf(px, py, 4.4, 3, a + sw * 4, leafB, false));
  }
  for (const [x, y] of [[14, 9], [26, 3.4], [44, 9], [9, 19]]) {
    const [px, py] = tp(x + sw, y + CY);
    out.push(F(E(px, py, 2.4, 1.2, leafL)));
  }
  if (!dead) {
    for (const [x, y] of [[20, 16], [45, 17], [10, 14]]) {
      const [px, py] = tp(x + sw, y + CY);
      for (let i = 0; i < 5; i++) out.push(F(E(px + Math.cos((i / 5) * TAU) * 1, py + Math.sin((i / 5) * TAU) * 1, 0.85, 0.85, '#ffc4d8')));
      out.push(F(E(px, py, 0.55, 0.55, '#ffe36b')));
    }
  }
  // The nest, with a little bluebird who reacts to everything.
  const [nx2, ny2] = tp(36 + sw * 0.9, 2.6 + CY);
  out.push(...ovL(nx2, ny2 + 1.6, 4.6, 2.2, 0, '#c99a6a', 0.4));
  for (const k of [-3, -1, 1, 3]) out.push(...stroke([[nx2 + k - 1.4, ny2 + 0.8], [nx2 + k + 1.2, ny2 + 2.6]], 0.35, '#8f6a4a'));
  if (!dead) {
    const hop = happy ? -1.2 : angry ? -0.8 : walk ? -Math.abs(Math.sin(p * TAU * 2)) * 1 : f === 2 ? -0.8 : 0;
    const bx = nx2 + 0.6;
    const bby = ny2 - 1.4 + hop;
    out.push(...ovL(bx, bby, 2.6, 2.1, 0, '#8ec8ff', 0.4), F(E(bx + 0.8, bby + 0.8, 1.4, 1, '#ffe2c8')));
    out.push(F(T([[bx + 2.2, bby - 0.4], [bx + 3.8, bby + 0.1], [bx + 2.2, bby + 0.6]], '#ffb347')));
    out.push(T([[bx - 1, bby - 1.8], [bx - 0.2, bby - 3 - (angry ? 0.8 : 0)], [bx + 0.4, bby - 1.8]], '#8ec8ff'));
    if (mood === 'blink' || happy) out.push(arc(bx + 1, bby - 0.2, 0.5, 0.4, 200, 340, 0.3, INK));
    else if (hurt) out.push(...stroke([[bx + 0.6, bby - 0.8], [bx + 1.4, bby - 0.3], [bx + 0.6, bby + 0.2]], 0.3, INK));
    else out.push(F(E(bx + 1, bby - 0.3, 0.45, 0.55, INK)));
    if (happy) out.push(F(E(bx + 5.6, bby + 1.4, 0.8, 0.6, INK)), ...stroke([[bx + 6.3, bby + 1.4], [bx + 6.3, bby - 1.2], [bx + 7.2, bby - 0.6]], 0.3, INK));
    if (angry) out.push(...stroke([[bx + 0.2, bby - 1.4], [bx + 1.8, bby - 0.8]], 0.35, INK));
  } else {
    out.push(F(ov(nx2 + 6, ny2 + 8, 0.8, 1.8, 40, '#8ec8ff')));
  }
  if (hurt) out.push(F(E(53, 30, 0.9, 1.4, '#9fd8ff')));
  return { w: W, h: H, res: 3, shapes: shift(out, 1, 0) };
}

export const ART = {
  pebblet: { walk: 6, idle: 4, draw: pebblet },
  scorpip: { walk: 6, idle: 4, draw: scorpip },
  leafling: { walk: 6, idle: 4, draw: leafling },
  boarlet: { walk: 6, idle: 4, draw: boarlet },
  mossgolem: { walk: 6, idle: 4, draw: mossgolem },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  pebblet: { name: 'Basilisk Hatchling', w: 28, h: 22 },
  scorpip: { name: 'Manticore Cub', w: 32, h: 26 },
  leafling: { name: 'Dryad', w: 20, h: 34 },
  boarlet: { name: 'Warg', w: 38, h: 26 },
  mossgolem: { name: 'Treant', w: 34, h: 58 },
};
