// The Sorcerer's robes (docs/design/mage-line.md): the Mage's dark-power act became real. She wears
// the mage line's robes in deep violet with ember trim (render/hero.js repaints her plain mage
// pieces), and in place of the pointed hat a deep hood that frames her face, its rim stitched with
// ember runes. The hood grows darker and grander up the tiers: glowing runes from Scholar, a long
// pointed tail from Archon, embers drifting off the tip from Sunspire. Everything else is the mage
// module. The rim stops at her brow and outside her cheeks; nothing comes down over her face.

import { E, T, F, mix } from '../pixel.js';
import mage from './mage.js';

const VIOLET = '#3b2457';
const VIOLET_DK = '#24153a';
const VIOLET_LT = '#5a3a80';
const EMBER = '#ff8a3a';
const EMBER_HOT = '#ffd27a';
const stage = (t) => (t < 2 ? 0 : t < 5 ? 1 : t < 9 ? 2 : t < 13 ? 3 : t < 17 ? 4 : 5);

// A small ember rune: a diamond with a tick through it, glowing at the higher tiers.
function rune(x, y, s, glow) {
  const out = [];
  if (glow) out.push(F(E(x, y, s * 1.6, s * 1.6, mix(EMBER, VIOLET, 0.55))));
  out.push(T([[x, y - s], [x + s * 0.7, y], [x, y + s], [x - s * 0.7, y]], glow ? EMBER : mix(EMBER, VIOLET, 0.35)));
  out.push(F(T([[x - 0.15, y - s * 0.6], [x + 0.15, y - s * 0.6], [x + 0.15, y + s * 0.6], [x - 0.15, y + s * 0.6]], glow ? EMBER_HOT : EMBER)));
  return out;
}

// The hood's front: a deep cowl over her head that frames her face, the rim a smooth arch across
// her brow (her bangs show under it) and down outside her cheeks to her shoulders.
function hat(t, p, m) {
  const s = stage(t);
  const h = (m.hair ?? 0) * 0.4;
  const rim = [];
  for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; rim.push([15.5 + Math.cos(a) * 9.2, 9.4 - Math.sin(a) * 2.6 + (1 - Math.sin(a)) * 3.4]); }
  const out = [
    T([[3.2, 23], [2.4, 12.4], [2.8, 7.4], [5, 3.6], [10.2, 0.8], [15.5, 0.1], [20.8, 0.8], [26, 3.6], [28.2, 7.4], [28.6, 12.4], [27.8, 23], [25.2, 23], [24.7, 12.8], ...rim, [6.3, 12.8], [5.8, 23]], VIOLET),
    // Shadow inside the rim, so the face sits in the hood's depth.
    F(T([[5.8, 23], [6.3, 12.8], ...rim.slice().reverse(), [24.7, 12.8], [25.2, 23], [24.2, 23], [23.8, 13.4], [15.5, 8.2], [7.2, 13.4], [6.8, 23]], VIOLET_DK)),
    // A fold of light down each side of the crown.
    F(T([[5.4, 5.2], [9.6, 2], [7.4, 6.2], [4.2, 12]], VIOLET_LT)),
    F(T([[25.6, 5.2], [21.4, 2], [23.6, 6.2], [26.8, 12]], mix(VIOLET_LT, VIOLET, 0.5))),
    // The ember stitch along the rim.
    F(T([[5.8, 23], [6.3, 12.8], ...rim.slice().reverse(), [24.7, 12.8], [25.2, 23], [25.8, 23], [25.4, 12.4], ...rim.map(([x, y]) => [x + (x - 15.5) * 0.08, y - 0.7]), [5.6, 12.4], [5.2, 23]], s >= 1 ? EMBER : mix(EMBER, VIOLET, 0.4))),
  ];
  // Runes at her temples (glowing from Scholar), and a third over her brow from Archon.
  out.push(...rune(4.4, 15 + h * 0.2, 1.2, s >= 1), ...rune(26.6, 15 + h * 0.2, 1.2, s >= 1));
  if (s >= 3) out.push(...rune(15.5, 3.6, 1.5, true));
  return out;
}

// Behind her head: the hood's back falling to her shoulders, its point trailing (longer from the
// Archon on), with embers drifting off the tip from Sunspire.
function hatBack(t, p, m) {
  const s = stage(t);
  const sw = (m.sway ?? 0) * 0.6 + (m.hair ?? 0) * 0.5;
  const tail = s >= 3 ? 9 : 4;
  const out = [
    T([[3.4, 6], [27.6, 6], [28.8, 24], [24, 25.2], [15.5, 24.6], [7, 25.2], [2.2, 24]], VIOLET_DK),
    T([[6, 2.4], [16, 0.6], [4 - tail * 0.5 + sw, 8 + tail * 0.6], [-1 - tail * 0.3 + sw, 12 + tail]], VIOLET),
    F(T([[6, 3.4], [10, 2], [0 - tail * 0.25 + sw, 11 + tail * 0.9]], VIOLET_LT)),
  ];
  if (s >= 4) {
    const tx = -1 - tail * 0.3 + sw, ty = 12 + tail;
    out.push(F(E(tx - 0.6 - sw * 0.3, ty - 2.4, 0.7, 0.7, EMBER)), F(E(tx + 0.8 - sw * 0.5, ty - 5, 0.5, 0.5, EMBER_HOT)));
  }
  return out;
}

export default { ...mage, hat, hatBack, hatTucks: () => true, hatHidesBangs: () => false };
