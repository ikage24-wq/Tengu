// Kitchen Witch gear (concept samples for the mage line rework; docs/design/kitchen-witch.md).
// A bossy head chef who cooks her spells: an apron dress, a hat that is half witch and half chef,
// and an oven mitt. `t` picks one of the sample looks for now:
//   0  Witch-toque: a puffy chef's toque whose crown rises into a floppy witch tip.
//   1  Witch hat: a tomato-red pointed hat with a wooden spoon and a basil sprig in its band.
//   2  Kerchief: a polka-dot headscarf knotted on top in two perky ends.
// Hems, ties and hat tips swing with m.sway and m.hair, like every other gear module.

import { R, E, T, F, mix } from '../pixel.js';
import { FIGURE, band, MID, limb } from '../figure.js';
import mage from './mage.js';

const WHITE = '#ffffff';
const CREAM = '#fff4dc';
const CREAM_DK = '#ecd6b0';
const CREAM_DEEP = '#cfae86';
const TOMATO = '#e8544a';
const TOMATO_DK = '#b83440';
const TOMATO_LT = '#ff8a72';
const LEAF = '#5fb86a';
const LEAF_DK = '#3a8a52';
const WOOD = '#d09a5e';
const WOOD_DK = '#9a6a3e';
const rad = (d) => (d * Math.PI) / 180;
const ring = (n, f) => Array.from({ length: n }, (_, i) => f(i));
const lerp = (a, b, u) => a + (b - a) * u;

// The look in use: the item's colour is the dress, the apron is always cream.
const dress = (p) => p.main;

// A soft blob of overlapping puffs (the toque's pleated crown).
const puffs = (pts, c) => pts.map(([x, y, r]) => E(x, y, r, r * 0.9, c));

// A floppy tip rising from (x, y), bending back (left) with the hair spring.
function tip(x, y, w, h, bend, c) {
  const n = 8;
  const spine = [];
  let px = x;
  let py = y;
  let a = -Math.PI / 2;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    spine.push([px, py, (w / 2) * (1 - u) ** 0.9 + 0.35, a]);
    a -= (rad(bend) * 2.6 * u) / n;
    px += Math.cos(a) * (h / n);
    py += Math.sin(a) * (h / n);
  }
  const edge = (k) => spine.map(([sx, sy, r, an]) => [sx - Math.sin(an) * r * k, sy + Math.cos(an) * r * k]);
  return { shape: T([...edge(1), ...edge(-1).reverse()], c), end: spine[n] };
}

function hat(t, p, m) {
  const hair = m.hair ?? 0;
  switch (t) {
    case 0: { // Witch-toque: a tall pleated chef's toque, its puffed crown rising into a floppy tip.
      const out = [];
      const tp = tip(15.6, -6.4, 7, 10, 110 + hair * 6, CREAM);
      out.push(tp.shape, F(tip(16, -6, 3, 8.5, 110 + hair * 6, WHITE).shape));
      // The puffed crown, wider than the band, in two rows of puffs.
      out.push(...puffs([[8.6, -1.6, 3.8], [12.6, -3.4, 4.2], [18.6, -3.4, 4.2], [22.6, -1.6, 3.8], [15.6, -4.4, 4.4]], CREAM_DK));
      out.push(...puffs([[8.6, -2.2, 3.3], [12.6, -4, 3.7], [18.6, -4, 3.7], [22.6, -2.2, 3.3], [15.6, -5, 3.9]], CREAM));
      out.push(F(E(12, -5.6, 1.4, 0.9, WHITE)), F(E(18, -5.6, 1.4, 0.9, WHITE)));
      // The tall pleated cylinder, straight-sided, pleat lines down it.
      out.push(T([[8.8, -0.6], [22.4, -0.6], [22.8, 8.6], [8.4, 8.6]], CREAM));
      for (const x of [11.4, 14.2, 17, 19.8]) out.push(F(R(x, 0, 0.6, 5.6, CREAM_DK)));
      out.push(F(T([[20.6, -0.6], [22.4, -0.6], [22.8, 8.6], [21, 8.6]], CREAM_DK)));
      // The band: a ribbon in her colour round the base, a little tomato pin.
      out.push(R(8.3, 5.6, 14.6, 3, dress(p)), F(R(8.3, 7.8, 14.6, 0.8, p.deep)));
      out.push(E(20.6, 5.4, 1.9, 1.7, TOMATO), F(E(20, 4.8, 0.6, 0.5, TOMATO_LT)), T([[20.6, 3.6], [19.2, 3], [20.4, 4.1], [21.8, 3.1]], LEAF));
      out.push(E(tp.end[0], tp.end[1], 1.2, 1.2, dress(p)));
      return out;
    }
    case 1: { // Pointed witch hat with a spoon in the band.
      const out = [];
      out.push(E(15.5, 8.4, 14.6, 2.8, p.deep), E(15.5, 7.6, 14.2, 2.6, dress(p)));
      const cone = tip(15.5, 7.8, 13.5, 17, 85 + hair * 7, dress(p));
      out.push(cone.shape, F(tip(17, 7.4, 4, 14, 85 + hair * 7, p.light).shape));
      out.push(T([[9.2, 4.6], [21.8, 4.6], [22.2, 7.6], [8.8, 7.6]], CREAM), F(R(8.8, 7, 13.4, 0.6, CREAM_DEEP)));
      // A wooden spoon tucked in the band, its bowl up past the brim, and a basil sprig.
      out.push(limb(19.6, 7.4, 23.6, -1, 0.9, 0.8, WOOD), E(24.2, -2.6, 1.9, 2.5, WOOD), F(E(24.6, -2.2, 1.1, 1.6, WOOD_DK)));
      out.push(T([[11.8, 5.6], [9, 2.6], [10.4, 2.2], [12.6, 4.8]], LEAF), T([[12, 5.4], [11.8, 1.8], [13.2, 2.4], [12.8, 5]], LEAF_DK));
      out.push(E(cone.end[0], cone.end[1], 1.3, 1.3, CREAM));
      return out;
    }
    default: { // Kerchief knotted on top.
      const out = [];
      out.push(T([[6.6, 9.4], [7.4, 3.2], [11, -1.4], [15.6, -2.6], [20.2, -1.4], [23.8, 3.2], [24.6, 9.4], [22, 7.6], [15.6, 6.4], [9.2, 7.6]], dress(p)));
      out.push(F(T([[7.4, 8.6], [8, 4], [9.6, 2], [9.6, 7.6]], p.dark)));
      for (const [x, y] of [[10.6, 2.4], [14.6, 0.2], [18.8, 1], [21.6, 4.6], [12.4, 5.4], [17, 4.2], [8.8, 6]]) out.push(F(E(x, y, 0.75, 0.75, CREAM)));
      // The knot and its two perky ends, bobbing with the hair spring.
      const sw = hair * 0.8;
      out.push(T([[15, -2.4], [11.6 - sw, -8], [10 - sw, -6.4], [14, -1.4]], dress(p)), T([[16.4, -2.4], [21 - sw, -8.6], [22.4 - sw, -6.8], [17.2, -1.4]], dress(p)));
      out.push(F(T([[14.6, -2.2], [11.6 - sw, -7.4], [12.6 - sw, -6.6]], p.dark)), F(T([[17, -2.2], [21 - sw, -8], [20.4 - sw, -7]], p.dark)));
      out.push(E(15.8, -2.2, 2.2, 1.8, p.deep), F(E(15.4, -2.6, 0.7, 0.5, p.light)));
      return out;
    }
  }
}

// ---------- The apron dress ----------

function dressShape(sw) {
  const { front, back } = FIGURE;
  return [...front.slice(0, -1), [21.8, 35], [23.6, 41.6], [15.5 + sw, 42.6], [7.4, 41.6], [9.4, 35], ...back.slice(1)];
}

function top(t, p, m) {
  const sw = (m.sway ?? 0) * 0.4;
  const body = dressShape(sw);
  const out = [T(body, dress(p))];
  // A square neckline with a white blouse showing, and puffed short sleeves (in shoulder()).
  out.push(T([[MID - 3.4, 26.2], [MID + 3.4, 26.2], [MID + 2.8, 28.6], [MID - 2.8, 28.6]], CREAM));
  // The apron bib, cream with a ruffled top edge, its straps over the shoulders.
  const bib = [[MID - 4.2, 28], [MID + 4.2, 28], [MID + 4.8, 35.4], [MID - 4.8, 35.4]];
  out.push(T(bib, WHITE), F(T([[MID + 1.8, 28.4], [MID + 3.6, 28.4], [MID + 4.2, 35.4], [MID + 2.6, 35.4]], CREAM_DK)));
  out.push(...ring(4, (i) => E(lerp(MID - 3, MID + 3, i / 3), 28.4, 1.1, 0.8, CREAM)));
  out.push(F(limb(MID - 3.4, 28.6, 11.4, 26.4, 0.9, 0.9, CREAM_DK)), F(limb(MID + 3.4, 28.6, 19.8, 26.4, 0.9, 0.9, CREAM_DK)));
  // A pocket with a whisk sticking out of it.
  out.push(R(MID - 2, 31.4, 4, 2.6, CREAM_DK), F(R(MID - 2, 31.4, 4, 0.6, CREAM_DEEP)));
  out.push(F(limb(MID + 0.6, 31.6, MID + 1.6, 29.4, 0.4, 0.4, '#aab4c8')), E(MID + 1.9, 28.6, 0.9, 1.2, '#dfe6f2'));
  // The waist tie: a big cream bow at the back, its tails swinging.
  out.push(band(body, 34.6, 35.8, CREAM_DK), T([[10.4, 35.2], [7.4, 33.2], [7.6, 37]], CREAM), limb(10, 35.6, 8.4 - sw * 2, 40.6, 1.4, 1, CREAM));
  return out;
}

// The apron skirt over the dress skirt, a ruffle at the dress hem.
function skirt(t, p, m) {
  const sw = m.sway ?? 0;
  const out = [];
  const hem = [[9.6, 34.6], [21.4, 34.6], [24.4, 44.6], ...ring(9, (i) => [lerp(24.4, 6.6, i / 8) + sw * 0.6, 45.6 + (i % 2 ? 0.8 : 0)]), [6.6, 44.6]];
  out.push(T(hem, dress(p)), band(hem, 43, 44.2, p.deep));
  out.push(...ring(7, (i) => E(lerp(7.6, 23.4, i / 6) + sw * 0.6, 45.6, 1.4, 1.1, WHITE)));
  // The apron panel, stopping above the hem, with a tomato stitched on.
  out.push(T([[MID - 5, 35], [MID + 5, 35], [MID + 6.6 + sw * 0.5, 44.4], [MID - 6.6 + sw * 0.5, 44.4]], WHITE), F(T([[MID + 3, 35], [MID + 5, 35], [MID + 6.6 + sw * 0.5, 44.4], [MID + 4.4 + sw * 0.5, 44.4]], CREAM_DK)));
  out.push(E(MID + sw * 0.4, 39, 1.5, 1.3, TOMATO), F(E(MID - 0.5 + sw * 0.4, 38.6, 0.5, 0.4, TOMATO_LT)), F(T([[MID + sw * 0.4, 37.6], [MID - 1 + sw * 0.4, 37.2], [MID + 1 + sw * 0.4, 37.2]], LEAF)));
  return out;
}

function shoulder(t, p) {
  return [E(0, 0.8, 3, 2.6, dress(p)), F(E(-0.6, 0.2, 1.2, 0.8, mix(dress(p), WHITE, 0.3))), R(-2.8, 2.6, 5.6, 0.9, CREAM)];
}

const legs = () => ({ top: '#fff4ec', low: '#fff4ec', pad: null });

// An oven mitt on the hand: a puffy quilted mitt in the dress colour with a cream cuff.
function hand(t, p, hx, hy, ex, ey) {
  const at = (u) => [lerp(hx, ex, u), lerp(hy, ey, u)];
  return [limb(...at(0.15), ...at(0.4), 3.8, 3.4, CREAM), E(hx, hy, 2.5, 2.4, dress(p)), F(E(hx - 0.6, hy - 0.6, 0.9, 0.7, mix(dress(p), WHITE, 0.35))), F(R(hx - 1.6, hy + 0.2, 3.2, 0.35, p.deep))];
}

function shoe(t, p, k) {
  const c = k.tint('#c86a4a');
  return [k.sole(c), k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], k.tint('#8a4430')), k.dot(0.6, 0.4, 0.7, k.tint(CREAM))];
}

export default {
  hat, hatBack: () => [], hatTucks: () => false, hatHidesBangs: () => false,
  top, sleeve: (t, p) => dress(p), longSleeves: () => false, shoulder, legs, skirt, shoe, hand,
  cape: () => [], capeFront: () => [],
  // Unused slots fall back on the old mage drawing for now.
  fallback: mage,
};
