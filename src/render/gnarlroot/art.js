// Gnarlroot's design (2026-11-25, remade on the brute base, the player's pick "A, Old Mossbeard":
// "heavy polish redraw ... it should look so awesome since it's a boss"). The oldest tree on the
// island, a huge gentle treeherd, fast asleep, saying one word a day:
//   - a great canopy of leaves for hair, clouds of foliage in three tones, acorns and white blossoms
//     in it, ivy trailing from its edge;
//   - a stump of a head grown out of his trunk, bark ridges over a face of pale heartwood; deep
//     knothole eyes glowing amber under heavy bark lids (his own eyes: no one else has them), mossy
//     brows, a branch-stub nose with a leaf on it, a moss mustache, a long soft moss beard in waves;
//   - a barrel trunk of long bark ridges, lit on his left, a knothole in his chest with a mushroom
//     family on its sill, a mantle of moss over his shoulders with strands hanging, ivy climbing;
//   - thick branch arms with boulder shoulders and knobbly elbows, burl fists with twig fingers;
//   - trunk legs with knobbly knees, flaring into root feet; moss and mushrooms on them.
// Every piece in the brute base's own drawing units (blankBody('brute'), read only), named for the bone
// it rides (see gnarlDesign below); each joint covered by a knob or an overlap so a bend never opens
// a gap.
import { E, T, F } from '../mobs/kit.js';
import { band, curve, blob, mapShape } from '../mobs/kidbase.js';

const arc = (pts, w, c) => band(curve(pts, 3), w, w, c, true);
const taper = (pts, w0, w1, c) => band(curve(pts, 3), w0, w1, c, true);
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export const BARK = ['#c49a70', '#9c6e4c', '#7a5238', '#563826'];
const HEART = ['#f2d4ae', '#e2b88e', '#c89870'];
export const LEAF = ['#c4e894', '#86c864', '#529a48', '#3c7a3c'];
export const MOSS = ['#cdeca6', '#94ca72', '#62a056'];
const GLOW = { amber: ['#ffae3a', '#ffd27a', '#fff6d8'], angry: ['#ff7a2a', '#ffb050', '#fff0c0'], soft: ['#ffc860', '#ffe4a0', '#fffbe8'] };
// The base's joints (blankBody('brute').J) and its spine's bend points.
export const J = {
  neck: [151, 98], crown: [151, 42], hip: [150, 196], stern: [150, 110.2], ribs: [150, 156.4], navel: [150, 179.1],
  shF: [106, 120], elF: [101.44, 158], wrF: [100.68, 191], shN: [194, 120], elN: [198.56, 158], wrN: [199.32, 191],
  hipF: [127, 198], kneeF: [127, 228], ankF: [127, 252], hipN: [173, 198], kneeN: [173, 228], ankN: [173, 252],
};
// (his head drawn a size up from the base's, about where it meets the trunk: chibi proportions)
const HK = 1.2;
const HC = [151, 108];
export const H = ([x, y]) => [HC[0] + (x - HC[0]) * HK, HC[1] + (y - HC[1]) * HK];
const big = (list) => list.map((sh) => mapShape(sh, H, HK));

// ---------- shared bits ----------
// Bark: long vertical ridges with dark cracks between them (the part's darkest tone beneath), each
// ridge broken here and there and tapering at its ends, wandering a little; lit on his left, shaded
// on his right, a pale line of light down the lit ridges.
function ridges(cx, y0, y1, hw, seed, pw = 11, cols = 0) {
  const out = [];
  const wMax = Math.max(...Array.from({ length: 12 }, (_, i) => hw(y0 + ((y1 - y0) * i) / 11)));
  const n = cols || Math.max(2, Math.round((2 * wMax) / pw));
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    // (a long run is broken in two or three; a short one stays whole)
    const cuts = y1 - y0 < 70 ? [y0, y1] : [y0, y0 + (y1 - y0) * (0.3 + hash(seed + i) * 0.25), y0 + (y1 - y0) * (0.62 + hash(seed * 2 + i) * 0.22), y1].filter((v, k, arr) => k === 0 || k === arr.length - 1 || hash(seed + i * 3 + k) > 0.3);
    for (let k = 0; k < cuts.length - 1; k++) {
      const ya = cuts[k] + 2;
      const yb = cuts[k + 1] - 2;
      if (yb - ya < 10) continue;
      const pts = [];
      for (let j = 0; j <= 4; j++) {
        const y = ya + ((yb - ya) * j) / 4;
        const w = hw(y) - 2;
        pts.push([cx - w + 2 * w * u + Math.sin(j * 1.1 + i * 2.3) * 0.9, y]);
      }
      const side = (pts[2][0] - cx) / (hw(pts[2][1]) || 1);
      const c = side < -0.4 ? BARK[0] : side > 0.45 ? BARK[2] : BARK[1];
      const ww = pw * 0.36 * (0.85 + hash(seed + i * 5 + k) * 0.3);
      out.push(...band(curve(pts, 3), ww * 0.9, ww, c, true).map(F));
      if (side < 0.45) out.push(...band(curve(pts.slice(1, 4).map(([x, y]) => [x - ww * 0.4, y]), 3), ww * 0.22, ww * 0.12, side < -0.4 ? '#fff0d8' : BARK[0], true).map(F));
    }
  }
  return out;
}
// Ridges along a limb from a to b (half-widths wa, wb), lit on the outer side o.
function limbRidges(a, b, wa, wb, o, seed) {
  const out = [];
  for (let r = 0; r < 4; r++) {
    const f = -0.75 + r * 0.5;
    const pts = [0.1, 0.5, 0.9].map((t, j) => {
      const p = lerp(a, b, t);
      return [p[0] + f * (wa + (wb - wa) * t) * o + Math.sin(j + r + seed) * 1.2, p[1]];
    });
    const lit = f * o < 0;
    out.push(...band(curve(pts, 3), 3.4, 3, lit ? BARK[0] : r === 3 ? BARK[2] : BARK[1], true).map(F));
    if (lit) out.push(...band(curve(pts.map(([x, y]) => [x - 0.8 * o, y]), 3), 0.7, 0.4, '#fff0d8', true).map(F));
  }
  return out;
}
export function leaf(x, y, s, a, c, rib) {
  const [dx, dy] = [Math.cos(a), Math.sin(a)];
  const [nx, ny] = [-dy, dx];
  const P = (u, v) => [x + dx * u * s + nx * v * s, y + dy * u * s + ny * v * s];
  return [blob([P(0, 0), P(0.5, 0.42), P(1.2, 0.3), P(1.7, 0), P(1.2, -0.3), P(0.5, -0.42)], c, 2), ...arc([P(0.15, 0), P(1.4, 0)], 0.5 * s * 0.4, rib)];
}
// A cloud of foliage: a soft mass, its shade below, its light above, leaves all round its edge.
function foliage(cx, cy, r, seed, n = 14, dark = false) {
  const p = dark ? [LEAF[1], LEAF[2], LEAF[3]] : [LEAF[0], LEAF[1], LEAF[2]];
  const out = [blob(Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const rr = r * (0.86 + hash(i + seed) * 0.22);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.82];
  }), p[1], 3)];
  out.push(F(blob([[cx - r * 0.8, cy + r * 0.1], [cx, cy + r * 0.3], [cx + r * 0.85, cy + r * 0.05], [cx + r * 0.6, cy + r * 0.62], [cx - r * 0.5, cy + r * 0.66]], p[2], 2)));
  out.push(F(blob([[cx - r * 0.6, cy - r * 0.3], [cx - r * 0.1, cy - r * 0.62], [cx + r * 0.4, cy - r * 0.5], [cx + r * 0.1, cy - r * 0.2]], p[0], 2)));
  // (veins of shade between the leaf clumps inside it)
  for (let i = 0; i < 3; i++) {
    const a = hash(seed + i * 9) * Math.PI * 2;
    out.push(...arc([[cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2], [cx + Math.cos(a + 0.3) * r * 0.55, cy + Math.sin(a + 0.3) * r * 0.45]], 1.2, p[2]).map(F));
  }
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(seed + i) * 0.4;
    const rr = r * (0.72 + hash(seed * 3 + i) * 0.32);
    out.push(...leaf(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8, r * 0.2, a + 0.4, i % 3 ? p[1] : p[0], p[2]).map(F));
  }
  return out;
}
export const acorn = (x, y, s, rot = 0) => {
  const R = (u, v) => [x + (u * Math.cos(rot) - v * Math.sin(rot)) * s, y + (u * Math.sin(rot) + v * Math.cos(rot)) * s];
  return [blob([R(-2.2, 0), R(-2, 2.4), R(0, 4.2), R(2, 2.4), R(2.2, 0)], '#c8925a', 2), F(blob([R(-1.4, 0.6), R(-1, 2.6), R(-0.2, 3.2), R(-0.6, 1)], '#e6b47c', 1)), blob([R(-2.8, 0.4), R(-2.4, -1.6), R(0, -2.4), R(2.4, -1.6), R(2.8, 0.4)], '#7a5638', 2), ...[-1.4, 0, 1.4].map((u) => F(E(...R(u, -0.8), 0.5 * s, 0.4 * s, '#5e3c28'))), ...arc([R(0, -2.2), R(0.6, -3.6)], 0.7 * s, '#5e3c28')];
};
const mushroom = (x, y, s, cap, dots = '#fff6ea') => [
  ...taper([[x, y], [x, y - 3 * s]], 2.2 * s, 1.8 * s, '#f6ead8'),
  blob([[x - 3.6 * s, y - 2.6 * s], [x - 2.4 * s, y - 5.4 * s], [x, y - 6.2 * s], [x + 2.4 * s, y - 5.4 * s], [x + 3.6 * s, y - 2.6 * s]], cap, 2),
  F(blob([[x - 2.6 * s, y - 3.4 * s], [x - 1.6 * s, y - 5 * s], [x - 0.2 * s, y - 5.4 * s], [x - 1 * s, y - 3.6 * s]], '#ffffff', 1)),
  F(E(x + 1.4 * s, y - 3.8 * s, 0.5 * s, 0.5 * s, dots)), ...arc([[x - 3 * s, y - 2.6 * s], [x + 3 * s, y - 2.6 * s]], 0.4 * s, '#e8d4bc'),
];
const blossom = (x, y, r, c = '#fff4f8') => [...[0, 1, 2, 3, 4].map((i) => E(x + Math.cos(i * 1.2566 - 1.57) * r * 0.7, y + Math.sin(i * 1.2566 - 1.57) * r * 0.7, r * 0.6, r * 0.6, c)), F(E(x, y, r * 0.38, r * 0.38, '#ffd36a'))];
const moss = (pts, lift = 1.4) => [blob(pts, MOSS[1], 3), F(blob(pts.slice(0, Math.ceil(pts.length / 2)).map(([x, y]) => [x, y - lift]), MOSS[0], 3))];
// A strand of hanging moss.
const strand = (x, y, len, sw, i) => [...taper([[x, y], [x + sw, y + len * 0.5], [x - sw * 0.5, y + len]], 6, 1.4, i % 2 ? MOSS[1] : MOSS[2]), ...taper([[x - 1, y + 1], [x - 1 + sw, y + len * 0.5]], 1.4, 0.5, MOSS[0]).map(F)];
// Ivy: a thin vine along a path, a leaf every so often.
function ivy(pts, seed) {
  const sp = curve(pts, 4);
  const out = [...band(sp, 1.4, 1, '#4a7a3a', true)];
  for (let i = 2; i < sp.length - 1; i += 3) {
    const [x, y] = sp[i];
    out.push(...leaf(x, y, 3.2, (i % 2 ? -0.6 : 3.7) + hash(seed + i) * 0.5, i % 3 ? LEAF[1] : LEAF[0], LEAF[2]).map(F));
  }
  return out;
}

// ---------- the canopy (on his head, behind and in front) ----------
// Behind his head: the far clouds of leaves, darker.
const canopyBack = () => big([
  ...foliage(110, 58, 30, 3, 14, true), ...foliage(192, 58, 30, 5, 14, true), ...foliage(151, 43, 36, 7, 18, true),
  ...foliage(92, 84, 22, 9, 12, true), ...foliage(210, 84, 22, 11, 12, true),
]);
// Over the top of his head: the near clouds, acorns and blossoms in them, ivy trailing.
const canopy = () => big([
  ...foliage(124, 42, 24, 13), ...foliage(178, 42, 24, 15), ...foliage(151, 32, 22, 17),
  ...foliage(104, 58, 18, 19, 10), ...foliage(198, 58, 18, 21, 10),
  ...ivy([[96, 70], [92, 84], [96, 98]], 1), ...ivy([[206, 70], [210, 86], [205, 100]], 2),
  ...acorn(118, 52, 1.5, -0.3), ...acorn(184, 46, 1.4, 0.4), ...acorn(160, 26, 1.3, 0.1), ...acorn(102, 64, 1.3, -0.2), ...acorn(200, 66, 1.2, 0.3),
  ...[[134, 30], [196, 56], [108, 54], [170, 30], [150, 20]].flatMap(([x, y]) => blossom(x, y, 3.2)),
]);
export const CANOPY_ROOT = H([151, 50]);

// ---------- his face ----------
// Knothole eyes (his own): a deep oval hollow in the heartwood, the amber glow inside it with a bright
// core and a glint, and a heavy bark lid over the top. `lid` lowers the lid (0 open, 1 shut);
// `slant` lowers its inner end (a glare); `glow` the glow's colours; `happy` turns the eye to a
// smiling crescent of glow; `wide` opens the hollow and shrinks the glow to a point (surprise).
function knotEye(x, y, o, { lid = 0.35, slant = 0, glow = GLOW.amber, happy = false, wide = 0, look = 0 } = {}) {
  const hw = 8.4 + wide;
  const out = [blob([[x - hw, y + 1], [x - hw * 0.78, y - 6 - wide], [x, y - 7.6 - wide], [x + hw * 0.88, y - 5 - wide], [x + hw, y + 1.6], [x + 3, y + 6.4 + wide * 0.6], [x - 4.4, y + 6 + wide * 0.6]], '#3a2418', 2)];
  // (the hollow's rim, lit along its lower edge)
  out.push(...arc([[x - hw * 0.8, y + 3], [x, y + 6.6 + wide * 0.6], [x + hw * 0.8, y + 3.4]], 0.8, '#7a5238').map(F));
  if (happy) {
    out.push(...band(curve([[x - 5.6, y + 2.4], [x, y - 2.4], [x + 5.6, y + 2.4]], 3), 2.8, 2.8, glow[0], true).map(F), ...band(curve([[x - 4.4, y + 1.6], [x, y - 1.6], [x + 4.4, y + 1.6]], 3), 1.2, 1.2, glow[2], true).map(F));
    return out;
  }
  const gx = x + (0.6 + look) * o;
  if (wide) out.push(F(E(gx, y + 1, 2.8, 2.8, glow[0])), F(E(gx, y + 1, 1.6, 1.6, glow[2])));
  else out.push(F(E(gx, y + 1.2, 5.6, 4.8, glow[0])), F(E(gx, y + 1.6, 4, 3.4, glow[1])), F(E(gx, y + 2, 2, 1.8, glow[2])), F(E(gx - 2.6 * o, y - 0.4, 1.4, 1.2, '#ffffff')));
  // the bark lid: its lower edge from y - 8 (open) down to y + 4 (shut), slanting for a glare
  if (lid > 0 || slant) {
    // (the inner end is toward his nose: on the left of his near eye, the right of his far one)
    const yIn = y - 8.4 - wide + (12.6 + wide) * lid + slant * 5;
    const yOut = y - 8.4 - wide + (12.6 + wide) * lid - slant * 1.2;
    const [yL, yR] = o > 0 ? [yIn, yOut] : [yOut, yIn];
    const [xL, xR] = [x - hw * 1.12, x + hw * 1.12];
    const mid = (yL + yR) / 2 + 0.8 + lid;
    out.push(F(blob([[xL - 1, yL], [xL - 0.6, y - 9 - wide], [x, y - 10.6 - wide], [xR + 0.6, y - 9 - wide], [xR + 1, yR], [x, mid]], '#b08460', 2)));
    out.push(...taper([[xL, yL], [x, mid], [xR, yR]], 1.8, 1.8, '#4a2e20').map(F));
    out.push(...arc([[x - hw * 0.8, y - 8.6 - wide], [x, y - 9.8 - wide], [x + hw * 0.8, y - 8.6 - wide]], 0.7, '#d4ac84').map(F));
  }
  return out;
}
// Mossy brows: a soft tuft over each eye, set by `b` (soft, up, cross, worry, high).
function brows(b) {
  const one = (o) => {
    const x = 151 + 14 * o;
    const tilt = { soft: 0, up: -2.4, cross: 4.4, worry: -3.6, high: -4.4 }[b] ?? 0;
    const lift = { soft: 0, up: -2, cross: 1.6, worry: -1, high: -4.6 }[b] ?? 0;
    const inner = 58 + lift + tilt;
    const outer = 58 + lift - tilt * 0.4;
    const P = (u, y) => [x + u * o, y];
    return moss([P(-11, inner + 6), P(-9, inner - 1), P(0, (inner + outer) / 2 - 3), P(10, outer - 1), P(13, outer + 5), P(4, (inner + outer) / 2 + 3.6), P(-6, inner + 5)], 1.2);
  };
  return [...one(-1), ...one(1)];
}
// The mouth, in the gap under his mustache: sleepy smile, talk (an "o" working), yawn, laugh, frown,
// a roar for his heavy words, a hum, a wobble when hurt.
function mouth(m) {
  const ink = '#3a2418';
  if (m === 'talk') return [blob([[146, 98], [156, 98], [157, 103], [151, 106], [145, 103]], ink, 2), F(E(151, 103.6, 3, 1.4, '#a8504a'))];
  if (m === 'yawn') return [blob([[143, 97], [159, 97], [160, 106], [151, 111], [142, 106]], ink, 2), F(E(151, 107.6, 5, 2.4, '#a8504a'))];
  if (m === 'roar') return [blob([[141, 96], [161, 96], [162, 104], [151, 110], [140, 104]], ink, 2), F(E(151, 106, 6, 2.4, '#a8504a')), ...[143.6, 147.6, 154.4, 158.4].map((x) => F(T([[x - 1.4, 96.6], [x + 1.4, 96.6], [x, 99.6]], '#f2e2c4')))];
  if (m === 'laugh') return [blob([[143, 98], [159, 98], [156, 103], [151, 105], [146, 103]], ink, 2), F(E(151, 102.6, 4, 1.4, '#a8504a'))];
  if (m === 'frown') return arc([[144, 102], [151, 99.4], [158, 102]], 1.6, ink);
  if (m === 'hum') return [blob([[149, 98.6], [153, 98.6], [153.6, 101.6], [151, 102.6], [148.4, 101.6]], ink, 2)];
  if (m === 'wobble') return arc([[144, 101], [147, 99.6], [151, 101], [155, 99.6], [158, 101]], 1.4, ink);
  return arc([[144, 99], [151, 102.4], [158, 99]], 1.6, ink);
}
// e: the eyes ({...knotEye options} or 'shut' / 'squeeze'); m: the mouth; b: the brows.
const FACES = {
  idle: { e: { lid: 0.42 }, m: 'smile', b: 'soft' },
  blink: { e: 'shut', m: 'smile', b: 'soft' },
  sleep: { e: 'shut', m: 'smile', b: 'soft', snore: 1 },
  talk: { e: { lid: 0.5, glow: GLOW.soft }, m: 'talk', b: 'soft' },
  happy: { e: { happy: true, glow: GLOW.soft }, m: 'laugh', b: 'up' },
  laugh: { e: { happy: true, glow: GLOW.soft }, m: 'laugh', b: 'up' },
  angry: { e: { lid: 0.3, slant: 1, glow: GLOW.angry }, m: 'frown', b: 'cross' },
  roar: { e: { lid: 0.15, slant: 1, glow: GLOW.angry }, m: 'roar', b: 'cross' },
  hurt: { e: 'squeeze', m: 'wobble', b: 'worry' },
  dead: { e: 'shut', m: 'smile', b: 'soft' },
  o: { e: { lid: 0, wide: 1.4 }, m: 'talk', b: 'high' },
  yawn: { e: 'shut', m: 'yawn', b: 'up' },
  hum: { e: 'shut', m: 'hum', b: 'soft' },
  sad: { e: { lid: 0.6, glow: GLOW.soft, look: -0.6 }, m: 'wobble', b: 'worry' },
  fond: { e: { lid: 0.62, glow: GLOW.soft }, m: 'smile', b: 'up' },
};
export const MOODS = Object.keys(FACES);
const shutEye = (x, o, kind) => {
  if (kind === 'squeeze') return [...taper([[x - 7 * o, 70], [x + 5 * o, 74], [x - 7 * o, 78]], 2.6, 2.6, '#4a2e20')];
  return [
    blob([[x - 9.4, 74], [x - 7, 66], [x, 64.4], [x + 8, 67.4], [x + 9.6, 74.4], [x, 76.4]], '#b08460', 2),
    ...taper([[x - 8.6, 74.2], [x, 76.6], [x + 8.6, 74.6]], 2, 2, '#4a2e20'),
    ...arc([[x - 6.4, 66.6], [x, 65.4], [x + 6.4, 66.8]], 0.7, '#d4ac84').map(F),
  ];
};
// The stump of a head grown out of his trunk: bark ridges over the brow and sides, a face of pale
// heartwood with its grain, the knotholes, the brows, the nose, the mustache, the mouth.
function head(f) {
  const out = [blob([[112, 110], [110, 72], [118, 48], [134, 40], [151, 36], [168, 40], [184, 48], [192, 72], [190, 110]], BARK[3], 3)];
  out.push(...ridges(151, 38, 64, (y) => 30 + (y - 36) * 0.5, 41, 10));
  out.push(...ridges(116, 64, 108, () => 5, 43, 6), ...ridges(186, 64, 108, () => 5, 47, 6));
  out.push(blob([[120, 66], [134, 58], [151, 56], [168, 58], [182, 66], [184, 88], [174, 104], [151, 110], [128, 104], [118, 88]], HEART[1], 3));
  out.push(F(blob([[122, 70], [134, 62], [146, 60], [134, 70], [126, 86]], HEART[0], 2)), F(blob([[176, 70], [182, 86], [172, 100], [166, 98], [174, 84]], HEART[2], 2)));
  // (the heartwood's grain: fine rings round the face)
  for (const k of [0.9, 0.75]) out.push(...arc([[151 - 30 * k, 68], [151 - 34 * k, 86], [151 - 24 * k, 100]], 0.5, HEART[2]).map(F), ...arc([[151 + 30 * k, 68], [151 + 34 * k, 86], [151 + 24 * k, 100]], 0.5, HEART[2]).map(F));
  const e = f.e;
  if (typeof e === 'object') for (const o of [-1, 1]) out.push(...knotEye(151 + 14 * o, 74, o, e));
  else for (const o of [-1, 1]) out.push(...shutEye(151 + 14 * o, o, e));
  out.push(...brows(f.b));
  // cheeks of soft pink lichen
  out.push(F(E(127, 88, 5, 3, '#f0b8a0')), F(E(175, 88, 5, 3, '#f0b8a0')));
  out.push(...mouth(f.m));
  // the moss mustache, the branch-stub nose with its leaf over it
  out.push(...moss([[134, 92], [144, 87], [151, 90], [158, 87], [168, 92], [160, 95], [151, 93.4], [142, 95]], 1.2));
  out.push(...[[134, 92, -1], [168, 92, 1]].flatMap(([x, y, s]) => taper([[x, y], [x + 3.4 * s, y + 3], [x + 2 * s, y + 6]], 4, 1.4, MOSS[1])));
  out.push(blob([[146, 74], [156, 74], [162, 82], [156, 89], [146, 87]], BARK[0], 2), F(E(149, 78.6, 1.6, 3, '#e8c49c')), F(E(156, 85, 2.6, 1.6, BARK[1])));
  out.push(...taper([[158, 80], [166, 75]], 3, 1.4, BARK[1]), ...leaf(166, 75, 3.2, -0.8, LEAF[1], LEAF[2]));
  return big(out);
}
// The long soft moss beard, hanging in waves from his chin (on its own spring).
const beard = () => big([
  ...[-26, -17, -8, 1, 10, 19, 27].flatMap((dx, i) => {
    const x = 151 + dx;
    const top = Math.abs(dx) < 12 ? 107 : 100 - (Math.abs(dx) - 12) * 0.2;
    const len = 38 + hash(i + 2) * 16 - Math.abs(dx) * 0.5;
    const sw = (hash(i) - 0.5) * 5;
    return [
      ...taper([[x, top], [x + sw, top + len * 0.35], [x - sw, top + len * 0.7], [x + sw * 0.5, top + len]], 11, 2.4, i % 2 ? MOSS[1] : MOSS[2]),
      ...taper([[x - 2, top + 2], [x - 2 + sw, top + len * 0.35], [x - 2 - sw, top + len * 0.6]], 2, 0.6, MOSS[0]).map(F),
    ];
  }),
  ...moss([[124, 98], [136, 100], [142, 108], [151, 110], [160, 108], [166, 100], [178, 98], [172, 112], [151, 116], [130, 112]], 1.4),
  ...blossom(136, 112, 2.6), ...blossom(166, 118, 2.2),
]);
export const BEARD_ROOT = H([151, 104]);

// ---------- his trunk, in three pieces that overlap (so a bend never opens a gap) ----------
const TRUNK_HW = (y) => (y < 112 ? 46 + (y - 100) * 0.5 : y < 150 ? 52 + (y - 112) * 0.05 : y < 190 ? 54 - (y - 150) * 0.15 : 48 + (y - 190) * 0.05);
function trunkBand(y0, y1, seed) {
  const L = [];
  const R = [];
  for (let y = y0; y <= y1; y += 6) {
    L.push([151 - TRUNK_HW(y), y]);
    R.push([151 + TRUNK_HW(y), y]);
  }
  return [blob([...L, [151, y1 + 4], ...R.reverse(), [151, y0 - 4]], BARK[3], 2), ...ridges(151, y0, y1, TRUNK_HW, seed, 12, 9)];
}
// On his chest: the trunk's top, the knothole with its mushrooms, the moss mantle and its strands.
const trunkTop = () => [
  ...trunkBand(96, 168, 1),
  blob([[112, 150], [122, 142], [134, 148], [134, 162], [120, 166]], '#5a3624', 2), F(E(123, 155, 6.4, 6, '#2e1c14')), F(E(121, 153, 2.4, 2, '#4a2e20')),
  ...mushroom(116, 166, 1.3, '#f0c080'), ...mushroom(124, 167, 1, '#f09a70'), ...mushroom(131, 166, 0.8, '#f0b090'),
  ...ivy([[186, 160], [182, 140], [186, 122], [180, 108]], 4),
  ...moss([[100, 118], [124, 104], [151, 100], [178, 104], [202, 118], [190, 128], [151, 120], [112, 128]]),
  ...[110, 122, 134, 168, 180, 192].flatMap((x, i) => strand(x, 116 + (i % 2) * 4, 18 + hash(i + 5) * 16, (hash(i) - 0.5) * 4, i)),
];
// On his waist: the middle of the trunk, a band of lighter bark.
const trunkMid = () => [...trunkBand(150, 196, 2), ...ivy([[186, 160], [180, 176], [186, 190]], 5)];
// On his hips: the trunk's base, flaring a little, roots of the trunk running down into his legs.
const trunkLow = () => [
  ...trunkBand(180, 224, 3),
  ...[118, 140, 162, 184].flatMap((x, i) => taper([[x, 210], [x + (i < 2 ? -2 : 2), 224]], 9, 6, i % 2 ? BARK[1] : BARK[2])),
  ...moss([[106, 216], [116, 212], [124, 217], [114, 221]]), ...mushroom(192, 222, 1.2, '#e88a5a'),
];

// ---------- his arms ----------
// The upper arm: a boulder of a shoulder with moss on it, the ridged limb to below the elbow, a knob
// at the elbow (the forearm's root hides under it).
function upperArm(k) {
  const [sh, el] = [J[`sh${k}`], J[`el${k}`]];
  const o = k === 'N' ? 1 : -1;
  const out = [...taper([[sh[0], sh[1] - 4], el], 34, 27, BARK[3]), ...limbRidges(sh, el, 15, 12, o, k === 'N' ? 7 : 3)];
  out.push(blob([[sh[0] - 18, sh[1] + 4], [sh[0] - 14, sh[1] - 12], [sh[0], sh[1] - 18], [sh[0] + 14, sh[1] - 12], [sh[0] + 18, sh[1] + 4], [sh[0], sh[1] + 12]], BARK[1], 3));
  out.push(F(blob([[sh[0] - 12, sh[1] - 6], [sh[0] - 6, sh[1] - 14], [sh[0] + 4, sh[1] - 14], [sh[0] - 2, sh[1] - 4]], BARK[0], 2)));
  out.push(...moss([[sh[0] - 16, sh[1] - 2], [sh[0] - 8, sh[1] - 14], [sh[0] + 6, sh[1] - 16], [sh[0] + 16, sh[1] - 6], [sh[0] + 8, sh[1] - 2], [sh[0] - 6, sh[1] + 2]]));
  out.push(...strand(sh[0] + 10 * o, sh[1], 16, 2 * o, 1));
  return out;
}
// The forearm: a knob at the elbow over the joint, the ridged limb to the wrist, a leaf sprouting.
function foreArm(k) {
  const [el, wr] = [J[`el${k}`], J[`wr${k}`]];
  const o = k === 'N' ? 1 : -1;
  return [
    ...taper([el, wr], 26, 20, BARK[3]), ...limbRidges(el, wr, 12, 9, o, k === 'N' ? 11 : 5),
    blob([[el[0] - 14, el[1]], [el[0] - 10, el[1] - 11], [el[0] + 4, el[1] - 14], [el[0] + 14, el[1] - 4], [el[0] + 12, el[1] + 10], [el[0] - 4, el[1] + 13]], BARK[1], 3),
    F(blob([[el[0] - 10, el[1] - 2], [el[0] - 6, el[1] - 9], [el[0] + 2, el[1] - 10], [el[0] - 2, el[1] - 2]], BARK[0], 2)), F(E(el[0] + 4 * o, el[1] + 4, 3, 2.4, BARK[2])),
    ...leaf(el[0] + 12 * o, el[1] + 2, 5, o > 0 ? -0.4 : Math.PI + 0.4, LEAF[1], LEAF[2]),
  ];
}
// The hand: a knobbly burl of a fist with three twig fingers and a thumb, a bud on one finger.
function hand(k) {
  const [x, y] = J[`wr${k}`];
  const o = k === 'N' ? 1 : -1;
  const out = [blob([[x - 15, y - 2], [x - 10, y - 9], [x + 2, y - 10], [x + 14, y - 4], [x + 16, y + 10], [x + 6, y + 18], [x - 8, y + 17], [x - 16, y + 9]], BARK[1], 3), F(blob([[x - 12, y - 2], [x - 7, y - 7], [x + 1, y - 7], [x - 4, y + 2]], BARK[0], 2)), F(E(x + 6 * o, y + 8, 4, 3, BARK[2]))];
  for (const [dx, l, w, bend] of [[-9, 30, 5.4, -4], [0, 34, 6, 1], [9, 29, 5.2, 5]]) out.push(...taper([[x + dx * 0.8 * o, y + 10], [x + (dx + bend * 0.4) * o, y + l * 0.62], [x + (dx * 1.1 + bend) * o, y + l], [x + (dx * 1.1 + bend * 1.6) * o, y + l + 4]], w, w * 0.4, BARK[1]), ...taper([[x + dx * 0.8 * o - 1, y + 12], [x + (dx + bend * 0.4) * o - 1, y + l * 0.6]], 1.2, 0.6, BARK[0]).map(F));
  out.push(...taper([[x - 13 * o, y + 2], [x - 20 * o, y + 10], [x - 21 * o, y + 20]], 6, 2.6, BARK[1]));
  out.push(...leaf(x + 1 * o, y + 38, 3, Math.PI / 2 + 0.3 * o, LEAF[0], LEAF[2]));
  return out;
}

// ---------- his legs ----------
// The thigh: a column of bark from inside the trunk down past the knee, a knob at the knee.
function thigh(k) {
  const [hp, kn] = [J[`hip${k}`], J[`knee${k}`]];
  return [
    ...taper([[hp[0], hp[1] - 8], kn], 40, 38, BARK[3]), ...ridges(hp[0], hp[1] - 6, kn[1] + 2, () => 17, k === 'N' ? 9 : 5, 11),
    blob([[kn[0] - 17, kn[1] - 2], [kn[0] - 12, kn[1] - 10], [kn[0] + 12, kn[1] - 10], [kn[0] + 17, kn[1] - 2], [kn[0] + 12, kn[1] + 8], [kn[0] - 12, kn[1] + 8]], BARK[1], 3),
    F(blob([[kn[0] - 13, kn[1] - 3], [kn[0] - 9, kn[1] - 8], [kn[0] - 1, kn[1] - 8], [kn[0] - 6, kn[1] - 2]], BARK[0], 2)),
  ];
}
// The shin: from under the knee's knob to the ankle, flaring into the foot.
function shin(k) {
  const [kn, an] = [J[`knee${k}`], J[`ank${k}`]];
  return [...taper([kn, [an[0], an[1] + 2]], 37, 40, BARK[3]), ...ridges(kn[0], kn[1] + 2, an[1], (y) => 17 + (y - kn[1]) * 0.08, k === 'N' ? 13 : 7, 11)];
}
// The foot: a stout stump with roots spreading out on the floor, moss and a mushroom on it.
function foot(k) {
  const an = J[`ank${k}`];
  const o = k === 'N' ? 1 : -1;
  const out = [blob([[an[0] - 22, an[1] + 10], [an[0] - 20, an[1] - 6], [an[0] + 20, an[1] - 6], [an[0] + 22, an[1] + 10]], BARK[1], 2)];
  for (let i = 0; i < 5; i++) {
    const s = i - 2;
    const len = 6 + hash((k === 'N' ? 9 : 2) + i) * 5;
    out.push(...taper([[an[0] + s * 7, an[1] + 7], [an[0] + s * 7 + s * len * 0.5, an[1] + 10.5], [an[0] + s * 7 + s * len + (s === 0 ? o * 4 : 0), an[1] + 12]], 7, 2.4, i % 2 ? BARK[2] : BARK[1]));
  }
  out.push(F(blob([[an[0] - 17, an[1] - 4], [an[0] - 8, an[1] - 4], [an[0] - 10, an[1] + 6], [an[0] - 19, an[1] + 6]], BARK[0], 1)));
  if (k === 'F') out.push(...moss([[an[0] - 18, an[1] + 2], [an[0] - 10, an[1] - 6], [an[0] + 2, an[1] - 6], [an[0] + 6, an[1] + 2]]));
  else out.push(...mushroom(an[0] + 14, an[1] - 2, 1.5, '#f0a86a'), ...mushroom(an[0] + 20, an[1], 1.1, '#e88a5a'));
  return out;
}

// ---------- assembled ----------
const cache = new Map();
// His pieces in one expression (each named for the bone it rides):
//   canopyB     the far clouds of his canopy (on his head, behind everything; on a spring)
//   canopy      the near clouds over the top of his head (on his head, a spring)
//   head        his face of the moment; beard: the moss beard (on his head, a spring)
//   trunkTop    on his chest; trunkMid on his waist; trunkLow on his hips (overlapping)
//   upF/N       the upper arms; lowF/N the forearms; fistF/N the hands
//   thighF/N, shinF/N, footF/N  the legs (on the gait's bones)
export function gnarlDesign(mood = 'idle') {
  const key = mood in FACES ? mood : 'idle';
  if (cache.has(key)) return cache.get(key);
  const f = FACES[key];
  const groups = {
    canopyB: canopyBack(), canopy: canopy(), head: head(f), beard: beard(),
    trunkTop: trunkTop(), trunkMid: trunkMid(), trunkLow: trunkLow(),
    upF: upperArm('F'), lowF: foreArm('F'), fistF: hand('F'), upN: upperArm('N'), lowN: foreArm('N'), fistN: hand('N'),
    thighF: thigh('F'), shinF: shin('F'), footF: foot('F'), thighN: thigh('N'), shinN: shin('N'), footN: foot('N'),
  };
  cache.set(key, groups);
  return groups;
}
// (the whole figure at rest, for picking looks and checking joints)
export const gnarlStillShapes = (mood = 'idle') => {
  const g = gnarlDesign(mood);
  return ['canopyB', 'upF', 'lowF', 'fistF', 'thighF', 'shinF', 'footF', 'thighN', 'shinN', 'footN', 'trunkLow', 'trunkMid', 'trunkTop', 'head', 'beard', 'canopy', 'upN', 'lowN', 'fistN'].flatMap((n) => g[n]);
};
export const GNARL_HEADS = (mood) => {
  const g = gnarlDesign(mood);
  return [...g.canopyB, ...g.head, ...g.beard, ...g.canopy];
};
export const MOUTH = H([151, 101]);
export const EYES = [H([137, 74]), H([165, 74])];
export const KNOT = [123, 155];
