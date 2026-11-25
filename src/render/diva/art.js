// The Masquerade Diva's design (2026-11-25, the Understudy Ghost remade on the spirit base, the
// player's pick "B" of three): the theatre's understudy, a little ghost who has borrowed the leading
// lady's costume, three sizes too big, and plays the star in it. Glossy plum hair piled high in
// curls, ringlets bouncing at her cheeks; a gold tiara that will not sit straight; a wine velvet gown
// with gold trim, slashed puffed sleeves and a train, pinned at the side to make it fit; a pink
// feather boa; lace gloves; a gold masquerade mask with feathers on a stick, held up beside her face
// (never over it). Half-lidded, confident violet eyes, a beauty mark, rouged lips.
// Each piece, in the spirit base's own drawing units (blankBody('spirit'), read only), named for the
// bone it rides on:
//   hairB      the hair behind: the curls piled high behind her crown, the back hair to her
//              shoulders in rounded curling ends
//   head       the face (each expression), the bangs (one big glossy wave swept from a part on the
//              near side, rolling under at the far temple)
//   tiara      the tiara (its own piece: it sits crooked, and she can set it straight)
//   curlF/N    a long ringlet each side, on springs of their own
//   lower      the wisp, glowing toward its middle
//   dressSkirt the gown's skirt: velvet folds, a brocade front panel, rosettes, the gold-trimmed hem
//              and its train trailing behind
//   dressTop   the bodice: a sweetheart neckline in gold, a jewel brooch, a pointed waist, the
//              safety pin holding it in
//   boa        the boa round her neck; boaN its near end over her near sleeve
//   sleeveFu/Nu  huge slashed puffed sleeves, pink lining showing, a gold band, a bow
//   gloveF/N   lace opera gloves from the elbow, frilled at the wrist
//   mask       the mask on its gold stick (pink ribbon wound round it), held in her near hand
//   plume      the mask's feathers (on a spring)
// Everything drawn here from scratch (nothing of the player character's: the player's rule).
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
const lockOf = (spine, w0, w1, c) => band(curve(spine, 4), w0, w1, c, true);
// A lens-shaped streak (a shine, a dark gap between locks, a fold): fattest in the middle, softly
// pointed at both ends, bowed to one side.
const lens = ([x0, y0], [x1, y1], w, bow, c) => {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const [nx, ny] = [-(y1 - y0) / len, (x1 - x0) / len];
  const mx = (x0 + x1) / 2 + nx * bow;
  const my = (y0 + y1) / 2 + ny * bow;
  return F(blob([[x0, y0], [mx + nx * w * 0.5, my + ny * w * 0.5], [x1, y1], [mx - nx * w * 0.5, my - ny * w * 0.5]], c, 2));
};
const toward = ([x, y], [px, py], t) => [x + (px - x) * t, y + (py - y) * t];
const softStar = (x, y, r, c, rot = 0) => blob(Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + rot + (i * Math.PI) / 5;
  const rr = i % 2 ? r * 0.5 : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c, 1);
const tube = (a, b, w0, w1, c) => [...band([a, b], w0, w1, c, true), F(E(a[0], a[1], w0 / 2, w0 / 2, c)), F(E(b[0], b[1], w1 / 2, w1 / 2, c))];
// A fluffy round puff (the boa): a scalloped edge, a lighter middle, a few fine feather strands.
const puff = (x, y, r, C, seed = 0) => {
  const n = 9;
  const edge = Array.from({ length: n * 2 }, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2 + seed;
    const rr = i % 2 ? r * 0.8 : r * (1 + 0.08 * Math.sin(i * 1.7 + seed));
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.9];
  });
  return [
    blob(edge, C[1], 2),
    F(E(x - r * 0.15, y - r * 0.2, r * 0.6, r * 0.5, C[0])),
    F(blob([[x - r * 0.8, y + r * 0.3], [x, y + r * 0.85], [x + r * 0.8, y + r * 0.3], [x, y + r * 0.55]], C[2], 2)),
    ...[-0.6, 0.1, 0.8].map((k, i) => lens([x + k * r * 0.5, y - r * 0.1], [x + k * r * 1.05, y + (i - 1) * r * 0.3 - r * 0.5], 0.6, 0.3, C[3])),
  ];
};

// Her colours. Hair [light, base, shade, deep]; velvet [light, base, shade, deep]; gold [light,
// base, shade]; boa [light, base, shade, strand].
export const SKIN_COLORS = { lt: '#ffffff', base: '#fbf4ff', sh: '#ecdef6', deep: '#d6c4ea' };
const SK = SKIN_COLORS;
const C = {
  hair: ['#c69ad8', '#6c3478', '#4e2258', '#34143e'],
  vel: ['#d66a8c', '#9a3254', '#741e3c', '#561228'],
  gold: ['#fff0b0', '#ffd36a', '#d8a040'],
  boa: ['#ffeef4', '#ffc4da', '#f6a0c2', '#ffffff'],
  lining: ['#ffd8e6', '#ffaccb'],
  glove: ['#ffffff', '#f6eefc', '#ddd0ec'],
  wisp: ['#fbf4ff', '#ecdcf8', '#d4bcec', '#b89cdc'],
  panel: ['#ffd0de', '#f0a0bc', '#d87a9c'],
  gem: ['#e6fcff', '#7ae0e8', '#3aa8b8'],
  pink: '#ff8ab0',
  violet: '#b890ff',
};
export const GOLD = C.gold;

// ---------- Faces ----------
// e the eyes, m the mouth, b the brows: a diva's, confident and a little smug.
const FACES = {
  idle: { e: 'half', m: 'smile', b: 'arch' }, blink: { e: 'blink', m: 'smile', b: 'arch' }, happy: { e: 'happy', m: 'open', b: 'up' },
  angry: { e: 'fierce', m: 'grit', b: 'cross' }, hurt: { e: 'squeeze', m: 'wobble', b: 'worry' }, o: { e: 'wide', m: 'o', b: 'up' },
  sing: { e: 'happy', m: 'sing', b: 'up' }, belt: { e: 'squeeze', m: 'belt', b: 'up' }, pout: { e: 'half', m: 'pout', b: 'worry' },
  kiss: { e: 'wink', m: 'kiss', b: 'arch' }, smug: { e: 'half', m: 'smirk', b: 'arch' }, sleepy: { e: 'sleepy', m: 'flat', b: 'soft' },
};
export const MOODS = Object.keys(FACES);
const EYE = { ring: '#3a1a4a', iris: '#a85ad8', light: '#ecd0ff', dark: '#6a2a98', pupil: '#1e0e2a', ink: '#2a1830', low: '#c8a8d8', crease: '#e6d0f0', shadow: '#e2c4f2' };

// A rich eye (head units): violet shadow on the lid, a soft crease, the white, a ring, the iris in
// three tones with a lighter rim at its foot, the pupil, two highlights and a star glint; the upper
// lid line, heavy at the outer corner, with four long lashes (lowered by `lid`); the lower lid, two
// little lashes.
function eye(x, y, o, lid = 0, big = 0) {
  const k = EYE;
  const w = 7.8 + big;
  const h = 7.2 + big;
  const r = 5.4 + big * 0.6;
  const P = (u, v) => [x + u * o, y + v];
  const out = [];
  out.push(F(blob([P(-w * 0.9, -h * 0.2 + lid * 0.3), P(-w * 0.5, -h - 3 + lid * 0.4), P(w * 0.5, -h - 3.4 + lid * 0.4), P(w * 1.05, -h * 0.5), P(w * 0.6, -h * 0.3), P(-w * 0.5, -h * 0.4)], k.shadow, 2)));
  out.push(...arc([P(-w * 0.7, -h - 2.8 + lid * 0.4), P(0, -h - 3.8 + lid * 0.4), P(w * 0.8, -h - 2.6 + lid * 0.4)], 0.8, k.crease));
  out.push(blob([P(-w, 0.6), P(-w * 0.55, -h), P(w * 0.4, -h - 0.4), P(w, -h * 0.4), P(w * 0.75, h * 0.8), P(0, h + 0.6), P(-w * 0.75, h * 0.7)], '#ffffff', 2));
  out.push(F(E(x, y + 0.4, r, r * 1.15, k.ring)), F(E(x, y + 0.8, r - 0.9, r * 1.15 - 0.9, k.iris)), F(E(x, y + r * 0.62, r - 1.8, r * 0.46, k.light)), F(E(x, y - r * 0.5, r - 1.2, r * 0.4, k.dark)));
  out.push(...arc([[x - r * 0.62, y + r * 0.5], [x, y + r * 0.98], [x + r * 0.62, y + r * 0.5]], 0.6, k.light));
  out.push(F(E(x, y + 0.6, 1.7, 2.2, k.pupil)), F(E(x - 2 * o, y - 2.3 + lid * 0.3, 2, 1.7, '#ffffff')), F(E(x + 2.1 * o, y + 2.8, 1, 1, '#ffffff')));
  out.push(F(T([P(1.6, -3.8), P(2.1, -2.8), P(3.1, -2.4), P(2.1, -2), P(1.6, -1), P(1.1, -2), P(0.1, -2.4), P(1.1, -2.8)], '#ffffff')));
  if (lid > 0) {
    out.push(F(blob([P(-w - 0.8, -0.2), P(-w * 0.5, -h - 2.2), P(w * 0.5, -h - 2.6), P(w + 0.8, -h * 0.6), P(w * 0.4, -h + lid), P(-w * 0.5, -h + lid + 0.4)], SK.base, 2)));
    out.push(F(blob([P(-w * 0.6, -h + lid - 1.6), P(w * 0.4, -h + lid - 2), P(w * 0.9, -h * 0.6 + lid * 0.4), P(w * 0.4, -h + lid), P(-w * 0.5, -h + lid + 0.4)], k.shadow, 2)));
  }
  out.push(...band(curve([P(-w - 0.4, 0.4), P(-w * 0.5, -h - 0.4 + lid), P(w * 0.45, -h - 0.8 + lid), P(w + 0.8, -h * 0.4)], 3), 1.6, 3.2, k.ink, true));
  for (let i = 0; i < 4; i++) out.push(...band(curve([P(w * (0.45 + i * 0.18), -h * (0.92 - i * 0.18) + lid * 0.55), P(w * (0.8 + i * 0.24), -h * (1.3 - i * 0.14)), P(w * (1.02 + i * 0.26), -h * (1.3 - i * 0.2))], 3), 1.1, 0.4, k.ink, true));
  out.push(...arc([P(-w * 0.7, h * 0.75), P(0, h + 1.2), P(w * 0.7, h * 0.7)], 0.7, k.low));
  out.push(...arc([P(w * 0.5, h * 0.9), P(w * 0.62, h * 1.3)], 0.6, k.low), ...arc([P(w * 0.2, h + 1), P(w * 0.26, h + 1.6)], 0.6, k.low));
  return out;
}
const shut = (x, o, kind) => {
  const ink = EYE.ink;
  const lashes = (y0) => [0, 1, 2].flatMap((i) => band(curve([[x + (4.6 + i * 1.6) * o, y0 - 1 + i * 0.9], [x + (7.4 + i * 1.4) * o, y0 - 2.6 + i * 1.2], [x + (9 + i * 1.2) * o, y0 - 2.4 + i * 1.5]], 3), 1, 0.4, ink, true));
  const shadow = F(blob([[x - 7.6, 11], [x, 4], [x + 7.6, 11], [x, 8.6]], EYE.shadow, 2));
  if (kind === 'happy') return [shadow, ...band(curve([[x - 7.2, 14], [x, 7.4], [x + 7.2, 14]], 3), 1.8, 2.4, ink, true), ...lashes(11.4)];
  if (kind === 'squeeze') return [...arc([[x - 6.4 * o, 8.6], [x + 5 * o, 12.6], [x - 6.4 * o, 16.4]], 2.2, ink)];
  if (kind === 'sleepy') return [shadow, ...band(curve([[x - 7.2, 12.6], [x, 14.8], [x + 7.2, 12.6]], 3), 1.6, 2.4, ink, true), ...lashes(14.4)];
  return [shadow, ...band(curve([[x - 7.4, 12.4], [x, 15], [x + 7.4, 12.4]], 3), 1.6, 2.6, ink, true), ...lashes(14)];
};
const brows = (b) => {
  const c = C.hair[2];
  const one = (o) => {
    const P = (u, v) => [14 * o + u * o, v];
    if (b === 'up') return arc([P(-6, -3), P(0, -5.4), P(6, -4)], 1.5, c);
    if (b === 'cross') return arc([P(-6, -4.6), P(0, -2.8), P(6, -0.6)], 1.7, c);
    if (b === 'worry') return arc([P(-6, -1), P(0, -3), P(6, -5)], 1.5, c);
    if (b === 'soft') return arc([P(-6, -2), P(0, -3.4), P(6, -2.6)], 1.4, c);
    // (arched: high, a sharp little lift toward the outside, one brow a touch higher)
    return o > 0 ? arc([P(-6, -2.6), P(1, -6), P(6.6, -4.4)], 1.5, c) : arc([P(-6, -1.6), P(1, -4.6), P(6.6, -3.4)], 1.5, c);
  };
  return [...one(-1), ...one(1)];
};
// Rouged lips (head units): a fuller upper and lower lip, a shine on the lower.
const LIP = ['#ff9ab8', '#d8406a', '#a82a50'];
function mouth(m) {
  const out = [];
  if (m === 'smile') out.push(blob([[-4.2, 23.4], [-1.6, 22.6], [0, 23.2], [1.6, 22.6], [4.4, 23.2], [2.4, 25.8], [0, 26.4], [-2.4, 25.8]], LIP[1], 2), ...arc([[-4, 23.6], [0, 24.4], [4.2, 23.4]], 0.6, LIP[2]), F(E(0.4, 25.2, 1.6, 0.5, LIP[0])), ...arc([[4.4, 23.2], [5.4, 22.4]], 0.6, LIP[2]));
  else if (m === 'smirk') out.push(blob([[-3.6, 24], [0, 23.2], [3, 23], [5, 21.8], [3.6, 24.6], [0, 25.8], [-2.6, 25.4]], LIP[1], 2), ...arc([[-3.4, 24.2], [0.4, 24.4], [4.8, 22]], 0.6, LIP[2]), F(E(0.2, 25, 1.4, 0.45, LIP[0])));
  else if (m === 'open' || m === 'sing') out.push(blob([[-4.2, 22.8], [0, 22.2], [4.2, 22.8], [3.4, 27], [0, 28.6], [-3.4, 27]], LIP[1], 2), F(blob([[-3, 23.6], [3, 23.6], [2.4, 26.4], [0, 27.4], [-2.4, 26.4]], '#6a1a3a', 2)), F(E(0, 26.4, 1.8, 0.9, '#ff9ab0')), F(blob([[-2.6, 23.7], [2.6, 23.7], [2.2, 24.5], [-2.2, 24.5]], '#ffffff', 1)));
  else if (m === 'belt') out.push(blob([[-4.6, 22.4], [0, 21.6], [4.6, 22.4], [4, 28], [0, 30.6], [-4, 28]], LIP[1], 2), F(blob([[-3.4, 23.2], [3.4, 23.2], [3, 27.6], [0, 29.4], [-3, 27.6]], '#6a1a3a', 2)), F(E(0, 28, 2.2, 1, '#ff9ab0')), F(blob([[-3, 23.3], [3, 23.3], [2.6, 24.2], [-2.6, 24.2]], '#ffffff', 1)));
  else if (m === 'o') out.push(blob([[-2.6, 23], [0, 22.4], [2.6, 23], [2.8, 26], [0, 27.6], [-2.8, 26]], LIP[1], 2), F(E(0, 25.2, 1.4, 1.6, '#6a1a3a')));
  else if (m === 'kiss') out.push(blob([[-2.4, 23.4], [0, 22.4], [2.4, 23.4], [2, 26], [0, 26.8], [-2, 26]], LIP[1], 2), ...arc([[-1.6, 24.6], [0, 25], [1.6, 24.6]], 0.6, LIP[2]), F(E(0.3, 25.6, 0.9, 0.4, LIP[0])));
  else if (m === 'pout') out.push(blob([[-3.6, 25], [0, 23.6], [3.6, 25], [2.2, 26.6], [0, 26.8], [-2.2, 26.6]], LIP[1], 2), F(E(0, 25.8, 1.3, 0.45, LIP[0])));
  else if (m === 'grit') out.push(blob([[-4.6, 23], [4.6, 23], [3.6, 26.2], [0, 27], [-3.6, 26.2]], LIP[1], 2), F(blob([[-3.4, 23.8], [3.4, 23.8], [2.8, 25.6], [-2.8, 25.6]], '#ffffff', 1)), ...arc([[-3, 24.7], [3, 24.7]], 0.4, '#e8d8e8'));
  else if (m === 'wobble') out.push(...arc([[-4.4, 25], [-2.2, 23.8], [0, 25], [2.2, 23.8], [4.4, 25]], 1.4, LIP[1]));
  else out.push(...arc([[-3, 24.6], [0, 25], [3, 24.6]], 1.4, LIP[1]));
  return out;
}
function face(f) {
  const { e, m } = f;
  const out = [blob([[-33, -14], [-34, 6], [-29, 22], [-17, 31], [0, 34], [17, 31], [29, 22], [34, 6], [33, -14], [0, -30]], SK.base, 4)];
  out.push(F(blob([[-33, -6], [-31, 16], [-26, 24], [-29, 10]], SK.sh, 2)));
  out.push(...brows(f.b));
  if (e === 'happy' || e === 'blink' || e === 'squeeze' || e === 'sleepy') out.push(...shut(-14, -1, e), ...shut(14, 1, e));
  else if (e === 'wink') out.push(...eye(-14, 12, -1, 3.2), ...shut(14, 1, 'happy'));
  else {
    const lid = e === 'half' ? 3.4 : e === 'fierce' ? 2.8 : 0;
    const big = e === 'wide' ? 0.8 : 0;
    out.push(...eye(-14, 12, -1, lid, big), ...eye(14, 12, 1, lid, big));
  }
  for (const o of [-1, 1]) {
    out.push(F(E(21 * o, 21, 5.2, 3, '#ffb0cc')));
    for (let i = 0; i < 3; i++) out.push(...arc([[21 * o + (i - 1) * 2.6 - 0.8, 22.2], [21 * o + (i - 1) * 2.6 + 0.8, 20]], 0.5, SK.lt));
  }
  out.push(...arc([[0.6, 18.6], [1.2, 19.6]], 0.7, SK.deep));
  // the beauty mark
  out.push(F(E(9.4, 27.4, 1, 1, '#4a2a4a')));
  out.push(...mouth(m));
  return out;
}

// ---------- Hair ----------
// (head units; built the way the player liked on the Mirror Twins: each mass one smooth silhouette
// with rounded tips, no hard corners, broken into locks by fine dark gaps and lit by shines along
// the locks; glossy plum, a bright angel ring.)
const Hc = C.hair;
// The hair behind: the curls piled high behind her crown (three big rounded rolls, a curl spiralling
// in each), and the back hair to her shoulders, its ends curling under in rounded locks.
const BACK_ENDS = [[-48, 40], [-49, 50], [-44, 57], [-37, 55], [-34, 47], [-28, 56], [-19, 60], [-12, 54], [-6, 60], [2, 63], [10, 59], [14, 52], [20, 59], [29, 57], [34, 47], [37, 55], [44, 57], [49, 50], [48, 40]];
const BACK_NOTCH = [[-34, 47], [-12, 54], [14, 52], [34, 47]];
const hairBack = () => [
  // (the updo's rolls: one mass, three rounded lobes)
  blob([[-36, -36], [-40, -52], [-32, -64], [-20, -68], [-12, -74], [0, -80], [14, -79], [24, -72], [33, -70], [40, -58], [40, -40], [0, -40]], Hc[1], 3),
  // (each roll: a soft shade under its lower rim, the line where it curls under, a broad gloss
  // over its crown and a bright core in it)
  ...[[-26, -56, 9], [2, -66, 11], [28, -56, 8.6]].flatMap(([x, y, r]) => [
    F(blob([[x - r * 0.9, y + r * 0.3], [x, y + r * 0.75], [x + r * 0.9, y + r * 0.3], [x, y + r * 0.45]], Hc[2], 2)),
    ...arc([[x - r * 0.75, y + r * 0.25], [x - r * 0.3, y + r * 0.55], [x + r * 0.35, y + r * 0.5], [x + r * 0.6, y + r * 0.1]], 0.8, Hc[3]),
    lens([x - r * 0.75, y - r * 0.05], [x + r * 0.45, y - r * 0.75], 3.2, -1.8, Hc[0]),
    lens([x - r * 0.35, y - r * 0.4], [x + r * 0.1, y - r * 0.7], 1, -0.5, '#f0dcf8'),
  ]),
  ...[[-14, -60, -12, -70], [16, -59, 17, -69]].map(([x0, y0, x1, y1]) => lens([x0, y0], [x1, y1], 1.2, 0.6, Hc[2])),
  // (the back hair)
  blob([[0, -48], [-32, -36], [-42, -14], [-47, 10], [-49, 30], ...BACK_ENDS, [49, 30], [47, 10], [42, -14], [32, -36]], Hc[1], 3),
  ...[-1, 1].map((o) => F(blob([[42 * o, 49], [46 * o, 53], [42 * o, 56], [38 * o, 53]], Hc[2], 2))),
  F(blob([[-22, 6], [-26, 36], [-14, 52], [0, 56], [14, 52], [26, 36], [22, 6], [0, 16]], Hc[2], 4)),
  ...BACK_NOTCH.map(([x, y]) => lens([x, y - 1], toward([x, y], [x * 0.6, 0], 0.6), 2, x > 0 ? 1 : -1, Hc[3])),
  ...[[-43, -6, -47, 36], [43, -6, 47, 36]].map(([x0, y0, x1, y1]) => lens([x0, y0], [x1, y1], 3.4, x0 < 0 ? 2.2 : -2.2, Hc[0])),
  ...[[-33, 8, -36, 42], [33, 8, 36, 42]].map(([x0, y0, x1, y1]) => lens([x0, y0], [x1, y1], 1.6, x0 < 0 ? 1.4 : -1.4, Hc[0])),
];
// The bangs: one big glossy wave from a part high on her near side, swept across her brow, lifting
// off her near brow and falling longest over the far temple, where it rolls under; the shadow it
// casts on her brow, a shaded rim, dark gaps rising from the notches toward the part, shines down
// the locks, the wave's broad gloss, the angel ring.
const PART = [18, -48];
const BANG_EDGE = [[-37, -6], [-33, 6], [-28, -3], [-22, 3], [-16, -9], [-9, -3], [-4, -15], [3, -9], [7, -20], [14, -15], [19, -25], [27, -19], [37, -22]];
const bangs = () => {
  const crown = [[37, -22], [37, -30], [28, -42], [0, -50], [-26, -42], [-38, -24]];
  const out = [];
  out.push(F(blob([...BANG_EDGE.map(([x, y]) => [x + 0.6, y + 2]), [37, -26], [-37, -16]], SK.sh, 2)));
  out.push(blob([...BANG_EDGE, ...crown], Hc[1], 2));
  out.push(...band(curve(BANG_EDGE.slice(1, -1).map(([x, y]) => [x, y - 0.7]), 4), 0.9, 0.9, Hc[2], true));
  BANG_EDGE.forEach((p, i) => {
    if (i === 0 || i === BANG_EDGE.length - 1) return;
    if (i % 2 === 0) out.push(lens(toward(p, PART, 0.06), toward(p, PART, 0.6), 1.7, -0.8, Hc[3]));
    else out.push(lens(toward(p, PART, 0.2), toward(p, PART, 0.55), 1.6, -0.6, Hc[0]));
  });
  // the wave's broad gloss, sweeping across with it
  out.push(lens([-30, -18], [8, -36], 3.4, 2.6, Hc[0]), lens([-20, -16], [-6, -24], 1.4, 1, '#f0dcf8'));
  // the roll at the far temple: the wave curling under
  out.push(E(-35, -8, 7, 9, Hc[1]), ...arc([[-39, -12], [-35, -16], [-30, -12], [-31, -5], [-35, -4]], 1.1, Hc[3]), lens([-40, -10], [-36, -16], 1.6, -0.8, Hc[0]));
  // the part
  out.push(lens([PART[0] + 0.6, PART[1] - 1], [PART[0] - 1.6, PART[1] + 9], 1.4, 0.4, Hc[3]));
  // the angel ring, a bright core
  out.push(lens([-29, -30], [-15, -39], 3.2, -1.3, Hc[0]), lens([-10, -41], [5, -41.6], 3.2, -1.5, Hc[0]), lens([10, -40.6], [24, -34], 3, -1.3, Hc[0]));
  out.push(lens([-7, -42], [2, -42.4], 1.2, -0.6, '#ffffff'));
  return out;
};
// A long ringlet (o: -1 far, 1 near) from the temple down past her cheek to below the jaw: a
// spiralling lock of six coils, each a rounded turn with a dark line where it tucks under the next
// and a shine on its front, a little curl at the tip.
const RING_ROOT = [33, -12];
const ringlet = (o) => {
  const spine = [[33, -12], [38, 0], [40, 12], [41, 24], [40, 36], [38, 47], [36, 56]];
  const out = [...lockOf(spine.map(([x, y]) => [x * o + 1.4 * o, y + 1.4]), 10.6, 5, Hc[2]), ...lockOf(spine.map(([x, y]) => [x * o, y]), 10, 5, Hc[1])];
  for (let i = 0; i < 6; i++) {
    const u = (i + 0.5) / 6;
    const k = Math.min(spine.length - 2, Math.floor(u * (spine.length - 1)));
    const f = u * (spine.length - 1) - k;
    const [x, y] = [spine[k][0] + (spine[k + 1][0] - spine[k][0]) * f, spine[k][1] + (spine[k + 1][1] - spine[k][1]) * f];
    const w = 5 - i * 0.35;
    out.push(...arc([[(x - w) * o, y + 2.6], [x * o, y + 4.2], [(x + w) * o, y + 1.4]], 0.9, Hc[3]));
    out.push(lens([(x - w * 0.6) * o, y - 0.6], [(x + w * 0.5) * o, y - 3], 1.6, -0.6 * o, Hc[0]));
  }
  out.push(E(35 * o, 58, 3.4, 3, Hc[1]), ...arc([[33 * o, 57], [35 * o, 55.4], [37.4 * o, 57.4], [35 * o, 60]], 0.8, Hc[3]));
  return out;
};
// The tiara: a gold band with five points, the tallest in the middle set with an aqua jewel, pink
// jewels either side, pearls along the band; drawn level, round its own middle (the rig tips it
// crooked).
const TIARA_C = [-2, -44];
const tiara = () => {
  const [g0, g1, g2] = C.gold;
  const [cx, cy] = TIARA_C;
  const P = (x, y) => [cx + x, cy + y];
  return [
    blob([P(-22, 6), P(-20, -2), P(-14, -6), P(-10, 0), P(-6, -10), P(0, -17), P(6, -10), P(10, 0), P(14, -6), P(20, -2), P(22, 6), P(0, 9)], g1, 2),
    F(blob([P(-20, 4), P(20, 4), P(19, 6.6), P(-19, 6.6)], g2, 1)),
    ...arc([P(-20, 2), P(-14, -3.6), P(-9, 1)], 0.6, g0), ...arc([P(-5, -8), P(0, -14), P(5, -8)], 0.7, g0), ...arc([P(9, 1), P(14, -3.6), P(20, 2)], 0.6, g0),
    E(cx, cy - 5, 3.4, 4, C.gem[1]), F(E(cx - 0.4, cy - 4, 2, 2.6, C.gem[2])), F(E(cx - 1, cy - 6.4, 1.2, 1, C.gem[0])),
    E(cx - 14, cy - 0.6, 2, 2, C.pink), F(E(cx - 14.6, cy - 1.2, 0.7, 0.6, '#ffffff')), E(cx + 14, cy - 0.6, 2, 2, C.pink), F(E(cx + 13.4, cy - 1.2, 0.7, 0.6, '#ffffff')),
    ...[-17, -11, -5, 5, 11, 17].map((x) => F(E(cx + x, cy + 4.6, 1.1, 1, '#fff8f0'))),
  ];
};

// ---------- Her pieces ----------
const cache = new Map();
export function divaDesign(mood = 'idle') {
  const key = mood in FACES ? mood : 'idle';
  if (cache.has(key)) return cache.get(key);
  const f = FACES[key];
  const [vL, vB, vS, vD] = C.vel;
  const [g0, g1, g2] = C.gold;
  const body = blankBody('spirit', { tpose: false, guides: false });
  const recolor = (list, pal) => list.map((sh) => ({ ...sh, c: { [BLANK.lt]: pal[0], [BLANK.base]: pal[1], [BLANK.sh]: pal[2], [BLANK.deep]: pal[3] }[sh.c] ?? sh.c }));
  // A huge puffed sleeve at a shoulder: velvet slashed to show pink silk through the slits, gathered
  // into a gold band, a little bow at the top.
  const sleeve = (k) => {
    const x = k === 'N' ? 119 : 93;
    const o = k === 'N' ? 1 : -1;
    const P = (u, v) => [x + u * o, v];
    return [
      blob([P(-8, 99), P(-4, 92.6), P(4, 91.6), P(11, 95.6), P(13, 104), P(9, 112.6), P(0, 114.4), P(-8, 110)], vB, 2),
      // the slits, pink silk puffing through
      ...[[-3, 94.4, -4, 110], [3.4, 93.6, 4.6, 111], [9, 97, 9.4, 108]].map(([u0, v0, u1, v1]) => lens(P(u0, v0), P(u1, v1), 3, 0.8 * o, C.lining[1])),
      ...[[-3, 96, -3.6, 106], [3.6, 95.6, 4.4, 107]].map(([u0, v0, u1, v1]) => lens(P(u0, v0), P(u1, v1), 1.2, 0.5 * o, C.lining[0])),
      F(blob([P(-6, 98), P(-2, 94.6), P(2, 95), P(-3, 99)], vL, 2)),
      F(blob([P(-6, 108), P(8, 108.6), P(6, 112.6), P(-4, 112)], vS, 2)),
      // the gold band, the bow
      ...band(curve([P(-7, 110.6), P(1, 114), P(9.4, 111.4)], 3), 2.4, 2.4, g1, true), ...arc([P(-6, 110.4), P(1, 113.4), P(8.6, 111)], 0.5, g0),
      blob([P(4, 94), P(8.4, 90.6), P(9.4, 95)], C.pink, 1), blob([P(4, 94), P(8.6, 97.6), P(5, 98)], C.pink, 1), E(...P(4.2, 94.4), 1.3, 1.3, '#e0608a'),
    ];
  };
  // A lace opera glove from just below the elbow to the wrist: a frilled top in gold, a fine lace
  // pattern, a frill at the wrist.
  const glove = (k) => {
    const el = k === 'N' ? [120.2, 119] : [89.8, 119];
    const wr = k === 'N' ? [120.5, 136] : [89.5, 136];
    const at = (u) => [el[0] + (wr[0] - el[0]) * u, el[1] + (wr[1] - el[1]) * u];
    const [a, b] = [at(0.18), at(0.94)];
    return [
      ...tube(a, b, 7.6, 6.4, C.glove[1]),
      F(blob([[a[0] - 1.2, a[1]], [a[0] + 1.6, a[1]], [b[0] + 1.4, b[1]], [b[0] - 1, b[1]]], C.glove[0], 2)),
      ...[0.35, 0.55, 0.75].flatMap((u) => { const [x, y] = at(u); return arc([[x - 2.8, y], [x, y + 1.2], [x + 2.8, y]], 0.5, C.glove[2]); }),
      ...Array.from({ length: 5 }, (_, i) => E(a[0] - 3.6 + i * 1.8, a[1] - 0.4, 1.2, 1.1, g1)),
      ...Array.from({ length: 5 }, (_, i) => E(b[0] - 3.4 + i * 1.7, b[1] + 1, 1.2, 1.2, C.glove[0])),
    ];
  };
  const groups = {
    hairB: inHead(hairBack()),
    lower: [
      ...recolor(body.groups.lower, C.wisp),
      F(blob([[98, 150], [114, 150], [116, 164], [110, 176], [100, 172], [96, 160]], C.wisp[0], 3)),
      ...band(curve([[112, 150], [114, 164], [108, 176], [100, 184]], 3), 1.8, 0.6, C.wisp[2], true),
    ],
    // the gown's skirt: wide velvet folds, too long, its train trailing behind
    dressSkirt: [
      blob([[90, 115], [122, 115], [130, 132], [138, 150], [140, 160], [130, 163], [118, 161], [106, 163], [94, 161], [80, 166], [66, 170], [62, 166], [72, 154], [80, 134]], vB, 2),
      // folds: shade down between them, light along their crowns
      ...[[94, 120, 86, 162], [116, 120, 124, 160], [104, 122, 102, 160]].map(([x0, y0, x1, y1]) => lens([x0, y0], [x1, y1], 3.6, 0.6, vS)),
      ...[[90, 124, 78, 160], [120, 124, 132, 156]].map(([x0, y0, x1, y1]) => lens([x0, y0], [x1, y1], 2.6, -0.8, vL)),
      F(blob([[70, 160], [84, 150], [92, 162], [78, 167], [66, 169]], vS, 2)),
      // the brocade front panel, gold diamonds over it, rosettes where the velvet is caught back
      blob([[101, 118], [111, 118], [120, 162], [92, 162]], C.panel[1], 2),
      F(blob([[103, 120], [108, 120], [112, 160], [100, 160]], C.panel[0], 2)),
      ...[[106, 128], [104, 138], [108, 138], [102, 148], [106, 148], [110, 148], [100, 157], [106, 157], [112, 157]].map(([x, y]) => F(blob([[x, y - 2], [x + 1.6, y], [x, y + 2], [x - 1.6, y]], g1, 1))),
      ...arc([[101, 119], [92, 161]], 1.4, g1), ...arc([[111, 119], [120, 161]], 1.4, g1),
      ...[[99, 134], [113, 134]].flatMap(([x, y]) => [E(x, y, 3.6, 3.4, C.pink), ...arc([[x - 2.4, y], [x, y - 2.2], [x + 2.2, y], [x, y + 1.6], [x - 0.8, y - 0.2]], 0.6, '#e0608a'), F(E(x - 1, y - 1.2, 1, 0.8, '#ffd8e6'))]),
      // the gold hem, scalloped lace along its edge
      ...band(curve([[62, 167], [80, 164], [94, 160], [106, 162], [118, 160], [130, 162], [140, 159]], 4), 2.4, 2.4, g1, true),
      ...band(curve([[63, 166.4], [80, 163.4], [94, 159.4], [106, 161.4], [118, 159.4], [130, 161.4], [139.4, 158.4]], 4), 0.6, 0.6, g0, true),
      ...Array.from({ length: 13 }, (_, i) => {
        const u = i / 12;
        const x = 64 + u * 76;
        const y = 168 - 6 * u + Math.sin(u * Math.PI * 3) * 1.2;
        return E(x, y + 1.6, 2.6, 1.8, g1);
      }),
    ],
    dressTop: [
      // the bodice: a sweetheart neckline, a pointed waist
      blob([[91, 104], [97, 100], [103, 101.4], [106, 104.6], [109, 101.4], [115, 100], [121, 104], [122.4, 116], [106, 123], [89.6, 116]], vB, 2),
      F(blob([[94, 104], [100, 102.6], [102, 116], [95, 116]], vL, 2)), F(blob([[115, 104], [120, 105], [121, 116], [113, 117]], vS, 2)),
      // gold along the neckline, the seams, the pointed waist
      ...arc([[91, 104], [97, 100.6], [103, 101.8], [106, 104.6], [109, 101.8], [115, 100.6], [121, 104]], 1.4, g1),
      ...arc([[106, 106], [106, 122]], 0.8, g1), ...arc([[98, 104], [99, 118]], 0.6, g2), ...arc([[114, 104], [113, 118]], 0.6, g2),
      ...arc([[89.8, 115.6], [106, 122.6], [122.2, 115.6]], 1.6, g1),
      // the brooch: an aqua jewel in a gold setting, a teardrop pearl
      E(106, 106.6, 3.4, 3.2, g1), E(106, 106.6, 2.2, 2.2, C.gem[1]), F(E(105.4, 106, 0.8, 0.7, C.gem[0])), E(106, 111.2, 1.3, 1.8, '#fff8f0'),
      // the safety pin taking the gown in at her side (it's three sizes too big)
      ...arc([[117, 108], [121, 110.6]], 0.7, '#d8dce8'), ...arc([[117.4, 109.4], [120.8, 111.6]], 0.5, '#b8bccc'), E(116.6, 108.2, 1, 1, '#c8ccd8'),
    ],
    // the boa: round her neck and over her far shoulder, dipping in front (its near end rides over
    // her near sleeve: boaN)
    boa: [...[[85.6, 100.6, 4.6], [90.6, 97.4, 5], [96.4, 100, 4.8], [101.8, 102.6, 4.6], [107.2, 103.4, 4.6], [112.6, 102, 4.8]].flatMap(([x, y, r], i) => puff(x, y, r, C.boa, i * 0.7))],
    boaN: [...[[117.8, 99.6, 4.8], [123, 99, 4.8], [126.6, 103.6, 4.2]].flatMap(([x, y, r], i) => puff(x, y, r, C.boa, 4 + i * 0.7))],
    sleeveFu: sleeve('F'),
    sleeveNu: sleeve('N'),
    gloveF: glove('F'),
    gloveN: glove('N'),
    head: inHead([...face(f), ...bangs()]),
    tiara: inHead(tiara()),
    curlF: inHead(ringlet(-1)),
    curlN: inHead(ringlet(1)),
    // the mask on its stick: the stick up from her hand (pink ribbon wound round it), the mask: a
    // gold filigree domino, its eyes cut out, curls at its wings, jewels, a pink lining showing
    mask: [
      ...band([[121.6, 146], [129, 108], [132.6, 92]], 2.2, 2, g1, true), ...band([[121.4, 144], [128.8, 108.6]], 0.6, 0.6, g0, true),
      ...[0, 1, 2, 3, 4].flatMap((i) => { const y = 138 - i * 9; const x = 122.8 + (138 - y) * 0.2; return arc([[x - 1.4, y + 1.6], [x + 1.6, y - 1.6]], 1, C.pink); }),
      E(121.4, 147, 1.8, 1.8, g1),
      blob([[124, 84], [127, 78.6], [133, 77], [140, 79.6], [146, 77], [152, 78.6], [156.4, 83], [154, 90.6], [147, 93], [142, 89], [140, 92], [137, 89], [131, 93.4], [125.6, 91]], g1, 2),
      F(blob([[126, 84], [132, 79], [139, 81], [138, 84], [132, 82.4], [128, 86]], g0, 2)),
      F(blob([[127.6, 89], [132, 91.4], [137, 88], [137.4, 89.4], [132, 93], [127, 90.4]], g2, 2)),
      // the eye holes, a pink lining at their rims
      E(132.6, 85.4, 4.6, 3.2, C.lining[1]), F(blob([[128.6, 85.6], [132, 82.6], [136.4, 84.4], [134.6, 87.4], [130.6, 87.6]], '#3a1a2a', 2)),
      E(147.6, 84.6, 4.6, 3.2, C.lining[1]), F(blob([[143.6, 84.4], [148, 82.2], [151.6, 85], [149.4, 87.2], [145.4, 87.2]], '#3a1a2a', 2)),
      // filigree curls on the wings, jewels
      ...arc([[124.6, 87], [123.6, 91.6], [126.6, 93.6], [128.6, 91.6]], 0.8, g2), ...arc([[155.6, 86], [157, 90.6], [154, 92.6], [152, 90.6]], 0.8, g2),
      E(140, 82.6, 1.8, 1.8, C.gem[1]), F(E(139.6, 82.2, 0.6, 0.5, '#ffffff')), E(126, 82.6, 1.2, 1.2, C.pink), E(154.4, 81.6, 1.2, 1.2, C.pink),
      // a ribbon bow where the stick meets it
      blob([[131, 93], [126.4, 96], [127, 99.4], [131.4, 95.6]], C.pink, 1), blob([[132, 93], [136.6, 96.4], [135.6, 99.4], [132, 95.6]], C.pink, 1), E(131.6, 94.2, 1.6, 1.6, '#e0608a'),
      ...lockOf([[130.6, 95], [128.6, 101], [129.6, 106]], 1.4, 0.6, C.pink), ...lockOf([[132.6, 95], [134.6, 101], [133.6, 106]], 1.4, 0.6, C.pink),
    ],
    // its feathers, from the near top corner: pink, violet, aqua, curling back
    plume: [
      ...[[150, 80, -0.5, '#ff8ab0', '#ffc4da'], [154, 77, -0.1, C.violet, '#dcc8ff'], [157, 80, 0.35, '#7ae0e8', '#c8f6fa']].flatMap(([x, y, a, c, lt]) => {
        const tip = [x + Math.sin(a) * 17, y - 17];
        const mid = [x + Math.sin(a) * 9 - 2, y - 9];
        return [...lockOf([[x, y + 2], mid, tip], 5.2, 1.4, c), ...lockOf([[x + 0.4, y], [mid[0] + 0.4, mid[1]], [tip[0] + 0.2, tip[1] + 1]], 2, 0.6, lt), ...arc([[x, y + 3], mid, [tip[0], tip[1] + 1.4]], 0.5, '#ffffff')];
      }),
      E(152.6, 80.6, 2.6, 2.4, g1), F(E(152, 80, 0.9, 0.8, g0)),
    ],
  };
  cache.set(key, groups);
  return groups;
}
// Joints of her own, in base units: her mouth; the ringlets' roots; the tiara's middle and its
// jewel; the mask's middle and its feathers' root.
export const MOUTH = H2B([0, 24]);
export const CURL_F = H2B([-RING_ROOT[0], RING_ROOT[1]]);
export const CURL_N = H2B(RING_ROOT);
export const TIARA = H2B(TIARA_C);
export const TIARA_GEM = H2B([TIARA_C[0], TIARA_C[1] - 5]);
export const MASK = [140, 85];
export const PLUME = [152.6, 80.6];
