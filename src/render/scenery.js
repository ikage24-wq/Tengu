// Map scenery in the same outlined, flat-colored chibi style as the characters: themed skies with a
// smiling sun and cloud friends, parallax buildings and trees, ground and ledges with soft outlines,
// little props (many of them with faces), and ambient life — critters, falling petals, fireflies,
// chimney smoke, bobbing boats. World-to-screen is (wx - cam.x, wy - cam.y). Layouts are seeded so
// nothing jitters as you move; animation comes only from `time`.

import { R, E, T, F, sprite, blit, shade, mix, snap, tinted, gfx } from './pixel.js';
import { groundAt, surfacesOf } from '../world/physics.js';
import { drawTerrain, drawIsland, drawLadder, wind, windAt, windTravel } from './terrain.js';
import { drawLandmark, LANDMARKS } from './landmarks.js';
import { MAPS } from '../data/maps.js';

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const pick = (list, seed) => list[Math.floor(seed * list.length) % list.length];

export const THEMES = {
  town: {
    sky: ['#ffc6e6', '#e2d2ff', '#fff4fb'], sun: '#fff6c9', far: '#ead9ff', mid: '#f3e6ff', midTrim: '#c9b6ff',
    ground: '#f6d3bd', groundDeep: '#e9b99d', trim: '#ffffff', ledge: '#fff0f6', ledgeTrim: '#ffffff', ledgeShade: '#f0c3d6',
    skyline: 'houses', props: ['lamp', 'flower', 'bench', 'tulip', 'flower', 'bush'],
    critters: ['bird', 'butterfly'], drift: 'petal', face: 'sun',
  },
  meadow: {
    sky: ['#8fdcff', '#c9efff', '#fff6dc'], sun: '#fffbe0', far: '#c4efcf', mid: '#a8e2b8', midTrim: '#7fd19a',
    ground: '#ecc595', groundDeep: '#d9ab79', trim: '#86df86', ledge: '#f0cf9e', ledgeTrim: '#8fe39a', ledgeShade: '#d8b07e',
    skyline: 'hills', props: ['flower', 'tuft', 'flower', 'bush', 'tulip', 'tuft', 'rock'],
    critters: ['butterfly', 'bird', 'butterfly'], drift: 'petal', face: 'sun', rainbow: 0.28,
  },
  // The thieves' harbor, by moonlight: string lights, lit lamps, and alley cats on the crates.
  harbor: {
    sky: ['#4a3f86', '#9a72c8', '#ffb8c8'], sun: '#ffe6f6', far: '#8c94e6', mid: '#ffffff', midTrim: '#8fd3ff',
    ground: '#d9b08a', groundDeep: '#c4966c', trim: '#f6e2c8', ledge: '#d9b08a', ledgeTrim: '#f6e2c8', ledgeShade: '#b08060',
    skyline: 'sea', props: ['lamp', 'crate', 'cat', 'barrel', 'lamp'],
    critters: ['gull', 'firefly'], drift: null, face: 'moon', stars: true,
  },
  // The warriors' home: warm sandstone mesas, tents, forges, banners, and training dummies.
  crag: {
    sky: ['#ffab8a', '#ffd3a1', '#fff1d6'], sun: '#fff1c9', far: '#f2b98c', mid: '#e8a86b', midTrim: '#c97f4f',
    ground: '#f2c48d', groundDeep: '#dfa56c', trim: '#ffe2b8', ledge: '#dca06e', ledgeTrim: '#f6cf9a', ledgeShade: '#b5784a',
    skyline: 'mesas', props: ['torch', 'rock', 'cactus', 'barrel', 'dummy'],
    critters: ['bird', 'gull'], drift: 'ember', face: 'sun',
  },
  // The mages' home: a starry night forest with glowing treehouses and floating lanterns.
  grove: {
    sky: ['#2f2c6e', '#6a52b4', '#c4a6f2'], sun: '#e6dcff', far: '#5a4aa0', mid: '#7a62c4', midTrim: '#9f8ae0',
    ground: '#8f7cc8', groundDeep: '#7a68b8', trim: '#9fe0b0', ledge: '#b08860', ledgeTrim: '#9fe0b0', ledgeShade: '#8a6a4a',
    skyline: 'bigtrees', props: ['lantern', 'glowshroom', 'flower', 'glowshroom'],
    critters: ['firefly', 'butterfly'], drift: 'sparkle', face: 'moon', stars: true,
  },
  forest: {
    sky: ['#b8f0d0', '#e0f8e8', '#fff8e0'], sun: '#fffde0', far: '#9fdcb4', mid: '#7cc794', midTrim: '#5aa878',
    ground: '#c9a27a', groundDeep: '#b08860', trim: '#7ed38f', ledge: '#d9b88f', ledgeTrim: '#8fe39a', ledgeShade: '#b8946b',
    skyline: 'trees', props: ['mushroom', 'tuft', 'flower', 'bush', 'tuft', 'rock'],
    critters: ['firefly', 'butterfly'], drift: 'leaf', face: 'sun',
  },
  ruins: {
    sky: ['#7b6be6', '#c39cff', '#ffc2e0'], sun: '#ffe6ff', far: '#9d8ae8', mid: '#b8a6f0', midTrim: '#8f7cd0',
    ground: '#c3b4e8', groundDeep: '#a898d6', trim: '#e6dcff', ledge: '#d6cbf5', ledgeTrim: '#f3edff', ledgeShade: '#ad9fd9',
    skyline: 'columns', props: ['candle', 'flower', 'column', 'tuft'],
    critters: ['firefly'], drift: 'mote', face: 'moon', stars: true,
  },
  cave: {
    sky: ['#3f3380', '#5c47a6', '#7c62c2'], sun: '#c9b6ff', far: '#53439a', mid: '#6c56b4', midTrim: '#9f8ae0',
    ground: '#7a68b8', groundDeep: '#62509e', trim: '#a8e8ff', ledge: '#8f7cd0', ledgeTrim: '#b8f0ff', ledgeShade: '#6b58a8',
    skyline: 'crystals', props: ['crystal', 'rock', 'glow'],
    critters: ['firefly'], drift: 'sparkle', face: null, stars: true,
  },
  // Rootwood Hollow: a cozy den under a giant old tree, lit by glowing mushrooms and lanterns.
  hollow: {
    sky: ['#4a3159', '#7a5480', '#b98b98'], sun: '#ffd6a0', far: '#5f4268', mid: '#8a6274', midTrim: '#b88ea0',
    ground: '#b98e78', groundDeep: '#a27a68', trim: '#a6dca2', ledge: '#b48a78', ledgeTrim: '#a6dca2', ledgeShade: '#8f6a66',
    skyline: 'roots', props: ['glowshroom', 'rootcurl', 'moss', 'hlantern', 'pebble', 'glowshroom', 'moss'],
    shrooms: ['#7fe6d6', '#ffb0d0', '#ffd68a'], ledgeProp: 'glowshroom',
    critters: ['firefly'], drift: 'spore', face: null,
  },
  sky: {
    sky: ['#ffc6e8', '#cddbff', '#eef8ff'], sun: '#fffbe6', far: '#ffffff', mid: '#f3f8ff', midTrim: '#d6e6ff',
    ground: '#ffffff', groundDeep: '#e6ecff', trim: '#fff0fa', ledge: '#ffffff', ledgeTrim: '#ffe6f3', ledgeShade: '#dce8ff',
    skyline: 'islands', props: ['flower', 'cloudpuff', 'tulip'],
    critters: ['butterfly', 'gull'], drift: 'sparkle', face: 'sun', rainbow: 0.5,
  },
};

// ---------- Sprite helpers ----------

const INK = '#3a2d4f';
const BLUSH = '#ff9fb8';

// Scenery sprites share the characters' look: crisp soft outlines tinted from each part.
export function art(key, w, h, build) {
  return sprite(`scn|${key}`, () => ({ w, h, shapes: build().filter(Boolean), res: 2, soft: 'cel', crisp: true }));
}
// While a backdrop layer draws, `veil` washes its sprites toward the sky's color (outlines and
// all), so distant things lose contrast and sink into the air.
let veil = null;
// Draws a sprite with its bottom center at (x, y).
export function place(ctx, s, x, y, opts) {
  const px = snap(x - s.w / 2);
  const py = snap(y - s.h);
  blit(ctx, veil ? { ...s, canvas: veiled(s, veil.color, veil.k) } : s, px, py, opts);
}

// A sprite already washed toward a color, made once and kept with the sprite.
const veils = new WeakMap();
function veiled(s, color, k) {
  if (!veils.has(s.canvas)) veils.set(s.canvas, new Map());
  const byKey = veils.get(s.canvas);
  const key = `${color}|${k}`;
  let c = byKey.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = s.canvas.width;
    c.height = s.canvas.height;
    const g = c.getContext('2d');
    g.drawImage(s.canvas, 0, 0);
    g.globalAlpha = k;
    g.drawImage(tinted(s, color), 0, 0);
    byKey.set(key, c);
  }
  return c;
}

function arc(cx, cy, rx, ry, a0, a1, th, c) {
  const outer = [];
  const inner = [];
  for (let i = 0; i <= 6; i++) {
    const a = ((a0 + ((a1 - a0) * i) / 6) * Math.PI) / 180;
    outer.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    inner.push([cx + (rx - th) * Math.cos(a), cy + (ry - th) * Math.sin(a)]);
  }
  return F(T([...outer, ...inner.reverse()], c));
}

// A tiny cute face: dot eyes (or closed arcs when sleeping or blinking), blush, and a small smile.
export function face(cx, cy, gap, mood = 'open', mouth = 'smile', k = 1) {
  const out = [];
  const th = 0.4 * Math.max(1, k * 0.8);
  for (const s of [-1, 1]) {
    const ex = cx + s * gap;
    if (mood === 'open') out.push(F(E(ex, cy, 0.6 * k, 0.8 * k, INK)), F(E(ex - 0.2 * k, cy - 0.3 * k, 0.22 * k, 0.22 * k, '#ffffff')));
    else if (mood === 'happy') out.push(arc(ex, cy + 0.4 * k, 0.8 * k, 0.7 * k, 200, 340, th, INK));
    else out.push(arc(ex, cy - 0.3 * k, 0.8 * k, 0.6 * k, 20, 160, th, INK));
    out.push(F(E(ex + s * k, cy + 1.2 * k, 0.7 * k, 0.35 * k, BLUSH)));
  }
  if (mouth === 'smile') out.push(arc(cx, cy + 0.6 * k, 0.7 * k, 0.7 * k, 30, 150, th, INK));
  else if (mouth === 'o') out.push(F(E(cx, cy + 1.3 * k, 0.4 * k, 0.45 * k, INK)));
  return out;
}

// A blink every few seconds, offset per seed.
const blinking = (time, seed) => ((time * 0.35 + seed * 7.3) % 1) < 0.045;

// ---------- Props (anchored at their bottom center) ----------

const FLOWER_COLORS = ['#ff9ec0', '#ffe36b', '#c9a6ff', '#ffffff', '#8fd3ff', '#ffb38a'];
const STEM = '#6cc070';

function flowerArt(color, frame) {
  const dx = [-0.7, 0, 0.7, 0][frame];
  return art(`flower|${color}|${frame}`, 10, 16, () => {
    const cx = 5 + dx;
    const out = [T([[4.6, 16], [5.4, 16], [cx + 0.4, 8], [cx - 0.4, 8]], STEM), E(3.2, 12.6, 1.6, 0.9, STEM), E(6.8, 11.6, 1.6, 0.9, STEM)];
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
      out.push(E(cx + Math.cos(a) * 2, 6 + Math.sin(a) * 2, 1.6, 1.6, color));
    }
    out.push(F(E(cx, 6, 1.1, 1.1, color === '#ffe36b' ? '#ff9f5a' : '#ffe36b')));
    return out;
  });
}

function tulipArt(color, frame) {
  const dx = [-0.6, 0, 0.6, 0][frame];
  return art(`tulip|${color}|${frame}`, 10, 16, () => {
    const cx = 5 + dx;
    return [T([[4.6, 16], [5.4, 16], [cx + 0.4, 8], [cx - 0.4, 8]], STEM), T([[5, 16], [1.6, 10], [4.4, 13]], STEM),
      T([[cx - 2.6, 4], [cx - 1.2, 5.4], [cx, 3.6], [cx + 1.2, 5.4], [cx + 2.6, 4], [cx + 2.2, 8.6], [cx - 2.2, 8.6]], color),
      F(E(cx - 1, 6, 0.5, 1, shade(color, 18)))];
  });
}

function tuftArt(color, frame) {
  const dx = [-0.8, 0, 0.8, 0][frame];
  return art(`tuft|${color}|${frame}`, 12, 8, () => [
    T([[2, 8], [4.6, 8], [1.6 + dx, 2]], color), T([[4.4, 8], [7.6, 8], [6 + dx, 0.4]], color), T([[7.4, 8], [10, 8], [10.4 + dx, 2.6]], color),
  ]);
}

function bushArt(color, peek, blink) {
  return art(`bush|${color}|${peek}|${blink}`, 26, 16, () => {
    const out = [E(8, 10.4, 7.6, 5.6, color), E(18, 10, 8, 6, color), E(13, 6.4, 7, 6, color), F(E(10, 5, 2.6, 1.4, shade(color, 18))), F(E(18.4, 7, 2.2, 1.2, shade(color, 18)))];
    if (peek) out.push(...face(13, 9, 2.2, blink ? 'closed' : 'open', 'none'));
    else out.push(F(E(6, 11, 0.9, 0.9, '#ff7f9f')), F(E(20, 12, 0.9, 0.9, '#ff7f9f')), F(E(16, 8, 0.9, 0.9, '#ff7f9f')));
    return out;
  });
}

function lampArt() {
  return art('lamp', 12, 42, () => [
    R(5.2, 10, 1.6, 30, '#9f8ad6'), R(3.4, 38, 5.2, 4, '#9f8ad6'), E(6, 38.4, 3, 1.2, '#b8a6f0'),
    R(2.4, 3.6, 7.2, 7.4, '#fff3a6'), F(R(3.4, 4.6, 2, 5.4, '#fffbe0')), T([[1.4, 4], [6, 0.4], [10.6, 4]], '#9f8ad6'), R(2, 10.6, 8, 1.4, '#9f8ad6'),
  ]);
}

function benchArt(cat, color) {
  return art(`bench|${cat}|${color}`, 28, 16, () => {
    const wood = '#e6ad7c';
    const out = [R(2, 8, 24, 2.6, wood), R(2, 3, 24, 2.2, wood), R(4, 10, 1.6, 6, shade(wood, -18)), R(22.4, 10, 1.6, 6, shade(wood, -18)), R(5, 5, 1.2, 3, shade(wood, -10)), R(21.8, 5, 1.2, 3, shade(wood, -10))];
    if (cat) {
      // A cat curled up asleep on the seat.
      out.push(E(13, 5.6, 5, 3, color), E(7.6, 5.4, 3, 2.6, color), T([[5.4, 3.6], [5.6, 1], [7.4, 3]], color), T([[8, 3], [9.6, 1], [10, 3.6]], color),
        E(18, 6.6, 1.6, 1.2, color), ...face(7.6, 5.6, 1.1, 'closed', 'none'));
    }
    return out;
  });
}

function mailboxArt() {
  return art('mailbox', 12, 20, () => [R(5, 9, 2, 11, '#c99a6b'), R(1.4, 4, 9.2, 6.4, '#ff9ec0'), E(6, 4.4, 4.6, 2.4, '#ff9ec0'), F(R(2.6, 6.6, 1.8, 1.8, '#ffffff')), R(10.4, 2, 1, 5, '#ff5b7f'), R(10.4, 2, 2, 1.6, '#ff5b7f')]);
}

function signArt() {
  return art('sign', 18, 20, () => [R(8, 8, 2, 12, '#b88a5c'), T([[1, 2], [14, 2], [17, 5.4], [14, 8.8], [1, 8.8]], '#f0c290'), F(R(3, 4.8, 8, 1, '#c99a6b'))]);
}

function fenceArt() {
  return art('fence', 26, 14, () => {
    const c = '#fff4e0';
    const out = [R(0, 5, 26, 2, c), R(0, 9.6, 26, 2, c)];
    for (const x of [2, 9, 16, 23]) out.push(R(x - 1.4, 2, 2.8, 12, c), E(x, 2.2, 1.4, 1.4, c));
    return out;
  });
}

const crateArt = () => art('crate', 16, 15, () => [R(1, 1, 14, 14, '#e6b98a'), F(R(1, 7, 14, 1.4, '#c99a6b')), F(T([[2, 2], [3.6, 2], [14, 13], [12.4, 13]], '#d4a678'))]);
const barrelArt = () => art('barrel', 14, 16, () => [E(7, 8, 6, 7.6, '#d9a273'), R(1.4, 4, 11.2, 8, '#d9a273'), F(R(1.6, 3.6, 10.8, 1.2, '#8f7cc4')), F(R(1.6, 11.2, 10.8, 1.2, '#8f7cc4'))]);
const buoyArt = () => art('buoy', 12, 14, () => [E(6, 8, 5, 5.6, '#ff8fa8'), F(R(1.2, 6.6, 9.6, 2.4, '#ffffff')), R(5.2, 0, 1.6, 3, '#ffffff')]);

function mushroomArt(cap, blink) {
  return art(`mush|${cap}|${blink}`, 16, 15, () => [
    R(4.6, 7, 6.8, 8, '#fff1dc'), E(8, 15, 3.6, 0.8, '#fff1dc'), T([[1, 8], [2.4, 3.4], [8, 0.6], [13.6, 3.4], [15, 8]], cap),
    F(E(5, 4.4, 1.2, 1, '#ffffff')), F(E(10.6, 3.4, 1, 0.9, '#ffffff')), F(E(8, 6.2, 0.8, 0.7, '#ffffff')),
    ...face(8, 10.6, 1.4, blink ? 'closed' : 'open', 'smile'),
  ]);
}

function stumpArt() {
  return art('stump', 20, 13, () => [R(3, 3, 14, 10, '#c9a27a'), E(10, 3, 7, 2.2, '#f0d6a8'), arc(10, 3, 4, 1.2, 0, 360, 0.4, '#d9b88f'), E(2.4, 12, 2, 1.2, '#c9a27a'), E(17.6, 12, 2, 1.2, '#c9a27a'), ...face(10, 8, 2, 'closed', 'none')]);
}

const rockArt = (moss) => art(`rock|${moss}`, 18, 10, () => [E(9, 6.4, 8, 4.4, '#cfc6e4'), F(E(6.4, 4.6, 2.2, 1, '#ece6fa')), moss ? E(11, 2.8, 4, 1.6, '#9fe0b0') : null]);

function columnArt(h) {
  return art(`column|${h}`, 16, h, () => [R(4, 4, 8, h - 4, '#f0e8ff'), F(R(6, 6, 0.8, h - 8, '#dcd0f5')), F(R(9.2, 6, 0.8, h - 8, '#dcd0f5')), R(2, 1, 12, 3.6, '#f7f2ff'), R(2.6, h - 3, 10.8, 3, '#f7f2ff'),
    E(5, h * 0.5, 2, 1.4, '#9fe0b0'), E(10.4, h * 0.36, 1.8, 1.2, '#9fe0b0'), E(7, h * 0.66, 1.6, 1.1, '#9fe0b0')]);
}

function candleArt(frame) {
  return art(`candle|${frame}`, 8, 15, () => [R(2.4, 7, 3.2, 8, '#fff4e0'), F(E(4, 7, 1.6, 0.5, '#ffe9c9')), E(4, 4 - frame * 0.2, 1.5, 2.4 + frame * 0.3, '#ffcf5a'), F(E(4, 4.6, 0.7, 1.2, '#fff6c9'))]);
}

function crystalArt(color, size) {
  const h = 18 + size * 10;
  return art(`crystal|${color}|${size}`, 18, h, () => [
    T([[6, h], [4.4, h * 0.38], [7.4, h * 0.08], [10, h * 0.38], [9.4, h]], color),
    T([[9, h], [10.6, h * 0.5], [13.6, h * 0.32], [15, h * 0.62], [13, h]], shade(color, -10)),
    T([[2, h], [2.4, h * 0.66], [4.4, h * 0.56], [6.4, h]], shade(color, 8)),
    F(T([[6.4, h * 0.42], [7.4, h * 0.16], [8, h * 0.42], [7.4, h * 0.8]], '#ffffff')),
  ]);
}

function cloudArt(size, mood) {
  const w = Math.round(30 * size);
  const h = Math.round(18 * size);
  return art(`cloud|${size}|${mood}`, w, h, () => {
    const s = size;
    const out = [E(9 * s, 12 * s, 7.4 * s, 5.6 * s, '#ffffff'), E(16 * s, 8 * s, 8.6 * s, 7.4 * s, '#ffffff'), E(23 * s, 11.6 * s, 6.6 * s, 5.6 * s, '#ffffff'), R(6 * s, 11 * s, 19 * s, 6.2 * s, '#ffffff'),
      F(E(13 * s, 5.4 * s, 3 * s, 1.4 * s, '#fdfbff'))];
    if (mood) out.push(...face(16 * s, 11.4 * s, 2.6 * s, mood, 'smile', Math.max(1, s)));
    return out;
  });
}

function sunArt(blink) {
  return art(`sun|${blink}`, 40, 40, () => {
    const out = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      out.push(E(20 + Math.cos(a) * 16.4, 20 + Math.sin(a) * 16.4, 2.6, 2.6, '#ffe58a'));
    }
    out.push(E(20, 20, 14, 14, '#fff0a0'), F(E(15, 14, 4, 2.4, '#fffbe0')));
    out.push(...face(20, 20, 5, blink ? 'closed' : 'happy', 'smile', 2));
    return out;
  });
}

function moonArt(blink) {
  return art(`moon|${blink}`, 34, 34, () => [E(17, 17, 13, 13, '#fff6d6'), F(E(12, 11, 3.2, 2, '#ffffff')), F(E(22, 24, 2, 1.6, '#f3e6c4')), F(E(24, 12, 1.4, 1.2, '#f3e6c4')),
    ...face(16, 17, 4.4, 'closed', 'none', 1.8), F(E(16, 21.4, 0.9, 0.5, INK))]);
}

// ---------- Backdrop buildings and landmarks (mid layer) ----------

const WALLS = ['#fff4e6', '#ffe3ef', '#e2f6ec', '#ede4ff', '#ffeacf'];
const ROOFS = ['#ff9ec0', '#9fb8ff', '#ffb38a', '#b9a7ff', '#7fd1a8'];

export function houseArt(seed) {
  const wall = pick(WALLS, seed);
  const roof = pick(ROOFS, hash(seed * 9 + 1));
  const tall = hash(seed * 5 + 2) > 0.5;
  const H = tall ? 92 : 74;
  return art(`house|${wall}|${roof}|${tall}`, 70, H, () => {
    const top = H - (tall ? 58 : 40);
    const out = [R(48, top - 24, 8, 16, shade(roof, -8)), R(46.6, top - 26, 10.8, 3, shade(roof, -14)), R(8, top, 54, H - top, wall),
      T([[2, top + 2], [35, top - 26], [68, top + 2]], roof), F(T([[8, top - 1], [35, top - 22], [62, top - 1], [62, top + 1], [35, top - 20], [8, top + 1]], shade(roof, 16))),
      // Round attic window with a little heart.
      E(35, top - 8, 5, 5, '#ffffff'), F(E(35, top - 8, 3.6, 3.6, '#fff3a6')), F(E(34, top - 8.6, 1, 1, '#ff8fa8')), F(E(36, top - 8.6, 1, 1, '#ff8fa8')), F(T([[33.2, top - 8.2], [36.8, top - 8.2], [35, top - 6.2]], '#ff8fa8')),
      // Door with a round top and a knob, and a step.
      R(29, H - 18, 12, 18, '#d39a6a'), E(35, H - 18, 6, 4.6, '#d39a6a'), F(E(38.4, H - 9, 0.8, 0.8, '#ffe36b')), R(27, H - 2, 16, 2, shade(wall, -14))];
    const rows = tall ? [top + 8, top + 30] : [top + 8];
    for (const wy of rows) {
      for (const wx of [17, 53]) {
        out.push(R(wx - 5.4, wy, 10.8, 10, '#ffffff'), F(R(wx - 4.2, wy + 1.2, 8.4, 7.6, '#fff3a6')), F(R(wx - 0.4, wy + 1.2, 0.8, 7.6, '#ffffff')), F(R(wx - 4.2, wy + 4.6, 8.4, 0.8, '#ffffff')));
        // Flower box under the window.
        out.push(R(wx - 6, wy + 10, 12, 2.6, '#c99a6b'), F(E(wx - 3, wy + 9.8, 1.2, 1.2, '#ff9ec0')), F(E(wx, wy + 9.4, 1.2, 1.2, '#ffe36b')), F(E(wx + 3, wy + 9.8, 1.2, 1.2, '#c9a6ff')));
      }
    }
    return out;
  });
}

function treeArt(seed, blossom, palette = ['#8fdc9a', '#7fd1a8', '#a8e28a']) {
  const leaf = blossom ? '#ffc6de' : pick(palette, seed);
  const big = hash(seed * 3) > 0.5;
  const H = big ? 66 : 54;
  return art(`tree|${leaf}|${big}`, 44, H, () => [
    R(19, H - 26, 6, 26, '#c9a27a'), T([[19, H], [16, H], [19, H - 4]], '#c9a27a'), T([[25, H], [28, H], [25, H - 4]], '#c9a27a'),
    E(22, H - 38, 17, 15, leaf), E(10, H - 30, 9, 8, leaf), E(34, H - 30, 9, 8, leaf), F(E(16, H - 46, 6, 3, shade(leaf, 16))),
    F(E(12, H - 32, 1.4, 1.4, blossom ? '#ffffff' : '#ff8fa8')), F(E(30, H - 40, 1.4, 1.4, blossom ? '#ffffff' : '#ff8fa8')), F(E(24, H - 28, 1.4, 1.4, blossom ? '#ffffff' : '#ffb38a')),
  ]);
}

function windmillArt(frame) {
  return art(`windmill|${frame}`, 60, 80, () => {
    const out = [T([[20, 80], [24, 34], [36, 34], [40, 80]], '#fff4e6'), T([[18, 36], [30, 22], [42, 36]], '#ff9ec0'), R(26.6, 66, 6.8, 14, '#d39a6a'), E(30, 66, 3.4, 2.6, '#d39a6a'), E(30, 46, 3, 3, '#fff3a6')];
    const a0 = (frame / 8) * (Math.PI / 2);
    for (let k = 0; k < 4; k++) {
      const a = a0 + (k * Math.PI) / 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const at = (u, v) => [30 + ca * u - sa * v, 30 + sa * u + ca * v];
      out.push(T([at(2, -1), at(26, -1), at(26, 4.4), at(6, 4.4)], '#ffffff'), F(T([at(8, 0), at(24, 0), at(24, 0.6), at(8, 0.6)], '#e6dcf5')));
    }
    out.push(E(30, 30, 2.6, 2.6, '#b9a7ff'));
    return out;
  });
}

function lighthouseArt() {
  return art('lighthouse', 34, 96, () => {
    const out = [T([[8, 96], [11, 30], [23, 30], [26, 96]], '#ffffff')];
    for (const y of [40, 60, 80]) out.push(T([[8 + (96 - y) * 0.045 - 0.3, y], [26 - (96 - y) * 0.045 + 0.3, y], [26 - (96 - y - 8) * 0.045 + 0.4, y + 8], [8 + (96 - y - 8) * 0.045 - 0.4, y + 8]], '#ff8fa8'));
    out.push(R(9, 26, 16, 4, '#9fb8ff'), R(11, 14, 12, 12, '#fff3a6'), F(R(16.6, 14, 0.8, 12, '#ffffff')), E(17, 13, 8, 5, '#ff8fa8'), E(17, 7.6, 1.4, 1.4, '#ff8fa8'), R(14.6, 84, 4.8, 12, '#9fb8ff'), E(17, 84, 2.4, 2, '#9fb8ff'));
    return out;
  });
}

function boatArt(sail) {
  return art(`boat|${sail}`, 40, 40, () => [T([[2, 30], [38, 30], [32, 38], [8, 38]], '#ffffff'), F(R(4, 31.6, 32, 1.4, '#8fd3ff')), R(19.4, 4, 1.4, 27, '#c99a6b'),
    T([[21.6, 5], [21.6, 28], [36, 28]], sail), T([[18.6, 9], [18.6, 28], [7, 28]], '#ffffff'), F(T([[21.6, 18], [31, 18], [33.4, 21], [21.6, 21]], '#ffffff'))]);
}

export function mushHouseArt(seed) {
  const cap = pick(['#ff8fa8', '#ffb38a', '#c9a6ff'], seed);
  return art(`mushhouse|${cap}`, 56, 60, () => [
    R(14, 26, 28, 34, '#fff1dc'), E(28, 60, 15, 2, '#fff1dc'), R(23, 42, 10, 18, '#d39a6a'), E(28, 42, 5, 4, '#d39a6a'), F(E(30.6, 51, 0.8, 0.8, '#ffe36b')),
    E(19, 36, 3.4, 3.4, '#ffffff'), F(E(19, 36, 2.4, 2.4, '#fff3a6')), E(37, 36, 3.4, 3.4, '#ffffff'), F(E(37, 36, 2.4, 2.4, '#fff3a6')),
    T([[1, 28], [6, 12], [18, 3], [28, 1], [38, 3], [50, 12], [55, 28]], cap), R(4, 26, 48, 3, shade(cap, -10)),
    F(E(14, 14, 3.4, 2.6, '#ffffff')), F(E(30, 8, 3, 2.2, '#ffffff')), F(E(42, 18, 3.6, 2.6, '#ffffff')), F(E(24, 20, 2, 1.6, '#ffffff')),
  ]);
}

function archArt() {
  return art('arch', 64, 76, () => {
    const stone = '#ece4ff';
    const out = [R(4, 24, 12, 52, stone), R(48, 24, 12, 52, stone), R(2, 72, 16, 4, '#f7f2ff'), R(46, 72, 16, 4, '#f7f2ff')];
    const outer = [];
    const inner = [];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + (Math.PI * i) / 10;
      outer.push([32 + Math.cos(a) * 28, 26 + Math.sin(a) * 24]);
      inner.push([32 + Math.cos(a) * 16, 26 + Math.sin(a) * 14]);
    }
    out.push(T([...outer, ...inner.reverse()], stone), F(E(32, 4.6, 2.2, 2.2, '#c9a6ff')));
    for (const [x, y] of [[6, 30], [8, 38], [56, 28], [58, 44], [20, 8], [44, 9], [5, 50]]) out.push(E(x, y, 2.2, 1.6, '#9fe0b0'));
    return out;
  });
}

function bigCrystalArt(color) {
  return art(`bigcrystal|${color}`, 44, 74, () => [
    T([[14, 74], [11, 26], [19, 2], [26, 26], [25, 74]], color), T([[24, 74], [27, 38], [34, 24], [38, 44], [35, 74]], shade(color, -10)),
    T([[4, 74], [5, 48], [10, 42], [14, 74]], shade(color, 10)), F(T([[16, 28], [19, 8], [20.6, 28], [18.6, 60]], '#ffffff')), F(T([[30, 42], [33.4, 30], [34.4, 44]], '#ffffff')),
  ]);
}

function islandArt(seed, frame) {
  return art(`island|${seed > 0.5}|${frame}`, 84, 64, () => {
    const out = [T([[6, 22], [78, 22], [62, 40], [48, 58], [36, 54], [20, 38]], '#d9c6ff'), E(42, 22, 38, 7, '#9fe0b0'), F(E(30, 19, 10, 2, '#c4f2cf'))];
    if (seed > 0.5) out.push(R(55, 4, 3, 16, '#c9a27a'), E(56.6, 4, 9, 7.6, '#ffc6de'), F(E(53, 1.6, 3, 1.4, '#ffe3ef')));
    else out.push(E(24, 14, 6, 5, '#8fdc9a'), E(32, 15, 5, 4.4, '#8fdc9a'));
    // A little waterfall pouring off the edge.
    out.push(R(66, 24, 5, 34, '#bfe6ff'));
    for (let k = 0; k < 4; k++) out.push(F(R(67, 26 + ((k * 9 + frame * 3) % 32), 1.2, 4, '#ffffff')));
    return out;
  });
}

export function tentArt(color) {
  return art(`tent|${color}`, 56, 50, () => [
    T([[2, 50], [28, 10], [54, 50]], '#fff4e6'), T([[10, 50], [28, 10], [20, 50]], color), T([[36, 50], [28, 10], [46, 50]], color),
    T([[22, 50], [28, 34], [34, 50]], '#8a5a3c'), R(27.4, 0, 1.2, 12, '#8a5a3c'), T([[28.6, 1], [37, 3.4], [28.6, 6]], color),
  ]);
}

function forgeArt(frame) {
  return art(`forge|${frame}`, 50, 56, () => [
    R(30, 4, 9, 30, '#b5a8c9'), R(29, 2, 11, 4, '#a598bd'), R(4, 22, 42, 34, '#c9bedc'), E(25, 22, 21, 6, '#c9bedc'),
    E(25, 40, 9, 8, '#3a2d4f'), E(25, 42 - frame * 0.4, 6.4, 5 + frame * 0.6, '#ff8a3c'), F(E(25, 43, 3.4, 2.6, '#ffe36b')),
    F(R(10, 30, 4, 3, '#a598bd')), F(R(36, 34, 5, 3, '#a598bd')), R(4, 52, 42, 4, '#a598bd'),
  ]);
}

function bannerArt(color, frame) {
  const wave = [0, 1.2, 0][frame] - 0.6;
  return art(`banner|${color}|${frame}`, 24, 70, () => [
    R(4, 2, 2.4, 68, '#8a5a3c'), E(5.2, 2, 2.4, 2.4, '#ffd66b'),
    T([[6.4, 6], [20 + wave, 7], [21 + wave, 30], [14 + wave * 0.5, 26], [6.4, 32]], color),
    F(T([[11, 14], [13.4, 11], [15.8, 14], [13.4, 20]], '#fff4e6')),
  ]);
}

export function treehouseArt(seed) {
  const roof = pick(['#ff9ec0', '#9fb8ff', '#ffd66b'], seed);
  return art(`treehouse|${roof}`, 64, 92, () => [
    R(26, 40, 12, 52, '#9f7a57'), T([[26, 92], [20, 92], [26, 84]], '#9f7a57'), T([[38, 92], [44, 92], [38, 84]], '#9f7a57'),
    E(32, 22, 30, 20, '#6fbf8a'), E(12, 30, 12, 10, '#6fbf8a'), E(52, 30, 12, 10, '#6fbf8a'),
    R(16, 30, 32, 20, '#f0d6a8'), T([[12, 31], [32, 18], [52, 31]], roof),
    E(24, 40, 3.4, 3.4, '#ffffff'), F(E(24, 40, 2.4, 2.4, '#fff3a6')), E(40, 40, 3.4, 3.4, '#ffffff'), F(E(40, 40, 2.4, 2.4, '#fff3a6')),
    R(30, 42, 5, 8, '#c99a6b'), R(31, 50, 0.8, 22, '#e6c9a0'), R(34.2, 50, 0.8, 22, '#e6c9a0'),
    F(R(31, 54, 4, 0.8, '#e6c9a0')), F(R(31, 59, 4, 0.8, '#e6c9a0')), F(R(31, 64, 4, 0.8, '#e6c9a0')), F(R(31, 69, 4, 0.8, '#e6c9a0')),
  ]);
}

function towerArt() {
  return art('magetower', 40, 100, () => [
    T([[8, 100], [11, 34], [29, 34], [32, 100]], '#ece4ff'), R(9, 32, 22, 4, '#c9b6ff'), T([[5, 34], [20, 2], [35, 34]], '#7f8cff'),
    F(T([[18, 14], [20, 9], [22, 14], [20, 19]], '#ffe36b')), E(20, 52, 4, 5, '#ffffff'), F(E(20, 52, 3, 4, '#fff3a6')),
    E(20, 74, 4, 5, '#ffffff'), F(E(20, 74, 3, 4, '#c9f2ff')), R(15, 88, 10, 12, '#9f7a57'), E(20, 88, 5, 4, '#9f7a57'),
  ]);
}

const floatLanternArt = () => art('floatlantern', 8, 10, () => [E(4, 5, 3.4, 4, '#ffcf7a'), F(E(3, 4, 1, 2, '#fff1c9')), R(2.6, 0, 2.8, 1.4, '#c97f4f'), R(2.6, 8.8, 2.8, 1.2, '#c97f4f')]);

function torchArt(frame) {
  return art(`torch|${frame}`, 10, 30, () => [R(4, 10, 2.4, 20, '#8a5a3c'), R(2.6, 8, 5.2, 3, '#a598bd'), E(5.2, 5 - frame * 0.3, 2.6, 3.6 + frame * 0.4, '#ff8a3c'), F(E(5.2, 6, 1.4, 2, '#ffe36b'))]);
}

function dummyArt(blink) {
  return art(`dummy|${blink}`, 20, 34, () => [
    R(9, 18, 2.4, 16, '#8a5a3c'), R(2, 18, 16, 2.4, '#8a5a3c'), E(10, 22, 6, 7, '#f2d38a'), F(R(4.4, 22, 11.2, 1.2, '#c99a6b')),
    E(10, 9, 6, 6, '#f2d38a'), F(E(10, 5, 3, 1.4, '#f7e4b0')), ...face(10, 9.6, 2.2, blink ? 'closed' : 'open', 'o'),
  ]);
}

function cactusArt(blink) {
  return art(`cactus|${blink}`, 18, 22, () => [
    E(9, 13, 6, 9, '#8fd39a'), E(2.6, 12, 2.2, 3.4, '#8fd39a'), E(15.4, 10, 2.2, 3.4, '#8fd39a'), R(4.6, 18, 8.8, 4, '#ff9a6b'), R(4, 17.4, 10, 1.6, '#ffb38a'),
    E(9, 3.4, 2.2, 2, '#ff8fb4'), F(E(9, 3.4, 0.8, 0.8, '#ffe36b')), ...face(9, 11, 2, blink ? 'closed' : 'happy', 'smile'),
  ]);
}

function rackArt() {
  return art('rack', 26, 24, () => [R(2, 6, 22, 2, '#8a5a3c'), R(2, 20, 22, 2, '#8a5a3c'), R(3, 6, 2, 18, '#8a5a3c'), R(21, 6, 2, 18, '#8a5a3c'),
    R(8, 2, 1.6, 18, '#dfe6f5'), R(7, 14, 3.6, 1.2, '#ffd66b'), R(13, 0, 1.6, 20, '#dfe6f5'), T([[12, 1], [13.8, -2], [15.6, 1]], '#dfe6f5'), R(17.6, 4, 1.4, 16, '#c99a6b'), E(18.3, 5, 2.4, 1.6, '#dfe6f5')]);
}

function catArt(color, frame) {
  return art(`cat|${color}|${frame}`, 16, 14, () => {
    const tail = [-1, 0, 1][frame];
    return [E(7, 9.6, 5, 4, color), E(10.6, 5, 3.6, 3.2, color), T([[8, 3], [8.4, 0], [10, 2]], color), T([[11.4, 2], [13, 0], [13.4, 3]], color),
      T([[2.6, 10], [0.4 + tail, 4], [2 + tail, 3.6], [3.8, 9]], color), ...face(10.6, 5.2, 1.3, 'happy', 'none'), F(E(10.6, 6.6, 0.4, 0.3, '#ff8fa8'))];
  });
}

const posterArt = () => art('poster', 16, 26, () => [R(7, 10, 2, 16, '#8a5a3c'), R(1, 1, 14, 13, '#fff4e0'), F(R(3, 2.6, 10, 1.2, '#c99a6b')), F(E(8, 7.6, 2.6, 2.6, '#c9b8ff')), F(R(5.4, 6.4, 5.2, 1, '#3a2d4f')), F(R(3, 11.6, 10, 0.8, '#d9b88f'))]);

const lanternArt = () => art('lantern', 12, 34, () => [R(5, 8, 2, 26, '#8a6a4a'), R(5, 6, 6, 1.6, '#8a6a4a'), E(9, 12, 3, 3.6, '#ff9ec0'), F(E(8.4, 11.4, 1, 1.6, '#ffd6e6')), R(7.6, 8, 2.8, 1.2, '#8a6a4a')]);

function glowshroomArt(color, blink) {
  return art(`glowshroom|${color}|${blink}`, 14, 14, () => [R(4.6, 7, 4.8, 7, '#e6f4ff'), T([[1, 8], [3, 3], [7, 1], [11, 3], [13, 8]], color), F(E(4.6, 4.4, 1, 0.8, '#ffffff')), F(E(9.4, 4, 0.9, 0.7, '#ffffff')), ...face(7, 10.4, 1.2, blink ? 'closed' : 'open', 'none')]);
}

const orbArt = () => art('orb', 14, 22, () => [R(4, 12, 6, 10, '#c9b8ff'), R(2, 20, 10, 2, '#a68be0'), R(3, 11, 8, 2, '#a68be0'), E(7, 6, 5, 5, '#bfe6ff'), F(E(5.6, 4.6, 1.6, 1.2, '#ffffff')), F(E(8, 7.4, 1.4, 1.4, '#e0b8ff'))]);
const booksArt = () => art('books', 16, 12, () => [R(1, 8, 14, 4, '#ff9ec0'), R(2, 4, 12, 4, '#9fb8ff'), R(3, 0.6, 10, 3.4, '#ffd66b'), F(R(1, 9.4, 14, 0.8, '#ffffff')), F(R(2, 5.4, 12, 0.8, '#ffffff')), F(R(3, 1.8, 10, 0.6, '#ffffff'))]);

function targetArt() {
  return art('target', 20, 30, () => [R(4, 16, 2, 14, '#c99a6b'), R(14, 16, 2, 14, '#c99a6b'), E(10, 12, 9, 9, '#ffffff'), E(10, 12, 6.6, 6.6, '#ff8fa8'), E(10, 12, 4.2, 4.2, '#ffffff'), E(10, 12, 2, 2, '#ff8fa8'),
    T([[11, 11], [17, 6], [17.6, 6.8]], '#8a5a3c'), T([[15.8, 4.6], [18.6, 5.4], [17, 7.8]], '#ffffff'), T([[8, 13.6], [2, 17], [2.4, 17.8]], '#8a5a3c'), T([[0, 16.2], [3.4, 17.4], [1.2, 19.6]], '#ffffff')]);
}

// ---------- The hollow: roots, moss, and little lights underground ----------

const ROOT = '#b9917e';
const ROOT_LIGHT = '#d4b09c';
const ROOT_DEEP = '#8f6a66';
const MOSS = '#a6dca2';
const STALK = '#f6eee2';

// The outline of a band following `path`, `widthAt(u)` half as wide at each point (u = 0..1 along
// it); used for roots and strands both as sprite polygons and as canvas paths.
function bandPts(path, widthAt) {
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
const band = (path, widthAt, c) => T(bandPts(path, widthAt), c);

function fillPts(ctx, pts) {
  ctx.beginPath();
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
}

// A root curling up out of the dirt with a new leaf on top.
function rootCurlArt() {
  return art('rootcurl', 20, 16, () => [
    band([[3, 16.4], [3.4, 12], [4.8, 8], [7.4, 5.4], [10.4, 4.6], [13, 5.6], [14.4, 8], [13.6, 10.4], [11.6, 11], [10.4, 9.6], [11.2, 8.2]], (u) => 2.2 * (1 - u) + 0.6, ROOT),
    E(2.4, 15.6, 2.6, 1, ROOT), T([[8.4, 4.8], [9.4, 1.4], [12.6, 0.4], [11.4, 3.6]], MOSS), F(T([[9.4, 3.8], [11.8, 1.2], [10.2, 3.6]], '#d6f4cf')),
  ]);
}

// A soft mound of moss with a tiny white bloom.
function mossArt(bloom) {
  return art(`moss|${bloom}`, 18, 8, () => [
    E(9, 6, 8, 2.6, '#92cf94'), E(5.4, 4.8, 3.8, 2.8, MOSS), E(11.6, 4.2, 4.4, 3.4, MOSS), E(15, 5.6, 2.6, 2, MOSS),
    F(E(10.4, 2.6, 1.8, 0.8, '#d6f4cf')), F(E(5, 3.6, 1.2, 0.6, '#d6f4cf')),
    bloom ? F(E(13.4, 2.2, 1.1, 1.1, '#ffffff')) : null, bloom ? F(E(13.4, 2.2, 0.45, 0.45, '#ffd68a')) : null,
  ]);
}

// A little cluster of smooth stones.
function pebbleArt(two) {
  return art(`pebble|${two}`, 16, 8, () => [
    E(6, 5, 5, 3, '#cbbcc4'), F(E(4.6, 3.6, 1.6, 0.7, '#ece2e6')), E(12, 6, 3.4, 2, two ? '#b9a6b6' : '#d9c8bc'), F(E(11.2, 5.2, 1, 0.5, '#efe6ea')),
    two ? E(2, 7, 1.6, 1, '#d9c8bc') : null,
  ]);
}

// A small paper lantern hung from a curled root post.
function hollowLanternArt() {
  return art('hlantern', 16, 30, () => [
    band([[4, 30.4], [4, 18], [4.2, 10], [5.4, 5], [8.4, 2.6], [11.4, 3.2], [12.2, 5.6]], (u) => 1.6 - u * 0.8, ROOT), E(4, 29.6, 3, 1, ROOT),
    T([[2.4, 22], [0.6, 19.4], [2.4, 18.6], [3.4, 20.6]], MOSS),
    R(10.8, 8, 2.8, 1.6, ROOT_DEEP), E(12.2, 13, 3.6, 4.2, '#ffd68a'), F(E(11.2, 12, 1, 2, '#fff6dc')), F(R(10.4, 13, 3.6, 0.6, '#f0b866')), R(10.8, 17, 2.8, 1.4, ROOT_DEEP),
  ]);
}

// Mid layer: an arch of old roots, mossy on top, with little glowing fungi on its legs.
function rootArchArt(v) {
  const caps = [['#7fe6d6', '#ffb0d0'], ['#ffd68a', '#7fe6d6'], ['#ffb0d0', '#ffd68a']][v];
  return art(`rootarch|${v}`, 120, 100, () => {
    const arch = [];
    const twist = [];
    for (let k = 0; k <= 18; k++) {
      const a = Math.PI + (Math.PI * k) / 18;
      arch.push([60 + Math.cos(a) * 46, 101 + Math.sin(a) * 84]);
      const r = 1 + Math.sin(k * 1.1 + v) * 0.09;
      twist.push([60 + Math.cos(a) * 46 * r, 101 + Math.sin(a) * 84 * r]);
    }
    const out = [
      band(arch, (u) => 6 + 4.4 * Math.abs(Math.cos(Math.PI * u)), ROOT),
      band([[16, 88], [9, 96], [1, 100.6]], (u) => 3.6 - u * 2.6, ROOT), band([[104, 88], [111, 96], [119, 100.6]], (u) => 3.6 - u * 2.6, ROOT),
      band([[20, 92], [25, 99], [30, 100.6]], (u) => 2.6 - u * 1.8, ROOT), band([[100, 92], [95, 99], [90, 100.6]], (u) => 2.6 - u * 1.8, ROOT),
      band(twist.slice(2, 17), () => 2, ROOT_LIGHT),
    ];
    // Moss along the top, with drips hanging off the inner edge.
    for (const k of [6, 7.5, 9, 10.5, 12]) {
      const a = Math.PI + (Math.PI * k) / 18;
      const px = 60 + Math.cos(a) * 46;
      const py = 101 + Math.sin(a) * 84;
      out.push(E(px, py - 6, 6.4, 3.2, MOSS));
      out.push(T([[px - 2.4, py + 4], [px + 0.4, py + 4], [px - 1, py + 9 + (k % 3) * 2]], MOSS));
    }
    out.push(F(E(54, 13, 3.4, 1, '#d6f4cf')), F(E(70, 15, 2.4, 0.8, '#d6f4cf')));
    // Fungi: a little cap family by the left foot and shelf fungus on the right leg.
    out.push(R(20.6, 83, 2, 6, STALK), E(21.6, 83, 4.2, 2.8, caps[0]), R(26.6, 87, 1.6, 3, STALK), E(27.4, 87, 2.6, 1.8, caps[0]),
      F(E(20.4, 82, 1.1, 0.6, '#ffffff')), E(105, 58, 6, 2.2, caps[1]), E(106.4, 66, 4.6, 1.8, caps[1]), F(E(104, 57.4, 2, 0.6, '#ffffff')));
    return out;
  });
}
// Where the arch sprite's fungi sit, for their glows (offsets from its bottom center).
const ARCH_GLOWS = [[-38, -16, 0], [46, -40, 1]];

// Mid layer: a family of big glowing mushrooms on a mossy mound; the big one has a face.
function mushClusterArt(v, blink) {
  const [c1, c2, c3] = [['#7fe6d6', '#ffb0d0', '#ffd68a'], ['#ffb0d0', '#ffd68a', '#7fe6d6'], ['#ffd68a', '#7fe6d6', '#ffb0d0']][v];
  return art(`mushcluster|${v}|${blink}`, 44, 36, () => [
    E(22, 34, 20, 3, '#92cf94'), R(16.4, 16, 7.2, 18, STALK), T([[5, 19], [7, 10], [13, 5], [20, 3.4], [27, 5], [33, 10], [35, 19]], c1),
    F(E(13, 9, 2, 1.4, '#ffffff')), F(E(25, 7, 1.6, 1.1, '#ffffff')), F(E(20, 13, 1.2, 0.9, '#ffffff')), ...face(20, 25, 1.7, blink ? 'closed' : 'happy', 'smile'),
    R(31.4, 24, 3.6, 10, STALK), T([[27, 26], [29, 21.4], [33.2, 19.6], [37.4, 21.4], [39.4, 26]], c2), F(E(31, 22, 1, 0.7, '#ffffff')),
    R(7, 28, 2.6, 6, STALK), E(8.3, 28, 4, 2.6, c3), F(E(7.4, 27.4, 1, 0.5, '#ffffff')),
  ]);
}

const hangLanternArt = (c) => art(`hanglantern|${c}`, 10, 14, () => [
  T([[1, 3.4], [5, 0.6], [9, 3.4]], ROOT_DEEP), E(5, 7.6, 4, 4.4, c), F(E(3.8, 6.4, 1.1, 2, '#fff6dc')), F(R(1.4, 8, 7.2, 0.6, shade(c, -10))), R(3.6, 11.6, 2.8, 1.6, ROOT_DEEP),
]);

// ---------- Critters ----------

function birdArt(color, frame) {
  return art(`bird|${color}|${frame}`, 12, 11, () => {
    const peck = frame === 2;
    const hx = 8.4;
    const hy = peck ? 6.6 : 3.6;
    return [E(5.6, 6.4, 4.4, 3.4, color), E(hx, hy, 2.8, 2.6, color), T([[hx + 2.2, hy - 0.4], [hx + 4, hy + 0.4], [hx + 2.2, hy + 1]], '#ffb347'),
      E(4.4, 6, 2.4, 1.6, shade(color, -12)), T([[1.6, 5.4], [0, 4], [1.2, 6.6]], color), F(E(hx + 0.6, hy - 0.2, 0.5, 0.6, INK)), F(E(hx + 0.2, hy + 1, 0.6, 0.3, BLUSH)),
      R(4.6, 9.4, 0.6, 1.6, '#ffb347'), R(6.6, 9.4, 0.6, 1.6, '#ffb347')];
  });
}

function butterflyArt(color, frame) {
  return art(`butterfly|${color}|${frame}`, 10, 8, () => {
    const open = frame === 0 ? 1 : 0.4;
    return [E(5 - 2.4 * open, 3, 2.4 * open + 0.3, 2.4, color), E(5 + 2.4 * open, 3, 2.4 * open + 0.3, 2.4, color), E(5 - 1.8 * open, 6, 1.6 * open + 0.3, 1.6, shade(color, 12)), E(5 + 1.8 * open, 6, 1.6 * open + 0.3, 1.6, shade(color, 12)), R(4.6, 2, 0.8, 5, INK)];
  });
}

// ---------- Canvas helpers for soft, unoutlined things ----------

function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(snap(x), snap(y), snap(w), snap(h));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function sparkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function glow(ctx, x, y, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// The outline color for vector-drawn ground and ledges, matching the sprites' tinted outlines.
const edge = (c) => mix(shade(c, -38), INK, 0.35);

// Calls draw(i, x) for repeating elements across the screen at a parallax factor.
function repeat(camX, factor, spacing, width, draw) {
  const off = camX * factor;
  const first = Math.floor(off / spacing) - 1;
  const count = Math.ceil(width / spacing) + 3;
  for (let k = 0; k < count; k++) draw(first + k, (first + k) * spacing - off);
}

// ---------- Sky ----------

function drawSky(ctx, t, theme, width, height, time) {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, t.sky[0]);
  g.addColorStop(0.55, t.sky[1]);
  g.addColorStop(1, t.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  if (t.stars) {
    for (let i = 0; i < 30; i++) {
      const tw = 0.5 + 0.5 * Math.sin(time * 2 + i * 1.7);
      ctx.globalAlpha = 0.3 + 0.6 * tw;
      sparkle(ctx, hash(i) * width, hash(i + 40) * height * 0.6, 1.4 + tw * 1.6, '#ffffff');
    }
    ctx.globalAlpha = 1;
  }
  if (t.rainbow) drawRainbow(ctx, width, height, t.rainbow);
  // The sun (or moon) smiles down and bobs gently.
  if (t.face) {
    const sx = width * 0.8;
    const sy = 56 + Math.sin(time * 0.8) * 2;
    glow(ctx, sx, sy, 70, t.sun, 0.9);
    const blink = blinking(time, 0.2);
    place(ctx, t.face === 'moon' ? moonArt(blink) : sunArt(blink), sx, sy + 20);
  }
}

function drawRainbow(ctx, width, height, alpha) {
  const bands = ['#ffb3c6', '#ffd6a5', '#fff3a6', '#c4f2cf', '#bfe0ff', '#d9c6ff'];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 5;
  bands.forEach((c, i) => {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.arc(width * 0.3, height * 0.78, 190 - i * 5, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  });
  ctx.restore();
}

function drawClouds(ctx, theme, cam, width, time, air) {
  if (theme === 'cave' || theme === 'hollow') return;
  // A far bank of big, faint clouds near the horizon, almost the sky's own color, barely moving.
  veil = { color: air, k: 0.55 };
  repeat(cam.x + time * 2, 0.03, 210, width, (i, x) => {
    if (hash(i + 50) < 0.35) return;
    const size = Math.round((1.5 + hash(i + 51) * 0.9) * 4) / 4;
    place(ctx, cloudArt(size, null), x, 130 + hash(i + 52) * 46 - cam.y * 0.02 + 18 * size, { alpha: 0.7 });
  });
  veil = null;
  repeat(cam.x + time * 5, 0.07, 150, width, (i, x) => {
    if (hash(i) < 0.3) return;
    const size = 0.9 + hash(i + 9) * 0.8;
    const mood = hash(i + 4) < 0.4 ? (blinking(time, hash(i)) ? 'closed' : 'happy') : null;
    const y = 34 + hash(i + 3) * 64 - cam.y * 0.04 + Math.sin(time * 0.7 + i) * 2;
    place(ctx, cloudArt(Math.round(size * 4) / 4, mood), x, y + 18 * size);
  });
}

// Far silhouettes: soft and unoutlined, pulled toward the sky color for depth.
function drawFar(ctx, t, cam, width, y0, time) {
  ctx.fillStyle = t.far;
  switch (t.skyline) {
    case 'houses':
      repeat(cam.x, 0.2, 58, width, (i, x) => {
        const h = 36 + hash(i) * 44;
        roundRect(ctx, x, y0 - h, 48, h + 200, 6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - 4, y0 - h + 4);
        ctx.quadraticCurveTo(x + 24, y0 - h - 30, x + 52, y0 - h + 4);
        ctx.fill();
        if (hash(i + 6) > 0.6) {
          ctx.fillStyle = 'rgba(255,243,166,0.5)';
          ctx.fillRect(snap(x + 18), snap(y0 - h + 12), 10, 8);
          ctx.fillStyle = t.far;
        }
      });
      break;
    case 'sea': {
      ctx.fillRect(0, y0 - 30, width, 300);
      if (t.face === 'moon') {
        ctx.fillStyle = 'rgba(255,246,214,0.35)';
        for (let k = 0; k < 6; k++) ctx.fillRect(snap(width * 0.8 - 14 + Math.sin(time * 2 + k) * 4), snap(y0 - 24 + k * 6), 28 - k * 3, 2);
        ctx.fillStyle = t.far;
      }
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      repeat(cam.x + time * 10, 0.2, 38, width, (i, x) => {
        const w = 10 + (i % 3) * 5;
        ctx.fillRect(snap(x), snap(y0 - 24 + (i % 4) * 7 + Math.sin(time * 2 + i) * 1.5), w, 2);
      });
      // A fish hops out of the water now and then.
      const cyc = (time * 0.25) % 1;
      if (cyc < 0.3) {
        const u = cyc / 0.3;
        const fx = width * (0.2 + hash(Math.floor(time * 0.25)) * 0.6);
        const fy = y0 - 18 - Math.sin(u * Math.PI) * 22;
        ctx.fillStyle = '#ff9f7a';
        ctx.beginPath();
        ctx.ellipse(fx + u * 30, fy, 5, 3, (u - 0.5) * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'columns':
      repeat(cam.x, 0.2, 90, width, (i, x) => {
        const h = 60 + hash(i) * 70;
        roundRect(ctx, x, y0 - h, 22, h + 200, 3);
        ctx.fill();
        ctx.fillRect(snap(x - 5), snap(y0 - h), 32, 7);
      });
      break;
    case 'crystals':
      repeat(cam.x, 0.2, 46, width, (i, x) => {
        const h = 50 + hash(i) * 90;
        ctx.beginPath();
        ctx.moveTo(x, y0 + 200);
        ctx.lineTo(x + 10, y0 - h);
        ctx.lineTo(x + 24, y0 + 200);
        ctx.fill();
      });
      // Stalactites hanging from the cave ceiling.
      repeat(cam.x, 0.25, 40, width, (i, x) => {
        const h = 20 + hash(i + 3) * 60;
        ctx.beginPath();
        ctx.moveTo(x, -2);
        ctx.quadraticCurveTo(x + 9, h, x + 18, -2);
        ctx.fill();
      });
      break;
    case 'roots':
      drawFarRoots(ctx, t, cam, width, y0, time);
      break;
    case 'mesas':
      ctx.fillRect(0, snap(y0 + 20), width, 400);
      repeat(cam.x, 0.2, 130, width, (i, x) => {
        const h = 40 + hash(i) * 60;
        const w = 60 + hash(i + 4) * 50;
        roundRect(ctx, x, y0 - h, w, h + 40, 8);
        ctx.fill();
        ctx.fillStyle = shade(t.far, 10);
        roundRect(ctx, x + 4, y0 - h, w - 8, 6, 3);
        ctx.fill();
        ctx.fillStyle = t.far;
      });
      break;
    case 'bigtrees':
      ctx.fillRect(0, snap(y0 + 10), width, 400);
      repeat(cam.x, 0.2, 110, width, (i, x) => {
        const h = 90 + hash(i) * 70;
        ctx.fillRect(snap(x + 46), snap(y0 - h * 0.6), 18, h);
        ctx.beginPath();
        ctx.arc(x + 55, y0 - h * 0.6, 34 + hash(i + 2) * 14, 0, Math.PI * 2);
        ctx.arc(x + 30, y0 - h * 0.45, 22, 0, Math.PI * 2);
        ctx.arc(x + 80, y0 - h * 0.48, 24, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    case 'islands':
      repeat(cam.x, 0.12, 180, width, (i, x) => {
        if (hash(i) < 0.35) return;
        const y = y0 - 90 - hash(i + 2) * 60 + Math.sin(time * 0.6 + i) * 3;
        ctx.globalAlpha = 0.55;
        place(ctx, islandArt(hash(i + 5), Math.floor(time * 6) % 4), x, y + 64);
        ctx.globalAlpha = 1;
      });
      break;
    default: // hills, trees
      ctx.fillRect(0, snap(y0 + 29), width, 400);
      repeat(cam.x, 0.2, 220, width, (i, x) => {
        ctx.beginPath();
        ctx.arc(x + 110, y0 + 30, 130, Math.PI, 0);
        ctx.fill();
      });
  }
}

// The hollow's far layer: an earthen ceiling, great twisting root columns, and roots dangling down.
function drawFarRoots(ctx, t, cam, width, y0, time) {
  // Soft pools of mushroom light far back in the den.
  repeat(cam.x, 0.12, 160, width, (i, x) => {
    glow(ctx, x + 80, y0 - 30 - hash(i + 2) * 120, 60 + hash(i + 4) * 40, pick(t.shrooms, hash(i + 8)), 0.16 + 0.05 * Math.sin(time * 0.8 + i));
  });
  ctx.fillStyle = t.far;
  ctx.fillRect(0, snap(y0 + 34), width, 400);
  repeat(cam.x, 0.2, 60, width, (i, x) => {
    ctx.beginPath();
    ctx.ellipse(x + 30, y0 + 36, 36 + hash(i + 1) * 12, 10 + hash(i) * 8, 0, Math.PI, 0);
    ctx.fill();
  });
  // Root columns from the ceiling to the floor, each with a thinner root twined around it.
  repeat(cam.x, 0.2, 150, width, (i, x) => {
    if (hash(i + 21) < 0.3) return;
    const cx = x + 40 + hash(i + 1) * 70;
    const amp = 8 + hash(i + 2) * 10;
    const base = 9 + hash(i + 3) * 6;
    const main = [];
    const twin = [];
    for (let yy = -12; yy <= y0 + 48; yy += 10) {
      main.push([cx + Math.sin(yy * 0.02 + i * 2) * amp, yy]);
      twin.push([cx + Math.sin(yy * 0.02 + i * 2) * amp + Math.sin(yy * 0.06 + i) * (base + 2), yy]);
    }
    const flare = (u) => base + Math.max(0, 0.12 - u) * 160 + Math.max(0, u - 0.86) * 150;
    ctx.fillStyle = t.far;
    fillPts(ctx, bandPts(main, flare));
    for (const s of [-1, 1]) {
      const [fx, fy] = main[main.length - 3];
      fillPts(ctx, bandPts([[fx, fy], [fx + s * 18, fy + 14], [fx + s * 34, fy + 30]], (u) => 6 - u * 5));
    }
    ctx.fillStyle = shade(t.far, 5);
    fillPts(ctx, bandPts(twin, () => 3));
  });
  // The earthen ceiling, lumpy along its underside.
  ctx.fillStyle = shade(t.far, -5);
  ctx.beginPath();
  ctx.moveTo(0, -1);
  for (let sx = 0; sx <= width + 10; sx += 10) {
    const k = sx + cam.x * 0.25;
    ctx.lineTo(sx, 12 + Math.sin(k * 0.031) * 5 + Math.sin(k * 0.013) * 7);
  }
  ctx.lineTo(width + 10, -1);
  ctx.fill();
  // Roots hanging from it, swaying a little, some ending in a curl.
  repeat(cam.x, 0.25, 26, width, (i, x) => {
    if (hash(i + 11) < 0.3) return;
    const len = 18 + hash(i + 3) * 80;
    const sway = Math.sin(time * 0.7 + i) * 2.4;
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      pts.push([x + Math.sin(u * 5 + i) * 3 + sway * u * u, 6 + u * len]);
    }
    const [ex, ey] = pts[8];
    if (hash(i + 5) > 0.6) pts.push([ex + 3, ey + 3], [ex + 5.4, ey], [ex + 3.6, ey - 2.4]);
    ctx.fillStyle = shade(t.far, -5);
    fillPts(ctx, bandPts(pts, (u) => 3.4 * (1 - u) + 0.6));
  });
}

// Mid layer: outlined landmarks with a little motion — chimney smoke, windmill sails, bobbing boats.
function drawMid(ctx, t, theme, cam, width, y0, time) {
  ctx.save();
  // Woods and towns are busy, so their backdrop sits back a little more.
  ctx.globalAlpha = theme === 'forest' ? 0.72 : theme === 'town' ? 0.88 : 0.92;
  switch (t.skyline) {
    case 'houses':
      repeat(cam.x, 0.45, 120, width, (i, x) => {
        const s = hash(i + 5);
        if (s < 0.22) return place(ctx, treeArt(hash(i), hash(i + 1) > 0.5), x + 48, y0 + 4);
        place(ctx, houseArt(hash(i)), x + 48, y0 + 4);
        smoke(ctx, x + 48 + 17, y0 + 4 - (hash(hash(i) * 5 + 2) > 0.5 ? 92 : 74) + 4, time, i);
      });
      break;
    case 'hills':
      repeat(cam.x, 0.45, 130, width, (i, x) => {
        const s = hash(i + 5);
        if (s < 0.18) place(ctx, windmillArt(Math.floor(time * 4 + i) % 8), x + 65, y0 + 6);
        else if (s < 0.75) place(ctx, treeArt(hash(i), hash(i + 1) > 0.7), x + 65, y0 + 4);
      });
      break;
    case 'sea':
      repeat(cam.x, 0.45, 220, width, (i, x) => {
        const s = hash(i);
        if (s < 0.2) place(ctx, lighthouseArt(), x + 110, y0 + 4);
        else if (s < 0.75) place(ctx, boatArt(pick(['#ff9ec0', '#9fb8ff', '#ffe36b'], hash(i + 2))), x + 110, y0 - 8 + Math.sin(time * 1.6 + i) * 2);
      });
      // The lighthouse beam sweeps over the water.
      repeat(cam.x, 0.45, 220, width, (i, x) => {
        if (hash(i) >= 0.2) return;
        const a = Math.sin(time * 0.9 + i) * 0.9;
        ctx.save();
        const g = ctx.createLinearGradient(0, 0, 90, 0);
        g.addColorStop(0, 'rgba(255,246,201,0.45)');
        g.addColorStop(1, 'rgba(255,246,201,0)');
        ctx.fillStyle = g;
        ctx.translate(x + 110, y0 + 4 - 76);
        ctx.scale(Math.cos(time * 0.9 + i) >= 0 ? 1 : -1, 1);
        ctx.rotate(a * 0.15);
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(90, -12);
        ctx.lineTo(90, 12);
        ctx.lineTo(0, 2);
        ctx.fill();
        ctx.restore();
      });
      // Strings of little lights draped along the docks, twinkling.
      repeat(cam.x, 0.6, 120, width, (i, x) => {
        const sag = 10;
        for (let k = 0; k <= 8; k++) {
          const u = k / 8;
          const lx = x + u * 120;
          const ly = y0 - 54 + Math.sin(u * Math.PI) * sag;
          const c = ['#ffe36b', '#ff9ec0', '#9fd8ff', '#bff0dc'][(k + i) % 4];
          ctx.globalAlpha = 0.6 + 0.35 * Math.sin(time * 3 + k + i);
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.arc(lx, ly + 2, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#3a2d4f';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x, y0 - 54);
        ctx.quadraticCurveTo(x + 60, y0 - 54 + sag * 2, x + 120, y0 - 54);
        ctx.stroke();
        ctx.globalAlpha = 0.92;
      });
      break;
    case 'trees':
      repeat(cam.x, 0.45, 124, width, (i, x) => {
        const s = hash(i + 5);
        if (s < 0.25) place(ctx, mushHouseArt(hash(i)), x + 42, y0 + 4);
        else place(ctx, treeArt(hash(i), false), x + 42, y0 + 4);
      });
      break;
    case 'columns':
      repeat(cam.x, 0.45, 150, width, (i, x) => {
        const s = hash(i + 5);
        if (s < 0.45) place(ctx, archArt(), x + 75, y0 + 4);
        else if (s < 0.8) place(ctx, columnArt(40 + Math.round(hash(i) * 3) * 8), x + 75, y0 + 4);
      });
      break;
    case 'crystals':
      repeat(cam.x, 0.45, 110, width, (i, x) => {
        if (hash(i + 5) < 0.3) return;
        const c = pick(['#a8e8ff', '#e0b8ff', '#ffc6e6'], hash(i));
        glow(ctx, x + 55, y0 - 30, 46, c, 0.25 + 0.15 * Math.sin(time * 2 + i));
        place(ctx, bigCrystalArt(c), x + 55, y0 + 6);
      });
      break;
    case 'mesas':
      repeat(cam.x, 0.45, 140, width, (i, x) => {
        const s = hash(i + 5);
        if (s < 0.35) place(ctx, tentArt(pick(['#ff8a5c', '#ffd66b', '#ff9ec0'], hash(i))), x + 55, y0 + 4);
        else if (s < 0.6) {
          place(ctx, forgeArt(Math.floor(time * 6 + i) % 3), x + 55, y0 + 4);
          glow(ctx, x + 55, y0 - 12, 26, '#ffb35a', 0.35 + 0.15 * Math.sin(time * 7 + i));
          smoke(ctx, x + 70, y0 - 50, time, i);
        } else place(ctx, bannerArt(pick(['#ff6b6b', '#ff9a5c', '#ffd66b'], hash(i)), Math.floor(time * 4 + i) % 3), x + 55, y0 + 4);
      });
      break;
    case 'bigtrees':
      repeat(cam.x, 0.45, 160, width, (i, x) => {
        const s = hash(i + 5);
        if (s < 0.45) place(ctx, treehouseArt(hash(i)), x + 60, y0 + 4);
        else if (s < 0.7) place(ctx, towerArt(), x + 60, y0 + 4);
        else place(ctx, treeArt(hash(i), false, ['#9fb8ff', '#b9a7ff', '#8fd3d6']), x + 60, y0 + 4);
      });
      // Paper lanterns floating up through the trees.
      for (let k = 0; k < 4; k++) {
        const lx = ((hash(k) * width * 1.4 - cam.x * 0.45 + time * 4) % (width + 60) + width + 60) % (width + 60) - 30;
        const ly = y0 - 60 - ((time * (6 + k) + hash(k + 3) * 200) % 220);
        glow(ctx, lx, ly, 14, '#ffd27a', 0.5);
        place(ctx, floatLanternArt(), lx, ly + 6);
      }
      break;
    case 'roots':
      drawMidRoots(ctx, t, cam, width, y0, time);
      break;
    case 'islands':
      repeat(cam.x, 0.45, 200, width, (i, x) => {
        if (hash(i + 5) < 0.4) return;
        place(ctx, islandArt(hash(i), Math.floor(time * 8) % 4), x + 100, y0 - 70 - hash(i + 2) * 40 + Math.sin(time * 0.9 + i) * 3);
      });
      break;
    default:
  }
  ctx.restore();
}

// The hollow's middle layer: root arches with lanterns hung under them, glowing mushroom families,
// and more lanterns dangling from the ceiling on long cords.
function drawMidRoots(ctx, t, cam, width, y0, time) {
  const lantern = (lx, top, len, i, c) => {
    const sw = Math.sin(time * 1.3 + i * 1.7) * 0.12;
    const ex = lx + Math.sin(sw) * len;
    const ey = top + Math.cos(sw) * len;
    ctx.strokeStyle = 'rgba(58,45,79,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, top);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    glow(ctx, ex, ey + 8, 18, c, 0.45 + 0.1 * Math.sin(time * 2.4 + i));
    place(ctx, hangLanternArt(c), ex, ey + 14);
  };
  repeat(cam.x, 0.45, 150, width, (i, x) => {
    const s = hash(i + 5);
    const v = Math.floor(hash(i) * 3);
    if (s < 0.45) {
      for (const [dx, dy, ci] of ARCH_GLOWS) glow(ctx, x + 75 + dx, y0 + 4 + dy, 18, t.shrooms[(v + ci) % 3], 0.4 + 0.12 * Math.sin(time * 2 + i + ci));
      place(ctx, rootArchArt(v), x + 75, y0 + 4);
      lantern(x + 75, y0 + 4 - 80, 14 + hash(i + 2) * 10, i, '#ffd68a');
    } else if (s < 0.8) {
      glow(ctx, x + 75, y0 - 16, 36, t.shrooms[v], 0.38 + 0.12 * Math.sin(time * 1.6 + i));
      place(ctx, mushClusterArt(v, blinking(time, hash(i + 3))), x + 75, y0 + 4);
    }
  });
  repeat(cam.x, 0.5, 210, width, (i, x) => {
    if (hash(i + 31) < 0.35) return;
    lantern(x + 40 + hash(i + 4) * 120, 0, 30 + hash(i + 6) * 50, i + 9, hash(i + 7) > 0.5 ? '#ffd68a' : '#ffb0d0');
  });
}

// Puffs of chimney smoke that rise, grow, and fade.
function smoke(ctx, x, y, time, seed) {
  ctx.save();
  for (let k = 0; k < 3; k++) {
    const u = (time * 0.4 + k / 3 + hash(seed) ) % 1;
    ctx.globalAlpha = 0.55 * (1 - u);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + Math.sin(u * 4 + seed) * 3 + u * 6, y - u * 30, 2.4 + u * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Ground and ledges ----------

// The map's landmarks (giant trees, totems, archways, crystal spires...) and, in towns, houses,
// standing on the ground (or on a ledge, at `y`) behind everything that moves.
const BUILDINGS = {
  house: { w: 70, art: (seed) => houseArt(seed) },
  mushhouse: { w: 56, art: (seed) => mushHouseArt(seed) },
  treehouse: { w: 64, art: (seed) => treehouseArt(seed) },
  windmill: { w: 60, art: (seed, time) => windmillArt(Math.floor(time * 4 + seed * 8) % 8) },
};
function drawDeco(ctx, map, cam, width, time, onLedges) {
  for (const [kind, wx, seed = 0, wy] of map.deco ?? []) {
    if ((wy != null) !== onLedges) continue;
    const b = BUILDINGS[kind];
    const half = (b?.w ?? LANDMARKS[kind]?.w ?? 120) / 2 + 160;
    const x = wx - cam.x;
    if (x + half < 0 || x - half > width) continue;
    const y = snap((wy ?? groundAt(map, wx)) - cam.y);
    if (b) place(ctx, b.art(seed, time), snap(x), y + 2);
    else drawLandmark(ctx, kind, snap(x), y, time, seed);
  }
}


function drawLedges(ctx, t, theme, map, cam, width, height, time) {
  for (const [pi, p] of map.platforms.entries()) {
    const x = Math.round(p.x - cam.x);
    const y = Math.round(p.y - cam.y);
    if (x + p.w < -20 || x > width + 20 || y > height + 30 || y < -40) continue;
    if (theme === 'hollow') rootLedge(ctx, t, x, y, p.w, pi, time);
    else drawIsland(ctx, theme, p, cam, time, pi, map.look);
  }
}

// A thick old root for a ledge: grainy bark, curled tips at both ends, a mossy top that drapes
// over the front, and moss strands dangling below.
function rootLedge(ctx, t, x, y, w, pi, time) {
  const line = edge(t.ledge);
  ctx.lineWidth = 1;
  // Curled root tips poking out of each end.
  for (const s of [-1, 1]) {
    const ex = s < 0 ? x + 6 : x + w - 6;
    const pts = [];
    for (let k = 0; k <= 10; k++) {
      const u = k / 10;
      const a = Math.PI + u * Math.PI * 1.45;
      const r = 6 * (1 - 0.5 * u);
      pts.push([ex + s * (6 + Math.cos(a) * r + u * 2), y + 12 + Math.sin(a) * r]);
    }
    ctx.fillStyle = t.ledge;
    ctx.strokeStyle = line;
    fillPts(ctx, bandPts(pts, (u) => 3.4 * (1 - u) + 0.8));
    ctx.stroke();
  }
  ctx.fillStyle = t.ledgeShade;
  roundRect(ctx, x, y + 3, w, 13, 6.5);
  ctx.fill();
  ctx.fillStyle = t.ledge;
  roundRect(ctx, x, y, w, 11, 6);
  ctx.fill();
  ctx.strokeStyle = line;
  roundRect(ctx, x + 0.5, y - 0.5, w - 1, 16, 7);
  ctx.stroke();
  // Bark grain: broken wavy lines and the odd knot.
  ctx.strokeStyle = mix(t.ledge, line, 0.45);
  for (let dx = 8; dx < w - 14; dx += 22) {
    const k = hash(pi * 31 + dx);
    const gy = y + 6 + (k > 0.5 ? 2.4 : 0);
    ctx.beginPath();
    ctx.moveTo(x + dx, gy);
    ctx.quadraticCurveTo(x + dx + 7, gy - 1.6, x + dx + 12 + k * 4, gy);
    ctx.stroke();
    if (k > 0.78) {
      ctx.beginPath();
      ctx.ellipse(x + dx + 6, y + 11, 2.2, 1.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // Moss on top, bumpy, draping over the front edge in rounded drips.
  ctx.fillStyle = t.ledgeTrim;
  roundRect(ctx, x + 1, y - 2, w - 2, 5, 2.5);
  ctx.fill();
  for (let dx = 5; dx < w - 3; dx += 6) {
    const r = 2 + hash(pi * 7 + dx) * 2.2;
    ctx.beginPath();
    ctx.arc(x + dx, y + 2.4, r, 0, Math.PI);
    ctx.fill();
  }
  ctx.strokeStyle = edge(t.ledgeTrim);
  ctx.beginPath();
  ctx.moveTo(x + 3, y - 2.5);
  ctx.lineTo(x + w - 3, y - 2.5);
  ctx.stroke();
  rect(ctx, x + 3, y - 2, w - 6, 1, shade(t.ledgeTrim, 14));
  // Moss strands swaying underneath, a few with a glowing bead at the tip.
  for (let dx = 12; dx < w - 10; dx += 26) {
    const k = hash(pi * 17 + dx);
    if (k < 0.3) continue;
    const len = 6 + k * 14;
    const sway = Math.sin(time * 1.2 + dx * 0.3 + pi) * 1.6;
    ctx.strokeStyle = '#8fcf94';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + dx, y + 15);
    ctx.quadraticCurveTo(x + dx + sway, y + 15 + len * 0.6, x + dx + sway * 1.4, y + 15 + len);
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#a6dca2';
    for (let j = 1; j <= len / 5; j++) {
      const u = (j * 5) / len;
      ctx.beginPath();
      ctx.ellipse(x + dx + sway * u * 1.4 + (j % 2 ? 1.6 : -1.6), y + 15 + len * u - 1, 1.6, 1, j % 2 ? 0.5 : -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (k > 0.72) {
      const c = pick(t.shrooms, k * 5);
      glow(ctx, x + dx + sway * 1.4, y + 17 + len, 6, c, 0.6 + 0.3 * Math.sin(time * 2 + dx));
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + dx + sway * 1.4, y + 17 + len, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawRopes(ctx, map, cam) {
  for (const r of map.ropes) {
    if (r.ladder) {
      drawLadder(ctx, r, cam);
      continue;
    }
    const x = Math.round(r.x - cam.x);
    const top = r.top - cam.y;
    const bottom = r.bottom - cam.y;
    rect(ctx, x - 3, top, 6, bottom - top, '#8f6d4c');
    rect(ctx, x - 2, top, 4, bottom - top, '#d9b88f');
    rect(ctx, x - 1, top, 1, bottom - top, '#f0d6a8');
    for (let y = top + 6; y < bottom; y += 9) rect(ctx, x - 2, y, 4, 1.4, '#b08860');
    rect(ctx, x - 5, top - 3, 10, 5, '#b08860');
  }
}

function drawPortals(ctx, map, cam, time, nearId) {
  for (const p of map.portals) {
    if (p.hidden) continue;
    const x = p.x - cam.x;
    const y = p.y - cam.y;
    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    const g = ctx.createRadialGradient(x, y - 26, 2, x, y - 26, 30);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.5, `rgba(190,170,255,${0.6 + pulse * 0.2})`);
    g.addColorStop(1, 'rgba(190,170,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y - 26, 18, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = time * 2 + (i * Math.PI * 2) / 6;
      sparkle(ctx, x + Math.cos(a) * 15, y - 26 + Math.sin(a) * 23, i % 2 ? 2.6 : 1.8, i % 3 ? '#ffffff' : '#ffe36b');
    }
    // A little sign naming where the portal goes.
    const dest = p.label ?? MAPS[p.to]?.name;
    if (dest) {
      ctx.font = 'bold 7px sans-serif';
      const w = ctx.measureText(dest).width + 10;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      roundRect(ctx, Math.round(x - w / 2), Math.round(y - 68), w, 11, 5);
      ctx.fill();
      ctx.strokeStyle = '#b9a7ff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#5a3f7a';
      ctx.textAlign = 'center';
      ctx.fillText(dest, Math.round(x), Math.round(y - 60));
      ctx.textAlign = 'left';
    }
    if (p.id === nearId) {
      const bob = Math.sin(time * 6) * 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x, y - 82 + bob);
      ctx.lineTo(x - 6, y - 74 + bob);
      ctx.lineTo(x + 6, y - 74 + bob);
      ctx.fill();
    }
  }
}

// ---------- Props on the ground and ledges ----------

function prop(ctx, kind, x, y, seed, t, time) {
  const sway = Math.floor(time * 2.4 + seed * 9) % 4;
  switch (kind) {
    case 'flower': return place(ctx, flowerArt(pick(FLOWER_COLORS, seed * 3.7), sway), x, y);
    case 'tulip': return place(ctx, tulipArt(pick(FLOWER_COLORS, seed * 5.3), sway), x, y);
    case 'tuft': return place(ctx, tuftArt(t.trim === '#ffffff' ? '#8fdc9a' : t.trim, sway), x, y);
    case 'bush': return place(ctx, bushArt(t.mid === '#ffffff' ? '#8fdc9a' : mix(t.trim, '#7fd19a', 0.5), seed > 0.82, blinking(time, seed)), x, y);
    case 'lamp': {
      glow(ctx, x, y - 36, 22, '#fff3a6', 0.35 + 0.1 * Math.sin(time * 2 + seed * 9));
      place(ctx, lampArt(), x, y);
      // A moth circling the light.
      const a = time * 3 + seed * 10;
      rect(ctx, x + Math.cos(a) * 9, y - 36 + Math.sin(a * 1.3) * 6, 2, 2, '#ffffff');
      return;
    }
    case 'bench': {
      const cat = seed > 0.7;
      place(ctx, benchArt(cat, pick(['#ffb38a', '#f2f2ff', '#7a6a8a'], seed * 7)), x, y);
      if (cat) zzz(ctx, x - 6, y - 12, time, seed);
      return;
    }
    case 'mailbox': return place(ctx, mailboxArt(), x, y);
    case 'sign': return place(ctx, signArt(), x, y);
    case 'fence': return place(ctx, fenceArt(), x, y);
    case 'crate': return place(ctx, crateArt(), x, y);
    case 'barrel': return place(ctx, barrelArt(), x, y);
    case 'buoy': return place(ctx, buoyArt(), x, y + Math.round(Math.sin(time * 2 + seed * 6)));
    case 'mushroom': return place(ctx, mushroomArt(pick(['#ff8fa8', '#ffb38a', '#c9a6ff'], seed * 3), blinking(time, seed)), x, y);
    case 'stump':
      place(ctx, stumpArt(), x, y);
      return zzz(ctx, x + 4, y - 12, time, seed);
    case 'rock': return place(ctx, rockArt(seed > 0.5), x, y);
    case 'column': return place(ctx, columnArt(24 + Math.round(seed * 2) * 6), x, y);
    case 'candle':
      glow(ctx, x, y - 12, 12, '#ffd66b', 0.4 + 0.15 * Math.sin(time * 9 + seed * 5));
      return place(ctx, candleArt(Math.floor(time * 6 + seed * 5) % 3), x, y);
    case 'crystal': {
      const c = seed > 0.5 ? '#a8e8ff' : '#e0b8ff';
      glow(ctx, x, y - 12, 20, c, 0.3 + 0.2 * Math.sin(time * 2 + seed * 10));
      return place(ctx, crystalArt(c, Math.round(seed * 2) / 2), x, y);
    }
    case 'glow':
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(time * 2 + seed * 10);
      sparkle(ctx, x, y - 20 - seed * 30, 3, '#b8f0ff');
      ctx.globalAlpha = 1;
      return;
    case 'star':
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 3 + seed * 10);
      sparkle(ctx, x, y - 10 - seed * 20, 3, '#ffe36b');
      ctx.globalAlpha = 1;
      return;
    case 'cloudpuff': return place(ctx, cloudArt(0.5, null), x, y + 2);
    case 'target': return place(ctx, targetArt(), x, y);
    case 'torch':
      glow(ctx, x, y - 26, 18, '#ffb35a', 0.4 + 0.15 * Math.sin(time * 9 + seed * 5));
      return place(ctx, torchArt(Math.floor(time * 7 + seed * 5) % 3), x, y);
    case 'dummy': return place(ctx, dummyArt(blinking(time, seed)), x, y + (Math.floor(time * 2 + seed * 9) % 6 === 0 ? -1 : 0));
    case 'cactus': return place(ctx, cactusArt(blinking(time, seed)), x, y);
    case 'rack': return place(ctx, rackArt(), x, y);
    case 'cat': return place(ctx, catArt(pick(['#ffb38a', '#f2f2ff', '#7a6a8a', '#3b3650'], seed * 7), Math.floor(time * 2 + seed * 4) % 3), x, y, { flip: seed > 0.6 });
    case 'poster': return place(ctx, posterArt(), x, y);
    case 'lantern':
      glow(ctx, x + 3, y - 22, 16, '#ff9ec0', 0.4 + 0.15 * Math.sin(time * 2 + seed * 7));
      return place(ctx, lanternArt(), x, y);
    case 'glowshroom': {
      const c = pick(t.shrooms ?? ['#8fd3ff', '#c9a6ff', '#9fe0b0'], seed * 3);
      glow(ctx, x, y - 8, 14, c, 0.4 + 0.2 * Math.sin(time * 2 + seed * 9));
      return place(ctx, glowshroomArt(c, blinking(time, seed)), x, y);
    }
    case 'orb':
      glow(ctx, x, y - 16, 14, '#bfe6ff', 0.45 + 0.2 * Math.sin(time * 3 + seed * 6));
      return place(ctx, orbArt(), x, y);
    case 'books': return place(ctx, booksArt(), x, y);
    case 'rootcurl': return place(ctx, rootCurlArt(), x, y, { flip: seed > 0.75 });
    case 'moss': return place(ctx, mossArt(seed > 0.7), x, y + 1);
    case 'pebble': return place(ctx, pebbleArt(seed > 0.6), x, y + 1);
    case 'hlantern':
      glow(ctx, x + 4, y - 17, 18, '#ffd68a', 0.45 + 0.12 * Math.sin(time * 2.4 + seed * 7));
      return place(ctx, hollowLanternArt(), x, y, { flip: seed > 0.75 });
    default:
  }
}

// Sleepy "z"s floating up from something napping.
function zzz(ctx, x, y, time, seed) {
  ctx.save();
  ctx.font = 'bold 6px sans-serif';
  ctx.fillStyle = '#8f7cc4';
  for (let k = 0; k < 2; k++) {
    const u = (time * 0.5 + k / 2 + seed) % 1;
    ctx.globalAlpha = Math.sin(u * Math.PI);
    ctx.fillText('z', x + u * 6 + k * 2, y - u * 10);
  }
  ctx.restore();
}

// Props sit sparsely so monsters and NPCs stay easy to see: fewer on the ground (fewest in towns,
// where buildings fill the street), and only a few small ones on ledges.
const SMALL_PROPS = ['flower', 'tulip', 'tuft', 'rock', 'glowshroom', 'crystal', 'candle', 'cloudpuff', 'moss', 'pebble', 'rootcurl'];
const BIG_PROPS = ['lamp', 'bench', 'mailbox', 'column', 'target', 'dummy', 'rack', 'poster', 'lantern', 'torch', 'bush', 'cat', 'crate', 'barrel', 'cactus', 'hlantern'];

function drawProps(ctx, t, map, cam, width, time) {
  const surfaces = surfacesOf(map).map((s) => ({ x: s.x1, w: s.x2 - s.x1, ground: s.ground, yAt: s.yAt }));
  const keep = map.isTown ? 0.66 : 0.52;
  surfaces.forEach((s, si) => {
    const step = s.ground ? 38 : 44;
    for (let wx = s.x + 14; wx < s.x + s.w - 12; wx += step) {
      const seed = hash(wx * 0.37 + si * 13 + map.width);
      if (seed < (s.ground ? keep : 0.62)) continue;
      // Keep doorways clear around portals and NPCs, and ropes clear on ledges.
      if (s.ground && map.portals.some((p) => Math.abs(p.x - wx) < 44)) continue;
      if (s.ground && map.npcs.some((n) => Math.abs(n.x - wx) < (map.isTown ? 58 : 30))) continue;
      if (s.ground && map.isTown && map.plaza && Math.abs(map.plaza - wx) < 46) continue;
      const sy = s.yAt(wx);
      // Leave room around houses and landmarks standing on a ledge.
      if (!s.ground && (map.deco ?? []).some(([, dx, , dy]) => dy === sy && Math.abs(dx - wx) < 46)) continue;
      if (map.ropes.some((r) => Math.abs(r.x - wx) < 16 && r.top <= sy + 1 && r.bottom >= sy - 1)) continue;
      // Nothing stands on a steep slope.
      if (Math.abs(s.yAt(wx + 6) - s.yAt(wx - 6)) > 5) continue;
      const x = wx - cam.x;
      if (x < -40 || x > width + 40) continue;
      let kind = t.props[Math.floor(hash(wx + si) * t.props.length)];
      // Ledges only get small things.
      if (!s.ground && !SMALL_PROPS.includes(kind)) kind = BIG_PROPS.includes(kind) ? (t.ledgeProp ?? 'flower') : kind;
      prop(ctx, kind, snap(x), snap(sy - cam.y), seed, t, time);
    }
  });
}

// A soft wash of the sky's color over the backdrop, thickest near the ground, so the far and
// middle layers recede and the play layer reads clearly in front.
// Only the band just above the ground, where the middle layer stands, gets it.
const HAZE = 150;
function drawHaze(ctx, t, width, groundScreenY) {
  const bottom = Math.min(360, groundScreenY + 4);
  const top = Math.max(0, bottom - HAZE);
  if (bottom <= top) return;
  const c = t.sky[1];
  const [r, gg, b] = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const g = ctx.createLinearGradient(0, bottom - HAZE, 0, bottom);
  g.addColorStop(0, `rgba(${r},${gg},${b},0)`);
  g.addColorStop(1, `rgba(${r},${gg},${b},0.42)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, top, width, bottom - top);
}

// A band of the sky's color at the foot of a backdrop layer: clear above, thickening down to
// `k` at `y`, and staying that thick below (where nearer layers cover it).
function footHaze(ctx, c, width, height, y, k) {
  if (k <= 0 || y - 60 > height) return;
  const g = ctx.createLinearGradient(0, y - 60, 0, y);
  g.addColorStop(0, hexA(c, 0));
  g.addColorStop(1, hexA(c, k));
  ctx.fillStyle = g;
  ctx.fillRect(0, Math.max(0, y - 60), width, Math.min(height, y + 90) - Math.max(0, y - 60));
}

const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

// ---------- Ambient life ----------

function drawCritters(ctx, t, map, cam, width, height, time) {
  const kinds = t.critters ?? [];
  // Birds hop and peck along the ground.
  if (kinds.includes('bird')) {
    for (let i = 0; i < Math.ceil(map.width / 360); i++) {
      const base = 120 + hash(i * 3.3 + map.width) * (map.width - 240);
      if (map.portals.some((p) => Math.abs(p.x - base) < 50) || map.npcs.some((n) => Math.abs(n.x - base) < 40)) continue;
      const cyc = (time * 0.5 + hash(i)) % 4;
      const hop = cyc < 1 ? Math.abs(Math.sin(cyc * Math.PI * 2)) * 4 : 0;
      const wx = base + (cyc < 1 ? cyc * 16 : 16) * (hash(i + 7) > 0.5 ? 1 : -1);
      const frame = cyc > 2 && cyc % 0.6 < 0.3 ? 2 : 0;
      const x = wx - cam.x;
      if (x < -20 || x > width + 20) continue;
      place(ctx, birdArt(pick(['#ffffff', '#ffd6a5', '#bfe0ff', '#ffc6de'], hash(i + 2)), frame), x, groundAt(map, wx) - cam.y - hop, { flip: hash(i + 7) <= 0.5 });
    }
  }
  // Butterflies flutter in loops above the ground.
  if (kinds.includes('butterfly')) {
    for (let i = 0; i < Math.ceil(map.width / 520); i++) {
      const bx = 100 + hash(i * 5.1 + 2) * (map.width - 200) + Math.sin(time * 0.6 + i) * 60;
      const by = groundAt(map, bx) - 40 - hash(i + 9) * 90 + Math.sin(time * 1.7 + i * 2) * 14;
      const x = bx - cam.x;
      if (x < -20 || x > width + 20) continue;
      place(ctx, butterflyArt(pick(['#ff9ec0', '#ffe36b', '#c9a6ff', '#8fd3ff'], hash(i + 1)), Math.floor(time * 8 + i) % 2), x, by - cam.y);
    }
  }
  // Gulls glide across the sky.
  if (kinds.includes('gull')) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const gx = ((hash(i) * 900 + time * (14 + i * 4)) % 900) - 130;
      const gy = 50 + hash(i + 3) * 60 + Math.sin(time + i) * 6;
      const flap = Math.sin(time * 6 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(gx - 6, gy - flap);
      ctx.quadraticCurveTo(gx - 3, gy - 3, gx, gy);
      ctx.quadraticCurveTo(gx + 3, gy - 3, gx + 6, gy - flap);
      ctx.stroke();
    }
  }
  // Fireflies drift and pulse.
  if (kinds.includes('firefly')) {
    for (let i = 0; i < 9; i++) {
      const fx = (hash(i) * width + Math.sin(time * 0.5 + i) * 30 - cam.x * 0.3) % width;
      const fy = height * (0.25 + hash(i + 5) * 0.6) + Math.sin(time * 0.8 + i * 2) * 12;
      const a = 0.4 + 0.6 * Math.max(0, Math.sin(time * 2 + i * 1.3));
      const x = fx < 0 ? fx + width : fx;
      glow(ctx, x, fy, 7, '#fff6a0', a * 0.6);
      rect(ctx, x - 1, fy - 1, 2, 2, '#fffbe0');
    }
  }
}

// Petals, leaves, motes, or sparkles drifting through the air, in three depth bands: a faint,
// small, slow one far back (tinted toward the sky), the main one among the scenery, and a few big,
// fast ones in front of the characters. All of them ride the same wind.
const DRIFT_BANDS = {
  back: { n: 10, size: 0.6, alpha: 0.5, par: 0.3, speed: 0.6, seed: 100, air: 0.45 },
  mid: { n: 9, size: 1, alpha: 1, par: 0.6, speed: 1, seed: 0, air: 0 },
  front: { n: 4, size: 1.9, alpha: 0.75, par: 1.25, speed: 1.35, seed: 200, air: 0 },
};
function drawDrift(ctx, t, cam, width, height, time, which = 'mid') {
  if (!t.drift) return;
  const band = DRIFT_BANDS[which];
  const base = { petal: ['#ffc6de', '#ffe3ef', '#ffffff'], leaf: ['#9fe0b0', '#c4f2a8', '#ffd6a5'], mote: ['#ffe6ff', '#fff6c9'], sparkle: ['#ffffff', '#c9f2ff', '#ffe36b'], ember: ['#ffb35a', '#ff8a5c', '#ffe36b'], spore: t.shrooms }[t.drift];
  const colors = band.air ? base.map((c) => mix(c, t.sky[1], band.air)) : base;
  // Embers rise from the forges and spores float up from the mushrooms instead of falling.
  const rise = t.drift === 'ember' || t.drift === 'spore' ? -1 : 1;
  const spore = t.drift === 'spore';
  const k = band.size;
  const blow = windTravel(time) * 1.3 * band.speed;
  const gust = wind(time);
  ctx.save();
  const n = spore ? Math.round(band.n * 1.5) : band.n;
  for (let j = 0; j < n; j++) {
    const i = j + band.seed;
    const speed = (10 + hash(i + 2) * 14) * (spore ? 0.45 : 1) * band.speed;
    const x = (((hash(i) * width + blow * (10 + hash(i + 2) * 14) * (spore ? 0.45 : 1) - cam.x * band.par) % (width + 40)) + width + 40) % (width + 40) - 20;
    const y = (((hash(i + 7) * height + time * speed * rise) % (height + 20)) + height + 20) % (height + 20) - 10;
    const wob = Math.sin(time * 2 + i) * 4 * k;
    const c = colors[j % colors.length];
    ctx.globalAlpha = 0.85 * band.alpha;
    if (t.drift === 'ember') {
      ctx.globalAlpha = (0.5 + 0.4 * Math.abs(Math.sin(time * 3 + i))) * band.alpha;
      rect(ctx, x + wob, y, 2 * k, 2 * k, c);
      continue;
    }
    if (spore) {
      const a = (0.45 + 0.45 * Math.abs(Math.sin(time * 1.4 + i * 1.9))) * band.alpha;
      glow(ctx, x + wob * 1.5, y, 6 * k, c, a * 0.7);
      ctx.globalAlpha = a;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + wob * 1.5, y, (1.4 + (j % 3) * 0.3) * k, 0, Math.PI * 2);
      ctx.fill();
      rect(ctx, x + wob * 1.5 - 0.5, y - 0.5, 1, 1, '#ffffff');
      continue;
    }
    if (t.drift === 'sparkle' || t.drift === 'mote') {
      ctx.globalAlpha = (0.4 + 0.5 * Math.abs(Math.sin(time * 2 + i))) * band.alpha;
      sparkle(ctx, x + wob, y, (1.6 + (j % 3) * 0.6) * k, c);
      continue;
    }
    // Petals and leaves tumble, and tip over further when a gust blows.
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x + wob, y, 2.6 * k, 1.4 * k, Math.sin(time * 3 + i) * 1.2 + gust * 0.5, 0, Math.PI * 2);
    ctx.fill();
    if (which === 'front') {
      ctx.globalAlpha = 0.5 * band.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x + wob - 0.8 * k, y - 0.4 * k, 1 * k, 0.5 * k, Math.sin(time * 3 + i) * 1.2 + gust * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ---------- The foreground ----------

// Out-of-focus things just in front of the camera that frame the view from the top edge: leaf
// clumps in the woods, roots in the hollow, vines in the ruins, crystal shards in caves, blossom
// branches in spring maps, cloud wisps in the sky, and strings of lights over the harbor. They
// scroll faster than the world (they're nearer), sway with the wind, and turn see-through when
// anyone is under them, so they never hide a fight.
const FRONT_COLORS = {
  leaves: ['#4f9a6e', '#5fae7a', '#3f8a66'],
  grove: ['#5a4aa0', '#6a58b4', '#4c3f8e'],
  roots: ['#5a3f4c', '#6c4c58', '#4a3442'],
  vines: ['#5a9a7a', '#6aae86', '#4c8a70'],
  crystals: ['#5c4aa6', '#6e5cc0', '#4a3c90'],
  blossoms: ['#b88a7a', '#ffb3cf', '#ff9ec0'],
  clouds: ['#ffffff', '#f4f6ff', '#ffffff'],
};
const FRONT_W = 130;
const FRONT_H = 96;
const fronts = new Map();
// Each piece is painted once, softly blurred (it's out of focus), and reused.
function frontArt(kind, v) {
  const res = Math.max(1, Math.round(gfx.scale || 1));
  const key = `${kind}|${v}|${res}`;
  let c = fronts.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = FRONT_W * res;
    c.height = FRONT_H * res;
    const g = c.getContext('2d');
    g.filter = `blur(${(kind === 'clouds' ? 2 : 1.1) * res}px)`;
    g.scale(res, res);
    paintFront(g, kind, v, FRONT_COLORS[kind]);
    fronts.set(key, c);
  }
  return c;
}

// Paints a foreground piece hanging from (FRONT_W / 2, 0).
function paintFront(g, kind, v, [c0, c1, c2]) {
  const cx = FRONT_W / 2;
  const r = (n) => hash(v * 13.7 + n);
  const leaf = (x, y, rx, ry, a, c) => {
    g.fillStyle = c;
    g.beginPath();
    g.ellipse(x, y, rx, ry, a, 0, Math.PI * 2);
    g.fill();
  };
  const stem = (pts, w, c) => {
    g.fillStyle = c;
    fillPts(g, bandPts(pts, (u) => w * (1 - u * 0.7)));
  };
  const curve = (x0, len, bend, n = 8) => Array.from({ length: n + 1 }, (_, k) => [x0 + Math.sin((k / n) * 2.2) * bend, -4 + (k / n) * len]);
  if (kind === 'leaves' || kind === 'grove') {
    // Two or three twigs, each ending in a clump of overlapping leaves.
    for (let s = 0; s < 2 + Math.floor(r(1) * 2); s++) {
      const x0 = cx - 34 + s * 30 + r(s + 2) * 14;
      const len = 26 + r(s + 5) * 34;
      const bend = (r(s + 8) - 0.5) * 20;
      const pts = curve(x0, len, bend);
      stem(pts, 2, c2);
      const [tx, ty] = pts[pts.length - 1];
      for (let j = 0; j < 9; j++) {
        const a = (j / 9) * Math.PI * 2 + r(j + 11);
        const d = 4 + r(j + 20) * 8;
        leaf(tx + Math.cos(a) * d, ty + Math.sin(a) * d * 0.7 - 2, 8 + r(j + 30) * 3, 4.2, a, j % 3 ? c0 : c1);
      }
      for (const u of [0.35, 0.65]) {
        const [lx, ly] = pts[Math.round(u * 8)];
        leaf(lx + 6, ly, 7, 3.4, 0.6, c1);
        leaf(lx - 6, ly + 3, 7, 3.4, -0.6, c0);
      }
    }
  } else if (kind === 'roots') {
    // Gnarled roots hanging from the den's ceiling, tapering, one or two curling at the tip.
    g.fillStyle = c2;
    g.beginPath();
    g.ellipse(cx, -6, 58, 14, 0, 0, Math.PI * 2);
    g.fill();
    for (let s = 0; s < 3; s++) {
      const x0 = cx - 34 + s * 30 + r(s + 2) * 10;
      const len = 30 + r(s + 5) * 46;
      const pts = curve(x0, len, (r(s + 8) - 0.5) * 18);
      if (r(s + 14) > 0.5) {
        const [ex, ey] = pts[pts.length - 1];
        pts.push([ex + 4, ey + 4], [ex + 7, ey], [ex + 4.5, ey - 3]);
      }
      stem(pts, 5 + r(s + 3) * 2, s % 2 ? c0 : c1);
    }
  } else if (kind === 'vines') {
    // Long vines with leaf pairs down their length.
    for (let s = 0; s < 3; s++) {
      const x0 = cx - 36 + s * 34 + r(s + 2) * 10;
      const len = 34 + r(s + 5) * 50;
      const pts = curve(x0, len, (r(s + 8) - 0.5) * 12, 10);
      stem(pts, 1.4, c2);
      for (let k = 2; k <= 10; k += 2) {
        const [lx, ly] = pts[k];
        leaf(lx + 4, ly, 5, 2.6, 0.5, c0);
        leaf(lx - 4, ly + 2, 5, 2.6, -0.5, c1);
      }
    }
  } else if (kind === 'crystals') {
    // A cluster of shards hanging point-down, each with a lit facet.
    for (let s = 0; s < 4; s++) {
      const x = cx - 36 + s * 22 + r(s + 2) * 10;
      const w = 7 + r(s + 4) * 9;
      const len = 26 + r(s + 6) * 46;
      g.fillStyle = s % 2 ? c0 : c2;
      g.beginPath();
      g.moveTo(x - w, -2);
      g.lineTo(x + w, -2);
      g.lineTo(x + w * 0.2, len);
      g.closePath();
      g.fill();
      g.fillStyle = c1;
      g.beginPath();
      g.moveTo(x - w * 0.2, -2);
      g.lineTo(x + w * 0.6, -2);
      g.lineTo(x + w * 0.2, len * 0.85);
      g.closePath();
      g.fill();
    }
  } else if (kind === 'blossoms') {
    // A cherry branch reaching in from above, dotted with blossoms.
    const pts = [[cx - 58, -4], [cx - 30, 14 + r(1) * 8], [cx, 22 + r(2) * 10], [cx + 34, 26 + r(3) * 12], [cx + 56, 40 + r(4) * 10]];
    stem(pts, 3, c0);
    const twig = [[cx - 4, 22], [cx + 6, 40 + r(5) * 10], [cx + 4, 54 + r(6) * 10]];
    stem(twig, 1.6, c0);
    for (const [bx, by] of [...pts.slice(1), ...twig.slice(1), [cx - 16, 24], [cx + 20, 34], [cx + 46, 30]]) {
      for (let j = 0; j < 5; j++) {
        const a = (j / 5) * Math.PI * 2;
        leaf(bx + Math.cos(a) * 3.4, by + Math.sin(a) * 3.4, 3.4, 3.4, 0, j % 2 ? c1 : c2);
      }
      leaf(bx, by, 1.6, 1.6, 0, '#fff3c4');
    }
  } else if (kind === 'clouds') {
    // A soft cloud wisp drifting by just under the top edge.
    g.globalAlpha = 0.85;
    for (let j = 0; j < 6; j++) leaf(cx - 46 + j * 18 + r(j) * 8, 6 + r(j + 9) * 10, 16 + r(j + 3) * 10, 12 + r(j + 6) * 6, 0, j % 2 ? c0 : c1);
    g.globalAlpha = 1;
  }
}

// The harbor's front layer: strings of little lights sagging across the top of the view.
function drawGarlands(ctx, cam, width, time, fade) {
  repeat(cam.x, 1.25, 260, width, (i, x) => {
    if (hash(i + 70) < 0.4) return;
    const sag = 18 + hash(i + 71) * 14;
    const top = -4 + hash(i + 72) * 6;
    const a = fade(x + 130);
    ctx.save();
    ctx.globalAlpha = 0.75 * a;
    ctx.strokeStyle = '#3a2d4f';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.quadraticCurveTo(x + 130, top + sag * 2, x + 260, top);
    ctx.stroke();
    for (let k = 1; k < 12; k++) {
      const u = k / 12;
      const lx = x + u * 260;
      const ly = top + 4 * sag * u * (1 - u) + 3;
      const c = ['#ffe36b', '#ff9ec0', '#9fd8ff', '#bff0dc'][(k + i) % 4];
      const tw = 0.65 + 0.35 * Math.sin(time * 3 + k * 1.7 + i);
      ctx.globalAlpha = a;
      glow(ctx, lx, ly, 9, c, 0.45 * tw);
      ctx.globalAlpha = a;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(lx, ly, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

const FRONTS = { forest: 'leaves', grove: 'grove', hollow: 'roots', ruins: 'vines', cave: 'crystals', sky: 'clouds', harbor: 'garland' };

// Everything in front of the characters: the foreground framing pieces and the nearest band of
// drifting petals or sparks. `actors` are the screen boxes ({ x, top }) of the player and the
// monsters, which the pieces turn see-through over.
export function drawSceneFront(ctx, map, cam, width, height, time, actors = []) {
  const theme = THEMES[map.theme] ? map.theme : 'meadow';
  const t = map.look ? { ...THEMES[theme], ...map.look } : THEMES[theme];
  const kind = t.front !== undefined ? t.front : FRONTS[theme];
  // How solid a piece centered at screen x is: see-through when anyone near it stands high on
  // the screen (on a ledge just under it).
  const fade = (x) => {
    let k = 1;
    for (const a of actors) {
      if (a.top > 92) continue;
      k = Math.min(k, Math.max(0, (Math.abs(a.x - x) - 45) / 45));
    }
    return 0.3 + 0.7 * k;
  };
  if (kind === 'garland') drawGarlands(ctx, cam, width, time, fade);
  else if (kind) {
    repeat(cam.x, 1.25, 170, width, (i, x) => {
      if (hash(i + 60) < 0.5) return;
      const v = Math.floor(hash(i + 61) * 3);
      const c = frontArt(kind, v);
      const scale = 0.8 + hash(i + 62) * 0.3;
      const ax = x + 85;
      const sway = kind === 'clouds' ? 0 : (windAt(time, cam.x * 1.25 + ax) - 0.6) * 0.06 + Math.sin(time * 1.1 + i) * 0.02;
      const drift = kind === 'clouds' ? Math.sin(time * 0.3 + i) * 10 : 0;
      ctx.save();
      ctx.globalAlpha = (kind === 'clouds' ? 0.7 : 0.92) * fade(ax);
      ctx.translate(ax + drift, -2);
      ctx.rotate(sway);
      ctx.scale(hash(i + 63) > 0.5 ? -scale : scale, scale);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(c, -FRONT_W / 2, 0, FRONT_W, FRONT_H);
      ctx.restore();
    });
  }
  drawDrift(ctx, t, cam, width, height, time, 'front');
}

// Everything behind the characters.
export function drawSceneBack(ctx, map, cam, width, height, time, nearPortalId, street = null) {
  const theme = THEMES[map.theme] ? map.theme : 'meadow';
  // A map can restyle its theme (its own sky, skyline, drift...) so no two maps look alike.
  const t = map.look ? { ...THEMES[theme], ...map.look } : THEMES[theme];
  // Layers sit just above the ground when the camera is at the bottom of the map, and scroll
  // vertically at a fraction of the camera so taller maps still feel deep.
  const camBottom = Math.max(0, map.height - height);
  // Like Maple's backgrounds they barely move up and down (a tenth of the camera at most), so the
  // skyline stays planted while you climb.
  const layerY = (lift, factor) => map.groundY - lift - camBottom - (cam.y - camBottom) * factor;
  // Depth: each plane further back is paler, softer, and nearer the sky's color, its outlines fade
  // with it, and a band of haze sits at its foot so it stands in air. `look.aerial` scales it.
  const air = t.sky[1];
  const aerial = t.aerial ?? 1;
  const far = { ...t, far: mix(t.far, air, 0.3 * aerial) };
  const backdrop = (g) => {
    drawSky(g, t, theme, width, height, time);
    drawClouds(g, theme, cam, width, time, air);
    const farY = layerY(50, 0.05);
    veil = { color: air, k: 0.5 * aerial };
    drawFar(g, far, cam, width, farY, time);
    footHaze(g, air, width, height, farY + 24, 0.3 * aerial);
    veil = { color: air, k: 0.22 * aerial };
    drawMid(g, t, theme, cam, width, layerY(10, 0.1), time);
    veil = null;
    drawHaze(g, t, width, map.groundY - cam.y);
  };
  backdrop(ctx);
  drawDrift(ctx, t, cam, width, height, time, 'back');
  drawTerrain(ctx, theme, map, cam, width, height, time);
  drawDeco(ctx, map, cam, width, time, false);
  // Town buildings stand on the street, behind ledges and props.
  street?.();
  drawLedges(ctx, t, theme, map, cam, width, height, time);
  drawDeco(ctx, map, cam, width, time, true);
  drawProps(ctx, t, map, cam, width, time);
  drawRopes(ctx, map, cam);
  drawPortals(ctx, map, cam, time, nearPortalId);
  drawCritters(ctx, t, map, cam, width, height, time);
  drawDrift(ctx, t, cam, width, height, time);
}
