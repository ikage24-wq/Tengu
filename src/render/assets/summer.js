// The asset library: Summer Beach (2026-11). Seaside furniture, beach props and landmarks, sea
// monsters and summer cosmetics, in the detailed finish (grain, stitching, sheens, sparkles).

import { R, E, T, F, shade, mix } from '../pixel.js';
import { face } from '../scenery.js';
import { grain, stitch, sheen, barkLines, twinkle, ground } from './kit.js';

const SAND = '#f6dcae';
const SEA = '#7fd0f0';
const SEA_DEEP = '#4fa8d8';
const PALM = '#c99a6a';
const FROND = '#6fd08a';
const DRIFT = '#d8c0a0';
const CORAL = '#ff8a7a';
const SUN = '#ffd66b';
const WHITE = '#ffffff';
const CREAM = '#fff4e6';
const TAU = Math.PI * 2;
const wave = (f, n, k = 1) => Math.sin((f / n) * TAU) * k;

// A palm: a curving trunk of stacked rings and a crown of fronds that sway.
function palm(x, y, h, lean, f, n) {
  const out = [];
  for (let i = 0; i < 8; i++) {
    const u = i / 8;
    const cx = x + lean * u * u * h * 0.25;
    out.push(E(cx, y - u * h, 3 - u * 0.8, 2.6, i % 2 ? PALM : shade(PALM, -8)));
  }
  const tx = x + lean * h * 0.25;
  const ty = y - h;
  const sw = wave(f, n, 1.4);
  for (const [a, l] of [[-150, 16], [-110, 13], [-70, 13], [-30, 16], [-180, 12], [0, 12]]) {
    const r = (a * Math.PI) / 180;
    const ex = tx + Math.cos(r) * l + sw;
    const ey = ty + Math.sin(r) * l * 0.5 + 6;
    out.push(T([[tx, ty - 1], [ex, ey - 2], [ex + 1, ey + 1.4], [tx + 1, ty + 1.4]], FROND), F(T([[tx, ty], [ex, ey - 1], [ex, ey - 0.4]], shade(FROND, -14))));
  }
  out.push(E(tx - 1.6, ty + 2, 1.6, 1.6, '#8a5a3c'), E(tx + 1.4, ty + 2.4, 1.6, 1.6, '#8a5a3c'));
  return out;
}
// A seashell (a scallop fan).
function shell(x, y, s, c) {
  const out = [T([[x - 3 * s, y], [x, y - 4 * s], [x + 3 * s, y], [x + 1 * s, y + 1.4 * s], [x - 1 * s, y + 1.4 * s]], c)];
  for (const d of [-1.6, 0, 1.6]) out.push(F(R(x + d * s - 0.2, y - 3 * s + Math.abs(d) * 0.6 * s, 0.4, 3 * s - Math.abs(d) * 0.5 * s, shade(c, -16))));
  return out;
}
// A starfish.
function star(x, y, r, c) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * TAU) / 10;
    const d = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  return [T(pts, c), F(E(x, y, r * 0.18, r * 0.18, shade(c, 12)))];
}

export const SUMMER = [
  // ---------- Furniture ----------
  {
    id: 'palm_hammock', name: 'Palm Hammock', kind: 'furniture', w: 76, h: 60, frames: 8, fps: 5,
    build: (f) => {
      const sw = wave(f, 8, 1.6);
      const out = [ground(38, 58, 34), ...palm(8, 58, 52, 0.6, f, 8), ...palm(68, 58, 52, -0.6, f + 3, 8)];
      // The hammock: a striped net slung between the trunks, rocking.
      const sag = (u) => 30 + Math.sin(u * Math.PI) * 12 + sw * Math.sin(u * Math.PI);
      const top = [];
      const bot = [];
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        const x = 12 + u * 52;
        top.push([x, sag(u) - 2]);
        bot.push([x, sag(u) + 3]);
      }
      out.push(T([...top, ...bot.reverse()], '#ff9ec0'));
      for (let i = 1; i < 12; i += 2) {
        const u = i / 12;
        out.push(F(R(12 + u * 52 - 1.2, sag(u) - 2, 2.4, 5, WHITE)));
      }
      out.push(...stitch(12, 30, 64, 30, '#ffd0de', 3), F(R(11, 26, 2, 6, '#c9a080')), F(R(63, 26, 2, 6, '#c9a080')));
      return out;
    },
  },
  {
    id: 'sun_lounger', name: 'Sun Lounger', kind: 'furniture', w: 48, h: 24, frames: 1,
    build: () => [
      ground(24, 23, 22),
      T([[4, 18], [34, 18], [34, 16], [6, 16]], WHITE), T([[30, 16], [44, 4], [46, 6], [34, 18]], WHITE),
      R(6, 18, 2, 6, '#c8d0e8'), R(30, 18, 2, 6, '#c8d0e8'), R(42, 8, 2, 16, '#c8d0e8'),
      // A towel in blue and white stripes laid over it, with a fringe.
      T([[8, 14.6], [32, 14.6], [42, 5], [43.6, 6.4], [34, 16], [8, 16]], SEA), ...[12, 18, 24].map((x) => F(R(x, 14.6, 2.4, 1.4, WHITE))),
      ...[8.4, 9.6, 10.8].map((x) => F(R(x, 16, 0.5, 1.6, SEA))),
      // Sunglasses and a juice on the side.
      E(18, 13.6, 1.6, 1, '#3a2d4f'), E(21.6, 13.6, 1.6, 1, '#3a2d4f'), R(38, 18, 4, 5, '#ffd36a'), F(R(39, 15, 0.6, 4, '#ff6b8a')), E(40, 18, 2.4, 0.8, '#ffe9a0'),
    ],
  },
  {
    id: 'shell_lamp', name: 'Seashell Lamp', kind: 'furniture', w: 22, h: 34, frames: 4, fps: 4,
    build: (f) => {
      const glow = 0.5 + 0.5 * wave(f, 4);
      return [
        ground(11, 33, 7), R(5, 30, 12, 3, DRIFT), ...grain(5, 30, 12, 3, DRIFT, 1), R(10, 16, 2, 14, '#e8c8a0'),
        // A big scallop shell for a shade, a pearl glowing inside it.
        ...shell(11, 16, 2.6, mix('#ffd8e8', '#fff8f0', glow * 0.5)), F(E(11, 12, 2.2, 2.2, mix('#fff3c4', WHITE, glow))), ...sheen(11, 12, 2.2, 2.2, '#fff3c4'),
        twinkle(17, 6, 1 + glow),
      ];
    },
  },
  {
    id: 'driftwood_shelf', name: 'Driftwood Shelf', kind: 'furniture', w: 44, h: 36, frames: 1,
    build: () => {
      const out = [ground(22, 35, 20), R(3, 6, 2.4, 30, DRIFT), R(38.6, 6, 2.4, 30, DRIFT), R(1, 12, 42, 3, DRIFT), R(1, 26, 42, 3, DRIFT), ...grain(1, 12, 42, 3, DRIFT, 2), ...grain(1, 26, 42, 3, DRIFT, 3)];
      // Shells, a bottle with a ship in it, a starfish and a jar of sea glass.
      out.push(...shell(8, 12, 1.2, '#ffd0de'), ...star(16, 9, 3, CORAL), R(22, 4, 8, 8, mix(SEA, WHITE, 0.6)), F(R(22, 4, 8, 1, WHITE)), T([[24, 10], [28, 10], [27, 11], [25, 11]], '#a8764a'), T([[26, 6], [26, 10], [28.4, 10]], WHITE));
      out.push(R(32, 3, 2, 3, '#a8764a'), R(9, 19, 8, 7, '#c4ecff'), F(E(11, 23, 1, 1, '#ff9ec0')), F(E(14, 21.4, 1, 1, '#a8e8b8')), F(E(12.6, 24, 0.8, 0.8, '#ffe36b')), F(R(9, 19, 8, 1, WHITE)));
      out.push(...shell(26, 26, 1.4, '#fff0d0'), ...shell(33, 26, 1, '#c4e8ff'), ...sheen(13, 22, 4, 3.5, '#c4ecff'));
      return out;
    },
  },
  {
    id: 'coconut_table', name: 'Coconut Table Set', kind: 'furniture', w: 48, h: 28, frames: 1,
    build: () => [
      ground(24, 27, 22),
      // A round table on a palm-trunk leg, two coconut stools.
      R(22, 12, 4, 15, PALM), ...[14, 18, 22].map((y) => F(R(22, y, 4, 0.8, shade(PALM, -12)))), E(24, 11, 13, 3.4, DRIFT), ...grain(12, 9, 24, 3, DRIFT, 4),
      E(7, 22, 5, 4.4, '#8a5a3c'), F(E(7, 19.6, 4, 1.4, '#f6ead8')), E(41, 22, 5, 4.4, '#8a5a3c'), F(E(41, 19.6, 4, 1.4, '#f6ead8')),
      // A coconut drink with a straw and an umbrella.
      E(28, 7, 3, 2.6, '#8a5a3c'), F(E(28, 5.4, 2.2, 0.8, '#f6ead8')), F(R(29, 1, 0.6, 5, '#ff6b8a')), T([[25, 2], [28, -1], [31, 2]], SUN), F(R(27.8, -0.4, 0.4, 3, WHITE)),
      E(17, 8, 2.4, 1.6, '#ff8a6a'), F(E(16.4, 7.4, 0.8, 0.4, WHITE)),
    ],
  },
  {
    id: 'aquarium', name: 'Coral Aquarium', kind: 'furniture', w: 40, h: 34, frames: 8, fps: 6,
    build: (f) => {
      const out = [ground(20, 33, 18), R(3, 26, 34, 7, DRIFT), ...grain(3, 26, 34, 7, DRIFT, 5), R(4, 4, 32, 22, mix(SEA, WHITE, 0.35)), F(R(4, 22, 32, 4, SAND))];
      // Coral and weeds swaying, a little castle, fish swimming across, bubbles rising.
      out.push(...[[9, CORAL], [30, '#ff9ec0']].flatMap(([x, c]) => [T([[x - 2, 23], [x - 3 + wave(f, 8, 0.5), 14], [x, 18], [x + 2 + wave(f, 8, 0.5), 12], [x + 2.6, 23]], c)]));
      out.push(T([[16, 23], [16, 17], [17.4, 17], [17.4, 15], [19, 15], [19, 17], [21, 17], [21, 15], [22.6, 15], [22.6, 17], [24, 17], [24, 23]], '#e8e2f2'), F(R(19.2, 19, 1.6, 4, '#7a6a92')));
      for (const [i, c] of [[0, SUN], [1, CORAL], [2, '#9b7cd6']]) {
        const u = ((f / 8) + i / 3) % 1;
        const x = 6 + u * 28;
        const y = 8 + i * 4 + Math.sin(u * TAU) * 1;
        out.push(E(x, y, 2.4, 1.4, c), T([[x - 2, y], [x - 4, y - 1.4], [x - 4, y + 1.4]], c), F(E(x + 1.2, y - 0.3, 0.4, 0.4, '#3a2d4f')));
      }
      for (let i = 0; i < 3; i++) out.push(F(E(28 + i, 20 - (((f / 8) + i / 3) % 1) * 15, 0.8, 0.8, WHITE)));
      out.push(F(R(4, 4, 32, 1.2, WHITE)), F(R(5.4, 6, 1, 14, mix(SEA, WHITE, 0.7))));
      return out;
    },
  },

  // ---------- Beach props ----------
  {
    id: 'beach_umbrella', name: 'Beach Umbrella', kind: 'prop', w: 52, h: 50, frames: 6, fps: 6,
    build: (f) => {
      const out = [ground(26, 49, 24), R(25, 12, 2, 38, WHITE), T([[2, 40], [44, 40], [48, 49], [6, 49]], '#ffe36b'), ...stitch(4, 44, 46, 44, '#ffd03a', 3)];
      // A canopy in coral and white segments, its fringe fluttering.
      for (let i = 0; i < 6; i++) out.push(T([[26, 4], [2 + i * 8, 18], [10 + i * 8, 18]], i % 2 ? WHITE : CORAL));
      for (let i = 0; i < 12; i++) out.push(F(T([[2 + i * 4, 18], [6 + i * 4, 18], [4 + i * 4 + wave(f + i, 6, 0.6), 21]], i % 2 ? CORAL : WHITE)));
      out.push(E(26, 3, 1.6, 1.6, SUN), F(T([[14, 12], [26, 5], [20, 13]], mix(CORAL, WHITE, 0.5))));
      // A bucket and spade.
      out.push(T([[34, 40], [40, 40], [39, 46], [35, 46]], '#7fd0f0'), F(R(34, 40, 6, 1, WHITE)), R(42, 38, 1, 8, '#ffd03a'), E(42.5, 46, 1.6, 1, '#ffd03a'));
      return out;
    },
  },
  {
    id: 'sandcastle', name: 'Grand Sandcastle', kind: 'prop', w: 48, h: 44, frames: 6, fps: 6,
    build: (f) => {
      const s2 = shade(SAND, -8);
      const out = [ground(24, 43, 22), E(24, 40, 22, 4, SAND)];
      const tower = (x, top, w) => [R(x - w / 2, top, w, 40 - top, SAND), ...[0, 1, 2].map((k) => R(x - w / 2 + k * (w / 3), top - 2.4, w / 3 - 0.8, 2.4, SAND)), F(R(x - w / 2, top + 4, w, 0.8, s2)), F(R(x - w / 2, top + 9, w, 0.8, s2))];
      out.push(...tower(10, 22, 9), ...tower(38, 22, 9), R(13, 26, 22, 14, SAND), ...tower(24, 10, 12));
      // A shell door, windows, and a flag fluttering on top.
      out.push(F(E(24, 38, 3.4, 4, s2)), ...shell(24, 34.6, 1, '#ffd0de'), F(R(22.6, 16, 2.8, 3.4, s2)), F(R(9, 28, 2, 2.6, s2)), F(R(37, 28, 2, 2.6, s2)));
      out.push(R(23.6, 1, 0.8, 9, '#a8764a'), T([[24.4, 1], [31 + wave(f, 6, 1), 3 + wave(f, 6, 0.5)], [24.4, 5.4]], CORAL));
      out.push(...star(42, 39, 2.4, CORAL), ...shell(6, 40, 0.9, '#c4e8ff'));
      return out;
    },
  },
  {
    id: 'lifeguard_tower', name: 'Lifeguard Tower', kind: 'prop', w: 44, h: 72, frames: 4, fps: 3,
    build: (f) => {
      const out = [ground(22, 71, 20)];
      // Stilts with cross braces, a hut with a striped roof, a ladder, a life ring and a flag.
      out.push(R(6, 34, 3, 38, WHITE), R(35, 34, 3, 38, WHITE), F(T([[8, 40], [36, 64], [35, 66], [7, 42]], '#e8e2f2')), F(T([[36, 40], [8, 64], [7, 62], [35, 38]], '#e8e2f2')));
      out.push(R(4, 18, 36, 18, '#ffe9a0'), ...grain(4, 18, 36, 18, '#ffe9a0', 6), F(R(10, 22, 24, 8, '#9fd8ff')), F(R(10, 22, 24, 1, WHITE)), R(2, 34, 40, 2.4, '#ff6b6b'));
      out.push(T([[0, 18], [22, 8], [44, 18]], '#ff6b6b'), ...[0, 1, 2].map((k) => F(T([[8 + k * 12, 15], [14 + k * 12, 12], [16 + k * 12, 15]], WHITE))));
      for (let y = 40; y < 72; y += 5) out.push(R(17, y, 10, 1.2, WHITE));
      out.push(R(16, 36, 1.2, 36, WHITE), R(26.8, 36, 1.2, 36, WHITE));
      out.push(E(40, 28, 4, 4, '#ff6b6b'), F(E(40, 28, 1.8, 1.8, '#ffe9a0')), ...[0, 1, 2, 3].map((k) => F(R(39.6 + Math.cos(k * 1.57) * 3, 27.6 + Math.sin(k * 1.57) * 3, 1, 1, WHITE))));
      out.push(R(21.6, 0, 0.8, 9, '#a8764a'), T([[22.4, 0], [29 + wave(f, 4, 0.8), 2], [22.4, 4]], SUN));
      return out;
    },
  },
  {
    id: 'surfboard_rack', name: 'Surfboard Rack', kind: 'prop', w: 44, h: 52, frames: 1,
    build: () => {
      const out = [ground(22, 51, 20), R(4, 20, 36, 3, DRIFT), R(4, 44, 36, 3, DRIFT), R(6, 18, 2.4, 33, shade(DRIFT, -10)), R(35.6, 18, 2.4, 33, shade(DRIFT, -10)), ...grain(4, 20, 36, 3, DRIFT, 7)];
      const board = (x, c, c2) => [E(x, 26, 4, 24, c), F(R(x - 0.3, 4, 0.6, 44, c2)), F(E(x, 12, 2.6, 4, mix(c, WHITE, 0.4))), ...sheen(x, 20, 4, 14, c)];
      out.push(...board(12, CORAL, WHITE), ...board(22, SEA, SUN), ...board(32, SUN, CORAL));
      out.push(...[0, 1, 2].map((k) => F(R(10 + k * 10, 34, 4, 1.2, WHITE))));
      return out;
    },
  },
  {
    id: 'icecream_cart', name: 'Ice-Cream Cart', kind: 'prop', w: 52, h: 56, frames: 4, fps: 4,
    build: (f) => {
      const out = [ground(26, 55, 24)];
      out.push(R(25, 6, 1.6, 26, WHITE), T([[6, 14], [26, 2], [46, 14]], '#ffc6de'), ...[0, 1, 2, 3, 4].map((k) => E(9 + k * 8.4, 14 + wave(f + k, 4, 0.3), 4.2, 2.4, k % 2 ? '#ffc6de' : WHITE)));
      out.push(R(6, 30, 40, 18, '#c4ecff'), F(R(6, 30, 40, 2, WHITE)), ...stitch(8, 40, 44, 40, WHITE, 3));
      // Three scoops in cones on the counter, a big cone sign, wheels.
      for (const [x, c] of [[13, '#ffb3cf'], [20, '#fff3c4'], [27, '#a8e8b8']]) out.push(T([[x - 2.2, 28], [x + 2.2, 28], [x, 33]], '#e8b878'), E(x, 26.6, 2.6, 2.4, c), ...sheen(x, 26.6, 2.6, 2.4, c));
      out.push(T([[34, 40], [42, 40], [38, 50]], '#e8b878'), E(38, 37, 5, 4.4, '#ffb3cf'), F(E(36, 34.6, 1, 0.5, '#ff6b8a')), E(38, 32.6, 1.4, 1.4, '#ff3a5a'));
      out.push(E(14, 50, 4, 4, '#a8a0c0'), F(E(14, 50, 1.4, 1.4, WHITE)), E(38, 50, 4, 4, '#a8a0c0'), F(E(38, 50, 1.4, 1.4, WHITE)));
      return out;
    },
  },
  {
    id: 'tiki_torch', name: 'Tiki Torch', kind: 'prop', w: 14, h: 46, frames: 6, fps: 10,
    build: (f) => {
      const fl = wave(f, 6, 1);
      return [
        ground(7, 45, 5), R(6, 14, 2.4, 32, PALM), ...[18, 26, 34, 42].map((y) => F(R(6, y, 2.4, 0.8, shade(PALM, -14)))),
        T([[3, 10], [11, 10], [10, 15], [4, 15]], '#a8764a'), ...[4.6, 6.6, 8.6].map((x) => F(R(x, 10, 0.8, 5, shade('#a8764a', -14)))),
        // The flame, leaping.
        T([[3.4, 10], [7 + fl * 0.8, -1 - Math.abs(fl)], [10.6, 10]], '#ff8a3c'), T([[5, 10], [7 - fl * 0.6, 2], [9, 10]], '#ffd66b'), F(E(7, 8.6, 1.2, 1.4, '#fffbe0')),
      ];
    },
  },

  // ---------- Landmarks ----------
  {
    id: 'lighthouse', name: 'Seaside Lighthouse', kind: 'landmark', w: 80, h: 110, frames: 8, fps: 4,
    build: (f) => {
      const out = [ground(40, 109, 34), E(40, 104, 34, 7, '#c8c0d8'), E(40, 101, 28, 5, '#d8d0e6')];
      // A tapering striped tower, a gallery with a rail, the lamp room, a red dome.
      out.push(T([[28, 102], [32, 30], [48, 30], [52, 102]], WHITE));
      for (let k = 0; k < 4; k++) out.push(T([[28.6 + k * 1.1, 92 - k * 18], [29.6 + k * 1.1, 84 - k * 18], [50.4 - k * 1.1, 84 - k * 18], [51.4 - k * 1.1, 92 - k * 18]], '#ff7a8a'));
      out.push(F(T([[31, 100], [34, 32], [36, 32], [34, 100]], mix(WHITE, '#ffe8f0', 0.2))), R(37, 88, 6, 14, '#8fb0e8'), F(E(40, 88, 3, 2, '#8fb0e8')), F(R(38, 60, 4, 6, '#9fd8ff')), F(R(38, 44, 4, 6, '#9fd8ff')));
      out.push(R(26, 28, 28, 3, '#5a5a7a'), ...[28, 32, 36, 40, 44, 48, 52].map((x) => R(x, 22, 0.8, 6, '#5a5a7a')), R(26, 22, 28, 1, '#5a5a7a'));
      const glow = 0.6 + 0.4 * wave(f, 8);
      out.push(R(33, 12, 14, 10, mix('#fff3a6', WHITE, glow * 0.5)), F(R(35, 13, 3, 8, WHITE)), T([[31, 12], [40, 2], [49, 12]], '#ff6b6b'), E(40, 2, 1.6, 1.6, '#5a5a7a'));
      // The beam sweeping round.
      const a = (f / 8) * TAU;
      const dx = Math.cos(a);
      if (Math.abs(dx) > 0.15) out.push(F(T([[40, 15], [40 + dx * 40, 9], [40 + dx * 40, 21]], mix('#fff3a6', WHITE, 0.5))));
      return out;
    },
  },
  {
    id: 'pier_boat', name: 'Pier and Rowboat', kind: 'landmark', w: 110, h: 54, frames: 8, fps: 5,
    build: (f) => {
      const bob = wave(f, 8, 1.4);
      const out = [R(0, 36, 110, 18, SEA), ...[0, 1, 2, 3, 4, 5].map((k) => F(R(6 + k * 18 + wave(f + k, 8, 3), 40 + (k % 2) * 6, 8, 1, WHITE)))];
      // The pier on posts with barnacles, a lamp, a rope coil.
      for (const x of [10, 34, 58]) out.push(R(x, 22, 4, 30, PALM), F(R(x, 36, 4, 2, '#e8e2f2')), F(E(x + 1, 44, 1, 1, '#c8c0d8')), F(R(x, 46, 4, 6, SEA_DEEP)));
      out.push(R(4, 18, 66, 5, DRIFT), ...grain(4, 18, 66, 5, DRIFT, 9), ...[12, 24, 36, 48, 60].map((x) => F(R(x, 18, 0.6, 5, shade(DRIFT, -16)))));
      out.push(R(66, 4, 1.6, 14, '#5a5a7a'), E(67, 4, 2.4, 2.4, '#fff3a6'), E(20, 16, 4, 2, '#c9a080'), F(E(20, 16, 2.4, 1, shade('#c9a080', -14))));
      // A rowboat tied up, bobbing.
      out.push(F(R(70, 20, 12, 0.6, '#c9a080')), T([[78, 34 + bob], [104, 34 + bob], [100, 40 + bob], [82, 40 + bob]], CORAL), F(R(80, 34 + bob, 22, 1.4, WHITE)), R(88, 30 + bob, 8, 1.4, DRIFT), F(T([[94, 32 + bob], [108, 30 + bob], [107, 31 + bob]], DRIFT)));
      return out;
    },
  },

  // ---------- Monsters ----------
  {
    id: 'clacker_crab', name: 'Clacker Crab', kind: 'monster', w: 36, h: 28, frames: 8, fps: 10,
    build: (f) => {
      // Scuttles sideways on six legs, claws snapping open and shut, eyes on stalks.
      const step = wave(f, 8);
      const snap = f % 4 < 2 ? 1 : 0;
      const out = [ground(18, 27, 13)];
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) out.push(T([[18 + s * (6 + k * 2), 20], [18 + s * (10 + k * 3) + step * (k % 2 ? 1 : -1), 26], [18 + s * (9 + k * 3), 26]], shade(CORAL, -10)));
      out.push(E(18, 18, 10, 6.4, CORAL), F(E(18, 21, 7, 2, shade(CORAL, -12))), ...sheen(18, 18, 10, 6.4, CORAL));
      for (const s of [-1, 1]) {
        out.push(R(18 + s * 3 - 0.6, 8, 1.2, 6, CORAL), E(18 + s * 3, 8, 2, 2, WHITE), F(E(18 + s * 3.4, 8.2, 0.8, 1, '#3a2d4f')));
        const cx = 18 + s * 13;
        out.push(E(cx, 12, 4, 3.4, CORAL), T([[cx + s * 1, 9.6], [cx + s * 5, 7 - snap * 2], [cx + s * 3, 11]], CORAL), T([[cx + s * 1, 13], [cx + s * 5, 14 + snap * 1], [cx + s * 3, 12]], shade(CORAL, -8)));
      }
      out.push(F(E(14, 19.6, 1, 0.5, '#ff9fb8')), F(E(22, 19.6, 1, 0.5, '#ff9fb8')));
      return out;
    },
  },
  {
    id: 'jelly_bloop', name: 'Jelly Bloop', kind: 'monster', w: 30, h: 40, frames: 8, fps: 8,
    build: (f) => {
      // Drifts up and down, its bell pulsing, frilly tentacles trailing in waves.
      const pulse = wave(f, 8);
      const y = 12 + pulse * 2;
      const c = '#c9b6ff';
      const out = [];
      for (let k = 0; k < 5; k++) {
        const x = 7 + k * 4;
        const pts = [];
        for (let i = 0; i <= 6; i++) pts.push([x + Math.sin(i * 0.9 + f * 0.8 + k) * 1.4, y + 8 + i * 3.4]);
        out.push(T([...pts.map(([px, py]) => [px - 0.6, py]), ...pts.reverse().map(([px, py]) => [px + 0.6, py])], k % 2 ? mix(c, WHITE, 0.4) : '#ffb3cf'));
      }
      out.push(E(15, y, 11 - pulse * 0.6, 8 + pulse * 0.4, mix(c, WHITE, 0.3)), F(E(15, y + 6, 10, 2.4, mix(c, '#ff9fd0', 0.3))), ...sheen(15, y, 11, 8, c));
      out.push(...face(15, y + 1, 2.6, f === 6 ? 'closed' : 'open', 'smile', 1.1), twinkle(24, y - 6, 1.2));
      return out;
    },
  },
  {
    id: 'puffer_pop', name: 'Puffer Pop', kind: 'monster', w: 34, h: 34, frames: 8, fps: 6,
    build: (f) => {
      // Floats bobbing, then puffs up round and spiky, then lets the air out.
      const puff = Math.max(0, wave(f, 8));
      const r = 8 + puff * 4;
      const c = '#ffe36b';
      const out = [ground(17, 33, 8 + puff * 3)];
      if (puff > 0.2) for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        out.push(T([[17 + Math.cos(a) * (r - 1), 17 + Math.sin(a) * (r - 1)], [17 + Math.cos(a) * (r + 3 * puff), 17 + Math.sin(a) * (r + 3 * puff)], [17 + Math.cos(a + 0.2) * (r - 1), 17 + Math.sin(a + 0.2) * (r - 1)]], shade(c, -8)));
      }
      out.push(T([[17 - r + 1, 17], [17 - r - 5, 13], [17 - r - 5, 21]], '#ffb35a'), E(17, 17, r, r * 0.92, c), F(E(17, 17 + r * 0.45, r * 0.7, r * 0.4, '#fff3c4')));
      out.push(...[[13, 11], [20, 10], [24, 15], [12, 19]].map(([x, y]) => F(E(x, y, 0.9, 0.9, '#ffb35a'))), ...sheen(17, 17, r, r, c));
      out.push(...face(19, 16, 2.4, 'open', puff > 0.5 ? 'o' : 'smile', 1.1), T([[17, 17 - r], [19, 17 - r - 3], [21, 17 - r + 0.6]], '#ffb35a'));
      return out;
    },
  },

  // ---------- Cosmetics ----------
  {
    id: 'straw_sunhat', name: 'Straw Sunhat', kind: 'cosmetic', w: 40, h: 18, frames: 4, fps: 3,
    build: (f) => {
      const straw = '#f3dcaa';
      return [
        E(20, 13, 19, 4.4, straw), E(20, 9, 10, 6, straw), F(E(20, 13.4, 16, 2, shade(straw, -8))),
        ...[0, 1, 2, 3].map((k) => F(R(11 + k * 5.4, 6, 0.5, 6, shade(straw, -12)))),
        R(10, 10, 20, 2.6, '#ff8fb0'), T([[28, 11], [36 + wave(f, 4, 0.6), 16], [33, 17]], '#ff8fb0'), ...[24, 26.6].map((x) => E(x, 10.8, 2, 1.6, '#ff8fb0')),
        E(14, 9.6, 2.2, 2.2, WHITE), F(E(14, 9.6, 0.9, 0.9, SUN)), ...sheen(20, 8, 10, 6, straw),
      ];
    },
  },
  {
    id: 'heart_sunglasses', name: 'Heart Sunglasses', kind: 'cosmetic', w: 30, h: 12, frames: 4, fps: 3,
    build: (f) => {
      const heart = (x) => [E(x - 2.2, 5, 3, 3, '#ff5f86'), E(x + 2.2, 5, 3, 3, '#ff5f86'), T([[x - 5, 6], [x + 5, 6], [x, 11]], '#ff5f86'), F(E(x - 2.6, 4, 1.2, 0.8, '#ffc0d0'))];
      return [...heart(8), ...heart(22), R(13, 4.6, 4, 1.2, '#ff5f86'), R(0, 4, 3, 1, '#ff5f86'), R(27, 4, 3, 1, '#ff5f86'), twinkle(5, 3, 0.6 + Math.abs(wave(f, 4)) * 0.8)];
    },
  },
  {
    id: 'duck_swim_ring', name: 'Duck Swim Ring', kind: 'cosmetic', w: 34, h: 26, frames: 6, fps: 5,
    build: (f) => {
      const bob = wave(f, 6, 0.8);
      const c = '#ffe36b';
      return [
        E(17, 18 + bob, 15, 7, c), F(E(17, 18 + bob, 7, 3, '#c4ecff')), ...[0, 1, 2, 3].map((k) => F(R(5 + k * 7.4, 14 + bob, 3, 1.6, '#ff8fb0'))), ...sheen(17, 18 + bob, 15, 7, c),
        // A duck head at the front.
        E(27, 9 + bob, 5, 4.6, c), T([[31, 9 + bob], [35, 10 + bob], [31, 11.4 + bob]], '#ffb35a'), F(E(28, 8 + bob, 0.9, 1.1, '#3a2d4f')), F(E(28.6, 10.4 + bob, 1, 0.5, '#ff9fb8')),
      ];
    },
  },
];
