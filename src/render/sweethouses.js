// The Sweethearts' own houses (data/sweethearts.js `house`): six new buildings in their towns, each
// one's idea in its shape, and a room inside decorated in their style. Drawn like the rest of the
// scenery (outlined pastel shapes lit from the upper left), and every one alive: chimneys puff,
// lamps glow at night, Celeste's telescope turns, Lark's lamp beams, lanterns sway.
//
// Outside:
//   swhouse_poppy    a bakery cottage with a bread-roll roof dripping icing, a striped awning over
//                    a shop window of cakes, a strawberry-red door, a chimney puffing
//   swhouse_lark     a tall, narrow keeper's cottage, sky-blue and white, portholes, a little lamp
//                    tower on top that glows and beams, poems pinned by the door, a wind chime
//   swhouse_rowan    a stone-and-timber knight's lodge with an extra-tall door, a shield crest,
//                    window boxes overflowing with daisies, a banner stirring
//   swhouse_yuzu     a little shrine house: a curved red roof, a round moon window, paper lanterns
//                    swaying, a fox-tail weathervane
//   swhouse_celeste  an observatory cottage: indigo walls with stars, a dome with a slit and a
//                    telescope that turns, a crescent-moon door
//   swhouse_marlowe  an upturned boat for a roof over a cabin, portholes, an anchor by the door, a
//                    rope ladder and a flag on the keel
// Inside (swroom_<id>, 640 x 360, like your hut): each one's own room.

import { R, E, T, F, mix } from './pixel.js';
import { ramp, planks, stones, hash } from './propkit.js';
import { art, place } from './scenery.js';
import { groundAt } from '../world/physics.js';

const TAU = Math.PI * 2;
const WOOD = '#c89a6a';
const WHITE = '#ffffff';
const GOLD = '#ffd36b';
const star = (cx, cy, r, c) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return T(pts, c);
};
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
function puffs(ctx, x, y, time, seed, n = 4) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const k = (time * 0.32 + i / n + seed) % 1;
    ctx.globalAlpha = (1 - k) * 0.55;
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(x + Math.sin(k * 5 + seed) * 4 + k * 8, y - k * 34, 2.5 + k * 4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
const win = (x, y, w, h, frame, warm = '#ffe08a') => [R(x - 1.5, y - 1.5, w + 3, h + 3, frame), R(x, y, w, h, '#5a4a6a'), F(R(x, y + 1, w, h - 1, warm)), F(R(x + w / 2 - 0.5, y, 1, h, frame)), F(R(x, y + h / 2 - 0.5, w, 1, frame)), F(R(x + 1, y + 1, w * 0.3, h * 0.3, '#fff8d6'))];
const porthole = (cx, cy, r, frame) => [E(cx, cy, r + 2, r + 2, frame), E(cx, cy, r, r, '#5a4a6a'), F(E(cx, cy + 0.6, r - 1, r - 1.4, '#ffe08a')), F(E(cx - r * 0.35, cy - r * 0.35, r * 0.3, r * 0.3, '#fff8d6'))];

// ---------- Outside ----------
export const HOUSE = {
  poppy: { w: 130, h: 150, door: [54, 76] },
  lark: { w: 92, h: 190, door: [32, 60] },
  rowan: { w: 150, h: 150, door: [56, 94] },
  yuzu: { w: 136, h: 130, door: [52, 84] },
  celeste: { w: 130, h: 168, door: [48, 82] },
  marlowe: { w: 150, h: 120, door: [62, 88] },
};

const EXT = {
  poppy: () => art('swh-poppy', 130, 150, () => {
    const wall = ramp('#fff2e0', 0.6);
    const crust = ramp('#e0a060', 0.85);
    const H = 150;
    const out = [];
    // Walls of cream plaster with a brick foot.
    out.push(R(10, 62, 110, H - 62, wall.base), F(R(100, 62, 20, H - 62, wall.sh)));
    for (let x = 10; x < 120; x += 10) out.push(F(R(x, H - 12, 9, 5, '#e8b8a0')), F(R(x + 5, H - 6, 9, 5, '#e0a890')));
    // The bread-roll roof: a big golden loaf with scored slashes and icing dripping over the edge.
    out.push(E(65, 60, 64, 34, crust.base), F(E(78, 70, 50, 20, crust.sh)), F(E(46, 44, 30, 10, crust.hi)));
    for (const x of [30, 52, 74, 96]) out.push(F(T([[x - 7, 46 + (x - 64) * 0.05], [x + 7, 40 + (x - 64) * 0.05], [x + 8, 43], [x - 6, 49]], '#ffe0a8')));
    out.push(T([[4, 66], [126, 66], [126, 72], [4, 72]], '#fff6ee'));
    for (let x = 6; x < 126; x += 9) out.push(E(x + 4, 72 + (hash(x) * 4), 3.4, 3 + hash(x + 1) * 3, '#fff6ee'));
    for (const [x, c] of [[20, '#ff8a8a'], [44, '#8fd8ff'], [70, GOLD], [98, '#9fe0a0'], [112, '#ff9ec0']]) out.push(F(R(x, 67, 2, 1, c)));
    // Chimney.
    out.push(R(92, 14, 12, 26, '#d98a6a'), F(R(92, 14, 3, 26, '#f2a888')), R(90, 12, 16, 4, '#b8705a'));
    // A striped awning over the shop window.
    for (let k = 0; k < 7; k++) out.push(T([[64 + k * 8, 84], [72 + k * 8, 84], [72 + k * 8, 92], [64 + k * 8, 92]], k % 2 ? WHITE : '#ff9ec0'));
    for (let k = 0; k < 7; k++) out.push(E(68 + k * 8, 92, 4, 2.6, k % 2 ? WHITE : '#ff9ec0'));
    out.push(...win(68, 96, 46, 26, '#ffffff', '#fff3d6'));
    // Cakes in the window.
    out.push(R(74, 112, 10, 8, '#ffc2d4'), R(76, 108, 6, 4, '#fff4ea'), E(79, 107, 1.4, 1.4, '#ff6b8a'), E(96, 116, 6, 4, '#e0a060'), E(106, 116, 4, 3, '#d8904a'));
    // The strawberry door, with a leafy top and a heart window.
    out.push(E(36, 106, 15, 16, '#e5485f'), R(21, 106, 30, H - 106 - 2, '#e5485f'), F(R(21, 106, 4, H - 108, '#ff6b7a')));
    for (const [x, y] of [[28, 112], [42, 110], [34, 124], [44, 130], [28, 134]]) out.push(F(E(x, y, 0.9, 1.3, '#ffe08a')));
    out.push(T([[26, 92], [36, 86], [46, 92], [42, 96], [36, 93], [30, 96]], '#5fbf7a'), E(46, 128, 1.6, 1.6, GOLD));
    return out;
  }, false),
  lark: () => art('swh-lark', 92, 190, () => {
    const wall = ramp('#e8f6ff', 0.6);
    const blue = ramp('#7fb8d8', 0.8);
    const H = 190;
    const out = [];
    // A tall narrow cottage, its walls in sky-blue and white bands.
    out.push(R(14, 56, 64, H - 56, wall.base), F(R(64, 56, 14, H - 56, wall.sh)));
    for (let y = 70; y < H - 10; y += 28) out.push(F(R(14, y, 64, 9, blue.base)), F(R(64, y, 14, 9, blue.sh)));
    // A pointed blue roof, and the little lamp tower on top.
    out.push(T([[6, 60], [46, 26], [86, 60]], blue.sh), F(T([[46, 26], [86, 60], [46, 60]], mix(blue.sh, '#4a6aa8', 0.4))), F(T([[10, 58], [46, 30], [30, 50]], blue.base)));
    out.push(R(38, 10, 16, 18, WHITE), R(36, 6, 20, 4, '#4a6aa8'), R(40, 12, 12, 12, '#ffe08a'), F(R(42, 13, 4, 10, '#fff8d6')), T([[34, 6], [46, -2], [58, 6]], '#4a6aa8'));
    // Portholes up the side, the door with a lifebuoy over it, poems pinned by the door.
    out.push(...porthole(46, 84, 8, WHITE), ...porthole(46, 124, 7, WHITE));
    out.push(R(30, 146, 30, H - 148, '#4a6aa8'), F(R(30, 146, 30, 3, '#6a8ac8')), E(54, 168, 1.6, 1.6, GOLD));
    out.push(E(45, 140, 7, 7, '#ff8a8a'), E(45, 140, 4, 4, wall.base), ...[0, 1, 2, 3].map((i) => F(R(45 + Math.cos(i * 1.57) * 5.5 - 1, 140 + Math.sin(i * 1.57) * 5.5 - 1, 2, 2, WHITE))));
    for (const [x, y] of [[66, 150], [70, 160], [64, 166]]) out.push(R(x, y, 8, 6, '#fffaf0'), F(R(x + 1, y + 1.5, 6, 0.6, '#a8a0c0')), F(R(x + 1, y + 3, 4, 0.6, '#a8a0c0')));
    return out;
  }, false),
  rowan: () => art('swh-rowan', 150, 150, () => {
    const stone = ramp('#d8d0c8', 0.7);
    const wd = ramp('#b8865a', 0.8);
    const roof = ramp('#8fb8e8', 0.8);
    const H = 150;
    const out = [];
    // Stone footing and timber-framed upper walls.
    out.push(...stones(6, 96, 138, H - 96, stone, 31));
    out.push(R(8, 50, 134, 48, '#fff4e6'), F(R(118, 50, 24, 48, '#f2e2d0')));
    for (const x of [8, 40, 74, 108, 138]) out.push(R(x, 50, 4, 48, wd.base));
    out.push(R(8, 50, 134, 4, wd.base), R(8, 72, 134, 3, wd.sh), F(T([[12, 54], [38, 72], [40, 70], [14, 52]], wd.sh)), F(T([[112, 54], [138, 72], [136, 74], [110, 56]], wd.sh)));
    // A steep slate roof in soft blue.
    out.push(T([[0, 54], [75, 4], [150, 54]], roof.base), F(T([[75, 4], [150, 54], [75, 54]], roof.sh)));
    for (let y = 16; y < 54; y += 8) out.push(F(R(75 - (y - 4) * 1.5 + 4, y, (y - 4) * 3 - 8, 0.8, roof.sh)));
    // The shield crest over the door, a banner, the extra-tall door.
    out.push(T([[64, 58], [86, 58], [86, 70], [75, 78], [64, 70]], '#5fb8d8'), F(T([[64, 58], [75, 58], [75, 78], [64, 70]], '#7fd0e8')), star(75, 66, 4, GOLD));
    out.push(R(56, 84, 38, H - 86, wd.sh), R(58, 86, 34, H - 88, wd.base), F(R(74.5, 86, 1, H - 88, wd.sh)), ...[96, 116, 136].map((y) => F(R(58, y, 34, 1.4, '#8a6a4a'))), E(88, 120, 2, 2, GOLD));
    // Window boxes overflowing with daisies.
    for (const wx of [18, 110]) {
      out.push(...win(wx, 58, 22, 16, wd.base));
      out.push(R(wx - 3, 76, 28, 6, wd.base));
      for (let i = 0; i < 6; i++) out.push(E(wx - 1 + i * 4.6, 75 - (i % 2) * 2, 2.2, 2.2, WHITE), F(E(wx - 1 + i * 4.6, 75 - (i % 2) * 2, 0.8, 0.8, GOLD)));
    }
    return out;
  }, false),
  yuzu: () => art('swh-yuzu', 136, 130, () => {
    const red = ramp('#e5485f', 0.8);
    const wall = ramp('#fff4e8', 0.6);
    const wd = ramp('#a8705a', 0.8);
    const H = 130;
    const out = [];
    // Raised on a wooden platform with steps.
    out.push(R(12, H - 16, 112, 14, wd.base), F(R(12, H - 16, 112, 3, wd.hi)), R(54, H - 4, 28, 4, wd.sh));
    for (const x of [16, 120]) out.push(R(x - 2, 52, 6, H - 66, red.base));
    // Shoji walls.
    out.push(R(20, 56, 96, H - 72, wall.base));
    for (let x = 20; x < 116; x += 12) out.push(F(R(x, 56, 1, H - 72, '#c8a888')));
    for (let y = 64; y < H - 16; y += 10) out.push(F(R(20, y, 96, 1, '#c8a888')));
    // The round moon window and the sliding door.
    out.push(E(36, 80, 13, 13, wd.sh), E(36, 80, 11, 11, '#5a4a6a'), F(E(36, 81, 10, 9, '#ffe8a0')), F(E(32, 76, 3, 3, '#fff8d6')));
    out.push(R(52, 74, 32, H - 90, '#fff8f0'), F(R(67.5, 74, 1, H - 90, '#c8a888')), ...[84, 94, 104].map((y) => F(R(52, y, 32, 0.8, '#c8a888'))));
    // The curved red roof, upturned at the ends, two tiers.
    out.push(T([[0, 54], [18, 46], [118, 46], [136, 54], [126, 58], [10, 58]], red.base), F(T([[10, 56], [126, 56], [126, 58], [10, 58]], red.sh)));
    out.push(T([[20, 46], [34, 26], [102, 26], [116, 46]], red.base), F(T([[68, 26], [102, 26], [116, 46], [68, 46]], red.sh)), T([[28, 28], [68, 10], [108, 28]], red.base), F(T([[68, 10], [108, 28], [68, 28]], red.sh)));
    out.push(E(68, 9, 3, 3, GOLD));
    return out;
  }, false),
  celeste: () => art('swh-celeste', 130, 168, () => {
    const wall = ramp('#4a4aa8', 0.75);
    const dome = ramp('#c8c8e8', 0.7);
    const H = 168;
    const out = [];
    // Indigo walls scattered with little stars.
    out.push(R(12, 70, 106, H - 70, wall.base), F(R(98, 70, 20, H - 70, wall.sh)));
    for (let i = 0; i < 14; i++) out.push(F(star(18 + hash(i * 3.1) * 94, 76 + hash(i * 7.7) * (H - 90), 1 + hash(i) * 1.2, i % 3 ? '#c8c8ff' : GOLD)));
    // A silver dome with its slit.
    out.push(E(65, 72, 56, 50, dome.base), F(E(80, 82, 40, 34, dome.sh)), F(E(46, 52, 18, 12, '#f2f2ff')));
    out.push(R(6, 68, 118, 8, '#8f8fc8'), F(R(6, 68, 118, 2, '#c8c8ff')));
    out.push(T([[60, 24], [72, 24], [72, 70], [60, 70]], '#2f2f68'));
    // Round window, crescent-moon door.
    out.push(...porthole(96, 100, 9, '#c8c8ff'));
    out.push(E(48, 128, 18, 20, '#2f2f68'), R(30, 128, 36, H - 130, '#2f2f68'), E(48, 128, 16, 18, '#5f5fb8'), R(32, 128, 32, H - 130, '#5f5fb8'));
    out.push(T([[40, 112], [52, 108], [58, 118], [52, 128], [44, 130], [50, 122], [50, 114]], GOLD), E(60, 146, 1.6, 1.6, GOLD));
    return out;
  }, false),
  marlowe: () => art('swh-marlowe', 150, 120, () => {
    const hull = ramp('#ff8a8a', 0.8);
    const wd = ramp(WOOD, 0.8);
    const H = 120;
    const out = [];
    // The cabin: planks under the hull.
    out.push(...planks(14, 48, 122, H - 48, wd, 7, 9));
    // The upturned boat for a roof: its hull curving over, a white stripe, the keel on top.
    out.push(T([[2, 52], [10, 30], [30, 16], [120, 16], [140, 30], [148, 52]], hull.base), F(T([[2, 52], [148, 52], [144, 42], [6, 42]], hull.sh)), F(R(12, 26, 126, 4, WHITE)), R(20, 12, 110, 5, wd.sh));
    // The mast as the flagpole, set in the keel.
    out.push(R(104, -6, 3, 20, wd.base));
    // Portholes and the door with a rope frame.
    out.push(...porthole(36, 74, 8, '#c8902a'), ...porthole(114, 74, 8, '#c8902a'));
    out.push(R(60, 62, 30, H - 64, '#5a3a2a'), R(62, 64, 26, H - 66, wd.base), F(R(75, 64, 1, H - 66, wd.sh)), E(84, 92, 1.8, 1.8, GOLD));
    for (let i = 0; i < 10; i++) out.push(F(E(58 + (i < 5 ? 0 : 34), 64 + (i % 5) * 11, 1.6, 1.6, '#e8c890')));
    // An anchor leaning by the door.
    out.push(R(100, 88, 3, 24, '#8a92a8'), T([[92, 108], [111, 108], [101.5, 116]], '#8a92a8'), E(101.5, 86, 3, 3, '#8a92a8'), E(101.5, 86, 1.6, 1.6, wd.base), R(96, 92, 11, 2, '#8a92a8'));
    return out;
  }, false),
};

// ---------- Inside ----------
// A room's picture runs from its ceiling down past the bottom of the view, so the floor you walk on
// (at y 360) is the room's own painted floor all the way down (the map draws no ground of its own:
// `look.floor: 'painted'`).
export const ROOM_H = 480;

// A rug on the floor (where you walk), round and soft, with a border.
const rug = (cx, c, trim) => [E(cx, 354, 124, 16, mix(c, '#5a4a6a', 0.25)), E(cx, 353, 120, 14, c), E(cx, 353, 100, 10, trim), E(cx, 353, 92, 8, c)];

// A room's door out (its style is the house's own), with its mat.
function door(x, w, h, c, trim, kind) {
  const top = 300 - h;
  const l = x - w / 2;
  const out = [R(l - 5, top + w / 2 - 2, w + 10, h - w / 2 + 2, mix(c, '#3a2a3a', 0.4)), E(x, top + w / 2, w / 2 + 5, w / 2 + 5, mix(c, '#3a2a3a', 0.4))];
  out.push(R(l, top + w / 2, w, h - w / 2, c), E(x, top + w / 2, w / 2, w / 2, c), F(R(l, top + w / 2, 4, h - w / 2, mix(c, WHITE, 0.3))));
  if (kind === 'heart') out.push(E(x - 5, top + 30, 6, 6, trim), E(x + 5, top + 30, 6, 6, trim), T([[x - 11, top + 32], [x + 11, top + 32], [x, top + 44]], trim));
  if (kind === 'porthole') out.push(E(x, top + 30, 11, 11, trim), E(x, top + 30, 8, 8, '#9fd8ff'), F(E(x - 3, top + 27, 3, 3, WHITE)));
  if (kind === 'bands') for (const y of [top + 50, top + 100]) out.push(R(l, y, w, 6, trim), E(l + 8, y + 3, 2, 2, '#9a9aaa'), E(l + w - 8, y + 3, 2, 2, '#9a9aaa'));
  if (kind === 'shoji') for (let i = 1; i < 4; i++) for (let j = 0; j < 5; j++) out.push(R(l + 4 + (i - 1) * ((w - 8) / 3) + 1, top + w / 2 + 6 + j * ((h - w / 2 - 12) / 5), (w - 8) / 3 - 2, (h - w / 2 - 12) / 5 - 2, trim));
  if (kind === 'moon') out.push(E(x, top + 32, 12, 12, trim), E(x + 5, top + 29, 10, 10, c));
  out.push(E(x + w / 2 - 8, top + h * 0.6, 3, 3, GOLD), R(l - 6, 298, w + 12, 6, mix(c, '#fff8f0', 0.5)));
  return out;
}
const ROOM = {
  poppy: () => art('swr-poppy', 640, ROOM_H, () => {
    const out = [R(0, 0, 640, 300, '#ffe8ee')];
    // Pink-and-cream striped wallpaper, a checkered floor.
    for (let x = 0; x < 640; x += 32) out.push(F(R(x, 0, 16, 300, '#fff4f6')));
    for (let x = 0; x < 640; x += 40) for (let y = 300; y < ROOM_H; y += 20) out.push(R(x + ((y / 20) % 2) * 20, y, 20, 20, '#ff9ec0'), R(x + (1 - (y / 20) % 2) * 20, y, 20, 20, '#fff6ee'));
    out.push(R(0, 296, 640, 6, '#e8b8a0'));
    // The big brick oven, its mouth glowing.
    out.push(...stones(40, 140, 150, 160, ramp('#d98a6a', 0.8), 11), E(115, 220, 40, 34, '#3a2420'), E(115, 228, 34, 22, '#ff8a3a'), F(E(115, 232, 26, 14, '#ffd36b')), R(60, 136, 110, 8, '#b8705a'));
    // Shelves of jars and a row of copper pans hung on hooks.
    for (const sy of [90, 150]) {
      out.push(R(240, sy, 160, 6, '#c89a6a'));
      for (let i = 0; i < 6; i++) out.push(R(248 + i * 25, sy - 22, 16, 22, ['#ffe08a', '#ff9ec0', '#9fe0a0', '#fff4ea', '#e0a060', '#c8c8ff'][i]), F(R(248 + i * 25, sy - 24, 16, 4, '#fff6ee')), F(R(250 + i * 25, sy - 18, 3, 14, '#ffffff')));
    }
    for (let i = 0; i < 4; i++) out.push(R(450 + i * 36, 40, 2, 30, '#8a6a4a'), E(451 + i * 36, 82, 14 - i, 12 - i, '#d9905a'), F(E(447 + i * 36, 78, 6, 4, '#ffc890')));
    // A table of cakes.
    out.push(R(390, 250, 170, 8, '#c89a6a'), R(400, 258, 8, 42, '#a8805a'), R(542, 258, 8, 42, '#a8805a'));
    out.push(R(410, 220, 30, 30, '#fff4ea'), R(415, 205, 20, 15, '#ffc2d4'), E(425, 202, 3, 3, '#ff6b8a'), E(480, 244, 18, 6, '#e8e0f0'), E(480, 236, 14, 9, '#e0a060'), R(515, 226, 30, 24, '#ffd2e0'), F(R(515, 226, 30, 4, '#ffffff')));
    // A window with a flower box.
    out.push(...win(260, 190, 90, 60, WHITE, '#bfe8ff'), R(254, 252, 102, 8, '#ff9ec0'), ...[0, 1, 2, 3, 4, 5].map((i) => E(264 + i * 16, 248, 5, 5, ['#ff6b8a', '#ffe36b', '#ffffff'][i % 3])));
    // A flour sack by the oven, a round pink rug, and her strawberry door.
    out.push(E(212, 284, 18, 16, '#f6ecd8'), R(200, 268, 24, 6, '#e8dcc0'), F(E(206, 280, 6, 6, WHITE)), E(214, 288, 4, 3.4, '#ff8fae'));
    out.push(...rug(320, '#ff9ec0', '#fff3f6'), ...door(608, 48, 104, '#e5485f', WHITE, 'heart'));
    return out;
  }, false),
  lark: () => art('swr-lark', 640, ROOM_H, () => {
    const out = [R(0, 0, 640, 300, '#e8f2fa')];
    for (let x = 0; x < 640; x += 22) out.push(F(R(x, 0, 1.2, 300, '#c8dceb')));
    out.push(...planks(0, 300, 640, ROOM_H - 300, ramp('#a8c0d0', 0.8), 16, 3));
    // Bookshelves stuffed full, floor to beam.
    for (const bx of [20, 480]) {
      out.push(R(bx, 40, 140, 260, '#a8805a'), R(bx + 6, 46, 128, 250, '#7a5a42'));
      for (let row = 0; row < 5; row++) {
        out.push(R(bx + 6, 90 + row * 50, 128, 5, '#a8805a'));
        for (let i = 0; i < 9; i++) out.push(R(bx + 9 + i * 14, 52 + row * 50 + (i % 3), 11, 38 - (i % 3), ['#5a7ab8', '#ff9ec0', '#9fe0a0', '#ffe08a', '#c8a8ff', '#ff8a6a'][(i + row) % 6]));
      }
    }
    // The writing desk, papers, an inkpot and quill.
    out.push(R(220, 236, 200, 10, '#c89a6a'), R(230, 246, 10, 54, '#a8805a'), R(400, 246, 10, 54, '#a8805a'));
    for (let i = 0; i < 5; i++) out.push(R(250 + i * 12, 226 - i * 2, 40, 10, '#fffaf0'));
    out.push(R(350, 220, 12, 16, '#2a3a6a'), T([[356, 222], [372, 190], [374, 192], [359, 222]], WHITE));
    // The round sea window (the beam sweeps past it).
    out.push(E(320, 120, 60, 60, WHITE), E(320, 120, 52, 52, '#9fd8ff'), F(E(320, 140, 52, 20, '#5fb8d8')), F(E(320, 148, 52, 10, '#4fa0c8')));
    // Crumpled drafts round the desk, a little lamp, a sea-blue rug, and her porthole door.
    for (const [x, y] of [[214, 292], [246, 296], [428, 294], [200, 298]]) out.push(E(x, y, 6, 5, '#fffaf0'), F(E(x - 1, y - 1, 2, 2, '#e8e0d0')));
    out.push(R(392, 196, 3, 40, '#8a6a4a'), E(393, 194, 12, 8, '#ffe08a'), F(E(390, 192, 4, 3, '#fff8d6')));
    out.push(...rug(320, '#5fb8d8', '#e8f6ff'), ...door(450, 44, 100, '#5f8fd8', WHITE, 'porthole'));
    return out;
  }, false),
  rowan: () => art('swr-rowan', 640, ROOM_H, () => {
    const out = [R(0, 0, 640, 300, '#f2e6d6')];
    out.push(...stones(0, 180, 640, 120, ramp('#d8d0c8', 0.7), 41));
    out.push(...planks(0, 300, 640, ROOM_H - 300, ramp('#b8865a', 0.8), 14, 7));
    // A great stone fireplace, the kettle (a bit scorched) on its hook.
    out.push(...stones(240, 120, 160, 180, ramp('#c8c0b8', 0.75), 5), R(270, 190, 100, 110, '#3a2420'), E(320, 280, 40, 14, '#ff8a3a'), R(230, 112, 180, 12, '#a8805a'));
    out.push(R(319, 190, 2, 40, '#5a5a6a'), E(320, 240, 14, 11, '#3a3a4a'), F(E(316, 236, 5, 3, '#5a5a6a')));
    // Shields on the wall, an armour stand, a giant chair.
    for (const [x, c] of [[90, '#5fb8d8'], [150, '#ff8a8a'], [500, '#9fe0a0'], [560, '#ffe08a']]) out.push(T([[x - 20, 60], [x + 20, 60], [x + 20, 90], [x, 110], [x - 20, 90]], c), F(T([[x - 20, 60], [x, 60], [x, 110], [x - 20, 90]], mix(c, WHITE, 0.3))), star(x, 82, 6, GOLD));
    out.push(R(80, 200, 6, 100, '#8a6a4a'), E(83, 150, 22, 26, '#dfe6f2'), F(E(76, 142, 8, 6, WHITE)), E(83, 118, 13, 12, '#dfe6f2'), R(56, 170, 54, 8, '#b8c4d8'));
    out.push(R(440, 210, 100, 14, '#a8805a'), R(440, 130, 14, 90, '#a8805a'), R(526, 130, 14, 90, '#a8805a'), R(440, 130, 100, 12, '#a8805a'), R(446, 224, 10, 76, '#8a6a4a'), R(524, 224, 10, 76, '#8a6a4a'), E(490, 204, 44, 8, '#8fb8e8'));
    // Daisies everywhere, in pots, jars and an upturned helmet.
    for (const [x, y] of [[180, 282], [212, 290], [420, 286], [562, 284], [30, 286]]) {
      out.push(R(x - 8, y, 16, 14, '#d98a6a'));
      for (let i = 0; i < 5; i++) out.push(E(x - 8 + i * 4, y - 6 - (i % 2) * 4, 2.6, 2.6, WHITE), F(E(x - 8 + i * 4, y - 6 - (i % 2) * 4, 1, 1, GOLD)));
    }
    // Blue banners with his star, a round rug, and the extra-tall door a giant needs.
    for (const x of [200, 425]) out.push(R(x - 2, 128, 4, 6, '#8a6a4a'), T([[x - 16, 134], [x + 16, 134], [x + 16, 176], [x, 186], [x - 16, 176]], '#5f8fd8'), F(T([[x - 16, 134], [x - 8, 134], [x - 8, 182], [x - 16, 176]], '#8fb8e8')), star(x, 156, 6, GOLD));
    out.push(...rug(320, '#8fb8e8', '#f2f6ff'), ...door(605, 56, 140, '#a8805a', '#5a5a6a', 'bands'));
    return out;
  }, false),
  yuzu: () => art('swr-yuzu', 640, ROOM_H, () => {
    const out = [R(0, 0, 640, 300, '#fff4e8')];
    // Shoji walls, tatami floor.
    for (let x = 0; x < 640; x += 40) out.push(R(x, 0, 3, 300, '#c8a888'));
    for (let y = 0; y < 300; y += 30) out.push(F(R(0, y, 640, 2, '#d8c0a0')));
    for (let x = 0; x < 640; x += 120) out.push(R(x, 300, 118, ROOM_H - 300, '#d8e0a0'), F(R(x, 300, 118, 4, '#5a8a4a')), F(R(x + 58, 304, 2, ROOM_H - 304, '#c8d090')));
    // A low table with tea, cushions round it.
    out.push(R(230, 262, 180, 10, '#a8503a'), R(240, 272, 10, 28, '#8a3a2a'), R(390, 272, 10, 28, '#8a3a2a'), E(300, 258, 14, 6, WHITE), E(340, 256, 8, 6, '#9fe0a0'), E(200, 300, 30, 8, '#ff8a6a'), E(440, 300, 30, 8, '#ff8a6a'));
    // Fox masks hung on the wall.
    for (const [x, c] of [[90, '#e5485f'], [150, '#ffb03a'], [490, '#8fc8ff'], [550, '#e5485f']]) out.push(E(x, 110, 18, 20, WHITE), T([[x - 16, 96], [x - 12, 76], [x - 4, 94]], WHITE), T([[x + 4, 94], [x + 12, 76], [x + 16, 96]], WHITE), F(T([[x - 10, 106], [x - 2, 110], [x - 10, 112]], c)), F(T([[x + 10, 106], [x + 2, 110], [x + 10, 112]], c)), F(E(x, 122, 2, 1.4, c)));
    // A pile of "borrowed" teacups in the corner.
    for (let i = 0; i < 9; i++) out.push(E(570 + (i % 4) * 14 + (Math.floor(i / 4) % 2) * 7, 292 - Math.floor(i / 4) * 10, 7, 5, ['#ffffff', '#c8e8ff', '#ffd2e0', '#e8f8d8'][i % 4]));
    // A little shrine shelf with a fox and an offering, paper charms, a futon rolled up, and the
    // sliding shoji door.
    out.push(R(270, 100, 100, 8, '#a8503a'), R(282, 74, 4, 26, '#e5485f'), R(354, 74, 4, 26, '#e5485f'), R(276, 72, 88, 5, '#e5485f'), F(R(276, 72, 88, 2, '#ff8a8a')));
    out.push(E(320, 92, 8, 8, WHITE), T([[313, 88], [315, 78], [319, 86]], WHITE), T([[321, 86], [325, 78], [327, 88]], WHITE), E(340, 96, 6, 4, '#e0a060'));
    for (const x of [200, 216, 440, 456]) out.push(R(x, 150, 10, 34, '#fff8e8'), F(R(x + 2, 156, 6, 2, '#e5485f')), F(R(x + 4, 162, 2, 16, '#e5485f')));
    out.push(E(530, 286, 26, 14, '#ffd2e0'), F(E(530, 286, 16, 9, '#ffc2d4')), F(E(530, 286, 6, 4, '#ff9ec0')));
    out.push(...door(60, 52, 120, '#a8503a', '#fff8e8', 'shoji'));
    return out;
  }, false),
  celeste: () => art('swr-celeste', 640, ROOM_H, () => {
    const out = [R(0, 0, 640, 300, '#2f2f68')];
    // The ceiling a star map, constellations drawn in gold.
    for (let i = 0; i < 60; i++) out.push(F(star(hash(i * 1.3) * 640, hash(i * 2.7) * 200, 1 + hash(i) * 2, i % 4 ? '#c8c8ff' : GOLD)));
    out.push(...planks(0, 300, 640, ROOM_H - 300, ramp('#5f5fb8', 0.8), 16, 4));
    // The big telescope on its mount, aimed at the slit in the dome.
    out.push(R(300, 220, 40, 80, '#8a6a4a'), R(290, 296, 60, 6, '#6a4a3a'));
    // A bed with moon pillows and a starry quilt.
    out.push(R(60, 250, 180, 30, '#8f7fe0'), R(60, 280, 180, 20, '#5f5fb8'), R(52, 210, 12, 90, '#c8c8e8'), R(236, 236, 12, 64, '#c8c8e8'));
    out.push(E(96, 246, 24, 12, '#fff3b0'), E(102, 242, 16, 10, '#8f7fe0'), E(150, 248, 18, 10, '#fff3b0'));
    for (let i = 0; i < 7; i++) out.push(F(star(110 + i * 18, 266 + (i % 2) * 6, 3, GOLD)));
    // Bookshelf of star books, a globe.
    out.push(R(470, 160, 140, 140, '#4a3a6a'));
    for (let row = 0; row < 3; row++) for (let i = 0; i < 8; i++) out.push(R(478 + i * 16, 170 + row * 44, 12, 34, ['#c8c8ff', '#ffe08a', '#8fd8ff', '#ff9ec0'][(i + row) % 4]));
    // Star charts pinned up, a globe on her shelf, a crescent rug, and her moon door.
    for (const [x, y] of [[100, 70], [190, 100]]) {
      out.push(R(x, y, 70, 54, '#f2eeff'), F(R(x, y, 70, 3, '#c8c8e8')));
      const pts = [[x + 10, y + 40], [x + 24, y + 18], [x + 40, y + 30], [x + 58, y + 12]];
      for (let i = 0; i < pts.length - 1; i++) out.push(T([pts[i], pts[i + 1], [pts[i + 1][0], pts[i + 1][1] + 1.4], [pts[i][0], pts[i][1] + 1.4]], '#8f8fc8'));
      for (const [px, py] of pts) out.push(star(px, py, 3, GOLD));
    }
    out.push(R(530, 150, 20, 10, '#c8902a'), E(540, 134, 16, 16, '#8fd8ff'), F(E(536, 130, 7, 9, '#9fe0a0')), F(E(546, 140, 4, 5, '#9fe0a0')));
    out.push(...rug(250, '#8f7fe0', '#c8c8ff'), ...door(420, 44, 104, '#4a4aa8', GOLD, 'moon'));
    return out;
  }, false),
  marlowe: () => art('swr-marlowe', 640, ROOM_H, () => {
    const out = [R(0, 0, 640, 300, '#d8a878')];
    // Curved ship's planking, ribs, a deck floor.
    for (let y = 0; y < 300; y += 18) out.push(F(R(0, y, 640, 1.4, '#b8865a')));
    for (const x of [60, 220, 420, 580]) out.push(R(x - 6, 0, 12, 300, '#a8704a'), F(R(x - 6, 0, 3, 300, '#c88a5a')));
    out.push(...planks(0, 300, 640, ROOM_H - 300, ramp('#c89a6a', 0.8), 16, 8));
    // Sea charts on the wall, the ship's wheel.
    for (const [x, y, w, h] of [[90, 60, 110, 80], [440, 50, 120, 90]]) out.push(R(x, y, w, h, '#f6e8c8'), F(R(x + 8, y + 10, w - 16, 1, '#a8805a')), F(E(x + w * 0.4, y + h * 0.5, w * 0.2, h * 0.2, '#9fd8ff')), F(T([[x + w * 0.6, y + h * 0.3], [x + w * 0.7, y + h * 0.4], [x + w * 0.62, y + h * 0.45]], '#e5485f')));
    out.push(E(320, 190, 46, 46, '#8a5a3a'), E(320, 190, 38, 38, '#d8a878'), E(320, 190, 10, 10, '#8a5a3a'));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      out.push(T([[320 + Math.cos(a) * 8, 190 + Math.sin(a) * 8], [320 + Math.cos(a + 0.1) * 58, 190 + Math.sin(a + 0.1) * 58], [320 + Math.cos(a - 0.1) * 58, 190 + Math.sin(a - 0.1) * 58]], '#8a5a3a'), E(320 + Math.cos(a) * 58, 190 + Math.sin(a) * 58, 5, 5, '#a8704a'));
    }
    // A treasure chest and bottles with ships inside.
    out.push(R(470, 250, 80, 50, '#8a5a3a'), E(510, 250, 40, 16, '#a8704a'), R(470, 262, 80, 4, GOLD), R(504, 260, 12, 12, GOLD));
    for (let i = 0; i < 4; i++) out.push(R(90 + i * 34, 252, 20, 34, '#c8f0e8'), F(R(94 + i * 34, 270, 12, 8, '#ff8a8a')), R(96 + i * 34, 244, 8, 8, '#a8805a'));
    // A fishing net draped in the corner with a starfish caught in it, a compass-rose rug, and the
    // round-topped hatch out.
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) out.push(F(R(i * 14, j * 14, 14, 1.2, '#f6e8c8')), F(R(i * 14, j * 14, 1.2, 14, '#f6e8c8')));
    out.push(star(46, 30, 6, '#ff9e7a'));
    out.push(...rug(320, '#2f5fb8', '#f6e8c8'), star(320, 355, 8, GOLD), ...door(605, 46, 108, '#8a5a3a', GOLD, 'porthole'));
    return out;
  }, false),
};

// The house's door, relative to where it's drawn (for the map's door portal).
export const doorOf = (id) => HOUSE[id];

export function drawSweetHouse(ctx, map, kind, wx, extra, cam, width, time) {
  if (!kind.startsWith('swhouse_') && !kind.startsWith('swroom_')) return false;
  const id = kind.split('_')[1];
  const x = wx - cam.x;
  const night = map.night ?? 0;
  if (kind.startsWith('swroom_')) {
    place(ctx, ROOM[id](), Math.round(x), Math.round(ROOM_H - cam.y));
    roomLife(ctx, id, x - 320, 360 - cam.y - 360, time);
    return true;
  }
  if (x < -200 || x > width + 200) return true;
  const gy = groundAt(map, wx) - cam.y;
  const s = EXT[id]();
  place(ctx, s, Math.round(x), Math.round(gy + 2));
  const left = x - s.w / 2;
  const top = gy + 2 - s.h;
  switch (id) {
    case 'poppy':
      puffs(ctx, left + 98, top + 10, time, wx * 0.01);
      glow(ctx, left + 91, top + 108, 26, '#ffe08a', 0.15 + night * 0.5);
      break;
    case 'lark': {
      // Her lamp glows; at night it beams out to sea, sweeping slowly.
      glow(ctx, left + 46, top + 18, 18, '#fff3a6', 0.35 + night * 0.4);
      if (night > 0.2) {
        const a = Math.sin(time * 0.6) * 0.8 + Math.PI;
        ctx.save();
        ctx.globalAlpha = night * 0.5;
        ctx.translate(left + 46, top + 18);
        ctx.rotate(a);
        const g = ctx.createLinearGradient(0, 0, 160, 0);
        g.addColorStop(0, 'rgba(255,243,166,0.6)');
        g.addColorStop(1, 'rgba(255,243,166,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(160, -18);
        ctx.lineTo(160, 18);
        ctx.lineTo(0, 2);
        ctx.fill();
        ctx.restore();
      }
      // The wind chime swaying.
      for (let k = 0; k < 3; k++) {
        const sw = Math.sin(time * 2 + k) * 2;
        ctx.fillStyle = ['#ffd2e0', '#c8e8ff', '#fff0b0'][k];
        ctx.fillRect(Math.round(left + 18 + k * 4 + sw), Math.round(top + 152 + k * 3), 2, 6);
      }
      break;
    }
    case 'rowan': {
      // A banner stirring off the roof's peak.
      ctx.fillStyle = '#5fb8d8';
      ctx.beginPath();
      ctx.moveTo(left + 75, top + 2);
      for (let i = 0; i <= 6; i++) ctx.lineTo(left + 75 + i * 4, top - 12 + Math.sin(time * 3 + i * 0.6) * 1.6 * (i / 6));
      for (let i = 6; i >= 0; i--) ctx.lineTo(left + 75 + i * 4, top - 4 + Math.sin(time * 3 + i * 0.6) * 1.6 * (i / 6));
      ctx.fill();
      ctx.fillStyle = '#8a6a4a';
      ctx.fillRect(Math.round(left + 74), Math.round(top - 14), 2, 18);
      glow(ctx, left + 29, top + 66, 18, '#ffe08a', night * 0.5);
      glow(ctx, left + 121, top + 66, 18, '#ffe08a', night * 0.5);
      break;
    }
    case 'yuzu': {
      // Two paper lanterns swaying from the eaves, glowing; the fox-tail weathervane turning.
      for (const lx of [left + 14, left + 122]) {
        const sw = Math.sin(time * 1.6 + lx) * 0.12;
        ctx.save();
        ctx.translate(lx, top + 58);
        ctx.rotate(sw);
        ctx.fillStyle = '#5a4a6a';
        ctx.fillRect(-0.5, 0, 1, 6);
        ctx.fillStyle = '#ff7a4a';
        ctx.beginPath();
        ctx.ellipse(0, 12, 6, 7, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffd36b';
        ctx.fillRect(-5, 11, 10, 1.4);
        ctx.restore();
        glow(ctx, lx, top + 70, 14, '#ffb070', 0.25 + night * 0.5);
      }
      const v = Math.sin(time * 0.7 + wx) * 0.5;
      ctx.save();
      ctx.translate(left + 68, top + 6);
      ctx.scale(Math.cos(v) >= 0 ? 1 : -1, 1);
      ctx.fillStyle = '#ff9a4f';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(10, -10, 16, -2);
      ctx.quadraticCurveTo(10, -4, 4, 2);
      ctx.fill();
      ctx.fillStyle = '#fff4e0';
      ctx.beginPath();
      ctx.arc(15, -2, 2, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'celeste': {
      // The telescope poking from the dome's slit, turning slowly to follow the stars.
      const a = -1.2 + Math.sin(time * 0.15 + wx) * 0.3;
      ctx.save();
      ctx.translate(left + 66, top + 40);
      ctx.rotate(a);
      ctx.fillStyle = '#e0b060';
      ctx.fillRect(-4, -4, 40, 8);
      ctx.fillStyle = '#ffe08a';
      ctx.fillRect(-4, -4, 40, 2);
      ctx.fillStyle = '#8a5a1a';
      ctx.fillRect(34, -5, 4, 10);
      ctx.restore();
      glow(ctx, left + 96, top + 100, 18, '#c8c8ff', 0.2 + night * 0.5);
      break;
    }
    case 'marlowe': {
      // A flag flying off the mast, gulls' favourite perch.
      ctx.fillStyle = '#2f5fb8';
      ctx.beginPath();
      ctx.moveTo(left + 107, top - 6);
      for (let i = 0; i <= 6; i++) ctx.lineTo(left + 107 + i * 3, top - 6 + Math.sin(time * 3.4 + i * 0.7) * 1.4 * (i / 6));
      for (let i = 6; i >= 0; i--) ctx.lineTo(left + 107 + i * 3, top + 3 + Math.sin(time * 3.4 + i * 0.7) * 1.4 * (i / 6));
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.fillRect(Math.round(left + 113), Math.round(top - 3), 4, 3);
      glow(ctx, left + 36, top + 74, 14, '#ffe08a', night * 0.5);
      glow(ctx, left + 114, top + 74, 14, '#ffe08a', night * 0.5);
      // The rope ladder down the side, swaying.
      ctx.strokeStyle = '#e8c890';
      ctx.lineWidth = 1;
      const sw = Math.sin(time * 1.4) * 1.5;
      for (const dx of [140, 146]) {
        ctx.beginPath();
        ctx.moveTo(left + dx, top + 30);
        ctx.lineTo(left + dx + sw, top + 100);
        ctx.stroke();
      }
      for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(left + 140 + sw * (i / 6)), Math.round(top + 38 + i * 11), 6, 1.4);
      break;
    }
    default:
  }
  return true;
}

// Each room's moving parts.
function roomLife(ctx, id, ox, oy, time) {
  switch (id) {
    case 'poppy': {
      // The oven's fire flickering, steam off a fresh tray.
      const f = 0.6 + 0.4 * Math.sin(time * 9) * Math.sin(time * 5.3);
      glow(ctx, ox + 115, oy + 230, 50, '#ffb03a', 0.35 + f * 0.25);
      puffs(ctx, ox + 430, oy + 200, time, 0.3, 3);
      break;
    }
    case 'lark': {
      // The lighthouse beam sweeping past her round window; a paper crane turning on its thread.
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
      for (const [cx, len] of [[200, 60], [440, 80]]) {
        const a = Math.sin(time * 0.8 + cx);
        ctx.strokeStyle = '#a8a0c0';
        ctx.beginPath();
        ctx.moveTo(ox + cx, oy);
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
        ctx.restore();
      }
      break;
    }
    case 'rowan': {
      // The fire crackling and smoke going up the chimney.
      const f = 0.6 + 0.4 * Math.sin(time * 8) * Math.sin(time * 4.1);
      glow(ctx, ox + 320, oy + 270, 60, '#ffb03a', 0.3 + f * 0.3);
      for (let i = 0; i < 5; i++) {
        const k = (time * 1.4 + i / 5) % 1;
        ctx.fillStyle = `rgba(255,${180 + k * 60},80,${1 - k})`;
        ctx.beginPath();
        ctx.ellipse(ox + 300 + i * 10, oy + 280 - k * 50, 6 * (1 - k), 10 * (1 - k), 0, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'yuzu': {
      // Paper lanterns swaying over the table, glowing.
      for (const lx of [228, 412]) {
        const sw = Math.sin(time * 1.3 + lx) * 0.1;
        ctx.save();
        ctx.translate(ox + lx, oy);
        ctx.rotate(sw);
        ctx.strokeStyle = '#5a4a6a';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 90);
        ctx.stroke();
        ctx.fillStyle = '#ff7a4a';
        ctx.beginPath();
        ctx.ellipse(0, 110, 16, 20, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffd36b';
        ctx.fillRect(-15, 108, 30, 3);
        ctx.restore();
        glow(ctx, ox + lx, oy + 110, 40, '#ffb070', 0.35);
      }
      break;
    }
    case 'celeste': {
      // The telescope aimed up through the dome, turning slowly; a planet mobile turning; the stars
      // on the ceiling twinkling.
      const a = -1.1 + Math.sin(time * 0.2) * 0.2;
      ctx.save();
      ctx.translate(ox + 320, oy + 224);
      ctx.rotate(a);
      ctx.fillStyle = '#e0b060';
      ctx.fillRect(-10, -12, 120, 24);
      ctx.fillStyle = '#ffe08a';
      ctx.fillRect(-10, -12, 120, 6);
      ctx.restore();
      for (let i = 0; i < 4; i++) {
        const t2 = time * 0.4 + (i * TAU) / 4;
        const px = ox + 520 + Math.cos(t2) * 50;
        const py = oy + 90 + Math.sin(t2) * 10;
        ctx.strokeStyle = '#8f8fc8';
        ctx.beginPath();
        ctx.moveTo(ox + 520, oy + 40);
        ctx.lineTo(px, py - 8);
        ctx.stroke();
        ctx.fillStyle = ['#ffb08a', '#8fd8ff', '#c8a8ff', '#ffe08a'][i];
        ctx.beginPath();
        ctx.arc(px, py, 7 - i, 0, TAU);
        ctx.fill();
      }
      for (let i = 0; i < 12; i++) {
        const tw = (Math.sin(time * 2 + i * 1.9) + 1) / 2;
        if (tw < 0.7) continue;
        glow(ctx, ox + hash(i * 1.3) * 640, oy + hash(i * 2.7) * 200, 6, '#ffffff', (tw - 0.7) * 2);
      }
      break;
    }
    case 'marlowe': {
      // A hammock swaying, and the whole cabin rocking a touch with the sea through the porthole.
      const sw = Math.sin(time * 1.2) * 6;
      ctx.strokeStyle = '#e8c890';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ox + 380, oy + 200);
      ctx.quadraticCurveTo(ox + 420 + sw, oy + 260, ox + 460, oy + 200);
      ctx.stroke();
      ctx.fillStyle = '#ff8a8a';
      ctx.beginPath();
      ctx.moveTo(ox + 390, oy + 208);
      ctx.quadraticCurveTo(ox + 420 + sw, oy + 262, ox + 450, oy + 208);
      ctx.quadraticCurveTo(ox + 420 + sw, oy + 250, ox + 390, oy + 208);
      ctx.fill();
      // The porthole, the sea rising and falling in it.
      ctx.save();
      ctx.beginPath();
      ctx.arc(ox + 580, oy + 150, 26, 0, TAU);
      ctx.fillStyle = '#9fd8ff';
      ctx.fill();
      ctx.clip();
      ctx.fillStyle = '#4fa0c8';
      ctx.fillRect(ox + 550, oy + 152 + Math.sin(time * 1.2) * 6, 60, 40);
      ctx.restore();
      ctx.strokeStyle = '#c8902a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(ox + 580, oy + 150, 28, 0, TAU);
      ctx.stroke();
      break;
    }
    default:
  }
}
