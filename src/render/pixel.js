// Pixel-art toolkit: rasterize simple shapes onto a grid, add a 1px outline around the silhouette,
// and cache the result as a tiny canvas drawn without smoothing.

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

// Shapes use literal colors (strings starting with '#') or palette keys.
function rasterize(w, h, shapes) {
  const gw = w + PAD * 2;
  const gh = h + PAD * 2;
  const grid = Array.from({ length: gh }, () => Array(gw).fill(null));
  const put = (x, y, c) => {
    const gx = x + PAD;
    const gy = y + PAD;
    if (gx >= 0 && gy >= 0 && gx < gw && gy < gh) grid[gy][gx] = c;
  };
  for (const s of shapes) {
    if (!s) continue;
    if (s.t === 'r') {
      for (let y = Math.round(s.y); y < Math.round(s.y + s.h); y++) {
        for (let x = Math.round(s.x); x < Math.round(s.x + s.w); x++) put(x, y, s.c);
      }
    } else {
      for (let y = -PAD; y < h + PAD; y++) {
        for (let x = -PAD; x < w + PAD; x++) {
          const dx = (x + 0.5 - s.x) / s.rx;
          const dy = (y + 0.5 - s.y) / s.ry;
          if (dx * dx + dy * dy <= 1) put(x, y, s.c);
        }
      }
    }
  }
  const edge = [];
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      if (grid[y][x] !== null) continue;
      const touches = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const row = grid[y + dy];
        return row && row[x + dx] != null && row[x + dx] !== 'none';
      });
      if (touches) edge.push([x, y]);
    }
  }
  for (const [x, y] of edge) grid[y][x] = OUTLINE;
  return grid;
}

function bake(grid, palette) {
  const canvas = document.createElement('canvas');
  canvas.width = grid[0].length;
  canvas.height = grid.length;
  const g = canvas.getContext('2d');
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const c = grid[y][x];
      if (c === null || c === 'none') continue;
      g.fillStyle = c.startsWith('#') ? c : palette[c] ?? '#ff00ff';
      g.fillRect(x, y, 1, 1);
    }
  }
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

// Returns a cached sprite { canvas, white, w, h } built by `build()` -> { w, h, shapes, palette }.
export function sprite(key, build) {
  let s = cache.get(key);
  if (!s) {
    const { w, h, shapes, palette = {} } = build();
    const canvas = bake(rasterize(w, h, shapes), palette);
    s = { canvas, w, h, white: null };
    cache.set(key, s);
  }
  return s;
}

// Draws a sprite with its local (0, 0) at screen (x, y). Optionally mirrored or flashed white.
export function blit(ctx, s, x, y, { flip = false, flash = 0, alpha = 1, scale = 1 } = {}) {
  const img = s.canvas;
  const w = img.width * scale;
  const h = img.height * scale;
  const px = Math.round(x - PAD * scale);
  const py = Math.round(y - PAD * scale);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
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
