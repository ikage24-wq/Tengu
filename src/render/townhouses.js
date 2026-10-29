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
