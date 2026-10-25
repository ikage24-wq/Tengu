// Funny outfits and April Fools skins: silly hats, full-body costumes with hoods, joke shoes,
// gloves and back items, and weapon covers (a fish, a baguette, a rubber chicken...). `t` is the
// entry's index in data/outfits-fun.js; each design below is looked up by the entry's key and
// draws only the slots it dresses. Costumes are tops whose hood (hat), legs, and feet come from
// the same design. Most keep fixed colors (a banana is yellow); dyeable ones paint p.main.
// Hat bobbles, antennae, and propellers follow m.hair; tails, flaps, and balloons swing with
// m.sway; wings beat with m.flap.

import { R, E, T, F } from '../pixel.js';
import { torsoPts, band, MID, limb, mirrorX } from '../figure.js';
import { FUN_LOOKS } from '../../data/outfits-fun.js';

const WHITE = '#ffffff';
const INK = '#3a2d4f';
const RED = '#ff4a5a';
const ORANGE = '#ffb03b';
const YELLOW = '#ffe066';
const PINK = '#ff9ec0';
const CARD = '#c89a62';
const CARD_D = '#a87a48';
const TAPE = '#efe2bf';
const STEEL = '#c9ccd6';

// ---------- Geometry helpers ----------

const rad = (a) => (a * Math.PI) / 180;
// Points along an ellipse from angle a0 to a1 (degrees, 0 = right, 90 = up).
function arcPts(cx, cy, rx, ry, a0, a1, n = 16) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = rad(a0 + ((a1 - a0) * i) / n);
    return [cx + Math.cos(a) * rx, cy - Math.sin(a) * ry];
  });
}
const oval = (cx, cy, rx, ry, n = 20) => arcPts(cx, cy, rx, ry, 0, 360, n);
// The band between two ellipses over an arc.
const crescent = (o, inner, a0, a1, c) => T([...arcPts(...o, a0, a1), ...arcPts(...inner, a1, a0)], c);
// A shape with holes cut through it (eye holes, face windows), joined by zero-width bridges.
const holed = (outer, holes, c) => T([...outer, ...holes.flatMap((h) => [outer[0], ...h, h[0]])], c);
const ring = (cx, cy, rx, ry, th, c) => holed(oval(cx, cy, rx, ry), [oval(cx, cy, rx - th, ry - th)], c);
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const dots = (list, r, c) => list.map(([x, y]) => F(E(x, y, r, r, c)));
// A zigzag stroke through points (mustard, marker lines).
const zigzag = (pts, w, c) => pts.slice(1).map(([x, y], i) => F(limb(pts[i][0], pts[i][1], x, y, w, w, c)));

// ---------- Costume hoods ----------

// The hood around the face, and the opening it leaves.
const HOOD = [15.5, 13.4, 13.6, 13.2];
const OPEN = [15.5, 15.9, 9.8, 9];
const hoodFront = (c, rim) => [crescent(HOOD, OPEN, -40, 220, c), crescent([15.5, 15.9, 10.8, 10], OPEN, -38, 218, rim)];
// The back of the hood and its cowl over the shoulders; the hem sways a touch.
function hoodBack(c, m) {
  const s = m.sway * 0.3;
  return [E(15.5, 13.8, 13.6, 13.2, c), T([[4.6, 18], [26.4, 18], [23.4 + s, 25.8], [15.5 + s, 27.4], [7.6 + s, 25.8]], c)];
}
// Shapes along the hood's outer edge (spikes, fins), pointing out from angle a.
function edgeSpike(a, len, half, c, lean = 0) {
  const at = (d, r) => [HOOD[0] + Math.cos(rad(a + d)) * (HOOD[2] - 0.6) * r, HOOD[1] - Math.sin(rad(a + d)) * (HOOD[3] - 0.6) * r];
  const [tx, ty] = at(0, 1 + len / 12);
  return T([at(-half, 1), [tx + lean, ty], at(half, 1)], c);
}
// Teeth around the face opening, pointing in.
function teeth(angles, len, c) {
  return angles.map((a) => {
    const at = (d, k) => [OPEN[0] + Math.cos(rad(a + d)) * (OPEN[2] + 0.4 - k), OPEN[1] - Math.sin(rad(a + d)) * (OPEN[3] + 0.4 - k)];
    return F(T([at(-7, 0), at(0, len), at(7, 0)], c));
  });
}
const torso = (c) => T(torsoPts(), c);
const plainLegs = (c, low = c, pad = null) => () => ({ top: c, low, pad });
// A shoe's toe side: feet splay outward from the middle.
const outward = (k) => (k.at([0, 0])[0] < 15.5 ? -1 : 1);

// ---------- Designs ----------

const D = {
  // A traffic cone, white reflective stripes, leaning with the hair spring.
  cone: {
    hat: (p, m) => {
      const k = m.hair * 0.5;
      const cone = [[7.6, 7], [23.4, 7], [17.4 + k, -14.6], [13.6 + k, -14.6]];
      return [
        T([[3.4, 6.2], [27.6, 6.2], [28.6, 8.8], [2.4, 8.8]], '#e8662a'),
        T(cone, '#ff8a3c'), E(15.5 + k, -14.6, 1.9, 1, '#ff8a3c'),
        F(T([[19.8, 6.4], [21.2, 6.4], [17.2 + k, -13.4], [16.6 + k, -13.4]], '#ffb47a')),
        band(cone, -3.6, -0.6, WHITE), band(cone, -10.8, -8.4, WHITE),
      ];
    },
  },

  // A crinkled paper bag with eye holes and a marker smile.
  paperbag: {
    tucks: true,
    bangs: true,
    hat: () => {
      const bag = [[2.6, 26.8], [2.2, 8], [2.8, -1.4], [5.6, -3], [8.4, -1.2], [11, -3.4], [13.8, -1.4], [16.6, -3.6], [19.4, -1.2], [22, -3.2], [24.8, -1.4], [27.8, -2.8], [28.8, 8], [28.4, 26.8]];
      const holes = [oval(11.2, 18.2, 3, 3.4, 14), oval(19.8, 18.2, 3, 3.4, 14)];
      const marker = '#5a4030';
      return [
        holed(bag, holes, '#d9b07a'),
        T([[2.7, 1.6], [28.4, 1.6], [28.5, 3.4], [2.6, 3.4]], '#c49a64'),
        ring(11.2, 18.2, 3.6, 4, 0.7, '#a47a4a'), ring(19.8, 18.2, 3.6, 4, 0.7, '#a47a4a'),
        F(crescent([15.5, 21.6, 4.6, 2.8], [15.5, 21.6, 3.8, 2], 200, 340, marker)),
        F(E(6.6, 23.2, 1.5, 0.9, '#ff8fa0')), F(E(24.4, 23.2, 1.5, 0.9, '#ff8fa0')),
        F(R(25.6, 6, 0.6, 6, '#c49a64')),
      ];
    },
  },

  // Round fake glasses with bushy brows, a big pink nose, and a mustache.
  groucho: {
    hat: () => {
      const frame = '#2b2233';
      const hair = '#3b2a26';
      const brow = T([[7.4, 13.6], [10.8, 11.6], [14.2, 12.8], [13.8, 14], [11, 13.2], [7.8, 14.8]], hair);
      return [
        R(3.6, 16.8, 4.2, 0.9, frame), R(23.2, 16.8, 4.2, 0.9, frame), R(14.4, 17.2, 2.2, 0.9, frame),
        ring(11.2, 18.2, 3.8, 3.6, 0.9, frame), ring(19.8, 18.2, 3.8, 3.6, 0.9, frame),
        brow, ...mirrorX([brow]),
        E(15.5, 21, 2.3, 2.1, '#ffb0a0'), F(E(14.8, 20.3, 0.7, 0.5, WHITE)),
        T([[15.5, 22.6], [18, 22], [20.8, 22.8], [22.2, 24.6], [19.6, 24.2], [17.4, 24.8], [15.5, 24], [13.6, 24.8], [11.4, 24.2], [8.8, 24.6], [10.2, 22.8], [13, 22]], hair),
      ];
    },
  },

  // A big rainbow afro of curls, and a red clown nose.
  clownwig: {
    tucks: true,
    bangs: true,
    hat: () => {
      const cols = [RED, '#ff9f3a', YELLOW, '#7fd17a', '#5aa8ff', '#b48cff'];
      const curls = [];
      // Side puffs, the crown, then a fringe of small curls along the brow.
      [[3.6, 21, 3.2], [2.4, 15.6, 3.6], [3.4, 9.6, 3.8]].forEach(([x, y, r], i) => curls.push(E(x, y, r, r, cols[i]), E(31 - x, y, r, r, cols[5 - i])));
      [150, 120, 90, 60, 30].forEach((a, i) => curls.push(E(15.5 + Math.cos(rad(a)) * 9.6, 6 - Math.sin(rad(a)) * 6.4, 4.2, 4, cols[(i + 2) % 6])));
      [8.2, 11.8, 15.5, 19.2, 22.8].forEach((x, i) => curls.push(E(x, 6.4, 2.4, 2, cols[(i + 4) % 6])));
      return [...curls, E(15.5, 20.8, 2, 1.8, '#ff3b4a'), F(E(14.8, 20.1, 0.7, 0.6, WHITE))];
    },
    hatBack: () => [E(15.5, 12, 14.6, 11.6, '#ff9f3a')],
  },

  // A glass dome over the head with a goldfish swimming over the hair.
  fishbowl: {
    hat: () => [
      ring(15.5, 11.6, 15.2, 14.8, 1.1, '#d8f2ff'),
      F(crescent([15.5, 11.6, 13.2, 12.8], [15.5, 11.6, 12.2, 11.8], 112, 150, WHITE)), F(E(23.6, 1.8, 0.7, 0.7, WHITE)),
      crescent([15.5, 11.6, 15.4, 15], [15.5, 11.6, 14, 13.6], 238, 302, STEEL),
      T([[16.2, 0.6], [13.8, -1.2], [13.8, 2.4]], '#ff9f3a'), E(19, 0.6, 2.8, 1.7, '#ff9f3a'),
      F(E(20.4, 0.2, 0.45, 0.45, INK)), F(T([[18.4, -1], [19.6, -1], [18.4, -2]], '#ffc070')),
      ...dots([[23.4, -0.4], [24.4, -2]], 0.5, WHITE),
    ],
  },

  // A plump hen roosting in a straw nest on your head.
  chickenhat: {
    hat: (p, m) => {
      const b = m.hair * 0.4;
      return [
        E(15.5, 6.2, 11, 2.2, '#d9b07a'),
        T([[7, 2], [3, -4.6], [5.8, -3], [4.8, -6.8], [8.2, -2.4], [9.8, 1]], WHITE),
        E(14.6, 1.2, 8.4, 5.2, WHITE), E(12.8, 2, 4.2, 2.6, '#eeeaf4'), F(R(10.6, 2.6, 4, 0.5, '#d8d2e2')),
        E(20.2 + b, -8, 1.3, 1.4, RED), E(21.8 + b, -8.6, 1.3, 1.5, RED), E(23.2 + b, -7.6, 1.1, 1.2, RED),
        E(21.4 + b, -4.2, 3.4, 3.6, WHITE),
        T([[24.2 + b, -4.8], [27.6 + b, -3.6], [24.2 + b, -2.6]], ORANGE), E(24 + b, -1.6, 0.9, 1.2, RED),
        F(E(22.6 + b, -5, 0.6, 0.7, INK)),
        F(R(6, 6.6, 3, 0.5, '#b8895a')), F(R(19, 7, 4, 0.5, '#b8895a')), F(R(12, 7.4, 3, 0.5, '#b8895a')),
      ];
    },
  },

  // A beanie in bright panels with a propeller that spins with the hair spring.
  propeller: {
    hat: (p, m) => {
      const dome = [...arcPts(15.5, 8.2, 11.2, 7.4, 0, 180, 14)];
      const w = 3.2 * Math.abs(Math.cos(m.hair * 1.6)) + 0.6;
      return [
        T(dome, p.main), T(dome.filter(([x]) => x <= 10.6).concat([[10.6, 8.2]]), YELLOW), T([[20.4, 8.2], ...dome.filter(([x]) => x >= 20.4)], RED),
        E(15.5, 8.6, 9.6, 1.4, p.dark), F(E(15.5, 1.4, 1, 0.8, YELLOW)),
        R(15, -2.4, 1, 3.6, STEEL),
        E(15.3 - w, -2.6, w, 1.1, RED), E(15.7 + w, -2.6, w, 1.1, YELLOW), F(E(15.5, -2.6, 0.9, 0.9, WHITE)),
      ];
    },
  },

  // A tilted party hat with dots and a pompom, and a party blower in the mouth.
  party: {
    hat: (p, m) => {
      const k = 1.6 + m.hair * 0.4;
      const cone = [[9.4, 6.8], [20.8, 6.2], [17 + k, -12]];
      return [
        T(cone, p.main), ...dots([[13.4, 3.8], [17.6, 2.6], [16.2, -2.6], [15.4 + k * 0.6, -7.2], [12.4, 0.2]], 0.7, WHITE),
        ...[10, 12.6, 15.2, 17.8].map((x) => F(T([[x, 6.8], [x + 2.6, 6.6], [x + 1.4, 4.8]], YELLOW))),
        E(17 + k, -12.4, 2.2, 2.2, YELLOW), F(E(16.4 + k, -13, 0.7, 0.7, WHITE)),
        R(14.6, 22.4, 10.4, 2, YELLOW), ...[17.4, 20.6, 23.4].map((x) => F(R(x, 22.4, 1.2, 2, p.main))),
        E(25.6, 21.2, 1.8, 1.9, YELLOW), F(E(25.6, 21.2, 0.8, 0.8, p.main)), R(13.8, 22.6, 1.6, 1.6, '#ff6b8a'),
      ];
    },
  },

  // A slice of toast around the face, with a pat of butter melting on top.
  toast: {
    tucks: true,
    hat: () => {
      const slice = [[2.8, 26.6], [1.6, 12], ...arcPts(8.2, 2.8, 7, 6, 180, 60, 6), [15.5, -1.4], ...arcPts(22.8, 2.8, 7, 6, 120, 0, 6), [29.4, 12], [28.2, 26.6]];
      const crumb = slice.map(([x, y]) => [15.5 + (x - 15.5) * 0.86, 12.6 + (y - 12.6) * 0.86]);
      const face = [oval(15.5, 15.8, 9.6, 8.8, 20)];
      return [
        holed(slice, face, '#c07a3a'), holed(crumb, face, '#f6dca0'),
        ...dots([[6.4, 3.6], [9.4, 1.4], [23.6, 3.2], [4.8, 9], [26.2, 10.6], [5.2, 14.8]], 0.45, '#ddb070'),
        T([[17.4, 1.4], [21.4, 0.4], [22.6, 3.2], [18.4, 4.2]], '#fff2a0'), F(T([[18, 1.8], [20.6, 1.2], [20.8, 1.8], [18.2, 2.4]], WHITE)),
      ];
    },
  },

  // Salmon nigiri: a block of rice, a striped slice of salmon, and a band of nori.
  sushi: {
    hat: () => [
      E(15.5, 3.4, 10, 3.8, '#fbf8f0'), ...dots([[9, 5], [12, 6], [20, 5.6], [22.8, 4.4]], 0.5, '#e4ddca'),
      T([[4.6, 1.6], [26.4, 0.6], [27.2, -1.8], [22, -4.6], [9, -4], [4.2, -1.4]], '#ff8a6a'),
      ...[8, 12, 16.4, 20.6].map((x) => F(T([[x, 0.8], [x + 1, 0.6], [x + 2.6, -3.6], [x + 1.6, -3.8]], '#ffd2c0'))),
      T([[13.4, -4.6], [17.8, -4.8], [18, 6.6], [13.6, 6.8]], '#2f4a3a'), F(R(14.4, -3.6, 0.5, 9, '#4a6a54')),
    ],
  },

  // A gag headband: an arrow's feathers on one side, its head on the other.
  arrow: {
    hat: () => {
      const shaft = '#c9a27a';
      return [
        crescent([15.5, 13, 10.9, 10.6], [15.5, 13, 10, 9.6], 8, 172, '#7a5238'),
        limb(-1.4, 6.8, 5.6, 8.2, 1.3, 1.3, shaft),
        T([[-0.2, 6.6], [-3.6, 3.8], [-4.2, 6.4], [-1.6, 7.6]], RED), T([[-0.6, 7.8], [-3.8, 7.6], [-3, 10.2], [0.4, 8.8]], WHITE),
        limb(25.4, 12.2, 30, 13.2, 1.3, 1.3, shaft), T([[29.6, 11.2], [33.6, 13.8], [29.2, 15.4]], '#dfe6f5'),
      ];
    },
  },

  // Two bobbing balls on springy stalks.
  antennae: {
    hat: (p, m) => {
      const h = m.hair;
      const stalk = (x0, dir) => {
        const mx = x0 + dir * 1.6 + h * 0.4;
        const tx = x0 + dir * 3.6 + h;
        return [E(x0, 4.6, 1.4, 1, p.deep), limb(x0, 4.6, mx, -0.6, 1, 0.9, p.deep), limb(mx, -0.6, tx, -5.4, 0.9, 0.8, p.deep), E(tx, -6.6, 2.4, 2.4, p.main), F(E(tx - 0.7, -7.4, 0.7, 0.6, WHITE))];
      };
      return [crescent([15.5, 13, 10.9, 10.6], [15.5, 13, 10, 9.6], 10, 170, p.deep), ...stalk(10, -1), ...stalk(21, 1)];
    },
  },

  // ---------- Costumes ----------

  // A banana suit, its tip curling up over the head and the peel hanging open at the hips.
  banana: {
    tucks: true,
    hat: (p, m) => {
      const h = m.hair * 0.6;
      const H = h * 1.4;
      return [
        T([[10, 3.6], [21, 3.6], [19 + h, -6], [17.6 + H, -10.4], [15.8 + H, -10], [15.4 + h, -5.4]], '#ffe066'),
        T([[15.8 + H, -10.2], [17.6 + H, -10.6], [17.4 + H, -12.8], [16 + H, -12.6]], '#7a5238'),
        ...hoodFront('#ffe066', '#f0c840'),
        ...dots([[7.6, 5.6], [23.4, 8.8], [20.4, 2.8], [4.4, 12]], 0.5, '#9a7040'),
      ];
    },
    hatBack: (p, m) => hoodBack('#ffe066', m),
    top: () => [torso('#ffe066'), F(R(12.2, 27, 0.9, 8.4, '#f0c840')), F(R(18.4, 27, 0.9, 8.4, '#f0c840')), ...dots([[14.6, 29], [20, 32.6], [11, 33.4]], 0.6, '#9a7040')],
    legs: plainLegs('#ffe066'),
    skirt: (p, m) => {
      const s = m.sway * 0.5;
      const petal = (x0, x1) => [T([[x0, 34.2], [x1, 34.2], [(x0 + x1) / 2 + 0.6 + s, 42.4]], '#ffe066'), F(T([[x0 + 1, 34.6], [x1 - 1, 34.6], [(x0 + x1) / 2 + 0.6 + s, 40.4]], '#fff6d6'))];
      return [T(rect(9.4, 33.8, 21.8, 35.6), '#fff6d6'), ...petal(8.4, 13), ...petal(13.2, 17.8), ...petal(18, 22.6)];
    },
  },

  // A chicken suit: a combed hood with a beak, wing tufts, tail feathers, and chicken feet.
  chicken: {
    tucks: true,
    hat: () => [
      E(12.4, -0.4, 2, 2.2, RED), E(15.5, -1.8, 2.3, 2.6, RED), E(18.6, -0.4, 2, 2.2, RED),
      ...hoodFront(WHITE, '#e8e2f0'),
      T([[13.4, 5.2], [17.6, 5.2], [15.5, 8.6]], ORANGE), ...dots([[11, 4.6], [20, 4.6]], 0.8, INK),
      E(15.5, 25.6, 1.3, 1.5, RED),
    ],
    hatBack: (p, m) => hoodBack(WHITE, m),
    top: () => [
      T([[9.8, 31.4], [4.6, 27.8], [6.4, 31.2], [3.8, 32], [6.8, 33.8], [4.8, 36], [9.8, 35.6]], WHITE),
      torso(WHITE), ...[29.6, 32.4].map((y) => F(T([[12.6, y], [15.6, y + 1.4], [18.6, y], [18.6, y + 0.8], [15.6, y + 2.2], [12.6, y + 0.8]], '#e8e2f0'))),
    ],
    shoulder: () => [T([[-2.4, -1.6], [2.4, -1.6], [2.6, 2.4], [1, 4.8], [0, 3], [-1, 4.8], [-2.6, 2.4]], WHITE)],
    legs: plainLegs(WHITE, ORANGE),
    shoe: (p, k) => [k.poly([[-0.8, -1], [0.8, -1], [1, 1], [3.8, 2.2], [3.6, 3.2], [0.6, 2.6], [0.4, 3.4], [-0.4, 3.4], [-0.6, 2.6], [-3.6, 3.2], [-3.8, 2.2], [-1, 1]], k.tint(ORANGE))],
  },

  // A shark onesie: a ring of teeth around the face, a dorsal fin, a white belly, and a tail.
  shark: {
    tucks: true,
    hat: (p, m) => [
      T([[12.6, 1.4], [19, 1.6], [16 + m.hair * 0.6, -7.4], [14.2 + m.hair * 0.6, -6.6]], p.main),
      ...hoodFront(p.main, p.dark),
      ...teeth([206, 182, 158, 134, 112, 90, 68, 46, 22, -2, -26], 2.2, WHITE),
      ...dots([[4.2, 9.2], [26.8, 9.2]], 1.1, INK), ...dots([[3.8, 8.8], [26.4, 8.8]], 0.4, WHITE),
    ],
    hatBack: (p, m) => hoodBack(p.main, m),
    top: (p, m) => [
      T([[9.8, 33.6], [4.4, 29.6 - m.sway * 0.4], [6, 35], [4, 40 - m.sway * 0.4], [9.8, 37.4]], p.main),
      torso(p.main), E(MID + 0.4, 32, 4, 4.4, '#f3f6fb'), ...[19.6, 20.6].map((x) => F(R(x, 28.6, 0.6, 2.6, p.dark))),
    ],
    legs: (p) => ({ top: p.main, low: p.main, pad: null }),
  },

  // A dino onesie: spikes over the hood, eyes on top, little teeth, a belly, and a spiky tail.
  dino: {
    tucks: true,
    hat: (p, m) => [
      ...[150, 120, 90, 60, 30].map((a) => edgeSpike(a, 3.6, 10, ORANGE, m.hair * 0.4)),
      E(10.4, 3, 2.4, 2.2, p.main), E(20.6, 3, 2.4, 2.2, p.main),
      ...hoodFront(p.main, p.dark),
      ...dots([[10.4, 2.6], [20.6, 2.6]], 1.2, WHITE), ...dots([[10.8, 2.8], [21, 2.8]], 0.6, INK),
      ...teeth([128, 108, 90, 72, 52], 1.8, WHITE),
    ],
    hatBack: (p, m) => hoodBack(p.main, m),
    top: (p, m) => {
      const s = m.sway * 0.5;
      return [
        T([[10, 32.6], [2.6 + s, 36.4], [0.2 + s, 40.4], [4.4 + s, 39.4], [10.2, 37.8]], p.main),
        T([[7.4, 33.6], [6.6 + s * 0.5, 31], [9, 33.2]], ORANGE), T([[4.6 + s * 0.8, 35.2], [3.2 + s, 32.8], [6.2 + s * 0.8, 34.4]], ORANGE),
        torso(p.main), E(MID + 0.2, 32.2, 3.8, 4.4, '#fbf3d0'), ...[30.4, 32.4, 34.4].map((y) => F(R(MID - 2.4, y, 5.2, 0.5, '#e8dcae'))),
      ];
    },
    legs: (p) => ({ top: p.main, low: p.main, pad: null }),
  },

  // A frog onesie: big googly eyes on the hood, a pale belly, spots, and webbed feet.
  frog: {
    tucks: true,
    hat: (p, m) => [
      E(9.4, 1.6, 4.2, 4, p.main), E(21.6, 1.6, 4.2, 4, p.main),
      ...hoodFront(p.main, p.dark),
      ...dots([[9.4, 1.2], [21.6, 1.2]], 2.7, WHITE), ...dots([[10 + m.hair * 0.3, 1.6], [22.2 + m.hair * 0.3, 1.6]], 1.3, INK),
      ...dots([[4.2, 18.6], [26.8, 18.6]], 1.1, PINK),
    ],
    hatBack: (p, m) => hoodBack(p.main, m),
    top: (p) => [torso(p.main), E(MID + 0.2, 32.2, 4, 4.4, '#fff2b0'), ...dots([[11.2, 28.6], [20.4, 30.2], [10.8, 33.6]], 0.8, p.dark)],
    legs: (p) => ({ top: p.main, low: p.main, pad: null }),
    shoe: (p, k) => [
      k.poly([[-1.6, -1.2], [1.6, -1.2], [2.4, 0.6], [4.6, 2], [4, 3.3], [1.6, 2.8], [0, 3.5], [-1.6, 2.8], [-4, 3.3], [-4.6, 2], [-2.4, 0.6]], k.tint(p.main)),
      k.dot(4, 2.6, 0.7, p.light), k.dot(0, 3, 0.7, p.light), k.dot(-4, 2.6, 0.7, p.light),
    ],
  },

  // A cow onesie: horns, floppy ears, spots, spotted knees, and a cowbell.
  cow: {
    tucks: true,
    hat: () => {
      const horn = T([[8, 3.4], [10.8, 2.6], [8.6, -2.4], [7, -2.4]], '#f6e6c0');
      const ear = [E(2, 9, 3.2, 1.7, WHITE), F(E(1.6, 9, 1.9, 0.8, '#ffb6c8'))];
      return [horn, ...mirrorX([horn]), ...ear, ...mirrorX(ear), ...hoodFront(WHITE, '#e6e2ee'), E(20.8, 3.4, 2.8, 1.8, '#2f2a35'), E(5, 13, 1.4, 2.2, '#2f2a35'), E(9.6, 2.6, 1.6, 1.1, '#2f2a35')];
    },
    hatBack: (p, m) => hoodBack(WHITE, m),
    top: () => {
      const body = torsoPts();
      return [T(body, WHITE), E(11.4, 31, 2.4, 2.2, '#2f2a35'), E(19.8, 33.4, 2.2, 2, '#2f2a35'), E(20, 28, 1.4, 1.2, '#2f2a35'),
        band(body, 26.2, 27.6, '#c8324a'), T([[14.2, 27.4], [17, 27.4], [17.8, 31], [13.4, 31]], '#ffd23b'), F(E(15.6, 31, 0.7, 0.6, '#9a7040'))];
    },
    legs: plainLegs(WHITE, WHITE, '#2f2a35'),
  },

  // A cardboard robot: a box helmet with a face window and a bendy-straw antenna, a box body
  // with a drawn-on control panel, and silver duct-hose arms and legs.
  robot: {
    tucks: true,
    hat: (p, m) => {
      const h = m.hair * 0.4;
      return [
        T([[3, -2.4], [8.4, -2.4], [6.2, -5.8], [1.2, -4.6]], CARD_D), T([[28, -2.4], [22.6, -2.4], [24.8, -5.8], [29.8, -4.6]], CARD_D),
        holed(rect(2.4, -2.4, 28.6, 26.4), [rect(6.6, 10.4, 24.4, 24.4)], CARD),
        holed(rect(5.8, 9.6, 25.2, 25.2), [rect(6.6, 10.4, 24.4, 24.4)], CARD_D),
        F(R(13.4, -2.4, 4.2, 6.4, TAPE)), ...dots([[4.6, 0.4], [26.4, 0.4], [4.6, 7.4], [26.4, 7.4]], 0.6, '#7a5238'),
        F(R(9, 3.4, 13, 0.6, CARD_D)),
        limb(19.6, -2.4, 20.4 + h, -7.6, 1, 1, '#ff6b8a'), E(20.6 + h, -8.6, 1.5, 1.5, YELLOW),
      ];
    },
    top: () => [
      T(rect(8, 25.2, 23, 38.8), CARD), T([[8, 25.2], [4.6, 23.8], [6.4, 26.4]], CARD_D), T([[23, 25.2], [26.4, 23.8], [24.6, 26.4]], CARD_D),
      R(11.4, 28.2, 8.4, 6, CARD_D), ...dots([[13.2, 30], [15.6, 30]], 0.9, RED), F(E(18, 30, 0.9, 0.9, '#5aa8ff')),
      F(R(12.4, 32.4, 6.4, 0.7, YELLOW)), F(R(8, 36.4, 15, 0.7, TAPE)),
    ],
    sleeve: () => STEEL,
    legs: plainLegs(STEEL),
  },

  // A hot dog: you are the sausage (with a mustard squiggle), hugged by a bun on both sides.
  hotdog: {
    tucks: true,
    hat: () => {
      const mustard = arcPts(15.5, 14.6, 11.8, 11.2, 160, 20, 10).map(([x, y], i) => [x, y + (i % 2 ? 1.2 : -1.2)]);
      return [...hoodFront('#d9583a', '#b8402a'), ...zigzag(mustard, 1, '#ffd23b')];
    },
    hatBack: (p, m) => [E(1.4, 16, 4.6, 12.4, '#f0c27a'), E(29.6, 16, 4.6, 12.4, '#f0c27a'), ...hoodBack('#d9583a', m)],
    top: () => {
      const bun = [[6.6, 25], [11.6, 25.8], [12, 38.8], [7.4, 39.6], [5.8, 32]];
      return [torso('#d9583a'), ...zigzag([[14.6, 26.6], [17, 28.4], [14.4, 30.4], [17, 32.4], [14.6, 34.4], [16.8, 36]], 1.1, '#ffd23b'), T(bun, '#f0c27a'), ...mirrorX([T(bun, '#f0c27a')])];
    },
    legs: plainLegs('#d9583a'),
  },

  // ---------- Shoes ----------

  // Huge round clown shoes poking out to the sides, with a fat white lace bow.
  clownshoes: {
    shoe: (p, k) => {
      const d = outward(k);
      return [
        k.shaft(1.6, k.tint(p.dark)),
        k.poly(oval(d * 3.2, 1.2, 5.6, 2.6, 14), k.tint(p.main)),
        k.poly(oval(d * 3.2, 3, 5.2, 0.8, 10), k.tint(YELLOW)),
        k.dot(d * 6, 0.2, 0.8, p.light), k.dot(-0.6, -0.6, 0.8, WHITE), k.dot(0.6, -0.6, 0.8, WHITE),
      ];
    },
  },

  // Fluffy bunny slippers with floppy ears, button eyes, and a pink nose.
  bunnyslippers: {
    shoe: (p, k) => [
      k.poly(oval(-0.8, -3.4, 0.9, 3, 10), k.tint(p.main)), k.poly(oval(1.4, -3.6, 0.9, 3, 10), k.tint(p.main)),
      k.poly(oval(0.6, 1, 3.8, 2.4, 14), k.tint(p.main)), k.poly(oval(0.6, 2.8, 3.6, 0.7, 8), k.tint(WHITE)),
      k.dot(-0.6, 0.2, 0.45, INK), k.dot(1.8, 0.2, 0.45, INK), k.dot(0.6, 1.2, 0.55, '#ff6b8a'),
    ],
  },

  // Orange webbed duck feet, splayed out.
  duckfeet: {
    shoe: (p, k) => {
      const d = outward(k);
      const foot = [[-1.6, -1.2], [1.6, -1.2], [2.4, 0.2], [7, 0.6], [5.8, 1.6], [7.4, 2.2], [5.8, 2.6], [6.8, 3.4], [-2.2, 3.4], [-2.8, 1]];
      return [k.poly(foot.map(([x, y]) => [x * d, y]), k.tint('#ff9f3a')), k.poly([[2 * d, 1.4], [5 * d, 1.6], [5 * d, 2], [2 * d, 1.9]], k.tint('#e8762a'))];
    },
  },

  // ---------- Gloves ----------

  // A giant foam "number one" finger.
  foamfinger: {
    hand: (p, hx, hy, ex, ey) => {
      const l = Math.hypot(hx - ex, hy - ey) || 1;
      const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
      return [
        limb(hx - ux * 1.4, hy - uy * 1.4, hx - ux * 3, hy - uy * 3, 4.2, 4.4, WHITE),
        R(hx - 1, hy - 6, 2, 5, p.main), E(hx, hy - 6, 1, 1.2, p.main),
        E(hx, hy + 0.4, 2.8, 2.6, p.main), E(hx + 2.2, hy - 0.8, 1, 1.4, p.main), F(R(hx - 0.4, hy - 0.6, 0.8, 2, WHITE)),
      ];
    },
  },

  // Bright red crab pincers, open wide.
  crab: {
    hand: (p, hx, hy, ex, ey) => {
      const l = Math.hypot(hx - ex, hy - ey) || 1;
      const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
      const [nx, ny] = [-uy, ux];
      const at = (a, b) => [hx + ux * a + nx * b, hy + uy * a + ny * b];
      return [
        limb(...at(-1, 0), ...at(-3.6, 0), 3.4, 3.6, '#d8403a'),
        T([at(0, 1.6), at(4.6, 2.6), at(5.2, 0.6), at(2.6, 0.2)], RED), T([at(0, -1.4), at(3.6, -2.4), at(4, -0.8), at(2, -0.2)], RED),
        E(hx, hy, 2.3, 2.3, RED), F(E(...at(-0.4, 1), 0.6, 0.6, '#ffb0a0')),
      ];
    },
  },

  // ---------- Back items ----------

  // A striped beach towel tied on as a superhero cape.
  towel: {
    cape: (p, m) => {
      const s = m.sway;
      const h = s / 2;
      const pts = [[8.6, 26], [22.4, 26], [25 + h, 36], [26.4 + s, 47], [4.6 + s, 47], [6 + h, 36]];
      return [T(pts, p.main), band(pts, 38.4, 40, WHITE), band(pts, 41.2, 42.4, YELLOW), band(pts, 43.6, 45.2, WHITE), ...[6, 9, 12, 15, 18, 21, 24].map((x) => R(x + s, 47, 1.2, 1.4, WHITE))];
    },
    capeFront: (p) => {
      const tie = [T([[10, 26], [12.6, 26], [14.4, 28.4], [11.4, 28.8]], p.main)];
      return [...tie, ...mirrorX(tie), T([[14.8, 28.2], [13, 31.6], [15.2, 30.6]], p.main), T([[16.2, 28.2], [18, 31.6], [15.8, 30.6]], p.main), E(15.5, 28, 1.8, 1.4, p.dark)];
    },
  },

  // A bunch of balloons (one a heart) floating up behind you on strings.
  balloons: {
    cape: (p, m) => {
      const s = m.sway * 0.5;
      const bob = m.hair * 0.4;
      const list = [[-1, -5, '#ff5a6a'], [5, -11, YELLOW], [-6, -13, '#5aa8ff'], [0.6, -19, null]];
      const out = list.map(([x, y]) => F(limb(9.6, 30, x + s, y + 3.6, 0.6, 0.5, WHITE)));
      list.forEach(([x0, y0, c], i) => {
        const x = x0 + s;
        const y = y0 + (i % 2 ? bob : -bob);
        if (!c) out.push(E(x - 2.6, y - 1, 3.4, 2.4, PINK), E(x + 2.6, y - 1, 3.4, 2.4, PINK), T([[x - 5.8, y - 0.4], [x + 5.8, y - 0.4], [x, y + 3.8]], PINK), F(E(x - 3.4, y - 1.8, 1.2, 0.6, WHITE)));
        else out.push(E(x, y, 5, 3.6, c), T([[x - 1, y + 4.2], [x + 1, y + 4.2], [x, y + 3]], c), F(E(x - 2, y - 1.4, 1.2, 0.8, WHITE)));
      });
      return out;
    },
  },

  // Cardboard wings cut out with scissors, marker feathers and tape, flapping.
  cardwings: {
    cape: (p, m) => {
      const up = m.flap ? -2.6 : 0.6;
      const wing = [
        T([[10, 28 + up], [2, 23.6 + up], [-5, 24.6 + up], [-3, 29 + up], [-6.4, 32 + up], [-2, 35 + up], [-5, 38.4 + up], [2, 39 + up], [9.4, 35]], CARD),
        ...zigzag([[-2.6, 26.6 + up], [1, 28.4 + up], [-3.6, 31.6 + up], [0.4, 33.4 + up], [-2.6, 36.8 + up]], 0.5, CARD_D),
        F(limb(5.6, 29 + up * 0.6, 8.6, 33, 1.4, 1.4, TAPE)), F(limb(5.6, 33, 8.6, 29 + up * 0.6, 1.4, 1.4, TAPE)),
      ];
      return [...wing, ...mirrorX(wing)];
    },
    capeFront: () => {
      const strap = [T([[10.4, 26], [12.4, 26], [12.8, 30.4], [10.8, 30.4]], TAPE)];
      return [...strap, ...mirrorX(strap)];
    },
  },

  // A big spiral snail shell worn as a backpack.
  snail: {
    cape: (p) => [
      E(6.6, 30.4, 8.6, 8.6, p.main), E(7.4, 29.8, 6.6, 6.4, p.light), E(7, 30, 5, 4.8, p.main),
      E(7.6, 29.6, 3.4, 3.2, p.light), E(7.2, 29.8, 2, 1.9, p.main), F(E(3.6, 26.6, 1, 1.4, WHITE)),
    ],
    capeFront: () => {
      const strap = [T([[10, 26], [12.6, 26], [13.4, 31], [11, 31]], '#7a5238')];
      return [...strap, ...mirrorX(strap)];
    },
  },

  // ---------- Weapon covers (grip at (0, 0), pointing up) ----------

  // A fresh fish, held by the tail.
  fish: {
    cover: () => ({
      shapes: [
        T([[-3.6, 4.4], [0, 0.4], [3.6, 4.4], [0, 2.8]], '#6aa0d0'), R(-1, -2.6, 2, 3.4, '#8fc4e8'),
        T([[3, -14], [6.6, -10.4], [3.4, -6]], '#6aa0d0'),
        E(0, -11, 4, 9, '#8fc4e8'), E(-1.6, -10.4, 2, 6.6, '#e8f4ff'),
        T([[-1, -12], [-4.8, -9.4], [-1.2, -8.6]], '#6aa0d0'),
        F(T([[-3.4, -14.8], [3.4, -15.4], [3.4, -14.4], [-3.4, -13.8]], '#5f94c8')), ...dots([[1.4, -9.4], [1.4, -5.6], [2.6, -7.4]], 0.6, '#5f94c8'),
        E(0.8, -17.4, 1.6, 1.6, WHITE), F(E(1.1, -17.4, 0.8, 0.8, INK)), F(R(-1, -20.2, 2, 0.8, '#3a5a80')),
      ],
      blade: [-20, -2],
    }),
  },

  // A long French loaf in a bakery paper sleeve.
  baguette: {
    cover: () => ({
      shapes: [
        E(0, -23.4, 2.6, 2.2, '#d99a4e'), R(-2.6, -23.4, 5.2, 26.4, '#d99a4e'), E(0, 3, 2.6, 2.2, '#b8743a'),
        ...[-21, -16, -11, -6].map((y) => F(T([[-1.8, y + 1.6], [-0.6, y + 2], [1.8, y - 0.4], [0.6, y - 0.8]], '#f6d9a0'))),
        T([[-3.2, 4.6], [3.2, 4.6], [3.6, -3], [-3.6, -3]], '#fff6ec'), F(R(-3.4, -1.4, 6.8, 0.8, '#ff6b8a')), F(R(-3.2, 1.6, 6.4, 0.8, '#ff6b8a')),
      ],
      blade: [-25, -3],
    }),
  },

  // A squawking rubber chicken, held by its feet.
  rubberchicken: {
    cover: () => ({
      shapes: [
        limb(-0.9, 3.2, -0.5, -2, 1.2, 1.2, ORANGE), limb(0.9, 3.2, 0.5, -2, 1.2, 1.2, ORANGE),
        T([[-2.6, 4.6], [-0.4, 2.8], [-0.2, 4.6]], ORANGE), T([[2.6, 4.6], [0.4, 2.8], [0.2, 4.6]], ORANGE),
        E(0, -8, 3.4, 6.2, '#ffd84a'), E(-1.6, -8.4, 1.4, 3.4, '#f0c030'),
        limb(0, -12, 1.6, -20, 2.6, 2, '#ffd84a'), E(2, -21.4, 2.6, 2.4, '#ffd84a'),
        E(1, -24.2, 0.9, 1.1, RED), E(2.4, -24.6, 0.9, 1.2, RED), E(3.6, -23.8, 0.8, 0.9, RED),
        T([[4, -22.6], [7.6, -23.6], [4.6, -21.4]], ORANGE), T([[4.4, -21], [7.2, -19.6], [4, -20.2]], ORANGE),
        E(4, -19.2, 0.7, 1, RED), F(E(2.4, -22, 0.6, 0.6, INK)),
      ],
      blade: [-25, -2],
    }),
  },

  // A leek: white stalk with roots, fanning green leaves.
  leek: {
    cover: () => ({
      shapes: [
        ...[-1.4, 0, 1.4].map((x) => F(limb(x * 0.5, 4.4, x, 6.4, 0.6, 0.5, '#d9c9a0'))),
        R(-1.8, -8, 3.6, 12.2, '#f4f6ee'), E(0, 4.2, 1.8, 1, '#f4f6ee'), R(-1.8, -12, 3.6, 4.4, '#cfe8a0'),
        T([[-1.8, -11], [-0.2, -11], [-3.4, -25], [-5.6, -24]], '#7fd17a'),
        T([[0.4, -11], [1.8, -11], [5.6, -23.4], [3.8, -24.6]], '#7fd17a'),
        T([[-0.8, -11.6], [1, -11.6], [1.4, -27], [-0.6, -26.4]], '#4f9f5a'),
      ],
      blade: [-26, -4],
    }),
  },

  // A frying pan with a sunny-side-up egg still in it.
  pan: {
    cover: () => ({
      shapes: [
        R(-1, -7, 2, 10.4, '#3a3038'), F(E(0, 1.6, 0.4, 0.4, '#8a8090')),
        E(0, -14, 7.4, 7.4, '#4a4a58'), E(0, -14, 6, 6, '#6a6a7a'),
        E(-0.4, -13.6, 3.8, 3.2, WHITE), E(1.6, -15.4, 2.6, 2.2, WHITE),
        E(0.6, -14.6, 1.5, 1.5, '#ffc23b'), F(E(0.2, -15, 0.5, 0.5, WHITE)), F(R(-5.6, -17.6, 1, 1.4, '#9a9aaa')),
      ],
      blade: [-21, -6],
    }),
  },

  // A swirly lollipop as big as your head, with a ribbon on the stick.
  lollipop: {
    cover: () => ({
      shapes: [
        R(-0.8, -9, 1.6, 12.4, '#f8f4ee'),
        E(0, -16, 7, 7, '#ff7ab8'), E(0.6, -16.5, 5.6, 5.6, WHITE), E(0.2, -16.2, 4.3, 4.3, '#7fd8ff'),
        E(0.6, -16.6, 3, 3, WHITE), E(0.3, -16.3, 1.6, 1.6, '#ffd23b'), F(E(-3.6, -19, 0.9, 1.4, WHITE)),
        T([[0, -8.6], [-3, -10], [-3, -7.2]], '#5aa8ff'), T([[0, -8.6], [3, -10], [3, -7.2]], '#5aa8ff'), F(E(0, -8.6, 0.8, 0.8, '#3f7fd8')),
      ],
      blade: [-23, -9],
    }),
  },

  // A bendy pink pool noodle.
  noodle: {
    cover: () => {
      const n = 8;
      const mid = Array.from({ length: n + 1 }, (_, i) => {
        const y = 4 - (30 * i) / n;
        return [-((i / n) ** 2) * 3.4, y];
      });
      const top = mid[n];
      return {
        shapes: [
          T([...mid.map(([x, y]) => [x - 2.3, y]), ...mid.map(([x, y]) => [x + 2.3, y]).reverse()], '#ff7ab8'),
          ...zigzag(mid.slice(1, -1).map(([x, y]) => [x + 0.9, y]), 0.8, '#ffb0d6'),
          E(top[0], top[1], 2.3, 1, '#d14f8f'), E(mid[0][0], mid[0][1], 2.3, 1, '#ff7ab8'),
        ],
        blade: [-26, -2],
      };
    },
  },

  // A closed polka-dot umbrella with a hooked wooden handle.
  umbrella: {
    cover: () => ({
      shapes: [
        crescent([2, 3, 2.3, 2.3], [2, 3, 1, 1], 180, 360, '#8a5a3a'), R(-1.1, -2, 2.2, 5, '#8a5a3a'),
        R(-0.5, -5, 1, 4, STEEL), R(-0.4, -25, 0.8, 3.6, STEEL),
        T([[-1.4, -3.6], [1.4, -3.6], [3.6, -8], [1.2, -22], [-1.2, -22], [-3.6, -8]], '#ff5a6a'),
        F(T([[0, -4], [0.6, -4], [0.6, -21], [0.2, -21]], '#d8403a')),
        ...dots([[-1.6, -10], [1.6, -14], [-0.6, -17.6], [1.8, -7.4], [-2, -6.2]], 0.7, WHITE),
        R(-2.6, -12.6, 5.2, 1.4, '#c8324a'),
      ],
      blade: [-25, -4],
    }),
  },

  // A giant wooden spoon.
  spoon: {
    cover: () => ({
      shapes: [
        R(-1, -9, 2, 13.4, '#d9a86a'), E(0, 4.2, 1.3, 1.3, '#d9a86a'), F(E(0, 3.4, 0.45, 0.45, '#b8834a')),
        T([[-1, -8.6], [1, -8.6], [1.8, -11.4], [-1.8, -11.4]], '#d9a86a'),
        E(0, -16.4, 4.8, 6.4, '#d9a86a'), E(0.3, -16, 3.6, 5, '#c48f54'), F(E(-1.4, -18.4, 0.8, 1.6, '#f0c890')),
      ],
      blade: [-23, -9],
    }),
  },

  // A squeaky toy hammer: a striped handle and an accordion head with yellow caps.
  squeaky: {
    cover: () => ({
      shapes: [
        R(-1.1, -12, 2.2, 15.4, YELLOW), E(0, 3.4, 1.5, 1.1, YELLOW), ...[-9, -5, -1].map((y) => F(R(-1.1, y, 2.2, 1.2, RED))),
        R(-5, -19, 10, 7, RED), R(-7.6, -19.6, 2.8, 8.2, YELLOW), R(4.8, -19.6, 2.8, 8.2, YELLOW),
        ...[-2.6, 0, 2.6].map((x) => F(R(x - 0.3, -19, 0.6, 7, '#d8303e'))), F(R(-4.4, -18.2, 8.6, 0.8, '#ff9aa0')),
      ],
      blade: [-20, -12],
    }),
  },
};

// ---------- The job-module interface ----------

const of = (t) => D[FUN_LOOKS[t]?.key] ?? {};

export default {
  hat: (t, p, m) => of(t).hat?.(p, m) ?? [],
  hatBack: (t, p, m) => of(t).hatBack?.(p, m) ?? [],
  hatTucks: (t) => Boolean(of(t).tucks),
  hatHidesBangs: (t) => Boolean(of(t).bangs),
  top: (t, p, m) => of(t).top?.(p, m) ?? [torso(p.main)],
  sleeve: (t, p) => of(t).sleeve?.(p) ?? (FUN_LOOKS[t]?.colors === false ? FUN_LOOKS[t].color : p.main),
  longSleeves: () => true,
  shoulder: (t, p, side) => of(t).shoulder?.(p, side) ?? [],
  legs: (t, p, skin) => of(t).legs?.(p, skin) ?? { top: p.main, low: p.main, pad: null },
  skirt: (t, p, m) => of(t).skirt?.(p, m) ?? null,
  shoe: (t, p, k) => of(t).shoe?.(p, k) ?? [k.sole(k.tint(p.main))],
  hand: (t, p, hx, hy, ex, ey) => of(t).hand?.(p, hx, hy, ex, ey) ?? [E(hx, hy, 1.9, 1.9, p.main)],
  cape: (t, p, m) => of(t).cape?.(p, m) ?? [],
  capeFront: (t, p, m) => of(t).capeFront?.(p, m) ?? [],
  // A weapon cover: shapes around the grip at (0, 0), pointing toward -y; blade = [top, base].
  cover: (t) => (of(t).cover ?? D.fish.cover)(),
};
