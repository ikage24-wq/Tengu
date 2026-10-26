// Monster art: Twilight Ruins (a will-o'-wisp, an imp, a dullahan) and Crystal Cave (a gem mimic,
// a crystal golem, a wraith). Every design faces right with its feet (or its floating hem) on the
// bottom edge, and is built back to front from layered shapes with hand-placed shading.

import { E, T, F, shade, mix, INK, MOUTH, arc, stroke, face } from './kit.js';

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

// ---------- Will-o'-Wisp ----------
// A little ghost-fire spirit with flickering flame tongues, a curling wispy tail, and a warm lantern
// swinging from its stubby arm.
function wisp(pose, frame, mood) {
  const walk = pose === 'walk';
  const n = walk ? 6 : 4;
  const t = (frame / n) * TAU;
  const amp = walk ? 1 : 0.6;
  const dead = mood === 'dead';
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const [c0, c1, c2] = dead ? ['#a9b2c6', '#cdd3e0', '#eceff5'] : angry ? ['#b48cff', '#dcc4ff', '#fbf4ff'] : ['#7fd8ee', '#bff2ff', '#f2fdff'];
  const flare = angry ? 1.3 : dead ? 0.45 : hurt ? 0.8 : 1;
  const cx = 16 + (hurt ? -1.4 : 0);
  const cy = 23 + Math.sin(t) * 0.6 * amp + (dead ? 1 : 0);
  const out = [];

  // Embers drifting up behind it.
  if (!dead) {
    for (let i = 0; i < 2; i++) {
      const u = (frame / n + i * 0.5) % 1;
      out.push(F(E(cx - 9 + i * 15 + Math.sin(t + i * 2) * 1.2, cy - 5 - u * 11, 0.9 - u * 0.4, 0.9 - u * 0.4, c1)));
    }
  }
  // The curling tail, lagging behind the body.
  const tp = [[cx - 2, cy + 5.5], [cx - 6, cy + 9], [cx - 9.6, cy + 11], [cx - 12, cy + 13.2], [cx - 11, cy + 15.2], [cx - 8.6, cy + 14.8]];
  const tail = tp.map(([x, y], i) => [x + Math.sin(t - i * 0.9) * 0.45 * i * amp, y + Math.cos(t - i * 0.9) * 0.25 * i * amp]);
  out.push(...oRibbon(tail, [8, 6.4, 4.6, 3, 1.8, 0.4], c0));
  // Flame tongues (back to front), each flickering on its own beat.
  const fl = (ph, m) => 1 + 0.12 * Math.sin(t * m + ph) * (walk ? 1 : 0.7);
  const tongues = [
    [cx - 5.2, cy - 2, 7, 9.5 * fl(1, 2), -3],
    [cx + 5.4, cy - 2.4, 6.4, 8.5 * fl(2.5, 1), -2],
    [cx + 0.4, cy - 3.5, 10.5, 12.6 * fl(0, 1), -3],
  ];
  for (const [x, y, w, h, l] of tongues) out.push(T(flamePts(x, y, w, h * flare, l * (walk ? 1 : 0.6) + (hurt ? -1.5 : 0)), c0));
  out.push(E(cx, cy, 10, 9.4, c0));
  // Inner glow layers.
  out.push(F(T(ribbonPts(tail.slice(0, 4), [4.6, 3.4, 2.2, 0.6]), c1)));
  out.push(F(T(flamePts(cx + 0.8, cy - 2.6, 6.6, 12.6 * fl(0, 1) * flare * 0.66, -2.2), c1)), F(T(flamePts(cx - 4.6, cy - 1.5, 3.6, 9.5 * fl(1, 2) * flare * 0.55, -2), c1)));
  out.push(F(E(cx + 0.8, cy + 0.6, 7.8, 7.2, c1)), F(E(cx + 1.8, cy + 1.4, 6.4, 5.6, c2)));
  out.push(F(E(cx - 4.4, cy - 4.4, 2.2, 1.3, '#ffffff')), F(E(cx - 6.4, cy - 1.8, 0.8, 0.8, '#ffffff')));
  // Face.
  out.push(...face(cx + 2.6, cy + 1, 1.5, mood, { gap: 3.5, eye: dead ? '#6f6a86' : INK }));

  // Stubby arm and the swinging lantern.
  out.push(...limb([[cx + 6.6, cy + 3], [cx + 9.6, cy + 5]], 2.8, c1, 0.6));
  const px = cx + 10.2;
  const py = cy + 5.8;
  const a = dead ? 0.15 : hurt ? 0.55 : Math.sin(t - 1) * 0.34 * amp;
  const frame_ = '#6e5a96';
  const glass = dead ? '#c9c2d6' : angry ? '#ffd8ef' : '#fff1b8';
  const lan = [
    ...stroke([[0, 0], [0, 2.2]], 0.8, frame_),
    ...oT([[-1.4, 2], [1.4, 2], [3, 3.7], [-3, 3.7]], frame_, 0.5),
    ...oT([[-2.5, 3.7], [2.5, 3.7], [2.7, 9], [-2.7, 9]], glass, 0.5),
    ...stroke([[-2.5, 3.7], [-2.7, 9]], 0.7, frame_), ...stroke([[2.5, 3.7], [2.7, 9]], 0.7, frame_),
    ...oT([[-3.3, 9], [3.3, 9], [2.6, 10.6], [-2.6, 10.6]], frame_, 0.5),
    F(E(0, 11, 1, 0.6, frame_)), F(E(0, 1.8, 0.9, 0.8, frame_)),
  ];
  out.push(...xf(lan, (x, y) => rot([[x + px, y + py]], px, py, -a)[0]));
  if (!dead) {
    const [lx, ly] = rot([[px, py + 6.6]], px, py, -a)[0];
    const lf = 1 + 0.15 * Math.sin(t * 2);
    out.push(F(T(flamePts(lx, ly + 1.8, 2.6, 4 * lf, 0), angry ? '#ff7fbf' : '#ffa94a')), F(T(flamePts(lx, ly + 1.8, 1.3, 2.3 * lf, 0), '#fff8d6')));
  }
  // Little hand over the ring.
  out.push(...oE(cx + 10.1, cy + 5.4, 1.7, 1.6, c1, 0.5), F(E(cx + 10.5, cy + 4.9, 0.6, 0.5, c2)));
  return { w: 34, h: 40, res: 3, shapes: out };
}

// ---------- Imp ----------
// A pink little demon on bat wings: curled horns, pointy ears, a smug half-lidded grin with a fang,
// a spade-tipped tail, and a tiny golden trident.
function batWing(sx, sy, dir, el, c, mc, bone, k = 1) {
  const v = (a, l) => [dir * Math.cos(a) * l * k, -Math.sin(a) * l * k];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const S = [sx, sy];
  const Eb = add(S, v(el + 0.35, 7));
  const f1 = add(Eb, v(el - 0.05, 10.5));
  const f2 = add(Eb, v(el - 0.6, 9.4));
  const f3 = add(Eb, v(el - 1.15, 7.6));
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

function imp(pose, frame, mood) {
  const walk = pose === 'walk';
  const n = walk ? 6 : 4;
  const t = (frame / n) * TAU;
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
  const flap = dead ? -0.6 : hurt ? 1 : walk ? 0.25 + 0.8 * Math.cos(t) : 0.3 + 0.45 * Math.cos(t);
  const dy = dead ? 1.5 : -Math.sin(t) * (walk ? 1 : 0.5);
  const dx = hurt ? -1.4 : 0;
  const out = [];

  // Wings: the far one first, darker.
  out.push(...batWing(27.5, 18.4, 1, flap - 0.1, shade(wingC, -6), shade(memb, -10), horn, 0.92));
  out.push(...batWing(19.5, 18.6, -1, flap, wingC, memb, horn));
  // Tail with a spade tip, swishing behind.
  const tp = [[19.5, 26], [15.5, 28.4], [11.4, 28.6], [8.6, 26], [8.4, 22.6]].map(([x, y], i) => [x + Math.sin(t - i * 0.8) * 0.3 * i, y + Math.cos(t - i * 0.8) * 0.45 * i]);
  out.push(...oRibbon(tp, [2.2, 1.8, 1.5, 1.3, 1.1], skinD, 0.6));
  {
    const [a, b] = tp.slice(-2);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const sp = rot([[3.6, 0], [0.4, -2.3], [-0.9, -1.5], [0, 0], [-0.9, 1.5], [0.4, 2.3]].map(([x, y]) => [x + b[0], y + b[1]]), b[0], b[1], ang);
    out.push(...oT(sp, '#c95b8f', 0.6));
  }
  // Back arm and legs.
  out.push(...limb([[20.5, 21.5], [17.6, 24.2]], 2.2, skinD, 0.6), E(17.3, 24.6, 1.3, 1.2, skinD));
  const ls = Math.sin(t - 1) * 0.8;
  out.push(...limb([[21.6, 27], [20.6 - ls, 31]], 2.3, skinD, 0.6), E(20.4 - ls, 31.6, 1.4, 1, '#7a4a6e'));
  out.push(...limb([[25.6, 27.4], [26.8 + ls, 31.4]], 2.3, skin, 0.6), E(27 + ls, 32, 1.4, 1, '#7a4a6e'));
  // Torso and belly.
  out.push(...oE(23.6, 23.8, 5.4, 5, skin), F(E(24.6, 24.6, 3.3, 3.4, belly)), F(E(25.6, 23.4, 1, 0.7, '#ffffff')));
  // Ears and horns.
  out.push(...oT([[18, 10.4], [11.2, 7.2], [17.6, 15]], skin, 0.6), F(T([[17.2, 11.4], [13.4, 9.2], [17, 13.6]], '#ffc2d8')));
  out.push(...oT([[31.6, 9.8], [37.4, 6.8], [32.2, 14]], skin, 0.6), F(T([[32.4, 10.6], [35.6, 8.6], [32.6, 12.8]], '#ffc2d8')));
  const hornL = [[21, 6.4], [19.2, 3.6], [18.8, 1.4], [19.8, 0.4]];
  const hornR = [[28.4, 6], [30, 3.4], [31.6, 1.6], [33, 1.2]];
  out.push(...oRibbon(hornL, [3, 2.4, 1.5, 0.3], horn, 0.6), ...oRibbon(hornR, [3, 2.4, 1.5, 0.3], horn, 0.6));
  out.push(...stroke([[19.4, 4.4], [21, 4]], 0.4, '#e8cfa8'), ...stroke([[29.2, 3.6], [30.6, 4.4]], 0.4, '#e8cfa8'));
  // Head.
  out.push(...oE(25, 12.4, 8.6, 7.8, skin));
  out.push(F(E(22, 8.6, 3, 1.6, mix(skin, '#ffffff', 0.35))));
  // A little purple tuft between the horns.
  out.push(F(T([[22.6, 6.2], [24, 3], [25, 5.4], [26.6, 2.6], [27.4, 5.6], [28.6, 4.6], [28.4, 7], [22.4, 7.4]], '#8a5cc4')));
  // Face: big eyes, and a mischievous grin.
  const ex = 27.2;
  const ey = 12.6;
  out.push(...face(ex, ey, 1.38, mood, { gap: 3.8, eye: '#4a2050', mouth: false }));
  if (mood === 'idle' || mood === 'walk') {
    // Smug half-lids.
    for (const s of [-1, 1]) {
      const x = ex + s * 2.62;
      out.push(F(T([[x - 1.6, ey - 2.4], [x + 1.6, ey - 2.4], [x + 1.6, ey - 0.7 + s * 0.15], [x - 1.6, ey - 0.7 - s * 0.15]], skin)), ...stroke([[x - 1.4, ey - 0.65 - s * 0.15], [x + 1.4, ey - 0.65 + s * 0.15]], 0.45, '#4a2050'));
    }
  }
  const my = 16.2;
  if (mood === 'dead') {
    out.push(...stroke([[25.4, my + 0.3], [26.4, my - 0.2], [27.4, my + 0.3], [28.4, my - 0.2], [29.4, my + 0.3]], 0.45, INK));
  } else if (hurt) {
    out.push(F(E(27.6, my + 0.2, 0.9, 1, MOUTH)));
  } else if (angry) {
    out.push(F(T([[24.6, my - 0.6], [30.4, my - 0.8], [29.4, my + 1.6], [25.6, my + 1.6]], MOUTH)),
      F(T([[25.4, my - 0.6], [26.6, my - 0.6], [26, my + 0.8]], '#ffffff')), F(T([[28.4, my - 0.7], [29.6, my - 0.7], [29, my + 0.7]], '#ffffff')));
  } else if (mood === 'happy') {
    out.push(F(T([[24.6, my - 0.8], [30.4, my - 1.2], [29, my + 1.8], [26, my + 1.8]], MOUTH)), F(E(27.6, my + 1.1, 1.4, 0.7, '#ff8fa8')), F(T([[28.6, my - 1], [29.6, my - 1.1], [29.2, my + 0.2]], '#ffffff')));
  } else {
    // Lopsided smirk with a fang.
    out.push(F(T([[24.8, my - 0.8], [27, my], [29.8, my - 1.4], [29.6, my - 0.2], [27.4, my + 1.2], [25.2, my + 0.2]], MOUTH)), F(T([[28.2, my - 0.6], [29.2, my - 0.9], [28.9, my + 0.5]], '#ffffff')));
  }
  // Front arm and the trident.
  const tilt = dead ? 0.5 : 0.08 + Math.sin(t) * 0.06 + (angry ? -0.25 : 0);
  const hx = 33.6;
  const hy = 22.4;
  const tri = [
    ...oT([[-0.7, 9.2], [0.7, 9.2], [0.7, -14], [-0.7, -14]], '#c99a4a', 0.5),
    ...oT([[-4, -14.6], [4, -14.6], [3.4, -13.2], [-3.4, -13.2]], gold, 0.5),
    ...oT([[-0.9, -14.4], [0, -19.6], [0.9, -14.4]], gold, 0.5),
    ...oT([[-4, -14.4], [-4.4, -17.6], [-3.4, -16.4], [-2.8, -14.4]], gold, 0.5),
    ...oT([[4, -14.4], [4.4, -17.6], [3.4, -16.4], [2.8, -14.4]], gold, 0.5),
    F(E(0, -13.9, 0.9, 0.8, '#ff6f9f')),
  ];
  out.push(...xf(tri, (x, y) => rot([[x + hx, y + hy]], hx, hy, tilt)[0]));
  out.push(...limb([[28, 21.4], [31, 23], [33, 22.6]], 2.3, skin, 0.6), ...oE(33.6, 22.4, 1.6, 1.5, skin, 0.5));
  let shapes = out;
  if (dx || dy) shapes = mv(shapes, dx, dy);
  return { w: 46, h: 36, res: 3, shapes };
}

// ---------- Dullahan ----------
// A headless knight: ghost-fire rising from the empty collar, a swept cape, an upright sword, and
// its plumed helmet tucked under one arm, eyes glowing inside the visor.
function dullahan(pose, frame, mood) {
  const walk = pose === 'walk';
  const n = walk ? 6 : 4;
  const t = (frame / n) * TAU;
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
  const fl = angry ? ['#ff8fc0', '#ffd0e6', '#ffffff'] : dead ? ['#b8bfd0', '#dde1ea', '#f2f4f8'] : ['#7fe6e0', '#c8fbf4', '#ffffff'];
  const bob = walk ? Math.sin(t) ** 2 * 1.3 : (Math.sin(t) * 0.5 + 0.5) * 0.7;
  const hx = hurt ? -1.2 : 0;
  const amp = walk ? 1 : 0.4;
  const out = [];
  const body = [];

  // Cape, flowing back and rippling, lined in pink.
  const w = (k) => Math.sin(t - k * 0.9) * amp * (0.4 + k * 0.45);
  const cape = [[27, 23], [15, 23.4], [11, 30], [8 + w(1) * 0.6, 40], [5 + w(2), 49], [6.6 + w(3), 52.4], [9.4 + w(3), 50.4], [12.4 + w(3) * 0.8, 53.4], [15.6 + w(2) * 0.6, 51], [18.4, 52.4], [21, 46]];
  body.push(...oT(cape, capeC), F(T([[11, 30], [8 + w(1) * 0.6, 40], [5 + w(2), 49], [6.6 + w(3), 52.4], [9 + w(2), 44], [12, 34]], shade(capeC, -9))));
  body.push(...stroke([[14, 30], [12 + w(2) * 0.5, 42], [10.6 + w(3) * 0.7, 50]], 0.6, shade(capeC, -16)));
  body.push(F(T([[5 + w(2), 49], [6.6 + w(3), 52.4], [9.4 + w(3), 50.4], [12.4 + w(3) * 0.8, 53.4], [15.6 + w(2) * 0.6, 51], [15, 49.4], [12.4, 51.2], [9.6, 48.6], [6.8, 50.2]], '#ff9ec0')));
  // Back upper arm in the dark under-suit (it cradles the helmet).
  body.push(...limb([[15, 27], [8.4, 36.4]], 3.6, suitD));
  // Breastplate with a gold-trimmed hem, belt, and faulds.
  const bp = [[15, 25], [29, 25], [30.6, 31], [28.6, 38], [27.4, 41], [16.6, 41], [15.4, 38], [13.8, 31]];
  body.push(...oT(bp, plate), F(T([[15, 25], [18.4, 25], [17.4, 33], [18.2, 41], [16.6, 41], [15.4, 38], [13.8, 31]], plateD)));
  body.push(F(E(25.6, 29.8, 2.8, 2, plateL)), F(E(26.6, 35.4, 1.2, 1.6, plateL)), ...stroke([[21.6, 26], [22.2, 33], [21.8, 40.4]], 0.55, plateD));
  body.push(F(T([[22.4, 30.4], [24, 32.4], [22.4, 34.6], [20.8, 32.4]], trim)), F(T([[22.4, 31.4], [23.2, 32.4], [22.4, 33.4], [21.6, 32.4]], '#ff9ec0')));
  body.push(...oT([[16.2, 40.2], [27.8, 40.2], [28, 42.6], [16, 42.6]], suit, 0.5), F(T([[20.8, 40], [24, 40], [24, 42.8], [20.8, 42.8]], trim)), F(E(22.4, 41.4, 0.7, 0.6, suit)));
  body.push(...oT([[15.6, 42.6], [28.6, 42.6], [30, 46.8], [14.2, 46.8]], plateD, 0.5), ...stroke([[22.2, 42.8], [22.2, 46.6]], 0.5, shade(plateD, -14)), F(T([[14.6, 45.6], [29.6, 45.6], [30, 46.8], [14.2, 46.8]], trim)));
  // Back pauldron.
  body.push(...oE(15, 26.6, 4.4, 3.8, plateD), F(E(14.4, 25.4, 2, 1, plate)));
  // The empty collar and its ghost-fire.
  const fk = (angry ? 1.3 : dead ? 0.35 : 1) * (1 + 0.1 * Math.sin(t * 2));
  const lean = (walk ? -2.6 : -0.8) + Math.sin(t) * 0.8 + (hurt ? -2 : 0);
  body.push(...oE(22, 25.2, 6.8, 2.8, plateL, 0.5), F(E(22, 24.7, 5, 1.7, visor)));
  body.push(T(flamePts(22, 25, 9.4, 15 * fk, lean), fl[0]), T(flamePts(18.6, 25, 4.6, 8 * fk * (1 + 0.15 * Math.sin(t + 2)), lean - 1), fl[0]), T(flamePts(25.4, 25, 4, 7 * fk * (1 + 0.15 * Math.sin(t * 2 + 1)), lean), fl[0]));
  body.push(F(T(flamePts(22.3, 25, 6.2, 10.5 * fk, lean * 0.8), fl[1])), F(T(flamePts(22.5, 25, 3, 6 * fk, lean * 0.5), fl[2])));
  if (!dead) body.push(F(E(20 + lean * 1.4, 6.5 - Math.sin(t) * 1.5 + (angry ? -1 : 0), 0.8, 0.8, fl[1])));
  const lip = [];
  for (let i = 0; i <= 8; i++) lip.push([22 + 6.8 * Math.cos((i / 8) * Math.PI), 25.2 + 2.8 * Math.sin((i / 8) * Math.PI)]);
  for (let i = 8; i >= 0; i--) lip.push([22 + 5 * Math.cos((i / 8) * Math.PI), 24.9 + 1.5 * Math.sin((i / 8) * Math.PI)]);
  body.push(F(T(lip, plateL)), ...stroke([[16.4, 26.6], [22, 28.1], [27.6, 26.6]], 0.5, trim));
  // Front pauldron, layered and gold-rimmed.
  body.push(...oE(29.6, 26.8, 5.2, 4.4, plate), arc(29.6, 27.4, 5, 3.8, 15, 165, 0.8, trim), arc(29.6, 26.6, 3.8, 2.6, 25, 155, 0.5, plateD), F(E(28.4, 25, 2.4, 1.1, plateL)));

  // Helmet under the arm: plume, gold crest, bucket helm, T-visor with glowing eyes.
  const hb = hurt ? -1.6 : dead ? 1.4 : Math.sin(t + 0.6) * 0.3 * amp;
  const helm = [];
  const pl = [[9.6, 32], [6.6, 30.6 + w(1) * 0.4], [3.6, 31.2 + w(2) * 0.6], [1.6, 33.6 + w(3) * 0.7]];
  helm.push(...oRibbon(pl, [3.6, 3.4, 2.6, 0.8], '#ff9ec0'), F(T(ribbonPts(pl.slice(0, 3), [1.2, 1.2, 0.6]), '#ffd0e0')));
  helm.push(...oE(10.4, 38.2, 6.8, 6.6, plate), F(T([[3.8, 37], [6.4, 33], [7.4, 44.4], [4.6, 41.6]], plateD)), F(E(8.4, 34, 2.6, 1.2, plateL)));
  helm.push(...stroke([[5.6, 34.6], [10, 31.8], [14.6, 33.6]], 1.2, trim));
  helm.push(F(T([[8.2, 35.2], [17.2, 34.8], [17.4, 39.8], [15, 40], [14.8, 43.4], [12.8, 43.6], [12.6, 40.1], [8.6, 40.4]], visor)));
  helm.push(...glowEyes(13, 37.5, 1.18, mood, { gap: 3.5, col: fl[0], core: '#ffffff', halo: mix(fl[0], visor, 0.55) }));
  if (angry) helm.push(...stroke([[9.6, 35.6], [12.2, 36.6]], 0.6, fl[0]), ...stroke([[16.6, 35.6], [14, 36.6]], 0.6, fl[0]));
  helm.push(...stroke([[8, 35.1], [17.4, 34.7]], 0.7, plateL), F(E(10, 42.2, 0.4, 0.4, visor)), F(E(10.4, 43.6, 0.4, 0.4, visor)), F(E(16.2, 42.4, 0.4, 0.4, visor)));
  body.push(...mv(helm, 0, hb));
  // Forearm cradling the helmet from below.
  body.push(...limb([[8.4, 36.4], [8.6, 43], [13.6, 45.2 + hb * 0.5]], 3.2, suit), ...oE(14.6, 44.8 + hb * 0.5, 2.2, 1.9, plateD), F(E(14.2, 44 + hb * 0.5, 1.2, 0.5, plateL)));

  // The sword arm and an upright blade.
  const sw = dead ? 0.7 : 0.2 + Math.sin(t) * 0.05 * amp + (angry ? -0.12 : 0);
  const sx = 35.2;
  const sy = 37;
  const sword = [
    ...oE(0, 3.4, 1.3, 1.3, '#ff9ec0', 0.5),
    ...oT([[-0.8, 2.4], [0.8, 2.4], [0.8, -1.6], [-0.8, -1.6]], '#7a5a8a', 0.5),
    ...oT([[-1.6, -2.8], [1.6, -2.8], [1.6, -22.6], [0, -26.4], [-1.6, -22.6]], '#eef4ff', 0.5),
    F(T([[-1.6, -2.8], [-0.2, -2.8], [-0.2, -24.6], [-1.6, -22.6]], '#d6e0fa')),
    ...stroke([[0.4, -4], [0.4, -21]], 0.6, '#aebde8'),
    ...oT([[-4.2, -1.4], [4.2, -1.4], [3.4, -2.9], [-3.4, -2.9]], trim, 0.5),
    F(E(-4.3, -2.4, 0.7, 0.7, trim)), F(E(4.3, -2.4, 0.7, 0.7, trim)),
  ];
  body.push(...xf(sword, (x, y) => rot([[x + sx, y + sy]], sx, sy, sw)[0]));
  body.push(...limb([[30.4, 29], [32.4, 33.2]], 3.2, suit), ...limb([[32.4, 33.2], [34.8, 36.4]], 3.8, plate), ...oE(32.2, 33, 1.8, 1.6, plateL, 0.5));
  body.push(...oE(35.2, 36.8, 2.1, 2, plateD), F(E(35.8, 36.1, 0.9, 0.6, plateL)));

  // Legs: dark thighs, plated greaves, pointed sabatons.
  const legs = [];
  const leg = (hipX, p, back) => {
    const hip = [hipX + hx, 44 + bob];
    const lift = walk ? 2.4 * Math.max(0, Math.cos(p)) : 0;
    const fx = walk ? hipX + 4.6 * Math.sin(p) : hipX + (back ? -1.6 : 2.2);
    const fy = 58 - lift;
    const ank = [fx + hx, fy - 2.4];
    const knee = [(hip[0] + ank[0]) / 2 + 1.4, (hip[1] + ank[1]) / 2];
    const pc = back ? plateD : plate;
    legs.push(...limb([hip, knee], 4.4, back ? suitD : suit), ...limb([knee, ank], 4.6, pc), ...oE(knee[0] + 0.4, knee[1], 2.2, 1.9, back ? plate : plateL, 0.5));
    legs.push(...oT([[ank[0] - 2.6, fy - 3.2], [ank[0] + 1.4, fy - 3.4], [ank[0] + 4.4, fy - 0.8], [ank[0] + 4, fy], [ank[0] - 2.6, fy]], pc, 0.5));
  };
  leg(19.4, t + Math.PI, true);
  leg(25, t, false);
  out.push(...legs, ...mv(body, hx, bob));
  return { w: 44, h: 58, res: 3, shapes: out };
}

// ---------- Gem Mimic ----------
// A treasure chest that hops on stubby legs: crystal teeth, a long lolling tongue, crystals
// sprouting from its lid, and gems spilling out of its mouth.
const HOP = [
  { sq: 0.86, lift: 0, lid: 0.14, air: 0 },
  { sq: 1.08, lift: 1.4, lid: 0.28, air: 0.5 },
  { sq: 1.04, lift: 3.4, lid: 0.46, air: 1 },
  { sq: 1, lift: 3.6, lid: 0.4, air: 1 },
  { sq: 1, lift: 2, lid: 0.26, air: 0.6 },
  { sq: 0.9, lift: 0, lid: 0.1, air: 0 },
];
const MIMIC_IDLE = [
  { sq: 1, lift: 0, lid: 0.16, air: 0 },
  { sq: 0.97, lift: 0, lid: 0.24, air: 0 },
  { sq: 0.985, lift: 0, lid: 0.12, air: 0 },
];

function mimic(pose, frame, mood) {
  const walk = pose === 'walk';
  const st = (walk ? HOP : MIMIC_IDLE)[frame];
  const t = (frame / (walk ? 6 : 3)) * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const wood = '#dc9e70';
  const woodD = '#c4865c';
  const gold = '#f7cd5e';
  const leg = '#b58ad8';
  const lid = Math.min(0.46, Math.max(0.04, st.lid + (angry ? 0.28 : hurt ? -0.12 : dead ? 0.22 : mood === 'happy' ? 0.12 : 0)));
  const sy = st.sq * (hurt ? 0.94 : 1);
  const sx = 1 + (1 - sy) * 0.8;
  const lift = st.lift;
  const H = [5.6, 21];
  const out = [];

  // Legs: tucked and splayed on the ground, dangling in the air.
  const legAt = (x, c, back) => {
    const top = [20 + (x - 20) * sx, 30.4 - lift];
    const foot = st.air ? [top[0] - 1.2 * st.air, top[1] + 4.8] : [top[0] + (back ? -1.2 : 1.2) * (1.6 - sy), 34.8];
    const knee = [(top[0] + foot[0]) / 2 + (st.air ? -0.6 : 1.4), (top[1] + foot[1]) / 2];
    out.push(...limb([top, knee, foot], 2.6, c, 0.6), ...oE(foot[0] + 0.4, foot[1] + 0.1, 2.1, 1.1, c, 0.6));
    for (const k of [-1, 0, 1]) out.push(F(E(foot[0] + 1.5 + k * 0.9, foot[1] + 0.8, 0.35, 0.35, '#fff6ee')));
  };
  legAt(10, shade(leg, -10), true);
  legAt(28, shade(leg, -10), true);
  legAt(12.6, leg, false);
  legAt(30.6, leg, false);

  // The chest, built closed then reshaped by the hop.
  const chest = [];
  // Mouth interior and treasure.
  const lidPts = (pts) => rot(pts, H[0], H[1], -lid);
  const [fx, fy] = lidPts([[32.4, 21]])[0];
  chest.push(F(T([H, [fx, fy], [32.2, 21.4], [6, 21.4]], '#43213e')));
  chest.push(F(E(20, 21, 6, 1.6 + lid * 2, '#ffcf5a')), F(E(16, 20.4, 1.2, 1.2, '#8fe6ff')), F(E(24.6, 20.2, 1, 1, '#ff9ed2')), F(E(19.6, 19.8, 0.7, 0.7, '#fff6c9')));
  // Tongue, lolling over the front edge.
  const tl = dead ? 1.3 : hurt ? 0.4 : angry ? 1.1 : 1;
  const wag = dead ? 0 : Math.sin(t) * 1.2;
  if (tl > 0.5) {
    const tp = [[24, 20.6], [28.4, 20.2], [32.6, 21.2], [34.4 + wag * 0.3, 23.4 * tl + 0.4], [34.6 + wag, 26.4 * tl], [33.4 + wag * 1.2, 28.4 * tl]];
    chest.push(...oRibbon(tp, [3.6, 3.6, 3.4, 3, 2.6, 1.6], '#ff8fb3', 0.6), F(E(33.6 + wag * 1.2, 28 * tl, 1.4, 1, '#ff8fb3')));
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
  const gape = (x) => (x - H[0]) * Math.sin(lid);
  for (let x = 13; x <= 31; x += 3) {
    const h = Math.min(angry ? 3.4 : 2.6, gape(x) * 0.42);
    if (h > 0.5) chest.push(...oT([[x - 1.2, 21.2], [x, 21.2 - h], [x + 1.2, 21.2]], x % 2 ? '#c9f4ff' : '#eadbff', 0.4));
  }
  // Lid: planks, straps, crystals, eyes; rotates open about the back hinge.
  const lidS = [];
  lidS.push(...crystal(11.2, 14, 3.6, 7.4, -0.4, '#8fe6ff', '#dcfaff'), ...crystal(16.2, 13.4, 4.4, 9, -0.12, '#c3a8ff', '#eee4ff'), ...crystal(20.8, 13.4, 3, 5.6, 0.22, '#ffadd8', '#ffe2f1'));
  lidS.push(...oT([[5.6, 21], [5.6, 16], [7.4, 14], [12, 13], [26, 13], [30.6, 14], [32.4, 16], [32.4, 21]], wood));
  lidS.push(F(T([[5.6, 21], [5.6, 16], [7.4, 14], [9.4, 13.6], [9.4, 21]], woodD)), ...stroke([[6, 17.4], [32, 17.4]], 0.5, '#a96d48'), F(E(24, 14.6, 4, 0.9, '#f0bc90')));
  for (const x of [10, 26.4]) lidS.push(F(T([[x, 13.2], [x + 2.6, 13.1], [x + 2.6, 21], [x, 21]], gold)), ...stroke([[x + 0.2, 13.2], [x + 0.2, 21]], 0.4, '#c99a3a'), F(E(x + 1.3, 15.4, 0.45, 0.45, '#fff2b0')));
  lidS.push(F(T([[5.6, 19.6], [32.4, 19.6], [32.4, 21], [5.6, 21]], gold)), ...stroke([[5.6, 19.6], [32.4, 19.6]], 0.4, '#c99a3a'));
  // Fangs along the lid's lip.
  for (let x = 14.5; x <= 31; x += 3) {
    const h = Math.min(angry ? 3.4 : 2.4, gape(x) * 0.42);
    if (h > 0.5) lidS.push(...oT([[x - 1.2, 21], [x, 21 + h], [x + 1.2, 21]], x % 2 ? '#eadbff' : '#c9f4ff', 0.4));
  }
  // Big eyes on the lid.
  lidS.push(F(E(21.4, 16.8, 6.4, 3.6, '#f0b486')));
  lidS.push(...face(21.4, 16.6, 1.36, mood, { gap: 3.9, eye: angry ? '#7a1f3f' : INK, mouth: false }));
  if (angry) lidS.push(F(E(18.7, 16.6, 0.5, 0.5, '#ff5f8f')), F(E(24, 16.6, 0.5, 0.5, '#ff5f8f')));
  chest.push(...xf(lidS, (x, y) => lidPts([[x, y]])[0]));
  // Gems tumbling out mid-hop.
  if (walk && st.air > 0.4 && !dead) {
    const u = (frame - 1) / 3;
    chest.push(...oT([[34 + u * 3, 18 - u * 2], [35.4 + u * 3, 16.6 - u * 2], [36.8 + u * 3, 18 - u * 2], [35.4 + u * 3, 19.8 - u * 2]], '#8fe6ff', 0.5));
    chest.push(...oE(31 + u * 2, 15 - u * 3, 0.9, 0.9, '#ffcf5a', 0.5));
  }
  out.push(...xf(chest, (x, y) => [20 + (x - 20) * sx, 31 - (31 - y) * sy - lift], sx, sy));
  return { w: 40, h: 40, res: 3, shapes: mv(out, 0, 4) };
}

// ---------- Crystal Golem ----------
// A hulking lavender-stone golem: crystal clusters on its back and shoulders, a pulsing gem core in a
// rune socket, a little head sunk between its shoulders, and huge fists that swing as it stomps.
function golem(pose, frame, mood) {
  const walk = pose === 'walk';
  const n = walk ? 6 : 4;
  const t = (frame / n) * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const st = '#a49bc4';
  const stD = '#847aa6';
  const stL = '#c4bce0';
  const stDD = '#655b86';
  const glow = angry ? '#ff7fb0' : dead ? '#a59dbd' : '#86f0ff';
  const coreC = angry ? '#ff5f9a' : dead ? '#b4aec6' : '#ff8fca';
  const bob = walk ? Math.sin(t) ** 2 * 1.6 : (Math.sin(t) * 0.5 + 0.5) * 0.8;
  const hx = hurt ? -1.6 : 0;
  const swing = walk ? Math.sin(t) * 4 : Math.sin(t) * 0.6;
  const out = [];
  const up = [];

  // Back crystal cluster.
  up.push(...crystal(13, 33, 4.4, 11, -0.95, '#8fe6ff', '#dcfaff'), ...crystal(18, 27, 5.4, 18, -0.5, '#8fe6ff', '#dcfaff'),
    ...crystal(24, 23, 6.4, 21, -0.18, '#c3a8ff', '#eee4ff'), ...crystal(30, 20.6, 4.6, 13, 0.15, '#ffadd8', '#ffe2f1'));
  // Back arm.
  const bf = [12.4 - swing, 60.6];
  up.push(...limb([[21, 33], [14.6, 45], [bf[0] + 0.6, bf[1] - 4]], 9.4, stD), ...oE(bf[0], bf[1], 7, 6.2, stD), ...stroke([[bf[0] - 4, bf[1] - 1.4], [bf[0] + 3, bf[1] - 2.6]], 0.6, stDD));
  // Torso boulder.
  const torso = [[15, 32], [21, 21], [33, 16.4], [47, 17.6], [57, 25], [60, 39], [56.4, 51], [46, 58], [28, 58], [18.6, 52], [14.4, 42]];
  up.push(...oT(torso, st));
  up.push(F(T([[15, 32], [21, 21], [25, 19.4], [21, 30], [20, 42], [25, 52], [34, 58], [28, 58], [18.6, 52], [14.4, 42]], stD)));
  up.push(F(E(48, 23, 7.6, 3.6, stL)), F(E(56, 34, 1.6, 4, stL)));
  // Chest slabs around the core, cracks with light leaking through.
  up.push(...oT([[30, 33], [38, 30.6], [41, 34], [33, 37.2]], shade(st, 4), 0.5), ...oT([[44, 33.4], [52, 31.6], [53.6, 36.6], [47, 37]], shade(st, 4), 0.5));
  up.push(...stroke([[26, 46], [30, 49.4], [29, 54]], 0.9, stDD), ...stroke([[26.2, 46.4], [30, 49.6], [29.2, 53.6]], 0.35, glow));
  up.push(...stroke([[51, 46], [54.6, 44], [56, 47]], 0.9, stDD), ...stroke([[51.2, 46.2], [54.6, 44.3], [55.8, 46.8]], 0.35, glow));
  up.push(F(E(24, 41, 1.6, 1.1, stDD)), F(E(36, 54, 1.2, 0.8, stDD)), F(E(53, 41.6, 1, 0.7, stDD)));
  // Core: rune socket and pulsing gem.
  const pulse = dead ? 0.85 : 1 + 0.08 * Math.sin(t * 2) + (angry ? 0.12 : 0);
  up.push(...oE(42.4, 43.6, 6.2, 6, stDD, 0.5), arc(42.4, 43.6, 5.4, 5.2, 0, 360, 0.6, mix(glow, stDD, 0.45)));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    up.push(F(E(42.4 + Math.cos(a) * 5.1, 43.6 + Math.sin(a) * 4.9, 0.55, 0.55, glow)));
  }
  const g = (dx, dy) => [42.4 + dx * pulse, 43.6 + dy * pulse];
  up.push(F(T([g(0, -4.4), g(3.6, 0), g(0, 4.4), g(-3.6, 0)], coreC)), F(T([g(0, -4.4), g(3.6, 0), g(0, 0.6), g(-1, -0.4)], mix(coreC, '#ffffff', 0.35))), F(T([g(0, -2.4), g(1.6, 0), g(0, 2.2), g(-1.6, 0)], mix(coreC, '#ffffff', 0.7))));
  if (!dead) up.push(F(E(41.2, 41.8, 0.6, 0.8, '#ffffff')));
  // Head, sunk between the shoulders.
  const nod = walk ? Math.sin(t * 2) * 0.5 : Math.sin(t) * 0.4;
  const head = [];
  head.push(...oE(42.6, 25.4, 9.6, 8.4, st), F(E(39, 30.4, 5, 2, stD)), F(E(46, 20, 4, 1.8, stL)));
  head.push(...crystal(45, 18.4, 3, 6.4, 0.35, '#c3a8ff', '#eee4ff'));
  head.push(F(E(39.2, 26, 2.4, 2, '#3a3158')), F(E(46.6, 25.8, 2.4, 2, '#3a3158')));
  head.push(...glowEyes(42.9, 25.9, 1.18, mood, { gap: 6.2, col: glow, core: '#ffffff', halo: mix(glow, '#3a3158', 0.5) }));
  const brow = angry ? [[35.4, 20.6], [42.8, 23.6], [50.4, 20.4], [50.8, 22.6], [42.8, 25.4], [35, 22.8]] : mood === 'happy' ? [[35.2, 21], [42.8, 21.2], [50.6, 20.6], [50.8, 22.4], [42.8, 22.6], [35, 22.8]] : [[35.2, 21.6], [42.8, 22], [50.6, 21.2], [50.8, 23.2], [42.8, 23.6], [35, 23.4]];
  head.push(...oT(brow, stD, 0.5));
  if (angry) head.push(F(T([[39, 30], [46.8, 29.8], [46, 31.8], [44.8, 30.8], [43.4, 32], [42.2, 30.9], [40.8, 32], [39.6, 31]], glow)));
  else if (mood === 'hurt') head.push(F(E(43, 31, 1, 1.1, stDD)));
  else if (mood === 'happy') head.push(arc(43, 29.6, 2.2, 1.6, 20, 160, 0.6, stDD));
  else head.push(...stroke([[40.8, 30.8], [45.2, 30.6]], 0.6, stDD));
  if (!dead) head.push(F(E(37.6, 28.8, 1.3, 0.6, '#e9a8cc')), F(E(48.4, 28.6, 1.3, 0.6, '#e9a8cc')));
  up.push(...mv(head, 0, nod));
  // Front shoulder boulder with crystals.
  up.push(...crystal(51.6, 26.4, 4, 11, 0.1, '#ffadd8', '#ffe2f1'), ...crystal(56.4, 25.6, 5, 14, 0.4, '#8fe6ff', '#dcfaff'), ...crystal(61, 29, 3.4, 8, 0.85, '#c3a8ff', '#eee4ff'));
  up.push(...oE(56, 32.4, 8.4, 7, st), F(E(54, 29.6, 4, 2, stL)), F(E(52, 36, 3, 1.2, stD)));
  // Front arm with shards on the forearm and a huge fist.
  const ff = [57.8 + swing, 62];
  up.push(...limb([[56.6, 35], [61, 46], [ff[0] + 0.4, ff[1] - 4]], 10, st));
  up.push(...crystal(63.6, 47, 3, 6.6, 1.1, '#8fe6ff', '#dcfaff'));
  up.push(...oE(ff[0], ff[1], 8, 7, st), F(E(ff[0] + 2, ff[1] - 3, 3.6, 1.6, stL)));
  up.push(...stroke([[ff[0] - 4.6, ff[1] + 1], [ff[0] + 4, ff[1] - 0.4]], 0.6, stDD), ...stroke([[ff[0] - 1, ff[1] - 1], [ff[0] - 0.4, ff[1] + 4]], 0.6, stDD), ...stroke([[ff[0] + 2.6, ff[1] - 0.8], [ff[0] + 3.2, ff[1] + 3.6]], 0.6, stDD));
  if (hurt) up.push(...oT([[8, 14], [10, 12.6], [11, 14.6], [9, 15.6]], stD, 0.5), ...oT([[4, 22], [5.6, 21], [6.2, 22.8]], '#8fe6ff', 0.5));

  // Legs: short and thick, planted with each stomp.
  const legs = [];
  const leg = (hipX, p, c) => {
    const lift = walk ? 2.6 * Math.max(0, Math.cos(p)) : 0;
    const fx = walk ? hipX + 4.2 * Math.sin(p) : hipX;
    const hip = [hipX + hx, 55 + bob];
    const ank = [fx + hx, 70 - lift];
    const knee = [(hip[0] + ank[0]) / 2 + 1.6, (hip[1] + ank[1]) / 2];
    legs.push(...limb([hip, knee, ank], 10.4, c), ...oE(ank[0] + 1.6, 74 - lift - 3.2, 7.2, 3.2, c), F(E(ank[0] + 2.6, 74 - lift - 4.6, 3.6, 1, mix(c, '#ffffff', 0.2))));
    legs.push(...stroke([[ank[0] + 4.2, 74 - lift - 2.2], [ank[0] + 4.4, 74 - lift - 0.4]], 0.5, stDD), ...stroke([[ank[0] + 6.2, 74 - lift - 2.6], [ank[0] + 6.6, 74 - lift - 0.8]], 0.5, stDD));
  };
  leg(28, t + Math.PI, stD);
  leg(45, t, st);
  out.push(...legs, ...mv(up, hx, bob));
  return { w: 70, h: 74, res: 3, shapes: dead ? out : out };
}

// ---------- Wraith ----------
// A hooded, tattered specter: glowing eyes in a bottomless hood, ragged billowing robes, bony
// claws, and rattling chains with a padlock and a broken shackle.
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

function wraith(pose, frame, mood) {
  const walk = pose === 'walk';
  const n = walk ? 6 : 4;
  const t = (frame / n) * TAU;
  const amp = mood === 'dead' ? 0 : walk ? 1 : 0.5;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const robe = '#5f5490';
  const robeL = '#8073b4';
  const robeD = '#463c6e';
  const hood = '#1c1530';
  const chain = '#d2cce4';
  const chainD = '#9188ae';
  const claw = '#e8eeff';
  const eyeC = angry ? '#ff6f9f' : dead ? '#9890b0' : '#ffe36b';
  const out = [];
  const w = (k) => Math.sin(t - k * 0.9) * 1.2 * amp;
  const tr = (k) => Math.sin(t - k * 0.7) * 1.4 * amp;

  // Ghost wisps trailing below.
  if (!dead) {
    for (let i = 0; i < 2; i++) {
      const u = (frame / n + i * 0.5) % 1;
      out.push(F(E(8 + i * 9 - u * 4, 47 + u * 3, 1.3 - u * 0.6, 0.9 - u * 0.4, '#b9b0e6')));
    }
  }
  // Back sleeve and claw.
  const bh = [4.6 + tr(1) * 0.5, 31.4 + w(1) * 0.4];
  out.push(...oT([[12.4, 20], [8, 25.6], [bh[0] - 1.6, bh[1] - 0.6], [bh[0] + 0.4, bh[1] + 1.2], [bh[0] + 2.4, bh[1] + 0.2], [13.6, 27]], robeD));
  for (const [dx, dy] of [[-1.6, 3.6], [0, 4.2], [1.6, 3.4]]) out.push(...stroke([[bh[0] + 0.2, bh[1] + 0.6], [bh[0] + dx * 0.6, bh[1] + dy * 0.6], [bh[0] + dx, bh[1] + dy]], 0.8, shade(claw, -8)));
  // Waist chain trailing back.
  out.push(...chainLinks([11, 36], [2.6 + tr(2), 42 + w(2) * 0.5], 1.4, 7, chainD, shade(chainD, -12), robeD));
  // The robe.
  const hem = [[31, 44], [30.2, 49.6 + w(0)], [27.2, 46.2], [24.6, 50.6 + w(1)], [21.6, 46.4], [18.6, 50.2 + w(2)], [15.6, 46], [12 + tr(3) * 0.5, 48.8 + w(3)], [9.4 + tr(3) * 0.6, 44.4], [5 + tr(4), 46.4 + w(4)], [7.6 + tr(3) * 0.4, 38], [9, 28]];
  const robeP = [[7 + tr(1) * 0.6, 9.6 + w(1) * 0.3], [12, 4.2], [20, 1.4], [28, 3.8], [31.6, 10], [32.2, 18], [33, 26], [32.6, 36], ...hem, [10, 18], [9.2, 13.6]];
  out.push(...oT(robeP, robe));
  out.push(F(T([[9, 28], [7.6 + tr(3) * 0.4, 38], [5 + tr(4), 46.4 + w(4)], [9.4 + tr(3) * 0.6, 44.4], [12 + tr(3) * 0.5, 48.8 + w(3)], [13.4, 40], [13, 28], [11, 18], [10, 18]], robeD)));
  out.push(...stroke([[17, 30], [16 + tr(2) * 0.3, 40], [15.6 + tr(2) * 0.5, 45.6]], 0.7, robeD), ...stroke([[23.6, 30], [24 + tr(1) * 0.3, 40], [24.4 + tr(1) * 0.4, 49]], 0.7, robeD));
  out.push(...stroke([[28.6, 28], [29.4, 38], [28.6, 45]], 0.9, robeL), ...stroke([[20, 32], [20.4 + tr(1) * 0.3, 44]], 0.6, robeL));
  // Hood: lighter rim, bottomless dark inside, a fold over the brow.
  out.push(E(23, 14.4, 8.6, 8.8, robeL), F(E(23.8, 15.4, 6.8, 7.2, hood)));
  out.push(F(T([[16, 9], [20, 6.4], [27, 6.2], [30.4, 9.4], [26, 8.6], [20, 9.2]], robeL)));
  out.push(F(E(25, 11, 4.6, 1.2, shade(hood, 4))));
  // Face in the dark.
  const eyeY = 15.4 + (dead ? 1 : 0);
  out.push(...glowEyes(25, eyeY, 1.25, mood, { gap: 4, col: eyeC, core: '#fffbe0', halo: mix(eyeC, hood, 0.65), look: angry ? 0.3 : 0 }));
  if (angry) out.push(F(T([[21.6, 18.6], [28.4, 18.4], [27.6, 20.4], [26.6, 19.4], [25.4, 20.8], [24.4, 19.4], [23.2, 20.6], [22.4, 19.4]], mix(eyeC, hood, 0.15))));
  else if (hurt) out.push(F(E(25, 19.6, 0.9, 1, mix(eyeC, hood, 0.3))));
  else if (mood === 'happy') out.push(arc(25, 18.6, 1.6, 1.2, 20, 160, 0.5, mix(eyeC, hood, 0.2)));
  // Diagonal chain across the robe with a padlock.
  out.push(...chainLinks([10, 26], [31.6, 35.4], 1.6, 12, chain, chainD, robeD));
  out.push(...oT([[24.4, 33.6], [28, 33.4], [28.2, 37], [24.4, 37.2]], '#ffd66b', 0.5), arc(26.2, 33.6, 1.3, 1.6, 180, 360, 0.6, '#c9c4d6'), F(E(26.3, 35, 0.45, 0.45, '#6a4a3a')), F(T([[26.1, 35.2], [26.5, 35.2], [26.4, 36.4], [26.2, 36.4]], '#6a4a3a')));
  // Front sleeve reaching out, with a bony claw and a dangling broken shackle.
  const reach = [Math.sin(t) * 0.8 * amp + (angry ? 1 : 0), Math.cos(t) * 0.6 * amp + (dead ? 3 : 0)];
  const fh = [36 + reach[0], 28.6 + reach[1]];
  const end = [fh[0] - 1 + Math.sin(t - 1.2) * 2 * amp, fh[1] + 11];
  out.push(...chainLinks([fh[0] - 2, fh[1] + 1], end, 0.6, 6, chain, chainD, robe));
  out.push(...oE(end[0], end[1] + 1.4, 1.6, 1.5, chain, 0.5), F(E(end[0], end[1] + 1.4, 0.8, 0.7, robe)), F(E(end[0] + 1.6, end[1] + 2.2, 0.6, 0.5, robe)));
  out.push(...oT([[27, 18.6], [32.4, 21.6], [fh[0] + 1, fh[1] - 3.6], [fh[0] + 0.2, fh[1] + 1], [fh[0] - 2.2, fh[1] + 0.2], [fh[0] - 3.6, fh[1] + 1.6], [29.6, 27.4], [26.4, 25.6]], robe), F(T([[27, 18.6], [32.4, 21.6], [fh[0] + 1, fh[1] - 3.6], [fh[0] - 0.4, fh[1] - 2.6], [31, 23.2]], robeL)));
  const curl = angry ? 1.4 : hurt ? -0.6 : 0;
  out.push(...oE(fh[0] + 0.4, fh[1] - 0.2, 1.6, 1.3, claw, 0.5));
  for (const [dy, l] of [[-1, 3.4], [0.2, 3.8], [1.2, 3]]) out.push(...stroke([[fh[0] + 1, fh[1] - 0.2 + dy * 0.6], [fh[0] + 1 + l * 0.6, fh[1] + dy], [fh[0] + 1 + l * 0.8, fh[1] + dy + 1.4 + curl]], 0.8, claw));
  let shapes = out;
  if (hurt) shapes = mv(shapes, -1.4, 0);
  return { w: 40, h: 52, res: 3, shapes };
}

// ---------- Exports ----------

export const ART = {
  wisp: { walk: 6, idle: 4, draw: wisp },
  gloombat: { walk: 6, idle: 4, draw: imp },
  boneknight: { walk: 6, idle: 4, draw: dullahan },
  crystalslime: { walk: 6, idle: 3, draw: mimic },
  rockgolem: { walk: 6, idle: 4, draw: golem },
  shade: { walk: 6, idle: 4, draw: wraith },
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
