// Accessories (data/outfits-acc.js): face pieces, headpieces, and wings, capes and back pieces.
// `t` is the entry's index. Face pieces and headpieces are drawn through hat()/hatBack() in the
// head's frame (eyes at (11.2, 18.2) and (19.8, 18.2), cheeks near y 22, the crown near y 1);
// back pieces through cape()/capeFront() in the body's frame (shoulders near y 26). Wings beat
// with m.flap and everything that hangs swings with m.sway or bobs with m.hair.

import { R, E, T, F, mix } from '../pixel.js';
import { MID, limb, tieBow } from '../figure.js';
import { darker, lighter } from './kit.js';
import { hoop, heart } from './casual.js';
import { ACC_LOOKS } from '../../data/outfits-acc.js';

const WHITE = '#ffffff';
const INK = '#3a2d4f';
const GOLD = '#ffd66b';
const GOLD_DK = '#c8902a';
const PINK = '#ff9ec0';

const keyOf = (t) => ACC_LOOKS[t]?.key;
const rad = (d) => (d * Math.PI) / 180;
const ring = (n, f) => Array.from({ length: n }, (_, i) => f(i));
const lerp = (a, b, u) => a + (b - a) * u;
// The two eyes, and the near and far cheeks.
const EYES = [[11.2, 18.2], [19.8, 18.2]];

// ---------- Shape helpers ----------

const star = (cx, cy, r, c, rot = 0) => T(ring(10, (i) => {
  const a = (i / 10) * Math.PI * 2 - Math.PI / 2 + rad(rot);
  const rr = i % 2 ? r * 0.45 : r;
  return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
}), c);
// (Never smaller than a pixel or so, or it reads as a grey speck.)
const sparkle = (x, y, r0, c = '#fffbe0', r = Math.max(1.2, r0)) => F(T([[x, y - r], [x + r * 0.25, y - r * 0.25], [x + r, y], [x + r * 0.25, y + r * 0.25], [x, y + r], [x - r * 0.25, y + r * 0.25], [x - r, y], [x - r * 0.25, y - r * 0.25]], c));
const gem = (x, y, r, c) => [T([[x, y - r], [x + r * 0.8, y], [x, y + r], [x - r * 0.8, y]], c), F(T([[x, y - r], [x + r * 0.8, y], [x, y]], lighter(c, 0.2))), F(E(x - r * 0.25, y - r * 0.3, r * 0.2, r * 0.2, WHITE))];
const blossom = (x, y, r, c, mid = GOLD) => [...ring(5, (i) => {
  const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
  return E(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * 0.5, c);
}), F(E(x, y, r * 0.32, r * 0.32, mid))];
const leaf = (x, y, len, w, ang, c) => {
  const [dx, dy] = [Math.cos(rad(ang)), Math.sin(rad(ang))];
  return T([[x, y], [x + dx * len * 0.5 - dy * w, y + dy * len * 0.5 + dx * w], [x + dx * len, y + dy * len], [x + dx * len * 0.5 + dy * w, y + dy * len * 0.5 - dx * w]], c);
};
// Turns points about (cx, cy) by `deg`.
const turn = (pts, cx, cy, deg) => {
  const [c, s] = [Math.cos(rad(deg)), Math.sin(rad(deg))];
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};
// A wing pair: `draw()` returns one wing's shapes as point lists to fill, built from the root at
// (MID, y0) outward; the other wing is its mirror. They're drawn `k` times bigger (the body is
// squashed into the chibi's proportions afterwards, so wings must be drawn wide to clear the
// head and hair). A beat lifts both.
function wings(m, draw, y0 = 31, k = 1.6) {
  const lift = m?.flap ? -12 : 0;
  const out = [];
  for (const dir of [-1, 1]) {
    for (const [pts, c, flat] of draw()) {
      const placed = turn(pts.map(([x, y]) => [MID + dir * (2 + x * k), y0 + y * k * 0.95]), MID, y0, lift * dir);
      out.push(flat ? F(T(placed, c)) : T(placed, c));
    }
  }
  return out;
}
const tail = (x, y, len, w, c, sw = 0, lean = 0) => T([[x - w / 2, y], [x + w / 2, y], [x + w / 2 + lean + sw, y + len], [x + lean + sw, y + len - w * 0.6], [x - w / 2 + lean + sw, y + len]], c);

// ---------- Face pieces ----------

const FACE = {
  // Oversized round glasses: thick frames reaching down to the cheeks, a keyhole bridge, two
  // streaks of glint across each lens and a dot of light on the rim.
  biground: (p) => [...EYES.flatMap(([x, y], i) => {
    const cx = x + (i ? 0.4 : -0.4);
    // (Clear lenses: only the rims and glints are drawn, so the eyes show.)
    return [hoop(cx, y + 0.6, 4.4, 4.4, 3.5, 3.5, p.main, 0, 360, 24), F(hoop(cx, y + 0.6, 4.2, 4.2, 3.7, 3.7, lighter(p.main, 0.22), 200, 300, 8)),
      F(limb(cx - 3, y - 0.2, cx - 1.6, y - 1.8, 0.6, 0.4, WHITE)), F(limb(cx + 1.6, y + 3.4, cx + 2.8, y + 2.2, 0.4, 0.3, WHITE)), F(E(cx + 2.8, y + 3, 0.4, 0.4, WHITE))];
  }), F(hoop(15.5, 18, 1.5, 1.4, 0.8, 0.7, p.main, 190, 350, 8)), F(R(3, 17.6, 2.4, 0.8, p.main)), F(R(25.6, 17.6, 2.4, 0.8, p.main))],
  // Frames whose outer corners sweep up into points, a rhinestone at each tip, faint pink lenses.
  cateye: (p) => [...EYES.flatMap(([x, y], i) => {
    const o = i ? 1 : -1;
    const frame = [[x - 3.2 * -o, y - 1.4], [x + 3.4 * -o * -1, y - 2.6], [x + 3.6 * o, y - 0.6], [x + 2.6 * o, y + 2.4], [x - 2 * o, y + 2.6], [x - 3.2 * o, y + 0.6]];
    return [F(T(frame, mix(p.main, WHITE, 0.82))), hoop(x, y + 0.1, 3.2, 2.7, 2.4, 1.9, p.main, 0, 360, 16), F(T([[x + 2.4 * o, y - 2.2], [x + 4.4 * o, y - 3.4], [x + 3.4 * o, y - 1.4]], p.main)), F(E(x + 4 * o, y - 3, 0.5, 0.5, WHITE)), F(limb(x - 1.2, y - 1.2, x + 0.2, y - 1.8, 0.5, 0.4, WHITE))];
  }), F(R(14.2, 17.4, 2.6, 0.7, p.main)), F(R(4.6, 17.2, 2.6, 0.7, p.main)), F(R(23.8, 17.2, 2.6, 0.7, p.main))],
  // Star-shaped dark lenses in gold rims, a shine across each.
  starshades: (p) => [...EYES.flatMap(([x, y]) => [star(x, y + 0.2, 4, p.main), F(star(x, y + 0.2, 3, '#3a2d4f')), F(limb(x - 1.6, y - 0.6, x + 0.2, y - 1.8, 0.6, 0.4, mix(WHITE, '#3a2d4f', 0.2))), F(E(x + 1.2, y + 1, 0.4, 0.4, WHITE))]),
    F(R(14.4, 17.6, 2.2, 0.7, p.main)), F(R(4.4, 17.2, 2.6, 0.7, p.main)), F(R(24, 17.2, 2.6, 0.7, p.main))],
  // A gold monocle over the near eye, a glint, and a fine chain to the ear.
  monocle: () => [hoop(19.8, 18.2, 3.1, 3.2, 2.5, 2.6, GOLD, 0, 360, 18), F(hoop(19.8, 18.2, 2.9, 3, 2.7, 2.8, GOLD_DK, 20, 160, 8)),
    F(limb(18.2, 16.8, 19.4, 15.8, 0.5, 0.4, WHITE)), ...ring(6, (i) => F(E(lerp(22.6, 26.4, i / 5), 19.6 + Math.sin((i / 5) * Math.PI) * 2.4, 0.35, 0.35, GOLD)))],
  // A masquerade mask: a frame round each eye (the eyes show through), sweeping up into points at
  // the temples, gems, gold rims, and a feather plume at the near side.
  masquerade: (p) => [...EYES.flatMap(([x, y], i) => {
    const o = i ? 1 : -1;
    return [T([[x + 2.4 * o, y + 1.8], [x + 4.6 * o, y - 0.4], [x + 5.6 * o, y - 4.2], [x + 2.2 * o, y - 2.4], [x + 2.9 * o, y - 0.4]], p.main),
      F(T([[x + 2.6 * o, y - 2.4], [x + 5.2 * o, y - 3.8], [x + 4.4 * o, y - 1.2]], lighter(p.main, 0.18))), hoop(x, y + 0.1, 3, 2.5, 2.2, 1.7, p.main, 0, 360, 16), F(hoop(x, y + 0.1, 2.5, 2, 2.2, 1.7, GOLD, 0, 360, 14))];
  }), T([[13.6, 17], [17.4, 17], [17, 18.8], [14, 18.8]], p.main), F(E(15.5, 17.6, 0.6, 0.6, GOLD)), ...gem(5.4, 15, 0.9, GOLD), ...gem(25.6, 15, 0.9, GOLD),
    leaf(25.4, 14.4, 7.6, 1.5, -75, WHITE), F(leaf(25.6, 14, 6.4, 0.6, -75, mix(p.main, WHITE, 0.5))), leaf(26.2, 15, 5.6, 1.1, -40, lighter(p.main, 0.25))],
  // Little hearts on both cheeks, and a sparkle by the near eye.
  heartstickers: (p) => [heart(21.8, 21.6, 1.3, p.main), heart(9.2, 21.6, 1.1, p.main), F(E(21.4, 21.1, 0.35, 0.3, WHITE)), F(E(8.9, 21.1, 0.3, 0.25, WHITE)), sparkle(24.2, 18.4, 0.9, '#fff2a8'), F(star(23.4, 23.4, 0.6, '#ffe36b'))],
  // A plaster across the near cheek, dotted, its ends rounded.
  bandaid: () => [T([[19.6, 21.4], [24.8, 20], [25.4, 21.8], [20.2, 23.2]], '#ffd9b8'), F(T([[21.4, 21.2], [23.2, 20.7], [23.6, 22.1], [21.8, 22.6]], '#ffc89a')), ...[[22, 21.5], [22.9, 21.3], [22.3, 22.1], [23.1, 21.9]].map(([x, y]) => F(E(x, y, 0.2, 0.2, '#e8a87a')))],
  // A black patch over the near eye with a gold skull-free star, its strap crossing the head.
  eyepatch: () => [F(limb(14.6, 13.2, 26.8, 16.4, 0.7, 0.7, '#1a1422')), F(limb(14.6, 13.2, 4.4, 15.6, 0.7, 0.7, '#1a1422')), T([[17, 16], [22.6, 15.8], [23, 19.4], [20, 21.4], [17.2, 19.6]], '#2a2233'), F(star(20, 18.4, 1, GOLD)), F(limb(17.6, 16.6, 19.6, 16.4, 0.4, 0.3, '#5a4a6a'))],
};

// ---------- Headpieces ----------

const HEAD = {
  // A golden ring floating over the head, bobbing, glowing, sparkles drifting off it.
  halo: (p, m) => {
    const b = (m?.hair ?? 0) * 0.25;
    const y = -3.6 + b;
    return [F(hoop(15.5, y, 8.2, 2.6, 5.2, 1.2, mix(p.main, WHITE, 0.55), 0, 360, 24)), hoop(15.5, y, 7.2, 2.1, 5.6, 1.3, p.main, 0, 360, 24), F(hoop(15.5, y - 0.3, 6.8, 1.6, 6, 1.2, lighter(p.main, 0.2), 200, 340, 10)),
      sparkle(8 - b, y - 2.6, 1, WHITE), sparkle(23.6 + b, y - 1.6, 0.7, WHITE), sparkle(20, y - 3.4, 0.5, lighter(p.main, 0.2))];
  },
  // Two small curved horns, glossy, with a ring of gold at the base and a tiny bow on one.
  devilhorns: (p) => [...[[9.6, 1], [21.4, -1]].flatMap(([x, d]) => {
    const tip = [x + d * 0.4 - (d < 0 ? -1.6 : 1.6), -3.4];
    return [T([[x - 1.6, 4.4], [x + 1.6, 4.4], [tip[0] + 0.4, tip[1] + 1.6], tip, [x - 1.2, 1.6]], p.main), F(T([[x - 0.4, 4.2], [x + 0.6, 4.2], [tip[0] + 0.2, tip[1] + 1.2]], lighter(p.main, 0.18))), F(R(x - 1.8, 3.6, 3.6, 0.8, GOLD))];
  }), ...tieBow(22.6, 1.6, '#3a2233'), sparkle(5.6, -0.4, 0.7, '#ffb3c6')],
  // A crown of flowers round the head: blossoms, buds and leaves, ribbons trailing behind.
  flowercrown: (p) => {
    const cols = [p.main, WHITE, '#ffe36b', lighter(p.main, 0.2), '#b48cff', WHITE, p.main];
    return [...ring(7, (i) => leaf(5 + i * 3.5, 6.2 - Math.sin((i / 6) * Math.PI) * 3.4, 2.4, 0.8, i % 2 ? -30 : 210, '#5fae6a')),
      ...ring(7, (i) => blossom(5.4 + i * 3.45, 7.4 - Math.sin((i / 6) * Math.PI) * 3.6, i % 3 === 0 ? 2 : 1.5, cols[i], i % 2 ? GOLD : '#ff8fb0')).flat(), sparkle(26, 2, 0.7)];
  },
  // A satin headband with two tall bunny ears, one flopped over at the tip; pink insides.
  bunnyband: (p, m) => {
    const s = (m?.hair ?? 0) * 0.5;
    const inner = mix(PINK, p.main, 0.3);
    return [hoop(15.5, 12.4, 11.6, 11, 10.6, 10, lighter(p.main, 0.05), 200, 340, 14),
      T([[9, 4], [12, 3.6], [11 + s, -6], [9.4 + s, -10], [7.6 + s, -6.4]], p.main), F(T([[9.6, 3.4], [11.2, 3.2], [10.4 + s, -5.4], [9.4 + s, -8.4], [8.4 + s, -5.6]], inner)),
      T([[19.2, 3.6], [22.2, 4], [23.4 + s, -4], [26.4 + s, -6.4], [25 + s, -7.4], [21 + s, -6]], p.main), F(T([[20, 3.2], [21.6, 3.4], [22.6 + s, -3.4], [24.4 + s, -5.8], [21.4 + s, -5.2]], inner)), ...tieBow(15.5, 2, PINK)];
  },
  // A little green sprout clipped on top: two round leaves that bob, a dewdrop.
  sprout: (p, m) => {
    const s = (m?.hair ?? 0) * 0.6;
    return [F(limb(15.5, 2.4, 15.6 + s * 0.4, -2.4, 0.6, 0.5, darker(p.main, 0.15))), leaf(15.6 + s * 0.4, -2.2, 4.4, 1.6, 200, p.main), leaf(15.6 + s * 0.4, -2.2, 4.4, 1.6, -20, p.main),
      F(leaf(15.6 + s * 0.4, -2.2, 3.2, 0.5, 200, lighter(p.main, 0.2))), F(leaf(15.6 + s * 0.4, -2.2, 3.2, 0.5, -20, lighter(p.main, 0.2))), F(E(19.4 + s * 0.4, -3.4, 0.5, 0.6, '#cfefff')), R(14.2, 2, 2.6, 1.2, PINK)];
  },
  // A small gold crown set at a jaunty tilt on the near side, three points with gems.
  tinycrown: (p) => {
    const pts = turn([[15, 4.4], [15.8, -0.8], [18, 1.8], [20, -2.8], [22, 1.8], [24.2, -0.8], [25, 4.4]], 20, 3, 14);
    return [T(pts, p.main), F(T(turn([[15.2, 3.2], [24.8, 3.2], [25, 4.4], [15, 4.4]], 20, 3, 14), darker(p.main, 0.18))), ...gem(...turn([[20, 2.2]], 20, 3, 14)[0], 1, '#ff5a7a'),
      ...turn([[15.8, -0.8], [20, -2.8], [24.2, -0.8]], 20, 3, 14).map(([x, y]) => F(E(x, y, 0.6, 0.6, WHITE))), sparkle(25.6, -1, 0.9)];
  },
  // Three gold star clips along the near side of the bangs.
  starclips: (p) => [...[[19.6, 7.2, 2.2, 10], [22.8, 9.4, 1.8, -14], [24.8, 12.2, 1.5, 20]].flatMap(([x, y, r, rot]) => [star(x, y, r, p.main, rot), F(star(x, y, r * 0.5, lighter(p.main, 0.25), rot)), F(E(x - r * 0.3, y - r * 0.3, r * 0.15, r * 0.15, WHITE))]), sparkle(18, 5.4, 0.6)],
};
const HEAD_BACK = {
  // The flower crown's ribbons trailing behind.
  flowercrown: (p, m) => {
    const sw = m?.sway ?? 0;
    return [tail(5, 8, 13, 1.6, p.main, sw, -1), tail(6.6, 8, 11, 1.4, '#b48cff', sw, -0.4)];
  },
};

// ---------- Wings, capes and back pieces ----------

function back(t, p, m) {
  const sw = m?.sway ?? 0;
  switch (keyOf(t)) {
    // Big butterfly wings: a rounded upper wing and a swallowtail lower one, dark veins and edges,
    // white spots, a light glow toward the body.
    case 'butterfly': return wings(m, () => [
      [[[0, -1], [5, -9], [11, -14], [16, -13], [17, -8], [14, -3], [6, 1]], darker(p.main, 0.35)],
      [[[0.6, -1], [5.4, -8.4], [10.6, -12.8], [15, -12], [15.8, -8], [13, -3.4], [6, 0.4]], p.main],
      [[[1, -1], [5, -6], [9, -8], [10, -5], [6, -0.6]], lighter(p.main, 0.25), true],
      [[[0, 0.4], [7, 1], [12, 5], [11, 10], [8, 9], [7, 13], [5, 9], [1, 3]], darker(p.main, 0.35)],
      [[[0.6, 0.8], [6.6, 1.6], [11, 5.2], [10.2, 8.8], [7.6, 8], [6.6, 11.6], [5, 8.4], [1.4, 3]], lighter(p.main, 0.1)],
      [[[14, -11.4], [15.4, -9.6], [13.8, -9]], WHITE, true], [[[11.6, -12], [13, -11.8], [12, -10.6]], WHITE, true], [[[9.4, 5.6], [10.4, 6.4], [9.2, 7]], WHITE, true],
    ]);
    // Little bat wings: three fingers, a scalloped trailing edge.
    case 'bat': return wings(m, () => [
      [[[0, -1], [3, -6], [8, -9], [12, -6], [11, -3], [9, -1], [8, 1], [5.4, -0.4], [4, 2], [1.6, 0.8]], p.main],
      [[[1, -1], [3.4, -5.4], [7.6, -8], [10.6, -5.6], [9.6, -3.4], [8, -1.6], [5.4, -1.6], [3, 0]], lighter(p.main, 0.12), true],
      [[[3, -6], [3.4, -6], [5.4, -0.4], [5, -0.4]], darker(p.main, 0.3), true], [[[8, -9], [8.4, -9], [9, -1], [8.6, -1]], darker(p.main, 0.3), true],
      [[[12, -6], [13.4, -7.6], [12.4, -5.6]], darker(p.main, 0.3)],
    ], 36, 2);
    // Big dragon wings: a bony arm with a claw, membranes between long fingers.
    case 'dragon': return wings(m, () => [
      [[[0, -1], [4, -9], [10, -16], [18, -18], [17, 0], [14, -2], [13, 4], [9, 2], [7, 6], [3, 3]], darker(p.main, 0.12)],
      [[[1, -1], [4.6, -8], [10, -14], [16.4, -16.4], [15.4, -1], [13, -3], [12, 2.6], [9, 1], [7, 4.4], [3.4, 2.2]], p.main],
      [[[1.6, -0.6], [5, -7], [9, -11], [8, -3], [4, 1]], lighter(p.main, 0.15), true],
      ...[[7, 6], [13, 4], [17, 0]].map(([x, y]) => [[[9.6, -14], [10.4, -14.6], [x + 0.4, y], [x - 0.4, y]], darker(p.main, 0.35), true]),
      [[[0, -1], [1.4, -2], [10.4, -15], [10, -14]], darker(p.main, 0.35)], [[[17.6, -18.6], [20, -20.4], [18.4, -17]], '#f2e6cc'],
    ], 34, 1.55);
    // Tiny heart-shaped wings, tipped outward, a lighter heart inside and a white shine.
    case 'heartwings': {
      const heartPts = (cx, cy, r, rot) => turn(ring(20, (i) => {
        const a = (i / 20) * Math.PI * 2;
        return [cx + r * Math.sin(a) ** 3, cy - (r * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))) / 16];
      }), cx, cy, rot);
      return wings(m, () => [[heartPts(6, -2, 6, 70), p.main], [heartPts(6, -2.4, 3.6, 70), lighter(p.main, 0.2), true], [[[4.6, -6.4], [6.4, -7.4], [6.8, -6], [5.2, -5.4]], WHITE, true]], 33, 1.7);
    }
    // A long red velvet cape with an ermine collar and hem (white with black tails), gold edging.
    case 'royalcape': return [T([[8, 25.4], [23, 25.4], [27.6 + sw, 53.6], [3.4 + sw, 53.6]], p.main), F(T([[9, 26], [12, 26], [7.6 + sw, 52], [5 + sw, 52]], darker(p.main, 0.15))),
      T([[3.4 + sw, 50.4], [27.6 + sw, 50.4], [27.8 + sw, 54], [3.2 + sw, 54]], WHITE), ...ring(6, (i) => F(T([[5.6 + i * 4 + sw, 51.4], [6.4 + i * 4 + sw, 51.4], [6 + i * 4 + sw, 53.2]], INK))),
      F(limb(3.6 + sw, 50.2, 27.4 + sw, 50.2, 0.5, 0.5, GOLD))];
    // A midnight cape scattered with stars and a crescent moon, gold-trimmed.
    case 'starcape': return [T([[8, 25.4], [23, 25.4], [27 + sw, 52.6], [4 + sw, 52.6]], p.main), F(T([[8, 25.4], [23, 25.4], [24 + sw, 34], [7 + sw, 34]], darker(p.main, 0.12))),
      ...[[7, 40, 1.2], [22, 44, 1], [13, 48, 0.8], [19, 36, 0.7], [9, 50, 0.9], [24, 50, 0.7]].map(([x, y, r]) => star(x + sw * 0.8, y, r, '#ffe36b')), sparkle(16 + sw * 0.6, 42, 0.8),
      T([[17 + sw, 38], [20 + sw, 37], [21.4 + sw, 40], [20 + sw, 43], [19.4 + sw, 41], [19.6 + sw, 39]], '#fff2a8'), F(limb(4 + sw, 52.2, 27 + sw, 52.2, 0.6, 0.6, GOLD))];
    // A giant satin bow tied at the back of the waist, its tails swinging.
    case 'bigbow': return [T([[MID, 31.4], [4, 25.6], [2.6, 33], [5, 37.6], [MID, 33.4]], p.main), T([[MID, 31.4], [27, 25.6], [28.4, 33], [26, 37.6], [MID, 33.4]], p.main),
      F(T([[MID, 31.8], [6, 27.6], [5, 33], [MID, 32.8]], lighter(p.main, 0.18))), F(T([[MID, 31.8], [25, 27.6], [26, 33], [MID, 32.8]], lighter(p.main, 0.18))),
      tail(13.4, 33, 15, 3.4, darker(p.main, 0.08), sw, -2), tail(17.6, 33, 14, 3.4, darker(p.main, 0.08), sw, 2), E(MID, 32.4, 2.4, 2, darker(p.main, 0.12)), F(E(MID - 0.6, 31.8, 0.8, 0.6, lighter(p.main, 0.25)))];
    // A teddy bear backpack peeking over the far shoulder: round ears, a snout, button eyes.
    case 'teddy': return [E(7.6, 33, 6, 6.4, p.main), E(6.4, 24.4, 4.2, 3.8, p.main), E(3.4, 21.6, 1.6, 1.6, p.main), E(9.4, 21.6, 1.6, 1.6, p.main),
      F(E(3.4, 21.6, 0.8, 0.8, lighter(p.main, 0.25))), F(E(9.4, 21.6, 0.8, 0.8, lighter(p.main, 0.25))), F(E(6.4, 25.6, 1.8, 1.3, lighter(p.main, 0.3))), F(E(6.4, 25, 0.6, 0.45, INK)),
      F(E(4.8, 23.6, 0.45, 0.45, INK)), F(E(8, 23.6, 0.45, 0.45, INK)), ...tieBow(6.4, 28.4, PINK), F(E(7.6, 34, 3, 3, lighter(p.main, 0.15)))];
    default: return [];
  }
}
function backFront(t, p) {
  switch (keyOf(t)) {
    // The royal cape's ermine collar and gold chain clasp.
    case 'royalcape': return [E(MID, 26, 7.2, 2.4, WHITE), ...[[10.6, 26.6], [13.6, 27.2], [17.4, 27.2], [20.4, 26.6]].map(([x, y]) => F(T([[x - 0.4, y - 0.4], [x + 0.4, y - 0.4], [x, y + 1.2]], INK))),
      F(limb(11, 27.4, 20, 27.4, 0.4, 0.4, GOLD)), ...gem(MID, 27.6, 1, '#ff5a7a')];
    // The star cape's high collar and moon clasp.
    case 'starcape': return [T([[8.4, 22.4], [11.4, 26], [9, 26.6], [7, 23]], p.main), T([[22.6, 22.4], [19.6, 26], [22, 26.6], [24, 23]], p.main), F(E(MID, 26.4, 1.1, 1.1, '#fff2a8')), F(E(MID + 0.5, 26.1, 0.9, 0.9, p.main))];
    // The teddy backpack's straps.
    case 'teddy': return [limb(11.8, 26.2, 11.2, 35.4, 1.6, 1.8, darker(p.main, 0.2)), limb(19.4, 26.2, 20, 35.4, 1.6, 1.8, darker(p.main, 0.2)), F(heart(19.7, 31.2, 0.8, PINK))];
    default: return [];
  }
}

const pick = (table, t, fallback) => table[keyOf(t)] ?? fallback;
const isFace = (t) => ACC_LOOKS[t]?.slot === 'face';

export default {
  hat: (t, p, m) => (isFace(t) ? pick(FACE, t, () => [])(p, m) : pick(HEAD, t, () => [])(p, m)),
  hatBack: (t, p, m) => pick(HEAD_BACK, t, () => [])(p, m),
  hatTucks: () => false,
  hatHidesBangs: () => false,
  top: () => [],
  sleeve: (t, p) => p.main,
  longSleeves: () => false,
  shoulder: () => [],
  legs: (t, p) => ({ top: p.main, low: p.main, pad: null }),
  skirt: () => null,
  shoe: (t, p, k) => [k.sole(k.tint(p.main))],
  hand: (t, p, hx, hy) => [E(hx, hy, 1.9, 1.9, p.main)],
  cape: back,
  capeFront: backFront,
};
