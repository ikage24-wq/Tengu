// Prop kit: the shared materials, colour ramps, and wind for everything placed in maps (landmarks,
// buildings, stalls, scenery props, dungeon props). Props share one world light from the upper
// left, take hue-shifted ramps (shadows cool toward violet, or toward rose for warm materials;
// highlights warm toward yellow), and stay a step below the characters in contrast: their outlines
// are a thin, darkened shade of each part's own hue (sprites drawn non-crisp), never ink.
//
// Materials are built as clean clusters (Slynyrd "Plant Life"; pixelartlab): foliage as clumps
// with pointed leaf tips, lit on the upper left; bark with grain running along the trunk; stone as
// courses of blocks with a lit top-left edge; planks with grain; crystals as faceted prisms; water
// in bands. Motion comes from the shared wind (`windAt` in terrain.js): trunks barely move,
// branches more, leaves and tips most, each a moment after the part it hangs from.

import { R, E, T, F, mix } from './pixel.js';
import { windAt } from './terrain.js';

// ---------- Colour ----------

function hsl(hex) {
  const n = parseInt(hex.slice(1, 7), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hex(h, s, l) {
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
// Turns hue `h` toward `to` by at most `d` degrees.
function toward(h, to, d) {
  const diff = ((to - h + 540) % 360) - 180;
  return (h + Math.sign(diff) * Math.min(Math.abs(diff), d) + 360) % 360;
}

const ramps = new Map();
// A four-tone ramp from a base colour: `hi` (lighter, warmer), `base`, `sh` (darker, the hue turned
// toward violet, or toward rose for warm colours, a little more saturated), and `deep` (crevices and
// contact). `k` scales the steps (smaller for pale, soft materials).
export function ramp(base, k = 1) {
  const key = `${base}|${k}`;
  let r = ramps.get(key);
  if (r) return r;
  const [h, s, l] = hsl(base);
  const warm = h < 75 || h > 300;
  const dark = warm ? 340 : 255;
  // Greys and near-whites have no hue of their own: lend them the lavender of the world's shade.
  const hh = s < 0.08 ? 265 : h;
  const ss = s < 0.08 ? 0.22 : s;
  r = {
    hi: hex(toward(hh, 52, 10 * k), ss * 0.95, l + (1 - l) * 0.45 * k),
    base,
    sh: warm ? hex(toward(hh, dark, 12 * k), ss * 0.8, l - 0.1 * k) : hex(toward(hh, dark, 13 * k), Math.min(ss * 1.02 + 0.03, 0.75), l - 0.1 * k),
    deep: warm ? hex(toward(hh, dark, 20 * k), ss * 0.6, l - 0.19 * k) : hex(toward(hh, dark, 24 * k), Math.min(ss * 1.04 + 0.05, 0.7), l - 0.2 * k),
  };
  ramps.set(key, r);
  return r;
}

// ---------- Geometry ----------

// A cheap seeded hash in 0..1.
export const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// The outline of a band following `path`, `widthAt(u)` half as wide at each point.
export function bandPts(path, widthAt) {
  const left = [];
  const right = [];
  path.forEach(([x, y], i) => {
    const [ax, ay] = path[Math.max(0, i - 1)];
    const [bx, by] = path[Math.min(path.length - 1, i + 1)];
    const l = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / l;
    const ny = (bx - ax) / l;
    const w = widthAt(i / (path.length - 1));
    left.push([x + nx * w, y + ny * w]);
    right.push([x - nx * w, y - ny * w]);
  });
  return [...left, ...right.reverse()];
}
export const band = (path, widthAt, c) => T(bandPts(path, widthAt), c);

// The rim of a leaf clump: an oval whose edge breaks into pointed leaf tips (`n` of them), each
// tip a little longer or shorter than its neighbours. Tips on the upper half point up and out.
export function leafRim(cx, cy, rx, ry, n, seed = 0, depth = 0.13) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 + seed;
    const a1 = ((i + 0.5) / n) * Math.PI * 2 + seed;
    const j = 0.96 + 0.12 * hash(seed * 31 + i * 7.3);
    // The notch between two tips, then the tip itself, pushed out past the oval.
    pts.push([cx + Math.cos(a0) * rx * (1 - depth), cy + Math.sin(a0) * ry * (1 - depth)]);
    pts.push([cx + Math.cos(a1) * rx * j, cy + Math.sin(a1) * ry * j]);
  }
  return pts;
}

// A foliage clump in clean clusters: the whole clump in shadow, the lit body drawn up and to the
// left of it, a bright cluster of tips at the upper left, and a few separate leaf tips breaking up
// the body (Slynyrd's plant clusters). `r` is a ramp. Returns shapes.
export function foliage(cx, cy, rx, ry, r, seed = 0, opts = {}) {
  const n = opts.n ?? Math.max(8, Math.round((rx + ry) * 0.6));
  const out = [T(leafRim(cx, cy, rx, ry, n, seed), r.sh)];
  out.push(F(T(leafRim(cx - rx * 0.1, cy - ry * 0.14, rx * 0.8, ry * 0.74, Math.max(7, n - 2), seed + 1.3, 0.15), r.base)));
  if (!opts.flat) {
    out.push(F(T(leafRim(cx - rx * 0.38, cy - ry * 0.44, rx * 0.36, ry * 0.28, Math.max(6, Math.round(n * 0.55)), seed + 2.1, 0.18), mix(r.base, r.hi, 0.7))));
    // Single leaf tips inside the clump: shadowed ones low on the right, lit ones high on the left.
    for (let i = 0; i < (opts.tips ?? 3); i++) {
      const u = hash(seed * 13 + i * 3.1);
      const v = hash(seed * 17 + i * 5.7);
      const lit = i % 2 === 0;
      const x = cx + (lit ? -0.55 + u * 0.5 : 0.05 + u * 0.5) * rx;
      const y = cy + (lit ? -0.35 + v * 0.35 : 0.05 + v * 0.45) * ry;
      const s = Math.max(1.4, Math.min(rx, ry) * 0.2);
      out.push(F(T([[x - s, y + s * 0.5], [x - s * 0.15, y - s * 0.9], [x + s * 0.2, y + s * 0.45]], lit ? r.hi : r.deep)));
    }
  }
  return out;
}

// Bark along a trunk or bough `path`: the wood, its shaded right flank, a lit strip on the left,
// and grain lines that run with the trunk and break off (never parallel stripes end to end).
export function bark(path, widthAt, r, seed = 0, grain = 2) {
  const out = [band(path, widthAt, r.base)];
  const shift = (k, w) => path.map(([x, y], i) => {
    const [ax, ay] = path[Math.max(0, i - 1)];
    const [bx, by] = path[Math.min(path.length - 1, i + 1)];
    const l = Math.hypot(bx - ax, by - ay) || 1;
    // The normal facing away from the light (toward the lower right), whichever way the path runs.
    let nx = -(by - ay) / l;
    let ny = (bx - ax) / l;
    if (nx + ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    const d = k * w(i / (path.length - 1));
    return [x + nx * d, y + ny * d];
  });
  // Right flank in shadow, a lit strip on the left.
  out.push(F(band(shift(0.55, widthAt), (u) => widthAt(u) * 0.45, r.sh)));
  out.push(F(band(shift(-0.6, widthAt), (u) => Math.max(0.4, widthAt(u) * 0.13), mix(r.base, r.hi, 0.55))));
  // Grain: a few tapered strokes that start and stop along the trunk.
  for (let g = 0; g < grain; g++) {
    const off = -0.2 + 0.55 * hash(seed * 7 + g * 2.9);
    const a = Math.floor(hash(seed * 11 + g * 3.3) * (path.length * 0.75));
    const b = Math.min(path.length, a + 2 + Math.floor(hash(seed * 5 + g * 1.7) * (path.length * 0.3)));
    const seg = shift(off, widthAt).slice(a, b);
    if (seg.length >= 2) out.push(F(band(seg, (u) => 0.36 * Math.sin(Math.PI * (0.15 + u * 0.7)) + 0.12, r.deep)));
  }
  return out;
}

// A course of dressed stone blocks in a rectangle: mortar in the deep tone, each block with a lit
// top and left edge and a shaded bottom; rows staggered; some blocks chipped or a shade off.
export function stones(x, y, w, h, r, seed = 0, opts = {}) {
  const rowH = opts.rowH ?? 6;
  const blockW = opts.blockW ?? 10;
  const out = [R(x, y, w, h, r.sh)];
  let row = 0;
  for (let yy = y; yy < y + h - 0.5; yy += rowH, row++) {
    const bh = Math.min(rowH, y + h - yy);
    let xx = x - (row % 2 ? blockW * 0.5 : 0);
    let k = 0;
    while (xx < x + w) {
      const bw = blockW * (0.8 + 0.4 * hash(seed + row * 9.1 + k * 3.7));
      const x0 = Math.max(x, xx) + 0.35;
      const x1 = Math.min(x + w, xx + bw) - 0.35;
      if (x1 - x0 > 1) {
        const v = hash(seed * 3 + row * 5.3 + k * 1.9);
        const c = v < 0.18 ? r.sh : v > 0.86 ? mix(r.base, r.hi, 0.5) : r.base;
        out.push(F(R(x0, yy + 0.35, x1 - x0, bh - 0.7, c)));
        // The lit top edge, and a shadow along the block's foot.
        out.push(F(R(x0, yy + 0.35, x1 - x0, 0.7, r.hi)), F(R(x0, yy + bh - 1.05, x1 - x0, 0.7, r.sh)));
        if (v > 0.93) out.push(F(T([[x1 - 2.4, yy + 0.35], [x1, yy + 0.35], [x1, yy + 2.6]], r.deep)));
      }
      xx += bw;
      k++;
    }
  }
  return out;
}

// Vertical planks (fences, walls, doors) or horizontal ones (`flat`), each with a lit edge, grain
// strokes, and nail heads; `r` a ramp.
export function planks(x, y, w, h, r, n, seed = 0, flat = false) {
  const out = [R(x, y, w, h, r.base)];
  for (let i = 0; i < n; i++) {
    const v = hash(seed * 5 + i * 2.3);
    if (flat) {
      const ph = h / n;
      const py = y + i * ph;
      if (v < 0.3) out.push(F(R(x, py, w, ph, mix(r.base, r.sh, 0.4))));
      out.push(F(R(x, py, w, 0.6, r.hi)), F(R(x, py + ph - 0.6, w, 0.6, r.deep)));
      const gx = x + w * (0.15 + 0.5 * v);
      out.push(F(R(gx, py + ph * 0.45, w * 0.3, 0.5, r.sh)));
    } else {
      const pw = w / n;
      const px = x + i * pw;
      if (v < 0.3) out.push(F(R(px, y, pw, h, mix(r.base, r.sh, 0.4))));
      out.push(F(R(px, y, 0.6, h, r.hi)), F(R(px + pw - 0.6, y, 0.6, h, r.deep)));
      const gy = y + h * (0.15 + 0.5 * v);
      out.push(F(R(px + pw * 0.45, gy, 0.5, h * 0.3, r.sh)));
    }
  }
  return out;
}

// A crystal prism: the lit left facet, the shaded right one, a deep sliver on the far edge, a
// bright ridge, and a hard glint near the tip.
export function crystal(x, w, top, tip, bot, r, lean = 0) {
  const L = x - w / 2;
  const Rr = x + w / 2;
  return [
    T([[L, bot], [L + lean * 0.6, top], [x + lean, tip], [Rr + lean * 0.6, top], [Rr, bot]], r.base),
    F(T([[x + w * 0.08, bot], [x + lean * 0.85 + w * 0.06, top + (tip - top) * 0.15], [x + lean, tip], [Rr + lean * 0.6, top], [Rr, bot]], r.sh)),
    F(T([[Rr - w * 0.2, bot], [Rr - w * 0.16 + lean * 0.6, top], [x + lean, tip], [Rr + lean * 0.6, top], [Rr, bot]], r.deep)),
    F(T([[L + w * 0.16, bot - 3], [L + w * 0.16 + lean * 0.6, top + 1], [x + lean * 0.9 - w * 0.05, tip + (top - tip) * 0.3], [L + w * 0.32 + lean * 0.6, top + 2], [L + w * 0.3, bot - 6]], r.hi)),
    F(T([[x + lean - w * 0.1, tip + (top - tip) * 0.35], [x + lean, tip + 1.2], [x + lean + w * 0.04, tip + (top - tip) * 0.5]], '#ffffff')),
  ];
}

// A soft-edged hole of shade, for windows and doorways set into a wall: frame, dark glass, and
// a lit pane in the upper left.
export function windowPane(x, y, w, h, frame, glass, lit) {
  return [R(x - 0.8, y - 0.8, w + 1.6, h + 1.6, frame), F(R(x, y, w, h, glass)), F(R(x, y, w * 0.5, h * 0.5, lit)), F(R(x + w * 0.5 - 0.35, y, 0.7, h, frame)), F(R(x, y + h * 0.5 - 0.35, w, 0.7, frame))];
}

// ---------- Wind ----------

// How far the wind leans things at world x: about -0.5 (still, swaying back) to 0.8 (a gust),
// plus a small flutter of its own. `lag` delays it (seconds) for parts further from the root.
export function lean(time, wx = 0, lag = 0, seed = 0) {
  const t = time - lag;
  return windAt(t, wx) - 0.45 + 0.12 * Math.sin(t * 2.3 + wx * 0.031 + seed * 5.1);
}

// One of `n` cached poses for a lean (0 ... n - 1, the middle one upright-ish).
export function leanFrame(time, wx, n, lag = 0, seed = 0) {
  const v = (lean(time, wx, lag, seed) + 0.6) / 1.5;
  return Math.max(0, Math.min(n - 1, Math.round(v * (n - 1))));
}

// The angle (radians) of something hanging from a pivot (lantern, sign, bell), swinging in the
// wind a moment after its pivot moves, with a slow pendulum of its own.
export function swing(time, wx, k = 1, seed = 0) {
  return k * (0.07 * lean(time, wx, 0.35, seed) + 0.035 * Math.sin(time * 1.9 + seed * 2.7));
}

// Draws `draw` rotated by `a` about the pivot (px, py).
export function pivoted(ctx, px, py, a, draw) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(a);
  ctx.translate(-px, -py);
  draw();
  ctx.restore();
}

// A flame's flicker (0.75 ... 1): two quick waves and a slow one, never a regular blink.
export const flicker = (time, seed = 0) => 0.86 + 0.07 * Math.sin(time * 11 + seed * 3.1) + 0.05 * Math.sin(time * 17.3 + seed) + 0.03 * Math.sin(time * 2.3 + seed);
