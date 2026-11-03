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

// A shingled hip roof across x0 ... x1 from `base` up to a short ridge at `top` (inset by `inset`
// each side): lit on the left, the right end in shade, a course line every 6 px.
function hipRoof(x0, x1, base, top, inset, c, seed) {
  const r = ramp(c, 0.8);
  const out = [T([[x0, base], [x0 + inset, top], [x1 - inset, top], [x1, base]], c)];
  out.push(F(T([[x1 - inset - 14, top], [x1 - inset, top], [x1, base], [x1 - 24, base]], mix(c, r.sh, 0.65))));
  for (let y = base - 6, row = 0; y > top + 3; y -= 6, row++) {
    const k = (base - y) / (base - top);
    const a = x0 + inset * k + 1;
    const b = x1 - inset * k - 1;
    out.push(F(R(a, y, b - a, 0.8, r.sh)));
    for (let x = a + 3 + (row % 2) * 3; x < b - 2; x += 7) if (hash(seed + row * 2.7 + x) > 0.3) out.push(F(R(x, y - 5, 0.6, 5, r.sh)));
  }
  out.push(F(T([[x0 + 1, base - 0.6], [x0 + inset + 1, top + 0.6], [x0 + inset + 3, top + 0.6], [x0 + 3.6, base - 0.6]], r.hi)), F(R(x0 + inset, top, x1 - x0 - inset * 2, 1.2, r.hi)));
  return out;
}

// An arched window: a round top over a square pane, frame and sill.
function archWindow(x, y, w, h, frame) {
  const r = w / 2;
  return [E(x + r, y + r, r + 1, r + 1, frame), R(x - 1, y + r, w + 2, h - r + 1, frame), F(E(x + r, y + r, r, r, '#ffd98a')), F(R(x, y + r, w, h - r, '#ffd98a')), F(E(x + r - r * 0.3, y + r * 0.8, r * 0.5, r * 0.5, '#fff6c9')), F(R(x + r - 0.35, y + 1, 0.7, h - 1, frame)), F(R(x, y + r + (h - r) * 0.45, w, 0.7, frame))];
}

// A wide, low bungalow, 156 wide and 104 tall: one storey under a big hip roof, an arched bay
// window with a flower box, the front door under its own little porch, a chimney. Its long low
// shape sits between the tall houses so the street has a rhythm.
export function bungalowArt(seed) {
  const wallC = pick(WALLS, seed * 5 + 2);
  const roofC = pick(ROOFS, seed * 3 + 4);
  return art(`bungalow|${wallC}|${roofC}`, 156, 104, () => {
    const wall = ramp(wallC, 0.6);
    const roof = ramp(roofC, 0.8);
    const wood = ramp('#c99a6b', 0.8);
    const out = [];
    out.push(...stones(112, 6, 12, 24, ramp('#e2c6c0', 0.7), seed, { rowH: 5, blockW: 6 }), ...beam(110, 3, 16, 4, shade(roofC, -14)));
    out.push(R(14, 44, 128, 50, wall.base), ...wallShade(14, 46, 128, 48, wall, 3));
    out.push(...stones(12, 92, 132, 12, ramp('#d8cce4', 0.7), seed * 5, { rowH: 6, blockW: 11 }));
    out.push(...hipRoof(2, 154, 48, 14, 30, roofC, seed * 11), ...beam(4, 46, 148, 4, shade(roofC, -18)));
    // The arched bay window and its flower box.
    out.push(...archWindow(30, 54, 34, 32, '#ffffff'), ...beam(26, 87, 42, 3, '#c99a6b'));
    for (let k = 0; k < 7; k++) out.push(F(E(29 + k * 6, 86, 2, 1.8, pick(BLOOMS, seed + k * 1.7))));
    out.push(...archWindow(74, 58, 14, 18, '#ffffff'));
    // The door under its porch: two posts and a small gable.
    out.push(R(98, 60, 22, 32, wood.sh), ...planks(99, 61, 20, 31, wood, 3, seed * 7), F(E(115, 77, 1.2, 1.2, '#ffe36b')));
    out.push(R(91, 54, 3, 38, '#fff4ea'), R(124, 54, 3, 38, '#fff4ea'));
    out.push(T([[86, 56], [109, 40], [132, 56]], roof.base), F(T([[109, 40], [132, 56], [110, 56]], roof.sh)), ...beam(86, 55, 46, 3, '#fff4ea'));
    out.push(...beam(94, 101, 30, 3, '#e2d8ee'));
    out.push(...foliage(140, 98, 8, 6, ramp('#8fdc9a'), seed * 3, { tips: 2 }), ...foliage(18, 99, 7, 5, ramp('#8fdc9a'), seed * 4, { tips: 2 }));
    return out;
  }, false);
}

// A tall, narrow townhouse, 88 wide and 190 tall: three floors under a steep gable with a round
// attic window, a bay window jutting out of the top floor, shuttered windows on the middle floor,
// and an arched door with a lantern at street level.
export function townhouseArt(seed) {
  const wallC = pick(WALLS, seed * 9 + 3);
  const roofC = pick(ROOFS, seed * 13 + 2);
  return art(`townhouse|${wallC}|${roofC}`, 88, 190, () => {
    const wall = ramp(wallC, 0.6);
    const roof = ramp(roofC, 0.8);
    const wood = ramp('#c99a6b', 0.8);
    const out = [];
    out.push(R(8, 50, 72, 128, wall.base), ...wallShade(8, 52, 72, 126, wall, 3));
    out.push(...stones(6, 176, 76, 14, ramp('#d8cce4', 0.7), seed * 5, { rowH: 7, blockW: 10 }));
    for (const y of [92, 134]) out.push(...beam(6, y, 76, 4, '#c99a6b'));
    out.push(...gable(0, 88, 54, 2, roofC, seed * 11), ...beam(2, 52, 84, 4, shade(roofC, -18)));
    out.push(E(44, 34, 7, 7, '#ffffff'), F(E(44, 34, 5.6, 5.6, '#ffd98a')), F(E(42.6, 32.6, 2.6, 2.6, '#fff6c9')), F(R(43.6, 28.4, 0.8, 11.2, '#ffffff')));
    // The top floor's bay window: a box jutting out on brackets, with its own little roof.
    out.push(R(24, 62, 40, 26, wall.base), F(R(60, 62, 4, 26, wall.sh)), ...windowPane(30, 66, 28, 16, '#ffffff', '#ffd98a', '#fff6c9'));
    out.push(T([[20, 63], [44, 54], [68, 63]], roof.base), F(T([[44, 54], [68, 63], [45, 63]], roof.sh)));
    out.push(T([[26, 88], [34, 88], [30, 94]], wood.sh), T([[54, 88], [62, 88], [58, 94]], wood.sh));
    // The middle floor: two shuttered windows.
    out.push(...window2(18, 104, 14, 16, wall, seed + 1, true), ...window2(56, 104, 14, 16, wall, seed + 2, true));
    // Street level: an arched door with a lantern, and a window.
    out.push(...archWindow(14, 146, 16, 20, '#ffffff'));
    out.push(E(56, 150, 11, 11, wood.sh), R(45, 150, 22, 26, wood.sh), ...planks(46, 151, 20, 25, wood, 3, seed * 7), E(56, 151, 10, 9.6, wood.base));
    out.push(F(E(62, 164, 1.2, 1.2, '#ffe36b')), R(72, 146, 2, 6, '#7a6a8a'), E(73, 155, 3, 3.6, '#fff3a6'), F(E(73.6, 155.6, 1.6, 2.2, '#ffe08a')));
    out.push(...beam(42, 187, 28, 3, '#e2d8ee'));
    return out;
  }, false);
}

// The village inn, 240 wide and 176 tall, built so you can climb it: the porch roof runs the whole
// front as a deck 80 px up (a railing at each end, the inn's sign hanging under it), and the upper
// floor, set back, has a roof terrace 160 px up with potted plants at its corners. Both decks are
// the map's own ledges (bare platforms), so you jump up the building, not up scaffolding.
export function innArt() {
  return art('inn', 240, 176, () => {
    const wall = ramp('#fff4e6', 0.6);
    const upper = ramp('#ffe3ef', 0.6);
    const wood = ramp('#c99a6b', 0.8);
    const deck = ramp('#e2b98a', 0.8);
    const out = [];
    // Upper floor, set back, with its roof terrace.
    out.push(R(44, 22, 152, 74, upper.base), ...wallShade(44, 24, 152, 72, upper, 3));
    // Timber framing: corner posts, a mid rail, and cross braces between the windows.
    for (const x of [44, 92, 144, 192]) out.push(R(x, 22, 4, 72, wood.base), F(R(x + 2.6, 22, 1.4, 72, wood.sh)));
    out.push(...beam(44, 64, 152, 3, '#c99a6b'));
    for (const [a, b] of [[48, 92], [148, 192]]) out.push(F(T([[a, 92], [a + 3, 92], [b, 68], [b - 3, 68]], wood.sh)));
    out.push(...window2(60, 36, 18, 16, upper, 4, true), ...window2(162, 36, 18, 16, upper, 5, true));
    out.push(R(108, 34, 24, 54, wood.sh), ...planks(109, 35, 22, 53, wood, 3, 9), F(E(126, 62, 1, 1, '#ffe36b')));
    out.push(...planks(38, 14, 164, 8, deck, 1, 3, true), ...beam(36, 20, 168, 3, shade('#e2b98a', -20)));
    for (const x of [40, 196]) out.push(R(x, 2, 4, 12, '#fff4ea'), F(R(x + 2.6, 2, 1.4, 12, '#e2d4c8')));
    out.push(...beam(38, 2, 30, 2.4, '#fff4ea'), ...beam(172, 2, 30, 2.4, '#fff4ea'));
    for (let k = 0; k <= 14; k++) {
      const u = k / 14;
      const x = 42 + u * 156;
      const y = 3 + Math.sin(u * Math.PI) * 8;
      if (k % 2) out.push(F(E(x, y + 2.4, 2.2, 2.6, ['#ffe36b', '#ff9ec0', '#9fe0ff'][k % 3])), F(E(x - 0.6, y + 1.8, 0.9, 1, '#ffffff')));
      else out.push(F(R(x - 5.6, y, 11.2, 0.6, '#7a6a8a')));
    }
    for (const x of [52, 188]) out.push(R(x - 6, 8, 12, 7, '#d98a6a'), F(R(x + 3, 8, 3, 7, shade('#d98a6a', -16))), ...foliage(x, 5, 7, 5, ramp('#8fdc9a'), x, { tips: 3 }), F(E(x - 2, 2, 1.6, 1.6, '#ff9ec0')), F(E(x + 3, 3, 1.4, 1.4, '#ffe36b')));
    // The porch roof deck along the whole front, with a railing at each end.
    out.push(...planks(6, 94, 228, 8, deck, 1, 7, true), ...beam(4, 100, 232, 3, shade('#e2b98a', -20)));
    for (let x = 8; x <= 228; x += 10) if (x < 40 || x > 200) out.push(R(x, 84, 1.8, 10, '#fff4ea'), F(R(x + 1.1, 84, 0.7, 10, '#e2d4c8')));
    out.push(...beam(6, 82, 36, 2.4, '#fff4ea'), ...beam(198, 82, 36, 2.4, '#fff4ea'));
    // The ground floor: walls, the big double door, windows, and the porch posts.
    out.push(R(24, 103, 192, 73, wall.base), ...wallShade(24, 103, 192, 73, wall, 4));
    out.push(E(120, 140, 17, 14, wood.sh), R(103, 140, 34, 36, wood.sh), ...planks(104, 141, 16, 35, wood, 2, 11), ...planks(120, 141, 16, 35, wood, 2, 12), E(120, 141, 16, 12.6, wood.base), F(R(119.4, 130, 1.2, 46, wood.deep)));
    out.push(F(E(116, 158, 1.2, 1.2, '#ffe36b')), F(E(124, 158, 1.2, 1.2, '#ffe36b')));
    out.push(...window2(42, 120, 24, 20, wall, 6, true), ...window2(174, 120, 24, 20, wall, 7, true));
    for (const x of [36, 168]) {
      for (let k = 0; k < 6; k++) out.push(T([[x + k * 6, 108], [x + k * 6 + 6, 108], [x + k * 6 + 7, 117], [x + k * 6 + 1, 117]], k % 2 ? '#ffffff' : '#ff9ec0'));
      for (let k = 0; k < 6; k++) out.push(F(E(x + k * 6 + 4, 117, 3, 2, k % 2 ? '#ffffff' : '#ff9ec0')));
      out.push(F(R(x, 108, 37, 1.2, shade('#ff9ec0', -20))));
    }
    for (const x of [8, 226]) out.push(R(x, 102, 6, 74, '#fff4ea'), F(R(x + 4, 102, 2, 74, '#e2d4c8')), ...beam(x - 2, 172, 10, 4, '#e2d8ee'));
    out.push(...stones(24, 168, 192, 8, ramp('#d8cce4', 0.7), 21, { rowH: 8, blockW: 12 }));
    // The sign: a board with a frothy mug, hanging under the deck on two little chains.
    out.push(F(R(77, 103, 0.8, 6, '#7a6a8a')), F(R(91, 103, 0.8, 6, '#7a6a8a')), R(72, 108, 24, 14, '#e8c69a'), F(R(72, 108, 24, 1.4, wood.sh)), R(80, 112, 8, 8, '#ffb38a'), F(R(86, 112, 2, 8, shade('#ffb38a', -18))), E(84, 112, 5, 2.4, '#ffffff'), R(88, 114, 3, 1.2, '#ffb38a'), R(90, 114, 1.2, 4, '#ffb38a'));
    // A lantern by the door, and planters either side of it.
    out.push(R(144, 128, 2, 6, '#7a6a8a'), E(145, 137, 3.4, 4, '#fff3a6'), F(E(145.6, 137.6, 1.8, 2.4, '#ffe08a')));
    for (const x of [96, 152]) out.push(R(x - 5, 168, 10, 8, '#d98a6a'), ...foliage(x, 166, 6, 5, ramp('#8fdc9a'), x * 3, { tips: 2 }), F(E(x, 162, 1.5, 1.5, pick(BLOOMS, x))));
    return out;
  }, false);
}

// An open-fronted workshop shed for the craft bench, 104 wide and 100 tall: a plank back wall,
// two posts and a slanted shingle roof with a striped valance, a little sign with a hammer, so the
// bench and its pegboard read as a workshop instead of loose things on the street.
export function workshedArt(roofC = '#9fb8ff') {
  return art(`workshed|${roofC}`, 104, 100, () => {
    const wood = ramp('#c99a6b', 0.8);
    const back = ramp('#e8c69a', 0.8);
    const roof = ramp(roofC, 0.8);
    const out = [];
    out.push(...planks(8, 30, 88, 66, back, 8, 5), F(R(8, 30, 88, 6, back.sh)));
    out.push(T([[0, 34], [10, 12], [98, 18], [104, 34]], roof.base), F(T([[60, 15], [98, 18], [104, 34], [70, 34]], roof.sh)));
    for (let y = 30, row = 0; y > 16; y -= 5, row++) out.push(F(R(4 + row * 2, y, 96 - row * 3, 0.8, roof.sh)));
    out.push(F(T([[1, 33], [10.6, 12.6], [12.4, 13], [3.4, 33]], roof.hi)));
    for (let k = 0; k < 9; k++) out.push(T([[4 + k * 11, 34], [15 + k * 11, 34], [15 + k * 11, 38], [9.5 + k * 11, 41], [4 + k * 11, 38]], k % 2 ? '#ffffff' : '#ff9ec0'));
    for (const x of [6, 92]) out.push(R(x, 34, 6, 66, wood.base), F(R(x + 4, 34, 2, 66, wood.sh)), ...beam(x - 2, 96, 10, 4, '#e2d8ee'));
    out.push(R(40, 2, 26, 12, '#fff4e6'), F(R(40, 12, 26, 2, '#e2d4c8')), F(R(46, 0, 0.8, 3, '#7a6a8a')), F(R(60, 0, 0.8, 3, '#7a6a8a')));
    out.push(R(48, 6, 10, 2.4, '#8a7a9a'), R(51.6, 4, 2.8, 7.4, '#c99a6b'));
    return out;
  }, false);
}

// ---------- Sprout Village (the 2026-11-03 rebuild: a countryside farm village) ----------

// A thatched cottage: round-shouldered cream stone walls under a deep golden thatch that hangs low
// and soft at the eaves, a round door, a round window with a flower box, a chimney through the
// thatch. `long` makes the wide farmhouse version (two windows, a dormer).
export function thatchCottageArt(seed, long = false) {
  const W = long ? 172 : 120;
  const H = long ? 118 : 128;
  const wallC = pick(['#fff4e2', '#f8ecdc', '#fff0e8'], seed * 3);
  const doorC = pick(['#7fb0e8', '#e88aa8', '#7fc89a'], seed * 5);
  return art(`thatch|${long}|${wallC}|${doorC}`, W, H, () => {
    const wall = ramp(wallC, 0.6);
    const thatch = ramp('#f0c46a', 0.8);
    const stone = ramp('#d8ccc0', 0.7);
    const wood = ramp('#a87a5a', 0.8);
    const door = ramp(doorC, 0.7);
    const top = long ? 52 : 58;
    const out = [];
    // The chimney behind the thatch.
    out.push(...stones(W - 40, 8, 14, 34, ramp('#d8b8b0', 0.7), seed, { rowH: 5, blockW: 7 }), ...beam(W - 42, 5, 18, 4, '#a8908a'));
    // Walls: soft stone, rounded at the top corners, a stone foot.
    out.push(T([[10, H], [10, top + 10], [16, top], [W - 16, top], [W - 10, top + 10], [W - 10, H]], wall.base), ...wallShade(10, top + 4, W - 20, H - top - 4, wall, 3));
    out.push(...stones(8, H - 14, W - 16, 14, stone, seed * 5, { rowH: 7, blockW: 12 }));
    // The thatch: a deep rounded hat of straw, layered with soft scalloped courses, eaves hanging low.
    const ridge = 6;
    out.push(T([[0, top + 14], [6, top - 2], [W * 0.3, ridge + 4], [W * 0.5, ridge], [W * 0.7, ridge + 4], [W - 6, top - 2], [W, top + 14], [W - 10, top + 18], [W * 0.5, top + 20], [10, top + 18]], thatch.base));
    out.push(F(T([[W * 0.62, ridge + 2], [W * 0.7, ridge + 4], [W - 6, top - 2], [W, top + 14], [W - 10, top + 18], [W * 0.75, top + 19]], thatch.sh)));
    for (let row = 0; row < 4; row++) {
      const y = ridge + 12 + row * ((top + 6 - ridge) / 4);
      const k = (y - ridge) / (top + 18 - ridge);
      const x0 = W * 0.5 - (W * 0.2 + (W * 0.32) * k);
      const x1 = W * 0.5 + (W * 0.2 + (W * 0.32) * k);
      for (let x = x0; x < x1 - 4; x += 9) out.push(F(E(x + 4.5, y, 4.6, 2, x > W * 0.62 ? thatch.deep : thatch.sh)));
    }
    for (let x = 4; x < W - 6; x += 8) out.push(F(E(x + 4, top + 16 + Math.sin(x) * 1, 4.4, 2.4, thatch.sh)), F(R(x + 2, top + 15, 1, 5, thatch.deep)));
    out.push(F(T([[6, top - 2], [W * 0.3, ridge + 4], [W * 0.34, ridge + 8], [12, top + 4]], thatch.hi)));
    if (long) {
      // A dormer peeking out of the thatch.
      out.push(R(W * 0.42, ridge + 18, 22, 18, wall.base), T([[W * 0.42 - 4, ridge + 20], [W * 0.42 + 11, ridge + 8], [W * 0.42 + 26, ridge + 20]], thatch.base), F(E(W * 0.42 + 11, ridge + 28, 5, 5, '#ffd98a')), F(E(W * 0.42 + 9, ridge + 26, 2, 2, '#fff6c9')));
    }
    // The round door with its step and a little lamp, round windows with flower boxes.
    const dx = long ? W - 52 : W * 0.6;
    out.push(E(dx, H - 26, 13, 13, wood.sh), R(dx - 13, H - 26, 26, 22, wood.sh), E(dx, H - 25, 11, 11, door.base), R(dx - 11, H - 25, 22, 21, door.base), F(E(dx - 3, H - 30, 4, 4, door.hi)), F(R(dx - 0.5, H - 36, 1, 32, door.sh)), F(E(dx + 6, H - 16, 1.4, 1.4, '#ffe36b')));
    out.push(...beam(dx - 16, H - 4, 32, 4, '#e2d8ee'));
    out.push(R(dx + 15, H - 40, 2, 6, '#7a6a8a'), E(dx + 16, H - 31, 3, 3.6, '#fff3a6'), F(E(dx + 16.6, H - 30.4, 1.6, 2.2, '#ffe08a')));
    const windows = long ? [30, 76] : [W * 0.26];
    for (const wx of windows) {
      out.push(E(wx, top + 34, 11, 11, '#ffffff'), F(E(wx, top + 34, 9, 9, '#ffd98a')), F(E(wx - 3, top + 31, 3.6, 3.6, '#fff6c9')), F(R(wx - 0.5, top + 25, 1, 18, '#ffffff')), F(R(wx - 9, top + 33.5, 18, 1, '#ffffff')));
      out.push(...beam(wx - 13, top + 45, 26, 4, '#a87a5a'));
      for (let k = 0; k < 5; k++) out.push(F(E(wx - 9 + k * 4.5, top + 44 + (k % 2), 2, 1.8, pick(BLOOMS, seed + k + wx))));
    }
    // A bush and a bed of flowers at the foot.
    out.push(...foliage(long ? 14 : W - 14, H - 6, 9, 6, ramp('#8fdc9a'), seed * 3, { tips: 2 }));
    for (let k = 0; k < 6; k++) out.push(F(E((long ? 100 : 16) + k * 4, H - 9 + (k % 2), 1.5, 1.5, pick(BLOOMS, seed + k * 2.1))));
    return out;
  }, false);
}

// The village gate: two stone posts wound with flowering vines, a curved wooden arch between them
// (the village's name is hung on it live), lanterns on the posts.
export function gateArchArt() {
  return art('gatearch', 170, 132, () => {
    const stone = ramp('#e2d8cc', 0.7);
    const wood = ramp('#b8885a', 0.8);
    const vine = ramp('#7fc06a', 0.8);
    const out = [];
    for (const x of [8, 140]) out.push(...stones(x, 40, 22, 92, stone, x, { rowH: 8, blockW: 11 }), ...beam(x - 3, 36, 28, 6, '#d8ccc0'), R(x + 7, 24, 8, 12, '#7a6a8a'), E(x + 11, 22, 5, 5, '#fff3a6'), F(E(x + 11.6, 22.6, 2.6, 3, '#ffe08a')));
    // The arch: a curved beam spanning the posts.
    const arch = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      arch.push([18 + u * 134, 44 - Math.sin(u * Math.PI) * 22]);
    }
    for (let i = 0; i < arch.length - 1; i++) out.push(T([arch[i], arch[i + 1], [arch[i + 1][0], arch[i + 1][1] + 9], [arch[i][0], arch[i][1] + 9]], wood.base), F(T([arch[i], arch[i + 1], [arch[i + 1][0], arch[i + 1][1] + 2], [arch[i][0], arch[i][1] + 2]], wood.hi)));
    // Vines wound up the posts and along the arch, with flowers.
    for (const x of [8, 140]) for (let y = 128; y > 44; y -= 10) out.push(...foliage(x + 11 + Math.sin(y * 0.3) * 9, y, 5, 4, vine, y + x, { flat: true }));
    for (let i = 1; i < arch.length - 1; i += 2) out.push(...foliage(arch[i][0], arch[i][1] + 2, 5, 3.6, vine, i, { flat: true }), F(E(arch[i][0] + 2, arch[i][1], 1.8, 1.8, pick(BLOOMS, i * 1.7))));
    return out;
  }, false);
}

// The great windmill in Sprout's square, 140 wide and 280 tall: a tapered white tower of stone on a
// wide base, a thatched cap, a door and little windows, and a railed balcony (a ledge on the map)
// round its middle. Its sails are drawn live by the town (render/town.js), turning slowly: the wind
// has nearly stopped.
export const WINDMILL = { w: 140, h: 280, hub: [70, 52], balcony: 150 };
export function windmillTowerArt() {
  return art('windmilltower', WINDMILL.w, WINDMILL.h, () => {
    const wall = ramp('#fff8f0', 0.6);
    const stone = ramp('#d8ccc0', 0.7);
    const thatch = ramp('#f0c46a', 0.8);
    const wood = ramp('#a87a5a', 0.8);
    const H = WINDMILL.h;
    const out = [];
    // The tower: tapering from a wide base to the cap.
    out.push(T([[20, H], [36, 60], [104, 60], [120, H]], wall.base), F(T([[86, 60], [104, 60], [120, H], [96, H]], wall.sh)));
    for (const y of [110, 170, 230]) out.push(F(R(36 - (y - 60) * 0.06, y, 68 + (y - 60) * 0.12, 1.4, wall.sh)));
    out.push(...stones(14, H - 26, 112, 26, stone, 11, { rowH: 9, blockW: 16 }));
    // The cap: a thatched dome with a little finial.
    out.push(T([[26, 66], [34, 40], [52, 24], [70, 18], [88, 24], [106, 40], [114, 66]], thatch.base), F(T([[80, 20], [88, 24], [106, 40], [114, 66], [92, 66]], thatch.sh)));
    for (let x = 28; x < 112; x += 8) out.push(F(E(x + 4, 66, 4.4, 2.4, thatch.sh)));
    out.push(F(T([[34, 40], [52, 24], [56, 28], [40, 44]], thatch.hi)), R(68, 6, 4, 14, wood.sh), E(70, 6, 4, 4, '#ffd36b'));
    // Windows and the big arched door.
    for (const [x, y] of [[62, 90], [70, 200]]) out.push(E(x + 6, y, 6, 6, '#a87a5a'), R(x, y, 12, 12, '#a87a5a'), F(E(x + 6, y, 4.4, 4.4, '#ffd98a')), F(R(x + 1.6, y, 8.8, 10, '#ffd98a')), F(E(x + 4, y - 2, 2, 2, '#fff6c9')));
    out.push(E(70, H - 46, 15, 15, wood.sh), R(55, H - 46, 30, 42, wood.sh), ...planks(57, H - 45, 26, 41, wood, 3, 7), E(70, H - 45, 13, 13, wood.base), F(E(76, H - 22, 1.6, 1.6, '#ffe36b')));
    // The balcony round its middle: a plank deck on brackets and a white railing.
    const by = H - WINDMILL.balcony;
    out.push(...planks(10, by - 1, 120, 7, ramp('#e2b98a', 0.8), 1, 5, true), ...beam(8, by + 5, 124, 3, '#b88a5a'));
    for (let x = 24; x < 120; x += 24) out.push(T([[x, by + 8], [x + 8, by + 8], [x + 2, by + 18]], wood.sh));
    for (let x = 12; x <= 126; x += 8) out.push(R(x, by - 12, 1.8, 11, '#ffffff'), F(R(x + 1.1, by - 12, 0.7, 11, '#e2d4c8')));
    out.push(...beam(10, by - 14, 120, 2.6, '#ffffff'));
    // Flower boxes on the rail, ivy up the base.
    for (const x of [20, 104]) out.push(R(x - 6, by - 20, 14, 6, '#d98a6a'), ...foliage(x + 1, by - 22, 7, 4, ramp('#8fdc9a'), x, { tips: 3 }), F(E(x - 2, by - 24, 1.6, 1.6, '#ff9ec0')), F(E(x + 4, by - 23, 1.6, 1.6, '#ffe36b')));
    for (let y = H - 20; y > H - 110; y -= 10) out.push(...foliage(28 + Math.sin(y * 0.2) * 3 + (H - y) * 0.06, y, 5, 4, ramp('#7fd19a'), y, { flat: true }));
    return out;
  }, false);
}

// One windmill sail (a lattice frame with cloth), pointing up from the hub, 104 long.
export function windmillSailArt() {
  return art('windmillsail', 30, 108, () => {
    const wood = ramp('#a87a5a', 0.8);
    const out = [R(13, 0, 4, 108, wood.base), F(R(15.6, 0, 1.4, 108, wood.sh))];
    out.push(R(17, 6, 12, 74, '#fff8ee'), F(R(25, 6, 4, 74, '#ece0d6')));
    for (let y = 10; y < 80; y += 10) out.push(F(R(17, y, 12, 1, wood.sh)));
    for (const x of [21, 25]) out.push(F(R(x, 6, 1, 74, wood.sh)));
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
// `gableKind` picks the top: 'step' (stepped), 'bell' (a curved bell gable) or 'neck' (a tall
// neck with scrolled shoulders and a little pediment), so a row of them reads as different houses.
export function canalHouseArt(seed, gableKind = 'step') {
  const wallC = pick(CANAL, seed);
  const trimC = pick(['#ffffff', '#fff4ea', '#ece4ff'], seed * 5);
  return art(`canal|${wallC}|${trimC}|${gableKind}`, 84, 176, () => {
    const W = 84;
    const H = 176;
    const wall = ramp(wallC, 0.6);
    const trim = ramp(trimC, 0.6);
    const wood = ramp('#8a6a5a', 0.8);
    const top = 40;
    const out = [];
    if (gableKind === 'bell') {
      // A bell gable: curving in from the shoulders to a rounded top, a cornice along it.
      const pts = [[6, top + 6], [6, top - 2], [14, top - 6], [20, top - 14], [24, top - 24], [30, top - 31], [36, top - 35], [42, top - 36], [48, top - 35], [54, top - 31], [60, top - 24], [64, top - 14], [70, top - 6], [78, top - 2], [78, top + 6]];
      out.push(T(pts, wall.base), F(T([[42, top - 36], ...pts.slice(8), [64, top + 6]], wall.sh)));
      for (let i = 1; i < pts.length - 2; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[i + 1];
        out.push(F(T([[ax, ay - 1.4], [bx, by - 1.4], [bx, by + 1.2], [ax, ay + 1.2]], trimC)));
      }
      out.push(F(E(42, top - 37, 3, 2.4, trimC)));
    } else if (gableKind === 'neck') {
      // A neck gable: a tall neck with scrolled shoulders and a small pediment on top.
      out.push(T([[6, top + 6], [6, top - 4], [24, top - 12], [26, top - 30], [58, top - 30], [60, top - 12], [78, top - 4], [78, top + 6]], wall.base));
      out.push(F(T([[48, top - 30], [58, top - 30], [60, top - 12], [78, top - 4], [78, top + 6], [64, top + 6]], wall.sh)));
      out.push(T([[22, top - 30], [42, top - 39], [62, top - 30]], trimC), F(T([[42, top - 39], [62, top - 30], [43, top - 30]], trim.sh)));
      for (const [cx, cy] of [[16, top - 6], [68, top - 6]]) out.push(E(cx, cy, 5, 4, trimC), F(E(cx, cy, 2.4, 2, wall.base)));
      out.push(...beam(4, top - 6, 76, 3, trimC), ...beam(24, top - 32, 36, 3, trimC));
    } else {
      // The stepped gable: three steps up each side to the hoist beam.
      out.push(T([[6, top + 6], [6, top - 4], [14, top - 4], [14, top - 14], [22, top - 14], [22, top - 24], [30, top - 24], [30, top - 34], [54, top - 34], [54, top - 24], [62, top - 24], [62, top - 14], [70, top - 14], [70, top - 4], [78, top - 4], [78, top + 6]], wall.base));
      out.push(F(T([[54, top - 34], [54, top - 24], [62, top - 24], [62, top - 14], [70, top - 14], [70, top - 4], [78, top - 4], [78, top + 6], [64, top + 6]], wall.sh)));
      for (const [x, y, w] of [[6, top - 6, 8], [14, top - 16, 8], [22, top - 26, 8], [30, top - 36, 24], [54, top - 26, 8], [62, top - 16, 8], [70, top - 6, 8]]) out.push(...beam(x - 1, y, w + 2, 3, trimC));
      out.push(R(40, top - 30, 4, 8, wood.base), R(38, top - 32, 16, 3, wood.base), R(51, top - 29, 1, 6, '#5a4a6a'));
    }
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

// The harbor warehouse, 240 wide and 176 tall, built to be climbed: pastel brick under a flat
// roof with a parapet and a hoist crane, a loading gallery across the front 80 px up (rope rails
// at the ends, a few crates stacked neatly at one end), and the roof 160 px up. Both are the map's
// own ledges (bare platforms). Big arched cargo doors at street level, a hoist door upstairs with
// its pulley and a hanging hook.
export function warehouseArt() {
  return art('warehouse', 240, 176, () => {
    const brick = ramp('#e8a9a0', 0.7);
    const wood = ramp('#8a6a5a', 0.8);
    const deck = ramp('#c9a27a', 0.8);
    const trim = '#fff4ea';
    const out = [];
    out.push(...stones(18, 22, 204, 154, brick, 31, { rowH: 6, blockW: 14 }));
    out.push(F(R(18, 22, 204, 3, brick.deep)), F(R(219, 22, 3, 154, brick.deep)));
    // The roof: a parapet with a coping, and a hoist crane arm.
    out.push(...beam(14, 14, 212, 8, trim), ...beam(12, 12, 216, 3, '#e2d8ee'));
    out.push(R(196, 0, 5, 14, wood.base), R(176, 0, 34, 4, wood.base), F(R(176, 2.6, 34, 1.4, wood.sh)), F(R(180, 4, 0.8, 10, '#5a4a6a')), F(E(180.4, 15, 2, 1.6, '#8a8aa0')));
    // Upstairs: the hoist door and two round windows.
    out.push(R(104, 32, 32, 46, wood.sh), ...planks(105, 33, 15, 45, wood, 2, 4), ...planks(120, 33, 15, 45, wood, 2, 5), ...beam(100, 30, 40, 4, trim));
    out.push(R(116, 24, 8, 4, '#8a8aa0'), F(R(119.6, 28, 0.8, 30, '#5a4a6a')), F(T([[118, 58], [122, 58], [122, 62], [119, 64]], '#8a8aa0')));
    for (const x of [56, 184]) out.push(E(x, 52, 13, 13, trim), F(E(x, 52, 10.6, 10.6, '#ffd98a')), F(E(x - 3, 49, 4.4, 4.4, '#fff6c9')), F(R(x - 0.4, 41.4, 0.8, 21.2, trim)), F(R(x - 10.6, 51.6, 21.2, 0.8, trim)));
    // The loading gallery: a deck on brackets, rope rails at its ends, a few crates.
    out.push(...planks(6, 94, 228, 8, deck, 1, 13, true), ...beam(4, 100, 232, 3, shade('#c9a27a', -22)));
    for (let x = 22; x < 220; x += 28) out.push(T([[x, 103], [x + 8, 103], [x + 2, 116]], wood.sh));
    for (const x0 of [8, 202]) {
      out.push(R(x0, 80, 3, 14, wood.base), R(x0 + 27, 80, 3, 14, wood.base));
      out.push(F(T([[x0 + 1.5, 83], [x0 + 15, 86.5], [x0 + 28.5, 83], [x0 + 28.5, 84.4], [x0 + 15, 88], [x0 + 1.5, 84.4]], '#d9b98a')));
    }
    for (const [x, y, w, h] of [[42, 80, 16, 14], [58, 84, 12, 10], [46, 70, 12, 10]]) out.push(R(x, y, w, h, '#d9a273'), F(R(x + w - 2.4, y, 2.4, h, shade('#d9a273', -18))), F(R(x, y, w, 1.2, '#f2c99a')), F(T([[x + 1, y + 1], [x + 3, y + 1], [x + w - 1, y + h - 1], [x + w - 3, y + h - 1]], shade('#d9a273', -12))));
    // Street level: two big arched cargo doors and a lantern between them.
    for (const x of [36, 144]) {
      out.push(E(x + 30, 130, 31, 16, trim), R(x - 1, 130, 62, 46, trim));
      out.push(E(x + 30, 131, 28, 14, wood.sh), R(x + 2, 131, 56, 45, wood.sh), ...planks(x + 3, 132, 26, 44, wood, 3, x), ...planks(x + 31, 132, 26, 44, wood, 3, x + 1));
      out.push(F(T([[x + 4, 140], [x + 8, 140], [x + 28, 172], [x + 24, 172]], wood.base)), F(T([[x + 32, 172], [x + 36, 172], [x + 56, 140], [x + 52, 140]], wood.base)));
    }
    out.push(R(119, 128, 2, 6, '#5a4a6a'), E(120, 138, 3.4, 4.4, '#fff3a6'), F(E(120.6, 138.6, 1.8, 2.6, '#ffe08a')));
    out.push(...beam(16, 172, 208, 4, '#c9c3d8'));
    return out;
  }, false);
}

// ---------- Pastel Harbor (the 2026-11-03 rebuild) ----------

// The harbor's landmark: a great pastel galleon moored at the docks, 420 wide and 250 tall, bow to
// the open sea (right). Its decks are the map's own ledges: the raised stern deck (up the gangway
// ladder), the long main deck, and the crow's nest high on the mainmast. The sails are furled
// (the wind has gone quiet); a pennant hangs limp at the top. A strip of water along its foot.
export const GALLEON = { w: 420, h: 250, deck: 90, stern: 130, nest: 210, mast: 240 };
export function galleonArt() {
  return art('galleon', GALLEON.w, GALLEON.h, () => {
    const W = GALLEON.w;
    const H = GALLEON.h;
    const hull = ramp('#ff9ec0', 0.8);
    const band = ramp('#fff0e4', 0.7);
    const wood = ramp('#b08a6a', 0.8);
    const water = ramp('#7f8fe0', 0.8);
    const sail = ramp('#fff8f0', 0.6);
    const deckY = H - GALLEON.deck;
    const sternY = H - GALLEON.stern;
    const out = [];
    // Masts and their furled sails behind the hull.
    for (const [mx, top] of [[GALLEON.mast, H - GALLEON.nest - 34], [330, deckY - 120], [140, sternY - 70]]) {
      out.push(R(mx - 3, top, 6, deckY - top, wood.base), F(R(mx + 1, top, 2, deckY - top, wood.sh)));
      for (const [y, w] of [[top + 30, 70], [top + 70, 84]]) {
        if (y > deckY - 20) continue;
        out.push(R(mx - w / 2, y, w, 4, wood.base), E(mx, y + 6, w / 2 - 4, 6, sail.base), F(E(mx + 6, y + 8, w / 2 - 10, 3, sail.sh)));
        for (let k = -2; k <= 2; k++) out.push(F(R(mx + k * (w / 6) - 0.5, y + 2, 1, 10, '#e8b8c8')));
      }
    }
    // Rigging lines from the mastheads down to the rails.
    for (const [a, b] of [[[GALLEON.mast, H - GALLEON.nest - 30], [70, sternY]], [[GALLEON.mast, H - GALLEON.nest - 30], [380, deckY]], [[330, deckY - 116], [410, deckY + 6]]]) {
      const n = 20;
      for (let i = 0; i < n; i++) {
        const u = i / n;
        out.push(F(R(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, 1, 1, '#8a6a5a')));
      }
    }
    // The crow's nest: a round basket on the mainmast, a limp pennant above it.
    const ny = H - GALLEON.nest;
    out.push(R(GALLEON.mast - 22, ny, 44, 14, wood.base), F(R(GALLEON.mast - 22, ny, 44, 3, wood.hi)), F(R(GALLEON.mast + 14, ny, 8, 14, wood.sh)));
    out.push(T([[GALLEON.mast + 3, ny - 34], [GALLEON.mast + 22, ny - 30], [GALLEON.mast + 3, ny - 26]], '#ff6b9a'));
    // The hull: a long curved body, the stern castle raised at the back, the bow sweeping up.
    const hullPts = [[18, sternY], [130, sternY], [134, deckY], [376, deckY], [408, deckY - 18], [414, deckY - 10], [392, H - 34], [360, H - 22], [70, H - 22], [34, H - 40]];
    out.push(T(hullPts, hull.base), F(T([[300, deckY], [376, deckY], [408, deckY - 18], [414, deckY - 10], [392, H - 34], [360, H - 22], [310, H - 22]], hull.sh)));
    out.push(F(T([[30, H - 52], [400, H - 52], [394, H - 40], [36, H - 40]], band.base)), F(R(30, H - 46, 366, 1.4, band.sh)));
    out.push(...planks(18, sternY - 6, 118, 8, ramp('#e2b98a', 0.8), 1, 3, true), ...planks(130, deckY - 6, 250, 8, ramp('#e2b98a', 0.8), 1, 9, true));
    // Rails along the decks.
    for (let x = 22; x < 130; x += 8) out.push(R(x, sternY - 18, 1.8, 12, '#ffffff'));
    out.push(...beam(18, sternY - 20, 116, 2.6, '#ffffff'));
    for (let x = 140; x < 372; x += 8) out.push(R(x, deckY - 16, 1.8, 10, '#ffffff'));
    out.push(...beam(134, deckY - 18, 244, 2.6, '#ffffff'));
    // The stern castle's windows (lit gold) and the portholes along the hull.
    for (let k = 0; k < 3; k++) out.push(R(40 + k * 26, sternY + 14, 16, 14, '#8a5a5a'), F(R(42 + k * 26, sternY + 16, 12, 10, '#ffd98a')), F(R(42 + k * 26, sternY + 16, 6, 5, '#fff6c9')));
    for (let x = 160; x < 380; x += 34) out.push(E(x, deckY + 22, 6, 6, band.base), F(E(x, deckY + 22, 4.4, 4.4, '#ffd98a')), F(E(x - 1.4, deckY + 20.6, 1.6, 1.6, '#fff6c9')));
    // The figurehead: a little gold star on the bow, and the anchor hanging at the cathead.
    out.push(...[[414, deckY - 14]].flatMap(([x, y]) => [E(x, y, 6, 6, '#ffd36b'), F(E(x - 1.6, y - 1.6, 2, 2, '#fff6c8'))]));
    out.push(R(385, deckY + 6, 2, 26, '#5a4a6a'), T([[378, deckY + 30], [394, deckY + 30], [386, deckY + 40]], '#6a6a80'));
    // Life rings on the rail, and the gangway ladder down from the stern deck (drawn on the map).
    out.push(E(110, sternY - 8, 6, 6, '#ffffff'), F(E(110, sternY - 8, 3, 3, hull.base)));
    // The water at its foot, with a few glints.
    out.push(R(0, H - 22, W, 22, water.base), F(R(0, H - 22, W, 2, water.hi)));
    for (let k = 0; k < 9; k++) out.push(F(R(14 + k * 46, H - 14 + (k % 2) * 5, 18, 1.2, water.hi)));
    return out;
  }, false);
}

// A fish market stall: a counter of crushed ice with fish laid out, a striped awning on two
// posts, a chalkboard of the day's catch.
export function fishStallArt() {
  return art('fishstall', 96, 92, () => {
    const wood = ramp('#b08a6a', 0.8);
    const out = [];
    for (const x of [8, 84]) out.push(R(x, 22, 4, 70, wood.base), F(R(x + 2.6, 22, 1.4, 70, wood.sh)));
    for (let k = 0; k < 8; k++) out.push(T([[4 + k * 11, 14], [15 + k * 11, 14], [15 + k * 11, 24], [9.5 + k * 11, 28], [4 + k * 11, 24]], k % 2 ? '#ffffff' : '#6aa8d8'));
    out.push(F(R(4, 14, 88, 2, '#4f88c0')));
    out.push(R(6, 58, 84, 34, wood.base), ...planks(6, 60, 84, 32, wood, 6, 3), R(4, 54, 88, 6, '#e8f6ff'), F(R(4, 54, 88, 1.6, '#ffffff')));
    for (const [x, c] of [[16, '#a8c0e8'], [34, '#ffb0a0'], [52, '#c0d0e8'], [70, '#ffd0a0']]) out.push(E(x, 53, 8, 3, c), T([[x + 7, 53], [x + 11, 50], [x + 11, 56]], c), F(E(x - 4, 52.4, 1, 1, '#2a2a3a')));
    out.push(R(30, 30, 36, 18, '#4a5a4a'), F(R(31, 31, 34, 16, '#3a4a3a')), F(R(34, 35, 20, 1, '#f0f0e0')), F(R(34, 39, 26, 1, '#f0f0e0')), F(R(34, 43, 14, 1, '#f0f0e0')));
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

// A wide sandstone arcade house, 160 wide and 120 tall: one storey behind a shaded arcade of three
// round arches with a striped awning, and a roof garden 90 px up behind a low parapet (planters,
// a trellis of vines, a lantern). Its roof is a ledge on the map, reached by the ladder at its side.
export function adobeArcadeArt(seed) {
  const wallC = pick(ADOBE, seed * 3 + 1);
  const cloth = pick(['#5fb8d8', '#ff8a5c', '#ffd66b'], seed * 5);
  return art(`adobearcade|${wallC}|${cloth}`, 160, 120, () => {
    const wall = ramp(wallC, 0.7);
    const wood = ramp('#8a5a3c', 0.8);
    const top = 30;
    const out = [];
    // The roof garden: a trellis of vines, planters and a lantern on a post.
    out.push(R(104, 2, 3, 28, wood.base), R(150, 2, 3, 28, wood.base), R(100, 2, 56, 3, wood.base), F(R(100, 4, 56, 1, wood.sh)));
    for (let k = 0; k < 6; k++) out.push(...foliage(106 + k * 9, 6 + (k % 2) * 2, 5, 4, ramp('#8fd08a'), seed + k, { flat: true }), F(E(106 + k * 9, 9, 1.3, 1.3, k % 2 ? '#ff9ec0' : '#ffe36b')));
    for (const x of [18, 44, 70]) out.push(R(x - 6, top - 9, 12, 9, '#d98a6a'), F(R(x + 3, top - 9, 3, 9, '#b8705a')), E(x, top - 13, 6, 5, '#7fc98a'), F(E(x - 2, top - 15, 1.6, 1.6, x === 44 ? '#ffe36b' : '#ff9ec0')));
    out.push(R(88, top - 22, 2, 22, '#7a5238'), E(89, top - 24, 3.4, 4, '#fff3a6'), F(E(89.6, top - 23.4, 1.8, 2.4, '#ffe08a')));
    // The walls and the parapet.
    out.push(T([[4, 120], [4, top + 4], [8, top], [152, top], [156, top + 4], [156, 120]], wall.base), F(R(4, top, 152, 3, wall.hi)), F(R(150, top + 4, 6, 116 - top, mix(wall.base, wall.sh, 0.6))));
    for (let x = 12; x < 150; x += 16) out.push(R(x, top + 7, 6, 4, wood.base), F(R(x, top + 9.6, 6, 1.4, wood.sh)));
    // The awning over the arcade.
    for (let k = 0; k < 12; k++) out.push(T([[8 + k * 12, top + 16], [20 + k * 12, top + 16], [21 + k * 12, top + 26], [9 + k * 12, top + 26]], k % 2 ? '#ffffff' : cloth));
    for (let k = 0; k < 12; k++) out.push(F(E(14.5 + k * 12, top + 26, 6, 2.6, k % 2 ? '#ffffff' : cloth)));
    out.push(F(R(8, top + 16, 144, 1.4, shade(cloth, -20))));
    // Three round arches into the shaded arcade, a lit doorway and pots inside.
    for (const x of [16, 62, 108]) {
      out.push(E(x + 18, top + 52, 19, 16, wall.sh), R(x - 1, top + 52, 38, 38, wall.sh));
      out.push(E(x + 18, top + 53, 16, 14, '#8a5a5a'), R(x + 2, top + 53, 32, 37, '#8a5a5a'));
      out.push(F(E(x + 18, top + 53, 16, 14, mix('#8a5a5a', '#5a3f4c', 0.4))));
    }
    out.push(R(72, top + 56, 16, 34, '#5a3f4c'), F(R(74, top + 66, 12, 24, '#ffd98a')), F(R(74, top + 66, 6, 12, '#fff6c9')));
    out.push(E(36, top + 86, 7, 4, '#c97f4f'), E(36, top + 80, 5, 6, '#9fd88a'), E(126, top + 86, 7, 4, '#c97f4f'), E(126, top + 79, 4, 7, '#7fc98a'));
    for (const x of [14, 60, 106, 152]) out.push(R(x - 1, top + 50, 4, 40, wall.base), F(R(x + 2, top + 50, 1, 40, wall.sh)));
    out.push(...beam(2, 116, 156, 4, '#c97f4f'));
    return out;
  }, false);
}

// ---------- Moonleaf Grove (the 2026-11-03 rebuild) ----------

// The grove's landmark: the Starchime Tower, 200 wide and 300 tall, a slender mage tower of violet
// stone. A wooden balcony rings it halfway up (up the ladder at its west side) and its open top deck
// (up a second ladder) holds a great moon crystal under an iron crown of crystal wind chimes, which
// hang silent: there is no wind left to ring them. Both are ledges on the map. The chimes, the
// crystal's glow and the odd sparkle are drawn live (render/town.js).
export const TOWER = { w: 200, h: 300, balcony: 130, deck: 230, crystal: [100, 40], crown: [100, 6, 56] };
// Where the chimes hang from the crown (x relative to the tower's left edge, and their length).
export const TOWER_CHIMES = [[52, 22], [66, 30], [82, 36], [118, 36], [134, 30], [148, 22]];
export function starchimeTowerArt() {
  return art('starchime', TOWER.w, TOWER.h, () => {
    const H = TOWER.h;
    const stone = ramp('#a89cd0', 0.75);
    const trim = ramp('#e8e0f8', 0.6);
    const wood = ramp('#8a6a9a', 0.8);
    const cloth = ramp('#6a7ad0', 0.8);
    const balY = H - TOWER.balcony;
    const deckY = H - TOWER.deck;
    const out = [];
    // The shaft: violet stone courses, shaded on its right, trimmed in pale bands.
    out.push(...stones(62, deckY, 76, H - deckY, stone, 11, { rowH: 9, blockW: 14 }));
    out.push(F(R(122, deckY, 16, H - deckY, stone.sh)));
    for (const y of [deckY + 4, balY + 14, H - 40]) out.push(R(58, y, 84, 5, trim.base), F(R(58, y, 84, 1.4, trim.hi)), F(R(126, y, 16, 5, trim.sh)));
    // The plinth and its round door, lit from inside, with a moon over the lintel.
    out.push(...stones(48, H - 36, 104, 36, stone, 4, { rowH: 9, blockW: 18 }), F(R(48, H - 36, 104, 2, stone.hi)));
    out.push(E(100, H - 30, 16, 14, trim.base), R(84, H - 30, 32, 30, trim.base));
    out.push(E(100, H - 28, 13, 12, wood.deep), R(87, H - 28, 26, 28, wood.deep));
    out.push(F(E(100, H - 26, 10, 9, '#ffd98a')), F(R(90, H - 26, 20, 26, '#ffd98a')), F(R(99.2, H - 34, 1.6, 34, wood.deep)), F(E(106, H - 12, 1.6, 1.6, wood.deep)));
    out.push(E(100, H - 48, 6, 6, '#fff3c4'), F(E(103, H - 49.5, 5, 5.4, stone.base)));
    // Tall arched windows up the shaft, glowing gold, a star pane in the top one.
    for (const [y, h] of [[balY + 30, 34], [deckY + 20, 40]]) {
      out.push(E(100, y, 10, 9, trim.base), R(90, y, 20, h, trim.base));
      out.push(F(E(100, y + 1, 7.6, 7.4, '#ffd98a')), F(R(92.4, y + 1, 15.2, h - 3, '#ffd98a')), F(R(92.4, y + 1, 6, h - 3, '#fff1c4')), F(R(99.4, y - 6, 1.2, h + 2, trim.sh)));
    }
    out.push(F(T([[100, deckY + 26], [103, deckY + 33], [110, deckY + 34], [104, deckY + 38], [106, deckY + 45], [100, deckY + 41], [94, deckY + 45], [96, deckY + 38], [90, deckY + 34], [97, deckY + 33]], '#fff8e0')));
    // Little lit slits on the shaft's side, climbing.
    for (const [x, y] of [[72, H - 70], [72, balY - 30], [72, deckY + 60]]) out.push(R(x, y, 6, 12, trim.base), F(R(x + 1.2, y + 1.2, 3.6, 9.6, '#ffd98a')));
    // The balcony: a ring of planks round the shaft on carved brackets, a rail of posts.
    out.push(...planks(18, balY - 2, 164, 7, ramp('#b89ac8', 0.8), 1, 12, true));
    for (const x of [28, 58, 142, 172]) out.push(T([[x - 4, balY + 5], [x + 4, balY + 5], [x + 1, balY + 24], [x - 1, balY + 24]], wood.base), F(R(x + 1.6, balY + 5, 1.4, 18, wood.sh)));
    for (let x = 22; x <= 178; x += 10) if (x < 62 || x > 138) out.push(R(x, balY - 16, 2, 14, trim.base));
    out.push(...beam(18, balY - 18, 44, 2.6, trim.base), ...beam(138, balY - 18, 44, 2.6, trim.base));
    // The mages' banner hung from the balcony: deep blue, a gold crescent, a tasseled hem.
    out.push(R(150, balY + 8, 24, 46, cloth.base), T([[150, balY + 54], [162, balY + 46], [174, balY + 54]], cloth.base), F(R(150, balY + 8, 24, 3, '#ffd36b')));
    out.push(E(162, balY + 26, 7, 7, '#ffd36b'), F(E(165, balY + 24, 6, 6.4, cloth.base)), F(R(161.4, balY + 54, 1.2, 6, '#ffd36b')));
    // The top deck: a round stone parapet, a pale cornice.
    out.push(...stones(40, deckY - 12, 120, 16, stone, 6, { rowH: 8, blockW: 12 }), R(36, deckY + 2, 128, 6, trim.base), F(R(36, deckY + 2, 128, 1.6, trim.hi)), F(R(140, deckY + 2, 24, 6, trim.sh)));
    for (let x = 40; x < 160; x += 20) out.push(R(x, deckY - 18, 10, 6, stone.base), F(R(x, deckY - 18, 10, 1.6, stone.hi)));
    // The crown: an iron arch on two pillars over the deck, a little star at its peak.
    const [cx, cy, cr] = TOWER.crown;
    for (const x of [cx - cr, cx + cr - 4]) out.push(R(x, cy + 14, 4, deckY - 18 - cy - 14, '#4a4a6a'), F(R(x, cy + 14, 1.2, deckY - 18 - cy - 14, '#8a8aaa')));
    for (let i = 0; i <= 28; i++) {
      const a = Math.PI * (i / 28);
      out.push(R(cx - Math.cos(a) * cr - 1.6, cy + 16 - Math.sin(a) * 14, 3.2, 3.2, '#4a4a6a'));
    }
    out.push(T([[cx, cy - 6], [cx + 3, cy], [cx + 9, cy + 1], [cx + 4, cy + 4], [cx + 5, cy + 10], [cx, cy + 6], [cx - 5, cy + 10], [cx - 4, cy + 4], [cx - 9, cy + 1], [cx - 3, cy]], '#ffd36b'), F(E(cx - 1.6, cy + 2, 1.6, 1.6, '#fff6c8')));
    // The moon crystal's pedestal (the crystal itself glows live).
    const [kx, ky] = TOWER.crystal;
    out.push(R(kx - 12, deckY - 22, 24, 6, trim.base), R(kx - 7, ky + 20, 14, deckY - 22 - ky - 20, stone.base), F(R(kx + 2, ky + 20, 5, deckY - 22 - ky - 20, stone.sh)));
    return out;
  }, false);
}
// One crystal chime (drawn live, hanging from the crown and barely swaying).
export function chimeArt(len) {
  return art(`chime|${len}`, 8, len + 4, () => [
    R(3.6, 0, 0.8, len - 12, '#4a4a6a'),
    T([[4, len - 13], [7, len - 8], [4, len + 2], [1, len - 8]], '#bfe6ff'),
    F(T([[4, len - 13], [7, len - 8], [4, len + 2]], '#8fc0f0')),
    F(R(2.6, len - 9, 1, 4, '#ffffff')),
  ], false);
}
// The moon crystal on the tower's deck: a tall pale-blue gem.
export function moonCrystalArt() {
  return art('mooncrystal', 24, 40, () => [
    T([[12, 0], [22, 14], [16, 40], [8, 40], [2, 14]], '#cfe8ff'),
    F(T([[12, 0], [22, 14], [16, 40], [12, 40]], '#9fc8f0')),
    F(T([[12, 0], [2, 14], [8, 40], [9, 40], [6, 14]], '#ffffff')),
    F(R(11.4, 6, 1.2, 30, '#e8f4ff')),
  ], false);
}

// ---------- Ember Crag (the 2026-11-03 rebuild) ----------

// The crag's landmark: the Great Forge, 260 wide and 240 tall, a stone forge hall with a glowing
// furnace mouth, a giant leather bellows hanging slack at its side (no wind left to work it), and a
// tall brick chimney. Its flat roof terrace (up the ladder at its west end) and the lookout on top
// of the chimney are ledges on the map. The furnace glow and the thin smoke are drawn live.
export const FORGE = { w: 260, h: 240, roof: 120, chimney: [186, 232], top: 234, mouth: [118, 84] };
export function greatForgeArt() {
  return art('greatforge', FORGE.w, FORGE.h, () => {
    const W = FORGE.w;
    const H = FORGE.h;
    const stone = ramp('#c9a888', 0.7);
    const brick = ramp('#c8705a', 0.8);
    const wood = ramp('#8a5a3c', 0.8);
    const leather = ramp('#a8664a', 0.8);
    const roofY = H - FORGE.roof;
    const out = [];
    // The chimney: tall brick, banded with iron, a lookout rim at its top.
    const [c0, c1] = FORGE.chimney;
    out.push(...stones(c0, 6, c1 - c0, roofY - 6, brick, 3, { rowH: 6, blockW: 9 }));
    for (const y of [40, 80]) out.push(R(c0 - 2, y, c1 - c0 + 4, 4, '#5a4a5a'), F(R(c0 - 2, y, c1 - c0 + 4, 1, '#8a7a8a')));
    out.push(R(c0 - 6, 2, c1 - c0 + 12, 6, '#5a4a5a'), F(R(c0 - 6, 2, c1 - c0 + 12, 1.4, '#8a7a8a')));
    for (let x = c0 - 4; x < c1 + 6; x += 6) out.push(R(x, -6, 1.6, 8, '#6a5a6a'));
    out.push(R(c0 - 6, -8, c1 - c0 + 12, 2, '#6a5a6a'));
    // The hall: thick stone walls, a stepped parapet on the roof terrace.
    out.push(...stones(10, roofY, W - 20, H - roofY, stone, 7, { rowH: 10, blockW: 18 }));
    out.push(F(R(W - 22, roofY, 12, H - roofY, stone.sh)));
    out.push(R(6, roofY - 4, W - 12, 8, stone.hi), F(R(6, roofY + 2, W - 12, 2, stone.sh)));
    for (let x = 8; x < W - 14; x += 22) out.push(R(x, roofY - 14, 12, 10, stone.base), F(R(x, roofY - 14, 12, 2, stone.hi)));
    // The furnace mouth: a great arch of brick, the fire glowing low inside (and live, over it).
    const [mx, mw] = FORGE.mouth;
    const my = H - 70;
    out.push(E(mx, my, mw / 2 + 8, 30, brick.base), R(mx - mw / 2 - 8, my, mw + 16, 70, brick.base));
    for (let k = -3; k <= 3; k++) out.push(F(R(mx + k * 14 - 5, my - 30 + Math.abs(k) * 3, 10, 6, brick.hi)));
    out.push(E(mx, my + 4, mw / 2 - 2, 24, '#3a1a1a'), R(mx - mw / 2 + 2, my + 4, mw - 4, 66, '#3a1a1a'));
    out.push(F(E(mx, H - 14, mw / 2 - 6, 12, '#c84a2a')), F(E(mx, H - 12, mw / 2 - 14, 8, '#ff8a3a')), F(E(mx, H - 10, mw / 2 - 24, 4, '#ffd36b')));
    out.push(R(mx - mw / 2 - 12, H - 6, mw + 24, 6, '#5a4a5a'));
    // The anvil before it, and racks of blades on the wall.
    out.push(T([[mx + 56, H - 20], [mx + 86, H - 20], [mx + 92, H - 28], [mx + 50, H - 28]], '#6a6a80'), R(mx + 62, H - 20, 18, 14, '#5a5a70'), R(mx + 58, H - 6, 26, 6, '#4a4a60'), F(R(mx + 52, H - 28, 38, 1.6, '#9a9ab0')));
    for (let k = 0; k < 4; k++) out.push(R(30 + k * 12, roofY + 24, 3, 40, '#b8c0d8'), F(R(30 + k * 12, roofY + 24, 1, 40, '#e8eef8')), R(27 + k * 12, roofY + 60, 9, 3, wood.base));
    out.push(...beam(22, roofY + 20, 56, 4, '#8a5a3c'));
    // The giant bellows at the side, hanging slack and wrinkled: a wedge of leather on wood boards.
    out.push(T([[W - 12, H - 80], [W - 12, H - 30], [W + 0, H - 40], [W + 0, H - 70]], wood.base));
    out.push(T([[W - 68, H - 92], [W - 12, H - 76], [W - 12, H - 34], [W - 68, H - 22]], leather.base));
    for (let k = 1; k < 5; k++) out.push(F(T([[W - 68 + k * 11, H - 90 + k * 3], [W - 64 + k * 11, H - 89 + k * 3], [W - 64 + k * 11, H - 25 - k * 2], [W - 68 + k * 11, H - 24 - k * 2]], leather.sh)));
    out.push(R(W - 74, H - 96, 8, 78, wood.base), F(R(W - 72, H - 96, 2, 78, wood.hi)), R(W - 106, H - 62, 34, 5, wood.base));
    // The warriors' banner hanging from the parapet.
    out.push(R(150, roofY + 6, 26, 40, '#d0504a'), T([[150, roofY + 46], [163, roofY + 38], [176, roofY + 46]], '#d0504a'), F(R(150, roofY + 6, 26, 3, '#ffd36b')));
    out.push(T([[156, roofY + 18], [163, roofY + 30], [170, roofY + 18]], '#ffd36b'), F(R(162, roofY + 14, 2, 18, '#ffe8a0')));
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
// A giant glowcap mushroom home for the grove, 124 wide and 140 tall: a thick pale stem with a
// round door, two porthole windows and a little balcony, under a wide domed cap with glowing spots,
// a crooked chimney poking through and lanterns hung from its rim.
export function mushHomeArt(seed) {
  const capC = pick(['#9f8ae0', '#7fb8e8', '#c48ae0'], seed);
  return art(`mushhome|${capC}`, 124, 140, () => {
    const stem = ramp('#f2e8ff', 0.6);
    const cap = ramp(capC, 0.8);
    const wood = ramp('#a88a78', 0.8);
    const out = [];
    // The stem, flaring at the foot.
    out.push(T([[30, 140], [36, 112], [38, 70], [86, 70], [88, 112], [94, 140]], stem.base), F(T([[72, 70], [86, 70], [88, 112], [94, 140], [76, 140]], stem.sh)));
    out.push(F(T([[36, 112], [38, 74], [44, 74], [42, 112]], stem.hi)));
    // The chimney behind the cap.
    out.push(R(84, 6, 9, 20, '#b8a8c8'), F(R(90, 6, 3, 20, '#9a8ab0')), R(82, 4, 13, 4, '#9a8ab0'));
    // The cap: a wide dome with a lit crown, glowing spots and a frilled rim.
    const dome = [[2, 70], [8, 46], [24, 24], [46, 12], [62, 10], [78, 12], [100, 24], [116, 46], [122, 70]];
    out.push(T(dome, cap.base), F(T([[62, 10], [78, 12], [100, 24], [116, 46], [122, 70], [70, 70]], cap.sh)));
    out.push(F(T([[10, 50], [24, 28], [44, 16], [56, 14], [40, 26], [24, 44], [18, 58]], cap.hi)));
    for (const [x, y, r] of [[30, 44, 6], [56, 26, 5], [80, 36, 7], [100, 56, 5], [48, 56, 4], [16, 62, 3]]) out.push(F(E(x, y, r, r * 0.8, '#e8fff8')), F(E(x - r * 0.25, y - r * 0.25, r * 0.4, r * 0.3, '#ffffff')));
    for (let k = 0; k < 12; k++) out.push(F(E(6 + k * 10, 70, 6, 3, k % 2 ? cap.sh : cap.deep)));
    // Lanterns from the rim.
    for (const x of [14, 110]) out.push(F(R(x - 0.4, 72, 0.8, 8, '#5a4a6a')), E(x, 84, 4, 5, '#fff3a6'), F(E(x + 0.6, 84.6, 2.2, 3, '#ffe08a')), F(R(x - 4, 79, 8, 1.4, '#9f8ae0')));
    // Porthole windows, the little balcony, and the round door.
    for (const [x, y] of [[50, 88], [74, 90]]) out.push(E(x, y, 7, 7, wood.base), F(E(x, y, 5.4, 5.4, '#ffd98a')), F(E(x - 1.6, y - 1.6, 2.2, 2.2, '#fff6c9')), F(R(x - 0.3, y - 5.4, 0.6, 10.8, wood.base)));
    out.push(...beam(40, 100, 44, 3, '#a88a78'));
    for (let k = 0; k < 9; k++) out.push(R(42 + k * 5, 92, 1.4, 8, '#e2d4f0'));
    out.push(...beam(40, 91, 44, 2, '#e2d4f0'));
    out.push(E(62, 118, 11, 10, wood.sh), R(51, 118, 22, 22, wood.sh), ...planks(52, 119, 20, 21, wood, 3, seed * 7), E(62, 119, 10, 9, wood.base), F(E(68, 130, 1.2, 1.2, '#ffe36b')));
    out.push(...beam(46, 137, 32, 3, '#c9c3d8'));
    out.push(...foliage(26, 136, 9, 6, ramp('#8fd0b8'), seed * 3, { tips: 2 }), ...foliage(100, 137, 8, 5, ramp('#8fd0b8'), seed * 5, { tips: 2 }));
    return out;
  }, false);
}

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

// The town stove: a round-shouldered brick oven with an arched firebox, a fat copper pot on top
// with ring handles and a tea-towel over one, a ladle hanging on its hook, and a stack of split
// logs at its foot. 56 wide, 58 tall. The fire, the pot's lid and the steam are drawn live
// (render/town.js); the lid is stoveLidArt.
export function stoveArt() {
  return art('stove2', 56, 58, () => {
    const brick = ramp('#eaa58a', 0.85);
    const mortar = ramp('#f6dccb', 0.6);
    const pot = ramp('#eb9a6a', 0.9);
    const out = [];
    // The oven: brick courses with a rounded top and a hearth stone along the bottom.
    out.push(T([[7, 57], [7, 33], [9, 30], [13, 28.6], [43, 28.6], [47, 30], [49, 33], [49, 57]], mortar.sh));
    out.push(...stones(8, 30, 40, 26, brick, 4, { rowH: 5.2, blockW: 8.4 }));
    out.push(F(T([[8, 30.6], [10, 29.4], [46, 29.4], [48, 30.6], [48, 31.6], [8, 31.6]], brick.hi)));
    out.push(R(5, 55, 46, 3, mortar.base), F(R(5, 55, 46, 0.8, mortar.hi)), F(R(5, 57.2, 46, 0.8, mortar.sh)));
    // The arched firebox: a keystone arch of lighter brick round a deep mouth.
    out.push(T([[18, 55], [18, 45], [20, 40.6], [24, 38.2], [28, 37.6], [32, 38.2], [36, 40.6], [38, 45], [38, 55]], brick.hi));
    out.push(F(T([[20.4, 55], [20.4, 46], [22, 42.4], [25, 40.4], [28, 40], [31, 40.4], [34, 42.4], [35.6, 46], [35.6, 55]], '#4a2f48')));
    out.push(F(T([[22, 55], [22, 49], [28, 47], [34, 49], [34, 55]], '#7a3f4a')));
    out.push(F(R(26.8, 37.2, 2.4, 2.6, mortar.base)));
    // The pot: a wide belly, a rolled rim, ring handles, the warm glow of copper.
    out.push(E(28, 19.6, 15.6, 9.4, pot.base));
    out.push(F(E(31.4, 21.4, 11.6, 7.2, pot.sh)), F(E(24, 16.6, 7.6, 4.2, mix(pot.base, pot.hi, 0.5))), F(E(21.4, 15.4, 2.6, 1.4, '#fff1dc')));
    out.push(F(R(13.6, 26.2, 28.8, 2.4, pot.deep)));
    out.push(E(28, 11, 14.6, 2.6, pot.sh), F(E(28, 10.4, 13.6, 1.8, pot.hi)));
    for (const sx of [11.4, 44.6]) out.push(E(sx, 17, 2.4, 2.4, pot.sh), F(E(sx, 17, 1.2, 1.2, mix(pot.base, '#fff6ea', 0.2))));
    // A tea towel in pink gingham hung over the far handle.
    out.push(T([[43, 16.4], [47.6, 16], [48.4, 25], [45.6, 26.4], [43.8, 24]], '#ffc8d8'), F(R(44.2, 18.6, 3.6, 0.9, '#ffffff')), F(R(44.6, 21.6, 3.4, 0.9, '#ffffff')), F(R(45.4, 17, 0.9, 8.4, '#ffe4ec')));
    // The ladle on its hook on the oven's side.
    out.push(R(4.6, 31, 1.4, 1.4, '#9a8fb0'), R(4.6, 32, 1, 12, '#c4815e'), E(5.1, 45.6, 2.6, 2, pot.base), F(E(5.6, 46.4, 1.6, 1.2, pot.sh)));
    // Split logs stacked by the hearth, their cut ends showing rings.
    const log = ramp('#b48464');
    for (const [x, y] of [[52, 52], [52.4, 56], [48.6, 56]]) out.push(E(x, y, 3.6, 2.2, log.sh), F(E(x - 1.2, y, 1.6, 1.8, '#f0d4a8')), F(E(x - 1.2, y, 0.7, 0.8, '#c4955e')));
    return out;
  }, false);
}
// The pot's lid, drawn live so it can rattle on the boil (render/town.js).
export function stoveLidArt() {
  return art('stovelid', 30, 8, () => {
    const lid = ramp('#d98c62', 0.9);
    return [E(15, 6, 13, 2.4, lid.base), F(E(16.6, 6.6, 9, 1.4, lid.sh)), F(E(12, 5.2, 6, 0.9, lid.hi)), E(15, 2.8, 2.6, 1.8, '#c4815e'), F(E(14.4, 2.2, 1.2, 0.7, '#f0c8a8'))];
  }, false);
}
// One drawing of the fire in the firebox (k = 0, 1, 2), crossfaded live into the next.
export function stoveFlameArt(k) {
  return art(`stoveflame|${k}`, 16, 14, () => {
    const lean = [-0.8, 0.4, 1][k];
    const tall = [1, 0.86, 0.94][k];
    const flame = (cx, h, w, c) => T([[cx - w, 13], [cx - w * 0.9, 13 - h * 0.45], [cx - w * 0.3 + lean * 0.5, 13 - h * 0.8], [cx + lean, 13 - h], [cx + w * 0.5 + lean * 0.4, 13 - h * 0.6], [cx + w, 13]], c);
    return [flame(8, 12 * tall, 6, '#ff8a5c'), flame(7.6, 9 * tall, 4.4, '#ffb35a'), flame(8.2, 6 * tall, 2.6, '#ffe9a6'), E(8, 13, 6, 1, '#ffd27a')];
  }, false);
}
