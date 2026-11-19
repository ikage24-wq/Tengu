// Persona, the Two-Faced Muse (redrawn 2026-11-19, the player's pick "C, the Ballet Muse"): the
// Masked Ball's dancer, a round cat split down the middle, gold on one side and blue on the other,
// in a leotard split the same way, a two-layer tulle tutu, leg warmers, ribbon pointe shoes and a
// star tiara, with her tail curled behind her. Her two masks are fans on short sticks, each tied
// with a ribbon, one in each paw: Comedy (gold, laughing) and Tragedy (blue, weeping).
//
// Her two faces: in Comedy she shows you her gold side, Comedy's mask in her near paw; in Tragedy
// she has turned her blue side to you, Tragedy's mask in front. She changes with a pirouette (the
// whole of her mirrored for each half turn, her other side showing as it comes round), so the
// colour she shows is always the mask she's in.
//
// How she moves:
//   Comedy  quick and light: up on her toes, bouncing; a tiptoe bourree of a walk, fans fluttering;
//           an 8 s idle act: a curtsy (a giggle), a "ta-da!" (a wink).
//   Tragedy slow and heavy: slumped, ears down, tail dragging, her mask hanging from her paw; a
//           flat-footed trudge; a 10 s idle act: a sob (tears dripping), a wistful look up, the
//           mask clutched to her chest.
//   fight   (world/theatre.js) a plain swing is a fan flick and a high kick in Comedy, the mask
//           raised and brought down in Tragedy; Confetti (m.confettiAt): a scoop and a leap, the
//           Comedy fan flung up and bursting; Rain of Tears (a cast bar, m.tearsAt): both masks
//           raised, wailing, then flung out as the tears fall; the change of masks (m.swapAt) and
//           both masks at once (m.bothAt): a pirouette.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, blend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, window1, stepPhase, pawStep, put, shift, MOODS, faceShapes, sparkle } from './rigkit.js';

const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const sized = (rig, k) => {
  const draw = rig.draw;
  rig.draw = (ctx, m, a) => {
    ctx.save();
    ctx.scale(k, k);
    draw(ctx, m, a);
    ctx.restore();
  };
  rig.w = Math.round(rig.w * k);
  rig.h = Math.round(rig.h * k);
  return rig;
};
const smoothPts = (pts, n = 3) => {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const out = [];
    for (let i = 0; i < q.length; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      out.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    q = out;
  }
  return q;
};
const blob = (pts, c, n = 3) => T(smoothPts(pts, n), c);
const star5 = (x, y, r, c, k = 0.45) => T(Array.from({ length: 10 }, (_, i) => {
  const an = -Math.PI / 2 + (i * Math.PI) / 5;
  const rr = i % 2 ? r * k : r;
  return [x + Math.cos(an) * rr, y + Math.sin(an) * rr];
}), c);
const INK = '#2e1c26';
const line = (pts, w, c = INK) => stroke(pts, w, c).map(F);
const aim = (want, arm, elb, tilt = 0) => want - arm - elb - tilt;
const lerp = (p, q, k) => p + (q - p) * k;
// (A seam down her middle, gently wavy.)
const seam = (x, y0, y1, n, amp) => Array.from({ length: n + 1 }, (_, k) => [x + Math.sin(k * 1.7) * amp, y0 + ((y1 - y0) * k) / n]);

const GOLDF = ramp('#ffcf6a', { step: 9, turn: 10 });
const BLUEF = ramp('#7a9ae8', { step: 9, turn: 10 });
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
// Which side of her faces you: `g` her gold side (Comedy), `b` her blue side (Tragedy). Everything
// on her near side takes the near colour, so the whole of her swaps as she turns.
const SIDES = {
  g: { fr: GOLDF, bk: BLUEF, frIn: '#ffe8c0', bkIn: '#c8d8ff', tuFr: '#ffe8b0', tuBk: '#c8d8ff', irisN: '#4a7ae8', irisF: '#e8a02a', warmN: '#ffd8b0', warmF: '#c8b8ff', shoeN: '#ffc8e0', shoeF: '#e0c4ff' },
  b: { fr: BLUEF, bk: GOLDF, frIn: '#c8d8ff', bkIn: '#ffe8c0', tuFr: '#c8d8ff', tuBk: '#ffe8b0', irisN: '#e8a02a', irisF: '#4a7ae8', warmN: '#c8b8ff', warmF: '#ffd8b0', shoeN: '#e0c4ff', shoeF: '#ffc8e0' },
};
const ps = pairOf('ps2');

// ---------- Parts ----------
// (Rig space: the hip 27.6 above the floor; the chest joint 2 above it; the neck 24 above that;
// the head's middle 16 above the neck. Shoulders at (5, -20) and (-5, -20) on the chest.)
const HX = 22;
const HY = 24;
// Her head: a round cat, the back half one colour and the front half the other, a wavy seam
// between; a cream muzzle, a pink nose, whiskers; her star tiara. Box 44 x 44; the neck (22, 40).
const headP = (sd) => () => {
  const C = SIDES[sd];
  return [
    blob([[HX - 13, HY + 1], [HX - 19, HY + 8], [HX - 13, HY + 8], [HX - 15, HY + 12], [HX - 8, HY + 11]], C.bk.base, 2),
    E(HX, HY, 16, 14.6, C.bk.base),
    T([...seam(HX + 1, HY - 14.5, HY + 14.5, 12, 0.9), ...arcP(HX, HY, 16, 14.6, 90, -90, 16)], C.fr.base),
    crescent(HX, HY, 16, 14.6, C.bk.sh, { k: 0.14, a0: 110, a1: 210 }), F(E(HX + 6, HY - 8, 4, 1.8, C.fr.hi)), F(E(HX - 7, HY - 9, 3, 1.4, C.bk.hi)),
    F(blob([[HX + 2, HY + 3], [HX + 9, HY + 1], [HX + 16.4, HY + 4.4], [HX + 14, HY + 10], [HX + 6, HY + 12], [HX + 1, HY + 9]], '#fff8ee')),
    E(HX + 15.4, HY + 3.6, 1.7, 1.3, '#ff8aa8'), F(E(HX + 15, HY + 3.1, 0.6, 0.4, '#ffd0dc')),
    ...[[0, 0], [1.6, 1], [-1.4, -0.8]].map(([dy, k]) => F(taper([[HX + 12, HY + 6.4 + dy], [HX + 19.4, HY + 5.6 + dy + k * 1.6]], 0.45, 0.3, '#ffffff'))),
    // The tiara: a gold band over her crown, three stars, the middle one big.
    ...line(arcP(HX + 1, HY - 3.6, 15, 6.4, 205, 335, 10), 1.5, '#e8a02a'), ...line(arcP(HX + 1, HY - 4, 14.4, 6, 215, 325, 8), 0.5, '#fff3c4'),
    star5(HX - 8, HY - 11.4, 2.4, '#fff3c4'), star5(HX + 10, HY - 11.6, 2.4, '#fff3c4'), star5(HX + 1, HY - 15.4, 3.6, GOLD.base), F(E(HX + 0.2, HY - 16.4, 0.8, 0.6, '#ffffff')), F(E(HX + 1, HY - 14.8, 0.9, 0.9, '#ff8ab8')),
  ];
};
// An ear (box 14 x 19; it sits on its root (7, 16), sunk into the head).
const earP = (sd, far) => () => {
  const C = SIDES[sd];
  const c = far ? C.bk : C.fr;
  return [T(smoothPts([[1.4, 16], [6.6, 0.8], [12.6, 16], [7, 18.6]], 1), c.base), F(T(smoothPts([[3.8, 15], [6.6, 4.4], [10.2, 15]], 1), far ? C.bkIn : C.frIn)), F(taper([[2.6, 15], [6, 3]], 0.8, 0.4, c.hi))];
};
// The leotard, split like her coat, a tulle collar, a gold star brooch. Box 28 x 30; the chest
// joint (14, 28).
const bodyP = (sd) => () => {
  const C = SIDES[sd];
  const hw = (y) => (y < 15 ? 7.4 - ((y - 3) / 12) * 1.2 : 6.2 + ((y - 15) / 14) * 3.8);
  const right = Array.from({ length: 14 }, (_, k) => [14.6 + hw(3 + k * 2), 3 + k * 2]);
  const left = right.map(([x, y]) => [28.4 - x - 0.6, y]).reverse();
  return [
    blob([...right, ...left], C.bk.base, 2),
    T(smoothPts([...right, ...seam(15.2, 29, 3, 9, 0.6)], 1), C.fr.base),
    F(taper([[6.6, 6], [6.2, 26]], 2, 2.4, C.bk.sh)), F(taper([[19.6, 6], [21.6, 14]], 1.2, 0.8, C.fr.hi)),
    ...[7.4, 10, 12.6, 15.2, 17.8, 20.4].map((x) => F(E(x, 3.6, 1.8, 1.4, '#ffffff'))),
    F(star5(19, 9.6, 2.4, GOLD.base)), F(E(18.5, 8.9, 0.6, 0.5, '#ffffff')),
  ];
};
// The tutu, two layers of tulle seen a little from above (box 48 x 16, hung at its waist (24, 4)):
// the under layer the back colour, wider; the top layer the near colour, with a ribbon band and a
// bow at the back.
const tutuP = (sd, top) => () => {
  const C = SIDES[sd];
  const c = top ? C.tuFr : C.tuBk;
  const rx = top ? 18.6 : 22;
  const ry = top ? 3.6 : 4.4;
  const cy = top ? 5.6 : 7.2;
  const sc = Array.from({ length: 11 }, (_, k) => {
    const an = (0.08 + (k / 10) * 0.84) * Math.PI;
    return E(24 + Math.cos(an) * rx * 0.96, cy + Math.sin(an) * ry + 0.8, 2.6, 1.7, c);
  });
  const out = [...sc, E(24, cy, rx, ry, c), F(E(24, cy - 0.8, rx * 0.86, ry * 0.5, '#ffffff')), ...[-12, -4, 4, 12].map((dx) => F(E(24 + dx, cy + ry * 0.4, 0.9, 0.6, '#ffffff')))];
  if (top) out.push(R(14.4, 2.6, 19.2, 2.6, '#ff9ac8'), F(R(14.4, 2.6, 19.2, 0.9, '#ffc8e0')), T([[14.6, 3.8], [10.6, 1.4], [10.6, 6.4]], '#ff9ac8'), T([[14.6, 3.8], [12.2, 8.6], [15.6, 8.4]], '#ff7ab4'), E(14.8, 3.9, 1.4, 1.4, '#ff7ab4'));
  return out;
};
// A cat arm: the upper (box 12 x 8 from the shoulder (2, 4); the elbow 8 on), the forearm (box 12 x
// 8 from (2, 4); the grip 7.5 on), a white glove with a pink pad (box 9 x 9 about (4.5, 4.5)).
const upperP = (sd, far) => () => {
  const C = SIDES[sd];
  return [taper([[2, 4], [10, 4]], 5.4, 5, far ? C.bk.sh : C.fr.base), F(E(4, 2.8, 1.8, 0.8, far ? C.bk.base : C.fr.hi))];
};
const foreP = (sd, far) => () => {
  const C = SIDES[sd];
  return [taper([[2, 4], [9.5, 4]], 5, 4.4, far ? C.bk.sh : C.fr.base), F(R(7.6, 1.8, 1.6, 4.4, '#ffffff'))];
};
const mittP = (far) => () => [E(4.5, 4.5, 3.4, 3.2, far ? '#e4dcf0' : '#ffffff'), F(E(5.6, 5.6, 1.2, 0.9, '#ffb4cc')), F(E(3.4, 3.2, 1, 0.7, '#ffffff'))];
// A leg: the thigh (box 8 x 13 from the hip (4, 1.5); the knee 10.4 down), the shin in a ribbed leg
// warmer (box 9 x 13 from (4.5, 1); the ankle 10.8 down), a satin pointe shoe, its ribbons crossed
// over the instep (box 13 x 9 from the ankle (4, 1.2); the sole 7 under it).
const thighP = (sd, far) => () => {
  const C = SIDES[sd];
  return [taper([[4, 1.5], [4, 11.9]], 5.6, 4.8, far ? C.bk.sh : C.fr.base)];
};
const shinP = (sd, far) => () => {
  const C = SIDES[sd];
  const w = far ? C.warmF : C.warmN;
  const wr = ramp(w, { step: 8, turn: 8 });
  return [
    taper([[4.5, 1], [4.5, 11.8]], 4.6, 4, far ? C.bk.sh : C.fr.base),
    blob([[1.3, 5.2], [7.7, 5.2], [8.1, 8.6], [7.7, 12.6], [1.3, 12.6], [0.9, 8.6]], far ? wr.sh : w, 2),
    ...[7, 9, 11].map((y) => F(R(1.6, y, 5.8, 0.6, far ? wr.base : wr.sh))), F(R(1.8, 5.6, 1.3, 6.4, far ? wr.base : wr.hi)),
  ];
};
const shoeP = (sd, far) => () => {
  const C = SIDES[sd];
  const c = far ? C.shoeF : C.shoeN;
  const r = ramp(c, { step: 8, turn: 8 });
  return [
    blob([[1, 0.6], [6.6, 0.6], [9.8, 2.4], [12.2, 4.6], [11.8, 8], [1, 8.2], [0.4, 4]], far ? r.sh : c, 2),
    F(blob([[2, 1.4], [6, 1.4], [8.4, 2.8], [4, 3.4]], '#ffffff', 1)), F(R(1, 7.4, 10.8, 0.8, r.sh)),
    ...line([[2.2, 0.8], [7, 4.2]], 0.7, '#ff7ab4'), ...line([[6.8, 0.8], [2.6, 4.2]], 0.7, '#ff7ab4'),
  ];
};
// The tail, three pieces (box len+6 x 8 from its root (3, 4)), the tip the near colour.
const TAIL = [8, 7, 6.4];
const tailP = (sd, i) => () => {
  const C = SIDES[sd];
  const len = TAIL[i];
  const w = [[4.8, 4.2], [4.2, 3.6], [3.6, 3]][i];
  const out = [taper([[3, 4], [3 + len, 4]], w[0], w[1], C.bk.base)];
  if (i === 2) out.push(taper([[3 + len * 0.45, 4], [3 + len, 4]], 3.4, 3, C.fr.base), E(3 + len, 4, 1.5, 1.5, C.fr.base));
  else out.push(F(taper([[3, 3], [3 + len, 3]], 1, 0.8, C.bk.hi)));
  return out;
};
// A mask (Comedy gold and laughing, Tragedy blue and weeping) facing you, k its size.
const maskFace = (x, y, comedy, k = 1) => {
  const c = comedy ? GOLD.base : '#9ab4f0';
  const P = (px, py) => [x + px * k, y + py * k];
  return [
    blob([P(-7, -6), P(0, -8), P(7, -6), P(7.6, 2), P(4, 8), P(0, 9), P(-4, 8), P(-7.6, 2)], c), F(blob([P(-5, -5.4), P(0, -7), P(2, -5), P(-4, -3)], '#ffffff')),
    F(E(...P(-6, 1.6), 1.4 * k, 0.8 * k, comedy ? '#ff9ab0' : '#c8d8ff')), F(E(...P(6, 1.6), 1.4 * k, 0.8 * k, comedy ? '#ff9ab0' : '#c8d8ff')),
    ...(comedy
      ? [...line(arcP(...P(-3.2, -0.6), 2 * k, 1.4 * k, 200, 340, 6), 0.9 * k), ...line(arcP(...P(3.2, -0.6), 2 * k, 1.4 * k, 200, 340, 6), 0.9 * k), F(T([...arcP(...P(0, 3), 4 * k, 3.4 * k, 0, 180, 8)], '#7a3040')), F(E(...P(0, 5), 1.6 * k, 0.8 * k, '#ff8aa8'))]
      : [...line(arcP(...P(-3.2, -0.2), 2 * k, 1.4 * k, 20, 160, 6), 0.9 * k), ...line(arcP(...P(3.2, -0.2), 2 * k, 1.4 * k, 20, 160, 6), 0.9 * k), F(T([...arcP(...P(0, 6.4), 3.6 * k, 2.6 * k, 180, 360, 8)], '#2a3060')), F(E(...P(4.6, 2.8), 0.9 * k, 1.4 * k, '#e4f6ff'))]),
  ];
};
// A mask fan, held by its stick (box 26 x 38; the grip (13, 32)): a lace frill round the mask, a
// ribbon bow tied round the stick under it.
const fanP = (comedy) => () => [
  ...Array.from({ length: 16 }, (_, i) => {
    const an = (i / 16) * TAU;
    return E(13 + Math.cos(an) * 9.4, 13 + Math.sin(an) * 10.4, 2.3, 2.3, '#ffffff');
  }),
  taper([[13, 21], [13, 35.6]], 1.9, 1.6, '#8a5a3a'), F(taper([[12.6, 22], [12.6, 34.6]], 0.5, 0.4, '#c88a5a')), E(13, 36, 1.5, 1.5, GOLD.base),
  ...maskFace(13, 13, comedy, 1.15),
  T([[13, 24.4], [8.6, 21.8], [8.8, 27]], comedy ? '#ff6b9a' : '#9a6ae8'), T([[13, 24.4], [17.4, 21.8], [17.2, 27]], comedy ? '#ff6b9a' : '#9a6ae8'),
  F(T([[11.6, 24.4], [9.6, 23], [9.8, 25.4]], comedy ? '#ffb4cc' : '#c8aaff')), E(13, 24.4, 1.5, 1.4, comedy ? '#e84a80' : '#7a4ac8'),
  taper([[12.4, 25.4], [11, 29.6]], 1.1, 0.8, comedy ? '#ff6b9a' : '#9a6ae8'), taper([[13.6, 25.4], [15, 29]], 1.1, 0.8, comedy ? '#ff6b9a' : '#9a6ae8'),
];
const KIT = Object.fromEntries(['g', 'b'].map((sd) => [sd, {
  HEAD: ps(`head${sd}`, 44, 44, headP(sd), 2), BODY: ps(`body${sd}`, 28, 30, bodyP(sd), 2),
  EAR: [false, true].map((f) => ps(`ear${sd}${f ? 1 : 0}`, 14, 19, earP(sd, f), 2)),
  TUTU: [false, true].map((top) => ps(`tutu${sd}${top ? 1 : 0}`, 48, 16, tutuP(sd, top), 2)),
  UP: [false, true].map((f) => ps(`up${sd}${f ? 1 : 0}`, 12, 8, upperP(sd, f), 2)), FORE: [false, true].map((f) => ps(`fore${sd}${f ? 1 : 0}`, 12, 8, foreP(sd, f), 2)),
  THIGH: [false, true].map((f) => ps(`thigh${sd}${f ? 1 : 0}`, 8, 13, thighP(sd, f), 2)), SHIN: [false, true].map((f) => ps(`shin${sd}${f ? 1 : 0}`, 9, 13, shinP(sd, f), 2)), SHOE: [false, true].map((f) => ps(`shoe${sd}${f ? 1 : 0}`, 13, 9, shoeP(sd, f), 2)),
  TAIL: [0, 1, 2].map((i) => ps(`tail${sd}${i}`, TAIL[i] + 6, 8, tailP(sd, i), 2)),
}]));
const MITT = [false, true].map((f) => ps(`mitt${f ? 1 : 0}`, 9, 9, mittP(f), 2));
const FAN = { comedy: ps('fanc', 26, 38, fanP(true), 2), tragedy: ps('fant', 26, 38, fanP(false), 2) };

// ---------- Faces (on the head; box 44 x 44 as it) ----------
const EN = [HX + 8, HY + 0.4, 3.2];
const EF = [HX - 3, HY + 0.4, 2.8];
const eye = ([x, y, r], iris, lidC, side, { lid = 0, small = false, look = 0 } = {}) => [
  F(E(x, y, r, r * 1.15, INK)), F(E(x, y + r * 0.35 + look, r * 0.8, r * 0.7, iris)),
  ...(small ? [F(E(x, y + look, r * 0.3, r * 0.34, '#ffffff'))] : [F(E(x - r * 0.3, y - r * 0.4 + look * 0.5, r * 0.4, r * 0.42, '#ffffff')), F(E(x + r * 0.35, y + r * 0.4 + look * 0.5, r * 0.15, r * 0.15, '#ffffff'))]),
  ...(lid > 0 ? [F(T([...arcP(x, y, r * 1.12, r * 1.25, 180, 360, 8), ...arcP(x, y - r * 1.15 * (1 - lid * 2), r * 1.12, r * 0.35, 0, 180, 8)], lidC)), ...line(arcP(x, y - r * 1.15 * (1 - lid * 2), r * 1.05, r * 0.32, 15, 165, 7), 0.6)] : []),
  // (Lashes at the outer corner: she's a ballerina.)
  ...line([[x + side * r * 0.8, y - r * 0.85], [x + side * r * 1.4, y - r * 1.3]], 0.6), ...line([[x + side * r * 0.95, y - r * 0.4], [x + side * r * 1.55, y - r * 0.6]], 0.55),
];
const shutE = ([x, y, r], up = false) => line(arcP(x, y + 0.6, r, r * 0.6, up ? 200 : 20, up ? 340 : 160, 7), 0.8);
const squeeze = ([x, y, r], side) => line([[x - side * r, y - r * 0.8], [x + side * r * 0.6, y], [x - side * r, y + r * 0.8]], 0.8);
const BROW = '#5a3a5a';
const brows = (n, f) => [F(taper(n, 1.1, 0.6, BROW)), F(taper(f, 1, 0.5, BROW))];
const BN = [[HX + 5.2, HY - 4.8], [HX + 10.6, HY - 5.2]];
const BF = [[HX - 5.8, HY - 4.4], [HX - 1.2, HY - 4.8]];
const BN_SAD = [[HX + 5, HY - 6.4], [HX + 10.6, HY - 4.4]];
const BF_SAD = [[HX - 5.8, HY - 4], [HX - 1, HY - 6.2]];
const BN_ARCH = [[HX + 5, HY - 4], [HX + 10.6, HY - 6.4]];
const BF_ARCH = [[HX - 5.8, HY - 6], [HX - 1, HY - 4]];
const upB = (pts, k) => pts.map(([x, y]) => [x, y - k]);
const MX = HX + 12.4;
const MY = HY + 8.4;
const LIP = '#7a3040';
const catSmile = () => [...line(arcP(MX - 1.5, MY, 1.5, 1.2, 0, 180, 6), 0.7, LIP), ...line(arcP(MX + 1.5, MY, 1.5, 1.2, 0, 180, 6), 0.7, LIP), ...line([[HX + 15.2, HY + 4.8], [MX, MY]], 0.6, LIP)];
const openSmile = (k = 1) => [F(T(arcP(MX, MY - 0.2, 3 * k, 2.8 * k, 0, 180, 9), LIP)), F(E(MX, MY + 1.4 * k, 1.5 * k, 0.8 * k, '#ff9ab0'))];
const grin = () => [...line(arcP(MX - 0.4, MY - 0.8, 3.4, 2, 15, 165, 8), 0.75, LIP), F(T([[MX - 1.6, MY + 1], [MX - 0.8, MY + 2.4], [MX, MY + 1.2]], '#ffffff'))];
const shoutO = (k = 1) => [F(E(MX, MY + 1, 2.4 * k, 2.6 * k, LIP)), F(E(MX, MY + 2.2 * k, 1.4 * k, 0.8 * k, '#ff9ab0'))];
const frown = () => line(arcP(MX, MY + 1.8, 2, 1.1, 200, 340, 6), 0.7, LIP);
const wobble = () => line([[MX - 2.6, MY + 1.6], [MX - 1.3, MY + 0.8], [MX, MY + 1.6], [MX + 1.3, MY + 0.8], [MX + 2.6, MY + 1.6]], 0.7, LIP);
const wail = (k = 1) => [F(T(arcP(MX, MY + 3, 3 * k, 3 * k, 180, 360, 9), LIP)), F(E(MX, MY + 2.4, 1.4 * k, 0.6 * k, '#ff9ab0'))];
const sighO = () => [F(E(MX, MY + 0.8, 1.1, 1.3, LIP))];
const blush = (k = 1, c = '#ff9ab0') => [F(E(HX - 8, HY + 6, 2.2 * k, 1.1 * k, c)), F(E(HX + 13.6, HY + 6.8, 1.8 * k, 0.9 * k, c))];
const drop = (x, y, k = 1) => [F(E(x, y, 1.3 * k, 1.9 * k, '#3a6ab8')), F(E(x, y, 0.9 * k, 1.5 * k, '#8ad8ff')), F(E(x - 0.3 * k, y - 0.5 * k, 0.3 * k, 0.4 * k, '#ffffff'))];
const streams = () => [
  F(taper([[EN[0] + 0.6, EN[1] + 3], [EN[0] + 1.4, EN[1] + 10]], 2, 1.4, '#3a6ab8')), F(taper([[EN[0] + 0.6, EN[1] + 3], [EN[0] + 1.4, EN[1] + 10]], 1.3, 0.8, '#8ad8ff')),
  F(taper([[EF[0] - 0.6, EF[1] + 3], [EF[0] - 1.2, EF[1] + 9]], 1.8, 1.2, '#3a6ab8')), F(taper([[EF[0] - 0.6, EF[1] + 3], [EF[0] - 1.2, EF[1] + 9]], 1.1, 0.7, '#8ad8ff')),
];
const faceOf = (sd, mood) => {
  const C = SIDES[sd];
  const eN = (o) => eye(EN, C.irisN, C.fr.base, 1, o);
  const eF = (o) => eye(EF, C.irisF, C.bk.base, -1, o);
  const F2 = {
    // Comedy: bright, pleased with herself.
    idle: () => [...eN(), ...eF(), ...brows(BN, BF), ...catSmile(), ...blush()],
    blink: () => [...shutE(EN), ...shutE(EF), ...brows(BN, BF), ...catSmile(), ...blush()],
    giggle: () => [...shutE(EN, true), ...shutE(EF, true), ...brows(upB(BN, 1.2), upB(BF, 1.2)), ...openSmile(0.9), ...blush(1.3)],
    wink: () => [...shutE(EN, true), ...eF(), ...brows(upB(BN, 0.6), upB(BF, 1.4)), ...openSmile(0.8), ...blush(1.2)],
    grin: () => [...eN({ lid: 0.3, small: true }), ...eF({ lid: 0.3, small: true }), ...brows(BN_ARCH, BF_ARCH), ...grin(), ...blush()],
    shout: () => [...shutE(EN, true), ...shutE(EF, true), ...brows(upB(BN, 1.6), upB(BF, 1.6)), ...shoutO(1.1), ...blush(1.2)],
    // Tragedy: everything droops.
    sad: () => [...eN({ lid: 0.3, look: 0.5 }), ...eF({ lid: 0.3, look: 0.5 }), ...brows(BN_SAD, BF_SAD), ...frown(), ...blush(0.8, '#c8b4f0'), ...drop(EN[0] + 1, EN[1] + 6.2, 0.9)],
    sblink: () => [...shutE(EN), ...shutE(EF), ...brows(BN_SAD, BF_SAD), ...frown(), ...blush(0.8, '#c8b4f0'), ...drop(EN[0] + 1, EN[1] + 6.2, 0.9)],
    sob: () => [...squeeze(EN, 1), ...squeeze(EF, -1), ...brows(BN_SAD, BF_SAD), ...wobble(), ...blush(0.9, '#c8b4f0'), ...streams()],
    wail: () => [...squeeze(EN, 1), ...squeeze(EF, -1), ...brows(upB(BN_SAD, 1), upB(BF_SAD, 1)), ...wail(1.1), ...blush(0.9, '#c8b4f0'), ...streams()],
    sigh: () => [...shutE(EN, true), ...shutE(EF, true), ...brows(BN_SAD, BF_SAD), ...sighO(), ...blush(0.8, '#c8b4f0')],
    hurt: () => [...squeeze(EN, 1), ...squeeze(EF, -1), ...brows(BN_SAD, BF_SAD), ...frown(), ...drop(EN[0] + 3, EN[1] - 2, 0.9)],
    dead: () => [...line([[EN[0] - 2.2, EN[1] - 2.2], [EN[0] + 2.2, EN[1] + 2.2]], 0.8), ...line([[EN[0] + 2.2, EN[1] - 2.2], [EN[0] - 2.2, EN[1] + 2.2]], 0.8), ...line([[EF[0] - 1.9, EF[1] - 1.9], [EF[0] + 1.9, EF[1] + 1.9]], 0.7), ...line([[EF[0] + 1.9, EF[1] - 1.9], [EF[0] - 1.9, EF[1] + 1.9]], 0.7), ...sighO()],
  };
  if (F2[mood]) return F2[mood]();
  return faceShapes(mood, { eyes: [[EN[0], EN[1], 2.8, 3.2, 1], [EF[0], EF[1], 2.4, 2.8, -1]], mouth: [MX, MY, 1], blush: [[HX - 8, HY + 6, 1.6], [HX + 13.6, HY + 6.8, 1.4]], iris: C.irisN, lid: 0, lashes: 1 });
};
const psFace = (sd, mood) => faceSprite(`ps2|face|${sd}|${mood}`, 44, 44, () => faceOf(sd, mood));

// ---------- Skeleton ----------
const HIP = 27.6;
const L1 = 10.4;
const L2 = 10.8;
const UA = 8;
const FA = 7.5;
const SHN = [5, -20];
const SHF = [-5, -20];
function legIK(dx, dy, hipDeg) {
  const d = Math.min(L1 + L2 - 0.05, Math.max(3, Math.hypot(dx, dy)));
  const h = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const k = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return [(-Math.atan2(dx, dy) - h) / D2R - hipDeg, (Math.PI - k) / D2R];
}
// How far under the ankle the shoe reaches, rolled by r (0 flat; more and she's up on her toes).
const SOLE = [[-3, 7], [7, 7], [8, 3.8]];
const depth = (r) => {
  const s = Math.sin(r * D2R);
  const c = Math.cos(r * D2R);
  return Math.max(...SOLE.map(([x, y]) => x * s + y * c));
};
// Both feet planted (dx forward of each hip, rolled up onto the toes by r), the hip `lift` up.
const legsAt = (lift, dxN, rN, dxF, rF, hipDeg = 0, upN = 0, upF = 0) => {
  const [tn, sn] = legIK(dxN, HIP + lift - depth(rN) - upN, hipDeg);
  const [tf, sf] = legIK(dxF, HIP + lift - depth(rF) - upF, hipDeg);
  return { thighN: tn, shinN: sn, thighF: tf, shinF: sf, rollN: rN, rollF: rF };
};
// Would the near fan overlap her head? (Worked in the chest's space; the mask's middle 19 above the
// grip.)
const FAN_PTS = [[0, -19], [-8, -19], [8, -19], [0, -28], [0, -10], [-6, -26], [6, -26], [-6, -12], [6, -12]];
const behind = (a, S) => {
  const ar = S.armN * D2R;
  const er = (S.armN + S.elbN) * D2R;
  const wx = SHN[0] + UA * Math.cos(ar) + FA * Math.cos(er);
  const wy = SHN[1] + UA * Math.sin(ar) + FA * Math.sin(er);
  const pr = (S.armN + S.elbN + S.fanN) * D2R;
  const hr = (S.head - S.tilt * 0.5) * D2R;
  const hx = 1 + 16 * Math.sin(hr);
  const hy = -24 - 16 * Math.cos(hr);
  return FAN_PTS.some(([px, py]) => {
    const x = wx + px * Math.cos(pr) - py * Math.sin(pr);
    const y = wy + px * Math.sin(pr) + py * Math.cos(pr);
    return ((x - hx) / 17) ** 2 + ((y - hy) / 15.6) ** 2 < 1;
  });
};
const before = (a, S) => !behind(a, S);
// (Her near leg kicked up high comes out in front of the tutu; bent in a plie or a passe it stays
// tucked under it.)
const kicked = (a, S) => S.thighN < -85;
const tucked = (a, S) => !kicked(a, S);

const side = (a) => a.psSide ?? 'g';
const nearMask = (a) => (side(a) === 'g' ? 'comedy' : 'tragedy');
const farMask = (a) => (side(a) === 'g' ? 'tragedy' : 'comedy');

const psPass = (bare) => {
  const i = bare ? 1 : 0;
  const t = bare ? 'b' : '';
  const K = (a) => KIT[side(a)];
  const leg = (far, sfx = '', when) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `shoe${k}${sfx}${t}`, parent: `ankle${k}`, s: (a) => K(a).SHOE[j][i](), pivot: [4, 1.2], rot: (S) => -(S.tilt * 0.3 + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R, when },
      { name: `shin${k}${sfx}${t}`, parent: `knee${k}`, s: (a) => K(a).SHIN[j][i](), pivot: [4.5, 1], rot: (S) => S[`shin${k}`] * D2R, when },
      { name: `thigh${k}${sfx}${t}`, parent: 'hip', s: (a) => K(a).THIGH[j][i](), pivot: [4, 1.5], at: () => (far ? [-3.4, 0] : [3.6, 0]), rot: (S) => S[`thigh${k}`] * D2R, when },
    ];
  };
  const arm = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return {
      up: { name: `up${k}${t}`, parent: 'chest', s: (a) => K(a).UP[j][i](), pivot: [2, 4], at: () => (far ? SHF : SHN), rot: (S) => S[`arm${k}`] * D2R },
      fore: { name: `fore${k}${t}`, parent: `elbow${k}`, s: (a) => K(a).FORE[j][i](), pivot: [2, 4], rot: (S) => S[`elb${k}`] * D2R },
      fan: { name: `fan${k}${t}`, parent: `grip${k}`, s: (a) => FAN[far ? farMask(a) : nearMask(a)][i](), pivot: [13, 32], rot: (S) => S[`fan${k}`] * D2R },
      mitt: { name: `mitt${k}${t}`, parent: `grip${k}`, s: () => MITT[j][i](), pivot: [4.5, 4.5] },
    };
  };
  const an = arm(false);
  const af = arm(true);
  const tail = [0, 1, 2].map((n) => ({ name: `tail${n}${t}`, parent: n ? `tail${n - 1}` : 'hip', s: (a) => K(a).TAIL[n][i](), pivot: [3, 4], at: () => (n ? [TAIL[n - 1], 0] : [-8, -8]), rot: (S) => S[`tail${n}`] * D2R }));
  return [
    ...tail,
    af.up, af.fore, af.fan, af.mitt,
    ...leg(true),
    { name: `body${t}`, parent: 'chest', s: (a) => K(a).BODY[i](), pivot: [14, 28] },
    ...leg(false, '', tucked),
    { name: `tutuB${t}`, parent: 'hip', s: (a) => K(a).TUTU[0][i](), pivot: [24, 4], at: () => [0, -1], rot: (S) => S.tutuB * D2R },
    { name: `tutu${t}`, parent: 'hip', s: (a) => K(a).TUTU[1][i](), pivot: [24, 4], at: () => [0, -2.4], rot: (S) => S.tutu * D2R },
    ...leg(false, 'k', kicked),
    an.up,
    { ...an.fore, name: `foreNk${t}`, when: behind }, { ...an.fan, name: `fanNk${t}`, when: behind }, { ...an.mitt, name: `mittNk${t}`, when: behind },
    { name: `earF${t}`, parent: 'nk', s: (a) => K(a).EAR[1][i](), pivot: [7, 16], at: () => [-7.5, -25], rot: (S) => (S.earF - 24) * D2R },
    { name: `earN${t}`, parent: 'nk', s: (a) => K(a).EAR[0][i](), pivot: [7, 16], at: () => [7, -26.5], rot: (S) => (S.earN + 6) * D2R },
    { name: `head${t}`, parent: 'nk', s: (a) => K(a).HEAD[i](), pivot: [22, 40] },
    ...(bare ? [{ name: 'face', parent: 'nk', s: (a) => psFace(side(a), a.psMood ?? 'idle'), pivot: [22, 40] }] : []),
    { ...an.fore, when: before }, { ...an.fan, when: before }, { ...an.mitt, when: before },
  ];
};

// ---------- Moves ----------
// A fan's world angle: 0 upright (the mask above the paw), 90 held out forward, -90 back.
function psMove(kind, cur) {
  const legs = (o) => ({ ...cur, ...o });
  if (kind === 'slam') return [
    // Tragedy's swing: up on her toes, the mask raised high in front of her, wailing...
    legs({ x: -2, lift: 3, tilt: -8, head: -12, armN: -30, elbN: 8, fanN: aim(30, -30, 8, -8), armF: 195, elbF: -10, fanF: aim(-45, 195, -10, -8), ...legsAt(3, 1.4, 45, -1.4, 45, -2.4), earN: 60, earF: -56 }),
    // ...and down, a deep plie, the mask brought down in front of her.
    legs({ x: 6, lift: -5, tilt: 16, head: 10, armN: 40, elbN: -10, fanN: aim(125, 40, -10, 16), armF: 160, elbF: 0, fanF: aim(200, 160, 0, 16), ...legsAt(-5, 3, 0, -3, 0, 4.8), earN: 74, earF: -70 }),
  ];
  if (kind === 'confetti') return [
    // Confetti: a crouch, both fans swept down and back, scooping...
    legs({ x: -2, lift: -5, tilt: 10, head: 6, armN: 130, elbN: -20, fanN: aim(200, 130, -20, 10), armF: 160, elbF: -10, fanF: aim(220, 160, -10, 10), ...legsAt(-5, 2, 0, -2, 0, 3) }),
    // ...and a leap, legs tucked, both fans flung up high: the Comedy fan bursts.
    legs({ x: 2, lift: 10, tilt: -8, head: -10, armN: -20, elbN: 10, fanN: aim(30, -20, 10, -8), armF: 195, elbF: -10, fanF: aim(-45, 195, -10, -8), thighN: -40, shinN: 80, thighF: 24, shinF: 70, rollN: 60, rollF: 60 }),
  ];
  // Comedy's swing: the fan swept back low, the near leg drawn up into passe...
  return [
    legs({ x: -3, lift: 3.6, tilt: -10, head: -4, armN: 150, elbN: -20, fanN: aim(215, 150, -20, -10), armF: 200, elbF: -10, fanF: aim(-60, 200, -10, -10), ...legsAt(3.6, 0, 45, -1, 50, -3), thighN: -64, shinN: 118, rollN: 60 }),
    // ...then a flick forward and up and a high kick (a grand battement), all at once.
    legs({ x: 6, lift: 2.4, tilt: 10, head: 4, armN: -25, elbN: -10, fanN: aim(55, -25, -10, 10), armF: 190, elbF: -20, fanF: aim(-70, 190, -20, 10), ...legsAt(2.4, 0, 45, -1, 45, 3), thighN: -125, shinN: 0, rollN: 55 }),
  ];
}

// Which mask she's in: the fight's (world/theatre.js), or in her entrance scene the face it gives
// her (happy Comedy, sad Tragedy; each change of it a pirouette too).
const maskNow = (m, a) => {
  const mo = (a.mo ??= {});
  const cm = m.cine?.mood === 'sad' ? 'tragedy' : m.cine?.mood === 'happy' ? 'comedy' : null;
  if (cm && cm !== mo.psCineMask) {
    if (cm !== (mo.psCineMask ?? m.mech?.mask ?? 'comedy')) mo.psCineAt = a.now;
    mo.psCineMask = cm;
  }
  if (!m.cine) mo.psCineMask = null;
  return mo.psCineMask ?? m.mech?.mask ?? 'comedy';
};
// The pirouette (a change of masks, or both at once): 0.8 s of turning, four half turns, the whole
// of her mirrored for every other one.
const SPIN = 0.8;
const spinState = (m, a) => {
  const sw = Math.max(m.swapAt ?? -99, a.mo?.psCineAt ?? -99);
  const bo = m.bothAt ?? -99;
  const at = Math.max(sw, bo);
  const u = (a.now - at) / SPIN;
  if (u < 0 || u >= 1) return null;
  return { at, u, i: Math.floor(u * 4), swap: sw >= bo };
};
const sideNow = (mask, sp) => {
  const cur = mask === 'comedy' ? 'g' : 'b';
  if (!sp) return cur;
  // (A change starts from the side she was showing; each half turn shows the other.)
  const start = sp.swap ? (cur === 'g' ? 'b' : 'g') : cur;
  return sp.i % 2 ? (start === 'g' ? 'b' : 'g') : start;
};
const spinWrap = (rig) => {
  const draw = rig.draw;
  rig.draw = (ctx, m, a) => {
    const mask = maskNow(m, a);
    const sp = m.hp > 0 ? spinState(m, a) : null;
    draw(ctx, m, { ...a, flip: sp && sp.i % 2 ? !a.flip : a.flip, psMask: mask, psSide: sideNow(mask, sp), psSpin: sp });
  };
  return rig;
};

export const personaRig = sized(spinWrap(makeRig({
  w: 60, h: 92, soft: true, stride: 8, recover: 0.55,
  springs: {
    x: [220, 16], lift: [200, 14], tilt: [160, 12], head: [130, 10], armN: [220, 15], elbN: [230, 16], fanN: [200, 14], armF: [180, 13], elbF: [190, 13], fanF: [180, 13],
    thighN: [300, 18], thighF: [300, 18], shinN: [300, 18], shinF: [300, 18], rollN: [300, 18], rollF: [300, 18],
    earN: [120, 8], earF: [120, 8], tutu: [70, 5], tutuB: [55, 4], tail0: [70, 6], tail1: [55, 4.6], tail2: [45, 3.8],
  },
  fast: ['x', 'armN', 'elbN', 'fanN', 'armF', 'elbF', 'fanF', 'thighN', 'thighF', 'shinN', 'shinF', 'rollN', 'rollF', 'lift'],
  kick: { tilt: -160, head: -200, tutu: 90, tutuB: -110, earN: 300, earF: -300, tail1: 300, tail2: -260 },
  turnKick: { tutu: 60, tutuB: -80, tail1: 300, tail2: -300, earN: 160, earF: -160 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const mo = a.mo ?? {};
    const st = mo.rig;
    const now = a.now;
    const dt = a.dt;
    const ease = (key, goal, rate) => (mo[key] = (mo[key] ?? goal) + (goal - (mo[key] ?? goal)) * Math.min(1, dt * rate));
    // Comedy or Tragedy: how far through into Tragedy she is (her poses, her ears, her tail).
    const trag = ease('psTrag', (a.psMask ?? 'comedy') === 'tragedy' ? 1 : 0, 4);
    a.psTrag = trag;
    const strideN = ease('psStride', 16 + 8 * trag, 3);
    a.psU = stepPhase(m, a, 'ps2', strideN * 1.1);
    const act = (at, wind, dur) => (at != null && now >= at - wind && now < at + dur ? { antic: now < at ? smooth(1 - (at - now) / wind) : 0, strike: now >= at ? (now - at < 0.07 ? smooth((now - at) / 0.07) : 1 - smooth(clamp((now - at - 0.25) / (dur - 0.25), 0, 1))) : 0 } : null);
    const confA = act(m.confettiAt, 0.35, 1);
    const tearsCast = m.castPose === 'tears' && m.cast ? smooth(clamp((now - m.cast.t0) / 0.5, 0, 1)) : 0;
    const tearsHit = act(m.tearsAt, 0, 1.1);
    const sp = a.psSpin;
    const spinW = sp ? window1(now, sp.at, SPIN + 0.45, 0.12, 0.3) : 0;
    const bothHold = window1(now, m.bothAt, SPIN + 1.4, 0.2, 0.4) * (1 - (sp ? 1 : 0));
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    let kind = trag > 0.5 ? 'slam' : 'flick';
    let ph = a.ph;
    if (!active && confA) {
      kind = 'confetti';
      ph = { ...a.ph, ...confA, since: -1 };
    }
    a.psKind = kind;
    a.psPh = ph;
    const walkW = a.walkW ?? 0;
    const still = 1 - walkW;
    const busy = active || confA || tearsCast > 0 || tearsHit || spinW > 0 || bothHold > 0 || walkW > 0.05;

    // ---- Comedy's idle, an 8 s act: up on her toes, bouncing; a curtsy; a "ta-da!".
    const lu = fr(t / 8) * 8;
    const curtsy = busy ? 0 : hold(lu, 2.6, 3.1, 3.9, 4.4);
    const tada = busy ? 0 : hold(lu, 5.4, 5.8, 6.6, 7);
    const rel = Math.sin(t * 2.2);
    const fl = Math.sin(t * 5.2);
    const liftC = 3 + rel * 0.7 - curtsy * 7.4;
    const rollC = 45 * (1 - curtsy);
    const armNC = 40 + curtsy * 20 - tada * 60;
    const elbNC = -45 + curtsy * 25 + tada * 55;
    const armFC = 150 + curtsy * 10 + tada * 45;
    const elbFC = -50 + tada * 40;
    const idleC = {
      x: 0, lift: liftC, tilt: 1 + curtsy * 8 - tada * 4, head: Math.sin(t * 1.3) * 3 + curtsy * 16 - tada * 8,
      armN: armNC, elbN: elbNC, fanN: aim(50 + fl * 6 + curtsy * 20 - tada * 22, armNC, elbNC), armF: armFC, elbF: elbFC, fanF: aim(-40 + fl * 6 - tada * 5, armFC, elbFC),
      ...legsAt(liftC, 1 + curtsy * 1, rollC, -1 - curtsy * 6, rollC), earN: Math.sin(t * 0.9) * 3 + (fr(t / 3.7) < 0.06 ? 14 : 0), earF: Math.sin(t * 0.9 + 1) * 3,
      tail0: 185 + Math.sin(t * 1.6) * 6, tail1: 45 + Math.sin(t * 1.6 - 0.8) * 8, tail2: 50 + Math.sin(t * 1.6 - 1.6) * 10,
    };
    // ---- Tragedy's idle, a 10 s act: slumped and breathing slowly; a sob; a wistful look up, the
    // mask clutched to her chest.
    const lv = fr(t / 10) * 10;
    const sob = busy ? 0 : hold(lv, 2.5, 2.9, 4.4, 4.8);
    const wist = busy ? 0 : hold(lv, 6.5, 7, 8, 8.5);
    const br = Math.sin(t * 1.1);
    const shud = sob * Math.sin(t * 24) * 0.9;
    const liftT = -1.6 + br * 0.4 + Math.abs(shud) * 0.5;
    const armNT = 70 - wist * 10;
    const elbNT = -40 - wist * 60;
    const idleT = {
      x: 0, lift: liftT, tilt: 7 + br - wist * 6 + shud, head: 12 + br * 2 + sob * 6 - wist * 24,
      armN: armNT, elbN: elbNT, fanN: aim(105 - wist * 30 + br * 3, armNT, elbNT, 7), armF: 145, elbF: -30, fanF: aim(235 + br * 3, 145, -30, 7),
      ...legsAt(liftT, 1.4, 0, -1.4, 0, 2), earN: 70 + br * 3 - wist * 20, earF: -66 - br * 3 + wist * 20,
      tail0: 168 + br * 2, tail1: -38, tail2: -42 + br * 3,
    };
    const idle = blend([[idleC, 1 - trag], [idleT, trag]]);
    a.psAct = { curtsy: curtsy * still * (1 - trag), tada: tada * still * (1 - trag), sob: sob * still * trag, wist: wist * still * trag };

    // ---- Walks, on planted feet (knees bending to wherever each foot is, so nothing slides):
    // Comedy a quick tiptoe on her toes, fans fluttering; Tragedy a slow flat-footed trudge.
    const u = a.psU;
    const lead = ((st?.ps2V ?? 0) / (strideN * 1.1)) * 0.05;
    const duty = 0.5 + 0.14 * trag;
    const stepUp = lerp(4.4, 2.2, trag);
    const [dxN, upN] = pawStep(u + lead, 0, strideN, duty, stepUp);
    const [dxF, upF] = pawStep(u + lead, 0.5, strideN, duty, stepUp);
    const w2 = u * TAU * 2;
    const land = (1 + Math.cos(w2)) / 2;
    const sw = Math.sin(u * TAU);
    const wLift = lerp(3 - land * 1.4, -1.8 - land * 1, trag);
    const wTilt = lerp(4 + land, 9 + land * 1.6, trag);
    const rStance = 40 * (1 - trag);
    const rSwing = lerp(62, 10, trag);
    const rN = rStance + (rSwing - rStance) * clamp(upN / stepUp, 0, 1);
    const rF = rStance + (rSwing - rStance) * clamp(upF / stepUp, 0, 1);
    const [thN, shN] = legIK(dxN, HIP + wLift - depth(rN) - upN, wTilt * 0.3);
    const [thF, shF] = legIK(dxF, HIP + wLift - depth(rF) - upF, wTilt * 0.3);
    const armNW = lerp(40 - land * 6, 70 + sw * 5, trag);
    const elbNW = lerp(-45, -40, trag);
    const armFW = lerp(165 + sw * 10, 145 - sw * 5, trag);
    const elbFW = lerp(-40, -30, trag);
    const walk = {
      x: 0, lift: wLift, tilt: wTilt, head: lerp(-2 + land * 2, 14 + land * 2, trag),
      armN: armNW, elbN: elbNW, fanN: aim(lerp(50 + Math.sin(w2) * 10, 105 + sw * 6, trag), armNW, elbNW, wTilt), armF: armFW, elbF: elbFW, fanF: aim(lerp(-40 + Math.sin(w2 + 1) * 10, 235, trag), armFW, elbFW, wTilt),
      thighN: thN, shinN: shN, thighF: thF, shinF: shF, rollN: rN, rollF: rF,
      earN: lerp(Math.sin(w2) * 4, 70, trag), earF: lerp(-Math.sin(w2) * 4, -66, trag),
      tail0: lerp(185 + sw * 8, 168 + sw * 3, trag), tail1: lerp(45 + Math.sin(w2 - 1) * 10, -38, trag), tail2: lerp(50 + Math.sin(w2 - 2) * 12, -42 + sw * 4, trag),
    };
    const [antic, strike] = psMove(kind, idle);
    let S = stateBlend({ ...a, ph }, idle, walk, antic, strike);
    // Only her arms, head and ears (her legs keep walking or standing).
    const over = (pose, k, legsToo = false) => {
      if (k <= 0.001) return;
      for (const [key, v] of Object.entries(pose)) if (legsToo || !/^(thigh|shin|roll)/.test(key)) S[key] = lerp(S[key] ?? v, v, k);
    };
    // Rain of Tears: through the cast both masks raised, head back, wailing, shuddering; as it
    // lands, flung out wide, the tears falling.
    a.psTears = Math.max(tearsCast * (1 - (tearsHit?.strike ?? 0)), 0);
    if (tearsCast > 0 || tearsHit) {
      const sh = Math.sin(now * 26) * 1.2 * tearsCast;
      over({ lift: 3, tilt: -6 + sh, head: -12, armN: -20, elbN: 10, fanN: aim(28, -20, 10, -6), armF: 195, elbF: -10, fanF: aim(-45, 195, -10, -6), earN: 60, earF: -56 }, tearsCast * (1 - (tearsHit?.strike ?? 0)));
      over({ ...legsAt(3, 1, 45, -1, 45, -2) }, tearsCast * (1 - (tearsHit?.strike ?? 0)) * still, true);
      if (tearsHit) {
        over({ lift: -4, tilt: 12, head: 8, armN: 30, elbN: 0, fanN: aim(110, 30, 0, 12), armF: 160, elbF: 0, fanF: aim(-110, 160, 0, 12), earN: 74, earF: -70 }, tearsHit.strike);
        over({ ...legsAt(-4, 2.4, 0, -2.4, 0, 3.6) }, tearsHit.strike * still, true);
      }
    }
    // The pirouette: up on one toe, the other foot drawn up to her knee (passe), both fans raised.
    if (spinW > 0) {
      over({ lift: 3.6, tilt: 0, head: -4, armN: -20, elbN: 10, fanN: aim(28, -20, 10), armF: 195, elbF: -10, fanF: aim(-45, 195, -10), ...legsAt(3.6, 0, 45, -0.4, 60), thighN: -66, shinN: 120, rollN: 62 }, spinW, true);
    }
    // Both masks at once: she comes out of the spin holding both up high, chin up.
    if (bothHold > 0) over({ lift: 2, tilt: -4, head: -8, armN: -20, elbN: 10, fanN: aim(26, -20, 10, -4), armF: 195, elbF: -10, fanF: aim(-45, 195, -10, -4) }, bothHold);
    a.psSpinW = spinW;
    a.psBoth = bothHold;
    // The tutu kept level, swinging a beat behind.
    S.tutu = -S.tilt * 0.3 + Math.sin(t * 3) * 1.2 * (1 - trag) + Math.sin(w2) * 2 * walkW * (1 - trag);
    S.tutuB = -S.tilt * 0.3 + Math.sin(t * 3 - 0.6) * 1.4 * (1 - trag);
    a.psMood = psMood(a, m);
    return S;
  },
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -HIP - S.lift], rot: (S) => S.tilt * 0.3 * D2R },
    { name: 'chest', parent: 'hip', at: () => [0, -2], rot: (S) => S.tilt * 0.7 * D2R },
    { name: 'nk', parent: 'chest', at: () => [1, -24], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'elbowN', parent: 'upN', at: () => [UA, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [UA, 0] },
    { name: 'gripN', parent: 'foreN', at: () => [FA, 0] },
    { name: 'gripF', parent: 'foreF', at: () => [FA, 0] },
    { name: 'kneeN', parent: 'thighN', at: () => [0, L1] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, L1] },
    { name: 'ankleN', parent: 'shinN', at: () => [0, L2] },
    { name: 'ankleF', parent: 'shinF', at: () => [0, L2] },
    ...psPass(false),
    ...psPass(true),
  ],
  // Her own spotlight, warm gold in Comedy, cool blue in Tragedy.
  under(ctx, m, a) {
    const k = a.psTrag ?? 0;
    const al = (0.34 + Math.sin(a.now * 1.6) * 0.04) * a.alpha * (m.hp > 0 ? 1 : 0.5);
    const g = ctx.createRadialGradient(0, -1, 0, 0, -1, 34);
    const c = `${Math.round(lerp(255, 190, k))},${Math.round(lerp(232, 210, k))},${Math.round(lerp(170, 255, k))}`;
    g.addColorStop(0, `rgba(${c},${al})`);
    g.addColorStop(0.7, `rgba(${c},${al * 0.6})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.save();
    ctx.scale(1, 0.18);
    ctx.fillRect(-34, -40, 68, 68);
    ctx.restore();
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const ph = a.psPh ?? a.ph;
    const kind = a.psKind;
    const gold = side(a) === 'g';
    const fanOf = (comedy) => (comedy === gold ? 'fanN' : 'fanF');
    const CONF = ['#ff6b9a', '#ffd36b', '#7ae0c0', '#7fa8ff', '#ffffff', '#c88aff'];
    const bit = (x, y, rot, c, al) => {
      ctx.save();
      ctx.globalAlpha = a.alpha * al;
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = c;
      ctx.fillRect(-1.4, -0.8, 2.8, 1.6);
      ctx.restore();
    };
    const tear = (x, y, r, al) => {
      ctx.globalAlpha = a.alpha * al;
      ctx.fillStyle = '#3a6ab8';
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.25, r * 1.6, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#8ad8ff';
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.85, r * 1.2, 0, 0, TAU);
      ctx.fill();
    };
    // Comedy's swing: a gold sweep through the air after the fan, a few bits of confetti on it.
    if (kind === 'flick' && ph.strike > 0.15) {
      const [sx, sy] = at2(mat('upN'), 0, 0);
      const al = ph.strike;
      // (A trail, thin and faint at its tail low down, fattening up to the fan.)
      const a0 = 1.55;
      const a1 = -0.8;
      ctx.lineCap = 'round';
      for (let k = 0; k < 7; k++) {
        const f0 = a0 + ((a1 - a0) * k) / 7;
        const f1 = a0 + ((a1 - a0) * (k + 1)) / 7;
        ctx.globalAlpha = a.alpha * al * (0.25 + (0.75 * k) / 6);
        ctx.strokeStyle = '#ffd36b';
        ctx.lineWidth = 1 + (3.6 * k) / 6;
        ctx.beginPath();
        ctx.arc(sx, sy, 31, f0, f1, true);
        ctx.stroke();
        ctx.strokeStyle = '#fff6d8';
        ctx.lineWidth = 0.4 + (1.4 * k) / 6;
        ctx.beginPath();
        ctx.arc(sx, sy, 31, f0, f1, true);
        ctx.stroke();
      }
      for (let k = 0; k < 5; k++) {
        const an = 1.2 - k * 0.45;
        const r = 34 + (1 - al) * 12 + (k % 2) * 4;
        bit(sx + Math.cos(an) * r, sy + Math.sin(an) * r + (1 - al) * 8, k + a.now * 9, CONF[k % 6], al);
      }
    }
    // Tragedy's swing: a splash of tears where the mask comes down.
    if (kind === 'slam' && ph.strike > 0.2) {
      const [mx, my] = at2(mat('fanN'), 0, -19);
      for (let k = 0; k < 7; k++) {
        const an = Math.PI * (1.1 + (k / 6) * 0.8);
        const r = 6 + (1 - ph.strike) * 22;
        tear(mx + Math.cos(an) * r, my + Math.sin(an) * r * 0.8 + (1 - ph.strike) * 10, 1.2, ph.strike);
      }
    }
    // Confetti: the Comedy fan bursts, a fountain of confetti, ribbons of it, falling and turning.
    if (m.confettiAt != null) {
      const s = a.now - m.confettiAt;
      if (s >= 0 && s < 1.3) {
        const conf = mo(a);
        if (conf.at !== m.confettiAt) Object.assign(conf, { at: m.confettiAt, xy: at2(mat(fanOf(true)), 0, -19) });
        const [ox, oy] = conf.xy;
        const al = 1 - smooth(clamp((s - 0.7) / 0.6, 0, 1));
        for (let k = 0; k < 18; k++) {
          const an = -Math.PI * (0.15 + 0.7 * fr(k * 0.618));
          const v = 40 + fr(k * 0.37) * 50;
          const x = ox + Math.cos(an) * v * s;
          const y = oy + Math.sin(an) * v * s + 70 * s * s;
          bit(x, y, k * 1.7 + s * (6 + (k % 3) * 3), CONF[k % 6], al);
        }
        if (s < 0.3) sparkle(ctx, a, ox, oy, 7 * (1 - s / 0.3), 1 - s / 0.3, '#fff6d8');
      }
    }
    // Rain of Tears: tears welling out of the Tragedy mask through the cast, then thrown up in a
    // fountain as it lands.
    if ((a.psTears ?? 0) > 0.2) {
      const [tx, ty] = at2(mat(fanOf(false)), 0, -19);
      for (let k = 0; k < 4; k++) {
        const q = fr(a.now * 1.4 + k / 4);
        tear(tx + (k - 1.5) * 3, ty + 4 + q * 14, 1 - q * 0.3, a.psTears * (1 - q));
      }
    }
    if (m.tearsAt != null) {
      const s = a.now - m.tearsAt;
      if (s >= 0 && s < 1) {
        const [tx, ty] = at2(mat(fanOf(false)), 0, -19);
        for (let k = 0; k < 12; k++) {
          const an = -Math.PI * (0.1 + 0.8 * (k / 11));
          const v = 46 + (k % 3) * 10;
          tear(tx + Math.cos(an) * v * s, ty + Math.sin(an) * v * s + 90 * s * s, 1.3, 1 - s);
        }
      }
    }
    // Her own tears: in a sob, dripping off her cheeks.
    if ((a.psAct?.sob ?? 0) > 0.3 || a.psMood === 'wail') {
      for (const [ex, k] of [[9, 0], [-3.6, 0.5]]) {
        const q = fr(a.now * 1.3 + k);
        const [dx, dy] = at2(mat('nk'), ex, -8);
        tear(dx, dy + q * 16, 0.9, 1 - q);
      }
    }
    // The pirouette: swirls of light round her, and as she comes out of a change, a burst of
    // sparkles in her new colour.
    if ((a.psSpinW ?? 0) > 0.05) {
      const w = a.psSpinW;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      for (const [y, rx, off] of [[-24, 26, 0], [-44, 20, 1.6]]) {
        const s0 = a.now * 14 + off;
        ctx.globalAlpha = a.alpha * w * 0.7;
        ctx.beginPath();
        ctx.ellipse(0, y, rx, rx * 0.22, 0, s0, s0 + 2.2);
        ctx.stroke();
      }
      for (let k = 0; k < 3; k++) sparkle(ctx, a, Math.cos(a.now * 9 + k * 2.1) * 24, -30 - k * 10 + Math.sin(a.now * 9 + k * 2.1) * 4, 2.4, w, k % 2 ? '#fff3c4' : '#d8e4ff');
    }
    const sp = a.psSpin;
    if (sp?.swap && sp.u > 0.75) {
      const q = (sp.u - 0.75) / 0.25;
      for (let k = 0; k < 8; k++) {
        const an = (k / 8) * TAU;
        sparkle(ctx, a, Math.cos(an) * (10 + q * 26), -36 + Math.sin(an) * (10 + q * 22), 2.6 * (1 - q * 0.6), 1 - q, gold ? '#ffd36b' : '#8ab0ff');
      }
    }
    // Both masks at once: a gold star and a blue one circling her tiara.
    if (m.mech?.both) {
      const [hx, hy] = at2(mat('nk'), 1, -30);
      const an = a.now * 3;
      sparkle(ctx, a, hx + Math.cos(an) * 18, hy + Math.sin(an) * 5, 2.4, 0.9, '#ffd36b');
      sparkle(ctx, a, hx - Math.cos(an) * 18, hy - Math.sin(an) * 5, 2.4, 0.9, '#8ab0ff');
    }
    // Comedy's idle: a twinkle on her tiara now and then.
    if ((a.psTrag ?? 0) < 0.5) {
      const q = fr((a.t + (a.uidOff ?? 0)) / 3.1);
      if (q < 0.2) {
        const [hx, hy] = at2(mat('nk'), 1, -31.4);
        sparkle(ctx, a, hx + 2, hy - 2, 3 * Math.sin((q / 0.2) * Math.PI), Math.sin((q / 0.2) * Math.PI), '#ffffff');
      }
    }
    ctx.globalAlpha = a.alpha;
  },
})), 1.1);
const mo = (a) => ((a.mo ??= {}).psConf ??= {});

function psMood(a, m) {
  if (m.hp <= 0) return 'dead';
  const trag = (a.psTrag ?? 0) > 0.5;
  const ph = a.psPh ?? a.ph;
  if ((a.psBoth ?? 0) > 0.3) return 'shout';
  if ((a.psSpinW ?? 0) > 0.3) return trag ? 'sigh' : 'giggle';
  if ((a.psTears ?? 0) > 0.3) return 'wail';
  if (ph.strike > 0.25) return a.psKind === 'slam' ? 'wail' : 'shout';
  if (a.ph.atk || ph.antic > 0.3) return trag ? 'sob' : 'grin';
  if (a.mood === 'hurt' || a.face === 'hurt') return 'hurt';
  // (In her entrance scene, the face it gives her.)
  const cm = m.cine?.mood;
  if (cm === 'happy') return 'giggle';
  if (cm === 'sad') return 'sad';
  if (cm === 'angry') return trag ? 'wail' : 'grin';
  if (cm === 'blink') return trag ? 'sblink' : 'blink';
  const act = a.psAct ?? {};
  if (act.curtsy > 0.4) return 'giggle';
  if (act.tada > 0.4) return 'wink';
  if (act.sob > 0.4) return 'sob';
  if (act.wist > 0.4) return 'sigh';
  const t = a.t + (a.uidOff ?? 0);
  if (t % 4.1 < 0.13) return trag ? 'sblink' : 'blink';
  return trag ? 'sad' : 'idle';
}

// ---------- The still (portraits) ----------
export function personaStill(pose, f, mood) {
  const fm = MOODS.has(mood) || mood === 'idle' ? mood : 'idle';
  const sd = 'g';
  const lift = 3;
  const lg = legsAt(lift, 1, 45, -1, 45);
  const hip = [0, -HIP - lift];
  const ch = [0, hip[1] - 2];
  const nk = [1, ch[1] - 24];
  const legAt = (far) => {
    const x = far ? -3.4 : 3.6;
    const k = far ? 'F' : 'N';
    const th = lg[`thigh${k}`];
    const sh = lg[`shin${k}`];
    const tr = th * D2R;
    const kx = x - Math.sin(tr) * L1;
    const ky = hip[1] + Math.cos(tr) * L1;
    const sr = (th + sh) * D2R;
    return [...put(shoeP(sd, far)(), [4, 1.2], kx - Math.sin(sr) * L2, ky + Math.cos(sr) * L2, lg[`roll${k}`]), ...put(shinP(sd, far)(), [4.5, 1], kx, ky, th + sh), ...put(thighP(sd, far)(), [4, 1.5], x, hip[1], th)];
  };
  const arm = (far, armA, elbA, fanA) => {
    const [sx, sy] = far ? [SHF[0], ch[1] + SHF[1]] : [SHN[0], ch[1] + SHN[1]];
    const ex = sx + Math.cos(armA * D2R) * UA;
    const ey = sy + Math.sin(armA * D2R) * UA;
    const fa = armA + elbA;
    const gx = ex + Math.cos(fa * D2R) * FA;
    const gy = ey + Math.sin(fa * D2R) * FA;
    return [...put(upperP(sd, far)(), [2, 4], sx, sy, armA), ...put(foreP(sd, far)(), [2, 4], ex, ey, fa), ...put(fanP(!far)(), [13, 32], gx, gy, fanA), ...put(mittP(far)(), [4.5, 4.5], gx, gy, 0)];
  };
  const tail = [];
  let [tx, ty, ta] = [-8, hip[1] - 8, 185];
  [185, 45, 50].forEach((r, n) => {
    ta = n ? ta + r : r;
    tail.push(...put(tailP(sd, n)(), [3, 4], tx, ty, ta));
    tx += Math.cos(ta * D2R) * TAIL[n];
    ty += Math.sin(ta * D2R) * TAIL[n];
  });
  const faceMood = ['idle', 'blink', 'giggle', 'wink', 'grin', 'shout', 'hurt', 'dead'].includes(fm) ? fm : 'idle';
  return { w: 60, h: 92, res: 2, shapes: shift([
    ...tail,
    ...arm(true, 150, -50, -40),
    ...legAt(true), ...put(bodyP(sd)(), [14, 28], ch[0], ch[1]), ...legAt(false),
    ...put(tutuP(sd, false)(), [24, 4], 0, hip[1] - 1), ...put(tutuP(sd, true)(), [24, 4], 0, hip[1] - 2.4),
    ...put(earP(sd, true)(), [7, 16], nk[0] - 7.5, nk[1] - 25, -24), ...put(earP(sd, false)(), [7, 16], nk[0] + 7, nk[1] - 26.5, 6),
    ...put(headP(sd)(), [22, 40], nk[0], nk[1]), ...put(faceOf(sd, faceMood), [22, 40], nk[0], nk[1]),
    ...arm(false, 30, -50, 35),
  ], 30, 91) };
}
