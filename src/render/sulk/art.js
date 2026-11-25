// The Blanket Sulk's design (2026-11-25, The Sulk remade on the spirit base, the player's pick "C" of
// three): the storm cloud of the Sky Whale's sadness, as a sulky little spirit who will not come out
// from under his storm-cloud duvet (five more minutes...): wrapped up in a huge grey-blue quilted cloud
// duvet pulled up over his head, only his pouting face and a messy fringe poking out, a lightning curl
// peeking from the top, rain dripping off the duvet's edges, a raindrop plush hugged to his chest; big
// teary eyes, a pout. When the storm is cleared (m.cine.mood 'happy') the duvet turns white and fluffy
// and he smiles.
// Each piece, in the spirit base's own drawing units (blankBody('spirit'), read only), named for the
// bone it rides on, in two coats (storm, clear):
//   hoodB      the duvet's hood behind his head: a puffy cloud, raindrops printed on it
//   bolt       the lightning curl peeking from the top of the hood (on a spring)
//   head       the face (each expression), the messy fringe, the hood's fluffy trim round his face
//   duvet      the duvet bundled round his body: a soft storm cloud, lumps all round its edge, a print
//              of little raindrops and lightning bolts, its trimmed edge wrapping down his front
//   hem        its bottom edge, a row of big soft puffs, drips hanging off it (on a spring)
//   lower      the wisp under it
//   sleeveFu/Nu, foldF/N   the duvet's corners draped over each arm, a fluffy cuff at the wrist
//   plush      the raindrop plush in his near hand
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
const lens = ([x0, y0], [x1, y1], w, bow, c) => {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const [nx, ny] = [-(y1 - y0) / len, (x1 - x0) / len];
  const mx = (x0 + x1) / 2 + nx * bow;
  const my = (y0 + y1) / 2 + ny * bow;
  return F(blob([[x0, y0], [mx + nx * w * 0.5, my + ny * w * 0.5], [x1, y1], [mx - nx * w * 0.5, my - ny * w * 0.5]], c, 2));
};
const toward = ([x, y], [px, py], t) => [x + (px - x) * t, y + (py - y) * t];
const tube = (a, b, w0, w1, c) => [...band([a, b], w0, w1, c, true), F(E(a[0], a[1], w0 / 2, w0 / 2, c)), F(E(b[0], b[1], w1 / 2, w1 / 2, c))];

export const SKIN_COLORS = { lt: '#ffffff', base: '#f2f4ff', sh: '#dde2f4', deep: '#c4cae4' };
const SK = SKIN_COLORS;
// The two coats: [light, base, shade, deep] for the duvet and the hair, the wisp's tones.
const COATS = {
  storm: { cs: ['#b4c0ec', '#8693cf', '#6874b2', '#4c5890'], hair: ['#f4f2ff', '#c8c4ec', '#a49ed6', '#8078b8'], wisp: ['#dde4f8', '#a8b4dc', '#8492c4', '#6a76a8'], hollow: '#4c5890', print: '#6672b0', print2: '#a8c8f4', bolt: '#ffe27a', trim: ['#eef2ff', '#c8d0ec'] },
  clear: { cs: ['#ffffff', '#f2f5ff', '#dbe2f6', '#bcc6e6'], hair: ['#ffffff', '#eef2ff', '#d4dcf4', '#b8c2e4'], wisp: ['#ffffff', '#f0f4ff', '#d8e0f6', '#c0cbec'], hollow: '#bcc6e6', print: '#cfe0ff', print2: '#ffd8e8', bolt: '#ffe9a0', trim: ['#ffffff', '#e4eafa'] },
};

// ---------- Faces ----------
// e the eyes, m the mouth, b the brows, t tears: sulky, every one but the cleared one.
const FACES = {
  idle: { e: 'open', m: 'pout', b: 'worry', t: 1 }, blink: { e: 'blink', m: 'pout', b: 'worry', t: 1 },
  o: { e: 'wide', m: 'o', b: 'up', t: 1 }, angry: { e: 'cross', m: 'grump', b: 'cross', t: 0, cheeks: 1 },
  hurt: { e: 'squeeze', m: 'wail', b: 'worry', t: 2 }, shout: { e: 'squeeze', m: 'wail', b: 'cross', t: 2 },
  dizzy: { e: 'squeeze', m: 'wobble', b: 'worry', t: 1 }, dead: { e: 'squeeze', m: 'wobble', b: 'worry', t: 1 },
  huff: { e: 'shut', m: 'grump', b: 'cross', t: 0, cheeks: 1 }, happy: { e: 'happy', m: 'smile', b: 'up', t: 0 },
  sleep: { e: 'shut', m: 'small', b: 'worry', t: 0 },
  sniff: { e: 'squeeze', m: 'wobble', b: 'worry', t: 1 }, yawn: { e: 'shut', m: 'yawn', b: 'soft', t: 0 },
};
export const MOODS = Object.keys(FACES);
const EYE = { ring: '#1a3a6a', iris: '#5a9ae8', light: '#cfe8ff', dark: '#2a5aa8', ink: '#2a2a40', low: '#a8b4d8', crease: '#e0e4f4' };
// A big teary eye (head units): the white, a ring, the iris in three tones, the pupil, glints and a
// star, a welling tear along the bottom; the lid line with three lashes (lowered by `lid`), a lower
// lid with two little lashes.
function eye(x, y, o, lid = 0, big = 0, tear = 1) {
  const k = EYE;
  const w = 7.8 + big;
  const h = 7.2 + big;
  const r = 5.4 + big * 0.6;
  const P = (u, v) => [x + u * o, y + v];
  const out = [];
  out.push(...arc([P(-w * 0.7, -h - 2.6 + lid * 0.4), P(0, -h - 3.6 + lid * 0.4), P(w * 0.8, -h - 2.4 + lid * 0.4)], 0.8, k.crease));
  out.push(blob([P(-w, 0.6), P(-w * 0.55, -h), P(w * 0.4, -h - 0.4), P(w, -h * 0.4), P(w * 0.75, h * 0.8), P(0, h + 0.6), P(-w * 0.75, h * 0.7)], '#ffffff', 2));
  out.push(F(E(x, y + 0.4, r, r * 1.15, k.ring)), F(E(x, y + 0.8, r - 0.9, r * 1.15 - 0.9, k.iris)), F(E(x, y + r * 0.62, r - 1.8, r * 0.46, k.light)), F(E(x, y - r * 0.5, r - 1.2, r * 0.4, k.dark)));
  out.push(F(E(x, y + 0.6, 1.8, 2.3, '#1a1a2e')), F(E(x - 2 * o, y - 2.3, 2.2, 1.9, '#ffffff')), F(E(x + 2.1 * o, y + 2.8, 1.1, 1.1, '#ffffff')));
  out.push(F(T([P(1.6, -3.8), P(2.1, -2.8), P(3.1, -2.4), P(2.1, -2), P(1.6, -1), P(1.1, -2), P(0.1, -2.4), P(1.1, -2.8)], '#ffffff')));
  if (tear) out.push(...arc([P(-w * 0.55, h * 0.62), P(0, h * 0.86), P(w * 0.55, h * 0.62)], 1.1, '#d8f2ff'), F(E(x + 2.4 * o, y + h * 0.66, 1.1, 0.55, '#ffffff')));
  if (lid > 0) out.push(F(blob([P(-w - 0.8, -0.2), P(-w * 0.5, -h - 2.2), P(w * 0.5, -h - 2.6), P(w + 0.8, -h * 0.6), P(w * 0.4, -h + lid), P(-w * 0.5, -h + lid + 0.4)], SK.base, 2)));
  out.push(...band(curve([P(-w - 0.4, 0.4), P(-w * 0.5, -h - 0.4 + lid), P(w * 0.45, -h - 0.8 + lid), P(w + 0.6, -h * 0.4)], 3), 1.6, 2.8, k.ink, true));
  for (let i = 0; i < 2; i++) out.push(...band(curve([P(w * (0.6 + i * 0.25), -h * (0.85 - i * 0.25) + lid * 0.5), P(w * (0.9 + i * 0.25), -h * (1.15 - i * 0.2)), P(w * (1.1 + i * 0.25), -h * (1.1 - i * 0.22))], 3), 1, 0.4, k.ink, true));
  out.push(...arc([P(-w * 0.7, h * 0.75), P(0, h + 1.2), P(w * 0.7, h * 0.7)], 0.7, k.low));
  return out;
}
const shut = (x, o, kind) => {
  const ink = EYE.ink;
  if (kind === 'happy') return [...band(curve([[x - 7.2, 14], [x, 7], [x + 7.2, 14]], 3), 1.8, 2.4, ink, true), ...arc([[x + 6.2 * o, 12.6], [x + 9.4 * o, 10.8]], 0.9, ink)];
  if (kind === 'squeeze') return [...arc([[x - 6.4 * o, 8.6], [x + 5 * o, 12.6], [x - 6.4 * o, 16.4]], 2.2, ink)];
  return [...band(curve([[x - 7.4, 12.4], [x, 15], [x + 7.4, 12.4]], 3), 1.6, 2.4, ink, true), ...arc([[x + 6.6 * o, 12.8], [x + 9.6 * o, 11.2]], 0.9, ink)];
};
const brows = (b, c) => {
  const one = (o) => {
    const P = (u, v) => [14 * o + u * o, v];
    if (b === 'up') return arc([P(-6, -3), P(0, -5.4), P(6, -4)], 1.6, c);
    if (b === 'cross') return arc([P(-6, -4.6), P(0, -2.8), P(6, -0.4)], 1.8, c);
    return arc([P(-6, -1), P(0, -2.6), P(6, -5.6)], 1.6, c);
  };
  return [...one(-1), ...one(1)];
};
function mouth(m) {
  if (m === 'pout') return [blob([[-3, 26.2], [0, 25], [3, 26.2], [2, 27.8], [-2, 27.8]], '#e07890', 2), ...arc([[-3.6, 25.6], [-1.4, 24.4], [1.4, 24.4], [3.6, 25.6]], 0.9, '#7a2a48')];
  if (m === 'grump') return [...arc([[-5, 26.6], [0, 24.4], [5, 26.6]], 1.6, '#7a2a48'), F(E(0, 27.6, 2, 0.6, '#d0607a'))];
  if (m === 'wail') return [blob([[-5.4, 23], [5.4, 23], [4.4, 29], [0, 31], [-4.4, 29]], '#6a1a3a', 2), F(E(0, 28.8, 2.8, 1.2, '#ff8aa8')), F(blob([[-4.4, 23.2], [4.4, 23.2], [4, 24.2], [-4, 24.2]], '#ffffff', 1))];
  if (m === 'o') return [F(E(0, 25.6, 2.2, 2.6, '#6a1a3a')), F(E(0, 26.6, 1.2, 0.8, '#ff9ab0'))];
  if (m === 'yawn') return [blob([[-3.4, 23], [3.4, 23], [4, 28], [0, 31], [-4, 28]], '#6a1a3a', 2), F(E(0, 28.6, 2.2, 1, '#ff9ab0'))];
  if (m === 'wobble') return [...arc([[-4.4, 25.4], [-2.2, 24.2], [0, 25.4], [2.2, 24.2], [4.4, 25.4]], 1.2, '#7a2a48')];
  if (m === 'smile') return [blob([[-4.6, 23.6], [4.6, 23.6], [3.4, 27.4], [0, 28.6], [-3.4, 27.4]], '#8a2a4a', 2), F(E(0, 27.2, 2, 0.9, '#ff9ab0'))];
  return [...arc([[-2.4, 25.4], [0, 26], [2.4, 25.4]], 1.1, '#7a2a48')];
}
function face(f, Hc) {
  const out = [blob([[-33, -14], [-34, 6], [-29, 22], [-17, 31], [0, 34], [17, 31], [29, 22], [34, 6], [33, -14], [0, -30]], SK.base, 4), F(blob([[-33, -6], [-31, 16], [-26, 24], [-29, 10]], SK.sh, 2))];
  // puffed cheeks when cross
  out.push(F(E(-24, 18, 8, 6, f.cheeks ? '#ffe0e8' : SK.lt)), F(E(24, 18, 8, 6, f.cheeks ? '#ffe0e8' : SK.lt)));
  out.push(...brows(f.b, Hc[3]));
  if (f.e === 'open' || f.e === 'wide' || f.e === 'cross') out.push(...eye(-14, 12, -1, f.e === 'cross' ? 3.2 : 0, f.e === 'wide' ? 1.2 : 0.5, f.t), ...eye(14, 12, 1, f.e === 'cross' ? 3.2 : 0, f.e === 'wide' ? 1.2 : 0.5, f.t));
  else out.push(...shut(-14, -1, f.e), ...shut(14, 1, f.e));
  for (const o of [-1, 1]) {
    out.push(F(E(21 * o, 21, 5.4, 3, f.cheeks ? '#ff8aa0' : '#ffb0c4')));
    for (let i = 0; i < 3; i++) out.push(...arc([[21 * o + (i - 1) * 2.6 - 0.8, 22.2], [21 * o + (i - 1) * 2.6 + 0.8, 20]], 0.5, SK.lt));
  }
  out.push(...arc([[0.6, 18.6], [1.2, 19.6]], 0.7, SK.deep));
  out.push(...mouth(f.m));
  // tears running down: one each side, streams when wailing
  if (f.t >= 1) out.push(blob([[-21, 20], [-18.6, 24], [-19.4, 26.4], [-21, 27], [-22.6, 26.4], [-23.4, 24]], '#b4e2ff', 2), F(E(-21.6, 23.6, 0.6, 1, '#ffffff')));
  if (f.t >= 2) for (const o of [-1, 1]) out.push(...band(curve([[14 * o + 4 * o, 15], [14 * o + 8 * o, 22], [14 * o + 9 * o, 32]], 3), 2.6, 1.6, '#a8dcff', true));
  return out;
}

// ---------- The duvet, the hood, the hair ----------
// (2026-11-25 redraw, the player: "looks kinda bad": the duvet was a stiff grid-quilted box with
// stubby tube arms, all one pale blue. Now it's a soft storm cloud: a puffy bumpy silhouette (round
// lumps all round its edge, outlined only outside), a cosy print of little raindrops and lightning
// bolts, a fluffy pale trim along its edges; it drapes over his arms like a blanket's corners; deeper
// colours so his pale face stands out.)
// A raindrop, point up.
const drop = (x, y, s, c) => blob([[x, y - 2.2 * s], [x + 1.4 * s, y + 0.2 * s], [x + 1.1 * s, y + 1.3 * s], [x, y + 1.8 * s], [x - 1.1 * s, y + 1.3 * s], [x - 1.4 * s, y + 0.2 * s]], c, 2);
const zig = (x, y, s, c) => blob([[x, y], [x + 2.4 * s, y], [x + 1 * s, y + 2.6 * s], [x + 2.6 * s, y + 2.6 * s], [x - 0.8 * s, y + 6.4 * s], [x + 0.2 * s, y + 3.6 * s], [x - 1.4 * s, y + 3.6 * s]], c, 1);
// Lumps round an outline: a round puff at each point (they merge into one bumpy silhouette).
const lumps = (pts, c) => pts.map(([x, y, r]) => E(x, y, r, r * 0.92, c));
// The hood behind his head: a round puffy cloud with lumps all round its top and sides, shade
// underneath, a light on top, a few raindrops printed on it.
const hoodBack = (P) => {
  const cs = P.cs;
  const ring = Array.from({ length: 11 }, (_, i) => {
    const an = Math.PI * (0.92 + (i / 10) * 1.16);
    return [Math.cos(an) * 46, -8 + Math.sin(an) * 50, 15 - Math.abs(i - 5) * 0.5];
  });
  return [
    blob([[-50, 28], [-54, -8], [-42, -48], [0, -64], [42, -48], [54, -8], [50, 28], [0, 40]], cs[1], 3),
    ...lumps(ring, cs[1]),
    F(blob([[-44, -28], [-24, -54], [4, -60], [-10, -50], [-34, -30]], cs[0], 3)),
    F(blob([[-50, 18], [-30, 30], [30, 30], [50, 18], [40, 36], [-40, 36]], cs[2], 3)),
    ...[[-30, -40], [22, -50], [-44, 0], [44, -6]].map(([x, y], i) => F(drop(x, y, 2.2, i % 2 ? P.print : P.print2))),
  ];
};
// The hollow of the hood round his face.
const hollow = (c) => [blob([[-43, 30], [-47, -8], [-34, -42], [0, -51], [34, -42], [47, -8], [43, 30], [0, 42]], c, 3)];
// The hood's fluffy trim round his face: soft pale puffs.
const hoodRim = (P) => {
  const path = [[-42, 32], [-47, 8], [-45, -14], [-36, -35], [-20, -47], [0, -51], [20, -47], [36, -35], [45, -14], [47, 8], [42, 32]];
  // (one soft band, its outer edge gently bumpy: many small overlapping puffs, a shade along its
  // inner side, a light along its outer)
  const pts = curve(path, 4);
  return [
    ...band(pts, 11, 11, P.trim[0], true),
    ...lumps(pts.filter((_, i) => i % 3 === 0).map(([x, y]) => [x * 1.06, y * 1.04 - 0.6, 5.6]), P.trim[0]),
    ...band(pts.map(([x, y]) => [x * 0.9, y * 0.92 + 1.4]), 2.4, 2.4, P.trim[1], true).map(F),
    ...band(pts.map(([x, y]) => [x * 1.08, y * 1.06 - 1.4]), 1.6, 1.6, '#ffffff', true).map(F),
  ];
};
const BOLT_ROOT = [28, -56];
const boltShape = () => {
  const [x, y] = [28, -76];
  const s = 2.2;
  return [blob([[x, y], [x + 4 * s, y], [x + 1.6 * s, y + 5 * s], [x + 4.6 * s, y + 5 * s], [x - 1.4 * s, y + 13 * s], [x + 0.4 * s, y + 7 * s], [x - 2.6 * s, y + 7 * s]], '#ffe27a', 1), F(blob([[x + 0.6 * s, y + 0.8 * s], [x + 2.6 * s, y + 0.8 * s], [x + 1 * s, y + 4.4 * s]], '#fff6c8', 1))];
};
// The duvet round his body: a puffy cloud bundle from his shoulders to below his hips, lumps all
// round its edge; shade low and down its back, a light down its front; the cosy print; the edge
// where it wraps round him, trimmed with pale fluff, running down his front.
function duvet(P) {
  const cs = P.cs;
  const edge = [
    [78, 96, 9], [92, 92, 9], [106, 92, 8], [120, 92, 9], [134, 96, 9],
    [142, 106, 9], [145, 119, 9], [144, 132, 9], [139, 144, 8],
    [70, 106, 9], [67, 119, 9], [68, 132, 9], [73, 144, 8],
  ];
  return [
    blob([[76, 92], [136, 92], [144, 120], [140, 146], [106, 150], [72, 146], [68, 120]], cs[1], 3),
    ...lumps(edge, cs[1]),
    F(blob([[72, 132], [90, 142], [122, 142], [142, 130], [140, 146], [106, 152], [72, 146]], cs[2], 3)),
    F(blob([[128, 96], [146, 112], [144, 140], [130, 132]], cs[2], 3)),
    F(blob([[74, 100], [90, 94], [86, 128], [74, 126]], cs[0], 3)),
    ...[[82, 108], [100, 122], [126, 112], [92, 138], [118, 136], [136, 124], [110, 104]].map(([x, y], i) => F(i % 3 === 1 ? zig(x, y - 3, 1, P.bolt) : drop(x, y, 1.8, i % 2 ? P.print : P.print2))),
    // the wrap: the duvet's edge crossing his front, trimmed
    ...band(curve([[104, 94], [106, 106], [109, 118], [114, 130], [120, 140], [126, 148]], 4), 7, 7, P.trim[0], true),
    ...band(curve([[106.6, 95], [108.6, 106], [111.6, 118], [116.6, 130], [122.6, 140], [128.6, 147]], 4), 1.6, 1.6, P.trim[1], true).map(F),
    ...band(curve([[102.4, 96], [104, 106], [106.6, 118], [111.2, 130], [117, 140]], 4), 1.2, 1.2, '#ffffff', true).map(F),
  ];
}
// Its bottom edge: a row of big soft puffs, drips hanging off it.
const hem = (P) => {
  const cs = P.cs;
  const xs = [72, 82, 92, 102, 112, 122, 132, 141];
  return [
    ...xs.map((x, i) => E(x, 147 + (i % 2) * 1.6, 6.4, 5, cs[1])),
    ...xs.map((x, i) => F(E(x + 1, 150 + (i % 2) * 1.6, 4.6, 1.8, cs[2]))),
    ...xs.map((x, i) => F(E(x - 2, 145 + (i % 2) * 1.6, 2.4, 1.2, cs[0]))),
    ...[[80, 155], [100, 156], [124, 155]].map(([x, y]) => F(drop(x, y, 1.2, '#bfe4ff'))),
  ];
};
// The duvet's corners draped over his arms: puffy cloud lumps along the arm, a pale fluffy cuff at
// the wrist so his hand peeks out.
const J = { shN: [118, 101], elN: [120.2, 119], wrN: [120.5, 136], shF: [92, 101], elF: [89.8, 119], wrF: [89.5, 136] };
const along = (a, b, n) => Array.from({ length: n }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / (n - 1), a[1] + ((b[1] - a[1]) * i) / (n - 1)]);
const sleeve = (k, P) => {
  const [sh, el] = [J[`sh${k}`], J[`el${k}`]];
  const cs = P.cs;
  return [
    ...lumps(along([sh[0], sh[1] + 3], el, 4).map(([x, y], i) => [x, y, 7.8 - i * 0.2]), cs[1]),
    F(E(sh[0] - 2, sh[1] + 0.4, 4, 2, cs[0])),
    F(drop(sh[0] + 1, sh[1] + 6, 1.5, P.print)),
  ];
};
const fold = (k, P) => {
  const [el, wr] = [J[`el${k}`], J[`wr${k}`]];
  const cs = P.cs;
  return [
    ...lumps(along(el, [wr[0], wr[1] - 2], 4).map(([x, y], i) => [x, y, 8.4 - i * 0.5]), cs[1]),
    F(E(el[0] + 2.6, el[1] + 4, 3, 5, cs[2])),
    ...band(curve([[wr[0] - 5, wr[1] - 2], [wr[0], wr[1] + 0.4], [wr[0] + 5, wr[1] - 2]], 3), 5.4, 5.4, P.trim[0], true),
    ...band(curve([[wr[0] - 4, wr[1] + 0.2], [wr[0], wr[1] + 2.2], [wr[0] + 4, wr[1] + 0.2]], 3), 1.2, 1.2, P.trim[1], true).map(F),
  ];
};
// The raindrop plush: a soft blue drop with a little face, held in his near hand.
const PLUSH = [120.5, 137];
const plush = () => {
  const [x, y] = PLUSH;
  const k = 1.35;
  const Q = (u, v) => [x + u * k, y + v * k];
  return [
    blob([Q(0, -12), Q(8, 0), Q(8, 7), Q(0, 13), Q(-8, 7), Q(-8, 0)], '#8ad0ff', 2),
    F(blob([Q(-3, -4), Q(0, -9), Q(-1, 2)], '#e0f4ff', 1)), F(blob([Q(4, 4), Q(7, 2), Q(6, 9), Q(2, 11)], '#5aa8e0', 2)),
    F(E(...Q(-3, 4), 1.4, 1.7, '#2a3a5a')), F(E(...Q(3, 4), 1.4, 1.7, '#2a3a5a')), F(E(...Q(-2.6, 3.2), 0.5, 0.5, '#ffffff')), F(E(...Q(3.4, 3.2), 0.5, 0.5, '#ffffff')),
    ...arc([Q(-1.4, 8), Q(0, 9), Q(1.4, 8)], 0.7, '#2a3a5a'),
    F(E(...Q(-5, 7), 1.8, 1, '#ffb0c4')), F(E(...Q(5, 7), 1.8, 1, '#ffb0c4')),
  ];
};

// His hair (2026-11-25, the player: "make hair more cute"): a soft fluffy fringe of a few big rounded
// locks swept to one side, not many thin strands: each lock its own round tip, a soft shade tucked at
// the top of each gap, a little shine on each, a glossy ring across the crown; a little curl springing
// up at his part; and two soft locks beside his cheeks, curling in at the tips.
const PART = [10, -46];
const BANG_EDGE = [[-39, -12], [-32, -1], [-22, -14], [-10, 0], [1, -15], [12, -2], [23, -16], [32, -5], [39, -12]];
function fringe(Hc) {
  const L = BANG_EDGE[0];
  const R = BANG_EDGE[BANG_EDGE.length - 1];
  const crown = [[R[0], R[1] - 14], [24, -40], [0, -46], [-24, -40], [L[0], L[1] - 14]];
  const out = [F(blob([...BANG_EDGE.map(([x, y]) => [x + 0.8, y + 2.4]), [R[0], R[1] - 6], [L[0], L[1] - 6]], SK.sh, 3)), blob([...BANG_EDGE, ...crown], Hc[1], 3)];
  // each lock: a soft round shade along its tip, a little shine down it, and a fine soft line where it
  // meets the next
  BANG_EDGE.forEach((p, i) => {
    if (i % 2 === 1) {
      out.push(F(E(p[0] + 0.8, p[1] - 2.4, 4.2, 1.8, Hc[2])));
      out.push(lens([p[0] - 3.6, p[1] - 12], [p[0] - 1.2, p[1] - 4], 2.2, -1, Hc[0]));
    } else if (i > 0 && i < BANG_EDGE.length - 1) out.push(...arc([[p[0], p[1] - 1], [p[0] + 1.6, p[1] - 9]], 0.8, Hc[2]));
  });
  // the glossy ring across the crown, a bright core
  out.push(lens([-28, -28], [-10, -38], 3.6, -1.6, Hc[0]), lens([-4, -40], [14, -38], 3.4, -1.6, Hc[0]), lens([-14, -35], [-6, -38.6], 1.4, -0.6, '#ffffff'));
  // the little curl springing up at his part
  out.push(...lockOf([[8, -30], [5, -37], [8, -42], [13, -41], [13, -37], [10, -36]], 4.4, 1.6, Hc[1]), lens([5.6, -35], [8.6, -40.6], 1, -0.5, Hc[0]));
  return out;
}
// Two soft locks falling from the hood beside his cheeks, their tips curling in.
const flips = (Hc) => [-1, 1].flatMap((o) => [
  ...lockOf([[37 * o, 4], [40 * o, 14], [39 * o, 22], [34 * o, 25]].map(([x, y]) => [x + 0.8 * o, y + 1.4]), 8, 3, Hc[2]),
  ...lockOf([[37 * o, 4], [40 * o, 14], [39 * o, 22], [34 * o, 25]], 8, 3, Hc[1]),
  lens([38 * o, 6], [40 * o, 16], 1.4, -0.6 * o, Hc[0]),
]);

// ---------- His pieces ----------
const cache = new Map();
// mood: a face (storm coat), or 'clear' (the white coat, the cleared face).
export function sulkDesign(mood = 'idle') {
  const clear = mood === 'clear';
  const key = clear ? 'clear' : mood in FACES ? mood : 'idle';
  if (cache.has(key)) return cache.get(key);
  const P = COATS[clear ? 'clear' : 'storm'];
  const f = FACES[clear ? 'happy' : key];
  const body = blankBody('spirit', { tpose: false, guides: false });
  const recolor = (list, pal) => list.map((sh) => ({ ...sh, c: { [BLANK.lt]: pal[0], [BLANK.base]: pal[1], [BLANK.sh]: pal[2], [BLANK.deep]: pal[3] }[sh.c] ?? sh.c }));
  const groups = {
    hoodB: inHead(hoodBack(P)),
    bolt: clear ? [] : inHead(boltShape()),
    // (his wisp IS the duvet's trailing corner: its colours and its print, so
    // nothing pale and ghostly pokes out from under the hem)
    lower: [
      ...recolor(body.groups.lower, P.cs),
      ...[[100, 160], [112, 170], [98, 178]].map(([x, y], i) => F(i === 1 ? zig(x, y - 3, 0.9, P.bolt) : drop(x, y, 1.6, i ? P.print2 : P.print))),
    ],
    duvet: duvet(P),
    hem: hem(P),
    sleeveFu: sleeve('F', P),
    sleeveNu: sleeve('N', P),
    foldF: fold('F', P),
    foldN: fold('N', P),
    head: inHead([...hollow(P.hollow), ...face(f, P.hair), ...fringe(P.hair), ...hoodRim(P), ...flips(P.hair)]),
    plush: plush(),
  };
  cache.set(key, groups);
  return groups;
}
// Joints of his own, in base units: his mouth; the bolt's root; the hem's middle; the plush's middle.
export const MOUTH = H2B([0, 26]);
export const BOLT = H2B(BOLT_ROOT);
export const HEM = [106, 146];
export const PLUSH_C = PLUSH;
