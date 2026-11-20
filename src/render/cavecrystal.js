// Crystal Cave (its makeover, 2026-11-20): a smaller cavern built round its landmarks, the way
// Mossy Woods is built round its giant trees. In the west the Glowcap Terraces: giant glowing
// mushrooms whose caps are the high ledges. In the middle the Underground Lake, and sat in it a
// giant geode cracked open, amethyst glowing inside, its rim, a crystal shelf inside it and its
// lower lip (where you fish) all ledges. In the east the Shade Spires: two great crystal columns,
// shelves growing out of them, crystal dust rising between. Its ledges are rock shelves with
// amethyst growing under them ('geode'); behind, the cavern's far walls with crystal clusters
// glowing in the dark and glow-worms twinkling on the ceiling.

import { E, T, F, sprite, blit, snap, mix, shade } from './pixel.js';
import { band } from './propkit.js';

export const CV = {
  rock: '#5c4c80', rockLit: '#7c6ca4', rockSh: '#40345e', deep: '#2c2448', line: '#221a3a',
  rind: '#d8d0ea', rindSh: '#a89cc8',
  ame: '#b48ae8', ameLit: '#e4ceff', ameSh: '#7a52b8', ameDeep: '#56388e',
  cyan: '#7ae6ee', cyanLit: '#dcfcff', cyanSh: '#3ea6c0',
  stem: '#eee6f6', stemSh: '#c4b8dc', gill: '#c2b2e2',
  capTeal: '#6fd8d2', capTealLit: '#b4f4ea', capTealSh: '#3fa8b0',
  capPink: '#ff9ccc', capPinkLit: '#ffd0e6', capPinkSh: '#d06aa0',
  spot: '#f6fbff', glow: '#9ff0ff',
};

const h01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
const arc = (cx, cy, rx, ry, a0, a1, n = 12) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});

const M = 40;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`cv|${key}`, () => ({ w: w + M * 2, h: h + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}
// A crystal: a long six-sided point, lit down one face. Base middle (x, y), pointing at `ang`
// (radians, 0 = up), `len` long, `wd` wide.
function crystal(out, x, y, ang, len, wd, c = CV.ame, lit = CV.ameLit, sh = CV.ameSh) {
  const ux = Math.sin(ang);
  const uy = -Math.cos(ang);
  const nx = -uy;
  const ny = ux;
  const p = (a, b) => [x + ux * a + nx * b, y + uy * a + ny * b];
  out.push(T([p(0, -wd / 2), p(len * 0.78, -wd / 2), p(len, 0), p(len * 0.78, wd / 2), p(0, wd / 2)], c));
  out.push(F(T([p(0, -wd / 2), p(len * 0.78, -wd / 2), p(len, 0), p(len * 0.74, -wd * 0.12), p(0, -wd * 0.16)], lit)));
  out.push(F(T([p(0, wd * 0.22), p(len * 0.74, wd * 0.2), p(len, 0), p(len * 0.78, wd / 2), p(0, wd / 2)], sh)));
}

// ---------- A giant glowcap: a pale stem, a broad flat-topped cap (its top is a ledge, `bare` in
// the map) with spots, glowing gills under it, babies at its foot. Three sizes (seed 0 big teal,
// 1 tall pink, 2 small teal). Bottom middle on the floor. ----------
const CAPS = [
  { w: 210, h: 210, cap: 'teal' },
  { w: 180, h: 290, cap: 'pink' },
  { w: 150, h: 130, cap: 'teal' },
];
const capOf = (seed) => CAPS[seed % CAPS.length];
function capArt(seed) {
  const { w: W, h: H, cap } = capOf(seed);
  const cx = W / 2;
  const C = cap === 'pink' ? [CV.capPink, CV.capPinkLit, CV.capPinkSh] : [CV.capTeal, CV.capTealLit, CV.capTealSh];
  return art(`cap${seed}`, W, H, () => {
    const out = [];
    // The stem, leaning a little, wider at its foot, a ring of skirt under the cap.
    const lean = seed === 1 ? 10 : -6;
    const sw = W * 0.12;
    out.push(T([[cx - sw * 1.5, H + 3], [cx - sw * 1.1, H - 30], [cx - sw + lean * 0.6, H * 0.45], [cx - sw * 0.9 + lean, 34], [cx + sw * 0.9 + lean, 34], [cx + sw + lean * 0.6, H * 0.45], [cx + sw * 1.1, H - 30], [cx + sw * 1.5, H + 3]], CV.stem));
    out.push(F(T([[cx + sw * 0.4, H + 2], [cx + sw * 0.5 + lean * 0.6, H * 0.45], [cx + sw * 0.4 + lean, 36], [cx + sw * 0.9 + lean, 36], [cx + sw + lean * 0.6, H * 0.45], [cx + sw * 1.45, H + 2]], CV.stemSh)));
    out.push(T(arc(cx + lean * 0.9, 46, sw * 1.9, 10, 0, 180, 10), CV.stem));
    // The gills under the cap, glowing.
    out.push(T(arc(cx + lean, 20, W * 0.47, 22, 0, 180, 16), CV.gill));
    for (let k = -6; k <= 6; k++) out.push(F(band([[cx + lean + k * W * 0.033, 22], [cx + lean + k * W * 0.07, 38 - Math.abs(k) * 1.6]], () => 0.7, shade(CV.gill, -18))));
    out.push(F(E(cx + lean, 30, W * 0.22, 6, CV.glow)));
    // The cap: broad, its top nearly flat, its rim curling under.
    out.push(T([...arc(cx + lean, 22, W * 0.5, 30, 180, 360, 20), [cx + lean + W * 0.5, 22], [cx + lean + W * 0.46, 28], [cx + lean - W * 0.46, 28]], C[0]));
    out.push(F(T(arc(cx + lean - W * 0.12, 4, W * 0.3, 10, 190, 330, 10), C[1])));
    out.push(F(band(arc(cx + lean, 22, W * 0.49, 6, 0, 180, 14), () => 1.6, C[2])));
    // Its spots.
    for (let k = 0; k < 6; k++) {
      const sx = cx + lean + (h01(seed * 9 + k) - 0.5) * W * 0.8;
      const sy = 2 + h01(seed * 7 + k) * 14;
      const r = 4 + h01(seed + k) * 5;
      out.push(F(E(sx, sy, r, r * 0.6, CV.spot)));
    }
    // Babies at its foot.
    for (const [dx, s, k] of [[-sw * 2.6, 0.9, 0], [sw * 2.4, 0.7, 1], [-sw * 3.6, 0.55, 2]]) {
      const bx = cx + dx;
      out.push(T([[bx - 2 * s, H + 2], [bx - 2.4 * s, H - 9 * s], [bx + 2.4 * s, H - 9 * s], [bx + 2 * s, H + 2]], CV.stem));
      out.push(T(arc(bx, H - 9 * s, 8 * s, 7 * s, 180, 360, 8), k % 2 ? CV.capPink : CV.capTeal));
      out.push(F(E(bx - 2 * s, H - 13 * s, 2 * s, 1.4 * s, CV.spot)));
    }
    return out;
  });
}
function drawCap(ctx, x, y, time, seed) {
  const s = capArt(seed);
  place(ctx, s, x, y);
  const { w: W, h: H } = capOf(seed);
  const lean = seed === 1 ? 10 : -6;
  // The glow under the cap breathes, and a few spores drift up off it.
  const gx = x + lean;
  const gy = y - H + 34;
  const p = 0.5 + 0.5 * Math.sin(time * 1.1 + seed * 2);
  const g = ctx.createRadialGradient(gx, gy, 4, gx, gy, W * 0.55);
  g.addColorStop(0, hexA(CV.glow, 0.32 + 0.14 * p));
  g.addColorStop(1, hexA(CV.glow, 0));
  ctx.fillStyle = g;
  ctx.fillRect(gx - W * 0.55, gy - W * 0.3, W * 1.1, W * 0.8);
  for (let k = 0; k < 5; k++) {
    const u = (time * 0.12 + h01(seed * 5 + k)) % 1;
    const sx = gx + (h01(seed * 3 + k) - 0.5) * W * 0.8 + Math.sin(time + k) * 4;
    const sy = gy - 20 - u * 90;
    ctx.fillStyle = hexA(CV.cyanLit, 0.7 * (1 - u));
    ctx.fillRect(snap(sx), snap(sy), 2, 2);
  }
}

// ---------- The geode: a giant one cracked open, sat in the lake. A rough dark shell, a pale rind,
// amethyst lining the hollow all round, a crystal shelf across it (a ledge) and its lower lip (a
// ledge, where you fish). Its rim's top is a ledge too. Bottom middle at the lake floor. ----------
const GE_W = 300;
const GE_H = 330;
function geodeArt() {
  const W = GE_W;
  const H = GE_H;
  const cx = W / 2;
  return art('geode', W, H, () => {
    const out = [];
    // The shell, lumpy, flat on top.
    const shell = [[cx - 120, H + 4], [cx - 146, H - 70], [cx - 152, H - 170], [cx - 140, H - 260], [cx - 118, H - 300], [cx - 70, H - 318], [cx + 66, H - 320], [cx + 116, H - 302], [cx + 142, H - 262], [cx + 154, H - 168], [cx + 148, H - 74], [cx + 124, H + 4]];
    out.push(T(shell, CV.rock));
    out.push(F(T([[cx - 116, H + 2], [cx - 142, H - 70], [cx - 148, H - 170], [cx - 136, H - 258], [cx - 114, H - 296], [cx - 70, H - 314], [cx - 40, H - 314], [cx - 90, H - 290], [cx - 118, H - 250], [cx - 128, H - 170], [cx - 122, H - 70], [cx - 100, H + 2]], CV.rockLit)));
    out.push(F(T([[cx + 120, H + 2], [cx + 144, H - 74], [cx + 150, H - 168], [cx + 138, H - 258], [cx + 128, H - 268], [cx + 132, H - 168], [cx + 126, H - 74], [cx + 104, H + 2]], CV.rockSh)));
    for (let k = 0; k < 9; k++) out.push(F(E(cx + (h01(k * 3) - 0.5) * 260, H - 40 - h01(k * 5) * 250, 6 + h01(k) * 6, 4 + h01(k + 1) * 3, k % 2 ? CV.rockSh : CV.rockLit)));
    // The rind, and the hollow inside.
    const hy = H - 185;
    out.push(T(arc(cx, hy, 116, 136, 0, 360, 28), CV.rind));
    out.push(F(T(arc(cx, hy + 4, 108, 128, 0, 360, 28), CV.rindSh)));
    out.push(T(arc(cx, hy + 6, 100, 120, 0, 360, 28), CV.ameDeep));
    // The hollow's lining: a glittering crust of tiny crystal facets all round, lit on top.
    for (let k = 0; k < 64; k++) {
      const a = (k / 64) * Math.PI * 2;
      const r = 0.86 + h01(k * 2.3) * 0.1;
      const fx = cx + Math.cos(a) * 100 * r;
      const fy = hy + 6 + Math.sin(a) * 120 * r;
      const s = 3 + h01(k) * 3;
      out.push(F(T([[fx, fy - s], [fx + s * 0.8, fy], [fx, fy + s], [fx - s * 0.8, fy]], k % 3 === 0 ? CV.ameLit : k % 3 === 1 ? CV.ame : CV.ameSh)));
    }
    // The deep glow inside, and a bed of big amethyst growing up out of its floor.
    out.push(F(E(cx, hy + 20, 70, 80, '#7e5ac4')), F(E(cx, hy + 30, 48, 56, '#9a74d8')));
    for (const [dx, ang, len, wd] of [[-62, -0.55, 40, 18], [-38, -0.25, 58, 22], [-12, -0.05, 70, 24], [16, 0.12, 62, 22], [42, 0.35, 50, 20], [64, 0.6, 36, 16]]) crystal(out, cx + dx, H - 64, ang, len, wd);
    for (const [dx, ang, len] of [[-26, -0.4, 30], [4, 0.05, 36], [30, 0.3, 28]]) crystal(out, cx + dx, H - 64, ang, len, 12, CV.ameLit, '#fff4ff', CV.ame);
    // The crystal shelf across the hollow (the inner ledge) and the lower lip (the fishing ledge).
    out.push(T([[cx - 76, H - 160], [cx + 76, H - 160], [cx + 70, H - 150], [cx - 70, H - 150]], CV.rind));
    for (let k = 0; k < 6; k++) crystal(out, cx - 60 + k * 24, H - 150, Math.PI + (h01(k) - 0.5) * 0.4, 10 + h01(k * 2) * 8, 8, CV.cyan, CV.cyanLit, CV.cyanSh);
    out.push(T([[cx - 104, H - 62], [cx - 60, H - 60], [cx + 60, H - 60], [cx + 104, H - 62], [cx + 96, H - 48], [cx - 96, H - 48]], CV.rock));
    out.push(F(T([[cx - 100, H - 62], [cx + 100, H - 62], [cx + 98, H - 58], [cx - 98, H - 58]], CV.rockLit)));
    // Crystals on its shoulders.
    crystal(out, cx - 96, H - 308, -0.5, 38, 16);
    crystal(out, cx - 74, H - 314, -0.15, 26, 12, CV.cyan, CV.cyanLit, CV.cyanSh);
    crystal(out, cx + 104, H - 304, 0.45, 32, 14);
    return out;
  });
}
function drawGeode(ctx, x, y, time) {
  place(ctx, geodeArt(), x, y);
  // The hollow glows from inside, slowly.
  const gy = y - GE_H + 145 + 6;
  const p = 0.5 + 0.5 * Math.sin(time * 0.8);
  const g = ctx.createRadialGradient(x, gy, 10, x, gy, 120);
  g.addColorStop(0, hexA('#e8c8ff', 0.3 + 0.12 * p));
  g.addColorStop(1, hexA('#b48ae8', 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 120, gy - 140, 240, 280);
  // Glints running over the crystals.
  for (let k = 0; k < 4; k++) {
    const u = (time * 0.25 + k * 0.25) % 1;
    if (u > 0.3) continue;
    const a = h01(k * 7) * Math.PI * 2;
    const sx = x + Math.cos(a) * 80;
    const sy = gy + Math.sin(a) * 96;
    const k2 = 1 - u / 0.3;
    ctx.fillStyle = hexA('#ffffff', 0.9 * k2);
    ctx.fillRect(snap(sx - 3 * k2), snap(sy), 6 * k2, 1.4);
    ctx.fillRect(snap(sx), snap(sy - 3 * k2), 1.4, 6 * k2);
  }
}

// ---------- A great crystal column: a tall six-sided crystal sheared flat at the top (a ledge,
// `bare` in the map), little crystals and rock round its foot. Two heights (seed 0, 1). Bottom
// middle on the floor. ----------
const SP_W = 170;
const SPIRES = [280, 340];
function spireArt(seed) {
  const W = SP_W;
  const H = SPIRES[seed % 2];
  const cx = W / 2;
  return art(`spire${seed}`, W, H, () => {
    const out = [];
    const hw = 40;
    // The column: a front face between two side faces, sheared at the top.
    out.push(T([[cx - hw - 12, H], [cx - hw - 12, 22], [cx - hw, 4], [cx + hw, 0], [cx + hw + 12, 18], [cx + hw + 12, H]], CV.cyan));
    out.push(F(T([[cx - hw - 10, H], [cx - hw - 10, 22], [cx - hw + 2, 6], [cx - hw + 18, 6], [cx - hw + 18, H]], CV.cyanLit)));
    out.push(F(T([[cx + hw - 4, H], [cx + hw - 4, 4], [cx + hw + 10, 18], [cx + hw + 10, H]], CV.cyanSh)));
    out.push(F(T([[cx - hw, 4], [cx + hw, 0], [cx + hw + 12, 18], [cx - hw - 12, 22]], '#c8f8ff')));
    // Inner facets, a crack, and a violet heart deep in it.
    out.push(F(band([[cx - 6, H - 20], [cx - 10, H * 0.5], [cx - 2, 40]], () => 0.9, CV.cyanSh)));
    out.push(F(band([[cx + 18, H * 0.7], [cx + 10, H * 0.55], [cx + 20, H * 0.42]], () => 0.8, '#ffffff')));
    out.push(F(E(cx + 4, H * 0.64, 10, 24, '#a8c8f4')), F(E(cx + 2, H * 0.62, 5, 12, '#c8e0ff')));
    // Little crystals and rock round its foot.
    for (const [dx, ang, len, wd, k] of [[-62, -0.5, 44, 16, 0], [-44, -0.2, 30, 12, 1], [56, 0.45, 40, 16, 0], [72, 0.8, 24, 10, 1], [-76, -0.9, 22, 10, 1]]) crystal(out, cx + dx, H, ang, len, wd, k ? CV.ame : CV.cyan, k ? CV.ameLit : CV.cyanLit, k ? CV.ameSh : CV.cyanSh);
    out.push(T([[cx - 84, H + 4], [cx - 70, H - 14], [cx - 30, H - 20], [cx + 30, H - 18], [cx + 76, H - 12], [cx + 86, H + 4]], CV.rock));
    out.push(F(T([[cx - 80, H + 2], [cx - 68, H - 12], [cx - 30, H - 18], [cx - 30, H - 12], [cx - 64, H - 8]], CV.rockLit)));
    return out;
  });
}
function drawSpire(ctx, x, y, time, seed) {
  const H = SPIRES[seed % 2];
  place(ctx, spireArt(seed), x, y);
  // A shimmer rising up its front face.
  const u = (time * 0.2 + seed * 0.5) % 1;
  const sy = y - u * (H - 20);
  const g = ctx.createLinearGradient(0, sy - 14, 0, sy + 14);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(snap(x - 40), snap(sy - 14), 80, 28);
}

export const CAVE_KINDS = {
  glowcap: { w: 210 + M * 2, h: 290 + M, draw: drawCap },
  geode: { w: GE_W + M * 2, h: GE_H + M, draw: drawGeode },
  crystalcolumn: { w: SP_W + M * 2, h: 340 + M, draw: drawSpire },
};

// ---------- The cave's ledges: a slab of dark rock, lit along its top where glowing moss grows,
// amethyst points growing down from under it and a couple poking up off its ends. A `root` end
// fades into the crystal it grows out of. ----------
const GL_PAD = [12, 14, 52];
const GL_RES = 3;
const GL_FADE = 24;
const glKept = new Map();
function paintGeodeLedge(g, w, root, seed) {
  const rL = root === 'left';
  const rR = root === 'right';
  const n = Math.max(6, Math.round(w / 14));
  const depth = (u) => 14 + Math.sin(Math.PI * u) * Math.min(14, w / 14) + (h01(seed * 3 + Math.floor(u * n)) - 0.5) * 6;
  const pts = [[0, 4], [3, 0], [w - 3, 0], [w, 4]];
  for (let i = n; i >= 0; i--) {
    const u = i / n;
    let d = depth(u);
    if (!rL && u < 0.1) d = 6 + (u / 0.1) * (d - 6);
    if (!rR && u > 0.9) d = 6 + ((1 - u) / 0.1) * (d - 6);
    pts.push([u * w, d]);
  }
  // Amethyst points under it.
  for (let j = 0; j < Math.max(2, Math.round(w / 34)); j++) {
    const u = 0.1 + 0.8 * h01(seed * 4.7 + j);
    const px = u * w;
    const len = 8 + h01(seed * 2.3 + j) * 14;
    const wd = 5 + h01(seed + j) * 4;
    const top = depth(u) - 3;
    g.fillStyle = j % 2 ? CCOL.ameSh : CCOL.ame;
    g.strokeStyle = CCOL.line;
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(px - wd / 2, top);
    g.lineTo(px - wd / 2, top + len * 0.7);
    g.lineTo(px, top + len);
    g.lineTo(px + wd / 2, top + len * 0.7);
    g.lineTo(px + wd / 2, top);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = CCOL.ameLit;
    g.fillRect(px - wd / 2 + 0.8, top + 1, 1.4, len * 0.6);
  }
  g.fillStyle = CCOL.rock;
  g.strokeStyle = CCOL.line;
  g.lineWidth = 1;
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
  g.stroke();
  g.save();
  g.clip();
  g.fillStyle = CCOL.rockSh;
  g.fillRect(-2, 9, w + 4, 40);
  g.fillStyle = CCOL.rockLit;
  g.fillRect(-2, 0, w + 4, 3);
  for (let j = 0; j < Math.round(w / 30); j++) {
    g.fillStyle = j % 2 ? CCOL.rockLit : CCOL.deep;
    g.beginPath();
    g.ellipse(10 + h01(seed * 6 + j) * (w - 20), 6 + h01(seed * 8 + j) * 8, 3 + h01(j) * 3, 1.6, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  // Glowing moss along the top.
  for (let j = 0; j < Math.max(2, Math.round(w / 40)); j++) {
    const mx = 8 + h01(seed * 5.3 + j) * (w - 16);
    const mw = 8 + h01(seed * 2.1 + j) * 14;
    g.fillStyle = CCOL.cyanSh;
    g.beginPath();
    g.ellipse(mx, 0.5, mw * 0.55, 2.6, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = CCOL.cyan;
    g.beginPath();
    g.ellipse(mx - 1, -0.3, mw * 0.5, 2, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = CCOL.cyanLit;
    g.fillRect(mx - mw * 0.25, -1.4, mw * 0.25, 1);
  }
  // A crystal poking up off a free end.
  for (const [end, on] of [[0, !rL], [w, !rR]]) {
    if (!on || h01(seed * 9 + end) < 0.35) continue;
    const px = end ? w - 9 : 9;
    g.fillStyle = CCOL.ame;
    g.strokeStyle = CCOL.line;
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(px - 3, 1);
    g.lineTo(px - 3.5, -8);
    g.lineTo(px + (end ? 2 : -2), -14);
    g.lineTo(px + 3.5, -8);
    g.lineTo(px + 3, 1);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = CCOL.ameLit;
    g.fillRect(px - 2.4, -8, 1.3, 7);
  }
  if (rL || rR) {
    g.globalCompositeOperation = 'destination-out';
    const x0 = rL ? -2 : w + 2;
    const x1 = rL ? GL_FADE : w - GL_FADE;
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(0.3, 'rgba(0,0,0,0.8)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(Math.min(x0, x1) - 1, -20, Math.abs(x1 - x0) + 2, 90);
    g.globalCompositeOperation = 'source-over';
  }
}
const CCOL = CV;
function geodeLedgePicture(w, root, seed) {
  const key = `${w}|${root}|${seed}`;
  let c = glKept.get(key);
  if (!c) {
    const [px, pt, pb] = GL_PAD;
    c = document.createElement('canvas');
    c.width = Math.ceil((w + px * 2) * GL_RES);
    c.height = Math.ceil((pt + pb) * GL_RES);
    const g = c.getContext('2d');
    g.scale(GL_RES, GL_RES);
    g.translate(px, pt);
    paintGeodeLedge(g, w, root, seed);
    glKept.set(key, c);
  }
  return c;
}
export function drawGeodeLedge(ctx, x, y, w, time, seed) {
  if (typeof document === 'undefined') return;
  x = snap(x);
  y = snap(y);
  const [px, pt, pb] = GL_PAD;
  ctx.drawImage(geodeLedgePicture(w, null, seed), x - px, y - pt, w + px * 2, pt + pb);
}
export function drawGeodeLedgeRooted(ctx, x, y, w, time, seed, root) {
  if (typeof document === 'undefined') return;
  x = snap(x);
  y = snap(y);
  const [px, pt, pb] = GL_PAD;
  ctx.drawImage(geodeLedgePicture(w, root ?? null, seed), x - px, y - pt, w + px * 2, pt + pb);
}

// ---------- The painted cavern behind ----------
function repeat(camX, factor, spacing, width, draw) {
  const off = camX * factor;
  const first = Math.floor(off / spacing) - 2;
  const count = Math.ceil(width / spacing) + 5;
  for (let k = 0; k < count; k++) draw(first + k, (first + k) * spacing - off);
}
// The far wall of the cavern: crystal clusters glowing in its dark, rock buttresses and stalagmites
// nearer, glow-worms twinkling high up, a pale haze over the lake.
export function drawPaintedCrystalCave(ctx, t, cam, width, height, time, layerY, air) {
  // 1. Glow-worms on the far ceiling.
  for (let k = 0; k < 60; k++) {
    const sx = ((h01(k * 2.3) * width * 1.4 - cam.x * 0.04) % (width + 20) + width + 20) % (width + 20) - 10;
    const sy = h01(k * 5.1) * height * 0.45;
    const tw = 0.35 + 0.35 * Math.sin(time * (0.8 + h01(k) * 1.4) + k);
    ctx.fillStyle = hexA(k % 4 ? '#9ff0ff' : '#e8c8ff', tw);
    ctx.fillRect(snap(sx), snap(sy), 1.6, 1.6);
  }
  // 2. Far crystal clusters glowing in the dark of the far wall.
  const farC = mix(t.far ?? '#3e3268', air, 0.35);
  const farY = layerY(160, 0.04);
  repeat(cam.x, 0.04, 240, width, (i, x) => {
    const xx = x + h01(i + 2) * 90;
    const big = 0.6 + h01(i * 1.9) * 0.8;
    const glowC = h01(i * 3.3) > 0.5 ? '#9ff0ff' : '#d8b4ff';
    const g = ctx.createRadialGradient(xx, farY - 30 * big, 4, xx, farY - 30 * big, 70 * big);
    g.addColorStop(0, hexA(glowC, 0.22));
    g.addColorStop(1, hexA(glowC, 0));
    ctx.fillStyle = g;
    ctx.fillRect(xx - 70 * big, farY - 100 * big, 140 * big, 140 * big);
    ctx.fillStyle = mix(glowC, farC, 0.55);
    const shards = 3 + Math.floor(h01(i * 4.1) * 4);
    for (let q = 0; q < shards; q++) {
      const dx = (h01(i * 7 + q) - 0.5) * 50;
      const h = 22 + h01(i * 5 + q * 3) * 50;
      const wd = 7 + h01(i + q * 2) * 6;
      const lean = dx * 0.018 + (h01(i * 3 + q) - 0.5) * 0.3;
      ctx.save();
      ctx.translate(xx + dx * big, farY);
      ctx.rotate(lean);
      ctx.beginPath();
      ctx.moveTo(-wd * big * 0.5, 0);
      ctx.lineTo(-wd * big * 0.5, -h * big * 0.8);
      ctx.lineTo(0, -h * big);
      ctx.lineTo(wd * big * 0.5, -h * big * 0.8);
      ctx.lineTo(wd * big * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  });
  // 3. Nearer: rock buttresses and stalagmites in silhouette.
  const midC = mix(t.mid ?? '#2e2650', air, 0.12);
  const midY = layerY(40, 0.1);
  repeat(cam.x, 0.1, 150, width, (i, x) => {
    const r = h01(i * 2.7);
    const xx = x + h01(i + 5) * 60;
    ctx.fillStyle = midC;
    if (r < 0.4) {
      const bw = 30 + h01(i + 6) * 30;
      ctx.beginPath();
      ctx.moveTo(xx - bw, midY + 300);
      ctx.quadraticCurveTo(xx - bw * 0.5, midY - 120, xx - bw * 0.3, -20);
      ctx.lineTo(xx + bw * 0.3, -20);
      ctx.quadraticCurveTo(xx + bw * 0.5, midY - 120, xx + bw, midY + 300);
      ctx.closePath();
      ctx.fill();
    } else {
      const sh = 50 + h01(i + 7) * 90;
      ctx.beginPath();
      ctx.moveTo(xx - 16, midY + 300);
      ctx.lineTo(xx - 10, midY - sh * 0.6);
      ctx.lineTo(xx, midY - sh);
      ctx.lineTo(xx + 10, midY - sh * 0.6);
      ctx.lineTo(xx + 16, midY + 300);
      ctx.closePath();
      ctx.fill();
    }
  });
  // 4. A pale haze low down.
  const hz = ctx.createLinearGradient(0, midY - 80, 0, midY + 40);
  hz.addColorStop(0, hexA('#b8a8e8', 0));
  hz.addColorStop(1, hexA('#b8a8e8', 0.18));
  ctx.fillStyle = hz;
  ctx.fillRect(0, midY - 80, width, 400);
}
