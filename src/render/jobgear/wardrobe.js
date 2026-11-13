// The Mochi wardrobe's drawings (data/mochi-wardrobe.js): tops, bottoms, dresses and accessories,
// each drawn as the slots it fills, so a top from here and a bottom from there make one outfit.
//
// Body coordinates, as everywhere else (figure.js, gear.js): the torso runs x 9 to 22 and y 26 to
// 35.8, the hips to 39.6, the shoulders sit at (10.4, 28.2) and (20.8, 28.2). One light, from the
// upper front left: cloth is lit down its left, creased where it bunches, and its hems turn back
// into the light. A Mochi's hair covers it to about y 30, so every piece says what it is at the
// waist, the hem and the silhouette, not at the collar.
//
// This is the beginner tier: plain cloth, simple cuts, one trim each, nothing precious. (Middling,
// fine and elite come after, plain to ornate.)
import { R, E, T, F, shade } from '../pixel.js';
import { torsoPts, dressPts, band, MID, limb } from '../figure.js';
import { TOPS, BOTTOMS, DRESSES, ACCESSORIES, wearOf } from '../../data/mochi-wardrobe.js';

const GOLDEN = '#e8c470';
const TORSO = torsoPts();
const DRESSP = dressPts();

// ---------- Cloth ----------
// A crease: a dark fold tapering to nothing, with a light ridge just above where the cloth turns
// back to the light. (The same crease the starter outfits use, so the wardrobe sits with them.)
const crease = (x0, y0, x1, y1, w, dark, lite) => [F(limb(x0 + 0.1, y0 - 0.5, x1 + 0.1, y1 - 0.5, w * 0.75, 0.1, lite)), F(limb(x0, y0, x1, y1, w, 0.1, dark))];
// Knit and rib ticks along a run (cuffs, hems, scarves).
const ribs = (x0, x1, y, h, c, step = 1.2) => Array.from({ length: Math.max(1, Math.floor((x1 - x0) / step)) }, (_, i) => F(R(x0 + 0.35 + i * step, y, 0.35, h, c)));
const dots = (list, r, c) => list.map(([x, y]) => F(E(x, y, r, r, c)));
// Points round an ellipse, from angle a0 to a1 (degrees, 0 = toward the face, 90 = up): brims,
// crowns, capes and anything else that has to follow a curve.
const arc = (cx, cy, rx, ry, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy - Math.sin(a) * ry];
});
// A little five-point star (prints, charms, a spell's trim).
const star = (x, y, r, c) => F(T(Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5;
  const rr = i % 2 ? r * 0.44 : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c));
// A cut gem: the stone, a dark facet on its shaded side, and a spark of white.
const gem = (x, y, r, c) => [F(T([[x, y - r], [x + r * 0.8, y], [x, y + r], [x - r * 0.8, y]], c)),
  F(T([[x, y - r], [x + r * 0.8, y], [x, y + r]], shade(c, -22))), F(E(x - r * 0.22, y - r * 0.3, r * 0.28, r * 0.2, '#ffffff'))];
// Gold braid along a run: the band, its light edge and its shadow.
const braid = (x, y, w, h, c = '#e8c470') => [F(R(x, y, w, h, c)), F(R(x, y, w, Math.min(0.4, h / 3), shade(c, 26))), F(R(x, y + h - Math.min(0.4, h / 3), w, Math.min(0.4, h / 3), shade(c, -24)))];
// Criss-cross lacing between two edges, with the eyelets it runs through.
const lacing = (x0, x1, y0, y1, n, c, eye) => Array.from({ length: n }, (_, i) => {
  const a = y0 + ((y1 - y0) * i) / n;
  const b = y0 + ((y1 - y0) * (i + 1)) / n;
  return [F(limb(x0, i % 2 ? a : b, x1, i % 2 ? b : a, 0.34, 0.34, c)), F(E(x0, a, 0.3, 0.3, eye)), F(E(x1, a, 0.3, 0.3, eye))];
}).flat();
// Studs or rivets along a run.
const studs = (list, r, c) => list.flatMap(([x, y]) => [F(E(x, y, r, r, shade(c, -24))), F(E(x, y - r * 0.25, r * 0.7, r * 0.5, c))]);
// A scalloped lace edge along a run.
const lace = (x0, x1, y, c, step = 1.5) => Array.from({ length: Math.max(1, Math.round((x1 - x0) / step)) }, (_, i) => F(E(x0 + step / 2 + i * step, y, step * 0.6, step * 0.42, c)));
// The body of a top: the torso down to a hem, the light falling down its left and across the chest,
// a crease under the near arm, and the hem turning back into the light.
function cloth(main, hem = 35.4, opt = {}) {
  const dark = opt.dark ?? shade(main, -16);
  const lite = opt.lite ?? shade(main, 14);
  const pts = [...TORSO.slice(0, 6), [22.4, hem], [8.8, hem], ...TORSO.slice(8)];
  return [T(pts, main),
    // Light down the back edge and over the chest.
    F(T([[10.1, 27], [12.8, 26.7], [12.2, hem - 1.2], [9.85, hem - 1.2]], lite)),
    F(E(MID + 2.3, 29.4, 2.3, 1.1, shade(main, 5))),
    // The cloth gathering under the near arm, and at the waist.
    ...crease(20.6, 29.2, 18.8, 32.6, 0.8, dark, lite),
    ...crease(12.4, 32.4, 14.6, 34.6, 0.6, dark, lite),
    // The hem, turned.
    F(R(8.9, hem - 1.1, 13.4, 0.55, lite)), F(R(8.9, hem - 0.55, 13.4, 0.55, dark))];
}
// A ribbed crew neck.
const crew = (c, inner) => [T([[MID - 3, 26.1], [MID + 3, 26.1], [MID + 2.3, 28.2], [MID, 29.2], [MID - 2.3, 28.2]], inner),
  F(T([[MID - 3, 26.1], [MID + 3, 26.1], [MID + 2.4, 27.2], [MID - 2.4, 27.2]], c))];
// A short sleeve's hem, round the upper arm.
const cuffRound = (c) => [F(E(0, 2.4, 2.6, 0.9, c))];
// A skirt from the waist, swinging a beat behind the body (m.sway), with its hem turned.
function flare(c, m, { len = 7.4, spread = 2, top = 34.2, lite = null, dark = null } = {}) {
  const s = (m?.sway ?? 0) * 0.6;
  const L = lite ?? shade(c, 14);
  const D = dark ?? shade(c, -16);
  const y1 = top + len;
  return [T([[9, top], [22.2, top], [22.6 + spread + s, y1], [8.6 - spread + s, y1]], c),
    F(T([[9, top], [11.6, top], [10.4 - spread * 0.8 + s, y1], [8.7 - spread + s, y1]], L)),
    F(R(8.7 - spread + s, y1 - 1.1, 13.9 + spread * 2, 0.55, L)), F(R(8.7 - spread + s, y1 - 0.55, 13.9 + spread * 2, 0.55, D))];
}
// Folds fanning down a skirt, each one a shadow with its lit side.
const folds = (m, dark, lite, { top = 35, len = 7.4, spread = 2, xs = [11.6, 14.4, 17.2, 20] } = {}) => {
  const s = (m?.sway ?? 0) * 0.6;
  return xs.flatMap((x) => crease(x, top, x + (x - MID) * (spread / 6) + s, top + len - 0.6, 0.55, dark, lite));
};
// A kimono's collar: two bands crossing low on the chest, the near side laid over the far one.
const cross = (c, lite, y = 31.6) => [T([[11.8, 25.9], [13.6, 25.9], [16, y], [14.6, y + 0.8]], c),
  T([[17.6, 25.9], [19.4, 25.9], [15.4, y + 0.8], [15.2, y]], c),
  F(T([[11.8, 25.9], [12.6, 25.9], [15.2, y + 0.3], [14.6, y + 0.8]], lite))];
// A sash round the waist, its knot and two tails hanging behind (they swing with the cloth).
const obi = (c, trim, m, y = 32.6, h = 2.8) => {
  const s = (m?.sway ?? 0) * 0.5;
  return [F(R(8.9, y, 13.6, h, c)), F(R(8.9, y, 13.6, 0.45, shade(c, 20))), F(R(8.9, y + h - 0.45, 13.6, 0.45, shade(c, -20))),
    F(R(9.2, y + h / 2 - 0.3, 13, 0.5, trim)),
    F(E(10.2, y + h / 2, 1.9, 1.5, shade(c, -8))), F(E(10, y + h / 2 - 0.4, 0.9, 0.5, shade(c, 22))),
    F(limb(9.6, y + h / 2, 6.4 + s, y + h + 3.4, 1.1, 0.8, c)), F(limb(9.4, y + h / 2 + 0.4, 7.8 + s, y + h + 4.6, 0.9, 0.7, shade(c, -12)))];
};
// Legs: cloth to the knee and bare below (rolled up), cloth all the way, or bare.
const bare = (p, skin) => ({ top: skin, low: skin, pad: null });
const legsIn = (c) => (p, skin) => ({ top: c, low: skin, pad: null });
const legsFull = (c, cuff = null) => () => ({ top: c, low: c, pad: null, cuff });
// A plain shoe: a sole, the shoe over it, and a light along its top edge.
const shoeIn = (c, sole) => (p, k, tint) => [k.sole(tint(sole)), k.poly([[-2.7, -1], [2.8, -1], [3, 1.6], [-2.8, 1.6]], tint(c)),
  k.poly([[-2.7, -1], [2.8, -1], [2.85, -0.4], [-2.75, -0.4]], tint(shade(c, 14)))];

// ---------- The cloth the beginner tier is cut from ----------
const CLOTH = {
  sky: '#8fc4ea', cream: '#fff2e0', sage: '#8fae94', clay: '#e0a173', coral: '#ef6e88',
  oat: '#e0cfae', navy: '#5d7fad', plum: '#a8688c', denim: '#7f93b8', slate: '#6f7f86',
  butter: '#ffd083', lilac: '#cfc4ee', berry: '#b85f6e', shell: '#ffeede',
  moss: '#8ca68e', khaki: '#c3b291', indigo: '#44557f', linen: '#9fb2c8',
  // The fantasy pieces, tier by tier: a village apprentice's cloth up to a queen's.
  russet: '#a8603c', hide: '#8a5f3e', olive: '#7a7a4a', forest: '#3f6b46', lute: '#8c3a52',
  steel: '#b4bcca', bone: '#e4ddc8', shadow: '#30293e', leafgold: '#6f9a5a', arcane: '#4a3a86',
  valk: '#c8cfdc', fae: '#8fd8c8', demon: '#4a1424',
  // Middling.
  sailor: '#3f5280', charcoal: '#4a4f63', ribbon: '#d8607a', wool: '#d9c2a4',
  festival: '#2f4a6b', rain: '#efc158', check: '#e89aa8', rust: '#c4784a',
  tartan: '#8a4a52', mustard: '#d9a641', hakama: '#3f4d7e', cord: '#a8784e',
  frost: '#a9c8e2', ruffle: '#e79cb8', cocoa: '#8a6248', petalpink: '#f6c4d2', yukata: '#6a5a96',
  // Fine.
  wine: '#7a3246', velvet: '#5a2f52', leather: '#8a5c3a', sable: '#3a3344', emerald: '#2f6b5a',
  night: '#2f3568', ivory: '#f6ead8', plumdeep: '#6b3a5c', gown: '#b48ac8', furi: '#d8506e',
  witch: '#453a62', sky2: '#a8cdf0',
  // Elite.
  royal: '#5e3f96', midnight: '#262b57', scarlet: '#c22f42', pearl: '#d6d2ea', jade: '#2f8c76',
  crystal: '#86c4dc', aurora1: '#5fd8b4', aurora2: '#6fa8e8', glacier: '#bcdcf0', obsidian: '#241f30',
  sakura: '#f6b8ce', abyss: '#1f4a52', sunlit: '#f2d890',
};

// ---------- Tops ----------
export const WARDROBE_TOPS = {
  // A plain tee: a ribbed crew neck, short sleeves, nothing else.
  tee: {
    top: () => [...cloth(CLOTH.sky), ...crew(shade(CLOTH.sky, 16), shade(CLOTH.sky, -18))],
    sleeve: () => CLOTH.sky,
    shoulder: (p, side) => [E(0, 1, 2.9, 2.6, side > 0 ? CLOTH.sky : shade(CLOTH.sky, -12)), ...cuffRound(shade(CLOTH.sky, -14))],
  },
  // A buttoned vest over a cream shirt: the shirt's collar points show above it.
  vest: {
    top: () => [...cloth(CLOTH.cream),
      // The shirt's collar, then the vest over it.
      T([[11.6, 26.4], [19.6, 26.4], [20.2, 35.3], [11, 35.3]], CLOTH.sage),
      F(T([[11.6, 26.4], [13.8, 26.4], [13.2, 35.3], [11, 35.3]], shade(CLOTH.sage, 14))),
      ...crease(19.4, 28.6, 18, 33.4, 0.6, shade(CLOTH.sage, -18), shade(CLOTH.sage, 10)),
      F(limb(15.6, 27, 15.6, 35.2, 0.25, 0.25, shade(CLOTH.sage, -20))),
      T([[MID - 2.8, 26.1], [MID, 29.4], [MID - 0.6, 26.1]], '#ffffff'), T([[MID + 2.8, 26.1], [MID, 29.4], [MID + 0.6, 26.1]], '#f4e6d2'),
      ...dots([[16.3, 30.4], [16.3, 32.4], [16.3, 34.4]], 0.5, '#f6e2b8'), ...dots([[16.3, 30.1], [16.3, 32.1], [16.3, 34.1]], 0.26, '#fff6e0')],
    sleeve: () => CLOTH.cream,
    shoulder: (p, side) => [E(0, 1, 2.9, 2.6, side > 0 ? CLOTH.cream : shade(CLOTH.cream, -12)), ...cuffRound(shade(CLOTH.cream, -14))],
  },
  // A striped shirt, the stripes wrapping round the body with it.
  stripes: {
    top: () => {
      const pts = [...TORSO.slice(0, 6), [22.4, 35.4], [8.8, 35.4], ...TORSO.slice(8)];
      return [...cloth('#fdf6ee'),
        ...[27.4, 29.4, 31.4, 33.4].map((y) => band(pts, y, y + 1, CLOTH.navy)).filter(Boolean).map(F),
        ...crew('#ffffff', shade('#fdf6ee', -16))];
    },
    sleeve: () => '#fdf6ee',
    shoulder: (p, side) => [E(0, 1, 2.9, 2.6, side > 0 ? '#fdf6ee' : '#e4dcd2'), F(R(-2.7, 0.2, 5.4, 0.9, CLOTH.navy)), ...cuffRound('#e4dcd2')],
  },
  // A work smock, long, with a big stitched front pocket and a tie at the neck.
  smock: {
    top: () => [...cloth(CLOTH.clay, 36.6),
      T([[11.2, 30.8], [20.1, 30.8], [20.3, 35.6], [11, 35.6]], shade(CLOTH.clay, 16)),
      F(R(11, 30.8, 9.3, 0.9, shade(CLOTH.clay, -18))), F(R(11, 31.7, 9.3, 0.4, shade(CLOTH.clay, 26))),
      F(limb(15.6, 31.2, 15.65, 35.4, 0.28, 0.28, shade(CLOTH.clay, -14))),
      ...ribs(11.4, 20, 35.2, 0.4, shade(CLOTH.clay, -10), 1.4),
      // The neck tie.
      F(limb(13.4, 26.2, 15.6, 28.6, 0.45, 0.45, '#fff2e0')), F(limb(17.8, 26.2, 15.6, 28.6, 0.45, 0.45, '#fff2e0')), F(E(15.6, 28.8, 0.7, 0.6, '#ffe2c4'))],
    sleeve: () => CLOTH.clay,
    shoulder: (p, side) => [E(0, 1, 3, 2.7, side > 0 ? CLOTH.clay : shade(CLOTH.clay, -13)), ...cuffRound(shade(CLOTH.clay, -15))],
  },
  // A summer tank: narrow straps, bare shoulders, a rib along the top.
  tank: {
    top: (p) => [T([[12.2, 27.2], [19.2, 27.2], [20.5, 35.3], [10.7, 35.3]], CLOTH.coral),
      F(T([[12.2, 27.2], [14.2, 27.2], [12.9, 35.3], [10.9, 35.3]], shade(CLOTH.coral, 18))),
      F(R(12.2, 27.2, 7, 0.6, shade(CLOTH.coral, 26))),
      ...crease(19.4, 29, 18.2, 33.2, 0.7, shade(CLOTH.coral, -20), shade(CLOTH.coral, 12)),
      F(R(10.8, 34.2, 9.8, 0.55, shade(CLOTH.coral, 20))), F(R(10.8, 34.75, 9.8, 0.55, shade(CLOTH.coral, -18))),
      F(limb(12.9, 25.9, 12.4, 27.4, 0.5, 0.5, CLOTH.coral)), F(limb(18.5, 25.9, 19.1, 27.4, 0.5, 0.5, shade(CLOTH.coral, -12)))],
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.6, 2.3, side > 0 ? p.skin : shade(p.skin, -8))],
  },
  // A soft knit cardigan worn open over a white shirt: ribbed front bands, long ribbed cuffs.
  cardi: {
    long: true,
    top: () => [...cloth('#fffaf2'),
      // The cardigan, open down the middle, a knit band down each front edge.
      // Open down the middle, so a good hand's width of white shirt shows between the fronts.
      T([[10.2, 26.6], [13.2, 26.4], [12.4, 35.4], [9.6, 35.4]], CLOTH.oat),
      T([[18.2, 26.4], [21.2, 26.6], [22, 35.4], [19.2, 35.4]], shade(CLOTH.oat, -10)),
      F(T([[10.2, 26.6], [11.5, 26.5], [10.9, 35.4], [9.7, 35.4]], shade(CLOTH.oat, 16))),
      ...ribs(11.9, 13.3, 26.8, 8.4, shade(CLOTH.oat, -16), 0.7), ...ribs(18.3, 19.7, 26.8, 8.4, shade(CLOTH.oat, -20), 0.7),
      ...crease(20.8, 29.2, 20, 33, 0.5, shade(CLOTH.oat, -24), shade(CLOTH.oat, 8)),
      ...dots([[19, 30.4], [19.1, 33]], 0.5, '#8d7a5c'), ...dots([[19, 30.2], [19.1, 32.8]], 0.25, '#f6ead2')],
    sleeve: () => CLOTH.oat,
    shoulder: (p, side) => [E(0, 1, 3.1, 2.7, side > 0 ? CLOTH.oat : shade(CLOTH.oat, -11))],
  },
  // A pullover hoodie: a kangaroo pocket, two drawstrings, and the hood bunched on its shoulders.
  hoodie: {
    long: true,
    top: () => [...cloth(CLOTH.moss, 36.4),
      T([[11.4, 31.4], [19.8, 31.4], [20.4, 35.6], [10.8, 35.6]], shade(CLOTH.moss, -12)),
      F(R(11.4, 31.4, 8.4, 0.4, shade(CLOTH.moss, 18))), F(limb(15.6, 31.8, 15.6, 35.4, 0.25, 0.25, shade(CLOTH.moss, -22))),
      F(limb(13.8, 28.4, 13.4, 31.6, 0.4, 0.4, '#fff6ea')), F(limb(17.4, 28.4, 17.8, 31.6, 0.4, 0.4, '#efe2d2')),
      F(E(13.4, 31.9, 0.4, 0.4, '#e8c470')), F(E(17.8, 31.9, 0.4, 0.4, '#e8c470'))],
    sleeve: () => CLOTH.moss,
    shoulder: (p, side) => [E(0, 1, 3.1, 2.7, side > 0 ? CLOTH.moss : shade(CLOTH.moss, -12))],
    // The hood itself, fallen back between the shoulders.
    back: (p, m) => {
      const s = (m?.sway ?? 0) * 0.3;
      return [T([[10.2, 25.8], [21, 25.8], [22 + s, 30.6], [15.6 + s, 32.4], [9.2 + s, 30.6]], shade(CLOTH.moss, -14)),
        F(T([[10.2, 25.8], [13, 25.8], [12 + s, 30.8], [9.4 + s, 30.4]], shade(CLOTH.moss, -2)))];
    },
  },
  // A school gym shirt: white, with the house colour across the chest and a number on it.
  gym: {
    top: () => [...cloth('#fdfbf6'),
      F(R(9.3, 30.6, 12.8, 2.2, '#e06a62')), F(R(9.3, 30.6, 12.8, 0.4, '#f49a90')), F(R(9.3, 32.4, 12.8, 0.4, '#b84a44')),
      F(R(14.4, 30.9, 0.6, 1.6, '#fdfbf6')), F(R(16.2, 30.9, 0.6, 1.6, '#fdfbf6')), F(R(16.2, 30.9, 1.4, 0.45, '#fdfbf6')), F(R(16.2, 31.7, 1.4, 0.45, '#fdfbf6')),
      ...crew('#ffffff', '#d9d2c6')],
    sleeve: () => '#fdfbf6',
    shoulder: (p, side) => [E(0, 1, 2.9, 2.6, side > 0 ? '#fdfbf6' : '#e2dbcf'), ...cuffRound('#e2dbcf')],
  },
  // An apprentice's tunic: homespun wool, laced at the throat, belted over the hip.
  apprentice: {
    long: true,
    top: () => [...cloth(CLOTH.russet, 37),
      F(T([[10.1, 27], [13, 26.7], [12.4, 37], [9.9, 37]], shade(CLOTH.russet, 18))),
      // The lacing at the throat.
      F(T([[14, 26.2], [17.2, 26.2], [16.4, 30.4], [14.8, 30.4]], shade(CLOTH.russet, -22))),
      ...lacing(14.4, 16.8, 26.8, 30, 3, '#e8dcc0', '#8a6a46'),
      // The belt, and a plain iron buckle.
      F(R(9.9, 33.2, 12.8, 1.8, CLOTH.hide)), F(R(9.9, 33.2, 12.8, 0.4, shade(CLOTH.hide, 22))), F(R(9.9, 34.6, 12.8, 0.4, shade(CLOTH.hide, -24))),
      F(R(14.6, 33, 2.1, 2.2, '#a8aab4')), F(R(15.3, 33.6, 0.6, 1.1, CLOTH.hide)),
      F(limb(21.4, 34.8, 22, 38.4, 0.5, 0.4, CLOTH.hide)),
      ...crease(12.2, 35.4, 14.4, 36.8, 0.6, shade(CLOTH.russet, -18), shade(CLOTH.russet, 14))],
    sleeve: () => CLOTH.russet,
    shoulder: (p, side) => [E(0, 1.1, 3.2, 2.8, side > 0 ? CLOTH.russet : shade(CLOTH.russet, -12))],
  },
  // A leather jerkin over a linen shirt, cross-stitched down the front.
  jerkin: {
    top: () => [...cloth('#f2e8d2'),
      T([[11.2, 26.6], [20, 26.6], [20.6, 35.3], [10.8, 35.3]], CLOTH.hide),
      F(T([[11.2, 26.6], [13.4, 26.6], [12.8, 35.3], [10.8, 35.3]], shade(CLOTH.hide, 20))),
      ...crease(19.4, 28.6, 18.2, 33.6, 0.6, shade(CLOTH.hide, -24), shade(CLOTH.hide, 10)),
      // The lacing, criss-crossed the whole way down.
      ...lacing(14.2, 17, 27.4, 34.6, 5, '#e8dcc0', '#5e452e'),
      // Shoulder flaps, and the stitched hem.
      F(T([[11.4, 26.6], [14.6, 26.6], [14, 29], [11.2, 28.8]], shade(CLOTH.hide, 12))),
      F(T([[20, 26.6], [16.8, 26.6], [17.4, 29], [20.3, 28.8]], shade(CLOTH.hide, -10))),
      ...ribs(11.2, 20.4, 34.6, 0.4, shade(CLOTH.hide, 24), 1.3)],
    sleeve: () => '#f2e8d2',
    shoulder: (p, side) => [E(0, 1, 3, 2.7, side > 0 ? CLOTH.hide : shade(CLOTH.hide, -12)), ...studs([[-1.4, 1.4], [1.4, 1.4]], 0.4, '#b4bcca')],
  },

  // ---------- Middling: trim, pattern and a proper collar ----------
  // A sailor blouse: the square collar over the shoulders, its white lines, and a red kerchief
  // knotted at the chest where it can be seen.
  sailor: {
    top: () => [...cloth('#fdfbf6'),
      T([[10.4, 25.9], [20.8, 25.9], [20.2, 30.4], [11, 30.4]], CLOTH.sailor),
      F(R(11.2, 29.3, 8.8, 0.45, '#ffffff')), F(R(11.2, 28.2, 8.8, 0.45, '#ffffff')),
      // The collar opens in a V, with the blouse showing through it.
      T([[13.4, 25.9], [17.8, 25.9], [15.6, 31.4]], '#fdfbf6'),
      F(T([[13.8, 26.2], [17.4, 26.2], [15.6, 30.8]], '#f2ece2')),
      // The kerchief: a knot and two points.
      F(E(15.6, 31.2, 1.5, 1.2, '#d8495c')), F(E(15.4, 30.9, 0.8, 0.45, '#f2808e')),
      F(T([[14.4, 31.8], [16.8, 31.8], [15.6, 35]], '#d8495c')), F(T([[14.4, 31.8], [15.4, 31.8], [15.2, 34.4]], '#f2808e'))],
    sleeve: () => '#fdfbf6',
    shoulder: (p, side) => [E(0, 1, 2.9, 2.6, side > 0 ? '#fdfbf6' : '#e2dbcf'), F(E(0, 0.2, 2.9, 1.5, side > 0 ? CLOTH.sailor : shade(CLOTH.sailor, -12))), ...cuffRound('#e2dbcf')],
  },
  // A school blazer worn open over a shirt and tie, with a crest on the breast and gold buttons.
  blazer: {
    long: true,
    top: () => [...cloth('#fdfbf6'),
      T([[10.2, 26.4], [13.6, 26.2], [12.6, 35.4], [9.6, 35.4]], CLOTH.charcoal),
      T([[17.8, 26.2], [21.2, 26.4], [22, 35.4], [18.8, 35.4]], shade(CLOTH.charcoal, -8)),
      F(T([[10.2, 26.4], [11.6, 26.3], [11, 35.4], [9.7, 35.4]], shade(CLOTH.charcoal, 20))),
      // Lapels, folded back.
      F(T([[12.2, 26.3], [14.4, 26.3], [12.8, 30.8]], shade(CLOTH.charcoal, 14))), F(T([[19, 26.3], [16.8, 26.3], [18.6, 30.8]], shade(CLOTH.charcoal, 4))),
      // The tie, between them.
      F(T([[14.8, 27], [16.4, 27], [16.6, 30.4], [14.6, 30.4]], '#9a3f4c')), F(T([[14.6, 30.4], [16.6, 30.4], [15.6, 34.6]], '#b8505e')),
      ...dots([[19, 31], [19.1, 33.4]], 0.55, '#c8a24a'), ...dots([[19, 30.8], [19.1, 33.2]], 0.26, '#f2dc9c'),
      // The crest.
      F(T([[11.8, 30.4], [13.8, 30.4], [13.8, 32], [12.8, 32.8], [11.8, 32]], '#c8a24a')), F(T([[12.2, 30.8], [13.4, 30.8], [12.8, 32.2]], '#f2dc9c'))],
    sleeve: () => CLOTH.charcoal,
    shoulder: (p, side) => [E(0, 1, 3.1, 2.7, side > 0 ? CLOTH.charcoal : shade(CLOTH.charcoal, -10))],
  },
  // A ribbon blouse: a frilled placket down the front and a big bow where it can be seen.
  blouse: {
    long: true,
    top: () => [...cloth(CLOTH.cream),
      ...lace(11.4, 20, 26.6, '#ffffff', 1.5),
      F(R(14.4, 26.4, 2.4, 9, '#ffffff')), F(R(14.4, 26.4, 0.5, 9, '#efe2d0')), F(R(16.3, 26.4, 0.5, 9, '#efe2d0')),
      ...dots([[15.6, 31.6], [15.6, 33.8]], 0.4, '#e8dcc4'),
      // The bow.
      F(T([[15.6, 30.6], [11.8, 29], [11.4, 32.6]], CLOTH.ribbon)), F(T([[15.6, 30.6], [19.4, 29], [19.8, 32.6]], shade(CLOTH.ribbon, -10))),
      F(T([[12.4, 29.6], [14.6, 30.2], [14.4, 31], [12.2, 31.4]], shade(CLOTH.ribbon, 18))),
      F(E(15.6, 30.7, 1.2, 1.1, shade(CLOTH.ribbon, -16))), F(E(15.4, 30.4, 0.6, 0.35, shade(CLOTH.ribbon, 22)))],
    sleeve: () => CLOTH.cream,
    shoulder: (p, side) => [E(0, 1, 3, 2.7, side > 0 ? CLOTH.cream : shade(CLOTH.cream, -12))],
  },
  // A cable-knit jumper: two cables up the front, a snowflake between them, ribbing at the hem.
  knit: {
    long: true,
    top: () => [...cloth(CLOTH.wool, 36.2),
      // The cables: a braid of short strokes that lean one way then the other.
      ...Array.from({ length: 7 }, (_, i) => F(limb(12.4, 27 + i * 1.3, 13.8, 27.9 + i * 1.3, 0.75, 0.75, shade(CLOTH.wool, 16)))),
      ...Array.from({ length: 7 }, (_, i) => F(limb(17.4, 27.9 + i * 1.3, 18.8, 27 + i * 1.3, 0.75, 0.75, shade(CLOTH.wool, 16)))),
      F(limb(12.2, 26.8, 12.2, 36, 0.3, 0.3, shade(CLOTH.wool, -16))), F(limb(19, 26.8, 19, 36, 0.3, 0.3, shade(CLOTH.wool, -16))),
      // A snowflake, knitted in.
      ...[0, 60, 120].map((a) => F(limb(15.6 - Math.cos((a * Math.PI) / 180) * 1.9, 31.6 - Math.sin((a * Math.PI) / 180) * 1.9, 15.6 + Math.cos((a * Math.PI) / 180) * 1.9, 31.6 + Math.sin((a * Math.PI) / 180) * 1.9, 0.4, 0.4, '#fdfbf6'))),
      F(E(15.6, 31.6, 0.55, 0.55, '#fdfbf6')),
      ...ribs(9.4, 21.8, 34.6, 1.6, shade(CLOTH.wool, -14), 1.1),
      ...crew(shade(CLOTH.wool, 18), shade(CLOTH.wool, -18))],
    sleeve: () => CLOTH.wool,
    shoulder: (p, side) => [E(0, 1, 3.2, 2.8, side > 0 ? CLOTH.wool : shade(CLOTH.wool, -11))],
  },
  // A festival happi: an open indigo coat with white borders down the fronts, a crest on the back
  // and a red sash tied at the waist.
  happi: {
    top: (p, m) => [...cloth(CLOTH.festival, 37),
      F(T([[10.1, 27], [13.4, 26.7], [12.6, 37], [9.9, 37]], '#f4efe2')),
      F(T([[18, 26.7], [21.3, 27], [21.6, 37], [18.8, 37]], '#e8e0d0')),
      F(T([[12.6, 26.7], [19, 26.7], [18.6, 28], [13, 28]], '#f4efe2')),
      // The body of the coat between the borders, open on a plain chest.
      F(T([[13.4, 28], [18, 28], [18.6, 37], [12.8, 37]], shade(CLOTH.festival, -18))),
      // A round crest.
      F(E(15.7, 31.8, 1.9, 1.9, '#f4efe2')), F(E(15.7, 31.8, 1.2, 1.2, CLOTH.festival)), F(E(15.7, 31.8, 0.55, 0.55, '#f4efe2')),
      F(R(9.9, 33.6, 12.8, 2.2, '#cf4a4a')), F(R(9.9, 33.6, 12.8, 0.4, '#ec7a70')), F(R(9.9, 35.4, 12.8, 0.4, '#a63535')),
      F(limb(10.4, 34.7, 7.4 + (m?.sway ?? 0) * 0.5, 39.4, 0.9, 0.6, '#cf4a4a'))],
    sleeve: () => CLOTH.festival,
    shoulder: (p, side) => [E(0, 1.2, 3.4, 2.9, side > 0 ? CLOTH.festival : shade(CLOTH.festival, -12)), F(R(-3.2, 2.2, 6.4, 0.7, '#f4efe2'))],
  },
  // A toggle raincoat, buttoned to the throat, with the hood down at the back.
  raincoat: {
    long: true,
    top: () => [...cloth(CLOTH.rain, 36.6),
      F(T([[10.1, 27], [13.2, 26.7], [12.4, 36.6], [9.9, 36.6]], shade(CLOTH.rain, 18))),
      F(limb(15.6, 26.4, 15.6, 36.4, 0.35, 0.35, shade(CLOTH.rain, -22))),
      // Toggles: a wooden bar and its loop, three down the front.
      ...[29, 31.8, 34.6].map((y) => F(R(14, y - 0.3, 3.2, 0.7, '#8a6a46'))),
      ...[29, 31.8, 34.6].flatMap((y) => [F(E(14.1, y, 0.55, 0.75, '#6d5234')), F(E(17.1, y, 0.55, 0.75, '#6d5234'))]),
      F(R(9.9, 35.4, 12.8, 0.5, shade(CLOTH.rain, -20))),
      F(R(11.2, 31.4, 3.2, 2.4, shade(CLOTH.rain, -10))), F(R(17, 31.4, 3.2, 2.4, shade(CLOTH.rain, -14)))],
    sleeve: () => CLOTH.rain,
    shoulder: (p, side) => [E(0, 1.1, 3.2, 2.8, side > 0 ? CLOTH.rain : shade(CLOTH.rain, -12))],
    back: (p, m) => {
      const s = (m?.sway ?? 0) * 0.3;
      return [T([[10, 25.6], [21.2, 25.6], [22.2 + s, 31], [15.6 + s, 33], [9 + s, 31]], shade(CLOTH.rain, -14)),
        F(T([[10, 25.6], [13, 25.6], [11.8 + s, 31.2], [9.2 + s, 30.8]], shade(CLOTH.rain, 2)))];
    },
  },
  // A gingham shirt, checked, with the sleeves rolled and the hem knotted at the waist.
  gingham: {
    top: () => {
      const pts = [...TORSO.slice(0, 6), [22.4, 35.4], [8.8, 35.4], ...TORSO.slice(8)];
      return [...cloth('#fdfbf6'),
        ...[27.4, 29.8, 32.2, 34.4].map((y) => band(pts, y, y + 1, CLOTH.check)).filter(Boolean).map(F),
        ...[11.4, 14, 16.6, 19.2].map((x) => F(R(x, 28.6, 1.2, 6.8, CLOTH.check))),
        ...[11.4, 14, 16.6, 19.2].flatMap((x) => [29.8, 32.2, 34.6].map((y) => F(R(x, y, 1.2, 1.2, shade(CLOTH.check, -22))))),
        F(limb(15.6, 26.4, 15.6, 33, 0.3, 0.3, '#d8cec0')),
        // The knotted hem.
        F(E(15.6, 34.8, 1.9, 1.4, '#fdfbf6')), F(E(15.3, 34.5, 1, 0.55, '#ffffff')),
        F(limb(16.6, 35, 18.4, 36.4, 0.7, 0.4, '#fdfbf6')), F(limb(14.6, 35, 12.8, 36.4, 0.7, 0.4, '#efe6da'))];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.9, 2.6, side > 0 ? '#fdfbf6' : '#e4dcd0'), F(R(-2.9, 1.4, 5.8, 0.9, CLOTH.check)), ...cuffRound('#e4dcd0')],
  },
  // An autumn poncho: one wide piece of cloth with a zigzag band and a fringe along the hem.
  poncho: {
    top: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      return [T([[11.4, 25.8], [19.8, 25.8], [23.4 + s, 36.2], [7.8 + s, 36.2]], CLOTH.rust),
        F(T([[11.4, 25.8], [13.6, 25.8], [10.6 + s, 36.2], [7.9 + s, 36.2]], shade(CLOTH.rust, 16))),
        ...crease(19.6, 28.4, 21.6 + s, 34.6, 0.8, shade(CLOTH.rust, -18), shade(CLOTH.rust, 12)),
        // The woven band, a row of leaning strokes each way.
        ...Array.from({ length: 8 }, (_, i) => F(limb(9.4 + s * 0.8 + i * 1.7, 33.4, 10.2 + s * 0.8 + i * 1.7, 31.6, 0.55, 0.55, i % 2 ? '#e8c470' : '#f2efe2'))),
        F(R(8.4 + s * 0.9, 33.4, 14.8, 0.5, shade(CLOTH.rust, -24))),
        // Its fringe.
        ...Array.from({ length: 11 }, (_, i) => F(R(8.2 + s + i * 1.4, 36, 0.6, 2.2, i % 2 ? CLOTH.rust : shade(CLOTH.rust, -14)))),
        F(T([[13.6, 25.8], [17.6, 25.8], [15.6, 29.4]], shade(CLOTH.rust, -24)))];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.6, 2.3, side > 0 ? p.skin : shade(p.skin, -8))],
  },
  // A ranger's jerkin: forest leather, a quiver strap across the chest, a feather at the shoulder.
  ranger: {
    top: () => [...cloth(CLOTH.forest, 36.4),
      F(T([[10.1, 27], [13, 26.7], [12.4, 36.4], [9.9, 36.4]], shade(CLOTH.forest, 20))),
      // The collar, open in a V over a cream shirt.
      F(T([[13.4, 26.2], [17.8, 26.2], [15.6, 31.4]], '#f2e8d2')),
      F(T([[12.6, 26.2], [14.6, 26.2], [15.6, 31.4], [13.8, 31.4]], shade(CLOTH.forest, -20))),
      F(T([[18.6, 26.2], [16.6, 26.2], [15.6, 31.4], [17.4, 31.4]], shade(CLOTH.forest, -12))),
      // The strap and belt.
      F(limb(10.6, 29.4, 20.8, 35, 1.3, 1.3, CLOTH.hide)), F(limb(10.6, 29, 20.8, 34.6, 0.3, 0.3, shade(CLOTH.hide, 22))),
      F(R(9.9, 34.4, 12.8, 1.5, shade(CLOTH.hide, -16))), F(R(14.8, 34.2, 1.8, 1.9, '#c8a24a')),
      ...studs([[13, 31.4], [17.8, 33.4]], 0.4, '#b4bcca'),
      // A feather, tucked at the shoulder.
      F(T([[19.4, 26.6], [21.8, 22.6], [22.4, 26.4], [20.6, 28.4]], '#b4d8a0')), F(limb(19.6, 27.6, 22, 23, 0.26, 0.2, '#f2f6e8'))],
    sleeve: () => CLOTH.forest,
    shoulder: (p, side) => [E(0, 1.1, 3.2, 2.8, side > 0 ? CLOTH.forest : shade(CLOTH.forest, -12))],
  },
  // A bard's doublet: two colours quartered, slashed sleeves, and a lute strap over the shoulder.
  bard: {
    top: () => [...cloth(CLOTH.lute),
      F(T([[10.1, 27], [15.6, 26.5], [15.6, 35.3], [9.9, 35.3]], GOLDEN)),
      F(T([[10.1, 27], [12.4, 26.8], [11.8, 35.3], [9.9, 35.3]], '#f6e4b0')),
      F(limb(15.6, 26.4, 15.6, 35.3, 0.3, 0.3, '#b08a3a')),
      // Slashes, with the shirt puffing through them.
      ...[28.4, 30.6, 32.8].flatMap((y) => [F(E(12.8, y, 1, 0.7, '#fff6e2')), F(E(18.6, y, 1, 0.7, '#fff6e2'))]),
      ...braid(9.9, 26.4, 11.8, 0.5), ...braid(9.9, 34.6, 12.8, 0.6),
      // The lute's strap, and a row of little bells on it.
      F(limb(20.6, 26.6, 10.8, 33.6, 1.2, 1.2, '#7a4a2c')),
      ...dots([[18.4, 28.2], [15.4, 30.4], [12.4, 32.4]], 0.5, GOLDEN)],
    sleeve: () => CLOTH.lute,
    shoulder: (p, side) => [E(0, 1.4, 3.4, 3, side > 0 ? CLOTH.lute : shade(CLOTH.lute, -12)), F(E(0, 2.4, 2.9, 1.2, GOLDEN)), F(E(-0.8, 0.6, 1.3, 0.9, '#fff6e2'))],
  },

  // ---------- Fine: layers, lacing and tailoring ----------
  // A laced doublet: gold lacing up the front, a standing collar, and the shirt puffing through
  // the slashes in the sleeves.
  doublet: {
    long: true,
    top: () => [...cloth(CLOTH.wine, 36),
      F(T([[10.1, 27], [13, 26.7], [12.4, 36], [9.9, 36]], shade(CLOTH.wine, 18))),
      // The front opens on a cream shirt, laced across it.
      F(T([[13.8, 26.4], [17.4, 26.4], [17.6, 36], [13.6, 36]], '#f4e8d2')),
      ...lacing(13.9, 17.3, 27.4, 35.4, 6, '#e8c470', '#b08a3a'),
      ...braid(13.2, 26.4, 0.7, 9.6), ...braid(17.4, 26.4, 0.7, 9.6),
      // A standing collar.
      T([[12.6, 25.6], [18.6, 25.6], [18.2, 27.6], [13, 27.6]], shade(CLOTH.wine, -14)),
      ...braid(12.8, 25.7, 5.6, 0.5),
      F(R(9.9, 34.8, 12.8, 0.5, '#e8c470'))],
    sleeve: () => CLOTH.wine,
    shoulder: (p, side) => [E(0, 1.1, 3.2, 2.8, side > 0 ? CLOTH.wine : shade(CLOTH.wine, -12)),
      F(E(-1, 1.6, 1.3, 1.1, '#f4e8d2')), F(E(1.4, 2, 1.2, 1, '#f4e8d2')), ...braid(-3.2, -0.6, 6.4, 0.5)],
  },
  // A laced corset over a puff-sleeved blouse: boning, a ribbon at the top, a point at the waist.
  corset: {
    top: () => [...cloth('#fdf6ec'),
      ...lace(11.2, 20, 26.6, '#ffffff', 1.5),
      T([[11.2, 29], [20, 29], [20.6, 34.4], [15.6, 36.4], [10.6, 34.4]], CLOTH.sable),
      F(T([[11.2, 29], [13.2, 29], [12.6, 34.6], [10.7, 34.4]], shade(CLOTH.sable, 22))),
      ...[13.2, 15.6, 18].map((x) => F(limb(x, 29.2, x + (x - MID) * 0.12, 35, 0.3, 0.3, shade(CLOTH.sable, 16)))),
      ...lacing(13.9, 17.3, 29.8, 34.4, 4, '#f2dcc0', '#c8a470'),
      F(R(11.2, 29, 8.8, 0.5, '#e8c470')),
      // The ribbon at the neckline.
      F(T([[15.6, 28.4], [12.8, 27.2], [12.6, 29.8]], CLOTH.ribbon)), F(T([[15.6, 28.4], [18.4, 27.2], [18.6, 29.8]], shade(CLOTH.ribbon, -12))), F(E(15.6, 28.4, 0.85, 0.8, shade(CLOTH.ribbon, -20)))],
    sleeve: (p) => '#fdf6ec',
    shoulder: (p, side) => [E(0, 1.4, 3.4, 3, side > 0 ? '#fdf6ec' : '#e8dfd0'), F(E(0, 2.6, 2.9, 1.2, '#ffffff')), F(E(-0.6, 0.4, 1.4, 1, '#ffffff'))],
  },
  // A layered kimono: three collars, one inside the other, over a figured ground.
  kimono: {
    long: true,
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [23 + sw * 1.4, 44], [8.2 + sw * 1.4, 44], ...TORSO.slice(8)];
      return [T(pts, CLOTH.emerald),
        F(T([[10.2, 27], [12.8, 26.7], [10 + sw * 1.4, 44], [8.3 + sw * 1.4, 44]], shade(CLOTH.emerald, 18))),
        ...folds(m, shade(CLOTH.emerald, -18), shade(CLOTH.emerald, 14), { top: 36, len: 7.4, spread: 1.2, xs: [12.2, 15.6, 19] }),
        ...[[34, 38.4], [20, 40.6], [27, 42.6]].map(([x, y]) => F(E(x / 2 + sw * 0.3, y, 1.5, 1.1, shade(CLOTH.emerald, 22)))),
        ...cross(CLOTH.wine, shade(CLOTH.wine, 20), 32.4),
        ...cross('#f2e4cc', '#ffffff', 31),
        ...cross('#e8c470', '#f6e0a8', 29.6),
        ...obi(CLOTH.sable, '#e8c470', m, 33, 3.4),
        F(T([[8.2 + sw * 1.4, 43.3], [23 + sw * 1.4, 43.3], [23 + sw * 1.4, 44], [8.2 + sw * 1.4, 44]], shade(CLOTH.emerald, -22)))];
    },
    sleeve: () => CLOTH.emerald,
    shoulder: (p, side) => [E(0, 1.2, 3.4, 3, side > 0 ? CLOTH.emerald : shade(CLOTH.emerald, -12))],
    legs: bare,
    shoe: (p, k, tint) => [k.sole(tint('#5c4a38')), k.poly([[-2.6, -0.8], [2.8, -0.8], [3, 1.2], [-2.8, 1.2]], tint('#f2e8d0'))],
  },
  // A studded leather jack, buckled across the chest.
  jack: {
    long: true,
    top: () => [...cloth(CLOTH.leather, 36.2),
      F(T([[10.1, 27], [13, 26.7], [12.4, 36.2], [9.9, 36.2]], shade(CLOTH.leather, 18))),
      F(T([[14.6, 26.4], [17, 26.4], [17.2, 36.2], [14.4, 36.2]], shade(CLOTH.leather, -22))),
      ...studs([[12.2, 28.6], [12.2, 31], [12.2, 33.4], [19, 28.6], [19, 31], [19, 33.4]], 0.5, '#d8d2c4'),
      // Two buckled straps across it.
      F(R(10.2, 29.6, 11.4, 1.3, shade(CLOTH.leather, -30))), F(R(10.2, 29.6, 11.4, 0.35, shade(CLOTH.leather, -6))),
      F(R(10.2, 33.2, 11.4, 1.3, shade(CLOTH.leather, -30))), F(R(10.2, 33.2, 11.4, 0.35, shade(CLOTH.leather, -6))),
      F(R(17.4, 29.4, 1.8, 1.7, '#c8b48c')), F(R(17.9, 29.8, 0.5, 0.9, shade(CLOTH.leather, -30))),
      F(R(17.4, 33, 1.8, 1.7, '#c8b48c')), F(R(17.9, 33.4, 0.5, 0.9, shade(CLOTH.leather, -30))),
      F(R(9.9, 35.4, 12.8, 0.5, shade(CLOTH.leather, -28)))],
    sleeve: () => shade(CLOTH.leather, -10),
    shoulder: (p, side) => [E(0, 1.2, 3.4, 3, side > 0 ? CLOTH.leather : shade(CLOTH.leather, -14)), ...studs([[-1.4, 1.6], [1.4, 1.6]], 0.45, '#d8d2c4')],
  },
  // A frock coat: long skirts, wide lapels, a waistcoat and a row of buttons.
  frock: {
    long: true,
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      return [...cloth(CLOTH.sable, 36),
        // Its skirts, hanging past the hips.
        T([[9.8, 34], [21.6, 34], [23 + sw, 42.4], [8.2 + sw, 42.4]], CLOTH.sable),
        F(T([[9.8, 34], [12, 34], [10.4 + sw, 42.4], [8.3 + sw, 42.4]], shade(CLOTH.sable, 20))),
        F(limb(15.6, 34.4, 15.6 + sw * 1.1, 42.2, 0.35, 0.35, shade(CLOTH.sable, -26))),
        // A gold waistcoat between the fronts.
        F(T([[13.8, 26.6], [17.4, 26.6], [17.6, 35], [13.6, 35]], '#b89a52')),
        ...[28.4, 30.4, 32.4, 34.4].map((y) => F(E(15.6, y, 0.42, 0.42, '#f2e0a8'))),
        // Lapels folded back over it.
        F(T([[12.4, 26.4], [15, 26.4], [12.8, 31.8]], shade(CLOTH.sable, 16))), F(T([[18.8, 26.4], [16.2, 26.4], [18.4, 31.8]], shade(CLOTH.sable, 6))),
        ...dots([[19, 32.6], [19.1, 34.6]], 0.5, '#d8c88c'),
        F(T([[14.4, 26.4], [16.8, 26.4], [15.6, 29.4]], '#f4ecdc'))];
    },
    sleeve: () => CLOTH.sable,
    shoulder: (p, side) => [E(0, 1.1, 3.2, 2.8, side > 0 ? CLOTH.sable : shade(CLOTH.sable, -10))],
  },
  // A starwork robe: deep night cloth sewn with silver stars, a moon at the throat.
  robe: {
    long: true,
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [23.4 + sw * 1.5, 44], [7.8 + sw * 1.5, 44], ...TORSO.slice(8)];
      return [T(pts, CLOTH.night),
        F(T([[10.2, 27], [12.8, 26.7], [9.8 + sw * 1.5, 44], [7.9 + sw * 1.5, 44]], shade(CLOTH.night, 20))),
        ...folds(m, shade(CLOTH.night, -20), shade(CLOTH.night, 18), { top: 36, len: 7.4, spread: 2, xs: [12, 15.6, 19.2] }),
        ...[[12.6, 30.4, 1], [19, 32.2, 0.8], [11.4, 38, 0.9], [18.2, 40.4, 1.1], [15, 42.4, 0.7], [21, 36.6, 0.8]].map(([x, y, r]) => star(x + sw * Math.max(0, y - 36) * 0.22, y, r, '#e4ecff')),
        ...[[14.4, 34.6], [17.4, 37.4], [10.6, 34]].map(([x, y]) => F(E(x, y, 0.3, 0.3, '#ffffff'))),
        // The hem and fronts, braided in silver.
        ...braid(13, 26.6, 0.6, 17, '#bcc8e8'), ...braid(17.8, 26.6, 0.6, 17, '#9fabd0'),
        F(T([[7.9 + sw * 1.5, 43.2], [23.4 + sw * 1.5, 43.2], [23.4 + sw * 1.5, 44], [7.9 + sw * 1.5, 44]], '#bcc8e8')),
        // A crescent clasp.
        F(E(15.6, 28.4, 1.6, 1.6, '#e8eeff')), F(E(16.3, 28.1, 1.4, 1.4, CLOTH.night))];
    },
    sleeve: () => CLOTH.night,
    shoulder: (p, side) => [E(0, 1.2, 3.4, 3, side > 0 ? CLOTH.night : shade(CLOTH.night, -12))],
    legs: bare,
    shoe: shoeIn('#3a3f6b', '#262a4a'),
  },
  // A tailcoat: black over a white waistcoat and cravat, its tails hanging behind.
  tailcoat: {
    long: true,
    top: () => [...cloth('#2e2a38', 35.8),
      F(T([[10.1, 27], [12.8, 26.7], [12.2, 35.8], [9.9, 35.8]], '#4a4458')),
      F(T([[13.6, 26.4], [17.6, 26.4], [17.8, 35.6], [13.4, 35.6]], '#f4f0e6')),
      ...[30, 32, 34].map((y) => F(E(15.6, y, 0.4, 0.4, '#cfc6b4'))),
      F(T([[12.4, 26.4], [15, 26.4], [12.9, 31.4]], '#413c50')), F(T([[18.8, 26.4], [16.2, 26.4], [18.3, 31.4]], '#36313f')),
      // The cravat.
      F(T([[14.2, 26.2], [17, 26.2], [16.6, 28.6], [14.6, 28.6]], '#ffffff')), F(E(15.6, 29.2, 1.3, 1.1, '#ffffff')), F(E(15.3, 28.9, 0.6, 0.35, '#e8e2d6'))],
    sleeve: () => '#2e2a38',
    shoulder: (p, side) => [E(0, 1.1, 3.2, 2.8, side > 0 ? '#2e2a38' : '#24212c')],
    back: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.6;
      return [T([[10.6, 33.4], [20.6, 33.4], [19.4 + sw, 43.4], [16.8 + sw, 43.4], [15.6 + sw * 0.6, 37.4], [14.4 + sw, 43.4], [11.8 + sw, 43.4]], '#2e2a38'),
        F(T([[10.6, 33.4], [12.6, 33.4], [13.2 + sw, 43.4], [11.9 + sw, 43.4]], '#423d52'))];
    },
  },
  // A velvet bolero: a short open jacket with braid all round, over a camisole.
  bolero: {
    top: () => [...cloth('#f2e2ea'),
      F(R(9.4, 33.4, 12.8, 0.5, '#d8c0cc')),
      T([[10.2, 26.5], [13.4, 26.3], [13, 32.6], [9.8, 32.6]], CLOTH.velvet),
      T([[17.6, 26.3], [20.8, 26.5], [21.4, 32.6], [18.2, 32.6]], shade(CLOTH.velvet, -10)),
      F(T([[10.2, 26.5], [11.6, 26.4], [11.2, 32.6], [9.9, 32.6]], shade(CLOTH.velvet, 22))),
      ...braid(9.8, 32.2, 3.3, 0.5), ...braid(18.2, 32.2, 3.3, 0.5),
      ...braid(13, 26.4, 0.55, 6.2), ...braid(17.6, 26.4, 0.55, 6.2),
      F(E(13.2, 29.4, 0.6, 0.6, '#e8c470')), F(E(18, 29.4, 0.6, 0.6, '#c8a450'))],
    sleeve: () => CLOTH.velvet,
    shoulder: (p, side) => [E(0, 1.2, 3.3, 2.9, side > 0 ? CLOTH.velvet : shade(CLOTH.velvet, -12)), ...braid(-3.1, 2.4, 6.2, 0.45)],
  },
  // A paladin's plate: a steel breast over a blue tabard, with the sun struck into it.
  paladin: {
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      return [...cloth(CLOTH.steel, 35.4),
        F(T([[10.1, 27], [13, 26.7], [12.4, 35.4], [9.9, 35.4]], shade(CLOTH.steel, 20))),
        F(T([[19, 26.7], [21.4, 27], [21.8, 35.4], [19.2, 35.4]], shade(CLOTH.steel, -18))),
        // Where the plate is beaten into a ridge down the middle.
        F(limb(15.6, 26.6, 15.6, 35.2, 0.4, 0.4, shade(CLOTH.steel, 26))), F(limb(16.2, 26.6, 16.2, 35.2, 0.3, 0.3, shade(CLOTH.steel, -20))),
        // The tabard, hanging below it.
        T([[11.4, 33.6], [19.8, 33.6], [20.6 + sw, 43.4], [10.6 + sw, 43.4]], '#2f5a9c'),
        F(T([[11.4, 33.6], [13.4, 33.6], [12.6 + sw, 43.4], [10.7 + sw, 43.4]], '#4a78c4')),
        ...braid(10.7 + sw, 42.4, 9.8, 0.7), ...braid(9.9, 33.2, 12.8, 1.1),
        // The sun on the breast.
        ...Array.from({ length: 8 }, (_, i) => F(limb(15.6, 30.4, 15.6 + Math.cos((i / 8) * Math.PI * 2) * 3.6, 30.4 + Math.sin((i / 8) * Math.PI * 2) * 3, 0.75, 0.22, GOLDEN))),
        F(E(15.6, 30.4, 1.6, 1.5, GOLDEN)), F(E(15.6, 30.4, 0.9, 0.85, '#fff6dc')),
        F(T([[12.6, 25.9], [18.6, 25.9], [18.2, 27.4], [13, 27.4]], shade(CLOTH.steel, -14)))];
    },
    sleeve: () => shade(CLOTH.steel, -14),
    shoulder: (p, side) => [E(0, 1, 3.5, 3.1, side > 0 ? CLOTH.steel : shade(CLOTH.steel, -16)),
      F(E(0, 0.2, 3.1, 1.7, shade(CLOTH.steel, 24))), ...braid(-3.4, 1.9, 6.8, 0.5)],
  },
  // A necromancer's coat: black wool lined with violet, clasped with bone.
  necro: {
    long: true,
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      return [...cloth(CLOTH.shadow, 35.6),
        // Its skirts, with the violet lining showing where they part.
        T([[9.8, 34], [21.6, 34], [23 + sw, 43.6], [8.2 + sw, 43.6]], CLOTH.shadow),
        F(T([[13.8, 34.4], [17.4, 34.4], [18.4 + sw, 43.4], [12.8 + sw, 43.4]], '#5e3f96')),
        F(T([[9.8, 34], [12, 34], [10.4 + sw, 43.6], [8.3 + sw, 43.6]], '#443c58')),
        F(T([[13.8, 26.4], [17.4, 26.4], [17.6, 34], [13.6, 34]], '#5e3f96')),
        // A standing collar, high at the back of the neck.
        T([[11.8, 25.4], [19.4, 25.4], [19, 28.6], [12.2, 28.6]], '#241f30'),
        F(T([[11.8, 25.4], [13.6, 25.4], [13.2, 28.6], [12.2, 28.6]], '#4a4160')),
        // Bone clasps down the front.
        ...[29.4, 31.4, 33.4].flatMap((y) => [F(E(15.6, y, 1.1, 0.5, CLOTH.bone)), F(E(14.9, y, 0.5, 0.5, CLOTH.bone)), F(E(16.3, y, 0.5, 0.5, CLOTH.bone))]),
        ...[[12.4, 38.4], [19.4, 40.4]].map(([x, y]) => star(x + sw * 0.6, y, 0.75, '#b49cdc'))];
    },
    sleeve: () => CLOTH.shadow,
    shoulder: (p, side) => [E(0, 1.2, 3.4, 3, side > 0 ? CLOTH.shadow : '#241f30'), F(E(0, 2.4, 3, 1.1, '#5e3f96'))],
  },

  // ---------- Elite: gold, gems and fine work ----------
  // A gilded cuirass, beaten into a sunburst, with a great stone at its heart.
  cuirass: {
    top: () => [...cloth(GOLDEN, 36),
      F(T([[10.1, 27], [13, 26.7], [12.6, 36], [9.9, 36]], '#f6e4b0')),
      F(T([[19, 26.7], [21.4, 27], [21.8, 36], [19.2, 36]], '#b08a3a')),
      // The rays, struck out from the stone.
      ...Array.from({ length: 9 }, (_, i) => F(limb(15.6, 31.4, 15.6 + Math.cos((i / 9) * Math.PI * 2) * 5.4, 31.4 + Math.sin((i / 9) * Math.PI * 2) * 4.4, 1.1, 0.3, '#f6e4b0'))),
      F(E(15.6, 31.4, 2.4, 2.2, '#b08a3a')), ...gem(15.6, 31.4, 1.7, '#e0485e'),
      // Its edges, beaten over.
      ...braid(9.9, 26.6, 11.8, 0.6, '#f6e4b0'), ...braid(9.9, 34.8, 12.8, 0.7, '#b08a3a'),
      F(T([[12.6, 25.9], [18.6, 25.9], [18.2, 27.4], [13, 27.4]], '#b08a3a'))],
    sleeve: () => '#d8d2c0',
    shoulder: (p, side) => [E(0, 1, 3.4, 3, side > 0 ? GOLDEN : '#b08a3a'), F(E(0, 0.2, 3.1, 1.6, '#f6e4b0')), ...braid(-3.3, 1.8, 6.6, 0.5, '#b08a3a')],
  },
  // A royal mantle: violet velvet over an ermine band, held by a gold chain.
  mantle: {
    long: true,
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      return [...cloth(CLOTH.royal, 36),
        F(T([[10.1, 27], [13, 26.7], [12.4, 36], [9.9, 36]], shade(CLOTH.royal, 20))),
        F(T([[13.8, 26.4], [17.4, 26.4], [17.6, 36], [13.6, 36]], shade(CLOTH.royal, -20))),
        // The ermine, flecked.
        F(T([[9.9, 26.4], [21.6, 26.4], [21.2, 29.8], [10.2, 29.8]], '#fdfbf4')),
        ...dots([[11.4, 28.2], [14, 27.4], [16.6, 28.6], [19.4, 27.6], [12.8, 29.2], [18.2, 29.2]], 0.42, '#3a3344'),
        // Its chain, with two clasps.
        ...dots([[11.6, 30.6], [19.6, 30.6]], 0.95, '#e8c470'), ...dots([[11.6, 30.4], [19.6, 30.4]], 0.45, '#f6e4b0'),
        ...Array.from({ length: 6 }, (_, i) => F(E(12.8 + i * 1.5, 31.4 + Math.sin((i / 5) * Math.PI) * 0.9, 0.42, 0.42, '#e8c470'))),
        ...braid(9.9, 34.8, 12.8, 0.6),
        F(limb(10.4, 30.2, 6.8 + sw, 40.4, 1.5, 1, CLOTH.royal)), F(limb(10, 30.6, 8.2 + sw, 41.2, 1, 0.7, shade(CLOTH.royal, -22)))];
    },
    sleeve: () => CLOTH.royal,
    shoulder: (p, side) => [E(0, 1.2, 3.5, 3, side > 0 ? CLOTH.royal : shade(CLOTH.royal, -12)), F(E(0, 2.4, 3.2, 1.2, '#fdfbf4'))],
  },
  // A starlit bodice: night-blue silk, sewn with gems in the shape of a constellation.
  starlit: {
    top: () => [...cloth(CLOTH.midnight),
      F(T([[10.1, 27], [13, 26.7], [12.4, 35.4], [9.9, 35.4]], shade(CLOTH.midnight, 22))),
      ...[13.2, 15.6, 18].map((x) => F(limb(x, 27, x + (x - MID) * 0.12, 35.2, 0.26, 0.26, shade(CLOTH.midnight, 14)))),
      // The constellation, drawn first and then set with stones.
      ...[[[12.6, 29.4], [15, 31.2]], [[15, 31.2], [18.4, 30.2]], [[18.4, 30.2], [19.6, 33]], [[15, 31.2], [13.8, 34.2]]].map(([[x0, y0], [x1, y1]]) => F(limb(x0, y0, x1, y1, 0.22, 0.22, '#8a9ad8'))),
      ...gem(12.6, 29.4, 0.95, '#9fd8f0'), ...gem(15, 31.2, 1.2, '#ffffff'), ...gem(18.4, 30.2, 0.95, '#c8a8f0'), ...gem(19.6, 33, 0.8, '#9fd8f0'), ...gem(13.8, 34.2, 0.8, '#f0e2a8'),
      ...braid(9.9, 34.6, 12.8, 0.6),
      F(T([[11.4, 26.2], [20, 26.2], [20.2, 28.2], [15.6, 29.4], [11.2, 28.2]], shade(CLOTH.midnight, -18)))],
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.7, 2.4, side > 0 ? CLOTH.midnight : shade(CLOTH.midnight, -12)), ...braid(-2.7, 1.8, 5.4, 0.4)],
  },
  // A phoenix haori: scarlet, with gold feathers rising along the hem and a crest at the throat.
  haori: {
    long: true,
    top: (p, m) => [...cloth(CLOTH.scarlet, 37),
      F(T([[10.1, 27], [13.4, 26.7], [12.8, 37], [9.9, 37]], shade(CLOTH.scarlet, 20))),
      F(T([[10.1, 27], [12.4, 26.8], [11.8, 37], [9.9, 37]], '#f6e4b0')),
      F(T([[19.2, 26.8], [21.5, 27], [21.8, 37], [19.6, 37]], '#c8a450')),
      // Feathers of flame, licking up from the hem.
      ...Array.from({ length: 6 }, (_, i) => F(T([[10.6 + i * 2.1, 37], [12.2 + i * 2.1, 37], [11.4 + i * 2.1, 32.4 - (i % 2) * 1.4]], '#e8c470'))),
      ...Array.from({ length: 6 }, (_, i) => F(T([[11.1 + i * 2.1, 37], [12.1 + i * 2.1, 37], [11.6 + i * 2.1, 33.4 - (i % 2) * 1.2]], '#f6e4b0'))),
      // The crest.
      F(E(15.7, 29.6, 2, 1.9, '#f6e4b0')), F(T([[15.7, 27.9], [17.4, 30.4], [15.7, 31.4], [14, 30.4]], CLOTH.scarlet)), F(E(15.7, 29.6, 0.5, 0.5, '#f6e4b0')),
      F(limb(9.9, 34.4, 22.4, 34.4, 0.7, 0.7, '#b08a3a'))],
    sleeve: () => CLOTH.scarlet,
    shoulder: (p, side) => [E(0, 1.2, 3.5, 3, side > 0 ? CLOTH.scarlet : shade(CLOTH.scarlet, -12)), ...braid(-3.3, 2.4, 6.6, 0.5)],
  },
  // A moon robe: pearl silk, with the moon in all its phases worked down the front in silver.
  moonrobe: {
    long: true,
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [23.4 + sw * 1.5, 44], [7.8 + sw * 1.5, 44], ...TORSO.slice(8)];
      return [T(pts, CLOTH.pearl),
        F(T([[10.2, 27], [12.8, 26.7], [9.8 + sw * 1.5, 44], [7.9 + sw * 1.5, 44]], '#ffffff')),
        ...folds(m, '#d4cfe0', '#ffffff', { top: 36, len: 7.4, spread: 2, xs: [12, 15.6, 19.2] }),
        // The phases, down the front.
        ...[[29.4, 1.6, 0], [32.4, 1.6, 0.85], [35.4, 1.6, 1.6]].flatMap(([y, r, off]) => [F(E(15.6, y, r, r, '#f6f4ff')), F(E(15.6 + off, y, r * 0.95, r * 0.95, '#4a4a86'))]),
        ...[[12.4, 38.4], [19.2, 40.6], [15.6, 42.4]].map(([x, y]) => star(x + sw * (y - 36) * 0.22, y, 0.9, '#f6f4ff')),
        ...braid(12.9, 26.6, 0.6, 17.4, '#eef0ff'), ...braid(18.1, 26.6, 0.6, 17.4, '#8e97c8'),
        F(T([[7.9 + sw * 1.5, 43.2], [23.4 + sw * 1.5, 43.2], [23.4 + sw * 1.5, 44], [7.9 + sw * 1.5, 44]], '#a8b4e0')),
        F(E(15.6, 26.9, 1.7, 1.6, '#e8eeff')), F(E(16.4, 26.6, 1.5, 1.5, CLOTH.pearl))];
    },
    sleeve: () => CLOTH.pearl,
    shoulder: (p, side) => [E(0, 1.2, 3.4, 3, side > 0 ? CLOTH.pearl : '#ded8ea')],
    legs: bare,
    shoe: shoeIn('#e8eaf6', '#a8aec4'),
  },
  // Dragonscale plate: jade scales lapped over one another, every rank edged in gold.
  dragon: {
    top: () => [...cloth(CLOTH.jade, 36.2),
      ...[27.2, 29.2, 31.2, 33.2, 35.2].flatMap((y, r) => Array.from({ length: 5 }, (_, i) => F(E(10.8 + i * 2.6 + (r % 2) * 1.3, y, 1.5, 1.4, r % 2 ? shade(CLOTH.jade, 14) : CLOTH.jade)))),
      ...[27.2, 29.2, 31.2, 33.2, 35.2].flatMap((y, r) => Array.from({ length: 5 }, (_, i) => F(E(10.8 + i * 2.6 + (r % 2) * 1.3, y - 0.45, 1.2, 0.7, r % 2 ? shade(CLOTH.jade, 26) : shade(CLOTH.jade, 20))))),
      ...braid(9.9, 26.4, 11.8, 0.55), ...braid(9.9, 35.6, 12.8, 0.6),
      F(T([[12.6, 25.9], [18.6, 25.9], [18.2, 27.4], [13, 27.4]], '#b08a3a')),
      ...gem(15.6, 30.4, 1.5, '#e0485e')],
    sleeve: () => shade(CLOTH.jade, -12),
    shoulder: (p, side) => [E(0, 1.1, 3.4, 3, side > 0 ? CLOTH.jade : shade(CLOTH.jade, -14)),
      F(T([[-3.2, 1.4], [3.2, 1.4], [2.4, 3.2], [-2.4, 3.2]], shade(CLOTH.jade, 18))), ...braid(-3.3, 0.8, 6.6, 0.45)],
  },
  // A crystal corset: faceted panes over a white blouse, each one catching the light.
  crystal: {
    top: () => [...cloth('#fdfbff'),
      ...lace(11.2, 20, 26.6, '#ffffff', 1.5),
      T([[11.2, 28.8], [20, 28.8], [20.6, 34.4], [15.6, 36.6], [10.6, 34.4]], CLOTH.crystal),
      // Facets.
      ...[[11.6, 29.2, 14.4, 29.2, 13, 34.6], [14.4, 29.2, 17.2, 29.2, 15.6, 36], [17.2, 29.2, 20, 29.2, 18.4, 34.6]].map(([x0, y0, x1, y1, x2, y2]) => F(T([[x0, y0], [x1, y1], [x2, y2]], shade(CLOTH.crystal, 20)))),
      ...[[11.6, 29.2, 13, 34.6, 10.9, 34.2], [18.4, 34.6, 20, 29.2, 20.5, 34.2]].map(([x0, y0, x1, y1, x2, y2]) => F(T([[x0, y0], [x1, y1], [x2, y2]], shade(CLOTH.crystal, -18)))),
      F(limb(12.4, 29.6, 13.4, 33.8, 0.3, 0.3, '#ffffff')), F(limb(17.2, 30.4, 16.4, 34.8, 0.25, 0.25, '#ffffff')),
      ...braid(11.2, 28.6, 8.8, 0.5),
      ...gem(15.6, 31.4, 1.3, '#9fe8f0')],
    sleeve: (p) => '#fdfbff',
    shoulder: (p, side) => [E(0, 1.4, 3.4, 3, side > 0 ? '#fdfbff' : '#e8e4f0'), F(E(0, 2.6, 2.9, 1.2, '#ffffff'))],
  },
  // A seraph vestment: white and gold, with a winged collar standing at the shoulders.
  seraph: {
    long: true,
    top: () => [...cloth('#f0e4c8', 36.4),
      F(T([[10.1, 27], [13, 26.7], [12.4, 36.4], [9.9, 36.4]], '#fdf6e2')),
      F(T([[13.8, 26.4], [17.4, 26.4], [17.6, 36.4], [13.6, 36.4]], '#fffaf0')),
      ...braid(13.2, 26.4, 0.6, 10), ...braid(17.4, 26.4, 0.6, 10),
      ...braid(9.9, 35.2, 12.8, 0.7), ...braid(9.9, 30.8, 12.8, 0.5),
      // The halo-mark on the breast.
      F(E(15.6, 32.8, 2, 1.9, '#b08a3a')), F(E(15.6, 32.8, 1.5, 1.4, GOLDEN)), F(E(15.6, 32.8, 1, 0.95, '#fffaf0')), ...gem(15.6, 32.8, 0.75, '#4a9ac8'),
      // The winged collar.
      F(T([[12.6, 26.2], [8.6, 23.4], [9.4, 27.4]], '#ffffff')), F(T([[18.6, 26.2], [22.6, 23.4], [21.8, 27.4]], '#efe6d4')),
      F(limb(9.6, 24.6, 12.4, 26.2, 0.3, 0.3, '#e8c470')), F(limb(21.6, 24.6, 18.8, 26.2, 0.3, 0.3, '#c8a450'))],
    sleeve: () => '#fdfaf0',
    shoulder: (p, side) => [E(0, 1.2, 3.3, 2.9, side > 0 ? '#fdfaf0' : '#ebe2d0'), ...braid(-3.1, 2.3, 6.2, 0.45)],
  },
  // An archmage's mantle: deep violet sewn with gold runes, a high collar and a star at the throat.
  archmage: {
    long: true,
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [23.4 + sw * 1.5, 44], [7.8 + sw * 1.5, 44], ...TORSO.slice(8)];
      return [T(pts, CLOTH.arcane),
        F(T([[10.2, 27], [12.8, 26.7], [9.8 + sw * 1.5, 44], [7.9 + sw * 1.5, 44]], shade(CLOTH.arcane, 20))),
        ...folds(m, shade(CLOTH.arcane, -22), shade(CLOTH.arcane, 18), { top: 36, len: 7.4, spread: 2, xs: [12, 15.6, 19.2] }),
        // Runes, worked in gold down the fronts and round the hem.
        ...[[13.4, 29.6], [13.4, 32.4], [13.4, 35.2], [18, 30.8], [18, 33.6]].flatMap(([x, y]) => [
          F(limb(x - 0.8, y - 0.8, x + 0.8, y + 0.8, 0.3, 0.3, GOLDEN)), F(limb(x + 0.8, y - 0.8, x - 0.8, y + 0.8, 0.3, 0.3, GOLDEN)), F(E(x, y, 0.3, 0.3, '#fff6dc'))]),
        ...[[11.4, 39], [19.6, 41], [15.6, 42.6]].map(([x, y]) => star(x + sw * (y - 36) * 0.22, y, 0.9, '#f6e4b0')),
        ...braid(12.8, 26.6, 0.7, 17.4), ...braid(18, 26.6, 0.7, 17.4, '#c8a450'),
        F(T([[7.9 + sw * 1.5, 42.8], [23.4 + sw * 1.5, 42.8], [23.4 + sw * 1.5, 44], [7.9 + sw * 1.5, 44]], GOLDEN)),
        // The collar, standing behind the neck, and the star that holds it.
        T([[11.4, 24.6], [19.8, 24.6], [19.4, 28.4], [11.8, 28.4]], shade(CLOTH.arcane, -18)),
        ...braid(11.5, 24.7, 8.2, 0.5), star(15.6, 28.8, 1.7, GOLDEN), star(15.6, 28.8, 0.8, '#fff6dc')];
    },
    sleeve: () => CLOTH.arcane,
    shoulder: (p, side) => [E(0, 1.2, 3.5, 3, side > 0 ? CLOTH.arcane : shade(CLOTH.arcane, -12)), ...braid(-3.4, 2.4, 6.8, 0.5)],
    legs: bare,
    shoe: shoeIn('#3a2f66', '#241d44'),
  },
  // A valkyrie's cuirass: pale steel edged in gold, with a wing standing at each shoulder.
  valkyrie: {
    top: () => [...cloth(CLOTH.valk, 35.6),
      F(T([[10.1, 27], [13, 26.7], [12.4, 35.6], [9.9, 35.6]], '#eef2fa')),
      F(T([[19, 26.7], [21.4, 27], [21.8, 35.6], [19.2, 35.6]], '#8f98ab')),
      F(limb(15.6, 26.6, 15.6, 35.4, 0.45, 0.45, '#eef2fa')), F(limb(16.3, 26.6, 16.3, 35.4, 0.3, 0.3, '#8f98ab')),
      ...braid(9.9, 26.4, 11.8, 0.6), ...braid(9.9, 34.8, 12.8, 0.8),
      // The wing struck across the breast.
      ...[0, 1, 2, 3].map((i) => F(T([[13.4 + i * 0.9, 29.4 + i * 0.5], [14.6 + i * 0.9, 29 + i * 0.5], [18.6 + i * 0.6, 33.4 - i * 0.9]], i % 2 ? GOLDEN : '#f6e4b0'))),
      ...gem(13, 31.4, 1.1, '#6fb8e8'),
      F(T([[12.6, 25.9], [18.6, 25.9], [18.2, 27.4], [13, 27.4]], '#8f98ab'))],
    sleeve: () => '#9fa8bc',
    shoulder: (p, side) => [E(0, 1, 3.4, 3, side > 0 ? CLOTH.valk : '#8f98ab'),
      // The wing at the shoulder.
      F(T([[-2.6, 0.6], [-5.4, -4.4], [-1.2, -1.6]], side > 0 ? '#f6f8ff' : '#d4dae6')),
      F(T([[-0.6, 0.2], [-3.4, -5.4], [0.8, -2]], side > 0 ? GOLDEN : '#c8a450')),
      ...braid(-3.2, 1.6, 6.4, 0.5)],
  },
};

// ---------- Bottoms ----------
export const WARDROBE_BOTTOMS = {
  // Cotton shorts, turned up at the hem, with a pocket line.
  shorts: {
    legs: bare,
    skirt: () => [T([[9, 34.2], [22.2, 34.2], [22.6, 40.4], [16.6, 40.4], [15.6, 37.6], [14.6, 40.4], [8.6, 40.4]], CLOTH.navy),
      F(T([[9, 34.2], [11.4, 34.2], [10.6, 40.4], [8.7, 40.4]], shade(CLOTH.navy, 16))),
      F(R(9, 34.2, 13.2, 0.9, shade(CLOTH.navy, -18))), F(R(9, 35.1, 13.2, 0.35, shade(CLOTH.navy, 22))),
      F(limb(19.8, 35.6, 21.4, 37.6, 0.3, 0.3, shade(CLOTH.navy, -20))),
      F(R(8.6, 39.2, 6, 1.2, shade(CLOTH.navy, 20))), F(R(16.6, 39.2, 6, 1.2, shade(CLOTH.navy, 14)))],
    shoe: shoeIn('#f4efe6', '#b8ad9a'),
  },
  // A pleated skirt with a waistband.
  skirt: {
    legs: bare,
    skirt: (p, m) => [...flare(CLOTH.plum, m, { len: 7.8, spread: 2.4 }),
      ...folds(m, shade(CLOTH.plum, -20), shade(CLOTH.plum, 14), { top: 35.2, len: 7, spread: 2.4 }),
      F(R(9, 34.2, 13.2, 1.1, shade(CLOTH.plum, -22))), F(R(9, 34.2, 13.2, 0.35, shade(CLOTH.plum, 18)))],
    shoe: shoeIn('#f6f2ea', '#bdb3a2'),
  },
  // Trousers rolled up at the shin, with a belt line.
  trousers: {
    legs: legsIn('#9aa6c0'),
    shoe: shoeIn('#efe7da', '#b5a893'),
    skirt: () => [T([[9.2, 34.2], [22, 34.2], [21.6, 39.8], [9.6, 39.8]], '#9aa6c0'),
      F(T([[9.2, 34.2], [11.4, 34.2], [11, 39.8], [9.6, 39.8]], '#bcc6da')),
      F(R(9.2, 34.2, 12.8, 1, '#6f7c96')), F(R(9.2, 34.2, 12.8, 0.35, '#c8d0e2')), F(E(15.6, 34.7, 0.7, 0.45, '#e8c470')),
      F(limb(15.6, 35.6, 15.6, 39.6, 0.3, 0.3, '#8692b0'))],
  },
  // Frill bloomers, gathered above the knee, in warm cream so they read against the dough.
  bloomers: {
    legs: legsIn(CLOTH.shell),
    skirt: (p, m) => {
      const s = (m?.sway ?? 0) * 0.6;
      return [...flare(CLOTH.shell, m, { len: 6.4, spread: 1.4, lite: '#fffaf2', dark: '#e2c8ae' }),
        ...folds(m, '#e8d2bc', '#fffaf2', { top: 35.2, len: 5.4, spread: 1.4, xs: [12.4, 15.6, 18.8] }),
        // The gathers at each cuff, and the frill below them.
        ...[10.8, 13.6, 17.6, 20.4].map((x) => F(E(x + s, 40.4, 1.6, 1, '#fffaf2'))),
        ...[10.8, 13.6, 17.6, 20.4].map((x) => F(E(x + s, 41.1, 1.4, 0.7, '#f0dcc8'))),
        F(R(9.2 + s, 39.3, 12.8, 0.4, '#e8d0b8'))];
    },
    shoe: shoeIn('#fffaf2', '#ccbca8'),
  },
  // Patch dungarees: a denim bib on straps, with a patched knee and brass buttons.
  dungas: {
    legs: legsFull(CLOTH.denim, shade(CLOTH.denim, -16)),
    shoe: shoeIn('#e8dfcf', '#b0a28d'),
    skirt: () => [T([[9.2, 33.4], [22, 33.4], [21.6, 40.2], [9.6, 40.2]], CLOTH.denim),
      F(T([[9.2, 33.4], [11.4, 33.4], [11, 40.2], [9.6, 40.2]], shade(CLOTH.denim, 18))),
      F(R(9.2, 33.4, 12.8, 1, shade(CLOTH.denim, 12))),
      ...ribs(9.4, 21.8, 33.5, 0.3, '#e8c470', 1.6),
      F(R(12.6, 35.4, 6, 3.6, shade(CLOTH.denim, 8))), F(R(12.6, 35.4, 6, 0.35, shade(CLOTH.denim, -16))),
      F(limb(15.6, 38.4, 15.6, 40.2, 0.3, 0.3, shade(CLOTH.denim, -20)))],
    // The bib and its straps, over the shoulders.
    front: () => [T([[12.2, 29.6], [19, 29.6], [19.2, 34], [12, 34]], CLOTH.denim),
      F(T([[12.2, 29.6], [14, 29.6], [13.8, 34], [12, 34]], shade(CLOTH.denim, 16))),
      F(R(12.2, 29.6, 6.8, 0.35, shade(CLOTH.denim, 24))), F(R(13.4, 31, 4.4, 2, shade(CLOTH.denim, -10))),
      F(limb(12.6, 26.6, 12.4, 30, 0.75, 0.75, CLOTH.denim)), F(limb(18.6, 26.6, 18.8, 30, 0.75, 0.75, shade(CLOTH.denim, -10))),
      ...dots([[12.5, 30], [18.8, 30]], 0.62, '#b8893a'), ...dots([[12.5, 29.8], [18.8, 29.8]], 0.3, '#f0cc78')],
  },
  // Track joggers: a stripe down each side and elastic at the ankle.
  joggers: {
    legs: legsFull(CLOTH.slate, '#e8eef0'),
    shoe: shoeIn('#ffffff', '#b2babe'),
    skirt: () => [T([[9.2, 34], [22, 34], [21.4, 40.4], [9.8, 40.4]], CLOTH.slate),
      F(T([[9.2, 34], [11.4, 34], [11.2, 40.4], [9.8, 40.4]], shade(CLOTH.slate, 18))),
      F(R(9.2, 34, 12.8, 1, shade(CLOTH.slate, -16))), ...ribs(9.4, 21.8, 34.1, 0.8, shade(CLOTH.slate, 10), 1),
      F(R(9.9, 35.4, 0.9, 5, '#eef4f6')), F(R(20.4, 35.4, 0.9, 5, '#d4dde0')),
      F(limb(15.6, 38.6, 15.6, 40.4, 0.3, 0.3, shade(CLOTH.slate, -22)))],
  },
  // Cropped capris with patch pockets and a turn-up at the ankle.
  capris: {
    legs: legsFull(CLOTH.khaki, '#f2e8d2'),
    shoe: shoeIn('#e4d8c2', '#ab9c80'),
    skirt: () => [T([[9.2, 34.2], [22, 34.2], [21.6, 40], [9.6, 40]], CLOTH.khaki),
      F(T([[9.2, 34.2], [11.4, 34.2], [11, 40], [9.6, 40]], shade(CLOTH.khaki, 16))),
      F(R(9.2, 34.2, 12.8, 1, shade(CLOTH.khaki, -16))), F(R(9.2, 34.2, 12.8, 0.35, shade(CLOTH.khaki, 22))),
      F(R(10.4, 36, 3.4, 2.6, shade(CLOTH.khaki, -8))), F(R(17.6, 36, 3.4, 2.6, shade(CLOTH.khaki, -12))),
      F(limb(15.6, 35.4, 15.6, 39.8, 0.3, 0.3, shade(CLOTH.khaki, -20)))],
  },
  // A length of cloth wrapped round the hips and knotted at the near side: the hem runs away on
  // the slant and the knot's ends swing.
  wrap: {
    legs: bare,
    skirt: (p, m) => {
      const s = (m?.sway ?? 0) * 0.6;
      return [T([[9, 34], [22.2, 34], [22.4 + s, 39.8], [8.2 + s, 43.2]], '#d98f74'),
        F(T([[9, 34], [11.4, 34], [10.4 + s, 42.6], [8.3 + s, 43.2]], shade('#d98f74', 16))),
        F(R(9, 34, 13.2, 1, shade('#d98f74', -18))),
        ...folds(m, shade('#d98f74', -16), shade('#d98f74', 14), { top: 35, len: 5.6, spread: 1.6, xs: [12, 15.6, 19.2] }),
        // The knot, and its two short ends.
        F(E(21.2, 35.4, 1.6, 1.3, '#c47a60')), F(E(21, 35, 0.9, 0.5, '#efb098')),
        F(limb(21.4, 36.2, 22.4 + s, 40.6, 0.8, 0.4, '#d98f74')), F(limb(21, 36.4, 20.4 + s, 41.2, 0.7, 0.35, '#c47a60'))];
    },
    shoe: shoeIn('#f2e4d4', '#b9a690'),
  },
  // A traveller's skirt: hard-wearing cloth, a broad belt and a pouch at the hip.
  travelskirt: {
    legs: bare,
    skirt: (p, m) => [...flare(CLOTH.olive, m, { len: 8, spread: 2.2 }),
      ...folds(m, shade(CLOTH.olive, -22), shade(CLOTH.olive, 14), { top: 35.2, len: 7, spread: 2.2 }),
      F(R(9, 33.8, 13.2, 1.8, CLOTH.hide)), F(R(9, 33.8, 13.2, 0.4, shade(CLOTH.hide, 22))), F(R(9, 35.2, 13.2, 0.4, shade(CLOTH.hide, -24))),
      F(R(14.7, 33.6, 2, 2.2, '#a8aab4')), F(R(15.4, 34.2, 0.55, 1.1, CLOTH.hide)),
      // The pouch.
      F(T([[19.4, 35.6], [22.6, 35.6], [22.8, 39], [19.2, 39]], CLOTH.hide)),
      F(T([[19.4, 35.6], [22.6, 35.6], [22.7, 36.8], [19.3, 36.8]], shade(CLOTH.hide, 18))), F(E(21, 37.6, 0.5, 0.5, '#c8a24a'))],
    shoe: (p, k, tint) => [k.sole(tint('#4a3828')), k.poly([[-2.8, -1.3], [2.9, -1.3], [3.1, 1.7], [-2.9, 1.7]], tint(CLOTH.hide))],
  },
  // Cloth leg wraps over short breeches, bound from ankle to knee.
  legwraps: {
    legs: legsFull('#ded2b6', '#b19c78'),
    shoe: (p, k, tint) => [k.sole(tint('#6b5440')), k.poly([[-2.6, -0.8], [2.8, -0.8], [3, 1.2], [-2.8, 1.2]], tint('#8a6a46')),
      k.poly([[-2.6, -0.8], [2.8, -0.8], [2.85, -0.3], [-2.65, -0.3]], tint('#a8805a'))],
    skirt: () => [T([[9.2, 34.2], [22, 34.2], [22.4, 39.2], [16.4, 39.2], [15.6, 37], [14.8, 39.2], [8.8, 39.2]], '#6f6450'),
      F(T([[9.2, 34.2], [11.4, 34.2], [10.6, 39.2], [8.9, 39.2]], '#8a7e66')),
      F(R(9.2, 34.2, 12.8, 1.2, CLOTH.hide)), F(R(9.2, 34.2, 12.8, 0.35, shade(CLOTH.hide, 22))),
      // Where the binding crosses the thigh.
      ...[36.2, 37.6].flatMap((y) => [F(limb(10, y, 14.6, y + 0.9, 0.42, 0.42, '#ded2b6')), F(limb(16.8, y, 21.4, y + 0.9, 0.42, 0.42, '#ded2b6'))])],
  },

  // ---------- Middling ----------
  // A tartan pleated skirt: the pleats, and the check crossing them.
  tartan: {
    legs: bare,
    skirt: (p, m) => {
      const s = (m?.sway ?? 0) * 0.6;
      return [...flare(CLOTH.tartan, m, { len: 8, spread: 2.6 }),
        ...[36.2, 38.6, 41].map((y) => F(R(8.8 - 2.6 * ((y - 34.2) / 8) + s, y, 13.8 + 5.2 * ((y - 34.2) / 8), 0.5, '#f2e4cc'))),
        ...[11, 14.4, 17.8, 21.2].map((x) => F(limb(x, 34.8, x + (x - MID) * 0.4 + s, 41.6, 0.45, 0.55, '#f2e4cc'))),
        ...folds(m, shade(CLOTH.tartan, -24), shade(CLOTH.tartan, 12), { top: 35.2, len: 6.8, spread: 2.6 }),
        F(R(9, 34.2, 13.2, 1.2, '#2f3340')), F(R(9, 34.2, 13.2, 0.35, '#5a6070'))];
    },
    shoe: (p, k, tint) => [k.sole(tint('#3a3340')), k.poly([[-2.7, -1], [2.8, -1], [3, 1.6], [-2.8, 1.6]], tint('#5a4f5c')), k.poly([[-2.7, -1], [2.8, -1], [2.85, -0.4], [-2.75, -0.4]], tint('#6f6270'))],
  },
  // Wide culottes: cut like a skirt but split up the middle, with a turn-up at the hem.
  culottes: {
    legs: bare,
    skirt: (p, m) => {
      const s = (m?.sway ?? 0) * 0.6;
      return [T([[9, 34.2], [22.2, 34.2], [23.8 + s, 41.4], [16.4 + s, 41.4], [15.6 + s * 0.6, 38.2], [14.8 + s, 41.4], [7.4 + s, 41.4]], CLOTH.mustard),
        F(T([[9, 34.2], [11.4, 34.2], [9.6 + s, 41.4], [7.5 + s, 41.4]], shade(CLOTH.mustard, 18))),
        F(R(9, 34.2, 13.2, 1.1, shade(CLOTH.mustard, -18))), F(R(9, 34.2, 13.2, 0.35, shade(CLOTH.mustard, 24))),
        ...folds(m, shade(CLOTH.mustard, -16), shade(CLOTH.mustard, 14), { top: 35.4, len: 5.4, spread: 2.6, xs: [12, 19.2] }),
        F(R(7.5 + s, 40.3, 7.4, 1.1, shade(CLOTH.mustard, 22))), F(R(16.4 + s, 40.3, 7.4, 1.1, shade(CLOTH.mustard, 14)))];
    },
    shoe: shoeIn('#f2e8d8', '#b5a690'),
  },
  // A short skirt over footless leggings.
  overskirt: {
    legs: legsFull('#4f4a5e'),
    skirt: (p, m) => [...flare(CLOTH.ribbon, m, { len: 6, spread: 1.8 }),
      ...folds(m, shade(CLOTH.ribbon, -22), shade(CLOTH.ribbon, 14), { top: 35, len: 5, spread: 1.8 }),
      F(R(9, 34.2, 13.2, 1.1, '#4f4a5e')), F(R(9, 34.2, 13.2, 0.35, '#6d6680'))],
    shoe: shoeIn('#efe4ee', '#a89bab'),
  },
  // A short hakama: stiff pleats from a high waist, with its cords tied at the front.
  hakama: {
    legs: bare,
    skirt: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      return [...flare(CLOTH.hakama, m, { len: 8.4, spread: 1.6, top: 33 }),
        ...[11.2, 14, 17.6, 20.4].map((x) => F(limb(x, 33.8, x + (x - MID) * 0.3 + s, 41.2, 0.5, 0.65, '#3b4766'))),
        ...[12.6, 16, 19.4].map((x) => F(limb(x, 33.8, x + (x - MID) * 0.3 + s, 41.2, 0.34, 0.42, '#8fa0c8'))),
        F(R(8.9, 32.6, 13.6, 1.6, '#2e3650')), F(R(8.9, 32.6, 13.6, 0.4, '#5f6b8c')),
        F(limb(9.6, 33.4, 21.6, 33.4, 0.45, 0.45, '#f2e8d0')), F(E(15.6, 33.4, 1.3, 0.9, '#f2e8d0')),
        F(limb(15.4, 34, 14.4 + s, 37.6, 0.42, 0.3, '#f2e8d0')), F(limb(16, 34, 17.2 + s, 37.6, 0.42, 0.3, '#e0d4b8'))];
    },
    shoe: (p, k, tint) => [k.sole(tint('#6b5c48')), k.poly([[-2.6, -0.8], [2.8, -0.8], [3, 1.2], [-2.8, 1.2]], tint('#e8dcc4'))],
  },
  // Corduroys: ribbed all the way down, with a buckled belt.
  cords: {
    legs: legsFull(CLOTH.cord, shade(CLOTH.cord, -16)),
    shoe: shoeIn('#e0cfb4', '#a8947a'),
    skirt: () => [T([[9.2, 34.4], [22, 34.4], [21.6, 40.2], [9.6, 40.2]], CLOTH.cord),
      F(T([[9.2, 34.4], [11.4, 34.4], [11, 40.2], [9.6, 40.2]], shade(CLOTH.cord, 18))),
      ...ribs(9.6, 21.4, 35.8, 4.2, shade(CLOTH.cord, -14), 1.1),
      F(R(9.2, 34.4, 12.8, 1.2, '#5e452e')), F(R(9.2, 34.4, 12.8, 0.35, '#8a6a48')),
      F(R(14.8, 34.3, 1.9, 1.4, '#e8c470')), F(R(15.3, 34.6, 0.5, 0.8, '#8a6a48'))],
  },
  // Puff shorts: a bubble at each leg, gathered above the knee over a lace edge.
  puffshorts: {
    legs: bare,
    skirt: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      return [T([[9.2, 34.2], [22, 34.2], [23 + s, 38.4], [20 + s, 40.6], [15.6 + s * 0.5, 38], [11.2 + s, 40.6], [8.2 + s, 38.4]], CLOTH.ruffle),
        F(T([[9.2, 34.2], [11.4, 34.2], [10 + s, 39.8], [8.3 + s, 38.4]], shade(CLOTH.ruffle, 16))),
        F(R(9.2, 34.2, 12.8, 1, shade(CLOTH.ruffle, -18))), F(R(9.2, 34.2, 12.8, 0.35, '#ffffff')),
        ...folds(m, shade(CLOTH.ruffle, -16), '#ffffff', { top: 35.2, len: 3.4, spread: 2, xs: [12.2, 19] }),
        ...lace(8.8 + s, 12.8 + s, 40.4, '#ffffff', 1.3), ...lace(18.6 + s, 22.6 + s, 40.4, '#fff0f6', 1.3)];
    },
    shoe: shoeIn('#fff2f6', '#c8b0bc'),
  },
  // A tiered ruffle skirt: three gathered tiers, each a little wider than the last.
  tiers: {
    legs: bare,
    skirt: (p, m) => {
      const s = (m?.sway ?? 0) * 0.6;
      const one = (y0, y1, w0, w1, c) => [T([[MID - w0, y0], [MID + w0, y0], [MID + w1 + s, y1], [MID - w1 + s, y1]], c),
        F(T([[MID - w0, y0], [MID - w0 + 2.2, y0], [MID - w1 + 2.4 + s, y1], [MID - w1 + s, y1]], shade(c, 16))),
        ...lace(MID - w1 + s, MID + w1 + s, y1 - 0.2, shade(c, 22), 1.5)];
      return [...one(34.2, 37.4, 6.6, 8, CLOTH.petalpink),
        ...one(36.8, 40.2, 7.6, 9.6, shade(CLOTH.petalpink, -8)),
        ...one(39.6, 43.4, 9.2, 11.4, shade(CLOTH.petalpink, -16)),
        F(R(9, 34.2, 13.2, 1.1, '#e4a0b8')), F(R(9, 34.2, 13.2, 0.35, '#ffffff'))];
    },
    shoe: shoeIn('#fff4f8', '#cbb2bd'),
  },
  // Padded snow trousers: quilted in bands, with a bright stripe down each side.
  snowpants: {
    legs: legsFull(CLOTH.frost, '#ffffff'),
    shoe: (p, k, tint) => [k.sole(tint('#6f7e8c')), k.poly([[-2.8, -1.2], [2.9, -1.2], [3.1, 1.8], [-2.9, 1.8]], tint('#ffffff')), k.poly([[-2.8, 0.8], [3.05, 0.8], [3.1, 1.8], [-2.9, 1.8]], tint('#9fb6c8'))],
    skirt: () => [T([[9, 34], [22.2, 34], [21.8, 40.6], [9.4, 40.6]], CLOTH.frost),
      F(T([[9, 34], [11.4, 34], [11, 40.6], [9.4, 40.6]], '#eaf4fb')),
      ...[36, 37.6, 39.2].map((y) => F(R(9.4, y, 12.4, 0.45, '#9fb6c8'))),
      F(R(9, 34, 13.2, 1.1, '#7f93a6')), F(R(9, 34, 13.2, 0.35, '#c8dce8')),
      F(R(9.6, 35.3, 0.9, 5, '#5d8fc4')), F(R(20.7, 35.3, 0.9, 5, '#4a79aa')),
      F(limb(15.6, 38.6, 15.6, 40.6, 0.3, 0.3, '#9fb6c8'))],
  },
  // Scout trousers: hard cloth with a buckled guard strapped over each knee.
  scoutpants: {
    legs: legsFull(CLOTH.olive, shade(CLOTH.olive, -18)),
    shoe: (p, k, tint) => [k.sole(tint('#4a3828')), k.poly([[-2.8, -1.3], [2.9, -1.3], [3.1, 1.7], [-2.9, 1.7]], tint(CLOTH.hide)),
      k.poly([[-2.8, -1.3], [2.9, -1.3], [2.95, -0.7], [-2.85, -0.7]], tint(shade(CLOTH.hide, 20)))],
    skirt: () => [T([[9.2, 34.2], [22, 34.2], [21.6, 40.2], [9.6, 40.2]], CLOTH.olive),
      F(T([[9.2, 34.2], [11.4, 34.2], [11, 40.2], [9.6, 40.2]], shade(CLOTH.olive, 18))),
      F(R(9.2, 34.2, 12.8, 1.4, CLOTH.hide)), F(R(9.2, 34.2, 12.8, 0.35, shade(CLOTH.hide, 22))),
      F(R(14.7, 34, 2, 1.9, '#a8aab4')), F(R(15.4, 34.5, 0.55, 0.9, CLOTH.hide)),
      // The knee guards.
      F(T([[9.8, 37.6], [14.4, 37.6], [14, 40.2], [10.2, 40.2]], CLOTH.hide)), F(R(9.8, 37.6, 4.6, 0.4, shade(CLOTH.hide, 22))),
      F(T([[16.8, 37.6], [21.4, 37.6], [21, 40.2], [17.2, 40.2]], shade(CLOTH.hide, -10))), F(R(16.8, 37.6, 4.6, 0.4, shade(CLOTH.hide, 10))),
      ...studs([[10.6, 38.8], [13.4, 38.8], [17.8, 38.8], [20.6, 38.8]], 0.38, '#b4bcca')],
  },
  // A fairy's skirt, cut from petals and leaves lapped over one another.
  petalskirt: {
    legs: bare,
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.7;
      return [...Array.from({ length: 7 }, (_, i) => F(T([[9.2 + i * 2.1, 34.4], [12.2 + i * 2.1, 34.4], [10.4 + sw + i * 2.4, 41.4 - (i % 2) * 1.6]], i % 2 ? CLOTH.leafgold : '#8fc46e'))),
        ...Array.from({ length: 6 }, (_, i) => F(T([[10.4 + i * 2.1, 36.6], [13.4 + i * 2.1, 36.6], [11.6 + sw * 1.3 + i * 2.4, 44 - (i % 2) * 1.4]], i % 2 ? '#f2a8c4' : '#ffc8dc'))),
        ...Array.from({ length: 6 }, (_, i) => F(limb(11.9 + i * 2.1, 36.8, 11.6 + sw * 1.3 + i * 2.4, 43 - (i % 2) * 1.4, 0.24, 0.2, '#fff0f6'))),
        F(R(9, 34, 13.2, 1.2, CLOTH.leafgold)), F(R(9, 34, 13.2, 0.35, '#b4dc9a')),
        ...[[11.4, 38], [19.8, 39.4]].map(([x, y]) => star(x + sw * 0.5, y, 0.6, '#fffaf0'))];
    },
    shoe: shoeIn('#d8f0c8', '#8fae78'),
  },

  // ---------- Fine ----------
  // A layered skirt: a long ivory under-skirt, with a plum over-skirt caught up in scallops.
  layers: {
    legs: bare,
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.6;
      return [T([[9.2, 34.2], [22, 34.2], [24.4 + sw, 43.6], [6.8 + sw, 43.6]], CLOTH.ivory),
        F(T([[9.2, 34.2], [11.4, 34.2], [9 + sw, 43.6], [6.9 + sw, 43.6]], '#fff6e8')),
        ...lace(6.8 + sw, 24.4 + sw, 43.4, '#ffffff', 1.6),
        // The over-skirt, gathered up into three swags.
        T([[9.2, 34.2], [22, 34.2], [23.4 + sw, 39.4], [7.8 + sw, 39.4]], CLOTH.plumdeep),
        F(T([[9.2, 34.2], [11.4, 34.2], [9.8 + sw, 39.4], [7.9 + sw, 39.4]], shade(CLOTH.plumdeep, 18))),
        ...[0, 1, 2].map((i) => F(E(9.8 + sw + i * 5.4, 39.4, 2.8, 1.9, CLOTH.plumdeep))),
        ...[0, 1, 2].map((i) => F(E(9.8 + sw + i * 5.4, 38.6, 2.5, 1.3, shade(CLOTH.plumdeep, 14)))),
        ...folds(m, shade(CLOTH.plumdeep, -22), shade(CLOTH.plumdeep, 12), { top: 35, len: 3.8, spread: 1.6, xs: [12.4, 18.8] }),
        F(R(9.2, 34.2, 12.8, 1.2, '#e8c470')), F(R(9.2, 34.2, 12.8, 0.35, '#f6e4b0'))];
    },
    shoe: shoeIn('#f6ead8', '#ab9c80'),
  },
  // Buckled breeches: close to the leg, with a buckled band above the knee.
  breeches: {
    legs: legsIn(CLOTH.sable),
    shoe: (p, k, tint) => [k.sole(tint('#3a2c20')), k.poly([[-2.8, -1.4], [2.9, -1.4], [3.1, 1.8], [-2.9, 1.8]], tint('#6b4a30'))],
    skirt: () => [T([[9.2, 34.2], [22, 34.2], [21.4, 39.8], [9.8, 39.8]], CLOTH.sable),
      F(T([[9.2, 34.2], [11.4, 34.2], [11.2, 39.8], [9.8, 39.8]], shade(CLOTH.sable, 20))),
      F(R(9.2, 34.2, 12.8, 1.3, '#4a3828')), F(R(9.2, 34.2, 12.8, 0.35, '#7a5f44')),
      F(R(14.6, 34.1, 2, 1.6, '#e8c470')), F(R(15.2, 34.5, 0.55, 0.9, '#4a3828')),
      F(R(9.6, 38.4, 5.4, 1.2, '#4a3828')), F(R(16.2, 38.4, 5.4, 1.2, '#4a3828')),
      ...dots([[11.4, 39], [19.8, 39]], 0.45, '#e8c470'),
      F(limb(15.6, 35.6, 15.6, 39.6, 0.3, 0.3, shade(CLOTH.sable, -24)))],
  },
  // A long hakama: stiff pleats falling to the floor, tied with a flat cord.
  longhakama: {
    legs: bare,
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      return [...flare(CLOTH.night, m, { len: 10.4, spread: 2.2, top: 33 }),
        ...[11, 13.8, 17.4, 20.2].map((x) => F(limb(x, 33.8, x + (x - MID) * 0.34 + sw, 43, 0.5, 0.7, shade(CLOTH.night, -24)))),
        ...[12.4, 15.6, 19].map((x) => F(limb(x, 33.8, x + (x - MID) * 0.34 + sw, 43, 0.34, 0.45, shade(CLOTH.night, 18)))),
        F(R(8.9, 32.6, 13.6, 1.7, shade(CLOTH.night, -18))), F(R(8.9, 32.6, 13.6, 0.4, shade(CLOTH.night, 16))),
        F(limb(9.6, 33.4, 21.6, 33.4, 0.5, 0.5, '#e8c470')), F(E(15.6, 33.4, 1.4, 1, '#e8c470')), F(E(15.4, 33.1, 0.7, 0.4, '#f6e4b0'))];
    },
    shoe: (p, k, tint) => [k.sole(tint('#5c4a38')), k.poly([[-2.6, -0.8], [2.8, -0.8], [3, 1.2], [-2.8, 1.2]], tint('#f2e8d0'))],
  },
  // A bustle skirt: the front drawn up in swags, the whole of it gathered into a bustle behind.
  bustle: {
    legs: bare,
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.6;
      return [T([[9.2, 34.2], [22, 34.2], [23.6 + sw, 43.4], [7.6 + sw, 43.4]], CLOTH.wine),
        F(T([[9.2, 34.2], [11.4, 34.2], [9.8 + sw, 43.4], [7.7 + sw, 43.4]], shade(CLOTH.wine, 18))),
        ...[0, 1, 2, 3].map((i) => F(limb(11 + i * 3.2, 34.8, 10 + sw + i * 4.2, 42.8, 0.4, 0.55, shade(CLOTH.wine, -22)))),
        ...[0, 1, 2].map((i) => F(E(10.4 + sw + i * 5.2, 38.6, 3, 1.6, shade(CLOTH.wine, 12)))),
        ...lace(7.6 + sw, 23.6 + sw, 43.2, '#f2d8dc', 1.8),
        F(R(9.2, 34.2, 12.8, 1.2, shade(CLOTH.wine, -26))), F(R(9.2, 34.2, 12.8, 0.35, shade(CLOTH.wine, 20)))];
    },
    // The bustle itself, bunched at the back and swinging with her.
    back: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      return [E(7.6 + sw, 37.4, 5, 4.4, CLOTH.wine),
        F(E(6.6 + sw, 35.8, 2.2, 1.4, shade(CLOTH.wine, 18))),
        F(E(7 + sw, 39.4, 3.2, 1.8, shade(CLOTH.wine, -18))),
        F(limb(9.4 + sw, 34.4, 5.2 + sw, 42.4, 0.5, 0.4, shade(CLOTH.wine, -26)))];
    },
    shoe: shoeIn('#f2e2e4', '#a88c90'),
  },
  // A lace petticoat: two gathered layers, both edged with lace.
  petticoat: {
    legs: bare,
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.6;
      return [T([[9.2, 34.2], [22, 34.2], [24 + sw, 42.6], [7.2 + sw, 42.6]], '#fdf6ec'),
        F(T([[9.2, 34.2], [11.4, 34.2], [9.4 + sw, 42.6], [7.3 + sw, 42.6]], '#ffffff')),
        ...lace(7.2 + sw, 24 + sw, 42.4, '#ffffff', 1.5), ...lace(7.6 + sw, 23.6 + sw, 41.2, '#e8dcd0', 1.5),
        T([[9.6, 34.2], [21.6, 34.2], [22.8 + sw, 39], [8.4 + sw, 39]], '#fffaf2'),
        ...lace(8.4 + sw, 22.8 + sw, 38.8, '#ffffff', 1.4),
        ...folds(m, '#e4d8cc', '#ffffff', { top: 35, len: 3.6, spread: 1.6, xs: [12, 15.6, 19.2] }),
        F(R(9.2, 34.2, 12.8, 1.1, CLOTH.ribbon)), F(R(9.2, 34.2, 12.8, 0.35, '#f2a8bc'))];
    },
    shoe: shoeIn('#fffaf2', '#c4b6a8'),
  },
  // Leather tassets: shaped plates hanging over a short kilt, riveted along their tops.
  tassets: {
    legs: legsIn('#5a4a3a'),
    shoe: (p, k, tint) => [k.sole(tint('#33261a')), k.poly([[-2.9, -1.4], [3, -1.4], [3.2, 1.9], [-3, 1.9]], tint('#6b4a30')), k.poly([[-2.9, 0.9], [3.15, 0.9], [3.2, 1.9], [-3, 1.9]], tint('#8a6342'))],
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      return [T([[9.4, 34], [21.8, 34], [22.6 + sw, 39.4], [8.6 + sw, 39.4]], '#4a3c2e'),
        F(R(9.4, 34, 12.4, 1.3, CLOTH.leather)), ...studs([[10.6, 34.6], [14, 34.6], [17.4, 34.6], [20.8, 34.6]], 0.42, '#d8d2c4'),
        // Three plates, each a little lower than the last.
        ...[[9.2, 0], [13.6, 0.4], [18, 0], [21.4, -0.4]].map(([x, d]) => F(T([[x + sw * 0.3, 35.2], [x + 3.4 + sw * 0.3, 35.2], [x + 3 + sw, 41 + d], [x + 0.4 + sw, 41 + d]], CLOTH.leather))),
        ...[[9.2, 0], [13.6, 0.4], [18, 0], [21.4, -0.4]].map(([x, d]) => F(T([[x + sw * 0.3, 35.2], [x + 1 + sw * 0.3, 35.2], [x + 1 + sw, 41 + d], [x + 0.4 + sw, 41 + d]], shade(CLOTH.leather, 20))))];
    },
  },
  // Pinstripe trousers, finely striped, with a turn-up at the ankle.
  pinstripe: {
    legs: legsFull('#3f4454', '#5d6374'),
    shoe: (p, k, tint) => [k.sole(tint('#2a2630')), k.poly([[-2.7, -1], [2.8, -1], [3, 1.6], [-2.8, 1.6]], tint('#4a4454'))],
    skirt: () => [T([[9.2, 34.2], [22, 34.2], [21.6, 40.2], [9.6, 40.2]], '#3f4454'),
      F(T([[9.2, 34.2], [11.4, 34.2], [11, 40.2], [9.6, 40.2]], '#565c6e')),
      ...ribs(9.8, 21.4, 35.4, 4.8, '#707892', 1.5),
      F(R(9.2, 34.2, 12.8, 1.2, '#2e3240')), F(R(9.2, 34.2, 12.8, 0.35, '#5d6374')),
      F(R(14.8, 34.1, 1.9, 1.4, '#c8c2b0')), F(limb(15.6, 35.6, 15.6, 40, 0.3, 0.3, '#2e3240'))],
  },
  // A velvet skirt: deep pile that drinks the light, with a satin band at the waist.
  velvet: {
    legs: bare,
    skirt: (p, m) => [...flare(CLOTH.velvet, m, { len: 9.2, spread: 2.6 }),
      ...folds(m, shade(CLOTH.velvet, -26), shade(CLOTH.velvet, 18), { top: 35, len: 8.4, spread: 2.6, xs: [11.2, 13.8, 17.4, 20] }),
      F(R(9, 33.8, 13.2, 1.7, '#d8a8c4')), F(R(9, 33.8, 13.2, 0.45, '#f2d0e2')), F(R(9, 35.1, 13.2, 0.4, '#a8789a'))],
    shoe: shoeIn('#e8d0e0', '#9a7d90'),
  },
  // Knight's greaves over a skirt of mail.
  greaves: {
    legs: legsFull(CLOTH.steel, '#8f98ab'),
    shoe: (p, k, tint) => [k.sole(tint('#6a7080')), k.poly([[-2.9, -1.4], [3, -1.4], [3.2, 1.9], [-3, 1.9]], tint(CLOTH.steel)),
      k.poly([[-2.9, -1.4], [3, -1.4], [3.05, -0.7], [-2.95, -0.7]], tint('#eef2fa')), k.poly([[-2.9, 1], [3.15, 1], [3.2, 1.9], [-3, 1.9]], tint('#8f98ab'))],
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.4;
      return [T([[9.4, 34], [21.8, 34], [22.6 + sw, 40.4], [8.6 + sw, 40.4]], '#7f8695'),
        // Mail: rows of little rings.
        ...[35.4, 36.8, 38.2, 39.6].flatMap((y, r) => Array.from({ length: 7 }, (_, i) => F(E(9.8 + sw * 0.5 + i * 2 + (r % 2) * 1, y, 0.85, 0.75, r % 2 ? '#9aa2b2' : '#8a92a2')))),
        ...braid(9.4, 33.8, 12.6, 1.2),
        // Plates over the thighs.
        F(T([[10, 36.6], [14.4, 36.6], [14 + sw, 41.6], [10.4 + sw, 41.6]], CLOTH.steel)), F(R(10, 36.6, 4.4, 0.45, '#eef2fa')),
        F(T([[16.8, 36.6], [21.2, 36.6], [20.8 + sw, 41.6], [17.2 + sw, 41.6]], '#9fa8bc')), F(R(16.8, 36.6, 4.4, 0.45, '#d4dae6'))];
    },
  },
  // A shadow-weave skirt: layers of dark gauze with a ragged hem, violet where the light catches.
  shadowskirt: {
    legs: legsIn('#241f30'),
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.8;
      return [T([[9.2, 34.2], [22, 34.2], [23.6 + sw, 42], [7.6 + sw, 42]], CLOTH.shadow),
        F(T([[9.2, 34.2], [11.4, 34.2], [9.8 + sw, 42], [7.7 + sw, 42]], '#443c58')),
        ...Array.from({ length: 8 }, (_, i) => F(T([[7.4 + sw + i * 2.2, 41], [9.8 + sw + i * 2.2, 41], [8.6 + sw * 1.3 + i * 2.2, 45.4 - (i % 2) * 1.6]], i % 2 ? CLOTH.shadow : '#443c58'))),
        ...folds(m, '#1b1726', '#5e5478', { top: 35, len: 6.4, spread: 2.6, xs: [11.6, 15.6, 19.6] }),
        ...[[11.6, 37.4], [19.8, 39], [15.6, 40.6]].map(([x, y]) => star(x + sw * 0.6, y, 0.7, '#b49cdc')),
        F(R(9.2, 34, 12.8, 1.3, '#5e3f96')), F(R(9.2, 34, 12.8, 0.35, '#8f6fd0'))];
    },
    shoe: (p, k, tint) => [k.sole(tint('#15121e')), k.poly([[-2.8, -1.4], [2.9, -1.4], [3.1, 1.8], [-2.9, 1.8]], tint('#30293e'))],
  },

  // ---------- Elite ----------
  // A gilded skirt: beaten gold panels hung over white silk, each one chased at its foot.
  goldskirt: {
    legs: bare,
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      return [T([[9.4, 34.2], [21.8, 34.2], [23.4 + sw, 42.4], [7.8 + sw, 42.4]], '#fdfaf0'),
        ...[0, 1, 2, 3, 4].map((i) => F(T([[9.6 + i * 2.5, 34.6], [11.9 + i * 2.5, 34.6], [11.2 + sw + i * 3.1, 41.6], [8.6 + sw + i * 3.1, 41.6]], i % 2 ? GOLDEN : '#d8ae54'))),
        ...[0, 1, 2, 3, 4].map((i) => F(T([[9.6 + i * 2.5, 34.6], [10.4 + i * 2.5, 34.6], [9.6 + sw + i * 3.1, 41.6], [8.6 + sw + i * 3.1, 41.6]], '#f6e4b0'))),
        ...[0, 1, 2, 3, 4].map((i) => F(R(8.6 + sw + i * 3.1, 40.8, 2.6, 0.8, '#b08a3a'))),
        ...braid(9.4, 34, 12.6, 1.1), F(R(9.4, 35, 12.6, 0.4, '#b08a3a'))];
    },
    shoe: shoeIn('#f6e4b0', '#b08a3a'),
  },
  // A star train: a short skirt in front and a long train of night behind, strewn with stars.
  train: {
    legs: bare,
    skirt: (p, m) => [...flare(CLOTH.midnight, m, { len: 6.4, spread: 2 }),
      ...folds(m, shade(CLOTH.midnight, -22), shade(CLOTH.midnight, 18), { top: 35, len: 5.6, spread: 2 }),
      ...braid(9, 34, 13.2, 1)],
    back: (p, m) => {
      const sw = (m?.sway ?? 0) * 1;
      return [T([[10.6, 34], [20.6, 34], [16.4 + sw, 45], [4.4 + sw, 44.2], [6.4 + sw, 38]], CLOTH.midnight),
        F(T([[10.6, 34], [13, 34], [7.6 + sw, 44.4], [4.5 + sw, 44.2]], shade(CLOTH.midnight, 20))),
        ...[[9.4, 38, 1], [13.4, 41, 0.8], [7.6, 42.4, 0.7], [12, 44, 0.6], [16.4, 38.6, 0.7]].map(([x, y, r]) => star(x + sw * 0.8, y, r, '#e4ecff')),
        ...braid(4.5 + sw, 43.4, 11.6, 0.5, '#9fabd0')];
    },
    shoe: shoeIn('#3a3f6b', '#262a4a'),
  },
  // Dragon tassets: scaled plates hanging from a gold belt.
  dragontassets: {
    legs: legsIn(shade(CLOTH.jade, -22)),
    shoe: (p, k, tint) => [k.sole(tint('#1d4a3e')), k.poly([[-2.9, -1.4], [3, -1.4], [3.2, 1.9], [-3, 1.9]], tint(CLOTH.jade)), k.poly([[-2.9, -1.4], [3, -1.4], [3.05, -0.6], [-2.95, -0.6]], tint('#e8c470'))],
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      return [T([[9.4, 34], [21.8, 34], [22.4 + sw, 39.4], [8.8 + sw, 39.4]], shade(CLOTH.jade, -14)),
        ...[[9.4, 0], [13.8, 0.5], [18.2, 0]].map(([x, d]) => F(T([[x + sw * 0.3, 35], [x + 3.6 + sw * 0.3, 35], [x + 3.2 + sw, 41.4 + d], [x + 0.4 + sw, 41.4 + d]], CLOTH.jade))),
        ...[35.6, 37.6, 39.6].flatMap((y, r) => Array.from({ length: 5 }, (_, i) => F(E(10.4 + sw * 0.6 + i * 2.6 + (r % 2) * 1.3, y, 1.2, 1, r % 2 ? shade(CLOTH.jade, 16) : shade(CLOTH.jade, 6))))),
        ...braid(9.4, 33.8, 12.6, 1.2), ...gem(15.6, 34.4, 1.1, '#e0485e')];
    },
  },
  // Aurora layers: three falls of gauze, each one a different light.
  aurora: {
    legs: bare,
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.8;
      const one = (y0, y1, w0, w1, c, k) => [T([[MID - w0, y0], [MID + w0, y0], [MID + w1 + sw * k, y1], [MID - w1 + sw * k, y1]], c),
        F(T([[MID - w0, y0], [MID - w0 + 2.4, y0], [MID - w1 + 2.6 + sw * k, y1], [MID - w1 + sw * k, y1]], shade(c, 20))),
        F(R(MID - w1 + sw * k, y1 - 0.6, w1 * 2, 0.6, shade(c, 26)))];
      return [...one(34.2, 44.4, 6.8, 10.4, CLOTH.aurora2, 1.2),
        ...one(34.2, 41, 6.6, 8.8, CLOTH.aurora1, 1),
        ...one(34.2, 37.8, 6.4, 7.6, '#c8a8f0', 0.8),
        ...braid(9, 34, 13.2, 1.1, '#cfe8f6'),
        ...[[10.4, 39, 0.7], [20.4, 41, 0.6], [15.6, 42.2, 0.6]].map(([x, y, r]) => star(x + sw * 0.9, y, r, '#ffffff'))];
    },
    shoe: shoeIn('#d8f0ea', '#8fb0b8'),
  },
  // A jewelled hakama: deep pleats with a stone set at the head of each one.
  jewelhakama: {
    legs: bare,
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      return [...flare(CLOTH.obsidian, m, { len: 9.4, spread: 2, top: 33 }),
        ...[11, 13.8, 17.4, 20.2].map((x) => F(limb(x, 33.8, x + (x - MID) * 0.32 + sw, 42, 0.5, 0.68, '#15121e'))),
        ...[12.4, 15.6, 19].map((x) => F(limb(x, 33.8, x + (x - MID) * 0.32 + sw, 42, 0.32, 0.42, '#4a4458'))),
        ...braid(8.9, 32.6, 13.6, 1.7),
        ...[[11.4, '#e0485e'], [15.6, '#9fd8f0'], [19.8, '#8fe0a8']].flatMap(([x, c]) => gem(x, 36.4, 1, c)),
        F(R(8.9, 34, 13.6, 0.4, '#b08a3a'))];
    },
    shoe: (p, k, tint) => [k.sole(tint('#15121e')), k.poly([[-2.6, -0.8], [2.8, -0.8], [3, 1.2], [-2.8, 1.2]], tint('#3a3448')), k.poly([[-2.6, -0.8], [2.8, -0.8], [2.85, -0.3], [-2.65, -0.3]], tint('#e8c470'))],
  },
  // A plume skirt: long feathers hung from a gold band, lapped over one another.
  plume: {
    legs: bare,
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.7;
      return [...Array.from({ length: 7 }, (_, i) => F(E(9.6 + sw * 0.6 + i * 2.1, 38, 1.8, 4.4, i % 2 ? '#f2e6f4' : '#dcc8e8'))),
        ...Array.from({ length: 6 }, (_, i) => F(E(10.6 + sw + i * 2.1, 41.4, 1.7, 4.2, i % 2 ? '#dcc8e8' : '#c8b0dc'))),
        ...Array.from({ length: 7 }, (_, i) => F(limb(9.6 + sw * 0.6 + i * 2.1, 34.6, 9.6 + sw * 0.6 + i * 2.1, 41.4, 0.22, 0.22, '#b49cc8'))),
        ...braid(9, 33.8, 13.2, 1.4), F(R(9, 35, 13.2, 0.4, '#b08a3a'))];
    },
    shoe: shoeIn('#f2e6f4', '#a890b4'),
  },
  // Comet trousers: night cloth with a long gold streak down the near leg and sparks behind it.
  comet: {
    legs: legsFull(CLOTH.obsidian, GOLDEN),
    shoe: (p, k, tint) => [k.sole(tint('#15121e')), k.poly([[-2.7, -1], [2.8, -1], [3, 1.6], [-2.8, 1.6]], tint('#3a3448')), k.poly([[-2.7, -1], [2.8, -1], [2.85, -0.4], [-2.75, -0.4]], tint('#e8c470'))],
    skirt: () => [T([[9.2, 34.2], [22, 34.2], [21.6, 40.4], [9.6, 40.4]], CLOTH.obsidian),
      F(T([[9.2, 34.2], [11.4, 34.2], [11, 40.4], [9.6, 40.4]], '#3a3448')),
      F(limb(19.8, 34.6, 17.2, 40.2, 1.5, 0.5, GOLDEN)), F(limb(19.8, 34.6, 17.6, 39.4, 0.7, 0.25, '#fff2c8')),
      ...[[13.2, 36.4, 0.7], [11.6, 38.6, 0.55], [14.6, 39.6, 0.5]].map(([x, y, r]) => star(x, y, r, '#f6e4b0')),
      ...braid(9.2, 34.2, 12.8, 1.1), F(limb(15.6, 35.6, 15.6, 40.2, 0.3, 0.3, '#15121e'))],
  },
  // A glacier skirt: shards of pale ice, each one edged where the light catches it.
  glacier: {
    legs: bare,
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.6;
      return [T([[9.2, 34.2], [22, 34.2], [23.4 + sw, 41], [7.8 + sw, 41]], CLOTH.glacier),
        F(T([[9.2, 34.2], [11.4, 34.2], [9.8 + sw, 41], [7.9 + sw, 41]], '#e8f6ff')),
        ...Array.from({ length: 6 }, (_, i) => F(T([[8.6 + sw + i * 2.6, 40.2], [11.2 + sw + i * 2.6, 40.2], [9.9 + sw + i * 2.6, 43.8 - (i % 2) * 1.2]], i % 2 ? CLOTH.glacier : '#a8cde4'))),
        ...Array.from({ length: 6 }, (_, i) => F(T([[9.2 + sw + i * 2.6, 40.2], [10.2 + sw + i * 2.6, 40.2], [9.9 + sw + i * 2.6, 42.8 - (i % 2) * 1]], '#f2fbff'))),
        ...[[12, 36.6], [18.4, 37.6], [15.6, 39]].map(([x, y]) => star(x + sw * 0.4, y, 0.65, '#ffffff')),
        ...braid(9.2, 34, 12.8, 1.1, '#cfe8f6'), F(R(9.2, 35, 12.8, 0.4, '#8fb4cc'))];
    },
    shoe: shoeIn('#e8f6ff', '#90aec4'),
  },
  // Rune greaves: dark plate with a rune burning on each thigh.
  runegreaves: {
    legs: legsFull('#3a3448', '#5e3f96'),
    shoe: (p, k, tint) => [k.sole(tint('#15121e')), k.poly([[-2.9, -1.4], [3, -1.4], [3.2, 1.9], [-3, 1.9]], tint('#3a3448')),
      k.poly([[-2.9, -1.4], [3, -1.4], [3.05, -0.7], [-2.95, -0.7]], tint(GOLDEN))],
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.4;
      return [T([[9.4, 34], [21.8, 34], [22.4 + sw, 39.8], [8.8 + sw, 39.8]], '#2a2436'),
        ...braid(9.4, 33.8, 12.6, 1.3),
        F(T([[9.8, 35.8], [14.4, 35.8], [14 + sw, 42], [10.2 + sw, 42]], '#3a3448')), ...braid(9.8, 35.8, 4.6, 0.45),
        F(T([[16.8, 35.8], [21.4, 35.8], [21 + sw, 42], [17.2 + sw, 42]], '#2f2a3e')), ...braid(16.8, 35.8, 4.6, 0.45, '#c8a450'),
        // The runes.
        ...[[12.1, 38.6], [19.1, 38.6]].flatMap(([x, y]) => [
          F(limb(x - 1.5, y - 1.5, x + 1.5, y + 1.5, 0.55, 0.55, '#c8b0f0')), F(limb(x + 1.5, y - 1.5, x - 1.5, y + 1.5, 0.55, 0.55, '#c8b0f0')),
          F(limb(x, y - 1.8, x, y + 1.8, 0.5, 0.5, '#e4d8ff')),
          F(E(x, y, 1, 1, '#f2ecff')), F(E(x, y, 0.45, 0.45, '#ffffff'))])];
    },
  },
  // A faewing skirt: four wing-petals of thin light, veined and lapped over one another.
  faeskirt: {
    legs: bare,
    skirt: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.9;
      const petal = (x0, dir, c, len) => [F(T([[x0, 34.6], [x0 + dir * 2.6, 34.6], [x0 + dir * (6.4 + sw * 0.4), 38.4], [x0 + dir * (3.4 + sw * 0.8), 34.6 + len]], c)),
        F(limb(x0 + dir * 1.2, 35, x0 + dir * (4 + sw * 0.6), 34.6 + len - 1.4, 0.26, 0.2, '#ffffff'))];
      return [...petal(14.4, -1, CLOTH.fae, 9.4), ...petal(16.8, 1, '#c8e8ff', 9.4),
        ...petal(11.6, -1, '#d8f4ea', 7), ...petal(19.6, 1, '#bcd8f8', 7),
        ...braid(9, 34, 13.2, 1.2), F(R(9, 35.1, 13.2, 0.4, '#8fc8bc')),
        ...[[10.4, 39.4], [20.8, 40.4], [15.6, 42]].map(([x, y]) => star(x + sw * 0.7, y, 0.8, '#ffffff'))];
    },
    shoe: shoeIn('#e4fbf4', '#8fb8ac'),
  },
};

// ---------- Dresses ----------
export const WARDROBE_DRESSES = {
  // A sundress: thin straps, a white sash at the waist, a soft print on the skirt.
  sundress: {
    top: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      const pts = DRESSP.map(([x, y]) => (y > 36 ? [x + s * (y - 36) * 0.22, y] : [x, y]));
      return [T(pts, CLOTH.butter),
        F(T([[10.4, 26.8], [13.2, 26.6], [10 + s * 1.8, 44], [7.4 + s * 1.8, 44]], shade(CLOTH.butter, 16))),
        ...crease(20.4, 29.2, 19, 33, 0.7, shade(CLOTH.butter, -20), shade(CLOTH.butter, 12)),
        ...folds(m, shade(CLOTH.butter, -16), shade(CLOTH.butter, 14), { top: 36, len: 7.6, spread: 3.4, xs: [11.4, 14.6, 17.8, 21] }),
        // The sash.
        F(R(9, 33.4, 13.6, 1.5, '#fff6e4')), F(R(9, 33.4, 13.6, 0.4, '#ffffff')), F(R(9, 34.5, 13.6, 0.4, '#e4c89c')),
        ...dots([[12.4 + s * 0.3, 38.4], [18 + s * 0.5, 40.6], [15 + s * 0.4, 42], [20.6 + s * 0.6, 43]], 0.55, '#fff4d8'),
        // Its hem, turned.
        F(T([[5.6 + s * 1.8, 43.4], [25.6 + s * 1.8, 43.4], [25.6 + s * 1.8, 44], [5.6 + s * 1.8, 44]], shade(CLOTH.butter, -18)))];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.6, 2.3, side > 0 ? p.skin : shade(p.skin, -8)), F(limb(-1.4, -0.6, 1.4, -0.6, 0.5, 0.5, side > 0 ? CLOTH.butter : shade(CLOTH.butter, -12)))],
    legs: bare,
    shoe: shoeIn('#fff6e8', '#cbb594'),
  },
  // A pinafore over a cream shirt: bib straps and a wide front pocket.
  pinafore: {
    top: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      return [...cloth(CLOTH.cream),
        T([[11, 28.2], [20.2, 28.2], [21.8 + s * 1.6, 44], [9.4 + s * 1.6, 44]], CLOTH.sage),
        F(T([[11, 28.2], [13.4, 28.2], [11.6 + s * 1.6, 44], [9.4 + s * 1.6, 44]], shade(CLOTH.sage, 16))),
        ...folds(m, shade(CLOTH.sage, -18), shade(CLOTH.sage, 12), { top: 36, len: 7.6, spread: 2.4, xs: [12.6, 15.6, 18.6] }),
        F(R(10.4, 33.2, 10.6, 1.3, shade(CLOTH.sage, -22))), F(R(10.4, 33.2, 10.6, 0.35, shade(CLOTH.sage, 14))),
        F(R(12.6, 36.4, 6.2, 3, shade(CLOTH.sage, -10))), F(R(12.6, 36.4, 6.2, 0.35, shade(CLOTH.sage, 16))),
        F(limb(12.6, 26.5, 12.2, 28.4, 0.6, 0.6, CLOTH.sage)), F(limb(18.6, 26.5, 19, 28.4, 0.6, 0.6, shade(CLOTH.sage, -12))),
        F(T([[9.4 + s * 1.6, 43.4], [21.8 + s * 1.6, 43.4], [21.8 + s * 1.6, 44], [9.4 + s * 1.6, 44]], shade(CLOTH.sage, -20)))];
    },
    sleeve: () => CLOTH.cream,
    shoulder: (p, side) => [E(0, 1, 2.9, 2.6, side > 0 ? CLOTH.cream : shade(CLOTH.cream, -12)), ...cuffRound(shade(CLOTH.cream, -14))],
    legs: bare,
    shoe: shoeIn('#efe7da', '#b5a893'),
  },
  // A long night shift, loose, with a frill at the neck and a lace line at the hem.
  nightie: {
    long: true,
    top: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      const pts = DRESSP.map(([x, y]) => (y > 36 ? [x + s * (y - 36) * 0.22, y] : [x, y]));
      return [T(pts, CLOTH.lilac),
        F(T([[10.4, 26.8], [13.2, 26.6], [10 + s * 1.8, 44], [7.4 + s * 1.8, 44]], shade(CLOTH.lilac, 16))),
        ...crease(20.4, 29.4, 19.2, 33.4, 0.7, shade(CLOTH.lilac, -18), shade(CLOTH.lilac, 12)),
        ...folds(m, shade(CLOTH.lilac, -14), shade(CLOTH.lilac, 14), { top: 36, len: 7.6, spread: 3.4, xs: [11.4, 14.6, 17.8, 21] }),
        // The frill at the neck.
        ...[12.2, 14, 15.8, 17.6, 19.4].map((x) => F(E(x, 27.4, 1.1, 0.8, '#ffffff'))),
        F(R(9.6, 28, 12.4, 0.5, shade(CLOTH.lilac, -16))),
        // The lace line above the hem.
        ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => F(E(6.6 + s * 1.8 + i * 2.1, 42.4, 1, 0.6, '#ffffff'))),
        F(T([[5.6 + s * 1.8, 43.4], [25.6 + s * 1.8, 43.4], [25.6 + s * 1.8, 44], [5.6 + s * 1.8, 44]], shade(CLOTH.lilac, -18)))];
    },
    sleeve: () => CLOTH.lilac,
    shoulder: (p, side) => [E(0, 1, 3, 2.7, side > 0 ? CLOTH.lilac : shade(CLOTH.lilac, -12))],
    legs: bare,
    shoe: (p, k, tint) => [k.sole(tint('#c8bcdc')), k.poly([[-2.4, -0.6], [2.6, -0.6], [2.8, 1.4], [-2.6, 1.4]], tint('#f4f0fd'))],
  },
  // A jumper dress with a square neck, over a striped shirt.
  jumper: {
    top: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [22.4, 35.4], [8.8, 35.4], ...TORSO.slice(8)];
      return [...cloth('#fdf6ee'),
        ...[27.4, 29.4].map((y) => band(pts, y, y + 0.9, '#9fb4cf')).filter(Boolean).map(F),
        T([[11.2, 29.4], [20, 29.4], [21.6 + s * 1.6, 44], [9.6 + s * 1.6, 44]], CLOTH.berry),
        F(T([[11.2, 29.4], [13.6, 29.4], [11.8 + s * 1.6, 44], [9.6 + s * 1.6, 44]], shade(CLOTH.berry, 18))),
        F(R(11.2, 29.4, 8.8, 0.4, shade(CLOTH.berry, 26))),
        ...folds(m, shade(CLOTH.berry, -20), shade(CLOTH.berry, 12), { top: 36, len: 7.6, spread: 2.4, xs: [12.6, 15.6, 18.6] }),
        F(R(10.6, 34.4, 10.4, 1.2, shade(CLOTH.berry, -24))), F(R(10.6, 34.4, 10.4, 0.35, shade(CLOTH.berry, 14))),
        F(limb(12.4, 26.6, 12.2, 29.6, 0.7, 0.7, CLOTH.berry)), F(limb(18.8, 26.6, 19, 29.6, 0.7, 0.7, shade(CLOTH.berry, -12))),
        F(E(15.6, 31.6, 0.65, 0.65, '#e8c470')), F(E(15.6, 31.4, 0.32, 0.32, '#fff0c0')),
        F(T([[9.6 + s * 1.6, 43.4], [21.6 + s * 1.6, 43.4], [21.6 + s * 1.6, 44], [9.6 + s * 1.6, 44]], shade(CLOTH.berry, -22)))];
    },
    sleeve: () => '#fdf6ee',
    shoulder: (p, side) => [E(0, 1, 2.9, 2.6, side > 0 ? '#fdf6ee' : '#e4dcd2'), ...cuffRound('#e4dcd2')],
    legs: bare,
    shoe: shoeIn('#f0e6e6', '#b9a6a6'),
  },
  // A long smock dress: a gathered yoke, one big patch pocket, loose all the way down.
  smockdress: {
    long: true,
    top: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      const pts = DRESSP.map(([x, y]) => (y > 36 ? [x + s * (y - 36) * 0.22, y] : [x, y]));
      return [T(pts, CLOTH.linen),
        F(T([[10.4, 26.8], [13.2, 26.6], [10 + s * 1.8, 44], [7.4 + s * 1.8, 44]], shade(CLOTH.linen, 16))),
        // The yoke, and the gathers hanging off it.
        F(R(9.6, 26.4, 12.4, 3.4, shade(CLOTH.linen, 10))), F(R(9.6, 29.4, 12.4, 0.5, shade(CLOTH.linen, -20))),
        ...ribs(10, 21.4, 29.9, 1.6, shade(CLOTH.linen, -12), 1.5),
        ...folds(m, shade(CLOTH.linen, -16), shade(CLOTH.linen, 14), { top: 36, len: 7.6, spread: 3.4, xs: [11.4, 14.6, 17.8, 21] }),
        F(R(13, 36.4, 5.6, 3.2, shade(CLOTH.linen, -8))), F(R(13, 36.4, 5.6, 0.35, shade(CLOTH.linen, 18))),
        F(T([[5.6 + s * 1.8, 43.4], [25.6 + s * 1.8, 43.4], [25.6 + s * 1.8, 44], [5.6 + s * 1.8, 44]], shade(CLOTH.linen, -18)))];
    },
    sleeve: () => CLOTH.linen,
    shoulder: (p, side) => [E(0, 1, 3, 2.7, side > 0 ? CLOTH.linen : shade(CLOTH.linen, -12))],
    legs: bare,
    shoe: shoeIn('#eee6d8', '#b2a894'),
  },
  // A plain cotton yukata: a crossed collar, a narrow sash, straight all the way down.
  cottonyukata: {
    long: true,
    top: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [22.6 + s * 1.4, 44], [8.6 + s * 1.4, 44], ...TORSO.slice(8)];
      return [T(pts, CLOTH.indigo),
        F(T([[10.2, 27], [12.8, 26.7], [10.4 + s * 1.4, 44], [8.7 + s * 1.4, 44]], shade(CLOTH.indigo, 18))),
        ...folds(m, shade(CLOTH.indigo, -16), shade(CLOTH.indigo, 16), { top: 36, len: 7.4, spread: 1, xs: [12.2, 15.6, 19] }),
        ...cross('#f2ead8', '#ffffff'),
        ...obi('#e8e0cc', '#c8bca0', m, 32.8, 2.4),
        // The wrap of the skirt, laid on the slant across the front.
        F(limb(16.6 + s * 0.4, 35.6, 14.6 + s * 1.3, 43.6, 0.3, 0.3, shade(CLOTH.indigo, -22))),
        F(T([[8.6 + s * 1.4, 43.3], [22.6 + s * 1.4, 43.3], [22.6 + s * 1.4, 44], [8.6 + s * 1.4, 44]], shade(CLOTH.indigo, -20)))];
    },
    sleeve: () => CLOTH.indigo,
    shoulder: (p, side) => [E(0, 1, 3.2, 2.8, side > 0 ? CLOTH.indigo : shade(CLOTH.indigo, -12))],
    legs: bare,
    shoe: (p, k, tint) => [k.sole(tint('#6b5c48')), k.poly([[-2.6, -0.8], [2.8, -0.8], [3, 1.2], [-2.8, 1.2]], tint('#e8dcc4'))],
  },
  // An acolyte's robe: undyed wool to the floor, tied with a rope cord.
  acolyte: {
    long: true,
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [23.2 + sw * 1.5, 44], [8 + sw * 1.5, 44], ...TORSO.slice(8)];
      return [T(pts, '#8e95a8'),
        F(T([[10.2, 27], [12.8, 26.7], [9.9 + sw * 1.5, 44], [8.1 + sw * 1.5, 44]], '#a8aec0')),
        ...folds(m, '#6d7488', '#b8bece', { top: 36, len: 7.4, spread: 1.8, xs: [12, 15.6, 19.2] }),
        // The hood, lying back on the shoulders, and the cord at the waist.
        F(T([[11.4, 25.6], [19.8, 25.6], [18.4, 30.4], [12.8, 30.4]], '#7b8296')),
        F(limb(9.9, 33.6, 21.4, 33.6, 0.7, 0.7, '#d8c9a4')), F(E(15.6, 33.6, 1.2, 0.9, '#c2b183')),
        F(limb(15.2, 34.2, 13.8 + sw, 39.4, 0.55, 0.35, '#d8c9a4')), F(limb(16.2, 34.2, 17.4 + sw, 38.6, 0.5, 0.3, '#c2b183')),
        F(T([[8.1 + sw * 1.5, 43.2], [23.2 + sw * 1.5, 43.2], [23.2 + sw * 1.5, 44], [8.1 + sw * 1.5, 44]], '#6d7488'))];
    },
    sleeve: () => '#8e95a8',
    shoulder: (p, side) => [E(0, 1.2, 3.4, 3, side > 0 ? '#8e95a8' : '#7b8296')],
    legs: bare,
    shoe: (p, k, tint) => [k.sole(tint('#5c4a38')), k.poly([[-2.6, -0.8], [2.8, -0.8], [3, 1.2], [-2.8, 1.2]], tint('#8a6a46'))],
  },

  // ---------- Middling ----------
  // A sailor dress: the blouse and its square collar above, pleats below, one piece.
  schooldress: {
    top: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      return [...cloth('#fdfbf6'),
        T([[10.4, 25.9], [20.8, 25.9], [20.2, 30.4], [11, 30.4]], CLOTH.sailor),
        F(R(11.2, 29.3, 8.8, 0.45, '#ffffff')), F(R(11.2, 28.2, 8.8, 0.45, '#ffffff')),
        T([[13.4, 25.9], [17.8, 25.9], [15.6, 31.4]], '#fdfbf6'),
        F(E(15.6, 31.2, 1.4, 1.1, '#d8495c')), F(T([[14.5, 31.8], [16.7, 31.8], [15.6, 34.6]], '#d8495c')),
        ...flare(CLOTH.sailor, m, { len: 8.6, spread: 2.8, top: 34.6 }),
        ...folds(m, shade(CLOTH.sailor, -24), shade(CLOTH.sailor, 14), { top: 35.4, len: 7.4, spread: 2.8 }),
        F(R(9, 34.4, 13.2, 1.2, shade(CLOTH.sailor, -20))), F(R(9, 34.4, 13.2, 0.35, shade(CLOTH.sailor, 16))),
        ...[0, 1, 2].map((i) => F(R(11 + i * 4.4 + s, 42, 0.5, 1, shade(CLOTH.sailor, 20))))];
    },
    sleeve: () => '#fdfbf6',
    shoulder: (p, side) => [E(0, 1, 2.9, 2.6, side > 0 ? '#fdfbf6' : '#e2dbcf'), F(E(0, 0.2, 2.9, 1.5, side > 0 ? CLOTH.sailor : shade(CLOTH.sailor, -12))), ...cuffRound('#e2dbcf')],
    legs: bare,
    shoe: (p, k, tint) => [k.sole(tint('#3a3340')), k.poly([[-2.7, -1], [2.8, -1], [3, 1.6], [-2.8, 1.6]], tint('#5a4f5c'))],
  },
  // A gingham day dress: checks all over, a white collar, and a bow at the waist.
  ginghamdress: {
    top: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      const pts = DRESSP.map(([x, y]) => (y > 36 ? [x + s * (y - 36) * 0.22, y] : [x, y]));
      return [T(pts, '#fdfbf6'),
        // The check: rows that follow the dress, and stripes down it.
        ...[27.4, 29.8, 32.2, 34.6, 37, 39.4, 41.8].map((y) => band(pts, y, y + 1.1, CLOTH.check)).filter(Boolean).map(F),
        ...[11.4, 14, 16.6, 19.2].map((x) => F(T([[x, 27], [x + 1.1, 27], [MID + (x + 1.1 - MID) * 2.1 + s * 1.8, 44], [MID + (x - MID) * 2.1 + s * 1.8, 44]], CLOTH.check))),
        // A round white collar over it all.
        T([[11.8, 25.9], [19.4, 25.9], [18.8, 29], [15.6, 30], [12.4, 29]], '#ffffff'),
        F(T([[11.8, 25.9], [13.4, 25.9], [12.8, 28.8], [12.2, 28.8]], '#efe8dc')),
        // The waist, and its bow.
        F(R(9, 33.6, 13.6, 1.6, shade(CLOTH.check, -20))),
        F(T([[15.6, 34.4], [12.4, 33], [12, 36]], '#ffffff')), F(T([[15.6, 34.4], [18.8, 33], [19.2, 36]], '#eee6da')), F(E(15.6, 34.4, 1, 0.9, '#ffffff')),
        F(T([[5.6 + s * 1.8, 43.4], [25.6 + s * 1.8, 43.4], [25.6 + s * 1.8, 44], [5.6 + s * 1.8, 44]], shade(CLOTH.check, -16)))];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1.2, 3, 2.7, side > 0 ? '#fdfbf6' : '#e8e0d4'), F(E(0, 2.2, 2.8, 1, CLOTH.check))],
    legs: bare,
    shoe: shoeIn('#ffffff', '#c0b2a8'),
  },
  // A festival yukata: sprigs of blossom over it, a crossed collar, and a wide obi with its bow
  // tied at the back.
  yukata: {
    long: true,
    top: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [23 + s * 1.4, 44], [8.2 + s * 1.4, 44], ...TORSO.slice(8)];
      return [T(pts, CLOTH.yukata),
        F(T([[10.2, 27], [12.8, 26.7], [10 + s * 1.4, 44], [8.3 + s * 1.4, 44]], shade(CLOTH.yukata, 18))),
        ...folds(m, shade(CLOTH.yukata, -16), shade(CLOTH.yukata, 16), { top: 36, len: 7.4, spread: 1.2, xs: [12.2, 15.6, 19] }),
        // Blossom, scattered over the cloth.
        ...[[12.6, 29.4], [19.4, 31], [11.6, 38.6], [18.6, 40.4], [14.8, 42.2], [21, 36.4]].flatMap(([x, y]) => {
          const dx = x + s * Math.max(0, (y - 36)) * 0.22;
          return [...Array.from({ length: 5 }, (_, i) => F(E(dx + Math.cos((i / 5) * Math.PI * 2) * 1.05, y + Math.sin((i / 5) * Math.PI * 2) * 1.05, 0.62, 0.62, '#ffe4ee'))), F(E(dx, y, 0.42, 0.42, '#f2b05c'))];
        }),
        ...cross('#fff2e4', '#ffffff'),
        ...obi('#d8495c', '#e8c470', m, 32.4, 3.2),
        F(T([[8.2 + s * 1.4, 43.3], [23 + s * 1.4, 43.3], [23 + s * 1.4, 44], [8.2 + s * 1.4, 44]], shade(CLOTH.yukata, -20)))];
    },
    sleeve: () => CLOTH.yukata,
    shoulder: (p, side) => [E(0, 1.2, 3.3, 2.9, side > 0 ? CLOTH.yukata : shade(CLOTH.yukata, -12))],
    legs: bare,
    shoe: (p, k, tint) => [k.sole(tint('#6b5c48')), k.poly([[-2.6, -0.8], [2.8, -0.8], [3, 1.2], [-2.8, 1.2]], tint('#f2e8d0'))],
  },
  // A cocoa knit dress: cables down the front, a belt at the waist, ribbing at the hem.
  cocoa: {
    long: true,
    top: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      const pts = DRESSP.map(([x, y]) => (y > 36 ? [x + s * (y - 36) * 0.2, y] : [x, y]));
      return [T(pts, CLOTH.cocoa),
        F(T([[10.4, 26.8], [13.2, 26.6], [10.2 + s * 1.6, 44], [7.6 + s * 1.6, 44]], shade(CLOTH.cocoa, 16))),
        ...Array.from({ length: 6 }, (_, i) => F(limb(13, 27.2 + i * 1.3, 14.4, 28.1 + i * 1.3, 0.7, 0.7, shade(CLOTH.cocoa, 16)))),
        ...Array.from({ length: 6 }, (_, i) => F(limb(16.8, 28.1 + i * 1.3, 18.2, 27.2 + i * 1.3, 0.7, 0.7, shade(CLOTH.cocoa, 16)))),
        ...folds(m, shade(CLOTH.cocoa, -18), shade(CLOTH.cocoa, 14), { top: 36.4, len: 7, spread: 3, xs: [11.8, 15.6, 19.4] }),
        F(R(9, 33.8, 13.6, 1.7, '#5a3f2c')), F(R(9, 33.8, 13.6, 0.4, '#8a6648')), F(R(14.6, 33.7, 2, 1.9, '#e8c470')), F(R(15.2, 34.1, 0.55, 1, '#8a6648')),
        ...ribs(6.6 + s * 1.6, 24.6 + s * 1.6, 42.2, 1.6, shade(CLOTH.cocoa, -16), 1.4),
        ...crew(shade(CLOTH.cocoa, 18), shade(CLOTH.cocoa, -20))];
    },
    sleeve: () => CLOTH.cocoa,
    shoulder: (p, side) => [E(0, 1.1, 3.2, 2.8, side > 0 ? CLOTH.cocoa : shade(CLOTH.cocoa, -11))],
    legs: legsIn('#d8c8b4'),
    shoe: shoeIn('#6b5443', '#463428'),
  },
  // A cafe dress: dark cloth under a white frilled apron, its ties bowed behind.
  cafe: {
    long: true,
    top: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      const pts = DRESSP.map(([x, y]) => (y > 36 ? [x + s * (y - 36) * 0.22, y] : [x, y]));
      return [T(pts, '#403a4a'),
        F(T([[10.4, 26.8], [13.2, 26.6], [10 + s * 1.8, 44], [7.4 + s * 1.8, 44]], '#55506a')),
        ...folds(m, '#2e2a38', '#5d5872', { top: 36, len: 7.6, spread: 3.4, xs: [11.4, 14.6, 17.8, 21] }),
        // The apron: a bib, a gathered skirt and a frill all round.
        F(T([[12.4, 29.2], [18.8, 29.2], [19, 33.6], [12.2, 33.6]], '#ffffff')),
        F(T([[12.4, 29.2], [14, 29.2], [13.8, 33.6], [12.2, 33.6]], '#f0ecf4')),
        F(T([[10.4, 33.4], [20.8, 33.4], [22.6 + s * 1.5, 41.6], [8.6 + s * 1.5, 41.6]], '#ffffff')),
        F(T([[10.4, 33.4], [12.4, 33.4], [10.8 + s * 1.5, 41.6], [8.7 + s * 1.5, 41.6]], '#f0ecf4')),
        ...lace(8.6 + s * 1.5, 22.6 + s * 1.5, 41.4, '#ffffff', 1.6),
        F(R(9.6, 33, 12.4, 1.1, '#ffffff')),
        // A white collar, and the apron's bow behind her.
        T([[12.2, 25.9], [19, 25.9], [18.4, 28.6], [15.6, 29.6], [12.8, 28.6]], '#ffffff'),
        F(limb(9.8, 33.5, 6.6 + s, 38.6, 0.9, 0.6, '#ffffff')), F(limb(9.6, 33.9, 7.8 + s, 39.6, 0.8, 0.55, '#eae6f0')),
        F(T([[5.6 + s * 1.8, 43.4], [25.6 + s * 1.8, 43.4], [25.6 + s * 1.8, 44], [5.6 + s * 1.8, 44]], '#2e2a38'))];
    },
    sleeve: () => '#403a4a',
    shoulder: (p, side) => [E(0, 1.1, 3.1, 2.8, side > 0 ? '#403a4a' : '#332e40')],
    legs: bare,
    shoe: shoeIn('#2e2a38', '#1d1a26'),
  },
  // A petal dress: the hem cut into soft petals, one blossom at the waist.
  petal: {
    top: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      const pts = DRESSP.map(([x, y]) => (y > 36 ? [x + s * (y - 36) * 0.24, y] : [x, y]));
      return [T(pts, CLOTH.petalpink),
        F(T([[10.4, 26.8], [13.2, 26.6], [10 + s * 1.9, 44], [7.4 + s * 1.9, 44]], shade(CLOTH.petalpink, 16))),
        ...folds(m, shade(CLOTH.petalpink, -16), '#ffffff', { top: 36, len: 7.4, spread: 3.6, xs: [11.4, 14.6, 17.8, 21] }),
        // The petals of the hem, each a soft round lobe.
        ...Array.from({ length: 7 }, (_, i) => F(E(6.8 + s * 1.9 + i * 3, 43.4, 1.8, 1.5, shade(CLOTH.petalpink, -10)))),
        ...Array.from({ length: 7 }, (_, i) => F(E(6.8 + s * 1.9 + i * 3, 42.8, 1.6, 1.1, shade(CLOTH.petalpink, 8)))),
        F(R(9, 33.6, 13.6, 1.3, '#ffffff')), F(R(9, 34.6, 13.6, 0.4, '#e4a8bc')),
        ...Array.from({ length: 5 }, (_, i) => F(E(19.4 + Math.cos((i / 5) * Math.PI * 2) * 1.2, 34.2 + Math.sin((i / 5) * Math.PI * 2) * 1.2, 0.75, 0.75, '#ffffff'))),
        F(E(19.4, 34.2, 0.55, 0.55, '#f2c45a'))];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1.2, 2.8, 2.5, side > 0 ? CLOTH.petalpink : shade(CLOTH.petalpink, -12))],
    legs: bare,
    shoe: shoeIn('#fff4f8', '#cbb2bd'),
  },
  // A druid's dress: moss cloth with vines climbing it and leaves lapped along the hem.
  druid: {
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = DRESSP.map(([x, y]) => (y > 36 ? [x + sw * (y - 36) * 0.24, y] : [x, y]));
      return [T(pts, '#5f7a4a'),
        F(T([[10.4, 26.8], [13.2, 26.6], [10 + sw * 1.9, 44], [7.4 + sw * 1.9, 44]], '#7a9660')),
        ...folds(m, '#455a36', '#8fae72', { top: 36, len: 7.2, spread: 3.4, xs: [11.8, 15.6, 19.4] }),
        // Vines, winding up the bodice.
        ...[[13.4, 1], [17.8, -1]].flatMap(([x, d]) => [
          F(limb(x, 35, x + d * 1.4, 31.4, 0.3, 0.3, '#3f5a33')), F(limb(x + d * 1.4, 31.4, x, 27.8, 0.3, 0.3, '#3f5a33')),
          F(E(x + d * 1.6, 32.8, 1, 0.65, '#8fc46e')), F(E(x - d * 0.4, 29.6, 0.9, 0.6, '#8fc46e'))]),
        // Leaves along the hem.
        ...Array.from({ length: 8 }, (_, i) => F(E(6.6 + sw * 1.9 + i * 2.6, 43, 1.9, 1.3, i % 2 ? '#8fc46e' : '#6f9a5a'))),
        ...Array.from({ length: 8 }, (_, i) => F(limb(6.6 + sw * 1.9 + i * 2.6 - 1.4, 43, 6.6 + sw * 1.9 + i * 2.6 + 1.4, 43, 0.2, 0.2, '#455a36'))),
        F(R(9, 33.6, 13.6, 1.4, '#7a5a3a')), F(R(9, 33.6, 13.6, 0.4, '#a8805a')),
        ...Array.from({ length: 5 }, (_, i) => F(E(19.6 + Math.cos((i / 5) * Math.PI * 2) * 1.2, 34.2 + Math.sin((i / 5) * Math.PI * 2) * 1.2, 0.72, 0.72, '#fff0c8'))),
        F(E(19.6, 34.2, 0.5, 0.5, '#e8c470'))];
    },
    sleeve: () => '#5f7a4a',
    shoulder: (p, side) => [E(0, 1.2, 3, 2.7, side > 0 ? '#5f7a4a' : '#455a36'), F(E(0, 2.4, 2.8, 1, '#8fc46e'))],
    legs: bare,
    shoe: shoeIn('#8a6a46', '#5c4530'),
  },

  // ---------- Fine ----------
  // A ball gown: a fitted bodice over a wide skirt, a sash at the waist and a jewel on it.
  ballgown: {
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [22.6, 35], [26.8 + sw * 1.8, 44], [4.4 + sw * 1.8, 44], [8.6, 35], ...TORSO.slice(8)];
      return [T(pts, CLOTH.gown),
        F(T([[10.4, 26.8], [13.2, 26.6], [8.8 + sw * 1.8, 44], [4.5 + sw * 1.8, 44]], shade(CLOTH.gown, 16))),
        ...folds(m, shade(CLOTH.gown, -18), shade(CLOTH.gown, 16), { top: 35.4, len: 8.2, spread: 5.4, xs: [11, 14, 17.2, 20.2] }),
        ...lace(4.4 + sw * 1.8, 26.8 + sw * 1.8, 43.4, shade(CLOTH.gown, 24), 1.8),
        // The bodice: a sweetheart neckline and a line of seams.
        F(T([[11.4, 26.2], [20, 26.2], [20.2, 28.4], [15.6, 29.6], [11.2, 28.4]], shade(CLOTH.gown, -12))),
        ...[12.8, 15.6, 18.4].map((x) => F(limb(x, 28.4, x + (x - MID) * 0.1, 33.6, 0.28, 0.28, shade(CLOTH.gown, -20)))),
        F(R(9, 33.4, 13.6, 1.8, '#e8c470')), F(R(9, 33.4, 13.6, 0.45, '#f6e4b0')), F(R(9, 34.8, 13.6, 0.4, '#b08a3a')),
        ...gem(19.4, 34.3, 1.3, '#7fd8e8')];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.6, 2.3, side > 0 ? p.skin : shade(p.skin, -8)), F(limb(-2, -0.4, 2, -0.4, 0.5, 0.5, side > 0 ? shade(CLOTH.gown, -12) : shade(CLOTH.gown, -22)))],
    legs: bare,
    shoe: shoeIn('#f2eaf6', '#a898ae'),
  },
  // A furisode: the long-sleeved kimono, its sleeves hanging almost to the floor and swinging.
  furisode: {
    long: true,
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [23 + sw * 1.4, 44], [8.2 + sw * 1.4, 44], ...TORSO.slice(8)];
      return [T(pts, CLOTH.furi),
        F(T([[10.2, 27], [12.8, 26.7], [10 + sw * 1.4, 44], [8.3 + sw * 1.4, 44]], shade(CLOTH.furi, 16))),
        ...folds(m, shade(CLOTH.furi, -18), shade(CLOTH.furi, 14), { top: 36, len: 7.4, spread: 1.2, xs: [12.2, 15.6, 19] }),
        ...[[12.4, 38.6], [19, 41], [15.4, 42.8]].flatMap(([x, y]) => {
          const dx = x + sw * Math.max(0, y - 36) * 0.22;
          return [...Array.from({ length: 6 }, (_, i) => F(E(dx + Math.cos((i / 6) * Math.PI * 2) * 1.2, y + Math.sin((i / 6) * Math.PI * 2) * 1.2, 0.7, 0.7, '#ffffff'))), F(E(dx, y, 0.5, 0.5, '#e8c470'))];
        }),
        ...cross('#fff2e4', '#ffffff', 31.4),
        ...obi('#e8c470', CLOTH.wine, m, 32.6, 3.6),
        F(T([[8.2 + sw * 1.4, 43.3], [23 + sw * 1.4, 43.3], [23 + sw * 1.4, 44], [8.2 + sw * 1.4, 44]], '#e8c470'))];
    },
    sleeve: () => CLOTH.furi,
    shoulder: (p, side) => [E(0, 1.2, 3.4, 3, side > 0 ? CLOTH.furi : shade(CLOTH.furi, -12))],
    // The hanging sleeves, one each side, trailing a beat behind her.
    back: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.9;
      return [T([[8.8, 27.4], [12.2, 27.4], [11 + sw, 40.4], [6.6 + sw, 40.2]], CLOTH.furi),
        F(T([[8.8, 27.4], [10.2, 27.4], [8.8 + sw, 40.3], [6.7 + sw, 40.2]], shade(CLOTH.furi, 16))),
        F(T([[6.7 + sw, 39.4], [11 + sw, 39.6], [11 + sw, 40.4], [6.6 + sw, 40.2]], '#e8c470')),
        T([[19.4, 27.4], [22.8, 27.4], [24.8 + sw, 40.2], [20.4 + sw, 40.4]], shade(CLOTH.furi, -10)),
        F(T([[20.4 + sw, 39.6], [24.8 + sw, 39.4], [24.8 + sw, 40.2], [20.4 + sw, 40.4]], '#c8a450'))];
    },
    legs: bare,
    shoe: (p, k, tint) => [k.sole(tint('#5c4a38')), k.poly([[-2.6, -0.8], [2.8, -0.8], [3, 1.2], [-2.8, 1.2]], tint('#fff6e8'))],
  },
  // A lace gown: three lace falls over ivory silk, with a ribbon at the waist.
  lacegown: {
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = DRESSP.map(([x, y]) => (y > 36 ? [x + sw * (y - 36) * 0.24, y] : [x, y]));
      return [T(pts, CLOTH.ivory),
        F(T([[10.4, 26.8], [13.2, 26.6], [10 + sw * 1.9, 44], [7.4 + sw * 1.9, 44]], '#fffaf0')),
        ...lace(10.6, 20.6, 26.6, '#ffffff', 1.6),
        ...[[34.6, 7.4, 8.8], [38, 8.6, 10.2], [41.4, 9.8, 11.6]].flatMap(([y, w0, w1]) => [
          F(T([[MID - w0, y - 0.6], [MID + w0, y - 0.6], [MID + w1 + sw * 0.8, y + 2.4], [MID - w1 + sw * 0.8, y + 2.4]], '#fffaf0')),
          F(T([[MID - w0, y - 0.6], [MID + w0, y - 0.6], [MID + w0, y + 0.2], [MID - w0, y + 0.2]], '#ddceba')),
          F(T([[MID - w0, y - 0.6], [MID - w0 + 2, y - 0.6], [MID - w1 + 2.2 + sw * 0.8, y + 2.4], [MID - w1 + sw * 0.8, y + 2.4]], '#ffffff')),
          ...lace(MID - w1 + sw * 0.8, MID + w1 + sw * 0.8, y + 2.2, '#efe2d2', 1.5)]),
        ...folds(m, '#e4d6c0', '#ffffff', { top: 36, len: 7.2, spread: 3.6, xs: [12.4, 18.8] }),
        F(R(9, 33.4, 13.6, 1.5, CLOTH.ribbon)), F(R(9, 33.4, 13.6, 0.4, '#f2a8bc')),
        F(T([[15.6, 34.2], [12.2, 32.8], [11.8, 36]], CLOTH.ribbon)), F(T([[15.6, 34.2], [19, 32.8], [19.4, 36]], shade(CLOTH.ribbon, -12))), F(E(15.6, 34.2, 1, 0.9, shade(CLOTH.ribbon, -20)))];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.6, 2.3, side > 0 ? p.skin : shade(p.skin, -8)), ...lace(-2.6, 2.6, -0.4, '#ffffff', 1.3)],
    legs: bare,
    shoe: shoeIn('#fffaf0', '#c0b2a0'),
  },
  // A witch's dress: a torn hem, a buckled belt and a star at the throat.
  witch: {
    long: true,
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = DRESSP.map(([x, y]) => (y > 36 ? [x + sw * (y - 36) * 0.26, y] : [x, y]));
      return [T(pts, CLOTH.witch),
        F(T([[10.4, 26.8], [13.2, 26.6], [10 + sw * 2, 44], [7.4 + sw * 2, 44]], shade(CLOTH.witch, 18))),
        ...folds(m, shade(CLOTH.witch, -22), shade(CLOTH.witch, 16), { top: 36, len: 7, spread: 3.8, xs: [11.4, 14.6, 17.8, 21] }),
        // The hem, torn into points.
        ...Array.from({ length: 8 }, (_, i) => F(T([[5.8 + sw * 2 + i * 2.6, 42], [8.4 + sw * 2 + i * 2.6, 42], [7.1 + sw * 2 + i * 2.6, 44.4 + (i % 2) * 0.9]], CLOTH.witch))),
        F(R(9, 33.4, 13.6, 1.8, '#2e2838')), F(R(9, 33.4, 13.6, 0.4, '#504860')),
        F(R(14.6, 33.3, 2.1, 2, '#e8c470')), F(R(15.3, 33.8, 0.6, 1.1, '#2e2838')),
        ...[[12.2, 38.4, 0.9], [19.4, 40.8, 0.8], [15.8, 42.4, 0.7]].map(([x, y, r]) => star(x + sw * (y - 36) * 0.26, y, r, '#e4d8ff')),
        star(15.6, 28.6, 1.5, '#e8c470'), star(15.6, 28.6, 0.7, '#fff2c8')];
    },
    sleeve: () => CLOTH.witch,
    shoulder: (p, side) => [E(0, 1.2, 3.3, 2.9, side > 0 ? CLOTH.witch : shade(CLOTH.witch, -12))],
    legs: legsIn('#3a3350'),
    shoe: (p, k, tint) => [k.sole(tint('#211c2e')), k.poly([[-2.8, -1.4], [2.9, -1.4], [3.1, 1.8], [-2.9, 1.8]], tint('#3a3350'))],
  },
  // A princess dress: puffed sleeves, pearls along the neckline, a great bow at the back.
  princess: {
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [22.6, 35], [26.4 + sw * 1.8, 44], [4.8 + sw * 1.8, 44], [8.6, 35], ...TORSO.slice(8)];
      return [T(pts, CLOTH.sky2),
        F(T([[10.4, 26.8], [13.2, 26.6], [9 + sw * 1.8, 44], [4.9 + sw * 1.8, 44]], shade(CLOTH.sky2, 18))),
        ...folds(m, shade(CLOTH.sky2, -18), '#ffffff', { top: 35.4, len: 8.2, spread: 5, xs: [11, 14, 17.2, 20.2] }),
        ...lace(4.8 + sw * 1.8, 26.4 + sw * 1.8, 43.4, '#ffffff', 1.8),
        F(T([[11.4, 26.2], [20, 26.2], [20.2, 28.6], [11.2, 28.6]], shade(CLOTH.sky2, -14))),
        ...Array.from({ length: 7 }, (_, i) => F(E(11.8 + i * 1.3, 26.6, 0.5, 0.5, '#ffffff'))),
        F(R(9, 33.4, 13.6, 1.6, '#ffffff')), F(R(9, 34.8, 13.6, 0.4, '#b8cfe8')),
        ...[[13.4, 38.6], [19.2, 41], [16, 43]].map(([x, y]) => F(E(x + sw * (y - 36) * 0.22, y, 0.5, 0.5, '#ffffff')))];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1.6, 3.6, 3.2, side > 0 ? CLOTH.sky2 : shade(CLOTH.sky2, -12)), F(E(0, 0.6, 2.9, 1.4, shade(CLOTH.sky2, 20)))],
    back: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.6;
      return [T([[15.6, 33.6], [8.4 + sw, 30.8], [7.4 + sw, 36.6]], '#ffffff'), T([[15.6, 33.6], [21.4, 31.2], [22.2, 36.2]], '#eaf2fb'),
        F(limb(13.4, 34.4, 9.4 + sw, 42.6, 0.9, 0.6, '#ffffff')), F(limb(14.4, 34.6, 11.8 + sw, 43.4, 0.8, 0.55, '#eaf2fb')),
        F(E(15.6, 33.6, 1.3, 1.2, '#ffffff'))];
    },
    legs: bare,
    shoe: shoeIn('#ffffff', '#b2bfd0'),
  },
  // A swan dress: a feathered bodice over a stiff tutu, in white and ash.
  swan: {
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.4;
      return [...cloth('#fdfbf8'),
        // Feathers lapped over the bodice.
        ...[26.8, 28.6, 30.4, 32.2].flatMap((y, r) => Array.from({ length: 4 }, (_, i) => F(E(11.4 + i * 2.9 + (r % 2) * 1.4, y, 1.7, 1.2, r % 2 ? '#ffffff' : '#eceaf0')))),
        F(T([[11.4, 26.2], [20, 26.2], [20.2, 28.2], [15.6, 29.4], [11.2, 28.2]], '#e4e2ea')),
        // The tutu: three stiff layers standing out from the hip.
        ...[[34.4, 9.4], [35.6, 11], [37, 12.4]].map(([y, w]) => F(E(MID + sw, y, w, 2.2, '#c8c4d4'))),
        ...[[34.4, 9.4], [35.6, 11], [37, 12.4]].map(([y, w]) => F(E(MID + sw, y - 0.55, w * 0.95, 1.7, '#ffffff'))),
        ...[[34.4, 9.4], [35.6, 11], [37, 12.4]].map(([y, w]) => F(E(MID + sw - w * 0.45, y - 0.7, w * 0.4, 0.9, '#f6f4fa'))),
        ...Array.from({ length: 9 }, (_, i) => F(limb(MID + sw - 8 + i * 2, 35.4, MID + sw - 11.4 + i * 2.85, 38.4, 0.4, 0.5, '#e0dde8'))),
        F(R(9.4, 33.4, 12.4, 1.2, '#cfcbd8')), F(R(9.4, 33.4, 12.4, 0.35, '#ffffff')),
        ...gem(15.6, 34, 1.1, '#e8eef8')];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.7, 2.4, side > 0 ? '#ffffff' : '#e4e2ea'), F(E(-0.8, 1.6, 1.5, 1, '#ffffff')), F(E(1.2, 2, 1.4, 0.9, '#f2f0f6'))],
    legs: legsIn('#fdfbf8'),
    shoe: shoeIn('#fdfbf8', '#c0bcc8'),
  },
  // An elven gown: leaf silk with gold filigree climbing it, and a long trailing hem.
  elfgown: {
    long: true,
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [22.4, 35.4], [25.8 + sw * 1.8, 44], [5.4 + sw * 1.8, 44], [8.8, 35.4], ...TORSO.slice(8)];
      return [T(pts, '#4e8a72'),
        F(T([[10.4, 26.8], [13.2, 26.6], [9 + sw * 1.8, 44], [5.5 + sw * 1.8, 44]], '#6ba88c')),
        ...folds(m, '#376654', '#86c4a4', { top: 35.8, len: 7.8, spread: 4.6, xs: [11.4, 14.6, 17.8, 21] }),
        // Filigree: a vine of gold up the bodice and out along the hem.
        ...[[15.6, 34.4], [15.6, 31.6], [15.6, 28.8]].flatMap(([x, y], i) => [
          F(limb(x, y, x + (i % 2 ? 2.2 : -2.2), y - 1.4, 0.26, 0.26, GOLDEN)),
          F(E(x + (i % 2 ? 2.4 : -2.4), y - 1.6, 0.75, 0.5, '#f6e4b0'))]),
        F(limb(15.6, 35, 15.6, 27.4, 0.26, 0.26, GOLDEN)),
        ...braid(5.5 + sw * 1.8, 42.6, 20.3, 0.7),
        // A leaf collar standing at the shoulders.
        F(T([[11.6, 26.2], [8.8, 22.4], [12.8, 25]], '#86c4a4')), F(T([[19.6, 26.2], [22.4, 22.4], [18.4, 25]], '#4e8a72')),
        F(T([[11.4, 26.2], [19.8, 26.2], [20, 27.8], [15.6, 29.4], [11.2, 27.8]], '#376654')),
        ...gem(15.6, 27.4, 1.2, '#9fe8c8')];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.7, 2.4, side > 0 ? p.skin : shade(p.skin, -8)), F(limb(-2.2, -0.4, 2.2, -0.4, 0.5, 0.5, side > 0 ? '#4e8a72' : '#376654'))],
    legs: bare,
    shoe: shoeIn('#d8f0e2', '#86a898'),
  },

  // ---------- Elite ----------
  // A coronation gown: white silk under a gold stomacher, with a long skirt and a jewelled hem.
  coronation: {
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [22.6, 35], [26.8 + sw * 1.8, 44], [4.4 + sw * 1.8, 44], [8.6, 35], ...TORSO.slice(8)];
      return [T(pts, '#fdfaf0'),
        F(T([[10.4, 26.8], [13.2, 26.6], [8.8 + sw * 1.8, 44], [4.5 + sw * 1.8, 44]], '#ffffff')),
        ...folds(m, '#ddd2bc', '#ffffff', { top: 35.4, len: 8.2, spread: 5.4, xs: [11, 14, 17.2, 20.2] }),
        // The stomacher.
        F(T([[12.2, 26.4], [19, 26.4], [19.4, 32.4], [15.6, 35.4], [11.8, 32.4]], GOLDEN)),
        F(T([[12.2, 26.4], [14, 26.4], [13.6, 32.8], [11.9, 32.4]], '#f6e4b0')),
        ...lacing(13.6, 17.6, 27.6, 32.4, 4, '#b08a3a', '#f6e4b0'),
        ...gem(15.6, 34, 1.2, '#e0485e'),
        ...braid(4.5 + sw * 1.8, 42.2, 22.2, 1.1), ...[0, 1, 2, 3, 4].map((i) => F(E(7 + sw * 1.8 + i * 4.4, 42.8, 0.6, 0.6, '#e0485e'))),
        F(T([[11.4, 26.2], [20, 26.2], [20.2, 27.4], [11.2, 27.4]], '#f6e4b0'))];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.7, 2.4, side > 0 ? '#fdfaf0' : '#e8e0d0'), ...braid(-2.7, 1.6, 5.4, 0.45)],
    legs: bare,
    shoe: shoeIn('#f6e4b0', '#b08a3a'),
  },
  // A galaxy gown: the deep sky worn as cloth, a nebula sash about the waist and stars all through.
  galaxy: {
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = DRESSP.map(([x, y]) => (y > 36 ? [x + sw * (y - 36) * 0.26, y] : [x, y]));
      return [T(pts, CLOTH.midnight),
        F(T([[10.4, 26.8], [13.2, 26.6], [10 + sw * 2, 44], [7.4 + sw * 2, 44]], shade(CLOTH.midnight, 22))),
        // The nebula, bloomed across the skirt.
        ...[[13, 38.6, 3.4, 2.2, '#5a4a9c'], [18.6, 40.4, 3, 2, '#7a4a8c'], [15.6, 42.2, 3.6, 1.8, '#3f5a9c']].map(([x, y, rx, ry, c]) => F(E(x + sw * (y - 36) * 0.26, y, rx, ry, c))),
        ...folds(m, '#171a38', shade(CLOTH.midnight, 20), { top: 36, len: 7.4, spread: 3.8, xs: [11.4, 18.8] }),
        ...[[12.2, 29.8, 0.9], [19, 31.4, 0.8], [11.6, 37.4, 0.8], [19.6, 39.2, 0.9], [15, 41, 0.7], [21.6, 42.4, 0.8], [9.6, 42, 0.7]].map(([x, y, r]) => star(x + sw * Math.max(0, y - 36) * 0.26, y, r, '#e4ecff')),
        ...dots([[14.2, 33.2], [17.8, 36.4], [10.8, 40], [20.8, 35]], 0.3, '#ffffff'),
        F(R(9, 33.4, 13.6, 1.8, '#7a4a8c')), F(R(9, 33.4, 13.6, 0.45, '#b48ad8')), F(R(9, 34.8, 13.6, 0.4, '#3f3a6b')),
        F(T([[11.4, 26.2], [20, 26.2], [20.2, 28.4], [15.6, 29.6], [11.2, 28.4]], '#1b1f42'))];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.7, 2.4, side > 0 ? CLOTH.midnight : shade(CLOTH.midnight, -12)), F(limb(-2, -0.4, 2, -0.4, 0.5, 0.5, '#b48ad8'))],
    legs: bare,
    shoe: shoeIn('#3a3f6b', '#262a4a'),
  },
  // A phoenix furisode: scarlet and gold, with flame along the hem and sleeves that hang and swing.
  phoenixfuri: {
    long: true,
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [23 + sw * 1.4, 44], [8.2 + sw * 1.4, 44], ...TORSO.slice(8)];
      return [T(pts, CLOTH.scarlet),
        F(T([[10.2, 27], [12.8, 26.7], [10 + sw * 1.4, 44], [8.3 + sw * 1.4, 44]], shade(CLOTH.scarlet, 18))),
        ...folds(m, shade(CLOTH.scarlet, -20), shade(CLOTH.scarlet, 16), { top: 36, len: 7.4, spread: 1.2, xs: [12.2, 15.6, 19] }),
        // Flame, climbing the hem.
        ...Array.from({ length: 7 }, (_, i) => F(T([[8.6 + sw * 1.4 + i * 2.1, 44], [10.6 + sw * 1.4 + i * 2.1, 44], [9.6 + sw * 1.4 + i * 2.1, 38.4 - (i % 2) * 1.6]], GOLDEN))),
        ...Array.from({ length: 7 }, (_, i) => F(T([[9.1 + sw * 1.4 + i * 2.1, 44], [10.1 + sw * 1.4 + i * 2.1, 44], [9.8 + sw * 1.4 + i * 2.1, 40 - (i % 2) * 1.4]], '#f6e4b0'))),
        ...cross('#f6e4b0', '#fff6dc', 31.4),
        ...obi(CLOTH.obsidian, GOLDEN, m, 32.6, 3.6),
        F(E(15.7, 29.4, 1.6, 1.5, GOLDEN)), F(T([[15.7, 28.2], [17.1, 30.2], [15.7, 31], [14.3, 30.2]], CLOTH.scarlet))];
    },
    sleeve: () => CLOTH.scarlet,
    shoulder: (p, side) => [E(0, 1.2, 3.4, 3, side > 0 ? CLOTH.scarlet : shade(CLOTH.scarlet, -12))],
    back: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.9;
      return [T([[8.8, 27.4], [12.2, 27.4], [11 + sw, 40.4], [6.6 + sw, 40.2]], CLOTH.scarlet),
        F(T([[8.8, 27.4], [10.2, 27.4], [8.8 + sw, 40.3], [6.7 + sw, 40.2]], shade(CLOTH.scarlet, 18))),
        F(T([[6.7 + sw, 38.8], [11 + sw, 39], [11 + sw, 40.4], [6.6 + sw, 40.2]], GOLDEN)),
        T([[19.4, 27.4], [22.8, 27.4], [24.8 + sw, 40.2], [20.4 + sw, 40.4]], shade(CLOTH.scarlet, -10)),
        F(T([[20.4 + sw, 39], [24.8 + sw, 38.8], [24.8 + sw, 40.2], [20.4 + sw, 40.4]], '#c8a450'))];
    },
    legs: bare,
    shoe: (p, k, tint) => [k.sole(tint('#5c4a38')), k.poly([[-2.6, -0.8], [2.8, -0.8], [3, 1.2], [-2.8, 1.2]], tint('#f6e4b0'))],
  },
  // The Sakura Empress: layer upon layer of blossom silk, each collar showing under the last.
  empress: {
    long: true,
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [23.4 + sw * 1.5, 44], [7.8 + sw * 1.5, 44], ...TORSO.slice(8)];
      return [T(pts, CLOTH.sakura),
        F(T([[10.2, 27], [12.8, 26.7], [9.8 + sw * 1.5, 44], [7.9 + sw * 1.5, 44]], '#ffd8e6')),
        ...folds(m, '#dc90ae', '#ffe4ee', { top: 36, len: 7.4, spread: 1.6, xs: [12.2, 15.6, 19] }),
        // Petals, falling down the cloth.
        ...[[12.2, 29.6], [19.4, 31.4], [11.4, 37.6], [19, 39.6], [15, 41.6], [21.4, 35.4], [13.6, 43]].flatMap(([x, y]) => {
          const dx = x + sw * Math.max(0, y - 36) * 0.24;
          return [...Array.from({ length: 5 }, (_, i) => F(E(dx + Math.cos((i / 5) * Math.PI * 2) * 1.05, y + Math.sin((i / 5) * Math.PI * 2) * 1.05, 0.62, 0.62, '#fff2f6'))), F(E(dx, y, 0.42, 0.42, '#e8c470'))];
        }),
        ...cross('#b8456e', '#d86e92', 33),
        ...cross('#fff2f6', '#ffffff', 31.4),
        ...cross(GOLDEN, '#f6e4b0', 29.8),
        ...obi('#b8456e', GOLDEN, m, 32.8, 3.8),
        F(T([[7.9 + sw * 1.5, 43.2], [23.4 + sw * 1.5, 43.2], [23.4 + sw * 1.5, 44], [7.9 + sw * 1.5, 44]], GOLDEN))];
    },
    sleeve: () => CLOTH.sakura,
    shoulder: (p, side) => [E(0, 1.2, 3.5, 3, side > 0 ? CLOTH.sakura : '#dc90ae')],
    legs: bare,
    shoe: (p, k, tint) => [k.sole(tint('#8a5c6a')), k.poly([[-2.6, -0.8], [2.8, -0.8], [3, 1.2], [-2.8, 1.2]], tint('#fff2f6'))],
  },
  // An abyss gown: deep water silk strung with pearls, its hem trailing away behind.
  abyss: {
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.6;
      const pts = [...TORSO.slice(0, 6), [22.4, 35.4], [25.4 + sw * 1.8, 44], [5.8 + sw * 1.8, 44], [8.8, 35.4], ...TORSO.slice(8)];
      return [T(pts, CLOTH.abyss),
        F(T([[10.4, 26.8], [13.2, 26.6], [9.4 + sw * 1.8, 44], [5.9 + sw * 1.8, 44]], shade(CLOTH.abyss, 22))),
        ...folds(m, '#113038', shade(CLOTH.abyss, 20), { top: 35.8, len: 7.8, spread: 4.6, xs: [11.4, 14.6, 17.8, 21] }),
        // Pearls, strung across the bodice and scattered down the skirt.
        ...Array.from({ length: 7 }, (_, i) => F(E(11.4 + i * 1.3, 27.4 + Math.sin((i / 6) * Math.PI) * 1.1, 0.55, 0.55, '#f2f6f4'))),
        ...[[12.6, 37.4], [19, 39.4], [15.6, 41.6], [21.4, 42.8], [10.4, 42]].flatMap(([x, y]) => [F(E(x + sw * (y - 36) * 0.22, y, 0.65, 0.65, '#cfe4e0')), F(E(x - 0.2 + sw * (y - 36) * 0.22, y - 0.25, 0.3, 0.2, '#ffffff'))]),
        F(R(9, 33.8, 13.6, 1.6, '#7fb4a8')), F(R(9, 33.8, 13.6, 0.4, '#bfe0d6')),
        F(T([[11.4, 26.2], [20, 26.2], [20.2, 28.4], [15.6, 29.6], [11.2, 28.4]], '#113038'))];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.7, 2.4, side > 0 ? CLOTH.abyss : shade(CLOTH.abyss, -12)), F(limb(-2, -0.4, 2, -0.4, 0.5, 0.5, '#7fb4a8'))],
    legs: bare,
    shoe: shoeIn('#1f4a52', '#123138'),
  },
  // A celestial gown: pale gold with the sun worked on the breast and its rays along the hem.
  celestial: {
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = DRESSP.map(([x, y]) => (y > 36 ? [x + sw * (y - 36) * 0.24, y] : [x, y]));
      return [T(pts, CLOTH.sunlit),
        F(T([[10.4, 26.8], [13.2, 26.6], [10 + sw * 1.9, 44], [7.4 + sw * 1.9, 44]], '#fff2cc')),
        ...folds(m, '#cfae64', '#fff2cc', { top: 36, len: 7.4, spread: 3.6, xs: [11.4, 14.6, 17.8, 21] }),
        // Rays, standing up from the hem.
        ...Array.from({ length: 9 }, (_, i) => F(T([[6 + sw * 1.9 + i * 2.2, 43.8], [7.6 + sw * 1.9 + i * 2.2, 43.8], [6.8 + sw * 1.9 + i * 2.2, 39.8 - (i % 2) * 1.4]], GOLDEN))),
        // The sun.
        ...Array.from({ length: 10 }, (_, i) => F(limb(15.6, 31.4, 15.6 + Math.cos((i / 10) * Math.PI * 2) * 4.2, 31.4 + Math.sin((i / 10) * Math.PI * 2) * 3.4, 0.8, 0.22, GOLDEN))),
        F(E(15.6, 31.4, 1.9, 1.8, GOLDEN)), F(E(15.6, 31.4, 1.2, 1.1, '#fff6dc')),
        F(R(9, 33.8, 13.6, 1.5, GOLDEN)), F(R(9, 33.8, 13.6, 0.4, '#f6e4b0')),
        F(T([[11.4, 26.2], [20, 26.2], [20.2, 27.6], [11.2, 27.6]], GOLDEN))];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.7, 2.4, side > 0 ? CLOTH.sunlit : '#cfae64'), ...braid(-2.7, 1.6, 5.4, 0.45)],
    legs: bare,
    shoe: shoeIn('#fff2cc', '#b08a3a'),
  },
  // A demon queen's gown: black silk shot with blood red, a high standing collar, and flame
  // climbing the hem.
  demonqueen: {
    top: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const pts = [...TORSO.slice(0, 6), [22.4, 35.4], [26.4 + sw * 1.8, 44], [4.8 + sw * 1.8, 44], [8.8, 35.4], ...TORSO.slice(8)];
      return [T(pts, '#1e1620'),
        F(T([[10.4, 26.8], [13.2, 26.6], [8.4 + sw * 1.8, 44], [4.9 + sw * 1.8, 44]], '#3a2a34')),
        ...folds(m, '#120d14', '#4a3642', { top: 35.8, len: 7.8, spread: 4.8, xs: [11.4, 14.6, 17.8, 21] }),
        // Flame, licking up out of the hem.
        ...Array.from({ length: 9 }, (_, i) => F(T([[5 + sw * 1.8 + i * 2.4, 44], [7.4 + sw * 1.8 + i * 2.4, 44], [6.2 + sw * 1.8 + i * 2.4, 38.4 - (i % 2) * 1.8]], CLOTH.demon))),
        ...Array.from({ length: 9 }, (_, i) => F(T([[5.6 + sw * 1.8 + i * 2.4, 44], [6.8 + sw * 1.8 + i * 2.4, 44], [6.2 + sw * 1.8 + i * 2.4, 40.4 - (i % 2) * 1.6]], '#d8304a'))),
        // The bodice: a sweetheart line, red seams and a stone at the heart.
        F(T([[11.4, 26.2], [20, 26.2], [20.2, 28.6], [15.6, 30], [11.2, 28.6]], '#120d14')),
        ...[12.8, 18.4].map((x) => F(limb(x, 28.8, x + (x - MID) * 0.1, 34.8, 0.3, 0.3, '#8a1830'))),
        ...gem(15.6, 32.4, 1.5, '#e0485e'),
        F(R(9, 33.8, 13.6, 1.6, '#8a1830')), F(R(9, 33.8, 13.6, 0.4, '#d8304a')),
        // The collar, standing high behind her head.
        F(R(9, 35.4, 13.6, 0.4, '#8a1830'))];
    },
    sleeve: (p) => p.skin,
    shoulder: (p, side) => [E(0, 1, 2.7, 2.4, side > 0 ? '#1e1620' : '#120d14'), F(limb(-2.2, -0.4, 2.2, -0.4, 0.55, 0.55, side > 0 ? '#8a1830' : '#5e1020'))],
    // Her train, dragging behind her: it is what gives a queen her presence.
    back: (p, m) => {
      const sw = (m?.sway ?? 0) * 1;
      return [T([[10.4, 33.6], [20.8, 33.6], [16.8 + sw, 45.4], [3.6 + sw, 44.4], [6 + sw, 37.4]], '#1e1620'),
        F(T([[10.4, 33.6], [12.8, 33.6], [7 + sw, 44.6], [3.7 + sw, 44.4]], '#3a2a34')),
        ...Array.from({ length: 5 }, (_, i) => F(T([[4.4 + sw + i * 2.8, 44.2], [6.8 + sw + i * 2.8, 44.4], [5.6 + sw + i * 2.8, 40.4]], '#8a1830'))),
        F(T([[3.6 + sw, 44.4], [16.8 + sw, 45.4], [16.6 + sw, 46.2], [3.4 + sw, 45.2]], '#d8304a'))];
    },
    legs: bare,
    shoe: (p, k, tint) => [k.sole(tint('#120d14')), k.poly([[-2.8, -1.4], [2.9, -1.4], [3.1, 1.8], [-2.9, 1.8]], tint('#1e1620')),
      k.poly([[-2.8, -1.4], [2.9, -1.4], [2.95, -0.8], [-2.85, -0.8]], tint('#8a1830'))],
  },
};

// ---------- Accessories ----------
export const WARDROBE_ACC = {
  // A knitted scarf, wound low enough to show under the hair, one end trailing and swinging.
  scarf: {
    front: (p, m) => {
      const s = (m?.sway ?? 0) * 0.45;
      // Wound round the neck, where the hair all but covers it, then knotted at the near shoulder
      // with one long end hanging down the side: that end is the whole of it anyone sees, so it is
      // what swings a beat behind her.
      return [T([[10.6, 28.6], [20.6, 28.6], [21, 32.2], [10.2, 32.2]], '#d9584f'),
        F(R(10.3, 28.7, 10.5, 0.6, '#f0968c')), F(R(10.3, 31.6, 10.6, 0.5, '#b43c36')),
        ...ribs(10.5, 20.8, 29.3, 2.3, '#c14a42', 1.2),
        // The knot.
        F(E(19.4, 32.2, 1.5, 1.2, '#c14a42')), F(E(19.2, 31.9, 0.8, 0.5, '#f0968c')),
        // The end, down the near side.
        T([[18.4, 32], [21.4, 32], [21.8 + s, 40.6], [19 + s, 40.6]], '#d9584f'),
        F(T([[18.4, 32], [19.4, 32], [20 + s, 40.6], [19 + s, 40.6]], '#f0968c')),
        ...ribs(19.2 + s * 0.6, 21.6 + s * 0.6, 35, 0.9, '#c14a42', 1.1),
        ...ribs(19.1 + s * 0.9, 21.7 + s * 0.9, 38.2, 0.9, '#c14a42', 1.1),
        // Its fringe, at the very end.
        ...[0, 1, 2].map((i) => F(R(19.2 + s + i * 0.9, 40.5, 0.5, 1.3, '#b43c36')))];
    },
  },
  // A bow pinned in the hair, over the near side of the head.
  hairbow: {
    hat: () => [T([[21.4, 8.8], [25.8, 6], [26, 11.4], [21.8, 11]], '#e8607a'), T([[21.4, 8.8], [17.4, 6.2], [17, 11.4], [21, 11]], '#d0445e'),
      F(T([[22.2, 7.3], [25.2, 6.5], [25.3, 8.1], [22.4, 8.9]], '#ff93a4')),
      F(E(21.4, 8.9, 1.2, 1.2, '#ffffff')), F(E(21.4, 8.9, 0.65, 0.65, '#ffd0d8'))],
  },
  // A satchel on the back, its strap across the chest.
  satchel: {
    back: (p, m) => {
      const s = (m?.sway ?? 0) * 0.4;
      return [T([[5 + s, 29.2], [10.6, 28.8], [10.8, 36.6], [5.2 + s, 37]], '#9a7050'),
        F(T([[5 + s, 29.2], [10.6, 28.8], [10.7, 31.4], [5.1 + s, 31.8]], '#b88a66')),
        F(T([[5 + s, 29.2], [6.6 + s, 29.1], [6.7 + s, 36.9], [5.2 + s, 37]], '#c29a76')),
        F(E(7.6 + s * 0.6, 32.6, 1.1, 0.85, '#e8c470')), F(E(7.6 + s * 0.6, 32.4, 0.55, 0.4, '#fff0c0'))];
    },
    front: () => [F(limb(10.8, 29.2, 18.8, 34.8, 0.7, 0.7, '#9a7050')), F(limb(10.8, 28.9, 18.8, 34.5, 0.22, 0.22, '#c29a76'))],
  },
  // Wrist bands, one on each paw.
  bands: {
    hand: (p, hx, hy) => [E(hx, hy, 2, 2, p.skin), F(E(hx, hy - 1.5, 1.8, 0.9, '#d9584f')), F(E(hx, hy - 1.7, 1.5, 0.45, '#f0968c'))],
  },
  // A soft cloth cap, pulled down over the crown with its brim out over the face.
  cap: {
    hat: () => [T([...arc(15.5, 7.6, 12, 9.6, 8, 172), [3.6, 8.4], [27.4, 8.4]], '#7f8aa0'),
      F(T([...arc(15.5, 7.6, 12, 9.6, 98, 166), ...arc(15.5, 8, 10, 7.6, 164, 100)], '#9aa6bc')),
      F(T([[21.4, 6.6], [28.2, 7.6], [28, 9.2], [21.6, 8.8]], '#6b7488')),
      F(T([[21.4, 6.6], [28.2, 7.6], [28.1, 8.2], [21.5, 7.4]], '#8c97ac')),
      F(E(15.5, -1.4, 1.1, 0.8, '#6b7488'))],
  },
  // A herb pouch on her hip, with sprigs poking out of the top of it.
  pouch: {
    back: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.4;
      return [T([[4.8 + sw, 31.4], [10.4, 31], [10.6, 38.4], [5 + sw, 38.8]], '#8a5f3e'),
        F(T([[4.8 + sw, 31.4], [6.4 + sw, 31.3], [6.6 + sw, 38.7], [5 + sw, 38.8]], '#a8794f')),
        F(T([[4.8 + sw, 31.4], [10.4, 31], [10.5, 33.4], [4.9 + sw, 33.8]], '#6b482e')),
        // The sprigs.
        ...[[6.2, -1], [8, 0.4], [9.6, 1]].flatMap(([x, d]) => [
          F(limb(x + sw * 0.6, 31.6, x + d + sw * 0.6, 27.4, 0.26, 0.2, '#5f7a4a')),
          F(E(x + d * 1.2 + sw * 0.6, 27.2, 0.95, 0.65, '#8fc46e')), F(E(x + d * 0.7 + sw * 0.6, 29.2, 0.8, 0.55, '#6f9a5a'))]),
        F(E(7.8 + sw * 0.6, 35.4, 0.8, 0.6, '#d8c9a4'))];
    },
    front: () => [F(limb(10.6, 31.4, 18.2, 35.4, 0.6, 0.6, '#6b482e')), F(limb(10.6, 31.2, 18.2, 35.2, 0.2, 0.2, '#a8794f'))],
  },

  // ---------- Middling ----------
  // A soft beret, worn on the slant with its stalk on top.
  beret: {
    hat: () => [T([...arc(15.2, 7.4, 10.8, 8.4, 12, 172), [4.5, 9.2], [25.8, 5.8]], '#a2546a'),
      F(T([...arc(15.2, 7.4, 10.8, 8.4, 104, 166), ...arc(15.4, 7.8, 8.8, 6.4, 164, 106)], '#bd6c82')),
      // It slips down over the near side, and its stalk stands on top.
      F(E(24, 5.6, 3, 2.1, '#8c4458')), F(E(24.4, 5, 1.4, 0.8, '#a2546a')),
      F(limb(15.2, -0.6, 15.4, -2.4, 0.9, 0.7, '#8c4458')), F(E(15.4, -2.6, 0.9, 0.8, '#bd6c82'))],
  },
  // A short wool capelet buttoned at the throat, its hem swinging with her.
  capelet: {
    front: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      return [T([[9.6, 25.9], [21.6, 25.9], [25.2 + s, 37.4], [6 + s, 37.4]], '#c4713f'),
        F(T([[9.6, 25.9], [12.4, 25.9], [8.8 + s, 37.4], [6.1 + s, 37.4]], '#dd9158')),
        ...crease(20.2, 29, 23.4 + s, 36.4, 0.9, '#9a5128', '#e8a870'),
        ...crease(12.2, 29.6, 10.2 + s, 36.4, 0.7, '#9a5128', '#e8a870'),
        ...ribs(6.4 + s, 24.8 + s, 34.4, 2.2, '#a85c30', 1.6),
        ...lace(6.1 + s, 25.1 + s, 37.2, '#f6e8d4', 2.1),
        F(R(6.1 + s, 36.2, 19, 0.6, '#9a5128')),
        F(E(15.6, 26.8, 1.1, 1.1, '#e8c470')), F(E(15.4, 26.5, 0.5, 0.3, '#f6e4b0'))];
    },
    back: (p, m) => {
      const s = (m?.sway ?? 0) * 0.5;
      return [T([[9.2, 25.6], [22, 25.6], [26.4 + s, 38.6], [4.8 + s, 38.6]], '#9a5128')];
    },
  },
  // A cluster of little flowers, pinned at the side of the head.
  flowerpin: {
    hat: () => [...[[21.8, 8.6, 1.5, '#f2f0ff'], [24.4, 10.4, 1.2, '#ffd6e4'], [20.2, 11.4, 1.1, '#fff0c8']].flatMap(([x, y, r, c]) => [
      ...Array.from({ length: 5 }, (_, i) => F(E(x + Math.cos((i / 5) * Math.PI * 2) * r, y + Math.sin((i / 5) * Math.PI * 2) * r, r * 0.62, r * 0.62, c))),
      F(E(x, y, r * 0.44, r * 0.44, '#f2b05c'))]),
      F(limb(19.4, 12.6, 22.4, 10.4, 0.35, 0.3, '#7fae7f')), F(T([[20.2, 13.4], [18.2, 14.6], [19, 12.4]], '#7fae7f'))],
  },
  // Knitted mittens, one on each paw, with a ribbed cuff.
  mittens: {
    hand: (p, hx, hy) => [E(hx, hy + 0.2, 2.3, 2.3, '#cf6f6a'), F(E(hx - 0.4, hy - 0.3, 1.1, 0.9, '#e89a92')),
      F(E(hx, hy - 1.7, 1.9, 0.9, '#f2e8d8')), F(E(hx, hy - 1.9, 1.6, 0.45, '#ffffff'))],
  },
  // A little festival drum, slung on her back on a cord.
  drum: {
    back: (p, m) => {
      const s = (m?.sway ?? 0) * 0.4;
      return [E(7.4 + s, 32.8, 4.2, 4.2, '#b4523c'),
        F(E(7.4 + s, 32.8, 3.1, 3.5, '#f2e4cc')), F(E(6.6 + s, 31.6, 1.1, 0.9, '#ffffff')),
        ...Array.from({ length: 6 }, (_, i) => F(limb(7.4 + s + Math.cos((i / 6) * Math.PI * 2) * 3.4, 32.8 + Math.sin((i / 6) * Math.PI * 2) * 3.8, 7.4 + s + Math.cos((i / 6) * Math.PI * 2) * 4.1, 32.8 + Math.sin((i / 6) * Math.PI * 2) * 4.5, 0.4, 0.4, '#e8c470'))),
        F(limb(9.8 + s, 30, 11.6, 27.4, 0.45, 0.45, '#cf4a4a'))];
    },
    front: () => [F(limb(11.6, 27.4, 18.2, 33.4, 0.5, 0.5, '#cf4a4a')), F(limb(11.6, 27.2, 18.2, 33.2, 0.18, 0.18, '#ec8a7a'))],
  },
  // A traveller's hood, pulled up: the cowl over the head with her face in the opening, and the
  // hair tucked away under it.
  hood: {
    tucks: true,
    hat: () => [T([...arc(15.5, 12.6, 14.2, 13.4, -42, 222), ...arc(15.5, 16.2, 9.9, 9.1, 222, -42)], CLOTH.forest),
      F(T([...arc(15.5, 16.2, 10.9, 10.1, -40, 220), ...arc(15.5, 16.2, 9.9, 9.1, 220, -40)], shade(CLOTH.forest, 18))),
      // A point at the crown, and the drawstring at the throat.
      F(T([[13.4, 0.4], [18.4, 0.8], [17.4, -4.4]], shade(CLOTH.forest, -14))), F(E(17.4, -4.8, 0.9, 0.9, '#d8c9a4')),
      F(E(6.2, 10.4, 2.4, 1.4, shade(CLOTH.forest, 14))),
      F(limb(9.4, 24.4, 21.6, 24.4, 0.45, 0.45, '#d8c9a4')), F(E(15.5, 24.6, 0.9, 0.6, '#c2b183'))],
    hatBack: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.3;
      return [E(15.5, 12.8, 14, 13.2, shade(CLOTH.forest, -14)),
        T([[4.2, 18.6], [26.8, 18.6], [24.2 + sw, 26.4], [15.5 + sw, 28], [6.8 + sw, 26.4]], shade(CLOTH.forest, -18))];
    },
  },

  // ---------- Fine ----------
  // A fine silver circlet, low on the brow, with a blue stone at its centre.
  circlet: {
    hat: () => [F(T([...arc(15.5, 15, 12.6, 9.4, 22, 158), ...arc(15.5, 15, 11.6, 8.2, 156, 24)], '#b4c0d8')),
      F(T([...arc(15.5, 15, 12.6, 9.4, 94, 152), ...arc(15.5, 15, 11.9, 8.6, 150, 96)], '#f2f6ff')),
      ...[46, 74, 106, 134].map((a) => F(E(15.5 + Math.cos((a * Math.PI) / 180) * 12.1, 15 - Math.sin((a * Math.PI) / 180) * 8.8, 0.5, 0.5, '#eef2ff'))),
      ...gem(15.5, 5.6, 1.5, '#6fb8e8')],
  },
  // A cape of long feathers, lapped over one another down her back.
  feathercape: {
    back: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.6;
      return [T([[8.4, 25.4], [22.8, 25.4], [26.4 + sw, 34], [4.8 + sw, 34]], '#8a7f9c'),
        ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => F(T([[3.4 + sw + i * 3.1, 32.4], [7.4 + sw + i * 3.1, 32.4], [5.4 + sw + i * 3.1, 40.4]], i % 2 ? '#a89cbc' : '#8a7f9c'))),
        ...[0, 1, 2, 3, 4, 5, 6].map((i) => F(T([[5 + sw * 1.3 + i * 3.1, 36.6], [9 + sw * 1.3 + i * 3.1, 36.6], [7 + sw * 1.3 + i * 3.1, 45.4]], i % 2 ? '#c0b4d4' : '#a89cbc'))),
        ...[0, 1, 2, 3, 4, 5, 6].map((i) => F(limb(7 + sw * 1.3 + i * 3.1, 37, 7 + sw * 1.3 + i * 3.1, 44.2, 0.26, 0.26, '#efe8f6'))),
        F(T([[8.4, 25.4], [11.4, 25.4], [8.4 + sw, 34], [4.9 + sw, 34]], '#b4a8c8')),
        F(E(15.6, 26.4, 1.3, 1.2, '#e8c470')), F(E(15.4, 26.1, 0.6, 0.35, '#f6e4b0'))];
    },
  },
  // Long gloves, up past the elbow, with a cuff turned back at the top.
  gloves: {
    hand: (p, hx, hy) => [E(hx, hy, 2.1, 2.1, '#f2ead8'), F(E(hx - 0.4, hy - 0.5, 1, 0.8, '#fffaf0')),
      F(E(hx, hy - 1.7, 1.9, 1, '#f2ead8')), F(E(hx, hy - 2, 1.7, 0.6, '#e8c470'))],
  },
  // A spell tome on her back, clasped shut, with a ribbon marking her place.
  tome: {
    back: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.35;
      return [T([[5.6 + sw, 29.4], [10.8, 29], [11, 37.4], [5.8 + sw, 37.8]], '#6b3a44'),
        F(T([[5.6 + sw, 29.4], [7.2 + sw, 29.3], [7.4 + sw, 37.7], [5.8 + sw, 37.8]], '#8a4e5a')),
        F(T([[7.4 + sw, 29.3], [10.8, 29], [10.9, 30], [7.5 + sw, 30.3]], '#f2ead8')),
        F(T([[7.4 + sw, 36.6], [10.9, 36.4], [11, 37.4], [7.5 + sw, 37.7]], '#f2ead8')),
        ...braid(7.6 + sw, 32.6, 3.2, 0.5), star(9.2 + sw, 33.4, 1.3, '#e8c470'),
        F(limb(9.6 + sw, 37.4, 8.6 + sw, 41.4, 0.5, 0.35, '#cf4a4a')),
        F(limb(10.6, 29.6, 17.4, 34.6, 0.5, 0.5, '#4a2a32'))];
    },
    front: () => [F(limb(10.8, 29.4, 18.4, 34.8, 0.6, 0.6, '#4a2a32')), F(limb(10.8, 29.2, 18.4, 34.6, 0.2, 0.2, '#8a4e5a'))],
  },
  // A lace veil, pinned with a comb and falling behind her.
  veil: {
    hat: () => [F(T([[18.4, 4.4], [23.6, 3], [23.8, 4.8], [18.6, 6]], '#e8dcea')),
      ...[0, 1, 2, 3].map((i) => F(limb(19.4 + i * 1.3, 5.6, 19.4 + i * 1.3, 7.6, 0.35, 0.25, '#e8dcea'))),
      ...[[21, 3.4, 1.1], [23.4, 4.6, 0.9]].flatMap(([x, y, r]) => Array.from({ length: 5 }, (_, i) => F(E(x + Math.cos((i / 5) * Math.PI * 2) * r, y + Math.sin((i / 5) * Math.PI * 2) * r, r * 0.6, r * 0.6, '#ffffff'))))],
    back: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.8;
      return [F(T([[13.4, 23], [18.2, 23], [27.6 + sw, 38.4], [25.4 + sw, 44.4], [5.4 + sw, 44.4], [3.6 + sw, 38.4]], '#efe9f4')),
        F(T([[13.4, 23], [15, 23], [7.4 + sw, 42], [5.5 + sw, 44.2]], '#fbf8fe')),
        ...lace(5.4 + sw, 25.4 + sw, 44.2, '#ffffff', 2.2),
        ...lace(5.6 + sw, 25.2 + sw, 42.4, '#dcd2e6', 2.2),
        ...[[8, 32], [13, 36], [19.6, 34], [23.4, 39], [11.4, 41], [17.6, 42]].map(([x, y]) => F(E(x + sw * 0.6, y, 0.6, 0.6, '#ffffff')))];
    },
  },
  // A little pair of imp horns, curling up out of the hair.
  horns: {
    hat: () => [...[[7.4, -1], [23.6, 1]].flatMap(([x, d]) => [
      F(T([[x - d * 1.5, 6.4], [x + d * 1.5, 6], [x + d * 2.6, 0.4], [x + d * 0.6, 1.2]], '#5e3246')),
      F(T([[x - d * 1.5, 6.4], [x - d * 0.4, 6.2], [x + d * 1.2, 1], [x + d * 0.6, 1.2]], '#8a4a62')),
      F(E(x + d * 2.4, 0.6, 0.5, 0.5, '#b47a90'))])],
  },

  // ---------- Elite ----------
  // A gold crown, five points with a stone in each, worn on the crown of the head.
  crown: {
    hat: () => [F(T([[5.4, 13.4], [25.6, 13.4], [25.6, 9.4], [22.4, 11.4], [20, 6.4], [15.5, 9.8], [11, 6.4], [8.6, 11.4], [5.4, 9.4]], GOLDEN)),
      F(T([[5.4, 13.4], [25.6, 13.4], [25.6, 11.9], [5.4, 11.9]], '#b08a3a')),
      F(T([[5.4, 12.6], [25.6, 12.6], [25.6, 11.9], [5.4, 11.9]], '#f6e4b0')),
      ...gem(15.5, 11.6, 1.2, '#e0485e'), ...gem(9.4, 12.2, 0.85, '#6fb8e8'), ...gem(21.6, 12.2, 0.85, '#8fe0a8'),
      ...[[20, 5.8], [11, 5.8], [15.5, 9.2]].map(([x, y]) => F(E(x, y, 0.55, 0.55, '#fff6dc')))],
  },
  // A ring of light, standing above her head and turning with her.
  halo: {
    // A ring, not a plate: it is beaded round its path, so the hair shows through the middle of it.
    hat: () => Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2;
      const [x, y] = [15.5 + Math.cos(a) * 8.6, -2.8 + Math.sin(a) * 2.5];
      return [F(E(x, y, 1, 0.85, GOLDEN)), F(E(x, y - 0.3, 0.6, 0.4, '#fff6dc'))];
    }).flat(),
  },
  // Wings of aurora light: two soft plumes each side, rounded like a moth's rather than cut into
  // points. (Her hair covers her to about y 31, so they are set low and carry well outside her.)
  wings: {
    back: (p, m) => {
      const sw = (m?.sway ?? 0) * 0.5;
      const wing = (dir, c1, c2) => {
        const k = dir > 0 ? sw * 0.5 : sw;
        const ox = 15.6 + dir * (8.6 + k * 0.5);
        return [
          // The upper plume, swept back from the shoulder, and the lower one under it.
          F(E(ox, 32.4, 6.4, 7.6, c1)), F(E(ox + dir * 1.4, 40.6, 5.2, 5.8, c2)),
          F(E(ox - dir * 1, 30.8, 4.2, 4.8, c2)), F(E(ox + dir * 0.6, 39.6, 3.4, 3.6, c1)),
          // Where the light runs along their ribs.
          ...[0, 1, 2].map((i) => F(limb(15.6 + dir * 3.4, 31 + i * 2.2, ox + dir * (5 - i * 0.6), 29.4 + i * 3.4, 0.3, 0.24, '#ffffff'))),
          F(E(ox + dir * 2.6, 30.4, 1.9, 1.4, '#ffffff')), F(E(ox + dir * 3.2, 41.4, 1.5, 1.1, '#ffffff'))];
      };
      return [...wing(-1, CLOTH.aurora1, CLOTH.aurora2), ...wing(1, shade(CLOTH.aurora2, -12), '#c8a8f0'),
        ...[[1.4, 34], [29.8, 35], [4.4, 44], [27, 43]].map(([x, y]) => star(x + sw * 0.6, y, 1, '#ffffff'))];
    },
  },
  // Gilded gauntlets, plated along the back of each paw.
  gauntlets: {
    hand: (p, hx, hy) => [E(hx, hy, 2.2, 2.2, '#b08a3a'), F(E(hx - 0.3, hy - 0.4, 1.3, 1, GOLDEN)),
      F(E(hx, hy - 1.8, 2, 1.1, GOLDEN)), F(E(hx, hy - 2, 1.7, 0.6, '#f6e4b0')),
      ...gem(hx, hy - 0.2, 0.7, '#e0485e')],
  },
  // A star banner on a staff over her shoulder, its cloth streaming out behind and below her,
  // where the hair cannot swallow it.
  starbanner: {
    back: (p, m) => {
      const sw = (m?.sway ?? 0) * 1.1;
      return [F(limb(24.4, 21.4, 3.4, 46.4, 0.9, 0.6, '#8a6a46')), F(limb(24.4, 21.4, 3.4, 46.4, 0.3, 0.22, '#c2a07a')),
        F(E(25.4, 20.2, 1.6, 1.6, GOLDEN)), F(E(25, 19.8, 0.75, 0.5, '#fff6dc')), star(25.4, 20.2, 1, '#fff6dc'),
        T([[19.6, 27], [9.6, 39], [-3.4 + sw, 34.6], [6.6 + sw, 22.4]], CLOTH.midnight),
        F(T([[19.6, 27], [16.6, 25.8], [3.6 + sw, 31.4], [6.6 + sw, 32.8]], shade(CLOTH.midnight, 22))),
        ...[[8.4, 31.4, 1.5], [2.4, 35.4, 1.1], [13.4, 28.4, 0.9]].map(([x, y, r]) => star(x + sw * 0.6, y, r, '#f6e4b0')),
        F(T([[-3.4 + sw, 34.6], [9.6, 39], [9, 40.6], [-4.2 + sw, 36]], GOLDEN))];
    },
  },
  // Dragon horns: great ridged horns swept back from the temples, each ringed with gold.
  dragonhorns: {
    hat: () => [...[[6.6, -1], [24.4, 1]].flatMap(([x, d]) => [
      F(T([[x - d * 2.6, 8.8], [x + d * 2.4, 7], [x + d * 6.6, 1.8], [x + d * 9.4, -6.4], [x + d * 5.6, -0.8], [x + d * 0.8, 4.4]], '#4a3d44')),
      F(T([[x - d * 2.6, 8.8], [x - d * 0.6, 8.2], [x + d * 3.6, 2.6], [x + d * 7.6, -4.4], [x + d * 9.4, -6.4], [x + d * 5.6, -0.8]], '#6d5c66')),
      // Ridges up the outside of it, and a gold ring round the root.
      ...[0, 1, 2, 3].map((i) => F(limb(x + d * (0.4 + i * 1.7), 6.2 - i * 1.9, x + d * (2.8 + i * 1.7), 4.6 - i * 1.9, 0.5, 0.5, '#8f7b86'))),
      F(limb(x - d * 2.2, 7.4, x + d * 2.6, 5.8, 1.5, 1.5, '#b08a3a')), F(limb(x - d * 2.2, 7, x + d * 2.6, 5.4, 0.6, 0.6, '#f6e4b0')),
      F(E(x + d * 9, -6, 0.6, 0.6, '#b8a8b0'))])],
  },
};

// ---------- Putting an outfit together ----------
// The slots a worn set fills, built once for each set and then kept: a top brings its own body and
// sleeves, a bottom its legs, skirt and shoes, a dress all of it, and an accessory lies over the
// top. Anything none of them fills falls back to the plain smock the Mochi was born in.
const BUILT = new Map();
export function wardrobeOutfit(key, fallback) {
  if (BUILT.has(key)) return BUILT.get(key);
  const wear = wearOf(key);
  if (!wear) return fallback;
  const out = { ...fallback };
  const take = (piece) => {
    if (!piece) return;
    for (const slot of ['top', 'sleeve', 'shoulder', 'legs', 'skirt', 'shoe', 'hat', 'hatBack', 'back', 'front', 'hand', 'long', 'tucks', 'hidesBangs']) {
      if (piece[slot] !== undefined) out[slot] = piece[slot];
    }
  };
  if (wear.dress) take(WARDROBE_DRESSES[wear.dress]);
  else {
    take(WARDROBE_TOPS[wear.top]);
    take(WARDROBE_BOTTOMS[wear.bottom]);
  }
  // (A top and a bottom each bring their own `front` piece - a bib, a strap - so both are drawn.)
  if (!wear.dress && WARDROBE_TOPS[wear.top]?.front && WARDROBE_BOTTOMS[wear.bottom]?.front) {
    const a = WARDROBE_TOPS[wear.top].front;
    const b = WARDROBE_BOTTOMS[wear.bottom].front;
    out.front = (...args) => [...(a(...args) ?? []), ...(b(...args) ?? [])];
  }
  // (An accessory never takes a slot the clothes already fill, except its own: a scarf lies in
  // front, a satchel behind, a bow on the head, bands on the paws.)
  const acc = WARDROBE_ACC[wear.acc];
  if (acc) {
    const under = { front: out.front, back: out.back };
    for (const slot of ['hat', 'hatBack', 'back', 'front', 'hand']) if (acc[slot]) out[slot] = acc[slot];
    // (A hood tucks the hair away under it, as the Mochi hoods do.)
    for (const slot of ['tucks', 'hidesBangs']) if (acc[slot] !== undefined) out[slot] = acc[slot];
    // Both the clothes' own piece and the accessory's, where they would clash.
    for (const slot of ['front', 'back']) {
      if (acc[slot] && under[slot]) {
        const a = under[slot];
        const b = acc[slot];
        out[slot] = (...args) => [...(a(...args) ?? []), ...(b(...args) ?? [])];
      }
    }
  }
  // (The renderer only asks an outfit for its front piece when it has a back one as well - that is
  // how capes are hung - so anything with straps or a scarf and nothing behind it gets an empty back.)
  if (out.front && !out.back) out.back = () => [];
  BUILT.set(key, out);
  return out;
}
export const WARDROBE_IDS = { tops: Object.keys(TOPS), bottoms: Object.keys(BOTTOMS), dresses: Object.keys(DRESSES), acc: Object.keys(ACCESSORIES) };
