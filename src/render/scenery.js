// Map scenery in the same outlined, flat-colored chibi style as the characters: themed skies with a
// smiling sun and cloud friends, parallax buildings and trees, ground and ledges with soft outlines,
// little props (many of them with faces), and ambient life — critters, falling petals, fireflies,
// chimney smoke, bobbing boats. World-to-screen is (wx - cam.x, wy - cam.y). Layouts are seeded so
// nothing jitters as you move; animation comes only from `time`.

import { R, E, T, F, sprite, blit, shade, mix, snap, tinted } from './pixel.js';
import { groundAt, surfacesOf, driftOffset } from '../world/physics.js';
import { drawMovers } from './movers.js';
import { drawTerrain, drawIsland, drawLadder, wind, windTravel, windAt } from './terrain.js';
import { drawLandmark, LANDMARKS } from './landmarks.js';
import { ramp, foliage, lightUL, flagShapes, leanFrame, swing, pivoted, flicker, stones, planks, bark, windowPane, wallShade, beam, gable } from './propkit.js';
import { MAPS } from '../data/maps.js';
import { drawCat } from './critters.js';
import { drawPaintedForest, drawPaintedForestFront, drawWoodlandLife, leafShape, drawPaintedMeadow, drawMeadowLife, drawPaintedTownFar, drawVillageLife, washingLine, drawPaintedTownFront } from './painted.js';
import { drawPortalGate } from './portals.js';
import { drawFarRoom, drawFarWhaleRoom, drawMidRoom } from './rooms.js';
import { levelRange } from '../world/routes.js';
import { pineArt, stoneLampArt, smallToriiArt, pagodaArt, bambooArt, reedArt, snowTuftArt, chimeArt } from './regions.js';

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
    critters: ['bird', 'butterfly'], drift: 'petal', face: 'sun', painted: 'town',
  },
  meadow: {
    sky: ['#8fdcff', '#c9efff', '#fff6dc'], sun: '#fffbe0', far: '#c4efcf', mid: '#a8e2b8', midTrim: '#7fd19a',
    ground: '#ecc595', groundDeep: '#d9ab79', trim: '#86df86', ledge: '#f0cf9e', ledgeTrim: '#8fe39a', ledgeShade: '#d8b07e',
    skyline: 'hills', props: ['flower', 'tuft', 'flower', 'bush', 'tulip', 'tuft', 'rock'],
    critters: ['butterfly', 'bird', 'butterfly'], drift: 'petal', face: 'sun', rainbow: 0.28, painted: 'meadow',
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
    critters: ['bird', 'hawk'], drift: 'ember', face: 'sun',
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
    critters: ['firefly', 'butterfly'], drift: 'leaf', face: 'sun', painted: 'forest',
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
  // The Fox Shrine Path at sunset: a stone path through cherry trees, vermilion gates, stone
  // lanterns, pagodas on the hills behind, petals on the wind.
  shrine: {
    sky: ['#ff9ec6', '#ffc8b4', '#fff0d6'], sun: '#fff1c9', far: '#e9a2bf', mid: '#f6c4d4', midTrim: '#e08aa8',
    ground: '#ddc8ba', groundDeep: '#c4a898', trim: '#ffc6de', ledge: '#e6d2c4', ledgeTrim: '#ffd0e2', ledgeShade: '#c8aa9c',
    skyline: 'pagodas', props: ['stonelamp', 'tuft', 'flower', 'tuft', 'bush', 'stonelamp'],
    critters: ['butterfly', 'bird'], drift: 'petal', face: 'sun',
  },
  // Moonlit Ridge: blue night on the mountain, a huge moon, pines on the slopes, wolves' country.
  ridge: {
    sky: ['#1f2658', '#46509c', '#9a8ad6'], sun: '#e6ecff', far: '#3c4688', mid: '#4f5aa2', midTrim: '#7a86d0',
    ground: '#8a90c6', groundDeep: '#6e74ae', trim: '#a8d8c8', ledge: '#9aa0d2', ledgeTrim: '#b8e6d6', ledgeShade: '#6c72aa',
    skyline: 'peaks', props: ['rock', 'pine', 'tuft', 'rock', 'tuft'],
    critters: ['firefly'], drift: 'mote', face: 'moon', stars: true, bigMoon: true,
  },
  // Serpent Springs: steaming turquoise pools in a mossy gorge, bamboo, reeds, warm mist.
  springs: {
    sky: ['#7cc6d6', '#c4e6e6', '#fff0e2'], sun: '#fff6dc', far: '#8cbcc6', mid: '#a4d4cc', midTrim: '#7cbcb0',
    ground: '#c8aaa2', groundDeep: '#ac8e8a', trim: '#9fe0c0', ledge: '#d4bcb2', ledgeTrim: '#aee8cc', ledgeShade: '#ae928c',
    skyline: 'cliffs', props: ['reed', 'rock', 'tuft', 'stonelamp', 'reed'],
    critters: ['butterfly', 'firefly'], drift: 'steam', face: 'sun',
  },
  // Frozen Peak: snowfields under a pale sky, snow-laden pines, icicles under every ledge.
  snow: {
    sky: ['#a6c6ff', '#dde9ff', '#f8fbff'], sun: '#ffffff', far: '#c4d4f4', mid: '#dce8ff', midTrim: '#b6c6ee',
    ground: '#eef3ff', groundDeep: '#c8d4f0', trim: '#ffffff', ledge: '#f4f8ff', ledgeTrim: '#ffffff', ledgeShade: '#c4d0ee',
    skyline: 'peaks', snowcaps: true, props: ['snowtuft', 'pine', 'snowtuft', 'rock'],
    critters: ['bird'], drift: 'snow', face: 'sun',
  },
  // Moonlit Manor: a haunted manor by moonlight, spooky-cute: violet night, warm windows, candles.
  manor: {
    sky: ['#2a2458', '#5a4a96', '#a88ad0'], sun: '#fff6d8', far: '#4a3a7a', mid: '#6a5a9a', midTrim: '#c9a6ff',
    ground: '#8a6ab8', groundDeep: '#6a4e98', trim: '#c9b6ff', ledge: '#a888d0', ledgeTrim: '#e6d6ff', ledgeShade: '#7a5aa8',
    skyline: 'manor', props: ['candle', 'flower', 'tuft', 'candle'],
    critters: ['firefly'], drift: 'mote', face: 'moon', stars: true,
  },
  // The Sunken Aquarium Palace: deep teal water, sunbeams, coral and kelp, bubbles rising.
  aquarium: {
    sky: ['#1a4a6e', '#2a6a8a', '#4a9ab0'], sun: '#e6fbff', far: '#1e5a7a', mid: '#2a7a8a', midTrim: '#ff9ab8',
    ground: '#e8d4b0', groundDeep: '#c8b090', trim: '#ff9ab8', ledge: '#f0dcc0', ledgeTrim: '#ffb3cf', ledgeShade: '#c8a88a',
    skyline: 'reef', props: ['tuft', 'rock', 'tuft'],
    critters: [], drift: 'bubble', face: null,
  },
  // The Clockwork Carnival: a violet night fairground, string lights, striped tents, confetti.
  carnival: {
    sky: ['#2a2a6a', '#7a4aa8', '#ff9ab8'], sun: '#fff6d8', far: '#4a3a8a', mid: '#6a4aa8', midTrim: '#ffd36b',
    ground: '#e8c8a0', groundDeep: '#c8a078', trim: '#ff7aa8', ledge: '#ffe0b0', ledgeTrim: '#ff7aa8', ledgeShade: '#c8a078',
    skyline: 'carnival', props: ['tuft', 'flower', 'tuft'],
    critters: ['firefly'], drift: 'confetti', face: 'moon', stars: true,
  },
  // The Star Observatory: deep night blue, the Milky Way, brass and starlight.
  observatory: {
    sky: ['#0e1440', '#2a2a7a', '#6a5ab0'], sun: '#fff6d8', far: '#1e2a5a', mid: '#2e3a72', midTrim: '#fff3a6',
    ground: '#9a9ac8', groundDeep: '#7a7aaa', trim: '#fff3a6', ledge: '#b8b8e0', ledgeTrim: '#fff3a6', ledgeShade: '#7a7aaa',
    skyline: 'stars', props: ['tuft', 'rock'],
    critters: ['firefly'], drift: 'sparkle', face: 'moon', stars: true,
  },
  // The Candy Volcano: a pink-and-gold sky, gumdrop hills, candy canes, sprinkles in the air.
  candy: {
    sky: ['#ff9ab8', '#ffc8a0', '#fff0c8'], sun: '#fff6d8', far: '#e08aa8', mid: '#f0a8c0', midTrim: '#ffd36b',
    ground: '#f0c8a0', groundDeep: '#d8a078', trim: '#ff9ab8', ledge: '#ffe0b0', ledgeTrim: '#ff9ab8', ledgeShade: '#d8a078',
    skyline: 'candy', props: ['flower', 'tuft', 'flower'],
    critters: ['butterfly'], drift: 'sprinkle', face: 'sun',
  },
  // The Sky Whale's Back: a high bright sky over a sea of cloud, sails and pennants.
  skywhale: {
    sky: ['#5a9ae0', '#9fd0ff', '#fff0d8'], sun: '#fffbe6', far: '#8ab8e8', mid: '#b8d8f6', midTrim: '#ffffff',
    ground: '#6a8ac0', groundDeep: '#4a6a9a', trim: '#eaf6ff', ledge: '#e8b080', ledgeTrim: '#ffd36b', ledgeShade: '#8a5a3a',
    skyline: 'whaleback', props: ['cloudpuff', 'cloudpuff', 'pebble'],
    critters: ['gull'], drift: 'sparkle', face: 'sun',
  },
  // The Dream Theatre: a dusky violet evening over the clouds, gold marquee lights, velvet.
  theatre: {
    sky: ['#4a2a6a', '#a05a9a', '#ffb0a0'], sun: '#fff0d0', far: '#6a3a7a', mid: '#8a4a7a', midTrim: '#ffd36b',
    ground: '#c88a5a', groundDeep: '#8a5a3a', trim: '#ffd36b', ledge: '#e8b080', ledgeTrim: '#ffd36b', ledgeShade: '#8a5a3a',
    skyline: 'theatre', props: ['tuft', 'flower'],
    critters: [], drift: 'sparkle', face: 'moon', stars: true,
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

// Scenery sprites sit a contrast tier below the characters: thin outlines in a darkened shade of
// each part's own colour (non-crisp), and every part shaded by one light from the upper left
// (`lightUL`), unless `lit` is false for pieces shaded by hand.
export function art(key, w, h, build, lit = true) {
  return sprite(`scn|${key}`, () => {
    const shapes = build().filter(Boolean);
    return { w, h, shapes: lit ? lightUL(shapes) : shapes, res: 2, soft: 'cel' };
  });
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
    softenRim(g, c.width, c.height, s.res ?? 1);
    g.globalAlpha = k;
    g.drawImage(tinted(s, color), 0, 0);
    byKey.set(key, c);
    // (A few colours kept for each picture: the backdrop's colour only changes in steps now, but
    // a long day of play shouldn't pile them up.)
    if (byKey.size > 12) byKey.delete(byKey.keys().next().value);
  }
  return c;
}

// Backdrop sprites lose their hard silhouette line: the outline ring (`w` pixels deep) is pulled
// most of the way toward the fill just inside it, so distant things read by value, not by ink.
function softenRim(g, W, H, w) {
  const img = g.getImageData(0, 0, W, H);
  const d = img.data;
  const depth = new Uint8Array(W * H);
  let ring = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (d[i * 4 + 3] < 8) continue;
      const out = (xx, yy) => xx < 0 || yy < 0 || xx >= W || yy >= H || d[(yy * W + xx) * 4 + 3] < 8;
      if (out(x - 1, y) || out(x + 1, y) || out(x, y - 1) || out(x, y + 1)) {
        depth[i] = 1;
        ring.push(i);
      }
    }
  }
  const rings = [ring];
  for (let k = 2; k <= w + 1; k++) {
    const next = [];
    for (const i of ring) {
      const x = i % W;
      for (const j of [i - 1, i + 1, i - W, i + W]) {
        if (j < 0 || j >= W * H || Math.abs((j % W) - x) > 1 || depth[j] || d[j * 4 + 3] < 8) continue;
        depth[j] = k;
        next.push(j);
      }
    }
    rings.push(next);
    ring = next;
  }
  // From the inside out, each outline pixel takes on the colour of a deeper neighbour.
  for (let k = w; k >= 1; k--) {
    for (const i of rings[k - 1]) {
      const x = i % W;
      let src = -1;
      for (const j of [i - 1, i + 1, i - W, i + W, i - W - 1, i - W + 1, i + W - 1, i + W + 1]) {
        if (j < 0 || j >= W * H || Math.abs((j % W) - x) > 1 || depth[j] <= k && depth[j] !== 0) continue;
        if (d[j * 4 + 3] < 8) continue;
        src = j;
        break;
      }
      if (src < 0) continue;
      for (let ch = 0; ch < 3; ch++) d[i * 4 + ch] = Math.round(d[i * 4 + ch] + (d[src * 4 + ch] - d[i * 4 + ch]) * 0.65);
    }
  }
  g.putImageData(img, 0, 0);
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

// Small plants take one of five wind poses (`frame` 0 ... 4): the stem bends from its root and
// the head swings furthest.
function flowerArt(color, frame) {
  const dx = (frame - 2) * 0.45;
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
  const dx = (frame - 2) * 0.4;
  return art(`tulip|${color}|${frame}`, 10, 16, () => {
    const cx = 5 + dx;
    return [T([[4.6, 16], [5.4, 16], [cx + 0.4, 8], [cx - 0.4, 8]], STEM), T([[5, 16], [1.6, 10], [4.4, 13]], STEM),
      T([[cx - 2.6, 4], [cx - 1.2, 5.4], [cx, 3.6], [cx + 1.2, 5.4], [cx + 2.6, 4], [cx + 2.2, 8.6], [cx - 2.2, 8.6]], color),
      F(E(cx - 1, 6, 0.5, 1, shade(color, 18)))];
  });
}

function tuftArt(color, frame) {
  const dx = (frame - 2) * 0.5;
  const r = ramp(color);
  // Back blades in shadow, front blades lit at the tips.
  return art(`tuft|${color}|${frame}`, 12, 8, () => [
    T([[2, 8], [4.6, 8], [1.6 + dx * 0.8, 2]], r.sh), T([[7.4, 8], [10, 8], [10.4 + dx * 0.8, 2.6]], r.sh), T([[4.4, 8], [7.6, 8], [6 + dx, 0.4]], color), F(T([[5.4, 4], [6.4, 4], [6 + dx, 0.4]], r.hi)),
  ], false);
}

function bushArt(color, peek, blink) {
  return art(`bush|${color}|${peek}|${blink}`, 26, 16, () => {
    const r = ramp(color);
    const out = [...foliage(18, 10, 8, 6, ramp(mix(color, r.sh, 0.4)), 2, { tips: 1 }), ...foliage(8, 10.4, 7.6, 5.6, r, 1, { tips: 1 }), ...foliage(13, 6.4, 7, 6, r, 3, { tips: 2 })];
    if (peek) out.push(...face(13, 9, 2.2, blink ? 'closed' : 'open', 'none'));
    else out.push(F(E(6, 11, 0.9, 0.9, '#ff7f9f')), F(E(20, 12, 0.9, 0.9, '#ff7f9f')), F(E(16, 8, 0.9, 0.9, '#ff7f9f')));
    return out;
  }, false);
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
  }, false);
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
  }, false);
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
    const w = ramp(wall, 0.6);
    const door = ramp('#d39a6a', 0.8);
    // A stone chimney with a capped top, then clapboard walls under the eaves' shadow, lit corner
    // boards on the left and shaded ones on the right.
    const out = [...stones(48, top - 24, 8, 20, ramp('#e2c6c0', 0.7), seed * 7, { rowH: 4, blockW: 5 }), ...beam(46.6, top - 26, 10.8, 3, shade(roof, -14)),
      ...planks(8, top, 54, H - top, w, Math.round((H - top) / 5), seed * 3, true), ...wallShade(8, top + 2, 54, H - top - 2, w, 3),
      F(R(8, top + 2, 1.6, H - top - 2, w.hi)), F(R(60.4, top + 2, 1.6, H - top - 2, w.sh)),
      ...gable(2, 68, top + 2, top - 26, roof, seed * 11),
      // A round attic window with a little heart, its frame lit on the upper left.
      E(35, top - 8, 5, 5, '#ffffff'), F(E(35.6, top - 7.4, 4.4, 4.4, w.sh)), F(E(35, top - 8, 3.6, 3.6, '#ffd98a')), F(E(34.2, top - 8.8, 1.8, 1.8, '#fff6c9')),
      F(E(34, top - 8.6, 1, 1, '#ff8fa8')), F(E(36, top - 8.6, 1, 1, '#ff8fa8')), F(T([[33.2, top - 8.2], [36.8, top - 8.2], [35, top - 6.2]], '#ff8fa8')),
      // A plank door under a round head, set back in shade on the left, with a brass knob and a
      // stone step.
      E(35, H - 18, 6.4, 5, door.sh), R(28.6, H - 18, 12.8, 18, door.sh), ...planks(29.4, H - 17, 11.2, 17, door, 3, seed * 5), E(35, H - 17.4, 5.6, 4.2, door.base),
      F(R(29.4, H - 17, 1.4, 17, door.deep)), F(E(38.4, H - 9, 0.9, 0.9, '#ffe36b')), F(E(38.2, H - 9.2, 0.4, 0.4, '#ffffff')), ...beam(27, H - 2.4, 16, 2.4, '#d8d0e8')];
    const rows = tall ? [top + 8, top + 30] : [top + 8];
    for (const wy of rows) {
      for (const wx of [17, 53]) {
        out.push(...windowPane(wx - 4.4, wy + 1, 8.8, 8, '#ffffff', '#ffd98a', '#fff6c9'), F(R(wx - 5.2, wy + 9, 10.4, 0.8, w.sh)));
        // Flower box under the window: lit lip, shaded front, blooms on top.
        out.push(...beam(wx - 6, wy + 10, 12, 2.6, '#c99a6b'), F(E(wx - 3, wy + 9.8, 1.2, 1.2, '#ff9ec0')), F(E(wx, wy + 9.4, 1.2, 1.2, '#ffe36b')), F(E(wx + 3, wy + 9.8, 1.2, 1.2, '#c9a6ff')), F(E(wx - 1, wy + 9.2, 0.8, 0.6, '#8fdc9a')));
      }
    }
    return out;
  }, false);
}

// A backdrop tree: a still trunk under leaf clumps lit from the upper left; `f` (0 ... 4) is the
// canopy's lean in the wind, the crown leaning furthest.
function treeArt(seed, blossom, palette = ['#8fdc9a', '#7fd1a8', '#a8e28a'], f = 2) {
  const leaf = blossom ? '#ffc6de' : pick(palette, seed);
  const big = hash(seed * 3) > 0.5;
  const H = big ? 66 : 54;
  return art(`tree|${leaf}|${big}|${f}`, 44, H, () => {
    const r = ramp(leaf);
    const d = (f - 2) * 0.5;
    const b = ramp('#c9a27a', 0.8);
    return [
      R(19, H - 26, 6, 26, b.base), F(R(22.4, H - 26, 2.6, 26, b.sh)), F(R(19, H - 26, 0.8, 26, b.hi)), T([[19, H], [16, H], [19, H - 4]], b.base), T([[25, H], [28, H], [25, H - 4]], b.sh),
      ...foliage(34 + d * 0.7, H - 30, 9, 8, ramp(mix(leaf, r.sh, 0.5)), seed * 9 + 2, { tips: 1 }), ...foliage(10 + d * 0.7, H - 30, 9, 8, r, seed * 9 + 1, { tips: 1 }),
      ...foliage(22 + d, H - 38, 17, 15, r, seed * 9, { tips: 3 }),
      F(E(12 + d, H - 32, 1.4, 1.4, blossom ? '#ffffff' : '#ff8fa8')), F(E(30 + d, H - 40, 1.4, 1.4, blossom ? '#ffffff' : '#ff8fa8')), F(E(24 + d, H - 28, 1.4, 1.4, blossom ? '#ffffff' : '#ffb38a')),
    ];
  }, false);
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
  return art(`mushhouse|${cap}`, 56, 60, () => {
    const st = ramp('#fff1dc', 0.6);
    const c = ramp(cap, 0.8);
    const door = ramp('#d39a6a', 0.8);
    const dome = [[1, 28], [6, 12], [18, 3], [28, 1], [38, 3], [50, 12], [55, 28]];
    const out = [
      // The stalk: soft cream, lit down the left, turning away on the right, the cap's shadow on it.
      R(14, 26, 28, 34, st.base), E(28, 59, 15, 2.4, st.base), F(R(14, 28, 3, 32, st.hi)), F(R(36, 28, 6, 32, st.sh)), F(E(37, 59, 6, 1.6, st.sh)), F(R(14, 28, 28, 4, st.sh)), F(R(14, 32, 28, 1, mix(st.base, st.sh, 0.5))),
      // A round plank door and two round windows.
      E(28, 42, 5.6, 4.6, door.sh), R(22.4, 42, 11.2, 18, door.sh), ...planks(23.2, 42.6, 9.6, 17.4, door, 3, seed * 4), E(28, 42.6, 4.8, 3.8, door.base),
      F(R(23.2, 42.6, 1.2, 17.4, door.deep)), F(E(30.8, 51, 0.8, 0.8, '#ffe36b')),
      E(19, 37, 3.4, 3.4, '#ffffff'), F(E(19.4, 37.4, 2.6, 2.6, st.sh)), F(E(19, 37, 2.4, 2.4, '#ffd98a')), F(E(18.4, 36.4, 1.1, 1.1, '#fff6c9')),
      E(37, 37, 3.4, 3.4, '#ffffff'), F(E(37.4, 37.4, 2.6, 2.6, st.sh)), F(E(37, 37, 2.4, 2.4, '#ffd98a')), F(E(36.4, 36.4, 1.1, 1.1, '#fff6c9')),
      // The cap: lit on the upper left, its right flank in shade, gills under the rim.
      T(dome, cap), F(T([[30, 1.2], [38, 3], [50, 12], [55, 28], [34, 28], [40, 16]], c.sh)), F(T([[4, 22], [7, 12], [18, 4], [26, 2.4], [16, 9], [9, 17]], c.hi)),
      R(4, 26, 48, 3, c.deep), F(R(4, 26, 48, 0.8, c.sh)),
    ];
    // White spots, each with a crescent of shade under its right side.
    for (const [x, y, rx, ry] of [[14, 14, 3.4, 2.6], [30, 8, 3, 2.2], [42, 18, 3.6, 2.6], [24, 20, 2, 1.6]]) out.push(F(E(x + 0.6, y + 0.6, rx, ry, x > 32 ? c.deep : c.sh)), F(E(x, y, rx, ry, '#ffffff')), F(E(x - rx * 0.3, y - ry * 0.3, rx * 0.4, ry * 0.35, '#fff8f0')));
    return out;
  }, false);
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
  return art(`tent|${color}`, 56, 50, () => {
    const cv = ramp('#fff4e6', 0.6);
    const c = ramp(color, 0.8);
    const wood = ramp('#8a5a3c');
    return [
      // Canvas: the left panel in the light, the right one turned away, stripes following the folds.
      T([[2, 50], [28, 10], [54, 50]], cv.base), F(T([[28, 10], [54, 50], [28, 50]], cv.sh)),
      T([[10, 50], [28, 10], [20, 50]], color), F(T([[11.6, 50], [28, 10], [13.4, 50]], c.hi)), T([[36, 50], [28, 10], [46, 50]], c.sh), F(T([[43, 50], [28, 10], [46, 50]], c.deep)),
      // Sagging seams between the guy points.
      F(band([[6, 42], [11, 43.4], [16, 42]], () => 0.35, cv.sh)), F(band([[40, 42], [45, 43.4], [50, 42]], () => 0.35, cv.deep)),
      // The doorway: dark inside, one flap pulled back and lit.
      T([[22, 50], [28, 32], [34, 50]], '#5e3a2c'), F(T([[28, 32], [34, 50], [31, 50]], '#3f2620')), F(T([[22, 50], [28, 32], [25.6, 50]], cv.hi)), F(R(24.6, 44, 3.6, 0.7, c.base)),
      // The pole and its pennant.
      R(27.2, 0, 1.6, 12, wood.base), F(R(28.2, 0, 0.6, 12, wood.sh)), T([[28.8, 1], [37, 3.4], [28.8, 6]], color), F(T([[28.8, 3.6], [37, 3.4], [28.8, 6]], c.sh)), E(28, 0.6, 1.2, 1.2, '#ffd66b'),
      // Pegs at the corners.
      R(1, 47.6, 1.4, 2.4, wood.base), R(53.6, 47.6, 1.4, 2.4, wood.sh),
    ];
  }, false);
}

// A stone forge with its fire mouth glowing (`frame` 0 ... 2 the flame's flicker) and an anvil on a
// stump in front of it.
function forgeArt(frame) {
  return art(`forge|${frame}`, 50, 56, () => {
    const st = ramp('#c9bedc', 0.8);
    const iron = ramp('#6d7484');
    const wood = ramp('#9f7a57');
    return [
      // Chimney and body in dressed stone, a cap stone along the top.
      ...stones(31, 4, 8, 22, st, 3, { rowH: 4, blockW: 5 }), ...beam(29.6, 2, 10.8, 3, st.sh),
      ...stones(8, 24, 38, 30, st, 7, { rowH: 6, blockW: 9 }), ...beam(6, 21, 42, 3.4, st.base), F(R(44, 24, 2, 30, st.sh)), F(R(8, 24.4, 38, 2, st.sh)),
      // The fire mouth: a dark arch, the fire inside, its light spilling on the sill.
      E(29, 40, 8, 7, '#3a2d4f'), R(21, 40, 16, 8, '#3a2d4f'), E(29, 44 - frame * 0.4, 6, 4.4 + frame * 0.6, '#ff8a3c'), F(E(29, 45, 3.6, 2.4, '#ffe36b')), F(E(28.4, 45.6, 1.4, 1, '#ffffff')),
      ...beam(19, 48, 20, 2.4, st.base), F(R(22, 48, 14, 0.8, '#ffcf8a')),
      R(6, 53.6, 42, 2.4, st.deep),
      // The anvil on its stump: a lit top face, horn reaching out to the left, a shaded waist.
      R(5, 48, 9, 8, wood.base), F(R(11.4, 48, 2.6, 8, wood.sh)), F(R(5, 48, 9, 1, wood.hi)), F(R(8, 50, 0.5, 4, wood.deep)),
      T([[2, 41], [16, 41], [16, 44], [13, 45], [12, 48], [7, 48], [6, 45], [4, 44], [0.6, 42]], iron.base),
      F(T([[0.6, 42], [2, 41], [16, 41], [16, 42.2], [3, 42.2]], iron.hi)), F(T([[10.6, 44.4], [13, 45], [12, 48], [10.4, 48]], iron.sh)), F(R(13, 42.2, 3, 2, iron.sh)), F(R(5.6, 41.2, 2, 0.6, '#ffffff')),
    ];
  }, false);
}

// A war banner on a pole, streaming as a chain: `k` (0 ... 4) how hard the wind holds it, `ph`
// (0 ... 2) the ripple running down it.
function bannerArt(color, k, ph) {
  return art(`banner|${color}|${k}|${ph}`, 24, 70, () => [
    R(4, 2, 2.4, 68, '#8a5a3c'), F(R(5.4, 2, 1, 68, '#6e4630')), E(5.2, 2, 2.4, 2.4, '#ffd66b'),
    ...flagShapes(6.4, 6, 15, 24, 0.25 + k * 0.15, ph / 3, color, '#fff4e6'),
  ], false);
}

export function treehouseArt(seed) {
  const roof = pick(['#ff9ec0', '#9fb8ff', '#ffd66b'], seed);
  return art(`treehouse|${roof}`, 64, 92, () => {
    const b = ramp('#9f7a57');
    const leaf = ramp('#6fbf8a');
    const wall = ramp('#f0d6a8', 0.6);
    const rope = '#e6c9a0';
    const out = [
      // The trunk with flaring roots, bark grain running up it.
      ...bark([[32, 92], [31.6, 70], [32.4, 50], [32, 36]], (u) => 5.4 + Math.max(0, 0.16 - u) * 16, b, seed * 9, 3),
      T([[26, 92], [19, 92], [27, 82]], b.base), T([[38, 92], [45, 92], [37, 82]], b.sh),
      // Leaf clumps around and over the house.
      ...foliage(12, 30, 12, 10, ramp(mix('#6fbf8a', leaf.sh, 0.5)), seed * 5 + 1, { tips: 1 }), ...foliage(52, 30, 12, 10, ramp(mix('#6fbf8a', leaf.sh, 0.5)), seed * 5 + 2, { tips: 1 }),
      ...foliage(32, 20, 28, 18, leaf, seed * 5, { tips: 3 }),
      // The house: planked walls under the eave's shadow, a shingled roof, two round lit windows.
      ...planks(16, 30, 32, 20, wall, 4, seed * 3, true), ...wallShade(16, 31, 32, 19, wall, 2.4), F(R(16, 31, 1.2, 19, wall.hi)),
      ...gable(12, 52, 31, 18, roof, seed * 7),
      E(24, 40, 3.4, 3.4, '#ffffff'), F(E(24.4, 40.4, 2.6, 2.6, wall.sh)), F(E(24, 40, 2.4, 2.4, '#ffd98a')), F(E(23.4, 39.4, 1.1, 1.1, '#fff6c9')),
      E(40, 40, 3.4, 3.4, '#ffffff'), F(E(40.4, 40.4, 2.6, 2.6, wall.sh)), F(E(40, 40, 2.4, 2.4, '#ffd98a')), F(E(39.4, 39.4, 1.1, 1.1, '#fff6c9')),
      // A little door and the platform beam under it.
      R(29.6, 42, 5.4, 8, '#7a5236'), F(R(30.4, 42.8, 3.8, 7.2, '#c99a6b')), F(R(30.4, 42.8, 1, 7.2, '#8f6544')), ...beam(14, 49.4, 36, 2.6, '#b08860'),
      // A rope ladder hanging from the door.
      R(30.6, 52, 0.8, 22, rope), R(33.8, 52, 0.8, 22, rope),
    ];
    for (const y of [55, 60, 65, 70]) out.push(R(30.6, y, 4, 1, rope), F(R(30.6, y + 0.6, 4, 0.4, '#b58f66')));
    return out;
  }, false);
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

const posterArt = () => art('poster', 16, 26, () => [R(7, 10, 2, 16, '#8a5a3c'), R(1, 1, 14, 13, '#fff4e0'), F(R(3, 2.6, 10, 1.2, '#c99a6b')), F(E(8, 7.6, 2.6, 2.6, '#c9b8ff')), F(R(5.4, 6.4, 5.2, 1, '#3a2d4f')), F(R(3, 11.6, 10, 0.8, '#d9b88f'))]);

// A paper lantern on a post: the post and arm, and the lantern that swings from the arm's tip.
const lanternPostArt = () => art('lanternpost', 12, 34, () => [R(5, 8, 2, 26, '#8a6a4a'), R(5, 6, 6, 1.6, '#8a6a4a')]);
const lanternArt = () => art('lantern', 12, 34, () => [R(8.8, 7.4, 0.5, 1, '#8a6a4a'), E(9, 12, 3, 3.6, '#ff9ec0'), F(E(8.4, 11.4, 1, 1.6, '#ffd6e6')), R(7.6, 8, 2.8, 1.2, '#8a6a4a'), R(7.8, 15.4, 2.4, 0.9, '#8a6a4a')]);

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
  // Starfall: a shooting star now and then, a bright head trailing a fading tail.
  if (t.shooting) {
    for (let k = 0; k < 2; k++) {
      const cyc = (time * 0.22 + k * 0.5) % 1;
      if (cyc > 0.22) continue;
      const u = cyc / 0.22;
      const n = Math.floor(time * 0.22 + k * 0.5);
      const sx = width * (0.15 + hash(n * 3 + k) * 0.7) - u * 160;
      const sy = 20 + hash(n * 5 + k) * 60 + u * 70;
      const g = ctx.createLinearGradient(sx, sy, sx + 50, sy - 22);
      g.addColorStop(0, `rgba(255,246,214,${0.9 * (1 - u)})`);
      g.addColorStop(1, 'rgba(255,246,214,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 50, sy - 22);
      ctx.stroke();
      ctx.globalAlpha = 1 - u;
      sparkle(ctx, sx, sy, 2.6, '#ffffff');
      ctx.globalAlpha = 1;
    }
  }
  // Moonlit Ridge: a huge low moon behind the peaks, with a soft halo.
  if (t.bigMoon) {
    const mx = width * 0.34;
    const my = height * 0.42;
    const R0 = 54;
    glow(ctx, mx, my, 170, '#cdd6ff', 0.3);
    glow(ctx, mx, my, 80, '#eef0ff', 0.35);
    // A lit sphere: bright toward the upper left, cooling to lavender at the far limb.
    const g = ctx.createRadialGradient(mx - R0 * 0.35, my - R0 * 0.35, R0 * 0.1, mx, my, R0);
    g.addColorStop(0, '#fffdf4');
    g.addColorStop(0.65, '#ece8ff');
    g.addColorStop(1, '#c6c0ee');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(mx, my, R0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, R0, 0, Math.PI * 2);
    ctx.clip();
    // The seas: soft irregular dark plains.
    ctx.fillStyle = 'rgba(168,160,220,0.42)';
    for (const [dx, dy, rx, ry, a] of [[-14, -12, 20, 13, 0.4], [10, 4, 16, 20, -0.3], [24, -20, 10, 7, 0.2], [-22, 18, 12, 8, 0.8], [6, 30, 14, 6, 0]]) {
      ctx.beginPath();
      ctx.ellipse(mx + dx, my + dy, rx, ry, a, 0, Math.PI * 2);
      ctx.fill();
    }
    // Craters: a shadowed bowl with a lit lower rim.
    for (const [dx, dy, r] of [[-28, -26, 5], [30, 14, 6], [-4, -34, 3.5], [18, 36, 4], [-36, 6, 3], [36, -8, 2.6]]) {
      ctx.fillStyle = 'rgba(150,140,206,0.55)';
      ctx.beginPath();
      ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(mx + dx, my + dy, r, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    // The limb darkening on the side away from the light.
    const limb = ctx.createLinearGradient(mx - R0, my - R0, mx + R0, my + R0);
    limb.addColorStop(0.55, 'rgba(120,110,190,0)');
    limb.addColorStop(1, 'rgba(120,110,190,0.4)');
    ctx.fillStyle = limb;
    ctx.fillRect(mx - R0, my - R0, R0 * 2, R0 * 2);
    ctx.restore();
    // Thin strands of cloud drifting across its face.
    ctx.fillStyle = 'rgba(214,218,255,0.55)';
    for (let k = 0; k < 2; k++) {
      const cx = mx - 90 + (((time * 6 + k * 120) % 260));
      const cy = my + 10 + k * 22;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 46, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 26, cy - 3, 24, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Underground: the rock (or earth) overhead, roots and drips hanging from it, swaying a little
  // (the root tunnels' own far layer draws its earthen ceiling).
  if (t.underground && t.skyline !== 'roots') {
    const rock = mix(t.sky[0], '#000000', 0.25);
    ctx.fillStyle = rock;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x <= width; x += 16) ctx.lineTo(x, 26 + Math.sin(x * 0.05) * 6 + hash(Math.floor(x / 16)) * 8);
    ctx.lineTo(width, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = mix(t.sky[0], t.midTrim ?? t.mid, 0.5);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 14; i++) {
      const x = hash(i * 7.3) * width;
      const len = 18 + hash(i * 3.1) * 34;
      const sway = Math.sin(time * 0.7 + i * 1.3) * 2;
      ctx.beginPath();
      ctx.moveTo(x, 28);
      ctx.quadraticCurveTo(x + sway * 0.5, 28 + len * 0.6, x + sway, 28 + len);
      ctx.stroke();
      // A glowing bead of light on some of them (the zone's own light: glowworms, spores).
      if (i % 3 === 0) {
        const tw = 0.5 + 0.5 * Math.sin(time * 1.6 + i);
        glow(ctx, x + sway, 30 + len, 8, '#d8ffc0', 0.35 * tw);
      }
    }
  }
  // The sun (or moon) smiles down and bobs gently.
  // (Under the ridge's great moon there is no second, smaller one in the sky.)
  if (t.face && !t.bigMoon) {
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

function drawClouds(ctx, theme, cam, width, time, air, night = false) {
  if (theme === 'cave' || theme === 'hollow') return;
  // Under a night sky the clouds are faint shapes against the stars.
  ctx.save();
  if (night) ctx.globalAlpha = 0.32;
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
  ctx.restore();
}

// A far silhouette: one flat value and no outline (its edge is the sky's own colour), with a soft
// lit rim on the sides facing the world light (upper left): the shape in the rim colour, then its
// body shifted down and right over it.
function litFill(ctx, t, p, dx = 2, dy = 1.5) {
  ctx.fillStyle = t.farLit;
  ctx.fill(p);
  ctx.save();
  ctx.translate(dx, dy);
  ctx.fillStyle = t.far;
  ctx.fill(p);
  ctx.restore();
}

// A far ruined colonnade (Twilight Ruins' crypt, the Crystal Throne): a faint back row, then fluted
// columns with capitals and stepped bases, some broken off with a fallen drum at the foot, pairs
// spanned by round arches of cut voussoirs. Each column is modelled with a lit side, a body and a
// shadow side in values clear of the sky, so it reads as stone instead of an outline.
function drawFarColonnade(ctx, t, cam, width, y0, time) {
  backRidge(ctx, t, cam, width, y0 - 10, 40);
  const body = mix(shade(t.far, -6), t.sky[0], 0.1);
  const dark = shade(body, -9);
  const lit = mix(body, t.farLit, 0.55);
  const back = mix(body, t.farBack, 0.6);
  // The back row: plain shafts and arches far off in the gloom.
  ctx.fillStyle = back;
  repeat(cam.x, 0.1, 70, width, (i, x) => {
    const h = 90 + hash(i + 40) * 50;
    ctx.fillRect(snap(x), snap(y0 - h), 14, h + 200);
    ctx.fillRect(snap(x - 3), snap(y0 - h), 20, 5);
    if (hash(i + 41) > 0.5) {
      ctx.beginPath();
      ctx.moveTo(x + 14, y0 - h + 5);
      ctx.arc(x + 42, y0 - h + 5, 28, Math.PI, 0);
      ctx.lineTo(x + 70, y0 - h + 12);
      ctx.arc(x + 42, y0 - h + 12, 22, 0, Math.PI, true);
      ctx.closePath();
      ctx.fill();
    }
  });
  repeat(cam.x, 0.2, 110, width, (i, x) => {
    const broken = hash(i + 7) < 0.3;
    const full = 130 + hash(i) * 40;
    const h = broken ? full * (0.35 + hash(i + 8) * 0.3) : full;
    const w = 26;
    const top = y0 - h;
    // Stepped base.
    ctx.fillStyle = dark;
    ctx.fillRect(snap(x - 6), snap(y0 - 6), w + 12, 200);
    ctx.fillStyle = body;
    ctx.fillRect(snap(x - 4), snap(y0 - 12), w + 8, 7);
    // The shaft: body, lit left band, shadow right band, and flutes.
    ctx.fillStyle = body;
    ctx.fillRect(snap(x), snap(top), w, h - 12);
    ctx.fillStyle = lit;
    ctx.fillRect(snap(x), snap(top), 6, h - 12);
    ctx.fillStyle = dark;
    ctx.fillRect(snap(x + w - 7), snap(top), 7, h - 12);
    ctx.globalAlpha = 0.45;
    for (let f = 1; f < 4; f++) ctx.fillRect(snap(x + f * 6.5), snap(top + 4), 1, h - 18);
    ctx.globalAlpha = 1;
    if (broken) {
      // A jagged break, and the fallen drum lying at the foot.
      ctx.fillStyle = t.sky[1];
      ctx.beginPath();
      ctx.moveTo(x - 1, top - 1);
      ctx.lineTo(x + 7, top + 6);
      ctx.lineTo(x + 13, top + 1);
      ctx.lineTo(x + 19, top + 9);
      ctx.lineTo(x + w + 1, top + 3);
      ctx.lineTo(x + w + 1, top - 1);
      ctx.closePath();
      ctx.fill();
      const dx = x + w + 8 + hash(i + 9) * 14;
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(dx + 14, y0 - 14, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = lit;
      ctx.beginPath();
      ctx.ellipse(dx + 4, y0 - 14, 4, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    // Capital: a flared echinus under a square abacus, lit along the top.
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(x - 2, top);
    ctx.quadraticCurveTo(x - 6, top - 6, x - 7, top - 9);
    ctx.lineTo(x + w + 7, top - 9);
    ctx.quadraticCurveTo(x + w + 6, top - 6, x + w + 2, top);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(snap(x - 8), snap(top - 16), w + 16, 7);
    ctx.fillStyle = lit;
    ctx.fillRect(snap(x - 8), snap(top - 16), w + 16, 2);
    ctx.fillStyle = dark;
    ctx.fillRect(snap(x - 8), snap(top - 10), w + 16, 1.5);
    // Every other standing pair carries an arch of cut stones across to its neighbour.
    if (i % 2 === 0 && hash(i + 1 + 7) >= 0.3) {
      const cx = x + w + (110 - w) / 2;
      const r = (110 - w) / 2 + 6;
      const ay = top - 16;
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, ay, r + 10, Math.PI, 0);
      ctx.arc(cx, ay, r, 0, Math.PI, true);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = dark;
      ctx.lineWidth = 1;
      for (let v = 1; v < 9; v++) {
        const a = Math.PI + (v / 9) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r, ay + Math.sin(a) * r);
        ctx.lineTo(cx + Math.cos(a) * (r + 10), ay + Math.sin(a) * (r + 10));
        ctx.stroke();
      }
      ctx.strokeStyle = lit;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, ay, r + 10, Math.PI * 1.05, Math.PI * 1.45);
      ctx.stroke();
    }
  });
}

// The furthest plane: one low ridge, simpler than anything in front of it, almost the sky's colour,
// barely moving. `bumps` rounds it into a line of treetops.
function backRidge(ctx, t, cam, width, y, amp, bumps = false) {
  ctx.fillStyle = t.farBack;
  ctx.beginPath();
  ctx.moveTo(-2, y + 300);
  for (let sx = -2; sx <= width + 12; sx += 6) {
    const k = sx + cam.x * 0.1;
    const v = bumps ? Math.abs(Math.sin(k * 0.035)) * 0.45 + Math.sin(k * 0.006) * 0.55 : Math.sin(k * 0.007) * 0.6 + Math.sin(k * 0.017 + 1) * 0.4;
    ctx.lineTo(sx, y - amp * v);
  }
  ctx.lineTo(width + 12, y + 300);
  ctx.fill();
}

// Far silhouettes: flat, unoutlined shapes pulled toward the sky color for depth, each with a lit
// rim toward the light, over a still simpler ridge further back.
function drawFar(ctx, t, cam, width, y0, time) {
  ctx.fillStyle = t.far;
  if (drawFarRoom(ctx, t, cam, width, y0, time, t.skyline)) return;
  switch (t.skyline) {
    case 'houses':
      repeat(cam.x, 0.2, 58, width, (i, x) => {
        const h = 36 + hash(i) * 44;
        const p = new Path2D();
        p.roundRect(x, y0 - h, 48, h + 200, 6);
        p.moveTo(x - 4, y0 - h + 4);
        p.quadraticCurveTo(x + 24, y0 - h - 30, x + 52, y0 - h + 4);
        litFill(ctx, t, p);
        if (hash(i + 6) > 0.6) {
          ctx.fillStyle = 'rgba(255,243,166,0.5)';
          ctx.fillRect(snap(x + 18), snap(y0 - h + 12), 10, 8);
          ctx.fillStyle = t.far;
        }
      });
      break;
    case 'sea':
    case 'lagoon':
    case 'opensea': {
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
      drawFarColonnade(ctx, t, cam, width, y0, time);
      break;
    case 'crystals':
      repeat(cam.x, 0.2, 46, width, (i, x) => {
        const h = 50 + hash(i) * 90;
        const p = new Path2D();
        p.moveTo(x, y0 + 200);
        p.lineTo(x + 10, y0 - h);
        p.lineTo(x + 24, y0 + 200);
        litFill(ctx, t, p, 1.6, 1);
      });
      ctx.fillStyle = t.far;
      // Stalactites hanging from the cave ceiling.
      repeat(cam.x, 0.25, 40, width, (i, x) => {
        const h = 20 + hash(i + 3) * 60;
        const p = new Path2D();
        p.moveTo(x, -2);
        p.quadraticCurveTo(x + 9, h, x + 18, -2);
        litFill(ctx, t, p, 1.4, 0);
      });
      break;
    case 'roots':
      drawFarRoots(ctx, t, cam, width, y0, time);
      break;
    case 'manor':
      drawFarManor(ctx, t, cam, width, y0, time);
      break;
    case 'manorhall':
      drawFarManorHall(ctx, t, cam, width, y0, time);
      break;
    case 'manorball':
      drawFarManorBall(ctx, t, cam, width, y0, time);
      break;
    case 'library':
      drawFarLibrary(ctx, t, cam, width, y0, time);
      break;
    case 'hallway':
      drawFarHallway(ctx, t, cam, width, y0, time);
      break;
    case 'reef':
      drawFarReef(ctx, t, cam, width, y0, time);
      break;
    case 'carnival':
      drawFarCarnival(ctx, t, cam, width, y0, time);
      break;
    case 'midway':
      drawFarMidway(ctx, t, cam, width, y0, time);
      break;
    case 'coaster':
      drawFarCoaster(ctx, t, cam, width, y0, time);
      break;
    case 'ferris':
      drawFarFerris(ctx, t, cam, width, y0, time);
      break;
    case 'stars':
      drawFarStars(ctx, t, cam, width, y0, time);
      break;
    case 'candy':
    case 'crater':
      drawFarCandy(ctx, t, cam, width, y0, time, t.skyline === 'crater');
      break;
    case 'ramparts':
      drawFarRamparts(ctx, t, cam, width, y0, time);
      break;
    case 'candycave':
    case 'forge':
      drawFarCandyCave(ctx, t, cam, width, y0, time, t.skyline === 'forge');
      break;
    case 'whale':
    case 'whaleback':
    case 'tail':
    case 'market':
    case 'lungs':
    case 'deck':
    case 'fortress':
    case 'brow':
      drawFarWhale(ctx, t, cam, width, y0, time, t.skyline);
      break;
    case 'theatre':
    case 'stagehall':
    case 'pirate':
    case 'fairy':
    case 'ballroom':
    case 'backstage':
    case 'greatstage':
      drawFarTheatre(ctx, t, cam, width, y0, time, t.skyline);
      break;
    case 'starhall':
    case 'archive':
    case 'orrery':
      drawFarStarHall(ctx, t, cam, width, y0, time, t.skyline);
      break;
    case 'bigtop':
    case 'workshop':
      drawFarBigTop(ctx, t, cam, width, y0, time, t.skyline === 'workshop');
      break;
    // Pointed mountains, two ranges deep; on the peak they wear snow caps.
    case 'peaks':
      backRidge(ctx, t, cam, width, y0 - 60, 40);
      ctx.fillStyle = t.far;
      ctx.fillRect(0, snap(y0 + 20), width, 400);
      repeat(cam.x, 0.2, 150, width, (i, x) => {
        const h = 80 + hash(i) * 80;
        const w = 120 + hash(i + 4) * 70;
        const px = x + w * (0.4 + hash(i + 2) * 0.2);
        const p = new Path2D();
        p.moveTo(x - 20, y0 + 40);
        p.lineTo(px - 8, y0 - h + 10);
        p.quadraticCurveTo(px, y0 - h - 4, px + 8, y0 - h + 10);
        p.lineTo(x + w + 20, y0 + 40);
        p.closePath();
        litFill(ctx, t, p, 2.4, 1.6);
        // The face turned from the light in shadow, split from the lit face along a crooked
        // ridgeline from the summit, with a spur or two running down it.
        ctx.fillStyle = shade(t.far, -7);
        ctx.beginPath();
        ctx.moveTo(px + 8, y0 - h + 12);
        ctx.lineTo(x + w + 20, y0 + 40);
        ctx.lineTo(px + w * 0.08, y0 + 40);
        ctx.lineTo(px + 10, y0 - h * 0.45);
        ctx.lineTo(px + 2, y0 - h * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = mix(t.far, t.farLit, 0.35);
        for (let s = 0; s < 2; s++) {
          const sy = y0 - h * (0.55 - s * 0.25);
          const sx = px - (h * (0.55 - s * 0.25)) * 0.35 - 6;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - 14, sy + 26);
          ctx.lineTo(sx - 10, sy + 26);
          ctx.lineTo(sx + 3, sy + 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = t.far;
        if (t.snowcaps) {
          ctx.fillStyle = mix('#ffffff', t.far, 0.25);
          ctx.beginPath();
          ctx.moveTo(px - 8 - h * 0.12, y0 - h + 10 + h * 0.2);
          ctx.lineTo(px - 8, y0 - h + 10);
          ctx.quadraticCurveTo(px, y0 - h - 4, px + 8, y0 - h + 10);
          ctx.lineTo(px + 8 + h * 0.14, y0 - h + 10 + h * 0.22);
          ctx.lineTo(px + 4, y0 - h + 10 + h * 0.14);
          ctx.lineTo(px - 2, y0 - h + 10 + h * 0.24);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = t.far;
        }
      });
      break;
    // The shrine's hills: soft hills with tiered pagoda silhouettes and a great gate on the skyline.
    case 'pagodas':
      backRidge(ctx, t, cam, width, y0 - 40, 36, true);
      ctx.fillStyle = t.far;
      ctx.fillRect(0, snap(y0 + 24), width, 400);
      repeat(cam.x, 0.2, 200, width, (i, x) => {
        const p = new Path2D();
        p.ellipse(x + 100, y0 + 30, 120 + hash(i) * 30, 70 + hash(i + 1) * 30, 0, Math.PI, 0);
        const s = hash(i + 7);
        const cx = x + 70 + hash(i + 3) * 60;
        const top = y0 - 30 - hash(i + 1) * 30;
        if (s < 0.55) {
          // A pagoda: three roofs narrowing to a spire.
          for (let k = 0; k < 3; k++) {
            const half = 26 - k * 7;
            const y = top - k * 22;
            p.moveTo(cx - half - 4, y);
            p.quadraticCurveTo(cx - half * 0.4, y - 4, cx, y - 12);
            p.quadraticCurveTo(cx + half * 0.4, y - 4, cx + half + 4, y);
            p.closePath();
            p.rect(cx - half * 0.55, y, half * 1.1, 22);
          }
          p.rect(cx - 1.5, top - 84, 3, 22);
        } else if (s < 0.8) {
          // A great torii on the hilltop.
          p.rect(cx - 26, top - 46, 6, 50);
          p.rect(cx + 20, top - 46, 6, 50);
          p.rect(cx - 32, top - 38, 64, 4);
          p.moveTo(cx - 40, top - 50);
          p.quadraticCurveTo(cx, top - 44, cx + 40, top - 50);
          p.lineTo(cx + 36, top - 44);
          p.lineTo(cx - 36, top - 44);
          p.closePath();
        }
        litFill(ctx, t, p, 2.2, 1.6);
      });
      break;
    // The springs' gorge: tall rounded cliffs with thin waterfalls down their faces.
    case 'cliffs':
      backRidge(ctx, t, cam, width, y0 - 50, 40);
      ctx.fillStyle = t.far;
      ctx.fillRect(0, snap(y0 + 20), width, 400);
      repeat(cam.x, 0.2, 120, width, (i, x) => {
        const h = 90 + hash(i) * 70;
        const w = 70 + hash(i + 4) * 40;
        const p = new Path2D();
        p.moveTo(x, y0 + 40);
        p.lineTo(x + 6, y0 - h + 20);
        p.quadraticCurveTo(x + w * 0.5, y0 - h - 16, x + w - 6, y0 - h + 24);
        p.lineTo(x + w, y0 + 40);
        p.closePath();
        litFill(ctx, t, p, 2.4, 2);
        // Modelling: the cliff's right flank in shadow, a lit shelf or two across its face, and
        // a cap of greenery along the rim.
        ctx.save();
        ctx.clip(p);
        // The rock's body a step darker than the air, so the cliff reads as a solid mass.
        ctx.fillStyle = mix(shade(t.far, -4), t.sky[0], 0.15);
        ctx.fillRect(snap(x + 4), snap(y0 - h + 2), w, h + 80);
        ctx.fillStyle = shade(t.far, -8);
        ctx.fillRect(snap(x + w * 0.62), snap(y0 - h - 20), w, h + 80);
        ctx.fillStyle = mix(t.far, t.farLit, 0.4);
        for (let s = 1; s < 3; s++) {
          const sy = y0 - h + h * s * 0.32 + hash(i + s) * 10;
          ctx.fillRect(snap(x + 4), snap(sy), w * (0.5 + hash(i + s + 4) * 0.3), 2.5);
          ctx.fillStyle = shade(t.far, -9);
          ctx.fillRect(snap(x + 4), snap(sy + 2.5), w * (0.5 + hash(i + s + 4) * 0.3), 2);
          ctx.fillStyle = mix(t.far, t.farLit, 0.4);
        }
        ctx.restore();
        ctx.fillStyle = t.far;
        if (hash(i + 9) > 0.5) {
          const fx = x + w * (0.35 + hash(i + 3) * 0.3);
          ctx.fillStyle = mix('#ffffff', t.far, 0.35);
          ctx.fillRect(snap(fx), snap(y0 - h + 4), 3, h + 30);
          ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 4 + i);
          ctx.fillRect(snap(fx + 1), snap(y0 - h + 4 + ((time * 40) % 20)), 1, 8);
          ctx.globalAlpha = 1;
          ctx.fillStyle = t.far;
        }
      });
      break;
    case 'mesas':
      backRidge(ctx, t, cam, width, y0 - 30, 34);
      ctx.fillStyle = t.far;
      ctx.fillRect(0, snap(y0 + 20), width, 400);
      repeat(cam.x, 0.2, 130, width, (i, x) => {
        const h = 40 + hash(i) * 60;
        const w = 60 + hash(i + 4) * 50;
        // A mesa: sheer sides flaring out at the foot, a flat lit top.
        const p = new Path2D();
        p.moveTo(x - 10, y0 + 40);
        p.quadraticCurveTo(x + 2, y0 - h * 0.3, x + 4, y0 - h + 4);
        p.quadraticCurveTo(x + 5, y0 - h, x + 10, y0 - h);
        p.lineTo(x + w - 10, y0 - h);
        p.quadraticCurveTo(x + w - 5, y0 - h, x + w - 4, y0 - h + 4);
        p.quadraticCurveTo(x + w - 2, y0 - h * 0.3, x + w + 10, y0 + 40);
        p.closePath();
        litFill(ctx, t, p, 2.4, 2.4);
        // Strata: faint bands a step toward the rim colour across the cliff face.
        ctx.fillStyle = mix(t.far, t.farLit, 0.35);
        for (let k = 1; k < 3; k++) ctx.fillRect(snap(x + 6), snap(y0 - h + h * k * 0.3), w - 12, 1.5);
      });
      ctx.fillStyle = t.far;
      break;
    case 'mochigarden':
      // The Mochi Garden's valley: soft rolling hills, and on them round puffs of trees in little
      // clumps (never in a row), a gap here and there.
      backRidge(ctx, t, cam, width, y0 - 54, 34);
      ctx.fillStyle = t.far;
      ctx.fillRect(0, snap(y0 + 10), width, 400);
      repeat(cam.x, 0.2, 70, width, (i, x) => {
        if (hash(i * 1.7 + 4) < 0.4) return;
        const r = 12 + hash(i) * 14;
        const bx = x + hash(i + 9) * 30;
        const cy = y0 - 4 - r * 0.9;
        const p = new Path2D();
        p.arc(bx, cy, r, 0, Math.PI * 2);
        p.arc(bx - r * 0.7, cy + r * 0.45, r * 0.62, 0, Math.PI * 2);
        p.arc(bx + r * 0.75, cy + r * 0.4, r * 0.58, 0, Math.PI * 2);
        p.rect(bx - r * 1.3, cy + r * 0.4, r * 2.6, 60);
        litFill(ctx, t, p, 2, 1.5);
      });
      ctx.fillStyle = t.far;
      break;
    case 'bigtrees':
      backRidge(ctx, t, cam, width, y0 - 70, 50, true);
      ctx.fillStyle = t.far;
      ctx.fillRect(0, snap(y0 + 10), width, 400);
      repeat(cam.x, 0.2, 110, width, (i, x) => {
        const h = 90 + hash(i) * 70;
        // A trunk flaring at the root under one broad crown: a wide dome with a few lobes.
        const r = 34 + hash(i + 2) * 14;
        const cy = y0 - h * 0.6;
        const p = new Path2D();
        p.moveTo(x + 44, y0 + 10);
        p.quadraticCurveTo(x + 48, y0 - 10, x + 48, cy);
        p.lineTo(x + 62, cy);
        p.quadraticCurveTo(x + 62, y0 - 10, x + 68, y0 + 10);
        p.closePath();
        p.moveTo(x + 33 - r, cy - 4);
        p.ellipse(x + 55, cy - 4, r + 22, r * 0.72, 0, Math.PI, 0);
        p.ellipse(x + 55, cy - 4, r + 22, r * 0.34, 0, 0, Math.PI);
        p.moveTo(x + 55 + r * 0.37, cy - r * 0.55);
        p.ellipse(x + 55 - r * 0.25, cy - r * 0.55, r * 0.62, r * 0.5, 0, 0, Math.PI * 2);
        litFill(ctx, t, p, 2.4, 2);
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
      backRidge(ctx, t, cam, width, y0 - 55, 45, t.skyline === 'trees');
      ctx.fillStyle = t.far;
      ctx.fillRect(0, snap(y0 + 29), width, 400);
      // Each hill its own size, so the repeat doesn't show.
      repeat(cam.x, 0.2, 220, width, (i, x) => {
        const p = new Path2D();
        p.ellipse(x + 110 + (hash(i + 3) - 0.5) * 40, y0 + 30, 115 + hash(i) * 40, 100 + hash(i + 1) * 50, 0, Math.PI, 0);
        litFill(ctx, t, p, 3, 2.4);
      });
  }
}

// Moonlit Manor, outside: the manor itself on its hill far back, gables and towers with warm
// windows that light and go dark as if someone walks from room to room, bats round the tower.
function drawFarManor(ctx, t, cam, width, y0, time) {
  backRidge(ctx, t, cam, width, y0 - 30, 30, true);
  ctx.fillStyle = t.far;
  ctx.fillRect(0, snap(y0 + 20), width, 400);
  repeat(cam.x, 0.16, 420, width, (i, x) => {
    const bx = x + 60 + hash(i) * 120;
    const p = new Path2D();
    // The hall, two gables, a tall tower with a pointed roof, chimneys.
    p.rect(bx, y0 - 70, 180, 100);
    p.moveTo(bx - 8, y0 - 70);
    p.lineTo(bx + 30, y0 - 112);
    p.lineTo(bx + 68, y0 - 70);
    p.moveTo(bx + 100, y0 - 70);
    p.lineTo(bx + 140, y0 - 118);
    p.lineTo(bx + 188, y0 - 70);
    p.rect(bx + 70, y0 - 150, 34, 90);
    p.moveTo(bx + 64, y0 - 150);
    p.lineTo(bx + 87, y0 - 196);
    p.lineTo(bx + 110, y0 - 150);
    p.rect(bx + 20, y0 - 126, 10, 26);
    p.rect(bx + 156, y0 - 124, 10, 30);
    litFill(ctx, t, p, 2, 1.6);
    // Windows: warm where someone is, dark where they've left.
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 6; c++) {
        const on = Math.sin(time * 0.4 + c * 1.7 + r * 2.3 + i) > -0.2;
        const wx = bx + 12 + c * 28;
        const wy = y0 - 56 + r * 30;
        ctx.fillStyle = on ? '#ffd88a' : shade(t.far, -10);
        ctx.beginPath();
        ctx.roundRect(snap(wx), snap(wy), 8, 13, [4, 4, 0, 0]);
        ctx.fill();
        if (on) glow(ctx, wx + 4, wy + 6, 14, '#ffd27a', 0.35);
      }
    }
    const tw = Math.sin(time * 0.7 + i) > 0;
    ctx.fillStyle = tw ? '#ffe9a0' : shade(t.far, -10);
    ctx.beginPath();
    ctx.ellipse(bx + 87, y0 - 128, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    if (tw) glow(ctx, bx + 87, y0 - 128, 20, '#ffe9a0', 0.4);
  });
  // Bats looping round the tower, their phases from their own place in the sky.
  ctx.fillStyle = shade(t.far, -18);
  for (let k = 0; k < 3; k++) {
    const a = time * (0.6 + k * 0.15) + k * 2;
    const bx = ((width * (0.3 + k * 0.22) - cam.x * 0.16) % (width + 80) + width + 80) % (width + 80) - 40 + Math.cos(a) * 40;
    const by = y0 - 160 + Math.sin(a * 1.3) * 18;
    const f = Math.sin(time * 14 + k) * 3;
    ctx.beginPath();
    ctx.moveTo(bx - 6, by - f);
    ctx.quadraticCurveTo(bx - 3, by + 2, bx, by);
    ctx.quadraticCurveTo(bx + 3, by + 2, bx + 6, by - f);
    ctx.quadraticCurveTo(bx, by + 4, bx - 6, by - f);
    ctx.fill();
  }
}

// Moonlit Manor, inside: tall arched windows full of moonlight, curtains swaying in a draught, a
// moonbeam slanting across, between dark panelled walls.
function drawFarManorHall(ctx, t, cam, width, y0, time) {
  ctx.fillStyle = t.far;
  ctx.fillRect(0, 0, width, 600);
  repeat(cam.x, 0.2, 170, width, (i, x) => {
    const wx = x + 50;
    const top = y0 - 190;
    ctx.fillStyle = mix(t.sky[2], '#ffffff', 0.25);
    ctx.beginPath();
    ctx.moveTo(wx, y0 - 30);
    ctx.lineTo(wx, top + 30);
    ctx.arc(wx + 30, top + 30, 30, Math.PI, 0);
    ctx.lineTo(wx + 60, y0 - 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = t.farLit;
    ctx.fillRect(snap(wx + 28), top + 2, 4, y0 - 30 - top);
    for (let k = 1; k < 4; k++) ctx.fillRect(snap(wx), snap(top + 30 + k * 32), 60, 3);
    // The moonbeam slanting down to the floor.
    ctx.save();
    ctx.globalAlpha = 0.1 + 0.04 * Math.sin(time * 0.8 + i);
    ctx.fillStyle = '#fff6dc';
    ctx.beginPath();
    ctx.moveTo(wx, top + 20);
    ctx.lineTo(wx + 60, top + 20);
    ctx.lineTo(wx + 150, y0 + 40);
    ctx.lineTo(wx + 70, y0 + 40);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Curtains each side, swaying in the draught.
    for (const s of [-1, 1]) {
      const cx = s < 0 ? wx - 4 : wx + 64;
      const sw = Math.sin(time * 0.9 + i + s) * 4;
      ctx.fillStyle = shade(t.mid, -6);
      ctx.beginPath();
      ctx.moveTo(cx - 12, top - 6);
      ctx.lineTo(cx + 12, top - 6);
      ctx.quadraticCurveTo(cx + 6 * s + sw, y0 - 90, cx + 10 + sw * 1.4, y0 - 20);
      ctx.lineTo(cx - 10 + sw * 1.4, y0 - 20);
      ctx.quadraticCurveTo(cx - 6 * s + sw, y0 - 90, cx - 12, top - 6);
      ctx.fill();
      ctx.fillStyle = t.midTrim;
      ctx.fillRect(snap(cx - 12), snap(y0 - 110), 24, 4);
    }
  });
  // Wainscot along the bottom of the walls.
  ctx.fillStyle = shade(t.far, -8);
  ctx.fillRect(0, snap(y0 - 24), width, 600);
  ctx.fillStyle = t.farLit;
  ctx.fillRect(0, snap(y0 - 24), width, 2);
}

// The manor's middle plane. Outside: the wrought-iron fence, clipped topiaries and lamp posts.
// Inside: columns with candle sconces and the family's portraits, whose eyes follow you.
function drawMidManor(ctx, t, cam, width, y0, time, inside) {
  if (!inside) {
    ctx.fillStyle = shade(t.mid, -14);
    repeat(cam.x, 0.45, 26, width, (i, x) => {
      ctx.fillRect(snap(x), snap(y0 - 40), 3, 44);
      ctx.beginPath();
      ctx.moveTo(x - 2, y0 - 40);
      ctx.lineTo(x + 1.5, y0 - 48);
      ctx.lineTo(x + 5, y0 - 40);
      ctx.fill();
    });
    ctx.fillRect(0, snap(y0 - 30), width, 3);
    ctx.fillRect(0, snap(y0 - 10), width, 3);
    repeat(cam.x, 0.45, 140, width, (i, x) => {
      const s = hash(i + 4);
      if (s < 0.5) place(ctx, topiaryArt(Math.floor(hash(i) * 3)), x + 70, y0 + 4);
      else if (s < 0.8) {
        place(ctx, manorLampArt(), x + 70, y0 + 4);
        glow(ctx, x + 70, y0 - 62, 24, '#ffd27a', 0.4 + 0.12 * Math.sin(time * 5 + i));
      }
    });
    return;
  }
  repeat(cam.x, 0.45, 180, width, (i, x) => {
    place(ctx, hallColumnArt(), x + 20, y0 + 4);
    glow(ctx, x + 20, y0 - 80, 20, '#ffd27a', 0.35 + 0.12 * Math.sin(time * 5 + i));
    if (hash(i + 7) > 0.35) {
      // A portrait whose eyes slide to follow you across the room.
      const look = Math.max(-1, Math.min(1, (width / 2 - (x + 110)) / 200));
      place(ctx, hallPortraitArt(Math.floor(hash(i) * 4), Math.round(look * 2)), x + 110, y0 - 50);
    }
  });
}

// ---------- Moonlit Manor sprites ----------

function topiaryArt(kind) {
  return art(`manor-topiary|${kind}`, 40, 64, () => {
    const g = '#6ab07a';
    const gl = '#9ad8a0';
    const out = [R(14, 52, 12, 12, '#c8a8e8'), F(R(14, 52, 12, 3, '#e6d6f6')), R(19, 34, 2, 20, '#8a6a5a')];
    if (kind === 0) out.push(E(20, 26, 13, 13, g), F(E(16, 21, 6, 5, gl)), E(20, 8, 7, 7, g), F(E(18, 6, 3, 2.4, gl)));
    else if (kind === 1) out.push(T([[20, 0], [34, 36], [6, 36]], g), F(T([[20, 3], [26, 20], [14, 20]], gl)));
    else out.push(E(20, 30, 12, 8, g), E(20, 18, 9, 7, g), E(20, 8, 6, 5, g), F(E(17, 16, 4, 3, gl)), F(E(17, 28, 5, 3, gl)));
    return out;
  });
}
function manorLampArt() {
  return art('manor-lamp', 20, 72, () => [
    R(8.6, 14, 2.8, 56, '#4a3a6a'), R(6, 66, 8, 6, '#4a3a6a'), T([[3, 14], [17, 14], [14, 4], [6, 4]], '#4a3a6a'),
    R(6, 6, 8, 8, '#ffe2a0'), F(R(7, 7, 3, 6, '#fff6dc')), T([[4, 4], [16, 4], [10, 0]], '#5a4a7a'),
  ]);
}
function hallColumnArt() {
  return art('manor-column', 30, 150, () => [
    R(6, 10, 18, 134, '#cdb8ec'), F(R(6, 10, 5, 134, '#e6dcfa')), F(R(19, 10, 5, 134, '#a890d0')),
    R(2, 0, 26, 10, '#e6dcfa'), R(2, 142, 26, 8, '#e6dcfa'),
    // A candle sconce.
    R(13, 76, 4, 4, '#ffd36b'), R(11, 70, 2, 7, '#fff6dc'), R(17, 70, 2, 7, '#fff6dc'), E(12, 68, 1.4, 2.4, '#ffb35a'), E(18, 68, 1.4, 2.4, '#ffb35a'),
  ]);
}
// A family portrait in oils: a carved gilt frame (lit top and left, shadowed bottom and right,
// rosettes at the corners), a dark varnished ground warming toward the sitter, and a bust of one of
// four ancestors in their own dress. The eyes slide to follow you (`look`).
function hallPortraitArt(who, look) {
  return art(`manor-portrait|${who}|${look}`, 44, 56, () => {
    const G = '#e8b84a';
    const GL = '#fff0a8';
    const GD = '#a8782a';
    const ground = ['#4a2a5a', '#2a3a5a', '#5a2a3a', '#2a4a3e'][who];
    const glowC = ['#8a5aa8', '#4a6a9a', '#a85a6a', '#4a8a6e'][who];
    const skin = ['#ffe6d6', '#f6d6c0', '#ffe0d0', '#f2dcd0'][who];
    const skinSh = ['#f2c4b4', '#e0b49a', '#f2bca8', '#dcbcae'][who];
    const out = [
      // Frame: outer moulding, bevels, inner lip.
      R(0, 0, 44, 56, G), F(R(0, 0, 44, 2.4, GL)), F(R(0, 0, 2.4, 56, GL)), F(R(0, 53.6, 44, 2.4, GD)), F(R(41.6, 0, 2.4, 56, GD)),
      F(R(4, 4, 36, 48, GD)), F(R(5, 5, 34, 46, '#3a2440')),
      // The painted ground: dark, with a warm haze behind the head.
      F(R(6, 6, 32, 44, ground)), F(E(22, 22, 13, 14, glowC)), F(E(22, 20, 8, 9, mix(glowC, '#ffffff', 0.15))),
    ];
    // Corner rosettes.
    for (const [x, y] of [[2.6, 2.6], [41.4, 2.6], [2.6, 53.4], [41.4, 53.4]]) out.push(F(E(x, y, 2.6, 2.6, GL)), F(E(x + 0.4, y + 0.4, 1.2, 1.2, GD)));
    const eyes = (y, c = '#3a2d4f') => [F(E(18.6 + look * 0.7, y, 1.3, 1.5, c)), F(E(25.4 + look * 0.7, y, 1.3, 1.5, c)), F(E(18.2 + look * 0.7, y - 0.5, 0.45, 0.45, '#ffffff')), F(E(25 + look * 0.7, y - 0.5, 0.45, 0.45, '#ffffff'))];
    if (who === 0) {
      // The lady: golden ringlets piled high, a violet gown, a string of pearls.
      out.push(F(T([[8, 50], [12, 38], [22, 35], [32, 38], [36, 50]], '#7a4aa8')), F(T([[12, 38], [22, 35], [22, 50], [14, 50]], '#9a6ac8')),
        F(E(22, 37, 6, 2.4, skin)), F(R(20, 30, 4, 6, skin)),
        F(E(22, 15, 10, 8, '#ffd36b')), F(E(13.6, 24, 3, 5, '#ffd36b')), F(E(30.4, 24, 3, 5, '#ffd36b')),
        F(E(22, 23, 7, 8.4, skin)), F(E(25, 25, 3.6, 6, skinSh)), F(E(22, 15.6, 7.6, 4, '#ffd36b')), F(E(19, 13, 3, 2, '#fff2a8')));
      for (let k = 0; k < 7; k++) out.push(F(E(16.6 + k * 1.8, 37.6 + Math.sin((k / 6) * Math.PI) * 1.6, 0.9, 0.9, '#ffffff')));
      out.push(...eyes(23), F(E(17, 26.6, 1.6, 0.9, '#ff9ab8')), F(E(27, 26.6, 1.6, 0.9, '#ff9ab8')), F(R(20.6, 28, 2.8, 1, '#d84a7a')));
    } else if (who === 1) {
      // The lord: dark swept hair, a high white collar and cravat, a navy coat, a moustache.
      out.push(F(T([[7, 50], [11, 37], [22, 34], [33, 37], [37, 50]], '#2a3a7a')), F(T([[11, 37], [22, 34], [20, 50], [12, 50]], '#3a4a9a')),
        F(T([[17, 34], [22, 41], [27, 34], [25, 31], [19, 31]], '#ffffff')), F(T([[20.6, 36], [22, 44], [23.4, 36]], '#e8e8f0')),
        F(R(19.6, 28, 4.8, 5, skin)), F(E(22, 22, 7, 8.4, skin)), F(E(25, 24, 3.6, 6, skinSh)),
        F(T([[14.6, 20], [16, 11], [22, 9], [29, 11], [29.6, 20], [27, 14], [18, 15]], '#3a2a3a')), F(T([[18, 11], [24, 9.6], [21, 12.6]], '#5a4a5a')),
        ...eyes(22), F(T([[18, 27], [22, 25.6], [26, 27], [22, 27.6]], '#3a2a3a')), F(R(20.4, 28.6, 3.2, 0.8, '#b86a6a')));
    } else if (who === 2) {
      // The girl: copper curls, a big blue bow, a rose-pink dress with a lace collar.
      out.push(F(T([[9, 50], [13, 39], [22, 36], [31, 39], [35, 50]], '#ff8ab0')), F(E(22, 38, 8, 2.6, '#fff4f8')),
        F(R(20, 31, 4, 6, skin)), F(E(22, 19, 10, 9, '#e8703a')), F(E(13.4, 27, 3.4, 6, '#e8703a')), F(E(30.6, 27, 3.4, 6, '#e8703a')),
        F(E(22, 25, 6.6, 7.6, skin)), F(E(24.6, 27, 3.4, 5.4, skinSh)), F(E(22, 18, 7, 3.6, '#e8703a')),
        F(T([[22, 11], [14, 7], [14, 15]], '#5a9ae8')), F(T([[22, 11], [30, 7], [30, 15]], '#5a9ae8')), F(E(22, 11, 2, 2, '#3a7ad8')),
        ...eyes(25), F(E(17.4, 28.6, 1.8, 1, '#ff8a9a')), F(E(26.6, 28.6, 1.8, 1, '#ff8a9a')), F(E(22, 30, 1.4, 0.8, '#d84a6a')));
    } else {
      // The grandmother: silver hair in a bun under a lace cap, spectacles, a green shawl, a cameo.
      out.push(F(T([[7, 50], [10, 38], [22, 35], [34, 38], [37, 50]], '#3a7a5a')), F(T([[10, 38], [22, 35], [14, 50], [9, 50]], '#5a9a7a')),
        F(E(22, 39, 2.6, 3, GL)), F(E(22, 39, 1.6, 2, '#ffd8e2')),
        F(R(19.6, 29, 4.8, 6, skin)), F(E(22, 23, 7, 8, skin)), F(E(25, 25, 3.6, 5.6, skinSh)),
        F(E(22, 15, 8.6, 5, '#e8ecff')), F(E(22, 10, 4, 3.4, '#e8ecff')), F(E(22, 12.6, 9.6, 2.4, '#ffffff')), F(E(15, 18, 2, 3, '#e8ecff')), F(E(29, 18, 2, 3, '#e8ecff')),
        ...eyes(23.4),
        ...[18.6, 25.4].map((ex) => {
          // A round wire spectacle rim.
          const o = [];
          const n = [];
          for (let k = 0; k <= 12; k++) {
            const a = (k / 12) * Math.PI * 2;
            o.push([ex + look * 0.7 + Math.cos(a) * 2.7, 23.4 + Math.sin(a) * 2.7]);
            n.push([ex + look * 0.7 + Math.cos(a) * 2.1, 23.4 + Math.sin(a) * 2.1]);
          }
          return F(T([...o, ...n.reverse()], GD));
        }),
        F(R(21, 23, 2, 0.6, GD)),
        F(R(20.6, 27.8, 2.8, 0.8, '#c86a7a')));
    }
    // A brass plaque under the picture.
    out.push(F(R(15, 51.4, 14, 3, GL)), F(R(15, 53.4, 14, 1, GD)));
    return out;
  });
}

// ---------- Each room of the Manor and the Carnival its own backdrop ----------
// (The quality pass: the Ballroom, the Library and the Hallway no longer share the Gallery's
// windows and portraits, and the Midway, the Coaster Yard and the Ferris Wheel no longer share the
// Gates' far view: each room shows what it is.)

const GILT = '#e8c068';
const GILT_D = '#a87a36';
// A flame on a candle wick at (x, y), flickering on its own beat.
function candleFlame(ctx, x, y, time, i, r = 1.6) {
  ctx.fillStyle = '#ffb35a';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.7 + Math.sin(time * 9 + i * 1.3) * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff2c0';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.4, r * 0.5, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
}

// The Ballroom, far back: a wall of tall gilt mirrors, each catching the chandelier's light in a
// sheen that slides across it, pilasters between, rose swags hung over the tops.
function drawFarManorBall(ctx, t, cam, width, y0, time) {
  ctx.fillStyle = t.far;
  ctx.fillRect(0, 0, width, 600);
  const gilt = mix(GILT, t.far, 0.35);
  const giltD = mix(GILT_D, t.far, 0.35);
  repeat(cam.x, 0.2, 150, width, (i, x) => {
    const mx = x + 40;
    const top = y0 - 200;
    const mw = 70;
    // Pilaster between mirrors, fluted, with a gilt capital.
    ctx.fillStyle = shade(t.far, 10);
    ctx.fillRect(snap(x + 128), snap(top - 20), 16, y0 - top + 10);
    ctx.fillStyle = shade(t.far, -6);
    for (let f = 0; f < 3; f++) ctx.fillRect(snap(x + 131 + f * 4), snap(top), 1.5, y0 - top - 30);
    ctx.fillStyle = gilt;
    ctx.fillRect(snap(x + 124), snap(top - 26), 24, 8);
    // The mirror: a gilt frame round an arched pane of soft moonlit glass.
    const pane = (inset) => {
      ctx.beginPath();
      ctx.moveTo(mx + inset, y0 - 20);
      ctx.lineTo(mx + inset, top + 35);
      ctx.arc(mx + mw / 2, top + 35, mw / 2 - inset, Math.PI, 0);
      ctx.lineTo(mx + mw - inset, y0 - 20);
      ctx.closePath();
    };
    pane(-5);
    ctx.fillStyle = giltD;
    ctx.fill();
    pane(-3);
    ctx.fillStyle = gilt;
    ctx.fill();
    pane(2);
    const g = ctx.createLinearGradient(mx, top, mx + mw, y0);
    g.addColorStop(0, mix(t.sky[2], '#ffffff', 0.35));
    g.addColorStop(1, mix(t.far, t.sky[1], 0.5));
    ctx.fillStyle = g;
    ctx.fill();
    // The sheen sliding across the glass, and the chandelier's lights twinkling in it.
    ctx.save();
    pane(2);
    ctx.clip();
    const u = ((time * 0.12 + hash(i)) % 1.4) - 0.2;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(mx + u * 140 - 40, top);
    ctx.lineTo(mx + u * 140 - 22, top);
    ctx.lineTo(mx + u * 140 - 62, y0);
    ctx.lineTo(mx + u * 140 - 80, y0);
    ctx.fill();
    ctx.globalAlpha = 1;
    for (let k = 0; k < 4; k++) {
      const tw = 0.5 + 0.5 * Math.sin(time * 2.4 + k * 1.7 + i);
      ctx.fillStyle = '#fff6d0';
      ctx.globalAlpha = tw;
      ctx.fillRect(snap(mx + 14 + hash(i + k) * (mw - 28)), snap(top + 30 + hash(i + k + 5) * 80), 2, 2);
    }
    ctx.restore();
    // A rose swag draped from this mirror's crown to the next.
    ctx.strokeStyle = mix('#e07aa8', t.far, 0.25);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(mx + mw / 2, top - 6);
    ctx.quadraticCurveTo(mx + mw / 2 + 75, top + 30 + Math.sin(time * 0.6 + i) * 2, mx + mw / 2 + 150, top - 6);
    ctx.stroke();
    ctx.fillStyle = gilt;
    ctx.beginPath();
    ctx.arc(mx + mw / 2, top - 8, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = shade(t.far, -8);
  ctx.fillRect(0, snap(y0 - 24), width, 600);
  ctx.fillStyle = gilt;
  ctx.fillRect(0, snap(y0 - 24), width, 2);
}
// The Ballroom's middle plane: gilt candelabra, gilt chairs with rose cushions along the wall
// waiting for the dancers, and now and then a harp.
function drawMidManorBall(ctx, t, cam, width, y0, time) {
  repeat(cam.x, 0.45, 160, width, (i, x) => {
    const s = hash(i + 4);
    const cx = x + 80;
    if (s < 0.5) {
      // A candelabrum: a tall gilt stem on a foot, five arms of candles.
      ctx.fillStyle = GILT_D;
      ctx.fillRect(snap(cx - 1.5), snap(y0 - 70), 3, 74);
      ctx.beginPath();
      ctx.ellipse(cx, y0 + 2, 9, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = GILT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 16, y0 - 82);
      ctx.quadraticCurveTo(cx - 16, y0 - 68, cx, y0 - 68);
      ctx.quadraticCurveTo(cx + 16, y0 - 68, cx + 16, y0 - 82);
      ctx.moveTo(cx - 8, y0 - 86);
      ctx.quadraticCurveTo(cx - 8, y0 - 74, cx, y0 - 74);
      ctx.quadraticCurveTo(cx + 8, y0 - 74, cx + 8, y0 - 86);
      ctx.stroke();
      for (const [dx, dy] of [[-16, -82], [-8, -86], [0, -90], [8, -86], [16, -82]]) {
        ctx.fillStyle = '#fff6e6';
        ctx.fillRect(snap(cx + dx - 1.5), snap(y0 + dy - 7), 3, 7);
        candleFlame(ctx, cx + dx, y0 + dy - 10, time, i * 5 + dx);
      }
      glow(ctx, cx, y0 - 92, 34, '#ffd27a', 0.3 + 0.08 * Math.sin(time * 5 + i));
    } else if (s < 0.85) {
      // Two gilt chairs side by side, rose seats.
      for (const dx of [-14, 14]) {
        const ch = cx + dx;
        ctx.fillStyle = GILT_D;
        ctx.fillRect(snap(ch - 7), snap(y0 - 14), 2, 18);
        ctx.fillRect(snap(ch + 5), snap(y0 - 14), 2, 18);
        ctx.fillStyle = GILT;
        ctx.beginPath();
        ctx.roundRect(ch - 7, y0 - 38, 14, 22, [7, 7, 2, 2]);
        ctx.fill();
        ctx.fillStyle = '#e07aa8';
        ctx.beginPath();
        ctx.roundRect(ch - 5, y0 - 35, 10, 17, [5, 5, 1, 1]);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(ch - 8, y0 - 17, 16, 5, 2);
        ctx.fill();
      }
    } else {
      // A golden harp, its strings shimmering.
      ctx.strokeStyle = GILT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 10, y0 + 2);
      ctx.lineTo(cx - 10, y0 - 70);
      ctx.quadraticCurveTo(cx + 8, y0 - 80, cx + 16, y0 - 54);
      ctx.lineTo(cx + 4, y0 + 2);
      ctx.stroke();
      ctx.strokeStyle = '#fff6dc';
      ctx.lineWidth = 0.8;
      for (let k = 1; k < 6; k++) {
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 6 + k);
        ctx.beginPath();
        ctx.moveTo(cx - 10 + k * 2.4, y0 - 70 + k * 1.5);
        ctx.lineTo(cx - 10 + k * 2.4, y0 - k * 1.2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  });
}

// The Library, far back: bookcases floor to ceiling, every shelf packed with spines of every
// colour (some leaning, a gap here and there), a rolling ladder on its rail, and a round window
// of moonlight between the bays now and then.
function drawFarLibrary(ctx, t, cam, width, y0, time) {
  ctx.fillStyle = t.far;
  ctx.fillRect(0, 0, width, 600);
  const wood = mix('#7a4a3a', t.far, 0.3);
  const woodD = mix('#4a2a2a', t.far, 0.3);
  const spines = ['#c84a5a', '#4a7ac8', '#5aa878', '#e8b44a', '#8a5ac8', '#e07a4a', '#3a8a8a', '#c8a07a'];
  const top = y0 - 230;
  const shelf = 30;
  repeat(cam.x, 0.2, 130, width, (i, x) => {
    if (Math.abs(i) % 5 === 3) {
      // A round window between bays, moonlight falling from it.
      const wx = x + 65;
      const wy = y0 - 140;
      ctx.fillStyle = woodD;
      ctx.beginPath();
      ctx.arc(wx, wy, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = mix(t.sky[2], '#ffffff', 0.3);
      ctx.beginPath();
      ctx.arc(wx, wy, 29, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = woodD;
      ctx.fillRect(snap(wx - 1.5), snap(wy - 29), 3, 58);
      ctx.fillRect(snap(wx - 29), snap(wy - 1.5), 58, 3);
      ctx.save();
      ctx.globalAlpha = 0.1 + 0.03 * Math.sin(time * 0.7 + i);
      ctx.fillStyle = '#fff6dc';
      ctx.beginPath();
      ctx.moveTo(wx - 28, wy);
      ctx.lineTo(wx + 28, wy);
      ctx.lineTo(wx + 90, y0 + 40);
      ctx.lineTo(wx + 10, y0 + 40);
      ctx.fill();
      ctx.restore();
      return;
    }
    // The case: sides, a crown, shelves; then the books on each shelf.
    ctx.fillStyle = woodD;
    ctx.fillRect(snap(x + 4), snap(top), 122, y0 - top + 10);
    ctx.fillStyle = wood;
    ctx.fillRect(snap(x + 4), snap(top - 10), 122, 10);
    ctx.fillRect(snap(x + 4), snap(top), 6, y0 - top + 10);
    ctx.fillRect(snap(x + 120), snap(top), 6, y0 - top + 10);
    for (let s = 0; top + s * shelf < y0 - 4; s++) {
      const sy = top + s * shelf;
      let bx = x + 12;
      let n = 0;
      while (bx < x + 116) {
        const k = i * 97 + s * 13 + n++;
        const bw = 4 + Math.floor(hash(k) * 5);
        if (bx + bw > x + 118) break;
        if (hash(k + 50) > 0.93) {
          bx += bw + 3;
          continue;
        }
        const bh = shelf - 8 - hash(k + 3) * 8;
        const c = mix(spines[Math.floor(hash(k + 7) * spines.length)], t.far, 0.32);
        const lean = hash(k + 60) > 0.94;
        ctx.fillStyle = c;
        if (lean) {
          ctx.beginPath();
          ctx.moveTo(bx, sy + shelf - 3);
          ctx.lineTo(bx + bw, sy + shelf - 3);
          ctx.lineTo(bx + bw + 6, sy + shelf - 3 - bh);
          ctx.lineTo(bx + 6, sy + shelf - 3 - bh);
          ctx.fill();
          bx += bw + 6;
          continue;
        }
        ctx.fillRect(snap(bx), snap(sy + shelf - 3 - bh), bw, bh);
        ctx.fillStyle = mix(c, '#fff0c8', 0.45);
        ctx.fillRect(snap(bx), snap(sy + shelf - 3 - bh + 3), bw, 1.2);
        ctx.fillRect(snap(bx), snap(sy + shelf - 8), bw, 1.2);
        bx += bw + 0.5;
      }
      ctx.fillStyle = wood;
      ctx.fillRect(snap(x + 8), snap(sy + shelf - 3), 114, 4);
    }
  });
  // The ladder rail along the top, and a rolling ladder leaning on it.
  ctx.fillStyle = mix(GILT_D, t.far, 0.2);
  ctx.fillRect(0, snap(top + 18), width, 3);
  repeat(cam.x, 0.2, 520, width, (i, x) => {
    const lx = x + 200 + hash(i) * 200;
    ctx.strokeStyle = mix('#a87050', t.far, 0.2);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, top + 18);
    ctx.lineTo(lx + 40, y0);
    ctx.moveTo(lx + 22, top + 18);
    ctx.lineTo(lx + 62, y0);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (let r = 1; r < 9; r++) {
      const f = r / 9;
      ctx.beginPath();
      ctx.moveTo(lx + 40 * f, top + 18 + (y0 - top - 18) * f);
      ctx.lineTo(lx + 22 + 40 * f, top + 18 + (y0 - top - 18) * f);
      ctx.stroke();
    }
  });
}
// The Library's middle plane: reading tables under green lamps, a great globe turning on its
// stand, books piled up, and a book or two fluttering loose along the shelves.
function drawMidLibrary(ctx, t, cam, width, y0, time) {
  repeat(cam.x, 0.45, 200, width, (i, x) => {
    const s = hash(i + 4);
    const cx = x + 100;
    if (s < 0.45) {
      // A reading table with a banker's lamp and a pile of books.
      ctx.fillStyle = '#6a3a2a';
      ctx.fillRect(snap(cx - 30), snap(y0 - 28), 60, 6);
      ctx.fillRect(snap(cx - 26), snap(y0 - 22), 4, 26);
      ctx.fillRect(snap(cx + 22), snap(y0 - 22), 4, 26);
      ctx.fillStyle = '#c8a050';
      ctx.fillRect(snap(cx - 12), snap(y0 - 48), 2, 20);
      ctx.fillStyle = '#3aa070';
      ctx.beginPath();
      ctx.ellipse(cx - 11, y0 - 48, 10, 5, 0, Math.PI, 0);
      ctx.fill();
      glow(ctx, cx - 11, y0 - 38, 28, '#ffe6a0', 0.35 + 0.05 * Math.sin(time * 3 + i));
      for (let b = 0; b < 3; b++) {
        ctx.fillStyle = ['#c84a5a', '#4a7ac8', '#e8b44a'][b];
        ctx.fillRect(snap(cx + 6 + b), snap(y0 - 34 - b * 4), 16 - b * 2, 4);
      }
    } else if (s < 0.7) {
      // The globe on its stand, its lands turning slowly.
      ctx.fillStyle = '#8a5a3a';
      ctx.fillRect(snap(cx - 1.5), snap(y0 - 24), 3, 28);
      ctx.fillRect(snap(cx - 10), snap(y0), 20, 4);
      ctx.fillStyle = '#7ac0e0';
      ctx.beginPath();
      ctx.arc(cx, y0 - 40, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, y0 - 40, 16, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#8ad08a';
      const u = (time * 6 + i * 40) % 64;
      for (const [ox, oy, rx, ry] of [[0, -6, 7, 4], [20, 4, 6, 6], [40, -2, 9, 4]]) {
        for (const w of [-64, 0]) {
          ctx.beginPath();
          ctx.ellipse(cx - 32 + ((ox + u) % 64) + w + 32, y0 - 40 + oy, rx, ry, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      ctx.strokeStyle = GILT;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, y0 - 40, 19, Math.PI * 0.6, Math.PI * 2.4);
      ctx.stroke();
    } else {
      // An armchair, deep green, a book left open on its arm.
      ctx.fillStyle = '#2f7a5a';
      ctx.beginPath();
      ctx.roundRect(cx - 18, y0 - 44, 36, 34, 10);
      ctx.fill();
      ctx.fillStyle = '#3a9a6e';
      ctx.beginPath();
      ctx.roundRect(cx - 24, y0 - 24, 48, 22, 8);
      ctx.fill();
      ctx.fillStyle = '#fff4dc';
      ctx.beginPath();
      ctx.moveTo(cx + 14, y0 - 26);
      ctx.lineTo(cx + 20, y0 - 30);
      ctx.lineTo(cx + 26, y0 - 26);
      ctx.lineTo(cx + 20, y0 - 24);
      ctx.fill();
    }
  });
  // A loose book fluttering along, wings beating, its path from its own place in the room.
  for (let k = 0; k < 2; k++) {
    const u = (time * 0.05 + k * 0.5) % 1;
    const bx = ((k * 431 + u * width * 1.6 - cam.x * 0.45) % (width + 100) + width + 100) % (width + 100) - 50;
    const by = y0 - 120 - k * 40 + Math.sin(time * 1.3 + k) * 14;
    const f = Math.sin(time * 10 + k) * 5;
    ctx.fillStyle = ['#c84a5a', '#4a7ac8'][k];
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 9, by - 3 - f);
    ctx.lineTo(bx - 8, by + 4 - f * 0.4);
    ctx.closePath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 9, by - 3 - f);
    ctx.lineTo(bx + 8, by + 4 - f * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff4dc';
    ctx.fillRect(snap(bx - 0.5), snap(by - 2), 1.5, 6);
  }
}

// The Endless Hallway, far back: striped wallpaper with little damask dots, a picture rail and
// panelled wainscot, tall doors with glowing fanlights, and sconces flickering between them.
function drawFarHallway(ctx, t, cam, width, y0, time) {
  ctx.fillStyle = t.far;
  ctx.fillRect(0, 0, width, 600);
  const stripe = shade(t.far, 7);
  repeat(cam.x, 0.2, 24, width, (i, x) => {
    ctx.fillStyle = stripe;
    ctx.fillRect(snap(x), 0, 10, y0);
    ctx.fillStyle = mix(t.far, t.midTrim, 0.25);
    for (let y = 20 + (Math.abs(i) % 2) * 14; y < y0 - 40; y += 28) ctx.fillRect(snap(x + 16), snap(y), 2, 2);
  });
  ctx.fillStyle = mix(GILT_D, t.far, 0.3);
  ctx.fillRect(0, snap(y0 - 200), width, 3);
  repeat(cam.x, 0.2, 360, width, (i, x) => {
    const dx = x + 120;
    // The door: a frame, two tall panels, a brass knob, and a fanlight warm from the room beyond.
    ctx.fillStyle = shade(t.far, -16);
    ctx.fillRect(snap(dx - 6), snap(y0 - 156), 72, 160);
    ctx.fillStyle = mix('#7a4a5a', t.far, 0.3);
    ctx.fillRect(snap(dx), snap(y0 - 130), 60, 134);
    ctx.fillStyle = mix('#8a5a6a', t.far, 0.3);
    ctx.fillRect(snap(dx + 6), snap(y0 - 122), 21, 50);
    ctx.fillRect(snap(dx + 33), snap(y0 - 122), 21, 50);
    ctx.fillRect(snap(dx + 6), snap(y0 - 62), 21, 54);
    ctx.fillRect(snap(dx + 33), snap(y0 - 62), 21, 54);
    ctx.fillStyle = GILT;
    ctx.beginPath();
    ctx.arc(dx + 52, y0 - 66, 2.6, 0, Math.PI * 2);
    ctx.fill();
    const lit = 0.6 + 0.4 * Math.sin(time * 0.6 + i * 2.1);
    ctx.fillStyle = mix(shade(t.far, -16), '#ffd88a', lit);
    ctx.beginPath();
    ctx.arc(dx + 30, y0 - 132, 26, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = shade(t.far, -16);
    ctx.lineWidth = 1.5;
    for (let r = 1; r < 5; r++) {
      const a = Math.PI + (r / 5) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(dx + 30, y0 - 132);
      ctx.lineTo(dx + 30 + Math.cos(a) * 26, y0 - 132 + Math.sin(a) * 26);
      ctx.stroke();
    }
    // Sconces either side of the door.
    for (const sx of [dx - 70, dx + 130]) {
      ctx.fillStyle = GILT_D;
      ctx.fillRect(snap(sx - 4), snap(y0 - 100), 8, 3);
      ctx.fillStyle = '#fff6e6';
      ctx.fillRect(snap(sx - 1.5), snap(y0 - 110), 3, 10);
      candleFlame(ctx, sx, y0 - 113, time, i * 3 + sx * 0.01);
      glow(ctx, sx, y0 - 112, 26, '#ffd27a', 0.3 + 0.08 * Math.sin(time * 6 + i + sx));
    }
  });
  ctx.fillStyle = shade(t.far, -10);
  ctx.fillRect(0, snap(y0 - 34), width, 600);
  repeat(cam.x, 0.2, 60, width, (i, x) => {
    ctx.strokeStyle = shade(t.far, -18);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(snap(x + 6), snap(y0 - 28), 48, 22);
  });
  ctx.fillStyle = t.farLit;
  ctx.fillRect(0, snap(y0 - 34), width, 2);
}
// The Hallway's middle plane: grandfather clocks with their pendulums swinging, side tables with
// vases of flowers, and tall potted ferns.
function drawMidHallway(ctx, t, cam, width, y0, time) {
  repeat(cam.x, 0.45, 210, width, (i, x) => {
    const s = hash(i + 4);
    const cx = x + 100;
    if (s < 0.45) {
      // A grandfather clock: a hood with its face, the long case with a window on the pendulum.
      ctx.fillStyle = '#6a3a3a';
      ctx.fillRect(snap(cx - 12), snap(y0 - 100), 24, 104);
      ctx.beginPath();
      ctx.arc(cx, y0 - 100, 14, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fff4dc';
      ctx.beginPath();
      ctx.arc(cx, y0 - 96, 9, 0, Math.PI * 2);
      ctx.fill();
      const hr = time * 0.05 + i;
      ctx.strokeStyle = '#3a2d4f';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, y0 - 96);
      ctx.lineTo(cx + Math.cos(hr * 12) * 7, y0 - 96 + Math.sin(hr * 12) * 7);
      ctx.moveTo(cx, y0 - 96);
      ctx.lineTo(cx + Math.cos(hr) * 5, y0 - 96 + Math.sin(hr) * 5);
      ctx.stroke();
      ctx.fillStyle = '#3a2030';
      ctx.fillRect(snap(cx - 7), snap(y0 - 80), 14, 56);
      const sw = Math.sin(time * Math.PI + i) * 0.35;
      ctx.strokeStyle = GILT;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, y0 - 78);
      ctx.lineTo(cx + Math.sin(sw) * 40, y0 - 78 + Math.cos(sw) * 40);
      ctx.stroke();
      ctx.fillStyle = GILT;
      ctx.beginPath();
      ctx.arc(cx + Math.sin(sw) * 42, y0 - 78 + Math.cos(sw) * 42, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (s < 0.8) {
      // A side table with a vase of flowers, nodding in the draught.
      ctx.fillStyle = '#6a3a3a';
      ctx.fillRect(snap(cx - 18), snap(y0 - 30), 36, 5);
      ctx.fillRect(snap(cx - 14), snap(y0 - 25), 3, 29);
      ctx.fillRect(snap(cx + 11), snap(y0 - 25), 3, 29);
      ctx.fillStyle = '#c8d8f0';
      ctx.beginPath();
      ctx.ellipse(cx, y0 - 38, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      const nod = Math.sin(time * 1.1 + i) * 1.5;
      for (const [fx, fy, c] of [[-6, -54, '#ff9ec0'], [0, -58, '#ffe36b'], [6, -53, '#c9a6ff']]) {
        ctx.strokeStyle = '#6fbf5a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, y0 - 44);
        ctx.lineTo(cx + fx + nod, y0 + fy);
        ctx.stroke();
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(cx + fx + nod, y0 + fy, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // A tall fern in a pot, its fronds swaying.
      ctx.fillStyle = '#c8806a';
      ctx.beginPath();
      ctx.moveTo(cx - 9, y0 - 18);
      ctx.lineTo(cx + 9, y0 - 18);
      ctx.lineTo(cx + 6, y0 + 4);
      ctx.lineTo(cx - 6, y0 + 4);
      ctx.fill();
      ctx.strokeStyle = '#5aa878';
      ctx.lineWidth = 3;
      for (let f = 0; f < 5; f++) {
        const a = -Math.PI / 2 + (f - 2) * 0.45 + Math.sin(time * 1.2 + i + f) * 0.05;
        ctx.beginPath();
        ctx.moveTo(cx, y0 - 18);
        ctx.quadraticCurveTo(cx + Math.cos(a) * 20, y0 - 18 + Math.sin(a) * 30, cx + Math.cos(a) * 30, y0 - 18 + Math.sin(a) * 26 + 10);
        ctx.stroke();
      }
    }
  });
}

// ---------- The Carnival's outdoor rooms ----------

// A striped, scalloped awning from x to x + w at y, in two colours.
function awning(ctx, x, y, w, h, c1, c2) {
  const n = Math.max(3, Math.round(w / 12));
  const sw = w / n;
  for (let k = 0; k < n; k++) {
    ctx.fillStyle = k % 2 ? c2 : c1;
    ctx.beginPath();
    ctx.moveTo(x + k * sw, y);
    ctx.lineTo(x + (k + 1) * sw, y);
    ctx.lineTo(x + (k + 1) * sw, y + h);
    ctx.arc(x + (k + 0.5) * sw, y + h, sw / 2, 0, Math.PI);
    ctx.fill();
  }
}
// A string of bulbs drooping from (x0, y) to (x1, y), lights chasing along it.
function bulbString(ctx, x0, x1, y, sag, time, i, wire) {
  ctx.strokeStyle = wire;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y);
  ctx.stroke();
  for (let k = 1; k < 8; k++) {
    const f = k / 8;
    const bx = x0 + (x1 - x0) * f;
    const by = y + sag * 4 * f * (1 - f);
    const on = (Math.floor(time * 5) + k + i) % 3 === 0;
    ctx.fillStyle = on ? '#fff6c0' : pick(['#ff7aa8', '#ffd36b', '#7fd8ff', '#9ae66a'], hash(i * 8 + k));
    ctx.beginPath();
    ctx.arc(bx, by + 2, on ? 2.4 : 1.8, 0, Math.PI * 2);
    ctx.fill();
    if (on) glow(ctx, bx, by + 2, 9, '#ffe2a0', 0.45);
  }
}

// The Midway, far back: the carousel's striped canopy rising over a long row of game stalls under
// their awnings, strings of bulbs between, the evening sky behind.
function drawFarMidway(ctx, t, cam, width, y0, time) {
  backRidge(ctx, t, cam, width, y0 - 30, 26, true);
  ctx.fillStyle = t.far;
  ctx.fillRect(0, snap(y0 + 20), width, 400);
  // The carousel, far off, its canopy and flags turning.
  repeat(cam.x, 0.1, 700, width, (i, x) => {
    const cx = x + 350;
    const cy = y0 - 60;
    const far = (c) => mix(c, t.far, 0.4);
    ctx.fillStyle = far('#ffe6c8');
    ctx.fillRect(cx - 70, cy, 140, 84);
    const rot = (time * 0.4 + i) % (Math.PI * 2);
    for (let k = 0; k < 10; k++) {
      ctx.fillStyle = far(k % 2 ? '#ffffff' : '#ff6a8a');
      ctx.beginPath();
      ctx.moveTo(cx, cy - 70);
      ctx.lineTo(cx - 80 + k * 16, cy);
      ctx.lineTo(cx - 64 + k * 16, cy);
      ctx.fill();
    }
    awning(ctx, cx - 80, cy - 2, 160, 6, far('#ffd36b'), far('#ffffff'));
    ctx.fillStyle = far('#ffd36b');
    ctx.fillRect(cx - 1, cy - 90, 2, 22);
    ctx.beginPath();
    ctx.moveTo(cx + 1, cy - 90);
    ctx.lineTo(cx + 12 + Math.sin(time * 3 + i) * 2, cy - 86);
    ctx.lineTo(cx + 1, cy - 82);
    ctx.fill();
    // Horses rising and falling under it, side on.
    for (let k = 0; k < 5; k++) {
      const hx = cx - 56 + ((k * 28 + time * 20) % 140);
      const hy = cy + 40 + Math.sin(time * 2 + k * 1.3) * 8;
      ctx.fillStyle = far(k % 2 ? '#ffffff' : '#ffd0e0');
      ctx.fillRect(hx - 0.5, cy + 6, 1, 70);
      ctx.beginPath();
      ctx.ellipse(hx, hy, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(hx + 5, hy - 8, 3, 7);
    }
    glow(ctx, cx, cy + 40, 90, '#ffd27a', 0.25 + 0.05 * Math.sin(time * 2));
  });
  // A long row of stalls, nearer.
  repeat(cam.x, 0.2, 110, width, (i, x) => {
    const c = pick(['#ff6a8a', '#ffb347', '#6ac8e0', '#9a6ae0', '#6ad09a'], hash(i));
    ctx.fillStyle = shade(t.far, -6);
    ctx.fillRect(snap(x + 8), snap(y0 - 40), 94, 64);
    ctx.fillStyle = mix('#ffd88a', t.far, 0.25 + 0.15 * Math.sin(time + i));
    ctx.fillRect(snap(x + 14), snap(y0 - 26), 82, 30);
    awning(ctx, x + 4, y0 - 52, 102, 10, mix(c, t.far, 0.3), mix('#ffffff', t.far, 0.3));
    ctx.fillStyle = mix('#fff0c0', t.far, 0.2);
    ctx.fillRect(snap(x + 34), snap(y0 - 66), 42, 12);
    bulbString(ctx, x + 4, x + 114, y0 - 70, 6, time, i, shade(t.far, -18));
  });
}
// The Midway's middle plane: prize booths with plush toys and ring-toss bottles, a popcorn cart
// steaming, and a balloon seller's bunch bobbing on its strings.
function drawMidMidway(ctx, t, cam, width, y0, time) {
  repeat(cam.x, 0.45, 230, width, (i, x) => {
    const s = hash(i + 4);
    const cx = x + 110;
    if (s < 0.5) {
      // A prize booth: posts, a striped awning, plushies hanging on the back, bottles on the counter.
      const c = pick(['#ff6a8a', '#ffb347', '#6ac8e0'], hash(i + 1));
      ctx.fillStyle = '#c8906a';
      ctx.fillRect(snap(cx - 40), snap(y0 - 64), 4, 68);
      ctx.fillRect(snap(cx + 36), snap(y0 - 64), 4, 68);
      ctx.fillStyle = '#fff0e0';
      ctx.fillRect(snap(cx - 36), snap(y0 - 60), 72, 40);
      awning(ctx, cx - 44, y0 - 76, 88, 10, c, '#ffffff');
      for (let p = 0; p < 4; p++) {
        const px = cx - 26 + p * 17;
        const sway = Math.sin(time * 1.6 + p + i) * 1.5;
        ctx.strokeStyle = '#8a6a5a';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(px, y0 - 60);
        ctx.lineTo(px + sway, y0 - 52);
        ctx.stroke();
        ctx.fillStyle = ['#ffb0c8', '#c8a07a', '#a8d8ff', '#ffe08a'][p];
        ctx.beginPath();
        ctx.arc(px + sway, y0 - 46, 5, 0, Math.PI * 2);
        ctx.arc(px + sway - 4, y0 - 51, 2, 0, Math.PI * 2);
        ctx.arc(px + sway + 4, y0 - 51, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a2d4f';
        ctx.fillRect(snap(px + sway - 2), snap(y0 - 47), 1, 1);
        ctx.fillRect(snap(px + sway + 1), snap(y0 - 47), 1, 1);
      }
      ctx.fillStyle = c;
      ctx.fillRect(snap(cx - 42), snap(y0 - 20), 84, 24);
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 6; k++) ctx.fillRect(snap(cx - 40 + k * 14), snap(y0 - 20), 7, 24);
      for (let b = 0; b < 5; b++) {
        ctx.fillStyle = ['#7fd8a8', '#7fb8ff', '#ff9ec0'][b % 3];
        ctx.fillRect(snap(cx - 22 + b * 10), snap(y0 - 30), 4, 10);
        ctx.fillRect(snap(cx - 21 + b * 10), snap(y0 - 34), 2, 4);
      }
    } else if (s < 0.75) {
      // The popcorn cart, red and gold, steam curling off the kernels.
      ctx.fillStyle = '#e04a5a';
      ctx.fillRect(snap(cx - 18), snap(y0 - 30), 36, 24);
      ctx.fillStyle = '#e8f4ff';
      ctx.fillRect(snap(cx - 14), snap(y0 - 56), 28, 26);
      ctx.fillStyle = '#fff4c0';
      for (let k = 0; k < 12; k++) {
        ctx.beginPath();
        ctx.arc(cx - 11 + hash(i * 12 + k) * 22, y0 - 34 - hash(i * 12 + k + 3) * 12, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#e04a5a';
      ctx.beginPath();
      ctx.moveTo(cx - 20, y0 - 56);
      ctx.lineTo(cx, y0 - 68);
      ctx.lineTo(cx + 20, y0 - 56);
      ctx.fill();
      ctx.fillStyle = '#ffd36b';
      for (const wx of [-12, 12]) {
        ctx.beginPath();
        ctx.arc(cx + wx, y0 - 4, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let k = 0; k < 3; k++) {
        const u = (time * 0.4 + k / 3) % 1;
        ctx.globalAlpha = 0.4 * Math.sin(u * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 6 + k * 6 + Math.sin(u * 6 + k) * 3, y0 - 72 - u * 24, 3 + u * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      // A balloon seller's bunch, tied to a post, bobbing on its strings.
      ctx.fillStyle = '#c8906a';
      ctx.fillRect(snap(cx - 1.5), snap(y0 - 40), 3, 44);
      for (let b = 0; b < 6; b++) {
        const bx = cx - 18 + (b % 3) * 18 + Math.sin(time * 1.4 + b + i) * 3;
        const by = y0 - 84 - Math.floor(b / 3) * 18 + Math.cos(time * 1.1 + b) * 2;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(cx, y0 - 40);
        ctx.lineTo(bx, by + 9);
        ctx.stroke();
        ctx.fillStyle = ['#ff6a8a', '#ffd36b', '#7fd8ff', '#9ae66a', '#c9a6ff', '#ff9a5a'][b];
        ctx.beginPath();
        ctx.ellipse(bx, by, 7, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(bx - 2.4, by - 3, 1.6, 2.6, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  });
}

// The coaster's track over a stretch of world: its height at world x (rises, a big drop, hills).
const trackY = (wx, y0) => y0 - 120 + Math.sin(wx * 0.006) * 60 + Math.sin(wx * 0.017 + 1) * 18;
// The Coaster Yard, far back: the great wooden coaster running across the sky on its trestles of
// criss-cross timber, lights along the rails, and the train racing round it, up and down.
function drawFarCoaster(ctx, t, cam, width, y0, time) {
  backRidge(ctx, t, cam, width, y0 - 30, 24, true);
  ctx.fillStyle = t.far;
  ctx.fillRect(0, snap(y0 + 20), width, 400);
  const off = cam.x * 0.2;
  const timber = mix('#c8a07a', t.far, 0.45);
  // Trestles under the track: legs and crossed braces every 30 px of world.
  ctx.strokeStyle = timber;
  ctx.lineWidth = 1.4;
  repeat(cam.x, 0.2, 30, width, (i, x) => {
    const ty = trackY(i * 30, y0);
    const ty2 = trackY(i * 30 + 30, y0);
    ctx.beginPath();
    ctx.moveTo(x, ty);
    ctx.lineTo(x, y0 + 24);
    for (let y = ty; y < y0 + 10; y += 28) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 30, Math.min(y0 + 24, y + 28 + (ty2 - ty)));
      ctx.moveTo(x + 30, y + (ty2 - ty));
      ctx.lineTo(x, Math.min(y0 + 24, y + 28));
    }
    ctx.stroke();
  });
  // The rails, lit at intervals.
  ctx.strokeStyle = mix('#ff7aa8', t.far, 0.25);
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = -10; x <= width + 10; x += 6) ctx.lineTo(x, trackY(x + off, y0));
  ctx.stroke();
  repeat(cam.x, 0.2, 40, width, (i, x) => {
    const on = (Math.floor(time * 6) + i) % 5 === 0;
    ctx.fillStyle = on ? '#fff6c0' : mix('#ffd36b', t.far, 0.3);
    ctx.beginPath();
    ctx.arc(x, trackY(i * 40, y0) - 3, on ? 2.2 : 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
  // The train: three cars riding the rails, tilting with the track, quick on the drops.
  const lap = width * 2.2;
  const head = ((time * 160) % lap) - width * 0.6;
  for (let k = 0; k < 3; k++) {
    const sx = head - k * 22;
    if (sx < -30 || sx > width + 30) continue;
    const wy = trackY(sx + off, y0);
    const a = Math.atan2(trackY(sx + off + 4, y0) - wy, 4);
    ctx.save();
    ctx.translate(sx, wy - 4);
    ctx.rotate(a);
    ctx.fillStyle = mix(['#ffd36b', '#7fd8ff', '#ff7aa8'][k], t.far, 0.2);
    ctx.beginPath();
    ctx.roundRect(-10, -8, 20, 9, 3);
    ctx.fill();
    ctx.fillStyle = mix('#fff0e6', t.far, 0.2);
    for (const dx of [-5, 3]) {
      ctx.beginPath();
      ctx.arc(dx, -10, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
// The yard's middle plane: the nearest trestle legs, braced, a lift-hill chain humming up one,
// stacks of crates and cable drums, and a sign warning riders to keep their arms in.
function drawMidCoaster(ctx, t, cam, width, y0, time) {
  repeat(cam.x, 0.45, 260, width, (i, x) => {
    const lx = x + 60;
    ctx.fillStyle = '#b8885a';
    ctx.fillRect(snap(lx), snap(y0 - 150), 7, 154);
    ctx.fillRect(snap(lx + 60), snap(y0 - 150), 7, 154);
    ctx.strokeStyle = '#a07048';
    ctx.lineWidth = 3;
    for (let y = y0 - 140; y < y0 - 20; y += 40) {
      ctx.beginPath();
      ctx.moveTo(lx + 4, y);
      ctx.lineTo(lx + 63, y + 40);
      ctx.moveTo(lx + 63, y);
      ctx.lineTo(lx + 4, y + 40);
      ctx.stroke();
    }
    ctx.fillStyle = '#ff7aa8';
    ctx.fillRect(snap(lx - 6), snap(y0 - 156), 80, 7);
    // Lift-hill chain links crawling up on the odd one.
    if (hash(i + 3) > 0.5) {
      ctx.fillStyle = '#9aa8c6';
      for (let k = 0; k < 8; k++) {
        const u = ((time * 0.6 + k / 8) % 1);
        ctx.fillRect(snap(lx + 30), snap(y0 - u * 150), 3, 4);
      }
    }
    const s = hash(i + 5);
    if (s < 0.5) {
      for (const [dx, dy, w] of [[100, 0, 26], [128, 0, 22], [112, -22, 22]]) {
        ctx.fillStyle = '#c8945a';
        ctx.fillRect(snap(lx + dx), snap(y0 + dy - 22), w, 22);
        ctx.strokeStyle = '#8a5a3a';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(snap(lx + dx + 2), snap(y0 + dy - 20), w - 4, 18);
        ctx.beginPath();
        ctx.moveTo(lx + dx + 2, y0 + dy - 20);
        ctx.lineTo(lx + dx + w - 2, y0 + dy - 2);
        ctx.stroke();
      }
    } else if (s < 0.8) {
      ctx.fillStyle = '#ffd36b';
      ctx.fillRect(snap(lx + 120), snap(y0 - 50), 3, 54);
      ctx.beginPath();
      ctx.moveTo(lx + 121, y0 - 76);
      ctx.lineTo(lx + 143, y0 - 50);
      ctx.lineTo(lx + 99, y0 - 50);
      ctx.fill();
      ctx.fillStyle = '#3a2d4f';
      ctx.fillRect(snap(lx + 120), snap(y0 - 68), 3, 10);
      ctx.fillRect(snap(lx + 120), snap(y0 - 56), 3, 3);
    } else {
      ctx.fillStyle = '#8a6a9a';
      ctx.beginPath();
      ctx.arc(lx + 120, y0 - 16, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5a4a6a';
      ctx.beginPath();
      ctx.arc(lx + 120, y0 - 16, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// The Ferris Wheel, far back: the great wheel itself filling the sky, turning slowly, its rim
// lights chasing round, the cars swinging gently as they ride, on its tall A-frame legs.
function drawFarFerris(ctx, t, cam, width, y0, time) {
  backRidge(ctx, t, cam, width, y0 - 30, 22, true);
  ctx.fillStyle = t.far;
  ctx.fillRect(0, snap(y0 + 20), width, 400);
  const cx = width * 0.55 - cam.x * 0.06;
  const cy = y0 - 150;
  const r = 140;
  const rim = mix('#fff0e6', t.far, 0.3);
  const turn = time * 0.08;
  // The legs.
  ctx.fillStyle = mix('#c8b8e0', t.far, 0.4);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + s * 70, y0 + 30);
    ctx.lineTo(cx + s * 58, y0 + 30);
    ctx.lineTo(cx, cy + 16);
    ctx.fill();
  }
  // Spokes and the double rim.
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.4;
  for (let k = 0; k < 16; k++) {
    const a = turn + (k / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.lineWidth = 3;
  for (const rr of [r, r - 10]) {
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Rim lights chasing round.
  for (let k = 0; k < 48; k++) {
    const a = turn + (k / 48) * Math.PI * 2;
    const on = (Math.floor(time * 8) + k) % 6 < 2;
    ctx.fillStyle = on ? '#fff6c0' : pick(['#ff7aa8', '#ffd36b', '#7fd8ff'], (k % 3) / 3);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * (r - 5), cy + Math.sin(a) * (r - 5), on ? 2.4 : 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // The cars, hanging level and swinging a little as they ride.
  for (let k = 0; k < 16; k++) {
    const a = turn + (k / 16) * Math.PI * 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    const sw = Math.sin(time * 1.4 + k) * 0.12;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(sw);
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.fillStyle = mix(['#ff7aa8', '#ffd36b', '#7fd8ff', '#9ae66a'][k % 4], t.far, 0.25);
    ctx.beginPath();
    ctx.roundRect(-9, 6, 18, 14, [8, 8, 3, 3]);
    ctx.fill();
    ctx.fillStyle = mix('#fff4c8', t.far, 0.2 + 0.2 * Math.sin(time + k));
    ctx.fillRect(-6, 9, 12, 5);
    ctx.restore();
  }
  // The hub, gilded, with a star.
  ctx.fillStyle = '#ffd36b';
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
  glow(ctx, cx, cy, 40, '#ffe2a0', 0.35 + 0.08 * Math.sin(time * 2));
  // Small tents round its foot.
  repeat(cam.x, 0.2, 300, width, (i, x) => {
    const tx = x + 40 + hash(i) * 120;
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = k % 2 ? shade(t.far, 8) : mix(t.far, '#ffd36b', 0.3);
      ctx.beginPath();
      ctx.moveTo(tx + 30, y0 - 40);
      ctx.lineTo(tx + k * 15, y0 + 20);
      ctx.lineTo(tx + (k + 1) * 15, y0 + 20);
      ctx.fill();
    }
  });
}
// The plaza at the wheel's foot: globe lamps on curly posts, flower planters, benches, and the
// ticket kiosk with its striped roof.
function drawMidFerris(ctx, t, cam, width, y0, time) {
  repeat(cam.x, 0.45, 190, width, (i, x) => {
    const s = hash(i + 4);
    const cx = x + 90;
    // A globe lamp on every bay.
    ctx.fillStyle = '#4a3a6a';
    ctx.fillRect(snap(cx - 1.5), snap(y0 - 70), 3, 74);
    ctx.strokeStyle = '#4a3a6a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx + 8, y0 - 70, 8, Math.PI, Math.PI * 1.9);
    ctx.stroke();
    ctx.fillStyle = '#fff2c8';
    ctx.beginPath();
    ctx.arc(cx, y0 - 76, 6, 0, Math.PI * 2);
    ctx.fill();
    glow(ctx, cx, y0 - 76, 24, '#ffe2a0', 0.4 + 0.08 * Math.sin(time * 4 + i));
    if (s < 0.4) {
      // A bench.
      ctx.fillStyle = '#c8806a';
      ctx.fillRect(snap(cx + 24), snap(y0 - 22), 44, 4);
      ctx.fillRect(snap(cx + 24), snap(y0 - 34), 44, 3);
      ctx.fillRect(snap(cx + 24), snap(y0 - 28), 44, 3);
      ctx.fillStyle = '#4a3a6a';
      ctx.fillRect(snap(cx + 27), snap(y0 - 18), 3, 22);
      ctx.fillRect(snap(cx + 62), snap(y0 - 18), 3, 22);
    } else if (s < 0.75) {
      // A planter of flowers, nodding.
      ctx.fillStyle = '#e8b0c8';
      ctx.fillRect(snap(cx + 28), snap(y0 - 16), 40, 20);
      for (let f = 0; f < 6; f++) {
        const fx = cx + 32 + f * 6.4;
        const nod = Math.sin(time * 1.4 + f + i) * 1.2;
        ctx.fillStyle = '#6fbf5a';
        ctx.fillRect(snap(fx), snap(y0 - 24), 1.2, 8);
        ctx.fillStyle = ['#ff9ec0', '#ffe36b', '#c9a6ff'][f % 3];
        ctx.beginPath();
        ctx.arc(fx + nod, y0 - 26, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // The ticket kiosk.
      ctx.fillStyle = '#ffe6f0';
      ctx.fillRect(snap(cx + 26), snap(y0 - 50), 36, 54);
      ctx.fillStyle = '#fff6c8';
      ctx.fillRect(snap(cx + 32), snap(y0 - 42), 24, 16);
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = k % 2 ? '#ffffff' : '#ff6a8a';
        ctx.beginPath();
        ctx.moveTo(cx + 44, y0 - 70);
        ctx.lineTo(cx + 22 + k * 11, y0 - 50);
        ctx.lineTo(cx + 33 + k * 11, y0 - 50);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd36b';
      ctx.fillRect(snap(cx + 30), snap(y0 - 22), 28, 4);
    }
  });
}

// The Sunken Aquarium Palace, far back: sunbeams slanting down through the water, the palace's
// domes and spires as soft blue silhouettes with lit portholes, and kelp swaying in the deep.
function drawFarReef(ctx, t, cam, width, y0, time) {
  // Light rays from the surface, swaying slowly.
  ctx.save();
  for (let k = 0; k < 5; k++) {
    const x = ((k * 173 - cam.x * 0.05) % (width + 200) + width + 200) % (width + 200) - 100;
    const sway = Math.sin(time * 0.4 + k * 1.7) * 30;
    ctx.globalAlpha = 0.08 + 0.04 * Math.sin(time * 0.7 + k);
    ctx.fillStyle = '#e6fbff';
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.lineTo(x + 40, -10);
    ctx.lineTo(x + 120 + sway, y0 + 60);
    ctx.lineTo(x + 50 + sway, y0 + 60);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  backRidge(ctx, t, cam, width, y0 - 20, 30, true);
  ctx.fillStyle = t.far;
  ctx.fillRect(0, snap(y0 + 20), width, 400);
  // The palace's stone: a body clear of the water's colour, a lit face toward the surface light,
  // a shadow side, and the trim colour picked out in bands.
  const body = mix(shade(t.far, -5), t.sky[0], 0.2);
  const lit = mix(body, t.farLit, 0.5);
  const dark = shade(body, -8);
  const trim = mix(t.midTrim ?? t.farLit, body, 0.55);
  repeat(cam.x, 0.16, 380, width, (i, x) => {
    const bx = x + 40 + hash(i) * 120;
    // A palace wing: a long hall with a scalloped parapet and arcade, two onion-domed towers, and a
    // shell-topped spire in the middle.
    ctx.fillStyle = body;
    ctx.fillRect(snap(bx), snap(y0 - 60), 200, 300);
    ctx.fillStyle = lit;
    ctx.fillRect(snap(bx), snap(y0 - 60), 200, 3);
    for (let s = 0; s < 10; s++) {
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(bx + 10 + s * 20, y0 - 60, 10, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = lit;
      ctx.beginPath();
      ctx.arc(bx + 10 + s * 20, y0 - 60, 10, Math.PI, Math.PI * 1.4);
      ctx.lineTo(bx + 10 + s * 20, y0 - 60);
      ctx.fill();
    }
    // The arcade along the hall: deep round-headed bays.
    ctx.fillStyle = dark;
    for (let a = 0; a < 6; a++) {
      const ax = bx + 62 + a * 13;
      if (a === 3) continue;
      ctx.beginPath();
      ctx.moveTo(ax, y0 + 10);
      ctx.lineTo(ax, y0 - 4);
      ctx.arc(ax + 4, y0 - 4, 4, Math.PI, 0);
      ctx.lineTo(ax + 8, y0 + 10);
      ctx.fill();
    }
    ctx.fillStyle = trim;
    ctx.fillRect(snap(bx), snap(y0 - 14), 200, 2);
    for (const [dx, h] of [[20, 120], [150, 104]]) {
      const tx = bx + dx;
      ctx.fillStyle = body;
      ctx.fillRect(snap(tx), snap(y0 - h), 34, h);
      ctx.fillStyle = lit;
      ctx.fillRect(snap(tx), snap(y0 - h), 7, h - 60);
      ctx.fillStyle = dark;
      ctx.fillRect(snap(tx + 27), snap(y0 - h), 7, h - 60);
      // The onion dome: body, a lit crescent, a band at its foot and a pearl finial.
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(tx - 6, y0 - h);
      ctx.bezierCurveTo(tx - 10, y0 - h - 28, tx + 12, y0 - h - 34, tx + 17, y0 - h - 52);
      ctx.bezierCurveTo(tx + 22, y0 - h - 34, tx + 44, y0 - h - 28, tx + 40, y0 - h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = lit;
      ctx.beginPath();
      ctx.moveTo(tx - 4, y0 - h);
      ctx.bezierCurveTo(tx - 8, y0 - h - 26, tx + 10, y0 - h - 32, tx + 17, y0 - h - 50);
      ctx.bezierCurveTo(tx + 6, y0 - h - 30, tx + 4, y0 - h - 18, tx + 8, y0 - h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = trim;
      ctx.fillRect(snap(tx - 6), snap(y0 - h - 3), 46, 4);
      ctx.beginPath();
      ctx.arc(tx + 17, y0 - h - 55, 3, 0, Math.PI * 2);
      ctx.fill();
      // A tall lancet window up the tower, lit from within.
      ctx.fillStyle = '#bff6ff';
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(time * 0.6 + dx + i);
      ctx.beginPath();
      ctx.moveTo(tx + 13, y0 - h + 46);
      ctx.lineTo(tx + 13, y0 - h + 22);
      ctx.arc(tx + 17, y0 - h + 22, 4, Math.PI, 0);
      ctx.lineTo(tx + 21, y0 - h + 46);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // The spire: a ribbed shell cone on a drum.
    ctx.fillStyle = body;
    ctx.fillRect(snap(bx + 88), snap(y0 - 78), 24, 20);
    ctx.beginPath();
    ctx.moveTo(bx + 86, y0 - 78);
    ctx.lineTo(bx + 100, y0 - 156);
    ctx.lineTo(bx + 114, y0 - 78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = lit;
    ctx.beginPath();
    ctx.moveTo(bx + 86, y0 - 78);
    ctx.lineTo(bx + 100, y0 - 156);
    ctx.lineTo(bx + 95, y0 - 78);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = trim;
    ctx.lineWidth = 1.2;
    for (let r = 1; r < 5; r++) {
      const ry = y0 - 78 - r * 15;
      const half = 14 * (1 - (r * 15) / 78);
      ctx.beginPath();
      ctx.moveTo(bx + 100 - half, ry);
      ctx.quadraticCurveTo(bx + 100, ry + 3, bx + 100 + half, ry);
      ctx.stroke();
    }
    // Portholes lit from within, breathing.
    for (let c = 0; c < 5; c++) {
      const on = Math.sin(time * 0.5 + c * 1.3 + i * 2) > -0.4;
      const wx = bx + 24 + c * 36;
      const wy = y0 - 34;
      ctx.fillStyle = on ? '#bff6ff' : shade(t.far, -10);
      ctx.beginPath();
      ctx.arc(wx, wy, 5, 0, Math.PI * 2);
      ctx.fill();
      if (on) glow(ctx, wx, wy, 14, '#bff6ff', 0.3);
    }
  });
  // Tall kelp swaying in the deep, its phase from its own place on the sea floor.
  ctx.fillStyle = shade(t.far, 6);
  repeat(cam.x, 0.22, 70, width, (i, x) => {
    if (hash(i + 31) < 0.4) return;
    const h = 120 + hash(i + 2) * 120;
    const wx = x + cam.x * 0.22;
    ctx.beginPath();
    ctx.moveTo(x, y0 + 30);
    for (let k = 1; k <= 8; k++) {
      const u = k / 8;
      ctx.lineTo(x + Math.sin(time * 0.9 + wx * 0.02 + u * 3) * 10 * u, y0 + 30 - h * u);
    }
    for (let k = 8; k >= 0; k--) {
      const u = k / 8;
      ctx.lineTo(x + 6 + Math.sin(time * 0.9 + wx * 0.02 + u * 3) * 10 * u, y0 + 30 - h * u);
    }
    ctx.fill();
  });
}

// The middle plane: coral clusters, sea fans, giant clam shells, and little schools of fish that
// turn together.
function drawMidReef(ctx, t, cam, width, y0, time) {
  repeat(cam.x, 0.45, 120, width, (i, x) => {
    const s = hash(i + 4);
    if (s < 0.4) place(ctx, coralArt(Math.floor(hash(i) * 3)), x + 60, y0 + 4);
    else if (s < 0.6) place(ctx, seaFanArt(), x + 60, y0 + 4);
    else if (s < 0.75) place(ctx, shellArt(), x + 60, y0 + 4);
  });
  // A school of fish crossing, turning at the ends.
  for (let k = 0; k < 2; k++) {
    const span = width + 200;
    const u = ((time * 0.04 + k * 0.5) % 1);
    const dir = Math.floor(time * 0.04 + k * 0.5) % 2 ? -1 : 1;
    const sx = dir > 0 ? u * span - 100 : span - u * span - 100;
    const sy = y0 - 120 - k * 50 + Math.sin(time * 0.8 + k) * 10;
    for (let f = 0; f < 6; f++) {
      const fx = sx + (f % 3) * 12 * -dir + Math.sin(time * 3 + f) * 2;
      const fy = sy + Math.floor(f / 3) * 8 + (f % 2) * 4;
      ctx.fillStyle = f % 2 ? '#ffd36b' : '#ff9ab8';
      ctx.beginPath();
      ctx.ellipse(fx, fy, 4, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fx - dir * 3, fy);
      ctx.lineTo(fx - dir * 7, fy - 2.4);
      ctx.lineTo(fx - dir * 7, fy + 2.4);
      ctx.fill();
    }
  }
}

function coralArt(kind) {
  return art(`reef-coral|${kind}`, 50, 60, () => {
    const c = ['#ff8fb0', '#ffb35a', '#c9a6ff'][kind];
    const cl = mix(c, '#ffffff', 0.4);
    const out = [E(25, 58, 18, 3, mix(c, '#3a2d4f', 0.3))];
    for (const [x, h, a] of [[25, 50, 0], [14, 36, -0.4], [36, 40, 0.35], [8, 22, -0.7], [42, 26, 0.6]]) {
      const tx = x + Math.sin(a) * h;
      const ty = 58 - Math.cos(a) * h;
      out.push(T([[x - 3, 58], [x + 3, 58], [tx + 2, ty], [tx - 2, ty]], c), F(E(tx, ty, 3.4, 3.4, c)), F(E(tx - 1, ty - 1, 1.2, 1.2, cl)));
    }
    return out;
  });
}
function seaFanArt() {
  return art('reef-fan', 46, 56, () => {
    const out = [R(21, 40, 4, 16, '#b05a8a')];
    for (let k = 0; k < 7; k++) {
      const a = -1.2 + k * 0.4;
      out.push(T([[23, 42], [23 + Math.sin(a) * 22, 42 - Math.cos(a) * 34], [23 + Math.sin(a + 0.25) * 20, 42 - Math.cos(a + 0.25) * 30]], k % 2 ? '#ff7aa8' : '#ff9ac0'));
    }
    return out;
  });
}
function shellArt() {
  return art('reef-shell', 50, 30, () => [
    E(25, 26, 22, 5, '#d8c4e6'), T([[4, 26], [46, 26], [40, 8], [25, 2], [10, 8]], '#ffe6f2'),
    F(T([[25, 26], [25, 4], [27, 4], [27, 26]], '#f0c4dc')), F(T([[14, 26], [13, 8], [15, 7], [17, 26]], '#f0c4dc')), F(T([[34, 26], [36, 7], [38, 8], [36, 26]], '#f0c4dc')),
    F(E(25, 22, 3, 3, '#ffffff')),
  ]);
}

// The Clockwork Carnival outside: the great Ferris wheel turning slowly far back with its lit cars,
// striped tents, a roller coaster's track looping against the sky, and strings of lights.
function drawFarCarnival(ctx, t, cam, width, y0, time) {
  backRidge(ctx, t, cam, width, y0 - 30, 30, true);
  ctx.fillStyle = t.far;
  ctx.fillRect(0, snap(y0 + 20), width, 400);
  repeat(cam.x, 0.12, 560, width, (i, x) => {
    // The wheel: a rim, spokes and cars that stay upright as it turns.
    const cx = x + 200;
    const cy = y0 - 110;
    const r = 90;
    const turn = time * 0.12 + i;
    ctx.strokeStyle = t.farLit;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 8; k++) {
      const a = turn + (k / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
      const lit = Math.sin(time * 2 + k + i) > 0;
      ctx.fillStyle = lit ? '#ffe2a0' : shade(t.far, -8);
      ctx.beginPath();
      ctx.roundRect(snap(cx + Math.cos(a) * r - 6), snap(cy + Math.sin(a) * r), 12, 10, 3);
      ctx.fill();
      if (lit) glow(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r + 5, 12, '#ffd27a', 0.35);
    }
    ctx.fillStyle = t.far;
    ctx.beginPath();
    ctx.moveTo(cx - 50, y0 + 30);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + 50, y0 + 30);
    ctx.lineTo(cx + 40, y0 + 30);
    ctx.lineTo(cx, cy + 14);
    ctx.lineTo(cx - 40, y0 + 30);
    ctx.fill();
    // The coaster track looping beside it.
    ctx.strokeStyle = t.farLit;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 330, y0 + 20);
    ctx.bezierCurveTo(x + 360, y0 - 160, x + 460, y0 - 160, x + 470, y0 - 60);
    ctx.bezierCurveTo(x + 480, y0 + 20, x + 520, y0 - 20, x + 560, y0 - 90);
    ctx.stroke();
  });
  // Striped tents, nearer.
  repeat(cam.x, 0.2, 260, width, (i, x) => {
    const tx = x + 60 + hash(i) * 80;
    const h = 70 + hash(i + 3) * 30;
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = k % 2 ? shade(t.far, 8) : mix(t.far, '#ff7aa8', 0.35);
      ctx.beginPath();
      ctx.moveTo(tx + 50, y0 - h);
      ctx.lineTo(tx + k * 17, y0 + 20);
      ctx.lineTo(tx + (k + 1) * 17, y0 + 20);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd36b';
    ctx.fillRect(snap(tx + 49), snap(y0 - h - 14), 2, 14);
    ctx.beginPath();
    ctx.moveTo(tx + 51, y0 - h - 14);
    ctx.lineTo(tx + 62 + Math.sin(time * 3 + i) * 2, y0 - h - 10);
    ctx.lineTo(tx + 51, y0 - h - 6);
    ctx.fill();
  });
}

// Inside the Big Top and the Funhouse: the tent's striped canvas swooping down from the king pole,
// a ring of footlights; in the Workshop, gears turning on the walls and belts and pipes.
function drawFarBigTop(ctx, t, cam, width, y0, time, workshop) {
  ctx.fillStyle = t.far;
  ctx.fillRect(0, 0, width, 600);
  if (workshop) {
    repeat(cam.x, 0.2, 150, width, (i, x) => {
      const cx = x + 70;
      const cy = y0 - 120 + hash(i) * 60;
      const r = 26 + hash(i + 2) * 20;
      const a = time * (i % 2 ? 0.4 : -0.4) * (40 / r);
      ctx.fillStyle = shade(t.far, 8);
      ctx.beginPath();
      for (let k = 0; k < 24; k++) {
        const u = a + (k / 24) * Math.PI * 2;
        const rr = k % 2 ? r : r * 0.82;
        ctx.lineTo(cx + Math.cos(u) * rr, cy + Math.sin(u) * rr);
      }
      ctx.fill();
      ctx.fillStyle = t.far;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = shade(t.far, -8);
    ctx.fillRect(0, snap(y0 - 24), width, 600);
    return;
  }
  repeat(cam.x, 0.2, 60, width, (i, x) => {
    ctx.fillStyle = i % 2 ? shade(t.far, 10) : mix(t.far, '#ffffff', 0.12);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 60, 0);
    ctx.quadraticCurveTo(x + 30, y0 * 0.4, x + 66, y0 + 20);
    ctx.lineTo(x + 6, y0 + 20);
    ctx.quadraticCurveTo(x - 30, y0 * 0.4, x, 0);
    ctx.fill();
  });
  // Footlights round the ring, twinkling in a chase.
  repeat(cam.x, 0.3, 30, width, (i, x) => {
    const on = (Math.floor(time * 6) + i) % 4 === 0;
    ctx.fillStyle = on ? '#ffffff' : '#ffd36b';
    ctx.beginPath();
    ctx.arc(x, y0 - 6, on ? 2.4 : 1.8, 0, Math.PI * 2);
    ctx.fill();
    if (on) glow(ctx, x, y0 - 6, 10, '#ffe2a0', 0.5);
  });
}

// The middle plane outside: lamp posts strung with lights, prize stalls, balloons tied to rails.
function drawMidCarnival(ctx, t, cam, width, y0, time) {
  const posts = [];
  repeat(cam.x, 0.45, 160, width, (i, x) => {
    posts.push(x + 80);
    const s = hash(i + 4);
    if (s < 0.5) place(ctx, stallArt(Math.floor(hash(i) * 3)), x + 80, y0 + 4);
    place(ctx, fairLampArt(), x + 10, y0 + 4);
  });
  // Strings of bulbs swagging between the posts, chasing.
  repeat(cam.x, 0.45, 160, width, (i, x) => {
    const a = x + 10;
    const b = x + 170;
    for (let k = 0; k <= 10; k++) {
      const u = k / 10;
      const px = a + (b - a) * u;
      const py = y0 - 70 + Math.sin(u * Math.PI) * 14;
      const on = (Math.floor(time * 5) + k + i) % 3 === 0;
      ctx.fillStyle = ['#ff7aa8', '#ffd36b', '#7fd8ff'][(k + i) % 3];
      ctx.globalAlpha = on ? 1 : 0.55;
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function stallArt(kind) {
  return art(`fair-stall|${kind}`, 70, 70, () => {
    const c = ['#ff7aa8', '#7fd8ff', '#ffd36b'][kind];
    const out = [R(6, 30, 58, 40, '#c99a6b'), F(R(6, 30, 58, 4, '#e6b090')), R(10, 36, 50, 18, '#3a2a4a')];
    for (let k = 0; k < 7; k++) out.push(T([[2 + k * 9.4, 30], [11 + k * 9.4, 30], [6.5 + k * 9.4, 22]], k % 2 ? '#ffffff' : c));
    out.push(R(2, 14, 66, 9, c), F(R(2, 14, 66, 3, mix(c, '#ffffff', 0.4))));
    for (let k = 0; k < 4; k++) out.push(E(16 + k * 12, 46, 3.4, 3.4, ['#ff7aa8', '#ffd36b', '#7fd8ff', '#9ae6a8'][k]));
    return out;
  });
}
function fairLampArt() {
  return art('fair-lamp', 16, 80, () => [R(6.6, 10, 2.8, 70, '#5a3a6a'), R(4, 74, 8, 6, '#5a3a6a'), E(8, 7, 5, 5, '#ffe2a0'), F(E(7, 6, 2, 2, '#ffffff')), R(4, 0, 8, 3, '#5a3a6a')]);
}

// The Star Observatory outside: the Milky Way in a soft band across the sky, a slow aurora, and the
// tower's domes and telescopes in silhouette on the ridge, their slits lit.
function drawFarStars(ctx, t, cam, width, y0, time) {
  ctx.save();
  // The Milky Way: a diagonal haze speckled with tiny stars.
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#e6dcff';
  ctx.beginPath();
  ctx.moveTo(-20, y0 - 60);
  ctx.lineTo(width + 20, y0 - 260);
  ctx.lineTo(width + 20, y0 - 200);
  ctx.lineTo(-20, y0);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  for (let k = 0; k < 60; k++) {
    const u = hash(k + 300);
    const x = ((u * width * 1.3 - cam.x * 0.03) % width + width) % width;
    const y = y0 - 30 - u * 200 + (hash(k + 301) - 0.5) * 50;
    ctx.fillStyle = k % 3 ? '#ffffff' : '#fff3a6';
    ctx.globalAlpha = 0.4 + 0.5 * Math.abs(Math.sin(time * (0.6 + hash(k) * 1.2) + k));
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  // A slow aurora curtain.
  for (let b = 0; b < 2; b++) {
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = b ? '#9ae6c8' : '#c9a6ff';
    ctx.beginPath();
    ctx.moveTo(-20, 40 + b * 30);
    for (let x = -20; x <= width + 20; x += 20) ctx.lineTo(x, 40 + b * 30 + Math.sin(x * 0.012 + time * 0.3 + b * 2 + cam.x * 0.0005) * 24);
    for (let x = width + 20; x >= -20; x -= 20) ctx.lineTo(x, 110 + b * 30 + Math.sin(x * 0.01 + time * 0.25 + b) * 20);
    ctx.fill();
  }
  ctx.restore();
  backRidge(ctx, t, cam, width, y0 - 20, 40);
  ctx.fillStyle = t.far;
  ctx.fillRect(0, snap(y0 + 20), width, 400);
  repeat(cam.x, 0.16, 420, width, (i, x) => {
    const bx = x + 80 + hash(i) * 100;
    const p = new Path2D();
    // A tower with a domed top and a telescope poking from its slit, and a smaller dome beside.
    p.rect(bx, y0 - 140, 50, 170);
    p.moveTo(bx - 6, y0 - 140);
    p.arc(bx + 25, y0 - 140, 31, Math.PI, 0);
    p.rect(bx + 80, y0 - 60, 70, 90);
    p.moveTo(bx + 76, y0 - 60);
    p.arc(bx + 115, y0 - 60, 39, Math.PI, 0);
    litFill(ctx, t, p, 2, 1.6);
    ctx.save();
    ctx.translate(bx + 25, y0 - 150);
    ctx.rotate(-0.6 + Math.sin(time * 0.1 + i) * 0.1);
    ctx.fillStyle = t.far;
    ctx.fillRect(0, -5, 44, 10);
    ctx.restore();
    ctx.fillStyle = '#fff3a6';
    ctx.fillRect(snap(bx + 22), snap(y0 - 162), 6, 18);
    glow(ctx, bx + 25, y0 - 152, 16, '#fff3a6', 0.3);
    for (let w = 0; w < 3; w++) {
      const on = Math.sin(time * 0.4 + w * 2 + i) > -0.3;
      ctx.fillStyle = on ? '#ffe9a0' : shade(t.far, -8);
      ctx.fillRect(snap(bx + 20), snap(y0 - 110 + w * 34), 10, 14);
    }
  });
}

// Inside the tower: tall arched windows full of stars, armillary spheres turning on stands. In the
// Archive, bookcases to the ceiling; in the Orrery, great brass rings turning slowly behind.
function drawFarStarHall(ctx, t, cam, width, y0, time, kind) {
  ctx.fillStyle = t.far;
  ctx.fillRect(0, 0, width, 600);
  if (kind === 'archive') {
    repeat(cam.x, 0.2, 110, width, (i, x) => {
      ctx.fillStyle = shade(t.far, 8);
      ctx.fillRect(snap(x), 0, 100, y0 + 30);
      for (let r = 0; r < 8; r++) {
        const sy = 20 + r * 34;
        ctx.fillStyle = shade(t.far, -8);
        ctx.fillRect(snap(x + 4), sy + 28, 92, 4);
        for (let b = 0; b < 12; b++) {
          const h = 18 + hash(i * 97 + r * 13 + b) * 9;
          ctx.fillStyle = pick(['#7a3a5a', '#3a5a8a', '#5a7a4a', '#8a6a3a', '#5a3a7a'], hash(i * 31 + r * 7 + b));
          ctx.fillRect(snap(x + 6 + b * 7.4), sy + 28 - h, 6, h);
        }
      }
    });
    return;
  }
  if (kind === 'orrery') {
    const cx = width / 2 - cam.x * 0.05;
    const cy = y0 - 140;
    glow(ctx, cx, cy, 70, '#fff3a6', 0.35);
    for (let k = 0; k < 4; k++) {
      ctx.strokeStyle = shade(t.midTrim, -10 - k * 6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 80 + k * 70, 22 + k * 18, -0.15, 0, Math.PI * 2);
      ctx.stroke();
      const a = time * (0.3 - k * 0.05) + k * 1.7;
      ctx.fillStyle = ['#ffb38a', '#9fd8ff', '#c9a6ff', '#9ae6a8'][k];
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * (80 + k * 70), cy + Math.sin(a) * (22 + k * 18), 6 + k * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff3a6';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  repeat(cam.x, 0.2, 180, width, (i, x) => {
    const wx = x + 50;
    const top = y0 - 200;
    ctx.fillStyle = mix(t.sky[0], '#000000', 0.2);
    ctx.beginPath();
    ctx.moveTo(wx, y0 - 30);
    ctx.lineTo(wx, top + 34);
    ctx.arc(wx + 34, top + 34, 34, Math.PI, 0);
    ctx.lineTo(wx + 68, y0 - 30);
    ctx.closePath();
    ctx.fill();
    for (let k = 0; k < 8; k++) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(time * 1.2 + k + i));
      ctx.fillRect(snap(wx + 6 + hash(i * 9 + k) * 56), snap(top + 10 + hash(i * 7 + k) * 140), 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = t.farLit;
    ctx.fillRect(snap(wx + 32), top, 4, y0 - 30 - top);
    // An armillary sphere on a stand between the windows, its rings turning.
    const sx = x + 150;
    const sy = y0 - 70;
    const brass = mix(t.midTrim, t.far, 0.25);
    const brassLit = mix(t.midTrim, '#ffffff', 0.35);
    const brassDark = mix(t.midTrim, t.far, 0.6);
    // The stand: a turned column on a three-footed base.
    ctx.fillStyle = brassDark;
    ctx.beginPath();
    ctx.moveTo(sx - 14, y0 - 12);
    ctx.lineTo(sx - 3, y0 - 22);
    ctx.lineTo(sx + 3, y0 - 22);
    ctx.lineTo(sx + 14, y0 - 12);
    ctx.lineTo(sx + 10, y0 - 10);
    ctx.lineTo(sx, y0 - 17);
    ctx.lineTo(sx - 10, y0 - 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = brass;
    ctx.fillRect(snap(sx - 2), sy + 18, 4, y0 - 22 - sy - 18);
    ctx.fillStyle = brassLit;
    ctx.fillRect(snap(sx - 2), sy + 18, 1.4, y0 - 22 - sy - 18);
    ctx.fillStyle = brass;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 32, 5, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // The horizon ring and its meridian, fixed; the inner rings turning round a small globe.
    ctx.fillStyle = mix('#9fd8ff', t.far, 0.35);
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mix('#ffffff', t.far, 0.3);
    ctx.beginPath();
    ctx.arc(sx - 2, sy - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    for (let r = 0; r < 3; r++) {
      const ry = 16 * Math.abs(Math.cos(time * 0.5 + r * 1.1 + i));
      ctx.strokeStyle = brassDark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 16, Math.max(1, ry), r * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = brassLit;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.strokeStyle = brass;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, sy, 20, Math.PI * 0.85, Math.PI * 2.15);
    ctx.stroke();
    ctx.strokeStyle = brassLit;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sx, sy, 20, Math.PI * 1.1, Math.PI * 1.5);
    ctx.stroke();
    ctx.fillStyle = brassLit;
    ctx.beginPath();
    ctx.arc(sx, sy - 22, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

// The Candy Volcano outside: the volcano's pink cone far back puffing sugar-steam, gumdrop hills,
// candy-cane trees and lollipop flowers swaying.
function drawFarCandy(ctx, t, cam, width, y0, time, crater) {
  if (crater) {
    drawFarCrater(ctx, t, cam, width, y0, time);
    return;
  }
  drawCandyCone(ctx, t, cam, width, y0, time);
  // Gumdrop hills in a row of candy colours.
  ctx.fillStyle = t.far;
  ctx.fillRect(0, snap(y0 + 24), width, 400);
  repeat(cam.x, 0.2, 140, width, (i, x) => {
    const c = pick(['#ff9ab8', '#ffd36b', '#9ae6a8', '#9fd8ff', '#c9a6ff'], hash(i));
    const h = 50 + hash(i + 3) * 40;
    ctx.fillStyle = mix(c, t.far, 0.45);
    ctx.beginPath();
    ctx.ellipse(x + 70, y0 + 30, 70, h, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = mix('#ffffff', t.far, 0.4);
    for (let k = 0; k < 5; k++) ctx.fillRect(snap(x + 40 + k * 14), snap(y0 + 30 - h * 0.7 + (k % 2) * 8), 2, 2);
  });
}

// The volcano's cone, with a slow plume of pink steam curling from its top.
function drawCandyCone(ctx, t, cam, width, y0, time) {
  // The cone, with a slow plume of pink steam curling from its top.
  const vx = width * 0.65 - cam.x * 0.06;
  const top = y0 - 170;
  // A mountain of pink sugar-rock: concave flanks sweeping out at the foot, the lit flank toward
  // the light, the far flank in shadow, sugar strata across it.
  const rock = mix('#e890b0', t.far, 0.4);
  const p = new Path2D();
  p.moveTo(vx - 280, y0 + 30);
  p.quadraticCurveTo(vx - 90, y0 - 10, vx - 52, top);
  p.lineTo(vx + 52, top);
  p.quadraticCurveTo(vx + 90, y0 - 10, vx + 280, y0 + 30);
  p.closePath();
  ctx.fillStyle = rock;
  ctx.fill(p);
  ctx.save();
  ctx.clip(p);
  ctx.fillStyle = shade(rock, -9);
  ctx.beginPath();
  ctx.moveTo(vx + 20, top);
  ctx.quadraticCurveTo(vx + 30, y0 - 60, vx + 80, y0 + 30);
  ctx.lineTo(vx + 300, y0 + 30);
  ctx.lineTo(vx + 60, top);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = mix(rock, '#ffffff', 0.22);
  ctx.beginPath();
  ctx.moveTo(vx - 52, top);
  ctx.quadraticCurveTo(vx - 90, y0 - 10, vx - 280, y0 + 30);
  ctx.lineTo(vx - 240, y0 + 30);
  ctx.quadraticCurveTo(vx - 70, y0 - 20, vx - 36, top);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(rock, -4);
  for (let s = 0; s < 4; s++) ctx.fillRect(vx - 300, top + 40 + s * 36, 600, 2);
  // Caramel seams glowing down the flank from the crater.
  for (const [dx, len] of [[-18, 120], [10, 80], [30, 150]]) {
    ctx.strokeStyle = '#ffb25a';
    ctx.globalAlpha = 0.5 + 0.2 * Math.sin(time * 1.5 + dx);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(vx + dx, top + 6);
    ctx.quadraticCurveTo(vx + dx * 1.8, top + len * 0.5, vx + dx * 3, top + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // The crater's lip, and white icing poured over the summit in long drips down the flanks.
  ctx.fillStyle = shade(rock, -16);
  ctx.beginPath();
  ctx.ellipse(vx, top, 52, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = mix('#fff8f2', t.far, 0.15);
  ctx.beginPath();
  ctx.moveTo(vx - 56, top + 2);
  const drips = [[-46, 26], [-34, 12], [-22, 40], [-8, 18], [6, 30], [18, 14], [30, 46], [44, 20]];
  for (const [dx, dl] of drips) {
    ctx.lineTo(vx + dx - 5, top + 6);
    ctx.quadraticCurveTo(vx + dx - 5, top + dl, vx + dx, top + dl + 3);
    ctx.quadraticCurveTo(vx + dx + 5, top + dl, vx + dx + 5, top + 6);
  }
  ctx.lineTo(vx + 56, top + 2);
  ctx.quadraticCurveTo(vx, top - 8, vx - 56, top + 2);
  ctx.fill();
  ctx.fillStyle = '#ffb3cf';
  ctx.globalAlpha = 0.8;
  for (let k = 0; k < 10; k++) ctx.fillRect(snap(vx - 44 + k * 9), snap(top + 2 + (k % 3) * 2), 3, 1.5);
  ctx.globalAlpha = 1;
  for (let k = 0; k < 5; k++) {
    const u = (time * 0.08 + k * 0.2) % 1;
    ctx.globalAlpha = 0.4 * (1 - u);
    ctx.fillStyle = '#ffe0ec';
    ctx.beginPath();
    ctx.arc(vx + Math.sin(u * 4 + k) * 20 + u * 40, y0 - 180 - u * 120, 14 + u * 30, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------- The Candy Volcano's last two rooms ----------

const GINGER = '#c8844e';
const GINGER_L = '#e2a66c';
const GINGER_D = '#9a5a34';
const ICING = '#fff8f2';
// A wavy line of piped icing from (x0, y) to (x1, y), its waves keyed to the world (`wx`).
function pipe(ctx, x0, x1, y, w = 2, amp = 1.4, c = ICING, wx = 0) {
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 3) ctx.lineTo(x, y + Math.sin((x + wx) * 0.7) * amp);
  ctx.stroke();
}
// A gingerbread tower: a round drum with icing bands and lit windows, a candy-striped cone roof and
// a pennant that streams in the wind. `k` fades it toward the far colour.
function gingerTower(ctx, t, cx, base, w, h, time, i, k) {
  const c = (col) => mix(col, t.far, k);
  ctx.fillStyle = c(GINGER_D);
  ctx.fillRect(cx - w / 2, base - h, w, h);
  ctx.fillStyle = c(GINGER);
  ctx.fillRect(cx - w / 2 + 2, base - h, w - 6, h);
  ctx.fillStyle = c(GINGER_L);
  ctx.fillRect(cx - w / 2 + 3, base - h, 3, h);
  for (let x = -w / 2; x < w / 2 - 1; x += 7) {
    ctx.fillStyle = c(GINGER);
    ctx.fillRect(cx + x, base - h - 6, 5, 6);
  }
  // The roof: pink and white candy stripes.
  const rt = base - h - 6;
  const rh = h * 0.55;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 4, rt);
  ctx.lineTo(cx, rt - rh);
  ctx.lineTo(cx + w / 2 + 4, rt);
  ctx.closePath();
  ctx.fillStyle = c('#ffffff');
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = c('#ff7aa8');
  for (let s = -3; s < 8; s++) {
    ctx.beginPath();
    ctx.moveTo(cx - w, rt - s * 10);
    ctx.lineTo(cx + w, rt - s * 10 - 14);
    ctx.lineTo(cx + w, rt - s * 10 - 9);
    ctx.lineTo(cx - w, rt - s * 10 + 5);
    ctx.fill();
  }
  ctx.restore();
  // Icing bands, and a window or two lit from inside (each on its own beat).
  for (const f of [0.18, 0.62]) pipe(ctx, cx - w / 2, cx + w / 2 - 2, base - h * (1 - f), 2, 1.2, c(ICING), i * 31);
  for (const f of [0.38, 0.8]) {
    const on = Math.sin(time * 0.5 + i * 1.9 + f * 7) > -0.3;
    ctx.fillStyle = on ? '#ffe6a0' : c(GINGER_D);
    ctx.beginPath();
    ctx.roundRect(cx - 3, base - h * (1 - f) - 5, 6, 9, [3, 3, 0, 0]);
    ctx.fill();
    if (on && k < 0.4) glow(ctx, cx, base - h * (1 - f), 12, '#ffd27a', 0.3);
  }
  // The pennant on its pole.
  const top = rt - rh;
  ctx.fillStyle = c('#ffffff');
  ctx.fillRect(cx - 0.5, top - 12, 1.5, 12);
  const fl = Math.sin(time * 3 + i) * 2;
  ctx.fillStyle = c(Math.abs(i) % 2 ? '#9ae66a' : '#ff7aa8');
  ctx.beginPath();
  ctx.moveTo(cx + 1, top - 12);
  ctx.quadraticCurveTo(cx + 7, top - 11 + fl, cx + 13, top - 9 + fl * 1.4);
  ctx.quadraticCurveTo(cx + 7, top - 7 + fl, cx + 1, top - 6);
  ctx.fill();
}

// The Gingerbread Ramparts, far back: the cone rising behind, and the castle's outer wall running
// away along the ridge, its towers flying pennants.
function drawFarRamparts(ctx, t, cam, width, y0, time) {
  drawCandyCone(ctx, t, cam, width, y0, time);
  ctx.fillStyle = t.far;
  ctx.fillRect(0, snap(y0 + 24), width, 400);
  const wy = y0 - 6;
  ctx.fillStyle = mix(GINGER, t.far, 0.55);
  ctx.fillRect(0, snap(wy), width, 60);
  repeat(cam.x, 0.2, 14, width, (i, x) => ctx.fillRect(snap(x), snap(wy - 6), 9, 7));
  pipe(ctx, 0, width, wy + 3, 1.6, 1, mix(ICING, t.far, 0.4), cam.x * 0.2);
  repeat(cam.x, 0.2, 230, width, (i, x) => gingerTower(ctx, t, x + 60 + hash(i) * 90, wy + 30, 26 + hash(i + 2) * 8, 70 + hash(i + 3) * 40, time, i, 0.5));
}

// Right behind the wall-walk: the parapet's merlons in iced gingerbread with gumdrops on some, a
// tower now and then with its pennant, and candy-cane lamps between, their flames flickering.
function drawMidRamparts(ctx, t, cam, width, y0, time) {
  repeat(cam.x, 0.45, 420, width, (i, x) => gingerTower(ctx, t, x + 140 + hash(i + 7) * 120, y0 + 4, 40, 120 + hash(i + 1) * 30, time, i + 20, 0.18));
  const top = y0 - 30;
  ctx.fillStyle = GINGER_D;
  ctx.fillRect(0, snap(top + 8), width, 40);
  ctx.fillStyle = GINGER;
  ctx.fillRect(0, snap(top + 10), width, 40);
  repeat(cam.x, 0.45, 34, width, (i, x) => {
    ctx.fillStyle = GINGER_D;
    ctx.fillRect(snap(x), snap(top - 4), 22, 14);
    ctx.fillStyle = GINGER;
    ctx.fillRect(snap(x + 1), snap(top - 3), 19, 13);
    ctx.fillStyle = GINGER_L;
    ctx.fillRect(snap(x + 2), snap(top - 3), 4, 12);
    ctx.strokeStyle = ICING;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(x + 3, top - 1, 15, 9, 3);
    ctx.stroke();
    ctx.fillStyle = GINGER_D;
    ctx.fillRect(snap(x + 28), snap(top + 14), 1.5, 12);
    ctx.fillRect(snap(x + 11), snap(top + 30), 1.5, 12);
    if (hash(i + 3) > 0.7) {
      ctx.fillStyle = pick(['#ff7aa8', '#9ae66a', '#ffd36b', '#7fd8ff'], hash(i + 5));
      ctx.beginPath();
      ctx.ellipse(x + 10.5, top - 4, 5, 4.4, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(snap(x + 8), snap(top - 7), 2, 1.5);
    }
  });
  pipe(ctx, 0, width, top + 12, 2.2, 1.4, ICING, cam.x * 0.45);
  repeat(cam.x, 0.45, 260, width, (i, x) => {
    const lx = x + 70;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(snap(lx - 1.5), snap(top - 40), 3, 40);
    ctx.fillStyle = '#e0304e';
    for (let y = top - 38; y < top; y += 7) ctx.fillRect(snap(lx - 1.5), snap(y), 3, 3);
    ctx.fillStyle = '#ffe6a0';
    ctx.beginPath();
    ctx.ellipse(lx, top - 44, 3.4, 4.4 + Math.sin(time * 9 + i) * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    glow(ctx, lx, top - 44, 22, '#ffd27a', 0.35 + 0.08 * Math.sin(time * 6 + i));
  });
}

// The caramel's surface: a band from y down, its waves running on world time and place.
function caramelLake(ctx, width, y, depth, time, wx, amp, c, lit) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(0, y + depth);
  for (let x = 0; x <= width + 8; x += 8) ctx.lineTo(x, y + Math.sin(time * 1.2 + (x + wx) * 0.03) * amp + Math.sin(time * 0.7 + (x + wx) * 0.011) * amp);
  ctx.lineTo(width + 8, y + depth);
  ctx.fill();
  ctx.strokeStyle = lit;
  ctx.lineWidth = 1.4;
  for (let r = 0; r < 3; r++) {
    const yy = y + 8 + r * 12;
    const off = (((wx * (1 + r * 0.2)) % 60) + 60) % 60;
    ctx.beginPath();
    for (let x = -off; x <= width; x += 60) {
      const wv = Math.sin(time + (x + wx) * 0.02 + r) * 1.2;
      ctx.moveTo(x + r * 20, yy + wv);
      ctx.quadraticCurveTo(x + r * 20 + 12, yy - 2 + wv, x + r * 20 + 26, yy + wv);
    }
    ctx.stroke();
  }
}
// An islet of rock candy: a toffee crust with a cluster of crystal spires on it, bobbing.
function candyIsle(ctx, t, x, y, s, time, i, k) {
  const c = (col) => mix(col, t.far, k);
  const bob = Math.sin(time * 0.8 + i * 1.7) * 1.5;
  ctx.fillStyle = c('#7a3a2a');
  ctx.beginPath();
  ctx.ellipse(x, y + bob, 30 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  const cols = ['#ff9ad8', '#ffd36b', '#9fd8ff', '#ffb0c8'];
  for (let n = 0; n < 4; n++) {
    const px = x + (n - 1.5) * 12 * s + hash(i + n) * 4;
    const h = (18 + hash(i + n + 3) * 26) * s * (n === 1 || n === 2 ? 1.3 : 0.8);
    const w = 6 * s;
    const col = cols[(((i + n) % 4) + 4) % 4];
    ctx.fillStyle = c(col);
    ctx.beginPath();
    ctx.moveTo(px - w, y + bob);
    ctx.lineTo(px - w * 0.8, y + bob - h * 0.75);
    ctx.lineTo(px, y + bob - h);
    ctx.lineTo(px + w * 0.8, y + bob - h * 0.75);
    ctx.lineTo(px + w, y + bob);
    ctx.fill();
    ctx.fillStyle = c(mix(col, '#ffffff', 0.55));
    ctx.beginPath();
    ctx.moveTo(px - w * 0.8, y + bob - h * 0.75);
    ctx.lineTo(px, y + bob - h);
    ctx.lineTo(px, y + bob - 2);
    ctx.lineTo(px - w * 0.7, y + bob - 2);
    ctx.fill();
  }
}
// The Crater, far back: its walls of dark rock closing in on both sides, veined with glowing
// caramel, the sky glowing over the rim, and the caramel lake below with rock-candy islands
// bobbing in it and bubbles rising and popping.
function drawFarCrater(ctx, t, cam, width, y0, time) {
  glow(ctx, width / 2, y0 - 120, width * 0.55, '#ffb06a', 0.3 + 0.05 * Math.sin(time * 2));
  const rock = { ...t, far: shade(t.far, -14), farLit: shade(t.far, 8) };
  for (const side of [-1, 1]) {
    const sx = side < 0 ? -2 : width + 2;
    const shift = cam.x * 0.08;
    const p = new Path2D();
    p.moveTo(sx, y0 + 60);
    for (let k = 0; k <= 12; k++) {
      const f = k / 12;
      p.lineTo(sx - side * (width * 0.34 * Math.pow(1 - f, 0.8) + 30 + Math.sin(k * 2.1 + side * shift * 0.01) * 14), y0 + 40 - f * 260);
    }
    p.lineTo(sx, y0 - 230);
    p.closePath();
    litFill(ctx, rock, p, -side * 2, 1.5);
    // Seams of glowing caramel running down it, pulsing on their own beat.
    ctx.strokeStyle = '#ffb04a';
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 3; k++) {
      const x0 = sx - side * (40 + k * 60);
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 1.5 + k + side);
      ctx.beginPath();
      ctx.moveTo(x0, y0 - 150 + k * 30);
      ctx.lineTo(x0 - side * 10, y0 - 100 + k * 30);
      ctx.lineTo(x0 + side * 4, y0 - 60 + k * 30);
      ctx.lineTo(x0 - side * 8, y0 + 10);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  caramelLake(ctx, width, y0 - 46, 400, time, cam.x * 0.18, 1.2, '#c8742e', '#ffc06a');
  repeat(cam.x, 0.2, 240, width, (i, x) => candyIsle(ctx, t, x + 80 + hash(i) * 80, y0 - 40, 0.7 + hash(i + 1) * 0.3, time, i, 0.35));
  for (let k = 0; k < 7; k++) {
    const u = (time * 0.35 + hash(k + 4)) % 1;
    const bx = ((hash(k + 1) * width * 1.3 - cam.x * 0.2) % width + width) % width;
    ctx.globalAlpha = u < 0.85 ? 0.8 : ((1 - u) / 0.15) * 0.8;
    ctx.strokeStyle = '#ffd08a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(bx, y0 - 30 - u * 14, 2 + u * 4, Math.PI, 0);
    ctx.stroke();
  }
  for (let k = 0; k < 20; k++) {
    const u = (time * 0.15 + hash(k)) % 1;
    ctx.fillStyle = k % 2 ? '#ffd36b' : '#ff8a5a';
    ctx.globalAlpha = Math.sin(u * Math.PI);
    ctx.fillRect(((hash(k + 9) * width - cam.x * 0.1) % width + width) % width, y0 + 20 - u * 260, 2, 2);
  }
  ctx.globalAlpha = 1;
}
// Closer in: the caramel lake right behind the floor, bigger rock-candy isles drifting in it, and
// steam curling off the hot surface.
function drawMidCrater(ctx, t, cam, width, y0, time) {
  caramelLake(ctx, width, y0 - 26, 60, time, cam.x * 0.45, 1.8, '#e0903a', '#ffd08a');
  repeat(cam.x, 0.45, 300, width, (i, x) => {
    if (hash(i + 2) < 0.75) candyIsle(ctx, t, x + 90 + hash(i) * 120, y0 - 22, 1.1 + hash(i + 4) * 0.4, time, i + 30, 0);
  });
  for (let k = 0; k < 6; k++) {
    const u = (time * 0.12 + hash(k + 20)) % 1;
    const sx = ((hash(k + 21) * width * 1.4 - cam.x * 0.45) % width + width) % width;
    ctx.globalAlpha = 0.25 * Math.sin(u * Math.PI);
    ctx.fillStyle = '#fff0e0';
    ctx.beginPath();
    ctx.arc(sx + Math.sin(u * 5 + k) * 8, y0 - 22 - u * 70, 6 + u * 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Inside the mine and the kitchen: licorice beams and rock-candy crystals glowing; in the forge, the
// furnace's glow and racks of hammers.
function drawFarCandyCave(ctx, t, cam, width, y0, time, forge) {
  ctx.fillStyle = t.far;
  ctx.fillRect(0, 0, width, 600);
  if (forge) {
    repeat(cam.x, 0.2, 260, width, (i, x) => {
      const fx = x + 130;
      ctx.fillStyle = shade(t.far, 10);
      ctx.beginPath();
      ctx.roundRect(fx - 50, y0 - 140, 100, 170, [40, 40, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#ff8a3a';
      ctx.beginPath();
      ctx.roundRect(fx - 26, y0 - 70, 52, 50, [20, 20, 0, 0]);
      ctx.fill();
      glow(ctx, fx, y0 - 44, 70, '#ffb06a', 0.4 + 0.1 * Math.sin(time * 4 + i));
    });
    return;
  }
  repeat(cam.x, 0.2, 180, width, (i, x) => {
    // A licorice beam, twisted, holding up the roof.
    ctx.fillStyle = '#2a1a22';
    ctx.fillRect(snap(x + 20), 0, 14, y0 + 30);
    ctx.fillStyle = '#4a2a3a';
    for (let y = 0; y < y0 + 30; y += 16) ctx.fillRect(snap(x + 20), y, 14, 6);
    // Rock-candy crystals clustered at its foot, glowing.
    for (let k = 0; k < 3; k++) {
      const c = pick(['#ff9ad8', '#9fd8ff', '#ffd36b'], hash(i + k));
      const cx = x + 60 + k * 18;
      const h = 30 + hash(i * 3 + k) * 30;
      ctx.fillStyle = mix(c, t.far, 0.3);
      ctx.beginPath();
      ctx.moveTo(cx - 7, y0 + 30);
      ctx.lineTo(cx, y0 + 30 - h);
      ctx.lineTo(cx + 7, y0 + 30);
      ctx.fill();
      glow(ctx, cx, y0 + 20 - h * 0.5, 20, c, 0.25 + 0.1 * Math.sin(time * 2 + i + k));
    }
  });
}

// The Dream Theatre. Outside (Theatre Row): the playhouse floating on its cloud far back, its dome
// and marquee bulbs chasing. Inside, each room is a stage set: the lobby's tiers of red boxes and
// chandeliers; painted flats for the acts (a painted sea with cut-out clouds on strings, a forest of
// cardboard trees under a paper moon); the ballroom's mirrors; backstage's rigging and sandbags; and
// the great stage's tall velvet curtains. Everything sways from its own place in the world.
function drawFarTheatre(ctx, t, cam, width, y0, time, kind) {
  if (kind !== 'theatre') {
    ctx.fillStyle = t.far;
    ctx.fillRect(0, 0, width, 600);
  }
  if (kind === 'theatre') {
    // The playhouse on its cloud, far back, bobbing slowly.
    const hx = width * 0.68 - cam.x * 0.05;
    const hy = y0 - 90 + Math.sin(time * 0.4) * 3;
    const far = (c, k = 0.35) => mix(c, t.far, k);
    // Its cloud, in soft puffs with a lit top.
    for (const [dx, dy, r] of [[-78, 8, 24], [-46, 0, 32], [0, -4, 38], [46, 0, 32], [78, 8, 24], [-20, 14, 28], [26, 14, 28]]) {
      ctx.fillStyle = far('#e8d8f0', 0.25);
      ctx.beginPath();
      ctx.arc(hx + dx, hy + 46 + dy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = far('#ffffff', 0.15);
      ctx.beginPath();
      ctx.arc(hx + dx - r * 0.2, hy + 42 + dy - r * 0.2, r * 0.7, Math.PI, Math.PI * 1.9);
      ctx.fill();
    }
    // The hall: a drum of red under a gold dome, white columns, a pediment over the doors.
    ctx.fillStyle = far('#9a2040');
    ctx.fillRect(hx - 56, hy - 14, 112, 56);
    ctx.fillStyle = far('#ffd36b', 0.3);
    ctx.beginPath();
    ctx.ellipse(hx, hy - 30, 40, 34, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = far('#c99a3b', 0.3);
    ctx.fillRect(hx - 44, hy - 32, 88, 6);
    for (const dx of [-24, -8, 8, 24]) ctx.fillRect(hx + dx - 1, hy - 62 + Math.abs(dx) * 0.3, 2, 30 - Math.abs(dx) * 0.3);
    ctx.fillStyle = far('#ffffff', 0.3);
    for (const dx of [-48, -30, 30, 48]) ctx.fillRect(hx + dx - 3, hy - 4, 6, 46);
    ctx.fillStyle = far('#fff0e0', 0.3);
    ctx.beginPath();
    ctx.moveTo(hx - 60, hy - 4);
    ctx.lineTo(hx, hy - 26);
    ctx.lineTo(hx + 60, hy - 4);
    ctx.fill();
    // The doors glowing warm, the show on.
    glow(ctx, hx, hy + 26, 26, '#ffd38a', 0.5 + 0.08 * Math.sin(time * 1.3));
    ctx.fillStyle = far('#ffe8a0', 0.15);
    ctx.beginPath();
    ctx.roundRect(hx - 12, hy + 12, 24, 30, [12, 12, 0, 0]);
    ctx.fill();
    // A gold star on the dome's top, slowly turning, and a pennant streaming.
    ctx.save();
    ctx.translate(hx, hy - 70);
    ctx.rotate(time * 0.4);
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
      const r = k % 2 ? 2.4 : 6;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.fill();
    ctx.restore();
    glow(ctx, hx, hy - 70, 16, '#ffe08a', 0.4);
    // Marquee bulbs chasing round the pediment.
    for (let k = 0; k < 15; k++) {
      const u = k / 14;
      const on = (Math.floor(time * 6) + k) % 3 === 0;
      const bx = hx - 58 + u * 116;
      const by = hy - 4 - (1 - Math.abs(u - 0.5) * 2) * 22;
      ctx.fillStyle = on ? '#fff6c8' : far('#c99a3b', 0.2);
      ctx.fillRect(snap(bx - 1), snap(by - 1), 2, 2);
      if (on) glow(ctx, bx, by, 5, '#ffe08a', 0.5);
    }
    return;
  }
  if (kind === 'stagehall' || kind === 'ballroom') {
    // Tiers of red boxes with gold rails, little lamps lit in each; chandeliers swaying above.
    for (let tier = 0; tier < 3; tier++) {
      const ty = y0 - 150 + tier * 60;
      repeat(cam.x, 0.18 + tier * 0.02, 90, width, (i, x) => {
        ctx.fillStyle = mix('#9a2040', t.far, 0.35 + tier * 0.1);
        ctx.beginPath();
        ctx.roundRect(x + 8, ty, 74, 44, [20, 20, 0, 0]);
        ctx.fill();
        ctx.fillStyle = mix('#ffd36b', t.far, 0.3);
        ctx.fillRect(x + 6, ty + 40, 78, 4);
        glow(ctx, x + 45, ty + 20, 14, '#ffe08a', 0.25 + 0.08 * Math.sin(time * 1.5 + i + tier));
      });
    }
    repeat(cam.x, 0.25, 320, width, (i, x) => {
      const cx = x + 160 + Math.sin(time * 0.7 + i) * 3;
      ctx.strokeStyle = '#c99a3b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 160, 0);
      ctx.lineTo(cx, 40);
      ctx.stroke();
      glow(ctx, cx, 54, 40, '#fff0c0', 0.35);
      ctx.fillStyle = '#ffd36b';
      ctx.beginPath();
      ctx.ellipse(cx, 50, 24, 8, 0, 0, Math.PI);
      ctx.fill();
      for (let k = -2; k <= 2; k++) {
        ctx.fillStyle = '#fff6d8';
        ctx.fillRect(snap(cx + k * 10 - 1), 40, 2, 6);
        ctx.fillStyle = '#e8f8ff';
        ctx.fillRect(snap(cx + k * 10 - 1), 56 + Math.abs(k) * 2, 2, 5);
      }
    });
    if (kind === 'ballroom') {
      // Tall mirrors between gold pilasters, a glint passing over them.
      repeat(cam.x, 0.3, 200, width, (i, x) => {
        ctx.fillStyle = mix('#c8d8ff', t.far, 0.5);
        ctx.beginPath();
        ctx.roundRect(x + 60, y0 - 110, 80, 140, [40, 40, 0, 0]);
        ctx.fill();
        const u = ((time * 0.2 + i * 0.3) % 1.5) - 0.25;
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x + 60 + Math.max(0, Math.min(74, u * 80)), y0 - 100, 6, 120);
        ctx.fillStyle = mix('#ffd36b', t.far, 0.3);
        ctx.fillRect(x + 54, y0 - 116, 6, 150);
        ctx.fillRect(x + 140, y0 - 116, 6, 150);
      });
    }
    return;
  }
  if (kind === 'pirate') {
    // A painted backdrop: a sunset sea, a painted sun, cut-out clouds swinging on strings.
    ctx.fillStyle = '#ffb08a';
    ctx.fillRect(0, 0, width, y0 - 20);
    ctx.fillStyle = '#ffe0a0';
    ctx.beginPath();
    ctx.arc(width * 0.5 - cam.x * 0.04, y0 - 40, 50, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = mix('#4a8ad8', t.far, 0.2);
    ctx.fillRect(0, y0 - 40, width, 400);
    ctx.fillStyle = mix('#8ac8ff', t.far, 0.2);
    repeat(cam.x, 0.15, 40, width, (i, x) => ctx.fillRect(snap(x), snap(y0 - 30 + (((i % 3) + 3) % 3) * 14), 22, 2));
    repeat(cam.x, 0.2, 220, width, (i, x) => {
      const sw = Math.sin(time * 0.9 + i) * 6;
      const cx = x + 110 + sw;
      const cy = 70 + hash(i) * 50;
      ctx.strokeStyle = '#5a4a5a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 110, 0);
      ctx.lineTo(cx, cy - 20);
      ctx.stroke();
      ctx.fillStyle = '#fff6ee';
      ctx.strokeStyle = '#c8a8b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx - 22, cy, 16, Math.PI, 0);
      ctx.arc(cx, cy - 8, 20, Math.PI, 0);
      ctx.arc(cx + 22, cy, 16, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    return;
  }
  if (kind === 'fairy') {
    // A paper moon on a string and cardboard trees on wooden stands, glittering.
    const mx = width * 0.3 - cam.x * 0.04 + Math.sin(time * 0.5) * 4;
    ctx.strokeStyle = '#8a7a9a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx, 0);
    ctx.lineTo(mx, 50);
    ctx.stroke();
    glow(ctx, mx, 80, 60, '#fff6c8', 0.4);
    // A cut-out crescent: the full disc with a smaller one taken out of it.
    ctx.fillStyle = '#fff6c8';
    ctx.beginPath();
    ctx.arc(mx, 80, 30, 0, Math.PI * 2);
    ctx.arc(mx + 14, 72, 26, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    for (let layer = 0; layer < 2; layer++) {
      repeat(cam.x, 0.15 + layer * 0.12, 110 + layer * 30, width, (i, x) => {
        const cx = x + 55;
        const h = 120 + hash(i + layer * 7) * 60;
        const c = mix(pick(['#5ab88a', '#8ad8a8', '#4a9a8a'], hash(i + 3)), t.far, 0.55 - layer * 0.2);
        ctx.fillStyle = mix('#8a5a3a', t.far, 0.4);
        ctx.fillRect(cx - 4, y0 + 30 - h * 0.4, 8, h * 0.4);
        ctx.fillStyle = c;
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
          const ty = y0 + 30 - h * 0.35 - k * h * 0.2;
          ctx.moveTo(cx - 40 + k * 8, ty);
          ctx.lineTo(cx, ty - h * 0.3);
          ctx.lineTo(cx + 40 - k * 8, ty);
        }
        ctx.fill();
        ctx.fillStyle = '#fff6c8';
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 3 + i * 1.7 + layer);
        ctx.fillRect(snap(cx - 10 + hash(i + 1) * 20), snap(y0 - h * 0.5), 2, 2);
        ctx.globalAlpha = 1;
      });
    }
    return;
  }
  if (kind === 'backstage') {
    // Rigging: ropes down from the fly gallery, sandbags swinging, flats stacked against the wall.
    repeat(cam.x, 0.2, 140, width, (i, x) => {
      const cx = x + 70;
      const sw = Math.sin(time * 0.8 + i * 1.3) * 5;
      const bag = y0 - 70 - hash(i) * 60;
      ctx.fillStyle = mix(pick(['#8ad8a8', '#ffb08a', '#9fc8ff'], hash(i + 5)), t.far, 0.5);
      ctx.fillRect(x + 10 + hash(i + 2) * 30, y0 - 60, 50, 90);
      ctx.strokeStyle = mix('#c8a878', t.far, 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx + sw, bag - 10);
      ctx.stroke();
      ctx.fillStyle = mix('#a8885a', t.far, 0.3);
      ctx.beginPath();
      ctx.ellipse(cx + sw, bag, 9, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    return;
  }
  // The great stage: tall velvet curtains drawn back in swags, a star cloth twinkling behind.
  for (let k = 0; k < 30; k++) {
    ctx.fillStyle = '#fff6c8';
    ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(time * 1.5 + k * 2.3));
    ctx.fillRect(snap((((hash(k) * width * 2 - cam.x * 0.1) % width) + width) % width), snap(hash(k + 40) * (y0 - 40)), 2, 2);
  }
  ctx.globalAlpha = 1;
  repeat(cam.x, 0.22, 300, width, (i, x) => {
    for (const side of [0, 1]) {
      const cx = x + (side ? 230 : 70);
      const sw = Math.sin(time * 0.6 + i + side) * 4;
      ctx.fillStyle = mix('#9a2040', t.far, 0.25);
      ctx.beginPath();
      ctx.moveTo(cx - 50, 0);
      ctx.lineTo(cx + 50, 0);
      ctx.quadraticCurveTo(cx + 10 + sw, y0 - 80, cx + (side ? 40 : -40), y0 + 30);
      ctx.lineTo(cx + (side ? -10 : 10), y0 + 30);
      ctx.quadraticCurveTo(cx - 20 + sw, y0 - 60, cx - 50, 0);
      ctx.fill();
      ctx.fillStyle = mix('#ffd36b', t.far, 0.2);
      ctx.fillRect(snap(cx - 6 + sw * 0.5), snap(y0 - 90), 12, 5);
    }
  });
}

// The middle plane on Theatre Row: lamp posts and poster pillars announcing tonight's play.
function drawMidTheatre(ctx, t, cam, width, y0, time) {
  repeat(cam.x, 0.45, 160, width, (i, x) => {
    if (hash(i + 4) < 0.5) place(ctx, posterPillarArt(Math.floor(hash(i) * 3)), x + 80, y0 + 4);
    else {
      place(ctx, theatreLampArt(), x + 80, y0 + 4);
      glow(ctx, x + 80, y0 - 66, 22, '#ffe08a', 0.45 + 0.08 * Math.sin(time * 2 + i));
    }
  });
}
function posterPillarArt(kind) {
  return art(`theatre-pillar|${kind}`, 36, 86, () => {
    const c = ['#ff7aa8', '#b89aff', '#8ff0c8'][kind];
    return [
      R(6, 14, 24, 72, '#6a3a5a'), F(R(6, 14, 5, 72, '#8a5a7a')), T([[3, 14], [18, 2], [33, 14]], '#9a2040'), F(E(18, 3, 2, 2, '#ffd36b')),
      R(9, 24, 18, 26, '#fff6e0'), F(E(18, 34, 6, 6, c)), F(R(11, 44, 14, 2, '#9a2040')), R(9, 54, 18, 20, c), F(R(11, 58, 14, 2, '#ffffff')),
    ];
  });
}
function theatreLampArt() {
  return art('theatre-lamp', 20, 86, () => [
    R(9, 18, 3, 68, '#3a2e3e'), R(5, 82, 11, 4, '#3a2e3e'), T([[4, 10], [16, 10], [14, 22], [6, 22]], '#ffe08a'), F(R(7, 12, 6, 8, '#fff6d0')), T([[3, 10], [10, 4], [17, 10]], '#3a2e3e'),
  ]);
}

// The Sky Whale. From the pier: the whale itself swimming far off over a sea of cloud, a little
// town on its back, its fins beating slowly. On its back: the cloud sea rolling far below, and
// behind each room what's there: the tail's great flukes rising and swaying, the market's tents and
// pennant strings, the pirate ship's hull and sails, the barnacle fortress's shell towers, the
// brow's open dusk with the spout misting up. Inside the lungs: deep blue walls, light falling in
// shafts. Everything moves from its own place in the world.
function cloudSea(ctx, t, cam, width, y, time) {
  ctx.fillStyle = mix('#ffffff', t.far, 0.35);
  ctx.fillRect(0, snap(y + 14), width, 400);
  repeat(cam.x, 0.12, 90, width, (i, x) => {
    const r = 40 + hash(i) * 30;
    ctx.fillStyle = mix('#ffffff', t.far, 0.25);
    ctx.beginPath();
    ctx.arc(x + 45, y + 22 + Math.sin(time * 0.3 + i) * 3, r, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = mix('#ffffff', t.far, 0.05);
    ctx.beginPath();
    ctx.arc(x + 38, y + 18 + Math.sin(time * 0.3 + i) * 3, r * 0.5, Math.PI * 1.1, Math.PI * 1.7);
    ctx.fill();
  });
}
function whaleShape(ctx, x, y, s, time, body, belly) {
  // A whale swimming left to right: a long round body, a pale grooved belly, a fin beating, the
  // tail's flukes lifting and falling.
  const flap = Math.sin(time * 0.8);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x + 90 * s, y);
  ctx.quadraticCurveTo(x + 80 * s, y - 34 * s, x + 10 * s, y - 32 * s);
  ctx.quadraticCurveTo(x - 60 * s, y - 28 * s, x - 100 * s, y - 6 * s + flap * 4 * s);
  ctx.lineTo(x - 100 * s, y + 4 * s + flap * 4 * s);
  ctx.quadraticCurveTo(x - 40 * s, y + 22 * s, x + 30 * s, y + 20 * s);
  ctx.quadraticCurveTo(x + 86 * s, y + 18 * s, x + 90 * s, y);
  ctx.fill();
  // Modelling: light along the back from above, the flank turning into shadow underneath, and a
  // few pale scars and barnacle spots on the hide.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = mix(body, '#ffffff', 0.22);
  ctx.beginPath();
  ctx.moveTo(x + 84 * s, y - 10 * s);
  ctx.quadraticCurveTo(x + 76 * s, y - 34 * s, x + 10 * s, y - 32 * s);
  ctx.quadraticCurveTo(x - 60 * s, y - 28 * s, x - 100 * s, y - 6 * s);
  ctx.quadraticCurveTo(x - 50 * s, y - 20 * s, x + 10 * s, y - 22 * s);
  ctx.quadraticCurveTo(x + 64 * s, y - 24 * s, x + 84 * s, y - 10 * s);
  ctx.fill();
  ctx.fillStyle = shade(body, -8);
  ctx.beginPath();
  ctx.ellipse(x - 10 * s, y + 18 * s, 90 * s, 12 * s, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = mix(body, '#ffffff', 0.4);
  for (const [dx, dy, r] of [[-30, -18, 2], [-38, -15, 1.4], [20, -24, 1.6], [46, -20, 1.2], [-62, -10, 1.4]]) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.moveTo(x + 86 * s, y + 6 * s);
  ctx.quadraticCurveTo(x + 40 * s, y + 22 * s, x - 30 * s, y + 14 * s);
  ctx.quadraticCurveTo(x + 30 * s, y + 12 * s, x + 86 * s, y + 6 * s);
  ctx.fill();
  ctx.strokeStyle = mix(belly, body, 0.4);
  ctx.lineWidth = Math.max(1, s);
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.moveTo(x + (70 - k * 14) * s, y + (9 + k) * s);
    ctx.lineTo(x + (40 - k * 14) * s, y + (14 + k) * s);
    ctx.stroke();
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x - 96 * s, y + flap * 4 * s);
  ctx.lineTo(x - 130 * s, y - 22 * s + flap * 10 * s);
  ctx.lineTo(x - 116 * s, y + flap * 6 * s);
  ctx.lineTo(x - 130 * s, y + 22 * s + flap * 10 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 30 * s, y + 18 * s, 22 * s, 6 * s, 0.5 + Math.sin(time * 0.8 + 1) * 0.3, 0, Math.PI * 2);
  ctx.fill();
  // The fin's lit leading edge, and a gentle eye: a dark pupil with a catch-light, under a lid line.
  ctx.fillStyle = mix(body, '#ffffff', 0.25);
  ctx.beginPath();
  ctx.ellipse(x + 26 * s, y + 15 * s, 16 * s, 2.4 * s, 0.5 + Math.sin(time * 0.8 + 1) * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(body, -30);
  ctx.beginPath();
  ctx.arc(x + 62 * s, y - 3 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + 61 * s, y - 4 * s, 1.1 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = shade(body, -16);
  ctx.lineWidth = Math.max(1, s * 0.8);
  ctx.beginPath();
  ctx.arc(x + 62 * s, y - 3 * s, 5 * s, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
}
function drawFarWhale(ctx, t, cam, width, y0, time, kind) {
  if (kind === 'lungs') {
    ctx.fillStyle = t.far;
    ctx.fillRect(0, 0, width, 600);
    // Light falling in soft shafts from the blowhole far above, swaying.
    for (let k = 0; k < 5; k++) {
      const x = ((k * 190 - cam.x * 0.1) % (width + 200) + width + 200) % (width + 200) - 100;
      const sw = Math.sin(time * 0.4 + k) * 20;
      ctx.fillStyle = '#eaf6ff';
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.moveTo(x - 20, 0);
      ctx.lineTo(x + 20, 0);
      ctx.lineTo(x + 60 + sw, y0 + 40);
      ctx.lineTo(x - 10 + sw, y0 + 40);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Glowing hanging plants along the walls, breathing light.
    repeat(cam.x, 0.25, 110, width, (i, x) => {
      const len = 40 + hash(i) * 60;
      const sw = Math.sin(time * 0.7 + i) * 4;
      ctx.strokeStyle = mix('#5ab88a', t.far, 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 50, 0);
      ctx.quadraticCurveTo(x + 50 + sw, len / 2, x + 50 + sw * 1.5, len);
      ctx.stroke();
      glow(ctx, x + 50 + sw * 1.5, len + 4, 10, '#9fe8ff', 0.4 + 0.2 * Math.sin(time * 1.5 + i));
    });
    return;
  }
  if (kind === 'whale') {
    cloudSea(ctx, t, cam, width, y0 + 10, time);
    // The whale swimming far off, a little town on its back, sails catching the light.
    const wx = width * 0.55 - cam.x * 0.04 + Math.sin(time * 0.1) * 20;
    const wy = y0 - 90 + Math.sin(time * 0.35) * 6;
    whaleShape(ctx, wx, wy, 1.3, time, mix('#4a6ab0', t.far, 0.3), mix('#eaf6ff', t.far, 0.2));
    for (let k = 0; k < 6; k++) {
      const hx = wx - 70 + k * 22;
      const hy = wy - 38 - Math.sin((k / 5) * Math.PI) * 6;
      ctx.fillStyle = mix(pick(['#ff9ab8', '#ffd36b', '#ffffff'], hash(k)), t.far, 0.35);
      ctx.fillRect(snap(hx), snap(hy), 10, 8);
      ctx.fillStyle = mix('#c8304e', t.far, 0.3);
      ctx.beginPath();
      ctx.moveTo(hx - 2, hy);
      ctx.lineTo(hx + 5, hy - 6);
      ctx.lineTo(hx + 12, hy);
      ctx.fill();
    }
    ctx.fillStyle = mix('#ffffff', t.far, 0.2);
    ctx.beginPath();
    ctx.moveTo(wx - 4, wy - 46);
    ctx.lineTo(wx - 4, wy - 76);
    ctx.quadraticCurveTo(wx + 14 + Math.sin(time) * 3, wy - 62, wx - 4, wy - 46);
    ctx.fill();
    // Its spout misting up now and then.
    const sp = (time * 0.25) % 1;
    if (sp < 0.3) for (let k = 0; k < 6; k++) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.6 * (1 - sp / 0.3);
      ctx.beginPath();
      ctx.arc(wx + 58 + (k - 2.5) * 5 * (sp / 0.3) * 3, wy - 34 - (sp / 0.3) * 40 + Math.abs(k - 2.5) * 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    return;
  }
  // On the whale's back: the cloud sea far below.
  cloudSea(ctx, t, cam, width, y0 + 30, time);
  if (drawFarWhaleRoom(ctx, t, cam, width, y0, time, kind)) return;
  if (kind === 'tail') {
    // The tail's great flukes rising far behind, sweeping slowly up and down.
    const tx = width * 0.7 - cam.x * 0.08;
    const a = Math.sin(time * 0.35) * 0.12;
    ctx.save();
    ctx.translate(tx, y0 + 30);
    ctx.rotate(a);
    ctx.fillStyle = mix('#4a6ab0', t.far, 0.35);
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.quadraticCurveTo(-20, -90, 0, -130);
    ctx.quadraticCurveTo(-90, -170, -150, -150);
    ctx.quadraticCurveTo(-60, -200, 10, -170);
    ctx.quadraticCurveTo(80, -200, 160, -150);
    ctx.quadraticCurveTo(90, -170, 20, -130);
    ctx.quadraticCurveTo(30, -90, 40, 0);
    ctx.fill();
    ctx.restore();
  } else if (kind === 'market') {
    // Striped tents in a row with strings of pennants between them, flapping.
    repeat(cam.x, 0.22, 170, width, (i, x) => {
      const c = pick(['#ff9ab8', '#ffd36b', '#9fd0ff', '#9ae6a8'], hash(i));
      const h = 60 + hash(i + 2) * 30;
      ctx.fillStyle = mix(c, t.far, 0.4);
      ctx.beginPath();
      ctx.moveTo(x + 30, y0 + 30);
      ctx.lineTo(x + 85, y0 + 30 - h);
      ctx.lineTo(x + 140, y0 + 30);
      ctx.fill();
      ctx.fillStyle = mix('#ffffff', t.far, 0.4);
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(x + 85, y0 + 30 - h);
        ctx.lineTo(x + 46 + k * 30, y0 + 30);
        ctx.lineTo(x + 58 + k * 30, y0 + 30);
        ctx.fill();
      }
      for (let k = 0; k < 6; k++) {
        const px = x + 85 + k * 14;
        const py = y0 + 30 - h + 6 + Math.sin((k / 5) * Math.PI) * 18;
        ctx.fillStyle = mix(pick(['#ff7aa8', '#ffd36b', '#7fd8ff'], hash(i * 7 + k)), t.far, 0.3);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + 8, py);
        ctx.lineTo(px + 4 + Math.sin(time * 4 + k + i) * 2, py + 9);
        ctx.fill();
      }
    });
  } else if (kind === 'deck') {
    // The pirate airship moored behind: its hull, a mast, sails bellied in the wind, the jolly flag.
    const sx = width * 0.5 - cam.x * 0.1;
    const sy = y0 - 10 + Math.sin(time * 0.6) * 4;
    ctx.fillStyle = mix('#8a5a3a', t.far, 0.35);
    ctx.beginPath();
    ctx.moveTo(sx - 220, sy - 20);
    ctx.lineTo(sx + 220, sy - 20);
    ctx.quadraticCurveTo(sx + 200, sy + 40, sx, sy + 46);
    ctx.quadraticCurveTo(sx - 200, sy + 40, sx - 220, sy - 20);
    ctx.fill();
    for (const [dx, hgt] of [[-100, 170], [60, 200]]) {
      ctx.fillStyle = mix('#5a3a2a', t.far, 0.35);
      ctx.fillRect(sx + dx - 3, sy - 20 - hgt, 6, hgt);
      const belly = 12 + Math.sin(time * 1.2 + dx) * 4;
      ctx.fillStyle = mix('#fff6ee', t.far, 0.3);
      for (let k = 0; k < 2; k++) {
        const top = sy - 20 - hgt + 14 + k * 70;
        ctx.beginPath();
        ctx.moveTo(sx + dx - 50, top);
        ctx.quadraticCurveTo(sx + dx - 50 + belly, top + 30, sx + dx - 50, top + 56);
        ctx.lineTo(sx + dx + 50, top + 56);
        ctx.quadraticCurveTo(sx + dx + 50 + belly, top + 30, sx + dx + 50, top);
        ctx.fill();
      }
      ctx.fillStyle = mix('#2a2a3a', t.far, 0.3);
      ctx.beginPath();
      ctx.moveTo(sx + dx + 3, sy - 20 - hgt);
      ctx.lineTo(sx + dx + 30 + Math.sin(time * 3 + dx) * 4, sy - 12 - hgt);
      ctx.lineTo(sx + dx + 3, sy - 4 - hgt);
      ctx.fill();
    }
  } else if (kind === 'fortress') {
    // Towers of shell and coral grown up out of the whale's back, barnacles studding them.
    repeat(cam.x, 0.2, 200, width, (i, x) => {
      const h = 90 + hash(i) * 70;
      ctx.fillStyle = mix('#ffd8e2', t.far, 0.45);
      ctx.beginPath();
      ctx.moveTo(x + 60, y0 + 30);
      ctx.lineTo(x + 80, y0 + 30 - h);
      ctx.quadraticCurveTo(x + 100, y0 + 10 - h - 30, x + 120, y0 + 30 - h);
      ctx.lineTo(x + 140, y0 + 30);
      ctx.fill();
      ctx.fillStyle = mix('#ece4d4', t.far, 0.3);
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        ctx.arc(x + 76 + hash(i + k) * 48, y0 + 20 - hash(i * 3 + k) * h * 0.8, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      const cx = x + 30;
      const sw = Math.sin(time * 0.6 + i) * 3;
      ctx.strokeStyle = mix('#ff7a8a', t.far, 0.4);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, y0 + 30);
      ctx.quadraticCurveTo(cx + sw, y0 - 10, cx - 10 + sw, y0 - 40);
      ctx.moveTo(cx + sw * 0.6, y0 - 4);
      ctx.quadraticCurveTo(cx + 14 + sw, y0 - 20, cx + 18 + sw, y0 - 36);
      ctx.stroke();
    });
  } else if (kind === 'brow') {
    // The open sky at dusk: the first stars, and the whale's spout misting up ahead.
    for (let k = 0; k < 24; k++) {
      ctx.fillStyle = '#fff6c8';
      ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(time + k * 2.1));
      ctx.fillRect(snap(((hash(k) * width * 2 - cam.x * 0.05) % width + width) % width), snap(hash(k + 30) * (y0 - 60)), 2, 2);
    }
    ctx.globalAlpha = 1;
    const sx = width * 0.8 - cam.x * 0.08;
    for (let k = 0; k < 10; k++) {
      const u = (time * 0.15 + k / 10) % 1;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.4 * Math.sin(u * Math.PI);
      ctx.beginPath();
      ctx.arc(sx + Math.sin(u * 5 + k) * 20 * u, y0 + 20 - u * 180, 8 + u * 20, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// The middle plane outside: candy-cane trees and lollipop flowers, swaying from their own place.
function drawMidCandy(ctx, t, cam, width, y0, time) {
  repeat(cam.x, 0.45, 120, width, (i, x) => {
    const s = hash(i + 4);
    const wx = x + cam.x * 0.45;
    if (s < 0.4) place(ctx, caneTreeArt(Math.floor(hash(i) * 2)), x + 60, y0 + 4);
    else if (s < 0.75) {
      const sw = Math.sin(time * 1.2 + wx * 0.01) * 0.08;
      ctx.save();
      ctx.translate(x + 60, y0 + 4);
      ctx.rotate(sw);
      place(ctx, lolliFlowerArt(Math.floor(hash(i + 2) * 3)), 0, 0);
      ctx.restore();
    }
  });
}
function caneTreeArt(kind) {
  return art(`candy-cane|${kind}`, 40, 90, () => {
    const out = [R(18, 20, 6, 70, '#ffffff')];
    for (let y = 22; y < 88; y += 8) out.push(F(T([[18, y], [24, y - 3], [24, y + 1], [18, y + 4]], '#e0304e')));
    out.push(T([[18, 22], [12, 10], [16, 4], [26, 4], [30, 12], [24, 22]], kind ? '#9ae66a' : '#ff9ab8'), F(E(18, 10, 4, 3, '#ffffff')));
    return out;
  });
}
function lolliFlowerArt(kind) {
  return art(`candy-lolli|${kind}`, 24, 60, () => {
    const c = ['#ff7aa8', '#ffd36b', '#7fd8ff'][kind];
    return [R(11, 22, 2, 38, '#ffffff'), E(12, 14, 10, 10, c), F(E(12, 14, 6, 6, '#ffffff')), F(E(12, 14, 3, 3, c)), F(E(9, 10, 2, 2, '#ffffff'))];
  });
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
    // The column and its foot roots as one flat shape with a lit rim on the upper-left side.
    const col = new Path2D();
    const add = (pts) => {
      pts.forEach(([px, py], k) => (k ? col.lineTo(px, py) : col.moveTo(px, py)));
      col.closePath();
    };
    add(bandPts(main, flare));
    for (const s of [-1, 1]) {
      const [fx, fy] = main[main.length - 3];
      add(bandPts([[fx, fy], [fx + s * 18, fy + 14], [fx + s * 34, fy + 30]], (u) => 6 - u * 5));
    }
    litFill(ctx, t, col, 1.6, 0);
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
  // Rooms furnished in rooms.js (the Funhouse, the Toy Workshop, the Candy Kitchen...).
  if (drawMidRoom(ctx, t, cam, width, y0, time, t.skyline)) {
    ctx.restore();
    return;
  }
  switch (t.skyline) {
    case 'houses':
      // A painted town already has its far hillside town; its middle row is only a few trees, so
      // the street reads in front of a calm backdrop (the exterior rule: three depths, no
      // half-hidden row of houses behind the street).
      if (t.painted === 'town') {
        repeat(cam.x, 0.45, 150, width, (i, x) => {
          if (hash(i + 5) < 0.45) place(ctx, treeArt(hash(i), hash(i + 1) > 0.5, undefined, leanFrame(time, x + cam.x, 5, 0.1, i)), x + 60 + hash(i + 8) * 30, y0 + 4);
        });
        break;
      }
      repeat(cam.x, 0.45, 120, width, (i, x) => {
        const s = hash(i + 5);
        if (s < 0.22) return place(ctx, treeArt(hash(i), hash(i + 1) > 0.5, undefined, leanFrame(time, x + cam.x, 5, 0.1, i)), x + 48, y0 + 4);
        place(ctx, houseArt(hash(i)), x + 48, y0 + 4);
        smoke(ctx, x + 48 + 17, y0 + 4 - (hash(hash(i) * 5 + 2) > 0.5 ? 92 : 74) + 4, time, i);
        // (The village redraw: a washing line to the next house now and then.)
        if (t.painted === 'town' && hash(i + 6) >= 0.22 && hash(i + 77) > 0.45) washingLine(ctx, x + 80, y0 - 30, x + 136, y0 - 32, time, i, windAt);
      });
      break;
    case 'hills':
      repeat(cam.x, 0.45, 130, width, (i, x) => {
        const s = hash(i + 5);
        if (s < 0.18) place(ctx, windmillArt(Math.floor(windTravel(time) * 4 + time + i) % 8), x + 65, y0 + 6);
        else if (s < 0.75) place(ctx, treeArt(hash(i), hash(i + 1) > 0.7, undefined, leanFrame(time, x + cam.x, 5, 0.1, i)), x + 65, y0 + 4);
      });
      break;
    // Lantern Lagoon's sea (render/lagoon.js): low islands with palms, and sailboats at anchor.
    case 'lagoon':
      repeat(cam.x, 0.45, 260, width, (i, x) => {
        const s = hash(i + 11);
        const cx = x + 130;
        if (s < 0.55) {
          const w = 50 + hash(i + 3) * 60;
          ctx.fillStyle = mix(t.far, '#7fc8a0', 0.45);
          ctx.beginPath();
          ctx.ellipse(snap(cx), snap(y0 + 4), w, 12 + hash(i) * 6, 0, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = mix(t.far, '#fff0c8', 0.5);
          ctx.fillRect(snap(cx - w), snap(y0 + 1), w * 2, 3);
          for (let k = 0; k < 1 + Math.floor(hash(i + 7) * 3); k++) {
            const px = cx - w * 0.5 + k * w * 0.45;
            const lean = 3 + k * 2 + Math.sin(time * 0.8 + i + k) * 1.2;
            ctx.strokeStyle = mix(t.far, '#8a6a52', 0.5);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, y0 - 6);
            ctx.quadraticCurveTo(px + lean * 0.5, y0 - 20, px + lean, y0 - 32);
            ctx.stroke();
            ctx.fillStyle = mix(t.far, '#4fa878', 0.55);
            for (let f = 0; f < 5; f++) {
              const a = -Math.PI / 2 + (f - 2) * 0.7 + Math.sin(time + f + i) * 0.05;
              ctx.beginPath();
              ctx.ellipse(px + lean + Math.cos(a) * 7, y0 - 32 + Math.sin(a) * 3 + 3, 8, 2.2, a, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (s < 0.85) place(ctx, boatArt(pick(['#ff9ec0', '#9fb8ff', '#ffe36b', '#9fe8d0'], hash(i + 2))), cx, y0 - 8 + Math.sin(time * 1.6 + i) * 2);
      });
      break;
    case 'opensea':
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
        else place(ctx, treeArt(hash(i), false, undefined, leanFrame(time, x + cam.x, 5, 0.1, i)), x + 42, y0 + 4);
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
        } else place(ctx, bannerArt(pick(['#ff6b6b', '#ff9a5c', '#ffd66b'], hash(i)), leanFrame(time, x + cam.x * 0.45, 5, 0.2, i), Math.floor(time * 3 + windTravel(time) * 3 + i) % 3), x + 55, y0 + 4);
      });
      break;
    case 'mochigarden':
      // Nearer: blossom trees and a few round green ones, in loose groups with open meadow between.
      repeat(cam.x, 0.45, 96, width, (i, x) => {
        const s = hash(i + 5);
        if (s < 0.38) return;
        const dx = hash(i + 11) * 40;
        const sway = leanFrame(time, x + cam.x, 5, 0.1, i);
        if (s < 0.74) place(ctx, treeArt(hash(i), true, undefined, sway), x + dx, y0 + 4);
        else place(ctx, treeArt(hash(i), false, ['#a8e2b8', '#bfe8a0', '#9fdcc8'], sway), x + dx, y0 + 4);
      });
      break;
    case 'bigtrees':
      repeat(cam.x, 0.45, 160, width, (i, x) => {
        const s = hash(i + 5);
        if (s < 0.45) place(ctx, treehouseArt(hash(i)), x + 60, y0 + 4);
        else if (s < 0.7) place(ctx, towerArt(), x + 60, y0 + 4);
        else place(ctx, treeArt(hash(i), false, ['#9fb8ff', '#b9a7ff', '#8fd3d6'], leanFrame(time, x + cam.x, 5, 0.1, i)), x + 60, y0 + 4);
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
    case 'manor':
    case 'manorhall':
      drawMidManor(ctx, t, cam, width, y0, time, t.skyline === 'manorhall');
      break;
    case 'reef':
      drawMidReef(ctx, t, cam, width, y0, time);
      break;
    case 'carnival':
      drawMidCarnival(ctx, t, cam, width, y0, time);
      break;
    case 'midway':
      drawMidMidway(ctx, t, cam, width, y0, time);
      break;
    case 'coaster':
      drawMidCoaster(ctx, t, cam, width, y0, time);
      break;
    case 'ferris':
      drawMidFerris(ctx, t, cam, width, y0, time);
      break;
    case 'manorball':
      drawMidManorBall(ctx, t, cam, width, y0, time);
      break;
    case 'library':
      drawMidLibrary(ctx, t, cam, width, y0, time);
      break;
    case 'hallway':
      drawMidHallway(ctx, t, cam, width, y0, time);
      break;
    case 'candy':
      drawMidCandy(ctx, t, cam, width, y0, time);
      break;
    case 'ramparts':
      drawMidRamparts(ctx, t, cam, width, y0, time);
      break;
    case 'crater':
      drawMidCrater(ctx, t, cam, width, y0, time);
      break;
    case 'theatre':
      drawMidTheatre(ctx, t, cam, width, y0, time);
      break;
    // The shrine path behind: cherry trees in bloom, little torii, a pagoda, stone lanterns aglow.
    case 'pagodas':
      repeat(cam.x, 0.45, 130, width, (i, x) => {
        const s = hash(i + 5);
        if (s < 0.16) place(ctx, pagodaArt(hash(i)), x + 65, y0 + 4);
        else if (s < 0.36) place(ctx, smallToriiArt(), x + 65, y0 + 4);
        else if (s < 0.85) place(ctx, treeArt(hash(i), true, undefined, leanFrame(time, x + cam.x, 5, 0.1, i)), x + 65, y0 + 4);
        if (hash(i + 13) > 0.6) {
          glow(ctx, x + 20, y0 - 16, 12, '#ffd27a', 0.35 * flicker(time, i));
          place(ctx, stoneLampArt(true), x + 20, y0 + 4);
        }
      });
      break;
    case 'peaks':
      repeat(cam.x, 0.45, 70, width, (i, x) => {
        if (hash(i + 5) < 0.3) return;
        place(ctx, pineArt(hash(i), Boolean(t.snowcaps), leanFrame(time, x + cam.x, 5, 0.1, i)), x + 35, y0 + 4 + Math.round(hash(i + 2) * 6));
      });
      break;
    // The gorge floor: bamboo groves, with steam curling up from the hot pools between them.
    case 'cliffs':
      repeat(cam.x, 0.45, 110, width, (i, x) => {
        const s = hash(i + 5);
        if (s < 0.6) place(ctx, bambooArt(hash(i), leanFrame(time, x + cam.x, 5, 0.15, i)), x + 40, y0 + 4);
        else {
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = '#9fe6e0';
          ctx.beginPath();
          ctx.ellipse(x + 60, y0 + 2, 34, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.92;
          for (let k = 0; k < 3; k++) {
            const u = (time * 0.25 + k / 3 + hash(i)) % 1;
            ctx.globalAlpha = 0.35 * Math.sin(Math.PI * u);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x + 50 + k * 10 + Math.sin(u * 5 + k) * 5, y0 - u * 60, 6 + u * 10, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 0.92;
        }
      });
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
  windmill: { w: 60, art: (seed, time) => windmillArt(Math.floor(windTravel(time) * 4 + time + seed * 8) % 8) },
};
// A landmark or house standing under a ledge must not run up into it: it reads as poking
// through. Where one would, it's set back a plane instead (`behind`): drawn before the ground,
// washed toward the sky like the backdrop, so the ledge reads as passing in front of it.
// Waterfalls pour off a ledge, and cloud pillars and the watchtower hold one up, on purpose.
const MEETS_LEDGE = new Set(['waterfall', 'cloudpillar', 'watchtower']);
const decoSize = (kind, seed) => {
  const b = BUILDINGS[kind];
  if (b) {
    const s = b.art(seed, 0);
    return [s.w, s.h];
  }
  const l = LANDMARKS[kind];
  return l ? [l.w, l.h] : [0, 0];
};
// Whether something w wide and h tall, standing with its base at (x, foot), runs into a ledge
// above it (the one it stands on doesn't count). Exported for the town's street houses.
export function hitsLedge(map, x, w, foot, h) {
  return map.platforms.some((p) => foot > p.y + 15 && x + w * 0.47 > p.x - 2 && x - w * 0.47 < p.x + p.w + 2 && foot - h < p.y + (p.thick ?? 26) + 4);
}
const setBackCache = new WeakMap();
function setBack(map) {
  let set = setBackCache.get(map);
  if (!set) {
    set = new Set((map.deco ?? []).filter(([kind, wx, seed = 0, wy]) => {
      if (MEETS_LEDGE.has(kind)) return false;
      const [w, h] = decoSize(kind, seed);
      return hitsLedge(map, wx, w, wy ?? groundAt(map, wx), h);
    }));
    setBackCache.set(map, set);
  }
  return set;
}

// A set-back piece's hazed picture, kept and only redrawn 30 times a second (or when its haze or
// the screen's scale changes), placed where the camera puts it every frame: hazing a big landmark
// afresh each frame was a fifth of a busy map's frame on a fast screen.
const HAZE_EVERY = 1 / 30;
const hazeKept = new WeakMap();
function hazedKept(ctx, entry, time, left, top, w, h, color, k, draw) {
  const t = ctx.getTransform();
  const sx = Math.hypot(t.a, t.b);
  const sy = Math.hypot(t.c, t.d);
  const cw = Math.ceil(w * sx);
  const ch = Math.ceil(h * sy);
  if (cw <= 0 || ch <= 0) return;
  const key = `${color}|${k}|${sx}|${sy}|${cw}|${ch}`;
  let kept = hazeKept.get(entry);
  if (!kept || kept.key !== key || Math.abs(time - kept.at) >= HAZE_EVERY) {
    const c = kept?.key === key ? kept.canvas : document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const g = c.getContext('2d');
    g.setTransform(sx, 0, 0, sy, 0, 0);
    g.imageSmoothingEnabled = false;
    draw(g);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = k;
    g.fillStyle = color;
    g.fillRect(0, 0, cw, ch);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    kept = { canvas: c, key, at: time };
    hazeKept.set(entry, kept);
  }
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(kept.canvas, 0, 0, cw, ch, Math.round(left * sx) / sx, Math.round(top * sy) / sy, cw / sx, ch / sy);
  ctx.restore();
}

// `pass`: 'behind' (set-back pieces, before the ground), 'ground' (the rest standing on the
// ground), or 'ledges' (the rest standing on ledges, after the ledges).
function drawDeco(ctx, map, cam, width, time, pass, air = '#ffffff') {
  const back = setBack(map);
  for (const entry of map.deco ?? []) {
    const [kind, wx, seed = 0, wy] = entry;
    if (back.has(entry) ? pass !== 'behind' : pass !== (wy != null ? 'ledges' : 'ground')) continue;
    const b = BUILDINGS[kind];
    const half = (b?.w ?? LANDMARKS[kind]?.w ?? 120) / 2 + 160;
    const x = wx - cam.x;
    if (x + half < 0 || x - half > width) continue;
    const y = snap((wy ?? groundAt(map, wx)) - cam.y);
    const draw = (g) => {
      if (b) place(g, b.art(seed, time), snap(x), y + 2);
      else drawLandmark(g, kind, snap(x), y, time, seed, wx, map.theme);
    };
    if (pass !== 'behind') draw(ctx);
    else {
      const [w, h] = decoSize(kind, seed);
      hazedKept(ctx, entry, time, x - w / 2 - 60, y - h - 50, w + 120, h + 120, air, 0.3, (g) => {
        // (Drawn where it sits in its own picture, so the picture can be placed anywhere after.)
        g.translate(-(x - w / 2 - 60), -(y - h - 50));
        draw(g);
      });
    }
  }
}


function drawLedges(ctx, t, theme, map, cam, width, height, time) {
  for (const [pi, p] of map.platforms.entries()) {
    const x = p.x + (p.drift ? driftOffset(p, map.clock ?? 0) : 0) - cam.x;
    const y = p.y - cam.y;
    if (x + p.w < -20 || x > width + 20 || y > height + 30 || y < -40) continue;
    // A ledge that's part of something already drawn (a tree's bough) shows nothing of its own.
    if (p.bare) continue;
    if (theme === 'hollow') rootLedge(ctx, t, x, y, p.w, pi, time);
    // A drifting ledge glides on the same clock as the physics. It's drawn at its own spot with the
    // camera shifted the other way, so its texture and edge flowers ride along with it instead of
    // sliding over it.
    else drawIsland(ctx, theme, p, p.drift ? { ...cam, x: cam.x - driftOffset(p, map.clock ?? 0) } : cam, time, pi, zoneLook(map, p.y, p.x + p.w / 2), map);
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
    const x = r.x - cam.x;
    const top = r.top - cam.y;
    const bottom = r.bottom - cam.y;
    rect(ctx, x - 3, top, 6, bottom - top, '#8f6d4c');
    rect(ctx, x - 2, top, 4, bottom - top, '#d9b88f');
    rect(ctx, x - 1, top, 1, bottom - top, '#f0d6a8');
    for (let y = top + 6; y < bottom; y += 9) rect(ctx, x - 2, y, 4, 1.4, '#b08860');
    rect(ctx, x - 5, top - 3, 10, 5, '#b08860');
  }
}

// A homestone (the shortcut home): a mossy standing stone with a house rune that glows and fades
// in a slow breath, a soft halo, and motes drifting up from it.
function drawHomestone(ctx, x, y, time, seed) {
  const breath = 0.5 + 0.5 * Math.sin(time * 1.6 + seed * 0.01);
  ctx.save();
  // The halo, swelling with the breath.
  const g = ctx.createRadialGradient(x, y - 16, 2, x, y - 16, 26 + breath * 6);
  g.addColorStop(0, `rgba(190,240,220,${0.32 + breath * 0.2})`);
  g.addColorStop(1, 'rgba(190,240,220,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 34, y - 50, 68, 52);
  // The stone: rounded on top, a lighter face on the left, moss at the foot.
  ctx.fillStyle = '#8a86a8';
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x - 11, y - 20);
  ctx.quadraticCurveTo(x - 10, y - 33, x, y - 34);
  ctx.quadraticCurveTo(x + 10, y - 33, x + 11, y - 20);
  ctx.lineTo(x + 10, y);
  ctx.fill();
  ctx.fillStyle = '#a9a6c6';
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 2);
  ctx.lineTo(x - 9, y - 20);
  ctx.quadraticCurveTo(x - 8, y - 30, x - 1, y - 31);
  ctx.lineTo(x - 2, y - 2);
  ctx.fill();
  ctx.fillStyle = '#7fc88f';
  ctx.beginPath();
  ctx.ellipse(x - 4, y - 1, 9, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 6, y - 1, 6, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // The house rune: a roof and a door, glowing with the breath.
  ctx.strokeStyle = `rgba(214,255,240,${0.55 + breath * 0.45})`;
  ctx.shadowColor = '#bff0dc';
  ctx.shadowBlur = 4 + breath * 5;
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 17);
  ctx.lineTo(x, y - 23);
  ctx.lineTo(x + 5, y - 17);
  ctx.moveTo(x - 3.5, y - 18);
  ctx.lineTo(x - 3.5, y - 11);
  ctx.lineTo(x + 3.5, y - 11);
  ctx.lineTo(x + 3.5, y - 18);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Motes rising and fading, each on its own smooth loop.
  for (let i = 0; i < 4; i++) {
    const t = (time * 0.35 + i / 4 + seed * 0.001) % 1;
    ctx.fillStyle = `rgba(220,255,240,${Math.sin(t * Math.PI) * 0.85})`;
    ctx.beginPath();
    ctx.arc(x + Math.sin(t * 6 + i * 2) * 7, y - 8 - t * 40, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Each portal's sign: where it goes, that place's level range (or that it's a town), and an
// arrow pointing the way out. The portal on your guided route glows pink with a star.
function drawPortals(ctx, map, cam, time, nearId, routeId = null) {
  for (const p of map.portals) {
    if (p.hidden) continue;
    const x = p.x - cam.x;
    const y = p.y - cam.y;
    // A gateway in the region's own style, its swirl turning inside (a homestone is a small rune
    // stone instead, with its sign lower down).
    // (A `door` is a building's own door: no gateway, only its name over it.)
    if (p.homestone) drawHomestone(ctx, x, y, time, p.x);
    else if (!p.door) drawPortalGate(ctx, map, x, y, time, p.x, p.style);
    const top = p.homestone ? 62 : p.door ? 78 : 94;
    const dest = MAPS[p.to];
    const name = p.label ?? dest?.name;
    if (name) {
      const onRoute = p.id === routeId;
      const lv = dest && !dest.dungeon && !p.door && !dest.home ? (dest.isTown ? 'Town' : levelRange(dest)?.replace('Lv ', 'Lv')) : null;
      const out = p.x < 200 ? -1 : p.x > map.width - 200 ? 1 : 0;
      ctx.font = '800 7px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
      // (Its own alignment: whatever was drawn before may have left it centred.)
      ctx.textAlign = 'left';
      const nw = ctx.measureText(name).width;
      ctx.font = '500 6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
      const lw = lv ? ctx.measureText(lv).width + 5 : 0;
      const w = nw + lw + 10 + (out ? 7 : 0) + (onRoute ? 8 : 0);
      const bx = Math.round(x - w / 2);
      const by = Math.round(y - top - (onRoute ? Math.abs(Math.sin(time * 4)) * 2 : 0));
      ctx.fillStyle = onRoute ? '#ff6b9a' : 'rgba(255,255,255,0.92)';
      roundRect(ctx, bx, by, w, 12, 6);
      ctx.fill();
      ctx.strokeStyle = onRoute ? '#ffffff' : '#b9a7ff';
      ctx.lineWidth = 1;
      ctx.stroke();
      let tx = bx + 5;
      // The arrow toward the edge it leads off.
      if (out < 0) {
        ctx.fillStyle = onRoute ? '#ffffff' : '#9a82d8';
        ctx.beginPath();
        ctx.moveTo(tx, by + 6);
        ctx.lineTo(tx + 4, by + 3);
        ctx.lineTo(tx + 4, by + 9);
        ctx.fill();
        tx += 7;
      }
      if (onRoute) {
        sparkle(ctx, tx + 3, by + 6, 2.6, '#ffffff');
        tx += 8;
      }
      ctx.fillStyle = onRoute ? '#ffffff' : '#5a3f7a';
      ctx.font = '800 7px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
      ctx.fillText(name, tx, by + 8.6);
      if (lv) {
        ctx.font = '500 6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = onRoute ? '#ffe9f2' : '#9c86b8';
        ctx.fillText(lv, tx + nw + 5, by + 8.4);
      }
      if (out > 0) {
        const ax = bx + w - 9;
        ctx.fillStyle = onRoute ? '#ffffff' : '#9a82d8';
        ctx.beginPath();
        ctx.moveTo(ax + 4, by + 6);
        ctx.lineTo(ax, by + 3);
        ctx.lineTo(ax, by + 9);
        ctx.fill();
      }
    }
    if (p.id === nearId) {
      const bob = Math.sin(time * 6) * 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x, y - top - 14 + bob);
      ctx.lineTo(x - 6, y - top - 6 + bob);
      ctx.lineTo(x + 6, y - top - 6 + bob);
      ctx.fill();
    }
  }
}

// ---------- Props on the ground and ledges ----------

function prop(ctx, kind, x, y, seed, t, time, wx = x) {
  // Small plants lean with the wind as it rolls past them, each with its own flutter.
  const sway = leanFrame(time, wx, 5, 0, seed * 9);
  switch (kind) {
    case 'flower': return place(ctx, flowerArt(pick(FLOWER_COLORS, seed * 3.7), sway), x, y);
    case 'tulip': return place(ctx, tulipArt(pick(FLOWER_COLORS, seed * 5.3), sway), x, y);
    case 'tuft': return place(ctx, tuftArt(t.trim === '#ffffff' ? '#8fdc9a' : t.trim, sway), x, y);
    case 'bush': return place(ctx, bushArt(t.mid === '#ffffff' ? '#8fdc9a' : mix(t.trim, '#7fd19a', 0.5), seed > 0.82, blinking(time, seed)), x, y);
    case 'lamp': {
      glow(ctx, x, y - 36, 22, '#fff3a6', 0.45 * flicker(time, seed * 9));
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
      glow(ctx, x, y - 12, 12, '#ffd66b', 0.5 * flicker(time, seed * 5));
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
    case 'stonelamp': {
      // Lit after dark; by day just a warm hint in the window.
      const lit = Boolean(t.stars) || t.face === 'moon';
      glow(ctx, x, y - 20, 14, '#ffd27a', (lit ? 0.45 : 0.18) * flicker(time, seed * 5));
      return place(ctx, stoneLampArt(true), x, y);
    }
    case 'pine': return place(ctx, pineArt(seed, Boolean(t.snowcaps), leanFrame(time, wx, 5, 0.1, seed * 3)), x, y + 1);
    case 'reed': return place(ctx, reedArt(sway), x, y + 1);
    case 'snowtuft': return place(ctx, snowTuftArt(sway), x, y + 1);
    case 'chime': return place(ctx, chimeArt(leanFrame(time, wx, 5, 0.2, seed * 5)), x, y);
    case 'torch':
      glow(ctx, x, y - 26, 18, '#ffb35a', 0.5 * flicker(time, seed * 5));
      return place(ctx, torchArt(Math.floor(time * 7 + seed * 5) % 3), x, y);
    case 'dummy': return place(ctx, dummyArt(blinking(time, seed)), x, y + (Math.floor(time * 2 + seed * 9) % 6 === 0 ? -1 : 0));
    case 'cactus': return place(ctx, cactusArt(blinking(time, seed)), x, y);
    case 'rack': return place(ctx, rackArt(), x, y);
    // A cat sat about the place, tail round its feet, ears and tail tip twitching, now and then
    // licking a paw (render/critters.js).
    case 'cat': return drawCat(ctx, `prop|${Math.round(wx)}`, pick(['#ffb38a', '#f2f2ff', '#7a6a8a', '#3b3650'], seed * 7), x, y, wx, seed > 0.6 ? -1 : 1, time, 'sit');
    case 'poster': return place(ctx, posterArt(), x, y);
    case 'lantern':
      // The paper lantern swings on its hook; its light follows it.
      {
        const a = swing(time, wx, 1, seed * 7);
        glow(ctx, x + 3 - Math.sin(a) * 4, y - 22, 16, '#ff9ec0', 0.5 * flicker(time, seed * 7));
        place(ctx, lanternPostArt(), x, y);
        pivoted(ctx, x + 3, y - 34 + 8, a, () => place(ctx, lanternArt(), x, y));
      }
      return;
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
      glow(ctx, x + 4, y - 17, 18, '#ffd68a', 0.55 * flicker(time, seed * 7));
      return place(ctx, hollowLanternArt(), x, y, { flip: seed > 0.75 });
    default:
  }
}

// Sleepy "z"s floating up from something napping.
function zzz(ctx, x, y, time, seed) {
  ctx.save();
  ctx.font = '800 6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
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
const SMALL_PROPS = ['flower', 'tulip', 'tuft', 'rock', 'glowshroom', 'crystal', 'candle', 'cloudpuff', 'moss', 'pebble', 'rootcurl', 'reed', 'snowtuft'];
const BIG_PROPS = ['pine', 'stonelamp', 'chime', 'lamp', 'bench', 'mailbox', 'column', 'target', 'dummy', 'rack', 'poster', 'lantern', 'torch', 'bush', 'cat', 'crate', 'barrel', 'cactus', 'hlantern'];

function drawProps(ctx, t, map, cam, width, time) {
  const surfaces = surfacesOf(map).map((s) => ({ x: s.x1, w: s.x2 - s.x1, ground: s.ground, yAt: s.yAt, drift: s.drift }));
  // A map can thin its props (`look.propKeep`, the share of spots left bare).
  const keep = map.look?.propKeep ?? (map.isTown ? 0.66 : 0.52);
  surfaces.forEach((s, si) => {
    // Nothing grows on a drifting ledge, or on a ledge that's really a tree's bough.
    if (s.drift) return;
    if (!s.ground && map.platforms.some((p) => p.bare && Math.abs(p.x - s.x) < 2 && Math.abs(p.y - s.yAt(s.x)) < 2)) return;
    const step = s.ground ? 38 : 44;
    for (let wx = s.x + 14; wx < s.x + s.w - 12; wx += step) {
      const seed = hash(wx * 0.37 + si * 13 + map.width);
      if (seed < (s.ground ? keep : 0.62)) continue;
      // Keep doorways clear around portals and NPCs, and ropes clear on ledges.
      if (s.ground && map.portals.some((p) => Math.abs(p.x - wx) < 44)) continue;
      if (s.ground && map.npcs.some((n) => Math.abs(n.x - wx) < (map.isTown ? 58 : 30))) continue;
      if (s.ground && map.isTown && map.plaza && Math.abs((map.fountain ?? map.plaza) - wx) < 46) continue;
      const sy = s.yAt(wx);
      // Leave room around houses and landmarks standing on a ledge.
      if (!s.ground && (map.deco ?? []).some(([, dx, , dy]) => dy === sy && Math.abs(dx - wx) < 46)) continue;
      if (map.ropes.some((r) => Math.abs(r.x - wx) < 16 && r.top <= sy + 1 && r.bottom >= sy - 1)) continue;
      // Nothing stands on a steep slope.
      if (Math.abs(s.yAt(wx + 6) - s.yAt(wx - 6)) > 5) continue;
      const x = wx - cam.x;
      if (x < -40 || x > width + 40) continue;
      // A zone grows its own props.
      const props = zoneAt(map, sy, wx)?.look?.props ?? t.props;
      let kind = props[Math.floor(hash(wx + si) * props.length)];
      // Ledges only get small things.
      if (!s.ground && !SMALL_PROPS.includes(kind)) kind = BIG_PROPS.includes(kind) ? (map.look?.ledgeProp !== undefined ? map.look.ledgeProp : t.ledgeProp ?? 'flower') : kind;
      // (An interior can leave its ledges bare: ledgeProp null.)
      if (!kind) continue;
      prop(ctx, kind, snap(x), snap(sy - cam.y), seed, t, time, wx);
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
  // The painted woods' own life: squirrels on the branches and songbirds between the trees.
  if (t.painted === 'forest') drawWoodlandLife(ctx, map, cam, width, height, time);
  if (t.painted === 'meadow') drawMeadowLife(ctx, map, cam, width, height, time, groundAt);
  if (t.painted === 'town') {
    drawVillageLife(ctx, map, cam, width, height, time, groundAt);
  }
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
  // Desert hawks ride the thermals: two wheel in slow wide circles high over the mesas, wings
  // spread and fingered at the tips, banking as they turn, a lazy flap now and then.
  if (kinds.includes('hawk')) {
    for (let i = 0; i < 2; i++) {
      const a = time * (0.22 + i * 0.05) + i * 2.4;
      const cx = (((hash(i + 11) * 1400 - cam.x * 0.15) % 900) + 900) % 900 - 130;
      const hx = cx + Math.cos(a) * (70 + i * 30);
      const hy = 60 + i * 26 + Math.sin(a) * 16;
      const bank = Math.sin(a) * 0.5;
      const flap = Math.max(0, Math.sin(time * 5 + i * 3)) ** 6 * 3;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(Math.cos(a) > 0 ? 1 : -1, 1);
      ctx.rotate(bank * 0.3);
      ctx.fillStyle = '#9a5a4a';
      ctx.beginPath();
      ctx.moveTo(-11, -1 - flap);
      ctx.quadraticCurveTo(-5, -4 - flap * 0.5, 0, -1);
      ctx.quadraticCurveTo(5, -4 - flap * 0.5, 11, -1 - flap);
      ctx.lineTo(9, 0.5 - flap);
      ctx.lineTo(10, 1.4 - flap);
      ctx.quadraticCurveTo(4, -0.6, 1.5, 2);
      ctx.lineTo(0, 3.6);
      ctx.lineTo(-1.5, 2);
      ctx.quadraticCurveTo(-4, -0.6, -10, 1.4 - flap);
      ctx.lineTo(-9, 0.5 - flap);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c88a6a';
      ctx.fillRect(-1, -1.6, 2, 1.6);
      ctx.restore();
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
  const base = { petal: ['#ffc6de', '#ffe3ef', '#ffffff'], leaf: ['#9fe0b0', '#c4f2a8', '#ffd6a5'], mote: ['#ffe6ff', '#fff6c9'], sparkle: ['#ffffff', '#c9f2ff', '#ffe36b'], ember: ['#ffb35a', '#ff8a5c', '#ffe36b'], spore: t.shrooms, snow: ['#ffffff', '#f2f6ff', '#e6eeff'], steam: ['#ffffff', '#f2fbff'], bubble: ['#eaf8ff', '#ffffff', '#bfeeff'], confetti: ['#ff7aa8', '#ffd36b', '#7fd8ff', '#9ae6a8', '#c9a6ff'], sprinkle: ['#ff5a6a', '#ffd36b', '#7fd8ff', '#9ae66a', '#ffffff'] }[t.drift];
  const colors = band.air ? base.map((c) => mix(c, t.sky[1], band.air)) : base;
  // Embers rise from the forges and spores float up from the mushrooms instead of falling.
  const rise = t.drift === 'ember' || t.drift === 'spore' || t.drift === 'steam' || t.drift === 'bubble' ? -1 : 1;
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
    // Snow falls in soft round flakes; steam rises in faint puffs that swell as they go.
    if (t.drift === 'snow') {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + wob * 1.4, y, (1.1 + (j % 3) * 0.45) * k, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    if (t.drift === 'steam') {
      const u = ((y + 10) / (height + 20));
      ctx.globalAlpha = 0.22 * band.alpha * Math.sin(Math.PI * u);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + wob * 2, y, (5 + (1 - u) * 9) * k, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    // Confetti flutters down, tumbling: little paper squares flashing their light side.
    if (t.drift === 'confetti' || t.drift === 'sprinkle') {
      const turn = Math.sin(time * 6 + i);
      ctx.fillStyle = turn > 0 ? c : mix(c, '#ffffff', 0.4);
      ctx.save();
      ctx.translate(x + wob, y);
      ctx.rotate(time * 2 + i);
      ctx.fillRect(-1.6 * k, -1 * k, 3.2 * k, 2 * k * (0.5 + 0.5 * Math.abs(turn)));
      ctx.restore();
      continue;
    }
    // Bubbles rise wobbling: a ring with a glint.
    if (t.drift === 'bubble') {
      ctx.strokeStyle = c;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(x + wob * 0.6, y, (1.2 + (j % 3) * 0.6) * k, 0, Math.PI * 2);
      ctx.stroke();
      rect(ctx, x + wob * 0.6 - 0.6 * k, y - 0.8 * k, 0.8, 0.8, '#ffffff');
      continue;
    }
    if (t.drift === 'sparkle' || t.drift === 'mote') {
      ctx.globalAlpha = (0.4 + 0.5 * Math.abs(Math.sin(time * 2 + i))) * band.alpha;
      sparkle(ctx, x + wob, y, (1.6 + (j % 3) * 0.6) * k, c);
      continue;
    }
    // Leaves are real leaves: they turn over as they fall, lit face then paler back, a midrib
    // down them, and tip further when a gust blows.
    if (t.drift === 'leaf') {
      leafShape(ctx, x + wob, y, k * 0.95, time * (2 + hash(i + 3) * 2) + i, Math.sin(time * 1.3 + i) * 0.8 + gust * 0.5, c, mix(c, '#fff8e0', 0.35));
      continue;
    }
    // Petals tumble, and tip over further when a gust blows.
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

// Everything in front of the characters: the nearest band of drifting petals or sparks. (Nothing
// hangs into the top of the view: out-of-focus leaf clumps, branches and garlands hanging from
// nothing read as clutter, and were taken out.)
// Indoors is indoors (the player's standing rule, 2026-11-04): a room inside a house (`map.indoor`:
// your hut, the Sweethearts' rooms) keeps nothing of the outdoors its town's look would bring in:
// no birds hopping on the floor, butterflies, gulls or fireflies, no petals, leaves or snow drifting
// through it, and none of a painted town's street life. Its own life is drawn with the room.
export const roomLook = (map, t) => (map.indoor ? { ...t, critters: [], drift: null, painted: null, edges: null } : t);

export function drawSceneFront(ctx, map, cam, width, height, time) {
  const theme = THEMES[map.theme] ? map.theme : 'meadow';
  const t = roomLook(map, map.look ? { ...THEMES[theme], ...map.look } : THEMES[theme]);
  if (t.painted === 'forest') drawPaintedForestFront(ctx, t, cam, width, height, time);
  if (t.painted === 'town') drawPaintedTownFront(ctx, t, cam, width, height, time);
  drawDrift(ctx, t, cam, width, height, time, 'front');
}

// Everything behind the characters.
// Zones: a tall map is split by height (`map.zones`, listed bottom first, each starting `from`
// its y upward), and each zone restyles the map's look with its own (sky, ledges, props...).
// A map laid out side by side (`zonesBy: 'x'`) lists its zones left to right instead, each
// starting `from` its x rightward.
export function zoneAt(map, y, x = 0) {
  const zones = map.zones;
  if (!zones?.length) return null;
  let z = zones[0];
  if (map.zonesBy === 'x') for (const n of zones) { if (x >= n.from) z = n; }
  else for (const n of zones) if (y <= n.from) z = n;
  return z;
}
export function zoneLook(map, y, x = 0) {
  const z = zoneAt(map, y, x);
  return z?.look ? { ...map.look, ...z.look } : map.look;
}
// The backdrop eases from one zone's look into the next over a band either side of the line
// between them, so climbing changes the sky gradually: colours blend, other choices switch halfway.
const ZONE_BLEND = 140;
// (The blend steps in eighths: every new colour restyles every backdrop picture, and a different
// one every frame across the band rebuilt the whole background each frame you climbed through it.)
function blendLook(a, b, k) {
  k = Math.round(k * 8) / 8;
  if (k <= 0) return a;
  if (k >= 1) return b;
  const out = { ...(k < 0.5 ? a : b) };
  for (const key of Object.keys(b)) {
    const x = a[key];
    const y = b[key];
    if (typeof x === 'string' && typeof y === 'string' && x[0] === '#' && y[0] === '#') out[key] = mix(x, y, k);
    else if (Array.isArray(x) && Array.isArray(y) && x.length === y.length && typeof x[0] === 'string' && x[0][0] === '#') out[key] = x.map((c, i) => mix(c, y[i], k));
  }
  return out;
}
function backdropLook(map, base, cam, height, width = 640) {
  if (!map.zones?.length) return base;
  const look = (z) => ({ ...base, ...z.look });
  if (map.zonesBy === 'x') {
    // Side by side: blend by where the middle of the view is.
    const x = cam.x + width / 2;
    const here = zoneAt(map, 0, x);
    const i = map.zones.indexOf(here);
    const next = map.zones[i + 1];
    const prev = map.zones[i - 1];
    if (next && next.from - x < ZONE_BLEND) return blendLook(look(here), look(next), 0.5 - (next.from - x) / (2 * ZONE_BLEND));
    if (prev && x - here.from < ZONE_BLEND) return blendLook(look(prev), look(here), 0.5 + (x - here.from) / (2 * ZONE_BLEND));
    return look(here);
  }
  const y = cam.y + height * 0.6;
  const here = zoneAt(map, y);
  const i = map.zones.indexOf(here);
  const up = map.zones[i + 1];
  const down = map.zones[i - 1];
  // Nearing the zone above, or just come up from the one below.
  if (up && y - up.from < ZONE_BLEND) return blendLook(look(here), look(up), 0.5 - (y - up.from) / (2 * ZONE_BLEND));
  if (down && here.from - y < ZONE_BLEND) return blendLook(look(down), look(here), 0.5 + (here.from - y) / (2 * ZONE_BLEND));
  return look(here);
}

const NIGHT = { sky: ['#1a1646', '#33296e', '#5a4790'], far: '#3a3274', mid: '#463c84', midTrim: '#5a4e9a' };
function nightLook(t, k) {
  const out = blendLook(t, { ...t, ...NIGHT, far: mix(t.far, NIGHT.far, 0.75), mid: mix(t.mid, NIGHT.mid, 0.7), midTrim: mix(t.midTrim ?? t.mid, NIGHT.midTrim, 0.7) }, k);
  if (k < 0.5 || t.underground) return out;
  return { ...out, face: 'moon', stars: true, rainbow: 0, critters: [...new Set([...(t.critters ?? []).filter((c) => c !== 'butterfly'), 'firefly'])] };
}

// Things a map's own pieces draw just behind the ground's front edge, so the grass lip overlaps their
// foot (render/garden.js: the fruit trees, growing up out of the ground rather than stood on it).
export const BEHIND_GROUND = [];
export function drawSceneBack(ctx, map, cam, width, height, time, nearPortalId, street = null, routePortalId = null) {
  const theme = THEMES[map.theme] ? map.theme : 'meadow';
  // A map can restyle its theme (its own sky, skyline, drift...) so no two maps look alike, and a
  // tall map's zones restyle it again as you climb.
  const day = roomLook(map, backdropLook(map, map.look ? { ...THEMES[theme], ...map.look } : THEMES[theme], cam, height, width));
  // At night (world/daytime.js) the sky darkens to stars and the moon, and fireflies come out.
  const t = map.night > 0 ? nightLook(day, map.night) : day;
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
  const farC = mix(t.far, air, 0.3 * aerial);
  // The far plane's lit rim leans toward the light's colour; the plane behind it fades nearly
  // into the sky.
  const far = { ...t, far: farC, farLit: mix(farC, t.sun, 0.42), farBack: mix(t.far, air, 0.62 * aerial) };
  const backdrop = (g) => {
    drawSky(g, t, theme, width, height, time);
    // (Under a painted forest's canopy, under the sea and indoors there are no clouds to see.)
    if (t.painted !== 'forest' && !t.underground && !t.ceiling && !['reef', 'manorhall', 'bigtop', 'workshop', 'funhouse', 'kitchen', 'starhall', 'archive', 'orrery', 'candycave', 'forge', 'crater', 'stagehall', 'pirate', 'fairy', 'ballroom', 'backstage', 'greatstage', 'lungs', 'manorball', 'library', 'hallway'].includes(t.skyline)) drawClouds(g, theme, cam, width, time, air, Boolean(t.stars) && t.face === 'moon' && theme !== 'harbor' && theme !== 'grove');
    // A painted backdrop (painted.js) in place of the flat silhouettes, where the theme has one.
    if (t.painted === 'forest') drawPaintedForest(g, t, cam, width, height, time, layerY, air);
    else if (t.painted === 'meadow') drawPaintedMeadow(g, t, cam, width, height, time, layerY, air);
    else {
      const farY = layerY(50, 0.05);
      veil = { color: air, k: 0.5 * aerial };
      // The village keeps its drawn houses in front but gets a painted hillside town far behind.
      if (t.painted === 'town') drawPaintedTownFar(g, t, cam, width, height, time, layerY, air);
      else drawFar(g, far, cam, width, farY, time);
      footHaze(g, air, width, height, farY + 24, 0.3 * aerial);
      veil = { color: air, k: 0.22 * aerial };
      drawMid(g, t, theme, cam, width, layerY(10, 0.1), time);
      veil = null;
    }
    // (A painted backdrop lays its own haze at each plane's foot.)
    if (t.painted !== 'forest' && t.painted !== 'meadow') drawHaze(g, t, width, map.groundY - cam.y);
  };
  backdrop(ctx);
  drawDrift(ctx, t, cam, width, height, time, 'back');
  drawDeco(ctx, map, cam, width, time, 'behind', air);
  for (const hook of BEHIND_GROUND) hook(ctx, map, cam, width, time);
  drawTerrain(ctx, theme, map, cam, width, height, time);
  drawDeco(ctx, map, cam, width, time, 'ground');
  // Town buildings stand on the street, behind ledges and props.
  street?.();
  drawLedges(ctx, t, theme, map, cam, width, height, time);
  drawDeco(ctx, map, cam, width, time, 'ledges');
  drawProps(ctx, t, map, cam, width, time);
  drawRopes(ctx, map, cam);
  drawMovers(ctx, map, cam, width, height, time);
  drawPortals(ctx, map, cam, time, nearPortalId, routePortalId);
  drawCritters(ctx, t, map, cam, width, height, time);
  drawDrift(ctx, t, cam, width, height, time);
}
