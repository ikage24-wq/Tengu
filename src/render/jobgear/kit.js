// The gear material kit: hue-shifted colour ramps per material, and `finish`, which renders a
// piece's flat shapes as materials under one light (upper front: up and toward the facing side).
// Shapes stay the design; finish adds flat planes clipped inside each shape, so the silhouette
// never changes and nothing lands outside a part:
//
//   metal  shadow plane, the base kept as reflected light along the far shadow edge, a highlight
//          band, and a small specular at the lit tip (the 3-step shine). Gold gets a saturated
//          yellow-white highlight and orange-brown shadows; steel goes cool and light, warm and dark.
//   cloth  one soft shadow plane on the back (two on big panels), no highlight.
//   leather a shadow plane and a narrow soft sheen.
//   fur    a shadow plane only; its tufted edge comes from `fur()`.
//   gem    inverted: dark near the light, glowing on the far side, one white glint.
//   glow   untouched (emissive).
//
// Tag a shape with `M(shape, 'metal')`; untagged shapes are classified by the caller (gear.js).
// `hang` bends hanging cloth (capes, tassets, tails, ribbons) as a chain: the root follows the
// cape's root spring (or the fast hair spring) and the tip the softer hem spring, so the root
// leads and the tip follows.

import { T, E, F } from '../pixel.js';

// ---------- Colour ----------

export function hsl(hex) {
  const n = parseInt(hex.slice(1, 7), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h;
  if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const v = (u) => Math.round((u + m) * 255).toString(16).padStart(2, '0');
  return `#${v(r)}${v(g)}${v(b)}`;
}

// Turns hue `h` toward `to` by at most `deg` degrees, the short way round.
function toward(h, to, deg) {
  const d = ((to - h + 540) % 360) - 180;
  return h + Math.sign(d) * Math.min(Math.abs(d), deg);
}

// Colours are stepped by chroma (how colourful they look) rather than HSL saturation, so pale
// tints stay pale in shadow instead of turning into strong peaches and lilacs.
const chroma = (s, l) => s * (1 - Math.abs(2 * l - 1));
function hc(h, C, l) {
  l = Math.max(0, Math.min(1, l));
  const room = 1 - Math.abs(2 * l - 1);
  return hex(h, room > 0 ? Math.min(1, Math.max(0, C) / room) : 0, l);
}

// Where a material's shadows travel: warm hues toward red-magenta, cool ones toward blue-violet,
// greys and pale tints pick up a little violet.
const shadowHue = (h, C) => (C < 0.1 ? 255 : h < 75 || h >= 320 ? 345 : h < 170 ? 200 : 265);
export const isGold = (c) => {
  const [h, s, l] = hsl(c);
  return h >= 30 && h <= 62 && chroma(s, l) > 0.3;
};

const ramps = new Map();
// { hi, base, sh1, sh2, spec } for a colour as a material.
export function ramp(c, mat = 'cloth') {
  const key = c + mat;
  let r = ramps.get(key);
  if (r) return r;
  const [h0, s, l] = hsl(c);
  const C = chroma(s, l);
  // Greys have no hue of their own: their shadows start from violet.
  const h = C < 0.04 ? 255 : h0;
  const to = shadowHue(h, C);
  const dark = l < 0.28;
  const sh = (deg, dC, dl) => hc(toward(h, to, deg), C + dC, l - dl);
  if (mat === 'metal' && isGold(c)) {
    r = { hi: hc(toward(h, 56, 8), C + 0.08, Math.min(0.9, l + 0.15)), base: c, sh1: hc(toward(h, 32, 10), C, l - 0.16), sh2: hc(toward(h, 20, 18), C - 0.04, l - 0.3), spec: '#fffbe6' };
  } else if (mat === 'metal') {
    // Light runs colder and paler, dark warmer (toward violet) and a touch richer.
    r = { hi: hc(toward(h, 210, 8), C * 0.5, Math.min(0.97, l + (dark ? 0.2 : 0.16))), base: c, sh1: sh(12, 0.03, dark ? 0.08 : 0.16), sh2: sh(22, 0.05, dark ? 0.14 : 0.3), spec: '#ffffff' };
  } else if (mat === 'gem') {
    r = { hi: hc(toward(h, 55, 10), C, Math.min(0.94, l + 0.2)), base: c, sh1: sh(16, 0.06, 0.2), sh2: sh(24, 0.08, 0.34), spec: '#ffffff' };
  } else if (mat === 'leather') {
    r = { hi: hc(toward(h, 40, 6), C, l + 0.1), base: c, sh1: hc(toward(h, 12, 10), C + 0.03, l - (dark ? 0.07 : 0.13)), sh2: hc(toward(h, 5, 16), C + 0.04, l - 0.24), spec: null };
  } else {
    r = { hi: hc(toward(h, 50, 6), C, Math.min(0.97, l + (dark ? 0.12 : 0.08))), base: c, sh1: sh(12, 0.04, dark ? 0.07 : l > 0.9 ? 0.1 : 0.13), sh2: sh(22, 0.06, dark ? 0.13 : 0.25), spec: null };
  }
  ramps.set(key, r);
  return r;
}

// The hue-shifted steps of a colour (shadow and highlight), for palettes.
export const darker = (c, dl, mat = 'cloth') => {
  const [h0, s, l] = hsl(c);
  const C = chroma(s, l);
  const h = C < 0.04 ? 255 : h0;
  const to = mat === 'metal' && isGold(c) ? 24 : shadowHue(h, C);
  return hc(toward(h, to, 6 + dl * 30), C + 0.03, l - dl);
};
export const lighter = (c, dl) => {
  const [h0, s, l] = hsl(c);
  const C = chroma(s, l);
  return hc(C < 0.04 ? h0 : toward(h0, 52, 4 + dl * 16), C, l + dl);
};

// ---------- Geometry ----------

// A shape's outline as absolute points.
export function polyOf(s) {
  if (s.t === 'r') return [[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h]];
  if (s.t === 'e') {
    const out = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      out.push([s.x + Math.cos(a) * s.rx, s.y + Math.sin(a) * s.ry]);
    }
    return out;
  }
  return s.pts.map(([x, y]) => [x + s.x, y + s.y]);
}

// Keeps the part of a polygon where dot(p, n) lies between lo and hi (Sutherland-Hodgman twice).
function clipHalf(pts, nx, ny, d, keepBelow) {
  const out = [];
  const val = ([x, y]) => (x * nx + y * ny - d) * (keepBelow ? -1 : 1);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const va = val(a);
    const vb = val(b);
    if (va >= 0) out.push(a);
    if ((va >= 0) !== (vb >= 0)) {
      const k = va / (va - vb);
      out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
    }
  }
  return out;
}
function slab(pts, nx, ny, lo, hi) {
  let p = pts;
  if (lo > -Infinity) p = clipHalf(p, nx, ny, lo, false);
  if (p.length >= 3 && hi < Infinity) p = clipHalf(p, nx, ny, hi, true);
  return p.length >= 3 ? p : null;
}

// The light: from the upper front. Lit faces point along (LX, LY).
const LX = 0.5;
const LY = -0.866;
// Across the light (toward the front), for how wide a plane is and where highlights sit.
const AX = 0.866;
const AY = 0.5;


function extent(pts, nx, ny) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const [x, y] of pts) {
    const v = x * nx + y * ny;
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  return [lo, hi];
}

// Tags a shape with its material.
export const M = (shape, mat) => (shape ? { ...shape, mat } : shape);

// The planes for one shape. Returns flat shapes to draw right after it.
function planes(s, mat) {
  const pts = polyOf(s);
  const [lo, hi] = extent(pts, LX, LY);
  const r = hi - lo;
  const [wa, wb] = extent(pts, AX, AY);
  // Too small or too thin to carry a plane without leaving loose pixels.
  if (r < 2.2 || wb - wa < 1.6) return [];
  // Thin strips (bands, straps) along the light take no planes: they'd break into flecks.
  if (mat !== 'gem' && Math.min(r, wb - wa) < 2) return [];
  const rp = ramp(s.c, mat);
  const out = [];
  // The shadow falls on the back of upright parts (blades, sleeves) and underneath wide ones
  // (brims, bands); between those, on the back and a little below.
  const [bx0, bx1] = extent(pts, 1, 0);
  const [by0, by1] = extent(pts, 0, 1);
  const aspect = (by1 - by0) / Math.max(0.1, bx1 - bx0);
  const [SX, SY] = aspect > 2 ? [1, 0] : aspect < 0.4 ? [0.34, -0.94] : [0.94, -0.34];
  const [sa, sb] = extent(pts, SX, SY);
  const sr = sb - sa;
  // A plane along the light (a..b of its depth), kept to the front `front` share across it.
  const add = (a, b, c, front = 0) => {
    let p = slab(pts, LX, LY, a === null ? -Infinity : lo + a * r, b === null ? Infinity : lo + b * r);
    if (p && front) p = slab(p, AX, AY, wa + front * (wb - wa), Infinity);
    if (p) out.push(F(T(p, c)));
  };
  // The shadow side, the back `k` of the shape.
  const back = (k, c) => {
    const p = slab(pts, SX, SY, -Infinity, sa + k * sr);
    if (p) out.push(F(T(p, c)));
  };
  // Bands need room: at least two thirds of an art pixel each.
  const band = (k) => k * r >= 0.7;
  switch (mat) {
    case 'metal': {
      back(0.32, rp.sh1);
      // The base comes back along the far edge as reflected light.
      if (sr >= 6) {
        const p = slab(pts, SX, SY, -Infinity, sa + Math.max(0.7, 0.08 * sr));
        if (p) out.push(F(T(p, rp.base)));
      }
      // A highlight patch at the upper front, and the specular at its brightest corner.
      // Small plates keep only the specular, so a piece has a few clear shines, not stripes.
      if (r >= 7) add(0.66, 0.82, rp.hi, 0.42);
      if (r >= 4.5) add(0.9, null, r >= 7 ? rp.spec : rp.hi, 0.55);
      break;
    }
    case 'leather':
      back(0.32, rp.sh1);
      if (r >= 6 && band(0.12)) add(0.74, 0.86, rp.hi, 0.35);
      break;
    case 'gem':
      add(0.62, null, rp.sh1);
      add(null, 0.34, rp.hi);
      break;
    case 'fur':
      back(0.3, rp.sh1);
      break;
    case 'glow':
      break;
    default:
      back(0.3, rp.sh1);
      if (sr >= 12) back(0.1, rp.sh2);
  }
  // A gem's glint, a single clean square on the lit side.
  if (mat === 'gem' && r >= 2.4) {
    const cx = (bx0 + bx1) / 2;
    const cy = (by0 + by1) / 2;
    const k = Math.max(0.35, Math.min(0.7, r * 0.12));
    out.push(F(E(cx + (bx1 - bx0) * 0.16, cy - (by1 - by0) * 0.18, k, k, '#ffffff')));
  }
  return out;
}

// Renders a piece's shapes as materials. `matOf(shape)` names the material of an untagged shape
// (or null to leave it flat). Flat (F) shapes, holes, and palette keys are left alone.
export function finish(shapes, matOf) {
  const out = [];
  for (const s of shapes) {
    if (!s) continue;
    out.push(s);
    if (s.f || s.c === 'none' || !s.c.startsWith('#')) continue;
    const mat = s.mat ?? matOf(s);
    if (mat) out.push(...planes(s, mat));
  }
  return out;
}

// ---------- Hanging cloth ----------

// Bends shapes hanging from y0 (the root) to y1 (the tip) as a chain driven by the motion:
// each point moves by an amount that grows from root to tip, the upper links following the fast
// hair spring and the lower ones the slower cape spring, so a swing travels down the cloth. The
// links also rise a little as they swing out, so the cloth keeps its length.
export function hang(shapes, y0, y1, m, k = 1) {
  const fast = (m?.capeRoot ?? m?.hair ?? 0) * k;
  const slow = (m?.sway ?? 0) * k;
  if (!fast && !slow) return shapes;
  const len = Math.max(1, y1 - y0);
  const bend = ([x, y]) => {
    const u = Math.max(0, Math.min(1.2, (y - y0) / len));
    const dx = fast * 0.45 * u * (1 - u) * 2 + slow * u * u;
    return [x + dx, y - (dx * dx) / (len * 2.2)];
  };
  return shapes.map((s) => {
    if (!s || s.t === 'r' && s.h <= 0) return s;
    if (s.f && s.t !== 'p' && (s.t === 'e' ? Math.max(s.rx, s.ry) < 1.2 : s.w * s.h < 2)) {
      // Small flat details ride along whole.
      const [nx, ny] = bend([s.x, s.y]);
      return { ...s, x: nx, y: ny };
    }
    const pts = polyOf(s).map(bend);
    const { x, y, w, h, rx, ry, pts: _p, ...rest } = s;
    return { ...rest, t: 'p', x: 0, y: 0, pts };
  });
}

// A fur trim along a run of points: a soft roll with tufted, scalloped edges (tufts every ~1.6).
export function fur(path, depth, c) {
  const top = [];
  const bot = [];
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i];
    const [bx, by] = path[i + 1];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    const n = Math.max(1, Math.round(len / 1.6));
    for (let j = 0; j < n; j++) {
      const u0 = j / n;
      const um = (j + 0.5) / n;
      const px = ax + (bx - ax) * u0;
      const py = ay + (by - ay) * u0;
      const mx = ax + (bx - ax) * um;
      const my = ay + (by - ay) * um;
      top.push([px - nx * depth * 0.5, py - ny * depth * 0.5], [mx - nx * depth * 0.75, my - ny * depth * 0.75]);
      bot.push([px + nx * depth * 0.5, py + ny * depth * 0.5], [mx + nx * depth * 0.8, my + ny * depth * 0.8]);
    }
  }
  const [ex, ey] = path[path.length - 1];
  top.push([ex, ey - depth * 0.5]);
  bot.push([ex, ey + depth * 0.5]);
  return M(T([...top, ...bot.reverse()], c), 'fur');
}
