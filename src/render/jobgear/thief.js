// Thief gear: a stylish rogue who climbs from a street pickpocket in a knotted bandana to the
// Shadow King. Stages by tier:
//   hat     0-4 bandanas and ninja wraps (a bandit mask from 2) · 5-9 hoods (peaked, cobra, raven)
//           · 10-14 hoods with a bold face mask, ears and fangs · 15-19 visages: horns, void
//           halo, ghost wisps, and a crown of shadow
//   top     0-4 tunic with a belt and pouch · 5-9 wrap-front garb with crossed straps · 10-14
//           shroud with a chest guard and an obi · 15-19 shadow shroud with a high collar and runes
//   bottom  pants with shin wraps, a belt flap from 5, hakama from 10 (zigzag and glowing at 15)
//   shoes   split-toe tabi, then wrapped tabi boots, then plated steps with spiked heels
//   gloves  bandage wraps, fingerless gloves with bracers, then armored gloves with knuckle
//           studs (glowing, with a star emblem and a bracer fin, at 15)
//   cape    a long scarf that streams behind with sway: one tail, then two, then three
//           tattered, glowing tails
// The thief is the one family whose masks cover the mouth and nose (never the eyes).

import { R, E, T, F, shade, mix } from '../pixel.js';
import { torsoPts, band, MID, limb } from '../figure.js';

const BANDAGE = '#efe4d2';
const LEATHER = '#7a5238';
const WHITE = '#ffffff';

// ---------- Small geometry helpers ----------

const rad = (a) => (a * Math.PI) / 180;
// Points along an ellipse from angle a0 to a1 (degrees, 0 = right, 90 = up).
function arcPts(cx, cy, rx, ry, a0, a1, n = 18) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n);
    out.push([cx + Math.cos(a) * rx, cy - Math.sin(a) * ry]);
  }
  return out;
}
// The band between two ellipses over an arc: hood rims, headbands, crowns.
const crescent = (o, inner, a0, a1, c) => T([...arcPts(...o, a0, a1), ...arcPts(...inner, a1, a0)], c);

// A ribbon along a wavy centerline from (x, y): it heads `ang` radians from straight down toward
// the back (-x), bending by `curl` along its length and rippling by `wave` (phase `ph`). Width
// tapers from w0 to w1; the end can be cut square, forked, or tattered. Returns [shape, centerline].
function ribbon(x, y, len, ang, curl, wave, ph, w0, w1, c, end = 'square', n = 7) {
  const pts = [[x, y]];
  for (let i = 1; i <= n; i++) {
    const s = i / n;
    const a = ang + curl * s + wave * Math.sin(ph + s * 5);
    const [px, py] = pts[i - 1];
    pts.push([px - Math.sin(a) * (len / n), py + Math.cos(a) * (len / n)]);
  }
  const left = [];
  const right = [];
  pts.forEach(([px, py], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(n, i + 1)];
    const l = Math.hypot(bx - ax, by - ay) || 1;
    const w = (w0 + (w1 - w0) * (i / n)) / 2;
    const nx = (-(by - ay) / l) * w;
    const ny = ((bx - ax) / l) * w;
    left.push([px + nx, py + ny]);
    right.push([px - nx, py - ny]);
  });
  const tip = pts[n];
  const [dx, dy] = [tip[0] - pts[n - 1][0], tip[1] - pts[n - 1][1]];
  const dl = Math.hypot(dx, dy) || 1;
  const fwd = (k) => [dx / dl * k, dy / dl * k];
  const L = left[n];
  const Rr = right[n];
  let cap = [];
  if (end === 'fork') {
    const [fx, fy] = fwd(-1.6);
    cap = [[tip[0] + fx, tip[1] + fy]];
  } else if (end === 'tatter') {
    // A ragged fringe: alternating long and short points across the end.
    cap = [0.2, 0.4, 0.6, 0.8].map((u, k) => {
      const [fx, fy] = fwd(k % 2 ? -0.6 : 1.8);
      return [L[0] + (Rr[0] - L[0]) * u + fx, L[1] + (Rr[1] - L[1]) * u + fy];
    });
  } else if (end === 'point') {
    const [fx, fy] = fwd(1.6);
    cap = [[tip[0] + fx, tip[1] + fy]];
  }
  return [T([...left, ...cap, ...right.reverse()], c), pts];
}

// ---------- Hats ----------
//
// Head landmarks: head center (15.5, 14.6) r 10, eyes y 15.6-20.8 at x 11.2 / 19.8, mouth y 21.7,
// chin y 24.8. Hoods frame the face with a crescent over the bangs; masks cover from y 21.

// How each tier's headgear is put together.
const HATS = [
  { wrap: 'bandana', tails: 4 },
  { wrap: 'bandana', tails: 6, stripe: 1 },
  { wrap: 'bandana', tails: 7, mask: 'bandit' },
  { wrap: 'ninja', tails: 8, mask: 'cloth' },
  { wrap: 'ninja', tails: 10, mask: 'cloth', plate: 1 },
  { hood: 'peak', mask: 'cloth' },
  { hood: 'peak', mask: 'cloth', fox: 1 },
  { hood: 'cobra', mask: 'fang' },
  { hood: 'raven', mask: 'cloth' },
  { hood: 'deep', mask: 'cloth', tails: 10, plate: 1 },
  { hood: 'tatter', mask: 'plate' },
  { hood: 'round', mask: 'plate', tails: 13, plate: 1 },
  { hood: 'round', mask: 'plate', ears: 'cat' },
  { hood: 'round', mask: 'fang', ears: 'wolf' },
  { hood: 'round', mask: 'plate', horns: 'small', moon: 1 },
  { hood: 'round', mask: 'glow', halo: 1, horns: 'small' },
  { hood: 'tatter', mask: 'glow', wisps: 1 },
  { hood: 'round', mask: 'glow', horns: 'big' },
  { hood: 'tatter', mask: 'fang', horns: 'big', crest: 1, tails: 12 },
  { hood: 'round', mask: 'glow', crown: 1, tails: 14 },
];

// The head's outline and the face opening a hood leaves.
const HOOD = [15.5, 13.4, 13.4, 12.9];
const OPENING = [15.5, 15.8, 9.6, 8.8];

// Knotted tails trailing from the side of the head, streaming back with the hair spring.
function knotTails(len, c, hair, k = 0) {
  const lift = Math.max(-1, Math.min(3, -hair));
  const ang = 0.95 + lift * 0.2;
  const a = ribbon(4.6, 9.6, len, ang, 0.35, 0.18, hair + k, 2.4, 1.6, c, 'fork', 5)[0];
  const b = ribbon(4.6, 10.4, len * 0.75, ang - 0.4, 0.3, 0.2, hair + 1.6 + k, 2.2, 1.4, shade(c, -10), 'fork', 4)[0];
  return [b, a, E(4.4, 9.8, 1.8, 1.7, c)];
}

// A cloth or plated mask over the mouth and nose: the lower face below y0, dipping under the chin.
function mask(kind, p) {
  const y0 = 21.1;
  const lower = arcPts(15.5, 18.4, 10.1, 7.2, 200, 340, 10).filter(([, y]) => y >= y0 - 0.01);
  const pts = [[5.6, y0], ...lower, [25.4, y0]];
  const c = kind === 'plate' || kind === 'glow' ? p.dark : kind === 'fang' ? p.deep : p.main;
  const out = [T(pts, c)];
  if (kind === 'bandit') out.push(T([[11, 24.6], [20, 24.6], [15.5, 28]], c), F(E(10, 22.6, 0.5, 0.5, p.light)), F(E(20.6, 23.4, 0.5, 0.5, p.light)), F(E(15.5, 25.6, 0.5, 0.5, p.light)));
  if (kind === 'cloth' || kind === 'bandit') out.push(F(R(6.2, y0, 18.6, 0.7, p.light)), F(T([[11.6, 23.4], [16, 22.8], [15.6, 23.4]], p.dark)), F(T([[14.6, 25], [19.6, 24], [19.2, 24.7]], p.dark)));
  if (kind === 'plate' || kind === 'glow') {
    // A lacquered half mask: a trim rim, cheek vents, and (glowing) seams.
    const seam = kind === 'glow' ? p.accent : p.trim;
    out.push(F(R(6, y0, 19, 0.8, p.trim)), F(R(9, 23, 2.6, 0.6, seam)), F(R(19.4, 23, 2.6, 0.6, seam)), F(R(15.1, 21.8, 0.8, 4, seam)));
  }
  if (kind === 'fang') out.push(F(R(6, y0, 19, 0.8, p.trim)), F(T([[11.6, 21.9], [13.4, 21.9], [12.5, 24.4]], WHITE)), F(T([[17.6, 21.9], [19.4, 21.9], [18.5, 24.4]], WHITE)), F(R(10.4, 21.9, 10.2, 0.5, p.accent)));
  return out;
}

// A metal forehead plate on a headband, with the tier's gem.
const plate = (p, y = 7.2) => [R(12.2, y, 6.6, 2.8, p.trim), F(R(12.8, y + 0.5, 5.4, 1.8, p.trimDark)), F(E(15.5, y + 1.4, 0.9, 0.9, p.accent))];

function hat(t, p, m) {
  const h = HATS[t];
  const hair = m.hair;
  const out = [];
  if (h.wrap) {
    // A bandana knotted at the side; the ninja wrap pulls lower and hides the hair.
    const low = h.wrap === 'ninja' ? 1.4 : 0;
    out.push(...knotTails(h.tails, p.main, hair));
    out.push(T([...arcPts(15.5, 9.8 + low * 0.4, 11.6, 9 + low * 0.6, 168, 12, 10), ...arcPts(15.5, 11.8 + low, 10.4, 3.2, 12, 168, 6)], p.main));
    out.push(crescent([15.5, 11.8 + low, 10.9, 3.6], [15.5, 11.8 + low, 10.4, 2.2], 168, 12, p.dark));
    if (t === 0) out.push(...[[11, 3.6], [16, 2.2], [20.6, 4], [13.4, 6.6], [18.6, 6.8], [8.6, 7.4], [22.6, 7.6]].map(([x, y]) => F(E(x, y, 0.6, 0.6, p.light))));
    if (h.stripe) out.push(crescent([15.5, 10.4, 11, 7.2], [15.5, 10.4, 11, 6], 160, 20, p.second));
    if (h.wrap === 'ninja') out.push(crescent([15.5, 12.4, 11.6, 5.4], [15.5, 12.4, 11.2, 3.6], 172, 8, p.second));
    if (h.plate) out.push(...plate(p, 6.4));
  }
  if (h.hood) {
    out.push(...hoodFront(t, h, p, hair));
    if (h.tails) out.push(...knotTails(h.tails, h.crown ? p.deep : p.second, hair, 1), crescent([15.5, 11.6, 11.4, 4.6], [15.5, 11.6, 11, 3], 168, 12, p.second));
    if (h.plate) out.push(...plate(p, 6.2));
  }
  if (h.mask) out.push(...mask(h.mask, p));
  return out;
}

function hoodFront(t, h, p, hair) {
  const out = [];
  const ear = (dir) => {
    // Cat ears perk up; wolf ears are taller and point outward.
    const tall = h.ears === 'wolf' ? 7.6 : 5.6;
    const x = 15.5 + dir * 6.6;
    const tip = [x + dir * (h.ears === 'wolf' ? 3.4 : 2.2) + hair * 0.3, 4.2 - tall];
    return [T([[x - 3, 5.4], tip, [x + 3, 5.4]], p.main), F(T([[x - 1.4, 4.8], [tip[0] - dir * 0.6, tip[1] + 2.2], [x + 1.4, 4.8]], h.ears === 'wolf' ? p.second : '#ffc2d6'))];
  };
  if (h.ears) out.push(...ear(-1), ...ear(1));
  if (h.horns) {
    // Horns curving out from the temples and up to a point (a quadratic curve that tapers),
    // with a glowing tip on the big ones.
    const big = h.horns === 'big';
    for (const dir of [-1, 1]) {
      const x = 15.5 + dir * 7.4;
      const [p1, p2] = big ? [[x + dir * 6.6, 1.6], [x + dir * 2.6, -7.4]] : [[x + dir * 4.4, 3.6], [x + dir * 3.6, -2.6]];
      const w = big ? 3.6 : 2.6;
      const left = [];
      const right = [];
      for (let i = 0; i <= 6; i++) {
        const u = i / 6;
        const bx = (1 - u) ** 2 * x + 2 * u * (1 - u) * p1[0] + u * u * p2[0];
        const by = (1 - u) ** 2 * 5.6 + 2 * u * (1 - u) * p1[1] + u * u * p2[1];
        const hw = (w / 2) * (1 - u * 0.92);
        left.push([bx - hw, by]);
        right.push([bx + hw, by]);
      }
      out.push(T([...left, ...right.reverse()], big ? p.deep : p.trimDark));
      const tipPts = [left[4], left[5], left[6], right[1], right[2]];
      out.push(F(T(tipPts, big ? p.accent : p.trim)));
    }
  }
  // The hood itself: a rim around the face, then the peak or crest on top.
  const tip = hair * 0.8;
  if (h.hood === 'peak' || h.hood === 'deep') {
    const tall = h.hood === 'deep' ? 6 : 3.4;
    out.push(T([[9, 4.6], [20.6, 3], [11 + tip - tall * 0.6, -1 - tall], [6.6, 2.6]], p.main), F(T([[11.8, 2.8], [10.6 + tip - tall * 0.6, -0.6 - tall], [9.4 + tip - tall * 0.6, -0.4 - tall], [9.8, 3.4]], p.light)));
  }
  if (h.hood === 'cobra') out.push(T([[3, 19], [1.4, 10], [5, 2.6], [15.5, 0.6], [26, 2.6], [29.6, 10], [28, 19]], p.main), ...[[2.4, 10], [28.6, 10], [8.4, 2.4], [22.6, 2.4]].map(([x, y]) => F(E(x, y, 1.1, 0.8, p.light))));
  if (h.hood === 'raven') {
    // A beak peak over the brow and fans of swept-back feathers at the temples.
    for (const dir of [-1, 1]) {
      for (const [a, l] of [[115, 8.4], [140, 9.4], [165, 7.6]]) {
        const x = 15.5 + dir * 9.4;
        const ang = rad(dir < 0 ? a : 180 - a);
        const [ux, uy] = [Math.cos(ang), -Math.sin(ang)];
        const tx = x + ux * l + (dir < 0 ? tip : -tip) * 0.5;
        const ty = 6 + uy * l;
        out.push(T([[x - uy * 1.3, 6 + ux * 1.3], [x + ux * l * 0.6 - uy * 1.6, 6 + uy * l * 0.6 + ux * 1.6], [tx, ty], [x + ux * l * 0.6 + uy * 1.2, 6 + uy * l * 0.6 - ux * 1.2], [x + uy * 1.3, 6 - ux * 1.3]], a === 140 ? p.dark : p.deep));
      }
    }
    out.push(T([[11.2, 4.4], [19.8, 4.4], [15.5, 10]], p.trimDark), F(T([[13.6, 5], [17.4, 5], [15.5, 7.8]], p.trim)));
  }
  if (h.halo) out.push(F(crescent([15.5, -2.6, 9.4, 3], [15.5, -2.6, 7.6, 1.8], 0, 360, p.accent)));
  if (h.wisps) for (const [x, s] of [[9.4, 1], [15.5, 1.3], [21.6, 1]]) out.push(T([[x - 2 * s, 3.4], [x + 2 * s, 3.4], [x + 0.8 * s + tip, -2.6 * s], [x + tip * 1.4, -5 * s], [x - 1.2 * s, -1.4 * s]], mix(p.accent, WHITE, 0.4)), F(E(x, 1.4, 0.9 * s, 1.4 * s, WHITE)));
  out.push(crescent(HOOD, OPENING, -38, 218, p.main));
  // The rim around the face opening: dark cloth early, trim later, a glowing edge at the top.
  const rim = t >= 15 ? p.accent : t >= 10 ? p.trim : p.dark;
  out.push(crescent([OPENING[0], OPENING[1], OPENING[2] + 1, OPENING[3] + 1], OPENING, -36, 216, rim));
  if (h.hood === 'tatter') {
    // Ragged points around the hood's outer edge.
    for (const a of [150, 175, 200, 5, 30]) {
      const [x, y] = arcPts(...HOOD, a, a, 0)[0];
      const poke = [Math.cos(rad(a)) * 2.4, -Math.sin(rad(a)) * 2.4];
      out.push(T([[x - 1.6 * Math.sin(rad(a)), y - 1.6 * Math.cos(rad(a))], [x + poke[0], y + poke[1] + 1.2], [x + 1.6 * Math.sin(rad(a)), y + 1.6 * Math.cos(rad(a))]], p.main));
    }
  }
  if (h.hood === 'cobra') out.push(F(T([[15.5, 1.6], [17, 3.8], [15.5, 5.6], [14, 3.8]], p.accent)));
  if (h.fox) out.push(...foxMask(p));
  if (h.moon) out.push(F(T([...arcPts(15.5, 3.6, 2.6, 2.6, 60, 300, 6), ...arcPts(16.8, 3.2, 2, 2.2, 290, 70, 6)], p.trim)));
  if (h.crest) for (const [x, y, s] of [[11.6, 2.6, 0.8], [15.5, 1.8, 1], [19.4, 2.6, 0.8]]) out.push(T([[x - 1.4 * s, y + 0.6], [x + tip * 0.4, y - 4.6 * s], [x + 1.4 * s, y + 0.6]], p.deep), F(E(x, y + 0.2, 0.5, 0.5, p.accent)));
  if (h.crown) {
    // A crown of shadow: tall dark spikes on a radiant band, a big gem at the center.
    const spikes = [[8, 3.6, 4.4], [11.6, 1.4, 6.8], [15.5, 0.6, 9.6], [19.4, 1.4, 6.8], [23, 3.6, 4.4]];
    for (const [x, y, hgt] of spikes) out.push(T([[x - 1.8, y + 1.4], [x + tip * 0.2, y - hgt], [x + 1.8, y + 1.4]], p.deep));
    out.push(crescent([15.5, 9.4, 9.2, 7.8], [15.5, 9.8, 8.8, 6.2], 158, 22, p.trim));
    for (const [x, y, hgt] of spikes) out.push(F(E(x, y - hgt * 0.35, 0.6, 0.9, p.accent)));
    out.push(F(T([[15.5, 1.4], [17, 3.4], [15.5, 5.2], [14, 3.4]], p.accent)), F(E(15, 2.8, 0.4, 0.5, WHITE)));
  }
  return out;
}

// A white fox mask worn tilted on the side of the hood (the Phantom's).
const foxMask = (p) => [
  T([[19.4, 3.4], [21, -1.6], [23.4, 2], [26.4, 0.4], [26.4, 4.6], [27, 8], [23.4, 10.4], [20, 8]], '#fbf6f0'),
  F(T([[21.2, 0.4], [22.4, 2.4], [21, 2.6]], '#ff8fa8')), F(T([[25.6, 1.6], [25.6, 3.6], [24.4, 3]], '#ff8fa8')),
  F(R(21.2, 5, 1.8, 0.6, p.accent)), F(R(24.2, 5, 1.8, 0.6, p.accent)), F(E(23.4, 8.2, 0.6, 0.4, '#e2788f')),
];

// Behind the head: the back of the hood and its cowl over the shoulders, or a wrap's knot.
function hatBack(t, p, m) {
  const h = HATS[t];
  if (h.wrap === 'bandana') return [];
  if (h.wrap === 'ninja') return [E(15.5, 13.6, 12.6, 12, p.main)];
  const tatter = h.hood === 'tatter';
  const out = [E(15.5, 13.8, 13.4, 12.9, p.main)];
  // The cowl drapes onto the shoulders; its hem sways a touch and is ragged on tattered hoods.
  const s = m.sway * 0.3;
  const hem = tatter
    ? [[23.2 + s, 25.4], [21.6 + s, 27.2], [19.4 + s, 25.8], [17.4 + s, 27.6], [15.4 + s, 26], [13.4 + s, 27.6], [11.4 + s, 25.8], [9.4 + s, 27.2], [7.8 + s, 25.4]]
    : [[23 + s, 25.6], [15.5 + s, 27.2], [8 + s, 25.6]];
  out.push(T([[5, 18], [26, 18], ...hem], p.main));
  if (t >= 10) out.push(T([[22.8 + s, 25], [15.5 + s, 26.4], [8.2 + s, 25], [8.4, 24.2], [22.6, 24.2]], t >= 15 ? p.accent : p.trim));
  if (h.hood === 'cobra') out.push(T([[3, 19], [1.4, 10], [5, 3.6], [26, 3.6], [29.6, 10], [28, 19]], p.dark));
  return out;
}

// ---------- Top ----------

function top(t, p) {
  const torso = torsoPts();
  const out = [T(torso, p.main)];
  if (t < 5) {
    // A simple tunic: a V neck over an under-shirt, a leather belt and a pouch.
    out.push(T([[MID - 2.8, 26.2], [MID + 2.8, 26.2], [MID, 30.6]], p.second), band(torso, 32.6, 34.8, LEATHER), F(R(MID - 1, 32.8, 2, 1.8, p.trim)), R(18, 32.4, 3, 3.2, shade(LEATHER, 10)));
    if (t >= 2) out.push(limb(10.4, 27, 20.6, 33, 1.6, 1.6, LEATHER));
    if (t >= 3) out.push(F(R(11.6, 31.6, 0.8, 2.4, '#dfe6f5')), F(R(13, 31.4, 0.8, 2.4, '#dfe6f5')));
    if (t >= 4) out.push(band(torso, 26.2, 27.4, p.dark));
    return out.filter(Boolean);
  }
  // From the Rogue on: a crossover wrap front (the left lapel over the right) and an obi sash.
  out.push(T([[MID - 3, 26.2], [MID + 3, 26.2], [MID + 1.6, 31.4]], p.second));
  out.push(T([[MID - 3.2, 26.2], [MID - 1.6, 26.2], [MID + 3.6, 33], [MID + 1.4, 33]], t >= 10 ? p.trim : p.dark));
  if (t < 10) {
    // Crossed straps with a buckle, and a pouch hanging on the sash.
    out.push(limb(10, 27, 21, 34, 1.7, 1.7, LEATHER), limb(21, 27, 10, 34, 1.7, 1.7, shade(LEATHER, -10)), F(R(MID - 1, 29.8, 2, 1.6, p.trim)));
    out.push(band(torso, 32.4, 35, p.secondDark), R(10.4, 33.6, 2.6, 2.6, LEATHER));
    if (t >= 7) out.push(F(E(MID, 30.6, 0.6, 0.6, p.accent)));
    if (t === 8) out.push(...[[11.4, 25.8], [14, 25.4], [17, 25.4], [19.6, 25.8]].map(([x, y]) => T([[x - 1.6, y], [x + 1.6, y], [x, y + 3.2]], p.deep)));
    if (t === 9) out.push(band(torso, 33.4, 34, p.accent));
    return out.filter(Boolean);
  }
  // Shrouds: a chest guard over the wrap and a wide obi with a knot and gem.
  out.push(T([[MID + 0.2, 27.4], [21.2, 28.4], [21.4, 32], [MID + 0.4, 32]], p.deep), F(R(MID + 0.6, 28, 4.6, 0.7, p.accent)));
  out.push(band(torso, 32, 35.6, p.second), band(torso, 33.4, 34.2, p.trim), E(10.6, 33.8, 1.8, 1.6, p.secondDark), F(E(MID, 33.8, 1, 1, p.accent)));
  if (t >= 12) out.push(limb(10, 27, 15, 32.4, 1.7, 1.7, p.deep));
  if (t >= 15) {
    // A high collar framing the neck and glowing runes.
    out.push(T([[10.4, 24.4], [12.4, 26.6], [18.8, 26.6], [20.8, 24.4], [21.6, 27.4], [9.6, 27.4]], p.deep), F(R(9.8, 26.6, 11.6, 0.6, p.accent)));
    out.push(F(T([[11.4, 29], [12.6, 30.4], [11.4, 31.8], [10.2, 30.4]], p.accent)));
  }
  if (t >= 17) out.push(F(R(MID + 1.2, 31, 3.8, 0.5, p.accent)), band(torso, 35, 35.8, p.accent));
  return out.filter(Boolean);
}

const sleeve = (t, p) => (t >= 10 ? p.dark : p.main);
const longSleeves = (t) => t >= 2;

// A little guard on each shoulder: a leather pad, then layered lacquered plates, then a
// spiked shadow pauldron with a gem.
function shoulder(t, p, s) {
  if (t < 5) return [];
  if (t < 10) return [E(0, 0.2, 2.6, 2.2, s > 0 ? LEATHER : p.dark), F(E(0, 1.4, 2.2, 0.5, p.trim))];
  const out = [E(0, 0.4, 3, 2.6, p.deep), T([[-3, 0.6], [3, 0.6], [2.8, 2.8], [-2.8, 2.8]], p.dark), F(R(-2.8, 2.2, 5.6, 0.6, p.trim))];
  if (t >= 15) out.push(T([[-1.4, -1.6], [s * 0.6, -5.4], [1.4, -1.6]], p.deep), F(E(0, -0.4, 0.8, 0.8, p.accent)));
  return out;
}

// ---------- Bottom ----------

function legs(t, p) {
  const wrap = t < 5 ? BANDAGE : t < 10 ? p.second : t < 15 ? p.secondDark : p.deep;
  return { top: p.dark, low: t >= 10 ? p.deep : p.dark, pad: t >= 10 ? p.dark : null, cuff: wrap };
}

function skirt(t, p, m) {
  const s = m.sway * 0.4;
  if (t < 5) return null;
  if (t < 10) {
    // A belt flap hanging at the front, with a dagger sheath on the hip from the Viper on.
    const out = [T([[MID - 2.2, 34.4], [MID + 2.2, 34.4], [MID + 2.6 + s, 41.4], [MID - 2.6 + s, 41.4]], p.second), F(R(MID - 2.4 + s, 40.4, 4.8, 0.8, p.trim))];
    if (t >= 7) out.push(limb(19.6, 35, 23, 41, 1.6, 1.4, LEATHER), F(R(19, 34, 1.8, 1.4, p.trim)));
    return out;
  }
  // Hakama: wide pleated legs split in the middle, a long front panel, and from the Voidwalker a
  // zigzag hem edged in glow.
  const hem = 46.4;
  const zig = t >= 15;
  const legPts = (x0, x1, f) => [[x0, 34.4], [x1, 34.4], [x1 + f * 0.4 + s, hem], ...(zig ? [[(x0 + x1) / 2 + f * 1.4 + s, hem - 1.6]] : []), [x0 + f * 2.6 + s, hem]];
  const out = [T(legPts(9.4, 15.4, -1), p.main), T(legPts(15.8, 21.8, 1), p.main)];
  out.push(F(R(11.4 + s * 0.6, 37, 0.7, 7, p.dark)), F(R(19 + s * 0.6, 37, 0.7, 7, p.dark)));
  out.push(T([[MID - 2.2, 34.4], [MID + 2.2, 34.4], [MID + 2.4 + s, 42.4], [MID - 2.4 + s, 42.4]], p.dark), F(R(MID - 2.4 + s, 41.4, 4.8, 0.8, p.trim)));
  if (zig) out.push(F(R(6.8 + s, hem - 0.8, 4, 0.8, p.accent)), F(R(20.2 + s, hem - 0.8, 4, 0.8, p.accent)));
  return out;
}

// ---------- Shoes ----------

function shoe(t, p, k) {
  const c = k.tint(t >= 10 ? p.deep : p.dark);
  const out = [];
  if (t < 5) {
    // Split-toe tabi with crossed ankle wraps.
    out.push(k.shaft(2.2, c), k.sole(c), k.poly([[0.2, 0.6], [0.8, 0.6], [0.8, 3], [0.2, 3]], k.tint(shade(c, -14))));
    out.push(k.poly([[-1.6, -2.4], [1.6, -1.8], [1.6, -1.1], [-1.6, -1.7]], k.tint(BANDAGE)), k.poly([[-1.6, -1.2], [1.6, -1.8], [1.6, -1.1], [-1.6, -0.5]], k.tint(BANDAGE)));
    return out;
  }
  if (t < 10) {
    // Tabi boots: a tall wrapped shaft tied off with a trim band.
    out.push(k.shaft(4.8, c, 3.1), k.sole(c), k.poly([[0.2, 0.6], [0.8, 0.6], [0.8, 3], [0.2, 3]], k.tint(shade(c, -14))));
    out.push(k.poly([[-1.7, -4.6], [1.7, -4], [1.7, -3.2], [-1.7, -3.8]], k.tint(p.second)), k.poly([[-1.7, -2.6], [1.7, -2], [1.7, -1.2], [-1.7, -1.8]], k.tint(p.second)), k.dot(0, -4.2, 0.5, p.trim));
    return out;
  }
  // Steps: a plated shin guard with a trimmed edge and a pointed toe; spikes and a gem at the top.
  out.push(k.shaft(5.2, c, 3.2), k.sole(c), k.poly([[-1.8, 2.2], [1.8, 2.2], [0, 4.2]], c));
  out.push(k.poly([[-1.5, -5.6], [1.5, -5.6], [1.2, -0.8], [0, 0], [-1.2, -0.8]], k.tint(p.dark)), k.poly([[-1.5, -5.6], [1.5, -5.6], [1.5, -4.8], [-1.5, -4.8]], k.tint(p.trim)));
  if (t >= 15) out.push(k.poly([[-1.6, -5.4], [-3.6, -7.6], [-1, -6.2]], k.tint(p.deep)), k.poly([[1.6, -5.4], [3.6, -7.6], [1, -6.2]], k.tint(p.deep)), k.dot(0, -2.8, 0.6, p.accent));
  return out;
}

// ---------- Gloves ----------

function hand(t, p, hx, hy, ex, ey) {
  const l = Math.hypot(hx - ex, hy - ey) || 1;
  const dx = (hx - ex) / l;
  const dy = (hy - ey) / l;
  const back = (k) => [hx - dx * k, hy - dy * k];
  // A cuff or bracer from the wrist toward the elbow.
  const cuff = (k0, k1, w, c) => limb(...back(k0), ...back(k1), w, w * 1.08, c);
  if (t < 5) {
    // Bandage wraps over the hand and forearm, with crossing bands.
    const [ax, ay] = back(1.6);
    const [bx, by] = back(3);
    return [cuff(0.8, t < 2 ? 3.2 : 3.8, 3.4, BANDAGE), E(hx, hy, 1.9, 1.9, BANDAGE), F(limb(ax - dy * 1.6, ay + dx * 1.6, bx + dy * 1.6, by - dx * 1.6, 0.5, 0.5, shade(BANDAGE, -14))), F(E(hx, hy + 0.2, 1, 0.5, shade(BANDAGE, -10)))];
  }
  if (t < 10) {
    // Fingerless gloves and a bracer with a trim band.
    return [cuff(0.8, 4, 3.8, p.dark), F(limb(...back(2.2), ...back(2.9), 3.9, 3.9, p.trim)), E(hx, hy, 1.9, 1.9, p.dark), F(E(hx, hy + 1, 1.2, 0.7, '#fff0e6'))];
  }
  // Armored gloves: plates over the back of the hand, a row of knuckle studs, and a bracer with
  // a gem; from 15 the studs glow, a star emblem replaces the gem, and a fin sweeps off the bracer.
  const glow = t >= 15;
  const out = [cuff(0.8, 4.4, 4.2, p.deep), F(limb(...back(1.4), ...back(2), 4.3, 4.3, p.trim)), E(hx, hy, 2, 2, p.dark)];
  out.push(F(limb(hx - dy * 1.5, hy + dx * 1.5, hx + dy * 1.5, hy - dx * 1.5, 1.1, 1.1, p.trim)));
  for (const off of [-1.3, 0, 1.3]) out.push(F(E(hx + dx * 1.1 - dy * off, hy + dy * 1.1 + dx * off, 0.55, 0.55, glow ? p.accent : p.trimDark)));
  const [sx, sy] = back(3.2);
  if (glow) {
    const k = 1.4;
    out.push(T([[...back(2)], [back(4.6)[0] + dy * 2.6, back(4.6)[1] - dx * 2.6], [...back(4.2)]], p.deep));
    out.push(F(T([[sx, sy - k], [sx + 0.35, sy - 0.35], [sx + k, sy], [sx + 0.35, sy + 0.35], [sx, sy + k], [sx - 0.35, sy + 0.35], [sx - k, sy], [sx - 0.35, sy - 0.35]], p.accent)));
  } else out.push(F(E(sx, sy, 0.7, 0.7, p.accent)));
  return out;
}

// ---------- Cape: the scarf ----------
//
// The scarf knots at the back of the neck (10.6, 27.6) and its tails trail behind (-x). Moving
// forward makes sway negative, which lifts the tails toward horizontal; standing, they hang.

// Each tier's tails: [length, width, angle offset], the end cut, and a stripe near the end.
const SCARVES = [
  { tails: [[12, 4.2, 0]], end: 'square' },
  { tails: [[14, 4.4, 0]], end: 'square', stripe: 1 },
  { tails: [[16, 4.6, 0]], end: 'fork' },
  { tails: [[17, 4.6, 0]], end: 'fork', stripe: 1 },
  { tails: [[19, 4.8, 0]], end: 'fork', stripe: 1 },
  { tails: [[20, 4.8, 0], [12, 3.8, 0.3]], end: 'fork' },
  { tails: [[21, 4.8, 0], [13, 3.8, 0.3]], end: 'fork', stripe: 1 },
  { tails: [[22, 5, 0], [14, 4, 0.3]], end: 'point', stripe: 1 },
  { tails: [[23, 5, 0], [15, 4, 0.3]], end: 'fork', stripe: 1 },
  { tails: [[24, 5, 0], [16, 4, 0.3]], end: 'fork', stripe: 1, gem: 1 },
  { tails: [[25, 5.2, 0], [19, 4.4, 0.3]], end: 'fork', stripe: 1, gem: 1 },
  { tails: [[26, 5.2, 0], [20, 4.4, 0.3]], end: 'point', stripe: 1, gem: 1 },
  { tails: [[27, 5.4, 0], [21, 4.6, 0.3]], end: 'tatter', stripe: 1, gem: 1 },
  { tails: [[28, 5.4, 0], [22, 4.6, 0.3]], end: 'fork', stripe: 1, gem: 1 },
  { tails: [[29, 5.6, 0], [23, 4.8, 0.3]], end: 'point', stripe: 1, gem: 1 },
  { tails: [[30, 5.6, 0], [24, 4.8, 0.3], [18, 4, 0.6]], end: 'tatter', glow: 1 },
  { tails: [[30, 5.6, 0], [25, 4.8, 0.3], [19, 4, 0.6]], end: 'tatter', glow: 1, pale: 1 },
  { tails: [[31, 5.8, 0], [26, 5, 0.3], [20, 4.2, 0.6]], end: 'tatter', glow: 1 },
  { tails: [[32, 5.8, 0], [27, 5, 0.3], [21, 4.2, 0.6]], end: 'tatter', glow: 1, spikes: 1 },
  { tails: [[33, 6, 0], [28, 5.2, 0.3], [22, 4.4, 0.6]], end: 'tatter', glow: 1, spikes: 1, gem: 1 },
];

function cape(t, p, m) {
  const sc = SCARVES[t];
  const lift = Math.max(-1, Math.min(4, -m.sway));
  const out = [];
  // Draw the shorter tails first so the longest lies on top.
  [...sc.tails].reverse().forEach(([len, w, off], i) => {
    const k = sc.tails.length - 1 - i;
    // At rest the tail flares out to the side and droops; running lifts it out straight.
    const ang = 0.95 + lift * 0.18 + off;
    const col = k === 0 ? p.light : k === 1 ? p.main : p.dark;
    const [shape, pts] = ribbon(10.2, 28.2, len * 1.35, ang, [-0.8, -1.3, -0.3][k] + lift * 0.22, 0.3, m.sway * 0.8 + k * 1.7, w * 0.75, w, col, sc.end, 9);
    out.push(shape);
    // A stripe across the tail near its end, glowing on shadow scarves.
    if (sc.stripe || sc.glow) {
      const a = pts.at(-3);
      const b = pts.at(-2);
      out.push(F(limb(a[0], a[1], b[0] + (a[0] - b[0]) * 0.4, b[1] + (a[1] - b[1]) * 0.4, w * 0.82, w * 0.8, sc.glow ? p.accent : sc.pale ? WHITE : p.trim)));
    }
    if (sc.glow) out.push(F(E(...pts.at(-1), w * 0.24, w * 0.24, mix(p.accent, WHITE, 0.5))));
  });
  if (sc.spikes) for (const [x, y] of [[4.4, 33], [6.6, 37.4]]) out.push(T([[x, y], [x - 3 - lift, y - 1.4 - lift * 0.6], [x - 0.4, y + 1.8]], p.deep));
  return out;
}

// The scarf wrapped around the neck, with the knot on the back side and a short end hanging in
// front from the Rogue on.
function capeFront(t, p, m) {
  const sc = SCARVES[t];
  const s = m.sway * 0.4;
  const out = [];
  if (t >= 5) out.push(T([[18.2, 27.4], [21, 27.4], [21.6 + s, 34.8], [19.6 + s, 35.8], [17.6 + s, 34.6]], p.dark), F(R(17.9 + s, 33, 3.4, 0.8, sc.glow ? p.accent : p.trim)));
  out.push(T([[8.6, 24.2], [22.4, 24.2], [23, 27.4], [21.6, 29.4], [15.5, 30], [9.4, 29.4], [8, 27.4]], p.light));
  out.push(F(T([[9.4, 27.2], [21.6, 26.2], [21.8, 27], [9.6, 28.2]], p.dark)));
  out.push(E(10.6, 27.6, 2.2, 2, p.dark));
  if (sc.gem) out.push(F(E(10.6, 27.6, 1.1, 1.1, p.trim)), F(E(10.6, 27.6, 0.6, 0.6, p.accent)));
  if (sc.glow) out.push(F(R(9, 28.6, 13, 0.7, p.accent)));
  return out;
}

export default {
  hat,
  hatBack,
  hatTucks: (t) => t >= 3,
  hatHidesBangs: () => false,
  top,
  sleeve,
  longSleeves,
  shoulder,
  legs,
  skirt,
  shoe,
  hand,
  cape,
  capeFront,
};
