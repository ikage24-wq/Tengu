// Madame Directrice (redrawn 2026-11-19, the player's pick "B, the Golden-Age Star", then made a
// proper bird at their word, "a mix between human and bird looks wrong", in look "B, the cape"):
// the Dream Theatre's director, a white cockatoo of the old studio days. A round feathered body
// with a pale belly and a fan of tail feathers, short fluffy legs on grey bird feet, folded wings
// whose long tip feathers close round what she holds. A great yellow crest swept back (four plumes
// that rise when she's roused and lie back when she's calm), a short burgundy cape over her
// shoulders with a gold clasp, a pink silk bow at her throat. A long brass megaphone in her near
// wing, her director's baton in the far one.
//
// How she moves:
//   idle    a 10 s act: conducting little beats with her baton; a twirl of it; an impatient
//           "Hmph!", chin up, crest up, a foot tapping.
//   walk    a bird's waddle on planted feet (her legs bend backwards at the ankle, as a bird's
//           do), her body rocking, her head bobbing forward on each step, the cape, tail and
//           crest swinging after.
//   fight   (world/theatre.js) a plain swing is a megaphone bonk, over the top; "Action!"
//           (m.actionAt): the megaphone to her beak, a bellow, the baton raised; "Cut!" (a cast
//           bar, m.castPose 'cut', landing at m.cutAt): baton high, glaring, then a stamp and a
//           slash of the baton as the circle bursts; "Take two!" (m.takeAt): wings flung wide,
//           presenting the Understudies.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, sparkle, puff, ownFace } from './rigkit.js';

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

const WH = ramp('#fbf6ee', { step: 7, turn: 8 });
const YL = ramp('#ffd84a', { step: 9, turn: 8 });
const BG = ramp('#9a2a4a', { step: 9, turn: 8 });
const SILK = ramp('#ffc8dc', { step: 8, turn: 8 });
const BRASS = ramp('#ffcf5a', { step: 10, turn: 8 });
const LEG = '#8a8a9a';
const dr = pairOf('dr3');

// ---------- Parts ----------
// (Rig space: her body's middle 27.8 above the floor; her hips 10 under it; her neck 18 above it,
// the head's middle 16 above the neck. Wings at (8, -9) and (-7, -10) on her body.)
const HX = 22;
const HY = 24;
// Her head, three-quarters on: round and white, a fluff of cheek feathers at the back, her dark
// hooked beak coming out of her face below and between her eyes, a cream rim where it meets her
// face (the eyes, brows and blush are on the face; the lower beak is its own part). Box 46 x 44;
// the neck (22, 40).
const headP = () => [
  blob([[HX - 12, HY + 2], [HX - 17, HY + 8], [HX - 12, HY + 8], [HX - 13, HY + 12], [HX - 7, HY + 11]], WH.base, 2),
  E(HX, HY, 15, 14, WH.base), crescent(HX, HY, 15, 14, WH.sh, { k: 0.15, a0: 110, a1: 210 }), F(E(HX + 2, HY - 9, 5, 2, '#ffffff')),
  ...[[-8, 6], [-5, 9]].map(([dx, dy]) => F(taper([[HX + dx, HY + dy], [HX + dx - 4, HY + dy + 1]], 0.7, 0.4, WH.sh))),
  F(E(HX + 9.4, HY + 4, 2.6, 3.4, '#f4ece0')),
  blob([[HX + 8.4, HY + 1], [HX + 13.6, HY - 0.2], [HX + 18.4, HY + 3.2], [HX + 19, HY + 9], [HX + 17.2, HY + 7.8], [HX + 14.4, HY + 6.8], [HX + 8.6, HY + 6.8]], '#3a3a44', 1),
  F(taper([[HX + 9.8, HY + 1.8], [HX + 14.4, HY + 1.2], [HX + 17, HY + 3.6]], 1, 0.6, '#7a7a8a')),
];
// One plume of her crest (box 16 x 22 from its root (6, 20), sunk in her head): a broad soft
// feather, its tip curling forward.
const plumeP = (k) => () => {
  const p = [[6, 20], [5, 12], [7, 6], [12, 4]];
  // (All one yellow, so the crest reads as one swept mass; a soft shadow along each plume's
  // underside and a sheen along its top part them.)
  return [taper(p, 8, 4, YL.base), E(12, 4, 2.2, 2.2, YL.base), F(taper([[7.8, 19], [7.4, 12], [9, 7.4]], 1.6, 1, YL.sh)), F(taper([[4.4, 16], [4.6, 9]], 1.2, 0.7, k === 3 ? '#fff3c4' : YL.hi))];
};
// The lower beak (box 8 x 5 from its hinge (0.4, 0.4)), and the dark of her open beak (box 8 x 6
// from (0, 1)), which only shows as she opens it.
const jawP = () => [blob([[0.4, 0.2], [7, 0.4], [5.8, 3.4], [1.2, 3.6]], '#2a2a32', 1)];
const mouthP = () => [T([[0, 0], [7, -0.6], [7, 3.6], [0, 2]], '#5a2030'), F(E(4, 2, 1.8, 0.8, '#e86a8a'))];
// Her round feathered body, a pale belly, rows of soft feathers. Box 40 x 42; its middle (20, 21).
const bodyP = () => [
  E(20, 21, 17, 18, WH.base), crescent(20, 21, 17, 18, WH.sh, { k: 0.16, a0: 100, a1: 220 }), F(E(23, 25, 9, 11, '#ffffff')),
  ...[[16, 27], [22, 31], [28, 27], [18, 35], [25, 36], [13, 20]].map(([x, y]) => F(line(arcP(x, y, 2.2, 1.4, 20, 160, 5), 0.5, WH.sh)[0])),
];
// The tail, a fan of three feathers (box 26 x 22 from its root (22, 3)), pointing down and back.
const tailP = () => [130, 145, 160].map((deg, k) => {
  const r = deg * D2R;
  const P = (u, v) => [22 + Math.cos(r) * u - Math.sin(r) * v, 3 + Math.sin(r) * u + Math.cos(r) * v];
  return blob([P(0, -3), P(13, -3.4), P(19, 0), P(13, 3.4), P(0, 3)], k === 1 ? WH.base : WH.sh, 2);
}).concat([F(taper([[20, 5], [9, 16]], 0.6, 0.4, WH.sh))]);
// The cape over her shoulders and back (box 30 x 31, hung at the clasp (26, 5)): burgundy, a gold
// hem, the clasp.
const capeP = () => [
  blob([[28, 3], [18, 1], [8, 6], [2, 17], [1, 29], [10, 27], [18, 17], [25, 9]], BG.base, 2),
  F(taper([[5, 15], [4, 26]], 1.6, 1.4, BG.sh)), F(taper([[16, 4], [9, 9]], 1.2, 0.8, BG.hi)), F(taper([[2.4, 28], [10, 26.4]], 1, 1, '#ffd36b')),
  E(25.4, 9.4, 2, 2, '#ffd36b'), F(E(25, 9, 0.7, 0.6, '#ffffff')),
];
// The pink silk bow at her throat (box 18 x 10 about its knot (9, 5)) and its two ends (box 5 x 11
// from (2.5, 1)).
const bowP = () => [blob([[9, 5], [1.4, 1], [1, 9]], SILK.base, 1), blob([[9, 5], [16.6, 1], [17, 9]], SILK.base, 1), F(blob([[3, 3], [7, 4.6], [3, 7]], SILK.sh, 1)), F(blob([[15, 3], [11, 4.6], [15, 7]], SILK.sh, 1)), F(taper([[2.4, 2.4], [6, 3.6]], 0.8, 0.5, '#ffffff')), E(9, 5, 2.4, 2.2, SILK.sh)];
const bowEndP = () => [taper([[2.5, 1], [2.2, 6], [2.8, 10]], 2.4, 1.6, SILK.base), F(T([[1.2, 9], [3.8, 9], [2.5, 10.6]], SILK.sh))];
// A wing: the inner wing (box 12 x 11 from the shoulder (2, 5.5); the wrist 7 on), the outer wing
// (box 12 x 9 from the wrist (2, 4.5); the grip 7 on), and its three tip feathers (box 12 x 11
// from the grip (1.6, 6)), laid over whatever she holds.
// (A soft grey shadow under each piece and a line along its lower edge, so a wing folded over her
// white body still reads as a wing.)
const WEDGE = '#cfc6b8';
const innerP = (far) => () => [blob([[0.6, 3], [6, 0.6], [11, 3.6], [11.4, 7.4], [6, 10.4], [0.6, 8]], far ? WH.sh : WH.base, 2), F(blob([[1.4, 7], [6, 6.6], [10.6, 6.4], [6, 9.8], [1.4, 8.4]], far ? '#ddd4c6' : WH.sh, 2)), ...line([[1, 8.4], [6, 10], [11, 7.2]], 0.7, WEDGE), ...line(arcP(6, 5, 2.4, 3.6, 300, 420, 6), 0.5, WEDGE)];
const outerP = (far) => () => [blob([[0.6, 2], [8, 0.8], [11.4, 3.6], [10.6, 6.6], [4, 8.2], [0.6, 6.6]], far ? WH.sh : WH.base, 2), F(blob([[1, 5.4], [6, 5.2], [10.6, 5.4], [5, 7.8], [1, 6.8]], far ? '#ddd4c6' : WH.sh, 2)), ...line([[0.8, 6.8], [5, 8], [10.8, 6]], 0.7, WEDGE)];
// The wingtip: three broad, round-ended flight feathers, overlapping, curving a little round.
const tipsP = (far) => () => [[8.2, 1.4], [6, 0.4], [3.6, -0.6]].flatMap(([y, d], k) => {
  const c = far ? (k ? WH.sh : '#ddd4c6') : k === 2 ? WH.base : k ? '#f4ece0' : WH.sh;
  const end = [9.4 - k * 0.4, y + d];
  return [taper([[0.6, y], [5, y + d * 0.6], end], 3.8, 2.8, c), E(end[0], end[1], 1.4, 1.4, c), ...line([[1.4, y + 1.6], [end[0], end[1] + 1.2]], 0.5, WEDGE)];
});
// A leg: the fluffy feathered thigh (box 12 x 13 from the hip (6, 1.5); the ankle 8 down), the
// scaly grey shank (box 6 x 9 from (3, 1); the foot 7 down), the foot, three toes forward and one
// back (box 13 x 7 from (4, 1.2); the toes 3.6 under it).
const pantsP = (far) => () => [blob([[1, 1], [11, 1], [11.6, 6], [10, 11.6], [2, 11.8], [0.4, 6]], far ? WH.sh : WH.base, 2), F(blob([[1.4, 8], [10.6, 8], [9.6, 11.2], [2.4, 11.4]], far ? '#ddd4c6' : WH.sh, 2)), F(line(arcP(6, 7, 3, 1.8, 20, 160, 6), 0.5, WEDGE)[0])];
const shankP = (far) => () => [taper([[3, 0], [3, 8]], 2.6, 2.2, far ? '#7a7a8a' : LEG), ...[3, 5.4].map((y) => F(R(2, y, 2, 0.5, '#6a6a7a')))];
const footP = (far) => () => [[11.6, 3.4], [10, 4.6], [7.6, 4.8], [0.4, 3.6]].map(([x, y]) => taper([[4, 1.2], [x, y]], 2, 1.4, far ? '#7a7a8a' : LEG));
// The brass megaphone (box 32 x 18): its mouthpiece (1.6, 7.2), the bell at the far end, the
// handle under it gripped at (8.4, 12.8).
const megaP = () => [
  T([[1.6, 5.9], [27.2, 0.6], [27.2, 13.8], [1.6, 8.5]], BRASS.base), F(T([[14.4, 3.4], [17.6, 2.7], [17.6, 11.7], [14.4, 11]], BG.base)), F(taper([[3.2, 6.2], [25.6, 1.9]], 0.9, 1.2, BRASS.hi)), F(taper([[3.2, 8.3], [25.6, 12.6]], 0.7, 1, BRASS.sh)),
  E(27.2, 7.2, 2, 6.9, BRASS.base), F(E(27.5, 7.2, 1.1, 5.6, '#5a3a2a')), E(1.3, 7.2, 1.5, 1.8, BRASS.sh),
  taper([[6.4, 8.5], [7.5, 12.8]], 1.4, 1.4, BRASS.sh), taper([[10.1, 8.3], [9.3, 12.8]], 1.4, 1.4, BRASS.sh), F(R(7.2, 12, 2.7, 1.3, BRASS.sh)),
];
// The baton (box 6 x 30, gripped at (3, 25)): black, gold tipped.
const batonP = () => [taper([[3, 28], [3, 2]], 1.8, 1.2, '#2a2a34'), E(3, 2, 1.5, 1.5, '#ffd36b'), E(3, 28, 1.7, 1.7, '#ffd36b'), F(taper([[2.6, 26], [2.6, 5]], 0.4, 0.3, '#6a6a7a'))];
const DR = {
  HEAD: dr('head', 46, 44, headP, 2), PLUME: [0, 1, 2, 3].map((k) => dr(`plume${k}`, 16, 22, plumeP(k), 2)), JAW: dr('jaw', 8, 5, jawP, 2), MOUTH: dr('mouth', 8, 6, mouthP, 1),
  BODY: dr('body', 40, 42, bodyP, 2), TAIL: dr('tail', 26, 22, tailP, 2), CAPE: dr('cape', 30, 31, capeP, 2), BOW: dr('bow', 18, 10, bowP, 2), BOWEND: dr('bowend', 5, 11, bowEndP, 2),
  INNER: [false, true].map((f) => dr(`inner${f ? 1 : 0}`, 12, 11, innerP(f), 2)), OUTER: [false, true].map((f) => dr(`outer${f ? 1 : 0}`, 12, 9, outerP(f), 2)), TIPS: [false, true].map((f) => dr(`tips${f ? 1 : 0}`, 12, 11, tipsP(f), 2)),
  PANTS: [false, true].map((f) => dr(`pants${f ? 1 : 0}`, 12, 13, pantsP(f), 2)), SHANK: [false, true].map((f) => dr(`shank${f ? 1 : 0}`, 6, 9, shankP(f), 2)), FOOT: [false, true].map((f) => dr(`foot${f ? 1 : 0}`, 13, 7, footP(f), 2)),
  MEGA: dr('mega', 32, 18, megaP, 2), BATON: dr('baton', 6, 30, batonP, 2),
};

// ---------- Faces (on the head; box 46 x 44 as it) ----------
const EN = [HX + 6.4, HY - 2, 3.3];
const EF = [HX - 4.6, HY - 2, 2.7];
const IRIS = '#3a2a40';
const RING = '#d8eeff';
const eye = ([x, y, r], side, { lid = 0, small = false, look = 0 } = {}) => [
  F(E(x, y, r * 1.45, r * 1.5, RING)), F(E(x, y, r, r * 1.15, INK)), F(E(x, y + r * 0.35 + look, r * 0.8, r * 0.7, IRIS)),
  ...(small ? [F(E(x, y + look, r * 0.3, r * 0.34, '#ffffff'))] : [F(E(x - r * 0.3, y - r * 0.4, r * 0.4, r * 0.42, '#ffffff')), F(E(x + r * 0.35, y + r * 0.4, r * 0.15, r * 0.15, '#ffffff'))]),
  ...(lid > 0 ? [F(T([...arcP(x, y, r * 1.12, r * 1.25, 180, 360, 8), ...arcP(x, y - r * 1.15 * (1 - lid * 2), r * 1.12, r * 0.35, 0, 180, 8)], WH.base)), ...line(arcP(x, y - r * 1.15 * (1 - lid * 2), r * 1.05, r * 0.32, 15, 165, 7), 0.6)] : []),
  ...line([[x + side * r * 0.8, y - r * 0.85], [x + side * r * 1.4, y - r * 1.35]], 0.6), ...line([[x + side * r * 0.95, y - r * 0.4], [x + side * r * 1.55, y - r * 0.6]], 0.55),
];
const shutE = ([x, y, r], up = false) => [F(E(x, y, r * 1.3, r * 1.2, RING)), ...line(arcP(x, y + 0.6, r, r * 0.6, up ? 200 : 20, up ? 340 : 160, 7), 0.8)];
const squeeze = ([x, y, r], side) => [F(E(x, y, r * 1.3, r * 1.2, RING)), ...line([[x - side * r, y - r * 0.8], [x + side * r * 0.6, y], [x - side * r, y + r * 0.8]], 0.8)];
const BROW = '#b8a898';
const brows = (n, f, c = BROW) => [F(taper(n, 1.2, 0.6, c)), F(taper(f, 1.1, 0.5, c))];
const BN = [[HX + 3.4, HY - 8], [HX + 9.4, HY - 8.6]];
const BF = [[HX - 7.6, HY - 7.8], [HX - 2.6, HY - 7.8]];
// (Her look: one brow up, the other level: unimpressed.)
const BN_ARCH = [[HX + 3.4, HY - 8.6], [HX + 9.4, HY - 10.2]];
const BN_MAD = [[HX + 3.4, HY - 6.8], [HX + 9.8, HY - 9.6]];
const BF_MAD = [[HX - 7.8, HY - 9.2], [HX - 2.2, HY - 6.8]];
const upB = (pts, k) => pts.map(([x, y]) => [x, y - k]);
const blush = (k = 1) => [F(E(HX + 4.6, HY + 4.6, 2.6 * k, 1.3 * k, '#ffa8c0')), F(E(HX - 7.4, HY + 4, 2.2 * k, 1.1 * k, '#ffa8c0'))];
const sweat = () => [F(E(HX - 11, HY - 7, 0.9, 1.4, '#8ad8ff'))];
const DR_FACES = {
  // Unimpressed: lids half down, one brow arched.
  idle: () => [...eye(EN, 1, { lid: 0.24 }), ...eye(EF, -1, { lid: 0.24 }), ...brows(BN_ARCH, BF), ...blush()],
  blink: () => [...shutE(EN), ...shutE(EF), ...brows(BN_ARCH, BF), ...blush()],
  // "Hmph!": eyes shut, brows up, chin up.
  hmph: () => [...shutE(EN), ...shutE(EF), ...brows(upB(BN, 2), upB(BF, 2)), ...blush(1.2)],
  happy: () => [...shutE(EN, true), ...shutE(EF, true), ...brows(upB(BN, 1.4), upB(BF, 1.4)), ...blush(1.3)],
  // Eyes wide, pupils tiny, brows flying: ACTION!
  shout: () => [...eye(EN, 1, { small: true }), ...eye(EF, -1, { small: true }), ...brows(upB(BN, 2), upB(BF, 2), '#8a7a6a'), ...blush(1.1)],
  angry: () => [...eye(EN, 1, { lid: 0.36, small: true }), ...eye(EF, -1, { lid: 0.36, small: true }), ...brows(BN_MAD, BF_MAD, '#8a7a6a'), ...blush(0.9)],
  // Sizing up a shot: one eye narrowed.
  focus: () => [...eye(EN, 1, { lid: 0.42 }), ...eye(EF, -1, { lid: 0.1 }), ...brows(BN_MAD, upB(BF, 1), '#8a7a6a'), ...blush()],
  hurt: () => [...squeeze(EN, 1), ...squeeze(EF, -1), ...brows(BN_MAD, BF_MAD), ...sweat()],
  dead: () => [F(E(EN[0], EN[1], 4.4, 4.4, RING)), ...line([[EN[0] - 2.2, EN[1] - 2.2], [EN[0] + 2.2, EN[1] + 2.2]], 0.8), ...line([[EN[0] + 2.2, EN[1] - 2.2], [EN[0] - 2.2, EN[1] + 2.2]], 0.8), ...line([[EF[0] - 1.8, EF[1] - 1.8], [EF[0] + 1.8, EF[1] + 1.8]], 0.7), ...line([[EF[0] + 1.8, EF[1] - 1.8], [EF[0] - 1.8, EF[1] + 1.8]], 0.7)],
};
const drFace = (mood) => faceSprite(`dr3|face|${mood}`, 46, 44, () => ownFace(DR_FACES, mood));

// ---------- Skeleton ----------
const BODY = 27.8;
const L1 = 8;
const L2 = 7;
const UA = 7;
const FA = 7;
const NECK = 18;
const HIPN = [5.5, 10];
const HIPF = [-5, 10];
const SHN = [8, -9];
const SHF = [-7, -10];
const SOLE = 3.6;
// A bird's leg: the joint you see bends backwards (it's her ankle; her knee is up in the fluff).
function legIK(dx, dy, hipDeg) {
  const d = Math.min(L1 + L2 - 0.05, Math.max(3, Math.hypot(dx, dy)));
  const h = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const k = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return [(-Math.atan2(dx, dy) + h) / D2R - hipDeg, -(Math.PI - k) / D2R];
}
const HIPY = BODY - HIPN[1];
const legsAt = (lift, dxN, dxF, hipDeg = 0, upN = 0, upF = 0) => {
  const [tn, sn] = legIK(dxN, HIPY + lift - SOLE - upN, hipDeg);
  const [tf, sf] = legIK(dxF, HIPY + lift - SOLE - upF, hipDeg);
  return { thighN: tn, shinN: sn, thighF: tf, shinF: sf, rollN: 0, rollF: 0 };
};
// Would the megaphone overlap her head? (Body space; the megaphone's axis 5.6 above its grip.)
const MEGA_PTS = [[-6.8, -5.6], [-3, -5.6], [1, -5.6], [5, -5.6], [9, -5.6], [13, -5.6], [17, -5.6], [18.6, -12.2], [18.6, 1]];
const behind = (a, S) => {
  const ar = S.armN * D2R;
  const er = (S.armN + S.elbN) * D2R;
  const wx = SHN[0] + UA * Math.cos(ar) + FA * Math.cos(er);
  const wy = SHN[1] + UA * Math.sin(ar) + FA * Math.sin(er);
  const pr = (S.armN + S.elbN + S.mega) * D2R;
  const hr = (S.head - S.tilt * 0.5) * D2R;
  const hx = 2 + S.hx + 16 * Math.sin(hr);
  const hy = -NECK - 16 * Math.cos(hr);
  return MEGA_PTS.some(([px, py]) => {
    const x = wx + px * Math.cos(pr) - py * Math.sin(pr);
    const y = wy + px * Math.sin(pr) + py * Math.cos(pr);
    return ((x - hx) / 16) ** 2 + ((y - hy) / 15) ** 2 < 1;
  });
};
const before = (a, S) => !behind(a, S);

const drPass = (bare) => {
  const i = bare ? 1 : 0;
  const t = bare ? 'b' : '';
  const leg = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `foot${k}${t}`, parent: `ankle${k}`, s: DR.FOOT[j][i], pivot: [4, 1.2], rot: (S) => -(S.tilt + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
      { name: `shank${k}${t}`, parent: `knee${k}`, s: DR.SHANK[j][i], pivot: [3, 1], rot: (S) => S[`shin${k}`] * D2R },
      { name: `pants${k}${t}`, parent: 'root', s: DR.PANTS[j][i], pivot: [6, 1.5], at: () => (far ? HIPF : HIPN), rot: (S) => S[`thigh${k}`] * D2R },
    ];
  };
  const wing = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return {
      up: { name: `up${k}${t}`, parent: 'root', s: DR.INNER[j][i], pivot: [2, 5.5], at: () => (far ? SHF : SHN), rot: (S) => S[`arm${k}`] * D2R },
      fore: { name: `fore${k}${t}`, parent: `elbow${k}`, s: DR.OUTER[j][i], pivot: [2, 4.5], rot: (S) => S[`elb${k}`] * D2R },
      hand: { name: `hand${k}${t}`, parent: `grip${k}`, s: DR.TIPS[j][i], pivot: [1.6, 6] },
    };
  };
  const wn = wing(false);
  const wf = wing(true);
  const mega = { name: `mega${t}`, parent: 'gripN', s: DR.MEGA[i], pivot: [8.4, 12.8], rot: (S) => S.mega * D2R };
  const PL = [[-8, -26], [-3.4, -28], [1.6, -28.4], [6, -27]];
  return [
    { name: `tail${t}`, parent: 'root', s: DR.TAIL[i], pivot: [22, 3], at: () => [-8, 9], rot: (S) => S.tail * D2R },
    // The far wing and the baton, behind her.
    wf.up, wf.fore, { name: `baton${t}`, parent: 'gripF', s: DR.BATON[i], pivot: [3, 25], rot: (S) => S.baton * D2R }, wf.hand,
    ...leg(true), ...leg(false),
    { name: `body${t}`, parent: 'root', s: DR.BODY[i], pivot: [20, 21] },
    { name: `cape${t}`, parent: 'root', s: DR.CAPE[i], pivot: [26, 5], at: () => [4, -16], rot: (S) => S.cape * D2R },
    wn.up,
    { ...wn.fore, name: `foreNk${t}`, when: behind }, { ...mega, name: `megak${t}`, when: behind }, { ...wn.hand, name: `handNk${t}`, when: behind },
    // The crest behind her head (its roots sunk in it).
    ...PL.map(([x, y], k) => ({ name: `plume${k}${t}`, parent: 'nk', s: DR.PLUME[k][i], pivot: [6, 20], at: () => [x, y], rot: (S) => (S.crest + S[`pl${k}`] - 74 + k * 11) * D2R })),
    { name: `head${t}`, parent: 'nk', s: DR.HEAD[i], pivot: [22, 40] },
    ...(bare ? [{ name: 'face', parent: 'nk', s: (a) => drFace(a.drMood ?? 'idle'), pivot: [22, 40] }] : []),
    // Her beak: the dark inside (only as it opens), the lower half.
    { name: `mouth${t}`, parent: 'nk', s: DR.MOUTH[i], pivot: [0, 1], at: () => [9, -9.6], rot: (S) => S.jaw * 0.5 * D2R, alpha: (a, S) => clamp((S.jaw - 3) / 8, 0, 1) },
    { name: `jaw${t}`, parent: 'nk', s: DR.JAW[i], pivot: [0.4, 0.4], at: () => [9, -9.2], rot: (S) => S.jaw * D2R },
    { name: `bowendF${t}`, parent: 'root', s: DR.BOWEND[i], pivot: [2.5, 1], at: () => [2, -15], rot: (S) => (S.bowE + 14) * D2R },
    { name: `bowendN${t}`, parent: 'root', s: DR.BOWEND[i], pivot: [2.5, 1], at: () => [4, -15], rot: (S) => (S.bowE - 10) * D2R },
    { name: `bow${t}`, parent: 'root', s: DR.BOW[i], pivot: [9, 5], at: () => [3, -16.4], rot: (S) => S.tilt * -0.3 * D2R },
    { ...wn.fore, when: before }, { ...mega, when: before }, { ...wn.hand, when: before },
  ];
};

// ---------- Moves ----------
// The megaphone's world angle: 0 pointing forward, -90 up, 90 down. The baton's: 0 upright, 90
// pointing forward.
function drMove(kind, cur) {
  const mk = (o) => ({ ...cur, ...o });
  if (kind === 'action') return [
    // "Action!": leaning back, the megaphone coming up to her beak, the baton up...
    mk({ x: -2, lift: 1.4, tilt: -8, head: -6, hx: -1, armN: -30, elbN: -40, mega: aim(-14, -30, -40, -8), armF: 200, elbF: 20, baton: aim(-40, 200, 20, -8), crest: 30, jaw: 6, ...legsAt(1.4, 2, -2, -8) }),
    // ...and the bellow: forward into it, beak wide, the crest flaring, the baton thrust high.
    mk({ x: 4, lift: 0, tilt: 10, head: 2, hx: 1.6, armN: -40, elbN: -30, mega: aim(-6, -40, -30, 10), armF: 225, elbF: 10, baton: aim(-20, 225, 10, 10), crest: 50, jaw: 34, ...legsAt(0, 5, -5, 10) }),
  ];
  if (kind === 'cut') return [
    // "Cut!" (through the cast): the baton raised high, the megaphone at her beak, up on her toes...
    mk({ x: -1, lift: 2, tilt: -6, head: -4, hx: -1, armN: -30, elbN: -40, mega: aim(-12, -30, -40, -6), armF: 235, elbF: 20, baton: aim(-15, 235, 20, -6), crest: 46, jaw: 14, ...legsAt(2, 1, -1, -6) }),
    // ...then a stamp, the baton slashed down, the megaphone out, CUT!
    mk({ x: 3, lift: -3, tilt: 12, head: 6, hx: 1.6, armN: -20, elbN: -20, mega: aim(4, -20, -20, 12), armF: 150, elbF: 0, baton: aim(190, 150, 0, 12), crest: 56, jaw: 36, ...legsAt(-3, 4, -4, 12) }),
  ];
  if (kind === 'take') return [
    // "Take two!": gathering herself...
    mk({ x: 0, lift: -2, tilt: 6, head: 6, hx: 0, armN: 70, elbN: -40, mega: aim(40, 70, -40, 6), armF: 150, elbF: -20, baton: aim(150, 150, -20, 6), crest: 10, jaw: 0, ...legsAt(-2, 2, -2, 6) }),
    // ...and wings flung wide, presenting them, chin up.
    mk({ x: 0, lift: 2, tilt: -6, head: -10, hx: -1, armN: -40, elbN: 10, mega: aim(-40, -40, 10, -6), armF: 215, elbF: -10, baton: aim(-40, 215, -10, -6), crest: 42, jaw: 20, ...legsAt(2, 3, -3, -6) }),
  ];
  // A bonk: the megaphone back and up over her head, and down on you.
  return [
    mk({ x: -3, lift: 1, tilt: -10, head: -4, hx: -1, armN: 230, elbN: -20, mega: aim(-120, -130, -20, -10), armF: 190, elbF: 10, baton: aim(-50, 190, 10, -10), crest: 24, jaw: 8, ...legsAt(1, 3, -3, -10) }),
    mk({ x: 7, lift: -2, tilt: 14, head: 8, hx: 1.6, armN: 400, elbN: -10, mega: aim(70, 40, -10, 14), armF: 140, elbF: -10, baton: aim(200, 140, -10, 14), crest: 40, jaw: 24, ...legsAt(-2, 7, -5, 14) }),
  ];
}

export const directriceRig = sized(makeRig({
  w: 64, h: 90, soft: true, stride: 8, recover: 0.55,
  springs: {
    x: [220, 16], lift: [200, 14], tilt: [160, 12], head: [130, 10], hx: [260, 16], armN: [220, 15], elbN: [230, 16], mega: [210, 15], armF: [190, 14], elbF: [200, 14], baton: [210, 15],
    thighN: [300, 18], thighF: [300, 18], shinN: [300, 18], shinF: [300, 18], rollN: [300, 18], rollF: [300, 18],
    crest: [110, 7], pl0: [70, 4.4], pl1: [64, 4], pl2: [58, 3.6], pl3: [52, 3.4], jaw: [260, 18], tail: [70, 5], cape: [70, 5], bowE: [50, 3.4],
  },
  fast: ['x', 'armN', 'elbN', 'mega', 'armF', 'elbF', 'baton', 'thighN', 'thighF', 'shinN', 'shinF', 'lift', 'jaw'],
  kick: { tilt: -160, head: -200, pl0: 260, pl1: -240, pl2: 280, pl3: -220, tail: 220, cape: 200, bowE: 300, crest: 200 },
  turnKick: { pl0: 200, pl1: 240, pl2: 200, pl3: 240, tail: 260, cape: 220, bowE: 300 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const mo = a.mo ?? {};
    const st = mo.rig;
    const now = a.now;
    a.drU = stepPhase(m, a, 'dr3', 16 * 1.1);
    const act = (at, wind, dur) => (at != null && now >= at - wind && now < at + dur ? { antic: now < at ? smooth(1 - (at - now) / wind) : 0, strike: now >= at ? (now - at < 0.07 ? smooth((now - at) / 0.07) : 1 - smooth(clamp((now - at - 0.3) / (dur - 0.3), 0, 1))) : 0 } : null);
    const actionA = act(m.actionAt, 0.35, 1.1);
    const takeA = act(m.takeAt, 0.4, 1.6);
    const cutCast = m.castPose === 'cut' && m.cast ? smooth(clamp((now - m.cast.t0) / 0.45, 0, 1)) : 0;
    const cutA = act(m.cutAt, 0, 1.1);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    // (In her entrance scene her wind-up and swing are her "Action!".)
    let kind = m.cine ? 'action' : 'bonk';
    let ph = a.ph;
    if (!active) {
      const pick = cutA ? ['cut', cutA] : actionA ? ['action', actionA] : takeA ? ['take', takeA] : null;
      if (pick) {
        kind = pick[0];
        ph = { ...a.ph, ...pick[1], since: -1 };
      }
    }
    if (!active && cutCast > 0 && !cutA) {
      kind = 'cut';
      ph = { ...a.ph, antic: cutCast, strike: 0, since: -1 };
    }
    a.drKind = kind;
    a.drPh = ph;
    const walkW = a.walkW ?? 0;
    const still = 1 - walkW;
    const roused = m.cine?.mood === 'angry' ? 1 : 0;
    // Her idle, a 10 s act: conducting little beats; a twirl of the baton; an impatient "Hmph!".
    const lu = fr(t / 10) * 10;
    const busy = active || actionA || takeA || cutCast > 0 || cutA || walkW > 0.05 || m.cine;
    const twirl = !busy && lu >= 3.6 && lu < 5.4 ? smooth(clamp((lu - 3.7) / 1.3, 0, 1)) : 0;
    const hmph = busy ? 0 : hold(lu, 6.6, 7, 8.4, 8.8);
    const cond = busy ? 0 : hold(lu, 0.4, 0.9, 2.6, 3.1);
    const beat = Math.sin(t * 6) * cond;
    const tap = hmph * Math.max(0, Math.sin(t * 11));
    a.drAct = { hmph: hmph * still, twirl: twirl > 0 && twirl < 1 ? still : 0 };
    const sway = Math.sin(t * 1.2);
    const armFI = 190 + beat * 4;
    const elbFI = 20 + beat * 14 - Math.sin(twirl * Math.PI) * 20;
    const idleLift = sway * 0.4 + hmph * 0.8;
    const idle = {
      x: 0, lift: idleLift, tilt: sway * 1.2 - hmph * 5, head: -2 + Math.sin(t * 1.5) * 2 - hmph * 12 + beat * 1.2, hx: 0,
      armN: 60, elbN: -10, mega: aim(30 + sway * 3, 60, -10), armF: armFI, elbF: elbFI, baton: aim(-20 + beat * 14, armFI, elbFI) + twirl * 360,
      ...legsAt(idleLift, 1.2, -1.2), rollN: tap * 24,
      crest: 4 + hmph * 40 + roused * 44 + Math.sin(t * 0.9) * 2, jaw: 0, tail: sway * 3, cape: -sway * 2, bowE: sway * 6,
    };
    // A waddle on planted feet: her body rocking, her head bobbing forward on each step, the cape,
    // tail and crest swinging after.
    const u = a.drU;
    const lead = ((st?.dr3V ?? 0) / (16 * 1.1)) * 0.05;
    const [dxN, upN] = pawStep(u + lead, 0, 16, 0.56, 3.6);
    const [dxF, upF] = pawStep(u + lead, 0.5, 16, 0.56, 3.6);
    const w2 = u * TAU * 2;
    const land = (1 + Math.cos(w2)) / 2;
    const sw = Math.sin(u * TAU);
    const wLift = 0.4 - land * 1.8;
    const wTilt = 4 + sw * 3;
    const [thN, shN] = legIK(dxN, HIPY + wLift - SOLE - upN, wTilt);
    const [thF, shF] = legIK(dxF, HIPY + wLift - SOLE - upF, wTilt);
    const armNW = 60 + sw * 8;
    const armFW = 190 - sw * 6;
    const walk = {
      x: 0, lift: wLift, tilt: wTilt, head: -wTilt * 0.6 + land * 2, hx: Math.sin(w2 + 0.8) * 1.6, armN: armNW, elbN: -10, mega: aim(30 + sw * 6, armNW, -10, wTilt), armF: armFW, elbF: 20, baton: aim(-20 + sw * 6, armFW, 20, wTilt),
      thighN: thN, shinN: shN, thighF: thF, shinF: shF, rollN: upN * 6, rollF: upF * 6,
      crest: 8 + land * 6, jaw: 0, tail: Math.sin(w2 - 1) * 8, cape: -sw * 7 - land * 2, bowE: Math.sin(w2 - 1.2) * 12,
    };
    const [antic, strike] = drMove(kind, idle);
    let base = idle;
    // (The over-the-top bonk: the rest pose a turn round until the move is over.)
    if (kind === 'bonk' && ph.since >= 0) mo.drWrap = 360;
    if (mo.drWrap && !active) {
      mo.drWrap = 0;
      if (st?.armN && st.armN.x > 200) st.armN.x -= 360;
    }
    base = { ...base, armN: base.armN + (mo.drWrap ?? 0) };
    walk.armN += mo.drWrap ?? 0;
    const S = stateBlend({ ...a, ph }, base, walk, antic, strike);
    // The crest plumes, each a beat behind the last.
    S.pl0 = Math.sin(t * 2.1) * 2 - S.tilt * 0.4;
    S.pl1 = Math.sin(t * 2.1 - 0.6) * 2.4 - S.tilt * 0.5;
    S.pl2 = Math.sin(t * 2.1 - 1.2) * 2.8 - S.tilt * 0.6;
    S.pl3 = Math.sin(t * 2.1 - 1.8) * 3.2 - S.tilt * 0.7;
    S.cape -= S.tilt * 0.4;
    a.drMood = drMood(a, m);
    unwind(st, 'baton', S.baton);
    return S;
  },
  parts: [
    { name: 'root', parent: null, at: (S) => [S.x, -BODY - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'root', at: (S) => [2 + S.hx, -NECK], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'elbowN', parent: 'upN', at: () => [UA, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [UA, 0] },
    { name: 'gripN', parent: 'foreN', at: () => [FA, 0] },
    { name: 'gripF', parent: 'foreF', at: () => [FA, 0] },
    { name: 'kneeN', parent: 'pantsN', at: () => [0, L1] },
    { name: 'kneeF', parent: 'pantsF', at: () => [0, L1] },
    { name: 'ankleN', parent: 'shankN', at: () => [0, L2] },
    { name: 'ankleF', parent: 'shankF', at: () => [0, L2] },
    ...drPass(false),
    ...drPass(true),
  ],
  // Her spotlight on the boards.
  under(ctx, m, a) {
    const al = (0.34 + Math.sin(a.now * 1.6) * 0.04) * a.alpha * (m.hp > 0 ? 1 : 0.5);
    const g = ctx.createRadialGradient(0, -1, 0, 0, -1, 34);
    g.addColorStop(0, `rgba(255,236,190,${al})`);
    g.addColorStop(0.7, `rgba(255,236,190,${al * 0.6})`);
    g.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.scale(1, 0.18);
    ctx.fillRect(-34, -40, 68, 68);
    ctx.restore();
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const ph = a.drPh ?? a.ph;
    const kind = a.drKind;
    const [bx, by] = at2(mat('mega'), 19, -5.6);
    // Her bellow: rings of sound out of the bell.
    const yell = clamp((S.jaw - 12) / 20, 0, 1);
    if (yell > 0.05) {
      const ang = (S.armN + S.elbN + S.mega + S.tilt) * D2R;
      for (let k = 0; k < 3; k++) {
        const q = fr(a.now * 2.4 + k / 3);
        ctx.globalAlpha = a.alpha * yell * (1 - q);
        ctx.strokeStyle = k === 1 ? '#ff9ab8' : '#ffd36b';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(bx + Math.cos(ang) * q * 18, by + Math.sin(ang) * q * 18, 5 + q * 12, ang - 0.9, ang + 0.9);
        ctx.stroke();
      }
    }
    // The bonk: a star where the bell lands.
    if (kind === 'bonk' && ph.strike > 0.3) sparkle(ctx, a, bx, by, 7 * ph.strike, ph.strike, '#fff6c8');
    // Cut!: a snap of light off the baton's tip, a ring bursting over the boards round her feet.
    if (kind === 'cut' && ph.strike > 0.1) {
      const [tx, ty] = at2(mat('baton'), 0, -23);
      sparkle(ctx, a, tx, ty, 7 * ph.strike, ph.strike, '#ffffff');
      const r = 12 + (1 - ph.strike) * 40;
      ctx.globalAlpha = a.alpha * ph.strike * 0.8;
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffd36b';
      ctx.beginPath();
      ctx.ellipse(0, -1, r, r * 0.2, 0, 0, TAU);
      ctx.stroke();
    }
    // Take two!: sparkles flung out to either side, where the Understudies come on.
    if (kind === 'take' && ph.strike > 0.1) for (let k = 0; k < 6; k++) {
      const sd = k % 2 ? 1 : -1;
      const q = 1 - ph.strike;
      sparkle(ctx, a, sd * (16 + q * 40 + (k >> 1) * 6), -30 - (k >> 1) * 10 + q * 10, 2.6, ph.strike, k % 3 ? '#fff3c4' : '#d8c8ff');
    }
    // Her idle "Hmph!": a puff of breath off her beak.
    if ((a.drAct?.hmph ?? 0) > 0.6) {
      const q = fr(a.now * 1.4);
      const [hx, hy] = at2(mat('nk'), 20, -12);
      puff(ctx, a, hx + q * 8, hy - q * 4, 2 + q * 3, (1 - q) * 0.5);
    }
    ctx.globalAlpha = a.alpha;
  },
}), 1.1);
function drMood(a, m) {
  if (m.hp <= 0) return 'dead';
  const ph = a.drPh ?? a.ph;
  const kind = a.drKind;
  if (ph.strike > 0.25) return kind === 'take' ? 'happy' : 'shout';
  if (kind === 'cut' && ph.antic > 0.2) return 'angry';
  if (kind === 'action' && ph.antic > 0.3) return 'focus';
  if (a.ph.atk || ph.antic > 0.3) return 'angry';
  if (a.mood === 'hurt' || a.face === 'hurt') return 'hurt';
  if (m.cine?.mood === 'angry') return 'angry';
  if (m.cine?.mood === 'happy') return 'happy';
  const act = a.drAct ?? {};
  if (act.hmph > 0.4) return 'hmph';
  const t = a.t + (a.uidOff ?? 0);
  if (t % 4.3 < 0.13) return 'blink';
  return 'idle';
}

// ---------- The still (portraits) ----------
export function directriceStill(pose, f, mood) {
  const fm = DR_FACES[mood] ? mood : MOODS.has(mood) ? mood : 'idle';
  const lg = legsAt(0, 1.2, -1.2);
  const root = [0, -BODY];
  const nk = [root[0] + 2, root[1] - NECK];
  const legAt = (far) => {
    const [hx, hy] = far ? HIPF : HIPN;
    const k = far ? 'F' : 'N';
    const th = lg[`thigh${k}`];
    const sh = lg[`shin${k}`];
    const tr = th * D2R;
    const kx = root[0] + hx - Math.sin(tr) * L1;
    const ky = root[1] + hy + Math.cos(tr) * L1;
    const sr = (th + sh) * D2R;
    return [...put(footP(far)(), [4, 1.2], kx - Math.sin(sr) * L2, ky + Math.cos(sr) * L2, 0), ...put(shankP(far)(), [3, 1], kx, ky, th + sh), ...put(pantsP(far)(), [6, 1.5], root[0] + hx, root[1] + hy, th)];
  };
  const wing = (far, armA, elbA) => {
    const [sx, sy] = far ? [root[0] + SHF[0], root[1] + SHF[1]] : [root[0] + SHN[0], root[1] + SHN[1]];
    const ex = sx + Math.cos(armA * D2R) * UA;
    const ey = sy + Math.sin(armA * D2R) * UA;
    const fa = armA + elbA;
    const gx = ex + Math.cos(fa * D2R) * FA;
    const gy = ey + Math.sin(fa * D2R) * FA;
    return { up: put(innerP(far)(), [2, 5.5], sx, sy, armA), fore: put(outerP(far)(), [2, 4.5], ex, ey, fa), tips: put(tipsP(far)(), [1.6, 6], gx, gy, fa), grip: [gx, gy] };
  };
  const wn = wing(false, 60, -10);
  const wf = wing(true, 190, 20);
  const PL = [[-8, -26], [-3.4, -28], [1.6, -28.4], [6, -27]];
  return { w: 64, h: 90, res: 2, shapes: shift([
    ...put(tailP(), [22, 3], root[0] - 8, root[1] + 9),
    ...wf.up, ...wf.fore, ...put(batonP(), [3, 25], wf.grip[0], wf.grip[1], -20), ...wf.tips,
    ...legAt(true), ...legAt(false),
    ...put(bodyP(), [20, 21], root[0], root[1]), ...put(capeP(), [26, 5], root[0] + 4, root[1] - 16),
    ...wn.up,
    ...PL.flatMap(([x, y], k) => put(plumeP(k)(), [6, 20], nk[0] + x, nk[1] + y, 4 - 74 + k * 11)),
    ...put(headP(), [22, 40], nk[0], nk[1]), ...put((DR_FACES[fm] ?? DR_FACES.idle)(), [22, 40], nk[0], nk[1]), ...put(jawP(), [0.4, 0.4], nk[0] + 9, nk[1] - 9.2),
    ...put(bowEndP(), [2.5, 1], root[0] + 2, root[1] - 15, 14), ...put(bowEndP(), [2.5, 1], root[0] + 4, root[1] - 15, -10), ...put(bowP(), [9, 5], root[0] + 3, root[1] - 16.4),
    ...wn.fore, ...put(megaP(), [8.4, 12.8], wn.grip[0], wn.grip[1], 30), ...wn.tips,
  ], 32, 89) };
}
