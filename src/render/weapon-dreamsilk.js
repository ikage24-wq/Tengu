// The Island Journey ladder, Lv 40: the Dreamsilk weapons (docs/design/island-journey-gear.md).
// A dream theatre's treasures: blades of moon-silver, a pale lilac with a soft sheen, inlaid down
// the middle with plum enamel that gold filigree vines curl along; gold crescent moons for guards and cradles (the axe's whole
// bit is a moon); plum theatre velvet for grips and hafts, latticed with gold cord; moonstones in
// gold claws; gold curtain tassels; and on every one a bow of pink silk. The bow's tails are not
// drawn here: they flow in the live effect (render/weapon-fx.js `dreamLive`), rippling and
// twisting satin-side and back-side as they stream from the knot (`a.ribbon`), with sparkles
// drifting round the weapon and its moonstone glowing softly.
//
// Same frame and sizes as the earlier tiers, from the shared kit.

import { R, E, T, F } from './pixel.js';
import { matte, metal, tube, mir, arc, curve, wander, BOW_H, bowX, bowLimb, bowAt, bowString, XB, xbProdX, xbProd, XB_STOCK } from './weapon-ladder-kit.js';

// The Dreamsilk palette.
export const DREAMSILK = {
  moon: '#ebe5fa', moonLight: '#ffffff', moonShade: '#c6bbe6', moonDeep: '#9d8fcb',
  gold: '#f3c75a', goldLight: '#fff1a6', goldDark: '#c48d2c', goldDeep: '#91601f',
  velvet: '#7d2f6e', velvetLight: '#a9549a', velvetDark: '#511d49',
  silk: '#ff9ec7', silkLight: '#ffd3e6', silkDark: '#e0679f',
  enamel: '#8f3c80', enamelLight: '#b4609f', enamelDark: '#5e2156',
  fan: '#f1e6ff', fanPink: '#ffe3f0', fanPleat: '#d4c0f0',
  moonstone: '#eaf0ff', moonstoneShade: '#b9c4ee', moonstoneGlow: '#fffaf0', moonstonePink: '#ffdcef',
  cloud: '#fff8fc', cloudShade: '#e2d6f4', cloudLight: '#ffffff',
  string: '#ffc8df',
};
const C = DREAMSILK;
const GOLD = { base: C.gold, light: C.goldLight, dark: C.goldDark };
const SILVER = { base: C.moon, light: C.moonLight, dark: C.moonDeep };
const DEG = 180 / Math.PI;

// Each weapon type is drawn wider than tall (render/weapon-designs.js CHUNK), so round things
// (moons, moonstones, curls) are drawn this much narrower to come out round; each design sets
// `ax` for its type before it draws.
const ROUND = { sword: 1.2 / 1.5, axe: 1.15 / 1.4, spear: 1.1 / 1.45, staff: 1.1 / 1.25, dagger: 1, bow: 1.1 / 1.3, crossbow: 1 };
let ax = 1;

// A crescent moon round (x, y), `R` out, its hollow facing angle `face` (degrees, 0 = +x, 90 =
// up): the outer circle less an inner one `k` its size, shifted `d` of R toward the hollow. Gives
// its outline, its two horn tips, its belly (the thickest part) and the line down its middle.
function crescent(x, y, Rr, face, { d = 0.35, k = 0.85, n = 20 } = {}) {
  const r2 = Rr * k;
  const dd = Rr * d;
  const phi = Math.acos((Rr * Rr + dd * dd - r2 * r2) / (2 * Rr * dd)) * DEG;
  const psi = Math.atan2(Rr * Math.sin(phi / DEG), Rr * Math.cos(phi / DEG) - dd) * DEG;
  const [ux, uy] = [Math.cos(face / DEG), -Math.sin(face / DEG)];
  const [ix, iy] = [x + ux * dd * ax, y + uy * dd];
  const outerArc = (rr, a0 = face + phi, a1 = face + 360 - phi) => arc(x, y, rr * ax, rr, a0, a1, n);
  const innerArc = (rr) => arc(ix, iy, rr * ax, rr, face + 360 - psi, face + psi, n);
  const outer = outerArc(Rr);
  const mid = [];
  for (let i = 1; i < n; i++) {
    const a = (face + phi + ((360 - 2 * phi) * i) / n) / DEG;
    const [vx, vy] = [Math.cos(a), -Math.sin(a)];
    const dot = ux * vx + uy * vy;
    const t = dd * dot + Math.sqrt(Math.max(0, dd * dd * dot * dot - dd * dd + r2 * r2));
    const rr = (Rr + t) / 2;
    mid.push([x + vx * rr * ax, y + vy * rr]);
  }
  return { pts: [...outer, ...innerArc(r2)], tips: [outer[0], outer[outer.length - 1]], outerArc, innerArc, mid, r2, belly: [x - ux * Rr * 0.75 * ax, y - uy * Rr * 0.75] };
}
// A crescent moon in gold (or moon-silver): lit along its inner rim, shaded along its belly, a
// bead on each horn.
function moon(x, y, Rr, face, pal = GOLD, { beads = true, d, k } = {}) {
  const m = crescent(x, y, Rr, face, { d, k });
  const w = Math.max(0.3, Rr * 0.09);
  const out = [metal(T(m.pts, pal.base))];
  out.push(F(T(tube(m.innerArc(m.r2 + w * 0.6), w), pal.light)));
  out.push(F(T(tube(m.outerArc(Rr - w * 0.55, face + 125, face + 235), w * 0.85), pal.dark)));
  if (beads) for (const [tx, ty] of m.tips) out.push(metal(E(tx, ty, Math.max(0.42, Rr * 0.12) * ax, Math.max(0.42, Rr * 0.12), C.gold)), F(E(tx - 0.1, ty - 0.12, 0.16, 0.16, C.goldLight)));
  return { shapes: out, ...m };
}
// A curl of filigree: a spiral from (sx, sy) round the centre (cx, cy), winding in `turns` times.
function spiral(cx, cy, sx, sy, turns, sd, n = 12) {
  const r0 = Math.hypot((sx - cx) / ax, sy - cy);
  const a0 = Math.atan2(-(sy - cy), (sx - cx) / ax);
  return Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    const rr = r0 * (1 - u * 0.78);
    const a = a0 + sd * u * turns * Math.PI * 2;
    return [cx + Math.cos(a) * rr * ax, cy - Math.sin(a) * rr];
  });
}
// Gold filigree along a path: a fine gold line with little curls off it, sides alternating, a
// bright bead in each curl.
function filigree(pts, { curls = 3, size = 0.6, w = 0.22, c = C.gold } = {}) {
  const out = [F(T(tube(pts, w), c))];
  for (let i = 0; i < curls; i++) {
    const j = Math.max(1, Math.min(pts.length - 2, Math.round(((i + 0.5) / curls) * (pts.length - 1))));
    const [px, py] = pts[j];
    const [tx, ty] = [pts[j + 1][0] - pts[j - 1][0], pts[j + 1][1] - pts[j - 1][1]];
    const l = Math.hypot(tx, ty) || 1;
    const sd = i % 2 ? 1 : -1;
    const [cx, cy] = [px - (ty / l) * sd * size * ax, py + (tx / l) * sd * size];
    out.push(F(T(tube(spiral(cx, cy, px, py, 1, sd), w * 0.9, w * 0.5), c)), F(E(cx, cy, 0.17, 0.17, C.goldLight)));
  }
  return out;
}
// Filigree up a straight stretch from (x0, y0) to (x1, y1), wandering a little.
const vine = (p0, p1, opts) => filigree(wander(p0, p1, 0.25, 10), opts);
// A band of plum enamel inlaid along `pts` (`w0` wide at its start, `w1` at its end), a gold
// filigree vine down it: the inlay every moon-silver blade and limb carries.
function inlay(pts, w0, w1 = w0, curls = 3) {
  return [
    F(T(tube(pts, w0, w1), C.enamel)),
    F(T(tube(pts.map(([x, y]) => [x + w0 * 0.28, y]), w0 * 0.24, w1 * 0.24), C.enamelDark)),
    F(T(tube(pts.map(([x, y]) => [x - w0 * 0.3, y]), w0 * 0.14, w1 * 0.14), C.enamelLight)),
    ...filigree(pts, { curls, size: Math.min(0.55, w0 * 0.42), w: 0.26 }),
  ];
}
// A gold band round a haft at (x, y), `w` wide.
function goldBand(x, y, w, h = 0.8) {
  return [metal(R(x - w / 2, y - h / 2, w, h, C.gold)), F(R(x - w / 2 + 0.2, y - h / 2 + 0.1, w * 0.45, h * 0.28, C.goldLight)), F(R(x - w / 2, y + h / 2 - 0.2, w, 0.2, C.goldDeep))];
}
// Plum velvet over a haft along `pts`: a soft sheen down its lit side, its far side in shadow.
function velvetHaft(pts, w0, w1 = w0) {
  return [matte(T(tube(pts, w0, w1), C.velvet)), F(T(tube(pts.map(([x, y]) => [x - w0 * 0.2, y]), w0 * 0.22, w1 * 0.2), C.velvetLight)), F(T(tube(pts.map(([x, y]) => [x + w0 * 0.34, y]), w0 * 0.16, w1 * 0.14), C.velvetDark))];
}
// A velvet grip from y0 to y1 (x from -w/2 to w/2) latticed with gold cord, a gold bead at each
// crossing, a gold band at each end.
function velvetWrap(y0, y1, w, cells = null) {
  const n = cells ?? Math.max(2, Math.round((y1 - y0) / 1.5));
  const step = (y1 - y0) / n;
  const out = [matte(R(-w / 2, y0, w, y1 - y0, C.velvet)), F(R(-w / 2 + w * 0.12, y0, w * 0.2, y1 - y0, C.velvetLight))];
  for (let i = 0; i < n; i++) {
    const y = y0 + i * step;
    out.push(F(T(tube([[-w / 2, y], [w / 2, y + step]], 0.24), C.gold)), F(T(tube([[w / 2, y], [-w / 2, y + step]], 0.24), C.goldDark)));
    out.push(F(E(0, y + step / 2, 0.3, 0.3, C.goldLight)));
  }
  out.push(...goldBand(0, y0, w + 0.5), ...goldBand(0, y1, w + 0.5));
  return out;
}
// A moonstone at (x, y), `r` tall, in four gold claws: milky blue-white, a soft glow floating in
// it near the top and a blush of pink low down.
function moonstone(x, y, r) {
  const rx = r * 0.8 * ax;
  const out = [
    matte(E(x, y, rx, r, C.moonstone)),
    F(T([...arc(x, y, rx * 0.98, r * 0.98, 30, -150, 10), ...arc(x - rx * 0.16, y - r * 0.14, rx * 0.84, r * 0.84, -150, 30, 10)], C.moonstoneShade)),
    F(E(x - rx * 0.1, y - r * 0.3, rx * 0.66, r * 0.3, C.moonstoneGlow)),
    F(E(x + rx * 0.22, y + r * 0.36, rx * 0.34, r * 0.2, C.moonstonePink)),
  ];
  for (const a of [45, 135, 225, 315]) {
    const [cx, sy] = [Math.cos(a / DEG), -Math.sin(a / DEG)];
    const at = (k, t) => [x + (cx * k - sy * t) * rx, y + (sy * k + cx * t) * r];
    out.push(F(T([at(1.08, -0.22), at(1.08, 0.22), at(0.78, 0)], C.goldDark)));
  }
  return out;
}
// A gold curtain tassel hanging from (x, y), its skirt `len` long.
function tassel(x, y, len = 2) {
  const out = [metal(E(x, y, 0.62 * ax, 0.55, C.gold)), metal(T([[x - 0.5, y + 0.3], [x + 0.5, y + 0.3], [x + 0.7, y + 1], [x - 0.7, y + 1]], C.gold))];
  out.push(matte(T([[x - 0.7, y + 1], [x + 0.7, y + 1], [x + 0.95, y + 1 + len], [x - 0.95, y + 1 + len]], C.gold)));
  for (let i = -2; i <= 2; i++) out.push(F(T(tube([[x + i * 0.26, y + 1.2], [x + i * 0.36, y + 0.9 + len]], 0.16), i % 2 ? C.goldDark : C.goldDeep)));
  out.push(F(R(x - 0.75, y + 0.95, 1.5, 0.3, C.goldDark)), F(E(x - 0.2, y + 0.1, 0.18, 0.15, C.goldLight)));
  return out;
}
// A bow of pink silk tied at (x, y), `s` its size: two plump loops and the knot. (Its tails flow
// in the live effect, from this point.)
function bowKnot(x, y, s = 1) {
  const out = [];
  for (const sd of [-1, 1]) {
    const P = (u, v) => [x + sd * u * s * ax, y + v * s];
    out.push(matte(T([P(0, -0.35), P(0.9, -1.35), P(2, -1.55), P(2.6, -0.9), P(2.4, 0.1), P(1.5, 0.55), P(0.5, 0.4)], C.silk)));
    out.push(F(T([P(0.55, -0.2), P(1.4, -0.85), P(2, -0.75), P(1.6, -0.1), P(0.8, 0.1)], C.silkDark)));
    out.push(F(T(tube([P(0.9, -1.12), P(1.9, -1.32), P(2.32, -0.88)], 0.28 * s), C.silkLight)));
  }
  out.push(matte(E(x, y, 0.72 * s * ax, 0.66 * s, C.silk)), F(E(x + 0.12 * s * ax, y + 0.15 * s, 0.4 * s * ax, 0.36 * s, C.silkDark)), F(E(x - 0.2 * s * ax, y - 0.2 * s, 0.24 * s * ax, 0.2 * s, C.silkLight)));
  return out;
}
// A little cloud at (x, y), `w` across: three puffs on a flat base, lilac in its shadow.
function cloud(x, y, w) {
  const r = w / 4;
  const puffs = [[-1.25, 0.2, 1], [0, -0.45, 1.3], [1.25, 0.15, 1.05]];
  const out = puffs.map(([u, v, k]) => matte(E(x + u * r * ax, y + v * r, k * r * ax, k * r, C.cloud)));
  out.push(matte(R(x - 1.9 * r * ax, y, 3.8 * r * ax, r * 0.95, C.cloud)));
  out.push(F(T([[x - 2 * r * ax, y + 0.45 * r], [x + 2.1 * r * ax, y + 0.45 * r], [x + 1.9 * r * ax, y + 0.95 * r], [x - 1.9 * r * ax, y + 0.95 * r]], C.cloudShade)));
  out.push(F(E(x - 0.15 * r * ax, y - 0.85 * r, 0.6 * r * ax, 0.4 * r, C.cloudLight)), F(E(x - 1.45 * r * ax, y - 0.2 * r, 0.4 * r * ax, 0.28 * r, C.cloudLight)));
  return out;
}

// These pieces for the Dreamsilk armour (render/jobgear/ladder-dreamsilk.js), drawn unsqueezed
// (each weapon design narrows `ax` for its type, and leaves it so).
const flat = (fn) => (...args) => {
  const was = ax;
  ax = 1;
  try {
    return fn(...args);
  } finally {
    ax = was;
  }
};
export const DREAM_PIECES = { moon: flat((...a) => moon(...a).shapes), filigree: flat(filigree), vine: flat(vine), moonstone: flat(moonstone), tassel: flat(tassel), bowKnot: flat(bowKnot), cloud: flat(cloud) };

// ---------- Sword ----------
// The Dreamsilk Sword: a moon-silver blade inlaid with plum enamel, a gold filigree vine curling up
// it to a little gold moon; for a
// guard, a gold crescent moon lying horns up with the blade rising from its hollow and a moonstone
// in its belly; a pink silk bow tied on its back horn; a velvet grip latticed in gold, a moonstone
// pommel in gold claws and a little gold tassel.
const B = -4;
function sword() {
  ax = ROUND.sword;
  const s = [];
  const L = 20;
  const top = B - L;
  s.push(...velvetWrap(-2.2, 5, 2.7));
  s.push(metal(T([[-1.5, 5.2], [1.5, 5.2], [1.1, 6.2], [-1.1, 6.2]], C.gold)), F(R(-1.3, 5.3, 2.6, 0.3, C.goldLight)));
  s.push(...tassel(0, 8.2, 1.4), ...moonstone(0, 7.2, 1.2));
  // The blade.
  const edge = [[0, top], [1.2, top + 2.2], [1.95, top + 5.4], [2.15, top + 9], [2.05, B - 2], [1.65, B]];
  s.push(metal(T(mir(edge), C.moon)));
  s.push(F(T(tube([[-0.45, top + 1.8], [-1.4, top + 5.8], [-1.55, B - 2]], 0.36, 0.28), C.moonLight)), F(T(tube([[0.9, top + 2.4], [1.8, top + 6], [1.82, B - 2]], 0.3, 0.24), C.moonDeep)));
  s.push(...inlay(wander([0, B - 0.4], [0, top + 5.6], 0.12, 10), 1.6, 1.1, 4));
  s.push(...moon(0, top + 4.5, 1.05, 90, GOLD, { beads: false }).shapes);
  s.push(F(T(tube([[-0.25, top + 0.9], [-0.7, top + 3]], 0.22, 0.16), '#ffffff')));
  // The crescent guard, its moonstone, the bow on its back horn.
  const g = moon(0, B + 0.5, 3.5, 90);
  s.push(...g.shapes, ...filigree(g.mid.slice(2, -2), { curls: 2, size: 0.5, w: 0.2, c: C.goldDark }));
  s.push(...moonstone(g.belly[0], g.belly[1] - 0.1, 0.85));
  const knot = [g.tips[0][0] + 0.3, g.tips[0][1] + 0.5];
  s.push(...bowKnot(knot[0], knot[1], 0.85));
  return { shapes: s, blade: [top, B], reach: [], a: { tip: [0, top], head: [0, B - L * 0.55], gem: [g.belly[0], g.belly[1] - 0.1], blade: [top, B], ribbon: knot, fx: 'dreamsilk' } };
}

// ---------- Axe ----------
// The Dreamsilk Axe: its bit a great crescent moon of moon-silver, horns curving back to the
// haft where gold collars catch them, a fan of pleated silk stretched in the hollow between; a
// bright edge round its outer curve, plum enamel and a gold vine down its middle and a moonstone
// in its belly; a little gold
// moon crowning the haft; a silk bow tied on its lower horn; a velvet haft with gold filigree, a
// latticed grip and a gold tassel at its foot.
function axe() {
  ax = ROUND.axe;
  const s = [];
  const H = 22;
  const top = -H;
  const hy = top + 5.8;
  s.push(...velvetHaft([[0.2, top - 0.6], [0, top + 10], [-0.15, 6.4]], 2.6, 2.8));
  s.push(...vine([0, top + 14.6], [0, -3], { curls: 3, size: 0.55 }));
  s.push(...velvetWrap(-1.8, 4.6, 3), ...tassel(-0.1, 5.2, 1.8));
  // The crowning moon.
  s.push(...goldBand(0.2, top - 0.3, 3), ...moon(0.2, top - 2.1, 1.6, 90).shapes);
  // The moon bit: its edge, its filigree, its moonstone, the collars on its horns.
  const m = moon(4.6, hy, 6.8, 180, SILVER, { beads: false, d: 0.42 });
  // The silk fan stretched in the moon's hollow, pleated from the haft out.
  const rim = m.innerArc(m.r2);
  s.push(matte(T([[1.2, m.tips[0][1]], ...rim, [1.2, m.tips[1][1]]], C.fan)));
  s.push(F(T([[1.2, hy - 2.6], ...rim.slice(5, -5).map(([x, y]) => [1.2 + (x - 1.2) * 0.55, hy + (y - hy) * 0.55]), [1.2, hy + 2.6]], C.fanPink)));
  for (let i = 2; i < rim.length - 2; i += 3) s.push(F(T(tube([[1.4, hy + (rim[i][1] - hy) * 0.15], rim[i]], 0.2, 0.3), C.fanPleat)));
  s.push(...m.shapes);
  s.push(F(T(tube(m.outerArc(6.8 - 0.4, 250, 470), 0.62), C.moonLight)), F(T(tube(m.outerArc(6.8 - 0.36, 300, 400), 0.28), '#ffffff')));
  s.push(F(T(tube(m.innerArc(m.r2 + 0.3), 0.45), C.gold)));
  s.push(...inlay(m.mid.slice(3, -3), 1.5, 1.5, 4));
  s.push(...moonstone(m.belly[0] - 0.2, m.belly[1], 1.25));
  for (const [tx, ty] of m.tips) s.push(...goldBand(0.2, ty, 3.3, 1.2), metal(E(tx, ty, 0.62 * ax, 0.62, C.gold)), F(E(tx - 0.15, ty - 0.15, 0.2, 0.2, C.goldLight)));
  // (The bow is tied on the lower horn, so its tails hang free of the haft.)
  const low = m.tips[0][1] > m.tips[1][1] ? m.tips[0] : m.tips[1];
  const knot = [low[0] + 0.9, low[1] + 0.3];
  s.push(...bowKnot(knot[0], knot[1], 0.85));
  const edgeX = 4.6 + 6.8 * ax;
  return { shapes: s, blade: [top - 1, top + 12.6], reach: [], a: { tip: [edgeX, hy], head: [edgeX - 3, hy], gem: [m.belly[0] - 0.2, m.belly[1]], blade: [top - 1, top + 12.6], ribbon: knot, fx: 'dreamsilk' } };
}

// ---------- Spear ----------
// The Dreamsilk Spear: a long leaf of moon-silver inlaid with plum enamel and a gold vine, rising
// from a gold
// crescent cradle with a moonstone in its belly; a gold socket with a silk bow tied below it
// (its long tails stream like a pennant); a velvet shaft with gold bands and filigree, latticed
// grips and a gold tassel at its foot.
function spear() {
  ax = ROUND.spear;
  const s = [];
  const S = 32;
  const sock = -S;
  s.push(...velvetHaft([[0, sock + 1], [0.15, -8], [0, 13.4]], 2.4, 2.6));
  s.push(...vine([0, -21.4], [0, -12], { curls: 3, size: 0.55 }), ...vine([0, 5.2], [0, 10.6], { curls: 2, size: 0.55 }));
  s.push(...goldBand(0.1, -10.8, 3), ...goldBand(0.05, -22.6, 3), ...velvetWrap(-3, 4, 2.7), ...velvetWrap(11.2, 13.6, 2.7, 2));
  s.push(...tassel(0, 13.9, 1.8));
  // The socket and the bow below it.
  s.push(metal(T([[-1.35, sock + 2.6], [1.35, sock + 2.6], [1.05, sock - 0.4], [-1.05, sock - 0.4]], C.gold)), F(R(-1.15, sock - 0.2, 0.45, 2.6, C.goldLight)), ...goldBand(0, sock + 2.6, 3.1));
  const knot = [0, sock + 4];
  s.push(...bowKnot(knot[0], knot[1], 0.85));
  // The blade.
  const tip = sock - 14;
  const edge = [[0, tip], [1.1, tip + 3], [1.75, tip + 6.6], [1.6, sock - 4], [0.9, sock - 1.4]];
  s.push(metal(T(mir(edge), C.moon)));
  s.push(F(T(tube([[-0.4, tip + 1.6], [-1.2, tip + 6], [-1.15, sock - 3.6]], 0.32, 0.24), C.moonLight)), F(T(tube([[0.8, tip + 2.2], [1.45, tip + 6.6], [1.3, sock - 3.6]], 0.26, 0.2), C.moonDeep)));
  s.push(...inlay(wander([0, sock - 2.2], [0, tip + 3.4], 0.1, 10), 1.25, 0.7, 3));
  // The crescent cradle.
  const g = moon(0, sock - 1.6, 2.9, 90);
  s.push(...g.shapes, ...moonstone(g.belly[0], g.belly[1] - 0.1, 0.75));
  return { shapes: s, blade: [tip, sock], reach: [], a: { tip: [0, tip], head: [0, sock - 6], gem: [g.belly[0], g.belly[1] - 0.1], blade: [tip, sock], ribbon: knot, fx: 'dreamsilk' } };
}

// ---------- Staff ----------
// The Dreamsilk Staff: a great gold crescent moon crowns it, resting in a soft little cloud, plum
// enamel and a gold vine down its middle, a moonstone drop hanging on a gold chain from its upper
// horn into its hollow; a silk bow tied under the cloud; a velvet staff with gold bands and filigree, a latticed grip and a gold tassel at
// its foot.
function staff() {
  ax = ROUND.staff;
  const s = [];
  const S = 26;
  const stem = [[0, 4], [0.3, -6], [-0.2, -15], [0.2, -S]];
  s.push(...velvetHaft(stem, 2.7, 2.4));
  s.push(...vine([0.1, -23], [-0.1, -16.4], { curls: 3, size: 0.55 }), ...vine([-0.1, -13.6], [0.2, -6.8], { curls: 3, size: 0.55 }));
  s.push(...goldBand(-0.15, -15, 3.2), ...goldBand(0.25, -6, 3.3), ...velvetWrap(-4.4, 2.4, 2.8));
  s.push(...goldBand(0, 2.9, 2.6), ...tassel(0.05, 3.4, 1.6));
  s.push(...goldBand(0.2, -S + 0.4, 3, 1));
  const knot = [0.1, -S + 2.4];
  s.push(...bowKnot(knot[0], knot[1], 0.85));
  // The moon, resting in its cloud, a moonstone drop hanging from its upper horn.
  const cx = 0.9;
  const cy = -S - 6.4;
  const m = moon(cx, cy, 4.4, 12);
  s.push(...m.shapes, ...inlay(m.mid.slice(4, -4), 1.1, 1.1, 2));
  const [hx, hy] = m.tips[0][1] < m.tips[1][1] ? m.tips[0] : m.tips[1];
  s.push(F(T(tube([[hx - 0.1, hy + 0.4], [hx - 0.3, hy + 2]], 0.22), C.goldDark)), ...moonstone(hx - 0.3, hy + 3, 0.95));
  s.push(...cloud(0.5, -S - 1.6, 6.4));
  const top = cy - 4.4 - 0.5;
  return { shapes: s, blade: [top, -S], reach: [], a: { tip: [cx, top], head: [cx, cy], gem: [hx + 0.1, hy + 3.2], blade: [top, -S], ribbon: knot, fx: 'dreamsilk' } };
}

// ---------- Knife ----------
// The Dreamsilk Knife: a slim blade of moon-silver curving like a sliver of moon, plum enamel and a
// gold vine along it and a bright edge on its outer curve; a little gold crescent for a guard with a silk bow
// on its back horn; a latticed velvet grip and a moonstone pommel.
const D = -3;
function dagger() {
  ax = ROUND.dagger;
  const s = [];
  const L = 14;
  const top = D - L;
  s.push(...velvetWrap(-1.8, 4.4, 2.5, 4));
  s.push(metal(T([[-1.3, 4.6], [1.3, 4.6], [0.9, 5.4], [-0.9, 5.4]], C.gold)), ...moonstone(0, 6.3, 1.1));
  const back = curve([-1.3, D], [-1.7, top + 6], [1.3, top], 10);
  const edge = curve([1.3, top], [3.9, top + 6.6], [2, D], 10);
  s.push(metal(T([...back, ...edge.slice(1)], C.moon)));
  s.push(F(T([...curve([-0.6, D], [-0.8, top + 6.4], [1.2, top + 1.6], 8), ...curve([1.2, top + 1.6], [2.4, top + 6.8], [1.1, D], 8).slice(1)], C.moonShade)));
  s.push(F(T(tube(curve([1.5, top + 0.8], [3.5, top + 6.6], [2.15, D - 1], 8), 0.4, 0.3), C.moonLight)));
  s.push(...inlay(curve([0.3, D - 0.6], [0.5, top + 6.4], [1.2, top + 2.6], 10), 1.2, 0.6, 3));
  const g = moon(0.3, D + 0.3, 2.4, 90);
  s.push(...g.shapes);
  const knot = [g.tips[0][0] + 0.2, g.tips[0][1] + 0.5];
  s.push(...bowKnot(knot[0], knot[1], 0.7));
  return { shapes: s, blade: [top, D], reach: [], a: { tip: [1.3, top], head: [0.9, D - L * 0.55], gem: [0, 6.3], blade: [top, D], ribbon: knot, fx: 'dreamsilk' } };
}

// ---------- Bow ----------
// The Dreamsilk Bow: moon-silver limbs inlaid with plum enamel and a gold vine along each; gold bands with
// moonstone beads where they leave the grip; a gold crescent on the riser's front; little gold
// moons on the tips; a latticed velvet grip with a silk bow tied under it; strung in pink silk.
function bow() {
  ax = ROUND.bow;
  const s = [];
  const H = BOW_H;
  const str = bowString(C.string);
  s.push(str.shape);
  s.push(metal(T(bowLimb(-1, 1), C.moon)));
  for (const [u0, u1] of [[-0.96, -0.3], [0.3, 0.96]]) s.push(F(T(bowLimb(u0, u1, -1, 0.3), C.moonShade)), F(T(bowLimb(u0 * 0.96, u1 * 0.96, 1, 0.18), C.moonLight)));
  for (const sd of [-1, 1]) {
    const pts = Array.from({ length: 11 }, (_, i) => {
      const [x, y] = bowAt(sd * (0.4 + 0.46 * (i / 10)));
      return [x + 0.1, y];
    });
    s.push(...inlay(pts, 1, 0.75, 3));
  }
  for (const sd of [-1, 1]) {
    const x = bowX(0.34);
    const y = sd * 0.34 * H;
    s.push(metal(T([[x - 1.9, y - 0.55], [x + 1.9, y - 0.55], [x + 1.8, y + 0.55], [x - 1.8, y + 0.55]], C.gold)), F(R(x - 1.6, y - 0.42, 3.2, 0.24, C.goldLight)), matte(E(x + 0.3, y, 0.5 * ax, 0.5, C.moonstone)), F(E(x + 0.2, y - 0.15, 0.2, 0.18, C.moonstoneGlow)));
  }
  s.push(matte(T([[-0.9, -2.3], [1.9, -2.3], [2.1, 2.3], [-0.9, 2.3]], C.velvet)));
  for (let y = -2.3; y < 2.2; y += 1.5) s.push(F(T(tube([[-0.9, y], [2, y + 1.5]], 0.24), C.gold)), F(T(tube([[2, y], [-0.9, y + 1.5]], 0.24), C.goldDark)));
  s.push(...moon(2.7, 0, 2, 180).shapes);
  const tip = bowX(1);
  for (const sd of [-1, 1]) s.push(...moon(tip, sd * (H - 0.4), 1.35, sd < 0 ? 90 : 270, GOLD, { beads: false }).shapes);
  const knot = [1, 2.9];
  s.push(...bowKnot(knot[0], knot[1], 0.8));
  return { shapes: s, blade: [-H, H], reach: [], a: { tip: [tip, -H], head: [1, 0], gem: [2.7, 0], blade: [-H, H], string: str.anchor, ribbon: knot, fx: 'dreamsilk' } };
}

// ---------- Crossbow ----------
// The Dreamsilk Crossbow: a velvet stock with a gold rail and gold filigree corners like a
// theatre box, a silk bow tied at its shoulder; a latticed grip, a gold trigger in a gold loop, a
// tassel under the tiller; a moon-silver prod inlaid with enamel and gold, little gold moons on its tips,
// bound in velvet round a moonstone; pink silk strings, a moonstone nut; and a moon-silver bolt
// with a silver point and two silk fins.
function crossbow() {
  ax = ROUND.crossbow;
  const s = [];
  const { cy, px, S, nut } = XB;
  for (const sd of [-1, 1]) s.push(T(tube([[xbProdX(sd), cy + sd * S], nut], 0.7), C.string));
  s.push(matte(T(XB_STOCK, C.velvet)), F(T(tube([[-8.4, cy + 0.2], [-4, cy - 0.2], [px - 2, cy - 0.5]], 0.36, 0.3), C.velvetLight)), F(T(tube([[-8.8, cy + 4.4], [-5, cy + 2.6], [-2.4, cy + 1.6]], 0.3, 0.24), C.velvetDark)));
  s.push(metal(T([[-8.8, cy - 1.1], [px - 1.4, cy - 1.7], [px - 1.4, cy - 0.9], [-8.6, cy - 0.3]], C.gold)), F(T(tube([[-8.4, cy - 0.85], [px - 1.8, cy - 1.45]], 0.2), C.goldLight)));
  // The filigree corners of the butt, and a vine along the stock.
  s.push(metal(T([[-9.4, cy - 1.3], [-8.4, cy - 1.4], [-8.9, cy + 4.9], [-9.8, cy + 4.6]], C.gold)));
  for (const [x, y, sd] of [[-8.3, cy + 0.3, 1], [-8.2, cy + 3.6, -1]]) s.push(F(T(tube(spiral(x + 1.1, y + sd * 0.4, x, y, 1.1, sd), 0.3, 0.18), C.gold)));
  s.push(...filigree(curve([-7, cy + 2.4], [-4.6, cy + 1.2], [-1.8, cy + 1.6], 10), { curls: 3, size: 0.55 }));
  const knot = [-5.8, cy - 0.4];
  // The grip, the trigger, the tassel.
  s.push(matte(T([[-1.3, cy + 1.2], [2.3, cy + 1.2], [1.6, cy + 6.4], [-1.9, cy + 6]], C.velvet)));
  for (let y = cy + 1.4; y < cy + 6; y += 1.5) s.push(F(T(tube([[-1.5, y], [2.1 - (y - cy) * 0.12, y + 1.5]], 0.24), C.gold)), F(T(tube([[2.1 - (y - cy) * 0.12, y], [-1.5, y + 1.5]], 0.24), C.goldDark)));
  s.push(...goldBand(-0.15, cy + 6.3, 3.2, 0.7));
  s.push(metal(T(tube(curve([3.1, cy + 1.6], [3.7, cy + 2.8], [2.9, cy + 3.8], 5), 0.7, 0.45), C.gold)));
  s.push(metal(T(tube([[2, cy + 1.6], ...curve([2.4, cy + 4.6], [4.6, cy + 4.8], [5.2, cy + 1.6], 6)], 0.5), C.gold)));
  s.push(...tassel(8.4, cy + 2.6, 1.6));
  // The groove, the bolt, the nut.
  s.push(F(T(tube([[-1.6, cy - 2.2], [px - 1.2, cy - 2.2]], 0.8), C.velvetDark)));
  s.push(metal(T(tube([[-0.6, cy - 2.85], [px + 4.4, cy - 2.85]], 0.9), C.moonShade)));
  s.push(metal(T([[px + 7.2, cy - 2.85], [px + 4.3, cy - 4.5], [px + 4.9, cy - 2.85], [px + 4.3, cy - 1.2]], C.moon)), F(T([[px + 7.2, cy - 2.85], [px + 4.3, cy - 4.5], [px + 4.8, cy - 3.3]], C.moonLight)));
  for (const sd of [-1, 1]) s.push(matte(T([[2.6, cy - 2.85], [-0.4, cy - 2.85 + sd * 2.2], [-1.2, cy - 2.85 + sd * 1.8], [0.2, cy - 2.85]], C.silk)), F(T(tube([[2, cy - 2.85 + sd * 0.4], [-0.4, cy - 2.85 + sd * 1.6]], 0.2), C.silkLight)));
  s.push(...moonstone(nut[0], nut[1], 1));
  // The prod, its moons, the binding round its moonstone.
  s.push(metal(T(xbProd(), C.moon)), F(T(xbProd(-1, 0.36), C.moonShade)), F(T(xbProd(1, 0.22), C.moonLight)));
  for (const sd of [-1, 1]) s.push(...inlay(Array.from({ length: 9 }, (_, i) => [xbProdX(sd * (0.3 + 0.55 * (i / 8))) - 0.1, cy + sd * (0.3 + 0.55 * (i / 8)) * S]), 0.9, 0.6, 2));
  for (const sd of [-1, 1]) s.push(...moon(xbProdX(sd), cy + sd * (S - 0.2), 1.3, sd < 0 ? 90 : 270, GOLD, { beads: false }).shapes);
  s.push(matte(T([[px - 2.2, cy - 2.4], [px + 1.4, cy - 2.4], [px + 1.6, cy + 2.2], [px - 2.2, cy + 2.2]], C.velvet)));
  for (const y of [cy - 2.4, cy + 2]) s.push(...goldBand(px - 0.3, y + 0.2, 3.9, 0.5));
  s.push(...moonstone(px - 0.3, cy - 0.1, 1.25));
  s.push(metal(T(tube(arc(px + 1.4, cy + 0.6, 3.1, 1.9, 90, -90, 12), 0.7), C.gold)));
  s.push(...bowKnot(knot[0], knot[1], 0.85));
  return { shapes: s, blade: [-7, 4], reach: [], a: { tip: [px + 7.2, cy - 2.85], head: [px, cy], gem: [px - 0.3, cy - 0.1], blade: [-7, 4], ribbon: knot, fx: 'dreamsilk' } };
}

// The Dreamsilk weapons by type (the level-40 ones, `${type}_40`).
export const DREAMSILK_DESIGNS = { sword, axe, spear, staff, dagger, bow, crossbow };
