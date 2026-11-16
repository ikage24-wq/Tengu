// The Island Journey ladder, Lv 5: the Sprout weapons (2026-11-16, the player's plan: a weapon
// tier every 10 levels whose theme the matching armour shares, Sprout, Rootwood, Tidepearl,
// Starglass, Dreamsilk and Windborne). The starters every job begins with, cozy and handmade from
// Sprout Village: pale whittled wood with its grain and knots showing, cream twine wraps whose
// strands cross, and a little green sprout growing out of each, with a pink bud now and then. No
// effects at this tier (they start at Lv 20 and grow with each one).
//
// Same frame as weapon-designs.js: the grip at (0, 0), the weapon pointing toward -y, the edge or
// belly toward +x. Each returns { shapes, blade: [top, base], reach, a } with the anchors the live
// effects use. Every type keeps the size its moves were drawn for (the old training weapons').

import { R, E, T, F } from './pixel.js';
import { matte, tube, mir, arc, curve, leaf as kitLeaf, knot as kitKnot, grainLine as kitGrain, BOW_H, BOW_DEEP, bowX, bowLimb as limb } from './weapon-ladder-kit.js';

// The Sprout palette.
export const SPROUT = {
  wood: '#ecc994', woodLight: '#f8e2b8', woodMid: '#d9a468', woodDark: '#b07a45', grain: '#c99158',
  bark: '#94633f', barkDark: '#6e4529', barkLight: '#b58058',
  twine: '#f1e0b4', twineDark: '#c9a56c',
  leaf: '#89d672', leafDark: '#5aa94f', leafLight: '#c6f39c',
  bud: '#ffb2c8', budDark: '#ee7fa2', budLight: '#ffe0ea',
  stone: '#d2cbbd', stoneDark: '#a9a193', stoneEdge: '#f0ebe1', stoneLight: '#e4dfd4',
};
const C = SPROUT;
// Wood, twine, bark, leaves and stone are all matte: shaded as leather (render/jobgear/kit.js).
const M = matte;

// A leaf from (x, y) toward angle `a` (degrees, 0 = +x, 90 = up), `len` long and `w` wide: a full
// leaf with a light half, its midrib and two pairs of veins, curling a touch (`curl`, degrees).
const leaf = (x, y, a, len, w, opts = {}) => kitLeaf(x, y, a, len, w, { leaf: C.leaf, light: C.leafLight, dark: C.leafDark }, opts);
// A little sprout: a short curving stem from (x, y) toward `a`, two leaves opening at its top.
function sprout(x, y, a, len, size = 1, { bud = false } = {}) {
  const r = (a * Math.PI) / 180;
  const tip = [x + Math.cos(r) * len, y - Math.sin(r) * len];
  const mid = [x + Math.cos(r) * len * 0.5 + Math.sin(r) * len * 0.25, y - Math.sin(r) * len * 0.5 + Math.cos(r) * len * 0.25];
  const out = [M(T(tube(curve([x, y], mid, tip, 6), 0.7 * size, 0.45 * size), C.leafDark))];
  out.push(...leaf(tip[0], tip[1], a + 48, 3.4 * size, 1.2 * size, { curl: -16 }), ...leaf(tip[0], tip[1], a - 42, 2.9 * size, 1.05 * size, { curl: 16 }));
  if (bud) out.push(M(E(tip[0], tip[1] - 0.3 * size, 0.85 * size, 1 * size, C.bud)), F(E(tip[0] - 0.3 * size, tip[1] - 0.6 * size, 0.32 * size, 0.38 * size, C.budLight)));
  return out;
}
// Twine wound round a rod from y0 to y1 (x from -w/2 to w/2): the wrap, its strands crossing on
// the slant, and a light edge to each turn.
function twineWrap(y0, y1, w, step = 1.15) {
  const out = [M(R(-w / 2, y0, w, y1 - y0, C.twine))];
  for (let y = y0 + 0.1; y < y1 - 0.4; y += step) {
    out.push(F(T(tube([[-w / 2, y + step * 0.75], [w / 2, y]], 0.32), C.twineDark)));
    out.push(F(T(tube([[-w / 2 + 0.3, y + step * 0.45], [w / 2 - 0.4, y - 0.12]], 0.16), C.woodLight)));
  }
  return out;
}
// A lashing: a few tight turns of twine at y over a rod w wide, tied off with a knot and a tail.
function lashing(y, w, turns = 3, { tail = true } = {}) {
  const out = [];
  for (let i = 0; i < turns; i++) out.push(M(R(-w / 2 - 0.2, y + i * 0.85, w + 0.4, 0.75, C.twine)), F(R(-w / 2 - 0.2, y + i * 0.85 + 0.55, w + 0.4, 0.2, C.twineDark)));
  if (tail) {
    const ky = y + turns * 0.42;
    out.push(M(E(w / 2 + 0.5, ky, 0.75, 0.65, C.twine)), M(T(tube(curve([w / 2 + 0.6, ky + 0.4], [w / 2 + 1.6, ky + 1.4], [w / 2 + 1.2, ky + 2.8], 5), 0.45, 0.3), C.twine)));
  }
  return out;
}
// Grain: thin darker lines wandering along wood from (x, y0) to (x, y1).
const grainLine = (x, y0, y1, wob = 0.25, w = 0.3, c = C.grain) => kitGrain(x, y0, y1, c, wob, w);
// A knot in the wood: a dark ring round a lighter heart.
const knot = (x, y, r = 0.9) => kitKnot(x, y, r, { dark: C.woodDark, mid: C.grain, light: C.woodLight });
// A round wooden bead, lit from the upper front.
const bead = (x, y, rx, ry, c = C.woodMid) => [M(E(x, y, rx, ry, c)), F(E(x - rx * 0.35, y - ry * 0.35, rx * 0.35, ry * 0.3, C.woodLight))];

// ---------- Sword ----------
// The Sprout Sword: a blade whittled from one board, the grain running up it and a knot in it,
// its edge sanded pale, three tally notches cut near the base; a twig for a crossguard, bound to
// the blade with twine, a sprout growing up off its tip with a pink bud; a twine-wrapped grip and
// a wooden bead pommel.
const B = -4;
function sword() {
  const s = [];
  const L = 19;
  const top = B - L;
  // The grip, then the pommel bead with a leaf charm on a loop of twine.
  s.push(...twineWrap(-2.2, 6, 2.8));
  s.push(...bead(0, 7.3, 1.9, 1.7));
  s.push(M(T(tube(curve([0.6, 8.8], [1.6, 10], [1, 11], 5), 0.35), C.twine)), ...leaf(1, 10.9, -70, 2.6, 0.95, { curl: 10 }));
  // The blade: whittled shoulders, sides running straight, a rounded leaf-like point.
  s.push(M(T(mir([[0, top], [1.25, top + 0.55], [2.15, top + 2.1], [2.6, top + 4.6], [2.6, B - 0.8], [2.1, B]]), C.wood)));
  s.push(F(T([[2.6, top + 4.6], [2.6, B - 0.8], [1.95, B - 0.9], [1.95, top + 4.9], [1.7, top + 2.6], [2.15, top + 2.1]], C.woodLight)));
  s.push(F(T([[0, top + 1.1], [0.4, top + 3.1], [0.4, B - 1.6], [-0.4, B - 1.6], [-0.4, top + 3.1]], C.woodLight)));
  s.push(grainLine(-1.35, top + 4.2, B - 1.4, 0.3, 0.32), grainLine(-0.85, top + 9, B - 2.5, 0.2, 0.24), grainLine(1.25, top + 6.5, B - 3.2, 0.25, 0.26));
  s.push(...knot(-1.2, top + 11.5, 0.85));
  for (const y of [B - 3.6, B - 2.8, B - 2]) s.push(F(R(1.25, y, 0.8, 0.28, C.woodDark)));
  // The twig crossguard, its bark streaked, a sprout off its tip.
  s.push(M(T(tube([[-5.3, B + 1.1], [-2.4, B + 0.6], [2.2, B + 0.75], [5.5, B + 0.35]], 2.1, 1.7), C.bark)));
  s.push(M(E(-5.35, B + 1.1, 1, 1.05, C.bark)), F(E(-5.5, B + 1.05, 0.55, 0.6, C.barkLight)), F(E(-5.55, B + 1.05, 0.28, 0.32, C.barkDark)));
  for (const [x0, x1, y] of [[-4.2, -2.6, B + 0.4], [-1.6, 0.4, B + 1.25], [2.4, 4.2, B + 0.25], [3.4, 5, B + 1]]) s.push(F(T(tube([[x0, y], [x1, y + 0.1]], 0.24), C.barkDark)));
  s.push(...sprout(5.2, B + 0.1, 72, 2.4, 1, { bud: true }));
  // Twine binding the blade to the guard: a band, and strands crossing over the guard.
  s.push(M(R(-2, B - 1.5, 4, 1.15, C.twine)), F(R(-2, B - 0.7, 4, 0.25, C.twineDark)));
  s.push(M(T(tube([[-1.9, B - 0.6], [1.9, B + 2]], 0.6), C.twine)), M(T(tube([[1.9, B - 0.6], [-1.9, B + 2]], 0.6), C.twine)));
  return { shapes: s, blade: [top, B], reach: [], a: { tip: [0, top], head: [0, B - L * 0.55], blade: [top, B] } };
}

// ---------- Hatchet ----------
// The Sprout Hatchet: a smooth river stone knapped to an edge (chipped facets, a pale sharpened
// bevel), lashed with crossed twine to a branch haft still in its bark up top, whittled smooth
// below where the hands go; the haft's tip has sprouted, and a twine wrap and a knot end it.
function axe() {
  const s = [];
  const H = 22;
  const top = -H;
  // The haft: bark up top, whittled wood below.
  s.push(M(T(tube([[0.2, top - 0.6], [0, top + 8], [-0.25, top + 16], [0, 7]], 2.5, 2.8), C.woodMid)));
  s.push(M(T(tube([[0.2, top - 0.6], [0, top + 6], [-0.1, top + 11]], 2.6, 2.7), C.bark)));
  for (const [y, x] of [[top + 1.5, -0.6], [top + 4.2, 0.4], [top + 8.5, -0.5]]) s.push(F(T(tube([[x, y], [x + 0.2, y + 1.6]], 0.3), C.barkDark)));
  s.push(F(T([[-1.25, top + 11], [1.3, top + 10.4], [1.3, top + 11.4], [-1.25, top + 12.2]], C.barkLight)));
  s.push(grainLine(-0.6, top + 12.5, 5, 0.2, 0.26), grainLine(0.55, top + 14, 4, 0.18, 0.22));
  s.push(...knot(0.2, top + 16.5, 0.7));
  // The sprout at the haft's tip.
  s.push(...sprout(0.1, top - 0.4, 104, 2.6, 1.05));
  // The stone head: narrow at its back where it's lashed on, flaring to a curved bit.
  const head = [[0.8, top + 2.6], [3.2, top + 2.2], [5.6, top + 1.3], [7.4, top + 0.4], [8.7, top + 0.1], [9.5, top + 2.2], [9.95, top + 5.8], [9.5, top + 9.4], [8.5, top + 11.4], [7.2, top + 10.9], [5.4, top + 9.9], [3.1, top + 8.9], [0.8, top + 8.6]];
  s.push(M(T(head, C.stone)));
  // Flake scars across its face, light and dark, where it was knapped.
  // (Two soft scars, not a checker of them: at game size a busy pattern reads as a chequerboard.)
  s.push(F(T([[1.6, top + 5.9], [3.6, top + 5.6], [5.4, top + 7.4], [5.8, top + 9.8], [3.1, top + 8.9], [1.2, top + 8.6]], C.stoneDark)));
  s.push(F(T([[3.8, top + 2.3], [6.4, top + 1.3], [7.4, top + 2.4], [6.2, top + 4.4], [4.2, top + 4.6]], C.stoneLight)));
  // The sharpened bit: a pale bevel round its curve, nicked here and there.
  s.push(F(T([[8.7, top + 0.1], [9.5, top + 2.2], [9.95, top + 5.8], [9.5, top + 9.4], [8.5, top + 11.4], [7.5, top + 10.6], [8.3, top + 9], [8.65, top + 5.8], [8.3, top + 2.6], [7.6, top + 1]], C.stoneEdge)));
  for (const [x, y] of [[9.3, top + 3.6], [9.4, top + 8]]) s.push(F(T([[x, y], [x + 0.6, y + 0.35], [x, y + 0.7]], C.stoneDark)));
  // The lashing: bands round the haft above and below, and strands crossing over the head's back.
  s.push(M(T(tube([[-1.7, top + 2.6], [2.6, top + 8.6]], 0.9), C.twine)), M(T(tube([[2.6, top + 2.6], [-1.7, top + 8.6]], 0.9), C.twine)));
  s.push(F(T(tube([[-1.5, top + 2.9], [2.4, top + 8.3]], 0.26), C.twineDark)));
  s.push(...lashing(top + 1.4, 2.6, 2, { tail: false }), ...lashing(top + 8.4, 2.6, 2));
  // The grip and the knot at the end.
  s.push(...twineWrap(-1.8, 4.6, 3));
  s.push(M(E(0, 7.2, 1.85, 1.45, C.woodDark)), F(E(-0.5, 6.8, 0.6, 0.45, C.grain)));
  const mid = top + 6;
  return { shapes: s, blade: [top - 2, top + 13], reach: [], a: { tip: [9.5, mid], head: [5.6, mid], blade: [top - 2, top + 13] } };
}

// ---------- Spear ----------
// The Sprout Spear: a sapling shaft with its growth rings, a side shoot left on it; a great leaf
// for a head, its midrib and veins carved in and its edge pale, lashed on with twine; two little
// leaves hanging under it like a tassel; a twine grip and a wrapped butt.
function spear() {
  const s = [];
  const S = 32;
  const sock = -S;
  const shaft = '#e2cf92';
  s.push(M(T(tube([[0, sock + 1], [0.15, -8], [-0.1, 8], [0, 14]], 2.4, 2.6), shaft)));
  for (const y of [sock + 7, sock + 15, sock + 23, 9]) s.push(F(R(-1.25, y, 2.5, 0.45, '#b9a465')), F(R(-1.25, y + 0.45, 2.5, 0.25, '#f2e4b4')));
  s.push(grainLine(-0.55, sock + 2, -4, 0.15, 0.22, '#c8b170'), grainLine(0.5, -2, 12, 0.15, 0.2, '#c8b170'));
  // A side shoot left on the sapling.
  s.push(...sprout(-1.1, sock + 17, 152, 2.2, 0.85));
  // The leaf head.
  const tip = sock - 11.5;
  s.push(M(T(mir([[0, tip], [1.6, tip + 2.2], [2.9, tip + 5], [3.3, tip + 7.6], [2.7, sock - 1.4], [1.2, sock + 0.4], [0.5, sock + 1.2]]), C.leaf)));
  s.push(F(T([[0, tip + 0.6], [1.4, tip + 2.6], [2.5, tip + 5.2], [2.9, tip + 7.6], [2.3, sock - 1.6], [0, sock - 0.4]], C.leafLight)));
  s.push(F(T(tube([[0, sock + 0.6], [0, tip + 5], [0, tip + 0.8]], 0.55, 0.2), C.leafDark)));
  for (const [u, sd] of [[0.3, 1], [0.3, -1], [0.55, 1], [0.55, -1], [0.78, 1], [0.78, -1]]) {
    const y = sock - (sock - tip) * u;
    s.push(F(T(tube([[0, y + 0.6], [sd * 1.9, y - 0.9]], 0.22, 0.14), C.leafDark)));
  }
  s.push(F(T(tube(mir([[0, tip + 0.4], [1.5, tip + 2.5], [2.8, tip + 5.2], [3.15, tip + 7.6]]).slice(0, 4), 0.3, 0.2), '#e9ffd2')));
  // The lashing at the socket and the tassel leaves under it.
  s.push(...lashing(sock - 0.4, 2.6, 3));
  s.push(...leaf(-0.9, sock + 3, 238, 3, 1.05, { curl: -10 }), ...leaf(0.9, sock + 3.3, 292, 2.6, 0.95, { curl: 10 }));
  // The grip and the butt.
  s.push(...twineWrap(-3, 4, 2.8));
  s.push(...lashing(11.6, 2.6, 2, { tail: false }), M(E(0, 14.2, 1.5, 1, C.woodDark)));
  return { shapes: s, blade: [tip, sock], reach: [], a: { tip: [0, tip], head: [0, sock - 5], blade: [tip, sock] } };
}

// ---------- Staff ----------
// The Sprout Staff: a gnarled branch, bark streaked and knotted, whittled smooth and wound with
// twine where the hands go; it grows up into a fern's fiddlehead, curled round on itself, that
// cradles a pink bud in its curl; two leaves open on the stem below it.
function staff() {
  const s = [];
  const S = 26;
  // The branch.
  const stem = [[0, 4], [0.45, -5], [-0.4, -14], [0.3, -21], [0.6, -S]];
  s.push(M(T(tube(stem, 2.7, 2.2), C.bark)));
  for (const [x, y, l] of [[-0.5, -24, 2.4], [0.4, -19.5, 2], [-0.6, -12, 2.6], [0.5, -7.5, 1.8]]) s.push(F(T(tube([[x, y], [x + 0.15, y + l]], 0.3), C.barkDark)));
  s.push(F(T(tube([[0.6, -22], [0.7, -16]], 0.5), C.barkLight)));
  s.push(...knot(-0.2, -16.5, 0.75).map((k) => ({ ...k, c: k.c === C.woodDark ? C.barkDark : k.c === C.grain ? C.bark : C.barkLight })));
  s.push(M(T(tube([[0.2, -6], [0.05, 3.6]], 2.5), C.woodMid)), grainLine(-0.4, -5.4, 3, 0.15, 0.22));
  s.push(...twineWrap(-4.6, 2.2, 2.9));
  s.push(M(E(0.05, 4.4, 1.5, 1.1, C.barkDark)));
  // The fiddlehead: the stem turns green and rolls round on itself, a curl of little leaflets
  // along its back.
  const cx = 2.3;
  const cy = -S - 4.6;
  const spiral = [];
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    const ang = 200 - u * 470;
    const r = 4.7 - u * 3.3;
    spiral.push([cx + Math.cos((ang * Math.PI) / 180) * r, cy - Math.sin((ang * Math.PI) / 180) * r]);
  }
  const rise = curve([0.6, -S + 0.4], [0.4, -S - 2], spiral[0], 5);
  s.push(M(T(tube([...rise, ...spiral.slice(1)], 2.2, 1.1), C.leaf)));
  s.push(F(T(tube([...rise.slice(2), ...spiral.slice(1, 22)].map(([x, y]) => [x - 0.35, y - 0.3]), 0.55, 0.25), C.leafLight)));
  for (let i = 3; i < 22; i += 3) {
    const [x, y] = spiral[i];
    const ang = 200 - (i / 30) * 470;
    s.push(F(T(tube([[x, y], [x + Math.cos((ang * Math.PI) / 180) * 1.1, y - Math.sin((ang * Math.PI) / 180) * 1.1]], 0.45, 0.15), C.leafDark)));
  }
  // The bud it cradles.
  s.push(M(E(cx + 0.2, cy + 0.3, 1.6, 1.85, C.bud)), F(T([[cx + 0.2, cy - 1.5], [cx + 0.7, cy + 0.3], [cx + 0.2, cy + 2.1], [cx - 0.3, cy + 0.3]], C.budDark)));
  s.push(F(E(cx - 0.4, cy - 0.5, 0.5, 0.6, C.budLight)));
  // Two leaves opening on the stem below the curl.
  s.push(...leaf(0.2, -S + 1.2, 158, 3.8, 1.35, { curl: -14 }), ...leaf(0.8, -S + 2.4, 22, 3.2, 1.2, { curl: 14 }));
  const top = cy - 5;
  return { shapes: s, blade: [top, -S], reach: [], a: { tip: [cx, top], head: [cx, cy], gem: [cx + 0.2, cy + 0.3], blade: [top, -S] } };
}

// ---------- Knife ----------
// The Sprout Knife: a little blade whittled to a rounded clip point, its grain and a sanded edge,
// a notch at its base; a twig guard bound on with twine, a sprout off its tip; a twine grip and a
// bead pommel.
const D = -3;
function dagger() {
  const s = [];
  const L = 14;
  const top = D - L;
  s.push(...twineWrap(-1.8, 4.8, 2.6, 1.05));
  s.push(...bead(0, 6, 1.7, 1.5));
  s.push(M(T([[-1.7, D], [-1.7, top + 5.6], [-0.9, top + 2.4], [0.9, top], [2.3, top + 2.8], [2.9, top + 6.8], [2.7, D - 2.4], [1.7, D - 1.3], [2, D]], C.wood)));
  s.push(F(T([[0.9, top + 0.3], [2.3, top + 2.8], [2.9, top + 6.8], [2.7, D - 2.4], [2.05, D - 2.3], [2.25, top + 6.9], [1.7, top + 3.1], [0.7, top + 1.2]], C.woodLight)));
  s.push(grainLine(-0.9, top + 5.5, D - 1, 0.2, 0.26), grainLine(0.4, top + 3.4, D - 2.6, 0.15, 0.2));
  s.push(...knot(-0.6, top + 9.4, 0.6));
  s.push(M(T(tube([[-3.4, D + 1.1], [0, D + 0.75], [3.5, D + 0.6]], 1.7, 1.4), C.bark)), F(T(tube([[-2.6, D + 0.6], [-1.2, D + 0.7]], 0.22), C.barkDark)), F(T(tube([[1.2, D + 1.1], [2.6, D + 1]], 0.22), C.barkDark)));
  s.push(...sprout(3.3, D + 0.4, 64, 1.9, 0.8));
  s.push(M(T(tube([[-1.6, D - 0.5], [1.6, D + 1.8]], 0.5), C.twine)), M(T(tube([[1.6, D - 0.5], [-1.6, D + 1.8]], 0.5), C.twine)));
  return { shapes: s, blade: [top, D], reach: [], a: { tip: [0.9, top], head: [0.6, D - L * 0.55], blade: [top, D] } };
}

// ---------- Bow ----------
// The Sprout Bow: the sample recurve's shape exactly (render/weapon-designs.js `bow`: short enough
// to tuck behind her head when drawn upright), whittled from one stave, its grain running down
// both limbs; twine binds the grip and the limbs where they leave it, the tips are bound off in
// little twine knots, a twine string, and a sprout pair growing forward out of the grip.
function bow() {
  const s = [];
  const H = BOW_H;
  const deep = bowX(BOW_DEEP);
  const sh = BOW_DEEP * H;
  s.push({ ...R(deep - 1 / 1.3 - 0.4, -sh, 0.8, sh * 2, C.twine), string: true });
  s.push(M(T(limb(-1, 1), C.wood)));
  for (const [u0, u1] of [[-0.94, -0.3], [0.3, 0.94]]) {
    s.push(F(T(limb(u0, u1, -1, 0.34), C.grain)), F(T(limb(u0 * 0.95, u1 * 0.95, 1, 0.3), C.woodLight)));
    // A grain line down the middle of each limb.
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const u = u0 + ((u1 - u0) * i) / 10;
      pts.push([bowX(u) + 0.05 * Math.sin(i * 1.7), u * H]);
    }
    s.push(F(T(tube(pts, 0.24, 0.16), C.woodDark)));
  }
  s.push(...knot(bowX(-0.55) + 0.2, -0.55 * H, 0.55));
  // The grip, twine-wound, and the bindings where the limbs leave it.
  s.push(M(T([[-0.9, -2.3], [1.9, -2.3], [2.1, 2.3], [-0.9, 2.3]], C.twine)));
  for (let y = -2.1; y < 2.2; y += 1.05) s.push(F(T(tube([[-0.9, y + 0.8], [2, y]], 0.3), C.twineDark)));
  for (const sd of [-1, 1]) {
    const x = bowX(0.34);
    const y = sd * 0.34 * H;
    for (let i = 0; i < 2; i++) {
      const yy = y - sd * i * 0.85;
      s.push(M(T([[x - 1.9, yy - 0.4], [x + 1.9, yy - 0.4], [x + 1.8, yy + 0.4], [x - 1.8, yy + 0.4]], C.twine)), F(R(x - 1.7, yy + 0.15, 3.4, 0.22, C.twineDark)));
    }
  }
  // The tips bound off in little twine knots.
  const tip = bowX(1);
  for (const sd of [-1, 1]) s.push(M(E(tip, sd * H, 1.25, 1.15, C.twine)), F(E(tip - 0.35, sd * H - 0.35, 0.4, 0.35, C.woodLight)), F(E(tip + 0.2, sd * H + 0.3, 0.35, 0.3, C.twineDark)));
  // The sprout growing forward out of the grip.
  s.push(...sprout(2.4, -0.4, 18, 1.9, 0.82));
  return { shapes: s, blade: [-H, H], reach: [], a: { tip: [tip, -H], head: [1, 0], blade: [-H, H], string: { x: deep, h: sh, color: C.twine } } };
}

// ---------- Crossbow ----------
// The Sprout Crossbow: the sample crossbow's shape (a stock that swoops down to a bark knob, a
// pistol grip, a recurve prod with a stirrup in front), in whittled wood: its grain along the
// stock, the grip and the prod's middle wound in twine, a twig trigger in a twine loop, a twine
// stirrup, a wooden peg for the nut, and a bolt fletched with two little leaves and tipped with a
// knapped stone; a sprout has come up out of the stock.
function crossbow() {
  const s = [];
  const cy = 1;
  const px = 13;
  const S = 7.4;
  const xAt = (u) => px + 1.3 - 2.6 * Math.abs(u) ** 1.5 + 1.1 * Math.max(0, (Math.abs(u) - 0.8) / 0.2) ** 1.6;
  const nut = [1.8, cy - 2.1];
  for (const sd of [-1, 1]) s.push(T(tube([[xAt(sd), cy + sd * S], nut], 0.75), C.twine));
  // The stock.
  s.push(M(T([[-9.4, cy - 1.3], [px - 1, cy - 1.9], [px - 1, cy + 1.5], [2.4, cy + 1.7], [-2.4, cy + 1.7], [-5, cy + 2.8], [-8.4, cy + 5], [-9.8, cy + 4.6]], C.woodMid)));
  s.push(F(T([[-9, cy - 1.1], [px - 1.4, cy - 1.7], [px - 1.4, cy - 1.1], [-8.8, cy - 0.5]], C.wood)));
  s.push(F(T(tube([[-8.6, cy + 1], [-4, cy + 0.4], [px - 2, cy - 0.1]], 0.32, 0.24), C.woodDark)), F(T(tube([[-7.6, cy + 3.2], [-4.6, cy + 2]], 0.26), C.grain)));
  s.push(...knot(-4.2, cy + 0.9, 0.65));
  // The bark knob at its end.
  s.push(M(T([[-9.2, cy - 1.5], [-10.7, cy - 1.1], [-11.1, cy + 2], [-10.8, cy + 4.7], [-9.6, cy + 5.2]], C.bark)), F(T(tube([[-10.3, cy - 0.6], [-10.6, cy + 4]], 0.3), C.barkDark)));
  // The pistol grip, twine-wound, a knot at its foot.
  s.push(M(T([[-1.3, cy + 1.2], [2.3, cy + 1.2], [1.6, cy + 6.4], [-1.9, cy + 6]], C.twine)));
  for (let y = cy + 1.6; y < cy + 6; y += 1.05) s.push(F(T(tube([[-1.6, y + 0.75], [2.15 - (y - cy) * 0.12, y]], 0.28), C.twineDark)));
  s.push(M(E(-0.1, cy + 6.4, 1.9, 0.95, C.woodDark)));
  // The twig trigger in its twine loop.
  s.push(M(T(tube(curve([3, cy + 1.6], [3.6, cy + 2.8], [2.8, cy + 3.8], 5), 0.9, 0.55), C.bark)));
  s.push(M(T(tube([...[[2, cy + 1.6]], ...curve([2.4, cy + 4.6], [4.6, cy + 4.8], [5.2, cy + 1.6], 6)], 0.6), C.twine)));
  // The flight groove, the bolt in it (a knapped stone point, two leaves for fletching) and the
  // wooden peg holding the string.
  s.push(F(R(-1.6, cy - 2.6, px + 0.4, 0.8, C.woodDark)));
  s.push(M(R(-0.6, cy - 3.3, px + 4.8, 0.9, C.woodLight)));
  s.push(M(T([[px + 7, cy - 2.85], [px + 4.3, cy - 4.6], [px + 4.9, cy - 2.85], [px + 4.3, cy - 1.1]], C.stone)), F(T([[px + 7, cy - 2.85], [px + 4.3, cy - 4.6], [px + 4.8, cy - 3.3]], C.stoneEdge)), F(T([[px + 5.4, cy - 2.6], [px + 4.6, cy - 1.6], [px + 5, cy - 2.85]], C.stoneDark)));
  s.push(M(T(tube([[px + 3.9, cy - 3.5], [px + 4.5, cy - 2.2]], 0.5), C.twine)));
  s.push(...leaf(1.6, cy - 3.2, 158, 3.2, 1.05, { curl: -8 }), ...leaf(1.2, cy - 3, 196, 2.6, 0.9, { curl: 8 }));
  s.push(...bead(nut[0], nut[1], 1.05, 1.05, C.woodDark));
  // The prod: a bent sapling, its back darker, its face pale, twine knots at its tips.
  const prod = (side = 0, k = 0.5) => {
    const l = [];
    const r = [];
    for (let i = 0; i <= 20; i++) {
      const u = -1 + i / 10;
      const w = (2.4 - Math.abs(u)) / 2;
      const x = xAt(u);
      if (side === 0) {
        l.push([x - w, cy + u * S]);
        r.push([x + w, cy + u * S]);
      } else {
        const e = x + side * w;
        l.push([e - side * w * 2 * k, cy + u * S]);
        r.push([e, cy + u * S]);
      }
    }
    return [...l, ...r.reverse()];
  };
  s.push(M(T(prod(), C.wood)), F(T(prod(-1, 0.38), C.grain)), F(T(prod(1, 0.3), C.woodLight)));
  for (const sd of [-1, 1]) s.push(M(E(xAt(sd), cy + sd * S, 1.05, 1, C.twine)), F(E(xAt(sd) + 0.2, cy + sd * S + 0.25, 0.32, 0.28, C.twineDark)));
  // The twine lashing binding the prod to the stock.
  s.push(M(T([[px - 2.2, cy - 2.4], [px + 1.4, cy - 2.4], [px + 1.6, cy + 2.2], [px - 2.2, cy + 2.2]], C.twine)));
  for (let x = px - 2; x < px + 1.4; x += 0.9) s.push(F(T(tube([[x, cy - 2.2], [x + 0.7, cy + 2]], 0.28), C.twineDark)));
  // The twine stirrup out in front.
  s.push(M(T(tube(arc(px + 1.4, cy + 0.6, 3.1, 1.9, 90, -90, 12), 0.85), C.twine)));
  // The sprout up out of the stock, behind the grip.
  s.push(...sprout(-5.6, cy - 1.2, 112, 2, 0.85, { bud: true }));
  return { shapes: s, blade: [-7, 4], reach: [], a: { tip: [px + 7, cy - 2.85], head: [px, cy], blade: [-7, 4] } };
}

// The Sprout weapons by type (the level-0 starters, `${type}_0`).
export const SPROUT_DESIGNS = { sword, axe, spear, staff, dagger, bow, crossbow };
