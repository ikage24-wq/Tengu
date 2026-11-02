// Hand-drawn 16x16 icons for monster drops and tonics. Every part is a flat polygon (lit from the
// top left: a light, a base, and a shadow tone), the sprite adds the dark outline, and a white glint
// finishes each one. `ITEM_ART[id]()` returns the shapes; icons.js draws them at res 3.

import { T, F, shade, mix } from '../pixel.js';

const D2R = Math.PI / 180;
const W = '#ffffff';
const GOLD = '#ffd25a';

// ---------- Tones ----------

const hi = (c) => mix(c, '#ffffff', 0.6);
const lt = (c) => mix(c, '#fff8ee', 0.32);
const sh = (c) => mix(shade(c, -14), '#7b5fb5', 0.18);
const dk = (c) => mix(shade(c, -30), '#4f3a80', 0.24);
// Inner lines match the sprite's outline: a deep, inky shade of the part they sit on.
const ink = (c) => mix(shade(c, -58), '#2a2035', 0.5);

// ---------- Geometry ----------

const S = (pts, c) => (pts.length > 2 ? F(T(pts, c)) : null);

function oval(cx, cy, rx, ry, deg = 0, n = 36) {
  const ca = Math.cos(deg * D2R);
  const sa = Math.sin(deg * D2R);
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    return [cx + x * ca - y * sa, cy + x * sa + y * ca];
  });
}

// An arc of an ellipse from a0 to a1 degrees (0 = right, 90 = down).
function arcPts(cx, cy, rx, ry, a0, a1, n = 12) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (a0 + ((a1 - a0) * i) / n) * D2R;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });
}

// Quadratic and cubic curves as point lists.
function bez(p0, p1, p2, n = 10) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
  });
}
function bez3(p0, p1, p2, p3, n = 12) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    return [0, 1].map((j) => k[0] * p0[j] + k[1] * p1[j] + k[2] * p2[j] + k[3] * p3[j]);
  });
}

const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

// Clips a polygon to a convex one (Sutherland-Hodgman).
function clip(sub, cl) {
  let area = 0;
  for (let i = 0; i < cl.length; i++) {
    const [ax, ay] = cl[i];
    const [bx, by] = cl[(i + 1) % cl.length];
    area += ax * by - bx * ay;
  }
  const sg = Math.sign(area) || 1;
  const inside = (p, a, b) => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
  const cross = (p, q, a, b) => {
    const d = (q[0] - p[0]) * (b[1] - a[1]) - (q[1] - p[1]) * (b[0] - a[0]);
    const t = ((a[0] - p[0]) * (b[1] - a[1]) - (a[1] - p[1]) * (b[0] - a[0])) / (d || 1e-9);
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  };
  let out = sub;
  for (let i = 0; i < cl.length && out.length; i++) {
    const a = cl[i];
    const b = cl[(i + 1) % cl.length];
    const inp = out;
    out = [];
    for (let j = 0; j < inp.length; j++) {
      const p = inp[j];
      const q = inp[(j + 1) % inp.length];
      const pin = inside(p, a, b);
      const qin = inside(q, a, b);
      if (pin) out.push(p);
      if (pin !== qin) out.push(cross(p, q, a, b));
    }
  }
  return out;
}

// The half plane to the right of the line a -> b (screen coordinates), as a big quad.
function side(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const ux = (dx / l) * 60;
  const uy = (dy / l) * 60;
  const A = [a[0] - ux, a[1] - uy];
  const B = [b[0] + ux, b[1] + uy];
  return [A, B, [B[0] - uy, B[1] + ux], [A[0] - uy, A[1] + ux]];
}
const cut = (pts, a, b) => clip(pts, side(a, b));

function bbox(pts) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const x1 = Math.max(...xs);
  const y1 = Math.max(...ys);
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

// A rounded form: shadow tone overall, the base lit by a big lens from the top left, and a
// light patch nearer the light. `k` tightens the base lens (bigger shadow), `glow` the light.
function ball(pts, c, { k = 1, glow = 1, light = lt(c), shadow = sh(c) } = {}) {
  const b = bbox(pts);
  const out = [S(pts, shadow), S(clip(pts, oval(b.cx - 0.2 * b.w, b.cy - 0.22 * b.h, 0.64 * b.w / k, 0.66 * b.h / k)), c)];
  if (glow) out.push(S(clip(pts, oval(b.cx - 0.32 * b.w, b.cy - 0.34 * b.h, 0.36 * b.w * glow, 0.34 * b.h * glow)), light));
  return out;
}

// A band along a polyline whose width goes from w0 to w1, or follows w0(t) (horns, quills, bones).
function tube(pts, w0, w1 = w0) {
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = lens[lens.length - 1] || 1;
  const L = [];
  const Rr = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / l;
    const ny = (b[0] - a[0]) / l;
    const t = lens[i] / total;
    const w = (typeof w0 === 'function' ? w0(t) : w0 + (w1 - w0) * t) / 2;
    L.push([p[0] + nx * w, p[1] + ny * w]);
    Rr.push([p[0] - nx * w, p[1] - ny * w]);
  });
  return [...L, ...Rr.reverse()];
}
const line = (pts, th, c) => S(tube(pts, th), c);

// A beveled slab: an inner face and the rim facets around it, each lit by how it faces the light.
function bevel(outer, inner, c, face = c) {
  const out = [S(outer, c)];
  const { cx, cy } = bbox(outer);
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length;
    const mx = (outer[i][0] + outer[j][0]) / 2 - cx;
    const my = (outer[i][1] + outer[j][1]) / 2 - cy;
    const d = (mx * -0.6 + my * -0.8) / (Math.hypot(mx, my) || 1);
    const tone = d > 0.55 ? hi(c) : d > 0.1 ? lt(c) : d > -0.4 ? c : d > -0.8 ? sh(c) : dk(c);
    out.push(S([outer[i], outer[j], inner[j], inner[i]], tone));
  }
  out.push(S(inner, face));
  return out;
}

// A 4-point sparkle.
function twinkle(x, y, r, c = W) {
  const q = r * 0.28;
  return S([[x, y - r], [x + q, y - q], [x + r, y], [x + q, y + q], [x, y + r], [x - q, y + q], [x - r, y], [x - q, y - q]], c);
}

// A soft, fluffy mass: discs along a spine (radius r(t) at t in 0..1), shadowed toward the bottom
// right and lit toward the top left, so the whole lock shades as one form. `tint(t)` recolors
// stretches of it (a tail's flame tip).
function fuzz(spine, r, c, tint = () => c) {
  const n = spine.length - 1;
  const discs = spine.map((p, i) => [p[0], p[1], r(i / n), tint(i / n)]);
  return [
    ...discs.map(([x, y, rr, col]) => S(oval(x, y, rr, rr, 0, 24), sh(col))),
    ...discs.map(([x, y, rr, col]) => S(oval(x - rr * 0.2, y - rr * 0.24, rr * 0.8, rr * 0.78, 0, 24), col)),
    ...discs.map(([x, y, rr, col]) => S(oval(x - rr * 0.38, y - rr * 0.44, rr * 0.4, rr * 0.36, 0, 16), lt(col))),
  ];
}

// The crisp white glint: a short slanted stroke and a dot.
function glint(x, y, s = 1) {
  return [S(oval(x, y, 0.5 * s, 1.05 * s, 35, 16), W), S(oval(x + 1.1 * s, y - 1.25 * s, 0.38 * s, 0.38 * s, 0, 12), W)];
}

// A pointed leaf from base b to tip t, `wid` wide, its spine bowed by `bend`; the lit half takes
// the light tone, the far half the base, with a midrib.
function leaf(b, t, wid, c, { bend = 0, rib = lt(c), lit = 1, veins = 0, veinC = rib } = {}) {
  const dx = t[0] - b[0];
  const dy = t[1] - b[1];
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const mid = bez(b, [(b[0] + t[0]) / 2 + nx * bend, (b[1] + t[1]) / 2 + ny * bend], t, 14);
  const hw = (i) => {
    const u = i / 14;
    return (wid / 2) * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 0.85);
  };
  const A = mid.map((p, i) => [p[0] + nx * hw(i), p[1] + ny * hw(i)]);
  const B = mid.map((p, i) => [p[0] - nx * hw(i), p[1] - ny * hw(i)]);
  // Which half faces the light (top left)?
  const aLit = nx * -0.6 + ny * -0.8 > 0;
  const halfA = [...mid, ...A.slice().reverse()];
  const halfB = [...mid, ...B.slice().reverse()];
  const out = [S(halfA, aLit === Boolean(lit) ? lt(c) : sh(c)), S(halfB, aLit === Boolean(lit) ? sh(c) : lt(c))];
  // A base-tone body inside, so each half has light at its rim side and shadow toward the spine.
  out.push(S(tube(mid, wid * 0.42, 0.2), c));
  for (let v = 1; v <= veins; v++) {
    const i = Math.round((v / (veins + 1)) * 12);
    const p = mid[i];
    const q = mid[Math.min(14, i + 2)];
    for (const s of [1, -1]) {
      const w = hw(i + 1) * 0.8;
      out.push(line([p, [q[0] + nx * s * w, q[1] + ny * s * w]], 0.32, veinC));
    }
  }
  out.push(S(tube(mid.slice(0, 13), 0.45, 0.15), rib));
  return { shapes: out, A, B, mid };
}

const turn = (pts, deg, cx = 8, cy = 8) => {
  const ca = Math.cos(deg * D2R);
  const sa = Math.sin(deg * D2R);
  return pts.map(([x, y]) => [cx + (x - cx) * ca - (y - cy) * sa, cy + (x - cx) * sa + (y - cy) * ca]);
};

// ---------- Monster drops ----------

function fluff() {
  const cream = '#ffcf9e';
  const pink = '#ff5fa2';
  const n = 20;
  const spine = bez3([7.2, 15], [1.6, 12.4], [2.6, 4.2], [15, 1.4], n);
  const nrm = (i) => {
    const a = spine[Math.max(0, i - 1)];
    const b = spine[Math.min(n, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
  };
  // Half width along the tail: slim at the root, bushy in the middle, tufted toward the tip.
  const hw = (i) => {
    const t = i / n;
    const base = 0.7 + 3.2 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.8) * (1 - 0.25 * t);
    return i > 3 && i < n ? base * (i % 2 ? 0.84 : 1.13) : base;
  };
  const A = spine.map((p, i) => [p[0] + nrm(i)[0] * hw(i), p[1] + nrm(i)[1] * hw(i)]);
  const B = spine.map((p, i) => [p[0] - nrm(i)[0] * hw(i), p[1] - nrm(i)[1] * hw(i)]);
  const body = [...A, ...B.reverse()];
  const out = [...ball(body, cream, { k: 0.95, glow: 1.1 })];
  // The spirit-flame tip: blush pink deepening to hot pink.
  const at = (i) => [spine[i], [spine[i][0] + nrm(i)[0], spine[i][1] + nrm(i)[1]]];
  const [p1, q1] = at(12);
  const [p2, q2] = at(15);
  const blush = cut(body, q1, p1);
  const tip = cut(body, q2, p2);
  out.push(S(blush, '#ffc8e0'), S(clip(blush, oval(9, 3, 4, 3)), '#ffdcea'));
  out.push(S(tip, pink), S(clip(tip, oval(16, 4.6, 3.2, 3)), shade(pink, -10)));
  // Two licks of flame curling off the tip.
  for (const [i, s, len] of [[16, 1, 2.6], [18, -1, 2]]) {
    const [nx, ny] = nrm(i);
    const p = [spine[i][0] + nx * hw(i) * s * 0.7, spine[i][1] + ny * hw(i) * s * 0.7];
    const d = [spine[i + 1][0] - spine[i][0], spine[i + 1][1] - spine[i][1]];
    const dl = Math.hypot(...d);
    const e = [p[0] + (d[0] / dl) * len + nx * s * len * 0.7, p[1] + (d[1] / dl) * len + ny * s * len * 0.7];
    out.push(S(tube(bez(p, [p[0] + nx * s * len * 0.6, p[1] + ny * s * len * 0.6], e, 6), (u) => 1.5 * (1 - u), 0), pink));
  }
  // Flickers of flame and strands of fur running along the tail.
  out.push(S(tube(spine.slice(14, 20).map(([x, y]) => [x - 0.4, y - 0.3]), 1, 0.1), '#ffd6e8'));
  for (const [d, a, b] of [[1.2, 3, 9], [-1.2, 5, 10], [0, 7, 12]]) {
    out.push(line(spine.slice(a, b).map(([x, y], k) => [x + nrm(a + k)[0] * d, y + nrm(a + k)[1] * d]), 0.3, sh(cream)));
  }
  out.push(...glint(4.6, 8.4, 0.8));
  return out;
}

function shell() {
  const c = '#e3a868';
  const hex = (r, cx = 8, cy = 8.6) => Array.from({ length: 6 }, (_, i) => [cx + Math.cos((i * 60 - 90) * D2R) * r * 1.05, cy + Math.sin((i * 60 - 90) * D2R) * r]);
  const outer = hex(6.9);
  const inner = hex(4.1, 7.9, 8.5);
  const out = bevel(outer, inner, c, '#f3c587');
  // Growth rings on the raised face.
  const ring = hex(2.8, 7.9, 8.7);
  out.push(...ring.map((p, i) => line([p, ring[(i + 1) % 6]], 0.3, '#d29458')));
  out.push(S(hex(1.5, 7.8, 8.7), '#e9b06e'));
  out.push(...inner.map((p, i) => line([p, inner[(i + 1) % 6]], 0.3, '#c98a50')));
  // Moss over the top-left corner, with a little pink flower.
  const moss = '#8ad06a';
  const clumps = [oval(4.4, 4.6, 2.9, 1.9, -25, 24), oval(7.4, 2.8, 2.5, 1.5, -5, 24), oval(2.6, 7.4, 1.5, 2.1, 0, 20)];
  for (const m of clumps) out.push(S(m, sh(moss)));
  for (const m of clumps) out.push(S(clip(m, oval(bbox(m).cx - 0.5, bbox(m).cy - 0.6, bbox(m).w * 0.48, bbox(m).h * 0.5)), moss));
  out.push(S(oval(4, 3.9, 1.1, 0.6, -25, 14), lt(moss)), S(oval(7, 2.2, 1, 0.5, 0, 14), lt(moss)));
  out.push(line([[3.2, 6.2], [3.6, 5.2]], 0.3, dk(moss)), line([[5.8, 5], [6.2, 4]], 0.3, dk(moss)), line([[8.6, 3.6], [8.9, 2.8]], 0.3, dk(moss)));
  const fl = [9.6, 2.2];
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * D2R;
    out.push(S(oval(fl[0] + Math.cos(a) * 0.95, fl[1] + Math.sin(a) * 0.95, 0.72, 0.72, 0, 14), i === 0 || i === 4 ? '#ffd0e2' : '#ff9ec0'));
  }
  out.push(S(oval(fl[0], fl[1], 0.55, 0.55, 0, 12), '#ffe36b'));
  out.push(...glint(10.2, 6.6, 0.7));
  return out;
}

function sprout_leaf() {
  const g = '#7fd17a';
  const out = [];
  for (const [b, t, w, bend] of [[[6.8, 9.2], [1.4, 3.6], 4, 0.8], [[9.2, 9.2], [14.6, 3.8], 4, -0.8], [[8, 9], [8.2, 0.8], 4.6, 0.4]]) {
    out.push(...leaf(b, t, w, g, { bend, rib: '#c8f0a8', veins: 2, veinC: shade(g, -8) }).shapes);
  }
  // The root peeking up, with a sleepy little face.
  const root = '#f5d3a6';
  const bulb = [...bez3([4.2, 11.6], [4.4, 8.6], [11.6, 8.6], [11.8, 11.6], 10), ...bez3([11.8, 11.6], [12, 14], [9.2, 14.4], [8.4, 15.6], 8).slice(1), ...bez3([8.4, 15.6], [7.6, 14.4], [4, 14], [4.2, 11.6], 8).slice(1)];
  out.push(...ball(bulb, root, { k: 0.95 }));
  out.push(line(bez([10.4, 13.6], [12.2, 13.8], [13, 15], 5), 0.45, sh(root)));
  out.push(line([[5.2, 12.8], [4.2, 13.6]], 0.4, sh(root)));
  // Leaf collar where the leaves meet the root.
  out.push(S(oval(8, 9.6, 2.6, 0.9, 0, 18), shade(g, -10)), S(oval(7.6, 9.4, 1.6, 0.5, 0, 14), g));
  const eye = (x) => [S(oval(x, 11.7, 0.48, 0.66, 0, 14), '#4a3352'), S(oval(x - 0.16, 11.42, 0.2, 0.2, 0, 8), W)];
  out.push(...eye(6.6), ...eye(9.3));
  out.push(S(oval(5.6, 12.8, 0.7, 0.36, 0, 12), '#ffaebe'), S(oval(10.3, 12.8, 0.7, 0.36, 0, 12), '#ffaebe'));
  out.push(S(arcPts(7.95, 12.5, 0.5, 0.42, 20, 160, 6).concat(arcPts(7.95, 12.5, 0.2, 0.15, 160, 20, 6)), '#b2506c'));
  return out;
}

function mushcap() {
  const red = '#ff6670';
  const under = '#fbe6c8';
  const out = [];
  // Stem stub and the gills under the brim.
  out.push(...ball(rect(6.4, 11, 3.2, 4.2).map(([x, y], i) => (i > 1 ? [x + (i === 2 ? 0.3 : -0.3), y] : [x, y])), '#fff4e2', { glow: 0 }));
  const gills = oval(8, 11.4, 6.6, 1.6, 0, 30);
  out.push(S(gills, sh(under)), S(cut(gills, [14, 11.2], [2, 11.2]), under));
  for (let x = 3.4; x <= 12.8; x += 1.55) out.push(line([[x, 10.6], [8 + (x - 8) * 0.7, 12.4]], 0.26, shade(under, -14)));
  // The dome.
  const cap = [...arcPts(8, 10.6, 7.4, 8.6, 180, 360, 24), ...bez([15.4, 10.6], [8, 12.8], [0.6, 10.6], 8).slice(1)];
  out.push(...ball(cap, red, { k: 0.95, glow: 1.05 }));
  // Spots, squashed toward the rim.
  for (const [x, y, rx, ry, a] of [[4.8, 6.4, 1.6, 1.4, -20], [9.6, 4.2, 1.35, 1.05, 0], [12.4, 8, 1.3, 1.25, 20], [7.6, 8.4, 1.15, 0.95, 0], [2.4, 9.6, 0.6, 0.75, 0], [12.2, 4.8, 0.55, 0.5, 0], [10.4, 9.9, 0.7, 0.5, 0]]) {
    const sp = oval(x, y, rx, ry, a, 20);
    out.push(S(sp, x > 9 && y > 7 ? '#f2dce8' : '#ffeef2'), S(clip(sp, oval(x - rx * 0.3, y - ry * 0.35, rx * 1.05, ry * 1.05, 0, 16)), W));
  }
  // A glossy rim light along the top left.
  out.push(S(tube(arcPts(8, 10.6, 6.4, 7.6, 205, 245, 8), 0.55, 0.2), '#ffc2c6'));
  out.push(...glint(5.8, 3.8, 0.75));
  return out;
}

function ribbon() {
  const horn = '#f3e0bd';
  const out = [];
  const antler = (pts, w0, w1) => {
    out.push(S(tube(pts, w0, w1), sh(horn)));
    out.push(S(tube(pts.map(([x, y]) => [x - 0.26, y - 0.24]), w0 * 0.6, w1 * 0.5), horn));
    out.push(S(tube(pts.slice(2, -2).map(([x, y]) => [x - 0.5, y - 0.45]), w0 * 0.18, w1 * 0.3), lt(horn)));
  };
  // Short tines along the top of one sweeping beam, then the beam over their roots.
  antler(bez([7.4, 5.6], [9.4, 4.6], [10.4, 1.4], 8), 1.8, 0.6);
  antler(bez([9.6, 8.6], [12, 7.8], [13.6, 5], 8), 1.9, 0.6);
  antler(bez([10.6, 11.6], [8.6, 10.6], [7.4, 8.4], 6), 1.6, 0.6);
  antler(bez3([10.8, 14.2], [12.6, 8.6], [5.4, 7.6], [3, 1.8], 18), 3, 0.8);
  out.push(S([[2.4, 0.6], [3.8, 1.6], [2.8, 2.6]], horn), S([[10, 0.2], [11.2, 0.8], [10.6, 1.8]], horn), S([[13.4, 4.2], [14.6, 4.6], [13.8, 5.6]], horn));
  for (const [p, q] of [[[10.8, 12.4], [12.4, 12.6]], [[11.4, 10.6], [12.8, 10.8]], [[5.4, 4.8], [6.4, 4.2]]]) out.push(line([p, q], 0.3, sh(horn)));
  // The knobbly burr at the base.
  const burr = oval(10.8, 14.3, 2.8, 1.3, -6, 20);
  out.push(...ball(burr, '#c99a6a', { glow: 0.8 }));
  for (const x of [8.8, 10.4, 12]) out.push(S(oval(x, 13.9, 0.45, 0.32, 0, 10), '#e6bf8e'));
  // A pink bow tied round the beam.
  const pink = '#ff7aa6';
  const k = [10.8, 11.6];
  out.push(S([[k[0] - 0.2, k[1] + 0.3], [7, 14], [8.2, 14.6]], sh(pink)));
  const loopL = [[k[0], k[1]], ...bez([8, 9.4], [6.4, 11], [7.6, 12.8], 6), [k[0], k[1] + 0.6]];
  const loopR = [[k[0] + 0.4, k[1]], ...bez([13.4, 9.2], [15.4, 11], [13.6, 12.8], 6), [k[0] + 0.4, k[1] + 0.6]];
  out.push(...ball(loopL, pink, { glow: 0.7 }), ...ball(loopR, pink, { glow: 0.7 }));
  out.push(S(oval(k[0] + 0.2, k[1] + 0.3, 1, 0.95, 0, 14), shade(pink, -10)), S(oval(k[0], k[1] + 0.1, 0.45, 0.4, 0, 10), lt(pink)));
  out.push(...glint(5.4, 4.6, 0.5));
  return out;
}

function pebble() {
  // A basilisk scute: a glossy jade-teal hexagonal plate with a raised keel and growth ridges,
  // nothing like a leaf (no point, no stem, no veins).
  const c = '#22a6a8';
  const a = -12;
  const hex = (k, dy = 0) => turn([[8, 8 - 6.8 * k], [8 + 5.8 * k, 8 - 3.4 * k], [8 + 5.6 * k, 8 + 3.2 * k], [8, 8 + 6.8 * k], [8 - 5.6 * k, 8 + 3.2 * k], [8 - 5.8 * k, 8 - 3.4 * k]].map(([x, y]) => [x, y + dy]), a);
  const body = hex(1);
  const face = hex(0.84, -0.3);
  const out = [S(body, dk(c)), S(face, c)];
  // Lit upper-left half, shaded lower right.
  const [kt, kb] = turn([[8, 0.8], [8, 15.2]], a);
  out.push(S(cut(face, kb, kt), sh(c)));
  out.push(S(clip(cut(face, kt, kb), oval(5.4, 5.2, 3.6, 3.6)), lt(c)));
  // Growth ridges: two nested hex rings, lit on the top edges and dark below.
  for (const k of [0.62, 0.4]) {
    const r = hex(k, -0.3);
    out.push(line([r[5], r[0], r[1]], 0.5, hi(c)), line([r[2], r[3], r[4]], 0.5, dk(c)));
  }
  // The raised keel down the middle.
  out.push(line([kt, kb].map(([x, y], i) => [x + (i ? -0.4 : 0.4), y + (i ? -2.6 : 2.4)]), 0.55, hi(c)));
  // Gloss: a bright streak along the top-left edge and a glint.
  out.push(S(tube([body[5], body[0]].map(([x, y]) => [x + 0.9, y + 0.9]), 0.55, 0.2), '#e8fff6'));
  out.push(S(tube(turn([[11.6, 9.6], [9.4, 12.4]], a), 0.4, 0.15), mix(c, '#b8fff0', 0.5)));
  out.push(...glint(5, 4.6, 0.95));
  return out;
}

function stinger() {
  const c = '#ff6b8e';
  const plum = '#7a3470';
  const out = [];
  // A tail segment behind.
  out.push(...ball(oval(2.4, 14.2, 2, 1.6, -40, 20), shade(c, -10), { glow: 0.6 }));
  out.push(S(tube(turn(arcPts(2.4, 14.2, 1.3, 1.6, -60, 60, 6), -40, 2.4, 14.2), 0.4, 0.2), dk(c)));
  // The needle: arching up and over, then stabbing down to a sharp point.
  const needle = bez3([7.4, 8.4], [10, 3.6], [14, 0.6], [14.8, 9], 18);
  out.push(S(tube(needle, (u) => 2.8 * Math.pow(1 - u, 0.85) + 0.1), dk(plum)));
  out.push(S(tube(needle.slice(0, 15).map(([x, y]) => [x - 0.22, y - 0.18]), (u) => 1.8 * (1 - u) + 0.1), plum));
  out.push(S(tube(needle.slice(2, 10).map(([x, y]) => [x - 0.4, y - 0.5]), 0.5, 0.25), mix(plum, '#ffffff', 0.45)));
  out.push(S(tube(needle.slice(15), 0.7, 0.1), '#f4d8e8'));
  // The plump venom bulb, plated.
  const bulb = oval(6.2, 10.2, 4, 3.1, -48, 30);
  out.push(...ball(bulb, c, { k: 0.95 }));
  for (const d of [-1.4, 0.5]) {
    const cx = 6.2 + d * 0.67;
    const cy = 10.2 - d * 0.74;
    out.push(S(tube(turn(arcPts(cx, cy, 1, 3, -70, 70, 8), -48, cx, cy), 0.36, 0.2), sh(c)));
  }
  // A drop of venom falling from the point.
  const drop = [...bez([14.6, 11.2], [15.8, 13], [14.6, 13.6], 4), ...bez([14.6, 13.6], [13.4, 13], [14.6, 11.2], 4).slice(1)];
  out.push(...ball(drop, '#a8f070', { glow: 0.8 }));
  out.push(...glint(4.8, 9.2, 0.75));
  return out;
}

function leaf_fragment() {
  const g = '#7ccc3e';
  const glow = '#f2ffb8';
  const L = leaf([2.2, 14.2], [14.4, 1.4], 9.2, g, { bend: 0.6, rib: glow, veins: 3, veinC: '#d6ffa0' });
  const out = [line(bez([0.8, 15.4], [1.4, 14.8], [2.6, 13.8], 3), 0.8, '#8a5a2a'), ...L.shapes];
  // A soft inner glow along the spine.
  out.push(S(tube(L.mid.slice(3, 12), 0.9, 0.5), mix(g, glow, 0.45)), S(tube(L.mid.slice(1, 13), 0.42, 0.18), glow));
  out.push(twinkle(13.6, 9.6, 1.5, '#fff6a8'), twinkle(3.2, 3.6, 1.1, '#fff6a8'), twinkle(11.6, 13.6, 0.8, W));
  out.push(...glint(6.2, 6.6, 0.7));
  return out;
}

function tusk() {
  const c = '#fff4dc';
  const spine = bez3([3.2, 2.4], [10.8, 1.6], [14.4, 7], [11.2, 15], 18);
  const out = [S(tube(spine, 5.4, 0.3), sh(c))];
  out.push(S(tube(spine.map(([x, y]) => [x - 0.45, y - 0.3]), 3.8, 0.2), c));
  out.push(S(tube(spine.slice(2, 13).map(([x, y]) => [x - 0.6, y - 1.1]), 0.7, 0.25), W));
  // The root end, worn and warmer.
  const root = cut(tube(spine, 5.4, 0.3), [5.6, 0], [4.6, 6]);
  out.push(S(root, '#e9c79a'), S(cut(root, [5, 6], [1, 2.4]), '#d4a878'));
  out.push(S(oval(2.7, 2.6, 0.7, 2.4, 8, 18), '#f2d9b0'));
  // A leather cord tied round it.
  const cord = '#a86a4a';
  const wrap = clip(tube(spine, 5.4, 0.3), [[5.2, -1], [7, -1], [6.4, 7], [4.6, 7]]);
  out.push(S(wrap, cord), S(cut(wrap, [6, 7], [6.4, -1]), sh(cord)));
  out.push(line([[5.2, 1.6], [6.8, 1.8]], 0.3, dk(cord)), line([[5, 3.4], [6.6, 3.6]], 0.3, dk(cord)));
  out.push(line(bez([5.6, 5.4], [5, 7.6], [3.8, 8.8], 6), 0.55, cord), line(bez([6.2, 5.4], [6.4, 7.8], [6, 9.4], 6), 0.55, sh(cord)));
  out.push(...ball(oval(3.6, 9.4, 1, 1, 0, 14), '#7fd3ff', { glow: 0.8 }));
  out.push(S(oval(3.3, 9.1, 0.3, 0.3, 0, 8), W));
  return out;
}

function moss_stone() {
  const bark = '#9a6a4a';
  const wood = '#f2cb92';
  const out = [];
  // The log's side, swept back toward the bottom right.
  for (let i = 8; i >= 0; i--) {
    const k = i / 8;
    out.push(S(oval(7.4 + k * 1.4, 7.4 + k * 2.4, 6.2, 5.4, -12, 30), i > 5 ? dk(bark) : i > 2 ? sh(bark) : bark));
  }
  // Bark ridges.
  for (const [x, y] of [[3, 11.4], [6.2, 13.6], [10.2, 13.6], [13.2, 11]]) out.push(line([[x, y - 0.6], [x + 0.4, y + 0.8]], 0.4, dk(bark)));
  const face = oval(7.4, 7.4, 6.2, 5.4, -12, 36);
  out.push(S(face, '#c99a62'));
  out.push(...ball(oval(7.3, 7.3, 5.6, 4.8, -12, 36), wood, { glow: 0.9 }));
  // Growth rings around a glowing heart.
  for (const k of [0.78, 0.56]) out.push(S(tube([...oval(7.6, 7.6, 5.6 * k, 4.8 * k, -12, 30), oval(7.6, 7.6, 5.6 * k, 4.8 * k, -12, 30)[0]], 0.32), '#d8a46a'));
  out.push(S(oval(7.7, 7.7, 2.2, 1.9, -12, 22), '#c8f7a6'));
  out.push(S(oval(7.7, 7.7, 1.45, 1.25, -12, 18), '#86e86a'), S(oval(7.5, 7.5, 0.75, 0.62, 0, 12), W));
  // A crack from the edge.
  out.push(line([[12.4, 5.2], [10.6, 6.4], [11.2, 7]], 0.36, '#a8794a'));
  // Moss tufts on the rim.
  const moss = '#86c86a';
  for (const [x, y, rx, ry] of [[3.4, 3.6, 2.2, 1.3], [5.8, 2.4, 1.8, 1.1], [2, 6, 1, 1.4]]) {
    const m = oval(x, y, rx, ry, -20, 20);
    out.push(S(m, sh(moss)), S(clip(m, oval(x - 0.5, y - 0.5, rx, ry)), moss), S(oval(x - 0.5, y - 0.3, rx * 0.4, ry * 0.3, -20, 10), lt(moss)));
  }
  out.push(twinkle(11.8, 2.4, 1.2, '#e8ffb0'));
  return out;
}

function wisp_flame() {
  const brass = '#e6b04a';
  const out = [];
  out.push(S(tube(arcPts(8, 2.4, 2.2, 2, 180, 360, 12), 0.8), sh(brass)));
  // Glass globe, glowing from within.
  const globe = [...bez3([4.2, 5], [2.6, 7.4], [2.6, 10.6], [4.4, 12.6], 10), ...bez3([11.6, 12.6], [13.4, 10.6], [13.4, 7.4], [11.8, 5], 10)];
  out.push(S(globe, '#b4e2fa'), S(clip(globe, oval(7.4, 8.2, 5.4, 4.8)), '#dcf4ff'));
  out.push(S(oval(8, 9.8, 3.8, 3, 0, 24), '#c6ecff'));
  // The spirit flame: blue, then pale, then a white-hot heart.
  const flame = (k) => {
    const pts = [[8.6, 4.6], ...bez3([8.6, 4.6], [10.4, 6.6], [11.2, 8.4], [10.6, 10.4], 8).slice(1), ...arcPts(8, 10.2, 2.65, 2.3, 5, 175, 10), ...bez3([5.4, 10.4], [4.8, 8.6], [7, 7.6], [8.6, 4.6], 8).slice(1)];
    return pts.map(([x, y]) => [8 + (x - 8) * k, 12.4 + (y - 12.4) * k]);
  };
  out.push(S(flame(1), '#4f9cff'), S(flame(0.72).map(([x, y]) => [x - 0.1, y]), '#a6e0ff'), S(flame(0.42).map(([x, y]) => [x - 0.1, y - 0.1]), W));
  out.push(S([[7.6, 7.6], [6.4, 5.4], [7.2, 6.2]], '#4f9cff'));
  // Frame bars.
  out.push(S(tube(bez3([4.2, 5], [2.6, 7.4], [2.6, 10.6], [4.4, 12.6], 10), 0.55), brass), S(tube(bez3([11.8, 5], [13.4, 7.4], [13.4, 10.6], [11.6, 12.6], 10), 0.55), sh(brass)));
  out.push(...bevel([[4.4, 5.6], [5.4, 3.6], [10.6, 3.6], [11.6, 5.6]], [[5, 5.2], [5.8, 4.1], [10.2, 4.1], [11, 5.2]], brass));
  out.push(S(oval(8, 3.5, 1, 0.7, 0, 12), sh(brass)));
  out.push(...bevel([[3.8, 12.2], [12.2, 12.2], [11.4, 14.8], [4.6, 14.8]], [[4.5, 12.7], [11.5, 12.7], [10.9, 14.3], [5.1, 14.3]], brass));
  out.push(S(tube(bez([4.2, 10.4], [3.9, 8], [5.2, 6.2], 6), 0.55, 0.3), W), S(oval(11.4, 10.8, 0.32, 0.55, 20, 10), W));
  return out;
}

function bat_wing() {
  const c = '#a08ad8';
  const bone = '#5d4796';
  const joint = [2.6, 4.4];
  const tips = [[14.8, 2.4], [14, 9.8], [9.8, 13.2], [4.6, 15]];
  const mem = [joint, ...bez(joint, [8.6, 0.6], tips[0], 8).slice(1), ...bez(tips[0], [13.2, 6.4], tips[1], 5).slice(1), ...bez(tips[1], [11, 9.4], tips[2], 5).slice(1), ...bez(tips[2], [7.6, 11.6], tips[3], 5).slice(1), ...bez(tips[3], [2.2, 10.8], joint, 6).slice(1)];
  const out = [S(mem, c)];
  // Each panel of membrane between two fingers takes its own tone, like a folded fan.
  const tones = [lt(c), c, sh(c)];
  const panel = (a, b) => [joint, a, b];
  out.push(S(clip(mem, panel([30, -10], tips[1])), tones[0]));
  out.push(S(clip(mem, panel([tips[1][0] + 4, tips[1][1] + 4], tips[2])), tones[1]));
  out.push(S(clip(mem, panel([tips[2][0] + 1, tips[2][1] + 6], [-6, 30])), tones[2]));
  // Finger bones.
  out.push(S(tube(bez(joint, [8.6, 1.4], tips[0], 10), 1.3, 0.5), bone));
  for (const t of tips.slice(1)) out.push(S(tube([joint, t], 0.8, 0.35), shade(bone, 6)));
  out.push(S(tube(bez([3.4, 3.8], [8.6, 1.2], [13.4, 2.4], 8), 0.35), mix(bone, '#ffffff', 0.35)));
  // The joint and its little claw.
  out.push(...ball(oval(joint[0], joint[1], 1.4, 1.4, 0, 16), bone, { glow: 0.9 }));
  out.push(S([[1.8, 3.4], [0.6, 0.8], [2.2, 1.6], [3, 3.2]], '#fff0e0'), S([[2.2, 3.3], [1.2, 1.4], [2.2, 1.6], [3, 3.2]], '#e6cfe0'));
  out.push(...glint(6.2, 5.6, 0.7));
  return out;
}

function bone_shard() {
  const c = '#f2ebdc';
  const out = [];
  // The knobbly end: two round lobes.
  const knobs = [oval(4.6, 2.8, 2.2, 2.2, 0, 22), oval(2.6, 5.6, 2.2, 2.2, 0, 22)];
  for (const k of knobs) out.push(S(k, sh(c)));
  // The shaft, snapped off in jagged points at the far end.
  const shaft = [[3.6, 2.8], [5.4, 4.4], [12, 9.6], [13.2, 9.4], [12.8, 11], [14.4, 11.6], [12.6, 12.6], [12.2, 14.4], [11, 12.8], [4.4, 6.2], [2.6, 4.6]];
  out.push(...ball(shaft, c, { k: 1.05 }));
  for (const k of knobs) out.push(S(clip(k, oval(bbox(k).cx - 0.5, bbox(k).cy - 0.5, 1.9, 1.9)), c), S(oval(bbox(k).cx - 0.7, bbox(k).cy - 0.7, 0.8, 0.6, -30, 12), lt(c)));
  // The hollow inside the break.
  out.push(S([[11.6, 10.6], [12.8, 11.4], [12, 12.6], [11.2, 11.8]], '#d8b486'), S([[11.9, 11.2], [12.4, 11.5], [12, 12]], '#b88a5e'));
  // Cracks.
  out.push(line([[9.6, 8.2], [8.8, 9.2], [9.4, 9.6], [8.6, 10.4]], 0.32, ink(c)));
  out.push(line([[6.6, 5.6], [6.2, 6.6]], 0.28, sh(c)));
  // A splinter that broke loose.
  out.push(...ball([[13.4, 13.2], [15.2, 13.6], [14.6, 15.2]], c, { glow: 0 }));
  out.push(S(tube(bez([4.6, 4.4], [7.4, 5.8], [10.6, 8.6], 6), 0.55, 0.25), W));
  out.push(...glint(3.8, 2.4, 0.6));
  return out;
}

function crystal_gel() {
  const c = '#8fe4ff';
  const g = 6;
  const L = 1.2;
  const Rx = 14.8;
  const top = 2.2;
  const tip = [8, 15.4];
  const out = [];
  // Crown facets, then the pavilion.
  out.push(S([[L, g], [4.6, top], [5.8, g]], lt(c)));
  out.push(S([[4.6, top], [11.4, top], [10.2, g], [5.8, g]], hi(c)));
  out.push(S([[11.4, top], [Rx, g], [10.2, g]], c));
  out.push(S([[L, g], [5.8, g], tip], c));
  out.push(S([[5.8, g], [10.2, g], tip], sh(c)));
  out.push(S([[10.2, g], [Rx, g], tip], dk(c)));
  for (const [p, q] of [[[L, g], [Rx, g]], [[5.8, g], tip], [[10.2, g], tip], [[4.6, top], [5.8, g]], [[11.4, top], [10.2, g]]]) out.push(line([p, q], 0.26, mix(c, '#3a7aa8', 0.45)));
  // The mimic's eye on the table, and a grin of little teeth along the girdle.
  out.push(S(oval(8, 4.2, 1.9, 1.25, 0, 22), W), S(oval(8, 4.2, 1.2, 1.15, 0, 18), '#ffb43c'), S(oval(8, 4.2, 0.34, 1.05, 0, 12), '#3a2140'), S(oval(7.5, 3.75, 0.28, 0.28, 0, 8), W));
  out.push(S([[3.6, g], [4.4, g], [4, 7.6]], W), S([[5.4, g], [6.4, g], [5.9, 8]], W), S([[9.6, g], [10.6, g], [10.1, 8]], W), S([[11.6, g], [12.4, g], [12, 7.6]], W));
  out.push(S(tube([[2.6, 5.4], [4.4, 3.2]], 0.42), W), twinkle(13.6, 1.6, 1.2), S(oval(6.6, 10, 0.32, 0.9, -15, 10), W));
  return out;
}

function rock_core() {
  const rock = '#a094a6';
  const lump = (r, cx, cy, j, seed = 0) => Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const rr = r * (1 + j * Math.sin(i * 2.7 + seed) * 0.6 + j * Math.cos(i * 1.3 + seed) * 0.4);
    return [cx + Math.cos(a) * rr * 1.04, cy + Math.sin(a) * rr];
  });
  const outer = lump(7, 8.2, 8.6, 0.1);
  const out = [...ball(outer, rock, { k: 1.15, glow: 0.8 })];
  for (const [x, y] of [[13.8, 11.2], [11.6, 14.4], [3.4, 13.2], [14.2, 6]]) out.push(S(oval(x, y, 0.45, 0.32, 20, 8), dk(rock)));
  // The cut face, tipped toward us: a pale agate band, then the hollow full of crystal.
  const face = lump(5.6, 7.5, 7.8, 0.07, 1);
  out.push(S(face, '#e4d8f4'), S(clip(face, oval(6.4, 6.6, 5.6, 5.2)), '#f8f3ff'));
  const hollow = lump(4.2, 7.5, 7.9, 0.09, 2);
  out.push(S(hollow, '#5b3a9c'));
  const purple = '#a777ee';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const len = 2.4 + (i % 3) * 0.5;
    const bx = 7.5 + Math.cos(a) * 4;
    const by = 7.9 + Math.sin(a) * 3.9;
    const tx = 7.5 + Math.cos(a) * (4 - len);
    const ty = 7.9 + Math.sin(a) * (3.9 - len);
    const px = -Math.sin(a) * 1;
    const py = Math.cos(a) * 1;
    const litSide = Math.cos(a) * -0.6 + Math.sin(a) * -0.8 < 0;
    out.push(S([[bx + px, by + py], [tx, ty], [bx, by]], litSide ? '#dcc6ff' : purple), S([[bx - px, by - py], [tx, ty], [bx, by]], litSide ? purple : '#7a4ec8'));
  }
  out.push(S(oval(7.5, 7.9, 0.9, 0.8, 0, 12), '#3e2470'));
  out.push(twinkle(6.2, 6, 1.6), S(oval(9.8, 10, 0.35, 0.35, 0, 8), W));
  out.push(...glint(3.2, 4, 0.55));
  return out;
}

function shade_cloth() {
  const c = '#6c5a9e';
  const hem = [[14.8, 12.4], [13.4, 11.6], [12.4, 15], [10.8, 12.2], [8.8, 15.6], [7.2, 12.4], [5, 15.2], [4, 11.8], [1.2, 13.4]];
  const body = [[7.2, 1.2], [8.8, 1.2], ...bez([9, 2.4], [13, 4], [14.8, 12.4], 8), ...hem.slice(1), ...bez([1.2, 13.4], [2.8, 4], [7, 2.4], 8)];
  const out = [S(body, sh(c))];
  // Folds fanning out from the knot: lit and shaded strips.
  const fold = (x0, x1, x2, col) => out.push(S(clip(body, [[x0, 2], [x0 + 0.6, 2], [x2, 17], [x1, 17]]), col));
  fold(6.2, 1.8, 5.6, lt(c));
  fold(7.4, 6, 9.4, c);
  fold(8.2, 10.4, 12.6, c);
  fold(7.6, 7.8, 8.4, hi(c));
  // Wispy tatters fading away from the hem.
  const wisp = '#c9b8ff';
  for (const [x, y, d] of [[4.9, 15.2, -1], [8.8, 15.6, 1], [12.4, 15, 1]]) out.push(S(tube(bez([x, y - 1.6], [x, y + 0.2], [x + d * 1, y + 0.4], 5), 0.9, 0.2), wisp));
  for (const [p, q] of [[[4, 11.8], [4.6, 14]], [[7.2, 12.4], [8.4, 14.8]], [[10.8, 12.2], [12, 14.4]], [[13.4, 11.6], [14.2, 12.4]]]) out.push(line([p, q], 0.4, dk(c)));
  // Hollow eyes, faintly glowing.
  out.push(S(oval(6.4, 7.6, 0.9, 1.3, 0, 14), '#2a1f45'), S(oval(9.8, 7.6, 0.9, 1.3, 0, 14), '#2a1f45'));
  out.push(S(oval(6.5, 7.9, 0.4, 0.5, 0, 10), '#b9f0ff'), S(oval(9.9, 7.9, 0.4, 0.5, 0, 10), '#b9f0ff'));
  // The knot it hangs from.
  out.push(...ball(oval(8, 1.6, 1.8, 1.2, 0, 16), '#4a3d72', { glow: 0.8 }));
  out.push(twinkle(14, 3, 1, wisp), twinkle(2, 2.6, 0.7, wisp));
  return out;
}

function wool() {
  const out = [];
  // A lock of cloud: one fluffy swirl curling round, with pastel rainbow strands running through it.
  const spine = [...bez3([2.6, 6], [5, 0.6], [14.4, 1.6], [13.4, 8.2], 14), ...bez3([13.4, 8.2], [12.8, 12.6], [7.4, 13.6], [6.8, 10.8], 10).slice(1)];
  const r = (t) => 3.1 - t * 1.9;
  out.push(...fuzz(spine, r, '#fdfbff'));
  // Bumpy cloud edge along the outside of the curl.
  const n = spine.length - 1;
  for (const i of [2, 6, 10, 14, 18]) {
    const p = spine[i];
    const q = spine[Math.min(n, i + 1)];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const nx = -(q[1] - p[1]) / l;
    const ny = (q[0] - p[0]) / l;
    const rr = r(i / n);
    out.push(S(oval(p[0] - nx * rr * 0.85, p[1] - ny * rr * 0.85, rr * 0.5, rr * 0.5, 0, 16), i > 10 ? '#ece6fa' : '#fdfbff'));
  }
  const strands = [['#ffaed0', -0.9], ['#ffe08a', 0], ['#9fe0ff', 0.9]];
  for (const [col, d] of strands) {
    const pts = spine.slice(3, 22).map((p, i, a) => {
      const q = a[Math.min(a.length - 1, i + 1)];
      const pp = a[Math.max(0, i - 1)];
      const l = Math.hypot(q[0] - pp[0], q[1] - pp[1]) || 1;
      const k = r((i + 3) / n) * 0.42 * d;
      return [p[0] - ((q[1] - pp[1]) / l) * k, p[1] + ((q[0] - pp[0]) / l) * k];
    });
    out.push(S(tube(pts, 0.75, 0.25), col));
  }
  out.push(...glint(3.4, 4.2, 0.6));
  out.push(twinkle(2.4, 13, 1.3, '#ffe36b'), twinkle(14.8, 13.4, 0.9, '#ff9ec0'));
  return out;
}

function feather() {
  const c = '#8fd0ff';
  const b = [2.2, 14.6];
  const t = [14.2, 1.4];
  const L = leaf([3.6, 12.8], t, 6.4, c, { bend: -0.8, rib: '#f4fbff', veins: 0 });
  // Notches in the vane.
  const nick = (pts, i, d) => pts.splice(i, 0, [pts[i][0] + d[0], pts[i][1] + d[1]]);
  const A = L.A.slice();
  const B = L.B.slice();
  nick(A, 6, [-1.4, 0.4]);
  nick(B, 8, [1.2, -0.2]);
  const vane = [...A, ...B.reverse()];
  const out = [S(vane, sh(c)), S(clip(vane, side(t, [3, 13.6])), lt(c)), S(tube(L.mid.slice(0, 12), 2.6, 0.6), c)];
  out.push(S(cut(vane, [16, 5], [8, -2]), '#5aa8f0'));
  // Barbs.
  for (const i of [4, 7, 10]) {
    const p = L.mid[i];
    out.push(line([p, [p[0] + 1.6, p[1] + 1.6]], 0.26, sh(c)), line([p, [p[0] - 1.8, p[1] - 0.8]], 0.26, c));
  }
  // Downy fluff at the base and the quill.
  out.push(...ball(oval(4.2, 12.2, 1.6, 1.1, -40, 16), '#d8f0ff', { glow: 0.7 }));
  out.push(S(tube(bez(b, [3, 13.4], [4.6, 11.6], 6), 0.9, 0.7), '#e8f4ff'));
  out.push(S(tube(L.mid.slice(0, 13), 0.55, 0.2), '#f4fbff'));
  out.push(...glint(7, 5, 0.6));
  return out;
}

function stardust() {
  const c = '#7a6ae6';
  const out = [];
  // Glittering dust spilling out the top.
  out.push(S(oval(8, 4.4, 3.4, 1.4, 0, 20), '#ffd84a'), S(oval(7.6, 4, 2.2, 0.8, 0, 16), '#fff3a6'));
  // The pouch.
  const pouch = [...bez3([6, 6.4], [1.6, 8.6], [1.4, 15], [8, 15], 12), ...bez3([8, 15], [14.6, 15], [14.4, 8.6], [10, 6.4], 12).slice(1)];
  out.push(...ball(pouch, c, { k: 0.95 }));
  // Ruffled mouth.
  const ruff = [[4.6, 5.8], [4.4, 4], [5.8, 4.6], [6.8, 3.4], [8, 4.4], [9.2, 3.4], [10.2, 4.6], [11.6, 4], [11.4, 5.8], [8, 6.8]];
  out.push(...ball(ruff, lt(c), { glow: 0, shadow: c }));
  out.push(S(oval(8, 4.6, 2.6, 0.75, 0, 16), '#ffd84a'), S(oval(7.4, 4.4, 1.2, 0.36, 0, 10), '#fff8c8'));
  // Gold drawstring with a tassel.
  out.push(S(tube(bez([4.6, 6.2], [8, 7.6], [11.4, 6.2], 8), 0.8), GOLD), S(tube(bez([5, 6], [8, 7.2], [11, 6], 8), 0.3), '#fff3b0'));
  out.push(line(bez([10.6, 6.6], [12.4, 7.6], [12.6, 9.4], 5), 0.45, '#e6a83a'), S(oval(12.6, 9.8, 0.75, 0.75, 0, 12), GOLD));
  // A star stitched on the front.
  const star = Array.from({ length: 10 }, (_, i) => {
    const a = (i * 36 - 90) * D2R;
    const r = i % 2 ? 1.05 : 2.3;
    return [7.6 + Math.cos(a) * r, 11 + Math.sin(a) * r];
  });
  out.push(S(star, '#e8a83a'), S(star.map(([x, y]) => [x - 0.25, y - 0.25]), '#ffe36b'));
  out.push(twinkle(3.4, 1.8, 1.4, '#fff3a6'), twinkle(12.4, 1.2, 1, W), S(oval(9.6, 1.6, 0.4, 0.4, 0, 8), '#ffd84a'), S(oval(14.2, 3.6, 0.35, 0.35, 0, 8), '#ffd84a'));
  out.push(...glint(4, 9, 0.6));
  return out;
}

function king_crystal() {
  const c = '#c4a0ff';
  const out = [];
  // Small crystals at the foot.
  const shard = (x, y, w, h, a) => {
    const p = turn([[x, y - h], [x + w / 2, y - h + w * 0.6], [x + w / 2, y], [x - w / 2, y], [x - w / 2, y - h + w * 0.6]], a, x, y);
    out.push(S(p, sh(c)), S([p[0], p[4], p[3], [(p[2][0] + p[3][0]) / 2, (p[2][1] + p[3][1]) / 2], [(p[0][0] + p[3][0]) / 2 + 0.3, p[0][1] + 1]], lt(c)));
  };
  shard(3.2, 15.4, 2.6, 6, -24);
  shard(12.8, 15.4, 2.4, 5.4, 22);
  // The great crystal: three faces.
  const top = [8, 0.4];
  out.push(S([top, [4.4, 4.4], [4.4, 12.4], [6.4, 14.2], [6.4, 5.2]], lt(c)));
  out.push(S([top, [6.4, 5.2], [6.4, 14.2], [8, 15.4], [9.6, 14.2], [9.6, 5.2]], c));
  out.push(S([top, [11.6, 4.4], [11.6, 12.4], [9.6, 14.2], [9.6, 5.2]], sh(c)));
  out.push(S([top, [6.4, 5.2], [8, 5.6]], hi(c)), S([top, [8, 5.6], [9.6, 5.2]], lt(c)));
  out.push(S(tube([[5.2, 5], [5.2, 9.6]], 0.5, 0.3), W));
  // The gold crown band.
  const band = [...bez([4.2, 9], [8, 10.2], [11.8, 9], 8), [11.8, 11.2], ...bez([11.8, 11.2], [8, 12.6], [4.2, 11.2], 8).slice(1)];
  const crown = [[4.2, 9.2], [4, 6.4], [5.6, 8.2], [6.6, 6.2], [8, 7.8], [9.4, 6.2], [10.4, 8.2], [12, 6.4], [11.8, 9.2], [8, 10.4]];
  out.push(...ball(crown, GOLD, { k: 0.9, glow: 0.8 }));
  out.push(...ball(band, GOLD, { k: 0.9 }), S(tube(bez([4.6, 9.8], [8, 10.9], [11.4, 9.8], 8), 0.3), '#fff3b0'));
  for (const [x, y] of [[4, 6.1], [6.6, 5.9], [9.4, 5.9], [12, 6.1]]) out.push(S(oval(x, y, 0.55, 0.55, 0, 10), '#fff0a0'));
  out.push(...ball(oval(8, 10.6, 1.05, 1, 0, 16), '#ff6b9a', { glow: 0.8 }), S(oval(7.7, 10.3, 0.3, 0.3, 0, 8), W));
  out.push(S(oval(5.4, 10.4, 0.45, 0.45, 0, 10), '#7fd8ff'), S(oval(10.6, 10.4, 0.45, 0.45, 0, 10), '#7fd8ff'));
  out.push(twinkle(13.8, 2.6, 1.6), twinkle(2.2, 2.4, 1, '#fff3a6'), twinkle(14.4, 8.6, 0.8, '#fff3a6'));
  return out;
}

function hollow_acorn() {
  const nut = '#dc9a58';
  const cap = '#8a5a3c';
  const out = [];
  const body = [...arcPts(8, 8.6, 5.8, 1, 180, 360, 6), ...bez3([13.8, 8.6], [14, 13], [10.4, 14.4], [8, 15.6], 10).slice(1), ...bez3([8, 15.6], [5.6, 14.4], [2, 13], [2.2, 8.6], 10).slice(1)];
  out.push(...ball(body, nut, { k: 0.95 }));
  // The rune, carved and glowing.
  const glow = '#8ff5e0';
  out.push(S(oval(8, 11.4, 2.6, 2.6, 0, 22), mix(nut, glow, 0.35)));
  for (const pts of [[[8, 9], [8, 14]], [[8, 11], [6.2, 9.4]], [[8, 11], [9.8, 9.4]], [[8, 12.6], [9.4, 13.6]]]) out.push(line(pts, 0.85, '#3fd6bf'));
  for (const pts of [[[8, 9.2], [8, 13.8]], [[7.8, 10.9], [6.4, 9.6]], [[8.2, 10.9], [9.6, 9.6]], [[8.1, 12.7], [9.2, 13.5]]]) out.push(line(pts, 0.36, '#effffb'));
  // The cap, scaled.
  const capPts = [...bez3([1.4, 8.6], [1, 2.4], [15, 2.4], [14.6, 8.6], 16), ...bez([14.6, 8.6], [8, 10], [1.4, 8.6], 8).slice(1)];
  out.push(...ball(capPts, cap, { k: 0.95, glow: 0.9 }));
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 6 - r; i++) {
      const x = 3 + r * 0.9 + i * 2.1;
      const y = 7.6 - r * 1.6 + Math.abs(x - 8) * 0.12;
      out.push(S(arcPts(x, y, 0.95, 0.7, 0, 180, 6), x < 8 && r > 0 ? lt(cap) : shade(cap, -8)));
    }
  }
  out.push(S(tube(bez([1.6, 8.5], [8, 10], [14.4, 8.5], 10), 0.6), lt(cap)));
  // Stem.
  out.push(S(tube(bez([8, 3.6], [8.2, 1.4], [9.8, 0.8], 6), 1.1, 0.8), cap), S(tube(bez([7.8, 3.4], [7.9, 1.6], [9.2, 0.9], 6), 0.35), lt(cap)));
  out.push(...glint(4.6, 10.6, 0.65));
  out.push(twinkle(12.6, 13.2, 0.9, glow));
  return out;
}

// ---------- Tonics ----------

// A glass vessel: the glass outline, liquid filling it below `level`, a surface line, and shine.
function vessel(body, liquid, level, glass = '#eaf4ff') {
  const out = [S(body, glass)];
  const fill = cut(body, [-4, level], [20, level]);
  out.push(...ball(fill, liquid, { k: 0.95 }));
  out.push(S(clip(fill, rect(-1, level, 18, 0.45)), lt(liquid)));
  return out;
}

function cork(x, y, w, h) {
  const c = '#d9a46c';
  return [...bevel(rect(x, y, w, h), rect(x + 0.45, y + 0.4, w - 0.9, h - 0.8), c), S(oval(x + w / 2 - 0.3, y + h / 2, 0.3, 0.25, 0, 8), sh(c))];
}

function red_potion() {
  const liquid = '#ff5c7c';
  const body = [...arcPts(8, 10.2, 5.6, 5.4, -62, 242, 30), [6.6, 5.4], [6.6, 3.6], [9.4, 3.6], [9.4, 5.4]];
  const out = [...vessel(body, liquid, 7)];
  // Strawberry seeds.
  for (const [x, y] of [[5.4, 9.4], [8, 8.6], [10.6, 9.6], [6.6, 12], [9.4, 12.2], [8, 14.2], [4.4, 12], [11.8, 12.2]]) out.push(S(oval(x, y, 0.32, 0.45, 0, 8), '#ffe9a0'));
  out.push(...cork(6.2, 1, 3.6, 2.8));
  // Leafy strawberry collar round the neck.
  const g = '#6fcf6a';
  const leaves = Array.from({ length: 10 }, (_, i) => {
    const a = (i * 36 - 90) * D2R;
    const r = i % 2 ? 1.1 : 2.8;
    return [8 + Math.cos(a) * r * 1.2, 5.4 + Math.sin(a) * r * 0.7];
  });
  out.push(S(leaves, sh(g)), S(leaves.map(([x, y]) => [x - 0.2, y - 0.25]), g), S(oval(7.4, 5, 1, 0.4, 0, 10), lt(g)));
  out.push(S(tube(arcPts(8, 10.2, 4.2, 4, 160, 230, 8), 0.7, 0.3), W), S(oval(11.4, 13, 0.35, 0.35, 0, 8), W));
  return out;
}

function orange_potion() {
  const liquid = '#ffa860';
  // A peach-shaped flask: two soft lobes and a little point at the bottom.
  const body = [[6.6, 4.8], [6.6, 3.6], [9.4, 3.6], [9.4, 4.8], ...bez3([9.4, 4.8], [15, 4.6], [16, 11.6], [9.6, 14.6], 12).slice(1), [8.6, 15.6], ...bez3([7.6, 15], [0.6, 12.6], [0.6, 4.6], [6.6, 4.8], 12)];
  const out = [...vessel(body, liquid, 6.6)];
  // A rosy blush and the peach's crease.
  out.push(S(clip(cut(body, [-4, 7], [20, 7]), oval(11.6, 11.6, 3.4, 3)), '#ff8a7c'));
  out.push(line(bez([8.4, 7.4], [6.6, 10.6], [8.6, 15], 8), 0.4, shade(liquid, -12)));
  out.push(...cork(6.2, 1, 3.6, 2.8));
  // A leaf on the cork.
  out.push(...leaf([9.6, 2.2], [14.4, 0.8], 2.6, '#6fcf6a', { bend: -0.6 }).shapes);
  out.push(S(tube(bez([3.6, 11.6], [3.2, 8.6], [5, 7], 6), 0.75, 0.35), W), S(oval(5.4, 13.2, 0.35, 0.35, 0, 8), W));
  return out;
}

function white_potion() {
  const milk = '#fffaf2';
  // An old-fashioned milk bottle.
  const body = [[5.4, 3], [10.6, 3], [10.6, 5], ...bez([10.6, 5], [12.6, 6.4], [12.6, 8.6], 5).slice(1), [12.6, 14], ...bez([12.6, 14], [12.6, 15.4], [11, 15.4], 3).slice(1), [5, 15.4], ...bez([5, 15.4], [3.4, 15.4], [3.4, 14], 3).slice(1), [3.4, 8.6], ...bez([3.4, 8.6], [3.4, 6.4], [5.4, 5], 5).slice(1)];
  const out = [S(body, '#e8f2ff')];
  const fill = cut(body, [-4, 5.6], [20, 5.6]);
  out.push(...ball(fill, milk, { k: 0.95, light: W, shadow: '#e2dcef' }));
  // A blue label with a white heart.
  const blue = '#7fb8ff';
  out.push(...ball(clip(body, rect(2, 9.2, 13, 3.8)), blue, { glow: 0.8 }));
  out.push(S(clip(body, rect(2, 9.2, 13, 0.4)), lt(blue)), S(clip(body, rect(2, 12.6, 13, 0.4)), sh(blue)));
  const heart = [...bez3([8, 12.1], [5.6, 10.8], [6.2, 9.2], [8, 10.2], 6), ...bez3([8, 10.2], [9.8, 9.2], [10.4, 10.8], [8, 12.1], 6).slice(1)];
  out.push(S(heart, W));
  // A crimped paper lid.
  const lid = [[4.6, 3.6], [4.8, 1.6], ...bez([4.8, 1.6], [8, 0.2], [11.2, 1.6], 6).slice(1), [11.4, 3.6]];
  out.push(...ball(lid, '#ff9ec0', { glow: 0.8 }));
  for (let x = 5.4; x < 11; x += 1.1) out.push(line([[x, 2.6], [x + 0.2, 3.6]], 0.28, sh('#ff9ec0')));
  out.push(S(tube([[5, 2.4], [11, 2.4]], 0.35), lt('#ff9ec0')));
  out.push(S(tube([[4.6, 13.6], [4.6, 7.8]], 0.7, 0.4), W), S(oval(11.2, 7.4, 0.32, 0.5, 0, 8), W));
  return out;
}

function blue_potion() {
  const liquid = '#5e9cf2';
  // A tall bottle with a long neck.
  const body = [[6.8, 3.4], [9.2, 3.4], [9.2, 6], ...bez([9.2, 6], [12.2, 6.6], [12.2, 9], 5).slice(1), [12.2, 13.6], ...bez([12.2, 13.6], [12.2, 15.4], [10.4, 15.4], 3).slice(1), [5.6, 15.4], ...bez([5.6, 15.4], [3.8, 15.4], [3.8, 13.6], 3).slice(1), [3.8, 9], ...bez([3.8, 9], [3.8, 6.6], [6.8, 6], 5).slice(1)];
  const out = [...vessel(body, liquid, 7.6)];
  out.push(...cork(6.4, 0.6, 3.2, 3.2));
  // Blueberries tied at the neck.
  const berry = '#4e5fd6';
  out.push(...leaf([9.2, 5.6], [13.6, 3], 2.2, '#6fcf6a', { bend: 0.4 }).shapes);
  for (const [x, y, r] of [[11.6, 5.8, 1.5], [13.4, 7.4, 1.35]]) {
    out.push(...ball(oval(x, y, r, r, 0, 18), berry, { glow: 0.9 }));
    out.push(S([[x - 0.5, y - r + 0.2], [x + 0.5, y - r + 0.2], [x, y - r + 0.9]], '#2e2f8a'), S(oval(x - 0.5, y - 0.5, 0.3, 0.3, 0, 8), W));
  }
  out.push(S(tube(bez([5.2, 13.6], [4.8, 10.4], [5.6, 8.4], 6), 0.75, 0.4), W), S(oval(10.8, 13.4, 0.35, 0.35, 0, 8), W));
  return out;
}

function mana_elixir() {
  const liquid = '#a68cff';
  // An onion flask with a crescent-moon stopper.
  const body = [[7, 4.2], [9, 4.2], ...bez3([9, 5.2], [14.4, 7.4], [14.4, 15.4], [8, 15.4], 12), ...bez3([8, 15.4], [1.6, 15.4], [1.6, 7.4], [7, 5.2], 12).slice(1)];
  const out = [...vessel(body, liquid, 8.2)];
  for (const [x, y, r] of [[5.4, 11.2, 0.9], [10.4, 12.6, 0.7], [9.6, 9.6, 0.5]]) out.push(twinkle(x, y, r, '#f4eeff'));
  // Gold neck ring and the moon.
  out.push(...bevel(rect(6.4, 3.6, 3.2, 1.4), rect(6.8, 3.9, 2.4, 0.8), GOLD));
  const moon = [...arcPts(8, 1.8, 2, 2, 60, 300, 14), ...arcPts(9, 1.3, 1.5, 1.6, 270, 90, 10).reverse()];
  out.push(...ball(moon, '#ffe36b', { glow: 0.8 }));
  out.push(S(oval(6.8, 1.4, 0.3, 0.45, 0, 8), W));
  out.push(S(tube(bez([3.6, 12.6], [3.4, 9.6], [5.2, 7.8], 6), 0.75, 0.35), W), S(oval(11.8, 13.4, 0.35, 0.35, 0, 8), W));
  return out;
}

function elixir() {
  // A heart-shaped flask layered with rainbow.
  const body = [[6.8, 5.2], [6.8, 3.6], [9.2, 3.6], [9.2, 5.2], ...bez3([9.2, 5.2], [11, 4], [15.6, 4.2], [14.6, 9.4], 8).slice(1), ...bez([14.6, 9.4], [12.8, 12.8], [8, 15.6], 8).slice(1), ...bez([8, 15.6], [3.2, 12.8], [1.4, 9.4], 8).slice(1), ...bez3([1.4, 9.4], [0.4, 4.2], [5, 4], [6.8, 5.2], 8).slice(1)];
  const out = [S(body, '#f2f6ff')];
  const bands = ['#ff8aa8', '#ffb36b', '#ffe36b', '#8fe08a', '#7fc4ff', '#b89cff'];
  bands.forEach((col, i) => {
    const y = 6.6 + i * 1.55;
    const part = clip(body, rect(-1, y, 18, i === bands.length - 1 ? 9 : 1.6));
    if (part.length) out.push(S(part, col), S(clip(part, rect(9.6, y, 9, 9)), sh(col)), S(clip(part, rect(-1, y, 4.6, 0.5)), lt(col)));
  });
  out.push(...bevel(rect(6.4, 2.6, 3.2, 1.6), rect(6.8, 2.9, 2.4, 1), GOLD));
  const star = Array.from({ length: 10 }, (_, i) => {
    const a = (i * 36 - 90) * D2R;
    const r = i % 2 ? 0.8 : 1.9;
    return [8 + Math.cos(a) * r, 1.6 + Math.sin(a) * r];
  });
  out.push(S(star, '#f0b43a'), S(star.map(([x, y]) => [x - 0.2, y - 0.2]), '#ffe36b'));
  out.push(S(tube(bez([2.8, 9.8], [2.6, 7.4], [4.6, 6], 6), 0.75, 0.35), W), S(oval(11.4, 12, 0.35, 0.35, 0, 8), W));
  out.push(twinkle(14.6, 2.4, 1.2), twinkle(1.6, 14, 0.8, '#fff3a6'));
  return out;
}

function return_scroll() {
  const paper = '#fff2d8';
  const a = [3.4, 12.2];
  const b = [12.4, 3.6];
  const out = [];
  // The rolled body, its back end, and the spiral at the front end.
  out.push(S(tube([a, b], 5.6), sh(paper)), S(tube([[a[0] - 0.5, a[1] - 0.5], [b[0] - 0.5, b[1] - 0.5]], 3.6), paper), S(tube([[a[0] - 0.9, a[1] - 1.1], [b[0] - 0.9, b[1] - 1.1]], 0.9), W));
  out.push(S(oval(a[0], a[1], 1.4, 2.8, 45, 22), sh(paper)));
  const end = oval(b[0], b[1], 1.4, 2.8, 45, 22);
  out.push(S(end, '#f4dfb4'), S(tube(arcPts(0, 0, 1, 2, 0, 330, 10).map(([x, y]) => turn([[b[0] + x * 0.9, b[1] + y * 0.9]], 45, b[0], b[1])[0]), 0.3), '#d6b07a'), S(oval(b[0], b[1], 0.3, 0.3, 0, 8), '#c99a62'));
  // A mint ribbon round the middle, with tails and a seal stamped with a little house.
  const mint = '#5fcf9e';
  out.push(S(tube([[6, 6.2], [10.2, 10.4]], 1.3), mint), S(tube([[6.6, 6], [9.8, 9.2]], 0.35), lt(mint)));
  out.push(S([[7.6, 10.2], [5.8, 15], [6.8, 14.4], [7.6, 15.4], [8.8, 10.6]], sh(mint)), S([[8.6, 10.2], [10.4, 14.6], [11, 13.4], [12, 13.8], [9.6, 9.8]], mint));
  out.push(...ball(oval(8.2, 9.4, 2.3, 2.2, 0, 22), '#ff8aa0', { glow: 0.8 }));
  out.push(S([[8.2, 7.8], [10, 9.3], [9.4, 9.3], [9.4, 10.9], [7, 10.9], [7, 9.3], [6.4, 9.3]], W), S(rect(7.9, 9.9, 0.7, 1), '#ff8aa0'));
  out.push(...glint(4.4, 8.6, 0.55));
  return out;
}

// ---------- Quest items ----------

// A letter in a cream envelope: the flap folded down, a pink heart seal on it, and a little
// sparkle (it's important).
function letter() {
  const paper = '#fff6e4';
  const out = [];
  out.push(...bevel(rect(1.4, 4, 13.2, 9.4), rect(2, 4.6, 12, 8.2), sh(paper), paper));
  // The fold lines of the back, then the flap.
  out.push(S(tube([[2, 12.6], [7, 8.6]], 0.45), sh(paper)), S(tube([[14, 12.6], [9, 8.6]], 0.45), sh(paper)));
  out.push(S([[1.6, 4.4], [8, 9.6], [14.4, 4.4]], '#f4e2bd'), S(tube([[2.2, 4.6], [8, 9.2], [13.8, 4.6]], 0.5), W));
  const heart = [...bez3([8, 11.4], [5.2, 9.6], [5.6, 6.8], [8, 8.2], 8), ...bez3([8, 8.2], [10.4, 6.8], [10.8, 9.6], [8, 11.4], 8).slice(1)];
  out.push(...ball(heart, '#ff7aa2', { glow: 0.9 }));
  out.push(twinkle(14.4, 2.6, 1.3), ...glint(3.6, 6, 0.5));
  return out;
}

// A capsule ticket: a mint stub with notched ends and a perforated tear line, a pink and white
// capsule printed on it, and a sparkle (it's a prize).
function gacha_ticket() {
  const mint = '#8fe0a8';
  const out = [];
  const body = [[1, 4.6], [15, 4.6], [15, 7.2], ...arcPts(15, 8.6, 1.4, 1.4, 90, 270, 6), [15, 10], [15, 12.6], [1, 12.6], [1, 10], ...arcPts(1, 8.6, 1.4, 1.4, 270, 450, 6), [1, 7.2]];
  out.push(...ball(body, mint, { k: 0.9, glow: 0.5 }));
  out.push(S(rect(1.6, 5.2, 12.8, 0.7), lt(mint)));
  for (let y = 5.6; y < 12.4; y += 1.4) out.push(S(oval(11.2, y, 0.32, 0.32, 0, 8), sh(mint)));
  // The capsule: pink top, white bottom, a glint.
  out.push(...ball(arcPts(6, 8.6, 3, 3, 0, 180, 12).concat([[3, 8.6]]), '#ff9ec0', { glow: 0.7 }));
  out.push(...ball(arcPts(6, 8.6, 3, 3, 180, 360, 12), '#ffffff', { glow: 0 }));
  out.push(S(rect(3, 8.3, 6, 0.6), sh('#ff9ec0')));
  out.push(twinkle(13.4, 3.4, 1.6), ...glint(4.6, 6.8, 0.5));
  return out;
}

// A parcel in brown paper tied with a mint ribbon and a bow on top.
function parcel() {
  const kraft = '#e8b97a';
  const mint = '#5fcf9e';
  const out = [];
  out.push(...bevel(rect(1.6, 5.4, 12.8, 9.4), rect(2.2, 6, 11.6, 8.2), sh(kraft), kraft));
  out.push(S(rect(1.6, 5.4, 12.8, 2), lt(kraft)), S(rect(9.6, 6, 4.2, 8.2), sh(kraft)));
  out.push(S(rect(7, 5.4, 2, 9.4), mint), S(rect(1.6, 9.2, 12.8, 1.8), mint), S(rect(7.2, 5.6, 0.6, 9), lt(mint)));
  // The bow: two loops and a knot.
  out.push(...ball(oval(5.6, 4.2, 2.4, 1.5, -20, 18), mint), ...ball(oval(10.4, 4.2, 2.4, 1.5, 20, 18), mint), ...ball(oval(8, 4.8, 1.2, 1.1, 0, 12), sh(mint)));
  out.push(...glint(3.6, 7.4, 0.5));
  return out;
}

// Keeps a drawing inside the 16x16 cell (shifted, or shrunk a touch if it must), so the outline
// around it never gets clipped.
function framed(draw) {
  return () => {
    const shapes = draw().filter(Boolean);
    const b = bbox(shapes.flatMap((sh) => sh.pts));
    const k = Math.min(1, 15.8 / b.w, 15.8 / b.h);
    const fit = (lo, hi, c) => {
      const a = c + (lo - c) * k;
      const z = c + (hi - c) * k;
      return a < 0.1 ? 0.1 - a : z > 15.9 ? 15.9 - z : 0;
    };
    const dx = fit(b.x0, b.x1, b.cx);
    const dy = fit(b.y0, b.y1, b.cy);
    if (k === 1 && !dx && !dy) return shapes;
    return shapes.map((sh) => ({ ...sh, pts: sh.pts.map(([x, y]) => [b.cx + (x - b.cx) * k + dx, b.cy + (y - b.cy) * k + dy]) }));
  };
}

const ART = {
  fluff, shell, sprout_leaf, mushcap, ribbon, pebble, stinger, leaf_fragment, tusk, moss_stone, wisp_flame,
  bat_wing, bone_shard, crystal_gel, rock_core, shade_cloth, wool, feather, stardust, king_crystal, hollow_acorn, letter, parcel, gacha_ticket,
  red_potion, orange_potion, white_potion, blue_potion, mana_elixir, elixir, return_scroll,
};

export const ITEM_ART = Object.fromEntries(Object.entries(ART).map(([id, draw]) => [id, framed(draw)]));

// The drawing kit, shared with the skill icons so both speak one visual language.
export { hi, lt, sh, dk, ink, S, oval, arcPts, bez, bez3, rect, clip, cut, bbox, ball, tube, line, bevel, twinkle, glint, leaf, turn, framed, W, GOLD, D2R };
