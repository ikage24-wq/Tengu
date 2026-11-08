// The capsule machines' looks (data/outfits-gacha.js): each machine's own living set, drawn here
// (their moving effects, the pollen, petals, glints and fireflies, are drawn by render/gacha.js
// around the hero). `t` is the entry's index; each design is looked up by the entry's key and
// draws only the slots it dresses. Petal skirts swing with m.sway, wings beat with m.flap and lift
// with the hair spring.
import { R, E, T, F, mix } from '../pixel.js';
import { torsoPts, band, MID } from '../figure.js';
import { GACHA_LOOKS } from '../../data/outfits-gacha.js';

const WHITE = '#ffffff';
const LEAF = '#7fd17a';
const LEAF_D = '#4fae5f';
const LEAF_L = '#b8f0a8';
const DEW = '#a8e8ff';
const PETAL = ['#ffb7d3', '#ffd6e6', '#ffffff', '#ffe066', '#e2c6ff'];

const NAVY = '#2e4a7a';
const NAVY_D = '#1f3358';
const OIL = '#ffd23f';
const OIL_D = '#e0a820';
const RED = '#e8484a';
const BRASS = '#d8a440';
const CREAM = '#f4ecd8';

const rad = (a) => (a * Math.PI) / 180;
function arcPts(cx, cy, rx, ry, a0, a1, n = 16) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = rad(a0 + ((a1 - a0) * i) / n);
    return [cx + Math.cos(a) * rx, cy - Math.sin(a) * ry];
  });
}
// A leaf from (x, y) toward angle a (degrees, 0 = right, 90 = up), `len` long, `w` wide.
function leaf(x, y, a, len, w, c, vein = null) {
  const d = [Math.cos(rad(a)), -Math.sin(rad(a))];
  const n = [-d[1], d[0]];
  const at = (u, s) => [x + d[0] * len * u + n[0] * w * s, y + d[1] * len * u + n[1] * w * s];
  const out = [T([at(0, 0), at(0.3, 0.9), at(0.65, 0.8), at(1, 0), at(0.65, -0.8), at(0.3, -0.9)], c)];
  if (vein) out.push(F(T([at(0.05, 0.08), at(0.9, 0), at(0.05, -0.08)], vein)));
  return out;
}
// A little five-petal flower, open.
function flower(x, y, r, c, mid = '#ffe066') {
  const out = [];
  for (let k = 0; k < 5; k++) {
    const a = rad(90 + k * 72);
    out.push(E(x + Math.cos(a) * r, y - Math.sin(a) * r, r * 0.72, r * 0.72, c));
  }
  out.push(F(E(x, y, r * 0.55, r * 0.55, mid)), F(E(x - r * 0.2, y - r * 0.25, r * 0.2, r * 0.2, WHITE)));
  return out;
}
// A dewdrop gem: a teardrop of pale blue with a white glint.
const dew = (x, y, r) => [T([[x, y - r * 1.6], [x + r, y], [x + r * 0.6, y + r * 0.8], [x, y + r], [x - r * 0.6, y + r * 0.8], [x - r, y]], DEW), F(E(x - r * 0.3, y - r * 0.2, r * 0.3, r * 0.4, WHITE))];
// A petal hanging from (x, y), pointing down and a little out by `lean`.
const petal = (x, y, len, w, c, lean = 0) => T([[x - w, y], [x + w, y], [x + w * 0.8 + lean * 0.6, y + len * 0.7], [x + lean, y + len], [x - w * 0.8 + lean * 0.6, y + len * 0.7]], c);

const D = {
  // A circlet of twisted vine round the brow, crowned with open flowers (pink, white, buttercup,
  // lilac) and leaves, a dewdrop hanging at the front.
  bloomcrown: {
    hat: (p, m) => {
      const k = m.hair * 0.3;
      const ring = arcPts(15.5, 6.6, 12.6, 3.4, 0, 180, 18);
      const out = [];
      // The vine: a back strand and a front strand twisting round each other.
      out.push(T([...ring, ...ring.slice().reverse().map(([x, y]) => [x, y + 1.6])], LEAF_D));
      out.push(F(T([...arcPts(15.5, 7.4, 12.8, 3, 200, 340, 12), ...arcPts(15.5, 8.6, 12.4, 2.6, 340, 200, 12)], LEAF)));
      for (const [x, y, a] of [[4.2, 6, 160], [8.2, 3.6, 120], [22.8, 3.6, 60], [26.8, 6, 20], [12, 2.6, 100], [19, 2.6, 80]]) out.push(...leaf(x, y, a + k * 10, 3.6, 1.4, LEAF, LEAF_L));
      out.push(...flower(6.4, 4.4, 1.7, '#ffb7d3'), ...flower(10.6, 2.4, 1.9, WHITE), ...flower(15.5, 1.4 + k * 0.3, 2.4, '#ff9ec0'), ...flower(20.4, 2.4, 1.9, '#ffe066', '#ff9f3a'), ...flower(24.6, 4.4, 1.7, '#e2c6ff'));
      out.push(...dew(15.5, 9.4 + k * 0.4, 1));
      return out;
    },
  },

  // A dress of layered petals: a petal bodice in the dye colour with a leaf collar and a vine sash
  // with a rose, and a skirt of long overlapping petals in three tiers that swing as you move.
  petaldress: {
    top: (p) => {
      const body = torsoPts();
      const out = [T(body, p.main)];
      for (let row = 0; row < 3; row++) {
        for (let k = 0; k < 4; k++) {
          const x = 9.2 + k * 3.8 + (row % 2) * 1.9;
          const y = 28 + row * 2.6;
          out.push(F(E(x, y, 2.2, 1.6, row % 2 ? p.light : mix(p.main, WHITE, 0.2))));
        }
      }
      out.push(...leaf(11.6, 26.4, 200, 4, 1.4, LEAF), ...leaf(19.6, 26.4, -20, 4, 1.4, LEAF), ...leaf(MID, 26.6, 270, 3, 1.2, LEAF_D));
      out.push(band(body, 34, 35.4, LEAF_D), ...flower(19.8, 34.6, 1.4, '#ff9ec0'));
      return out;
    },
    skirt: (p, m) => {
      const s = m.sway * 0.5;
      const out = [];
      const tiers = [[45.6, 5.4, mix(p.main, '#ffffff', 0.45)], [43, 4.6, p.main], [39.6, 3.6, p.light]];
      for (const [len, fl, c] of tiers) {
        const n = 7;
        for (let i = 0; i < n; i++) {
          const x = 9.4 - fl + ((12 + fl * 2) * i) / (n - 1);
          out.push(petal(x, 34.6, len - 34.6, 2.2, i % 2 ? c : mix(c, WHITE, 0.25), (x - MID) * 0.12 + s));
        }
      }
      out.push(...[11, 15.5, 20].map((x) => F(E(x + s * 0.6, 44.6, 0.6, 0.6, '#ffe066'))));
      return out;
    },
    legs: () => ({ top: '#d6f5c6', low: '#d6f5c6', pad: null }),
  },

  // Vines wound round the hands and wrists, a leaf over the back of the hand, a bud at the cuff.
  vinebracers: {
    hand: (p, hx, hy, ex, ey) => {
      const l = Math.hypot(hx - ex, hy - ey) || 1;
      const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
      const wx = hx - ux * 2.6;
      const wy = hy - uy * 2.6;
      return [
        E(hx, hy, 1.9, 1.9, '#d6f5c6'),
        T([[wx - uy * 1.8, wy + ux * 1.8], [wx + uy * 1.8, wy - ux * 1.8], [hx + uy * 1.6, hy - ux * 1.6], [hx - uy * 1.6, hy + ux * 1.6]], LEAF),
        F(T([[wx - uy * 1.6 + ux * 0.6, wy + ux * 1.6 + uy * 0.6], [wx + uy * 1.6 + ux * 1.6, wy - ux * 1.6 + uy * 1.6], [wx + uy * 1.6 + ux * 2.2, wy - ux * 1.6 + uy * 2.2], [wx - uy * 1.6 + ux * 1.2, wy + ux * 1.6 + uy * 1.2]], LEAF_D)),
        ...leaf(hx, hy, Math.atan2(-uy, ux) * 57.3 + 30, 2.8, 1.1, LEAF_L),
        E(wx - uy * 1.6, wy + ux * 1.6, 0.9, 0.9, '#ff9ec0'), F(E(wx - uy * 1.6 - 0.2, wy + ux * 1.6 - 0.3, 0.3, 0.3, WHITE)),
      ];
    },
  },

  // Sandals of a single broad leaf, vine straps up the ankle, and a little flower at the toe.
  rootsandals: {
    shoe: (p, k) => [
      k.poly([[-3.6, 2.4], [-2.2, 0.6], [1.8, 0.2], [5.4, 1.4], [6.4, 2.8], [5, 3.6], [-2.6, 3.6]], k.tint(LEAF)),
      k.poly([[-2.4, 3.2], [5.4, 3.2], [5, 3.6], [-2.4, 3.6]], k.tint(LEAF_D)),
      k.poly([[-1.6, -2.4], [-0.6, -2.4], [1.4, 1], [0.4, 1]], k.tint(LEAF_D)), k.poly([[0.8, -1.2], [1.8, -1.2], [-0.4, 1.6], [-1.4, 1.6]], k.tint(LEAF_D)),
      k.dot(4.8, 1.4, 1, k.tint('#ff9ec0')), k.dot(4.8, 1.4, 0.45, '#ffe066'),
    ],
  },

  // Dewdrop gems on the cheeks, as if the morning dew had settled there, glinting.
  dewsparkle: {
    hat: () => [...dew(8.6, 21.2, 0.8), ...dew(22.4, 21.2, 0.8), F(E(6.8, 22.6, 0.35, 0.35, DEW)), F(E(24.2, 22.6, 0.35, 0.35, DEW))],
  },

  // The star prize: four see-through wings of new leaf, mint shading to white at the edges, veined
  // and set with dewdrops, beating (m.flap) and lifting with each step; a bloom at their root.
  dewwings: {
    cape: (p, m) => {
      const beat = m.flap ? 1 : 0;
      const lift = m.hair * 0.6 + m.sway * 0.2;
      const root = [8.6, 29.4];
      const wing = (len, w, a, c, edge) => {
        const ang = a + beat * 14 - lift * 6;
        const d = [Math.cos(rad(ang)), -Math.sin(rad(ang))];
        const n = [-d[1], d[0]];
        const at = (u, s) => [root[0] + d[0] * len * u + n[0] * w * s, root[1] + d[1] * len * u + n[1] * w * s];
        const out = [T([at(0, 0), at(0.25, 0.8), at(0.6, 1), at(0.92, 0.55), at(1, 0), at(0.85, -0.45), at(0.5, -0.6), at(0.2, -0.4)], edge)];
        out.push(T([at(0.06, 0), at(0.27, 0.6), at(0.6, 0.78), at(0.88, 0.42), at(0.92, 0), at(0.8, -0.3), at(0.5, -0.42), at(0.22, -0.26)], c));
        out.push(F(T([at(0.05, 0.05), at(0.95, 0), at(0.05, -0.05)], LEAF_D)));
        for (const u of [0.3, 0.5, 0.7]) out.push(F(T([at(u, 0), at(u + 0.2, 0.55), at(u + 0.17, 0.6), at(u - 0.02, 0.05)], mix(LEAF_D, c, 0.4))));
        // A blush of blossom pink at the tip, a white sheen across the upper edge, dewdrops along it.
        out.push(F(T([at(0.74, 0.5), at(0.92, 0.42), at(0.95, 0), at(0.84, -0.26), at(0.76, 0)], '#ffd6e6')));
        out.push(F(T([at(0.2, 0.62), at(0.6, 0.86), at(0.86, 0.48), at(0.6, 0.72)], '#ffffff')));
        out.push(...dew(...at(0.8, 0.1), 1.2), ...dew(...at(0.45, -0.3), 0.8));
        return out;
      };
      // Two big upper wings sweeping up and back, two smaller lower ones fanning down.
      return [
        ...wing(26, 9.6, 148, '#d2fae6', '#5fcf9c'),
        ...wing(18, 7, 208, '#e2fff0', '#7ad8ae'),
        ...wing(23, 8.4, 124, '#c2f4dc', '#4fbf8c'),
        ...wing(16, 6, 230, '#d2fae6', '#6fd3a4'),
        ...flower(root[0], root[1], 2.2, '#ff9ec0'),
      ];
    },
  },

  // ---- Pastel Harbor: the Lighthouse Keeper set ----

  // The star prize: a little red-and-white lighthouse standing on a navy knit beanie, its gallery
  // rail, its glass lamp room (the lamp turns and sweeps a beam: render/gacha.js) and a red dome.
  // It wobbles on the head with every step.
  lighthousecap: {
    hat: (p, m) => {
      const lean = m.hair * 0.5;
      // x at height y, leaning with the step (more at the top).
      const lx = (x, y) => x + lean * Math.max(0, (4 - y) / 20);
      const out = [];
      // The beanie: a ribbed cuff round the head, the crown under the tower.
      out.push(T([...arcPts(15.5, 7.2, 13, 4.6, 0, 180, 18), ...arcPts(15.5, 9, 13, 3.2, 180, 0, 18)], NAVY));
      for (let i = 0; i < 9; i++) {
        const [x, y] = arcPts(15.5, 8.2, 12.2, 3.8, 18 + i * 18, 18 + i * 18, 1)[0];
        out.push(F(T([[x - 0.3, y - 1], [x + 0.3, y - 1], [x + 0.3, y + 1], [x - 0.3, y + 1]], NAVY_D)));
      }
      out.push(T(arcPts(15.5, 3.8, 8.2, 3.2, 0, 180, 14), mix(NAVY, '#ffffff', 0.12)));
      // The tower: tapering, in red and white bands, a door and a round window.
      const tower = (y0, y1, c) => {
        const w0 = 3.6 - (3.8 - y0) * 0.07;
        const w1 = 3.6 - (3.8 - y1) * 0.07;
        return T([[lx(15.5 - w0, y0), y0], [lx(15.5 + w0, y0), y0], [lx(15.5 + w1, y1), y1], [lx(15.5 - w1, y1), y1]], c);
      };
      const bands = [[3.8, 0.6, RED], [0.6, -2.6, WHITE], [-2.6, -5.8, RED], [-5.8, -9, WHITE]];
      for (const [y0, y1, c] of bands) out.push(tower(y0, y1, c));
      out.push(F(T([[lx(14.4, 3.8), 3.8], [lx(16.6, 3.8), 3.8], [lx(16.6, 1.4), 1.4], [lx(15.5, 0.8), 0.8], [lx(14.4, 1.4), 1.4]], NAVY_D)));
      out.push(F(E(lx(15.5, -4.2), -4.2, 0.8, 0.8, NAVY_D)), F(E(lx(15.3, -4.4), -4.4, 0.35, 0.35, '#fff3c4')));
      // The gallery: a deck wider than the tower, its rail and posts.
      out.push(T([[lx(11.2, -9), -9], [lx(19.8, -9), -9], [lx(19.4, -10), -10], [lx(11.6, -10), -10]], NAVY_D));
      for (const x of [12, 13.9, 15.5, 17.1, 19]) out.push(F(T([[lx(x - 0.2, -10), -10], [lx(x + 0.2, -10), -10], [lx(x + 0.2, -11.6), -11.6], [lx(x - 0.2, -11.6), -11.6]], NAVY_D)));
      out.push(F(T([[lx(11.6, -11.4), -11.4], [lx(19.4, -11.4), -11.4], [lx(19.4, -11.9), -11.9], [lx(11.6, -11.9), -11.9]], NAVY_D)));
      // The lamp room: panes of glass, the lamp glowing inside, its frame.
      out.push(T([[lx(13.2, -10), -10], [lx(17.8, -10), -10], [lx(17.8, -14.4), -14.4], [lx(13.2, -14.4), -14.4]], '#fff6c8'));
      out.push(F(E(lx(15.5, -12.2), -12.2, 1.5, 1.5, '#ffd23f')), F(E(lx(15.2, -12.5), -12.5, 0.6, 0.6, WHITE)));
      for (const x of [13.2, 15.5, 17.8]) out.push(F(T([[lx(x - 0.22, -10), -10], [lx(x + 0.22, -10), -10], [lx(x + 0.22, -14.4), -14.4], [lx(x - 0.22, -14.4), -14.4]], NAVY_D)));
      // The dome, its ball on top, and a weathervane arrow.
      out.push(T(arcPts(lx(15.5, -14.4), -14.4, 3.2, 2.8, 0, 180, 12), RED), F(T(arcPts(lx(15, -14.6), -14.6, 1.6, 1.6, 100, 170, 5).concat([[lx(14, -14.6), -14.6]]), mix(RED, WHITE, 0.4))));
      out.push(F(E(lx(15.5, -17.6), -17.6, 0.7, 0.7, BRASS)), F(T([[lx(15.3, -17.6), -17.6], [lx(15.7, -17.6), -17.6], [lx(15.7, -19.4), -19.4], [lx(15.3, -19.4), -19.4]], BRASS)));
      out.push(F(T([[lx(13.6, -19), -19], [lx(17.4, -19), -19], [lx(17.4, -19.4), -19.4], [lx(13.6, -19.4), -19.4]], BRASS)), F(T([[lx(17.4, -18.6), -18.6], [lx(18.4, -19.2), -19.2], [lx(17.4, -19.8), -19.8]], BRASS)));
      return out;
    },
  },

  // A sou'wester-yellow oilskin raincoat: a high collar lined in navy, the hood bunched at the back
  // of the neck, three wooden toggles on navy loops, a pocket flap, and a long hem that swings, slit
  // at the front, over navy sailcloth trousers.
  oilskin: {
    top: (p) => {
      const body = torsoPts();
      const out = [T(body, OIL)];
      // The hood, bunched behind the neck.
      out.push(T([[8.4, 28.4], [8.6, 26.2], [10.4, 25], [13, 25.2], [12.6, 27.6], [10.4, 29]], OIL_D), F(T([[9.4, 27.6], [10.6, 26], [12, 26.2], [11.2, 27.8]], mix(OIL_D, '#a87410', 0.4))));
      // The collar: two flaps standing up, navy inside.
      out.push(T([[12.4, 25.8], [MID, 27.8], [MID - 0.4, 29], [12, 27.6]], NAVY), T([[18.8, 25.8], [MID, 27.8], [MID + 0.4, 29], [19.2, 27.6]], NAVY));
      out.push(T([[12.6, 26.4], [MID - 0.2, 28.2], [MID - 0.6, 29.2], [12.4, 28.2]], OIL_D), T([[18.6, 26.4], [MID + 0.2, 28.2], [MID + 0.6, 29.2], [18.8, 28.2]], OIL_D));
      // The front seam and the toggles.
      out.push(F(T([[MID - 0.25, 29], [MID + 0.25, 29], [MID + 0.25, 35.6], [MID - 0.25, 35.6]], OIL_D)));
      for (const y of [30.2, 32.2, 34.2]) out.push(F(T([[MID - 1.4, y - 0.25], [MID + 1.4, y - 0.25], [MID + 1.4, y + 0.25], [MID - 1.4, y + 0.25]], NAVY)), F(E(MID, y, 1.1, 0.5, '#a86a3a')), F(E(MID - 0.3, y - 0.2, 0.3, 0.2, '#e8b888')));
      // A pocket flap, a shine on the oilskin.
      out.push(F(T([[17.4, 32.6], [20.6, 32.6], [20.6, 33.6], [17.4, 33.6]], OIL_D)), F(T([[10.6, 29], [11.6, 28.6], [11, 33.6], [10.2, 33.8]], mix(OIL, WHITE, 0.45))));
      return out;
    },
    skirt: (p, m) => {
      const s = m.sway * 0.45;
      const out = [T([[9.5, 35], [21.5, 35], [23.4 + s, 42.6], [7.6 + s, 42.6]], OIL)];
      // The slit at the front, the hem band, the drip-line shine.
      out.push(F(T([[MID - 0.2, 38.6], [MID + 0.2, 38.6], [MID + 0.9 + s, 42.6], [MID - 0.9 + s, 42.6]], NAVY)));
      out.push(F(T([[7.8 + s, 41.4], [23.2 + s, 41.4], [23.4 + s, 42.6], [7.6 + s, 42.6]], OIL_D)));
      out.push(F(T([[10.2 + s * 0.4, 36], [11 + s * 0.4, 36], [9.6 + s, 41], [8.8 + s, 41]], mix(OIL, WHITE, 0.4))));
      return out;
    },
    legs: () => ({ top: NAVY, low: NAVY, pad: null }),
  },

  // Navy fisherman's mittens: a cable knit down the back, a ribbed cream cuff.
  knitmitts: {
    hand: (p, hx, hy, ex, ey) => {
      const l = Math.hypot(hx - ex, hy - ey) || 1;
      const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
      const wx = hx - ux * 2.2;
      const wy = hy - uy * 2.2;
      const out = [E(hx, hy, 2.1, 2.1, NAVY)];
      out.push(F(E(hx + ux * 0.2 - uy * 0.2, hy + uy * 0.2 + ux * 0.2, 0.7, 1.4, mix(NAVY, WHITE, 0.25))));
      out.push(T([[wx - uy * 2, wy + ux * 2], [wx + uy * 2, wy - ux * 2], [wx + uy * 1.9 + ux * 1.3, wy - ux * 1.9 + uy * 1.3], [wx - uy * 1.9 + ux * 1.3, wy + ux * 1.9 + uy * 1.3]], CREAM));
      for (const k of [-1, 0, 1]) out.push(F(T([[wx + uy * k * 1.2 - uy * 0.15, wy - ux * k * 1.2 + ux * 0.15], [wx + uy * k * 1.2 + uy * 0.15, wy - ux * k * 1.2 - ux * 0.15], [wx + uy * k * 1.2 + uy * 0.15 + ux * 1.2, wy - ux * k * 1.2 - ux * 0.15 + uy * 1.2], [wx + uy * k * 1.2 - uy * 0.15 + ux * 1.2, wy - ux * k * 1.2 + ux * 0.15 + uy * 1.2]], '#d8ccb0')));
      return out;
    },
  },

  // Tall yellow rubber wellies: a rounded toe, a red band at the top and a dark tread.
  puddleboots: {
    shoe: (p, k) => [
      k.poly([[-3, 3.6], [-3.2, -3.4], [1.6, -3.4], [1.8, 0.2], [4.6, 1], [6.2, 2.4], [6, 3.6]], k.tint(OIL)),
      k.poly([[-3.3, -3.4], [1.9, -3.4], [1.9, -2.2], [-3.3, -2.2]], k.tint(RED)),
      k.poly([[-3.2, 3.4], [6.2, 3.4], [6, 4.4], [-3, 4.4]], k.tint('#4a3a2a')),
      k.poly([[-2.4, -1.6], [-1.6, -1.6], [-1.8, 2.2], [-2.6, 2.2]], k.tint(mix(OIL, WHITE, 0.45))),
      k.dot(4.2, 1.8, 0.5, k.tint(OIL_D)),
    ],
  },

  // A little briar bubble pipe in the corner of the mouth (it blows soap bubbles: render/gacha.js).
  bubblepipe: {
    hat: () => [
      T([[18.6, 23.1], [19, 22.7], [23.2, 23.5], [23, 24.1]], '#6a4a2a'),
      T([[22.4, 21.4], [25.6, 21.4], [25.2, 24.2], [24, 24.8], [22.8, 24.2]], '#a86a3a'),
      F(T([[22.2, 21], [25.8, 21], [25.8, 21.6], [22.2, 21.6]], '#c88a50')),
      F(E(24, 21.3, 1.4, 0.35, '#e8f6ff')),
      F(T([[23, 22], [23.6, 22], [23.4, 23.8], [23, 23.6]], '#c88a50')),
    ],
  },

  // A navy fisherman's capelet with a rope clasp, and on a brass bracket at the back of the
  // shoulder a storm lantern hangs, swinging as you go: its cap and ring, its caged glass, the flame.
  stormlantern: {
    cape: (p, m) => {
      const out = [];
      out.push(T([[9, 26.6], [12.6, 26], [12, 33], [9.6, 34.2], [7.4, 33], [7.6, 28]], NAVY), F(T([[7.4, 32.4], [9.6, 33.6], [12, 32.4], [12, 33], [9.6, 34.2], [7.4, 33]], NAVY_D)));
      // The bracket: out from the shoulder, a hook at its end.
      out.push(T([[9.4, 27.4], [3.6, 26.4], [3.6, 27.2], [9.4, 28.2]], BRASS), F(E(3.6, 27.2, 0.6, 0.6, BRASS)));
      const sw = m.sway * 0.5 + (m.flap ? 0.15 : 0);
      const px = 3.6;
      const py = 27.6;
      const at = (dx, dy) => [px + dx * Math.cos(sw) - dy * Math.sin(sw), py + dx * Math.sin(sw) + dy * Math.cos(sw)];
      const quad = (pts, c) => T(pts.map(([dx, dy]) => at(dx, dy)), c);
      out.push(quad([[-0.2, 0], [0.2, 0], [0.2, 1.4], [-0.2, 1.4]], '#6a5a4a'));
      out.push(quad([[-1.2, 1.4], [1.2, 1.4], [1.6, 2.4], [-1.6, 2.4]], BRASS));
      out.push(quad([[-1.6, 2.4], [1.6, 2.4], [1.8, 7], [-1.8, 7]], '#fff1b8'));
      out.push(F(quad([[-0.6, 6.4], [0.6, 6.4], [0.3, 4.2], [0, 3.4], [-0.3, 4.2]], '#ff9a3a')), F(quad([[-0.3, 6.2], [0.3, 6.2], [0, 4.6]], '#fff6c8')));
      for (const dx of [-1.7, 0, 1.7]) out.push(F(quad([[dx - 0.18, 2.4], [dx + 0.18, 2.4], [dx + 0.18, 7], [dx - 0.18, 7]], NAVY_D)));
      out.push(quad([[-2, 7], [2, 7], [1.6, 8.2], [-1.6, 8.2]], BRASS), F(quad([[-1.2, 1.6], [-0.6, 1.6], [-0.6, 2.2], [-1.2, 2.2]], '#ffe8a0')));
      return out;
    },
  },
};

// ---------- The job-module interface ----------

const of = (t) => D[GACHA_LOOKS[t]?.key] ?? {};

export default {
  hat: (t, p, m) => of(t).hat?.(p, m) ?? [],
  hatBack: (t, p, m) => of(t).hatBack?.(p, m) ?? [],
  hatTucks: (t) => Boolean(of(t).tucks),
  hatHidesBangs: (t) => Boolean(of(t).bangs),
  top: (t, p, m) => of(t).top?.(p, m) ?? [T(torsoPts(), p.main)],
  sleeve: (t, p) => of(t).sleeve?.(p) ?? (GACHA_LOOKS[t]?.colors === false ? GACHA_LOOKS[t].color : p.main),
  longSleeves: () => false,
  shoulder: (t, p, side) => of(t).shoulder?.(p, side) ?? [],
  legs: (t, p, skin) => of(t).legs?.(p, skin) ?? { top: p.main, low: p.main, pad: null },
  skirt: (t, p, m) => of(t).skirt?.(p, m) ?? null,
  shoe: (t, p, k) => of(t).shoe?.(p, k) ?? [k.sole(k.tint(p.main))],
  hand: (t, p, hx, hy, ex, ey) => of(t).hand?.(p, hx, hy, ex, ey) ?? [E(hx, hy, 1.9, 1.9, p.main)],
  cape: (t, p, m) => of(t).cape?.(p, m) ?? [],
  capeFront: (t, p, m) => of(t).capeFront?.(p, m) ?? [],
  cover: () => [],
};
