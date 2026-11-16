// The Island Journey armour, Lv 50: the Regalia, the Mochi Queen's own (docs/design/island-journey-
// gear.md), the legendary tier, in the Regalia weapons' palette: Hayate's cloud-white and sleepy
// periwinkle, the icy crystal of her crown, the gold of her sprout, and white feathered wings.
// Each job wears its class's light (the Regalia weapons' `a.style`) in its gems and lining:
// storm blue for the Thunderguard, tide aqua for the Tide Mage, moon violet for the Moon Moth,
// dawn gold for the Sunfeather.
//
//   Thunderguard (warrior)  a white winged helm under a crown of crystal spires, her crest at the
//                           brow; a white breastplate with her crest; pauldrons fanned with
//                           feathers; a white cape lined in periwinkle with folded wings behind it
//                           and a mantle of white feathers over the shoulders
//   Tide Mage (mage)        her crystal crown with her crest; a white gown with
//                           periwinkle panels and a standing collar of feathers; a train with a
//                           cloud hem and folded wings
//   Moon Moth (thief)       a winged tiara of crystal; a periwinkle jacket, a violet sash; a skirt
//                           of white feathers; a feather mantle
//   Sunfeather (archer)     a white cap with a crown band, a tall wing rising behind and a sunburst
//                           badge; a white tunic with a sunburst round her crest; a capelet
//                           fringed with white and gold feathers
//
// The same functions and frame as the Sprout sets (render/jobgear/ladder-sprout.js, whose helpers
// this shares); its own colours, so `t` and `p` are unused.

import { R, E, T, F } from '../pixel.js';
import { torsoPts, band, side, MID, limb, FIGURE } from '../figure.js';
import { REGALIA as C, REGAL_PIECES } from '../weapon-regalia.js';
import { tube, curve, arc, matte as M, metal, gemmy } from '../weapon-ladder-kit.js';
import { line, forearm, dome, featherDown } from './ladder-sprout.js';

const { shard, drop, sproutCrest, crest, feather, wing, crownSpires, crownBand, engraved } = REGAL_PIECES;

// ---------- Palette ----------

const WHITE = C.white;
const SHADE = C.whiteShade;
const DEEP = C.whiteDeep;
const PERI = C.peri;
const PERI_L = C.periLight;
const PERI_D = C.periDark;
// Each class's light (render/weapon-fx.js REGALIA_LIGHT): its gem, its glow, its lining.
const LIGHT = {
  warrior: { gem: '#8fc6ff', deep: '#5ea6ff', pale: '#e6f2ff' },
  mage: { gem: '#6fe3d8', deep: '#2fc9c0', pale: '#e2fffb' },
  thief: { gem: '#c3adff', deep: '#9474ff', pale: '#f1ebff' },
  archer: { gem: '#ffd25a', deep: '#ffbf34', pale: '#fff6d6' },
};

// ---------- Small helpers ----------

// A cut gem in a class's light at (x, y), `r` across: faceted, lit on its upper left.
function classGem(L, x, y, r) {
  return [gemmy(T([[x, y - r], [x + r * 0.8, y - r * 0.2], [x + r * 0.55, y + r * 0.8], [x - r * 0.55, y + r * 0.8], [x - r * 0.8, y - r * 0.2]], L.gem)), F(T([[x, y - r], [x - r * 0.8, y - r * 0.2], [x - r * 0.2, y + r * 0.1]], L.pale)), F(T([[x + r * 0.2, y + r * 0.2], [x + r * 0.8, y - r * 0.2], [x + r * 0.55, y + r * 0.8]], L.deep))];
}
// A white plate rimmed in gold: its gold edge, its face, a cool shade on its far side, a light.
function whitePlate(pts, light, shade) {
  return [metal(T(pts.map(([x, y]) => [x, y + 0.5]), C.goldDark)), metal(T(pts.map(([x, y]) => [x, y + 0.25]), C.gold)), metal(T(pts, WHITE)), F(T(shade, SHADE)), F(T(light, C.glint))];
}
// A sunburst in gold round (x, y): `n` rays from r0 out to r1, every other one shorter.
function sunburst(x, y, r0, r1, n = 12, w = 0.7) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = i % 2 ? r0 + (r1 - r0) * 0.6 : r1;
    const [ux, uy] = [Math.cos(a), Math.sin(a)];
    out.push(metal(T([[x + ux * r0 - uy * w * 0.5, y + uy * r0 + ux * w * 0.5], [x + ux * r, y + uy * r], [x + ux * r0 + uy * w * 0.5, y + uy * r0 - ux * w * 0.5]], i % 2 ? C.goldDark : C.gold)));
  }
  return out;
}
// A row of white feathers hanging point down along points (each `len` long), lit in turn.
const featherRow = (pts, len, w, ang = 180) => pts.flatMap(([x, y], i) => feather([x, y], ang + (x - 15.5) * 1.6 + (i % 2 ? 4 : -4), len, w));
// A row of points from x0 to x1 at y, `n` of them, sagging in the middle by `sag`.
const row = (x0, x1, y, n, sag = 0) => Array.from({ length: n }, (_, i) => [x0 + ((x1 - x0) * i) / (n - 1), y + Math.sin((Math.PI * i) / (n - 1)) * sag]);
// Shapes turned `deg` degrees (clockwise on screen) about (cx, cy): a wing swept up from its root.
function turn(shapes, cx, cy, deg) {
  const r = (deg * Math.PI) / 180;
  const [c, s] = [Math.cos(r), Math.sin(r)];
  const at = ([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
  return shapes.map((q) => {
    if (q.t === 'e') {
      const [x, y] = at([q.x, q.y]);
      return { ...q, x, y };
    }
    if (q.t === 'r') return { ...q, t: 'p', x: 0, y: 0, pts: [[q.x, q.y], [q.x + q.w, q.y], [q.x + q.w, q.y + q.h], [q.x, q.y + q.h]].map(at) };
    return { ...q, x: 0, y: 0, pts: q.pts.map(([x, y]) => at([x + q.x, y + q.y])) };
  });
}
// A white wing at (x, y) on side `sd`, `len` across, swept up by `up` degrees.
const sweptWing = (x, y, sd, len, up, opts) => turn(wing(x, y, sd, len, opts), x, y, -sd * up);
// The crystal crown's spires and band at (x, y), `w` across with `n` spires, the middle `h` tall.
const crownAt = (x, y, w, n, h) => [...crownSpires(x, y, w, n, h), ...crownBand(x, y, w, n)];

// ---------- Thunderguard: the Regalia Guard ----------

const W = LIGHT.warrior;

const warrior = {
  // A white helm winged at either side, gold wind curls engraved on it, crystal spires standing
  // from its gold brow band like her crown, her crest at the brow.
  hat() {
    const out = [...sweptWing(5.4, 8.6, -1, 7.6, 40, { n: 5, w: 1.5 }), ...sweptWing(25.6, 8.6, 1, 7.6, 40, { n: 5, w: 1.5 })];
    out.push(metal(dome(15.5, 10.6, 10.6, 8.2, WHITE)), F(T([[18.2, 9.4], [22.8, 5.2], [25.6, 8.4], [25.8, 9.4]], SHADE)), F(T([[7.6, 6.6], [10.6, 3.6], [13.8, 2.8], [11.2, 4.6], [8.8, 7.6]], C.glint)));
    out.push(...engraved([10.4, 6.6], 70, 4.4, -1), ...engraved([20.6, 6.6], -70, 4.4, 1));
    out.push(...crownSpires(15.5, 9.4, 15, 5, 5.6), ...crownBand(15.5, 9.8, 20, 7));
    out.push(...crest(15.5, 10.6, 1.25), ...classGem(W, 15.5, 12.9, 0.55));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A periwinkle surcoat under a white breastplate rimmed in gold, gold wind curls on it and her
  // crest at its heart with a crystal in the storm's light below; a gold gorget; a gold belt.
  top() {
    const torso = torsoPts();
    const out = [T(torso, PERI), F(T([[10, 27.6], [11.6, 27], [10.8, 30.4], [9.9, 31]], PERI_L))];
    const pl = [[MID - 4.8, 27.2], [MID + 4.8, 27.2], [MID + 5.4, 29.8], [MID + 4.8, 32.4], [MID + 2.6, 33.8], [MID, 34.2], [MID - 2.6, 33.8], [MID - 4.8, 32.4], [MID - 5.4, 29.8]];
    out.push(...whitePlate(pl, [[MID - 4.4, 27.6], [MID - 1.4, 27.6], [MID - 2, 28.2], [MID - 4.8, 29.2]], [[MID + 2.6, 33.8], [MID + 4.8, 32.4], [MID + 5.4, 29.8], [MID + 4.4, 30.4], [MID + 2.4, 32.8]]));
    out.push(...engraved([MID - 2.4, 32.6], -30, 3.4, -1), ...engraved([MID + 2.4, 32.6], 30, 3.4, 1));
    out.push(...crest(MID, 29.8, 1.65), ...classGem(W, MID, 32.8, 0.65));
    out.push(metal(T([[11, 25.4], [20.2, 25.4], [21.4, 27.4], [15.6, 28.4], [9.8, 27.4]], C.gold)), F(T([[11.4, 25.6], [19.8, 25.6], [20.2, 26.3], [11, 26.3]], C.goldLight)));
    out.push(metal(band(torso, 33.8, 35.3, C.gold)), F(band(torso, 33.85, 34.3, C.goldLight)), ...classGem(W, MID, 34.5, 0.7));
    return out;
  },
  sleeve: () => PERI,
  longSleeves: () => true,
  // A white pauldron rimmed in gold, three white feathers fanned up behind it, a crystal on it.
  shoulder(t, p, s) {
    const k = 0.72;
    const pp = (x, y) => [x * k * s, y * k];
    const P = (list, c) => T(list.map(([x, y]) => pp(x, y)), c);
    const cap = [[-2.4, -1.8], [1, -3.4], [5, -3.2], [8.6, -1.2], [10, 1.6], [9.4, 3.4], [6, 2.8], [2, 2.6], [-2.4, 2]];
    const out = [];
    for (const a of [12, 38, 64]) out.push(...feather(pp(4.4, -1.6), a * s, 4.4, 1.3));
    out.push(P([[-2, 1.6], [4, 2], [9.6, 3], [9.8, 5.2], [5, 4.8], [-2, 4.4]], PERI_D), metal(P(cap.map(([x, y]) => [x, y + 0.9]), C.gold)), metal(P(cap, WHITE)));
    out.push(F(P([[0, -2.4], [5, -2.6], [8, -0.8], [5, -1.4], [0, -1.4]], C.glint)), F(P([[6, 2.8], [9.4, 3.4], [10, 1.6], [8, 1.6]], SHADE)), ...classGem(W, ...pp(4.4, 0.2), 0.75));
    return out;
  },
  legs: () => ({ top: PERI_D, low: PERI_D, pad: WHITE }),
  // White tassets rimmed in gold, a periwinkle flap down the front with her gold sprout on it.
  skirt() {
    const out = [T([[9.4, 34.4], [21.6, 34.4], [22.3, 39.6], [8.7, 39.6]], PERI_D)];
    for (const x of [11.2, 20]) out.push(...whitePlate([[x - 2.2, 34.6], [x + 2.2, 34.6], [x + 2.4, 39.4], [x, 40.4], [x - 2.4, 39.4]], [[x - 1.9, 34.9], [x + 1.4, 34.9], [x + 1.2, 35.5], [x - 2, 35.7]], [[x, 40.4], [x + 2.4, 39.4], [x + 2.2, 36], [x + 1, 38.8]]));
    const flap = [[MID - 1.9, 34.6], [MID + 1.9, 34.6], [MID + 2.1, 41.4], [MID, 42.6], [MID - 2.1, 41.4]];
    out.push(T(flap, PERI), line([flap[2], flap[3], flap[4]], 0.5, C.gold), ...sproutCrest(MID, 40.6, 0.55, 64, 1.7));
    return out;
  },
  // White sabatons on gold-cuffed boots, a little white wing at each heel.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      k.poly([[-2, -3.2], [-5.6, -5.8], [-4.8, -3.8], [-6, -2.6], [-4.6, -1.8], [-5, -0.6], [-2, -0.6]], c(C.feather)), F(k.poly([[-2.2, -2.6], [-5, -4.6], [-4.2, -2.8], [-2.4, -2]], c(C.featherShade))),
      M(k.shaft(4.6, c(PERI_D), 3.1)), metal(k.sole(c(WHITE))), metal(k.poly([[-2.8, 2.1], [2.8, 2.1], [2.5, 3], [-2.5, 3]], c(C.gold))),
      F(k.poly([[-1.6, 0.2], [0.6, 0.2], [0.2, 0.8], [-1.8, 0.8]], c(C.glint))),
      metal(k.poly([[-2.4, -5.6], [2.4, -5.6], [2.6, -4.2], [-2.6, -4.2]], c(C.gold))), k.dot(0, -4.9, 0.5, c(W.gem)),
    ];
  },
  // A white gauntlet bracer banded in gold, a crystal in the storm's light on it.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    return [
      metal(limb(...at(1.1), ...at(4.3), 4.1, 4.8, WHITE)), F(limb(...at(1.3, 1.1), ...at(4.1, 1.3), 0.8, 0.8, SHADE)),
      metal(limb(...at(1.1), ...at(1.5), 4.2, 4.3, C.gold)), metal(limb(...at(3.9), ...at(4.3), 4.7, 4.8, C.gold)),
      ...classGem(W, ...at(2.7), 0.7),
      metal(E(hx, hy, 2.2, 2.2, WHITE)), F(E(hx + 0.5, hy + 0.5, 1, 0.8, SHADE)),
    ];
  },
  // A white cape lined in periwinkle and hemmed in gold, her gold sprout large on it, two white
  // wings folded behind it, their tips showing over her shoulders and at her sides.
  cape() {
    const out = [...wing(9.6, 28.4, -1, 9, { n: 5, w: 1.7 }), ...wing(21.4, 28.4, 1, 9, { n: 5, w: 1.7 })];
    out.push(T([[8.4, 25.6], [22.6, 25.6], [26, 36], [27.6, 44.6], [15.5, 46], [3.4, 44.6], [5, 36]], PERI));
    const body = [[8.4, 25.6], [22.6, 25.6], [25.6, 36], [27, 43.6], [15.5, 45], [4, 43.6], [5.4, 36]];
    out.push(T(body, WHITE), F(T([[20, 30], [25.6, 36], [27, 43.6], [21, 44.4], [22.6, 36.4]], SHADE)), metal(T(tube([[4, 43.6], [15.5, 45], [27, 43.6]], 0.9), C.gold)));
    out.push(...sproutCrest(15.5, 42.4, 1.3, 64, 1.8), ...engraved([6.4, 41.6], 20, 4.4, 1), ...engraved([24.6, 41.6], -20, 4.4, -1));
    return out;
  },
  // A mantle of small white feathers over the shoulders and a crystal clasp on a gold chain.
  capeFront() {
    const out = [...featherRow(row(10, 21.2, 25.2, 7, 0.6), 2.8, 1.25)];
    for (const [x, y] of curve([11, 27.4], [MID, 29.6], [20.2, 27.4], 8)) out.push(metal(E(x, y, 0.42, 0.34, C.gold)));
    out.push(...drop(MID, 28, 0.85));
    return out;
  },
};

// ---------- Tide Mage: the Regalia Gown ----------

const G = LIGHT.mage;
// The gown's outline: the figure to the waist, then flaring a little to the knees, swinging.
const robe = (len, flare, sw) => [...FIGURE.front.slice(0, -1), [21.8, 37], [22.4 + flare + sw, len], [15.5 + sw, len + 0.8], [8.6 - flare + sw, len], [9.4, 37], ...FIGURE.back.slice(1)];

const mage = {
  // Her crystal crown: spires of crystal on a gold band set with crystal beads, her crest on its
  // front and a drop of crystal in the tide's light.
  hat() {
    const out = [];
    out.push(...crownAt(15.5, 6.8, 13, 5, 7.2), ...crest(15.5, 7.2, 1.05), ...classGem(G, 15.5, 9.2, 0.5));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A white gown to the knees with periwinkle panels down its sides edged in gold, a sash in the
  // tide's light, her crest at the breast, and a tall collar of white feathers standing behind her
  // neck.
  top(t, p, m) {
    const sw = (m?.sway ?? 0) * 0.4;
    const len = 44.6;
    const body = robe(len, 1.6, sw);
    const out = [];
    for (const a of [-58, -34, -12, 12, 34, 58]) out.push(...feather([15.5 + a * 0.09, 26.4], a, 5.6, 1.5));
    out.push(T(body, WHITE), F(T([[MID + 2.6, 36], [MID + 4.6 + sw, len], [MID + 2.8 + sw, len + 0.4], [MID + 1.4, 36]], SHADE)));
    out.push(M(side(body, MID - 3.4, -1, PERI)), M(side(body, MID + 3.6, 1, PERI)), line([[MID - 3.4, 27], [MID - 3.4 + sw * 0.5, len]], 0.5, C.gold), line([[MID + 3.6, 27], [MID + 3.6 + sw * 0.5, len]], 0.5, C.gold));
    out.push(...engraved([MID - 0.6 + sw, 42.4], -10, 4.6, -1), ...engraved([MID + 0.6 + sw, 42.4], 10, 4.6, 1));
    out.push(metal(band(body, len - 1, len + 0.6, C.gold)));
    out.push(M(band(body, 33.2, 34.8, G.deep)), F(band(body, 33.25, 33.7, G.gem)), ...classGem(G, 19.2, 34, 0.8));
    out.push(...crest(MID, 29.6, 1.5));
    return out;
  },
  sleeve: () => WHITE,
  longSleeves: () => true,
  // White feathers falling over the shoulder from a gold clasp.
  shoulder(t, p, s) {
    const out = [];
    for (const a of [150, 120, 90]) out.push(...feather([0, -0.6], a * s, 3.6, 1.25));
    out.push(metal(E(0, -0.4, 0.9, 0.8, C.gold)));
    return out;
  },
  legs: () => ({ top: PERI_D, low: PERI_D, pad: null }),
  // A periwinkle underskirt below the gown, hemmed in gold, crystal drops in the tide's light
  // along it.
  skirt() {
    const out = [T([[10, 34.2], [21.2, 34.2], [22.6, 41], [23.6, 46], [15.5, 46.8], [7.4, 46], [8.6, 41]], PERI), R(10, 34.2, 11.2, 1.4, PERI_D)];
    out.push(metal(T([[7.5, 45.2], [15.5, 46], [23.5, 45.2], [23.6, 46], [15.5, 46.8], [7.4, 46]], C.gold)));
    for (const x of [9.6, 13.2, 17.8, 21.4]) out.push(...classGem(G, x, 46.6, 0.5));
    return out;
  },
  // White slippers, a gold sprout leaf on each toe.
  shoe(t, p, k) {
    const c = k.tint;
    return [k.shaft(1.1, c(PERI_L), 3.1), metal(k.sole(c(WHITE))), metal(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.gold))), metal(k.poly([[0, 1.2], [-1.6, 0], [-1.2, -1], [0, -0.4], [1.2, -1], [1.6, 0]], c(C.sprout)))];
  },
  // White gloves with gold cuffs and a crystal in the tide's light.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    return [limb(...at(0.8), ...at(2.8), 3.7, 3.6, WHITE), metal(limb(...at(2.4), ...at(2.9), 4, 4.1, C.gold)), ...classGem(G, ...at(2.65), 0.55), E(hx, hy, 2, 2, WHITE), F(E(hx + 0.4, hy + 0.5, 1, 0.7, SHADE))];
  },
  // A long white train lined in periwinkle, its hem rolling like clouds and edged in gold, her
  // sprout on it, two white wings folded behind.
  cape() {
    const out = [...wing(10, 28, -1, 7.4, { n: 5, w: 1.5 }), ...wing(21, 28, 1, 7.4, { n: 5, w: 1.5 })];
    const hem = [];
    for (let i = 0; i <= 30; i++) {
      const u = i / 30;
      hem.push([26.4 - u * 21.8, 45.2 + Math.sin(Math.PI * u) * 1.2 + Math.abs(Math.sin(u * Math.PI * 5)) * 1.2]);
    }
    out.push(T([[8.6, 25.8], [22.4, 25.8], [25.4, 35], ...hem.map(([x, y]) => [x + (x > 15.5 ? 0.5 : -0.5), y + 0.8]), [5.6, 35]], PERI));
    out.push(T([[8.6, 25.8], [22.4, 25.8], [25, 35], ...hem, [6, 35]], WHITE), F(T([[20, 30], [25, 35], [26.4, 45.4], [21, 46], [22.4, 36]], SHADE)), metal(T(tube(hem, 0.6), C.gold)));
    out.push(...sproutCrest(15.5, 43, 1.2, 64, 1.8));
    return out;
  },
  // Gold chains from the shoulders to a crystal clasp.
  capeFront() {
    const out = [];
    for (const pts of [curve([10.4, 26.4], [12, 28.6], [MID - 1.4, 28.4], 5), curve([20.8, 26.4], [19.2, 28.6], [MID + 1.4, 28.4], 5)]) for (const [x, y] of pts) out.push(metal(E(x, y, 0.45, 0.38, C.gold)));
    out.push(...drop(MID, 27.8, 0.8));
    return out;
  },
};

// ---------- Moon Moth: the Regalia Wraps ----------

const V = LIGHT.thief;

const thief = {
  // A winged tiara: a fine gold band with three spires of crystal at its front, white wings at
  // her temples, a gem in the moon's light hanging on her brow.
  hat() {
    const out = [...sweptWing(6, 9.6, -1, 5, 24, { n: 4, w: 1.25 }), ...sweptWing(25, 9.6, 1, 5, 24, { n: 4, w: 1.25 })];
    const brow = [[5.2, 10.2], [8, 7.6], [12, 6.2], [15.5, 5.9], [19, 6.2], [23, 7.6], [25.8, 10.2]];
    out.push(...crownSpires(15.5, 6.4, 6, 3, 4.2), metal(T(tube(brow, 1.1), C.gold)), F(T(tube(brow.map(([x, y]) => [x, y - 0.3]), 0.35), C.goldLight)));
    out.push(line([[15.5, 6.4], [15.5, 7.2]], 0.26, C.goldDark), ...classGem(V, 15.5, 8, 0.75));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A white blouse under a short periwinkle jacket edged in gold with gold buttons and her crest
  // on its side, a sash in the moon's light knotted at the hip.
  top(t, p, m) {
    const sw = (m?.sway ?? 0) * 0.3;
    const torso = torsoPts();
    const out = [T(torso, WHITE), F(T([[MID - 1.8, 28], [MID + 1.6, 28], [MID + 1, 33], [MID - 1.2, 33]], SHADE))];
    out.push(M(side(torso, MID - 2, -1, PERI)), M(side(torso, MID + 2.6, 1, PERI)), line([[MID - 2, 26.6], [MID - 2.4, 33.6]], 0.5, C.gold), line([[MID + 2.6, 26.6], [MID + 2.8, 33.6]], 0.5, C.gold), F(T([[10.2, 27.6], [12, 27], [11.2, 30.6], [10, 31.4]], PERI_L)));
    for (const y of [28.6, 30.6]) out.push(metal(E(MID + 3.5, y, 0.4, 0.4, C.gold)));
    out.push(...crest(11.8, 29.6, 1));
    out.push(M(band(torso, 33.4, 35.2, V.deep)), F(band(torso, 33.45, 33.9, V.gem)));
    out.push(M(T(tube(curve([19.6, 35], [19.6 + sw * 0.4, 37], [19 + sw, 39.4], 5), 1.1, 0.8), V.deep)), M(T(tube(curve([20.4, 35], [21.2 + sw * 0.4, 36.8], [21.6 + sw, 38.8], 5), 1, 0.7), V.gem)), M(E(20, 34.4, 1.1, 1, V.deep)));
    return out;
  },
  sleeve: () => WHITE,
  longSleeves: () => false,
  shoulder: () => [],
  legs: () => ({ top: PERI_D, low: PERI_D, pad: null, cuff: C.gold }),
  // A short skirt of white feathers, layered.
  skirt() {
    return [T([[9.6, 34.4], [21.4, 34.4], [22, 37.4], [9, 37.4]], PERI_D), ...featherRow(row(9.8, 21.2, 34.6, 6, 0.4), 5, 1.55), ...featherRow(row(11, 20, 35.2, 4, 0.3), 4.2, 1.4)];
  },
  // White boots with a gold cuff and a little white wing at each heel.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      k.poly([[-2, -3.2], [-5.4, -5.6], [-4.6, -3.7], [-5.8, -2.6], [-4.4, -1.8], [-4.8, -0.6], [-2, -0.6]], c(C.feather)), F(k.poly([[-2.2, -2.6], [-4.8, -4.4], [-4, -2.8], [-2.4, -2]], c(C.featherShade))),
      M(k.shaft(3.8, c(WHITE), 3)), M(k.sole(c(WHITE))), metal(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.gold))),
      metal(k.poly([[-2.4, -5.2], [2.4, -5.2], [2.5, -4], [-2.5, -4]], c(C.gold))), F(k.poly([[0.6, -3.6], [1.8, -3.6], [1.8, 0.6], [0.8, 0.6]], c(SHADE))),
    ];
  },
  // White gloves with a gold cuff and a gem in the moon's light.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    return [limb(...at(0.6), ...at(2.4), 3.4, 3.6, WHITE), metal(limb(...at(2), ...at(2.6), 3.9, 4, C.gold)), ...classGem(V, ...at(2.3), 0.5), E(hx, hy, 2, 2, WHITE), F(E(hx + 0.4, hy + 0.5, 1, 0.7, SHADE))];
  },
  // A short mantle of white feathers lined in the moon's light.
  cape() {
    const out = [T([[9, 25.8], [22, 25.8], [24.6, 33], [24.8, 37], [15.5, 38], [6.2, 37], [6.4, 33]], V.deep)];
    out.push(...featherRow(row(7, 24, 31.4, 7, 1.2), 6.2, 1.9), ...featherRow(row(9, 22, 27.6, 6, 0.8), 5, 1.7));
    return out;
  },
  // A crystal clasp at the throat on a ribbon in the moon's light.
  capeFront() {
    return [line([[10.4, 26.2], [MID - 1, 27.4]], 0.7, V.deep), line([[20.8, 26.2], [MID + 1, 27.4]], 0.7, V.deep), ...drop(MID, 27.2, 0.85)];
  },
};

// ---------- Sunfeather: the Regalia Ranger ----------

const A = LIGHT.archer;

const archer = {
  // A soft white cap with a gold crown band set with crystals, a tall white wing rising from its
  // far side, and a gold sunburst round her crest at its front.
  hat() {
    const out = [...sweptWing(6.6, 7.6, -1, 8.4, 52, { n: 5, w: 1.6 })];
    out.push(M(T([[4.6, 9.8], [4, 6.6], [6.6, 3.6], [11.6, 1.8], [18, 1.4], [24, 2.8], [27.2, 5.4], [26.8, 8.6], [24.6, 9.8]], WHITE)), F(T([[18, 7], [24, 4], [26.6, 6.6], [26.2, 8.6]], SHADE)), F(T([[6, 6], [8.6, 3.6], [13.2, 2.4], [9.6, 4.4], [7, 7.4]], C.glint)));
    out.push(...crownBand(15.5, 9.4, 20, 7), ...sunburst(15.5, 8.4, 1.6, 3.2), ...crest(15.5, 8.4, 1.1));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A white tunic with periwinkle panels edged in gold, a gold sunburst round her crest at the
  // breast, a gold baldric with a gem in the dawn's light.
  top() {
    const torso = torsoPts();
    const out = [T(torso, WHITE), F(T([[19.6, 27.6], [21, 28], [21.2, 31], [20, 31.4]], SHADE))];
    out.push(M(side(torso, MID - 3.4, -1, PERI)), M(side(torso, MID + 3.6, 1, PERI)), line([[MID - 3.4, 26.6], [MID - 3.6, 33.6]], 0.45, C.gold), line([[MID + 3.6, 26.6], [MID + 3.8, 33.6]], 0.45, C.gold));
    out.push(...sunburst(MID, 30, 1.8, 3.4), ...crest(MID, 30, 1.2));
    out.push(metal(T(tube([[20.6, 26.4], [15.6, 30.4], [10.6, 34.6]], 1.3), C.gold)), F(T(tube([[20.4, 26.5], [15.4, 30.5], [10.6, 34.4]], 0.35), C.goldLight)), ...classGem(A, 12.4, 33.2, 0.7));
    out.push(metal(band(torso, 33.6, 35.2, C.gold)), F(band(torso, 33.65, 34.1, C.goldLight)));
    return out;
  },
  sleeve: () => WHITE,
  longSleeves: () => true,
  // A gold shoulder cap with white feathers falling from it.
  shoulder(t, p, s) {
    const out = [];
    for (const a of [140, 112]) out.push(...feather([0.4 * s, 0.4], a * s, 3.6, 1.2));
    out.push(metal(E(0, 0.2, 2.4, 2, C.gold)), F(E(-0.4 * s, -0.4, 1, 0.6, C.goldLight)), ...classGem(A, 0.3 * s, 0.4, 0.55));
    return out;
  },
  legs: () => ({ top: PERI, low: PERI, pad: null }),
  // Periwinkle tabs edged in gold.
  skirt() {
    const out = [];
    for (let i = 0; i < 5; i++) {
      const x = 10.4 + i * 2.6;
      out.push(T([[x - 1.4, 34.4], [x + 1.4, 34.4], [x + 1.5, 38.6], [x, 39.4], [x - 1.5, 38.6]], i % 2 ? PERI_D : PERI), line([[x + 1.5, 38.6], [x, 39.4], [x - 1.5, 38.6]], 0.4, C.gold));
    }
    return out;
  },
  // Tall white boots with gold cuffs and a little white wing at each heel.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      k.poly([[-2, -4.6], [-5.4, -7], [-4.6, -5.1], [-5.8, -4], [-4.4, -3.2], [-4.8, -2], [-2, -2]], c(C.feather)), F(k.poly([[-2.2, -4], [-4.8, -5.8], [-4, -4.2], [-2.4, -3.4]], c(C.featherShade))),
      M(k.shaft(5.8, c(WHITE), 3.1)), M(k.sole(c(WHITE))), metal(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.gold))),
      metal(k.poly([[-2.6, -7.2], [2.6, -7.2], [2.4, -5.6], [-2.4, -5.6]], c(C.gold))), F(k.poly([[-2.2, -7], [2.2, -7], [2.2, -6.6], [-2.2, -6.6]], c(C.goldLight))),
      F(k.poly([[0.6, -5.2], [1.8, -5.2], [1.8, 0.6], [0.8, 0.6]], c(SHADE))),
    ];
  },
  // A white arm guard edged in gold with a gem in the dawn's light, over a white glove.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    return [
      metal(limb(...at(1.1), ...at(4.4), 4.2, 4.9, C.gold)), metal(limb(...at(1.3), ...at(4.2), 3.5, 4.1, WHITE)), F(limb(...at(1.5, 1), ...at(4, 1.2), 0.7, 0.7, SHADE)),
      ...classGem(A, ...at(2.8), 0.65),
      E(hx, hy, 2.1, 2.1, WHITE), F(E(hx + 0.4, hy + 0.5, 1, 0.7, SHADE)),
    ];
  },
  // A short white capelet behind, fringed with white and gold-tipped feathers.
  cape() {
    const out = [];
    for (let i = 0; i < 7; i++) out.push(...featherDown(6.2 + i * 3.1, 32.6 + Math.sin((Math.PI * i) / 6) * 0.8, 4.8, 1.35, i % 2 ? C.feather : A.gem, C.featherDeep));
    out.push(T([[8.6, 25.6], [22.4, 25.6], [25, 31], [25.4, 34.2], [15.5, 35], [5.6, 34.2], [6, 31]], WHITE), F(T([[20, 28], [25, 31], [25.4, 34.2], [21, 34.6]], SHADE)), metal(T([[5.8, 33.4], [25.2, 33.4], [25.4, 34.2], [15.5, 35], [5.6, 34.2]], C.gold)));
    return out;
  },
  // The capelet over her shoulders, feathers under its hem, a gold sunburst clasp.
  capeFront() {
    const shape = [[8.6, 25.6], [22.4, 25.6], [23.2, 29], [21, 30.2], [MID + 2, 30.4], [MID, 31], [MID - 2, 30.4], [10.2, 30.2], [8, 29]];
    const out = [];
    for (const [x, y] of [[10.6, 29.6], [13.4, 30.2], [17.8, 30.2], [20.6, 29.6]]) out.push(...featherDown(x, y, 2.8, 0.95, x > MID ? A.gem : C.feather, C.featherDeep));
    out.push(T(shape, WHITE), metal(band(shape, 29.4, 30.4, C.gold)), F(T([[9.2, 25.8], [21.8, 25.8], [22.2, 26.8], [8.8, 26.8]], C.glint)), ...sunburst(MID, 28, 0.9, 2), ...classGem(A, MID, 28, 0.75));
    return out;
  },
};

export default { warrior, mage, thief, archer };
