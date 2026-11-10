// Sprite toolkit: rasterize simple shapes onto a grid, add an outline around the silhouette, and
// cache the result as a small canvas. Pixel sprites draw unsmoothed; smooth (res > 1) sprites filter.

export const OUTLINE = '#3a2d4f';
const PAD = 1;
const cache = new Map();

// HD graphics: lighting, glow, and positions snapped to the screen's own pixels (so the camera
// glides). Sprites stay crisp pixel art either way.
export const gfx = { hd: true, scale: 1, noGlow: false, noLight: false, glowPass: false, zoom: 1, noBudget: false };
// Draws with sprites rasterized `z` times finer than the screen (portraits drawn big in dialogs
// and windows, so a 2x figure stays smooth instead of showing doubled pixels). Kept apart in the
// cache.
export function withZoom(z, fn) {
  const was = gfx.zoom;
  gfx.zoom = gfx.hd ? Math.max(1, Math.round(z)) : 1;
  try {
    return fn();
  } finally {
    gfx.zoom = was;
  }
}
// Rounds a position to the pixel grid: whole game pixels, or in HD the screen's own (finer) pixels,
// so the camera and everything in the world glide instead of stepping.
export const snap = (v) => (gfx.hd ? Math.round(v * gfx.scale) / gfx.scale : Math.round(v));
export function setHd(on, scale = 1) {
  if (gfx.scale !== scale) {
    // Detailed sprites are drawn at the screen's density: redraw them for the new one.
    gfx.scale = scale;
    cache.clear();
    cacheBytes = 0;
  }
  if (gfx.hd === on) return;
  gfx.hd = on;
  // Turning HD back on tries the full look again.
  gfx.noGlow = false;
  gfx.noLight = false;
  cache.clear();
  cacheBytes = 0;
}

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
// Lit shapes skip form shading and only take cast shadows (faces).
export const L = (shape) => ({ ...shape, lit: 1 });

// The soft shadow tone: a little darker and pulled toward lavender.
export function shadowTone(c) {
  return mix(shade(c, -7), '#9b8ad0', 0.2);
}

// The soft highlight on the lit front edge: a touch of warm white.
export function lightTone(c) {
  return mix(c, '#fff8ee', 0.22);
}

// The rim light on the figure's top and front edges (the light pass): brighter and warmer.
// `light` is the colour of the light catching it (warm white by day, gold at dusk, blue at night).
export function rimTone(c, light = '#fff1e0') {
  return mix(shade(c, 12), light, 0.46);
}

// The light pass's form shadow: warmer than the plain one, a rosy violet, so skin stays alive.
export function formTone(c) {
  return mix(shade(c, -10), '#c98ab8', 0.2);
}

export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const adj = (v) => Math.max(0, Math.min(255, v + Math.round((amount / 100) * 255)));
  const parts = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(adj);
  return `#${parts.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// Blend two hex colors, t = 0 gives a, 1 gives b.
export function mix(a, b, t) {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const m = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${m(ar, br)}${m(ag, bg)}${m(ab, bb)}`;
}

// The outline for a sparkle, glint or star: a warm gold pulled from its own colour, so bright
// marks read as light on any map instead of getting a grey ring.
export const sparkLine = (c) => mix(shade(c, -26), '#e39a3a', 0.5);

const outlineCache = new Map();
// Soft sprites outline each part in a deep shade of its own color, pulled toward the ink.
// Crisp sprites use a darker, inkier line, like classic pixel art.
// Selective outlines ("sel-out") take `side`: -1 on edges facing the light (top and front), where
// the line is a lighter shade of the part's own hue, +1 on the bottom and back, where it's the
// darkest, and 0 between.
function outlineFor(c, crisp, side = 0) {
  const k = `${c}${crisp ? 1 : 0}${side}`;
  let v = outlineCache.get(k);
  if (!v) {
    if (side < 0) v = shade(c, -34);
    else if (side > 0) v = mix(shade(c, -62), '#2a2035', 0.6);
    else v = crisp ? mix(shade(c, -58), '#2a2035', 0.5) : mix(shade(c, -42), OUTLINE, 0.35);
    outlineCache.set(k, v);
  }
  return v;
}

// Shapes use literal colors (strings starting with '#') or palette keys. `res` rasterizes at
// res x res cells per art pixel (for smooth sprites); the outline then grows into a rounded
// ring about two thirds of an art pixel wide, so corners soften instead of stair-stepping.
// `soft` sprites are also shaded with a soft lavender tone on the back side of each part and
// under shapes flagged to cast (C), and outlines take a deep shade of the part they wrap.
// Shapes flagged flat (F) keep their exact color, for eyes and other fine details.
//
// Cells hold color ids (indexes into `colors`); EMPTY is transparent and NONE is a hole that
// stays transparent and never gets outlined.
const EMPTY = -1;
const NONE = -2;

function rasterize(w, h, shapes, res = 1, soft = false, palette = {}, crisp = false, selout = false, pad = PAD, light = false, edge = null) {
  const gw = (w + pad * 2) * res;
  const gh = (h + pad + PAD) * res;
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
  // Each cell's flags in one byte: 1 flat (F), 2 casts a shadow (C), 4 lit (L).
  const meta = new Uint8Array(gw * gh);
  const at = (v) => Math.round((v + pad) * res);
  // A shape may name its own outline colour (`line`), for bright marks such as sparkles and
  // glints, whose automatic darkened line would turn grey; it applies to every cell of that colour.
  const lineOf = new Map();
  // Scratch for polygon fills, grown as needed.
  let px = new Float64Array(64);
  let py = new Float64Array(64);
  let xs = new Float64Array(64);
  for (const s of shapes) {
    if (!s) continue;
    const id = s.c === 'none' ? NONE : idOf(s.c.startsWith('#') ? s.c : palette[s.c] ?? '#ff00ff');
    if (s.line && id >= 0) lineOf.set(id, s.line);
    const m = (s.f ? 1 : 0) | (s.cast ? 2 : 0) | (s.lit ? 4 : 0);
    // (A run of cells filled at once.)
    const span = (y, x0, x1) => {
      if (y < 0 || y >= gh) return;
      const a = Math.max(0, x0);
      const b = Math.min(gw - 1, x1);
      if (b < a) return;
      const row = y * gw;
      grid.fill(id, row + a, row + b + 1);
      meta.fill(m, row + a, row + b + 1);
    };
    if (s.t === 'r') {
      for (let y = at(s.y); y < at(s.y + s.h); y++) span(y, at(s.x), at(s.x + s.w) - 1);
    } else if (s.t === 'p') {
      // Scanline fill: cells whose centers fall between pairs of edge crossings.
      const n = s.pts.length;
      if (px.length < n) {
        px = new Float64Array(n * 2);
        py = new Float64Array(n * 2);
        xs = new Float64Array(n * 2);
      }
      let y0 = Infinity;
      let y1 = -Infinity;
      for (let i = 0; i < n; i++) {
        px[i] = (s.x + s.pts[i][0] + pad) * res;
        py[i] = (s.y + s.pts[i][1] + pad) * res;
        if (py[i] < y0) y0 = py[i];
        if (py[i] > y1) y1 = py[i];
      }
      for (let y = Math.max(0, Math.floor(y0)); y < Math.min(gh, Math.ceil(y1)); y++) {
        const cy = y + 0.5;
        let m = 0;
        for (let i = 0, j = n - 1; i < n; j = i++) {
          const yi = py[i];
          const yj = py[j];
          if ((yi > cy) !== (yj > cy)) {
            // Insertion sort as the crossings come (there are only ever a few).
            const v = px[i] + ((cy - yi) * (px[j] - px[i])) / (yj - yi);
            let k = m++;
            while (k > 0 && xs[k - 1] > v) {
              xs[k] = xs[k - 1];
              k--;
            }
            xs[k] = v;
          }
        }
        for (let k = 0; k + 1 < m; k += 2) span(y, Math.ceil(xs[k] - 0.5), Math.ceil(xs[k + 1] - 0.5) - 1);
      }
    } else {
      const cx = (s.x + pad) * res;
      const cy = (s.y + pad) * res;
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

  // Shading, read from the unshaded colors: each part's back side (the left third of every run
  // of its color, light coming from the front) takes the soft lavender shadow tone, as does a thin
  // band along the bottom of the silhouette and the strip just under any shape flagged to cast
  // (bangs over the face). Lit shapes (L) only take cast shadows, so faces stay clean.
  const out = grid.slice();
  if (soft) {
    const under = Math.max(1, Math.round(res * 0.5));
    const castBand = Math.max(1, Math.round(res * 0.6));
    const dark = new Map();
    const bright = new Map();
    const toned = (cache, id, fn) => {
      let v = cache.get(id);
      if (v === undefined) {
        v = idOf(fn(colors[id]));
        cache.set(id, v);
      }
      return v;
    };
    const tone = (id) => toned(dark, id, light ? formTone : shadowTone);
    const shaded = new Uint8Array(gw * gh);
    for (let y = 0; y < gh; y++) {
      let x = 0;
      while (x < gw) {
        const i = y * gw + x;
        const c = grid[i];
        if (c < 0 || meta[i] & 1) {
          x++;
          continue;
        }
        // A run of this color; flat details inside it (strands, shines) don't break it.
        let end = x;
        // (With the light pass a run carries on through thin flat details, such as seams and folds,
        // but stops at broad flat parts, so an arm in front of flat hair is shaded as the arm alone.)
        const gap = light ? res * 1.6 : Infinity;
        while (end < gw) {
          const k = y * gw + end;
          if (grid[k] === c) end++;
          else if (meta[k] & 1 && grid[k] >= 0) {
            let j = end;
            while (j < gw && j - end <= gap && meta[y * gw + j] & 1 && grid[y * gw + j] >= 0 && grid[y * gw + j] !== c) j++;
            if (j < gw && grid[y * gw + j] === c && j - end <= gap) end = j;
            else if (!light) end = j;
            else break;
          } else break;
        }
        // Three tones across the run: shadow at the back, base, and a soft highlight at the front.
        const len = end - x;
        // 'cel' sprites (front-facing figures) skip the side shadow and keep only the cast and bottom bands.
        // The light pass (`light`, the hero redraw): even a front-facing figure turns from the light,
        // its back side in a soft shadow that widens toward the feet, so the figure reads as round.
        // With `edge` (the figure's back line, in its own units at the top and the feet), the shadow
        // is everything behind one smooth line, so no detail or lock of hair can step it.
        const back = soft === 'cel' ? 0 : Math.max(res, Math.round(len * 0.28));
        // Thin parts (arms, legs) only get the shadow; a highlight on them reads as stripes.
        // No highlight band: one soft shadow keeps the look simple.
        const front = 0;
        for (let k = x; k < Math.min(end, x + back); k++) shaded[y * gw + k] = 1;
        for (let k = Math.max(x + back, end - front); k < end; k++) shaded[y * gw + k] = 2;
        x = end;
      }
    }
    // (The back line's place on each row, worked out once per row.)
    const useEdge = light && edge;
    for (let y = 0; y < gh; y++) {
      const edgeX = useEdge ? at(edge[0] + (edge[1] - edge[0]) * (y / gh)) : -Infinity;
      for (let x = 0; x < gw; x++) {
        const i = y * gw + x;
        const c = grid[i];
        const mi = meta[i];
        if (c < 0 || mi & 1) continue;
        const isLit = mi & 4;
        let shadow = !isLit && (shaded[i] === 1 || x < edgeX);
        for (let k = 1; k <= under && !shadow && !isLit; k++) shadow = y + k >= gh || grid[i + k * gw] < 0;
        if (!(mi & 2)) {
          for (let k = 1; k <= castBand && !shadow && y - k >= 0; k++) {
            const a = i - k * gw;
            shadow = (meta[a] & 2) !== 0 && grid[a] !== c;
          }
        }
        if (shadow) out[i] = tone(c);
        else if (!isLit && shaded[i] === 2) out[i] = toned(bright, c, lightTone);
      }
    }
    // The rim light (the light pass): a warm edge of light along the top and front of the upper
    // figure, where the light from the front catches it. Hair takes it too.
    if (light) {
      const rw = Math.max(1, Math.round(res * 0.4));
      const rim = new Map();
      const top = gh * 0.52;
      for (let y = 0; y < top; y++) {
        for (let x = 0; x < gw; x++) {
          const i = y * gw + x;
          const c = grid[i];
          if (c < 0) continue;
          // Only edges that face the light: the front, and the top on the front half.
          let edge = false;
          const front = x > gw * 0.47;
          for (let k = 1; k <= rw && !edge; k++) edge = x + k >= gw || grid[i + k] < 0 || (front && (y - k < 0 || grid[i - k * gw] < 0));
          if (edge) out[i] = toned(rim, c, (col) => rimTone(col, typeof light === 'string' ? light : undefined));
        }
      }
    }
  }

  // Outline: every empty cell within `reach` cells of the silhouette (a disc, so it's round),
  // grown outward from the filled cells and colored after the nearest one.
  const reach = res === 1 ? 1 : crisp ? res : Math.max(1, Math.round(res * 0.67));
  const ring = [];
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      if ((dx || dy) && (res === 1 ? Math.abs(dx) + Math.abs(dy) === 1 : dx * dx + dy * dy <= reach * reach + 0.5)) ring.push([dx, dy, dx * dx + dy * dy]);
    }
  }
  const best = new Float32Array(gw * gh).fill(Infinity);
  const from = new Int32Array(gw * gh);
  // Which way each outline cell faces (for sel-out): its offset from the cell it grew from.
  const faceX = selout ? new Int8Array(gw * gh) : null;
  const faceY = selout ? new Int8Array(gw * gh) : null;
  // Only edge cells (a filled cell with an unfilled cell around it) can be the nearest to an
  // empty one: from any other, the neighbour toward it is nearer still. So the inside is skipped,
  // and the result is the same as growing from every cell.
  const ringX = Int8Array.from(ring, (r) => r[0]);
  const ringY = Int8Array.from(ring, (r) => r[1]);
  const ringD = Float32Array.from(ring, (r) => r[2]);
  const ringN = ring.length;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x;
      if (grid[i] < 0) continue;
      if (y > 0 && y < gh - 1 && x > 0 && x < gw - 1 && grid[i - 1] >= 0 && grid[i + 1] >= 0 && grid[i - gw] >= 0 && grid[i + gw] >= 0 && grid[i - gw - 1] >= 0 && grid[i - gw + 1] >= 0 && grid[i + gw - 1] >= 0 && grid[i + gw + 1] >= 0) continue;
      const id = grid[i];
      for (let r = 0; r < ringN; r++) {
        const tx = x + ringX[r];
        const ty = y + ringY[r];
        if (tx < 0 || ty < 0 || tx >= gw || ty >= gh) continue;
        const t = ty * gw + tx;
        const d = ringD[r];
        if (grid[t] === EMPTY && d < best[t]) {
          best[t] = d;
          from[t] = id;
          if (selout) {
            faceX[t] = ringX[r];
            faceY[t] = ringY[r];
          }
        }
      }
    }
  }
  const ink = soft ? null : idOf(OUTLINE);
  // Crisp outlines are smoothed: the outermost corner cells (a knight's move from the shape) are
  // drawn half transparent, which rounds off stair-steps like hand-antialiased pixel art.
  const softCorner = crisp ? reach * reach + 1 : Infinity;
  const inkFor = new Map();
  for (let t = 0; t < best.length; t++) {
    if (best[t] === Infinity) continue;
    if (ink !== null) {
      out[t] = ink;
      continue;
    }
    const corner = best[t] >= softCorner;
    // Light comes from above and in front (sprites face right): up counts most.
    const facing = selout ? (-faceY[t] * 0.75 + faceX[t] * 0.35) / Math.hypot(faceX[t], faceY[t]) : 0;
    const side = facing > 0.45 ? -1 : facing < -0.3 ? 1 : 0;
    const key = (from[t] * 2 + (corner ? 1 : 0)) * 3 + side + 1;
    let v = inkFor.get(key);
    if (v === undefined) {
      const own = lineOf.get(from[t]);
      const line = own ? (side < 0 ? mix(own, colors[from[t]], 0.35) : own) : outlineFor(colors[from[t]], crisp, side);
      v = idOf(corner ? `${line}80` : line);
      inkFor.set(key, v);
    }
    out[t] = v;
  }
  return { gw, gh, cells: out, colors };
}

// '#rrggbb' or '#rrggbbaa'.
function rgb(c) {
  const n = parseInt(c.slice(1, 7), 16);
  const a = c.length >= 9 ? parseInt(c.slice(7, 9), 16) : 255;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

function bake(raster) {
  const canvas = document.createElement('canvas');
  canvas.width = raster.gw;
  canvas.height = raster.gh;
  canvas.getContext('2d').putImageData(new ImageData(pixelsOf(raster), raster.gw, raster.gh), 0, 0);
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
    // (A few colours kept for each sprite, so a changing tint never piles them up.)
    if (byColor.size > 12) byColor.delete(byColor.keys().next().value);
  }
  return c;
}

// Smooth sprites are big and the hero makes many of them, so the cache forgets the least
// recently used ones past this many, or past this much memory.
const CACHE_MAX = 12000;
// (A busy town's crowd, each person on their loops, needs a few hundred MB: 48 MB for each GB the
// device has, up to 384 MB; where the browser doesn't say, 384 MB on a computer and 160 MB on a
// phone or tablet.)
const CACHE_BYTES = (() => {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  if (nav.deviceMemory) return Math.max(160e6, Math.min(384e6, nav.deviceMemory * 48e6));
  return nav.maxTouchPoints > 0 ? 160e6 : 384e6;
})();
let cacheBytes = 0;
const bytesOf = (s) => s.canvas.width * s.canvas.height * 4;

// A sprite's raster, ready to bake: the build's shapes drawn at the screen's density. Detailed
// sprites (characters, monsters, scenery) are drawn at the screen's own pixel density, so every
// cell is exactly one screen pixel: sharp and even at any window size. `pad` is the margin left
// of, right of and above the w x h box that parts may reach into (wings, tails, smears): the
// sprite keeps its feet and centre where w x h puts them.
export function rasterOf(b, scale = gfx.scale) {
  let { w, h, shapes, palette = {}, res = 1, soft = false, crisp = false, selout = false, pad = PAD, light = false, edge = null } = b;
  if (res > 1) res = Math.max(res, Math.round(scale));
  return { w, h, res, crisp, pad, raster: rasterize(w, h, shapes, res, soft, palette, crisp, selout, pad, light, edge) };
}

// A raster's colours, pixel by pixel (RGBA), so it can be handed from a worker to the page.
export function pixelsOf({ gw, gh, cells, colors }) {
  const data = new Uint8ClampedArray(gw * gh * 4);
  // Written a whole pixel at a time (little-endian: alpha in the top byte).
  const px = new Uint32Array(data.buffer);
  const packed = Uint32Array.from(colors, (c) => {
    const [r, g, b, a] = rgb(c);
    return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  });
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    if (c >= 0) px[i] = packed[c];
  }
  return data;
}

function remember(key, s) {
  cacheBytes += bytesOf(s);
  while (cache.size && (cache.size >= CACHE_MAX || cacheBytes > CACHE_BYTES)) {
    const old = cache.keys().next().value;
    cacheBytes -= bytesOf(cache.get(old));
    cache.delete(old);
  }
  cache.set(key, s);
  return s;
}

// Returns a cached sprite { canvas, white, w, h, res } built by `build()` -> { w, h, shapes, palette, res, soft }.
export function sprite(key, build) {
  if (gfx.zoom !== 1) key = `${key}|z${gfx.zoom}`;
  let s = cache.get(key);
  if (s) {
    cache.delete(key);
    cache.set(key, s);
    return s;
  }
  const t0 = performance.now();
  const { w, h, res, crisp, pad, raster } = rasterOf(build(), gfx.scale * gfx.zoom);
  const made = remember(key, { canvas: bake(raster), w, h, res, crisp, pad, white: null });
  countPaint(key, performance.now() - t0);
  return made;
}

// Every sprite painted (not drawn from the cache), by its kind (the first part of its key): the
// speed check (tools/perf-check.html) and the speed tests read these to catch anything that's
// painted afresh over and over instead of once, the thing that makes the game lag.
export const paintStats = { n: 0, ms: 0, kinds: {} };
function countPaint(key, ms) {
  const bar = key.indexOf('|');
  const kind = bar < 0 ? key : key.slice(0, bar);
  const k = (paintStats.kinds[kind] ??= { n: 0, ms: 0, ex: '' });
  k.n++;
  k.ms += ms;
  k.ex = key.slice(0, 160);
  paintStats.n++;
  paintStats.ms += ms;
}
export function resetPaintStats() {
  paintStats.n = 0;
  paintStats.ms = 0;
  paintStats.kinds = {};
}

// Sprites that can wait a frame (other people, portraits): within one frame, new ones are drawn
// only while the frame's budget lasts; past it, the last one drawn for the same `slot` (that
// character) stands in until a later frame. On a fast computer everyone still updates every
// frame; on a slow one the crowd waits a beat instead of the whole game lagging.
// (1 ms: the crowd's share of a 144 Hz frame's 4 ms drawing budget; past it the worker paints the
// rest a frame or two later, so a field full of hunters never spikes a frame. Was 2.5 ms.)
const BUDGET_MS = 1;
const budget = { frame: 0, at: -1, ms: 0 };
const lastOf = new Map();
export function nextFrame() {
  budget.frame++;
  // Sprites asked for ahead of time go to the worker a few at a time.
  // (No worker, as in the speed tests: they're painted here, counted apart as painted ahead.)
  if (warmQ.length && !workerOf() && globalThis.__paintAheadHere) {
    while (warmQ.length) {
      const [key, job] = warmQ.pop();
      queued.delete(key);
      if (cache.has(key) || job.kind !== 'hero') continue;
      const t0 = performance.now();
      const { w: sw, h, res, crisp, pad, raster } = rasterOf(heroSpecOf(job), gfx.scale * gfx.zoom);
      remember(key, { canvas: bake(raster), w: sw, h, res, crisp, pad, white: null });
      countPaint(`ahead|${key}`, performance.now() - t0);
    }
  }
  const w = warmQ.length ? workerOf() : null;
  while (w && warmQ.length && pending.size < 24) {
    const [key, job] = warmQ.pop();
    queued.delete(key);
    if (cache.has(key) || pending.has(key) || failed.has(key)) continue;
    try {
      w.postMessage({ key, job, scale: gfx.scale });
      pending.set(key, true);
    } catch {
      failed.add(key);
    }
  }
}

// A sprite that will be wanted soon (the rest of a passer-by's walk cycle): painted by the worker
// in the background, so it's ready by the time it's needed. The newest ask is painted first (the
// last one pushed), and the oldest drop off when too many wait.
// (A Mochi race asks for its six racers' whole running cycles at once: room for them all.)
const warmQ = [];
const queued = new Set();
const WARM_MAX = 1200;
// (The speed tests hand in how a hero's job becomes shapes, as the worker does: hero.js can't be
// imported here.)
let heroSpecOf = null;
export function paintAheadWith(fn) {
  heroSpecOf = fn;
}
export function spriteSoon(key, job) {
  if (gfx.zoom !== 1 || cache.has(key) || pending.has(key)) return;
  if (queued.has(key)) return;
  warmQ.push([key, job]);
  queued.add(key);
  if (warmQ.length > WARM_MAX) queued.delete(warmQ.shift()[0]);
}
// `job` (a plain description, as spriteSoon takes): someone seen for the first time once the
// frame's budget is spent is handed to the sprite worker and left out for a frame or two (null),
// rather than painted on the spot and stalling the frame (a crowd pouring onto the screen when
// you move fast).
export function spriteBudgeted(key, build, slot, job = null) {
  if (budget.at !== budget.frame) {
    budget.at = budget.frame;
    budget.ms = 0;
  }
  if (gfx.zoom !== 1) return sprite(key, build);
  const prev = lastOf.get(slot);
  // (gfx.noBudget: the speed check counts every painting that's needed, however fast the computer.)
  if (prev && !cache.has(key) && budget.ms >= BUDGET_MS && !gfx.noBudget) return prev;
  // (Someone already on screen whose new frame isn't painted yet keeps their last one while the
  // worker paints it: a person costs 1-2 ms to paint, so even one a frame spikes it.)
  // (One the worker couldn't paint, `failed`, is painted here instead: never left blank.)
  const worker = !failed.has(key) && workerOf();
  if (prev && job && !cache.has(key) && !gfx.noBudget && worker) {
    spriteSoon(key, job());
    return prev;
  }
  if (!prev && job && !cache.has(key) && budget.ms >= BUDGET_MS && !gfx.noBudget && worker) {
    spriteSoon(key, job());
    return null;
  }
  const t = performance.now();
  const s = sprite(key, build);
  budget.ms += performance.now() - t;
  lastOf.delete(slot);
  lastOf.set(slot, s);
  if (lastOf.size > 400) lastOf.delete(lastOf.keys().next().value);
  return s;
}

// Sprites for people (heroes, the crowd, the townsfolk, NPCs): a sprite already
// drawn comes from the cache; a new one is handed to the sprite worker (`job()` describes it as
// plain data) while the last one drawn for the same `slot` stands in. Only someone seen for the
// first time is drawn on the spot (within the frame's budget), so no one ever pops in blank.
export function spriteAsync(key, build, slot, job) {
  if (gfx.zoom !== 1) return spriteBudgeted(key, build, slot);
  const s = cache.get(key);
  if (s) {
    cache.delete(key);
    cache.set(key, s);
    lastOf.delete(slot);
    lastOf.set(slot, s);
    return s;
  }
  const prev = failed.has(key) ? null : lastOf.get(slot);
  const w = prev ? workerOf() : null;
  if (w && prev) {
    if (!pending.has(key) && pending.size < 24) {
      try {
        w.postMessage({ key, job: job(), scale: gfx.scale });
        pending.set(key, true);
      } catch {
        return spriteBudgeted(key, build, slot);
      }
    }
    return prev;
  }
  return spriteBudgeted(key, build, slot);
}

// Sprites drawn in the background: a worker rasterizes them (`sprite-worker.js`, given `job`, a
// plain description it knows how to build), and until one arrives `spriteLater` returns null so
// the caller draws something it already has. Used for the many in-between poses that make
// motion smooth, which would cost a hitch each if drawn on the spot.
let worker = null;
const pending = new Map();
const failed = new Set();
function workerOf() {
  if (worker === null) {
    worker = false;
    if (typeof Worker !== 'undefined') {
      try {
        worker = new Worker(new URL('./sprite-worker.js', import.meta.url), { type: 'module' });
        worker.onmessage = ({ data: d }) => {
          pending.delete(d.key);
          // (One the worker couldn't draw is drawn on the spot next time: spriteAsync.)
          if (!d.data) failed.add(d.key);
          if (d.scale !== gfx.scale || !d.data || cache.has(d.key)) return;
          const canvas = document.createElement('canvas');
          canvas.width = d.gw;
          canvas.height = d.gh;
          canvas.getContext('2d').putImageData(new ImageData(d.data, d.gw, d.gh), 0, 0);
          remember(d.key, { canvas, w: d.w, h: d.h, res: d.res, crisp: d.crisp, pad: d.pad, white: null });
        };
        worker.onerror = () => {
          worker = false;
        };
      } catch {
        worker = false;
      }
    }
  }
  return worker;
}
export function spriteLater(key, job) {
  const s = cache.get(key);
  if (s) {
    cache.delete(key);
    cache.set(key, s);
    return s;
  }
  const w = workerOf();
  if (w && !pending.has(key) && pending.size < 24) {
    pending.set(key, true);
    w.postMessage({ key, job, scale: gfx.scale });
  }
  return null;
}

// Draws a sprite with its local (0, 0) at screen (x, y). Optionally mirrored or flashed white.
// Smooth sprites (res > 1, not crisp) are drawn filtered at sub-pixel positions; crisp ones stay
// sharp and snap to their own cell grid.
export function blit(ctx, s, x, y, { flip = false, flash = 0, alpha = 1, scale = 1 } = {}) {
  const img = s.canvas;
  const res = s.res ?? 1;
  const w = (img.width / res) * scale;
  const h = (img.height / res) * scale;
  const smooth = res > 1 && !s.crisp;
  const cell = scale / res;
  const grid = (v) => (smooth ? snap(v) : s.crisp ? Math.round(v / cell) * cell : Math.round(v));
  const pad = s.pad ?? PAD;
  const px = grid(x - pad * scale);
  const py = grid(y - pad * scale);
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

// A soft shadow under someone's feet at (x, y): dark in the middle, fading at the edges, and
// tilted to lie along a slope (`slope` is the ground's rise per pixel). `k` scales its strength.
export function footShadow(ctx, x, y, rx, slope = 0, k = 1) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan(slope));
  ctx.scale(1, 0.26);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(58,45,79,${0.3 * k})`);
  g.addColorStop(0.6, `rgba(58,45,79,${0.17 * k})`);
  g.addColorStop(1, 'rgba(58,45,79,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// The slope of a surface (anything with yAt) at x, for tilting shadows.
export const slopeAt = (s, x) => (s?.yAt ? (s.yAt(x + 6) - s.yAt(x - 6)) / 12 : 0);

// How full the sprite cache is (the speed check reads it): sprites kept, and their memory.
export const cacheInfo = () => ({ sprites: cache.size, mb: Math.round(cacheBytes / 1e6), maxSprites: CACHE_MAX, maxMb: CACHE_BYTES / 1e6 });
