// The Pangolin Sentry's body (2026-11-26): a copy of Humphrey's copy of Tuskar's copy of the blank bases'
// bodies (render/pumpkinbutler/body.js), kept here so none of those is touched. What this copy adds:
// `pangolin`, the creature's build made into a little upright pangolin: a pear of a body with a round
// belly, short sturdy legs on big round feet, short arms held up in front of the chest (its own big head,
// scales, helmet and tail are drawn over the mannequin, render/pangolin/index.js). Its notes follow.
// Humphrey's body (2026-11-26, the Pumpkin Butler remade as Humphrey, the Basset Butler): a copy of
// Tuskar's copy of the blank bases' bodies (render/tuskar/body.js, itself a copy of
// render/mobs/blankbases.js), kept here so neither the bases nor Tuskar's copy is touched. What this
// copy adds: `hound`, the creature's build made into a little basset hound: a long low barrel of a
// body, short sturdy legs on big round paws, stubby arms with big gloved paws (his own big head, ears
// and tail are drawn over the mannequin's, render/pumpkinbutler/index.js).
//
// The bases' own notes follow.
// The other blank bases (2026-11-22, the player: "make other bases we can build on"), beside the
// kid base (blankbase.js, the Meteor Maiden's body). Each is a plain soft mannequin with the
// proportions of characters already in the game, nothing on it, to design new characters on:
//   maiden    a tall, graceful young woman, the Maidens' build (maidens.js: Kitsune Miko, Yuki-onna
//             and the rest), her head about a third of her height, narrow shoulders, long legs;
//   queen     a tall regal adult, the Queens' build (queens.js), about four and a half heads tall;
//   grownup   an adult man, the Night Manager's build (nightmanagerrig.js): broad shoulders, a
//             squarer jaw, long arms and legs;
//   creature  an upright chibi animal, the Tea Master's build (teamasterrig.js): a wide round head
//             with round ears on top and a muzzle, a round body and belly, stubby limbs, a tail;
//   player    the player character's build (render/hero.js), for reference only (never a monster's
//             body: monsters stay off the hero's body): a very big head, over half the height, on a
//             small slim body with short legs;
//   brute     a big heavy body: a small head on broad shoulders, a barrel chest, thick arms with big
//             hands, short sturdy legs (bears, golems, big bosses);
//   spirit    a floater with no legs: the body tapering below the hips into a curling wisp, hovering
//             off the ground (ghosts, wisps, spirits);
//   serpent   a human upper body on a long tail that comes down to the ground and curves away behind
//             along it, tapering to its tip (the Lamia, sea folk);
//   winged    the maiden's build with a pair of feathered wings from the shoulder blades (sky folk,
//             songbirds);
//   centaur   a maiden-sized upper body rising from the chest of a little pony: a round barrel of a
//             body on four legs of three bones each like a real horse's (blankquad.js: the elbow,
//             the knee and the fetlock in front, the stifle, the hock and the fetlock behind) on
//             small hooves, and a long flowing tail (HORSE below; blankrigs.js walks it, trots it
//             and gallops it);
//   deertaur  the same upper body, deer ears and antlers, on a deer: a lighter body with a deep
//             chest and a tucked waist, long slim legs on small split hooves, a short tail that
//             flicks up (DEER below).
// All drawn in the same units as the kid base (a third of a game pixel each), so they stand at their
// true sizes beside each other, and with the same layer names (armFu armFf handF thighF shinF footF
// thighN shinN footN tail lower wingF wingN pelvis chest neck head ears armNu armNf handN).
//
//   blankBody(kind, { tpose: true, guides: true }) -> { groups, J, order, box: [w, h], g }

import { E, T, F } from '../mobs/kit.js';
import { band, curve } from '../mobs/kidbase.js';
import { BLANK } from '../mobs/blankbase.js';

function soft(pts, n = 3) {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const o = [];
    for (let i = 0; i < q.length; i++) {
      const a = q[i];
      const b = q[(i + 1) % q.length];
      o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    q = o;
  }
  return q;
}
const blob = (pts, c, n = 3) => T(soft(pts, n), c);
const mir = (pts, cx) => pts.map(([x, y]) => [2 * cx - x, y]);

// Each body's measurements (units: a third of a game pixel; y down, the ground at `g`).
//   head [y of its middle, half-width, half-height, jaw 0 round .. 1 squarer and narrower]
//   neck [chin y, base y, half-width]; sh [y, half-width]; chest [y, half-width];
//   waist [y, half-width]; hips [y, half-width]; crotch [y, half-width];
//   arm [upper, forearm, upper width, wrist width, hand radius];
//   leg [hip joint y, hip joint half-spread, knee y, ankle y, thigh width, knee width, ankle width]
//   legs: false and lower 'ghost' | 'serpent' for a body without legs; wings: true for wings.
export const BODIES = {
  maiden: {
    box: [200, 206], g: 200, cx: 100, dx: 1,
    head: [63, 22, 24, 0.35], neck: [86, 91, 4.8], sh: [93, 13.6], chest: [101, 13.8], waist: [116, 10.6], hips: [130, 14.8], crotch: [139, 4.6],
    arm: [18.6, 18, 7.6, 5.6, 4.4], leg: [132, 6, 163, 192, 12.4, 8.6, 6.2], ears: 'human', foot: 10,
  },
  queen: {
    box: [300, 382], g: 376, cx: 150, dx: 1,
    head: [74, 33, 37, 0.42], neck: [107, 115, 9.6], sh: [125, 31], chest: [144, 31], waist: [182, 21.6], hips: [220, 32.6], crotch: [242, 8.4],
    arm: [41, 37, 15, 10.4, 8.2], leg: [224, 12.6, 298, 360, 25, 17.4, 11.8], ears: 'human', foot: 18,
  },
  grownup: {
    box: [280, 320], g: 314, cx: 140, dx: 1,
    head: [92, 35, 38, 0.55], neck: [128, 140, 11.6], sh: [154, 33], chest: [168, 33.6], waist: [194, 27.6], hips: [212, 29.6], crotch: [230, 9],
    arm: [34, 29, 15, 10, 8.6], leg: [214, 16, 257, 300, 24, 17, 12.4], ears: 'human', foot: 19,
  },
  creature: {
    box: [180, 156], g: 146, cx: 90, dx: 1,
    head: [60, 26, 22, 0], neck: [79, 81, 10], sh: [87, 14], chest: [95, 17.6], waist: [104, 19.6], hips: [112, 17], crotch: [119, 7],
    arm: [10.4, 9.4, 8.4, 6.6, 4.8], leg: [112, 8.2, 125, 138, 11, 9.4, 8.4], ears: 'round', foot: 8, tail: true, muzzle: true,
  },
  // (Tuskar: the creature's box and ground; the shoulders broad, the chest and belly a barrel, the
  // legs short and thick on big round feet, the arms short and thick)
  mammoth: {
    box: [180, 156], g: 146, cx: 90, dx: 1,
    head: [60, 26, 22, 0], neck: [80, 82, 13], sh: [87, 21], chest: [96, 26.4], waist: [106, 28.6], hips: [115, 25], crotch: [122, 9.6],
    arm: [8.6, 7.4, 13.6, 12.4, 11], leg: [116, 12, 129, 139.4, 17.4, 16, 15], ears: 'round', foot: 12, tail: true, muzzle: true,
  },
  // (Humphrey: the creature's box and ground; a long low barrel, short sturdy legs on big round paws,
  // stubby arms ending in big gloved paws)
  hound: {
    box: [180, 156], g: 146, cx: 90, dx: 1,
    head: [60, 26, 22, 0], neck: [81, 84, 10.6], sh: [90, 15.4], chest: [99, 19.4], waist: [108, 21.2], hips: [117, 19], crotch: [124, 7.6],
    arm: [10.8, 10, 8.8, 7, 5.6], leg: [118, 8.6, 129, 139.4, 11.8, 10.2, 9.2], ears: 'round', foot: 10, tail: true, muzzle: true,
  },
  // (the Pangolin Sentry: the creature's box and ground; a pear of a body, a round belly, short sturdy
  // legs on big round feet, short arms)
  pangolin: {
    box: [180, 156], g: 146, cx: 90, dx: 1,
    head: [60, 26, 22, 0], neck: [81, 84, 10.4], sh: [90, 14.6], chest: [99, 19], waist: [109, 22], hips: [118, 19.6], crotch: [125, 7.6],
    arm: [10, 9.4, 8.8, 7.2, 5.8], leg: [119, 8.8, 129.6, 139.6, 12, 10.6, 9.6], ears: 'round', foot: 10, tail: true, muzzle: true,
  },
  player: {
    box: [170, 156], g: 146, cx: 85, dx: 1,
    head: [65, 31, 34, 0.22], neck: [99, 102, 4.2], sh: [104.6, 10.4], chest: [109, 11], waist: [115, 9.8], hips: [122, 11.8], crotch: [127, 4],
    arm: [15, 13.6, 7.8, 6, 4.4], leg: [124, 7.4, 133.6, 141, 9.6, 8, 6.6], ears: 'human', foot: 8,
  },
  brute: {
    box: [300, 272], g: 264, cx: 150, dx: 1,
    head: [72, 28, 30, 0.5], neck: [98, 106, 14], sh: [120, 44], traps: true, chest: [136, 48], waist: [170, 40], hips: [196, 38], crotch: [212, 12],
    arm: [38, 33, 28, 22, 15], leg: [198, 23, 228, 252, 42, 34, 28], ears: 'human', earZ: 1.5, foot: 30,
  },
  spirit: {
    box: [210, 206], g: 200, cx: 105, dx: 1,
    head: [70, 24, 26, 0.3], neck: [94, 99, 4.6], sh: [101, 13], chest: [109, 13.4], waist: [122, 10.6], hips: [134, 13.6], crotch: [140, 4],
    arm: [18, 17, 7, 5.2, 4.2], leg: [136, 6, 165, 188, 12, 8, 6], ears: 'human', foot: 10, legs: false, lower: 'ghost',
  },
  serpent: {
    box: [260, 222], g: 214, cx: 150, dx: 1,
    head: [62, 22, 24, 0.35], neck: [85, 90, 4.8], sh: [92, 13.6], chest: [100, 13.8], waist: [114, 10.6], hips: [126, 14], crotch: [134, 4],
    arm: [18.6, 18, 7.6, 5.6, 4.4], leg: [128, 6, 160, 190, 12, 8, 6], ears: 'human', foot: 10, legs: false, lower: 'serpent',
  },
  winged: {
    box: [240, 206], g: 200, cx: 120, dx: 1,
    head: [63, 22, 24, 0.35], neck: [86, 91, 4.8], sh: [93, 13.6], chest: [101, 13.8], waist: [116, 10.6], hips: [130, 14.8], crotch: [139, 4.6],
    arm: [18.6, 18, 7.6, 5.6, 4.4], leg: [132, 6, 163, 192, 12.4, 8.6, 6.2], ears: 'human', foot: 10, wings: true,
  },
  centaur: {
    box: [270, 210], g: 204, cx: 180, dx: 1,
    head: [40, 21, 23, 0.35], neck: [62, 67, 4.6], sh: [74, 13.2], chest: [82, 13.4], waist: [97, 10.4], hips: [110, 13.6], crotch: [118, 5],
    arm: [17.6, 17, 7.4, 5.4, 4.2], leg: [112, 6, 150, 190, 12, 8.6, 6.2], ears: 'human', foot: 10, legs: false, lower: 'horse',
  },
  deertaur: {
    box: [270, 210], g: 204, cx: 180, dx: 1,
    head: [40, 21, 23, 0.35], neck: [62, 67, 4.6], sh: [74, 13.2], chest: [82, 13.4], waist: [97, 10.4], hips: [110, 13.6], crotch: [118, 5],
    arm: [17.6, 17, 7.4, 5.4, 4.2], leg: [112, 6, 150, 190, 12, 8.6, 6.2], ears: 'deer', antlers: true, foot: 10, legs: false, lower: 'deer',
  },
};

// The four-legged lower halves, in their own units about the human middle (cx) and the ground (g):
// the body's outline [x, y, how much it follows the near foreleg's upper arm, the near hind leg's
// thigh] (from the front, under the human waist, round the chest, along the belly, round the rump
// and back along the top), the legs (blankquad.js: the top joint inside the body, then each joint
// from the last, the widths at each), the far legs' offset, the hoof (`up`: the fetlock's height
// off the ground), the tail.
// The centaur's pony: a round barrel, sturdy legs, a long flowing tail.
export const HORSE = {
  name: 'pony',
  barrel: [
    [9, 106, 0, 0], [15, 118, 0, 0], [18, 132, 0.1, 0], [14, 146, 0.45, 0], [2, 154, 0.85, 0], [-12, 156, 0.4, 0], [-30, 156, 0, 0], [-50, 153, 0, 0.2],
    [-62, 153, 0, 0.7], [-78, 150, 0, 0.85], [-89, 139, 0, 0.6], [-91, 125, 0, 0.3], [-84, 114, 0, 0.1], [-68, 108, 0, 0], [-40, 111, 0, 0], [-16, 109, 0, 0], [-6, 104, 0, 0],
  ],
  fore: { top: [4, 128], bones: [[-6, 22], [2, 23], [1, 20]], w: [15, 9.6, 7, 6] },
  hind: { top: [-70, 124], bones: [[10, 26], [-17, 20], [3, 23]], w: [21, 12, 7, 6] },
  far: [-8, -2],
  hoof: { w: 10, h: 8.5, up: 11, cloven: false },
  tail: { kind: 'flow', root: [-86, 116], len: 54, w: [12, 4.5] },
};
// The deertaur's deer: a lighter body, a deep chest and a tucked waist, long slim legs on small
// split hooves, a short tail held up, flicking.
export const DEER = {
  name: 'deer',
  barrel: [
    [8, 108, 0, 0], [14, 120, 0, 0], [16, 133, 0.1, 0], [12, 145, 0.45, 0], [1, 151, 0.85, 0], [-12, 152, 0.4, 0], [-28, 150, 0, 0], [-42, 147, 0, 0.2],
    [-54, 148, 0, 0.7], [-68, 146, 0, 0.85], [-78, 137, 0, 0.6], [-80, 124, 0, 0.3], [-74, 114, 0, 0.1], [-60, 109, 0, 0], [-36, 111, 0, 0], [-16, 109, 0, 0], [-6, 105, 0, 0],
  ],
  fore: { top: [3, 128], bones: [[-5, 20], [2, 24], [1, 24]], w: [12, 7.4, 5.4, 4.4] },
  hind: { top: [-62, 122], bones: [[11, 23], [-19, 22], [3, 29]], w: [17, 9.4, 5.4, 4.4] },
  far: [-7, -2],
  hoof: { w: 7, h: 6.5, up: 8, cloven: true },
  tail: { kind: 'flag', root: [-78, 116], len: 15, w: [9, 6] },
};
const LOWER = { horse: HORSE, deer: DEER };
// (a leg's joints at rest, from its top)
const jointsOf = (G) => G.bones.reduce((js, b) => [...js, [js[js.length - 1][0] + b[0], js[js.length - 1][1] + b[1]]], [G.top]);

// The head: round on top, the cheeks and jaw drawn in by `jaw`, the chin a little lower for a grown
// one.
// The serpent's tail pieces: [group, centre line, width at its start, width at its end]. Along the
// ground the line sits half its width up, so the tail lies on the ground as it tapers.
const SERPENT = (cx, g) => [
  ['tailC', [[cx - 100, g - 6], [cx - 111, g - 6], [cx - 119, g - 10], [cx - 121, g - 18], [cx - 115, g - 23.6]], 12, 3],
  ['tailB', [[cx - 62, g - 10], [cx - 82, g - 8], [cx - 100, g - 6]], 20, 12],
  ['tailA', [[cx - 22, g - 13], [cx - 42, g - 11.5], [cx - 62, g - 10]], 26, 20],
  ['lower', [[cx, 124], [cx + 5, 150], [cx + 4, 174], [cx - 4, g - 17], [cx - 22, g - 13]], 31, 26],
];

function headPts(cx, cy, rx, ry, jaw) {
  return Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2 - Math.PI / 2;
    const s = Math.sin(a);
    const low = Math.max(0, s);
    const kx = 1 - jaw * 0.34 * low * low;
    const ky = 1 + jaw * 0.08 * low;
    return [cx + Math.cos(a) * rx * kx, cy + s * ry * ky];
  });
}

// Its shape for the smooth skinned body (blankskin.js), at rest, in its own units: the torso's
// outline down each side (near, far), the spine's joints (the neck's base where the collarbones
// meet, the ribs, the navel), where its shoulders are, the levels its construction lines sit at,
// the neck, and its arms', legs' and feet's sizes.
// (The outline's shoulder runs from the neck down the trapezius to the top of the round shoulder
// muscle (the deltoid, a disc on the arm) and round inside it to the armpit, so the arm's top meets
// it level and nothing pokes up as the arm turns; the armpit's below it, the side of the chest.)
export function skinSpec(kind) {
  const B = BODIES[kind];
  const { cx, g } = B;
  const hx = cx + B.dx;
  const [chinY, neckY, neckW] = B.neck;
  const [shY, shW] = B.sh;
  const [, , aw0, aw1, hr] = B.arm;
  const [, hipJX, , ankY, tw, kw, anw] = B.leg;
  const z = hr / 4.4;
  const [cy, cw] = B.chest;
  const [wy, ww] = B.waist;
  const [pyH, pw0] = B.hips;
  const [qy, qw] = B.crotch;
  const ball = aw0 * 0.56;
  // (The hips at least as wide as the thighs below them, and their lower edge running straight down
  // into each thigh's outer edge, so a thigh never pokes out from under them.)
  const legsOn = B.legs !== false;
  const thighOut = legsOn ? hipJX + tw * 0.52 : 0;
  const pw = Math.max(pw0, thighOut);
  const trap = B.traps ? [cx + shW * 0.55, shY - aw0 * 0.54] : [cx + neckW + (shW - neckW) * 0.45, neckY + (shY - ball - neckY) * 0.6];
  const pit = [cx + Math.max(cw, shW * 0.94), shY + aw0 * 0.95];
  const chestSide = [cx + cw, cy + (wy - cy) * 0.25];
  const right = [
    [hx + neckW * 1.05, neckY - 0.4 * z],
    trap,
    [cx + shW - aw0 * 0.12, shY - ball],
    [cx + shW + aw0 * 0.2, shY - aw0 * 0.05],
    pit,
    ...(chestSide[1] > pit[1] + aw0 * 0.3 ? [chestSide] : []),
    [cx + ww, wy],
    [cx + pw, pyH],
    [cx + Math.max(pw * 0.92, thighOut), pyH + (qy - pyH) * 0.7],
    [cx + qw, qy],
  ];
  return {
    right,
    left: right.map(([x, y]) => [2 * cx - x, y]),
    cx,
    stern: [cx, neckY + (shY - neckY) * 0.3],
    ribs: [cx, cy + (wy - cy) * 0.6],
    navel: [cx, wy + (pyH - wy) * 0.35],
    shoulder: { y: shY, w: shW, neckW },
    lines: { chest: cy + (wy - cy) * 0.3, hip: pyH - (pyH - wy) * 0.25, top: neckY + (shY - neckY) * 0.6, bottom: qy - (qy - pyH) * 0.2 },
    neck: { base: [hx, neckY + 1.6 * z], top: [hx, chinY - 6 * z], chin: chinY, w: neckW * 2 },
    arm: { aw0, ew: (aw0 + aw1) / 2, aw1, hr, ball },
    leg: { tw, kw, anw, top: pyH - (pyH - wy) * 0.4, heel: anw * 0.64, toe: B.foot, ftop: 1.8 * z, fbot: g - ankY - 0.4 * z },
    collar: [-1, 1].map((s2) => [[hx + neckW * 0.7 * s2, neckY + 3 * z], [hx + shW * 0.45 * s2, neckY + 3.8 * z], [hx + shW * 0.74 * s2, neckY + 3.2 * z]]),
    belly: B.muzzle ? { x: cx + 1, y: (cy + pyH) / 2 + 2, rx: cw * 0.62, ry: (pyH - cy) * 0.5 } : null,
    fine: 0.5 * z,
    legs: B.legs !== false,
    horse: LOWER[B.lower] ?? null,
  };
}

export function blankBody(kind, { tpose = true, guides = true } = {}) {
  const B = BODIES[kind];
  const C = BLANK;
  const { cx, g } = B;
  const hx = cx + B.dx;
  const [hy, hrx, hry, jaw] = B.head;
  const [chinY, neckY, neckW] = B.neck;
  const [shY, shW] = B.sh;
  const [ua, fa, aw0, aw1, hr] = B.arm;
  const [hipJY, hipJX, kneeY, ankY, tw, kw, anw] = B.leg;
  const groups = {};
  const use = (n) => (groups[n] ??= []);
  // Joints, standing: the arms hang a little out from the body.
  const J = {
    hip: [cx, B.hips[0]], waist: [cx, B.waist[0]], neck: [hx, chinY], crown: [hx, hy - hry],
    shF: [cx - shW, shY], elF: [cx - shW - ua * 0.12, shY + ua], wrF: [cx - shW - ua * 0.14, shY + ua + fa],
    shN: [cx + shW, shY], elN: [cx + shW + ua * 0.12, shY + ua], wrN: [cx + shW + ua * 0.14, shY + ua + fa],
    hipF: [cx - hipJX, hipJY], kneeF: [cx - hipJX, kneeY], ankF: [cx - hipJX, ankY],
    hipN: [cx + hipJX, hipJY], kneeN: [cx + hipJX, kneeY], ankN: [cx + hipJX, ankY],
    lower: [cx, B.waist[0] + (B.hips[0] - B.waist[0]) * 0.5], wingF: [cx - shW * 0.4, shY + 4], wingN: [cx + shW * 0.4, shY + 4],
    // (The serpent's tail joints: where the body meets the ground, then down the tail.)
    serp0: [cx - 22, g - 13], serp1: [cx - 62, g - 10], serp2: [cx - 100, g - 6],
  };
  const z = hr / 4.4; // (how big this body's small details are, against the kid base's)

  // Arms: a round shoulder, the upper arm, the elbow, the forearm, a mitten hand with a thumb;
  // shaded along the underside.
  const arm = (k, far) => {
    let [sh, el, wr] = [J[`sh${k}`], J[`el${k}`], J[`wr${k}`]];
    const dir = k === 'F' ? -1 : 1;
    if (tpose) {
      sh = [sh[0], sh[1] - aw0 * 0.1];
      el = [sh[0] + ua * dir, sh[1]];
      wr = [sh[0] + (ua + fa) * dir, sh[1]];
    }
    const c = far ? C.sh : C.base;
    const s = far ? C.deep : C.sh;
    const ux = tpose ? 0 : -1;
    const uy = tpose ? 1 : 0;
    const ew = (aw0 + aw1) / 2;
    use(`arm${k}u`).push(E(sh[0], sh[1], aw0 * 0.62, aw0 * 0.62, c), ...band([sh, el], aw0, ew, c), ...band([[sh[0] + ux * aw0 * 0.3, sh[1] + uy * aw0 * 0.3], [el[0] + ux * ew * 0.3, el[1] + uy * ew * 0.3]], aw0 * 0.28, ew * 0.24, s, true));
    use(`arm${k}f`).push(E(el[0], el[1], ew * 0.52, ew * 0.52, c), ...band([el, wr], ew, aw1, c), ...band([[el[0] + ux * ew * 0.3, el[1] + uy * ew * 0.3], [wr[0] + ux * aw1 * 0.3, wr[1] + uy * aw1 * 0.3]], ew * 0.24, aw1 * 0.24, s, true));
    if (!far) use(`arm${k}f`).push(...band([[el[0] - uy * ew * 0.3 * dir, el[1] - ux * ew * 0.3], [wr[0] - uy * aw1 * 0.3 * dir, wr[1] - ux * aw1 * 0.3]], ew * 0.14, aw1 * 0.12, C.lt, true));
    const [px, py] = tpose ? [wr[0] + hr * 0.9 * dir, wr[1] + 0.2 * z] : [wr[0], wr[1] + hr * 0.9];
    use(`hand${k}`).push(E(px, py, hr, hr * 0.95, c), E(px + (tpose ? -hr * 0.34 * dir : hr * 0.7), py + (tpose ? -hr * 0.7 : -hr * 0.34), hr * 0.4, hr * 0.38, c), F(E(px + (tpose ? 0.4 * dir * z : -0.6 * z), py + hr * 0.36, hr * 0.54, hr * 0.3, s)));
  };
  // Wings (winged), from the shoulder blades, behind everything: a long feathered wing each side
  // sweeping up and out, its trailing edge in rounded feathers, a lit leading edge.
  if (B.wings) {
    for (const [k, s2] of [['wingF', -1], ['wingN', 1]]) {
      const [rx0, ry0] = J[k];
      const c = s2 < 0 ? C.sh : C.base;
      const sh2 = s2 < 0 ? C.deep : C.sh;
      const X = (dx) => rx0 + dx * s2;
      // (Reaching out more than up, so a flap reads as a stroke up and down, never as horns.)
      const top = [[X(0), ry0], [X(8), ry0 - 12], [X(24), ry0 - 24], [X(44), ry0 - 32], [X(64), ry0 - 34], [X(76), ry0 - 30]];
      const feathers = [[X(74), ry0 - 22], [X(66), ry0 - 24], [X(64), ry0 - 14], [X(54), ry0 - 17], [X(52), ry0 - 6], [X(42), ry0 - 9], [X(40), ry0 + 2], [X(30), ry0 - 1], [X(26), ry0 + 8], [X(16), ry0 + 4], [X(10), ry0 + 12], [X(2), ry0 + 8]];
      use(k).push(blob([...top, ...feathers], c, 2));
      use(k).push(...band(curve([[X(2), ry0 - 2], [X(10), ry0 - 13], [X(26), ry0 - 25], [X(46), ry0 - 32], [X(64), ry0 - 33]], 3), 2.6, 1, C.lt, true));
      for (const [a2, b2] of [[[X(22), ry0 - 18], [X(28), ry0 + 2]], [[X(36), ry0 - 24], [X(41), ry0 - 4]], [[X(50), ry0 - 28], [X(53), ry0 - 11]], [[X(62), ry0 - 30], [X(65), ry0 - 19]]]) use(k).push(...band([a2, b2], 0.6, 0.6, sh2, true));
    }
  }
  arm('F', true);

  // The tail (the creature), behind its far hip: a short soft round stub.
  if (B.tail) use('tail').push(blob([[cx - 9, 108], [cx - 15, 104], [cx - 24, 106], [cx - 27, 113], [cx - 22, 119], [cx - 12, 117]], C.sh, 2), F(E(cx - 21, 110, 3.6, 2.4, C.base)));

  // Legs: the thigh up under the hips, a round knee, the shin, a foot turned the way it faces.
  for (const [k, far] of B.legs === false ? [] : [['F', true], ['N', false]]) {
    const [hxj] = J[`hip${k}`];
    const c = far ? C.sh : C.base;
    const s = far ? C.deep : C.sh;
    const top = B.hips[0] - (B.hips[0] - B.waist[0]) * 0.4;
    use(`thigh${k}`).push(blob([[hxj - tw / 2, top], [hxj + tw / 2, top], [hxj + kw / 2 + 0.2 * z, kneeY], [hxj + kw * 0.42, kneeY + kw * 0.42], [hxj - kw * 0.42, kneeY + kw * 0.42], [hxj - kw / 2 - 0.2 * z, kneeY]], c, 2), F(blob([[hxj - tw / 2 + 0.2 * z, top + 4 * z], [hxj - tw * 0.2, top + 4 * z], [hxj - kw * 0.3, kneeY + z], [hxj - kw * 0.48, kneeY + z]], s, 1)));
    use(`shin${k}`).push(E(hxj, kneeY + 0.4 * z, kw * 0.52, kw * 0.49, c), blob([[hxj - kw / 2, kneeY], [hxj + kw / 2, kneeY], [hxj + anw / 2, ankY + z], [hxj - anw / 2, ankY + z]], c, 2), F(blob([[hxj - kw * 0.46, kneeY + 1.6 * z], [hxj - kw * 0.2, kneeY + 1.6 * z], [hxj - anw * 0.2, ankY + 0.6 * z], [hxj - anw * 0.46, ankY + 0.6 * z]], s, 1)));
    if (!far) use(`shin${k}`).push(F(E(hxj + kw * 0.16, kneeY - 0.4 * z, kw * 0.18, kw * 0.13, C.lt)));
    const fl = B.foot;
    const ay = ankY;
    use(`foot${k}`).push(blob([[hxj - anw * 0.6, ay - 1.6 * z], [hxj + anw * 0.4, ay - 1.8 * z], [hxj + fl, ay + (g - ay) * 0.4], [hxj + fl, g - 0.6 * z], [hxj - anw * 0.64, g - 0.4 * z]], c), F(blob([[hxj - anw * 0.6, g - (g - ay) * 0.3], [hxj + fl, g - (g - ay) * 0.3], [hxj + fl, g - 0.6 * z], [hxj - anw * 0.64, g - 0.4 * z]], s, 1)));
  }

  // A four-legged lower half: the far legs and the tail behind everything, the body and the near legs
  // over the human hips (only for the still drawing: the rig draws it live, blankskin.js).
  const Q = LOWER[B.lower];
  if (Q) {
    const hp = (p) => [cx + p[0], p[1]];
    const legOf = (G, off, c, dark) => {
      const js = jointsOf({ ...G, top: [G.top[0] + off[0], G.top[1] + off[1]] }).map(hp);
      const out = [];
      for (let i = 0; i < 3; i++) out.push(...band([js[i], js[i + 1]], G.w[i], G.w[i + 1], c), E(js[i + 1][0], js[i + 1][1], G.w[i + 1] / 2, G.w[i + 1] / 2, c));
      const [x0, y0] = js[3];
      const { w: hw, h: hh } = Q.hoof;
      out.push(...band([[x0, y0], [x0 + hw * 0.1, g - hh]], G.w[3], hw * 0.8, c));
      out.push(blob([[x0 - hw * 0.38, g - hh], [x0 + hw * 0.4, g - hh], [x0 + hw * (Q.hoof.cloven ? 0.72 : 0.6), g], [x0 - hw * 0.46, g]], dark, 1));
      return out;
    };
    use('horseBack').push(...legOf(Q.hind, Q.far, C.sh, C.deep), ...legOf(Q.fore, Q.far, C.sh, C.deep));
    const [tx, ty] = hp(Q.tail.root);
    if (Q.tail.kind === 'flag') use('horseBack').push(...band(curve([[tx, ty + 2], [tx - 5, ty - 5], [tx - 8, ty - Q.tail.len]], 3), Q.tail.w[0], Q.tail.w[1], C.sh));
    else use('horseBack').push(...band(curve([[tx, ty], [tx - 12, ty + 14], [tx - 16, ty + 30], [tx - 12, ty + Q.tail.len]], 3), Q.tail.w[0], Q.tail.w[1], C.sh));
    use('horseFront').push(blob(Q.barrel.map(hp), C.base, 3));
    // (a soft shade along the belly)
    const ys = Q.barrel.map((p) => p[1]);
    const mid = (Math.min(...ys) + Math.max(...ys)) / 2 + 8;
    const low = Q.barrel.filter((p) => p[1] > mid).map(hp);
    use('horseFront').push(F(blob([...low, ...low.slice().reverse().map(([x, y]) => [x, y - 7])], C.sh, 2)));
    use('horseFront').push(...legOf(Q.hind, [0, 0], C.base, C.deep), ...legOf(Q.fore, [0, 0], C.base, C.deep));
  }

  // The lower body of one without legs.
  if (B.lower === 'ghost') {
    // A spirit's: flaring out from the hips into a wide, soft billow (wider than the hips, like a
    // long dress caught in a breeze), rounding under and sweeping back into one small curl at the
    // back, hovering; the far side in shade, a light down the front, two soft folds.
    const [py0, pw0] = B.hips;
    const pts = [[cx + pw0, py0 - 6], [cx + pw0 + 4, py0 + 10], [cx + pw0 + 7, py0 + 24], [cx + pw0 + 5.4, py0 + 36], [cx + pw0 - 2, py0 + 45], [cx + 2, py0 + 50], [cx - 10, py0 + 52], [cx - 20, py0 + 50.4], [cx - 27, py0 + 45], [cx - 29, py0 + 38.6], [cx - 25.6, py0 + 35.4], [cx - 22.4, py0 + 38.6], [cx - 21, py0 + 34], [cx - pw0 - 5.6, py0 + 26], [cx - pw0 - 4, py0 + 12], [cx - pw0, py0 - 6]];
    use('lower').push(blob(pts, C.base, 3));
    // (its shade, its light and its folds all begin below where the body comes down into it, coming
    // in soft and narrow, so the body runs on into it with no edge)
    use('lower').push(F(blob([[cx - pw0 - 2.7, py0 + 7], [cx - pw0 - 1.4, py0 + 11], [cx - pw0 * 0.72, py0 + 22], [cx - 14, py0 + 31], [cx - 17, py0 + 40], [cx - 22.6, py0 + 38], [cx - 21, py0 + 34], [cx - pw0 - 5, py0 + 26], [cx - pw0 - 4, py0 + 14]], C.sh, 2)));
    use('lower').push(...band(curve([[cx + pw0 + 3, py0 + 10], [cx + pw0 + 5, py0 + 18], [cx + pw0 + 5.4, py0 + 30]], 2), 0.3, 0.9, C.lt, true));
    use('lower').push(...band(curve([[cx + 4, py0 + 12], [cx + 6, py0 + 22], [cx + 4, py0 + 38], [cx - 2, py0 + 46]], 2), 0.2, 0.4, C.sh, true));
    use('lower').push(...band(curve([[cx - 5, py0 + 14], [cx - 6, py0 + 26], [cx - 11, py0 + 40]], 2), 0.2, 0.4, C.sh, true));
  } else if (B.lower === 'serpent') {
    // A serpent's, in four pieces so it can ripple (blankrigs.js): from the hips down to the ground
    // (lower), then away behind along the ground (tailA, tailB) to a tip that curls up (tailC),
    // lying on the ground all along as it tapers. A paler belly down its front and along its
    // underside, scale lines across it. Each piece ends in a round cap at the joint, drawn over the
    // next piece's start, so a bend never opens a seam.
    for (const [k, pts, w0, w1] of SERPENT(cx, g)) {
      const line = curve(pts, 3);
      const n = line.length - 1;
      const wAt = (i) => w0 + ((w1 - w0) * i) / n;
      const nrm = (i) => {
        const [ax, ay] = line[Math.max(0, i - 1)];
        const [bx, by] = line[Math.min(n, i + 1)];
        const len = Math.hypot(bx - ax, by - ay) || 1;
        return [-(by - ay) / len, (bx - ax) / len];
      };
      // (side -1: the front going down, the underside going along the ground.)
      const off = (i, d) => [line[i][0] - nrm(i)[0] * d, line[i][1] - nrm(i)[1] * d];
      use(k).push(...band(line, w0, w1, C.base));
      if (k !== 'tailC') use(k).push(E(line[n][0], line[n][1], w1 / 2, w1 / 2, C.base));
      const belly = line.map((_, i) => off(i, wAt(i) / 2 - Math.max(1.4, wAt(i) * 0.17)));
      // (The belly runs on past the joint, under the cap, to meet the next piece's.)
      const [ex, ey] = belly[n];
      const [fx, fy] = belly[n - 1];
      const el = Math.hypot(ex - fx, ey - fy) || 1;
      if (k !== 'tailC') belly.push([ex + ((ex - fx) / el) * w1 * 0.5, ey + ((ey - fy) / el) * w1 * 0.5]);
      // (on the piece from the hips, its pale belly and scale lines begin below where the body comes
      // down into it, the belly coming in narrow, so the body runs on into it with no edge)
      const from = k === 'lower' ? Math.max(0, line.findIndex((p) => p[1] > B.crotch[0] + 3)) : 0;
      const bl = belly.slice(from);
      use(k).push(...band(bl, k === 'lower' ? 0.3 : Math.max(1.2, w0 * 0.24), Math.max(0.8, w1 * 0.24), C.lt, true));
      for (let i = Math.max(1, from + 2); i < n; i += 2) {
        if (wAt(i) < 4) continue;
        use(k).push(...band([off(i, wAt(i) / 2 - 0.4), off(i, wAt(i) / 2 - Math.max(2.2, wAt(i) * 0.34))], 0.5, 0.5, C.sh, true));
      }
    }
  }

  // The torso, in two pieces that bend at the waist (blankrigs.js): the chest (the base of the neck,
  // shoulders sloping down to where the arms join, the chest, down past the waist to a round
  // bottom) over the pelvis (from just above the waist out to the hips); each runs on under the
  // other, so a bend or a sway of the hips never opens a seam. The far side in soft shade, a light
  // down the near side; collarbones, a waist line.
  const [cy, cw] = B.chest;
  const [wy, ww] = B.waist;
  const [pyH, pw] = B.hips;
  const [qy, qw] = B.crotch;
  // (`traps`: a heavy body's shoulders run level out from the neck over the tops of its thick arms.)
  const yoke = B.traps ? [[cx + shW * 0.78, shY - aw0 * 0.5], [cx + shW * 1.04, shY - aw0 * 0.56]] : [[cx + shW * 0.78, neckY + (shY - neckY) * 0.55], [cx + shW * 1.04, shY - aw0 * 0.1]];
  const below = (k) => wy + (pyH - wy) * k;
  const above = (k) => wy - (wy - cy) * k;
  const pSide = [[cx + ww * 0.93, above(0.3)], [cx + ww, wy], [cx + pw, pyH], [cx + pw * 0.9, pyH + (qy - pyH) * 0.6], [cx + qw, qy]];
  use('pelvis').push(blob([...pSide, ...mir(pSide, cx).reverse()], C.base));
  use('pelvis').push(F(blob([[cx - ww * 0.82, above(0.22)], [cx - ww * 0.76, wy], [cx - pw * 0.74, pyH], [cx - pw * 0.66, qy - 1.4 * z], [cx - pw * 0.86, pyH + (qy - pyH) * 0.6], [cx - pw * 0.96, pyH], [cx - ww * 0.98, wy], [cx - ww * 0.9, above(0.22)]], C.sh, 2)));
  use('pelvis').push(...band(curve([[cx + ww * 0.94, above(0.1)], [cx + (ww + pw) * 0.47, below(0.5)], [cx + pw * 0.94, pyH]], 2), 0.8 * z, 0.7 * z, C.lt, true));
  if (B.legs !== false) for (const s2 of [-1, 1]) use('pelvis').push(...band(curve([[cx + pw * 0.92 * s2, pyH + (qy - pyH) * 0.2], [cx + pw * 0.3 * s2, qy - 2.2 * z], [cx, qy]], 2), 0.5 * z, 0.5 * z, C.sh, true));
  const cSide = [[hx + neckW * 1.1, neckY - 0.4 * z], ...yoke, [cx + shW + aw0 * 0.3, shY + aw0 * 0.3], [cx + cw, cy + (wy - cy) * 0.2], [cx + ww, wy], [cx + ww * 0.97, below(0.36)], [cx + ww * 0.6, below(0.62)]];
  use('chest').push(blob([...cSide, ...mir(cSide, cx).reverse()], C.base));
  use('chest').push(F(blob([[cx - shW * 1.02, shY + aw0 * 0.2], [cx - shW * 0.76, shY + aw0 * 0.2], [cx - ww * 0.76, wy], [cx - ww * 0.62, below(0.55)], [cx - ww * 0.9, below(0.36)], [cx - ww * 0.98, wy], [cx - cw * 0.98, cy]], C.sh, 2)));
  use('chest').push(...band(curve([[cx + shW * 1.02, shY + aw0 * 0.3], [cx + cw * 0.94, cy], [cx + ww * 0.94, wy], [cx + ww * 0.9, below(0.34)]], 2), 0.9 * z, 0.7 * z, C.lt, true));
  for (const s2 of [-1, 1]) use('chest').push(...band(curve([[hx + neckW * 0.6 * s2, neckY + 3.4 * z], [hx + shW * 0.45 * s2, neckY + 4.2 * z], [hx + shW * 0.78 * s2, neckY + 3.6 * z]], 2), 0.5 * z, 0.4 * z, C.sh, true));
  use('chest').push(...band(curve([[cx - ww * 0.98, wy + 0.4 * z], [cx, wy + 1.8 * z], [cx + ww * 0.98, wy + 0.4 * z]], 2), 0.5 * z, 0.5 * z, C.sh, true));
  if (B.muzzle) use('chest').push(F(E(cx + 1, (cy + pyH) / 2 + 2, cw * 0.62, (pyH - cy) * 0.5, C.lt)));
  // The neck, a soft shadow under the chin.
  use('neck').push(blob([[hx - neckW * 0.9, chinY - 6 * z], [hx + neckW * 0.9, chinY - 6 * z], [hx + neckW * 1.08, neckY + 1.6 * z], [hx - neckW * 1.08, neckY + 1.6 * z]], C.base, 1), F(blob([[hx - neckW * 0.9, chinY - 2 * z], [hx + neckW * 0.9, chinY - 2 * z], [hx + neckW, chinY + 1.4 * z], [hx - neckW, chinY + 1.4 * z]], C.sh, 1)));
  // The head; ears (at the sides, or round on top for the creature); a muzzle; face guides.
  const ears = use('ears');
  if (B.ears === 'human') {
    // (`earZ`: ears sized to the head, where the body's small details are much bigger than it.)
    const ez = B.earZ ?? z;
    for (const s2 of [-1, 1]) ears.push(E(hx + (hrx - 0.8 * ez) * s2, hy + hry * 0.12, 3.6 * ez, 5.4 * ez, s2 < 0 ? C.sh : C.base), F(E(hx + (hrx - 0.4 * ez) * s2, hy + hry * 0.14, 1.8 * ez, 3.2 * ez, C.sh)));
  } else if (B.ears === 'deer') {
    // A deer's ears: long soft leaves out from the sides of the head, tipped a little up.
    for (const s2 of [-1, 1]) {
      const leaf = (len, wd, off) => {
        const a0 = -0.32;
        const [dx, dy] = [Math.cos(a0) * s2, Math.sin(a0)];
        const [nx, ny] = [-dy, dx];
        const b0 = [hx + hrx * 0.8 * s2 + dx * off, hy + hry * 0.02 + dy * off];
        const at = (u, v) => [b0[0] + dx * len * u + nx * wd * v, b0[1] + dy * len * u + ny * wd * v];
        return [at(0, -0.28), at(0.3, -0.5), at(0.68, -0.36), at(1, 0), at(0.68, 0.34), at(0.3, 0.48), at(0, 0.3)];
      };
      ears.push(blob(leaf(hrx * 0.66, hrx * 0.34, 0), s2 < 0 ? C.sh : C.base, 2), F(blob(leaf(hrx * 0.46, hrx * 0.18, hrx * 0.08), C.sh, 2)));
    }
  } else {
    for (const s2 of [-1, 1]) ears.push(E(hx + hrx * 0.74 * s2, hy - hry * 0.78, 6.6, 6.2, s2 < 0 ? C.sh : C.base), F(E(hx + hrx * 0.74 * s2, hy - hry * 0.74, 3.6, 3.4, C.sh)));
  }
  // Antlers (the deertaur's): from the crown, behind the head, each a beam curving up and out with a
  // tine up from its middle and one out from near its tip, round-ended.
  if (B.antlers) {
    for (const s2 of [-1, 1]) {
      const b0 = [hx + hrx * 0.4 * s2, hy - hry * 0.7];
      const beam = curve([b0, [b0[0] + hrx * 0.1 * s2, b0[1] - hry * 0.5], [b0[0] + hrx * 0.42 * s2, b0[1] - hry * 0.9], [b0[0] + hrx * 0.66 * s2, b0[1] - hry * 1.2]], 3);
      const at = (u) => beam[Math.round(u * (beam.length - 1))];
      const tines = [[at(0.45), [at(0.45)[0] - hrx * 0.04 * s2, at(0.45)[1] - hry * 0.42]], [at(0.78), [at(0.78)[0] + hrx * 0.3 * s2, at(0.78)[1] - hry * 0.16]]];
      const col = s2 < 0 ? C.sh : C.base;
      ears.push(...band(beam, 3.4 * z, 2 * z, col), E(...beam[beam.length - 1], z, z, col));
      for (const [p0, p1] of tines) ears.push(...band([p0, p1], 2.4 * z, 1.5 * z, col), E(...p1, 0.75 * z, 0.75 * z, col));
      ears.push(...band(beam.slice(0, -1).map(([x, y]) => [x + 0.5 * z * s2, y]), 0.6 * z, 0.4 * z, C.lt, true));
    }
  }
  use('head').push(blob(headPts(hx, hy, hrx, hry, jaw), C.base, 1));
  use('head').push(F(blob([[hx - hrx * 0.96, hy - hry * 0.2], [hx - hrx * 0.78, hy - hry * 0.2], [hx - hrx * 0.64, hy + hry * 0.6], [hx - hrx * 0.82, hy + hry * 0.5]], C.sh, 2)), F(E(hx - hrx * 0.24, hy - hry * 0.66, hrx * 0.34, hry * 0.1, C.lt)));
  if (B.muzzle) use('head').push(F(E(hx, hy + hry * 0.46, hrx * 0.42, hry * 0.32, C.lt)), F(E(hx, hy + hry * 0.26, 3.2, 2.3, C.sh)));
  if (guides) {
    const ey = hy + hry * 0.2;
    use('head').push(...band([[hx, hy - hry * 0.8], [hx, hy + hry * 0.9]], 0.6 * z, 0.6 * z, C.guide, true), ...band(curve([[hx - hrx * 0.9, ey], [hx, ey + 1.6 * z], [hx + hrx * 0.9, ey]], 3), 0.6 * z, 0.6 * z, C.guide, true));
  }
  arm('N', false);
  const order = ['wingF', 'wingN', 'horseBack', 'armFu', 'armFf', 'handF', 'tail', 'thighF', 'shinF', 'footF', 'thighN', 'shinN', 'footN', 'tailC', 'tailB', 'tailA', 'lower', 'pelvis', 'chest', 'horseFront', 'neck', 'ears', 'head', 'armNu', 'armNf', 'handN'];
  return { groups, J, order, box: B.box, g };
}
