// Full outfits: one look from hat to shoes (data/outfits-costume.js). `t` is the entry's index;
// every slot the piece covers looks the entry up by key, so the hat, top, legs and shoes of a
// costume all come from here. Skirts, coat tails, trains and capes hang and swing (gear.js HANGS).
// Each is drawn to read at a glance in the Cash Shop: a big headpiece, a layered silhouette, a
// back piece that moves, and small sparkling details (gems, lace, flowers, stars).

import { R, E, T, F, mix } from '../pixel.js';
import { torsoPts, band, side, MID, tieBow, button, limb } from '../figure.js';
import { darker, lighter } from './kit.js';
import { hoop, frill, flower, dome } from './casual.js';
import { COSTUME_LOOKS } from '../../data/outfits-costume.js';

const WHITE = '#ffffff';
const INK = '#3a2d4f';
const GOLD = '#ffd66b';
const GOLD_DK = '#c8902a';
const RED = '#e5485f';
const SHIRT = '#fff6ec';
const LACE = '#f6f0fa';
const PEARL = '#fff4fa';

const keyOf = (t) => COSTUME_LOOKS[t]?.key;
const rad = (d) => (d * Math.PI) / 180;
const ring = (n, f) => Array.from({ length: n }, (_, i) => f(i));
const lerp = (a, b, u) => a + (b - a) * u;
const TORSO = torsoPts();
// Turns points about (cx, cy) by `deg`.
const turn = (pts, cx, cy, deg) => {
  const [c, n] = [Math.cos(rad(deg)), Math.sin(rad(deg))];
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * n, cy + (x - cx) * n + (y - cy) * c]);
};

// ---------- Shape helpers ----------

// A five-point star.
const star = (cx, cy, r, c) => T(ring(10, (i) => {
  const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
  const rr = i % 2 ? r * 0.45 : r;
  return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
}), c);
// A four-point sparkle.
// (Never smaller than a pixel or so, or it reads as a grey speck.)
const sparkle = (x, y, r0, c = '#fffbe0', r = Math.max(1.2, r0)) => F(T([[x, y - r], [x + r * 0.25, y - r * 0.25], [x + r, y], [x + r * 0.25, y + r * 0.25], [x, y + r], [x - r * 0.25, y + r * 0.25], [x - r, y], [x - r * 0.25, y - r * 0.25]], c));
// A rose: a round bloom, a darker swirl inside, a lit centre.
const rose = (x, y, r, c, dk) => [E(x, y, r, r * 0.92, c), F(E(x + r * 0.12, y - r * 0.08, r * 0.64, r * 0.56, dk)), F(E(x + r * 0.22, y - r * 0.16, r * 0.36, r * 0.3, c)), F(limb(x - r * 0.7, y + r * 0.2, x + r * 0.3, y + r * 0.7, 0.3, 0.3, dk))];
// A leaf `len` long at `ang` degrees.
const leaf = (x, y, len, w, ang, c) => {
  const [dx, dy] = [Math.cos(rad(ang)), Math.sin(rad(ang))];
  return F(T([[x, y], [x + dx * len * 0.5 - dy * w, y + dy * len * 0.5 + dx * w], [x + dx * len, y + dy * len], [x + dx * len * 0.5 + dy * w, y + dy * len * 0.5 - dx * w]], c));
};
// A firework burst: rays from a bright centre.
const burst = (x, y, r, c, n = 8) => [...ring(n, (i) => {
  const a = (i / n) * Math.PI * 2;
  return F(limb(x + Math.cos(a) * r * 0.35, y + Math.sin(a) * r * 0.35, x + Math.cos(a) * r, y + Math.sin(a) * r, 0.4, 0.25, c));
}), F(E(x, y, r * 0.22, r * 0.22, WHITE))];
// A row of little round scallops (lace, fur, pearls).
const scallops = (x0, x1, y, n, r, c) => ring(n, (i) => F(E(lerp(x0, x1, n > 1 ? i / (n - 1) : 0.5), y, r, r * 0.85, c)));
// A snowflake.
const flake = (x, y, r, c) => [...[0, 60, 120].map((a) => F(limb(x - Math.cos(rad(a)) * r, y - Math.sin(rad(a)) * r, x + Math.cos(rad(a)) * r, y + Math.sin(rad(a)) * r, 0.35, 0.35, c))), F(E(x, y, r * 0.28, r * 0.28, c))];
// A gem with a shine.
const gem = (x, y, r, c) => [T([[x, y - r], [x + r * 0.8, y], [x, y + r], [x - r * 0.8, y]], c), F(T([[x, y - r], [x + r * 0.8, y], [x, y]], lighter(c, 0.2))), F(E(x - r * 0.25, y - r * 0.3, r * 0.2, r * 0.2, WHITE))];
// A skirt from the waist down to `len`, `fl` wider than the hips at the hem, its sides bowing out.
const skirtPts = (len, fl, y0) => [[9.8, y0], [21.4, y0], [21.6 + fl * 0.5, y0 + (len - y0) * 0.45], [21.4 + fl, len], [9.8 - fl, len], [9.6 - fl * 0.5, y0 + (len - y0) * 0.45]];
const skirt = (len, fl, c, y0 = 34.2) => T(skirtPts(len, fl, y0), c);
const skirtBand = (len, fl, y0, a, b, c) => band(skirtPts(len, fl, y0), a, b, c);
// Shading down the back of the torso and a light down the front, so a top reads round.
const round = (p) => [side(TORSO, 12, -1, darker(p.main, 0.1)), F(limb(19.6, 27.6, 19.8, 33.6, 0.8, 0.6, lighter(p.main, 0.1)))];
// A curling feather plume along a spine (root first): a tapered vane, its edge feathered by
// little barbs, a quill down the middle.
function plume(spine, w, c, dk) {
  const L = [];
  const Rr = [];
  const barbs = [];
  spine.forEach(([x, y], i) => {
    const [ax, ay] = spine[Math.max(0, i - 1)];
    const [bx, by] = spine[Math.min(spine.length - 1, i + 1)];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const [nx, ny] = [-(by - ay) / len, (bx - ax) / len];
    const u = i / (spine.length - 1);
    const h = (w / 2) * Math.sin(Math.PI * Math.min(1, 0.15 + u * 0.95));
    L.push([x + nx * h, y + ny * h]);
    Rr.push([x - nx * h, y - ny * h]);
    if (i > 0 && i < spine.length - 1) barbs.push(F(limb(x, y, x + nx * h * 1.15 + (bx - ax) * 0.2, y + ny * h * 1.15 + (by - ay) * 0.2, 0.25, 0.2, dk)), F(limb(x, y, x - nx * h * 1.15 + (bx - ax) * 0.2, y - ny * h * 1.15 + (by - ay) * 0.2, 0.25, 0.2, dk)));
  });
  const quill = spine.slice(1).map(([x, y], i) => F(limb(...spine[i], x, y, 0.35, 0.25, dk)));
  return [T([...L, ...Rr.reverse()], c), ...barbs, ...quill];
}
// A ribbon tail from (x, y) hanging `len`, its end notched, swinging by sw.
const tail = (x, y, len, w, c, sw = 0, lean = 0) => T([[x - w / 2, y], [x + w / 2, y], [x + w / 2 + lean + sw, y + len], [x + lean + sw, y + len - w * 0.6], [x - w / 2 + lean + sw, y + len]], c);

// ---------- Tops ----------

const TOPS = {
  // ----- Coinbridge's own (data/npcs.js): never sold -----
  // Madame Ledger: a plum velvet frock coat, darker lapels, a white ruffled jabot cascading down
  // the front, two rows of gold buttons and a watch chain looped to a pocket.
  cbledger: (p) => [T(TORSO, p.main), ...round(p), T([[MID - 3.4, 25.8], [MID - 0.4, 25.8], [MID - 1.6, 31.4]], darker(p.main, 0.2)), T([[MID + 3.4, 25.8], [MID + 0.4, 25.8], [MID + 1.6, 31.4]], darker(p.main, 0.2)),
    ...scallops(MID - 1.6, MID + 1.6, 27, 3, 0.9, WHITE), ...scallops(MID - 1.4, MID + 1.4, 28.6, 3, 0.8, LACE), ...scallops(MID - 1.1, MID + 1.1, 30.2, 2, 0.7, WHITE),
    ...[31.8, 33.6].flatMap((y) => [button(MID - 2.6, y, GOLD), button(MID + 2.6, y, GOLD)]), F(limb(MID + 3, 32.6, MID + 5.4, 33.8, 0.25, 0.25, GOLD)), E(MID + 5.6, 33.8, 0.8, 0.8, GOLD), F(R(9.8, 35, 11.8, 0.8, GOLD))],
  // Guildmaster Halvard: a worn brown gambeson quilted in diamonds, a leather strap across the chest
  // and a broad belt with a brass buckle and a pouch.
  cbhalvard: (p) => [T(TORSO, p.main), ...round(p), ...[0, 1, 2, 3].flatMap((i) => [F(limb(10 + i * 3.4, 26.4, 13.4 + i * 3.4, 35, 0.3, 0.3, darker(p.main, 0.14))), F(limb(13.4 + i * 3.4, 26.4, 10 + i * 3.4, 35, 0.3, 0.3, darker(p.main, 0.14)))]),
    F(limb(11, 26.8, 20.4, 34, 1.1, 1.1, '#5a3e2a')), F(limb(11, 26.8, 20.4, 34, 0.4, 0.4, '#7a5a3a')), F(R(9.8, 33.4, 11.8, 1.6, '#4a3424')), F(R(MID - 1, 33.2, 2, 2, GOLD)), F(R(MID - 0.4, 33.7, 0.8, 1, '#4a3424')), F(R(18.4, 34.6, 2.6, 2.2, '#6a4a30'))],
  // Penny: a crisp white blouse under a mint waistcoat buttoned to a V, a big red bow at the
  // collar, and a pen in the waistcoat's pocket.
  cbpenny: (p) => [T(TORSO, '#fffaf2'), side(TORSO, 12, -1, '#f0e8dc'), T([[9.8, 27], [MID - 0.6, 30.6], [MID - 0.6, 36], [9.8, 36]], p.main), T([[21.4, 27], [MID + 0.6, 30.6], [MID + 0.6, 36], [21.4, 36]], p.main),
    ...[31.6, 33.4, 35].map((y) => button(MID + 1.2, y, '#fffaf2')), F(R(17.6, 30.4, 2.6, 0.6, darker(p.main, 0.2))), F(limb(18.6, 28.6, 18.6, 30.6, 0.5, 0.5, '#4a6ad0')), F(E(18.6, 28.4, 0.4, 0.4, GOLD)), ...tieBow(MID, 26.6, '#e85a6a')],
  // Juniper: her rust work dress, and over it a cream bib apron with a little gold kettle stitched
  // on it, its straps over her shoulders.
  cbjuniper: (p) => [T(TORSO, p.main), ...round(p), T([[MID - 3.8, 28.2], [MID + 3.8, 28.2], [MID + 4.2, 36], [MID - 4.2, 36]], '#fff0d8'), F(limb(MID - 3.6, 28.4, 11.4, 25.8, 0.6, 0.6, '#fff0d8')), F(limb(MID + 3.6, 28.4, 19.8, 25.8, 0.6, 0.6, '#fff0d8')),
    E(MID, 31.6, 1.6, 1.3, GOLD), F(R(MID - 0.6, 29.6, 1.2, 0.8, GOLD)), T([[MID + 1.4, 31.2], [MID + 2.6, 30.4], [MID + 2.4, 31.4]], GOLD), ...scallops(MID - 3.6, MID + 3.6, 28.4, 5, 0.4, '#f8dcc0')],
  // Old Wendell: a checked flannel shirt under an open olive cardigan with big wooden buttons.
  cbwendell: (p) => [T(TORSO, '#e8d4b0'), ...[27.8, 30.4, 33].map((y) => band(TORSO, y, y + 0.6, '#c87a5a')), ...[12.6, MID, 18.6].map((x) => F(R(x - 0.3, 26, 0.6, 10, '#c87a5a'))),
    T([[9.8, 26.2], [12.8, 26.2], [MID - 1.4, 36], [9.8, 36]], p.main), T([[21.4, 26.2], [18.4, 26.2], [MID + 1.4, 36], [21.4, 36]], p.main), side(TORSO, 12, -1, darker(p.main, 0.12)),
    ...[29.6, 32.6].map((y) => E(MID - 1.6, y, 0.7, 0.7, '#a87a4a')), ...[10.6, 20.6].map((x) => F(R(x - 0.3, 26.6, 0.6, 9, lighter(p.main, 0.12))))],
  // Tilly: a pink-striped shirt under a card-table green waistcoat with a suit on each button, and
  // a red bow tie.
  cbtilly: (p) => [T(TORSO, WHITE), ...[27.4, 29.6, 31.8, 34].map((y) => band(TORSO, y, y + 0.9, '#ffb0c8')), T([[9.8, 27.4], [MID - 0.6, 30.4], [MID - 0.6, 35.6], [9.8, 35.6]], p.main), T([[21.4, 27.4], [MID + 0.6, 30.4], [MID + 0.6, 35.6], [21.4, 35.6]], p.main),
    F(T([[MID + 1.4, 30.6], [MID + 2, 31.2], [MID + 1.4, 31.8], [MID + 0.8, 31.2]], '#e85a6a')), F(E(MID + 1.4, 32.8, 0.5, 0.5, INK)), F(E(MID + 1.4, 34.4, 0.5, 0.5, '#e85a6a')), ...tieBow(MID, 26.6, '#e85a6a'), F(R(17.6, 29.6, 2.4, 0.5, darker(p.main, 0.2)))],
  // Kinako by day: a cream shirt under a pink-striped shop apron (a pen in its pocket, a name tag
  // with a heart), its straps over the shoulders, and a red bow tie.
  kinakoday: () => [T(TORSO, '#fff6ec'), side(TORSO, 12, -1, '#f2e6d8'),
    T([[11.2, 28.4], [19.8, 28.4], [20.6, 36], [10.4, 36]], '#ff9ec0'), ...[12.8, 15.5, 18.2].map((x) => F(R(x - 0.4, 28.6, 0.8, 7.4, '#ffe4ee'))),
    F(limb(11.6, 28.6, 11, 25, 0.6, 0.6, '#ff9ec0')), F(limb(19.4, 28.6, 20, 25, 0.6, 0.6, '#ff9ec0')),
    R(16.6, 31.4, 3.4, 2.6, '#ff7fa6'), F(limb(17.4, 31.6, 17.2, 29.6, 0.3, 0.3, '#5a8ad8')), F(E(17.2, 29.4, 0.35, 0.35, '#ffd66b')),
    R(10.6, 25.6, 3.2, 2, WHITE), F(E(12.2, 26.6, 0.5, 0.45, '#ff6f9a')), ...tieBow(MID, 26.2, '#e5485f')],
  // Kinako by night: a long plum-black trench coat, collar up, belted, a dark turtleneck under it.
  kinakonight: () => [T(TORSO, '#3a2e4a'), side(TORSO, 12, -1, '#2e2440'),
    T([[13, 25.4], [18, 25.4], [MID, 30]], '#241c30'),
    T([[10.4, 24.2], [13.6, 25.2], [MID, 31], [11, 30]], '#4e3e62'), T([[20.6, 24.2], [17.4, 25.2], [MID, 31], [20, 30]], '#4e3e62'),
    T([[10, 22.6], [12.6, 24.8], [10.6, 26.4]], '#5a4a72'), T([[21, 22.6], [18.4, 24.8], [20.4, 26.4]], '#5a4a72'),
    R(9.4, 33, 12.2, 1.6, '#241c30'), R(14.6, 32.7, 1.8, 2.2, GOLD), F(R(15.1, 33.2, 0.8, 1.2, '#241c30')),
    ...[[12.2, 30.6], [18.8, 30.6], [12.2, 35.2], [18.8, 35.2]].map(([x, y]) => F(E(x, y, 0.5, 0.5, '#6a5a82')))],
  // The Masked Moth: a dusk-coloured robe crossed by a lavender sash, a scalloped collar like a
  // moth's wing edge, and a string of little lantern charms at her waist.
  cbmoth: (p) => [T(TORSO, p.main), ...round(p), F(limb(10.4, 27, 20.6, 34.6, 1.6, 1.6, '#c9b8e8')), F(limb(10.4, 27, 20.6, 34.6, 0.5, 0.5, '#e8dcf4')),
    ...scallops(MID - 4, MID + 4, 26.6, 5, 0.9, '#5a4a7a'), ...[11.6, 13.6, 15.6, 17.6, 19.6].map((x, i) => E(x, 35.4 + (i % 2) * 0.4, 0.7, 0.9, i % 2 ? GOLD : '#c9a6ff'))],
  // ----- The Sweethearts' own (data/sweethearts.js) -----
  // Poppy: a cream blouse under a strawberry-print bib apron, a heart pocket, frilled edges.
  swbaker: (p) => [T(TORSO, '#fff6ec'), side(TORSO, 12, -1, '#f2e4d6'), T([[MID - 4.4, 27], [MID + 4.4, 27], [MID + 4.8, 35.8], [MID - 4.8, 35.8]], p.main),
    frill(MID - 4.6, MID + 4.6, 26.6, MID - 5, MID + 5, 28, 5, 0.5, WHITE), ...[[12.6, 30], [17.4, 29.4], [14.4, 33.4], [18.6, 33.6]].flatMap(([x, y]) => [E(x, y, 0.9, 1, RED), F(E(x, y - 0.9, 0.7, 0.35, '#5fbf7a')), F(E(x - 0.3, y - 0.2, 0.2, 0.2, '#ffe0a0'))]),
    T([[MID - 1.6, 30.6], [MID, 32.6], [MID + 1.6, 30.6], [MID + 0.8, 29.8], [MID, 30.4], [MID - 0.8, 29.8]], WHITE), F(limb(MID - 4.6, 27, MID - 6, 25.8, 0.4, 0.4, p.main)), F(limb(MID + 4.6, 27, MID + 6, 25.8, 0.4, 0.4, p.main))],
  // Lark: an oversized cable-knit sweater, cables down the front, a quill pinned at the collar.
  swpoet: (p) => [T(TORSO, p.main), ...round(p), ...[12.4, MID, 18.6].map((x) => F(limb(x, 27, x, 35.4, 0.7, 0.7, darker(p.main, 0.12)))), ...[12.4, MID, 18.6].flatMap((x) => [28.4, 30.8, 33.2].map((y) => F(E(x, y, 0.9, 0.5, lighter(p.main, 0.12))))),
    E(MID, 26, 5, 1.6, lighter(p.main, 0.1)), band(TORSO, 34.6, 35.8, darker(p.main, 0.16)), F(limb(19.6, 25.4, 22.4, 21.6, 0.5, 0.2, WHITE)), F(limb(19.6, 25.4, 20.4, 24.2, 0.35, 0.3, '#5a7ab8'))],
  // Rowan: a rounded breastplate over a sky tabard with a sun crest, a daisy tucked in the strap.
  swknight: (p) => [T(TORSO, '#dfe6f2'), side(TORSO, 12, -1, '#b8c4d8'), F(limb(19.4, 27, 19.6, 33, 0.9, 0.7, WHITE)), T([[MID - 3.4, 28], [MID + 3.4, 28], [MID + 3, 36], [MID - 3, 36]], p.main),
    ...burst(MID, 31.6, 2.4, GOLD, 8), F(E(MID, 31.6, 1, 1, '#fff2a8')), band(TORSO, 34.4, 35.8, '#7a5a3a'), R(MID - 1.2, 34.2, 2.4, 1.8, GOLD), F(limb(11.4, 26.4, 17.6, 33, 0.7, 0.7, '#7a5a3a')),
    ...ring(6, (i) => F(E(12.6 + Math.cos((i / 6) * Math.PI * 2) * 0.9, 27.8 + Math.sin((i / 6) * Math.PI * 2) * 0.9, 0.6, 0.6, WHITE))), F(E(12.6, 27.8, 0.5, 0.5, GOLD))],
  // Yuzu: a white haori trimmed in orange over a red-orange kimono, a red obi with a little bell.
  swfox: (p) => [T(TORSO, WHITE), side(TORSO, 12, -1, '#efe6f0'), T([[MID - 3, 25.8], [MID + 1, 25.8], [MID + 3.4, 31.6], [MID + 1.6, 33]], p.main), T([[MID - 3.2, 25.8], [MID - 1.6, 25.8], [MID + 2.6, 32.4], [MID + 1.4, 33.2]], darker(p.main, 0.15)),
    F(limb(10.2, 26.4, 10, 35.6, 0.8, 0.8, p.main)), F(limb(20.8, 26.4, 21, 35.6, 0.8, 0.8, p.main)), band(TORSO, 31.6, 35, RED), band(TORSO, 33, 33.5, GOLD),
    E(MID + 1.6, 34.8, 1, 1, GOLD), F(E(MID + 1.6, 35.2, 0.4, 0.3, '#8a5a1a')), ...[[12.6, 28.4], [18.4, 29.6]].map(([x, y]) => leaf(x, y, 2, 0.6, 30, '#ff9a4f'))],
  // Celeste: a midnight robe drawn with a constellation, a crescent-moon brooch at the throat.
  swstar: (p) => [T(TORSO, p.main), ...round(p), T([[MID - 2.4, 25.8], [MID + 2.4, 25.8], [MID, 28.4]], lighter(p.main, 0.2)),
    ...[[11.6, 28.6, 13.6, 31], [13.6, 31, 17.4, 30.2], [17.4, 30.2, 19.6, 33.4]].map(([a, b, c, d]) => F(limb(a, b, c, d, 0.18, 0.18, '#c8c8ff'))), ...[[11.6, 28.6], [13.6, 31], [17.4, 30.2], [19.6, 33.4]].map(([x, y], i) => star(x, y, i % 2 ? 0.9 : 1.2, GOLD)),
    T([[MID - 1, 26.2], [MID + 1.2, 25.8], [MID + 1.8, 27.4], [MID + 0.4, 28.6], [MID + 0.8, 27.4], [MID - 0.2, 26.8]], GOLD), band(TORSO, 34.6, 35.8, lighter(p.main, 0.15)), sparkle(19.8, 28.4, 0.6)],
  // Marlowe: a navy-and-white striped sailor shirt under an open blue jacket, a red neckerchief.
  swsailor: (p) => [T(TORSO, WHITE), ...[27.4, 29.4, 31.4, 33.4].map((y) => band(TORSO, y, y + 0.9, '#2a3a6a')), 
    T([[9.6, 25.8], [12.6, 25.8], [13, 35.8], [9.4, 35.8]], p.main), T([[18.4, 25.8], [21.4, 25.8], [21.6, 35.8], [18, 35.8]], p.main), ...[29, 32].map((y) => button(12.4, y, GOLD)),
    T([[MID - 3, 25.6], [MID + 3, 25.6], [MID + 0.6, 29.6], [MID - 0.6, 29.6]], RED), F(E(MID, 28.4, 1, 0.8, darker(RED, 0.15))), T([[MID - 0.6, 29], [MID + 0.6, 29], [MID + 1.4, 31.6], [MID - 1.4, 31.6]], RED)],
  // A navy yukata printed with fireworks: crossed collar, a two-tone obi with a braided cord and a
  // charm.
  yukata: (p) => [T(TORSO, p.main), ...round(p), T([[MID - 3, 25.8], [MID + 1, 25.8], [MID + 3.4, 31.6], [MID + 1.6, 33]], SHIRT), T([[MID - 3.2, 25.8], [MID - 1.6, 25.8], [MID + 2.6, 32.4], [MID + 1.4, 33.2]], p.deep),
    ...burst(12, 29.4, 2.2, GOLD), ...burst(19.8, 28.2, 1.6, '#ff9ec0'), sparkle(17.6, 30.6, 0.7, GOLD),
    band(TORSO, 31.2, 35.4, '#ffd34d'), band(TORSO, 31.2, 32, '#ff8a5a'), band(TORSO, 34.6, 35.4, '#ff8a5a'), band(TORSO, 33, 33.6, RED),
    F(E(MID + 1.2, 33.3, 0.9, 0.7, RED)), F(limb(MID + 1.2, 33.8, MID + 1.6, 36.6, 0.35, 0.35, RED)), F(E(MID + 1.6, 37, 0.7, 0.7, GOLD))],
  // A black bodice laced up the front over white, puffed lace at the throat, a ribbon and cameo.
  gothic: (p) => [T(TORSO, p.main), ...round(p), T([[MID - 2.4, 26.4], [MID + 2.4, 26.4], [MID + 1.6, 34.4], [MID - 1.6, 34.4]], LACE),
    ...[28.2, 29.8, 31.4, 33].map((y) => F(limb(MID - 1.6, y, MID + 1.6, y + 1, 0.3, 0.3, RED))), ...[28.2, 29.8, 31.4, 33].map((y) => F(limb(MID + 1.6, y, MID - 1.6, y + 1, 0.3, 0.3, RED))),
    frill(MID - 3, MID + 3, 25.6, MID - 3.4, MID + 3.4, 27.6, 4, 0.5, WHITE), ...tieBow(MID, 27.2, RED), F(E(MID, 28.6, 0.9, 1, GOLD)), F(E(MID, 28.6, 0.55, 0.65, '#ffd6e2')),
    band(TORSO, 34, 35.6, RED), ...scallops(10.4, 20.8, 35.6, 6, 0.6, WHITE)],
  // Fluffy pajamas: a quilted front with stars, a round collar, a moon pocket.
  pajamas: (p) => [T(TORSO, p.main), ...round(p), T([[MID - 3.6, 25.8], [MID, 27.6], [MID + 3.6, 25.8], [MID + 3.4, 27.8], [MID, 29], [MID - 3.4, 27.8]], WHITE),
    ...scallops(MID - 3.2, MID + 3.2, 28.6, 4, 0.45, '#ffd6e2'), ...[30, 32.2].map((y) => button(MID + 0.4, y, WHITE)),
    star(11.8, 30.2, 1.2, '#ffe36b'), star(19.8, 33, 0.9, '#ffe36b'), sparkle(12.6, 33.6, 0.7), sparkle(19.4, 29.4, 0.6),
    R(17.6, 31, 3.4, 3, lighter(p.main, 0.12)), T([[18.2, 31.4], [19.8, 31.2], [20.4, 33.2], [19, 33.8], [19.6, 32.6], [18.8, 31.8]], '#ffe36b'), band(TORSO, 34.6, 35.8, darker(p.main, 0.12))],
  // A space suit with orange piping: a chest panel of lit buttons, a mission patch, a utility belt.
  astronaut: (p) => [T(TORSO, p.main), ...round(p), F(limb(11.2, 27, 11.6, 35, 0.7, 0.7, '#ff8a3c')), F(limb(19.8, 27, 19.4, 35, 0.7, 0.7, '#ff8a3c')),
    R(12.4, 28.4, 6.4, 4.2, '#c8ccd8'), F(R(12.8, 28.8, 5.6, 3.4, '#5a6a8a')), F(E(13.8, 29.8, 0.6, 0.6, RED)), F(E(15.4, 29.8, 0.6, 0.6, '#5fd8a0')), F(E(17, 29.8, 0.6, 0.6, '#ffd34d')),
    F(R(13.2, 31.2, 4.8, 0.5, '#8fd3ff')), F(E(20.2, 28.2, 1.3, 1.3, '#3f7fd8')), star(20.2, 28.2, 0.8, WHITE),
    band(TORSO, 33.4, 35.2, '#8a92a8'), R(MID - 1.2, 33.2, 2.4, 2.2, '#c8ccd8'), F(E(MID, 34.3, 0.6, 0.6, '#ff8a3c')), R(10.4, 33.6, 2, 2, '#c8ccd8'), R(18.8, 33.6, 2, 2, '#c8ccd8')],
  // A plaid frock coat: wide lapels, a cravat with a pin, a waistcoat and a watch chain.
  detective: (p) => [T(TORSO, p.main), ...round(p), ...[12, 15.5, 19].map((x) => F(R(x - 0.2, 26.6, 0.4, 9, darker(p.main, 0.16)))), ...[29, 32].map((y) => F(R(9.8, y, 11.6, 0.4, darker(p.main, 0.16)))),
    T([[MID - 2.6, 26], [MID + 2.6, 26], [MID + 2, 35.6], [MID - 2, 35.6]], '#5a4a6a'), T([[MID - 1.4, 25.8], [MID + 1.4, 25.8], [MID, 28]], WHITE),
    T([[MID - 1.2, 27.2], [MID + 1.2, 27.2], [MID + 0.8, 30.2], [MID, 30.8], [MID - 0.8, 30.2]], '#7a2a3a'), F(E(MID, 28, 0.45, 0.45, GOLD)),
    T([[MID - 3.6, 25.6], [MID - 1.6, 25.6], [MID - 2.2, 31]], darker(p.main, 0.22)), T([[MID + 3.6, 25.6], [MID + 1.6, 25.6], [MID + 2.2, 31]], darker(p.main, 0.22)),
    ...[31.6, 33.4].map((y) => button(MID, y, GOLD)), F(limb(MID + 0.4, 32.4, 18.6, 33.4, 0.3, 0.3, GOLD)), F(E(18.8, 33.6, 0.6, 0.6, GOLD))],
  // An off-the-shoulder bodice of layered petals, a jewelled neckline and a star brooch.
  ballgown: (p) => [T([[10.2, 28.4], [21, 28.4], [21.5, 32], [21.3, 34.2], [21.5, 35.8], [9.5, 35.8], [9.7, 34.2], [9.8, 32]], p.main), side(TORSO, 12, -1, darker(p.main, 0.1)),
    frill(9.6, 21.6, 27.6, 9.2, 22, 29.6, 7, 0.6, p.light), frill(10, 21.2, 27.6, 9.8, 21.4, 28.6, 6, 0.4, WHITE), ...scallops(11, 20.2, 28.9, 6, 0.4, GOLD),
    T([[MID - 2.4, 29.6], [MID + 2.4, 29.6], [MID, 34.4]], p.light), ...[31, 32.6].map((y) => F(R(MID - 1.4 + (y - 31) * 0.3, y, 2.8 - (y - 31) * 0.6, 0.4, WHITE))),
    band(TORSO, 33.8, 35.4, p.deep), ...gem(MID, 34.6, 1.3, '#8fe8ff'), sparkle(19.6, 31.2, 0.8)],
  // A tailcoat with a red silk lining showing at the lapels, a white waistcoat, a jewelled cravat.
  tuxedo: (p) => [T(TORSO, p.main), ...round(p), T([[MID - 2.6, 25.8], [MID + 2.6, 25.8], [MID + 2.2, 35.8], [MID - 2.2, 35.8]], WHITE), T([[MID - 2, 29], [MID + 2, 29], [MID + 1.8, 34.6], [MID - 1.8, 34.6]], '#ece6f4'),
    T([[MID - 3.4, 25.6], [MID - 2.4, 25.6], [MID - 1.4, 32], [MID - 2.8, 32.6]], RED), T([[MID + 3.4, 25.6], [MID + 2.4, 25.6], [MID + 1.4, 32], [MID + 2.8, 32.6]], RED),
    T([[MID - 1.6, 26.2], [MID + 1.6, 26.2], [MID + 1.2, 29.4], [MID, 30], [MID - 1.2, 29.4]], WHITE), ...gem(MID, 27.6, 0.8, RED), ...[31, 32.8].map((y) => button(MID, y, GOLD)),
    ...rose(19.8, 28.2, 1.2, RED, '#8e1c2c'), leaf(19, 29.2, 1.6, 0.5, 130, '#3f7a4a')],
  // A crop cheer top: a shining star, a V of white and gold, sparkles.
  cheer: (p) => [T([[11, 26.2], [20.2, 26.2], [21.3, 27.8], [21.7, 29.6], [21.5, 32.4], [9.7, 32.4], [9.7, 29.6], [9.9, 27.8]], p.main), side(TORSO, 12, -1, darker(p.main, 0.1)),
    T([[11, 26.4], [MID, 30.6], [20.2, 26.4], [20.8, 27.6], [MID, 32], [10.4, 27.6]], WHITE), T([[11.8, 26.6], [MID, 29.8], [19.4, 26.6], [19.8, 27.2], [MID, 30.6], [11.4, 27.2]], GOLD),
    star(MID, 29.4, 2.2, '#ffe36b'), F(star(MID, 29.4, 1.2, WHITE)), sparkle(19.4, 30.8, 0.8), sparkle(11.8, 30.4, 0.6), band(TORSO, 31.4, 32.4, WHITE)],
  // A captain's coat: crimson with gold frogging, a frilled jabot, a wide belt with a big buckle and
  // a sash.
  pirate: (p) => [T(TORSO, p.main), ...round(p), T([[MID - 2.4, 26], [MID + 2.4, 26], [MID + 1.6, 35.6], [MID - 1.6, 35.6]], SHIRT),
    frill(MID - 1.8, MID + 1.8, 26.6, MID - 2.2, MID + 2.2, 28.4, 3, 0.4, WHITE), frill(MID - 1.6, MID + 1.6, 28.2, MID - 2, MID + 2, 30, 3, 0.4, WHITE),
    ...[28, 30, 32].flatMap((y) => [F(limb(MID - 4.4, y, MID - 2.6, y, 0.45, 0.45, GOLD)), F(limb(MID + 2.6, y, MID + 4.4, y, 0.45, 0.45, GOLD)), button(MID - 4.6, y, GOLD), button(MID + 4.6, y, GOLD)]),
    T([[10.4, 30.4], [21.4, 33], [21.4, 34.6], [10.2, 32]], '#2a4a8a'), band(TORSO, 33.4, 35.4, '#3a2418'), R(MID - 1.6, 33.2, 3.2, 2.4, GOLD), F(R(MID - 0.8, 33.8, 1.6, 1.2, '#3a2418'))],
  // A seashell bodice with a pearl string, a sheer wrap over the shoulders, a starfish.
  mermaid: (p) => [T([[10.2, 28.6], [21, 28.6], [21.5, 32], [21.3, 34.2], [21.5, 35.8], [9.5, 35.8], [9.7, 34.2], [9.8, 32]], lighter(p.main, 0.1)), side(TORSO, 12, -1, p.main),
    ...[12.6, 18.6].flatMap((x) => [E(x, 29.8, 2.8, 2.4, '#ffb8d0'), ...ring(4, (i) => F(limb(x, 31.6, x - 2 + i * 1.33, 28, 0.25, 0.25, '#ff8fb0'))), F(E(x, 31.4, 1, 0.5, '#ff8fb0'))]),
    ...scallops(10.4, 20.8, 32.6, 9, 0.45, PEARL), ...ring(6, (i) => F(E(10 + i * 2.2, 34.6 + (i % 2) * 0.4, 0.6, 0.6, lighter(p.main, 0.25)))), star(MID, 32.8, 0.9, '#ffb36b')],
  // A leather bomber with a shearling collar, a zip, patches and a long white scarf.
  aviator: (p) => [T(TORSO, p.main), ...round(p), F(R(MID - 0.25, 27, 0.5, 8.6, '#d8c8a8')), F(R(9.6, 34.2, 12, 1.6, darker(p.main, 0.2))),
    E(MID - 3, 26.6, 3.6, 2, '#f2e6cc'), E(MID + 3, 26.6, 3.6, 2, '#f2e6cc'), ...scallops(MID - 6, MID + 6, 27.8, 7, 0.55, '#e6d6b4'),
    R(11, 29.6, 3, 2.6, darker(p.main, 0.2)), F(E(12.5, 30.9, 1, 1, '#3f7fd8')), F(star(12.5, 30.9, 0.6, WHITE)), R(17.8, 29.4, 2.8, 1.4, '#2a4a8a'), F(R(18, 29.8, 2.4, 0.4, RED))],
  // A white coat dress trimmed in fur, snowflakes down the front, a jewelled clasp.
  snow: (p) => [T(TORSO, WHITE), side(TORSO, 12, -1, '#e8eef8'), T([[MID - 2.4, 26.4], [MID + 2.4, 26.4], [MID + 1.6, 35.8], [MID - 1.6, 35.8]], p.main),
    ...flake(MID, 30.6, 1.4, WHITE), ...flake(12, 32.4, 0.9, p.main), ...flake(19.4, 29.2, 0.8, p.main), sparkle(18.8, 33, 0.7, '#cfe8ff'),
    E(MID, 26.4, 6.4, 2.2, '#f8f4ec'), ...scallops(MID - 5.8, MID + 5.8, 27.6, 7, 0.6, '#f8f4ec'), ...gem(MID, 27.8, 1, '#8fe8ff'), band(TORSO, 34, 35.6, lighter(p.main, 0.1))],
};

// Upper-arm colours (the default is p.main) and which sleeves run to the wrist.
const SLEEVES = { kinakoday: () => '#fff6ec', kinakonight: () => '#3a2e4a', cbpenny: () => '#fffaf2', cbtilly: () => WHITE, swbaker: () => '#fff6ec', swknight: () => '#dfe6f2', swfox: () => WHITE, swsailor: (p) => p.main, ballgown: (p) => p.light, cheer: () => WHITE, mermaid: () => '#e6f8ff', snow: () => WHITE };
const LONG = new Set(['kinakonight', 'cbledger', 'cbhalvard', 'cbpenny', 'cbwendell', 'cbmoth', 'swpoet', 'swknight', 'swfox', 'swstar', 'swsailor', 'yukata', 'gothic', 'pajamas', 'astronaut', 'detective', 'tuxedo', 'pirate', 'aviator', 'snow']);

// Over each shoulder.
const SHOULDERS = {
  // Ledger's velvet shoulders with gold fringe; Halvard's leather pauldrons, riveted; Penny's
  // puffed blouse with a red sleeve garter; Juniper's rolled-up sleeves; Wendell's chunky knit;
  // Tilly's striped short sleeves; the Moth's fuzzy-edged bell sleeves.
  cbledger: (p) => [E(0, 0.6, 3.4, 2.8, p.main), F(E(-0.6, -0.2, 1.4, 0.9, lighter(p.main, 0.14))), F(R(-3.2, 2.2, 6.4, 0.7, GOLD)), ...ring(5, (i) => F(R(-2.8 + i * 1.3, 2.9, 0.4, 1.2, GOLD)))],
  cbhalvard: () => [E(0, 0.4, 3.9, 3.1, '#6a4a30'), F(R(-3.6, 1.4, 7.2, 0.8, '#4a3424')), F(R(-3.2, 3, 6.4, 0.7, '#4a3424')), ...[-2.4, 0, 2.4].map((x) => F(E(x, 0.4, 0.35, 0.35, GOLD)))],
  cbpenny: () => [E(0, 0.6, 3.1, 2.7, '#fffaf2'), F(E(-0.6, -0.2, 1.4, 0.9, WHITE)), F(R(-3, 3.2, 6, 0.9, '#e85a6a'))],
  cbjuniper: (p) => [E(0, 0.6, 3, 2.6, p.main), F(R(-3, 2.4, 6, 1.4, '#fff0d8')), F(R(-3, 3.6, 6, 0.4, '#e8d0b8'))],
  cbwendell: (p) => [E(0, 0.8, 3.3, 2.9, p.main), ...[-1.6, 0, 1.6].map((x) => F(limb(x, -0.8, x, 2.8, 0.4, 0.4, darker(p.main, 0.12))))],
  cbtilly: () => [E(0, 0.6, 3, 2.5, WHITE), F(R(-2.8, 0.4, 5.6, 0.8, '#ffb0c8')), F(R(-2.8, 2.2, 5.6, 0.8, '#ffb0c8'))],
  // (Kinako's sleeves rolled up for work; at night, the coat's shoulders with a strap across.)
  kinakoday: () => [E(0, 0.6, 3, 2.5, '#fff6ec'), F(R(-2.8, 2, 5.6, 1.2, '#f2e0cc'))],
  kinakonight: () => [E(0, 0.6, 3.3, 2.8, '#3a2e4a'), F(R(-3, 0.2, 6, 0.9, '#4e3e62')), F(E(1.8, 0.6, 0.5, 0.5, '#6a5a82'))],
  cbmoth: (p) => [T([[-2.8, -0.6], [2.8, -0.6], [4, 5.8], [-4, 5.8]], p.main), ...scallops(-3.8, 3.8, 5.8, 5, 0.6, '#c9b8e8')],
  // Poppy's puffed sleeves; Lark's chunky knit; Rowan's round pauldrons; Yuzu's wide hanging
  // haori sleeves; Celeste's bell sleeves with stars; Marlowe's jacket shoulders with gold.
  swbaker: () => [E(0, 0.6, 3, 2.6, '#fff6ec'), F(E(-0.6, -0.2, 1.4, 0.9, WHITE)), ...scallops(-2.6, 2.6, 2.8, 4, 0.4, '#ffd2e0')],
  swpoet: (p) => [E(0, 0.8, 3.2, 2.8, p.main), F(limb(-1.4, -0.6, -1.2, 2.6, 0.5, 0.5, darker(p.main, 0.12))), F(limb(1.4, -0.6, 1.2, 2.6, 0.5, 0.5, darker(p.main, 0.12)))],
  swknight: (p) => [E(0, 0.4, 3.8, 3, '#dfe6f2'), F(E(-0.8, -0.6, 1.8, 1, WHITE)), F(R(-3.4, 1.8, 6.8, 0.9, p.main)), F(E(0, 0.4, 0.7, 0.7, GOLD))],
  swfox: (p) => [T([[-2.4, -0.6], [2.8, -0.6], [3.6, 6.4], [1.4, 9], [-2.8, 8], [-3, 2]], WHITE), F(limb(-2.8, 7.8, 1.4, 8.8, 0.7, 0.7, p.main)), leaf(0.4, 4.2, 2, 0.6, 60, '#ff9a4f')],
  swstar: (p) => [T([[-2.6, -0.6], [2.6, -0.6], [3.8, 5.6], [-3.8, 5.6]], p.main), ...scallops(-3.4, 3.4, 5.6, 4, 0.5, lighter(p.main, 0.2)), star(0.4, 2.2, 0.8, GOLD)],
  swsailor: (p) => [E(0, 0.6, 3, 2.4, p.main), F(R(-2.6, 1.6, 5.2, 0.7, GOLD))],
  // The yukata's wide hanging furisode sleeve, printed with a firework.
  yukata: (p) => [T([[-2.4, -0.6], [2.8, -0.6], [3.6, 6.4], [1.4, 9], [-2.8, 8], [-3, 2]], p.main), ...burst(0.4, 4.6, 1.6, GOLD, 6), F(limb(-2.6, 7.6, 1.4, 8.6, 0.6, 0.6, darker(p.main, 0.2)))],
  // Puffed sleeves with a bell of lace.
  gothic: (p) => [E(0, 0.6, 3.2, 2.8, p.main), F(E(-0.6, -0.4, 1.4, 0.9, lighter(p.main, 0.12))), frill(-3.2, 3.2, 2.2, -3.8, 3.8, 4.8, 4, 0.7, WHITE), ...scallops(-2.8, 2.8, 4.6, 4, 0.4, RED)],
  pajamas: (p) => [E(0, 0.6, 2.8, 2.6, p.main), sparkle(0.6, 0.4, 0.6)],
  astronaut: (p) => [E(0, 0.8, 3.2, 3, p.main), F(R(-3, 2, 6, 0.9, '#ff8a3c')), F(E(-0.8, -0.2, 1.2, 0.8, WHITE))],
  // The detective's inverness capelet over each shoulder.
  detective: (p) => [T([[-3, -0.8], [3, -0.8], [3.8, 5.4], [-3.6, 5.4]], p.main), ...[-1.6, 0.6, 2.6].map((x) => F(R(x, -0.4, 0.4, 5.6, darker(p.main, 0.16)))), F(R(-3.6, 5, 7.4, 0.6, darker(p.main, 0.25)))],
  ballgown: (p) => [frill(-2.6, 2.6, 0, -3.2, 3.2, 2.6, 3, 0.6, p.light), F(E(0, 1.6, 0.6, 0.6, GOLD))],
  tuxedo: (p) => [E(0, 0.6, 2.6, 2.2, p.main), F(R(-2.4, -0.4, 4.8, 0.8, lighter(p.main, 0.12)))],
  cheer: () => [],
  // Gold-fringed epaulettes.
  pirate: () => [E(0, 0.2, 3.2, 1.8, GOLD), ...ring(6, (i) => F(R(-2.8 + i * 1.1, 1.4, 0.5, 1.8, GOLD_DK))), F(E(0, 0, 1.2, 0.8, lighter(GOLD, 0.2)))],
  // A sheer sea-foam sleeve.
  mermaid: () => [T([[-2.4, -0.4], [2.4, -0.4], [3.4, 4.4], [-3.4, 4.4]], '#e6f8ff'), ...scallops(-3, 3, 4.4, 4, 0.4, PEARL)],
  aviator: (p) => [E(0, 0.6, 2.8, 2.4, p.main), R(-1.6, 1.4, 3.2, 1.6, '#2a4a8a'), F(star(0, 2.2, 0.6, WHITE))],
  // Fur puffs.
  snow: (p) => [E(0, 0.6, 3, 2.6, WHITE), ...scallops(-2.6, 2.6, 2.8, 4, 0.6, '#f8f4ec'), ...flake(0, 0.4, 0.8, p.main)],
};

// ---------- Legs ----------

const LEGS = {
  cbledger: () => ({ top: '#2a2233', low: '#2a2233', pad: null }),
  cbhalvard: () => ({ top: '#5a5a4a', low: '#5a5a4a', pad: '#6a4a30' }),
  cbpenny: () => ({ top: '#fff6ec', low: '#fff6ec', pad: null, cuff: '#7fcfb0' }),
  cbjuniper: () => ({ top: '#fff0d8', low: '#fff0d8', pad: null }),
  cbwendell: () => ({ top: '#8a6a4a', low: '#8a6a4a', pad: null }),
  cbtilly: (p, s) => ({ top: s, low: '#ffb0c8', pad: null, cuff: WHITE }),
  kinakoday: (p, s) => ({ top: '#b07a4a', low: s, pad: null, cuff: '#fff6ec' }),
  kinakonight: () => ({ top: '#2a2438', low: '#2a2438', pad: null }),
  cbmoth: () => ({ top: '#2a2036', low: '#2a2036', pad: null }),
  swbaker: () => ({ top: WHITE, low: WHITE, pad: null, cuff: '#ffd2e0' }),
  swpoet: () => ({ top: '#3a4a7a', low: '#3a4a7a', pad: null }),
  swknight: () => ({ top: '#6a5a7a', low: '#dfe6f2', pad: '#b8c4d8' }),
  swfox: (p) => ({ top: p.main, low: p.main, pad: null, cuff: WHITE }),
  swstar: (p) => ({ top: p.main, low: p.main, pad: null }),
  swsailor: (p, s) => ({ top: '#2a3a6a', low: s, pad: null, cuff: '#2a3a6a' }),
  yukata: (p) => ({ top: p.main, low: p.main, pad: null, cuff: WHITE }),
  gothic: () => ({ top: '#e8e0ee', low: '#e8e0ee', pad: null, cuff: INK }),
  pajamas: (p) => ({ top: p.main, low: p.main, pad: null, cuff: WHITE }),
  astronaut: (p) => ({ top: p.main, low: p.main, pad: '#c8ccd8' }),
  detective: () => ({ top: '#4a4458', low: '#4a4458', pad: null }),
  ballgown: (p, s) => ({ top: s, low: s, pad: null }),
  tuxedo: (p) => ({ top: p.main, low: p.main, pad: null }),
  cheer: (p, s) => ({ top: s, low: WHITE, pad: null, cuff: p.main }),
  pirate: () => ({ top: SHIRT, low: '#2a1e1a', pad: null }),
  mermaid: (p) => ({ top: p.main, low: p.main, pad: null }),
  aviator: () => ({ top: '#7a8a5a', low: '#7a8a5a', pad: '#6a7a4a' }),
  snow: () => ({ top: WHITE, low: WHITE, pad: null }),
};

// ---------- Skirts, coats and tails over the legs ----------

const SKIRTS = {
  // Ledger's frock coat skirts, split up the front over a lilac lining, a gold band at the hem.
  cbledger: (p) => [skirt(44, 5, p.main), T([[MID - 1, 34.6], [MID + 1, 34.6], [MID + 2.6, 44], [MID - 2.6, 44]], '#c8a0d8'), skirtBand(44, 5, 34.2, 42.8, 44, GOLD)],
  // Halvard's quilted coat skirt to mid-thigh, quilting running on down it.
  cbhalvard: (p) => [skirt(40, 2.4, p.main), ...[12, MID, 19].map((x) => F(R(x - 0.2, 35.4, 0.4, 4.4, darker(p.main, 0.14)))), skirtBand(40, 2.4, 34.2, 39, 40, darker(p.main, 0.2))],
  // Penny's pleated navy skirt.
  cbpenny: () => [skirt(42, 3, '#3a4a7a'), ...[11.4, 13.6, MID + 0.4, 17.8, 20].map((x) => F(R(x - 0.2, 35, 0.4, 6.6, '#2a3a6a'))), skirtBand(42, 3, 34.2, 41.2, 42, '#5a6a9a')],
  // Juniper's long rust skirt with the cream apron down the front, a scalloped apron hem.
  cbjuniper: (p) => [skirt(46, 4.4, p.main), T([[MID - 4.2, 35], [MID + 4.2, 35], [MID + 5.2, 44], [MID - 5.2, 44]], '#fff0d8'), ...scallops(MID - 5, MID + 5, 44, 6, 0.6, '#fff0d8'), F(R(MID + 1.6, 38, 2.4, 2, '#f0dcc0'))],
  // Kinako's apron skirt, pink and white stripes, a scalloped white hem; at night, the coat's long
  // skirts split up the front over a purple lining.
  kinakoday: () => [skirt(39.6, 2.2, '#ff9ec0'), ...[12, MID, 19].map((x) => F(R(x - 0.4, 35, 0.8, 4.4, '#ffe4ee'))), ...scallops(MID - 6, MID + 6, 39.6, 6, 0.5, WHITE)],
  kinakonight: () => [skirt(45, 4.4, '#3a2e4a'), T([[MID - 0.8, 34.6], [MID + 0.8, 34.6], [MID + 2.4, 45], [MID - 2.4, 45]], '#5a4a7a'), skirtBand(45, 4.4, 34.2, 44, 45, '#241c30')],
  // Tilly's navy shorts, just peeking under her waistcoat.
  cbtilly: () => [skirt(38.6, 1.2, '#3a4a7a'), F(R(MID - 0.2, 35.6, 0.4, 3, '#2a3a6a'))],
  // The Moth's long robe, and over it a shorter lavender layer with a ragged wing-edge hem and two
  // eyespots, like folded moth wings.
  cbmoth: (p) => [skirt(48, 6, p.main), skirt(43, 4.6, '#5a4a7a'), ...scallops(MID - 5.8, MID + 5.8, 43, 6, 0.8, '#5a4a7a'), ...[[MID - 3.2, 39.6], [MID + 3.2, 39.6]].flatMap(([x, y]) => [E(x, y, 1.3, 1.2, '#c9b8e8'), F(E(x, y, 0.6, 0.55, '#2a2036'))])],
  // Poppy: a pink skirt to the knee with a white apron panel and a scalloped hem.
  swbaker: (p) => [skirt(45, 4, p.main), T([[MID - 3.6, 35], [MID + 3.6, 35], [MID + 4.6, 44], [MID - 4.6, 44]], '#fff6ec'), ...scallops(MID - 4.6, MID + 4.6, 44, 5, 0.6, WHITE),
    ...[[13.2, 38.4], [17.6, 39.8], [15, 42]].flatMap(([x, y]) => [E(x, y, 0.9, 1, RED), F(E(x, y - 0.9, 0.7, 0.35, '#5fbf7a'))]), ...scallops(6.6, 24.4, 45, 9, 0.5, darker(p.main, 0.12))],
  // Lark: the sweater's long hem over the trousers.
  swpoet: (p) => [skirt(39.4, 1, p.main), skirtBand(39.4, 1, 34.2, 38.2, 39.4, darker(p.main, 0.16))],
  // Rowan: the tabard to the knee over mail, its sun again.
  swknight: (p) => [skirt(44, 1.4, '#b8c4d8'), T([[MID - 3.2, 35], [MID + 3.2, 35], [MID + 3.6, 46], [MID - 3.6, 46]], p.main), ...burst(MID, 41, 1.8, GOLD, 6), F(R(MID - 3.6, 45.2, 7.2, 0.8, GOLD))],
  // Yuzu: a red-orange hakama, pleated, to the ankle.
  swfox: (p) => [skirt(52, 3, p.main, 34.6), ...[12.4, 15.5, 18.6].map((x) => F(limb(x, 36, x + (x - MID) * 0.4, 52, 0.4, 0.4, darker(p.main, 0.15)))), skirtBand(52, 3, 34.6, 34.6, 36, RED)],
  // Celeste: the robe to the floor, stars scattered, a silver hem.
  swstar: (p) => [skirt(55, 4.6, p.main), ...[[10.6, 40], [20, 42.6], [13, 48], [18.6, 51], [MID, 44.6]].map(([x, y], i) => (i % 2 ? sparkle(x, y, 0.8, '#c8c8ff') : star(x, y, 0.9, GOLD))), skirtBand(55, 4.6, 34.2, 53.8, 55, '#c8c8ff')],
  // Marlowe: the jacket's open skirts over rolled-up trousers.
  swsailor: (p) => [T([[9.4, 34.4], [12.8, 34.4], [12.6, 40], [8.6, 40]], p.main), T([[18.2, 34.4], [21.6, 34.4], [22.4, 40], [18.4, 40]], p.main), R(9.6, 34.4, 12, 1.4, '#7a5a3a'), F(R(MID - 0.6, 34.6, 1.2, 1, GOLD))],
  // Straight to the ankles with fireworks bursting over it, the overlap running down the front.
  yukata: (p) => [skirt(52, 0.6, p.main, 34.8), T([[MID + 1.4, 35], [MID + 3, 35], [MID + 5, 52], [MID + 2.8, 52]], p.deep), skirtBand(52, 0.6, 34.8, 50.6, 52, darker(p.main, 0.2)),
    ...burst(12, 41, 2.6, GOLD), ...burst(18.6, 46.4, 2.2, '#ff9ec0'), ...burst(11.4, 49, 1.4, '#8fd3ff', 6), sparkle(20, 40, 0.8, GOLD), sparkle(15, 44.6, 0.6)],
  // Three tiers of black and lace with a red ribbon band and roses on the hip.
  gothic: (p) => [frill(9.6, 21.6, 34.6, 4.4, 26.8, 46.4, 10, 1, WHITE), skirt(45, 5, p.main), skirtBand(45, 5, 34.2, 38.6, 39.6, RED),
    frill(6.4, 24.6, 40.6, 5.4, 25.6, 43.4, 9, 0.8, WHITE), frill(7.4, 23.6, 40, 6.6, 24.4, 41.8, 9, 0.6, p.main), ...scallops(5.6, 25.4, 45.4, 10, 0.5, RED),
    ...rose(20.8, 36.4, 1.5, RED, '#8e1c2c'), ...rose(22.2, 38, 1.1, RED, '#8e1c2c'), leaf(19.4, 37.4, 1.8, 0.5, 150, '#3f7a4a')],
  pajamas: () => null,
  astronaut: () => null,
  // The frock coat's skirts to the knee, open at the front.
  detective: (p) => [skirt(46.6, 1.8, p.main), ...[12, 19].map((x) => F(R(x - 0.2, 35, 0.4, 11.4, darker(p.main, 0.16)))), F(R(9, 40.6, 13.6, 0.4, darker(p.main, 0.16))),
    T([[MID - 0.4, 35], [MID + 0.4, 35], [MID + 1.8, 46.6], [MID - 1.8, 46.6]], '#4a4458'), ...[38, 41.4].map((y) => button(MID + 2.2, y, GOLD))],
  // A huge gown to the floor: tiers in deepening shades, stars and a gold hem.
  ballgown: (p) => [skirt(55.6, 10, lighter(p.main, 0.2)), skirt(54.4, 8.4, p.main), skirt(46, 5.4, lighter(p.main, 0.1)), skirt(40, 3, p.light),
    ...scallops(5.8, 25.2, 46, 9, 0.6, WHITE), ...scallops(7.6, 23.6, 40, 7, 0.5, GOLD), skirtBand(55.6, 10, 34.2, 54.4, 55.6, GOLD),
    ...[[8, 50], [23, 49], [12, 53], [19.6, 52.6], [10.4, 44], [21, 43.4], [MID, 49.6]].map(([x, y], i) => (i % 2 ? sparkle(x, y, 0.9) : star(x, y, 0.8, WHITE)))],
  // Trousers with a satin stripe.
  tuxedo: (p) => [R(9.6, 34.4, 12, 1.6, p.main), F(R(9.6, 34.4, 12, 0.6, lighter(p.main, 0.12)))],
  // A pleated skirt with white kick pleats and a star.
  cheer: (p) => [skirt(42.6, 3.4, p.main, 32.2), ...[12.4, 15.6, 18.8].map((x) => T([[x - 0.6, 36], [x + 0.6, 36], [x + 1.4 + (x - MID) * 0.3, 42.6], [x - 1.4 + (x - MID) * 0.3, 42.6]], WHITE)),
    skirtBand(42.6, 3.4, 32.2, 32.2, 33.6, GOLD), skirtBand(42.6, 3.4, 32.2, 41.6, 42.6, WHITE), star(19.6, 38, 1, GOLD)],
  // The captain's coat skirts flaring to the knee, gold-trimmed, over breeches.
  pirate: (p) => [skirt(47, 3, p.main), T([[MID - 0.6, 35], [MID + 0.6, 35], [MID + 3, 47], [MID - 3, 47]], SHIRT), skirtBand(47, 3, 34.2, 45.8, 47, GOLD),
    ...[38, 41, 44].map((y) => button(MID + 1.6 + (y - 38) * 0.2, y, GOLD)), T([[18.6, 35], [20, 35], [21.6, 41], [19.2, 40.4]], '#2a4a8a')],
  // A fish tail to the floor: scales, a fin flaring at the hem, pearls at the waist.
  mermaid: (p) => {
    const tailPts = [[9.6, 34.4], [21.4, 34.4], [22.4, 40], [21, 46], [19.4, 51.4], [25.6, 55.6], [22, 56.4], [MID, 54.6], [9, 56.4], [5.4, 55.6], [11.6, 51.4], [10, 46], [8.6, 40]];
    const scales = [];
    for (let row = 0; row < 6; row++) {
      const y = 37 + row * 2.6;
      const w = 5.6 - row * 0.5;
      for (let i = 0; i < 4; i++) {
        const x = MID - w + (i + (row % 2) * 0.5) * ((w * 2) / 4);
        if (x > MID - w && x < MID + w) scales.push(F(hoop(x, y, 1.1, 1, 0.6, 0.5, darker(p.main, 0.16), 0, 180, 6)));
      }
    }
    return [T(tailPts, p.main), side(tailPts, 12.6, -1, darker(p.main, 0.1)), ...scales, T([[11.6, 51.4], [19.4, 51.4], [25.6, 55.6], [22, 56.4], [MID, 54.6], [9, 56.4], [5.4, 55.6]], lighter(p.main, 0.15)),
      ...ring(4, (i) => F(limb(MID, 52.4, 7 + i * 5.6, 55.6, 0.3, 0.3, lighter(p.main, 0.3)))), ...scallops(10, 21, 34.8, 8, 0.55, PEARL), sparkle(18.4, 43, 0.8), sparkle(12.4, 48, 0.6)];
  },
  // Cargo trousers with a belt.
  aviator: () => [R(9.6, 34.6, 12, 1.4, '#5a4a38'), F(R(MID - 0.6, 34.8, 1.2, 1, GOLD))],
  // A full fur-trimmed coat skirt, blue underneath, snowflakes.
  snow: (p) => [skirt(47.4, 5, p.main), skirt(46, 4, WHITE), T([[MID - 1, 35.6], [MID + 1, 35.6], [MID + 4.6, 46], [MID - 4.6, 46]], p.main), ...scallops(5.4, 25.6, 46.6, 10, 0.7, '#f8f4ec'),
    ...flake(10.4, 41, 1.1, p.main), ...flake(20.6, 43, 1, p.main), ...flake(MID, 44, 0.8, WHITE), sparkle(12.4, 37.6, 0.6, '#cfe8ff')],
};

// ---------- Shoes (in the foot's frame: x toward the toe, y down to the sole) ----------

const SHOES = {
  // Ledger's heeled boots with a gold buckle; Halvard's tall worn boots folded at the cuff; Penny's
  // penny loafers (a gold coin in each); Juniper's wooden clogs; Wendell's plaid slippers; Tilly's
  // high-tops; the Moth's soft pom-pom slippers.
  cbledger: (p, k, c) => [k.shaft(4.2, c('#2a2233'), 3.2), k.sole(c('#1a1422')), k.poly([[-2.6, 2.2], [-1.6, 2.2], [-1.8, 3.8], [-2.6, 3.8]], c('#1a1422')), k.dot(1, -0.6, 0.45, c(GOLD))],
  cbhalvard: (p, k, c) => [k.shaft(6.4, c('#4a3424'), 3.4), k.sole(c('#2a1e14')), k.shaft(1.4, c('#6a4a30'), 3.8), k.dot(0.6, -2.8, 0.35, c(GOLD))],
  cbpenny: (p, k, c) => [k.sole(c('#5a3a2a')), k.poly([[-2.6, -0.6], [2.6, -0.6], [2.8, 1.6], [-2.8, 1.6]], c('#6a4430')), k.dot(0.8, -0.2, 0.55, c(GOLD))],
  cbjuniper: (p, k, c) => [k.poly([[-3, -0.4], [3, -0.4], [3.4, 2.4], [-3.2, 2.4]], c('#b8844a')), k.poly([[-3.2, 2.4], [3.4, 2.4], [3.2, 3.4], [-3, 3.4]], c('#8a5a2a')), k.poly([[-2, -0.6], [2, -0.6], [2, 0.4], [-2, 0.4]], c(p.main))],
  cbwendell: (p, k, c) => [k.poly([[-3, -0.4], [3, -0.4], [3.6, 2], [3, 3], [-3, 3], [-3.4, 2]], c('#a84a4a')), k.poly([[-2.6, 0.6], [2.6, 0.6], [2.6, 1.2], [-2.6, 1.2]], c('#e8c87a')), k.dot(2.4, 0, 0.5, c('#f4e8d8'))],
  kinakoday: (p, k, c) => [k.sole(c('#5a3a2a')), k.poly([[-2.6, -0.6], [2.6, -0.6], [2.8, 1.6], [-2.8, 1.6]], c('#8a5a3a')), k.dot(0.6, -0.2, 0.5, c('#ff9ec0'))],
  kinakonight: (p, k, c) => [k.sole(c('#1a1622')), k.poly([[-2.6, -0.6], [2.6, -0.6], [2.8, 1.6], [-2.8, 1.6]], c('#241c30'))],
  cbtilly: (p, k, c) => [k.shaft(2.4, c(WHITE), 3), k.sole(c('#e85a6a')), k.poly([[1.4, 0.4], [3.2, 0.4], [3.2, 2.2], [1.4, 2.2]], c(WHITE)), k.dot(0, -0.8, 0.35, c('#e85a6a'))],
  cbmoth: (p, k, c) => [k.sole(c('#2a2036')), k.poly([[-2.8, -0.6], [2.8, -0.6], [3, 1.6], [-3, 1.6]], c('#4a3a5a')), k.dot(2.4, -0.6, 0.8, c('#c9b8e8'))],
  // Red Mary Janes; navy ankle boots; steel sabatons; geta; moon slippers; deck boots.
  swbaker: (p, k, c) => [k.shaft(1.4, c(WHITE), 3), k.sole(c(RED)), k.poly([[-2.4, -0.6], [2.4, -0.6], [2.4, 0], [-2.4, 0]], c(RED)), k.dot(1.4, 0.6, 0.5, c(WHITE))],
  swpoet: (p, k, c) => [k.shaft(3, c('#2a3a6a'), 3.2), k.sole(c('#2a3a6a')), k.poly([[-3, 2.2], [3, 2.2], [2.8, 3.2], [-2.8, 3.2]], c('#1a2440'))],
  swknight: (p, k, c) => [k.shaft(4, c('#dfe6f2'), 3.6), k.sole(c('#b8c4d8')), k.poly([[-3.2, -0.6], [3.2, -0.6], [3.2, 0.4], [-3.2, 0.4]], c(WHITE)), k.dot(1.6, 1.2, 0.5, c(GOLD))],
  swfox: (p, k, c) => [k.shaft(2, c(WHITE), 3), k.poly([[-2.8, 1.6], [2.8, 1.6], [2.8, 3.2], [-2.8, 3.2]], c('#c8905a')), k.poly([[-2.6, 3.2], [-1.6, 3.2], [-1.6, 4], [-2.6, 4]], c('#8a5a3a')), k.poly([[1.6, 3.2], [2.6, 3.2], [2.6, 4], [1.6, 4]], c('#8a5a3a')), k.poly([[-0.4, -0.6], [0.4, -0.6], [1.6, 1.6], [-1.6, 1.6]], c(RED))],
  swstar: (p, k, c) => [k.poly([[-3, -1], [3, -1], [3.4, 2], [3, 3], [-3, 3], [-3.4, 2]], c(lighter(p.main, 0.15))), k.poly([[1.4, -0.8], [3.2, -2], [2.6, 0], [1.6, 0.4]], c(GOLD))],
  swsailor: (p, k, c) => [k.shaft(4.4, c('#5a3a2a'), 3.2), k.sole(c('#3a2418')), k.shaft(1, c('#7a5a3a'), 3.6), k.dot(0.4, -2.4, 0.4, c(GOLD))],
  yukata: (p, k, c) => [k.shaft(2, c(WHITE), 3), k.poly([[-2.8, 1.6], [2.8, 1.6], [2.8, 3.2], [-2.8, 3.2]], c('#c8905a')), k.poly([[-2.6, 3.2], [-1.6, 3.2], [-1.6, 4], [-2.6, 4]], c('#8a5a3a')), k.poly([[1.6, 3.2], [2.6, 3.2], [2.6, 4], [1.6, 4]], c('#8a5a3a')),
    k.poly([[-2.4, -0.4], [2.4, -0.4], [2.6, 1.6], [-2.6, 1.6]], c(WHITE)), k.poly([[-0.4, -0.6], [0.4, -0.6], [1.6, 1.6], [-1.6, 1.6]], c(RED))],
  // Platform Mary Janes with a bow.
  gothic: (p, k, c) => [k.shaft(1.4, c('#e8e0ee'), 3), k.sole(c(INK)), k.poly([[-3, 2], [3, 2], [3, 3.6], [-3, 3.6]], c('#1a1422')), k.poly([[-2.4, -0.8], [2.4, -0.8], [2.4, -0.1], [-2.4, -0.1]], c(INK)), k.dot(1.6, -0.4, 0.6, c(RED)), k.dot(-0.6, 1, 0.4, c(WHITE))],
  // Bunny slippers: long ears, pink inner, a nose.
  pajamas: (p, k, c) => [k.poly([[-1.4, -1], [-2.2, -5], [-0.8, -5.2], [0, -1]], c(WHITE)), k.poly([[0.4, -1], [1, -5], [2.2, -4.6], [1.6, -1]], c(WHITE)), k.poly([[-1.6, -1.4], [-1.9, -4.4], [-1.1, -4.4], [-0.6, -1.4]], c('#ffc2d6')),
    k.poly([[-3, -1], [3, -1], [3.4, 2], [3, 3], [-3, 3], [-3.4, 2]], c(WHITE)), k.dot(2.4, 0.8, 0.5, c('#ff8fb0')), k.dot(1.2, -0.2, 0.3, c(INK))],
  astronaut: (p, k, c) => [k.shaft(5, c(p.main), 3.8), k.poly([[-3.2, -1.6], [3.2, -1.6], [3.6, 2], [-3.6, 2]], c(p.main)), k.poly([[-3.6, 2], [3.6, 2], [3.4, 3.6], [-3.4, 3.6]], c('#8a92a8')),
    k.poly([[-3, -0.4], [3, -0.4], [3, 0.4], [-3, 0.4]], c('#ff8a3c'))],
  detective: (p, k, c) => [k.shaft(3.6, c('#6a4430'), 3.1), k.sole(c('#6a4430')), k.poly([[-2.8, 2.2], [2.8, 2.2], [2.6, 3], [-2.6, 3]], c('#3a2418')), k.dot(0.6, -1.6, 0.35, c(GOLD)), k.dot(0.6, -0.6, 0.35, c(GOLD))],
  // Glass slippers.
  ballgown: (p, k, c) => [k.sole(c('#e6f2ff')), k.poly([[-2.6, 2.2], [-1.8, 2.2], [-1.8, 3.6], [-2.6, 3.6]], c('#c8dcf6')), k.dot(1.4, 0, 0.7, c(p.light)), k.dot(0.6, -0.8, 0.35, c(WHITE)), k.dot(-1.2, 0.6, 0.3, c(WHITE))],
  tuxedo: (p, k, c) => [k.sole(c(INK)), k.shaft(1.6, c(WHITE), 3), k.dot(1.2, 0.2, 0.45, c(WHITE))],
  cheer: (p, k, c) => [k.shaft(2.6, c(WHITE), 3), k.sole(c(WHITE)), k.poly([[-2.6, 1.6], [2.6, 1.6], [2.8, 3], [-2.8, 3]], c(p.main)), k.dot(0.4, 0, 0.5, c(GOLD))],
  // Tall cuffed boots with a buckle.
  pirate: (p, k, c) => [k.shaft(7.6, c('#2a1e1a'), 3.4), k.sole(c('#2a1e1a')), k.shaft(1.2, c('#4a3428'), 3.8), k.poly([[-1, -1.4], [1, -1.4], [1, -0.4], [-1, -0.4]], c(GOLD))],
  mermaid: () => [],
  // Lace-up flight boots.
  aviator: (p, k, c) => [k.shaft(4.6, c('#3a2418'), 3.2), k.sole(c('#3a2418')), k.poly([[-3, 2.2], [3, 2.2], [2.8, 3.2], [-2.8, 3.2]], c('#1a120c')), k.dot(0.6, -2.4, 0.3, c(SHIRT)), k.dot(0.6, -1.2, 0.3, c(SHIRT))],
  // Fur-topped white boots.
  snow: (p, k, c) => [k.shaft(4.4, c(WHITE), 3.2), k.sole(c(WHITE)), k.shaft(1.4, c('#f8f4ec'), 4), k.poly([[-3, 2.2], [3, 2.2], [2.8, 3.2], [-2.8, 3.2]], c(p.main)), k.dot(1.2, -0.8, 0.5, c('#8fe8ff'))],
};

// ---------- Headpieces ----------

const HATS = {
  // Ledger: a little top hat worn tipped over one side, a plum band, and a curling feather.
  cbledger: (p) => [T([[16, 2.4], [24.6, 1], [24.4, -5.4], [17, -4.6]], '#2a2233'), F(T([[16.4, 0.4], [24.6, -1], [24.6, 0.6], [16.4, 2]], p.main)), E(20.4, 2.4, 6.6, 1.4, '#2a2233'), F(E(19, 2, 3, 0.5, '#4a3a55')),
    F(limb(23.6, 0, 26.8, -6, 0.9, 0.2, '#c9a6ff')), F(limb(24.4, -1.4, 27.6, -4.4, 0.5, 0.15, '#e8dcf4')), sparkle(17.6, -3.6, 0.5, WHITE)],
  // Penny: a green accountant's visor, its clear brim tinted mint over her brow.
  cbpenny: () => [F(R(5.4, 6.4, 20.2, 1.6, '#3a8a6a')), T([[16, 7.4], [27.6, 7.6], [28.6, 10], [17, 9.2]], '#9fe0c0'), F(T([[18, 8], [27, 8.2], [27.4, 8.8], [18.4, 8.6]], '#d8fff0')), F(limb(16, 7.6, 27.6, 7.8, 0.4, 0.4, '#5fb88a'))],
  // Juniper: a polka-dot kerchief tied as a band round her bun, its knot and two tips at the side.
  cbjuniper: () => [T([[5.6, 6], [25.4, 6], [25, 3.4], [6, 3.4]], '#e8504a'), ...[8, 11.6, 15.2, 18.8, 22.4].map((x) => F(E(x, 4.8, 0.55, 0.55, WHITE))), E(25.8, 4.8, 1.4, 1.2, '#e8504a'), T([[26.4, 4.8], [29.6, 3.2], [29, 6]], '#e8504a'), T([[26.4, 5.2], [28.6, 7.8], [26.4, 8]], '#c8403a')],
  // Old Wendell: a tweed flat cap, its peak pulled down at the front.
  cbwendell: () => [dome(15.5, 8.4, 11.4, 6.6, '#7a6a5a'), T([[18.6, 7.6], [29.6, 8], [29.2, 10], [18.6, 9.6]], '#6a5a4a'), ...[9, 12.6, 16.2, 19.8].map((x) => F(limb(x, 3.4, x + 2, 7.4, 0.25, 0.25, '#5a4a3a'))), F(E(15.5, 1.8, 0.8, 0.6, '#5a4a3a'))],
  // Tilly: a puffy newsboy cap with a button on top and a playing card tucked in its band.
  // Kinako's straw boater with a pink band and a little flower; at night, a flat cap pulled low.
  kinakoday: () => [E(15.5, 7.6, 13.4, 2.2, '#f2d08a'), F(E(15.5, 7.2, 12, 1.4, '#f8e0a8')), R(9.2, 1.6, 12.6, 6, '#f2d08a'), F(R(9.2, 1.6, 12.6, 1, '#f8e4b4')),
    F(R(9.2, 5, 12.6, 1.6, '#ff8fb0')), F(E(20, 5.8, 1.2, 1.2, WHITE)), F(E(20, 5.8, 0.5, 0.5, '#ffd66b')), ...[10.6, 13, 15.4, 17.8].map((x) => F(R(x, 2.2, 0.4, 2.6, '#e2bc72')))],
  kinakonight: () => [dome(15.5, 8.6, 11.8, 6.4, '#3a2e4a'), F(R(4.4, 7.6, 22.2, 1.4, '#241c30')), T([[16, 8.2], [28.4, 8.6], [27.6, 10.4], [16, 9.6]], '#2e2440'), F(E(15.5, 2.6, 0.9, 0.8, '#5a4a72')),
    ...[9, 12.4, 15.8, 19.2].map((x) => F(limb(x, 3.6, x + 0.6, 7.4, 0.25, 0.25, '#4e3e62')))],
  cbtilly: (p) => [dome(15.5, 8.2, 11.6, 7, p.main), F(R(4.6, 7, 21.8, 1.4, darker(p.main, 0.2))), T([[19, 7.8], [28.8, 8.2], [28, 9.8], [19, 9.4]], darker(p.main, 0.12)), F(E(15.5, 1.4, 1, 0.8, darker(p.main, 0.2))),
    T([[7.6, 7.4], [10.6, 6.4], [11.8, 10.6], [8.8, 11.6]], WHITE), F(T([[9.8, 8.4], [10.4, 9], [9.8, 9.6], [9.2, 9]], '#e85a6a'))],
  // The Masked Moth: a thin gold circlet with a crescent moon at the brow and beads hanging from it,
  // and her own mask, a moth across her eyes: a forewing sweeping up from each eye to the temple
  // and a smaller hindwing below it, fuzzy pale edges, an eyespot on each forewing, gold rims round
  // the eye holes (her eyes show through), and the moth's fuzzy little body on the bridge of her nose.
  cbmoth: () => {
    const mask = [[11.2, 18.2, -1], [19.8, 18.2, 1]].flatMap(([x, y, o]) => [
      T([[x + 1.2 * o, y - 2.4], [x + 3.6 * o, y - 6.6], [x + 7.4 * o, y - 8.4], [x + 8 * o, y - 4.6], [x + 6 * o, y - 0.6], [x + 3 * o, y + 0.4]], '#efe6fa'),
      F(T([[x + 2.2 * o, y - 3], [x + 4.4 * o, y - 6.4], [x + 6.8 * o, y - 7.4], [x + 6.6 * o, y - 4.4], [x + 4.6 * o, y - 2]], '#ffffff')), F(limb(x + 2 * o, y - 2.6, x + 7 * o, y - 7.6, 0.25, 0.25, '#b8a0e0')), F(limb(x + 3 * o, y - 1.2, x + 7.6 * o, y - 4.4, 0.25, 0.25, '#b8a0e0')),
      T([[x + 2.6 * o, y + 1], [x + 5.8 * o, y + 0.2], [x + 6.6 * o, y + 3.2], [x + 4 * o, y + 4.2], [x + 2 * o, y + 2.6]], '#d8c8f0'),
      ...scallops(x + 4 * o, x + 7.6 * o, y - 8, 3, 0.55, '#ffffff'), ...scallops(x + 4 * o, x + 6.4 * o, y + 3.8, 2, 0.45, '#ffffff'),
      E(x + 5.4 * o, y - 4.6, 1.4, 1.3, '#7a5ac8'), F(E(x + 5.4 * o, y - 4.6, 0.9, 0.85, GOLD)), F(E(x + 5.4 * o, y - 4.6, 0.45, 0.42, '#2a2036')), F(E(x + 5.1 * o, y - 4.9, 0.25, 0.25, WHITE)),
      hoop(x, y + 0.1, 3, 2.6, 2.2, 1.8, '#efe6fa', 0, 360, 16), F(hoop(x, y + 0.1, 2.4, 2, 2.2, 1.8, '#b8a0e0', 0, 360, 14)),
    ]);
    const body = [E(15.5, 17.4, 1.2, 2.2, '#efe6fa'), ...ring(4, (i) => F(R(14.5, 15.8 + i * 0.9, 2, 0.35, '#b8a0e0'))), F(E(15.5, 15, 0.8, 0.7, WHITE))];
    return [F(limb(5.6, 8.4, 25.4, 8.4, 0.5, 0.5, GOLD)), E(15.5, 7.2, 1.8, 1.8, GOLD), F(E(16.3, 6.8, 1.5, 1.5, '#3a2a4a')), ...[11.6, 13.4, 17.6, 19.4].map((x, i) => F(E(x, 9.6 + (i % 2) * 0.6, 0.45, 0.45, i % 2 ? '#c9a6ff' : GOLD))), ...mask, ...body];
  },
  // Poppy: a big cream kerchief bow on top of her buns, a strawberry clip, a dusting of flour.
  swbaker: () => [T([[15.5, 1.6], [9.4, -2.4], [8.4, 1.8], [9.8, 4.4], [15.5, 2.8]], '#fff6ec'), T([[15.5, 1.6], [21.6, -2.4], [22.6, 1.8], [21.2, 4.4], [15.5, 2.8]], '#fff6ec'),
    F(T([[15.5, 1.8], [10.4, -0.8], [10, 1.6], [15.5, 2.4]], WHITE)), E(15.5, 2.2, 1.6, 1.4, '#ffd2e0'), E(22.6, 7.4, 1.6, 1.8, RED), F(E(22.6, 6, 1.2, 0.6, '#5fbf7a')), sparkle(8.2, 4.6, 0.7, WHITE), sparkle(24, 2.6, 0.6, WHITE)],
  // Lark: a little shell clip holding back the far side of her fringe.
  swpoet: () => [T([[21.6, 7.6], [24.4, 5.4], [26, 8.6]], '#ffd2e0'), ...ring(4, (i) => F(limb(23.8, 8, 22 + i * 1.2, 6, 0.2, 0.2, '#e8a0b8')))],
  // Rowan: a daisy tucked behind his ear.
  swknight: () => [...ring(7, (i) => F(E(23.6 + Math.cos((i / 7) * Math.PI * 2) * 1.4, 11 + Math.sin((i / 7) * Math.PI * 2) * 1.4, 0.9, 0.9, WHITE))), E(23.6, 11, 0.8, 0.8, GOLD), leaf(22.2, 12, 2, 0.5, 150, '#5fbf7a')],
  // Yuzu: a white fox mask tipped up on the side of her head, red markings, and a maple leaf.
  swfox: () => [E(7, 6.6, 3, 3.4, WHITE), T([[4.6, 4.6], [5.4, 2.4], [6.4, 4.2]], WHITE), T([[7.6, 4.2], [8.6, 2.4], [9.4, 4.6]], WHITE), F(limb(5.2, 6.4, 6.4, 7, 0.4, 0.3, RED)), F(limb(8.8, 6.4, 7.6, 7, 0.4, 0.3, RED)), F(E(7, 8.6, 0.5, 0.3, RED)),
    leaf(24, 4, 2.6, 0.9, -60, '#ff7a4a'), leaf(24, 4, 2.2, 0.8, -100, '#ffb04a'), leaf(24, 4, 2.2, 0.8, -20, '#ffb04a')],
  // Celeste: a long floppy nightcap with a star pompom that bobs and swings.
  swstar: (p, m) => {
    const s = (m?.hair ?? 0) * 0.8;
    return [hoop(15.5, 12.4, 12.4, 11.8, 10.6, 10, p.main, 190, 350, 16), T([[6, 3], [25, 3], [28 + s, 8], [31 + s * 1.4, 15], [27.4 + s * 1.2, 13], [23, 6]], p.main),
      ...scallops(4, 27, 4.4, 9, 0.7, lighter(p.main, 0.25)), star(10, 1, 0.8, GOLD), star(19, 0.4, 0.7, GOLD), star(31 + s * 1.4, 16, 1.8, GOLD), F(star(31 + s * 1.4, 16, 0.9, '#fff2a8'))];
  },
  // Marlowe: a captain's cap tipped back, an anchor badge, a gold cord.
  swsailor: () => [dome(15.5, 6.6, 10.4, 5.4, WHITE), T([[4.4, 6.6], [26.6, 6.6], [27.4, 8.6], [3.6, 8.6]], '#2a3a6a'), T([[17, 8.4], [27, 8.4], [29.6, 10.6], [18, 10]], '#1a2440'), F(R(5, 6.2, 21, 0.8, GOLD)),
    F(E(15.5, 4, 1.4, 1.4, GOLD)), F(limb(15.5, 3, 15.5, 5.2, 0.35, 0.35, '#2a3a6a')), F(limb(14.4, 4.8, 16.6, 4.8, 0.3, 0.3, '#2a3a6a'))],
  // A big kanzashi: a cluster of flowers with dangling strands of tiny blossoms that sway, and a
  // festival mask tipped up on the far side.
  yukata: (p, m) => {
    const s = (m?.hair ?? 0) * 0.4;
    const out = [...flower(22.6, 6.4, 2.6, '#ff9ec0', GOLD), ...flower(25.4, 8.6, 1.8, WHITE, '#ff9ec0'), ...flower(20.4, 4, 1.6, '#ffd6e2', GOLD), leaf(23.6, 3.4, 2.2, 0.6, -40, '#3f9a6a')];
    for (const [x, len] of [[23.4, 8], [25, 9.4], [26.6, 7]]) {
      out.push(F(limb(x, 8.6, x + s, 8.6 + len, 0.25, 0.25, GOLD)));
      for (let i = 1; i <= 3; i++) out.push(F(E(x + s * (i / 3), 8.6 + (len * i) / 3, 0.55, 0.55, i % 2 ? '#ff9ec0' : WHITE)));
    }
    out.push(E(6.6, 7.4, 3, 3.4, WHITE), F(E(5.6, 7, 0.6, 0.4, INK)), F(E(7.8, 7, 0.6, 0.4, INK)), F(limb(5.2, 5.4, 6.2, 6, 0.4, 0.3, RED)), F(limb(8.2, 5.4, 7.2, 6, 0.4, 0.3, RED)), F(E(6.6, 9, 0.6, 0.3, RED)));
    return out;
  },
  // A tilted mini top hat with a dotted net veil, roses and a gem, over a lace headband.
  gothic: (p, m) => {
    const s = (m?.hair ?? 0) * 0.3;
    return [hoop(15.5, 12.4, 12, 11.4, 10.4, 9.8, LACE, 200, 340, 14), ...scallops(6.4, 24.6, 3.2, 9, 0.6, WHITE),
      T([[17, 3.2], [27, 1], [27.4, 2.6], [17.4, 4.8]], INK), T([[18.6, 3.2], [19.6, -3.6], [25.4, -4.8], [25.6, 1.6]], p.main), F(T([[18.9, 1.4], [25.5, 0.2], [25.6, 1.4], [19, 2.6]], RED)),
      ...[[20.6, 6], [23, 5.4], [25.6, 4.8], [21.6, 8.4], [24.6, 7.8], [27, 7.2], [22.8, 10.4]].map(([x, y]) => F(E(x + s * 0.5, y, 0.3, 0.3, INK))),
      F(limb(19.4, 4, 21 + s, 10.6, 0.2, 0.2, INK)), F(limb(26.8, 2.6, 27.6 + s, 8.8, 0.2, 0.2, INK)),
      ...rose(18.4, 2.6, 1.8, RED, '#8e1c2c'), ...rose(16.4, 3.8, 1.2, RED, '#8e1c2c'), leaf(19.6, 3.6, 2, 0.6, 20, '#3f7a4a'), F(E(26.4, -0.6, 0.6, 0.6, GOLD))];
  },
  // A bunny-ear hood: long floppy ears that bounce, stars on the brim.
  pajamas: (p, m) => {
    const s = (m?.hair ?? 0) * 0.6;
    const ear = (x0, dir) => [T([[x0 - 1.6, 4], [x0 + 1.6, 4], [x0 + dir * 4 + s, -6], [x0 + dir * 3 + s, -9.6], [x0 + dir * 0.6 + s, -8]], p.main), F(T([[x0 - 0.6, 3], [x0 + 0.8, 3], [x0 + dir * 3 + s, -6.2], [x0 + dir * 2 + s, -8]], '#ffc2d6'))];
    // (A whole hood over the top of her head, so no hair pokes through it, framed round the face
    // by a fluffy white brim that arcs up over the brow instead of a band straight across it; the
    // sides come down over her cheeks' outer edge like a real hood.)
    const brim = (u) => [3.4 + u * 24.2, 11.2 - Math.sin(u * Math.PI) * 2.4];
    return [...ear(10, -1), ...ear(21, 1), dome(15.5, 11.6, 13.2, 11.4, p.main),
      T([[2.3, 10.6], [6.4, 10.6], [6.2, 20.6], [4.2, 22.2], [2.4, 19.2]], p.main), T([[28.7, 10.6], [24.6, 10.6], [24.8, 20.6], [26.8, 22.2], [28.6, 19.2]], p.main),
      F(T([[2.6, 12], [3.8, 12], [3.8, 20.4], [2.8, 19]], darker(p.main, 0.12))), F(T([[28.4, 12], [27.2, 12], [27.2, 20.4], [28.2, 19]], darker(p.main, 0.12))),
      ...ring(12, (i) => E(...brim(i / 11), 1.25, 1.05, WHITE)), ...ring(11, (i) => F(E(...brim((i + 0.5) / 11), 0.7, 0.55, '#eef0ff'))),
      star(8.4, 5.4, 0.9, '#ffe36b'), star(22.8, 5, 0.9, '#ffe36b'), sparkle(15.5, 2.6, 0.8)];
  },
  // A bubble helmet: rim and shine only (the face shows), an antenna with a blinking light.
  astronaut: (p, m) => [hoop(15.5, 14.4, 15, 14.4, 14, 13.4, '#dfe6f5', 0, 360, 28), F(hoop(15.5, 14.4, 13.2, 12.6, 12.2, 11.6, '#bfe6ff', 200, 262, 6)), F(hoop(15.5, 14.4, 13.2, 12.6, 12.4, 11.8, '#bfe6ff', 20, 50, 4)),
    F(limb(22.4, 3.4, 26, 7, 0.9, 0.5, WHITE)), sparkle(8.4, 6.4, 0.9), limb(24, 1, 27, -4.6, 0.6, 0.4, '#c8ccd8'), F(E(27.2, -5, 1, 1, m?.flap ? '#ff5a5a' : '#ffd34d')),
    T([[5.6, 25.4], [25.4, 25.4], [26.8, 28.6], [4.2, 28.6]], '#c8ccd8'), F(R(5.6, 26.4, 19.8, 0.7, '#ff8a3c'))],
  // A deerstalker with check, ear flaps tied up with a bow, a feather in the band.
  detective: (p) => [dome(15.5, 9.2, 10.8, 7.4, p.main), ...[11, 15.5, 20].map((x) => F(R(x - 0.2, 3, 0.4, 6, darker(p.main, 0.16)))), F(R(6, 5.8, 19, 0.4, darker(p.main, 0.16))),
    F(R(4.8, 7.4, 21.4, 1.4, '#5a4a6a')), T([[22, 8.4], [29.6, 8], [29, 10], [22, 10]], darker(p.main, 0.2)), T([[9, 8.4], [1.4, 8], [2, 10], [9, 10]], darker(p.main, 0.2)),
    ...tieBow(15.5, 1.8, darker(p.main, 0.25)), T([[22.6, 7.6], [25.4, 1], [26.4, 1.6], [23.6, 7.8]], '#3f7a8a'), F(limb(23.2, 7, 25.6, 1.6, 0.25, 0.2, lighter('#3f7a8a', 0.3)))],
  // A tall crown of silver points set with gems.
  ballgown: (p) => [T([[7.6, 6.8], [9.6, 2.6], [11.6, 5], [13.4, 0.4], [15.5, -2.6], [17.6, 0.4], [19.4, 5], [21.4, 2.6], [23.4, 6.8], [23, 8.2], [8, 8.2]], '#e6ecf6'),
    F(T([[8.6, 7.4], [22.4, 7.4], [22.2, 8], [8.8, 8]], '#b8c4dc')), ...gem(15.5, 3.6, 1.6, p.light), ...gem(10.6, 5.4, 0.8, '#ff9ec0'), ...gem(20.4, 5.4, 0.8, '#ff9ec0'),
    ...[[9.6, 2.6], [13.4, 0.4], [17.6, 0.4], [21.4, 2.6]].map(([x, y]) => F(E(x, y, 0.45, 0.45, WHITE))), sparkle(15.5, -3.6, 1), sparkle(24.4, 2.4, 0.7)],
  // A top hat with a red band and a rose, and a white half mask over the far eye.
  tuxedo: (p) => [T([[3.6, 7.4], [27.4, 7.4], [26.6, 9], [4.4, 9]], p.main), T([[8.4, -6.4], [22.6, -6.4], [22, 7.6], [9, 7.6]], p.main), F(R(9.6, -5.8, 1.2, 12, lighter(p.main, 0.14))),
    F(R(8.8, 3.2, 13.4, 2.4, RED)), ...rose(20.4, 4.2, 1.8, RED, '#8e1c2c'), leaf(18.6, 5.6, 2, 0.6, 160, '#3f7a4a'),
    T([[6.4, 14.4], [14.6, 13.4], [15, 19.8], [12.6, 22], [7.2, 20.6], [5.6, 17]], WHITE), F(E(10.6, 17.6, 1.8, 1.2, '#2a2438')), F(limb(6.4, 15, 14, 14.2, 0.3, 0.3, '#d8d4e4'))],
  // A huge bow with star clips and sparkles.
  cheer: (p) => [T([[15.5, 2.6], [8.6, -1.6], [7.6, 2.8], [9, 6], [15.5, 3.6]], p.main), T([[15.5, 2.6], [22.4, -1.6], [23.4, 2.8], [22, 6], [15.5, 3.6]], p.main),
    F(T([[15.5, 2.8], [10, 0], [9.6, 2.6], [15.5, 3.2]], lighter(p.main, 0.15))), F(T([[15.5, 2.8], [21, 0], [21.4, 2.6], [15.5, 3.2]], lighter(p.main, 0.15))), E(15.5, 3, 1.6, 1.4, WHITE),
    star(9.4, 4.2, 1, GOLD), star(21.6, 4.2, 1, GOLD), sparkle(24.6, 0, 0.8), sparkle(6.6, 0.4, 0.6)],
  // A tricorn with gold trim, a big sweeping plume and an anchor badge.
  pirate: (p, m) => {
    const s = (m?.hair ?? 0) * 0.5;
    return [T([[1.6, 9.4], [8, 2.4], [15.5, 4.4], [23, 2.4], [29.4, 9.4], [24, 8.4], [15.5, 9.6], [7, 8.4]], '#2a1e1a'), F(T([[2.6, 8.8], [8, 3.6], [8.6, 4.4], [4, 8.8]], GOLD)), F(T([[28.4, 8.8], [23, 3.6], [22.4, 4.4], [27, 8.8]], GOLD)),
      dome(15.5, 8.4, 8, 6.4, '#3a2a24'), ...plume([[14, 3.4], [12.6, -0.6], [10 + s * 0.5, -3.4], [6.4 + s, -4.6], [3 + s, -3.6], [1 + s, -1]], 4.4, WHITE, '#d8d0e4'),
      ...plume([[15.4, 3.2], [15, 0], [13.4 + s * 0.4, -2.4], [11 + s * 0.8, -3.2]], 2.4, '#ff8a9a', '#d8506a'), F(E(15.5, 6.6, 1.6, 1.6, GOLD)), F(limb(15.5, 5.6, 15.5, 7.8, 0.4, 0.4, '#2a1e1a')), F(limb(14.4, 7.6, 16.6, 7.6, 0.4, 0.4, '#2a1e1a'))];
  },
  // A shell-and-pearl tiara with a starfish.
  mermaid: () => [...ring(9, (i) => F(E(7.6 + i * 2, 6.6 - Math.sin((i / 8) * Math.PI) * 2.6, 0.6, 0.6, PEARL))), T([[13, 4.6], [15.5, -0.6], [18, 4.6]], '#ffb8d0'),
    ...ring(5, (i) => F(limb(15.5, 4.6, 13.4 + i * 1.05, 0.6, 0.25, 0.25, '#ff8fb0'))), star(22.6, 5.6, 1.8, '#ffb36b'), F(star(22.6, 5.6, 0.8, '#ffd6a0')), sparkle(9.4, 2.6, 0.8), ...gem(15.5, 2.2, 0.7, '#8fe8ff')],
  // A leather flying cap with ear flaps, goggles pushed up on top.
  aviator: (p) => [dome(15.5, 10.4, 12, 9.6, p.main), T([[3.4, 9.6], [7.6, 9.6], [7.2, 20.4], [5, 21.4], [3.4, 18]], p.main), T([[27.6, 9.6], [23.4, 9.6], [23.8, 20.4], [26, 21.4], [27.6, 18]], p.main),
    ...scallops(4, 7, 10, 3, 0.5, '#f2e6cc'), ...scallops(24, 27, 10, 3, 0.5, '#f2e6cc'), F(R(3.6, 5.4, 23.8, 1.4, '#3a2418')),
    ...[11.6, 19.4].flatMap((x) => [E(x, 5.6, 2.8, 2.6, '#c8ccd8'), F(E(x, 5.6, 2, 1.8, '#5fc8e8')), F(E(x - 0.6, 5, 0.6, 0.5, WHITE))]), F(R(14.2, 5.2, 2.6, 0.8, '#8a92a8'))],
  // A fur hat with a snowflake tiara and pompom ties.
  snow: (p, m) => {
    const s = (m?.hair ?? 0) * 0.4;
    return [dome(15.5, 8.6, 11.4, 7.8, WHITE), ...scallops(4.2, 26.8, 8.4, 11, 0.9, '#f8f4ec'), ...flake(15.5, 2.6, 2.4, p.main), ...flake(10, 4.6, 1.2, p.main), ...flake(21, 4.6, 1.2, p.main),
      ...gem(15.5, 2.6, 0.8, '#8fe8ff'), F(limb(5, 9, 4.4 + s, 17, 0.3, 0.3, p.main)), E(4.4 + s, 17.6, 1.1, 1.1, WHITE), F(limb(26, 9, 26.6 + s, 17, 0.3, 0.3, p.main)), E(26.6 + s, 17.6, 1.1, 1.1, WHITE), sparkle(24.6, 1, 0.8, '#cfe8ff')];
  },
};
const HAT_BACKS = {
  // Poppy's kerchief tails.
  swbaker: (p, m) => {
    const sw = m?.sway ?? 0;
    return [tail(14, 3, 6, 1.6, '#fff6ec', sw, -1.4), tail(17, 3, 5, 1.6, '#fff6ec', sw, 1.4)];
  },
  // The gothic headband's long ribbons.
  gothic: (p, m) => {
    const sw = m?.sway ?? 0;
    return [tail(4.8, 9, 14, 1.8, RED, sw, -1), tail(26.2, 9, 14, 1.8, RED, sw, 1)];
  },
  astronaut: () => [F(E(15.5, 14.4, 14.6, 14, '#e8f4ff'))],
  // Pearl strands hanging behind.
  mermaid: (p, m) => {
    const sw = m?.sway ?? 0;
    return [...ring(6, (i) => F(E(4.6 + sw * (i / 6), 9 + i * 2.2, 0.5, 0.5, PEARL))), ...ring(6, (i) => F(E(26.4 + sw * (i / 6), 9 + i * 2.2, 0.5, 0.5, PEARL)))];
  },
};

// ---------- Gloves and things held ----------

function hand(t, p, hx, hy, ex, ey) {
  const at = (u) => [hx + (ex - hx) * u, hy + (ey - hy) * u];
  switch (keyOf(t)) {
    // Ledger's lace gloves; Halvard's worn leather gauntlets.
    case 'cbledger': return [limb(...at(0), ...at(0.4), 3, 3.2, '#f6f0fa'), E(hx, hy, 1.9, 1.9, '#f6f0fa'), F(E(...at(0.42), 1.8, 0.7, WHITE)), F(E(hx - 0.5, hy - 0.6, 0.6, 0.5, WHITE))];
    case 'cbhalvard': return [limb(...at(0.1), ...at(0.45), 4.2, 4, '#4a3424'), E(hx, hy, 2.1, 2, '#5a3e2a'), F(R(hx - 1.6, hy - 1.4, 3.2, 0.6, '#6a4a30'))];
    // Rowan's soft steel gauntlets.
    case 'swknight': return [limb(...at(0.1), ...at(0.45), 4.4, 4.2, '#dfe6f2'), E(hx, hy, 2.3, 2.2, '#dfe6f2'), F(E(hx - 0.6, hy - 0.7, 0.9, 0.6, WHITE))];
    // A sleepy star pillow hugged in the front hand.
    case 'pajamas': return hx > 15.5 ? [star(hx + 0.6, hy - 0.4, 3.2, '#ffe36b'), F(star(hx + 0.4, hy - 0.8, 1.8, '#fff2a8')), F(E(hx - 0.4, hy - 0.4, 0.3, 0.3, INK)), F(E(hx + 1.2, hy - 0.4, 0.3, 0.3, INK)), E(hx, hy + 0.6, 1.8, 1.8, p.main)] : [E(hx, hy, 1.9, 1.9, p.main)];
    case 'astronaut': return [limb(...at(0.1), ...at(0.45), 4.6, 4.6, '#ff8a3c'), E(hx, hy, 2.4, 2.4, p.main), F(E(hx - 0.6, hy - 0.6, 0.8, 0.6, WHITE))];
    case 'ballgown': return [limb(...at(0), ...at(0.9), 3.2, 3.4, WHITE), E(hx, hy, 1.9, 1.9, WHITE), F(E(...at(0.7), 0.6, 0.6, p.light))];
    case 'tuxedo': return [E(hx, hy, 1.9, 1.9, WHITE), F(E(...at(0.3), 0.8, 0.4, '#d8d4e4'))];
    // Metallic pompoms with a sparkle.
    case 'cheer': return [...ring(10, (i) => {
      const a = (i / 10) * Math.PI * 2;
      return F(E(hx + Math.cos(a) * 2, hy + Math.sin(a) * 2, 1.5, 1.5, i % 3 === 0 ? GOLD : i % 2 ? WHITE : p.main));
    }), E(hx, hy, 1.9, 1.9, p.main), sparkle(hx + 2.6, hy - 2.4, 0.7)];
    // Leather gauntlet gloves.
    case 'aviator': return [limb(...at(0.12), ...at(0.42), 4.2, 4, '#3a2418'), E(hx, hy, 2, 2, '#3a2418'), F(R(hx - 1.6, hy - 1.6, 3.2, 0.6, '#5a3a28'))];
    // A white fur muff with a snowflake.
    case 'snow': return [E(hx, hy, 2.8, 2.4, WHITE), ...scallops(hx - 2.4, hx + 2.4, hy - 2, 4, 0.5, '#f8f4ec'), ...flake(hx, hy + 0.2, 0.9, p.main)];
    default: return [E(hx, hy, 1.9, 1.9, p.main)];
  }
}

// ---------- On the back ----------

function capeBack(t, p, m) {
  const sw = m?.sway ?? 0;
  switch (keyOf(t)) {
    // Ledger's frock coat tails behind; Halvard's short travel cloak off one shoulder; Juniper's
    // apron strings in a bow; the Moth's great moth-wing shawl with its eyespots, swaying.
    case 'cbledger': return [tail(12.6, 33.6, 13, 3.2, darker(p.main, 0.1), sw, -0.8), tail(18.4, 33.6, 13, 3.2, darker(p.main, 0.1), sw, 0.8)];
    case 'cbhalvard': return [T([[9, 25.6], [17, 25.6], [18 + sw, 40], [7 + sw, 41]], '#4a5a3a'), F(R(7 + sw, 39.6, 11, 0.8, '#3a4a2a'))];
    case 'cbjuniper': return [T([[11, 33], [6.4, 30.6], [6, 35], [11, 34.6]], '#fff0d8'), T([[20.2, 33], [24.8, 30.6], [25.2, 35], [20.2, 34.6]], '#fff0d8'), tail(13.4, 34, 7, 1.6, '#fff0d8', sw, -1), tail(17.8, 34, 7, 1.6, '#fff0d8', sw, 1)];
    case 'cbmoth': {
      const wing = (dir) => {
        const X = (x) => MID + dir * x;
        return [T([[X(3), 25.8], [X(14), 22 + sw * 0.3], [X(16.4 + sw * 0.4), 30], [X(12), 40 + sw], [X(6), 42], [X(3), 34]], '#5a4a7a'), T([[X(4), 27], [X(12.6), 24.4], [X(14.4), 30], [X(11), 37], [X(5), 38]], '#7a6aa0'),
          E(X(10), 30.4, 2.4, 2.2, '#e8dcf4'), F(E(X(10), 30.4, 1.4, 1.3, GOLD)), F(E(X(10), 30.4, 0.7, 0.65, '#2a2036')), ...scallops(X(5), X(12), 41 + sw * 0.6, 4, 0.7, '#c9b8e8')];
      };
      return [...wing(-1), ...wing(1)];
    }
    // Poppy's apron strings tied in a bow at the back.
    case 'swbaker': return [T([[11, 33], [6, 30.4], [5.6, 35], [11, 34.6]], WHITE), T([[20.2, 33], [25.2, 30.4], [25.6, 35], [20.2, 34.6]], WHITE), tail(13, 34, 8, 1.8, WHITE, sw, -1), tail(18.2, 34, 7, 1.8, WHITE, sw, 1)];
    // Lark's long striped scarf, streaming out behind.
    case 'swpoet': {
      const w = (u) => [11 - u * 12 + sw * u * 1.8, 26.6 + u * 7 + Math.sin(u * Math.PI * 2) * 1.2];
      const top = ring(7, (i) => w(i / 6));
      const end = w(1);
      return [T([...top, [end[0], end[1] + 2.8], ...ring(7, (i) => {
        const [x, y] = w(1 - i / 6);
        return [x, y + 2.8 - (1 - i / 6) * 0.4];
      })], '#ffd34d'), ...ring(4, (i) => F(limb(...w(0.15 + i * 0.22), ...w(0.15 + i * 0.22).map((v, j) => v + (j ? 2.6 : 0)), 0.6, 0.6, '#ff8a6a')))];
    }
    // Rowan's short sky-blue cape.
    case 'swknight': return [T([[8.4, 25.4], [22.6, 25.4], [25 + sw, 44], [6 + sw, 44]], p.main), F(limb(9 + sw * 0.3, 28, 7 + sw, 43, 0.6, 0.4, lighter(p.main, 0.12))), F(R(6 + sw, 43.2, 19, 0.8, GOLD))];
    // Yuzu's big obi bow at the back.
    case 'swfox': return [T([[11, 32], [4, 28.4], [3.4, 35], [11, 34.6]], RED), T([[20.2, 32], [27.2, 28.4], [27.8, 35], [20.2, 34.6]], RED), F(T([[10, 32.6], [5.4, 30], [5, 33.6], [10, 34]], '#ff9a6a')), tail(13, 34, 9, 2.4, RED, sw, -1), tail(18.2, 34, 8, 2.4, RED, sw, 1)];
    // Celeste's starry cape, to the floor.
    case 'swstar': return [T([[8, 25.4], [23, 25.4], [27.6 + sw, 54], [3.4 + sw, 54]], darker(p.main, 0.12)), ...[[7, 44], [24, 47], [12, 51], [20, 38], [15.5, 46]].map(([x, y], i) => (i % 2 ? sparkle(x + sw, y, 0.9, '#c8c8ff') : star(x + sw, y, 1, GOLD)))];
    // Marlowe's jacket tails.
    case 'swsailor': return [T([[9, 33.6], [22, 33.6], [23.4 + sw, 42], [7.6 + sw, 42]], darker(p.main, 0.1)), F(R(7.6 + sw, 41.2, 15.8, 0.8, GOLD))];
    // The obi's big two-tone butterfly bow, its ends trailing.
    case 'yukata': return [T([[11, 31], [3, 26.4], [1.8, 33.6], [11, 34.4]], '#ffd34d'), T([[20.2, 31], [28.2, 26.4], [29.4, 33.6], [20.2, 34.4]], '#ffd34d'),
      F(T([[10, 31.6], [4.4, 28.4], [3.6, 32.6], [10, 33.6]], '#ff8a5a')), F(T([[21.2, 31.6], [26.8, 28.4], [27.6, 32.6], [21.2, 33.6]], '#ff8a5a')),
      tail(12.6, 33.6, 10, 2.6, '#ffc23a', sw, -1), tail(18.6, 33.6, 9, 2.6, '#ffc23a', sw, 1)];
    // A big black bow at the back of the waist with long lace-edged tails.
    case 'gothic': return [T([[11, 33], [4.4, 29], [3.6, 36.4], [11, 35.4]], p.main), T([[20.2, 33], [26.8, 29], [27.6, 36.4], [20.2, 35.4]], p.main),
      tail(12.4, 35, 15, 3, p.main, sw, -1.4), tail(18.8, 35, 14, 3, p.main, sw, 1.4), ...scallops(9.8 + sw, 13.6 + sw, 50, 3, 0.5, WHITE), ...scallops(18.6 + sw, 22.4 + sw, 49, 3, 0.5, WHITE)];
    // A jetpack with twin flames.
    case 'astronaut': {
      const fl = m?.flap ? 1 : 0;
      return [R(6, 26, 19, 13, '#c8ccd8'), R(4.6, 27.6, 3, 11, '#8a92a8'), R(23.4, 27.6, 3, 11, '#8a92a8'), F(R(4.6, 28.6, 3, 1, '#ff8a3c')), F(R(23.4, 28.6, 3, 1, '#ff8a3c')),
        F(E(6.1, 41 + fl, 1.4, 2.4 + fl, '#ffb03b')), F(E(6.1, 40.6, 0.7, 1.4, '#fff2a8')), F(E(24.9, 41 + fl, 1.4, 2.4 + fl, '#ffb03b')), F(E(24.9, 40.6, 0.7, 1.4, '#fff2a8'))];
    }
    // The inverness cape behind: checked, to the waist.
    case 'detective': return [T([[8.6, 26], [22.4, 26], [25 + sw, 37], [6 + sw, 37]], p.main), ...[10, 14, 18, 22].map((x) => F(R(x + sw * 0.5, 27, 0.4, 9.6, darker(p.main, 0.16)))), F(R(6 + sw, 36.4, 19, 0.6, darker(p.main, 0.25)))];
    // A long sheer train with sparkles, flowing from the waist.
    case 'ballgown': return [T([[9, 33], [22, 33], [28 + sw, 55.6], [3 + sw, 55.6]], mix(p.light, WHITE, 0.35)), ...[[7, 48], [24, 50], [12, 53], [20, 44]].map(([x, y]) => sparkle(x + sw, y, 0.9))];
    // A full-length black cape lined in red.
    case 'tuxedo': return [T([[8, 25.4], [23, 25.4], [27.6 + sw, 52], [3.4 + sw, 52]], RED), T([[8.6, 25.4], [22.4, 25.4], [25.6 + sw, 51], [5.4 + sw, 51]], p.main), F(limb(9 + sw * 0.3, 30, 6 + sw, 50, 0.6, 0.4, lighter(p.main, 0.1)))];
    // The captain's coat tails.
    case 'pirate': return [T([[9, 33.6], [22, 33.6], [24.4 + sw, 47.6], [6.6 + sw, 47.6]], darker(p.main, 0.1)), F(R(6.6 + sw, 46.6, 17.8, 1, GOLD))];
    // Sheer fin ribbons trailing from the waist.
    case 'mermaid': return [tail(10.6, 34, 18, 3, mix(p.main, WHITE, 0.45), sw, -3), tail(20.4, 34, 16, 3, mix(p.main, WHITE, 0.45), sw, 3), sparkle(6 + sw, 46, 0.7), sparkle(25 + sw, 44, 0.6)];
    // The long white scarf streaming out behind.
    case 'aviator': {
      // (Flown out from the neck at shoulder height like a pennant in the slipstream, widening and
      // rippling toward its fringed end, never a thin hook at her hip.)
      const w = (u) => [11 - u * 14 + sw * u * 1.6, 25.4 + u * 3 - Math.sin(u * Math.PI * 2 + sw * 0.3) * 1.1 * u];
      const half = (u) => 1.3 + u * 0.9;
      const top = ring(9, (i) => {
        const [x, y] = w(i / 8);
        return [x, y - half(i / 8)];
      });
      const bot = ring(9, (i) => {
        const [x, y] = w(1 - i / 8);
        return [x, y + half(1 - i / 8)];
      });
      const end = w(1);
      return [T([...top, ...bot], WHITE), F(T([...ring(9, (i) => {
        const [x, y] = w(i / 8);
        return [x, y + half(i / 8) * 0.2];
      }), ...bot], '#e6e6ee')),
      ...ring(4, (i) => F(R(end[0] - 1.6 + i * 0.1, end[1] - 1.8 + i * 1.2, 1.4, 0.45, '#d8d8e4')))];
    }
    // A long ice-blue cape with snowflakes and a fur hem.
    case 'snow': return [T([[8, 25.4], [23, 25.4], [27.6 + sw, 53], [3.4 + sw, 53]], p.main), ...flake(8 + sw, 46, 1.6, WHITE), ...flake(23 + sw, 48, 1.4, WHITE), ...flake(15.5 + sw, 51, 1, WHITE),
      ...scallops(3.8 + sw, 27.2 + sw, 53, 11, 0.6, WHITE)];
    default: return [];
  }
}
function capeFront(t, p) {
  switch (keyOf(t)) {
    // Halvard's red scarf knotted at the throat; Juniper's striped tea towel over her shoulder; the
    // Moth's fuzzy collar.
    case 'cbhalvard': return [E(MID, 26.2, 5, 1.6, '#a84a3a'), T([[MID + 2, 26.6], [MID + 3.6, 26.6], [MID + 4.2, 31], [MID + 2.8, 30.8]], '#a84a3a'), F(R(MID + 2.4, 29.4, 1.6, 0.4, '#c86a5a'))];
    case 'cbjuniper': return [T([[18.4, 25.4], [21.6, 25.2], [22.2, 33], [19.2, 33.2]], WHITE), ...[27.4, 29.8, 32].map((y) => F(R(18.8, y, 3.2, 0.7, '#e85a6a')))];
    case 'cbmoth': return [E(MID, 25.8, 6.6, 1.9, '#e8dcf4'), ...scallops(MID - 6, MID + 6, 26.8, 8, 0.7, '#e8dcf4')];
    // Lark's scarf wrapped round the neck, one end down the front.
    case 'swpoet': return [E(MID, 26.2, 5.4, 1.8, '#ffd34d'), ...[MID - 3, MID, MID + 3].map((x) => F(R(x - 0.4, 25, 0.8, 2.4, '#ff8a6a'))), T([[MID + 2.2, 26.6], [MID + 4.2, 26.6], [MID + 4.8, 33], [MID + 3, 32.8]], '#ffd34d'), F(R(MID + 3.2, 29, 1.6, 0.8, '#ff8a6a'))];
    case 'astronaut': return [limb(11.6, 26.2, 11.4, 33, 1.6, 1.6, '#8a92a8'), limb(19.6, 26.2, 19.8, 33, 1.6, 1.6, '#8a92a8')];
    // The phantom's high collar and clasp chain.
    case 'tuxedo': return [T([[9, 21.4], [11.6, 25.8], [9.4, 26.4], [7, 22.4]], p.main), T([[22, 21.4], [19.4, 25.8], [21.6, 26.4], [24, 22.4]], p.main), F(limb(11.6, 26.4, 19.4, 26.4, 0.3, 0.3, GOLD)), F(E(11.6, 26.4, 0.6, 0.6, GOLD)), F(E(19.4, 26.4, 0.6, 0.6, GOLD))];
    // The scarf wrapped round the neck, one end hanging down the front.
    case 'aviator': return [E(MID, 26.2, 5.6, 1.8, WHITE), T([[MID + 2.4, 26.6], [MID + 4.4, 26.6], [MID + 5.2, 32.6], [MID + 3.4, 32.4]], WHITE), ...[MID + 3.4, MID + 4.4].map((x) => F(R(x + 0.4, 32.6, 0.4, 1.2, '#d8d8e4')))];
    // The snow cape's fur collar.
    case 'snow': return [E(MID, 25.8, 7, 2, '#f8f4ec'), ...scallops(MID - 6.4, MID + 6.4, 26.8, 8, 0.7, '#f8f4ec')];
    default: return [];
  }
}

// ---------- Swim and dance ----------
// Beach and stage looks: the wearer's skin (p.skin) shows at the shoulders, arms and legs.

const skinOf = (p) => p.skin ?? '#fff0e6';
const skinDk = (p) => darker(skinOf(p), 0.1);
// Bare skin under a swimsuit, shaded down the back.
const bare = (p) => [T(TORSO, skinOf(p)), side(TORSO, 12, -1, skinDk(p))];
// A bare foot in the shoe's frame.
const foot = (p, k, c) => k.poly([[-1.8, -1.2], [1.8, -1.2], [2.6, 0.4], [3, 2.2], [2.4, 3], [-2.4, 3], [-2.8, 2.2], [-2.6, 0.4]], c(skinOf(p)));
// A hibiscus-ish bloom.
const bloom = (x, y, r, c) => [...ring(5, (i) => {
  const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
  return E(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.55, r * 0.5, c);
}), F(E(x, y, r * 0.3, r * 0.3, '#ffe36b')), F(limb(x, y, x + r * 0.6, y - r * 0.7, 0.25, 0.2, '#ffe36b'))];
// A little yellow duck.
const duck = (x, y, r) => [E(x, y, r, r * 0.75, '#ffe066'), E(x + r * 0.7, y - r * 0.7, r * 0.55, r * 0.5, '#ffe066'), F(T([[x + r * 1.15, y - r * 0.75], [x + r * 1.7, y - r * 0.6], [x + r * 1.15, y - r * 0.45]], '#ff9a3a')), F(E(x + r * 0.85, y - r * 0.85, r * 0.12, r * 0.12, INK))];

Object.assign(TOPS, {
  // A navy one-piece with a white sailor collar, a red bow and little white stars.
  sailorswim: (p) => [...bare(p), band(TORSO, 28.2, 35.8, p.main), F(limb(12.4, 28.4, 12.6, 25.8, 0.8, 0.7, p.main)), F(limb(18.8, 28.4, 18.6, 25.8, 0.8, 0.7, p.main)),
    T([[10, 27.6], [21.2, 27.6], [21.6, 29.4], [MID, 31.4], [9.6, 29.4]], WHITE), F(T([[10.4, 28.4], [20.8, 28.4], [21, 29], [MID, 30.8], [10.2, 29]], p.main)), ...tieBow(MID, 30.6, RED),
    ...[[12, 33], [19, 32.6], [MID, 34.2]].map(([x, y]) => star(x, y, 0.7, WHITE)), band(TORSO, 34.6, 35.6, WHITE)],
  // A long-sleeved gymnast's leotard: a shimmer fading up the body, rhinestone stars in a swoop.
  gymnast: (p) => [T(TORSO, p.main), ...round(p), band(TORSO, 25.6, 29, lighter(p.main, 0.12)), T([[11, 26.2], [MID, 30.6], [20.2, 26.2], [20.8, 27.4], [MID, 32], [10.4, 27.4]], lighter(p.main, 0.25)),
    ...[[11.6, 33], [13.6, 31.8], [15.8, 31], [18, 30.4], [20, 30]].map(([x, y], i) => star(x, y, 0.5 + i * 0.12, i % 2 ? WHITE : '#ffe36b')), sparkle(19.6, 33.4, 0.8)],
  // A white ballet leotard with a sweetheart bodice in blush pink and a pearl at the heart.
  ballet: (p) => [...bare(p), band(TORSO, 28.4, 35.8, p.main), E(12.9, 28.9, 3.1, 1.3, p.main), E(18.3, 28.9, 3.1, 1.3, p.main), F(limb(12.2, 28.4, 12.4, 25.8, 0.5, 0.5, p.main)), F(limb(19, 28.4, 18.8, 25.8, 0.5, 0.5, p.main)),
    T([[MID - 2, 29.6], [MID + 2, 29.6], [MID, 34.6]], '#ffe6ee'), ...[31, 32.6].map((y) => F(R(MID - 1.4 + (y - 31) * 0.3, y, 2.8 - (y - 31) * 0.6, 0.35, '#ffc2d6'))), F(E(MID, 29.6, 0.6, 0.6, '#fff4fa')), sparkle(19.4, 31.6, 0.7)],
  // A halter bikini in a hibiscus print, strings tied behind the neck; the midriff shows.
  tropical: (p) => [...bare(p), T([[MID - 0.6, 27.8], [10.4, 28.6], [10.2, 31.4], [MID - 0.6, 31]], p.main), T([[MID + 0.6, 27.8], [20.8, 28.6], [21, 31.4], [MID + 0.6, 31]], p.main),
    ...bloom(12.2, 29.6, 1.4, '#ffe6a0'), ...bloom(18.8, 29.8, 1.2, WHITE), F(limb(11, 28.6, MID - 1.4, 25.6, 0.5, 0.4, p.main)), F(limb(20.2, 28.6, MID + 1.4, 25.6, 0.5, 0.4, p.main)),
    F(limb(MID - 0.6, 29.4, MID + 0.6, 29.4, 0.6, 0.6, p.main)), F(E(MID, 33.8, 0.25, 0.35, darker(skinOf(p), 0.25)))],
  // A retro one-piece: wide straps, a sweetheart neck, white polka dots and a bow at the chest.
  retroswim: (p) => [...bare(p), band(TORSO, 28.2, 35.8, p.main), E(12.9, 28.6, 3.2, 1.5, p.main), E(18.3, 28.6, 3.2, 1.5, p.main), F(limb(12.2, 28.4, 12.6, 25.8, 1.4, 1.2, p.main)), F(limb(19, 28.4, 18.6, 25.8, 1.4, 1.2, p.main)),
    ...[[11.4, 30.4], [13.8, 32], [16.4, 30.8], [19.2, 32.4], [12, 34.2], [17.2, 34.4], [20.4, 30.2]].map(([x, y]) => F(E(x, y, 0.6, 0.6, WHITE))), ...tieBow(MID, 28.8, WHITE), band(TORSO, 34.2, 35.4, darker(p.main, 0.2))],
  // A shorty wetsuit: black with colour panels down the sides and a wave across the chest.
  surf: (p) => [T(TORSO, '#2a3442'), side(TORSO, 11.4, -1, p.main), side(TORSO, 19.8, 1, p.main), T([[10, 29.6], [12.6, 28.6], [15, 29.8], [17.4, 28.6], [19.8, 29.8], [21.4, 29], [21.4, 30.4], [19.8, 31.2], [17.4, 30], [15, 31.2], [12.6, 30], [10, 31]], WHITE),
    T([[12.6, 25], [18.6, 25], [19, 27], [12.2, 27]], '#2a3442'), F(R(MID - 0.25, 25.2, 0.5, 2.4, p.main)), band(TORSO, 34.4, 35.8, p.main)],
  // A one-piece with little ducks, a frilled neckline and a bow.
  ducky: (p) => [...bare(p), band(TORSO, 28.4, 35.8, p.main), frill(9.8, 21.6, 28, 9.6, 21.8, 29.6, 7, 0.4, WHITE), F(limb(12.2, 28.4, 12.4, 25.8, 0.8, 0.7, p.main)), F(limb(19, 28.4, 18.8, 25.8, 0.8, 0.7, p.main)),
    ...duck(12.4, 31.6, 1.1), ...duck(18.4, 33.4, 0.9), F(E(16, 30.6, 0.4, 0.4, WHITE)), F(E(14.4, 34.2, 0.4, 0.4, WHITE))],
});
Object.assign(SLEEVES, { sailorswim: () => 'skin', ballet: () => 'skin', tropical: () => 'skin', retroswim: () => 'skin', ducky: () => 'skin', surf: () => '#2a3442' });
LONG.add('gymnast');
Object.assign(SHOULDERS, {
  sailorswim: () => [], tropical: () => [], retroswim: () => [],
  ballet: (p) => [frill(-1.6, 1.6, -0.6, -2, 2, 1, 3, 0.35, p.main)],
  gymnast: (p) => [E(0, 0.6, 2.6, 2.2, p.main), sparkle(0.4, 0.2, 0.6)],
  surf: (p) => [E(0, 0.6, 2.6, 2.2, '#2a3442'), F(R(-2.4, 1.6, 4.8, 0.8, p.main))],
  ducky: () => [frill(-1.8, 1.8, -0.8, -2.2, 2.2, 1.2, 3, 0.4, WHITE)],
});
Object.assign(LEGS, {
  sailorswim: (p, s) => ({ top: s, low: s, pad: null }),
  gymnast: (p, s) => ({ top: s, low: s, pad: null }),
  ballet: () => ({ top: '#ffe0ea', low: '#ffe0ea', pad: null }),
  tropical: (p, s) => ({ top: s, low: s, pad: null }),
  retroswim: (p, s) => ({ top: s, low: s, pad: null }),
  surf: (p, s) => ({ top: '#2a3442', low: s, pad: null }),
  ducky: (p, s) => ({ top: s, low: s, pad: null }),
});
Object.assign(SKIRTS, {
  // A short frilled skirt, white-trimmed.
  sailorswim: (p) => [skirt(40.4, 2.6, p.main), skirtBand(40.4, 2.6, 34.2, 39.2, 40.4, WHITE), ...scallops(7.6, 23.6, 40.4, 7, 0.45, WHITE)],
  // The leotard's leg line in the same shimmer.
  gymnast: (p) => [T([[9.6, 34.2], [21.6, 34.2], [21.4, 36.6], [18.6, 38.6], [MID, 39.2], [12.6, 38.6], [9.8, 36.6]], p.main), F(limb(10.2, 36, 13, 38.4, 0.4, 0.4, lighter(p.main, 0.25))), F(limb(21, 36, 18.2, 38.4, 0.4, 0.4, lighter(p.main, 0.25)))],
  // A full tutu: layers of tulle standing out flat, a blush layer under white, pearl tips.
  ballet: (p) => [frill(9.6, 21.6, 34.4, 3, 28.2, 39.6, 12, 0.9, '#ffe0ea'), frill(9.6, 21.6, 34.2, 4, 27.2, 38.6, 11, 0.8, p.main), frill(9.8, 21.4, 34.2, 6, 25.2, 37.4, 9, 0.7, lighter('#ffe0ea', 0.05)),
    ...[[6, 37.6], [10, 38.4], [21, 38.4], [25, 37.6]].map(([x, y]) => F(E(x, y, 0.5, 0.5, '#fff4fa'))), sparkle(24, 36.4, 0.7)],
  // A bikini bottom with a sarong knotted at the near hip, falling to the knee.
  tropical: (p) => [T([[9.6, 34.2], [21.6, 34.2], [21.2, 37.4], [MID, 38.4], [10, 37.4]], p.main), T([[9.2, 35.4], [21.6, 34.6], [23.4, 41], [19, 46.6], [8.4, 42.6]], mix(p.main, WHITE, 0.35)),
    ...bloom(12.4, 40.4, 1.5, WHITE), ...bloom(18, 43.6, 1.3, '#ffe6a0'), E(21.4, 35, 1.4, 1.2, mix(p.main, WHITE, 0.2)), tail(21.6, 35.6, 5, 1.2, mix(p.main, WHITE, 0.2), 0, 0.8)],
  // A skirted bottom with dots and a white band at the hem.
  retroswim: (p) => [skirt(40, 2.4, p.main), ...[[11, 37.4], [14.4, 38.6], [17.6, 37.2], [20.6, 38.4]].map(([x, y]) => F(E(x, y, 0.6, 0.6, WHITE))), skirtBand(40, 2.4, 34.2, 39, 40, WHITE)],
  surf: () => null,
  ducky: (p) => [frill(9.6, 21.6, 34.4, 8, 23.2, 38.6, 7, 0.6, WHITE), skirt(38, 1.6, p.main), ...duck(19, 36.4, 0.7)],
});
Object.assign(SHOES, {
  // Navy strap sandals.
  sailorswim: (p, k, c) => [foot(p, k, c), k.poly([[-2.8, 2.4], [2.8, 2.4], [2.8, 3.2], [-2.8, 3.2]], c(p.main)), k.poly([[-2.2, 0], [2.2, 0], [2.2, 0.6], [-2.2, 0.6]], c(p.main)), k.dot(1.4, 0.3, 0.4, c(WHITE))],
  // Half-sole gymnast slippers.
  gymnast: (p, k, c) => [foot(p, k, c), k.poly([[0.4, 0.4], [2.8, 1], [3, 2.6], [0.4, 3]], c(lighter(p.main, 0.2)))],
  // Pink pointe shoes with ribbons criss-crossing up the ankle.
  ballet: (p, k, c) => [k.sole(c('#ffc2d6')), k.shaft(3, c('#ffc2d6'), 0.5), k.poly([[-1.6, -2.4], [1.6, -0.6], [1.6, -0.1], [-1.6, -1.9]], c('#ffb0c8')), k.poly([[1.6, -2.4], [-1.6, -0.6], [-1.6, -0.1], [1.6, -1.9]], c('#ffb0c8'))],
  // Flip-flops with a flower on the strap.
  tropical: (p, k, c) => [foot(p, k, c), k.poly([[-3, 2.4], [3, 2.4], [3.2, 3.4], [-3.2, 3.4]], c(p.main)), k.poly([[-0.4, -0.8], [0.4, -0.8], [1.6, 1.4], [-1.6, 1.4]], c(p.main)), k.dot(0, -0.6, 0.7, c('#ffe066'))],
  // Cork wedge sandals with a red strap.
  retroswim: (p, k, c) => [foot(p, k, c), k.poly([[-3, 1.8], [3, 2.2], [3, 3.6], [-3, 3.6]], c('#d8a86a')), k.poly([[-2.4, -0.2], [2.4, -0.2], [2.6, 1], [-2.6, 1]], c(p.main))],
  // Barefoot.
  surf: (p, k, c) => [foot(p, k, c)],
  // Yellow jelly sandals.
  ducky: (p, k, c) => [foot(p, k, c), k.poly([[-2.8, 2.2], [2.8, 2.2], [2.8, 3.2], [-2.8, 3.2]], c('#ffe066')), k.poly([[-2, -0.4], [2, -0.4], [2.2, 1.2], [-2.2, 1.2]], c('#ffe066'))],
});
Object.assign(HATS, {
  // A little white sailor cap tipped back, a navy band, a gold star.
  // (Sized to her head, tipped back a touch: a real sailor's cap, not a token on top.)
  sailorswim: (p) => [dome(16, 5, 9, 6, WHITE), F(dome(16, 5, 9, 2.4, '#e6ecf8')), E(16, 5.2, 11.4, 2.8, WHITE), F(E(16, 5.6, 10.4, 1.6, '#dfe6f4')),
    F(R(7.6, 3.2, 16.8, 1.6, p.main)), star(16, 0.9, 1.2, '#ffe36b'), F(star(16, 0.9, 0.5, WHITE))],
  // A big scrunchie round a high ponytail, with a star clip.
  gymnast: (p) => [...ring(7, (i) => {
    const a = (i / 7) * Math.PI * 2;
    return E(6.4 + Math.cos(a) * 1.8, 4.4 + Math.sin(a) * 1.6, 1.2, 1.1, i % 2 ? p.main : lighter(p.main, 0.2));
  }), F(E(6.4, 4.4, 1, 0.9, darker(p.main, 0.2))), star(20.6, 6, 1.4, '#ffe36b'), F(star(20.6, 6, 0.6, WHITE))],
  // A swan-feather headband: a white arc, a fan of feathers over the near ear, a pearl.
  ballet: (p) => [hoop(15.5, 12.4, 11.6, 11, 10.8, 10.2, p.main, 200, 340, 14), ...[-30, -10, 10, 30].map((a, i) => leaf(23.2, 6.4, 5 - Math.abs(i - 1.5) * 0.6, 1.1, -90 + a, i % 2 ? WHITE : '#fff4fa')),
    F(E(23.2, 6.6, 0.9, 0.9, '#fff4fa')), F(E(22.9, 6.3, 0.3, 0.3, WHITE))],
  // A big hibiscus behind the near ear.
  tropical: () => [leaf(24, 6, 4.6, 1.2, -40, '#3f9a5a'), leaf(24, 6, 4, 1, 20, '#3f9a5a'), ...bloom(23.6, 6.6, 3.4, '#ff5a7a'), F(E(23.6, 6.6, 0.9, 0.9, '#ffe36b'))],
  // A huge floppy sun hat with polka dots and a big bow.
  retroswim: (p) => [E(15.5, 7.6, 17, 3.6, '#f6e8c8'), dome(15.5, 7.4, 9.6, 6.6, '#f6e8c8'), F(R(6, 5.4, 19, 1.8, p.main)), ...tieBow(22.4, 6.2, p.main),
    ...[[2, 8], [8, 9.6], [24, 9.6], [29, 8]].map(([x, y]) => F(E(x, y, 0.6, 0.5, p.main))), F(E(10, 2.6, 0.6, 0.5, p.main)), F(E(16, 1.4, 0.6, 0.5, p.main))],
  // A seashell hair clip.
  surf: (p) => [T([[21, 7.4], [23.4, 3.6], [25.8, 7.4]], '#ffd0dc'), ...ring(4, (i) => F(limb(23.4, 7.4, 21.6 + i * 1.2, 4.6, 0.2, 0.2, '#ff9ab0'))), F(E(23.4, 7.6, 1.2, 0.5, '#ff9ab0')), F(E(20, 9.4, 0.6, 0.6, p.main))],
  // A flowery rubber swim cap: petals all over the crown.
  ducky: (p) => [dome(15.5, 10.4, 12.4, 10.6, WHITE), ...[[8, 6], [12.4, 2.6], [17.6, 2.2], [22.6, 5.4], [10.2, 9.4], [15.4, 6.4], [20.6, 9.2], [25.4, 9.6], [5.4, 9.8]].flatMap(([x, y], i) => [E(x, y, 1.5, 1.3, i % 2 ? p.main : '#ffd6e6'), F(E(x, y, 0.5, 0.5, '#ffe36b'))]),
    T([[3.2, 10.4], [27.8, 10.4], [27.6, 12], [3.4, 12]], WHITE)],
});
Object.assign(HAT_BACKS, {
  // The sailor cap's ribbons.
  sailorswim: (p, m) => [tail(10.6, 3, 9, 1.2, p.main, m?.sway ?? 0, -1.4), tail(12, 3, 8, 1.2, p.main, m?.sway ?? 0, -0.6)],
});
// The gymnast twirls a ribbon on a wand in her front hand.
function swimHand(t, p, hx, hy, ex, ey) {
  if (keyOf(t) !== 'gymnast') return hand(t, p, hx, hy, ex, ey);
  if (hx <= 15.5) return [E(hx, hy, 1.9, 1.9, skinOf(p))];
  const path = ring(12, (i) => [hx + 1 + i * 0.9, hy - 5 - Math.sin(i * 0.9) * 3 + i * 0.6]);
  return [F(limb(hx, hy, hx + 1, hy - 5, 0.4, 0.3, '#f2e6cc')), ...path.slice(1).map((pt, i) => F(limb(...path[i], ...pt, 1, 1, i % 2 ? lighter(p.main, 0.2) : '#ff9ec0'))), E(hx, hy, 1.9, 1.9, skinOf(p))];
}
function swimCape(t, p, m) {
  switch (keyOf(t)) {
    // A surfboard slung on the back, a stripe down it and a fin.
    case 'surf': return [T(turn([[2, 22], [6, 18], [10, 22], [10, 50], [6, 54], [2, 50]], 6, 36, 18), '#fff4e0'), F(T(turn([[5.4, 19], [6.6, 19], [6.6, 53], [5.4, 53]], 6, 36, 18), p.main)), F(T(turn([[6, 46], [8.6, 50], [6, 50]], 6, 36, 18), '#2a3442'))];
    // The back half of an inflatable duck ring round the waist.
    case 'ducky': return [hoop(MID, 36, 12.4, 5.4, 7, 2.2, '#ffe066', 180, 360, 14)];
    // The back half of the lei, behind the neck.
    case 'tropical': return ring(4, (i) => bloom(11 + i * 3, 25 - Math.sin((i / 3) * Math.PI) * 0.8, 1.2, ['#ffe066', '#ff5a7a', WHITE, '#ff9ec0'][i])).flat();
    default: return capeBack(t, p, m);
  }
}
function swimCapeFront(t, p) {
  switch (keyOf(t)) {
    // A flower lei round the neck.
    case 'tropical': return ring(9, (i) => {
      const a = rad(200 - i * 27.5);
      return bloom(MID + Math.cos(a) * 5.6, 26.2 - Math.sin(a) * 2.4 + (i > 2 && i < 6 ? 0.6 : 0), 1.3, ['#ff5a7a', '#ffe066', WHITE, '#ff9ec0'][i % 4]);
    }).flat();
    // The front of the duck ring with the duck's head and beak on the near side.
    case 'ducky': return [...[0, 1, 2, 3].map((i) => hoop(MID, 36, 12.4, 5.4, 7, 2.2, i % 2 ? WHITE : '#ffe066', i * 45, i * 45 + 45, 5)), E(26.6, 32.4, 2.4, 2.2, '#ffe066'), F(T([[28.4, 32.4], [30.6, 33], [28.4, 33.6]], '#ff9a3a')), F(E(27, 31.6, 0.35, 0.35, INK)), F(E(25.8, 33.2, 0.6, 0.4, '#ffb0c0'))];
    default: return capeFront(t, p);
  }
}

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
  legs: (t, p, skin) => pick(LEGS, t, () => ({ top: p.main, low: p.main, pad: null }))(p, skin),
  skirt: (t, p, m) => SKIRTS[keyOf(t)]?.(p, m) ?? null,
  shoe: (t, p, k) => pick(SHOES, t, () => [k.sole(k.tint(p.main))])(p, k, k.tint),
  hand: swimHand,
  cape: swimCape,
  capeFront: swimCapeFront,
};
