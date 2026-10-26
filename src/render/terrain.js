// Terrain: the ground as thick, textured land that follows the map's terrain line (slopes,
// plateaus, and cliff walls), with a grassy (or mossy, sandy, frosted...) lip along the top, cliff
// faces where it drops away, and vines or roots hanging over the edges. Ledges are floating
// islands of the same land, thick in the middle and tapering underneath. Each map theme has its
// own material. Textures are small tiles baked once per theme and laid down as a pattern that
// scrolls with the world.

import { shade, mix, gfx } from './pixel.js';
import { surfacesOf } from '../world/physics.js';

const INK = '#3a2d4f';
const edge = (c) => mix(shade(c, -38), INK, 0.35);
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// What each theme's land is made of. `lip` is the top layer (grass, moss, curb, sand, cloud),
// `body` and `deep` the land below it, `stone` its texture's highlight, `style` which texture,
// `blades` grass blades along the lip, and `drip` what hangs over edges.
export const MATERIALS = {
  meadow: { lip: '#8ee08a', body: '#ebc596', deep: '#d4a270', stone: '#f6dfbd', style: 'cobble', blades: true, drip: 'vine' },
  forest: { lip: '#7fd38f', body: '#bb9068', deep: '#93684a', stone: '#d5b48c', style: 'loam', blades: true, drip: 'root' },
  town: { lip: '#ffffff', body: '#f6d3bd', deep: '#e3ad90', stone: '#fde7d8', style: 'cobble', blades: false, drip: null },
  harbor: { lip: '#e2bf96', body: '#a4a9cf', deep: '#7b80ad', stone: '#c3c8e6', style: 'brick', blades: false, drip: 'weed' },
  crag: { lip: '#ffe0ad', body: '#e2a66c', deep: '#b97a46', stone: '#f6cf9a', style: 'slab', blades: false, drip: null },
  grove: { lip: '#9fe0b0', body: '#8a76c4', deep: '#5e4c9e', stone: '#a897de', style: 'loam', blades: true, drip: 'vine', glow: '#bfe6ff' },
  ruins: { lip: '#d9f0c8', body: '#bfb0e6', deep: '#9182c8', stone: '#ddd3f8', style: 'brick', blades: true, drip: 'vine' },
  cave: { lip: '#a8e8ff', body: '#7563b6', deep: '#4f3f8e', stone: '#9482d6', style: 'rock', blades: false, drip: 'crystal', glow: '#a8e8ff' },
  hollow: { lip: '#a6dca2', body: '#b48a74', deep: '#8a6656', stone: '#cda48c', style: 'loam', blades: true, drip: 'root' },
  sky: { lip: '#ffffff', body: '#f6f8ff', deep: '#d6e0ff', stone: '#ffffff', style: 'cloud', blades: false, drip: null },
};

const TILE = 64;

// ---------- Textures ----------

// Paints one tileable square of a material (shapes that cross an edge are drawn again on the
// other side so the tile wraps seamlessly).
function paintTile(g, m, theme) {
  g.fillStyle = m.body;
  g.fillRect(0, 0, TILE, TILE);
  const wrap = (draw) => {
    for (const dx of [-TILE, 0, TILE]) for (const dy of [-TILE, 0, TILE]) draw(dx, dy);
  };
  const seed = theme.length * 7.3;
  const line = edge(m.body);
  if (m.style === 'cobble') {
    // Rounded stones in staggered rows, each lit on top and shaded below.
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const k = seed + row * 4 + col;
        const w = 12 + hash(k) * 4;
        const h = 9 + hash(k + 1) * 3;
        const x = col * 16 + (row % 2) * 8 + hash(k + 2) * 2;
        const y = row * 16 + 3 + hash(k + 3) * 2;
        wrap((dx, dy) => {
          g.fillStyle = m.deep;
          rounded(g, x + dx, y + dy + 1.5, w, h, 4);
          g.fill();
          g.fillStyle = hash(k + 4) > 0.5 ? m.stone : mix(m.stone, m.body, 0.4);
          rounded(g, x + dx, y + dy, w, h, 4);
          g.fill();
          g.strokeStyle = line;
          g.lineWidth = 0.6;
          g.stroke();
          g.fillStyle = 'rgba(255,255,255,0.45)';
          rounded(g, x + dx + 2, y + dy + 1.2, w * 0.5, 1.6, 0.8);
          g.fill();
        });
      }
    }
  } else if (m.style === 'brick') {
    // Big stone blocks with soft corners, a few cracked or mossy.
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 2; col++) {
        const k = seed + row * 2 + col;
        const x = col * 32 + (row % 2) * 16 + 1;
        const y = row * 16 + 1;
        wrap((dx, dy) => {
          g.fillStyle = m.deep;
          rounded(g, x + dx, y + dy + 1, 30, 14, 3);
          g.fill();
          g.fillStyle = mix(m.stone, m.body, 0.25 + hash(k) * 0.4);
          rounded(g, x + dx, y + dy, 30, 13, 3);
          g.fill();
          g.strokeStyle = line;
          g.lineWidth = 0.6;
          g.stroke();
          g.fillStyle = 'rgba(255,255,255,0.35)';
          g.fillRect(x + dx + 3, y + dy + 1.5, 16, 1.2);
          if (hash(k + 5) > 0.7) {
            g.strokeStyle = m.deep;
            g.lineWidth = 0.8;
            g.beginPath();
            g.moveTo(x + dx + 18, y + dy + 2);
            g.lineTo(x + dx + 15, y + dy + 7);
            g.lineTo(x + dx + 19, y + dy + 11);
            g.stroke();
          }
        });
      }
    }
  } else if (m.style === 'slab') {
    // Big sandstone slabs, stacked a little unevenly: lit tops, shaded bottoms, chips and cracks.
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const k = seed + row * 3 + col;
        const w = 19 + hash(k) * 4;
        const h = 18 + hash(k + 1) * 3;
        const x = col * 22 + (row % 2) * 11 + hash(k + 2) * 2 - 1;
        const y = row * 22 + 1 + hash(k + 3) * 2;
        wrap((dx, dy) => {
          g.fillStyle = m.deep;
          rounded(g, x + dx, y + dy + 2, w, h, 5);
          g.fill();
          g.fillStyle = mix(m.stone, m.body, 0.2 + hash(k + 4) * 0.5);
          rounded(g, x + dx, y + dy, w, h, 5);
          g.fill();
          g.strokeStyle = line;
          g.lineWidth = 0.7;
          g.stroke();
          g.fillStyle = 'rgba(255,248,230,0.55)';
          rounded(g, x + dx + 3, y + dy + 1.5, w - 7, 2.2, 1.1);
          g.fill();
          g.fillStyle = hexA(m.deep, 0.5);
          rounded(g, x + dx + 2, y + dy + h - 4, w - 4, 2.4, 1.2);
          g.fill();
          if (hash(k + 5) > 0.55) {
            g.strokeStyle = m.deep;
            g.lineWidth = 0.8;
            g.beginPath();
            g.moveTo(x + dx + w * 0.6, y + dy + 3);
            g.lineTo(x + dx + w * 0.5, y + dy + h * 0.5);
            g.lineTo(x + dx + w * 0.62, y + dy + h - 3);
            g.stroke();
          }
        });
      }
    }
  } else if (m.style === 'strata') {
    // Layered sandstone: wavy bands, cracks, and flecks of grit.
    for (let band = 0; band < 4; band++) {
      const y0 = band * 16;
      g.fillStyle = band % 2 ? m.deep : mix(m.body, m.stone, 0.35);
      g.beginPath();
      g.moveTo(0, y0 + 10);
      for (let x = 0; x <= TILE; x += 8) g.lineTo(x, y0 + 10 + Math.sin((x / TILE) * Math.PI * 2 + band) * 2);
      g.lineTo(TILE, y0 + 16);
      g.lineTo(0, y0 + 16);
      g.closePath();
      g.globalAlpha = 0.55;
      g.fill();
      g.globalAlpha = 1;
    }
    for (let i = 0; i < 14; i++) {
      const k = seed + i * 3.1;
      wrap((dx, dy) => {
        g.fillStyle = hash(k) > 0.5 ? m.stone : m.deep;
        g.fillRect(hash(k + 1) * TILE + dx, hash(k + 2) * TILE + dy, 1.5, 1.5);
      });
    }
    for (let i = 0; i < 3; i++) {
      const k = seed + i * 9.7;
      const x = hash(k) * TILE;
      const y = hash(k + 1) * TILE;
      wrap((dx, dy) => {
        g.strokeStyle = m.deep;
        g.lineWidth = 0.9;
        g.beginPath();
        g.moveTo(x + dx, y + dy);
        g.lineTo(x + dx + 4, y + dy + 5);
        g.lineTo(x + dx + 2, y + dy + 10);
        g.stroke();
      });
    }
  } else if (m.style === 'rock') {
    // Faceted rock with a lit face on each chunk, and specks of crystal.
    for (let i = 0; i < 7; i++) {
      const k = seed + i * 5.3;
      const x = hash(k) * TILE;
      const y = hash(k + 1) * TILE;
      const r = 8 + hash(k + 2) * 6;
      wrap((dx, dy) => {
        g.fillStyle = m.deep;
        poly(g, [[x + dx - r, y + dy], [x + dx - r * 0.3, y + dy - r * 0.8], [x + dx + r, y + dy - r * 0.4], [x + dx + r * 0.7, y + dy + r * 0.6], [x + dx - r * 0.5, y + dy + r * 0.7]]);
        g.fill();
        g.fillStyle = m.stone;
        poly(g, [[x + dx - r * 0.7, y + dy - 0.5], [x + dx - r * 0.25, y + dy - r * 0.6], [x + dx + r * 0.6, y + dy - r * 0.3], [x + dx, y + dy + 0.5]]);
        g.fill();
      });
    }
    for (let i = 0; i < 5; i++) {
      const k = seed + i * 2.9 + 40;
      wrap((dx, dy) => {
        g.fillStyle = hash(k) > 0.5 ? '#bff0ff' : '#e6c8ff';
        poly(g, [[hash(k + 1) * TILE + dx, hash(k + 2) * TILE + dy], [hash(k + 1) * TILE + dx + 1.5, hash(k + 2) * TILE + dy - 4], [hash(k + 1) * TILE + dx + 3, hash(k + 2) * TILE + dy]]);
        g.fill();
      });
    }
  } else if (m.style === 'cloud') {
    // Soft cloud puffs, lighter on top.
    for (let i = 0; i < 9; i++) {
      const k = seed + i * 3.7;
      const x = hash(k) * TILE;
      const y = hash(k + 1) * TILE;
      const r = 7 + hash(k + 2) * 7;
      wrap((dx, dy) => {
        g.fillStyle = m.deep;
        g.globalAlpha = 0.45;
        g.beginPath();
        g.arc(x + dx, y + dy + 2, r, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(x + dx, y + dy, r * 0.8, 0, Math.PI * 2);
        g.fill();
      });
    }
  } else {
    // Loam: soft dark clumps, pebbles, and thin roots.
    for (let i = 0; i < 10; i++) {
      const k = seed + i * 4.1;
      const x = hash(k) * TILE;
      const y = hash(k + 1) * TILE;
      wrap((dx, dy) => {
        g.fillStyle = m.deep;
        g.globalAlpha = 0.5;
        g.beginPath();
        g.ellipse(x + dx, y + dy, 6 + hash(k + 2) * 6, 3 + hash(k + 3) * 2, 0, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
      });
    }
    for (let i = 0; i < 9; i++) {
      const k = seed + i * 6.7 + 20;
      const x = hash(k) * TILE;
      const y = hash(k + 1) * TILE;
      const r = 1.6 + hash(k + 2) * 2;
      wrap((dx, dy) => {
        g.fillStyle = m.deep;
        g.beginPath();
        g.ellipse(x + dx, y + dy + 0.8, r * 1.3, r, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = m.stone;
        g.beginPath();
        g.ellipse(x + dx, y + dy, r * 1.3, r * 0.9, 0, 0, Math.PI * 2);
        g.fill();
      });
    }
    for (let i = 0; i < 2; i++) {
      const k = seed + i * 11.3 + 60;
      const x = hash(k) * TILE;
      const y = hash(k + 1) * TILE;
      wrap((dx, dy) => {
        g.strokeStyle = m.deep;
        g.lineWidth = 1.1;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(x + dx, y + dy);
        g.bezierCurveTo(x + dx + 8, y + dy - 4, x + dx + 14, y + dy + 5, x + dx + 22, y + dy + 1);
        g.stroke();
      });
    }
    if (m.glow) {
      for (let i = 0; i < 3; i++) {
        const k = seed + i * 13.1 + 80;
        wrap((dx, dy) => {
          g.fillStyle = m.glow;
          g.beginPath();
          g.arc(hash(k) * TILE + dx, hash(k + 1) * TILE + dy, 1.1, 0, Math.PI * 2);
          g.fill();
        });
      }
    }
  }
}

function rounded(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function poly(g, pts) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
}

// A material's texture as a pattern, baked at the screen's pixel density so it stays sharp.
const patterns = new Map();
function patternFor(ctx, theme, m) {
  const res = Math.max(1, Math.round(gfx.scale || 1));
  const key = `${theme}|${res}`;
  let entry = patterns.get(key);
  if (!entry) {
    const c = document.createElement('canvas');
    c.width = TILE * res;
    c.height = TILE * res;
    const g = c.getContext('2d');
    g.scale(res, res);
    paintTile(g, m, theme);
    entry = { canvas: c, res };
    patterns.set(key, entry);
  }
  const p = ctx.createPattern(entry.canvas, 'repeat');
  return { p, res: entry.res };
}

// Fills the current path with the material, anchored to the world so it scrolls with it.
function fillLand(ctx, theme, m, cam) {
  const { p, res } = patternFor(ctx, theme, m);
  p.setTransform(new DOMMatrix().translate(-cam.x % TILE, -cam.y % TILE).scale(1 / res));
  ctx.fillStyle = p;
  ctx.fill();
}

// ---------- The ground ----------

// Screen-space runs of the ground: each piece's points, plus where the walls between them are.
function groundRuns(map, cam) {
  return surfacesOf(map).filter((s) => s.ground).map((s) => s.pts.map(([x, y]) => [x - cam.x, y - cam.y]));
}

export function drawTerrain(ctx, theme, map, cam, width, height, time) {
  const m = MATERIALS[theme] ?? MATERIALS.meadow;
  const runs = groundRuns(map, cam);
  const bottom = height + 40;
  // The land itself: everything under the line.
  ctx.save();
  ctx.beginPath();
  runs.forEach((pts) => {
    ctx.moveTo(pts[0][0], bottom);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.lineTo(pts[pts.length - 1][0], bottom);
  });
  ctx.closePath();
  fillLand(ctx, theme, m, cam);
  // It darkens with depth below the surface.
  const top = Math.min(...runs.flat().map((p) => p[1]));
  ctx.clip();
  const g = ctx.createLinearGradient(0, top + 20, 0, top + 220);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, hexA(m.deep, 0.75));
  ctx.fillStyle = g;
  ctx.fillRect(0, top, width, bottom - top);
  ctx.restore();

  // Cliff faces: where the ground drops at a wall, the high side shows a shaded face.
  for (let i = 1; i < runs.length; i++) {
    const a = runs[i - 1][runs[i - 1].length - 1];
    const b = runs[i][0];
    if (a[0] < -20 || a[0] > width + 20) continue;
    const highLeft = a[1] < b[1];
    const yTop = Math.min(a[1], b[1]);
    const yBot = Math.max(a[1], b[1]);
    cliffFace(ctx, m, a[0], yTop, yBot, highLeft ? -1 : 1, time, i);
  }
  // The lip along the top of every run.
  runs.forEach((pts, ri) => lip(ctx, m, pts, time, ri, width));
}

const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

// The top layer along a line of points: a thick band with a soft scalloped (or bladed) lower edge,
// a bright top, and an outline.
function lip(ctx, m, pts, time, seed, width, depth = 7) {
  const line = edge(m.lip);
  const deep = shade(m.lip, -16);
  // The band.
  ctx.fillStyle = m.lip;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - 1) : ctx.moveTo(x, y - 1)));
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + depth);
  ctx.closePath();
  ctx.fill();
  // The lower edge: scallops (or hanging grass) that follow the slope.
  forAlong(pts, 9, (x, y, k) => {
    if (x < -12 || x > width + 12) return;
    ctx.fillStyle = m.lip;
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    if (m.blades && hash(k + seed * 31) > 0.55) {
      const len = 4 + hash(k + 7) * 4;
      ctx.beginPath();
      ctx.moveTo(x - 3, y + depth - 1);
      ctx.lineTo(x, y + depth + len);
      ctx.lineTo(x + 3, y + depth - 1);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y + depth - 1, 4, 0, Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  });
  // A darker underside line inside the band and a bright top.
  strokeAlong(ctx, pts, depth - 2.5, deep, 1.4);
  strokeAlong(ctx, pts, 0.6, shade(m.lip, 18), 1.6);
  strokeAlong(ctx, pts, -1.5, line, 1);
  // Grass blades standing up along the top.
  if (m.blades) {
    ctx.strokeStyle = shade(m.lip, -8);
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    forAlong(pts, 6, (x, y, k) => {
      if (x < -6 || x > width + 6 || hash(k * 1.7 + seed) < 0.5) return;
      const sway = Math.sin(time * 2 + x * 0.05) * 0.8;
      const h = 2.5 + hash(k + 3) * 3;
      ctx.beginPath();
      ctx.moveTo(x, y - 1);
      ctx.lineTo(x + sway - 1, y - 1 - h);
      ctx.moveTo(x + 1.5, y - 1);
      ctx.lineTo(x + 2 + sway, y - 1 - h * 0.7);
      ctx.stroke();
    });
    ctx.lineCap = 'butt';
  }
}

// Calls fn(x, y, k) every `step` pixels along a line of points.
function forAlong(pts, step, fn) {
  let k = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.floor(len / step));
    for (let j = 0; j < n; j++) {
      const u = (j + 0.5) / n;
      fn(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, k++);
    }
  }
}

function strokeAlong(ctx, pts, dy, color, w) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + dy) : ctx.moveTo(x, y + dy)));
  ctx.stroke();
}

// The exposed face of a cliff at x, from its top down to the lower ground, on the `side` (-1
// left, 1 right) that drops away: shaded rock, a rounded lip over the corner, and vines.
function cliffFace(ctx, m, x, yTop, yBot, side, time, seed) {
  const line = edge(m.body);
  const face = shade(m.body, -14);
  const w = 8;
  const fx = side < 0 ? x - w : x;
  // The face strip, darker at the bottom.
  const g = ctx.createLinearGradient(0, yTop, 0, yBot);
  g.addColorStop(0, face);
  g.addColorStop(1, m.deep);
  ctx.fillStyle = g;
  ctx.fillRect(fx, yTop + 4, w, yBot - yTop - 4);
  // Vertical cracks.
  ctx.strokeStyle = shade(m.deep, -8);
  ctx.lineWidth = 1;
  for (let y = yTop + 12; y < yBot - 6; y += 14) {
    const k = hash(seed * 7 + y);
    if (k < 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(fx + 2 + k * 4, y);
    ctx.lineTo(fx + 3 + k * 3, y + 6);
    ctx.stroke();
  }
  // The outline down the open side.
  ctx.strokeStyle = line;
  ctx.beginPath();
  ctx.moveTo(x + 0.5 * side, yTop + 3);
  ctx.lineTo(x + 0.5 * side, yBot);
  ctx.stroke();
  // The lip curls over the corner.
  ctx.fillStyle = m.lip;
  ctx.strokeStyle = edge(m.lip);
  ctx.beginPath();
  ctx.ellipse(x + side * 1, yTop + 3, 5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Things hanging down the face.
  drip(ctx, m, x + side * 2, yTop + 7, Math.min(46, (yBot - yTop) * 0.6), time, seed);
}

// Vines, roots, seaweed, or crystals hanging from an edge at (x, y).
function drip(ctx, m, x, y, maxLen, time, seed) {
  if (!m.drip) return;
  const k = hash(seed * 3.3 + x * 0.01);
  const len = Math.max(6, maxLen * (0.45 + k * 0.55));
  const sway = Math.sin(time * 1.4 + seed + x * 0.02) * 1.8;
  ctx.lineCap = 'round';
  if (m.drip === 'crystal') {
    ctx.fillStyle = k > 0.5 ? '#bff0ff' : '#e6c8ff';
    ctx.strokeStyle = edge('#a8e8ff');
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 2);
    ctx.lineTo(x, y + Math.min(len, 14));
    ctx.lineTo(x + 3, y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    const color = m.drip === 'root' ? shade(m.deep, -10) : m.drip === 'weed' ? '#5fae8a' : '#5fb878';
    ctx.strokeStyle = color;
    ctx.lineWidth = m.drip === 'root' ? 2.2 : 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + sway, y + len * 0.6, x + sway * 1.6, y + len);
    ctx.stroke();
    if (m.drip === 'vine') {
      ctx.fillStyle = '#8fdc9a';
      for (let j = 1; j <= 3; j++) {
        const u = j / 3.4;
        ctx.beginPath();
        ctx.ellipse(x + sway * u * 1.4 + (j % 2 ? 2 : -2), y + len * u, 2, 1.2, j % 2 ? 0.5 : -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (k > 0.75) {
        ctx.fillStyle = '#ff9ec0';
        ctx.beginPath();
        ctx.arc(x + sway * 1.6, y + len + 1.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.lineCap = 'butt';
}

// ---------- Floating islands (the ledges) ----------

// A ledge drawn as a chunk of floating land: flat top, thick in the middle, tapering to a
// rounded point underneath, with the lip on top and things dangling below.
export function drawIsland(ctx, theme, p, cam, time, pi, groundY) {
  const m = MATERIALS[theme] ?? MATERIALS.meadow;
  const x = p.x - cam.x;
  const y = p.y - cam.y;
  const w = p.w;
  const d = p.thick ?? Math.min(48, 22 + w * 0.1);
  // A soft shadow on the ground far below.
  if (groundY != null) {
    const gy = groundY - cam.y;
    const far = Math.min(1, (gy - y) / 220);
    ctx.fillStyle = `rgba(58,45,79,${0.12 * (1 - far * 0.6)})`;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, gy + 1, w * 0.42, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  island(ctx, x, y, w, d, pi);
  fillLand(ctx, theme, m, cam);
  ctx.clip();
  const g = ctx.createLinearGradient(0, y + 4, 0, y + d);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, hexA(m.deep, m.style === 'cloud' ? 0.4 : 0.85));
  ctx.fillStyle = g;
  ctx.fillRect(x - 2, y, w + 4, d + 4);
  ctx.restore();
  island(ctx, x, y, w, d, pi);
  ctx.strokeStyle = edge(m.body);
  ctx.lineWidth = 1;
  ctx.stroke();
  // Hanging things under the island.
  for (let dx = 12; dx < w - 10; dx += 22) {
    const k = hash(pi * 13.1 + dx);
    if (k < 0.45) continue;
    const u = dx / w;
    const under = y + d * (1 - Math.abs(u - 0.5) * 1.7) - 2;
    drip(ctx, m, x + dx, Math.max(y + 6, under), 18, time, pi * 5 + dx);
  }
  lip(ctx, m, [[x + 2, y], [x + w - 2, y]], time, pi + 50, Infinity, 6);
  // Rounded caps at both ends of the lip.
  ctx.fillStyle = m.lip;
  ctx.strokeStyle = edge(m.lip);
  for (const ex of [x + 3, x + w - 3]) {
    ctx.beginPath();
    ctx.ellipse(ex, y + 2.5, 4, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function island(ctx, x, y, w, d, seed) {
  const lumpy = (u) => 1 + (hash(seed * 3 + u * 10) - 0.5) * 0.18;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.quadraticCurveTo(x + w + 1, y + d * 0.45, x + w * 0.82, y + d * 0.7 * lumpy(1));
  ctx.quadraticCurveTo(x + w * 0.62, y + d * 0.95 * lumpy(2), x + w * 0.5, y + d);
  ctx.quadraticCurveTo(x + w * 0.38, y + d * 0.95 * lumpy(3), x + w * 0.18, y + d * 0.7 * lumpy(4));
  ctx.quadraticCurveTo(x - 1, y + d * 0.45, x, y);
  ctx.closePath();
}

// ---------- Ladders ----------

export function drawLadder(ctx, r, cam) {
  const x = r.x - cam.x;
  const top = r.top - cam.y;
  const bottom = r.bottom - cam.y;
  const wood = '#d9a86c';
  const line = edge(wood);
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  for (let y = top + 6; y < bottom - 2; y += 8) {
    ctx.fillStyle = shade(wood, 8);
    ctx.fillRect(x - 6, y, 12, 2.4);
    ctx.strokeRect(x - 6 + 0.5, y + 0.5, 11, 1.6);
  }
  for (const sx of [-7, 5]) {
    ctx.fillStyle = wood;
    ctx.fillRect(x + sx, top - 4, 2.5, bottom - top + 4);
    ctx.strokeRect(x + sx - 0.25, top - 4, 3, bottom - top + 4);
  }
}
