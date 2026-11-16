// The Island Journey armour, Lv 10: the Rootwood sets (docs/design/island-journey-gear.md), from
// the roots of Rootwood Hollow, in the Rootwood weapons' palette: dark heartwood with its grain,
// pale roots winding round and curling out, cushions of moss, amber (the hollow's sap hardened to
// a glow), acorn caps, oak leaves, a little red mushroom. Each job in its own cut:
//
//   Thunderguard (warrior)  an acorn-cap helm with an amber at the brow; a heartwood breastplate
//                           bound with roots round a great amber, over a forest-green tunic; bark
//                           pauldrons cushioned with moss (a mushroom on one); bark tassets with
//                           amber drops; a moss cloak hemmed with oak leaves
//   Tide Mage (mage)        a toadstool hat; a cream robe with a heartwood panel a root climbs,
//                           a moss collar, an amber brooch, acorn charms on a root belt; an
//                           oak-leaf mantle; acorn slippers
//   Moon Moth (thief)       a circlet of twisted roots with oak leaves at the temples like little
//                           wings and an amber drop on the brow; a bark vest over a moss shirt, a
//                           root strap, an acorn pouch; root-wound wraps; a ragged moss cloak
//   Sunfeather (archer)     a wide-brimmed bark ranger's hat with a moss band and a russet
//                           feather tipped in amber; a moss tunic with a heartwood chest guard and
//                           a root baldric; bark arm guards; tall boots; a hooded moss cloak
//
// The same functions and frame as the Sprout sets (render/jobgear/ladder-sprout.js, whose helpers
// this shares); its own colours, so `t` and `p` are unused.

import { R, E, T, F } from '../pixel.js';
import { torsoPts, band, side, MID, limb, FIGURE } from '../figure.js';
import { ROOTWOOD as C, root, moss, amberDrop, amberOrb, acorn, mushroom } from '../weapon-rootwood.js';
import { leaf, tube, curve, arc, matte as M, gemmy } from '../weapon-ladder-kit.js';
import { line, forearm, leafHem, dome, feather } from './ladder-sprout.js';

// ---------- Palette ----------

const FOREST = '#6f9f47';
const FOREST_L = '#9cc76a';
const FOREST_D = '#4f7a35';
const CREAM = C.mushStem;
const CREAM_D = '#e4cfae';
const BROWN = '#86603f';
const BROWN_D = '#664629';
const MUSH_D = '#c8443e';
const MUSH_L = '#ff8f84';
const GILL = '#e6cfaa';
const RUSSET = '#c47a43';
const RUSSET_D = '#8c5130';
const OAK = { leaf: C.oak, light: C.oakLight, dark: C.oakDark };

// ---------- Small helpers ----------

const oakLeaf = (x, y, a, len, w, o = {}) => leaf(x, y, a, len, w, OAK, { lobed: true, ...o });
// Heartwood grain: a thin dark line wandering along (x0, y0) to (x1, y1).
const grain = (x0, y0, x1, y1, bow = 0.4) => line(curve([x0, y0], [(x0 + x1) / 2 + bow, (y0 + y1) / 2], [x1, y1], 5), 0.3, C.heartDark, 0.2);
// The scales of an acorn cap over a dome (see `dome`) centred (cx, cy), rx by ry: a lattice of
// little diamonds in staggered rows, each lit at its top, filling the dome down to `bottom`.
function capScales(cx, cy, rx, ry, top, bottom, r = 0.95) {
  const out = [];
  const h = r * 0.72;
  const half = (y) => {
    const s = Math.min(1, Math.max(0, (cy - y) / ry)) ** 1.25;
    return Math.sqrt(1 - s * s) ** 0.8 * rx - r * 1.1;
  };
  for (let row = 0, y = top; y <= bottom; row++, y += h) {
    const w = half(y);
    for (let x = cx - Math.floor(w / (r * 2)) * r * 2 + (row % 2) * r; x <= cx + w; x += r * 2) {
      out.push(F(T([[x, y - h], [x + r, y], [x, y + h], [x - r, y]], C.capDark)), F(T([[x, y - h * 0.62], [x + r * 0.5, y - h * 0.12], [x - r * 0.5, y - h * 0.12]], C.capLight)));
    }
  }
  return out;
}
// A heartwood plate: its dark edge, its face, a light along its top and a few lines of grain.
function plate(pts, light, grains) {
  return [M(T(pts.map(([x, y]) => [x, y + 0.5]), C.heartDeep)), M(T(pts, C.heart)), F(T(light, C.heartLight)), ...grains.map((g) => grain(...g))];
}

// ---------- Thunderguard: the Rootwood Guard ----------

const warrior = {
  // An acorn-cap helm: its scaly dome, its stalk on top with an oak leaf, a heartwood rim set
  // with an amber at the brow, moss tufted at the rim, a root curling down at the side.
  hat(t, p, m) {
    const sw = m?.hair ?? 0;
    const out = [M(T(tube(curve([15.5, 3.2], [16 + sw * 0.2, 1.2], [17 + sw * 0.6, -0.6], 5), 1.3, 0.85), C.capDark)), ...oakLeaf(16.8 + sw * 0.6, -0.3, 28 - sw * 6, 3.6, 1.35)];
    out.push(M(dome(15.5, 10.6, 11, 8.4, C.cap)));
    out.push(...capScales(15.5, 10.6, 11, 8.4, 3.6, 8.6));
    out.push(F(T([[7.4, 6.4], [10.4, 3.6], [13.6, 2.6], [11, 4.8], [8.4, 7.8]], C.capLight)));
    out.push(M(T([[4.2, 9.2], [26.8, 9.2], [27.2, 10.6], [26.4, 11.8], [15.5, 12.4], [4.6, 11.8], [3.8, 10.6]], C.heart)));
    out.push(F(T([[4.4, 9.2], [26.6, 9.2], [26.8, 9.8], [4.2, 9.8]], C.heartLight)), F(T([[5, 11.5], [15.5, 12], [26, 11.5], [26.4, 11.8], [15.5, 12.4], [4.6, 11.8]], C.heartDeep)));
    out.push(grain(7, 10.6, 12.4, 10.9, 0.2), grain(18.6, 10.9, 24.4, 10.6, 0.2));
    out.push(...moss(6.4, 9.4, 3.4, 1.4, 1), ...moss(24.6, 9.4, 3.4, 1.4, 2), ...root([[25.8, 11.4], [27.6, 12.4], [27.6, 14.6]], 0.95, 0.4));
    out.push(...amberOrb(15.5, 10.7, 1.2));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A forest-green tunic under a heartwood breastplate; pale roots climb onto it from the
  // shoulders and wind round a great amber, their tails curling below; a moss collar; a root belt
  // with an acorn on it and an oak leaf tucked in.
  top() {
    const torso = torsoPts();
    const out = [T(torso, FOREST), F(T([[10, 27.6], [11.6, 27], [10.8, 30.4], [9.9, 31]], FOREST_L)), F(T([[MID - 2.4, 26.2], [MID + 2.4, 26.2], [MID, 28.8]], CREAM))];
    const pl = [[MID - 4.8, 27.2], [MID - 1.6, 26.6], [MID + 1.6, 26.6], [MID + 4.8, 27.2], [MID + 5.4, 29.8], [MID + 4.8, 32.4], [MID + 2.6, 33.8], [MID, 34.2], [MID - 2.6, 33.8], [MID - 4.8, 32.4], [MID - 5.4, 29.8]];
    out.push(...plate(pl, [[MID - 4.4, 27.6], [MID - 1.4, 27], [MID - 2, 28], [MID - 4.8, 29.4]], [[MID - 3.6, 28.6, MID - 3, 32.6], [MID + 3.8, 28.4, MID + 3.4, 32.4], [MID - 1, 32.2, MID + 1.2, 33.4]]));
    out.push(...root([[MID - 4.8, 27.4], [MID - 3, 28.6], [MID - 1.4, 30]], 1.05, 0.75), ...root([[MID + 4.8, 27.4], [MID + 3, 28.6], [MID + 1.4, 30]], 1.05, 0.75));
    out.push(...root([[MID - 1, 31.6], [MID - 3, 32.6], [MID - 4.2, 31.6]], 0.8, 0.35), ...root([[MID + 1, 31.6], [MID + 3, 32.6], [MID + 4.2, 31.6]], 0.8, 0.35));
    out.push(...amberOrb(MID, 30.6, 1.6));
    out.push(...moss(MID, 26.3, 8, 1.5, 3));
    out.push(M(band(torso, 33.8, 35.3, C.root)), F(band(torso, 33.85, 34.3, C.rootLight)), F(band(torso, 34.9, 35.3, C.rootDark)));
    out.push(...oakLeaf(19.8, 34.4, -62, 3.2, 1.2), ...acorn(MID, 34.1, 0.55));
    return out;
  },
  sleeve: () => FOREST,
  longSleeves: () => true,
  // A bark pauldron over a heartwood lame, a root along its rim, moss cushioned on top, and a
  // little red mushroom growing on the near one.
  shoulder(t, p, s) {
    const k = 0.72;
    const pp = (x, y) => [x * k * s, y * k];
    const P = (list, c) => T(list.map(([x, y]) => pp(x, y)), c);
    const cap = [[-2.4, -1.8], [1, -3.4], [5, -3.2], [8.6, -1.2], [10, 1.6], [9.4, 3.4], [6, 2.8], [2, 2.6], [-2.4, 2]];
    const out = [
      P([[-2, 1.6], [4, 2], [9.6, 3], [9.8, 5.2], [5, 4.8], [-2, 4.4]], C.heartDark),
      M(P(cap.map(([x, y]) => [x, y + 0.9]), C.heartDeep)),
      M(P(cap, C.heart)),
      F(P([[0, -2.4], [5, -2.6], [8, -0.8], [5, -1.4], [0, -1.4]], C.heartLight)),
      F(P(tube([[0.4, 0.4], [4.6, 0.6], [8.8, 2]], 0.4, 0.28), C.heartDark)),
      ...root([pp(-1.8, 2.4), pp(4, 3), pp(9.6, 3.4)], 0.85, 0.5),
      ...moss(...pp(3.4, -2.8), 4.6, 1.7, s > 0 ? 1 : 2),
    ];
    if (s > 0) out.push(...mushroom(...pp(7.6, -1.6), 0.62));
    return out;
  },
  legs: () => ({ top: FOREST_D, low: FOREST_D, pad: C.heart }),
  // Bark tassets: two heartwood plates on each hip, an amber drop at the tips of the inner ones,
  // a great oak leaf down the front, a root along their tops, over a dark green skirt.
  skirt() {
    const out = [T([[9.4, 34.4], [21.6, 34.4], [22.3, 39.6], [8.7, 39.6]], FOREST_D)];
    for (const [x, drop] of [[10.4, 0], [20.7, 0], [12.9, 1], [18.2, 1]]) {
      out.push(...plate([[x - 1.35, 34.4], [x + 1.35, 34.4], [x + 1.45, 39.8], [x, 40.8], [x - 1.45, 39.8]], [[x - 1.1, 34.6], [x - 0.4, 34.6], [x - 0.5, 39.8], [x - 1.15, 39.5]], [[x + 0.4, 35.8, x + 0.3, 39.6]]));
      if (drop) out.push(...amberDrop(x, 41.6, 0.55));
    }
    out.push(...oakLeaf(MID, 34.6, -90, 7, 2.4, { curl: 6 }), ...root([[9.2, 35.2], [15.5, 35.7], [21.8, 35.2]], 0.85, 0.85));
    return out;
  },
  // Heartwood boots wound with roots, an acorn cap over the toe, a moss cuff.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      M(k.shaft(4.6, c(C.heart), 3.1)), M(k.sole(c(C.heart))), M(k.poly([[-2.8, 2.1], [2.8, 2.1], [2.5, 3], [-2.5, 3]], c(C.heartDeep))),
      M(k.poly([[-2.2, -0.4], [2.2, -0.4], [2.8, 0.8], [2.6, 2.1], [-2.6, 2.1], [-2.8, 0.8]], c(C.cap))),
      ...[[-1.4, 0.3], [0, 0.1], [1.4, 0.3], [-0.7, 1.3], [0.7, 1.3]].map(([x, y]) => k.dot(x, y, 0.42, c(C.capDark))),
      F(k.poly([[-2.1, -3.6], [2.1, -2.2], [2.1, -1.6], [-2.1, -3]], c(C.root))), F(k.poly([[-2.1, -2], [2.1, -0.8], [2.1, -0.3], [-2.1, -1.5]], c(C.root))),
      M(k.poly([[-2.4, -5.8], [2.4, -5.8], [2.6, -4.3], [-2.6, -4.3]], c(C.moss))),
      k.dot(-1.2, -5.4, 0.45, c(C.mossLight)), k.dot(0.6, -5.5, 0.4, c(C.mossLight)), k.dot(1.8, -5.1, 0.35, c(C.mossLight)),
    ];
  },
  // A heartwood bracer wound twice with a root and set with an amber stud, over a dark glove.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    const out = [M(limb(...at(1.1), ...at(4.3), 4.1, 4.8, C.heart)), F(limb(...at(1.3, -1), ...at(4.1, -1.2), 0.7, 0.7, C.heartLight))];
    for (const d of [1.5, 3.1]) out.push(F(T([at(d, -2), at(d + 0.4, -2), at(d + 1.1, 2.1), at(d + 0.7, 2.1)], C.root)), F(T([at(d + 0.35, -2), at(d + 0.5, -2), at(d + 1.2, 2.1), at(d + 1.05, 2.1)], C.rootDark)));
    out.push(gemmy(E(...at(2.6, 0.3), 0.7, 0.7, C.amber)), F(E(...at(2.6, 0.1), 0.3, 0.3, C.amberCore)));
    out.push(E(hx, hy, 2.2, 2.2, C.heartDark), F(E(hx - 0.5, hy - 0.6, 0.9, 0.6, C.heart)));
    return out;
  },
  // A moss cloak over a heartwood-brown lining, its hem tufted, oak leaves along it.
  cape() {
    const lining = leafHem(27.8, 3.2, 44, 6, 1.2).pts;
    const { pts, tips } = leafHem(27.4, 3.6, 43.2, 6, 1.4);
    const out = [T([[8.4, 25.6], [22.6, 25.6], [26, 36], ...lining, [5, 36]], BROWN_D), T([[8.4, 25.6], [22.6, 25.6], [25.6, 36], ...pts, [5.4, 36]], FOREST)];
    out.push(F(T([[9, 25.8], [22, 25.8], [23.4, 28.4], [7.6, 28.4]], FOREST_L)));
    for (const [x, y] of [[6.4, 38], [24.6, 37.4], [8.4, 41.4], [22.4, 41], [15.5, 40.4]]) out.push(F(E(x, y, 0.9, 0.6, C.mossLight)), F(E(x + 1.1, y + 0.5, 0.6, 0.4, C.mossLight)));
    tips.forEach(([x, y], i) => i % 2 === 0 && out.push(...oakLeaf(x, y - 1.4, -90 + (x - 15.5) * 1.6, 3.8, 1.45)));
    return out;
  },
  // Moss across the shoulders, a root clasp and an acorn at the throat.
  capeFront() {
    return [...moss(11, 26.2, 4.4, 1.8, 1), ...moss(20.2, 26.2, 4.4, 1.8, 2), ...root([[11.4, 27.2], [MID, 28.4], [19.8, 27.2]], 0.9, 0.9), ...acorn(MID, 27.8, 0.72)];
  },
};

// ---------- Tide Mage: the Rootwood Robe ----------

// The robe's outline: the figure to the waist, then flaring a little to the knees, swinging.
const robe = (len, flare, sw) => [...FIGURE.front.slice(0, -1), [21.8, 37], [22.4 + flare + sw, len], [15.5 + sw, len + 0.8], [8.6 - flare + sw, len], [9.4, 37], ...FIGURE.back.slice(1)];

const mage = {
  // A toadstool hat: a broad red cap spotted cream, its gills showing under the brim, an oak leaf
  // and a moss tuft at its side.
  hat() {
    const out = [];
    out.push(T([[2.6, 10.2], [27, 10.2], [26, 12.2], [15.5, 12.9], [5, 12.2]], GILL));
    for (const x of [6.4, 9.4, 12.4, 15.5, 18.6, 21.6, 24.6]) out.push(line([[x + (x - 15.5) * 0.06, 10.4], [x + (x - 15.5) * 0.1, 12.2]], 0.24, CREAM_D, 0.16));
    const cap = [[1.2, 11], ...arc(15.5, 10.6, 14.2, 10, 180, 0, 20).slice(1, -1), [29.8, 11], [27.8, 10.2], [15.5, 10.8], [3.2, 10.2]];
    out.push(T(cap, C.mush), F(T([[2, 10.6], [3.4, 8.4], [15.5, 9.2], [27.6, 8.4], [29, 10.6], [27.8, 10.2], [15.5, 10.8], [3.2, 10.2]], MUSH_D)), F(E(9.6, 3.4, 3.4, 1.5, MUSH_L)));
    for (const [x, y, r] of [[7.6, 5, 1.5], [15.5, 2, 1.7], [22.8, 4.4, 1.3], [11.6, 7.8, 1], [19.8, 7.6, 1.15], [4.4, 8.4, 0.75], [26.4, 8, 0.85], [16, 5.6, 0.7]]) out.push(F(E(x, y, r, r * 0.82, C.mushDot)));
    out.push(...oakLeaf(25.4, 9.6, -24, 3.6, 1.35), ...moss(24.4, 10.4, 2.6, 1.1, 2));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A cream robe to the knees with a heartwood panel down its front that a pale root climbs,
  // putting out oak leaves; a moss collar with an amber brooch; a root belt hung with two acorn
  // charms; a hem of oak leaves standing up.
  top(t, p, m) {
    const sw = (m?.sway ?? 0) * 0.4;
    const len = 44;
    const body = robe(len, 1.2, sw);
    const out = [T(body, CREAM), T([[MID - 1.4, 28], [MID + 1.4, 28], [MID + 3 + sw, len + 0.4], [MID - 3 + sw, len + 0.4]], C.heart)];
    out.push(F(T([[MID - 1.4, 28], [MID - 0.6, 28], [MID - 2 + sw, len + 0.4], [MID - 3 + sw, len + 0.4]], C.heartLight)));
    out.push(...root([[MID + 0.3, 29.4], [MID - 0.8 + sw * 0.2, 33.6], [MID + 0.9 + sw * 0.5, 38], [MID - 0.2 + sw, 42.6]], 0.75, 0.45));
    out.push(...oakLeaf(MID - 0.6 + sw * 0.3, 36.4, 160, 2.2, 0.85, { light: false }), ...oakLeaf(MID + 0.8 + sw * 0.6, 39.4, 20, 2.2, 0.85, { light: false }));
    out.push(band(body, len - 1.1, len + 0.9, C.oakDark));
    for (const [x, a] of [[10, 102], [12.4, 86], [19, 94], [21.4, 80]]) out.push(...oakLeaf(x + sw, len - 0.3, a, 3, 1.15, { light: false }));
    out.push(M(band(body, 33.2, 34.6, C.root)), F(band(body, 33.25, 33.7, C.rootLight)));
    out.push(line([[18.4, 34.6], [18.5 + sw * 0.5, 36.8]], 0.3, C.rootDark), ...acorn(18.5 + sw * 0.5, 37.2, 0.5), line([[19.8, 34.6], [20.1 + sw * 0.5, 36.2]], 0.3, C.rootDark), ...acorn(20.1 + sw * 0.5, 36.6, 0.45));
    out.push(...moss(MID, 26.5, 9.2, 2, 1), ...amberOrb(MID, 28.4, 0.95));
    return out;
  },
  sleeve: () => CREAM,
  longSleeves: () => true,
  // A moss puff with an oak leaf over it.
  shoulder(t, p, s) {
    return [...oakLeaf(0.6 * s, 1.4, s > 0 ? -38 : 218, 3.2, 1.25), ...moss(0, 0.4, 4.6, 2.2, s > 0 ? 1 : 2)];
  },
  legs: () => ({ top: BROWN, low: BROWN, pad: null }),
  // A heartwood-brown underskirt below the robe, its hem cut in leaf points with oak leaves
  // hanging from every other one.
  skirt() {
    const { pts, tips } = leafHem(23.8, 7.4, 45.6, 5, 1.6);
    const out = [T([[10, 34.2], [21.2, 34.2], [22.4, 41], ...pts, [8.6, 41]], BROWN), R(10, 34.2, 11.2, 1.4, BROWN_D)];
    tips.forEach(([x, y], i) => out.push(i % 2 ? line([[x, y - 2.4], [x, y - 0.4]], 0.3, BROWN_D, 0.16) : null, ...(i % 2 ? [] : oakLeaf(x, y - 1.2, -90, 2.6, 1))));
    return out.filter(Boolean);
  },
  // Acorn slippers: the nut for the toe, its scaly cap over the instep, cream socks.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      k.shaft(1.2, c(CREAM), 3.1), M(k.sole(c(C.nut))), M(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.capDark))),
      F(k.poly([[-1.8, 1], [0, 1], [-0.2, 2], [-1.8, 2]], c(C.nutLight))),
      M(k.poly([[-2.9, -1.3], [2.9, -1.3], [3.1, 0.3], [0, 0.9], [-3.1, 0.3]], c(C.cap))),
      ...[[-1.7, -0.6], [0, -0.7], [1.7, -0.6], [-0.85, 0.2], [0.85, 0.2]].map(([x, y]) => k.dot(x, y, 0.4, c(C.capDark))),
      k.dot(-1.2, -1, 0.35, c(C.capLight)),
    ];
  },
  // Cream mitts with a root wound round the wrist.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    return [M(limb(...at(1.2), ...at(2.7), 4, 3.8, C.root)), F(T([at(1.3, -1.9), at(1.6, -1.9), at(2.3, 1.9), at(2, 1.9)], C.rootDark)), E(hx, hy, 2, 2, CREAM), F(E(hx - 0.5, hy - 0.6, 0.8, 0.6, '#fffaf0'))];
  },
  // An oak-leaf mantle: rows of great oak leaves hanging over a green cape with a lobed hem.
  cape() {
    const { pts } = leafHem(25.6, 5.4, 39.4, 5, 2);
    const out = [T([[8.6, 25.8], [22.4, 25.8], [24.6, 33], ...pts, [6.4, 33]], C.oakDark)];
    for (const [x, y, a] of [[5.8, 33.6, -100], [9.8, 34.4, -94], [21.2, 34.4, -86], [25.2, 33.6, -80], [7.6, 28.6, -104], [23.4, 28.6, -76], [15.5, 35, -90]]) out.push(...oakLeaf(x, y, a, 6, 2.3, { curl: 4 }));
    return out;
  },
  // Roots tied from the shoulders to an acorn clasp.
  capeFront() {
    return [...root([[10.4, 26.2], [12.6, 27.6], [MID - 0.8, 28.8]], 0.9, 0.7), ...root([[20.8, 26.2], [18.6, 27.6], [MID + 0.8, 28.8]], 0.9, 0.7), ...acorn(MID, 28.6, 0.72)];
  },
};

// ---------- Moon Moth: the Rootwood Wraps ----------

// The circlet's line round the brow.
const BROW = [[4.8, 10.6], [8, 7.6], [12, 6.2], [15.5, 5.9], [19, 6.2], [23, 7.6], [26.2, 10.6]];

const thief = {
  // A circlet of two pale roots twisted together round the brow, oak leaves at the temples
  // swept back like little wings (they lift as her head moves), moss at their roots, and an
  // amber drop hanging on her brow.
  hat(t, p, m) {
    const sw = m?.hair ?? 0;
    const out = [...oakLeaf(6.4, 9, 146 + sw * 5, 5, 1.8, { curl: -16 }), ...oakLeaf(6.8, 9.6, 176 + sw * 4, 3.8, 1.4, { curl: -10 })];
    out.push(...oakLeaf(24.6, 9, 34 - sw * 5, 5, 1.8, { curl: 16 }), ...oakLeaf(24.2, 9.6, 4 - sw * 4, 3.8, 1.4, { curl: 10 }));
    out.push(...root(BROW, 1.35, 1.15));
    for (let i = 0; i < BROW.length - 1; i++) {
      const [ax, ay] = BROW[i];
      const [bx, by] = BROW[i + 1];
      out.push(line([[ax + (bx - ax) * 0.2, ay + (by - ay) * 0.2 - 0.55], [ax + (bx - ax) * 0.75, ay + (by - ay) * 0.75 + 0.55]], 0.42, C.rootDark, 0.3));
    }
    out.push(...moss(6.2, 10.2, 2.6, 1.2, 1), ...moss(24.8, 10.2, 2.6, 1.2, 2));
    out.push(line([[15.5, 6.2], [15.5, 7.2]], 0.3, C.rootDark), ...amberDrop(15.5, 8.2, 0.85));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A bark vest, open at the front, over a moss-green shirt; a root strap across it from the
  // near shoulder with an amber drop and an acorn hanging from it; a dark belt with an acorn-cap
  // pouch.
  top() {
    const torso = torsoPts();
    const out = [T(torso, C.moss), F(T([[MID - 2.2, 26.2], [MID + 2.2, 26.2], [MID, 28.6]], C.mossLight))];
    out.push(M(side(torso, MID - 1.4, -1, C.heart)), M(side(torso, MID + 2, 1, C.heart)));
    out.push(F(R(MID - 1.8, 26.8, 0.45, 7, C.heartLight)), F(R(MID + 2, 26.8, 0.4, 7, C.heartDeep)), F(T([[10.2, 27.6], [12, 27], [11.2, 30.6], [10, 31.4]], C.heartLight)));
    out.push(grain(11.6, 28.6, 11.4, 32.8, 0.3), grain(19.6, 28.4, 19.8, 32.6, -0.3));
    out.push(...root([[20.6, 26.4], [15.6, 30.4], [10.4, 34.4]], 1.1, 1));
    out.push(line([[16.6, 29.8], [16.7, 31.2]], 0.26, C.rootDark), ...amberDrop(16.7, 31.9, 0.6), line([[13.6, 32.2], [13.7, 33]], 0.26, C.rootDark), ...acorn(13.7, 33.2, 0.42));
    out.push(M(band(torso, 33.8, 35.3, C.heartDark)));
    out.push(M(T([[18.2, 33.6], [21, 33.6], [21.2, 36.8], [18, 36.8]], C.heart)), M(T([[18.1, 33.4], [21.1, 33.4], [21, 34.9], [19.6, 35.5], [18.2, 34.9]], C.cap)), ...[[18.9, 34.1], [20.3, 34.1], [19.6, 34.8]].map(([x, y]) => F(E(x, y, 0.36, 0.24, C.capDark))));
    return out;
  },
  sleeve: () => C.moss,
  longSleeves: () => false,
  shoulder: () => [],
  legs: () => ({ top: C.heartDark, low: C.heartDark, pad: null, cuff: C.root }),
  // Ragged flaps of moss-green cloth at the hips.
  skirt() {
    return [
      T([[9.6, 34.4], [14, 34.4], [13.6, 38.4], [12.4, 37.4], [11.2, 39.6], [10, 38], [9.2, 39]], C.mossDark),
      T([[17.4, 34.4], [21.6, 34.4], [22, 39.4], [20.8, 38.2], [19.6, 40], [18.4, 38.4], [17.2, 39]], C.mossDark),
      F(T([[10, 34.6], [11.6, 34.6], [11.2, 37.8], [10, 37.6]], C.moss)), F(T([[17.8, 34.6], [19.4, 34.6], [19, 38], [17.8, 38]], C.moss)),
    ];
  },
  // Soft heartwood boots wound with roots, a moss cuff.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      M(k.shaft(3.6, c(C.heart), 3)), M(k.sole(c(C.heart))), M(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.heartDeep))),
      F(k.poly([[-2.1, -2.6], [2.1, -1.4], [2.1, -0.8], [-2.1, -2]], c(C.root))), F(k.poly([[-2.6, -0.2], [2.6, 0.9], [2.6, 1.4], [-2.6, 0.3]], c(C.root))),
      M(k.poly([[-2.2, -4.6], [2.2, -4.6], [2.4, -3.3], [-2.4, -3.3]], c(C.moss))), k.dot(-1, -4.3, 0.4, c(C.mossLight)), k.dot(0.9, -4.2, 0.35, c(C.mossLight)),
    ];
  },
  // Bark-leather wraps wound with a root, an amber stud on the back of the hand.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    const out = [M(limb(...at(0.6), ...at(4.4), 3.3, 3.7, C.heart))];
    for (const d of [1.2, 2.3, 3.4]) out.push(F(T([at(d, -1.7), at(d + 0.4, -1.7), at(d + 0.95, 1.8), at(d + 0.55, 1.8)], C.root)));
    out.push(M(E(hx, hy, 2, 2, C.heart)), F(E(hx - 0.5, hy - 0.6, 0.8, 0.6, C.heartLight)), gemmy(E(hx + 0.35, hy - 0.2, 0.62, 0.62, C.amber)), F(E(hx + 0.2, hy - 0.35, 0.24, 0.24, C.amberCore)));
    return out;
  },
  // A short ragged moss cloak: its hem torn into leaf points, oak leaves caught on them, two roots
  // trailing below.
  cape() {
    const { pts, tips } = leafHem(25.4, 4, 39.6, 5, 2.4);
    const out = [T([[9, 25.8], [22, 25.8], [24.4, 33], ...pts, [5.4, 33]], C.mossDark), F(T([[9.4, 26], [21.6, 26], [22.6, 28.6], [8.4, 28.6]], C.moss))];
    for (const [x, y] of [[7, 35], [23.6, 34.4], [15.5, 37.4]]) out.push(F(E(x, y, 0.9, 0.6, C.moss)));
    tips.forEach(([x, y], i) => i % 2 && out.push(...oakLeaf(x, y - 1.2, -90 + (x - 15.5) * 1.4, 3.4, 1.3)));
    out.push(...root([[7.6, 40.6], [6.8, 43], [7.8, 45]], 0.75, 0.3), ...root([[20.6, 41.6], [21.4, 43.6], [20.6, 45.4]], 0.7, 0.3));
    return out;
  },
  // A root tied across the throat with an amber drop.
  capeFront() {
    return [...root([[10.4, 26], [MID, 27.6], [20.8, 26]], 0.95, 0.95), line([[MID, 27.8], [MID, 28.4]], 0.26, C.rootDark), ...amberDrop(MID, 29.2, 0.7)];
  },
};

// ---------- Sunfeather: the Rootwood Ranger ----------

const RUSSET_FEATHER = { vane: RUSSET, tip: C.amber, barb: RUSSET_D };

const archer = {
  // A wide-brimmed heartwood-brown ranger's hat with a dent in its crown, a moss band with an oak
  // leaf and an acorn tucked in it, and a long russet feather tipped in amber sweeping up behind.
  hat(t, p, m) {
    const sw = m?.hair ?? 0;
    const out = [...feather(curve([9.4, 7.8], [4.6 + sw * 0.4, 1.4], [0.4 + sw, -5.4], 14), 3, RUSSET_FEATHER)];
    for (let i = 3; i < 13; i += 3) {
      const [x, y] = curve([9.4, 7.8], [4.6 + sw * 0.4, 1.4], [0.4 + sw, -5.4], 14)[i];
      out.push(line([[x - 1.2, y - 0.2], [x + 0.9, y + 0.5]], 0.3, RUSSET_D, 0.2));
    }
    out.push(M(E(15.5, 10.2, 13.8, 2.6, C.heart)), F(T([[2, 10.6], [15.5, 12.4], [29, 10.6], [28.4, 11.4], [15.5, 12.8], [2.6, 11.4]], C.heartDeep)), F(T([[3, 9.4], [15.5, 7.8], [28, 9.4], [26, 9], [15.5, 8.2], [5, 9]], C.heartLight)));
    out.push(M(T([[6.6, 9.8], [7.2, 5.4], [9.8, 2.8], [13.4, 2.4], [15.5, 3.4], [17.6, 2.4], [21.2, 2.8], [23.8, 5.4], [24.4, 9.8]], C.heart)));
    out.push(F(T([[8, 7.6], [8.6, 5], [10.6, 3.4], [12.6, 3.2], [10.4, 4.8], [9.4, 7.6]], C.heartLight)), line(curve([15.5, 3.6], [15.2, 4.8], [15.6, 6], 4), 0.34, C.heartDark, 0.2));
    out.push(M(T([[6.8, 7.6], [24.2, 7.6], [24.4, 9.8], [6.6, 9.8]], C.moss)), ...[[8.4, 8.2], [11.2, 8], [14.2, 8.3], [17, 8], [19.8, 8.2]].map(([x, y]) => F(E(x, y, 0.8, 0.4, C.mossLight))));
    out.push(...oakLeaf(22.6, 8.4, 34, 3.6, 1.35), ...acorn(21.2, 8.9, 0.62));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A moss-green tunic with cream collar points, a heartwood chest guard over the far side of the
  // chest edged with a root, a root baldric with an amber buckle, a dark belt with an acorn on it.
  top() {
    const torso = torsoPts();
    const out = [T(torso, FOREST), F(T([[19.6, 27.6], [21, 28], [21.2, 31], [20, 31.4]], FOREST_L))];
    out.push(T([[MID - 3, 25.9], [MID - 0.2, 26.2], [MID - 1.5, 28.6]], CREAM), T([[MID + 0.2, 26.2], [MID + 3, 25.9], [MID + 1.5, 28.6]], CREAM));
    const guard = [[9.8, 27.4], [MID - 0.6, 27], [MID + 0.2, 29], [MID - 0.4, 31.6], [MID - 2.4, 33.2], [9.8, 33]];
    out.push(...plate(guard, [[10.2, 27.8], [MID - 1, 27.4], [MID - 1.2, 28.2], [10.4, 28.8]], [[11.4, 29, 11.6, 32.4], [13.4, 28.8, 13.2, 32]]));
    out.push(...root([[MID + 0.1, 28.6], [MID - 0.6, 31.4], [MID - 2.6, 33.2]], 0.8, 0.5));
    out.push(...root([[20.6, 26.4], [15.6, 30.4], [10.6, 34.6]], 1.2, 1.1), ...amberOrb(15.9, 30.2, 0.95));
    out.push(M(band(torso, 33.6, 35.2, BROWN_D)), ...acorn(MID + 1.4, 34.1, 0.55));
    return out;
  },
  sleeve: () => FOREST,
  longSleeves: () => true,
  // An oak leaf over each shoulder on a cushion of moss.
  shoulder(t, p, s) {
    return [...oakLeaf(0.4 * s, 0.4, s > 0 ? -22 : 202, 4.2, 1.6), ...moss(0, -0.2, 3.4, 1.4, s > 0 ? 1 : 2)];
  },
  legs: () => ({ top: BROWN, low: BROWN, pad: null }),
  // The tunic's skirt: dark green, its hem lobed like an oak leaf, edged with a root at the belt.
  skirt() {
    const { pts, tips } = leafHem(22.6, 8.4, 39.2, 4, 1.5);
    const out = [T([[9.4, 34.4], [21.6, 34.4], ...pts], FOREST_D), F(T([[9.8, 34.6], [12, 34.6], [11.6, 38.6], [9.6, 38.8]], FOREST))];
    for (const [x, y] of tips) out.push(line([[x, y - 2.2], [x, y - 0.4]], 0.3, C.mossDark, 0.16));
    return out;
  },
  // Tall heartwood boots, root laces up the front, a turned-down moss cuff with an acorn toggle.
  shoe(t, p, k) {
    const c = k.tint;
    const out = [M(k.shaft(5.8, c(C.heart), 3.1)), M(k.sole(c(C.heart))), M(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.heartDeep)))];
    for (const y of [-4.4, -2.9, -1.4]) out.push(F(k.poly([[-1, y], [1, y + 0.9], [1, y + 1.3], [-1, y + 0.4]], c(C.root))), F(k.poly([[1, y], [-1, y + 0.9], [-1, y + 1.3], [1, y + 0.4]], c(C.root))));
    out.push(M(k.poly([[-2.5, -7], [2.5, -7], [2.3, -5.3], [-2.3, -5.3]], c(C.moss))), k.dot(-1.2, -6.4, 0.4, c(C.mossLight)), k.dot(0.8, -6.5, 0.35, c(C.mossLight)));
    out.push(k.dot(1.6, -5.9, 0.6, c(C.nut)), k.dot(1.6, -6.4, 0.5, c(C.cap)));
    return out;
  },
  // A heartwood arm guard wound with a root, an amber stud on it, over a dark glove.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    const out = [M(limb(...at(1.2), ...at(4.3), 3.8, 4.5, C.heart)), F(limb(...at(1.4, -0.9), ...at(4.1, -1.1), 0.7, 0.7, C.heartLight)), grain(...at(1.6, 1), ...at(4, 1.1), 0.1)];
    out.push(F(T([at(1.5, -2), at(1.9, -2), at(2.6, 2.1), at(2.2, 2.1)], C.root)), F(T([at(3.2, -2), at(3.6, -2), at(4.2, 2.1), at(3.8, 2.1)], C.root)));
    out.push(gemmy(E(...at(2.9, 0.2), 0.6, 0.6, C.amber)), F(E(...at(2.9, 0), 0.25, 0.25, C.amberCore)), M(E(hx, hy, 2.1, 2.1, BROWN_D)), F(E(hx - 0.5, hy - 0.6, 0.9, 0.6, BROWN)));
    return out;
  },
  // A hooded moss cloak: the hood fallen back behind her neck, the hem fringed with oak leaves.
  cape() {
    const { pts, tips } = leafHem(26.6, 4.4, 41.4, 5, 1.6);
    const out = [T([[8.6, 25.6], [22.4, 25.6], [25.4, 35], ...pts, [5.6, 35]], C.mossDark)];
    for (const [x, y] of tips) out.push(...oakLeaf(x, y - 1.6, -90 + (x - 15.5) * 1.5, 4, 1.5));
    out.push(T([[9, 24.4], [22, 24.4], [23.4, 27.6], [20.6, 30.4], [15.5, 31.2], [10.4, 30.4], [7.6, 27.6]], C.moss), F(T([[9.4, 24.6], [21.6, 24.6], [22.4, 26], [8.6, 26]], C.mossLight)));
    return out;
  },
  // Roots from the shoulders to an acorn toggle at the throat.
  capeFront() {
    return [...root([[10.2, 26], [12.6, 27.4], [MID - 0.8, 28.2]], 0.95, 0.75), ...root([[21, 26], [18.6, 27.4], [MID + 0.8, 28.2]], 0.95, 0.75), ...acorn(MID, 28, 0.7)];
  },
};

export default { warrior, mage, thief, archer };
