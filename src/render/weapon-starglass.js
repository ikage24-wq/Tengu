// The Island Journey ladder, Lv 30: the Starglass weapons (docs/design/island-journey-gear.md).
// An observatory's treasures: blades and heads of star glass, a deep night blue with a violet
// haze of nebula in it, bound and edged in polished brass; constellations etched into the glass,
// fine pale lines joining little four-pointed stars; astrolabe rings with their degree ticks for
// guards; an armillary sphere atop the staff, a telescope sight on the crossbow; night-lacquered
// hafts with brass bands and brass constellations inlaid like a star chart; grips of wine-red
// leather wound with brass wire; four-pointed brass stars for tips and pommels. Its effect
// (render/weapon-fx.js `starLive`): the etched stars light up one after another with the lines
// between them, little stars wink in and out round it, and now and then a shooting star streaks
// past.
//
// Same frame and sizes as the earlier tiers, from the shared kit. Every design lists its etched
// or inlaid stars as `a.stars` (a null starts a new constellation) for the effect to light up.

import { R, E, T, F } from './pixel.js';
import { matte, gemmy, metal, tube, mir, arc, curve, BOW_H, bowX, bowLimb, bowAt, bowString, XB, xbProdX, xbProd, XB_STOCK } from './weapon-ladder-kit.js';

// The Starglass palette.
export const STARGLASS = {
  brass: '#e8b24c', brassLight: '#ffe49e', brassDark: '#b47b2a', brassDeep: '#85561f',
  glass: '#4c5ec8', glassLight: '#91a6ff', glassDeep: '#2c3488', glassCore: '#e2e8ff', violet: '#8a6ee0', violetLight: '#bba6ff',
  night: '#2f3669', nightLight: '#535ca3', nightDark: '#1e2248',
  wine: '#9c4262', wineLight: '#cf7395', wineDark: '#6b2744',
  etch: '#bfcbff', string: '#eef0ff',
};
const C = STARGLASS;

// Each weapon type is drawn wider than tall (render/weapon-designs.js CHUNK), so round things
// (rings, orbs, the stars' points) are drawn this much narrower to come out round; each design
// sets `ax` for its type before it draws.
const ROUND = { sword: 1.2 / 1.5, axe: 1.15 / 1.4, spear: 1.1 / 1.45, staff: 1.1 / 1.25, dagger: 1, bow: 1.1 / 1.3, crossbow: 1 };
let ax = 1;

// A four-pointed star at (x, y), `r` to its points, its waist `k` of that, turned `rot` degrees.
function star4(x, y, r, c, k = 0.32, rot = 0) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = ((rot + i * 45 + 90) * Math.PI) / 180;
    const rr = i % 2 ? r * k : r;
    pts.push([x + Math.cos(a) * rr * ax, y - Math.sin(a) * rr]);
  }
  return T(pts, c);
}
// A brass star: four points of polished brass, bevelled (lit on the faces toward the top left,
// dark on those toward the bottom right), a bead of star glass at its heart.
function brassStar(x, y, r, rot = 0) {
  const P = (ang, rr) => {
    const a = ((rot + ang + 90) * Math.PI) / 180;
    return [x + Math.cos(a) * rr * ax, y - Math.sin(a) * rr];
  };
  return [
    metal(star4(x, y, r, C.brass, 0.38, rot)),
    F(T([[x, y], P(0, r), P(45, r * 0.38), P(90, r)], C.brassLight)),
    F(T([[x, y], P(180, r), P(225, r * 0.38), P(270, r)], C.brassDark)),
    F(E(x, y, r * 0.26 * ax, r * 0.26, C.glass)), F(E(x - r * 0.08 * ax, y - r * 0.08, r * 0.1 * ax, r * 0.1, '#ffffff')),
  ];
}
// A star-cut gem: a four-pointed star of star glass cut in facets, set on a brass star with a
// darker brass one turned across behind it, like a compass rose.
function starGem(x, y, r) {
  const P = (ang, rr) => {
    const a = ((ang + 90) * Math.PI) / 180;
    return [x + Math.cos(a) * rr * ax, y - Math.sin(a) * rr];
  };
  const g = r * 0.7;
  return [
    metal(star4(x, y, r * 0.8, C.brassDark, 0.45, 45)), metal(star4(x, y, r, C.brass, 0.42)),
    gemmy(star4(x, y, g, C.glass, 0.36)),
    F(T([[x, y], P(0, g), P(45, g * 0.36), P(90, g)], C.glassLight)), F(T([[x, y], P(180, g), P(225, g * 0.36), P(270, g)], C.glassDeep)),
    F(star4(x - r * 0.1 * ax, y - r * 0.1, r * 0.3, '#ffffff', 0.3)),
  ];
}
// A ring of brass round (x, y), `r` out and `w` thick, lit across its top, with `ticks` degree
// marks round it like an astrolabe's.
function ring(x, y, r, w, ticks = 0) {
  const out = [metal(T([...arc(x, y, r * ax, r, 0, 360, 36), ...arc(x, y, (r - w) * ax, r - w, 360, 0, 36)], C.brass))];
  out.push(F(T(tube(arc(x, y, (r - w / 2) * ax, r - w / 2, 50, 150, 10), w * 0.32), C.brassLight)));
  out.push(F(T(tube(arc(x, y, (r - w / 2) * ax, r - w / 2, 230, 320, 10), w * 0.28), C.brassDark)));
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2;
    const at = (rr) => [x + Math.cos(a) * rr * ax, y - Math.sin(a) * rr];
    out.push(F(T(tube([at(r - w * 0.12), at(r - w * (i % 3 ? 0.5 : 0.8))], 0.16), C.brassDeep)));
  }
  return out;
}
// A band of brass round (x, y) seen tilted, `rx` by `ry`, from angle a0 to a1, turned `rot`
// degrees: one half of an armillary ring, the far half drawn behind its sphere, the near in front.
function band(x, y, rx, ry, a0, a1, w, rot = 0) {
  const r = (rot * Math.PI) / 180;
  const turn = ([px, py]) => [x + (px - x) * Math.cos(r) + (py - y) * Math.sin(r), y - (px - x) * Math.sin(r) + (py - y) * Math.cos(r)];
  const pts = arc(x, y, rx * ax, ry, a0, a1, 16).map(turn);
  return [metal(T(tube(pts, w), C.brass)), F(T(tube(pts, w * 0.3), C.brassLight))];
}
// A point on that band, for a bead riding it.
function onBand(x, y, rx, ry, ang, rot = 0) {
  const r = (rot * Math.PI) / 180;
  const [px, py] = [Math.cos((ang * Math.PI) / 180) * rx * ax, -Math.sin((ang * Math.PI) / 180) * ry];
  return [x + px * Math.cos(r) + py * Math.sin(r), y - px * Math.sin(r) + py * Math.cos(r)];
}
// A star-glass orb at (x, y), `r` round: night blue deepening toward its shadow side, a violet
// haze of nebula, a few tiny stars, a soft light and a bright glint.
function orb(x, y, r) {
  return [
    gemmy(E(x, y, r * ax, r, C.glass)),
    F(T([...arc(x, y, r * 0.98 * ax, r * 0.98, 50, -140, 12), ...arc(x - r * 0.2 * ax, y - r * 0.18, r * 0.8 * ax, r * 0.8, -140, 50, 12)], C.glassDeep)),
    F(T(tube(curve([x - r * 0.6 * ax, y + r * 0.35], [x + r * 0.1 * ax, y - r * 0.05], [x + r * 0.55 * ax, y + r * 0.45], 6), r * 0.22, r * 0.4), C.violet)),
    F(E(x - r * 0.32 * ax, y - r * 0.36, r * 0.32 * ax, r * 0.24, C.glassLight)), F(E(x - r * 0.4 * ax, y - r * 0.44, r * 0.13 * ax, r * 0.11, '#ffffff')),
    ...[[0.38, -0.22], [-0.12, 0.46], [0.5, 0.4]].map(([u, v]) => F(star4(x + u * r * ax, y + v * r, Math.max(0.32, r * 0.16), C.glassCore, 0.3))),
  ];
}
// A constellation etched into star glass: fine pale lines joining its stars, each a little
// four-pointed star with a bright heart. A null in `pts` starts a new constellation.
function constellation(pts) {
  const out = [];
  for (let i = 1; i < pts.length; i++) if (pts[i] && pts[i - 1]) out.push(F(T(tube([pts[i - 1], pts[i]], 0.2), C.etch)));
  for (const p of pts) if (p) out.push(F(star4(p[0], p[1], 0.72, C.glassCore, 0.28)), F(E(p[0], p[1], 0.18, 0.18, '#ffffff')));
  return out;
}
// A constellation inlaid in brass on lacquer, like a star chart.
function chart(pts) {
  const out = [];
  for (let i = 1; i < pts.length; i++) if (pts[i] && pts[i - 1]) out.push(F(T(tube([pts[i - 1], pts[i]], 0.2), C.brass)));
  for (const p of pts) if (p) out.push(F(star4(p[0], p[1], 0.66, C.brassLight, 0.3)));
  return out;
}
// A grip of wine-red leather wound with brass wire, from y0 to y1 (x from -w/2 to w/2), a brass
// ferrule at each end.
function wireWrap(y0, y1, w, step = 1.2) {
  const out = [matte(R(-w / 2, y0, w, y1 - y0, C.wine))];
  for (let y = y0 + 0.5; y < y1 - 0.3; y += step) {
    out.push(F(T(tube([[-w / 2, y + 0.55], [w / 2, y - 0.15]], 0.42), C.brass)));
    out.push(F(T(tube([[-w / 2 + 0.25, y + 0.42], [0, y + 0.13]], 0.16), C.brassLight)));
    out.push(F(T(tube([[-w / 2, y + 1.05], [w / 2, y + 0.35]], 0.2), C.wineDark)));
  }
  out.push(...ferrule(0, y0, w + 0.5), ...ferrule(0, y1, w + 0.5));
  return out;
}
// A brass band round a haft at (x, y), `w` wide.
function ferrule(x, y, w, h = 0.8) {
  return [metal(R(x - w / 2, y - h / 2, w, h, C.brass)), F(R(x - w / 2 + 0.2, y - h / 2 + 0.1, w * 0.45, h * 0.28, C.brassLight)), F(R(x - w / 2, y + h / 2 - 0.2, w, 0.2, C.brassDeep))];
}
// A night-lacquered haft along `pts`: deep blue with a long gloss down it.
function haft(pts, w0, w1 = w0) {
  return [matte(T(tube(pts, w0, w1), C.night)), F(T(tube(pts.map(([x, y]) => [x + w0 * 0.24, y]), w0 * 0.2, w1 * 0.18), C.nightLight)), F(T(tube(pts.map(([x, y]) => [x - w0 * 0.34, y]), w0 * 0.16, w1 * 0.14), C.nightDark))];
}

// ---------- Sword ----------
// The Starglass Sword: a blade of star glass bound down both edges in brass, a deep core down it
// with a violet haze of nebula and a constellation etched along it; for a guard, an astrolabe (a
// ticked brass ring round a disc of night glass with a brass star on it) on quillons ending in
// little brass stars; a wine-red grip wound with brass wire, and a star-cut gem for a pommel.
const B = -4;
function sword() {
  ax = ROUND.sword;
  const s = [];
  const L = 20;
  const top = B - L;
  s.push(...wireWrap(-2.2, 5.2, 2.7));
  s.push(metal(T([[-1.6, 5.4], [1.6, 5.4], [1.1, 6.4], [-1.1, 6.4]], C.brass)));
  s.push(...starGem(0, 7.6, 1.9));
  // The blade, its core, the nebula, the brass edges, the etched constellation.
  const edge = [[0, top], [1.45, top + 1.9], [2.35, top + 4.8], [2.55, top + 8], [2.45, B - 1.4], [2.05, B]];
  s.push(gemmy(T(mir(edge), C.glass)));
  s.push(F(T(mir([[0, top + 2.6], [0.9, top + 5.2], [1.05, top + 8.2], [1, B - 1.2], [0.8, B]]), C.glassDeep)));
  s.push(F(T(tube(curve([-0.5, top + 5.6], [1.1, top + 10.6], [-0.4, top + 16], 9), 0.4, 1.3), C.violet)), F(T(tube(curve([0.4, top + 9], [-0.5, top + 12], [0.3, top + 15], 6), 0.25, 0.55), C.violetLight)));
  s.push(F(T(tube([[-0.55, top + 2.4], [-1.25, top + 6.6], [-1.3, B - 2.2]], 0.3, 0.22), C.glassLight)), F(T(tube([[-0.35, top + 1.4], [-0.75, top + 4]], 0.22, 0.16), '#ffffff')));
  for (const sd of [1, -1]) s.push(metal(T([[sd * 1.45, top + 1.9], [sd * 2.35, top + 4.8], [sd * 2.55, top + 8], [sd * 2.45, B - 1.4], [sd * 2.05, B], [sd * 1.6, B], [sd * 1.95, B - 1.5], [sd * 2.02, top + 8.1], [sd * 1.82, top + 5.1], [sd * 1.08, top + 2.6]], C.brass)));
  s.push(F(T(tube([[-1.8, top + 4.2], [-2.24, top + 8], [-2.14, B - 2]], 0.22), C.brassLight)), F(T(tube([[1.9, top + 4.6], [2.3, top + 8.4], [2.2, B - 2]], 0.2), C.brassDeep)));
  const stars = [[0.1, top + 3.8], [-0.45, top + 6.4], [0.45, top + 8.8], [-0.3, top + 11.6], [0.45, top + 13.8], [-0.1, top + 16.6]];
  s.push(...constellation(stars));
  // The astrolabe guard.
  const gy = B + 0.9;
  s.push(metal(T([[-5.2, gy - 0.5], [5.2, gy - 0.5], [5.2, gy + 0.5], [-5.2, gy + 0.5]], C.brass)), F(R(-5, gy - 0.4, 10, 0.24, C.brassLight)));
  for (const sd of [-1, 1]) s.push(...brassStar(sd * 5.6, gy, 1.25, 45));
  s.push(F(E(0, gy, 2.9 * ax, 2.9, C.glassDeep)), F(T(tube(curve([-2, gy + 1], [0, gy - 0.6], [2.1, gy + 0.7], 6), 0.5, 0.9), C.violet)));
  s.push(...ring(0, gy, 3.5, 0.75, 18), ...brassStar(0, gy, 2.1));
  return { shapes: s, blade: [top, B], reach: [], a: { tip: [0, top], head: [0, B - L * 0.55], gem: [0, gy], blade: [top, B], stars, fx: 'starglass' } };
}

// ---------- Axe ----------
// The Starglass Axe: a broad bit of brass with a window of star glass in it, a constellation
// etched in the glass, degree ticks round the window like an astrolabe's rim and a polished edge;
// a star-cut gem at its hinge, a brass star for a back spike and another
// crowning the haft; a night-lacquered haft with a little star chart inlaid, a wine-red grip and a
// brass star for a butt.
function axe() {
  ax = ROUND.axe;
  const s = [];
  const H = 22;
  const top = -H;
  const hx = 1.2;
  const hy = top + 5.8;
  const P = (ang, r) => [hx + Math.cos((ang * Math.PI) / 180) * r, hy - Math.sin((ang * Math.PI) / 180) * r];
  s.push(...haft([[0.2, top - 0.6], [0, top + 10], [-0.15, 6.4]], 2.6, 2.8));
  s.push(...chart([[0.2, top + 12.4], [-0.4, top + 14.2], [0.35, top + 16], [-0.2, top + 17.6]]));
  s.push(...ferrule(0, top + 11.2, 3.2), ...wireWrap(-1.8, 4.6, 3));
  s.push(...brassStar(0, 7, 1.5));
  // The crowning star and the back spike.
  s.push(...ferrule(0.2, top - 0.2, 3), ...brassStar(0.2, top - 2.2, 1.8));
  s.push(...brassStar(-2.2, hy, 2.3, 45));
  // The collars that hold the head.
  s.push(...ferrule(0, top + 1.7, 3.3, 1.2), ...ferrule(0, top + 9.9, 3.3, 1.2));
  // The bit, its window, the ticks, the edge.
  s.push(metal(T([[1.2, top + 1.6], ...arc(hx, hy, 8.9, 8.9, 62, -62, 20), [1.2, top + 10]], C.brass)));
  s.push(gemmy(T([[3.2, top + 3.2], ...arc(hx, hy, 7, 7, 48, -48, 14), [3.2, top + 8.4]], C.glass)));
  s.push(F(T([[3.9, top + 4.1], ...arc(hx, hy, 6.1, 6.1, 38, -38, 10), [3.9, top + 7.5]], C.glassDeep)));
  s.push(F(T(tube(curve([4.4, top + 7.6], [6.4, top + 5.4], [5.4, top + 2.8], 7), 1.2, 0.5), C.violet)), F(E(6.2, top + 5, 0.7, 0.5, C.violetLight)));
  s.push(F(T(tube(arc(hx, hy, 6.5, 6.5, 20, 44, 6), 0.3), C.glassLight)));
  const stars = [[4.4, top + 3.9], [5.9, top + 4.5], [6.8, top + 3.3], [7.2, top + 5.8], [5.9, top + 7.6], [4.6, top + 7.9]];
  s.push(...constellation(stars));
  for (let ang = -44; ang <= 44; ang += 8) s.push(F(T(tube([P(ang, 7.3), P(ang, ang % 16 ? 7.75 : 8.05)], 0.18), C.brassDeep)));
  s.push(F(T(tube(arc(hx, hy, 7.55, 7.55, 22, 56, 8), 0.28), C.brassLight)));
  s.push(F(T([...arc(hx, hy, 8.9, 8.9, 60, -60, 18), ...arc(hx, hy, 8.3, 8.3, -60, 60, 18)], C.brassLight)), F(T(tube(arc(hx, hy, 8.6, 8.6, 14, 48, 7), 0.24), '#ffffff')));
  s.push(...starGem(hx + 0.5, hy, 2));
  return { shapes: s, blade: [top - 3, top + 13], reach: [], a: { tip: [hx + 8.9, hy], head: [hx + 5, hy], gem: [hx + 0.5, hy], blade: [top - 3, top + 13], stars, fx: 'starglass' } };
}

// ---------- Spear ----------
// The Starglass Spear: its head a great four-pointed star of star glass, the long point up for the
// blade, cut in facets that catch the light, a violet haze in it and a constellation etched up the
// blade; a ticked brass ring and a brass star where the points meet, like a compass rose, a
// little brass star charm hanging off it on a chain; a brass socket; a night-lacquered shaft with
// brass bands, a star chart inlaid up it, wine-red grips and a brass star for a butt.
function spear() {
  ax = ROUND.spear;
  const s = [];
  const S = 32;
  const sock = -S;
  s.push(...haft([[0, sock + 1], [0.15, -8], [0, 13.4]], 2.4, 2.6));
  s.push(...chart([[0.25, -20.4], [-0.35, -18.4], [0.3, -16.6], [-0.25, -14.4], [0.2, -12.4]]));
  s.push(...ferrule(0.1, -10.6, 3), ...ferrule(0.05, -22.6, 3), ...wireWrap(-3, 4, 2.7), ...wireWrap(11.2, 13.6, 2.7));
  s.push(...brassStar(0, 15, 1.4));
  // The socket.
  s.push(metal(T([[-1.4, sock + 1.6], [1.4, sock + 1.6], [1.05, sock - 1.6], [-1.05, sock - 1.6]], C.brass)), F(R(-1.2, sock - 1.2, 0.5, 2.6, C.brassLight)), ...ferrule(0, sock + 1.4, 3.2));
  // The star head, in facets: lit toward the top left, deep toward the bottom right.
  const tip = sock - 14;
  const c = sock - 5.4;
  const up = [[0, tip], [0.9, tip + 3], [1.4, c - 3.6], [1.7, c - 1.6]];
  const side = [[1.7, c - 1.6], [4.8, c], [1.7, c + 1.6]];
  const down = [[1.7, c + 1.6], [1.1, c + 3.2], [0, sock - 1]];
  const head = [...up, ...side.slice(1), ...down.slice(1), ...[...down].reverse().slice(1).map(([x, y]) => [-x, y]), ...[...side].reverse().slice(1).map(([x, y]) => [-x, y]), ...[...up].reverse().slice(1, -1).map(([x, y]) => [-x, y])];
  s.push(F(T(head, C.glass)));
  s.push(F(T([[0, tip], [-0.9, tip + 3], [-1.4, c - 3.6], [-1.7, c - 1.6], [0, c]], C.glassLight)), F(T([[-1.7, c - 1.6], [-4.8, c], [0, c]], C.glassLight)));
  s.push(F(T([[0, c], [4.8, c], [1.7, c + 1.6], [1.1, c + 3.2], [0, sock - 1]], C.glassDeep)));
  s.push(F(T(tube([[-0.35, tip + 1.4], [-0.9, c - 4]], 0.24, 0.32), '#ffffff')));
  s.push(F(T(tube(curve([0.3, c - 2], [1.2, c + 0.6], [0.2, c + 2.6], 6), 0.5, 0.8), C.violet)));
  const stars = [[0.15, tip + 2.8], [-0.4, tip + 4.8], [0.45, tip + 6.6], [-0.3, c - 2.8]];
  s.push(...constellation(stars));
  s.push(...ring(0, c, 2.9, 0.6, 12), ...brassStar(0, c, 1.9));
  // The charm on its chain.
  for (const [x, y] of [[1.9, c + 2.6], [2.05, c + 3.5], [2.15, c + 4.4]]) s.push(F(E(x, y, 0.3, 0.42, C.brassDark)), F(E(x - 0.06, y - 0.08, 0.12, 0.18, C.brassLight)));
  s.push(...brassStar(2.2, c + 5.8, 1.2));
  return { shapes: s, blade: [tip, sock], reach: [], a: { tip: [0, tip], head: [0, c], gem: [0, c], blade: [tip, sock], stars, fx: 'starglass' } };
}

// ---------- Staff ----------
// The Starglass Staff: an armillary sphere crowns it, a ticked brass meridian ring standing in a
// brass cup and two tilted brass rings crossing round a star-glass orb with a nebula in it, a wine
// bead and a glass bead riding them like planets, a brass star on a finial at the very top; a
// night-lacquered staff with brass bands and a star chart inlaid down it, a wine-red grip, a
// star-cut gem at its foot.
function staff() {
  ax = ROUND.staff;
  const s = [];
  const S = 26;
  const stem = [[0, 4], [0.3, -6], [-0.2, -15], [0.2, -S]];
  s.push(...haft(stem, 2.7, 2.4));
  s.push(...chart([[0.3, -21.6], [-0.35, -19.8], [0.35, -18], [-0.15, -16.4], [0.35, -14.2], [-0.25, -12.4], [0.25, -10.4], [-0.2, -8.6]]));
  s.push(...ferrule(-0.1, -23.4, 3.2), ...ferrule(0.1, -6.6, 3.3), ...wireWrap(-4.4, 2.4, 2.8));
  s.push(...starGem(0.05, 4.9, 1.6));
  // The cup, the meridian ring, the crossing rings round the orb, the planets, the finial.
  const cx = 0.3;
  const cy = -S - 4.6;
  s.push(metal(T([[-1.4, -S + 0.8], [1.4, -S + 0.8], [2.6, -S - 1.2], [-2.6, -S - 1.2]], C.brass)), F(T(tube([[-2.4, -S - 1.05], [2.4, -S - 1.05]], 0.3), C.brassLight)), F(R(-1.3, -S + 0.2, 2.6, 0.3, C.brassDeep)));
  s.push(...ring(cx, cy, 4.3, 0.7, 24));
  s.push(...band(cx, cy, 3.7, 1.2, 0, 180, 0.5, 18), ...band(cx, cy, 3.7, 1.2, 0, 180, 0.5, -24));
  s.push(...orb(cx, cy, 2.7));
  s.push(...band(cx, cy, 3.7, 1.2, 180, 360, 0.56, 18), ...band(cx, cy, 3.7, 1.2, 180, 360, 0.56, -24));
  const [wx, wy] = onBand(cx, cy, 3.7, 1.2, 238, 18);
  const [gx, gy] = onBand(cx, cy, 3.7, 1.2, 312, -24);
  s.push(matte(E(wx, wy, 0.7, 0.7, C.wine)), F(E(wx - 0.22, wy - 0.22, 0.26, 0.26, C.wineLight)));
  s.push(gemmy(E(gx, gy, 0.6, 0.6, C.glassLight)), F(E(gx - 0.18, gy - 0.18, 0.2, 0.2, '#ffffff')));
  s.push(metal(T(tube([[cx, cy - 4.1], [cx, cy - 5.4]], 0.8, 0.6), C.brass)), ...brassStar(cx, cy - 6.1, 1.5));
  const stars = [[cx - 1, cy - 1.3], [cx + 0.6, cy - 0.5], [cx + 1.3, cy - 1.5]];
  s.push(...constellation(stars));
  const top = cy - 7.6;
  return { shapes: s, blade: [top, -S], reach: [], a: { tip: [cx, top], head: [cx, cy], gem: [cx, cy], blade: [top, -S], stars: [...stars, null, [0.3, -21.6], [-0.35, -19.8], [0.35, -18], [-0.15, -16.4], [0.35, -14.2]], fx: 'starglass' } };
}

// ---------- Knife ----------
// The Starglass Knife: a blade of star glass with a brass spine down its back, a violet haze and a
// constellation in it and a bright edge; a compass rose for a guard (two brass stars, one turned
// across the other, on short brass quillons); a wine-red grip and a brass star pommel.
const D = -3;
function dagger() {
  ax = ROUND.dagger;
  const s = [];
  const L = 14;
  const top = D - L;
  s.push(...wireWrap(-1.8, 4.4, 2.5, 1.1));
  s.push(...brassStar(0, 5.9, 1.6));
  const blade = [[-1.7, D], [-1.7, top + 5.6], [-0.9, top + 2.4], [0.9, top], [2.3, top + 2.8], [2.9, top + 6.8], [2.7, D - 2.4], [1.7, D - 1.3], [2, D]];
  s.push(gemmy(T(blade, C.glass)));
  s.push(F(T([[-0.9, D - 0.4], [-0.9, top + 6], [0.2, top + 3.2], [1.4, top + 4.4], [1.7, top + 7.2], [1.5, D - 2.4], [0.9, D - 0.4]], C.glassDeep)));
  s.push(F(T(tube(curve([-0.2, top + 9.6], [1.4, top + 7.6], [0.6, top + 4.6], 7), 1.1, 0.4), C.violet)), F(E(0.9, top + 7.2, 0.5, 0.4, C.violetLight)));
  s.push(F(T(tube([[1.1, top + 0.5], [2.4, top + 3], [2.85, top + 6.8], [2.6, D - 2.6]], 0.42, 0.3), C.glassCore)));
  s.push(metal(T([[-1.7, D], [-1.7, top + 5.6], [-0.9, top + 2.4], [-0.45, top + 2.8], [-1.1, top + 5.9], [-1.1, D]], C.brass)), F(T(tube([[-1.5, D - 0.6], [-1.5, top + 5.6], [-0.9, top + 3]], 0.18), C.brassLight)));
  const stars = [[0.3, top + 3.8], [1.4, top + 5.4], [0.5, top + 7.8], [1.5, top + 9.6], [0.4, top + 11.6]];
  s.push(...constellation(stars));
  // The compass rose.
  const gy = D + 0.7;
  s.push(metal(R(-3.3, gy - 0.5, 6.8, 1, C.brass)), F(R(-3.1, gy - 0.4, 6.4, 0.24, C.brassLight)));
  for (const x of [-3.5, 3.7]) s.push(metal(E(x, gy, 0.7, 0.7, C.brass)), F(E(x - 0.2, gy - 0.2, 0.25, 0.25, C.brassLight)));
  s.push(metal(star4(0.1, gy, 1.7, C.brassDark, 0.42, 45)), ...brassStar(0.1, gy, 2.3));
  return { shapes: s, blade: [top, D], reach: [], a: { tip: [0.9, top], head: [0.6, D - L * 0.55], gem: [0.1, gy], blade: [top, D], stars, fx: 'starglass' } };
}

// ---------- Bow ----------
// The Starglass Bow: night-lacquered limbs faced in brass, a star chart inlaid up each in brass;
// brass bands with star-glass beads where they leave the grip; an astrolabe on the riser's front (a
// ticked brass ring round night glass, a brass star on it); a wine-red grip wound with brass wire;
// brass stars on the tips; strung in silver.
function bow() {
  ax = ROUND.bow;
  const s = [];
  const H = BOW_H;
  const str = bowString(C.string);
  s.push(str.shape);
  s.push(matte(T(bowLimb(-1, 1), C.night)));
  for (const [u0, u1] of [[-0.96, -0.3], [0.3, 0.96]]) s.push(F(T(bowLimb(u0, u1, -1, 0.3), C.nightDark)), metal(T(bowLimb(u0, u1, 1, 0.24), C.brass)), F(T(bowLimb(u0 * 0.97, u1 * 0.97, 1, 0.08), C.brassLight)));
  // The star charts up the limbs.
  const at = (u, o) => {
    const [x, y] = bowAt(u);
    return [x + o - 0.15, y];
  };
  const upper = [at(-0.44, 0.3), at(-0.54, -0.35), at(-0.64, 0.25), at(-0.74, -0.25), at(-0.83, 0.15)];
  const lower = [at(0.44, -0.3), at(0.56, 0.3), at(0.68, -0.25), at(0.8, 0.15)];
  s.push(...chart(upper), ...chart(lower));
  // The bands, the grip, the astrolabe.
  for (const sd of [-1, 1]) {
    const x = bowX(0.34);
    const y = sd * 0.34 * H;
    s.push(metal(T([[x - 1.9, y - 0.55], [x + 1.9, y - 0.55], [x + 1.8, y + 0.55], [x - 1.8, y + 0.55]], C.brass)), F(R(x - 1.6, y - 0.42, 3.2, 0.24, C.brassLight)), gemmy(E(x + 0.3, y, 0.5, 0.5, C.glass)), F(E(x + 0.18, y - 0.14, 0.18, 0.18, '#ffffff')));
  }
  s.push(matte(T([[-0.9, -2.3], [1.9, -2.3], [2.1, 2.3], [-0.9, 2.3]], C.wine)));
  for (let y = -2; y < 2.1; y += 1.05) s.push(F(T(tube([[-0.9, y + 0.7], [2, y]], 0.36), C.brass)), F(T(tube([[-0.6, y + 0.55], [0.6, y + 0.25]], 0.14), C.brassLight)));
  s.push(F(E(2.5, 0, 1.8 * ax, 1.8, C.glassDeep)), F(T(tube(curve([1.3, 0.8], [2.5, -0.3], [3.7, 0.6], 5), 0.4, 0.7), C.violet)));
  s.push(...ring(2.5, 0, 2.3, 0.55, 12), ...brassStar(2.5, 0, 1.45));
  const tip = bowX(1);
  for (const sd of [-1, 1]) s.push(...brassStar(tip, sd * H, 1.5, 45 * 0));
  return { shapes: s, blade: [-H, H], reach: [], a: { tip: [tip, -H], head: [1, 0], gem: [2.5, 0], blade: [-H, H], string: str.anchor, stars: [...upper, null, ...lower], fx: 'starglass' } };
}

// ---------- Crossbow ----------
// The Starglass Crossbow: a night-lacquered stock with a brass rail along its top, a brass butt
// plate and a star chart inlaid on the shoulder; a little brass telescope sight on two legs above
// the bolt, a star-glass lens in its far end; a wine-red grip wound with brass wire, a brass
// trigger in a brass loop; a star-glass prod with brass stars on its tips, bound in brass round a
// star-cut gem; silver strings, a brass star for a nut; and a bolt with a star-glass point and
// brass fins.
function crossbow() {
  ax = ROUND.crossbow;
  const s = [];
  const { cy, px, S, nut } = XB;
  for (const sd of [-1, 1]) s.push(T(tube([[xbProdX(sd), cy + sd * S], nut], 0.7), C.string));
  s.push(matte(T(XB_STOCK, C.night)), F(T(tube([[-8.4, cy + 0.2], [-4, cy - 0.2], [px - 2, cy - 0.5]], 0.36, 0.3), C.nightLight)), F(T(tube([[-8.8, cy + 4.4], [-5, cy + 2.6], [-2.4, cy + 1.6]], 0.3, 0.24), C.nightDark)));
  s.push(metal(T([[-8.8, cy - 1.1], [px - 1.4, cy - 1.7], [px - 1.4, cy - 0.9], [-8.6, cy - 0.3]], C.brass)), F(T(tube([[-8.4, cy - 0.85], [px - 1.8, cy - 1.45]], 0.2), C.brassLight)));
  s.push(metal(T([[-9.4, cy - 1.3], [-8.5, cy - 1.4], [-8.9, cy + 4.9], [-9.8, cy + 4.6]], C.brass)), F(T(tube([[-9.2, cy - 0.9], [-9.5, cy + 4.2]], 0.22), C.brassLight)));
  const stars = [[-7.9, cy + 2.6], [-6.6, cy + 1.6], [-5.2, cy + 2.2], [-3.8, cy + 1]];
  s.push(...chart(stars));
  // The telescope sight, on its legs.
  for (const x of [5.2, 8.4]) s.push(metal(R(x - 0.3, cy - 4.4, 0.6, 3, C.brassDark)));
  s.push(metal(T([[3, cy - 4.95], [4.8, cy - 5.1], [4.8, cy - 3.75], [3, cy - 3.9]], C.brass)));
  s.push(metal(T([[4.8, cy - 5.35], [9.4, cy - 5.6], [9.4, cy - 3.5], [4.8, cy - 3.6]], C.brass)), F(T(tube([[5, cy - 5.05], [9.2, cy - 5.25]], 0.36), C.brassLight)), F(T(tube([[5, cy - 3.85], [9.2, cy - 3.8]], 0.3), C.brassDeep)));
  s.push(metal(R(9.3, cy - 5.95, 1, 2.8, C.brass)), F(R(9.4, cy - 5.85, 0.3, 2.6, C.brassLight)));
  for (const x of [4.8, 7.1]) s.push(F(R(x - 0.2, cy - 5.5, 0.4, 2, C.brassDeep)));
  s.push(gemmy(E(10.35, cy - 4.55, 0.45, 1.15, C.glass)), F(E(10.3, cy - 4.95, 0.18, 0.35, '#ffffff')));
  // The grip, the trigger.
  s.push(matte(T([[-1.3, cy + 1.2], [2.3, cy + 1.2], [1.6, cy + 6.4], [-1.9, cy + 6]], C.wine)));
  for (let y = cy + 1.6; y < cy + 6; y += 1.1) s.push(F(T(tube([[-1.6, y + 0.75], [2.15 - (y - cy) * 0.12, y]], 0.36), C.brass)), F(T(tube([[-1.3, y + 0.6], [0, y + 0.35]], 0.14), C.brassLight)));
  s.push(...brassStar(-0.15, cy + 6.7, 1.2));
  s.push(metal(T(tube(curve([3.1, cy + 1.6], [3.7, cy + 2.8], [2.9, cy + 3.8], 5), 0.7, 0.45), C.brass)));
  s.push(metal(T(tube([[2, cy + 1.6], ...curve([2.4, cy + 4.6], [4.6, cy + 4.8], [5.2, cy + 1.6], 6)], 0.5), C.brass)));
  // The groove, the bolt, the nut.
  s.push(F(T(tube([[-1.6, cy - 2.2], [px - 1.2, cy - 2.2]], 0.8), C.nightDark)));
  s.push(matte(T(tube([[-0.6, cy - 2.85], [px + 4.4, cy - 2.85]], 0.9), C.nightLight)));
  s.push(gemmy(T([[px + 7.2, cy - 2.85], [px + 4.3, cy - 4.7], [px + 4.9, cy - 2.85], [px + 4.3, cy - 1]], C.glass)), F(T([[px + 7.2, cy - 2.85], [px + 4.3, cy - 4.7], [px + 4.8, cy - 3.3]], C.glassLight)), F(T([[px + 7.2, cy - 2.85], [px + 4.9, cy - 2.85], [px + 4.3, cy - 1]], C.glassDeep)));
  for (const sd of [-1, 1]) s.push(metal(T([[2.6, cy - 2.85], [-0.4, cy - 2.85 + sd * 2.2], [-1.2, cy - 2.85 + sd * 1.8], [0.2, cy - 2.85]], C.brass)), F(T(tube([[2, cy - 2.85 + sd * 0.4], [-0.4, cy - 2.85 + sd * 1.6]], 0.2), C.brassLight)));
  s.push(...brassStar(nut[0], nut[1], 1.2));
  // The prod, its stars, the binding round its orb.
  s.push(gemmy(T(xbProd(), C.glass)), F(T(xbProd(-1, 0.36), C.glassDeep)), F(T(xbProd(1, 0.22), C.glassLight)));
  for (const u of [-0.62, -0.36, 0.36, 0.62]) s.push(F(star4(xbProdX(u), cy + u * S, 0.6, C.glassCore, 0.28)));
  for (const sd of [-1, 1]) s.push(...brassStar(xbProdX(sd), cy + sd * S, 1.3));
  s.push(metal(T([[px - 2.2, cy - 2.4], [px + 1.4, cy - 2.4], [px + 1.6, cy + 2.2], [px - 2.2, cy + 2.2]], C.brass)), F(R(px - 2, cy - 2.2, 0.5, 4.2, C.brassLight)));
  for (const y of [cy - 1.7, cy + 1.5]) s.push(F(R(px - 2.2, y, 3.8, 0.2, C.brassDeep)));
  s.push(...starGem(px - 0.3, cy - 0.1, 1.7));
  s.push(metal(T(tube(arc(px + 1.4, cy + 0.6, 3.1, 1.9, 90, -90, 12), 0.7), C.brass)));
  const prodStars = [-0.62, -0.36, 0.36, 0.62].flatMap((u) => [null, [xbProdX(u), cy + u * S]]);
  return { shapes: s, blade: [-7, 4], reach: [], a: { tip: [px + 7.2, cy - 2.85], head: [px, cy], gem: [px - 0.3, cy - 0.1], blade: [-7, 4], stars: [...stars, ...prodStars], fx: 'starglass' } };
}

// The Starglass weapons by type (the level-30 ones, `${type}_30`).
export const STARGLASS_DESIGNS = { sword, axe, spear, staff, dagger, bow, crossbow };
