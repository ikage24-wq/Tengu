// Toffee, the Caramel Smith (redrawn 2026-11-19, the player's pick "B, the Master Smith"): the
// Candy Volcano's smith, a chubby beaver girl. A white blouse with rolled sleeves under a long
// leather apron (a riveted bib, a skirt with pockets of candy tools, hung from her waist so it
// swings as she walks), a red bandana knotted at the back (its two tails flying), a striped towel
// round her neck (one end hanging), cream trousers, chunky boots, thick gloves, a leather arm guard,
// round ears, two big front teeth, a flat paddle tail. Her great hammer, banded with caramel and
// dripping, is gripped at the end of its handle, so its head stands up beside her face, never
// across it; when a swing would carry it across her head, it goes behind.
//
// How she moves:
//   idle    a 12 s act: rocking on her heels, the hammer up; a show-off flip of the hammer, caught;
//           blowing on the hot caramel to cool it; a tap of the hammer on the floor.
//   walk    a chubby waddle on planted feet (knees bend to wherever each foot is, so nothing
//           slides): short steps, a bob and a rock on each, her tail flapping, apron, towel and
//           bandana tails swinging, the hammer bobbing upright in her fist.
//   attacks a bonk (a plain swing: up and over, down on you); Hammer Quake (world/volcano.js:
//           m.castPose 'quake' and a cast bar: the hammer raised high in both fists, trembling,
//           then slammed into the floor); Sparks (m.sparkAt: a tap and a flick, caramel flung up);
//           the Bellows (m.blowAt: a huge breath, cheeks puffed, then she blows everyone back).
//   hit     a kick through her tilt, head, ears, tail, apron and towel.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, faceShapes, sparkle, puff } from './rigkit.js';

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
const blob = (pts, c) => T(smoothPts(pts), c);
const INK = '#2e1c26';
const line = (pts, w, c = INK) => stroke(pts, w, c).map(F);
const aim = (want, arm, elb, tilt = 0) => want - arm - elb - tilt;

const FUR = ramp('#a8683a', { step: 9, turn: 10 });
const CREAM = '#f6dcc0';
const CARAMEL = ramp('#e8902a', { step: 10, turn: 8 });
const IRON = ramp('#7a7488', { step: 9, turn: 8, lift: 6 });
const LEA = ramp('#7a4a2a', { step: 9, turn: 8, lift: 6 });
const BLOUSE = ramp('#fff8ec', { step: 6, turn: 8, lift: 2 });
const PANTS = ramp('#f0e4cc', { step: 7, turn: 8 });
const GLOVE = '#5a3a2a';
const BOOT = ramp('#6a4a32', { step: 8, turn: 8 });
const RED = '#d8443a';
const tf = pairOf('tf2');

// ---------- Parts ----------
// (Chest space: the chest joint 2 above the hip, the hip 22 above the floor; shoulders at (11, -24)
// and (-10, -24); the neck at (0, -30); the head's centre 18 above the neck.)
const HX = 22;
const HY = 19;
// The head: round, cheek fluff, a big cream muzzle, a dark button nose, two big front teeth, and
// the red bandana tied over her crown. Box 44 x 38; the neck at (22, 37).
const tfHead = () => [
  blob([[HX - 16, HY + 2], [HX - 21, HY + 9], [HX - 15, HY + 8.4], [HX - 16, HY + 13], [HX - 10, HY + 10]], FUR.base),
  E(HX, HY, 18, 16, FUR.base), crescent(HX, HY, 18, 16, FUR.sh, { k: 0.14, a0: 110, a1: 210 }), F(E(HX - 6, HY - 6, 5, 2, FUR.hi)),
  F(blob([[HX - 1, HY + 4], [HX + 8, HY + 1.6], [HX + 19, HY + 5], [HX + 17, HY + 12], [HX + 6, HY + 15.4], [HX - 2, HY + 11]], CREAM)),
  E(HX + 17.6, HY + 4.6, 2.6, 2, '#4a2a2a'), F(E(HX + 16.8, HY + 3.9, 0.8, 0.5, '#ffffff')),
  // The bandana: over her crown, a knot at the back.
  blob([[HX - 17, HY - 6], [HX - 8, HY - 15.6], [HX + 6, HY - 16.4], [HX + 16, HY - 10], [HX + 14, HY - 6.6], [HX - 15, HY - 2]], RED),
  ...[[HX - 6, HY - 11], [HX + 4, HY - 12.6], [HX + 10, HY - 9], [HX - 12, HY - 6]].map(([x, y]) => F(E(x, y, 1, 0.9, '#ffffff'))), F(blob([[HX - 10, HY - 13], [HX + 2, HY - 15.4], [HX - 2, HY - 13.6]], '#ff7a6a')),
  E(HX - 17, HY - 4, 2.6, 2.4, '#b8343a'),
];
// Her teeth and mouth go with the face (they open when she shouts).
// Round ears (box 12 x 11, rooted at (6, 8)).
const tfEar = (far) => () => [E(6, 5, 4.6, 4.2, far ? FUR.sh : FUR.base), F(E(6, 5, 2.4, 2.2, far ? '#e8a888' : '#f0b8a0'))];
// The bandana's tails (box 14 x 8 from the knot (1, 4)).
const tfKnot = (k) => () => [T(k ? [[1, 4], [12, 1], [13, 5], [6, 6]] : [[1, 4], [11, 5], [12, 8], [5, 7]], k ? RED : '#c8343a')];
// Her body in the blouse: round and chubby. Box 38 x 38; the chest joint at (19, 35).
const tfBody = () => [blob([[4, 8], [12, 2], [26, 2], [34, 10], [35, 24], [31, 35], [7, 35], [3, 24]], BLOUSE.base), crescent(19, 20, 16, 16, BLOUSE.sh, { k: 0.12, a0: 110, a1: 220 }), F(blob([[15, 2], [23, 2], [19, 7]], FUR.base))];
// The apron's bib (box 24 x 22 from (12, 1)) and its skirt (box 30 x 22 from the waist (15, 1)).
const tfBib = () => [blob([[3, 1], [21, 1], [22, 21], [2, 21]], LEA.base), F(blob([[3, 1], [7, 1], [5, 20], [2, 20]], LEA.hi)), ...[[4, 3], [20, 3]].map(([x, y]) => F(E(x, y, 0.8, 0.8, '#ffd36b'))), R(8, 9, 8, 7, LEA.sh), R(10.6, 5.6, 1.4, 5, '#e8902a'), F(R(8, 9, 8, 1, LEA.hi))];
const tfSkirt = () => [
  blob([[4, 1], [26, 1], [29, 18], [24, 20.6], [6, 20.6], [1, 18]], LEA.base), F(blob([[4, 1], [8, 1], [5, 18], [1.6, 17]], LEA.hi)),
  R(5, 4, 8, 7, LEA.sh), R(17, 4, 8, 7, LEA.sh), ...[[5.6, 4.6], [12.4, 4.6], [17.6, 4.6], [24.4, 4.6]].map(([x, y]) => F(E(x, y, 0.7, 0.7, '#ffd36b'))),
  R(7, 0.4, 2.4, 5, '#c8c0d0'), E(8.2, 0.4, 1.8, 1.2, '#c8c0d0'), R(19.4, 0, 2, 5.4, '#e86a5a'), F(R(19.4, 0, 2, 1.4, '#ffffff')),
  ...line([[3, 17], [15, 19.4], [27, 17]], 0.5, LEA.sh),
];
// The towel round her neck (box 30 x 10 about (15, 5)) and its hanging end (box 8 x 18 from (4, 1)).
const tfTowel = () => [blob([[2, 3], [15, 0.6], [28, 3], [27, 8], [15, 9], [3, 8]], '#fff4e0'), F(blob([[4, 3], [15, 1.6], [24, 3], [15, 4]], '#ffffff')), ...line([[5, 6], [15, 7.4], [25, 6]], 0.5, '#e8d8c0')];
const tfTowelEnd = () => [T([[1, 1], [7, 1], [7.6, 16], [0.4, 16]], '#fff4e0'), ...[6, 10].map((y) => F(R(0.8, y, 6.8, 1, '#e86a5a'))), ...[1.4, 3.4, 5.4].map((x) => F(R(x, 16, 0.8, 1.6, '#e8d8c0')))];
// The paddle tail (box 32 x 18, its root at (30, 9)).
const tfTail = () => [blob([[30, 6], [22, 2], [8, 2], [2, 9], [8, 16], [22, 16], [30, 12]], '#6a4a3a'), ...[24, 18, 12].map((x) => F(taper([[x, 4], [x - 3, 14]], 0.6, 0.6, '#5a3a2a'))), ...[6.4, 11.6].map((y) => F(taper([[26, y], [6, y]], 0.5, 0.5, '#5a3a2a'))), F(blob([[20, 3.4], [10, 3.4], [14, 5]], '#8a6a5a'))];
// An arm: the upper in a puffed sleeve rolled at the elbow (box 14 x 10 from the shoulder (2, 5);
// the elbow 8 on), the furry forearm (box 13 x 9 from (2, 4.5); the grip 8.4 on; the near one in a
// leather guard), the gloved fist (box 10 x 10 about (5, 5)).
const tfUpper = (far) => () => [taper([[2, 5], [10, 5]], 7.4, 6.6, far ? BLOUSE.sh : BLOUSE.base), F(E(4, 3.4, 2.6, 1.2, '#ffffff')), R(8.6, 1.6, 2.2, 6.8, far ? '#d8ccb8' : '#f0e4cc')];
const tfFore = (far) => () => [taper([[2, 4.5], [10, 4.5]], 6.2, 5.8, far ? FUR.sh : FUR.base), ...(far ? [] : [R(4, 1.4, 5, 6.2, LEA.base), F(R(4, 1.4, 5, 1, LEA.hi)), F(E(6.5, 4.5, 0.6, 0.6, '#ffd36b'))])];
const tfFist = (far) => () => [E(5, 5, 4.2, 4, far ? '#4a2a1a' : GLOVE), F(E(3.6, 3.6, 1.4, 1, far ? '#6a4a3a' : '#7a5a4a'))];
// A leg: the trouser thigh (box 12 x 12 from the hip (6, 2); the knee 7.5 down), the shin (box 12 x
// 12 from (6, 1); the ankle 8.6 down), the chunky boot (box 18 x 10 from the ankle (6, 2)).
const tfThigh = (far) => () => [taper([[6, 2], [6, 9.5]], 8.4, 7.4, far ? PANTS.sh : PANTS.base)];
const tfShin = (far) => () => [taper([[6, 1], [6, 8.6]], 7.4, 6.8, far ? PANTS.sh : PANTS.base), F(R(2.6, 6.6, 6.8, 1, far ? '#c8b89a' : '#d8c8aa'))];
const tfBoot = (far) => () => [blob([[1.4, 0.4], [10.6, 0.4], [11.4, 3.4], [16, 4.6], [16.4, 8.4], [0.8, 8.4]], far ? BOOT.sh : BOOT.base), F(R(0.8, 0.2, 10.6, 2.4, far ? '#7a5a3a' : '#9a7a4a')), F(R(1, 7.6, 15.2, 1, '#3a2a2a')), F(E(12.4, 4.6, 1.4, 0.8, far ? BOOT.base : BOOT.hi))];
// The great hammer, gripped at the end of its handle (14, 56): the handle up to an iron head
// banded with caramel, caramel dripping off it. Box 28 x 60.
const tfHammer = () => [
  taper([[14, 56], [14, 14]], 3.4, 3, '#8a5a3a'), F(taper([[13.2, 54], [13.2, 15]], 0.8, 0.8, '#b07a4a')), E(14, 56.4, 2.2, 1.6, '#5a3a2a'), R(12.2, 40, 3.6, 2, '#5a3a2a'), R(12.2, 46, 3.6, 2, '#5a3a2a'),
  R(2, 0, 24, 14, IRON.base), F(R(2, 0, 24, 2, IRON.hi)), F(R(2, 12, 24, 2, IRON.sh)), R(2, 4, 24, 5, CARAMEL.base), F(R(2, 4, 24, 1.2, '#ffc070')),
  ...[5, 11, 19].map((x, i) => T([[x - 1.6, 9], [x + 1.6, 9], [x + 1.2, 12 + i * 1.4], [x, 13.6 + i * 1.4], [x - 1.2, 12 + i * 1.4]], CARAMEL.base)),
  F(E(22, 2.4, 1.4, 0.8, '#ffffff')),
];
const TF = {
  HEAD: tf('head', 44, 38, tfHead, 2), EAR: [false, true].map((f) => tf(`ear${f ? 1 : 0}`, 12, 11, tfEar(f), 2)), KNOT: [0, 1].map((k) => tf(`knot${k}`, 14, 8, tfKnot(k), 2)),
  BODY: tf('body', 38, 38, tfBody, 2), BIB: tf('bib', 24, 22, tfBib, 2), SKIRT: tf('skirt', 30, 22, tfSkirt, 2), TOWEL: tf('towel', 30, 10, tfTowel, 2), TOWELEND: tf('towelend', 8, 18, tfTowelEnd, 2), TAIL: tf('tail', 32, 18, tfTail, 2),
  UP: [false, true].map((f) => tf(`up${f ? 1 : 0}`, 14, 10, tfUpper(f), 2)), FORE: [false, true].map((f) => tf(`fore${f ? 1 : 0}`, 13, 9, tfFore(f), 2)), FIST: [false, true].map((f) => tf(`fist${f ? 1 : 0}`, 10, 10, tfFist(f), 2)),
  THIGH: [false, true].map((f) => tf(`thigh${f ? 1 : 0}`, 12, 12, tfThigh(f), 2)), SHIN: [false, true].map((f) => tf(`shin${f ? 1 : 0}`, 12, 12, tfShin(f), 2)), BOOT: [false, true].map((f) => tf(`boot${f ? 1 : 0}`, 18, 10, tfBoot(f), 2)),
  HAMMER: tf('hammer', 28, 60, tfHammer, 2),
};

// ---------- Faces ----------
const EN = [HX + 9, HY + 0.6, 3.4];
const EF = [HX - 3, HY + 0.6, 3];
const eye = ([x, y, r], { lid = 0, small = false, ly = 0 } = {}) => [
  F(E(x, y, r, r * 1.15, INK)), F(E(x, y + r * 0.35 + ly * 0.3, r * 0.8, r * 0.7, '#8a5a2a')),
  ...(small ? [F(E(x, y + ly * 0.3, r * 0.3, r * 0.34, '#ffffff'))] : [F(E(x - r * 0.3, y - r * 0.4, r * 0.4, r * 0.42, '#ffffff')), F(E(x + r * 0.35, y + r * 0.4, r * 0.15, r * 0.15, '#ffffff'))]),
  ...(lid > 0 ? [F(T([...arcP(x, y, r * 1.12, r * 1.25, 180, 360, 8), ...arcP(x, y - r * 1.15 * (1 - lid * 2), r * 1.12, r * 0.35, 0, 180, 8)], FUR.base)), ...line(arcP(x, y - r * 1.15 * (1 - lid * 2), r * 1.05, r * 0.32, 15, 165, 7), 0.7)] : []),
];
const shutE = ([x, y, r], up = false) => line(arcP(x, y + 0.6, r, r * 0.6, up ? 200 : 20, up ? 340 : 160, 7), 0.8);
const BROW = '#6a3a1a';
const brows = (n, f, c = BROW) => [F(taper(n, 1.4, 0.8, c)), F(taper(f, 1.2, 0.7, c))];
const BN = [[HX + 5.4, HY - 5], [HX + 12, HY - 5.4]];
const BF = [[HX - 6.2, HY - 4.6], [HX - 0.6, HY - 5]];
const teeth = (dy = 0) => [R(HX + 10.2, HY + 11 + dy, 2.4, 3.4, '#ffffff'), R(HX + 12.8, HY + 11 + dy, 2.4, 3.4, '#ffffff'), ...line([[HX + 12.7, HY + 11 + dy], [HX + 12.7, HY + 14.2 + dy]], 0.4, '#c8b8a8')];
const grin = () => [...line(arcP(HX + 11.6, HY + 9.4, 3, 1.4, 20, 160, 6), 0.7, '#7a3040'), ...teeth()];
const openM = (k = 1) => [F(E(HX + 12, HY + 11.4, 3 * k, 2.6 * k, '#7a3040')), F(E(HX + 12, HY + 12.6, 1.8 * k, 1 * k, '#ff9ab0')), ...teeth(-0.6)];
const frown = () => [...line(arcP(HX + 11.6, HY + 10.6, 2.4, 1, 200, 340, 6), 0.7, '#7a3040'), ...teeth(0.4)];
const blush = (k = 1) => [F(E(HX - 9, HY + 6.4, 2.6 * k, 1.3 * k, '#ff9a8a')), F(E(HX + 16, HY + 8, 2 * k, 1 * k, '#ff9a8a'))];
const TF_FACES = {
  // Cheerful and sure of herself: a grin, teeth showing.
  idle: () => [...eye(EN), ...eye(EF), ...brows(...BN.length ? [BN, BF] : []), ...grin(), ...blush()],
  blink: () => [...shutE(EN), ...shutE(EF), ...brows(BN, BF), ...grin(), ...blush()],
  happy: () => [...shutE(EN, true), ...shutE(EF, true), ...brows(BN.map(([x, y]) => [x, y - 1]), BF.map(([x, y]) => [x, y - 1])), ...openM(0.9), ...blush(1.2)],
  // Set to work: brows down, a toothy grit.
  angry: () => [...eye(EN, { lid: 0.2, small: true }), ...eye(EF, { lid: 0.2, small: true }), ...brows([[HX + 5, HY - 3], [HX + 12.4, HY - 6]], [[HX - 6.6, HY - 6], [HX - 0.4, HY - 3.2]], INK), ...frown(), ...blush(0.7)],
  shout: () => [...eye(EN, { small: true }), ...eye(EF, { small: true }), ...brows(BN.map(([x, y]) => [x, y - 1.6]), BF.map(([x, y]) => [x, y - 1.6]), INK), ...openM(1.2), ...blush(0.8)],
  // Puffing her cheeks for the bellows, and blowing.
  puff: () => [...shutE(EN), ...shutE(EF), ...brows(BN, BF), F(E(HX + 15, HY + 9, 4.4, 4, FUR.base)), F(E(HX - 10, HY + 7, 3, 2.8, FUR.base)), F(E(HX + 13, HY + 11, 1.2, 1, '#7a3040')), ...blush(1.4)],
  blow: () => [...eye(EN, { lid: 0.3 }), ...eye(EF, { lid: 0.3 }), ...brows(BN, BF), F(E(HX + 13.6, HY + 11, 2, 1.8, '#7a3040')), ...blush()],
  hurt: () => [...line([[EN[0] - 2.6, EN[1] - 2], [EN[0] + 1.6, EN[1]], [EN[0] - 2.6, EN[1] + 2]], 0.8), ...line([[EF[0] + 2.4, EF[1] - 2], [EF[0] - 1.4, EF[1]], [EF[0] + 2.4, EF[1] + 2]], 0.8), ...brows([[HX + 5.4, HY - 6], [HX + 12, HY - 3.6]], [[HX - 6.2, HY - 3.6], [HX - 0.6, HY - 6]]), ...frown(), E(HX + 14.6, HY + 3, 1.1, 1.6, '#6ec4ff')],
  dead: () => [...line([[EN[0] - 2.4, EN[1] - 2.4], [EN[0] + 2.4, EN[1] + 2.4]], 0.8), ...line([[EN[0] + 2.4, EN[1] - 2.4], [EN[0] - 2.4, EN[1] + 2.4]], 0.8), ...line([[EF[0] - 2, EF[1] - 2], [EF[0] + 2, EF[1] + 2]], 0.7), ...line([[EF[0] + 2, EF[1] - 2], [EF[0] - 2, EF[1] + 2]], 0.7), ...openM(0.6)],
};
const FACE_FB = { eyes: [[EN[0], EN[1], 3, 3.4, 1], [EF[0], EF[1], 2.6, 3, -1]], mouth: [HX + 12, HY + 10, 1], blush: [[HX - 9, HY + 6.4, 1.6], [HX + 16, HY + 8, 1.6]], iris: '#8a5a2a', lid: 0, lashes: 1 };
const tfFace = (mood) => faceSprite(`tf2|face|${mood}`, 44, 38, () => (TF_FACES[mood] ?? (() => faceShapes(mood, FACE_FB)))());

// ---------- Skeleton ----------
const HIP = 22;
const L1 = 7.5;
const L2 = 8.6;
const LEG_DY = 15.4;
function legIK(dx, dy, hipDeg) {
  const d = Math.min(L1 + L2 - 0.05, Math.max(3, Math.hypot(dx, dy)));
  const h = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const k = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return [(-Math.atan2(dx, dy) - h) / D2R - hipDeg, (Math.PI - k) / D2R];
}
const [ST, SS] = legIK(0, LEG_DY, 0);
const legs = (tn, sn, tf2, sf) => ({ thighN: tn, shinN: sn, thighF: tf2, shinF: sf, rollN: 0, rollF: 0 });
const STAND = legs(ST, SS, ST, SS);
const SQUAT = legs(ST - 26, SS + 40, ST - 18, SS + 36);
// Would the hammer overlap her head? (Chest space; the handle and the iron head sampled.)
const HAMMER_PTS = [[0, -50], [-9, -48], [9, -48], [-9, -40], [9, -40], [0, -36], [0, -26], [0, -16]];
const behind = (a, S) => {
  const ar = S.armN * D2R;
  const er = (S.armN + S.elbN) * D2R;
  const wx = 11 + 8 * Math.cos(ar) + 8.4 * Math.cos(er);
  const wy = -24 + 8 * Math.sin(ar) + 8.4 * Math.sin(er);
  const pr = (S.armN + S.elbN + S.ham) * D2R;
  const hr = (S.head - S.tilt * 0.5) * D2R;
  const hx = 18 * Math.sin(hr);
  const hy = -30 - 18 * Math.cos(hr);
  return HAMMER_PTS.some(([px, py]) => {
    const x = wx + px * Math.cos(pr) - py * Math.sin(pr);
    const y = wy + px * Math.sin(pr) + py * Math.cos(pr);
    return ((x - hx - 1.5) / 21) ** 2 + ((y - hy - 1) / 18) ** 2 < 1;
  });
};
const before = (a, S) => !behind(a, S);
// (A full turn's gap between a held prop and where it's going (a twirl cut short by a move or a
// walk) is the same angle: the spring is wound round to it, never spun back.)
const unwind = (st, name, goal) => {
  const sp = st?.[name];
  if (!sp) return;
  if (sp.x - goal > 270) sp.x -= 360;
  else if (goal - sp.x > 270) sp.x += 360;
};


const tfPass = (bare) => {
  const i = bare ? 1 : 0;
  const t = bare ? 'b' : '';
  const leg = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `boot${k}${t}`, parent: `ankle${k}`, s: TF.BOOT[j][i], pivot: [6, 2], rot: (S) => -(S.tilt * 0.3 + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
      { name: `shin${k}${t}`, parent: `knee${k}`, s: TF.SHIN[j][i], pivot: [6, 1], rot: (S) => S[`shin${k}`] * D2R },
      { name: `thigh${k}${t}`, parent: 'hip', s: TF.THIGH[j][i], pivot: [6, 2], at: () => [far ? -6 : 6, 0], rot: (S) => S[`thigh${k}`] * D2R },
    ];
  };
  const arm = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return {
      up: { name: `up${k}${t}`, parent: 'chest', s: TF.UP[j][i], pivot: [2, 5], at: () => (far ? [-10, -24] : [11, -24]), rot: (S) => S[`arm${k}`] * D2R },
      fore: { name: `fore${k}${t}`, parent: `elbow${k}`, s: TF.FORE[j][i], pivot: [2, 4.5], rot: (S) => S[`elb${k}`] * D2R },
      fist: { name: `fist${k}${t}`, parent: `grip${k}`, s: TF.FIST[j][i], pivot: [5, 5] },
    };
  };
  const an = arm(false);
  const af = arm(true);
  const ham = { name: `ham${t}`, parent: 'gripN', s: TF.HAMMER[i], pivot: [14, 56], rot: (S) => S.ham * D2R };
  return [
    { name: `knot0${t}`, parent: 'nk', s: TF.KNOT[0][i], pivot: [1, 4], at: () => [-17, -22], rot: (S) => (160 + S.knot) * D2R },
    { name: `knot1${t}`, parent: 'nk', s: TF.KNOT[1][i], pivot: [1, 4], at: () => [-17, -22], rot: (S) => (190 + S.knot * 1.3) * D2R },
    { name: `tail${t}`, parent: 'hip', s: TF.TAIL[i], pivot: [30, 9], at: () => [-11, -1], rot: (S) => S.tail * D2R },
    af.up, af.fore, af.fist,
    { name: `earF${t}`, parent: 'nk', s: TF.EAR[1][i], pivot: [6, 8], at: () => [-12, -31], rot: (S) => (-14 + S.ear) * D2R },
    ...leg(true),
    { name: `body${t}`, parent: 'chest', s: TF.BODY[i], pivot: [19, 35] },
    ...leg(false),
    { name: `skirt${t}`, parent: 'chest', s: TF.SKIRT[i], pivot: [15, 1], at: () => [1, -7], rot: (S) => S.apron * D2R },
    { name: `bib${t}`, parent: 'chest', s: TF.BIB[i], pivot: [12, 1], at: () => [1, -27] },
    { name: `towelend${t}`, parent: 'chest', s: TF.TOWELEND[i], pivot: [4, 1], at: () => [9, -27], rot: (S) => S.towel * D2R },
    { name: `towel${t}`, parent: 'chest', s: TF.TOWEL[i], pivot: [15, 5], at: () => [0, -29] },
    an.up,
    // (Raised high, the hammer and the forearm holding it go behind her head.)
    { ...an.fore, name: `foreNk${t}`, when: behind }, { ...ham, name: `hamk${t}`, when: behind }, { ...an.fist, name: `fistNk${t}`, when: behind },
    { name: `earN${t}`, parent: 'nk', s: TF.EAR[0][i], pivot: [6, 8], at: () => [8, -33], rot: (S) => (10 + S.ear) * D2R },
    { name: `head${t}`, parent: 'nk', s: TF.HEAD[i], pivot: [22, 37] },
    ...(bare ? [{ name: 'face', parent: 'nk', s: (a) => tfFace(a.tfMood), pivot: [22, 37] }] : []),
    { ...an.fore, when: before }, { ...ham, when: before }, { ...an.fist, when: before },
  ];
};

// ---------- Moves ----------
// [antic, strike]. The hammer's world angle: 0 head up, 90 pointing forward, 180 head down.
function tfMove(kind, t) {
  const base = { ear: 0, knot: 0, tail: 10, apron: 0, towel: 0, armF: 100, elbF: -40 };
  if (kind === 'quake') return [
    // Hammer Quake: raised high in both fists (behind her head), up on her toes, trembling...
    { ...base, x: -2, lift: 2 + Math.sin(t * 40) * 0.4, tilt: -10, head: -14, armN: 236, elbN: -10, ham: aim(-10, -124, -10, -10), armF: -110, elbF: -20, ear: 14, knot: 20, tail: 30, apron: 6, towel: 10, ...legs(ST + 8, SS - 14, ST + 8, SS - 14) },
    // ...slammed down into the floor before her, a deep squat with it.
    { ...base, x: 6, lift: -6, tilt: 22, head: 14, armN: 420, elbN: 0, ham: aim(108, 60, 0, 22), armF: 70, elbF: -20, ear: -20, knot: -10, tail: -20, apron: -10, towel: -14, ...SQUAT },
  ];
  if (kind === 'sparks') return [
    // Sparks: the hammer tapped on the floor before her...
    { ...base, x: 1, lift: -1, tilt: 10, head: 6, armN: 60, elbN: -10, ham: aim(128, 60, -10, 10), armF: 110, elbF: -30, ear: -6, tail: 14, ...legs(ST - 8, SS + 10, ST + 4, SS + 6) },
    // ...then flicked up and back, flinging caramel high.
    { ...base, x: -1, lift: 2, tilt: -10, head: -14, armN: -30, elbN: -30, ham: aim(-20, -30, -30, -10), armF: 130, elbF: -10, ear: 14, knot: 16, tail: 30, apron: 6, towel: 8, ...legs(ST + 6, SS - 8, ST + 6, SS - 8) },
  ];
  if (kind === 'blow') return [
    // The bellows: a huge breath, leaning back, cheeks puffed, the hammer planted...
    { ...base, x: -2, lift: 2, tilt: -12, head: -16, armN: 70, elbN: -30, ham: aim(136, 70, -30, -12), armF: 130, elbF: -60, ear: 10, tail: 20, apron: 4, ...legs(ST + 6, SS - 6, ST - 4, SS + 4) },
    // ...then blown out at everyone, leaning right in, ears and bandana and towel streaming back.
    { ...base, x: 4, lift: -1, tilt: 16, head: 14, armN: 70, elbN: -30, ham: aim(132, 70, -30, 16), armF: 150, elbF: 0, ear: -26, knot: 40, tail: 40, apron: -6, towel: -20, ...legs(ST - 16, SS + 12, ST + 16, SS) },
  ];
  // A bonk: back, up behind her head and over the top, down on you.
  return [
    { ...base, x: -2, lift: 1, tilt: -10, head: -10, armN: 240, elbN: -20, ham: aim(-30, -120, -20, -10), armF: 70, elbF: -50, ear: 10, knot: 14, tail: 24, apron: 4, ...legs(ST + 6, SS - 4, ST - 4, SS + 6) },
    { ...base, x: 7, lift: -2, tilt: 18, head: 10, armN: 410, elbN: -10, ham: aim(110, 50, -10, 18), armF: 140, elbF: -20, ear: -18, knot: -10, tail: -10, apron: -8, towel: -10, ...legs(ST - 24, SS + 16, ST + 18, SS) },
  ];
}
// (Moves whose blow comes over the top end a full turn round: the rest pose goes a turn round
// too until the move is over, then both are wound back together; see world/../foliorig.js.)
const OVER = new Set(['bonk', 'quake']);

export const toffeeRig = sized(makeRig({
  w: 76, h: 100, soft: true, stride: 8, recover: 0.6,
  springs: {
    x: [200, 16], lift: [180, 14], tilt: [150, 12], head: [130, 10], armN: [200, 15], elbN: [210, 15], armF: [160, 12], elbF: [170, 12], ham: [200, 15],
    thighN: [300, 18], thighF: [300, 18], shinN: [300, 18], shinF: [300, 18], rollN: [300, 18], rollF: [300, 18],
    ear: [120, 7], knot: [55, 4], tail: [70, 5], apron: [90, 6.4], towel: [70, 5],
  },
  fast: ['x', 'armN', 'elbN', 'ham', 'armF', 'elbF', 'thighN', 'thighF', 'shinN', 'shinF'],
  kick: { tilt: -140, head: -200, ear: 240, knot: 260, tail: 260, apron: 200, towel: 220 },
  turnKick: { knot: 300, tail: 280, apron: 220, towel: 260, ear: 160 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const mo = a.mo ?? {};
    const st = mo.rig;
    a.tfU = stepPhase(m, a, 'tf2', 20 * 1.1);
    // Which move: a cast (Hammer Quake) or an act the fight starts (Sparks, the Bellows), or a
    // plain swing (a bonk). Sparks and the Bellows run on their own clocks: a wind-up, then the
    // move, over about a second.
    const now = a.now;
    const act = (at, wind, dur) => (at != null && now >= at - wind && now < at + dur ? { antic: now < at ? smooth(1 - (at - now) / wind) : 0, strike: now >= at ? (now - at < 0.07 ? smooth((now - at) / 0.07) : 1 - smooth(clamp((now - at - 0.25) / (dur - 0.25), 0, 1))) : 0 } : null);
    const sparkA = act(m.sparkAt, 0.5, 0.9);
    const blowA = act(m.blowAt, 0.9, 1.6);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    if (m.castPose === 'quake') mo.tfForce = 'quake';
    else if (!active) mo.tfForce = null;
    let kind = mo.tfForce ?? 'bonk';
    let ph = a.ph;
    if (!active && !m.castPose && (sparkA || blowA)) {
      kind = blowA ? 'blow' : 'sparks';
      ph = { ...a.ph, ...(blowA ?? sparkA), since: -1 };
    }
    a.tfKind = kind;
    a.tfPh = ph;
    const cast = m.cast && m.castPose ? clamp((now - m.cast.t0) / 0.5, 0, 1) : 0;
    a.tfCast = cast;
    const still = 1 - (a.walkW ?? 0);
    // Her idle, a 12 s act: rocking on her heels; a show-off flip of the hammer, caught; blowing on
    // the hot caramel; a tap of the hammer on the floor.
    const lu = fr(t / 12) * 12;
    const rock = Math.sin(t * 1.6);
    // (The flip stops the moment she does anything else.)
    const busy = active || sparkA || blowA || m.castPose || (a.walkW ?? 0) > 0.05;
    const flip = !busy && lu >= 3 && lu < 5.4 ? clamp((lu - 3.2) / 1.2, 0, 1) : 0;
    const cool = hold(lu, 6.6, 7, 8.4, 8.8);
    const tap = hold(lu, 10, 10.15, 10.3, 10.6);
    a.tfAct = { cool: cool * still, flip: flip * still };
    const flipArc = Math.sin(flip * Math.PI);
    const idle = {
      x: 0, lift: Math.max(0, rock) * 0.8 + flipArc * 2, tilt: rock * 1.4 - cool * 4, head: -rock * 1.4 - flipArc * 10 + cool * 2,
      armN: 52 - flipArc * 30 - cool * 32 + tap * 10, elbN: -10 - cool * 10, ham: aim(22 + cool * 48 + tap * 104, 52 - cool * 32, -10 - cool * 10) + smooth(flip) * 360,
      armF: 122 + rock * 4, elbF: -36, ...legs(ST + rock * 3, SS - rock * 4, ST - rock * 3, SS + rock * 4),
      ear: rock * 3 + flipArc * 10, knot: Math.sin(t * 1.3) * 8, tail: 8 + Math.sin(t * 1.1) * 6, apron: rock * 1, towel: Math.sin(t * 1.2) * 3,
    };
    // Walking: a chubby waddle on planted feet; short steps, a bob and a rock on each, her tail
    // flapping, the apron, towel and bandana swinging, the hammer bobbing upright in her fist.
    const u = a.tfU;
    const lead = ((st?.tf2V ?? 0) / (20 * 1.1)) * 0.05;
    const [dxN, upN] = pawStep(u + lead, 0, 20, 0.6, 4.4);
    const [dxF, upF] = pawStep(u + lead, 0.5, 20, 0.6, 4.4);
    const w2 = u * TAU * 2;
    const land = (1 + Math.cos(w2)) / 2;
    const sw = Math.sin(u * TAU);
    const wLift = 0.6 - land * 2;
    const wTilt = 4 + land * 2.4 + sw * 2;
    const [thN, shN] = legIK(dxN, LEG_DY + wLift - upN, wTilt * 0.3);
    const [thF, shF] = legIK(dxF, LEG_DY + wLift - upF, wTilt * 0.3);
    const walk = {
      x: 0, lift: wLift, tilt: wTilt, head: -wTilt * 0.4 + land * 2, armN: 52 - land * 6, elbN: -10, ham: aim(22 + land * 4, 52 - land * 6, -10, wTilt), armF: 116 + sw * 28, elbF: -34,
      thighN: thN, shinN: shN, thighF: thF, shinF: shF, rollN: upN * 3, rollF: upF * 3,
      ear: -3 + Math.sin(w2 - 1.2) * 8, knot: 20 + Math.sin(w2 - 1.6) * 12, tail: 14 + Math.sin(w2 - 0.6) * 18, apron: -sw * 6, towel: 6 + Math.sin(w2 - 1.4) * 8,
    };
    const [antic, strike] = tfMove(kind, t);
    let base = idle;
    if (cast > 0) {
      const k = cast * 0.85;
      base = Object.fromEntries(Object.keys(idle).map((key) => [key, idle[key] + ((antic[key] ?? idle[key]) - idle[key]) * k]));
      a.tfAct = {};
    }
    // (The over-the-top blows: the rest pose a turn round until the move is over.)
    if (OVER.has(kind) && (ph.since >= 0)) mo.tfWrap = 360;
    if (mo.tfWrap && !active && !cast) {
      mo.tfWrap = 0;
      if (st?.armN && st.armN.x > 200) st.armN.x -= 360;
    }
    if (OVER.has(kind) && cast > 0 && st?.armN && st.armN.x < 0) st.armN.x += 360;
    base = { ...base, armN: base.armN + (mo.tfWrap ?? 0) };
    walk.armN += mo.tfWrap ?? 0;
    a.tfMood = tfMood(a, m);
    const S = stateBlend({ ...a, ph }, base, walk, antic, strike);
    unwind(st, 'ham', S.ham);
    return S;
  },
  follow: (S, a) => ({}),
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -HIP - S.lift], rot: (S) => S.tilt * 0.3 * D2R },
    { name: 'chest', parent: 'hip', at: () => [0, -2], rot: (S) => S.tilt * 0.7 * D2R },
    { name: 'nk', parent: 'chest', at: () => [0, -30], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'elbowN', parent: 'upN', at: () => [8, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [8, 0] },
    { name: 'gripN', parent: 'foreN', at: () => [8.4, 0] },
    { name: 'gripF', parent: 'foreF', at: () => [8.4, 0] },
    { name: 'kneeN', parent: 'thighN', at: () => [0, 7.5] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, 7.5] },
    { name: 'ankleN', parent: 'shinN', at: () => [0, 8.6] },
    { name: 'ankleF', parent: 'shinF', at: () => [0, 8.6] },
    ...tfPass(false),
    ...tfPass(true),
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const M = mat('ham');
    // Caramel dripping straight down off the hammer's head, whichever way it's held.
    ctx.globalAlpha = a.alpha;
    ctx.fillStyle = '#e8963a';
    for (let i = 0; i < 3; i++) {
      const [x, y] = at2(M, -8 + i * 8, -45 + 2);
      const l = 2 + ((i * 7) % 3) + fr(a.t * 0.7 + i * 0.37) * 4;
      ctx.fillRect(x - 0.9, y, 1.8, l);
      ctx.beginPath();
      ctx.arc(x, y + l, 1.2, 0, TAU);
      ctx.fill();
    }
    const ph = a.tfPh ?? a.ph;
    const kind = a.tfKind;
    const [hx, hy] = at2(M, 0, -49);
    // The bonk and the Quake: a puff and a ring of caramel splashing where it lands.
    if ((kind === 'bonk' || kind === 'quake') && ph.strike > 0.3) {
      const big = kind === 'quake' ? 1.6 : 1;
      puff(ctx, a, hx, hy, 8 * big * ph.strike, a.alpha * ph.strike * 0.5);
      for (let k = 0; k < 6; k++) {
        const ang = Math.PI + (k / 5) * Math.PI;
        const r = (6 + (1 - ph.strike) * 16) * big;
        ctx.globalAlpha = a.alpha * ph.strike;
        ctx.fillStyle = k % 2 ? '#e8963a' : '#ffc070';
        ctx.beginPath();
        ctx.ellipse(hx + Math.cos(ang) * r, hy + Math.sin(ang) * r * 0.5, 2, 1.6, 0, 0, TAU);
        ctx.fill();
      }
    }
    // Sparks: caramel flung up off the hammer as she flicks it.
    if (kind === 'sparks' && ph.strike > 0.2) for (let k = 0; k < 5; k++) {
      const u = 1 - ph.strike;
      ctx.globalAlpha = a.alpha * ph.strike;
      ctx.fillStyle = k % 2 ? '#e8963a' : '#ffc070';
      ctx.beginPath();
      ctx.ellipse(hx + (k - 2) * 6 * (0.4 + u), hy - 4 - u * 26 - (k % 3) * 4, 1.8, 2.4, 0, 0, TAU);
      ctx.fill();
      sparkle(ctx, a, hx + (k - 2) * 8 * u, hy - 10 - u * 20, 1.8 * ph.strike, a.alpha * ph.strike, '#fff2b0');
    }
    // The bellows: streaks of hot air blown out ahead of her.
    if (kind === 'blow' && ph.strike > 0.1) {
      const [mx, my] = at2(mat('nk'), 20, -8);
      ctx.strokeStyle = '#fff4e0';
      ctx.lineWidth = 1.4;
      for (let k = 0; k < 4; k++) {
        const u = fr(a.now * 2.4 + k / 4);
        ctx.globalAlpha = a.alpha * ph.strike * (1 - u) * 0.8;
        ctx.beginPath();
        ctx.moveTo(mx + 4 + u * 40, my - 6 + k * 4);
        ctx.quadraticCurveTo(mx + 14 + u * 40, my - 9 + k * 4, mx + 24 + u * 40, my - 6 + k * 4);
        ctx.stroke();
      }
    }
    // Cooling the caramel: little puffs of her breath on the hammer.
    if ((a.tfAct?.cool ?? 0) > 0.5) {
      const [mx, my] = at2(mat('nk'), 18, -6);
      for (let k = 0; k < 2; k++) {
        const u = fr(a.now * 1.6 + k / 2);
        puff(ctx, a, mx + 4 + u * 10, my - u * 4, 1.6 + u * 2, a.alpha * (1 - u) * 0.6);
      }
    }
    ctx.globalAlpha = a.alpha;
  },
}), 1.1);
function tfMood(a, m) {
  if (m.hp <= 0) return 'dead';
  const ph = a.tfPh ?? a.ph;
  if (a.tfKind === 'blow') return ph.strike > 0.2 ? 'blow' : 'puff';
  if (ph.strike > 0.25) return 'shout';
  if (a.ph.atk || ph.antic > 0.3 || a.tfCast > 0.5) return 'angry';
  if (a.mood === 'hurt' || a.face === 'hurt') return 'hurt';
  const act = a.tfAct ?? {};
  if (act.cool > 0.4) return 'blow';
  if (act.flip > 0.1 && act.flip < 0.95) return 'happy';
  const t = a.t + (a.uidOff ?? 0);
  if (t % 4.1 < 0.13) return 'blink';
  return 'idle';
}

// ---------- The still (portraits) ----------
export function toffeeStill(pose, f, mood) {
  const fm = TF_FACES[mood] ? mood : MOODS.has(mood) ? mood : 'idle';
  const hip = [0, -HIP];
  const ch = [0, -HIP - 2];
  const nk = [0, ch[1] - 30];
  const legAt = (far) => {
    const x = far ? -6 : 6;
    const tr = ST * D2R;
    const kx = x - Math.sin(tr) * L1;
    const ky = hip[1] + Math.cos(tr) * L1;
    const sr = (ST + SS) * D2R;
    return [...put(tfBoot(far)(), [6, 2], kx - Math.sin(sr) * L2, ky + Math.cos(sr) * L2, 0), ...put(tfShin(far)(), [6, 1], kx, ky, ST + SS), ...put(tfThigh(far)(), [6, 2], x, hip[1], ST)];
  };
  const arm = (far, armA, elbA) => {
    const [sx, sy] = far ? [-10, ch[1] - 24] : [11, ch[1] - 24];
    const ex = sx + Math.cos(armA * D2R) * 8;
    const ey = sy + Math.sin(armA * D2R) * 8;
    const fa = armA + elbA;
    const gx = ex + Math.cos(fa * D2R) * 8.4;
    const gy = ey + Math.sin(fa * D2R) * 8.4;
    return { up: put(tfUpper(far)(), [2, 5], sx, sy, armA), fore: put(tfFore(far)(), [2, 4.5], ex, ey, fa), fist: put(tfFist(far)(), [5, 5], gx, gy, 0), grip: [gx, gy] };
  };
  const an = arm(false, 52, -10);
  const af = arm(true, 104, -50);
  return { w: 76, h: 100, res: 2, shapes: shift([
    ...put(tfKnot(0)(), [1, 4], nk[0] - 17, nk[1] - 22, 160), ...put(tfKnot(1)(), [1, 4], nk[0] - 17, nk[1] - 22, 190),
    ...put(tfTail(), [30, 9], -11, hip[1] - 1, 8),
    ...af.up, ...af.fore, ...af.fist,
    ...put(tfEar(true)(), [6, 8], nk[0] - 12, nk[1] - 31, -14),
    ...legAt(true), ...put(tfBody(), [19, 35], ch[0], ch[1]), ...legAt(false),
    ...put(tfSkirt(), [15, 1], 1, ch[1] - 7), ...put(tfBib(), [12, 1], 1, ch[1] - 27), ...put(tfTowelEnd(), [4, 1], 9, ch[1] - 27), ...put(tfTowel(), [15, 5], 0, ch[1] - 29),
    ...an.up,
    ...put(tfEar(false)(), [6, 8], nk[0] + 8, nk[1] - 33, 10),
    ...put(tfHead(), [22, 37], nk[0], nk[1]), ...put((TF_FACES[fm] ?? TF_FACES.idle)(), [22, 37], nk[0], nk[1]),
    ...an.fore, ...put(tfHammer(), [14, 56], an.grip[0], an.grip[1], 22), ...an.fist,
  ], 38, 99) };
}
