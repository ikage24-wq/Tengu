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
