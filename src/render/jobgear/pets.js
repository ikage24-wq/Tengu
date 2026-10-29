// Outfits for the pets (the Mochi), drawn on the hero's body like the starter outfits
// (jobgear/starter.js looks them up here) but never offered in the character creator. One per
// form a Mochi can grow into, each in its own colours with the form's own features (a hood's
// ears, a clover band, little horns, a spirit flame, wings) as its `hat` and `back`:
//   petbaby    a cream romper with a pink bib and a little gold bell, round paw mittens and
//              booties: what every Mochi hatches in
//   petswift   a mint running jacket with a clover patch, shorts, a cottontail, sneakers, and a
//              sweatband with a clover on it
//   petstrong  a tangerine festival happi tied with a white rope, wrapped shorts, big fluffy paw
//              mitts, a red headband and two little nubby horns
//   petspirit  a lavender shrine dress: white wide sleeves over a short violet hakama, tiny geta,
//              and a spirit flame floating over her head
//   petsky     a sky-blue capelet with a feather trim over a white smock, cloud-puff boots and
//              a feather tucked behind one ear (her wings are drawn live, flapping: render/mochi.js)

import { R, E, T, F, shade } from '../pixel.js';
import { torsoPts, MID, limb } from '../figure.js';

const TORSO = torsoPts();
const WHITE = '#fffdfb';
const GOLD = '#f2c94c';
const GOLD_DK = '#b88a22';

// A round paw: a mitten at the hand with three pads.
function paw(hx, hy, ex, ey, c, pad) {
  const l = Math.hypot(hx - ex, hy - ey) || 1;
  const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
  return [E(hx + ux * 0.6, hy + uy * 0.6, 2.4, 2.3, c), F(E(hx + ux * 1.6, hy + uy * 1.6 - 0.6, 0.6, 0.55, pad)), F(E(hx + ux * 1.6 + 0.9, hy + uy * 1.6, 0.55, 0.5, pad)), F(E(hx + ux * 1.6 - 0.9, hy + uy * 1.6, 0.55, 0.5, pad))];
}
// A plain top to the waist, in one colour with a trim along the hem.
const tunic = (main, trim) => [T([...TORSO.slice(0, 6), [22.4, 36], [8.8, 36], ...TORSO.slice(8)], main), F(R(8.8, 34.6, 13.6, 1.4, trim))];
// A short puffy bottom (shorts or a romper's legs) to the thigh.
const puffs = (c, line) => [T([[8.8, 34.4], [22.4, 34.4], [23, 41.6], [16.6, 41.6], [15.6, 38.6], [14.6, 41.6], [8.2, 41.6]], c), F(limb(15.6, 35.6, 15.6, 38.4, 0.35, 0.35, line))];
// A four-leaf clover at (x, y).
const clover = (x, y, r) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => F(E(x + a * r * 0.55, y + b * r * 0.55, r * 0.6, r * 0.6, '#5fbf6a'))).concat([F(E(x, y, r * 0.25, r * 0.25, '#3f9a4f'))]);
// A spirit flame: a teardrop of violet light with a white core.
const flame = (x, y, s) => [F(T([[x, y - 4.4 * s], [x + 2 * s, y - 1.6 * s], [x + 1.6 * s, y + 0.8 * s], [x, y + 1.6 * s], [x - 1.6 * s, y + 0.8 * s], [x - 2 * s, y - 1.6 * s]], '#c9b6ff')),
  F(T([[x, y - 2.6 * s], [x + 1 * s, y - 0.8 * s], [x, y + 0.8 * s], [x - 1 * s, y - 0.8 * s]], '#ffffff'))];
export const PET_OUTFITS = {
  petbaby: {
    top: () => [...tunic('#fff4ec', '#ffd3e2'), T([[11.4, 26], [19.8, 26], [19, 31.4], [15.6, 32.6], [12.2, 31.4]], '#ffc2d8'),
      F(limb(11.6, 26.2, 19.6, 26.2, 0.4, 0.4, '#f09ab8')), F(E(MID, 29, 1.2, 1.2, GOLD)), F(E(MID, 29.6, 0.4, 0.3, GOLD_DK))],
    sleeve: () => '#fff4ec',
    shoulder: (p, side) => [E(0, 1, 2.8, 2.4, side > 0 ? '#fff4ec' : '#f2e2d6')],
    hand: (p, hx, hy, ex, ey) => paw(hx, hy, ex, ey, '#fff4ec', '#ffb3cc'),
    legs: (p, skin) => ({ top: skin, low: skin, pad: null }),
    skirt: () => puffs('#fff4ec', '#f2e2d6'),
    shoe: (p, k, c) => [k.poly([[-2.6, -1.2], [2.8, -1.2], [3.2, 2.6], [-2.8, 2.6]], c('#fff4ec')), k.dot(0.4, 1.6, 0.7, c('#ffb3cc'))],
  },
  petswift: {
    top: () => [...tunic('#9be8b4', '#ffffff'), F(limb(MID, 25.8, MID, 35, 0.35, 0.35, '#4fae6f')), F(R(MID - 0.8, 27.6, 1.6, 0.8, '#d8d8d8')), ...clover(19.6, 30.4, 1.5)],
    sleeve: () => '#9be8b4',
    long: true,
    shoulder: (p, side) => [E(0, 1, 2.8, 2.5, side > 0 ? '#9be8b4' : '#7fcf98'), F(limb(-2.4, 2.4, 2.4, 2.4, 0.4, 0.4, '#ffffff'))],
    legs: (p, skin) => ({ top: skin, low: skin, pad: null }),
    // Running shorts with a white stripe, and a cottontail at the back.
    skirt: () => [...puffs('#4fae6f', '#3f8f5a'), F(limb(22, 35, 22.8, 41.2, 0.4, 0.4, '#ffffff')), E(23.6, 36, 2, 1.9, '#ffffff'), F(E(24, 35.6, 0.9, 0.8, '#f0f0f0'))],
    shoe: (p, k, c) => [k.sole(c('#ffffff')), k.poly([[-2.8, -0.8], [2.8, -0.8], [3, 1.6], [-2.8, 1.6]], c('#ff8fb0')), k.poly([[-2.6, 0.2], [0.4, 0.2], [0.4, 0.8], [-2.6, 0.8]], c('#ffffff'))],
    // A sweatband round the brow with a clover on it.
    hat: () => [F(limb(6.4, 9.6, 24.6, 9.6, 1.2, 1.2, '#ff8fb0')), F(limb(6.4, 9.6, 24.6, 9.6, 0.4, 0.4, '#ffffff')), ...clover(22, 9.2, 1.6)],
  },
  petstrong: {
    top: () => [...tunic('#ffa45c', '#ffffff'), T([[MID - 3.4, 25.6], [MID + 3.4, 25.6], [MID, 31]], '#ffffff'), F(limb(MID + 3.6, 25.8, MID, 31.6, 0.6, 0.6, '#e07a2a')),
      F(limb(8.8, 33.6, 22.4, 33.4, 0.9, 0.9, '#ffffff')), F(E(19.4, 33.4, 1.2, 0.9, '#ffffff')), F(limb(19.4, 33.6, 20.4, 36, 0.4, 0.3, '#ffffff'))],
    sleeve: () => '#ffa45c',
    shoulder: (p, side) => [E(0, 1, 3, 2.7, side > 0 ? '#ffa45c' : '#e8853a'), F(limb(-2.6, 2.6, 2.6, 2.6, 0.5, 0.5, '#ffffff'))],
    // Big fluffy paw mitts.
    hand: (p, hx, hy, ex, ey) => [E(hx, hy, 3, 2.9, '#ffe2c4'), ...paw(hx, hy, ex, ey, '#ffd2a6', '#e8853a')],
    legs: (p, skin) => ({ top: skin, low: skin, pad: null }),
    skirt: () => [...puffs('#ffffff', '#e8e0d8'), F(limb(9.4, 40, 22, 40, 0.4, 0.4, '#e8e0d8'))],
    shoe: (p, k, c) => [k.poly([[-2.4, 1.4], [2.8, 1.4], [3.2, 2.8], [-2.6, 2.8]], c('#8a5a34')), k.poly([[-2.2, -0.8], [2.6, -0.8], [2.8, 1.4], [-2.4, 1.4]], c('#ffffff'))],
    // A red headband knotted at the side, and two little nubby horns.
    hat: () => [F(limb(6.2, 9.4, 24.8, 9.4, 1.1, 1.1, '#e8402c')), F(T([[6, 9], [3.4, 7], [3.2, 11]], '#e8402c')), F(T([[6, 9.6], [3.6, 12.4], [5.2, 13]], '#c8301c')),
      ...[[10.6, 2.4, -1.2], [20.6, 2.4, 1.2]].flatMap(([x, y, b]) => [F(T([[x - 2.2, y + 1.6], [x + 2.2, y + 1.6], [x + 0.8 + b, y - 3.6], [x - 0.8 + b, y - 3.8]], '#8a5a34')), F(T([[x - 1.6, y + 1.2], [x + 1.6, y + 1.2], [x + 0.5 + b, y - 2.8], [x - 0.5 + b, y - 3]], '#fff3d6')), F(limb(x - 1.4, y + 0.2, x + 1.4, y + 0.2, 0.3, 0.3, '#d8b88a'))])],
  },
  petspirit: {
    top: () => [...tunic('#ffffff', '#efe6ff'), T([[MID - 3.4, 25.6], [MID + 3.4, 25.6], [MID, 31]], '#b48cff'), F(limb(MID + 3.6, 25.8, MID, 31.6, 0.5, 0.5, '#d9d0ec')),
      F(R(8.8, 33.4, 13.6, 1.6, '#7a52cc'))],
    sleeve: () => '#ffffff',
    long: true,
    shoulder: (p, side) => [E(0, 1, 3.2, 2.8, side > 0 ? '#ffffff' : '#ece4f8')],
    // Wide white sleeves lined violet.
    hand: (p, hx, hy, ex, ey) => {
      const l = Math.hypot(hx - ex, hy - ey) || 1;
      const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
      const at = (a, b) => [hx + ux * a - uy * b, hy + uy * a + ux * b];
      return [T([at(-3, -2.8), at(-3, 2.8), at(-0.2, 3.8), at(0.6, 2.2), at(0.6, -2.2), at(-0.2, -3.8)], '#ffffff'), F(T([at(-0.4, -3), at(0.4, -2), at(0.4, 2), at(-0.4, 3), at(-0.8, 0)], '#c9b6ff')),
        E(...at(1.6, 0), 1.2, 1.25, p.skin)];
    },
    legs: (p, skin) => ({ top: skin, low: skin, pad: null }),
    // A short violet hakama, pleated.
    skirt: () => [T([[8.8, 34.6], [22.4, 34.6], [24, 44.6], [7.2, 44.6]], '#9b72e8'), F(limb(12.4, 35.4, 11.4, 44.2, 0.4, 0.5, '#7a52cc')), F(limb(MID, 35.4, MID, 44.2, 0.4, 0.5, '#7a52cc')),
      F(limb(18.8, 35.4, 19.8, 44.2, 0.4, 0.5, '#7a52cc')), F(R(7.2, 43.8, 16.8, 0.8, '#6a44b8'))],
    shoe: (p, k, c) => [k.poly([[-2.4, 1.6], [2.8, 1.6], [2.8, 2.6], [-2.4, 2.6]], c('#5a3a2a')), k.poly([[-2, -0.8], [2.4, -0.8], [2.6, 1.6], [-2.2, 1.6]], c('#ffffff')), k.poly([[0.2, -0.4], [0.8, -0.4], [1.4, 1.6], [-0.4, 1.6]], c('#b48cff'))],
    // A spirit flame floating over her head.
    hat: () => flame(15.5, -4.6, 1),
  },
  petsky: {
    top: () => [...tunic('#ffffff', '#cfe4ff'), T([[8.4, 25.4], [22.8, 25.4], [24, 31.4], [20, 30.2], [15.6, 31.6], [11.2, 30.2], [7.2, 31.4]], '#7fb8ff'),
      ...[9.4, 12.6, 15.6, 18.6, 21.8].map((x) => F(T([[x - 1.1, 30.4], [x + 1.1, 30.4], [x, 32.6]], '#ffffff'))), F(E(MID, 26.2, 1.2, 1, GOLD))],
    sleeve: () => '#ffffff',
    shoulder: (p, side) => [E(0, 1, 3, 2.6, side > 0 ? '#7fb8ff' : '#5f98e0')],
    legs: (p, skin) => ({ top: skin, low: skin, pad: null }),
    // A short white smock, flared.
    skirt: () => [T([[9, 34.4], [22.2, 34.4], [24, 42.4], [7.2, 42.4]], '#ffffff'), F(R(7.2, 41.4, 16.8, 1, '#cfe4ff'))],
    // Cloud-puff boots.
    shoe: (p, k, c) => [k.poly([[-2.6, -1.4], [2.8, -1.4], [3.2, 2.6], [-2.8, 2.6]], c('#eaf4ff')), k.dot(-1.4, -1.4, 1.1, c('#ffffff')), k.dot(1, -1.6, 1.2, c('#ffffff'))],
    // A feather tucked behind the near ear.
    hat: () => [F(T([[22.6, 8.6], [27.8, 1.6], [28.6, 2.4], [23.8, 9.4]], '#ffffff')), F(limb(23, 9, 28.2, 2, 0.25, 0.2, '#7fb8ff'))],
  },
};
export const PET_OUTFIT_KEYS = Object.keys(PET_OUTFITS);
