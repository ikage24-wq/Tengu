// Sprite toolkit: rasterize simple shapes onto a grid, add an outline around the silhouette, and
// cache the result as a small canvas. Pixel sprites draw unsmoothed; smooth (res > 1) sprites filter.

export const OUTLINE = '#3a2d4f';
const PAD = 1;
const cache = new Map();

export const R = (x, y, w, h, c) => ({ t: 'r', x, y, w, h, c });
export const E = (x, y, rx, ry, c) => ({ t: 'e', x, y, rx, ry, c });
// Pixels set one at a time, for details like eye shines.
export const P = (x, y, c) => ({ t: 'r', x, y, w: 1, h: 1, c });

export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const adj = (v) => Math.max(0, Math.min(255, v + Math.round((amount / 100) * 255)));
  const parts = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(adj);
  return `#${parts.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// Shapes use literal colors (strings starting with '#') or palette keys. `res` rasterizes at
// res x res cells per art pixel (for smooth sprites); the outline then grows into a rounded
// ring about two thirds of an art pixel wide, so corners soften instead of stair-stepping.
function rasterize(w, h, shapes, res = 1) {
  const gw = (w + PAD * 2) * res;
  const gh = (h + PAD * 2) * res;
  const grid = Array.from({ length: gh }, () => Array(gw).fill(null));
  const put = (x, y, c) => {
    if (x >= 0 && y >= 0 && x < gw && y < gh) grid[y][x] = c;
  };
  const at = (v) => Math.round((v + PAD) * res);
  for (const s of shapes) {
    if (!s) continue;
    if (s.t === 'r') {
      for (let y = at(s.y); y < at(s.y + s.h); y++) {
        for (let x = at(s.x); x < at(s.x + s.w); x++) put(x, y, s.c);
      }
    } else {
      const cx = (s.x + PAD) * res;
      const cy = (s.y + PAD) * res;
      const rx = s.rx * res;
      const ry = s.ry * res;
      for (let y = Math.max(0, Math.floor(cy - ry)); y < Math.min(gh, Math.ceil(cy + ry)); y++) {
        for (let x = Math.max(0, Math.floor(cx - rx)); x < Math.min(gw, Math.ceil(cx + rx)); x++) {
          const dx = (x + 0.5 - cx) / rx;
          const dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) put(x, y, s.c);
        }
      }
    }
  }
  // Outline: every empty cell within `reach` cells of the silhouette (a disc, so it's round).
  const reach = res === 1 ? 1 : Math.max(1, Math.round(res * 0.67));
  const ring = [];
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      if ((dx || dy) && (res === 1 ? Math.abs(dx) + Math.abs(dy) === 1 : dx * dx + dy * dy <= reach * reach + 0.5)) ring.push([dx, dy]);
    }
  }
  const filled = (x, y) => {
    const row = grid[y];
    return row && row[x] != null && row[x] !== 'none';
  };
  const edge = [];
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      if (grid[y][x] === null && ring.some(([dx, dy]) => filled(x + dx, y + dy))) edge.push([x, y]);
    }
  }
  for (const [x, y] of edge) grid[y][x] = OUTLINE;
  return grid;
}

const rgbCache = new Map();
function rgb(c) {
  let v = rgbCache.get(c);
  if (!v) {
    const n = parseInt(c.slice(1, 7), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    rgbCache.set(c, v);
  }
  return v;
}

function bake(grid, palette) {
  const canvas = document.createElement('canvas');
  canvas.width = grid[0].length;
  canvas.height = grid.length;
  const g = canvas.getContext('2d');
  const img = g.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const c = grid[y][x];
      if (c === null || c === 'none') continue;
      const [r, gr, b] = rgb(c.startsWith('#') ? c : palette[c] ?? '#ff00ff');
      const i = (y * canvas.width + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = gr;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
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

// Returns a cached sprite { canvas, white, w, h, res } built by `build()` -> { w, h, shapes, palette, res }.
export function sprite(key, build) {
  let s = cache.get(key);
  if (s) {
    cache.delete(key);
  } else {
    const { w, h, shapes, palette = {}, res = 1 } = build();
    const canvas = bake(rasterize(w, h, shapes, res), palette);
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
