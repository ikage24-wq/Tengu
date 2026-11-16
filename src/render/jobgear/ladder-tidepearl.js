// The Island Journey armour, Lv 20: the Tidepearl sets (docs/design/island-journey-gear.md), from
// the Sunken Aquarium Palace and Lantern Lagoon, in the Tidepearl weapons' palette: mother-of-pearl
// with its rainbow sheen, pearls, pink coral, scallop shells, sea glass, sea-silk cord in deep
// blue, driftwood, a starfish now and then. Each job in its own cut:
//
//   Thunderguard (warrior)  a mother-of-pearl helm with a scallop shell for a crest and coral
//                           branching from its sides; a pearl breastplate over a sea-blue tunic;
//                           scallop-shell pauldrons; hanging scallop tassets; a sea-blue cape
//                           with a foam-crested hem and pearls
//   Tide Mage (mage)        a great scallop shell behind her head like a halo, a pearl tiara with
//                           a sea-glass drop, a starfish pin and coral; a sea-blue robe with a
//                           pearl bodice, a coral sash and a foam hem; a sea-glass cape
//   Moon Moth (thief)       a little pirate tricorn with pearl braid and a scallop cockade; a
//                           navy jacket over a striped shirt, a coral sash; a coral scarf with
//                           pearl-weighted ends
//   Sunfeather (archer)     a sea-blue beret with white seabird feathers and a scallop badge; a
//                           mother-of-pearl scale vest and a sea-silk baldric; a capelet fringed
//                           with white feathers
//
// The same functions and frame as the Sprout sets (render/jobgear/ladder-sprout.js, whose helpers
// this shares); its own colours, so `t` and `p` are unused.

import { R, E, T, F } from '../pixel.js';
import { torsoPts, band, side, MID, limb, FIGURE } from '../figure.js';
import { TIDEPEARL as C, pearl, scallop, coral, glassDrop, starfish } from '../weapon-tidepearl.js';
import { tube, curve, arc, matte as M, gemmy, metal } from '../weapon-ladder-kit.js';
import { line, forearm, dome, bow, feather, featherDown } from './ladder-sprout.js';

// ---------- Palette ----------

const SEA = '#5fb0e0';
const SEA_L = '#a6dcf6';
const SEA_D = C.cord;
const NAVY = C.cordDark;
const NAVY_D = '#1f4677';
const FOAM = '#eef9ff';
const SHIRT = '#f4f8ff';
const SHEENS = [C.sheenPink, C.sheenBlue, C.sheenMint, C.sheenGold];
const GULL = { vane: '#ffffff', tip: '#c9d6e6', barb: '#d8e2ee' };

// ---------- Small helpers ----------

// Mother-of-pearl's sheen: soft pastel streaks along these lines, the four colours in turn.
const sheen = (lines, w = 0.8) => lines.map((pts, i) => F(T(tube(pts, w, w * 0.7), SHEENS[i % 4])));
// A hem of rounded waves from x1 on the right to x0 on the left at y: n waves `deep`, and where
// each wave's crest hangs lowest.
function waveHem(x1, x0, y, n, deep) {
  const pts = [];
  const crests = [];
  const step = (x0 - x1) / n;
  for (let i = 0; i < n; i++) {
    for (let j = i ? 1 : 0; j <= 6; j++) {
      const u = j / 6;
      pts.push([x1 + step * (i + u), y + Math.sin(Math.PI * u) * deep + Math.sin((Math.PI * (i + u)) / n) * 0.8]);
    }
    crests.push([x1 + step * (i + 0.5), y + deep + Math.sin((Math.PI * (i + 0.5)) / n) * 0.8]);
  }
  return { pts, crests };
}
// Foam along a wave hem: little white curls just above each crest.
const foam = (crests, lift = 1.2, r = 0.9) => crests.flatMap(([x, y]) => [F(E(x, y - lift, r, r * 0.7, FOAM)), F(E(x + r * 0.9, y - lift - r * 0.4, r * 0.6, r * 0.45, FOAM))]);
// Pearls strung along points, one every `gap`.
function strand(pts, r, gap = r * 2.1) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    for (let d = i ? gap : 0; d < len; d += gap) out.push(...pearl(ax + ((bx - ax) * d) / len, ay + ((by - ay) * d) / len, r));
  }
  return out;
}
// A mother-of-pearl plate: its shaded edge, its face, a light along its top, sheen across it.
function nacrePlate(pts, light, lines) {
  return [metal(T(pts.map(([x, y]) => [x, y + 0.5]), C.nacreShade)), metal(T(pts, C.nacre)), F(T(light, '#ffffff')), ...sheen(lines)];
}

// ---------- Thunderguard: the Tidepearl Guard ----------

const warrior = {
  // A mother-of-pearl helm: a scallop shell standing up as its crest, coral branching up from its
  // sides, a sea-silk band set with pearls and a great pearl at the brow.
  hat(t, p, m) {
    const sw = m?.hair ?? 0;
    const out = [...scallop(15.5, 4.8, 7.4, 30 - sw * 3, 150 - sw * 3, { ribs: 7 })];
    out.push(...coral([[6.4, 8.6], [4.8, 6.2], [3.4, 3.4]], 1.4, 0.85), ...coral([[5.2, 6.8], [3.4, 5.8], [2, 6]], 0.85, 0.6));
    out.push(...coral([[24.6, 8.6], [26.2, 6.2], [27.6, 3.4]], 1.4, 0.85), ...coral([[25.8, 6.8], [27.6, 5.8], [29, 6]], 0.85, 0.6));
    out.push(metal(dome(15.5, 10.6, 10.6, 8.2, C.nacre)), F(T([[18, 9], [22.6, 5.4], [25.4, 8.4], [25.6, 9.2]], C.nacreShade)));
    out.push(F(T([[8.6, 6], [11.4, 3.4], [14.6, 2.6], [11.6, 4.4], [9.6, 7.2]], '#ffffff')));
    out.push(...sheen([[[9.4, 8.4], [11, 6.2], [12.8, 5.2]], [[12.6, 8.6], [14.6, 6.6]], [[18.4, 8.6], [20.2, 6.6], [21.6, 6.2]]], 0.55));
    out.push(M(T([[4.4, 8.8], [26.6, 8.8], [27, 10.4], [26.2, 11.6], [15.5, 12.2], [4.8, 11.6], [4, 10.4]], SEA_D)), F(T([[4.6, 8.8], [26.4, 8.8], [26.6, 9.4], [4.4, 9.4]], C.cordLight)));
    for (let x = 5.4; x < 26; x += 1.3) out.push(F(T(tube([[x, 11.6], [x + 0.8, 9.2]], 0.3), NAVY)));
    for (const x of [7.4, 10.6, 20.4, 23.6]) out.push(...pearl(x, 10.4, 0.62));
    out.push(...pearl(15.5, 10.6, 1.2));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A sea-blue tunic under a mother-of-pearl breastplate with a scallop and a pearl at its heart,
  // a collar of pearls, a sea-silk belt with a sea-glass clasp and a sprig of coral.
  top() {
    const torso = torsoPts();
    const out = [T(torso, SEA_D), F(T([[10, 27.6], [11.6, 27], [10.8, 30.4], [9.9, 31]], C.cordLight)), F(T([[MID - 2.4, 26.2], [MID + 2.4, 26.2], [MID, 28.8]], FOAM))];
    const pl = [[MID - 4.8, 27.2], [MID - 1.6, 26.6], [MID + 1.6, 26.6], [MID + 4.8, 27.2], [MID + 5.4, 29.8], [MID + 4.8, 32.4], [MID + 2.6, 33.8], [MID, 34.2], [MID - 2.6, 33.8], [MID - 4.8, 32.4], [MID - 5.4, 29.8]];
    out.push(...nacrePlate(pl, [[MID - 4.4, 27.6], [MID - 1.4, 27], [MID - 2, 27.8], [MID - 4.8, 29.2]], [[[MID - 4.2, 31.4], [MID - 1.4, 27.8]], [[MID - 2.6, 33], [MID + 1.2, 28.2]], [[MID - 0.2, 33.4], [MID + 3.6, 28.6]], [[MID + 2.2, 33], [MID + 4.6, 30.2]]]));
    out.push(...scallop(MID, 32.4, 3, 30, 150, { ribs: 5 }), ...pearl(MID, 32.2, 0.7));
    out.push(...strand([[MID - 3.6, 26.5], [MID - 1.8, 27.6], [MID, 27.9], [MID + 1.8, 27.6], [MID + 3.6, 26.5]], 0.48));
    out.push(M(band(torso, 33.8, 35.3, NAVY)), ...glassDrop(MID, 34.6, 0.72), ...coral([[19.6, 35], [20.6, 33.6], [21.1, 32.2]], 0.75, 0.45));
    return out;
  },
  sleeve: () => SEA_D,
  longSleeves: () => true,
  // A scallop shell over the shoulder, fanned out and up, on a pearly lame.
  shoulder(t, p, s) {
    return [metal(E(0, 2, 3, 2, C.nacreShade)), ...scallop(1 * s, 3, 5.6, s > 0 ? -18 : 66, s > 0 ? 114 : 198, { ribs: 6 }), ...pearl(1 * s, 3, 0.6)];
  },
  legs: () => ({ top: NAVY, low: NAVY, pad: C.nacre }),
  // Scallop shells hanging from the belt, a pearl at the foot of each gap, over a navy skirt.
  skirt() {
    const out = [T([[9.4, 34.4], [21.6, 34.4], [22.3, 39.6], [8.7, 39.6]], NAVY)];
    out.push(...scallop(11, 34.6, 5, -152, -48, { ribs: 6, ears: false }), ...scallop(20.2, 34.6, 5, -132, -28, { ribs: 6, ears: false }));
    out.push(...pearl(13.2, 40.4, 0.55), ...pearl(18, 40.4, 0.55));
    out.push(...scallop(MID, 34.8, 5.8, -132, -48, { ribs: 6, ears: false }), ...pearl(MID, 35, 0.75));
    return out;
  },
  // Mother-of-pearl greaves on navy boots, sheen across them, a sea-silk cuff with a pearl.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      metal(k.shaft(4.6, c(C.nacre), 3.1)), metal(k.sole(c(C.nacre))), M(k.poly([[-2.8, 2.1], [2.8, 2.1], [2.5, 3], [-2.5, 3]], c(NAVY))),
      F(k.poly([[-2, -2.6], [2, -3.6], [2, -3], [-2, -2]], c(C.sheenPink))), F(k.poly([[-2.6, 0.6], [2.6, -0.6], [2.6, 0], [-2.6, 1.2]], c(C.sheenBlue))),
      M(k.poly([[-2.3, -5.6], [2.3, -5.6], [2.5, -4.2], [-2.5, -4.2]], c(SEA_D))), k.dot(0, -4.9, 0.62, c(C.pearl)),
    ];
  },
  // A mother-of-pearl bracer with its sheen, a sea-silk wrap at the wrist and a pearl stud.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    return [
      metal(limb(...at(1.1), ...at(4.3), 4.1, 4.8, C.nacre)), F(limb(...at(2, -1.4), ...at(3.4, 1.5), 0.7, 0.7, C.sheenPink)), F(limb(...at(3, -1.6), ...at(4.2, 1), 0.6, 0.6, C.sheenMint)),
      M(limb(...at(1.1), ...at(1.7), 4.3, 4.4, SEA_D)), ...pearl(...at(2.6, 0.4), 0.55),
      E(hx, hy, 2.2, 2.2, NAVY), F(E(hx - 0.5, hy - 0.6, 0.9, 0.6, SEA_D)),
    ];
  },
  // A sea-blue cape lined in navy, its hem rolling in waves crested with foam, a pearl at each.
  cape() {
    const lining = waveHem(27.8, 3.2, 43.2, 6, 1.6).pts;
    const { pts, crests } = waveHem(27.4, 3.6, 42.4, 6, 1.6);
    const out = [T([[8.4, 25.6], [22.6, 25.6], [26, 36], ...lining, [5, 36]], NAVY), T([[8.4, 25.6], [22.6, 25.6], [25.6, 36], ...pts, [5.4, 36]], SEA)];
    out.push(F(T([[9, 25.8], [22, 25.8], [23.4, 28.4], [7.6, 28.4]], SEA_L)), ...foam(crests));
    for (const [x, y] of crests) out.push(...pearl(x, y + 0.6, 0.5));
    return out;
  },
  // Pearls swagged across the chest and a scallop clasp at the throat.
  capeFront() {
    return [...strand(curve([10.4, 26.6], [MID, 31.4], [20.8, 26.6], 10), 0.42), ...scallop(MID, 29.4, 2.4, 30, 150, { ribs: 5 }), ...pearl(MID, 29.3, 0.6)];
  },
};

// ---------- Tide Mage: the Tidepearl Robe ----------

// The robe's outline: the figure to the waist, then flaring a little to the knees, swinging.
const robe = (len, flare, sw) => [...FIGURE.front.slice(0, -1), [21.8, 37], [22.4 + flare + sw, len], [15.5 + sw, len + 0.8], [8.6 - flare + sw, len], [9.4, 37], ...FIGURE.back.slice(1)];

const mage = {
  // A tiara of pearls over her crown, a drop of sea glass at her brow, a starfish pinned at one
  // side and a sprig of coral at the other.
  hat() {
    const out = [...coral([[6.6, 8.2], [5.2, 5.6], [5.6, 3.2]], 1.15, 0.7), ...coral([[5.8, 6.6], [3.8, 5.6], [3, 4]], 0.75, 0.5)];
    const ring = [];
    for (let a = 158; a >= 22; a -= 8) ring.push([15.5 + Math.cos((a * Math.PI) / 180) * 10.2, 14.6 - Math.sin((a * Math.PI) / 180) * 10.2]);
    out.push(line(ring, 0.36, C.pearlShade));
    for (const [x, y] of ring) out.push(...pearl(x, y, 0.62));
    out.push(...glassDrop(15.5, 6.4, 0.95), ...starfish(24.4, 7.6, 2.3, 14));
    return out;
  },
  // A great scallop shell fanned out behind her head like a halo.
  hatBack() {
    return [...scallop(15.5, 13.4, 15.2, 6, 174, { ribs: 11, ears: false })];
  },
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A sea-blue robe to the knees: a mother-of-pearl bodice with pearl buttons, little scallops
  // either side of the neck, a coral sash tied in a bow, foam curling along the hem.
  top(t, p, m) {
    const sw = (m?.sway ?? 0) * 0.4;
    const len = 44.4;
    const body = robe(len, 1.4, sw);
    const torso = torsoPts();
    const out = [T(body, SEA), F(T([[MID + 2.4, 36], [MID + 4.4 + sw, len], [MID + 2.4 + sw, len + 0.4], [MID + 1.2, 36]], SEA_L))];
    out.push(metal(band(torso, 26.4, 33.6, C.nacre)), ...sheen([[[11, 31.6], [13.6, 27.4]], [[13.4, 33.2], [16.8, 27.6]], [[16.4, 33.2], [19.6, 28]], [[19, 33.2], [21, 30.6]]], 0.75));
    for (const y of [29.2, 31, 32.8]) out.push(...pearl(MID, y, 0.42));
    out.push(band(body, len - 2, len + 0.9, SEA_L));
    const { crests } = waveHem(22.8 + sw, 8.2 + sw, len - 2.6, 5, 0.6);
    out.push(...foam(crests, 0.2, 0.8));
    out.push(M(band(body, 33.4, 34.8, C.coral)), F(band(body, 33.45, 33.9, C.coralLight)));
    out.push(M(T(tube(curve([18.8, 34.6], [18.6 + sw * 0.4, 36.4], [18.2 + sw, 38.8], 5), 0.8, 0.6), C.coral)), M(T(tube(curve([19.6, 34.6], [20.2 + sw * 0.4, 36], [20.6 + sw, 38], 5), 0.8, 0.6), C.coral)), ...bow(19.2, 34.1, 0.85, C.coral, C.coralDark));
    out.push(...scallop(MID - 2.8, 27.4, 2.8, 98, 214, { ribs: 5 }), ...scallop(MID + 2.8, 27.4, 2.8, -34, 82, { ribs: 5 }), ...pearl(MID, 27.4, 0.62));
    return out;
  },
  sleeve: () => SEA,
  longSleeves: () => true,
  // A little scallop over the shoulder.
  shoulder(t, p, s) {
    return [E(0, 0.6, 2.4, 2.1, SEA), ...scallop(0.4 * s, 1.8, 3.4, s > 0 ? -10 : 76, s > 0 ? 104 : 190, { ribs: 5 })];
  },
  legs: () => ({ top: SEA_D, low: SEA_D, pad: null }),
  // A sea-glass underskirt below the robe, its hem rolling in waves.
  skirt() {
    const { pts, crests } = waveHem(23.8, 7.4, 45.6, 5, 1.4);
    const out = [T([[10, 34.2], [21.2, 34.2], [22.4, 41], ...pts, [8.6, 41]], C.glass), R(10, 34.2, 11.2, 1.4, C.glassDark)];
    out.push(...crests.map(([x, y]) => F(E(x, y - 1.2, 0.8, 0.5, C.glassLight))));
    return out;
  },
  // Pearl slippers with a little scallop over each toe.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      k.shaft(1.1, c(SEA_L), 3.1), metal(k.sole(c(C.pearl))), M(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.pearlShade))),
      M(k.poly([[0, 1.6], [-2.2, 0.4], [-1.8, -0.8], [-0.6, -1.4], [0.6, -1.4], [1.8, -0.8], [2.2, 0.4]], c(C.shell))),
      F(k.poly([[0, 1.4], [-0.9, -1.1], [-0.6, -1.2]], c(C.shellRidge))), F(k.poly([[0, 1.4], [0.9, -1.1], [0.6, -1.2]], c(C.shellRidge))),
    ];
  },
  // White gloves with a bracelet of sea-glass beads.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    const out = [limb(...at(0.8), ...at(2.4), 3.6, 3.4, '#ffffff')];
    for (const o of [-1.5, -0.5, 0.5, 1.5]) out.push(gemmy(E(...at(2.1, o), 0.55, 0.55, o % 1 ? C.glass : C.glassLight)));
    out.push(E(hx, hy, 2, 2, '#ffffff'), F(E(hx + 0.4, hy + 0.5, 1, 0.7, C.nacreShade)));
    return out;
  },
  // A sea-glass cape: bands of lighter water down it, foam and pearls along its waving hem.
  cape() {
    const { pts, crests } = waveHem(26.6, 4.4, 44.6, 5, 1.8);
    const out = [T([[8.6, 25.8], [22.4, 25.8], [25, 35], ...pts, [6, 35]], C.glass)];
    out.push(F(T([[7, 33], [24.6, 33], [24.9, 34.4], [6.7, 34.4]], C.glassLight)), F(T([[5.6, 39.4], [25.8, 39.4], [26, 40.4], [5.4, 40.4]], C.glassLight)));
    out.push(...foam(crests, 1.2, 0.85));
    for (const [x, y] of crests) out.push(...pearl(x, y + 0.6, 0.5));
    return out;
  },
  // A string of pearls from shoulder to shoulder through a sea-glass clasp.
  capeFront() {
    return [...strand([[10.4, 26.4], [MID - 1, 28.8]], 0.45), ...strand([[20.8, 26.4], [MID + 1, 28.8]], 0.45), ...glassDrop(MID, 29.2, 0.95)];
  },
};

// ---------- Moon Moth: the Tidepearl Corsair ----------

const thief = {
  // A little navy tricorn trimmed in pearl braid, its crown behind its upturned brim, a scallop
  // cockade with a pearl and a sprig of coral on the near side.
  hat() {
    // The crown, rising behind the turned-up brim.
    const out = [M(T([[7.6, 7], ...arc(15.5, 6.6, 7.6, 7.4, 168, 12, 12), [23.4, 7]], NAVY_D)), F(T([[9.4, 3.6], [12.4, 0.6], [15.5, -0.4], [12.6, 1.8], [10.4, 4.6]], NAVY))];
    // The brim turned up into three corners: one at each side and one out front over her brow.
    const top = [[3, 7.8], [6.2, 4.4], [10.6, 3.6], [15.5, 5.2], [20.4, 3.6], [24.8, 4.4], [28, 7.8]];
    const bottom = [[24.6, 9.2], [20.2, 8.8], [15.5, 11.4], [10.8, 8.8], [6.4, 9.2]];
    out.push(M(T([...top, ...bottom], NAVY)), F(T([[4.6, 7.2], [6.8, 5.2], [10.6, 4.4], [15.2, 5.8], [10.8, 5.4], [7.4, 6.2]], C.cordLight)));
    out.push(line([...top], 0.55, C.pearl), line([[3.1, 7.9], [6.4, 9.2], [10.8, 8.8], [15.5, 11.4], [20.2, 8.8], [24.6, 9.2], [27.9, 7.9]], 0.5, C.pearl));
    out.push(...coral([[22.2, 6.6], [23.6, 4], [24.2, 1.8]], 0.9, 0.55), ...scallop(21.4, 7.6, 2.6, 42, 138, { ribs: 5 }), ...pearl(21.4, 7.5, 0.6));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A striped shirt under a short navy jacket with pearl buttons and pearl-white lapels, a coral
  // sash knotted at the side, a pouch with a scallop on its flap at the back hip.
  top(t, p, m) {
    const sw = (m?.sway ?? 0) * 0.3;
    const torso = torsoPts();
    const out = [T(torso, SHIRT), ...[27.4, 29.2, 31, 32.8].map((y) => F(band(torso, y, y + 0.8, SEA_D)))];
    out.push(M(side(torso, MID - 2, -1, NAVY)), M(side(torso, MID + 2.6, 1, NAVY)), F(T([[10.2, 27.6], [12, 27], [11.2, 30.6], [10, 31.4]], SEA_D)));
    out.push(line([[MID - 2, 26.6], [MID - 2.4, 33.6]], 0.55, C.pearl), line([[MID + 2.6, 26.6], [MID + 2.8, 33.6]], 0.55, C.pearl));
    for (const y of [28.6, 30.6]) out.push(...pearl(MID + 3.6, y, 0.38));
    out.push(M(band(torso, 33.4, 35.4, C.coral)), F(band(torso, 33.45, 33.9, C.coralLight)));
    out.push(M(T(tube(curve([19.6, 35], [19.6 + sw * 0.4, 37], [19 + sw, 39.4], 5), 1.1, 0.8), C.coral)), M(T(tube(curve([20.4, 35], [21.2 + sw * 0.4, 36.8], [21.6 + sw, 38.8], 5), 1, 0.7), C.coralDark)), M(E(20, 34.4, 1.1, 1, C.coral)));
    out.push(M(T([[9.6, 33.4], [12.2, 33.4], [12.4, 36.6], [9.4, 36.6]], C.drift)), ...scallop(10.9, 35.6, 1.8, 50, 130, { ribs: 4, ears: false }));
    return out;
  },
  sleeve: () => NAVY,
  longSleeves: () => false,
  shoulder: () => [],
  legs: () => ({ top: NAVY, low: SHIRT, pad: null, cuff: SEA_D }),
  // The jacket's tails behind her hips.
  skirt() {
    return [T([[9.4, 34.4], [13.2, 34.4], [12.2, 40.6], [9, 39.8]], NAVY), T([[18.4, 34.4], [21.8, 34.4], [22.2, 39.8], [19.2, 40.6]], NAVY), line([[13, 34.6], [12.2, 40.4]], 0.45, C.pearl), line([[18.6, 34.6], [19.4, 40.4]], 0.45, C.pearl)];
  },
  // Navy boots with a turned-down pearl-white cuff and a sea-glass buckle.
  shoe(t, p, k) {
    const c = k.tint;
    return [
      M(k.shaft(3.8, c(NAVY), 3)), M(k.sole(c(NAVY))), M(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.drift))),
      M(k.poly([[-2.5, -5.4], [2.5, -5.4], [2.3, -3.8], [-2.3, -3.8]], c(C.pearl))), k.dot(0.6, -0.4, 0.62, c(C.glass)),
    ];
  },
  // Navy fingerless gloves with a bracelet of sea-glass beads.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    const out = [M(limb(...at(0.6), ...at(2.2), 3.4, 3.4, NAVY))];
    for (const o of [-1.4, -0.45, 0.45, 1.4]) out.push(gemmy(E(...at(2.6, o), 0.5, 0.5, o > 0 ? C.glass : C.glassLight)));
    out.push(M(E(hx, hy, 2, 2, NAVY)), F(E(hx - 0.5, hy - 0.6, 0.8, 0.6, SEA_D)));
    return out;
  },
  // A long coral scarf's two tails streaming from the back of her neck, a pearl weighting each.
  cape() {
    const out = [];
    for (const [pts, w, c] of [[[[11.6, 26.4], [6.6, 32], [3.6, 39.4]], 2.6, C.coralDark], [[[12.8, 26.6], [9.6, 34], [7.8, 43]], 2.4, C.coral]]) {
      out.push(M(T(tube(curve(...pts, 8), w, w * 0.8), c)), line(curve(pts[0], pts[1], pts[2], 6), 0.4, C.coralLight, 0.3), ...pearl(pts[2][0], pts[2][1] + 0.9, 0.85));
    }
    return out;
  },
  // The coral scarf wound round her neck, knotted at the side with a pearl.
  capeFront() {
    const wrap = [[9.8, 25], [21.4, 25], [22, 27], [19.6, 28.4], [15.6, 28.8], [11.6, 28.4], [9.2, 27]];
    return [T(wrap, C.coral), F(T([[10.2, 25.2], [21, 25.2], [21.2, 25.9], [10, 25.9]], C.coralLight)), line([[10.4, 26.8], [15.6, 27.6], [20.8, 26.8]], 0.35, C.coralDark), M(E(19.4, 27.9, 1.3, 1.1, C.coralDark)), ...pearl(19.4, 27.9, 0.62)];
  },
};

// ---------- Sunfeather: the Tidepearl Ranger ----------

const archer = {
  // A soft sea-blue beret tipped back, a navy band trimmed with pearls, two white seabird
  // feathers sweeping back from it and a scallop badge with a pearl.
  hat(t, p, m) {
    const sw = m?.hair ?? 0;
    const out = [...feather(curve([8.4, 7.6], [3.6 + sw * 0.4, 2.4], [-0.6 + sw, -3.4], 12), 2.6, GULL), ...feather(curve([9.2, 7.2], [6 + sw * 0.4, 0.8], [3.2 + sw, -5.2], 12), 2.4, GULL)];
    out.push(T([[4.4, 9.6], [3.6, 6.6], [6.4, 3.6], [11.6, 1.8], [18, 1.4], [24, 2.8], [27.6, 5.4], [27.4, 8.4], [24.6, 9.6]], SEA), F(T([[6, 6], [8.6, 3.6], [13.2, 2.4], [9.6, 4.4], [7, 7.4]], SEA_L)), F(T([[18, 7], [24, 4], [27, 6.6], [26.4, 8.6]], SEA_D)));
    out.push(M(E(15.6, 1.6, 0.9, 0.7, SEA_D)));
    out.push(M(T([[5.4, 8.4], [25.8, 8.4], [26, 10.4], [5.2, 10.4]], NAVY)), line([[5.4, 10.2], [26, 10.2]], 0.3, C.pearl));
    for (let x = 6.6; x < 25; x += 2.6) out.push(...pearl(x, 9.3, 0.4));
    out.push(...scallop(21.6, 10, 2.8, 40, 140, { ribs: 5 }), ...pearl(21.6, 9.8, 0.6));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  // A white shirt under a vest of mother-of-pearl scales, open down the front; a sea-silk baldric
  // with a pearl at its buckle; a navy belt with a scallop clasp.
  top() {
    const torso = torsoPts();
    const out = [T(torso, SHIRT)];
    for (const [x, keep] of [[MID - 1.4, -1], [MID + 1.4, 1]]) out.push(metal(side(torso, x, keep, C.nacre)));
    for (let row = 0, y = 27.8; y < 33.6; row++, y += 1.15) {
      for (let x = 10.6 + (row % 2) * 0.7; x < 21.2; x += 1.4) if (Math.abs(x - MID) > 2) out.push(line(arc(x, y, 0.72, 0.6, 200, 340, 5), 0.22, C.nacreShade, 0.18));
    }
    out.push(...sheen([[[10.4, 31.4], [13, 27.6]], [[17.8, 32.6], [20.8, 28.6]]], 0.7));
    out.push(F(R(MID - 1.8, 26.8, 0.4, 7, C.nacreShade)), F(R(MID + 1.4, 26.8, 0.4, 7, C.nacreShade)));
    out.push(M(T(tube([[20.4, 26.4], [15.6, 30.4], [10.6, 34.6]], 1.5), SEA_D)), line([[20.2, 26.6], [15.4, 30.6], [10.6, 34.4]], 0.3, C.cordLight), ...pearl(15.7, 30.4, 0.75));
    out.push(M(band(torso, 33.6, 35.2, NAVY)), ...scallop(MID, 35, 1.8, 30, 150, { ribs: 4, ears: false }));
    return out;
  },
  sleeve: () => SHIRT,
  longSleeves: () => true,
  // A little scallop on each shoulder.
  shoulder(t, p, s) {
    return [...scallop(0.4 * s, 1.6, 3.2, s > 0 ? -12 : 78, s > 0 ? 102 : 192, { ribs: 5 })];
  },
  legs: () => ({ top: SEA_D, low: SEA_D, pad: null }),
  // A short skirt of mother-of-pearl scales, its hem waving.
  skirt() {
    const { pts } = waveHem(22.4, 8.6, 38.6, 4, 1);
    const out = [metal(T([[9.4, 34.4], [21.6, 34.4], ...pts], C.nacre))];
    for (let row = 0, y = 35.6; y < 39; row++, y += 1.15) for (let x = 9.8 + (row % 2) * 0.7; x < 21.8; x += 1.4) out.push(line(arc(x, y, 0.72, 0.6, 200, 340, 5), 0.22, C.nacreShade, 0.18));
    out.push(...sheen([[[10, 38.4], [12.4, 35]], [[18.6, 38.6], [21, 35.2]]], 0.7));
    return out;
  },
  // Tall driftwood-grey boots laced with sea-silk, a starfish charm at the cuff.
  shoe(t, p, k) {
    const c = k.tint;
    const out = [M(k.shaft(5.6, c(C.drift), 3.1)), M(k.sole(c(C.drift))), M(k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], c(C.driftDark)))];
    for (const y of [-4.4, -2.9, -1.4]) out.push(F(k.poly([[-1, y], [1, y + 0.9], [1, y + 1.3], [-1, y + 0.4]], c(SEA_D))), F(k.poly([[1, y], [-1, y + 0.9], [-1, y + 1.3], [1, y + 0.4]], c(SEA_D))));
    out.push(M(k.poly([[-2.5, -6.8], [2.5, -6.8], [2.3, -5.2], [-2.3, -5.2]], c(C.driftLight))));
    const star = Array.from({ length: 10 }, (_, i) => {
      const a = ((i * 36 - 90) * Math.PI) / 180;
      const r = i % 2 ? 0.45 : 1.1;
      return [1.9 + Math.cos(a) * r, -5.6 + Math.sin(a) * r];
    });
    out.push(M(k.poly(star, c(C.star))), k.dot(1.9, -5.6, 0.25, c(C.starDark)));
    return out;
  },
  // A mother-of-pearl arm guard laced with sea-silk, over a driftwood-grey glove.
  hand(t, p, hx, hy, ex, ey) {
    const at = forearm(hx, hy, ex, ey);
    const out = [metal(limb(...at(1.2), ...at(4.3), 3.8, 4.5, C.nacre)), F(limb(...at(2.2, -1.3), ...at(3.6, 1.4), 0.7, 0.7, C.sheenBlue))];
    for (const d of [1.9, 3.2]) out.push(F(T([at(d, -1.2), at(d + 0.25, -1.2), at(d + 0.95, 1.2), at(d + 0.7, 1.2)], SEA_D)), F(T([at(d + 0.7, -1.2), at(d + 0.95, -1.2), at(d + 0.25, 1.2), at(d, 1.2)], SEA_D)));
    out.push(M(E(hx, hy, 2.1, 2.1, C.driftDark)), F(E(hx - 0.5, hy - 0.6, 0.9, 0.6, C.drift)));
    return out;
  },
  // A short sea-blue capelet behind, a fringe of white seabird feathers along its hem.
  cape() {
    const out = [];
    for (let i = 0; i < 7; i++) out.push(...featherDown(6.2 + i * 3.1, 32.6 + Math.sin((Math.PI * i) / 6) * 0.8, 4.6, 1.3, i % 2 ? '#ffffff' : GULL.tip, GULL.barb));
    out.push(T([[8.6, 25.6], [22.4, 25.6], [25, 31], [25.4, 34.2], [15.5, 35], [5.6, 34.2], [6, 31]], SEA), F(T([[5.8, 33], [25.2, 33], [25.4, 34.2], [15.5, 35], [5.6, 34.2]], SEA_D)));
    return out;
  },
  // The capelet over her shoulders, white feathers under its hem, a pearl clasp.
  capeFront() {
    const shape = [[8.6, 25.6], [22.4, 25.6], [23.2, 29], [21, 30.2], [MID + 2, 30.4], [MID, 31], [MID - 2, 30.4], [10.2, 30.2], [8, 29]];
    const out = [];
    for (const [x, y] of [[10.6, 29.6], [13.4, 30.2], [17.8, 30.2], [20.6, 29.6]]) out.push(...featherDown(x, y, 2.6, 0.9, '#ffffff', GULL.barb));
    out.push(T(shape, SEA), band(shape, 29.4, 30.4, SEA_D), F(T([[9.2, 25.8], [21.8, 25.8], [22.2, 26.8], [8.8, 26.8]], SEA_L)), ...pearl(MID, 28, 0.85));
    return out;
  },
};

export default { warrior, mage, thief, archer };
