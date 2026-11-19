// The Phantom Playwright (redrawn 2026-11-19, the player's pick "B, the Masked Author", then
// reworked at their word: legs that didn't join his body, a half-mask that read as an eyepatch, a
// lopsided mouth; their pick for the mask "B, a masquerade mask, polished"): the Dream Theatre's
// last act, a pale phantom gentleman, chibi like the rest. A violet masquerade mask across both
// eyes (gold-trimmed, its wing tips swept up, a little jewel at the near tip, gold brows worked on
// it that move with his mood), dark violet hair swept back in a wave with a lock over his brow, a
// small top hat tipped at a jaunty angle with a white quill-feather in its band, a midnight
// tailcoat (its two tails swinging behind him) closing at the waist over a cream waistcoat with gold
// buttons and the seat of his trousers, a white cravat, white spats. His giant white quill in his
// near hand, held like a rapier; a page of his script in the far one; pages of it whirling round
// him.
//
// How he moves:
//   idle    a 10 s act: writing in the air, little strokes of glowing ink left hanging; a twirl
//           of the quill; a soft chuckle, head back.
//   walk    a gentleman's stride on planted feet, chin up, the quill carried up at his shoulder,
//           his coat tails and hat feather swinging after.
//   fight   (world/theatre.js) a plain swing is a fencing lunge, the quill thrust; the script
//           rains (m.pagesAt): a flourish written in the air, then pages flung up; the Curtain
//           Falls (a cast bar, m.castPose 'curtain', landing at m.curtainAt): arms raised high,
//           laughing, then swept down in a bow as it sweeps the stage; a Plot Twist (m.twistAt):
//           the quill twirled and flung up to point; a new act (m.laughAt): a laugh.
//   scene   he rises out of the stage through the boards (world/director.js 'sink' and
//           'emerge'), ink pooling where he comes up; his scene wind-up and swing are the lunge.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, faceShapes, sparkle } from './rigkit.js';

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
const INK = '#2e1c26';
const line = (pts, w, c = INK) => stroke(pts, w, c).map(F);
const aim = (want, arm, elb, tilt = 0) => want - arm - elb - tilt;
const unwind = (st, name, goal) => {
  const sp = st?.[name];
  if (!sp) return;
  if (sp.x - goal > 270) sp.x -= 360;
  else if (goal - sp.x > 270) sp.x += 360;
};

const PALE = ramp('#f2ecfa', { step: 6, turn: 8 });
const MID = ramp('#2a2a5a', { step: 9, turn: 10 });
const HAIR = ramp('#4a3a7a', { step: 9, turn: 8 });
const PAGE = ramp('#fbf4e2', { step: 7, turn: 8 });
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
const TROUSER = ramp('#2e2848', { step: 7, turn: 8 });
const MASK = ramp('#5a3a8a', { step: 9, turn: 8 });
const pw = pairOf('pw3');

// ---------- Parts ----------
// (Rig space: the hip 22.6 above the floor, the chest joint 2 above it, the neck 20 above that, the
// head's middle 16 above the neck. Shoulders at (6, -16) and (-6, -16) on the chest.)
const HX = 23;
const HY = 22;
// His head: pale, his hair swept back in a wave, a lock over his brow on the near side, and his
// masquerade mask across both eyes: violet, gold along its edges, its wing tips swept up, a jewel at
// the near tip, a sheen (the eyes in it, and the gold brows on it, are on the face). Box 46 x 40;
// the neck (23, 38).
const MASK_PTS = [[HX - 15, HY - 4], [HX - 18, HY - 9.6], [HX - 10, HY - 6.4], [HX, HY - 5.4], [HX + 11, HY - 6.8], [HX + 15.4, HY - 9.8], [HX + 14.4, HY - 2], [HX + 9, HY + 4], [HX + 2.4, HY + 3], [HX - 0.6, HY + 1], [HX - 4, HY + 3], [HX - 11, HY + 4]];
const headP = () => [
  blob([[HX - 14, HY - 4], [HX - 5, HY - 15], [HX + 10, HY - 14], [HX + 15, HY - 5], [HX - 15, HY + 8], [HX - 19, HY + 4]], HAIR.base, 2),
  E(HX, HY, 15, 14, PALE.base), crescent(HX, HY, 15, 14, PALE.sh, { k: 0.14, a0: 110, a1: 210 }),
  blob([[HX - 14, HY - 5], [HX - 3, HY - 14], [HX + 11, HY - 13], [HX + 15, HY - 4], [HX + 8, HY - 6], [HX + 4, HY - 2], [HX + 2, HY - 7], [HX - 6, HY - 6]], HAIR.base, 2), F(taper([[HX - 4, HY - 12], [HX + 8, HY - 11]], 1.2, 0.8, HAIR.hi)),
  blob(MASK_PTS, MASK.base, 2),
  ...line([[HX - 18, HY - 9.6], [HX - 10, HY - 6.4], [HX, HY - 5.4], [HX + 11, HY - 6.8], [HX + 15.4, HY - 9.8]], 0.8, GOLD.base), ...line([[HX + 14.4, HY - 2], [HX + 9, HY + 4], [HX + 2.4, HY + 3], [HX - 0.6, HY + 1], [HX - 4, HY + 3], [HX - 11, HY + 4], [HX - 15, HY - 4]], 0.6, GOLD.sh),
  F(taper([[HX - 12, HY - 3.4], [HX - 7, HY - 4.6], [HX - 2, HY - 4]], 1, 0.6, MASK.hi)), ...[-8, 4, 9.6].map((dx) => F(E(HX + dx, HY - 5.6 - (dx > 0 ? dx * 0.07 : 0), 0.45, 0.45, '#fff3c4'))),
  E(HX + 15, HY - 9.4, 1.5, 1.5, '#e8384a'), F(E(HX + 14.6, HY - 9.8, 0.5, 0.5, '#ffffff')),
];
// The top hat (box 30 x 24, sat on its brim's middle (15, 20)): small, dark, a plum band.
const hatP = () => [
  R(8.6, 6, 12.8, 12, '#1e1a30'), E(15, 6.4, 6.4, 1.6, '#2a2640'), F(R(9.6, 7, 2.4, 9, '#3a3450')), R(8.6, 14.4, 12.8, 2.8, '#8a3a5a'), F(R(8.6, 14.4, 12.8, 0.8, '#b85a7a')),
  E(15, 19, 12, 2.6, '#1e1a30'), F(E(13.4, 18.4, 8, 0.9, '#3a3450')),
];
// The quill-feather in his hat band (box 10 x 20 from its root (4, 18)).
const plumeP = () => [blob([[4, 18], [2, 11], [3.4, 4], [7, 1], [8.4, 7], [7, 13]], '#ffffff', 2), ...[6, 10, 13].map((y) => F(taper([[5, y], [7.4, y - 2.2]], 0.5, 0.3, '#d8d0e8'))), taper([[4.4, 18], [6, 3]], 0.7, 0.4, '#c8c0d8')];
// The tailcoat's front closing at the waist, its hem curving down a little over the top of his
// trousers, the waistcoat inside it (box 28 x 24; the chest joint (14, 20)).
const bodyP = () => [
  blob([[5, 2], [23, 2], [25, 11], [24.4, 21.6], [14, 23], [3.6, 21.6], [3, 11]], MID.base, 2),
  T([[10.6, 2], [17.4, 2], [18.6, 17], [14, 20], [9.4, 17]], PAGE.base), F(T([[10.6, 2], [12.2, 2], [10.4, 16]], '#ffffff')), ...[8, 12, 16].map((y) => E(14.1, y, 1, 1, GOLD.base)),
  T([[8, 2], [10.6, 2], [9.4, 12], [5.6, 7]], MID.hi), T([[20, 2], [17.4, 2], [18.6, 12], [22.4, 7]], MID.hi), F(taper([[5, 5], [4.6, 19]], 1.6, 2, MID.sh)),
];
// The seat of his trousers, which his legs hang from and his coat closes over: no wider than his
// legs, rounding down into the top of each (box 22 x 11 from the hip (11, 2)).
const seatP = () => [blob([[3, 0.6], [19, 0.6], [20, 4], [17.4, 8.6], [15, 9.6], [11, 7.4], [7, 9.6], [4.6, 8.6], [2, 4]], TROUSER.base, 2), F(taper([[4.4, 3], [5.6, 7.6]], 1, 0.8, TROUSER.hi))];
// The cravat (box 12 x 12 from its knot (6, 1)): a white ruffle, a gold pin.
const cravatP = () => [blob([[2, 1], [10, 1], [11, 5], [8, 11], [6, 9], [4, 11], [1, 5]], '#ffffff', 2), F(taper([[4, 4], [5.4, 9]], 0.5, 0.4, '#d8d0e8')), F(taper([[8, 4], [6.8, 9]], 0.5, 0.4, '#d8d0e8')), E(6, 3.6, 1.3, 1.3, GOLD.base)];
// A coat tail (box 8 x 22 from (4, 1)).
const tailP = (k) => () => [blob([[1, 1], [7, 1], [7.4, 12], [6, 20], [3, 21], [1.4, 11]], k ? MID.base : MID.sh, 2), F(taper([[6, 3], [5.4, 18]], 1, 0.8, '#4a3a7a'))];
// An arm in a midnight sleeve: the upper (box 12 x 8 from (2, 4); the elbow 8 on), the forearm and
// its white cuff (box 12 x 8 from (2, 4); the grip 7.5 on), a white glove (box 9 x 9 about (4.5, 4.5)).
const upperP = (far) => () => [taper([[2, 4], [10, 4]], 5.6, 5, far ? MID.sh : MID.base), F(E(4, 2.6, 1.8, 0.8, far ? MID.base : MID.hi))];
const foreP = (far) => () => [taper([[2, 4], [9, 4]], 5, 4.6, far ? MID.sh : MID.base), R(7.4, 1.2, 2.4, 5.6, far ? '#e4dcf0' : '#ffffff')];
const gloveP = (far) => () => [E(4.5, 4.5, 3.4, 3.2, far ? '#e4dcf0' : '#ffffff'), F(E(3.4, 3.4, 1, 0.7, '#ffffff')), F(taper([[2.6, 6], [5.6, 6.4]], 0.5, 0.4, '#d8d0e8'))];
// A leg: the trouser thigh (box 9 x 13 from the hip (4.5, 1.5); the knee 9 down), the shin (box 8
// x 13 from the knee (4, 2); the ankle 9.4 down), a black shoe under a white spat (box 13 x 8 from
// the ankle (4, 1.4); the sole 4.4 under it). (Both trouser pieces end round at the knee, the same
// width, so however far it bends it bends in one smooth curve, never a notch.)
const thighP = (far) => () => [taper([[4.5, 1.5], [4.5, 10.5]], 6.6, 5.8, far ? TROUSER.sh : TROUSER.base), E(4.5, 10.5, 2.9, 2.9, far ? TROUSER.sh : TROUSER.base), F(taper([[2.8, 3], [3, 9]], 0.8, 0.6, far ? TROUSER.base : TROUSER.hi))];
const shinP = (far) => () => [E(4, 2, 2.9, 2.9, far ? TROUSER.sh : TROUSER.base), taper([[4, 2], [4, 11.6]], 5.8, 5.2, far ? TROUSER.sh : TROUSER.base)];
const footP = (far) => () => [
  blob([[0.6, 1.6], [7, 1.4], [10.6, 2.8], [12.4, 4.6], [12, 5.8], [0.6, 5.8]], far ? '#2a2430' : '#1a1420', 1), F(E(10, 3.4, 1.4, 0.6, '#5a5068')),
  blob([[0.4, 0], [6.4, 0], [7.6, 3], [0.4, 3.4]], far ? '#e4dcf0' : '#ffffff', 1), F(E(3, 2, 0.5, 0.5, '#c8c0d8')),
];
// The giant quill, gripped at its gold nib's end (6, 6): the shaft and the great white feather
// reaching out forward. Box 42 x 12.
const quillP = () => [
  blob([[6, 6], [16, 2.6], [30, 1], [41, 4.6], [30, 9], [16, 8.6]], '#ffffff', 2),
  ...[18, 23, 28, 33].map((x) => F(taper([[x, 5.4], [x + 3.4, 2.4]], 0.5, 0.3, '#d8d0e8'))), ...[20, 26, 32].map((x) => F(taper([[x, 6.4], [x + 3, 8.4]], 0.5, 0.3, '#e4dcf0'))),
  taper([[7, 6], [40, 5]], 1, 0.5, '#c8c0d8'), T([[0, 6.4], [7, 5], [7, 7.6]], GOLD.base), F(T([[0.4, 6.4], [4, 6], [4, 6.8]], '#5a3a2a')),
];
// A page of his script (box 11 x 13, held at its lower corner (2, 11)).
const pageP = () => [R(1, 1, 9, 11, '#e8dcc8'), R(1.4, 1.4, 8.2, 10.2, PAGE.base), ...[3.4, 5.4, 7.4, 9.4].map((y, k) => F(R(2.6, y, k === 3 ? 3.6 : 6, 0.6, '#6a5a9a'))), F(R(7.6, 1.4, 2, 2, '#e8dcc8'))];
const PW = {
  HEAD: pw('head', 46, 40, headP, 2), HAT: pw('hat', 30, 24, hatP, 2), PLUME: pw('plume', 10, 20, plumeP, 2), BODY: pw('body', 28, 24, bodyP, 2), SEAT: pw('seat', 22, 11, seatP, 2), CRAVAT: pw('cravat', 12, 12, cravatP, 2),
  TAIL: [0, 1].map((k) => pw(`tail${k}`, 8, 22, tailP(k), 2)),
  UP: [false, true].map((f) => pw(`up${f ? 1 : 0}`, 12, 8, upperP(f), 2)), FORE: [false, true].map((f) => pw(`fore${f ? 1 : 0}`, 12, 8, foreP(f), 2)), GLOVE: [false, true].map((f) => pw(`glove${f ? 1 : 0}`, 9, 9, gloveP(f), 2)),
  THIGH: [false, true].map((f) => pw(`thigh${f ? 1 : 0}`, 9, 13.4, thighP(f), 2)), SHIN: [false, true].map((f) => pw(`shin${f ? 1 : 0}`, 8, 13, shinP(f), 2)), FOOT: [false, true].map((f) => pw(`foot${f ? 1 : 0}`, 13, 8, footP(f), 2)),
  QUILL: pw('quill', 42, 12, quillP, 2), PAGE: pw('page', 11, 13, pageP, 2),
};

// ---------- Faces (on the head; box 46 x 40 as it) ----------
// Big glossy violet eyes in the mask's eye holes; gold brows worked on the mask above them that
// carry his mood; a small smile in the middle of his face; a blush below the mask.
const EN = [HX + 6.4, HY - 0.6, 3.2];
const EF = [HX - 5, HY - 0.6, 2.7];
const LIP = '#7a3040';
const holes = () => [F(E(EN[0], EN[1], 4, 3.8, '#2a1a40')), F(E(EF[0], EF[1], 3.4, 3.2, '#2a1a40'))];
const eye = ([x, y, r], { lid = 0, small = false, look = 0 } = {}) => [
  F(E(x, y, r, r * 1.1, INK)), F(E(x, y + r * 0.35 + look, r * 0.8, r * 0.7, '#a07aff')),
  ...(small ? [F(E(x, y + look, r * 0.3, r * 0.34, '#ffffff'))] : [F(E(x - r * 0.3, y - r * 0.4, r * 0.4, r * 0.42, '#ffffff')), F(E(x + r * 0.35, y + r * 0.4, r * 0.15, r * 0.15, '#ffffff'))]),
  ...(lid > 0 ? [F(T([...arcP(x, y, r * 1.14, r * 1.24, 180, 360, 8), ...arcP(x, y - r * 1.1 * (1 - lid * 2), r * 1.14, r * 0.35, 0, 180, 8)], '#2a1a40')), ...line(arcP(x, y - r * 1.1 * (1 - lid * 2), r * 1.05, r * 0.32, 15, 165, 7), 0.6, '#c8b8f0')] : []),
];
const shut = ([x, y, r], up = false) => line(arcP(x, y + 0.6, r, r * 0.6, up ? 200 : 20, up ? 340 : 160, 7), 0.8, '#e8dcff');
// (The gold brows on the mask: `k` lifts them, `v` angles them down toward the middle (cross).)
const brows = (k = 0, v = 0) => [F(taper([[EN[0] - 3, EN[1] - 4.6 - k + v], [EN[0] + 3.4, EN[1] - 5.6 - k - v * 0.4]], 1, 0.6, GOLD.hi)), F(taper([[EF[0] - 2.6, EF[1] - 4.4 - k - v * 0.4], [EF[0] + 2.4, EF[1] - 4.6 - k + v]], 0.9, 0.5, GOLD.hi))];
const smile = () => line([[HX + 1.6, HY + 7], [HX + 3.4, HY + 8.4], [HX + 5.4, HY + 8.2], [HX + 7, HY + 6.6]], 0.8, LIP);
const grin = (k = 1) => [F(T(arcP(HX + 4.2, HY + 6.8, 3.2 * k, 2.8 * k, 0, 180, 9), LIP)), F(E(HX + 4.2, HY + 8 + k, 1.5 * k, 0.8 * k, '#ff9ab0')), F(R(HX + 1.8, HY + 6.8, 4.8 * k, 0.8, '#ffffff'))];
const shoutO = () => [F(E(HX + 4.4, HY + 7.8, 2.2, 2.4, LIP)), F(E(HX + 4.4, HY + 9, 1.3, 0.7, '#ff9ab0'))];
const pout = () => [F(E(HX + 4.4, HY + 7.6, 1, 0.8, LIP))];
const frown = () => line(arcP(HX + 4.4, HY + 8.8, 2.4, 1.2, 200, 340, 6), 0.8, LIP);
const blush = (k = 1) => [F(E(HX + 10.4, HY + 5.4, 2 * k, 1 * k, '#ffb0c8')), F(E(HX - 8, HY + 5.4, 1.8 * k, 0.9 * k, '#ffb0c8'))];
const PW_FACES = {
  // Pleased with himself.
  idle: () => [...holes(), ...eye(EN, { lid: 0.12 }), ...eye(EF, { lid: 0.12 }), ...brows(0, 0), ...smile(), ...blush()],
  blink: () => [...holes(), ...shut(EN), ...shut(EF), ...brows(0, 0), ...smile(), ...blush()],
  // Writing: eyes on his stroke, a little pout of concentration.
  write: () => [...holes(), ...eye(EN, { lid: 0.32, look: 0.6 }), ...eye(EF, { lid: 0.32, look: 0.6 }), ...brows(-0.4, 0.8), ...pout(), ...blush()],
  laugh: () => [...holes(), ...shut(EN, true), ...shut(EF, true), ...brows(1.2, -0.4), ...grin(1.1), ...blush(1.2)],
  happy: () => [...holes(), ...shut(EN, true), ...shut(EF, true), ...brows(1, 0), ...grin(0.9), ...blush(1.1)],
  // A fencer's glare: lids low, gold brows down hard, a thin grin.
  angry: () => [...holes(), ...eye(EN, { lid: 0.34, small: true }), ...eye(EF, { lid: 0.34, small: true }), ...brows(-0.6, 2), ...line([[HX + 1.4, HY + 7.6], [HX + 4.4, HY + 8.6], [HX + 7.4, HY + 7]], 0.8, LIP), ...blush(0.8)],
  shout: () => [...holes(), ...eye(EN, { small: true }), ...eye(EF, { small: true }), ...brows(1.4, 0), ...shoutO(), ...blush()],
  hurt: () => [...holes(), ...line([[EN[0] + 2.4, EN[1] - 1.8], [EN[0] - 1.4, EN[1]], [EN[0] + 2.4, EN[1] + 1.8]], 0.8, '#e8dcff'), ...line([[EF[0] - 2, EF[1] - 1.6], [EF[0] + 1.2, EF[1]], [EF[0] - 2, EF[1] + 1.6]], 0.8, '#e8dcff'), ...brows(0.6, -1), ...frown(), F(E(HX + 12, HY + 2.4, 0.9, 1.4, '#8ad8ff'))],
  dead: () => [...holes(), ...line([[EN[0] - 2, EN[1] - 2], [EN[0] + 2, EN[1] + 2]], 0.8, '#e8dcff'), ...line([[EN[0] + 2, EN[1] - 2], [EN[0] - 2, EN[1] + 2]], 0.8, '#e8dcff'), ...line([[EF[0] - 1.6, EF[1] - 1.6], [EF[0] + 1.6, EF[1] + 1.6]], 0.7, '#e8dcff'), ...line([[EF[0] + 1.6, EF[1] - 1.6], [EF[0] - 1.6, EF[1] + 1.6]], 0.7, '#e8dcff'), ...frown()],
};
const FACE_FB = { eyes: [[EN[0], EN[1], 2.8, 3, 1], [EF[0], EF[1], 2.2, 2.4, -1]], mouth: [HX + 4.4, HY + 7.8, 1], blush: [[HX - 8, HY + 5.4, 1.2], [HX + 10.4, HY + 5.4, 1.2]], iris: '#a07aff', lid: 0, lashes: 0 };
const pwFace = (mood) => faceSprite(`pw3|face|${mood}`, 46, 40, () => (PW_FACES[mood] ? PW_FACES[mood]() : [...holes(), ...faceShapes(mood, FACE_FB)]));

// ---------- Skeleton ----------
const HIP = 22.6;
const L1 = 9;
const L2 = 9.4;
const SOLE = 4.4;
const UA = 8;
const FA = 7.5;
const SHN = [6, -16];
const SHF = [-6, -16];
const NECK = 20;
function legIK(dx, dy, hipDeg) {
  const d = Math.min(L1 + L2 - 0.05, Math.max(3, Math.hypot(dx, dy)));
  const h = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const k = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return [(-Math.atan2(dx, dy) - h) / D2R - hipDeg, (Math.PI - k) / D2R];
}
const legsAt = (lift, dxN, dxF, hipDeg = 0, upN = 0, upF = 0) => {
  const [tn, sn] = legIK(dxN, HIP + lift - SOLE - upN, hipDeg);
  const [tf, sf] = legIK(dxF, HIP + lift - SOLE - upF, hipDeg);
  return { thighN: tn, shinN: sn, thighF: tf, shinF: sf, rollN: 0, rollF: 0 };
};
// Would the quill overlap his head? (Chest space; samples along the quill from its grip.)
const QUILL_PTS = Array.from({ length: 9 }, (_, k) => [4 + k * 4, 0]);
const behind = (a, S) => {
  const ar = S.armN * D2R;
  const er = (S.armN + S.elbN) * D2R;
  const wx = SHN[0] + UA * Math.cos(ar) + FA * Math.cos(er);
  const wy = SHN[1] + UA * Math.sin(ar) + FA * Math.sin(er);
  const pr = (S.armN + S.elbN + S.quill) * D2R;
  const hr = (S.head - S.tilt * 0.5) * D2R;
  const hx = 1 + 16 * Math.sin(hr);
  const hy = -NECK - 16 * Math.cos(hr);
  return QUILL_PTS.some(([px, py]) => {
    const x = wx + px * Math.cos(pr) - py * Math.sin(pr);
    const y = wy + px * Math.sin(pr) + py * Math.cos(pr);
    return ((x - hx) / 16.4) ** 2 + ((y - hy) / 15.4) ** 2 < 1;
  });
};
const before = (a, S) => !behind(a, S);

const pwPass = (bare) => {
  const i = bare ? 1 : 0;
  const t = bare ? 'b' : '';
  const leg = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `foot${k}${t}`, parent: `ankle${k}`, s: PW.FOOT[j][i], pivot: [4, 1.4], rot: (S) => -(S.tilt * 0.3 + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
      { name: `shin${k}${t}`, parent: `knee${k}`, s: PW.SHIN[j][i], pivot: [4, 2], rot: (S) => S[`shin${k}`] * D2R },
      { name: `thigh${k}${t}`, parent: 'hip', s: PW.THIGH[j][i], pivot: [4.5, 1.5], at: () => (far ? [-4, 0] : [4.4, 0]), rot: (S) => S[`thigh${k}`] * D2R },
    ];
  };
  const arm = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return {
      up: { name: `up${k}${t}`, parent: 'chest', s: PW.UP[j][i], pivot: [2, 4], at: () => (far ? SHF : SHN), rot: (S) => S[`arm${k}`] * D2R },
      fore: { name: `fore${k}${t}`, parent: `elbow${k}`, s: PW.FORE[j][i], pivot: [2, 4], rot: (S) => S[`elb${k}`] * D2R },
      hand: { name: `hand${k}${t}`, parent: `grip${k}`, s: PW.GLOVE[j][i], pivot: [4.5, 4.5] },
    };
  };
  const an = arm(false);
  const af = arm(true);
  const quill = { name: `quill${t}`, parent: 'gripN', s: PW.QUILL[i], pivot: [6, 6], rot: (S) => S.quill * D2R };
  return [
    ...[0, 1].map((k) => ({ name: `tail${k}${t}`, parent: 'chest', s: PW.TAIL[k][i], pivot: [4, 1], at: () => [-8 + k * 3, -1], rot: (S) => (S.tails + 12 - k * 8) * D2R })),
    // The far arm and the page in its hand, behind him.
    af.up, af.fore, { name: `page${t}`, parent: 'gripF', s: PW.PAGE[i], pivot: [2, 11], rot: (S) => S.page * D2R }, af.hand,
    // Both legs, then the seat of his trousers over their tops, then his coat closing over it.
    ...leg(true), ...leg(false),
    { name: `seat${t}`, parent: 'hip', s: PW.SEAT[i], pivot: [11, 2], at: () => [0.2, -1] },
    { name: `body${t}`, parent: 'chest', s: PW.BODY[i], pivot: [14, 20] },
    an.up,
    { ...an.fore, name: `foreNk${t}`, when: behind }, { ...quill, name: `quillk${t}`, when: behind }, { ...an.hand, name: `handNk${t}`, when: behind },
    { name: `head${t}`, parent: 'nk', s: PW.HEAD[i], pivot: [23, 38] },
    ...(bare ? [{ name: 'face', parent: 'nk', s: (a) => pwFace(a.pwMood ?? 'idle'), pivot: [23, 38] }] : []),
    { name: `plume${t}`, parent: 'hat', s: PW.PLUME[i], pivot: [4, 18], at: () => [-4.4, -4], rot: (S) => (S.plume - 18) * D2R },
    { name: `hat${t}`, parent: 'nk', s: PW.HAT[i], pivot: [15, 20], at: () => [1, -27.4], rot: (S) => (S.hat - 10) * D2R },
    { name: `cravat${t}`, parent: 'chest', s: PW.CRAVAT[i], pivot: [6, 1], at: () => [1.4, -19.4], rot: (S) => S.cravat * D2R },
    { ...an.fore, when: before }, { ...quill, when: before }, { ...an.hand, when: before },
  ];
};

// ---------- Moves ----------
// The quill's world angle: 0 pointing forward, -90 up, 90 down.
function pwMove(kind, cur, t) {
  const mk = (o) => ({ ...cur, ...o });
  if (kind === 'pages') return [
    // The script rains: a flourish written in the air...
    mk({ x: 0, lift: 0.6, tilt: -2, head: 2, armN: -20 + Math.sin(t * 14) * 10, elbN: -40 + Math.sin(t * 11) * 14, quill: aim(-40, -20, -40, -2), armF: 120, elbF: -20, page: 0, ...legsAt(0.6, 3, -3, -0.6) }),
    // ...and both arms flung up, pages bursting out of him, his head back to watch them go.
    mk({ x: 0, lift: 2, tilt: -8, head: -16, armN: -70, elbN: -10, quill: aim(-80, -70, -10, -8), armF: 230, elbF: -10, page: -30, hat: -10, ...legsAt(2, 2, -2, -2.4) }),
  ];
  if (kind === 'curtain') return [
    // The Curtain Falls (through the cast): both arms raised high, laughing...
    mk({ x: -1, lift: 1.6, tilt: -7, head: -12, armN: -60, elbN: -30, quill: aim(-70, -60, -30, -7), armF: 245, elbF: -20, page: -20, hat: -8, ...legsAt(1.6, 2, -2, -2.1) }),
    // ...and swept down and out in a bow as the curtain sweeps the stage.
    mk({ x: 3, lift: -2, tilt: 18, head: 14, armN: 30, elbN: 0, quill: aim(60, 30, 0, 18), armF: 150, elbF: 0, page: 30, hat: 10, ...legsAt(-2, 5, -5, 5.4) }),
  ];
  if (kind === 'twist') return [
    // A Plot Twist: the quill twirled in his fingers...
    mk({ x: -1, lift: 0.6, tilt: -2, head: -2, armN: 20, elbN: -70, quill: aim(-40, 20, -70, -2) + 360, armF: 130, elbF: -20, ...legsAt(0.6, 2, -2, -0.6) }),
    // ...and flung up to point, a laugh.
    mk({ x: 2, lift: 1.4, tilt: -6, head: -10, armN: -50, elbN: 0, quill: aim(-55, -50, 0, -6) + 360, armF: 160, elbF: -10, ...legsAt(1.4, 3, -3, -1.8) }),
  ];
  if (kind === 'laugh') return [
    mk({ x: 0, lift: -1, tilt: 6, head: 8, armN: 70, elbN: -60, quill: aim(-60, 70, -60, 6), armF: 110, elbF: -30, ...legsAt(-1, 2, -2, 1.8) }),
    mk({ x: -1, lift: 1.2 + Math.abs(Math.sin(t * 16)) * 1.2, tilt: -8, head: -18, armN: 40, elbN: -40, quill: aim(-70, 40, -40, -8), armF: 200, elbF: -30, page: -20, hat: -6, ...legsAt(1.2, 2, -2, -2.4) }),
  ];
  // A fencing lunge: drawn back en garde, the far arm curved up behind him...
  return [
    mk({ x: -3, lift: -1.6, tilt: -4, head: -2, armN: 120, elbN: -100, quill: aim(-4, 120, -100, -4), armF: 230, elbF: -40, page: -30, ...legsAt(-1.6, 4, -5, -1.2) }),
    // ...then the lunge, the near foot far forward, the quill thrust straight out.
    mk({ x: 8, lift: -4, tilt: 10, head: 4, armN: -4, elbN: 0, quill: aim(-2, -4, 0, 10), armF: 200, elbF: -10, page: -40, hat: 6, ...legsAt(-4, 12, -8, 3) }),
  ];
}

export const playwrightRig = sized(makeRig({
  w: 70, h: 96, soft: true, stride: 8, recover: 0.55,
  springs: {
    x: [220, 16], lift: [200, 14], tilt: [160, 12], head: [130, 10], armN: [230, 16], elbN: [240, 16], quill: [220, 15], armF: [180, 13], elbF: [190, 13], page: [70, 4.6],
    thighN: [300, 18], thighF: [300, 18], shinN: [300, 18], shinF: [300, 18], rollN: [300, 18], rollF: [300, 18],
    hat: [130, 8], plume: [60, 3.8], tails: [60, 4.4], cravat: [90, 6],
  },
  fast: ['x', 'armN', 'elbN', 'quill', 'armF', 'elbF', 'thighN', 'thighF', 'shinN', 'shinF', 'lift'],
  kick: { tilt: -160, head: -200, hat: -220, plume: 300, tails: 260, cravat: 200, page: 300 },
  turnKick: { hat: 120, plume: 300, tails: 280, cravat: 200, page: 300 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const mo = a.mo ?? {};
    const st = mo.rig;
    const now = a.now;
    a.pwU = stepPhase(m, a, 'pw3', 24 * 1.1);
    const act = (at, wind, dur) => (at != null && now >= at - wind && now < at + dur ? { antic: now < at ? smooth(1 - (at - now) / wind) : 0, strike: now >= at ? (now - at < 0.07 ? smooth((now - at) / 0.07) : 1 - smooth(clamp((now - at - 0.3) / (dur - 0.3), 0, 1))) : 0 } : null);
    const pagesA = act(m.pagesAt, 0.5, 1.1);
    const twistA = act(m.twistAt, 0.4, 1);
    const laughA = act(m.laughAt, 0.3, 1.6);
    const curtainCast = m.castPose === 'curtain' && m.cast ? smooth(clamp((now - m.cast.t0) / 0.45, 0, 1)) : 0;
    const curtainA = act(m.curtainAt, 0, 1.2);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    let kind = 'lunge';
    let ph = a.ph;
    if (!active) {
      const pick = curtainA ? ['curtain', curtainA] : twistA ? ['twist', twistA] : pagesA ? ['pages', pagesA] : laughA ? ['laugh', laughA] : null;
      if (pick) {
        kind = pick[0];
        ph = { ...a.ph, ...pick[1], since: -1 };
      }
      if (curtainCast > 0 && !curtainA) {
        kind = 'curtain';
        ph = { ...a.ph, antic: curtainCast, strike: 0, since: -1 };
      }
    }
    a.pwKind = kind;
    a.pwPh = ph;
    const walkW = a.walkW ?? 0;
    const still = 1 - walkW;
    // His idle, a 10 s act: writing in the air; a twirl of the quill; a soft chuckle.
    const lu = fr(t / 10) * 10;
    const busy = active || pagesA || twistA || laughA || curtainCast > 0 || curtainA || walkW > 0.05 || m.cine;
    const write = busy ? 0 : hold(lu, 0.3, 0.8, 3, 3.4);
    const twirl = !busy && lu >= 4 && lu < 5.8 ? smooth(clamp((lu - 4.1) / 1.3, 0, 1)) : 0;
    const chuckle = busy ? 0 : hold(lu, 6.6, 7, 8.4, 8.8);
    a.pwAct = { write: write * still, chuckle: chuckle * still };
    const sway = Math.sin(t * 1.1);
    const scrib = write * Math.sin(t * 9);
    const armNI = 70 - write * 70 + scrib * 6 - Math.sin(twirl * Math.PI) * 14;
    const elbNI = -60 + write * 20 + Math.sin(t * 7) * 8 * write;
    const shake = chuckle * Math.abs(Math.sin(t * 14));
    const idle = {
      x: 0, lift: sway * 0.4 + shake * 0.8, tilt: sway * 1 - chuckle * 5, head: -2 + Math.sin(t * 1.4) * 2 + write * 4 - chuckle * 14, armN: armNI, elbN: elbNI,
      quill: aim(-70 + write * 40 + scrib * 10, armNI, elbNI) + twirl * 360, armF: 110 - chuckle * 20, elbF: -20 - chuckle * 20, page: Math.sin(t * 2.2) * 6,
      ...legsAt(sway * 0.4 + shake * 0.8, 2, -2), hat: Math.sin(t * 1.4) * 1.4 - chuckle * 4, plume: Math.sin(t * 1.8) * 4, tails: sway * 2, cravat: sway * 2,
    };
    // A gentleman's stride on planted feet: chin up, the quill carried at his shoulder.
    const u = a.pwU;
    const lead = ((st?.pw3V ?? 0) / (24 * 1.1)) * 0.05;
    const [dxN, upN] = pawStep(u + lead, 0, 24, 0.58, 4.2);
    const [dxF, upF] = pawStep(u + lead, 0.5, 24, 0.58, 4.2);
    const w2 = u * TAU * 2;
    const land = (1 + Math.cos(w2)) / 2;
    const sw = Math.sin(u * TAU);
    const wLift = 0.5 - land * 1.8;
    const wTilt = 2 + land * 1.4;
    const [thN, shN] = legIK(dxN, HIP + wLift - SOLE - upN, wTilt * 0.3);
    const [thF, shF] = legIK(dxF, HIP + wLift - SOLE - upF, wTilt * 0.3);
    const armFW = 110 + sw * 22;
    const walk = {
      x: 0, lift: wLift, tilt: wTilt, head: -5 + land * 1.6, armN: 70 + sw * 4, elbN: -64, quill: aim(-74 + sw * 4, 70 + sw * 4, -64, wTilt), armF: armFW, elbF: -20 - Math.max(0, sw) * 14, page: -sw * 14,
      thighN: thN, shinN: shN, thighF: thF, shinF: shF, rollN: upN * 5, rollF: upF * 5, hat: Math.sin(w2 - 1) * 2, plume: Math.sin(w2 - 1.6) * 10, tails: 14 + Math.sin(w2 - 1) * 10, cravat: -sw * 6,
    };
    const [antic, strike] = pwMove(kind, idle, t);
    const S = stateBlend({ ...a, ph }, idle, walk, antic, strike);
    a.pwMood = pwMood(a, m);
    unwind(st, 'quill', S.quill);
    return S;
  },
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -HIP - S.lift], rot: (S) => S.tilt * 0.3 * D2R },
    { name: 'chest', parent: 'hip', at: () => [0, -2], rot: (S) => S.tilt * 0.7 * D2R },
    { name: 'nk', parent: 'chest', at: () => [1, -NECK], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'elbowN', parent: 'upN', at: () => [UA, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [UA, 0] },
    { name: 'gripN', parent: 'foreN', at: () => [FA, 0] },
    { name: 'gripF', parent: 'foreF', at: () => [FA, 0] },
    { name: 'kneeN', parent: 'thighN', at: () => [0, L1] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, L1] },
    { name: 'ankleN', parent: 'shinN', at: () => [0, L2] },
    { name: 'ankleF', parent: 'shinF', at: () => [0, L2] },
    ...pwPass(false),
    ...pwPass(true),
  ],
  // His spotlight; ink pooling on the boards as he rises through them in his scene; and the pages
  // on the far side of their circle round him, behind him.
  under(ctx, m, a, S, mat) {
    const al = (0.32 + Math.sin(a.now * 1.6) * 0.04) * a.alpha * (m.hp > 0 ? 1 : 0.5);
    const sunk = (m.cine?.sink ?? 0) / 1.1;
    const g = ctx.createRadialGradient(0, -1 - sunk, 0, 0, -1 - sunk, 36);
    g.addColorStop(0, `rgba(230,220,255,${al})`);
    g.addColorStop(0.7, `rgba(230,220,255,${al * 0.6})`);
    g.addColorStop(1, 'rgba(230,220,255,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(0, -sunk);
    ctx.scale(1, 0.18);
    ctx.fillRect(-36, -40, 72, 72);
    ctx.restore();
    if (sunk > 1) {
      ctx.globalAlpha = a.alpha * clamp(sunk / 20, 0, 1);
      ctx.fillStyle = '#1a1430';
      ctx.beginPath();
      ctx.ellipse(0, -sunk, 24, 4.4, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = a.alpha;
    }
    if (m.hp > 0) drawPages(ctx, a, mat, false);
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const ph = a.pwPh ?? a.ph;
    const kind = a.pwKind;
    drawPages(ctx, a, mat, true);
    const [qx, qy] = at2(mat('quill'), 34, -1);
    // Writing in the air: strokes of glowing ink left hanging behind the feather's tip, fading.
    if ((a.pwAct?.write ?? 0) > 0.3 || (kind === 'pages' && ph.antic > 0.1)) {
      const trail = ((a.mo ??= {}).pwInk ??= []);
      trail.push([qx, qy, a.now]);
      while (trail.length && a.now - trail[0][2] > 0.7) trail.shift();
      ctx.lineCap = 'round';
      for (let k = 1; k < trail.length; k++) {
        const [x0, y0] = trail[k - 1];
        const [x1, y1, t1] = trail[k];
        const q = 1 - (a.now - t1) / 0.7;
        ctx.globalAlpha = a.alpha * q * 0.9;
        ctx.strokeStyle = '#a07aff';
        ctx.lineWidth = 1.6 * q + 0.4;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.globalAlpha = a.alpha;
    } else if (a.mo?.pwInk) a.mo.pwInk.length = 0;
    // The lunge: drops of ink flung off the feather's tip, a gleam.
    if (kind === 'lunge' && ph.strike > 0.3) {
      sparkle(ctx, a, qx + 2, qy, 5 * ph.strike, ph.strike, '#e8dcff');
      for (let k = 0; k < 3; k++) {
        const u = 1 - ph.strike;
        ctx.globalAlpha = a.alpha * ph.strike;
        ctx.fillStyle = '#3a2d5a';
        ctx.beginPath();
        ctx.arc(qx + 4 + u * (10 + k * 6), qy - 2 + u * (k * 5) + u * u * 8, 1.6 - k * 0.3, 0, TAU);
        ctx.fill();
      }
    }
    // The script rains: pages burst up out of him.
    if (kind === 'pages' && ph.strike > 0.1) {
      const [cx, cy] = at2(mat('chest'), 0, -14);
      for (let k = 0; k < 6; k++) {
        const u = 1 - ph.strike;
        ctx.save();
        ctx.translate(cx + (k - 2.5) * 6 * (0.4 + u), cy - 6 - u * 46 - (k % 2) * 6);
        ctx.rotate(u * 4 + k);
        ctx.globalAlpha = a.alpha * ph.strike;
        paper(ctx);
        ctx.restore();
      }
    }
    // The Curtain Falls: a sweep of velvet red after his arm as he bows.
    if (kind === 'curtain' && ph.strike > 0.15) {
      const [sx, sy] = at2(mat('upN'), 0, 0);
      ctx.lineCap = 'round';
      for (let k = 0; k < 6; k++) {
        const f0 = -1.4 + k * 0.4;
        ctx.globalAlpha = a.alpha * ph.strike * (0.3 + k * 0.12);
        ctx.strokeStyle = k % 2 ? '#c8283a' : '#8a1a2a';
        ctx.lineWidth = 1.4 + k * 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 26, f0, f0 + 0.4);
        ctx.stroke();
      }
    }
    // A Plot Twist / a new act: a twinkle at the quill's tip.
    if ((kind === 'twist' || kind === 'laugh') && ph.strike > 0.2) sparkle(ctx, a, qx, qy, 4 * ph.strike, ph.strike, '#fff3c4');
    // Now and then the jewel on his mask catches the light.
    const q = fr((a.t + (a.uidOff ?? 0)) / 3.7);
    if (q < 0.16) {
      const [jx, jy] = at2(mat('nk'), 15, -25.4);
      sparkle(ctx, a, jx, jy, 2.6 * Math.sin((q / 0.16) * Math.PI), Math.sin((q / 0.16) * Math.PI), '#ffffff');
    }
    ctx.globalAlpha = a.alpha;
  },
}), 1.1);
// A page of script (drawn live): solid paper, an edge, ink lines.
function paper(ctx) {
  ctx.fillStyle = '#d8c8b0';
  ctx.fillRect(-3.6, -4.6, 7.2, 9.2);
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(-3.2, -4.2, 6.4, 8.4);
  ctx.fillStyle = '#6a5a9a';
  for (let l = 0; l < 3; l++) ctx.fillRect(-2.2, -2.2 + l * 2, l === 2 ? 2.6 : 4.2, 0.6);
}
// The pages of his script whirling round him: the near half of their circle in front of him, the
// far half behind.
function drawPages(ctx, a, mat, front) {
  const [cx, cy] = at2(mat('chest'), 0, -12);
  for (let i = 0; i < 4; i++) {
    const ang = a.now * 1.1 + (i / 4) * TAU;
    const near = Math.sin(ang) > 0;
    if (near !== front) continue;
    ctx.save();
    ctx.translate(cx + Math.cos(ang) * 30, cy + Math.sin(ang) * 9 - 6);
    ctx.rotate(ang * 0.7);
    const k = near ? 1 : 0.82;
    ctx.scale(k, k);
    ctx.globalAlpha = a.alpha;
    paper(ctx);
    ctx.restore();
  }
}
function pwMood(a, m) {
  if (m.hp <= 0) return 'dead';
  const ph = a.pwPh ?? a.ph;
  const kind = a.pwKind;
  if (kind === 'laugh' && (ph.strike > 0.2 || ph.antic > 0.5)) return 'laugh';
  if (kind === 'curtain' && ph.antic > 0.2 && ph.strike < 0.2) return 'laugh';
  if (kind === 'twist' && ph.strike > 0.2) return 'laugh';
  if (ph.strike > 0.25) return kind === 'curtain' ? 'happy' : 'shout';
  if (kind === 'pages' && ph.antic > 0.2) return 'write';
  if (a.ph.atk || ph.antic > 0.3) return 'angry';
  if (a.mood === 'hurt' || a.face === 'hurt') return 'hurt';
  if (m.cine?.mood === 'angry') return 'angry';
  if (m.cine?.mood === 'happy') return 'laugh';
  const act = a.pwAct ?? {};
  if (act.write > 0.4) return 'write';
  if (act.chuckle > 0.4) return 'laugh';
  const t = a.t + (a.uidOff ?? 0);
  if (t % 4.6 < 0.13) return 'blink';
  return 'idle';
}

// ---------- The still (portraits) ----------
export function playwrightStill(pose, f, mood) {
  const fm = PW_FACES[mood] ? mood : 'idle';
  const lg = legsAt(0, 2, -2);
  const hip = [0, -HIP];
  const ch = [0, hip[1] - 2];
  const nk = [1, ch[1] - NECK];
  const legAt = (far) => {
    const x = far ? -4 : 4.4;
    const k = far ? 'F' : 'N';
    const th = lg[`thigh${k}`];
    const sh = lg[`shin${k}`];
    const tr = th * D2R;
    const kx = x - Math.sin(tr) * L1;
    const ky = hip[1] + Math.cos(tr) * L1;
    const sr = (th + sh) * D2R;
    return [...put(footP(far)(), [4, 1.4], kx - Math.sin(sr) * L2, ky + Math.cos(sr) * L2, 0), ...put(shinP(far)(), [4, 2], kx, ky, th + sh), ...put(thighP(far)(), [4.5, 1.5], x, hip[1], th)];
  };
  const arm = (far, armA, elbA) => {
    const [sx, sy] = far ? [SHF[0], ch[1] + SHF[1]] : [SHN[0], ch[1] + SHN[1]];
    const ex = sx + Math.cos(armA * D2R) * UA;
    const ey = sy + Math.sin(armA * D2R) * UA;
    const fa = armA + elbA;
    const gx = ex + Math.cos(fa * D2R) * FA;
    const gy = ey + Math.sin(fa * D2R) * FA;
    return { up: put(upperP(far)(), [2, 4], sx, sy, armA), fore: put(foreP(far)(), [2, 4], ex, ey, fa), hand: put(gloveP(far)(), [4.5, 4.5], gx, gy, 0), grip: [gx, gy] };
  };
  const an = arm(false, 70, -60);
  const af = arm(true, 110, -20);
  const hatAt = [nk[0] + 1, nk[1] - 27.4];
  const pr = -10 * D2R;
  const plumeAt = [hatAt[0] - 4.4 * Math.cos(pr) + 4 * Math.sin(pr), hatAt[1] - 4.4 * Math.sin(pr) - 4 * Math.cos(pr)];
  return { w: 70, h: 96, res: 2, shapes: shift([
    ...put(tailP(0)(), [4, 1], -8, ch[1] - 1, 12), ...put(tailP(1)(), [4, 1], -5, ch[1] - 1, 4),
    ...af.up, ...af.fore, ...put(pageP(), [2, 11], af.grip[0], af.grip[1], 0), ...af.hand,
    ...legAt(true), ...legAt(false), ...put(seatP(), [11, 2], 0.2, hip[1] - 1), ...put(bodyP(), [14, 20], ch[0], ch[1]),
    ...an.up,
    ...put(headP(), [23, 38], nk[0], nk[1]), ...put(PW_FACES[fm](), [23, 38], nk[0], nk[1]),
    ...put(plumeP(), [4, 18], plumeAt[0], plumeAt[1], -28), ...put(hatP(), [15, 20], hatAt[0], hatAt[1], -10),
    ...put(cravatP(), [6, 1], 1.4, ch[1] - 19.4),
    ...an.fore, ...put(quillP(), [6, 6], an.grip[0], an.grip[1], -70), ...an.hand,
  ], 35, 95) };
}
