// The figure every outfit is drawn on, and the little helpers designs share: the torso, robe and
// dress outlines, bands and panels that follow them, limbs, and mirroring. Shapes are in body
// coordinates: a 30x56 chibi facing the screen, feet at y = 56 (see gear.js for landmarks).

import { E, T, F, shade } from './pixel.js';

export const GOLD = '#ffd66b';
export const SILVER = '#dfe6f5';
export const INK = '#3a2d4f';

// ---------- Body shape ----------
//
// One body for everyone, facing right (front = the right side): a soft, slightly rounded torso
// that is broad at the shoulders and eases in a little at the waist, on straight hips. It is
// wide enough to sit well under the big chibi head. Outlined down the front (top to bottom) and
// up the back.

export const FIGURE = {
  // Rounded, sloping shoulders and a straight, upright back (no hump behind the shoulders).
  front: [[18.6, 26.4], [20.2, 26.8], [21.3, 27.8], [21.7, 29.6], [21.5, 32], [21.3, 34.2], [21.5, 35.8]],
  back: [[9.5, 35.8], [9.7, 34.2], [9.8, 32], [9.7, 29.6], [9.9, 27.8], [10.9, 26.8], [12.4, 26.4]],
  hips: [[9.6, 34.6], [21.4, 34.6], [21.8, 37], [21.6, 39.8], [9.4, 39.8], [9.2, 37]],
};
export const torsoPts = () => [...FIGURE.front, ...FIGURE.back];
// Robes follow the figure to the waist, then flare past the hips.
export const robePts = () => {
  const { front, back } = FIGURE;
  return [...front.slice(0, -1), [21.6, 38], [22.2, 44.5], [8.8, 44.5], [9.6, 38], ...back.slice(1)];
};

// Dresses follow the figure to the waist, then flare out into a wide, swingy skirt.
export const dressPts = () => {
  const { front, back } = FIGURE;
  return [...front.slice(0, -1), [21.8, 35], [24, 40], [25.6, 44.5], [5.6, 44.5], [7.2, 40], [9.4, 35], ...back.slice(1)];
};

// Where a polygon's outline crosses row y: the leftmost and rightmost x.
export function rowSpan(pts, y) {
  const xs = [];
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y)) xs.push(xi + ((y - yi) * (xj - xi)) / (yj - yi));
  }
  return xs.length ? [Math.min(...xs), Math.max(...xs)] : null;
}

// A band across a shape from y0 to y1 that follows its curves (stripes, belts, hems).
export function band(pts, y0, y1, c) {
  const a = rowSpan(pts, y0);
  const b = rowSpan(pts, y1);
  if (!a || !b) return null;
  return T([[a[0], y0], [a[1], y0], [b[1], y1], [b[0], y1]], c);
}

// The part of a shape left (keep < 0) or right (keep > 0) of x, for panels and side pieces.
export function side(pts, x, keep, c) {
  const inside = ([px]) => (keep < 0 ? px <= x : px >= x);
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    if (inside(a)) out.push(a);
    if (inside(a) !== inside(b)) out.push([x, a[1] + ((x - a[0]) * (b[1] - a[1])) / (b[0] - a[0])]);
  }
  return T(out, c);
}

// The body faces the screen, so necklines and fronts are centered on x = MID.
export const MID = 15.6;
export const collar = (c) => T([[MID - 2.6, 26.2], [MID + 2.6, 26.2], [MID, 29.2]], c);
// A small two-loop bow centered at (x, y).
export const tieBow = (x, y, c) => [T([[x, y], [x - 2, y - 1.2], [x - 2, y + 1.2]], c), T([[x, y], [x + 2, y - 1.2], [x + 2, y + 1.2]], c), F(E(x, y, 0.7, 0.7, shade(c, -20)))];
export const button = (x, y, c) => F(E(x, y, 0.45, 0.45, c));

// A tapered limb from (x1, y1) to (x2, y2), w1 wide at the start and w2 at the end.
export function limb(x1, y1, x2, y2, w1, w2, c) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  return T([[x1 + (nx * w1) / 2, y1 + (ny * w1) / 2], [x2 + (nx * w2) / 2, y2 + (ny * w2) / 2], [x2 - (nx * w2) / 2, y2 - (ny * w2) / 2], [x1 - (nx * w1) / 2, y1 - (ny * w1) / 2]], c);
}

// Two-bone reach: the middle joint for a limb of lengths a and b from root to target. The
// target is pulled in if it's out of reach. bend = 1 puts the joint ahead of the line (knees),
// -1 behind it (elbows). Returns [joint, end].
export function reach(rx, ry, tx, ty, a, b, bend) {
  let dx = tx - rx;
  let dy = ty - ry;
  let d = Math.hypot(dx, dy) || 0.001;
  const max = a + b - 0.001;
  if (d > max) {
    dx *= max / d;
    dy *= max / d;
    d = max;
  }
  const ux = dx / d;
  const uy = dy / d;
  const along = (a * a - b * b + d * d) / (2 * d);
  const off = Math.sqrt(Math.max(0, a * a - along * along)) * bend;
  return [[rx + ux * along + uy * off, ry + uy * along - ux * off], [rx + dx, ry + dy]];
}

// Mirrors shapes across the body's center line, for pairs of wings.
export const mirrorX = (shapes) => shapes.map((sh) => (sh.t === 'p' ? { ...sh, x: 0, pts: sh.pts.map(([px, py]) => [31 - sh.x - px, py]) } : { ...sh, x: 31 - sh.x - (sh.w ?? 0) }));

