// Monster art: maidens. Six graceful humanoid and anthro monster women, taller than the critters
// (about a third of their height is head), each with her own face, eyes, and gait:
//   kitsunemiko  Kitsune Miko: a fox-eared shrine maiden with three fox-fire tails and a gohei
//   sylph        Sylph: a wind spirit on gossamer wings, hair and ribbons streaming (a flyer)
//   yukionna     Yuki-onna: a snow maiden gliding in a white kimono, frost trailing her sleeves
//   nekomata     Nekomata: a twin-tailed cat-girl rogue who prowls low with two daggers
//   lamia        Lamia: a serpent-tailed dancer in gold and veils with a hypnotic gaze
//   lupina       Lupina: a wolf-girl huntress in leather and a cape, with a longbow
// Built like bosses.js: polygons pushed through a small transform stack (`within`) so a head or a
// torso tilts as one piece, with two-bone limbs. All face right, feet (or hem) at the bottom.

import { E, T, F, C, INK, BLUSH, MOUTH, shade, mix } from './kit.js';

const TAU = Math.PI * 2;
const W = 64;
const H = 64;
const GY = 64;

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
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
};
const shift = (dx, dy) => (x, y) => [x + dx, y + dy];
const chain = (...fs) => (x, y) => fs.reduceRight((p, f) => f(...p), [x, y]);
// Local coordinates around (x, y), turned by a.
const at = (x, y, a = 0) => chain(rot(x, y, a), shift(x, y));

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const rnd = (i) => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// The dark line around a part that overlaps another (the rasterizer only outlines the silhouette).
const ink = (c) => mix(shade(c, -50), '#2a2035', 0.45);

// Grow a polygon outward by d (miter offset).
function grow(pts, d) {
  let A = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    A += x1 * y2 - x2 * y1;
  }
  const sg = A > 0 ? 1 : -1;
  const nrm = (a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [(sg * dy) / l, (-sg * dx) / l];
  };
  return pts.map((p, i) => {
    const a = nrm(pts[(i - 1 + pts.length) % pts.length], p);
    const b = nrm(p, pts[(i + 1) % pts.length]);
    let nx = a[0] + b[0];
    let ny = a[1] + b[1];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    const k = d / Math.max(0.5, nx * a[0] + ny * a[1]);
    return [p[0] + nx * k, p[1] + ny * k];
  });
}

const poly = (pts, c) => T(pts.map(([x, y]) => X(x, y)), c);
const fpoly = (pts, c) => F(poly(pts, c));
// A polygon with its own ink line, so it reads over whatever lies behind it.
function opoly(pts, c, d = 0.55) {
  const w = pts.map(([x, y]) => X(x, y));
  return [F(T(grow(w, d), ink(c))), T(w, c)];
}
function ovalPts(cx, cy, rx, ry, n = 24, a = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    out.push([cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
  }
  return out;
}
const oval = (cx, cy, rx, ry, c, a = 0, n = 24) => poly(ovalPts(cx, cy, rx, ry, n, a), c);
const foval = (cx, cy, rx, ry, c, a = 0, n = 20) => F(oval(cx, cy, rx, ry, c, a, n));
const ooval = (cx, cy, rx, ry, c, a = 0, d = 0.55) => opoly(ovalPts(cx, cy, rx, ry, 22, a), c, d);
const dot = (x, y, rx, c, ry = rx) => {
  const [px, py] = X(x, y);
  return F(E(px, py, rx, ry, c));
};
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

// A band along a smooth curve; `wf(t)` is its width at t in 0..1 (or a number for constant).
function bandPts(pts, wf, n = 4) {
  const p = spline(pts, n).map(([x, y]) => X(x, y));
  const m = p.length;
  const left = [];
  const right = [];
  const wfn = typeof wf === 'number' ? () => wf : wf;
  for (let i = 0; i < m; i++) {
    const a = p[Math.max(0, i - 1)];
    const b = p[Math.min(m - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const w = wfn(i / (m - 1)) / 2;
    left.push([p[i][0] - dy * w, p[i][1] + dx * w]);
    right.push([p[i][0] + dy * w, p[i][1] - dx * w]);
  }
  return [...left, ...right.reverse()];
}
const band = (pts, wf, c, n = 4) => T(bandPts(pts, wf, n), c);
const fband = (pts, wf, c, n = 4) => F(band(pts, wf, c, n));
// Banded with an ink line.
function oband(pts, wf, c, n = 4, d = 0.55) {
  const w = bandPts(pts, wf, n);
  return [F(T(grow(w, d), ink(c))), T(w, c)];
}
const taperW = (w0, w1) => (t) => lerp(w0, w1, t);
// A soft lock or tail: thin root, full belly, pointed tip.
const lockW = (w, root = 0.55, at2 = 0.35, tip = 0.05) => (t) => (t < at2 ? lerp(w * root, w, smooth(t / at2)) : lerp(w, w * tip, smooth((t - at2) / (1 - at2))));
const line = (pts, th, c, n = 1) => fband(pts, th, c, n);

// A four-point sparkle.
function sparkle(x, y, r, c) {
  return fpoly([[x, y - r], [x + r * 0.25, y - r * 0.25], [x + r, y], [x + r * 0.25, y + r * 0.25], [x, y + r], [x - r * 0.25, y + r * 0.25], [x - r, y], [x - r * 0.25, y - r * 0.25]], c);
}

// A flame (three nested layers) standing on (x, y), its tip leaning `lean`, with a little side
// tongue licking up beside the main one.
function flame(x, y, h, w, lean, cols) {
  const out = [];
  [1, 0.66, 0.36].forEach((k, i) => {
    const hh = h * (i === 0 ? 1 : k * 1.05);
    const ww = w * k;
    const pts = [[x - ww, y], [x - ww * 1.05, y - hh * 0.3]];
    if (i === 0) pts.push([x - ww * 1.2 + lean * 0.2, y - hh * 0.62], [x - ww * 0.3 + lean * 0.3, y - hh * 0.5]);
    pts.push([x - ww * 0.3 + lean * 0.45, y - hh * 0.75], [x + lean, y - hh], [x + ww * 0.6 + lean * 0.35, y - hh * 0.55], [x + ww, y - hh * 0.2], [x + ww * 0.7, y + ww * 0.3], [x, y + ww * 0.5]);
    out.push(fpoly(pts, cols[i]));
  });
  return out;
}

// A small faceted gem.
function gem(x, y, r, c) {
  return [
    fpoly([[x, y - r * 1.25], [x + r * 1.1, y], [x, y + r * 1.25], [x - r * 1.1, y]], shade(c, -30)),
    fpoly([[x, y - r], [x + r * 0.85, y], [x, y + r], [x - r * 0.85, y]], c),
    fpoly([[x, y - r], [x + r * 0.85, y], [x, y]], mix(c, '#ffffff', 0.5)),
    dot(x - r * 0.25, y - r * 0.35, Math.max(0.35, r * 0.25), '#ffffff'),
  ];
}

// Two-bone reach: the joint between root and end, bending toward `dir` (+1 forward, -1 back).
function joint(h, ft, a, b, dir) {
  const dx = ft[0] - h[0];
  const dy = ft[1] - h[1];
  const d = clamp(Math.hypot(dx, dy), 0.01, a + b - 0.05);
  const base = Math.atan2(dy, dx);
  const A = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const k1 = [h[0] + Math.cos(base + A) * a, h[1] + Math.sin(base + A) * a];
  const k2 = [h[0] + Math.cos(base - A) * a, h[1] + Math.sin(base - A) * a];
  const kn = (k1[0] - k2[0]) * dir > 0 ? k1 : k2;
  const fl = Math.hypot(ft[0] - kn[0], ft[1] - kn[1]) || 1;
  return { k: kn, f: [kn[0] + ((ft[0] - kn[0]) / fl) * Math.min(b, fl), kn[1] + ((ft[1] - kn[1]) / fl) * Math.min(b, fl)] };
}

// One foot's path over a walk cycle (p in turns): planted and sliding back at an even pace for
// half the cycle (so it never skates), then lifted and swung forward. Returns [dx, -lift].
function gait(p, stride, lift) {
  p = ((p % 1) + 1) % 1;
  if (p < 0.5) return [stride / 2 - stride * (p / 0.5), 0];
  const t = (p - 0.5) / 0.5;
  return [-stride / 2 + stride * smooth(t), -lift * Math.sin(Math.PI * t)];
}

// Washes a palette out toward a pale lavender (fading away when defeated).
function fade(P, mood) {
  if (mood !== 'dead') return P;
  const out = {};
  for (const k in P) out[k] = mix(P[k], '#d6d0e2', 0.42);
  return out;
}

// ---------- Faces ----------

// An anime eye built as an almond: the upper and lower lids are curves between an inner and an
// outer corner, and the iris and pupil are clipped between them. `s` is +1 for the near eye (its
// outer corner to the right), -1 for the far one. Each maiden passes her own shape in `e`:
// rx (half width), up / dn (lid heights), inY / outY (corner heights: a lifted outer corner
// reads foxy, a dropped one melancholy), lid (a resting heavy lid), pupil ('slit', 'round',
// 'dot', 'none'), and colors.
function eye(ex, ey, s, mood, e) {
  const out = [];
  const rx = e.rx * (s < 0 ? 0.8 : 1);
  const lash = e.lash ?? '#2a2035';
  const th = e.th ?? 0.62;
  const xAt = (t) => ex + s * (-rx + 2 * rx * t);
  const mid = (t) => ey + lerp(e.inY, e.outY, t);
  const angry = mood === 'angry';
  const lidK = angry ? 0 : e.lid ?? 0;
  const upAt = (t) => {
    let y = mid(t) - e.up * (1 - lidK) * Math.sin(Math.PI * t) ** 0.75;
    if (angry) y += lerp(e.up * 0.75, e.up * 0.12, t) * Math.sin(Math.PI * clamp(t * 1.1, 0, 1)) ** 0.3;
    return y;
  };
  const dnAt = (t) => mid(t) + e.dn * Math.sin(Math.PI * t) ** 1.1 * (angry ? 0.85 : 1);
  const tOf = (x) => clamp((s * (x - ex) + rx) / (2 * rx), 0, 1);
  const N = 10;
  const ts = Array.from({ length: N + 1 }, (_, i) => i / N);
  const flick = (x, y, k = 1) => {
    out.push(line([[x - s * 0.2, y + 0.1], [x + s * 0.95 * k, y - 0.6 * k]], th * 0.9, lash));
    if ((e.flicks ?? 2) > 1) out.push(line([[x - s * 0.5, y], [x + s * 0.55 * k, y - 0.95 * k]], th * 0.6, lash));
  };
  if (mood === 'blink') {
    const pts = ts.map((t) => [xAt(t), mid(t) + e.dn * 0.45 + e.dn * 0.35 * Math.sin(Math.PI * t)]);
    out.push(fband(pts, (t) => th * lerp(0.7, 1.15, t), lash, 2));
    const [ox, oy] = pts[N];
    flick(ox, oy, 0.8);
    for (const t of [0.35, 0.65]) out.push(line([[xAt(t), pts[Math.round(t * N)][1]], [xAt(t) + s * 0.15, pts[Math.round(t * N)][1] + 0.7]], 0.35, lash));
    return out;
  }
  if (mood === 'happy') {
    const pts = ts.map((t) => [xAt(t), mid(t) + e.dn * 0.6 - (e.up * 0.75 + 0.3) * Math.sin(Math.PI * t)]);
    out.push(fband(pts, (t) => th * lerp(0.75, 1.2, t), lash, 2));
    flick(pts[N][0], pts[N][1], 0.8);
    return out;
  }
  if (mood === 'hurt') {
    const h = (e.up + e.dn) * 0.5;
    out.push(line([[ex + s * rx, ey - h], [ex - s * rx * 0.6, ey + 0.1], [ex + s * rx, ey + h]], th * 1.15, lash, 1));
    return out;
  }
  if (mood === 'dead') {
    const h = (e.up + e.dn) * 0.42;
    out.push(line([[ex - rx * 0.8, ey - h], [ex + rx * 0.8, ey + h]], th, lash), line([[ex - rx * 0.8, ey + h], [ex + rx * 0.8, ey - h]], th, lash));
    return out;
  }
  // Open: sclera, iris and pupil clipped to the lids, shines, the lash line and its wing.
  const upper = ts.map((t) => [xAt(t), upAt(t)]);
  const lower = ts.map((t) => [xAt(t), dnAt(t)]);
  const clip = (pts) => pts.map(([x, y]) => {
    const t = tOf(x);
    const xx = clamp(x, Math.min(xAt(0), xAt(1)), Math.max(xAt(0), xAt(1)));
    return [xx, clamp(y, upAt(t) + 0.05, dnAt(t) - 0.05)];
  });
  out.push(fpoly([...upper, ...lower.slice().reverse()], e.white ?? '#ffffff'));
  const ix = ex + s * rx * (e.look ?? 0.14);
  const iy = ey + (e.dn - e.up) * 0.12 + 0.2;
  const iry = (e.up + e.dn) * 0.5 * (e.iris2 ?? 0.95);
  const irx = rx * (e.irisW ?? 0.66);
  const iris = angry ? e.hot ?? e.iris : e.iris;
  out.push(fpoly(clip(ovalPts(ix, iy, irx, iry, 18)), shade(iris, -22)));
  out.push(fpoly(clip(ovalPts(ix, iy + iry * 0.12, irx * 0.82, iry * 0.8, 18)), iris));
  out.push(fpoly(clip(ovalPts(ix, iy + iry * 0.48, irx * 0.6, iry * 0.4, 14)), mix(iris, '#ffffff', 0.5)));
  const pc = e.pupilC ?? '#2a2035';
  if (e.pupil === 'slit') out.push(fpoly(clip([[ix, iy - iry * 1.1], [ix + irx * (angry ? 0.14 : 0.24), iy], [ix, iy + iry * 1.1], [ix - irx * (angry ? 0.14 : 0.24), iy]]), pc));
  else if (e.pupil === 'round') out.push(fpoly(clip(ovalPts(ix, iy, irx * (angry ? 0.3 : 0.42), iry * 0.48, 12)), pc));
  else if (e.pupil === 'dot') out.push(fpoly(clip(ovalPts(ix, iy, irx * 0.24, iry * 0.28, 10)), pc));
  // Shadow of the upper lid across the top of the eye.
  out.push(fpoly([...upper, ...upper.slice().reverse().map(([x, y]) => [x, y + 0.55])], mix(shade(iris, -30), lash, 0.3)));
  out.push(dot(ix - irx * 0.35, iy - iry * 0.35, Math.max(0.42, rx * 0.26), '#ffffff'), dot(ix + irx * 0.35, iy + iry * 0.42, 0.28, '#ffffff'));
  if (e.star) out.push(sparkle(ix + irx * 0.1, iy + iry * 0.1, 0.75, '#ffffff'));
  // Upper lash line, thicker toward the outer corner, and its wing.
  out.push(fband(upper, (t) => th * lerp(0.75, 1.3, t), lash, 2));
  flick(upper[N][0], upper[N][1], s > 0 ? 1 : 0.75);
  if (e.liner) out.push(line([[upper[N][0] - s * 0.4, upper[N][1] + 0.3], [upper[N][0] + s * 1.1, upper[N][1] - 0.2]], 0.45, e.liner));
  if (e.lower) out.push(fband(lower.slice(Math.round(N * 0.45)), (t) => lerp(0.15, 0.42, t), lash, 2));
  return out;
}

// The face, in head-local coordinates (head center 0,0, facing right in three-quarter view).
// `f` holds the eye shape, brow color, mouth style, and blush.
function features(mood, f) {
  const out = [];
  const ey = 1.6;
  const near = [3.3, ey];
  const far = [-2.5, ey];
  out.push(...eye(far[0], far[1], -1, mood, f.eye), ...eye(near[0], near[1], 1, mood, f.eye));
  // Blush and a little nose.
  if (mood !== 'dead') out.push(dot(near[0] + 0.5, ey + 2.9, 1.25, f.blush ?? BLUSH, 0.5), dot(far[0] - 0.2, ey + 2.9, 0.95, f.blush ?? BLUSH, 0.45));
  out.push(line([[5.5, 3.6], [5.9, 4.3]], 0.4, f.nose));
  // Mouth.
  const mx = 2.6;
  const my = 6.1;
  const lip = f.lip ?? MOUTH;
  if (mood === 'angry') {
    out.push(fpoly([[mx - 1.6, my - 0.5], [mx + 1.5, my - 0.8], [mx + 1, my + 0.9], [mx - 1.1, my + 0.8]], lip));
    out.push(fpoly([[mx - 1, my + 0.5], [mx + 0.7, my + 0.4], [mx, my + 0.9]], mix(lip, '#ffb3c6', 0.5)));
    if (f.fangs) out.push(fpoly([[mx - 1.3, my - 0.5], [mx - 0.5, my - 0.55], [mx - 0.9, my + 0.5]], '#ffffff'), fpoly([[mx + 0.6, my - 0.7], [mx + 1.3, my - 0.75], [mx + 0.95, my + 0.3]], '#ffffff'));
    else out.push(fpoly([[mx - 1.4, my - 0.5], [mx + 1.3, my - 0.75], [mx + 1.2, my - 0.2], [mx - 1.3, my]], '#ffffff'));
  } else if (mood === 'hurt') {
    out.push(line([[mx - 1.4, my + 0.3], [mx - 0.7, my - 0.2], [mx, my + 0.3], [mx + 0.7, my - 0.2], [mx + 1.3, my + 0.2]], 0.42, ink(lip)));
  } else if (mood === 'dead') {
    out.push(foval(mx, my + 0.2, 0.6, 0.7, lip));
  } else if (mood === 'happy') {
    out.push(fpoly([[mx - 1.6, my - 0.5], [mx + 1.6, my - 0.7], [mx + 0.9, my + 0.9], [mx - 0.6, my + 1]], lip), fpoly([[mx - 0.7, my + 0.4], [mx + 0.8, my + 0.3], [mx + 0.3, my + 0.95], [mx - 0.4, my + 0.95]], '#ff9fb4'));
    if (f.fangs) out.push(fpoly([[mx + 0.5, my - 0.65], [mx + 1.1, my - 0.7], [mx + 0.8, my - 0.05]], '#ffffff'));
  } else {
    // A small confident smile, lifted at the front corner.
    out.push(fband([[mx - 1.3, my - 0.1], [mx - 0.2, my + 0.45], [mx + 1, my + 0.15], [mx + 1.5, my - 0.35]], taperW(0.3, 0.5), ink(lip), 3));
    out.push(dot(mx - 0.1, my + 1, 0.55, mix(lip, '#ffffff', 0.35), 0.25));
    if (f.fangIdle) out.push(fpoly([[mx + 0.4, my + 0.3], [mx + 0.9, my + 0.2], [mx + 0.7, my + 0.8]], '#ffffff'));
  }
  if (mood === 'hurt') out.push(...fpolyDrop(7.6, -2.6));
  return out;
}
// Brows: a slim arch; slanted down to the middle when angry, raised there when hurt. Drawn over
// the fringe, as anime faces do, so the expression always reads.
function brows(mood, f) {
  if (mood === 'dead') return [];
  const by = 1.6 - f.eye.up - 1.6 + (f.browY ?? 0);
  const bc = f.brow;
  const tw = mood === 'angry' ? 1.1 : mood === 'hurt' ? -0.9 : 0;
  return [
    fband([[1.7, by + tw], [3.3, by - 0.5 + tw * 0.3], [4.9, by + 0.1 - tw * 0.2]], taperW(0.55, 0.3), bc, 3),
    fband([[-1.2, by + tw], [-2.5, by - 0.4 + tw * 0.3], [-3.7, by + 0.2 - tw * 0.2]], taperW(0.5, 0.25), bc, 3),
  ];
}

// Hair over the crown, with a fringe of separate locks (each inked so the strands read) casting
// shade on the brow. `locks`: [rootX, rootY, tipX, tipY, width, curl].
function fringe(c, cLt, locks) {
  const out = [C(poly([...arcPts(0, -0.8, 7.9, 7.7, 182, 358, 12), [7.8, -2.4], [4, -4.4], [0, -5], [-4, -4.4], [-7.8, -1.8]], c))];
  for (const [x0, y0, x1, y1, w, curl = 0.6] of locks) {
    const mid = [lerp(x0, x1, 0.5) + curl, lerp(y0, y1, 0.5)];
    out.push(...oband([[x0, y0], mid, [x1, y1]], lockW(w, 1, 0.3, 0.05), c, 3).map(C));
  }
  out.push(fband(arcPts(0, -0.8, 6.3, 5.9, 212, 262, 5), taperW(0.5, 1), cLt, 1), fband(arcPts(0, -0.8, 6.4, 6, 272, 318, 5), taperW(1, 0.4), cLt, 1));
  return out;
}

// A sweat drop.
function fpolyDrop(x, y) {
  return [fpoly([[x, y - 1.6], [x + 0.9, y + 0.1], [x, y + 0.9], [x - 0.9, y + 0.1]], '#cfeaff'), dot(x - 0.25, y, 0.25, '#ffffff')];
}

// The head: skull and soft jaw (pointed chin, three-quarter view), with a neck below.
function skull(P) {
  return [
    poly([[-6.9, 0], ...arcPts(0, 0, 7.2, 7.1, 180, 360, 12).slice(1), [7.2, 1.4], [6.4, 4.6], [4.2, 7.3], [2, 8.5], [0.6, 8.3], [-2.4, 7], [-5.6, 4.2]], P.skin),
    fpoly([[-6.9, 0], [-5.6, 4.2], [-2.4, 7], [-3.4, 4.6], [-5, 1.4]], P.skinDk),
  ];
}

// The hair behind the head: round over the crown and soft at the nape.
function backHair(c, low = 7.6) {
  const pts = [...arcPts(0, -0.4, 8, 8, 172, 368, 12), ...spline([[7.8, 1.6], [6.8, low * 0.7], [3, low], [-2.6, low + 0.6], [-7, low * 0.8], [-8, 1.2]], 3)];
  return opoly(pts, c);
}

// ---------- Body parts ----------

// A limb from a to b to c as two tapered bands, inked so it reads over the body.
function limb(a, b, c, w0, w1, w2, col, col2 = col) {
  return [...oband([a, b], taperW(w0, w1), col, 1), ...ooval(b[0], b[1], w1 * 0.5, w1 * 0.5, col2), ...oband([b, c], taperW(w1, w2), col2, 1)];
}

// A wide kimono sleeve: it wraps the upper arm, opens at the wrist, and hangs in a deep pocket
// below the forearm that trails behind by `sw`.
function sleeve(sh, e, h, c, cDk, sw, drop = 6, edge = null) {
  const low = Math.max(e[1], h[1]);
  const fx = Math.max(h[0], e[0] + 1);
  const pts = [[sh[0] - 2.1, sh[1] - 0.6], [sh[0] + 1.6, sh[1] - 1.4], [e[0] + 2, e[1] - 1.2], [h[0] - 0.4, h[1] - 1.5], [h[0] + 0.3, h[1] + 1.5], [fx - 0.6 + sw * 0.25, low + drop * 0.8], [lerp(fx, e[0], 0.5) - 0.6 + sw * 0.6, low + drop + 0.4], [e[0] - 2.8 + sw, low + drop * 0.65], [e[0] - 2.9 + sw * 0.3, e[1] - 0.4]];
  const out = [...opoly(pts, c)];
  out.push(fpoly([pts[6], pts[7], pts[8], [e[0] - 0.6, e[1] + 1.4], [lerp(fx, e[0], 0.5) - 0.4 + sw * 0.5, low + drop - 1]], cDk));
  out.push(line([[e[0] + 0.4, e[1] + 1], [lerp(fx, e[0], 0.4) + sw * 0.4, low + drop - 1.2]], 0.45, cDk));
  if (edge) out.push(line([pts[5], pts[6], pts[7]], 0.8, edge, 1));
  return out;
}

// The torso outline relative to the hips (0,0): shoulders, bust, waist, hips.
const TORSO = [[-0.6, -14.4], [1.4, -14.4], [3.8, -12.8], [5, -10.6], [5.3, -9], [4.6, -7.4], [3.4, -6.6], [2.8, -4.2], [3.7, -1.2], [3.6, 1.4], [-4.2, 1.4], [-4.7, -1.2], [-3.3, -4.6], [-3.9, -8.8], [-4.4, -12.4]];

// Long hair: a lock from `root`, falling at angle `a` (radians, 0 = right, PI/2 = down), with a
// travelling wave (phase `ph`, amplitude `amp`) and a drift `wind` (+x per unit length).
function lockPts(root, a, len, ph, amp, wind = 0, n = 5, k = 0.9) {
  const pts = [];
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const off = amp * Math.sin(ph - i * k) * u ** 1.2;
    pts.push([root[0] + dx * len * u - dy * off + wind * len * u * u, root[1] + dy * len * u + dx * off]);
  }
  return pts;
}

// A curving lock: starts at angle a0 and turns by `bend` along its length, rippling with a wave
// that travels from root to tip (phase ph, amplitude amp in radians).
function flowPts(root, a0, bend, len, ph, amp, n = 6, k = 0.8) {
  const pts = [root];
  let q = root;
  for (let i = 1; i <= n; i++) {
    const a = a0 + (bend * i) / n + Math.sin(ph - i * k) * amp * (i / n);
    q = [q[0] + Math.cos(a) * (len / n), q[1] + Math.sin(a) * (len / n)];
    pts.push(q);
  }
  return pts;
}

// A fluffy animal tail: wide belly, pale tip, fur clumps along it.
function fluffTail(pts, w, c, tip, o = {}) {
  const out = [];
  out.push(...oband(pts, lockW(w, 0.4, o.at ?? 0.45, 0.08), c, 4));
  const sp = spline(pts, 4);
  // Darker underside streak and a lit ridge.
  out.push(fband(sp.slice(0, Math.round(sp.length * 0.75)).map(([x, y]) => [x - 0.2, y + w * 0.18]), lockW(w * 0.32, 0.4, 0.5, 0.2), shade(c, -8), 1));
  out.push(fband(sp.slice(1, Math.round(sp.length * 0.7)).map(([x, y]) => [x + 0.2, y - w * 0.2]), lockW(w * 0.2, 0.3, 0.5, 0.1), mix(c, '#ffffff', 0.35), 1));
  // The pale tip.
  const tp = sp.slice(Math.round(sp.length * (o.tipAt ?? 0.66)));
  if (tp.length > 1) out.push(fband(tp, (t) => lerp(w * 0.75, w * 0.08, t) * (t < 0.15 ? 0.6 + t * 2.6 : 1), tip, 1));
  return out;
}

// ---------- Kitsune Miko ----------

const KM = {
  skin: '#fff0e4', skinDk: '#f4d3c8', hair: '#ffbf72', hairDk: '#e8914f', hairLt: '#ffe1ae', tip: '#fffaf2', earIn: '#ffd9cf',
  robe: '#fffaf6', robeDk: '#e9dcea', red: '#ef5d74', redDk: '#c8435d', redLt: '#ff8a9a', gold: '#ffd36b', fire: '#a3b6ff', fire2: '#e4ecff', fireHot: '#ff8fd0',
  wood: '#c98f5c', paper: '#ffffff', tabi: '#ffffff', zori: '#ef5d74', lip: '#d8556e',
};
const FOX_FACE = {
  eye: { rx: 1.8, up: 1.55, dn: 1.05, inY: 0.55, outY: -0.75, pupil: 'slit', iris: '#ff8f52', hot: '#ff5f7a', lash: '#5a2a32', liner: '#ff6a82', flicks: 2, lower: false, irisW: 0.6 },
  brow: '#d77c46', nose: '#eab5a5', lip: '#d8556e', fangs: true,
};

function kitsune(pose, f, mood) {
  const P = fade(KM, mood);
  const walk = pose === 'walk';
  const atk = pose === 'attack';
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry' || atk;
  const n = walk ? 8 : atk ? 4 : 6;
  const ph = (f / n) * TAU;
  const p = f / n;
  // A gliding shrine-dance step: short, smooth strides; the hips float with barely a dip.
  const STR = 7;
  let hip = [31, 43.6];
  let lean = 0;
  let tilt = 0;
  let feet;
  if (walk) {
    hip[1] += -0.55 * (0.5 - 0.5 * Math.cos(4 * Math.PI * p));
    lean = 0.05;
    tilt = 0.03 * Math.sin(ph * 2);
    feet = [0.5, 0].map((o) => gait(p + o, STR, 1.6));
  } else {
    hip[1] += Math.sin(ph) * 0.35;
    tilt = Math.sin(ph) * 0.04;
    feet = [[-2.2, 0], [2.6, 0]];
  }
  // Attack: a sweep of the sleeve flings fox-fire. 0 coils back, 1 flicks, 2 follows through, 3 settles.
  const A = atk ? [[-1, -0.1, 1.5], [1, 0.12, -0.3], [0.8, 0.08, -0.1], [0.3, 0.02, 0.4]][f] : null;
  if (A) {
    hip[0] += A[0];
    lean = A[1];
    tilt = A[1] * 0.6;
    feet = [[-3.6, 0], [3.4 + Math.max(0, A[0]) * 1.4, 0]];
  }
  if (hurt) {
    lean = -0.16;
    tilt = -0.18;
    hip[0] -= 1;
  }
  if (dead) {
    hip = [30, 56.5];
    lean = 0.32;
    tilt = 0.4;
    feet = [[-8.5, 0], [-6.5, 0]];
  }
  const out = [];
  const T0 = at(hip[0], hip[1], lean);
  const pt = (x, y) => within(T0, () => X(x, y));
  const neck = pt(1, -14.2);
  const hc = [neck[0] + 0.6 + Math.sin(tilt) * 7, neck[1] - 7.6];
  const sway = walk ? Math.sin(ph) : Math.sin(ph) * 0.5;
  const trail = walk ? -1.6 : 0;

  // Three big fox tails fanning out behind, each curling up at the tip and swaying a beat behind
  // the one before, tipped in fox-fire.
  const tb = pt(-3.6, -1.6);
  const tails = [];
  for (let i = 0; i < 3; i++) {
    const a0 = [-3.05, -2.45, -1.85][i] + (dead ? 0.75 : 0) + (angry ? 0.12 : 0) + (A ? -A[0] * 0.1 : 0) + (hurt ? 0.3 : 0);
    const amp = (walk ? 0.16 : 0.1) * (dead ? 0.2 : 1);
    const len = dead ? 16 : 21;
    const pts = [tb];
    let a = a0;
    let q = tb;
    for (let k = 1; k <= 5; k++) {
      a += 0.24 + Math.sin(ph - k * 0.8 - i * 0.9) * amp * k * 0.6 + (walk ? -0.02 : 0);
      q = [q[0] + Math.cos(a) * (len / 5), q[1] + Math.sin(a) * (len / 5)];
      pts.push(q);
    }
    tails.push(pts);
  }
  // Draw the highest tail last so they stack front to back.
  for (const i of [0, 2, 1]) out.push(...fluffTail(tails[i], 8.2, P.hair, P.tip, { tipAt: 0.7 }));
  if (!dead) {
    tails.forEach((pts, i) => {
      const [x, y] = pts[pts.length - 1];
      const fl = angry ? [P.fireHot, '#ffd0ee', '#ffffff'] : [P.fire, P.fire2, '#ffffff'];
      out.push(...flame(x + 0.4, y + 1.6, 4.2 + Math.sin(ph * 2 + i * 2) * 0.7, 1.6, 0.6 + Math.sin(ph + i) * 0.7, fl));
    });
  }

  // Long hair down the back, tied low with a paper ribbon, swinging a little behind the walk.
  const hr = [hc[0] - 3.5, hc[1] + 1];
  const hairLen = dead ? 15 : 22;
  const back = lockPts(hr, Math.PI / 2 + 0.22 + (walk ? 0.1 : 0) + lean * 0.5, hairLen, ph - 0.6, walk ? 1.3 : 0.7, -0.03, 5, 0.8);
  out.push(...oband(back, lockW(8.5, 1, 0.25, 0.25), P.hair, 4));
  out.push(fband(back.slice(1).map(([x, y]) => [x - 1.4, y]), lockW(3.2, 0.6, 0.3, 0.2), P.hairDk, 3));
  {
    const [rx, ry] = back[2];
    out.push(...opoly([[rx - 2.6, ry - 1.6], [rx + 2.4, ry - 1.4], [rx + 2.2, ry + 1.4], [rx - 2.4, ry + 1.2]], P.paper), line([[rx - 2.4, ry], [rx + 2.2, ry + 0.1]], 0.5, P.red));
    const tl = lockPts([rx - 0.4, ry + 1], Math.PI / 2 + 0.35, 6, ph - 1.4, 1, -0.05, 3);
    out.push(...oband(tl, taperW(1.8, 1), P.paper, 3));
  }

  // Back arm holding the gohei upright behind her shoulder.
  const shB = pt(-3, -12.2);
  const handB = dead ? [shB[0] - 2, shB[1] + 11] : [shB[0] - 1.6 + sway * 0.4, shB[1] + 8.5];
  const elB = joint(shB, handB, 6.2, 6.2, -1);
  out.push(...limb(shB, elB.k, elB.f, 2.5, 2.1, 1.6, P.robeDk), ...ooval(elB.f[0], elB.f[1], 1.1, 1, P.skinDk));
  out.push(...sleeve(shB, elB.k, elB.f, P.robeDk, shade(P.robeDk, -6), sway * 0.6 + trail, 3.6, P.redDk));

  // Legs: white tabi in red-strapped zori peeking from under the hakama.
  const ankle = (i) => [hip[0] + feet[i][0], (dead ? 63 : GY - 1.2) + feet[i][1]];
  const legs = [];
  for (const i of [0, 1]) {
    const a = ankle(i);
    const h0 = pt(i ? 1.2 : -1.4, 0);
    const kn = joint(h0, a, 10.4, 10.4, 1);
    legs.push({ h0, kn, a });
  }
  const foot = (a, c) => [...opoly([[a[0] - 1.4, a[1] - 1], [a[0] + 1.2, a[1] - 1.2], [a[0] + 3.2, a[1] + 0.2], [a[0] + 3, a[1] + 1.1], [a[0] - 1.6, a[1] + 1.1]], c), line([[a[0] + 0.4, a[1] - 0.6], [a[0] + 1.6, a[1] + 0.6]], 0.6, P.zori), ...fpolyR([[a[0] - 1.8, a[1] + 1], [a[0] + 3.4, a[1] + 1], [a[0] + 3.4, a[1] + 1.4], [a[0] - 1.8, a[1] + 1.4]], P.zori)];
  out.push(...foot(legs[0].a, mix(P.tabi, '#d8d2ea', 0.3)));

  // The red hakama: wide pleated trousers whose hem follows the feet.
  {
    const w0 = pt(-4.4, -4.6);
    const w1 = pt(3.4, -4.6);
    const kA = legs[0].kn.k;
    const kB = legs[1].kn.k;
    const fA = legs[0].a;
    const fB = legs[1].a;
    const lo = Math.min(fA[0], fB[0]);
    const hi = Math.max(fA[0], fB[0]);
    const hy = (dead ? 62 : GY - 2.4);
    const flare = 2.6 + (walk ? Math.abs(Math.sin(ph)) * 0.8 : 0);
    const hem = [[hi + flare + 0.8, hy + 0.3], [lerp(lo, hi, 0.5) + 0.6, hy - 1.2 + Math.sin(ph * 2) * 0.3], [lo - flare - 0.4, hy + 0.2]];
    const hk = [w0, w1, pt(4.6, 0.5), [Math.max(kA[0], kB[0]) + 2.4, Math.min(kA[1], kB[1]) + 1], hem[0], hem[1], hem[2], [Math.min(kA[0], kB[0]) - 3.2, lerp(kA[1], kB[1], 0.5) + 1], pt(-5.4, 0.6)];
    out.push(...opoly(hk, P.red));
    // Back half in shade, pleats, and the split between the legs.
    out.push(fpoly([w0, pt(-1, -4.6), pt(-1.4, 1), [lo - 0.6, hy], hem[2], [Math.min(kA[0], kB[0]) - 3.2, lerp(kA[1], kB[1], 0.5) + 1], pt(-5.4, 0.6)], P.redDk));
    for (const k of [-0.2, 0.25, 0.6]) {
      const top = pt(lerp(-4, 3.2, k + 0.2), -3.6);
      out.push(line([top, [lerp(lo - 1.6, hi + 2, k + 0.2), hy - 0.4]], 0.45, k > 0 ? P.redDk : shade(P.redDk, -8)));
    }
    out.push(line([pt(0.6, 0), [lerp(lo, hi, 0.5) + 0.6, hy - 1.4]], 0.5, ink(P.red)));
    out.push(fband([pt(2, -2), [hi + flare, hy - 1]], 0.8, P.redLt, 1));
  }
  out.push(...foot(legs[1].a, P.tabi));

  // The white kosode: crossed collar (red under-collar), tucked into the hakama, with its ties.
  within(T0, () => {
    const top = [[-4.5, -12.6], [-0.6, -14.4], [1.4, -14.4], [3.9, -12.8], [5, -10.6], [5.3, -9], [4.6, -7.4], [3.4, -6.4], [3.6, -4.2], [-4.4, -4.2], [-3.4, -8.6]];
    out.push(...opoly(top, P.robe));
    out.push(fpoly([[-4.5, -12.6], [-1.6, -13.6], [-1.6, -4.2], [-4.4, -4.2], [-3.4, -8.6]], P.robeDk));
    // The bust's soft shadow and highlight.
    out.push(fband(arcPts(3.2, -8.6, 2.1, 1.6, 40, 150, 6), 0.45, P.robeDk, 1), dot(4.2, -10.2, 0.8, '#ffffff', 0.5));
    // Crossed collar.
    out.push(...oband([[1.6, -14.2], [2.2, -11], [1.2, -7.6]], 1.3, P.red, 2), ...oband([[-0.6, -14.2], [1.4, -10.4], [3.6, -7.2]], 1.3, P.robe, 2));
    // Hakama waistband and the bow at the front.
    out.push(...opoly([[-4.6, -5.6], [3.8, -5.6], [3.8, -3.8], [-4.6, -3.8]], P.red), line([[-4.4, -4.7], [3.6, -4.7]], 0.4, P.redDk));
    out.push(...ooval(3.2, -4.6, 1.5, 1.1, P.red, 0.4), ...oband([[3.4, -4.2], [4.6 + sway * 0.4, -1.4], [4.4 + sway * 0.6 + trail * 0.4, 1.6]], taperW(1.2, 0.8), P.red, 2), ...oband([[2.8, -4.2], [2.9 + sway * 0.3, -1], [2 + trail * 0.4, 1.2]], taperW(1.1, 0.7), P.redDk, 2));
  });

  // Neck and head.
  out.push(...oband([[neck[0], neck[1] + 1.4], [hc[0] + 0.2, hc[1] + 6]], 2.8, P.skin, 1), fband([[hc[0] - 0.6, hc[1] + 6.8], [hc[0] + 1.2, hc[1] + 6.4]], 1.2, P.skinDk, 1));
  within(at(hc[0], hc[1], tilt), () => {
    const earT = walk ? Math.sin(ph * 2 - 1) * 0.06 : f === 3 && pose === 'idle' ? 0.18 : 0;
    const earFlat = angry ? -0.25 : hurt || dead ? 0.55 : 0;
    // Back ear.
    within(at(-3.6, -5.4, -0.5 - earFlat - earT), () => out.push(...opoly([[-2.6, 0.6], [0.2, -7.2], [2.6, 0.8]], P.hairDk), fpoly([[-1.3, 0], [0.1, -5], [1.4, 0]], shade(P.earIn, -6))));
    // Hair behind the head.
    out.push(...backHair(P.hairDk));
    out.push(...skull(P));
    out.push(...features(mood, FOX_FACE));
    // Fringe: soft pointed bangs casting shade on the brow.
    out.push(...fringe(P.hair, P.hairLt, [[-5.4, -5.6, -6.6, 2, 3, -0.4], [-2.2, -6.8, -2.8, 0.2, 3.4, 0.2], [1.2, -7, 1.2, 0.4, 3.6, 0.6], [4.2, -6.2, 4.8, -0.4, 3.2, 0.7], [6.4, -4.4, 7.3, 1.8, 2.4, 0.4]]));
    out.push(...brows(mood, FOX_FACE));
    // Side locks in red paper ties.
    const sl = lockPts([6.6, -1.4], Math.PI / 2 - 0.08, 12, ph - 0.4, walk ? 0.7 : 0.4, walk ? -0.05 : 0, 4);
    out.push(...oband(sl, lockW(2.2, 1, 0.3, 0.15), P.hair, 3), fband(sl.slice(0, 4).map(([x, y]) => [x + 0.3, y]), lockW(0.7, 1, 0.3, 0.1), P.hairLt, 2));
    out.push(...opoly([[sl[3][0] - 1.1, sl[3][1] - 0.6], [sl[3][0] + 1.1, sl[3][1] - 0.6], [sl[3][0] + 1, sl[3][1] + 0.6], [sl[3][0] - 1, sl[3][1] + 0.6]], P.paper, 0.4), line([[sl[3][0] - 1, sl[3][1]], [sl[3][0] + 1, sl[3][1]]], 0.35, P.red));
    const sl2 = lockPts([-6.4, 0], Math.PI / 2 + 0.1, 11, ph - 0.9, walk ? 0.7 : 0.4, walk ? -0.06 : 0, 4);
    out.push(...oband(sl2, lockW(2.4, 0.9, 0.3, 0.2), P.hairDk, 3));
    // Front ear, and a red hair ornament with a bell.
    within(at(2.8, -6.2, 0.38 + earFlat + earT), () => out.push(...opoly([[-2.8, 0.8], [-0.2, -7.6], [2.6, 0.6]], P.hair), fpoly([[-1.6, 0], [-0.3, -5.6], [1.2, 0]], P.earIn), fpoly([[-0.9, -5.6], [-0.2, -7.6], [0.6, -5.8]], P.tip)));
    out.push(...ooval(-4.6, -5, 1.6, 1.3, P.red), ...ooval(-5.6, -3.4, 0.9, 0.9, P.gold), dot(-5.9, -3.7, 0.3, '#ffffff'));
  });

  // Front arm: the ofuda between her fingers; on attack it whips through and flings fox-fire.
  const shF = pt(3, -12.2);
  let handF;
  if (dead) handF = [shF[0] + 3, shF[1] + 10];
  else if (A) handF = [[shF[0] - 6.5, shF[1] + 4], [shF[0] + 11.5, shF[1] + 1], [shF[0] + 11, shF[1] + 3.5], [shF[0] + 6.5, shF[1] + 7]][f];
  else if (hurt) handF = [shF[0] + 4.5, shF[1] + 3];
  else handF = [shF[0] + 4.2 + sway * 0.4, shF[1] + 8.4 - (angry ? 2.6 : 0) + Math.sin(ph) * 0.3];
  const elF = joint(shF, handF, 6.2, 6.2, A && f === 0 ? 1 : -1);
  {
    const e = elF.k;
    const h = elF.f;
    const sw = (A ? [1, -3.6, -2.6, -0.8][f] : trail) + sway * 0.6;
    out.push(...limb(shF, e, h, 3, 2.4, 2, P.robe));
    out.push(...sleeve(shF, e, h, P.robe, P.robeDk, sw, 6.4, P.red));
    out.push(...ooval(h[0] + 0.5, h[1], 1.25, 1.1, P.skin));
    if (!dead && (!A || f === 3)) {
      // The ofuda: a paper talisman with red script.
      const ox = h[0] + 1.3;
      const oy = h[1] - 0.6;
      out.push(...opoly([[ox - 0.8, oy - 4.6], [ox + 0.8, oy - 4.8], [ox + 1, oy + 0.4], [ox - 0.6, oy + 0.6]], P.paper, 0.4), line([[ox, oy - 3.8], [ox + 0.1, oy - 0.4]], 0.45, P.red), dot(ox + 0.05, oy - 4.2, 0.4, P.red));
    }
    out.push(...ooval(h[0] + 0.6, h[1] + 0.1, 1.15, 1, P.skin));
  }

  // Fox-fire: wisps orbiting her, and the attack's orb.
  if (!dead) {
    const fl = angry ? [P.fireHot, '#ffd0ee', '#ffffff'] : [P.fire, P.fire2, '#ffffff'];
    if (!A) {
      for (let i = 0; i < 2; i++) {
        const a = ph + i * Math.PI;
        const x = 31 + Math.cos(a) * 14;
        const y = 34 + Math.sin(a) * 4 - 3 * i;
        const k = 0.8 + 0.2 * Math.sin(a);
        // Behind her on the far side of the orbit, in front on the near side.
        const fs = flame(x, y, 4.8 * k, 1.5 * k, -Math.cos(a) * 1.4 - 0.4, fl);
        if (Math.sin(a) < 0) out.unshift(...fs);
        else out.push(...fs);
      }
    } else {
      const [ox, oy, r] = [[handF[0] + 0.5, handF[1] - 0.5, 1.8], [52, 30, 3.6], [59, 30.5, 3.2], [62, 31, 1.8]][f];
      if (f >= 1) for (let k = 1; k <= 3; k++) out.push(dot(ox - k * 3, oy + Math.sin(k) * 0.6, r * (1 - k * 0.22), fl[k === 1 ? 0 : 1]));
      out.push(dot(ox, oy, r + 1, fl[0]), dot(ox - 0.2, oy - 0.1, r * 0.72, fl[1]), dot(ox - 0.4, oy - 0.3, r * 0.4, '#ffffff'));
      if (f === 1) out.push(sparkle(ox + 1, oy - 4.5, 1.8, '#ffffff'), sparkle(ox - 3, oy + 4, 1.4, fl[1]));
    }
  }
  return { w: W, h: H, res: 3, shapes: out };
}
const fpolyR = (pts, c) => [fpoly(pts, c)];

// ---------- Sylph ----------

const SY = {
  skin: '#f3fffa', skinDk: '#d2efe6', hair: '#9feccf', hairDk: '#6fcfb0', hairLt: '#e0fff2', dress: '#86dcb4', dressDk: '#5fbf98', dressLt: '#c8f6dc',
  leaf: '#78d494', ribbon: '#ffc4e4', ribbonDk: '#f09ccb', wing: '#effdff', wingDk: '#c8eef0', vein: '#8fd6cc', wingTint: '#f2dcff', gust: '#d4fff1', gust2: '#ffffff', flower: '#ffb3d9', gold: '#ffe08a',
};
const SYLPH_FACE = {
  eye: { rx: 1.95, up: 2.2, dn: 1.85, inY: 0, outY: -0.15, pupil: 'none', star: true, iris: '#45d6bd', hot: '#ff7fc4', lash: '#2f7a70', flicks: 1, lower: true, irisW: 0.74, white: '#f6fffc', th: 0.55 },
  brow: '#5cbca0', nose: '#b9e4d8', lip: '#ff8fb8', blush: '#ffb8d8',
};

// A dragonfly wing from (x, y) toward angle a: a long leaf of gossamer with veins and a tinted tip.
function wing(x, y, a, len, w, P, far) {
  const out = [];
  const d = [Math.cos(a), Math.sin(a)];
  const nrm = [-d[1], d[0]];
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const half = (w / 2) * Math.sin(Math.PI * t) ** 0.6;
    pts.push([x + d[0] * len * t + nrm[0] * half * 1.15, y + d[1] * len * t + nrm[1] * half * 1.15]);
  }
  for (let i = 10; i >= 0; i--) {
    const t = i / 10;
    const half = (w / 2) * Math.sin(Math.PI * t) ** 0.8;
    pts.push([x + d[0] * len * t - nrm[0] * half * 0.85, y + d[1] * len * t - nrm[1] * half * 0.85]);
  }
  out.push(...opoly(pts, far ? P.wingDk : P.wing, 0.45));
  const tip = pts.slice(6, 15);
  out.push(fpoly(tip, P.wingTint));
  out.push(line([[x, y], [x + d[0] * len * 0.95, y + d[1] * len * 0.95]], 0.4, P.vein));
  for (const t of [0.3, 0.55, 0.78]) {
    const bx = x + d[0] * len * t;
    const by = y + d[1] * len * t;
    out.push(line([[bx, by], [bx + d[0] * 2.2 + nrm[0] * w * 0.42, by + d[1] * 2.2 + nrm[1] * w * 0.42]], 0.3, P.vein), line([[bx, by], [bx + d[0] * 2 - nrm[0] * w * 0.32, by + d[1] * 2 - nrm[1] * w * 0.32]], 0.3, P.vein));
  }
  out.push(dot(x + d[0] * len * 0.62 + nrm[0] * w * 0.15, y + d[1] * len * 0.62 + nrm[1] * w * 0.15, 0.5, '#ffffff'));
  return out;
}

// A spiral of wind: a band winding out from the center, lit along its inner edge.
function gust(cx, cy, R, turn, P, k = 1) {
  const pts = [];
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const a = turn + t * Math.PI * 3.2;
    const r = R * (0.15 + 0.85 * t);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8]);
  }
  return [...oband(pts, (t) => 0.4 + 2.4 * k * Math.sin(Math.PI * t) ** 0.7, P.gust, 1, 0.4), fband(pts.slice(4, 22), (t) => 0.6 * Math.sin(Math.PI * t), P.gust2, 1)];
}

function sylph(pose, f, mood) {
  const P = fade(SY, mood);
  const walk = pose === 'walk';
  const atk = pose === 'attack';
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry' || atk;
  const n = walk ? 8 : atk ? 4 : 6;
  const ph = (f / n) * TAU;
  // Hovering on the breeze: a slow rise and fall, drifting nose-down as she glides forward.
  let hip = [32, 40.5 + Math.sin(ph) * 1.4];
  let lean = walk ? 0.17 : 0.04 + Math.sin(ph) * 0.02;
  let tilt = walk ? 0.02 + Math.sin(ph + 1) * 0.03 : Math.sin(ph + 1) * 0.05;
  const A = atk ? [[-2.2, -0.16], [2.2, 0.2], [1.6, 0.12], [0.4, 0.05]][f] : null;
  if (A) {
    hip[0] += A[0];
    lean = A[1];
    tilt = A[1] * 0.5;
  }
  if (hurt) {
    lean = -0.22;
    tilt = -0.22;
    hip[0] -= 1.5;
  }
  if (dead) {
    hip = [31, 51];
    lean = 0.55;
    tilt = 0.55;
  }
  const flap = dead ? -0.6 : Math.sin(ph * 2);
  const wind = walk ? 1 : A ? (f === 0 ? -0.4 : 0.6) : 0.35;
  const out = [];
  const T0 = at(hip[0], hip[1], lean);
  const pt = (x, y) => within(T0, () => X(x, y));
  const neck = pt(1, -14.2);
  const hc = [neck[0] + 0.6 + Math.sin(tilt) * 7, neck[1] - 7.6];

  // Hair: long locks streaming back on the wind, lighter toward the tips.
  const locks = [[-4.4, -5.4, -0.25, 20, 5], [-6, -2, 0, 24, 5.4], [-6.6, 1.6, 0.25, 21, 4.6], [-5.4, 4.4, 0.5, 16, 3.6]];
  locks.forEach(([lx, ly, da, len, w], i) => {
    const root = [hc[0] + lx, hc[1] + ly];
    // Streaming back in flight, falling softer while she hovers.
    const a0 = lerp(2.0, 2.75, wind) + da + (dead ? -0.5 : 0);
    const bend = lerp(0.2, -0.85, wind) + da * 0.4;
    const pts = flowPts(root, a0, bend, dead ? len * 0.7 : len, ph - i * 0.7, 0.32, 6, 0.9);
    out.push(...oband(pts, lockW(w, 0.85, 0.3, 0.04), i % 2 ? P.hairDk : P.hair, 3));
    out.push(fband(pts.slice(2), lockW(w * 0.3, 1, 0.2, 0.05), P.hairLt, 3));
  });

  // Two pairs of dragonfly wings from the shoulder blades, fluttering.
  {
    const wr = pt(-2.8, -11);
    const wa = (dead ? 0.8 : 0) + lean;
    out.push(...wing(wr[0] - 0.6, wr[1] - 0.4, -2.05 + flap * 0.22 + wa * 0.5, 16, 5.2, P, true), ...wing(wr[0] - 0.4, wr[1] + 0.6, -2.85 + flap * 0.18 + wa * 0.5, 12.5, 4.2, P, true));
    out.push(...wing(wr[0], wr[1], -2.3 + flap * 0.28 + wa * 0.5, 17.5, 5.8, P, false), ...wing(wr[0] + 0.2, wr[1] + 1.2, -3.1 + flap * 0.22 + wa * 0.5, 13.5, 4.6, P, false));
  }

  // Back arm.
  const shB = pt(-3, -12.2);
  let handB;
  if (dead) handB = [shB[0] + 1, shB[1] + 10];
  else if (A) handB = [[shB[0] - 8, shB[1] + 1], [shB[0] + 11, shB[1] - 2], [shB[0] + 8.5, shB[1] - 5.5], [shB[0] + 4, shB[1] + 4]][f];
  else if (walk) handB = [shB[0] - 6 + Math.sin(ph) * 0.6, shB[1] + 6.5];
  else handB = [shB[0] - 4.6 + Math.sin(ph) * 0.4, shB[1] + 6.6 + Math.sin(ph - 0.6) * 0.5];
  const elB = joint(shB, handB, 6, 6, A && f >= 1 && f <= 2 ? 1 : -1);
  out.push(...limb(shB, elB.k, elB.f, 2.2, 1.9, 1.5, P.skinDk), ...ooval(elB.f[0], elB.f[1], 1.05, 0.95, P.skinDk));
  out.push(...oband([[elB.f[0] - 1, elB.f[1] - 0.6], [elB.f[0] - 3, elB.f[1] + 1.4 + Math.sin(ph) * 0.5], [elB.f[0] - 6.5, elB.f[1] + 0.6 + Math.sin(ph - 1)]], taperW(1.2, 0.4), P.ribbonDk, 3));

  // Legs: bare and pointed like a dancer's, trailing as she floats, ribbons laced at the ankles.
  const legAt = (hx, foot, c, c2) => {
    const h0 = pt(hx, 0);
    const kn = joint(h0, foot, 9.4, 9.4, 1);
    const a = kn.f;
    const dir = Math.atan2(a[1] - kn.k[1], a[0] - kn.k[0]) - 0.35;
    const toe = [a[0] + Math.cos(dir) * 3.2, a[1] + Math.sin(dir) * 3.2];
    const out2 = [...limb(h0, kn.k, a, 3.4, 2.3, 1.5, c), ...oband([a, toe], taperW(1.7, 0.6), c, 1)];
    out2.push(line([[a[0] - 1, a[1] - 2.2], [a[0] + 1, a[1] - 1.4]], 0.5, c2), line([[a[0] - 0.9, a[1] - 0.8], [a[0] + 1, a[1] - 0.1]], 0.5, c2));
    return out2;
  };
  const swing = walk ? Math.sin(ph) * 1.6 : Math.sin(ph) * 0.6;
  const feet = dead
    ? [[hip[0] - 9, hip[1] + 10], [hip[0] - 6, hip[1] + 12]]
    : A && f === 1
      ? [[hip[0] - 8, hip[1] + 15], [hip[0] - 3, hip[1] + 17]]
      : [[hip[0] - 7 - swing * 0.6 - (walk ? 1.6 : 0), hip[1] + 13.4 + swing * 0.4], [hip[0] - 0.4 + swing - (walk ? 2.2 : 0), hip[1] + 18 - (walk ? 0 : 0.4)]];
  out.push(...legAt(-1.6, feet[0], P.skinDk, P.ribbonDk));

  // The petal skirt: leaves layered back to front, fluttering on the breeze.
  {
    const petals = [[-4.4, -2.6, 2.2, 8, P.dressDk], [-1.6, -2.4, 2.25, 8.5, P.leaf], [1.2, -2.4, 1.85, 8.2, P.dressDk], [-3, -2.6, 2.05, 9.6, P.dress], [0.4, -2.6, 1.7, 9.2, P.dress], [2.8, -2.6, 1.3, 7.6, P.dressLt]];
    petals.forEach(([x, y, a, len, c], i) => {
      const r = pt(x, y);
      const aa = a + lean + 0.3 * wind + Math.sin(ph * 2 - i * 0.9) * 0.12 + (dead ? -0.3 : 0);
      const pts = [r, [r[0] + Math.cos(aa) * len * 0.5 + Math.sin(ph - i) * 0.4, r[1] + Math.sin(aa) * len * 0.5], [r[0] + Math.cos(aa) * len, r[1] + Math.sin(aa) * len]];
      out.push(...oband(pts, lockW(4.6, 0.6, 0.45, 0.05), c, 3), line([pts[0], pts[1], pts[2]].slice(0, 2), 0.35, shade(c, -12)));
    });
  }
  out.push(...legAt(1.4, feet[1], P.skin, P.ribbon));

  // Bodice of overlapping leaves, a pink sash, and its two long ribbons.
  within(T0, () => {
    out.push(...opoly([[-4.4, -12.4], [-1.6, -13.4], [1.8, -13.2], [4.2, -12.2], [5.2, -10.2], [5.3, -8.8], [4.4, -7.2], [3, -6.4], [3.4, -2.6], [-4.4, -2.6], [-3.4, -8.6]], P.dress));
    out.push(fpoly([[-4.4, -12.4], [-1.8, -13.2], [-1.4, -2.6], [-4.4, -2.6], [-3.4, -8.6]], P.dressDk));
    for (const [x, y, a] of [[2.4, -10.8, 0.9], [0, -10.6, 1.2], [2.6, -8, 0.6]]) out.push(...oband([[x - Math.cos(a) * 2, y - Math.sin(a) * 2], [x + Math.cos(a) * 2, y + Math.sin(a) * 2]], lockW(2.4, 0.4, 0.5, 0.1), P.dressLt, 1, 0.35));
    out.push(fband(arcPts(3.4, -8.6, 2, 1.5, 40, 150, 6), 0.4, P.dressDk, 1), dot(4.3, -10.4, 0.7, '#ffffff', 0.45));
    out.push(...opoly([[-4.6, -5.4], [3.5, -5.6], [3.6, -3.8], [-4.6, -3.6]], P.ribbon), ...ooval(-4.4, -4.6, 1.5, 1.2, P.ribbon));
  });
  for (let i = 0; i < 2; i++) {
    const r = pt(-4.6, -4.4);
    const pts = lockPts(r, Math.PI - 0.5 * wind + (1 - wind) * 1.1 + i * 0.35, 14 - i * 3, ph * 2 - i - 0.5, 1.4, 0, 5, 1);
    out.push(...oband(pts, taperW(1.7, 0.9), i ? P.ribbonDk : P.ribbon, 3));
  }

  // Neck and head: elfin ears, a fringe of soft locks, and a little flower crown.
  out.push(...oband([[neck[0], neck[1] + 1.4], [hc[0] + 0.2, hc[1] + 6]], 2.6, P.skin, 1), fband([[hc[0] - 0.6, hc[1] + 6.8], [hc[0] + 1.2, hc[1] + 6.4]], 1.1, P.skinDk, 1));
  within(at(hc[0], hc[1], tilt), () => {
    out.push(...backHair(P.hairDk));
    out.push(...skull(P));
    out.push(...features(mood, SYLPH_FACE));
    // Pointed ear (the far one is hidden by hair).
    out.push(...opoly([[-4.2, 0.6], [-9.4, -3.6 + (hurt ? 2 : 0) + Math.sin(ph * 2) * 0.3], [-4.6, 3.4]], P.skin), fpoly([[-4.8, 1.2], [-8, -2.4 + (hurt ? 1.6 : 0)], [-5, 2.6]], P.skinDk));
    out.push(...fringe(P.hair, P.hairLt, [[-4.6, -6, -5.6, 1.8, 3, -0.6], [-1.6, -7, -1.4, 0.4, 3.2, 0.3], [1.6, -7, 2.2, -0.2, 3.2, 0.8], [4.6, -5.8, 5.4, 0.6, 2.8, 0.7], [6.8, -3.6, 7.6, 3, 2, 0.3]]));
    out.push(...brows(mood, SYLPH_FACE));
    const sl = lockPts([6.8, -1], Math.PI / 2 + 0.05, 10, ph - 0.4, 0.8, -0.05 * wind, 4);
    out.push(...oband(sl, lockW(2.2, 1, 0.3, 0.1), P.hair, 3));
    // Flower crown: leaves and a pink bloom.
    for (const [x, y, a] of [[-5.6, -5.4, -2.4], [-2.4, -7.6, -1.9], [5.2, -6, -0.9]]) out.push(...oband([[x, y], [x + Math.cos(a) * 3, y + Math.sin(a) * 3]], lockW(1.8, 0.4, 0.5, 0.1), P.leaf, 1, 0.4));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU + 0.3;
      out.push(...ooval(1.4 + Math.cos(a) * 1.1, -7.4 + Math.sin(a) * 1.1, 0.95, 0.95, P.flower, 0, 0.4));
    }
    out.push(dot(1.4, -7.4, 0.6, P.gold));
  });

  // Front arm, with a ribbon around the wrist.
  const shF = pt(3.2, -12);
  let handF;
  if (dead) handF = [shF[0] + 2, shF[1] + 10];
  else if (A) handF = [[shF[0] - 7, shF[1] + 4], [shF[0] + 11.5, shF[1]], [shF[0] + 10.5, shF[1] + 3.5], [shF[0] + 6.5, shF[1] + 6]][f];
  else if (hurt) handF = [shF[0] + 3, shF[1] + 1];
  else if (walk) handF = [shF[0] - 1 + Math.sin(ph) * 0.8, shF[1] + 8];
  else handF = [shF[0] + 6.4 + Math.sin(ph) * 0.4, shF[1] + 5.4 - Math.sin(ph - 0.5) * 0.6];
  const elF = joint(shF, handF, 6, 6, A && f === 0 ? 1 : -1);
  out.push(...limb(shF, elF.k, elF.f, 2.3, 2, 1.6, P.skin), ...ooval(elF.f[0] + 0.3, elF.f[1], 1.15, 1, P.skin));
  out.push(...oband([[elF.f[0] - 1, elF.f[1] - 0.4], [elF.f[0] - 3.4, elF.f[1] + 2 + Math.sin(ph) * 0.6], [elF.f[0] - 7, elF.f[1] + 1.4 + Math.sin(ph - 1)]], taperW(1.3, 0.4), P.ribbon, 3));

  // Wind: little leaves and motes riding around her; the attack's spinning gust.
  if (!dead) {
    for (let i = 0; i < 3; i++) {
      const u = (i / 3 + f / n) % 1;
      const a = u * TAU;
      const x = 32 + Math.cos(a) * 17;
      const y = 36 + Math.sin(a) * 5 - i * 4;
      out.push(...oband([[x - 1.2, y + 0.4], [x + 1.2, y - 0.4]], lockW(1.6, 0.3, 0.5, 0.1), i % 2 ? P.leaf : P.dress, 1, 0.4));
    }
    if (!A) out.push(sparkle(32 + Math.cos(ph) * 12, 28 + Math.sin(ph) * 3, 1.2, '#ffffff'));
    if (A) {
      const g = [[hip[0] - 11, hip[1] - 13, 3.2, 0.5], [52, 30, 9, 1], [55, 30, 10.5, 0.8], [58, 31, 7, 0.4]][f];
      out.push(...gust(g[0], g[1], g[2], -f * 1.6, P, g[3]));
      if (f >= 1) {
        for (let k = 0; k < 3; k++) out.push(line([[g[0] - 10 - k * 2, g[1] - 6 + k * 5], [g[0] - 2 - k, g[1] - 7 + k * 5]], 0.5, P.gust));
        out.push(sparkle(g[0] + 3, g[1] - 7, 1.6, '#ffffff'), ...oband([[g[0] + 5, g[1] + 4], [g[0] + 7, g[1] + 3]], lockW(1.6, 0.3, 0.5, 0.1), P.leaf, 1, 0.4));
      }
    }
  }
  return { w: W, h: H, res: 3, shapes: out };
}

// ---------- Yuki-onna ----------

const YU = {
  skin: '#f6f8ff', skinDk: '#dde3f6', hair: '#3b3858', hairDk: '#28253f', hairLt: '#7584b4', kimono: '#fbfdff', kimonoDk: '#dbe3f4', ice: '#a6d8ff', iceDk: '#6eaee8', iceLt: '#dcf1ff',
  obi: '#8ec6f6', obiDk: '#5f9ad8', silver: '#d4dcf0', snow: '#ffffff', breath: '#e2f4ff',
};
const YUKI_FACE = {
  eye: { rx: 1.8, up: 1.45, dn: 1.15, inY: -0.15, outY: 0.35, lid: 0.28, pupil: 'dot', iris: '#9fd6ff', hot: '#4fb8ff', lash: '#33355f', flicks: 2, lower: true, irisW: 0.66, liner: '#9fc4f2' },
  brow: '#3b3858', nose: '#c8d2ee', lip: '#6f9ee0', blush: '#d4dcff',
};

// A six-armed snowflake.
function snowflake(x, y, r, c) {
  const out = [];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI + 0.3;
    out.push(line([[x - Math.cos(a) * r, y - Math.sin(a) * r], [x + Math.cos(a) * r, y + Math.sin(a) * r]], Math.max(0.35, r * 0.28), c));
  }
  out.push(dot(x, y, r * 0.3, c));
  return out;
}

function yuki(pose, f, mood) {
  const P = fade(YU, mood);
  const walk = pose === 'walk';
  const atk = pose === 'attack';
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry' || atk;
  const n = walk ? 8 : atk ? 4 : 6;
  const ph = (f / n) * TAU;
  // A ghostly glide: no steps at all, just a slow float with the hem rippling back.
  let hip = [31, 42.6 + (walk ? Math.sin(ph * 2) * 0.45 : Math.sin(ph) * 0.7)];
  let lean = walk ? 0.07 : 0.02;
  let tilt = walk ? 0.06 : Math.sin(ph - 0.8) * 0.04 + 0.04;
  const A = atk ? [[-1.2, -0.1, -0.12], [1.4, 0.14, 0.1], [1.2, 0.1, 0.06], [0.4, 0.03, 0.04]][f] : null;
  if (A) {
    hip[0] += A[0];
    lean = A[1];
    tilt = A[2];
  }
  if (hurt) {
    lean = -0.16;
    tilt = -0.2;
    hip[0] -= 1;
  }
  if (dead) {
    hip = [30, 53];
    lean = 0.4;
    tilt = 0.5;
  }
  const out = [];
  const T0 = at(hip[0], hip[1], lean);
  const pt = (x, y) => within(T0, () => X(x, y));
  const neck = pt(1, -14.2);
  const hc = [neck[0] + 0.6 + Math.sin(tilt) * 7, neck[1] - 7.6];
  const drift = walk ? 1 : 0.3;

  // Very long hair falling straight down her back to the hem, lifting a little at the ends.
  {
    const root = [hc[0] - 2.5, hc[1] - 1];
    const len = dead ? 16 : 37;
    const pts = lockPts(root, Math.PI / 2 + 0.16 + 0.12 * drift + lean * 0.6, len, ph - 0.5, 0.9 * drift + 0.3, -0.03 * drift, 6, 0.7);
    out.push(...oband(pts, (t) => (t < 0.12 ? lerp(13, 11, t / 0.12) : lerp(11, 1.5, ((t - 0.12) / 0.88) ** 2.2)), P.hair, 4));
    out.push(fband(pts.slice(1).map(([x, y]) => [x - 2.2, y]), lockW(3.4, 0.6, 0.3, 0.1), P.hairDk, 3));
    for (const dx of [-0.4, 1.6]) out.push(fband(pts.slice(1, 6).map(([x, y], k) => [x + dx * (1 - k * 0.15), y]), taperW(0.4, 0.2), P.hairDk, 3));
    out.push(fband(pts.slice(1, 5).map(([x, y]) => [x + 2.6, y]), lockW(1, 0.6, 0.4, 0.1), P.hairLt, 3));
  }

  // Back arm and its long frosted sleeve.
  const shB = pt(-3, -12.2);
  const handB = dead ? [shB[0] + 1, shB[1] + 10] : A && f >= 1 && f <= 2 ? [shB[0] + 8, shB[1] + 2] : [shB[0] - 1.5 - drift, shB[1] + 9.5];
  const elB = joint(shB, handB, 6.2, 6.2, -1);
  out.push(...limb(shB, elB.k, elB.f, 2.6, 2.2, 1.8, P.kimonoDk), ...ooval(elB.f[0], elB.f[1], 1.05, 0.95, P.skinDk));
  out.push(...frostSleeve(shB, elB.k, elB.f, P.kimonoDk, shade(P.kimonoDk, -6), -1.8 * drift + Math.sin(ph) * 0.6, 9, P, ph));

  // The kimono: a long column from the shoulders, its hem trailing back into frosty mist.
  {
    const hy = dead ? 62.5 : 61.4;
    const rip = (t) => Math.sin(t * TAU * 1.5 + ph * (walk ? 2 : 1)) * (0.7 + drift * 0.3);
    const hem = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      hem.push([hip[0] + 6.4 - t * 13 + lean * 6, hy - t * 0.6 + rip(t) * 0.6]);
    }
    const tailX = hip[0] - 6.6 + lean * 4 - drift * 4;
    const wisp = [[tailX - 3, hy - 1 + rip(0.8)], [tailX - 7 - drift * 2, hy - 3.6 + rip(1.1) * 1.2], [tailX - 3.4, hy - 4.8 + rip(1.3)], [tailX - 0.6, hy - 6]];
    const body = [pt(-4.4, -12.6), pt(-1, -14.2), pt(1.6, -14.2), pt(4, -12.6), pt(5.2, -10.4), pt(5.2, -8.8), pt(4.4, -7.2), pt(3.5, -5), pt(4.2, 0), pt(5, 6), ...hem, ...wisp, pt(-5.6, 6), pt(-4.6, 0), pt(-4.2, -5), pt(-3.6, -8.6)];
    out.push(...opoly(body, P.kimono));
    // Shade on the back half, and the frost creeping up from the hem.
    out.push(fpoly([pt(-4.4, -12.6), pt(-1.6, -13.6), pt(-1.8, 6), hem[6], hem[8], ...wisp, pt(-5.6, 6), pt(-4.6, 0), pt(-4.2, -5), pt(-3.6, -8.6)], P.kimonoDk));
    out.push(fpoly([...hem, ...wisp.slice(0, 3), ...hem.slice().reverse().map(([x, y]) => [x, y - 3.2 - Math.sin(x * 1.3) * 0.7])], P.iceLt));
    out.push(fband(hem, 0.7, P.ice, 1));
    // The front overlap of the kimono and a few snowflake motifs.
    out.push(line([pt(3.2, -6), pt(3.4, 2), [hem[1][0] - 1, hem[1][1] - 0.4]], 0.5, P.kimonoDk, 1));
    for (const [x, y, r] of [[1, 3, 1.1], [-2.2, 9, 1.3], [2.4, 12.5, 1]]) out.push(...within(T0, () => snowflake(x, y, r, P.ice)));
  }

  // Collar (crossed, with an icy under-collar) and the wide obi with its cord and crystal.
  within(T0, () => {
    out.push(fband(arcPts(3.2, -8.6, 2, 1.5, 40, 150, 6), 0.4, P.kimonoDk, 1), dot(4.3, -10.4, 0.7, '#ffffff', 0.45));
    out.push(...oband([[1.6, -14.2], [2.2, -11], [1.4, -7.8]], 1.3, P.ice, 2), ...oband([[-0.6, -14.2], [1.4, -10.4], [3.8, -7.6]], 1.3, P.kimono, 2));
    out.push(...opoly([[-4.8, -7.8], [4.4, -7.8], [4.2, -3.4], [-5, -3.4]], P.obi), fpoly([[-4.8, -7.8], [-1.2, -7.8], [-1.4, -3.4], [-5, -3.4]], P.obiDk), line([[-4.8, -5.6], [4.3, -5.6]], 0.7, P.silver));
    out.push(...gem(3.2, -5.6, 1, P.ice));
  });

  // Neck and head.
  out.push(...oband([[neck[0], neck[1] + 1.4], [hc[0] + 0.2, hc[1] + 6]], 2.6, P.skin, 1), fband([[hc[0] - 0.6, hc[1] + 6.8], [hc[0] + 1.2, hc[1] + 6.4]], 1.1, P.skinDk, 1));
  within(at(hc[0], hc[1], tilt), () => {
    out.push(...backHair(P.hairDk));
    out.push(...skull(P));
    out.push(...features(mood, YUKI_FACE));
    // Hime cut: a straight fringe and chin-length side locks, with a blue sheen.
    out.push(...fringe(P.hair, P.hairLt, [[-5.2, -5.6, -5.8, 0.4, 3.2, 0], [-2.2, -6.8, -2.4, -0.2, 3.4, 0.1], [1, -7, 1.1, -0.4, 3.6, 0.2], [4, -6.2, 4.3, -0.6, 3.4, 0.2], [6.4, -4.2, 6.8, -0.4, 2.6, 0.1]]));
    out.push(...brows(mood, YUKI_FACE));
    for (const [x, sx] of [[6.9, 1], [-6.6, -1]]) {
      const sl = [[x, -2.4], [x + sx * 0.5, 2.6 + Math.sin(ph) * 0.2], [x + sx * 0.3 + (walk ? -0.4 : 0), 8.6]];
      out.push(...oband(sl, (t) => (t < 0.8 ? 2.5 : lerp(2.5, 0.8, (t - 0.8) / 0.2)), sx > 0 ? P.hair : P.hairDk, 3));
      if (sx > 0) out.push(fband(sl.map(([xx, yy]) => [xx + 0.3, yy]).slice(0, 2), taperW(0.6, 0.3), P.hairLt, 2));
    }
    // A silver hairpin crowned with a snowflake.
    out.push(...oband([[-2.6, -5.4], [-6.4, -8.4]], 0.6, P.silver, 1, 0.35), ...snowflake(-6.6, -8.6, 1.7, P.ice), dot(-6.6, -8.6, 0.5, '#ffffff'));
    // Frost on her breath when angry.
    if (angry && !A) out.push(dot(5.4, 6.8, 0.8, P.breath), dot(6.8, 6.2, 0.6, P.breath));
  });

  // Front arm: the hand lifted gracefully to her breast, sleeve hanging long and frosted.
  const shF = pt(3, -12.2);
  let handF;
  if (dead) handF = [shF[0] + 3, shF[1] + 10];
  else if (A) handF = [[hc[0] + 5.8, hc[1] + 9.4], [shF[0] + 10.5, shF[1] + 0.5], [shF[0] + 11, shF[1] + 4.5], [shF[0] + 6, shF[1] + 6]][f];
  else if (hurt) handF = [shF[0] + 3, shF[1] + 1];
  else handF = [shF[0] + 5.4, shF[1] + 5.4 + Math.sin(ph) * 0.3];
  const elF = joint(shF, handF, 6.2, 6.2, -1);
  out.push(...limb(shF, elF.k, elF.f, 2.8, 2.4, 2, P.kimono));
  out.push(...frostSleeve(shF, elF.k, elF.f, P.kimono, P.kimonoDk, (A ? [0, -3.6, -2.6, -1][f] : -1.6 * drift) + Math.sin(ph) * 0.6, 10, P, ph));
  // Her hand droops from the sleeve, a ghost's limp wrist.
  if (!A || f === 0) out.push(...ooval(elF.f[0] + 0.9, elF.f[1] + 0.9, 0.85, 1.45, P.skin, -0.5));
  else out.push(...ooval(elF.f[0] + 0.5, elF.f[1], 1.15, 1, P.skin));

  // Snow drifting down around her; the attack's breath of frost.
  if (!dead) {
    for (let i = 0; i < 4; i++) {
      const u = (rnd(i) + f / n) % 1;
      const x = 10 + rnd(i + 7) * 44 + Math.sin(u * TAU + i) * 2;
      const y = 14 + u * 42;
      out.push(sparkle(x, y, 0.8 + rnd(i + 3) * 0.4, P.iceLt));
    }
    if (A) {
      const m = within(at(hc[0], hc[1], tilt), () => X(2.6, 6.1));
      if (f === 0) {
        for (let k = 0; k < 3; k++) out.push(dot(m[0] + 4 + k * 2.2, m[1] - 1 + k * 0.8, 0.6 - k * 0.12, P.ice));
      } else {
        // Three streams of freezing breath fanning out, with shards and flakes riding them.
        const reach = [0, 29, 31, 24][f];
        const spread = [0, 4, 6.5, 5][f];
        for (let k = -1; k <= 1; k++) {
          const pts = [[m[0] + 0.8, m[1] + 0.2], [m[0] + reach * 0.45, m[1] + k * spread * 0.45 + Math.sin(f + k) * 0.6], [Math.min(63, m[0] + reach * (k ? 0.9 : 1)), m[1] + k * spread]];
          out.push(...oband(pts, (t) => (k ? 1.6 : 2.6) * Math.sin(Math.PI * clamp(t * 1.1, 0, 1)) ** 0.6 + 0.3, f === 3 ? P.iceLt : P.breath, 3, 0.4));
          if (!k) out.push(fband(pts, (t) => 0.9 * Math.sin(Math.PI * t), '#ffffff', 3));
        }
        for (let k = 0; k < 4; k++) {
          const sx = m[0] + 8 + k * (reach / 5);
          const sy = m[1] + Math.sin(k * 2.1 + f) * spread * 0.7;
          if (k % 2) out.push(sparkle(sx, sy, 1.5, '#ffffff'));
          else out.push(...opoly([[sx - 1.6, sy], [sx, sy - 0.8], [sx + 2.4, sy], [sx, sy + 0.8]], P.ice, 0.4));
        }
      }
    }
  }
  return { w: W, h: H, res: 3, shapes: out };
}

// A furisode sleeve that ends in frost: an icy hem with icicles hanging from it.
function frostSleeve(sh, e, h, c, cDk, sw, drop, P, ph) {
  const out = sleeve(sh, e, h, c, cDk, sw, drop, P.ice);
  const low = Math.max(e[1], h[1]);
  const fx = Math.max(h[0], e[0] + 1);
  const a = [fx - 0.6 + sw * 0.25, low + drop * 0.8];
  const b = [lerp(fx, e[0], 0.5) - 0.6 + sw * 0.6, low + drop + 0.4];
  const c2 = [e[0] - 2.8 + sw, low + drop * 0.65];
  for (const [p, q, l] of [[a, b, 1.8], [b, c2, 2.6]]) {
    for (const t of [0.3, 0.7]) {
      const x = lerp(p[0], q[0], t);
      const y = lerp(p[1], q[1], t);
      out.push(...opoly([[x - 0.6, y - 0.3], [x + 0.6, y - 0.3], [x - 0.1 + Math.sin(ph) * 0.2, y + l * (t > 0.5 ? 0.8 : 1.1)]], P.iceLt, 0.4));
    }
  }
  return out;
}

// ---------- Nekomata ----------

const NK = {
  skin: '#fff0e8', skinDk: '#f2d3cc', fur: '#bba8e8', furDk: '#8d7ac6', furLt: '#e4dbff', tip: '#fff8ff', earIn: '#ffc6dc',
  leather: '#5c4680', leatherDk: '#44345f', leatherLt: '#7f68a8', scarf: '#ff7fa0', scarfDk: '#d95f82', belt: '#b47c54', beltDk: '#87593a', gold: '#ffd36b',
  blade: '#eef4ff', bladeDk: '#a7b4d8', stocking: '#433a63', stockingLt: '#5f5486', slash: '#ffe2f0',
};
const CAT_FACE = {
  eye: { rx: 2.0, up: 2.05, dn: 1.45, inY: 0.3, outY: -0.6, pupil: 'slit', iris: '#ffd23f', hot: '#ffa62b', lash: '#2a2035', flicks: 1, lower: false, irisW: 0.72, iris2: 1.02, th: 0.7 },
  brow: '#7c6ab4', nose: '#efb8b0', lip: '#d85c7a', fangs: true, fangIdle: true,
};

function nekomata(pose, f, mood) {
  const P = fade(NK, mood);
  const walk = pose === 'walk';
  const atk = pose === 'attack';
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry' || atk;
  const n = walk ? 8 : atk ? 4 : 6;
  const ph = (f / n) * TAU;
  const p = f / n;
  // A low, sly prowl: long silent strides, shoulders rolling, head held level and steady.
  const STR = 9;
  let hip = [31, 45];
  let lean = 0.08;
  let tilt = -0.04;
  let feet;
  let lift = 1.8;
  if (walk) {
    hip[1] += -0.7 * (0.5 - 0.5 * Math.cos(4 * Math.PI * p));
    hip[0] += Math.sin(ph * 2) * 0.3;
    lean = 0.2;
    tilt = -0.16;
    feet = [0, 0.5].map((o) => gait(p + o, STR, 2.6));
  } else {
    hip[1] += Math.sin(ph) * 0.4;
    feet = [[-3.4, 0], [3.4, 0]];
  }
  // Attack: 0 coils low, 1 leaps with a cross slash, 2 lands slashing through, 3 recovers.
  const A = atk ? [[-1, 50, 0.38, -0.26], [5, 36, 0.22, -0.1], [5, 45.5, 0.32, -0.2], [3, 45, 0.14, -0.08]][f] : null;
  if (A) {
    hip = [hip[0] + A[0], A[1]];
    lean = A[2];
    tilt = A[3];
    feet = [[[-6, 0], [5, 0]], [[-5, -8], [-0.6, -6.4]], [[-6.5, 0], [4.5, 0]], [[-5, 0], [4, 0]]][f];
    lift = 0;
  }
  if (hurt) {
    lean = -0.12;
    tilt = -0.2;
    hip[0] -= 1;
  }
  if (dead) {
    hip = [29, 57.4];
    lean = 0.45;
    tilt = 0.55;
    feet = [[-9, 0], [-7, 0]];
  }
  const out = [];
  const T0 = at(hip[0], hip[1], lean);
  const pt = (x, y) => within(T0, () => X(x, y));
  const neck = pt(1, -14.2);
  const hc = [neck[0] + 0.6 + Math.sin(lean + tilt) * 7, neck[1] - 7.6];
  const sw = walk ? Math.sin(ph) : Math.sin(ph) * 0.4;

  // Twin tails: two long S-curves swishing out of step with each other.
  const tb = pt(-4, -0.6);
  for (let i = 0; i < 2; i++) {
    const a0 = (dead ? -3.4 : angry ? -2.35 : -2.75) + i * 0.42;
    const pts = flowPts(tb, a0, dead ? 0.6 : 2.2 - i * 0.4, dead ? 15 : 22, ph - i * 1.4, walk ? 0.5 : 0.35, 7, 0.75);
    out.push(...oband(pts, lockW(3.4, 0.7, 0.3, 0.4), i ? P.fur : P.furLt, 3));
    const sp = spline(pts, 3);
    out.push(fband(sp.slice(-6), (t) => lerp(2.2, 0.4, t), P.tip, 1));
  }

  // The scarf's long tails streaming back from her neck.
  for (let i = 0; i < 2; i++) {
    const r = pt(-1.2, -13.4);
    const pts = flowPts(r, Math.PI - 0.15 + (walk ? 0 : 0.75) + i * 0.3 + (dead ? 1 : 0), walk ? 0.25 : -0.4, 16 - i * 4, ph * 2 - i - 1, 0.35, 5, 1);
    out.push(...oband(pts, taperW(2.6, 1.8), i ? P.scarfDk : P.scarf, 3), line([pts[pts.length - 1], [pts[pts.length - 1][0] - 0.6, pts[pts.length - 1][1] + 1.2]], 0.5, P.gold));
  }

  // Back arm with its paw-glove and dagger.
  const shB = pt(-2.8, -12.2);
  let handB;
  if (dead) handB = [shB[0] + 1, shB[1] + 10];
  else if (A) handB = [[shB[0] - 6, shB[1] + 1.5], [shB[0] + 11, shB[1] - 2], [shB[0] + 9, shB[1] + 6], [shB[0] + 6, shB[1] + 5]][f];
  else if (walk) handB = [shB[0] + 2 - sw * 3, shB[1] + 8];
  else handB = [shB[0] + 4.4, shB[1] + 6.6 + Math.sin(ph) * 0.4];
  const elB = joint(shB, handB, 5.8, 5.8, -1);
  out.push(...dagger(elB.f, A ? [0.4, -0.5, 1.3, 1.6][f] : 1.9 + sw * 0.2, P, true));
  out.push(...limb(shB, elB.k, elB.f, 2.2, 2.6, 2.6, P.skinDk, P.furDk), ...pawHand(elB.f, P, true));

  // Legs: dark thigh-high stockings in soft boots with fur cuffs.
  const legs = [];
  for (const i of [0, 1]) {
    const a = [hip[0] + feet[i][0] + (A && f === 1 ? 0 : 0), (dead ? 63 : A && f === 1 ? hip[1] + 15 + feet[i][1] * 0.2 : GY - 1.2) + (A && f === 1 ? 0 : feet[i][1])];
    if (A && f === 1) a[0] = hip[0] + feet[i][0];
    const h0 = pt(i ? 1.4 : -1.6, 0.4);
    legs.push({ h0, kn: joint(h0, a, 10, 10.2, 1) });
  }
  const leg = ({ h0, kn }, back) => {
    const c = back ? shade(P.stocking, -6) : P.stocking;
    const r = [...limb(h0, kn.k, kn.f, 4, 2.8, 2, c)];
    const a = kn.f;
    const ang = Math.atan2(a[1] - kn.k[1], a[0] - kn.k[0]);
    const cuff = [kn.k[0] + Math.cos(ang) * 4.6, kn.k[1] + Math.sin(ang) * 4.6];
    r.push(...oband([cuff, a], taperW(2.8, 2.4), back ? P.leatherDk : P.leather, 1));
    r.push(...opoly([[a[0] - 1.6, a[1] - 1], [a[0] + 1.2, a[1] - 1.4], [a[0] + 3.4, a[1] + 0.2], [a[0] + 3.2, a[1] + 1.1], [a[0] - 1.7, a[1] + 1.1]], back ? P.leatherDk : P.leather));
    r.push(...ooval(cuff[0], cuff[1], 2.2, 1.2, back ? P.furDk : P.fur, ang + Math.PI / 2));
    r.push(line([[kn.k[0] + 0.4, kn.k[1] - 0.6], [kn.k[0] + 1, kn.k[1] + 0.8]], 0.4, P.stockingLt));
    return r;
  };
  out.push(...leg(legs[0], true));

  // Torso: cropped leather top with gold buckles, bare midriff, belted shorts with pouches.
  within(T0, () => {
    out.push(...opoly(TORSO.slice(0, 7).concat([[2.8, -4.2], [3.7, -1.2], [3.6, 1.4], [-4.2, 1.4], [-4.7, -1.2], [-3.3, -4.6], [-3.9, -8.8], [-4.4, -12.4]]), P.skin));
    out.push(fpoly([[-3.3, -4.6], [-1.6, -4.6], [-1.6, -7.2], [-3.6, -7.2]], P.skinDk), dot(1.4, -5, 0.3, P.skinDk));
    out.push(...opoly([[-4.4, -12.4], [-0.6, -14.2], [1.4, -14.2], [3.8, -12.8], [5, -10.6], [5.3, -9], [4.6, -7.4], [-3.6, -7.2], [-3.9, -8.8]], P.leather));
    out.push(fpoly([[-4.4, -12.4], [-1.8, -13.6], [-1.4, -7.3], [-3.6, -7.2], [-3.9, -8.8]], P.leatherDk), fband(arcPts(3.3, -8.8, 2, 1.4, 30, 150, 6), 0.4, P.leatherDk, 1), dot(4.2, -10.3, 0.7, P.leatherLt, 0.4));
    out.push(line([[-3.8, -7.6], [4.4, -7.8]], 0.6, P.gold), ...gem(1.2, -10.4, 0.7, P.scarf));
    // Shorts and belt.
    out.push(...opoly([[-4.6, -4.4], [3, -4.4], [4, -0.2], [4.6, 2.8], [0.4, 3.4], [-0.2, 1.2], [-1.2, 3.2], [-5.2, 2.8], [-5, -0.6]], P.leatherDk));
    out.push(...opoly([[-4.8, -4.8], [3.2, -4.8], [3.4, -3.2], [-4.9, -3.2]], P.belt), ...opoly([[0.6, -5], [2, -5], [2, -3], [0.6, -3]], P.gold, 0.35));
    out.push(...opoly([[-5.8, -3.4], [-3, -3.4], [-3, -0.4], [-5.6, -0.6]], P.belt), line([[-5.8, -2.4], [-3, -2.4]], 0.4, P.beltDk), dot(-4.4, -1.6, 0.4, P.gold));
  });

  // The scarf wrapped at her throat.
  within(T0, () => out.push(...opoly([[-2.4, -15.4], [2.6, -15.6], [3.4, -13], [-2.6, -12.8]], P.scarf), fpoly([[-2.4, -15.4], [-0.6, -15.4], [-0.6, -12.9], [-2.6, -12.8]], P.scarfDk), ...ooval(-2.2, -13.6, 1.4, 1.2, P.scarfDk)));
  out.push(...leg(legs[1], false));

  // Head: cat ears, a messy bob, fur tufts at the cheeks.
  within(at(hc[0], hc[1], tilt), () => {
    const earT = walk ? Math.sin(ph * 2) * 0.06 : f === 2 && pose === 'idle' ? -0.22 : 0;
    const earFlat = angry ? 0.45 : hurt || dead ? 0.7 : 0;
    within(at(-3.6, -5.2, -0.42 - earFlat - earT), () => out.push(...opoly([[-3, 0.8], [-0.6, -6.2], [0.4, -6.4], [3, 0.6]], P.furDk), fpoly([[-1.4, 0.2], [-0.2, -4.2], [1.4, 0.2]], shade(P.earIn, -8))));
    out.push(...backHair(P.furDk, 8.4));
    out.push(...skull(P));
    // Fur tufts on the cheeks.
    out.push(...opoly([[6, 2.6], [8.6, 3.8], [6.8, 4.6], [8.2, 6], [5.6, 6]], P.fur, 0.4), ...opoly([[-6.4, 2], [-9, 3.4], [-7, 4.4], [-8.6, 5.8], [-5.6, 5.6]], P.furDk, 0.4));
    out.push(...features(mood, CAT_FACE));
    if (mood !== 'dead') out.push(line([[6.6, 4.6], [8.4, 4.2]], 0.3, '#d9a9b9'), line([[6.6, 5.4], [8.4, 5.6]], 0.3, '#d9a9b9'));
    out.push(...fringe(P.fur, P.furLt, [[-5.6, -5.2, -6.8, 1.6, 3, -0.8], [-2.6, -6.8, -3.4, -0.2, 3, -0.4], [0.4, -7, 0.4, 0.2, 3.4, 0.4], [3.4, -6.4, 4.2, -0.8, 3, 0.8], [5.8, -4.8, 7.2, 0.8, 2.6, 0.6]]));
    out.push(...brows(mood, CAT_FACE));
    out.push(...oband([[6.6, -2], [7.6, 2.4], [6.8, 5.6]], lockW(2.4, 1, 0.3, 0.1), P.fur, 3));
    within(at(2.6, -6, 0.32 + earFlat + earT), () => out.push(...opoly([[-3.2, 0.8], [-0.4, -6.8], [0.6, -7], [3, 0.6]], P.fur), fpoly([[-1.8, 0.2], [-0.1, -4.8], [1.6, 0.2]], P.earIn), fband([[-0.4, -0.2], [0.2, -3.6]], taperW(1.2, 0.2), P.tip, 1), ...ooval(-1.8, -0.6, 0.7, 0.7, P.gold)));
  });

  // Front arm.
  const shF = pt(3.2, -12);
  let handF;
  if (dead) handF = [shF[0] + 2, shF[1] + 10];
  else if (A) handF = [[shF[0] - 6, shF[1] - 2.5], [shF[0] + 10.5, shF[1] + 4], [shF[0] + 11, shF[1] + 0], [shF[0] + 7.5, shF[1] + 4]][f];
  else if (hurt) handF = [shF[0] + 3.4, shF[1] + 2];
  else if (walk) handF = [shF[0] + 3 + sw * 3, shF[1] + 7.6];
  else handF = [shF[0] + 6, shF[1] + 5.2 + Math.sin(ph - 0.4) * 0.4 - (angry ? 1.6 : 0)];
  const elF = joint(shF, handF, 5.8, 5.8, -1);
  out.push(...limb(shF, elF.k, elF.f, 2.4, 2.8, 2.8, P.skin, P.fur), ...pawHand(elF.f, P, false));
  out.push(...dagger(elF.f, A ? [-0.9, 0.7, -0.2, 1.3][f] : 1.6 - sw * 0.2 - (angry ? 0.3 : 0), P, false));

  // Slash arcs on the attack.
  if (A && f >= 1) {
    const cx = hip[0] + 17;
    const cy = hip[1] - 11 + (f === 2 ? 3 : 0);
    const k = f === 3 ? 0.55 : 1;
    for (const [a0, a1, r] of [[-70, 60, 8.5], [-40, 95, 6.5]]) {
      const pts = arcPts(cx - 4, cy, r, r * 1.1, a0 + (f - 1) * 25, a1 + (f - 1) * 25, 10);
      out.push(...oband(pts, (t) => 2.6 * k * Math.sin(Math.PI * t) ** 0.6, P.slash, 2, 0.4), fband(pts, (t) => 1 * k * Math.sin(Math.PI * t), '#ffffff', 2));
    }
    if (f === 1) out.push(sparkle(cx + 6, cy - 7, 1.8, '#ffffff'), sparkle(cx + 3, cy + 8, 1.2, P.slash));
  }
  return { w: W, h: H, res: 3, shapes: out };
}

// A furry paw glove: a fluffy cuff, padded fist, little white claws.
function pawHand(h, P, back) {
  const c = back ? P.furDk : P.fur;
  return [...ooval(h[0] + 0.4, h[1], 1.7, 1.5, c), dot(h[0] + 1, h[1] + 0.4, 0.55, P.earIn), F(T([X(h[0] + 1.6, h[1] - 1), X(h[0] + 2.8, h[1] - 0.5), X(h[0] + 1.8, h[1] - 0.2)], '#ffffff')), F(T([X(h[0] + 1.8, h[1] + 0.2), X(h[0] + 3, h[1] + 0.7), X(h[0] + 1.9, h[1] + 0.9)], '#ffffff'))];
}

// A curved dagger held in the fist; `a` is the blade's angle (PI/2 points down: reverse grip).
function dagger(h, a, P, back) {
  const d = [Math.cos(a), Math.sin(a)];
  const nm = [-d[1], d[0]];
  const b = [h[0] + 0.4, h[1]];
  const pts = [[b[0] + nm[0] * 1, b[1] + nm[1] * 1], [b[0] + d[0] * 4 + nm[0] * 1.1, b[1] + d[1] * 4 + nm[1] * 1.1], [b[0] + d[0] * 7.4 + nm[0] * 0.2, b[1] + d[1] * 7.4 + nm[1] * 0.2], [b[0] + d[0] * 4 - nm[0] * 0.6, b[1] + d[1] * 4 - nm[1] * 0.6], [b[0] - nm[0] * 0.8, b[1] - nm[1] * 0.8]];
  return [
    ...opoly(pts, back ? P.bladeDk : P.blade, 0.45),
    fpoly([pts[0], pts[1], pts[2], [b[0] + d[0] * 3, b[1] + d[1] * 3]], back ? shade(P.bladeDk, -8) : P.bladeDk),
    line([[b[0] - d[0] * 0.4 + nm[0] * 1.8, b[1] - d[1] * 0.4 + nm[1] * 1.8], [b[0] - d[0] * 0.4 - nm[0] * 1.8, b[1] - d[1] * 0.4 - nm[1] * 1.8]], 0.8, P.gold),
    line([[b[0] - d[0] * 0.6, b[1] - d[1] * 0.6], [b[0] - d[0] * 2.4, b[1] - d[1] * 2.4]], 0.9, P.leatherDk),
    dot(b[0] - d[0] * 2.8, b[1] - d[1] * 2.8, 0.6, P.scarf),
  ];
}

// ---------- Lamia ----------

const LA = {
  skin: '#ffe0c6', skinDk: '#f1c3a6', hair: '#2f8483', hairDk: '#1f6266', hairLt: '#6fc8bb', scale: '#56c39a', scaleDk: '#2e9877', scaleLt: '#a2ecc6', belly: '#fff0c6', bellyDk: '#ead098',
  pattern: '#25806a', gold: '#ffd36b', goldDk: '#d39a42', gem: '#5fd8e6', gem2: '#ff7fb0', veil: '#ffd2ea', veilDk: '#f3a9cf', veilLt: '#fff0f8', strike: '#fff2c8',
};
const SNAKE_FACE = {
  eye: { rx: 1.9, up: 1.45, dn: 1.15, inY: 0.3, outY: -0.65, lid: 0.32, pupil: 'slit', iris: '#ffcf4a', hot: '#ff6fb4', lash: '#2a2035', liner: '#a06ad6', flicks: 2, lower: false, irisW: 0.74, iris2: 1 },
  brow: '#1f6266', nose: '#e5b29a', lip: '#d4507a', blush: '#ffb0b8',
};

// The serpent tail along a path: scaled back with a diamond pattern, a pale banded belly.
function snakeTail(ctrl, wf, P) {
  const out = [...oband(ctrl, wf, P.scale, 5)];
  const sp = spline(ctrl, 5).map(([x, y]) => X(x, y));
  const m = sp.length;
  const wfn = (t) => wf(t);
  const side = (i, k) => {
    const a = sp[Math.max(0, i - 1)];
    const b = sp[Math.min(m - 1, i + 1)];
    let nx = -(b[1] - a[1]);
    let ny = b[0] - a[0];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    if (nx * 0.7 + ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    const w = wfn(i / (m - 1)) / 2;
    return [sp[i][0] + nx * w * k, sp[i][1] + ny * w * k];
  };
  // Belly band along the underside, crossed by scale lines.
  const inner = [];
  const outer = [];
  for (let i = 0; i < m; i++) {
    inner.push(side(i, 0.25));
    outer.push(side(i, 0.98));
  }
  out.push(F(T([...inner, ...outer.reverse()], P.belly)));
  outer.reverse();
  for (let i = 2; i < m - 2; i += 2) out.push(F(T([inner[i], outer[i], outer[i + 1], inner[i + 1]].map((q, k) => (k < 2 ? q : q)), P.bellyDk)), line([inner[i], outer[i]], 0.3, P.bellyDk));
  // Shadowed back edge, lit ridge, and the diamond pattern.
  for (let i = 3; i < m - 3; i += 3) {
    const c = side(i, -0.25);
    const t = i / (m - 1);
    const r = Math.max(0.5, wfn(t) * 0.2);
    out.push(F(T([[c[0], c[1] - r * 1.3], [c[0] + r, c[1]], [c[0], c[1] + r * 1.3], [c[0] - r, c[1]]], P.pattern)), F(E(c[0], c[1], r * 0.35, r * 0.35, P.gold)));
  }
  const ridge = [];
  for (let i = 1; i < m - 2; i++) ridge.push(side(i, -0.62));
  if (ridge.length > 2) out.push(F(T(bandPtsRaw(ridge, (t) => 0.7 * Math.sin(Math.PI * t)), P.scaleLt)));
  return out;
}
// A band through already-transformed points.
function bandPtsRaw(p, wf) {
  const L = [];
  const Rr = [];
  const m = p.length;
  for (let i = 0; i < m; i++) {
    const a = p[Math.max(0, i - 1)];
    const b = p[Math.min(m - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const w = wf(i / (m - 1)) / 2;
    L.push([p[i][0] - ((b[1] - a[1]) / l) * w, p[i][1] + ((b[0] - a[0]) / l) * w]);
    Rr.push([p[i][0] + ((b[1] - a[1]) / l) * w, p[i][1] - ((b[0] - a[0]) / l) * w]);
  }
  return [...L, ...Rr.reverse()];
}

function lamia(pose, f, mood) {
  const P = fade(LA, mood);
  const walk = pose === 'walk';
  const atk = pose === 'attack';
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry' || atk;
  const n = walk ? 8 : atk ? 4 : 6;
  const ph = (f / n) * TAU;
  // Slithering: waves run back along the tail while the upper body sways like a dancer's.
  const sway = walk ? Math.sin(ph) : Math.sin(ph) * 0.8;
  let hip = [31 + sway * 0.8, 41.4 + (walk ? Math.cos(ph * 2) * 0.4 : Math.sin(ph * 2) * 0.3)];
  let lean = walk ? 0.06 + sway * 0.03 : sway * 0.05;
  let tilt = -sway * 0.06;
  const A = atk ? [[-2, -0.18], [3, 0.16], [2, 0.1], [0.6, 0.03]][f] : null;
  if (A) {
    hip[0] += A[0];
    lean = A[1];
    tilt = A[1] * -0.3;
  }
  if (hurt) {
    lean = -0.18;
    tilt = -0.2;
    hip[0] -= 1;
  }
  if (dead) {
    hip = [31, 54];
    lean = 0.5;
    tilt = 0.5;
  }
  const out = [];
  const T0 = at(hip[0], hip[1], lean);
  const pt = (x, y) => within(T0, () => X(x, y));
  const neck = pt(1, -14.2);
  const hc = [neck[0] + 0.6 + Math.sin(lean + tilt) * 7, neck[1] - 7.6];

  // Long wavy hair down her back.
  for (let i = 0; i < 3; i++) {
    const root = [hc[0] - 4 - i * 1.2, hc[1] - 2 + i * 2.6];
    const pts = flowPts(root, Math.PI / 2 + 0.3 + i * 0.15 + (dead ? -1.6 : 0), 0.2, dead ? 12 : 20 - i * 2, ph * (walk ? 1 : 1) - i * 0.6, 0.45, 6, 1.4);
    out.push(...oband(pts, lockW(6.4 - i, 0.9, 0.25, 0.08), i === 1 ? P.hair : P.hairDk, 4));
    out.push(fband(pts.slice(1, 5).map(([x, y]) => [x + 1, y]), lockW(1, 1, 0.3, 0.1), P.hairLt, 3));
  }

  // The serpent tail: from her hips down to the ground and coiled back, its tip curling up.
  {
    const h0 = pt(-0.4, 1.2);
    const h1 = pt(1.4, 6);
    const bx = hip[0];
    let ctrl;
    if (dead) ctrl = [h0, [bx - 4, 60], [bx - 12, 62], [bx - 20, 61.6], [bx - 26, 59], [bx - 26, 55]];
    else if (A && f === 0) ctrl = [h0, h1, [bx - 1, 57], [bx - 8, 61.6], [bx - 15, 60], [bx - 19, 52], [bx - 18, 42], [bx - 14, 36]];
    else if (A && f === 1) ctrl = [h0, h1, [bx - 1, 57], [bx - 6, 61.6], [bx + 4, 62], [bx + 14, 61], [bx + 22, 58], [bx + 28, 53]];
    else if (A && f === 2) ctrl = [h0, h1, [bx - 1, 57], [bx - 6, 61.6], [bx + 4, 62], [bx + 13, 61], [bx + 20, 57], [bx + 19, 51]];
    else {
      const amp = walk ? 1.8 : 0.7;
      const hump = (i) => -amp * Math.max(0, Math.sin(ph * (walk ? 1 : 1) - i * 1.5)) * (walk ? 1 : 0.6);
      ctrl = [h0, h1, [bx - 0.5 + sway * 0.3, 56.5], [bx - 7, 61.6 + hump(1)], [bx - 14, 61.4 + hump(2)], [bx - 20, 59.6 + hump(3) * 0.6], [bx - 22.5, 55 + Math.sin(ph - 2) * 0.8], [bx - 20.5 + Math.sin(ph - 2.6) * 0.8, 50.8]];
    }
    out.push(...snakeTail(ctrl, (t) => (t < 0.3 ? lerp(9, 7, t / 0.3) : lerp(7, 0.8, ((t - 0.3) / 0.7) ** 1.3)), P));
    if (A && f === 1) for (let k = 0; k < 2; k++) out.push(...oband(arcPts(bx + 16, 64, 14 - k * 4, 12 - k * 3, 215, 290, 6), (t) => 1.2 * Math.sin(Math.PI * t), P.strike, 2, 0.35));
  }

  // The veil: a sheer shawl from her raised hand, sweeping behind her back.
  const shB = pt(-3, -12.2);
  let handB;
  if (dead) handB = [shB[0] - 5, shB[1] + 5];
  else if (A) handB = [[shB[0] - 2, shB[1] - 9], [shB[0] + 8, shB[1] - 6], [shB[0] + 6, shB[1] - 8], [shB[0] + 1, shB[1] - 10]][f];
  else handB = [shB[0] + 1.6 + sway * 1.2, shB[1] - 10 + Math.abs(sway) * 0.6];
  const elB = joint(shB, handB, 6, 6, -1);
  {
    const v0 = elB.f;
    const sw = walk ? -2 : 0;
    const pts = [v0, [v0[0] - 4 + sw * 0.5, v0[1] + 3 + Math.sin(ph) * 0.6], [hip[0] - 9 + sw, hip[1] - 6 + Math.sin(ph - 1)], [hip[0] - 12 + sw * 1.5, hip[1] + 1 + Math.sin(ph - 2) * 1.2], [hip[0] - 13 + sw * 2 + Math.sin(ph - 3), hip[1] + 7]];
    out.push(...oband(pts, lockW(2.6, 0.4, 0.35, 0.6), P.veilLt, 4, 0.4), fband(pts.slice(1).map(([x, y]) => [x - 0.5, y + 0.3]), lockW(0.8, 0.4, 0.4, 0.3), P.veil, 4));
    out.push(...ooval(pts[4][0], pts[4][1] + 1.2, 0.7, 0.7, P.gold));
  }
  out.push(...limb(shB, elB.k, elB.f, 2.2, 1.8, 1.4, P.skinDk), ...ooval(elB.f[0], elB.f[1], 1.05, 0.95, P.skinDk));
  out.push(...opoly(bandPtsRaw([lerp2(elB.k, elB.f, 0.55), lerp2(elB.k, elB.f, 0.8)], () => 2.2), P.gold, 0.4));

  // Torso: a jewelled gold bandeau, a hip belt hung with coins, and silk sashes over the scales.
  within(T0, () => {
    out.push(...opoly(TORSO, P.skin));
    out.push(fpoly([[-4.4, -12.4], [-2, -13.8], [-1.8, -1], [-4.7, -1.2], [-3.3, -4.6], [-3.9, -8.8]], P.skinDk), dot(1.6, -4.2, 0.3, P.skinDk));
    out.push(...opoly([[-4, -11.2], [3.9, -11.6], [5.1, -10.4], [5.3, -9], [4.6, -7.6], [-3.7, -7.6], [-3.9, -9.4]], P.gold));
    out.push(fpoly([[-4, -11.2], [-1.6, -11.3], [-1.4, -7.6], [-3.7, -7.6], [-3.9, -9.4]], P.goldDk), fband(arcPts(3.2, -9, 1.9, 1.3, 30, 150, 6), 0.35, P.goldDk, 1));
    out.push(...gem(1.2, -9.4, 0.9, P.gem), dot(4.1, -10.2, 0.6, '#fff6d8', 0.35));
    for (let k = 0; k < 4; k++) out.push(dot(-2.6 + k * 1.9, -7, 0.55, k % 2 ? P.gem2 : P.gold));
    // Hip belt and coins.
    out.push(...opoly([[-5, -1.4], [3.9, -1.6], [4.2, 0.4], [-5.2, 0.6]], P.gold), line([[-5, -0.4], [4, -0.6]], 0.35, P.goldDk));
    for (let k = 0; k < 5; k++) out.push(...ooval(-4 + k * 1.9, 1.6 + Math.sin(ph - k) * 0.15, 0.6, 0.6, P.gold, 0, 0.3));
  });

  // Head: a gold circlet with a teardrop jewel on the brow.
  out.push(...oband([[neck[0], neck[1] + 1.4], [hc[0] + 0.2, hc[1] + 6]], 2.6, P.skin, 1), fband([[hc[0] - 0.6, hc[1] + 6.8], [hc[0] + 1.2, hc[1] + 6.4]], 1.1, P.skinDk, 1));
  within(at(hc[0], hc[1], tilt), () => {
    out.push(...backHair(P.hairDk, 9));
    out.push(...skull(P));
    out.push(...features(mood, SNAKE_FACE));
    out.push(...fringe(P.hair, P.hairLt, [[-5, -5.6, -6.6, 2.4, 3.2, -0.8], [-1.6, -7, -3.4, -0.8, 3.4, -0.6], [2.2, -7, 6.6, -1.4, 3, 1.4], [5.6, -5, 7.4, 3, 2.6, 0.6]]));
    out.push(...brows(mood, SNAKE_FACE));
    out.push(fband(arcPts(0, -0.8, 7.9, 7.6, 196, 320, 8), 0.8, P.gold, 1));
    out.push(...gem(4.2, -5.6, 0.95, angry ? P.gem2 : P.gem));
    const sl = flowPts([6.8, -1], Math.PI / 2 - 0.1, 0.3, 13, ph - 0.4, 0.35, 5, 1.4);
    out.push(...oband(sl, lockW(2.6, 1, 0.3, 0.1), P.hair, 3), fband(sl.slice(0, 4).map(([x, y]) => [x + 0.4, y]), lockW(0.7, 1, 0.3, 0.1), P.hairLt, 2));
    // Earring.
    out.push(line([[-4.6, 4], [-4.6, 6]], 0.35, P.gold), ...gem(-4.6, 6.8, 0.7, P.gem2));
  });

  // Front arm: curved before her like a dancer's, gold bangles at the wrist.
  const shF = pt(3.2, -12);
  let handF;
  if (dead) handF = [shF[0] - 1, shF[1] + 10];
  else if (A) handF = [[shF[0] - 4, shF[1] + 6], [shF[0] + 10, shF[1] + 3], [shF[0] + 9, shF[1] + 6], [shF[0] + 6, shF[1] + 5]][f];
  else if (hurt) handF = [shF[0] + 3, shF[1] + 1];
  else handF = [shF[0] + 6.2 - sway * 0.6, shF[1] + 3.4 + sway * 1.4];
  const elF = joint(shF, handF, 6, 6, -1);
  out.push(...limb(shF, elF.k, elF.f, 2.4, 2, 1.6, P.skin), ...ooval(elF.f[0] + 0.3, elF.f[1] - 0.2, 1.15, 1, P.skin));
  for (const t of [0.72, 0.86]) out.push(...opoly(bandPtsRaw([lerp2(elF.k, elF.f, t - 0.05), lerp2(elF.k, elF.f, t + 0.05)], () => 2.6), P.gold, 0.35));
  out.push(...opoly(bandPtsRaw([lerp2(shF, elF.k, 0.6), lerp2(shF, elF.k, 0.8)], () => 2.8), P.gold, 0.35), ...gem(lerp2(shF, elF.k, 0.7)[0], lerp2(shF, elF.k, 0.7)[1], 0.55, P.gem2));

  // A hypnotic shimmer when she glares.
  if (angry && !dead) {
    const e = within(at(hc[0], hc[1], tilt), () => X(3.3, 1.6));
    out.push(sparkle(e[0] + 2.6, e[1] - 2.4, 1.3, '#fff2a8'));
  }
  return { w: W, h: H, res: 3, shapes: out };
}
const lerp2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];

// ---------- Lupina ----------

const LU = {
  skin: '#fbe5d6', skinDk: '#ecc6b4', hair: '#e8eef8', hairDk: '#b4bfd8', hairLt: '#ffffff', fur: '#dde4f2', furDk: '#a8b2cc', tip: '#ffffff', earIn: '#ffc9d8',
  leather: '#a4714e', leatherDk: '#7a5038', leatherLt: '#cc9a6e', shirt: '#fff4e2', shirtDk: '#e8d6c4', cape: '#5fa07c', capeDk: '#447e5f', capeLt: '#8bc9a2',
  wood: '#8c5c3e', woodLt: '#bb8b5f', string: '#fff7e2', metal: '#dbe3f2', gold: '#ffd36b', fletch: '#ff8fae', legging: '#5a4d6e', streak: '#fff6d8',
};
const WOLF_FACE = {
  eye: { rx: 1.8, up: 1.6, dn: 1.1, inY: 0.5, outY: -0.45, pupil: 'round', iris: '#ffb037', hot: '#ff7a33', lash: '#2a2035', flicks: 1, lower: true, irisW: 0.64, th: 0.7 },
  brow: '#8f9ab8', nose: '#e5b29f', lip: '#cf5a6e', fangs: true, fangIdle: true,
};

function lupina(pose, f, mood) {
  const P = fade(LU, mood);
  const walk = pose === 'walk';
  const atk = pose === 'attack';
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry' || atk;
  const n = walk ? 8 : atk ? 4 : 6;
  const ph = (f / n) * TAU;
  const p = f / n;
  // A confident hunter's stride: long steps, a proud upright back, hips rolling with each step.
  const STR = 10;
  let hip = [31, 43.4];
  let lean = 0;
  let tilt = 0;
  let feet;
  if (walk) {
    hip[1] += -1 * (0.5 - 0.5 * Math.cos(4 * Math.PI * p));
    hip[0] += Math.sin(ph * 2) * 0.2;
    lean = 0.04;
    tilt = Math.sin(ph * 2) * 0.03;
    feet = [0, 0.5].map((o) => gait(p + o, STR, 2.4));
  } else {
    hip[1] += Math.sin(ph) * 0.3;
    feet = [[-3, 0], [3.4, 0]];
    tilt = Math.sin(ph - 1) * 0.03;
  }
  // Attack: 0 full draw, 1 loose, 2 the arrow away, 3 lowering the bow.
  const A = atk ? [[-0.8, -0.05], [-1.4, -0.08], [-1, -0.04], [-0.4, 0]][f] : null;
  if (A) {
    hip[0] += A[0];
    lean = A[1];
    feet = [[-5.4, 0], [4.6, 0]];
    hip[1] += 0.6;
  }
  if (hurt) {
    lean = -0.14;
    tilt = -0.18;
    hip[0] -= 1;
  }
  if (dead) {
    hip = [30, 56.4];
    lean = 0.35;
    tilt = 0.5;
    feet = [[-9, 0], [-6.5, 0]];
  }
  const out = [];
  const T0 = at(hip[0], hip[1], lean);
  const pt = (x, y) => within(T0, () => X(x, y));
  const neck = pt(1, -14.2);
  const hc = [neck[0] + 0.6 + Math.sin(lean + tilt) * 7, neck[1] - 7.6];
  const sw = walk ? Math.sin(ph) : 0;
  const trail = walk ? 1 : 0.3;

  // The cape, flowing behind her and rippling along its hem.
  {
    const top = [pt(-4.6, -13.2), pt(0.4, -14.6)];
    const hy = hip[1] + (dead ? 4 : 11);
    const wave = (k) => Math.sin(ph - k * 1.1) * (0.6 + trail * 0.8);
    const pts = [top[1], top[0], [top[0][0] - 2 - trail * 2, top[0][1] + 6 + wave(0)], [hip[0] - 8 - trail * 3 + wave(1), hip[1] + wave(1) * 0.5], [hip[0] - 9 - trail * 4 + wave(2), hy - 1 + wave(2) * 0.6], [hip[0] - 6 - trail * 3 + wave(2.5), hy + 0.6], [hip[0] - 3 - trail * 2 + wave(3), hy - 0.6], [hip[0] - 1, hy], [pt(-1, 0)[0], pt(-1, 0)[1]]];
    out.push(...opoly(spline(pts, 2), P.cape));
    out.push(fpoly(spline([top[0], pts[2], pts[3], pts[4], pts[5], [hip[0] - 5, hip[1]], pt(-3, -8)], 2), P.capeDk));
    out.push(line([pts[2], [pts[3][0] + 2, pts[3][1] + 2], [pts[5][0] + 1, pts[5][1] - 1]], 0.4, P.capeLt, 1));
  }

  // The big bushy tail, swaying with the stride.
  {
    const tb = pt(-4, -1);
    const a0 = dead ? 2.9 : angry ? -2.7 : 2.5 + sw * 0.12;
    const bend = dead ? 0.1 : angry ? 0.9 : 0.55;
    const pts = flowPts(tb, a0, bend, dead ? 13 : 16, ph * (walk ? 1 : 1) - 0.5, walk ? 0.35 : 0.22, 4, 0.8);
    out.push(...fluffTail(pts, 7.6, P.fur, P.tip, { tipAt: 0.7 }));
  }

  // The quiver on her back, arrows fletched in pink.
  {
    const q0 = pt(-4.6, -14.6);
    const q1 = pt(-2.6, -3.4);
    for (let k = 0; k < 3; k++) out.push(...oband([[q0[0] - 0.6 + k * 1.1, q0[1] + 1], [q0[0] - 1.6 + k * 1, q0[1] - 3]], taperW(1.2, 0.6), k % 2 ? P.string : P.fletch, 1, 0.35));
    out.push(...oband([q0, q1], taperW(3.4, 3), P.leatherDk, 1), line([lerp2(q0, q1, 0.2), lerp2(q0, q1, 0.25)].map(([x, y]) => [x, y]), 3.2, P.gold));
  }

  // Back arm: holds the longbow (down at her side, or raised for the shot).
  const shB = pt(-2.8, -12.2);
  let handB;
  if (dead) handB = [shB[0] - 1, shB[1] + 10];
  else if (A) handB = [[shB[0] + 12.6, shB[1] + 0.6], [shB[0] + 12.6, shB[1] + 0.6], [shB[0] + 12.4, shB[1] + 1], [shB[0] + 9, shB[1] + 6]][f];
  else if (walk) handB = [shB[0] + 2.6 - sw * 3.4, shB[1] + 9.6];
  else handB = [shB[0] + 2.2, shB[1] + 9.8 + Math.sin(ph) * 0.3];
  const elB = joint(shB, handB, 6.4, 6.4, -1);
  // The draw hand's position (front arm) is needed for the string.
  const shF = pt(3.4, -12);
  const cheek = within(at(hc[0], hc[1], tilt), () => X(3.6, 5.8));
  let handF;
  if (dead) handF = [shF[0] + 2, shF[1] + 10];
  else if (A) handF = [[cheek[0] - 1.6, cheek[1] + 0.4], [shF[0] - 6.5, shF[1] - 1.5], [shF[0] - 6, shF[1] + 1.5], [shF[0] + 2, shF[1] + 8]][f];
  else if (hurt) handF = [shF[0] + 3, shF[1] + 1.5];
  else if (walk) handF = [shF[0] + 0.8 + sw * 3.6, shF[1] + 9.2];
  else handF = [shF[0] + 3.8, shF[1] + 8.2 + Math.sin(ph - 0.4) * 0.3];
  const bowA = dead ? 0.1 : A ? [-Math.PI / 2, -Math.PI / 2, -Math.PI / 2 + 0.05, -1.4][f] : -1.74 - sw * 0.1;
  const drawn = A && f === 0 ? [handF[0] + 0.6, handF[1]] : null;
  const bow = (h) => longbow(h, bowA, drawn, P, A && f === 1);
  if (dead) out.push(...bow([elB.f[0], 62.6]));
  out.push(...limb(shB, elB.k, elB.f, 2.4, 2.4, 2.1, P.shirtDk, P.leatherDk), ...ooval(elB.f[0] + 0.3, elB.f[1], 1.1, 1, P.skinDk));

  // Legs: dark leggings in tall boots, fur at the cuffs.
  const legs = [];
  for (const i of [0, 1]) {
    const a = [hip[0] + feet[i][0], (dead ? 63 : GY - 1.2) + feet[i][1]];
    const h0 = pt(i ? 1.3 : -1.5, 0.3);
    legs.push({ h0, kn: joint(h0, a, 10.4, 10.4, 1) });
  }
  const leg = ({ h0, kn }, back) => {
    const r = [...limb(h0, kn.k, kn.f, 4, 2.9, 2.2, back ? shade(P.legging, -6) : P.legging)];
    const a = kn.f;
    const ang = Math.atan2(a[1] - kn.k[1], a[0] - kn.k[0]);
    const top = [kn.k[0] + Math.cos(ang) * 1.2, kn.k[1] + Math.sin(ang) * 1.2];
    const c = back ? P.leatherDk : P.leather;
    r.push(...oband([top, a], taperW(3.3, 2.6), c, 1));
    r.push(...opoly([[a[0] - 1.8, a[1] - 1], [a[0] + 1.4, a[1] - 1.4], [a[0] + 3.6, a[1] + 0.1], [a[0] + 3.5, a[1] + 1.1], [a[0] - 1.9, a[1] + 1.1]], c));
    r.push(...ooval(top[0], top[1], 2.4, 1.3, back ? P.furDk : P.fur, ang + Math.PI / 2));
    return r;
  };
  out.push(...leg(legs[0], true));

  // Torso: a cream blouse, a laced leather bodice, a belted leather skirt.
  within(T0, () => {
    out.push(...opoly([[-4.8, 3.2], [-4.6, -1.4], [3.8, -1.4], [4.8, 3.6], [1, 4.4], [-2, 4]], P.leatherDk));
    out.push(...opoly([[-4.6, -1.6], [3.8, -1.6], [5.4, 3], [2.4, 3.4], [0.6, 2.2], [-1.4, 3.4], [-5, 3]], P.leather), line([[0.6, -1.2], [0.6, 2.2]], 0.4, P.leatherDk));
    out.push(...opoly(TORSO.slice(0, 11).concat([[-3.3, -4.6], [-3.9, -8.8], [-4.4, -12.4]]), P.shirt));
    out.push(...opoly([[-3.9, -9.6], [4.8, -9.2], [4.6, -7.4], [3.4, -6.6], [2.8, -4.2], [3.8, -1.4], [-4.6, -1.4], [-3.3, -4.6]], P.leather));
    out.push(fpoly([[-3.9, -9.6], [-1.4, -9.5], [-1.2, -1.4], [-4.6, -1.4], [-3.3, -4.6]], P.leatherDk));
    for (let k = 0; k < 3; k++) out.push(line([[1.6, -8.4 + k * 2], [3.2, -7.6 + k * 2]], 0.35, P.string), line([[3.2, -8.4 + k * 2], [1.6, -7.6 + k * 2]], 0.35, P.string));
    out.push(fband(arcPts(3.2, -9.8, 1.9, 1.2, 200, 340, 6), 0.35, P.shirtDk, 1));
    out.push(...opoly([[-4.8, -2.2], [3.9, -2.2], [4, -0.8], [-4.9, -0.8]], P.leatherDk), ...opoly([[0.4, -2.4], [1.8, -2.4], [1.8, -0.6], [0.4, -0.6]], P.gold, 0.35));
    // Cape clasp and its collar of fur.
    out.push(...ooval(-1.2, -13.6, 3.4, 1.6, P.fur), ...ooval(-1.4, -13.9, 2.4, 0.9, P.furDk), ...gem(2.2, -12.9, 0.9, P.cape));
  });
  out.push(...leg(legs[1], false));

  // Head: wolf ears, a high silver ponytail.
  within(at(hc[0], hc[1], tilt), () => {
    const earT = walk ? Math.sin(ph * 2 - 1) * 0.05 : f === 4 && pose === 'idle' ? 0.16 : 0;
    const earFlat = angry ? -0.1 : hurt || dead ? 0.7 : 0;
    within(at(-3.4, -5.4, -0.36 - earFlat - earT), () => out.push(...opoly([[-2.8, 0.8], [-0.4, -7.4], [2.8, 0.6]], P.furDk), fpoly([[-1.4, 0.2], [-0.4, -5], [1.4, 0.2]], shade(P.earIn, -8))));
    // Ponytail, tied high and swinging a beat behind her head.
    const pr = [-5.4, -5.4];
    const pts = flowPts(pr, dead ? 2.6 : 2.1 + sw * 0.08, dead ? 0.2 : -0.9 + (walk ? 0.2 : 0), dead ? 13 : 19, ph - 0.8, walk ? 0.4 : 0.25, 6, 0.8);
    out.push(...oband(pts, lockW(5.8, 0.6, 0.3, 0.06), P.hair, 4), fband(pts.slice(1).map(([x, y]) => [x + 0.8, y - 0.4]), lockW(1.8, 0.6, 0.3, 0.1), P.hairDk, 3));
    out.push(...backHair(P.hairDk, 7));
    out.push(...skull(P));
    out.push(...features(mood, WOLF_FACE));
    out.push(...fringe(P.hair, P.hairLt, [[-5.2, -5.4, -6.8, 1.4, 3, -0.4], [-2, -7, -2.8, -0.2, 3.4, -0.2], [1.6, -7, 1.6, 0.4, 3.4, 0.6], [4.6, -6, 5.6, -0.8, 3, 0.8], [6.6, -3.8, 7.6, 2.6, 2.4, 0.4]]));
    out.push(...brows(mood, { ...WOLF_FACE, brow: '#7a86a8' }));
    out.push(...ooval(-5.6, -5.6, 1.4, 1.3, P.cape), dot(-5.9, -6, 0.4, P.capeLt));
    const sl = flowPts([6.8, -1.2], Math.PI / 2 - 0.08, 0.2, 9, ph - 0.4, 0.2, 4);
    out.push(...oband(sl, lockW(2.2, 1, 0.3, 0.1), P.hair, 3));
    within(at(2.6, -6.2, 0.34 + earFlat + earT), () => out.push(...opoly([[-3, 0.8], [-0.2, -8], [2.8, 0.6]], P.fur), fpoly([[-1.6, 0.2], [-0.3, -5.6], [1.4, 0.2]], P.earIn), fband([[-0.6, 0], [0, -3.8], [0.8, -2]], taperW(1.4, 0.3), P.tip, 2)));
    if (A && f === 0) out.push(dot(8.6, 0.6, 0.35, '#ffffff'));
  });

  // Front arm: bracer and glove; it draws the string to her cheek.
  const elF = joint(shF, handF, 6, 6, -1);
  out.push(...limb(shF, elF.k, elF.f, 2.6, 2.6, 2.3, P.shirt, P.leather));
  // At rest she carries the bow in this hand, upright at her side.
  if (!A && !dead) out.push(...bow(elF.f));
  out.push(...ooval(elF.f[0] + 0.2, elF.f[1], 1.2, 1.1, P.leatherDk));
  out.push(...ooval(shF[0] - 0.2, shF[1] + 0.6, 2.4, 2, P.leather), ...ooval(shF[0], shF[1] + 0.2, 1.6, 1.2, P.leatherLt));
  if (A) out.push(...bow(elB.f));
  if (A && f === 1) {
    out.push(...arrow([56, cheek[1] - 0.2], 0, P), line([[38, cheek[1] - 1.4], [48, cheek[1] - 1.4]], 0.4, P.streak), line([[40, cheek[1] + 1], [50, cheek[1] + 1]], 0.4, P.streak));
  } else if (A && f === 2) {
    out.push(line([[48, cheek[1] - 0.2], [63, cheek[1] - 0.2]], 0.5, P.streak), sparkle(62, cheek[1] - 0.2, 1.4, '#ffffff'));
  }
  return { w: W, h: H, res: 3, shapes: out };
}

// The longbow, gripped at `h` and pointing along angle a (its upper limb), the limbs bowing toward
// the target. `drawn` pulls the string back to that point with an arrow nocked.
function longbow(h, a, drawn, P, twang) {
  const d = [Math.cos(a), Math.sin(a)];
  const nm = [d[1], -d[0]];
  const bend = drawn ? 3.4 : 1.6;
  const L = 12.5;
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = -1 + (2 * i) / 8;
    const b = bend * (1 - t * t) - (Math.abs(t) > 0.8 ? (Math.abs(t) - 0.8) * 4 : 0);
    pts.push([h[0] + d[0] * L * t + nm[0] * b, h[1] + d[1] * L * t + nm[1] * b]);
  }
  const t0 = pts[0];
  const t1 = pts[8];
  const out = [];
  if (drawn) out.push(line([t0, drawn, t1], 0.35, P.string));
  else if (twang) out.push(line([t0, [h[0] - nm[0] * 0.8, h[1] - nm[1] * 0.8], t1], 0.35, P.string));
  else out.push(line([t0, t1], 0.35, P.string));
  out.push(...oband(pts, (t) => 1.5 - Math.abs(t - 0.5) * 1.4, P.wood, 2, 0.45), fband(pts.slice(1, 8), 0.4, P.woodLt, 2));
  out.push(...ooval(h[0], h[1], 1.1, 1.6, P.leatherDk, a + Math.PI / 2, 0.4), dot(t0[0], t0[1], 0.6, P.gold), dot(t1[0], t1[1], 0.6, P.gold));
  if (drawn) out.push(...arrow([h[0] + nm[0] * (bend + 3.6), h[1] + nm[1] * (bend + 3.6)], Math.atan2(h[1] - drawn[1], h[0] - drawn[0]), P, drawn));
  return out;
}

// An arrow with its tip at p, pointing along angle a (from `tail` if given).
function arrow(p, a, P, tail) {
  const d = [Math.cos(a), Math.sin(a)];
  const back = tail ?? [p[0] - d[0] * 15, p[1] - d[1] * 15];
  return [
    line([back, p], 0.6, P.woodLt),
    ...opoly([[p[0] + d[0] * 2.2, p[1] + d[1] * 2.2], [p[0] - d[1] * 0.9, p[1] + d[0] * 0.9], [p[0] + d[1] * 0.9, p[1] - d[0] * 0.9]], P.metal, 0.35),
    ...opoly([[back[0] + d[0] * 2.6, back[1] + d[1] * 2.6], [back[0] + d[0] * 0.4 - d[1] * 1.2, back[1] + d[1] * 0.4 + d[0] * 1.2], [back[0], back[1]], [back[0] + d[0] * 0.4 + d[1] * 1.2, back[1] + d[1] * 0.4 - d[0] * 1.2]], P.fletch, 0.35),
  ];
}

export const ART = {
  kitsunemiko: { walk: 8, idle: 6, attack: 4, stride: 14, draw: kitsune },
  sylph: { walk: 8, idle: 6, attack: 4, stride: 40, draw: sylph },
  yukionna: { walk: 8, idle: 6, attack: 4, stride: 30, draw: yuki },
  nekomata: { walk: 8, idle: 6, attack: 4, stride: 18, draw: nekomata },
  lamia: { walk: 8, idle: 6, attack: 4, stride: 32, draw: lamia },
  lupina: { walk: 8, idle: 6, attack: 4, stride: 20, draw: lupina },
};

export const INFO = {
  kitsunemiko: { name: 'Kitsune Miko', w: 24, h: 48 },
  sylph: { name: 'Sylph', w: 24, h: 46 },
  yukionna: { name: 'Yuki-onna', w: 24, h: 50 },
  nekomata: { name: 'Nekomata', w: 24, h: 46 },
  lamia: { name: 'Lamia', w: 28, h: 50 },
  lupina: { name: 'Lupina', w: 24, h: 50 },
};
