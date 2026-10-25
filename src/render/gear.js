// Equipment designs for the hero rig. Every slot has a look per tier, plus one-off designs for
// special items. Shapes are in body coordinates: a 30x48 chibi facing right, feet at y = 48.
//
// Landmarks: head center (15, 15) r10 · torso x 10-21, y 25-37 · legs x 11-15 and 16-20, y 34-44 ·
// shoes y 44-47 · back arm x 8-11 · front arm x 19-22 · shoulders y 26.

import { R, E, P, shade } from './pixel.js';

const GOLD = '#ffd66b';
const SILVER = '#dfe6f5';
const INK = '#3a2d4f';

// ---------- Tops (torso part) ----------

export function topShapes(design, c) {
  const d = shade(c, -16);
  const l = shade(c, 16);
  switch (design) {
    case 'stripes': return [R(10, 25, 11, 12, c), R(10, 28, 11, 1, d), R(10, 31, 11, 1, d), R(10, 34, 11, 1, d), R(13, 25, 5, 2, l)];
    case 'vest': return [R(10, 25, 11, 12, '#fff6ec'), R(10, 25, 4, 12, c), R(17, 25, 4, 12, c), R(10, 34, 11, 2, '#7a5238'), P(15, 34, GOLD), P(15, 35, GOLD)];
    case 'plate': return [R(10, 25, 11, 12, SILVER), E(15.5, 29.5, 4.5, 3.5, c), P(14, 28, '#ffffff'), R(10, 34, 11, 2, shade(SILVER, -20)), E(10, 26, 2.5, 2, l), E(21, 26, 2.5, 2, l)];
    case 'starrobe': return [R(10, 25, 11, 12, c), R(9, 33, 13, 4, c), R(10, 25, 11, 1, GOLD), R(15, 28, 1, 3, GOLD), R(14, 29, 3, 1, GOLD), R(9, 36, 13, 1, GOLD)];
    case 'celestial': return [R(10, 25, 11, 12, c), R(9, 32, 13, 5, l), R(10, 25, 11, 1, GOLD), R(15, 25, 1, 12, GOLD), E(13, 29, 1.5, 2, '#ffffff'), E(18, 29, 1.5, 2, '#ffffff'), R(9, 36, 13, 1, GOLD)];
    case 'kimono': return [R(10, 25, 11, 12, c), R(13, 25, 2, 7, '#ffffff'), R(14, 26, 2, 6, l), R(10, 31, 11, 3, '#ff6b9a'), P(17, 32, GOLD), P(11, 27, '#ffffff'), P(19, 28, '#ffffff'), P(12, 35, '#ffffff')];
    case 'sailor': return [R(10, 25, 11, 12, '#ffffff'), R(10, 25, 11, 3, c), R(13, 28, 5, 2, c), E(15.5, 30, 2, 1.5, '#ff6b8a'), R(10, 35, 11, 2, c)];
    case 'hoodie': return [R(10, 25, 11, 12, c), R(12, 31, 7, 3, d), R(13, 26, 1, 4, '#ffffff'), R(17, 26, 1, 4, '#ffffff'), R(10, 36, 11, 1, d)];
    default: return [R(10, 25, 11, 12, c), R(13, 25, 5, 2, l), R(10, 35, 11, 1, d)];
  }
}

// Sleeves follow the top's main color; armor shows metal.
export function sleeveColor(design, c) {
  if (design === 'plate') return SILVER;
  if (design === 'vest' || design === 'sailor') return '#ffffff';
  return c;
}

// ---------- Bottoms (leg color, plus an optional skirt over the hips) ----------

export function legLook(design, c, skin) {
  switch (design) {
    case 'shorts': return { top: c, low: skin, pad: null };
    case 'leather': return { top: c, low: c, pad: shade(c, 20) };
    case 'greaves': return { top: SILVER, low: SILVER, pad: '#ffffff' };
    case 'starskirt': return { top: '#ffffff', low: '#ffffff', pad: null };
    case 'celestialskirt': return { top: '#ffffff', low: '#ffffff', pad: null };
    default: return { top: c, low: c, pad: null };
  }
}

export function skirtShapes(design, c) {
  if (design === 'starskirt') return [R(9, 34, 13, 6, c), R(9, 39, 13, 1, GOLD), P(11, 37, GOLD), P(16, 36, GOLD), P(20, 38, GOLD)];
  if (design === 'celestialskirt') return [R(9, 34, 13, 9, c), R(8, 40, 15, 3, c), R(8, 42, 15, 1, GOLD), R(15, 34, 1, 8, shade(c, 18))];
  return null;
}

// ---------- Legs with shoes (one leg; back legs are drawn a shade darker) ----------

export function legShapes(x, look, shoe, back) {
  const k = back ? -10 : 0;
  const top = shade(look.top, k);
  const low = shade(look.low, k);
  const shapes = [R(x, 34, 4, 5, top), R(x, 39, 4, 5, low)];
  if (look.pad) shapes.push(R(x, 39, 4, 2, shade(look.pad, k)));
  shapes.push(...shoeShapes(x, shoe, k));
  return shapes;
}

function shoeShapes(x, shoe, k) {
  const c = shade(shoe.color, k);
  switch (shoe.design) {
    case 'boots': return [R(x - 1, 42, 6, 6, c), R(x - 1, 42, 6, 1, shade(c, 18)), R(x + 3, 46, 2, 1, c)];
    case 'leatherboots': return [R(x - 1, 41, 6, 7, c), R(x - 1, 41, 6, 2, shade(c, -18)), R(x + 3, 46, 2, 1, c)];
    case 'sabatons': return [R(x - 1, 42, 6, 6, shade(SILVER, k)), R(x - 1, 45, 7, 2, shade(SILVER, k - 12)), P(x + 1, 43, '#ffffff')];
    case 'starboots': return [R(x - 1, 42, 6, 6, c), P(x + 1, 44, GOLD), R(x - 1, 42, 6, 1, GOLD)];
    case 'wingboots': return [R(x - 1, 43, 6, 5, c), R(x - 3, 42, 2, 3, '#ffffff'), P(x - 4, 41, '#ffffff')];
    default: return [R(x - 1, 44, 6, 4, c), R(x - 1, 46, 6, 1, shade(c, -15)), P(x + 1, 44, shade(c, 15))];
  }
}

// ---------- Hats ----------

export function hatShapes(design, c) {
  const d = shade(c, -18);
  const l = shade(c, 20);
  switch (design) {
    case 'beanie': return [E(15, 6, 10.5, 5, c), R(5, 8, 21, 3, d), E(15, 0.5, 2.5, 2.5, l)];
    case 'sunhat': return [E(15, 8, 14, 2.5, c), E(15, 5, 8, 4, c), R(8, 6, 15, 2, '#ff9ec0'), P(22, 6, '#ffffff')];
    case 'cap': return [E(14, 6, 10, 4.5, c), R(18, 8, 10, 2, d), E(11, 4, 2, 1.5, '#8fd3ff'), E(16, 4, 2, 1.5, '#8fd3ff'), R(12, 4, 3, 1, INK)];
    case 'helmet': return [E(15, 8, 11, 8, SILVER), R(4, 10, 3, 9, SILVER), R(4, 8, 22, 2, shade(SILVER, -15)), R(14, -3, 3, 7, '#ff9ec0'), P(10, 4, '#ffffff')];
    case 'witch': return [E(15, 8, 14, 2.5, c), R(10, 3, 10, 5, c), R(12, -1, 7, 4, c), R(15, -4, 5, 3, c), R(18, -6, 3, 2, c), R(10, 6, 10, 1, GOLD), P(16, 4, GOLD), P(17, 3, GOLD)];
    case 'circlet': return [R(5, 7, 21, 2, GOLD), E(15, 7.5, 2.2, 2.2, '#c9a6ff'), P(14, 7, '#ffffff'), R(2, 3, 4, 3, '#ffffff'), R(0, 2, 2, 2, '#ffffff'), R(25, 3, 4, 3, '#ffffff'), R(29, 2, 2, 2, '#ffffff')];
    case 'bunny': return [E(15, 5, 11, 4, '#ffffff'), R(4, 6, 3, 14, '#ffffff'), R(24, 6, 3, 10, '#ffffff'), R(8, -9, 4, 14, '#ffffff'), R(17, -10, 4, 15, '#ffffff'), R(9, -7, 2, 10, '#ffc2d6'), R(18, -8, 2, 11, '#ffc2d6'), E(9, 21, 1.5, 1.5, '#ffc2d6')];
    case 'kitty': return [R(6, -2, 4, 5, c), R(7, -4, 2, 2, c), R(20, -2, 4, 5, c), R(21, -4, 2, 2, c), R(7, -1, 2, 3, '#ffc2d6'), R(21, -1, 2, 3, '#ffc2d6')];
    case 'flowers': return [R(5, 6, 21, 2, '#7fd17a'), E(7, 6, 2.2, 2.2, '#ff9ec0'), E(12, 4.5, 2.2, 2.2, '#ffe36b'), E(18, 4.5, 2.2, 2.2, '#ffffff'), E(23, 6, 2.2, 2.2, '#c9a6ff'), P(12, 4, '#ff9ec0')];
    case 'crown': return [R(6, 3, 19, 4, GOLD), R(6, -2, 3, 5, '#8fe3ff'), R(11, -4, 3, 7, '#c9f2ff'), R(17, -4, 3, 7, '#8fe3ff'), R(22, -2, 3, 5, '#c9f2ff'), E(15.5, 5, 1.5, 1.5, '#ff9ec0')];
    case 'beret': return [E(14, 5, 11, 4, c), E(9, 4, 3, 2, l), R(13, 0, 2, 2, d), R(19, 3, 2, 2, GOLD), P(19, 3, '#ffffff')];
    default: return [];
  }
}

// Hats that hide the back hair (a hood or helmet wraps the whole head).
export const TUCKS_HAIR = new Set(['helmet', 'bunny']);

// Parts of a hat drawn behind the head: hoods and helmets wrap around it.
export function hatBackShapes(design, c) {
  if (design === 'bunny') return [E(15, 14, 13, 12.5, '#ffffff'), E(15, 26, 9, 3, '#ffffff')];
  if (design === 'helmet') return [E(15, 13, 12, 11, SILVER)];
  if (design === 'witch') return [R(8, 8, 16, 3, shade(c, -18))];
  return [];
}

// ---------- Gloves (on each hand) ----------

export function handShapes(hx, hy, glove, skin) {
  if (!glove) return [E(hx, hy, 2, 2, skin)];
  const c = glove.color;
  switch (glove.design) {
    case 'cuffed': return [E(hx, hy, 2.2, 2.2, c), R(hx - 2, hy - 3, 4, 1.5, shade(c, 25))];
    case 'gauntlet': return [E(hx, hy, 2.6, 2.4, SILVER), R(hx - 2, hy - 4, 4, 2, c), P(hx - 1, hy - 1, '#ffffff')];
    default: return [E(hx, hy, 2.3, 2.3, c), P(hx - 1, hy - 1, shade(c, 25))];
  }
}

// ---------- Earrings (on the visible ear, under the bangs) ----------

export function earringShapes(design, c) {
  switch (design) {
    case 'drop': return [R(6, 21, 1, 2, GOLD), E(6.5, 24.5, 1.5, 1.8, c)];
    case 'star': return [R(6, 21, 1, 2, GOLD), R(5, 24, 3, 1, c), R(6, 23, 1, 3, c), P(6, 24, '#ffffff')];
    default: return [E(6.5, 22, 1.3, 1.3, c)];
  }
}

// ---------- Capes (behind the body). `sway` bends the hem; wings flap with `flap`. ----------

export function capeShapes(design, c, sway, flap) {
  const d = shade(c, -20);
  const s = Math.round(sway);
  const h = Math.round(s / 2);
  switch (design) {
    case 'fairy': {
      const up = flap ? -2 : 1;
      return [E(3, 26 + up, 7, 9, '#c9f2ff'), E(4, 36 + up, 5, 6, '#ffd0ec'), E(6, 26 + up, 4, 6, '#e8fbff'), P(2, 24 + up, '#ffffff')];
    }
    case 'angel': {
      const up = flap ? -2 : 1;
      return [E(2, 27 + up, 8, 10, '#ffffff'), E(1, 33 + up, 6, 6, '#f3f6ff'), R(-4, 30 + up, 4, 2, '#f3f6ff'), R(-5, 34 + up, 4, 2, '#f3f6ff'), R(-3, 38 + up, 4, 2, '#f3f6ff')];
    }
    case 'starcape': return [R(9, 25, 13, 6, c), R(8 + h, 31, 15, 6, c), R(7 + s, 37, 16, 6, c), P(12 + h, 33, '#ffe36b'), P(18 + h, 35, '#ffffff'), P(11 + s, 40, '#ffffff'), P(19 + s, 41, '#ffe36b'), R(7 + s, 42, 16, 1, GOLD)];
    case 'long': return [R(9, 25, 13, 6, c), R(8 + h, 31, 15, 6, c), R(7 + s, 37, 16, 6, c), R(7 + s, 42, 16, 1, d), R(13, 25, 5, 2, GOLD)];
    case 'royal': return [R(9, 25, 13, 6, c), R(8 + h, 31, 15, 6, c), R(7 + s, 37, 16, 6, c), R(7 + s, 41, 16, 2, GOLD), R(9, 25, 13, 2, '#ffffff'), P(11, 25, INK), P(17, 25, INK)];
    default: return [R(9, 25, 13, 6, c), R(8 + h, 31, 15, 5, c), R(8 + h, 35, 15, 1, d)];
  }
}

// ---------- Weapons (pointing up, grip near the bottom) ----------

const WOOD = '#a0703f';

export function weaponShapes(type, color, tier, special) {
  const light = shade(color, 22);
  const gem = tier >= 3 ? (tier >= 6 ? '#ff9ec0' : '#8fd3ff') : null;
  switch (special ?? type) {
    case 'lollipop': return { w: 12, h: 24, grip: [5, 21], shapes: [R(5, 9, 2, 15, '#ffffff'), E(6, 5, 5.5, 5.5, '#ff9ec0'), E(6, 5, 3.5, 3.5, '#ffffff'), E(6, 5, 1.8, 1.8, '#ffb3d9'), P(4, 3, '#ffffff')] };
    case 'candycane': return { w: 11, h: 27, grip: [4, 23], shapes: [R(3, 4, 3, 18, '#ffffff'), R(3, 6, 3, 2, '#ff6b8a'), R(3, 11, 3, 2, '#ff6b8a'), R(3, 16, 3, 2, '#ff6b8a'), R(5, 1, 4, 3, '#ffffff'), R(8, 2, 2, 4, '#ff6b8a'), R(0, 21, 9, 2, GOLD), R(3, 23, 3, 4, WOOD)] };
    case 'moonstaff': return { w: 14, h: 34, grip: [6, 24], shapes: [R(6, 10, 2, 24, '#f3edff'), E(7, 5, 6, 6, '#fff3a6'), E(9, 4, 5, 5, 'none'), P(4, 2, '#ffffff'), R(4, 11, 6, 1, GOLD), E(7, 12, 1.5, 1.5, '#c9a6ff')] };
    case 'crystalbow': return { w: 11, h: 30, grip: [3, 15], shapes: [E(4, 15, 5, 14, '#8fe3ff'), E(6, 15, 4, 12, 'none'), R(8, 2, 1, 26, '#ffffff'), R(2, 13, 3, 4, '#c9f2ff'), P(2, 4, '#ffffff'), P(2, 26, '#ffffff')] };
    case 'heartdagger': return { w: 9, h: 16, grip: [4, 13], shapes: [R(3, 1, 3, 8, '#ffc2d6'), R(4, 1, 1, 7, '#ffffff'), R(1, 9, 7, 2, '#ff6b8a'), E(4.5, 10, 2, 1.5, '#ff6b8a'), R(3, 11, 3, 4, WOOD)] };
    case 'pawclaw': return { w: 12, h: 12, grip: [5, 8], shapes: [E(6, 7, 5, 4, '#ffc2d6'), E(6, 8, 2.5, 2, '#ff9ec0'), E(2.5, 3, 1.5, 1.5, '#ff9ec0'), E(6, 2, 1.5, 1.5, '#ff9ec0'), E(9.5, 3, 1.5, 1.5, '#ff9ec0')] };
    case 'sword': return { w: 9, h: 26, grip: [4, 22], shapes: [R(3, 1, 3, 17, color), R(4, 1, 1, 16, light), P(4, 0, light), R(0, 18, 9, 2, GOLD), R(3, 20, 3, 5, WOOD), E(4.5, 25, 2, 1.5, GOLD), ...(gem ? [E(4.5, 19, 1.5, 1.5, gem)] : [])] };
    case 'axe': return { w: 14, h: 26, grip: [6, 22], shapes: [R(5, 2, 3, 24, WOOD), E(10, 6, 4, 5, color), R(7, 2, 3, 8, color), P(12, 4, light), ...(gem ? [E(7, 6, 1.5, 1.5, gem)] : [])] };
    case 'spear': return { w: 9, h: 34, grip: [4, 26], shapes: [R(3, 8, 3, 26, WOOD), E(4.5, 4, 3, 5, color), R(4, 0, 1, 4, light), R(1, 9, 7, 1, GOLD), ...(gem ? [E(4.5, 10, 1.5, 1.5, gem)] : [])] };
    case 'wand': return { w: 8, h: 20, grip: [3, 16], shapes: [R(3, 6, 2, 14, WOOD), E(4, 4, 3.5, 3.5, color), P(3, 3, '#ffffff'), ...(gem ? [R(2, 7, 4, 1, GOLD)] : [])] };
    case 'staff': return { w: 10, h: 32, grip: [4, 22], shapes: [R(4, 8, 2, 24, WOOD), E(5, 5, 4.5, 4.5, color), P(4, 3, '#ffffff'), R(2, 9, 6, 1, GOLD), ...(gem ? [E(5, 5, 1.8, 1.8, gem)] : [])] };
    case 'bow': return { w: 10, h: 28, grip: [3, 14], shapes: [E(4, 14, 5, 13, color), E(6, 14, 4, 11, 'none'), R(7, 2, 1, 24, '#fff6fb'), R(2, 12, 3, 4, WOOD), ...(gem ? [P(2, 14, gem)] : [])] };
    case 'crossbow': return { w: 18, h: 16, grip: [4, 10], shapes: [R(0, 7, 16, 3, WOOD), R(12, 0, 3, 16, color), R(13, 1, 1, 14, light), R(2, 10, 3, 4, WOOD), ...(gem ? [P(7, 8, gem)] : [])] };
    case 'dagger': return { w: 7, h: 15, grip: [3, 12], shapes: [R(2, 1, 3, 8, color), R(3, 1, 1, 7, light), P(3, 0, light), R(0, 9, 7, 1, GOLD), R(2, 10, 3, 4, WOOD), ...(gem ? [P(3, 9, gem)] : [])] };
    case 'claw': return { w: 10, h: 12, grip: [4, 8], shapes: [R(1, 4, 8, 6, color), R(1, 0, 2, 5, light), R(4, 0, 2, 5, light), R(7, 0, 2, 5, light), ...(gem ? [P(5, 7, gem)] : [])] };
    default: return null;
  }
}
