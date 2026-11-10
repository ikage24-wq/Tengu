// The capsule machines' looks (data/outfits-gacha.js): each machine's own living set, drawn here
// (their moving effects, the pollen, petals, glints and fireflies, are drawn by render/gacha.js
// around the hero). `t` is the entry's index; each design is looked up by the entry's key and
// draws only the slots it dresses. Petal skirts swing with m.sway, wings beat with m.flap and lift
// with the hair spring.
import { R, E, T, F, mix } from '../pixel.js';
import { torsoPts, band, MID } from '../figure.js';
import { GACHA_LOOKS, COLOURWAYS } from '../../data/outfits-gacha.js';
import { recolour, recolourShapes } from '../../core/colourway.js';

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
const LEATHER = '#8a5a3a';
const LEATHER_D = '#5e3c26';
const LEATHER_L = '#b07a52';
const IRON = '#5a5f6e';
const IRON_L = '#8a90a0';
const IRON_D = '#3a3e48';
const HOT = '#ff7a2a';
const HOT_CORE = '#ffd23f';
const OBS = '#2a2232';
const OBS_L = '#463a56';
const OBS_D = '#16121c';
const GOLD2 = '#ffcf4a';
const GOLD_D = '#c8902e';
const LAVA = '#ff5a1a';
const CORE = '#fff0a0';
const PLUM = '#5a2a6a';
const PLUM_D = '#3e1a4a';
const PLUM_L = '#7a4a8a';
const TEAL_V = '#1f6a6a';
const TEAL_L = '#3a8a8a';
const CRIMSON = '#a8283a';
const STRAW = '#e0c070';
const STRAW_D = '#b89040';
const STRAW_L = '#f4dc98';
const CLOAK = '#6a5a3a';
const CLOAK_D = '#4a3e28';
const CLOAK_L = '#8a7a52';
const TUNIC = '#d8c8a0';
const SCARF = '#c8502a';
const MOTH = '#2a2c6a';
const MOTH_L = '#4a54a8';
const MOTH_D = '#1a1a48';
const CYAN = '#7ae8ff';
const CYAN_L = '#e8fcff';
const KOI_R = '#e8402a';
const KOI_RD = '#b82a1e';
const KOI_W = '#fff6ee';
const KOI_G = '#ffcf4a';
const KOI_K = '#1a1a2a';
// A chain of little round beads along a curve from (x0, y0) through (cx, cy) to (x1, y1): a
// smooth stroke with no corners, thinning to its end.
function beadCurve(x0, y0, cx, cy, x1, y1, w, c, n = 9) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1;
    const y = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1;
    const r = w * (1 - u * 0.55);
    out.push(E(x, y, r, r, c));
  }
  return out;
}
const SILVER = '#e0e4f0';
const SILVER_D = '#a8acc8';
const FLUFF = '#fffaf2';

// A tiny four-point silver star at (x, y).
const twinkle4 = (x, y, r, c = '#e8f0ff') => T([[x, y - r], [x + r * 0.3, y - r * 0.3], [x + r, y], [x + r * 0.3, y + r * 0.3], [x, y + r], [x - r * 0.3, y + r * 0.3], [x - r, y], [x - r * 0.3, y - r * 0.3]], c);

// A feathery moth antenna from (x0, y0) curving through (cx, cy) to (x1, y1): a fine stem combed
// with little barbs on both sides, longest in the middle.
function frond(x0, y0, cx, cy, x1, y1, c, stem) {
  const out = [];
  const at = (u) => [(1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1];
  const n = 9;
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const [px, py] = at(u);
    const [qx, qy] = at(u + 0.02);
    const l = Math.hypot(qx - px, qy - py) || 1;
    const [nx, ny] = [-(qy - py) / l, (qx - px) / l];
    const len = 1.9 * Math.sin(Math.PI * u) + 0.4;
    for (const sd of [-1, 1]) out.push(T([[px, py], [px + nx * len * sd + (qx - px) * 6, py + ny * len * sd + (qy - py) * 6], [px + (qx - px) * 10, py + (qy - py) * 10]], c));
  }
  for (let i = 0; i < n; i++) {
    const [ax, ay] = at(i / n);
    const [bx, by] = at((i + 1) / n);
    out.push(F(T([[ax - 0.18, ay], [ax + 0.18, ay], [bx + 0.18, by], [bx - 0.18, by]], stem)));
  }
  return out;
}

// A crack of lava along `pts` (a glowing seam `w` wide with a bright core).
function vein(pts, w, c = LAVA, core = HOT_CORE) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const l = Math.hypot(x1 - x0, y1 - y0) || 1;
    const [nx, ny] = [(-(y1 - y0) / l) * w, ((x1 - x0) / l) * w];
    out.push(F(T([[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]], c)));
    out.push(F(T([[x0 + nx * 0.35, y0 + ny * 0.35], [x1 + nx * 0.35, y1 + ny * 0.35], [x1 - nx * 0.35, y1 - ny * 0.35], [x0 - nx * 0.35, y0 - ny * 0.35]], core)));
  }
  return out;
}

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

  // ---- Ember Crag: the Forge God set ----

  // Two great obsidian horns curving up from the temples, ringed in gold, their tips molten; and
  // above the head, floating free, a crown of molten gold: flame-shaped points, a lava gem.
  moltencrown: {
    hat: (p, m) => {
      const out = [];
      const horn = (sd) => {
        const X = (x) => (sd > 0 ? x : 31 - x);
        const pts = [[8.6, 6.6], [5, 8.4], [2.2, 4.6], [0.4, -0.6], [0.6, -5.8], [2, -1.4], [4.4, 2.8], [7.6, 4.4]];
        out.push(T(pts.map(([x, y]) => [X(x), y]), OBS));
        out.push(F(T([[X(7.4), 5], [X(5.8), 6.4], [X(3.6), 3.6], [X(5), 3.2]], OBS_L)));
        out.push(T([[X(1.1), -1.6], [X(2.6), -0.4], [X(2.3), 0.6], [X(0.8), -0.4]], GOLD2), T([[X(3.4), 3.2], [X(5.4), 4.6], [X(4.8), 5.6], [X(3), 4.4]], GOLD2));
        out.push(T([[X(0.5), -3.4], [X(0.6), -5.8], [X(1.6), -2.6], [X(1.4), -2.2]], LAVA), F(T([[X(0.6), -4.6], [X(0.6), -5.6], [X(1.1), -3.4]], CORE)));
      };
      horn(1);
      horn(-1);
      // The floating crown: its back half, the flame points, its front half with the gems.
      const cy = -4.4 - m.hair * 0.35;
      const cx = 15.5;
      out.push(T([...arcPts(cx, cy, 8.6, 2.2, 0, 180, 16), ...arcPts(cx, cy + 1.4, 8.6, 2.2, 180, 0, 16)], GOLD_D));
      [[-6.4, 3], [-3.4, 4.4], [0, 6.4], [3.4, 4.4], [6.4, 3]].forEach(([dx, h]) => {
        const x = cx + dx;
        const by = cy + 2.2 * Math.sqrt(Math.max(0, 1 - (dx / 8.6) ** 2)) - 0.4;
        out.push(T([[x - 1.3, by], [x - 0.5, by - h * 0.6], [x, by - h], [x + 0.5, by - h * 0.6], [x + 1.3, by]], GOLD2));
        out.push(F(T([[x - 0.6, by], [x, by - h * 0.7], [x + 0.6, by]], LAVA)), F(T([[x - 0.25, by], [x, by - h * 0.4], [x + 0.25, by]], CORE)));
      });
      out.push(T([...arcPts(cx, cy, 8.6, 2.2, 180, 360, 16), ...arcPts(cx, cy + 1.7, 8.6, 2.2, 360, 180, 16)], GOLD2));
      out.push(F(T([...arcPts(cx, cy + 0.5, 8.4, 2.1, 200, 340, 12), ...arcPts(cx, cy + 0.9, 8.4, 2.1, 340, 200, 12)], '#fff0b0')));
      out.push(E(cx, cy + 2.9, 1.3, 1.1, LAVA), F(E(cx - 0.3, cy + 2.6, 0.5, 0.4, CORE)));
      for (const dx of [-5, 5]) out.push(F(E(cx + dx, cy + 2.4, 0.6, 0.5, '#ff8a3a')));
      return out;
    },
  },

  // Obsidian plate armour with gold edges: a gold gorget, a breastplate split by lava veins that
  // run down to the belt, and at its heart a molten forge-heart in a gold setting; great
  // pauldrons with a molten-tipped spike; tassets over an ember-red cloth that glows at the hem.
  forgeplate: {
    top: (p) => {
      const body = torsoPts();
      const out = [T(body, OBS)];
      out.push(T([[11.2, 26.2], [19.8, 26.2], [19, 28], [12, 28]], GOLD2), F(T([[11.6, 27.4], [19.4, 27.4], [19, 28], [12, 28]], GOLD_D)));
      out.push(T([[10.4, 28.2], [20.8, 28.2], [20.4, 31.6], [MID, 32.8], [10.8, 31.6]], OBS_L));
      out.push(F(T([[10.8, 31.2], [MID, 32.4], [MID, 32.9], [10.8, 31.7]], GOLD_D)), F(T([[20.4, 31.2], [MID, 32.4], [MID, 32.9], [20.4, 31.7]], GOLD_D)));
      out.push(F(T([[11, 28.6], [12.2, 28.6], [11.6, 31], [11, 30.8]], '#5e5070')));
      out.push(...vein([[12, 28.8], [13.4, 30.2], [12.9, 32.4], [14.2, 34.4]], 0.3), ...vein([[19.4, 29], [18.2, 30.4], [18.8, 32.8], [17.4, 34.6]], 0.3), ...vein([[MID, 32.6], [MID - 0.4, 33.8], [MID + 0.2, 34.8]], 0.28));
      out.push(E(MID, 30.2, 2, 2, GOLD_D), E(MID, 30.2, 1.6, 1.6, GOLD2), E(MID, 30.2, 1.2, 1.2, LAVA), F(E(MID, 30.2, 0.7, 0.7, CORE)), F(E(MID - 0.4, 29.8, 0.25, 0.25, WHITE)));
      out.push(band(body, 34.6, 35.8, GOLD_D), F(E(MID, 35.2, 1.3, 0.9, GOLD2)), F(E(MID, 35.2, 0.6, 0.45, LAVA)));
      return out;
    },
    sleeve: () => OBS,
    shoulder: () => [
      E(0, 0.4, 4.6, 3.4, OBS), F(E(-0.8, -0.6, 2.4, 1.3, OBS_L)),
      F(T([...arcPts(0, 0.6, 4.4, 3, 190, 350, 10), ...arcPts(0, 1.4, 4.2, 2.8, 350, 190, 10)], GOLD2)),
      T([[-1.6, -1.8], [-0.4, -7], [1.4, -1.8]], OBS), T([[-0.9, -4.8], [-0.4, -7], [0.1, -4.8]], LAVA), F(T([[-0.6, -5.8], [-0.4, -6.8], [-0.2, -5.8]], CORE)),
      ...vein([[2.2, -0.2], [2.8, 1], [2.2, 2]], 0.25),
    ],
    skirt: (p, m) => {
      const s2 = m.sway * 0.45;
      const out = [];
      out.push(T([[13, 35.4], [18.2, 35.4], [18.8 + s2, 45.6], [MID + s2, 46.8], [12.4 + s2, 45.6]], '#7a1420'));
      out.push(F(T([[12.6 + s2, 44.4], [18.6 + s2, 44.4], [18.8 + s2, 45.6], [MID + s2, 46.8], [12.4 + s2, 45.6]], LAVA)), F(T([[13.6 + s2, 45.4], [17.6 + s2, 45.4], [MID + s2, 46.2]], HOT_CORE)));
      out.push(F(E(MID + s2 * 0.6, 39.6, 1.1, 1.1, GOLD2)), F(E(MID + s2 * 0.6, 39.6, 0.5, 0.5, '#7a1420')));
      for (const sd of [-1, 1]) {
        const X = (x) => (sd < 0 ? x : 31.2 - x);
        out.push(T([[X(9.4), 35.4], [X(13.4), 35.4], [X(13) + s2 * 0.6, 42], [X(8.8) + s2 * 0.6, 41]], OBS));
        out.push(F(T([[X(8.9) + s2 * 0.6, 40.4], [X(13) + s2 * 0.6, 41.4], [X(13) + s2 * 0.6, 42], [X(8.8) + s2 * 0.6, 41]], GOLD2)));
        out.push(...vein([[X(10.6), 36.4], [X(11.4) + s2 * 0.3, 38.4], [X(10.8) + s2 * 0.5, 40]], 0.25));
      }
      return out;
    },
    legs: () => ({ top: '#1f1a26', low: '#1f1a26', pad: null }),
  },

  // Obsidian gauntlets with a gold knuckle plate, lava cracks through them, a flared gold-rimmed cuff.
  magmagauntlets: {
    hand: (p, hx, hy, ex, ey) => {
      const l = Math.hypot(hx - ex, hy - ey) || 1;
      const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
      const wx = hx - ux * 2.2;
      const wy = hy - uy * 2.2;
      const out = [E(hx, hy, 2.4, 2.4, OBS)];
      out.push(T([[wx - uy * 2.8 - ux * 0.8, wy + ux * 2.8 - uy * 0.8], [wx + uy * 2.8 - ux * 0.8, wy - ux * 2.8 - uy * 0.8], [wx + uy * 2.1 + ux * 1.4, wy - ux * 2.1 + uy * 1.4], [wx - uy * 2.1 + ux * 1.4, wy + ux * 2.1 + uy * 1.4]], OBS_L));
      out.push(F(T([[wx - uy * 2.8 - ux * 0.8, wy + ux * 2.8 - uy * 0.8], [wx + uy * 2.8 - ux * 0.8, wy - ux * 2.8 - uy * 0.8], [wx + uy * 2.7 - ux * 0.2, wy - ux * 2.7 - uy * 0.2], [wx - uy * 2.7 - ux * 0.2, wy + ux * 2.7 - uy * 0.2]], GOLD2)));
      out.push(F(E(hx + ux * 1, hy + uy * 1, 1.5, 1.1, GOLD2)));
      out.push(...vein([[hx - uy * 1.6, hy + ux * 1.6], [hx - ux * 0.4, hy - uy * 0.4], [hx + uy * 1.4 - ux * 1, hy - ux * 1.4 - uy * 1]], 0.25));
      return out;
    },
  },

  // Obsidian greaves: a pointed gold toe cap, a gold ring at the ankle, a seam of lava along the sole.
  obsidiangreaves: {
    shoe: (p, k) => [
      k.poly([[-3.2, 3.6], [-3.6, -3.6], [1.8, -3.6], [2.2, 0], [5, 0.8], [7, 2.6], [6.6, 3.6]], k.tint(OBS)),
      k.poly([[2.6, 0.2], [5, 0.8], [7, 2.6], [6.6, 3.4], [2.8, 3.4]], k.tint(GOLD2)),
      k.poly([[3.2, 0.7], [4.8, 1.1], [4.4, 1.6], [3.2, 1.3]], k.tint('#fff0b0')),
      k.poly([[-3.7, -2.4], [2, -2.4], [2, -1.4], [-3.7, -1.4]], k.tint(GOLD_D)),
      k.poly([[-3.2, 3.2], [6.8, 3.2], [6.6, 3.8], [-3, 3.8]], k.tint(LAVA)),
      k.poly([[-3, 3.8], [6.6, 3.8], [6.4, 4.6], [-2.8, 4.6]], k.tint(OBS_D)),
      k.poly([[-2.6, -1], [-1.6, -1], [-1.9, 2.4], [-2.8, 2.4]], k.tint(OBS_L)),
    ],
  },

  // Forge runes painted in molten gold under the eyes: two strokes and a diamond on each cheek.
  runemarks: {
    hat: () => {
      const out = [];
      for (const [x, d] of [[8.6, -1], [22.4, 1]]) {
        out.push(T([[x - 1.6, 20.8], [x + 0.6, 21.1], [x + 0.5, 21.6], [x - 1.7, 21.3]], GOLD2), T([[x - 1.2, 22], [x + 0.9, 22.3], [x + 0.8, 22.8], [x - 1.3, 22.5]], GOLD2));
        out.push(T([[x + 1.6 * d, 21.2], [x + 2.2 * d, 21.8], [x + 1.6 * d, 22.4], [x + 1 * d, 21.8]], LAVA));
      }
      return out;
    },
  },

  // The star prize's mantle: a tattered crimson half-cape from the back of the shoulders, its
  // torn hem smouldering molten, held by a gold clasp. (The Godforge Hammer floating above it is
  // drawn live: render/gacha.js.)
  godhammer: {
    capeFront: () => [E(12.4, 27.2, 1.1, 1.1, GOLD2), F(E(12.4, 27.2, 0.5, 0.5, LAVA))],
    cape: (p, m) => {
      const s2 = m.sway * 0.6;
      const out = [T([[12.6, 26.2], [9, 26.8], [6, 32], [3.6 + s2 * 0.5, 39.6], [2.4 + s2, 45.4], [4.8 + s2, 43.4], [6.6 + s2, 46], [8.4 + s2, 43.6], [10.2 + s2, 45.4], [10.8, 36]], '#6a1420')];
      out.push(F(T([[11.6, 27], [9.6, 27.6], [7.4, 33], [6, 40], [8.6, 38], [10.2, 33]], '#8a1c2a')));
      for (const [x, y] of [[2.4, 45.4], [6.6, 46], [10.2, 45.4]]) out.push(F(T([[x + s2 - 1, y - 1.6], [x + s2, y], [x + s2 + 1, y - 1.6]], LAVA)), F(T([[x + s2 - 0.4, y - 1], [x + s2, y - 0.2], [x + s2 + 0.4, y - 1]], HOT_CORE)));
      return out;
    },
  },

  // ---- Coinbridge: the Wandering Peddler set ----

  // A wide-brimmed plum felt hat with a gold band and a coin crest, a long teal-and-gold plume,
  // and trinkets dangling from the brim on threads (a bell, a coin, a little lantern, a star
  // charm) that swing as you go.
  trinkethat: {
    // A brass compass worn as a hair clip at the temple, its needle pointing the way, a quill
    // tucked behind it, and hanging from it on a cord a little enchanted lantern bead that glows
    // (render/gacha.js), swinging as you go.
    hat: (p, m) => {
      const k = m.hair * 0.6;
      const out = [];
      // The quill, tucked in behind the clip and sweeping back.
      out.push(T([[24.4, 9.6], [26.4, 4.4], [29.2, 0.2], [30.2, 0.4], [28.6, 4], [25.6, 9.8]], '#f4ecd8'));
      out.push(F(T([[25, 9.4], [27.2, 4.4], [29.6, 0.6], [27.8, 4.6]], '#c8b890')), F(T([[29.2, 0.2], [30.2, 0.4], [29.6, 1.6]], '#5a4a7a')));
      // The compass: a brass case and ring, its face and needle, a glint.
      out.push(E(24.6, 10.4, 2.3, 2.3, GOLD_D), E(24.6, 10.4, 1.9, 1.9, GOLD2), E(24.6, 10.4, 1.4, 1.4, '#f4ecd8'));
      out.push(F(T([[24.6, 9.2], [25, 10.4], [24.2, 10.4]], CRIMSON)), F(T([[24.6, 11.6], [25, 10.4], [24.2, 10.4]], '#3a3e48')), F(E(24.6, 10.4, 0.25, 0.25, GOLD_D)));
      out.push(E(24.6, 7.9, 0.6, 0.5, GOLD2), F(E(23.8, 9.6, 0.4, 0.3, WHITE)));
      // The lantern bead on its cord.
      const lx = 25 + k * 0.8;
      out.push(F(T([[24.5, 12.6], [24.7, 12.6], [lx + 0.1, 15.4], [lx - 0.1, 15.4]], '#6a4228')));
      out.push(T([[lx - 0.8, 15.4], [lx + 0.8, 15.4], [lx + 0.8, 15.9], [lx - 0.8, 15.9]], GOLD_D), E(lx, 17, 0.9, 1.2, '#ffcf6a'), F(E(lx, 17, 0.45, 0.6, '#fff6d0')), T([[lx - 0.8, 18.1], [lx + 0.8, 18.1], [lx, 18.8]], GOLD_D));
      return out;
    },
  },

  // A hooded traveller's cloak, road-stained olive brown, its hood down and bunched at the back
  // of the neck, over a patched linen tunic; a woven scarf of red and gold wrapped at the throat,
  // its tail flying; a belt hung with pouches and a fat coin purse.
  merchantcoat: {
    top: (p) => {
      const body = torsoPts();
      const out = [T(body, TUNIC)];
      // The cloak over the shoulders and down the sides, open at the front.
      out.push(T([[9.6, 27.4], [11, 26.4], [13, 26.6], [12.4, 35.8], [9.4, 35.8]], CLOAK), T([[21.6, 27.4], [20.2, 26.4], [18.2, 26.6], [18.8, 35.8], [21.6, 35.8]], CLOAK));
      out.push(F(T([[10, 28], [11, 27.2], [11.4, 35.4], [10, 35.4]], CLOAK_L)), F(T([[12.2, 27.2], [12.8, 27], [12.4, 35.6], [11.8, 35.6]], CLOAK_D)), F(T([[18.4, 27], [19, 27.2], [19.4, 35.6], [18.8, 35.6]], CLOAK_D)));
      // The hood bunched behind the neck.
      out.push(T([[8.4, 28.6], [8.4, 26.2], [10.6, 24.8], [13.2, 25.2], [12.6, 27.6], [10.4, 29.2]], CLOAK_D));
      // Patches on the tunic, stitched.
      out.push(F(T([[13.6, 31.6], [16, 31.4], [16.2, 33.6], [13.8, 33.8]], '#a8584a')), F(T([[16.6, 28.8], [18.2, 28.8], [18.2, 30.4], [16.6, 30.4]], '#5a7a5a')));
      for (const [x, y] of [[13.9, 31.9], [15.8, 31.7], [14.1, 33.5], [15.9, 33.4]]) out.push(F(E(x, y, 0.16, 0.16, '#f4ecd8')));
      // The scarf wrapped round the throat, striped red and gold.
      out.push(T([[11.6, 25.8], [19.6, 25.8], [19.8, 28], [11.4, 28]], SCARF));
      for (const x of [12.6, 14.8, 17, 19]) out.push(F(T([[x, 25.8], [x + 0.8, 25.8], [x + 0.8, 28], [x, 28]], GOLD2)));
      out.push(T([[17.4, 27.6], [19.2, 27.4], [19.8, 31.8], [18.2, 32]], SCARF), F(T([[18, 29.4], [19.5, 29.3], [19.6, 30.1], [18.1, 30.2]], GOLD2)), F(T([[18.2, 31.6], [19.8, 31.6], [19.4, 32.6], [18.6, 32.6]], GOLD2)));
      // The belt, a pouch on it.
      out.push(band(body, 34.4, 35.6, '#5a3a24'), F(E(MID, 35, 0.8, 0.6, GOLD_D)));
      out.push(T([[10.6, 34.6], [12.6, 34.6], [12.6, 37.2], [10.6, 37.2]], '#8a5a3a'), F(T([[10.6, 34.6], [12.6, 34.6], [12.6, 35.4], [10.6, 35.4]], '#6a4228')));
      return out;
    },
    sleeve: () => TUNIC,
    shoulder: () => [E(0, 0.4, 3.9, 3.1, CLOAK), F(E(-0.6, -0.4, 1.8, 1, CLOAK_L)), F(T([[-3.6, 2], [3.6, 2], [3.2, 2.9], [-3.2, 2.9]], CLOAK_D))],
    skirt: (p, m) => {
      const s2 = m.sway * 0.55;
      const out = [];
      // The cloak's long hem behind, the tunic's patched hem in front, frayed at its edge.
      out.push(T([[9.4, 35.2], [12.6, 35.2], [11.6 + s2, 46], [6.6 + s2, 46.4]], CLOAK), T([[21.8, 35.2], [18.6, 35.2], [19.6 + s2, 46], [24.4 + s2, 46.4]], CLOAK));
      out.push(F(T([[6.6 + s2, 45.4], [11.6 + s2, 45.2], [11.6 + s2, 46], [6.6 + s2, 46.4]], CLOAK_D)), F(T([[19.6 + s2, 45.2], [24.4 + s2, 45.4], [24.4 + s2, 46.4], [19.6 + s2, 46]], CLOAK_D)));
      out.push(T([[12.4, 35.2], [18.8, 35.2], [19.4 + s2 * 0.6, 41.6], [11.8 + s2 * 0.6, 41.6]], TUNIC));
      for (let i = 0; i < 5; i++) out.push(F(T([[12 + i * 1.6 + s2 * 0.6, 41.4], [12.8 + i * 1.6 + s2 * 0.6, 41.4], [12.4 + i * 1.6 + s2 * 0.6, 42.4]], TUNIC)));
      out.push(F(T([[14.6 + s2 * 0.5, 37.4], [16.6 + s2 * 0.5, 37.4], [16.6 + s2 * 0.5, 39.2], [14.6 + s2 * 0.5, 39.2]], '#5a7a5a')));
      // The coin purse at the hip.
      const ps = s2 * 1.6;
      out.push(T([[19.4, 35.8], [19.8, 35.8], [20.2 + ps * 0.4, 37.4], [19.8 + ps * 0.4, 37.4]], '#5a3a24'));
      out.push(E(20.2 + ps * 0.5, 39.6, 2.4, 2.2, '#8a5a3a'), F(E(19.6 + ps * 0.5, 39, 1, 0.8, '#b07a52')));
      out.push(F(T([[18.6 + ps * 0.5, 37.8], [21.8 + ps * 0.5, 37.8], [21.4 + ps * 0.5, 38.6], [19 + ps * 0.5, 38.6]], '#c8a060')), F(E(20.8 + ps * 0.5, 37.6, 0.8, 0.5, GOLD2)));
      return out;
    },
    legs: () => ({ top: '#5a4a34', low: '#7a6a4a', pad: null }),
  },

  // Worn leather road gloves with wraps of linen round the wrists (a coin walks the knuckles:
  // render/gacha.js).
  coingloves: {
    hand: (p, hx, hy, ex, ey) => {
      const l = Math.hypot(hx - ex, hy - ey) || 1;
      const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
      const wx = hx - ux * 2.2;
      const wy = hy - uy * 2.2;
      return [
        E(hx, hy, 2.1, 2.1, '#8a5a3a'),
        F(E(hx - uy * 0.5 - ux * 0.4, hy + ux * 0.5 - uy * 0.4, 0.9, 1.2, '#b07a52')),
        T([[wx - uy * 2, wy + ux * 2], [wx + uy * 2, wy - ux * 2], [wx + uy * 1.9 + ux * 1.4, wy - ux * 1.9 + uy * 1.4], [wx - uy * 1.9 + ux * 1.4, wy + ux * 1.9 + uy * 1.4]], TUNIC),
        F(T([[wx - uy * 2 + ux * 0.5, wy + ux * 2 + uy * 0.5], [wx + uy * 2 + ux * 0.9, wy - ux * 2 + uy * 0.9], [wx + uy * 2 + ux * 1.2, wy - ux * 2 + uy * 1.2], [wx - uy * 2 + ux * 0.8, wy + ux * 2 + uy * 0.8]], '#b8a880')),
        F(E(hx + ux * 1.3 + uy * 0.6, hy + uy * 1.3 - ux * 0.6, 0.45, 0.45, GOLD2)),
      ];
    },
  },

  // Road-worn boots, scuffed brown, wound with leg wraps, a patch on the toe and a little bell.
  wayfarerboots: {
    shoe: (p, k) => [
      k.poly([[-3.2, 3.6], [-3.6, -3.8], [1.8, -3.8], [2, 0.2], [4.8, 0.8], [6.4, 2.4], [6.2, 3.6]], k.tint('#6a4a30')),
      k.poly([[-3.7, -3.8], [1.9, -3.8], [1.9, -3.1], [-3.7, -3.1]], k.tint(TUNIC)),
      k.poly([[-3.7, -2.4], [1.9, -1.8], [1.9, -1.1], [-3.7, -1.7]], k.tint(TUNIC)),
      k.poly([[-3.6, -0.6], [1.9, -0.2], [1.9, 0.4], [-3.6, 0.1]], k.tint(TUNIC)),
      k.poly([[3.4, 0.8], [5, 1.1], [5.4, 2.4], [3.6, 2.4]], k.tint('#5a7a5a')),
      k.poly([[-3.4, 3.4], [6.4, 3.4], [6.2, 4.6], [-3.2, 4.6]], k.tint('#3a2a1a')),
      k.dot(-3.4, 0.9, 0.7, k.tint(GOLD2)),
    ],
  },

  appraisermonocle: {
    // Big round gold glasses, cute and oversized: thick rounded rims over both eyes, a curved
    // bridge, two shines across each lens, and a little gold star at each outer corner.
    hat: () => {
      const out = [];
      const ring = (cx, r) => arcPts(cx, 19, r, r, 0, 360, 24);
      for (const [cx, d] of [[10.2, -1], [20.8, 1]]) {
        out.push(T([...ring(cx, 4.5), ...ring(cx, 3.6).reverse()], GOLD_D));
        out.push(T([...ring(cx, 4.3), ...ring(cx, 3.8).reverse()], GOLD2));
        out.push(F(T([...arcPts(cx, 19, 4.2, 4.2, 35, 130, 8), ...arcPts(cx, 19, 3.85, 3.85, 130, 35, 8)], '#fff0b0')));
        // The shines: a broad stroke and a thin one across the lens.
        out.push(F(T([[cx - 2.6, 17.4], [cx - 1.4, 16.2], [cx + 0.2, 17.6], [cx - 1, 18.8]], '#ffffff')), F(T([[cx + 0.6, 18.4], [cx + 1.1, 17.9], [cx + 1.9, 18.8], [cx + 1.4, 19.3]], '#ffffff')));
        // A little star at the outer corner.
        const sx = cx + d * 4.4;
        out.push(T([[sx, 14.2], [sx + 0.45, 15.3], [sx + 1.5, 15.5], [sx + 0.45, 15.8], [sx, 16.9], [sx - 0.45, 15.8], [sx - 1.5, 15.5], [sx - 0.45, 15.3]], GOLD2));
      }
      out.push(T([...arcPts(15.5, 18.6, 1.4, 1, 20, 160, 8), ...arcPts(15.5, 18.6, 1.4, 0.4, 160, 20, 8)], GOLD2));
      out.push(T([[5.8, 18.4], [3.8, 17.6], [3.8, 18.4], [5.8, 19.2]], GOLD_D), T([[25.2, 18.4], [27.2, 17.6], [27.2, 18.4], [25.2, 19.2]], GOLD_D));
      return out;
    },
  },

  // The star prize's straps over the shoulders (The Wandering Market itself, the towering pack,
  // is drawn live and wobbles: render/gacha.js).
  marketpack: {
    capeFront: () => [
      T([[11.2, 26.6], [12.4, 26.4], [12.6, 33.4], [11.4, 33.4]], '#6a4228'), T([[19, 26.4], [20.2, 26.6], [20, 33.4], [18.8, 33.4]], '#6a4228'),
      F(E(11.9, 31, 0.6, 0.6, GOLD2)), F(E(19.5, 31, 0.6, 0.6, GOLD2)),
    ],
  },

  // ---- Moonleaf Grove: the Moon Moth Empress set ----

  // A fine silver tiara across the brow, a crescent moon set at its front among little gems, and
  // rising from it two great feathery moth antennae, swaying, each tipped with a moon pearl.
  mothtiara: {
    hat: (p, m) => {
      const k = m.hair * 0.8;
      const out = [];
      // (They sweep out to the sides and curl, the way a moth's do, not straight up.)
      out.push(...frond(12.6, 5, 8, -1.6, 1.6 - k, -2.6, SILVER, '#8a94c8'), ...frond(18.4, 5, 23, -1.6, 29.4 - k * 0.6, -2.6, SILVER, '#8a94c8'));
      for (const [x, y] of [[1.6 - k, -2.6], [29.4 - k * 0.6, -2.6]]) out.push(E(x, y, 1, 1, CYAN), F(E(x - 0.3, y - 0.3, 0.35, 0.35, WHITE)));
      out.push(T([...arcPts(15.5, 7.2, 12.6, 3.2, 0, 180, 18), ...arcPts(15.5, 8.4, 12.6, 3.2, 180, 0, 18)], SILVER));
      out.push(F(T([...arcPts(15.5, 7.2, 12.4, 3, 30, 150, 12), ...arcPts(15.5, 7.6, 12.4, 3, 150, 30, 12)], WHITE)));
      // The crescent at the front, gems either side.
      out.push(E(15.5, 3.6, 2.6, 2.6, '#e8f0ff'), E(16.6, 3, 2.1, 2.1, '#1f2050'), F(E(14.6, 3.2, 0.5, 0.5, WHITE)));
      for (const [x, y, c] of [[11.2, 4.8, CYAN], [19.8, 4.8, CYAN], [8, 6, '#4a54a8'], [23, 6, '#4a54a8']]) out.push(E(x, y, 0.8, 0.8, c), F(E(x - 0.25, y - 0.25, 0.25, 0.25, WHITE)));
      return out;
    },
  },

  // A fitted moth-silk tailcoat in midnight blue: a deep ruff of silver moth fluff at the collar
  // and shoulders, a crescent brooch, silver frogging across the chest and silver stars glittering
  // in the cloth; short in front over slim trousers striped in silver, and behind, long coattails
  // of overlapping wing-scales with a moon-eye on each, swinging as you go.
  mothsilkgown: {
    top: (p) => {
      const body = torsoPts();
      const out = [T(body, MOTH)];
      out.push(F(T([[10, 28], [11.4, 27.6], [11.8, 35.4], [9.8, 35.4]], MOTH_D)), F(T([[21.2, 28], [19.8, 27.6], [19.4, 35.4], [21.4, 35.4]], MOTH_D)));
      // The front opening and the frogging across it.
      out.push(F(T([[MID - 0.3, 28.6], [MID + 0.3, 28.6], [MID + 0.3, 35.6], [MID - 0.3, 35.6]], MOTH_D)));
      for (const y of [33.4, 34.8]) out.push(F(T([[MID - 2.4, y - 0.3], [MID + 2.4, y - 0.3], [MID + 2.4, y + 0.3], [MID - 2.4, y + 0.3]], SILVER)), F(E(MID - 2.4, y, 0.45, 0.45, SILVER)), F(E(MID + 2.4, y, 0.45, 0.45, SILVER)));
      for (const [x, y, r] of [[11.4, 32.4, 0.6], [19.8, 33.2, 0.6], [12.2, 34.6, 0.4]]) out.push(F(twinkle4(x, y, r)));
      out.push(band(body, 34.6, 35.6, SILVER), F(E(MID, 35.1, 0.6, 0.5, CYAN)));
      return out;
    },
    // The moth-fur mane, laid over the arms (gear.js topOverShapes).
    topOver: (p, m) => {
      // The moth-fur mane: a thick, soft ruff of fur round the throat and over the shoulders and
      // arms, layered deep to light, every tuft round (no points). It bounces and sways with each
      // step (m.hair, m.sway); render/gacha.js breathes and fluffs it up at rest.
      const out = [];
      const b = (m?.hair ?? 0) * 0.35;
      const sw = (m?.sway ?? 0) * 0.25;
      const tuft = (x, y, r, c, k) => {
        const dy = b * (0.6 + 0.4 * Math.sin(k * 1.7)) + Math.abs(sw) * 0.2;
        const dx = sw * (0.5 + 0.5 * Math.cos(k * 1.3));
        return [E(x + dx, y + dy, r, r * 0.92, c), E(x + dx - r * 0.35, y + dy + r * 0.7, r * 0.55, r * 0.5, c), E(x + dx + r * 0.4, y + dy + r * 0.65, r * 0.5, r * 0.48, c)];
      };
      for (let i = 0; i < 11; i++) out.push(...tuft(6.2 + i * 1.88, 29 + Math.sin((i / 10) * Math.PI) * 1.4, 2, '#a8b4e0', i));
      for (let i = 0; i < 10; i++) out.push(...tuft(7.2 + i * 1.86, 27.9 + Math.sin(((i + 0.5) / 10) * Math.PI) * 1.2, 2, '#d0d8f4', i + 3));
      for (let i = 0; i < 8; i++) out.push(...tuft(8.8 + i * 1.94, 26.6 + Math.sin(((i + 0.5) / 8) * Math.PI) * 0.7, 1.9, '#eef2ff', i + 7));
      for (const [x, y] of [[10.4, 26.4], [13.8, 27], [17.4, 27], [20.8, 26.4], [7.6, 28.6], [23.4, 28.6], [12, 29.4], [19.2, 29.6]]) out.push(F(E(x + sw * 0.6, y + b * 0.8, 0.8, 0.45, WHITE)));
      out.push(E(MID, 29.8 + b, 1.3, 1.3, '#e8f0ff'), E(MID + 0.6, 29.4 + b, 1, 1, MOTH), F(E(MID - 0.4, 29.6 + b, 0.3, 0.3, WHITE)), F(E(MID, 31 + b, 0.45, 0.45, CYAN)));
      return out;
    },
    sleeve: () => MOTH,
    // (No shoulder pieces: the fur mane runs over the shoulders on its own.)
    shoulder: () => [],
    skirt: (p, m) => {
      const s2 = m.sway * 0.6;
      const out = [];
      // The coattails behind: two long tails of wing-scales, a moon-eye on each, a silver edge.
      for (const [x0, x1, len, k] of [[9.2, 13.4, 46.4, 1], [12.6, 16.4, 44.6, 0.7]]) {
        const sw = s2 * k;
        out.push(T([[x0, 35.4], [x1, 35.4], [x1 - 0.6 + sw, len - 3], [x0 + 1.2 + sw, len], [x0 - 1.4 + sw, len - 2.6]], k === 1 ? MOTH : '#22245a'));
        for (let r = 0; r < 3; r++) for (let j = 0; j < 2; j++) out.push(F(E(x0 + 0.8 + j * 1.8 + sw * (r / 3), 37.6 + r * 2.6, 1.1, 1, r % 2 ? '#383e8a' : '#30347a')));
        out.push(F(T([[x0 - 1.4 + sw, len - 2.6], [x0 + 1.2 + sw, len], [x0 + 1.2 + sw, len - 0.6], [x0 - 1 + sw, len - 3]], SILVER)));
        if (k === 1) out.push(E(x0 + 1.4 + sw, 42, 1.2, 1.1, SILVER), E(x0 + 1.4 + sw, 42, 0.8, 0.75, CYAN), F(E(x0 + 1.6 + sw, 42.1, 0.35, 0.35, MOTH_D)));
      }
      // The short front, its silver hem, a star.
      out.push(T([[12.8, 35.4], [21.6, 35.4], [21.8, 37.8], [MID, 38.6], [12.6, 37.8]], MOTH));
      out.push(F(T([[12.6, 37.2], [MID, 38], [21.8, 37.2], [21.8, 37.8], [MID, 38.6], [12.6, 37.8]], SILVER)), F(twinkle4(19.4, 36.8, 0.5)));
      return out;
    },
    legs: () => ({ top: '#1f2050', low: '#1f2050', pad: null }),
  },

  // Long midnight silk gloves with a soft cuff of moth fluff.
  moonsilkgloves: {
    hand: (p, hx, hy, ex, ey) => {
      const l = Math.hypot(hx - ex, hy - ey) || 1;
      const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
      const wx = hx - ux * 2.8;
      const wy = hy - uy * 2.8;
      return [
        E(hx, hy, 2, 2, MOTH), F(E(hx - uy * 0.5 - ux * 0.4, hy + ux * 0.5 - uy * 0.4, 0.8, 1.1, MOTH_L)), F(twinkle4(hx + ux * 0.6, hy + uy * 0.6, 0.6)),
        E(wx - uy * 1.2, wy + ux * 1.2, 1.3, 1.3, '#e8ecff'), E(wx + uy * 1.2, wy - ux * 1.2, 1.3, 1.3, '#c8d0f0'), E(wx, wy, 1.4, 1.4, '#e8ecff'),
      ];
    },
  },

  // Silver slippers with pointed toes and a pom of moth fluff on each.
  moonstepslippers: {
    shoe: (p, k) => [
      k.poly([[-3, 3.6], [-3.4, 0.4], [-1.6, -0.8], [2, -0.2], [5, 1], [7, 2.6], [6.4, 3.6]], k.tint(SILVER)),
      k.poly([[-2.8, 0.6], [2, 0.2], [4.6, 1.2], [4.4, 1.8], [-2.8, 1.6]], k.tint(WHITE)),
      k.poly([[-3, 3.4], [6.6, 3.4], [6.4, 4.4], [-2.8, 4.4]], k.tint(MOTH)),
      k.dot(4.4, 0.6, 1.6, k.tint('#e8ecff')), k.dot(4.4, 0.6, 0.6, k.tint(CYAN)),
    ],
  },

  // A dusting of silver freckles across the cheeks, a soft lavender blush, and a tiny crescent
  // moon under one eye.
  moondustblush: {
    hat: () => {
      const out = [];
      for (const [cx, d] of [[8.8, -1], [22.2, 1]]) {
        out.push(F(E(cx, 21.6, 1.9, 0.9, '#c8c8f4')));
        for (const [dx, dy] of [[-1, -0.4], [0, 0.2], [1, -0.3], [0.4, -1]]) out.push(F(E(cx + dx, 21.2 + dy, 0.28, 0.28, '#e8f4ff')));
        if (d > 0) out.push(E(cx + 1.6, 19.8, 0.9, 0.9, CYAN), E(cx + 2, 19.5, 0.75, 0.75, '#c8c8f4'));
      }
      return out;
    },
  },

  // The star prize: the Moon Moth Wings are drawn live, opening and closing (render/gacha.js);
  // here only a soft silver clasp where they meet the back.
  moonmothwings: {
    capeFront: () => [F(E(10.6, 27.6, 1, 1, SILVER)), F(E(10.6, 27.6, 0.5, 0.5, CYAN))],
  },

  // ---- Lantern Lagoon: the Koi Dragon Angler set ----

  // A hair clip of a koi's fin at the temple: rounded rays fanning out, red shading to white at
  // their tips, a gold pearl at its root and a droplet bead hanging from it; it sways as you go.
  koifinclip: {
    hat: (p, m) => {
      const k = m.hair * 0.6;
      const out = [];
      const rays = [[-60, '#ffb08a'], [-25, KOI_R], [10, '#ff7a5a'], [45, KOI_R], [80, '#ffb08a']];
      for (const [a, c] of rays) {
        const r = ((a + k * 12) * Math.PI) / 180;
        const [dx, dy] = [Math.cos(r), -Math.sin(r)];
        out.push(E(24.4 + dx * 2.6, 9.4 + dy * 2.6 - 1, 2.2, 1.4, c), E(24.4 + dx * 4, 9.4 + dy * 4 - 1, 1.3, 1, KOI_W));
      }
      out.push(E(24.4, 9.2, 1.4, 1.4, KOI_G), F(E(24, 8.8, 0.45, 0.45, WHITE)));
      const bx = 24.6 + k * 0.8;
      out.push(...beadCurve(24.4, 10.6, 24.6, 12, bx, 13.4, 0.25, '#c8a060', 4), E(bx, 14.6, 0.9, 1.1, '#bff0ff'), F(E(bx - 0.3, 14.2, 0.3, 0.3, WHITE)));
      return out;
    },
  },

  // A coat of koi scales: white, with red patches like a kohaku koi and a gold one, the scales
  // drawn in soft rows, a red mandarin collar edged in gold, round gold frog buttons and a red
  // sash; behind, long coattails shaped like a koi's flowing tail fins over black trousers.
  koiscalecoat: {
    top: (p) => {
      const body = torsoPts();
      const out = [T(body, KOI_W)];
      // The scales: soft rows of little arcs.
      for (let r = 0; r < 4; r++) for (let j = 0; j < 5; j++) out.push(F(E(10.6 + j * 2.4 + (r % 2) * 1.2, 29 + r * 1.6, 1.1, 0.7, '#f4e4dc')));
      // The koi patches.
      out.push(F(E(11.4, 30.4, 2, 2.4, KOI_R)), F(E(19.8, 32.6, 2, 2.2, KOI_R)), F(E(18.8, 29.4, 1.2, 1, KOI_G)), F(E(12.2, 34, 1.1, 0.9, KOI_R)));
      // The collar, the frogging, the sash.
      out.push(E(12.6, 26.8, 2, 1.2, KOI_R), E(18.4, 26.8, 2, 1.2, KOI_R), F(E(12.6, 26.4, 1.8, 0.35, KOI_G)), F(E(18.4, 26.4, 1.8, 0.35, KOI_G)));
      for (const y of [29.6, 31.4, 33.2]) out.push(F(E(MID - 1.1, y, 0.7, 0.45, KOI_G)), F(E(MID + 1.1, y, 0.7, 0.45, KOI_G)), F(E(MID, y, 0.4, 0.4, KOI_RD)));
      out.push(band(body, 34.4, 35.8, KOI_R), F(E(MID + 2, 35.1, 0.9, 0.8, KOI_G)));
      return out;
    },
    sleeve: () => KOI_W,
    skirt: (p, m) => {
      const s2 = m.sway * 0.6;
      const out = [];
      // The tail-fin coattails: two great rounded lobes, red to white, with soft ray lines.
      for (const [x, len, c, k] of [[9.6, 46.6, KOI_R, 1], [12.4, 45, '#ff7a5a', 0.75]]) {
        const sw = s2 * k;
        out.push(E(x + sw * 0.6, 39.4, 2.4, 4.4, c), E(x - 0.8 + sw, len - 2.4, 2.6, 2.8, c), E(x + 1.8 + sw, len - 3.2, 2.2, 2.4, '#ff9a7a'));
        out.push(F(E(x - 0.8 + sw, len - 1.4, 1.8, 1.4, KOI_W)), F(E(x + 1.8 + sw, len - 2.2, 1.4, 1.1, KOI_W)));
        for (const dx of [-1, 0, 1]) out.push(F(E(x + dx * 0.9 + sw * 0.7, 41.6, 0.25, 2.4, '#fff0e6')));
      }
      // The short front, its gold hem.
      out.push(E(MID + 1.8, 36.4, 6.6, 2, KOI_W), F(E(MID + 1.8, 37.8, 6.4, 0.6, KOI_G)), F(E(18.6, 36.4, 1.4, 1, KOI_R)));
      return out;
    },
    legs: () => ({ top: KOI_K, low: KOI_K, pad: null }),
  },

  // Gauntlets of red koi scale, a gold rim and a rounded fin flaring at the wrist.
  koigauntlets: {
    hand: (p, hx, hy, ex, ey) => {
      const l = Math.hypot(hx - ex, hy - ey) || 1;
      const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
      const wx = hx - ux * 2.4;
      const wy = hy - uy * 2.4;
      return [
        E(wx - uy * 1.9 - ux * 0.6, wy + ux * 1.9 - uy * 0.6, 1.6, 1.1, '#ff9a7a'), F(E(wx - uy * 2.4 - ux * 1, wy + ux * 2.4 - uy * 1, 0.9, 0.6, KOI_W)),
        E(hx, hy, 2.2, 2.2, KOI_R), F(E(hx - uy * 0.6 - ux * 0.3, hy + ux * 0.6 - uy * 0.3, 0.8, 0.6, '#ff7a5a')), F(E(hx + uy * 0.6, hy - ux * 0.6, 0.7, 0.5, '#ff7a5a')),
        E(wx, wy, 2, 2, KOI_G), E(wx + ux * 0.4, wy + uy * 0.4, 1.7, 1.7, KOI_R),
      ];
    },
  },

  // Riverstone boots: black, smooth, a red stripe above the sole and a gold koi fin flaring at the ankle.
  riverboots: {
    shoe: (p, k) => [
      k.poly([[-3.2, 3.6], [-3.4, -3.4], [1.6, -3.4], [2, 0.2], [4.8, 0.8], [6.2, 2.2], [6, 3.6]], k.tint(KOI_K)),
      k.poly([[-3.4, 2.6], [6.1, 2.6], [6, 3.4], [-3.3, 3.4]], k.tint(KOI_R)),
      k.poly([[-3.3, 3.4], [6, 3.4], [5.8, 4.4], [-3.1, 4.4]], k.tint('#3a3a4a')),
      k.dot(-3.6, -2, 1.6, k.tint(KOI_G)), k.dot(-4.2, -0.8, 1.1, k.tint('#ffe08a')),
      k.dot(-1.2, -1.4, 0.5, k.tint('#3a3a5a')),
    ],
  },

  // Gold koi whiskers painted on the cheeks: two soft curving strokes each side, all round beads.
  koiwhiskers: {
    hat: () => [
      ...beadCurve(8.6, 21.2, 6.4, 21.8, 5, 23.6, 0.36, KOI_G, 8), ...beadCurve(8.8, 22.2, 7.2, 23.4, 6.6, 25, 0.3, KOI_G, 7),
      ...beadCurve(22.4, 21.2, 24.6, 21.8, 26, 23.6, 0.36, KOI_G, 8), ...beadCurve(22.2, 22.2, 23.8, 23.4, 24.4, 25, 0.3, KOI_G, 7),
    ],
  },

  // The star prize: the Koi Stream is drawn live, looping round you (render/gacha.js).
  koistream: {},
};

// ---------- The job-module interface ----------

const of = (t) => D[GACHA_LOOKS[t]?.key] ?? {};
// A shiny piece (its `shiny` variant) is drawn as usual, then repainted in its set's colourway.
const wayOf = (t, p) => (p?.variant === 'shiny' ? COLOURWAYS[GACHA_LOOKS[t]?.machine] ?? null : null);
const S = (t, p, shapes) => recolourShapes(shapes, wayOf(t, p));
const C1 = (t, p, c) => recolour(c, wayOf(t, p));

export default {
  hat: (t, p, m) => S(t, p, of(t).hat?.(p, m) ?? []),
  hatBack: (t, p, m) => S(t, p, of(t).hatBack?.(p, m) ?? []),
  hatTucks: (t) => Boolean(of(t).tucks),
  hatHidesBangs: (t) => Boolean(of(t).bangs),
  top: (t, p, m) => S(t, p, of(t).top?.(p, m) ?? [T(torsoPts(), p.main)]),
  sleeve: (t, p) => C1(t, p, of(t).sleeve?.(p) ?? (GACHA_LOOKS[t]?.colors === false ? GACHA_LOOKS[t].color : p.main)),
  longSleeves: () => false,
  shoulder: (t, p, side) => S(t, p, of(t).shoulder?.(p, side) ?? []),
  legs: (t, p, skin) => {
    const l = of(t).legs?.(p, skin) ?? { top: p.main, low: p.main, pad: null };
    return wayOf(t, p) ? { ...l, top: C1(t, p, l.top), low: C1(t, p, l.low), pad: Array.isArray(l.pad) ? S(t, p, l.pad) : C1(t, p, l.pad) } : l;
  },
  skirt: (t, p, m) => S(t, p, of(t).skirt?.(p, m) ?? null),
  shoe: (t, p, k) => S(t, p, of(t).shoe?.(p, k) ?? [k.sole(k.tint(p.main))]),
  hand: (t, p, hx, hy, ex, ey) => S(t, p, of(t).hand?.(p, hx, hy, ex, ey) ?? [E(hx, hy, 1.9, 1.9, p.main)]),
  cape: (t, p, m) => S(t, p, of(t).cape?.(p, m) ?? []),
  capeFront: (t, p, m) => S(t, p, of(t).capeFront?.(p, m) ?? []),
  topOver: (t, p, m) => S(t, p, of(t).topOver?.(p, m) ?? []),
  cover: () => [],
};
