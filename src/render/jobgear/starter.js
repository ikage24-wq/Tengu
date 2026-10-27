// The outfits picked in the character creator (and Lulu's salon): what a hero wears where no top,
// bottom, shoes or cape is equipped. `t` is the outfit's key ('casual', 'school', ...), and the
// palette is built from the outfit color the player picked (see hero.js `starterPalette`):
// main/dark/deep/light, a second cloth, `pop` (an accent from across the color wheel), and the
// hero's own `skin` for bare shoulders.
//
// Every outfit has its own silhouette and a signature detail that reads at game size (Saint11:
// silhouette first; KO research: color proportions > signature item > outfit), its folds where
// the cloth bunches, and its own shoes. Skirts and back pieces hang and swing (gear.js HANGS).

import { R, E, T, F, shade } from '../pixel.js';
import { torsoPts, band, MID, button, limb } from '../figure.js';
import { frill, heart, flower, hoop, dome } from './casual.js';
import { fur } from './kit.js';

const WHITE = '#ffffff';
const CREAM = '#fff6ec';
const GOLD = '#ffd66b';
const FUR = '#f6ecdc';
const DENIM = '#7f9fdc';
const DENIM_DARK = '#5f7ec4';
const DENIM_LIGHT = '#b4c8f2';
const KHAKI = '#c8b48c';
const KHAKI_DARK = '#a8916a';
const BROWN = '#8a5a3c';
const NAVY = '#3f3b63';
const SHOE_DARK = '#4a3d5c';

const TORSO = torsoPts();
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255;
};
// White details turn to the second cloth on white outfits so they still show.
const pale = (p) => (lum(p.main) > 0.85 ? p.second : WHITE);

// The torso let out to a longer, looser hem at y1 (oversized tops hang past the waist).
const loose = (y1, flare = 0.6) => [...TORSO.slice(0, 6), [21.6 + flare, y1], [9.4 - flare, y1], ...TORSO.slice(8)];
// A skirt from the waist to `len`, flaring `fl` past the hips.
const skirtPts = (len, fl) => [[10, 34.2], [21.2, 34.2], [21.2 + fl, len], [10 - fl, len]];
// Pleats as soft fold lines fanning out from the waist.
const pleats = (len, fl, c, xs = [12.2, 14.6, 17, 19.4]) => xs.map((x) => F(limb(x, 35.6, x + (x - MID) * (fl / 6), len - 0.4, 0.5, 0.75, c)));
// A tier of ruffle from (x0..x1 at y0) out to a scalloped hem (x2..x3 at y1).
const tier = (x0, x1, y0, x2, x3, y1, n, c) => frill(x0, x1, y0, x2, x3, y1, n, 0.9, c);
// A bow with two loops and two tails, centred at (x, y).
const bow = (x, y, w, c, d) => [T([[x, y], [x - w, y - w * 0.6], [x - w * 1.1, y + w * 0.5]], c), T([[x, y], [x + w, y - w * 0.6], [x + w * 1.1, y + w * 0.5]], c),
  T([[x - 0.4, y + 0.3], [x - w * 0.7, y + w * 1.4], [x - w * 0.2, y + w * 1.3]], c), T([[x + 0.4, y + 0.3], [x + w * 0.7, y + w * 1.4], [x + w * 0.2, y + w * 1.3]], c), F(E(x, y, w * 0.32, w * 0.32, d))];
// Rib lines (cuffs, hems, turtlenecks).
const ribs = (x0, x1, y, h, c, step = 1.2) => Array.from({ length: Math.floor((x1 - x0) / step) }, (_, i) => F(R(x0 + 0.4 + i * step, y, 0.35, h, c)));

// ---------- The outfits ----------
// Each: top(p), sleeve(p) and long, shoulder(p, side), legs(p, skin), skirt(p) over the hips,
// shoe(p, k, c), and optionally back(p) behind the body and front(p) over the top.

const OUTFITS = {
  // An oversized tee with a big heart print, half tucked into rolled-cuff mom jeans; high-tops.
  casual: {
    top: (p) => [T(loose(36.6, 0.5), p.main), F(E(MID, 26.2, 3, 1.2, p.dark)),
      heart(MID - 0.4, 30.8, 2.8, pale(p)), heart(MID - 0.4, 30.9, 1.4, p.pop), F(E(19.6, 28.6, 0.5, 0.5, pale(p))), F(E(11.6, 33.4, 0.45, 0.45, pale(p))),
      // The front tuck: the hem lifts on the facing side, with folds pulling toward it.
      T([[17, 35], [21.9, 34.4], [22.1, 36.8], [17.4, 36]], p.dark), F(limb(17.4, 35.2, 20.6, 32.8, 0.45, 0.35, p.dark)), F(limb(18.6, 35.4, 21, 34, 0.4, 0.3, p.dark))],
    sleeve: (p) => p.main,
    legs: () => ({ top: DENIM, low: DENIM, pad: null, cuff: DENIM_LIGHT }),
    skirt: () => [F(limb(10.4, 37.2, 12.4, 38.6, 0.45, 0.4, DENIM_DARK)), F(limb(20.8, 37.2, 18.8, 38.6, 0.45, 0.4, DENIM_DARK)), F(R(MID - 0.25, 36.8, 0.5, 2.6, DENIM_DARK))],
    shoe: (p, k, c) => [k.shaft(4.2, c(p.pop), 3.3), k.sole(c(p.pop)), k.poly([[-2, -0.2], [2, -0.2], [2.6, 1.6], [-2.6, 1.6]], c(WHITE)),
      k.poly([[-2.9, 2.1], [2.9, 2.1], [2.6, 3], [-2.6, 3]], c('#e6e8f2')), k.dot(0, -1.6, 0.45, c(WHITE)), k.dot(0, -3, 0.45, c(WHITE)), k.dot(-1.3, -2.2, 0.6, c(WHITE))],
  },

  // A track jacket zipped to the chest over a tank, with racing stripes and a stand-up collar;
  // bike shorts, sport socks and runners.
  sporty: {
    // A sweatband over the bangs, with a stripe and a little logo.
    hat: (p) => [T([[4.6, 10.2], [9, 8], [15.5, 7.3], [22, 8], [26.4, 10.2], [26.4, 12], [22, 9.8], [15.5, 9.1], [9, 9.8], [4.6, 12]], p.pop),
      F(T([[6, 10.6], [9.2, 8.9], [15.5, 8.2], [21.8, 8.9], [25, 10.6], [25, 11], [21.8, 9.3], [15.5, 8.6], [9.2, 9.3], [6, 11]], WHITE)), F(E(20.6, 9.2, 0.7, 0.55, p.main))],
    top: (p) => [T(TORSO, p.main), T([[MID - 1.8, 26.6], [MID + 1.8, 26.6], [MID, 30.6]], pale(p) === WHITE ? p.pop : WHITE),
      F(R(10.1, 27.4, 1.1, 8.4, pale(p))), F(R(20.3, 27.4, 1.1, 8.4, pale(p))), F(R(10.4, 27.6, 0.4, 8.2, p.pop)), F(R(20.6, 27.6, 0.4, 8.2, p.pop)),
      T([[11.4, 24.8], [MID - 1.4, 25.2], [MID - 0.4, 28.2], [10.8, 27.4]], p.dark), T([[19.8, 24.8], [MID + 1.4, 25.2], [MID + 0.4, 28.2], [20.4, 27.4]], p.dark),
      F(R(MID - 0.3, 30.4, 0.6, 5.4, p.deep)), F(E(MID, 30.8, 0.6, 0.9, GOLD)), band(TORSO, 34.6, 35.8, p.dark), ...ribs(9.8, 21.4, 34.8, 0.9, p.deep)],
    sleeve: (p) => p.main,
    long: true,
    legs: (p, skin) => ({ top: NAVY, low: skin, pad: null }),
    skirt: (p) => [F(R(9.3, 35.8, 0.9, 4.2, pale(p) === WHITE ? p.pop : WHITE)), F(R(21.1, 35.8, 0.9, 4.2, pale(p) === WHITE ? p.pop : WHITE))],
    shoe: (p, k, c) => [k.shaft(2.6, c(WHITE), 3.1), k.shaft(0.6, c(p.pop), 3.15), k.sole(c(p.main)), k.poly([[-3, 1.8], [3, 1.8], [2.7, 3], [-2.7, 3]], c(WHITE)),
      k.poly([[-1.6, 0], [1.4, -0.6], [2, 0.6], [-1, 1]], c(p.pop))],
  },

  // A big, slouchy hoodie: the hood bunched around the neck, drawstrings, a kangaroo pocket and a
  // ribbed hem hanging past the hips; joggers and chunky sneakers.
  hoodie: {
    top: (p) => [T(loose(37.4, 0.9), p.main),
      T([[10.4, 24.8], [20.8, 24.8], [21.6, 27.4], [MID, 28.6], [9.6, 27.4]], p.dark), F(T([[12.4, 25.6], [18.8, 25.6], [MID, 27.4]], p.deep)),
      F(limb(MID - 1.4, 27.6, MID - 1.8, 31.6, 0.5, 0.5, pale(p))), F(limb(MID + 1.4, 27.6, MID + 1.8, 31.6, 0.5, 0.5, pale(p))),
      F(E(MID - 1.8, 31.8, 0.45, 0.6, p.pop)), F(E(MID + 1.8, 31.8, 0.45, 0.6, p.pop)),
      T([[11.6, 31.8], [19.6, 31.8], [20.6, 35], [10.6, 35]], p.dark), F(limb(11.8, 32.2, 10.8, 34.8, 0.4, 0.4, p.deep)), F(limb(19.4, 32.2, 20.4, 34.8, 0.4, 0.4, p.deep)),
      band(loose(37.4, 0.9), 36, 37.4, p.dark), ...ribs(9, 22.2, 36.2, 1.1, p.deep), heart(19.4, 29.4, 0.8, p.pop)],
    sleeve: (p) => p.main,
    long: true,
    // The hood's back hangs behind the shoulders.
    back: (p) => [T([[8.2, 22.4], [22.8, 22.4], [24.2, 28.4], [15.5, 30], [6.8, 28.4]], p.dark), F(E(15.5, 24.4, 6.8, 2.4, p.deep))],
    legs: (p) => ({ top: p.second, low: p.second, pad: null, cuff: p.secondDark }),
    skirt: () => [],
    shoe: (p, k, c) => [k.sole(c(WHITE)), k.poly([[-3.1, 1.4], [3.1, 1.4], [3.2, 3], [-3.2, 3]], c('#e8e4f2')), k.poly([[-3.1, 1.4], [3.1, 1.4], [3.1, 1.9], [-3.1, 1.9]], c(p.pop)), k.dot(0.8, -0.4, 0.55, c(p.main))],
  },

  // An open jacket with a spread collar and flapped chest pockets over a printed tee; cargo pants
  // with a belt and side pockets; lace-up boots.
  jacket: {
    // Round glasses (the look's face accessory).
    hat: () => [F(hoop(11.2, 18.2, 3.1, 3.2, 2.35, 2.45, '#6a4a3a')), F(hoop(19.8, 18.2, 3.1, 3.2, 2.35, 2.45, '#6a4a3a')), F(R(14.2, 17.4, 2.6, 0.6, '#6a4a3a')),
      F(R(5.4, 17, 2.8, 0.6, '#6a4a3a')), F(R(22.8, 17, 2.8, 0.6, '#6a4a3a')), F(E(12.6, 16.6, 0.45, 0.45, WHITE)), F(E(21.2, 16.6, 0.45, 0.45, WHITE))],
    top: (p) => [T(TORSO, p.main), T([[MID - 2.4, 26], [MID + 2.4, 26], [MID + 2.1, 35.8], [MID - 2.1, 35.8]], CREAM),
      ...flower(MID, 31, 1.5, p.pop, GOLD), F(R(MID - 1.4, 33.4, 2.8, 0.45, p.pop)),
      F(limb(MID - 2.4, 27, MID - 2.1, 35.6, 0.6, 0.6, p.deep)), F(limb(MID + 2.4, 27, MID + 2.1, 35.6, 0.6, 0.6, p.deep)),
      T([[MID - 2.4, 25.6], [MID - 5.6, 25.8], [MID - 3.2, 29.8]], p.light), T([[MID + 2.4, 25.6], [MID + 5.6, 25.8], [MID + 3.2, 29.8]], p.light),
      R(10.6, 29.6, 2.8, 1.1, p.dark), R(18.2, 29.6, 2.8, 1.1, p.dark), button(12, 30.2, GOLD), button(19.6, 30.2, GOLD),
      F(R(10.6, 30.8, 0.4, 1.6, p.dark)), F(R(21, 30.8, 0.4, 1.6, p.dark)), band(TORSO, 34.4, 35.8, p.dark)],
    sleeve: (p) => p.main,
    long: true,
    legs: () => ({ top: KHAKI, low: KHAKI, pad: null, cuff: KHAKI_DARK }),
    skirt: () => [R(9.4, 35.6, 12.4, 1.2, BROWN), F(R(MID - 0.8, 35.7, 1.6, 1, GOLD)), R(8.4, 37.4, 2.8, 3, KHAKI_DARK), R(19.8, 37.4, 2.8, 3, KHAKI_DARK),
      F(R(8.4, 37.4, 2.8, 0.8, shade(KHAKI_DARK, -14))), F(R(19.8, 37.4, 2.8, 0.8, shade(KHAKI_DARK, -14)))],
    shoe: (p, k, c) => [k.shaft(3.6, c(BROWN), 3.2), k.sole(c(BROWN)), k.poly([[-2.9, 2.1], [2.9, 2.1], [2.6, 3], [-2.6, 3]], c(SHOE_DARK)),
      k.dot(0.4, -1, 0.4, c(CREAM)), k.dot(0.4, -2.2, 0.4, c(CREAM)), k.dot(0.4, -3.4, 0.4, c(CREAM))],
  },

  // A school blazer with a gold crest and a big ribbon tie over a white shirt; a pleated plaid
  // skirt, knee socks and loafers.
  school: {
    top: (p) => [T(TORSO, p.main), T([[MID - 2.4, 26], [MID + 2.4, 26], [MID, 31.6]], WHITE),
      T([[MID - 2.4, 25.8], [MID - 0.4, 26.2], [MID - 1.6, 27.8]], WHITE), T([[MID + 2.4, 25.8], [MID + 0.4, 26.2], [MID + 1.6, 27.8]], WHITE),
      T([[MID - 2.5, 26.2], [MID - 4.4, 26.8], [MID - 1.2, 32.2]], p.dark), T([[MID + 2.5, 26.2], [MID + 4.4, 26.8], [MID + 1.2, 32.2]], p.dark),
      ...bow(MID, 27.8, 1.9, p.pop, shade(p.pop, -22)),
      F(R(17.6, 29.8, 2.8, 0.45, p.dark)), F(T([[18.2, 30.4], [19.8, 30.4], [19.8, 31.6], [19, 32.4], [18.2, 31.6]], GOLD)), F(E(19, 31.2, 0.35, 0.35, p.main)),
      button(MID, 33.6, GOLD), F(R(10.4, 33.4, 2.2, 0.45, p.dark))],
    sleeve: (p) => p.main,
    long: true,
    legs: (p, skin) => ({ top: skin, low: NAVY, pad: null }),
    skirt: (p) => {
      const pts = skirtPts(41.8, 1.8);
      const base = p.second;
      const line = p.secondDark;
      return [T(pts, base), ...pleats(41.8, 1.8, line, [12, 14.4, 16.8, 19.2]), F(band(pts, 37.4, 37.9, line)), F(band(pts, 39.6, 40.1, line)),
        F(band(pts, 38.5, 38.8, p.pop)), ...[11.2, 13.6, 16, 18.4, 20.8].map((x) => F(limb(x, 34.6, x + (x - MID) * 0.28, 41.4, 0.3, 0.35, p.pop))), band(pts, 40.9, 41.8, line)];
    },
    shoe: (p, k, c) => [k.shaft(2.4, c(NAVY), 3), k.sole(c(BROWN)), k.poly([[-2.2, -0.2], [2.2, -0.2], [2.5, 0.9], [-2.5, 0.9]], c(shade(BROWN, -16))), k.dot(0, 0.35, 0.45, c(GOLD)),
      k.poly([[-2.9, 2.2], [2.9, 2.2], [2.6, 3], [-2.6, 3]], c(SHOE_DARK))],
  },

  // The classic sailor uniform: a wide square collar with two white stripes over the shoulders,
  // a scarf knot, a pleated skirt with a stripe at the hem, white socks and loafers.
  sailor: {
    top: (p) => [T(TORSO, WHITE), T([[8.8, 25.2], [22.4, 25.2], [23, 29.8], [MID, 33.2], [8.2, 29.8]], p.main), T([[MID - 2.2, 25.4], [MID + 2.2, 25.4], [MID, 30.2]], WHITE),
      F(limb(8.9, 28.8, MID - 0.4, 32.2, 0.4, 0.4, WHITE)), F(limb(22.3, 28.8, MID + 0.4, 32.2, 0.4, 0.4, WHITE)),
      F(limb(9.2, 27.8, MID - 0.6, 31.2, 0.35, 0.35, WHITE)), F(limb(22, 27.8, MID + 0.6, 31.2, 0.35, 0.35, WHITE)),
      T([[MID - 0.7, 31.6], [MID - 2.2, 35.2], [MID - 0.4, 34.6]], p.pop), T([[MID + 0.7, 31.6], [MID + 2.2, 35.2], [MID + 0.4, 34.6]], p.pop), ...bow(MID, 31.4, 1.6, p.pop, shade(p.pop, -22)),
      band(TORSO, 34.8, 35.8, shade(WHITE, -8))],
    sleeve: () => WHITE,
    shoulder: (p) => [F(R(-2.3, 3.2, 4.6, 0.9, p.main))],
    legs: (p, skin) => ({ top: skin, low: WHITE, pad: null }),
    skirt: (p) => {
      const pts = skirtPts(41.6, 1.9);
      return [T(pts, p.main), ...pleats(41.6, 1.9, p.dark), F(band(pts, 39.8, 40.4, WHITE)), band(pts, 40.9, 41.6, p.dark)];
    },
    shoe: (p, k, c) => [k.shaft(2.6, c(WHITE), 3.1), k.sole(c(SHOE_DARK)), k.poly([[-2.2, -0.2], [2.2, -0.2], [2.5, 0.9], [-2.5, 0.9]], c(shade(SHOE_DARK, 10))), k.dot(-0.8, -0.6, 0.4, c(WHITE))],
  },

  // A chunky cable-knit turtleneck, slouching past the hips, over a long flowing skirt; dark
  // tights and ankle boots.
  sweater: {
    // A soft beret worn tilted, with its little stalk.
    hat: (p) => [E(14.2, 5.8, 11.8, 4.4, p.second), F(E(10.4, 4.6, 4, 1.6, shade(p.second, 14))), F(T([[3.8, 7.4], [24.4, 7.4], [25.6, 8.6], [2.8, 8.6]], p.secondDark)), R(13.4, 0.2, 1.6, 1.8, p.secondDark)],
    top: (p) => {
      const pts = loose(37.2, 0.7);
      // Two cables: a braid of twists between purl lines, in the knit's own shade (no highlights).
      const cable = (x) => [F(R(x - 1.3, 27.6, 0.45, 8.4, p.dark)), F(R(x + 0.85, 27.6, 0.45, 8.4, p.dark)),
        ...[28.6, 30.8, 33].map((y) => F(limb(x - 0.6, y, x + 0.6, y + 1.4, 0.55, 0.55, p.dark)))];
      return [T(pts, p.main), ...cable(12.4), ...cable(18.8),
        R(MID - 3.6, 24.2, 7.2, 3.2, p.main), F(R(MID - 3.6, 26.6, 7.2, 0.6, p.dark)), ...ribs(MID - 3.4, MID + 3.4, 24.6, 1.8, p.dark, 1.1),
        band(pts, 35.8, 37.2, p.dark), ...ribs(9, 22.2, 36, 1.1, p.deep)];
    },
    sleeve: (p) => p.main,
    long: true,
    shoulder: (p) => [E(0, 0.8, 2.6, 2.4, p.main), F(R(-2.2, 1.4, 4.4, 0.4, p.dark))],
    legs: () => ({ top: '#6b5a7e', low: '#6b5a7e', pad: null }),
    skirt: (p) => {
      const pts = [[10, 34.2], [21.2, 34.2], [23.8, 48.4], [7.4, 48.4]];
      return [T(pts, p.second), ...[12.4, 15.6, 18.8].map((x) => F(limb(x, 37.6, x + (x - MID) * 0.45, 48, 0.4, 0.8, p.secondDark))), band(pts, 47.2, 48.4, p.secondDark)];
    },
    shoe: (p, k, c) => [k.shaft(2.8, c(BROWN), 3.2), k.sole(c(BROWN)), k.poly([[-2.9, 2.1], [2.9, 2.1], [2.6, 3], [-2.6, 3]], c(SHOE_DARK)), k.dot(-1.2, -1.6, 0.4, c(GOLD))],
  },

  // Dungaree shorts with a heart on the bib pocket and gold buttons on the straps, over a striped
  // tee; canvas sneakers.
  overalls: {
    top: (p) => [T(TORSO, WHITE), ...[27.2, 29].map((y) => band(TORSO, y, y + 0.9, p.pop)), F(E(MID, 26.3, 3, 1, shade(WHITE, -10))),
      T([[MID - 3.8, 29.4], [MID + 3.8, 29.4], [MID + 4.4, 35.8], [MID - 4.4, 35.8]], p.main), R(MID - 4.4, 25.6, 1.5, 4.4, p.main), R(MID + 2.9, 25.6, 1.5, 4.4, p.main),
      button(MID - 3.6, 30.2, GOLD), button(MID + 3.6, 30.2, GOLD),
      R(MID - 2, 31, 4, 2.8, p.dark), heart(MID, 32.4, 1, pale(p) === WHITE ? p.pop : WHITE), F(R(MID - 2, 31, 4, 0.5, p.deep)),
      F(limb(MID - 4.2, 30, MID - 4.4, 35.6, 0.4, 0.4, p.dark)), F(limb(MID + 4.2, 30, MID + 4.4, 35.6, 0.4, 0.4, p.dark))],
    sleeve: () => WHITE,
    shoulder: (p) => [F(R(-2.3, 1.8, 4.6, 0.8, p.pop))],
    legs: (p, skin) => ({ top: p.main, low: skin, pad: p.light }),
    skirt: (p) => [F(E(9.9, 36.4, 0.5, 0.5, GOLD)), F(E(21.3, 36.4, 0.5, 0.5, GOLD)), F(limb(MID, 35.8, MID, 39, 0.45, 0.45, p.dark))],
    shoe: (p, k, c) => [k.sole(c(p.pop)), k.poly([[-2.4, -0.4], [2.4, -0.4], [2.8, 1.2], [-2.8, 1.2]], c(WHITE)), k.poly([[-2.9, 2.1], [2.9, 2.1], [2.6, 3], [-2.6, 3]], c(WHITE)), k.dot(0, -0.9, 0.4, c(p.pop))],
  },

  // A summer sundress: thin straps and a sweetheart bodice, a ribbon at the waist, and a skirt in
  // two ruffled tiers scattered with little flowers; sandals.
  sundress: {
    // A straw sun hat with a ribbon and a flower; the ribbon's tails trail behind.
    hat: (p) => [E(15.5, 8.6, 16, 3.4, '#f3dcaa'), F(E(15.5, 8.9, 13.6, 2, '#d9bd82')), E(15.5, 5, 8.6, 5, '#f3dcaa'), F(E(12.4, 3.2, 3.4, 1.2, '#fbecc8')),
      R(7, 6.2, 17, 2, p.main), ...bow(22.6, 7.2, 1.4, p.main, p.dark), ...flower(9.6, 6.6, 1.6, WHITE, p.pop)],
    hatBack: (p, m) => [T([[22, 8], [24.4, 8], [28 + m.sway, 17], [25.8 + m.sway, 17.6]], p.main), T([[23, 8], [25, 8], [25.6 + m.sway, 19.6], [23.6 + m.sway, 19]], p.dark)],
    top: (p) => [T(TORSO, p.skin), T([[9.6, 29.6], [12.6, 28.4], [MID, 29.8], [18.6, 28.4], [21.6, 29.6], [21.5, 35.8], [9.5, 35.8]], p.main),
      F(limb(11.6, 26.6, 11.8, 28.8, 0.7, 0.7, p.main)), F(limb(19.6, 26.6, 19.4, 28.8, 0.7, 0.7, p.main)),
      ...[30.8, 31.8].map((y) => F(R(10.6, y, 10, 0.35, p.dark))), band(TORSO, 33.4, 34.8, p.pop), ...bow(19.2, 34, 1.4, p.pop, shade(p.pop, -22))],
    sleeve: (p) => p.skin,
    legs: (p, skin) => ({ top: skin, low: skin, pad: null }),
    skirt: (p) => [tier(10, 21.2, 34.2, 6.6, 24.6, 44.6, 7, p.light), tier(10, 21.2, 34.2, 8.2, 23, 40.6, 6, p.main),
      ...flower(12.4, 37.6, 1.1, pale(p), GOLD), ...flower(18.8, 38.4, 1, pale(p), GOLD), ...flower(9.6, 42.8, 1, pale(p), GOLD), ...flower(15.8, 43.2, 1.1, pale(p), p.pop), ...flower(21.6, 42.4, 0.9, pale(p), GOLD)],
    shoe: (p, k, c) => [k.shaft(1, c(BROWN), 3.1), k.poly([[-3, 1.6], [3, 1.6], [3, 3], [-3, 3]], c(CREAM)), k.poly([[-2.6, -0.2], [2.6, -0.2], [2.8, 1.6], [-2.8, 1.6]], c(p.skin)),
      k.poly([[-2.6, 0.2], [2.6, 0.2], [2.7, 1], [-2.7, 1]], c(BROWN)), k.dot(0, 0.6, 0.55, c(p.pop))],
  },

  // A maid's dress: a round white collar with a ribbon, puff sleeves with frilled cuffs, a frilled
  // white apron, a petticoat peeking under the hem and a big bow at the back; white stockings and
  // Mary Janes.
  maid: {
    // The frilled headdress: a band across the top of the head with a white ruffle standing up.
    hat: (p) => [frill(6.4, 24.6, 7.8, 6.8, 24.2, 3.8, 6, 0.9, WHITE), hoop(15.5, 13.6, 10.8, 7.6, 9.6, 6.4, p.main, 200, 340, 12), F(E(15.5, 4.6, 0.8, 0.8, p.pop))],
    top: (p) => [T(TORSO, p.main), E(MID - 1.9, 26.6, 2.3, 1.5, WHITE), E(MID + 1.9, 26.6, 2.3, 1.5, WHITE), ...bow(MID, 27.4, 1.3, p.pop, shade(p.pop, -22)),
      T([[MID - 3.1, 30], [MID + 3.1, 30], [MID + 3.4, 35.8], [MID - 3.4, 35.8]], WHITE), frill(MID - 3.3, MID + 3.3, 29.2, MID - 3.6, MID + 3.6, 30.6, 4, 0.5, WHITE),
      F(limb(MID - 3, 30, 11.6, 26.6, 0.7, 0.7, WHITE)), F(limb(MID + 3, 30, 19.6, 26.6, 0.7, 0.7, WHITE)), F(R(MID - 3.4, 34.2, 6.8, 0.6, shade(WHITE, -10)))],
    sleeve: (p) => p.main,
    shoulder: (p) => [E(0, 0.6, 3, 2.6, p.main), F(E(-0.8, -0.2, 1.2, 0.8, p.light)), frill(-2.8, 2.8, 2.4, -3.3, 3.3, 4.2, 3, 0.6, WHITE)],
    back: (p) => [T([[15.5, 35], [7.6, 31.4], [6.6, 36], [8.6, 38.8]], WHITE), T([[15.5, 35], [23.4, 31.4], [24.4, 36], [22.4, 38.8]], WHITE),
      T([[14.6, 35.6], [10.6, 44.6], [12.8, 45]], WHITE), T([[16.4, 35.6], [20.4, 44.6], [18.2, 45]], WHITE)],
    legs: () => ({ top: WHITE, low: WHITE, pad: null }),
    skirt: (p) => {
      const pts = skirtPts(43.2, 3);
      return [tier(10, 21.2, 34.2, 6.4, 24.8, 44.6, 8, WHITE), T(pts, p.main), ...pleats(43.2, 3, p.dark, [11.6, 19.6]),
        T([[MID - 3.4, 34.4], [MID + 3.4, 34.4], [MID + 4.6, 41.6], [MID - 4.6, 41.6]], WHITE), frill(MID - 4.6, MID + 4.6, 41.4, MID - 4.9, MID + 4.9, 42.8, 5, 0.6, WHITE)];
    },
    shoe: (p, k, c) => [k.sole(c(SHOE_DARK)), k.poly([[-2.6, -0.6], [2.6, -0.6], [2.6, 0.2], [-2.6, 0.2]], c(SHOE_DARK)), k.dot(1.4, -0.2, 0.45, c(GOLD)), k.dot(-1, 0.8, 0.45, c(WHITE))],
  },

  // A quilted puffer jacket whose padded rows bulge past the body, a fur-lined hood and high
  // collar, and a zip; jeans and snow boots with fur cuffs.
  puffer: {
    // A knit beanie with a fold-up cuff and a bobbing pompom.
    hat: (p, m) => {
      const s = (m?.hair ?? 0) * 0.5;
      return [E(15.5 + s, 0.2, 3.4, 3.2, FUR), F(E(14.4 + s, -0.8, 1.2, 1, WHITE)), dome(15.5, 9.4, 11, 8.6, p.pop), T([[4.2, 7.4], [26.8, 7.4], [27.2, 11], [3.8, 11]], shade(p.pop, -14)),
        ...[7, 10.2, 13.4, 16.6, 19.8, 23].map((x) => F(R(x, 7.8, 0.6, 2.8, shade(p.pop, -26))))];
    },
    top: (p) => {
      const out = [T(TORSO, p.main)];
      // The padded rows bulge past the body, so the jacket's outline is scalloped.
      for (const [y, w] of [[28.4, 7.2], [31, 7.6], [33.6, 7.6], [35.8, 7.2]]) {
        out.push(E(MID, y, w, 1.55, p.main), F(R(MID - w + 0.6, y + 1.05, (w - 0.6) * 2, 0.45, p.dark)), F(E(MID + w * 0.42, y - 0.55, w * 0.32, 0.38, p.light)));
      }
      out.push(R(MID - 3.8, 24.2, 7.6, 3.2, p.main), F(R(MID - 3.8, 26.8, 7.6, 0.5, p.dark)), fur([[MID - 4.4, 24.4], [MID, 23.6], [MID + 4.4, 24.4]], 1.2, FUR),
        F(R(MID - 0.3, 25.6, 0.6, 11, p.deep)), F(E(MID, 28.2, 0.6, 0.9, GOLD)));
      return out;
    },
    sleeve: (p) => p.main,
    long: true,
    shoulder: (p) => [E(0, 1, 2.9, 2.7, p.main), F(R(-2.6, 1.4, 5.2, 0.45, p.dark)), F(E(0.6, 0, 1.2, 0.5, p.light))],
    back: (p) => [E(15.5, 25.4, 9.2, 3.4, p.dark), fur([[6.8, 25.8], [15.5, 22.2], [24.2, 25.8]], 1.4, FUR)],
    legs: () => ({ top: DENIM, low: DENIM, pad: null }),
    skirt: () => [],
    shoe: (p, k, c) => [k.shaft(4.4, c(p.dark), 3.4), k.sole(c(p.dark)), k.poly([[-3, 2], [3, 2], [2.8, 3], [-2.8, 3]], c(SHOE_DARK)), k.dot(0, -3.8, 1.9, c(FUR)), k.dot(-0.8, -4.4, 0.7, c(WHITE))],
  },
};

// Dancing Green's stage outfit: pink cat-eye sunglasses and a pin, a shiny purple
// jacket worn open with rolled sleeves over a lime shirt, white bell-bottoms, white platforms.
const JACKET = '#9b3fd6';
const JACKET_DK = '#6f2aa8';
const JACKET_LT = '#c78af0';
const LIME = '#c6e83a';
const LIME_DK = '#8fb21e';
OUTFITS.disco = {
  hat: () => {
    // Big cat-eye shades covering the eyes: thick dark frames sweeping up into points at the
    // outer corners, glossy magenta lenses with a pale streak, a bridge, and a pin in the hair.
    const FR = '#2c2140';
    const lens = (s) => {
      const m = ([x, y]) => [s < 0 ? 31 - x : x, y];
      const frame = [[16.8, 15.2], [22.6, 14.8], [25.4, 13.6], [27.4, 12.2], [26.4, 15.6], [26, 19], [24, 21.8], [20.6, 22.6], [17.6, 21.4], [16.4, 18.4]].map(m);
      const glass = [[17.6, 16.2], [22.6, 15.8], [25.2, 15], [24.8, 18.8], [23.2, 21], [20.6, 21.6], [18.2, 20.6], [17.4, 18.4]].map(m);
      const shine = [[18.6, 16.8], [21, 16.6], [19, 19.6], [18.4, 18.6]].map(m);
      return [F(T(frame, FR)), F(T(glass, '#d8389f')), F(T(glass.map(([x, y]) => [x, y - 0.1]).slice(0, 4).concat([[s < 0 ? 31 - 18 : 18, 18.2]]), '#f06cc0')), F(T(shine, '#ffd6f0'))];
    };
    return [...lens(1), ...lens(-1), F(R(13.8, 16, 3.4, 1, FR)),
      F(E(23.2, 8.6, 1.6, 1.6, '#ffffff')), F(E(23.2, 8.6, 1.1, 1.1, '#ff5b7f')), F(E(23.2, 8.6, 0.5, 0.5, '#ffffff'))];
  },
  top: () => [T(loose(36.6, 0.6), JACKET),
    // The lime shirt down the open front, with a zigzag pattern band at the chest.
    T([[MID - 2.6, 25.4], [MID + 2.6, 25.4], [MID + 2.2, 36.4], [MID - 2.2, 36.4]], LIME),
    ...[0, 1, 2, 3].map((i) => F(T([[MID - 2.2 + i * 1.1, 29], [MID - 1.65 + i * 1.1, 28.2], [MID - 1.1 + i * 1.1, 29]], LIME_DK))),
    F(R(MID - 0.25, 30, 0.5, 6, LIME_DK)),
    // Wide lapels and a patterned band across the jacket's chest.
    T([[MID - 2.6, 25.4], [MID - 4.6, 26], [MID - 2.4, 32]], JACKET_DK), T([[MID + 2.6, 25.4], [MID + 4.6, 26], [MID + 2.4, 32]], JACKET_DK),
    F(R(9.8, 31.2, 3.2, 0.8, '#ffffff')), F(R(18.2, 31.2, 3.2, 0.8, '#ffffff')), F(R(9.8, 32.2, 3.2, 0.4, LIME)), F(R(18.2, 32.2, 3.2, 0.4, LIME)),
    // Satin shine: long light streaks down the jacket.
    F(limb(11.2, 27, 11, 35, 0.5, 0.4, JACKET_LT)), F(limb(20.2, 27.4, 20.6, 34.6, 0.45, 0.35, JACKET_LT))],
  sleeve: () => JACKET,
  long: true,
  shoulder: () => [E(0, 1, 2.9, 2.7, JACKET), F(E(0.6, 0, 1.2, 0.5, JACKET_LT))],
  legs: () => ({ top: '#f4f0fb', low: '#f4f0fb', pad: null }),
  skirt: () => [F(R(10, 34.6, 11.2, 0.8, '#d8d0ea'))],
  // White platforms under wide bell-bottom flares.
  shoe: (p, k, c) => [k.poly([[-3, 0.6], [3, 0.6], [3.2, 3.2], [-3.2, 3.2]], c('#e8e6f2')), k.poly([[-3.2, 2.4], [3.2, 2.4], [3.2, 3.2], [-3.2, 3.2]], c('#b8b2cc')),
    k.poly([[-1.9, -3.4], [1.9, -3.4], [3.6, 0.8], [-3.6, 0.8]], c('#f4f0fb')), k.poly([[-3.6, 0.2], [3.6, 0.2], [3.6, 0.8], [-3.6, 0.8]], c('#d8d0ea'))],
};

// Dancing Green's toad form: a cropped purple jacket open over a silver ribbed chest,
// a white belt with a round buckle, chrome bell-bottoms in sculpted panels, and frog feet.
const CHROME = '#dfe3ee';
const CHROME_DK = '#a9b0c6';
OUTFITS.toad = {
  // His toad-form glasses: two big wing-shaped pink lenses flaring up at the outer corners, thin
  // gold rims and bridge, the pink lighter toward the bottom, and gold arms that curve up from the
  // corners like antennae.
  hat: () => {
    const GOLD_RIM = '#c9963e';
    const GOLD_LT = '#f2cf7a';
    const lens = [[16.4, 16.8], [19.2, 15.6], [22.6, 14.6], [25.4, 13.2], [27.2, 11.8], [27, 14.6], [26, 17.8], [24.2, 20.4], [21.6, 21.6], [18.8, 21.2], [16.9, 19.6]];
    const side = (s) => {
      const m = ([x, y]) => [s < 0 ? 31 - x : x, y];
      const grow = (pts, d) => pts.map(([x, y]) => [21.8 + (x - 21.8) * (1 + d), 17.6 + (y - 17.6) * (1 + d)]);
      const out = [F(T(grow(lens, 0.12).map(m), GOLD_RIM)), F(T(lens.map(m), '#d6338f')),
        // A lighter lower half and a pale glow along the bottom.
        F(T([[17, 18.4], [26.3, 16.4], [26, 17.8], [24.2, 20.4], [21.6, 21.6], [18.8, 21.2], [16.9, 19.6]].map(m), '#ef5aac')),
        F(T([[18.4, 20.2], [24.6, 19], [23.6, 20.6], [21.6, 21.3], [19.2, 21]].map(m), '#ff9bd0')),
        // Shines: a long streak up top and a dot.
        F(T([[18.4, 16.6], [22.8, 15.4], [23.2, 16], [18.8, 17.4]].map(m), '#ffd2ec')), F(E(m([25, 14.6])[0], 14.6, 0.55, 0.55, '#ffe8f6'))];
      // The antenna arm: a thin gold curve rising from the outer corner, with a bead at the tip.
      const arm = [[27.2, 11.8], [28, 8.6], [28.6, 5.4], [28.4, 2.4], [27.6, 0.4]];
      for (let i = 1; i < arm.length; i++) {
        const [x0, y0] = m(arm[i - 1]);
        const [x1, y1] = m(arm[i]);
        const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) * 2.6;
        out.push(F(T([[x0 + nx / l, y0 + ny / l], [x1 + nx / l, y1 + ny / l], [x1 - nx / l, y1 - ny / l], [x0 - nx / l, y0 - ny / l]], GOLD_RIM)));
      }
      const tip = m(arm.at(-1));
      out.push(F(E(tip[0], tip[1], 0.7, 0.7, GOLD_LT)));
      return out;
    };
    return [...side(1), ...side(-1), F(T([[14.4, 16.4], [16.6, 16.4], [16.6, 17.4], [15.5, 17.8], [14.4, 17.4]], GOLD_RIM)), F(E(15.5, 16.8, 0.5, 0.3, GOLD_LT)),
      F(E(23.2, 8.6, 1.6, 1.6, '#ffffff')), F(E(23.2, 8.6, 1.1, 1.1, '#ff5b7f'))];
  },
  top: () => [T(TORSO, '#e9edf4'),
    // A muscular chest: pecs and a six-pack in soft grey-violet shading.
    F(T([[MID - 4.6, 27.4], [MID - 0.4, 27.2], [MID - 0.6, 29.6], [MID - 4.2, 29.4]], '#c6cbdb')), F(T([[MID + 0.4, 27.2], [MID + 4.6, 27.4], [MID + 4.2, 29.4], [MID + 0.6, 29.6]], '#c6cbdb')),
    F(T([[MID - 4.2, 26.8], [MID - 0.6, 26.6], [MID - 0.8, 28.4], [MID - 3.8, 28.4]], '#f6f8fc')), F(T([[MID + 0.6, 26.6], [MID + 4.2, 26.8], [MID + 3.8, 28.4], [MID + 0.8, 28.4]], '#f6f8fc')),
    ...[30.4, 31.9, 33.3].flatMap((y) => [F(E(MID - 1.25, y, 1.05, 0.6, '#d5d9e6')), F(E(MID + 1.25, y, 1.05, 0.6, '#d5d9e6'))]), F(R(MID - 0.15, 29.6, 0.3, 4.6, '#b4b9cc')),
    // The cropped jacket: short purple panels with lime vest edges along the open front.
    T([[9.2, 24.8], [MID - 3.4, 25], [MID - 4.6, 31.4], [9.2, 31.8]], JACKET), T([[21.8, 24.8], [MID + 3.4, 25], [MID + 4.6, 31.4], [21.8, 31.8]], JACKET),
    F(T([[MID - 3.4, 25], [MID - 2.4, 25.2], [MID - 3.8, 31.2], [MID - 4.6, 31.4]], LIME)), F(T([[MID + 2.4, 25.2], [MID + 3.4, 25], [MID + 4.6, 31.4], [MID + 3.8, 31.2]], LIME)),
    F(R(9.2, 31, 4.8, 0.8, JACKET_DK)), F(R(17, 31, 4.8, 0.8, JACKET_DK)), F(limb(10.4, 25.8, 10.2, 30.6, 0.55, 0.4, JACKET_LT)), F(limb(20.6, 25.8, 20.8, 30.6, 0.55, 0.4, JACKET_LT)),
    // The black belt and its big round silver buckle.
    band(TORSO, 34.2, 35.9, '#2a2236'), F(E(MID, 35.05, 1.6, 1.4, '#c8cede')), F(E(MID, 35.05, 0.9, 0.8, '#2a2236')), F(E(MID - 0.4, 34.6, 0.4, 0.3, '#ffffff')),
    // The big red scarf, bunched round the neck.
    ...[[10.4, 25.2, 2.6], [13.2, 26.2, 2.8], [17.8, 26.2, 2.8], [20.6, 25.2, 2.6], [15.5, 26.9, 2.6]].map(([x, y, r]) => F(E(x, y, r, r * 0.8, '#c81e38'))),
    ...[[11.8, 24.8, 1.1], [15.5, 25.6, 1.2], [19.2, 24.8, 1.1]].map(([x, y, r]) => F(E(x, y, r, r * 0.6, '#ff5468')))],
  sleeve: () => JACKET,
  long: true,
  // Big puffed shoulders.
  shoulder: () => [E(0, 0.6, 3.6, 3.2, JACKET), F(E(0.4, -0.4, 1.8, 0.7, JACKET_LT)), F(E(0, 2.6, 3, 0.6, JACKET_DK))],
  legs: () => ({ top: CHROME, low: CHROME, pad: '#9aa0b8' }),
  // Sculpted panel lines over the thighs, curving down from the hips.
  skirt: () => [F(limb(11.4, 36.6, 12.6, 41, 0.45, 0.35, '#8e94ac')), F(limb(14.2, 36.6, 13.4, 41, 0.4, 0.3, '#8e94ac')),
    F(limb(19.6, 36.6, 18.4, 41, 0.45, 0.35, '#8e94ac')), F(limb(16.8, 36.6, 17.6, 41, 0.4, 0.3, '#8e94ac')), F(limb(12.4, 37, 12.8, 39.6, 0.5, 0.5, '#f7f9fd')), F(limb(18.6, 37, 18.2, 39.6, 0.5, 0.5, '#f7f9fd'))],
  // Orange frog feet under very wide chrome bell-bottoms with a dark inner fold.
  shoe: (p, k, c) => [k.dot(-2.6, 2.4, 1.5, c('#d8743a')), k.dot(0, 2.8, 1.6, c('#e8894a')), k.dot(2.6, 2.4, 1.5, c('#d8743a')), k.poly([[-2.4, -0.2], [2.4, -0.2], [3, 2.2], [-3, 2.2]], c('#e8894a')),
    k.poly([[-2, -4], [2, -4], [4.6, 1], [-4.6, 1]], c(CHROME)), k.poly([[-0.4, -3.6], [0.4, -3.6], [1, 1], [-1, 1]], c('#9aa0b8')), k.poly([[-4.6, 0.3], [4.6, 0.3], [4.6, 1], [-4.6, 1]], c('#8e94ac'))],
};

// The toad outfit with the shades pushed up onto the head, so the eyes show.
OUTFITS.toadup = { ...OUTFITS.toad, hat: () => OUTFITS.toad.hat().map((h) => (h.t === 'p' ? { ...h, pts: h.pts.map(([x, y]) => [15.5 + (x - 15.5) * 0.92, y - 8.4]) } : { ...h, y: h.y - 8.4 })) };

// The frog backup dancers' outfit: a frog onesie. A green hood with two big bulging frog eyes on
// top and a pink-cheeked rim around the face, a green suit with a pale yellow belly, a white disco
// collar peeking out at the neck, and webbed green frog feet.
const FROG = '#5fc24a';
const FROG_DK = '#3f9a34';
const FROG_LT = '#9be07a';
const BELLY = '#f4f0b0';
OUTFITS.frogdancer = {
  hat: () => [
    // The hood dome, its rim around the face, and a shine.
    E(15.5, 8.8, 12.4, 9.4, FROG), F(E(13, 4.4, 5, 2, FROG_LT)),
    F(T([[3.4, 12], [6, 9.8], [25, 9.8], [27.6, 12], [27, 13.6], [4, 13.6]], FROG_DK)),
    // The bulging eyes: green domes with white eyes and big black pupils, and a highlight.
    E(8.4, 1.2, 4.2, 3.8, FROG), E(22.6, 1.2, 4.2, 3.8, FROG),
    F(E(8.4, 1, 3, 2.8, '#ffffff')), F(E(22.6, 1, 3, 2.8, '#ffffff')),
    F(E(8.9, 1.3, 1.6, 1.8, '#1a1a1a')), F(E(22.1, 1.3, 1.6, 1.8, '#1a1a1a')),
    F(E(9.4, 0.5, 0.6, 0.6, '#ffffff')), F(E(22.6, 0.5, 0.6, 0.6, '#ffffff')),
    // Pink cheek spots on the hood's sides.
    F(E(5, 15, 1.4, 1, '#ff9ab4')), F(E(26, 15, 1.4, 1, '#ff9ab4')),
  ],
  top: () => [T(TORSO, FROG),
    // The pale belly and a white disco collar at the neck.
    F(E(MID, 31.4, 4.2, 4.6, BELLY)), F(R(MID - 2.6, 29, 5.2, 0.4, '#e2dc98')), F(R(MID - 2.8, 31.4, 5.6, 0.4, '#e2dc98')), F(R(MID - 2.6, 33.6, 5.2, 0.4, '#e2dc98')),
    T([[MID - 2.6, 25], [MID - 6, 26.4], [MID - 1.4, 28.6]], '#ffffff'), T([[MID + 2.6, 25], [MID + 6, 26.4], [MID + 1.4, 28.6]], '#ffffff'),
    // Darker spots on the back and shoulders.
    F(E(10.6, 28, 1.2, 0.9, FROG_DK)), F(E(20.6, 30, 1, 0.8, FROG_DK)), F(E(11.4, 33.4, 0.9, 0.7, FROG_DK))],
  sleeve: () => FROG,
  long: true,
  shoulder: () => [E(0, 1, 2.6, 2.4, FROG), F(E(0.4, 0.2, 1, 0.5, FROG_LT))],
  legs: () => ({ top: FROG, low: FROG, pad: FROG_DK }),
  skirt: () => [],
  // Webbed frog feet: three round toes.
  shoe: (p, k, c) => [k.dot(-2.6, 2.2, 1.5, c(FROG_DK)), k.dot(0, 2.6, 1.6, c(FROG)), k.dot(2.6, 2.2, 1.5, c(FROG_DK)), k.poly([[-2.4, -0.6], [2.4, -0.6], [3, 2], [-3, 2]], c(FROG))],
};

// The basics under the outfit, shown wherever a top, bottoms or shoes are taken off: a soft
// pink tank top with a deeper pink trim and a tiny bow, lavender shorts, and plain slip-on flats. Not a
// pickable outfit.
const BASIC_TOP = '#ffcfe2';
const BASIC_TRIM = '#ff94bf';
const BASIC_SHORTS = '#c9b8f0';
const BASIC_SHORTS_DARK = '#a896d8';
const BASICS = {
  top: (p) => [T(TORSO, BASIC_TOP), T([[11.8, 24.6], [19.2, 24.6], [18.4, 27.6], [MID, 28.6], [12.6, 27.6]], p.skin),
    F(limb(12.4, 24.6, 13, 27.6, 0.5, 0.5, BASIC_TRIM)), F(limb(18.6, 24.6, 18, 27.6, 0.5, 0.5, BASIC_TRIM)),
    band(TORSO, 34.9, 35.8, BASIC_TRIM), ...bow(MID, 28.6, 0.9, BASIC_TRIM, shade(BASIC_TRIM, -20))],
  sleeve: (p) => p.skin,
  legs: (p, skin) => ({ top: BASIC_SHORTS, low: skin, pad: null }),
  skirt: () => [F(R(10, 34.6, 11.2, 0.7, BASIC_SHORTS_DARK)), F(R(MID - 0.25, 35.4, 0.5, 2, BASIC_SHORTS_DARK))],
  shoe: (p, k, c) => [k.sole(c('#f4eefa')), k.poly([[-3, 2], [3, 2], [2.8, 3], [-2.8, 3]], c('#c9bde0')), k.dot(0.8, -0.2, 0.55, c(BASIC_TRIM))],
};

export const STARTER_OUTFITS = Object.keys(OUTFITS);
const of = (t) => (t === 'basics' ? BASICS : OUTFITS[t] ?? OUTFITS.casual);

export default {
  hat: (t, p, m) => of(t).hat?.(p, m) ?? [],
  hatBack: (t, p, m) => of(t).hatBack?.(p, m) ?? [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  top: (t, p) => of(t).top(p),
  sleeve: (t, p) => of(t).sleeve(p),
  longSleeves: (t) => Boolean(of(t).long),
  shoulder: (t, p, side) => of(t).shoulder?.(p, side) ?? [],
  legs: (t, p, skin) => of(t).legs(p, skin),
  skirt: (t, p) => {
    const out = of(t).skirt?.(p) ?? [];
    return out.length ? out : null;
  },
  shoe: (t, p, k) => of(t).shoe(p, k, k.tint),
  hand: (t, p, hx, hy) => [E(hx, hy, 2, 2, p.skin)],
  cape: (t, p) => of(t).back?.(p) ?? [],
  capeFront: (t, p) => of(t).front?.(p) ?? [],
};

// Whether an outfit has a back piece (a hood, a bow), so the renderer only asks for those.
export const starterHasBack = (t) => Boolean(of(t).back);
// Whether an outfit comes with a hat or face accessory.
export const starterHasHat = (t) => Boolean(of(t).hat);
