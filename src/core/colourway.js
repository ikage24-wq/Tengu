// Colourways (2026-11-10, the gacha plan's step 5): every capsule set has one mythic colourway, a
// full re-theme of its colours (the Forge God's gold turns silver and its lava ice-blue). A pull
// now and then comes out "shiny", in its set's colourway (data/outfits-gacha.js COLOURWAYS).
//
// A colourway is a list of rules, each moving the colours of one hue band (and lightness range) to
// a new hue, with its saturation scaled and its lightness nudged; the first rule that matches a
// colour wins, and anything matching none (whites, inks, skin) keeps its colour. The same rules
// repaint a piece's drawn shapes and its moving effects, so a set always matches itself.

const cache = new Map();

function toHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function fromHsl(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v) => Math.round(Math.max(0, Math.min(1, v + m)) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}
const inBand = (h, [a, b]) => (a <= b ? h >= a && h <= b : h >= a || h <= b);

// A colour string (#rgb, #rrggbb, rgb(), rgba()) in the colourway. Anything else passes through.
export function recolour(c, way) {
  if (!way || typeof c !== 'string') return c;
  const key = `${way.id}|${c}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let r;
  let g;
  let b;
  let a = null;
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (m) {
    const h = m[1].length === 3 ? m[1].split('').map((d) => d + d).join('') : m[1];
    [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  } else if ((m = /^rgba?\(([^)]+)\)$/i.exec(c))) {
    const p = m[1].split(',').map((v) => parseFloat(v));
    [r, g, b] = p;
    a = p.length > 3 ? p[3] : null;
  } else {
    cache.set(key, c);
    return c;
  }
  const [h, s, l] = toHsl(r, g, b);
  let out = c;
  for (const rule of way.rules) {
    if (s < (rule.minS ?? 0.12) || l < (rule.minL ?? 0) || l > (rule.maxL ?? 1) || !inBand(h, rule.from)) continue;
    const hex = fromHsl(rule.to, Math.max(0, Math.min(1, s * (rule.s ?? 1))), Math.max(0, Math.min(1, l + (rule.l ?? 0))));
    out = a == null ? hex : `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
    break;
  }
  if (cache.size > 6000) cache.clear();
  cache.set(key, out);
  return out;
}

// Drawn shapes (render/pixel.js: each with a colour `c`), repainted.
export const recolourShapes = (shapes, way) => (way && Array.isArray(shapes) ? shapes.map((s) => (s && s.c ? { ...s, c: recolour(s.c, way) } : s)) : shapes);

// A drawing context whose fill and stroke colours are repainted as they're set (for the effects a
// piece draws straight onto the screen). One is kept per real context and colourway.
const wrapped = new WeakMap();
export function recolourCtx(ctx, way) {
  if (!way) return ctx;
  let per = wrapped.get(ctx);
  if (!per) wrapped.set(ctx, (per = new Map()));
  let p = per.get(way.id);
  if (p) return p;
  const bound = new Map();
  p = new Proxy(ctx, {
    get(t, k) {
      const v = t[k];
      if (typeof v !== 'function') return v;
      let f = bound.get(k);
      if (!f) bound.set(k, (f = v.bind(t)));
      return f;
    },
    set(t, k, v) {
      t[k] = k === 'fillStyle' || k === 'strokeStyle' || k === 'shadowColor' ? recolour(v, way) : v;
      return true;
    },
  });
  per.set(way.id, p);
  return p;
}
