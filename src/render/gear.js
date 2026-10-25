// Equipment designs for the hero rig. Every slot has a look per tier, plus one-off designs for
// special items. Shapes are in body coordinates: a 30x56 anime chibi facing right, feet at y = 56.
// Sprites are soft (cel-shaded with tinted outlines), so designs are flat color blocks plus a few
// flat (F) details; shading and edges come from the renderer.
//
// Landmarks: head center (15.5, 15) r10 · neck y 23-27 · torso x 10.5-20, y 26.5-37.5 ·
// hips y 36.5-41 · legs x 12-15 (back) and 15.6-18.6 (front), y 40-52 · shoes y 51-56 ·
// shoulders (11.3, 27.5) and (19.2, 27.5) · hands rest at y 38.

import { R, E, T, F, shade } from './pixel.js';

const GOLD = '#ffd66b';
const SILVER = '#dfe6f5';
const INK = '#3a2d4f';

// ---------- Tops (torso part) ----------

const TORSO = [[10.4, 26.4], [20.2, 26.4], [20.8, 29.5], [19.9, 37.6], [10.8, 37.6], [9.9, 29.5]];
// Robes flare past the hips.
const ROBE = [[10.4, 26.4], [20.2, 26.4], [20.8, 29.5], [21.6, 44.5], [9.2, 44.5], [9.9, 29.5]];
const torso = (c) => T(TORSO, c);
const collar = (c) => T([[12.5, 26.4], [18.4, 26.4], [15.8, 29.4]], c);

export function topShapes(design, c) {
  const d = shade(c, -16);
  const l = shade(c, 18);
  switch (design) {
    case 'stripes': return [torso(c), R(10.5, 29.5, 10, 1.2, d), R(10.5, 32.5, 10, 1.2, d), R(10.6, 35.5, 9.6, 1.2, d), collar(l)];
    case 'vest': return [torso('#fff6ec'), T([[11, 26.5], [14, 26.5], [14.4, 37.6], [10.8, 37.6], [10.2, 29.5]], c), T([[17.2, 26.5], [19.6, 26.5], [20.4, 29.5], [19.8, 37.6], [16.8, 37.6]], c), R(10.6, 34.6, 9.6, 1.8, '#7a5238'), F(E(15.6, 35.5, 0.9, 0.8, GOLD))];
    case 'plate': return [torso(SILVER), T([[12.6, 28], [18.6, 28], [17.8, 33.5], [15.6, 35], [13.4, 33.5]], c), F(E(14.4, 29.6, 0.8, 0.8, '#ffffff')), R(10.6, 35, 9.6, 2, shade(SILVER, -18)), E(10.6, 27.6, 2.4, 2, l), E(20, 27.6, 2.4, 2, l)];
    case 'starrobe': return [T(ROBE, c), R(10.4, 26.4, 9.4, 1, GOLD), F(R(15.2, 30, 0.9, 3, GOLD)), F(R(14.2, 31, 2.9, 0.9, GOLD)), R(9.3, 43.4, 12.2, 1.1, GOLD), F(E(12.5, 40, 0.6, 0.6, '#ffffff')), F(E(18.4, 38.5, 0.6, 0.6, GOLD))];
    case 'celestial': return [T(ROBE, c), T([[11.6, 33], [19.6, 33], [21, 44.5], [10, 44.5]], l), R(10.4, 26.4, 9.4, 1, GOLD), R(15.2, 26.5, 1, 18, GOLD), F(E(13.3, 30, 1.2, 1.6, '#ffffff')), F(E(18, 30, 1.2, 1.6, '#ffffff')), R(9.3, 43.4, 12.2, 1.1, GOLD)];
    case 'kimono': return [T(ROBE, c), T([[12.4, 26.5], [15, 26.5], [17.8, 32]], '#ffffff'), T([[14, 26.5], [16, 26.5], [17.8, 31]], l), R(10.4, 31.5, 10.2, 3, '#ff6b9a'), F(E(18, 33, 0.8, 0.8, GOLD)), F(E(12, 38, 0.7, 0.7, '#ffffff')), F(E(19, 41, 0.7, 0.7, '#ffffff'))];
    case 'sailor': return [torso('#ffffff'), T([[10.6, 26.5], [20, 26.5], [20.2, 29], [15.6, 31.6], [10.4, 29]], c), F(T([[14.2, 30], [17, 30], [16.4, 33], [15.6, 32], [14.8, 33]], '#ff6b8a')), R(10.7, 35.4, 9.4, 2.2, c)];
    case 'hoodie': return [torso(c), T([[11.4, 26], [19.6, 26], [18.6, 28.4], [12.4, 28.4]], d), R(12.4, 32, 6.4, 3, d), F(R(13.6, 27.6, 0.6, 3.6, '#ffffff')), F(R(17, 27.6, 0.6, 3.6, '#ffffff'))];
    default: return [torso(c), collar(l), R(10.8, 36.2, 9.2, 1.4, d)];
  }
}

// Sleeves follow the top's main color; armor shows metal.
export function sleeveColor(design, c) {
  if (design === 'plate') return SILVER;
  if (design === 'vest' || design === 'sailor') return '#ffffff';
  return c;
}

// Robes, armor, and hoodies cover the whole arm; everything else leaves the forearm bare.
export function longSleeves(design) {
  return ['plate', 'starrobe', 'celestial', 'kimono', 'hoodie'].includes(design);
}

// ---------- Bottoms (leg colors, hips, and an optional skirt) ----------

export function legLook(design, c, skin) {
  switch (design) {
    case 'shorts': return { top: c, low: skin, pad: null };
    case 'leather': return { top: c, low: c, pad: shade(c, 20) };
    case 'greaves': return { top: SILVER, low: SILVER, pad: '#ffffff' };
    case 'starskirt': return { top: skin, low: skin, pad: null };
    case 'celestialskirt': return { top: '#ffffff', low: '#ffffff', pad: null };
    default: return { top: c, low: c, pad: null };
  }
}

export function hipShapes(look) {
  return [T([[10.9, 36.6], [19.8, 36.6], [20.2, 41.4], [10.4, 41.4]], look.top)];
}

export function skirtShapes(design, c) {
  if (design === 'starskirt') return [T([[10.6, 36.4], [20, 36.4], [22, 43.6], [8.8, 43.6]], c), R(8.9, 42.6, 13, 1, GOLD), F(E(12, 40, 0.6, 0.6, GOLD)), F(E(17.5, 39, 0.6, 0.6, GOLD)), F(E(20, 41.4, 0.6, 0.6, '#ffffff'))];
  if (design === 'celestialskirt') return [T([[10.6, 36.4], [20, 36.4], [22.6, 47.6], [8.2, 47.6]], c), R(8.3, 46.4, 14.2, 1.2, GOLD), T([[15, 36.4], [16.2, 36.4], [16.6, 46.4], [14.6, 46.4]], shade(c, 18))];
  return null;
}

// ---------- Legs with shoes (one leg; back legs are drawn a shade darker) ----------

export function legShapes(x, look, shoe, back) {
  const k = back ? -10 : 0;
  const top = shade(look.top, k);
  const low = shade(look.low, k);
  const shapes = [T([[x, 40], [x + 3, 40], [x + 2.7, 46.8], [x + 0.3, 46.8]], top), T([[x + 0.3, 46.6], [x + 2.7, 46.6], [x + 2.4, 52.4], [x + 0.6, 52.4]], low)];
  if (look.pad) shapes.push(E(x + 1.5, 46.8, 1.8, 1.4, shade(look.pad, k)));
  shapes.push(...shoeShapes(x, shoe, k));
  return shapes;
}

function shoeShapes(x, shoe, k) {
  const c = shade(shoe.color, k);
  const foot = (col, top = 51.4) => [T([[x, top], [x + 3, top], [x + 3.4, 53.6], [x + 4.6, 54.4], [x + 4.6, 56], [x - 0.4, 56], [x - 0.4, 53]], col)];
  switch (shoe.design) {
    case 'boots': return [...foot(c, 48.6), R(x - 0.5, 48.4, 4, 1.1, shade(c, 18))];
    case 'leatherboots': return [...foot(c, 47.6), R(x - 0.5, 47.4, 4, 1.6, shade(c, -18)), F(E(x + 1.5, 50.4, 0.5, 0.5, GOLD))];
    case 'sabatons': return [...foot(shade(SILVER, k), 49), R(x - 0.5, 53.8, 5.2, 1.2, shade(SILVER, k - 14)), F(E(x + 1.2, 50.6, 0.6, 0.6, '#ffffff'))];
    case 'starboots': return [...foot(c, 48.6), R(x - 0.5, 48.4, 4, 1, GOLD), F(E(x + 1.6, 51.4, 0.8, 0.8, GOLD))];
    case 'wingboots': return [...foot(c, 49.6), T([[x - 0.4, 50], [x - 3.6, 48.4], [x - 2.6, 50.4], [x - 3.4, 51.6], [x - 0.4, 51.6]], '#ffffff')];
    default: return [...foot(c), R(x - 0.4, 55, 5, 1, shade(c, -18))];
  }
}

// ---------- Hats ----------

export function hatShapes(design, c) {
  const d = shade(c, -18);
  const l = shade(c, 20);
  switch (design) {
    case 'beanie': return [E(15.5, 7, 11, 5.4, c), R(4.6, 8.6, 21.8, 3, d), E(15.5, 1.2, 2.6, 2.6, l)];
    case 'sunhat': return [E(15.5, 8.6, 15, 2.8, c), E(15.5, 5.4, 8.6, 4.6, c), R(7.4, 6.6, 16.4, 2, '#ff9ec0'), F(E(23, 7, 1.4, 1.2, '#ffffff'))];
    case 'cap': return [E(14.5, 6.6, 10.6, 5, c), T([[17, 8], [29, 8.6], [28, 10.4], [17, 10.4]], d), F(E(12, 4.6, 2, 1.4, '#8fd3ff')), F(E(16.6, 4.6, 2, 1.4, '#8fd3ff'))];
    case 'helmet': return [E(15.5, 9, 11.6, 8.6, SILVER), R(3.8, 10, 3, 10, SILVER), R(4, 8.6, 23, 2, shade(SILVER, -15)), T([[14.4, 1], [17.6, 1], [18.6, -5], [13.4, -4]], '#ff9ec0'), F(E(10, 5, 1, 0.8, '#ffffff'))];
    case 'witch': return [E(15.5, 8.8, 15, 2.8, c), T([[8.6, 8], [22.4, 8], [19.4, 2], [22, -6], [14.4, -1]], c), R(9, 6.2, 13, 1.6, GOLD), F(E(15.8, 4.2, 0.8, 0.8, GOLD))];
    case 'circlet': return [R(5, 7.4, 21.6, 1.8, GOLD), F(E(15.5, 8.2, 1.9, 1.9, '#c9a6ff')), F(E(15, 7.6, 0.6, 0.6, '#ffffff')), T([[5, 7], [0, 3], [1.4, 6.8], [-0.4, 8.6], [4.6, 9]], '#ffffff'), T([[26, 7], [31, 3], [29.6, 6.8], [31.4, 8.6], [26.4, 9]], '#ffffff')];
    case 'bunny': return [E(15.5, 5.6, 11.6, 4.4, '#ffffff'), R(4, 6.6, 3, 14, '#ffffff'), R(24.4, 6.6, 3, 10, '#ffffff'), E(10.4, -2.6, 2.4, 8, '#ffffff'), E(19.6, -3.4, 2.4, 8.4, '#ffffff'), F(E(10.4, -2, 1.1, 6, '#ffc2d6')), F(E(19.6, -2.8, 1.1, 6.4, '#ffc2d6'))];
    case 'kitty': return [T([[5.4, 4.6], [7.6, -3.4], [11.8, 2.4]], c), T([[19.6, 2.4], [23.8, -3.4], [25.8, 4.6]], c), F(T([[7, 3.4], [7.9, -0.8], [10.2, 2.4]], '#ffc2d6')), F(T([[21.2, 2.4], [23.4, -0.8], [24.4, 3.4]], '#ffc2d6'))];
    case 'flowers': return [R(5, 6.4, 21.6, 1.8, '#7fd17a'), E(7.2, 6.4, 2.3, 2.3, '#ff9ec0'), E(12.2, 4.8, 2.3, 2.3, '#ffe36b'), E(18.4, 4.8, 2.3, 2.3, '#ffffff'), E(23.6, 6.4, 2.3, 2.3, '#c9a6ff'), F(E(12.2, 4.8, 0.7, 0.7, '#ff9ec0')), F(E(18.4, 4.8, 0.7, 0.7, GOLD))];
    case 'crown': return [T([[6, 7], [6, 0], [9, 3], [12, -3], [15.5, 2], [19, -3], [22, 3], [25, 0], [25, 7]], GOLD), F(E(15.5, 5, 1.4, 1.4, '#ff9ec0')), F(E(9.6, 5.2, 0.9, 0.9, '#8fe3ff')), F(E(21.4, 5.2, 0.9, 0.9, '#8fe3ff'))];
    case 'beret': return [E(14.6, 5.4, 11.6, 4.4, c), E(9.6, 4.4, 3, 2, l), R(13.6, 0, 2, 2, d), F(E(20.4, 4.4, 1, 1, GOLD))];
    default: return [];
  }
}

// Hats that hide the back hair (a hood or helmet wraps the whole head).
export const TUCKS_HAIR = new Set(['helmet', 'bunny']);

// Parts of a hat drawn behind the head: hoods and helmets wrap around it.
export function hatBackShapes(design, c) {
  if (design === 'bunny') return [E(15.5, 14, 13.4, 12.8, '#ffffff'), E(15.5, 26, 9, 3, '#ffffff')];
  if (design === 'helmet') return [E(15.5, 13.4, 12.4, 11.4, SILVER)];
  if (design === 'witch') return [R(8, 8.6, 16, 3, shade(c, -18))];
  return [];
}

// ---------- Gloves (on each hand) ----------

export function handShapes(hx, hy, glove, skin) {
  if (!glove) return [E(hx, hy, 1.8, 1.9, skin)];
  const c = glove.color;
  switch (glove.design) {
    case 'cuffed': return [E(hx, hy, 1.8, 1.9, c), R(hx - 1.8, hy - 2.8, 3.6, 1.4, shade(c, 25))];
    case 'gauntlet': return [E(hx, hy, 2.1, 2, SILVER), R(hx - 1.8, hy - 3.6, 3.6, 2, c), F(E(hx - 0.6, hy - 0.6, 0.5, 0.5, '#ffffff'))];
    default: return [E(hx, hy, 1.8, 1.9, c)];
  }
}

// ---------- Earrings (on the visible ear, under the side hair) ----------

export function earringShapes(design, c) {
  switch (design) {
    case 'drop': return [F(R(7.1, 20.6, 0.7, 1.6, GOLD)), E(7.4, 23.4, 1.2, 1.5, c)];
    case 'star': return [F(R(7.1, 20.6, 0.7, 1.6, GOLD)), T([[7.4, 21.6], [8, 23], [9.4, 23.2], [8.2, 24], [8.6, 25.4], [7.4, 24.6], [6.2, 25.4], [6.6, 24], [5.4, 23.2], [6.8, 23]], c)];
    default: return [E(7.4, 21.6, 1.1, 1.1, c)];
  }
}

// ---------- Capes (behind the body). `sway` bends the hem; wings flap with `flap`. ----------

export function capeShapes(design, c, sway, flap) {
  const d = shade(c, -20);
  const s = sway;
  const h = s / 2;
  const cape = (bottom) => T([[10.6, 26.6], [20, 26.6], [21.4 + h, 38], [22 + s, bottom], [8.4 + s, bottom], [8.8 + h, 38]], c);
  switch (design) {
    case 'fairy': {
      const up = flap ? -2 : 1;
      return [E(4, 29 + up, 6.4, 8.4, '#c9f2ff'), E(5, 39 + up, 4.6, 5.6, '#ffd0ec'), F(E(6.4, 29 + up, 3, 4.6, '#e8fbff'))];
    }
    case 'angel': {
      const up = flap ? -2 : 1;
      return [T([[11, 28 + up], [3, 22 + up], [-4, 26 + up], [-3, 31 + up], [-5, 35 + up], [-2, 39 + up], [4, 41 + up], [10, 36 + up]], '#ffffff'), F(T([[3, 27 + up], [-2, 30 + up], [3, 31 + up]], '#eef2ff')), F(T([[3, 33 + up], [-2, 36 + up], [4, 37 + up]], '#eef2ff'))];
    }
    case 'starcape': return [cape(50), R(8.4 + s, 49, 13.6, 1.1, GOLD), F(E(12 + h, 40, 0.7, 0.7, '#ffe36b')), F(E(18.6 + h, 43, 0.7, 0.7, '#ffffff')), F(E(11 + s, 47, 0.7, 0.7, '#ffffff')), F(E(19 + s, 47.6, 0.7, 0.7, '#ffe36b'))];
    case 'long': return [cape(50), R(8.4 + s, 49, 13.6, 1.1, d), R(13.4, 26.4, 5, 2, GOLD)];
    case 'royal': return [cape(50), R(8.4 + s, 48, 13.6, 2, GOLD), T([[10, 26], [20.6, 26], [21, 29], [9.6, 29]], '#ffffff'), F(E(12.4, 27.6, 0.5, 0.5, INK)), F(E(17.6, 27.6, 0.5, 0.5, INK))];
    default: return [cape(44), R(8.8 + h, 43, 13, 1, d)];
  }
}

