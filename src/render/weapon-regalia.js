// The Island Journey ladder, Lv 50: the Regalia, the Mochi Queen's own weapons
// (docs/design/island-journey-gear.md), what Hayate gives you when you wake her: the legendary
// tier. Her colours run through them: cloud-white like her hair, sleepy periwinkle like her eyes,
// the icy crystal of her crown and the gold of her sprout. White-gold blades edged in crown
// crystal with a gold ridge; white feathered wings (her wind, and the feather it left on Mira's
// earring) sweeping out of guards, sockets and crowns; crowns of crystal spires like hers; her
// gold sprout, the Mochi mark, on a periwinkle shield as each one's crest; periwinkle grips wound
// in gold; crystal drops for pommels. The wings are moving parts that beat (and the scepter's
// great crystal floats over its crown), each class in its own way, and each class has its own
// light: its Nexus aura and live effect (render/weapon-fx.js `regalLive`, by `a.style`): storm
// for the Warrior's sword, axe and spear, tide for the Tide Mage's scepter, moon for the Moon
// Moth's knife, sun for the bow and phoenix fire for the crossbow.
//
// Same frame and sizes as the earlier tiers, from the shared kit.

import { R, E, T, F } from './pixel.js';
import { matte, metal, tube, mir, arc, curve, BOW_H, bowX, bowLimb, bowAt, bowString, XB, xbProdX, xbProd, XB_STOCK } from './weapon-ladder-kit.js';

// The Regalia palette (Hayate's: render/hayate.js and her crystal crown).
export const REGALIA = {
  white: '#f8faff', whiteShade: '#dbe4fa', whiteDeep: '#b2c1e8', glint: '#ffffff',
  feather: '#ffffff', featherShade: '#dfe6fb', featherDeep: '#b9c6ee',
  gold: '#f3c443', goldLight: '#fff2a3', goldDark: '#c58e1c', goldDeep: '#8d6114',
  sprout: '#f0c540', sproutDark: '#b88a22', sproutLight: '#fff0a6',
  crystal: '#8fe3ff', crystalLight: '#d6f7ff', crystalDeep: '#46aedb',
  peri: '#7a96e0', periLight: '#a8bcf4', periDark: '#5470c2',
  string: '#fff0bf',
};
const C = REGALIA;
const DEG = 180 / Math.PI;

// Each weapon type is drawn wider than tall (render/weapon-designs.js CHUNK), so round things
// (leaves, feathers, crowns) are drawn this much narrower to come out true; each design sets `ax`
// for its type before it draws.
const ROUND = { sword: 1.2 / 1.5, axe: 1.15 / 1.4, spear: 1.1 / 1.45, staff: 1.1 / 1.25, dagger: 1, bow: 1.1 / 1.3, crossbow: 1 };
let ax = 1;
// A point `l` along and `o` across from (x, y), heading `ang` (degrees, 0 = up, 90 = right).
function along(x, y, ang) {
  const [ux, uy] = [Math.sin(ang / DEG), -Math.cos(ang / DEG)];
  return (l, o) => [x + (ux * l - uy * o) * ax, y + (uy * l + ux * o)];
}

// Tags shapes as one of the weapon's moving parts (render/weapons.js): drawn as a picture of its
// own and turned about its pivot every frame, as its anchors' `parts` say.
const tag = (name, shapes) => shapes.map((q) => ({ ...q, part: name }));
// A wing's part entry: beating about its root, on side `side` (1 = it spreads to the right), a
// lower wing (`flip`) beating the other way.
const wingPart = (pivot, side, { flip = false, z = 'back' } = {}) => ({ pivot, kind: 'wing', side, flip, z });

// A crystal of her crown standing on (x, y), `h` tall and `w` wide: six-sided, its left faces lit,
// its right in deep blue, a bright line down its middle.
function shard(x, y, h, w) {
  const hw = (w / 2) * ax;
  const out = [matte(T([[x - hw, y], [x - hw, y - h * 0.62], [x, y - h], [x + hw, y - h * 0.62], [x + hw, y]], C.crystal))];
  out.push(F(T([[x - hw, y], [x - hw, y - h * 0.62], [x, y - h], [x - hw * 0.22, y - h * 0.56], [x - hw * 0.22, y]], C.crystalLight)));
  out.push(F(T([[x + hw * 0.36, y], [x + hw * 0.36, y - h * 0.56], [x, y - h], [x + hw, y - h * 0.62], [x + hw, y]], C.crystalDeep)));
  out.push(F(T(tube([[x - hw * 0.05, y - h * 0.15], [x - hw * 0.05, y - h * 0.8]], Math.max(0.16, w * 0.09)), '#ffffff')));
  return out;
}
// The same crystal pointing down from (x, y).
const shardDown = (x, y, h, w) => shard(x, 0, h, w).map((q) => ({ ...q, pts: q.pts.map(([px, py]) => [px, y - py]) }));
// A crystal drop hanging from (x, y), `r` across: faceted, lit on its left.
function drop(x, y, r) {
  const rx = r * ax;
  const out = [matte(T([[x, y - r * 0.2], [x + rx, y + r * 0.5], [x + rx * 0.7, y + r * 1.3], [x, y + r * 2], [x - rx * 0.7, y + r * 1.3], [x - rx, y + r * 0.5]], C.crystal))];
  out.push(F(T([[x, y - r * 0.2], [x - rx, y + r * 0.5], [x - rx * 0.7, y + r * 1.3], [x, y + r * 2], [x - rx * 0.15, y + r * 0.9]], C.crystalLight)));
  out.push(F(T([[x + rx * 0.3, y + r * 0.9], [x + rx, y + r * 0.5], [x + rx * 0.7, y + r * 1.3], [x, y + r * 2]], C.crystalDeep)));
  out.push(F(E(x - rx * 0.35, y + r * 0.55, Math.max(0.16, r * 0.14) * ax, Math.max(0.16, r * 0.14), '#ffffff')));
  return out;
}
// A round sprout leaf in gold from (x, y) toward `ang`, `len` long: the Mochi's round leaf, one
// half lit, a midrib down it.
function sproutLeaf([x, y], ang, len) {
  const P = along(x, y, ang);
  const at = (l, o) => P(l * len, o * len);
  const side = (k) => Array.from({ length: 11 }, (_, i) => at(i / 10, k * (0.06 + Math.sin((i / 10) * Math.PI) * 0.42)));
  return [
    metal(T([...side(1), ...side(-1).reverse()], C.sprout)),
    F(T([...side(ang < 0 ? 1 : -1).slice(1, -1), at(0.86, 0), at(0.14, 0)], C.sproutLight)),
    F(T(tube([at(0.06, 0), at(0.86, 0)], Math.max(0.14, len * 0.07), 0.1), C.sproutDark)),
  ];
}
// Her gold sprout, the Mochi mark, growing from (x, y), `k` its size: a tapered stem with a bend
// in it and two round leaves opening from its tip. Gives the point between its leaves too (where
// the effect's heart beats).
function sproutCrest(x, y, k, open = 58, leafLen = 2) {
  const P = along(x, y, 0);
  const stem = [P(0, 0), P(1.2 * k, 0.28 * k), P(2.4 * k, 0)];
  const shapes = [metal(T(tube(stem, 0.95 * k, 0.5 * k), C.sproutDark)), F(T(tube(stem.map(([px, py]) => [px - 0.08, py]), 0.38 * k, 0.2 * k), C.sprout))];
  shapes.push(...sproutLeaf(stem[2], -open, leafLen * k), ...sproutLeaf(stem[2], open, leafLen * k));
  return { shapes, heart: P(3 * k, 0) };
}
// Her crest at (x, y), `k` its size: a periwinkle shield rimmed in gold with her gold sprout on it.
function crest(x, y, k) {
  const S = (u, v) => [x + u * k * ax, y + v * k];
  const shield = [S(0, -1.25), S(0.95, -0.95), S(1, 0.15), S(0.6, 0.95), S(0, 1.45), S(-0.6, 0.95), S(-1, 0.15), S(-0.95, -0.95)];
  const out = [metal(T(shield.map(([px, py]) => [x + (px - x) * 1.18, y + (py - y) * 1.14]), C.gold)), matte(T(shield, C.peri))];
  out.push(F(T([S(0, -1.25), S(-0.95, -0.95), S(-1, 0.15), S(-0.6, 0.95), S(0, 1.45), S(-0.2, 0.2)], C.periLight)));
  const sp = sproutCrest(x, y + 0.95 * k, 0.4 * k, 64, 1.7);
  out.push(...sp.shapes);
  return { shapes: out, heart: sp.heart };
}
// A white feather from (x, y) toward `ang`, `len` long and `w` wide at its fullest: broad, its
// tip rounded, its lower vane in shade with a fine line down its edge (so overlapping feathers
// part), a periwinkle tip and a gold quill.
function feather([x, y], ang, len, w, bend = 0) {
  const P = along(x, y, ang);
  const at = (t, o) => P(t * len, o * w + bend * t * t * len * 0.16);
  const half = (t) => 0.5 * Math.sqrt(Math.max(0, 1 - ((t - 0.56) / 0.56) ** 2)) * (0.55 + 0.45 * t);
  const side = (k) => Array.from({ length: 13 }, (_, i) => at(i / 12, k * half(i / 12)));
  const out = [matte(T([...side(1), ...side(-1).reverse()], C.feather))];
  out.push(F(T([...side(-1), ...Array.from({ length: 13 }, (_, i) => at(1 - i / 12, -0.06))], C.featherShade)));
  out.push(F(T(tube(side(-1).slice(2), Math.max(0.16, w * 0.09), 0.1), C.featherDeep)));
  const tipSide = (k) => Array.from({ length: 5 }, (_, i) => at(0.8 + (i / 4) * 0.2, k * half(0.8 + (i / 4) * 0.2) * 0.9));
  out.push(F(T([...tipSide(1), ...tipSide(-1).reverse()], C.periLight)));
  out.push(F(T(tube(Array.from({ length: 6 }, (_, i) => at((i / 5) * 0.86, 0)), Math.max(0.2, w * 0.1), 0.08), C.gold)));
  return out;
}
// A white wing displayed, rooted at (x, y) on side `sd` (1 = right), `len` across: a gold arm
// sweeping up and out to the wrist, broad feathers hanging down and out from under it (the outer
// ones the longest, so its lower edge scallops outward), a row of small feathers over their roots
// and a gold shoulder with a crystal. `flip` turns it upside down (a wing spreading downward).
function wing(x, y, sd, len, { n = 5, w = 1.5, flip = false } = {}) {
  const fy = flip ? -1 : 1;
  const arm = curve([x, y], [x + sd * len * 0.35 * ax, y - fy * len * 0.85], [x + sd * len * 0.95 * ax, y - fy * len * 0.62], 12);
  const out = [];
  const angOf = (deg) => (flip ? 180 - deg : deg) * sd;
  for (let i = n - 1; i >= 0; i--) {
    const t = 0.3 + (0.7 * i) / (n - 1);
    const [rx, ry] = arm[Math.round(t * 12)];
    out.push(...feather([rx, ry], angOf(168 - 32 * t), len * (0.5 + 0.42 * t), w, sd * fy * 0.5));
  }
  for (let i = 0; i < 4; i++) {
    const t = 0.18 + i * 0.22;
    const [rx, ry] = arm[Math.round(t * 12)];
    out.push(...feather([rx, ry], angOf(160 - 30 * t), len * 0.3, w * 0.9, 0));
  }
  out.push(metal(T(tube(arm, 0.8, 0.42), C.gold)), F(T(tube(arm.slice(0, -2).map(([px, py]) => [px, py - 0.12 * fy]), 0.26, 0.12), C.goldLight)));
  out.push(metal(E(arm[12][0], arm[12][1], 0.45 * ax, 0.45, C.gold)));
  out.push(metal(E(x, y, 1.05 * ax, 0.95, C.gold)), F(E(x - 0.25 * ax, y - 0.28, 0.4 * ax, 0.3, C.goldLight)));
  out.push(F(T([[x, y - 0.5], [x + 0.4 * ax, y], [x, y + 0.5], [x - 0.4 * ax, y]], C.crystal)), F(E(x - 0.1, y - 0.12, 0.12, 0.12, '#ffffff')));
  return out;
}
// A curl of the Queen's wind engraved in gold: a fine line setting off from (x, y) toward `dir`
// and curling round on itself to side `sd`.
function engraved([x, y], dir, len, sd) {
  const pts = [[x, y]];
  let a = dir / DEG;
  let [px, py] = [x, y];
  for (let i = 1; i <= 16; i++) {
    const u = i / 16;
    a += sd * u * u * 0.85;
    const step = (len / 16) * (1.3 - u * 0.75);
    px += Math.sin(a) * step * ax;
    py -= Math.cos(a) * step;
    pts.push([px, py]);
  }
  return [F(T(tube(pts, 0.3, 0.1), C.goldDark))];
}
// A crown like hers at (x, y): crystal spires (the middle one the tallest, `h`) behind a gold
// band set with crystal beads, gold balls between the spires. (Its spires and band come apart,
// so something can stand between them: the scepter's great crystal.)
const crown = (x, y, w, n, h, opts) => [...crownSpires(x, y, w, n, h, opts), ...crownBand(x, y, w, n)];
function crownSpires(x, y, w, n, h, { middle = true } = {}) {
  const out = [];
  const step = w / n;
  for (let i = 0; i < n; i++) {
    const c = i - (n - 1) / 2;
    if (!middle && c === 0) continue;
    out.push(...shard(x + c * step * ax, y - 0.4, h * (1 - (Math.abs(c) / ((n + 1) / 2)) * 0.6), step * 0.8));
  }
  return out;
}
function crownBand(x, y, w, n) {
  const out = [];
  const step = w / n;
  for (let i = 0; i < n - 1; i++) out.push(metal(E(x + (i - (n - 2) / 2) * step * ax, y - 0.95, 0.36 * ax, 0.36, C.gold)));
  const bw = (w * ax) / 2 + 0.3;
  out.push(metal(T([[x - bw, y - 0.75], [x + bw, y - 0.75], [x + bw - 0.25, y + 0.75], [x - bw + 0.25, y + 0.75]], C.gold)));
  out.push(F(R(x - bw + 0.25, y - 0.62, bw * 2 - 0.5, 0.26, C.goldLight)), F(R(x - bw + 0.35, y + 0.45, bw * 2 - 0.7, 0.22, C.goldDeep)));
  for (let i = 0; i < n; i++) {
    const px = x + (i - (n - 1) / 2) * step * ax;
    out.push(F(T([[px, y - 0.42], [px + 0.36 * ax, y], [px, y + 0.42], [px - 0.36 * ax, y]], C.crystal)), F(E(px - 0.08, y - 0.1, 0.12, 0.12, '#ffffff')));
  }
  return out;
}
// These pieces for the Regalia armour (render/jobgear/ladder-regalia.js), drawn unsqueezed (each
// weapon design narrows `ax` for its type, and leaves it so).
const flat = (fn) => (...args) => {
  const was = ax;
  ax = 1;
  try {
    return fn(...args);
  } finally {
    ax = was;
  }
};
export const REGAL_PIECES = { shard: flat(shard), drop: flat(drop), sproutCrest: flat((...a) => sproutCrest(...a).shapes), crest: flat((...a) => crest(...a).shapes), feather: flat(feather), wing: flat(wing), crownSpires: flat(crownSpires), crownBand: flat(crownBand), engraved: flat(engraved) };
// A gold band round a haft at (x, y), `w` wide.
function goldBand(x, y, w, h = 0.8) {
  return [metal(R(x - w / 2, y - h / 2, w, h, C.gold)), F(R(x - w / 2 + 0.2, y - h / 2 + 0.1, w * 0.45, h * 0.28, C.goldLight)), F(R(x - w / 2, y + h / 2 - 0.2, w, 0.2, C.goldDeep))];
}
// A white haft along `pts`, a cool shadow down its far side and a deeper line in it.
function whiteHaft(pts, w0, w1 = w0) {
  const out = [matte(T(tube(pts, w0, w1), C.white)), F(T(tube(pts.map(([x, y]) => [x + w0 * 0.3, y]), w0 * 0.3, w1 * 0.28), C.whiteShade)), F(T(tube(pts.map(([x, y]) => [x + w0 * 0.42, y]), w0 * 0.12, w1 * 0.1), C.whiteDeep))];
  return out;
}
// A periwinkle grip from y0 to y1 (x from -w/2 to w/2) wound with gold, a gold band at each end.
function periWrap(y0, y1, w) {
  const out = [matte(R(-w / 2, y0, w, y1 - y0, C.peri)), F(R(-w / 2 + w * 0.14, y0, w * 0.18, y1 - y0, C.periLight))];
  const n = Math.max(2, Math.round((y1 - y0) / 1.3));
  const step = (y1 - y0) / n;
  for (let i = 0; i < n; i++) {
    const y = y0 + (i + 0.5) * step;
    out.push(F(T(tube([[-w / 2, y + step * 0.35], [w / 2, y - step * 0.35]], 0.32), C.gold)), F(T(tube([[-w / 2 + 0.3, y + step * 0.24], [0, y]], 0.12), C.goldLight)), F(T(tube([[-w / 2, y + step * 0.35 + 0.42], [w / 2, y - step * 0.35 + 0.42]], 0.16), C.periDark)));
  }
  out.push(...goldBand(0, y0, w + 0.5), ...goldBand(0, y1, w + 0.5));
  return out;
}
// A white-gold blade, `edge` its +x half from the tip down: edged both sides in a strip of crown
// crystal, lit down its left, cool down its right, a gold ridge from ridge[0] to ridge[1].
function whiteBlade(edge, ridge, rim = 0.55) {
  const [, top] = edge[0];
  const inner = edge.map(([x, y], i) => [i === 0 ? 0 : Math.max(0, x - rim), i === 0 ? y + rim * 2.2 : y]);
  const strip = (sd) => [...edge.map(([x, y]) => [sd * x, y]), ...inner.slice().reverse().map(([x, y]) => [sd * x, y])];
  const xs = (k) => edge.map(([x, y]) => [x * k, y]).slice(1, -1);
  return [
    metal(T(mir(edge), C.white)),
    F(T(tube(xs(-0.5), 0.42, 0.32), C.glint)),
    F(T(tube(xs(0.5), 0.36, 0.3), C.whiteShade)),
    F(T(strip(-1), C.crystalLight)),
    F(T(strip(1), C.crystal)),
    F(T(tube(edge.slice(1, -1).map(([x, y]) => [x - rim * 0.45, y]), 0.16), C.crystalDeep)),
    F(T(tube([[0, ridge[0]], [0, ridge[1]]], 0.38, 0.22), C.gold)),
    F(T(tube([[-0.08, ridge[0] - 0.3], [-0.08, ridge[1] + 1]], 0.12), C.goldLight)),
    F(T(tube([[-0.2, top + 1.2], [-0.5, top + 2.8]], 0.2, 0.14), '#ffffff')),
  ];
}

// ---------- Sword ----------
// The Regalia Sword: a broad white-gold blade edged in crown crystal, a gold ridge up it with
// curls of her wind engraved either side and her crest on its base; for a guard, two white
// wings sweeping up and out from a gold crown of crystal spires; a periwinkle grip wound in gold;
// a crystal drop for a pommel, hugged by two gold leaves.
const B = -4;
function sword() {
  ax = ROUND.sword;
  const s = [];
  const L = 20;
  const top = B - L;
  s.push(...periWrap(-2.2, 5, 2.7));
  s.push(metal(T([[-1.6, 5.2], [1.6, 5.2], [1.1, 6.2], [-1.1, 6.2]], C.gold)), F(R(-1.4, 5.3, 2.8, 0.3, C.goldLight)));
  s.push(...drop(0, 6.4, 1.15));
  for (const sd of [-1, 1]) s.push(...sproutLeaf([sd * 0.3, 6.5], 180 - sd * 62, 1.9));
  const gy = B + 0.6;
  for (const sd of [-1, 1]) s.push(...tag(sd < 0 ? 'wingL' : 'wingR', wing(sd * 1.9, gy - 0.3, sd, 6.4, { n: 5, w: 1.6 })));
  s.push(...whiteBlade([[0, top], [1.5, top + 2.4], [2.4, top + 5.6], [2.6, top + 9.5], [2.45, B - 2.2], [2.05, B]], [top + 4.2, B - 6.6]));
  for (const [y, sd] of [[top + 6.8, 1], [top + 9.8, -1], [top + 12.8, 1]]) s.push(...engraved([sd * 0.35, y], sd * 38, 2.2, sd));
  const c = crest(0, B - 3.9, 1.35);
  s.push(...c.shapes);
  s.push(metal(R(-3, gy - 0.1, 6, 1.1, C.gold)), F(R(-2.8, gy, 5.6, 0.28, C.goldLight)));
  s.push(...crown(0, gy, 4.4, 3, 2.6));
  const parts = { wingL: wingPart([-1.9, gy - 0.3], -1), wingR: wingPart([1.9, gy - 0.3], 1) };
  return { shapes: s, blade: [top, B], reach: [], a: { tip: [0, top], head: [0, B - L * 0.55], gem: c.heart, crest: c.heart, blade: [top, B], parts, style: 'storm', fx: 'regalia' } };
}

// ---------- Axe ----------
// The Regalia Axe: a broad white-gold bit edged in a strip of crown crystal, its top and bottom
// scalloped like her cloud hair, her crest on its face and curls of wind engraved by it; a white
// wing sweeping back from behind the head; a crown on top of the haft; a white haft, a
// periwinkle grip and a crystal drop at its foot.
function axe() {
  ax = ROUND.axe;
  const s = [];
  const H = 22;
  const top = -H;
  const hx = 1.2;
  const hy = top + 5.8;
  const P = (ang, r) => [hx + Math.cos(ang / DEG) * r, hy - Math.sin(ang / DEG) * r];
  s.push(...whiteHaft([[0.2, top - 0.6], [0, top + 10], [-0.15, 6.4]], 2.6, 2.8));
  s.push(...goldBand(0, top + 11.4, 3.2), ...periWrap(-1.8, 4.6, 3));
  s.push(metal(R(-1.5, 4.9, 3, 1, C.gold)), ...drop(0, 5.8, 1.1));
  s.push(...tag('wing', wing(-0.8, hy + 0.6, -1, 6.2, { n: 5, w: 1.55 })));
  s.push(...crown(0.2, top - 0.9, 3.8, 3, 3.2));
  // The bit: scalloped top and bottom like clouds, the crystal edge, the gold line inside it.
  const scallop = (p0, p1) => {
    const [dx, dy] = [p1[0] - p0[0], p1[1] - p0[1]];
    const l = Math.hypot(dx, dy) || 1;
    return Array.from({ length: 19 }, (_, i) => {
      const u = i / 18;
      const o = Math.abs(Math.sin(u * Math.PI * 3)) * 0.8;
      return [p0[0] + dx * u + (dy / l) * o, p0[1] + dy * u - (dx / l) * o];
    });
  };
  const bit = [...scallop([1.2, top + 1.6], P(58, 8.9)), ...arc(hx, hy, 8.9, 8.9, 58, -58, 20).slice(1, -1), ...scallop(P(-58, 8.9), [1.2, top + 10])];
  s.push(metal(T(bit, C.white)));
  s.push(F(T([...arc(hx, hy, 8.6, 8.6, 50, -50, 16), ...arc(hx, hy, 6.4, 6.4, -42, 42, 12)], C.whiteShade)));
  s.push(F(T([...arc(hx, hy, 8.95, 8.95, 56, -56, 18), ...arc(hx, hy, 7.9, 7.9, -56, 56, 18)], C.crystal)), F(T(tube(arc(hx, hy, 8.65, 8.65, 12, 50, 8), 0.3), C.crystalLight)), F(T(tube(arc(hx, hy, 8.2, 8.2, -50, -10, 8), 0.24), C.crystalDeep)));
  s.push(F(T(tube(arc(hx, hy, 7.65, 7.65, 54, -54, 18), 0.32), C.gold)));
  s.push(...engraved([hx + 2.2, hy - 3.6], 60, 2.2, 1), ...engraved([hx + 2.2, hy + 3.8], 120, 2.2, -1));
  const c = crest(hx + 4.3, hy - 0.2, 1.5);
  s.push(...c.shapes);
  for (const y of [top + 1.7, top + 10]) s.push(...goldBand(0, y, 3.3, 1.1));
  return { shapes: s, blade: [top - 3, top + 13], reach: [], a: { tip: [hx + 8.9, hy], head: [hx + 5, hy], gem: c.heart, crest: c.heart, blade: [top - 3, top + 13], parts: { wing: wingPart([-0.8, hy + 0.6], -1) }, style: 'storm', fx: 'regalia' } };
}

// ---------- Spear ----------
// The Regalia Spear: a long white-gold blade edged in crown crystal rising out of a crown of
// crystal spires; white wings sweeping up from its gold socket, her crest on the socket's face; a
// white shaft with gold bands, periwinkle grips and a crystal drop
// at its foot.
function spear() {
  ax = ROUND.spear;
  const s = [];
  const S = 32;
  const sock = -S;
  s.push(...whiteHaft([[0, sock + 1], [0.15, -8], [0, 13.4]], 2.4, 2.6));
  s.push(...goldBand(0.1, -10.8, 3), ...goldBand(0.05, -22.6, 3), ...periWrap(-3, 4, 2.7), ...periWrap(11.2, 13.6, 2.7));
  s.push(metal(R(-1.4, 13.9, 2.8, 0.9, C.gold)), ...drop(0, 14.6, 1.05));
  for (const sd of [-1, 1]) s.push(...tag(sd < 0 ? 'wingL' : 'wingR', wing(sd * 1.1, sock + 2.6, sd, 5.6, { n: 5, w: 1.4 })));
  const tip = sock - 14;
  s.push(...whiteBlade([[0, tip], [1.2, tip + 3], [1.95, tip + 7], [1.8, sock - 3.6], [1.1, sock - 1.2]], [tip + 3.2, sock - 2.4], 0.5));
  s.push(metal(T([[-1.4, sock + 3.6], [1.4, sock + 3.6], [1.1, sock - 0.2], [-1.1, sock - 0.2]], C.gold)), F(R(-1.2, sock, 0.45, 3.4, C.goldLight)), ...goldBand(0, sock + 3.6, 3.1));
  s.push(...crown(0, sock - 0.4, 4.6, 5, 2.8));
  const c = crest(0, sock + 1.9, 0.95);
  s.push(...c.shapes);
  const parts = { wingL: wingPart([-1.1, sock + 2.6], -1), wingR: wingPart([1.1, sock + 2.6], 1) };
  return { shapes: s, blade: [tip, sock], reach: [], a: { tip: [0, tip], head: [0, sock - 6], gem: c.heart, crest: c.heart, blade: [tip, sock], parts, style: 'storm', fx: 'regalia' } };
}

// ---------- Staff ----------
// The Regalia Scepter: a gold crown of crystal spires with a great crystal like the heart of hers
// floating over it, her gold sprout growing from its tip; white wings spreading from under the crown; a white
// staff with gold bands, a periwinkle grip and a crystal drop at its
// foot.
function staff() {
  ax = ROUND.staff;
  const s = [];
  const S = 26;
  const stem = [[0, 4], [0.3, -6], [-0.2, -15], [0.2, -S]];
  s.push(...whiteHaft(stem, 2.7, 2.4));
  s.push(...goldBand(-0.15, -15, 3.2), ...goldBand(0.25, -6, 3.3), ...periWrap(-4.4, 2.4, 2.8));
  s.push(metal(R(-1.3, 2.7, 2.6, 0.9, C.gold)), ...drop(0.05, 3.3, 1.05));
  const cx = 0.2;
  const cy = -S - 2.4;
  for (const sd of [-1, 1]) s.push(...tag(sd < 0 ? 'wingL' : 'wingR', wing(cx + sd * 1.1, -S - 0.4, sd, 5.8, { n: 5, w: 1.45 })));
  s.push(...goldBand(cx, -S + 0.2, 3.2, 1.2));
  s.push(...crownSpires(cx, cy, 7, 5, 4, { middle: false }), ...crownBand(cx, cy, 7, 5));
  // The great crystal floats a little over the crown, her sprout growing from its tip.
  const fy = cy - 1.7;
  const c = sproutCrest(cx, fy - 5.7, 1.05, 64, 1.75);
  s.push(...tag('float', [...shard(cx, fy, 5.6, 3.1), ...c.shapes]));
  const top = fy - 5.7 - 2.4 * 1.05 - 1.75 * 1.05;
  const parts = { wingL: wingPart([cx - 1.1, -S - 0.4], -1), wingR: wingPart([cx + 1.1, -S - 0.4], 1), float: { pivot: [cx, fy - 2.8], kind: 'float', z: 'front' } };
  return { shapes: s, blade: [top, -S], reach: [], a: { tip: [cx, top], head: [cx, cy - 2], gem: [cx, fy - 2.8], crest: c.heart, blade: [top, -S], parts, style: 'tide', fx: 'regalia' } };
}

// ---------- Knife ----------
// The Regalia Knife: a white-gold blade with a gold spine and a crown-crystal edge, a curl of her
// wind engraved on it and her crest on its base; small white wings for quillons round a crystal;
// a periwinkle grip; a crystal drop for a pommel, hugged by two gold leaves.
const D = -3;
function dagger() {
  ax = ROUND.dagger;
  const s = [];
  const L = 14;
  const top = D - L;
  s.push(...periWrap(-1.8, 4.4, 2.5));
  s.push(metal(T([[-1.3, 4.6], [1.3, 4.6], [0.9, 5.5], [-0.9, 5.5]], C.gold)), ...drop(0, 5.6, 1));
  for (const sd of [-1, 1]) s.push(...sproutLeaf([sd * 0.25, 5.7], 180 - sd * 62, 1.6));
  const gy = D + 0.7;
  for (const sd of [-1, 1]) s.push(...tag(sd < 0 ? 'wingL' : 'wingR', wing(sd * 1.2, gy - 0.1, sd, 3.8, { n: 4, w: 1.15 })));
  const blade = [[-1.7, D], [-1.7, top + 5.6], [-0.9, top + 2.4], [0.9, top], [2.3, top + 2.8], [2.9, top + 6.8], [2.7, D - 2.4], [1.7, D - 1.3], [2, D]];
  s.push(metal(T(blade, C.white)));
  s.push(F(T([[2.9, top + 6.8], [2.7, D - 2.4], [1.7, D - 1.3], [2, D], [1.3, D], [1.4, D - 2.2], [2.1, top + 7]], C.whiteShade)));
  s.push(F(T([[0.9, top], [2.3, top + 2.8], [2.9, top + 6.8], [2.7, D - 2.4], [2.15, D - 2.4], [2.35, top + 6.9], [1.85, top + 3.2], [0.75, top + 1]], C.crystal)), F(T(tube([[1.2, top + 0.7], [2.4, top + 3.2], [2.75, top + 6.8]], 0.2), C.crystalLight)));
  s.push(metal(T([[-1.7, D], [-1.7, top + 5.6], [-0.9, top + 2.4], [-0.45, top + 2.8], [-1.1, top + 5.9], [-1.1, D]], C.gold)), F(T(tube([[-1.5, D - 0.6], [-1.5, top + 5.6], [-0.9, top + 3]], 0.16), C.goldLight)));
  s.push(...engraved([0.5, top + 8.6], 20, 2.2, 1));
  const c = crest(0.4, D - 2.4, 0.95);
  s.push(...c.shapes);
  s.push(metal(R(-1.6, gy - 0.5, 3.4, 1, C.gold)), F(R(-1.4, gy - 0.4, 3, 0.24, C.goldLight)));
  s.push(...shard(0.1, gy + 0.55, 1.5, 1));
  const parts = { wingL: wingPart([-1.2, gy - 0.1], -1), wingR: wingPart([1.2, gy - 0.1], 1) };
  return { shapes: s, blade: [top, D], reach: [], a: { tip: [0.9, top], head: [0.6, D - L * 0.55], gem: c.heart, crest: c.heart, blade: [top, D], parts, style: 'moon', fx: 'regalia' } };
}

// ---------- Bow ----------
// The Regalia Bow: white-gold limbs faced in gold with curls of her wind engraved along them;
// gold bands with crystal beads where they leave the grip; her crest on the riser's front, white
// wings spreading up and down from it; a periwinkle grip wound in gold; crystal spires on the tips
// in gold collars; strung in pale gold.
function bow() {
  ax = ROUND.bow;
  const s = [];
  const H = BOW_H;
  const str = bowString(C.string);
  s.push(str.shape);
  for (const sd of [-1, 1]) s.push(...tag(sd < 0 ? 'wingU' : 'wingD', wing(2.4, sd * 1.4, 1, 4.6, { n: 4, w: 1.2, flip: sd > 0 })));
  s.push(metal(T(bowLimb(-1, 1), C.white)));
  for (const [u0, u1] of [[-0.95, -0.3], [0.3, 0.95]]) s.push(F(T(bowLimb(u0, u1, -1, 0.32), C.whiteShade)), metal(T(bowLimb(u0, u1, 1, 0.22), C.gold)), F(T(bowLimb(u0 * 0.97, u1 * 0.97, 1, 0.08), C.goldLight)));
  for (const [u, sd] of [[-0.56, 1], [-0.76, -1], [0.56, -1], [0.76, 1]]) {
    const [x, y] = bowAt(u);
    s.push(...engraved([x - 0.2, y + (u < 0 ? 0.9 : -0.9)], u < 0 ? 10 : 170, 1.7, sd));
  }
  for (const sd of [-1, 1]) {
    const x = bowX(0.34);
    const y = sd * 0.34 * H;
    s.push(metal(T([[x - 1.9, y - 0.55], [x + 1.9, y - 0.55], [x + 1.8, y + 0.55], [x - 1.8, y + 0.55]], C.gold)), F(R(x - 1.6, y - 0.42, 3.2, 0.24, C.goldLight)), F(T([[x + 0.3, y - 0.5], [x + 0.75, y], [x + 0.3, y + 0.5], [x - 0.15, y]], C.crystal)));
  }
  s.push(matte(T([[-0.9, -2.3], [1.9, -2.3], [2.1, 2.3], [-0.9, 2.3]], C.peri)));
  for (let y = -2.1; y < 2.2; y += 1.05) s.push(F(T(tube([[-0.9, y + 0.8], [2, y]], 0.32), C.gold)));
  const c = crest(2.8, 0, 1.15);
  s.push(...c.shapes);
  const tip = bowX(1);
  s.push(...goldBand(tip, -(H - 0.3), 1.9, 0.8), ...shard(tip, -H + 0.7, 2.2, 1.2));
  s.push(...goldBand(tip, H - 0.3, 1.9, 0.8), ...shardDown(tip, H - 0.7, 2.2, 1.2));
  const parts = { wingU: wingPart([2.4, -1.4], 1), wingD: wingPart([2.4, 1.4], 1, { flip: true }) };
  return { shapes: s, blade: [-H, H], reach: [], a: { tip: [tip, -H], head: [1, 0], gem: c.heart, crest: c.heart, blade: [-H, H], string: str.anchor, parts, style: 'sun', fx: 'regalia' } };
}

// ---------- Crossbow ----------
// The Regalia Crossbow: a white stock with a gold rail and a gold butt plate, her crest on its
// shoulder; a white wing sweeping up and back from the stock; a periwinkle grip wound in
// gold, a gold trigger in a gold loop; a white-gold prod faced in gold, crystal spires on its
// tips, bound in gold round a crystal; pale gold strings, a crystal drop for a nut; and a white
// bolt with a crystal point and gold fins.
function crossbow() {
  ax = ROUND.crossbow;
  const s = [];
  const { cy, px, S, nut } = XB;
  for (const sd of [-1, 1]) s.push(T(tube([[xbProdX(sd), cy + sd * S], nut], 0.7), C.string));
  s.push(matte(T(XB_STOCK, C.white)), F(T(tube([[-8.8, cy + 4.4], [-5, cy + 2.6], [-2.4, cy + 1.6], [px - 2, cy + 1.2]], 0.5, 0.36), C.whiteShade)));
  s.push(metal(T([[-8.8, cy - 1.1], [px - 1.4, cy - 1.7], [px - 1.4, cy - 0.9], [-8.6, cy - 0.3]], C.gold)), F(T(tube([[-8.4, cy - 0.85], [px - 1.8, cy - 1.45]], 0.2), C.goldLight)));
  s.push(metal(T([[-9.4, cy - 1.3], [-8.5, cy - 1.4], [-8.9, cy + 4.9], [-9.8, cy + 4.6]], C.gold)));
  s.push(...engraved([-8, cy + 3.6], 40, 2.4, -1));
  s.push(...tag('wing', wing(-3.6, cy - 0.8, -1, 5.6, { n: 5, w: 1.35 })));
  const c = crest(-5.6, cy + 2.6, 1.15);
  s.push(...c.shapes);
  // The grip, the trigger.
  s.push(matte(T([[-1.3, cy + 1.2], [2.3, cy + 1.2], [1.6, cy + 6.4], [-1.9, cy + 6]], C.peri)));
  for (let y = cy + 1.6; y < cy + 6; y += 1.1) s.push(F(T(tube([[-1.6, y + 0.75], [2.15 - (y - cy) * 0.12, y]], 0.34), C.gold)), F(T(tube([[-1.3, y + 0.6], [0, y + 0.35]], 0.12), C.goldLight)));
  s.push(...goldBand(-0.15, cy + 6.3, 3.2, 0.7));
  s.push(metal(T(tube(curve([3.1, cy + 1.6], [3.7, cy + 2.8], [2.9, cy + 3.8], 5), 0.7, 0.45), C.gold)));
  s.push(metal(T(tube([[2, cy + 1.6], ...curve([2.4, cy + 4.6], [4.6, cy + 4.8], [5.2, cy + 1.6], 6)], 0.5), C.gold)));
  // The groove, the bolt, the nut.
  s.push(F(T(tube([[-1.6, cy - 2.2], [px - 1.2, cy - 2.2]], 0.8), C.whiteDeep)));
  s.push(matte(T(tube([[-0.6, cy - 2.85], [px + 4.4, cy - 2.85]], 0.9), C.white)));
  s.push(matte(T([[px + 7.4, cy - 2.85], [px + 5.6, cy - 4.1], [px + 4.2, cy - 3.7], [px + 4.2, cy - 2], [px + 5.6, cy - 1.6]], C.crystal)), F(T([[px + 7.4, cy - 2.85], [px + 5.6, cy - 4.1], [px + 4.2, cy - 3.7], [px + 4.6, cy - 2.9]], C.crystalLight)), F(T([[px + 7.4, cy - 2.85], [px + 4.6, cy - 2.9], [px + 4.2, cy - 2], [px + 5.6, cy - 1.6]], C.crystalDeep)));
  for (const sd of [-1, 1]) s.push(metal(T([[2.6, cy - 2.85], [-0.4, cy - 2.85 + sd * 2.2], [-1.2, cy - 2.85 + sd * 1.8], [0.2, cy - 2.85]], C.gold)), F(T(tube([[2, cy - 2.85 + sd * 0.4], [-0.4, cy - 2.85 + sd * 1.6]], 0.2), C.goldLight)));
  s.push(...drop(nut[0], nut[1] - 0.8, 0.85));
  // The prod, its spires, the binding round its crystal.
  s.push(metal(T(xbProd(), C.white)), F(T(xbProd(-1, 0.34), C.whiteShade)), metal(T(xbProd(1, 0.24), C.gold)));
  for (const sd of [-1, 1]) {
    const tx = xbProdX(sd);
    const ty = cy + sd * S;
    s.push(...goldBand(tx, ty, 2, 0.8), ...(sd < 0 ? shard(tx, ty - 0.3, 2, 1.1) : shardDown(tx, ty + 0.3, 2, 1.1)));
  }
  s.push(metal(T([[px - 2.2, cy - 2.4], [px + 1.4, cy - 2.4], [px + 1.6, cy + 2.2], [px - 2.2, cy + 2.2]], C.gold)), F(R(px - 2, cy - 2.2, 0.5, 4.2, C.goldLight)));
  for (const y of [cy - 1.7, cy + 1.5]) s.push(F(R(px - 2.2, y, 3.8, 0.2, C.goldDeep)));
  s.push(...shard(px - 0.3, cy + 1.4, 3, 1.6));
  s.push(metal(T(tube(arc(px + 1.4, cy + 0.6, 3.1, 1.9, 90, -90, 12), 0.7), C.gold)));
  return { shapes: s, blade: [-7, 4], reach: [], a: { tip: [px + 7.4, cy - 2.85], head: [px, cy], gem: c.heart, crest: c.heart, blade: [-7, 4], parts: { wing: wingPart([-3.6, cy - 0.8], -1, { z: 'front' }) }, style: 'phoenix', fx: 'regalia' } };
}

// The Regalia by type (the level-50 ones, `${type}_50`).
export const REGALIA_DESIGNS = { sword, axe, spear, staff, dagger, bow, crossbow };
