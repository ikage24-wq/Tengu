// Equipment designs for the hero rig. Every slot has a look per tier, plus one-off designs for
// special items. Shapes are in body coordinates: a 30x56 anime chibi facing right, feet at y = 56.
// Sprites are soft (cel-shaded with tinted outlines), so designs are flat color blocks plus a few
// flat (F) details; shading and edges come from the renderer.
//
// Landmarks: head center (15.5, 14.6) r10 · neck y 23-27 · torso y 26-35.8 and hips y 34.6-39.6,
// shaped by the body type (see FIGURES) · legs jointed at hip (y 37.6), knee, and ankle (y 53 at rest), from x 12.3 (left)
// and 18.7 (right) · soles at y 56 · shoulders (10.4, 28.2) and (20.8, 28.2) · hands rest at y 37.6.

import { gloveShapes } from './weapon-designs.js';
import { R, E, T, F, shade, shadowTone } from './pixel.js';
import { GOLD, SILVER, INK, FIGURE, torsoPts, robePts, dressPts, band, side, MID, collar, tieBow, button, limb, reach, mirrorX } from './figure.js';
import { JOB_GEAR } from './jobgear/index.js';
import { setModule, SET_DESIGNS } from './jobgear/sets.js';

// The module that draws a piece: a gear set's own design over its job's, or the job's.
const gearOf = (piece) => (piece.set ? setModule(piece.set, piece.family, JOB_GEAR[piece.family]) : JOB_GEAR[piece.family]);
import { finish, hang, hsl, polyOf } from './jobgear/kit.js';

export { limb, reach };

// ---------- Materials ----------
// Every piece is rendered as materials under one light (see jobgear/kit.js): shapes tagged with a
// material keep it; the rest are sorted here by colour. A piece's trim metals, plain gold and
// silver, and chain are metal; browns are leather; the accent is a gem when small and a glow
// when big; a warrior's own colour is plate from the Militia set on; everything else is cloth.

const isBrown = (c) => {
  const [h, s, l] = hsl(c);
  return h >= 10 && h <= 42 && s >= 0.16 && s <= 0.62 && l >= 0.18 && l <= 0.6;
};
const BASE_METALS = [GOLD, SILVER, '#aeb6c6', '#ffd23b', '#c9ccd6'];
const FURS = new Set(['#f6ecdc']);
const size = (s) => (s.t === 'r' ? Math.max(s.w, s.h) : s.t === 'e' ? Math.max(s.rx, s.ry) * 2 : Math.max(...s.pts.map((q) => q[0])) - Math.min(...s.pts.map((q) => q[0])) + Math.max(...s.pts.map((q) => q[1])) - Math.min(...s.pts.map((q) => q[1])));
const matCache = new WeakMap();
const plainMat = classifier(null);
// The material sorter for a piece (or for plain designs, with no palette).
function classifier(piece) {
  const p = piece?.pal ?? null;
  const metals = new Set(BASE_METALS);
  const plate = new Set();
  if (p) {
    metals.add(p.trim).add(p.trimDark).add(p.trimLight);
    if (piece.family === 'warrior' && piece.tier >= 1) for (const c of [p.main, p.dark, p.deep, p.light]) plate.add(c);
  }
  for (const c of [...metals]) metals.add(shadowTone(c));
  for (const c of [...plate]) plate.add(shadowTone(c));
  return (s) => {
    const c = s.c;
    if (metals.has(c) || plate.has(c)) return 'metal';
    if (p && (c === p.accent || c === p.glow)) return size(s) <= 4.5 ? 'gem' : 'glow';
    if (FURS.has(c)) return 'fur';
    if (isBrown(c)) return 'leather';
    return 'cloth';
  };
}
function matFor(piece) {
  if (!piece?.pal) return plainMat;
  let m = matCache.get(piece.pal);
  if (!m) {
    m = classifier(piece);
    matCache.set(piece.pal, m);
  }
  return m;
}
const done = (shapes, piece) => finish(shapes.filter(Boolean), matFor(piece));
// Hanging cloth is drawn at rest and bent as a chain (kit.js `hang`) from its root.
const STILL = (m) => ({ ...m, sway: 0, hair: 0 });
const HANGS = new Set(['warrior', 'archer', 'mage', 'starter', 'costume']);
const lowest = (shapes) => Math.max(...shapes.filter(Boolean).map((s) => (s.t === 'r' ? s.y + s.h : s.t === 'e' ? s.y + s.ry : Math.max(...s.pts.map((q) => q[1] + s.y)))));

// Standing still, nothing swaying.
const MOTION = { sway: 0, hair: 0, flap: 0 };

// ---------- Tops (torso part) ----------

export function topShapes(design, c, piece = null, m = MOTION) {
  if (piece?.family) return done(gearOf(piece).top(piece.tier, piece.pal, m), piece);
  const d = shade(c, -16);
  const l = shade(c, 18);
  const torso = torsoPts();
  const robe = robePts();
  const parts = (() => {
    switch (design) {
      case 'stripes': return [T(torso, c), band(torso, 29.2, 30.3, d), band(torso, 31.6, 32.6, d), band(torso, 34, 35.1, d), collar(l)];
      case 'vest': return [T(torso, '#fff6ec'), side(torso, MID - 1.6, -1, c), side(torso, MID + 1.6, 1, c), band(torso, 32.9, 34.6, '#7a5238'), F(E(MID, 33.7, 0.9, 0.8, GOLD))];
      case 'plate': return [T(torso, SILVER), T([[MID - 3, 28], [MID + 3, 28], [MID + 2.2, 32.5], [MID, 34], [MID - 2.2, 32.5]], c), F(E(MID - 1, 29.6, 0.8, 0.8, '#ffffff')), band(torso, 33.6, 35.4, shade(SILVER, -18)), E(10.8, 27.6, 2.4, 2, l), E(20.4, 27.6, 2.4, 2, l)];
      case 'starrobe': return [T(robe, c), band(robe, 26.2, 27.2, GOLD), F(R(15.2, 29.4, 0.9, 3, GOLD)), F(R(14.2, 30.4, 2.9, 0.9, GOLD)), band(robe, 43.4, 44.5, GOLD), F(E(12.5, 40, 0.6, 0.6, '#ffffff')), F(E(18.4, 38.5, 0.6, 0.6, GOLD))];
      case 'celestial': return [T(robe, c), band(robe, 33, 44.5, l), band(robe, 26.2, 27.2, GOLD), R(15.2, 26.5, 1, 18, GOLD), F(E(13.3, 30, 1.2, 1.6, '#ffffff')), F(E(18, 30, 1.2, 1.6, '#ffffff')), band(robe, 43.4, 44.5, GOLD)];
      case 'kimono': return [T(robe, c), T([[MID - 2.6, 26.4], [MID + 2.6, 26.4], [MID, 31.6]], '#ffffff'), T([[MID - 1.2, 26.4], [MID + 2.6, 26.4], [MID + 0.4, 31]], l), band(robe, 32, 34.6, '#ff6b9a'), F(E(MID, 33.3, 0.8, 0.8, GOLD)), F(E(12, 38, 0.7, 0.7, '#ffffff')), F(E(19, 41, 0.7, 0.7, '#ffffff'))];
      case 'sailor': return [T(torso, '#ffffff'), T([[11, 26.2], [20.2, 26.2], [20.6, 28.6], [15.6, 31.2], [10.6, 28.6]], c), F(T([[MID - 1.4, 29.8], [MID + 1.4, 29.8], [MID + 0.8, 32.6], [MID, 31.6], [MID - 0.8, 32.6]], '#ff6b8a')), band(torso, 33.6, 35.8, c)];
      case 'hoodie': return [T(torso, c), T([[11.4, 25.8], [19.6, 25.8], [18.6, 28.2], [12.4, 28.2]], d), R(12.6, 31.6, 6, 2.8, d), F(R(MID - 1.9, 27.6, 0.6, 3.2, '#ffffff')), F(R(MID + 1.3, 27.6, 0.6, 3.2, '#ffffff'))];
      // Clothing: everyday outfits.
      case 'jacket': return [T(torso, c), T([[MID - 2.4, 26.2], [MID + 2.4, 26.2], [MID + 1.8, 35.8], [MID - 1.8, 35.8]], '#ffffff'),
        T([[MID - 2.6, 26.2], [MID - 4.2, 26.6], [MID - 2.2, 31]], d), T([[MID + 2.6, 26.2], [MID + 4.2, 26.6], [MID + 2.2, 31]], d), band(torso, 34.6, 35.8, d)];
      case 'sweater': return [T(torso, c), R(MID - 3.2, 25.4, 6.4, 2, l), band(torso, 34.2, 35.8, d), F(R(MID - 2.4, 28.4, 0.5, 5.4, l)), F(R(MID + 1.9, 28.4, 0.5, 5.4, l)), F(R(MID - 0.25, 28.4, 0.5, 5.4, d))];
      case 'overalls': return [T(torso, '#ffffff'), collar('#f1ecf7'), T([[MID - 3.6, 29.6], [MID + 3.6, 29.6], [MID + 4.2, 35.8], [MID - 4.2, 35.8]], c),
        R(MID - 4, 26.2, 1.2, 3.6, c), R(MID + 2.8, 26.2, 1.2, 3.6, c), button(MID - 3.2, 30.2, GOLD), button(MID + 3.2, 30.2, GOLD), F(R(MID - 1.6, 31.4, 3.2, 2, d))];
      case 'dress': {
        const dress = dressPts();
        return [T(dress, c), collar('#ffffff'), band(dress, 33, 34.4, l), ...tieBow(MID, 33.7, l), band(dress, 43, 44.4, '#ffffff')];
      }
      case 'maid': {
        const dress = dressPts();
        return [T(dress, c), T([[MID - 3.4, 30], [MID + 3.4, 30], [MID + 5.6, 43.6], [MID - 5.6, 43.6]], '#ffffff'),
        band(dress, 43, 44.4, '#ffffff'), collar('#ffffff'), band(dress, 32.6, 33.6, '#ffffff'), ...tieBow(MID, 27.2, '#ff6b8a'), T([[MID - 3.4, 30], [MID - 2.2, 28.6], [MID + 2.2, 28.6], [MID + 3.4, 30]], '#ffffff')];
      }
      case 'blazer': return [T(torso, c), T([[MID - 2.4, 26.2], [MID + 2.4, 26.2], [MID, 31.6]], '#ffffff'), F(T([[MID - 0.6, 27], [MID + 0.6, 27], [MID + 0.9, 31], [MID, 32], [MID - 0.9, 31]], '#e5485f')),
        T([[MID - 2.6, 26.2], [MID - 4, 27], [MID - 1.4, 32.4]], d), T([[MID + 2.6, 26.2], [MID + 4, 27], [MID + 1.4, 32.4]], d), button(MID, 33.4, GOLD), F(R(MID - 4.8, 31, 2, 0.5, d))];
      case 'puffer': return [T(torso, c), band(torso, 28.4, 28.9, d), band(torso, 31, 31.5, d), band(torso, 33.6, 34.1, d), R(MID - 3.4, 25.2, 6.8, 2.2, l), F(R(MID - 0.25, 27.4, 0.5, 8.4, d))];
      default: return [T(torso, c), collar(l), band(torso, 34.4, 35.8, d)];
    }
  })();
  // Dresses and robes swing below the waist like a skirt (the hair and cape springs), so they
  // aren't stiff while the rest of the figure moves.
  return done(lowest(parts) > 37 ? hang(parts, 36, lowest(parts), m, 0.7) : parts, piece);
}

// Sleeves follow the top's main color; armor shows metal.
export function sleeveColor(design, c, piece = null) {
  if (piece?.family) return gearOf(piece).sleeve(piece.tier, piece.pal);
  if (design === 'plate') return SILVER;
  if (design === 'vest' || design === 'sailor' || design === 'overalls') return '#ffffff';
  if (design === 'jacket' || design === 'blazer' || design === 'maid') return c;
  return c;
}

// Robes, armor, and hoodies cover the whole arm; everything else leaves the forearm bare.
export function longSleeves(design, piece = null) {
  if (piece?.family) return gearOf(piece).longSleeves(piece.tier);
  return ['plate', 'starrobe', 'celestial', 'kimono', 'hoodie', 'jacket', 'sweater', 'blazer', 'puffer', 'maid'].includes(design);
}

// ---------- Bottoms (leg colors, hips, and an optional skirt) ----------

export function legLook(design, c, skin, piece = null) {
  if (piece?.family) return { ...gearOf(piece).legs(piece.tier, piece.pal, skin), piece };
  switch (design) {
    case 'shorts': return { top: c, low: skin, pad: null };
    case 'leather': return { top: c, low: c, pad: shade(c, 20) };
    case 'greaves': return { top: SILVER, low: SILVER, pad: '#ffffff' };
    case 'starskirt': return { top: skin, low: skin, pad: null };
    case 'celestialskirt': return { top: '#ffffff', low: '#ffffff', pad: null };
    case 'skirt': return { top: skin, low: skin, pad: null };
    case 'longskirt': return { top: c, low: skin, pad: null };
    case 'jeans': return { top: c, low: c, pad: null, cuff: shade(c, 22) };
    case 'cargo': return { top: c, low: c, pad: shade(c, -14) };
    default: return { top: c, low: c, pad: null };
  }
}

export function hipShapes(look) {
  return done([T(FIGURE.hips, look.top)], look.piece ?? null);
}

export function skirtShapes(design, c, piece = null, m = MOTION) {
  if (piece?.family) {
    const fam = piece.family;
    if (!HANGS.has(fam)) {
      const out = gearOf(piece).skirt(piece.tier, piece.pal, m);
      return out ? done(out, piece) : null;
    }
    const out = gearOf(piece).skirt(piece.tier, piece.pal, STILL(m));
    return out ? done(hang(out.filter(Boolean), 34.4, lowest(out), m, 0.8), piece) : null;
  }
  const out = plainSkirt(design, c);
  return out ? done(hang(out, 34.4, lowest(out), m, 0.8), null) : null;
}

function plainSkirt(design, c) {
  if (design === 'starskirt') return [T([[10.6, 34.4], [20, 34.4], [21.4, 36.4], [22.6, 41.6], [8.2, 41.6], [9.4, 36.4]], c), R(8.9, 40.6, 13, 1, GOLD), F(E(12, 38, 0.6, 0.6, GOLD)), F(E(17.5, 37, 0.6, 0.6, GOLD)), F(E(20, 39.4, 0.6, 0.6, '#ffffff'))];
  if (design === 'skirt') {
    // A short pleated skirt: alternating light and dark pleats and a waistband.
    const pts = [[10, 34.2], [21.2, 34.2], [22.6, 40.4], [8.6, 40.4]];
    const out = [T(pts, c), R(10, 34.2, 11.2, 1.2, shade(c, -16))];
    for (const x of [11.6, 14.2, 16.8, 19.4]) out.push(F(T([[x, 35.4], [x + 0.6, 35.4], [x + 1, 40.4], [x - 0.2, 40.4]], shade(c, -12))));
    return out;
  }
  if (design === 'longskirt') return [T([[10, 34.2], [21.2, 34.2], [23.4, 48.6], [7.8, 48.6]], c), R(10, 34.2, 11.2, 1.4, shade(c, 18)), band([[10, 34.2], [21.2, 34.2], [23.4, 48.6], [7.8, 48.6]], 47.2, 48.4, shade(c, -16))].filter(Boolean);
  if (design === 'celestialskirt') return [T([[10.6, 34.4], [20, 34.4], [22.6, 46.6], [8.2, 46.6]], c), R(8.3, 45.4, 14.2, 1.2, GOLD), T([[15, 34.4], [16.2, 34.4], [16.6, 45.4], [14.6, 45.4]], shade(c, 18))];
  return null;
}

// ---------- Limbs ----------

// ---------- Legs with shoes (one leg; the back leg is drawn in the shadow tone) ----------

export const THIGH = 7.8;
export const SHIN = 7.6;
export const HIP_Y = 37.6;
export const ANKLE_Y = 53;

// x is the leg's left edge at rest. foot = [dx, dy, angle]: the ankle's offset from its rest spot
// under the hip, and the foot's tilt in degrees (positive lifts the toe). hipY moves the hip.
export function legShapes(x, look, shoe, back, foot = [0, 0, 0], hipY = HIP_Y) {
  return done(legParts(x, look, shoe, back, foot, hipY), look.piece ?? null);
}

function legParts(x, look, shoe, back, foot, hipY) {
  const tint = (c) => (back ? shadowTone(c) : c);
  const top = tint(look.top);
  const low = tint(look.low);
  const hx = x + 1.5;
  const [[kx, ky], [ax, ay]] = reach(hx, hipY, hx + foot[0], ANKLE_Y + foot[1], THIGH, SHIN, 1);
  const shapes = [
    limb(hx, hipY, kx, ky, 4.4, 3.8, top),
    E(kx, ky, 1.9, 1.9, top),
    limb(kx, ky, ax, ay, 3.8, 3.2, low),
  ];
  if (look.pad) shapes.push(E(kx + 0.3, ky, 1.7, 1.4, tint(look.pad)));
  // Rolled-up cuffs just above the ankle.
  if (look.cuff) shapes.push(limb(kx + (ax - kx) * 0.74, ky + (ay - ky) * 0.74, ax, ay, 3.7, 3.5, tint(look.cuff)));
  shapes.push(...shoeShapes(ax, ay, kx, ky, foot[2] ?? 0, shoe, tint));
  return shapes;
}

// A leg's joints for a pose: hip, knee, ankle (the same reach legParts draws with).
export function legJoints(x, foot = [0, 0, 0], hipY = HIP_Y) {
  const hx = x + 1.5;
  const [knee, ankle] = reach(hx, hipY, hx + foot[0], ANKLE_Y + foot[1], THIGH, SHIN, 1);
  return [[hx, hipY], knee, ankle];
}

// ---------- Draping cloth over the legs ----------
//
// Skirts, tassets, and the lower part of dresses and robes are drawn at rest; `drape` bends them
// around the legs as posed, so a stride never pokes a thigh or knee out through the cloth. At each
// height it finds how far the legs reach past the cloth's own resting edge and pushes that side
// out to cover them; part of every leg movement also carries into the cloth, so a wide dress still
// swings with each step, and the hem drifts toward where the legs have gone. Outlines are cut into
// short steps first, so the cloth curves around a knee instead of pivoting at its corners.
// `legs` and `rest` are [joints, joints] from legJoints; y0 is where the cloth starts to hang.
const LEG_HALF = 2.3;
const DRAPE_GIVE = 0.35;

function legEdges(joints, y) {
  // The leftmost and rightmost reach of a leg (as a band LEG_HALF wide) around height y.
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < joints.length - 1; i++) {
    const [ax, ay] = joints[i];
    const [bx, by] = joints[i + 1];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      const px = ax + (bx - ax) * t;
      const py = ay + (by - ay) * t;
      if (Math.abs(py - y) > 1.4) continue;
      lo = Math.min(lo, px - LEG_HALF);
      hi = Math.max(hi, px + LEG_HALF);
    }
  }
  return [lo, hi];
}

function legsAt(legs, y) {
  const a = legEdges(legs[0], y);
  const b = legEdges(legs[1], y);
  return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
}

// Where the cloth's outlines cross row y at rest: its leftmost and rightmost x.
function clothSpan(polys, y) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const pts of polys) {
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y)) {
        const x = xi + ((y - yi) * (xj - xi)) / (yj - yi);
        lo = Math.min(lo, x);
        hi = Math.max(hi, x);
      }
    }
  }
  return [lo, hi];
}

function subdivide(pts, step = 1.2) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

export function drape(shapes, legs, rest, y0 = 34.4) {
  if (!shapes?.length || !legs) return shapes;
  const list = shapes.filter(Boolean);
  const hanging = list.filter((s) => s.t !== 'p' || s.pts.some(([, py]) => py + s.y > y0 + 0.5));
  if (!hanging.length) return shapes;
  // The cloth's resting outline, from the shapes that aren't small flat details.
  const polys = hanging.filter((s) => !s.f).map(polyOf);
  // Rows are read just inside the cloth, so the hem's own bottom edge moves with the rest.
  const bottom = Math.max(...polys.flat().map(([, py]) => py)) - 0.3;
  // The raw push at each row, then spread like cloth: a push holds for every row below it (the
  // hem can't tuck back in under a knee) and tapers up to the waist above it, so the side flares
  // as one A-line instead of kinking where the leg is.
  const raw = (y) => {
    const [cl, cr] = clothSpan(polys, y);
    const [ll, lr] = legsAt(legs, y);
    const [rl, rr] = legsAt(rest, y);
    const ok = Number.isFinite(cl) && Number.isFinite(ll) && Number.isFinite(rl);
    if (!ok) return null;
    return {
      l: Math.max(0, cl + 0.5 - ll, DRAPE_GIVE * (rl - ll)) - Math.max(0, ll - rl) * DRAPE_GIVE,
      r: Math.max(0, lr - (cr - 0.5), DRAPE_GIVE * (lr - rr)) - Math.max(0, rr - lr) * DRAPE_GIVE,
      mid: (cl + cr) / 2, half: Math.max(2, (cr - cl) / 2),
    };
  };
  const rows = [];
  for (let y = y0 + 0.5; y <= bottom; y += 0.5) {
    const v = raw(y);
    if (v) rows.push([y, v]);
  }
  const cache = new Map();
  const at = (yy) => {
    const y = Math.min(yy, bottom);
    const key = Math.round(y * 4);
    let v = cache.get(key);
    if (!v) {
      let outL = 0;
      let outR = 0;
      let near = rows[0]?.[1];
      for (const [ry, r] of rows) {
        const k = ry <= y ? 1 : Math.max(0, (y - y0) / (ry - y0));
        if (r.l > 0) outL = Math.max(outL, r.l * k);
        if (r.r > 0) outR = Math.max(outR, r.r * k);
        if (ry <= y + 0.25) near = r;
      }
      // Pulling in (a leg drawn toward the middle) only acts at its own row.
      const own = rows.find(([ry]) => Math.abs(ry - y) <= 0.25)?.[1];
      const inL = own && own.l < 0 ? -own.l : 0;
      const inR = own && own.r < 0 ? -own.r : 0;
      v = { outL, outR, inL, inR, mid: near?.mid ?? MID, half: near?.half ?? 6 };
      cache.set(key, v);
    }
    return v;
  };
  const move = ([x, y]) => {
    if (y <= y0) return [x, y];
    const d = at(y);
    const side = Math.max(-1, Math.min(1, (x - d.mid) / d.half));
    const l = Math.max(0, -side);
    const r = Math.max(0, side);
    return [x - (d.outL - d.inL) * l + (d.outR - d.inR) * r, y];
  };
  return shapes.map((s) => {
    if (!s || !hanging.includes(s)) return s;
    if (s.f && s.t !== 'p' && (s.t === 'e' ? Math.max(s.rx, s.ry) < 1.2 : s.w * s.h < 2)) {
      const [nx, ny] = move([s.x, s.y]);
      return { ...s, x: nx, y: ny };
    }
    const { x, y, w, h, rx, ry, pts: _p, ...keep } = s;
    return { ...keep, t: 'p', x: 0, y: 0, pts: subdivide(polyOf(s)).map(move) };
  });
}

// Shoes are drawn in the foot's frame (origin at the ankle, x toward the toe, y down to the sole)
// and turned by the foot's tilt; boot shafts run up the shin toward the knee.
function shoeShapes(ax, ay, kx, ky, tilt, shoe, tint) {
  const c = tint(shoe.color);
  const rad = (tilt * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const at = ([x, y]) => [ax + x * cos + y * sin, ay - x * sin + y * cos];
  const poly = (pts, col) => T(pts.map(at), col);
  const dot = (x, y, r, col) => {
    const [px, py] = at([x, y]);
    return F(E(px, py, r, r, col));
  };
  const len = Math.hypot(kx - ax, ky - ay) || 1;
  const shaft = (h, col, w = 2.8) => limb(ax, ay, ax + ((kx - ax) / len) * h, ay + ((ky - ay) / len) * h, w, w, col);
  // Seen from the front: a small rounded shoe centered under the ankle.
  const sole = (col) => poly([[-1.8, -1.4], [1.8, -1.4], [2.7, 0.2], [3, 2], [2.6, 3], [-2.6, 3], [-3, 2], [-2.7, 0.2]], col);
  if (shoe.family) return done(gearOf(shoe).shoe(shoe.tier, shoe.pal, { at, poly, dot, shaft, sole, c, tint }), shoe);
  switch (shoe.design) {
    case 'boots': return [shaft(3.4, c), sole(c), shaft(0.9, shade(c, 18), 3.1)];
    case 'leatherboots': return [shaft(4.6, c), sole(c), shaft(1.2, shade(c, -18), 3.1), dot(0.6, -0.4, 0.5, GOLD)];
    case 'sabatons': return [shaft(3, tint(SILVER)), sole(tint(SILVER)), poly([[-2.8, 2], [2.8, 2], [2.5, 3], [-2.5, 3]], tint(shade(SILVER, -14))), dot(0.4, 0, 0.6, '#ffffff')];
    case 'starboots': return [shaft(3.4, c), sole(c), shaft(0.8, GOLD, 3.1), dot(0.8, 0.6, 0.8, GOLD)];
    case 'wingboots': return [shaft(2.4, c), sole(c), poly([[-1.6, -1], [-4.8, -2.8], [-3.8, -0.6], [-4.6, 0.6], [-1.6, 0.6]], '#ffffff')];
    default: return [sole(c), poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], shade(c, -18))];
  }
}

// ---------- Hats ----------

export function hatShapes(design, c, piece = null, m = MOTION) {
  if (piece?.family) return done(gearOf(piece).hat(piece.tier, piece.pal, m), piece);
  return done(plainHat(design, c), null);
}

function plainHat(design, c) {
  const d = shade(c, -18);
  const l = shade(c, 20);
  switch (design) {
    case 'beanie': return [E(15.5, 7, 11, 5.4, c), R(4.6, 8.6, 21.8, 3, d), E(15.5, 1.2, 2.6, 2.6, l)];
    case 'sunhat': return [E(15.5, 8.6, 15, 2.8, c), E(15.5, 5.4, 8.6, 4.6, c), R(7.4, 6.6, 16.4, 2, '#ff9ec0'), F(E(23, 7, 1.4, 1.2, '#ffffff'))];
    case 'cap': return [E(14.5, 6.6, 10.6, 5, c), T([[17, 8], [29, 8.6], [28, 10.4], [17, 10.4]], d), F(E(12, 4.6, 2, 1.4, '#8fd3ff')), F(E(16.6, 4.6, 2, 1.4, '#8fd3ff'))];
    case 'helmet': return [E(15.5, 9, 11.6, 8.6, SILVER), R(3.8, 10, 3, 10, SILVER), R(24.2, 10, 3, 10, SILVER), R(4, 8.6, 23, 2, shade(SILVER, -15)), T([[14.4, 1], [17.6, 1], [18.6, -5], [13.4, -4]], '#ff9ec0'), F(E(10, 5, 1, 0.8, '#ffffff'))];
    case 'witch': return [E(15.5, 8.8, 15, 2.8, c), T([[8.6, 8], [22.4, 8], [19.4, 2], [22, -6], [14.4, -1]], c), R(9, 6.2, 13, 1.6, GOLD), F(E(15.8, 4.2, 0.8, 0.8, GOLD))];
    case 'circlet': return [R(5, 7.4, 21.6, 1.8, GOLD), F(E(15.5, 8.2, 1.9, 1.9, '#c9a6ff')), F(E(15, 7.6, 0.6, 0.6, '#ffffff')), T([[5, 7], [0, 3], [1.4, 6.8], [-0.4, 8.6], [4.6, 9]], '#ffffff'), T([[26, 7], [31, 3], [29.6, 6.8], [31.4, 8.6], [26.4, 9]], '#ffffff')];
    case 'bunny': return [E(15.5, 5.6, 11.6, 4.4, '#ffffff'), R(4, 6.6, 3, 14, '#ffffff'), R(24.4, 6.6, 3, 10, '#ffffff'), E(10.4, -2.6, 2.4, 8, '#ffffff'), E(19.6, -3.4, 2.4, 8.4, '#ffffff'), F(E(10.4, -2, 1.1, 6, '#ffc2d6')), F(E(19.6, -2.8, 1.1, 6.4, '#ffc2d6'))];
    case 'kitty': return [T([[5.4, 4.6], [7.6, -3.4], [11.8, 2.4]], c), T([[19.6, 2.4], [23.8, -3.4], [25.8, 4.6]], c), F(T([[7, 3.4], [7.9, -0.8], [10.2, 2.4]], '#ffc2d6')), F(T([[21.2, 2.4], [23.4, -0.8], [24.4, 3.4]], '#ffc2d6'))];
    case 'flowers': return [R(5, 6.4, 21.6, 1.8, '#7fd17a'), E(7.2, 6.4, 2.3, 2.3, '#ff9ec0'), E(12.2, 4.8, 2.3, 2.3, '#ffe36b'), E(18.4, 4.8, 2.3, 2.3, '#ffffff'), E(23.6, 6.4, 2.3, 2.3, '#c9a6ff'), F(E(12.2, 4.8, 0.7, 0.7, '#ff9ec0')), F(E(18.4, 4.8, 0.7, 0.7, GOLD))];
    case 'crown': return [T([[6, 7], [6, 0], [9, 3], [12, -3], [15.5, 2], [19, -3], [22, 3], [25, 0], [25, 7]], GOLD), F(E(15.5, 5, 1.4, 1.4, '#ff9ec0')), F(E(9.6, 5.2, 0.9, 0.9, '#8fe3ff')), F(E(21.4, 5.2, 0.9, 0.9, '#8fe3ff'))];
    case 'beret': return [E(14.6, 5.4, 11.6, 4.4, c), E(9.6, 4.4, 3, 2, l), R(13.6, 0, 2, 2, d), F(E(20.4, 4.4, 1, 1, GOLD))];
    default: return [];
  }
}

// Hats that hide the back hair (a hood or helmet wraps the whole head).
export const TUCKS_HAIR = new Set(['helmet', 'bunny']);
export const hatTucks = (hat) => Boolean(hat) && (hat.family ? gearOf(hat).hatTucks(hat.tier) : TUCKS_HAIR.has(hat.design));
export const hatHidesBangs = (hat) => Boolean(hat) && (hat.family ? gearOf(hat).hatHidesBangs(hat.tier) : hat.design === 'bunny');
// Pauldrons and puffs over a shoulder at (0, 0); side -1 is the back arm, 1 the front.
export function shoulderShapes(top, side) {
  return top?.family ? done(gearOf(top).shoulder(top.tier, top.pal, side), top) : [];
}

// Parts of a hat drawn behind the head: hoods and helmets wrap around it.
export function hatBackShapes(design, c, piece = null, m = MOTION) {
  if (piece?.family) return done(gearOf(piece).hatBack(piece.tier, piece.pal, m), piece);
  if (design === 'bunny') return done([E(15.5, 14, 13.4, 12.8, '#ffffff'), E(15.5, 26, 9, 3, '#ffffff')], null);
  if (design === 'helmet') return done([E(15.5, 13.4, 12.4, 11.4, SILVER)], null);
  if (design === 'witch') return [R(8, 8.6, 16, 3, shade(c, -18))];
  return [];
}

// ---------- Gloves (on each hand) ----------

export function handShapes(hx, hy, glove, skin, ex = hx, ey = hy - 4) {
  if (!glove) return [E(hx, hy, 2, 2, skin)];
  // A gauntlet weapon: a small glove on the weapon hand (render/weapon-designs.js).
  if (glove.gauntlet) return gloveShapes(glove.gauntlet, hx, hy, ex, ey);
  // The Mage's rune gauntlet (docs/design/mage-line.md) on her casting hand: a dark iron cuff
  // up the forearm with a flame-orange rune that glows, plated knuckles, her fingertips bare.
  if (glove.edge) {
    const l = Math.hypot(hx - ex, hy - ey) || 1;
    const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
    const [nx, ny] = [-uy, ux];
    const at = (u, k) => [hx - ux * u + nx * k, hy - uy * u + ny * k];
    return [
      // The cuff, flaring toward the elbow, with a brass rim at each end.
      T([at(1.6, 2.1), at(1.6, -2.1), at(4.6, -2.7), at(4.6, 2.7)], '#3a3346'),
      F(T([at(4.1, 2.6), at(4.1, -2.6), at(4.7, -2.75), at(4.7, 2.75)], '#c9a35a')),
      F(T([at(1.5, 2.15), at(1.5, -2.15), at(2, -2.25), at(2, 2.25)], '#c9a35a')),
      // The rune: a glow, a diamond and its bright core.
      F(E(...at(3.1, 0), 1.5, 1.5, '#8a4a3e')),
      F(T([at(2.2, 0), at(3.1, 0.9), at(4, 0), at(3.1, -0.9)], '#ff8a3a')),
      F(E(...at(3.1, 0), 0.4, 0.4, '#ffe2a0')),
      // The hand: bare fingertips, then the plated back of the hand and its knuckle ridge.
      E(...at(-0.9, 0), 1.6, 1.6, skin),
      E(hx, hy, 2.1, 2, '#3a3346'),
      F(T([at(-0.6, 1.9), at(-0.6, -1.9), at(0.2, -2), at(0.2, 2)], '#6a6478')),
      F(E(...at(0.6, 0.9), 0.45, 0.35, '#8a849a')),
    ];
  }
  if (glove.family) return done(gearOf(glove).hand(glove.tier, glove.pal, hx, hy, ex, ey), glove);
  const c = glove.color;
  switch (glove.design) {
    case 'cuffed': return [E(hx, hy, 1.8, 1.9, c), R(hx - 1.8, hy - 2.8, 3.6, 1.4, shade(c, 25))];
    case 'gauntlet': return [E(hx, hy, 2.1, 2, SILVER), R(hx - 1.8, hy - 3.6, 3.6, 2, c), F(E(hx - 0.6, hy - 0.6, 0.5, 0.5, '#ffffff'))];
    default: return [E(hx, hy, 1.8, 1.9, c)];
  }
}

// ---------- Earrings (on the visible ear, under the side hair) ----------

export function earringShapes(design, c, piece = null) {
  if (design === 'jewel') return jewelShapes(piece?.tier ?? 0, piece?.pal ?? { main: c, accent: '#ffffff', trim: GOLD });
  switch (design) {
    case 'drop': return [F(R(7.1, 20.6, 0.7, 1.6, GOLD)), E(7.4, 23.4, 1.2, 1.5, c)];
    case 'star': return [F(R(7.1, 20.6, 0.7, 1.6, GOLD)), T([[7.4, 21.6], [8, 23], [9.4, 23.2], [8.2, 24], [8.6, 25.4], [7.4, 24.6], [6.2, 25.4], [6.6, 24], [5.4, 23.2], [6.8, 23]], c)];
    default: return [E(7.4, 21.6, 1.1, 1.1, c)];
  }
}

// ---------- Capes (behind the body). `sway` bends the hem; wings flap with `flap`. ----------

// Capes hang from the shoulders behind the body, wide enough to show on both sides of it and down
// past the hips; the hem sways with `sway`. Wings come in pairs and flap with `flap`.
export function capeShapes(design, c, sway, flap, piece = null, m = null) {
  const mo = m ?? { ...MOTION, sway, flap };
  if (piece?.family) {
    const fam = piece.family;
    // (A set's own cape moves by itself.)
    if (!HANGS.has(fam) || SET_DESIGNS[piece.set]?.cape) return done(gearOf(piece).cape(piece.tier, piece.pal, mo), piece);
    const out = gearOf(piece).cape(piece.tier, piece.pal, STILL(mo)).filter(Boolean);
    return done(hang(out, 26, lowest(out), mo), piece);
  }
  const out = plainCape(design, c, flap);
  return done(design === 'fairy' || design === 'angel' ? out : hang(out, 26, lowest(out), mo), null);
}

function plainCape(design, c, flap) {
  const d = shade(c, -20);
  const s = 0;
  const h = 0;
  const cape = (bottom) => T([[8.6, 26], [22.4, 26], [25.4 + h, 36], [27 + s, bottom], [15.5 + s, bottom + 1.2], [4 + s, bottom], [5.6 + h, 36]], c);
  const hem = (bottom, col, th = 1.2) => T([[4 + s, bottom - th], [27 + s, bottom - th], [27 + s, bottom], [15.5 + s, bottom + 1.2], [4 + s, bottom]], col);
  switch (design) {
    case 'fairy': {
      const up = flap ? -2 : 1;
      const wing = [E(4, 29 + up, 6.4, 8.4, '#c9f2ff'), E(5, 39 + up, 4.6, 5.6, '#ffd0ec'), F(E(6.4, 29 + up, 3, 4.6, '#e8fbff'))];
      return [...wing, ...mirrorX(wing)];
    }
    case 'angel': {
      const up = flap ? -2 : 1;
      const wing = [T([[11, 28 + up], [3, 22 + up], [-4, 26 + up], [-3, 31 + up], [-5, 35 + up], [-2, 39 + up], [4, 41 + up], [10, 36 + up]], '#ffffff'), F(T([[3, 27 + up], [-2, 30 + up], [3, 31 + up]], '#eef2ff')), F(T([[3, 33 + up], [-2, 36 + up], [4, 37 + up]], '#eef2ff'))];
      return [...wing, ...mirrorX(wing)];
    }
    case 'starcape': return [cape(50), hem(50, GOLD), F(E(8 + h, 40, 0.7, 0.7, '#ffe36b')), F(E(23 + h, 43, 0.7, 0.7, '#ffffff')), F(E(7 + s, 47, 0.7, 0.7, '#ffffff')), F(E(24 + s, 47.6, 0.7, 0.7, '#ffe36b'))];
    case 'long': return [cape(50), hem(50, d)];
    case 'royal': return [cape(50), hem(50, GOLD, 2)];
    default: return [cape(44), hem(44, d)];
  }
}

// The front of a cape: ties over the shoulders and a clasp (or a fur collar) at the neck,
// drawn over the top.
export function capeFrontShapes(design, c, piece = null, m = MOTION) {
  if (piece?.family) return done(gearOf(piece).capeFront(piece.tier, piece.pal, m), piece);
  if (design === 'fairy' || design === 'angel') return [];
  const ties = [T([[10, 26], [12.6, 26], [13.6, 29.4], [11, 29]], c), T([[21, 26], [18.4, 26], [17.4, 29.4], [20, 29]], c)];
  if (design === 'royal') return [T([[9.6, 25.6], [21.4, 25.6], [21, 28.6], [15.5, 29.6], [10, 28.6]], '#ffffff'), F(E(12.4, 27.4, 0.5, 0.5, INK)), F(E(18.6, 27.4, 0.5, 0.5, INK)), F(E(15.5, 28.6, 1, 1, GOLD))];
  if (design === 'starcape') return [...ties, F(T([[15.5, 27.4], [16.4, 28.6], [15.5, 29.8], [14.6, 28.6]], GOLD))];
  if (design === 'long') return [...ties, F(E(15.5, 28.6, 1.1, 1.1, GOLD))];
  return [...ties, F(E(15.5, 28.6, 0.9, 0.9, shade(c, -24)))];
}


// ---------- Jewel earrings (the earring ladder), hanging from the ear at (7.4, 21) ----------
// Studs, then hoops, drops, charms, and finally feathers, halos, and stars; the gem takes the
// item's color (or its variant's gem) and the setting the tier's metal.

export function jewelShapes(t, p) {
  const g = p.main;
  const m = p.trim ?? GOLD;
  const x = 7.4;
  const hook = F(R(x - 0.35, 20.6, 0.7, 1.4, m));
  const shine = (cx, cy) => F(E(cx - 0.35, cy - 0.4, 0.35, 0.35, '#ffffff'));
  const star = (cx, cy, r, c) => T([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  }), c);
  switch (t) {
    case 0: case 1: case 2: return [E(x, 21.6, 0.9 + t * 0.15, 0.9 + t * 0.15, g), shine(x, 21.6)];
    case 3: case 4: return [E(x, 22.8, 1.5, 1.7, m), E(x, 22.8, 0.8, 1, 'none'), F(E(x, 24.4, 0.6, 0.6, g))];
    case 5: return [hook, E(x, 23.4, 1.2, 1.4, g), shine(x, 23.2)];
    case 6: return [hook, T([[x, 21.8], [x + 1.2, 23.6], [x, 25.4], [x - 1.2, 23.6]], g), shine(x, 23.2)];
    case 7: return [hook, E(x, 23.6, 1.5, 1.5, g), E(x + 0.7, 23.2, 1.2, 1.2, 'none'), F(E(x - 0.9, 24.4, 0.3, 0.3, m))];
    case 8: return [hook, star(x, 23.6, 1.7, g), shine(x, 23.4)];
    case 9: return [hook, E(x, 23.8, 1.1, 1.1, g), T([[x - 0.6, 23.2], [x - 2.6, 21.6], [x - 0.2, 22.8]], p.accent ?? g), shine(x, 23.6)];
    case 10: return [hook, E(x - 1, 23.6, 1, 1.6, p.accent ?? g), E(x + 1, 23.6, 1, 1.6, p.accent ?? g), E(x, 23.8, 0.7, 0.7, g)];
    case 11: return [hook, T([[x - 0.9, 22], [x + 0.9, 22], [x + 0.3, 25.8], [x, 26.4]], '#fff6e0'), F(E(x, 22.6, 0.7, 0.7, g))];
    case 12: return [hook, T([[x, 21.8], [x + 1.4, 23.4], [x + 0.4, 26.6], [x - 0.6, 23.6]], g), F(R(x - 0.1, 22.4, 0.3, 3.6, p.accent ?? '#ffffff'))];
    case 13: return [hook, T([[x, 21.8], [x + 1.4, 24], [x, 26], [x - 1.4, 24]], g), F(T([[x, 22.6], [x + 0.6, 24], [x, 25.2]], p.accent ?? '#ffffff'))];
    case 14: return [hook, E(x, 23.8, 1.6, 1.8, g), F(E(x - 0.5, 23.4, 0.5, 0.5, '#ffffff')), F(E(x + 0.6, 24.4, 0.3, 0.3, '#ffffff')), F(E(x + 0.2, 23, 0.25, 0.25, p.accent ?? '#ffffff'))];
    case 15: return [hook, star(x, 23.2, 1.4, g), F(E(x - 0.6, 25.2, 0.4, 0.4, g)), F(E(x + 0.5, 26, 0.3, 0.3, g))];
    case 16: return [E(x, 20.4, 1.8, 0.7, m), E(x, 20.4, 1.1, 0.3, 'none'), E(x, 22.6, 1, 1.2, g), shine(x, 22.4)];
    case 17: return [hook, T([[x, 21.8], [x + 2.2, 23.2], [x + 1.2, 24.4], [x + 1.6, 25.4], [x, 26.4], [x - 0.8, 23.4]], '#ffffff'), F(E(x, 22.4, 0.6, 0.6, g))];
    case 18: return [hook, E(x - 0.9, 23.6, 1, 1, m), E(x + 0.9, 23.6, 1, 1, m), E(x - 0.9, 23.6, 0.45, 0.45, 'none'), E(x + 0.9, 23.6, 0.45, 0.45, 'none'), F(E(x, 25.2, 0.6, 0.6, g))];
    default: return [hook, star(x, 23.8, 2.1, g), star(x, 23.8, 1, p.accent ?? '#ffffff'), F(E(x + 1.6, 22.2, 0.3, 0.3, '#ffffff'))];
  }
}
