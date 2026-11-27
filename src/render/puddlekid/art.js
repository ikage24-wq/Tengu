// The Puddle Kid's look (2026-11-26, remade from scratch on the kid base, the player: "It should still
// be remade into a puddle kid tho"): drawn live over her own copy of the kid base's bones (kidrig.js),
// outer outline only (every piece's outline in one pass, then every piece's fill), each line in the
// piece's own deeper colour, never near-black. Nothing of the player character's: her hair, face,
// eyes and clothes are all her own.
//
// Who she is: one of the Whispering Glade's tanukis in disguise, a puddle-mad little rain kid. A too-
// big buttercup raincoat with its hood up (two round bumps on top: her tanuki ears are hiding under
// it), a wide A-line hem with pockets, big toggle buttons and drawstrings; round sky-blue rain boots;
// a lily pad with a little pink water lily on it held over her shoulder for an umbrella, dripping;
// a warm brown bob with a soft fringe and a green leaf pinned in it (the leaf she changed with). Under
// the coat a striped tanuki tail she keeps tucked away, and when she forgets herself, it shows.
//
// Her face (her own eye family, "puddle eyes"): wide soft ovals; a rain-blue iris that reflects the
// sky in a pale band across its top and glows aqua at the bottom, a round glint and her signature, a
// little ripple ring with a raindrop in it; a heavy rounded upper lash line with one round curl at its
// outer corner; a short rosy lower lid; round brows; a mouth that rests closed with one corner up, and
// a tiny snaggle fang when she grins (the tanuki in her).
//
// Units: the head in head units (eyes at y 9, the face's edges at about +-34, chin 33, the skull's top
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
export const SKIN = { lt: '#fff7ef', base: '#ffe7d8', sh: '#f7c8b2', deep: '#e7a690' };
export const HAIR = ['#e0b088', '#b07a50', '#875636', '#5e3a24'];
export const HAIR_INK = '#6e4430';
export const COAT = ['#fff6bc', '#ffd94e', '#f2b52c', '#d08a1e'];
export const COAT_INK = '#b8741e';
export const BOOT = ['#dff3ff', '#72bdf2', '#4692d4', '#2e68a6'];
export const BOOT_INK = '#3a6aa4';
export const PAD = ['#c6f0a2', '#7cc860', '#55a24a', '#3c7c3e'];
export const PAD_INK = '#3f7a42';
export const LILY = ['#fff2f6', '#ffbcd4', '#f48cb2', '#d8608e'];
export const WATER = ['#ffffff', '#d6f2fc', '#a4dcf2', '#6fb8de', '#4e94c4'];
export const TAIL = ['#e8c49a', '#b9845a', '#7a5034', '#4c3020'];
export const TAIL_INK = '#5c3a26';
export const WOOD = ['#f0c896', '#c98b5a', '#9a6440'];
export const LASH = '#4a2c28';
export const IRIS = ['#1f4f86', '#2f7cc4', '#58a8e2', '#a8e0fa', '#8ae4e6'];

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
const inked = (list, ink) => list.map((s) => ({ ...s, ink }));
const tbl = (pts, w0, w1, c) => band(curve(pts, 3), w0, w1, c, true);
const arc = (pts, w, c) => tbl(pts, w, w, c);

// ---------- Her head (head units) on the kid base ----------
export const HS = 0.72;
export const HX = 81;
export const HY = 83 - 31 * HS;
// A head-units point in kid units.
export const hk = ([u, v]) => [HX + u * HS, HY + v * HS];

// Her eye. o: -1 the far eye, 1 the near; kind: open | wide | half | look* | happy | squeeze | shut |
// sleep | dizzy; gaze [x, y] where the iris looks (head units).
function eye(x, y, o, kind, gaze) {
  const out = [];
  const P = (u, v) => [x + u * o, y + v];
  const rx = 8.8;
  const ry = 10.2;
  // the round curl at the lash line's outer corner (its lid height `l`)
  const curl = (l, w = 1) => [
    ...tbl([P(rx * 0.7, -ry * 0.62 + l), P(rx * 1.12, -ry * 0.72 + l * 0.8), P(rx * 1.36, -ry * 0.98 + l * 0.6)], 2.6 * w, 1.6 * w, LASH),
    F(E(...P(rx * 1.36, -ry * 1.04 + l * 0.6), 1.5 * w, 1.5 * w, LASH)),
  ];
  if (kind === 'happy') {
    // shut in a smile: a soft upturned arc, the curl at its end, the lower lid lifted under it
    out.push(...arc([P(-rx * 0.95, 1.8), P(-rx * 0.35, -5), P(rx * 0.4, -5.4), P(rx * 0.98, 1.4)], 2.7, LASH));
    out.push(...tbl([P(rx * 0.86, -0.4), P(rx * 1.24, -2.8), P(rx * 1.4, -5.2)], 2.2, 1.2, LASH), F(E(...P(rx * 1.42, -5.6), 1.2, 1.2, LASH)));
    out.push(...arc([P(-rx * 0.5, 5.2), P(0, 6.2), P(rx * 0.55, 5.0)], 1.0, '#e8a08e'));
    return out;
  }
  if (kind === 'squeeze') {
    // squeezed shut: two soft strokes meeting at the outer corner (a hurt wince, a sneeze)
    out.push(...arc([P(-rx * 0.9, -4.6), P(-rx * 0.1, -1.2), P(rx * 0.9, 0.4)], 2.6, LASH));
    out.push(...arc([P(-rx * 0.8, 4.2), P(0, 2.4), P(rx * 0.9, 0.6)], 2.2, LASH));
    return out;
  }
  if (kind === 'shut' || kind === 'sleep') {
    // gently shut: a downturned arc with its curl, lashes resting on the cheek
    const d = kind === 'sleep' ? 5.2 : 4;
    out.push(...arc([P(-rx * 0.95, -0.6), P(-rx * 0.2, d), P(rx * 0.5, d - 0.4), P(rx * 0.98, -0.4)], 2.6, LASH));
    out.push(...tbl([P(rx * 0.86, 0), P(rx * 1.22, -0.8), P(rx * 1.4, -2.6)], 2.2, 1.2, LASH));
    return out;
  }
  const wide = kind === 'wide' ? 1.08 : 1;
  // (awake, the whole iris always shows: the lid is a neat lash line on top, the brows and the gaze do
  // the acting, 2026-11-26)
  const lid = 0;
  // the white, a soft wide oval a touch flatter on top
  out.push(F(blob([P(-rx * wide, 0), P(-rx * 0.8 * wide, -ry * 0.82 * wide), P(0, -ry * wide), P(rx * 0.85 * wide, -ry * 0.84 * wide), P(rx * wide, 0), P(rx * 0.78 * wide, ry * 0.86 * wide), P(0, ry * wide), P(-rx * 0.78 * wide, ry * 0.86 * wide)], '#ffffff', 2)));
  if (kind === 'dizzy') {
    // dizzy: a soft swirl in each eye, no pupil
    const pts = [];
    for (let i = 0; i <= 26; i++) {
      const u = i / 26;
      const an = u * TAU * 1.7 * o;
      pts.push(P(Math.cos(an) * u * rx * 0.72 * o, Math.sin(an) * u * ry * 0.7));
    }
    out.push(...arc(pts, 1.6, IRIS[1]));
    out.push(...tbl([P(-rx * 0.96, -2.6), P(-rx * 0.5, -ry * 0.98), P(rx * 0.4, -ry * 1.02), P(rx * 0.98, -2.4)], 2.4, 3.0, LASH), ...curl(0));
    return out;
  }
  const [gx, gy] = gaze ?? [0.8, 0.4];
  const ix = x + gx + 0.4 * o;
  const iy = y + gy + 0.6;
  const ir = kind === 'wide' ? 0.82 : 1;
  const iw = rx * 0.78 * ir;
  const ih = ry * 0.84 * ir;
  // the iris: a deep rain-blue rim, rain blue, the sky's pale reflection across its top, an aqua glow
  // at its bottom; a soft navy pupil
  out.push(F(E(ix, iy, iw, ih, IRIS[0])), F(E(ix, iy + 0.5, iw * 0.86, ih * 0.88, IRIS[1])));
  out.push(F(E(ix, iy + ih * 0.42, iw * 0.66, ih * 0.38, IRIS[4])));
  out.push(F(E(ix, iy + 0.4, iw * 0.44 * (kind === 'wide' ? 0.7 : 1), ih * 0.46 * (kind === 'wide' ? 0.7 : 1), '#14305a')));
  out.push(F(blob([[ix - iw * 0.8, iy - ih * 0.36], [ix - iw * 0.4, iy - ih * 0.74], [ix + iw * 0.4, iy - ih * 0.74], [ix + iw * 0.8, iy - ih * 0.36], [ix, iy - ih * 0.2]], IRIS[3], 2)));
  // glints: a big round one up on the far side, and her ripple ring with a raindrop in it, low on
  // the near side
  out.push(F(E(ix - 2.6 * o, iy - 3.6, 2.8 * ir, 2.5 * ir, '#ffffff')));
  const rgx = ix + 2.8 * o;
  const rgy = iy + 3.4;
  out.push(...arc([[rgx - 2.2, rgy + 0.2], [rgx - 1.4, rgy - 1.3], [rgx, rgy - 1.7], [rgx + 1.4, rgy - 1.3], [rgx + 2.2, rgy + 0.2]], 0.7, '#ffffff'));
  out.push(...arc([[rgx - 2.0, rgy + 0.6], [rgx, rgy + 1.5], [rgx + 2.0, rgy + 0.6]], 0.6, '#e6faff'));
  out.push(F(E(rgx, rgy - 0.1, 0.75, 0.75, '#ffffff')));
  // a lid lowered over the top (half: cheeky, level and heavy; cross: slanting in; worried: out)
  if (lid > 0) {
    const inner = kind === 'cross' ? lid + 2.4 : kind === 'worried' ? lid - 1.6 : lid;
    const outer = kind === 'cross' ? lid - 2.4 : kind === 'worried' ? lid + 2.2 : lid;
    out.push(F(blob([P(-rx - 2.4, -ry - 3.4), P(rx + 2.4, -ry - 3.4), P(rx + 2.4, -ry + outer), P(0, -ry + (inner + outer) / 2 + 0.4), P(-rx - 2.4, -ry + inner)], SKIN.base, 1)));
    out.push(...tbl([P(-rx * 0.98, -ry + inner + 0.6), P(0, -ry + (inner + outer) / 2 + 0.8), P(rx * 0.98, -ry + outer + 0.6)], 2.6, 3.2, LASH), ...curl(outer));
  } else {
    // the upper lash line, heavier toward its outer end, and its round curl
    out.push(...tbl([P(-rx * 0.96 * wide, -2.4), P(-rx * 0.55 * wide, -ry * 0.96 * wide), P(rx * 0.35 * wide, -ry * 1.02 * wide), P(rx * 0.98 * wide, -2.6)], 2.2, 3.2, LASH), ...curl(0, wide));
  }
  // the lower lid: a short soft rosy line under the outer two thirds
  out.push(...arc([P(-rx * 0.3, ry * 0.9), P(rx * 0.35, ry * 0.96), P(rx * 0.82, ry * 0.62)], 1.1, '#d98e82'));
  return out;
}

// Her face by mood: eyes, round brows, cheeks, the mouth.
//   moods: calm happy giggle cheeky up down surprised panic whistle fierce shout hurt dizzy sleep
//          scrunch blep smug sad talkA talkE talkO worried shut doze
const EYES = {
  calm: ['open', [0.8, 0.4]], happy: ['happy'], giggle: ['happy'], cheeky: ['half', [1.6, 0.6]], up: ['open', [0.6, -3.4]], down: ['open', [1, 3.4]],
  surprised: ['wide', [0.4, -0.4]], panic: ['wide', [2.4, 0.6]], panicL: ['wide', [-2.2, 0.6]], whistle: ['half', [-2.4, -1.6]], fierce: ['cross', [2, 0.6]], shout: ['happy'],
  hurt: ['squeeze'], dizzy: ['dizzy'], sleep: ['sleep'], doze: ['half', [0.6, 2.4]], scrunch: ['squeeze'], blep: ['happy'], smug: ['half', [1.2, 0.2]], sad: ['worried', [0.4, 2.4]],
  talkA: ['open', [1.2, 0.4]], talkE: ['open', [1.2, 0.4]], talkO: ['open', [1.2, 0.4]], worried: ['worried', [1.4, 1]], shut: ['shut'], blink: ['shut'], aim: ['cross', [2.8, 1.4]],
};
const BROWS = {
  fierce: [4.6, -1.8], aim: [3.4, -1.2], shout: [-2.6, -1], hurt: [-3, 2.2], sad: [-3.2, 2.4], worried: [-3.4, 2.2], panic: [-3.6, 1.6], panicL: [-3.6, 1.6], surprised: [-4.4, -3.6],
  up: [-2.4, -0.6], cheeky: [-0.6, 1.4], smug: [-1.6, 1.4], whistle: [-2.6, 0.4], giggle: [-1.4, -1], happy: [-1.4, -1], blep: [-1.4, -1], sleep: [0.6, 0.6], doze: [0.4, 0.6], scrunch: [2.4, 1.6], dizzy: [-2, 1.6],
};
function face(mood) {
  const out = [];
  // a soft round kid face, chubby cheeks
  out.push(blob([[-33, -12], [-35, 8], [-30, 22], [-17, 30.4], [2, 33], [20, 30.4], [31, 21], [35, 7], [33, -12], [0, -30]], SKIN.base, 4));
  out.push(F(blob([[-33, -2], [-32.4, 14], [-26, 24], [-29.4, 10]], SKIN.sh, 2)));
  // cheeks: a warm round blush each side (rosier when she's worked up)
  const hot = mood === 'shout' || mood === 'fierce' || mood === 'panic' || mood === 'panicL' || mood === 'hurt' || mood === 'giggle';
  for (const cx of [-21, 24]) {
    out.push(F(E(cx, 19, hot ? 8.8 : 7.6, hot ? 5.8 : 5, hot ? '#ffa2b0' : '#ffc0c4')));
    out.push(F(E(cx - 2.4, 17.6, 2.2, 1.2, '#ffe4e2')));
  }
  const [kind, gaze] = EYES[mood] ?? EYES.calm;
  out.push(...eye(-13, 9, -1, kind, gaze), ...eye(15, 9, 1, kind, gaze));
  // round brows: short, full, even, round at both ends, just under the fringe; they do the acting
  const br = BROWS[mood] ?? [0, 0];
  out.push(...arc([[-18.2, -3.4 + br[0] * 0.7], [-13, -5 + ((br[0] + br[1]) / 2) * 0.7], [-8.2, -4 + br[1] * 0.7]], 2.6, HAIR[3]));
  out.push(...arc([[10.2, -4 + br[1] * 0.7], [15, -5 + ((br[0] + br[1]) / 2) * 0.7], [20.2, -3.4 + br[0] * 0.7]], 2.6, HAIR[3]));
  // the nose: a soft little shade and a light
  out.push(F(E(3.4, 17.4, 1.6, 1.1, SKIN.sh)), F(E(3.0, 16.8, 0.7, 0.5, '#ffffff')));
  // the mouth (the face's centre line, x 3)
  const LIP = '#a63a4c';
  const M = (pts) => blob(pts, '#a8384c', 2);
  const tongue = '#ff8ea2';
  const fang = (x, y) => F(T([[x - 1.2, y], [x + 1.2, y], [x + 0.3, y + 2.4], [x - 0.3, y + 2.4]], '#ffffff'));
  switch (mood) {
    case 'happy':
    case 'giggle':
    case 'shout': {
      // an open grin, a little snaggle fang on one side
      const big = mood === 'shout' ? 1.25 : 1;
      out.push(M([[-4.6 * big, 22.2], [3, 23.4], [10.6 * big, 22], [9 * big, 27.6 * big], [3, 29.6 * big], [-3 * big, 27.6 * big]]));
      out.push(F(E(3.4, 27.2 * (big > 1 ? 1.06 : 1), 3.6 * big, 1.8 * big, tongue)), fang(7.4, 22.6));
      break;
    }
    case 'cheeky':
    case 'smug':
      // a closed one-sided grin, the near corner tucked up, the fang peeking
      out.push(...tbl([[-2.4, 24.2], [2, 25], [6.6, 24.2], [9.4, 21.6]], 1.8, 2, LIP), fang(6.2, 24.4), F(E(2.6, 26.4, 2.4, 0.8, '#ffb6b8')));
      break;
    case 'surprised':
    case 'up':
      out.push(M([[0.4, 22.4], [3, 21.6], [5.6, 22.4], [5.8, 25.6], [3, 27], [0.2, 25.6]]), F(E(3, 25.2, 1.6, 0.9, tongue)));
      break;
    case 'talkA':
      out.push(M([[-1.4, 22.4], [3, 22], [7.4, 22.4], [6.4, 26.6], [3, 27.8], [-0.4, 26.6]]), F(E(3, 26, 2.2, 1, tongue)));
      break;
    case 'talkE':
      out.push(M([[-2.6, 23], [3, 23.4], [8.6, 23], [7.4, 25.6], [3, 26.4], [-1.4, 25.6]]));
      break;
    case 'talkO':
    case 'whistle': {
      // a little round "o" (whistling: pushed out to the near side, a note floats off it)
      const ox = mood === 'whistle' ? 5.4 : 3;
      out.push(M([[ox - 2.2, 23.6], [ox, 22.4], [ox + 2.2, 23.6], [ox + 2.2, 25.8], [ox, 27], [ox - 2.2, 25.8]]), F(E(ox, 25, 0.9, 1, '#6e2232')));
      break;
    }
    case 'panic':
    case 'panicL':
    case 'worried':
    case 'sad':
    case 'hurt':
      // a wobbly little line
      out.push(...tbl([[-2.6, 25.4], [-0.4, 23.8], [2, 25.2], [4.4, 23.8], [6.8, 25.2], [9, 24]], 1.7, 1.7, LIP));
      break;
    case 'fierce':
    case 'aim':
      // a determined grin: teeth showing, the fang
      out.push(M([[-3.4, 22.4], [3, 23.4], [9.4, 22.2], [8.2, 26], [3, 27], [-2.2, 26]]), F(blob([[-2.4, 23.2], [8.6, 23], [8, 24.6], [-2, 24.6]], '#ffffff', 1)), fang(6.6, 24.2));
      break;
    case 'blep':
      // tongue out to catch a raindrop
      out.push(M([[-1.4, 22], [3, 22.6], [7.4, 22], [6.4, 24.4], [3, 25], [-0.4, 24.4]]), blob([[0.4, 23.4], [5.6, 23.4], [5.6, 28.4], [3, 30.2], [0.4, 28.4]], tongue, 2), F(E(2.4, 26.4, 0.8, 1.4, '#ffc0cc')));
      break;
    case 'scrunch':
      out.push(...tbl([[-1, 24.4], [3, 23.2], [7, 24.6]], 1.8, 1.8, LIP));
      break;
    case 'sleep':
    case 'doze':
      out.push(M([[1.2, 23.4], [3, 22.8], [4.8, 23.4], [4.8, 25.4], [3, 26.2], [1.2, 25.4]]));
      break;
    case 'dizzy':
      out.push(...tbl([[-2, 24.6], [0.6, 23], [3, 24.6], [5.4, 23], [8, 24.6]], 1.6, 1.6, LIP));
      break;
    default:
      // at rest: closed, fuller in the middle, the near corner lifting a little (her mischief)
      out.push(...tbl([[-2.6, 23.6], [0.4, 24.6], [3.4, 24.8], [6.4, 24.2], [8.8, 22.6]], 1.4, 1.8, LIP), F(E(3, 26.2, 2.6, 0.8, '#ffc2bc')));
  }
  return out;
}

// ---------- Her hair (soft hair, render/mobs/softhair.js: one light, an even blunt cut) ----------
// A warm brown bob: one round silhouette to her chin, its ends turned softly under; side locks framing
// her cheeks outside her eyes; bangs cut evenly just above her brows in five sections, a gentle U.
export const HAIR_H = { C: HAIR, ink: HAIR_INK, tone, lw: 6 / HS, top: -60, bottom: 46 };
const BOB = [[-38, -30], [-43, -8], [-43.6, 12], [-41, 26], [-34, 32.6], [-24, 31], [-14, 27], [0, 26], [14, 27], [24, 31], [34, 32.6], [41, 26], [43.6, 12], [43, -8], [38, -30], [24, -50], [0, -58], [-24, -50]];
const CAP = [[-37.6, -12], [-38.6, -30], [-31, -46], [-17, -55.4], [0, -58.4], [17, -55.4], [31, -46], [38.6, -30], [37.6, -12], [33, -20], [22, -32], [0, -36], [-22, -32], [-33, -20]];
export const BANGS = bluntBangs({ x0: -32, x1: 32, n: 5, cutMid: -8.4, rise: 5.6, seed: 7, top: -44, occl: -37 });
const FACES = {};
// The face by mood (each built once).
export function faceShapes(mood) {
  return (FACES[mood] ??= inked(face(mood), SKIN.deep));
}
// The back of her bob, behind her face (its underside in the deeper shade where it tucks in).
export function hairBack(ctx, a, mode) {
  drawPiece(ctx, a, mode, BOB, HAIR_H, (c) => {
    glow(c, 0, 28, 30, HAIR[3], 0.55);
    for (const o of [-1, 1]) glow(c, 40 * o, 22, 10, HAIR[3], 0.45);
  });
}
// Over her face: the bangs' soft shadow on her forehead, the bangs, the cap over their roots, the one
// shine.
export function hairFront(ctx, a, mode) {
  if (mode === 'fill') foreheadShade(ctx, BANGS, SKIN.sh, 0.7);
  // (the bangs first, their roots then tucked up under the cap)
  drawBangs(ctx, a, mode, BANGS, HAIR_H);
  drawPiece(ctx, a, mode, CAP, HAIR_H, (c) => glow(c, -14, -50, 16, HAIR[0], 0.5));
  if (mode === 'fill') shineBand(ctx, a, HAIR_H, [CAP], -46, 2.4, -28, 28);
}
// A side lock framing her cheek (head units, hanging from `root`, its top tucked up under the cap,
// its end a soft round turn inward), lit by the same light as the rest of her hair.
export function sideLock(ctx, a, mode, root, len, w, o, swing) {
  ctx.save();
  ctx.translate(root[0], root[1]);
  ctx.rotate(swing);
  const pts = [[-w * 0.45 * o, -12], [w * 0.5 * o, -12], [w * 0.62 * o, len * 0.4], [w * 0.4 * o, len * 0.84], [-w * 0.1 * o, len], [-w * 0.5 * o, len * 0.82], [-w * 0.56 * o, len * 0.38]];
  const H = { ...HAIR_H, top: HAIR_H.top - root[1], bottom: HAIR_H.bottom - root[1] };
  drawPiece(ctx, a, mode, pts, H, (c) => {
    // occlusion at its top, tucked under the cap; a soft shade on its face-side edge
    const g = c.createLinearGradient(0, -12, 0, 2);
    g.addColorStop(0, 'rgba(94,58,36,0.4)');
    g.addColorStop(1, 'rgba(94,58,36,0)');
    c.fillStyle = g;
    c.fillRect(-w, -12, w * 2, 14);
    glow(c, -w * 0.5 * o, len * 0.6, w * 0.7, HAIR[3], 0.2);
  });
  ctx.restore();
}

// ---------- The hood (head units, behind her head) ----------
// Up: a round dome round her head with two round bumps on top (her ears under it); down: bunched
// behind her neck. The same points, each eased from one to the other, so it slides back like cloth.
const HOOD_UP = [[-28, 31], [-40, 18], [-46, -6], [-46, -30], [-42, -46], [-45, -58], [-38, -68], [-26, -66], [-14, -62], [0, -61], [14, -62], [26, -66], [38, -70], [47, -60], [44, -46], [48, -30], [47, -6], [42, 18], [30, 31]];
const HOOD_DOWN = [[-30, 40], [-38, 36], [-44, 30], [-46, 22], [-44, 16], [-41, 12], [-36, 10], [-30, 11], [-24, 13], [-16, 15], [-6, 16], [4, 17], [12, 18], [18, 21], [22, 25], [24, 30], [22, 35], [14, 38], [0, 40]];
export function hoodPts(down) {
  const u = sstep(down);
  return HOOD_UP.map((p, i) => [lerp(p[0], HOOD_DOWN[i][0], u), lerp(p[1], HOOD_DOWN[i][1], u)]);
}
export function hood(ctx, a, mode, down) {
  const pts = hoodPts(down);
  smoothPath(ctx, pts);
  if (mode === 'line') return paint(ctx, a, 'line', null, COAT_INK, 6 / HS);
  ctx.fillStyle = tone(a, COAT[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // the lining showing round her face (as the hood folds back it closes up)
  const c = [0, lerp(-8, 30, sstep(down))];
  const k = lerp(0.84, 0.5, sstep(down));
  smoothPath(ctx, pts.map(([x, y]) => [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k + 3]));
  ctx.fillStyle = tone(a, COAT[2]);
  ctx.fill();
  glow(ctx, -30, -40 + down * 50, 26, COAT[0], 0.8);
  glow(ctx, 36, 10 + down * 20, 22, COAT[3], 0.45);
  ctx.restore();
}

// Her tanuki ears (head units): round, a dark rim, a cream middle; `out` 0 hidden in her hair, 1
// up; `wig` a little twitch (radians).
export function ears(ctx, a, mode, out, wig) {
  if (out < 0.02) return;
  for (const o of [-1, 1]) {
    ctx.save();
    ctx.translate(22 * o, -51 + (1 - sstep(out)) * 30);
    ctx.rotate(o * (0.22 + wig * (o > 0 ? 1 : -0.7)));
    smoothPath(ctx, [[-10, 6], [-11, -4], [-6, -12], [0, -13.6], [6, -12], [11, -4], [10, 6]]);
    if (mode === 'line') paint(ctx, a, 'line', null, TAIL_INK, 6 / HS);
    else {
      ctx.fillStyle = tone(a, TAIL[3]);
      ctx.fill();
      smoothPath(ctx, [[-6, 6], [-6.6, -2], [-3, -8], [0, -9], [3, -8], [6.6, -2], [6, 6]]);
      ctx.fillStyle = tone(a, '#f6dcc0');
      ctx.fill();
      ell(ctx, 0, -1, 3.6, 4.4);
      ctx.fillStyle = tone(a, '#ecc6a4');
      ctx.fill();
    }
    ctx.restore();
  }
}

// The leaf pinned in her hair (head units, its stem at 0, 0, pointing up and out).
export function leaf(ctx, a, mode, s = 1) {
  ctx.save();
  ctx.scale(s, s);
  smoothPath(ctx, [[0, 0], [-6, -6], [-6, -15], [0, -24], [7, -17], [8, -7]]);
  if (mode === 'line') {
    paint(ctx, a, 'line', null, PAD_INK, 6 / HS / s);
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, '#86d06a');
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, -2, -16, 8, '#d6f6b2', 0.9);
  glow(ctx, 5, -4, 8, PAD[2], 0.6);
  ctx.restore();
  ctx.strokeStyle = tone(a, PAD[2]);
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0.6, -1);
  ctx.quadraticCurveTo(0, -12, 0.4, -20);
  ctx.moveTo(0.4, -8);
  ctx.lineTo(4, -11);
  ctx.moveTo(0.3, -13);
  ctx.lineTo(-3.4, -16);
  ctx.stroke();
  ctx.restore();
}

// ---------- Her coat (kid units) ----------
// The yoke over her chest and shoulders: buttercup yellow, a lit shoulder, the top toggle button.
export function yoke(ctx, a, mode) {
  smoothPath(ctx, [[64.6, 92], [66.6, 87], [72, 84.6], [80, 84], [88.4, 84.6], [94, 87], [96.2, 92], [96.6, 101], [64.2, 101]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, COAT_INK);
  ctx.fillStyle = tone(a, COAT[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 90, 88, 9, COAT[0], 0.9);
  glow(ctx, 66, 98, 9, COAT[2], 0.7);
  ctx.restore();
}
// A front panel of the coat (F the far one, N the near), hanging from under the yoke to her knees.
const PANEL = {
  F: [[64.2, 97], [74, 96.6], [81.6, 97], [82, 112], [81.8, 129], [74, 130.4], [64, 129.4], [59.4, 127.6], [61.6, 112]],
  N: [[79, 97], [88, 96.6], [96.6, 97], [99, 112], [102.6, 127.4], [97, 129.8], [88, 130.6], [79.4, 129.4], [79.2, 112]],
};
export function panel(ctx, a, mode, k) {
  smoothPath(ctx, PANEL[k]);
  if (mode === 'line') return paint(ctx, a, 'line', null, COAT_INK);
  const far = k === 'F';
  ctx.fillStyle = tone(a, far ? COAT[2] : COAT[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (far) glow(ctx, 62, 122, 12, COAT[3], 0.55);
  else {
    glow(ctx, 96, 106, 10, COAT[0], 0.7);
    glow(ctx, 84, 128, 10, COAT[2], 0.55);
  }
  // a soft fold down the panel
  ctx.strokeStyle = tone(a, far ? COAT[3] : COAT[2]);
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (far) {
    ctx.moveTo(72, 104);
    ctx.quadraticCurveTo(70, 116, 68.6, 128);
  } else {
    ctx.moveTo(92, 106);
    ctx.quadraticCurveTo(94.4, 117, 96, 128);
  }
  ctx.stroke();
  // the stitched hem: a lighter band with little dashes
  ctx.fillStyle = tone(a, far ? COAT[1] : COAT[0]);
  for (let i = 0; i < 6; i++) {
    const x = far ? 62 + i * 3.4 : 81 + i * 3.6;
    const y = far ? 127.4 + Math.sin((i / 5) * Math.PI) * 1.6 : 128 + Math.sin((i / 5) * Math.PI) * 1.4 - (i > 3 ? (i - 3) * 0.8 : 0);
    ell(ctx, x, y, 0.9, 0.42);
    ctx.fill();
  }
  // the pocket (the flap is its own piece)
  smoothPath(ctx, far ? [[63.6, 113], [72, 112.6], [71.6, 121.6], [64.4, 122]] : [[87.6, 113], [97, 112.6], [98.2, 121.6], [88.6, 122]]);
  ctx.fillStyle = tone(a, far ? COAT[3] : COAT[2]);
  ctx.fill();
  ctx.restore();
  if (!far) {
    // the placket's edge and its toggle buttons
    ctx.strokeStyle = tone(a, COAT[3]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(79.6, 99);
    ctx.quadraticCurveTo(79.2, 114, 80, 128.6);
    ctx.stroke();
    for (const y of [105, 115.6]) toggle(ctx, a, 83.2, y);
  }
}
// A round blue toggle button with a shine.
export function toggle(ctx, a, x, y) {
  ell(ctx, x, y, 2.6, 2.6);
  ctx.fillStyle = tone(a, BOOT[3]);
  ctx.fill();
  ell(ctx, x, y - 0.3, 2.1, 2.1);
  ctx.fillStyle = tone(a, BOOT[1]);
  ctx.fill();
  ell(ctx, x - 0.7, y - 1, 0.8, 0.6);
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
}
// A pocket flap (k F / N) over its pocket.
export function flap(ctx, a, mode, k) {
  smoothPath(ctx, k === 'F' ? [[63, 111.6], [72.6, 111.2], [72.2, 115.6], [67.6, 117], [63.4, 115.8]] : [[87, 111.6], [97.6, 111.2], [98, 115.6], [92.6, 117.2], [87.8, 115.8]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, COAT_INK, 3);
  ctx.fillStyle = tone(a, k === 'F' ? COAT[2] : COAT[1]);
  ctx.fill();
  ell(ctx, k === 'F' ? 67.8 : 92.6, 115.2, 0.9, 0.9);
  ctx.fillStyle = tone(a, COAT[3]);
  ctx.fill();
}
// The back of the coat, behind her legs (its inside, in shadow).
export function coatBack(ctx, a, mode) {
  smoothPath(ctx, [[64, 100], [96, 100], [100.4, 126], [92, 129], [80, 129.4], [68, 129], [59.6, 126]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, COAT_INK);
  ctx.fillStyle = tone(a, COAT[3]);
  ctx.fill();
}
// A round collar point under her chin (k F / N).
export function collar(ctx, a, mode, k) {
  smoothPath(ctx, k === 'F' ? [[80, 85.2], [74, 85.6], [70, 87.8], [71.6, 91], [76.4, 91.4], [80.4, 88.4]] : [[80.6, 85.2], [87, 85.6], [91, 87.8], [89.6, 91.2], [84.6, 91.6], [80.6, 88.4]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, COAT_INK, 3);
  ctx.fillStyle = tone(a, COAT[0]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, k === 'F' ? 74 : 87, 90.6, 4, COAT[2], 0.6);
  ctx.restore();
}
// A drawstring from the hood with a little wooden toggle on its end (from its knot at 0, 0, down).
export function cord(ctx, a, mode, len) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(0.8, len * 0.5, 0, len);
  if (mode === 'line') {
    ctx.strokeStyle = COAT_INK;
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.stroke();
  } else {
    ctx.strokeStyle = tone(a, '#fff4e4');
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  smoothPath(ctx, [[-1.4, len - 0.4], [1.4, len - 0.4], [1.8, len + 2.6], [0, len + 4], [-1.8, len + 2.6]]);
  if (mode === 'line') paint(ctx, a, 'line', null, WOOD[2], 2.4);
  else {
    ctx.fillStyle = tone(a, WOOD[1]);
    ctx.fill();
    ell(ctx, -0.5, len + 1, 0.5, 0.9);
    ctx.fillStyle = tone(a, WOOD[0]);
    ctx.fill();
  }
}
// A raincoat sleeve along an arm bone (p0 to p1 in its frame, game px), `w0`/`w1` wide (kid units);
// a turned-back cuff on the forearm.
export function sleevePiece(ctx, a, mode, p0, p1, w0, w1, col, cuff) {
  const sc = 1 / 3;
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  ctx.beginPath();
  ctx.moveTo(p0[0] + nx * w0 * 0.5 * sc, p0[1] + ny * w0 * 0.5 * sc);
  ctx.lineTo(p1[0] + nx * w1 * 0.5 * sc, p1[1] + ny * w1 * 0.5 * sc);
  // (round caps bulging outward at both ends: anticlockwise from one side to the other; clockwise
  // they bulged inward and crossed, a jagged dark knot on a short bone, fixed 2026-11-26)
  ctx.arc(p1[0], p1[1], w1 * 0.5 * sc, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
  ctx.lineTo(p0[0] - nx * w0 * 0.5 * sc, p0[1] - ny * w0 * 0.5 * sc);
  ctx.arc(p0[0], p0[1], w0 * 0.5 * sc, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true);
  ctx.closePath();
  if (mode === 'line') return paint(ctx, a, 'line', null, COAT_INK, 2);
  ctx.fillStyle = tone(a, col);
  ctx.fill();
  // (a soft rim of the coat's own shade round the sleeve, so an arm over the coat never vanishes
  // into it)
  ctx.strokeStyle = tone(a, col === COAT[1] ? COAT[2] : COAT[3]);
  ctx.lineWidth = 0.45;
  ctx.stroke();
  if (cuff) {
    const cx = p1[0] - (dx / L) * 0.9;
    const cy = p1[1] - (dy / L) * 0.9;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w1 * 0.52 * sc, w1 * 0.24 * sc, Math.atan2(dy, dx) + Math.PI / 2, 0, TAU);
    ctx.fillStyle = tone(a, col === COAT[1] ? COAT[0] : COAT[1]);
    ctx.fill();
  }
}

// ---------- Her boots (kid units; in the shin's and the foot's frames) ----------
// The shaft up her shin to under the knee, a turned-down cuff on top.
export function bootShaft(ctx, a, mode, k) {
  const x = k === 'F' ? 73 : 87;
  smoothPath(ctx, [[x - 5.4, 127.6], [x + 5.4, 127.6], [x + 5, 139], [x - 5, 139]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, BOOT_INK);
  const far = k === 'F';
  ctx.fillStyle = tone(a, far ? BOOT[2] : BOOT[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, x + 2.6, 133, 4, far ? BOOT[1] : BOOT[0], 0.7);
  ctx.restore();
  smoothPath(ctx, [[x - 6.2, 126.4], [x + 6.2, 126.4], [x + 6, 130.4], [x - 6, 130.4]]);
  ctx.fillStyle = tone(a, far ? BOOT[1] : BOOT[0]);
  ctx.fill();
}
// The foot of the boot: round toed, a white rubber sole, a shine on the toe.
export function bootFoot(ctx, a, mode, k) {
  const x = k === 'F' ? 73 : 87;
  const pts = [[x - 5.2, 134.6], [x + 4, 135], [x + 9.4, 139.4], [x + 10.4, 144.2], [x + 8.6, 146.6], [x - 5.2, 146.6], [x - 6, 141]];
  smoothPath(ctx, pts);
  if (mode === 'line') return paint(ctx, a, 'line', null, BOOT_INK);
  const far = k === 'F';
  ctx.fillStyle = tone(a, far ? BOOT[2] : BOOT[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = tone(a, far ? '#d8e6f2' : '#ffffff');
  ctx.fillRect(x - 8, 144.4, 20, 4);
  glow(ctx, x + 5.4, 139.6, 3.4, '#ffffff', far ? 0.5 : 0.9);
  ctx.restore();
}

// ---------- Her tail (kid units, its root inside her hips at the pivot, sticking out back) ----------
export function tailShape(ctx, a, mode) {
  const pts = [[78, 107], [74, 106], [66, 108], [57, 113], [51.4, 120], [51, 126.4], [55.6, 128], [62, 124], [69, 117.6], [76, 113], [79, 110]];
  smoothPath(ctx, pts);
  if (mode === 'line') return paint(ctx, a, 'line', null, TAIL_INK);
  ctx.fillStyle = tone(a, TAIL[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // two dark rings and a dark tip, a pale underside
  ctx.fillStyle = tone(a, TAIL[2]);
  for (const [x, y] of [[66, 112], [58.6, 118.6]]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.75);
    ctx.fillRect(-12, -1.9, 24, 3.8);
    ctx.restore();
  }
  ell(ctx, 52.6, 125, 5.6, 6.4);
  ctx.fillStyle = tone(a, TAIL[3]);
  ctx.fill();
  glow(ctx, 66, 108, 7, TAIL[0], 0.8);
  ctx.restore();
}

// ---------- The lily-pad umbrella (kid units, in her far hand: the grip at GRIP) ----------
export const GRIP = [65, 113];
export const PADC = [57, 44];
export function lilyPad(ctx, a, mode, spin) {
  // the stem, curling round her hand
  ctx.beginPath();
  ctx.moveTo(GRIP[0] + 1, GRIP[1] + 5);
  ctx.quadraticCurveTo(GRIP[0] - 2, GRIP[1] + 9, GRIP[0] - 4.6, GRIP[1] + 6);
  ctx.moveTo(GRIP[0] + 1, GRIP[1] + 5);
  ctx.bezierCurveTo(GRIP[0] + 1, 88, PADC[0] + 6, 70, PADC[0] + 1, PADC[1] + 6);
  ctx.strokeStyle = mode === 'line' ? PAD_INK : tone(a, PAD[2]);
  ctx.lineWidth = mode === 'line' ? 9 : 3.4;
  ctx.lineCap = 'round';
  ctx.stroke();
  // the pad: a big round leaf tipped back, its notch cut to the middle (rounded, never sharp), a
  // thick underside showing below, a light rim, veins, rain beads, and a little pink water lily
  ctx.save();
  ctx.translate(PADC[0], PADC[1]);
  const R = 34;
  const tip = 0.36;
  const notch = -1.25 + spin;
  const rim = (rr, k0 = 0.08, k1 = TAU - 0.08) => {
    const pts = [];
    for (let i = 0; i <= 28; i++) {
      const q = notch + k0 + ((k1 - k0) * i) / 28;
      pts.push([Math.cos(q) * rr, Math.sin(q) * rr * tip]);
    }
    return pts;
  };
  // the underside (deeper), a little below the top
  ell(ctx, 0, 4.4, R + 1, R * tip + 2.4);
  if (mode === 'line') paint(ctx, a, 'line', null, PAD_INK);
  else {
    ctx.fillStyle = tone(a, PAD[3]);
    ctx.fill();
  }
  const top = () => {
    ctx.beginPath();
    ctx.moveTo(Math.cos(notch) * 3, Math.sin(notch) * 3 * tip);
    for (const [x, y] of rim(R)) ctx.lineTo(x, y);
    ctx.closePath();
  };
  top();
  if (mode === 'line') {
    paint(ctx, a, 'line', null, PAD_INK);
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, PAD[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, -12, -6, 22, PAD[0], 0.85);
  glow(ctx, 18, 6, 20, PAD[2], 0.6);
  // veins from the middle
  ctx.strokeStyle = tone(a, '#b4e68e');
  ctx.lineWidth = 1.1;
  for (let k = 1; k < 9; k++) {
    const q = notch + (k / 9) * TAU;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(q) * R * 0.5, Math.sin(q) * R * tip * 0.5 - 1, Math.cos(q) * R * 0.92, Math.sin(q) * R * tip * 0.92);
    ctx.stroke();
  }
  ctx.restore();
  // the light rim along the back edge
  ctx.strokeStyle = tone(a, PAD[0]);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  rim(R - 1.4, Math.PI * 0.55, Math.PI * 1.35).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  // rain beads sitting on it
  for (const [x, y, r] of [[-18, 2, 2.6], [14, -4, 2]]) {
    ell(ctx, x, y, r, r * 0.8);
    ctx.fillStyle = tone(a, WATER[1]);
    ctx.fill();
    ell(ctx, x - r * 0.35, y - r * 0.3, r * 0.35, r * 0.25);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  // the water lily: petals round a golden heart
  ctx.translate(8, 2);
  for (let i = 0; i < 6; i++) {
    const q = -Math.PI / 2 + ((i - 2.5) / 6) * 2.4;
    ctx.save();
    ctx.rotate(q + Math.PI / 2);
    smoothPath(ctx, [[0, 0], [-2.6, -4], [0, -8.6], [2.6, -4]]);
    ctx.fillStyle = tone(a, i % 2 ? LILY[1] : LILY[2]);
    ctx.fill();
    ctx.restore();
  }
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.rotate(s * 0.5);
    smoothPath(ctx, [[0, 0], [-2.2, -3.6], [0, -7], [2.2, -3.6]]);
    ctx.fillStyle = tone(a, LILY[0]);
    ctx.fill();
    ctx.restore();
  }
  ell(ctx, 0, -1.4, 1.8, 1.2);
  ctx.fillStyle = tone(a, '#ffd860');
  ctx.fill();
  ctx.restore();
}
