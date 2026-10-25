// A plain placeholder set, used by a job module until it has its own designs.

import { R, E, T, F } from '../pixel.js';
import { torsoPts, band, collar, limb } from '../figure.js';

export function stubSet() {
  return {
    hat: (t, p) => [E(15.5, 7, 11, 5.4, p.main), R(4.6, 8.6, 21.8, 2.4, p.trim)],
    hatBack: () => [],
    hatTucks: () => false,
    hatHidesBangs: () => false,
    top: (t, p) => [T(torsoPts(), p.main), collar(p.light), band(torsoPts(), 34.2, 35.8, p.trim)].filter(Boolean),
    sleeve: (t, p) => p.main,
    longSleeves: () => true,
    shoulder: () => [],
    legs: (t, p) => ({ top: p.dark, low: p.dark, pad: null }),
    skirt: () => null,
    shoe: (t, p, k) => [k.shaft(3, k.c), k.sole(k.c)],
    hand: (t, p, hx, hy) => [E(hx, hy, 1.9, 1.9, p.dark)],
    cape: (t, p, m) => [T([[8.6, 26], [22.4, 26], [27 + m.sway, 48], [4 + m.sway, 48]], p.dark)],
    capeFront: (t, p) => [F(E(15.5, 28.6, 1, 1, p.trim))],
    limb,
  };
}
