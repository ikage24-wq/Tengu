// The Gargoyle Kid's look (2026-11-26, rebuilt from scratch to the new standard, keeping her idea): drawn
// live over her own copy of the kid base's bones (kidrig.js), outer outline only (every piece's outline
// in one pass, then every piece's fill), each line in the piece's own deeper colour, never near-black.
// Nothing of the player character's: her hair, face, eyes and clothes are all her own.
//
// Who she is: an impish little gargoyle who lives in the Twilight Ruins' gutters, up on the Temple Roof.
// Moss has grown on her the way it grows on the old stones: a moss-green bob cut blunt like a statue's,
// a mossy hem on her plum smock. Pale stone-lilac skin; two little stone horns curling back out of her
// hair; heavy stone bat wings with soft round scallops; a stone tail with a round spade on its end;
// stone boots; a carved stone collar with a rosette. Gargoyles are the temple's rain spouts: she can
// spit a stream of rainwater. And she turns to stone for fun.
//
// Her face (her own eye family, "arch eyes"): eyes shaped like the temple's arched windows, round on
// top and flatter below; warm amber irises glowing gold at the bottom, a soft upright pupil, a big
// round glint and her signature, a little four-point sparkle star; a heavy lash line with one round
// flick turned up at its outer corner (the imp in her); a short lilac lower lid; moss-dark round brows;
// a cat-curl mouth with a tiny fang. Awake, her eyes are always wide open and clear of hair and lids.
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
// (turned to stone, `a.gk.stone` 0..1, every colour eases toward a pale lilac grey of its own
// lightness: her whole self goes to carved stone and back, never a snap)
export const tone = (a, c, al = 1) => {
  const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
  const st = clamp(a.gk?.stone ?? 0, 0, 1);
  let rgb = hexRgb(c);
  if (st > 0.001) {
    const L = rgb[0] * 0.3 + rgb[1] * 0.55 + rgb[2] * 0.15;
    const g = [L * 0.86 + 26, L * 0.85 + 24, L * 0.84 + 40];
    rgb = rgb.map((v, i) => v + (Math.min(255, g[i]) - v) * st);
  }
  const [r, g, b] = rgb.map((v) => Math.round(v + (255 - v) * k));
  return al >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};
export const rgba = (c, al) => {
  const [r, g, b] = hexRgb(c);
  return `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};

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


// ---------- Her colours (each with its own soft ink) ----------
export const SKIN = { lt: '#fbf8ff', base: '#f1eaf6', sh: '#dacde8', deep: '#b8a6cc', ink: '#9c88b8', guides: false };
export const HAIR = ['#f0f7e4', '#bcd9a8', '#8fb982', '#66935f'];
export const HAIR_INK = '#4f7b51';
export const STONE = ['#eeecf8', '#c4c2dc', '#9c9ac0', '#76749c'];
export const STONE_INK = '#62608c';
export const TUNIC = ['#cdb2ee', '#a07ed2', '#7c5cb2', '#5c4090'];
export const TUNIC_INK = '#523886';
export const MOSS = ['#e2f6c2', '#a8d886', '#78b464', '#56904e'];
export const WATER = ['#ffffff', '#dcf0ff', '#a8d2f6', '#78acdc'];
export const WATER_INK = '#5c88c4';
const LASH = '#3a2a3e';
const IRIS = ['#6a3414', '#c06a1e', '#f2a83a', '#ffd874', '#fff2c4'];

// ---------- Her head (head units) on the kid base ----------
export const HS = 0.72;
export const HX = 81;
export const HY = 83 - 31 * HS;
export const hk = ([u, v]) => [HX + u * HS, HY + v * HS];
const EY = 12.8;

// Her eye. o: -1 the far eye, 1 the near; kind: open | wide | happy | wink | squeeze | shut | sleep |
// dizzy | stone; gaze [x, y]; tilt: the lash line's slant (+ down to the middle: cross; - up: worried),
// always above the iris.
function eye(x, y, o, kind, gaze, tilt = 0) {
  const out = [];
  const P = (u, v) => [x + u * o, y + v];
  const rx = 9.2;
  const ry = 9.6;
  if (kind === 'wink') kind = o > 0 ? 'happy' : 'open';
  if (kind === 'happy') {
    out.push(...arc([P(-rx * 0.95, 2.2), P(-rx * 0.45, -4.6), P(rx * 0.4, -4.8), P(rx * 0.98, 1.6)], 2.7, LASH));
    out.push(...tbl([P(rx * 0.9, 0.6), P(rx * 1.24, -1.8), P(rx * 1.3, -3.6)], 2.0, 1.2, LASH), F(E(...P(rx * 1.28, -3.8), 0.9, 0.9, LASH)));
    out.push(...arc([P(-rx * 0.4, 5.6), P(0, 6.3), P(rx * 0.5, 5.4)], 1.0, '#c6a2d6'));
    return out;
  }
  if (kind === 'squeeze') {
    out.push(...arc([P(-rx * 0.9, -4.2), P(-rx * 0.1, -1), P(rx * 0.9, 0.4)], 2.6, LASH));
    out.push(...arc([P(-rx * 0.8, 4.2), P(0, 2.6), P(rx * 0.9, 0.6)], 2.2, LASH));
    return out;
  }
  if (kind === 'shut' || kind === 'sleep') {
    const d = kind === 'sleep' ? 4.4 : 3.4;
    out.push(...tbl([P(-rx * 0.95, 0), P(-rx * 0.2, d), P(rx * 0.55, d - 0.6), P(rx * 1.0, 0.2)], 1.7, 2.7, LASH));
    out.push(...tbl([P(rx * 0.98, 0.3), P(rx * 1.24, -1.4), P(rx * 1.26, -3.0)], 1.9, 1.1, LASH), F(E(...P(rx * 1.24, -3.1), 0.8, 0.8, LASH)));
    return out;
  }
  // the white: an arched window, round on top, flatter and wider below
  const wide = kind === 'wide' ? 1.06 : 1;
  const W = rx * wide;
  const Hh = ry * wide;
  const white = [P(-W, 2.2), P(-W * 0.94, -Hh * 0.5), P(-W * 0.58, -Hh * 0.94), P(0, -Hh * 1.04), P(W * 0.6, -Hh * 0.94), P(W * 0.96, -Hh * 0.5), P(W, 2.2), P(W * 0.8, Hh * 0.74), P(0, Hh * 0.86), P(-W * 0.8, Hh * 0.74)];
  if (kind === 'stone') {
    // a statue's eyes: blank carved stone, a groove for the lid
    out.push(F(blob(white, STONE[2], 2)), F(blob(white.map(([px, py]) => [x + (px - x) * 0.84, py + 0.8]), STONE[0], 2)));
    out.push(...arc([P(-W * 0.96, -1.4), P(-W * 0.5, -Hh * 0.98), P(W * 0.5, -Hh * 0.98), P(W * 0.96, -1.4)], 1.6, STONE[3]));
    return out;
  }
  out.push(F(blob(white, '#ffffff', 2)));
  if (kind === 'dizzy') {
    const pts = [];
    for (let i = 0; i <= 26; i++) {
      const u = i / 26;
      const an = u * TAU * 1.7 * o;
      pts.push(P(Math.cos(an) * u * rx * 0.7 * o, Math.sin(an) * u * ry * 0.66));
    }
    out.push(...arc(pts, 1.5, IRIS[1]));
    out.push(...tbl([P(-W * 0.98, -1.4), P(-W * 0.6, -Hh * 0.92), P(W * 0.3, -Hh * 1.06), P(W * 0.98, -1.6)], 1.8, 3.2, LASH));
    return out;
  }
  const [gx, gy] = gaze ?? [0.8, 0.6];
  const ix = x + gx + 0.2 * o;
  const iy = y + gy + 0.4;
  const ir = kind === 'wide' ? 0.82 : 1;
  const iw = rx * 0.74 * ir;
  const ih = ry * 0.82 * ir;
  // the iris: a deep amber rim, amber, glowing gold up from the bottom, a soft upright pupil
  out.push(F(E(ix, iy, iw, ih, IRIS[0])), F(E(ix, iy + 0.4, iw * 0.86, ih * 0.88, IRIS[1])));
  out.push(F(E(ix, iy + ih * 0.34, iw * 0.7, ih * 0.46, IRIS[2])), F(E(ix, iy + ih * 0.52, iw * 0.52, ih * 0.28, IRIS[3])));
  out.push(F(E(ix, iy + 0.2, iw * 0.3 * ir, ih * 0.5 * ir, '#3a1a10')));
  // glints: a big round one up on the far side, and her four-point sparkle low on the near side
  out.push(F(E(ix - 2.4 * o, iy - 3.2, 2.5 * ir, 2.3 * ir, '#ffffff')));
  const sx = ix + 2.5 * o;
  const sy = iy + 2.8;
  const r = 1.9;
  out.push(F(T([[sx, sy - r], [sx + r * 0.22, sy - r * 0.22], [sx + r, sy], [sx + r * 0.22, sy + r * 0.22], [sx, sy + r], [sx - r * 0.22, sy + r * 0.22], [sx - r, sy], [sx - r * 0.22, sy - r * 0.22]], IRIS[4])));
  // the lash line: heavy, thickening to its outer corner, one round flick turned up off it
  const ti = tilt;
  out.push(...tbl([P(-W * 0.98, -0.6 + ti * 1.2), P(-W * 0.7, -Hh * 0.74 + ti * 0.8), P(-W * 0.1, -Hh * 1.06 + ti * 0.3), P(W * 0.62, -Hh * 0.92), P(W * 1.04, -Hh * 0.36)], 1.6, 3.4, LASH));
  out.push(...tbl([P(W * 0.86, -Hh * 0.62), P(W * 1.18, -Hh * 0.9), P(W * 1.32, -Hh * 1.2)], 2.2, 1.2, LASH), F(E(...P(W * 1.32, -Hh * 1.23), 0.72, 0.72, LASH)));
  // the lower lid: a short soft lilac line under the outer half
  out.push(...arc([P(-W * 0.1, Hh * 0.84), P(W * 0.42, Hh * 0.84), P(W * 0.82, Hh * 0.6)], 1.0, '#b494c8'));
  return out;
}

// Her face by mood: eyes, round brows, cheeks, the mouth.
//   moods: calm grin bleh laugh grr shout surprised panic yawn hurt dizzy sleep stone puff smug
//          worried sad talkA talkE talkO shut blink look lookL
const EYES = {
  calm: ['open', [0.8, 0.6]], grin: ['open', [1.4, 0.6]], smug: ['open', [1.6, 0.2], 0.5], bleh: ['wink'], laugh: ['happy'], grr: ['open', [2.2, 0.8], 1.1], shout: ['squeeze'],
  surprised: ['wide', [0.2, -0.4]], panic: ['wide', [2.2, 0.4]], panicL: ['wide', [-2.2, 0.4]], yawn: ['squeeze'], hurt: ['squeeze'], dizzy: ['dizzy'], sleep: ['sleep'], stone: ['stone'],
  puff: ['open', [2.0, 0.2], 0.6], worried: ['open', [0.8, 1.4], -0.8], sad: ['open', [0.4, 2.2], -1], shut: ['shut'], blink: ['shut'], look: ['open', [0.2, 0.4]], lookB: ['open', [-2.6, 1.6]],
  talkA: ['open', [1.0, 0.4]], talkE: ['open', [1.0, 0.4]], talkO: ['open', [1.0, 0.4]], happy: ['happy'],
};
// (each brow's [outer, inner] lift: + lower, - higher; cross dips at the middle)
const BROWS = {
  grr: [-1.6, 3.0], shout: [-1.2, 2.6], puff: [-0.6, 1.8], smug: [0.4, -0.6], grin: [-0.6, -1.0], laugh: [-0.8, -1.2], bleh: [-0.8, -1.4], surprised: [-2.6, -3.2],
  panic: [1.2, -2.6], panicL: [1.2, -2.6], worried: [1.8, -2.4], sad: [2.0, -2.4], hurt: [1.8, -2.2], yawn: [0.8, -1.8], dizzy: [1.4, -1.6], sleep: [0.4, 0.4], happy: [-0.8, -1.2],
};
function face(mood) {
  const out = [];
  // a soft round kid face, full cheeks, a small round chin
  out.push(blob([[-33, -14], [-34.4, 6], [-31, 20], [-19, 29.6], [1, 33.4], [21, 29.6], [32, 20], [35, 6], [33.6, -14], [0, -31]], SKIN.base, 4));
  out.push(F(blob([[-33, 0], [-32.6, 15], [-26, 25], [-29.6, 12]], SKIN.sh, 2)));
  const hot = mood === 'shout' || mood === 'grr' || mood === 'laugh' || mood === 'hurt' || mood === 'panic' || mood === 'panicL' || mood === 'puff';
  for (const cx of [-20, 23]) {
    out.push(F(E(cx, 22.8, hot ? 8.2 : 7.2, hot ? 4.8 : 4.0, hot ? '#ffb4c8' : '#f8c8d8')));
    out.push(F(E(cx, 22.8, 4.0, 2.2, hot ? '#ffa0b8' : '#f4b6c8')));
    out.push(F(E(cx - 2.2, 21.6, 1.7, 0.9, '#ffffff')));
  }
  if (mood === 'puff') {
    // cheeks puffed full of rainwater
    for (const cx of [-22, 25]) out.push(F(E(cx, 21, 8.6, 7.4, SKIN.lt)), F(E(cx, 22.6, 6, 3.6, '#ffc2d2')));
  }
  const [kind, gaze, tilt] = EYES[mood] ?? EYES.calm;
  out.push(...eye(-13, EY, -1, kind, gaze, tilt ?? 0), ...eye(15, EY, 1, kind, gaze, tilt ?? 0));
  out.push(F(E(2.8, 21.2, 1.5, 1.0, SKIN.sh)), F(E(2.4, 20.7, 0.6, 0.45, '#ffffff')));
  const LIP = '#9a3a5c';
  const M = (pts) => blob(pts, '#983658', 2);
  const tongue = '#ff94ac';
  const fang = (x, y, s = 1) => F(blob([[x - 1.1 * s, y], [x + 1.1 * s, y], [x + 0.5 * s, y + 2.2 * s], [x, y + 2.6 * s], [x - 0.5 * s, y + 2.2 * s]], '#ffffff', 1));
  switch (mood) {
    case 'grin':
    case 'laugh':
    case 'happy': {
      const big = mood === 'laugh' ? 1.18 : 1;
      out.push(M([[-4.4 * big, 25.4], [1.5, 26.6], [7.4 * big, 25.2], [6 * big, 29.6 * big], [1.5, 31.4 * big], [-3 * big, 29.6 * big]]), F(E(1.6, 29.8 * (big > 1 ? 1.04 : 1), 3.2 * big, 1.5, tongue)), fang(5.0, 25.8));
      break;
    }
    case 'bleh':
      // a raspberry: her tongue out, a fang showing
      out.push(M([[-2.4, 25.8], [1.5, 26.4], [5.4, 25.8], [4.6, 28], [1.5, 28.6], [-1.6, 28]]), blob([[-1.2, 27], [4.2, 27], [4.4, 32.4], [1.5, 34.2], [-1.4, 32.4]], tongue, 2), F(E(1.2, 30.6, 0.7, 1.4, '#ffc2d0')), fang(4.0, 25.8, 0.8));
      break;
    case 'shout':
    case 'yawn': {
      const big = mood === 'yawn' ? 1.14 : 1.06;
      out.push(M([[-3 * big, 25.4], [1.5, 24.8], [6 * big, 25.4], [5.4 * big, 30.4], [1.5, 32.2 * big], [-2.4 * big, 30.4]]), F(E(1.5, 30.4, 2.8, 1.4, tongue)));
      if (mood === 'shout') out.push(fang(4.6, 25.4));
      break;
    }
    case 'grr':
      // a fierce little grin, teeth together, both fangs
      out.push(M([[-3.6, 25.6], [1.5, 26.4], [7, 25.4], [6, 28.8], [1.5, 29.8], [-2.6, 28.8]]), F(blob([[-2.6, 26.2], [6.4, 26], [5.8, 27.6], [-2, 27.6]], '#ffffff', 1)), fang(-0.8, 26.2, 0.8), fang(4.6, 26.2, 0.8));
      break;
    case 'surprised':
    case 'talkO':
      out.push(M([[-0.6, 25.8], [1.5, 25], [3.6, 25.8], [3.8, 28.6], [1.5, 29.8], [-0.8, 28.6]]), F(E(1.5, 28.4, 1.2, 0.7, tongue)));
      break;
    case 'puff':
      // lips pressed shut round a mouthful of water
      out.push(M([[-0.4, 26.6], [1.5, 26], [3.4, 26.6], [3.4, 28], [1.5, 28.6], [-0.4, 28]]));
      break;
    case 'talkA':
      out.push(M([[-2.2, 25.8], [1.5, 25.4], [5.2, 25.8], [4.4, 29.2], [1.5, 30.2], [-1.4, 29.2]]), F(E(1.5, 29, 1.8, 0.8, tongue)));
      break;
    case 'talkE':
      out.push(M([[-3, 26.2], [1.5, 26.6], [6, 26.2], [5, 28.4], [1.5, 29], [-2, 28.4]]));
      break;
    case 'panic':
    case 'panicL':
    case 'worried':
    case 'sad':
    case 'hurt':
      out.push(...tbl([[-3, 28.2], [-0.8, 26.8], [1.5, 28], [3.8, 26.8], [6, 28]], 1.6, 1.6, LIP));
      break;
    case 'smug':
      // a cat curl, one fang peeking
      out.push(...tbl([[-3, 26.2], [-0.8, 27.8], [1.5, 26.8], [3.8, 27.8], [6.4, 25.6]], 1.4, 1.6, LIP), fang(4.4, 27.4, 0.75));
      break;
    case 'sleep':
      out.push(M([[0.2, 26.8], [1.5, 26.2], [2.8, 26.8], [2.8, 28.2], [1.5, 28.8], [0.2, 28.2]]));
      break;
    case 'dizzy':
      out.push(...tbl([[-2.4, 28], [0, 26.6], [1.5, 28], [3.4, 26.6], [5.6, 28]], 1.5, 1.5, LIP));
      break;
    case 'stone':
      out.push(...arc([[-2, 27.2], [1.5, 28], [5, 27.2]], 1.3, STONE[3]));
      break;
    default:
      // at rest: her cat curl, a tiny fang peeking at the near corner
      out.push(...tbl([[-2.6, 26.6], [-0.6, 27.8], [1.5, 27.0], [3.6, 27.8], [5.8, 26.4]], 1.3, 1.5, LIP), fang(4.2, 27.2, 0.7));
  }
  return out;
}
function brows(mood) {
  const br = BROWS[mood] ?? [0, 0];
  const c = mood === 'stone' ? STONE[3] : HAIR[3];
  const cap = (p, w) => F(E(p[0], p[1], w / 2, w / 2, c));
  const L = [[-18.4, 0.6 + br[0]], [-13, -0.8 + (br[0] + br[1]) / 2], [-8, 0.2 + br[1]]];
  const R = [[10, 0.2 + br[1]], [15, -0.8 + (br[0] + br[1]) / 2], [20.4, 0.6 + br[0]]];
  const w = 2.5;
  return [
    cap(L[0], w), cap(L[2], w), cap(R[0], w), cap(R[2], w),
    ...arc([[-18.4, 0.6 + br[0]], [-13, -0.8 + (br[0] + br[1]) / 2], [-8, 0.2 + br[1]]], 2.5, c),
    ...arc([[10, 0.2 + br[1]], [15, -0.8 + (br[0] + br[1]) / 2], [20.4, 0.6 + br[0]]], 2.5, c),
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

// ---------- Her hair (head units): a moss-green bob; one shared light, one shared shine ----------
// The light comes from above: every piece is filled from the same top-to-bottom ramp, so the hair
// reads as one head of hair.
function hairFill(ctx, a, ox = 0, oy = 0) {
  const g = ctx.createLinearGradient(-10 - ox, -64 - oy, 6 - ox, 34 - oy);
  g.addColorStop(0, tone(a, HAIR[0]));
  g.addColorStop(0.24, tone(a, HAIR[1]));
  g.addColorStop(0.6, tone(a, HAIR[1]));
  g.addColorStop(1, tone(a, HAIR[2]));
  return g;
}
// The hime cut: nearly level, a gentle arch, just above her brows' tops (cut like a statue's).
const cutY = (x) => -5.2 + (x / 31) ** 2 * 3.2;
// The fringe's cut sections, left to right (their edges where they meet), each a little different.
const SECT = [-31, -19.8, -5.8, 9.8, 21.6, 31];
const SPLIT = [6.2, 5.0, 6.8, 4.8];
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
  const top = -44;
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
const CAP = [[-42, -16], [-46, -32], [-42, -48], [-30, -59.6], [-14, -65], [0, -66.4], [14, -65], [30, -59.6], [42, -48], [46, -32], [42, -16], [31, -26], [14, -31.6], [0, -32.6], [-14, -31.6], [-31, -26]];
// The back of her bob (behind the face): a soft round mass to her jaw.
const BACK = [[-44, -32], [-48.4, -10], [-47, 8], [-42, 20], [-35, 27], [-24, 29], [-10, 27], [0, 26.4], [11, 27], [25, 29], [36, 27], [43, 20], [48, 8], [49.4, -10], [45, -32], [0, -66]];
// A side lock (head units, in its own frame: its root at 0, 0 tucked up under the cap, hanging down).
const LOCK = (o) => [[-7.4 * o, -16], [-8.2 * o, 4], [-8.6 * o, 16], [-7.6 * o, 24], [-4.4 * o, 30], [0.4 * o, 31.4], [4.2 * o, 28.6], [6.4 * o, 20], [7.8 * o, 6], [7.8 * o, -16]].map(([x, y]) => [x + o * 0 - o * 3.6 * Math.max(0, y / 32) ** 2, y]);
export const LOCK_ROOT = { F: [-36.2, -12], N: [37.2, -12] };

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
  glow(ctx, -5 * o, 22, 10, HAIR[3], 0.32);
  glow(ctx, 0, 36, 9, HAIR[2], 0.5);
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
  const bandY = (x) => -41 + (x / 34) ** 2 * 7;
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
  for (const [x, len, w] of [[-25, 5.4, 0.8], [-3, 6.8, 0.8], [17, 3, 0.6]]) {
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


// ---------- Her horns (head units, rooted inside her hair, drawn before the cap covers their roots) ----------
export function horns(ctx, a, mode) {
  for (const [rx, ry, o] of [[-15, -46, -1], [17, -47, 1]]) {
    ctx.save();
    ctx.translate(rx, ry);
    const pts = [[-5.2 * o, 6], [-5.6 * o, -4], [-4 * o, -12], [-1 * o, -18.6], [3 * o, -22.6], [6.4 * o, -23.4], [7.6 * o, -21], [5.4 * o, -17], [4 * o, -10], [4.6 * o, -2], [5.2 * o, 6]];
    smoothPath(ctx, pts);
    if (mode === 'line') paint(ctx, a, 'line', null, STONE_INK, 6 / HS);
    else {
      ctx.fillStyle = tone(a, STONE[1]);
      ctx.fill();
      ctx.save();
      ctx.clip();
      glow(ctx, -2 * o, -14, 8, STONE[0], 0.9);
      glow(ctx, 4 * o, -2, 7, STONE[3], 0.5);
      // carved rings round it
      ctx.strokeStyle = tone(a, STONE[2]);
      ctx.lineWidth = 1.1;
      ctx.lineCap = 'round';
      for (const [y, w] of [[-4, 5.2], [-10, 4.6]]) {
        ctx.beginPath();
        ctx.moveTo(-w * o, y + 1);
        ctx.quadraticCurveTo(0, y + 2.4, w * o, y);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
}

// ---------- Her wings (kid units, in the chest's frame about the root on her back) ----------
export const WROOT = [77, 90];
// (drawn this much bigger than its points: a gargoyle's wings are her silhouette)
export const WSC = 1.65;
// The inner part (root to the wrist) and the outer part (the three round scallops past the wrist,
// folding on its own about the wrist). `far` a shade darker.
const W_IN = [[2, 4], [-2, -6], [-10, -16], [-18, -23], [-22, -18], [-24, -6], [-22, 4], [-12, 7]];
const W_OUT = [[-16, -24], [-22, -30], [-30, -34], [-36, -31], [-34, -25], [-41, -22], [-43, -15], [-37, -11], [-40, -4], [-36, 2], [-28, 1], [-22, 4], [-21, -6], [-17, -16]];
export const WRIST = [-18, -21];
export function wingInner(ctx, a, mode, far) {
  smoothPath(ctx, W_IN);
  if (mode === 'line') return paint(ctx, a, 'line', null, STONE_INK);
  ctx.fillStyle = tone(a, far ? STONE[2] : STONE[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, -8, -12, 12, far ? STONE[1] : STONE[0], 0.8);
  glow(ctx, -14, 6, 10, STONE[3], 0.45);
  // the arm bone of the wing, a raised stone ridge
  ctx.strokeStyle = tone(a, far ? STONE[3] : STONE[2]);
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.quadraticCurveTo(-8, -12, -18, -21);
  ctx.stroke();
  ctx.restore();
}
export function wingOuter(ctx, a, mode, far) {
  smoothPath(ctx, W_OUT);
  if (mode === 'line') return paint(ctx, a, 'line', null, STONE_INK);
  ctx.fillStyle = tone(a, far ? STONE[2] : STONE[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, -26, -26, 12, far ? STONE[1] : STONE[0], 0.7);
  glow(ctx, -34, 0, 10, STONE[3], 0.45);
  // the finger ribs out to each scallop's tip, soft and round-ended
  ctx.strokeStyle = tone(a, far ? STONE[3] : STONE[2]);
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (const [tx, ty] of [[-32, -31], [-40, -16], [-37, -1]]) {
    ctx.beginPath();
    ctx.moveTo(-18, -21);
    ctx.quadraticCurveTo((tx - 18) / 2 + 2, (ty - 21) / 2 - 2, tx + 2, ty);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Her smock (kid units) ----------
export function yoke(ctx, a, mode) {
  smoothPath(ctx, [[65.4, 92], [67.4, 87], [72.6, 84.6], [80, 84], [87.8, 84.6], [93, 87], [95, 92], [95.6, 105], [64.8, 105]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, TUNIC_INK);
  ctx.fillStyle = tone(a, TUNIC[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 90, 90, 9, TUNIC[0], 0.7);
  glow(ctx, 66, 102, 9, TUNIC[2], 0.7);
  ctx.restore();
  // a little cushion of moss grown on her near shoulder
  mossClump(ctx, a, [[90.6, 87.4, 2.6], [93.6, 88.6, 2.2], [88, 88.6, 1.8]]);
}
// Soft round moss lumps (kid units): each a dark rim, a green fill, a light top.
export function mossClump(ctx, a, list) {
  // (one soft pad: its lumps merged under a single deeper rim, lit on top, never a row of beads)
  for (const [x, y, r] of list) {
    ell(ctx, x, y + 0.4, r + 0.6, r * 0.72 + 0.6);
    ctx.fillStyle = tone(a, MOSS[3]);
    ctx.fill();
  }
  for (const [x, y, r] of list) {
    ell(ctx, x, y, r, r * 0.72);
    ctx.fillStyle = tone(a, MOSS[2]);
    ctx.fill();
  }
  for (const [x, y, r] of list) {
    ell(ctx, x - r * 0.15, y - r * 0.18, r * 0.72, r * 0.46);
    ctx.fillStyle = tone(a, MOSS[1]);
    ctx.fill();
  }
  const [x0, y0, r0] = list[1] ?? list[0];
  ell(ctx, x0 - r0 * 0.3, y0 - r0 * 0.34, r0 * 0.36, r0 * 0.2);
  ctx.fillStyle = tone(a, MOSS[0]);
  ctx.fill();
}
const SKIRT = {
  F: [[64.6, 103], [74, 102.6], [81.6, 103], [81.4, 114], [81, 124.6], [72, 125.6], [62.6, 124.8], [59.2, 123], [61.4, 114]],
  N: [[79, 103], [88, 102.6], [96.4, 103], [98.6, 114], [101.6, 122.8], [96.6, 125], [88, 125.8], [79.2, 124.8], [79.2, 114]],
};
export function skirtPanel(ctx, a, mode, k) {
  smoothPath(ctx, SKIRT[k]);
  if (mode === 'line') return paint(ctx, a, 'line', null, TUNIC_INK);
  const far = k === 'F';
  ctx.fillStyle = tone(a, far ? TUNIC[2] : TUNIC[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (far) glow(ctx, 62, 120, 10, TUNIC[3], 0.6);
  else {
    glow(ctx, 96, 108, 9, TUNIC[0], 0.6);
    glow(ctx, 84, 124, 9, TUNIC[2], 0.5);
  }
  ctx.strokeStyle = tone(a, far ? TUNIC[3] : TUNIC[2]);
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (far) {
    ctx.moveTo(71, 108);
    ctx.quadraticCurveTo(69.4, 116, 68.4, 123);
  } else {
    ctx.moveTo(91, 108);
    ctx.quadraticCurveTo(93, 116, 94.4, 123);
  }
  ctx.stroke();
  ctx.restore();
  // the moss grown along her hem
  if (far) mossClump(ctx, a, [[63, 124.6, 2.6], [66.4, 125.6, 3.2], [69.4, 124.4, 2.2]]);
  else mossClump(ctx, a, [[86, 125.4, 2.6], [89.6, 126, 3.4], [93.2, 125.4, 2.6], [99.6, 123.6, 2.2]]);
}
export function skirtBack(ctx, a, mode) {
  smoothPath(ctx, [[64, 104], [96, 104], [100.4, 122], [92, 125], [80, 125.4], [68, 125], [59.6, 122]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, TUNIC_INK);
  ctx.fillStyle = tone(a, TUNIC[3]);
  ctx.fill();
}
// The stone belt and its round buckle (on her waist).
export function belt(ctx, a, mode) {
  smoothPath(ctx, [[64.4, 101.4], [80, 102.4], [96.2, 101.2], [96.6, 105.2], [80, 106.2], [64.2, 105.2]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, STONE_INK, 4);
  ctx.fillStyle = tone(a, STONE[2]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = tone(a, STONE[1]);
  ctx.fillRect(62, 101.8, 40, 1.4);
  ctx.restore();
  ell(ctx, 88.4, 103.8, 2.8, 2.6);
  ctx.fillStyle = tone(a, STONE[3]);
  ctx.fill();
  ell(ctx, 88.4, 103.5, 2.1, 1.9);
  ctx.fillStyle = tone(a, STONE[1]);
  ctx.fill();
  ell(ctx, 87.7, 102.8, 0.8, 0.6);
  ctx.fillStyle = tone(a, STONE[0]);
  ctx.fill();
}
// The carved stone collar round her neck, a rosette in its middle.
export function collar(ctx, a, mode) {
  smoothPath(ctx, [[69.4, 86.2], [74, 87.4], [80, 88.2], [86.4, 87.4], [91, 86.2], [91.6, 89.6], [86, 91.4], [80, 92], [74, 91.4], [68.8, 89.6]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, STONE_INK, 4);
  ctx.fillStyle = tone(a, STONE[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 74, 88, 6, STONE[0], 0.8);
  glow(ctx, 88, 91, 5, STONE[3], 0.5);
  ctx.restore();
  for (let i = 0; i < 5; i++) {
    const an = -Math.PI / 2 + (i / 5) * TAU;
    ell(ctx, 82 + Math.cos(an) * 1.6, 90 + Math.sin(an) * 1.6, 1.15, 1.15);
    ctx.fillStyle = tone(a, STONE[2]);
    ctx.fill();
  }
  ell(ctx, 82, 90, 1.1, 1.1);
  ctx.fillStyle = tone(a, STONE[0]);
  ctx.fill();
}
// A puffed sleeve on the upper arm (in the bone's frame, p0 the shoulder, p1 the elbow, game px).
export function puffSleeve(ctx, a, mode, p0, p1, far) {
  const mx = p0[0] + (p1[0] - p0[0]) * 0.38;
  const my = p0[1] + (p1[1] - p0[1]) * 0.38;
  const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
  ell(ctx, mx, my, 2.5, 2.0, an);
  if (mode === 'line') return paint(ctx, a, 'line', null, TUNIC_INK, 1.6);
  ctx.fillStyle = tone(a, far ? TUNIC[2] : TUNIC[1]);
  ctx.fill();
  ell(ctx, mx - Math.cos(an) * 0.4 - 0.4, my - 0.7, 1.2, 0.8, an);
  ctx.fillStyle = tone(a, far ? TUNIC[1] : TUNIC[0]);
  ctx.fill();
}
// A stone cuff round her wrist (in the forearm's frame, p0 the elbow, p1 the wrist, game px).
export function stoneCuff(ctx, a, mode, p0, p1) {
  const u = 0.8;
  const x = p0[0] + (p1[0] - p0[0]) * u;
  const y = p0[1] + (p1[1] - p0[1]) * u;
  const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
  ell(ctx, x, y, 1.0, 1.95, an);
  if (mode === 'line') return paint(ctx, a, 'line', null, STONE_INK, 1.2);
  ctx.fillStyle = tone(a, STONE[1]);
  ctx.fill();
  ell(ctx, x - 0.2, y - 0.5, 0.5, 0.9, an);
  ctx.fillStyle = tone(a, STONE[0]);
  ctx.fill();
}
// A stone boot (kid units; the cuff in the shin's frame, the foot in the foot's frame).
export function bootCuff(ctx, a, mode, k) {
  const x = k === 'F' ? 73 : 87;
  smoothPath(ctx, [[x - 5.6, 129.6], [x + 5.6, 129.6], [x + 5.2, 138.6], [x - 5.2, 138.6]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, STONE_INK);
  ctx.fillStyle = tone(a, k === 'F' ? STONE[2] : STONE[1]);
  ctx.fill();
  ctx.fillStyle = tone(a, k === 'F' ? STONE[1] : STONE[0]);
  ctx.fillRect(x - 5.6, 129.6, 11.2, 1.8);
}
export function bootFoot(ctx, a, mode, k) {
  const x = k === 'F' ? 73 : 87;
  smoothPath(ctx, [[x - 5.4, 134.4], [x + 4, 134.8], [x + 9.2, 139], [x + 11.2, 143.2], [x + 9, 146.6], [x - 5.4, 146.6], [x - 6.2, 141]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, STONE_INK);
  const far = k === 'F';
  ctx.fillStyle = tone(a, far ? STONE[2] : STONE[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = tone(a, far ? STONE[3] : STONE[2]);
  ctx.fillRect(x - 8, 144.6, 22, 4);
  glow(ctx, x + 5, 139, 3.6, STONE[0], far ? 0.5 : 0.9);
  ctx.restore();
}

// ---------- Her tail (kid units): two stone pieces from her hips, a round spade on its end ----------
export const TAIL0 = [75, 111];
export const TAIL1 = [61, 115];
export function tailPiece(ctx, a, mode, p0, p1, w0, w1) {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  ctx.beginPath();
  ctx.moveTo(p0[0] + nx * w0 / 2, p0[1] + ny * w0 / 2);
  ctx.quadraticCurveTo((p0[0] + p1[0]) / 2 + nx * (w0 + w1) / 3.6, (p0[1] + p1[1]) / 2 + ny * (w0 + w1) / 3.6 - 1, p1[0] + nx * w1 / 2, p1[1] + ny * w1 / 2);
  ctx.arc(p1[0], p1[1], w1 / 2, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
  ctx.lineTo(p0[0] - nx * w0 / 2, p0[1] - ny * w0 / 2);
  ctx.arc(p0[0], p0[1], w0 / 2, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true);
  ctx.closePath();
  if (mode === 'line') return paint(ctx, a, 'line', null, STONE_INK);
  ctx.fillStyle = tone(a, STONE[2]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 2, w0, STONE[1], 0.8);
  ctx.restore();
}
// The spade: a round soft heart, its point rounded off (in the end piece's frame, at `at`).
export function spade(ctx, a, mode, at, rot) {
  ctx.save();
  ctx.translate(at[0], at[1]);
  ctx.rotate(rot);
  const pts = [[2, 0], [-1, -4.6], [-5.4, -6.6], [-9.4, -5], [-10.4, -1.6], [-12.4, 0], [-10.4, 1.6], [-9.4, 5], [-5.4, 6.6], [-1, 4.6]];
  smoothPath(ctx, pts);
  if (mode === 'line') paint(ctx, a, 'line', null, STONE_INK);
  else {
    ctx.fillStyle = tone(a, STONE[1]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    glow(ctx, -5, -3, 5, STONE[0], 0.9);
    glow(ctx, -6, 4.6, 4, STONE[3], 0.5);
    ctx.restore();
  }
  ctx.restore();
}
