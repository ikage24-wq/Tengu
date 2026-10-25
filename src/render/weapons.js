// Weapon art: how each weapon type is drawn in the hero's hand and as a 16x16 bag icon. New designs
// plug in here by type. A design provides
//   shapes(tier, frame) -> { w, h, grip: [x, y], blade: [top, base], shapes }   (in-hand sprite)
//   frames(tier)        -> animation frame count (1 = still)
//   icon(tier)          -> shapes for the 16x16 icon
// Weapons point straight up with the grip near the bottom; the hero rotates them around the grip.
// Bows stand upright with the string toward the archer; crossbows lie flat, prongs forward (+x).
// Until a type has a design, nothing is drawn for it. For now each type has one test design.

import { R, E, P, T } from './pixel.js';

const STEEL = '#e6edf7';
const STEEL_DARK = '#aeb9cf';
const GOLD = '#ffd66b';
const GRIP = '#7a5238';
const WOOD = '#c98e55';
const GEM = '#ff9ec0';
const STRING = '#fff6fb';

const DESIGNS = {
  sword: {
    shapes: () => ({
      w: 16, h: 46, grip: [8, 37], blade: [2, 32],
      shapes: [
        T([[8, 1], [11, 6], [11, 32], [5, 32], [5, 6]], STEEL),
        R(7.5, 7, 1, 24, STEEL_DARK),
        R(1, 32, 14, 2.5, GOLD),
        E(8, 33.2, 1.6, 1.6, GEM),
        R(6.5, 34.5, 3, 7, GRIP),
        E(8, 43, 2.2, 2.2, GOLD),
      ],
    }),
    icon: () => [T([[13, 1], [15, 3], [6, 12], [4, 10]], STEEL), R(2, 10, 6, 2, GOLD), R(1, 13, 3, 2, GRIP), P(12, 3, '#ffffff')],
  },
  axe: {
    shapes: () => ({
      w: 26, h: 48, grip: [9, 40], blade: [3, 22],
      shapes: [
        R(8, 4, 2.5, 42, WOOD),
        // A crescent bit sweeping forward, with a small spike behind the haft.
        T([[10, 6], [18, 2], [24, 9], [24, 19], [18, 25], [10, 20]], STEEL),
        T([[13, 8], [19, 5], [22, 10], [22, 18], [19, 22], [13, 18]], STEEL_DARK),
        T([[8, 10], [3, 13], [8, 16]], STEEL),
        R(7.5, 8, 3.5, 12, GOLD),
        E(9.2, 46, 2, 1.6, GOLD),
      ],
    }),
    icon: () => [R(4, 4, 2, 11, WOOD), T([[6, 2], [13, 1], [15, 6], [12, 10], [6, 8]], STEEL), R(3, 3, 4, 2, GOLD)],
  },
  spear: {
    shapes: () => ({
      w: 14, h: 60, grip: [7, 46], blade: [0, 16],
      shapes: [
        R(6, 14, 2.5, 45, WOOD),
        T([[7, 0], [11, 8], [9.5, 16], [4.5, 16], [3, 8]], STEEL),
        R(6.8, 3, 1, 11, STEEL_DARK),
        R(3.5, 15.5, 7, 2.5, GOLD),
        T([[5, 18], [9, 18], [7, 22]], '#ff6b8a'),
        R(5.5, 56, 3.5, 3, GOLD),
      ],
    }),
    icon: () => [R(2, 13, 2, 2, WOOD), T([[3, 13], [10, 6], [11, 7], [4, 14]], WOOD), T([[10, 1], [15, 1], [15, 6], [11, 8], [8, 5]], STEEL), R(8, 7, 2, 2, GOLD)],
  },
  wand: {
    shapes: () => ({
      w: 16, h: 34, grip: [8, 27], blade: [0, 12],
      shapes: [
        R(7, 11, 2, 21, '#fff0f6'),
        R(7, 22, 2, 1.5, GOLD),
        R(7, 25, 2, 1.5, GOLD),
        // A five-point star on top with a heart-pink gem in it.
        T([[8, 0], [9.8, 4.6], [14.6, 4.8], [10.8, 7.8], [12.2, 12.4], [8, 9.8], [3.8, 12.4], [5.2, 7.8], [1.4, 4.8], [6.2, 4.6]], GOLD),
        E(8, 6.8, 1.8, 1.8, GEM),
      ],
    }),
    icon: () => [T([[3, 14], [9, 8], [10, 9], [4, 15]], '#fff0f6'), T([[11, 1], [12, 4], [15, 4], [13, 6], [14, 9], [11, 7], [8, 9], [9, 6], [7, 4], [10, 4]], GOLD), P(11, 5, GEM)],
  },
  staff: {
    shapes: () => ({
      w: 20, h: 58, grip: [10, 44], blade: [0, 16],
      shapes: [
        R(8.8, 12, 2.5, 45, WOOD),
        // A crescent cradling a glowing orb.
        T([[4, 3], [10, 0], [16, 3], [17, 10], [13, 15], [7, 15], [3, 10]], GOLD),
        E(10, 8, 5, 5, 'none'),
        E(10, 8, 4, 4, '#9fd8ff'),
        E(8.6, 6.6, 1.4, 1.4, '#ffffff'),
        R(8, 15, 4, 2.5, GOLD),
        R(8.8, 55, 2.5, 2.5, GOLD),
      ],
    }),
    icon: () => [T([[2, 15], [8, 8], [9, 9], [3, 16]], WOOD), E(11, 5, 4, 4, GOLD), E(11, 5, 2.6, 2.6, '#9fd8ff'), P(10, 4, '#ffffff')],
  },
  bow: {
    shapes: () => ({
      w: 16, h: 46, grip: [11, 23], blade: [1, 45],
      shapes: [
        // Limbs bowing forward (+x) from tip to tip, with the string straight behind them.
        T([[4, 1], [8, 5], [11.5, 14], [12.5, 20], [12.5, 26], [11.5, 32], [8, 41], [4, 45], [5.5, 41], [9, 32], [10, 26], [10, 20], [9, 14], [5.5, 5]], WOOD),
        R(10, 19, 3.5, 8, GRIP),
        E(4.5, 1.5, 1.6, 1.6, GOLD),
        E(4.5, 44.5, 1.6, 1.6, GOLD),
        R(4.2, 2, 0.8, 42, STRING),
      ],
    }),
    icon: () => [T([[2, 2], [7, 3], [11, 7], [13, 12], [14, 14], [12, 13], [10, 9], [6, 5]], WOOD), T([[2, 2], [3, 2], [14, 13], [14, 14]], STRING), R(9, 7, 2, 2, GRIP)],
  },
  crossbow: {
    shapes: () => ({
      w: 40, h: 22, grip: [14, 15], blade: [0, 40],
      shapes: [
        // The stock runs back from the prongs at the front (+x), a bolt loaded along the top.
        T([[34, 9], [4, 9], [1, 12], [3, 17], [10, 17], [13, 21], [17, 21], [16, 14], [34, 14]], WOOD),
        R(35, 1, 3, 20, STEEL),
        R(35.5, 10, 2, 2, GOLD),
        R(35.2, 1.5, 0.8, 19, STRING),
        R(14, 9.8, 22, 1.4, STEEL_DARK),
        T([[40, 10.5], [37, 9], [37, 12]], STEEL),
        R(5, 10, 5, 2, GOLD),
      ],
    }),
    icon: () => [R(1, 7, 10, 3, WOOD), R(12, 2, 2, 12, STEEL), R(6, 8, 6, 1, STEEL_DARK), R(3, 10, 3, 3, WOOD), P(12, 8, GOLD)],
  },
  dagger: {
    shapes: () => ({
      w: 12, h: 26, grip: [6, 20], blade: [1, 15],
      shapes: [
        T([[6, 0], [9, 5], [8, 15], [4, 15], [3, 5]], STEEL),
        R(5.6, 4, 0.8, 10, STEEL_DARK),
        R(1, 15, 10, 2, GOLD),
        R(4.6, 17, 2.8, 6, GRIP),
        E(6, 24, 1.8, 1.8, GEM),
      ],
    }),
    icon: () => [T([[11, 2], [14, 2], [14, 5], [8, 10], [6, 8]], STEEL), R(4, 9, 5, 2, GOLD), R(2, 12, 3, 2, GRIP)],
  },
  claw: {
    shapes: () => ({
      w: 16, h: 24, grip: [8, 19], blade: [0, 12],
      shapes: [
        // A gauntlet with three curved blades reaching out over the knuckles.
        R(3, 13, 10, 9, '#8d96a8'),
        R(3, 13, 10, 2, GOLD),
        T([[3.5, 14], [2, 6], [3, 1], [5.5, 6], [6, 14]], STEEL),
        T([[6.8, 14], [6.5, 4], [8, 0], [9.5, 4], [9.2, 14]], STEEL),
        T([[10, 14], [10.5, 6], [13, 1], [14, 6], [12.5, 14]], STEEL),
        E(8, 18, 1.6, 1.6, GEM),
      ],
    }),
    icon: () => [R(3, 9, 8, 6, '#8d96a8'), T([[4, 9], [4, 3], [6, 9]], STEEL), T([[7, 9], [8, 1], [9, 9]], STEEL), T([[10, 9], [12, 3], [11, 9]], STEEL), R(3, 9, 8, 1, GOLD)],
  },
};

export function weaponShapes(type, tier = 0, frame = 0) {
  return DESIGNS[type]?.shapes(tier, frame) ?? null;
}

export function weaponFrames(type, tier = 0) {
  return DESIGNS[type]?.frames?.(tier) ?? 1;
}

export function weaponIcon(type, tier) {
  return DESIGNS[type]?.icon(tier) ?? null;
}
