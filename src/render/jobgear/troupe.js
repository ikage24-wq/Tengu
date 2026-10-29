// Outfits for the Onmyoji's yokai troupe (docs/design/spirit-mage-paths.md), drawn on the hero's
// body like the starter outfits (jobgear/starter.js looks them up here) but never offered in the
// character creator. Each yokai's horns, masks and the like come with its outfit (`hat`).
//
// The oni, three designs to pick from:
//   oniclassic   a tiger-skin loincloth and a tiger pelt slung over one shoulder, a thick sacred
//                rope for a belt with paper streamers, gold arm rings, bare chest; two yellow horns
//   onifestival  a festival drummer: a short sleeveless indigo happi tied with a white rope, white
//                wrapped shorts, a red headband, a ring of little taiko drums on his back; one big
//                horn in the middle of his brow
//   oniwarrior   a war oni: black-lacquer shoulder and shin plates over ragged dark hakama, a
//                straw rope belt, bare arms; two long curved horns

import { R, E, T, F, shade } from '../pixel.js';
import { torsoPts, MID, limb } from '../figure.js';

const TORSO = torsoPts();
const TIGER = '#f2a93a';
const TIGER_DK = '#c97a1a';
const STRIPE = '#2a1e1a';
const ROPE = '#e8d9b0';
const ROPE_DK = '#b8a272';
const PAPER = '#ffffff';
const GOLD = '#f2c94c';
const GOLD_DK = '#a8781a';
const INDIGO = '#2e3a78';
const INDIGO_DK = '#1c2450';
const RED = '#d8352c';
const LACQ = '#26202e';
const LACQ_LT = '#4a4058';
const HAKAMA = '#3a3346';
const HAKAMA_DK = '#251f2e';
const HORN = '#f6e3a0';
const HORN_DK = '#c8a24a';
const HORN_TIP = '#fff6d8';

// A tiger-skin patch: the fur in `pts` with black stripes across it at the given rows.
const tiger = (pts, rows) => [T(pts, TIGER), ...rows.map(([x0, y0, x1, y1, w]) => F(limb(x0, y0, x1, y1, w, w * 0.4, STRIPE)))];
// A thick twisted rope across the waist (a sacred shimenawa), with paper streamers hanging from it.
function rope(y, c = ROPE, d = ROPE_DK, shide = true) {
  const out = [T([[8.6, y], [22.6, y - 0.2], [22.8, y + 1.8], [8.4, y + 2]], c)];
  for (let x = 9.2; x < 22.4; x += 1.4) out.push(F(limb(x, y + 0.1, x + 0.9, y + 1.8, 0.35, 0.35, d)));
  if (shide) {
    for (const x of [11.4, 15.6, 19.8]) {
      out.push(F(T([[x, y + 2], [x + 1.1, y + 2], [x + 1.1, y + 3.4], [x + 2, y + 3.4], [x + 2, y + 4.8], [x + 0.9, y + 4.8], [x + 0.9, y + 6], [x - 0.2, y + 6], [x - 0.2, y + 4.6], [x - 1, y + 4.6], [x - 1, y + 3.2], [x, y + 3.2]], PAPER)));
    }
  }
  return out;
}
// A horn from its base at (x, y), curving out by `bend` to its tip `h` up.
function horn(x, y, h, w, bend) {
  return [T([[x - w, y], [x + w, y], [x + w * 0.4 + bend * 0.6, y - h * 0.6], [x + bend, y - h], [x - w * 0.4 + bend * 0.5, y - h * 0.55]], HORN),
    F(limb(x - w * 0.6, y - 0.2, x + bend * 0.9, y - h * 0.92, 0.35, 0.2, HORN_DK)), F(E(x + bend, y - h + 0.4, w * 0.35, 0.6, HORN_TIP)),
    F(limb(x - w, y - 1, x + w, y - 1.2, 0.3, 0.3, HORN_DK)), F(limb(x - w * 0.85, y - 2.4, x + w * 0.85, y - 2.6, 0.3, 0.3, HORN_DK))];
}
const bareChest = (p) => [T(TORSO, p.skin), F(limb(12.6, 28.4, 15.2, 29.6, 0.4, 0.4, shade(p.skin, -22))), F(limb(18.6, 28.4, 16, 29.6, 0.4, 0.4, shade(p.skin, -22))),
  F(limb(MID, 30.6, MID, 33.8, 0.3, 0.3, shade(p.skin, -22)))];
const sandal = (p, k, c) => [k.poly([[-2.4, 1.8], [2.8, 1.8], [3.2, 3], [-2.6, 3]], c('#8a5a34')), k.poly([[0.2, -0.4], [0.8, -0.4], [1.6, 1.8], [-0.6, 1.8]], c(RED))];
const barefoot = (p, k, c) => [k.poly([[-2.2, -0.6], [2.6, -0.6], [3, 2.6], [-2.4, 2.6]], c(p.skin)), k.poly([[1.4, 1.6], [3, 1.6], [3, 2.6], [1.4, 2.6]], c(p.skin))];

export const TROUPE_OUTFITS = {
  oniclassic: {
    top: (p) => [...bareChest(p),
      // The tiger pelt slung over his near shoulder and across his chest.
      ...tiger([[18.6, 25.8], [21.8, 26.4], [14, 33.4], [10.4, 33.6]], [[19.4, 27.4, 17.6, 28.6, 0.7], [16.8, 29.6, 15, 30.8, 0.7], [14.2, 31.6, 12.6, 32.6, 0.6]]),
      ...rope(33.4)],
    sleeve: (p) => p.skin,
    shoulder: (p, side) => (side > 0 ? [E(0, 0.8, 3.2, 2.8, TIGER), F(limb(-1.6, -0.4, 0.8, 1.6, 0.6, 0.3, STRIPE)), F(limb(0.6, 1.6, 2.4, 2.8, 0.5, 0.2, STRIPE))] : [E(0, 1, 2.8, 2.4, p.skin)]),
    hand: (p, hx, hy, ex, ey) => {
      const l = Math.hypot(hx - ex, hy - ey) || 1;
      const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
      return [F(limb(hx - ux * 2.6 - uy * 1.3, hy - uy * 2.6 + ux * 1.3, hx - ux * 2.6 + uy * 1.3, hy - uy * 2.6 - ux * 1.3, 0.9, 0.9, GOLD)), E(hx + ux * 0.4, hy + uy * 0.4, 2.1, 2.1, p.skin)];
    },
    legs: (p, skin) => ({ top: skin, low: skin, pad: null }),
    skirt: () => tiger([[8.8, 35], [22.4, 35], [23.4, 42.6], [20, 41.6], [17.4, 43], [15, 41.8], [12.4, 43.2], [10, 41.8], [7.8, 42.8]],
      [[10.4, 36, 11.8, 38.6, 0.8], [14.6, 35.8, 15.6, 38.8, 0.8], [18.8, 35.8, 19.6, 38.6, 0.8], [21.4, 37, 22, 39.6, 0.6]]),
    shoe: barefoot,
    hat: () => [...horn(10.4, 5, 9, 2.2, -2), ...horn(20.6, 5, 9, 2.2, 2)],
  },

  onifestival: {
    top: (p) => [...bareChest(p),
      // A short sleeveless happi, open down the front, tied with a white rope.
      T([[9.6, 26.4], [13.6, 26.2], [12.6, 35.6], [9.4, 35.6]], INDIGO), T([[17.6, 26.2], [21.6, 26.4], [21.8, 35.6], [18.6, 35.6]], INDIGO),
      F(limb(13.2, 26.4, 12.4, 35.4, 0.6, 0.6, PAPER)), F(limb(18, 26.4, 19, 35.4, 0.6, 0.6, PAPER)),
      F(R(9.6, 30.4, 3, 0.4, INDIGO_DK)), F(R(18.8, 30.4, 3, 0.4, INDIGO_DK)),
      T([[8.6, 33.2], [22.6, 33], [22.8, 34.6], [8.4, 34.8]], PAPER), F(limb(19.2, 34.2, 20.4, 37.4, 0.5, 0.3, PAPER)), F(limb(19.8, 34.2, 21.6, 36.8, 0.5, 0.3, PAPER))],
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 3, 2.6, side > 0 ? INDIGO : INDIGO_DK), F(E(0, 2.6, 2.4, 0.5, PAPER))],
    legs: (p, skin) => ({ top: PAPER, low: skin, pad: null }),
    skirt: () => [T([[9, 34.8], [22.2, 34.8], [22.6, 40], [16, 40], [15.6, 38.4], [15.2, 40], [8.6, 40]], PAPER), F(limb(MID, 35.4, MID, 38.6, 0.5, 0.5, '#ddd6ee'))],
    shoe: sandal,
    // A red headband knotted at the side, and one big horn in the middle of his brow.
    hat: () => [...horn(15.5, 4.6, 11, 2.8, 1), R(4, 6.4, 23, 2.2, RED), F(R(4, 7.8, 23, 0.5, '#8e1c16'))],
    hatBack: (p, m) => [T([[4.4, 6.6], [4.4, 8.4], [-1 + (m.sway ?? 0), 12.4], [-2.6 + (m.sway ?? 0), 11]], RED)],
    // A ring of little taiko drums on his back, joined by a gold hoop.
    back: () => {
      const out = [];
      const cx = 10;
      const cy = 24;
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * (0.85 + (i / 5) * 1.3);
        const x = cx + Math.cos(a) * 10.4;
        const y = cy + Math.sin(a) * 10.4;
        out.push(E(x, y, 2.6, 2.6, '#a8521e'), F(E(x, y, 2, 2, '#f6e8cc')), F(E(x, y, 0.8, 0.8, RED)));
      }
      return out;
    },
  },

  oniwarrior: {
    top: (p) => [...bareChest(p),
      // A black-lacquer chest guard on cords, and the straw rope belt.
      T([[10.6, 28.4], [20.6, 28.4], [20.2, 32.6], [11, 32.6]], LACQ), F(R(10.8, 28.6, 9.6, 0.5, LACQ_LT)), F(R(11, 30.4, 9.2, 0.4, GOLD)),
      F(limb(11, 28.6, 12.4, 26.4, 0.4, 0.4, RED)), F(limb(20.2, 28.6, 18.8, 26.4, 0.4, 0.4, RED)),
      ...rope(33.4, '#c9a868', '#8a6a3a', false)],
    sleeve: (p) => p.skin,
    // Black-lacquer shoulder plates, laced in red.
    shoulder: () => [T([[-3.6, -1.4], [3.6, -1.4], [4, 4.4], [-3.2, 4.4]], LACQ), F(R(-3.4, -1.2, 7, 0.6, LACQ_LT)), ...[1, 2.6].map((y) => F(R(-3.2, y, 7, 0.4, RED)))],
    legs: () => ({ top: HAKAMA, low: LACQ, pad: GOLD }),
    // Ragged dark hakama, torn at the hem.
    skirt: () => {
      const out = [T([[9.2, 34.6], [22, 34.6], [24, 47], [21.6, 45.6], [19.6, 47.4], [17.4, 45.4], [16.2, 47], [15.6, 41], [15, 47], [13.4, 45.2], [11.4, 47.4], [9, 45.4], [7, 47]], HAKAMA), F(limb(MID, 37, MID, 46, 0.5, 0.5, HAKAMA_DK))];
      for (const x of [10.6, 12.8, 18.2, 20.6]) out.push(F(limb(x, 35.4, x + (x - MID) * 0.28, 45.6, 0.45, 0.6, HAKAMA_DK)));
      return out;
    },
    shoe: barefoot,
    hat: () => [...horn(9.6, 5.6, 11, 2, -4.6), ...horn(21.4, 5.6, 11, 2, 4.6)],
  },
};
export const TROUPE_OUTFIT_KEYS = Object.keys(TROUPE_OUTFITS);
