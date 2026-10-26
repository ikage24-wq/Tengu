// Monster art: Twilight Ruins (a will-o'-wisp, an imp, a dullahan) and Crystal Cave (a gem mimic,
// a crystal golem, a wraith). Every design faces right with its feet (or its floating hem) on the
// bottom edge, and is built back to front from layered shapes with hand-placed shading.

import { E, T, F, shade, mix, INK, MOUTH, arc, stroke } from './kit.js';

const TAU = Math.PI * 2;

// ---------- Drawing helpers ----------

// The dark line around a part that overlaps another (the rasterizer only outlines the silhouette).
const ink = (c) => mix(shade(c, -46), '#2a2035', 0.45);

// Rotate points about (cx, cy).
function rot(pts, cx, cy, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
}

// Grow a polygon outward by d (miter offset), for drawing a line around an overlapping part.
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
    const k = d / Math.max(0.45, nx * a[0] + ny * a[1]);
    return [p[0] + nx * k, p[1] + ny * k];
  });
}

// Outlined polygon / ellipse / limb / ribbon (lined so they read over other parts).
const oT = (pts, c, d = 0.7) => [F(T(grow(pts, d), ink(c))), T(pts, c)];
const oE = (x, y, rx, ry, c, d = 0.7) => [F(E(x, y, rx + d, ry + d, ink(c))), E(x, y, rx, ry, c)];

function limb(pts, th, c, d = 0.7) {
  const out = [...stroke(pts, th + d * 2, ink(c))];
  for (const [x, y] of pts.slice(1, -1)) out.push(F(E(x, y, th / 2 + d, th / 2 + d, ink(c))));
  out.push(...stroke(pts, th, c, false));
  for (const [x, y] of pts.slice(1, -1)) out.push(E(x, y, th / 2, th / 2, c));
  return out;
}

// A tapered band along a path (tails, plumes, tongues): widths per point.
function ribbonPts(pts, widths) {
  const L = [];
  const Rr = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const w = widths[i] / 2;
    L.push([p[0] - (dy / l) * w, p[1] + (dx / l) * w]);
    Rr.push([p[0] + (dy / l) * w, p[1] - (dx / l) * w]);
  });
  return [...L, ...Rr.reverse()];
}
const oRibbon = (pts, widths, c, d = 0.7) => oT(ribbonPts(pts, widths), c, d);

// A teardrop flame standing on (cx, by), w wide and h tall, its tip leaning by `lean`.
function flamePts(cx, by, w, h, lean = 0, n = 7) {
  const L = [];
  const Rr = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const hw = (w / 2) * (u < 0.32 ? Math.sqrt(Math.max(0, 1 - ((0.32 - u) / 0.32) ** 2)) : ((1 - u) / 0.68) ** 0.9);
    const x = cx + lean * u * u;
    const y = by - u * h;
    L.push([x - hw, y]);
    Rr.push([x + hw, y]);
  }
  return [...L, ...Rr.reverse()];
}

// A faceted crystal growing from (x, y), w wide and h long, tilted by `tilt` radians from upright.
function crystal(x, y, w, h, tilt, c, cl) {
  const body = [[-w / 2, 0], [-w / 2, -h * 0.72], [0, -h], [w / 2, -h * 0.72], [w / 2, 0]];
  const face = [[0, -h], [w / 2, -h * 0.72], [w / 2, 0], [w * 0.05, 0]];
  const tf = (pts) => rot(pts.map(([px, py]) => [x + px, y + py]), x, y, tilt);
  const shine = tf([[-w * 0.3, -h * 0.2], [-w * 0.12, -h * 0.2], [-w * 0.12, -h * 0.66], [-w * 0.3, -h * 0.6]]);
  return [...oT(tf(body), c, 0.6), F(T(tf(face), cl)), F(T(shine, mix(cl, '#ffffff', 0.6)))];
}

// Glowing eyes for creatures with dark faces (helmets, hoods, stone): mood-shaped.
function glowEyes(cx, cy, k, mood, { gap = 3.8, col = '#7ff3ff', core = '#ffffff', halo = null, look = 0 } = {}) {
  const out = [];
  const g = gap * k;
  for (const s of [-1, 1]) {
    const ex = cx + s * g * 0.5;
    switch (mood) {
      case 'blink':
        out.push(...stroke([[ex - 0.95 * k, cy + 0.3 * k], [ex + 0.95 * k, cy + 0.3 * k]], 0.55 * k, col));
        break;
      case 'happy':
        out.push(arc(ex, cy + 0.7 * k, 1.05 * k, 1 * k, 200, 340, 0.6 * k, col));
        break;
      case 'hurt':
        out.push(...stroke([[ex + s * 0.9 * k, cy - 0.9 * k], [ex - s * 0.7 * k, cy], [ex + s * 0.9 * k, cy + 0.9 * k]], 0.6 * k, col));
        break;
      case 'dead':
        out.push(...stroke([[ex - 0.8 * k, cy - 0.8 * k], [ex + 0.8 * k, cy + 0.8 * k]], 0.55 * k, col), ...stroke([[ex - 0.8 * k, cy + 0.8 * k], [ex + 0.8 * k, cy - 0.8 * k]], 0.55 * k, col));
        break;
      case 'angry':
        if (halo) out.push(F(E(ex, cy + 0.1 * k, 1.6 * k, 1.4 * k, halo)));
        out.push(F(T([[ex + s * 1.15 * k, cy - 1.15 * k], [ex - s * 1.15 * k, cy - 0.05 * k], [ex - s * 0.8 * k, cy + 0.7 * k], [ex + s * 0.15 * k, cy + 0.95 * k], [ex + s * 1.05 * k, cy + 0.45 * k]], col)),
          F(E(ex + look, cy + 0.25 * k, 0.32 * k, 0.32 * k, core)));
        break;
      default:
        if (halo) out.push(F(E(ex, cy, 1.6 * k, 1.8 * k, halo)));
        out.push(F(E(ex, cy, 0.95 * k, 1.2 * k, col)), F(E(ex - 0.2 * k + look, cy - 0.3 * k, 0.45 * k, 0.55 * k, core)));
    }
  }
  return out;
}

// Move / reshape whole groups of shapes: f maps a point; ellipse radii scale by sx, sy.
function xf(shapes, f, sx = 1, sy = 1) {
  return shapes.map((s) => {
    if (!s) return s;
    if (s.t === 'p') return { ...s, x: 0, y: 0, pts: s.pts.map(([px, py]) => f(s.x + px, s.y + py)) };
    if (s.t === 'e') {
      const [x, y] = f(s.x, s.y);
      return { ...s, x, y, rx: s.rx * sx, ry: s.ry * sy };
    }
    const pts = [[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h]].map(([a, b]) => f(a, b));
    return { t: 'p', x: 0, y: 0, pts, c: s.c, f: s.f, cast: s.cast, lit: s.lit };
  });
}
const mv = (shapes, dx, dy) => xf(shapes, (x, y) => [x + dx, y + dy]);
const spin = (shapes, cx, cy, a) => xf(shapes, (x, y) => rot([[x, y]], cx, cy, a)[0]);

// ---------- Motion helpers ----------

const lerp = (a, b, u) => a + (b - a) * u;
// Squash and stretch a group about (cx, cy).
const sqz = (shapes, cx, cy, sx, sy) => xf(shapes, (x, y) => [cx + (x - cx) * sx, cy + (y - cy) * sy], sx, sy);
// Speed lines trailing a fast part: [[x0, y0, x1, y1], ...].
const streaks = (lines, c, th = 0.6) => lines.flatMap(([x0, y0, x1, y1]) => stroke([[x0, y0], [x1, y1]], th, c));
// An impact star of n spikes.
function burst(x, y, r, c, core, n = 8, a0 = 0) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = a0 + (i / (n * 2)) * TAU;
    const rr = i % 2 ? r * 0.4 : r * (i % 4 ? 0.72 : 1);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return [F(T(pts, c)), F(E(x, y, r * 0.3, r * 0.3, core))];
}
// Dust kicked up where a heavy foot lands.
function dust(x, y, k, c = '#e9e2f4') {
  return [F(E(x - 2.8 * k, y - 0.9 * k, 1.9 * k, 1.2 * k, c)), F(E(x + 2.8 * k, y - 0.8 * k, 1.7 * k, 1.1 * k, c)), F(E(x - 5 * k, y - 2 * k, 0.9 * k, 0.8 * k, c)), F(E(x + 4.8 * k, y - 2.1 * k, 0.8 * k, 0.7 * k, c))];
}
// Which way a foot is going: true on the frame it plants.
const plants = (p, step) => {
  const u = ((p % TAU) + TAU) % TAU;
  return u >= Math.PI / 2 - 0.05 && u < Math.PI / 2 - 0.05 + step;
};

// ---------- Will-o'-Wisp ----------
// A little ghost-fire spirit with flickering flame tongues, hollow flame eyes, a curling wispy
// tail, and a warm lantern swinging from its stubby arm. It bobs and flickers as it drifts, and
// attacks by flaring up and flinging a fireball from its lantern.
const WISP_ATK = [
  { dx: -1.8, dy: -0.8, sx: 0.9, sy: 1.1, flare: 1.32, swing: -0.45, hand: [0.8, 0.6], lean: 3 },
  { dx: 1, dy: 0.4, sx: 1.12, sy: 0.9, flare: 1.08, swing: 0.24, hand: [0.4, -1], lean: -5.5 },
  { dx: 0.9, dy: 0.6, sx: 1.05, sy: 0.96, flare: 1, swing: 0.18, hand: [0.4, 0], lean: -4 },
  { dx: 0.3, dy: 0.2, sx: 0.98, sy: 1.02, flare: 0.96, swing: 0.06, hand: [0, 0], lean: -2 },
];

// Hollow flame eyes with a little fire flickering inside each.
function wispEyes(cx, cy, k, mood, flick, look, hot, skin) {
  const out = [];
  const dk = '#3b2f6e';
  for (const s of [-1, 1]) {
    const ex = cx + s * 2.15 * k + look;
    const ey = cy;
    if (mood === 'blink') out.push(...stroke([[ex - 1.1 * k, ey + 0.3 * k], [ex, ey + 0.85 * k], [ex + 1.1 * k, ey + 0.3 * k]], 0.55 * k, dk));
    else if (mood === 'happy') out.push(arc(ex, ey + 1 * k, 1.2 * k, 1.2 * k, 200, 340, 0.6 * k, dk));
    else if (mood === 'hurt') out.push(...stroke([[ex - s * 1 * k, ey - 1 * k], [ex + s * 0.8 * k, ey], [ex - s * 1 * k, ey + 1 * k]], 0.55 * k, dk));
    else if (mood === 'dead') out.push(...stroke([[ex - 0.9 * k, ey - 0.9 * k], [ex + 0.9 * k, ey + 0.9 * k]], 0.5 * k, dk), ...stroke([[ex - 0.9 * k, ey + 0.9 * k], [ex + 0.9 * k, ey - 0.9 * k]], 0.5 * k, dk));
    else {
      const h = 3.7 * k * (1 + 0.08 * flick * s);
      out.push(F(T(flamePts(ex, ey + 1.6 * k, 2.6 * k, h, -s * 0.25 * k + look * 0.3), dk)));
      out.push(F(T(flamePts(ex + look * 0.25, ey + 1.3 * k, 1.3 * k, h * (0.52 + 0.1 * flick), look * 0.2 + flick * 0.2), hot)), F(E(ex + look * 0.25, ey + 0.85 * k, 0.42 * k, 0.42 * k, '#ffffff')));
      if (mood === 'angry') {
        out.push(F(T([[ex + s * 1.8 * k, ey - 3 * k], [ex - s * 1.8 * k, ey - 3 * k], [ex - s * 1.8 * k, ey - 0.1 * k], [ex + s * 1.8 * k, ey - 1.8 * k]], skin)),
          ...stroke([[ex + s * 1.6 * k, ey - 1.7 * k], [ex - s * 1.5 * k, ey - 0.2 * k]], 0.5 * k, dk));
      }
    }
  }
  return out;
}

function wispMouth(x, y, k, mood, shout, hot) {
  const dk = '#3b2f6e';
  if (mood === 'dead') return stroke([[x - 1 * k, y + 0.3 * k], [x - 0.35 * k, y], [x + 0.35 * k, y + 0.3 * k], [x + 1 * k, y]], 0.4 * k, dk);
  if (shout) return [F(E(x, y + 0.7 * k, 1.3 * k, 1.6 * k, dk)), F(E(x, y + 1.4 * k, 0.8 * k, 0.6 * k, hot))];
  if (mood === 'angry') return [F(T([[x - 1.4 * k, y - 0.1 * k], [x + 1.4 * k, y - 0.3 * k], [x + 0.9 * k, y + 1.1 * k], [x - 0.9 * k, y + 1.1 * k]], dk)), F(T([[x - 1 * k, y - 0.05 * k], [x - 0.4 * k, y - 0.1 * k], [x - 0.7 * k, y + 0.55 * k]], '#ffffff')), F(T([[x + 0.4 * k, y - 0.15 * k], [x + 1 * k, y - 0.2 * k], [x + 0.7 * k, y + 0.5 * k]], '#ffffff'))];
  if (mood === 'hurt') return [F(E(x, y + 0.4 * k, 0.6 * k, 0.7 * k, dk))];
  if (mood === 'happy') return [F(T([[x - 1.1 * k, y - 0.1 * k], [x + 1.1 * k, y - 0.1 * k], [x + 0.5 * k, y + 1 * k], [x - 0.5 * k, y + 1 * k]], dk)), F(E(x, y + 0.7 * k, 0.5 * k, 0.3 * k, hot))];
  return stroke([[x - 0.9 * k, y], [x - 0.35 * k, y + 0.5 * k], [x, y + 0.2 * k], [x + 0.35 * k, y + 0.5 * k], [x + 0.9 * k, y]], 0.38 * k, dk);
}

function wisp(pose, frame, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? WISP_ATK[frame] : null;
  const n = walk ? 8 : 6;
  const t = ak ? frame * 1.3 : (frame / n) * TAU;
  const amp = walk ? 1 : ak ? 0.4 : 0.55;
  const dead = mood === 'dead';
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const [c0, c1, c2] = dead ? ['#a9b2c6', '#cdd3e0', '#eceff5'] : angry || ak ? ['#b48cff', '#dcc4ff', '#fbf4ff'] : ['#7fd8ee', '#bff2ff', '#f2fdff'];
  const hot = dead ? '#c9c2d6' : angry || ak ? '#ff8f6a' : '#ffb84a';
  const flare = (angry ? 1.22 : dead ? 0.45 : hurt ? 0.8 : 1) * (ak ? ak.flare / (angry ? 1.22 : 1) : 1);
  // It bobs as it drifts; the flames trail the bob (stretching after a dip) and lean back.
  const bob = ak ? ak.dy : Math.sin(t) * (walk ? 1.9 : 0.7);
  const cx = 16 + (hurt ? -1.4 : 0) + (ak ? ak.dx : walk ? Math.sin(2 * t + 0.6) * 0.5 : 0);
  const cy = 23 + bob + (dead ? 0.6 : 0);
  const sy = ak ? ak.sy : 1 - Math.sin(t) * (walk ? 0.055 : 0.03);
  const sx = ak ? ak.sx : 2 - sy;
  const lean = ak ? ak.lean : (walk ? -3.4 : -0.8) + Math.sin(t - 1.2) * (walk ? 1.6 : 0.9);
  const stretch = ak ? 1 : 1 + 0.15 * Math.sin(t - 1.3) * amp;
  const look = ak ? 0.6 : walk ? 0.5 : Math.sin(t) * 0.9;
  const out = [];

  // Embers drifting up behind it.
  if (!dead) {
    for (let i = 0; i < 3; i++) {
      const u = ((ak ? frame / 4 : frame / n) + i / 3) % 1;
      out.push(F(E(cx - 8 + i * 8 + Math.sin(t + i * 2) * 1.2 - u * 2, cy - 5 - u * 12, 0.95 - u * 0.5, 0.95 - u * 0.5, c1)));
    }
  }
  const body = [];
  // The curling tail, lagging behind the bob.
  const tp = [[cx - 2, cy + 5.5], [cx - 6, cy + 9], [cx - 9.6, cy + 11], [cx - 12, cy + 12.6], [cx - 11, cy + 14.4], [cx - 8.6, cy + 14]];
  const tail = tp.map(([x, y], i) => [x + Math.sin(t - i * 0.9) * 0.5 * i * amp - (ak ? (ak.dx * i) / 6 : 0), y + Math.cos(t - i * 0.9) * 0.35 * i * amp - (walk ? Math.sin(t - 1.2) * i * 0.25 : 0)]);
  body.push(...oRibbon(tail, [8, 6.4, 4.6, 3, 1.8, 0.4], c0));
  // Flame tongues (back to front), each flickering on its own beat.
  const fl = (ph, m) => 1 + 0.13 * Math.sin(t * m + ph) * (ak ? 0.4 : 1);
  const tongues = [
    [cx - 5.2, cy - 2, 7, 9.5 * fl(1, 2), -0.6],
    [cx + 5.4, cy - 2.4, 6.4, 8.5 * fl(2.5, 3), 0.8],
    [cx + 0.4, cy - 3.5, 10.5, 12.6 * fl(0, 1), 0],
  ];
  for (const [x, y, w, h, l] of tongues) body.push(T(flamePts(x, y, w, h * flare * stretch, lean + l + (hurt ? -1.5 : 0)), c0));
  body.push(E(cx, cy, 10, 9.4, c0));
  // Inner glow layers.
  body.push(F(T(ribbonPts(tail.slice(0, 4), [4.6, 3.4, 2.2, 0.6]), c1)));
  body.push(F(T(flamePts(cx + 0.8, cy - 2.6, 6.6, 12.6 * fl(0, 1) * flare * stretch * 0.66, lean * 0.75), c1)), F(T(flamePts(cx - 4.6, cy - 1.5, 3.6, 9.5 * fl(1, 2) * flare * stretch * 0.55, lean * 0.7), c1)));
  if (!dead) body.push(F(T(flamePts(cx + 1, cy - 3, 3, 7 * fl(0.5, 2) * flare * stretch * 0.6, lean * 0.5), c2)));
  body.push(F(E(cx + 0.8, cy + 0.6, 7.8, 7.2, c1)), F(E(cx + 1.8, cy + 1.4, 6.4, 5.6, c2)));
  body.push(F(E(cx - 4.4, cy - 4.4, 2.2, 1.3, '#ffffff')), F(E(cx - 6.4, cy - 1.8, 0.8, 0.8, '#ffffff')));
  // Face: hollow flame eyes, blush, and a little mouth.
  const flick = Math.sin(t * 3 + 0.4);
  body.push(...wispEyes(cx + 2.6, cy + 0.2, 1.25, mood, flick, look, hot, c2));
  if (!dead) body.push(F(E(cx - 0.6 + look, cy + 3.2, 1.3, 0.65, '#ffc6dc')), F(E(cx + 6 + look, cy + 3.2, 1.2, 0.6, '#ffc6dc')));
  body.push(...wispMouth(cx + 2.7 + look, cy + 3.6, 1.1, mood, !!ak && frame > 0 && frame < 3 && !dead, hot));

  // Stubby arm and the swinging lantern (it lags the bob, and is flung forward to throw).
  const [rx, ry] = ak ? ak.hand : [0, 0];
  body.push(...limb([[cx + 6.6, cy + 3], [cx + 9.6 + rx, cy + 5 + ry]], 2.8, c1, 0.6));
  const px = cx + 10.2 + rx;
  const py = cy + 4.8 + ry;
  const a = ak ? ak.swing : dead ? 0.15 : hurt ? 0.55 : Math.sin(t - 1.4) * (walk ? 0.42 : 0.2) + (walk ? 0.12 : 0);
  const frame_ = '#6e5a96';
  const glass = dead ? '#c9c2d6' : angry || ak ? '#ffd8ef' : '#fff1b8';
  const lan = [
    ...stroke([[0, 0], [0, 2.2]], 0.8, frame_),
    ...oT([[-1.4, 2], [1.4, 2], [3, 3.7], [-3, 3.7]], frame_, 0.5),
    ...oT([[-2.5, 3.7], [2.5, 3.7], [2.7, 9], [-2.7, 9]], glass, 0.5),
    ...stroke([[-2.5, 3.7], [-2.7, 9]], 0.7, frame_), ...stroke([[2.5, 3.7], [2.7, 9]], 0.7, frame_),
    ...oT([[-3.3, 9], [3.3, 9], [2.6, 10.6], [-2.6, 10.6]], frame_, 0.5),
    F(E(0, 11, 1, 0.6, frame_)), F(E(0, 1.8, 0.9, 0.8, frame_)),
  ];
  body.push(...xf(lan, (x, y) => rot([[x + px, y + py]], px, py, -a)[0]));
  const [lx, ly] = rot([[px, py + 6.6]], px, py, -a)[0];
  if (!dead) {
    // The lantern flame swells while it gathers the fireball.
    const lf = (1 + 0.15 * Math.sin(t * 2)) * (ak && frame === 0 ? 1.45 : ak && frame < 3 ? 0.6 : 1);
    body.push(F(T(flamePts(lx, ly + 1.8, 2.6, 4 * lf, -a * 1.5), angry || ak ? '#ff7fbf' : '#ffa94a')), F(T(flamePts(lx, ly + 1.8, 1.3, 2.3 * lf, -a), '#fff8d6')));
  }
  // Little hand over the ring.
  body.push(...oE(px - 0.1, py + 0.6, 1.7, 1.6, c1, 0.5), F(E(px + 0.3, py + 0.1, 0.6, 0.5, c2)));
  out.push(...sqz(body, cx, cy + 6, sx, sy));

  // The fireball: gathering sparks, the throw, the burst, and its embers.
  if (ak && !dead) {
    if (frame === 0) {
      for (let i = 0; i < 4; i++) {
        const q = (i / 4) * TAU + 0.5;
        out.push(F(E(lx + Math.cos(q) * 4.6, ly + Math.sin(q) * 4.2, 0.7, 0.7, '#ffd0a0')), ...stroke([[lx + Math.cos(q) * 4.2, ly + Math.sin(q) * 3.8], [lx + Math.cos(q) * 2.8, ly + Math.sin(q) * 2.6]], 0.4, '#fff1c8'));
      }
    } else if (frame === 1) {
      const [bx, by] = [28.6, 21.4];
      out.push(...oRibbon([[bx, by], [bx - 3, by + 3.4], [bx - 5, by + 7]], [5.2, 3.2, 0.6], '#ff9a6a', 0.5), F(T(ribbonPts([[bx, by], [bx - 2.6, by + 3]], [3, 1]), '#ffd27a')));
      out.push(...oE(bx, by, 2.7, 2.7, '#ff8f6a', 0.5), F(E(bx + 0.3, by - 0.2, 1.8, 1.8, '#ffd27a')), F(E(bx + 0.5, by - 0.5, 0.9, 0.9, '#ffffff')));
    } else if (frame === 2) {
      out.push(...burst(29.4, 16.6, 4.4, '#ff9a6a', '#fff4d0', 8, 0.2), ...burst(29.4, 16.6, 2.7, '#ffd27a', '#ffffff', 6, 0.6));
      out.push(F(E(25.4, 13, 0.8, 0.8, '#ffb07a')), F(E(32.4, 21, 0.7, 0.7, '#ffb07a')), F(E(26, 21.6, 0.6, 0.6, '#ffd27a')));
    } else {
      for (const [x, y, r] of [[28.6, 13, 1.1], [31.4, 15.4, 0.8], [26.4, 10.6, 0.7], [30.2, 18.6, 0.6]]) out.push(F(E(x, y, r, r, '#ffc08a')));
      out.push(F(E(29, 15.4, 2.2, 1.6, '#f0e2f6')), F(E(27.6, 13.6, 1.3, 1, '#f0e2f6')));
    }
  }
  return { w: 34, h: 40, res: 3, shapes: out };
}

// ---------- Imp ----------
// A pink little demon on bat wings: curled horns, pointy ears, slanted red cat eyes, a smug grin
// with a fang, a spade-tipped tail, and a tiny golden trident. It flits in quick, erratic darts and
// attacks by rearing back and jabbing with the trident.
function batWing(sx, sy, dir, el, c, mc, bone, k = 1, spread = 1) {
  const v = (a, l) => [dir * Math.cos(a) * l * k, -Math.sin(a) * l * k];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const S = [sx, sy];
  const Eb = add(S, v(el + 0.35, 7));
  const f1 = add(Eb, v(el - 0.05 * spread, 10.5 * (0.88 + spread * 0.12)));
  const f2 = add(Eb, v(el - 0.6 * spread, 9.4));
  const f3 = add(Eb, v(el - 1.15 * spread, 7.6));
  const B = [sx - dir * 0.5, sy + 6];
  const sc = (p, q, kk = 0.3) => {
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    return [m[0] + (Eb[0] - m[0]) * kk, m[1] + (Eb[1] - m[1]) * kk];
  };
  const mem = [S, Eb, f1, sc(f1, f2), f2, sc(f2, f3), f3, sc(f3, B, 0.2), B];
  const out = [...oT(mem, mc, 0.6)];
  // Membrane panels shade darker toward the body.
  out.push(F(T([Eb, sc(f2, f3), f3, sc(f3, B, 0.2), B, S], shade(mc, -6))));
  out.push(...stroke([S, Eb, f1], 1.2, c), ...stroke([Eb, f2], 0.8, c), ...stroke([Eb, f3], 0.8, c));
  out.push(F(T([add(Eb, [0, -0.6]), add(Eb, v(el + 1.3, 2.6)), add(Eb, [dir * 0.6, 0.4])], bone)));
  return out;
}

// Slanted almond eyes, outer corners up: red irises with cat slits, smug half lids when calm.
function impEyes(cx, cy, k, mood, look, skin) {
  const dk = '#4a2050';
  const out = [];
  for (const s of [-1, 1]) {
    const x = cx + s * 1.95 * k;
    const y = cy;
    const tilt = -s * 0.3;
    const R = (pts) => rot(pts, x, y, tilt);
    const top = [];
    const bot = [];
    for (let i = 0; i <= 6; i++) {
      const u = i / 6;
      top.push([x - 1.75 * k + 3.5 * k * u, y - 1.15 * k * Math.sin(Math.PI * u)]);
      bot.push([x + 1.75 * k - 3.5 * k * u, y + 0.9 * k * Math.sin(Math.PI * u)]);
    }
    const outer = R([[x + s * 1.75 * k, y]])[0];
    if (mood === 'blink' || mood === 'happy') {
      const lid = mood === 'happy' ? R(top) : R(bot.slice().reverse().map(([px, py]) => [px, y + (py - y) * 0.6]));
      out.push(...stroke(lid, 0.55 * k, dk), ...stroke([outer, [outer[0] + s * 0.7 * k, outer[1] - 0.6 * k]], 0.4 * k, dk));
      continue;
    }
    if (mood === 'hurt') {
      out.push(...stroke([[x - s * 1.2 * k, y - 1.1 * k], [x + s * 0.9 * k, y], [x - s * 1.2 * k, y + 1.1 * k]], 0.55 * k, dk));
      continue;
    }
    if (mood === 'dead') {
      out.push(...stroke([[x - 1 * k, y - 1 * k], [x + 1 * k, y + 1 * k]], 0.5 * k, dk), ...stroke([[x - 1 * k, y + 1 * k], [x + 1 * k, y - 1 * k]], 0.5 * k, dk));
      continue;
    }
    const alm = R([...top, ...bot]);
    const lx = look * 0.35 * k;
    out.push(F(T(grow(alm, 0.42 * k), dk)), F(T(alm, '#fff0e0')));
    out.push(F(E(x + lx, y + 0.05 * k, 1.05 * k, 0.98 * k, '#e2335c')), F(E(x + lx, y + 0.5 * k, 0.75 * k, 0.4 * k, '#ff8f80')));
    out.push(F(E(x + lx, y, mood === 'angry' ? 0.18 * k : 0.26 * k, 0.8 * k, '#2a1030')), F(E(x + lx - 0.42 * k, y - 0.42 * k, 0.3 * k, 0.3 * k, '#ffffff')));
    if (mood === 'idle') {
      // Smug half lids.
      const lid = R([[x - 2 * k, y - 2.2 * k], [x + 2 * k, y - 2.2 * k], [x + 2 * k, y - 0.35 * k], [x - 2 * k, y - 0.35 * k]]);
      out.push(F(T(lid, skin)), ...stroke(R([[x - 1.8 * k, y - 0.35 * k], [x + 1.8 * k, y - 0.35 * k]]), 0.5 * k, dk));
    } else if (mood === 'angry') {
      out.push(F(T([[x + s * 2.1 * k, y - 2.6 * k], [x - s * 2.1 * k, y - 2.6 * k], [x - s * 2.1 * k, y - 0.15 * k], [x + s * 2.1 * k, y - 1.5 * k]], skin)),
        ...stroke([[x + s * 2 * k, y - 1.5 * k], [x - s * 1.9 * k, y - 0.2 * k]], 0.55 * k, dk), ...stroke([[x + s * 2.1 * k, y - 2.5 * k], [x - s * 1.5 * k, y - 1.4 * k]], 0.5 * k, dk));
    } else {
      out.push(...stroke(R(top), 0.5 * k, dk));
    }
    out.push(...stroke([outer, [outer[0] + s * 0.8 * k, outer[1] - 0.7 * k]], 0.42 * k, dk));
  }
  return out;
}

const IMP_ATK = [
  { dx: -2.4, dy: -0.4, flap: 1, tilt: 1.42, hand: [23.6, 24.6], lean: -0.14, sp: 1.15 },
  { dx: 2.2, dy: 0.6, flap: -0.6, tilt: 1.55, hand: [30.4, 21.6], lean: 0.12, sp: 0.8 },
  { dx: 2.6, dy: 0.8, flap: -0.3, tilt: 1.6, hand: [30.6, 22], lean: 0.14, sp: 0.9 },
  { dx: 0.8, dy: 0.2, flap: 0.6, tilt: 1.32, hand: [29.6, 21.2], lean: 0.04, sp: 1 },
];

function imp(pose, frame, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? IMP_ATK[frame] : null;
  const n = walk ? 8 : 6;
  const t = ak ? frame * 1.4 : (frame / n) * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const skin = '#f5a3c4';
  const skinD = '#de80a8';
  const belly = '#ffdcea';
  const wingC = '#6a4ea8';
  const memb = '#9479d6';
  const horn = '#fff1dc';
  const gold = '#ffd66b';
  // Quick, erratic darting: a fast flap plus a second jitter that jerks it about.
  const flap = ak ? ak.flap : dead ? -0.6 : hurt ? 1 : walk ? 0.2 + 0.85 * Math.cos(t) : 0.35 + 0.5 * Math.cos(t);
  const sp = ak ? ak.sp : walk ? 1 - 0.18 * Math.sin(t) : 1;
  let dy = ak ? ak.dy : dead ? 1.5 : walk ? -Math.sin(t) * 1.3 - Math.sin(2 * t + 0.7) * 0.7 : -Math.sin(t) * 0.6;
  let dx = ak ? ak.dx : walk ? Math.sin(2 * t) * 0.9 + Math.sin(3 * t + 1) * 0.3 : 0;
  if (hurt) dx -= 1.4;
  const lean = ak ? ak.lean : walk ? 0.06 + Math.cos(2 * t) * 0.06 : Math.sin(t) * 0.03;
  const look = ak ? 0.8 : walk ? 0.6 : [0, 1, 1, 0, -1, -1][frame] ?? 0;
  const out = [];
  const fx = [];

  // Wings: the far one first, darker, a beat behind.
  out.push(...batWing(27.5, 18.4, 1, flap - 0.1 - (walk ? 0.12 : 0), shade(wingC, -6), shade(memb, -10), horn, 0.92, sp));
  out.push(...batWing(19.5, 18.6, -1, flap, wingC, memb, horn, 1, sp));
  // Tail with a spade tip, whipping behind each dart.
  const tw = ak ? [-1.6, 1.4, 1, 0.3][frame] : 0;
  const tp = [[19.5, 26], [15.5, 28.4], [11.4, 28.6], [8.6, 26], [8.4, 22.6]].map(([x, y], i) => [x + Math.sin(t - i * 0.8) * 0.45 * i - tw * i * 0.3, y + Math.cos(t - i * 0.8) * 0.6 * i + (walk ? Math.sin(2 * t - i) * 0.3 * i : 0)]);
  out.push(...oRibbon(tp, [2.2, 1.8, 1.5, 1.3, 1.1], skinD, 0.6));
  {
    const [a, b] = tp.slice(-2);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const spd = rot([[3.6, 0], [0.4, -2.3], [-0.9, -1.5], [0, 0], [-0.9, 1.5], [0.4, 2.3]].map(([x, y]) => [x + b[0], y + b[1]]), b[0], b[1], ang);
    out.push(...oT(spd, '#c95b8f', 0.6));
  }
  // Back arm and dangling legs that lag behind the darting.
  out.push(...limb([[20.5, 21.5], [17.6, 24.2 - (ak && !frame ? 1.5 : 0)]], 2.2, skinD, 0.6), E(17.3, 24.6 - (ak && !frame ? 1.5 : 0), 1.3, 1.2, skinD));
  const ls = ak ? [1.2, -1.4, -1.2, -0.4][frame] : Math.sin(t - 1.3) * (walk ? 1.2 : 0.7);
  const kick = ak ? [0, 0.8, 0.8, 0.2][frame] : 0;
  out.push(...limb([[21.6, 27], [20.6 - ls, 31 - kick]], 2.3, skinD, 0.6), E(20.4 - ls, 31.6 - kick, 1.4, 1, '#7a4a6e'));
  out.push(...limb([[25.6, 27.4], [26.8 + ls * 0.6, 31.4 - kick]], 2.3, skin, 0.6), E(27 + ls * 0.6, 32 - kick, 1.4, 1, '#7a4a6e'));
  // Torso and belly.
  out.push(...oE(23.6, 23.8, 5.4, 5, skin), F(E(24.6, 24.6, 3.3, 3.4, belly)), F(E(25.6, 23.4, 1, 0.7, '#ffffff')));
  // Head group: it lags the body a touch, and the ears flop after it.
  const head = [];
  const ear = walk ? Math.sin(t - 1.6) * 1 : Math.sin(t - 1) * 0.4;
  const earA = angry || ak ? -1.2 : 0;
  head.push(...oT([[18, 10.4], [11.2, 7.2 + ear + earA], [17.6, 15]], skin, 0.6), F(T([[17.2, 11.4], [13.4, 9.2 + ear * 0.8 + earA], [17, 13.6]], '#ffc2d8')));
  head.push(...oT([[31.6, 9.8], [37.4, 6.8 + ear + earA], [32.2, 14]], skin, 0.6), F(T([[32.4, 10.6], [35.6, 8.6 + ear * 0.8 + earA], [32.6, 12.8]], '#ffc2d8')));
  const hornL = [[21, 6.4], [19.2, 3.8], [18.8, 1.8], [19.8, 0.9]];
  const hornR = [[28.4, 6], [30, 3.6], [31.6, 2], [33, 1.6]];
  head.push(...oRibbon(hornL, [3, 2.4, 1.5, 0.3], horn, 0.6), ...oRibbon(hornR, [3, 2.4, 1.5, 0.3], horn, 0.6));
  head.push(...stroke([[19.4, 4.4], [21, 4]], 0.4, '#e8cfa8'), ...stroke([[29.2, 3.6], [30.6, 4.4]], 0.4, '#e8cfa8'));
  head.push(...oE(25, 12.4, 8.6, 7.8, skin));
  head.push(F(E(22, 8.6, 3, 1.6, mix(skin, '#ffffff', 0.35))));
  head.push(F(T([[22.6, 6.2], [24, 3], [25, 5.4], [26.6, 2.6], [27.4, 5.6], [28.6, 4.6], [28.4, 7], [22.4, 7.4]], '#8a5cc4')));
  // Face: slanted cat eyes and a mischievous grin.
  const ex = 27.2;
  const ey = 12.2;
  head.push(...impEyes(ex, ey, 1.38, mood, look, skin));
  if (!dead) head.push(F(E(22.6, 15.4, 1.5, 0.7, '#ff86b0')), F(E(31.8, 15.2, 1.2, 0.6, '#ff86b0')));
  const my = 16.2;
  if (dead) {
    head.push(...stroke([[25.4, my + 0.3], [26.4, my - 0.2], [27.4, my + 0.3], [28.4, my - 0.2], [29.4, my + 0.3]], 0.45, INK));
  } else if (hurt) {
    head.push(F(E(27.6, my + 0.2, 0.9, 1, MOUTH)));
  } else if (ak && frame === 0) {
    // Gritted teeth while it winds up.
    head.push(F(T([[24.8, my - 0.6], [30.2, my - 0.9], [29.8, my + 0.8], [25.2, my + 0.9]], '#ffffff')), ...stroke([[25, my + 0.05], [30, my - 0.1]], 0.35, '#4a2050'), ...stroke([[27.5, my - 0.7], [27.5, my + 0.8]], 0.3, '#4a2050'));
  } else if (angry || ak) {
    head.push(F(T([[24.6, my - 0.6], [30.4, my - 0.8], [29.4, my + 2], [25.6, my + 2]], MOUTH)),
      F(T([[25.4, my - 0.6], [26.6, my - 0.6], [26, my + 0.8]], '#ffffff')), F(T([[28.4, my - 0.7], [29.6, my - 0.7], [29, my + 0.7]], '#ffffff')), F(E(27.4, my + 1.4, 1.2, 0.5, '#ff8fa8')));
  } else if (mood === 'happy') {
    head.push(F(T([[24.6, my - 0.8], [30.4, my - 1.2], [29, my + 1.8], [26, my + 1.8]], MOUTH)), F(E(27.6, my + 1.1, 1.4, 0.7, '#ff8fa8')), F(T([[28.6, my - 1], [29.6, my - 1.1], [29.2, my + 0.2]], '#ffffff')));
  } else {
    head.push(F(T([[24.8, my - 0.8], [27, my], [29.8, my - 1.4], [29.6, my - 0.2], [27.4, my + 1.2], [25.2, my + 0.2]], MOUTH)), F(T([[28.2, my - 0.6], [29.2, my - 0.9], [28.9, my + 0.5]], '#ffffff')));
  }
  const hl = walk ? [Math.sin(2 * t - 0.9) * -0.4, Math.sin(t - 0.8) * 0.5] : ak ? [[-0.6, -0.4], [0.8, 0.3], [0.5, 0.3], [0.1, 0]][frame] : [0, Math.sin(t - 0.8) * 0.3];
  out.push(...mv(head, hl[0], hl[1]));
  // Front arm and the trident: twirled while it flies, gripped short and jabbed in the attack.
  const [hx, hy] = ak ? ak.hand : [33.6, 22.4];
  const tilt = ak ? ak.tilt : dead ? 0.5 : 0.08 + Math.sin(t - 0.6) * (walk ? 0.12 : 0.08) + (angry ? -0.25 : 0);
  const g = ak ? 8 : 0;
  const tri = [
    ...oT([[-0.7, 9.2], [0.7, 9.2], [0.7, -14], [-0.7, -14]], '#c99a4a', 0.5),
    ...oT([[-4, -14.6], [4, -14.6], [3.4, -13.2], [-3.4, -13.2]], gold, 0.5),
    ...oT([[-0.9, -14.4], [0, -19.6], [0.9, -14.4]], gold, 0.5),
    ...oT([[-4, -14.4], [-4.4, -17.6], [-3.4, -16.4], [-2.8, -14.4]], gold, 0.5),
    ...oT([[4, -14.4], [4.4, -17.6], [3.4, -16.4], [2.8, -14.4]], gold, 0.5),
    F(E(0, -13.9, 0.9, 0.8, '#ff6f9f')),
  ];
  out.push(...xf(tri, (x, y) => rot([[x + hx, y + g + hy]], hx, hy, tilt)[0]));
  const el = [lerp(28, hx, 0.5) + (ak ? -0.6 : 0), lerp(21.4, hy, 0.5) + 1.4];
  out.push(...limb([[28, 21.4], el, [hx - 0.6, hy + 0.2]], 2.3, skin, 0.6), ...oE(hx, hy, 1.6, 1.5, skin, 0.5));
  if (ak && frame === 1) fx.push(...streaks([[hx - 14, hy - 2.2, hx - 6, hy - 1.4], [hx - 12, hy + 1.6, hx - 5, hy + 1.2], [hx - 9, hy - 4.6, hx - 3, hy - 3.6]], '#fbe7ff', 0.7));
  if (ak && frame === 2 && !dead) fx.push(...burst(hx + 11.2, hy + 0.2, 3.6, '#fff1a8', '#ffffff', 6, 0.3), ...streaks([[hx - 10, hy - 1.6, hx - 4, hy - 1.2]], '#fbe7ff', 0.6));

  let shapes = spin(out, 24, 26, lean);
  shapes = mv([...shapes, ...fx], dx, dy);
  return { w: 46, h: 36, res: 3, shapes };
}

// ---------- Dullahan ----------
// A headless knight: ghost-fire rising from the empty collar, a swept cape, an upright sword, and
// its plumed helmet tucked under one arm, burning slits glowing in the visor. It marches with a
// heavy armoured clank, and attacks by holding its head aloft and chopping down with the sword.

// Burning visor slits, shaped by mood.
function slitEyes(cx, cy, k, mood, col, halo, look = 0) {
  const out = [];
  for (const s of [-1, 1]) {
    const x = cx + s * 1.8 * k + look;
    if (halo && mood !== 'dead' && mood !== 'blink') out.push(F(E(x, cy + 0.1 * k, 1.9 * k, 1.15 * k, halo)));
    switch (mood) {
      case 'blink':
        out.push(...stroke([[x - 1.1 * k, cy + 0.2 * k], [x + 1.1 * k, cy + 0.2 * k]], 0.28 * k, col));
        break;
      case 'happy':
        out.push(arc(x, cy + 0.8 * k, 1.1 * k, 0.9 * k, 200, 340, 0.45 * k, col));
        break;
      case 'hurt':
        out.push(...stroke([[x - s * 1 * k, cy - 0.7 * k], [x + s * 0.8 * k, cy], [x - s * 1 * k, cy + 0.7 * k]], 0.42 * k, col));
        break;
      case 'dead':
        out.push(...stroke([[x - 0.8 * k, cy - 0.7 * k], [x + 0.8 * k, cy + 0.7 * k]], 0.4 * k, col), ...stroke([[x - 0.8 * k, cy + 0.7 * k], [x + 0.8 * k, cy - 0.7 * k]], 0.4 * k, col));
        break;
      case 'angry':
        out.push(F(T([[x + s * 1.4 * k, cy - 0.95 * k], [x - s * 1.35 * k, cy + 0.05 * k], [x - s * 1.2 * k, cy + 0.65 * k], [x + s * 1.35 * k, cy - 0.25 * k]], col)), F(E(x - s * 0.2 * k, cy + 0.05 * k, 0.5 * k, 0.22 * k, '#ffffff')));
        break;
      default:
        out.push(F(T([[x - 1.3 * k, cy - 0.15 * k], [x + 1.3 * k, cy - 0.4 * k], [x + 1.2 * k, cy + 0.45 * k], [x - 1.2 * k, cy + 0.5 * k]], col)), F(E(x + look * 0.3, cy + 0.08 * k, 0.6 * k, 0.2 * k, '#ffffff')));
    }
  }
  return out;
}

const DULL_ATK = [
  { hx: -1.6, by: -0.6, sw: -0.42, hand: [31.4, 18.6], lift: -26, fire: 1.35 },
  { hx: 0.8, by: 0.4, sw: 0.62, hand: [32.4, 22.4], lift: -25, fire: 1.15 },
  { hx: 1.4, by: 1.8, sw: 2.66, hand: [31, 33.4], lift: -23.6, fire: 1 },
  { hx: 0.8, by: 1, sw: 2.86, hand: [30.4, 30.6], lift: -24.4, fire: 1 },
];

function dullahan(pose, frame, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? DULL_ATK[frame] : null;
  const n = walk ? 8 : 6;
  const t = ak ? frame * 1.2 : (frame / n) * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const plate = '#d4ddff';
  const plateD = '#a9b6ea';
  const plateL = '#f4f7ff';
  const suit = '#5a4e8c';
  const suitD = '#473d74';
  const trim = '#ffd66b';
  const capeC = '#7a5cc0';
  const visor = '#221a36';
  const fl = angry || ak ? ['#ff8fc0', '#ffd0e6', '#ffffff'] : dead ? ['#b8bfd0', '#dde1ea', '#f2f4f8'] : ['#7fe6e0', '#c8fbf4', '#ffffff'];
  // A heavy march: the body drops hard just after each foot plants, and the armour bounces after it.
  const bob = ak ? ak.by : walk ? 1.7 * Math.sin(t - 0.35) ** 2 : (Math.sin(t) * 0.5 + 0.5) * 0.7;
  const clank = walk ? 0.55 * Math.sin(2 * t - 1.7) : 0;
  const hx = (hurt ? -1.2 : 0) + (ak ? ak.hx : 0);
  const amp = walk ? 1 : 0.45;
  const out = [];
  const body = [];
  const fxs = [];

  // Cape, flowing back and rippling with every step, lined in pink.
  const cf = walk ? 2 : 1;
  const w = (k) => (ak ? [-1.2, 1.6, 2.2, 1.2][frame] * (0.4 + k * 0.4) : Math.sin(cf * t - k * 0.9) * amp * (0.4 + k * 0.45) + (walk ? -k * 0.35 : 0));
  const cape = [[27, 23], [15, 23.4], [11, 30], [8 + w(1) * 0.6, 40], [5 + w(2), 49], [6.6 + w(3), 52.4], [9.4 + w(3), 50.4], [12.4 + w(3) * 0.8, 53.4], [15.6 + w(2) * 0.6, 51], [18.4, 52.4], [21, 46]];
  body.push(...oT(cape, capeC), F(T([[11, 30], [8 + w(1) * 0.6, 40], [5 + w(2), 49], [6.6 + w(3), 52.4], [9 + w(2), 44], [12, 34]], shade(capeC, -9))));
  body.push(...stroke([[14, 30], [12 + w(2) * 0.5, 42], [10.6 + w(3) * 0.7, 50]], 0.6, shade(capeC, -16)));
  body.push(F(T([[5 + w(2), 49], [6.6 + w(3), 52.4], [9.4 + w(3), 50.4], [12.4 + w(3) * 0.8, 53.4], [15.6 + w(2) * 0.6, 51], [15, 49.4], [12.4, 51.2], [9.6, 48.6], [6.8, 50.2]], '#ff9ec0')));
  // Back upper arm in the dark under-suit: cradling the helmet, or raising it high.
  const helmUp = ak ? ak.lift : 0;
  if (ak) body.push(...limb([[15, 27], [10.6, 23.4], [9.6, 46 + helmUp]], 3.4, suitD));
  else body.push(...limb([[15, 27], [6, 41.6]], 3.6, suitD));
  // Breastplate with a gold-trimmed hem, belt, and faulds.
  const bp = [[15, 25], [29, 25], [30.6, 31], [28.6, 38], [27.4, 41], [16.6, 41], [15.4, 38], [13.8, 31]];
  body.push(...oT(bp, plate), F(T([[15, 25], [18.4, 25], [17.4, 33], [18.2, 41], [16.6, 41], [15.4, 38], [13.8, 31]], plateD)));
  body.push(F(E(25.6, 29.8, 2.8, 2, plateL)), F(E(26.6, 35.4, 1.2, 1.6, plateL)), ...stroke([[21.6, 26], [22.2, 33], [21.8, 40.4]], 0.55, plateD));
  body.push(F(T([[22.4, 30.4], [24, 32.4], [22.4, 34.6], [20.8, 32.4]], trim)), F(T([[22.4, 31.4], [23.2, 32.4], [22.4, 33.4], [21.6, 32.4]], '#ff9ec0')));
  body.push(...oT([[16.2, 40.2], [27.8, 40.2], [28, 42.6], [16, 42.6]], suit, 0.5), F(T([[20.8, 40], [24, 40], [24, 42.8], [20.8, 42.8]], trim)), F(E(22.4, 41.4, 0.7, 0.6, suit)));
  // Faulds swing a beat behind the hips.
  const fs = walk ? Math.sin(t - 1.2) * 0.7 : ak ? [-0.4, 0.5, 0.8, 0.4][frame] : 0;
  body.push(...oT([[15.6, 42.6], [28.6, 42.6], [30 + fs, 46.8], [14.2 + fs, 46.8]], plateD, 0.5), ...stroke([[22.2, 42.8], [22.2 + fs, 46.6]], 0.5, shade(plateD, -14)), F(T([[14.6 + fs, 45.6], [29.6 + fs, 45.6], [30 + fs, 46.8], [14.2 + fs, 46.8]], trim)));
  // Back pauldron, bouncing on its strap.
  body.push(...mv([...oE(15, 26.6, 4.4, 3.8, plateD), F(E(14.4, 25.4, 2, 1, plate))], 0, clank));
  // The empty collar and its ghost-fire, flaring as it attacks.
  const fk = (angry ? 1.25 : dead ? 0.35 : 1) * (ak ? ak.fire : 1) * (1 + 0.1 * Math.sin(t * 2) + (walk ? 0.06 * Math.sin(2 * t - 2.2) : 0));
  const lean = ak ? [2.4, -3.4, -2.4, -1.4][frame] : (walk ? -2.6 : -0.8) + Math.sin(cf * t - 0.9) * (walk ? 1 : 0.8) + (hurt ? -2 : 0);
  body.push(...oE(22, 25.2, 6.8, 2.8, plateL, 0.5), F(E(22, 24.7, 5, 1.7, visor)));
  body.push(T(flamePts(22, 25, 9.4, 15 * fk, lean), fl[0]), T(flamePts(18.6, 25, 4.6, 8 * fk * (1 + 0.15 * Math.sin(t + 2)), lean - 1), fl[0]), T(flamePts(25.4, 25, 4, 7 * fk * (1 + 0.15 * Math.sin(t * 3 + 1)), lean), fl[0]));
  body.push(F(T(flamePts(22.3, 25, 6.2, 10.5 * fk, lean * 0.8), fl[1])), F(T(flamePts(22.5, 25, 3, 6 * fk, lean * 0.5), fl[2])));
  if (!dead) {
    for (let i = 0; i < 2; i++) {
      const u = ((ak ? frame / 4 : frame / n) + i * 0.5) % 1;
      body.push(F(E(20 + lean * (1 + u) + i * 3, 9 - u * 7, 0.85 - u * 0.4, 0.85 - u * 0.4, fl[1])));
    }
  }
  const lip = [];
  for (let i = 0; i <= 8; i++) lip.push([22 + 6.8 * Math.cos((i / 8) * Math.PI), 25.2 + 2.8 * Math.sin((i / 8) * Math.PI)]);
  for (let i = 8; i >= 0; i--) lip.push([22 + 5 * Math.cos((i / 8) * Math.PI), 24.9 + 1.5 * Math.sin((i / 8) * Math.PI)]);
  body.push(F(T(lip, plateL)), ...stroke([[16.4, 26.6], [22, 28.1], [27.6, 26.6]], 0.5, trim));

  // Helmet: plume, gold crest, bucket helm, T-visor with burning slits.
  const hb = ak ? 0 : hurt ? -1.6 : dead ? 1.4 : walk ? 0.7 * Math.sin(2 * t - 2.2) : Math.sin(t + 0.6) * 0.3;
  const look = ak ? 0.5 : walk ? 0.3 : Math.sin(t) * 0.7;
  const pw = (k) => (ak ? [1.2, -1.6, -2, -1][frame] * k * 0.6 : walk ? Math.sin(2 * t - k * 1.1) * (0.4 + k * 0.3) - k * 0.3 : Math.sin(t - k) * 0.4 * k);
  const helm = [];
  const pl = [[9.6, 32], [6.6, 30.6 + pw(1)], [3.6, 31.2 + pw(2)], [1.6, 33.6 + pw(3)]];
  helm.push(...oRibbon(pl, [3.6, 3.4, 2.6, 0.8], '#ff9ec0'), F(T(ribbonPts(pl.slice(0, 3), [1.2, 1.2, 0.6]), '#ffd0e0')));
  helm.push(...oE(10.4, 38.2, 6.8, 6.6, plate), F(T([[3.8, 37], [6.4, 33], [7.4, 44.4], [4.6, 41.6]], plateD)), F(E(8.4, 34, 2.6, 1.2, plateL)));
  helm.push(...stroke([[5.6, 34.6], [10, 31.8], [14.6, 33.6]], 1.2, trim));
  helm.push(F(T([[8.6, 35.2], [17.2, 34.8], [17.4, 39.6], [8.9, 40]], visor)), ...stroke([[13.2, 40.2], [13.2, 43.4]], 0.9, plateD));
  helm.push(...slitEyes(13.1, 37.3, 1.2, mood, fl[0], mix(fl[0], visor, 0.6), look));
  if (angry || ak) helm.push(...stroke([[9.4, 35.5], [12, 36.4]], 0.6, fl[0]), ...stroke([[16.8, 35.4], [14.2, 36.4]], 0.6, fl[0]));
  helm.push(...stroke([[8.4, 35.1], [17.4, 34.7]], 0.7, plateL), F(E(11.4, 41.8, 0.4, 0.4, visor)), F(E(11.6, 43.2, 0.4, 0.4, visor)), F(E(15, 41.8, 0.4, 0.4, visor)), F(E(14.8, 43.2, 0.4, 0.4, visor)));
  if (ak) {
    body.push(...mv(helm, -1, helmUp));
    // The hand holding it up from below.
    body.push(...oE(9.6, 45.4 + helmUp, 2.2, 1.9, plateD), F(E(9.2, 44.6 + helmUp, 1.2, 0.5, plateL)));
  } else {
    body.push(...mv(helm, 0, hb));
    body.push(...limb([[6, 41.6], [13.6, 45.4 + hb * 0.5]], 3.2, suit), ...oE(14.6, 44.8 + hb * 0.5, 2.2, 1.9, plateD), F(E(14.2, 44 + hb * 0.5, 1.2, 0.5, plateL)));
  }

  // The sword arm: upright at rest, swinging with the march, chopping in the attack.
  const [sx, sy] = ak ? ak.hand : [35.2 + (walk ? -Math.sin(t) * 1.2 : 0), 37 + (walk ? Math.cos(2 * t) * 0.3 : 0)];
  const sw = ak ? ak.sw : dead ? 0.32 : 0.2 + (walk ? Math.sin(t - 0.6) * 0.09 : Math.sin(t) * 0.04) + (angry ? -0.12 : 0);
  const sword = [
    ...oE(0, 3.4, 1.3, 1.3, '#ff9ec0', 0.5),
    ...oT([[-0.8, 2.4], [0.8, 2.4], [0.8, -1.6], [-0.8, -1.6]], '#7a5a8a', 0.5),
    ...oT([[-1.6, -2.8], [1.6, -2.8], [1.6, -22.6], [0, -26.4], [-1.6, -22.6]], '#eef4ff', 0.5),
    F(T([[-1.6, -2.8], [-0.2, -2.8], [-0.2, -24.6], [-1.6, -22.6]], '#d6e0fa')),
    ...stroke([[0.4, -4], [0.4, -21]], 0.6, '#aebde8'),
    ...oT([[-4.2, -1.4], [4.2, -1.4], [3.4, -2.9], [-3.4, -2.9]], trim, 0.5),
    F(E(-4.3, -2.4, 0.7, 0.7, trim)), F(E(4.3, -2.4, 0.7, 0.7, trim)),
  ];
  // The blade's smear trails the chop.
  if (ak && (frame === 1 || frame === 2) && !dead) {
    const [a0, a1] = frame === 1 ? [-0.42, 0.62] : [0.62, 2.66];
    // The arc is squeezed in where it would leave the frame.
    const lim = 42.6 - sx;
    const pt = (a, r) => {
      let ox = Math.sin(a) * r;
      if (ox > lim * 0.8) ox = lim * 0.8 + (ox - lim * 0.8) * 0.22;
      return [sx + ox, Math.max(0.6, sy - Math.cos(a) * r)];
    };
    const sm = [];
    const inner = [];
    for (let i = 0; i <= 8; i++) {
      const a = a0 + ((a1 - a0) * i) / 8;
      sm.push(pt(a, 25));
      inner.unshift(pt(a, 25 - 2 - (i / 8) * 9));
    }
    body.push(F(T([...sm, ...inner], '#e6d8ff')), F(T([...sm.slice(2), ...inner.slice(0, 7)], '#f6f0ff')), ...stroke(sm.slice(2), 0.6, '#ffffff'));
  }
  body.push(...xf(sword, (x, y) => rot([[x + sx, y + sy]], sx, sy, sw)[0]));
  if (ak) {
    const elb = [lerp(30.4, sx, 0.5) + 1.6, lerp(29, sy, 0.5) + (frame < 2 ? 1.6 : -0.4)];
    body.push(...limb([[30.4, 29], elb], 3.2, suit), ...limb([elb, [sx - 0.3, sy - 0.4]], 3.8, plate), ...oE(elb[0], elb[1], 1.8, 1.6, plateL, 0.5));
  } else {
    const elb = [lerp(30.4, sx, 0.42), lerp(29, sy, 0.5)];
    body.push(...limb([[30.4, 29], elb], 3.2, suit), ...limb([elb, [sx - 0.4, sy - 0.6]], 3.8, plate), ...oE(elb[0] - 0.2, elb[1] - 0.2, 1.8, 1.6, plateL, 0.5));
  }
  body.push(...oE(sx, sy - 0.2, 2.1, 2, plateD), F(E(sx + 0.6, sy - 0.9, 0.9, 0.6, plateL)));
  // Front pauldron, layered and gold-rimmed, bouncing a beat late.
  body.push(...mv([...oE(29.6, 26.8, 5.2, 4.4, plate), arc(29.6, 27.4, 5, 3.8, 15, 165, 0.8, trim), arc(29.6, 26.6, 3.8, 2.6, 25, 155, 0.5, plateD), F(E(28.4, 25, 2.4, 1.1, plateL))], 0, clank * 0.8));
  if (ak && frame === 2 && !dead) fxs.push(...burst(42, 54.6, 3.4, '#fff3b0', '#ffffff', 6, 0.4), ...dust(40, 58, 0.8));

  // Legs: dark thighs, plated greaves, pointed sabatons; long heavy strides.
  const legs = [];
  const leg = (hipX, p, back) => {
    const hip = [hipX + hx, 44 + bob];
    const lift = walk ? 3 * Math.max(0, Math.cos(p)) ** 1.3 : 0;
    let fx = walk ? hipX + 6 * Math.sin(p) : hipX + (back ? -1.6 : 2.2);
    if (ak) fx = back ? hipX - 4 + hx * 0.3 : hipX + 5 + hx;
    const fy = 58 - lift;
    const ank = [fx + (ak ? 0 : hx), fy - 2.4];
    const bend = ak ? 1.2 + ak.by * 0.6 : 1.4 + lift * 0.3;
    const knee = [(hip[0] + ank[0]) / 2 + bend, (hip[1] + ank[1]) / 2];
    const pc = back ? plateD : plate;
    // The toe tips up as the foot swings through.
    const toe = walk ? Math.max(0, Math.cos(p)) * 1.2 : 0;
    legs.push(...limb([hip, knee], 4.4, back ? suitD : suit), ...limb([knee, ank], 4.6, pc), ...oE(knee[0] + 0.4, knee[1], 2.2, 1.9, back ? plate : plateL, 0.5));
    legs.push(...oT([[ank[0] - 2.6, fy - 3.2], [ank[0] + 1.4, fy - 3.4], [ank[0] + 4.4, fy - 0.8 - toe], [ank[0] + 4, fy - toe * 0.6], [ank[0] - 2.6, fy]], pc, 0.5));
    if (walk && !dead && plants(p, TAU / 8)) fxs.push(...dust(ank[0] + 1, 58, 0.55));
  };
  leg(19.4, t + Math.PI, true);
  leg(25, t, false);
  out.push(...legs, ...mv(body, hx, bob), ...fxs);
  return { w: 44, h: 58, res: 3, shapes: out };
}

// ---------- Gem Mimic ----------
// A treasure chest that hops on stubby legs: one big gem eye set in the lid, crystal teeth, a long
// lolling tongue, crystals sprouting from its lid, and gems spilling out of its mouth. Its jaws gape
// on every hop and snap shut as it lands; it attacks with a gaping lunge and a chomp.
const HOP = [
  { sq: 0.86, lift: 0, lid: 0.04, air: 0, slide: 0 },
  { sq: 0.95, lift: 0, lid: 0.12, air: 0, slide: -2.6 },
  { sq: 1.1, lift: 1.3, lid: 0.3, air: 0.35, slide: -4.2 },
  { sq: 1.05, lift: 3.5, lid: 0.5, air: 1, slide: 0 },
  { sq: 1, lift: 4.3, lid: 0.58, air: 1, slide: 0 },
  { sq: 1, lift: 3.6, lid: 0.5, air: 1, slide: 0 },
  { sq: 1.06, lift: 1.6, lid: 0.3, air: 0.6, slide: 0 },
  { sq: 0.8, lift: 0, lid: 0.02, air: 0, slide: 2.6 },
];
const MIMIC_IDLE = [
  { sq: 1, lift: 0, lid: 0.16, air: 0 },
  { sq: 0.98, lift: 0, lid: 0.22, air: 0 },
  { sq: 0.97, lift: 0, lid: 0.27, air: 0 },
  { sq: 0.98, lift: 0, lid: 0.2, air: 0 },
  { sq: 1, lift: 0, lid: 0.1, air: 0 },
  { sq: 1.01, lift: 0, lid: 0.12, air: 0 },
];
const MIMIC_ATK = [
  { sq: 0.8, lift: 0, lid: 0.07, air: 0, dx: -2.4, tilt: -0.07, slide: 1.6 },
  { sq: 1.07, lift: 1.4, lid: 0.6, air: 0.8, dx: 2, tilt: 0.05 },
  { sq: 0.86, lift: 0.4, lid: 0.02, air: 0.25, dx: 3, tilt: 0.03 },
  { sq: 1.02, lift: 0, lid: 0.26, air: 0, dx: 1, tilt: 0, slide: -1 },
];

// One big gem eye in a gold bezel, with a cat slit.
function gemEye(x, y, mood, look, wood) {
  const out = [];
  const dk = '#4a2440';
  out.push(F(E(x, y, 3.6, 3.15, '#c99a3a')), F(E(x, y, 3.05, 2.6, mood === 'dead' ? dk : ['blink', 'happy', 'hurt'].includes(mood) ? wood : dk)));
  if (mood === 'blink') return [...out, ...stroke([[x - 2.6, y + 0.1], [x - 1, y + 0.9], [x + 1, y + 0.9], [x + 2.6, y + 0.1]], 0.6, dk), ...stroke([[x - 1.4, y + 0.8], [x - 1.8, y + 1.8]], 0.35, dk), ...stroke([[x + 1.4, y + 0.8], [x + 1.8, y + 1.8]], 0.35, dk)];
  if (mood === 'happy') return [...out, ...stroke([[x - 2.4, y + 1], [x - 1.2, y - 0.6], [x, y - 1.1], [x + 1.2, y - 0.6], [x + 2.4, y + 1]], 0.7, dk)];
  if (mood === 'hurt') return [...out, ...stroke([[x - 2.4, y - 1.2], [x - 0.6, y], [x - 2.4, y + 1.2]], 0.6, dk), ...stroke([[x + 2.4, y - 1.2], [x + 0.6, y], [x + 2.4, y + 1.2]], 0.6, dk)];
  if (mood === 'dead') return [...out, ...stroke([[x - 1.6, y - 1.4], [x + 1.6, y + 1.4]], 0.55, '#c99a3a'), ...stroke([[x - 1.6, y + 1.4], [x + 1.6, y - 1.4]], 0.55, '#c99a3a')];
  const angry = mood === 'angry';
  const g = angry ? '#ff4d7a' : '#4fd6ee';
  const lx = x + look * 0.8;
  const oct = Array.from({ length: 8 }, (_, i) => [lx + Math.cos((i / 8) * TAU + 0.39) * 2.4, y + Math.sin((i / 8) * TAU + 0.39) * 2.15]);
  out.push(F(T(oct, g)), F(T([oct[3], oct[4], oct[5], [lx, y]], mix(g, '#ffffff', 0.45))), F(T([oct[0], oct[1], oct[2], [lx, y + 0.3]], shade(g, -18))));
  out.push(F(E(lx, y, angry ? 0.32 : 0.48, 1.75, '#1e1030')), F(E(lx - 0.9, y - 0.9, 0.55, 0.45, '#ffffff')), F(E(lx + 0.9, y + 1, 0.25, 0.25, '#ffffff')));
  if (angry) out.push(F(T([[x - 3.8, y - 3.6], [x + 3.8, y - 3.6], [x + 3.8, y - 1.7], [x, y - 0.5], [x - 3.8, y - 1.7]], wood)), ...stroke([[x - 3.6, y - 1.8], [x, y - 0.6], [x + 3.6, y - 1.8]], 0.6, dk));
  else out.push(...stroke([[x - 2.9, y - 0.9], [x - 1.4, y - 2.3], [x + 1.4, y - 2.3], [x + 2.9, y - 0.9]], 0.45, dk));
  return out;
}

function mimic(pose, frame, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack';
  const st = (walk ? HOP : ak ? MIMIC_ATK : MIMIC_IDLE)[frame];
  const t = (frame / (walk ? 8 : 6)) * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const wood = '#dc9e70';
  const woodD = '#c4865c';
  const gold = '#f7cd5e';
  const leg = '#b58ad8';
  const mood0 = ak ? 0 : angry ? 0.2 : hurt ? -0.12 : dead ? 0.22 : mood === 'happy' ? 0.1 : 0;
  const lid = Math.min(ak ? 0.72 : 0.62, Math.max(0.02, st.lid + mood0));
  const sy = st.sq * (hurt ? 0.94 : 1);
  const sx = 1 + (1 - sy) * 0.8;
  const lift = st.lift;
  const H = [5.6, 21];
  const out = [];
  const look = walk ? 0.6 : ak ? 0.8 : [0, 0.8, 0.8, 0, -0.8, -0.8][frame];

  // Legs: planted while it's down (sliding back as it moves on), tucked and dangling in the air.
  const legAt = (x, c, back) => {
    const top = [20 + (x - 20) * sx, 30.4 - lift];
    const sl = st.slide ?? 0;
    const foot = st.air ? [top[0] - 1.6 * st.air + sl, top[1] + 4.6 - st.air * 0.6] : [top[0] + (back ? -1.2 : 1.2) * (1.6 - sy) + sl, 34.8];
    const knee = [(top[0] + foot[0]) / 2 + (st.air ? -0.8 : 1.4), (top[1] + foot[1]) / 2];
    out.push(...limb([top, knee, foot], 2.6, c, 0.6), ...oE(foot[0] + 0.4, foot[1] + 0.1, 2.1, 1.1, c, 0.6));
    for (const k of [-1, 0, 1]) out.push(F(E(foot[0] + 1.5 + k * 0.9, foot[1] + 0.8, 0.35, 0.35, '#fff6ee')));
  };
  legAt(10, shade(leg, -10), true);
  legAt(28, shade(leg, -10), true);
  legAt(12.6, leg, false);
  legAt(30.6, leg, false);

  const chest = [];
  const lidPts = (pts) => rot(pts, H[0], H[1], -lid);
  const [fx, fy] = lidPts([[32.4, 21]])[0];
  chest.push(F(T([H, [fx, fy], [32.2, 21.4], [6, 21.4]], '#43213e')));
  chest.push(F(E(20, 21, 6, 1.6 + lid * 2, '#ffcf5a')), F(E(16, 20.4, 1.2, 1.2, '#8fe6ff')), F(E(24.6, 20.2, 1, 1, '#ff9ed2')), F(E(19.6, 19.8, 0.7, 0.7, '#fff6c9')));
  // Tongue: lolling and flapping a beat behind the hop, lashing out in the lunge.
  const tl = dead ? 1.1 : hurt ? 0.4 : 1;
  const wag = dead ? 0 : walk ? Math.sin(t - 1.6) * 1.6 : ak ? 0 : Math.sin(t) * 1.2;
  const flick = walk ? -Math.cos(t - 1.4) * 1.4 : 0;
  if (ak && frame === 1 && !dead) {
    const tp = [[24, 20.6], [28.4, 19.6], [32.6, 18.6], [35.6, 18.4], [37.4, 19.6], [37.8, 21.4]];
    chest.push(...oRibbon(tp, [3.6, 3.6, 3.4, 3, 2.6, 1.6], '#ff8fb3', 0.6), ...stroke(tp.slice(1, 5).map(([x, y]) => [x, y + 0.1]), 0.5, '#e0628e'));
  } else if (tl > 0.5 && !(ak && frame === 2)) {
    const tp = [[24, 20.6], [28.4, 20.2], [32.6, 21.2], [34.4 + wag * 0.3, 23.4 * tl + 0.4 + flick * 0.4], [34.6 + wag, 26.4 * tl + flick * 0.8], [33.4 + wag * 1.2, 28.4 * tl + flick]];
    chest.push(...oRibbon(tp, [3.6, 3.6, 3.4, 3, 2.6, 1.6], '#ff8fb3', 0.6), F(E(33.6 + wag * 1.2, 28 * tl + flick, 1.4, 1, '#ff8fb3')));
    chest.push(...stroke(tp.slice(1, 5).map(([x, y]) => [x - 0.2, y]), 0.5, '#e0628e'));
  } else {
    chest.push(F(E(30, 20.8, 2.6, 1, '#ff8fb3')));
  }
  // Base: planks, gold straps and trim, a hasp lock at the front.
  chest.push(...oT([[6, 21], [32, 21], [32, 31], [6, 31]], wood));
  chest.push(F(T([[6, 21], [9, 21], [9, 31], [6, 31]], woodD)), ...stroke([[6.4, 25.8], [31.6, 25.8]], 0.5, '#a96d48'));
  for (const x of [10, 26.4]) chest.push(F(T([[x, 21], [x + 2.6, 21], [x + 2.6, 31], [x, 31]], gold)), ...stroke([[x + 0.2, 21], [x + 0.2, 31]], 0.4, '#c99a3a'), F(E(x + 1.3, 23.4, 0.45, 0.45, '#fff2b0')), F(E(x + 1.3, 28.6, 0.45, 0.45, '#fff2b0')));
  chest.push(F(T([[6, 29.4], [32, 29.4], [32, 31], [6, 31]], gold)), ...stroke([[6, 29.4], [32, 29.4]], 0.4, '#c99a3a'));
  chest.push(...oT([[31, 21.2], [34, 21.2], [34, 25.4], [31, 25.4]], gold, 0.5), F(E(32.5, 22.8, 0.6, 0.6, '#5a3a3a')), F(T([[32.2, 23], [32.8, 23], [32.7, 24.4], [32.3, 24.4]], '#5a3a3a')));
  // Crystal teeth on the base rim, sized to how far the mouth gapes.
  const cap = ak ? 4.6 : angry ? 3.4 : 2.8;
  const gape = (x) => (x - H[0]) * Math.sin(lid);
  for (let x = 13; x <= 31; x += 3) {
    const h = Math.min(cap, gape(x) * 0.42);
    if (h > 0.5) chest.push(...oT([[x - 1.2, 21.2], [x, 21.2 - h], [x + 1.2, 21.2]], x % 2 ? '#c9f4ff' : '#eadbff', 0.4));
  }
  // Lid: planks, straps, crystals, the gem eye; rotates open about the back hinge.
  const lidS = [];
  lidS.push(...crystal(11.2, 14, 3.6, 7.4, -0.4, '#8fe6ff', '#dcfaff'), ...crystal(16.2, 13.4, 4.4, 9, -0.12, '#c3a8ff', '#eee4ff'), ...crystal(20.8, 13.4, 3, 5.6, 0.22, '#ffadd8', '#ffe2f1'));
  lidS.push(...oT([[5.6, 21], [5.6, 16], [7.4, 14], [12, 13], [26, 13], [30.6, 14], [32.4, 16], [32.4, 21]], wood));
  lidS.push(F(T([[5.6, 21], [5.6, 16], [7.4, 14], [9.4, 13.6], [9.4, 21]], woodD)), F(E(24, 14.6, 4, 0.9, '#f0bc90')));
  for (const x of [10, 26.4]) lidS.push(F(T([[x, 13.2], [x + 2.6, 13.1], [x + 2.6, 21], [x, 21]], gold)), ...stroke([[x + 0.2, 13.2], [x + 0.2, 21]], 0.4, '#c99a3a'), F(E(x + 1.3, 15.4, 0.45, 0.45, '#fff2b0')));
  lidS.push(F(T([[5.6, 19.6], [32.4, 19.6], [32.4, 21], [5.6, 21]], gold)), ...stroke([[5.6, 19.6], [32.4, 19.6]], 0.4, '#c99a3a'));
  // Fangs along the lid's lip.
  for (let x = 14.5; x <= 31; x += 3) {
    const h = Math.min(cap, gape(x) * 0.42);
    if (h > 0.5) lidS.push(...oT([[x - 1.2, 21], [x, 21 + h], [x + 1.2, 21]], x % 2 ? '#eadbff' : '#c9f4ff', 0.4));
  }
  lidS.push(F(E(19.6, 16.6, 6.6, 3.7, '#f0b486')));
  lidS.push(...gemEye(19.6, 16.4, mood, look, '#f0b486'));
  chest.push(...xf(lidS, (x, y) => lidPts([[x, y]])[0]));
  // Gems tumbling out mid-hop.
  if (walk && st.air > 0.9 && !dead) {
    const u = (frame - 3) / 2;
    chest.push(...oT([[33 + u * 2.4, 17 - u * 2], [34.4 + u * 2.4, 15.6 - u * 2], [35.8 + u * 2.4, 17 - u * 2], [34.4 + u * 2.4, 18.8 - u * 2]], '#8fe6ff', 0.5));
    chest.push(...oE(31 + u * 2, 15 - u * 3, 0.9, 0.9, '#ffcf5a', 0.5));
  }
  const tilt = st.tilt ?? 0;
  const dx = st.dx ?? 0;
  const shaped = xf(chest, (x, y) => [20 + (x - 20) * sx, 31 - (31 - y) * sy - lift], sx, sy);
  out.push(...spin(shaped, 20, 31, tilt));
  const fxs = [];
  if (ak && frame === 2 && !dead) fxs.push(...burst(35.4, 19.6, 3.6, '#fff3b0', '#ffffff', 7, 0.2), ...streaks([[36.6, 14, 38.6, 12.4], [37.8, 17.4, 39.6, 16.6], [37.4, 24.6, 39.4, 25.6]], '#ffffff', 0.6));
  if (walk && frame === 7 && !dead) fxs.push(...dust(10, 35, 0.5), ...dust(31, 35, 0.5));
  return { w: 40, h: 40, res: 3, shapes: mv([...mv(out, dx, 0), ...fxs], 0, 4) };
}

// ---------- Crystal Golem ----------
// A hulking lavender-stone golem: crystal clusters on its back and shoulders, a pulsing gem core in a
// rune socket, a little head sunk between its shoulders with faceted socket lights, and huge fists.
// It stomps slowly enough to shake the ground, and attacks by raising both fists and slamming down.

// Faceted lights glowing in stone sockets.
function gemEyes(cx, cy, k, mood, col, halo, look = 0) {
  const out = [];
  const lite = mix(col, '#ffffff', 0.55);
  for (const s of [-1, 1]) {
    const x = cx + s * 1.8 * k + look;
    const y = cy;
    if (halo && mood !== 'dead') out.push(F(E(x, y, 1.7 * k, 1.6 * k, halo)));
    switch (mood) {
      case 'blink':
        out.push(F(T([[x - 1.1 * k, y + 0.2 * k], [x, y - 0.1 * k], [x + 1.1 * k, y + 0.2 * k], [x, y + 0.5 * k]], col)));
        break;
      case 'happy':
        out.push(...stroke([[x - 1 * k, y + 0.6 * k], [x, y - 0.5 * k], [x + 1 * k, y + 0.6 * k]], 0.5 * k, col));
        break;
      case 'hurt':
        out.push(...stroke([[x - s * 0.9 * k, y - 0.9 * k], [x + s * 0.8 * k, y], [x - s * 0.9 * k, y + 0.9 * k]], 0.5 * k, col));
        break;
      case 'dead':
        out.push(...stroke([[x - 0.8 * k, y - 0.8 * k], [x + 0.8 * k, y + 0.8 * k]], 0.45 * k, col), ...stroke([[x - 0.8 * k, y + 0.8 * k], [x + 0.8 * k, y - 0.8 * k]], 0.45 * k, col));
        break;
      case 'angry': {
        const p = [[x + s * 1.3 * k, y - 1 * k], [x - s * 1.25 * k, y + 0.05 * k], [x - s * 0.7 * k, y + 0.9 * k], [x + s * 1.1 * k, y + 0.5 * k]];
        out.push(F(T(p, col)), F(T([p[0], p[1], [x, y + 0.1 * k]], lite)), F(E(x - s * 0.1 * k, y + 0.2 * k, 0.3 * k, 0.3 * k, '#ffffff')));
        break;
      }
      default: {
        const p = [[x, y - 1.35 * k], [x + 1.05 * k, y - 0.1 * k], [x, y + 1.2 * k], [x - 1.05 * k, y - 0.1 * k]];
        out.push(F(T(p, col)), F(T([p[0], p[3], [x, y - 0.05 * k]], lite)), F(T([p[1], p[2], [x, y - 0.05 * k]], shade(col, -14))), F(E(x - 0.2 * k, y - 0.5 * k, 0.3 * k, 0.3 * k, '#ffffff')));
      }
    }
  }
  return out;
}

const GOLEM_ATK = [
  { bx: -1.6, by: -0.6, back: [36, 10], front: [50, 9.6], nod: -1.2 },
  { bx: 0.6, by: 0.6, back: [44, 36], front: [61.6, 41], nod: 0.6 },
  { bx: 1.4, by: 3, back: [52, 63], front: [61.6, 64], nod: 1.6 },
  { bx: 0.8, by: 1.6, back: [46, 58], front: [60, 59], nod: 0.8 },
];

function golem(pose, frame, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? GOLEM_ATK[frame] : null;
  const n = walk ? 8 : 6;
  const t = ak ? frame * 1.2 : (frame / n) * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry' || !!ak;
  const st = '#a49bc4';
  const stD = '#847aa6';
  const stL = '#c4bce0';
  const stDD = '#655b86';
  const glow = angry ? '#ff7fb0' : dead ? '#a59dbd' : '#86f0ff';
  const coreC = angry ? '#ff5f9a' : dead ? '#b4aec6' : '#ff8fca';
  // A slow, ground-shaking stomp: the whole bulk drops onto each planted foot.
  const bob = ak ? ak.by : walk ? 2.3 * Math.sin(t - 0.3) ** 2 : (Math.sin(t) * 0.5 + 0.5) * 0.8;
  const hx = (hurt ? -1.6 : 0) + (ak ? ak.bx : walk ? Math.cos(t) * 0.5 : 0);
  const swing = walk ? Math.sin(t - 0.6) * 4.6 : Math.sin(t) * 0.6;
  const look = ak ? 0.4 : walk ? 0.3 : Math.sin(t) * 0.8;
  const out = [];
  const up = [];
  const fxs = [];

  // Back crystal cluster.
  up.push(...crystal(13, 33, 4.4, 11, -0.95, '#8fe6ff', '#dcfaff'), ...crystal(18, 27, 5.4, 18, -0.5, '#8fe6ff', '#dcfaff'),
    ...crystal(24, 23, 6.4, 21, -0.18, '#c3a8ff', '#eee4ff'), ...crystal(30, 20.6, 4.6, 13, 0.15, '#ffadd8', '#ffe2f1'));
  // Back arm: hangs and swings heavily, or rises overhead for the slam.
  const bf = ak ? ak.back : [12.4 + swing, 60.6 - Math.abs(swing) * 0.25];
  const bel = ak ? [lerp(21, bf[0], 0.5) - (frame === 0 ? 4 : 0), lerp(33, bf[1], 0.5) + (frame === 0 ? 2 : -3)] : [14.6 + swing * 0.4, 45];
  up.push(...limb([[21, 33], bel, [bf[0] + 0.6, bf[1] - (ak && !frame ? -4 : 4)]], 9.4, stD), ...oE(bf[0], bf[1], 7, 6.2, stD), ...stroke([[bf[0] - 4, bf[1] - 1.4], [bf[0] + 3, bf[1] - 2.6]], 0.6, stDD));
  // Torso boulder.
  const torso = [[15, 32], [21, 21], [33, 16.4], [47, 17.6], [57, 25], [60, 39], [56.4, 51], [46, 58], [28, 58], [18.6, 52], [14.4, 42]];
  up.push(...oT(torso, st));
  up.push(F(T([[15, 32], [21, 21], [25, 19.4], [21, 30], [20, 42], [25, 52], [34, 58], [28, 58], [18.6, 52], [14.4, 42]], stD)));
  up.push(F(E(48, 23, 7.6, 3.6, stL)), F(E(56, 34, 1.6, 4, stL)));
  up.push(F(T([[31, 34.6], [37, 33], [48, 33.2], [53, 35.4], [48, 36], [37, 35.8]], stL)));
  up.push(F(T([[18, 44], [22, 40.6], [24.6, 44.6], [21, 48]], shade(stD, 3))), F(T([[47, 52], [53, 48.6], [54, 52.4], [49, 55.6]], stD)));
  up.push(...stroke([[26, 46], [30, 49.4], [29, 54]], 0.9, stDD), ...stroke([[26.2, 46.4], [30, 49.6], [29.2, 53.6]], 0.35, glow));
  up.push(...stroke([[51, 46], [54.6, 44], [56, 47]], 0.9, stDD), ...stroke([[51.2, 46.2], [54.6, 44.3], [55.8, 46.8]], 0.35, glow));
  up.push(F(E(24, 41, 1.6, 1.1, stDD)), F(E(36, 54, 1.2, 0.8, stDD)), F(E(53, 41.6, 1, 0.7, stDD)));
  // Core: rune socket and pulsing gem (it blazes as the golem winds up).
  const pulse = dead ? 0.85 : 1 + 0.09 * Math.sin(t * 2) + (angry ? 0.12 : 0) + (ak && frame === 0 ? 0.12 : 0);
  up.push(...oE(42.4, 43.6, 6.2, 6, stDD, 0.5), arc(42.4, 43.6, 5.4, 5.2, 0, 360, 0.6, mix(glow, stDD, 0.45)));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4 + (walk ? 0 : t * 0.25);
    up.push(F(E(42.4 + Math.cos(a) * 5.1, 43.6 + Math.sin(a) * 4.9, 0.55, 0.55, glow)));
  }
  const g = (dx, dy) => [42.4 + dx * pulse, 43.6 + dy * pulse];
  up.push(F(T([g(0, -4.4), g(3.6, 0), g(0, 4.4), g(-3.6, 0)], coreC)), F(T([g(0, -4.4), g(3.6, 0), g(0, 0.6), g(-1, -0.4)], mix(coreC, '#ffffff', 0.35))), F(T([g(0, -2.4), g(1.6, 0), g(0, 2.2), g(-1.6, 0)], mix(coreC, '#ffffff', 0.7))));
  if (!dead) up.push(F(E(41.2, 41.8, 0.6, 0.8, '#ffffff')));
  // Head, sunk between the shoulders; it nods a beat after each stomp.
  const nod = ak ? ak.nod : walk ? Math.sin(2 * t - 1.4) * 0.7 : Math.sin(t) * 0.4;
  const head = [];
  head.push(...oE(43, 25, 10, 8.8, st), F(E(39.4, 30.6, 5.4, 2, stD)), F(E(46.6, 18.8, 4.4, 1.8, stL)));
  head.push(...crystal(46.4, 17.6, 3.2, 6.6, 0.35, '#c3a8ff', '#eee4ff'));
  head.push(F(E(44.6 + look * 0.4, 26.2, 7, 4.6, '#3a3158')), F(E(44.8 + look * 0.4, 27, 6.2, 3.4, '#2f2848')));
  head.push(...gemEyes(44.8 + look * 0.4, 26.4, 1.5, mood === 'idle' && ak ? 'angry' : mood, glow, mix(glow, '#3a3158', 0.55), look * 0.5));
  const bt = angry ? 2.6 : mood === 'happy' ? -1 : 0.6;
  const brow = [[35.6, 21.4 - bt * 0.4], [39, 19.8 - bt * 0.3], [44.6, 21 + bt * 0.6], [50, 19.6 - bt * 0.3], [53.4, 21 - bt * 0.4], [52.6, 23.2 - bt * 0.2], [48.6, 22.4], [44.6, 23.4 + bt * 0.7], [40.4, 22.6], [36.4, 23.4 - bt * 0.2]];
  head.push(...oT(brow, stD, 0.5), F(T([brow[0], brow[1], brow[2], brow[3], brow[4], [brow[4][0] - 1, brow[4][1] + 0.9], [brow[3][0], brow[3][1] + 0.9], [brow[2][0], brow[2][1] + 0.9], [brow[1][0], brow[1][1] + 0.9], [brow[0][0] + 1, brow[0][1] + 0.9]], stL)));
  if (ak && frame === 2) head.push(F(E(44.8, 29.8, 2, 1.1, glow)), F(E(44.8, 30, 1.2, 0.6, '#3a3158')));
  else if (angry) head.push(F(T([[41.4, 29], [48.4, 29], [47.6, 30.4], [46.4, 29.6], [45, 30.6], [43.8, 29.6], [42.4, 30.4]], glow)));
  else if (hurt) head.push(F(E(44.8, 29.4, 0.9, 0.8, glow)));
  else if (mood === 'happy') head.push(arc(44.8, 28.4, 1.8, 1.3, 20, 160, 0.5, glow));
  else if (!dead) head.push(...stroke([[43.6, 29.6], [46, 29.6]], 0.45, mix(glow, '#3a3158', 0.4)));
  if (!dead) head.push(F(E(37.2, 28.2, 1.4, 0.7, '#e9a8cc')), F(E(52.6, 28, 1.2, 0.7, '#e9a8cc')));
  up.push(...mv(head, -3, nod));
  // Front arm with shards on the forearm and a huge fist, under a crystal-crusted shoulder boulder.
  const farm = [];
  const ff = ak ? ak.front : [57.8 - swing * 0.8, 62 - Math.abs(swing) * 0.25];
  const fel = ak ? [frame === 0 ? 63 : lerp(57, ff[0], 0.5) + 3, frame === 0 ? 24 : lerp(36, ff[1], 0.5)] : [61 - swing * 0.3, 46];
  farm.push(...limb([[57, 36], fel], 8.6, stD), ...limb([fel, [ff[0] + 0.4, ff[1] + (ak && !frame ? 4 : -4)]], 10.6, st), ...oE(fel[0], fel[1] + 0.4, 4.6, 4, st, 0.5), F(E(fel[0] + 1.4, fel[1] - 1, 2, 1.4, stL)));
  if (!ak) farm.push(...crystal(fel[0] + 2.6, fel[1] + 3, 2.8, 5, 1.05, '#8fe6ff', '#dcfaff'));
  farm.push(...oE(ff[0], ff[1], 8, 7, st), F(E(ff[0] + 2, ff[1] - 3, 3.6, 1.6, stL)));
  farm.push(...stroke([[ff[0] - 4.6, ff[1] + 1], [ff[0] + 4, ff[1] - 0.4]], 0.6, stDD), ...stroke([[ff[0] - 1, ff[1] - 1], [ff[0] - 0.4, ff[1] + 4]], 0.6, stDD), ...stroke([[ff[0] + 2.6, ff[1] - 0.8], [ff[0] + 3.2, ff[1] + 3.6]], 0.6, stDD));
  // Raised for the slam, the arm comes in front of the shoulder.
  const raised = ak && frame < 2;
  if (!raised) up.push(...farm);
  up.push(...crystal(51.6, 27, 4, 11, 0.1, '#ffadd8', '#ffe2f1'), ...crystal(56.6, 26, 5, 14, 0.4, '#8fe6ff', '#dcfaff'), ...crystal(61.4, 29.6, 3.4, 8, 0.85, '#c3a8ff', '#eee4ff'));
  up.push(...oE(56.4, 33.4, 8.6, 6.8, st), F(E(54.6, 30.6, 4.4, 2, stL)), F(E(52, 37.4, 3.6, 1.3, stD)), F(E(60.4, 36.4, 1, 0.7, stDD)));
  if (raised) up.push(...farm);
  // A glint travelling over the crystals.
  if (!dead) {
    const gl = [[18.6, 11], [24.4, 4.6], [30.6, 9.4], [57.6, 13.6], [51.8, 17.4], [44.6, 12.2]][frame % 6];
    up.push(F(T([[gl[0], gl[1] - 1.8], [gl[0] + 0.45, gl[1] - 0.45], [gl[0] + 1.8, gl[1]], [gl[0] + 0.45, gl[1] + 0.45], [gl[0], gl[1] + 1.8], [gl[0] - 0.45, gl[1] + 0.45], [gl[0] - 1.8, gl[1]], [gl[0] - 0.45, gl[1] - 0.45]], '#ffffff')));
  }
  if (hurt) up.push(...oT([[8, 14], [10, 12.6], [11, 14.6], [9, 15.6]], stD, 0.5), ...oT([[4, 22], [5.6, 21], [6.2, 22.8]], '#8fe6ff', 0.5));
  if (ak && frame === 0 && !dead) up.push(...oT([[40.6, 19.4], [42, 18.6], [42.4, 20], [41, 20.6]], stD, 0.4), ...oT([[55.6, 20], [56.8, 19.4], [57, 20.8]], stD, 0.4));
  if (ak && frame === 1 && !dead) fxs.push(...streaks([[ff[0] - 2, ff[1] - 14, ff[0] - 1, ff[1] - 9], [ff[0] + 4, ff[1] - 15, ff[0] + 4.4, ff[1] - 10], [ff[0] - 8, ff[1] - 12, ff[0] - 6.4, ff[1] - 7.4]], '#f3eaff', 0.8));
  if (ak && frame === 2 && !dead) {
    fxs.push(...dust(50, 74, 1.5), ...dust(64, 74, 1.1), ...burst(62, 68, 6.4, '#fff3b0', '#ffffff', 8, 0.2));
    fxs.push(...oT([[48, 64], [50, 62.6], [51, 64.6]], stD, 0.4), ...oT([[67, 62], [68.6, 61], [69, 63]], '#8fe6ff', 0.4), ...oT([[44, 67.4], [45.4, 66.4], [45.8, 68]], stD, 0.4));
  }

  // Legs: short and thick, long slow strides, planted with each stomp.
  const legs = [];
  const leg = (hipX, p, c) => {
    const lift = walk ? 3.4 * Math.max(0, Math.cos(p)) ** 1.4 : 0;
    let fx = walk ? hipX + 7.5 * Math.sin(p) : hipX;
    if (ak) fx = hipX + (c === stD ? -3 : 4) * (frame ? 1 : 0.6);
    const hip = [hipX + hx, 55 + bob];
    const ank = [fx + hx * (ak ? 0.3 : 1), 70 - lift];
    const knee = [(hip[0] + ank[0]) / 2 + 1.6 + bob * 0.4, (hip[1] + ank[1]) / 2];
    legs.push(...limb([hip, knee, ank], 10.4, c), ...oE(ank[0] + 1.6, 74 - lift - 3.2, 7.2, 3.2, c), F(E(ank[0] + 2.6, 74 - lift - 4.6, 3.6, 1, mix(c, '#ffffff', 0.2))));
    legs.push(...stroke([[ank[0] + 4.2, 74 - lift - 2.2], [ank[0] + 4.4, 74 - lift - 0.4]], 0.5, stDD), ...stroke([[ank[0] + 6.2, 74 - lift - 2.6], [ank[0] + 6.6, 74 - lift - 0.8]], 0.5, stDD));
    if (walk && !dead && plants(p, TAU / 8)) fxs.push(...dust(ank[0] + 1.6, 74, 1.1), ...oT([[ank[0] - 6, 69], [ank[0] - 4.8, 68], [ank[0] - 4.4, 69.6]], stD, 0.4), ...oT([[ank[0] + 9, 68.4], [ank[0] + 10.2, 67.6], [ank[0] + 10.4, 69]], stD, 0.4));
  };
  leg(28, t + Math.PI, stD);
  leg(45, t, st);
  out.push(...legs, ...mv(up, hx, bob), ...fxs);
  return { w: 70, h: 74, res: 3, shapes: out };
}

// ---------- Wraith ----------
// A hooded, tattered specter: two pinpoint lights in a bottomless hood, ragged billowing robes, bony
// claws, and rattling chains with a padlock and a broken shackle. It slides along in an eerie lean,
// its hem rippling behind, and attacks by lunging with its claws and a scream.
function chainLinks(a, b, sag, n, c, cd, hole) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = a[0] + (b[0] - a[0]) * u;
    const y = a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * sag;
    if (i % 2) out.push(F(E(x, y, 0.55, 0.95, cd)));
    else out.push(F(E(x, y, 1.15, 0.85, c)), F(E(x, y, 0.45, 0.25, hole)));
  }
  return out;
}

// Two pinpoint lights deep in the hood.
function pinEyes(cx, cy, k, mood, col, hood, look = 0) {
  const out = [];
  const halo = mix(col, hood, 0.7);
  for (const s of [-1, 1]) {
    const x = cx + s * 2 * k + look;
    const y = cy;
    switch (mood) {
      case 'blink':
        out.push(F(E(x, y + 0.2 * k, 0.9 * k, 0.25 * k, halo)), F(E(x, y + 0.2 * k, 0.5 * k, 0.12 * k, col)));
        break;
      case 'happy':
        out.push(arc(x, y + 0.6 * k, 0.9 * k, 0.8 * k, 200, 340, 0.4 * k, col));
        break;
      case 'hurt':
        out.push(...stroke([[x - s * 0.8 * k, y - 0.8 * k], [x + s * 0.6 * k, y], [x - s * 0.8 * k, y + 0.8 * k]], 0.4 * k, col));
        break;
      case 'dead':
        out.push(F(E(x, y + 0.4 * k, 0.35 * k, 0.35 * k, halo)));
        break;
      case 'angry':
        out.push(F(T([[x + s * 1.6 * k, y - 1.1 * k], [x - s * 1.2 * k, y + 0.05 * k], [x + s * 0.6 * k, y + 0.5 * k]], halo)), F(E(x, y, 1.1 * k, 1.1 * k, halo)), F(E(x, y, 0.6 * k, 0.6 * k, col)), F(E(x, y, 0.3 * k, 0.3 * k, '#ffffff')));
        break;
      default:
        out.push(F(E(x, y, 1.2 * k, 1.2 * k, halo)), F(E(x, y, 0.55 * k, 0.55 * k, col)), F(E(x - 0.1 * k, y - 0.1 * k, 0.26 * k, 0.26 * k, '#ffffff')));
    }
  }
  return out;
}

const WRAITH_ATK = [
  { dx: -0.8, dy: -1.2, lean: -0.05, fh: [29.6, 17.6], curl: -0.8 },
  { dx: 1.2, dy: 0.4, lean: 0.1, fh: [31.2, 26.6], curl: 0.2 },
  { dx: 1.4, dy: 0.8, lean: 0.09, fh: [31.4, 34], curl: 1.6 },
  { dx: 0.8, dy: 0.3, lean: 0.06, fh: [32.6, 31.4], curl: 0.8 },
];

function wraith(pose, frame, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? WRAITH_ATK[frame] : null;
  const n = walk ? 8 : 6;
  const t = ak ? frame * 1.3 : (frame / n) * TAU;
  const dead = mood === 'dead';
  const amp = dead ? 0 : walk ? 1.25 : ak ? 0.6 : 0.55;
  const hurt = mood === 'hurt';
  const angry = mood === 'angry' || !!ak;
  const robe = '#5f5490';
  const robeL = '#8073b4';
  const robeD = '#463c6e';
  const hood = '#1c1530';
  const chain = '#d2cce4';
  const chainD = '#9188ae';
  const claw = '#e8eeff';
  const eyeC = angry ? '#ff6f9f' : dead ? '#9890b0' : '#ffe36b';
  const out = [];
  const fxs = [];
  // The hem ripples back in travelling waves; in the slide it streams out behind.
  const w = (k) => Math.sin(t - k * 0.9) * 1.2 * amp;
  const tr = (k) => Math.sin(t - k * 0.7) * 1.4 * amp - (walk ? k * 0.55 : ak && frame ? k * 0.5 : 0);

  // Ghost wisps trailing below.
  if (!dead) {
    for (let i = 0; i < 3; i++) {
      const u = ((ak ? frame / 4 : frame / n) + i / 3) % 1;
      out.push(F(E(10 + i * 7 - u * (walk ? 9 : 4), 46 + u * 3, 1.3 - u * 0.6, 0.9 - u * 0.4, '#b9b0e6')));
    }
  }
  // Back sleeve and claw.
  const bh = ak ? [[3.6, 27], [6.6, 32.6], [6.2, 33.4], [5.4, 32]][frame] : [4.6 + tr(1) * 0.5, 31.4 + w(1) * 0.4];
  out.push(...oT([[12.4, 20], [8, 25.6], [bh[0] - 1.6, bh[1] - 0.6], [bh[0] + 0.4, bh[1] + 1.2], [bh[0] + 2.4, bh[1] + 0.2], [13.6, 27]], robeD));
  for (const [dx, dy] of [[-1.6, 3.6], [0, 4.2], [1.6, 3.4]]) out.push(...stroke([[bh[0] + 0.2, bh[1] + 0.6], [bh[0] + dx * 0.6, bh[1] + dy * 0.6], [bh[0] + dx, bh[1] + dy]], 0.8, shade(claw, -8)));
  // Waist chain trailing back, swinging late.
  out.push(...chainLinks([11, 36], [2.6 + tr(2), 42 + w(3) * 0.6], 1.4, 7, chainD, shade(chainD, -12), robeD));
  // The robe.
  const hem = [[31, 44], [30.2, 49.2 + w(0)], [27.2, 46.2], [24.6, 50 + w(1)], [21.6, 46.4], [18.6, 49.6 + w(2)], [15.6, 46], [12 + tr(3) * 0.5, 48.8 + w(3)], [9.4 + tr(3) * 0.6, 44.4], [5 + tr(4), 46.4 + w(4)], [7.6 + tr(3) * 0.4, 38], [9, 28]];
  const robeP = [[3.4 + tr(1) * 0.8, 6.2 + w(1) * 0.4], [9, 4.4], [14, 2], [20, 1.2], [27.4, 3.6], [31.6, 10], [32.2, 18], [33, 26], [32.6, 36], ...hem, [10, 18], [9.2, 13.6]];
  out.push(...oT(robeP, robe));
  out.push(F(T([[9, 28], [7.6 + tr(3) * 0.4, 38], [5 + tr(4), 46.4 + w(4)], [9.4 + tr(3) * 0.6, 44.4], [12 + tr(3) * 0.5, 48.8 + w(3)], [13.4, 40], [13, 28], [11, 18], [10, 18]], robeD)));
  out.push(...stroke([[17, 30], [16 + tr(2) * 0.3, 40], [15.6 + tr(2) * 0.5, 45.6]], 0.7, robeD), ...stroke([[23.6, 30], [24 + tr(1) * 0.3, 40], [24.4 + tr(1) * 0.4, 49]], 0.7, robeD));
  out.push(...stroke([[28.6, 28], [29.4, 38], [28.6, 45]], 0.9, robeL), ...stroke([[20, 32], [20.4 + tr(1) * 0.3, 44]], 0.6, robeL));
  const fade = mix(robe, '#c9c0f0', 0.28);
  out.push(F(T([[31.6, 42], ...hem.slice(1, 9), [10.4, 41.6], [16, 43], [22, 42.4], [27, 43.2]], fade)));
  out.push(F(T([[30.2, 47.4 + w(0) * 0.8], [27.2, 46.2], [24.6, 48.8 + w(1) * 0.8], [21.6, 46.4], [18.6, 48.6 + w(2) * 0.8], [15.6, 46], [12 + tr(3) * 0.5, 47.4 + w(3) * 0.8], [9.4 + tr(3) * 0.6, 44.4], [12, 46], [15.6, 46], ...hem.slice(1, 6).reverse()], mix(robe, '#e0daff', 0.45))));
  // Hood: lighter rim, bottomless dark inside, a fold over the brow. It sways a beat late.
  const hl = walk ? Math.sin(t - 1.2) * 0.5 : ak ? [-0.6, 0.6, 0.4, 0.2][frame] : Math.sin(t - 1) * 0.3;
  const look = ak ? 0.6 : walk ? 0.5 : Math.sin(t) * 0.8;
  const hd = [];
  hd.push(E(23, 14.4, 8.6, 8.8, robeL), F(E(23.8, 15.4, 6.8, 7.2, hood)));
  hd.push(F(T([[16, 9], [20, 6.4], [27, 6.2], [30.4, 9.4], [26, 8.6], [20, 9.2]], robeL)));
  hd.push(F(E(25, 11, 4.6, 1.2, shade(hood, 4))));
  const eyeY = 14.6 + (dead ? 1 : 0);
  hd.push(...pinEyes(25, eyeY, 1.15, mood === 'idle' && ak ? 'angry' : mood, eyeC, hood, look));
  const scream = ak && (frame === 1 || frame === 2) && !dead;
  if (scream) hd.push(F(E(25.4 + look, 19.4, 2, 2.6, mix(eyeC, hood, 0.75))), F(E(25.4 + look, 19.6, 1.3, 1.9, '#08050f')), F(E(25.4 + look, 20.8, 0.8, 0.5, mix(eyeC, hood, 0.5))));
  else if (angry && !dead) hd.push(F(T([[21.6, 18.6], [28.4, 18.4], [27.6, 20.4], [26.6, 19.4], [25.4, 20.8], [24.4, 19.4], [23.2, 20.6], [22.4, 19.4]], mix(eyeC, hood, 0.15))));
  else if (hurt) hd.push(F(E(25, 19.6, 0.9, 1, mix(eyeC, hood, 0.3))));
  else if (mood === 'happy') hd.push(arc(25, 18.6, 1.6, 1.2, 20, 160, 0.5, mix(eyeC, hood, 0.2)));
  out.push(...mv(hd, hl * 0.6, hl * 0.3));
  // Diagonal chain across the robe with a padlock.
  out.push(...chainLinks([10, 26], [31.6, 35.4], 1.6 + (walk ? Math.sin(t - 1.8) * 0.5 : 0), 12, chain, chainD, robeD));
  const pk = walk ? Math.sin(t - 2) * 0.8 : 0;
  out.push(...mv([...oT([[24.4, 33.6], [28, 33.4], [28.2, 37], [24.4, 37.2]], '#ffd66b', 0.5), arc(26.2, 33.6, 1.3, 1.6, 180, 360, 0.6, '#c9c4d6'), F(E(26.3, 35, 0.45, 0.45, '#6a4a3a')), F(T([[26.1, 35.2], [26.5, 35.2], [26.4, 36.4], [26.2, 36.4]], '#6a4a3a'))], pk * 0.5, Math.abs(pk) * 0.3));
  // Front sleeve reaching out, with a bony claw and a dangling broken shackle.
  const reach = [Math.sin(t) * 0.8 * amp + (angry && !ak ? 1 : 0), Math.cos(t) * 0.6 * amp + (dead ? 3 : 0)];
  const fh = ak ? ak.fh : [34 + reach[0] - (walk ? 1 : 0), 32.6 + reach[1]];
  const end = ak ? [fh[0] - 4 - frame * 0.4, fh[1] + 10] : [fh[0] - 1 + Math.sin(t - 1.4) * 2 * amp - (walk ? 2 : 0), fh[1] + 11 - (walk ? 0.6 : 0)];
  out.push(...chainLinks([fh[0] - 2, fh[1] + 1], end, 0.6, 6, chain, chainD, robe));
  out.push(...oE(end[0], end[1] + 1.4, 1.6, 1.5, chain, 0.5), F(E(end[0], end[1] + 1.4, 0.8, 0.7, robe)), F(E(end[0] + 1.6, end[1] + 2.2, 0.6, 0.5, robe)));
  const slv = [[27.4, 24.4], [32.4, 25], [fh[0] + 1.6, fh[1] - 3.4], [fh[0] + 1.2, fh[1] + 1.2], [fh[0] - 0.6, fh[1] + 0.4], [fh[0] - 2, fh[1] + 2.4], [fh[0] - 3.4, fh[1] + 0.8], [fh[0] - 5, fh[1] + 2.6], [27.6, 33], [25.8, 29]];
  out.push(...oT(slv, robe), F(T([slv[0], slv[1], slv[2], [fh[0], fh[1] - 2.2], [30.4, 27]], robeL)), ...stroke([[fh[0] - 3.4, fh[1] + 0.6], [fh[0] - 1, fh[1] - 1.4]], 0.5, robeD), ...stroke([[28, 30.6], [fh[0] - 3, fh[1] - 1]], 0.5, robeD));
  const curl = ak ? ak.curl : (angry ? 1.4 : hurt ? -0.6 : 0) + (walk ? 0 : Math.sin(t * 2) * 0.4);
  for (const [dy, l] of [[-1.4, 4], [0.2, 4.6], [1.6, 3.6]]) out.push(...limb([[fh[0] + 0.8, fh[1] - 0.2 + dy * 0.6], [fh[0] + 1 + l * 0.6, fh[1] + dy], [fh[0] + 1 + l * 0.85, fh[1] + dy + 1.6 + curl]], 0.9, claw, 0.45), F(T([[fh[0] + 0.6 + l * 0.85, fh[1] + dy + 1.4 + curl], [fh[0] + 1.4 + l * 0.85, fh[1] + dy + 1.4 + curl], [fh[0] + 1 + l * 0.8, fh[1] + dy + 2.6 + curl]], '#ffffff')));
  out.push(...oE(fh[0] + 0.4, fh[1] - 0.2, 2, 1.7, claw, 0.5), F(E(fh[0] + 0.8, fh[1] - 0.8, 0.8, 0.5, '#ffffff')));
  if (ak && !dead) {
    if (frame === 1) {
      // The scream ripples out of the hood; speed lines trail the claw.
      for (const r of [3, 5.4]) fxs.push(arc(30 + r * 0.4, 18, r * 0.55, r, -60, 60, 0.6, '#e6dcff'));
      fxs.push(...streaks([[fh[0] - 12, fh[1] - 7, fh[0] - 5, fh[1] - 3], [fh[0] - 11, fh[1] - 3, fh[0] - 5, fh[1]]], '#d9d0f6', 0.6));
    } else if (frame === 2) {
      for (const r of [4.2, 6.6]) fxs.push(arc(30 + r * 0.45, 18, r * 0.55, r, -60, 60, 0.5, '#e6dcff'));
      for (const k of [-2.2, 0, 2.2]) fxs.push(...stroke([[33 + k * 0.4, 24 + k], [37.6 + k * 0.3, 29 + k], [38.4 + k * 0.2, 35 + k]], 0.7, '#ff9ec0'), ...stroke([[33.4 + k * 0.4, 25 + k], [37.4 + k * 0.3, 29.6 + k]], 0.3, '#ffffff'));
    }
  }
  let shapes = out;
  // The eerie slide: leaning into the glide, shearing the top forward.
  const lean = ak ? ak.lean : walk ? 0.07 + Math.sin(t - 0.6) * 0.015 : 0;
  if (lean) shapes = xf(shapes, (x, y) => [x + (46 - y) * lean, y]);
  const bob = ak ? 0 : walk ? Math.sin(t) * 0.7 : Math.sin(t) * 0.5;
  shapes = mv([...shapes, ...fxs], (hurt ? -1.4 : 0) + (ak ? ak.dx : walk ? -0.6 : 0), bob + (ak ? ak.dy : 0));
  return { w: 40, h: 52, res: 3, shapes };
}

// ---------- Exports ----------

// Every design flies or walks with its own cadence: `stride` is how far it travels per cycle.
export const ART = {
  wisp: { walk: 8, idle: 6, attack: 4, stride: 34, draw: wisp },
  gloombat: { walk: 8, idle: 6, attack: 4, stride: 24, draw: imp },
  boneknight: { walk: 8, idle: 6, attack: 4, stride: 24, draw: dullahan },
  crystalslime: { walk: 8, idle: 6, attack: 4, stride: 22, draw: mimic },
  rockgolem: { walk: 8, idle: 6, attack: 4, stride: 30, draw: golem },
  shade: { walk: 8, idle: 6, attack: 4, stride: 58, draw: wraith },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  wisp: { name: "Will-o'-Wisp", w: 22, h: 26 },
  gloombat: { name: 'Imp', w: 24, h: 26 },
  boneknight: { name: 'Dullahan', w: 26, h: 46 },
  crystalslime: { name: 'Gem Mimic', w: 28, h: 24 },
  rockgolem: { name: 'Crystal Golem', w: 46, h: 60 },
  shade: { name: 'Wraith', w: 26, h: 40 },
};
