// Casual and swim outfits: everyday modern clothes and cute, modest beachwear. `t` is the entry's
// index in data/outfits-casual.js; each slot looks the entry up by key, so a full-body piece
// (an idol outfit, a one-piece) answers for every slot it covers with the same index.
// Skirts, scarf ends, towels, and ribbons swing with m.sway; pompoms and cat ears follow m.hair.

import { R, E, T, F, shade } from '../pixel.js';
import { torsoPts, band, side, MID, tieBow, button, limb, mirrorX } from '../figure.js';
import { CASUAL_LOOKS } from '../../data/outfits-casual.js';

const WHITE = '#ffffff';
const INK = '#3a2d4f';
const SHIRT = '#fff6ec';
const GOLD = '#ffd66b';
const RED = '#e5485f';
const FUR = '#f6ecdc';

const keyOf = (t) => CASUAL_LOOKS[t]?.key;
const rad = (d) => (d * Math.PI) / 180;
const ring = (n, f) => Array.from({ length: n }, (_, i) => f(i));
const lerp = (a, b, u) => a + (b - a) * u;
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255;
};
// White details turn to the second cloth on white pieces so they still show.
const pale = (p) => (lum(p.main) > 0.85 ? p.second : WHITE);

// ---------- Shape helpers ----------

// A band along an ellipse from angle a0 to a1 (degrees; 0 = right, 90 = down), from the outer
// radii (rx, ry) in to the inner ones (ix, iy).
function hoop(cx, cy, rx, ry, ix, iy, c, a0 = 0, a1 = 360, n = 18) {
  const pt = (x, y, a) => [cx + Math.cos(rad(a)) * x, cy + Math.sin(rad(a)) * y];
  return T([...ring(n + 1, (i) => pt(rx, ry, lerp(a0, a1, i / n))), ...ring(n + 1, (i) => pt(ix, iy, lerp(a1, a0, i / n)))], c);
}
// The top half of an ellipse, closed along its base (cap crowns, beanies).
const dome = (cx, cy, rx, ry, c) => T(ring(15, (i) => [cx - Math.cos((i * Math.PI) / 14) * rx, cy - Math.sin((i * Math.PI) / 14) * ry]), c);
const heart = (cx, cy, r, c) => T(ring(18, (i) => {
  const a = (i / 18) * Math.PI * 2;
  return [cx + r * Math.sin(a) ** 3, cy - (r * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))) / 16];
}), c);
const flower = (cx, cy, r, c, mid = GOLD) => [T(ring(20, (i) => {
  const a = (i / 20) * Math.PI * 2;
  const rr = r * (0.55 + 0.45 * Math.abs(Math.cos(a * 2.5)));
  return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
}), c), F(E(cx, cy, r * 0.32, r * 0.32, mid))];
const diamond = (x, y, w, h, c) => T([[x, y - h], [x + w, y], [x, y + h], [x - w, y]], c);
const dots = (list, r, c) => list.map(([x, y]) => F(E(x, y, r, r, c)));
// A ruffle: from its top edge (x0..x1 at y0) down to a scalloped hem (x2..x3 at y1) of n bumps.
function frill(x0, x1, y0, x2, x3, y1, n, d, c) {
  const hem = ring(n * 4 + 1, (i) => {
    const u = i / (n * 4);
    return [lerp(x3, x2, u), y1 - d + d * Math.abs(Math.sin(Math.PI * n * u))];
  });
  return T([[x0, y0], [x1, y0], ...hem], c);
}
// A skirt from the waist to `len`, flaring `fl` past the hips, its hem swung by sw.
const skirtPts = (len, fl, sw) => [[10, 34.2], [21.2, 34.2], [21.2 + fl + sw, len], [10 - fl + sw, len]];
const pleats = (len, fl, sw, c, xs = [12.2, 14.6, 17, 19.4]) => xs.map((x) => F(limb(x, 35.6, x + (x - MID) * (fl / 6) + sw, len - 0.4, 0.5, 0.7, c)));
const skirtFrill = (len, fl, sw, n, c) => frill(10, 21.2, 34.2, 10 - fl + sw, 21.2 + fl + sw, len, n, 0.9, c);

// ---------- Tops ----------

const TORSO = torsoPts();
const hem = (c, y = 34.4) => band(TORSO, y, 35.8, c);
const crew = (c) => F(E(MID, 26.4, 2.8, 1.3, c));

const TOPS = {
  tee: (p) => [T(TORSO, p.main), crew(p.dark), heart(MID, 30.8, 2.6, pale(p)), F(E(19.4, 28.4, 0.6, 0.6, pale(p))), F(E(11.8, 33, 0.5, 0.5, pale(p))), hem(p.dark, 34.8)],
  stripes: (p) => [T(TORSO, p.main), ...[28.2, 30.6, 33].map((y) => band(TORSO, y, y + 1.2, pale(p))), F(E(MID, 26.3, 3.6, 1, pale(p))), hem(p.dark, 34.8)],
  cardigan: (p) => [T(TORSO, pale(p) === WHITE ? SHIRT : p.second), F(E(MID, 26.4, 2.2, 0.9, '#ffd6e2')), side(TORSO, MID - 1.2, -1, p.main), side(TORSO, MID + 1.2, 1, p.main),
    hem(p.dark, 34.2), ...[29, 31, 33].map((y) => button(MID + 1.8, y, pale(p))), heart(11.8, 32.4, 1.2, p.dark)],
  varsity: (p) => [T(TORSO, p.main), T([[11, 25.6], [20.2, 25.6], [19.8, 27.4], [11.4, 27.4]], p.deep), F(R(11.4, 26.4, 8.4, 0.5, pale(p))),
    hem(p.deep, 34.2), F(R(9.8, 34.9, 11.8, 0.5, pale(p))), ...[29, 31, 33].map((y) => F(E(MID, y, 0.55, 0.55, pale(p)))),
    R(10.8, 28.6, 3.8, 1.3, pale(p)), R(12.05, 28.6, 1.3, 4.4, pale(p))],
  flannel: (p) => [T(TORSO, p.main), F(R(11.2, 26.8, 1.2, 9, p.dark)), F(R(18.8, 26.8, 1.2, 9, p.dark)), F(R(9.6, 29.4, 12, 1, p.dark)), F(R(9.6, 32.6, 12, 1, p.dark)), F(R(9.6, 31, 12, 0.4, p.light)),
    T([[MID - 1.6, 26.2], [MID + 1.6, 26.2], [MID + 1.6, 35.8], [MID - 1.6, 35.8]], SHIRT), heart(MID, 30.4, 1, p.main),
    T([[MID - 1.6, 25.8], [MID - 4.6, 26], [MID - 2.4, 29.2]], p.light), T([[MID + 1.6, 25.8], [MID + 4.6, 26], [MID + 2.4, 29.2]], p.light)],
  track: (p) => [T(TORSO, p.main), F(R(10.2, 27.6, 1.1, 8.2, pale(p))), F(R(20.2, 27.6, 1.1, 8.2, pale(p))), T([[11.6, 24.8], [19.6, 24.8], [20, 27.2], [11.2, 27.2]], p.dark),
    F(R(11.4, 26.2, 8.4, 0.5, pale(p))), F(R(MID - 0.3, 27.2, 0.6, 8.6, p.light)), F(E(MID, 28.4, 0.6, 0.8, GOLD)), hem(p.dark)],
  sweatervest: (p) => [T(TORSO, p.main), T([[MID - 3.2, 26], [MID + 3.2, 26], [MID, 31.4]], SHIRT), F(limb(MID - 3.2, 26.2, MID, 31.4, 0.8, 0.8, p.dark)), F(limb(MID + 3.2, 26.2, MID, 31.4, 0.8, 0.8, p.dark)),
    T([[MID - 3, 25.8], [MID - 0.2, 26.4], [MID - 2.2, 28.4]], WHITE), T([[MID + 3, 25.8], [MID + 0.2, 26.4], [MID + 2.2, 28.4]], WHITE),
    T([[MID - 0.7, 26.8], [MID + 0.7, 26.8], [MID + 1, 30], [MID, 31], [MID - 1, 30]], '#4a5a9a'),
    diamond(11.8, 31.8, 1.4, 1.8, p.dark), diamond(19.4, 31.8, 1.4, 1.8, p.dark), diamond(MID, 33.2, 1.2, 1.4, p.light), hem(p.dark, 34.2)],
  parka: (p) => [T(TORSO, p.main), F(R(9.6, 29.8, 12, 0.6, p.dark)), F(R(9.6, 32.6, 12, 0.6, p.dark)), F(R(MID - 0.3, 27, 0.6, 9, p.dark)),
    R(10.2, 33, 3, 2, p.dark), R(18, 33, 3, 2, p.dark), E(MID, 26.6, 6.4, 2.2, FUR), E(MID - 4.2, 27.4, 2.6, 1.7, FUR), E(MID + 4.2, 27.4, 2.6, 1.7, FUR), hem(p.dark, 34.8)],
  raincoat: (p) => [T(TORSO, p.main), T([[10.6, 25.2], [20.6, 25.2], [21.4, 27.4], [MID, 28.4], [9.8, 27.4]], p.dark),
    ...[29.6, 31.8, 34].map((y) => F(R(MID - 1.1, y - 0.4, 2.2, 0.8, '#8a5a3c'))), R(10.2, 32.4, 3.4, 1, p.dark), R(17.8, 32.4, 3.4, 1, p.dark),
    E(18.6, 30.2, 1.8, 1.2, pale(p) === WHITE ? '#fff1b0' : p.second), E(19.8, 29, 1.1, 1.1, pale(p) === WHITE ? '#fff1b0' : p.second), F(T([[20.6, 28.8], [21.8, 29.2], [20.6, 29.6]], '#ff9b3b')), F(E(20, 28.8, 0.3, 0.3, INK)), hem(p.dark)],
  idol: (p) => [T(TORSO, p.main), band(TORSO, 33.2, 34.8, p.dark), frill(10.4, 20.8, 25.6, 9.8, 21.4, 28.4, 5, 0.8, pale(p)),
    T([[MID, 30], [MID - 3.4, 28.2], [MID - 3, 31.6]], p.second), T([[MID, 30], [MID + 3.4, 28.2], [MID + 3, 31.6]], p.second),
    T([[MID - 0.6, 30.2], [MID - 1.8, 33.6], [MID - 0.6, 33]], p.second), T([[MID + 0.6, 30.2], [MID + 1.8, 33.6], [MID + 0.6, 33]], p.second),
    F(E(MID, 30, 1, 1, GOLD)), F(E(MID - 0.3, 29.7, 0.35, 0.35, WHITE)), F(E(11.4, 31.8, 0.5, 0.5, pale(p))), F(E(19.8, 31.6, 0.5, 0.5, pale(p)))],
  chef: (p) => [T(TORSO, p.main), R(11.4, 24.8, 8.4, 2.2, p.light), T([[MID - 2.2, 25.8], [MID + 2.2, 25.8], [MID, 28.8]], RED),
    F(R(MID + 0.6, 27.6, 0.5, 8.2, p.dark)), ...[29.4, 31.6, 33.8].flatMap((y) => [button(MID - 1.6, y, p.deep), button(MID + 2.8, y, p.deep)]),
    F(R(18.6, 27.8, 0.6, 2, '#5f7fd8')), hem(p.dark)],
  sailor: (p) => [T(TORSO, WHITE), T([[9.6, 25.4], [21.6, 25.4], [22, 29], [MID, 32.6], [9.2, 29]], p.main), T([[MID - 2.4, 25.6], [MID + 2.4, 25.6], [MID, 30]], WHITE),
    F(limb(9.8, 28.4, MID, 31.6, 0.5, 0.5, WHITE)), F(limb(21.4, 28.4, MID, 31.6, 0.5, 0.5, WHITE)),
    T([[MID - 0.6, 31], [MID - 1.8, 34.6], [MID - 0.2, 34]], RED), T([[MID + 0.6, 31], [MID + 1.8, 34.6], [MID + 0.2, 34]], RED), ...tieBow(MID, 31, RED), hem(p.main, 34.6)],
  pinafore: (p) => [T(TORSO, SHIRT), ...[27.6, 30, 32.4].map((y) => band(TORSO, y, y + 0.8, '#ff9ec0')),
    T([[MID - 3.4, 29.6], [MID + 3.4, 29.6], [MID + 4.2, 35.8], [MID - 4.2, 35.8]], p.main), R(MID - 4.4, 25.8, 1.4, 4.4, p.main), R(MID + 3, 25.8, 1.4, 4.4, p.main),
    button(MID - 3.4, 30.4, GOLD), button(MID + 3.4, 30.4, GOLD), R(MID - 1.6, 31.4, 3.2, 2.4, p.dark), heart(MID, 32.4, 0.9, pale(p))],
  // Swim tops cover the whole torso: frills, tiers, and stripes say "swimsuit".
  onepiece: (p) => [T(TORSO, p.main), ...dots([[11.6, 31], [19.6, 30.6], [MID, 32], [13, 33.4], [18.4, 33.6]], 0.6, pale(p)),
    frill(9.8, 21.6, 26, 9.4, 22, 29.4, 5, 0.9, pale(p)), band(TORSO, 33.6, 34.8, p.dark), ...tieBow(19.6, 34.2, p.dark)],
  bikini: (p) => [T(TORSO, p.main), frill(9.8, 21.6, 30.4, 9, 22.4, 34.6, 6, 0.9, p.light), frill(9.8, 21.6, 26, 9.2, 22.2, 31, 6, 1, p.main),
    ...dots([[12, 28.4], [17, 28], [19.8, 29.4], [13.6, 32.6], [18.6, 32.8]], 0.55, pale(p)), ...tieBow(MID, 26.8, pale(p))],
  dotbikini: (p) => [T(TORSO, p.main), ...dots([[11.6, 28.4], [19.4, 28.2], [13.2, 31.4], [18, 31.6], [11.4, 34], [MID, 33.8], [19.8, 34]], 0.75, pale(p)),
    F(T([[MID - 2.6, 26.2], [MID + 2.6, 26.2], [MID, 28.4]], p.dark)), E(MID, 29.6, 1.2, 1.2, GOLD), F(E(MID, 29.6, 0.55, 0.55, p.main)), frill(9.6, 21.6, 34.6, 9.4, 21.8, 36.6, 6, 0.6, pale(p))],
  tankini: (p) => [T(TORSO, p.main), ...[28.4, 30.8].map((y) => band(TORSO, y, y + 1.1, pale(p))), crew(p.dark),
    frill(9.6, 21.6, 33.4, 8.4, 22.8, 37.6, 5, 0.8, p.main), F(R(9.6, 33.4, 12, 0.6, pale(p))), F(T([[20, 30.8], [21, 30.3], [20.6, 31.8]], RED))],
  rashguard: (p) => [T(TORSO, p.main), side(TORSO, 11.6, -1, p.dark), side(TORSO, 19.6, 1, p.dark),
    T([[9.8, 31.4], [12, 30], [14, 31.2], [16, 30], [18, 31.2], [20, 30], [21.6, 31.2], [21.6, 32.4], [20, 31.2], [18, 32.4], [16, 31.2], [14, 32.4], [12, 31.2], [9.8, 32.6]], pale(p)),
    T([[12.4, 24.8], [18.8, 24.8], [19.2, 27], [12, 27]], p.dark), F(R(MID - 0.3, 25, 0.6, 3.4, pale(p))), hem(p.dark, 34.8)],
};

// Upper-arm colors (the forearm is bare unless longSleeves).
const SLEEVES = { varsity: (p) => pale(p), sweatervest: () => SHIRT, sailor: () => WHITE, pinafore: () => SHIRT, chef: (p) => p.main };
const LONG = new Set(['stripes', 'cardigan', 'varsity', 'flannel', 'track', 'sweatervest', 'parka', 'raincoat', 'chef', 'rashguard']);

// Puffs and ruffles over the shoulder (drawn at the shoulder joint).
const ruffle = (p, c) => [E(0, 0.6, 2.6, 2.2, p.main), frill(-2.6, 2.6, 1.2, -3.2, 3.2, 3.6, 3, 0.6, c)];
const SHOULDERS = {
  idol: (p) => [E(0, 0.4, 3, 2.6, p.main), F(E(-0.6, -0.4, 1.2, 0.8, p.light)), frill(-2.8, 2.8, 2, -3.4, 3.4, 4, 3, 0.6, pale(p))],
  parka: (p) => [E(0, 0.6, 2.8, 2.6, p.main), F(R(-2.6, 1.6, 5.2, 0.5, p.dark))],
  onepiece: (p) => ruffle(p, pale(p)),
  bikini: (p) => ruffle(p, p.light),
  dotbikini: (p) => [E(0, 0.6, 2.4, 2, p.main), ...tieBow(0, 0.2, pale(p))],
};

// ---------- Bottoms ----------

const LEGS = {
  jorts: (p, s) => ({ top: p.main, low: s, pad: p.light }),
  trackpants: (p) => ({ top: p.main, low: p.main, pad: null, cuff: p.dark }),
  cargo: (p, s) => ({ top: p.main, low: s, pad: p.dark }),
  idol: (p, s) => ({ top: s, low: WHITE, pad: null }),
  sailor: (p, s) => ({ top: s, low: s, pad: null, cuff: WHITE }),
  boardshorts: (p, s) => ({ top: p.main, low: s, pad: p.light }),
  trunks: (p, s) => ({ top: p.main, low: s, pad: null }),
};
// Skirts and bare-legged bottoms show skin under the skirt.
const BARE = new Set(['plaid', 'tennis', 'flowerskirt', 'pinafore', 'onepiece', 'bikinibottom', 'dotbikinibottom']);

// Over the hips (the top's hem covers y < 35.8, so waist details sit just below it).
const SKIRTS = {
  jorts: (p) => [F(E(MID, 36.6, 0.5, 0.5, GOLD)), F(R(MID - 0.25, 37.2, 0.5, 2.4, p.dark)), F(limb(10, 36.2, 12.4, 37.6, 0.5, 0.5, p.light)), F(limb(21.2, 36.2, 18.8, 37.6, 0.5, 0.5, p.light))],
  trackpants: (p) => [F(R(9.6, 35.8, 1, 4, pale(p))), F(R(20.6, 35.8, 1, 4, pale(p))), F(limb(MID - 0.4, 36, MID - 1.2, 38.4, 0.5, 0.5, pale(p))), F(limb(MID + 0.4, 36, MID + 1.2, 38.4, 0.5, 0.5, pale(p)))],
  cargo: (p) => [R(9.4, 35.4, 12.4, 1.4, '#5a4636'), F(R(MID - 0.8, 35.6, 1.6, 1, GOLD)), R(8.4, 36.8, 2.8, 3, p.dark), R(19.8, 36.8, 2.8, 3, p.dark), F(R(8.4, 36.8, 2.8, 0.8, p.deep)), F(R(19.8, 36.8, 2.8, 0.8, p.deep))],
  plaid: (p, sw) => {
    const pts = skirtPts(41.6, 1.6, sw);
    return [T(pts, p.main), ...pleats(41.6, 1.6, sw, p.dark, [12.6, MID, 18.6]), F(band(pts, 37.6, 38.4, p.dark)), F(band(pts, 39.6, 40, pale(p))), band(pts, 40.6, 41.6, p.deep)];
  },
  tennis: (p, sw) => {
    const pts = skirtPts(40.8, 2, sw);
    const stripe = lum(p.main) > 0.85 ? '#5f7fd8' : WHITE;
    return [T(pts, p.main), ...pleats(40.8, 2, sw, p.dark), F(band(pts, 38, 38.6, stripe)), F(band(pts, 39.2, 39.8, stripe))];
  },
  flowerskirt: (p, sw) => {
    const pts = skirtPts(46.4, 2.8, sw);
    return [T(pts, p.main), R(10, 34.2, 11.2, 2.2, p.dark), ...flower(12.2 + sw * 0.4, 39.4, 1.5, pale(p), '#ff9ec0'), ...flower(19.4 + sw * 0.6, 42, 1.4, pale(p), '#8fd3ff'),
      ...flower(13.4 + sw * 0.8, 44.6, 1.2, pale(p)), band(pts, 45.4, 46.4, p.light)];
  },
  idol: (p, sw) => [skirtFrill(43.2, 3.4, sw, 7, pale(p)), skirtFrill(41.6, 2.6, sw, 6, p.main), R(10, 34.2, 11.2, 2, p.dark),
    F(E(12.4 + sw * 0.5, 39, 0.6, 0.6, GOLD)), F(E(18.6 + sw * 0.6, 38.4, 0.6, 0.6, pale(p))), F(E(MID + sw * 0.7, 40.4, 0.5, 0.5, GOLD))],
  sailor: (p, sw) => {
    const pts = skirtPts(41.6, 1.8, sw);
    return [T(pts, p.main), ...pleats(41.6, 1.8, sw, p.dark), F(band(pts, 40, 40.6, WHITE))];
  },
  pinafore: (p, sw) => {
    const pts = skirtPts(42.6, 2, sw);
    return [T(pts, p.main), R(11.4 + sw * 0.4, 37.4, 3, 2.6, p.dark), F(limb(10.6, 36, 9 + sw, 41.6, 0.4, 0.4, p.light)), F(limb(20.6, 36, 22.2 + sw, 41.6, 0.4, 0.4, p.light)), band(pts, 41.6, 42.6, p.dark)];
  },
  onepiece: (p, sw) => [skirtFrill(41.2, 2.6, sw, 6, pale(p)), skirtFrill(40.2, 2, sw, 6, p.main), ...dots([[12.2 + sw * 0.5, 38], [MID + sw * 0.6, 37.2], [19 + sw * 0.6, 38.4]], 0.6, pale(p))],
  bikinibottom: (p, sw) => [skirtFrill(42, 2.8, sw, 6, p.light), skirtFrill(40.4, 2, sw, 6, p.main), R(10, 34.2, 11.2, 2.2, p.main),
    ...dots([[12.4 + sw * 0.4, 37.4], [17.6 + sw * 0.5, 37]], 0.55, pale(p)), ...tieBow(20.4, 36.4, pale(p))],
  // Bloomer-style bottoms with frilled leg openings.
  dotbikinibottom: (p) => [T([[9.6, 34.2], [21.6, 34.2], [22.6, 37.6], [22.2, 40], [8.8, 40], [8.4, 37.6]], p.main), frill(8.6, 22.4, 39, 8.2, 22.8, 41.2, 7, 0.7, pale(p)),
    ...dots([[11.4, 37], [MID, 38], [19.8, 37]], 0.75, pale(p)), ...tieBow(10.4, 36.4, pale(p))],
  boardshorts: (p) => [F(limb(MID, 36, MID - 1.2, 38.8, 0.5, 0.5, pale(p))), F(limb(MID, 36, MID + 1.2, 38.8, 0.5, 0.5, pale(p))), ...flower(11.4, 37.8, 1.6, pale(p), '#ff9ec0'), ...flower(19.8, 38.2, 1.3, '#ffe36b', '#ff7a6b')],
  trunks: (p) => [F(R(9.6, 35.8, 1.2, 4, pale(p))), F(R(20.4, 35.8, 1.2, 4, pale(p))), F(limb(MID, 36, MID - 1, 38.4, 0.5, 0.5, pale(p))), F(limb(MID, 36, MID + 1, 38.4, 0.5, 0.5, pale(p))), F(E(12.8, 38, 0.5, 0.5, pale(p)))],
};

// ---------- Shoes (in the foot's frame: x toward the toe, y down to the sole) ----------

const SHOES = {
  hightops: (p, k, c) => [k.shaft(4.4, c(p.main), 3.3), k.sole(c(p.main)), k.poly([[-1.8, 0], [1.8, 0], [2.4, 2], [-2.4, 2]], c(WHITE)),
    k.poly([[-2.9, 2], [2.9, 2], [2.6, 3], [-2.6, 3]], c('#e6e8f2')), k.dot(0, -1.4, 0.5, c(WHITE)), k.dot(0, -2.8, 0.5, c(WHITE)), k.dot(-1.4, -2.2, 0.6, c(p.dark))],
  rainboots: (p, k, c) => [k.shaft(6.6, c(p.main), 3.5), k.sole(c(p.main)), k.poly([[-2.9, 2], [2.9, 2], [2.6, 3], [-2.6, 3]], c(p.deep)), k.dot(0.6, -1.6, 0.7, c(WHITE)), k.dot(-0.8, -4, 0.6, c(WHITE))],
  loafers: (p, k, c) => [k.shaft(3.2, c(WHITE), 3), k.sole(c(p.main)), k.poly([[-2.2, -0.2], [2.2, -0.2], [2.5, 0.9], [-2.5, 0.9]], c(p.dark)), k.dot(0, 0.35, 0.45, c(GOLD)),
    k.poly([[-2.9, 2.2], [2.9, 2.2], [2.6, 3], [-2.6, 3]], c(p.deep))],
  platforms: (p, k, c) => [k.shaft(5, c(p.main), 3.3), k.sole(c(p.main)), k.poly([[-3.1, 1], [3.1, 1], [3.1, 3], [-3.1, 3]], c(shade(p.main, -26))),
    k.poly([[-2.2, -2.8], [2.2, -2.8], [2.2, -1.8], [-2.2, -1.8]], c(p.light)), k.dot(0.8, -2.3, 0.5, c('#dfe6f5'))],
  sandals: (p, k, c) => [k.shaft(1, c(p.dark), 3.1), k.poly([[-3, 1.6], [3, 1.6], [3, 3], [-3, 3]], c(p.light)), k.poly([[-2.6, -0.2], [2.6, -0.2], [2.8, 1.6], [-2.8, 1.6]], c(p.main)),
    k.poly([[-0.5, -0.2], [0.5, -0.2], [0.5, 1.6], [-0.5, 1.6]], c(p.dark)), k.dot(0, 0.4, 0.8, c(WHITE))],
  // A thick foam sole and a thong strap; the bare foot sits between.
  flipflops: (p, k, c) => [k.poly([[-3, 1.4], [3, 1.4], [3.2, 3], [-3.2, 3]], c(p.main)), k.poly([[-2, -0.6], [-1, -0.6], [0.4, 1.6], [-0.4, 1.6]], c(p.dark)),
    k.poly([[2, -0.6], [1, -0.6], [-0.4, 1.6], [0.4, 1.6]], c(p.dark)), k.dot(0, 0.4, 1.1, c(WHITE)), k.dot(0, 0.4, 0.5, c(GOLD))],
};

// ---------- Hats ----------

const HATS = {
  cap: (p) => [T([[7.4, 7.6], [-1.6, 6.4], [-2.6, 8.4], [-0.4, 10], [7, 10.2]], p.dark), dome(15.5, 9.4, 11.2, 7.6, p.main), F(R(15.2, 2.2, 0.6, 7, p.dark)),
    F(T([[9.6, 3.4], [10.4, 3], [8.8, 9], [8, 9]], p.dark)), F(T([[21.4, 3.4], [20.6, 3], [22.4, 9], [23.2, 9]], p.dark)), R(4.4, 8.2, 22.2, 1.6, p.dark),
    F(E(15.5, 2, 1.3, 0.9, p.dark)), F(E(19, 5.6, 1.6, 1.4, pale(p))), F(E(19, 5.6, 0.7, 0.6, p.main))],
  bucket: (p) => [T([[6, 7.2], [25, 7.2], [28.6, 10.8], [26.8, 12], [4.2, 12], [2.4, 10.8]], p.dark), dome(15.5, 8, 9, 6.4, p.main), R(6.6, 6.2, 17.8, 1.8, p.light),
    F(R(4.8, 10.6, 21.4, 0.4, p.main)), ...flower(22, 7, 1.5, pale(p) === WHITE ? '#ff9ec0' : p.second)],
  pompom: (p, m) => {
    const s = m.hair * 0.5;
    return [E(15.5 + s, 0.2, 3.4, 3.2, pale(p)), F(E(14.4 + s, -0.8, 1.2, 1, WHITE)), dome(15.5, 9.4, 11, 8.6, p.main), T([[4.2, 7.4], [26.8, 7.4], [27.2, 11], [3.8, 11]], p.dark),
      ...[7, 10.2, 13.4, 16.6, 19.8, 23].map((x) => F(R(x, 7.8, 0.6, 2.8, p.deep)))];
  },
  headphones: (p) => [hoop(15.5, 13, 12.6, 12.2, 10.8, 10.4, p.main, 162, 378), E(4.4, 17.4, 2.6, 3.6, p.main), E(26.6, 17.4, 2.6, 3.6, p.main),
    F(E(4.4, 17.4, 1.4, 2.2, p.light)), F(E(26.6, 17.4, 1.4, 2.2, p.light)), heart(26.6, 17.2, 1, pale(p))],
  glasses: (p) => [F(hoop(11.2, 18.2, 3.1, 3.3, 2.3, 2.5, p.main)), F(hoop(19.8, 18.2, 3.1, 3.3, 2.3, 2.5, p.main)), F(R(14.2, 17.2, 2.6, 0.7, p.main)),
    F(R(5.6, 16.8, 2.6, 0.7, p.main)), F(R(22.8, 16.8, 2.6, 0.7, p.main)), F(E(13, 16.6, 0.45, 0.45, WHITE)), F(E(21.6, 16.6, 0.45, 0.45, WHITE))],
  catears: (p, m) => {
    const s = m.hair * 0.4;
    const ear = [T([[5, 6], [6.6 + s, -3], [12, 2.4]], p.main), F(T([[6.6, 4.4], [7.2 + s, -0.6], [10.2, 2.4]], '#ffc2d6'))];
    return [hoop(15.5, 13.4, 11.2, 10.6, 10, 9.4, p.main, 192, 348), ...ear, ...mirrorX(ear), F(E(15.5, 3.4, 0.8, 0.8, GOLD))];
  },
  bow: (p) => [T([[15.5, 4], [8, -1.8], [6.8, 3.6], [9, 7.6]], p.main), T([[15.5, 4], [23, -1.8], [24.2, 3.6], [22, 7.6]], p.main),
    F(T([[14, 4], [9.4, 1.2], [10.4, 4.6]], p.dark)), F(T([[17, 4], [21.6, 1.2], [20.6, 4.6]], p.dark)),
    T([[14.6, 4.6], [16.2, 4.6], [13.2, 9.4], [11.6, 8.4]], p.main), T([[16.4, 4.6], [14.8, 4.6], [17.8, 9.4], [19.4, 8.4]], p.main),
    E(15.5, 4, 2, 1.8, p.dark), ...dots([[9.4, 4.8], [21.6, 4.8], [11.2, 1.4], [19.8, 1.4]], 0.55, pale(p))],
  visor: (p) => [T([[4.8, 6.6], [26.2, 6.6], [26.6, 9], [4.4, 9]], p.main), T(ring(13, (i) => [15.5 + Math.cos((i * Math.PI) / 12) * 12.4, 8.6 + Math.sin((i * Math.PI) / 12) * 3.8]), p.light),
    F(R(4.6, 8.4, 21.8, 0.5, p.dark)), F(E(15.5, 7.6, 1, 0.9, pale(p)))],
  chefhat: (p) => [E(15.5, -3, 9, 6.6, p.main), E(9.4, -0.4, 4.6, 4.2, p.main), E(21.6, -0.4, 4.6, 4.2, p.main), F(E(13, -5.6, 2.4, 1.6, p.light)),
    R(6.4, 3.8, 18.2, 4.8, p.main), ...[9.6, 13.2, 16.8, 20.4].map((x) => F(R(x, 4.2, 0.6, 4, p.dark)))],
  sunhat: (p) => {
    const rib = lum(p.main) > 0.85 ? '#ff9ec0' : p.second;
    return [E(15.5, 8.6, 16, 3.4, p.main), F(E(15.5, 8.8, 13.6, 2, p.dark)), E(15.5, 5, 8.6, 5, p.main), R(7, 6.2, 17, 2, rib), ...tieBow(22.4, 7.2, rib), ...flower(9.6, 6.4, 1.7, WHITE)];
  },
  goggles: (p) => [limb(24.6, 8, 27, -6, 1.8, 1.8, '#ffb03b'), F(R(25.2, 0, 2, 0.8, '#ff7a3b')), E(27.2, -6.4, 1.6, 1, p.main), R(4.4, 6.2, 22.2, 1.8, p.deep),
    E(15.5, 6.8, 6.8, 3.8, p.main), E(15.5, 6.8, 5.2, 2.6, '#bfeaff'), F(T([[11.6, 6.6], [13.6, 4.8], [14.6, 5.2], [12.6, 7.4]], WHITE)), F(R(15.2, 3.4, 0.6, 1.4, p.dark))],
  sunglasses: (p) => [F(R(4.6, 5.4, 22, 0.8, p.main)), heart(11.2, 5.8, 3.4, p.main), heart(19.8, 5.8, 3.4, p.main), heart(11.2, 5.9, 2.4, '#3b3550'), heart(19.8, 5.9, 2.4, '#3b3550'),
    F(E(10.2, 5.2, 0.6, 0.5, WHITE)), F(E(18.8, 5.2, 0.6, 0.5, WHITE)), F(R(14.2, 5.2, 2.6, 0.8, p.main))],
};

// Behind the head: the sun hat's ribbon tails.
const HAT_BACKS = {
  sunhat: (p, m) => {
    const rib = lum(p.main) > 0.85 ? '#ff9ec0' : p.second;
    return [T([[22, 8], [24.4, 8], [28 + m.sway, 17], [25.8 + m.sway, 17.6]], rib), T([[23, 8], [25, 8], [25.6 + m.sway, 19.6], [23.6 + m.sway, 19]], shade(rib, -12))];
  },
};

// ---------- Gloves ----------

function hand(t, p, hx, hy, ex, ey) {
  const at = (u) => [lerp(hx, ex, u), lerp(hy, ey, u)];
  const s = hx < 15.5 ? 1 : -1;
  switch (keyOf(t)) {
    case 'fingerless': return [limb(...at(0.18), ...at(0.5), 3.8, 3.6, p.main), F(limb(...at(0.42), ...at(0.5), 3.8, 3.8, p.dark)), E(hx, hy, 2, 2, p.main), F(R(hx - 1.6, hy + 0.4, 3.2, 0.6, p.light))];
    case 'mittens': return [limb(...at(0.24), ...at(0.56), 4.6, 4.4, pale(p) === WHITE ? FUR : p.second), E(hx + s * 2, hy - 0.8, 1.3, 1.5, p.main), E(hx, hy, 3, 3, p.main), heart(hx, hy + 0.2, 1.3, pale(p))];
    default: return [E(hx, hy, 1.9, 1.9, p.main)];
  }
}

// ---------- On the back ----------

function capeBack(t, p, m) {
  const sw = m?.sway ?? 0;
  switch (keyOf(t)) {
    case 'backpack': return [E(15.5, 28.4, 10, 3.4, p.main), R(5.6, 28, 19.8, 12, p.main), R(4.2, 33, 2.2, 5.4, p.dark), R(24.6, 33, 2.2, 5.4, p.dark), F(R(4.2, 33, 2.2, 1, p.light)), F(R(24.6, 33, 2.2, 1, p.light))];
    case 'guitar': return [limb(9, 36, 33, 4, 3.6, 3, p.main), E(33.4, 3.4, 2, 2, p.main), E(9.4, 36.8, 3.8, 4.4, p.main), E(5.4, 42.4, 5, 6, p.main),
      F(E(4.4, 42, 1.4, 1.4, GOLD)), F(heart(7, 45, 1.2, '#ff9ec0')), F(R(26, 9.6, 1, 1.2, p.light))];
    case 'scarf': return [T([[9.4, 26], [12, 26], [7.6 + sw, 40], [4.6 + sw, 39.4]], p.dark), ...[4.8, 6, 7.2].map((x) => F(R(x + sw, 39.6, 0.6, 1.6, pale(p))))];
    case 'tote': return [R(2, 34, 7.6, 8.4, p.main), F(R(2, 34, 7.6, 1, p.dark)), heart(5.8, 38.4, 1.8, '#ff9ec0'), F(E(3.6, 36.4, 0.5, 0.5, GOLD))];
    case 'swimring': return [hoop(15.5, 37.4, 12, 6, 6.6, 2.4, p.main, 180, 360, 12)];
    case 'towel': {
      const pts = [[8.4, 25.6], [22.6, 25.6], [25 + sw * 0.5, 36], [26 + sw, 48], [5 + sw, 48], [6 + sw * 0.5, 36]];
      return [T(pts, p.main), band(pts, 38, 39.6, pale(p)), band(pts, 41.6, 42.8, '#ffe36b'), band(pts, 44.6, 45.8, pale(p)), ...[7, 11, 15, 19, 23].map((x) => F(R(x + sw, 47.8, 0.7, 1.4, pale(p))))];
    }
    default: return [T([[8.6, 26], [22.4, 26], [27 + sw, 48], [4 + sw, 48]], p.dark)];
  }
}

function capeFront(t, p, m) {
  const sw = m?.sway ?? 0;
  switch (keyOf(t)) {
    case 'backpack': return [limb(11.8, 26.2, 11.2, 35.4, 1.8, 2, p.dark), limb(19.4, 26.2, 20, 35.4, 1.8, 2, p.dark), F(R(10.4, 31.4, 1.6, 1, pale(p))), F(R(19.2, 31.4, 1.6, 1, pale(p)))];
    case 'guitar': return [limb(21, 26.4, 10.6, 35.6, 1.6, 1.6, p.dark), F(E(17.2, 29.8, 0.6, 0.6, GOLD))];
    case 'scarf': return [T([[17.4, 26.8], [20.4, 26.8], [20.8 + sw * 0.5, 38.4], [17.6 + sw * 0.5, 38.4]], p.main), F(R(17.6 + sw * 0.3, 31.4, 3, 0.9, pale(p))), F(R(17.6 + sw * 0.4, 34.4, 3, 0.9, pale(p))),
      ...[17.8, 19, 20.2].map((x) => F(R(x + sw * 0.5, 38.4, 0.6, 1.6, pale(p)))), E(MID, 26.4, 6.6, 2.4, p.main), F(R(10.4, 25.8, 10.4, 0.8, pale(p)))];
    case 'tote': return [limb(11.6, 26.2, 3.4, 34.4, 1.2, 1.2, p.dark), limb(11.6, 26.2, 8.2, 34.4, 1.2, 1.2, p.dark)];
    // The front half of the ring around the waist, in candy stripes.
    case 'swimring': return [0, 1, 2, 3].map((i) => hoop(15.5, 37.4, 12, 6, 6.6, 2.4, i % 2 ? pale(p) : p.main, i * 45, i * 45 + 45, 5));
    case 'towel': return [T([[9.8, 25.4], [12.8, 25.4], [14.6, 28.6], [11.4, 29]], p.main), T([[21.4, 25.4], [18.4, 25.4], [16.6, 28.6], [19.8, 29]], p.main), E(MID, 28.4, 1.6, 1.3, p.dark)];
    default: return [];
  }
}

// ---------- The set ----------

const pick = (table, t, fallback) => table[keyOf(t)] ?? fallback;

export default {
  hat: (t, p, m) => pick(HATS, t, () => [])(p, m),
  hatBack: (t, p, m) => pick(HAT_BACKS, t, () => [])(p, m),
  hatTucks: () => false,
  hatHidesBangs: () => false,
  top: (t, p) => pick(TOPS, t, () => [T(TORSO, p.main)])(p),
  sleeve: (t, p) => pick(SLEEVES, t, () => p.main)(p),
  longSleeves: (t) => LONG.has(keyOf(t)),
  shoulder: (t, p) => pick(SHOULDERS, t, () => [])(p),
  legs: (t, p, skin) => pick(LEGS, t, () => (BARE.has(keyOf(t)) ? { top: skin, low: skin, pad: null } : { top: p.main, low: p.main, pad: null }))(p, skin),
  skirt: (t, p, m) => SKIRTS[keyOf(t)]?.(p, m?.sway ?? 0) ?? null,
  shoe: (t, p, k) => pick(SHOES, t, () => [k.sole(k.tint(p.main))])(p, k, k.tint),
  hand,
  cape: capeBack,
  capeFront,
};
