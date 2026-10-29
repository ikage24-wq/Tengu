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
//   onibattle    cute and badass (the player's pick of a vibe): a short black battle kimono lined
//                crimson over bare, bandaged forearms, a black-lacquer pauldron with crimson
//                spikes, a crimson obi bound with gold rope and an iron chain at her hip, a big
//                crimson bow at her back, a gold bell at her throat, tall black geta; crimson horns
//   onicrimson   (the player's reference) a crimson oni woman: a red kimono worn short, crossed
//                over a white collar, a black obi bound with gold cord and its tassels, wide
//                sleeves lined dark red with a gold edge, tall black geta; two crimson horns
//                curving back

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
const CRIMSON = '#c4242a';
const CRIMSON_DK = '#7a1018';
const CRIMSON_LT = '#ff5a4a';
const OBI = '#1e1418';
const KIMONO = '#1c1620';
const KIMONO_LT = '#3a2e3c';
const BANDAGE = '#f6f0ea';

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
// A crimson horn: thick at the base, curving back over her head to a dark point.
function crimsonHorn(x, y, h, w, bend) {
  return [T([[x - w, y], [x + w, y], [x + w * 0.3 + bend * 0.7, y - h * 0.62], [x + bend, y - h], [x - w * 0.5 + bend * 0.55, y - h * 0.5]], CRIMSON),
    F(limb(x - w * 0.5, y - 0.3, x + bend * 0.85, y - h * 0.9, 0.4, 0.2, CRIMSON_DK)), F(limb(x + w * 0.4, y - 0.6, x + bend * 0.9 + 0.4, y - h * 0.8, 0.3, 0.15, CRIMSON_LT)),
    F(T([[x + bend * 0.85 - 0.5, y - h * 0.82], [x + bend * 0.85 + 0.6, y - h * 0.82], [x + bend, y - h]], '#2a0c10'))];
}
// A wide sleeve's mouth at the wrist and the hand out of it.
function wideSleeve(p, hx, hy, ex, ey, main, lining, edge) {
  const l = Math.hypot(hx - ex, hy - ey) || 1;
  const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
  const at = (a, b) => [hx + ux * a - uy * b, hy + uy * a + ux * b];
  return [T([at(-3.2, -2.8), at(-3.2, 2.8), at(-0.2, 4), at(0.6, 2.4), at(0.6, -2.4), at(-0.2, -4)], main),
    F(T([at(-0.4, -3.2), at(0.4, -2.2), at(0.4, 2.2), at(-0.4, 3.2), at(-0.8, 0)], lining)),
    F(limb(...at(-0.2, -3.6), ...at(-0.2, 3.6), 0.45, 0.45, edge)), E(...at(1.6, 0), 1.25, 1.3, p.skin)];
}
const bareChest = (p) => [T(TORSO, p.skin), F(limb(12.6, 28.4, 15.2, 29.6, 0.4, 0.4, shade(p.skin, -22))), F(limb(18.6, 28.4, 16, 29.6, 0.4, 0.4, shade(p.skin, -22))),
  F(limb(MID, 30.6, MID, 33.8, 0.3, 0.3, shade(p.skin, -22)))];
const sandal = (p, k, c) => [k.poly([[-2.4, 1.8], [2.8, 1.8], [3.2, 3], [-2.6, 3]], c('#8a5a34')), k.poly([[0.2, -0.4], [0.8, -0.4], [1.6, 1.8], [-0.6, 1.8]], c(RED))];
const barefoot = (p, k, c) => [k.poly([[-2.2, -0.6], [2.6, -0.6], [3, 2.6], [-2.4, 2.6]], c(p.skin)), k.poly([[1.4, 1.6], [3, 1.6], [3, 2.6], [1.4, 2.6]], c(p.skin))];

// Bandages wound round the forearm above the hand, and the hand.
function bandagedHand(p, hx, hy, ex, ey) {
  const l = Math.hypot(hx - ex, hy - ey) || 1;
  const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
  const at = (a, b) => [hx + ux * a - uy * b, hy + uy * a + ux * b];
  return [...[-3.4, -2.3, -1.2].map((a) => F(limb(...at(a, -1.4), ...at(a + 0.5, 1.4), 0.6, 0.6, BANDAGE))), F(limb(...at(-0.8, 1.3), ...at(-2.6, 3), 0.4, 0.25, BANDAGE)),
    E(hx + ux * 0.4, hy + uy * 0.4, 2, 2, p.skin)];
}

export const TROUPE_OUTFITS = {
  onibattle: {
    top: (p) => [T([...TORSO.slice(0, 6), [22.4, 36], [8.8, 36], ...TORSO.slice(8)], KIMONO),
      // Crossed over at a crimson collar, a little skin at the throat.
      T([[MID - 3.4, 25.6], [MID + 3.4, 25.6], [MID, 30.4]], p.skin), T([[MID + 1.4, 25.6], [MID + 4.2, 25.6], [MID + 0.2, 31.6], [MID - 1.6, 31.6]], KIMONO),
      F(limb(MID + 4, 25.7, MID, 31.4, 0.75, 0.75, CRIMSON)), F(limb(MID - 3.6, 25.8, MID - 0.6, 30, 0.7, 0.7, CRIMSON)),
      F(limb(11.4, 27.8, 12, 31, 0.4, 0.4, KIMONO_LT)),
      // A gold choker with a little bell.
      F(limb(MID - 2.4, 26.2, MID + 2.4, 26.2, 0.45, 0.45, GOLD)), F(E(MID, 27.4, 0.9, 0.9, GOLD)), F(E(MID, 27.8, 0.4, 0.3, GOLD_DK)),
      // The crimson obi bound with gold rope, its knot at the front.
      T([[8.8, 31.4], [22.4, 31.2], [22.6, 35], [8.6, 35.2]], CRIMSON), F(limb(8.8, 33.2, 22.4, 33, 0.55, 0.55, GOLD)),
      F(E(MID + 2.2, 33.1, 1.1, 0.9, GOLD)), F(limb(MID + 2.2, 33.6, MID + 1.4, 36.6, 0.45, 0.3, GOLD)), F(limb(MID + 2.6, 33.6, MID + 3.6, 36.4, 0.45, 0.3, GOLD))],
    sleeve: (p) => p.skin,
    // Her near shoulder in a black-lacquer pauldron with three crimson spikes and a gold rope; the
    // far one a black sleeve cap.
    shoulder: (p, side) => (side > 0
      ? [T([[-2.4, -1.6], [-1.6, -6], [-0.6, -1.8]], CRIMSON), T([[0, -2], [1, -7], [2, -2]], CRIMSON), T([[2.4, -1.6], [3.8, -5.4], [3.6, -1.2]], CRIMSON),
        E(0.4, 0.6, 4.2, 3.2, KIMONO), F(E(-0.4, -0.6, 2.8, 1.4, KIMONO_LT)), F(limb(-3.6, 2.4, 4.2, 2.4, 0.5, 0.5, GOLD))]
      : [E(0, 1, 3.2, 2.8, KIMONO), F(E(0, 2.8, 2.6, 0.6, CRIMSON))]),
    hand: (p, hx, hy, ex, ey) => bandagedHand(p, hx, hy, ex, ey),
    legs: (p, skin) => ({ top: skin, low: skin, pad: null }),
    // A short black kimono skirt split at the front, a crimson hem, and an iron chain at her hip.
    skirt: () => {
      const out = [T([[8.8, 34.6], [22.4, 34.6], [23.4, 43.6], [19.6, 43.6], [18.2, 39], [16.8, 43.6], [7.8, 43.6]], KIMONO),
        F(R(7.8, 42.4, 15.6, 1.2, CRIMSON)), F(limb(12, 35.4, 11.4, 42.6, 0.45, 0.6, KIMONO_LT)), F(limb(18.2, 36, 18.2, 39, 0.4, 0.4, '#0a0608'))];
      for (let i = 0; i < 4; i++) out.push(F(E(10.4 - i * 0.3, 36 + i * 1.6, 0.8, 0.9, '#6a6474')), F(E(10.4 - i * 0.3, 36 + i * 1.6, 0.4, 0.5, KIMONO)));
      return out;
    },
    shoe: (p, k, c) => [k.poly([[-2.6, 1.2], [3, 1.2], [3, 2], [-2.6, 2]], c('#1e1418')), k.poly([[-1.8, 2], [-0.6, 2], [-0.6, 3.2], [-1.8, 3.2]], c('#1e1418')), k.poly([[1, 2], [2.2, 2], [2.2, 3.2], [1, 3.2]], c('#1e1418')),
      k.poly([[-2, -1.2], [2.4, -1.2], [2.8, 1.2], [-2.2, 1.2]], c(p.skin)), k.poly([[0.2, -0.6], [0.8, -0.6], [1.6, 1.2], [-0.6, 1.2]], c(RED))],
    // The big crimson bow of her obi, tied at her back.
    back: () => [T([[9, 33], [3.6, 27.4], [1.4, 30.6], [4, 34]], CRIMSON), T([[9, 33.6], [3.2, 36], [2, 40.6], [5.6, 38]], CRIMSON), F(E(8.6, 33.4, 1.4, 1.3, CRIMSON_DK)),
      T([[8.4, 34], [6.8, 44], [8.6, 43], [9.6, 34.6]], CRIMSON_DK)],
    hat: () => [...crimsonHorn(10, 5.2, 10.6, 2.3, -4.6), ...crimsonHorn(21, 5.2, 10.6, 2.3, 4.6)],
  },

  onicrimson: {
    top: (p) => [T([...TORSO.slice(0, 6), [22.6, 36], [8.6, 36], ...TORSO.slice(8)], CRIMSON),
      // The kimono crossed over a white collar, the near side over the far.
      T([[MID - 3.6, 25.6], [MID + 3.6, 25.6], [MID, 31.4]], '#ffffff'), T([[MID + 1.4, 25.6], [MID + 4.2, 25.6], [MID + 0.2, 32], [MID - 1.6, 32]], CRIMSON),
      F(limb(MID + 4, 25.7, MID, 31.8, 0.5, 0.5, CRIMSON_DK)), F(limb(MID - 3.6, 25.8, MID - 0.8, 30.4, 0.45, 0.45, CRIMSON_DK)),
      F(limb(11.4, 27.6, 12, 31, 0.4, 0.4, CRIMSON_DK)), F(limb(19.8, 27.8, 19.2, 31, 0.4, 0.4, CRIMSON_LT)),
      // The black obi, bound with gold cord, knotted at the front with two tassels hanging.
      T([[8.8, 31.2], [22.4, 31], [22.6, 34.8], [8.6, 35]], OBI), F(limb(8.8, 32.4, 22.4, 32.2, 0.5, 0.5, GOLD)), F(limb(8.8, 33.8, 22.4, 33.6, 0.4, 0.4, GOLD_DK)),
      F(E(MID + 2, 33, 1.2, 1, GOLD)), F(limb(MID + 1.6, 33.6, MID + 0.8, 38.6, 0.5, 0.35, GOLD)), F(limb(MID + 2.6, 33.6, MID + 3.6, 38, 0.5, 0.35, GOLD)),
      F(E(MID + 0.8, 39, 0.7, 0.9, GOLD_DK)), F(E(MID + 3.6, 38.4, 0.7, 0.9, GOLD_DK))],
    sleeve: () => CRIMSON,
    long: true,
    shoulder: (p, side) => [E(0, 1, 3.4, 2.9, side > 0 ? CRIMSON : CRIMSON_DK), F(E(0, 2.8, 2.6, 0.6, CRIMSON_DK))],
    hand: (p, hx, hy, ex, ey) => wideSleeve(p, hx, hy, ex, ey, CRIMSON, CRIMSON_DK, GOLD),
    legs: (p, skin) => ({ top: skin, low: skin, pad: null }),
    // The kimono worn short, to above the knee, open in a slit at the near side, a gold edge at its hem.
    skirt: () => [T([[8.8, 34.6], [22.4, 34.6], [23.4, 44], [19.6, 44], [18.4, 39], [17.2, 44], [7.8, 44]], CRIMSON),
      F(R(7.8, 43, 15.6, 1, GOLD)), F(limb(12, 35.4, 11.4, 43, 0.45, 0.6, CRIMSON_DK)), F(limb(15.4, 35.4, 15.2, 43, 0.45, 0.6, CRIMSON_DK)), F(limb(18.4, 36, 18.4, 39, 0.4, 0.4, '#3a0a10'))],
    // Tall black geta with red thongs.
    shoe: (p, k, c) => [k.poly([[-2.6, 1.2], [3, 1.2], [3, 2], [-2.6, 2]], c('#1e1418')), k.poly([[-1.8, 2], [-0.6, 2], [-0.6, 3.2], [-1.8, 3.2]], c('#1e1418')), k.poly([[1, 2], [2.2, 2], [2.2, 3.2], [1, 3.2]], c('#1e1418')),
      k.poly([[-2, -1.2], [2.4, -1.2], [2.8, 1.2], [-2.2, 1.2]], c(p.skin)), k.poly([[0.2, -0.6], [0.8, -0.6], [1.6, 1.2], [-0.6, 1.2]], c(RED))],
    hat: () => [...crimsonHorn(10.2, 5.2, 9.4, 2, -4.2), ...crimsonHorn(20.8, 5.2, 9.4, 2, 4.2)],
  },

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
// Her battle kimono with other horns: one snapped off short (a jagged break), a single big horn
// in the middle of her brow, or two long horns swept straight back.
function brokenHorn(x, y) {
  return [T([[x - 2.3, y], [x + 2.3, y], [x + 1.6, y - 4.2], [x + 0.4, y - 3.2], [x - 0.6, y - 4.8], [x - 1.8, y - 3.6]], CRIMSON),
    F(T([[x - 1.4, y - 3.6], [x - 0.6, y - 4.6], [x + 0.4, y - 3.1], [x + 1.4, y - 4]], '#3a0a10')), F(limb(x - 1.2, y - 0.6, x + 1.2, y - 0.8, 0.35, 0.35, CRIMSON_DK))];
}
Object.assign(TROUPE_OUTFITS, {
  onibattle_broken: { ...TROUPE_OUTFITS.onibattle, hat: () => [...brokenHorn(10, 5.2), ...crimsonHorn(21, 5.2, 10.6, 2.3, 4.6)] },
  onibattle_one: { ...TROUPE_OUTFITS.onibattle, hat: () => [...crimsonHorn(15.5, 4.6, 13, 2.9, 1.2)] },
  onibattle_swept: { ...TROUPE_OUTFITS.onibattle, hat: () => [...crimsonHorn(9.6, 5.4, 13, 2.1, -9), ...crimsonHorn(21.4, 5.4, 13, 2.1, 9)] },
});
// ---------- The yuki-onna's (three designs to pick from) ----------
//   yukiclassic  the snow woman of the stories: a long white kimono to the floor, pale blue snowflakes
//                drifting across it, a pale blue obi with a silver cord, wide trailing sleeves
//   yukiprincess a frost princess: layered furisode in ice blue over white with very long sleeves,
//                a silver obi with an icicle clasp, crystal ornaments in her hair
//   yukighost    a blizzard ghost: a white kimono torn to tatters at the hem and sleeve ends, fading
//                to nothing, a thin grey-blue sash, her feet bare
const SNOW = '#f6f8ff';
const SNOW_SH = '#d6def2';
const ICE = '#9cc8f0';
const ICE_DK = '#5a8ac8';
const ICE_LT = '#d8ecff';
const SILVER_C = '#c8d4e8';
const FROST = '#eaf4ff';
// A little six-armed snowflake at (x, y).
const flake = (x, y, r, c) => [0, 1, 2].map((i) => {
  const a = (i / 3) * Math.PI;
  return F(limb(x - Math.cos(a) * r, y - Math.sin(a) * r, x + Math.cos(a) * r, y + Math.sin(a) * r, 0.22, 0.22, c));
});
// The kimono's body to the waist, crossed at the collar (`collar` the under-collar's colour).
const yukiTop = (main, collar, line) => [T([...TORSO.slice(0, 6), [22.4, 36], [8.8, 36], ...TORSO.slice(8)], main),
  T([[MID - 3.4, 25.6], [MID + 3.4, 25.6], [MID, 31]], collar), T([[MID + 1.4, 25.6], [MID + 4.2, 25.6], [MID + 0.2, 32], [MID - 1.6, 32]], main),
  F(limb(MID + 4, 25.7, MID, 31.8, 0.5, 0.5, line)), F(limb(MID - 3.6, 25.8, MID - 0.8, 30.4, 0.45, 0.45, line))];
const yukiFeet = (p, k, c) => [k.poly([[-2.2, -1], [2.6, -1], [3, 2.6], [-2.4, 2.6]], c(p.skin))];
Object.assign(TROUPE_OUTFITS, {
  yukiclassic: {
    top: (p) => [...yukiTop(SNOW, ICE_LT, SNOW_SH), ...flake(11.4, 29, 0.9, ICE), ...flake(19.6, 33.4, 0.7, ICE),
      T([[8.8, 31.6], [22.4, 31.4], [22.6, 35], [8.6, 35.2]], ICE), F(limb(8.8, 33.3, 22.4, 33.1, 0.4, 0.4, SILVER_C)), F(E(MID + 2.4, 33.2, 0.9, 0.8, SILVER_C))],
    sleeve: () => SNOW,
    long: true,
    shoulder: (p, side) => [E(0, 1, 3.2, 2.8, side > 0 ? SNOW : SNOW_SH), F(E(0, 2.8, 2.4, 0.5, SNOW_SH))],
    hand: (p, hx, hy, ex, ey) => wideSleeve(p, hx, hy, ex, ey, SNOW, ICE_LT, ICE),
    legs: () => ({ top: SNOW, low: SNOW, pad: null }),
    // To the floor, a little flared, snowflakes drifting down it.
    skirt: () => [T([[8.8, 34.6], [22.4, 34.6], [24.6, 55.4], [6.6, 55.4]], SNOW), F(limb(14.4, 35.4, 13.6, 55, 0.5, 0.6, SNOW_SH)), F(limb(MID + 2, 35, MID + 4, 55, 0.4, 0.5, SNOW_SH)),
      ...flake(10.4, 40, 0.9, ICE), ...flake(20.4, 44, 0.8, ICE), ...flake(12.6, 49, 1, ICE), ...flake(19, 52.6, 0.7, ICE), F(R(6.6, 54.4, 18, 1, ICE_LT))],
    shoe: yukiFeet,
  },
  yukiprincess: {
    top: (p) => [...yukiTop(ICE, SNOW, ICE_DK), F(limb(10.6, 28, 11.4, 31, 0.4, 0.4, ICE_LT)),
      T([[8.8, 31.2], [22.4, 31], [22.6, 35.2], [8.6, 35.4]], SILVER_C), F(R(8.8, 32.8, 13.8, 0.5, ICE_DK)),
      T([[MID + 1, 31.6], [MID + 3.2, 31.6], [MID + 2.1, 35.6]], ICE_LT), F(T([[MID + 1.6, 32], [MID + 2.6, 32], [MID + 2.1, 34.4]], '#ffffff'))],
    sleeve: () => ICE,
    long: true,
    shoulder: (p, side) => [E(0, 1, 3.4, 2.9, side > 0 ? ICE : ICE_DK), F(E(0, 2.8, 2.6, 0.6, SNOW))],
    // Very long furisode sleeves, white inside, hanging well below her hands.
    hand: (p, hx, hy, ex, ey) => {
      const l = Math.hypot(hx - ex, hy - ey) || 1;
      const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
      return [T([[hx - ux * 3 - 2.6, hy - uy * 3], [hx - ux * 3 + 2.6, hy - uy * 3], [hx + 2.4, hy + 9], [hx - 3, hy + 10]], ICE), F(T([[hx - 2, hy + 1], [hx + 2, hy + 1], [hx + 2, hy + 8.4], [hx - 2.4, hy + 9.2]], SNOW)),
        F(limb(hx - 3, hy + 10, hx + 2.4, hy + 9, 0.4, 0.4, ICE_DK)), E(hx + ux * 0.6, hy + uy * 0.6, 1.2, 1.3, p.skin)];
    },
    legs: () => ({ top: SNOW, low: SNOW, pad: null }),
    // Layered skirts: ice blue over white, both to the floor, the white showing at the front.
    skirt: () => [T([[8.8, 34.6], [22.4, 34.6], [25.4, 55.4], [6, 55.4]], ICE), T([[13.6, 35], [18, 35], [19.8, 55.4], [12, 55.4]], SNOW),
      F(limb(13.8, 35.4, 12.4, 55, 0.5, 0.5, ICE_LT)), F(R(6, 54.2, 19.4, 1.2, SILVER_C)), ...flake(9.6, 46, 1, '#ffffff'), ...flake(22.6, 50, 0.9, '#ffffff')],
    shoe: yukiFeet,
    // Crystal ornaments in her hair: icicles hanging at each side and a snowflake crown.
    hat: () => [...flake(15.5, 3.4, 1.8, '#ffffff'), F(E(15.5, 3.4, 0.6, 0.6, ICE)),
      ...[[5.4, 9], [25.6, 9]].flatMap(([x, y]) => [F(T([[x - 0.8, y], [x + 0.8, y], [x, y + 6.4]], ICE_LT)), F(T([[x - 0.3, y], [x + 0.5, y], [x, y + 4]], '#ffffff')), F(E(x, y, 1, 0.9, SILVER_C))])],
  },
  yukighost: {
    top: (p) => [...yukiTop(FROST, ICE_LT, SNOW_SH), F(limb(12, 28, 12.6, 31.6, 0.4, 0.4, SNOW_SH)),
      T([[8.8, 32.4], [22.4, 32.2], [22.6, 34.4], [8.6, 34.6]], '#8a98b8'), F(limb(19.4, 34, 20.2, 38.6, 0.5, 0.3, '#8a98b8'))],
    sleeve: () => FROST,
    long: true,
    shoulder: (p, side) => [E(0, 1, 3, 2.6, side > 0 ? FROST : SNOW_SH)],
    // Sleeves torn to ragged strips at the wrist.
    hand: (p, hx, hy, ex, ey) => {
      const l = Math.hypot(hx - ex, hy - ey) || 1;
      const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
      const at = (a, b) => [hx + ux * a - uy * b, hy + uy * a + ux * b];
      return [T([at(-3.2, -2.6), at(-3.2, 2.6), at(-0.6, 3.2), at(0.2, 1.6), at(-0.4, 0.6), at(0.4, -0.6), at(-0.6, -1.8), at(0, -3.2)], FROST), E(...at(1.4, 0), 1.2, 1.3, p.skin)];
    },
    legs: (p, skin) => ({ top: skin, low: skin, pad: null }),
    // Torn to tatters below the knee, the strips fading to nothing.
    skirt: () => {
      const out = [T([[8.8, 34.6], [22.4, 34.6], [23.6, 44], [21.4, 49.6], [19.6, 45], [18, 51.6], [16.2, 45.4], [14.4, 50.8], [12.6, 45.2], [10.6, 49.4], [7.6, 44]], FROST)];
      for (const [x, len] of [[9.4, 52], [13.4, 54], [17, 55], [20.6, 53]]) out.push({ ...F(T([[x - 0.9, 46], [x + 0.9, 46], [x + 0.2, len]], SNOW_SH)), a: 0.55 });
      out.push(F(limb(14.4, 35.4, 13.6, 47, 0.5, 0.6, SNOW_SH)));
      return out;
    },
    shoe: yukiFeet,
  },
});
// ---------- More blizzard-ghost kimonos for the yuki-onna ----------
//   yukishroud     a ghost's burial white (a yurei's): crossed the way the dead wear it, a white
//                  triangle cloth on her brow, long sleeves; below the knee the hem comes apart in
//                  long wisps that pale into mist and then into blowing snow
//   yukifrostbite  caught in the storm: storm-grey over white, every edge crusted with frost,
//                  icicles hanging from her sleeves and hem, a straw rope sash with paper streamers
//   yukiwhiteout   a whiteout: white with a blizzard in indigo swirling up from the hem, a deep
//                  indigo obi with a silver cord, sleeves that end in blowing snow
const MIST = ['#f2f6ff', '#e2ecfa', '#d0e0f4', '#c0d4ee'];
const STORM = '#9aa6c0';
const STORM_DK = '#6e7a96';
const INDIGO_S = '#3a4a8a';
const INDIGO_SL = '#6a7ac0';
// A hem coming apart into wisps: one ragged edge of long points from `y0` (touching, so the outline
// runs only round the outside), each point paling into mist toward its tip.
function wisps(x0, x1, y0, n, len, seed = 1) {
  const out = [];
  const w = (x1 - x0) / n / 2;
  for (let i = 0; i < n; i++) {
    const x = x0 + w * (2 * i + 1);
    const l = len * (0.6 + 0.4 * Math.abs(Math.sin(i * 2.3 + seed)));
    const tip = [x + Math.sin(i * 1.7 + seed) * 1.4, y0 + l];
    for (let k = 0; k < MIST.length; k++) {
      const t = k / MIST.length;
      const [ax, bx] = [x - w + (tip[0] - (x - w)) * t, x + w + (tip[0] - (x + w)) * t];
      const y = y0 + l * t;
      out.push((k ? F : (v) => v)(T([[ax, y - (k ? 0.1 : 0.4)], [bx, y - (k ? 0.1 : 0.4)], tip], MIST[k])));
    }
  }
  return out;
}
// A crust of frost along an edge from (x0, y) to (x1, y): a jagged white rim.
function frostEdge(x0, x1, y, down = 1) {
  const pts = [[x0, y]];
  const n = Math.max(3, Math.round((x1 - x0) / 1.2));
  for (let i = 1; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y + down * (i % 2 ? 1 : 0.35)]);
  pts.push([x1, y], [x1, y - down * 0.4], [x0, y - down * 0.4]);
  return F(T(pts, '#ffffff'));
}
const icicles = (xs, y) => xs.flatMap(([x, l]) => [F(T([[x - 0.6, y], [x + 0.6, y], [x, y + l]], '#d8ecff')), F(T([[x - 0.15, y], [x + 0.3, y], [x, y + l * 0.7]], '#ffffff'))]);
// The dead wear the kimono crossed the other way: the far side over the near.
const shroudTop = (main, line) => [T([...TORSO.slice(0, 6), [22.4, 36], [8.8, 36], ...TORSO.slice(8)], main),
  T([[MID - 3.4, 25.6], [MID + 3.4, 25.6], [MID, 31]], MIST[1]), T([[MID - 1.4, 25.6], [MID - 4.2, 25.6], [MID - 0.2, 32], [MID + 1.6, 32]], main),
  F(limb(MID - 4, 25.7, MID, 31.8, 0.5, 0.5, line)), F(limb(MID + 3.6, 25.8, MID + 0.8, 30.4, 0.45, 0.45, line))];
Object.assign(TROUPE_OUTFITS, {
  yukishroud: {
    top: (p) => [...shroudTop('#fafcff', MIST[2]), F(limb(8.8, 33.4, 22.4, 33.2, 0.7, 0.7, MIST[2])), F(limb(19.6, 33.4, 20.4, 38, 0.45, 0.3, MIST[2]))],
    sleeve: () => '#fafcff',
    long: true,
    shoulder: (p, side) => [E(0, 1, 3.2, 2.8, side > 0 ? '#fafcff' : MIST[1])],
    // Long sleeves, their ends coming apart into mist.
    hand: (p, hx, hy, ex, ey) => {
      const l = Math.hypot(hx - ex, hy - ey) || 1;
      const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
      return [T([[hx - ux * 3 - 2.6, hy - uy * 3], [hx - ux * 3 + 2.6, hy - uy * 3], [hx + 2.4, hy + 5], [hx - 3, hy + 6]], '#fafcff'), ...wisps(hx - 3, hx + 2.4, hy + 5, 3, 5, 2), E(hx + ux * 0.6, hy + uy * 0.6, 1.2, 1.3, p.skin)];
    },
    legs: () => ({ top: '#fafcff', low: '#fafcff', pad: null }),
    skirt: () => [T([[8.8, 34.6], [22.4, 34.6], [23.6, 44], [7.6, 44]], '#fafcff'), F(limb(MID - 1.4, 35.4, MID - 2, 44, 0.5, 0.5, MIST[1])), ...wisps(7.6, 23.6, 43.6, 7, 12)],
    shoe: () => [],
    // The white triangle cloth on her brow (a yurei's hitai-kakushi).
    hat: () => [T([[11.6, 9.2], [19.4, 9.2], [15.5, 13]], '#ffffff'), F(limb(4.4, 8.6, 11.8, 9.4, 0.4, 0.4, '#e2ecfa')), F(limb(19.2, 9.4, 26.6, 8.6, 0.4, 0.4, '#e2ecfa')), F(limb(11.6, 9.4, 19.4, 9.4, 0.3, 0.3, MIST[2]))],
  },
  yukifrostbite: {
    top: (p) => [...yukiTop(STORM, '#ffffff', STORM_DK), frostEdge(MID - 3, MID + 4, 26.2), frostEdge(9.4, 22, 26.6),
      // A straw rope sash with paper streamers.
      T([[8.6, 32.6], [22.6, 32.4], [22.8, 34.6], [8.4, 34.8]], '#c9b37a'), ...[10, 12.4, 14.8, 17.2, 19.6, 22].map((x) => F(limb(x - 0.8, 32.8, x + 0.4, 34.6, 0.3, 0.3, '#9a8456'))),
      ...[12, 18.6].flatMap((x) => [F(T([[x, 34.8], [x + 1, 34.8], [x + 1, 36.2], [x + 1.8, 36.2], [x + 1.8, 37.6], [x + 0.8, 37.6], [x + 0.8, 38.8], [x - 0.2, 38.8], [x - 0.2, 37.4], [x - 1, 37.4], [x - 1, 36], [x, 36]], '#ffffff'))])],
    sleeve: () => STORM,
    long: true,
    shoulder: (p, side) => [E(0, 1, 3.2, 2.8, side > 0 ? STORM : STORM_DK), frostEdge(-3, 3, -1.4, -1)],
    hand: (p, hx, hy, ex, ey) => [...wideSleeve(p, hx, hy, ex, ey, STORM, '#ffffff', '#ffffff'), ...icicles([[hx - 2, 2.4], [hx - 0.6, 3.4], [hx + 1, 2]], hy + 3)],
    legs: () => ({ top: '#ffffff', low: '#ffffff', pad: null }),
    skirt: () => [T([[8.8, 34.6], [22.4, 34.6], [24.4, 52], [6.8, 52]], STORM), T([[13.6, 35], [17.8, 35], [19.2, 52], [12.4, 52]], '#ffffff'),
      F(limb(10.6, 36, 9, 51.6, 0.5, 0.6, STORM_DK)), F(limb(21, 36, 22.6, 51.6, 0.5, 0.6, STORM_DK)), frostEdge(6.8, 24.4, 51.6),
      ...icicles([[8, 2.4], [10.4, 3.6], [13, 2], [16, 3.2], [18.6, 2.2], [21.4, 3.8], [23.4, 2]], 52.2)],
    shoe: yukiFeet,
  },
  yukiwhiteout: {
    top: (p) => [...yukiTop('#f8faff', INDIGO_SL, INDIGO_S),
      T([[8.8, 31.4], [22.4, 31.2], [22.6, 35], [8.6, 35.2]], INDIGO_S), F(limb(8.8, 33.2, 22.4, 33, 0.45, 0.45, SILVER_C)), F(E(MID + 2.2, 33.1, 0.9, 0.8, SILVER_C)),
      F(limb(10.4, 28.6, 12.6, 27.4, 0.35, 0.2, INDIGO_SL))],
    sleeve: () => '#f8faff',
    long: true,
    shoulder: (p, side) => [E(0, 1, 3.2, 2.8, side > 0 ? '#f8faff' : MIST[1])],
    // Sleeves ending in blowing snow.
    hand: (p, hx, hy, ex, ey) => [...wideSleeve(p, hx, hy, ex, ey, '#f8faff', INDIGO_SL, INDIGO_S), ...[[2, 1], [4, -0.6], [5.6, 1.4], [3.4, 2.6]].map(([dx, dy]) => F(E(hx - dx, hy + 3 + dy, 0.45, 0.45, MIST[2])))],
    legs: () => ({ top: '#f8faff', low: '#f8faff', pad: null }),
    // A blizzard in indigo swirling up from the hem, thinning as it rises.
    skirt: () => {
      const out = [T([[8.8, 34.6], [22.4, 34.6], [24.6, 55.4], [6.6, 55.4]], '#f8faff')];
      const swirl = (cx, cy, r, c) => {
        const pts = [];
        for (let i = 0; i <= 10; i++) {
          const a = (i / 10) * Math.PI * 1.6;
          pts.push([cx + Math.cos(a) * r * (1 - i / 14), cy - Math.sin(a) * r * 0.8 * (1 - i / 14)]);
        }
        return pts.slice(1).map((q, i) => F(limb(pts[i][0], pts[i][1], q[0], q[1], 0.5 * (1 - i / 12), 0.5 * (1 - (i + 1) / 12), c)));
      };
      out.push(F(T([[6.6, 55.4], [24.6, 55.4], [24, 51.4], [20, 52.6], [16, 50.8], [12, 52.4], [7.2, 51]], INDIGO_S)));
      for (const [x, y, r, c] of [[9.6, 50, 2.6, INDIGO_S], [14.4, 48.6, 2.2, INDIGO_S], [19.6, 49.8, 2.8, INDIGO_S], [11.6, 44.6, 1.8, INDIGO_SL], [17.8, 43.4, 1.6, INDIGO_SL], [14.6, 39.6, 1.2, INDIGO_SL]]) out.push(...swirl(x, y, r, c));
      for (const [x, y] of [[8.6, 46], [21.6, 45], [13, 41.4], [20, 39.6], [10.4, 38.6]]) out.push(F(E(x, y, 0.35, 0.35, INDIGO_SL)));
      return out;
    },
    shoe: yukiFeet,
  },
});
export const TROUPE_OUTFIT_KEYS = Object.keys(TROUPE_OUTFITS);
