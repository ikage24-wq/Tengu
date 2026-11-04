// The Sweethearts' rooms inside their houses (render/sweethouses.js draws the outsides): six rooms,
// each decorated as its owner would, full of their own things. Indoors is indoors (the art bible's
// interior rules): walls with their mouldings, panelling and skirting, a ceiling line, the room's own
// floor painted all the way down (you walk on it, y 344), light from lamps, candles and windows,
// soft shadows where things meet the floor, and the outdoors only through a window or the door.
//
//   ROOM[id]()           the room's picture (640 x ROOM_H), drawn with its bottom at ROOM_H
//   roomLife(ctx, id, ox, oy, time)   its moving parts: flames, lamps, steam, a cat asleep, a clock,
//                        a lantern swaying, fairy lights, paper cranes, the hammock...
//
// What's where (x, the wall is y 0-300, the floor from 300; the owner stands in front at
// goinghome.js ROOM_SPOT, the door out at maps.js ROOM_DOOR):
//   poppy    oven 40-190, recipe frame 214, counter and window 240-376, cake table 390-560, door 608
//   lark     bookshelf 20-160, desk 220-420 under the round sea window, door 450, bookshelf 480-620
//   rowan    armour 56-110, weapon rack 130, fireplace 240-400, his chair 440-540, door 605
//   yuzu     door 60, umbrella 130, shrine 270-370, low table 230-410, moon window 480, scroll 600
//   celeste  nightstand 30, bed 52-248, telescope 320, door 420, bookshelf 470-610
//   marlowe  barrels 40, bottle shelf 86-230, wheel 320, hammock 380-470, chest 470-550, door 605

import { R, E, T, F, mix } from './pixel.js';
import { ramp, planks, stones, hash, foliage } from './propkit.js';
import { art } from './scenery.js';

const TAU = Math.PI * 2;
const WHITE = '#ffffff';
const GOLD = '#ffd36b';
export const ROOM_H = 480;

const star = (cx, cy, r, c) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return T(pts, c);
};
const heart = (cx, cy, s, c) => [E(cx - s * 0.5, cy, s * 0.55, s * 0.55, c), E(cx + s * 0.5, cy, s * 0.55, s * 0.55, c), T([[cx - s * 1.02, cy + s * 0.15], [cx + s * 1.02, cy + s * 0.15], [cx, cy + s * 1.2]], c)];

// ---------- Pieces every room uses ----------

// The ceiling line: a moulding along the top of the wall, lit on top, shaded under.
const cornice = (c, y = 40, h = 12) => {
  const r = ramp(c, 0.8);
  return [R(0, y, 640, h, r.base), F(R(0, y, 640, 1.6, r.hi)), F(R(0, y + h - 3, 640, 3, r.sh)), F(R(0, y + h, 640, 3, mix(r.sh, r.base, 0.5)))];
};
// Panelling up to a rail, and the skirting board where the wall meets the floor.
const wainscot = (c, top, rail) => {
  const r = ramp(c, 0.7);
  const out = [R(0, top, 640, 300 - top, r.base), R(0, top - 4, 640, 5, rail), F(R(0, top - 4, 640, 1.2, mix(rail, WHITE, 0.4)))];
  for (let x = 8; x < 640; x += 46) out.push(F(R(x, top + 8, 36, 300 - top - 22, mix(r.base, r.hi, 0.35))), F(R(x, top + 8, 36, 1, r.sh)), F(R(x + 35, top + 8, 1, 300 - top - 22, r.sh)));
  return out;
};
const skirting = (c) => {
  const r = ramp(c, 0.8);
  return [R(0, 290, 640, 11, r.base), F(R(0, 290, 640, 1.4, r.hi)), F(R(0, 298, 640, 3, r.sh))];
};
// Where the floor meets the wall it sits in shade, lighter toward you.
const floorShade = (c) => [F(R(0, 301, 640, 6, mix(c, '#3a2a4a', 0.28))), F(R(0, 307, 640, 5, mix(c, '#3a2a4a', 0.12)))];
// The soft shadow under a piece of furniture where it stands on the floor.
const contact = (x, w, floorC) => F(E(x, 301, w / 2, 4, mix(floorC, '#3a2a4a', 0.35)));

// A framed picture: the frame (lit top edge), its mount, and what's painted in it.
function frame(x, y, w, h, fc, bg, inner = []) {
  const r = ramp(fc, 0.8);
  return [R(x - 4, y - 4, w + 8, h + 8, r.base), F(R(x - 4, y - 4, w + 8, 1.4, r.hi)), F(R(x - 4, y + h + 2, w + 8, 2, r.sh)), R(x, y, w, h, bg), ...inner];
}
// A plant in a pot, its leaves in clusters.
function plant(x, y, pot, leaf, s = 1, seed = 0) {
  const pr = ramp(pot, 0.8);
  return [...foliage(x, y - 22 * s, 13 * s, 12 * s, ramp(leaf, 0.9), seed), T([[x - 9 * s, y - 14 * s], [x + 9 * s, y - 14 * s], [x + 7 * s, y], [x - 7 * s, y]], pr.base), R(x - 10 * s, y - 16 * s, 20 * s, 4 * s, pr.hi), F(T([[x + 3 * s, y - 13 * s], [x + 9 * s, y - 13 * s], [x + 7 * s, y], [x + 2 * s, y]], pr.sh))];
}
// A wall shelf on two brackets.
function shelf(x, y, w, c) {
  const r = ramp(c, 0.8);
  return [R(x, y, w, 5, r.base), F(R(x, y, w, 1.2, r.hi)), F(R(x, y + 4, w, 1.4, r.sh)), T([[x + 8, y + 5], [x + 13, y + 5], [x + 13, y + 15]], r.sh), T([[x + w - 13, y + 5], [x + w - 8, y + 5], [x + w - 13, y + 15]], r.sh)];
}
// A row of books standing on a shelf at `y` (their feet), different heights, one leaning, a few
// lying flat.
function books(x, y, w, colours, seed = 0) {
  const out = [];
  let bx = x;
  let i = 0;
  while (bx < x + w - 6) {
    const v = hash(seed + i * 2.7);
    const c = colours[Math.floor(v * colours.length) % colours.length];
    if (v > 0.86 && bx < x + w - 24) {
      // A little stack lying flat.
      for (let k = 0; k < 3; k++) out.push(R(bx, y - 4 - k * 4, 20 - k * 2, 4, colours[(i + k) % colours.length]), F(R(bx, y - 4 - k * 4, 20 - k * 2, 1, mix(colours[(i + k) % colours.length], WHITE, 0.4))));
      bx += 22;
    } else {
      const bw = 6 + Math.floor(v * 5);
      const bh = 22 + Math.floor(hash(seed + i * 5.1) * 12);
      out.push(R(bx, y - bh, bw, bh, c), F(R(bx, y - bh, 1.2, bh, mix(c, WHITE, 0.35))), F(R(bx, y - bh + 4, bw, 1.4, mix(c, GOLD, 0.6))), F(R(bx, y - 7, bw, 1.4, mix(c, GOLD, 0.6))));
      bx += bw + 1;
    }
    i++;
  }
  return out;
}
// A candle (its flame is drawn alive: FLAMES).
const candle = (x, y, c = '#fff8e8', h = 12) => [R(x - 2.5, y - h, 5, h, c), F(R(x - 2.5, y - h, 1.4, h, WHITE)), E(x, y, 5, 2, mix(c, GOLD, 0.6)), F(R(x - 0.4, y - h - 3, 0.8, 3, '#5a4a4a'))];
// A rug on the floor where you walk, round and soft, with its border.
const rug = (cx, c, trim) => [E(cx, 340, 124, 16, mix(c, '#5a4a6a', 0.25)), E(cx, 339, 120, 14, c), E(cx, 339, 100, 10, trim), E(cx, 339, 92, 8, c)];

// A room's door out, in the house's own style, with its mat.
function door(x, w, h, c, trim, kind) {
  const top = 300 - h;
  const l = x - w / 2;
  const dark = mix(c, '#3a2a3a', 0.4);
  const out = [R(l - 5, top + w / 2 - 2, w + 10, h - w / 2 + 2, dark), E(x, top + w / 2, w / 2 + 5, w / 2 + 5, dark)];
  out.push(R(l, top + w / 2, w, h - w / 2, c), E(x, top + w / 2, w / 2, w / 2, c), F(R(l, top + w / 2, 4, h - w / 2, mix(c, WHITE, 0.3))), F(R(l + w - 3, top + w / 2, 3, h - w / 2, mix(c, '#3a2a3a', 0.2))));
  if (kind === 'heart') out.push(...heart(x, top + 28, 9, trim));
  if (kind === 'porthole') out.push(E(x, top + 30, 11, 11, trim), E(x, top + 30, 8, 8, '#9fd8ff'), F(E(x - 3, top + 27, 3, 3, WHITE)));
  if (kind === 'bands') for (const y of [top + 50, top + 100]) out.push(R(l, y, w, 6, trim), E(l + 8, y + 3, 2, 2, '#9a9aaa'), E(l + w - 8, y + 3, 2, 2, '#9a9aaa'));
  if (kind === 'shoji') for (let i = 1; i < 4; i++) for (let j = 0; j < 5; j++) out.push(R(l + 4 + (i - 1) * ((w - 8) / 3) + 1, top + w / 2 + 6 + j * ((h - w / 2 - 12) / 5), (w - 8) / 3 - 2, (h - w / 2 - 12) / 5 - 2, trim));
  if (kind === 'moon') out.push(E(x, top + 32, 12, 12, trim), E(x + 5, top + 29, 10, 10, c));
  out.push(E(x + w / 2 - 8, top + h * 0.6, 3, 3, GOLD), F(E(x + w / 2 - 9, top + h * 0.6 - 1, 1, 1, WHITE)), R(l - 8, 298, w + 16, 6, mix(c, '#fff8f0', 0.5)), F(R(l - 8, 298, w + 16, 1.4, mix(c, WHITE, 0.7))));
  return out;
}
// Curtains either side of a window, tied back, with a frill along the top.
function curtains(x, y, w, h, c) {
  const r = ramp(c, 0.7);
  const out = [];
  for (const [side, cx] of [[-1, x - 6], [1, x + w + 6]]) {
    out.push(T([[cx - side * 2, y - 6], [cx + side * 14, y - 6], [cx + side * 6, y + h * 0.55], [cx + side * 12, y + h + 8], [cx - side * 4, y + h + 8], [cx - side * 2, y + h * 0.55]], r.base));
    out.push(F(T([[cx + side * 6, y - 6], [cx + side * 10, y - 6], [cx + side * 4, y + h * 0.5], [cx + side * 1, y + h * 0.5]], r.sh)), R(cx - 4, y + h * 0.52, 12, 4, GOLD));
  }
  out.push(R(x - 12, y - 12, w + 24, 8, r.base), F(R(x - 12, y - 12, w + 24, 1.4, r.hi)));
  for (let i = 0; i < (w + 24) / 10; i++) out.push(E(x - 7 + i * 10, y - 4, 5, 3.4, r.base));
  return out;
}

// ---------- The rooms ----------

export const ROOM = {
  // Poppy's kitchen: candy-striped wallpaper over cream beadboard, the big brick oven with its logs,
  // her recipe card framed, a counter of mixing things under a curtained window, the cake table, a
  // pie-faced clock over the door, pendant lamps, and the cat asleep in the bread basket.
  poppy: () => art('swr-poppy', 640, ROOM_H, () => {
    const FLOOR = '#ff9ec0';
    const out = [R(0, 0, 640, 300, '#ffe8ee')];
    for (let x = 0; x < 640; x += 32) out.push(F(R(x, 0, 16, 300, '#fff4f6')), F(R(x + 7, 0, 2, 300, '#ffd6e2')));
    out.push(...wainscot('#fff6ee', 214, '#ff9ec0'));
    // Tiny hearts stencilled along the rail.
    for (let x = 20; x < 640; x += 40) out.push(...heart(x, 202, 3, '#ffb3cf'));
    out.push(...cornice('#fff6ee'));
    // Icing drips along the cornice, like the roof outside.
    for (let x = 6; x < 640; x += 18) out.push(E(x, 54, 6, 4 + hash(x) * 3, WHITE), E(x + 2, 58 + hash(x) * 4, 2.4, 3, WHITE));
    for (let x = 0; x < 640; x += 40) for (let y = 300; y < ROOM_H; y += 20) out.push(R(x + ((y / 20) % 2) * 20, y, 20, 20, FLOOR), R(x + (1 - (y / 20) % 2) * 20, y, 20, 20, '#fff6ee'));
    out.push(...floorShade('#ffd2e0'), ...skirting('#ff9ec0'));
    // The brick oven: its chimney breast up to the ceiling, the glowing mouth with an iron rim,
    // the mantle of crocks and a rolling pin, logs stacked in the niche beneath.
    const brick = ramp('#d98a6a', 0.8);
    out.push(contact(115, 170, FLOOR), ...stones(40, 52, 150, 248, brick, 11, { rowH: 7, blockW: 14 }));
    out.push(R(30, 132, 170, 10, '#b8705a'), F(R(30, 132, 170, 2, '#e0a080')), F(R(30, 140, 170, 2, '#8a4a3a')));
    out.push(E(115, 196, 44, 38, '#5a4a4a'), E(115, 198, 40, 34, '#3a2420'), E(115, 206, 34, 22, '#ff8a3a'), F(E(115, 210, 26, 14, '#ffd36b')), F(E(108, 206, 8, 4, '#fff3b0')));
    out.push(R(64, 232, 102, 6, '#5a4a4a'), R(66, 252, 98, 44, '#3a2420'), F(R(66, 252, 98, 2, '#2a1810')));
    for (let i = 0; i < 6; i++) out.push(E(78 + (i % 3) * 36, 288 - Math.floor(i / 3) * 14, 16, 7, '#b8865a'), F(E(78 + (i % 3) * 36 - 12, 288 - Math.floor(i / 3) * 14, 5, 6, '#e8c08a')), F(E(78 + (i % 3) * 36 - 12, 288 - Math.floor(i / 3) * 14, 2.4, 3, '#c89a6a')));
    out.push(R(50, 112, 22, 20, '#fff6ee'), F(R(50, 112, 22, 4, '#ff9ec0')), E(61, 110, 9, 3, '#ffd2e0'), R(84, 116, 18, 16, '#c8e8ff'), E(93, 114, 8, 3, '#e8f6ff'), R(112, 126, 50, 5, '#e0b080'), E(112, 128, 3, 3, '#c89a6a'), E(162, 128, 3, 3, '#c89a6a'), R(170, 114, 14, 18, '#ffe08a'), F(R(172, 118, 3, 10, WHITE)));
    // Her recipe card, framed, between the oven and the counter.
    out.push(...frame(202, 150, 28, 36, '#ff9ec0', '#fffaf0', [F(R(206, 156, 20, 1.2, '#e0a0b0')), F(R(206, 162, 16, 1, '#d0c0c0')), F(R(206, 167, 18, 1, '#d0c0c0')), F(R(206, 172, 14, 1, '#d0c0c0')), ...heart(222, 177, 3, '#ff6b8a')]));
    // Shelves of jars (jam, sugar, sprinkles), a string of cookie cutters.
    for (const sy of [96, 150]) {
      out.push(...shelf(240, sy, 160, '#c89a6a'));
      for (let i = 0; i < 6; i++) {
        const c = ['#ffe08a', '#ff9ec0', '#9fe0a0', '#fff4ea', '#e0a060', '#c8c8ff'][(i + sy) % 6];
        out.push(R(248 + i * 25, sy - 22, 16, 22, c), R(247 + i * 25, sy - 25, 18, 4, '#fff6ee'), F(R(247 + i * 25, sy - 25, 18, 1.2, WHITE)), F(R(250 + i * 25, sy - 18, 3, 14, WHITE)), F(R(251 + i * 25, sy - 12, 10, 6, mix(c, WHITE, 0.5))));
      }
    }
    // The counter under the window: drawers with heart knobs, a mixing bowl and whisk, a stack of
    // plates, a tray of cupcakes.
    out.push(contact(306, 150, FLOOR), R(236, 256, 140, 44, '#fff2e6'), R(232, 252, 148, 6, '#e8c8b0'), F(R(232, 252, 148, 1.4, WHITE)));
    for (let i = 0; i < 3; i++) out.push(R(242 + i * 45, 262, 40, 32, '#ffe2ea'), F(R(242 + i * 45, 262, 40, 1.2, WHITE)), F(R(242 + i * 45, 292, 40, 2, '#f0c0d0')), ...heart(262 + i * 45, 274, 2.4, '#ff6b8a'));
    // The window over the counter, curtained, a flower box on its sill.
    out.push(R(258, 176, 94, 66, WHITE), R(262, 180, 86, 58, '#bfe8ff'), F(R(262, 222, 86, 16, '#d8f2ff')), F(E(290, 196, 14, 6, WHITE)), F(R(304, 180, 2, 58, WHITE)), F(R(262, 208, 86, 2, WHITE)), F(R(264, 182, 22, 14, '#e8f8ff')));
    out.push(...curtains(258, 176, 94, 66, '#ff9ec0'));
    out.push(R(254, 236, 102, 10, '#ff9ec0'), F(R(254, 236, 102, 2, '#ffc2d6')), ...[0, 1, 2, 3, 4, 5, 6].map((i) => E(262 + i * 14, 234, 5, 5, ['#ff6b8a', '#ffe36b', WHITE][i % 3])), ...[0, 1, 2, 3, 4, 5].map((i) => F(E(269 + i * 14, 236, 3, 2, '#7ac87a'))));
    out.push(E(270, 248, 16, 6, '#c8e8ff'), E(270, 244, 14, 6, '#fff6ee'), F(E(266, 243, 5, 2, WHITE)), R(278, 232, 2, 14, '#c8c8d8'), E(279, 231, 4, 5, '#d8d8e8'));
    for (let i = 0; i < 4; i++) out.push(E(306, 250 - i * 3, 13, 2.4, i % 2 ? '#fff6ee' : '#ffe2ea'));
    out.push(R(326, 246, 44, 4, '#e0b080'));
    for (let i = 0; i < 4; i++) out.push(R(328 + i * 10, 238, 8, 8, '#e0a060'), E(332 + i * 10, 237, 5, 4, ['#ffc2d4', WHITE, '#c8e8ff', '#ffe08a'][i]), E(332 + i * 10, 233, 1.4, 1.4, '#ff6b8a'));
    // Copper pans on their rail.
    out.push(R(440, 66, 140, 3, '#8a6a4a'));
    for (let i = 0; i < 4; i++) out.push(R(450 + i * 36, 69, 2, 12, '#8a6a4a'), E(451 + i * 36, 92, 14 - i, 12 - i, '#d9905a'), F(E(447 + i * 36, 88, 6, 4, '#ffc890')), F(E(455 + i * 36, 96, 6 - i * 0.6, 4, '#b06a3a')), R(449 + i * 36, 103 - i, 4, 14, '#8a6a4a'));
    // The cake table: a cloth with scalloped edges, the tiered cake, a fresh loaf, a pie, a jug of
    // flowers; the bread basket beneath (the cat sleeps in it).
    out.push(contact(475, 180, FLOOR), R(390, 250, 170, 8, '#c89a6a'), R(400, 258, 8, 42, '#a8805a'), R(542, 258, 8, 42, '#a8805a'));
    out.push(R(386, 246, 178, 8, WHITE));
    for (let i = 0; i < 18; i++) out.push(E(390 + i * 10, 255, 5, 4, i % 2 ? WHITE : '#ffe2ea'));
    out.push(R(404, 222, 36, 24, '#fff4ea'), F(R(404, 222, 36, 3, '#ffc2d4')), R(410, 202, 24, 20, '#ffc2d4'), F(R(410, 202, 24, 3, WHITE)), R(415, 190, 14, 12, '#fff4ea'), E(422, 188, 3, 3, '#ff3a5a'), F(E(421, 187, 1, 1, WHITE)), R(400, 244, 44, 3, '#e8d8e8'));
    out.push(E(470, 240, 18, 8, '#e0a060'), F(E(466, 236, 10, 3, '#ffc890')), F(R(460, 238, 2, 4, '#b8703a')), F(R(468, 236, 2, 5, '#b8703a')), F(R(476, 238, 2, 4, '#b8703a')));
    out.push(E(508, 242, 16, 5, '#e0a060'), E(508, 239, 14, 4, '#c8384a'), F(E(504, 238, 4, 1.4, '#ff6b8a')));
    out.push(R(532, 222, 14, 22, '#c8e8ff'), F(R(534, 224, 3, 16, WHITE)), ...foliage(539, 212, 11, 9, ramp('#7ac87a', 0.9), 4), E(533, 208, 3, 3, '#ff6b8a'), E(544, 210, 3, 3, '#ffe36b'), E(538, 204, 3, 3, WHITE));
    out.push(E(470, 290, 34, 12, '#d8a060'), F(E(470, 286, 30, 7, '#a8703a')), F(E(470, 284, 26, 4, '#f6dca8')));
    // The pie-faced clock over the door.
    out.push(E(608, 150, 18, 18, '#e0a060'), E(608, 150, 14, 14, '#fff6ee'), F(E(604, 146, 4, 3, WHITE)));
    for (let i = 0; i < 12; i++) out.push(F(E(608 + Math.cos((i / 12) * TAU) * 11, 150 + Math.sin((i / 12) * TAU) * 11, 1, 1, '#c8705a')));
    for (let i = 0; i < 8; i++) out.push(F(E(608 + Math.cos((i / 8) * TAU) * 16.5, 150 + Math.sin((i / 8) * TAU) * 16.5, 2.4, 2, '#f6c890')));
    // A flour sack and a basket of strawberries by the oven, a stool, a plant by the door.
    out.push(contact(212, 36, FLOOR), E(212, 282, 18, 16, '#f6ecd8'), R(200, 266, 24, 6, '#e8dcc0'), F(E(206, 278, 6, 6, WHITE)), ...heart(214, 284, 3, '#ff8fae'));
    out.push(...plant(572, 300, '#ff9ec0', '#7ac87a', 0.9, 2));
    out.push(...rug(320, '#ff9ec0', '#fff3f6'), ...door(608, 48, 104, '#e5485f', WHITE, 'heart'));
    return out;
  }, false),

  // Lark's study: pale blue boards over white panelling and a rope rail, two bookshelves packed with
  // books and sea finds, her desk under the round sea window, poems pinned on a line, a hanging fern,
  // a ship's barometer, an oil lamp, a tea gone cold, crumpled drafts and a waste basket.
  lark: () => art('swr-lark', 640, ROOM_H, () => {
    const FLOOR = '#a8c0d0';
    const out = [R(0, 0, 640, 300, '#e8f2fa')];
    for (let x = 0; x < 640; x += 22) out.push(F(R(x, 0, 1.2, 300, '#c8dceb')), F(R(x + 1.2, 0, 1, 300, '#f6fbff')));
    out.push(...wainscot('#f8fbff', 232, '#5f8fd8'));
    // The rope rail along the panelling.
    for (let x = 0; x < 640; x += 6) out.push(F(E(x + 3, 228, 3.4, 2.2, x % 12 ? '#e8d4a8' : '#c8b088')));
    out.push(...cornice('#5f8fd8', 40, 10));
    out.push(...planks(0, 300, 640, ROOM_H - 300, ramp(FLOOR, 0.8), 16, 3), ...floorShade(FLOOR), ...skirting('#5f8fd8'));
    // The bookshelves, books and sea finds: a shell, a jar of sea glass, a little lighthouse, a ship.
    const finds = [
      (x, y) => [E(x + 10, y - 6, 10, 6, '#ffd2c0'), F(E(x + 8, y - 8, 4, 2, WHITE)), F(R(x + 10, y - 12, 1, 10, '#e8a890'))],
      (x, y) => [R(x + 2, y - 20, 16, 20, '#d8f2ff'), R(x + 4, y - 24, 12, 4, '#a8805a'), ...[0, 1, 2, 3, 4].map((k) => F(E(x + 6 + (k % 3) * 4, y - 4 - Math.floor(k / 3) * 5, 2.4, 2, ['#8fe0c8', '#8fc8ff', '#ffb3cf'][k % 3])))],
      (x, y) => [R(x + 6, y - 26, 8, 26, WHITE), F(R(x + 6, y - 18, 8, 4, '#e5485f')), F(R(x + 6, y - 8, 8, 4, '#e5485f')), T([[x + 4, y - 26], [x + 16, y - 26], [x + 10, y - 34]], '#e5485f'), F(R(x + 8, y - 30, 4, 3, '#fff3a6'))],
      (x, y) => [T([[x, y - 6], [x + 22, y - 6], [x + 18, y], [x + 4, y]], '#a8704a'), R(x + 10, y - 26, 1.4, 20, '#8a5a3a'), T([[x + 11.4, y - 26], [x + 20, y - 10], [x + 11.4, y - 10]], WHITE), T([[x + 10, y - 22], [x + 3, y - 10], [x + 10, y - 10]], '#f6e8c8')],
    ];
    for (const [bx, seed] of [[20, 1], [480, 7]]) {
      out.push(contact(bx + 70, 150, FLOOR), R(bx, 60, 140, 240, '#a8805a'), F(R(bx, 60, 140, 2, '#c8a070')), R(bx + 6, 66, 128, 230, '#6a4a38'), R(bx - 4, 56, 148, 8, '#a8805a'), F(R(bx - 4, 56, 148, 1.6, '#d8b088')));
      for (let row = 0; row < 5; row++) {
        const sy = 108 + row * 46;
        out.push(R(bx + 6, sy, 128, 5, '#a8805a'), F(R(bx + 6, sy, 128, 1.2, '#c8a070')));
        const gap = Math.floor(hash(seed + row) * 4);
        out.push(...books(bx + 9, sy, gap === 3 ? 122 : 92, ['#5a7ab8', '#ff9ec0', '#9fe0a0', '#ffe08a', '#c8a8ff', '#ff8a6a', '#8fd8d8'], seed * 10 + row));
        if (gap !== 3) out.push(...finds[(row + seed) % finds.length](bx + 104, sy));
      }
      out.push(R(bx + 4, 296, 132, 4, '#8a6a4a'));
    }
    // The round sea window, its sill, and the barometer beside it.
    out.push(E(320, 120, 62, 62, '#f8fbff'), E(320, 120, 56, 56, '#c8dceb'), E(320, 120, 52, 52, '#9fd8ff'), F(E(320, 140, 52, 20, '#5fb8d8')), F(E(320, 150, 52, 10, '#4fa0c8')), F(E(300, 98, 16, 7, '#e8f6ff')), F(R(318, 68, 4, 104, '#f8fbff')), F(R(268, 118, 104, 4, '#f8fbff')));
    out.push(R(268, 176, 104, 6, '#f8fbff'), F(R(268, 180, 104, 2, '#c8dceb')), ...plant(282, 176, '#5f8fd8', '#7ac8a0', 0.6, 3), R(352, 164, 8, 12, '#c8e8ff'), F(R(353, 166, 2, 8, WHITE)), T([[356, 164], [366, 148], [362, 164]], '#7ac8a0'));
    out.push(E(206, 96, 14, 14, '#c8902a'), E(206, 96, 11, 11, '#fff8e8'), F(R(205.4, 88, 1.2, 8, '#2a3a6a')), F(E(206, 96, 2, 2, '#c8902a')), R(203, 110, 6, 24, '#a8805a'), E(206, 138, 6, 6, '#c8902a'), E(206, 138, 4, 4, '#fff8e8'));
    // Poems pinned on a line across the wall.
    out.push(F(T([[170, 200], [470, 200], [470, 201.2], [170, 201.2]], '#a89888')));
    for (let i = 0; i < 9; i++) {
      const px = 182 + i * 32 + (i > 3 ? 14 : 0);
      if (px > 440) break;
      if (px > 262 && px < 376) continue;
      out.push(R(px - 7, 202, 14, 18, '#fffaf0'), F(R(px - 1, 198, 2, 6, '#c89a6a')));
      for (let k = 0; k < 4; k++) out.push(F(R(px - 5, 206 + k * 3, 8 + (k % 2) * 2, 0.9, '#8a9ab8')));
    }
    // The writing desk with drawers, a chair, the oil lamp, an inkpot and quill, stacked books,
    // drafts and a cup of tea.
    out.push(contact(320, 210, FLOOR), R(220, 236, 200, 10, '#c89a6a'), F(R(220, 236, 200, 2, '#e0b888')), R(230, 246, 10, 54, '#a8805a'), R(400, 246, 10, 54, '#a8805a'), R(350, 246, 50, 26, '#b88a5a'), F(R(352, 248, 46, 10, '#c89a6a')), F(R(352, 260, 46, 10, '#c89a6a')), E(375, 253, 2, 2, GOLD), E(375, 265, 2, 2, GOLD));
    out.push(R(296, 192, 6, 108, '#8a6a4a'), R(338, 192, 6, 108, '#8a6a4a'), R(296, 192, 48, 8, '#a8805a'), R(296, 208, 48, 4, '#a8805a'), E(320, 252, 24, 6, '#5fb8d8'));
    for (let i = 0; i < 5; i++) out.push(R(244 + i * 9, 226 - i * 2, 38, 10, i % 2 ? '#fffaf0' : '#f4f0e6'), F(R(246 + i * 9, 229 - i * 2, 26, 0.8, '#a8b0c8')));
    out.push(R(350, 222, 12, 14, '#2a3a6a'), F(R(352, 224, 3, 8, '#5a6a9a')), T([[356, 222], [372, 190], [375, 191], [359, 222]], WHITE), F(T([[366, 202], [372, 190], [374, 191], [368, 203]], '#c8dceb')));
    out.push(R(396, 196, 4, 40, '#c8902a'), E(398, 236, 8, 3, '#c8902a'), E(398, 186, 9, 12, '#fff3c0'), F(E(395, 182, 3, 5, WHITE)), R(391, 196, 14, 3, '#c8902a'));
    out.push(R(380, 228, 16, 8, '#ff9ec0'), R(382, 222, 14, 6, '#9fe0a0'), R(379, 216, 18, 6, '#ffe08a'), E(268, 232, 7, 4, WHITE), E(268, 229, 6, 2, '#c89a6a'));
    // Drafts on the floor, the waste basket overflowing, a stack of books by the shelf.
    for (const [x, y] of [[214, 296], [252, 298], [432, 296], [196, 300], [470, 298]]) out.push(E(x, y, 6, 5, '#fffaf0'), F(E(x - 1, y - 1, 2, 2, '#e8e0d0')), F(R(x - 3, y, 5, 0.8, '#c8c8d8')));
    out.push(contact(200, 30, FLOOR), T([[188, 274], [212, 274], [208, 300], [192, 300]], '#c8a070'), F(R(190, 280, 20, 1, '#a8805a')), F(R(191, 288, 18, 1, '#a8805a')), E(196, 272, 6, 5, '#fffaf0'), E(205, 270, 6, 5, '#fffaf0'));
    out.push(R(165, 288, 24, 6, '#5a7ab8'), R(167, 282, 20, 6, '#ff9ec0'), R(164, 276, 22, 6, '#9fe0a0'));
    // The hanging fern over the door.
    out.push(F(T([[438, 52], [450, 92], [451, 92], [440, 52]], '#a89888')), F(T([[462, 52], [450, 92], [449, 92], [460, 52]], '#a89888')), T([[440, 92], [460, 92], [456, 106], [444, 106]], '#5f8fd8'), ...foliage(450, 104, 16, 10, ramp('#7ac8a0', 0.9), 9));
    for (let k = 0; k < 5; k++) out.push(T([[436 + k * 7, 106], [439 + k * 7, 106], [434 + k * 8 + (k - 2) * 3, 128 + (k % 2) * 6]], '#5aa87a'));
    out.push(...rug(320, '#5fb8d8', '#e8f6ff'), ...door(450, 44, 100, '#5f8fd8', WHITE, 'porthole'));
    return out;
  }, false),

  // Rowan's hall: timber-framed plaster over a stone base, a great fireplace with a mantle of
  // candles, his trophy and a jar of daisies, crossed swords over the shield on its chimney breast,
  // iron sconces, his armour on its stand, a rack of practice swords, the giant chair with a knitted
  // blanket and a basket of yarn, logs, fire irons, daisies everywhere.
  rowan: () => art('swr-rowan', 640, ROOM_H, () => {
    const FLOOR = '#b8865a';
    const out = [R(0, 0, 640, 300, '#f6ecdc')];
    // The timber frame: posts and a rail, braces in the panels.
    const tw = '#8a5a3a';
    for (const x of [0, 120, 420, 560]) out.push(R(x, 52, 12, 140, tw), F(R(x, 52, 3, 140, '#a8704a')));
    out.push(R(0, 120, 640, 8, tw), F(R(0, 120, 640, 2, '#a8704a')));
    for (const [x0, x1] of [[12, 120], [432, 560]]) out.push(T([[x0, 128], [x0 + 8, 128], [x1, 186], [x1 - 8, 186]], tw), T([[x1, 128], [x1 - 8, 128], [x0, 186], [x0 + 8, 186]], tw));
    out.push(...cornice('#8a5a3a', 40, 12));
    out.push(...stones(0, 186, 640, 114, ramp('#d8d0c8', 0.7), 41, { rowH: 9, blockW: 18 }), R(0, 182, 640, 6, tw), F(R(0, 182, 640, 1.6, '#a8704a')));
    out.push(...planks(0, 300, 640, ROOM_H - 300, ramp(FLOOR, 0.8), 14, 7), ...floorShade(FLOOR), ...skirting('#8a5a3a'));
    // The chimney breast, up to the ceiling, and the great fireplace.
    out.push(contact(320, 190, FLOOR), ...stones(236, 52, 168, 248, ramp('#c8c0b8', 0.75), 5, { rowH: 10, blockW: 20 }));
    out.push(R(262, 186, 116, 114, '#5a4a4a'), R(270, 192, 100, 108, '#3a2420'), T([[262, 186], [378, 186], [370, 196], [270, 196]], '#9a9090'), E(320, 286, 44, 12, '#ff8a3a'), F(E(320, 290, 34, 7, '#ffd36b')));
    for (let i = 0; i < 3; i++) out.push(E(300 + i * 20, 294 - (i % 2) * 4, 16, 5, '#8a5a3a'), F(E(286 + i * 20, 294 - (i % 2) * 4, 3, 4, '#c89a6a')));
    out.push(R(319, 192, 2, 40, '#5a5a6a'), E(320, 242, 14, 11, '#3a3a4a'), F(E(316, 238, 5, 3, '#5a5a6a')), R(312, 230, 16, 3, '#3a3a4a'));
    out.push(R(226, 174, 188, 12, '#a8805a'), F(R(226, 174, 188, 2, '#d8b088')), F(R(226, 184, 188, 2, '#7a5a3a')));
    // On the mantle: candles, his little trophy, a jar of daisies, a carved horse.
    out.push(...candle(244, 174), ...candle(256, 174, '#fff8e8', 16), ...candle(396, 174, '#fff8e8', 14));
    out.push(R(300, 160, 16, 14, '#ffd36b'), E(308, 158, 10, 5, '#ffd36b'), F(E(304, 157, 3, 2, WHITE)), R(305, 150, 6, 8, '#ffd36b'), E(296, 158, 3, 5, '#e0b040'), E(320, 158, 3, 5, '#e0b040'), R(302, 172, 12, 2, '#a8805a'));
    out.push(R(340, 158, 14, 16, '#c8e8ff'), F(R(342, 160, 3, 12, WHITE)));
    for (let i = 0; i < 5; i++) out.push(E(338 + i * 4, 152 - (i % 2) * 4, 3, 3, WHITE), F(E(338 + i * 4, 152 - (i % 2) * 4, 1.2, 1.2, GOLD)));
    out.push(T([[364, 174], [384, 174], [382, 164], [378, 156], [372, 152], [368, 160]], '#c89a6a'), F(E(380, 156, 2, 2, '#8a5a3a')));
    // The shield and crossed swords on the chimney breast.
    for (const s of [-1, 1]) out.push(T([[320 - s * 46, 120], [320 - s * 42, 116], [320 + s * 40, 62], [320 + s * 36, 58]], '#dfe6f2'), F(T([[320 - s * 46, 120], [320 - s * 44, 118], [320 + s * 38, 60], [320 + s * 36, 58]], WHITE)), R(320 - s * 40 - 5, 110, 10, 4, '#a8805a'), E(320 - s * 47, 124, 3, 3, GOLD));
    out.push(T([[296, 66], [344, 66], [344, 100], [320, 124], [296, 100]], '#5f8fd8'), F(T([[296, 66], [320, 66], [320, 124], [296, 100]], '#8fb8e8')), R(296, 64, 48, 4, GOLD), star(320, 92, 10, GOLD), F(star(318, 90, 4, '#fff3b0')));
    // Iron sconces on the posts, banners with his star.
    for (const x of [126, 426]) out.push(R(x - 2, 150, 4, 16, '#3a3a4a'), R(x - 7, 148, 14, 4, '#3a3a4a'), ...candle(x, 148, '#fff8e8', 10));
    for (const x of [190, 470]) out.push(R(x - 20, 128, 40, 4, '#8a5a3a'), E(x - 20, 130, 3, 3, GOLD), E(x + 20, 130, 3, 3, GOLD), T([[x - 16, 132], [x + 16, 132], [x + 16, 172], [x, 182], [x - 16, 172]], '#5f8fd8'), F(T([[x - 16, 132], [x - 8, 132], [x - 8, 178], [x - 16, 172]], '#8fb8e8')), star(x, 154, 6, GOLD), F(R(x - 16, 132, 32, 3, '#4a6ab8')));
    // The shields along the walls.
    for (const [x, c] of [[60, '#ff8a8a'], [500, '#9fe0a0']]) out.push(T([[x - 18, 64], [x + 18, 64], [x + 18, 92], [x, 110], [x - 18, 92]], c), F(T([[x - 18, 64], [x, 64], [x, 110], [x - 18, 92]], mix(c, WHITE, 0.3))), R(x - 18, 62, 36, 4, GOLD), ...heart(x, 82, 5, WHITE));
    // His armour on its stand: a plumed helmet with its visor, pauldrons, the breastplate with his
    // star, a skirt of plates, greaves on the stand's foot; a daisy tucked in the plume.
    const steel = ramp('#c8d2e4', 0.8);
    out.push(contact(83, 50, FLOOR), R(81, 120, 4, 172, '#8a6a4a'), R(62, 292, 42, 8, '#8a6a4a'), F(R(62, 292, 42, 2, '#a8805a')));
    out.push(T([[64, 160], [102, 160], [98, 214], [83, 222], [68, 214]], steel.base), F(T([[83, 160], [102, 160], [98, 214], [83, 222]], steel.sh)), F(T([[68, 164], [76, 164], [74, 208], [70, 206]], steel.hi)), star(83, 184, 7, GOLD), F(R(66, 160, 34, 3, steel.hi)));
    for (const sx of [-1, 1]) out.push(E(83 + sx * 24, 166, 13, 9, steel.base), F(E(83 + sx * 24, 168, 12, 5, sx > 0 ? steel.sh : steel.hi)), E(83 + sx * 24, 175, 11, 4, steel.base));
    for (let k = 0; k < 3; k++) out.push(T([[68 + k, 220 + k * 9], [98 - k, 220 + k * 9], [100 - k, 230 + k * 9], [66 + k, 230 + k * 9]], k % 2 ? steel.sh : steel.base), F(R(68 + k, 220 + k * 9, 30 - k * 2, 1.4, steel.hi)));
    out.push(T([[70, 272], [80, 272], [80, 292], [68, 292]], steel.base), T([[86, 272], [96, 272], [98, 292], [86, 292]], steel.sh));
    out.push(E(83, 140, 15, 17, steel.base), F(E(77, 134, 6, 7, steel.hi)), F(T([[83, 124], [98, 140], [92, 156], [83, 157]], steel.sh)), R(70, 138, 26, 4, '#3a3a4a'), F(R(83, 142, 1.4, 12, '#3a3a4a')), F(R(78, 146, 2, 4, '#3a3a4a')), F(R(86, 146, 2, 4, '#3a3a4a')));
    out.push(T([[83, 124], [80, 110], [88, 100], [100, 96], [96, 110], [88, 124]], '#5fb8d8'), F(T([[83, 124], [86, 106], [100, 96], [92, 114]], '#8fd8f0')), E(100, 98, 3.4, 3.4, WHITE), F(E(100, 98, 1.4, 1.4, GOLD)));
    // The rack of practice swords.
    out.push(contact(150, 50, FLOOR), R(130, 216, 44, 6, '#a8805a'), R(130, 270, 44, 6, '#a8805a'), R(132, 216, 4, 84, '#8a6a4a'), R(168, 216, 4, 84, '#8a6a4a'));
    for (let i = 0; i < 3; i++) out.push(R(140 + i * 11, 200, 4, 84, '#c89a6a'), R(136 + i * 11, 228, 12, 3, '#8a5a3a'), F(R(140 + i * 11, 200, 1.2, 84, '#e0b888')));
    // His giant chair, its knitted blanket and cushion, the yarn basket with needles, a footstool.
    out.push(contact(490, 116, FLOOR), R(440, 210, 100, 14, '#a8805a'), R(440, 120, 14, 100, '#a8805a'), R(526, 120, 14, 100, '#a8805a'), R(440, 120, 100, 12, '#a8805a'), F(R(440, 120, 100, 2, '#d8b088')), R(446, 224, 10, 76, '#8a6a4a'), R(524, 224, 10, 76, '#8a6a4a'), E(490, 204, 44, 9, '#8fb8e8'), F(E(484, 200, 24, 4, '#b8d8ff')));
    out.push(T([[452, 126], [528, 126], [532, 176], [512, 182], [490, 176], [468, 182], [448, 176]], '#ffd2e0'), F(T([[490, 126], [528, 126], [532, 176], [512, 182], [490, 176]], '#ffc2d4')));
    for (let k = 0; k < 3; k++) out.push(F(R(452, 138 + k * 14, 78, 3, k % 2 ? '#ffb3cf' : WHITE)));
    for (let k = 0; k < 14; k++) out.push(F(R(450 + k * 6, 178 + (k % 2) * 3, 1.4, 6, '#ff9ec0')));
    // His cushion, a little lumpy.
    out.push(E(490, 200, 36, 8, '#8fd8a0'), F(E(484, 197, 18, 3, '#b8f0c8')));
    out.push(contact(570, 34, FLOOR), E(568, 288, 16, 12, '#c8a070'), F(E(568, 282, 13, 5, '#a8805a')), E(562, 280, 6, 6, '#ff9ec0'), E(574, 279, 6, 6, '#8fb8e8'), T([[560, 280], [552, 262], [553, 262], [562, 279]], '#c89a6a'), T([[576, 279], [586, 264], [587, 265], [578, 280]], '#c89a6a'));
    // Fire irons and the log basket by the hearth, daisies in pots and an upturned helmet.
    out.push(R(214, 236, 4, 64, '#3a3a4a'), R(208, 296, 16, 4, '#3a3a4a'), T([[206, 236], [222, 236], [216, 228], [212, 228]], '#3a3a4a'), R(218, 244, 2, 50, '#5a5a6a'));
    out.push(contact(420, 40, FLOOR), R(404, 276, 36, 24, '#a8805a'), F(R(404, 282, 36, 2, '#8a5a3a')));
    for (let i = 0; i < 3; i++) out.push(E(412 + i * 10, 272, 6, 6, '#8a5a3a'), F(E(412 + i * 10, 272, 3, 3, '#c89a6a')));
    for (const [x, y, helm] of [[188, 286, false], [30, 286, true], [598, 300, false]]) {
      if (helm) out.push(E(x, y + 6, 12, 8, '#dfe6f2'), F(E(x - 4, y + 4, 4, 3, WHITE)));
      else out.push(T([[x - 8, y], [x + 8, y], [x + 6, y + 14], [x - 6, y + 14]], '#d98a6a'), R(x - 9, y - 2, 18, 4, '#e0a080'));
      for (let i = 0; i < 5; i++) out.push(R(x - 7 + i * 3.5, y - 10 - (i % 2) * 4, 0.8, 10, '#5aa87a'), E(x - 7 + i * 3.5, y - 10 - (i % 2) * 4, 2.8, 2.8, WHITE), F(E(x - 7 + i * 3.5, y - 10 - (i % 2) * 4, 1.1, 1.1, GOLD)));
    }
    out.push(...rug(320, '#8fb8e8', '#f2f6ff'), ...door(605, 56, 140, '#a8805a', '#5a5a6a', 'bands'));
    return out;
  }, false),

  // Yuzu's room: shoji walls between dark posts under a beam, a wooden wainscot, tatami with its
  // borders, her shrine shelf with the fox, candles and an offering, fox masks, a scroll and a vase
  // of branches, a round moon window onto bamboo, a red paper umbrella, the low table set for tea
  // with a plate of fried tofu, cushions, and the pile of "borrowed" teacups.
  yuzu: () => art('swr-yuzu', 640, ROOM_H, () => {
    const FLOOR = '#d8e0a0';
    const post = '#7a4a3a';
    const out = [R(0, 0, 640, 300, '#fff6ea')];
    // Shoji: paper panes in a lattice, between posts.
    for (let x = 0; x < 640; x += 20) out.push(F(R(x, 52, 1.6, 196, '#d8c0a0')));
    for (let y = 52; y < 248; y += 28) out.push(F(R(0, y, 640, 1.6, '#d8c0a0')));
    for (const x of [0, 160, 440, 620]) out.push(R(x, 40, 16, 260, post), F(R(x, 40, 4, 260, '#9a6a52')));
    out.push(R(0, 40, 640, 14, post), F(R(0, 40, 640, 3, '#9a6a52')), R(0, 60, 640, 6, post));
    out.push(R(0, 248, 640, 52, '#a8704a'), F(R(0, 248, 640, 3, '#c89a6a')), ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => F(R(i * 80 + 4, 256, 72, 36, '#b8805a'))));
    // Tatami, each mat bordered in green cloth.
    for (let x = 0; x < 640; x += 120) out.push(R(x, 300, 118, ROOM_H - 300, FLOOR), F(R(x, 300, 118, 4, '#4a7a4a')), F(R(x, 300, 4, ROOM_H - 300, '#4a7a4a')), F(R(x + 58, 304, 2, ROOM_H - 304, '#c8d090')));
    for (let x = 0; x < 640; x += 6) out.push(F(R(x, 304, 0.8, ROOM_H - 304, '#ccd494')));
    out.push(...floorShade(FLOOR), R(0, 296, 640, 5, post));
    // The shrine shelf: a little torii, the fox, two candles, a bell, an offering of fried tofu.
    out.push(R(262, 112, 116, 8, post), F(R(262, 112, 116, 2, '#9a6a52')), T([[270, 120], [276, 120], [276, 132]], post), T([[370, 120], [364, 120], [364, 132]], post));
    out.push(R(282, 82, 4, 30, '#e5485f'), R(354, 82, 4, 30, '#e5485f'), R(274, 78, 92, 5, '#e5485f'), F(R(274, 78, 92, 1.6, '#ff8a8a')), R(278, 88, 84, 3, '#e5485f'));
    out.push(E(320, 104, 9, 8, WHITE), T([[312, 100], [314, 88], [319, 98]], WHITE), T([[321, 98], [326, 88], [328, 100]], WHITE), F(E(316, 103, 1.4, 1.4, '#e5485f')), F(E(324, 103, 1.4, 1.4, '#e5485f')), E(330, 108, 6, 3, WHITE));
    out.push(...candle(296, 112, '#fff8e8', 10), ...candle(344, 112, '#fff8e8', 10), E(338, 110, 7, 2, WHITE), R(333, 104, 10, 6, '#e0a060'), F(R(333, 104, 10, 1.4, '#ffc890')), E(306, 108, 4, 4, GOLD), R(305.4, 92, 1.2, 12, '#a89888'));
    // Paper charms either side of the shrine.
    for (const x of [222, 238, 402, 418]) out.push(R(x, 142, 10, 34, '#fff8e8'), F(R(x + 2, 148, 6, 2, '#e5485f')), F(R(x + 4, 154, 2, 16, '#e5485f')), F(R(x, 142, 10, 1.2, '#e8d8c0')));
    // Fox masks on the wall.
    for (const [x, c] of [[60, '#e5485f'], [110, '#ffb03a'], [520, '#8fc8ff']]) out.push(E(x, 118, 17, 19, WHITE), T([[x - 15, 104], [x - 11, 84], [x - 3, 102]], WHITE), T([[x + 3, 102], [x + 11, 84], [x + 15, 104]], WHITE), F(T([[x - 11, 88], [x - 8, 100], [x - 4, 100]], '#ffb3c6')), F(T([[x + 11, 88], [x + 8, 100], [x + 4, 100]], '#ffb3c6')), F(T([[x - 10, 114], [x - 2, 118], [x - 10, 120]], c)), F(T([[x + 10, 114], [x + 2, 118], [x + 10, 120]], c)), F(E(x, 130, 2, 1.4, c)), F(R(x - 1, 96, 2, 8, c)), R(x - 14, 136, 28, 2, '#e5485f'));
    // The round moon window: bamboo and a big moon outside.
    out.push(E(480, 186, 40, 40, post), E(480, 186, 34, 34, '#2f3f68'), E(470, 176, 12, 12, '#fff3c0'), F(E(466, 172, 4, 4, WHITE)));
    for (const [bx, lean] of [[456, 2], [496, -1], [506, 3]]) {
      out.push(F(T([[bx, 220], [bx + 3, 220], [bx + 3 + lean, 152], [bx + lean, 152]], '#4a8a5a')));
      for (let k = 0; k < 4; k++) out.push(F(R(bx + lean * (k / 4) - 0.5, 210 - k * 16, 4, 1.2, '#2a5a3a')), F(T([[bx + 3, 200 - k * 16], [bx + 16, 196 - k * 16], [bx + 4, 202 - k * 16]], '#5aa87a')));
    }
    for (let i = 0; i < 4; i++) out.push(F(R(446 + i * 20, 146, 1.6, 80, post)));
    out.push(R(440, 182, 80, 1.6, post), E(480, 230, 30, 5, post));
    // The scroll and the vase of branches in the corner.
    out.push(R(588, 76, 28, 4, post), R(590, 80, 24, 130, '#f6ecd8'), F(R(592, 82, 20, 126, '#fffaf0')), R(588, 208, 28, 4, post), E(602, 120, 8, 8, '#e5485f'), F(R(600, 140, 3, 26, '#3a3a4a')), F(R(596, 150, 10, 2.4, '#3a3a4a')), F(R(598, 170, 6, 2, '#3a3a4a')));
    out.push(contact(602, 40, FLOOR), R(586, 284, 32, 14, post), R(596, 254, 12, 30, '#e8e0f0'), F(R(598, 256, 3, 24, WHITE)), E(602, 254, 7, 3, '#c8c0d8'));
    for (const [dx, dy] of [[-14, -40], [-4, -56], [10, -46], [16, -30]]) out.push(T([[602, 254], [602 + dx, 254 + dy], [603 + dx, 254 + dy], [603, 254]], '#7a4a3a'), E(602 + dx, 254 + dy, 4, 4, '#ffc2d4'), E(602 + dx * 0.6, 254 + dy * 0.6, 3, 3, WHITE));
    // The red paper umbrella, open, leaning in the corner by the door.
    out.push(T([[104, 212], [160, 212], [132, 182]], '#e5485f'), F(T([[132, 182], [160, 212], [146, 212]], '#c8384a')));
    for (let k = 0; k < 5; k++) out.push(F(T([[132, 182], [104 + k * 14, 212], [105 + k * 14, 212]], '#ffd2e0')));
    out.push(R(131, 212, 2.4, 88, post), E(132, 300, 3, 2, post));
    // The low table set for tea, its cushions, the lanterns' hooks.
    out.push(contact(320, 200, FLOOR), R(230, 262, 180, 10, '#a8503a'), F(R(230, 262, 180, 2, '#c87a5a')), R(240, 272, 10, 28, '#8a3a2a'), R(390, 272, 10, 28, '#8a3a2a'));
    out.push(E(290, 256, 12, 8, '#fff6ea'), R(300, 250, 8, 3, '#fff6ea'), E(290, 248, 4, 2, '#e0d0c0'), F(E(286, 254, 3, 2, WHITE)), E(316, 258, 5, 4, '#9fe0a0'), E(332, 258, 5, 4, '#9fe0a0'));
    out.push(E(362, 259, 16, 3, WHITE), E(356, 255, 6, 4, '#e0a060'), E(368, 255, 6, 4, '#e0a060'), F(E(355, 253, 3, 1.4, '#ffc890')), E(392, 258, 7, 3, '#ffd2e0'), E(392, 255, 5, 3, WHITE), E(390, 251, 4, 3, '#c8e8ff'));
    out.push(E(200, 300, 30, 8, '#ff8a6a'), F(E(196, 297, 18, 3, '#ffb09a')), E(440, 300, 30, 8, '#ff8a6a'), F(E(436, 297, 18, 3, '#ffb09a')));
    for (const lx of [228, 412]) out.push(R(lx - 1, 66, 2, 4, post));
    // A rolled futon and the pile of teacups.
    out.push(contact(530, 60, FLOOR), E(530, 288, 30, 13, '#ffd2e0'), F(E(530, 288, 20, 9, '#ffc2d4')), F(E(530, 288, 8, 4, '#ff9ec0')), R(500, 284, 60, 3, '#e5485f'));
    for (let i = 0; i < 9; i++) out.push(E(560 + (i % 4) * 7 + (Math.floor(i / 4) % 2) * 3, 296 - Math.floor(i / 4) * 7, 5, 3.4, ['#ffffff', '#c8e8ff', '#ffd2e0', '#e8f8d8'][i % 4]));
    out.push(...door(60, 52, 120, '#a8503a', '#fff8e8', 'shoji'));
    return out;
  }, false),

  // Celeste's room: a night-blue room under a painted star-map ceiling, moon phases along the
  // cornice, a strip of fairy-light stars, an open dome hatch onto the real sky where the telescope
  // points, star charts pinned up, the bed with its moon headboard, nightcap and plush star, a
  // nightstand with a moon lamp, a cocoa and an alarm clock she ignores, the bookshelf of star books
  // with a globe, an hourglass and a jar of stardust, papers on the floor.
  celeste: () => art('swr-celeste', 640, ROOM_H, () => {
    const FLOOR = '#5f5fb8';
    const out = [R(0, 0, 640, 300, '#2f2f68')];
    for (let i = 0; i < 70; i++) out.push(F(star(hash(i * 1.3) * 640, 60 + hash(i * 2.7) * 150, 1 + hash(i) * 2, i % 4 ? '#c8c8ff' : GOLD)));
    // Constellation lines between some of them.
    for (const c of [[[60, 90], [86, 76], [112, 92], [130, 70]], [[540, 210], [566, 190], [592, 204], [612, 182]]]) for (let i = 0; i < c.length - 1; i++) out.push(F(T([c[i], c[i + 1], [c[i + 1][0], c[i + 1][1] + 1], [c[i][0], c[i][1] + 1]], '#6a6ab8')));
    out.push(...wainscot('#3a3a7a', 232, '#8f7fe0'), ...cornice('#4a4aa8', 40, 14));
    // Moon phases along the cornice.
    for (let i = 0; i < 16; i++) out.push(E(20 + i * 40, 47, 5, 5, '#fff3b0'), E(20 + i * 40 + (i % 8 - 4) * 1.6, 47, 5, 5, '#4a4aa8'));
    out.push(...planks(0, 300, 640, ROOM_H - 300, ramp(FLOOR, 0.8), 16, 4), ...floorShade(FLOOR), ...skirting('#8f7fe0'));
    // The open dome hatch the telescope looks out of: the real night sky and the moon.
    out.push(R(350, 60, 84, 70, '#4a4aa8'), R(356, 64, 72, 62, '#141838'), E(404, 84, 12, 12, '#fff3c0'), E(409, 81, 10, 10, '#141838'));
    for (let i = 0; i < 9; i++) out.push(F(star(360 + hash(i * 4.1) * 64, 68 + hash(i * 3.3) * 54, 1.2 + hash(i) * 1.4, WHITE)));
    out.push(R(346, 56, 92, 6, '#8f7fe0'), R(346, 126, 92, 6, '#8f7fe0'), F(R(346, 56, 92, 1.4, '#c8c8ff')));
    // The telescope's mount (the tube turns: roomLife), on a little round platform.
    out.push(contact(320, 80, FLOOR), E(320, 296, 40, 7, '#6a4a3a'), F(E(320, 294, 36, 4, '#8a6a4a')), T([[304, 296], [316, 226], [324, 226], [336, 296]], '#8a6a4a'), F(T([[320, 226], [324, 226], [336, 296], [326, 296]], '#6a4a3a')), E(320, 224, 10, 10, '#c8902a'), F(E(318, 222, 4, 4, '#ffe08a')));
    // Star charts pinned on the wall.
    for (const [x, y, s] of [[176, 76, 1], [250, 118, 2]]) {
      out.push(R(x, y, 64, 50, '#f2eeff'), F(R(x, y, 64, 3, '#c8c8e8')), F(E(x + 4, y + 4, 1.6, 1.6, '#ff6b8a')), F(E(x + 60, y + 4, 1.6, 1.6, '#ff6b8a')));
      const pts = s === 1 ? [[x + 8, y + 38], [x + 22, y + 16], [x + 38, y + 28], [x + 56, y + 12]] : [[x + 10, y + 14], [x + 24, y + 36], [x + 40, y + 20], [x + 52, y + 40], [x + 30, y + 10]];
      for (let i = 0; i < pts.length - 1; i++) out.push(F(T([pts[i], pts[i + 1], [pts[i + 1][0], pts[i + 1][1] + 1.2], [pts[i][0], pts[i][1] + 1.2]], '#8f8fc8')));
      for (const [px, py] of pts) out.push(star(px, py, 2.6, GOLD));
    }
    // The bed: a headboard with a crescent moon, a starry quilt, moon pillows, her nightcap and a
    // plush star.
    out.push(contact(150, 210, FLOOR), R(52, 186, 14, 114, '#c8c8e8'), E(59, 186, 9, 9, '#fff3b0'), R(236, 232, 12, 68, '#c8c8e8'), E(242, 230, 7, 7, '#fff3b0'));
    out.push(T([[66, 236], [66, 196], [96, 178], [150, 172], [150, 236]], '#8f7fe0'), F(T([[66, 236], [66, 200], [96, 182], [150, 176], [150, 186], [100, 194], [76, 210], [76, 236]], '#a898f0')), E(108, 202, 14, 14, '#fff3b0'), E(116, 198, 12, 12, '#8f7fe0'));
    out.push(R(66, 250, 172, 30, '#8f7fe0'), R(66, 278, 172, 20, '#5f5fb8'), F(R(66, 250, 172, 3, '#b8a8ff')), E(96, 246, 24, 12, '#fff3b0'), F(E(90, 242, 8, 4, WHITE)), E(150, 248, 20, 11, '#fff3b0'), T([[80, 236], [100, 232], [116, 222], [110, 240]], '#8fd8ff'), E(116, 222, 3.4, 3.4, WHITE));
    for (let i = 0; i < 8; i++) out.push(F(star(108 + i * 16, 266 + (i % 2) * 7, 3, GOLD)));
    out.push(T([[66, 280], [238, 280], [236, 300], [68, 300]], '#4a4aa8'));
    for (let i = 0; i < 9; i++) out.push(E(72 + i * 20, 282, 10, 4, '#5f5fb8'));
    out.push(star(204, 244, 9, '#ffe08a'), F(star(202, 242, 4, '#fff3b0')), F(E(201, 244, 1, 1, '#5a4a6a')), F(E(207, 244, 1, 1, '#5a4a6a')));
    // The nightstand: the moon lamp, a cocoa, the alarm clock lying on its face.
    out.push(contact(30, 40, FLOOR), R(12, 252, 38, 48, '#4a3a6a'), R(10, 248, 42, 6, '#6a5a8a'), F(R(10, 248, 42, 1.4, '#8a7aaa')), R(16, 262, 30, 14, '#5a4a7a'), E(31, 269, 2, 2, GOLD));
    out.push(R(22, 232, 4, 16, '#c8c8e8'), E(24, 222, 12, 12, '#fff3b0'), E(30, 218, 9, 9, '#4a3a6a'), R(36, 238, 10, 10, '#ffd2e0'), E(41, 238, 5, 2, '#a86a4a'), F(E(39, 237, 1.6, 0.8, WHITE)));
    // The bookshelf: star books, the globe, an hourglass, a jar of stardust, crystals.
    out.push(contact(540, 150, FLOOR), R(466, 150, 148, 150, '#4a3a6a'), R(462, 146, 156, 8, '#6a5a8a'), F(R(462, 146, 156, 1.6, '#8a7aaa')), R(472, 156, 136, 140, '#2a2048'));
    for (let row = 0; row < 3; row++) {
      const sy = 196 + row * 46;
      out.push(R(472, sy, 136, 5, '#6a5a8a'));
      out.push(...books(476, sy, row === 1 ? 70 : 96, ['#c8c8ff', '#ffe08a', '#8fd8ff', '#ff9ec0', '#9fe0a0'], 30 + row));
    }
    out.push(R(580, 176, 20, 20, '#d8f2ff'), R(582, 172, 16, 4, '#c8902a'), ...[0, 1, 2, 3, 4].map((k) => F(star(585 + (k % 3) * 5, 192 - Math.floor(k / 3) * 7, 2, GOLD))));
    out.push(T([[552, 210], [568, 210], [560, 226]], '#c8e8ff'), T([[552, 242], [568, 242], [560, 226]], '#c8e8ff'), R(550, 206, 20, 4, '#c8902a'), R(550, 240, 20, 4, '#c8902a'), F(T([[555, 238], [565, 238], [560, 232]], '#ffe08a')));
    out.push(...[0, 1, 2].map((k) => T([[580 + k * 8, 288], [584 + k * 8, 272 - k * 4], [588 + k * 8, 288]], ['#c8a8ff', '#8fd8ff', '#ffb3cf'][k])));
    out.push(R(530, 140, 20, 6, '#c8902a'), E(540, 126, 16, 16, '#8fd8ff'), F(E(536, 122, 7, 9, '#9fe0a0')), F(E(546, 132, 4, 5, '#9fe0a0')), F(T([[524, 126], [556, 126], [556, 127], [524, 127]], '#c8902a')));
    // Papers on the floor by the telescope.
    out.push(T([[368, 296], [392, 292], [396, 300], [372, 304]], '#f2eeff'), F(star(382, 297, 2, GOLD)), T([[260, 298], [282, 296], [284, 304], [262, 306]], '#f2eeff'));
    out.push(...rug(160, '#8f7fe0', '#c8c8ff'), ...door(420, 44, 104, '#4a4aa8', GOLD, 'moon'));
    return out;
  }, false),

  // Marlowe's cabin: curved ship's planks and ribs under a beam with signal flags strung across, a
  // rope rail, sea charts, the ship's wheel, a life ring, a porthole, his bottle shelf of ships in
  // bottles over a crate and a coil of rope, barrels, the treasure chest with a spyglass and compass
  // on its lid, fishing rods, a lantern on a hook, the net in the corner with a starfish in it.
  marlowe: () => art('swr-marlowe', 640, ROOM_H, () => {
    const FLOOR = '#c89a6a';
    const out = [R(0, 0, 640, 300, '#d8a878')];
    for (let y = 40; y < 300; y += 16) out.push(F(R(0, y, 640, 1.4, '#b8865a')), F(R(0, y + 1.4, 640, 0.8, '#e8c098')));
    for (let i = 0; i < 40; i++) out.push(F(E(hash(i * 3.1) * 640, 48 + Math.floor(hash(i * 1.7) * 16) * 16, 1, 1, '#8a5a3a')));
    for (const x of [60, 220, 420, 580]) out.push(R(x - 7, 40, 14, 260, '#a8704a'), F(R(x - 7, 40, 3, 260, '#c88a5a')), F(R(x + 4, 40, 3, 260, '#8a5a3a')));
    out.push(R(0, 40, 640, 14, '#8a5a3a'), F(R(0, 40, 640, 3, '#a8704a')));
    // Signal flags strung under the beam.
    for (let i = 0; i < 16; i++) {
      const fx = 170 + i * 26;
      if (fx > 560) break;
      const sag = Math.sin(((fx - 170) / 390) * Math.PI) * 8;
      out.push(T([[fx, 58 + sag], [fx + 20, 58 + sag], [fx + 10, 74 + sag]], ['#e5485f', '#ffe08a', '#5f8fd8', WHITE][i % 4]), F(T([[fx + 6, 60 + sag], [fx + 14, 60 + sag], [fx + 10, 66 + sag]], ['#ffe08a', '#e5485f', WHITE, '#5f8fd8'][i % 4])));
    }
    out.push(F(T([[160, 58], [570, 58], [570, 59], [160, 59]], '#e8c890')));
    // The rope rail and darker planking below it.
    out.push(R(0, 232, 640, 68, '#b8865a'));
    for (let y = 236; y < 300; y += 16) out.push(F(R(0, y, 640, 1.4, '#8a5a3a')));
    for (let x = 0; x < 640; x += 6) out.push(F(E(x + 3, 230, 3.4, 2.4, x % 12 ? '#f6e8c8' : '#d8c8a0')));
    out.push(...planks(0, 300, 640, ROOM_H - 300, ramp(FLOOR, 0.8), 16, 8), ...floorShade(FLOOR), ...skirting('#8a5a3a'));
    // Sea charts, one with his route dotted out past the lighthouse.
    for (const [x, y, w, h] of [[90, 84, 110, 74], [440, 82, 116, 84]]) {
      out.push(R(x, y, w, h, '#f6e8c8'), F(R(x, y, w, 2, '#fff8e8')), F(R(x + w - 2, y, 2, h, '#d8c0a0')), F(E(x + w * 0.32, y + h * 0.55, w * 0.18, h * 0.22, '#9fd8ff')), F(E(x + w * 0.72, y + h * 0.4, w * 0.1, h * 0.14, '#9fe0a0')));
      for (let k = 0; k < 6; k++) out.push(F(E(x + 14 + k * (w - 28) / 5, y + h * 0.72 - Math.sin(k) * 8, 1.2, 1.2, '#e5485f')));
      out.push(F(T([[x + w - 16, y + h - 14], [x + w - 8, y + h - 14], [x + w - 12, y + h - 24]], '#e5485f')), F(E(x + 4, y + 4, 2, 2, '#a8805a')), F(E(x + w - 4, y + 4, 2, 2, '#a8805a')));
    }
    // The ship's wheel.
    out.push(E(320, 186, 48, 48, '#8a5a3a'), E(320, 186, 40, 40, '#d8a878'), F(E(320, 186, 38, 38, '#c89a6a')), E(320, 186, 12, 12, '#8a5a3a'), F(E(318, 184, 5, 5, '#c88a5a')), E(320, 186, 4, 4, GOLD));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      out.push(T([[320 + Math.cos(a) * 10, 186 + Math.sin(a) * 10], [320 + Math.cos(a + 0.09) * 60, 186 + Math.sin(a + 0.09) * 60], [320 + Math.cos(a - 0.09) * 60, 186 + Math.sin(a - 0.09) * 60]], '#8a5a3a'), E(320 + Math.cos(a) * 60, 186 + Math.sin(a) * 60, 5, 5, '#a8704a'), F(E(319 + Math.cos(a) * 60, 185 + Math.sin(a) * 60, 2, 2, '#c88a5a')));
    }
    // The life ring on the rib, the porthole's frame (the sea in it moves: roomLife).
    out.push(E(220, 120, 18, 18, '#e5485f'), E(220, 120, 10, 10, '#a8704a'));
    for (let k = 0; k < 4; k++) out.push(F(T([[220 + Math.cos((k / 4) * TAU) * 10, 120 + Math.sin((k / 4) * TAU) * 10], [220 + Math.cos((k / 4) * TAU + 0.4) * 18, 120 + Math.sin((k / 4) * TAU + 0.4) * 18], [220 + Math.cos((k / 4) * TAU - 0.4) * 18, 120 + Math.sin((k / 4) * TAU - 0.4) * 18]], WHITE)));
    out.push(F(T([[204, 112], [236, 112], [236, 113.4], [204, 113.4]], '#f6e8c8')));
    // The bottle shelf: ships in bottles; a crate under it, a coil of rope.
    out.push(...shelf(86, 214, 144, '#8a5a3a'));
    for (let i = 0; i < 4; i++) {
      const bx = 98 + i * 34;
      out.push(E(bx + 10, 202, 12, 11, '#c8f0e8'), R(bx + 20, 198, 8, 8, '#c8f0e8'), R(bx + 27, 199, 4, 6, '#a8805a'), F(E(bx + 6, 197, 4, 3, WHITE)), T([[bx + 2, 208], [bx + 18, 208], [bx + 15, 212], [bx + 5, 212]], '#a8704a'), F(T([[bx + 9, 194], [bx + 16, 206], [bx + 9, 206]], WHITE)), F(R(bx + 9, 192, 1, 16, '#8a5a3a')), F(T([[bx + 8, 196], [bx + 3, 206], [bx + 8, 206]], ['#ff8a8a', '#ffe08a', '#8fc8ff', WHITE][i])));
    }
    out.push(contact(150, 80, FLOOR), R(112, 252, 76, 48, '#b8865a'), F(R(112, 252, 76, 2, '#d8a878')), F(T([[112, 252], [120, 252], [188, 300], [180, 300]], '#8a5a3a')), F(T([[188, 252], [180, 252], [112, 300], [120, 300]], '#8a5a3a')), R(112, 252, 76, 4, '#8a5a3a'), R(112, 296, 76, 4, '#8a5a3a'));
    out.push(contact(256, 44, FLOOR), E(256, 292, 22, 8, '#e8c890'), E(256, 288, 18, 6, '#d8b070'), E(256, 285, 12, 4, '#e8c890'), F(E(256, 284, 5, 2, '#a8805a')));
    // Barrels by the wall, a lantern on its hook over them.
    out.push(contact(40, 60, FLOOR), R(18, 234, 44, 66, '#a8704a'), E(40, 234, 22, 6, '#c88a5a'), F(E(40, 234, 18, 4, '#8a5a3a')), R(18, 246, 44, 4, '#6a6a7a'), R(18, 284, 44, 4, '#6a6a7a'), F(R(20, 236, 6, 62, '#c88a5a')));
    out.push(R(26, 222, 24, 12, '#c89a6a'), E(38, 222, 12, 3, '#d8a878'));
    out.push(R(36, 96, 2, 40, '#3a3a4a'), R(30, 96, 14, 3, '#3a3a4a'));
    // The treasure chest, a spyglass and compass on its lid, his fishing rods.
    out.push(contact(510, 90, FLOOR), R(470, 250, 80, 50, '#8a5a3a'), E(510, 250, 40, 16, '#a8704a'), F(E(506, 246, 26, 8, '#c88a5a')), R(470, 262, 80, 4, GOLD), R(504, 258, 12, 14, GOLD), F(R(507, 262, 6, 6, '#8a5a3a')), R(486, 250, 4, 50, GOLD), R(530, 250, 4, 50, GOLD));
    out.push(T([[484, 236], [520, 230], [521, 234], [485, 240]], '#c8902a'), E(484, 238, 3, 3, '#c8902a'), F(T([[490, 236], [516, 232], [516, 233], [490, 237]], '#ffe08a')), E(532, 236, 7, 3, '#c8902a'), E(532, 235, 5, 2, '#fff8e8'), F(T([[532, 233], [534, 235], [532, 237]], '#e5485f')));
    for (const [x, lean] of [[560, -10], [566, -4]]) out.push(T([[x, 300], [x + 2, 300], [x + 2 + lean, 150], [x + lean, 150]], '#8a5a3a'), E(x + 1, 274, 4, 4, '#c8c8d8'));
    // The net in the corner, a starfish caught in it.
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) out.push(F(R(i * 14, 54 + j * 14, 14, 1.2, '#f6e8c8')), F(R(i * 14, 54 + j * 14, 1.2, 14, '#f6e8c8')));
    out.push(star(46, 84, 7, '#ff9e7a'), F(star(45, 83, 3, '#ffc8a8')));
    // The hammock's hooks.
    out.push(E(376, 172, 4, 4, '#6a6a7a'), E(474, 172, 4, 4, '#6a6a7a'));
    out.push(...rug(320, '#2f5fb8', '#f6e8c8'), star(320, 341, 8, GOLD), ...door(605, 46, 108, '#8a5a3a', GOLD, 'porthole'));
    return out;
  }, false),
};

// ---------- Alive ----------

function glow(ctx, x, y, r, color, alpha) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
function steam(ctx, x, y, time, seed, n = 3, rise = 26) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const k = (time * 0.32 + i / n + seed) % 1;
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.5;
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(x + Math.sin(k * 5 + seed * 7) * 3, y - k * rise, 1.6 + k * 3, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
// A candle flame: a teardrop that leans and flickers, with its glow.
function flame(ctx, x, y, time, seed, s = 1) {
  const f = 0.85 + 0.15 * Math.sin(time * 11 + seed * 3.1) * Math.sin(time * 7.3 + seed);
  const lean = Math.sin(time * 2.1 + seed) * 0.8;
  glow(ctx, x, y - 3 * s, 22 * s, '#ffcf70', 0.28 * f);
  ctx.fillStyle = '#ffb03a';
  ctx.beginPath();
  ctx.moveTo(x - 2.4 * s, y);
  ctx.quadraticCurveTo(x - 2.6 * s, y - 4 * s * f, x + lean, y - 8 * s * f);
  ctx.quadraticCurveTo(x + 2.6 * s, y - 4 * s * f, x + 2.4 * s, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.ellipse(x + lean * 0.3, y - 2.4 * s, 1.1 * s, 2.4 * s * f, 0, 0, TAU);
  ctx.fill();
}
// Where each room's candles burn (their wicks: candle() tops).
const FLAMES = {
  poppy: [],
  lark: [],
  rowan: [[244, 159], [256, 155], [396, 157], [126, 135], [426, 135]],
  yuzu: [[296, 99], [344, 99]],
  celeste: [],
  marlowe: [],
};

// Each room's moving parts.
export function roomLife(ctx, id, ox, oy, time) {
  for (const [i, [x, y]] of (FLAMES[id] ?? []).entries()) flame(ctx, ox + x, oy + y, time, i * 1.7 + x * 0.01);
  switch (id) {
    case 'poppy': {
      // The oven's fire, steam off the fresh loaf, the pendant lamps, the clock, the cat asleep.
      const f = 0.6 + 0.4 * Math.sin(time * 9) * Math.sin(time * 5.3);
      glow(ctx, ox + 115, oy + 210, 54, '#ffb03a', 0.35 + f * 0.25);
      steam(ctx, ox + 470, oy + 232, time, 0.3, 3);
      steam(ctx, ox + 340, oy + 232, time, 0.7, 2, 18);
      for (const lx of [330, 470]) {
        ctx.fillStyle = '#c8a070';
        ctx.fillRect(Math.round(ox + lx - 0.5), Math.round(oy + 52), 1, 44);
        ctx.fillStyle = '#ff9ec0';
        ctx.beginPath();
        ctx.moveTo(ox + lx - 13, oy + 108);
        ctx.quadraticCurveTo(ox + lx, oy + 86, ox + lx + 13, oy + 108);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.ellipse(ox + lx, oy + 108, 6, 3, 0, 0, TAU);
        ctx.fill();
        glow(ctx, ox + lx, oy + 112, 46, '#fff0c0', 0.32);
      }
      const hh = (time / 60) % 1;
      const mm = (time / 5) % 1;
      ctx.strokeStyle = '#8a4a3a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ox + 608, oy + 150);
      ctx.lineTo(ox + 608 + Math.sin(hh * TAU) * 6, oy + 150 - Math.cos(hh * TAU) * 6);
      ctx.moveTo(ox + 608, oy + 150);
      ctx.lineTo(ox + 608 + Math.sin(mm * TAU) * 10, oy + 150 - Math.cos(mm * TAU) * 10);
      ctx.stroke();
      // The cat, curled in the bread basket, breathing slowly; an ear flicks now and then.
      const br = 1 + Math.sin(time * 1.6) * 0.06;
      const cx = ox + 470;
      const cy = oy + 282;
      ctx.fillStyle = '#ffb070';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 16, 7 * br, 0, Math.PI, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 13, cy - 2, 6.5, 5.5 * br, 0, 0, TAU);
      ctx.fill();
      const flick = Math.max(0, Math.sin(time * 0.9) - 0.94) * 30;
      for (const [ex, tip] of [[9, -1], [16, 1]]) {
        ctx.beginPath();
        ctx.moveTo(cx + ex, cy - 5);
        ctx.lineTo(cx + ex + tip * 1.4 - (ex === 16 ? flick : 0) * 0.3, cy - 11 + (ex === 16 ? flick * 0.2 : 0));
        ctx.lineTo(cx + ex + 4, cy - 6);
        ctx.fill();
      }
      ctx.fillStyle = '#e0904a';
      for (let k = 0; k < 3; k++) ctx.fillRect(Math.round(cx - 8 + k * 5), Math.round(cy - 6 * br), 2, 3);
      ctx.strokeStyle = '#7a4a3a';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx + 10, cy - 2);
      ctx.quadraticCurveTo(cx + 11.5, cy - 0.5, cx + 13, cy - 2);
      ctx.moveTo(cx + 14.5, cy - 2);
      ctx.quadraticCurveTo(cx + 16, cy - 0.5, cx + 17.5, cy - 2);
      ctx.stroke();
      ctx.fillStyle = '#ffb070';
      ctx.beginPath();
      ctx.ellipse(cx - 12, cy - 1, 8, 2.6, 0.2 + Math.sin(time * 0.7) * 0.15, 0, TAU);
      ctx.fill();
      if ((time % 6) < 3) {
        ctx.globalAlpha = Math.sin(((time % 6) / 3) * Math.PI) * 0.8;
        ctx.fillStyle = '#c8a8e8';
        ctx.font = 'bold 6px sans-serif';
        ctx.fillText('z', cx + 20 + (time % 6) * 2, oy + 270 - (time % 6) * 4);
        ctx.globalAlpha = 1;
      }
      break;
    }
    case 'lark': {
      // The lighthouse beam sweeping past her round window, her oil lamp, her cooling tea, and two
      // paper cranes turning on their threads.
      ctx.save();
      ctx.beginPath();
      ctx.arc(ox + 320, oy + 120, 52, 0, TAU);
      ctx.clip();
      const k = ((time * 0.25) % 1) * 160 - 80;
      const g = ctx.createLinearGradient(ox + 320 + k - 20, 0, ox + 320 + k + 20, 0);
      g.addColorStop(0, 'rgba(255,243,166,0)');
      g.addColorStop(0.5, 'rgba(255,243,166,0.6)');
      g.addColorStop(1, 'rgba(255,243,166,0)');
      ctx.fillStyle = g;
      ctx.fillRect(ox + 260, oy + 60, 120, 120);
      ctx.restore();
      glow(ctx, ox + 398, oy + 188, 48, '#fff0b0', 0.38 + 0.04 * Math.sin(time * 6));
      steam(ctx, ox + 268, oy + 226, time, 0.2, 2, 16);
      for (const [cx, len] of [[200, 70], [250, 96]]) {
        const a = Math.sin(time * 0.8 + cx);
        ctx.strokeStyle = '#a8a0c0';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(ox + cx, oy + 52);
        ctx.lineTo(ox + cx, oy + len);
        ctx.stroke();
        ctx.save();
        ctx.translate(ox + cx, oy + len + 6);
        ctx.scale(Math.cos(a), 1);
        ctx.fillStyle = '#ffd1e1';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(0, -6);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 4);
        ctx.fill();
        ctx.fillStyle = '#ffb3cf';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 4);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'rowan': {
      // The fire crackling, sparks going up the chimney, its warm light on the room.
      const f = 0.6 + 0.4 * Math.sin(time * 8) * Math.sin(time * 4.1);
      glow(ctx, ox + 320, oy + 270, 90, '#ffb03a', 0.3 + f * 0.25);
      for (let i = 0; i < 6; i++) {
        const k = (time * 1.3 + i / 6) % 1;
        ctx.fillStyle = `rgba(255,${170 + k * 70},80,${(1 - k) * 0.95})`;
        ctx.beginPath();
        ctx.ellipse(ox + 296 + i * 10 + Math.sin(time * 3 + i) * 3, oy + 290 - k * 56, 6 * (1 - k), 12 * (1 - k), 0, 0, TAU);
        ctx.fill();
      }
      for (let i = 0; i < 4; i++) {
        const k = (time * 0.7 + i / 4) % 1;
        ctx.fillStyle = `rgba(255,220,140,${1 - k})`;
        ctx.fillRect(Math.round(ox + 300 + i * 12 + Math.sin(time * 4 + i * 2) * 6), Math.round(oy + 250 - k * 60), 1.4, 1.4);
      }
      break;
    }
    case 'yuzu': {
      // Paper lanterns swaying over the table, glowing.
      for (const lx of [228, 412]) {
        const sw = Math.sin(time * 1.3 + lx) * 0.1;
        ctx.save();
        ctx.translate(ox + lx, oy + 70);
        ctx.rotate(sw);
        ctx.strokeStyle = '#5a4a6a';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 30);
        ctx.stroke();
        ctx.fillStyle = '#ff7a4a';
        ctx.beginPath();
        ctx.ellipse(0, 50, 16, 20, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffa070';
        ctx.beginPath();
        ctx.ellipse(-4, 46, 6, 14, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffd36b';
        for (const y of [41, 50, 59]) ctx.fillRect(-15, y, 30, 1.4);
        ctx.fillStyle = '#3a2a2a';
        ctx.fillRect(-7, 29, 14, 3);
        ctx.fillRect(-6, 69, 12, 3);
        ctx.restore();
        glow(ctx, ox + lx, oy + 120, 50, '#ffb070', 0.35);
      }
      steam(ctx, ox + 290, oy + 246, time, 0.4, 3, 20);
      break;
    }
    case 'celeste': {
      // The telescope aimed up at the hatch, turning slowly; the planet mobile; the moon lamp; the
      // fairy-light stars along the cornice twinkling; the painted stars glinting.
      const a = -1.1 + Math.sin(time * 0.2) * 0.12;
      ctx.save();
      ctx.translate(ox + 320, oy + 224);
      ctx.rotate(a);
      ctx.fillStyle = '#c8902a';
      ctx.fillRect(-14, -9, 128, 18);
      ctx.fillStyle = '#e0b060';
      ctx.fillRect(-14, -9, 128, 12);
      ctx.fillStyle = '#ffe08a';
      ctx.fillRect(-14, -9, 128, 4);
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(100, -11, 16, 22);
      ctx.fillRect(10, -10, 6, 20);
      ctx.restore();
      for (let i = 0; i < 4; i++) {
        const t2 = time * 0.4 + (i * TAU) / 4;
        const px = ox + 540 + Math.cos(t2) * 46;
        const py = oy + 96 + Math.sin(t2) * 8;
        ctx.strokeStyle = '#8f8fc8';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(ox + 540, oy + 54);
        ctx.lineTo(px, py - 8);
        ctx.stroke();
        ctx.fillStyle = ['#ffb08a', '#8fd8ff', '#c8a8ff', '#ffe08a'][i];
        ctx.beginPath();
        ctx.arc(px, py, 7 - i, 0, TAU);
        ctx.fill();
        if (i === 2) {
          ctx.strokeStyle = '#fff3b0';
          ctx.beginPath();
          ctx.ellipse(px, py, 9, 2.4, -0.3, 0, TAU);
          ctx.stroke();
        }
      }
      glow(ctx, ox + 24, oy + 222, 40, '#fff3b0', 0.42 + 0.06 * Math.sin(time * 1.2));
      for (let i = 0; i < 15; i++) {
        const x = ox + 30 + i * 40;
        const sag = Math.sin((i / 14) * Math.PI) * 10;
        const tw = 0.5 + 0.5 * Math.sin(time * 2.4 + i * 1.7);
        glow(ctx, x, oy + 66 + sag, 9, '#fff3b0', 0.2 + tw * 0.45);
        ctx.fillStyle = tw > 0.5 ? '#fff8d0' : '#ffe08a';
        ctx.fillRect(Math.round(x - 1), Math.round(oy + 65 + sag), 2, 2);
      }
      for (let i = 0; i < 12; i++) {
        const tw = (Math.sin(time * 2 + i * 1.9) + 1) / 2;
        if (tw < 0.75) continue;
        glow(ctx, ox + hash(i * 1.3) * 640, oy + 60 + hash(i * 2.7) * 150, 6, '#ffffff', (tw - 0.75) * 2.4);
      }
      break;
    }
    case 'marlowe': {
      // The striped hammock swaying on its hooks, the lantern swinging, the sea in the porthole.
      const sw = Math.sin(time * 1.2) * 5;
      ctx.strokeStyle = '#e8c890';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ox + 376, oy + 172);
      ctx.lineTo(ox + 392 + sw * 0.4, oy + 200);
      ctx.moveTo(ox + 474, oy + 172);
      ctx.lineTo(ox + 458 + sw * 0.4, oy + 200);
      ctx.stroke();
      for (const [c, d] of [['#e5485f', 0], [WHITE, 4], ['#5f8fd8', 8]]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(ox + 392 + sw * 0.4, oy + 200 + d * 0.3);
        ctx.quadraticCurveTo(ox + 425 + sw, oy + 236 + d, ox + 458 + sw * 0.4, oy + 200 + d * 0.3);
        ctx.quadraticCurveTo(ox + 425 + sw, oy + 226 + d, ox + 392 + sw * 0.4, oy + 200 + d * 0.3);
        ctx.fill();
      }
      ctx.fillStyle = '#fff8e8';
      ctx.beginPath();
      ctx.ellipse(ox + 404 + sw * 0.6, oy + 212, 8, 4, -0.4, 0, TAU);
      ctx.fill();
      // The lantern on its hook.
      const la = Math.sin(time * 1.1) * 0.12;
      ctx.save();
      ctx.translate(ox + 37, oy + 99);
      ctx.rotate(la);
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(-0.6, 0, 1.2, 12);
      ctx.fillRect(-7, 12, 14, 3);
      ctx.fillRect(-6, 34, 12, 3);
      ctx.fillStyle = '#ffe8a0';
      ctx.fillRect(-5, 15, 10, 19);
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(-5, 15, 1.4, 19);
      ctx.fillRect(3.6, 15, 1.4, 19);
      ctx.restore();
      glow(ctx, ox + 37 + Math.sin(la) * -24, oy + 124, 50, '#ffd890', 0.4 + 0.05 * Math.sin(time * 7));
      // The porthole, the sea rising and falling in it.
      ctx.save();
      ctx.beginPath();
      ctx.arc(ox + 580, oy + 150, 26, 0, TAU);
      ctx.fillStyle = '#9fd8ff';
      ctx.fill();
      ctx.clip();
      ctx.fillStyle = '#4fa0c8';
      ctx.fillRect(ox + 550, oy + 152 + Math.sin(time * 1.2) * 6, 60, 40);
      ctx.fillStyle = '#e8f6ff';
      ctx.fillRect(ox + 556 + ((time * 6) % 40), oy + 150 + Math.sin(time * 1.2) * 6, 8, 1.4);
      ctx.restore();
      ctx.strokeStyle = '#c8902a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(ox + 580, oy + 150, 28, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = '#ffe08a';
      for (let k = 0; k < 6; k++) ctx.fillRect(Math.round(ox + 580 + Math.cos((k / 6) * TAU) * 28 - 1), Math.round(oy + 150 + Math.sin((k / 6) * TAU) * 28 - 1), 2, 2);
      break;
    }
    default:
  }
}
