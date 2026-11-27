// The Ruin Acolyte's look (2026-11-26, rebuilt from scratch to the new standard, keeping her idea): drawn
// live over her own copy of the kid base's bones (kidrig.js), outer outline only (every piece's outline
// in one pass, then every piece's fill), each line in the piece's own deeper colour, never near-black.
// Nothing of the player character's: her hair, face, eyes and robe are all her own.
//
// Who she is: a little acolyte of the Moon Maiden who still floats through the sunken temple she tends,
// long after everyone else left. A plum hood lined in gold that falls into a capelet over her shoulders;
// silver-lilac hair under it, an even round-cut fringe and two soft side locks; a plum robe with a gold
// placket, a gold sash knotted at her hip, wide bell sleeves; below the hem the robe thins into three
// soft lavender wisps where her feet would be (she floats). In her near hand, on a little chain, a gold
// censer; a wisp lives in it, her friend, glowing teal through its windows.
//
// Her face (her own eye family, "lantern eyes"): tall soft ovals; a violet iris that warms to wisp teal
// at the bottom as if lit from below, a soft round pupil, a big round glint and her signature, a little
// crescent moon glint; a neat lash line with two round flicks at the outer corner; a short mauve lower
// lid; round brows; a small closed mouth, the near corner tucked up. Awake, her eyes are always wide open
// and clear of hair and lids (the player, 2026-11-26).
//
// Hair (the player's standard, 2026-11-26): one clear rounded silhouette; an even blunt round cut made of
// several cut sections, a deeper inner layer up in the splits, soft round corners; every lock lit by one
// shared light from above, one shared soft shine band with fine lines of light, soft blurred shade.
//
// Units: the head in head units (eyes at y 12, the face's edges at about +-34, chin 33, the skull's top
// about -52), placed on the kid base at HX, HY, HS; everything else in kid units (a third of a game px).
import { E, T, F } from '../mobs/kit.js';
import { band, curve, blob } from '../mobs/kidbase.js';

export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, u) => a + (b - a) * u;
export const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
// (a beat's weight: 0 before t0, eased up to 1 by t1, held to t2, eased back to 0 by t3)
export const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
// (a damped settle from 0 to 1, overshooting once: a light bounce)
export const boing = (t, k = 7, w = 15) => (t <= 0 ? 0 : 1 - Math.exp(-k * t) * Math.cos(w * t));
export const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const hexRgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
// (the hit flash lifts every colour toward white)
export const tone = (a, c, al = 1) => {
  const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
  const [r, g, b] = hexRgb(c).map((v) => Math.round(v + (255 - v) * k));
  return al >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};
export const rgba = (c, al) => {
  const [r, g, b] = hexRgb(c);
  return `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};

// ---------- Her colours (each with its own soft ink) ----------
export const SKIN = { lt: '#fff8f4', base: '#ffeae2', sh: '#f4cbc0', deep: '#dea69a', ink: '#c88c84', guides: false };
export const HAIR = ['#f8f4ff', '#d9d0f2', '#b2a4e0', '#8c7cc4'];
export const HAIR_INK = '#7a6ab0';
export const ROBE = ['#c2aef0', '#8f72cc', '#6c50aa', '#4e3888'];
export const ROBE_INK = '#4a3482';
export const GOLD = ['#fff6c8', '#f6d070', '#d8a444', '#a8782c'];
export const GOLD_INK = '#9a6c28';
export const CREAM = ['#fffaf2', '#f4e8dc', '#dccbd8'];
export const WISP = ['#f2fffc', '#c2f8ee', '#7ee6da', '#40bcb4'];
export const WISP_INK = '#46a8a6';
export const MIST = ['#fbf8ff', '#e6dcfa', '#c6b4ee', '#a28ad8'];
export const MIST_INK = '#9a84d0';
const LASH = '#3a2858';
const IRIS = ['#2e2268', '#5a48b4', '#8c7ae0', '#78e4d8', '#d6fff8'];

// A path filled (mode 'fill') or outlined in `ink` (mode 'line').
export function paint(ctx, a, mode, col, ink, w = 6) {
  if (mode === 'line') {
    ctx.strokeStyle = ink;
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
}
// A soft round glow inside a clip (shading that never ends in a hard edge).
export function glow(ctx, x, y, r, col, al) {
  if (al <= 0.003) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(0.1, r));
  g.addColorStop(0, rgba(col, al));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// A closed smooth path through `pts` (a soft blob: every corner rounded).
export function smoothPath(ctx, pts) {
  const n = pts.length;
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  ctx.beginPath();
  const m0 = mid(pts[n - 1], pts[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  ctx.closePath();
}
// Shape lists (kit.js E / T / F, kidbase band / curve / blob) drawn live: mode 'line' outlines every
// shape not marked F in `ink`; 'fill' fills them all.
export function drawShapes(ctx, a, mode, list, lw, ink) {
  for (const s of list) {
    if (mode === 'line' && s.f) continue;
    ctx.beginPath();
    if (s.t === 'e') ctx.ellipse(s.x, s.y, Math.max(0.01, s.rx), Math.max(0.01, s.ry), 0, 0, TAU);
    else if (s.t === 'p') {
      const ox = s.x ?? 0;
      const oy = s.y ?? 0;
      s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + ox, y + oy) : ctx.moveTo(x + ox, y + oy)));
      ctx.closePath();
    } else continue;
    if (mode === 'line') {
      ctx.strokeStyle = s.ink ?? ink;
      ctx.lineWidth = lw;
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else {
      ctx.fillStyle = tone(a, s.c);
      ctx.fill();
    }
  }
}
const tbl = (pts, w0, w1, c) => band(curve(pts, 3), w0, w1, c, true);
const arc = (pts, w, c) => tbl(pts, w, w, c);

// ---------- Her head (head units) on the kid base ----------
export const HS = 0.72;
export const HX = 81;
export const HY = 83 - 31 * HS;
export const hk = ([u, v]) => [HX + u * HS, HY + v * HS];
const EY = 12;

// Her eye. o: -1 the far eye, 1 the near; kind: open | wide | happy | squeeze | shut | sleep | dizzy;
// gaze [x, y] where the iris looks (head units); tilt: the lash line's slant (cross: down to the
// middle; worried: up), drawn above the iris, never over it.
function eye(x, y, o, kind, gaze, tilt = 0) {
  const out = [];
  const P = (u, v) => [x + u * o, y + v];
  const rx = 8.2;
  const ry = 8.8;
  if (kind === 'happy') {
    // shut in a smile: a soft arch, the two flicks at its outer end, the cheek lifting under it
    out.push(...arc([P(-rx * 0.95, 2.4), P(-rx * 0.4, -4.2), P(rx * 0.4, -4.6), P(rx * 0.98, 1.8)], 2.6, LASH));
    out.push(...tbl([P(rx * 0.92, 0.4), P(rx * 1.3, -1.6)], 1.8, 1.2, LASH), F(E(...P(rx * 1.34, -1.9), 0.9, 0.9, LASH)));
    out.push(...arc([P(-rx * 0.45, 5.6), P(0, 6.4), P(rx * 0.5, 5.4)], 1.0, '#e0a0a4'));
    return out;
  }
  if (kind === 'squeeze') {
    out.push(...arc([P(-rx * 0.9, -4), P(-rx * 0.1, -0.8), P(rx * 0.9, 0.6)], 2.5, LASH));
    out.push(...arc([P(-rx * 0.8, 4.4), P(0, 2.6), P(rx * 0.9, 0.8)], 2.1, LASH));
    return out;
  }
  if (kind === 'shut' || kind === 'sleep') {
    // gently shut: a downturned curve ending in a small curled tail
    const d = kind === 'sleep' ? 4.6 : 3.6;
    out.push(...tbl([P(-rx * 0.95, 0), P(-rx * 0.2, d), P(rx * 0.55, d - 0.6), P(rx * 1.0, 0.2)], 1.6, 2.6, LASH));
    out.push(...tbl([P(rx * 0.98, 0.4), P(rx * 1.28, -0.6), P(rx * 1.3, -1.9)], 1.8, 1.0, LASH), F(E(...P(rx * 1.27, -2.0), 0.8, 0.8, LASH)));
    return out;
  }
  const wide = kind === 'wide' ? 1.06 : 1;
  const W = rx * wide;
  const Hh = ry * wide;
  // the white: a tall soft oval, a touch flatter on top
  out.push(F(blob([P(-W, 0.4), P(-W * 0.82, -Hh * 0.8), P(0, -Hh), P(W * 0.84, -Hh * 0.82), P(W, 0.2), P(W * 0.8, Hh * 0.84), P(0, Hh), P(-W * 0.8, Hh * 0.84)], '#ffffff', 2)));
  if (kind === 'dizzy') {
    const pts = [];
    for (let i = 0; i <= 26; i++) {
      const u = i / 26;
      const an = u * TAU * 1.7 * o;
      pts.push(P(Math.cos(an) * u * rx * 0.7 * o, Math.sin(an) * u * ry * 0.7));
    }
    out.push(...arc(pts, 1.5, IRIS[1]));
    out.push(...tbl([P(-W * 0.96, -2.2), P(-W * 0.5, -Hh * 0.98), P(W * 0.4, -Hh * 1.02), P(W * 0.98, -2.4)], 1.8, 3.0, LASH));
    return out;
  }
  const [gx, gy] = gaze ?? [0.6, 0.4];
  const ix = x + gx + 0.3 * o;
  const iy = y + gy + 0.5;
  const ir = kind === 'wide' ? 0.84 : 1;
  const iw = rx * 0.76 * ir;
  const ih = ry * 0.82 * ir;
  // the iris: a deep violet rim, violet, a warm wisp-teal glow up from the bottom, a pale ring round
  // the pupil, a soft round pupil
  out.push(F(E(ix, iy, iw, ih, IRIS[0])), F(E(ix, iy + 0.4, iw * 0.86, ih * 0.88, IRIS[1])));
  out.push(F(E(ix, iy + ih * 0.36, iw * 0.7, ih * 0.44, IRIS[2])), F(E(ix, iy + ih * 0.5, iw * 0.56, ih * 0.3, IRIS[3])));
  out.push(F(E(ix, iy + 0.3, iw * 0.46, ih * 0.46, IRIS[2])));
  out.push(F(E(ix, iy + 0.2, iw * 0.36 * ir, ih * 0.38 * ir, '#20184e')));
  // glints: a big round one up on the far side, and her crescent moon low on the near side
  out.push(F(E(ix - 2.4 * o, iy - 3.2, 2.6 * ir, 2.4 * ir, '#ffffff')));
  const cx = ix + 2.6 * o;
  const cy = iy + 3.0;
  out.push(F(E(cx, cy, 1.7, 1.7, IRIS[4])), F(E(cx + 0.8 * o, cy - 0.5, 1.45, 1.45, IRIS[3])));
  out.push(F(E(ix + 0.4 * o, iy - 4.6, 0.7, 0.7, '#ffffff')));
  // the lash line: thin at the inner corner, thickening to a soft wing; two short round flicks grown
  // from it, leaning out; slanted by `tilt` above the iris
  const ti = tilt;
  out.push(...tbl([P(-W * 0.98, -1.6 + ti * 1.2), P(-W * 0.6, -Hh * 0.92 + ti * 0.8), P(W * 0.3, -Hh * 1.04), P(W * 0.9, -Hh * 0.62), P(W * 1.08, -2.6)], 1.4, 3.2, LASH));
  out.push(...tbl([P(W * 0.72, -Hh * 0.78), P(W * 1.04, -Hh * 0.98), P(W * 1.22, -Hh * 1.16)], 1.9, 1.1, LASH), F(E(...P(W * 1.23, -Hh * 1.19), 0.62, 0.62, LASH)));
  out.push(...tbl([P(W * 0.96, -Hh * 0.42), P(W * 1.26, -Hh * 0.56), P(W * 1.44, -Hh * 0.66)], 1.7, 1.0, LASH), F(E(...P(W * 1.45, -Hh * 0.68), 0.55, 0.55, LASH)));
  // the lower lid: a short soft mauve line under the outer two thirds
  out.push(...arc([P(-W * 0.2, Hh * 0.92), P(W * 0.4, Hh * 0.96), P(W * 0.82, Hh * 0.66)], 1.0, '#c890a6'));
  return out;
}

// Her face by mood: eyes, round brows, cheeks, the mouth.
//   moods: calm happy giggle up down surprised panic fierce shout hurt dizzy sleep shut blink pray
//          focus smile worried sad sweet hum talkA talkE talkO yawn sorry
const EYES = {
  calm: ['open', [0.6, 0.6]], happy: ['happy'], giggle: ['happy'], smile: ['open', [0.8, 0.8]], up: ['open', [0.4, -2.8]], down: ['open', [0.8, 2.6]],
  surprised: ['wide', [0.2, -0.4]], panic: ['wide', [2.2, 0.4]], panicL: ['wide', [-2.2, 0.4]], fierce: ['open', [2.0, 0.6], 1], shout: ['squeeze'], focus: ['open', [2.4, 0.2], 0.6],
  hurt: ['squeeze'], dizzy: ['dizzy'], sleep: ['sleep'], shut: ['shut'], blink: ['shut'], pray: ['shut'], hum: ['shut'], sweet: ['happy'], yawn: ['squeeze'],
  worried: ['open', [0.8, 1.4], -0.8], sad: ['open', [0.4, 2.2], -1], sorry: ['open', [-0.6, 2.0], -0.8], follow: ['open', [-2.4, -1.6]], followR: ['open', [2.6, -1.4]],
  talkA: ['open', [1.0, 0.4]], talkE: ['open', [1.0, 0.4]], talkO: ['open', [1.0, 0.4]],
};
const BROWS = {
  fierce: [-1.4, 3.0], focus: [-0.6, 1.8], shout: [-0.8, 2.2], hurt: [1.8, -2.4], sad: [2.0, -2.4], worried: [1.8, -2.6], panic: [1.2, -2.8], panicL: [1.2, -2.8], surprised: [-2.6, -3.4],
  up: [-0.6, -1.6], happy: [-0.8, -1.2], giggle: [-0.8, -1.2], sweet: [-0.8, -1.2], pray: [0.6, -0.6], hum: [-0.4, -0.8], sleep: [0.4, 0.4], dizzy: [1.4, -1.6], sorry: [1.8, -2.2], yawn: [0.8, -1.8], follow: [-0.4, -1.6], followR: [-0.4, -1.6],
};
function face(mood) {
  const out = [];
  // a soft round kid face, full cheeks at eye level, a small round chin
  out.push(blob([[-33, -14], [-34.4, 6], [-31, 20], [-19, 29.6], [1, 33.4], [21, 29.6], [32, 20], [35, 6], [33.6, -14], [0, -31]], SKIN.base, 4));
  // (soft shade down the far cheek, warm under the jaw)
  out.push(F(blob([[-33, 0], [-32.6, 15], [-26, 25], [-29.6, 12]], SKIN.sh, 2)));
  const hot = mood === 'shout' || mood === 'fierce' || mood === 'panic' || mood === 'panicL' || mood === 'hurt' || mood === 'giggle' || mood === 'sorry';
  for (const cx of [-20, 23]) {
    out.push(F(E(cx, 23.2, hot ? 8.4 : 7.4, hot ? 4.8 : 4.2, hot ? '#ffb2c0' : '#ffccd0')));
    out.push(F(E(cx, 23.2, 4.2, 2.4, hot ? '#ff9cb0' : '#ffbcc4')));
    out.push(F(E(cx - 2.2, 22, 1.8, 0.9, '#fff0ee')));
  }
  const [kind, gaze, tilt] = EYES[mood] ?? EYES.calm;
  out.push(...eye(-13, EY, -1, kind, gaze, tilt ?? 0), ...eye(15, EY, 1, kind, gaze, tilt ?? 0));
  // the nose: a soft little shade and a light
  out.push(F(E(2.8, 21.4, 1.5, 1.0, SKIN.sh)), F(E(2.4, 20.9, 0.6, 0.45, '#ffffff')));
  // the mouth (the face's centre line, x 1.5)
  const LIP = '#a6445e';
  const M = (pts) => blob(pts, '#a43e58', 2);
  const tongue = '#ff94a8';
  switch (mood) {
    case 'happy':
    case 'giggle':
    case 'sweet': {
      const big = mood === 'giggle' ? 1.12 : 1;
      out.push(M([[-3.4 * big, 26], [1.5, 27], [6.4 * big, 26], [5.4 * big, 29.6 * big], [1.5, 31 * big], [-2.4 * big, 29.6 * big]]), F(E(1.5, 29.6, 2.8 * big, 1.3, tongue)));
      break;
    }
    case 'shout':
    case 'yawn': {
      const big = mood === 'yawn' ? 1.15 : 1.05;
      out.push(M([[-2.8 * big, 25.6], [1.5, 25], [5.8 * big, 25.6], [5.4 * big, 30], [1.5, 31.8 * big], [-2.4 * big, 30]]), F(E(1.5, 30, 2.6, 1.3, tongue)));
      break;
    }
    case 'surprised':
    case 'up':
    case 'talkO':
      out.push(M([[-0.6, 26], [1.5, 25.2], [3.6, 26], [3.8, 28.6], [1.5, 29.8], [-0.8, 28.6]]), F(E(1.5, 28.4, 1.2, 0.7, tongue)));
      break;
    case 'talkA':
      out.push(M([[-2.2, 26], [1.5, 25.6], [5.2, 26], [4.4, 29.4], [1.5, 30.4], [-1.4, 29.4]]), F(E(1.5, 29.2, 1.8, 0.8, tongue)));
      break;
    case 'talkE':
      out.push(M([[-3, 26.4], [1.5, 26.8], [6, 26.4], [5, 28.6], [1.5, 29.2], [-2, 28.6]]));
      break;
    case 'hum':
      // humming: a tiny round "o" pushed to the near side
      out.push(M([[1.6, 26.6], [3.2, 25.8], [4.8, 26.6], [4.8, 28.2], [3.2, 29], [1.6, 28.2]]));
      break;
    case 'panic':
    case 'panicL':
    case 'worried':
    case 'sad':
    case 'hurt':
    case 'sorry':
      out.push(...tbl([[-3, 28.2], [-0.8, 26.8], [1.5, 28], [3.8, 26.8], [6, 28]], 1.6, 1.6, LIP));
      break;
    case 'fierce':
    case 'focus':
      // a determined little pout, the corners pressed down a touch
      out.push(...tbl([[-2.4, 28.2], [0, 27.2], [3, 27.2], [5.6, 28.4]], 1.6, 1.8, LIP), F(E(1.5, 29.4, 2.2, 0.6, '#ffc4c0')));
      break;
    case 'pray':
    case 'smile':
      out.push(...tbl([[-2.6, 26.6], [0, 27.8], [3, 27.8], [5.8, 26.2]], 1.4, 1.6, LIP), F(E(1.5, 29.2, 2.4, 0.7, '#ffc4c0')));
      break;
    case 'sleep':
      out.push(M([[0.2, 27], [1.5, 26.4], [2.8, 27], [2.8, 28.4], [1.5, 29], [0.2, 28.4]]));
      break;
    case 'dizzy':
      out.push(...tbl([[-2.4, 28], [0, 26.6], [1.5, 28], [3.4, 26.6], [5.6, 28]], 1.5, 1.5, LIP));
      break;
    default:
      // at rest: closed, fuller in the middle, the near corner tucked up a touch
      out.push(...tbl([[-2.4, 27.2], [0, 28], [2.6, 28.1], [5.0, 27.4], [6.6, 26.2]], 1.3, 1.7, LIP), F(E(1.6, 29.4, 2.2, 0.6, '#ffc6c2')));
  }
  return out;
}
// Round brows: short, full, even, round at both ends, just under the fringe's cut (drawn before it,
// so the cut tucks over them when they rise).
function brows(mood) {
  const br = BROWS[mood] ?? [0, 0];
  const c = HAIR[3];
  const cap = (p, w) => F(E(p[0], p[1], w / 2, w / 2, c));
  const L = [[-18.4, 0.6 + br[0]], [-13, -0.8 + (br[0] + br[1]) / 2], [-8, 0.2 + br[1]]];
  const R = [[10, 0.2 + br[1]], [15, -0.8 + (br[0] + br[1]) / 2], [20.4, 0.6 + br[0]]];
  const w = 2.5;
  return [
    cap(L[0], w), cap(L[2], w), cap(R[0], w), cap(R[2], w),
    ...arc([[-18.4, 0.6 + br[0]], [-13, -0.8 + (br[0] + br[1]) / 2], [-8, 0.2 + br[1]]], 2.4, c),
    ...arc([[10, 0.2 + br[1]], [15, -0.8 + (br[0] + br[1]) / 2], [20.4, 0.6 + br[0]]], 2.4, c),
  ];
}
const FACES = {};
export function faceShapes(mood) {
  return (FACES[mood] ??= face(mood));
}
const BROW_CACHE = {};
export function browShapes(mood) {
  return (BROW_CACHE[mood] ??= brows(mood));
}

// ---------- Her hair (head units): one shared light, one shared shine ----------
// The light comes from above: every piece is filled from the same top-to-bottom ramp, so the hair
// reads as one head of hair.
function hairFill(ctx, a, ox = 0, oy = 0) {
  const g = ctx.createLinearGradient(-10 - ox, -50 - oy, 6 - ox, 40 - oy);
  g.addColorStop(0, tone(a, HAIR[0]));
  g.addColorStop(0.24, tone(a, HAIR[1]));
  g.addColorStop(0.6, tone(a, HAIR[1]));
  g.addColorStop(1, tone(a, HAIR[2]));
  return g;
}
// The round cut: longest in the middle just above her brows' tops, rising toward the temples.
const cutY = (x) => -4.6 + (x / 31) ** 2 * 6.4;
// The fringe's cut sections, left to right (their edges where they meet), each a little different.
const SECT = [-31, -19.8, -7, 10.6, 21.8, 31];
const SPLIT = [5.2, 6.4, 4.6, 5.8];
function section(ctx, i, grow = 0) {
  const last = SECT.length - 2;
  const x0 = SECT[i] - (i === 0 ? 0 : 0.9) - grow;
  const x1 = SECT[i + 1] + (i === last ? 0 : 0.9) + grow;
  const r = 2.4;
  // (the sides run down straight-ish, overlapping their neighbours, and only near the cut lean in, so
  // each split opens as a short soft V up from the cut, the deeper layer showing inside it)
  const b0 = x0 + (i === 0 ? 0.6 : 1.5);
  const b1 = x1 - (i === last ? 0.6 : 1.5);
  const y0 = cutY(b0) + grow;
  const y1 = cutY(b1) + grow;
  const hL = i === 0 ? 4 : SPLIT[Math.min(SPLIT.length - 1, i - 1)] * 1.25;
  const hR = i === last ? 4 : SPLIT[Math.min(SPLIT.length - 1, i)] * 1.25;
  const top = -50;
  ctx.moveTo(x0 - 0.3, top);
  ctx.quadraticCurveTo(x0 - 0.6, (top + y0 - hL) / 2, x0, y0 - hL);
  ctx.quadraticCurveTo(x0 + 0.3, y0 - r - 0.6, b0, y0 - r);
  ctx.quadraticCurveTo(b0, y0, b0 + r, y0 + 0.2);
  // the clump's end, trimmed nearly flat along the cut, a hair fuller in the middle
  const n = 6;
  for (let k = 1; k < n; k++) {
    const u = k / n;
    const x = lerp(b0 + r, b1 - r, u);
    ctx.lineTo(x, cutY(x) + grow + 0.25 + Math.sin(Math.PI * u) * 0.5);
  }
  ctx.lineTo(b1 - r, y1 + 0.2);
  ctx.quadraticCurveTo(b1, y1, b1, y1 - r);
  ctx.quadraticCurveTo(x1 - 0.3, y1 - r - 0.6, x1, y1 - hR);
  ctx.quadraticCurveTo(x1 + 0.6, (top + y1 - hR) / 2, x1 + 0.3, top);
  ctx.closePath();
}
function fringePath(ctx, grow = 0) {
  ctx.beginPath();
  for (let i = 0; i < SECT.length - 1; i++) section(ctx, i, grow);
}
// The cap: the hair over the top of her head, one size larger than the skull, down to the hairline.
const CAP = [[-41, -18], [-43.4, -34], [-38, -50], [-24, -59.6], [0, -62.6], [24, -59.6], [38, -50], [43.4, -34], [41, -18], [30, -27], [14, -31.6], [0, -32.6], [-14, -31.6], [-30, -27]];
// The back of her hair (behind the face, inside her hood): a soft round mass to below her chin.
const BACK = [[-42, -30], [-46, -4], [-45, 20], [-40, 38], [-28, 44], [-10, 40], [0, 38], [12, 40], [30, 44], [42, 38], [47, 20], [47, -4], [43, -30], [0, -60]];
// A side lock (head units, in its own frame: its root at 0, 0 tucked up under the cap, hanging down).
const LOCK = (o) => [[-7.4 * o, -14], [-8 * o, 8], [-7.4 * o, 28], [-5.2 * o, 42], [-0.6 * o, 47.4], [4 * o, 45.6], [6.2 * o, 36], [7.4 * o, 18], [8 * o, 0], [7.6 * o, -14]];
export const LOCK_ROOT = { F: [-36.6, -14], N: [37.6, -14] };

export function hairBack(ctx, a, mode) {
  smoothPath(ctx, BACK);
  if (mode === 'line') return paint(ctx, a, 'line', null, HAIR_INK, 6 / HS);
  ctx.fillStyle = tone(a, HAIR[2]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, -30, 30, 22, HAIR[3], 0.5);
  glow(ctx, 0, 40, 26, HAIR[3], 0.45);
  ctx.restore();
}
// A side lock, swinging by `swing` about its root (o: -1 far, 1 near).
export function sideLock(ctx, a, mode, k, swing) {
  const o = k === 'F' ? -1 : 1;
  const [rx, ry] = LOCK_ROOT[k];
  ctx.save();
  ctx.translate(rx, ry);
  ctx.rotate(swing);
  smoothPath(ctx, LOCK(o));
  if (mode === 'line') {
    paint(ctx, a, 'line', null, HAIR_INK, 6 / HS);
    ctx.restore();
    return;
  }
  ctx.fillStyle = hairFill(ctx, a, rx, ry);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // soft shade on its inner side, where it lies against her cheek, and at its end
  glow(ctx, -5 * o, 30, 11, HAIR[3], 0.32);
  glow(ctx, 0, 50, 9, HAIR[2], 0.5);
  ctx.restore();
  ctx.restore();
}
// The cap and the fringe, as one: the deeper inner layer up in the splits, the sections, their soft
// shade, the shared shine band and its fine lines of light.
export function hairFront(ctx, a, mode, sway = [0, 0, 0, 0, 0, 0]) {
  if (mode === 'line') {
    smoothPath(ctx, CAP);
    paint(ctx, a, 'line', null, HAIR_INK, 6 / HS);
    for (let i = 0; i < SECT.length - 1; i++) {
      ctx.save();
      swayed(ctx, i, sway[i]);
      ctx.beginPath();
      section(ctx, i);
      paint(ctx, a, 'line', null, HAIR_INK, 6 / HS);
      ctx.restore();
    }
    return;
  }
  // the inner layer, a deeper tone, seen up inside the splits
  ctx.beginPath();
  ctx.moveTo(-30.6, -40);
  for (let x = -30.6; x <= 30.6; x += 3) ctx.lineTo(x, cutY(x) - 1.6);
  ctx.lineTo(30.6, -40);
  ctx.closePath();
  ctx.fillStyle = tone(a, HAIR[3]);
  ctx.fill();
  // the cap
  smoothPath(ctx, CAP);
  ctx.fillStyle = hairFill(ctx, a);
  ctx.fill();
  // the sections, each on its own little sway (the tips move, the roots stay)
  for (let i = 0; i < SECT.length - 1; i++) {
    ctx.save();
    swayed(ctx, i, sway[i]);
    ctx.beginPath();
    section(ctx, i);
    ctx.fillStyle = hairFill(ctx, a);
    ctx.fill();
    ctx.clip();
    // soft shade under its trimmed end, and along its sides at the splits
    const x0 = SECT[i];
    const x1 = SECT[i + 1];
    const mx = (x0 + x1) / 2;
    const g = ctx.createLinearGradient(0, cutY(mx) - 9, 0, cutY(mx) + 1);
    g.addColorStop(0, rgba(HAIR[2], 0));
    g.addColorStop(1, rgba(HAIR[3], 0.4));
    ctx.fillStyle = g;
    ctx.fillRect(x0 - 3, cutY(mx) - 9, x1 - x0 + 6, 11);
    for (const [ex, side] of [[x0, 1], [x1, -1]]) {
      if (ex === SECT[0] || ex === SECT[SECT.length - 1]) continue;
      // a thin shade along the clump's side at the split, fading out toward the crown
      const h = SPLIT[Math.min(SPLIT.length - 1, side > 0 ? i - 1 : i)] * 1.9;
      const yb = cutY(ex);
      const gv = ctx.createLinearGradient(0, yb, 0, yb - h);
      gv.addColorStop(0, rgba(HAIR[3], 0.42));
      gv.addColorStop(1, rgba(HAIR[3], 0));
      ctx.strokeStyle = gv;
      ctx.lineWidth = 1.7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex + side * 1.6, yb - 1);
      ctx.quadraticCurveTo(ex + side * 0.9, yb - h * 0.5, ex + side * 0.3, yb - h);
      ctx.stroke();
    }
    ctx.restore();
  }
  // the shared shine: one soft band across the cap and the fringe at one height, brighter on the lit
  // (far, upper left) side, with fine lines of light of different lengths along it
  ctx.save();
  ctx.beginPath();
  smoothPathInto(ctx, CAP);
  for (let i = 0; i < SECT.length - 1; i++) section(ctx, i);
  ctx.clip();
  const bandY = (x) => -27 + (x / 34) ** 2 * 6;
  for (const [hw, al] of [[7, 0.1], [5, 0.12], [3.2, 0.14], [1.8, 0.14]]) {
    ctx.beginPath();
    ctx.moveTo(-40, bandY(-40) - hw);
    for (let x = -40; x <= 40; x += 4) ctx.lineTo(x, bandY(x) - hw);
    for (let x = 40; x >= -40; x -= 4) ctx.lineTo(x, bandY(x) + hw);
    ctx.closePath();
    const gh = ctx.createLinearGradient(-40, 0, 40, 0);
    gh.addColorStop(0, 'rgba(255,255,255,0)');
    gh.addColorStop(0.18, `rgba(255,255,255,${al * 1.4})`);
    gh.addColorStop(0.55, `rgba(255,255,255,${al})`);
    gh.addColorStop(0.9, `rgba(255,255,255,${al * 0.3})`);
    gh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gh;
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineCap = 'round';
  for (const [x, len, w] of [[-23, 5, 0.8], [0.6, 6.4, 0.8], [16, 2.6, 0.6]]) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x - len / 2, bandY(x - len / 2) + 0.4);
    ctx.quadraticCurveTo(x, bandY(x) - 0.4, x + len / 2, bandY(x + len / 2) + 0.4);
    ctx.stroke();
  }
  ctx.restore();
}
function smoothPathInto(ctx, pts) {
  const n = pts.length;
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  ctx.closePath();
}
// (a section's sway: turned about its root at the top, so only its end moves; tiny, never over the eyes)
function swayed(ctx, i, s) {
  if (!s) return;
  const rx = (SECT[i] + SECT[i + 1]) / 2;
  ctx.translate(rx, -40);
  ctx.rotate(clamp(s, -0.05, 0.05));
  ctx.translate(-rx, 40);
}
// The forehead's soft cast shadow under the cut, in her skin's own shade.
export function foreheadShade(ctx, a) {
  ctx.beginPath();
  ctx.moveTo(-31, cutY(-31) - 2);
  for (let x = -31; x <= 31; x += 2) ctx.lineTo(x, cutY(x) + 2.2 + Math.sin(x * 0.55) * 0.5);
  ctx.lineTo(31, cutY(31) - 4);
  ctx.lineTo(-31, cutY(-31) - 4);
  ctx.closePath();
  ctx.fillStyle = tone(a, SKIN.sh, 0.75);
  ctx.fill();
}

// ---------- The hood (head units) ----------
// The hood behind her head, falling round her neck; its rim over the crown in front of the cap.
const HOOD = [[-34, 44], [-48, 24], [-53, -6], [-50, -34], [-42, -56], [-24, -70], [0, -74], [24, -70], [42, -56], [50, -34], [53, -6], [48, 24], [34, 44], [0, 50]];
export function hoodBack(ctx, a, mode) {
  smoothPath(ctx, HOOD);
  if (mode === 'line') return paint(ctx, a, 'line', null, ROBE_INK, 6 / HS);
  ctx.fillStyle = tone(a, ROBE[2]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // its lining, gold, showing round her face; deep shade inside
  smoothPath(ctx, HOOD.map(([x, y]) => [x * 0.86, y * 0.86 - 2]));
  ctx.fillStyle = tone(a, GOLD[2]);
  ctx.fill();
  smoothPath(ctx, HOOD.map(([x, y]) => [x * 0.8, y * 0.8 - 1]));
  ctx.fillStyle = tone(a, ROBE[3]);
  ctx.fill();
  glow(ctx, -34, -40, 30, ROBE[1], 0.7);
  ctx.restore();
}
// The hood's front, over her crown: the face opening framing her fringe, gold piping on its edge, a
// little crescent on top.
export function hoodRim(ctx, a, mode) {
  const outer = [[-51, -10], [-51.6, -34], [-43, -56], [-24, -70], [0, -74], [24, -70], [43, -56], [51.6, -34], [51, -10]];
  const inner = [[42.4, -12], [43.4, -26], [38, -36.4], [22, -42.6], [0, -44.6], [-22, -42.6], [-38, -36.4], [-43.4, -26], [-42.4, -12]];
  smoothPath(ctx, [...outer, ...inner]);
  if (mode === 'line') return paint(ctx, a, 'line', null, ROBE_INK, 6 / HS);
  ctx.fillStyle = tone(a, ROBE[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, -24, -64, 20, ROBE[0], 0.7);
  glow(ctx, 46, -22, 16, ROBE[3], 0.55);
  glow(ctx, 0, -46, 12, ROBE[3], 0.35);
  ctx.restore();
  // the gold piping along its inner edge
  ctx.beginPath();
  inner.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = tone(a, GOLD[1]);
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  // the crescent on top
  crescent(ctx, a, 0, -60, 5.4, -0.5);
}
export function crescent(ctx, a, x, y, r, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.arc(0, 0, r, -Math.PI * 0.62, Math.PI * 0.62, true);
  ctx.quadraticCurveTo(-r * 0.15, 0, Math.cos(-Math.PI * 0.62) * r, Math.sin(-Math.PI * 0.62) * r);
  ctx.closePath();
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ctx.strokeStyle = tone(a, GOLD[3]);
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ell(ctx, -r * 0.62, -r * 0.3, r * 0.2, r * 0.26);
  ctx.fillStyle = tone(a, GOLD[0]);
  ctx.fill();
  ctx.restore();
}

// ---------- Her robe (kid units) ----------
// The bodice over her chest: plum, a gold placket down its middle.
export function bodice(ctx, a, mode) {
  smoothPath(ctx, [[65.4, 92], [67.4, 87], [72.6, 84.6], [80, 84], [87.8, 84.6], [93, 87], [95, 92], [95.6, 105], [64.8, 105]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, ROBE_INK);
  ctx.fillStyle = tone(a, ROBE[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 90, 90, 9, ROBE[0], 0.7);
  glow(ctx, 66, 102, 9, ROBE[2], 0.7);
  smoothPath(ctx, [[82.6, 84], [86.4, 84], [86.2, 106], [82.4, 106]]);
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ctx.fillStyle = tone(a, GOLD[0]);
  ctx.fillRect(83.4, 86, 1, 18);
  ctx.restore();
}
// The capelet: the hood's fall over her shoulders, a gold hem, the crescent clasp at her throat.
export function capelet(ctx, a, mode) {
  const pts = [[63.4, 94.6], [64.6, 88], [70, 84], [80, 82.6], [90, 84], [95.6, 88], [97, 94.4], [93, 96.6], [86, 95.4], [80, 96.2], [74, 95.4], [67, 96.8]];
  smoothPath(ctx, pts);
  if (mode === 'line') return paint(ctx, a, 'line', null, ROBE_INK);
  ctx.fillStyle = tone(a, ROBE[2]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 91, 88, 7, ROBE[1], 0.8);
  ctx.strokeStyle = tone(a, GOLD[1]);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(62, 94.4);
  ctx.quadraticCurveTo(66, 97.2, 70, 95.8);
  ctx.quadraticCurveTo(76, 95, 80, 95.8);
  ctx.quadraticCurveTo(86, 94.8, 92, 96.2);
  ctx.quadraticCurveTo(96, 96.4, 98, 93.8);
  ctx.stroke();
  ctx.restore();
  // the cream collar under the clasp, and the clasp
  smoothPath(ctx, [[76.2, 84.4], [80.6, 85.4], [85.4, 84.2], [84.8, 88.6], [80.8, 90], [76.6, 88.4]]);
  ctx.fillStyle = tone(a, CREAM[0]);
  ctx.fill();
  crescentKid(ctx, a, 81, 88.8);
}
function crescentKid(ctx, a, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.62, 0.62);
  crescent(ctx, a, 0, 0, 4.4, -0.4);
  ctx.restore();
}
// The sash knotted at her near hip (on her waist), its knot and its two ends (each its own piece).
export function sash(ctx, a, mode) {
  smoothPath(ctx, [[64.4, 101.6], [80, 102.8], [96.2, 101.4], [96.6, 106.4], [80, 107.4], [64.2, 106.4]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, GOLD_INK, 4);
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = tone(a, GOLD[0]);
  ctx.fillRect(62, 102.6, 40, 1.2);
  glow(ctx, 66, 106, 6, GOLD[2], 0.7);
  ctx.restore();
}
export function sashKnot(ctx, a, mode) {
  smoothPath(ctx, [[88.4, 101.6], [93.2, 101.2], [94.4, 104.2], [93, 107.4], [88.6, 107.4], [87.4, 104.4]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, GOLD_INK, 3);
  ctx.fillStyle = tone(a, GOLD[2]);
  ctx.fill();
  ell(ctx, 90.2, 103.4, 1.4, 1);
  ctx.fillStyle = tone(a, GOLD[0]);
  ctx.fill();
}
// A sash end (from its root at 0, 0 in the knot, hanging down), with a little tassel.
export function sashEnd(ctx, a, mode, len, w) {
  smoothPath(ctx, [[-w * 0.5, -1], [w * 0.5, -1], [w * 0.62, len * 0.6], [w * 0.4, len], [-w * 0.46, len], [-w * 0.6, len * 0.55]]);
  if (mode === 'line') {
    paint(ctx, a, 'line', null, GOLD_INK, 3);
    smoothPath(ctx, [[-1.6, len - 0.4], [1.6, len - 0.4], [2, len + 4.4], [0, len + 5.6], [-2, len + 4.4]]);
    paint(ctx, a, 'line', null, GOLD_INK, 2.4);
    return;
  }
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, w * 0.3, len * 0.5, w, GOLD[2], 0.6);
  ctx.restore();
  smoothPath(ctx, [[-1.6, len - 0.4], [1.6, len - 0.4], [2, len + 4.4], [0, len + 5.6], [-2, len + 4.4]]);
  ctx.fillStyle = tone(a, GOLD[2]);
  ctx.fill();
  ell(ctx, -0.4, len + 1.2, 0.6, 1.2);
  ctx.fillStyle = tone(a, GOLD[0]);
  ctx.fill();
}
// The skirt's panels (F the far half, N the near), from her sash to the hem, a gold hem band.
const SKIRT = {
  F: [[64.6, 104], [74, 103.6], [81.6, 104], [81.4, 120], [81, 136.2], [72, 137.6], [62.6, 136.8], [58.6, 134.4], [61, 120]],
  N: [[79, 104], [88, 103.6], [96.4, 104], [99, 120], [102.6, 134.2], [97, 137], [88, 137.8], [79.2, 136.6], [79.2, 120]],
};
export function skirtPanel(ctx, a, mode, k) {
  smoothPath(ctx, SKIRT[k]);
  if (mode === 'line') return paint(ctx, a, 'line', null, ROBE_INK);
  const far = k === 'F';
  ctx.fillStyle = tone(a, far ? ROBE[2] : ROBE[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (far) glow(ctx, 62, 128, 12, ROBE[3], 0.6);
  else {
    glow(ctx, 96, 112, 10, ROBE[0], 0.6);
    glow(ctx, 84, 134, 10, ROBE[2], 0.55);
  }
  // a soft fold down the panel
  ctx.strokeStyle = tone(a, far ? ROBE[3] : ROBE[2]);
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (far) {
    ctx.moveTo(72, 110);
    ctx.quadraticCurveTo(70, 122, 68.6, 134);
  } else {
    ctx.moveTo(92, 110);
    ctx.quadraticCurveTo(94.4, 122, 96, 134);
  }
  ctx.stroke();
  // the gold hem band
  ctx.strokeStyle = tone(a, far ? GOLD[2] : GOLD[1]);
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  const pts = SKIRT[k].slice(4, 9);
  ctx.moveTo(pts[0][0], pts[0][1] - 1.2);
  for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y - 1.2);
  ctx.stroke();
  ctx.restore();
  if (!far) {
    // the placket carried on down the skirt
    ctx.strokeStyle = tone(a, GOLD[2]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(84.4, 107);
    ctx.quadraticCurveTo(84.8, 121, 86, 135);
    ctx.stroke();
  }
}
// The back of the skirt, behind (its inside, in shadow).
export function skirtBack(ctx, a, mode) {
  smoothPath(ctx, [[64, 106], [96, 106], [101, 133], [92, 136.4], [80, 137], [68, 136.4], [58.6, 133]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, ROBE_INK);
  ctx.fillStyle = tone(a, ROBE[3]);
  ctx.fill();
}
// A wisp of the robe trailing off where her feet would be (from its root at 0, 0 inside the hem,
// hanging down and curling back at its end): soft lavender mist, paler toward its rounded tip.
export function wispTail(ctx, a, mode, len, w, curl) {
  // (soft mist, no outline: it fades out toward its curling tip)
  if (mode === 'line') return;
  const pts = [[-w * 0.5, -4], [w * 0.5, -4], [w * 0.58, len * 0.3], [w * 0.34 + curl * 0.3, len * 0.68], [curl * 0.85, len * 0.97], [curl * 1.0 - w * 0.2, len * 1.04], [curl * 0.6 - w * 0.38, len * 0.82], [-w * 0.46, len * 0.4]];
  smoothPath(ctx, pts);
  const g = ctx.createLinearGradient(0, 0, curl * 0.6, len);
  g.addColorStop(0, tone(a, MIST[2]));
  g.addColorStop(0.45, tone(a, MIST[1], 0.85));
  g.addColorStop(1, tone(a, MIST[0], 0.05));
  ctx.fillStyle = g;
  ctx.fill();
  const gl = ctx.createLinearGradient(0, 0, curl * 0.6, len);
  gl.addColorStop(0, rgba(MIST_INK, 0.75));
  gl.addColorStop(0.7, rgba(MIST_INK, 0.2));
  gl.addColorStop(1, rgba(MIST_INK, 0));
  ctx.strokeStyle = gl;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.save();
  ctx.clip();
  glow(ctx, w * 0.1, len * 0.28, w * 0.7, '#ffffff', 0.45);
  ctx.restore();
}
// A sleeve along an arm bone (p0 to p1 in its frame, game px), `w0`/`w1` wide (kid units).
export function sleevePiece(ctx, a, mode, p0, p1, w0, w1, col) {
  const sc = 1 / 3;
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  ctx.beginPath();
  ctx.moveTo(p0[0] + nx * w0 * 0.5 * sc, p0[1] + ny * w0 * 0.5 * sc);
  ctx.lineTo(p1[0] + nx * w1 * 0.5 * sc, p1[1] + ny * w1 * 0.5 * sc);
  // (round caps bulging outward at both ends: anticlockwise from the side to the other side)
  ctx.arc(p1[0], p1[1], w1 * 0.5 * sc, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
  ctx.lineTo(p0[0] - nx * w0 * 0.5 * sc, p0[1] - ny * w0 * 0.5 * sc);
  ctx.arc(p0[0], p0[1], w0 * 0.5 * sc, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true);
  ctx.closePath();
  if (mode === 'line') return paint(ctx, a, 'line', null, ROBE_INK, 2);
  ctx.fillStyle = tone(a, col);
  ctx.fill();
  ctx.strokeStyle = tone(a, col === ROBE[1] ? ROBE[2] : ROBE[3]);
  ctx.lineWidth = 0.45;
  ctx.stroke();
}
// The bell of a sleeve (kid units, in its own frame: its top at 0, 0 round the wrist, hanging down
// from it): a wide soft cone with a gold cuff band, its lining showing.
export function sleeveBell(ctx, a, mode, far) {
  const pts = [[-5.4, -2], [5.4, -2], [8.6, 7], [10.4, 13.6], [6, 16], [0, 15.2], [-6, 16.2], [-10, 13.6], [-8.6, 6]];
  smoothPath(ctx, pts);
  if (mode === 'line') return paint(ctx, a, 'line', null, ROBE_INK);
  ctx.fillStyle = tone(a, far ? ROBE[2] : ROBE[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 4, 2, 8, far ? ROBE[1] : ROBE[0], 0.6);
  // the lining in the mouth of the bell, and its gold cuff band
  ell(ctx, 0, 15.4, 9.4, 2.4);
  ctx.fillStyle = tone(a, ROBE[3]);
  ctx.fill();
  ctx.strokeStyle = tone(a, far ? GOLD[2] : GOLD[1]);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-10.6, 12.6);
  ctx.quadraticCurveTo(0, 15.6, 10.6, 12.4);
  ctx.stroke();
  ctx.restore();
}

// ---------- The censer (kid units, in its own frame: the chain's top ring at 0, 0, hanging down) ----------
export const CHAIN = 15;
export const CENSER = [0, CHAIN + 9];
export function censer(ctx, a, mode, lid, glowK) {
  // the chain: little round links
  if (mode === 'line') {
    ctx.strokeStyle = GOLD_INK;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, CHAIN);
    ctx.stroke();
  } else {
    for (let y = 1; y < CHAIN; y += 2.6) {
      ell(ctx, 0, y, 0.85, 1.25);
      ctx.strokeStyle = tone(a, y % 5.2 < 2.6 ? GOLD[1] : GOLD[2]);
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  }
  const [cx, cy] = CENSER;
  // the body: a round pot on a little foot, windows glowing with the wisp inside
  smoothPath(ctx, [[cx - 7.8, cy - 2], [cx - 7.4, cy + 3.4], [cx - 4.4, cy + 7], [cx - 2.4, cy + 7.6], [cx - 3, cy + 9.4], [cx + 3, cy + 9.4], [cx + 2.4, cy + 7.6], [cx + 4.4, cy + 7], [cx + 7.4, cy + 3.4], [cx + 7.8, cy - 2]]);
  if (mode === 'line') paint(ctx, a, 'line', null, GOLD_INK, 3.2);
  else {
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    glow(ctx, cx - 3, cy - 1, 6, GOLD[0], 0.9);
    glow(ctx, cx + 5, cy + 6, 6, GOLD[3], 0.6);
    // the windows, lit from inside
    for (const wx of [-3.4, 0.4, 4]) {
      smoothPath(ctx, [[cx + wx - 1.2, cy - 0.4], [cx + wx + 1.2, cy - 0.4], [cx + wx + 1.3, cy + 3.6], [cx + wx, cy + 4.6], [cx + wx - 1.3, cy + 3.6]]);
      ctx.fillStyle = tone(a, glowK > 0.5 ? WISP[1] : WISP[2]);
      ctx.fill();
    }
    ctx.restore();
  }
  // the lid: a dome hinged at its back edge, lifting open; the ring on top
  ctx.save();
  ctx.translate(cx - 7.4, cy - 2);
  ctx.rotate(-lid * 1.1);
  smoothPath(ctx, [[0, 0], [0.8, -3.4], [4, -6.4], [7.4, -7.2], [10.8, -6.4], [14, -3.4], [14.8, 0]]);
  if (mode === 'line') paint(ctx, a, 'line', null, GOLD_INK, 3.2);
  else {
    ctx.fillStyle = tone(a, GOLD[2]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    glow(ctx, 4.4, -5, 4.6, GOLD[0], 0.9);
    ctx.restore();
  }
  ell(ctx, 7.4, -8.6, 1.6, 1.6);
  if (mode === 'line') paint(ctx, a, 'line', null, GOLD_INK, 2);
  else {
    ctx.strokeStyle = tone(a, GOLD[1]);
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
  ctx.restore();
}
// The wisp (game px, its middle at x, y): a soft round teal flame, its tip curling, a white heart; no
// face (the player's effects rule). `r` its size, `lean` its flicker leaning the tip.
export function wispFlame(ctx, a, x, y, r, al, lean = 0, t = 0) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  // a soft halo
  glow(ctx, 0, 0, r * 2.6, WISP[2], 0.35);
  const tip = [lean * r * 0.9 + Math.sin(t * 7) * r * 0.12, -r * 2.0];
  ctx.beginPath();
  ctx.moveTo(tip[0], tip[1]);
  ctx.bezierCurveTo(r * 0.5 + lean * r * 0.3, -r * 1.3, r * 1.04, -r * 0.5, r, 0);
  ctx.arc(0, 0, r, 0, Math.PI);
  ctx.bezierCurveTo(-r * 1.04, -r * 0.5, -r * 0.4 + lean * r * 0.3, -r * 1.2, tip[0], tip[1]);
  ctx.closePath();
  ctx.lineWidth = Math.max(0.3, r * 0.32);
  ctx.strokeStyle = WISP_INK;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = tone(a, WISP[2]);
  ctx.fill();
  ell(ctx, 0, r * 0.12, r * 0.66, r * 0.62);
  ctx.fillStyle = tone(a, WISP[1]);
  ctx.fill();
  ell(ctx, -r * 0.1, r * 0.2, r * 0.36, r * 0.34);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
