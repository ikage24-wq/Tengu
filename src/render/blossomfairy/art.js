// The Blossom Fairy's look (2026-11-26, remade from scratch on the kid base, one of the Whispering
// Glade's tanukis in disguise): drawn live over her own copy of the kid base's bones (kidrig.js), outer
// outline only (every piece's outline in one pass, then every piece's fill), each line in the piece's
// own deeper colour, never near-black. Nothing of the player character's, and nothing of the Puddle
// Kid's: her hair, face, eyes and clothes are all her own.
//
// Who she is: a tiny prankster of a flower fairy. Lavender-pink hair up in two big round buns, each
// tied with a rosebud, two long soft tails falling from under them; a side-swept fringe; little leaf-
// shaped fairy ears (rounded, never sharp). A rose-petal bodice with a ring of green sepals at its
// neck, a bellflower skirt of five petals over a pale bell, puffed petal caps on her shoulders, petal
// slippers curling at the toe. Two pairs of butterfly-petal wings, rosy at the rim, pearly inside,
// a dusting of gold. Her wand is a twig with a pink blossom on its tip. And the tanuki in her: a fluffy
// striped tail with a pink bow tied on it, tucked under her skirt; and when she forgets herself, her
// wings turn back into the two leaves they really are.
//
// Her face (her own eye family, "blossom eyes"): tall soft ovals; a rose iris, deep at its top and warm
// gold at its bottom, a soft plum pupil, her signature glint a tiny five-petal blossom of light and a
// small round one; a fine upper lash line with two round flicks at its outer corner; a soft pink lower
// lid with one round lash at its corner; fine round brows; a little cat mouth at rest; a tiny star of
// light on her cheek.
//
// Units: the head in head units (eyes at y 9, the face's edges at about +-32, chin 32, the skull's top
// about -52), placed on the kid base at HX, HY, HS; everything else in kid units (a third of a game px).
import { E, T, F } from '../mobs/kit.js';
import { band, curve, blob } from '../mobs/kidbase.js';
import { bluntBangs, drawBangs, drawPiece, shineBand, foreheadShade } from '../mobs/softhair.js';

export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, u) => a + (b - a) * u;
export const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
export const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
export const boing = (t, k = 7, w = 15) => (t <= 0 ? 0 : 1 - Math.exp(-k * t) * Math.cos(w * t));
export const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const hexRgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const tone = (a, c, al = 1) => {
  const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
  const [r, g, b] = hexRgb(c).map((v) => Math.round(v + (255 - v) * k));
  return al >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};
export const rgba = (c, al) => {
  const [r, g, b] = hexRgb(c);
  return `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};
// Two colours mixed (u 0 the first, 1 the second).
export const mixHex = (c0, c1, u) => {
  const a = hexRgb(c0);
  const b = hexRgb(c1);
  return `#${a.map((v, i) => Math.round(lerp(v, b[i], clamp(u, 0, 1))).toString(16).padStart(2, '0')).join('')}`;
};

// ---------- Her colours ----------
export const SKIN = { lt: '#fff8f4', base: '#ffeae2', sh: '#f8cabd', deep: '#e8a8a0' };
export const HAIR = ['#fdeeff', '#e8bdf2', '#c992dc', '#9a6cc0'];
export const HAIR_INK = '#8a5aa8';
export const ROSE = ['#ffe2ee', '#ff9cc4', '#ec6f9f', '#c94a80'];
export const ROSE_INK = '#b84a7c';
export const BELL = ['#fffaf4', '#fbeef6', '#efd2e4'];
export const LEAF = ['#c8f0a8', '#86cc6c', '#5aa452', '#3e7e42'];
export const LEAF_INK = '#41804a';
export const WING = ['#fffafd', '#ffe6f2', '#f8bcd8', '#ec8cb8'];
export const WING_INK = '#d86aa0';
export const GOLD = ['#fff6c6', '#ffe08a', '#f2bc4a'];
export const TAIL = ['#f0d4b4', '#c89a72', '#8c603e', '#5a3a26'];
export const TAIL_INK = '#6a4430';
export const TWIG = ['#d8a878', '#a8764e', '#7a5236'];
export const LASH = '#6a2c4c';
export const IRIS = ['#7a2456', '#d8508e', '#a83a72', '#ffcf7a', '#ffe8c0'];

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
export function glow(ctx, x, y, r, col, al) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(0.1, r));
  g.addColorStop(0, rgba(col, al));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
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
const inked = (list, ink) => list.map((s) => ({ ...s, ink }));
const tbl = (pts, w0, w1, c) => band(curve(pts, 3), w0, w1, c, true);
const arc = (pts, w, c) => tbl(pts, w, w, c);

// ---------- Her head ----------
export const HS = 0.7;
export const HX = 81;
export const HY = 83 - 31 * HS;
export const hk = ([u, v]) => [HX + u * HS, HY + v * HS];

// A blossom of light: five round petals round a dot.
const blossomGlint = (x, y, r) => {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const q = -Math.PI / 2 + (i / 5) * TAU;
    out.push(F(E(x + Math.cos(q) * r * 0.62, y + Math.sin(q) * r * 0.62, r * 0.46, r * 0.46, '#ffffff')));
  }
  out.push(F(E(x, y, r * 0.36, r * 0.36, '#fff2d0')));
  return out;
};

// Her eye. o: -1 far, 1 near; kind: open | wide | half | dreamy | cross | worried | happy | squeeze |
// shut | sleep | dizzy; gaze [x, y].
function eye(x, y, o, kind, gaze) {
  const out = [];
  const P = (u, v) => [x + u * o, y + v];
  const rx = 8;
  const ry = 10.8;
  // the two round flicks at the lash line's outer corner (at lid height l)
  const flicks = (l) => [
    ...tbl([P(rx * 0.8, -ry * 0.5 + l), P(rx * 1.16, -ry * 0.66 + l * 0.8)], 1.8, 1.2, LASH), F(E(...P(rx * 1.22, -ry * 0.7 + l * 0.8), 1.15, 1.15, LASH)),
    ...tbl([P(rx * 0.92, -ry * 0.2 + l * 0.5), P(rx * 1.26, -ry * 0.26 + l * 0.4)], 1.5, 1, LASH), F(E(...P(rx * 1.32, -ry * 0.27 + l * 0.4), 0.95, 0.95, LASH)),
  ];
  if (kind === 'happy') {
    out.push(...arc([P(-rx * 0.95, 2.4), P(-rx * 0.3, -4.8), P(rx * 0.45, -5), P(rx * 1.0, 1.8)], 2.2, LASH), ...flicks(4.4));
    out.push(...arc([P(-rx * 0.4, 5.6), P(rx * 0.1, 6.6), P(rx * 0.6, 5.4)], 0.9, '#f2a2b4'));
    return out;
  }
  if (kind === 'squeeze') {
    out.push(...arc([P(-rx * 0.9, -4), P(-rx * 0.1, -0.6), P(rx * 0.95, 0.2)], 2.2, LASH));
    out.push(...arc([P(-rx * 0.85, 4.4), P(0, 2.6), P(rx * 0.95, 0.4)], 1.8, LASH));
    return out;
  }
  if (kind === 'shut' || kind === 'sleep') {
    const d = kind === 'sleep' ? 4.6 : 3.6;
    out.push(...arc([P(-rx * 0.95, 0), P(-rx * 0.2, d), P(rx * 0.55, d - 0.4), P(rx * 1.0, -0.2)], 2.2, LASH));
    out.push(...tbl([P(rx * 0.9, 0.2), P(rx * 1.22, -0.6)], 1.6, 1.1, LASH), F(E(...P(rx * 1.28, -0.7), 1, 1, LASH)));
    return out;
  }
  const wide = kind === 'wide' ? 1.07 : 1;
  // (awake, the whole iris always shows: the lid is a neat lash line on top, the brows and the gaze do
  // the acting, 2026-11-26)
  const lid = 0;
  // the white: a tall soft oval
  out.push(F(blob([P(-rx * wide, 0.6), P(-rx * 0.78 * wide, -ry * 0.84 * wide), P(0, -ry * wide), P(rx * 0.8 * wide, -ry * 0.86 * wide), P(rx * wide, 0), P(rx * 0.76 * wide, ry * 0.86 * wide), P(0, ry * wide), P(-rx * 0.76 * wide, ry * 0.86 * wide)], '#ffffff', 2)));
  if (kind === 'dizzy') {
    const pts = [];
    for (let i = 0; i <= 26; i++) {
      const u = i / 26;
      const an = u * TAU * 1.7 * o;
      pts.push(P(Math.cos(an) * u * rx * 0.7 * o, Math.sin(an) * u * ry * 0.66));
    }
    out.push(...arc(pts, 1.5, IRIS[1]));
    out.push(...tbl([P(-rx * 0.95, -3), P(-rx * 0.4, -ry * 0.98), P(rx * 0.45, -ry * 1.0), P(rx * 0.98, -3)], 1.8, 2.4, LASH), ...flicks(0));
    return out;
  }
  const [gx, gy] = gaze ?? [0.8, 0.4];
  const ix = x + gx + 0.3 * o;
  const iy = y + gy + 0.6;
  const ir = kind === 'wide' ? 0.84 : 1;
  const iw = rx * 0.8 * ir;
  const ih = ry * 0.82 * ir;
  // the iris: a deep rose rim, rose, deeper across its top, warm gold glowing up from its bottom
  out.push(F(E(ix, iy, iw, ih, IRIS[0])), F(E(ix, iy + 0.4, iw * 0.86, ih * 0.88, IRIS[1])));
  out.push(F(blob([[ix - iw * 0.82, iy - ih * 0.2], [ix - iw * 0.5, iy - ih * 0.78], [ix + iw * 0.5, iy - ih * 0.78], [ix + iw * 0.82, iy - ih * 0.2], [ix, iy - ih * 0.36]], IRIS[2], 2)));
  out.push(F(E(ix, iy + ih * 0.46, iw * 0.66, ih * 0.36, IRIS[3])), F(E(ix, iy + ih * 0.56, iw * 0.4, ih * 0.2, IRIS[4])));
  const pr = kind === 'wide' ? 0.62 : 1;
  out.push(F(E(ix, iy + 0.2, iw * 0.38 * pr, ih * 0.42 * pr, '#4a1636')));
  // her glints: a little blossom of light up on the far side, a round one low on the near side
  out.push(...blossomGlint(ix - 2.4 * o, iy - 3.6, 3.4 * ir));
  out.push(F(E(ix + 2.6 * o, iy + 3.6, 1.2, 1.2, '#ffffff')));
  if (lid > 0) {
    const inner = kind === 'cross' ? lid + 2.6 : kind === 'worried' ? lid - 1.8 : lid;
    const outer = kind === 'cross' ? lid - 2.2 : kind === 'worried' ? lid + 2.4 : lid;
    out.push(F(blob([P(-rx - 2.4, -ry - 3.6), P(rx + 2.4, -ry - 3.6), P(rx + 2.4, -ry + outer), P(0, -ry + (inner + outer) / 2 + 0.4), P(-rx - 2.4, -ry + inner)], SKIN.base, 1)));
    out.push(...tbl([P(-rx * 0.98, -ry + inner + 0.6), P(0, -ry + (inner + outer) / 2 + 0.8), P(rx * 0.98, -ry + outer + 0.6)], 2, 2.6, LASH), ...flicks(outer));
  } else {
    out.push(...tbl([P(-rx * 0.96 * wide, -2.8), P(-rx * 0.5 * wide, -ry * 0.98 * wide), P(rx * 0.4 * wide, -ry * 1.02 * wide), P(rx * 0.98 * wide, -3)], 1.7, 2.5, LASH), ...flicks(0));
  }
  // the lower lid: a soft pink line, one round lash at its outer corner
  out.push(...arc([P(-rx * 0.4, ry * 0.92), P(rx * 0.3, ry * 0.98), P(rx * 0.8, ry * 0.7)], 1, '#e78aa4'));
  out.push(...tbl([P(rx * 0.8, ry * 0.7), P(rx * 1.08, ry * 0.86)], 1.2, 0.9, '#c9607e'), F(E(...P(rx * 1.12, ry * 0.88), 0.75, 0.75, '#c9607e')));
  return out;
}

const EYES = {
  calm: ['open', [0.8, 0.4]], happy: ['happy'], giggle: ['happy'], dreamy: ['dreamy', [0.6, 2]], up: ['open', [0.6, -3.4]], down: ['open', [1, 3.2]],
  surprised: ['wide', [0.4, -0.4]], panic: ['wide', [2.4, 0.6]], panicL: ['wide', [-2.2, 0.6]], fierce: ['cross', [2.2, 0.6]], focus: ['half', [2.4, -1.4]], shout: ['happy'],
  hurt: ['squeeze'], dizzy: ['dizzy'], sleep: ['sleep'], sniff: ['shut'], yawn: ['squeeze'], blow: ['half', [2.6, 0.4]], smug: ['half', [1.2, 0.2]], sad: ['worried', [0.4, 2.4]],
  talkA: ['open', [1.2, 0.4]], talkE: ['open', [1.2, 0.4]], talkO: ['open', [1.2, 0.4]], worried: ['worried', [1.4, 1]], blink: ['shut'], bleh: ['happy'], shh: ['half', [1.6, 0.2]],
};
const BROWS = {
  fierce: [4.4, -1.6], focus: [2.6, -0.4], shout: [-2.4, -1], hurt: [-2.8, 2], sad: [-3, 2.4], worried: [-3.2, 2.2], panic: [-3.4, 1.6], panicL: [-3.4, 1.6], surprised: [-4.2, -3.4],
  up: [-2.2, -0.6], smug: [-1.6, 1.4], happy: [-1.4, -1], giggle: [-1.4, -1], dreamy: [-1, 0.6], sleep: [0.6, 0.6], sniff: [-1, 0.4], yawn: [-2, 1], blow: [1.4, 0.2], dizzy: [-2, 1.6], bleh: [-1.4, -1], shh: [-0.6, 1.2],
};
function face(mood) {
  const out = [];
  // a soft heart of a face: full cheeks, a small rounded chin
  out.push(blob([[-31, -14], [-33, 6], [-28, 20], [-15, 28.6], [2, 32], [19, 28.6], [29, 20], [33, 6], [31, -14], [0, -30]], SKIN.base, 4));
  out.push(F(blob([[-31, -4], [-30.4, 12], [-25, 21], [-28, 8]], SKIN.sh, 2)));
  const hot = mood === 'shout' || mood === 'fierce' || mood === 'panic' || mood === 'panicL' || mood === 'hurt' || mood === 'giggle' || mood === 'blow';
  // the wink: her near eye shut in a smile, the far one open
  const wink = mood === 'wink';
  for (const cx of [-20, 23]) {
    out.push(F(E(cx, 18.6, hot ? 8.4 : 7.2, hot ? 5.4 : 4.6, hot ? '#ffa6c2' : '#ffc4d6')));
  }
  // her cheek's little star of light
  const sx = 27;
  const sy = 15;
  out.push(F(T([[sx, sy - 2.2], [sx + 0.5, sy - 0.5], [sx + 2.2, sy], [sx + 0.5, sy + 0.5], [sx, sy + 2.2], [sx - 0.5, sy + 0.5], [sx - 2.2, sy], [sx - 0.5, sy - 0.5]], '#ffffff')));
  if (wink) out.push(...eye(-13, 9, -1, 'open', [1.4, 0.4]), ...eye(15, 9, 1, 'happy'));
  else {
    const [kind, gaze] = EYES[mood] ?? EYES.calm;
    out.push(...eye(-13, 9, -1, kind, gaze), ...eye(15, 9, 1, kind, gaze));
  }
  // fine round brows
  const br = BROWS[wink ? 'smug' : mood] ?? [0, 0];
  out.push(...arc([[-17.8, -3.6 + br[0] * 0.7], [-13, -5.2 + ((br[0] + br[1]) / 2) * 0.7], [-8.6, -4.4 + br[1] * 0.7]], 2, HAIR[3]));
  out.push(...arc([[10.6, -4.4 + br[1] * 0.7], [15, -5.2 + ((br[0] + br[1]) / 2) * 0.7], [19.8, -3.6 + br[0] * 0.7]], 2, HAIR[3]));
  out.push(F(E(3.2, 17, 1.4, 1, SKIN.sh)), F(E(2.8, 16.4, 0.6, 0.45, '#ffffff')));
  // the mouth (centre line x 3)
  const LIP = '#b04870';
  const M = (pts) => blob(pts, '#b03e6a', 2);
  const tongue = '#ff94b2';
  switch (mood) {
    case 'happy':
    case 'giggle':
    case 'shout': {
      const big = mood === 'shout' ? 1.25 : 1;
      out.push(M([[-3.6 * big, 22], [3, 23], [9.6 * big, 22], [8.2 * big, 26.6 * big], [3, 28.6 * big], [-2.2 * big, 26.6 * big]]), F(E(3, 26.4 * (big > 1 ? 1.05 : 1), 3.2 * big, 1.6 * big, tongue)));
      break;
    }
    case 'bleh':
      // the fairy's teasing "bleh": tongue out
      out.push(M([[-1, 22.4], [3, 23], [7, 22.4], [6, 24.4], [3, 25], [0, 24.4]]), blob([[0.8, 23.6], [5.4, 23.6], [5.2, 28], [3, 29.4], [0.8, 28]], tongue, 2), F(E(2.4, 26.2, 0.7, 1.2, '#ffc6d4')));
      break;
    case 'surprised':
    case 'up':
    case 'talkO':
      out.push(M([[0.8, 22.4], [3, 21.8], [5.2, 22.4], [5.2, 25], [3, 26.2], [0.8, 25]]), F(E(3, 24.6, 1.3, 0.8, tongue)));
      break;
    case 'talkA':
      out.push(M([[-1, 22.4], [3, 22], [7, 22.4], [6, 26.2], [3, 27.2], [0, 26.2]]), F(E(3, 25.6, 2, 0.9, tongue)));
      break;
    case 'talkE':
      out.push(M([[-2, 23], [3, 23.4], [8, 23], [7, 25.2], [3, 26], [-1, 25.2]]));
      break;
    case 'blow':
    case 'sniff': {
      // puffed cheeks and a little round "o" (blowing pollen off her palm; sniffing a flower)
      if (mood === 'blow') for (const cx of [-24, 27]) out.push(F(E(cx, 21, 6, 5, '#ffd2de')));
      out.push(M([[1.6, 23.2], [3, 22.6], [4.4, 23.2], [4.4, 24.8], [3, 25.4], [1.6, 24.8]]));
      break;
    }
    case 'yawn':
      out.push(M([[-0.4, 21.4], [3, 20.6], [6.4, 21.4], [6.6, 27], [3, 29], [-0.6, 27]]), F(E(3, 27, 2.4, 1.2, tongue)));
      break;
    case 'panic':
    case 'panicL':
    case 'worried':
    case 'sad':
    case 'hurt':
      out.push(...tbl([[-1.8, 25.2], [0.4, 23.8], [2.8, 25], [5.2, 23.8], [7.6, 25]], 1.5, 1.5, LIP));
      break;
    case 'fierce':
    case 'focus':
      // a determined little smirk
      out.push(...tbl([[-1.6, 24.6], [2.6, 25.2], [6.6, 24], [8.6, 22.4]], 1.6, 1.8, LIP));
      break;
    case 'smug':
    case 'wink':
    case 'shh':
      out.push(...tbl([[-1.4, 23.6], [1.2, 25], [3, 24], [4.8, 25], [7.4, 23.2]], 1.5, 1.5, LIP), F(E(3, 26, 1.8, 0.6, '#ffc6d0')));
      break;
    case 'sleep':
    case 'dreamy':
      out.push(...arc([[0.4, 24], [3, 25.2], [5.6, 24]], 1.4, LIP));
      break;
    case 'dizzy':
      out.push(...tbl([[-1.6, 24.6], [0.8, 23.2], [3, 24.6], [5.2, 23.2], [7.6, 24.6]], 1.4, 1.4, LIP));
      break;
    default:
      // at rest: a little cat mouth
      out.push(...tbl([[-1.6, 23.2], [0.6, 24.8], [3, 23.6], [5.4, 24.8], [7.6, 23.2]], 1.4, 1.4, LIP), F(E(3, 25.8, 1.6, 0.5, '#ffc6d0')));
  }
  return out;
}

// ---------- Her hair (soft hair, render/mobs/softhair.js: one light, an even blunt cut) ----------
// Lavender-pink: a soft round mass to her nape, two buns pinned high on the back of her head (wound,
// a rose ribbon round each, a blossom hairpin through it) with a long tail falling from under each
// behind her shoulders; side locks to her chin, turning softly in, outside her eyes; bangs cut evenly
// a little above her brows in seven slim sections, a deeper U than the Puddle Kid's.
export const HAIR_H = { C: HAIR, ink: HAIR_INK, tone, lw: 6 / HS, top: -64, bottom: 40 };
const BACK = [[-36, -30], [-40.6, -8], [-40, 10], [-36, 22], [-27, 26], [-12, 22], [0, 21], [12, 22], [27, 26], [36, 22], [40, 10], [40.6, -8], [36, -30], [22, -50], [0, -57], [-22, -50]];
const CAP = [[-37, -12], [-38, -30], [-30.6, -46], [-16.6, -55], [0, -58], [16.6, -55], [30.6, -46], [38, -30], [37, -12], [32.6, -20], [21, -31], [0, -35], [-21, -31], [-32.6, -20]];
export const BANGS = bluntBangs({ x0: -32, x1: 32, n: 7, cutMid: -9.4, rise: 6.4, seed: 23, top: -44, occl: -36.4, split: 4.6 });
const FACES = {};
export function faceShapes(mood) {
  return (FACES[mood] ??= inked(face(mood), SKIN.deep));
}
export function hairBack(ctx, a, mode) {
  drawPiece(ctx, a, mode, BACK, HAIR_H, (c) => {
    glow(c, 0, 24, 30, HAIR[3], 0.55);
    for (const o of [-1, 1]) glow(c, 38 * o, 16, 9, HAIR[3], 0.4);
  });
}
// Over her face: the bangs' soft shadow on her forehead, the bangs, the cap over their roots, the one
// shine.
export function hairFront(ctx, a, mode) {
  if (mode === 'fill') foreheadShade(ctx, BANGS, SKIN.sh, 0.7);
  drawBangs(ctx, a, mode, BANGS, HAIR_H);
  drawPiece(ctx, a, mode, CAP, HAIR_H, (c) => glow(c, -12, -50, 16, HAIR[0], 0.55));
  if (mode === 'fill') shineBand(ctx, a, HAIR_H, [CAP], -46, 2.4, -28, 28);
}
// A side lock framing her cheek (head units, from `root`, its top tucked under the cap, its end
// turning softly in toward her chin), lit by the same light.
export function sideLock(ctx, a, mode, root, len, w, o, swing) {
  ctx.save();
  ctx.translate(root[0], root[1]);
  ctx.rotate(swing);
  const pts = [[-w * 0.45 * o, -12], [w * 0.5 * o, -12], [w * 0.6 * o, len * 0.45], [w * 0.3 * o, len * 0.86], [-w * 0.3 * o, len], [-w * 0.62 * o, len * 0.9], [-w * 0.5 * o, len * 0.5]];
  const H = { ...HAIR_H, top: HAIR_H.top - root[1], bottom: HAIR_H.bottom - root[1] };
  drawPiece(ctx, a, mode, pts, H, (c) => {
    const g = c.createLinearGradient(0, -12, 0, 2);
    g.addColorStop(0, 'rgba(122,80,160,0.4)');
    g.addColorStop(1, 'rgba(122,80,160,0)');
    c.fillStyle = g;
    c.fillRect(-w, -12, w * 2, 14);
    glow(c, -w * 0.5 * o, len * 0.6, w * 0.7, HAIR[3], 0.3);
  });
  ctx.restore();
}

// Her fairy ear (head units, at the side of her face, o -1 far, 1 near): a soft leaf shape, its tip
// rounded, a pink inside.
export function fairyEar(ctx, a, mode, o, wig) {
  ctx.save();
  ctx.translate(31 * o, 6);
  ctx.rotate(o * (-0.5 + wig));
  smoothPath(ctx, [[0, 6 * 1], [5 * o, 3], [13 * o, -4], [16 * o, -9], [10 * o, -6], [2 * o, -6]]);
  if (mode === 'line') paint(ctx, a, 'line', null, SKIN.deep, 6 / HS);
  else {
    ctx.fillStyle = tone(a, SKIN.base);
    ctx.fill();
    smoothPath(ctx, [[2 * o, 2.6], [6 * o, 0.8], [11 * o, -4.4], [7 * o, -3.6], [2.6 * o, -2.6]]);
    ctx.fillStyle = tone(a, '#ffc6d2');
    ctx.fill();
  }
  ctx.restore();
}
// A bun pinned high on the back of her head (head units, its middle at c): wound round (soft coil
// lines), lit by the same light, a rose ribbon wrapped round its base with its bow at the outer side,
// and a little blossom hairpin pushed through it.
export function bun(ctx, a, mode, c, o) {
  const pts = [];
  for (let i = 0; i < 14; i++) {
    const q = (i / 14) * TAU;
    pts.push([c[0] + Math.cos(q) * 11.4, c[1] + Math.sin(q) * 10.4]);
  }
  drawPiece(ctx, a, mode, pts, HAIR_H, (cx) => {
    cx.strokeStyle = tone(a, HAIR[2]);
    cx.lineWidth = 1.3;
    cx.lineCap = 'round';
    for (const [r, a0, a1] of [[7.6, -2.6, 0.6], [4.4, -1.2, 2.2]]) {
      cx.beginPath();
      cx.arc(c[0] - 0.6 * o, c[1] + 0.6, r, a0, a1);
      cx.stroke();
    }
    glow(cx, c[0] - 4 * o, c[1] - 4.6, 6, '#ffffff', 0.55);
    glow(cx, c[0] + 4 * o, c[1] + 6, 8, HAIR[3], 0.45);
  });
  // the ribbon round its base: a rose band, the bow's two loops at the outer side
  ctx.beginPath();
  ctx.ellipse(c[0], c[1] + 8.4, 9.4, 3, o * 0.12, 0, TAU);
  if (mode === 'line') paint(ctx, a, 'line', null, ROSE_INK, 4 / HS);
  else {
    ctx.fillStyle = tone(a, ROSE[1]);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(c[0] - 2 * o, c[1] + 7.6, 5, 1, o * 0.12, 0, TAU);
    ctx.fillStyle = tone(a, ROSE[0]);
    ctx.fill();
  }
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(c[0] + 10.6 * o + s * 1.6, c[1] + 7.2 + s * 1.6, 3.6, 2.2, -o * 0.5 + s * 0.6, 0, TAU);
    if (mode === 'line') paint(ctx, a, 'line', null, ROSE_INK, 4 / HS);
    else {
      ctx.fillStyle = tone(a, ROSE[1]);
      ctx.fill();
    }
  }
  // the hairpin: a little stick pushed through the bun, a blossom on its end
  const p0 = [c[0] - 9 * o, c[1] + 4];
  const p1 = [c[0] + 4 * o, c[1] - 11];
  ctx.beginPath();
  ctx.moveTo(p0[0], p0[1]);
  ctx.lineTo(p1[0], p1[1]);
  ctx.strokeStyle = mode === 'line' ? TWIG[2] : tone(a, '#fff2e0');
  ctx.lineWidth = mode === 'line' ? 4.4 / HS : 1.6;
  ctx.lineCap = 'round';
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const q = (i / 5) * TAU;
    ell(ctx, p1[0] + Math.cos(q) * 2.2, p1[1] + Math.sin(q) * 2.2, 1.9, 1.9);
    if (mode === 'line') paint(ctx, a, 'line', null, ROSE_INK, 3 / HS);
    else {
      ctx.fillStyle = tone(a, ROSE[i % 2 ? 0 : 1]);
      ctx.fill();
    }
  }
  if (mode === 'fill') {
    ell(ctx, p1[0], p1[1], 1.2, 1.2);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
  }
}
// A long soft tail of hair falling from under a bun, down behind her back and shoulders (head units:
// its root at 0, 0), in two pieces, the lower turned by `bend` on its own spring; one smooth taper to
// a soft round end curling gently out. Lit by the same light (`root` places the light).
export function hairTail(ctx, a, mode, o, bend, root) {
  const H = { ...HAIR_H, top: HAIR_H.top - root[1], bottom: HAIR_H.bottom + 40 - root[1] };
  const up = [[-7.6, -6], [7.6, -6], [9.4, 24], [8.6, 54], [-7.6, 54], [-8.6, 24]];
  drawPiece(ctx, a, mode, up, H, (c) => glow(c, 4 * o, 30, 10, HAIR[3], 0.4));
  ctx.save();
  ctx.translate(0, 50);
  ctx.rotate(bend);
  const lo = [[-7.6, -6], [7.8, -6], [8.4, 18], [6, 38], [2.6 * o + 1.4, 48], [-2.4, 44], [-6.8, 20]];
  const H2 = { ...H, top: H.top - 50, bottom: H.bottom - 50 };
  drawPiece(ctx, a, mode, lo, H2, (c) => glow(c, -3 * o, 34, 8, HAIR[0], 0.35));
  ctx.restore();
}

// ---------- Her wings (kid units, from their root between her shoulder blades) ----------
// A wing as a closed outline: the butterfly-petal (a rounded teardrop) or, when her disguise slips,
// the leaf it really is (the same points, eased from one to the other).
export const WING_ROOT = [79, 93];
function wingPts(len, wd, leafy) {
  const pts = [];
  const N = 16;
  for (let i = 0; i < N; i++) {
    const q = (i / N) * TAU;
    // a petal: round and fat toward its tip; a leaf: slimmer, pointed (round-tipped) at the end
    const along = (1 - Math.cos(q)) / 2;
    const side = Math.sin(q);
    const petalW = wd * Math.sin(Math.PI * Math.pow(along, 0.7)) * (0.6 + 0.4 * along);
    const leafW = wd * 0.62 * Math.sin(Math.PI * along) * (1 - along * 0.15);
    const w = lerp(petalW, leafW, leafy);
    pts.push([along * len, side * w * 0.5]);
  }
  return pts;
}
// One wing: `ang` its direction (radians, 0 out to the right), `len`/`wd` its size, `far` dimmer,
// `leafy` 0..1 a petal to a leaf.
export function wing(ctx, a, mode, ang, len, wd, far, leafy) {
  ctx.save();
  ctx.translate(WING_ROOT[0], WING_ROOT[1]);
  ctx.rotate(ang);
  const pts = wingPts(len, wd, leafy);
  smoothPath(ctx, pts);
  if (mode === 'line') {
    paint(ctx, a, 'line', null, mixHex(WING_INK, LEAF_INK, leafy), 4.4);
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, mixHex(far ? WING[2] : WING[3], LEAF[2], leafy));
  ctx.fill();
  ctx.save();
  ctx.clip();
  // the pearly inside, a bright heart by the root, rosy at the rim
  smoothPath(ctx, pts.map(([x, y]) => [x * 0.9 + len * 0.04, y * 0.78]));
  ctx.fillStyle = tone(a, mixHex(far ? WING[1] : WING[0], LEAF[1], leafy));
  ctx.fill();
  glow(ctx, len * 0.3, 0, wd * 0.5, mixHex('#ffffff', LEAF[0], leafy), 0.9);
  glow(ctx, len * 0.85, 0, wd * 0.4, mixHex(WING[3], LEAF[2], leafy), 0.55);
  // veins (a leaf's midrib when it turns)
  ctx.strokeStyle = tone(a, mixHex(WING[2], LEAF[3], leafy));
  ctx.lineWidth = 0.9;
  for (const v of leafy > 0.5 ? [0] : [-0.24, 0, 0.24]) {
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.quadraticCurveTo(len * 0.5, v * wd * 0.4, len * 0.86, v * wd * 0.62);
    ctx.stroke();
  }
  // a dusting of gold
  if (leafy < 0.6) {
    ctx.fillStyle = tone(a, GOLD[1], 1 - leafy);
    for (const [u, v] of [[0.6, 0.2], [0.78, -0.16], [0.46, -0.24]]) {
      ell(ctx, len * u, wd * v, 1.1, 1.1);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.restore();
}

// ---------- Her dress (kid units) ----------
// The bodice: a rose-petal top, three scalloped petals at its sweetheart neck, a shade down its far
// side.
export function bodice(ctx, a, mode) {
  smoothPath(ctx, [[66.4, 92], [69, 87.4], [74, 86.4], [80, 88], [86, 86.4], [91.6, 87.4], [94.4, 92], [94, 99], [91, 103.6], [69.6, 103.6], [66.4, 99]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, ROSE_INK);
  ctx.fillStyle = tone(a, ROSE[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 88, 92, 8, ROSE[0], 0.85);
  glow(ctx, 68, 100, 8, ROSE[2], 0.7);
  ctx.strokeStyle = tone(a, ROSE[2]);
  ctx.lineWidth = 1.2;
  for (const [x0, x1] of [[74, 72], [86, 88]]) {
    ctx.beginPath();
    ctx.moveTo(x0, 90);
    ctx.quadraticCurveTo((x0 + x1) / 2 + 1, 96, x1, 103);
    ctx.stroke();
  }
  ctx.restore();
}
// A green sepal at her neckline (k F / N): a rounded leaf pointing down and out.
export function sepal(ctx, a, mode, k) {
  const o = k === 'F' ? -1 : 1;
  const x = k === 'F' ? 75 : 86;
  smoothPath(ctx, [[x - 3 * o, 87], [x + 3 * o, 86.6], [x + 4.6 * o, 90], [x + 2.4 * o, 94], [x, 92]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, LEAF_INK, 3);
  ctx.fillStyle = tone(a, k === 'F' ? LEAF[2] : LEAF[1]);
  ctx.fill();
}
// The bell under her skirt's petals (pale, on her waist).
export function bellShape(ctx, a, mode) {
  smoothPath(ctx, [[68, 100], [92, 100], [96, 106], [98.4, 113.6], [80, 115.6], [61.6, 113.6], [64, 106]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, ROSE_INK);
  ctx.fillStyle = tone(a, BELL[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 66, 112, 8, BELL[2], 0.8);
  ctx.restore();
}
// A skirt petal (from its root at r on the waist, pointing down at angle `ang` from straight down,
// `len` long): round with a soft notch at its tip, a vein, a light edge. `back` the ones behind.
export function skirtPetal(ctx, a, mode, r, ang, len, wd, shade, back) {
  ctx.save();
  ctx.translate(r[0], r[1]);
  ctx.rotate(ang);
  const pts = [[0, -1], [-wd * 0.42, len * 0.2], [-wd * 0.56, len * 0.6], [-wd * 0.4, len * 0.92], [-wd * 0.12, len * 1.02], [0, len * 0.9], [wd * 0.12, len * 1.02], [wd * 0.4, len * 0.92], [wd * 0.56, len * 0.6], [wd * 0.42, len * 0.2]];
  smoothPath(ctx, pts);
  if (mode === 'line') {
    paint(ctx, a, 'line', null, ROSE_INK);
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, back ? ROSE[3] : [ROSE[1], ROSE[2], ROSE[1], ROSE[0]][shade % 4]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, -wd * 0.2, len * 0.3, wd * 0.6, back ? ROSE[2] : ROSE[0], 0.6);
  glow(ctx, wd * 0.3, len * 0.85, wd * 0.5, back ? ROSE[3] : ROSE[2], 0.5);
  ctx.restore();
  if (!back) {
    ctx.strokeStyle = tone(a, ROSE[2]);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.quadraticCurveTo(-0.6, len * 0.5, 0, len * 0.78);
    ctx.stroke();
  }
  ctx.restore();
}
// A puffed petal cap on her shoulder, along an upper-arm bone (p0 shoulder to p1 elbow, game px).
export function puff(ctx, a, mode, p0, p1, far) {
  const mx = p0[0] + (p1[0] - p0[0]) * 0.32;
  const my = p0[1] + (p1[1] - p0[1]) * 0.32;
  const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
  ctx.beginPath();
  ctx.ellipse(mx, my, 2.3, 2.1, an, 0, TAU);
  if (mode === 'line') return paint(ctx, a, 'line', null, ROSE_INK, 2);
  ctx.fillStyle = tone(a, far ? ROSE[2] : ROSE[1]);
  ctx.fill();
  ctx.strokeStyle = tone(a, far ? ROSE[3] : ROSE[2]);
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(mx - Math.cos(an) * 2.1, my - Math.sin(an) * 2.1);
  ctx.lineTo(mx + Math.cos(an) * 2.1, my + Math.sin(an) * 2.1);
  ctx.stroke();
}
// A petal slipper (in the foot's frame): a rose petal wrapped round her foot, its toe curling up.
export function slipper(ctx, a, mode, k) {
  const x = k === 'F' ? 73 : 87;
  smoothPath(ctx, [[x - 4.6, 135.6], [x + 3.6, 135.6], [x + 8.6, 139.6], [x + 12, 137.6], [x + 12.6, 140.4], [x + 9.6, 145], [x - 4.6, 145.4], [x - 5.6, 140.6]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, ROSE_INK);
  ctx.fillStyle = tone(a, k === 'F' ? ROSE[2] : ROSE[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, x + 4, 138, 4, k === 'F' ? ROSE[1] : ROSE[0], 0.8);
  ctx.restore();
}

// ---------- Her tail (the tanuki in her: under her skirt, a pink bow tied on it) ----------
export function tailShape(ctx, a, mode) {
  const pts = [[79, 104], [74, 103.6], [66, 106], [58, 111], [53, 118], [53.4, 124.6], [58.4, 125.6], [64, 121], [70, 114.6], [77, 110], [80, 107]];
  smoothPath(ctx, pts);
  if (mode === 'line') return paint(ctx, a, 'line', null, TAIL_INK);
  ctx.fillStyle = tone(a, TAIL[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = tone(a, TAIL[2]);
  ctx.save();
  ctx.translate(60.6, 116);
  ctx.rotate(-0.8);
  ctx.fillRect(-12, -1.9, 24, 3.8);
  ctx.restore();
  ell(ctx, 54.6, 122.4, 5.4, 6);
  ctx.fillStyle = tone(a, TAIL[3]);
  ctx.fill();
  glow(ctx, 68, 106, 7, TAIL[0], 0.85);
  ctx.restore();
  // the bow
  for (const s of [-1, 1]) {
    ell(ctx, 69 + s * 2.6, 110 - s * 1.6, 2.6, 1.6, -0.7 + s * 0.4);
    ctx.fillStyle = tone(a, ROSE[1]);
    ctx.fill();
  }
  ell(ctx, 69, 110, 1.2, 1.2);
  ctx.fillStyle = tone(a, ROSE[2]);
  ctx.fill();
}

// ---------- Her wand (kid units: the grip at GRIP, a twig up to its blossom) ----------
export const GRIP = [95, 113];
export const BLOOM = [95, 80];
export function wand(ctx, a, mode, open, glowAmt) {
  ctx.beginPath();
  ctx.moveTo(GRIP[0], GRIP[1] + 5);
  ctx.quadraticCurveTo(GRIP[0] + 1.6, 98, BLOOM[0], BLOOM[1] + 3);
  ctx.moveTo(GRIP[0] + 0.6, 96);
  ctx.quadraticCurveTo(GRIP[0] + 4, 93, GRIP[0] + 5, 90);
  ctx.strokeStyle = mode === 'line' ? TWIG[2] : tone(a, TWIG[1]);
  ctx.lineWidth = mode === 'line' ? 6 : 2.4;
  ctx.lineCap = 'round';
  ctx.stroke();
  // a tiny leaf on the twig
  ctx.save();
  ctx.translate(GRIP[0] + 5, 90);
  ctx.rotate(0.5);
  smoothPath(ctx, [[0, 0], [-2, -2.4], [0, -5.4], [2, -2.4]]);
  if (mode === 'line') paint(ctx, a, 'line', null, LEAF_INK, 3);
  else {
    ctx.fillStyle = tone(a, LEAF[1]);
    ctx.fill();
  }
  ctx.restore();
  // the blossom: five round petals, each with a soft notch, a golden heart
  ctx.save();
  ctx.translate(BLOOM[0], BLOOM[1]);
  const R = 3.6 + open * 1.4;
  for (let i = 0; i < 5; i++) {
    const q = -Math.PI / 2 + (i / 5) * TAU;
    ctx.save();
    ctx.rotate(q + Math.PI / 2);
    smoothPath(ctx, [[0, 0], [-3.2, -R * 0.5], [-2.6, -R * 1.3], [-0.8, -R * 1.55], [0, -R * 1.36], [0.8, -R * 1.55], [2.6, -R * 1.3], [3.2, -R * 0.5]]);
    if (mode === 'line') paint(ctx, a, 'line', null, ROSE_INK, 3);
    else {
      ctx.fillStyle = tone(a, i % 2 ? ROSE[0] : ROSE[1]);
      ctx.fill();
    }
    ctx.restore();
  }
  if (mode === 'fill') {
    if (glowAmt > 0.02) glow(ctx, 0, 0, 9 + glowAmt * 6, GOLD[0], 0.7 * glowAmt);
    ell(ctx, 0, 0, 2.2, 2.2);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
    ell(ctx, -0.6, -0.6, 0.9, 0.9);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
}
