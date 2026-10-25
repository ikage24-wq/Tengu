// Sprite toolkit: rasterize simple shapes onto a grid, add an outline around the silhouette, and
// cache the result as a small canvas. Pixel sprites draw unsmoothed; smooth (res > 1) sprites filter.

export const OUTLINE = '#3a2d4f';
const PAD = 1;
const cache = new Map();

export const R = (x, y, w, h, c) => ({ t: 'r', x, y, w, h, c });
export const E = (x, y, rx, ry, c) => ({ t: 'e', x, y, rx, ry, c });
// Pixels set one at a time, for details like eye shines.
export const P = (x, y, c) => ({ t: 'r', x, y, w: 1, h: 1, c });
// A polygon; points are relative to (x, y) so shapes can be moved by changing x and y.
export const T = (pts, c, x = 0, y = 0) => ({ t: 'p', x, y, pts, c });
// Flat shapes skip shading and keep their exact color (eyes, mouths, shines).
export const F = (shape) => ({ ...shape, f: 1 });
// Shapes that cast a soft shadow onto whatever sits just below them (bangs onto the face).
export const C = (shape) => ({ ...shape, cast: 1 });

export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const adj = (v) => Math.max(0, Math.min(255, v + Math.round((amount / 100) * 255)));
  const parts = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(adj);
  return `#${parts.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const shadeCache = new Map();
function shadeOf(c, amount) {
  const k = `${c}${amount}`;
  let v = shadeCache.get(k);
  if (!v) {
    v = shade(c, amount);
    shadeCache.set(k, v);
  }
  return v;
}

// Blend two hex colors, t = 0 gives a, 1 gives b.
export function mix(a, b, t) {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const m = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${m(ar, br)}${m(ag, bg)}${m(ab, bb)}`;
}

const outlineCache = new Map();
// Soft sprites outline each part in a deep shade of its own color, pulled toward the ink.
function outlineFor(c) {
  let v = outlineCache.get(c);
  if (!v) {
    v = mix(shade(c, -42), OUTLINE, 0.35);
    outlineCache.set(c, v);
  }
  return v;
}

// Shapes use literal colors (strings starting with '#') or palette keys. `res` rasterizes at
// res x res cells per art pixel (for smooth sprites); the outline then grows into a rounded
// ring about two thirds of an art pixel wide, so corners soften instead of stair-stepping.
// `soft` sprites are also shaded: a soft shadow tone along the back and bottom of the silhouette
// and under shapes flagged to cast (C), and outlines take a deep shade of the part they wrap.
// Shapes flagged flat (F) keep their exact color, for eyes and other fine details.
//
// Cells hold color ids (indexes into `colors`); EMPTY is transparent and NONE is a hole that
// stays transparent and never gets outlined.
const EMPTY = -1;
const NONE = -2;

function rasterize(w, h, shapes, res = 1, soft = false, palette = {}) {
  const gw = (w + PAD * 2) * res;
  const gh = (h + PAD * 2) * res;
  const colors = [];
  const ids = new Map();
  const idOf = (c) => {
    let id = ids.get(c);
    if (id === undefined) {
      id = colors.length;
      colors.push(c);
      ids.set(c, id);
    }
    return id;
  };
  const grid = new Int32Array(gw * gh).fill(EMPTY);
  const flat = new Uint8Array(gw * gh);
  const cast = new Uint8Array(gw * gh);
  const at = (v) => Math.round((v + PAD) * res);
  for (const s of shapes) {
    if (!s) continue;
    const id = s.c === 'none' ? NONE : idOf(s.c.startsWith('#') ? s.c : palette[s.c] ?? '#ff00ff');
    const f = s.f ? 1 : 0;
    const cs = s.cast ? 1 : 0;
    const span = (y, x0, x1) => {
      if (y < 0 || y >= gh) return;
      const a = Math.max(0, x0);
      const b = Math.min(gw - 1, x1);
      for (let x = a, i = y * gw + a; x <= b; x++, i++) {
        grid[i] = id;
        flat[i] = f;
        cast[i] = cs;
      }
    };
    if (s.t === 'r') {
      for (let y = at(s.y); y < at(s.y + s.h); y++) span(y, at(s.x), at(s.x + s.w) - 1);
    } else if (s.t === 'p') {
      // Scanline fill: cells whose centers fall between pairs of edge crossings.
      const pts = s.pts.map(([px, py]) => [(s.x + px + PAD) * res, (s.y + py + PAD) * res]);
      const ys = pts.map((q) => q[1]);
      for (let y = Math.max(0, Math.floor(Math.min(...ys))); y < Math.min(gh, Math.ceil(Math.max(...ys))); y++) {
        const cy = y + 0.5;
        const xs = [];
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i];
          const [xj, yj] = pts[j];
          if ((yi > cy) !== (yj > cy)) xs.push(xi + ((cy - yi) * (xj - xi)) / (yj - yi));
        }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) span(y, Math.ceil(xs[k] - 0.5), Math.ceil(xs[k + 1] - 0.5) - 1);
      }
    } else {
      const cx = (s.x + PAD) * res;
      const cy = (s.y + PAD) * res;
      const rx = s.rx * res;
      const ry = s.ry * res;
      for (let y = Math.max(0, Math.floor(cy - ry)); y < Math.min(gh, Math.ceil(cy + ry)); y++) {
        const dy = (y + 0.5 - cy) / ry;
        if (dy * dy > 1) continue;
        const hw = rx * Math.sqrt(1 - dy * dy);
        // Same cells as testing ((x + 0.5 - cx) / rx)^2 + dy^2 <= 1, clipped to the ellipse's box.
        span(y, Math.max(Math.floor(cx - rx), Math.ceil(cx - hw - 0.5)), Math.min(Math.ceil(cx + rx) - 1, Math.floor(cx + hw - 0.5)));
      }
    }
  }

  // Shading, read from the unshaded colors so bands don't feed into each other: one soft shadow
  // tone along the back and bottom of the silhouette (light comes from the front and above), and
  // a cast shadow just under shapes flagged `cast` (bangs over the face).
  const out = grid.slice();
  if (soft) {
    const back = Math.round(res * 1.2);
    const under = Math.max(1, Math.round(res * 0.7));
    const castBand = Math.round(res * 1.1);
    const dark = new Map();
    const tone = (id) => {
      let v = dark.get(id);
      if (v === undefined) {
        v = idOf(shadeOf(colors[id], -11));
        dark.set(id, v);
      }
      return v;
    };
    const outside = (x, y) => x < 0 || y < 0 || x >= gw || y >= gh || grid[y * gw + x] < 0;
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const i = y * gw + x;
        const c = grid[i];
        if (c < 0 || flat[i]) continue;
        let shadow = false;
        for (let k = 1; k <= back && !shadow; k++) shadow = outside(x - k, y);
        for (let k = 1; k <= under && !shadow; k++) shadow = outside(x, y + k);
        if (!cast[i]) {
          for (let k = 1; k <= castBand && !shadow && y - k >= 0; k++) {
            const a = i - k * gw;
            shadow = cast[a] === 1 && grid[a] !== c;
          }
        }
        if (shadow) out[i] = tone(c);
      }
    }
  }

  // Outline: every empty cell within `reach` cells of the silhouette (a disc, so it's round),
  // grown outward from the filled cells and colored after the nearest one.
  const reach = res === 1 ? 1 : Math.max(1, Math.round(res * 0.67));
  const ring = [];
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      if ((dx || dy) && (res === 1 ? Math.abs(dx) + Math.abs(dy) === 1 : dx * dx + dy * dy <= reach * reach + 0.5)) ring.push([dx, dy, dx * dx + dy * dy]);
    }
  }
  const best = new Float32Array(gw * gh).fill(Infinity);
  const from = new Int32Array(gw * gh);
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x;
      if (grid[i] < 0) continue;
      for (const [dx, dy, d] of ring) {
        const tx = x + dx;
        const ty = y + dy;
        if (tx < 0 || ty < 0 || tx >= gw || ty >= gh) continue;
        const t = ty * gw + tx;
        if (grid[t] === EMPTY && d < best[t]) {
          best[t] = d;
          from[t] = grid[i];
        }
      }
    }
  }
  const ink = soft ? null : idOf(OUTLINE);
  const inkFor = new Map();
  for (let t = 0; t < best.length; t++) {
    if (best[t] === Infinity) continue;
    if (ink !== null) {
      out[t] = ink;
    } else {
      let v = inkFor.get(from[t]);
      if (v === undefined) {
        v = idOf(outlineFor(colors[from[t]]));
        inkFor.set(from[t], v);
      }
      out[t] = v;
    }
  }
  return { gw, gh, cells: out, colors };
}

function rgb(c) {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function bake({ gw, gh, cells, colors }) {
  const canvas = document.createElement('canvas');
  canvas.width = gw;
  canvas.height = gh;
  const g = canvas.getContext('2d');
  const img = g.createImageData(gw, gh);
  const rgbs = colors.map(rgb);
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    if (c < 0) continue;
    const [r, gr, b] = rgbs[c];
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = gr;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return canvas;
}

// A solid-white copy of a sprite, used for the hit flash.
function whiteOf(canvas) {
  const c = document.createElement('canvas');
  c.width = canvas.width;
  c.height = canvas.height;
  const g = c.getContext('2d');
  g.drawImage(canvas, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

// A copy of a sprite filled with one color (for glows), cached per color.
const tints = new WeakMap();
export function tinted(s, color) {
  if (!tints.has(s.canvas)) tints.set(s.canvas, new Map());
  const byColor = tints.get(s.canvas);
  let c = byColor.get(color);
  if (!c) {
    c = document.createElement('canvas');
    c.width = s.canvas.width;
    c.height = s.canvas.height;
    const g = c.getContext('2d');
    g.drawImage(s.canvas, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    byColor.set(color, c);
  }
  return c;
}

// Smooth sprites are big and the hero makes many of them, so the cache forgets the least
// recently used ones past this size.
const CACHE_MAX = 900;

// Returns a cached sprite { canvas, white, w, h, res } built by `build()` -> { w, h, shapes, palette, res, soft }.
export function sprite(key, build) {
  let s = cache.get(key);
  if (s) {
    cache.delete(key);
  } else {
    const { w, h, shapes, palette = {}, res = 1, soft = false } = build();
    const canvas = bake(rasterize(w, h, shapes, res, soft, palette));
    s = { canvas, w, h, res, white: null };
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  }
  cache.set(key, s);
  return s;
}

// Draws a sprite with its local (0, 0) at screen (x, y). Optionally mirrored or flashed white.
// Smooth sprites (res > 1) are drawn filtered and at sub-pixel positions.
export function blit(ctx, s, x, y, { flip = false, flash = 0, alpha = 1, scale = 1 } = {}) {
  const img = s.canvas;
  const res = s.res ?? 1;
  const w = (img.width / res) * scale;
  const h = (img.height / res) * scale;
  const smooth = res > 1;
  const px = smooth ? x - PAD * scale : Math.round(x - PAD * scale);
  const py = smooth ? y - PAD * scale : Math.round(y - PAD * scale);
  ctx.save();
  ctx.imageSmoothingEnabled = smooth;
  if (smooth) ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = alpha;
  if (flip) {
    ctx.translate(px + w, py);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
    if (flash > 0) {
      s.white ??= whiteOf(img);
      ctx.globalAlpha = alpha * Math.min(1, flash * 8);
      ctx.drawImage(s.white, 0, 0, w, h);
    }
  } else {
    ctx.drawImage(img, px, py, w, h);
    if (flash > 0) {
      s.white ??= whiteOf(img);
      ctx.globalAlpha = alpha * Math.min(1, flash * 8);
      ctx.drawImage(s.white, px, py, w, h);
    }
  }
  ctx.restore();
}
