// The towns' bigger buildings and plaza pieces (the town redesign): two-storey cottages that line
// the street with balconies, window boxes and ivy; the giant cherry tree over Sprout's plaza with
// a round bench at its foot; and the plaza's noticeboard. Drawn like the rest of the scenery:
// outlined pastel shapes, every part lit from the upper left, shaded by hand with the prop kit.

import { R, E, T, F, mix, shade } from './pixel.js';
import { ramp, planks, stones, windowPane, wallShade, beam, gable, foliage, bark, hash } from './propkit.js';
import { art } from './scenery.js';

const pick = (list, seed) => list[Math.floor(hash(seed) * list.length) % list.length];
const WALLS = ['#fff4e6', '#ffe3ef', '#e9e2ff', '#e2f6ec', '#ffeacf'];
const ROOFS = ['#ff9ec0', '#9fb8ff', '#ffb38a', '#b9a7ff', '#7fd1a8'];
const BLOOMS = ['#ff9ec0', '#ffe36b', '#c9a6ff', '#ffffff', '#ffb38a'];

// A window with its sill, a box of flowers under it, and sometimes shutters.
function window2(x, y, w, h, wall, seed, shutters) {
  const out = [...windowPane(x, y, w, h, '#ffffff', '#ffd98a', '#fff6c9'), F(R(x - 1, y + h + 0.8, w + 2, 0.8, wall.sh))];
  if (shutters) {
    const s = ramp(pick(['#9fd8c4', '#ffb3cf', '#b9a7ff'], seed), 0.8);
    out.push(R(x - 5, y - 0.8, 3.6, h + 1.6, s.base), F(R(x - 3.4, y - 0.8, 1.2, h + 1.6, s.sh)), R(x + w + 1.4, y - 0.8, 3.6, h + 1.6, s.base), F(R(x + w + 3.2, y - 0.8, 1.2, h + 1.6, s.sh)));
  }
  out.push(...beam(x - 2, y + h + 2, w + 4, 3, '#c99a6b'));
  for (let k = 0; k < 4; k++) out.push(F(E(x - 0.5 + k * (w + 1) / 3, y + h + 1.6, 1.5, 1.4, pick(BLOOMS, seed + k * 3.3))));
  out.push(F(E(x + w * 0.3, y + h + 1.2, 1, 0.7, '#8fdc9a')), F(E(x + w * 0.75, y + h + 1, 1, 0.7, '#8fdc9a')));
  return out;
}

// A two-storey cottage, 120 wide and 156 tall: a stone foot, plaster walls with timber beams, a
// tiled gable with a dormer, a round door under a little porch roof, an upstairs balcony with a
// railing and pots, a chimney, and ivy up one corner. `seed` picks its colours and a few details.
export function cottageArt(seed) {
  const wallC = pick(WALLS, seed);
  const roofC = pick(ROOFS, seed * 7 + 1);
  const mirror = hash(seed * 3) > 0.5;
  return art(`cottage|${wallC}|${roofC}|${mirror}`, 120, 156, () => {
    const W = 120;
    const H = 156;
    const wall = ramp(wallC, 0.6);
    const roof = ramp(roofC, 0.8);
    const wood = ramp('#c99a6b', 0.8);
    const stone = ramp('#d8cce4', 0.7);
    const top = 62;
    const out = [];
    // Chimney behind the roof.
    out.push(...stones(mirror ? 22 : 86, 22, 12, 30, ramp('#e2c6c0', 0.7), seed, { rowH: 5, blockW: 6 }), ...beam(mirror ? 20 : 84, 19, 16, 4, shade(roofC, -14)));
    // Walls: plaster over a stone foot, timber posts and a beam between the floors.
    out.push(R(10, top, 100, H - top, wall.base), ...wallShade(10, top + 2, 100, H - top - 2, wall, 3));
    out.push(...stones(10, H - 18, 100, 18, stone, seed * 5, { rowH: 6, blockW: 11 }));
    for (const x of [10, 106]) out.push(R(x, top, 4, H - top - 18, wood.base), F(R(x + 2.6, top, 1.4, H - top - 18, wood.sh)));
    out.push(...beam(10, top + 46, 100, 4, '#c99a6b'));
    // The roof: a deep gable with a lit verge, and a dormer window in it.
    out.push(...gable(0, W, top + 4, 8, roofC, seed * 11));
    out.push(R(50, 34, 20, 18, wall.base), T([[46, 36], [60, 24], [74, 36]], roof.base), F(T([[60, 24], [74, 36], [61, 36]], roof.sh)), ...window2(54, 38, 12, 10, wall, seed + 9, false));
    // Upstairs: two windows and a balcony door, with a railing out front.
    const [lx, rx] = mirror ? [80, 22] : [22, 80];
    out.push(...window2(lx, top + 10, 18, 16, wall, seed + 1, true));
    out.push(R(rx - 2, top + 8, 22, 34, wood.sh), ...planks(rx, top + 10, 18, 32, wood, 3, seed * 2), F(E(rx + 14, top + 28, 1, 1, '#ffe36b')));
    out.push(...beam(rx - 8, top + 42, 34, 3, '#c99a6b'));
    for (let k = 0; k < 7; k++) out.push(R(rx - 6 + k * 5, top + 32, 1.6, 10, '#fff4ea'), F(R(rx - 5.2 + k * 5, top + 32, 0.6, 10, '#e2d4c8')));
    out.push(...beam(rx - 8, top + 30, 34, 2.4, '#fff4ea'));
    out.push(E(rx - 4, top + 29, 4, 3, '#d98a6a'), ...foliage(rx - 4, top + 25, 5, 4, ramp('#8fdc9a'), seed, { flat: true }), F(E(rx - 5, top + 23, 1.6, 1.6, pick(BLOOMS, seed + 5))));
    // Downstairs: a window and the round front door under a little porch roof, a step, a lamp.
    out.push(...window2(lx, top + 62, 18, 16, wall, seed + 2, false));
    const dx = rx + 2;
    out.push(E(dx + 7, top + 66, 9, 7, wood.sh), R(dx - 2, top + 66, 18, 28, wood.sh), ...planks(dx - 1, top + 67, 16, 27, wood, 3, seed * 7), E(dx + 7, top + 67, 8, 6, wood.base));
    out.push(F(E(dx + 12, top + 82, 1.2, 1.2, '#ffe36b')), ...beam(dx - 6, H - 3, 26, 3, '#e2d8ee'));
    out.push(T([[dx - 9, top + 60], [dx + 7, top + 52], [dx + 23, top + 60]], roof.base), F(T([[dx + 7, top + 52], [dx + 23, top + 60], [dx + 8, top + 60]], roof.sh)));
    out.push(R(dx + 20, top + 66, 2, 8, '#7a6a8a'), E(dx + 21, top + 76, 3, 3.6, '#fff3a6'), F(E(dx + 21.6, top + 76.6, 1.6, 2.2, '#ffe08a')));
    // Ivy up the corner, with a few flowers.
    const ivy = ramp('#7fd19a');
    const ix = mirror ? 106 : 12;
    for (let y = H - 22; y > top + 10; y -= 9) out.push(...foliage(ix + Math.sin(y * 0.2) * 3, y, 4.4, 3.4, ivy, y + seed, { flat: true }));
    out.push(F(E(ix + 2, top + 40, 1.4, 1.4, '#ff9ec0')), F(E(ix - 2, top + 70, 1.4, 1.4, '#ffffff')));
    // A bush and a flower bed at the foot.
    out.push(...foliage(mirror ? 100 : 20, H - 6, 9, 6, ramp('#8fdc9a'), seed * 3, { tips: 2 }));
    for (let k = 0; k < 5; k++) out.push(F(E((mirror ? 92 : 12) + k * 4, H - 9 + (k % 2), 1.5, 1.5, pick(BLOOMS, seed + k))));
    return out;
  }, false);
}

// The giant cherry tree over Sprout's plaza, 240 wide and 220 tall: a broad twisting trunk, boughs
// spreading over the plaza under a lumpy crown of pink, and a round wooden bench at its foot.
export function plazaTreeArt(v = 0) {
  return art(`plazatree|${v}`, 240, 220, () => {
    const b = ramp('#8a6a74', 0.85);
    const pink = ramp(['#ffc6de', '#ffb8d6'][v], 0.8);
    const out = [];
    out.push(T([[102, 220], [106, 170], [100, 130], [110, 100], [130, 100], [138, 132], [134, 170], [140, 220]], b.base), F(T([[124, 220], [128, 170], [132, 132], [130, 100], [138, 132], [134, 170], [140, 220]], b.sh)));
    out.push(...bark([[108, 130], [80, 104], [48, 92], [24, 90]], (u) => 7 - u * 4.5, b, 1, 3), ...bark([[130, 124], [160, 102], [192, 92], [216, 92]], (u) => 7 - u * 4.5, b, 2, 3), ...bark([[118, 104], [116, 70], [122, 46]], (u) => 6 - u * 3, b, 3, 2));
    for (const [cx, cy, rx, ry, k] of [[40, 80, 40, 28, 1], [200, 78, 42, 30, 2], [120, 56, 70, 46, 3], [76, 44, 40, 30, 4], [164, 40, 40, 30, 5], [120, 22, 44, 22, 6]]) out.push(...foliage(cx, cy, rx, ry, pink, v * 9 + k, { tips: 5 }));
    for (let k = 0; k < 26; k++) {
      const x = 14 + ((k * 53) % 212);
      const y = 14 + ((k * 31) % 92);
      out.push(...[0, 1, 2, 3, 4].map((i) => F(E(x + Math.cos(i * 1.26) * 1.6, y + Math.sin(i * 1.26) * 1.6, 1.3, 1.3, k % 3 ? '#ffffff' : '#ff8fb8'))));
    }
    // The round bench: a curved seat round the trunk on short legs.
    const seat = ramp('#d9a273', 0.8);
    out.push(E(120, 206, 52, 9, seat.sh), F(E(120, 203, 50, 8, seat.base)), F(E(120, 201, 46, 5, seat.hi)), F(E(120, 203, 22, 4, b.base)));
    for (const x of [76, 100, 140, 164]) out.push(R(x - 2, 208, 4, 12, seat.sh));
    out.push(E(70, 219, 10, 1.4, '#8fdc9a'), E(170, 219, 12, 1.4, '#8fdc9a'));
    return out;
  }, false);
}

// The plaza noticeboard: a little roofed board on two legs, pinned with quest notes and drawings.
export function noticeboardArt() {
  return art('noticeboard', 56, 70, () => {
    const wood = ramp('#c99a6b', 0.8);
    const roof = ramp('#7fd1a8', 0.8);
    const out = [R(8, 20, 5, 50, wood.base), F(R(11, 20, 2, 50, wood.sh)), R(43, 20, 5, 50, wood.base), F(R(46, 20, 2, 50, wood.sh))];
    out.push(...planks(6, 22, 44, 30, ramp('#e8c69a', 0.8), 5, 3), F(R(6, 22, 44, 2, wood.sh)));
    out.push(T([[0, 22], [28, 6], [56, 22], [52, 24], [28, 10], [4, 24]], roof.base), F(T([[28, 6], [56, 22], [52, 24], [28, 10]], roof.sh)));
    const notes = [[10, 26, 12, 10, '#fffaf0'], [25, 25, 10, 13, '#ffe3ef'], [37, 27, 10, 9, '#e2f6ec'], [12, 38, 11, 11, '#e9e2ff'], [27, 40, 12, 9, '#fff4c4']];
    for (const [x, y, w, h, c] of notes) out.push(R(x, y, w, h, c), F(R(x + 1, y + 3, w - 3, 0.6, '#c9b6d8')), F(R(x + 1, y + 5, w - 4, 0.6, '#c9b6d8')), F(E(x + w / 2, y + 1, 1, 1, '#ff6b8a')));
    out.push(F(E(43, 44, 3, 3, '#ffd66b')), F(E(43, 44, 1.4, 1.4, '#fff3a6')));
    return out;
  }, false);
}

// ---------- Pastel Harbor ----------

const CANAL = ['#ffd6e6', '#cfe2ff', '#fff1c4', '#d8f2e4', '#e6dcff'];

// A tall, narrow canal house, 84 wide and 176 tall: three floors of pastel plaster under a stepped
// gable, warm lit windows (it's always evening at the harbor), a hoist beam at the top, a door up
// two steps, and a little awning over the ground-floor window.
export function canalHouseArt(seed) {
  const wallC = pick(CANAL, seed);
  const trimC = pick(['#ffffff', '#fff4ea', '#ece4ff'], seed * 5);
  return art(`canal|${wallC}|${trimC}`, 84, 176, () => {
    const W = 84;
    const H = 176;
    const wall = ramp(wallC, 0.6);
    const trim = ramp(trimC, 0.6);
    const wood = ramp('#8a6a5a', 0.8);
    const top = 40;
    const out = [];
    // The stepped gable: three steps up each side to the hoist beam.
    out.push(T([[6, top + 6], [6, top - 4], [14, top - 4], [14, top - 14], [22, top - 14], [22, top - 24], [30, top - 24], [30, top - 34], [54, top - 34], [54, top - 24], [62, top - 24], [62, top - 14], [70, top - 14], [70, top - 4], [78, top - 4], [78, top + 6]], wall.base));
    out.push(F(T([[54, top - 34], [54, top - 24], [62, top - 24], [62, top - 14], [70, top - 14], [70, top - 4], [78, top - 4], [78, top + 6], [64, top + 6]], wall.sh)));
    for (const [x, y, w] of [[6, top - 6, 8], [14, top - 16, 8], [22, top - 26, 8], [30, top - 36, 24], [54, top - 26, 8], [62, top - 16, 8], [70, top - 6, 8]]) out.push(...beam(x - 1, y, w + 2, 3, trimC));
    out.push(R(40, top - 30, 4, 8, wood.base), R(38, top - 32, 16, 3, wood.base), R(51, top - 29, 1, 6, '#5a4a6a'));
    // Three floors of plaster with trim bands.
    out.push(R(6, top + 6, 72, H - top - 6, wall.base), ...wallShade(6, top + 8, 72, H - top - 8, wall, 2.4));
    for (const y of [top + 50, top + 94]) out.push(...beam(4, y, 76, 3.4, trimC));
    // Windows: two a floor upstairs, lit, with shutters; a round one in the gable.
    out.push(E(42, top - 12, 6, 6, trim.base), F(E(42, top - 12, 4.4, 4.4, '#ffd98a')), F(E(41, top - 13, 1.8, 1.8, '#fff6c9')));
    for (const y of [top + 14, top + 58]) for (const x of [16, 52]) out.push(...window2(x, y, 16, 22, wall, seed + x + y, true));
    // Ground floor: the door up two steps, and a window under a striped awning.
    out.push(R(12, H - 44, 22, 40, wood.sh), ...planks(13, H - 43, 20, 39, wood, 3, seed * 5), E(23, H - 44, 11, 7, wood.sh), E(23, H - 43, 10, 6, wood.base), F(E(29, H - 24, 1.2, 1.2, '#ffe36b')));
    out.push(...beam(8, H - 4, 30, 4, '#c9c3d8'), ...beam(10, H - 8, 26, 4, '#d8d2e6'));
    out.push(...window2(48, H - 40, 20, 18, wall, seed + 3, false));
    const aw = pick(['#ff8fb0', '#8fb8ff', '#7fd1a8'], seed * 9);
    for (let k = 0; k < 6; k++) out.push(T([[44 + k * 5, H - 52], [49 + k * 5, H - 52], [49 + k * 5, H - 46], [44 + k * 5, H - 44]], k % 2 ? '#ffffff' : aw));
    return out;
  }, false);
}

// The pier: a long boardwalk on posts over a strip of water, with lamp posts, a bollard and coiled
// rope; two rowboats tied up alongside bob on the water (drawn live). 300 wide, 90 tall: its deck
// is a ledge on the map 54px up.
export function pierArt() {
  return art('pier', 300, 90, () => {
    const wood = ramp('#b08a6a', 0.8);
    const water = ramp('#7f8fe0', 0.8);
    const out = [R(0, 70, 300, 20, water.base), F(R(0, 70, 300, 2, water.hi))];
    for (let k = 0; k < 8; k++) out.push(F(R(10 + k * 38, 78 + (k % 2) * 5, 14, 1.2, water.hi)));
    for (let x = 6; x < 300; x += 36) out.push(R(x, 40, 7, 50, wood.sh), F(R(x, 40, 2, 50, wood.base)));
    out.push(...planks(0, 36, 300, 8, wood, 30, 3, true), F(R(0, 43, 300, 1.4, wood.deep)));
    for (const x of [40, 160, 280]) out.push(R(x - 1, 6, 3, 30, '#5a4a6a'), E(x + 0.5, 8, 4, 5, '#fff3a6'), F(E(x + 1.4, 9, 2.4, 3.4, '#ffe08a')), R(x - 3, 2, 7, 3, '#5a4a6a'));
    out.push(R(100, 28, 10, 9, '#8a8aa8'), E(105, 28, 6, 2.6, '#a8a8c4'), F(E(122, 34, 7, 2.4, '#e8d29a')), F(E(122, 32, 4.6, 1.6, '#d6b87a')));
    return out;
  }, false);
}
// A little rowboat for the pier (drawn bobbing on the water by the street).
export function rowboatArt(c) {
  return art(`rowboat|${c}`, 46, 16, () => {
    const r = ramp(c, 0.8);
    return [T([[0, 4], [46, 4], [40, 15], [6, 15]], r.base), F(T([[23, 4], [46, 4], [40, 15], [23, 15]], r.sh)), R(2, 3, 42, 2.4, '#fff4ea'), F(R(12, 6, 22, 1.2, r.hi)), R(18, 0, 10, 3, '#b08a6a')];
  }, false);
}

// ---------- Ember Crag ----------

const ADOBE = ['#f2c48d', '#f6d0a4', '#e8b07c', '#f8dcb4'];

// A two-storey sandstone house, 110 wide and 120 tall, with a flat roof you can walk on (the map
// puts a ledge there): a parapet with a striped parasol and potted cacti, deep-set windows with
// woven blinds, a curtained door, and wooden beam ends poking out under the roofline.
export function adobeHouseArt(seed) {
  const wallC = pick(ADOBE, seed);
  const cloth = pick(['#ff8a5c', '#5fb8d8', '#ffd66b'], seed * 7);
  return art(`adobehouse|${wallC}|${cloth}`, 110, 150, () => {
    const W = 110;
    const H = 150;
    const top = 30;
    const wall = ramp(wallC, 0.7);
    const wood = ramp('#8a5a3c', 0.8);
    const out = [];
    // Rooftop: a parasol and pots (above the walkable roof line at `top`).
    out.push(R(80, top - 26, 2, 26, '#7a5238'), T([[62, top - 22], [81, top - 34], [100, top - 22]], cloth), F(T([[81, top - 34], [100, top - 22], [82, top - 22]], shade(cloth, -16))));
    for (let k = 0; k < 4; k++) out.push(T([[63 + k * 9, top - 22], [67.5 + k * 9, top - 22], [65 + k * 9, top - 19]], k % 2 ? '#ffffff' : cloth));
    out.push(R(12, top - 10, 10, 10, '#d98a6a'), F(R(19, top - 10, 3, 10, '#b8705a')), E(17, top - 16, 4, 6, '#7fc98a'), F(E(18.4, top - 17, 1.4, 4, '#5fae6f')));
    out.push(R(36, top - 8, 8, 8, '#d98a6a'), E(40, top - 12, 3, 4, '#9fd88a'), F(E(40, top - 15, 1.4, 1.4, '#ff9ec0')));
    // The walls, softly rounded at the top corners, with the roof parapet.
    out.push(T([[6, H], [6, top + 4], [10, top], [W - 10, top], [W - 6, top + 4], [W - 6, H]], wall.base), ...wallShade(6, top + 6, W - 12, H - top - 6, wall, 3));
    out.push(F(R(6, top, W - 12, 3, wall.hi)), F(R(W - 12, top + 4, 6, H - top - 4, mix(wall.base, wall.sh, 0.6))));
    for (let x = 14; x < W - 10; x += 16) out.push(R(x, top + 8, 6, 4, wood.base), F(R(x, top + 10.6, 6, 1.4, wood.sh)));
    // Windows with woven blinds half down, two up and one down; the curtained door.
    const win = (x, y) => [R(x - 1, y - 1, 20, 22, wall.sh), R(x, y, 18, 20, '#5a3f4c'), F(R(x + 1, y + 10, 16, 9, '#ffd98a')), ...[0, 1, 2, 3].map((k) => F(R(x, y + k * 2.6, 18, 1.6, k % 2 ? '#e8c69a' : '#d9b07a'))), ...beam(x - 3, y + 20, 24, 3, '#c97f4f')];
    out.push(...win(18, top + 24), ...win(72, top + 24), ...win(18, top + 72));
    out.push(R(64, H - 48, 28, 48, wall.sh), E(78, H - 48, 14, 8, wall.sh), R(66, H - 46, 24, 46, '#5a3f4c'));
    for (let k = 0; k < 5; k++) out.push(R(66 + k * 4.8, H - 46, 4.4, 46, k % 2 ? cloth : '#fff4e0'), F(R(66 + k * 4.8 + 3.4, H - 46, 1, 46, shade(k % 2 ? cloth : '#fff4e0', -14))));
    out.push(...beam(60, H - 3, 36, 3, '#c97f4f'));
    out.push(E(14, H - 6, 8, 5, '#9fd88a'), F(E(15, H - 7, 4, 3, '#bff0a8')), E(100, H - 4, 6, 4, '#c97f4f'));
    return out;
  }, false);
}

// The sparring arena at the heart of the crag: a ring of sand with low posts and ropes, a banner at
// each corner, a weapon rack and a gong. 280 wide, 96 tall.
export function arenaArt() {
  return art('arena', 280, 96, () => {
    const sand = ramp('#f6d4a0', 0.7);
    const wood = ramp('#8a5a3c', 0.8);
    const out = [E(140, 92, 140, 6, sand.sh), F(E(140, 90, 136, 5, sand.base)), F(E(110, 89, 60, 2, sand.hi))];
    for (const x of [8, 76, 140, 204, 272]) out.push(R(x - 3, 54, 6, 38, wood.base), F(R(x + 1, 54, 2, 38, wood.sh)), E(x, 54, 4, 2, wood.hi));
    for (const y of [62, 74]) out.push(F(R(8, y, 264, 1.6, '#e8d29a')));
    for (const [x, c] of [[8, '#e0504d'], [272, '#5a6fb0']]) {
      out.push(R(x - 1, 8, 2, 48, '#7a5238'), T([[x + 1, 10], [x + 22, 14], [x + 18, 26], [x + 22, 38], [x + 1, 36]], c), F(T([[x + 12, 12], [x + 22, 14], [x + 18, 26], [x + 22, 38], [x + 12, 36]], shade(c, -14))), F(E(x + 10, 24, 4, 4, '#ffd66b')));
    }
    out.push(R(110, 20, 3, 34, '#7a5238'), R(140, 20, 3, 34, '#7a5238'), R(108, 18, 37, 3, '#7a5238'), E(126, 36, 10, 10, '#e8b84a'), F(E(128, 38, 7, 7, '#d49a2a')), F(E(123, 33, 3, 3, '#fff3a6')));
    return out;
  }, false);
}

// ---------- Moonleaf Grove ----------

// A home grown into a giant tree trunk, 104 wide and 168 tall: round windows glowing in the bark,
// a round door at the roots, a little balcony with a lantern, a mushroom shelf, and a leafy crown.
export function treeHomeArt(seed) {
  const barkC = pick(['#8a76c4', '#7a8ac8', '#9a7ab8'], seed);
  const leafC = pick(['#9fb8ff', '#b9a7ff', '#8fd3d6'], seed * 3);
  return art(`treehome|${barkC}|${leafC}`, 104, 168, () => {
    const b = ramp(barkC, 0.85);
    const leaf = ramp(leafC, 0.85);
    const out = [];
    out.push(T([[18, 168], [26, 130], [24, 70], [32, 48], [72, 48], [80, 70], [78, 130], [86, 168]], b.base), F(T([[58, 168], [64, 130], [66, 70], [72, 48], [80, 70], [78, 130], [86, 168]], b.sh)));
    out.push(...bark([[30, 160], [32, 110], [38, 60]], () => 1.6, b, seed, 2), ...bark([[70, 160], [68, 104], [64, 62]], () => 1.4, b, seed + 1, 2));
    out.push(T([[18, 168], [4, 168], [14, 158], [24, 160]], b.base), T([[86, 168], [100, 168], [90, 158], [80, 160]], b.sh));
    for (const [cx, cy, rx, ry, k] of [[30, 40, 26, 18, 1], [74, 38, 28, 20, 2], [52, 22, 34, 22, 3]]) out.push(...foliage(cx, cy, rx, ry, leaf, seed * 5 + k, { tips: 3 }));
    // Round windows, lit, with wooden frames.
    for (const [x, y, r] of [[40, 82, 8], [64, 108, 7]]) out.push(E(x, y, r + 2, r + 2, '#c99a6b'), F(E(x, y, r, r, '#ffe9a6')), F(E(x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.4, '#fffbe0')), F(R(x - 0.5, y - r, 1, r * 2, '#c99a6b')));
    // The round door at the roots, with steps.
    out.push(E(52, 140, 14, 12, b.deep), R(38, 140, 28, 28, b.deep), E(52, 141, 12, 10, '#c99a6b'), R(40, 141, 24, 27, '#c99a6b'), F(R(51.4, 132, 1.2, 36, '#a07a54')), F(E(58, 154, 1.4, 1.4, '#ffe36b')), ...beam(36, 164, 32, 4, '#c9bedc'));
    // A balcony with a railing and a hanging lantern.
    out.push(...beam(66, 94, 30, 3, '#c99a6b'));
    for (let k = 0; k < 5; k++) out.push(R(68 + k * 6, 84, 1.6, 10, '#e8d29a'));
    out.push(...beam(66, 82, 30, 2.4, '#e8d29a'), R(92, 96, 1, 6, '#5a4a6a'), E(92.5, 106, 3.4, 4, '#ffe9a6'), F(E(93.2, 107, 1.8, 2.8, '#ffd27a')));
    // A shelf of glowing mushrooms up the trunk.
    for (const [x, y, c] of [[24, 112, '#7fe6d6'], [21, 118, '#ffb0d0'], [27, 119, '#c9b6ff']]) out.push(R(x - 0.8, y, 1.6, 4, '#fff1dc'), E(x, y, 3, 2, c), F(E(x - 0.8, y - 0.6, 1, 0.6, '#ffffff')));
    return out;
  }, false);
}

// The moon-lantern tree over the grove's plaza: a great dark tree hung with paper lanterns (their
// light drawn live), a crescent moon charm at its heart, and a ring of stones at its foot. 260 wide,
// 240 tall.
export function moonTreeArt() {
  return art('moontree', 260, 240, () => {
    const b = ramp('#5a4a8a', 0.85);
    const leaf = ramp('#6a7ad0', 0.85);
    const out = [];
    out.push(T([[110, 240], [114, 190], [108, 140], [120, 110], [140, 110], [152, 140], [146, 190], [152, 240]], b.base), F(T([[134, 240], [140, 190], [146, 140], [140, 110], [152, 140], [146, 190], [152, 240]], b.sh)));
    out.push(...bark([[118, 140], [88, 118], [52, 108], [24, 108]], (u) => 7 - u * 4.5, b, 1, 3), ...bark([[142, 134], [174, 112], [210, 104], [236, 106]], (u) => 7 - u * 4.5, b, 2, 3));
    for (const [cx, cy, rx, ry, k] of [[44, 92, 42, 28, 1], [216, 90, 42, 28, 2], [130, 66, 76, 50, 3], [84, 46, 44, 32, 4], [178, 42, 44, 32, 5], [130, 24, 48, 24, 6]]) out.push(...foliage(cx, cy, rx, ry, leaf, k * 3, { tips: 4 }));
    // The crescent charm hanging at the heart of the crown.
    out.push(R(129.4, 100, 1.2, 14, '#e8d29a'), E(130, 124, 10, 10, '#fff3c4'), F(E(134, 121, 8, 9, leaf.base)), F(E(126, 121, 1.6, 1.6, '#ffffff')));
    // Lantern strings down from the boughs (the lanterns themselves glow, drawn by the street).
    for (const x of [30, 62, 92, 170, 200, 230]) out.push(R(x - 0.4, 104, 0.8, 18 + (x % 3) * 6, '#3a2d4f'));
    out.push(...[80, 96, 112, 148, 164, 180].map((x, i) => E(x, 234 + (i % 2), 8, 5, i % 2 ? '#a897de' : '#c9bedc')));
    return out;
  }, false);
}
// Where the moon tree's lanterns hang (relative to its base center), for their glow and swing.
export const MOON_LANTERNS = [[-100, -112], [-68, -106], [-38, -112], [40, -100], [70, -106], [100, -112]];

// The town stove: a little brick oven with a copper pot bubbling on top and a wooden spoon,
// a stack of firewood beside it. 56 wide, 58 tall (the fire and steam are drawn live).
export function stoveArt() {
  return art('stove', 56, 58, () => {
    const brick = ramp('#e8a98a', 0.75);
    const pot = ramp('#e0956a', 0.8);
    const out = [...stones(8, 30, 40, 28, brick, 4, { rowH: 6, blockW: 9 }), R(6, 27, 44, 4, brick.base), F(R(6, 30, 44, 1, brick.sh))];
    out.push(E(28, 48, 9, 7, '#3a2d4f'), R(19, 48, 18, 10, '#3a2d4f'));
    out.push(T([[12, 27], [14, 14], [42, 14], [44, 27]], pot.base), F(T([[30, 14], [42, 14], [44, 27], [32, 27]], pot.sh)), R(10, 12, 36, 3, pot.hi), F(R(10, 14, 36, 1, pot.sh)));
    out.push(E(28, 13, 15, 2.4, '#ffd6a0'), F(E(24, 12.6, 5, 1, '#fff1c4')));
    out.push(T([[38, 12], [46, 0], [48, 1], [40, 13]], '#c99a6b'), E(47, 0.6, 2.4, 1.6, '#c99a6b'));
    for (const [x, y] of [[50, 50], [52, 54], [48, 54]]) out.push(E(x, y, 4, 2, '#a07a54'), F(E(x - 2, y, 1.2, 1.4, '#e8c69a')));
    return out;
  }, false);
}
