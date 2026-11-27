// The Mint Wrapper's design (2026-11-25, the Peppermint Spinner remade on the kid base, the player's
// pick "B" of three): a cheeky little kid of Queen Bonbon's bakery who never took their sweet wrapper
// off. A clear crinkly cellophane hood twisted shut at both sides into two frilly wrapper twists
// (like ears), mint-green hair under it (an even blunt fringe since 2026-11-27); the round peppermint itself worn as a tunic, its red
// swirl turning as they go; the wrapper's crinkly cape behind, twisted at its tail; mint shorts,
// candy-stripe socks, red sneakers; cherry-red eyes, a fang grin.
// Each piece, in the kid base's own units (blankbase.js, read only), named for the bone it rides on:
//   capeB      the wrapper cape behind them (on a spring); capeTwist its twisted tail (a spring)
//   hoodB      the hood behind the head; hairB the hair under it
//   head       the face (each expression), the even blunt bangs
//   hoodF      the hood's crinkled front edge, framing the face
//   twistF/N   the hood's two wrapper twists, at the sides of the head (on springs)
//   sleeveFu/Nu  short mint puff sleeves with a red trim
//   shorts     mint shorts
//   tunic      the cellophane rim round the peppermint, the collar
//   mint       the peppermint swirl itself (it spins)
//   shinFc/Nc  candy-stripe socks; footFc/Nc red sneakers with white toes and laces
// Everything drawn here from scratch (nothing of the player character's: the player's rule).
import { E, T, F } from '../mobs/kit.js';
import { CX, G, band, curve, blob, HS, mapShape } from '../mobs/kidbase.js';
import { BLANK_J } from '../mobs/blankbase.js';

const HX = CX + 1;
const NECK = 83;
const HY0 = NECK - 31 * HS;
const H2B = ([x, y]) => [HX + x * HS, HY0 + y * HS];
const inHead = (list) => list.map((sh) => mapShape(sh, H2B, HS));
const J = BLANK_J;
const arc = (pts, w, c) => band(curve(pts, 3), w, w, c, true);
const lockOf = (spine, w0, w1, c) => band(curve(spine, 4), w0, w1, c, true);
const lens = ([x0, y0], [x1, y1], w, bow, c) => {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const [nx, ny] = [-(y1 - y0) / len, (x1 - x0) / len];
  const mx = (x0 + x1) / 2 + nx * bow;
  const my = (y0 + y1) / 2 + ny * bow;
  return F(blob([[x0, y0], [mx + nx * w * 0.5, my + ny * w * 0.5], [x1, y1], [mx - nx * w * 0.5, my - ny * w * 0.5]], c, 2));
};
const toward = ([x, y], [px, py], t) => [x + (px - x) * t, y + (py - y) * t];

export const SKIN_COLORS = { lt: '#fffaf6', base: '#fff0e8', sh: '#f8d4c8', deep: '#eab4a6' };
const SK = SKIN_COLORS;
export const C = {
  hair: ['#e8fff4', '#8ee0bc', '#58bc94', '#3a9474'],
  red: ['#ff7a8a', '#e8304a', '#b81e36'],
  cel: ['#ffffff', '#e6f6ff', '#c4e2f4', '#9cc8e4'],
  mint: ['#d8fff0', '#8ee0bc', '#58bc94'],
};
const Hc = C.hair;

// A peppermint swirl: a white disc with `n` red bands curving out from the middle like a pinwheel,
// a shine.
export function swirl(x, y, r, n, red, white, sy = 1, rot = 0) {
  const P = (a, rr) => [x + Math.cos(a) * rr, y + Math.sin(a) * rr * sy];
  const res = [E(x, y, r, r * sy, white)];
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * Math.PI * 2;
    const w = (Math.PI / n) * 0.9;
    const pts = [];
    for (let k = 0; k <= 6; k++) pts.push(P(a0 + k * 0.16, (k / 6) * r * 0.98));
    for (let k = 6; k >= 0; k--) pts.push(P(a0 + w + k * 0.16, (k / 6) * r * 0.98));
    res.push(F(blob(pts, red, 1)));
  }
  res.push(F(E(x, y, r * 0.14, r * 0.14 * sy, red)));
  return res;
}
// A wrapper twist: cellophane pinched into a twist, fanning out into a crinkled frill (dir: which
// way it points; s its size).
function twist(x, y, dir, s) {
  const [c, sh] = [C.cel[1], C.cel[3]];
  const P = (u, v) => [x + u * dir * s, y + v * s];
  return [
    blob([P(0, -1.4), P(3, -0.6), P(3, 0.6), P(0, 1.4)], c, 1),
    blob([P(2.6, -0.5), P(6, -3.6), P(6.8, -2), P(7.2, 0), P(6.8, 2), P(6, 3.6), P(2.6, 0.5)], c, 2),
    ...arc([P(3.4, 0), P(6.4, -2.6)], 0.4 * s, sh), ...arc([P(3.4, 0), P(6.8, 0)], 0.4 * s, sh), ...arc([P(3.4, 0), P(6.4, 2.6)], 0.4 * s, sh),
    ...arc([P(1, -0.9), P(2.2, 0.9)], 0.3 * s, C.cel[2]),
    F(E(...P(1.4, -0.6), 0.9 * s, 0.4 * s, '#ffffff')), F(E(...P(5.4, -2), 0.7 * s, 0.4 * s, '#ffffff')),
  ];
}
const rotAbout = (list, [cx, cy], deg) => {
  const a = (deg * Math.PI) / 180;
  const [c, s] = [Math.cos(a), Math.sin(a)];
  return list.map((sh) => mapShape(sh, ([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c], 1));
};

// ---------- Faces (head units) ----------
const FACES = {
  idle: { e: 'open', m: 'grin', b: 'cheek' }, blink: { e: 'blink', m: 'grin', b: 'cheek' }, happy: { e: 'happy', m: 'open', b: 'up' },
  angry: { e: 'fierce', m: 'snarl', b: 'cross' }, hurt: { e: 'squeeze', m: 'wobble', b: 'worry' }, dead: { e: 'squeeze', m: 'wobble', b: 'worry' },
  shout: { e: 'fierce', m: 'shout', b: 'cross' }, sleep: { e: 'sleepy', m: 'small', b: 'soft' }, dizzy: { e: 'dizzy', m: 'wobble', b: 'worry' },
  wink: { e: 'wink', m: 'grin', b: 'cheek' }, o: { e: 'wide', m: 'o', b: 'up' }, proud: { e: 'happy', m: 'grin', b: 'up' },
  worry: { e: 'open', m: 'wobble', b: 'worry' },
};
export const MOODS = Object.keys(FACES);
const EYE = { ring: '#5a0e1a', iris: '#f0405a', light: '#ffd0d8', dark: '#a81a32', ink: '#3a2430', low: '#e8b8b0', crease: '#f4d8d0' };
function eye(x, y, o, lid = 0, big = 0) {
  const k = EYE;
  const w = 7.6 + big;
  const h = 7.8 + big;
  const r = 5.6 + big * 0.6;
  const P = (u, v) => [x + u * o, y + v];
  const out = [];
  out.push(...arc([P(-w * 0.7, -h - 2.6), P(0, -h - 3.6), P(w * 0.8, -h - 2.4)], 0.8, k.crease));
  out.push(blob([P(-w, 0.6), P(-w * 0.55, -h), P(w * 0.4, -h - 0.4), P(w, -h * 0.4), P(w * 0.75, h * 0.8), P(0, h + 0.6), P(-w * 0.75, h * 0.7)], '#ffffff', 2));
  out.push(F(E(x, y + 0.4, r, r * 1.18, k.ring)), F(E(x, y + 0.8, r - 0.9, r * 1.18 - 0.9, k.iris)), F(E(x, y + r * 0.62, r - 1.8, r * 0.46, k.light)), F(E(x, y - r * 0.5, r - 1.2, r * 0.4, k.dark)));
  out.push(...arc([[x - r * 0.62, y + r * 0.5], [x, y + r * 0.98], [x + r * 0.62, y + r * 0.5]], 0.6, k.light));
  out.push(F(E(x, y + 0.6, 1.8, 2.3, '#2a0a14')), F(E(x - 2 * o, y - 2.4, 2.1, 1.8, '#ffffff')), F(E(x + 2.1 * o, y + 2.9, 1, 1, '#ffffff')));
  out.push(F(T([P(1.6, -3.8), P(2.1, -2.8), P(3.1, -2.4), P(2.1, -2), P(1.6, -1), P(1.1, -2), P(0.1, -2.4), P(1.1, -2.8)], '#ffffff')));
  if (lid > 0) out.push(F(blob([P(-w - 0.8, -0.2), P(-w * 0.5, -h - 2.2), P(w * 0.5, -h - 2.6), P(w + 0.8, -h * 0.6), P(w * 0.4, -h + lid), P(-w * 0.5, -h + lid + 0.4)], SK.base, 2)));
  out.push(...band(curve([P(-w - 0.4, 0.4), P(-w * 0.5, -h - 0.4 + lid), P(w * 0.45, -h - 0.8 + lid), P(w + 0.6, -h * 0.4)], 3), 1.6, 2.8, k.ink, true));
  // (two short round-tipped flicks at the outer corner, grown from the lash line; no lower lid)
  for (let i = 0; i < 2; i++) out.push(...band(curve([P(w * (0.7 + i * 0.22), -h * (0.78 - i * 0.3) + lid * 0.5), P(w * (0.98 + i * 0.22), -h * (0.98 - i * 0.26)), P(w * (1.14 + i * 0.2), -h * (1.08 - i * 0.24))], 3), 1.1, 0.9, k.ink, true));
  return out;
}
const shut = (x, o, kind) => {
  const ink = EYE.ink;
  if (kind === 'happy') return [...band(curve([[x - 7.2, 14], [x, 7], [x + 7.2, 14]], 3), 1.8, 2.4, ink, true), ...arc([[x + 6.2 * o, 12.6], [x + 9.4 * o, 10.8]], 0.9, ink), ...arc([[x + 4.8 * o, 10.4], [x + 7.6 * o, 8.2]], 0.8, ink)];
  if (kind === 'squeeze') return [...arc([[x - 6.4 * o, 8.6], [x + 5 * o, 12.6], [x - 6.4 * o, 16.4]], 2.2, ink)];
  if (kind === 'sleepy') return [...band(curve([[x - 7.2, 12.6], [x, 14.8], [x + 7.2, 12.6]], 3), 1.6, 2.4, ink, true)];
  if (kind === 'dizzy') {
    // (a swirl, round and round: they've spun themselves silly)
    const pts = Array.from({ length: 22 }, (_, i) => {
      const a = i * 0.62 * o;
      const rr = 0.8 + i * 0.3;
      return [x + Math.cos(a) * rr, 12 + Math.sin(a) * rr];
    });
    return [blob([[x - 7.6, 12.6], [x - 4, 5], [x + 4, 5], [x + 7.6, 12.6], [x + 4, 19], [x - 4, 19]], '#ffffff', 2), ...band(curve(pts, 2), 0.9, 1.3, C.red[1], true)];
  }
  return [...band(curve([[x - 7.4, 12.4], [x, 15], [x + 7.4, 12.4]], 3), 1.6, 2.4, ink, true), ...arc([[x + 6.6 * o, 12.8], [x + 9.6 * o, 11.2]], 0.9, ink)];
};
const brows = (b) => {
  const c = Hc[3];
  const one = (o) => {
    const P = (u, v) => [14 * o + u * o, v];
    if (b === 'up') return arc([P(-6, -3.4), P(0, -5.8), P(6, -4.2)], 1.5, c);
    if (b === 'cross') return arc([P(-6, -5), P(0, -3), P(6, -0.6)], 1.7, c);
    if (b === 'worry') return arc([P(-6, -1), P(0, -3), P(6, -5)], 1.5, c);
    if (b === 'soft') return arc([P(-6, -2), P(0, -3.4), P(6, -2.6)], 1.4, c);
    // (cheeky: one brow up)
    return o > 0 ? arc([P(-6, -4), P(0, -6), P(6, -4)], 1.5, c) : arc([P(-6, -2.6), P(0, -4.4), P(6, -3.2)], 1.5, c);
  };
  return [...one(-1), ...one(1)];
};
function mouth(m) {
  const fang = F(T([[1.6, 23.2], [3, 23.2], [2.4, 25]], '#ffffff'));
  if (m === 'grin') return [blob([[-4.6, 22.6], [4.6, 22.4], [3.4, 26.6], [0, 27.8], [-3.4, 26.6]], '#8a2a3a', 2), F(E(0.4, 26.6, 2, 0.9, '#ff8a9e')), F(blob([[-3.8, 22.7], [3.8, 22.5], [3.4, 23.4], [-3.4, 23.6]], '#ffffff', 1)), fang];
  if (m === 'open' || m === 'shout') return [blob([[-4.4, 22.2], [4.4, 22.2], [3.8, 27.6], [0, 29.2], [-3.8, 27.6]], '#8a2a3a', 2), F(E(0, 27.4, 2.2, 1.1, '#ff8a9e')), F(blob([[-3.6, 22.3], [3.6, 22.3], [3.2, 23.2], [-3.2, 23.2]], '#ffffff', 1)), fang];
  if (m === 'snarl') return [blob([[-4.6, 23.4], [4.6, 22.6], [3.6, 26], [0, 26.6], [-3.6, 26]], '#8a2a3a', 2), F(blob([[-3.8, 23.5], [3.8, 22.8], [3.4, 23.9], [-3.4, 24.5]], '#ffffff', 1)), fang];
  if (m === 'wobble') return [...arc([[-4.4, 25], [-2.2, 23.8], [0, 25], [2.2, 23.8], [4.4, 25]], 1.2, '#8a2a3a')];
  if (m === 'o') return [F(E(0, 25, 2, 2.4, '#8a2a3a')), F(E(0, 26, 1.2, 0.8, '#ff8a9e'))];
  return [...arc([[-2.4, 24.6], [0, 25.6], [2.4, 24.6]], 1.1, '#8a2a3a')];
}
function face(f) {
  const { e } = f;
  const out = [blob([[-33, -14], [-34, 6], [-29, 22], [-17, 31], [0, 34], [17, 31], [29, 22], [34, 6], [33, -14], [0, -30]], SK.base, 4), F(blob([[-33, -6], [-31, 16], [-26, 24], [-29, 10]], SK.sh, 2))];
  out.push(...brows(f.b));
  if (e === 'open' || e === 'fierce' || e === 'wide') {
    const lid = e === 'fierce' ? 3 : 0;
    const big = e === 'wide' ? 0.8 : 0;
    out.push(...eye(-14, 12, -1, lid, big), ...eye(14, 12, 1, lid, big));
  } else if (e === 'wink') out.push(...eye(-14, 12, -1), ...shut(14, 1, 'happy'));
  else out.push(...shut(-14, -1, e), ...shut(14, 1, e));
  for (const o of [-1, 1]) {
    out.push(F(E(21 * o, 21, 5.4, 3, '#ffb0bc')));
    for (let i = 0; i < 3; i++) out.push(...arc([[21 * o + (i - 1) * 2.6 - 0.8, 22.2], [21 * o + (i - 1) * 2.6 + 0.8, 20]], 0.5, SK.lt));
  }
  out.push(...arc([[0.6, 18.6], [1.2, 19.6]], 0.7, SK.deep));
  out.push(...mouth(f.m));
  return out;
}

// ---------- Hair (head units) ----------
// The hair under the hood, behind the face: short, rounded ends.
const hairBack = () => [
  blob([[0, -46], [-32, -36], [-42, -14], [-46, 10], [-42, 18], [-38, 26], [-31, 22], [-26, 28], [26, 28], [31, 22], [38, 26], [42, 18], [46, 10], [42, -14], [32, -36]], Hc[1], 3),
  F(blob([[-20, 6], [-24, 22], [0, 28], [24, 22], [20, 6], [0, 14]], Hc[2], 4)),
  lens([-42, -6], [-43, 16], 2.6, 1.6, Hc[0]), lens([42, -6], [43, 16], 2.6, -1.6, Hc[0]),
];
// The bangs (2026-11-27, rebuilt to the player's hair rules: the old messy spiky bangs went): an even
// blunt cut in five sections, the middle one the widest, curving like a U from just above the brows in
// the middle up toward the temples, stopping well above the lashes; each section's end trimmed flat with
// soft round corners, a deeper tone up in the little gaps between them; a soft shadow on the brow; one
// shared light from the crown and one broken shine band across them all; short side locks outside the
// eyes, curling in at the cheeks.
const PART = [-4, -50];
const CUT = (x) => -2.6 - 5.6 * (x / 34) ** 2;
const SECTIONS = [[-35, -21], [-21, -8], [-8, 9], [9, 22], [22, 35]];
function bangs() {
  const out = [];
  // the shadow the cut casts on the brow (the skin's own shade, offset down)
  out.push(F(blob([[-34, CUT(-34) - 4], [-17, CUT(-17) + 1.4], [0, CUT(0) + 2.2], [17, CUT(17) + 1.4], [34, CUT(34) - 4], [34, -16], [-34, -16]], SK.sh, 2)));
  // the crown: one smooth cap of hair down to the cut
  out.push(blob([[36, -12], [30, -38], [12, -50], [-12, -50], [-30, -38], [-36, -12], [-34, CUT(-34) - 1], [0, CUT(0) - 1], [34, CUT(34) - 1]], Hc[1], 3));
  // the deeper tone seen up in the gaps between sections
  out.push(...band(curve([-30, -15, 0, 15, 30].map((x) => [x, CUT(x) - 1.4]), 4), 2.6, 2.6, Hc[2], true));
  // the five sections, each trimmed flat with soft corners
  for (const [x0, x1] of SECTIONS) {
    const mx = (x0 + x1) / 2;
    out.push(blob([[x0 + 0.6, -30], [x1 - 0.6, -30], [x1 - 0.2, CUT(x1) - 0.8], [mx + (x1 - x0) * 0.3, CUT(mx) + 0.2], [mx - (x1 - x0) * 0.3, CUT(mx) + 0.2], [x0 + 0.2, CUT(x0) - 0.8]], Hc[1], 2));
  }
  // one shared light from the crown, fading down; a soft deeper rim along the cut
  out.push(F(blob([[-26, -38], [-10, -47], [10, -47], [26, -38], [18, -31], [0, -34], [-18, -31]], '#a8e8ca', 3)));
  for (const [x0, x1] of SECTIONS) {
    const mx = (x0 + x1) / 2;
    out.push(...arc([[x0 + 1.4, CUT(x0 + 1.4) - 0.6], [mx, CUT(mx) - 0.4], [x1 - 1.4, CUT(x1 - 1.4) - 0.6]], 0.8, Hc[2]));
  }
  // each split carried up toward the crown as a fading line
  for (const [x0] of SECTIONS.slice(1)) out.push(lens(toward([x0, CUT(x0) - 1], PART, 0.04), toward([x0, CUT(x0) - 1], PART, 0.42), 1.1, -0.3, Hc[2]));
  // the shine: a broken band of a few soft slivers across the sections
  for (const [x0, x1] of [[-26, -16], [-11, 2], [7, 16], [21, 28]]) out.push(lens([x0, -21 + Math.abs(x0) * 0.08], [x1, -21.6 + Math.abs(x1) * 0.08], 1.5, -0.5, '#f4fffa'));
  // side locks, short, curling in at the cheeks (outside the eyes)
  for (const o of [-1, 1]) {
    const sp = [[31, -14], [36, -2], [36, 10], [33, 18], [29, 22]].map(([x, y]) => [x * o, y]);
    out.push(...lockOf(sp.map(([x, y]) => [x + 1.4 * o, y + 1.6]), 8.6, 2.6, Hc[2]), ...lockOf(sp, 9, 2.6, Hc[1]), lens(sp[1], sp[3], 1.4, -0.8 * o, Hc[0]));
  }
  return out;
}
// The hood: behind the head, and its crinkled front edge round the face.
const HOOD_BACK = () => [
  blob([[-44, 30], [-48, -10], [-36, -42], [0, -56], [36, -42], [48, -10], [44, 30], [0, 36]], C.cel[1], 3),
  F(blob([[-36, 24], [-40, -8], [-30, -36], [0, -48], [30, -36], [40, -8], [36, 24]], C.cel[2], 3)),
  lens([-40, -30], [-12, -50], 3, -1.6, C.cel[0]), lens([38, -6], [40, 20], 2, -1, C.cel[0]),
  ...[[-44, 10], [44, 10], [-20, -50], [20, -50]].flatMap(([x, y]) => arc([[x - 1.6, y - 1.6], [x + 1.6, y + 1.6]], 0.6, C.cel[3])),
];
const HOOD_FRONT = () => [
  ...band(curve([[-42, 28], [-46, -8], [-35, -40], [0, -53], [35, -40], [46, -8], [42, 28]], 4), 4, 4, C.cel[1], true),
  ...band(curve([[-40, 10], [-43, -10], [-33, -36], [-10, -48]], 4), 1, 1, C.cel[0], true),
  ...[[-44, 0], [-30, -38], [30, -38], [44, 0], [0, -53]].flatMap(([x, y]) => arc([[x - 1.6, y - 1.6], [x + 1.6, y + 1.6]], 0.6, C.cel[3])),
];
// The two wrapper twists at the sides of the hood.
const TW_F = [-46, -14];
const TW_N = [46, -14];

// ---------- Their pieces ----------
const cache = new Map();
export function mintDesign(mood = 'idle') {
  const key = mood in FACES ? mood : 'idle';
  if (cache.has(key)) return cache.get(key);
  const f = FACES[key];
  const [r0, r1, r2] = C.red;
  const [c0, c1, c2, c3] = C.cel;
  // a short mint puff sleeve over the top of an arm, a red trim
  const sleeve = (k) => {
    const sh = J[`sh${k}`];
    const el = J[`el${k}`];
    const m = [sh[0] * 0.45 + el[0] * 0.55, sh[1] * 0.45 + el[1] * 0.55];
    return [blob([[sh[0] - 5, sh[1] - 3], [sh[0] + 5, sh[1] - 3.4], [m[0] + 5, m[1]], [m[0] + 4, m[1] + 2.6], [m[0] - 4, m[1] + 2.6], [m[0] - 5, m[1]]], C.mint[1], 2), F(blob([[sh[0] - 3, sh[1] - 1.6], [sh[0] + 1, sh[1] - 2], [sh[0], sh[1] + 2], [sh[0] - 3, sh[1] + 2]], C.mint[0], 1)), ...arc([[m[0] - 4.4, m[1] + 1.6], [m[0], m[1] + 2.4], [m[0] + 4.4, m[1] + 1.6]], 1.2, r1)];
  };
  // a candy-stripe sock, knee to ankle (k: F or N), the far one a touch shaded
  const sock = (k) => {
    const [kx, ky] = J[`knee${k}`];
    const [ax, ay] = J[`ank${k}`];
    const far = k === 'F';
    const out = [...band([[kx, ky + 1], [ax, ay + 1]], 8, 7.2, far ? '#ecdee6' : '#ffffff', true)];
    for (let i = 0; i < 3; i++) {
      const y = ky + 2.6 + i * 4.6;
      out.push(F(blob([[kx - 4, y - 1], [kx + 4, y - 1.6], [kx + 3.8, y + 0.8], [kx - 3.8, y + 1.4]], far ? r2 : r1, 1)));
    }
    out.push(...band([[kx - 4, ky + 1], [kx + 4, ky + 0.6]], 1.6, 1.6, far ? r2 : r1, true));
    return out;
  };
  // a red sneaker: a white toe cap and sole stripe, white laces
  const shoe = (k) => {
    const a = J[`ank${k}`];
    const far = k === 'F';
    const [cA, cB] = far ? [r2, '#8a1428'] : [r1, r2];
    return [
      blob([[a[0] - 5, a[1] - 3], [a[0] + 6, a[1] - 3], [a[0] + 8.6, a[1] + 4], [a[0] + 7, G + 0.2], [a[0] - 5.4, G + 0.2], [a[0] - 6.2, a[1] + 3]], cA, 2),
      F(blob([[a[0] + 3.4, a[1] + 2], [a[0] + 8.2, a[1] + 3.6], [a[0] + 8, G - 2.6], [a[0] + 3, G - 2.6]], far ? '#e8dce4' : '#ffffff', 2)),
      F(blob([[a[0] - 5, G - 3.2], [a[0] + 7.6, G - 3.2], [a[0] + 7.2, G - 1.4], [a[0] - 5.2, G - 1.4]], far ? '#e8dce4' : '#ffffff', 1)),
      ...arc([[a[0] - 1, a[1] - 1], [a[0] + 3, a[1] - 1]], 0.7, '#ffffff'), ...arc([[a[0] - 1, a[1] + 1.4], [a[0] + 3.6, a[1] + 1.4]], 0.7, '#ffffff'),
      F(E(a[0] + 1, G - 0.4, 6.6, 0.8, cB)),
    ];
  };
  const groups = {
    // the wrapper cape behind, crinkly, folds and shines
    capeB: [
      blob([[63, 86], [97, 86], [102, 106], [96, 118], [80, 122], [64, 118], [58, 106]], c1, 2),
      ...[[67, 92, 62, 112], [80, 90, 80, 118], [93, 92, 98, 112]].map(([x0, y0, x1, y1]) => lens([x0, y0], [x1, y1], 2.4, 1, c2)),
      lens([61, 96], [59, 110], 2, 0.6, c0), lens([98, 96], [100, 110], 1.6, -0.6, c0),
      ...[[70, 116], [88, 117], [64, 102]].flatMap(([x, y]) => arc([[x - 1.4, y - 1.4], [x + 1.4, y + 1.4]], 0.5, c3)),
    ],
    capeTwist: rotAbout(twist(61, 114, -1, 2.3), [61, 114], -40),
    hoodB: inHead(HOOD_BACK()),
    hairB: inHead(hairBack()),
    sleeveFu: sleeve('F'),
    sleeveNu: sleeve('N'),
    shinFc: sock('F'),
    shinNc: sock('N'),
    footFc: shoe('F'),
    footNc: shoe('N'),
    shorts: [
      blob([[66, 103], [94, 103], [96.4, 114], [82, 115.4], [80, 111], [78, 115.4], [63.6, 114]], C.mint[1], 2),
      F(blob([[66, 110.4], [78.4, 110.4], [78, 115], [63.8, 114]], C.mint[2], 1)), F(blob([[84, 105], [93, 105], [94, 108], [84, 108]], C.mint[0], 1)),
      ...arc([[64, 113.4], [72, 114.6], [79, 114.8]], 0.8, r1), ...arc([[81, 114.8], [88, 114.6], [96, 113.4]], 0.8, r1),
    ],
    // the cellophane rim round the peppermint, crinkled; a red ribbon collar with a bow
    tunic: [
      E(80, 97.6, 17.6, 15.6, c1), ...arc([[64, 92], [66, 88], [70, 86]], 0.6, c3), ...arc([[96, 104], [94, 108]], 0.6, c3), ...arc([[63.4, 100], [64, 104]], 0.6, c3),
      F(E(70, 87.6, 3, 1.2, c0)),
    ],
    mint: [...swirl(80, 98, 15, 8, r1, '#ffffff', 0.92, 0.5), ...arc([[71, 91], [76, 87.6]], 1.2, '#ffffff'), F(E(72.6, 91.4, 2.2, 1, '#ffffff'))],
    collar: [...arc([[69, 86], [80, 88.6], [91, 86]], 1.4, r1), blob([[80, 88], [76.6, 85.6], [76.4, 90], [79, 89.6]], r1, 1), blob([[80, 88], [83.4, 85.6], [83.6, 90], [81, 89.6]], r1, 1), E(80, 88, 1.3, 1.3, r2)],
    head: inHead([...face(f), ...bangs()]),
    hoodF: inHead(HOOD_FRONT()),
    twistF: inHead(twist(...TW_F, -1, 3.2)),
    twistN: inHead(twist(...TW_N, 1, 3.2)),
  };
  cache.set(key, groups);
  return groups;
}
// Joints of their own, in base units: the mouth; the cape's top and its twist's root; the middle of
// the peppermint; the hood's two twists.
export const MOUTH = H2B([0, 24]);
export const CAPE = [80, 87];
export const CAPE_TWIST = [61, 114];
export const MINT_C = [80, 98];
export const TWIST_F = H2B(TW_F);
export const TWIST_N = H2B(TW_N);
