// The Island Journey armour, Lv 30: the Starglass sets (docs/design/island-journey-gear.md), an
// observatory's treasures in the Starglass weapons' palette: star glass of deep night blue with a
// violet haze of nebula in it, polished brass, constellations etched in fine pale lines joining
// little four-pointed stars, astrolabe rings with their degree ticks, wine-red leather wound with
// brass wire. (No round gems in brass rings: they read as eyes. Star-cut gems instead.) Each job
// in its own cut:
//
//   Thunderguard (warrior)  a star-glass helm with a constellation in it, a brass meridian ring
//                           arching over it crowned with a brass star, a dial-ticked rim and a
//                           star-cut gem at the brow; a star-glass breastplate edged in brass over
//                           wine red; brass pauldrons; a night-sky cape with a brass star chart
//   Tide Mage (mage)        an astronomer's pointed hat of night blue, a tilted brass ring round
//                           it and a brass star at its tip; a night robe hazed violet toward the
//                           hem with a constellation stitched in brass; an astrolabe buckle
//   Moon Moth (thief)       a night-blue headscarf studded with brass stars, its tails behind; a
//                           wine vest with star buttons, a pocket spyglass on a brass chain
//   Sunfeather (archer)     a brass circlet with an astrolabe disc and two star-glass feathers; a
//                           wine coat with a star-glass chest guard; a capelet fringed with
//                           violet feathers
//
// The same functions and frame as the Sprout sets (render/jobgear/ladder-sprout.js, whose helpers
// this shares); its own colours, so `t` and `p` are unused.

import { R, E, T, F } from '../pixel.js';
import { torsoPts, band, side, MID, limb, FIGURE } from '../figure.js';
import { STARGLASS as C } from '../weapon-starglass.js';
import { tube, curve, arc, matte as M, gemmy, metal } from '../weapon-ladder-kit.js';
import { line, forearm, dome, leafHem, feather, featherDown } from './ladder-sprout.js';
import { cone, coneShape, coneBand, onCone } from './mage.js';

// ---------- Palette ----------

const NIGHT = C.night;
const NIGHT_L = C.nightLight;
const NIGHT_D = C.nightDark;
const WINE = C.wine;
const WINE_D = C.wineDark;
const STARRY = { vane: C.glass, tip: C.violetLight, barb: C.glassDeep };

// ---------- Small helpers ----------

// A four-pointed star at (x, y), `r` to its points, its waist `k` of that, turned `rot` degrees.
function star4(x, y, r, c, k = 0.32, rot = 0) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = ((rot + i * 45 + 90) * Math.PI) / 180;
    pts.push([x + Math.cos(a) * (i % 2 ? r * k : r), y - Math.sin(a) * (i % 2 ? r * k : r)]);
  }
  return T(pts, c);
}
const at4 = (x, y, rot, ang, rr) => {
  const a = ((rot + ang + 90) * Math.PI) / 180;
  return [x + Math.cos(a) * rr, y - Math.sin(a) * rr];
};
// A brass star, bevelled: lit on its upper left faces, dark on its lower right.
function brassStar(x, y, r, rot = 0) {
  return [
    metal(star4(x, y, r, C.brass, 0.38, rot)),
    F(T([[x, y], at4(x, y, rot, 0, r), at4(x, y, rot, 45, r * 0.38), at4(x, y, rot, 90, r)], C.brassLight)),
    F(T([[x, y], at4(x, y, rot, 180, r), at4(x, y, rot, 225, r * 0.38), at4(x, y, rot, 270, r)], C.brassDark)),
  ];
}
// A star-cut gem of star glass on a brass star, a darker one turned across behind it.
function starGem(x, y, r) {
  const g = r * 0.7;
  return [
    metal(star4(x, y, r * 0.8, C.brassDark, 0.45, 45)), metal(star4(x, y, r, C.brass, 0.42)),
    gemmy(star4(x, y, g, C.glass, 0.36)),
    F(T([[x, y], at4(x, y, 0, 0, g), at4(x, y, 0, 45, g * 0.36), at4(x, y, 0, 90, g)], C.glassLight)),
    F(T([[x, y], at4(x, y, 0, 180, g), at4(x, y, 0, 225, g * 0.36), at4(x, y, 0, 270, g)], C.glassDeep)),
    F(star4(x - r * 0.1, y - r * 0.1, r * 0.3, '#ffffff', 0.3)),
  ];
}
// A brass ring round (x, y), `r` out and `w` thick, with `ticks` degree marks like an astrolabe's.
function ring(x, y, r, w, ticks = 0, ry = r) {
  const k = ry / r;
  const out = [metal(T([...arc(x, y, r, ry, 0, 360, 36), ...arc(x, y, r - w, ry - w * k, 360, 0, 36)], C.brass))];
  out.push(F(T(tube(arc(x, y, r - w / 2, ry - (w / 2) * k, 50, 150, 10), w * 0.32), C.brassLight)), F(T(tube(arc(x, y, r - w / 2, ry - (w / 2) * k, 230, 320, 10), w * 0.28), C.brassDark)));
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2;
    const p = (rr) => [x + Math.cos(a) * rr, y - Math.sin(a) * rr * k];
    out.push(F(T(tube([p(r - w * 0.12), p(r - w * (i % 3 ? 0.5 : 0.8))], 0.16), C.brassDeep)));
  }
  return out;
}
// A constellation etched in star glass: fine pale lines joining little bright stars (a null
// starts another).
function constellation(pts, s = 1) {
  const out = [];
  for (let i = 1; i < pts.length; i++) if (pts[i] && pts[i - 1]) out.push(F(T(tube([pts[i - 1], pts[i]], 0.2), C.etch)));
  for (const p of pts) if (p) out.push(F(star4(p[0], p[1], 0.72 * s, C.glassCore, 0.28)), F(E(p[0], p[1], 0.18 * s, 0.18 * s, '#ffffff')));
  return out;
}
// The same inlaid in brass, like a star chart.
function chart(pts, s = 1) {
  const out = [];
  for (let i = 1; i < pts.length; i++) if (pts[i] && pts[i - 1]) out.push(F(T(tube([pts[i - 1], pts[i]], 0.22), C.brass)));
  for (const p of pts) if (p) out.push(F(star4(p[0], p[1], 0.8 * s, C.brassLight, 0.3)));
  return out;
}
// A plate of star glass: a brass edge round it, the glass night blue, a violet haze across it,
// a light along its top.
function glassPlate(pts, light, haze) {
  return [metal(T(pts.map(([x, y]) => [x, y + 0.55]), C.brassDark)), metal(T(pts.map(([x, y]) => [x, y + 0.25]), C.brass)), gemmy(T(pts, C.glass)), F(T(tube(haze, 1.5, 1), C.violet)), F(T(light, C.glassLight))];
}
// Little stars scattered over cloth.
const sprinkle = (spots, c = C.glassCore) => spots.map(([x, y, r = 0.7]) => F(star4(x, y, r, c, 0.3)));

// ---------- Thunderguard: the Starglass Guard ----------

const warrior = {
  // A star-glass helm with a constellation etched in it, a brass meridian ring arching over it
  // with a brass star on its crest, a brass rim ticked like a dial and a star-cut gem at the brow.
  hat() {
    const out = [gemmy(dome(15.5, 10.6, 10.6, 8.4, C.glass)), F(T([[8.4, 9.6], [12, 6.4], [17.6, 7.6], [22.6, 5.8], [24.8, 8.6], [24, 9.8]], C.violet))];
    out.push(F(T([[18, 9.8], [22.8, 5], [25.6, 8.4], [25.8, 9.8]], C.glassDeep)), F(T([[7.4, 6.6], [10.4, 3.6], [13.6, 2.8], [11, 4.6], [8.6, 7.6]], C.glassLight)));
    out.push(...constellation([[8.6, 8], [11, 6.2], [13.2, 6.8], [15.8, 4.4], null, [19.4, 7.6], [21.6, 6.2]]));
    // The meridian ring arching over, a brass star on its crest.
    out.push(metal(T(tube(arc(15.5, 10.6, 11.6, 10.6, 180, 0, 20), 1.1), C.brass)), F(T(tube(arc(15.5, 10.4, 11.4, 10.4, 160, 60, 12), 0.35), C.brassLight)));
    out.push(...brassStar(15.5, -0.2, 2.2));
    // The rim, ticked like a dial, and the gem at the brow.
    out.push(metal(T([[4.4, 8.8], [26.6, 8.8], [27, 10.4], [26.2, 11.6], [15.5, 12.2], [4.8, 11.6], [4, 10.4]], C.brass)), F(T([[4.6, 8.8], [26.4, 8.8], [26.6, 9.4], [4.4, 9.4]], C.brassLight)));
    for (let x = 5.2, i = 0; x < 26.4; x += 1.05, i++) out.push(F(T(tube([[x, 11.4 + Math.sin(((x - 4) / 23) * Math.PI) * 0.5], [x, i % 3 ? 10.5 : 9.9]], 0.18), C.brassDeep)));
    out.push(...starGem(15.5, 10.4, 1.7));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A wine-red tunic under a breastplate of star glass edged in brass, a constellation etched in
  // it round a star-cut gem; a brass gorget; a wine belt wound with brass wire, a brass star clasp.
  top() {
    const torso = torsoPts();
    const out = [T(torso, WINE), F(T([[10, 27.6], [11.6, 27], [10.8, 30.4], [9.9, 31]], C.wineLight))];
    const pl = [[MID - 4.6, 27.6], [MID + 4.6, 27.6], [MID + 5.2, 30], [MID + 4.6, 32.4], [MID + 2.6, 33.8], [MID, 34.2], [MID - 2.6, 33.8], [MID - 4.6, 32.4], [MID - 5.2, 30]];
    out.push(...glassPlate(pl, [[MID - 4.2, 28], [MID - 1.4, 27.9], [MID - 2, 28.6], [MID - 4.6, 29.6]], [[MID - 4, 32.4], [MID, 30.8], [MID + 4.2, 32.2]]));
    out.push(...constellation([[MID - 3.4, 29.4], [MID - 2, 31.6], null, [MID + 2.2, 31.8], [MID + 3.6, 29.2], [MID + 2.4, 28.4]]), ...starGem(MID, 30.6, 1.8));
    out.push(metal(T([[11, 25.4], [20.2, 25.4], [21.4, 27.4], [15.6, 28.6], [9.8, 27.4]], C.brass)), F(T([[11.4, 25.6], [19.8, 25.6], [20.2, 26.3], [11, 26.3]], C.brassLight)), F(T([[10.4, 27.2], [15.6, 28.3], [20.8, 27.2], [21.4, 27.4], [15.6, 28.6], [9.8, 27.4]], C.brassDark)));
    out.push(M(band(torso, 33.8, 35.3, WINE_D)), ...[10.4, 12, 13.6, 17.6, 19.2, 20.8].map((x) => F(T(tube([[x, 35.2], [x + 0.6, 33.9]], 0.24), C.brass))), ...brassStar(MID, 34.5, 1.4));
    return out;
  },
  sleeve: () => WINE,
  longSleeves: () => true,
  // A brass pauldron with a star-glass inset, its rim ticked, a little brass star on it.
  shoulder(t, p, s) {
    const k = 0.72;
    const pp = (x, y) => [x * k * s, y * k];
    const P = (list, c) => T(list.map(([x, y]) => pp(x, y)), c);
    const cap = [[-2.4, -1.8], [1, -3.4], [5, -3.2], [8.6, -1.2], [10, 1.6], [9.4, 3.4], [6, 2.8], [2, 2.6], [-2.4, 2]];
    const out = [P([[-2, 1.6], [4, 2], [9.6, 3], [9.8, 5.2], [5, 4.8], [-2, 4.4]], NIGHT), metal(P(cap.map(([x, y]) => [x, y + 0.9]), C.brassDark)), metal(P(cap, C.brass))];
    out.push(gemmy(P([[0.6, -1.6], [4.6, -2.2], [7.8, -0.6], [8.4, 1.4], [5, 1.2], [1, 1]], C.glass)), F(P([[0.8, -1.4], [4.4, -1.9], [5.6, -1.2], [1.2, -0.6]], C.glassLight)), F(P([[3, 0.8], [6, -0.4], [8.2, 1.2]], C.violet)));
    for (let i = 0; i < 6; i++) out.push(F(P(tube([[0 + i * 1.7, 2.3 + i * 0.12], [0.2 + i * 1.7, 1.7 + i * 0.12]], 0.3), C.brassDeep)));
    out.push(...brassStar(...pp(4.4, -0.4), 1.2));
    return out;
  },
  legs: () => ({ top: WINE_D, low: WINE_D, pad: C.brass }),
  // Tassets: star-glass plates edged in brass on each hip, brass stars studding them, over a
  // night-blue skirt.
  skirt() {
    const out = [T([[9.4, 34.4], [21.6, 34.4], [22.3, 39.6], [8.7, 39.6]], NIGHT)];
    for (const x of [11.4, 19.8]) {
      out.push(...glassPlate([[x - 2.2, 34.6], [x + 2.2, 34.6], [x + 2.4, 39.4], [x, 40.6], [x - 2.4, 39.4]], [[x - 1.9, 34.9], [x + 1.4, 34.9], [x + 1.2, 35.6], [x - 2, 35.8]], [[x - 2, 38.6], [x + 2, 37]]));
      out.push(...brassStar(x, 37.4, 1));
    }
    out.push(T([[MID - 1.8, 34.6], [MID + 1.8, 34.6], [MID + 2, 41], [MID, 42], [MID - 2, 41]], WINE), ...brassStar(MID, 40, 1.1), ...sprinkle([[MID - 0.6, 36.4, 0.5], [MID + 0.8, 37.8, 0.45]]));
    return out;
  },
  // Brass sabatons over wine boots, a star-glass inset on the shin and a brass star at the toe.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      M(k.shaft(4.6, c(WINE), 3.1)), metal(k.sole(c(C.brass))), metal(k.poly([[-2.8, 2.1], [2.8, 2.1], [2.5, 3], [-2.5, 3]], c(C.brassDark))),
      gemmy(k.poly([[-1.2, -4], [1.2, -4], [1, -1.6], [0, -1], [-1, -1.6]], c(C.glass))), F(k.poly([[-1, -3.8], [0.4, -3.8], [-0.2, -2.6]], c(C.glassLight))),
      metal(k.poly([[-2.4, -5.6], [2.4, -5.6], [2.6, -4.2], [-2.6, -4.2]], c(C.brass))),
      k.dot(0, 1, 0.7, c(C.brassLight)),
    ];
  },
  // A brass bracer ticked like a dial, a star-cut gem on it, over a wine glove.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    const out = [metal(limb(...at(1.1), ...at(4.3), 4.1, 4.8, C.brass)), F(limb(...at(1.3, -1.1), ...at(4.1, -1.3), 0.7, 0.7, C.brassLight))];
    for (let d = 1.4; d < 4.2; d += 0.55) out.push(F(T(tube([at(d, 2), at(d, 1.2)], 0.16), C.brassDeep)));
    out.push(gemmy(star4(...at(2.7, 0.2), 1, C.glass, 0.4)), F(star4(...at(2.6, 0), 0.4, '#ffffff', 0.3)));
    out.push(E(hx, hy, 2.2, 2.2, WINE), F(E(hx - 0.5, hy - 0.6, 0.9, 0.6, C.wineLight)));
    return out;
  },
  // A night-sky cape: deep blue, a star chart inlaid in brass across it, little stars, its hem
  // edged in brass and ticked like a dial.
  cape() {
    const out = [T([[8.4, 25.6], [22.6, 25.6], [26, 36], [27.4, 44], [15.5, 45.4], [3.6, 44], [5, 36]], NIGHT_D), T([[8.4, 25.6], [22.6, 25.6], [25.6, 36], [27, 43.2], [15.5, 44.6], [4, 43.2], [5.4, 36]], NIGHT)];
    out.push(F(T([[6.4, 40], [12, 38], [18, 40.6], [25, 38.6], [26.4, 42], [15.5, 43], [4.6, 42]], C.violet)), F(T([[9, 25.8], [22, 25.8], [23.4, 28.4], [7.6, 28.4]], NIGHT_L)));
    out.push(metal(T([[4, 43.2], [15.5, 44.6], [27, 43.2], [27.2, 44.2], [15.5, 45.6], [3.8, 44.2]], C.brass)));
    out.push(...chart([[5.4, 38.4], [7.4, 35.6], [6.8, 33], null, [24.2, 33.6], [25.4, 37], [23.4, 40.4]]), ...sprinkle([[8.8, 41.4, 0.6], [22, 42, 0.55], [25.8, 30.4, 0.5], [5.2, 30.8, 0.5]]));
    return out;
  },
  // A brass chain across the chest from shoulder to shoulder, a star-cut gem as its clasp.
  capeFront() {
    const out = [];
    for (const [x, y] of curve([10.4, 26.4], [MID, 30.6], [20.8, 26.4], 9)) out.push(metal(E(x, y, 0.5, 0.4, C.brass)), F(E(x - 0.15, y - 0.12, 0.2, 0.15, C.brassLight)));
    out.push(...starGem(MID, 28.6, 1.6));
    return out;
  },
};

// ---------- Tide Mage: the Starglass Robe ----------

// The robe's outline: the figure to the waist, then flaring a little to the knees, swinging.
const robe = (len, flare, sw) => [...FIGURE.front.slice(0, -1), [21.8, 37], [22.4 + flare + sw, len], [15.5 + sw, len + 0.8], [8.6 - flare + sw, len], [9.4, 37], ...FIGURE.back.slice(1)];
// The pointed hat's cone.
const hatCone = (m) => cone(15.5, 7.8, 13.6, 19, 112 + (m?.hair ?? 0) * 7);

const mage = {
  // An astronomer's pointed hat of night blue: a wide brim edged in brass, a brass band ticked
  // like a dial, a violet haze up the cone, a constellation etched on it, a tilted brass ring
  // round it and a brass star at its curling tip.
  hat(t, p, m) {
    const sp = hatCone(m);
    const tip = sp[sp.length - 1];
    const brimPts = (rx, ry, y) => Array.from({ length: 24 }, (_, i) => {
      const th = (i / 24) * Math.PI * 2;
      return [15.5 + rx * Math.cos(th), y + ry * Math.sin(th) - 1.2 * Math.abs(Math.cos(th)) ** 4];
    });
    const out = [metal(T(brimPts(14.6, 2.9, 8.2), C.brass)), T(brimPts(14, 2.5, 7.8), NIGHT), F(T(brimPts(13, 1.6, 8.6), NIGHT_D))];
    // The ring's far half, behind the cone.
    const ringAt = (a0, a1) => tube(arc(15.5, 1.4, 9.4, 2.4, a0, a1, 12).map(([x, y]) => [x, y + (x - 15.5) * 0.16]), 0.85);
    out.push(metal(T(ringAt(0, 180), C.brassDark)));
    out.push(coneShape(sp, NIGHT), F(coneBand(sp, 0.32, 0.62, C.violet, -0.6)), F(coneBand(sp, 0.5, 0.56, C.violetLight, -1.2)));
    out.push(F(T([onCone(sp, 0.05, -0.85), onCone(sp, 0.4, -0.7), onCone(sp, 0.4, -0.35), onCone(sp, 0.05, -0.4)], NIGHT_L)));
    out.push(...constellation([onCone(sp, 0.2, 0.5), onCone(sp, 0.32, -0.1), onCone(sp, 0.46, 0.35), onCone(sp, 0.66, 0)]));
    out.push(metal(coneBand(sp, 0.02, 0.12, C.brass)), ...Array.from({ length: 9 }, (_, i) => F(T(tube([onCone(sp, 0.025, -0.9 + i * 0.225), onCone(sp, i % 3 ? 0.07 : 0.1, -0.9 + i * 0.225)], 0.18), C.brassDeep))));
    out.push(...starGem(...onCone(sp, 0.07, 0.15), 1.4));
    out.push(metal(T(ringAt(180, 360), C.brass)), F(T(tube(arc(15.5, 1.4, 9.4, 2.4, 200, 300, 8).map(([x, y]) => [x, y + (x - 15.5) * 0.16]), 0.3), C.brassLight)));
    out.push(...brassStar(tip.x, tip.y, 2));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A night-blue robe to the knees, hazing to violet toward the hem where a constellation is
  // stitched in brass among little stars; a brass-trimmed front; a wine sash with an astrolabe
  // buckle; a brass collar with a star-cut gem.
  top(t, p, m) {
    const sw = (m?.sway ?? 0) * 0.4;
    const len = 44.4;
    const body = robe(len, 1.4, sw);
    const out = [T(body, NIGHT), band(body, 38.4, len + 0.9, C.violet), F(band(body, 38.4, 39.6, C.glass))];
    out.push(line([[MID + 1.6, 28.6], [MID + 2.4 + sw * 0.3, 36], [MID + 3.4 + sw, len + 0.4]], 0.6, C.brass), F(T([[10.2, 27.6], [12, 27], [11.2, 30.6], [10, 31.4]], NIGHT_L)));
    out.push(...chart([[10.6 + sw, 42.4], [12.2 + sw, 40.6], [14 + sw, 41.6], null, [19.6 + sw, 40.4], [21 + sw, 42.4]], 0.85), ...sprinkle([[16.4 + sw, 43.2, 0.55], [11.2 + sw, 36.6, 0.5], [20 + sw, 37.2, 0.5]]));
    out.push(metal(band(body, len - 1, len + 0.6, C.brass)));
    out.push(M(band(body, 33.2, 34.8, WINE)), ...ring(19.4, 34, 1.7, 0.5, 12), ...starGem(19.4, 34, 1.1));
    out.push(metal(T([[MID - 4.4, 25.6], [MID + 4.4, 25.6], [MID + 3.6, 27.6], [MID, 29.4], [MID - 3.6, 27.6]], C.brass)), F(T([[MID - 4, 25.8], [MID + 4, 25.8], [MID + 3.8, 26.4], [MID - 3.8, 26.4]], C.brassLight)), ...starGem(MID, 27.8, 1.2));
    return out;
  },
  sleeve: () => NIGHT,
  longSleeves: () => true,
  // A night-blue puff edged in brass with a little star.
  shoulder(t, p, s) {
    return [E(0, 0.6, 2.6, 2.3, NIGHT), metal(T([...arc(0, 0.6, 2.6, 2.3, 200, 340, 8), ...arc(0, 0.6, 2, 1.7, 340, 200, 8)], C.brass)), ...brassStar(-0.3 * s, 0, 0.9)];
  },
  legs: () => ({ top: NIGHT_D, low: NIGHT_D, pad: null }),
  // A violet underskirt below the robe, little brass stars round its hem.
  skirt() {
    const out = [T([[10, 34.2], [21.2, 34.2], [22.6, 41], [23.6, 46], [15.5, 46.8], [7.4, 46], [8.6, 41]], C.violet), R(10, 34.2, 11.2, 1.4, C.glassDeep)];
    out.push(metal(T([[7.5, 45.2], [15.5, 46], [23.5, 45.2], [23.6, 46], [15.5, 46.8], [7.4, 46]], C.brass)));
    for (const x of [9, 12.6, 16.2, 19.8]) out.push(...brassStar(x, 44.6, 0.7));
    return out;
  },
  // Night slippers with a brass star on each toe.
  shoe(t, p, k) {
    const c = k.tint;
    return [k.shaft(1.1, c(C.violet), 3.1), k.sole(c(NIGHT)), metal(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.brass))), metal(k.poly([[0, -1.4], [0.45, 0.2], [2, 0.6], [0.45, 1], [0, 2.4], [-0.45, 1], [-2, 0.6], [-0.45, 0.2]], c(C.brass)))];
  },
  // Wine gloves, brass wire wound round the wrist.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    const out = [M(limb(...at(0.9), ...at(2.6), 3.8, 3.6, WINE))];
    for (const d of [1.1, 1.6, 2.1]) out.push(metal(limb(...at(d), ...at(d + 0.22), 3.9, 3.9, C.brass)));
    out.push(M(E(hx, hy, 2, 2, WINE)), F(E(hx - 0.5, hy - 0.6, 0.8, 0.6, C.wineLight)));
    return out;
  },
  // A star-chart cape: night blue, a great constellation inlaid in brass, little stars, a violet
  // haze toward its hem edged in brass ticked like a dial.
  cape() {
    const out = [T([[8.6, 25.8], [22.4, 25.8], [25, 35], [26.2, 44.4], [15.5, 45.6], [4.8, 44.4], [6, 35]], NIGHT)];
    out.push(F(T([[5.6, 39], [15.5, 37.6], [25.6, 39], [26.2, 44.4], [15.5, 45.6], [4.8, 44.4]], C.violet)), metal(T([[4.8, 44.4], [15.5, 45.6], [26.2, 44.4], [26.3, 45.4], [15.5, 46.6], [4.7, 45.4]], C.brass)));
    out.push(...chart([[6.2, 41.6], [7.2, 37.8], [6.4, 34], [7.8, 30.6], null, [24.8, 31], [23.4, 34.6], [25, 38.4], [23.8, 42]]), ...sprinkle([[9.4, 43.4, 0.55], [21.8, 43.8, 0.55], [5.8, 28.6, 0.45], [25.2, 28.4, 0.45]]));
    return out;
  },
  // Brass chains from the shoulders to the collar's gem.
  capeFront() {
    const out = [];
    for (const pts of [curve([10.4, 26.4], [12, 28.6], [MID - 1.4, 28.6], 5), curve([20.8, 26.4], [19.2, 28.6], [MID + 1.4, 28.6], 5)]) for (const [x, y] of pts) out.push(metal(E(x, y, 0.45, 0.38, C.brass)));
    return out;
  },
};

// ---------- Moon Moth: the Starglass Wraps ----------

const thief = {
  // A night-blue headscarf over the crown, studded with brass stars, a constellation stitched on
  // it, knotted behind.
  hat() {
    const out = [T([[4.8, 10.6], [5, 7], [7.8, 3.8], [12, 2.2], [17, 2], [21.6, 3.2], [25, 5.6], [26.4, 10.6], [23.6, 8.8], [19.4, 8], [15.5, 7.8], [11.4, 8], [7.4, 8.8]], NIGHT)];
    out.push(F(T([[7, 6.6], [9.6, 3.8], [13.4, 2.6], [10.8, 4.6], [8.4, 7.4]], NIGHT_L)), F(T([[18.4, 7.6], [22.6, 4.6], [25.4, 7.4], [25.8, 9.4], [23.4, 8.4]], NIGHT_D)));
    out.push(line([[5.2, 10.2], [7.4, 8.6], [11.4, 7.8], [15.5, 7.6], [19.4, 7.8], [23.6, 8.6], [26, 10.2]], 0.8, C.brass));
    out.push(...chart([[9, 6], [11.6, 4.6], [14.2, 5.4], [16.6, 3.6]], 0.8), ...brassStar(21.2, 5.8, 1.4), ...brassStar(8, 9.2, 0.8), ...brassStar(23.4, 9.2, 0.8));
    return out;
  },
  // The scarf's knot at the back of the head, its two tails swinging behind.
  hatBack(t, p, m) {
    const sw = (m?.hair ?? 0) * 0.7 + (m?.sway ?? 0) * 0.3;
    const out = [];
    for (const [ex, ey, w, c] of [[-1.8, 16.4, 2.2, NIGHT], [0.4, 20.2, 2, NIGHT_D]]) {
      const end = [ex + sw, ey];
      out.push(M(T(tube(curve([5.4, 10.2], [2.2 + sw * 0.4, 11.6 + (ey - 15) * 0.5], end, 6), w, w * 0.7), c)), F(star4(end[0], end[1] - 1.2, 0.7, C.brassLight, 0.3)));
    }
    out.push(M(E(5.4, 10.2, 1.6, 1.4, NIGHT_D)));
    return out;
  },
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A night-blue shirt under a wine vest with brass star buttons, a brass chain across it with a
  // little brass spyglass hanging from the belt.
  top() {
    const torso = torsoPts();
    const out = [T(torso, NIGHT), F(T([[MID - 2.2, 26.2], [MID + 2.2, 26.2], [MID, 28.6]], NIGHT_L))];
    out.push(M(side(torso, MID - 1.4, -1, WINE)), M(side(torso, MID + 2, 1, WINE)), F(R(MID - 1.8, 26.8, 0.45, 7, C.brass)), F(R(MID + 2, 26.8, 0.4, 7, C.brass)), F(T([[10.2, 27.6], [12, 27], [11.2, 30.6], [10, 31.4]], C.wineLight)));
    for (const y of [28.4, 30.2, 32]) out.push(...brassStar(MID + 2.9, y, 0.6));
    out.push(M(band(torso, 33.8, 35.3, NIGHT_D)), metal(R(MID - 0.9, 33.9, 1.8, 1.3, C.brass)));
    for (const [x, y] of curve([MID + 3, 32.4], [16.8, 34], [18.6, 35.2], 5)) out.push(metal(E(x, y, 0.32, 0.28, C.brass)));
    out.push(metal(T(tube([[18.4, 35.4], [20.6, 38.4]], 1.1, 0.8), C.brass)), metal(T(tube([[18.2, 35.2], [18.8, 36]], 1.35), C.brassDark)), gemmy(E(20.6, 38.4, 0.45, 0.45, C.glass)));
    return out;
  },
  sleeve: () => NIGHT,
  longSleeves: () => false,
  shoulder: () => [],
  legs: () => ({ top: NIGHT_D, low: NIGHT_D, pad: null, cuff: C.brass }),
  // Wine flaps at the hips edged in brass, a little star on each.
  skirt() {
    const out = [];
    for (const f of [[[9.6, 34.4], [13.8, 34.4], [13.4, 39], [11.6, 40], [9.2, 39.2]], [[17.6, 34.4], [21.6, 34.4], [22, 39.2], [19.6, 40], [17.8, 39]]]) out.push(T(f, WINE), line([f[2], f[3], f[4]], 0.45, C.brass), ...brassStar((f[0][0] + f[1][0]) / 2, 37, 0.7));
    return out;
  },
  // Night boots with a brass cuff and a brass star buckle.
  shoe(t, p, k) {
    const c = k.tint;
    return [M(k.shaft(3.8, c(NIGHT), 3)), M(k.sole(c(NIGHT))), M(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(NIGHT_D))), metal(k.poly([[-2.4, -5.2], [2.4, -5.2], [2.5, -4], [-2.5, -4]], c(C.brass))), metal(k.poly([[0.6, -1.6], [1, -0.6], [2, -0.3], [1, 0], [0.6, 1], [0.2, 0], [-0.8, -0.3], [0.2, -0.6]], c(C.brass)))];
  },
  // Wine fingerless gloves, brass wire round the wrist.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    const out = [M(limb(...at(0.6), ...at(2.4), 3.4, 3.4, WINE))];
    for (const d of [1.6, 2.1]) out.push(metal(limb(...at(d), ...at(d + 0.2), 3.6, 3.6, C.brass)));
    out.push(M(E(hx, hy, 2, 2, WINE)), F(E(hx - 0.5, hy - 0.6, 0.8, 0.6, C.wineLight)));
    return out;
  },
  // A short night-sky cape, ragged at the hem, little stars on it and brass at its points.
  cape() {
    const { pts, tips } = leafHem(25.4, 4, 40, 5, 2.4);
    const out = [T([[9, 25.8], [22, 25.8], [24.4, 33], ...pts, [5.4, 33]], NIGHT), F(T([[6, 36], [25, 35.6], [25.2, 38], [5.6, 38.4]], C.violet))];
    out.push(...sprinkle([[7.6, 31, 0.6], [23.4, 30.4, 0.6], [12, 38.8, 0.5], [20, 39, 0.5]]));
    for (const [x, y] of tips) out.push(...brassStar(x, y - 0.4, 0.75));
    return out;
  },
  // A brass clasp at the throat with a star-cut gem.
  capeFront() {
    return [line([[10.4, 26.2], [MID - 1, 27.6]], 0.6, C.brass), line([[20.8, 26.2], [MID + 1, 27.6]], 0.6, C.brass), ...starGem(MID, 27.8, 1.3)];
  },
};

// ---------- Sunfeather: the Starglass Ranger ----------

const archer = {
  // A brass circlet ticked like a dial, an astrolabe disc on its near side round a star-cut gem,
  // and two star-glass feathers sweeping back from it.
  hat(t, p, m) {
    const sw = m?.hair ?? 0;
    const out = [...feather(curve([7.4, 8.4], [3.2 + sw * 0.4, 3], [-0.6 + sw, -3.6], 12), 2.6, STARRY), ...feather(curve([8.2, 8], [5.6 + sw * 0.4, 1.4], [3.2 + sw, -5.2], 12), 2.4, STARRY)];
    const ringPts = [[4.8, 10.4], [8, 7.6], [12, 6.2], [15.5, 5.9], [19, 6.2], [23, 7.6], [26.2, 10.4]];
    out.push(metal(T(tube(ringPts, 1.4), C.brass)), F(T(tube(ringPts.map(([x, y]) => [x, y - 0.35]), 0.4), C.brassLight)));
    for (let i = 1; i < ringPts.length - 1; i++) out.push(F(E(ringPts[i][0], ringPts[i][1] + 0.2, 0.25, 0.25, C.brassDeep)));
    out.push(...ring(22.6, 7.2, 2.6, 0.7, 16), ...starGem(22.6, 7.2, 1.5), ...starGem(15.5, 6.6, 1.1));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A wine coat with brass buttons over a night shirt, a star-glass chest guard on the far side
  // with a constellation etched in it, a brass-buckled strap.
  top() {
    const torso = torsoPts();
    const out = [T(torso, WINE), F(T([[19.6, 27.6], [21, 28], [21.2, 31], [20, 31.4]], C.wineLight)), T([[MID - 2.2, 26], [MID + 2.2, 26], [MID + 1, 33.6], [MID - 1, 33.6]], NIGHT)];
    for (const y of [28, 30, 32]) out.push(metal(E(MID + 2, y, 0.4, 0.4, C.brass)));
    out.push(...glassPlate([[9.8, 27.4], [MID - 1.2, 27], [MID - 0.8, 29.6], [MID - 1.6, 32], [MID - 3, 33.2], [9.8, 33]], [[10.2, 27.8], [MID - 1.6, 27.4], [MID - 1.8, 28.2], [10.4, 28.8]], [[10.2, 31.6], [13.6, 30.6]]));
    out.push(...constellation([[11, 30.4], [12.4, 29], [13.6, 30.8], [12.6, 32.2]]));
    out.push(M(T(tube([[20.6, 26.4], [15.6, 30.4], [10.6, 34.6]], 1.4), WINE_D)), ...brassStar(16.2, 29.9, 1.1));
    out.push(M(band(torso, 33.6, 35.2, NIGHT_D)), metal(R(MID - 1.2, 33.6, 2.4, 1.6, C.brass)), F(R(MID - 0.6, 34, 1.2, 0.8, NIGHT_D)));
    return out;
  },
  sleeve: () => WINE,
  longSleeves: () => true,
  // A small brass shoulder cap with a star.
  shoulder(t, p, s) {
    return [metal(E(0, 0.4, 2.5, 2.1, C.brass)), F(E(-0.4 * s, -0.4, 1, 0.6, C.brassLight)), ...brassStar(0.4 * s, 0.8, 0.8)];
  },
  legs: () => ({ top: NIGHT, low: NIGHT, pad: null }),
  // The coat's tails, wine red edged in brass.
  skirt() {
    return [T([[9.4, 34.4], [14.6, 34.4], [14, 41.4], [9, 40.6]], WINE), T([[16.4, 34.4], [21.8, 34.4], [22.2, 40.6], [17, 41.4]], WINE), line([[9.1, 40.4], [14, 41.2]], 0.5, C.brass), line([[17, 41.2], [22.1, 40.4]], 0.5, C.brass), F(T([[9.8, 34.6], [11.6, 34.6], [11.2, 40], [9.6, 39.8]], C.wineLight))];
  },
  // Tall wine boots with a brass cuff and a brass star buckle.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      M(k.shaft(5.8, c(WINE), 3.1)), M(k.sole(c(WINE))), M(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(WINE_D))),
      metal(k.poly([[-2.5, -7], [2.5, -7], [2.3, -5.4], [-2.3, -5.4]], c(C.brass))), F(k.poly([[-2.2, -6.8], [2.2, -6.8], [2.2, -6.4], [-2.2, -6.4]], c(C.brassLight))),
      M(k.poly([[-2, -3], [2, -3], [2, -2.2], [-2, -2.2]], c(WINE_D))), metal(k.poly([[0, -3.6], [0.35, -2.9], [1, -2.6], [0.35, -2.3], [0, -1.6], [-0.35, -2.3], [-1, -2.6], [-0.35, -2.9]], c(C.brass))),
    ];
  },
  // A star-glass arm guard edged in brass with a constellation in it, over a wine glove.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    return [
      metal(limb(...at(1.1), ...at(4.4), 4.2, 4.9, C.brass)), gemmy(limb(...at(1.3), ...at(4.2), 3.4, 4, C.glass)), F(limb(...at(1.6, -0.9), ...at(4, -1), 0.6, 0.6, C.glassLight)),
      ...constellation([at(1.8, 0.6), at(2.8, -0.2), at(3.8, 0.7)], 0.7),
      M(E(hx, hy, 2.1, 2.1, WINE)), F(E(hx - 0.5, hy - 0.6, 0.9, 0.6, C.wineLight)),
    ];
  },
  // A short night-blue capelet behind, a fringe of violet star-glass feathers along its hem.
  cape() {
    const out = [];
    for (let i = 0; i < 7; i++) out.push(...featherDown(6.2 + i * 3.1, 32.6 + Math.sin((Math.PI * i) / 6) * 0.8, 4.6, 1.3, i % 2 ? C.violet : C.glass, C.glassDeep));
    out.push(T([[8.6, 25.6], [22.4, 25.6], [25, 31], [25.4, 34.2], [15.5, 35], [5.6, 34.2], [6, 31]], NIGHT), metal(T([[5.8, 33.4], [25.2, 33.4], [25.4, 34.2], [15.5, 35], [5.6, 34.2]], C.brass)), ...sprinkle([[8, 29.4, 0.55], [23, 29.6, 0.55]]));
    return out;
  },
  // The capelet over her shoulders, violet feathers under its hem, a brass star clasp.
  capeFront() {
    const shape = [[8.6, 25.6], [22.4, 25.6], [23.2, 29], [21, 30.2], [MID + 2, 30.4], [MID, 31], [MID - 2, 30.4], [10.2, 30.2], [8, 29]];
    const out = [];
    for (const [x, y] of [[10.6, 29.6], [13.4, 30.2], [17.8, 30.2], [20.6, 29.6]]) out.push(...featherDown(x, y, 2.6, 0.9, x > MID ? C.violet : C.glass, C.glassDeep));
    out.push(T(shape, NIGHT), metal(band(shape, 29.4, 30.4, C.brass)), F(T([[9.2, 25.8], [21.8, 25.8], [22.2, 26.8], [8.8, 26.8]], NIGHT_L)), ...brassStar(MID, 28, 1.5));
    return out;
  },
};

export default { warrior, mage, thief, archer };
