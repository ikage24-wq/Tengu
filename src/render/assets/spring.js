// The asset library: Spring Blossom Festival (2026-11). Pieces drawn ready to add to the game later:
// furniture for homes, festival props and landmarks for maps, monsters, and cosmetics. Each is
// { id, name, kind, w, h, frames, fps, build(f) } where build returns the frame's shapes in the game's
// own prop style (render/scenery.js `art`: outlined, lit from the upper left). Anchored at the
// bottom centre. See tools/asset-gallery.html.

import { R, E, T, F, shade, mix } from '../pixel.js';
import { face } from '../scenery.js';
import { grain, stitch, sheen, barkLines, twinkle, ground } from './kit.js';

const PINK = '#ffb3cf';
const SAKURA = '#ffc6dc';
const BLOSSOM = '#ff9ec0';
const LEAF = '#8fdc9a';
const STEM = '#6cc070';
const WOOD = '#d9a86c';
const CREAM = '#fff4e6';
const GOLD = '#ffd66b';
const WHITE = '#ffffff';

const TAU = Math.PI * 2;
const wave = (f, n, k = 1) => Math.sin((f / n) * TAU) * k;

// A five-petal blossom.
function bloom(cx, cy, r, c = SAKURA, mid = GOLD) {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * TAU) / 5;
    out.push(E(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.52, r * 0.52, c));
  }
  out.push(F(E(cx, cy, r * 0.32, r * 0.32, mid)));
  return out;
}
// A tulip head.
function tulip(cx, cy, s, c) {
  return [T([[cx - 2.4 * s, cy - 3 * s], [cx - 1.2 * s, cy - 1.4 * s], [cx, cy - 3.6 * s], [cx + 1.2 * s, cy - 1.4 * s], [cx + 2.4 * s, cy - 3 * s], [cx + 2.2 * s, cy + 0.6 * s], [cx, cy + 1.8 * s], [cx - 2.2 * s, cy + 0.6 * s]], c), F(E(cx - 0.8 * s, cy - 1 * s, 0.5 * s, 1.2 * s, mix(c, WHITE, 0.4)))];
}
// A round blossom crown of clumps.
function crown(cx, cy, rx, ry, c = SAKURA) {
  const out = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    out.push(E(cx + Math.cos(a) * rx * 0.55, cy + Math.sin(a) * ry * 0.45, rx * 0.5, ry * 0.5, i % 2 ? c : shade(c, 4)));
  }
  out.push(E(cx, cy, rx * 0.6, ry * 0.6, c));
  return out;
}

export const SPRING = [
  // ---------- Furniture ----------
  {
    id: 'blossom_bed', name: 'Blossom Canopy Bed', kind: 'furniture', w: 56, h: 52, frames: 1,
    build: () => [
      // Posts and canopy.
      R(3, 6, 3, 44, WOOD), R(50, 6, 3, 44, WOOD), R(2, 4, 52, 4, shade(WOOD, -6)),
      T([[4, 8], [52, 8], [50, 18], [44, 14], [38, 19], [28, 14], [18, 19], [12, 14], [6, 18]], SAKURA),
      ...bloom(28, 6, 3.4), ...bloom(10, 7, 2.4), ...bloom(46, 7, 2.4),
      // The bed: frame, mattress, a pink quilt, two pillows.
      R(5, 36, 46, 10, shade(WOOD, -10)), R(6, 30, 44, 7, CREAM), R(18, 31, 32, 9, PINK), F(R(18, 31, 32, 1.4, mix(PINK, WHITE, 0.4))),
      ...[24, 32, 40].flatMap((x) => [F(E(x, 35.5, 1.4, 1.4, WHITE))]),
      E(11, 30, 5, 3, WHITE), E(11, 27.6, 4.4, 2.4, mix(SAKURA, WHITE, 0.5)),
      R(5, 46, 3, 6, shade(WOOD, -18)), R(48, 46, 3, 6, shade(WOOD, -18)),
      // (Detail pass: grain, quilt seams, a ribbon tie on each post, a heart cushion.)
      ...grain(5, 36, 46, 10, shade(WOOD, -10), 1), ...grain(3, 8, 3, 38, WOOD, 2, 'y'), ...grain(50, 8, 3, 38, WOOD, 3, 'y'),
      ...stitch(18, 35.5, 50, 35.5, mix(PINK, WHITE, 0.6), 2.2), ...stitch(34, 31.4, 34, 39.6, mix(PINK, WHITE, 0.6), 2),
      T([[2.4, 20], [6.6, 20], [4.5, 25]], BLOSSOM), T([[49.4, 20], [53.6, 20], [51.5, 25]], BLOSSOM),
      E(43.6, 30.4, 1.8, 1.8, '#ff8fb0'), E(46, 30.4, 1.8, 1.8, '#ff8fb0'), T([[41.9, 31], [47.7, 31], [44.8, 34]], '#ff8fb0'), ...sheen(44.8, 31, 3, 2.4, '#ff8fb0'),
    ],
  },
  {
    id: 'petal_armchair', name: 'Petal Armchair', kind: 'furniture', w: 30, h: 30, frames: 1,
    build: () => [
      // A chair shaped like an open blossom: five petal-cushions round a round seat.
      E(15, 11, 9, 8, SAKURA), E(5, 15, 5, 7, BLOSSOM), E(25, 15, 5, 7, BLOSSOM), E(9, 7, 5, 5, SAKURA), E(21, 7, 5, 5, SAKURA),
      E(15, 19, 10, 5, PINK), F(E(12, 17.6, 4, 1.4, mix(PINK, WHITE, 0.5))),
      R(8, 23, 2.4, 7, shade(WOOD, -10)), R(19.6, 23, 2.4, 7, shade(WOOD, -10)), E(15, 23, 9, 1.6, shade(WOOD, -4)),
      F(E(15, 10, 1.6, 1.6, GOLD)),
      ...[[12, 19], [18, 19], [15, 21]].map(([x, y]) => F(E(x, y, 0.7, 0.7, shade(PINK, -16)))),
      ...[[5, 15], [25, 15], [9, 7], [21, 7]].map(([x, y]) => F(R(x - 0.2, y - 3, 0.4, 5, shade(SAKURA, -10)))),
      ...sheen(15, 11, 9, 8, SAKURA),
    ],
  },
  {
    id: 'sakura_tea_table', name: 'Sakura Tea Table', kind: 'furniture', w: 36, h: 34, frames: 6, fps: 6,
    build: (f) => {
      const out = [
        E(18, 20, 16, 3.4, shade(WOOD, 4)), R(3, 20, 30, 2.4, WOOD), R(7, 22, 2.4, 12, shade(WOOD, -12)), R(26.6, 22, 2.4, 12, shade(WOOD, -12)),
        // A teapot with a blossom and two cups.
        E(16, 14, 5, 4.4, WHITE), E(16, 9.8, 2.2, 1.2, PINK), F(E(16, 9, 0.8, 0.8, BLOSSOM)), T([[20.6, 13], [24, 10.6], [24.2, 11.8], [21, 15]], WHITE),
        ...bloom(14.8, 14.6, 1.6, BLOSSOM),
        E(27, 18.2, 2.4, 1.6, WHITE), F(E(27, 17.4, 1.8, 0.6, '#c8e8a8')), E(7, 18.2, 2.4, 1.6, WHITE), F(E(7, 17.4, 1.8, 0.6, '#c8e8a8')),
        ...grain(3, 20, 30, 2.4, WOOD, 4), ...[10, 14, 18, 22, 26].map((x) => F(E(x, 22.4, 1.2, 0.9, WHITE))), ...sheen(16, 14, 5, 4.4, WHITE),
      ];
      // Steam curling up from the spout.
      for (let i = 0; i < 3; i++) {
        const u = ((f / 6) + i / 3) % 1;
        out.push(F(E(24.4 + Math.sin(u * TAU) * 1.2, 9 - u * 9, 0.8 + u * 1.2, 0.8 + u * 1.2, mix(WHITE, '#f0e8ff', u))));
      }
      return out;
    },
  },
  {
    id: 'flower_lamp', name: 'Lily Lamp', kind: 'furniture', w: 18, h: 40, frames: 4, fps: 4,
    build: (f) => {
      const glow = 0.5 + 0.5 * wave(f, 4);
      return [
        R(8, 14, 2, 22, STEM), E(9, 37, 6, 2.2, shade(WOOD, -4)), R(4, 36, 10, 3, WOOD),
        E(5, 24, 3.4, 1.4, LEAF), E(13, 28, 3.4, 1.4, LEAF),
        // A drooping lily shade glowing warm.
        T([[2, 12], [9, 2], [16, 12], [13, 15], [9, 13], [5, 15]], mix('#fff3a6', WHITE, 0.3 * glow)),
        F(E(9, 11, 3.6, 2.4, mix('#ffe36b', '#fffbe0', glow))), F(E(9, 4, 1.2, 1.2, GOLD)),
      ];
    },
  },
  {
    id: 'tulip_shelf', name: 'Tulip Pot Shelf', kind: 'furniture', w: 40, h: 36, frames: 1,
    build: () => {
      const out = [R(2, 14, 36, 3, WOOD), R(2, 30, 36, 3, WOOD), R(3, 10, 2.4, 26, shade(WOOD, -12)), R(34.6, 10, 2.4, 26, shade(WOOD, -12))];
      out.push(...grain(2, 14, 36, 3, WOOD, 5), ...grain(2, 30, 36, 3, WOOD, 6));
      const pots = [[9, 14, BLOSSOM], [20, 14, '#ffe36b'], [31, 14, '#c9a6ff'], [12, 30, '#ff8a8a'], [27, 30, '#ffffff']];
      for (const [x, y, c] of pots) {
        out.push(R(x - 1, y - 7, 2, 5, STEM), E(x - 2.6, y - 4, 2.2, 0.9, LEAF), ...tulip(x, y - 8, 0.9, c));
        out.push(T([[x - 3.4, y - 3], [x + 3.4, y - 3], [x + 2.6, y], [x - 2.6, y]], '#e89a6a'), F(R(x - 3.4, y - 3, 6.8, 1, shade('#e89a6a', 10))));
      }
      return out;
    },
  },
  {
    id: 'picnic_set', name: 'Spring Picnic Set', kind: 'furniture', w: 46, h: 20, frames: 1,
    build: () => {
      const out = [T([[2, 18], [44, 18], [40, 10], [6, 10]], '#ffd0de')];
      // Gingham checks.
      for (let i = 0; i < 6; i++) out.push(F(T([[6 + i * 6, 10], [9 + i * 6, 10], [6.6 + i * 6.6, 18], [3 + i * 6.8, 18]], '#ff9ec0')));
      out.push(R(28, 6, 12, 7, '#e8b87a'), E(34, 6, 6, 1.6, shade('#e8b87a', 6)), T([[29, 6], [34, 0.5], [39, 6], [37, 6], [34, 2.2], [31, 6]], shade('#e8b87a', -14)));
      out.push(E(10, 11, 3, 2, '#ff6b6b'), F(E(9, 10.2, 0.8, 0.6, WHITE)), R(10, 8.4, 0.6, 1.4, STEM), E(16, 12, 3.2, 1.6, CREAM), F(E(16, 11.4, 2.4, 0.8, '#ffe36b')));
      return out;
    },
  },

  // ---------- Festival props ----------
  {
    id: 'lantern_string', name: 'Festival Lantern String', kind: 'prop', w: 80, h: 28, frames: 8, fps: 6,
    build: (f) => {
      const out = [];
      const sag = (x) => 4 + Math.sin((x / 80) * Math.PI) * 8;
      for (let x = 0; x < 80; x += 2) out.push(F(R(x, sag(x), 2, 0.8, '#a8949a')));
      const cols = [BLOSSOM, '#ffe36b', '#9fd8ff', '#c9a6ff', '#a8e8b8'];
      for (let i = 0; i < 5; i++) {
        const x = 8 + i * 16;
        const sw = wave(f + i * 2, 8, 1.2);
        const y = sag(x);
        out.push(F(R(x - 0.3 + sw * 0.3, y, 0.6, 3, '#a8949a')), E(x + sw, y + 7, 4, 5, cols[i]), F(E(x + sw - 1.2, y + 5.6, 1, 2, mix(cols[i], WHITE, 0.6))), R(x - 2 + sw, y + 2.4, 4, 1.2, shade(cols[i], -18)), R(x - 2 + sw, y + 11.6, 4, 1.2, shade(cols[i], -18)), F(R(x - 0.4 + sw, y + 12.8, 0.8, 2.4, '#ff6b8a')));
      }
      return out;
    },
  },
  {
    id: 'flower_cart', name: 'Flower Cart Stall', kind: 'prop', w: 56, h: 48, frames: 4, fps: 3,
    build: (f) => {
      const out = [
        // Awning in stripes, swaying a touch.
        ...[0, 1, 2, 3, 4, 5].map((i) => T([[4 + i * 8, 6], [12 + i * 8, 6], [12 + i * 8 + wave(f, 4, 0.4), 14], [4 + i * 8 + wave(f, 4, 0.4), 14]], i % 2 ? WHITE : BLOSSOM)),
        R(5, 6, 2, 26, shade(WOOD, -10)), R(49, 6, 2, 26, shade(WOOD, -10)),
        R(4, 28, 48, 10, WOOD), F(R(4, 28, 48, 1.4, shade(WOOD, 14))),
        E(14, 42, 5, 5, shade(WOOD, -16)), F(E(14, 42, 1.6, 1.6, GOLD)), E(42, 42, 5, 5, shade(WOOD, -16)), F(E(42, 42, 1.6, 1.6, GOLD)),
      ];
      out.push(...grain(4, 28, 48, 10, WOOD, 7), R(38, 30, 10, 6, '#4a5a58'), F(R(39.4, 31.6, 6, 0.6, WHITE)), F(R(39.4, 33.4, 4, 0.6, WHITE)), ...bloom(37, 30, 1.4));
      // Buckets of flowers on the cart.
      for (const [x, c] of [[12, BLOSSOM], [22, '#ffe36b'], [32, '#c9a6ff'], [42, WHITE]]) {
        out.push(R(x - 3.4, 22, 6.8, 6, '#9fb8f2'), F(R(x - 3.4, 22, 6.8, 1, '#c4d4ff')));
        for (let k = 0; k < 3; k++) out.push(R(x - 2 + k * 2, 17, 0.8, 5, STEM), ...bloom(x - 2 + k * 2, 16.4 - (k % 2), 1.8, c));
      }
      return out;
    },
  },
  {
    id: 'blossom_arch', name: 'Blossom Arch', kind: 'prop', w: 56, h: 60, frames: 1,
    build: () => {
      const out = [R(4, 18, 4, 42, '#e8d0b8'), R(48, 18, 4, 42, '#e8d0b8'), R(2, 56, 8, 4, shade('#e8d0b8', -10)), R(46, 56, 8, 4, shade('#e8d0b8', -10))];
      // A garland of blossoms over a curved wooden arch.
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (i / 12) * Math.PI;
        const x = 28 + Math.cos(a) * 24;
        const y = 22 + Math.sin(a) * 18;
        out.push(E(x, y, 4.4, 4, i % 3 ? SAKURA : BLOSSOM));
      }
      for (let i = 0; i <= 6; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        out.push(...bloom(28 + Math.cos(a) * 24, 22 + Math.sin(a) * 18 - 1, 2.2, WHITE, GOLD));
      }
      for (const [x, y] of [[6, 30], [50, 34], [6, 44], [50, 48]]) out.push(E(x, y, 2.6, 1.2, LEAF), ...bloom(x + 1, y - 2, 1.6));
      return out;
    },
  },
  {
    id: 'egg_planter', name: 'Spring Egg Planter', kind: 'prop', w: 22, h: 28, frames: 1,
    build: () => [
      E(11, 20, 9, 8, '#c4ecff'), F(T([[2.4, 18], [6, 16], [9, 18.6], [12, 16], [15, 18.6], [19.6, 16.4], [19.6, 19], [2.4, 19.4]], '#ffffff')),
      ...[5, 11, 17].map((x) => F(E(x, 23, 1.4, 1.4, '#ffb3cf'))), F(E(8, 15, 1.6, 2.4, mix('#c4ecff', WHITE, 0.6))),
      R(10.4, 5, 1.2, 9, STEM), E(7, 10, 3, 1.2, LEAF), E(15, 8, 3, 1.2, LEAF), ...tulip(11, 5, 1, '#ffe36b'),
    ],
  },
  {
    id: 'bunny_statue', name: 'Garden Bunny Statue', kind: 'prop', w: 24, h: 34, frames: 4, fps: 2,
    build: (f) => {
      const stone = '#e8e2f2';
      return [
        R(3, 28, 18, 6, shade(stone, -10)), F(R(3, 28, 18, 1.2, WHITE)),
        E(12, 22, 7, 6.4, stone), E(12, 13, 5.4, 5, stone), E(9.6, 5, 1.8, 5, stone), E(14.6, 5, 1.8, 5, stone),
        F(E(9.6, 5.4, 0.8, 3.6, '#ffd0e0')), F(E(14.6, 5.4, 0.8, 3.6, '#ffd0e0')),
        ...face(12, 13.4, 2, f === 3 ? 'closed' : 'open', 'smile', 1.1),
        // A garland of real blossoms round its neck, and moss at the foot.
        ...bloom(8.6, 17.4, 1.5), ...bloom(12, 18.4, 1.5, WHITE), ...bloom(15.4, 17.4, 1.5), F(E(5, 28, 3, 1.2, LEAF)),
      ];
    },
  },
  {
    id: 'maypole', name: 'Ribbon Maypole', kind: 'prop', w: 44, h: 72, frames: 8, fps: 6,
    build: (f) => {
      const out = [R(21, 6, 2.4, 64, '#f6e2c8'), E(22, 4, 3, 3, GOLD), ...bloom(22, 7, 3.6), E(22, 70, 8, 2, shade(WOOD, -6))];
      // Ribbons fanning out and turning round the pole.
      const cols = [BLOSSOM, '#9fd8ff', '#ffe36b', '#a8e8b8', '#c9a6ff'];
      for (let i = 0; i < 5; i++) {
        const a = ((f / 8) + i / 5) * TAU;
        const ex = 22 + Math.cos(a) * 19;
        const ey = 52 + Math.sin(a) * 4;
        const front = Math.sin(a) > 0;
        const rib = T([[22, 9], [23.4, 9], [ex + 1.2, ey], [ex - 1.2, ey]], cols[i]);
        out.push(front ? rib : { ...rib });
      }
      out.push(...[0, 1, 2, 3].map((k) => F(R(21, 18 + k * 12, 2.4, 1.6, cols[k]))));
      return out;
    },
  },

  // ---------- Landmarks ----------
  {
    id: 'great_blossom_tree', name: 'Great Blossom Tree', kind: 'landmark', w: 120, h: 120, frames: 8, fps: 6,
    build: (f) => {
      const bark = '#a8826a';
      const out = [
        // Trunk with roots and two big boughs.
        T([[52, 120], [56, 80], [50, 60], [58, 58], [62, 76], [66, 56], [72, 58], [66, 82], [70, 120]], bark),
        T([[40, 120], [52, 112], [56, 120]], bark), T([[66, 120], [72, 110], [84, 120]], bark),
        F(T([[56, 118], [58, 84], [60, 118]], shade(bark, 12))), ...barkLines(61, 70, 116, 12, bark, 3),
        // A swing hanging from the low bough.
        F(R(32, 62, 0.6, 30, '#c9a6a0')), F(R(44, 60, 0.6, 32, '#c9a6a0')), R(30, 91, 16, 2.4, WOOD), ...bloom(38, 91, 1.4),
        // The crown in layered blossom clumps, swaying gently.
      ];
      const sw = wave(f, 8, 1.2);
      for (const [x, y, rx, ry, c] of [[60, 40, 40, 26, SAKURA], [30, 52, 22, 16, BLOSSOM], [92, 50, 24, 16, SAKURA], [46, 26, 22, 16, mix(SAKURA, WHITE, 0.3)], [78, 26, 22, 16, SAKURA], [62, 14, 18, 12, mix(SAKURA, WHITE, 0.4)]]) out.push(...crown(x + sw * (y < 30 ? 1 : 0.5), y, rx, ry, c));
      for (let i = 0; i < 14; i++) out.push(...bloom(20 + ((i * 37) % 84), 14 + ((i * 23) % 46), 2.4, i % 2 ? WHITE : BLOSSOM));
      // Petals falling from the crown.
      for (let i = 0; i < 6; i++) {
        const u = ((f / 8) + i / 6) % 1;
        out.push(F(E(18 + i * 16 + Math.sin(u * TAU + i) * 4, 60 + u * 56, 1.4, 0.8, i % 2 ? SAKURA : WHITE)));
      }
      return out;
    },
  },
  {
    id: 'festival_gazebo', name: 'Festival Gazebo Stage', kind: 'landmark', w: 96, h: 80, frames: 4, fps: 3,
    build: (f) => {
      const out = [
        R(4, 64, 88, 8, '#f6e2c8'), R(2, 72, 92, 8, shade('#f6e2c8', -10)), F(R(4, 64, 88, 1.4, WHITE)),
        R(8, 26, 4, 38, WHITE), R(84, 26, 4, 38, WHITE), R(46, 26, 4, 38, WHITE),
        T([[0, 28], [48, 4], [96, 28]], BLOSSOM), T([[6, 28], [48, 10], [90, 28]], mix(BLOSSOM, WHITE, 0.3)), F(R(0, 27, 96, 2, shade(BLOSSOM, -14))),
        E(48, 4, 3, 3, GOLD), ...bloom(48, 16, 4, WHITE, GOLD),
      ];
      // Bunting under the eaves, fluttering.
      const cols = [BLOSSOM, '#ffe36b', '#9fd8ff', '#a8e8b8'];
      for (let i = 0; i < 11; i++) out.push(T([[6 + i * 8, 30], [14 + i * 8, 30], [10 + i * 8 + wave(f + i, 4, 0.6), 36 + wave(f + i, 4, 0.5)]], cols[i % 4]));
      // Garlands down the pillars.
      for (const x of [10, 86]) for (let k = 0; k < 4; k++) out.push(...bloom(x, 36 + k * 7, 2, k % 2 ? WHITE : SAKURA));
      // A low railing, round paper lanterns under the eaves, and steps up the front.
      out.push(R(12, 54, 34, 1.6, WHITE), R(50, 54, 34, 1.6, WHITE));
      for (let x = 14; x < 84; x += 5) if (x < 44 || x > 52) out.push(R(x, 55, 1, 9, WHITE));
      for (const x of [26, 70]) out.push(F(R(x - 0.3, 29, 0.6, 4, '#a8949a')), E(x, 37 + wave(f, 4, 0.4), 3.4, 4, '#ffe36b'), F(E(x - 1, 36, 1, 2, '#fffbe0')));
      out.push(R(38, 72, 20, 3, shade('#f6e2c8', 6)), R(36, 75, 24, 3, shade('#f6e2c8', -4)), ...grain(4, 64, 88, 8, '#f6e2c8', 9));
      return out;
    },
  },

  // ---------- Monsters ----------
  {
    id: 'petal_puff', name: 'Petal Puff', kind: 'monster', w: 28, h: 28, frames: 8, fps: 8,
    build: (f) => {
      // A fluffy ball of blossom that bounces, squishing only in its fluff, its face peeking out.
      const bob = Math.abs(wave(f, 8, 3));
      const y = 16 - bob;
      const out = [F(E(14, 27, 8 - bob * 0.6, 1.4, '#ddd0ec'))];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU + f * 0.1;
        out.push(E(14 + Math.cos(a) * 7, y + Math.sin(a) * 6.6, 4.4, 4.2, i % 2 ? SAKURA : mix(SAKURA, WHITE, 0.4)));
      }
      out.push(E(14, y, 8, 7.4, mix(SAKURA, WHITE, 0.25)), ...face(14, y + 0.6, 2.2, f === 5 ? 'closed' : 'open', 'smile', 1.2));
      out.push(R(13.4, y - 11, 1.2, 4, STEM), E(16, y - 10, 2.4, 1, LEAF), ...sheen(14, y, 8, 7.4, SAKURA), twinkle(22, y - 6, 1.4 + Math.abs(wave(f, 8)) * 0.8));
      return out;
    },
  },
  {
    id: 'tulip_knight', name: 'Tulip Knight', kind: 'monster', w: 30, h: 36, frames: 8, fps: 8,
    build: (f) => {
      // A tulip on two little leaf feet, marching, a leaf blade raised, the head bobbing.
      const step = wave(f, 8);
      const bob = Math.abs(step) * 1;
      const out = [
        F(E(15, 35, 7, 1.2, '#ddd0ec')),
        E(11 + step * 2, 33, 3, 1.6, LEAF), E(19 - step * 2, 33, 3, 1.6, LEAF),
        R(14, 18 - bob, 2.4, 14, STEM),
        // The leaf blade, raised.
        T([[20, 22 - bob], [27, 6 - bob], [24, 6 - bob], [18.6, 21 - bob]], LEAF), F(T([[21, 20 - bob], [26, 8 - bob], [25, 8 - bob]], mix(LEAF, WHITE, 0.4))),
        E(9, 22 - bob, 3.4, 1.4, LEAF),
        ...tulip(15.2, 14 - bob, 2.6, '#ff6b8a'),
        ...face(15.2, 13 - bob, 1.6, f % 8 === 6 ? 'closed' : 'open', 'smile', 0.9),
      ];
      return out;
    },
  },
  {
    id: 'bunny_bloom', name: 'Bunny Bloom', kind: 'monster', w: 30, h: 32, frames: 8, fps: 8,
    build: (f) => {
      // A white bunny whose ears are tulip leaves and who wears a blossom, hopping.
      const hop = Math.max(0, wave(f, 8, 6));
      const y = 24 - hop;
      return [
        F(E(15, 31, 7 - hop * 0.4, 1.3, '#ddd0ec')),
        E(9, y + 2, 2.6, 1.6, WHITE), E(14, y, 8, 6, WHITE), E(7, y + 1, 2.6, 2.6, WHITE),
        E(20, y - 5, 5, 4.6, WHITE),
        E(18, y - 13 - hop * 0.2, 1.8, 5, LEAF), E(22.4, y - 12.6 - hop * 0.3, 1.8, 5, LEAF), F(E(18, y - 13, 0.7, 3.4, mix(LEAF, WHITE, 0.4))),
        ...bloom(22, y - 9, 2, BLOSSOM),
        ...face(21, y - 4.6, 1.6, f === 2 ? 'closed' : 'open', 'o', 0.9),
        E(10 + (hop > 0 ? 2 : 0), y + 5, 2.4, 1.2, '#f0e8f8'), E(20, y + 5, 2, 1.2, '#f0e8f8'),
      ];
    },
  },

  // ---------- Cosmetics ----------
  {
    id: 'blossom_crown', name: 'Blossom Hair Crown', kind: 'cosmetic', w: 34, h: 14, frames: 1,
    build: () => {
      const out = [T([[2, 10], [32, 10], [30, 12], [4, 12]], STEM)];
      for (let i = 0; i < 7; i++) out.push(...bloom(4 + i * 4.4, 8 - (i % 2) * 1.6, 2.4, i % 2 ? WHITE : SAKURA, i === 3 ? '#ff6b8a' : GOLD));
      out.push(E(5, 11.4, 2.4, 1, LEAF), E(29, 11.4, 2.4, 1, LEAF));
      return out;
    },
  },
  {
    id: 'blossom_wings', name: 'Blossom Fairy Wings', kind: 'cosmetic', w: 50, h: 34, frames: 6, fps: 8,
    build: (f) => {
      const flap = wave(f, 6, 3);
      const wing = (dir) => {
        const x0 = 25;
        return [
          T([[x0, 16], [x0 + dir * 10, 3 - flap], [x0 + dir * 23, 5 - flap], [x0 + dir * 21, 15], [x0 + dir * 8, 18]], mix(SAKURA, WHITE, 0.35)),
          T([[x0, 18], [x0 + dir * 9, 20], [x0 + dir * 17, 30 + flap * 0.4], [x0 + dir * 6, 28]], mix(BLOSSOM, WHITE, 0.4)),
          F(T([[x0 + dir * 4, 15], [x0 + dir * 17, 6 - flap], [x0 + dir * 18, 7.4 - flap], [x0 + dir * 5, 16.4]], WHITE)),
          ...bloom(x0 + dir * 15, 10 - flap * 0.6, 1.6, WHITE, GOLD),
        ];
      };
      const veins = [-1, 1].flatMap((d) => [F(T([[25, 16], [25 + d * 20, 6 - flap], [25 + d * 20.4, 6.6 - flap], [25, 16.6]], mix(SAKURA, '#ff8fb0', 0.4))), F(T([[25, 18], [25 + d * 14, 26 + flap * 0.3], [25 + d * 14.4, 26.6 + flap * 0.3], [25, 18.6]], mix(BLOSSOM, '#ff8fb0', 0.3)))]);
      return [...wing(-1), ...wing(1), ...veins, E(25, 17, 2.2, 3, GOLD), twinkle(10, 9 - flap, 1.2), twinkle(40, 9 - flap, 1.2)];
    },
  },
  {
    id: 'petal_parasol', name: 'Petal Parasol', kind: 'cosmetic', w: 36, h: 40, frames: 6, fps: 5,
    build: (f) => {
      const tw = wave(f, 6, 0.6);
      const out = [R(17.4, 12, 1.4, 26, '#f6e2c8'), T([[16.6, 36], [16.6, 40], [20, 38]], '#e8c8a0')];
      // A canopy of petal scallops, its frill swaying.
      out.push(T([[2, 16], [18, 2], [34, 16]], SAKURA));
      for (let i = 0; i < 5; i++) out.push(E(5.2 + i * 6.4, 16 + tw * (i % 2 ? 1 : -1), 3.4, 2.4, i % 2 ? BLOSSOM : SAKURA));
      out.push(F(T([[9, 12], [18, 4], [12, 13]], mix(SAKURA, WHITE, 0.5))), E(18, 2, 1.4, 1.4, GOLD), ...bloom(18, 10, 2.4, WHITE, '#ff6b8a'));
      return out;
    },
  },
];
