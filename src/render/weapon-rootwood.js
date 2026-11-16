// The Island Journey ladder, Lv 10: the Rootwood weapons (docs/design/island-journey-gear.md),
// from the roots of Rootwood Hollow. Living wood: dark heartwood with its grain, pale roots that
// wind round it and curl out into guards and claws, cushions of moss, and amber, the hollow's sap
// hardened to a glow, set into them as veins, edges, spikes and orbs; acorns for caps and pommels,
// an oak leaf here and there, a little red mushroom on the staff. Still no effects: the amber's
// own bright core is the glow.
//
// Same frame and sizes as the Sprout weapons (render/weapon-sprout.js), from the shared kit.

import { E, T, F } from './pixel.js';
import { matte, gemmy, tube, mir, curve, wander, leaf, knot, grainLine, BOW_H, bowX, bowLimb, bowAt, bowString, XB, xbProdX, xbProd, XB_STOCK } from './weapon-ladder-kit.js';

// The Rootwood palette.
export const ROOTWOOD = {
  heart: '#925836', heartLight: '#b8774c', heartDark: '#663a22', heartDeep: '#4c2a19',
  root: '#c99a6c', rootLight: '#e8c294', rootDark: '#8c623f',
  moss: '#88ba4f', mossLight: '#b6de72', mossDark: '#58823a',
  amber: '#ffb33e', amberLight: '#ffe29a', amberDark: '#e07818', amberCore: '#fff7d8',
  cap: '#8e6b3e', capLight: '#b48c58', capDark: '#654a2b', nut: '#d5964d', nutLight: '#f2c27e',
  oak: '#9dca5a', oakLight: '#cdea8e', oakDark: '#6b9b3f',
  mush: '#ea5b52', mushDot: '#fff3ea', mushStem: '#f7e8cf',
};
const C = ROOTWOOD;
const OAK = { leaf: C.oak, light: C.oakLight, dark: C.oakDark };
const WOOD = { dark: C.heartDeep, mid: C.heartDark, light: C.heartLight };
const oakLeaf = (x, y, a, len, w, opts = {}) => leaf(x, y, a, len, w, OAK, { lobed: true, ...opts });

// A root: a tapering pale tendril along `pts`, a light streak down its top and a dark one under.
export function root(pts, w0, w1 = w0 * 0.45) {
  const off = (d) => pts.map(([x, y], i) => {
    const [px, py] = pts[Math.max(0, i - 1)];
    const [nx, ny] = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(nx - px, ny - py) || 1;
    return [x + ((py - ny) / len) * d, y + ((nx - px) / len) * d];
  });
  return [matte(T(tube(pts, w0, w1), C.root)), F(T(tube(off(-w0 * 0.22), w0 * 0.28, w1 * 0.2), C.rootLight)), F(T(tube(off(w0 * 0.26), w0 * 0.22, w1 * 0.16), C.rootDark))];
}
// A root winding round a rod (x from -w/2 to w/2) from y0 down to y1, `turns` times: the strands
// crossing in front, a darker one showing behind between them.
function rootWind(y0, y1, w, turns = 3) {
  const out = [];
  const step = (y1 - y0) / turns;
  for (let i = 0; i < turns; i++) {
    const a = y0 + i * step;
    out.push(F(T(tube([[w / 2, a], [-w / 2, a + step * 0.5]], 0.55), C.rootDark)));
    out.push(...root([[-w / 2 - 0.2, a + step * 0.5], [0, a + step * 0.78], [w / 2 + 0.2, a + step]], 0.9, 0.8));
  }
  return out;
}
// A cushion of moss round (x, y), `w` wide and `h` high: soft overlapping tufts, lit on top.
export function moss(x, y, w, h, seed = 1) {
  const out = [];
  const n = Math.max(3, Math.round(w / 1.3));
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0.5 : i / (n - 1);
    const bx = x - w / 2 + u * w;
    const bh = h * (0.75 + 0.25 * Math.sin(i * 2.1 + seed));
    out.push(matte(E(bx, y - bh * 0.25, w / n + 0.55, bh * 0.6, C.moss)));
  }
  out.push(F(E(x, y + h * 0.2, w * 0.48, h * 0.28, C.mossDark)));
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0.5 : i / (n - 1);
    out.push(F(E(x - w / 2 + u * w - 0.2, y - h * 0.45, (w / n) * 0.55, h * 0.18, C.mossLight)));
  }
  return out;
}
// A drop of amber at (x, y), `r` round, pointing down: its glow, a bright core and a glint.
export function amberDrop(x, y, r) {
  return [
    gemmy(T([[x, y - r * 1.5], [x + r * 0.75, y - r * 0.45], [x + r, y + r * 0.35], [x + r * 0.55, y + r * 0.95], [x, y + r * 1.1], [x - r * 0.55, y + r * 0.95], [x - r, y + r * 0.35], [x - r * 0.75, y - r * 0.45]], C.amber)),
    F(E(x + r * 0.1, y + r * 0.25, r * 0.55, r * 0.6, C.amberLight)),
    F(E(x - r * 0.3, y - r * 0.2, r * 0.25, r * 0.32, C.amberCore)),
  ];
}
// A round amber orb at (x, y), `r` round: a dark rim, its glow, a sun-bright heart and a glint.
export function amberOrb(x, y, r) {
  return [
    gemmy(E(x, y, r, r, C.amber)),
    F(E(x + r * 0.12, y + r * 0.2, r * 0.82, r * 0.78, C.amberDark)),
    F(E(x - r * 0.05, y + r * 0.05, r * 0.68, r * 0.66, C.amber)),
    F(E(x + r * 0.05, y + r * 0.12, r * 0.42, r * 0.42, C.amberLight)),
    F(E(x + r * 0.08, y + r * 0.16, r * 0.2, r * 0.2, C.amberCore)),
    F(E(x - r * 0.42, y - r * 0.42, r * 0.22, r * 0.16, C.amberCore)),
  ];
}
// An acorn at (x, y): its nut below and its scaly cap above (`capOnly`: just the cap, as an end).
export function acorn(x, y, s = 1, { capOnly = false } = {}) {
  const out = [];
  if (!capOnly) {
    out.push(matte(T([[x - 1.35 * s, y], [x + 1.35 * s, y], [x + 1.2 * s, y + 1.4 * s], [x + 0.6 * s, y + 2.4 * s], [x, y + 2.8 * s], [x - 0.6 * s, y + 2.4 * s], [x - 1.2 * s, y + 1.4 * s]], C.nut)));
    out.push(F(E(x - 0.45 * s, y + 1 * s, 0.35 * s, 0.7 * s, C.nutLight)), F(E(x, y + 2.75 * s, 0.22 * s, 0.22 * s, C.capDark)));
  }
  out.push(matte(E(x, y - 0.1 * s, 1.75 * s, 1.05 * s, C.cap)));
  for (const [dx, dy] of [[-0.9, -0.4], [0, -0.55], [0.9, -0.4], [-0.45, 0.2], [0.45, 0.2]]) out.push(F(E(x + dx * s, y + dy * s, 0.32 * s, 0.24 * s, C.capDark)));
  out.push(F(E(x - 0.7 * s, y - 0.6 * s, 0.5 * s, 0.22 * s, C.capLight)));
  out.push(matte(T(tube([[x, y - 1 * s], [x + 0.2 * s, y - 1.8 * s]], 0.45 * s, 0.3 * s), C.capDark)));
  return out;
}
// A little red mushroom at (x, y) (the foot of its stem), `s` big.
export function mushroom(x, y, s = 1) {
  return [
    matte(T([[x - 0.5 * s, y], [x + 0.5 * s, y], [x + 0.4 * s, y - 1.4 * s], [x - 0.4 * s, y - 1.4 * s]], C.mushStem)),
    matte(T([...[[x - 1.6 * s, y - 1.2 * s]], ...curve([x - 1.6 * s, y - 1.2 * s], [x, y - 3.6 * s], [x + 1.6 * s, y - 1.2 * s], 6)], C.mush)),
    F(E(x - 0.6 * s, y - 2 * s, 0.32 * s, 0.26 * s, C.mushDot)), F(E(x + 0.55 * s, y - 2.3 * s, 0.26 * s, 0.22 * s, C.mushDot)), F(E(x + 0.1 * s, y - 1.5 * s, 0.22 * s, 0.18 * s, C.mushDot)),
  ];
}
// A haft of one great twisted root from y0 down to y1 (`w` across): pale root wood, its twist
// showing as grooves spiralling round it on the slant, a light streak down its lit side.
function twisted(y0, y1, w, pitch = 2.6) {
  const out = [matte(T(tube([[0, y0], [0.15, (y0 + y1) / 2], [0, y1]], w, w * 1.05), C.root))];
  out.push(F(T(tube([[w * 0.32, y0 + 0.4], [w * 0.32, y1 - 0.4]], w * 0.3), C.rootDark)));
  for (let y = y0 + 0.6; y < y1 - 0.8; y += pitch) {
    out.push(F(T(tube([[-w / 2 + 0.1, y + pitch * 0.62], [w / 2 - 0.1, y]], 0.42, 0.34), C.heartDark)));
    out.push(F(T(tube([[-w / 2 + 0.25, y + pitch * 0.62 - 0.5], [w / 2 - 0.35, y - 0.42]], 0.22, 0.16), C.rootLight)));
  }
  out.push(F(T(tube([[-w * 0.28, y0 + 0.5], [-w * 0.28, y1 - 0.5]], w * 0.16), C.rootLight)));
  return out;
}

// ---------- Sword ----------
// The Rootwood Sword: a broad heartwood blade, its grain dark and its edges grown pale like roots,
// a channel of amber sap down its middle with three bright drops set in it; two roots curl out of
// its base for a guard, a cushion of moss between them and an oak leaf sprouting off one; the grip
// is wound with a root, and an acorn hangs below for a pommel.
const B = -4;
function sword() {
  const s = [];
  const L = 20;
  const top = B - L;
  s.push(matte(T(tube([[0, -2.4], [0, 5.6]], 2.7), C.heartDark)), ...rootWind(-2.2, 5.4, 2.7, 3));
  s.push(...acorn(0, 6.6, 1.05));
  // The blade and its pale root edges.
  s.push(matte(T(mir([[0, top], [1.6, top + 1.4], [2.7, top + 4], [3, top + 7], [2.9, B - 2], [2.4, B]]), C.heart)));
  for (const sd of [1, -1]) s.push(F(T([[0, top + 0.4], [sd * 1.6, top + 1.4], [sd * 2.7, top + 4], [sd * 3, top + 7], [sd * 2.9, B - 2], [sd * 2.4, B], [sd * 1.8, B], [sd * 2.25, B - 2.2], [sd * 2.3, top + 7.2], [sd * 2.05, top + 4.4], [sd * 1.15, top + 2.2]], sd > 0 ? C.heartLight : C.root)));
  s.push(grainLine(-1.3, top + 6, B - 1.5, C.heartDeep, 0.25, 0.28), grainLine(1.3, top + 8, B - 2.5, C.heartDeep, 0.2, 0.24));
  // The amber channel and its three drops.
  s.push(gemmy(T(tube([[0, top + 3], [0, B - 1.6]], 1.2, 1), C.amber)), F(T(tube([[0.12, top + 3.6], [0.12, B - 2.2]], 0.42, 0.34), C.amberLight)));
  for (const y of [top + 5.2, top + 10.5, top + 15.6]) s.push(...amberDrop(0, y, 0.95));
  // The root guard, the moss and the oak leaf.
  for (const sd of [-1, 1]) s.push(...root(curve([sd * 1.2, B + 0.6], [sd * 5.4, B - 1.2], [sd * 6.1, B + 2.6], 8), 1.9, 0.7), ...root(curve([sd * 6.1, B + 2.6], [sd * 6.3, B + 3.8], [sd * 5.2, B + 3.6], 4), 0.75, 0.4));
  s.push(...moss(0, B + 0.2, 4.6, 2));
  s.push(...oakLeaf(4.2, B - 0.9, 78, 3.4, 1.15, { curl: -12 }));
  return { shapes: s, blade: [top, B], reach: [], a: { tip: [0, top], head: [0, B - L * 0.55], blade: [top, B] } };
}

// ---------- Axe ----------
// The Rootwood Axe: a heartwood head with a bit of hardened amber, its edge glowing; two roots bind
// it to a haft of one great twisted root, a cushion of moss on its back and an oak sprout at
// the haft's tip; the haft ends in an acorn cap.
function axe() {
  const s = [];
  const H = 22;
  const top = -H;
  s.push(...twisted(top - 0.6, 6.6, 2.8));
  s.push(...acorn(0, 7.1, 1.05, { capOnly: true }));
  // The head: heartwood, its amber bit, the bit's bright edge.
  const body = [[0.6, top + 1.8], [4.2, top + 1.2], [6.4, top + 0.6], [7.4, top + 1.6], [7.2, top + 9.6], [6.2, top + 11], [4.2, top + 10], [0.6, top + 9.6]];
  s.push(matte(T(body, C.heart)), F(T([[1, top + 2.3], [4.2, top + 1.8], [6.2, top + 1.3], [6.6, top + 2.4], [4.2, top + 3], [1, top + 3.4]], C.heartLight)));
  s.push(grainLine(3.2, top + 3.6, top + 9.2, C.heartDeep, 0.3, 0.26), ...knot(5.3, top + 6.8, 0.6, WOOD));
  const bit = [[6.6, top + 0.2], [8.6, top - 0.4], [9.9, top + 2.6], [10.4, top + 5.6], [9.9, top + 8.8], [8.5, top + 11.8], [6.6, top + 11.2], [7.6, top + 8.8], [7.9, top + 5.6], [7.6, top + 2.6]];
  s.push(gemmy(T(bit, C.amber)));
  s.push(F(T([[7.7, top + 1], [8.7, top + 0.6], [9.6, top + 3], [9.9, top + 5.6], [9.5, top + 8.4], [8.5, top + 10.7], [7.8, top + 10.4], [8.5, top + 8.4], [8.8, top + 5.6], [8.5, top + 2.8]], C.amberLight)));
  s.push(F(T(tube([[8.9, top + 0.3], [9.95, top + 3], [10.3, top + 5.6], [9.9, top + 8.6], [8.8, top + 11]], 0.45, 0.4), C.amberCore)));
  s.push(F(E(8.6, top + 2.6, 0.45, 0.6, C.amberCore)));
  // The roots binding it on, crossed over its back, and the moss on top.
  s.push(...root([[-1.8, top + 2.4], [0.6, top + 5.2], [3, top + 8.8]], 1.05, 0.8), ...root([[3, top + 2.4], [0.6, top + 5.6], [-1.8, top + 8.8]], 1.05, 0.8));
  s.push(...moss(2.6, top + 1.2, 3.8, 1.7, 2));
  s.push(...oakLeaf(-0.2, top - 0.4, 112, 3.2, 1.1, { curl: 14 }));
  const mid = top + 5.6;
  return { shapes: s, blade: [top - 2, top + 13], reach: [], a: { tip: [10.4, mid], head: [6.4, mid], blade: [top - 2, top + 13] } };
}

// ---------- Spear ----------
// The Rootwood Spear: a long spike of amber, faceted and glowing at its heart, gripped in a claw of
// three roots at the top of a twisted root shaft; a collar of moss under the claw, two acorns
// hanging off it on a stem, an oak leaf; the shaft wound where the hands go and capped with an
// acorn at its foot.
function spear() {
  const s = [];
  const S = 32;
  const sock = -S;
  s.push(...twisted(sock + 1, 13.4, 2.6, 2.9));
  s.push(...acorn(0, 13.8, 1, { capOnly: true }));
  // The amber spike, its facets and its heart.
  const tip = sock - 13;
  s.push(gemmy(T(mir([[0, tip], [1.4, tip + 4], [2.2, tip + 8.5], [1.8, sock - 1], [0.9, sock + 0.4]]), C.amber)));
  s.push(F(T([[0, tip + 0.4], [1.3, tip + 4], [2.05, tip + 8.5], [1.65, sock - 1.2], [0, sock - 0.8]], C.amberLight)));
  s.push(F(T([[0, tip + 1], [-1.2, tip + 4.4], [-1.9, tip + 8.5], [-1.6, sock - 1.2], [-0.4, sock - 0.6]], C.amberDark)));
  s.push(F(T(tube([[0.35, tip + 2.4], [0.5, tip + 8.5], [0.4, sock - 1.6]], 0.5, 0.3), C.amberCore)), F(E(-0.5, tip + 6, 0.32, 0.6, C.amberCore)));
  // The root claw gripping it.
  for (const sd of [-1, 1]) s.push(...root(curve([sd * 1.1, sock + 1.2], [sd * 3.2, sock - 1], [sd * 1.9, sock - 3.6], 7), 1.3, 0.5));
  s.push(...root(curve([0.2, sock + 1], [0.9, sock - 1], [0.1, sock - 2.6], 5), 1, 0.45));
  // The moss collar, the acorns hanging off it, an oak leaf.
  s.push(...moss(0, sock + 1.8, 4.2, 1.9, 4));
  s.push(...root(curve([1.6, sock + 2.2], [2.8, sock + 3.4], [2.4, sock + 4.8], 4), 0.45, 0.35), ...acorn(2.4, sock + 5.2, 0.7));
  s.push(...root(curve([1.4, sock + 2.4], [1.3, sock + 3.6], [1.1, sock + 5.4], 4), 0.4, 0.3), ...acorn(1.1, sock + 5.8, 0.6));
  s.push(...oakLeaf(-1.4, sock + 2, 205, 3.2, 1.1, { curl: -12 }));
  // Where the hands go.
  s.push(...rootWind(-3, 4, 2.7, 3));
  return { shapes: s, blade: [tip, sock], reach: [], a: { tip: [0, tip], head: [0, sock - 6], blade: [tip, sock] } };
}

// ---------- Staff ----------
// The Rootwood Staff: a gnarled heartwood staff with roots winding up it; at the top it splits into
// roots that curl up and round a great orb of amber, glowing from inside, cradling it; moss gathers
// where the roots part, a little red mushroom on it, and oak leaves open beside.
function staff() {
  const s = [];
  const S = 26;
  const stem = [[0, 4], [0.5, -5], [-0.4, -13], [0.4, -20], [0.2, -S]];
  s.push(matte(T(tube(stem, 2.9, 2.5), C.heart)), F(T(tube(stem.map(([x, y]) => [x + 0.55, y]), 0.7, 0.55), C.heartLight)));
  s.push(grainLine(-0.6, -24, -14, C.heartDeep, 0.3, 0.3), grainLine(0.3, -12, -2, C.heartDeep, 0.25, 0.26));
  s.push(...knot(-0.2, -17, 0.8, WOOD), ...knot(0.4, -8, 0.6, WOOD));
  s.push(...root(wander([0.9, -S + 1], [-0.9, -14], 0.5, 6), 0.9, 0.7));
  s.push(...rootWind(-4.4, 2.6, 2.9, 3));
  s.push(...acorn(0, 4.2, 0.95, { capOnly: true }));
  // The orb and the roots that cradle it.
  const ox = 0.4;
  const oy = -S - 6;
  s.push(...root(curve([-0.6, -S + 0.6], [-4.2, oy + 1.4], [-2.6, oy - 3.4], 8), 1.5, 0.6));
  s.push(...amberOrb(ox, oy, 3.4));
  s.push(...root(curve([0.8, -S + 0.6], [4.6, oy + 1.8], [3.2, oy - 3], 8), 1.5, 0.6));
  s.push(...root(curve([3.2, oy - 3], [2.2, oy - 4.6], [0.2, oy - 3.9], 5), 0.6, 0.4));
  s.push(...root(curve([0, -S + 0.4], [1.4, oy + 3.4], [ox - 0.6, oy + 2.6], 5), 1, 0.5));
  // A drop of sap welling under the orb.
  s.push(...amberDrop(ox + 0.6, oy + 4.1, 0.55));
  // Moss where the roots part, the mushroom on it, and the oak leaves.
  s.push(...moss(0.1, -S + 0.5, 4.4, 1.9, 3));
  s.push(...mushroom(-1.4, -S - 0.1, 0.75));
  s.push(...oakLeaf(1.8, -S + 0.4, 18, 3.4, 1.15, { curl: 14 }), ...oakLeaf(-1.6, -S + 1.6, 168, 2.8, 1, { curl: -14 }));
  const top = oy - 5;
  return { shapes: s, blade: [top, -S], reach: [], a: { tip: [ox, top], head: [ox, oy], gem: [ox, oy], blade: [top, -S] } };
}

// ---------- Knife ----------
// The Rootwood Knife: a sliver of amber for a blade, an oak leaf caught inside it, glowing at its
// edge; two little roots curl out for a guard over a tuft of moss; a root-wound heartwood grip and
// an acorn pommel.
const D = -3;
function dagger() {
  const s = [];
  const L = 14;
  const top = D - L;
  s.push(matte(T(tube([[0, -1.8], [0, 4.6]], 2.5), C.heartDark)), ...rootWind(-1.8, 4.4, 2.5, 3));
  s.push(...acorn(0, 5.4, 0.9));
  const blade = [[-1.7, D], [-1.7, top + 5.6], [-0.9, top + 2.4], [0.9, top], [2.3, top + 2.8], [2.9, top + 6.8], [2.7, D - 2.4], [1.7, D - 1.3], [2, D]];
  s.push(gemmy(T(blade, C.amber)));
  s.push(F(T([[-1.2, D - 0.5], [-1.2, top + 5.8], [-0.6, top + 3.2], [0.9, top + 1.4], [1.8, top + 3.4], [2.2, top + 6.8], [2, D - 2.6], [1.2, D - 0.5]], C.amberLight)));
  // The leaf trapped inside it.
  s.push(F(T([[0.2, top + 5.2], [0.9, top + 6.6], [0.8, top + 8.6], [0.2, top + 9.8], [-0.4, top + 8.6], [-0.5, top + 6.6]], '#d98a2a')), F(T(tube([[0.2, top + 5.6], [0.2, top + 10.4]], 0.18), '#b8661a')));
  s.push(F(T(tube([[1.1, top + 0.4], [2.4, top + 3], [2.9, top + 6.8], [2.65, D - 2.6]], 0.42, 0.3), C.amberCore)), F(E(-0.8, top + 7.4, 0.3, 0.7, C.amberCore)));
  for (const sd of [-1, 1]) s.push(...root(curve([sd * 1, D + 0.6], [sd * 3.4, D - 0.6], [sd * 3.6, D + 1.8], 6), 1.3, 0.5));
  s.push(...moss(0, D + 0.4, 3.4, 1.5, 5));
  return { shapes: s, blade: [top, D], reach: [], a: { tip: [0.9, top], head: [0.6, D - L * 0.55], blade: [top, D] } };
}

// ---------- Bow ----------
// The Rootwood Bow: heartwood limbs, a root winding up each, acorn caps on the tips; the grip wound
// with a root, moss where the limbs leave it, an amber drop set in the riser's front in a ring of
// root, and an oak leaf; strung with a pale root fibre.
function bow() {
  const s = [];
  const H = BOW_H;
  const str = bowString(C.rootLight);
  s.push(str.shape);
  s.push(matte(T(bowLimb(-1, 1), C.heart)));
  for (const [u0, u1] of [[-0.94, -0.3], [0.3, 0.94]]) s.push(F(T(bowLimb(u0, u1, -1, 0.34), C.heartDark)), F(T(bowLimb(u0 * 0.95, u1 * 0.95, 1, 0.3), C.heartLight)));
  s.push(...knot(bowX(-0.62) + 0.1, -0.62 * H, 0.55, WOOD));
  // The roots winding up the limbs.
  for (const sd of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const u = sd * (0.32 + (i / 14) * 0.56);
      const [x, y] = bowAt(u);
      pts.push([x + Math.sin(i * 1.1) * 0.75, y]);
    }
    s.push(...root(pts, 0.85, 0.5));
  }
  // The grip, the moss, the amber drop in its ring of root, the oak leaf.
  s.push(matte(T([[-0.9, -2.2], [1.9, -2.2], [2.1, 2.2], [-0.9, 2.2]], C.heartDark)), ...root([[-0.9, -1.9], [2, -0.9]], 0.8), ...root([[-0.9, -0.2], [2.1, 0.8]], 0.8), ...root([[-0.9, 1.4], [2, 2.2]], 0.7));
  for (const sd of [-1, 1]) s.push(...moss(bowX(0.32), sd * 0.32 * H, 3.1, 1.15, sd + 3));
  s.push(...root(curve([2.2, -1.6], [4.4, 0], [2.2, 1.6], 6), 0.7, 0.7), ...amberDrop(3.2, 0.1, 0.95));
  s.push(...oakLeaf(2.6, -2.6, 40, 2.8, 1, { curl: -12 }));
  // Acorn caps on the tips.
  const tip = bowX(1);
  for (const sd of [-1, 1]) s.push(...acorn(tip, sd * H, 0.62, { capOnly: true }));
  return { shapes: s, blade: [-H, H], reach: [], a: { tip: [tip, -H], head: [1, 0], gem: [3.2, 0.1], blade: [-H, H], string: str.anchor } };
}

// ---------- Crossbow ----------
// The Rootwood Crossbow: a heartwood stock with a root wound along it and moss on its back, an
// acorn cap for a butt; a root-wound grip, a root for a trigger and a root loop round it; a
// heartwood prod with acorn-capped tips, bound on with roots round a set amber; a root stirrup; an
// acorn for a nut; and a heartwood bolt tipped with amber and fletched with two oak leaves.
function crossbow() {
  const s = [];
  const { cy, px, S, nut } = XB;
  for (const sd of [-1, 1]) s.push(T(tube([[xbProdX(sd), cy + sd * S], nut], 0.7), C.rootLight));
  // The stock, its grain, the root along it, the moss on it, the acorn-cap butt.
  s.push(matte(T(XB_STOCK, C.heart)), F(T([[-9, cy - 1.1], [px - 1.4, cy - 1.7], [px - 1.4, cy - 1.1], [-8.8, cy - 0.5]], C.heartLight)));
  s.push(F(T(tube([[-8.6, cy + 1], [-4, cy + 0.4], [px - 2, cy - 0.1]], 0.32, 0.24), C.heartDeep)), ...knot(-4.6, cy + 1.2, 0.6, WOOD));
  s.push(...root(wander([-8.8, cy + 2.6], [px - 2.6, cy + 0.8], 0.6, 10, 1), 0.85, 0.6));
  s.push(...moss(-5.2, cy - 1.3, 3.8, 1.5, 6));
  // (An acorn cap wrapped round the stock's end, its scales in rows.)
  s.push(matte(T([[-9.2, cy - 1.5], [-10.6, cy - 1.3], [-11.2, cy + 1.6], [-10.9, cy + 4.6], [-9.6, cy + 5.3]], C.cap)));
  for (const [x, y] of [[-10.2, cy - 0.4], [-10.6, cy + 1.2], [-10.5, cy + 2.8], [-10.1, cy + 4.3], [-9.6, cy + 0.4], [-9.8, cy + 2], [-9.6, cy + 3.6]]) s.push(F(E(x, y, 0.36, 0.42, C.capDark)));
  s.push(F(T(tube([[-10.3, cy - 0.9], [-10.7, cy + 1.6]], 0.3), C.capLight)));
  // The grip and the trigger.
  s.push(matte(T([[-1.3, cy + 1.2], [2.3, cy + 1.2], [1.6, cy + 6.4], [-1.9, cy + 6]], C.heartDark)));
  for (let y = cy + 1.6; y < cy + 6; y += 1.4) s.push(...root([[-1.7, y + 0.95], [2.15 - (y - cy) * 0.12, y]], 0.75));
  s.push(...acorn(-0.1, cy + 6.5, 0.85, { capOnly: true }));
  s.push(...root(curve([3, cy + 1.6], [3.6, cy + 2.8], [2.8, cy + 3.8], 5), 0.9, 0.5), ...root([[2, cy + 1.6], ...curve([2.4, cy + 4.6], [4.6, cy + 4.8], [5.2, cy + 1.6], 6)], 0.6, 0.6));
  // The groove, the bolt and the acorn nut.
  s.push(F(T(tube([[-1.6, cy - 2.2], [px - 1.2, cy - 2.2]], 0.8), C.heartDeep)));
  s.push(matte(T(tube([[-0.6, cy - 2.85], [px + 4.4, cy - 2.85]], 0.9), C.heartLight)));
  s.push(gemmy(T([[px + 7.2, cy - 2.85], [px + 4.3, cy - 4.7], [px + 4.9, cy - 2.85], [px + 4.3, cy - 1]], C.amber)), F(T([[px + 7.2, cy - 2.85], [px + 4.3, cy - 4.7], [px + 4.8, cy - 3.3]], C.amberCore)), F(T([[px + 6.2, cy - 2.6], [px + 4.6, cy - 1.4], [px + 5, cy - 2.85]], C.amberLight)));
  s.push(...oakLeaf(1.4, cy - 3.2, 162, 3.2, 1.05, { curl: -8 }), ...oakLeaf(1, cy - 3, 198, 2.6, 0.9, { curl: 8 }));
  s.push(...acorn(nut[0], nut[1] + 0.5, 0.75));
  // The prod, its tips, and the roots binding it on round the amber.
  s.push(matte(T(xbProd(), C.heart)), F(T(xbProd(-1, 0.38), C.heartDark)), F(T(xbProd(1, 0.3), C.heartLight)));
  for (const sd of [-1, 1]) s.push(...acorn(xbProdX(sd), cy + sd * S, 0.55, { capOnly: true }));
  s.push(matte(T([[px - 2.2, cy - 2.4], [px + 1.4, cy - 2.4], [px + 1.6, cy + 2.2], [px - 2.2, cy + 2.2]], C.heartDark)));
  for (const [y0, y1] of [[cy - 2.4, cy + 0.2], [cy - 0.4, cy + 2.2]]) s.push(...root([[px - 2.2, y0], [px + 1.6, y1]], 0.8));
  s.push(...amberDrop(px - 0.3, cy - 0.1, 0.95));
  // The root stirrup.
  const loop = [];
  for (let i = 0; i <= 12; i++) {
    const a = ((90 - (i / 12) * 180) * Math.PI) / 180;
    loop.push([px + 1.4 + Math.cos(a) * 3.1, cy + 0.6 - Math.sin(a) * 1.9]);
  }
  s.push(...root(loop, 0.9, 0.8));
  return { shapes: s, blade: [-7, 4], reach: [], a: { tip: [px + 7.2, cy - 2.85], head: [px, cy], gem: [px - 0.3, cy - 0.1], blade: [-7, 4] } };
}

// The Rootwood weapons by type (the level-10 ones, `${type}_10`).
export const ROOTWOOD_DESIGNS = { sword, axe, spear, staff, dagger, bow, crossbow };
