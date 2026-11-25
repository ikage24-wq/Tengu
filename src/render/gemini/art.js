// The Mirror Twins' design (2026-11-24, the player's pick "B" of three for the Gemini Ghosts; detailed
// and polished the same day, the player: "needs more detail and heavy polish"): a little ghost girl of
// the Observatory, white-haired, in a periwinkle star dress, and, back to back with her, her night
// twin: midnight skin and hair with sparkles caught in it, glowing gold eyes, a navy dress stitched
// in gold. The twin is her mirror image (twinrig.js draws her flipped behind her, on the same bones),
// so every move one makes, the other makes too, the other way; their faces differ: the day girl
// sweet, her twin sly.
// Each piece, in the spirit base's own drawing units (blankBody('spirit'), read only), named for the
// bone it rides on:
//   hairB      the long hair behind: seven big locks over a shadow, flaring past the shoulders and
//              curling in at the tips; the twin's with sparkles in it
//   head       the face (each expression), the bangs (swept from a part on the near side, a wisp
//              between the eyes), the angel ring, the clip
//   lockF/N    a side lock each side, curling in at the tip (on springs of their own)
//   ahoge      one little curl standing up on top (on a spring)
//   lower      the wisp: layered, glowing toward its middle, curling at the tip, star motes in it
//   sash       the sash's bow at the small of the back, its two long tails (on a spring)
//   dressTop   the bodice: a lace collar, a row of star buttons, the pendant (a star / a moon)
//   dressSkirt the skirt: a tulle underskirt peeking out, the overskirt with stars stitched round the
//              hem, a lace edge
//   sleeveFu/Nu  puffed sleeves, a lace edge, a little bow
//   cuffF/N    a ribbon round each wrist
// Both are drawn here from scratch (nothing of the player character's: the player's rule).
import { E, T, F } from '../mobs/kit.js';
import { band, curve, blob, HS, mapShape } from '../mobs/kidbase.js';
import { blankBody } from '../mobs/blankbases.js';
import { BLANK } from '../mobs/blankbase.js';

const HX = 106;
const NECK = 95;
const HY0 = NECK - 31 * HS;
const H2B = ([x, y]) => [HX + x * HS, HY0 + y * HS];
const inHead = (list) => list.map((sh) => mapShape(sh, H2B, HS));
const arc = (pts, w, c) => band(curve(pts, 3), w, w, c, true);
const star5 = (x, y, r, c, rot = 0) => T(Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + rot + (i * Math.PI) / 5;
  const rr = i % 2 ? r * 0.48 : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c);
// (a star with its corners rounded off, as every hard corner here is)
const softStar = (x, y, r, c, rot = 0) => blob(Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + rot + (i * Math.PI) / 5;
  const rr = i % 2 ? r * 0.5 : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c, 1);
const moon = (x, y, r, c) => blob([[x - r * 0.2, y - r], [x + r * 0.6, y - r * 0.7], [x + r, y], [x + r * 0.6, y + r * 0.7], [x - r * 0.2, y + r], [x + r * 0.3, y + r * 0.4], [x + r * 0.45, y], [x + r * 0.3, y - r * 0.4]], c, 2);

// The two of them. hair: [light, base, shade, deep]; dress: [light, base, shade, trim]; lace; sash.
export const DAY = {
  skin: { lt: '#ffffff', base: '#fff8f6', sh: '#f2e2e6', deep: '#e0c8d4' },
  wisp: ['#ffffff', '#eef0ff', '#d4d6f6', '#b6b8e8'], glow: '#ffffff', mote: '#fff6c8',
  hair: ['#ffffff', '#e8eaf8', '#c6caea', '#a6aad8'], dress: ['#eef0ff', '#d6dcff', '#b4bcf0', '#8a94dc'], lace: '#ffffff', tulle: '#ffffff', sash: ['#c4b4f4', '#9c88e0'],
  blush: '#ffc4d4', mouth: '#9a4a6a', tongue: '#ff9ab0', brow: '#c4bce0',
  eye: { ring: '#2a3a6a', iris: '#6aa8e8', light: '#c8e8ff', dark: '#2a5aa8', pupil: '#1a1a2e', ink: '#2a2a3a', low: '#c0b8d8', white: '#ffffff', crease: '#e4d4e0' },
  clip: (x, y) => [softStar(x, y, 6.4, '#ffd86a', 0.15), F(softStar(x - 0.4, y - 0.4, 3.4, '#fff2b0', 0.15)), F(E(x - 1.4, y - 2, 1.2, 1, '#ffffff'))],
  pendant: (x, y) => [softStar(x, y, 3.4, '#ffd86a', 0), F(E(x - 0.8, y - 0.8, 0.9, 0.8, '#fff6c8'))],
  sparkles: [],
};
export const NIGHT = {
  skin: { lt: '#5e5ea0', base: '#44447e', sh: '#34346e', deep: '#26265c' },
  wisp: ['#5a5aa0', '#3a3a78', '#2a2a62', '#1c1c4c'], glow: '#8a7ae0', mote: '#ffd86a',
  hair: ['#5a5aa8', '#2c2c66', '#1e1e4e', '#14143a'], dress: ['#3c3c80', '#2a2a62', '#1e1e4c', '#ffd86a'], lace: '#ffd86a', tulle: '#4a4a92', sash: ['#7a5ac8', '#5a3aa8'],
  blush: '#8a6ab8', mouth: '#ffd86a', tongue: '#c87ab0', brow: '#7a7ac0',
  eye: { ring: '#6a4a10', iris: '#ffc83a', light: '#fff0a0', dark: '#d8941a', pupil: '#3a2400', ink: '#0e0e24', low: '#7a7ab0', white: '#fff8e0', crease: '#34346e' },
  clip: (x, y) => [moon(x, y, 6.4, '#ffd86a'), F(moon(x + 0.6, y, 3.6, '#fff2b0')), F(E(x + 1.6, y - 2.4, 1, 0.9, '#ffffff'))],
  pendant: (x, y) => [moon(x, y, 3.4, '#ffd86a'), F(E(x + 0.6, y - 1, 0.8, 0.7, '#fff6c8'))],
  sparkles: [[-40, 26, 2.8], [38, 44, 2.4], [-30, 58, 2.2], [20, 64, 2], [44, 10, 1.8]],
};

// ---------- Faces ----------
// e the eyes, m the mouth, b the brows. The day girl's: sweet; her twin's, for the same moment: sly.
const DAY_FACES = {
  idle: { e: 'open', m: 'smile', b: 'soft' }, blink: { e: 'blink', m: 'smile', b: 'soft' }, happy: { e: 'happy', m: 'open', b: 'up' },
  angry: { e: 'fierce', m: 'pout', b: 'cross' }, hurt: { e: 'squeeze', m: 'wobble', b: 'worry' }, o: { e: 'wide', m: 'o', b: 'up' },
  sleepy: { e: 'sleepy', m: 'yawn', b: 'soft' }, giggle: { e: 'happy', m: 'smile', b: 'up' }, sing: { e: 'happy', m: 'sing', b: 'up' },
};
const NIGHT_FACES = {
  idle: { e: 'half', m: 'smirk', b: 'sly' }, blink: { e: 'blink', m: 'smirk', b: 'sly' }, happy: { e: 'half', m: 'grin', b: 'sly' },
  angry: { e: 'fierce', m: 'grin', b: 'cross' }, hurt: { e: 'squeeze', m: 'wobble', b: 'worry' }, o: { e: 'open', m: 'smirk', b: 'sly' },
  sleepy: { e: 'sleepy', m: 'flat', b: 'soft' }, giggle: { e: 'happy', m: 'grin', b: 'sly' }, sing: { e: 'half', m: 'sing', b: 'sly' },
};
export const MOODS = Object.keys(DAY_FACES);

// A rich eye (head units): a soft crease above, the white, a ring, the iris in three tones with a
// lighter rim at its foot, the pupil, two highlights and a star glint; the upper lid line, thicker at
// the outer corner, with three lashes (lowered by `lid`), the lower lid with two little lashes.
function eye(x, y, o, k, skin, lid = 0, big = 0) {
  const w = 7.8 + big;
  const h = 7.2 + big;
  const r = 5.4 + big * 0.6;
  const P = (u, v) => [x + u * o, y + v];
  const out = [];
  out.push(...arc([P(-w * 0.7, -h - 2.6 + lid * 0.4), P(0, -h - 3.6 + lid * 0.4), P(w * 0.8, -h - 2.4 + lid * 0.4)], 0.8, k.crease));
  out.push(blob([P(-w, 0.6), P(-w * 0.55, -h), P(w * 0.4, -h - 0.4), P(w, -h * 0.4), P(w * 0.75, h * 0.8), P(0, h + 0.6), P(-w * 0.75, h * 0.7)], k.white, 2));
  out.push(F(E(x, y + 0.4, r, r * 1.15, k.ring)), F(E(x, y + 0.8, r - 0.9, r * 1.15 - 0.9, k.iris)), F(E(x, y + r * 0.62, r - 1.8, r * 0.46, k.light)), F(E(x, y - r * 0.5, r - 1.2, r * 0.4, k.dark)));
  out.push(...arc([[x - r * 0.62, y + r * 0.5], [x, y + r * 0.98], [x + r * 0.62, y + r * 0.5]], 0.6, k.light));
  out.push(F(E(x, y + 0.6, 1.7, 2.2, k.pupil)), F(E(x - 2 * o, y - 2.3, 2, 1.7, '#ffffff')), F(E(x + 2.1 * o, y + 2.8, 1, 1, '#ffffff')));
  out.push(F(T([P(1.6, -3.8), P(2.1, -2.8), P(3.1, -2.4), P(2.1, -2), P(1.6, -1), P(1.1, -2), P(0.1, -2.4), P(1.1, -2.8)], '#ffffff')));
  if (lid > 0) out.push(F(blob([P(-w - 0.8, -0.2), P(-w * 0.5, -h - 2.2), P(w * 0.5, -h - 2.6), P(w + 0.8, -h * 0.6), P(w * 0.4, -h + lid), P(-w * 0.5, -h + lid + 0.4)], skin, 2)));
  out.push(...band(curve([P(-w - 0.4, 0.4), P(-w * 0.5, -h - 0.4 + lid), P(w * 0.45, -h - 0.8 + lid), P(w + 0.6, -h * 0.4)], 3), 1.6, 2.8, k.ink, true));
  for (let i = 0; i < 3; i++) out.push(...arc([P(w * (0.55 + i * 0.2), -h * (0.9 - i * 0.2) + lid * 0.5), P(w * (0.85 + i * 0.25), -h * (1.2 - i * 0.15)), P(w * (1.05 + i * 0.25), -h * (1.15 - i * 0.18))], 0.9, k.ink));
  out.push(...arc([P(-w * 0.7, h * 0.75), P(0, h + 1.2), P(w * 0.7, h * 0.7)], 0.7, k.low));
  out.push(...arc([P(w * 0.5, h * 0.9), P(w * 0.62, h * 1.3)], 0.6, k.low), ...arc([P(w * 0.2, h + 1), P(w * 0.26, h + 1.6)], 0.6, k.low));
  return out;
}
const shut = (x, o, kind, ink) => {
  if (kind === 'happy') return [...band(curve([[x - 7.2, 14], [x, 7.4], [x + 7.2, 14]], 3), 1.8, 2.4, ink, true), ...arc([[x + 6.2 * o, 12.6], [x + 9.4 * o, 10.8]], 0.9, ink), ...arc([[x + 4.8 * o, 10.4], [x + 7.6 * o, 8.2]], 0.8, ink)];
  if (kind === 'squeeze') return [...arc([[x - 6.4 * o, 8.6], [x + 5 * o, 12.6], [x - 6.4 * o, 16.4]], 2.2, ink)];
  if (kind === 'sleepy') return [...band(curve([[x - 7.2, 12.6], [x, 14.8], [x + 7.2, 12.6]], 3), 1.6, 2.4, ink, true), ...arc([[x + 6.4 * o, 13.4], [x + 9 * o, 14.6]], 0.8, ink)];
  return [...band(curve([[x - 7.4, 12.4], [x, 15], [x + 7.4, 12.4]], 3), 1.6, 2.4, ink, true), ...arc([[x + 6.6 * o, 12.8], [x + 9.6 * o, 11.2]], 0.9, ink), ...arc([[x + 5.6 * o, 14.4], [x + 8.6 * o, 14.8]], 0.8, ink)];
};
const brows = (b, c) => {
  const one = (o) => {
    const P = (u, v) => [14 * o + u * o, v];
    if (b === 'up') return arc([P(-6, -2.6), P(0, -4.6), P(6, -3.4)], 1.5, c);
    if (b === 'cross') return arc([P(-6, -4.6), P(0, -2.8), P(6, -0.6)], 1.7, c);
    if (b === 'worry') return arc([P(-6, -1), P(0, -3), P(6, -5)], 1.5, c);
    if (b === 'sly') return o > 0 ? arc([P(-6, -3), P(0, -3.6), P(6, -2.6)], 1.5, c) : arc([P(-6, -1.6), P(0, -2.4), P(6, -2.2)], 1.5, c);
    return arc([P(-6, -2), P(0, -3.4), P(6, -2.6)], 1.4, c);
  };
  return [...one(-1), ...one(1)];
};
function face(P, f) {
  const k = P.eye;
  const { e, m } = f;
  const out = [blob([[-33, -14], [-34, 6], [-29, 22], [-17, 31], [0, 34], [17, 31], [29, 22], [34, 6], [33, -14], [0, -30]], P.skin.base, 4)];
  // (a soft shade under the bangs, and down the far side of the face)
  out.push(F(blob([[-33, -6], [-31, 16], [-26, 24], [-29, 10]], P.skin.sh, 2)));
  out.push(...brows(f.b, P.brow));
  if (e === 'happy' || e === 'blink' || e === 'squeeze' || e === 'sleepy') out.push(...shut(-14, -1, e, k.ink), ...shut(14, 1, e, k.ink));
  else {
    const lid = e === 'half' ? 3.6 : e === 'fierce' ? 2.6 : 0;
    const big = e === 'wide' ? 0.8 : 0;
    out.push(...eye(-14, 12, -1, k, P.skin.base, lid, big), ...eye(14, 12, 1, k, P.skin.base, lid, big));
  }
  // cheeks: a soft blush with three little strokes in it; a nose
  for (const o of [-1, 1]) {
    out.push(F(E(21 * o, 21, 5, 3, P.blush)));
    for (let i = 0; i < 3; i++) out.push(...arc([[21 * o + (i - 1) * 2.6 - 0.8, 22.2], [21 * o + (i - 1) * 2.6 + 0.8, 20]], 0.5, P.skin.lt));
  }
  out.push(...arc([[0.6, 18.6], [1.2, 19.6]], 0.7, P.skin.deep));
  const c = P.mouth;
  if (m === 'smile') out.push(...arc([[-3.6, 23.4], [0, 25.8], [3.6, 23.4]], 1.3, c), ...arc([[-4.6, 23], [-3.6, 23.4]], 0.8, c));
  else if (m === 'open') out.push(blob([[-4, 23], [4, 23], [3, 26.8], [0, 28], [-3, 26.8]], '#8a2a4a', 2), F(E(0, 26.6, 2, 1.1, P.tongue)), F(blob([[-3, 23.1], [3, 23.1], [2.4, 24], [-2.4, 24]], '#ffffff', 1)));
  else if (m === 'pout') out.push(...arc([[-3.2, 25.8], [0, 24], [3.2, 25.8]], 1.3, c));
  else if (m === 'wobble') out.push(...arc([[-4.4, 25], [-2.2, 23.8], [0, 25], [2.2, 23.8], [4.4, 25]], 1.1, c));
  else if (m === 'o') out.push(blob([[-2, 23], [2, 23], [2.2, 25.8], [0, 27.2], [-2.2, 25.8]], '#8a2a4a', 2), F(E(0, 26, 1, 0.6, P.tongue)));
  else if (m === 'sing') out.push(blob([[-2.6, 22.6], [2.6, 22.6], [3, 25.6], [0, 27.6], [-3, 25.6]], '#8a2a4a', 2), F(E(0, 26.2, 1.6, 0.9, P.tongue)));
  else if (m === 'yawn') out.push(blob([[-3.2, 22.2], [3.2, 22.2], [3.8, 26.8], [0, 29.4], [-3.8, 26.8]], '#8a2a4a', 2), F(E(0, 27.6, 2.2, 1.2, P.tongue)));
  else if (m === 'smirk') out.push(...arc([[-3.4, 24.4], [0.6, 25.4], [4.4, 22.8]], 1.3, c), ...arc([[4.4, 22.8], [5.2, 22.2]], 0.8, c));
  else if (m === 'grin') out.push(blob([[-4.6, 23], [4.6, 23], [3.2, 26.2], [0, 27.2], [-3.2, 26.2]], '#3a1a3a', 2), F(T([[1.8, 23.1], [3.4, 23.1], [2.6, 25.4]], '#ffffff')), F(E(-0.6, 25.8, 1.8, 0.8, P.tongue)));
  else if (m === 'flat') out.push(...arc([[-2.6, 24.6], [0, 24.8], [2.6, 24.6]], 1.2, c));
  return out;
}

// ---------- Hair ----------
// (head units; 2026-11-24 redraw, the player: "better hair bangs and hair". Each mass is one smooth
// silhouette with rounded tips (no hard corners anywhere), broken into locks by fine dark gaps that
// rise from the notches toward the part and lit by shines along the locks, as good drawn hair is.
// Hc: [light, base, shade, deep].)
const lockOf = (spine, w0, w1, c) => band(curve(spine, 4), w0, w1, c, true);
// A lens-shaped streak (a shine, or a dark gap between locks): fattest in the middle, softly pointed
// at both ends, bowed to one side.
const lens = ([x0, y0], [x1, y1], w, bow, c) => {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const [nx, ny] = [-(y1 - y0) / len, (x1 - x0) / len];
  const mx = (x0 + x1) / 2 + nx * bow;
  const my = (y0 + y1) / 2 + ny * bow;
  return F(blob([[x0, y0], [mx + nx * w * 0.5, my + ny * w * 0.5], [x1, y1], [mx - nx * w * 0.5, my - ny * w * 0.5]], c, 2));
};
const toward = ([x, y], [px, py], t) => [x + (px - x) * t, y + (py - y) * t];

// The long hair behind: one mass from the crown flaring out past the shoulders, its ends in six soft
// rounded locks, the outer two curling in; fine dark gaps rising from between the ends; a shine down
// each side; a deeper shade in its middle (behind her neck).
// (its ends, left to right: the outer lock curling in, three big rounded locks, the other outer
// lock curling in)
const BACK_ENDS = [[-51, 56], [-49, 68], [-43, 74], [-37, 71], [-36, 64], [-31, 76], [-23, 85], [-15, 81], [-12, 72], [-5, 87], [2, 91], [9, 86], [12, 72], [16, 80], [24, 85], [31, 76], [36, 64], [37, 71], [43, 74], [49, 68], [51, 56]];
const BACK_NOTCH = [[-36, 64], [-12, 72], [12, 72], [36, 64]];
const hairBack = (Hc) => [
  blob([[0, -48], [-30, -36], [-42, -14], [-48, 12], [-51, 38], ...BACK_ENDS, [51, 38], [48, 12], [42, -14], [30, -36]], Hc[1], 3),
  // (the curls' undersides in shade)
  ...[-1, 1].map((o) => F(blob([[44 * o, 64], [47 * o, 69], [42 * o, 72], [38 * o, 69]], Hc[2], 2))),
  F(blob([[-22, 10], [-26, 46], [-14, 64], [0, 68], [14, 64], [26, 46], [22, 10], [0, 20]], Hc[2], 4)),
  ...BACK_NOTCH.map(([x, y]) => lens([x, y - 1], toward([x, y], [x * 0.6, 0], 0.62), 2, x > 0 ? 1 : -1, Hc[2])),
  ...[[-44, -4, -50, 44], [44, -4, 50, 44]].map(([x0, y0, x1, y1]) => lens([x0, y0], [x1, y1], 3.4, x0 < 0 ? 2.2 : -2.2, Hc[0])),
  ...[[-34, 10, -38, 50], [34, 10, 38, 50]].map(([x0, y0, x1, y1]) => lens([x0, y0], [x1, y1], 1.6, x0 < 0 ? 1.4 : -1.4, Hc[0])),
];
// The bangs: parted high on her near side, swept across her brow toward the far side in soft
// rounded locks, longest at the far temple, the tips leaning the way they sweep; a soft shadow they
// cast on her brow; dark gaps rising from the notches toward the part, a shine down each lock; the
// part; the angel ring round the crown; one fine wisp falling between her eyes.
const PART = [15, -47];
const BANG_EDGE = [[-37, -10], [-31, 4], [-25, -11], [-17, 2.6], [-11, -12.4], [-3, 0.8], [1.6, -14], [9, -3], [13, -16.4], [20.6, -6], [24.6, -17], [30.6, -4], [37, -12]];
const bangs = (Hc, skinSh) => {
  const crown = [[37, -12], [36, -26], [26, -42], [0, -50], [-26, -42], [-36, -26]];
  const out = [];
  // (the shadow on her brow, under the edge)
  out.push(F(blob([...BANG_EDGE.map(([x, y]) => [x + 0.6, y + 2]), [37, -18], [-37, -18]], skinSh, 2)));
  out.push(blob([...BANG_EDGE, ...crown], Hc[1], 2));
  // (a fine shaded rim along the edge, so the locks read against her face)
  out.push(...band(curve(BANG_EDGE.slice(1, -1).map(([x, y]) => [x, y - 0.7]), 4), 0.9, 0.9, Hc[2], true));
  // dark gaps from the notches toward the part; shines down the locks
  BANG_EDGE.forEach((p, i) => {
    if (i === 0 || i === BANG_EDGE.length - 1) return;
    if (i % 2 === 0) out.push(lens(toward(p, PART, 0.06), toward(p, PART, 0.6), 1.7, -0.8, Hc[2]));
    else out.push(lens(toward(p, PART, 0.2), toward(p, PART, 0.55), 1.6, -0.6, Hc[0]));
  });
  // the part
  out.push(lens([PART[0] + 0.6, PART[1] - 1], [PART[0] - 1.6, PART[1] + 9], 1.4, 0.4, Hc[3]));
  // the angel ring: a glossy band round the crown in three pieces, a bright core
  out.push(lens([-29, -30], [-15, -39], 3.2, -1.3, Hc[0]), lens([-10, -41], [5, -41.6], 3.2, -1.5, Hc[0]), lens([10, -40.6], [24, -34], 3, -1.3, Hc[0]));
  out.push(lens([-7, -42], [2, -42.4], 1.2, -0.6, '#ffffff'));
  // the wisp between her eyes
  out.push(...lockOf([[6, -20], [4, -11], [1, -4], [2.4, 0.4]], 3.6, 1.4, Hc[1]), lens([5.6, -18], [2.6, -6], 0.9, -0.3, Hc[0]));
  return out;
};
// A side lock (o: -1 far, 1 near), from the temple down past the cheek to the jaw in a soft S, its
// tip curling in; a dark gap and a shine down it.
const sideLock = (o, Hc) => {
  const sp = [[31 * o, -16], [37 * o, -4], [38 * o, 10], [40 * o, 24], [38 * o, 36], [32 * o, 41]];
  return [
    ...lockOf(sp.map(([x, y]) => [x + 1.4 * o, y + 1.6]), 11.6, 2.8, Hc[2]),
    ...lockOf(sp, 12, 2.6, Hc[1]),
    lens([36 * o, -2], [38.6 * o, 26], 1.2, 0.8 * o, Hc[2]),
    lens([33.4 * o, -8], [35 * o, 12], 1.6, -0.8 * o, Hc[0]),
  ];
};
// The little curl standing up on top: a soft leaf of hair curling over.
const AHOGE = (Hc) => [...lockOf([[2, -46], [0, -55], [5, -61], [11, -60], [12, -55]], 4.2, 1.8, Hc[1]), lens([1.4, -52], [6, -59.6], 0.9, -0.4, Hc[0])];

// ---------- Their pieces ----------
const caches = new Map();
function design(P, faces, mood) {
  const key = mood in faces ? mood : 'idle';
  const cache = caches.get(P) ?? caches.set(P, new Map()).get(P);
  if (cache.has(key)) return cache.get(key);
  const f = faces[key];
  const Hc = P.hair;
  const [dL, dB, dS, dT] = P.dress;
  const body = blankBody('spirit', { tpose: false, guides: false });
  const recolor = (list, pal) => list.map((sh) => ({ ...sh, c: { [BLANK.lt]: pal[0], [BLANK.base]: pal[1], [BLANK.sh]: pal[2], [BLANK.deep]: pal[3] }[sh.c] ?? sh.c }));
  // a puffed sleeve at a shoulder: gathered, a lace edge, a bow on the outside
  const sleeve = (k) => {
    const x = k === 'N' ? 119 : 93;
    const o = k === 'N' ? 1 : -1;
    return [
      blob([[x - 7, 99], [x + o, 95.6], [x + 8, 100], [x + 8.4 * o, 108], [x, 111.4], [x - 7 * o, 108]], dB, 2),
      F(blob([[x - 3 * o, 98], [x + 3 * o, 97.6], [x + 6 * o, 102], [x + 2 * o, 101]], dL, 2)), F(blob([[x - 5 * o, 106], [x + 6 * o, 106], [x + 4 * o, 109.6], [x - 3 * o, 109.6]], dS, 2)),
      ...Array.from({ length: 5 }, (_, i) => E(x - 5.6 + i * 2.8, 111 + Math.sin(i * 1.3) * 0.3, 1.6, 1.3, P.lace)),
      blob([[x + 6 * o, 101], [x + 10 * o, 98.6], [x + 10.6 * o, 102.4]], P.sash[0], 1), blob([[x + 6 * o, 101], [x + 9.6 * o, 104.6], [x + 6.4 * o, 105]], P.sash[0], 1), E(x + 6 * o, 101.2, 1.2, 1.2, P.sash[1]),
    ];
  };
  // a ribbon round the wrist, its two little ends
  const cuff = (k) => {
    const el = k === 'N' ? [120.2, 119] : [89.8, 119];
    const wr = k === 'N' ? [120.5, 136] : [89.5, 136];
    const c = [el[0] + (wr[0] - el[0]) * 0.82, el[1] + (wr[1] - el[1]) * 0.82];
    return [...band([[c[0] - 3.4, c[1]], [c[0] + 3.4, c[1]]], 2.4, 2.4, P.sash[0], true), F(E(c[0] + 0.6, c[1] - 0.4, 1.4, 0.5, P.lace)), blob([[c[0] + 2.4, c[1]], [c[0] + 4.4, c[1] + 3.6], [c[0] + 2.6, c[1] + 3.8]], P.sash[1], 1)];
  };
  const groups = {
    hairB: inHead([...hairBack(Hc), ...P.sparkles.map(([x, y, r]) => softStar(x, y, r, '#fff6c8', x * 0.05))]),
    // the wisp: the base's in her tones, a glowing middle, soft bands along it, a curl, motes
    lower: [
      ...recolor(body.groups.lower, P.wisp),
      F(blob([[98, 140], [114, 140], [116, 156], [110, 172], [100, 168], [96, 154]], P.wisp[0], 3)),
      ...band(curve([[96, 140], [92, 156], [88, 170], [82, 180]], 3), 2.4, 0.8, P.glow, true),
      ...band(curve([[112, 144], [114, 158], [108, 172], [100, 180]], 3), 1.8, 0.6, P.wisp[2], true),
      ...band(curve([[104, 146], [104, 160], [100, 174]], 3), 1, 0.4, P.wisp[0], true),
      ...[[100, 152, 1.8], [110, 162, 1.4], [94, 170, 1.2]].map(([x, y, r]) => softStar(x, y, r, P.mote, x * 0.1)),
    ],
    // the sash's bow at her back, its two long tails trailing (seen past her sides)
    sash: [
      ...band(curve([[100, 120], [92, 134], [86, 150], [82, 166]], 4), 4.6, 3.6, P.sash[1], true), blob([[78, 164], [86, 164], [84, 172], [82, 168], [80, 172]], P.sash[1], 1),
      ...band(curve([[112, 120], [118, 136], [122, 152], [126, 164]], 4), 4.6, 3.6, P.sash[0], true), blob([[122, 162], [130, 162], [129, 170], [126, 166], [123, 170]], P.sash[0], 1),
      ...arc([[113, 124], [118.6, 138], [122, 150]], 0.7, P.lace),
    ],
    dressTop: [
      blob([[92, 100], [120, 100], [122.4, 119], [89.6, 119]], dB, 1),
      F(blob([[96, 102], [103, 102], [100, 118], [93.6, 118]], dL, 1)), F(blob([[116, 103], [120, 104], [121, 118], [114, 118]], dS, 1)),
      // the lace collar, scalloped, and the pendant on its ribbon
      blob([[92, 98.6], [106, 106.4], [120, 98.6], [121, 103], [106, 110.6], [91, 103]], P.lace, 2),
      ...Array.from({ length: 6 }, (_, i) => E(93.8 + i * 4.9 - (i > 2 ? -0.2 : 0), 103.6 + Math.abs(i - 2.5) * -1.2 + 2.6, 1.7, 1.5, P.lace)),
      ...arc([[94, 101.4], [106, 108.4], [118, 101.4]], 0.6, dS),
      ...P.pendant(106, 112.6),
      // a row of little star buttons
      ...[115.8].map((y) => softStar(106, y, 1.3, dT)),
    ],
    dressSkirt: [
      // the tulle underskirt, longer, peeking out under the hem
      blob([[88, 122], [124, 122], [130, 146], [82, 146]], P.tulle, 1),
      ...Array.from({ length: 7 }, (_, i) => E(84 + i * 7.3, 146, 3.8, 2.6, P.tulle)),
      // the overskirt
      blob([[89.6, 117], [122.4, 117], [127, 140], [85, 140]], dB, 1),
      ...Array.from({ length: 6 }, (_, i) => E(88 + i * 7, 140, 4, 3, dB)),
      F(blob([[94, 121], [101, 121], [97, 141], [89, 141]], dL, 1)), F(blob([[116, 121], [121, 121], [124, 140], [116, 140]], dS, 1)),
      // stars stitched round the hem, a lace edge
      ...[[90, 136], [99, 138.6], [108, 137], [117, 138.6], [124, 136]].map(([x, y], i) => softStar(x, y, 1.9, dT, i * 0.4)),
      ...Array.from({ length: 12 }, (_, i) => E(86.4 + i * 3.6, 142.6, 1.4, 1.1, P.lace)),
      // the sash round the waist, the bow's knot showing in front
      blob([[89.6, 116.4], [122.4, 116.4], [122.6, 122], [89.4, 122]], P.sash[0], 1), F(blob([[90, 120.4], [122, 120.4], [122, 122], [90, 122]], P.sash[1], 1)),
      blob([[106, 119], [100, 115.4], [98.6, 120.6], [102, 122.6]], P.sash[0], 1), blob([[106, 119], [112, 115.4], [113.4, 120.6], [110, 122.6]], P.sash[0], 1), E(106, 119.4, 2.2, 2.2, P.sash[1]),
    ],
    sleeveFu: sleeve('F'),
    sleeveNu: sleeve('N'),
    cuffF: cuff('F'),
    cuffN: cuff('N'),
    head: inHead([...face(P, f), ...bangs(Hc, P.skin.sh), ...P.clip(27, -32)]),
    lockF: inHead(sideLock(-1, Hc)),
    lockN: inHead(sideLock(1, Hc)),
    ahoge: inHead(AHOGE(Hc)),
  };
  cache.set(key, groups);
  return groups;
}
export const dayDesign = (mood = 'idle') => design(DAY, DAY_FACES, mood);
export const nightDesign = (mood = 'idle') => design(NIGHT, NIGHT_FACES, mood);
// Joints of their own, in base units: her mouth; the side locks' roots; the curl's root; the sash's
// knot; the crown (a star floats over it).
export const MOUTH = [106, 88];
export const LOCK_F = H2B([-31, -14]);
export const LOCK_N = H2B([31, -14]);
export const AHOGE_ROOT = H2B([2, -46]);
export const SASH = [106, 119];
export const CROWN = H2B([-14, -72]);
