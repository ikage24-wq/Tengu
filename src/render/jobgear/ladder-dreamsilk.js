// The Island Journey armour, Lv 40: the Dreamsilk sets (docs/design/island-journey-gear.md), a
// dream theatre's treasures in the Dreamsilk weapons' palette: moon-silver (a pale lilac with a
// soft sheen) inlaid with plum enamel, gold filigree curling along it, plum theatre velvet
// latticed with gold cord, gold crescent moons, moonstones in gold claws, gold curtain tassels and
// fringe, pink silk bows, little clouds. Each job in its own cut:
//
//   Thunderguard (warrior)  a moon-silver helm with a gold crescent moon standing as its crest
//                           and a moonstone at the brow; an enamelled moon-silver breastplate over
//                           plum velvet; velvet tassets with gold tassels; a theatre-curtain cape
//   Tide Mage (mage)        a long plum velvet nightcap drooping to a gold tassel, a crescent pinned
//                           on its moon-silver cuff; a lilac robe with a latticed velvet panel and
//                           crescents; a cape of clouds and moons
//   Moon Moth (thief)       a great pink silk bow whose loops spread like moth wings, its tails
//                           streaming behind; a latticed velvet bolero over a ruffled blouse; a
//                           pleated skirt; ribbons crossing up her shins
//   Sunfeather (archer)     a plumed cavalier's hat pinned up with a gold crescent; a lilac
//                           doublet with velvet panels and moonstone buttons; wide-cuffed boots
//
// The same functions and frame as the Sprout sets (render/jobgear/ladder-sprout.js, whose helpers
// this shares); its own colours, so `t` and `p` are unused.

import { R, E, T, F } from '../pixel.js';
import { torsoPts, band, side, MID, limb, FIGURE } from '../figure.js';
import { DREAMSILK as C, DREAM_PIECES } from '../weapon-dreamsilk.js';
import { tube, curve, arc, matte as M, metal } from '../weapon-ladder-kit.js';
import { line, forearm, dome, feather } from './ladder-sprout.js';
import { coneShape, coneBand, onCone } from './mage.js';

const { moon, filigree, vine, moonstone, tassel, bowKnot, cloud } = DREAM_PIECES;

// ---------- Palette ----------

const LILAC = '#d9c9f2';
const LILAC_L = '#f1e9ff';
const LILAC_D = '#b5a1dc';
const PLUM = C.velvet;
const PLUM_L = C.velvetLight;
const PLUM_D = C.velvetDark;
const GOLDS = { base: C.gold, light: C.goldLight, dark: C.goldDark };
const PLUME = { vane: C.silkLight, tip: C.silk, barb: C.silkDark };

// ---------- Small helpers ----------

// Plum velvet latticed with gold cord over a shape, between x0..x1 and y0..y1, a gold bead at
// each crossing (only inside `inside`, if given).
function lattice(x0, x1, y0, y1, cell = 1.8, inside = null) {
  const out = [];
  for (let x = x0; x < x1 - 0.1; x += cell) {
    for (let y = y0; y < y1 - 0.1; y += cell) {
      const cx = x + cell / 2;
      const cy = y + cell / 2;
      if (inside && !inside(cx, cy)) continue;
      out.push(F(T(tube([[x, y], [x + cell, y + cell]], 0.2), C.gold)), F(T(tube([[x + cell, y], [x, y + cell]], 0.2), C.goldDark)), F(E(cx, cy, 0.24, 0.24, C.goldLight)));
    }
  }
  return out;
}
// Moon-silver: a plate with a pale sheen, an enamel inlay down it with a gold vine, edged in gold.
function silverPlate(pts, light, inlayPts) {
  const out = [metal(T(pts.map(([x, y]) => [x, y + 0.5]), C.goldDark)), metal(T(pts, C.moon)), F(T(light, C.moonLight))];
  if (inlayPts) out.push(F(T(tube(inlayPts, 1.5, 1), C.enamel)), F(T(tube(inlayPts.map(([x, y]) => [x - 0.4, y]), 0.3, 0.2), C.enamelLight)), ...vine(inlayPts[0], inlayPts[inlayPts.length - 1], { curls: 3, size: 0.5, w: 0.24 }));
  return out;
}
// A gold fringe along a hem: little strands hanging from points.
const fringe = (pts, len = 1.2) => pts.flatMap(([x, y], i) => [F(T(tube([[x, y], [x + 0.1, y + len]], 0.32, 0.22), i % 2 ? C.goldDark : C.gold))]);
// A row of points along a polyline, one every `gap`.
function along(pts, gap) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    for (let d = i ? gap : 0; d < len; d += gap) out.push([ax + ((bx - ax) * d) / len, ay + ((by - ay) * d) / len]);
  }
  return out;
}

// ---------- Thunderguard: the Dreamsilk Guard ----------

const warrior = {
  // A moon-silver helm: a gold crescent moon standing on it horns up as its crest, an enamel
  // band at the brow with gold filigree and a moonstone, a pink silk bow at the side.
  hat(t, p, m) {
    const sw = m?.hair ?? 0;
    // The crest: a wide, low crescent cradled on the crown, its horns curling up at either side.
    const [cx, cy] = [15.5 + sw * 0.3, 0.2];
    const bowl = (depth, lift) => Array.from({ length: 17 }, (_, i) => {
      const th = Math.PI * (1 + i / 16);
      return [cx + Math.cos(th) * 7, cy - lift + Math.abs(Math.sin(th)) * depth];
    });
    const out = [metal(T([...bowl(5.8, 1), ...bowl(2.2, 1).reverse()], C.gold)), F(T(tube(bowl(2.6, 1).slice(3, 14), 0.55), C.goldLight)), F(T(tube(bowl(5.3, 1).slice(4, 13), 0.6), C.goldDark))];
    out.push(...moonstone(cx, cy + 3.2, 1.05));
    const crest = out.splice(0);
    out.push(metal(dome(15.5, 10.6, 10.6, 8.2, C.moon)), F(T([[7.6, 6.6], [10.6, 3.6], [13.8, 2.8], [11.2, 4.6], [8.8, 7.6]], C.moonLight)), F(T([[18.4, 9.4], [22.8, 5.2], [25.6, 8.4], [25.8, 9.4]], C.moonShade)));
    out.push(...vine([9.6, 7.8], [14.6, 4], { curls: 2, size: 0.5 }), ...vine([21.4, 7.8], [16.4, 4], { curls: 2, size: 0.5 }));
    out.push(metal(T([[4.4, 8.8], [26.6, 8.8], [27, 10.4], [26.2, 11.6], [15.5, 12.2], [4.8, 11.6], [4, 10.4]], C.gold)), F(T([[5.6, 9.4], [25.4, 9.4], [25.4, 11], [15.5, 11.5], [5.6, 11]], C.enamel)));
    out.push(...filigree([[6, 10.3], [10.6, 10.6], [14, 10.7]], { curls: 2, size: 0.45, w: 0.22 }), ...filigree([[17, 10.7], [20.4, 10.6], [25, 10.3]], { curls: 2, size: 0.45, w: 0.22 }));
    out.push(...moonstone(15.5, 10.5, 1.5), ...bowKnot(25, 9, 0.8), ...crest);
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // Plum velvet under a moon-silver breastplate inlaid with plum enamel and a gold vine, a gold
  // crescent cradling a moonstone at its heart; a gold gorget; a velvet belt with gold tassels.
  top() {
    const torso = torsoPts();
    const out = [T(torso, PLUM), F(T([[10, 27.6], [11.6, 27], [10.8, 30.4], [9.9, 31]], PLUM_L))];
    const pl = [[MID - 4.6, 27.4], [MID + 4.6, 27.4], [MID + 5.2, 29.8], [MID + 4.6, 32.4], [MID + 2.6, 33.8], [MID, 34.2], [MID - 2.6, 33.8], [MID - 4.6, 32.4], [MID - 5.2, 29.8]];
    out.push(...silverPlate(pl, [[MID - 4.2, 27.8], [MID - 1.4, 27.7], [MID - 2, 28.4], [MID - 4.6, 29.4]], null));
    out.push(F(T(tube([[MID - 3.6, 32.2], [MID - 1.6, 29.6]], 1.1, 0.7), C.enamel)), F(T(tube([[MID + 3.6, 32.2], [MID + 1.6, 29.6]], 1.1, 0.7), C.enamel)), ...vine([MID - 3.6, 32.2], [MID - 1.8, 29.8], { curls: 2, size: 0.4 }), ...vine([MID + 3.6, 32.2], [MID + 1.8, 29.8], { curls: 2, size: 0.4 }));
    out.push(...moon(MID, 30.4, 2.2, 90, GOLDS, { beads: true }), ...moonstone(MID, 30.6, 1.05));
    out.push(metal(T([[11, 25.4], [20.2, 25.4], [21.4, 27.4], [15.6, 28.6], [9.8, 27.4]], C.gold)), F(T([[11.4, 25.6], [19.8, 25.6], [20.2, 26.3], [11, 26.3]], C.goldLight)), F(T([[10.4, 27.2], [15.6, 28.3], [20.8, 27.2], [21.4, 27.4], [15.6, 28.6], [9.8, 27.4]], C.goldDark)));
    out.push(M(band(torso, 33.8, 35.3, PLUM_D)), metal(R(MID - 1, 33.8, 2, 1.5, C.gold)), ...tassel(12, 35, 1.6), ...tassel(19.2, 35, 1.6));
    return out;
  },
  sleeve: () => PLUM,
  longSleeves: () => true,
  // A moon-silver pauldron edged in gold, a little gold crescent on it, a gold tassel hanging.
  shoulder(t, p, s) {
    const k = 0.72;
    const pp = (x, y) => [x * k * s, y * k];
    const P = (list, c) => T(list.map(([x, y]) => pp(x, y)), c);
    const cap = [[-2.4, -1.8], [1, -3.4], [5, -3.2], [8.6, -1.2], [10, 1.6], [9.4, 3.4], [6, 2.8], [2, 2.6], [-2.4, 2]];
    return [
      ...tassel(...pp(8.6, 3.2), 1.4),
      P([[-2, 1.6], [4, 2], [9.6, 3], [9.8, 5.2], [5, 4.8], [-2, 4.4]], PLUM),
      metal(P(cap.map(([x, y]) => [x, y + 0.9]), C.gold)), metal(P(cap, C.moon)),
      F(P([[0, -2.4], [5, -2.6], [8, -0.8], [5, -1.4], [0, -1.4]], C.moonLight)),
      ...moon(...pp(4.4, -0.2), 1.5, s > 0 ? 60 : 120, GOLDS, { beads: false }),
    ];
  },
  legs: () => ({ top: PLUM_D, low: PLUM_D, pad: C.moon }),
  // Tassets of plum velvet latticed in gold, a gold tassel at each point, moon-silver between.
  skirt() {
    const out = [T([[9.4, 34.4], [21.6, 34.4], [22.3, 39.6], [8.7, 39.6]], PLUM_D)];
    for (const x of [11.4, 19.8]) {
      const f = [[x - 2.2, 34.6], [x + 2.2, 34.6], [x + 2.4, 39.4], [x, 40.4], [x - 2.4, 39.4]];
      out.push(M(T(f, PLUM)), ...lattice(x - 2.2, x + 2.2, 34.8, 39.2, 1.45), line([f[2], f[3], f[4]], 0.5, C.gold), ...tassel(x, 40.2, 1.4));
    }
    out.push(...silverPlate([[MID - 1.8, 34.6], [MID + 1.8, 34.6], [MID + 2, 40.6], [MID, 41.6], [MID - 2, 40.6]], [[MID - 1.5, 34.8], [MID - 0.6, 34.8], [MID - 0.8, 40], [MID - 1.6, 39.8]], [[MID, 35.8], [MID, 40]]));
    return out;
  },
  // Moon-silver sabatons over plum boots, a gold crescent at the cuff.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      M(k.shaft(4.6, c(PLUM), 3.1)), metal(k.sole(c(C.moon))), metal(k.poly([[-2.8, 2.1], [2.8, 2.1], [2.5, 3], [-2.5, 3]], c(C.gold))),
      F(k.poly([[-1.6, 0.2], [0.6, 0.2], [0.2, 0.8], [-1.8, 0.8]], c(C.moonLight))),
      metal(k.poly([[-2.4, -5.6], [2.4, -5.6], [2.6, -4.2], [-2.6, -4.2]], c(C.gold))),
      metal(k.poly([[-1.3, -6.6], [-0.4, -5.4], [0.4, -5.4], [1.3, -6.6], [0.9, -5.2], [0, -4.8], [-0.9, -5.2]], c(C.gold))),
    ];
  },
  // A moon-silver bracer with a band of enamel and gold filigree, over a plum glove.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    return [
      metal(limb(...at(1.1), ...at(4.3), 4.1, 4.8, C.moon)), F(limb(...at(1.3, -1.1), ...at(4.1, -1.3), 0.7, 0.7, C.moonLight)),
      F(limb(...at(2.2), ...at(3.2), 4.3, 4.6, C.enamel)), ...filigree([at(2.6, -1.8), at(2.6, 0), at(2.7, 1.8)], { curls: 1, size: 0.35, w: 0.2 }),
      metal(limb(...at(1.1), ...at(1.45), 4.2, 4.3, C.gold)),
      E(hx, hy, 2.2, 2.2, PLUM), F(E(hx - 0.5, hy - 0.6, 0.9, 0.6, PLUM_L)),
    ];
  },
  // A theatre-curtain cape of plum velvet hanging in deep folds, gold fringe along its hem and a
  // gold tassel at each corner.
  cape() {
    const hem = [[27.2, 43.2], [21.4, 44.4], [15.5, 44.8], [9.6, 44.4], [3.8, 43.2]];
    const out = [T([[8.4, 25.6], [22.6, 25.6], [25.6, 36], ...hem, [5.4, 36]], PLUM)];
    for (const x of [7.6, 11.2, 15.5, 19.8, 23.4]) out.push(F(T(tube([[15.5 + (x - 15.5) * 0.4, 27], [x, 43.6]], 0.9, 1.3), PLUM_D)), F(T(tube([[15.5 + (x - 15.5) * 0.4 + 0.8, 27], [x + 1.2, 43.6]], 0.4, 0.6), PLUM_L)));
    out.push(metal(T(tube(hem, 1), C.gold)), ...fringe(along(hem, 0.7), 1.3), ...tassel(4, 42.8, 1.8), ...tassel(27, 42.8, 1.8));
    return out;
  },
  // A gold chain across the chest and a pink silk bow at the throat.
  capeFront() {
    const out = [];
    for (const [x, y] of curve([10.4, 26.4], [MID, 30.4], [20.8, 26.4], 9)) out.push(metal(E(x, y, 0.5, 0.4, C.gold)), F(E(x - 0.15, y - 0.12, 0.2, 0.15, C.goldLight)));
    out.push(...bowKnot(MID, 28.2, 0.95));
    return out;
  },
};

// ---------- Tide Mage: the Dreamsilk Robe ----------

// The robe's outline: the figure to the waist, then flaring a little to the knees, swinging.
const robe = (len, flare, sw) => [...FIGURE.front.slice(0, -1), [21.8, 37], [22.4 + flare + sw, len], [15.5 + sw, len + 0.8], [8.6 - flare + sw, len], [9.4, 37], ...FIGURE.back.slice(1)];
// The nightcap's cone: long and soft, drooping behind her.
// The nightcap's spine: up over her crown, flopping over to hang down beside her head (in the
// pointed hats' form, render/jobgear/mage.js `cone`, so their bands and points fit it), its
// hanging end swinging with her head.
function capCone(m) {
  const sw = m?.hair ?? 0;
  const P = [[15.5, 8.4], [15.8, -4.6], [1.6 + sw * 0.5, -4.4], [1.8 + sw * 1.2, 7.4]];
  const n = 18;
  const at = (u) => {
    const v = 1 - u;
    return [0, 1].map((k) => v * v * v * P[0][k] + 3 * v * v * u * P[1][k] + 3 * v * u * u * P[2][k] + u * u * u * P[3][k]);
  };
  return Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    const [x, y] = at(u);
    const [ax0, ay0] = at(Math.max(0, u - 0.02));
    const [ax1, ay1] = at(Math.min(1, u + 0.02));
    return { x, y, a: Math.atan2(ay1 - ay0, ax1 - ax0), r: (15.6 * (1 - u) ** 1.7 + 2) / 2 };
  });
}

const mage = {
  // A long nightcap of plum velvet drooping behind her to a gold tassel, little gold stars and a
  // crescent on it, its moon-silver cuff edged with filigree, a gold crescent and a pink bow
  // pinned on it.
  hat(t, p, m) {
    const sp = capCone(m);
    const tip = sp[sp.length - 1];
    const out = [M(coneShape(sp, PLUM)), F(coneBand(sp, 0.1, 0.75, PLUM_L, -2.8))];
    for (const [u, k, r] of [[0.28, 0.4, 0.9], [0.46, -0.3, 0.75], [0.64, 0.35, 0.7], [0.8, -0.2, 0.6]]) {
      const [x, y] = onCone(sp, u, k);
      out.push(metal(T(Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        const rr = i % 2 ? r * 0.36 : r;
        return [x + Math.sin(a) * rr, y - Math.cos(a) * rr];
      }), C.gold)));
    }
    out.push(...moon(...onCone(sp, 0.18, -0.35), 1.2, 60, GOLDS, { beads: false }), ...tassel(tip.x, tip.y - 0.4, 2.4));
    // The cuff.
    out.push(metal(T([[4.4, 7.4], [26.6, 7.4], [27, 9.4], [26.2, 11.2], [15.5, 11.8], [4.8, 11.2], [4, 9.4]], C.moon)), F(T([[4.6, 7.4], [26.4, 7.4], [26.6, 8.1], [4.4, 8.1]], C.moonLight)));
    out.push(...vine([5.6, 10.2], [13.4, 10.8], { curls: 3, size: 0.45, w: 0.22 }), ...vine([17.6, 10.8], [25.4, 10.2], { curls: 3, size: 0.45, w: 0.22 }));
    out.push(...moon(15.5, 9.2, 2.2, 90, GOLDS), ...bowKnot(23.8, 8.4, 0.8));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A lilac robe to the knees: a plum velvet panel down its front latticed in gold, gold crescents
  // scattered on it, a filigree hem, a pink silk sash and bow, a moon-silver collar with a
  // moonstone.
  top(t, p, m) {
    const sw = (m?.sway ?? 0) * 0.4;
    const len = 44.4;
    const body = robe(len, 1.4, sw);
    const out = [T(body, LILAC), F(T([[10.2, 27.6], [12, 27], [11.2, 30.6], [10, 31.4]], LILAC_L))];
    const panel = [[MID - 1.6, 28], [MID + 1.6, 28], [MID + 3.2 + sw, len + 0.4], [MID - 3.2 + sw, len + 0.4]];
    out.push(M(T(panel, PLUM)), ...lattice(MID - 3.2 + sw, MID + 3.2 + sw, 35.2, len - 0.6, 1.6, (x, y) => Math.abs(x - MID - sw * ((y - 28) / 16)) < 1.6 + ((y - 28) / 16) * 1.4 - 0.6));
    out.push(line([panel[0], panel[3]], 0.45, C.gold), line([panel[1], panel[2]], 0.45, C.gold));
    for (const [x, y, f] of [[11.2, 38.8, 60], [20.4, 40.4, 110], [12, 42.6, 80], [19.6, 37, 70]]) out.push(...moon(x + sw * 0.8, y, 1.1, f, GOLDS, { beads: false }));
    out.push(F(band(body, len - 1.1, len + 0.5, PLUM_D)), ...filigree(along([[9 + sw, len - 0.2], [15.5 + sw, len + 0.4], [22 + sw, len - 0.2]], 0.6), { curls: 6, size: 0.4, w: 0.22 }));
    out.push(M(band(body, 33.2, 34.8, C.silk)), F(band(body, 33.25, 33.7, C.silkLight)), ...bowKnot(19.2, 34, 1));
    out.push(metal(T([[MID - 4.4, 25.6], [MID + 4.4, 25.6], [MID + 3.6, 27.6], [MID, 29.4], [MID - 3.6, 27.6]], C.moon)), F(T([[MID - 4, 25.8], [MID + 4, 25.8], [MID + 3.8, 26.4], [MID - 3.8, 26.4]], C.moonLight)), line([[MID - 3.6, 27.6], [MID, 29.4], [MID + 3.6, 27.6]], 0.35, C.gold), ...moonstone(MID, 27.8, 1.1));
    return out;
  },
  sleeve: () => LILAC,
  longSleeves: () => true,
  // A lilac puff, pleated like a fan, edged in gold.
  shoulder(t, p, s) {
    const out = [E(0, 0.6, 2.7, 2.4, LILAC)];
    for (const a of [-50, -20, 10, 40, 70]) out.push(F(T(tube([[0, 2.2], [Math.cos((a * Math.PI) / 180) * 2.4 * s, 0.6 - Math.sin((a * Math.PI) / 180) * 2.2]], 0.3, 0.2), LILAC_D)));
    out.push(metal(T([...arc(0, 0.6, 2.7, 2.4, 200, 340, 8), ...arc(0, 0.6, 2.2, 1.9, 340, 200, 8)], C.gold)));
    return out;
  },
  legs: () => ({ top: PLUM_D, low: PLUM_D, pad: null }),
  // A plum velvet underskirt below the robe, gold fringe along its hem.
  skirt() {
    const hem = [[23.6, 46], [15.5, 46.8], [7.4, 46]];
    return [T([[10, 34.2], [21.2, 34.2], [22.6, 41], ...hem, [8.6, 41]], PLUM), R(10, 34.2, 11.2, 1.4, PLUM_D), metal(T(tube(hem, 0.7), C.gold)), ...fringe(along(hem, 0.65), 1)];
  },
  // Plum slippers with a gold crescent on each toe.
  shoe(t, p, k) {
    const c = k.tint;
    return [k.shaft(1.1, c(LILAC), 3.1), M(k.sole(c(PLUM))), metal(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.gold))), metal(k.poly([[-1.6, -0.6], [-0.4, 1], [0.8, 1], [1.8, -0.4], [1, 1.6], [-0.6, 1.6]], c(C.gold)))];
  },
  // Lilac gloves, a pink bow at each wrist.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    return [limb(...at(0.8), ...at(2.6), 3.7, 3.5, LILAC), E(hx, hy, 2, 2, LILAC), F(E(hx - 0.5, hy - 0.6, 0.8, 0.6, LILAC_L)), ...bowKnot(...at(2.2), 0.55)];
  },
  // A cape of dream: lilac deepening to plum, little clouds along its hem and gold crescents and
  // stars drifting over it.
  cape() {
    const out = [T([[8.6, 25.8], [22.4, 25.8], [25, 35], [26.2, 43.6], [15.5, 44.8], [4.8, 43.6], [6, 35]], LILAC_D)];
    out.push(F(T([[5.4, 38], [15.5, 36.6], [25.6, 38], [26.2, 43.6], [15.5, 44.8], [4.8, 43.6]], PLUM_L)));
    for (const x of [5.8, 10.4, 15.5, 20.6, 25.2]) out.push(...cloud(x, 43.2, 4.6));
    out.push(...moon(6.4, 33.4, 1.4, 60, GOLDS, { beads: false }), ...moon(24.8, 32.4, 1.2, 120, GOLDS, { beads: false }));
    return out;
  },
  // Gold chains from the shoulders to the collar's moonstone.
  capeFront() {
    const out = [];
    for (const pts of [curve([10.4, 26.4], [12, 28.6], [MID - 1.4, 28.4], 5), curve([20.8, 26.4], [19.2, 28.6], [MID + 1.4, 28.4], 5)]) for (const [x, y] of pts) out.push(metal(E(x, y, 0.45, 0.38, C.gold)));
    return out;
  },
};

// ---------- Moon Moth: the Dreamsilk Wraps ----------

const thief = {
  // A great bow of pink silk at the top of her head, its loops spread wide like a moth's wings,
  // a gold crescent pinned on the knot.
  hat(t, p, m) {
    const sw = m?.hair ?? 0;
    const [x, y] = [15.5, 3.4];
    const out = [];
    for (const sd of [-1, 1]) {
      const P = (u, v) => [x + sd * u, y + v - sw * 0.3 * u * 0.2];
      out.push(M(T([P(0, -0.6), P(1.8, -3.2), P(4.4, -4.4), P(6.8, -3.6), P(7.4, -1.4), P(6.4, 0.8), P(3.8, 1.6), P(1, 1)], C.silk)));
      out.push(F(T([P(1.2, -0.4), P(3, -2.4), P(5.4, -2.8), P(5.6, -1), P(3.6, 0.6)], C.silkDark)), F(T(tube([P(1.8, -2.8), P(4.4, -3.8), P(6.6, -3.1)], 0.45), C.silkLight)));
      out.push(...filigree([P(2.2, -1), P(4.6, -1.8), P(6.2, -1.2)], { curls: 1, size: 0.4, w: 0.2 }));
    }
    out.push(M(E(x, y, 1.4, 1.3, C.silk)), F(E(x + 0.2, y + 0.3, 0.8, 0.7, C.silkDark)), ...moon(x, y - 0.2, 1.3, 90, GOLDS, { beads: false }));
    return out;
  },
  // The bow's two long tails streaming from behind her head, swinging as she moves.
  hatBack(t, p, m) {
    const sw = (m?.hair ?? 0) * 0.7 + (m?.sway ?? 0) * 0.3;
    const out = [];
    for (const [ex, ey, w, c] of [[2.2, 15.6, 1.6, C.silkDark], [5.4, 18.6, 1.5, C.silk]]) {
      const end = [ex + sw, ey];
      out.push(M(T(tube(curve([13.6, 4.4], [6 + sw * 0.4, 6 + (ey - 15)], end, 8), w, w * 0.8), c)));
      out.push(M(T([[end[0] - w * 0.5, end[1]], [end[0] + w * 0.5, end[1]], [end[0], end[1] - 0.9]], c)));
    }
    return out;
  },
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A lilac blouse with a ruffled collar under a plum velvet bolero latticed in gold, a gold
  // crescent brooch at the ruffle, a pink silk sash.
  top() {
    const torso = torsoPts();
    const out = [T(torso, LILAC)];
    out.push(M(side(torso, MID - 2.4, -1, PLUM)), M(side(torso, MID + 2.8, 1, PLUM)), ...lattice(9.6, MID - 2.4, 27.2, 33.2, 1.5), ...lattice(MID + 2.8, 21.6, 27.2, 33.2, 1.5));
    out.push(line([[MID - 2.4, 26.6], [MID - 2.6, 33.6]], 0.45, C.gold), line([[MID + 2.8, 26.6], [MID + 3, 33.6]], 0.45, C.gold));
    for (let i = 0; i < 5; i++) out.push(F(E(MID - 1.4 + (i % 2) * 1.2, 27 + i * 1.2, 1.3, 0.55, i % 2 ? LILAC_L : LILAC_D)));
    out.push(...moon(MID, 27.2, 1.3, 90, GOLDS, { beads: false }));
    out.push(M(band(torso, 33.4, 35.2, C.silk)), F(band(torso, 33.45, 33.9, C.silkLight)), ...bowKnot(19.8, 34.3, 0.75));
    return out;
  },
  sleeve: () => LILAC,
  longSleeves: () => false,
  shoulder: () => [],
  legs: () => ({ top: PLUM_D, low: PLUM_D, pad: null, cuff: C.gold }),
  // A short pleated skirt of lilac silk, fanning out, its hem edged in gold.
  skirt() {
    const pts = [[10, 34.4], [21.2, 34.4], [23.4, 39.6], [7.8, 39.6]];
    const out = [T(pts, LILAC)];
    for (let i = 0; i < 8; i++) {
      const x0 = 10.4 + i * 1.4;
      out.push(F(T([[x0, 34.6], [x0 + 0.5, 34.6], [x0 + 0.5 + (x0 - 15.5) * 0.28, 39.4], [x0 - 0.3 + (x0 - 15.5) * 0.28, 39.4]], i % 2 ? LILAC_D : LILAC_L)));
    }
    out.push(metal(T([[7.8, 39], [23.4, 39], [23.5, 39.8], [7.7, 39.8]], C.gold)), R(10, 34.2, 11.2, 1.2, PLUM));
    return out;
  },
  // Plum slippers, pink silk ribbons crossing up the shin.
  shoe(t, p, k) {
    const c = k.tint;
    const out = [k.shaft(0.6, c(PLUM), 3), M(k.sole(c(PLUM))), metal(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.gold)))];
    for (const y of [-4.6, -3, -1.4]) out.push(M(k.poly([[-1.6, y], [1.6, y + 1.2], [1.6, y + 1.7], [-1.6, y + 0.5]], c(C.silk))), F(k.poly([[1.6, y], [-1.6, y + 1.2], [-1.6, y + 1.6], [1.6, y + 0.4]], c(C.silkDark))));
    out.push(k.dot(0, 0.4, 0.55, c(C.silk)));
    return out;
  },
  // Lilac gloves with a gold crescent cuff.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    return [limb(...at(0.6), ...at(2.4), 3.4, 3.6, LILAC), metal(limb(...at(2), ...at(2.6), 3.9, 4, C.gold)), E(hx, hy, 2, 2, LILAC), F(E(hx - 0.5, hy - 0.6, 0.8, 0.6, LILAC_L))];
  },
  // A short plum half-cape with gold crescents on it and gold fringe at its hem.
  cape() {
    const hem = [[25.2, 39.6], [20, 40.6], [15.5, 41], [11, 40.6], [5.8, 39.6]];
    const out = [T([[9, 25.8], [22, 25.8], [24.4, 33], ...hem, [6.6, 33]], PLUM)];
    out.push(F(T([[9.4, 26], [21.6, 26], [22.6, 28.6], [8.4, 28.6]], PLUM_L)), metal(T(tube(hem, 0.8), C.gold)), ...fringe(along(hem, 0.7), 1.1));
    out.push(...moon(7.6, 35, 1.3, 60, GOLDS, { beads: false }), ...moon(23.4, 34.4, 1.2, 120, GOLDS, { beads: false }));
    return out;
  },
  // A gold cord across the throat with a crescent clasp.
  capeFront() {
    return [line([[10.4, 26.2], [MID - 1, 27.6]], 0.5, C.gold), line([[20.8, 26.2], [MID + 1, 27.6]], 0.5, C.gold), ...moon(MID, 27.6, 1.5, 90, GOLDS)];
  },
};

// ---------- Sunfeather: the Dreamsilk Ranger ----------

const archer = {
  // A plum velvet cavalier's hat with a broad brim pinned up at the side with a gold crescent, a
  // great pink plume sweeping back over it, a gold band of filigree.
  hat(t, p, m) {
    const sw = m?.hair ?? 0;
    const out = [];
    // The plume: a great soft feather sweeping back from the pin, a second smaller one under it.
    out.push(...feather(curve([21.4, 6.6], [13 + sw * 0.4, -2.6], [0.6 + sw, 1.2], 16), 4.2, PLUME), ...feather(curve([21, 7], [15 + sw * 0.3, 1.4], [6.6 + sw, 3.6], 12), 2.8, { ...PLUME, vane: C.silk, tip: C.silkDark }));
    out.push(M(E(15.5, 10, 13.6, 2.6, PLUM)), F(T([[2.2, 10.4], [15.5, 12.4], [28.8, 10.4], [28.2, 11.4], [15.5, 12.8], [2.8, 11.4]], PLUM_D)));
    out.push(M(T([[6.8, 9.8], [7.4, 5.4], [10, 3], [15.5, 2.2], [21, 3], [23.6, 5.4], [24.2, 9.8]], PLUM)), F(T([[8, 7.6], [8.6, 5], [10.6, 3.6], [12.8, 3.2], [10.4, 4.8], [9.4, 7.6]], PLUM_L)));
    // The brim pinned up at the near side.
    out.push(M(T([[20.6, 9.6], [24.8, 4.6], [28.4, 3.4], [29.4, 6.6], [27.6, 9.6], [24.4, 10.6]], PLUM)), F(T([[21.6, 9.2], [25, 5.2], [28.2, 4], [28.4, 5]], PLUM_L)));
    out.push(metal(T([[6.8, 7.8], [24.2, 7.8], [24.4, 9.6], [6.6, 9.6]], C.gold)), ...vine([7.6, 8.7], [21.6, 8.7], { curls: 5, size: 0.4, w: 0.22, c: C.goldDark }));
    out.push(...moon(23.8, 7.2, 1.8, 120, GOLDS), ...moonstone(23.8, 7.4, 0.8));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A lilac doublet with plum velvet panels latticed in gold down each side, moonstone buttons
  // down its front, a gold sash across it hung with a tassel.
  top() {
    const torso = torsoPts();
    const out = [T(torso, LILAC), F(T([[19.6, 27.6], [21, 28], [21.2, 31], [20, 31.4]], LILAC_L))];
    out.push(M(side(torso, MID - 2.2, -1, PLUM)), M(side(torso, MID + 2.2, 1, PLUM)), ...lattice(9.6, MID - 2.2, 27.2, 33.4, 1.55), ...lattice(MID + 2.2, 21.6, 27.2, 33.4, 1.55));
    for (const y of [27.8, 29.6, 31.4, 33.2]) out.push(...moonstone(MID, y, 0.55));
    out.push(metal(T(tube([[20.6, 26.4], [15.6, 30.4], [10.6, 34.6]], 1.4), C.gold)), line([[20.4, 26.6], [15.4, 30.6], [10.6, 34.4]], 0.3, C.goldLight), ...tassel(11.2, 34.6, 1.4));
    out.push(M(band(torso, 33.8, 35.3, PLUM_D)), metal(R(MID - 1, 33.8, 2, 1.5, C.gold)));
    return out;
  },
  sleeve: () => LILAC,
  longSleeves: () => true,
  // A puffed, slashed sleeve top: plum puffs with lilac showing through the slashes.
  shoulder(t, p, s) {
    return [M(E(0, 0.6, 2.8, 2.4, PLUM)), F(T(tube([[-1, -1.2], [-0.6, 2.4]], 0.6), LILAC)), F(T(tube([[0.8, -1.2], [1.1, 2.4]], 0.6), LILAC)), metal(T([...arc(0, 0.6, 2.8, 2.4, 200, 340, 8), ...arc(0, 0.6, 2.3, 1.9, 340, 200, 8)], C.gold)), F(E(-0.5 * s, -0.4, 1, 0.6, PLUM_L))];
  },
  legs: () => ({ top: PLUM_D, low: PLUM_D, pad: null }),
  // The doublet's peplum: lilac tabs edged in gold with filigree.
  skirt() {
    const out = [];
    for (let i = 0; i < 5; i++) {
      const x = 10.4 + i * 2.6;
      out.push(T([[x - 1.4, 34.4], [x + 1.4, 34.4], [x + 1.5, 38.4], [x, 39.2], [x - 1.5, 38.4]], i % 2 ? LILAC_D : LILAC), line([[x + 1.5, 38.4], [x, 39.2], [x - 1.5, 38.4]], 0.4, C.gold));
    }
    return out;
  },
  // Tall plum boots with wide turned-down gold-edged cuffs and a gold tassel.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      M(k.shaft(5.8, c(PLUM), 3.1)), M(k.sole(c(PLUM))), M(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(PLUM_D))),
      M(k.poly([[-3.2, -7.2], [3.2, -7.2], [2.8, -4.8], [-2.8, -4.8]], c(LILAC))), metal(k.poly([[-2.9, -5.2], [2.9, -5.2], [2.8, -4.6], [-2.8, -4.6]], c(C.gold))),
      F(k.poly([[-2.6, -6.8], [2.6, -6.8], [2.4, -6.2], [-2.4, -6.2]], c(LILAC_L))), k.dot(2.2, -4.2, 0.55, c(C.gold)),
    ];
  },
  // Wide-cuffed lilac gauntlet gloves edged in gold, filigree on the cuff.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    return [
      limb(...at(1.2), ...at(3.8), 3.8, 5.2, LILAC), metal(limb(...at(3.5), ...at(3.9), 5.1, 5.3, C.gold)),
      ...filigree([at(2.2, -1.6), at(2.6, 0), at(2.4, 1.8)], { curls: 1, size: 0.35, w: 0.2 }),
      E(hx, hy, 2.1, 2.1, LILAC), F(E(hx - 0.5, hy - 0.6, 0.9, 0.6, LILAC_L)),
    ];
  },
  // A plum velvet half-cape lined in lilac, gold fringe along its hem.
  cape() {
    const hem = [[25.4, 37.4], [20, 38.6], [15.5, 39], [11, 38.6], [5.6, 37.4]];
    return [T([[8.6, 25.6], [22.4, 25.6], [25, 31], ...hem, [6, 31]], PLUM), F(T([[9, 25.8], [22, 25.8], [23.4, 28.4], [7.6, 28.4]], PLUM_L)), metal(T(tube(hem, 0.8), C.gold)), ...fringe(along(hem, 0.7), 1.1)];
  },
  // A gold cord tie at the throat with a moonstone.
  capeFront() {
    return [line([[10.2, 26], [MID - 1, 27.8]], 0.55, C.gold), line([[21, 26], [MID + 1, 27.8]], 0.55, C.gold), ...moonstone(MID, 28, 1.1), ...tassel(MID, 29, 1.2)];
  },
};

export default { warrior, mage, thief, archer };
