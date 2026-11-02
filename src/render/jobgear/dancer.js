// The dancers' gear (the Wind Dancer and her paths; the item family keeps the Thief's id): a
// showgirl who climbs from a street performer to the star of the grand stage (the player's pick,
// 2026-11-02). Stages by tier:
//   hat     0-4 hair bows and a headband with ring charms and a first feather · 5-9 a little top
//           hat worn tilted, with plumes and a ring round its crown · 10-14 a showgirl tiara with a
//           fan of plumes behind it · 15-19 a grand crown of star points, a great plume fan and
//           glowing rings
//   top     0-4 a laced bodice with a sash · 5-9 an open bolero jacket over it with brass buttons
//           · 10-14 a ringmaster's tailcoat with gold lapels and a ruffled jabot · 15-19 a
//           sequined star tailcoat with a fan collar
//   bottom  a ruffled skirt over a petticoat, one tier more each stage, with tights from 5
//   shoes   ribboned dance slippers, then heeled ankle boots, tall boots, and winged stage boots
//   gloves  a ribbon at the wrist, then short ruffled gloves, then opera gloves to the elbow
//           (with a glowing bangle at 15)
//   cape    sash ribbons streaming from the waist, then the tailcoat's swallowtails, then a
//           feather bustle that fans out behind her
// Nothing ever covers her face: everything sits on top of the head, at the side, or behind it.

import { R, E, T, F, shade, mix } from '../pixel.js';
import { torsoPts, band, side, MID, limb, tieBow } from '../figure.js';

const WHITE = '#ffffff';
const LACE = '#fff6ec';

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
// The band between two ellipses over an arc: headbands, tiaras, hat brims.
const crescent = (o, inner, a0, a1, c) => T([...arcPts(...o, a0, a1), ...arcPts(...inner, a1, a0)], c);
// A ring (the dancers' own shape): a band round (x, y), r across, w thick.
const ring = (x, y, r, w, c) => crescent([x, y, r, r], [x, y, r - w, r - w], 0, 360, c);
// Points turned by `a` degrees round (cx, cy).
const turn = (pts, a, cx, cy) => {
  const c = Math.cos(rad(a));
  const s = Math.sin(rad(a));
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};

// A plume: a feather from its quill at (x, y), `len` long, leaning `ang` degrees from straight up
// (negative toward her back), bending by `bend` along it, `w` wide at its fullest; a pale spine down
// the middle and a light tip.
function plume(x, y, len, ang, w, c, bend = 0, tip = null) {
  const n = 8;
  const mid = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = rad(ang + bend * u);
    mid.push([x + Math.sin(a) * len * u, y - Math.cos(a) * len * u]);
  }
  const left = [];
  const right = [];
  mid.forEach(([px, py], i) => {
    const [ax, ay] = mid[Math.max(0, i - 1)];
    const [bx, by] = mid[Math.min(n, i + 1)];
    const l = Math.hypot(bx - ax, by - ay) || 1;
    const u = i / n;
    const hw = (w / 2) * Math.pow(Math.sin(Math.PI * Math.min(0.98, 0.15 + u * 0.85)), 0.7);
    left.push([px - ((by - ay) / l) * hw, py + ((bx - ax) / l) * hw]);
    right.push([px + ((by - ay) / l) * hw, py - ((bx - ax) / l) * hw]);
  });
  const out = [T([...left, ...right.reverse()], c)];
  if (tip) out.push(F(T([...left.slice(6), ...right.slice(0, n - 5)], tip)));
  for (let i = 1; i < n - 1; i++) out.push(F(limb(...mid[i], ...mid[i + 1], 0.35, 0.3, mix(c, WHITE, 0.55))));
  return out;
}

// A two-loop bow at (x, y), `s` its size.
const bow = (x, y, s, c) => [
  T([[x, y], [x - 2.6 * s, y - 1.8 * s], [x - 3 * s, y + 0.4 * s], [x - 1.6 * s, y + 1.4 * s]], c),
  T([[x, y], [x + 2.6 * s, y - 1.8 * s], [x + 3 * s, y + 0.4 * s], [x + 1.6 * s, y + 1.4 * s]], c),
  T([[x - 0.4 * s, y + 0.6 * s], [x - 1.6 * s, y + 3.4 * s], [x - 0.6 * s, y + 3 * s]], shade(c, -12)),
  T([[x + 0.4 * s, y + 0.6 * s], [x + 1.4 * s, y + 3.2 * s], [x + 0.4 * s, y + 3 * s]], shade(c, -12)),
  F(E(x, y, 0.9 * s, 0.8 * s, shade(c, -20))),
];

// A four-point sequin star.
const star = (x, y, r, c) => F(T([[x, y - r], [x + r * 0.3, y - r * 0.3], [x + r, y], [x + r * 0.3, y + r * 0.3], [x, y + r], [x - r * 0.3, y + r * 0.3], [x - r, y], [x - r * 0.3, y - r * 0.3]], c));

// ---------- Hats ----------
//
// Head landmarks: head center (15.5, 14.6) r 10; the top of the head is at about y 4.6. Hats sit
// on top or at the side (she tilts them), never over the eyes.

// How each tier's headpiece is put together.
const HATS = [
  { bow: 1 },
  { bow: 1, charm: 1 },
  { band: 1, bow: 1 },
  { band: 1, charm: 1, plumes: 1 },
  { band: 1, bow: 1, plumes: 2 },
  { tophat: 1, plumes: 1 },
  { tophat: 1, plumes: 2 },
  { tophat: 1, plumes: 1, hatring: 1 },
  { tophat: 1, plumes: 2, gem: 1 },
  { tophat: 1, plumes: 3, hatring: 1, gem: 1 },
  { tiara: 1, fan: 3 },
  { tiara: 1, fan: 4 },
  { tiara: 1, fan: 5, charms: 1 },
  { tiara: 1, fan: 5, charms: 1, tall: 1 },
  { tiara: 1, fan: 6, charms: 1, tall: 1 },
  { crown: 1, fan: 7 },
  { crown: 1, fan: 7, halo: 1 },
  { crown: 1, fan: 8, rings: 1 },
  { crown: 1, fan: 8, rings: 1, halo: 1 },
  { crown: 1, fan: 9, rings: 1, halo: 1 },
];

// A little top hat worn tilted on the side of the head: its brim, its crown, a band in the trim,
// and from the Troupe on a ring round its crown and a gem on the band.
function topHat(h, p, sway) {
  const cx = 19.6;
  const cy = 4.2;
  const tilt = 16 + sway * 2;
  const out = [];
  const crown = turn([[cx - 3.6, cy], [cx - 3.2, cy - 6.6], [cx + 3.2, cy - 6.6], [cx + 3.6, cy]], tilt, cx, cy);
  const top = turn([[cx - 3.2, cy - 6.6], [cx + 3.2, cy - 6.6], [cx + 3.2, cy - 5.6], [cx - 3.2, cy - 5.6]], tilt, cx, cy);
  const hband = turn([[cx - 3.5, cy - 1.8], [cx + 3.5, cy - 1.8], [cx + 3.55, cy - 0.4], [cx - 3.55, cy - 0.4]], tilt, cx, cy);
  out.push(T(turn(arcPts(cx, cy, 6.4, 1.6, 0, 360, 16), tilt, cx, cy), p.dark));
  out.push(T(crown, p.main), F(T(top, p.light)), F(T(hband, p.trim)));
  if (h.gem) out.push(F(E(...turn([[cx + 1.2, cy - 1.1]], tilt, cx, cy)[0], 0.75, 0.75, p.accent)));
  if (h.hatring) out.push(F(T(turn(arcPts(cx, cy - 3.4, 5.4, 1.4, 200, 340, 8).concat(arcPts(cx, cy - 3.4, 4.6, 0.8, 340, 200, 8)), tilt, cx, cy), p.trim)));
  return out;
}

function hat(t, p, m) {
  const h = HATS[t];
  const sway = m.hair ?? 0;
  const out = [];
  if (h.band) out.push(crescent([15.5, 13.6, 10.6, 9.4], [15.5, 13.6, 10.2, 8.2], 160, 20, p.dark), F(crescent([15.5, 13.4, 10.4, 9], [15.5, 13.4, 10.2, 8.6], 150, 30, p.light)));
  // Plumes at the side, tucked into the band or the hat.
  if (h.plumes && !h.tophat) for (let i = 0; i < h.plumes; i++) out.push(...plume(21.6, 5.6, 7 + i * 1.4, 28 - i * 22 + sway * 4, 3, i ? p.second : p.light, -10, p.trim));
  if (h.bow) out.push(...bow(h.band ? 22.6 : 22, h.band ? 6.4 : 5.6, 1.25, p.second));
  if (h.charm) {
    // A little ring hanging from the bow or the band on a short ribbon, swinging.
    const x = 23.4 + sway * 0.4;
    out.push(F(limb(22.4, 7, x, 10.4, 0.5, 0.5, p.dark)), ring(x, 11.6, 1.5, 0.6, p.trim));
  }
  if (h.tophat) {
    for (let i = 0; i < (h.plumes ?? 0); i++) out.push(...plume(22.6, 0.6, 6 + i * 1.6, 40 - i * 24 + sway * 4, 2.8, i % 2 ? p.second : p.light, -14, p.trim));
    out.push(...topHat(h, p, sway));
  }
  if (h.tiara || h.crown) {
    // A tiara band over the top of the head, peaked in the middle with the tier's gem; the crown
    // grows star points along it.
    const peak = h.crown ? 5.2 : h.tall ? 4 : 3;
    out.push(crescent([15.5, 12.4, 10.4, 8.4], [15.5, 12.6, 9.8, 7], 158, 22, p.trim));
    out.push(T([[12.6, 5.6], [15.5, 4.4 - peak], [18.4, 5.6], [15.5, 6.8]], p.trim), F(T([[13.8, 5.4], [15.5, 4.8 - peak * 0.7], [17.2, 5.4], [15.5, 6.2]], p.trimLight)));
    out.push(F(E(15.5, 5.2 - peak * 0.4, 1.1, 1.1, p.accent)), F(E(15.2, 4.8 - peak * 0.4, 0.4, 0.4, WHITE)));
    if (h.crown) {
      for (const [x, y, hgt] of [[9.2, 7.6, 3.4], [11.8, 5.6, 4.2], [19.2, 5.6, 4.2], [21.8, 7.6, 3.4]]) {
        out.push(T([[x - 1.3, y + 0.8], [x, y - hgt], [x + 1.3, y + 0.8]], p.trim), F(E(x, y - hgt * 0.2, 0.45, 0.45, p.accent)));
      }
    }
    if (h.charms) for (const dir of [-1, 1]) out.push(F(limb(15.5 + dir * 9.6, 11, 15.5 + dir * 10.4, 14.4, 0.4, 0.4, p.trim)), ring(15.5 + dir * 10.4, 15.6, 1.3, 0.55, p.trim));
  }
  if (h.rings) {
    // Two small rings standing on the crown, glowing.
    for (const dir of [-1, 1]) out.push(ring(15.5 + dir * 5.2, -2.4, 2, 0.7, p.accent), F(E(15.5 + dir * 5.2 - 0.6, -3.2, 0.4, 0.4, WHITE)));
  }
  return out;
}

// Behind the head: the fan of plumes rising behind a tiara or crown, and a halo ring over it.
function hatBack(t, p, m) {
  const h = HATS[t];
  const sway = m.hair ?? 0;
  const out = [];
  if (h.fan) {
    const n = h.fan;
    const spread = 24 + n * 9;
    const len = (h.crown ? 15 : h.tall ? 13 : 11) + n * 0.5;
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1);
      const a = -spread / 2 + spread * u + sway * 3;
      const k = 1 - Math.abs(u - 0.5) * 0.5;
      out.push(...plume(15.5, 7.6, len * k, a, 3.6 + n * 0.12, i % 2 ? p.second : p.main, a * 0.15, h.crown ? p.accent : p.trim));
    }
  }
  if (h.halo) out.push(F(crescent([15.5, -5.4, 9, 2.6], [15.5, -5.4, 7.6, 1.6], 0, 360, p.accent)));
  return out;
}

// ---------- Top ----------

function top(t, p) {
  const torso = torsoPts();
  const out = [T(torso, p.main)];
  // The bodice: a scalloped neckline, laces crossed down the front, a sash at the waist.
  out.push(band(torso, 26, 27.2, p.light));
  for (const x of [11.6, 13.6, 15.6, 17.6, 19.6]) out.push(F(E(x, 27.2, 1, 0.6, p.light)));
  if (t < 10) for (const y of [28.6, 30.2, 31.8]) out.push(F(limb(MID - 1.2, y, MID + 1.2, y + 1.2, 0.4, 0.4, p.trim)), F(limb(MID + 1.2, y, MID - 1.2, y + 1.2, 0.4, 0.4, p.trim)));
  out.push(band(torso, 33.2, 35.2, p.second));
  if (t < 5) {
    out.push(...bow(20.4, 34, 0.55, p.second));
    if (t >= 2) for (const [x, y] of [[11.4, 30], [19.8, 30.4], [12.2, 32.2]]) out.push(F(E(x, y, 0.45, 0.45, p.trim)));
    if (t >= 3) out.push(ring(MID, 34.2, 1.3, 0.55, p.trim));
    return out.filter(Boolean);
  }
  // From the Troupe on: a jacket open over the bodice, its lapels turned back.
  const coat = t >= 10 ? p.deep : p.dark;
  out.push(side(torso, MID - 3, -1, coat), side(torso, MID + 3, 1, coat));
  const lapel = t >= 10 ? p.trim : p.light;
  out.push(T([[MID - 3.2, 26.2], [MID - 5.2, 26.2], [MID - 3.4, 31.6], [MID - 2.8, 31.6]], lapel), T([[MID + 3.2, 26.2], [MID + 5.2, 26.2], [MID + 3.4, 31.6], [MID + 2.8, 31.6]], lapel));
  // Brass buttons down each front (two rows on the tailcoat).
  for (const y of [28.8, 31, 33.2]) {
    out.push(F(E(MID - 4.2, y, 0.45, 0.45, p.trim)), F(E(MID + 4.2, y, 0.45, 0.45, p.trim)));
    if (t >= 10) out.push(F(E(MID - 5.6, y, 0.4, 0.4, p.trim)), F(E(MID + 5.6, y, 0.4, 0.4, p.trim)));
  }
  out.push(ring(MID, 34.2, 1.4, 0.6, p.trim));
  if (t >= 7) out.push(F(E(MID, 34.2, 0.6, 0.6, p.accent)));
  if (t >= 10) {
    // A ruffled jabot at the throat.
    out.push(T([[MID - 1.8, 26], [MID + 1.8, 26], [MID + 1.2, 30.6], [MID, 31.2], [MID - 1.2, 30.6]], LACE), F(R(MID - 1.4, 27.6, 2.8, 0.4, '#e8dccc')), F(R(MID - 1.2, 29.2, 2.4, 0.4, '#e8dccc')));
  }
  if (t >= 15) {
    // Sequin stars scattered over the coat, and a fan collar standing up behind the neck.
    for (const [x, y] of [[10.6, 28.6], [11.4, 31.8], [20.4, 29.4], [20, 32.4], [10.4, 34]]) out.push(star(x, y, 0.9, p.accent));
    out.push(T([[9.6, 26.8], [8.8, 22.8], [11.4, 24.6], [12.4, 22.4], [13.4, 25.4], [10.8, 27.2]], p.trim), T([[21.6, 26.8], [22.4, 22.8], [19.8, 24.6], [18.8, 22.4], [17.8, 25.4], [20.4, 27.2]], p.trim));
  }
  return out.filter(Boolean);
}

const sleeve = (t, p) => (t >= 10 ? p.deep : t >= 5 ? p.dark : p.main);
const longSleeves = (t) => t >= 5;

// The shoulders: a little puff, then an epaulette with a fringe, then a gold one with a gem (and a
// star on the grand stage).
function shoulder(t, p, s) {
  if (t < 5) return [E(0, 0.4, 2.4, 2, p.light), F(E(-0.4, -0.2, 1.2, 0.8, mix(p.light, WHITE, 0.5)))];
  const big = t >= 10;
  const out = [E(0, 0.2, big ? 3 : 2.6, big ? 1.8 : 1.5, p.trim), F(E(0, -0.3, big ? 2 : 1.6, 0.7, p.trimLight))];
  for (const x of [-2, -1, 0, 1, 2]) out.push(R(x * (big ? 1.1 : 0.95) - 0.3, 1.4, 0.6, big ? 2.4 : 1.8, p.trimDark));
  if (big) out.push(F(E(0, 0, 0.7, 0.7, p.accent)));
  if (t >= 15) out.push(star(s * 0.4, -1.8, 1.4, p.accent));
  return out;
}

// ---------- Bottom ----------

function legs(t, p, skin) {
  // Bare legs under the first skirts, then tights that pick up the outfit's light colour.
  const tights = t < 5 ? skin ?? '#fbe2cf' : mix(p.light, WHITE, t >= 10 ? 0.5 : 0.3);
  return { top: tights, low: tights, pad: null, cuff: null };
}

// One ruffled tier of skirt from y0 to y1, flaring out, its hem scalloped, swaying by s.
function ruffle(y0, y1, w0, w1, s, c, scallops = 6) {
  const pts = [[MID - w0, y0], [MID + w0, y0]];
  for (let i = 0; i <= scallops; i++) {
    const u = 1 - i / scallops;
    const x = MID - w1 + 2 * w1 * u + s;
    pts.push([x, y1 + (i % 2 ? 0 : 0.9)]);
  }
  return T(pts, c);
}

function skirt(t, p, m) {
  const s = m.sway * 0.45;
  const stage = Math.floor(t / 5);
  const hem = 39.6 + stage * 1.2;
  const out = [];
  // The petticoat peeking out under the hem, then the skirt's tiers from the bottom up.
  out.push(ruffle(34.4, hem + 0.8, 5.6, 8 + stage * 0.4, s * 1.1, LACE, 8));
  const tiers = 1 + Math.min(2, stage);
  for (let i = 0; i < tiers; i++) {
    const y1 = hem - i * 2.2;
    out.push(ruffle(34.4, y1, 5.6, 7.4 + stage * 0.4 - i * 0.6, s * (1 - i * 0.2), i % 2 ? p.second : p.main, 6 + stage));
    if (t >= 5) out.push(F(R(MID - 6.6 + i * 0.6 + s * (1 - i * 0.2), y1 - 0.6, 13.2 - i * 1.2, 0.6, i === 0 && t >= 15 ? p.accent : p.trim)));
  }
  out.push(R(MID - 5.6, 34.4, 11.2, 1.2, p.dark));
  if (t >= 10) for (const [x, y] of [[11.4, 37.4], [19.6, 37.8], [15.6, 39], [13.2, 40.4], [18, 40.6]]) out.push(t >= 15 ? star(x + s * 0.5, y, 0.8, p.accent) : F(E(x + s * 0.5, y, 0.4, 0.4, p.trim)));
  return out;
}

// ---------- Shoes ----------

function shoe(t, p, k) {
  const c = k.tint(t >= 10 ? p.deep : p.main);
  const out = [];
  if (t < 5) {
    // Dance slippers, their ribbons crossed up the ankle.
    const rib = k.tint(p.light);
    out.push(k.sole(c), k.poly([[-1.6, -2.6], [1.6, -1.6], [1.6, -1], [-1.6, -2]], rib), k.poly([[-1.6, -1.4], [1.6, -2.6], [1.6, -2], [-1.6, -0.8]], rib), k.dot(1.2, 0.4, 0.5, p.light));
    return out;
  }
  if (t < 10) {
    // Heeled ankle boots with a little bow.
    out.push(k.shaft(3.2, c, 3), k.sole(c), k.poly([[-2.6, 2.2], [-1.6, 2.2], [-1.8, 4.2], [-2.4, 4.2]], k.tint(shade(c, -18))), k.shaft(0.8, k.tint(p.trim), 3.1), k.dot(0.8, -1.4, 0.7, p.light));
    return out;
  }
  // Tall stage boots: a trimmed cuff, laces, a heel; on the grand stage, a little wing at the ankle.
  out.push(k.shaft(5.6, c, 3.1), k.sole(c), k.poly([[-2.6, 2.2], [-1.6, 2.2], [-1.8, 4.4], [-2.4, 4.4]], k.tint(shade(c, -18))));
  out.push(k.poly([[-1.7, -5.8], [1.7, -5.8], [1.8, -4.6], [-1.8, -4.6]], k.tint(p.trim)));
  for (const y of [-3.6, -2.2, -0.8]) out.push(k.poly([[-0.9, y - 0.3], [0.9, y + 0.3], [0.9, y + 0.7], [-0.9, y + 0.1]], k.tint(p.light)));
  if (t >= 15) out.push(k.poly([[-1.6, -1.6], [-4.6, -3.6], [-3.8, -1.2], [-4.4, 0.2], [-1.6, -0.2]], k.tint(WHITE)), k.dot(0, -5.2, 0.6, p.accent));
  return out;
}

// ---------- Gloves ----------

function hand(t, p, hx, hy, ex, ey) {
  const l = Math.hypot(hx - ex, hy - ey) || 1;
  const dx = (hx - ex) / l;
  const dy = (hy - ey) / l;
  const back = (k) => [hx - dx * k, hy - dy * k];
  const cuff = (k0, k1, w, c) => limb(...back(k0), ...back(k1), w, w * 1.06, c);
  if (t < 5) {
    // A ribbon tied at the wrist, its ends fluttering.
    const [wx, wy] = back(1.4);
    return [cuff(1, 1.9, 3.3, p.light), F(T([[wx, wy], [wx - dy * 2.4 - dx * 1.4, wy + dx * 2.4 - dy * 1.4], [wx - dy * 1.6 - dx * 2, wy + dx * 1.6 - dy * 2]], p.light))];
  }
  const glove = t >= 10 ? mix(p.light, WHITE, 0.55) : WHITE;
  if (t < 10) {
    // Short gloves with a ruffle at the cuff.
    return [cuff(0.6, 2.8, 3.4, glove), E(hx, hy, 1.9, 1.9, glove), F(limb(...back(2.6), ...back(3.4), 4.2, 4.4, p.light)), F(E(hx, hy + 0.9, 1.1, 0.6, mix(glove, '#d8ccd8', 0.4)))];
  }
  // Opera gloves to the elbow, a trim band at the top and a ring bangle (glowing on the grand stage).
  const out = [cuff(0.6, 6.4, 3.6, glove), E(hx, hy, 1.9, 1.9, glove), F(limb(...back(5.6), ...back(6.4), 3.9, 3.9, p.trim))];
  out.push(F(limb(...back(1.8), ...back(2.4), 4, 4, t >= 15 ? p.accent : p.trim)));
  return out;
}

// ---------- Cape: sash ribbons, coat tails, a feather bustle ----------
//
// They hang from the back of the waist (about (10.4, 33.6)); moving forward makes sway negative,
// which lifts them back toward horizontal; standing, they hang.

// A ribbon along a wavy centerline from (x, y): it heads `ang` radians from straight down toward
// the back (-x), bending by `curl` and rippling by `wave` (phase `ph`); width tapers w0 to w1; the
// end forked, pointed or square.
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
    left.push([px + (-(by - ay) / l) * w, py + ((bx - ax) / l) * w]);
    right.push([px - (-(by - ay) / l) * w, py - ((bx - ax) / l) * w]);
  });
  const tip = pts[n];
  const [dx, dy] = [tip[0] - pts[n - 1][0], tip[1] - pts[n - 1][1]];
  const dl = Math.hypot(dx, dy) || 1;
  const cap = end === 'fork' ? [[tip[0] - (dx / dl) * 1.6, tip[1] - (dy / dl) * 1.6]] : end === 'point' ? [[tip[0] + (dx / dl) * 2, tip[1] + (dy / dl) * 2]] : [];
  return [T([...left, ...cap, ...right.reverse()], c), pts];
}

function cape(t, p, m) {
  const lift = Math.max(-1, Math.min(4, -m.sway));
  const out = [];
  const stage = Math.floor(t / 5);
  // The bustle: plumes fanning up and back from the waist (from the Headliner on).
  if (t >= 12) {
    const n = t >= 15 ? 5 + Math.min(2, t - 15) : 3;
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1);
      const a = -20 - 70 * u - lift * 6 + Math.sin(m.sway + i) * 3;
      out.push(...plume(10.8, 33.4, 11 + stage * 1.6 - Math.abs(u - 0.5) * 4, a, 4, i % 2 ? p.second : p.main, -12, t >= 15 ? p.accent : p.trim));
    }
  }
  if (t < 5) {
    // Sash ribbons streaming from a bow at the back of the waist.
    for (const [k, len, w] of [[1, 9 + t, 2.2], [0, 12 + t * 1.4, 2.6]]) {
      const ang = 0.7 + lift * 0.22 + k * 0.35;
      out.push(ribbon(10.6, 34, len, ang, -0.5 + lift * 0.2, 0.3, m.sway * 0.8 + k * 1.7, w, w * 0.8, k ? p.secondDark : p.second, 'fork', 7)[0]);
    }
    return out;
  }
  // Swallowtails: two long pointed coat tails from the back of the jacket, edged in the trim.
  for (const [k, len] of [[1, 12 + stage * 2], [0, 14 + stage * 2.4]]) {
    const ang = 0.35 + lift * 0.25 + k * 0.25;
    const [shape, pts] = ribbon(11 - k * 0.6, 31.6, len, ang, -0.25 + lift * 0.15, 0.12, m.sway * 0.6 + k * 1.3, 4.2, 2.6, k ? shade(t >= 10 ? p.deep : p.dark, -10) : t >= 10 ? p.deep : p.dark, 'point', 7);
    out.push(shape);
    const a = pts.at(-2);
    const b = pts.at(-1);
    out.push(F(limb(a[0], a[1], b[0], b[1], 2.4, 1.2, t >= 15 ? p.accent : p.trim)));
  }
  return out;
}

// At the throat: a ribbon choker with a ring charm, then a bow tie at the collar.
function capeFront(t, p) {
  const out = [];
  if (t < 10) {
    out.push(R(11.4, 24.6, 8.4, 1.1, p.dark), ring(MID, 26.4, 1.1, 0.5, p.trim));
    if (t >= 5) out.push(...tieBow(MID, 25.2, p.accent));
    return out;
  }
  // A jewelled collar band with a drop gem.
  out.push(R(11, 24.4, 9.2, 1.3, p.trim), F(R(11.2, 24.6, 8.8, 0.4, p.trimLight)), T([[MID - 1, 25.6], [MID + 1, 25.6], [MID, 27.6]], p.accent), F(E(MID - 0.2, 26, 0.3, 0.3, WHITE)));
  return out;
}

export default {
  hat,
  hatBack,
  hatTucks: () => false,
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
