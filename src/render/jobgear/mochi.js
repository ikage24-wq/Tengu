// The Wagashi Sprites' outfits (the Mochi redraw, 2026-11-09): little spirits born from fresh-pounded
// mochi who grow into the sweet they eat most. Drawn on the hero's body like the starter outfits
// (pets.js hands them on) and never offered in the creator. Every one wears a soft mochi hood with
// a leaf sprig on top (the sprig acts out their mood: render/mochi.js); each grown form is a sweet:
//   mochibaby    a plain white daifuku hood, a cream smock with a red-bean button, bloomers, booties
//   mochidango   (dash) a pink hood run through with a skewer of three dango (pink, white, green); a
//                green running happi, a white sash with long tails, striped shorts, split-toe runners
//   mochiwarabi  (swim) a clear jelly hood, soft-square like a warabi cube, kinako dusted on top, a
//                dark syrup drip down one side and a little koi swimming inside; a kinako swim
//                tunic with a wave hem and a syrup sash, jade shorts, zori
//   mochisakura  (glide) a pink hood wrapped in a big cherry leaf, a blossom for a sprig; a short
//                pink kimono, a folded leaf shawl on the back (it opens into gliding wings), geta
//   mochikagami  (might) a two-tier mochi helm topped with an orange and its leaf, a paper streamer
//                at the side; a white keiko top, a red sumo apron with a gold fringe under a twisted
//                rope, straw sandals
//   mochimonaka  (stamina) a crisp wafer-shell hood with a crimped rim, a plum blossom pressed into
//                it and red-bean filling at the seam; wafer chest armour, shoulder shells and
//                tassets over a red-bean shirt, sturdy boots
// Hood shapes are the face hole's crescent (`hat`) over the hood's back and cowl (`hatBack`); the
// hood tucks the hair away, so only each one's own fringe (hair.js MOCHI_HAIR) shows.

import { R, E, T, F, shade, mix } from '../pixel.js';
import { torsoPts, MID, limb } from '../figure.js';

const TORSO = torsoPts();
const rad = (a) => (a * Math.PI) / 180;
// Points along an ellipse from angle a0 to a1 (degrees, 0 = right, 90 = up).
function arcPts(cx, cy, rx, ry, a0, a1, n = 18) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = rad(a0 + ((a1 - a0) * i) / n);
    return [cx + Math.cos(a) * rx, cy - Math.sin(a) * ry];
  });
}
// The same along a soft square (a warabi cube's rounded corners).
function squarc(cx, cy, rx, ry, a0, a1, n = 26) {
  const sq = (v) => Math.sign(v) * Math.abs(v) ** 0.6;
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = rad(a0 + ((a1 - a0) * i) / n);
    return [cx + sq(Math.cos(a)) * rx, cy - sq(Math.sin(a)) * ry];
  });
}
const crescent = (o, inner, a0, a1, c) => T([...arcPts(...o, a0, a1), ...arcPts(...inner, a1, a0)], c);
const dots = (list, r, c) => list.map(([x, y]) => F(E(x, y, r, r, c)));
// A leaf along a spine from (x0, y0) to its tip, `w` at its widest.
function leafPts(x0, y0, x1, y1, w) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy) || 1;
  const [nx, ny] = [-dy / l, dx / l];
  const at = (t, o) => [x0 + dx * t + nx * o, y0 + dy * t + ny * o];
  return [[x0, y0], at(0.28, w * 0.85), at(0.62, w * 0.8), [x1, y1], at(0.62, -w * 0.8), at(0.28, -w * 0.85)];
}
const leaf = (x0, y0, x1, y1, w, c, vein) => [T(leafPts(x0, y0, x1, y1, w), c), F(limb(x0, y0, x0 + (x1 - x0) * 0.8, y0 + (y1 - y0) * 0.8, 0.22, 0.12, vein))];
// A ribbon along a spine, tapering, its end cut in a notch.
function ribbon(spine, w, c) {
  const side = (s) => spine.map(([x, y], i) => {
    const [ax, ay] = spine[Math.max(0, i - 1)];
    const [bx, by] = spine[Math.min(spine.length - 1, i + 1)];
    const l = Math.hypot(bx - ax, by - ay) || 1;
    const k = w * (1 - (0.25 * i) / spine.length) * s;
    return [x - ((by - ay) / l) * k, y + ((bx - ax) / l) * k];
  });
  const a = side(1);
  const b = side(-1);
  const [ex, ey] = spine[spine.length - 1];
  const [px, py] = spine[spine.length - 2];
  return T([...a, [ex - (ex - px) * 0.25, ey - (ey - py) * 0.25], ...b.reverse()], c);
}

// ---------- The hood ----------
// The hood's outline, its face hole, and the rim just round the hole.
const HOOD = [15.5, 12.6, 14.2, 13.4];
const OPEN = [15.5, 16.2, 9.9, 9.1];
const RIM = [15.5, 16.2, 10.9, 10.1];
const hoodFront = (c, rim) => [crescent(HOOD, OPEN, -42, 222, c), F(crescent(RIM, OPEN, -40, 220, rim))];
// Its back behind the head and the cowl over the shoulders; the cowl's hem sways a touch.
function hoodBack(c, m) {
  const s = (m?.sway ?? 0) * 0.3;
  return [E(15.5, 12.8, 14, 13.2, c), T([[4.2, 18.6], [26.8, 18.6], [24.2 + s, 25.8], [15.5 + s, 27.2], [6.8 + s, 25.8]], c)];
}
// The soft light along the top of the dough.
const sheen = (c) => F(crescent([15.5, 12.4, 12.8, 12.2], [15.5, 13.6, 12.6, 11.6], 104, 156, c));
// The sprig: a stem and two leaves, swinging a beat behind the head. (Its mood poses come later.)
const LEAF = '#86c96e';
const LEAF_DK = '#4f8f45';
function sprig(x, y, m, c = LEAF, dk = LEAF_DK) {
  const s = (m?.hair ?? 0) * 0.6;
  const [tx, ty] = [x + 0.4 + s, y - 3];
  return [F(limb(x, y, tx, ty, 0.55, 0.42, dk)),
    ...leaf(tx, ty + 0.3, tx + 3.6 + s * 0.4, ty - 1.6, 1.25, c, dk), ...leaf(tx, ty + 0.3, tx - 3.2 + s * 0.4, ty - 0.9, 1.1, shade(c, -8), dk)];
}

// The hood's outline cut into five round lobes, like a plum-blossom wafer (a lobe centred on top).
function lobed(a0, a1, n = 60) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    const k = 0.83 + 0.17 * Math.abs(Math.cos(rad(a - 90) * 2.5)) ** 0.55;
    return [HOOD[0] + Math.cos(rad(a)) * HOOD[2] * k, HOOD[1] - Math.sin(rad(a)) * HOOD[3] * k];
  });
}

// ---------- Shared clothes ----------
// A top to the hem (y), in one colour with a trim along it.
const tunic = (main, trim, hem = 36) => [T([...TORSO.slice(0, 6), [22.4, hem], [8.8, hem], ...TORSO.slice(8)], main), F(R(8.8, hem - 1.4, 13.6, 1.4, trim))];
// Short puffy bottoms to the thigh.
const puffs = (c, line) => [T([[8.8, 34.4], [22.4, 34.4], [23, 41.6], [16.6, 41.6], [15.6, 38.6], [14.6, 41.6], [8.2, 41.6]], c), F(limb(15.6, 35.6, 15.6, 38.4, 0.35, 0.35, line))];
const bareLegs = (p, skin) => ({ top: skin, low: skin, pad: null });

// ---------- Colours ----------
const DOUGH = '#fffaf4';
const DOUGH_RIM = '#f1e4d8';
const DOUGH_BK = '#ece0d4';
const BEAN = '#8a3a48';
const DANGO_PINK = '#ffc4d6';
const DANGO_GREEN = '#86d39a';
const STICK = '#d9b27a';
const JELLY = '#cfeadf';
const KINAKO = '#e2c58e';
const KINAKO_DK = '#b8955a';
const SYRUP = '#5a3320';
const SAKURA = '#ffb6c9';
const SAKURA_LEAF = '#8cbf6e';
const SAKURA_VEIN = '#5f8f4c';
const KIMONO = '#ffd0dc';
const KAGAMI_RED = '#d8402c';
const ORANGE = '#ff9a2e';
const GOLD = '#f2c94c';
const WAFER = '#e8bb78';
const WAFER_LT = '#f8d9a0';
const WAFER_DK = '#c08a48';
const ANKO = '#7a3442';
const ANKO_DK = '#5a2432';

// A dango on the skewer, with its shine.
const dango = (x, y, c) => [E(x, y, 3, 2.9, c), F(E(x - 1, y - 1, 1, 0.7, mix(c, '#ffffff', 0.6)))];
// A cherry blossom: five notched petals round a pink heart.
function blossom(x, y, r = 1.6) {
  const petals = [0, 72, 144, 216, 288].map((a) => {
    const [cx, cy] = [x + Math.cos(rad(a - 90)) * r, y + Math.sin(rad(a - 90)) * r];
    const [ox, oy] = [Math.cos(rad(a - 90)), Math.sin(rad(a - 90))];
    const [nx, ny] = [-oy, ox];
    const w = r * 0.62;
    return T([[x, y], [cx + nx * w, cy + ny * w], [cx + ox * w * 0.9 + nx * w * 0.4, cy + oy * w * 0.9 + ny * w * 0.4], [cx + ox * w * 0.5, cy + oy * w * 0.5],
      [cx + ox * w * 0.9 - nx * w * 0.4, cy + oy * w * 0.9 - ny * w * 0.4], [cx - nx * w, cy - ny * w]], '#ffe0ea');
  });
  return [...petals, F(E(x, y, r * 0.38, r * 0.38, '#ff7fa6'))];
}
// Seigaiha waves along a hem: a row of little arcs.
const waves = (x0, x1, y, c) => {
  const out = [];
  for (let x = x0 + 1.4; x < x1 - 0.6; x += 2.8) out.push(F(crescent([x, y, 1.4, 1.3], [x, y + 0.1, 0.8, 0.7], 0, 180, c)));
  return out;
};

export const MOCHI_OUTFITS = {
  // ---------- The smock every Mochi wears: no hat, in its rolled colour ----------
  mochismock: {
    top: (p) => [...tunic(p.main, '#ffffff', 36.4),
      T([[11.4, 25.8], [19.8, 25.8], [18.8, 28.6], [15.6, 29.6], [12.4, 28.6]], '#ffffff'), F(limb(12.4, 28.6, 18.8, 28.6, 0.3, 0.3, shade(p.main, -18))),
      F(limb(12.4, 30.4, 12, 35, 0.3, 0.3, shade(p.main, -12))), F(limb(18.8, 30.4, 19.2, 35, 0.3, 0.3, shade(p.main, -12))),
      F(E(MID, 31.6, 1.35, 1, BEAN)), F(E(MID - 0.4, 31.3, 0.45, 0.25, '#c06a78'))],
    sleeve: (p) => p.main,
    long: true,
    shoulder: (p, side) => [E(0, 1, 3, 2.6, side > 0 ? p.main : shade(p.main, -10))],
    legs: bareLegs,
    skirt: () => puffs('#fffaf6', '#efe2d8'),
    shoe: (p, k, c) => [k.poly([[-2.6, -1.2], [2.8, -1.2], [3.2, 2.6], [-2.8, 2.6]], c('#fffaf6')), k.poly([[-2.8, 1.7], [3.2, 1.7], [3.2, 2.6], [-2.8, 2.6]], c(shade(p.main, -14)))],
  },
  // ---------- The hoods below are dress-up now (the player puts them on) ----------
  // ---------- Baby: what every Mochi hatches in ----------
  mochibaby: {
    tucks: true,
    hat: (p, m) => [...hoodFront(DOUGH, DOUGH_RIM), sheen('#ffffff'), ...sprig(15.9, -0.4, m)],
    hatBack: (p, m) => hoodBack(DOUGH_BK, m),
    top: () => [...tunic('#ffdfe6', '#ffffff', 36.4),
      T([[11.4, 25.8], [19.8, 25.8], [18.8, 28.6], [15.6, 29.6], [12.4, 28.6]], '#ffffff'), F(limb(12.4, 28.6, 18.8, 28.6, 0.3, 0.3, '#ffb8c8')),
      F(limb(12.4, 30.4, 12, 35, 0.3, 0.3, '#f5c4cf')), F(limb(18.8, 30.4, 19.2, 35, 0.3, 0.3, '#f5c4cf')),
      F(E(MID, 31.6, 1.35, 1, BEAN)), F(E(MID - 0.4, 31.3, 0.45, 0.25, '#c06a78'))],
    sleeve: () => '#ffdfe6',
    long: true,
    shoulder: (p, side) => [E(0, 1, 3, 2.6, side > 0 ? '#ffdfe6' : '#f5c4cf')],
    legs: bareLegs,
    skirt: () => puffs('#fff4ea', '#efdccd'),
    shoe: (p, k, c) => [k.poly([[-2.6, -1.2], [2.8, -1.2], [3.2, 2.6], [-2.8, 2.6]], c('#fffaf6')), k.poly([[-2.8, 1.7], [3.2, 1.7], [3.2, 2.6], [-2.8, 2.6]], c('#ffc2d2'))],
  },

  // ---------- Dango Runner (dash) ----------
  mochidango: {
    tucks: true,
    hat: (p, m) => [...hoodFront(DANGO_PINK, '#ffe6ee'), sheen('#ffe2ec'), ...dots([[8.6, 3.8], [21.6, 2.8], [5.4, 9.4], [26.2, 10.2]], 0.35, '#ffffff'),
      F(limb(21, 2.4, 23.6, -0.2, 0.45, 0.32, STICK)), ...sprig(18.4, -0.5, m)],
    // The skewer runs back out of the top of the hood: pink, white, green, like a hairpin.
    hatBack: (p, m) => {
      const s = (m?.hair ?? 0) * 0.25;
      return [...hoodBack(shade(DANGO_PINK, -10), m), F(limb(16, 1, 2.8 + s, -11.2 + s, 0.5, 0.42, STICK)),
        ...dango(5.6 + s * 0.8, -8.6 + s * 0.8, '#ff8fb4'), ...dango(9.7 + s * 0.5, -4.8 + s * 0.5, '#fffaf2'), ...dango(13.8 + s * 0.2, -1 + s * 0.2, '#9fd889')];
    },
    top: () => [...tunic(DANGO_GREEN, '#ffffff', 35.6),
      F(limb(MID - 3.4, 25.8, MID + 0.2, 31.4, 0.75, 0.6, '#ffffff')), F(limb(MID + 3.4, 25.8, MID + 0.2, 31.4, 0.75, 0.6, '#ffffff')),
      F(E(19.6, 30.2, 1.6, 1.6, '#ffffff')), ...dots([[19, 29.8], [20.2, 29.8], [19.6, 30.9]], 0.45, '#ff9fbf'),
      F(R(8.8, 33.2, 13.6, 1.6, '#ff7fa6')), F(E(9.4, 34, 1.4, 1.2, '#ff7fa6'))],
    sleeve: () => DANGO_GREEN,
    shoulder: (p, side) => [E(0, 1, 2.8, 2.5, side > 0 ? DANGO_GREEN : '#6cbc82'), F(limb(-2.4, 2.4, 2.4, 2.4, 0.4, 0.4, '#ffffff'))],
    legs: bareLegs,
    skirt: () => [...puffs('#3f8a56', '#2f6e44'), F(limb(22, 35, 22.6, 41.2, 0.4, 0.4, '#ffffff'))],
    // The sash's two long tails, streaming behind.
    back: (p, m) => {
      const s = m?.sway ?? 0;
      return [ribbon([[9.2, 34.4], [6.4, 36.6 + s * 0.2], [3.8, 38.4 + s * 0.5], [1.4, 40.8 + s]], 0.7, '#e8608a'), ribbon([[9.2, 34], [6, 35.2], [3, 35.6 + s * 0.4], [0, 36.8 + s]], 0.75, '#ff7fa6')];
    },
    shoe: (p, k, c) => [k.sole(c('#ff9fbf')), k.poly([[-2.8, -0.8], [2.8, -0.8], [3, 1.6], [-2.8, 1.6]], c('#ffffff')), k.poly([[1.3, -0.6], [1.7, -0.6], [1.7, 1.6], [1.3, 1.6]], c('#d8d0c8'))],
  },

  // ---------- Warabi (swim) ----------
  mochiwarabi: {
    tucks: true,
    hat: (p, m) => [
      T([...squarc(15.5, 12.6, 13.8, 13, -40, 220), ...arcPts(...OPEN, 220, -40)], JELLY),
      F(crescent(RIM, OPEN, -38, 218, '#e8f7f0')),
      // A little koi, seen through the jelly at the back.
      F(E(5.8, 10.4, 1.9, 1, mix('#ff8a4c', JELLY, 0.35))), F(T([[4, 10.4], [2.6, 9.2], [2.8, 11.6]], mix('#ff8a4c', JELLY, 0.35))), F(E(6.4, 10, 0.7, 0.45, mix('#ffffff', JELLY, 0.3))),
      // Kinako dusted over the top, a few grains darker.
      T([...squarc(15.5, 12.6, 13.8, 13, 38, 142), ...squarc(15.5, 14.4, 12.4, 10.8, 138, 42, 18).map(([x, y], i) => [x, y - 0.7 * Math.abs(Math.sin(i * 1.3))])], KINAKO),
      ...dots([[9.6, 1.6], [14.6, 0.4], [20.8, 1.2], [17.6, 2.2], [6.6, 4], [11.8, 3]], 0.3, KINAKO_DK), ...dots([[12.2, 5.4], [19.4, 5], [8, 6.6]], 0.3, KINAKO),
      // A drip of dark syrup down the near side, ending in a drop.
      F(limb(24.4, 3.6, 26.6, 7.4, 0.9, 0.7, SYRUP)), F(limb(26.6, 7.4, 26.8, 11.6, 0.7, 0.55, SYRUP)), F(E(26.8, 12.4, 0.9, 1.1, SYRUP)), F(E(26.5, 12.1, 0.3, 0.35, '#a0704c')),
      // The glassy shine.
      F(crescent([15.5, 13.2, 12.4, 11.6], [15.5, 13.8, 12.2, 11.2], 112, 150, '#ffffff')), F(E(4.8, 15.4, 0.7, 1.4, '#ffffff')),
      ...sprig(14.8, 0, m, '#7fd3a8', '#3f9a6e'),
    ],
    hatBack: (p, m) => [T(squarc(15.5, 12.8, 13.6, 12.8, 0, 360), shade(JELLY, -10)), T([[4.2, 18.6], [26.8, 18.6], [24.2, 25.8], [15.5, 27.2], [6.8, 25.8]], shade(JELLY, -10))],
    top: () => [...tunic(KINAKO, '#fff1c8', 35.4), ...waves(8.8, 22.4, 34.6, KINAKO_DK), F(R(8.8, 31.4, 13.6, 1.7, SYRUP)), F(E(20.8, 32.2, 1.3, 1.1, SYRUP)), F(limb(20.8, 32.6, 21.6, 34.6, 0.4, 0.3, SYRUP))],
    sleeve: (p) => p.skin,
    shoulder: () => [],
    legs: bareLegs,
    skirt: () => [...puffs('#8fcfb4', '#6fb398'), F(limb(9, 37.6, 22.4, 37.6, 0.35, 0.35, '#e8f7f0'))],
    shoe: (p, k, c) => [k.poly([[-2.4, -1], [2.6, -1], [3, 1.8], [-2.4, 1.8]], c(p.skin)), k.poly([[-2.8, 1.8], [3.2, 1.8], [3.2, 2.8], [-2.8, 2.8]], c(SYRUP)),
      k.poly([[0.6, -0.6], [1.3, -0.6], [1.7, 1.8], [0.4, 1.8]], c(KINAKO))],
  },

  // ---------- Sakura (glide) ----------
  mochisakura: {
    tucks: true,
    hat: (p, m) => [...hoodFront(SAKURA, '#ffe0e8'), ...dots([[19.4, 2.6], [23.6, 5.6], [26.4, 11], [21.8, 1.4]], 0.4, '#ffd8e2'),
      // The cherry leaf wrapped round the back of the hood, its tip over the top, its veins.
      crescent([15.5, 12.6, 14.9, 14.1], [15.5, 12.6, 10.6, 9.8], 94, 214, SAKURA_LEAF), F(T([[14.6, -1.2], [17.8, -2.6], [15.2, 2.8]], SAKURA_LEAF)),
      F(crescent([15.5, 12.6, 12.8, 12], [15.5, 12.6, 12.4, 11.6], 96, 210, SAKURA_VEIN)),
      ...[120, 145, 170, 195].map((a) => { const [x0, y0] = arcPts(15.5, 12.6, 12.6, 11.8, a, a, 1)[0]; const [x1, y1] = arcPts(15.5, 12.6, 14.4, 13.6, a + 8, a + 8, 1)[0]; return F(limb(x0, y0, x1, y1, 0.22, 0.12, SAKURA_VEIN)); }),
      ...blossomOnStem(19.4, 0.2, m)],
    hatBack: (p, m) => hoodBack(shade(SAKURA, -10), m),
    top: () => [...tunic(KIMONO, '#ffffff', 36),
      T([[MID - 3.2, 25.6], [MID - 1.6, 25.6], [MID + 1.2, 30.4], [MID + 0.2, 31.2]], '#ffffff'), T([[MID + 3.2, 25.6], [MID + 1.8, 25.6], [MID - 0.6, 30.6], [MID + 0.4, 31.2]], '#ffe8ee'),
      F(R(8.8, 31.4, 13.6, 2.8, SAKURA_LEAF)), F(limb(8.8, 32.8, 22.4, 32.8, 0.35, 0.35, '#ff7fa6')), F(E(20.4, 32.8, 0.9, 0.9, '#ff7fa6'))],
    sleeve: () => KIMONO,
    long: true,
    shoulder: (p, side) => [E(0, 1, 3, 2.6, side > 0 ? KIMONO : '#f2b8c8')],
    legs: bareLegs,
    skirt: () => [T([[8.8, 35], [22.4, 35], [23.6, 42.6], [7.6, 42.6]], KIMONO), F(R(7.6, 41.6, 16, 1, '#ffffff')), ...[[11.4, 39.2], [17.8, 38.2], [21.2, 40.4]].flatMap(([x, y]) => blossom(x, y, 0.9))],
    // The leaf shawl, folded on the back.
    back: (p, m) => {
      const s = (m?.sway ?? 0) * 0.6;
      return [...leaf(12.4, 25.6, 7.4 + s, 39.4, 3.2, shade(SAKURA_LEAF, -10), SAKURA_VEIN), ...leaf(10.8, 25.2, 4.2 + s, 37.6, 3.4, SAKURA_LEAF, SAKURA_VEIN)];
    },
    shoe: (p, k, c) => [k.poly([[-2.6, -1], [2.8, -1], [3, 1.8], [-2.6, 1.8]], c('#ffffff')), k.poly([[-2.6, 1.8], [3, 1.8], [2.6, 3], [-2.2, 3]], c('#c98a5a')), k.poly([[0.6, -0.6], [1.2, -0.6], [1.2, 1.2], [0.6, 1.2]], c('#ff7fa6'))],
  },

  // ---------- Kagami (might) ----------
  mochikagami: {
    tucks: true,
    hat: (p, m) => {
      const s = (m?.hair ?? 0) * 0.5;
      return [...hoodFront(DOUGH, DOUGH_RIM), sheen('#ffffff'),
        // The second, smaller mochi stacked on top, and the orange on that.
        E(15.5, -1.4, 9.6, 4.6, DOUGH), F(crescent([15.5, -1.4, 9.6, 4.6], [15.5, -2.2, 9.4, 4.2], 200, 340, DOUGH_RIM)), F(crescent([15.5, -1.6, 8.6, 3.8], [15.5, -1.2, 8.6, 3.6], 110, 150, '#ffffff')),
        E(15.5, -7, 3.9, 3.5, ORANGE), F(E(14.2, -8.2, 1.2, 0.8, '#ffc27a')), F(E(15.9, -10.2, 0.5, 0.4, '#a85a1a')),
        ...leaf(16, -10.2, 19.6 + s, -12.4 + s * 0.3, 1.3, LEAF, LEAF_DK),
        // A paper streamer, folded in steps, hanging at the near side.
        F(limb(26.6, 6.6, 29.2, 8.2, 0.35, 0.35, KAGAMI_RED)),
        T([[28.2, 8], [30.2, 8], [30.2, 10.6], [31.6, 10.6], [31.6, 13.2], [30.2, 13.2], [30.2, 15.8], [31.6, 15.8], [31.6, 18.6], [29.6, 18.6], [29.6, 16], [28.2, 16], [28.2, 13.4], [29.6, 13.4], [29.6, 10.8], [28.2, 10.8]], '#ffffff')];
    },
    hatBack: (p, m) => hoodBack(DOUGH_BK, m),
    top: () => [...tunic('#fbf7f0', KAGAMI_RED, 35.8),
      T([[MID - 3.2, 25.6], [MID - 1.8, 25.6], [MID + 1.2, 30.6], [MID + 0.2, 31.4]], KAGAMI_RED), T([[MID + 3.2, 25.6], [MID + 1.8, 25.6], [MID - 0.6, 30.8], [MID + 0.4, 31.4]], '#b83020')],
    sleeve: () => '#fbf7f0',
    shoulder: (p, side) => [E(0, 1, 3.4, 3, side > 0 ? '#fbf7f0' : '#e6ddd0'), F(limb(-2.8, 2.8, 2.8, 2.8, 0.45, 0.45, KAGAMI_RED))],
    legs: bareLegs,
    skirt: () => [...puffs('#34405e', '#26304a'),
      // The sumo apron, its gold edges and fringe, an orange crest.
      T([[11.2, 34.6], [19.8, 34.6], [20.6, 43.4], [10.4, 43.4]], KAGAMI_RED), F(limb(11.2, 34.8, 10.4, 43.2, 0.4, 0.4, GOLD)), F(limb(19.8, 34.8, 20.6, 43.2, 0.4, 0.4, GOLD)),
      F(R(10.4, 43, 10.2, 1, GOLD)), ...[10.9, 12.1, 13.3, 14.5, 15.7, 16.9, 18.1, 19.3].map((x) => F(R(x, 43.8, 0.5, 1.3, GOLD))),
      F(E(15.5, 38.8, 2.2, 2.1, ORANGE)), F(E(14.9, 38.2, 0.7, 0.5, '#ffc27a')),
      // The twisted rope over it.
      F(limb(8.6, 34.4, 22.6, 34.4, 1.1, 1.1, '#ffffff')), ...[9.6, 11.4, 13.2, 15, 16.8, 18.6, 20.4].map((x) => F(limb(x, 33.6, x + 1, 35.2, 0.25, 0.25, '#d8d0c2')))],
    shoe: (p, k, c) => [k.poly([[-2.4, -1], [2.6, -1], [3, 1.8], [-2.4, 1.8]], c(p.skin)), k.poly([[-2.8, 1.8], [3.2, 1.8], [3.2, 2.8], [-2.8, 2.8]], c('#d8b878')),
      k.poly([[-0.4, -0.6], [0.4, -0.6], [1.6, 1.8], [0.8, 1.8]], c('#a8884e'))],
  },

  // ---------- Monaka (stamina) ----------
  mochimonaka: {
    tucks: true,
    hat: (p, m) => [
      // The filling first, then the shell over it: it shows only in the notches between the lobes.
      T([...arcPts(HOOD[0], HOOD[1], HOOD[2] * 0.93, HOOD[3] * 0.93, -42, 222, 30), ...arcPts(...OPEN, 222, -42)], ANKO),
      T([...lobed(-42, 222), ...arcPts(...OPEN, 222, -42)], WAFER), F(crescent(RIM, OPEN, -40, 220, WAFER_LT)),
      // A groove down the middle of each lobe, and the light on the upper lobes.
      ...[90, 18, 162].map((a) => { const [x0, y0] = arcPts(15.5, 16.2, 11.6, 10.8, a, a, 1)[0]; const [x1, y1] = arcPts(...HOOD, a, a, 1)[0]; return F(limb(x0, y0, x0 + (x1 - x0) * 0.75, y0 + (y1 - y0) * 0.75, 0.32, 0.22, WAFER_DK)); }),
      F(crescent([15.5, 12.6, 12.8, 12.2], [15.5, 13.6, 12.6, 11.6], 112, 150, WAFER_LT)),
      ...[0, 72, 144, 216, 288].map((a) => F(E(21.4 + Math.cos(rad(a - 90)) * 1.3, 5.2 + Math.sin(rad(a - 90)) * 1.3, 0.95, 0.95, WAFER_DK))), F(E(21.4, 5.2, 0.6, 0.6, WAFER_LT)),
      ...sprig(14.8, -0.5, m)],
    // (The back is lobed too, so the notches cut the outline.)
    hatBack: (p, m) => [T(lobed(0, 360), shade(WAFER, -16)), hoodBack(shade(WAFER, -16), m)[1]],
    top: () => [...tunic(ANKO, ANKO_DK, 36),
      T([[10.2, 26.6], [20.8, 26.6], [21.6, 30.4], [20.4, 33.4], [15.5, 34.4], [10.6, 33.4], [9.4, 30.4]], WAFER),
      F(limb(11, 29.4, 15.4, 33.6, 0.3, 0.3, WAFER_DK)), F(limb(13.2, 27, 19.8, 32.6, 0.3, 0.3, WAFER_DK)), F(limb(20, 29.4, 15.6, 33.6, 0.3, 0.3, WAFER_DK)), F(limb(17.8, 27, 11.2, 32.6, 0.3, 0.3, WAFER_DK)),
      F(limb(10.4, 27, 20.6, 27, 0.4, 0.4, WAFER_LT))],
    sleeve: () => ANKO,
    long: true,
    shoulder: (p, side) => [E(0, 0.6, 3.6, 3, side > 0 ? WAFER : shade(WAFER, -12)), F(E(-1, -0.4, 1.3, 0.8, WAFER_LT)), F(limb(-3, 2.6, 3, 2.6, 0.4, 0.4, WAFER_DK))],
    legs: (p) => ({ top: ANKO, low: ANKO, pad: null }),
    skirt: () => [...puffs(ANKO, ANKO_DK), ...[10.6, 15.5, 20.4].flatMap((x) => [T([[x - 2.6, 34.6], [x + 2.6, 34.6], [x + 2.2, 38.8], [x, 39.8], [x - 2.2, 38.8]], WAFER), F(limb(x - 2.2, 35.4, x + 2.2, 35.4, 0.3, 0.3, WAFER_LT))])],
    shoe: (p, k, c) => [k.poly([[-2.6, -2.4], [2.8, -2.4], [3.4, 2.6], [-2.8, 2.6]], c('#7a5232')), k.poly([[-2.8, 1.8], [3.4, 1.8], [3.4, 2.8], [-2.8, 2.8]], c('#4e3420')),
      k.poly([[-2.6, -2.4], [2.8, -2.4], [2.8, -1.4], [-2.6, -1.4]], c(WAFER))],
  },
};

// The sakura sprig: a blossom on a short stem, nodding a beat behind the head.
function blossomOnStem(x, y, m) {
  const s = (m?.hair ?? 0) * 0.6;
  const [tx, ty] = [x + 0.6 + s, y - 3];
  return [F(limb(x, y, tx, ty, 0.5, 0.4, SAKURA_VEIN)), ...leaf(x + 0.2, y - 1.2, x - 2.8 + s * 0.4, y - 2.4, 1, SAKURA_LEAF, SAKURA_VEIN), ...blossom(tx, ty - 0.6, 1.8)];
}
export const MOCHI_OUTFIT_KEYS = Object.keys(MOCHI_OUTFITS);
