// Equipment designs for the hero rig. Every slot has a look per tier, plus one-off designs for
// special items. Shapes are in body coordinates: a 30x56 anime chibi facing right, feet at y = 56.
// Sprites are soft (cel-shaded with tinted outlines), so designs are flat color blocks plus a few
// flat (F) details; shading and edges come from the renderer.
//
// Landmarks: head center (15.5, 14.6) r10 · neck y 23-27 · torso y 26-35.8 and hips y 34.6-39.6,
// shaped by the body type (see FIGURES) · legs jointed at hip (y 37.6), knee, and ankle (y 53 at rest), from x 12 (back)
// and 15.6 (front) · soles at y 56 · shoulders (11.3, 27.5) and (19.2, 27.5) · hands rest at y 36.8.

import { R, E, T, F, shade, shadowTone } from './pixel.js';

const GOLD = '#ffd66b';
const SILVER = '#dfe6f5';
const INK = '#3a2d4f';

// ---------- Body shapes ----------
//
// Two figures, facing right (front = the right side). Feminine: rounded shoulders, a bust, a
// narrow waist, and wide rounded hips and seat. Masculine: broader shoulders, a flat chest, and a
// straighter waist and hips. Each is an outline down the front (top to bottom) and up the back.

export const BODY_TYPES = ['feminine', 'masculine'];

const FIGURES = {
  feminine: {
    front: [[18.6, 26], [19.9, 26.5], [20.6, 27.6], [21.6, 28.9], [22.6, 30], [22.9, 31], [22.5, 32], [21.2, 32.7], [19.4, 33.4], [19.2, 34.4], [19.6, 35.8]],
    back: [[11.6, 35.8], [12, 34.2], [11.6, 32.6], [11, 30.8], [10.9, 28.6], [11.3, 26.9], [12.4, 26]],
    hips: [[11.6, 34.6], [19.4, 34.6], [20.6, 35.6], [21.6, 37], [21.7, 38.5], [21, 39.6], [10, 39.6], [8.9, 38.6], [9, 36.8], [10.2, 35.2]],
  },
  masculine: {
    front: [[19.8, 26], [21.2, 26.5], [21.6, 27.8], [21.4, 30.2], [20.8, 33], [20.6, 35.8]],
    back: [[10.6, 35.8], [10.4, 33], [9.8, 30.2], [9.6, 27.8], [10, 26.5], [11.4, 26]],
    hips: [[10.6, 34.6], [20.6, 34.6], [20.8, 37], [20.6, 39.6], [10.4, 39.6], [10.2, 37]],
  },
};
const figure = (body) => FIGURES[body] ?? FIGURES.feminine;
const torsoPts = (body) => [...figure(body).front, ...figure(body).back];
// Robes follow the figure to the waist, then flare past the hips.
const robePts = (body) => {
  const { front, back } = figure(body);
  return [...front.slice(0, -1), [21.6, 38], [22.2, 44.5], [8.8, 44.5], [9.6, 38], ...back.slice(1)];
};

// Where a polygon's outline crosses row y: the leftmost and rightmost x.
function rowSpan(pts, y) {
  const xs = [];
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y)) xs.push(xi + ((y - yi) * (xj - xi)) / (yj - yi));
  }
  return xs.length ? [Math.min(...xs), Math.max(...xs)] : null;
}

// A band across a shape from y0 to y1 that follows its curves (stripes, belts, hems).
function band(pts, y0, y1, c) {
  const a = rowSpan(pts, y0);
  const b = rowSpan(pts, y1);
  if (!a || !b) return null;
  return T([[a[0], y0], [a[1], y0], [b[1], y1], [b[0], y1]], c);
}

// The part of a shape left (keep < 0) or right (keep > 0) of x, for panels and side pieces.
function side(pts, x, keep, c) {
  const inside = ([px]) => (keep < 0 ? px <= x : px >= x);
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    if (inside(a)) out.push(a);
    if (inside(a) !== inside(b)) out.push([x, a[1] + ((x - a[0]) * (b[1] - a[1])) / (b[0] - a[0])]);
  }
  return T(out, c);
}

// ---------- Tops (torso part) ----------

const collar = (c) => T([[12.8, 26.2], [18.2, 26.2], [15.8, 29.2]], c);

export function topShapes(design, c, body = 'feminine') {
  const d = shade(c, -16);
  const l = shade(c, 18);
  const torso = torsoPts(body);
  const robe = robePts(body);
  // A soft crease under the bust.
  const curves = (col) => (body === 'feminine' ? [F(T([[19.6, 32.8], [22.4, 32.1], [22.2, 32.7], [19.8, 33.4]], shade(col, -16)))] : []);
  const parts = (() => {
    switch (design) {
      case 'stripes': return [T(torso, c), band(torso, 29.2, 30.3, d), band(torso, 31.6, 32.6, d), band(torso, 34, 35.1, d), collar(l), ...curves(c)];
      case 'vest': return [T(torso, '#fff6ec'), side(torso, 14, -1, c), side(torso, 17.2, 1, c), band(torso, 32.9, 34.6, '#7a5238'), F(E(15.6, 33.7, 0.9, 0.8, GOLD)), ...curves(c)];
      case 'plate': return [T(torso, SILVER), T([[12.6, 28], [18.6, 28], [17.8, 32.5], [15.6, 34], [13.4, 32.5]], c), F(E(14.4, 29.6, 0.8, 0.8, '#ffffff')), band(torso, 33.6, 35.4, shade(SILVER, -18)), E(10.8, 27.6, 2.4, 2, l), E(20.2, 27.6, 2.4, 2, l)];
      case 'starrobe': return [T(robe, c), band(robe, 26.2, 27.2, GOLD), F(R(15.2, 29.4, 0.9, 3, GOLD)), F(R(14.2, 30.4, 2.9, 0.9, GOLD)), band(robe, 43.4, 44.5, GOLD), F(E(12.5, 40, 0.6, 0.6, '#ffffff')), F(E(18.4, 38.5, 0.6, 0.6, GOLD)), ...curves(c)];
      case 'celestial': return [T(robe, c), band(robe, 33, 44.5, l), band(robe, 26.2, 27.2, GOLD), R(15.2, 26.5, 1, 18, GOLD), F(E(13.3, 30, 1.2, 1.6, '#ffffff')), F(E(18, 30, 1.2, 1.6, '#ffffff')), band(robe, 43.4, 44.5, GOLD), ...curves(c)];
      case 'kimono': return [T(robe, c), T([[12.4, 26.4], [15, 26.4], [17.8, 32]], '#ffffff'), T([[14, 26.4], [16, 26.4], [17.8, 31]], l), band(robe, 32, 34.6, '#ff6b9a'), F(E(18, 33.3, 0.8, 0.8, GOLD)), F(E(12, 38, 0.7, 0.7, '#ffffff')), F(E(19, 41, 0.7, 0.7, '#ffffff')), ...curves(c)];
      case 'sailor': return [T(torso, '#ffffff'), T([[11, 26.2], [20.2, 26.2], [20.6, 28.6], [15.6, 31.2], [10.6, 28.6]], c), F(T([[14.2, 29.8], [17, 29.8], [16.4, 32.6], [15.6, 31.6], [14.8, 32.6]], '#ff6b8a')), band(torso, 33.6, 35.8, c), ...curves('#ffffff')];
      case 'hoodie': return [T(torso, c), T([[11.4, 25.8], [19.6, 25.8], [18.6, 28.2], [12.4, 28.2]], d), R(12.6, 31.6, 6, 2.8, d), F(R(13.6, 27.6, 0.6, 3.2, '#ffffff')), F(R(17, 27.6, 0.6, 3.2, '#ffffff')), ...curves(c)];
      default: return [T(torso, c), collar(l), band(torso, 34.4, 35.8, d), ...curves(c)];
    }
  })();
  return parts.filter(Boolean);
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

export function hipShapes(look, body = 'feminine') {
  return [T(figure(body).hips, look.top)];
}

export function skirtShapes(design, c) {
  if (design === 'starskirt') return [T([[10.6, 34.4], [20, 34.4], [21.4, 36.4], [22.6, 41.6], [8.2, 41.6], [9.4, 36.4]], c), R(8.9, 40.6, 13, 1, GOLD), F(E(12, 38, 0.6, 0.6, GOLD)), F(E(17.5, 37, 0.6, 0.6, GOLD)), F(E(20, 39.4, 0.6, 0.6, '#ffffff'))];
  if (design === 'celestialskirt') return [T([[10.6, 34.4], [20, 34.4], [22.6, 46.6], [8.2, 46.6]], c), R(8.3, 45.4, 14.2, 1.2, GOLD), T([[15, 34.4], [16.2, 34.4], [16.6, 45.4], [14.6, 45.4]], shade(c, 18))];
  return null;
}

// ---------- Limbs ----------

// A tapered limb from (x1, y1) to (x2, y2), w1 wide at the start and w2 at the end.
export function limb(x1, y1, x2, y2, w1, w2, c) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  return T([[x1 + (nx * w1) / 2, y1 + (ny * w1) / 2], [x2 + (nx * w2) / 2, y2 + (ny * w2) / 2], [x2 - (nx * w2) / 2, y2 - (ny * w2) / 2], [x1 - (nx * w1) / 2, y1 - (ny * w1) / 2]], c);
}

// Two-bone reach: the middle joint for a limb of lengths a and b from root to target. The
// target is pulled in if it's out of reach. bend = 1 puts the joint ahead of the line (knees),
// -1 behind it (elbows). Returns [joint, end].
export function reach(rx, ry, tx, ty, a, b, bend) {
  let dx = tx - rx;
  let dy = ty - ry;
  let d = Math.hypot(dx, dy) || 0.001;
  const max = a + b - 0.001;
  if (d > max) {
    dx *= max / d;
    dy *= max / d;
    d = max;
  }
  const ux = dx / d;
  const uy = dy / d;
  const along = (a * a - b * b + d * d) / (2 * d);
  const off = Math.sqrt(Math.max(0, a * a - along * along)) * bend;
  return [[rx + ux * along + uy * off, ry + uy * along - ux * off], [rx + dx, ry + dy]];
}

// ---------- Legs with shoes (one leg; the back leg is drawn in the shadow tone) ----------

export const THIGH = 7.8;
export const SHIN = 7.6;
export const HIP_Y = 37.6;
export const ANKLE_Y = 53;

// x is the leg's left edge at rest. foot = [dx, dy, angle]: the ankle's offset from its rest spot
// under the hip, and the foot's tilt in degrees (positive lifts the toe). hipY moves the hip.
export function legShapes(x, look, shoe, back, foot = [0, 0, 0], hipY = HIP_Y) {
  const tint = (c) => (back ? shadowTone(c) : c);
  const top = tint(look.top);
  const low = tint(look.low);
  const hx = x + 1.5;
  const [[kx, ky], [ax, ay]] = reach(hx, hipY, hx + foot[0], ANKLE_Y + foot[1], THIGH, SHIN, 1);
  const shapes = [
    limb(hx, hipY, kx, ky, 3.1, 2.6, top),
    E(kx, ky, 1.3, 1.3, top),
    limb(kx, ky, ax, ay, 2.6, 2.1, low),
  ];
  if (look.pad) shapes.push(E(kx + 0.3, ky, 1.7, 1.4, tint(look.pad)));
  shapes.push(...shoeShapes(ax, ay, kx, ky, foot[2] ?? 0, shoe, tint));
  return shapes;
}

// Shoes are drawn in the foot's frame (origin at the ankle, x toward the toe, y down to the sole)
// and turned by the foot's tilt; boot shafts run up the shin toward the knee.
function shoeShapes(ax, ay, kx, ky, tilt, shoe, tint) {
  const c = tint(shoe.color);
  const rad = (tilt * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const at = ([x, y]) => [ax + x * cos + y * sin, ay - x * sin + y * cos];
  const poly = (pts, col) => T(pts.map(at), col);
  const dot = (x, y, r, col) => {
    const [px, py] = at([x, y]);
    return F(E(px, py, r, r, col));
  };
  const len = Math.hypot(kx - ax, ky - ay) || 1;
  const shaft = (h, col, w = 2.8) => limb(ax, ay, ax + ((kx - ax) / len) * h, ay + ((ky - ay) / len) * h, w, w, col);
  const sole = (col) => poly([[-1.6, -1.2], [1.2, -1.2], [1.8, 0.4], [3.4, 1.2], [3.6, 3], [-1.9, 3], [-2, 0.8]], col);
  switch (shoe.design) {
    case 'boots': return [shaft(3.4, c), sole(c), shaft(0.9, shade(c, 18), 3.1)];
    case 'leatherboots': return [shaft(4.6, c), sole(c), shaft(1.2, shade(c, -18), 3.1), dot(0.6, -0.4, 0.5, GOLD)];
    case 'sabatons': return [shaft(3, tint(SILVER)), sole(tint(SILVER)), poly([[-1.9, 2], [3.5, 2], [3.6, 3], [-1.9, 3]], tint(shade(SILVER, -14))), dot(0.4, 0, 0.6, '#ffffff')];
    case 'starboots': return [shaft(3.4, c), sole(c), shaft(0.8, GOLD, 3.1), dot(0.8, 0.6, 0.8, GOLD)];
    case 'wingboots': return [shaft(2.4, c), sole(c), poly([[-1.6, -1], [-4.8, -2.8], [-3.8, -0.6], [-4.6, 0.6], [-1.6, 0.6]], '#ffffff')];
    default: return [sole(c), poly([[-1.9, 2.2], [3.6, 2.2], [3.6, 3], [-1.9, 3]], shade(c, -18))];
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

