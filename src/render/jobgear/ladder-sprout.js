// The Island Journey armour, Lv 5: the Sprout sets (docs/design/island-journey-gear.md), one for
// each job in the Sprout weapons' palette: pale whittled wood with its grain and knots, cream
// twine wound and tied, homespun linen, leaf-green cloth, little sprouts and pink buds. Cozy,
// handmade gear from Sprout Village, each job in its own cut:
//
//   Thunderguard (warrior)  a whittled wooden helm and breastplate lashed on with twine over a
//                           quilted linen gambeson, wooden pauldrons, a leaf cloak
//   Tide Mage (mage)        a leaf-brimmed linen hat with a dewdrop, a linen robe with a leaf
//                           collar and a hem of little leaves, a leaf-pointed underskirt
//   Moon Moth (thief)       a green headband whose leaf-tipped tails stream behind, a wrap top
//                           and sash, wrapped hands and shins, a long scarf
//   Sunfeather (archer)     a feathered green cap, a laced leather jerkin and baldric, leather
//                           bracers, tall boots, a capelet fringed with cream feathers
//
// Each job's set is a module like render/jobgear/warrior.js (see index.js for the functions),
// drawn in body coordinates (render/gear.js landmarks); its own colours, so `t` and `p` are
// unused. Wood, twine, leaves and leather are matte (shaded as leather); the cloth is cloth.
// Skirts and capes are drawn at rest and swing as hanging cloth (gear.js `hangs`).

import { R, E, T, F } from '../pixel.js';
import { torsoPts, band, side, MID, limb, mirrorX, FIGURE } from '../figure.js';
import { SPROUT as C } from '../weapon-sprout.js';
import { leaf as kitLeaf, tube, curve, arc, knot as kitKnot, matte as M, gemmy } from '../weapon-ladder-kit.js';

// ---------- Palette ----------

const LINEN = '#f8edd6';
const LINEN_L = '#fffaf0';
const LINEN_D = '#e6d2ac';
const LINEN_DD = '#cdb489';
const MOSS = '#a5d98c';
const MOSS_L = '#d4f3b6';
const MOSS_D = '#7cbd6c';
const MOSS_DD = '#5e9c56';
const FEATHER = '#fff4de';
const FEATHER_D = '#ecd9b4';
const FEATHER_TIP = '#ffd98a';
const DEW = '#bfe9ff';
const LEATHER_L = '#cf9a70';
const FEATHER_PAL = { vane: FEATHER, tip: FEATHER_TIP, barb: FEATHER_D };

// ---------- Small helpers (shared by the later tiers' modules) ----------

const LEAVES = { leaf: C.leaf, light: C.leafLight, dark: C.leafDark };
const CLOTH_LEAF = { leaf: MOSS, light: MOSS_L, dark: MOSS_DD };
const leaf = (x, y, a, len, w, o) => kitLeaf(x, y, a, len, w, LEAVES, o);
const knot = (x, y, r) => kitKnot(x, y, r, { dark: C.woodDark, mid: C.woodMid, light: C.woodLight });
export const both = (shapes) => [...shapes, ...mirrorX(shapes.filter(Boolean))];
// A thin line along points, `w` wide tapering to `w1`.
export const line = (pts, w, c, w1 = w) => F(T(tube(pts, w, w1), c));
// Where a forearm runs: `d` along it from the hand toward the elbow, `o` off to its side.
export function forearm(hx, hy, ex, ey) {
  const len = Math.hypot(ex - hx, ey - hy) || 1;
  const ux = (ex - hx) / len;
  const uy = (ey - hy) / len;
  return (d, o = 0) => [hx + ux * d - uy * o, hy + uy * d + ux * o];
}

// A pink bud, its tip up, on a little green calyx; `s` scales it.
const bud = (x, y, s = 1) => [
  T([[x - 1.1 * s, y + 0.3 * s], [x - 0.95 * s, y - 0.9 * s], [x, y - 2 * s], [x + 0.95 * s, y - 0.9 * s], [x + 1.1 * s, y + 0.3 * s], [x, y + 0.9 * s]], C.bud),
  F(T([[x + 0.6 * s, y - 0.7 * s], [x, y - 1.9 * s], [x + 0.2 * s, y + 0.4 * s]], C.budDark)),
  F(T([[x - 0.5 * s, y - 0.3 * s], [x - 0.1 * s, y - 1.6 * s], [x + 0.05 * s, y - 0.2 * s]], C.budLight)),
  M(T([[x - 1.25 * s, y + 0.1 * s], [x - 0.5 * s, y + 0.55 * s], [x, y - 0.1 * s], [x + 0.5 * s, y + 0.55 * s], [x + 1.25 * s, y + 0.1 * s], [x + 0.6 * s, y + 1.1 * s], [x - 0.6 * s, y + 1.1 * s]], C.leafDark)),
];
// A sprout: a stem curving up from (x, y), `len` tall and leaning by `lean`, two leaves opening at
// its top and a bud between them if `withBud`.
function sprout(x, y, len, s = 1, lean = 0, withBud = false) {
  const tip = [x + lean, y - len];
  const out = [M(T(tube(curve([x, y], [x + 0.5 * s + lean * 0.2, y - len * 0.55], tip, 6), 0.75 * s, 0.5 * s), C.leafDark))];
  out.push(...leaf(tip[0], tip[1] + 0.2, 158 - lean * 4, 3 * s, 1.15 * s, { curl: -24 }), ...leaf(tip[0], tip[1] + 0.2, 22 - lean * 4, 3 * s, 1.15 * s, { curl: 24 }));
  if (withBud) out.push(...bud(tip[0], tip[1] - 0.2, 0.62 * s));
  return out;
}
// Twine strands slanting across a twine band from y0 to y1, x0 to x1.
function strands(x0, x1, y0, y1, step = 1.05) {
  const out = [];
  for (let x = x0; x <= x1; x += step) out.push(F(T([[x, y0], [x + 0.32, y0], [x + 0.72, y1], [x + 0.4, y1]], C.twineDark)));
  return out;
}
// A twine cord along points, `w` thick, its strands crossing it on the slant.
function cord(pts, w) {
  const out = [M(T(tube(pts, w), C.twine))];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const [ux, uy] = [(bx - ax) / len, (by - ay) / len];
    for (let d = 0.4; d < len; d += 0.9) {
      const [cx, cy] = [ax + ux * d, ay + uy * d];
      out.push(line([[cx - uy * w * 0.45 - ux * 0.25, cy + ux * w * 0.45 - uy * 0.25], [cx + uy * w * 0.45 + ux * 0.25, cy - ux * w * 0.45 + uy * 0.25]], 0.26, C.twineDark));
    }
  }
  return out;
}
// A bow tied at (x, y): two loops and a knot.
export const bow = (x, y, s, c, dark) => [
  M(T([[x, y], [x - 1.9 * s, y - 1.2 * s], [x - 2.1 * s, y + 0.2 * s], [x - 1.2 * s, y + 0.9 * s]], c)),
  M(T([[x, y], [x + 1.9 * s, y - 1.2 * s], [x + 2.1 * s, y + 0.2 * s], [x + 1.2 * s, y + 0.9 * s]], c)),
  F(T([[x - 0.4 * s, y - 0.1 * s], [x - 1.6 * s, y - 0.7 * s], [x - 1.7 * s, y + 0.1 * s]], dark)),
  F(T([[x + 0.4 * s, y - 0.1 * s], [x + 1.6 * s, y - 0.7 * s], [x + 1.7 * s, y + 0.1 * s]], dark)),
  M(E(x, y, 0.65 * s, 0.6 * s, c)),
  F(E(x + 0.15 * s, y + 0.15 * s, 0.35 * s, 0.3 * s, dark)),
];
// A hem cut into leaf points, from (x1, y) on the right to x0 on the left: n + 1 points `deep`
// below their notches, each rounded at the shoulder like a leaf. Returns the points and the tips.
export function leafHem(x1, x0, y, n, deep) {
  const pts = [];
  const tips = [];
  const step = (x0 - x1) / n;
  for (let i = 0; i <= n; i++) {
    const x = x1 + step * i;
    const sag = Math.sin((Math.PI * i) / n) * 0.8;
    if (i) pts.push([x - step * 0.62, y + sag + deep * 0.62], [x - step * 0.3, y + sag + deep * 0.9]);
    pts.push([x, y + sag + deep]);
    tips.push([x, y + sag + deep]);
    if (i < n) pts.push([x + step * 0.3, y + sag + deep * 0.9], [x + step * 0.62, y + sag + deep * 0.62], [x + step * 0.5, y + sag]);
  }
  return { pts, tips };
}
// The top half of a rounded-square ellipse, closed along its base (render/jobgear/warrior.js).
export function dome(cx, cy, rx, ry, c) {
  const out = [];
  const pw = (v) => Math.sign(v) * Math.abs(v) ** 0.8;
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI + (i * Math.PI) / 14;
    out.push([cx + pw(Math.cos(a)) * rx, cy + pw(Math.sin(a)) * ry]);
  }
  return T(out, c);
}
// A wood grain line on a dome, from near its crown at x down to its rim.
const domeGrain = (x, top, bottom) => line(curve([15.5 + (x - 15.5) * 0.35, top], [x + (x - 15.5) * 0.14, (top + bottom) / 2], [x, bottom], 6), 0.3, C.grain, 0.22);
// A cloth tie hanging from (x, y).
export const tail = (x, y, dx, len, w, c) => M(T(tube(curve([x, y], [x + dx * 0.3, y + len * 0.5], [x + dx, y + len], 5), w, w * 0.7), c));
// A long cream feather along a curving quill: a soft vane, narrow on its leading side and broad on
// the other, swelling from the base and rounding to its tip, two little splits in it, barbs
// sweeping toward the tip, its outer edge touched with dawn gold.
export function feather(quill, w, pal = FEATHER_PAL) {
  const n = quill.length - 1;
  const norm = (i) => {
    const [ax, ay] = quill[Math.max(0, i - 1)];
    const [bx, by] = quill[Math.min(n, i + 1)];
    const l = Math.hypot(bx - ax, by - ay) || 1;
    return [-(by - ay) / l, (bx - ax) / l, (bx - ax) / l, (by - ay) / l];
  };
  const width = (u) => (u < 0.1 ? 0.35 + (0.65 * u) / 0.1 : 1) * (u > 0.72 ? Math.sqrt(Math.max(0, 1 - ((u - 0.72) / 0.28) ** 2)) : 1);
  const edge = (k, from = 0, to = n) => quill.slice(from, to + 1).map(([x, y], j) => {
    const i = from + j;
    const [nx, ny] = norm(i);
    const split = (i === Math.round(n * 0.38) || i === Math.round(n * 0.62)) && k > 0 ? 0.55 : 1;
    const r = w * k * width(i / n) * split;
    return [x + nx * r, y + ny * r];
  });
  const out = [T([...edge(0.38), ...edge(-0.62).reverse()], pal.vane)];
  // Dawn gold along the broad edge's outer half, toward the tip.
  const g0 = Math.round(n * 0.45);
  out.push(F(T([...edge(-0.62, g0), ...edge(-0.36, g0).reverse()], pal.tip)));
  for (let i = 2; i < n - 1; i++) {
    const [x, y] = quill[i];
    const [nx, ny, ux, uy] = norm(i);
    const r = w * width(i / n);
    out.push(line([[x, y], [x - nx * r * 0.5 + ux * 0.55, y - ny * r * 0.5 + uy * 0.55]], 0.16, pal.barb, 0.1));
    if (i % 2) out.push(line([[x, y], [x + nx * r * 0.3 + ux * 0.45, y + ny * r * 0.3 + uy * 0.45]], 0.16, pal.barb, 0.1));
  }
  out.push(line(quill.slice(0, n), 0.36, pal.barb, 0.14));
  return out;
}
// A cream feather hanging point down at (x, y), `h` long.
export const featherDown = (x, y, h, w, c = FEATHER, barb = FEATHER_D) => [
  T([[x - w, y], [x + w, y], [x + w * 0.9, y + h * 0.55], [x, y + h], [x - w * 0.9, y + h * 0.55]], c),
  line([[x, y], [x, y + h * 0.85]], 0.26, barb, 0.14),
];

// ---------- Thunderguard: the Sprout Guard ----------

const warrior = {
  // A whittled wooden helm: grain running down from its crown, a knot, a carved rim, twine wound
  // round above it and tied in a bow at the front, and a sprout growing from the top.
  hat(t, p, m) {
    const sw = m?.hair ?? 0;
    const out = [...sprout(15.5, 2.6, 3.6, 1, sw * 0.6, true)];
    out.push(M(dome(15.5, 10.4, 10.4, 8.4, C.wood)));
    out.push(F(T([[7.8, 6.6], [10.4, 3.8], [13.4, 2.6], [11.2, 4.6], [8.8, 7.6]], C.woodLight)));
    for (const x of [9.6, 12.6, 18.6, 21.6]) out.push(domeGrain(x, 3, 7.4));
    out.push(...knot(20.6, 5.2, 0.85));
    // Twine wound round, then the carved rim under it.
    out.push(M(T([[5.4, 7.2], [25.6, 7.2], [26, 8.9], [5, 8.9]], C.twine)), ...strands(5.6, 25.2, 7.3, 8.8));
    out.push(M(T([[4.4, 8.8], [26.6, 8.8], [27, 10.2], [26.2, 11.3], [15.5, 11.9], [4.8, 11.3], [4, 10.2]], C.woodMid)));
    out.push(F(T([[4.6, 8.8], [26.4, 8.8], [26.6, 9.5], [4.4, 9.5]], C.woodLight)), F(T([[5.4, 11], [15.5, 11.6], [25.6, 11], [26, 11.3], [15.5, 11.9], [5, 11.3]], C.woodDark)));
    out.push(tail(24.4, 8.4, 0.9 + sw * 0.3, 3.4, 0.7, C.twine), tail(24.6, 8.4, 2 + sw * 0.4, 2.6, 0.65, C.twine), ...bow(24.4, 8.1, 0.75, C.twine, C.twineDark));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A quilted linen gambeson under a wooden breastplate lashed on with twine over the shoulders,
  // the Sprout inlaid on it in green; a twine belt with a wooden toggle and a leaf tucked in.
  top() {
    const torso = torsoPts();
    const out = [T(torso, MOSS), F(T([[MID - 2.4, 26.2], [MID + 2.4, 26.2], [MID, 28.8]], LINEN))];
    for (const x of [11, 20.3]) out.push(F(R(x, 27.4, 0.42, 6, MOSS_D)));
    out.push(...[30.2, 32].map((y) => F(band(torso, y, y + 0.4, MOSS_D))), F(T([[10, 27.6], [11.6, 27], [10.8, 30.4], [9.9, 31]], MOSS_L)));
    out.push(...cord([[MID - 3.6, 27.6], [12.6, 26.6], [11.4, 26.2]], 1.1), ...cord([[MID + 3.6, 27.6], [18.6, 26.6], [19.8, 26.2]], 1.1));
    const plate = [[MID - 4.2, 27.3], [MID - 1.4, 26.8], [MID + 1.4, 26.8], [MID + 4.2, 27.3], [MID + 4.8, 29.6], [MID + 4.2, 32], [MID + 2.2, 33.3], [MID, 33.7], [MID - 2.2, 33.3], [MID - 4.2, 32], [MID - 4.8, 29.6]];
    out.push(M(T(plate.map(([x, y]) => [x, y + 0.5]), C.woodDark)), M(T(plate, C.wood)));
    out.push(F(T([[MID - 3.9, 27.7], [MID - 1.3, 27.2], [MID - 1.8, 28.1], [MID - 4.2, 29.2]], C.woodLight)));
    out.push(line(curve([MID - 2.9, 27.8], [MID - 2.3, 30.2], [MID - 2.6, 32.6], 5), 0.3, C.grain, 0.2), line(curve([MID + 2.9, 27.8], [MID + 3.3, 29.6], [MID + 2.5, 32.4], 5), 0.3, C.grain, 0.2));
    out.push(...knot(MID + 2.9, 31.1, 0.55));
    // The Sprout inlaid in green: a stem, two leaves, a bud.
    out.push(line([[MID, 32.4], [MID + 0.15, 30.8], [MID, 29.8]], 0.42, C.leafDark), ...leaf(MID, 30.2, 150, 2.3, 0.85, { curl: -20 }), ...leaf(MID, 30.2, 30, 2.3, 0.85, { curl: 20 }), ...bud(MID, 29.6, 0.5));
    out.push(M(band(torso, 33.6, 35.1, C.twine)), ...strands(10.2, 20.8, 33.7, 35));
    out.push(M(R(MID - 1.6, 33.6, 3.2, 1.6, C.woodMid)), F(R(MID - 1.4, 33.7, 2.8, 0.45, C.woodLight)), ...leaf(19.4, 34.1, -62, 3, 1.05));
    return out;
  },
  sleeve: () => MOSS,
  longSleeves: () => true,
  // A wooden pauldron over a quilted linen lame, grain along it, a twine lashing, a leaf peeking
  // out behind.
  shoulder(t, p, s) {
    const k = 0.66;
    const P = (list, c) => T(list.map(([x, y]) => [x * k * s, y * k]), c);
    const cap = [[-2.4, -1.8], [1, -3.4], [5, -3.2], [8.6, -1.2], [10, 1.6], [9.4, 3.4], [6, 2.8], [2, 2.6], [-2.4, 2]];
    return [
      ...leaf(8.6 * k * s, 2.4 * k, s > 0 ? -28 : 208, 2.8, 1),
      P([[-2, 1.6], [4, 2], [9.6, 3], [9.8, 5.2], [5, 4.8], [-2, 4.4]], LINEN_D),
      F(P([[-1.6, 3.4], [9.6, 4], [9.6, 4.4], [-1.6, 3.8]], LINEN_DD)),
      M(P(cap.map(([x, y]) => [x, y + 0.9]), C.woodDark)),
      M(P(cap, C.wood)),
      F(P([[0, -2.4], [5, -2.6], [8, -0.8], [5, -1.4], [0, -1.4]], C.woodLight)),
      F(P(tube([[0.6, 0.6], [4.6, 0.8], [8.6, 2.2]], 0.42, 0.3), C.grain)),
      M(P([[3.2, -3.3], [4.6, -3.4], [5.2, 2.9], [3.8, 2.7]], C.twine)),
      F(P([[3.3, -2.2], [4.7, -1.4], [4.7, -0.9], [3.3, -1.7]], C.twineDark)),
      F(P([[3.5, 0], [4.9, 0.8], [4.9, 1.3], [3.5, 0.5]], C.twineDark)),
    ];
  },
  legs: () => ({ top: LINEN_D, low: LINEN_D, pad: C.wood }),
  // Tassets: a big leaf hanging down the front between two wooden slats tied on with twine, and
  // two more leaves behind at the hips, over a linen skirt.
  skirt() {
    const out = [T([[9.4, 34.4], [21.6, 34.4], [22.2, 39.2], [8.8, 39.2]], LINEN_D), ...leaf(9.8, 34.6, -104, 5.8, 1.8), ...leaf(21.4, 34.6, -76, 5.8, 1.8)];
    for (const x of [11.8, 19.4]) {
      out.push(M(T([[x - 1.45, 34.4], [x + 1.45, 34.4], [x + 1.55, 39.4], [x, 40.4], [x - 1.55, 39.4]], C.wood)), F(T([[x - 1.2, 34.6], [x - 0.5, 34.6], [x - 0.6, 39.6], [x - 1.25, 39.3]], C.woodLight)));
      out.push(line([[x + 0.3, 35.8], [x + 0.55, 37.6], [x + 0.25, 39.4]], 0.28, C.grain, 0.2), M(R(x - 1.6, 35, 3.2, 0.95, C.twine)), ...strands(x - 1.4, x + 1.2, 35.05, 35.9, 0.95));
    }
    out.push(...leaf(MID, 34.5, -90, 7.6, 2.4, { curl: 6 }));
    return out;
  },
  // Soft bark-brown boots on wooden soles, a wooden toe cap, cross-laced with twine, a twine-wound
  // cuff with a leaf in it.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      M(k.shaft(4.2, c(C.bark), 3)), M(k.sole(c(C.bark))),
      M(k.poly([[-2.8, 2.1], [2.8, 2.1], [2.5, 3], [-2.5, 3]], c(C.woodMid))),
      M(k.poly([[-2, 0.2], [2, 0.2], [2.7, 1.2], [2.5, 2.1], [-2.5, 2.1], [-2.7, 1.2]], c(C.wood))),
      F(k.poly([[-1.6, 0.4], [0.8, 0.4], [0.4, 0.9], [-1.8, 0.9]], c(C.woodLight))),
      F(k.poly([[-1.2, -3], [1.2, -1.6], [1.2, -1.05], [-1.2, -2.45]], c(C.twine))), F(k.poly([[1.2, -3], [-1.2, -1.6], [-1.2, -1.05], [1.2, -2.45]], c(C.twine))),
      M(k.poly([[-2.1, -4.9], [2.1, -4.9], [2.3, -3.5], [-2.3, -3.5]], c(C.twine))),
      ...[-1.5, -0.3, 0.9].map((x) => F(k.poly([[x, -4.8], [x + 0.35, -4.8], [x + 0.75, -3.6], [x + 0.4, -3.6]], c(C.twineDark)))),
      M(k.poly([[1.6, -4.4], [3.4, -6.2], [4.4, -5.4], [2.6, -3.8]], c(C.leaf))), F(k.poly([[1.9, -4.3], [3.8, -5.8], [3.9, -5.5], [2.1, -4.1]], c(C.leafDark))),
    ];
  },
  // A wooden bracer bound with two turns of twine, and a linen glove.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    return [
      M(limb(...at(1.1), ...at(4), 3.9, 4.5, C.wood)),
      line([at(1.4, 0.9), at(2.6, 1.1), at(3.8, 0.9)], 0.3, C.grain, 0.2),
      F(limb(...at(1.3, -0.9), ...at(3.8, -1.1), 0.7, 0.7, C.woodLight)),
      M(limb(...at(1.5), ...at(2), 4.2, 4.3, C.twine)), M(limb(...at(3.1), ...at(3.6), 4.6, 4.7, C.twine)),
      E(hx, hy, 2.1, 2.1, LINEN_D), F(E(hx - 0.5, hy - 0.6, 0.9, 0.6, LINEN)),
    ];
  },
  // A leaf cloak: green, its hem cut in leaf points, its veins running down to them, over a linen
  // lining a little longer.
  cape() {
    const lining = leafHem(27.8, 3.2, 43.4, 5, 1.8).pts;
    const { pts, tips } = leafHem(27.4, 3.6, 42.6, 5, 2);
    const out = [T([[8.4, 25.6], [22.6, 25.6], [26, 36], ...lining, [5, 36]], LINEN_D), T([[8.4, 25.6], [22.6, 25.6], [25.6, 36], ...pts, [5.4, 36]], MOSS_D)];
    out.push(F(T([[9, 25.8], [22, 25.8], [23.4, 28.4], [7.6, 28.4]], MOSS)));
    for (const [x, y] of tips) out.push(line(curve([15.5 + (x - 15.5) * 0.2, 28], [15.5 + (x - 15.5) * 0.7, 35], [x, y - 0.6], 6), 0.36, MOSS_DD, 0.18));
    return out;
  },
  // Green cloth ties meeting at a wooden toggle with a bud on it.
  capeFront() {
    return [
      ...both([T([[10, 25.8], [12.6, 25.8], [13.8, 28.8], [11.2, 28.6]], MOSS_D)]),
      M(R(MID - 1.7, 27.7, 3.4, 1.3, C.woodMid)), F(R(MID - 1.5, 27.8, 3, 0.45, C.woodLight)),
      ...bud(MID, 27.5, 0.62),
    ];
  },
};

// ---------- Tide Mage: the Sprout Robe ----------

// The robe's outline: the figure to the waist, then flaring a little to the knees, swinging.
const robe = (len, flare, sw) => [...FIGURE.front.slice(0, -1), [21.8, 37], [22.4 + flare + sw, len], [15.5 + sw, len + 0.8], [8.6 - flare + sw, len], [9.4, 37], ...FIGURE.back.slice(1)];

const mage = {
  // A linen cap with a broad leaf for its brim (its stem curling up at the back, its tip out
  // front), wound with twine, a dewdrop resting on the leaf and a sprout on top.
  hat(t, p, m) {
    const sw = m?.hair ?? 0;
    const upper = [[4.4, 7.2], [9, 6], [15.5, 5.5], [22, 5.8], [27, 6.8]];
    const lower = [[27.6, 10.1], [22, 11.8], [15.5, 12.3], [9, 11.8], [4.2, 10.6]];
    const out = [...sprout(15.5, 1.2, 3.4, 1, sw * 0.7, true)];
    out.push(M(T(tube(curve([2.8, 8.8], [0.2, 8.4], [0.8, 5.8], 5), 0.8, 0.5), C.leafDark)));
    out.push(M(T([[2.6, 8.8], ...upper, [29.8, 8.3], ...lower], C.leaf)), F(T([[3.2, 8.8], ...upper, [29, 8.4]], C.leafLight)));
    out.push(line([[3, 8.8], [15.5, 8.9], [29.2, 8.4]], 0.36, C.leafDark, 0.18));
    for (const x of [6.4, 10.4, 20.6, 24.6]) out.push(line([[x, 8.9], [x + (x < 15 ? -1.2 : 1.2), 11.2]], 0.24, C.leafDark, 0.14));
    // The linen crown, wound with twine.
    out.push(T([...arc(15.5, 8.6, 8.2, 7.6, 0, 180, 14)], LINEN), F(T([[9.6, 5], [12, 2.4], [14.4, 1.4], [12.4, 3.4], [10.6, 6.6]], LINEN_L)));
    out.push(line(curve([15.6, 1.2], [16.4, 4.6], [16.2, 7], 5), 0.34, LINEN_D, 0.24), line(curve([12, 2], [11.4, 4.6], [11, 7], 5), 0.3, LINEN_D, 0.22));
    out.push(M(T([[7.4, 6.8], [23.6, 6.8], [23.8, 8.6], [7.2, 8.6]], C.twine)), ...strands(7.6, 23, 6.9, 8.5));
    // The dewdrop on the leaf.
    const [dx, dy] = [23.4, 10.2];
    out.push(gemmy(T([[dx, dy - 1.7], [dx + 0.95, dy - 0.2], [dx + 0.75, dy + 0.6], [dx, dy + 0.95], [dx - 0.75, dy + 0.6], [dx - 0.95, dy - 0.2]], DEW)), F(E(dx - 0.3, dy - 0.15, 0.3, 0.42, '#ffffff')));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A linen robe to the knees: two leaves for a collar with a bud brooch between them, the front's
  // edge overlapping, a twine sash tied in a bow, a hem of little leaves standing up.
  top(t, p, m) {
    const sw = (m?.sway ?? 0) * 0.4;
    const len = 43.6;
    const body = robe(len, 1, sw);
    const out = [T(body, LINEN)];
    out.push(line([[MID + 1.4, 28.6], [MID + 2.2 + sw * 0.3, 36], [MID + 3.2 + sw, len + 0.4]], 0.55, LINEN_D));
    out.push(...leaf(11.6 + sw * 0.6, 39.4, 64, 2.1, 0.75, { light: false }), ...leaf(19.6 + sw * 0.7, 40.2, 116, 1.9, 0.7, { light: false }));
    out.push(band(body, len - 1, len + 0.9, MOSS_D));
    for (const [x, a] of [[10.2, 102], [12.8, 84], [15.4, 97], [18, 82], [20.6, 95]]) out.push(...leaf(x + sw, len - 0.4, a, 2.7, 0.95, { light: false }));
    out.push(M(band(body, 33.2, 34.6, C.twine)), ...strands(10.4, 20.8, 33.3, 34.5));
    out.push(tail(18.6, 34.4, -0.8 + sw, 4.2, 0.7, C.twine), tail(19.6, 34.4, 0.8 + sw, 3.6, 0.7, C.twine), ...bow(19.2, 34, 0.85, C.twine, C.twineDark));
    out.push(...leaf(MID - 0.5, 26.7, 198, 4.6, 1.55, { curl: -12 }), ...leaf(MID + 0.5, 26.7, -18, 4.6, 1.55, { curl: 12 }), ...bud(MID, 28.1, 0.72));
    return out;
  },
  sleeve: () => LINEN,
  longSleeves: () => true,
  // A soft linen puff trimmed with green.
  shoulder(t, p, s) {
    return [E(0, 0.6, 2.5, 2.2, LINEN), F(E(-0.4 * s, -0.2, 1.2, 0.8, LINEN_L)), F(T(arc(0, 0.6, 2.5, 2.2, 200, 340, 8).concat(arc(0, 0.6, 1.9, 1.6, 340, 200, 8)), MOSS_D))];
  },
  legs: () => ({ top: LINEN_D, low: LINEN_D, pad: null }),
  // A green underskirt peeking below the robe, its hem cut in leaf points.
  skirt() {
    const { pts, tips } = leafHem(23.6, 7.6, 45, 5, 1.7);
    const shape = [[10, 34.2], [21.2, 34.2], [22.4, 41], ...pts, [8.6, 41]];
    const out = [T(shape, MOSS), R(10, 34.2, 11.2, 1.4, MOSS_D)];
    for (const [x, y] of tips) out.push(line([[x, y - 2.6], [x, y - 0.5]], 0.32, MOSS_DD, 0.16));
    return out;
  },
  // Green slippers over linen socks, a little leaf on each toe with a bud.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      k.shaft(1.2, c(LINEN), 3.1), k.sole(c(MOSS)), k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(MOSS_DD)),
      F(k.poly([[-1.8, -0.9], [0.6, -0.9], [0.2, -0.4], [-2, -0.4]], c(MOSS_L))),
      M(k.poly([[-0.6, 0.8], [1, -0.6], [2.9, -0.2], [1.6, 1.2]], c(C.leafLight))), F(k.poly([[-0.4, 0.8], [2.6, -0.2], [2.6, 0.1], [-0.2, 0.9]], c(C.leafDark))),
      k.dot(-0.6, 0.8, 0.6, c(C.bud)),
    ];
  },
  // Linen mitts tied at the wrist with twine.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    return [M(limb(...at(1.2), ...at(2.5), 3.9, 3.7, C.twine)), M(limb(...at(1.5), ...at(1.9), 4.1, 4.1, C.twineDark)), E(hx, hy, 2, 2, LINEN), F(E(hx - 0.5, hy - 0.6, 0.8, 0.6, LINEN_L))];
  },
  // A short green shawl, its hem cut in leaf points, veined.
  cape() {
    const { pts, tips } = leafHem(25.4, 5.6, 38.6, 4, 2.2);
    const out = [T([[8.6, 25.8], [22.4, 25.8], [24.4, 33], ...pts, [6.6, 33]], MOSS), F(T([[9, 26], [22, 26], [23, 28.6], [8, 28.6]], MOSS_L))];
    for (const [x, y] of tips) out.push(line(curve([15.5 + (x - 15.5) * 0.25, 28], [15.5 + (x - 15.5) * 0.75, 33.4], [x, y - 0.6], 6), 0.36, MOSS_DD, 0.18));
    return out;
  },
  // The shawl's ends tied at the throat over the collar, a bud on the knot.
  capeFront() {
    return [
      ...both([T([[10, 26], [12.6, 26], [13.8, 29.2], [11.2, 28.8]], MOSS)]),
      M(E(MID, 28.7, 1.4, 1.1, MOSS_D)), ...bud(MID, 28.5, 0.66),
    ];
  },
};

// ---------- Moon Moth: the Sprout Wraps ----------

const thief = {
  // A green headband across the brow with a leaf badge and a bud.
  hat() {
    const upper = [[4.8, 9.8], [7, 7.4], [10.4, 5.8], [15.5, 5.2], [20.6, 5.8], [24, 7.4], [26.2, 9.8]];
    const lower = [[26.4, 12], [24.2, 9.9], [20.6, 8.5], [15.5, 8], [10.4, 8.5], [7, 9.9], [4.6, 12]];
    return [
      T([...upper, ...lower], MOSS),
      F(T([...upper.slice(1, -1), [24, 8.1], [20.6, 6.7], [15.5, 6.2], [10.4, 6.7], [7, 8.1]], MOSS_L)),
      line([[7.6, 9.4], [11, 7.9], [15.5, 7.4], [20, 7.9], [23.4, 9.4]], 0.3, MOSS_D),
      ...leaf(19.4, 7.6, 34, 3, 1.05, { curl: 14 }), ...bud(19.2, 7.3, 0.55),
    ];
  },
  // Its knot at the back of the head and two long tails streaming behind, leaf-tipped, swinging
  // with her head and her steps.
  hatBack(t, p, m) {
    const sw = (m?.hair ?? 0) * 0.7 + (m?.sway ?? 0) * 0.3;
    const out = [];
    for (const [ex, ey, w, c, a] of [[-2.6, 15.6, 1.9, MOSS, 214], [-0.4, 19.8, 1.7, MOSS_D, 236]]) {
      const end = [ex + sw, ey];
      out.push(M(T(tube(curve([5.4, 10.6], [2 + sw * 0.4, 11.8 + (ey - 15) * 0.5], end, 6), w, w * 0.75), c)), ...kitLeaf(end[0], end[1], a, 3.4, 1.35, CLOTH_LEAF, { curl: -14 }));
    }
    out.push(M(E(5.4, 10.6, 1.5, 1.3, MOSS_D)), F(E(5.1, 10.2, 0.6, 0.5, MOSS)));
    return out;
  },
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A green wrap top crossing over a linen collar, its edge trimmed in linen, a linen sash with a
  // twine cord knotted at the front, a little wood-buttoned pouch at the back hip, a leaf pin.
  top(t, p, m) {
    const sw = (m?.sway ?? 0) * 0.3;
    const torso = torsoPts();
    const out = [T(torso, MOSS), T([[MID - 2.4, 26.2], [MID + 2.8, 26.2], [MID + 0.4, 30.4]], LINEN)];
    // The wrap's overlapping front: a soft fold from the near shoulder into the sash, its edge lit.
    out.push(line([[MID + 3.3, 26.5], [MID + 1.3, 30.2], [MID - 1.2, 33]], 0.42, MOSS_DD, 0.3), line([[MID + 2.7, 26.3], [MID + 0.7, 30], [MID - 1.7, 33]], 0.5, MOSS_L, 0.3));
    out.push(F(R(20.2, 27.8, 0.4, 5, MOSS_D)), F(T([[10.2, 27.6], [12, 27], [11, 30.4], [10, 31]], MOSS_L)));
    out.push(band(torso, 32.8, 35.4, LINEN_D), M(band(torso, 33.8, 34.4, C.twine)));
    out.push(M(T([[9.6, 33.2], [12.2, 33.2], [12.4, 36.6], [9.4, 36.6]], C.barkLight)), M(T([[9.5, 33.2], [12.3, 33.2], [12.2, 34.7], [10.9, 35.3], [9.6, 34.7]], C.bark)), F(E(10.9, 34.8, 0.42, 0.42, C.wood)));
    out.push(tail(19.4, 34.5, -0.8 + sw, 3.4, 1, LINEN_D), tail(20.2, 34.5, 0.9 + sw, 4, 1.1, LINEN_D), M(E(19.8, 34.1, 1.1, 0.95, LINEN_D)), F(E(19.6, 33.9, 0.45, 0.35, LINEN_L)));
    out.push(...leaf(18.6, 28.2, 58, 2.4, 0.9), ...bud(18.4, 28.1, 0.5));
    return out;
  },
  sleeve: () => MOSS,
  longSleeves: () => false,
  shoulder: () => [],
  legs: () => ({ top: MOSS_DD, low: LINEN_D, pad: null, cuff: C.twine }),
  // A short wrap of green over the front hip, leaf-pointed, its edge trimmed in linen.
  skirt() {
    const flap = [[12.4, 34.4], [21.4, 34.4], [22, 38.4], [17.4, 40.8], [12.6, 38.2]];
    return [T(flap, MOSS_D), line([[12.5, 34.6], [12.6, 38.2], [17.4, 40.6]], 0.6, LINEN_D), line([[13.6, 35.6], [15.4, 37.6], [17.2, 39.6]], 0.3, MOSS_DD, 0.16)];
  },
  // Soft linen footwraps bound with twine, on bark soles.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      k.shaft(2.6, c(LINEN), 3), k.sole(c(LINEN_D)), M(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.bark))),
      F(k.poly([[-2.1, -2.2], [2.1, -1.4], [2.1, -0.9], [-2.1, -1.7]], c(C.twineDark))), F(k.poly([[-2.6, -0.4], [2.6, 0.5], [2.6, 1], [-2.6, 0.1]], c(C.twineDark))),
      F(k.poly([[-1.6, 1.2], [0.6, 1.2], [0.4, 1.6], [-1.8, 1.6]], c(LINEN_L))),
    ];
  },
  // Linen wraps from the hand up the forearm, bound with twine.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    const out = [limb(...at(0.6), ...at(4.4), 3.3, 3.7, LINEN_D)];
    for (const d of [1.4, 2.5, 3.6]) out.push(F(T([at(d, -1.7), at(d + 0.35, -1.7), at(d + 0.85, 1.8), at(d + 0.5, 1.8)], LINEN_DD)));
    out.push(M(limb(...at(3.9), ...at(4.4), 3.8, 3.8, C.twine)), E(hx, hy, 1.95, 1.95, LINEN_D), F(E(hx - 0.5, hy - 0.6, 0.8, 0.6, LINEN)), F(T([at(-0.4, -1.4), at(0.3, -1.6), at(0.5, 1.6), at(-0.2, 1.4)], LINEN_DD)));
    return out;
  },
  // A long scarf's two tails falling from the back of the neck, leaf-tipped.
  cape() {
    const out = [];
    for (const [pts, w, c, a] of [[[[11.6, 26.4], [6.6, 32], [3.4, 39.4]], 3.2, MOSS_D, -112], [[[12.8, 26.6], [9.6, 34], [7.6, 43]], 3, MOSS, -98]]) {
      const end = pts[2];
      out.push(M(T(tube(curve(...pts, 8), w, w * 0.72), c)), line(curve(pts[0], pts[1], end, 6), 0.3, MOSS_DD, 0.2), ...kitLeaf(end[0], end[1] - 0.4, a, 4.4, 1.7, CLOTH_LEAF, { curl: 10 }));
    }
    return out;
  },
  // The scarf wound round her neck and knotted at the side, one end hanging, a bud pinned on.
  capeFront() {
    const wrap = [[9.8, 25], [21.4, 25], [22, 27], [19.6, 28.6], [15.6, 29], [11.6, 28.6], [9.2, 27]];
    return [
      T(wrap, MOSS), F(T([[10.2, 25.2], [21, 25.2], [21.2, 25.9], [10, 25.9]], MOSS_L)),
      line([[10.4, 26.8], [15.6, 27.8], [20.8, 26.8]], 0.35, MOSS_D),
      tail(19.6, 28.6, 1.1, 3.4, 1.5, MOSS_D), M(E(19.4, 28.1, 1.3, 1.1, MOSS_D)), F(E(19.2, 27.8, 0.5, 0.4, MOSS)),
      ...bud(12.8, 27.4, 0.55),
    ];
  },
};

// ---------- Sunfeather: the Sprout Ranger ----------

const archer = {
  // A soft green ranger's cap, its crown drawn back into a drooping point, its linen brim turned
  // up all round and rising to a point out front, wound with twine; a long cream feather touched
  // with dawn gold sweeping back from it, a leaf sprig and a bud.
  hat(t, p, m) {
    const sw = m?.hair ?? 0;
    const out = [...feather(curve([9.6, 7.4], [4.6 + sw * 0.4, 1.4], [0.2 + sw, -5.8], 14), 3.1)];
    // The crown, its point drooping behind; a seam, a light.
    out.push(T([[5, 10.4], [4.6, 7.6], [3.2, 4.8], [0.8 + sw * 0.5, 2.6], [4.8, 2.6], [9.4, 1.8], [14, 1.6], [18.8, 2.2], [22.8, 3.8], [25.6, 6.4], [26.6, 10.4]], MOSS));
    out.push(F(T([[6.4, 4.6], [9.6, 2.6], [13.2, 2.2], [9.8, 3.8], [7.2, 6.6]], MOSS_L)), line(curve([3.6, 3.4], [10, 3], [17.4, 2.4], 6), 0.3, MOSS_D, 0.22), line(curve([15.4, 1.8], [16.4, 5.4], [16, 8.6], 5), 0.34, MOSS_D, 0.24));
    // The turned-up brim, rising to its point out front.
    const brim = [[4.2, 8.6], [15.5, 8.8], [24.2, 8.4], [27.4, 7.4], [28.6, 7.2], [28.2, 9], [26.8, 10.6], [24, 11.4], [15.5, 11.4], [4.2, 11]];
    out.push(T(brim, LINEN_D), F(T([[4.4, 8.6], [15.5, 8.8], [24.2, 8.4], [27.4, 7.4], [28.3, 7.4], [27.2, 8.4], [24.4, 9.2], [15.5, 9.5], [4.4, 9.3]], LINEN)));
    out.push(M(T([[4.4, 9.6], [24.6, 9.6], [27.6, 8.6], [27.3, 9.6], [24.6, 10.5], [4.3, 10.5]], C.twine)), ...strands(4.8, 24, 9.65, 10.45));
    out.push(...leaf(9.6, 9.4, 128, 2.8, 0.95, { curl: -16 }), ...bud(10.8, 9.2, 0.55));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A linen shirt with pointed collar under a leather jerkin open down the front and laced across
  // with twine, a stitched baldric with a wooden buckle, a leaf brooch, a leather belt.
  top() {
    const torso = torsoPts();
    const out = [T(torso, LINEN)];
    out.push(M(side(torso, MID - 1.5, -1, C.barkLight)), M(side(torso, MID + 1.5, 1, C.barkLight)));
    out.push(F(R(MID - 1.9, 26.8, 0.4, 7, C.bark)), F(R(MID + 1.5, 26.8, 0.4, 7, C.bark)), F(T([[10.2, 27.6], [12, 27], [11.2, 30.6], [10, 31.4]], LEATHER_L)));
    for (const y of [28, 29.9, 31.8]) out.push(F(T([[MID - 1.5, y], [MID + 1.5, y + 1.2], [MID + 1.5, y + 1.6], [MID - 1.5, y + 0.4]], C.twine)), F(T([[MID + 1.5, y], [MID - 1.5, y + 1.2], [MID - 1.5, y + 1.6], [MID + 1.5, y + 0.4]], C.twine)));
    out.push(T([[MID - 3, 25.9], [MID - 0.2, 26.2], [MID - 1.5, 28.6]], LINEN_L), T([[MID + 0.2, 26.2], [MID + 3, 25.9], [MID + 1.5, 28.6]], LINEN_L));
    const strap = [[20.2, 26.4], [15.6, 30.4], [10.6, 34.6]];
    out.push(M(T(tube(strap, 1.6), C.bark)));
    for (let u = 0.08; u < 1; u += 0.12) {
      const [x, y] = u < 0.5 ? [20.2 + (15.6 - 20.2) * u * 2, 26.4 + 4 * u * 2] : [15.6 + (10.6 - 15.6) * (u - 0.5) * 2, 30.4 + 4.2 * (u - 0.5) * 2];
      out.push(F(E(x + 0.35, y + 0.4, 0.17, 0.17, C.twine)));
    }
    out.push(M(T([[16.2, 28.7], [18, 29.1], [17.4, 31], [15.6, 30.6]], C.wood)), F(T([[16.6, 29.3], [17.4, 29.5], [17.1, 30.4], [16.3, 30.2]], C.bark)));
    out.push(...leaf(19.2, 27.6, 64, 2.5, 0.9), ...bud(19.1, 27.5, 0.5));
    out.push(M(band(torso, 33.6, 35.2, C.bark)), M(R(MID - 1.3, 33.6, 2.6, 1.6, C.wood)), F(R(MID - 0.65, 34, 1.3, 0.8, C.bark)));
    return out;
  },
  sleeve: () => LINEN,
  longSleeves: () => true,
  // A small leather shoulder cap.
  shoulder(t, p, s) {
    return [M(E(0, 0.4, 2.4, 2.1, C.barkLight)), F(E(-0.4 * s, -0.4, 1, 0.6, LEATHER_L)), ...[-1.4, 0, 1.4].map((x) => F(E(x, 1.9, 0.16, 0.16, C.twine)))];
  },
  legs: () => ({ top: LINEN_DD, low: LINEN_DD, pad: null }),
  // The jerkin's skirt: two leather flaps split at the front, notched like leaves, stitched.
  skirt() {
    const out = [];
    for (const f of [[[9.4, 34.4], [15, 34.4], [14.8, 39.6], [12.2, 38.8], [9.2, 40]], [[16.2, 34.4], [21.8, 34.4], [22, 40], [19.2, 38.8], [16.4, 39.6]]]) {
      out.push(M(T(f, C.barkLight)));
      for (let i = 0; i < 5; i++) out.push(F(E(f[0][0] + 0.7 + i * 1.05, 39 - Math.abs(i - 2) * 0.35, 0.16, 0.16, C.twine)));
    }
    out.push(F(T([[9.8, 35], [11.6, 35], [11, 38.4], [9.6, 38.8]], LEATHER_L)));
    return out;
  },
  // Tall bark-brown boots with a turned-down cuff, laced up the front with twine, a leaf at the
  // cuff.
  shoe(t, p, k) {
    const c = k.tint;
    const out = [M(k.shaft(5.6, c(C.bark), 3.1)), M(k.sole(c(C.bark))), M(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.barkDark)))];
    for (const y of [-4.4, -2.9, -1.4]) out.push(F(k.poly([[-1, y], [1, y + 0.9], [1, y + 1.3], [-1, y + 0.4]], c(C.twine))), F(k.poly([[1, y], [-1, y + 0.9], [-1, y + 1.3], [1, y + 0.4]], c(C.twine))));
    out.push(M(k.poly([[-2.5, -6.8], [2.5, -6.8], [2.3, -5.2], [-2.3, -5.2]], c(C.barkLight))), F(k.poly([[-2.2, -6.6], [2.2, -6.6], [2.2, -6.2], [-2.2, -6.2]], c(LEATHER_L))));
    out.push(M(k.poly([[1.8, -6.2], [3.8, -7.6], [4.6, -6.6], [2.4, -5.4]], c(C.leaf))), F(k.poly([[2, -6], [4.2, -7.1], [4.3, -6.9], [2.2, -5.8]], c(C.leafDark))));
    return out;
  },
  // A whittled wooden arm guard laced on with bark-brown cord, over a leather glove.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    const out = [M(limb(...at(1.2), ...at(4.3), 3.8, 4.5, C.wood)), F(limb(...at(1.4, -0.9), ...at(4.1, -1.1), 0.7, 0.7, C.woodLight)), line([at(1.5, 1), at(2.8, 1.2), at(4, 1)], 0.28, C.grain, 0.2)];
    for (const d of [1.9, 3.2]) out.push(F(T([at(d, -1.2), at(d + 0.25, -1.2), at(d + 0.95, 1.2), at(d + 0.7, 1.2)], C.bark)), F(T([at(d + 0.7, -1.2), at(d + 0.95, -1.2), at(d + 0.25, 1.2), at(d, 1.2)], C.bark)));
    out.push(M(limb(...at(1.1), ...at(1.35), 4, 4, C.woodDark)), M(E(hx, hy, 2.1, 2.1, C.barkLight)), F(E(hx - 0.5, hy - 0.6, 0.9, 0.6, LEATHER_L)));
    return out;
  },
  // A short green capelet behind, a fringe of cream feathers along its hem.
  cape() {
    const out = [];
    for (let i = 0; i < 7; i++) out.push(...featherDown(6.2 + i * 3.1, 32.6 + Math.sin((Math.PI * i) / 6) * 0.8, 4.4, 1.25, i % 2 ? FEATHER_TIP : FEATHER));
    out.push(T([[8.6, 25.6], [22.4, 25.6], [25, 31], [25.4, 34.2], [15.5, 35], [5.6, 34.2], [6, 31]], MOSS), F(T([[5.8, 33], [25.2, 33], [25.4, 34.2], [15.5, 35], [5.6, 34.2]], MOSS_D)));
    return out;
  },
  // The capelet over her shoulders: feathers peeking under its hem, a wooden toggle, a leaf.
  capeFront() {
    const shape = [[8.6, 25.6], [22.4, 25.6], [23.2, 29], [21, 30.2], [MID + 2, 30.4], [MID, 31], [MID - 2, 30.4], [10.2, 30.2], [8, 29]];
    const out = [];
    for (const [x, y] of [[10.6, 29.6], [13.4, 30.2], [17.8, 30.2], [20.6, 29.6]]) out.push(...featherDown(x, y, 2.6, 0.9, x > MID ? FEATHER_TIP : FEATHER));
    out.push(T(shape, MOSS), band(shape, 29.4, 30.4, MOSS_D), F(T([[9.2, 25.8], [21.8, 25.8], [22.2, 26.8], [8.8, 26.8]], MOSS_L)));
    out.push(M(T(tube([[MID - 0.9, 27.2], [MID + 0.9, 27.9]], 0.9), C.wood)), line([[MID - 1.6, 27.6], [MID - 0.2, 28.2]], 0.3, C.twine));
    out.push(...leaf(MID + 1.2, 27.8, -30, 2.4, 0.9));
    return out;
  },
};

export default { warrior, mage, thief, archer };
