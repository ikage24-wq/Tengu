// Face toolkit for monster art: eyes, glow-eyes, brows, mouths, noses, and the little acting marks
// (blush, sweat, tears, vein, dead eyes). Every piece is a flat polygon placed at sub-pixel
// precision (at res 3 a third of a logical px is one cell), so faces keep their exact colors and
// turn with the head when a module spins it. The sprite outline only wraps the silhouette, so each
// open shape here carries its own ink rim, drawn just under it.
//
// Orientation: monsters face right. `s` is +1 for the near eye (outer corner to the right) and -1
// for the far one (outer corner to the left); mouths take s = +1 when the front corner is to the
// right. Light comes from the top-left, so catchlights and highlights never flip.
//
// Moods are acted with parameters, not glyphs: lid closure and slant narrow an eye, `raise` pushes
// the lower lid up, brows turn by `angle`, mouths open by `open`; each species acts its moods its
// own way.

import { T, F, BLUSH, shade, mix } from './kit.js';

export const LASH = '#2a2035';
export const TONGUE = '#ff8fab';
export const THROAT = '#5e2446';
export const TOOTH = '#fffaf2';
// Mouth lines are a lip-dark, never the outline ink.
export const LIP = '#8a3550';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Feature anchors snap to the 1/3 px grid so an expression rasterizes the same in every frame.
const snap3 = (v) => Math.round(v * 3) / 3;
const lerp = (a, b, t) => a + (b - a) * t;
const range = (n) => Array.from({ length: n + 1 }, (_, i) => i / n);

// ---------- Geometry ----------

export const poly = (pts, c) => F(T(pts, c));

export function ovalPts(cx, cy, rx, ry, a = 0, n = 16) {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  return range(n).slice(0, n).map((t) => {
    const x = Math.cos(t * Math.PI * 2) * rx;
    const y = Math.sin(t * Math.PI * 2) * ry;
    return [cx + x * ca - y * sa, cy + x * sa + y * ca];
  });
}
// A rotated ellipse as a polygon (so it turns with spin()); `a` in radians.
export const oval = (cx, cy, rx, ry, c, a = 0, n = 16) => poly(ovalPts(cx, cy, rx, ry, a, n), c);

// A polyline drawn as one polygon; `w` is its width, a number or a function of t (0..1 along it).
export function band(pts, w, c) {
  const n = pts.length;
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const ww = (typeof w === 'function' ? w(i / (n - 1)) : w) / 2;
    const nx = (-(b[1] - a[1]) / len) * ww;
    const ny = ((b[0] - a[0]) / len) * ww;
    l.push([x + nx, y + ny]);
    r.push([x - nx, y - ny]);
  });
  return poly([...l, ...r.reverse()], c);
}
// A band with round ends, for strokes that should read as clean marks (X eyes, sweat lines).
const capped = (pts, w, c) => [band(pts, w, c), oval(pts[0][0], pts[0][1], w / 2, w / 2, c, 0, 8), oval(pts.at(-1)[0], pts.at(-1)[1], w / 2, w / 2, c, 0, 8)];
// Tapered at both ends (sin profile): lashes, lip lines, brows.
const taper = (w, lo = 0.25) => (t) => w * (lo + (1 - lo) * Math.sin(Math.PI * t) ** 0.5);

// Pushes a closed polygon's edge out by d (in by -d), for ink rims around teeth, drops and pads.
export function grow(pts, d) {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1];
  const sg = area > 0 ? 1 : -1;
  const nrm = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(sg * (b[1] - a[1])) / len, (-sg * (b[0] - a[0])) / len];
  };
  return pts.map((p, i) => {
    const n0 = nrm(pts[(i - 1 + n) % n], p);
    const n1 = nrm(p, pts[(i + 1) % n]);
    let mx = n0[0] + n1[0];
    let my = n0[1] + n1[1];
    const len = Math.hypot(mx, my) || 1;
    const k = Math.min(2, 1 / Math.max(0.5, (mx * n0[0] + my * n0[1]) / len));
    mx = (mx / len) * d * k;
    my = (my / len) * d * k;
    return [p[0] + mx, p[1] + my];
  });
}
// A shape with its own ink rim (rim drawn first, slightly larger).
export const inked = (pts, c, ink = LASH, d = 0.3) => [poly(grow(pts, d), ink), poly(pts, c)];

// The area between an upper and a lower curve joining two corners at x - w and x + w. up/dn take
// t from 0 (inner corner, on the -s side) to 1 (outer corner). clip() squeezes points inside it.
function lens(x, s, w, up, dn, n = 12) {
  const xAt = (t) => x + s * (-w + 2 * w * t);
  const ts = range(n);
  const upper = ts.map((t) => [xAt(t), up(t)]);
  const lower = ts.map((t) => [xAt(t), Math.max(up(t), dn(t))]);
  const tOf = (px) => clamp((s * (px - x) + w) / (2 * w), 0, 1);
  const clip = (pts) => pts.map(([px, py]) => {
    const t = tOf(px);
    const u = up(t);
    return [clamp(px, x - w, x + w), clamp(py, u, Math.max(u, dn(t)))];
  });
  return { upper, lower, pts: [...upper, ...lower.slice(1, -1).reverse()], clip, xAt, up, dn };
}
// The same lens pushed out by d (in by -d), corners included.
function swell(L, x, s, w, d, lo = 1) {
  const W = w + Math.abs(d) * 0.9 * Math.sign(d);
  const tIn = (t) => clamp((t * 2 * W - (W - w)) / (2 * w), 0, 1);
  const end = (t) => Math.sin(Math.PI * clamp(t, 0, 1)) ** 0.35;
  return lens(x, s, W, (t) => L.up(tIn(t)) - d * (0.4 + 0.6 * end(t)), (t) => L.dn(tIn(t)) + d * lo * (0.4 + 0.6 * end(t)));
}

// ---------- Eyes ----------

// Eye shapes. up/dn: lid heights (x h); e/e2: upper/lower curve exponents (low = round, high =
// pointed corners); peak: where the upper lid is highest (0 inner corner .. 1 outer); inY/outY:
// corner heights (x h, + = down); lid: resting closure; animal: no white, a dark rim all round.
export const SHAPES = {
  almond: { up: 1, dn: 0.72, e: 0.75, e2: 0.95, peak: 0.45, inY: 0.15, outY: -0.08 },
  round: { up: 1, dn: 1, e: 0.5, e2: 0.55, peak: 0.5, inY: 0, outY: 0 },
  droopy: { up: 0.95, dn: 0.78, e: 0.65, e2: 0.85, peak: 0.36, inY: -0.15, outY: 0.38 },
  sharp: { up: 0.85, dn: 0.55, e: 0.9, e2: 1.15, peak: 0.62, inY: 0.28, outY: -0.4 },
  heavy: { up: 1, dn: 0.85, e: 0.45, e2: 0.75, peak: 0.55, inY: 0.08, outY: 0, lid: 0.4 },
  animal: { up: 1, dn: 1, e: 0.55, e2: 0.6, peak: 0.55, inY: 0.05, outY: -0.08, animal: true },
};

// Three iris values (dark under the lid, mid, light crescent) from one color or an explicit list.
export const irisTones = (c) => (Array.isArray(c) ? c : [mix(shade(c, -32), LASH, 0.25), c, mix(c, '#fff6d8', 0.55)]);

// Where every lid curve of an eye sits, for one shape and mood (shared by eye and glowEye).
function lids(x, y, o) {
  const P = { ...SHAPES[o.shape ?? 'almond'], ...(o.custom ?? {}) };
  const s = o.s ?? 1;
  const w = o.w ?? 2;
  const h = o.h ?? 2;
  const mid = (t) => lerp(y + P.inY * h, y + P.outY * h - (o.tilt ?? 0), t);
  const k = Math.log(0.5) / Math.log(P.peak);
  const upR = (t) => mid(t) - h * P.up * Math.sin(Math.PI * t ** k) ** P.e;
  const dnR = (t) => mid(t) + h * P.dn * Math.sin(Math.PI * t) ** P.e2;
  const meet = (t) => lerp(upR(t), dnR(t), 0.74);
  const lid = clamp(o.lid ?? P.lid ?? 0, 0, 1);
  const sl = o.slant ?? 0;
  const lidAt = (t) => clamp(lid + (sl > 0 ? sl * (1 - t) ** 1.2 : -sl * t ** 1.2) * 0.8, 0, 1);
  const up = (t) => lerp(upR(t), meet(t), lidAt(t));
  const dn = (t) => lerp(dnR(t), meet(t), clamp(o.raise ?? 0, 0, 1) * 0.6);
  return { P, s, w, h, mid, upR, dnR, up, dn, lidAt, L: lens(x, s, w, up, dn) };
}

// An eye. x, y is its center. Options (all optional):
//   s        +1 near eye / -1 far eye           shape  a SHAPES key        w, h  half width / height
//   tilt     extra outer-corner lift (px)       lid    closure 0..1 (blinks, sleepy, angry)
//   slant    + angry (inner side drops), - sad (outer side drops)           raise lower lid up 0..1
//   sclera   white color (null: no white)       iris   color or [dark, mid, light]
//   irisW/H  iris size (x w / x h)              look   [lx, ly] -1..1, where it looks (screen space)
//   pupil    'round' 'slit' 'bar' 'star' 'pin' 'none'   pupilC, pupilK (size, <1 contracted)
//   lash     line weight (1 normal)             lashC  lash color (a dark of the species' hue)
//   flicks   lash clumps at the wing 0..2       liner  a colored liner stroke under the wing
//   lower    soft lower-lid line weight 0..1    lowerC its color (never dark: a dark one bruises)
//   crease   lid crease color                   rim    ink rim width      shine catchlight size (0 off)
//   ring     a pale ring around the rim (hares, owls), ringW its width
//   glint    an extra star sparkle              closed 'blink' 'sleep' 'happy' 'squeeze'
export function eye(x, y, o = {}) {
  x = snap3(x);
  y = snap3(y);
  const G = lids(x, y, o);
  const { P, s, w, h, L } = G;
  const lashC = o.lashC ?? LASH;
  const th = 0.85 * (o.lash ?? 1) * clamp(h / 2.4, 0.8, 1.2);
  const out = [];
  if (o.closed) return closedEye(x, y, G, o, lashC, th);
  // Fully shut by the lid: draw it as a blink.
  if (G.lidAt(0.5) > 0.93 && G.lidAt(0.1) > 0.9 && G.lidAt(0.9) > 0.9) return closedEye(x, y, G, { ...o, closed: 'blink' }, lashC, th);
  const sclera = P.animal ? null : o.sclera === undefined ? '#fffaf7' : o.sclera;
  const [i0, i1, i2] = irisTones(o.iris ?? '#8a6ad0');
  // The ink rim: all round an animal eye; on others only up top (the soft lower lid comes later).
  const rim = o.rim ?? (P.animal ? 0.45 : 0.3);
  if (o.ring) out.push(poly(swell(L, x, s, w, rim + (o.ringW ?? 0.5), 1).pts, o.ring));
  out.push(poly(swell(L, x, s, w, rim, P.animal ? 1 : 0).pts, lashC));
  if (sclera) {
    out.push(poly(L.pts, sclera));
    // The lash's shadow: a strip across the top of the white.
    out.push(poly(L.clip([...L.upper, ...L.upper.slice().reverse().map(([px, py]) => [px, py + 0.67 + h * 0.1])]), mix(sclera, '#9c8cc8', 0.35)));
  } else {
    out.push(poly(L.pts, i0));
  }
  const [lx, ly] = o.look ?? [0, 0];
  const irx = w * (o.irisW ?? (sclera ? 0.62 : 0.9));
  const iry = h * (o.irisH ?? (sclera ? 1.02 : 1));
  const ix = x + s * w * (sclera ? 0.06 : 0) + lx * w * (sclera ? 0.32 : 0.12);
  const iy = y + h * 0.05 + ly * h * 0.22;
  // Iris: a dark top band under the lid, the mid color, and a light crescent at the bottom.
  if (sclera) out.push(poly(L.clip(ovalPts(ix, iy, irx, iry, 0, 18)), i0));
  out.push(poly(L.clip(ovalPts(ix, iy + iry * 0.3, irx * 0.86, iry * 0.68, 0, 18)), i1));
  out.push(poly(L.clip(ovalPts(ix, iy + iry * 0.62, irx * 0.62, iry * 0.32, 0, 14)), i2));
  // Pupil.
  const pk = o.pupilK ?? 1;
  const pc = o.pupilC ?? (o.pupil === 'star' ? '#fff6c8' : LASH);
  const px = ix;
  const py = iy + iry * 0.1;
  switch (o.pupil ?? 'round') {
    case 'round':
      out.push(poly(L.clip(ovalPts(px, py, irx * 0.46 * pk, iry * 0.5 * pk, 0, 14)), pc));
      break;
    case 'slit': {
      const sw = Math.max(0.24, irx * 0.24 * pk);
      out.push(poly(L.clip([[px, py - iry * 0.98], [px + sw * 0.7, py - iry * 0.5], [px + sw, py], [px + sw * 0.7, py + iry * 0.5], [px, py + iry * 0.98], [px - sw * 0.7, py + iry * 0.5], [px - sw, py], [px - sw * 0.7, py - iry * 0.5]]), pc));
      break;
    }
    case 'bar': {
      const bh = Math.max(0.22, iry * 0.22 * pk);
      out.push(poly(L.clip([[px - irx * 0.85, py - bh * 0.7], [px - irx * 0.6, py - bh], [px + irx * 0.6, py - bh], [px + irx * 0.85, py - bh * 0.7], [px + irx * 0.85, py + bh * 0.7], [px + irx * 0.6, py + bh], [px - irx * 0.6, py + bh], [px - irx * 0.85, py + bh * 0.7]]), pc));
      break;
    }
    case 'star':
      out.push(poly(L.clip(starPts(px, py, Math.min(irx, iry) * 0.7 * pk, 4)), pc));
      break;
    case 'pin':
      out.push(poly(L.clip(ovalPts(px, py, Math.max(0.3, irx * 0.2 * pk), Math.max(0.34, iry * 0.24 * pk), 0, 10)), pc));
      break;
    default:
      break;
  }
  // Catchlights on the light side (upper front), the same spot in both eyes: a big one up top,
  // a small one at the lower back.
  const sh = o.shine ?? 1;
  if (sh > 0) {
    const r = Math.max(0.5, Math.min(irx, iry) * 0.38) * sh;
    const cy = Math.max(iy - iry * 0.32, L.up(0.6) + r * 0.9);
    out.push(poly(L.clip(ovalPts(ix + irx * 0.3, cy, r, r, Math.PI / 8, 8)), '#ffffff'));
    out.push(poly(L.clip(ovalPts(ix - irx * 0.38, iy + iry * 0.42, Math.max(0.34, r * 0.45), Math.max(0.34, r * 0.45), 0, 8)), '#ffffff'));
    if (o.glint) out.push(poly(starPts(ix + irx * 0.55, iy + iry * 0.05, r * 1.1, 4), '#ffffff'));
  }
  // Liner (under the wing), then the lash: one polygon, heaviest line on the face.
  const [ox, oy] = L.upper.at(-1);
  if (o.liner) out.push(band([[ox - s * 0.6, oy + 0.45], [ox + s * 0.5, oy + 0.2], [ox + s * 1.5, oy - 0.5]], (t) => 0.7 * (1 - t * 0.6), o.liner));
  out.push(lashPoly(L.upper, s, th, P.animal ? o.flicks ?? 0 : o.flicks ?? 2, lashC, P.animal));
  // The lower lid: a soft line in a rosy tint of the lash color.
  const lo = o.lower ?? 1;
  if (lo > 0 && !P.animal) out.push(band(L.lower.slice(1, -1), (t) => lerp(0.33, 0.6, t) * lo * (0.5 + 0.5 * Math.sin(Math.PI * clamp(t * 0.9 + 0.1, 0, 1)) ** 0.4), o.lowerC ?? mix(lashC, '#e0a1ab', 0.55)));
  // The lid crease: follows the open lid's curve, so a lowered lid reads as a heavy fold.
  if (o.crease) out.push(band(range(8).map((t) => [L.xAt(0.12 + t * 0.8), G.upR(0.12 + t * 0.8) - 0.55 - (G.lidAt(0.5) > 0.15 ? 0 : 0.1)]), taper(0.34, 0.1), o.crease));
  return out;
}

// The upper lash as one polygon: thin at the inner corner, thick over the outer part, ending in
// a wing with up to two pointed clumps (none on animal eyes, just a rounded end).
function lashPoly(upper, s, th, clumps, c, animal) {
  const n = upper.length - 1;
  const wd = (i) => th * (animal ? lerp(0.8, 1, i / n) : lerp(0.7, 1.3, Math.min(1, (i / n) * 1.6)));
  const top = upper.map(([x, y], i) => [x, y - wd(i) * 0.72]);
  const bot = upper.map(([x, y], i) => [x, y + wd(i) * 0.28]);
  const [ox, oy] = upper[n];
  const end = [];
  if (clumps > 0) {
    end.push([ox + s * (1.1 + 0.25 * clumps) * Math.min(1.2, th + 0.2), oy - 0.75 - 0.2 * clumps]);
    if (clumps > 1) end.push([ox + s * 0.45, oy - 0.05], [ox + s * 1.15, oy + 0.3]);
  } else end.push([ox + s * th * 0.45, oy - th * 0.2]);
  return poly([...top, ...end, ...bot.reverse()], c);
}

// Shut eyes acted per mood: a soft blink, a sleepy line, a happy arch, a tight wince.
function closedEye(x, y, G, o, lashC, th) {
  const { s, w, h, mid, L } = G;
  const out = [];
  const ts = range(10);
  const flick = (px, py, dir, k = 1) => out.push(band([[px - s * 0.4, py], [px + s * 0.85 * k, py + dir * 0.6 * k]], (t) => Math.max(0.7, th * 0.8) * (1 - t * 0.75), lashC));
  switch (o.closed) {
    case 'happy': {
      // An arch: cheeks pushing the lids up into a smile.
      const pts = ts.map((t) => [L.xAt(t), mid(t) + h * 0.5 - h * 0.95 * Math.sin(Math.PI * t) ** 0.75]);
      out.push(band(pts, (t) => th * lerp(0.7, 1.15, t) * (0.45 + 0.55 * Math.sin(Math.PI * clamp(t, 0.08, 0.92)) ** 0.3), lashC));
      flick(pts[10][0], pts[10][1], -1, 0.85);
      return out;
    }
    case 'squeeze': {
      // A wince: the upper lid crushed down and the lower one pushed up, meeting at the inner
      // corner, with strain creases above.
      const k = o.squeeze ?? 1;
      const pin = [L.xAt(0.06), y + h * 0.15];
      const top = [L.xAt(1) + s * 0.2, y - h * 0.6 * k];
      const bot = [L.xAt(1) + s * 0.1, y + h * 0.65 * k];
      const curve = (a, b, bow) => ts.map((t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t) + bow * Math.sin(Math.PI * t)]);
      out.push(band(curve(pin, top, -h * 0.28), (t) => th * lerp(0.75, 1.2, t), lashC), band(curve(pin, bot, h * 0.12), (t) => th * lerp(0.6, 0.95, t), lashC));
      const cc = o.crease ?? mix(lashC, '#e7a9a9', 0.4);
      out.push(band([[L.xAt(0.3), y - h * 0.95], [L.xAt(0.65), y - h * 1.2 * k], [L.xAt(0.95), y - h * 1.0]], taper(0.3, 0.15), cc));
      return out;
    }
    case 'sleep': {
      const pts = ts.map((t) => [L.xAt(t), mid(t) + h * 0.35 + h * 0.18 * Math.sin(Math.PI * t)]);
      out.push(band(pts, (t) => th * lerp(0.6, 1.05, t), lashC));
      flick(pts[10][0], pts[10][1], 0.6, 0.7);
      if (o.crease) out.push(band(range(6).map((t) => [L.xAt(0.15 + t * 0.7), mid(0.15 + t * 0.7) - h * 0.25]), taper(0.3, 0.1), o.crease));
      return out;
    }
    default: {
      // A blink: the lid curve sagging closed, lashes down at the outer corner.
      const pts = ts.map((t) => [L.xAt(t), mid(t) + h * 0.32 + h * 0.4 * Math.sin(Math.PI * t) ** 0.8]);
      out.push(band(pts, (t) => th * lerp(0.65, 1.15, t), lashC));
      flick(pts[10][0], pts[10][1], 0.75);
      if (o.crease) out.push(band(range(6).map((t) => [L.xAt(0.15 + t * 0.7), G.upR(0.15 + t * 0.7) + h * 0.25]), taper(0.3, 0.1), o.crease));
      return out;
    }
  }
}

// A light for eyes in spirits, constructs and helmets: a halo melting into the surface (bg), a
// bright rim, a saturated core, a hot center, and a catchlight. Takes eye()'s shape, lid, slant,
// raise, look and closed options, plus c (glow color), bg, hot (center color), flick 0..1 (the
// flame's flicker: the core shifts and a spark jumps off).
export function glowEye(x, y, o = {}) {
  x = snap3(x);
  y = snap3(y);
  const G = lids(x, y, { shape: 'round', ...o });
  const { s, w, h, L, mid } = G;
  const c = o.c ?? '#7fe8ff';
  const bg = o.bg ?? LASH;
  const halo = mix(bg, c, 0.4);
  const rimC = mix(c, '#ffffff', 0.55);
  const hot = o.hot ?? mix(c, '#ffffff', 0.85);
  const out = [];
  if (o.closed) {
    // Shut: a glowing seam with its halo.
    const happy = o.closed === 'happy';
    const pts = range(10).map((t) => [L.xAt(t), mid(t) + (happy ? h * 0.4 - h * 0.85 * Math.sin(Math.PI * t) ** 0.75 : h * 0.3 + h * 0.3 * Math.sin(Math.PI * t))]);
    if (o.closed === 'squeeze') {
      const pin = [L.xAt(0.06), y];
      out.push(band([pin, [L.xAt(1), y - h * 0.6]], 1.1, halo), band([pin, [L.xAt(1), y + h * 0.6]], 1.1, halo));
      out.push(band([pin, [L.xAt(1), y - h * 0.6]], 0.5, rimC), band([pin, [L.xAt(1), y + h * 0.6]], 0.5, rimC));
      return out;
    }
    out.push(band(pts, taper(1.3, 0.4), halo), band(pts, taper(0.6, 0.3), rimC), band(pts.slice(2, 9), taper(0.25, 0.2), hot));
    return out;
  }
  out.push(poly(swell(L, x, s, w, 0.75).pts, halo), poly(swell(L, x, s, w, 0.3).pts, mix(bg, c, 0.75)));
  out.push(poly(L.pts, rimC));
  const core = swell(L, x, s, w, -Math.min(w, h) * 0.22);
  out.push(poly(core.pts, c));
  const [lx, ly] = o.look ?? [0, 0];
  const fl = o.flick ?? 0;
  const cx = x + lx * w * 0.3 + Math.sin(fl * Math.PI * 2) * w * 0.08;
  const cy = y + h * 0.1 + ly * h * 0.2;
  out.push(poly(L.clip(ovalPts(cx, cy, w * 0.42, h * 0.45, 0, 12)), hot));
  if (o.pupil === 'slit') out.push(poly(L.clip([[cx, cy - h * 0.8], [cx + w * 0.12, cy], [cx, cy + h * 0.8], [cx - w * 0.12, cy]]), mix(c, LASH, 0.55)));
  out.push(poly(L.clip(ovalPts(cx + w * 0.32, cy - h * 0.35, Math.max(0.4, w * 0.22), Math.max(0.4, w * 0.22), 0, 8)), '#ffffff'));
  if (fl > 0.5) out.push(poly(starPts(L.xAt(0.85) + s * 0.4, y - h - 0.6 - fl * 0.6, 0.6 + fl * 0.3, 4), rimC));
  return out;
}

// A star outline with n points (pupils, sparkles).
export function starPts(x, y, r, n = 4, inner = 0.38) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * inner : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return pts;
}

// Dead eyes: type 'x' (two clean crossed strokes) or 'swirl' (a dizzy spiral). r is the half size.
export function deadEye(x, y, r, o = {}) {
  const c = o.c ?? LASH;
  const th = o.th ?? Math.max(0.5, r * 0.36);
  if (o.type === 'swirl') {
    const pts = range(22).map((t) => {
      const a = t * Math.PI * 4.4 * (o.s ?? 1) + (o.turn ?? 0);
      const rr = r * (0.12 + 0.88 * t);
      return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.92];
    });
    return [band(pts, (t) => th * lerp(0.45, 0.9, t), c)];
  }
  const k = 0.88;
  return [...capped([[x - r, y - r * k], [x + r, y + r * k]], th, c), ...capped([[x - r, y + r * k], [x + r, y - r * k]], th, c)];
}

// ---------- Brows ----------

// A brow centered at (x, y). s: which eye (+1 near, -1 far); len: half length; angle: degrees,
// + slams the inner end down (anger), - lifts it (worry, pain); arch: px of curve; th: thickness;
// shape: 'arch' (tapered stroke), 'bushy' (thick with tufts), 'dot' (a round maro brow), 'tuft'
// (fur strokes, for animals), 'flat'.
export function brow(x, y, o = {}) {
  x = snap3(x);
  y = snap3(y);
  const s = o.s ?? 1;
  const len = o.len ?? 1.6;
  const a = ((o.angle ?? 0) * Math.PI) / 180;
  const arch = o.arch ?? 0.4;
  const th = o.th ?? 0.6;
  const c = o.c ?? LASH;
  // t = 0 at the inner end, 1 at the outer.
  const at = (t) => {
    const u = -len + 2 * len * t;
    return [x + s * u * Math.cos(a), y - u * Math.sin(a) - arch * (1 - (u / len) ** 2)];
  };
  const pts = range(8).map(at);
  switch (o.shape ?? 'arch') {
    case 'dot': {
      const [dx, dy] = at(0.3);
      return [oval(dx, dy, len * 0.55, th * 0.8, c, -s * a, 12), oval(dx - 0.15, dy - th * 0.25, len * 0.22, th * 0.25, mix(c, '#ffffff', 0.4), -s * a, 8)];
    }
    case 'tuft': {
      const out = [];
      for (const t of [0.15, 0.5, 0.85]) {
        const [px, py] = at(t);
        out.push(band([[px - s * 0.5, py + th * 0.4], [px + s * 0.4, py - th * 0.5]], (u) => th * (1 - u * 0.75), c));
      }
      return out;
    }
    case 'bushy': {
      const out = [band(pts, (t) => th * lerp(1.35, 0.8, t) * (0.55 + 0.45 * Math.sin(Math.PI * clamp(t, 0.1, 0.9)) ** 0.4), c)];
      for (const t of [0.2, 0.5, 0.8]) {
        const [px, py] = at(t);
        out.push(poly([[px - s * 0.45, py - th * 0.3], [px + s * 0.55, py - th * 0.95], [px + s * 0.45, py]], c));
      }
      return out;
    }
    case 'flat':
      return [band(pts, th, c)];
    default:
      return [band(pts, (t) => th * lerp(1.1, 0.45, t) * (0.6 + 0.4 * Math.sin(Math.PI * clamp(t, 0.05, 1)) ** 0.3), c)];
  }
}

// ---------- Mouths ----------

// A mouth centered at (x, y), w its half width. type:
//   closed: 'smile' 'smirk' 'flat' 'frown' 'wavy' 'cat' (an ω)
//   open:   'grin' (happy D), 'snarl' (lip curled, corners down), 'shout' (tall, wide open),
//           'pained' (wide, wobbly, teeth gritted), 'o' (small round), 'pout' (puckered o)
// open: 0..1 how far it opens; h: its height fully open; s: front corner side; tilt: the front
// corner lifts by this many px (smirks, sneers); curve: + corners up, - corners down; th: line
// weight; ink, inner (mouth inside), tongue (color, or false); teeth: 'top' 'bottom' 'both'
// 'gritted' 'buck' 'none' (closed mouths take 'buck'); fangs: top fangs (0 1 2); tusks: bottom
// fangs rising over the lip (0 1 2), on open and closed mouths alike; fangAt / tuskAt: where
// along the mouth (0..1) the fangs sit; tongueOut: a tongue hanging out (dead, taunting).
export function mouth(x, y, o = {}) {
  x = snap3(x);
  y = snap3(y);
  const type = o.type ?? 'smile';
  const s = o.s ?? 1;
  const w = o.w ?? 1.6;
  const ink = o.ink ?? LIP;
  const th = o.th ?? 0.5;
  const tilt = o.tilt ?? 0;
  const out = [];
  const X = (t) => x + s * (-w + 2 * w * t);
  const lift = (t) => -tilt * t * t;
  const closed = ['smile', 'smirk', 'flat', 'frown', 'wavy', 'cat'].includes(type);
  if (closed) {
    const cv = o.curve ?? { smile: 0.55, smirk: 0.35, frown: -0.5, cat: 0.5 }[type] ?? 0;
    const Y = (t) => {
      if (type === 'cat') return y + Math.abs(Math.sin(Math.PI * 2 * t)) ** 0.8 * cv - 0.05;
      if (type === 'wavy') return y + Math.sin(Math.PI * 4 * t) * (o.amp ?? 0.28);
      return y + cv * (Math.sin(Math.PI * t) ** 0.9 - 0.4) + lift(t) - (type === 'smirk' ? 0.4 * t ** 2 : 0);
    };
    const pts = range(12).map((t) => [X(t), Y(t)]);
    out.push(band(pts, taper(th * 1.15, 0.45), ink));
    // Fangs peeking over the lip line.
    for (const t of fangSpots(o.fangs ?? 0, o.fangAt, 0.3)) out.push(...fang(X(t), Y(t) + th * 0.3, 0.55 * (o.fangK ?? 1), 1, ink));
    for (const t of fangSpots(o.tusks ?? 0, o.tuskAt ?? o.fangAt, 0.25)) out.push(...fang(X(t), Y(t) - th * 0.2, 0.75 * (o.fangK ?? 1), -1, ink));
    if (o.teeth === 'buck') out.push(...buck(X(0.55), Y(0.55) + th * 0.2, Math.max(0.5, w * 0.3), 1, ink));
    if (o.dimple) for (const t of [0, 1]) out.push(band([[X(t) - s * (t ? -0.05 : 0.05), Y(t) - 0.35], [X(t) + s * (t ? 0.25 : -0.25), Y(t) + 0.15]], 0.26, ink));
    if (o.tongueOut) out.push(...tongueOut(X(0.62), Y(0.62), w, o, ink));
    return out;
  }
  const open = clamp(o.open ?? 1, 0.05, 1.4);
  const h = (o.h ?? w * 1.2) * open;
  const sn = (t, e) => Math.sin(Math.PI * t) ** e;
  const shapes = {
    grin: [(t) => y - h * 0.12 * sn(t, 1.2) - 0.15 * h * (1 - sn(t, 0.6)), (t) => y + h * 0.85 * sn(t, 0.6)],
    snarl: [(t) => y + h * 0.15 - h * 0.45 * sn(t, 0.65) + 0.25 * h * (1 - sn(t, 0.5)), (t) => y + h * 0.15 + h * 0.5 * sn(t, 0.8)],
    shout: [(t) => y - h * 0.35 * sn(t, 0.55), (t) => y + h * 0.75 * sn(t, 0.5)],
    pained: [(t) => y - h * 0.28 * sn(t, 0.35) + Math.sin(t * Math.PI * 4) * h * 0.06, (t) => y + h * 0.32 * sn(t, 0.35) - Math.sin(t * Math.PI * 4) * h * 0.06],
    o: [(t) => y - h * 0.5 * sn(t, 0.5), (t) => y + h * 0.5 * sn(t, 0.5)],
    pout: [(t) => y - h * 0.42 * sn(t, 0.5), (t) => y + h * 0.5 * sn(t, 0.5)],
  };
  const [top0, bot0] = shapes[type] ?? shapes.grin;
  const top = (t) => top0(t) + lift(t);
  const bot = (t) => bot0(t) + lift(t);
  const L = lens(x, s, w, top, bot);
  out.push(poly(swell(L, x, s, w, th * 0.75).pts, ink), poly(L.pts, o.inner ?? THROAT));
  // The throat: darker at the back of the mouth.
  out.push(poly(L.clip(ovalPts(x - s * w * 0.1, top(0.5) + h * 0.15, w * 0.7, h * 0.35, 0, 12)), shade(o.inner ?? THROAT, -10)));
  const tc = o.tongue === undefined ? TONGUE : o.tongue;
  if (tc && type !== 'pained') {
    const ty = bot(0.55) - h * 0.18;
    out.push(poly(L.clip(ovalPts(x + s * w * 0.15, ty, w * 0.62, Math.max(0.5, h * 0.32), 0, 14)), tc));
    out.push(poly(L.clip(ovalPts(x + s * w * 0.0, ty - h * 0.08, w * 0.28, Math.max(0.22, h * 0.1), 0, 10)), mix(tc, '#ffffff', 0.45)));
  }
  const teeth = o.teeth ?? (type === 'pained' ? 'gritted' : type === 'grin' ? 'top' : 'none');
  const toothRow = (edge, dir, d) => {
    const pts = range(8).map((u) => {
      const t = 0.1 + u * 0.8;
      return [X(t), edge(t)];
    });
    const inner = pts.map(([px, py], i) => [px, py + dir * d * (0.55 + 0.45 * Math.sin((Math.PI * i) / 8))]);
    out.push(poly(L.clip([...pts, ...inner.reverse()]), TOOTH));
    out.push(band(L.clip(pts.map(([px, py], i) => [px, py + dir * d * (0.55 + 0.45 * Math.sin((Math.PI * i) / 8))])), 0.33, mix(ink, TOOTH, 0.45)));
  };
  if (teeth === 'gritted') {
    out.push(poly(swell(L, x, s, w, -0.12).pts, TOOTH));
    const mids = range(10).map((t) => [X(t), (top(t) + bot(t)) / 2]);
    out.push(band(mids, 0.4, ink));
    for (const t of [0.3, 0.5, 0.7]) out.push(band([[X(t), top(t) + 0.1], [X(t), bot(t) - 0.1]], 0.33, mix(ink, TOOTH, 0.5)));
  } else {
    if (teeth === 'top' || teeth === 'both') toothRow(top, 1, Math.min(0.7, h * 0.28));
    if (teeth === 'bottom' || teeth === 'both') toothRow(bot, -1, Math.min(0.6, h * 0.24));
    if (teeth === 'buck') out.push(...buck(X(0.55), top(0.55) - 0.1, Math.max(0.55, w * 0.32), Math.max(0.8, Math.min(h * 0.6, 1.4)) / 1.1, ink));
  }
  for (const t of fangSpots(o.fangs ?? 0, o.fangAt, 0.2)) out.push(...fang(X(t), top(t) - 0.1, Math.min(h * 0.55, 1.3) * (o.fangK ?? 1), 1, ink));
  for (const t of fangSpots(o.tusks ?? 0, o.tuskAt ?? o.fangAt, 0.24)) out.push(...fang(X(t), bot(t) + 0.15, Math.min(h * 0.5 + 0.4, 1.5) * (o.fangK ?? 1), -1, ink));
  // The upper lip: a firmer ink line along the top edge.
  out.push(band(L.upper, taper(th * 1.1, 0.5), ink));
  if (o.tongueOut) out.push(...tongueOut(X(0.6), bot(0.6), w, o, ink));
  return out;
}

const fangSpots = (n, at, edge) => (at ? [].concat(at) : n >= 2 ? [edge, 1 - edge] : n === 1 ? [1 - edge] : []);

// A fang hanging from (x, y) (dir 1, down) or a tusk rising from it (dir -1), with its ink rim.
export function fang(x, y, len, dir = 1, ink = LIP) {
  const wd = Math.max(0.35, len * 0.42);
  return inked([[x - wd, y], [x + wd, y], [x + wd * 0.2, y + dir * len]], TOOTH, ink, 0.2);
}

// Two front teeth (a rabbit's) hanging from (x, y), w their half width, k their length scale.
function buck(x, y, w, k, ink) {
  const h = 1.1 * k;
  return [...inked([[x - w, y], [x + w, y], [x + w * 0.95, y + h], [x - w * 0.95, y + h]], TOOTH, ink, 0.22), band([[x, y + 0.1], [x, y + h - 0.1]], 0.33, mix(ink, TOOTH, 0.45))];
}

function tongueOut(x, y, w, o, ink) {
  const tw = Math.max(0.7, w * 0.5);
  const tl = o.tongueLen ?? 1.6;
  const pts = range(10).map((t) => {
    const a = Math.PI * t;
    return [x + Math.cos(a) * tw, y + Math.sin(a) * tl];
  });
  const tc = o.tongue || TONGUE;
  return [...inked([[x + tw, y - 0.2], ...pts, [x - tw, y - 0.2]], tc, ink, 0.25), band([[x, y + 0.1], [x, y + tl * 0.6]], 0.2, shade(tc, -18)), oval(x - tw * 0.35, y + tl * 0.4, 0.25, 0.3, mix(tc, '#ffffff', 0.5), 0, 8)];
}

// ---------- Nose, cheeks, and marks ----------

// A nose at (x, y): 'pad' (an animal nose pad, rounded and shiny), 'button' (a round nose),
// 'snout' (a snout disc with nostrils), 'dot', 'tick' (a small line). r: size; c: color.
export function nose(x, y, o = {}) {
  x = snap3(x);
  y = snap3(y);
  const r = o.r ?? 1;
  const c = o.c ?? '#4a3040';
  const s = o.s ?? 1;
  const hi = mix(c, '#ffffff', 0.6);
  switch (o.type ?? 'pad') {
    case 'button':
      return [...inked(ovalPts(x, y, r, r * 0.85, 0, 14), c, shade(c, -30), 0.25), oval(x - r * 0.35, y - r * 0.35, r * 0.35, r * 0.25, hi, 0, 8)];
    case 'snout':
      return [...inked(ovalPts(x, y, r * 1.1, r * 0.85, 0, 16), c, shade(c, -28), 0.28), oval(x - r * 0.35, y + r * 0.1, r * 0.22, r * 0.35, shade(c, -38), 0, 8),
        oval(x + r * 0.4, y + r * 0.1, r * 0.22, r * 0.35, shade(c, -38), 0, 8), oval(x - r * 0.2, y - r * 0.5, r * 0.5, r * 0.18, hi, 0, 8)];
    case 'dot':
      return [oval(x, y, r * 0.5, r * 0.4, c, 0, 10)];
    case 'tick':
      return [band([[x, y - r * 0.4], [x + s * r * 0.4, y + r * 0.4]], 0.32, c)];
    default: {
      // Wider at the top, rounding to a point toward the mouth; the shine on the top-left.
      const pts = [[x - r, y - r * 0.45], [x - r * 0.6, y - r * 0.8], [x + r * 0.6, y - r * 0.8], [x + r, y - r * 0.45], [x + r * 0.55, y + r * 0.3], [x + s * r * 0.1, y + r * 0.7], [x - r * 0.55, y + r * 0.3]];
      return [poly(pts, c), oval(x - r * 0.3, y - r * 0.45, r * 0.38, r * 0.2, hi, 0, 8)];
    }
  }
}

// Blush: a soft two-tone oval melting into the skin (`on`, the skin color; pass it), with
// optional diagonal hatch strokes (lines: 0..3). Never a hard solid pink ellipse.
export function blush(x, y, rx, o = {}) {
  x = snap3(x);
  y = snap3(y);
  const c = o.c ?? BLUSH;
  const on = o.on ?? '#fff4ee';
  const out = [oval(x, y, rx, rx * 0.5, mix(on, c, 0.45), 0, 14), oval(x + rx * 0.1, y, rx * 0.62, rx * 0.3, mix(on, c, 0.8), 0, 12)];
  const n = o.lines ?? 0;
  for (let i = 0; i < n; i++) {
    const lx = x + (i - (n - 1) / 2) * rx * 0.6;
    out.push(band([[lx - rx * 0.15, y + rx * 0.3], [lx + rx * 0.2, y - rx * 0.3]], taper(0.6, 0.5), shade(c, -14)));
  }
  return out;
}

// A sweat drop (point up) at (x, y), k its size.
export function sweat(x, y, k = 1, o = {}) {
  const c = o.c ?? '#bfe6ff';
  const pts = range(12).map((t) => {
    const a = Math.PI * 2 * t;
    const r = 0.75 * k;
    return [x + Math.sin(a) * r * (1 - 0.15 * Math.cos(a)), y + Math.cos(a) * r];
  });
  pts.splice(6, 1, [x, y - 1.9 * k]);
  return [...inked(pts, c, o.ink ?? '#5a8ac8', 0.25), oval(x - 0.25 * k, y - 0.1 * k, 0.2 * k, 0.32 * k, '#ffffff', 0, 8)];
}

// Tears from (x, y): 'drop' (one fat drop), 'stream' (a ribbon running down `len` px), 'well'
// (a shiny line of water brimming on the lower lid, w half width).
export function tear(x, y, k = 1, o = {}) {
  const c = o.c ?? '#a8dcff';
  const ink = o.ink ?? '#5a8ac8';
  const type = o.type ?? 'drop';
  if (type === 'well') {
    const w = o.w ?? 1.5;
    const pts = range(8).map((t) => [x - w + 2 * w * t, y + 0.25 * Math.sin(Math.PI * t)]);
    return [band(pts, taper(0.65 * k, 0.2), ink), band(pts, taper(0.4 * k, 0.15), c), oval(x + w * 0.3, y, 0.2, 0.15, '#ffffff', 0, 6)];
  }
  if (type === 'stream') {
    const len = o.len ?? 4;
    const dir = o.s ?? 1;
    const pts = range(8).map((t) => [x + dir * Math.sin(t * 2.4) * 0.35 * k, y + t * len]);
    return [band(pts, (t) => (0.5 + t * 0.35) * k + 0.3, ink), band(pts, (t) => (0.5 + t * 0.35) * k, c), ...sweat(pts[8][0], pts[8][1] + 0.4 * k, 0.7 * k, { c, ink }).slice(0, 2)];
  }
  return sweat(x, y, k * 0.8, { c, ink });
}

// The anger vein: four curved brackets around a gap, bulging toward its center.
export function vein(x, y, k = 1, c = '#ff4d6d') {
  const out = [];
  const g = 0.45 * k;
  const r = 1.75 * k;
  for (const [qx, qy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    // A quarter circle about the bracket's outer corner, so its bulge faces the middle.
    const pts = range(6).map((t) => {
      const a = (Math.PI / 2) * (0.1 + t * 0.8);
      return [x + qx * (r - (r - g) * Math.cos(a)), y + qy * (r - (r - g) * Math.sin(a))];
    });
    out.push(band(pts, taper(1.15 * k, 0.5), shade(c, -32)), band(pts, taper(0.7 * k, 0.4), c));
  }
  return out;
}

// ---------- Simple faces ----------
// The player asked for simple eyes and mouths, not overdetailed ones (first the bees', then the
// meadow's tortoise and fox kit). Following the art bible
// (a few clean clusters, the darkest dark against the lightest light at the eyes, mouths in a lip
// colour, never ink), each eye is: a soft dark oval, one band of iris colour low in it, a thick
// lash cap over the top, one big catchlight up front and a small one low behind (the same place
// in both eyes, never mirrored). Moods change the shape, not the parts: a slanted lid when angry,
// thick arcs when happy, a line on a blink, chevrons when hurt.

const arcPts = (cx, cy, rx, ry, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
// A thick soft stroke: a band tapering a little at its ends.
const line = (pts, w, c) => band(pts, (t) => w * (0.55 + 0.45 * Math.sin(Math.PI * t) ** 0.5), c);

// `lid` (0-1) drops a level lid of skin over the top at rest: sleepy, smug.
export function simpleEye(x, y, { s = 1, w = 2, h = 2.6, mood = 'idle', iris = '#c98a2e', ink = '#2a1a2e', lash = 1, wing = 0, skin = '#fff1cc', lid = 0 }) {
  x = snap3(x);
  y = snap3(y);
  const out = [];
  if (mood === 'happy') return [line(arcPts(x, y + h * 0.35, w * 1.05, h * 0.75, 200, 340), 0.9 * lash, ink)];
  if (mood === 'blink') return [line(arcPts(x, y - h * 0.1, w * 1.05, h * 0.45, 20, 160), 0.85 * lash, ink)];
  if (mood === 'hurt') {
    const d = s;
    return [line([[x - w * d, y - h * 0.55], [x + w * 0.7 * d, y], [x - w * d, y + h * 0.55]], 0.85, ink)];
  }
  // The eye: a soft dark oval, the iris colour as a band low in it.
  out.push(oval(x, y, w, h, ink, 0, 16));
  out.push(oval(x + s * w * 0.05, y + h * 0.42, w * 0.7, h * 0.42, iris, 0, 14));
  // Angry: the top cut off by a slanted lid of skin, lower toward the nose.
  if (mood === 'angry') {
    const [yl, yr] = s > 0 ? [y - h * 0.05, y - h * 0.55] : [y - h * 0.55, y - h * 0.05];
    out.push(poly([[x - w * 1.3, y - h * 1.3], [x + w * 1.3, y - h * 1.3], [x + w * 1.3, yr], [x - w * 1.3, yl]], skin));
  }
  // The lash cap: a thick arc over the top, a little flick at the outer corner (a wing for lashes).
  const yc = y - h + 2 * h * lid;
  if (mood === 'idle' && lid > 0) out.push(poly([[x - w * 1.3, y - h * 1.3], [x + w * 1.3, y - h * 1.3], [x + w * 1.3, yc], [x - w * 1.3, yc]], skin));
  const top = mood === 'angry'
    ? [[x - w * 1.1, y - h * (s > 0 ? 0.08 : 0.58)], [x + w * 1.1, y - h * (s > 0 ? 0.58 : 0.08)]]
    : mood === 'idle' && lid > 0 ? [[x - w * 1.05, yc + 0.1], [x + w * 1.05, yc + 0.1]] : arcPts(x, y + h * 0.05, w * 1.08, h * 1.02, 195, 345);
  out.push(line(top, 0.95 * lash, ink));
  if (wing && mood !== 'angry') {
    const o = top.at(s > 0 ? -1 : 0);
    out.push(line([o, [o[0] + s * 1.1 * wing, o[1] - 0.6 * wing]], 0.6 * lash, ink));
  }
  // Catchlights: big up front, small low behind, the same place in both eyes.
  if (mood !== 'angry' && lid < 0.35) out.push(oval(x + w * 0.3, y - h * 0.38, w * 0.38, w * 0.38, '#ffffff', 0, 10));
  out.push(oval(x - w * 0.35, y + h * 0.45, w * 0.17, w * 0.17, '#ffffff', 0, 8));
  return out;
}

// A simple mouth on the face's centre line, in a lip colour: a small smile at rest, a smug curl
// for the queen, an open D when happy, an open shout attacking, a tight frown angry, a wobble hurt.
export function simpleMouth(x, y, { k = 1, mood = 'idle', smug = false, lip = '#8a3550', inner = '#5e2446', tongue = '#ff8fab' }) {
  x = snap3(x);
  y = snap3(y);
  const w = 1.2 * k;
  if (mood === 'shout' || mood === 'happy') {
    const h = (mood === 'shout' ? 1.5 : 1.1) * k;
    const pts = mood === 'shout' ? arcPts(x, y, w * 0.8, h, 0, 360, 12) : [[x - w, y - h * 0.2], [x + w, y - h * 0.2], ...arcPts(x, y - h * 0.2, w, h, 0, 180, 8)];
    return [poly(pts, inner), oval(x, y + h * 0.45, w * 0.55, h * 0.3, tongue, 0, 10)];
  }
  if (mood === 'angry') return [line(arcPts(x, y + 0.5 * k, w * 0.9, 0.7 * k, 200, 340), 0.55 * k, lip)];
  if (mood === 'hurt' || mood === 'dead') return [line(Array.from({ length: 7 }, (_, i) => [x - w + (2 * w * i) / 6, y + (i % 2 ? -0.3 : 0.3) * k]), 0.45 * k, lip)];
  if (smug) return [line([[x - w, y - 0.1 * k], [x - w * 0.2, y + 0.45 * k], [x + w * 0.7, y + 0.1 * k], [x + w * 1.05, y - 0.45 * k]], 0.55 * k, lip)];
  return [line(arcPts(x, y - 0.3 * k, w * 0.8, 0.6 * k, 20, 160), 0.5 * k, lip)];
}
