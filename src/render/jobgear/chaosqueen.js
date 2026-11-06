// The Sorcerer's regalia (docs/design/mage-line.md, the remake): the pyro gremlin crowned herself
// queen of chaos. She keeps the Mage's battle coat, belt of vials and satchel (now her "royal
// treasury"), and in place of the scorched hat wears a crooked crown of jagged lightning points,
// set with her three element gems, sparks hopping between its points; behind her, a royal mantle
// with a tall standing collar and an ermine border (the tail spots are scorch marks). The crown and
// mantle grow grander up the tiers: a fourth point and floating sparks from Scholar, a taller collar
// and gold clasp chains from Archon, a train from Sunspire. Nothing comes down over her face.

import { E, T, F, mix } from '../pixel.js';
import { limb } from '../figure.js';
import battlemage from './battlemage.js';

const WHITE = '#ffffff';
const GOLD = '#ffd36a';
const GOLD_DK = '#c8902e';
const GOLD_LT = '#fff0b0';
const ERMINE = '#fbf6ee';
const SOOT = '#2e2632';
const GEMS = ['#ff8a3a', '#8fdcff', '#ffe066'];
const stage = (t) => (t < 2 ? 0 : t < 5 ? 1 : t < 9 ? 2 : t < 13 ? 3 : t < 17 ? 4 : 5);

// A point turned about the crown's middle by its tilt (it sits a little crooked, rakishly).
const tilt = (x, y, a = -0.14) => {
  const cx = 15.5;
  const cy = 6.5;
  return [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)];
};

function hat(t, p, m) {
  const s = stage(t);
  const bob = (m.hair ?? 0) * 0.3;
  const pts = (list) => list.map(([x, y]) => tilt(x, y + bob));
  const n = s >= 1 ? 5 : 4;
  const hw = 8.6;
  const base = 7.4;
  const out = [];
  // The jagged points: each one a little lightning bolt, the middle one tallest.
  const crownPts = [[15.5 - hw, base + 1.2], [15.5 + hw, base + 1.2]];
  for (let i = 0; i <= n * 2; i++) {
    const x = 15.5 + hw - (i * hw * 2) / (n * 2);
    const mid = 1 - Math.abs(i - n) / n;
    crownPts.push([x + (i % 2 ? 0.6 : 0), base - (i % 2 ? 1.6 : 4.2 + mid * (2.6 + s * 0.5))]);
  }
  out.push(T(pts(crownPts), GOLD), T(pts([[15.5 - hw, base - 0.4], [15.5 + hw, base - 0.4], [15.5 + hw, base + 1.2], [15.5 - hw, base + 1.2]]), GOLD_DK));
  out.push(F(T(pts([[15.5 - hw + 0.4, base - 0.2], [15.5 + hw - 0.4, base - 0.2], [15.5 + hw - 0.4, base + 0.3], [15.5 - hw + 0.4, base + 0.3]]), GOLD_LT)));
  // Her three element gems along the band, the fire one in the middle and biggest.
  [[11.4, 1], [15.5, 0], [19.6, 2]].forEach(([x, gi]) => {
    const [gx, gy] = tilt(x, base + 0.4 + bob);
    const r = gi === 0 ? 1.4 : 1.1;
    out.push(E(gx, gy, r + 0.3, r + 0.4, GOLD_DK), E(gx, gy, r, r * 1.1, GEMS[gi]), F(E(gx - r * 0.3, gy - r * 0.35, r * 0.35, r * 0.3, WHITE)));
  });
  // A little flame dancing on the tallest point.
  const [tx, ty] = tilt(15.5, base - 4.2 - (2.6 + s * 0.5) + bob);
  out.push(T([[tx - 1, ty], [tx + 1, ty], [tx + 0.3 - bob * 0.6, ty - 3], [tx - 0.2, ty - 1.4]], GEMS[0]), F(E(tx, ty - 0.6, 0.45, 0.6, GOLD_LT)));
  // Sparks hopping between the points (from Scholar).
  if (s >= 1) {
    const hop = m.sway ?? 0;
    for (const [x, y, c] of [[9.2, base - 4.6, GEMS[2]], [21.8, base - 4, GEMS[1]], [13, base - 7, GEMS[2]]].slice(0, s >= 3 ? 3 : 2)) {
      const [sx, sy] = tilt(x + hop * 0.2, y - Math.abs(hop) * 0.2 + bob);
      out.push(F(T([[sx, sy - 1], [sx + 0.4, sy - 0.2], [sx + 1, sy], [sx + 0.4, sy + 0.2], [sx, sy + 1], [sx - 0.4, sy + 0.2], [sx - 1, sy], [sx - 0.4, sy - 0.2]], c)));
    }
  }
  return out;
}

// Behind her head: the mantle's tall standing collar, fanned like a queen's, gold-edged.
function hatBack(t, p, m) {
  const s = stage(t);
  const h = 8 + Math.min(s, 4) * 1.4;
  const w = 13 + Math.min(s, 4) * 0.8;
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    const r = i % 2 ? 0.86 : 1;
    pts.push([15.5 + Math.cos(a) * w * r, 27 + Math.sin(a) * h * r - 6]);
  }
  return [T(pts.map(([x, y]) => [15.5 + (x - 15.5) * 1.08, 21 + (y - 21) * 1.08]), GOLD), T(pts, p.dark), T(pts.map(([x, y]) => [15.5 + (x - 15.5) * 0.78, 21 + (y - 21) * 0.78]), p.deep)];
}

// The royal mantle, hanging from her shoulders behind her, ermine along its hem (scorch-mark tail
// spots), its hem swinging; a train from Sunspire.
function cape(t, p, m) {
  const s = stage(t);
  const sw = m.sway ?? 0;
  const len = 46 + Math.min(s, 3) * 1.6 + (s >= 4 ? 4 : 0);
  const wd = 4 + s * 0.8;
  const hem = (y, k) => [[22.4 + wd * k + sw, y], [15.5 + sw * 1.2, y + 1.2 * k], [8.6 - wd * k + sw * 1.4, y + (s >= 4 ? 2 : 0)]];
  const body = [[9.4, 26], [21.6, 26], [23.4 + wd * 0.4, 36], ...hem(len, 1), [7.6 - wd * 0.4, 36]];
  const out = [T(body, p.main), T([[9.4, 26], [21.6, 26], [22.6, 32], [8.4, 32]], p.dark)];
  // The ermine band along the hem, with its dark tail spots.
  const band = [[23.4 + wd + sw, len - 3], ...hem(len + 1, 1).slice(1), [7.6 - wd + sw * 1.4, len - 3 + (s >= 4 ? 2 : 0)]];
  out.push(T([[22.4 + wd + sw, len - 3], [15.5 + sw * 1.2, len - 1.8], [8.6 - wd + sw * 1.4, len - 3 + (s >= 4 ? 2 : 0)], ...band.slice(1).reverse()], ERMINE));
  for (let i = 0; i < 4 + Math.min(s, 3); i++) {
    const u = (i + 0.5) / (4 + Math.min(s, 3));
    out.push(F(E(22.4 + wd - u * (13.8 + wd * 2) + sw * (1 + u * 0.4), len - 1 + Math.sin(u * Math.PI) * 1.2, 0.45, 0.8, SOOT)));
  }
  return out;
}

// Over the top: the ermine collar round her shoulders and a gold clasp with a fire gem; from the
// Archon, gold chains across.
function capeFront(t, p) {
  const s = stage(t);
  const out = [
    T([[9, 25], [22, 25], [22.6, 27.6], [19.4, 28.6], [15.5, 28], [11.6, 28.6], [8.4, 27.6]], ERMINE),
    F(E(11.4, 27, 0.4, 0.7, SOOT)), F(E(19.6, 27, 0.4, 0.7, SOOT)),
    E(15.5, 27.6, 1.5, 1.5, GOLD), F(E(15.5, 27.6, 0.9, 0.9, GEMS[0])), F(E(15.2, 27.3, 0.3, 0.3, WHITE)),
  ];
  if (s >= 3) out.push(F(limb(11, 28.4, 14.2, 28, 0.35, 0.35, GOLD)), F(limb(20, 28.4, 16.8, 28, 0.35, 0.35, GOLD)));
  return out;
}

export default {
  ...battlemage,
  hat, hatBack, hatTucks: () => false, hatHidesBangs: () => false,
  cape, capeFront,
};
