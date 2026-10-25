// Pixel-art sprites, generated at runtime from simple shapes.
// Each sprite is rasterized onto a small grid, gets a 1px dark outline around its silhouette,
// and is cached as a tiny canvas. It is drawn with nearest-neighbour scaling so it stays crisp.

import { SHEETS, ready, drawTile } from './assets.js';

const OUTLINE = '#2d2846';
const PAD = 1; // room for the outline around the grid edge
const cache = new Map();

// Lightens (amount > 0) or darkens (amount < 0) a hex color.
export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const adj = (v) => Math.max(0, Math.min(255, v + Math.round((amount / 100) * 255)));
  const parts = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(adj);
  return `#${parts.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const R = (x, y, w, h, c) => ({ t: 'r', x, y, w, h, c });
const E = (x, y, rx, ry, c) => ({ t: 'e', x, y, rx, ry, c });

// Fills shapes into a grid of letters, then outlines the silhouette.
// Shape coordinates are local to the sprite; the grid adds PAD cells on every side.
function rasterize(w, h, shapes) {
  const gw = w + PAD * 2;
  const gh = h + PAD * 2;
  const grid = Array.from({ length: gh }, () => Array(gw).fill('.'));
  const put = (x, y, c) => {
    const gx = x + PAD;
    const gy = y + PAD;
    if (gx >= 0 && gy >= 0 && gx < gw && gy < gh) grid[gy][gx] = c;
  };
  for (const s of shapes) {
    if (s.t === 'r') {
      for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) put(x, y, s.c);
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
  // Any empty cell touching the silhouette becomes outline.
  const edge = [];
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      if (grid[y][x] !== '.') continue;
      const touches = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const row = grid[y + dy];
        return row && row[x + dx] && row[x + dx] !== '.';
      });
      if (touches) edge.push([x, y]);
    }
  }
  for (const [x, y] of edge) grid[y][x] = 'o';
  return grid;
}

function bake(grid, palette) {
  const h = grid.length;
  const w = grid[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = grid[y][x];
      if (c === '.') continue;
      g.fillStyle = palette[c] ?? '#ff00ff';
      g.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

function cached(key, build) {
  let v = cache.get(key);
  if (!v) {
    v = build();
    cache.set(key, v);
  }
  return v;
}

// ---------- Character ----------

export const CHAR_W = 28;
export const CHAR_H = 48;

function paletteFor(a) {
  return {
    o: OUTLINE,
    h: a.hairColor,
    k: shade(a.hairColor, -25),
    l: shade(a.hairColor, 35),
    s: a.skinTone,
    e: a.eyeColor,
    w: '#ffffff',
    m: '#6b3a52',
    p: '#ff9fb8',
    d: a.outfitColor,
    D: shade(a.outfitColor, -20),
    c: '#c99a6b',
    C: '#a87a52',
    r: '#e0344f',
    b: '#fffaf0',
    B: '#d8c9ae',
    a: a.accent,
  };
}

function eyeShapes(style, x) {
  if (style === 'sleepy') return [R(x, 20, 3, 1, 'm')];
  return [
    R(x, 17, 3, 1, 'm'), // lash line
    R(x, 18, 3, 4, 'e'),
    R(x, 18, 1, 2, 'w'), // shine
    R(x + 2, 21, 1, 1, 'w'),
  ];
}

// Legs step by one cell when `step` is 1; the dress and cardigan stay put.
function characterShapes(a, step) {
  const wavy = a.hairStyle === 'wavy';
  const lo = step ? -1 : 0;
  const ro = step ? 1 : 0;
  return [
    // Legs and shoes sit under the dress.
    R(10 + lo, 40, 3, 5, 's'),
    R(15 + ro, 40, 3, 5, 's'),
    R(8 + lo, 45, 6, 3, 'b'),
    R(14 + ro, 45, 6, 3, 'b'),
    R(8 + lo, 47, 6, 1, 'B'),
    R(14 + ro, 47, 6, 1, 'B'),
    // Back hair, with a shaded lower layer for volume.
    R(4, 9, 20, wavy ? 24 : 18, 'h'),
    R(4, wavy ? 25 : 19, 20, wavy ? 9 : 6, 'k'),
    // Wavy style: locks fall past the shoulders.
    ...(wavy
      ? [R(2, 18, 3, 17, 'h'), R(23, 18, 3, 17, 'h'), R(2, 31, 2, 3, 'k'), R(24, 31, 2, 3, 'k')]
      : []),
    // Sleeves, dress, cardigan, belt in the class color.
    R(5, 28, 3, 9, 'c'),
    R(22, 28, 3, 9, 'c'),
    R(7, 34, 14, 7, 'D'),
    R(8, 34, 12, 6, 'd'),
    R(8, 28, 12, 11, 'c'),
    R(13, 28, 2, 11, 'C'),
    R(8, 37, 12, 1, 'a'),
    // Head with bangs and a highlight on the hair.
    E(14, 18, 8, 9, 's'),
    R(6, 9, 16, 4, 'h'),
    R(9, 10, 4, 1, 'l'),
    R(16, 10, 3, 1, 'l'),
    ...eyeShapes(a.eyeStyle, 9),
    ...eyeShapes(a.eyeStyle, 16),
    R(8, 24, 2, 1, 'p'),
    R(18, 24, 2, 1, 'p'),
    R(13, 26, 2, 1, 'm'),
    // Little red earrings.
    R(5, 24, 1, 3, 'r'),
    R(22, 24, 1, 3, 'r'),
  ];
}

function characterSprite(a, step) {
  return cached(`char|${step}|${JSON.stringify(a)}`, () =>
    bake(rasterize(CHAR_W, CHAR_H, characterShapes(a, step)), paletteFor(a))
  );
}

// ---------- Mobs and NPCs ----------

const MOB_ART = {
  snail: {
    shapes: () => [
      R(0, 14, 34, 10, 'b'),
      R(0, 21, 34, 3, 'B'),
      E(22, 11, 9, 9, 's'),
      R(19, 9, 6, 1, 'v'),
      R(19, 9, 1, 5, 'v'),
      R(20, 12, 4, 1, 'v'),
      R(3, 5, 2, 10, 'b'),
      E(4, 4, 2.5, 2.5, 'w'),
      R(4, 4, 1, 1, 'k'),
    ],
    palette: { b: '#ffe9a8', B: '#f0cf80', s: '#ff9e6b', v: '#ffd0a8', w: '#ffffff', k: OUTLINE },
  },
  mushroom: {
    shapes: () => [
      R(9, 20, 14, 16, 'b'),
      R(9, 30, 14, 6, 'B'),
      E(16, 15, 15, 13, 's'),
      E(9, 10, 3, 3, 'w'),
      E(21, 8, 3, 2, 'w'),
      E(26, 16, 2, 2, 'w'),
      R(11, 24, 3, 4, 'k'),
      R(18, 24, 3, 4, 'k'),
    ],
    palette: { b: '#fff1dc', B: '#e8d0b0', s: '#ff7a59', w: '#ffffff', k: OUTLINE },
  },
  wolf: {
    shapes: () => [
      R(10, 12, 30, 16, 'g'),
      R(10, 24, 30, 4, 'G'),
      R(2, 8, 18, 16, 'g'),
      R(3, 3, 4, 7, 'g'),
      R(12, 3, 4, 7, 'g'),
      R(0, 14, 4, 5, 'G'),
      R(38, 12, 6, 4, 'g'),
      R(42, 9, 4, 5, 'g'),
      R(12, 28, 4, 6, 'G'),
      R(22, 28, 4, 6, 'G'),
      R(32, 28, 4, 6, 'G'),
      R(6, 14, 3, 3, 'y'),
      R(7, 15, 1, 1, 'k'),
    ],
    palette: { g: '#8d8fa6', G: '#6f7089', y: '#ffd34d', k: OUTLINE },
  },
  golem: {
    shapes: () => [
      E(30, 36, 28, 27, 'r'),
      E(30, 13, 20, 8, 'm'),
      R(19, 31, 6, 6, 'k'),
      R(37, 31, 6, 6, 'k'),
      R(20, 32, 1, 1, 'w'),
      R(38, 32, 1, 1, 'w'),
      R(26, 44, 8, 2, 'k'),
      R(12, 40, 1, 6, 'D'),
      R(46, 38, 1, 7, 'D'),
    ],
    palette: { r: '#b49872', m: '#7fb069', k: OUTLINE, w: '#ffffff', D: '#8a7050' },
  },
  pig: {
    shapes: () => [
      R(8, 22, 3, 4, 'q'),
      R(18, 22, 3, 4, 'q'),
      E(14, 15, 12, 9, 'p'),
      E(8, 9, 3, 3, 'p'),
      R(22, 13, 5, 4, 'n'),
      R(19, 11, 2, 2, 'k'),
    ],
    palette: { p: '#ffb3c6', n: '#ff8fab', q: '#f08aa5', k: OUTLINE },
  },
  skeleton: {
    shapes: () => [
      R(10, 34, 3, 14, 's'),
      R(17, 34, 3, 14, 's'),
      R(10, 31, 10, 3, 's'),
      R(6, 19, 3, 12, 's'),
      R(21, 19, 3, 12, 's'),
      R(14, 17, 2, 14, 's'),
      R(9, 19, 12, 1, 's'),
      R(9, 23, 12, 1, 's'),
      R(9, 27, 12, 1, 's'),
      E(15, 9, 7, 7, 's'),
      R(11, 15, 8, 2, 's'),
      R(11, 8, 3, 3, 'k'),
      R(18, 8, 3, 3, 'k'),
    ],
    palette: { s: '#e9e4d4', k: OUTLINE },
  },
};

const MOB_SIZE = { snail: [34, 24], mushroom: [32, 36], wolf: [48, 34], golem: [60, 64], pig: [30, 26], skeleton: [30, 50] };

function mobSprite(typeId) {
  return cached(`mob|${typeId}`, () => {
    const [w, h] = MOB_SIZE[typeId];
    const art = MOB_ART[typeId];
    return bake(rasterize(w, h, art.shapes()), { o: OUTLINE, ...art.palette });
  });
}

const NPC_W = 24;
const NPC_H = 40;

function npcSprite(color) {
  return cached(`npc|${color}`, () => {
    const shapes = [
      R(6, 18, 12, 22, 'c'),
      E(12, 11, 7, 7, 's'),
      R(4, 3, 16, 4, 'c'),
      R(9, 11, 2, 2, 'k'),
      R(14, 11, 2, 2, 'k'),
      R(8, 38, 3, 2, 'k'),
      R(13, 38, 3, 2, 'k'),
    ];
    return bake(rasterize(NPC_W, NPC_H, shapes), { o: OUTLINE, c: color, s: '#ffe2c7', k: OUTLINE });
  });
}

// ---------- Drawing ----------

function blit(ctx, sprite, x, y, { flip = false, scale = 1 } = {}) {
  const w = sprite.width * scale;
  const h = sprite.height * scale;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(Math.round(x) + w - PAD * scale, Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, 0, 0, w, h);
  } else {
    ctx.drawImage(sprite, Math.round(x - PAD * scale), Math.round(y - PAD * scale), w, h);
  }
  ctx.restore();
}

// Draws the player. `p` is the physics body; sx is its screen-space x.
export function drawCharacter(ctx, p, sx, appearance, accent, time) {
  const walking = Math.abs(p.vx) > 1 && p.onGround;
  const step = walking ? Math.floor(time * 8) % 2 : 0;
  const idleBob = !walking && Math.sin(time * 3) > 0.6 ? -1 : 0;
  const a = { ...appearance, accent };
  blit(ctx, characterSprite(a, step), sx, p.y + idleBob, { flip: p.dir < 0 });
}

// Preview for the creator: same sprite, scaled up with crisp pixels.
export function drawCharacterPreview(ctx, appearance, accent, time, x, y, scale) {
  const a = { ...appearance, accent };
  const bob = Math.sin(time * 3) > 0.6 ? -1 : 0;
  blit(ctx, characterSprite(a, 0), x, y + bob * scale, { scale });
}

export function drawMob(ctx, mob, sx, time) {
  // Skeletons use the CC0 Tiny Dungeon frame once it has loaded; the drawn version is the fallback.
  if (mob.typeId === 'skeleton' && ready(SHEETS.tiny)) {
    const bob = Math.round(Math.sin(time * 4) * 0.5);
    drawTile(ctx, SHEETS.tiny, 1, 10, sx, mob.y + bob, { scale: 2, flip: mob.dir < 0 });
    return;
  }
  const bob = mob.typeId === 'golem' ? Math.round(Math.sin(time * 2)) : 0;
  // Wolves face left by default, so they flip when moving right.
  blit(ctx, mobSprite(mob.typeId), sx, mob.y + bob, { flip: mob.typeId === 'wolf' && mob.dir > 0 });
}

export function drawNpc(ctx, npc, sx, color, groundY) {
  blit(ctx, npcSprite(color), sx - NPC_W / 2, groundY - NPC_H);
}
