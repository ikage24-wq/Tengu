// Outfits for the Shrine Maiden's kitsune guardian (render/kitsune.js), drawn on the hero's body
// like the starter outfits (jobgear/starter.js, which looks them up here) but never offered in the
// character creator. Each is in her colours (white, vermilion, gold, with black lacquer) and made
// for a cold, strong warlord of a fox: no coats.
//   battlemiko   her shrine maiden's dress made for war: a black-lacquer pauldron on her weapon
//                arm, armoured waist plates, shin guards and a white headband with long tails
//   foxsamurai   an onna-musha: a vermilion lacquered chest plate, shoulder plates and skirt plates
//                over white, black armoured sleeves, and a gold fox-ear crest on her brow
//   shrinequeen  layered crimson and white robes with long sleeves, a gold obi with a hanging
//                knot, and gold hair ornaments trailing red tassels with bells
//   foxdemon     black and crimson with silver fox-fire embroidery, her weapon arm bare to the
//                shoulder and marked in vermilion, bandaged forearms, a fox mask tied at the side of her head

import { R, E, T, F } from '../pixel.js';
import { torsoPts, MID, limb } from '../figure.js';
import { flower } from './casual.js';

const WHITE = '#ffffff';
const SHADE = '#ddd6ee';
const VER = '#d8352c';
const VER_DK = '#8e1c16';
const VER_LT = '#ff7a6a';
const GOLD = '#f2c94c';
const GOLD_DK = '#a8781a';
const LACQ = '#26202e';
const LACQ_LT = '#4a4058';
const CRIM = '#a01c22';
const CRIM_DK = '#5e0e12';
const SILVER = '#c9d2e6';
const BANDAGE = '#efe9e2';
const PINK = '#f6c9c2';
const TORSO = torsoPts();
const loose = (y1, flare = 0.6) => [...TORSO.slice(0, 6), [21.6 + flare, y1], [9.4 - flare, y1], ...TORSO.slice(8)];

// A wide sleeve's mouth at the wrist (`main` outside, `lining` inside, `cord` round its edge), and
// the hand out of it.
function sleeveMouth(p, hx, hy, ex, ey, main, lining, cord, wide = 1) {
  const l = Math.hypot(hx - ex, hy - ey) || 1;
  const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
  const at = (a, b) => [hx + ux * a - uy * b, hy + uy * a + ux * b];
  return [T([at(-3, -2.2 * wide), at(-3, 2.2 * wide), at(-0.2, 3.4 * wide), at(0.6, 2 * wide), at(0.6, -2 * wide), at(-0.2, -3.4 * wide)], main),
    F(T([at(-0.4, -2.8 * wide), at(0.4, -1.8 * wide), at(0.4, 1.8 * wide), at(-0.4, 2.8 * wide), at(-0.8, 0)], lining)),
    F(limb(...at(-0.2, -3.2 * wide), ...at(-0.2, 3.2 * wide), 0.45, 0.45, cord)),
    F(E(...at(1.6, 0), 1.1, 1.15, p.skin))];
}
// Bandages wound round the forearm just above the hand, and the hand.
function bandaged(p, hx, hy, ex, ey) {
  const l = Math.hypot(hx - ex, hy - ey) || 1;
  const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
  const at = (a, b) => [hx + ux * a - uy * b, hy + uy * a + ux * b];
  return [...[-3, -2, -1].map((a) => F(limb(...at(a, -1.3), ...at(a + 0.5, 1.3), 0.55, 0.55, BANDAGE))),
    F(limb(...at(-0.6, 1.2), ...at(-2.2, 2.6), 0.35, 0.25, BANDAGE)), E(hx + ux * 0.4, hy + uy * 0.4, 1.9, 1.9, p.skin)];
}
// Hakama to `len` (two wide pleated legs, a seam where they part) in `c`, its folds in `d`.
function hakama(c, d, len = 52, hi = '#ff7a7a') {
  const out = [T([[9.2, 34.6], [22, 34.6], [24.4, len], [16.2, len], [15.6, len - 8], [15, len], [6.8, len]], c),
    F(R(6.8, len - 1.2, 17.6, 1.2, d)), F(limb(MID, 38, MID, len - 0.4, 0.6, 0.6, d))];
  for (const x of [10.6, 12.8, 18.2, 20.6]) out.push(F(limb(x, 35.4, x + (x - MID) * 0.32, len - 0.4, 0.5, 0.7, d)));
  if (hi) out.push(F(limb(11.6, 35.6, 11.2, len - 1.4, 0.3, 0.3, hi)), F(limb(19.6, 35.6, 20.4, len - 1.4, 0.3, 0.3, hi)));
  return out;
}
const zori = (p, k, c, thong = VER) => [k.poly([[-2.4, 1.8], [2.8, 1.8], [3.2, 3], [-2.6, 3]], c('#d9b88a')), k.poly([[-1.8, -1.2], [1.8, -1.2], [2.4, 1.8], [-2, 1.8]], c(WHITE)),
  k.poly([[0.2, -0.6], [0.8, -0.6], [1.6, 1.8], [-0.6, 1.8]], c(thong))];
const boot = (p, k, c, col = LACQ) => [k.poly([[-2.4, -1.4], [2, -1.4], [3.2, 1.8], [3.2, 3], [-2.6, 3]], c(col)), k.poly([[-2.4, 2.2], [3.2, 2.2], [3.2, 3], [-2.6, 3]], c('#120e16'))];

export const GUARDIAN_OUTFITS = {
  battlemiko: {
    top: (p) => [T(loose(35, 0.8), WHITE),
      T([[MID - 3.4, 25.6], [MID + 3.4, 25.6], [MID, 30.6]], VER), T([[MID + 1.6, 25.6], [MID + 4, 25.6], [MID + 0.2, 31], [MID - 1.4, 31]], WHITE),
      F(limb(MID + 3.8, 25.7, MID, 30.8, 0.55, 0.55, SHADE)), F(limb(MID - 3.4, 25.7, MID - 0.6, 29.8, 0.5, 0.5, SHADE)),
      // A tasuki cord crossing her chest (sleeves tied back to fight).
      F(limb(10.4, 27, 21, 32.4, 0.55, 0.55, VER)), F(limb(21, 27, 10.6, 32.4, 0.45, 0.45, VER_DK)),
      // Waist armour: black-lacquer plates laced in gold over the hakama's waist.
      T([[8.8, 31], [22.4, 31], [22.8, 36.4], [8.4, 36.4]], LACQ), F(R(8.8, 32.6, 13.8, 0.6, GOLD)), F(R(8.6, 34.6, 14.1, 0.5, GOLD_DK)),
      ...[11.6, 15.6, 19.6].map((x) => F(R(x, 31.2, 0.4, 5, LACQ_LT)))],
    sleeve: () => WHITE,
    long: true,
    // Her weapon arm (the front) has a black-lacquer pauldron edged in gold; the other a white sleeve.
    shoulder: (p, side) => (side > 0
      ? [E(0.2, 0.6, 3.9, 3.3, LACQ), F(E(0.2, -0.4, 3.2, 1.6, LACQ_LT)), F(limb(-3.4, 2.4, 3.8, 2.4, 0.6, 0.6, GOLD)), F(limb(-2.6, 3.8, 3, 3.8, 0.45, 0.45, GOLD_DK))]
      : [E(0, 1, 3, 2.6, WHITE), F(E(0, 2.6, 2.4, 0.6, SHADE))]),
    hand: (p, hx, hy, ex, ey) => sleeveMouth(p, hx, hy, ex, ey, WHITE, SHADE, VER, 0.8),
    legs: () => ({ top: WHITE, low: LACQ, pad: GOLD }),
    skirt: () => hakama(VER, VER_DK, 47),
    shoe: (p, k, c) => boot(p, k, c),
    // A white headband (hachimaki) tied at the back, its long tails streaming behind her.
    hat: () => [R(3.4, 6.2, 24.4, 2.2, WHITE), F(R(3.4, 7.8, 24.4, 0.5, SHADE)), F(E(15.5, 7.3, 1.2, 0.9, VER))],
    hatBack: (p, m) => [T([[4, 6.6], [4, 8.2], [-4 + (m.sway ?? 0), 15], [-6 + (m.sway ?? 0), 13.6]], WHITE), T([[4, 7], [4.4, 8.4], [-1 + (m.sway ?? 0), 18.4], [-3 + (m.sway ?? 0), 17.6]], SHADE)],
  },

  foxsamurai: {
    top: (p) => [T(TORSO, WHITE),
      // The dō: a vermilion lacquered chest plate laced across in gold, black at its top edge.
      T([[9.8, 27.2], [21.4, 27.2], [21.8, 34.6], [9.4, 34.6]], VER), F(R(9.8, 27.2, 11.6, 1, LACQ)),
      ...[29.4, 31.2, 33].map((y) => F(R(10, y, 11.4, 0.45, GOLD))), F(E(MID, 30.3, 1.3, 1.1, GOLD)), F(E(MID, 30.3, 0.6, 0.5, VER_DK)),
      T([[MID - 2.4, 25.8], [MID + 2.4, 25.8], [MID, 27.6]], WHITE), F(R(9.4, 34.2, 12.4, 0.8, LACQ))],
    sleeve: () => LACQ,
    long: true,
    // Sode: square shoulder plates in vermilion lacquer, laced in gold, hanging over both arms.
    shoulder: (p, side) => [T([[-3.4, -1.2], [3.4, -1.2], [3.8, 5.2], [-3, 5.2]], side > 0 ? VER : VER_DK), F(R(-3.4, -1.2, 6.8, 0.9, LACQ)),
      ...[1.2, 2.8, 4.4].map((y) => F(R(-3.2, y, 6.8, 0.4, GOLD)))],
    legs: () => ({ top: WHITE, low: LACQ, pad: VER }),
    // Kusazuri: three rows of lacquered plates hanging from the waist over white hakama.
    skirt: () => {
      const out = [T([[9, 38], [22.4, 38], [24, 50], [16.2, 50], [15.6, 44], [15, 50], [7.2, 50]], WHITE), F(limb(MID, 42, MID, 49.6, 0.5, 0.5, SHADE))];
      [[35, 0], [38.2, 0.9], [41.4, 1.8]].forEach(([y, fl]) => {
        for (let i = 0; i < 4; i++) {
          const x0 = 8.6 - fl + i * (3.6 + fl * 0.5);
          out.push(T([[x0, y], [x0 + 3.4 + fl * 0.4, y], [x0 + 3.6 + fl * 0.5, y + 3.6], [x0 - 0.2, y + 3.6]], i % 2 ? VER : VER_DK), F(R(x0, y + 2.6, 3.4 + fl * 0.4, 0.4, GOLD)));
        }
      });
      return out;
    },
    shoe: (p, k, c) => boot(p, k, c),
    // A black-lacquer brow guard with a gold plate, and a tall gold crest of two fox ears.
    hat: () => [R(4.6, 6, 22, 2.4, LACQ), F(R(4.6, 6, 22, 0.5, LACQ_LT)), R(12.4, 5.2, 6.2, 3.6, GOLD), F(R(12.8, 7.6, 5.4, 0.6, GOLD_DK)),
      // The crest: a gold crescent sweeping up into two fox-ear points, lined in vermilion.
      T([[15.5, 5.4], [13, 4.6], [10.4, 2.4], [8.6, -1.4], [8.2, -4.6], [10.4, -1.8], [12.6, 0.6], [15.5, 1.8], [18.4, 0.6], [20.6, -1.8], [22.8, -4.6], [22.4, -1.4], [20.6, 2.4], [18, 4.6]], GOLD),
      F(T([[15.5, 3.4], [12.8, 2.4], [10.6, 0.4], [9.4, -2.4], [11.2, -0.6], [13.4, 1.2], [15.5, 2.4], [17.6, 1.2], [19.8, -0.6], [21.6, -2.4], [20.4, 0.4], [18.2, 2.4]], VER)),
      F(E(15.5, 4.2, 1, 0.9, VER_DK))],
  },

  shrinequeen: {
    top: (p) => [T(loose(35, 1), VER),
      // Her layers at the collar: white, then pale pink, crossed over.
      T([[MID - 3.8, 25.6], [MID + 3.8, 25.6], [MID, 31.6]], WHITE), T([[MID - 2.4, 25.6], [MID + 2.4, 25.6], [MID, 29.4]], PINK), T([[MID - 1.2, 25.6], [MID + 1.2, 25.6], [MID, 27.6]], VER),
      F(limb(MID + 4, 25.7, MID, 31.6, 0.55, 0.55, VER_DK)),
      // A wide gold obi with a red cord round it, its knot hanging in front with two tassels.
      T([[8.8, 30.8], [22.4, 30.8], [22.6, 35.4], [8.6, 35.4]], GOLD), F(R(8.8, 32.8, 13.8, 0.6, VER)), F(R(8.8, 31.2, 13.8, 0.4, GOLD_DK)),
      F(E(MID + 1, 33.1, 1.2, 1, VER_DK)), F(limb(MID + 0.6, 33.6, MID - 0.4, 38.4, 0.5, 0.4, VER)), F(limb(MID + 1.4, 33.6, MID + 2.4, 38, 0.5, 0.4, VER)),
      F(E(MID - 0.4, 38.8, 0.6, 0.6, GOLD)), F(E(MID + 2.4, 38.4, 0.6, 0.6, GOLD))],
    sleeve: () => VER,
    long: true,
    shoulder: (p, side) => [E(0, 1, 3.4, 2.9, side > 0 ? VER : VER_DK), F(E(0, 2.8, 2.6, 0.6, VER_DK))],
    // Long, deep sleeves, crimson lined in white with a gold edge.
    hand: (p, hx, hy, ex, ey) => sleeveMouth(p, hx, hy, ex, ey, VER, WHITE, GOLD, 1.25),
    legs: () => ({ top: WHITE, low: WHITE, pad: null }),
    // Robes to the ankles: crimson over a white under-robe showing down the front, a gold hem.
    skirt: () => [T([[9, 34.6], [22.2, 34.6], [25.2, 54], [6, 54]], VER), T([[13.4, 35], [18.4, 35], [19.8, 54], [12.2, 54]], WHITE),
      F(limb(13.6, 35.4, 12.6, 53.6, 0.5, 0.5, PINK)), F(R(6, 52.6, 19.2, 1.2, GOLD)), F(limb(9.8, 36, 7.4, 52.4, 0.4, 0.6, VER_DK)), F(limb(21.4, 36, 24, 52.4, 0.4, 0.6, VER_DK))],
    shoe: (p, k, c) => zori(p, k, c, GOLD),
    // Gold hair ornaments (kanzashi) at each side trailing red tassels with gold bells, and a
    // small gold crest at her crown.
    hat: () => [...flower(5.4, 8.6, 1.9, GOLD, VER), ...flower(25.6, 8.6, 1.9, GOLD, VER),
      F(limb(5.4, 10.2, 4.8, 16, 0.45, 0.35, VER)), F(limb(5.8, 10.2, 6.6, 15, 0.45, 0.35, VER)), F(E(4.8, 16.4, 0.7, 0.7, GOLD)), F(E(6.6, 15.4, 0.7, 0.7, GOLD)),
      F(limb(25.6, 10.2, 26.2, 16, 0.45, 0.35, VER)), F(limb(25.2, 10.2, 24.4, 15, 0.45, 0.35, VER)), F(E(26.2, 16.4, 0.7, 0.7, GOLD)), F(E(24.4, 15.4, 0.7, 0.7, GOLD)),
      T([[12.6, 4.6], [15.5, 1], [18.4, 4.6], [15.5, 3.6]], GOLD), F(E(15.5, 3.4, 0.7, 0.7, VER))],
  },

  foxdemon: {
    top: (p) => [T(TORSO, p.skin),
      // Black, cut away from her weapon-arm shoulder, fox fire stitched in silver; a crimson sash.
      T([[9.9, 27.8], [10.9, 26.8], [14.2, 26.4], [21.4, 31], [21.5, 35.8], [9.5, 35.8], [9.7, 29.6]], LACQ),
      F(limb(14.2, 26.6, 21.2, 31.2, 0.4, 0.4, CRIM)),
      F(limb(11.4, 29.4, 12.6, 31.6, 0.35, 0.35, SILVER)), F(limb(12.6, 31.6, 14.2, 30.4, 0.35, 0.35, SILVER)), F(limb(14.2, 30.4, 13.4, 28.8, 0.3, 0.3, SILVER)),
      F(limb(16.6, 32.6, 18, 34, 0.35, 0.35, SILVER)), F(limb(18, 34, 19.4, 32.8, 0.3, 0.3, SILVER)),
      T([[9.2, 33.6], [22, 33.6], [22.2, 35.8], [9, 35.8]], CRIM), F(limb(10.8, 35.6, 9.8, 39.4, 0.6, 0.3, CRIM))],
    sleeve: (p) => p.skin,
    // The weapon arm bare, three vermilion marks clawed down its shoulder; the other in black.
    shoulder: (p, side) => (side > 0
      ? [E(0, 0.8, 2.9, 2.5, p.skin), F(limb(-1.6, -0.6, -0.6, 2.6, 0.45, 0.25, VER)), F(limb(0, -0.8, 0.8, 2.8, 0.45, 0.25, VER)), F(limb(1.4, -0.4, 2, 2.2, 0.4, 0.2, VER))]
      : [E(0, 1, 3, 2.6, LACQ), F(E(0, 2.6, 2.4, 0.6, LACQ_LT))]),
    hand: (p, hx, hy, ex, ey) => bandaged(p, hx, hy, ex, ey),
    legs: () => ({ top: LACQ, low: LACQ, pad: null }),
    skirt: () => hakama(CRIM, CRIM_DK, 52, '#d8454a'),
    shoe: (p, k, c) => boot(p, k, c),
    // A white fox mask tied at the side of her head (the back, so it shows), marked in vermilion.
    hat: () => [E(5.6, 7.6, 4, 4.4, SHADE), E(5.8, 7.2, 3.6, 4, WHITE),
      T([[3.2, 4.2], [2.2, -0.2], [4.8, 3]], WHITE), T([[8.2, 4], [9, -0.4], [6.6, 3]], WHITE), F(T([[3.2, 3.4], [2.8, 1.2], [4.2, 2.8]], VER)), F(T([[8.2, 3.2], [8.6, 1], [7.2, 2.6]], VER)),
      F(limb(3.8, 6.6, 5.2, 7.4, 0.45, 0.3, VER)), F(limb(7.8, 6.6, 6.4, 7.4, 0.45, 0.3, VER)), F(E(5.8, 9.8, 0.7, 0.55, CRIM)), F(limb(5.8, 3.6, 5.8, 5.4, 0.4, 0.2, VER)),
      F(limb(9, 8.6, 12, 7, 0.4, 0.4, CRIM))],
  },
};
export const GUARDIAN_OUTFIT_KEYS = Object.keys(GUARDIAN_OUTFITS);
