// Heroine face kit: a 3/4-view anime head and face for humanoid monsters (queens, maidens).
// The head faces right. Everything is drawn in the head's own space: (0, 0) is the middle of the
// skull, x runs toward the face, y down, and one unit is one art pixel for a skull about 27 px
// wide (scale with `look.k`). `at(x, y)` maps that space onto the sprite, so a caller can tilt or
// move the head with its own transform: at = (x, y) => X(hx + x, hy + y).
//
//   heroineHead(at, mood, look)   neck, skull and face, skin shading, eyes, nose, mouth, blush,
//                                 tears (and brows, unless look.browsOnTop). Draw it BEFORE the hair.
//   heroineBrows(at, mood, look)  the brows alone, for drawing over the bangs (look.browsOnTop).
//   heroineTop(at, mood, look)    sweat drops and anger marks that sit on top of the hair.
//   heroineEye(at, e, x)          one eye (exposed for odd faces; see `eyeGeom` for e).
//   expression(mood, look)        the mood preset merged with the character's own overrides.
//
// `look` describes the character (all optional except skin and eye.iris):
//   k              scale (1 = queen-sized head, ~0.52 for a 14 px maiden head)
//   lineK          stroke weight multiplier (default 1); small heads use ~1.5 so lashes, lids,
//                  brows and lip lines keep their pixel weight when the head shrinks
//   skin, skinSh, skinSh2   skin base and its two shadow tones (hue-shifted, not grey);
//                  skinLt cheek/nose glint; blush, blushDk, blushK (blush size, 0 = none),
//                  blushLines (always hatch the blush), blushN (hatch strokes, default 3)
//   head           { chin: [x, y], cheek, jaw, neck: { x, w, top, bot } }   face outline
//   bangs          [[x, y], ...] lower edge of the bangs, left to right: shadow on the forehead;
//                  bangLine: a colour for a fine line along that edge (pale hair on pale skin)
//   eye            { y, nearX, farX, rx, ry, far (far eye width, ~0.7), tilt (outer corner lift),
//                    iris, irisDk, irisLt, hot/hotDk/hotLt (angry iris), pupil 'round'|'slit'|
//                    'heart'|'star'|'ring', pupilC, white, lashSh, ink (lash colour), lashW (weight),
//                    wing (px past the corner), flicks (lash clumps), lashLen, leafLash (colour:
//                    one leaf clump), liner (coloured wing), shadow (eyeshadow), smoky (0..1),
//                    crease (colour, or false), lower (lower lid colour), lowerLash (colour),
//                    sparkle (star glint) }
//   brow           { c, w, kind 'arch'|'straight'|'soft'|'hikimayu', lift, soft }
//   nose, mouth    [x, y] tip / centre (defaults sit on the 3/4 centre line); lip, lipLine,
//                  mouthIn, tongue, fang 'always'|'angry', noseC
//   mole           [x, y] a beauty mark;  sweatAt, veinAt: where heroineTop puts them
//   chibi          a small (maiden-scale) head: the mouth leads the expression (bigger, brighter
//                  shapes, scaled by mouthK), hurt eyes become clean > < glyphs, the bangs cast a
//                  deeper shadow, and the lash loses its fine streak (it would only speckle)
//   moods          { idle: {...}, angry: {...}, ... } per-mood overrides of MOODS
//
// An expression (see MOODS) sets: lids 'open'|'blink'|'happy'|'squeeze'|'dead', open (upper lid,
// 1 wide .. 0.6 half-lidded), inner (angry inner-lid drop, px), raise (lower lid pushed up, px),
// gaze [dx, dy] (iris shift, in eye widths), iris and pupil (sizes), hot (angry iris colours),
// brow { inner, outer, arch (px, + is down), w (weight) }, mouth 'smile'|'sly'|'smirk'|'calm'|
// 'soft'|'cat'|'shout'|'snarl'|'grit'|'grimace'|'gasp'|'grin'|'laugh'|'slack', blush (0..2), lines
// (blush hatching), tear, sweat, vein (anger mark), knit (frown crease).
//
// Construction (3/4 view): the near eye is full width on the cheek toward the ear; the far eye is
// ~70% wide beyond the nose line, by the facing cheek. Mouth and chin sit on the centre line.
// Light comes from the upper left: shines up-left in both eyes, the facing cheek plane in shadow.

import { T, F, L, INK, mix, shade } from './kit.js';

const PI = Math.PI;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);

// ---------- Geometry in head space ----------

function spline(pts, n = 4) {
  if (pts.length < 3 || n <= 1) return pts;
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function ell(cx, cy, rx, ry, n = 20, a = 0) {
  const out = [];
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * PI * 2;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    out.push([cx + x * ca - y * sa, cy + x * sa + y * ca]);
  }
  return out;
}

// Clips a polygon to a convex polygon (Sutherland-Hodgman), so irises and shines stay inside the
// eye without painting skin over them.
function clip(subject, region) {
  // The cutting polygon must be convex: use whichever of the two is, else the region's hull.
  if (!convex(region)) {
    if (convex(subject)) [subject, region] = [region, subject];
    else region = hull(region);
  }
  let area = 0;
  for (let i = 0, j = region.length - 1; i < region.length; j = i++) area += (region[j][0] - region[i][0]) * (region[j][1] + region[i][1]);
  const sgn = area > 0 ? -1 : 1;
  let out = subject;
  for (let i = 0; i < region.length && out.length; i++) {
    const a = region[i];
    const b = region[(i + 1) % region.length];
    const side = (p) => sgn * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
    const inp = out;
    out = [];
    for (let k = 0; k < inp.length; k++) {
      const p = inp[k];
      const q = inp[(k + 1) % inp.length];
      const sp = side(p);
      const sq = side(q);
      if (sp <= 0) out.push(p);
      if ((sp <= 0) !== (sq <= 0)) {
        const t = sp / (sp - sq);
        out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    }
  }
  return out;
}

function convex(pts) {
  let sign = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const c = pts[(i + 2) % pts.length];
    const z = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(z) < 1e-9) continue;
    if (sign && Math.sign(z) !== sign) return false;
    sign = Math.sign(z);
  }
  return true;
}

function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  const up = [];
  for (const q of p) {
    while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (const q of p.reverse()) {
    while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

// ---------- Drawing through the caller's transform ----------

// A painter bound to one head: every shape goes through `at` and widths scale with k.
function painter(at, k = 1, wk = 1) {
  const P = (x, y) => at(x * k, y * k);
  const out = [];
  const api = {
    out,
    P,
    k,
    wk,
    poly(pts, c, mode = 'f') {
      if (!pts || pts.length < 3) return;
      const s = T(pts.map(([x, y]) => P(x, y)), c);
      out.push(mode === 'l' ? L(s) : mode === 'f' ? F(s) : s);
    },
    oval(cx, cy, rx, ry, c, mode = 'f', a = 0, n = 18) {
      api.poly(ell(cx, cy, rx, ry, n, a), c, mode);
    },
    // A strip along a smooth curve, width wf(t) for t 0..1 (head units).
    strip(pts, wf, c, { n = 3, mode = 'f', clipTo = null } = {}) {
      const p = spline(pts, n);
      const m = p.length;
      if (m < 2) return;
      const left = [];
      const right = [];
      for (let i = 0; i < m; i++) {
        const a = p[Math.max(0, i - 1)];
        const b = p[Math.min(m - 1, i + 1)];
        let dx = b[0] - a[0];
        let dy = b[1] - a[1];
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        const w = (Math.max(0.02, wf(i / (m - 1))) * wk) / 2;
        left.push([p[i][0] - dy * w, p[i][1] + dx * w]);
        right.push([p[i][0] + dy * w, p[i][1] - dx * w]);
      }
      const poly = [...left, ...right.reverse()];
      api.poly(clipTo ? clip(poly, clipTo) : poly, c, mode);
    },
    taper(pts, w0, w1, c, o) {
      api.strip(pts, (t) => lerp(w0, w1, t), c, o);
    },
    // Thickest in the middle, pointed at both ends.
    swell(pts, w, c, o) {
      api.strip(pts, (t) => w * Math.sin(PI * clamp(t, 0.04, 0.96)) ** 0.7, c, o);
    },
    clipped(pts, region, c) {
      api.poly(clip(pts, region), c);
    },
  };
  return api;
}

// ---------- Expressions ----------

// Mood presets; a character overrides any field per mood with look.moods[mood].
export const MOODS = {
  idle: { lids: 'open', open: 1, inner: 0, raise: 0, gaze: [0.08, 0], pupil: 1, iris: 1, hot: false, brow: { inner: 0, outer: 0, arch: 0, w: 1 }, mouth: 'smile', blush: 1 },
  angry: { lids: 'open', open: 0.8, inner: 1.3, raise: 0.5, gaze: [0.1, 0.02], pupil: 0.7, iris: 0.85, hot: true, brow: { inner: 1.8, outer: -0.6, arch: -0.7, w: 1.4 }, mouth: 'shout', blush: 0.5, knit: true },
  hurt: { lids: 'squeeze', brow: { inner: -1.5, outer: 0.6, arch: 0.3, w: 1.1 }, mouth: 'grimace', blush: 1.2, tear: true, sweat: true },
  happy: { lids: 'happy', brow: { inner: -0.4, outer: -0.5, arch: 0.5, w: 1 }, mouth: 'grin', blush: 1.6, lines: true },
  blink: { lids: 'blink' },
  dead: { lids: 'dead', brow: { inner: -0.6, outer: 0.5, arch: -0.3, w: 0.9 }, mouth: 'slack', blush: 0 },
};

// The expression for a mood: preset, then the character's idle (for blink), then her override.
export function expression(mood, look = {}) {
  const own = look.moods ?? {};
  const base = { ...MOODS.idle, ...own.idle };
  let e;
  if (mood === 'blink') e = { ...base, ...MOODS.blink, ...own.blink };
  else if (mood === 'idle' || !MOODS[mood]) e = base;
  else e = { ...MOODS.idle, ...MOODS[mood], ...own[mood] };
  e.brow = { ...MOODS.idle.brow, ...(mood === 'blink' || mood === 'idle' ? own.idle?.brow : MOODS[mood]?.brow), ...own[mood]?.brow };
  return e;
}

// ---------- Eyes ----------

// Eye geometry. e = { cx, cy, rx, ry, o (+1: outer corner to the right, the far eye; -1: the near
// eye, outer corner toward the ear), tilt }; x = expression. Returns the lid curves (t from the
// inner corner, 0, to the outer, 1) and the open almond as a polygon.
export function eyeGeom(e, x = MOODS.idle) {
  const { cx, cy, rx, ry, o } = e;
  const tilt = e.tilt ?? 0.15;
  const I = [cx - o * rx, cy + ry * 0.3];
  const O = [cx + o * rx, cy + ry * (0.3 - tilt)];
  const base = (t) => [lerp(I[0], O[0], t), lerp(I[1], O[1], t)];
  const bump = (t) => Math.sin(PI * clamp(t, 0, 1) ** 0.8) ** 0.8;
  const open = x.open ?? 1;
  const inner = x.inner ?? 0;
  const raise = x.raise ?? 0;
  const full = (t) => {
    const [px, py] = base(t);
    return [px, py - ry * 1.3 * bump(t)];
  };
  // The upper lid; an angry lid is pulled down toward the nose (inner, in px) and flattened.
  const upper = (t) => {
    const [px, py] = base(t);
    return [px, py - ry * 1.3 * bump(t) * open + inner * (1 - t) ** 1.3 * Math.min(1, t * 5)];
  };
  const lower = (t) => {
    const [px, py] = base(t);
    return [px, py + (ry * 0.78 - raise) * Math.sin(PI * clamp(t, 0, 1) ** 1.1)];
  };
  const N = 12;
  const ts = Array.from({ length: N + 1 }, (_, i) => i / N);
  const almond = [...ts.map(upper), ...ts.slice(1, N).reverse().map(lower)];
  return { I, O, base, full, upper, lower, almond, ts, N };
}

// One eye. e: { cx, cy, rx, ry, o, near (bool) }; x: the expression; look: the character.
export function heroineEye(at, e, x, look = {}) {
  const pen = painter(at, look.k ?? 1, look.lineK ?? 1);
  drawEye(pen, e, x, look);
  return pen.out;
}

// Pointed lash clumps along a lid curve near the outer corner. dir -1 sweeps up and out, +1 down.
function clumps(pen, curve, e, n, len, dir, c, lw, leaf) {
  for (let j = 0; j < n; j++) {
    const t = n === 1 ? 0.97 : 0.78 + (j / (n - 1)) * 0.2;
    const [px, py] = curve(t);
    const [qx, qy] = curve(t - 0.07);
    const l = len * (0.75 + 0.25 * (j / Math.max(1, n - 1))) * (e.near ? 1 : 0.8);
    const ang = Math.atan2(qy - py, qx - px);
    const up = dir < 0 ? -1 : 1;
    const tipA = dir < 0 ? -PI / 2 + e.o * (0.55 + j * 0.3) : PI / 2 - e.o * (0.6 + j * 0.25);
    const tip = [px + Math.cos(tipA) * l, py + Math.sin(tipA) * l];
    if (leaf) {
      leafAt(pen, px, py - up * 0.1, tipA, l + 0.5, 1.4, leaf);
      continue;
    }
    const bw = Math.max(0.75, lw * 0.75);
    pen.poly([[px + Math.cos(ang) * bw * 0.5, py + Math.sin(ang) * bw * 0.5 + up * lw * 0.3], [px - Math.cos(ang) * bw * 0.6, py - Math.sin(ang) * bw * 0.6 + up * lw * 0.3], tip], c);
  }
}

function drawEye(pen, e, x, look) {
  const E = look.eye ?? {};
  const ink = E.ink ?? INK;
  const skin = look.skin;
  const sh2 = look.skinSh2 ?? mix(look.skinSh ?? skin, ink, 0.2);
  const { rx, ry, o } = e;
  const g = eyeGeom(e, x);
  // Lash weight: 1.33 px across the outer part of the near eye, 0.67 at the inner corner.
  const lw = (E.lashW ?? 1) * (e.near ? 1.33 : 1.1);
  const lowerC = E.lower ?? mix(look.lip ?? '#e2627c', skin, 0.35);
  const lids = x.lids ?? 'open';

  if (lids !== 'open') {
    closedEye(pen, e, x, g, { ink, lw, E, skin, sh2, lowerC, look });
    return;
  }

  const hot = x.hot && E.hot;
  const iris = hot ? E.hot : E.iris;
  const irisDk = hot ? E.hotDk ?? shade(E.hot, -32) : E.irisDk ?? shade(E.iris, -34);
  const irisLt = hot ? E.hotLt ?? mix(E.hot, '#ffffff', 0.55) : E.irisLt ?? mix(E.iris, '#ffffff', 0.5);
  const almond = g.almond;
  const wingLen = (E.wing ?? 1.5) * (e.near ? 1 : 0.7);
  const wingA = 0.42 + (E.tilt ?? 0.15) * 0.4;
  const wingTip = [g.O[0] + o * wingLen * Math.cos(wingA), g.O[1] - lw * 0.4 - wingLen * Math.sin(wingA)];

  // Eyeshadow: one soft band above the lash line, deepest toward the outer corner.
  if (E.shadow) {
    const h = 1.2 + (E.smoky ?? 0) * 0.6;
    const bot = g.ts.slice(2).map((t) => g.upper(t));
    const top = g.ts.slice(2).map((t) => { const [px, py] = g.full(t); return [px + o * 0.2 * t, py - lw - h * (0.35 + 0.65 * t)]; });
    pen.poly([...bot, wingTip, [wingTip[0] - o * 0.4, wingTip[1] - 0.6], ...top.reverse()], E.shadow);
  }
  // The crease: a fine fold about a pixel above the lash line over the outer 60%.
  if (E.crease !== false) pen.taper(g.ts.slice(5, 12).map((t) => { const [px, py] = g.full(t); return [px + o * 0.2, py - lw - 0.75]; }), 0.3, 0.42, E.crease ?? sh2, { n: 2 });

  // The white, and the lash's shadow along its top.
  pen.poly(almond, E.white ?? '#fffaf7');
  pen.poly(clip([...g.ts.map((t) => { const [px, py] = g.upper(t); return [px, py - 1]; }), ...g.ts.slice().reverse().map((t) => { const [px, py] = g.upper(t); return [px, py + 0.85]; })], almond), E.lashSh ?? '#dccbe8');

  // The iris: dark top band (it merges with the lash), the base, a light crescent at the bottom,
  // the pupil, a big shine up front and a small one low behind.
  const gx = x.gaze?.[0] ?? 0.08;
  const gy = x.gaze?.[1] ?? 0;
  const sz = x.iris ?? 1;
  const irx = rx * (e.near ? 0.58 : 0.55) * sz;
  const iry = ry * 1.02 * sz;
  const ix = snap3(e.cx + gx * rx * 2 + 0.3 - (e.near ? 0 : o * rx * 0.06), pen.k);
  const iy = snap3(e.cy + gy * ry * 2 + ry * 0.12, pen.k);
  const disc = clip(ell(ix, iy, irx, iry, 24), almond);
  if (disc.length > 2) {
    pen.poly(disc, iris);
    pen.poly(clip(clip([[ix - 9, iy - 9], [ix + 9, iy - 9], [ix + 9, iy - iry * 0.12], [ix - 9, iy - iry * 0.02]], ell(ix, iy, irx, iry, 24)), almond), irisDk);
    pen.poly(clip(clip(ell(ix + 0.05, iy + iry * 0.62, irx * 0.78, iry * 0.42, 18), ell(ix, iy, irx, iry, 24)), almond), irisLt);
  }
  const ps = x.pupil ?? 1;
  const pc = E.pupilC ?? shade(iris, -55);
  const cl = (pts, c) => pen.poly(clip(pts, almond), c);
  if (E.pupil === 'slit') cl(ell(ix, iy - iry * 0.05, Math.max(0.36, irx * 0.17 * ps), iry * (0.6 + (1 - ps) * 0.25), 14), pc);
  else if (E.pupil === 'heart') cl(heartPts(ix, iy - iry * 0.08, Math.max(0.85, irx * 0.46 * ps)), hot ? mix(iris, '#ffffff', 0.75) : pc);
  else if (E.pupil === 'star') cl(starPts(ix, iy, irx * 0.48 * ps), pc);
  else if (E.pupil === 'ring') {
    // A doll's glass eye: a dark ring round a pale clear centre, like painted glass.
    const pr = Math.max(0.62, irx * 0.4 * ps);
    cl(ell(ix, iy - iry * 0.06, pr, pr * 1.15, 16), pc);
    cl(ell(ix, iy - iry * 0.06, pr * 0.5, pr * 0.6, 12), mix(irisLt, '#ffffff', 0.4));
  }
  else cl(ell(ix, iy - iry * 0.08, Math.max(0.5, irx * 0.3 * ps), Math.max(0.7, iry * 0.38 * ps), 14), pc);
  // Shines sit on the same side in both eyes (light from the upper left).
  const big = Math.max(0.62, irx * 0.3);
  cl(ell(ix - irx * 0.38, iy - iry * 0.36, big, big * 1.1, 8, 0.4), '#ffffff');
  cl(ell(ix + irx * 0.42, iy + iry * 0.44, 0.36, 0.36, 8), E.sparkle ? '#ffffff' : mix(irisLt, '#ffffff', 0.5));
  if (E.sparkle && !hot) cl(starPts(ix + irx * 0.1, iy + iry * 0.1, 0.55), mix(irisLt, '#ffffff', 0.7));

  // The upper lash line and wing as one heavy shape, with pointed clumps at the outer end.
  const lidPts = g.ts.map((t) => g.upper(t));
  const center = [...lidPts.map(([px, py], i) => { const w = lw * lerp(0.5, 1, smooth(Math.min(1, i / (g.N * 0.45)))); return [px, py - w * 0.4]; }), wingTip];
  pen.strip(center, (t) => lw * (t < 0.45 ? lerp(0.5, 1, smooth(t / 0.45)) : t > 0.88 ? lerp(1, 0.35, (t - 0.88) / 0.12) : 1), ink, { n: 2 });
  // A lighter streak in the lash's own hue along its outer half, so the heaviest dark on the face
  // reads as a lash and not a hole (queen scale only; on a small head it would speckle).
  if (e.near && !look.chibi) pen.strip(center.slice(Math.round(g.N * 0.5), g.N - 1).map(([px, py]) => [px - o * 0.1, py - lw * 0.18]), (t) => lw * 0.32 * Math.sin(PI * clamp(t, 0.08, 0.92)) ** 0.6, E.lashLt ?? mix(ink, E.iris, 0.45), { n: 2 });
  clumps(pen, (t) => { const [px, py] = g.upper(Math.min(1, t)); return [px, py - lw * 0.7]; }, e, E.flicks ?? 2, (E.lashLen ?? 1.3) * (ry / 3), -1, ink, lw, E.leafLash);
  // Coloured liner (Tamamo's kumadori red): one stroke below the wing, sweeping up past it.
  if (E.liner) {
    const [lx, ly] = g.lower(0.62);
    const end = [wingTip[0] + o * (e.near ? 1.1 : 0.6), wingTip[1] - (e.near ? 0.9 : 0.5)];
    pen.strip([[lx, ly + 0.3], [g.O[0] + o * 0.5, g.O[1] + 0.35], [lerp(g.O[0], end[0], 0.6) + o * 0.3, lerp(g.O[1], end[1], 0.6) + 0.2], end], (t) => (e.near ? 0.8 : 0.6) * (t < 0.2 ? 0.5 + t * 2.5 : lerp(1, 0.3, (t - 0.2) / 0.8)), E.liner, { n: 2 });
  }
  // The lower lid: a light line over the outer half; alluring eyes add one lower lash.
  pen.strip(g.ts.slice(6).map((t) => { const [px, py] = g.lower(t); return [px, py + 0.3]; }), (t) => lerp(0.4, 0.7, t) * (t > 0.88 ? 0.7 : 1), lowerC, { n: 2 });
  if (E.lowerLash) {
    const [px, py] = g.lower(0.86);
    pen.poly([[px - 0.35, py + 0.35], [px + 0.35, py + 0.35], [px + o * 0.7, py + 1.35]], E.lowerLash);
  }
}

// Third-pixel grid: anchors land on whole cells so a face rasterises the same in every frame
// (k: the head's scale, so the grid stays one sprite cell on a small head).
const snap3 = (v, k = 1) => Math.round(v * 3 * k) / (3 * k);

function closedEye(pen, e, x, g, { ink, lw, E, skin, sh2, lowerC, look }) {
  const { rx, ry, o, cx, cy } = e;
  const lids = x.lids;
  const tilt = E.tilt ?? 0.15;
  // A closed lid: one tapered stroke, fine at the inner corner, full at the outer.
  const lid = (curve, w) => pen.strip(g.ts.map(curve), (t) => w * (t < 0.3 ? lerp(0.45, 1, smooth(t / 0.3)) : t > 0.92 ? lerp(1, 0.5, (t - 0.92) / 0.08) : 1), ink, { n: 2 });
  if (lids === 'happy') {
    // A closed smile: an arch, lashes flicking up at the outer end, the cheek pushed up beneath.
    const c = (t) => { const [px] = g.base(t); return [px, cy + ry * 0.35 - ry * 0.85 * Math.sin(PI * clamp(t, 0, 1) ** 0.9) - ry * tilt * t * 0.5]; };
    lid(c, lw * 0.9);
    clumps(pen, (t) => { const [px, py] = c(Math.min(1, t)); return [px, py - lw * 0.3]; }, e, 1, 1.1, -1, ink, lw * 0.9, E.leafLash);
    pen.strip(g.ts.slice(3, 10).map((t) => { const [px, py] = c(t); return [px + o * 0.1, py + ry * 0.95]; }), (t) => 0.42 * Math.sin(PI * t), lowerC, { n: 2 });
    return;
  }
  if (lids === 'squeeze' && look.chibi) {
    // At maiden scale a clean > < glyph reads better than a drawn lid: one heavy chevron pointing
    // at the nose, its outer arms ending in the lash's own taper, and a fold of shadow above.
    const apex = [cx - o * rx * 0.55, cy + ry * 0.12];
    const top = [cx + o * rx * 0.85, cy - ry * 0.8 - tilt * ry * 0.4];
    const bot = [cx + o * rx * 0.8, cy + ry * 0.95];
    const w = lw * 1.05;
    pen.strip([top, [lerp(top[0], apex[0], 0.5), lerp(top[1], apex[1], 0.5) - 0.1], apex], (t) => w * lerp(0.75, 1, t), ink, { n: 1 });
    pen.strip([apex, [lerp(apex[0], bot[0], 0.5), lerp(apex[1], bot[1], 0.5) + 0.1], bot], (t) => w * lerp(1, 0.6, t), ink, { n: 1 });
    pen.oval(apex[0], apex[1], w * 0.55, w * 0.55, ink, 'f', 0, 8);
    return;
  }
  if (lids === 'squeeze') {
    // Squeezed shut: a tight lid pulled in toward the nose, one fold above, lashes pressed down.
    const c = (t) => {
      const [px] = g.base(t);
      return [px + o * rx * 0.06, cy + ry * 0.25 + ry * 0.28 * Math.sin(PI * t) - ry * 0.4 * (1 - t) ** 3 - tilt * ry * 0.3 * t];
    };
    lid(c, lw);
    clumps(pen, (t) => { const [px, py] = c(Math.min(1, t)); return [px, py + lw * 0.3]; }, e, 2, 1, 1, ink, lw, E.leafLash);
    pen.strip(g.ts.slice(2, 11).map((t) => { const [px, py] = c(t); return [px, py - ry * (0.6 + 0.5 * Math.sin(PI * t)) - 0.3]; }), (t) => 0.5 * Math.sin(PI * t) ** 0.6, sh2, { n: 2 });
    pen.strip(g.ts.slice(3, 9).map((t) => { const [px, py] = c(t); return [px, py + ry * 0.62]; }), (t) => 0.4 * Math.sin(PI * t), lowerC, { n: 2 });
    return;
  }
  // 'blink' and 'dead': the lid lowered in a sagging curve about 60% down the eye. Blinks keep
  // lash clumps pointing down and out; dead lids are a thinner line with none.
  const dead = lids === 'dead';
  const c = (t) => {
    const [px] = g.base(t);
    return [px, cy + ry * (dead ? 0.5 : 0.3) + ry * (dead ? 0.3 : 0.55) * Math.sin(PI * clamp(t, 0, 1) ** 1.1) - tilt * ry * (dead ? -0.2 : 0.4) * t];
  };
  if (E.shadow) pen.poly([...g.ts.map(c), ...g.ts.slice().reverse().map((t) => { const [px, py] = c(t); return [px, py - (1 + (E.smoky ?? 0) * 0.5) * Math.sin(PI * t) ** 0.5]; })], E.shadow);
  lid(c, dead ? 0.7 : lw * 0.85);
  if (!dead) clumps(pen, (t) => { const [px, py] = c(Math.min(1, t)); return [px, py + lw * 0.2]; }, e, 2, 1.1, 1, ink, lw * 0.85, E.leafLash);
  if (E.crease !== false) pen.taper(g.ts.slice(4, 11).map((t) => { const [px, py] = c(t); return [px, py - ry * 0.75 - 0.4 * Math.sin(PI * t)]; }), 0.3, 0.42, E.crease ?? sh2, { n: 2 });
}

function heartPts(x, y, r) {
  const pts = [];
  for (let i = 0; i < 20; i++) {
    const t = (i / 20) * PI * 2;
    const hx = 16 * Math.sin(t) ** 3;
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push([x + (hx / 16) * r, y + (hy / 16) * r + r * 0.15]);
  }
  return pts;
}

function starPts(x, y, r) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = -PI / 2 + (i / 8) * PI * 2;
    const rr = i % 2 ? r * 0.35 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return pts;
}

function leafAt(pen, x, y, ang, len, w, c) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const pts = [];
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    const ww = Math.sin(PI * t ** 0.8) * w * 0.5;
    pts.push([x + dx * len * t - dy * ww, y + dy * len * t + dx * ww]);
  }
  for (let i = 4; i >= 1; i--) {
    const t = i / 5;
    const ww = Math.sin(PI * t ** 0.8) * w * 0.5;
    pts.push([x + dx * len * t + dy * ww, y + dy * len * t - dx * ww]);
  }
  pen.poly(pts, c);
}

// ---------- Layout ----------

// Where everything sits (head units). The far eye sits beyond the nose line, next to the cheek.
function layout(look) {
  const E = look.eye ?? {};
  const y = E.y ?? 4.8;
  const rx = E.rx ?? 4;
  const ry = E.ry ?? 3;
  const far = E.far ?? 0.7;
  const near = { cx: E.nearX ?? 2, cy: y, rx, ry, o: -1, near: true, tilt: E.tilt };
  const farE = { cx: E.farX ?? 10.5, cy: y - 0.15, rx: rx * far, ry: ry * 0.95, o: 1, near: false, tilt: E.tilt };
  const nose = look.nose ?? [8.9, y + ry + 2.2];
  const mouth = look.mouth ?? [8, y + ry + 5.2];
  return { near, far: farE, nose, mouth };
}

// ---------- Head ----------

function headOutline(look) {
  const H = look.head ?? {};
  const [chx, chy] = H.chin ?? [7.3, 16.4];
  const ch = H.cheek ?? 14.2;
  const jaw = H.jaw ?? 0;
  // The face side: temple, cheekbone, a soft cheek curving in to the small chin.
  const front = spline([[13.4, -2], [ch, 3.6], [ch - 0.5, 8.6], [ch - 2.4, 12.6], [chx + 2.4, chy - 1.1], [chx, chy]], 3);
  // The back: from the chin along the jaw to below the ear.
  const back = spline([[chx, chy], [chx - 1.2, chy - 0.15], [chx - 5, chy - 1.3 + jaw * 0.3], [-4 - jaw, 13.2], [-9.4 - jaw * 0.6, 9.4], [-12.6, 4]], 3);
  const skull = [];
  for (let i = 0; i <= 16; i++) {
    const a = PI * (1.08 + (i / 16) * 0.86);
    skull.push([Math.cos(a) * 13.5, Math.sin(a) * 13.6]);
  }
  return [...front, ...back.slice(1), ...skull];
}

export function heroineHead(at, mood, look) {
  const k = look.k ?? 1;
  const pen = painter(at, k, look.lineK ?? 1);
  const x = expression(mood, look);
  const skin = look.skin;
  const sh = look.skinSh ?? mix(shade(skin, -9), '#d77f9a', 0.22);
  const sh2 = look.skinSh2 ?? mix(shade(sh, -10), '#b05a86', 0.2);
  const lt = look.skinLt ?? mix(skin, '#fffbf0', 0.6);
  const blush = look.blush ?? '#ff9fb2';
  const H = look.head ?? {};
  const [chx, chy] = H.chin ?? [7.3, 16.4];
  const N = H.neck ?? {};
  const nx = N.x ?? -0.6;
  const nw = N.w ?? 5.4;
  const ntop = N.top ?? 9;
  const nbot = N.bot ?? 19;
  const L0 = layout(look);

  // Neck in shadow, darker for the first stretch under the jaw (it sets the chin apart).
  pen.poly([[nx - nw / 2, ntop], [nx + nw / 2, ntop], [nx + nw / 2 + 0.2, nbot], [nx - nw / 2 - 0.4, nbot]], sh, 'l');
  pen.poly([[nx - nw / 2, ntop], [nx + nw / 2 + 0.4, ntop], [nx + nw / 2 + 0.5, chy + 0.4], [nx + 1.6, chy + 1.6], [nx - nw / 2 - 0.2, chy + 0.6]], sh2);
  pen.poly([[nx + nw / 2 - 1.2, chy + 2], [nx + nw / 2 + 0.2, chy + 1.2], [nx + nw / 2 + 0.2, nbot], [nx + nw / 2 - 0.9, nbot]], mix(sh, skin, 0.45));

  // Skull and face.
  pen.poly(headOutline(look), skin, 'l');
  // The turned-away cheek plane, from the temple to the jaw (light comes from the upper left).
  const ch = H.cheek ?? 14.2;
  pen.poly(spline([[13.4, -1], [ch + 0.05, 3.6], [ch - 0.45, 8.6], [ch - 2.35, 12.6], [chx + 2.4, chy - 1.05], [chx + 0.1, chy - 0.05], [chx + 1.6, chy - 1.6], [ch - 3.3, 11.8], [ch - 1.6, 8.2], [ch - 0.9, 3.8], [12.4, -1]], 2), sh);
  // A fine jaw line on the near side, fading toward the ear.
  pen.strip(spline([[chx - 0.6, chy - 0.1], [chx - 5, chy - 1.25], [-3.8, 13.1], [-8.6, 9.8]], 2), (t) => 0.55 * (1 - t) ** 0.7, sh, { n: 1 });
  // The bangs' shadow on the forehead, following the bang tips.
  // (Dungeon Fighter's rule: wherever skin lies under hair, it's in shadow.) A small head gets a
  // deeper band, at least one sprite pixel, and a darker sliver right under the clump tips, so
  // the hair always separates from the face.
  if (look.bangs) {
    const b = look.bangs;
    const dk = Math.max(1, 0.66 / k);
    pen.poly([...b.map(([px, py], i) => [px, py + (i % 2 ? 1.5 : 1.1) * dk]), [b[b.length - 1][0], -14], [b[0][0], -14]], sh);
    if (look.chibi) pen.poly([...b.map(([px, py], i) => [px, py + (i % 2 ? 0.75 : 0.5) * dk]), [b[b.length - 1][0], -14], [b[0][0], -14]], mix(sh, sh2, 0.6));
  }

  // Blush: a small soft two-tone patch on each cheek, clear of the eyes and the contour.
  const { near, far } = L0;
  const bl = x.blush ?? 1;
  const bk = look.blushK ?? 1;
  if (bl > 0 && bk > 0) {
    const s = Math.min(1.2, 0.85 + bl * 0.15) * bk;
    const by = near.cy + near.ry * 0.95 + 2;
    pen.oval(near.cx - 0.3, by, 2.9 * s, 1.05 * s, mix(skin, blush, 0.32 + 0.08 * bl));
    pen.oval(near.cx - 0.2, by + 0.05, 1.7 * s, 0.6 * s, mix(skin, blush, 0.5 + 0.1 * bl));
    pen.oval(far.cx + 1, by - 0.1, 1.5 * s, 0.9 * s, mix(skin, blush, 0.3 + 0.08 * bl));
    if (x.lines || look.blushLines) {
      const bd = look.blushDk ?? shade(blush, -16);
      // Strokes keep their pixel weight on a small head (lineK), so fewer fit across the cheek.
      const n = look.blushN ?? 3;
      const sw = 0.55 * pen.wk;
      const sp = 1.2 * pen.wk;
      for (let i = 0; i < n; i++) {
        const hx = near.cx - 0.3 + (i - (n - 1) / 2) * sp;
        pen.poly([[hx + 0.75, by - 0.55], [hx + 0.75 + sw, by - 0.55], [hx - 0.4 + sw, by + 0.6], [hx - 0.4, by + 0.6]], bd);
      }
    }
  }
  // A small highlight high on the near cheek.
  pen.oval(near.cx - 2.4, near.cy + near.ry * 0.95 + 0.9, 0.8, 0.36, lt);

  // Eyes, the far one first (the nose bridge passes in front of its inner corner).
  drawEye(pen, far, x, look);
  drawEye(pen, near, x, look);
  if (!look.browsOnTop) pen.out.push(...heroineBrows(at, mood, look));

  // Nose: a shadow tick under the tip on the facing side, a pale glint above it.
  const [nsx, nsy] = L0.nose;
  pen.poly([[nsx - 0.7, nsy + 0.25], [nsx + 0.4, nsy - 0.75], [nsx + 0.95, nsy - 0.1], [nsx + 0.3, nsy + 0.45]], look.noseC ?? sh2);
  pen.oval(nsx - 0.5, nsy - 1.2, 0.45, 0.35, lt);

  // Beauty mark, mouth, tears.
  if (look.mole) pen.oval(look.mole[0], look.mole[1], 0.45, 0.45, look.moleC ?? '#6a3a5c');
  if (look.chibi) {
    // The mouth leads at maiden scale: the same shapes, scaled up around their centre (line
    // weights kept), in brighter colours.
    const s = look.mouthK ?? 1.35;
    const [mx, my] = L0.mouth;
    const mp = painter((px, py) => at(mx * k + (px - mx * k) * s, my * k + (py - my * k) * s), k, pen.wk / s);
    mouth(mp, L0.mouth, x, { mouthIn: '#c8405e', tongue: '#ff9ab4', ...look }, mood);
    pen.out.push(...mp.out);
  } else mouth(pen, L0.mouth, x, look, mood);
  if (x.tear) tear(pen, near.cx - near.rx * 0.9, near.cy + near.ry * 0.75, 1, look);
  return pen.out;
}

// ---------- Brows ----------

// The brows alone (and the fine line where the bangs meet the skin, look.bangLine). Draw them
// after the hair when look.browsOnTop; they read through the bangs like ink through paper.
export function heroineBrows(at, mood, look) {
  const pen = painter(at, look.k ?? 1, look.lineK ?? 1);
  const x = expression(mood, look);
  const B = look.brow ?? {};
  const c = B.c ?? mix(INK, look.skin, 0.25);
  const w = (B.w ?? 0.75) * (x.brow?.w ?? 1);
  const lift = B.lift ?? 0;
  const { near, far } = layout(look);
  const { inner = 0, outer = 0, arch = 0 } = x.brow ?? {};
  if (look.bangLine && look.bangs) pen.strip(look.bangs, (t) => 0.7 * Math.sin(PI * clamp(t, 0.06, 0.94)) ** 0.5, look.bangLine, { n: 2 });
  for (const e of [far, near]) {
    const { cx, cy, rx, ry, o } = e;
    const s = e.near ? 1 : 0.8;
    // Lowest point about 2.3 px above the lash line.
    const y0 = cy - ry * 1.05 - 2.6 - lift;
    if (B.kind === 'hikimayu') {
      // Court brows: soft painted ovals set high, tilting with the mood.
      const tiltA = o * (inner - outer) * 0.12;
      const by = y0 - 1.8 + (inner + outer) * 0.35;
      pen.oval(cx - o * rx * 0.15, by, 1.75 * s, 0.95, B.soft ?? mix(c, look.skin, 0.35), tiltA, 14);
      pen.oval(cx - o * rx * 0.25, by + 0.1, 1.05 * s, 0.55, c, tiltA, 12);
      continue;
    }
    const kind = B.kind ?? 'arch';
    const pk = kind === 'straight' ? 0.35 : kind === 'soft' ? 0.7 : 1.05;
    const pts = [
      [cx - o * rx * 0.95, y0 + 0.5 + inner * s],
      [cx - o * rx * 0.25, y0 - pk * 0.75 - arch * 0.6 + inner * 0.45 * s],
      [cx + o * rx * 0.45, y0 - pk - arch + outer * 0.35],
      [cx + o * rx * 1.12, y0 + 0.25 - pk * 0.2 + outer],
    ];
    pen.strip(pts, (t) => w * (e.near ? 1 : 0.85) * Math.sin(PI * lerp(0.22, 0.97, t)) ** 0.5 * lerp(1.15, 0.75, t), c, { n: 3 });
  }
  // Frown crease between the brows.
  if (x.knit) {
    const mx = (near.cx + near.rx + far.cx - far.rx) / 2;
    const my = near.cy - near.ry * 1.05 - 2.2;
    pen.strip([[mx - 0.2, my - 0.8], [mx + 0.15, my + 0.5]], (t) => 0.4 * Math.sin(PI * clamp(t, 0.1, 0.9)), mix(c, look.skin, 0.4), { n: 1 });
  }
  return pen.out;
}

// ---------- Mouth ----------

function mouth(pen, [mx, my], x, look, mood) {
  const lip = look.lip ?? '#ec7f9c';
  const ln = look.lipLine ?? shade(lip, -30);
  const inside = look.mouthIn ?? '#7c2a44';
  const teeth = '#ffffff';
  const tongue = look.tongue ?? '#ff8aa6';
  const fang = look.fang === 'always' || (look.fang === 'angry' && mood === 'angry');
  const wn = 2.3; // near half (toward the viewer) and far half (foreshortened)
  const wf = 1.4;
  const gloss = mix(lip, '#ffffff', 0.65);
  const kind = x.mouth;
  // A closed mouth: the line between the lips, a soft lower lip with a gloss dot, a hint of the
  // upper lip. `lift` raises the near and far corners.
  const closed = (ln0, ln1, mid = 0.2, low = 1) => {
    const pts = [[mx - wn, my - ln0], [mx - wn * 0.55, my + mid * 0.6], [mx, my + mid], [mx + wf * 0.55, my + mid * 0.5], [mx + wf, my - ln1]];
    pen.swell([[mx - wn * 0.5, my + 0.2], [mx - 0.1, my + 0.95 * low], [mx + wf * 0.55, my + 0.25]], 1.1 * low, lip);
    pen.oval(mx - 0.45, my + 0.6 * low, 0.42, 0.22, gloss);
    pen.swell([[mx - wn * 0.45, my - 0.15], [mx - 0.2, my - 0.45], [mx + wf * 0.5, my - 0.12]], 0.45, mix(lip, look.skin, 0.4));
    pen.strip(spline(pts, 3), (t) => 0.5 * (t < 0.15 ? 0.4 + t * 4 : t > 0.85 ? lerp(1, 0.4, (t - 0.85) / 0.15) : 1), ln, { n: 1 });
    if (fang && look.fang === 'always') pen.poly([[mx - 0.95, my + mid * 0.55], [mx - 0.25, my + mid * 0.7], [mx - 0.6, my + 1]], teeth);
  };
  // An open mouth from an outline (head units), filled dark, with teeth, a tongue and lips.
  const open = (pts, { top = 0.5, bot = 0, tg = 0.45, fangs = fang } = {}) => {
    pen.poly(pts, inside);
    const ys = pts.map((p) => p[1]);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const xs = pts.map((p) => p[0]);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    if (tg) pen.poly(clip(ell((x0 + x1) / 2 - 0.2, y1 - (y1 - y0) * tg * 0.3, (x1 - x0) * 0.32, (y1 - y0) * tg, 14), pts), tongue);
    if (top) pen.poly(clip([[x0 - 1, y0 - 1], [x1 + 1, y0 - 1], [x1 + 1, y0 + top], [x0 - 1, y0 + top + 0.15]], pts), teeth);
    if (bot) pen.poly(clip([[x0 - 1, y1 - bot], [x1 + 1, y1 - bot - 0.1], [x1 + 1, y1 + 1], [x0 - 1, y1 + 1]], pts), teeth);
    if (fangs) {
      for (const fx of [x0 + (x1 - x0) * 0.22, x0 + (x1 - x0) * 0.74]) pen.poly(clip([[fx - 0.45, y0], [fx + 0.45, y0], [fx + 0.05, y0 + top + 0.9]], pts), teeth);
    }
    // Lips around it: a darker top edge and a soft lower lip.
    const topEdge = pts.filter((p) => p[1] <= y0 + (y1 - y0) * 0.3).sort((a, b) => a[0] - b[0]);
    if (topEdge.length > 1) pen.strip(topEdge, (t) => 0.5 * Math.sin(PI * clamp(t, 0.1, 0.9)) ** 0.5, ln, { n: 1 });
    pen.swell([[x0 + (x1 - x0) * 0.25, y1 + 0.2], [(x0 + x1) / 2, y1 + 0.55], [x0 + (x1 - x0) * 0.78, y1 + 0.15]], 0.65, lip);
  };
  switch (kind) {
    case 'sly':
      closed(0.75, 0.35, 0.15);
      pen.taper([[mx - wn - 0.1, my - 0.7], [mx - wn - 0.5, my - 1.3]], 0.38, 0.12, ln, { n: 1 });
      break;
    case 'smirk':
      closed(0.2, 1.05, 0.15, 1.15);
      pen.taper([[mx + wf, my - 1], [mx + wf + 0.55, my - 1.55]], 0.4, 0.12, ln, { n: 1 });
      break;
    case 'calm':
      closed(0.15, 0.1, 0.1, 0.85);
      break;
    case 'cat': {
      // A cat's mouth: a little 'w' with the corners curled up, a fang peeking under it.
      const pts = [[mx - wn * 0.95, my - 0.75], [mx - wn * 0.5, my + 0.35], [mx - 0.15, my - 0.15], [mx + wf * 0.4, my + 0.35], [mx + wf * 0.95, my - 0.6]];
      pen.swell([[mx - wn * 0.45, my + 0.55], [mx - 0.1, my + 0.95], [mx + wf * 0.45, my + 0.55]], 0.7, mix(lip, look.skin, 0.25));
      pen.strip(spline(pts, 3), (t) => 0.55 * (t < 0.12 ? 0.5 + t * 4 : t > 0.88 ? lerp(1, 0.5, (t - 0.88) / 0.12) : 1), ln, { n: 1 });
      if (look.fang === 'always') pen.poly([[mx - wn * 0.62, my + 0.3], [mx - wn * 0.2, my + 0.25], [mx - wn * 0.42, my + 1.2]], teeth);
      break;
    }
    case 'soft':
      closed(0.45, 0.35, 0.3, 0.9);
      break;
    case 'shout':
      open([[mx - wn - 0.3, my - 0.6], [mx - 0.2, my - 0.9], [mx + wf + 0.2, my - 0.8], [mx + wf - 0.1, my + 0.9], [mx + 0.2, my + 2.6], [mx - wn * 0.6, my + 2.3], [mx - wn - 0.1, my + 0.6]], { top: 0.55, tg: 0.4 });
      break;
    case 'snarl':
      open([[mx - wn - 0.5, my - 0.3], [mx - 0.6, my - 0.9], [mx + wf + 0.4, my - 1], [mx + wf + 0.1, my + 0.6], [mx + 0.2, my + 1.7], [mx - wn * 0.7, my + 1.5]], { top: 0.6, bot: 0.45, tg: 0 });
      break;
    case 'grit': {
      // A set jaw: a level slot of gritted teeth, corners drawn down a touch.
      const pts = [[mx - wn - 0.1, my + 0.1], [mx - wn * 0.4, my - 0.45], [mx + wf * 0.5, my - 0.5], [mx + wf + 0.1, my], [mx + wf * 0.4, my + 1.15], [mx - wn * 0.5, my + 1.2]];
      pen.poly(pts, inside);
      pen.poly(clip([[mx - 4, my - 0.2], [mx + 3, my - 0.2], [mx + 3, my + 0.85], [mx - 4, my + 0.85]], pts), teeth);
      pen.strip(pts.slice(0, 4), (t) => 0.45 * Math.sin(PI * clamp(t, 0.1, 0.9)) ** 0.4, ln, { n: 1 });
      pen.swell([[mx - wn * 0.45, my + 1.45], [mx, my + 1.65], [mx + wf * 0.45, my + 1.4]], 0.5, lip);
      break;
    }
    case 'grimace': {
      // Teeth clenched, corners pulled down and back.
      const pts = [[mx - wn - 0.4, my + 0.4], [mx - wn * 0.5, my - 0.4], [mx + wf * 0.6, my - 0.45], [mx + wf + 0.3, my + 0.3], [mx + wf * 0.5, my + 1.6], [mx - wn * 0.5, my + 1.65]];
      pen.poly(pts, inside);
      pen.poly(clip([[mx - 4, my - 0.2], [mx + 3, my - 0.25], [mx + 3, my + 1.05], [mx - 4, my + 1.1]], pts), teeth);
      pen.taper([[mx - wn * 0.75, my + 0.5], [mx, my + 0.42], [mx + wf * 0.7, my + 0.45]], 0.22, 0.18, mix(inside, teeth, 0.3), { n: 1 });
      pen.strip(pts.slice(0, 4), (t) => 0.42 * Math.sin(PI * clamp(t, 0.1, 0.9)) ** 0.4, ln, { n: 1 });
      break;
    }
    case 'gasp':
      open(ell(mx - 0.2, my + 0.8, 1.1, 1.35, 14), { top: 0, tg: 0.35, fangs: false });
      break;
    case 'grin':
      open([[mx - wn - 0.2, my - 0.7], [mx, my - 0.55], [mx + wf + 0.2, my - 0.85], [mx + wf - 0.1, my + 0.5], [mx + 0.2, my + 1.9], [mx - wn * 0.5, my + 1.7], [mx - wn - 0.05, my + 0.4]], { top: 0.4, tg: 0.5 });
      break;
    case 'laugh':
      open([[mx - wn - 0.4, my - 0.8], [mx, my - 0.7], [mx + wf + 0.3, my - 1], [mx + wf, my + 0.9], [mx + 0.2, my + 2.6], [mx - wn * 0.55, my + 2.4], [mx - wn - 0.2, my + 0.6]], { top: 0.45, tg: 0.5 });
      break;
    case 'slack':
      open(ell(mx - 0.3, my + 0.5, 1.1, 0.6, 12), { top: 0, tg: 0.4, fangs: false });
      break;
    default: // 'smile'
      closed(0.55, 0.45, 0.2);
  }
}

// ---------- Tears, sweat, anger marks ----------

function tear(pen, x, y, s, look) {
  const c = look.tearC ?? '#bfe6ff';
  pen.poly([[x, y], [x + 0.55 * s, y + 1.3 * s], [x + 0.6 * s, y + 2 * s], [x, y + 2.5 * s], [x - 0.6 * s, y + 2 * s], [x - 0.55 * s, y + 1.3 * s]], c);
  pen.oval(x - 0.15 * s, y + 1.7 * s, 0.22 * s, 0.3 * s, '#ffffff');
  pen.taper([[x - 0.3 * s, y - 0.4 * s], [x, y + 0.4 * s]], 0.35 * s, 0.5 * s, mix(c, '#ffffff', 0.4), { n: 1 });
}

// Things that sit over the hair: a sweat drop on the temple (hurt), an anger mark (angry, if
// look.vein), drawn after the hair.
export function heroineTop(at, mood, look) {
  const pen = painter(at, look.k ?? 1, look.lineK ?? 1);
  const x = expression(mood, look);
  if (x.sweat) {
    const [sx, sy] = look.sweatAt ?? [14.2, -3];
    const c = '#a9dcff';
    pen.poly([[sx, sy - 1.6], [sx + 0.9, sy + 0.3], [sx + 0.7, sy + 1.1], [sx, sy + 1.4], [sx - 0.7, sy + 1.1], [sx - 0.9, sy + 0.3]], shade(c, -22));
    pen.poly([[sx, sy - 1.05], [sx + 0.62, sy + 0.35], [sx + 0.45, sy + 0.9], [sx, sy + 1.05], [sx - 0.45, sy + 0.9], [sx - 0.62, sy + 0.35]], c);
    pen.oval(sx - 0.2, sy + 0.4, 0.2, 0.32, '#ffffff');
  }
  if (x.vein && mood === 'angry') {
    const [vx, vy] = look.veinAt ?? [11, -11];
    const c = '#ff4d6d';
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pen.taper([[vx + dx * 0.4, vy + dy * 1.4], [vx + dx * 0.4, vy + dy * 0.45], [vx + dx * 1.4, vy + dy * 0.4]], 0.5, 0.5, c, { n: 2 });
  }
  return pen.out;
}
