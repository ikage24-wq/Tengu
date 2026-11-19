// Captain Gale (redrawn 2026-11-19, the player's pick "C, the Storm Admiral"): the sky pirates'
// captain on the Sky Whale's back, a red panda. Rusty fur, white cheek tufts, brow spots and muzzle,
// white-rimmed ears sticking out under her hat that perk and flatten, big amber eyes, a grin with
// one fang, a great ringed tail. A bicorne worn side to side with a gold cockade and two blue wind ribbons streaming
// off it, a navy admiral's coat with gold epaulettes over a white waistcoat, a big brass compass at
// her throat, a sail-cloth cape with rope edging billowing behind her, tall black boots. Her
// cutlass (a pale blue wind edge on its blade) in her near paw, a brass spyglass in the far one.
//
// How she moves:
//   idle    a 10 s act: checking her compass, tapping it; a twirl of the cutlass; a hearty laugh.
//   walk    a captain's swagger on planted feet, chin up, the cutlass over her shoulder, cape,
//           ribbons and tail streaming after.
//   fight   (world/skywhale.js) a plain swing is an overhead cutlass slash; Broadside! (a cast
//           bar, m.castPose 'broadside', firing at m.fireAt): the cutlass raised high, then
//           chopped down, FIRE!, cannon smoke; Hard to Port! (m.portAt): braced against the gale,
//           cape and ribbons and tail thrown back, the cutlass pointing the way; a boarding party
//           (m.boardAt): the cutlass thrust up, the far paw waving them in.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, window1, stepPhase, pawStep, put, shift, MOODS, faceShapes, sparkle, puff } from './rigkit.js';

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

const RUST = ramp('#c8582a', { step: 9, turn: 10 });
const DARK = ramp('#3a2420', { step: 7, turn: 8 });
const CREAM = '#fff4e4';
const NAVY = ramp('#3a3a6a', { step: 9, turn: 10 });
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
const BRASS = ramp('#e8b04a', { step: 10, turn: 8 });
const SAIL = ramp('#f4ecd8', { step: 7, turn: 8 });
const BOOT = ramp('#2a2430', { step: 7, turn: 8 });
const gl = pairOf('gl2');

// ---------- Parts ----------
// (Rig space: the hip 22.6 above the floor, the chest joint 2 above it, the neck 24 above that, the
// head's middle 16 above the neck. Shoulders at (6, -21) and (-6, -21) on the chest.)
const HX = 22;
const HY = 22;
// Her head: a round red panda, white cheek tufts and brow spots, a white muzzle under and between
// her eyes with her nose on it (the ears, eyes and mouth are their own). Box 44 x 42; the neck (22, 38).
const headP = () => [
  E(HX, HY, 15, 13.6, RUST.base), crescent(HX, HY, 15, 13.6, RUST.sh, { k: 0.14, a0: 110, a1: 210 }), F(E(HX + 3, HY - 8, 5, 1.8, RUST.hi)),
  F(blob([[HX - 14.6, HY + 1], [HX - 11, HY + 0.4], [HX - 8.6, HY + 5], [HX - 10.6, HY + 10], [HX - 13.6, HY + 7]], CREAM, 2)),
  F(blob([[HX + 15, HY + 0.6], [HX + 11.4, HY + 1], [HX + 9.6, HY + 6], [HX + 11.4, HY + 10.4], [HX + 14.4, HY + 6.6]], CREAM, 2)),
  F(E(HX + 3.4, HY + 7.8, 6.6, 4.8, CREAM)), F(E(HX + 3.4, HY + 10.4, 4.6, 1.6, '#f4e4d0')),
  F(E(HX - 3.4, HY - 6.6, 2.2, 1.2, CREAM)), F(E(HX + 7.6, HY - 7, 2.6, 1.3, CREAM)),
  F(E(HX + 3.6, HY + 4.6, 2.1, 1.5, INK)), F(E(HX + 3.1, HY + 4.1, 0.7, 0.45, '#8a7a8a')),
];
// An ear (box 12 x 16; it sits on its root (6, 14), sunk in her head).
const earP = (far) => () => [T(smoothPts([[1, 14], [4.4, 1.6], [11, 13], [6, 16]], 1), far ? RUST.sh : RUST.base), F(T(smoothPts([[2.6, 12.6], [4.8, 4], [9.4, 12]], 1), CREAM)), F(T(smoothPts([[4, 12], [5.2, 6.6], [8, 11.6]], 1), '#5a2a1a'))];
// The bicorne, worn side to side (box 40 x 17, sat on its brim's middle (20, 13)): a gold edge, the
// gold cockade with a red heart on its near side. (Narrow enough that her ears stick out past it.)
const hatP = () => [
  blob([[2, 12], [10, 4], [20, 0.6], [30, 4], [38, 12], [20, 8.6]], '#1e1e3a', 2), F(blob([[7, 8.4], [13, 4], [20, 2.4], [17, 5.6]], '#2e2e50', 1)),
  ...line([[2, 12], [11, 9.4], [20, 8.6], [29, 9.4], [38, 12]], 1.1, GOLD.base),
  E(26, 5.6, 2.8, 2.8, GOLD.base), F(E(26, 5.6, 1.5, 1.5, '#c8283a')), ...[0, 1, 2, 3, 4, 5].map((k) => F(E(26 + Math.cos(k * 1.05) * 3, 5.6 + Math.sin(k * 1.05) * 3, 0.55, 0.55, GOLD.hi))),
];
// A wind ribbon off the hat's back corner (box 18 x 6 from its root (16, 3)), streaming back.
const ribbonP = (k) => () => [taper([[16, 3], [9, 2.4 + k], [1, 3 - k]], 2.4, 1.4, k ? '#a8d8ff' : '#7ab8ff'), T([[1, 1.4 - k], [3, 3 - k], [0.4, 4.6 - k]], k ? '#a8d8ff' : '#7ab8ff')];
// Her coat: navy, nipped in at the waist and flaring over her hips, gold trim down its front and
// along its hem, a white waistcoat, gold buttons, the far epaulette, the brass compass at her
// throat. Box 28 x 30; the chest joint (14, 26).
const bodyP = () => [
  blob([[5.4, 2], [22.6, 2], [24.4, 10], [23, 18], [25.6, 27], [24.4, 30], [3.6, 30], [2.4, 27], [5, 18], [3.6, 10]], NAVY.base, 2),
  T([[10.4, 2], [17.6, 2], [18.4, 22], [14, 26], [9.6, 22]], '#ffffff'), F(T([[10.4, 2], [12, 2], [10.2, 20]], '#f4f0f8')), ...[13, 17, 21].map((y) => E(14, y, 1, 1, GOLD.base)),
  F(taper([[5, 5], [4.6, 28]], 1.6, 2, NAVY.sh)), F(taper([[21.6, 6], [22.4, 22]], 1, 0.8, NAVY.hi)),
  ...line([[9.4, 4], [9, 22], [12.6, 28.6]], 0.8, GOLD.sh), ...line([[18.6, 4], [19, 22], [15.4, 28.6]], 0.8, GOLD.base), F(T([[12.4, 30], [14, 25.6], [15.6, 30]], '#2a1a2e')),
  ...line([[3.8, 28.8], [12.4, 29.2]], 1, GOLD.base), ...line([[15.6, 29.2], [24.2, 28.8]], 1, GOLD.base),
  blob([[1, 2.6], [9, 2], [9.4, 5], [1, 5.6]], GOLD.base, 1), ...[2, 4, 6, 8].map((x) => F(taper([[x, 5.4], [x, 8]], 0.7, 0.6, GOLD.sh))),
  E(14, 6.4, 4.4, 4.4, BRASS.base), F(E(14, 6.4, 3.2, 3.2, '#fff8ec')), F(T([[14, 3.8], [15, 6.4], [14, 9], [13, 6.4]], '#c8283a')), F(E(14, 6.4, 0.6, 0.6, BRASS.sh)),
];
// The near epaulette, over the top of her near arm (box 12 x 8 about (6, 3)).
const epP = () => [blob([[1, 1.4], [11, 1], [11.4, 4], [1, 4.4]], GOLD.base, 1), ...[2.4, 4.6, 6.8, 9].map((x) => F(taper([[x, 4], [x, 7]], 0.8, 0.6, GOLD.sh))), F(R(2, 1.6, 8, 0.8, GOLD.hi))];
// (The rope is the cape's own smoothed edge: the cloth is the same shape drawn again a little inside it.)
const CAPE_PTS = [[24, 2], [10, 4], [1, 17], [3, 36], [12, 32.6], [19.6, 36.4], [25, 24]];
const inset = (pts, d) => {
  const cx = pts.reduce((v, p) => v + p[0], 0) / pts.length;
  const cy = pts.reduce((v, p) => v + p[1], 0) / pts.length;
  return pts.map(([x, y]) => {
    const l = Math.hypot(x - cx, y - cy) || 1;
    return [x - ((x - cx) / l) * d, y - ((y - cy) / l) * d];
  });
};
const capeP = () => [
  blob(CAPE_PTS, '#a87a4a', 2), F(blob(inset(CAPE_PTS, 1.4), SAIL.base, 2)), F(taper([[10, 8], [5, 28]], 1.6, 1.2, SAIL.sh)), F(taper([[19, 6], [18, 30]], 1.2, 1, '#e4dcc4')),
  ...[[3.2, 25], [7.4, 32.6], [16, 33.6]].map(([x, y]) => F(E(x, y, 0.8, 0.8, '#d8c8a8'))),
];
// A coat tail at her back (box 8 x 18 from (4, 1)), gold-edged like the hem.
const FLAP_PTS = [[1, 1], [7, 1], [7.4, 10], [5.4, 17], [2.4, 17], [1, 10]];
const flapP = () => [blob(FLAP_PTS, GOLD.sh, 2), F(blob(inset(FLAP_PTS, 1), NAVY.base, 2)), F(taper([[2.4, 3], [2.4, 13]], 1, 0.8, NAVY.sh))];
// The sail-cloth cape (box 28 x 38, hung at (24, 2)): billowing back from her shoulders, a rope
// along its edge.
// A piece of her big ringed tail (box len+12 x 14 from its root (6, 7)): deep rust with pale ochre
// rings, the tip pale.
const TAILL = [13, 12, 10];
// (Two pale rings on each piece, so the whole tail has six, and a rounded rust tip.)
const TAIL_RING = '#f2b878';
const tailP = (i) => () => {
  const len = TAILL[i];
  const w = [[9.4, 10.4], [10.4, 9.8], [9.8, 8]][i];
  const wAt = (u) => w[0] + (w[1] - w[0]) * u;
  const band = (u0, u1) => F(taper([[6 + len * u0, 7], [6 + len * u1, 7]], wAt(u0) - 0.4, wAt(u1) - 0.4, TAIL_RING));
  const out = [E(6, 7, w[0] / 2, w[0] / 2, RUST.base), taper([[6, 7], [6 + len, 7]], w[0], w[1], RUST.base), band(0.12, 0.34), band(0.6, 0.82)];
  if (i === 2) out.push(E(6 + len, 7, w[1] / 2, w[1] / 2, RUST.base), F(E(6 + len + 0.6, 7, w[1] * 0.34, w[1] * 0.4, RUST.sh)));
  return out;
};
// An arm in a navy sleeve: the upper (box 12 x 8 from (2, 4); the elbow 8 on), the forearm and its
// gold cuff (box 12 x 8 from (2, 4); the grip 7.5 on), a dark red panda paw (box 9 x 9 about (4.5, 4.5)).
const upperP = (far) => () => [taper([[2, 4], [10, 4]], 5.6, 5, far ? NAVY.sh : NAVY.base), F(E(4, 2.6, 1.8, 0.8, far ? NAVY.base : NAVY.hi))];
const foreP = (far) => () => [taper([[2, 4], [9, 4]], 5, 4.6, far ? NAVY.sh : NAVY.base), R(6.6, 1.2, 2.6, 5.6, far ? GOLD.sh : GOLD.base)];
const pawP = (far) => () => [E(4.5, 4.5, 3.3, 3.1, far ? '#2a1a18' : DARK.base), F(E(3.6, 3.4, 1, 0.7, DARK.hi))];
// A leg: the dark furred thigh (box 9 x 13.4 from the hip (4.5, 1.5); the knee 9 down), the tall
// black boot with a brown turned-down cuff (box 9 x 13 from the knee (4, 2); the ankle 9.4 down),
// its foot (box 13 x 8 from the ankle (4, 1.4); the sole 4.4 under it). (Both end round at the
// knee, the same width, so a bend is one smooth curve.)
const thighP = (far) => () => [taper([[4.5, 1.5], [4.5, 10.5]], 6.4, 5.8, far ? '#2a1a18' : DARK.base), E(4.5, 10.5, 2.9, 2.9, far ? '#2a1a18' : DARK.base), F(taper([[2.8, 3], [3, 9]], 0.8, 0.6, DARK.hi))];
const shinP = (far) => () => [E(4, 2, 2.9, 2.9, far ? BOOT.sh : BOOT.base), taper([[4, 2], [4, 11.6]], 5.8, 5.4, far ? BOOT.sh : BOOT.base), R(0.8, 2.4, 6.4, 2.4, far ? '#5a3a2a' : '#7a4a2a'), F(taper([[2.4, 5.6], [2.6, 10.6]], 0.8, 0.6, BOOT.hi))];
const footP = (far) => () => [blob([[0.6, 0.4], [7, 0.4], [10.6, 2.4], [12.4, 4.6], [12, 5.8], [0.6, 5.8]], far ? BOOT.sh : BOOT.base, 1), F(R(0.6, 5, 11.6, 0.8, '#1a141a')), F(E(9.6, 2.8, 1.4, 0.6, BOOT.hi))];
// The cutlass (box 40 x 12, gripped at (7, 6)): a gold knuckle-guard, a curved steel blade with a
// pale blue wind edge, reaching forward.
const cutlassP = () => [
  blob([[9, 4.6], [21, 3.4], [33, 4.6], [38.6, 8], [31, 7.6], [20, 7.8], [9, 7.6]], '#e4e8f4', 1), F(taper([[11, 7.2], [31, 7.2], [37, 8]], 0.9, 0.6, '#a8d8ff')), F(taper([[11, 5], [30, 4.6]], 0.5, 0.4, '#ffffff')),
  taper([[2, 6], [8, 6]], 2.6, 2.4, '#5a3a2a'), E(1.6, 6, 1.7, 1.7, GOLD.base), blob([[7.6, 1.6], [10, 2], [10.4, 10.4], [7.6, 10.8]], GOLD.base, 1), ...line(arcP(5, 7.4, 4, 3.4, 20, 160, 7), 0.9, GOLD.sh),
];
// The spyglass (box 18 x 8, gripped at (3, 4)), along its length.
const spyP = () => [taper([[1, 4], [9, 4]], 3, 3.4, BRASS.base), taper([[8.4, 4], [17, 4]], 3.8, 4.4, BRASS.sh), E(17, 4, 1.2, 2.2, '#5a8ac8'), F(E(16.8, 3.2, 0.4, 0.6, '#ffffff')), ...[4, 8.4].map((x) => F(taper([[x, 2.4], [x, 5.6]], 0.6, 0.6, '#a87a3a')))];
const GL = {
  HEAD: gl('head', 44, 42, headP, 2), EAR: [false, true].map((f) => gl(`ear${f ? 1 : 0}`, 12, 16, earP(f), 2)), HAT: gl('hat', 40, 17, hatP, 2), RIBBON: [0, 1].map((k) => gl(`ribbon${k}`, 18, 6, ribbonP(k), 2)),
  BODY: gl('body', 28, 30, bodyP, 9, 9), EP: gl('ep', 12, 8, epP, 2), FLAP: gl('flap', 8, 18, flapP, 2), CAPE: gl('cape', 28, 38, capeP, 2), TAIL: [0, 1, 2].map((i) => gl(`tail${i}`, TAILL[i] + 12, 14, tailP(i), 2)),
  UP: [false, true].map((f) => gl(`up${f ? 1 : 0}`, 12, 8, upperP(f), 2)), FORE: [false, true].map((f) => gl(`fore${f ? 1 : 0}`, 12, 8, foreP(f), 2)), PAW: [false, true].map((f) => gl(`paw${f ? 1 : 0}`, 9, 9, pawP(f), 2)),
  THIGH: [false, true].map((f) => gl(`thigh${f ? 1 : 0}`, 9, 13.4, thighP(f), 2)), SHIN: [false, true].map((f) => gl(`shin${f ? 1 : 0}`, 9, 13, shinP(f), 2)), FOOT: [false, true].map((f) => gl(`foot${f ? 1 : 0}`, 13, 8, footP(f), 2)),
  CUTLASS: gl('cutlass', 40, 12, cutlassP, 2), SPY: gl('spy', 18, 8, spyP, 2),
};

// ---------- Faces (on the head; box 44 x 42 as it) ----------
const EN = [HX + 7, HY - 1.6, 3.2];
const EF = [HX - 3.6, HY - 1.4, 2.6];
const LIP = '#5a2020';
const eye = ([x, y, r], { lid = 0, small = false, look = 0 } = {}) => [
  F(E(x, y, r, r * 1.1, INK)), F(E(x, y + r * 0.3 + look, r * 0.8, r * 0.7, '#e8902a')),
  ...(small ? [F(E(x, y + look, r * 0.3, r * 0.34, '#ffffff'))] : [F(E(x - r * 0.3, y - r * 0.4, r * 0.38, r * 0.4, '#ffffff')), F(E(x + r * 0.3, y + r * 0.45, r * 0.16, r * 0.16, '#ffffff'))]),
  ...(lid > 0 ? [F(T([...arcP(x, y, r * 1.12, r * 1.2, 180, 360, 8), ...arcP(x, y - r * 1.1 * (1 - lid * 2), r * 1.12, r * 0.35, 0, 180, 8)], RUST.base)), ...line(arcP(x, y - r * 1.1 * (1 - lid * 2), r * 1.05, r * 0.32, 15, 165, 7), 0.6)] : []),
];
const shut = ([x, y, r], up = false) => line(arcP(x, y + 0.6, r, r * 0.6, up ? 200 : 20, up ? 340 : 160, 7), 0.8);
// (Her brows are her white brow spots: drawn over them, a dark line that carries the mood.)
const brows = (k = 0, v = 0) => [F(taper([[EN[0] - 3, EN[1] - 4.6 - k + v], [EN[0] + 3, EN[1] - 5.4 - k - v * 0.5]], 1, 0.6, '#5a2a1a')), F(taper([[EF[0] - 2.4, EF[1] - 4.6 - k - v * 0.5], [EF[0] + 2.2, EF[1] - 4.4 - k + v]], 0.9, 0.5, '#5a2a1a'))];
const MX = HX + 3.6;
const MY = HY + 7.4;
const grin = () => [...line(arcP(MX, MY, 3, 1.6, 20, 160, 7), 0.8, LIP), F(T([[MX - 2, MY + 0.8], [MX - 1, MY + 2.8], [MX, MY + 1]], '#ffffff'))];
const openGrin = (k = 1) => [F(T(arcP(MX, MY - 0.4, 3.2 * k, 3 * k, 0, 180, 9), LIP)), F(E(MX, MY + 1.2 * k, 1.6 * k, 0.8 * k, '#ff9ab0')), F(T([[MX - 2.4 * k, MY - 0.4], [MX - 1.4 * k, MY + 1.4 * k], [MX - 0.6 * k, MY - 0.4]], '#ffffff'))];
const shoutO = () => [F(E(MX, MY + 0.8, 2.4, 2.6, LIP)), F(E(MX, MY + 2, 1.4, 0.8, '#ff9ab0')), F(T([[MX - 2, MY - 1], [MX - 1.2, MY + 0.8], [MX - 0.4, MY - 1]], '#ffffff'))];
const hmm = () => line([[MX - 2.4, MY + 0.6], [MX + 2.4, MY - 0.2]], 0.8, LIP);
const blush = (k = 1) => [F(E(EN[0] + 1.6, EN[1] + 5, 2 * k, 1 * k, '#ff8aa0')), F(E(EF[0] - 1.4, EF[1] + 4.8, 1.7 * k, 0.9 * k, '#ff8aa0'))];
const GL_FACES = {
  // Cocky: bright eyes, a grin with one fang showing.
  idle: () => [...eye(EN), ...eye(EF), ...brows(0, 0), ...grin(), ...blush()],
  blink: () => [...shut(EN), ...shut(EF), ...brows(0, 0), ...grin(), ...blush()],
  // Checking her compass: one eye narrowed, eyes down, a thinking mouth.
  hmm: () => [...eye(EN, { lid: 0.4, look: 0.6 }), ...eye(EF, { lid: 0.2, look: 0.6 }), ...brows(0.6, 1.4), ...hmm(), ...blush()],
  laugh: () => [...shut(EN, true), ...shut(EF, true), ...brows(1.2, 0), ...openGrin(1.1), ...blush(1.2)],
  happy: () => [...shut(EN, true), ...shut(EF, true), ...brows(1, 0), ...openGrin(0.9), ...blush(1.1)],
  // Fierce: lids low, brows down, the fang bared.
  angry: () => [...eye(EN, { lid: 0.32, small: true }), ...eye(EF, { lid: 0.32, small: true }), ...brows(-0.6, 2), ...grin(), ...blush(0.8)],
  shout: () => [...eye(EN, { small: true }), ...eye(EF, { small: true }), ...brows(1.6, 0), ...shoutO(), ...blush()],
  hurt: () => [...line([[EN[0] - 2.4, EN[1] - 1.8], [EN[0] + 1.4, EN[1]], [EN[0] - 2.4, EN[1] + 1.8]], 0.8), ...line([[EF[0] + 2, EF[1] - 1.6], [EF[0] - 1.2, EF[1]], [EF[0] + 2, EF[1] + 1.6]], 0.8), ...brows(1, -1.2), ...line(arcP(MX, MY + 1.8, 2, 1, 200, 340, 6), 0.8, LIP), F(E(EN[0] + 3, EN[1] + 4, 0.9, 1.4, '#8ad8ff'))],
  dead: () => [...line([[EN[0] - 2, EN[1] - 2], [EN[0] + 2, EN[1] + 2]], 0.8), ...line([[EN[0] + 2, EN[1] - 2], [EN[0] - 2, EN[1] + 2]], 0.8), ...line([[EF[0] - 1.6, EF[1] - 1.6], [EF[0] + 1.6, EF[1] + 1.6]], 0.7), ...line([[EF[0] + 1.6, EF[1] - 1.6], [EF[0] - 1.6, EF[1] + 1.6]], 0.7), ...line(arcP(MX, MY + 1.8, 2, 1, 200, 340, 6), 0.8, LIP)],
};
const FACE_FB = { eyes: [[EN[0], EN[1], 2.8, 3, 1], [EF[0], EF[1], 2.2, 2.4, -1]], mouth: [MX, MY, 1], blush: [[EN[0] + 1.6, EN[1] + 5, 1.4], [EF[0] - 1.4, EF[1] + 4.8, 1.2]], iris: '#e8902a', lid: 0, lashes: 0 };
const glFace = (mood) => faceSprite(`gl2|face|${mood}`, 44, 42, () => (GL_FACES[mood] ?? (() => faceShapes(mood, FACE_FB)))());

// ---------- Skeleton ----------
const HIP = 22.6;
const L1 = 9;
const L2 = 9.4;
const SOLE = 4.4;
const UA = 8;
const FA = 7.5;
const SHN = [6, -21];
const SHF = [-6, -21];
const NECK = 24;
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
// Would the cutlass overlap her head? (Chest space; samples along the blade from the grip.)
const BLADE_PTS = Array.from({ length: 8 }, (_, k) => [2 + k * 4, 0]);
const behind = (a, S) => {
  const ar = S.armN * D2R;
  const er = (S.armN + S.elbN) * D2R;
  const wx = SHN[0] + UA * Math.cos(ar) + FA * Math.cos(er);
  const wy = SHN[1] + UA * Math.sin(ar) + FA * Math.sin(er);
  const pr = (S.armN + S.elbN + S.blade) * D2R;
  const hr = (S.head - S.tilt * 0.5) * D2R;
  const hx = 1 + 16 * Math.sin(hr);
  const hy = -NECK - 16 * Math.cos(hr);
  return BLADE_PTS.some(([px, py]) => {
    const x = wx + px * Math.cos(pr) - py * Math.sin(pr);
    const y = wy + px * Math.sin(pr) + py * Math.cos(pr);
    return ((x - hx) / 16) ** 2 + ((y - hy) / 14.6) ** 2 < 1;
  });
};
const before = (a, S) => !behind(a, S);
// (Her far paw comes round in front of her to tap her compass.)
const farFront = (a) => (a.glTap ?? 0) > 0.5;
const farBack = (a) => !farFront(a);

const glPass = (bare) => {
  const i = bare ? 1 : 0;
  const t = bare ? 'b' : '';
  const leg = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `foot${k}${t}`, parent: `ankle${k}`, s: GL.FOOT[j][i], pivot: [4, 1.4], rot: (S) => -(S.tilt * 0.3 + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
      { name: `shin${k}${t}`, parent: `knee${k}`, s: GL.SHIN[j][i], pivot: [4, 2], rot: (S) => S[`shin${k}`] * D2R },
      { name: `thigh${k}${t}`, parent: 'hip', s: GL.THIGH[j][i], pivot: [4.5, 1.5], at: () => (far ? [-4, 0] : [4.4, 0]), rot: (S) => S[`thigh${k}`] * D2R },
    ];
  };
  const arm = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return {
      up: { name: `up${k}${t}`, parent: 'chest', s: GL.UP[j][i], pivot: [2, 4], at: () => (far ? SHF : SHN), rot: (S) => S[`arm${k}`] * D2R },
      fore: { name: `fore${k}${t}`, parent: `elbow${k}`, s: GL.FORE[j][i], pivot: [2, 4], rot: (S) => S[`elb${k}`] * D2R },
      paw: { name: `paw${k}${t}`, parent: `grip${k}`, s: GL.PAW[j][i], pivot: [4.5, 4.5] },
    };
  };
  const an = arm(false);
  const af = arm(true);
  const blade = { name: `blade${t}`, parent: 'gripN', s: GL.CUTLASS[i], pivot: [7, 6], rot: (S) => S.blade * D2R };
  const spy = { name: `spy${t}`, parent: 'gripF', s: GL.SPY[i], pivot: [3, 4], rot: (S) => S.spy * D2R };
  return [
    { name: `cape${t}`, parent: 'chest', s: GL.CAPE[i], pivot: [24, 2], at: () => [-1, -23], rot: (S) => S.cape * D2R },
    ...[0, 1, 2].map((n) => ({ name: `tail${n}${t}`, parent: n ? `tail${n - 1}` : 'hip', s: GL.TAIL[n][i], pivot: [6, 7], at: () => (n ? [TAILL[n - 1], 0] : [-7, -3]), rot: (S) => S[`tail${n}`] * D2R })),
    // The far arm and the spyglass, behind her (unless she's tapping her compass: below).
    { ...af.up, when: farBack }, { ...af.fore, when: farBack }, { ...spy, when: farBack }, { ...af.paw, when: farBack },
    { name: `flap${t}`, parent: 'chest', s: GL.FLAP[i], pivot: [4, 1], at: () => [-8, 0], rot: (S) => S.flap * D2R },
    ...leg(true), ...leg(false),
    { name: `body${t}`, parent: 'chest', s: GL.BODY[i], pivot: [14, 26] },
    { ...af.up, name: `upFf${t}`, when: farFront }, { ...af.fore, name: `foreFf${t}`, when: farFront }, { ...spy, name: `spyf${t}`, when: farFront }, { ...af.paw, name: `pawFf${t}`, when: farFront },
    an.up, { name: `ep${t}`, parent: 'chest', s: GL.EP[i], pivot: [6, 3], at: () => [SHN[0] + 1, SHN[1] - 1.4] },
    { ...an.fore, name: `foreNk${t}`, when: behind }, { ...blade, name: `bladek${t}`, when: behind }, { ...an.paw, name: `pawNk${t}`, when: behind },
    { name: `earF${t}`, parent: 'nk', s: GL.EAR[1][i], pivot: [6, 14], at: () => [-11.6, -23], rot: (S) => (S.earF - 56) * D2R },
    { name: `earN${t}`, parent: 'nk', s: GL.EAR[0][i], pivot: [6, 14], at: () => [12.6, -23.4], rot: (S) => (S.earN + 54) * D2R },
    ...[0, 1].map((k) => ({ name: `ribbon${k}${t}`, parent: 'hat', s: GL.RIBBON[k][i], pivot: [16, 3], at: () => [-16, -2 + k], rot: (S) => (S[`rib${k}`] + (k ? 14 : -6)) * D2R })),
    { name: `head${t}`, parent: 'nk', s: GL.HEAD[i], pivot: [22, 38] },
    ...(bare ? [{ name: 'face', parent: 'nk', s: (a) => glFace(a.glMood ?? 'idle'), pivot: [22, 38] }] : []),
    { name: `hat${t}`, parent: 'nk', s: GL.HAT[i], pivot: [20, 13], at: () => [1, -27.4], rot: (S) => S.hat * D2R },
    { ...an.fore, when: before }, { ...blade, when: before }, { ...an.paw, when: before },
  ];
};

// ---------- Moves ----------
// The cutlass's world angle: 0 pointing forward, -90 up, 90 down; the spyglass's the same.
function glMove(kind, cur, t) {
  const mk = (o) => ({ ...cur, ...o });
  if (kind === 'broadside') return [
    // Broadside! (through the cast): the cutlass raised high, the spyglass up behind her...
    mk({ x: -1, lift: 1.4, tilt: -6, head: -8, armN: -60, elbN: -20, blade: aim(-80, -60, -20, -6), armF: 220, elbF: 20, spy: aim(-60, 220, 20, -6), earN: -8, earF: 8, ...legsAt(1.4, 3, -3, -1.8) }),
    // ...FIRE! chopped down and forward, a stamp.
    mk({ x: 5, lift: -3, tilt: 14, head: 8, armN: 30, elbN: 0, blade: aim(32, 30, 0, 14), armF: 160, elbF: 0, spy: aim(140, 160, 0, 14), earN: 10, earF: -10, ...legsAt(-3, 7, -6, 4.2) }),
  ];
  if (kind === 'board') return [
    mk({ x: 0, lift: -1.4, tilt: 4, head: 4, armN: 60, elbN: -40, blade: aim(40, 60, -40, 4), armF: 150, elbF: -20, spy: aim(120, 150, -20, 4), ...legsAt(-1.4, 2, -2, 1.2) }),
    // Boarders! The cutlass thrust up high, the far paw waving them in.
    mk({ x: 0, lift: 2, tilt: -8, head: -12, armN: -70, elbN: -10, blade: aim(-86, -70, -10, -8), armF: 230 + Math.sin(t * 14) * 14, elbF: -20, spy: aim(-40, 230, -20, -8), earN: -10, earF: 10, ...legsAt(2, 3, -3, -2.4) }),
  ];
  // A cutlass slash: back and up over her shoulder, then over the top and down at you.
  return [
    mk({ x: -3, lift: 1, tilt: -10, head: -4, armN: 230, elbN: -30, blade: aim(-110, -130, -30, -10), armF: 140, elbF: -20, spy: aim(110, 140, -20, -10), ...legsAt(1, 4, -4, -3) }),
    mk({ x: 7, lift: -2.4, tilt: 14, head: 8, armN: 400, elbN: -10, blade: aim(56, 40, -10, 14), armF: 170, elbF: 0, spy: aim(170, 170, 0, 14), earN: 8, earF: -8, ...legsAt(-2.4, 10, -7, 4.2) }),
  ];
}

export const galeRig = sized(makeRig({
  w: 70, h: 96, soft: true, stride: 8, recover: 0.55,
  springs: {
    x: [220, 16], lift: [200, 14], tilt: [160, 12], head: [130, 10], armN: [230, 16], elbN: [240, 16], blade: [220, 15], armF: [190, 14], elbF: [200, 14], spy: [200, 14],
    thighN: [300, 18], thighF: [300, 18], shinN: [300, 18], shinF: [300, 18], rollN: [300, 18], rollF: [300, 18],
    earN: [140, 8], earF: [140, 8], hat: [130, 8], rib0: [50, 3.2], rib1: [44, 3], cape: [55, 4], flap: [70, 5], tail0: [70, 5.4], tail1: [55, 4.4], tail2: [45, 3.6],
  },
  fast: ['x', 'armN', 'elbN', 'blade', 'armF', 'elbF', 'spy', 'thighN', 'thighF', 'shinN', 'shinF', 'lift'],
  kick: { tilt: -160, head: -200, hat: -200, earN: 260, earF: -260, rib0: 300, rib1: -300, cape: 220, flap: 200, tail1: 280, tail2: -260 },
  turnKick: { hat: 100, rib0: 300, rib1: -300, cape: 240, flap: 220, tail1: 300, tail2: -300, earN: 140, earF: -140 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const mo = a.mo ?? {};
    const st = mo.rig;
    const now = a.now;
    a.glU = stepPhase(m, a, 'gl2', 26 * 1.1);
    const act = (at, wind, dur) => (at != null && now >= at - wind && now < at + dur ? { antic: now < at ? smooth(1 - (at - now) / wind) : 0, strike: now >= at ? (now - at < 0.07 ? smooth((now - at) / 0.07) : 1 - smooth(clamp((now - at - 0.3) / (dur - 0.3), 0, 1))) : 0 } : null);
    const castW = m.castPose === 'broadside' && m.cast ? smooth(clamp((now - m.cast.t0) / 0.45, 0, 1)) : 0;
    const fireA = act(m.fireAt, 0, 1.1);
    const boardA = act(m.boardAt, 0.4, 1.6);
    const portW = window1(now, m.portAt, 2.4, 0.25, 0.45);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    let kind = 'slash';
    let ph = a.ph;
    if (!active) {
      if (fireA) {
        kind = 'broadside';
        ph = { ...a.ph, ...fireA, since: -1 };
      } else if (castW > 0) {
        kind = 'broadside';
        ph = { ...a.ph, antic: castW, strike: 0, since: -1 };
      } else if (boardA) {
        kind = 'board';
        ph = { ...a.ph, ...boardA, since: -1 };
      }
    }
    a.glKind = kind;
    a.glPh = ph;
    a.glPort = portW;
    const walkW = a.walkW ?? 0;
    const still = 1 - walkW;
    // Her idle, a 10 s act: checking her compass; a twirl of the cutlass; a hearty laugh.
    const lu = fr(t / 10) * 10;
    const busy = active || castW > 0 || fireA || boardA || portW > 0.05 || walkW > 0.05 || m.cine;
    const tap = busy ? 0 : hold(lu, 0.4, 0.9, 2.8, 3.3);
    const twirl = !busy && lu >= 3.8 && lu < 5.6 ? smooth(clamp((lu - 3.9) / 1.3, 0, 1)) : 0;
    // (In her scene she throws back her head and laughs into the wind: the scene's sway act.)
    if (m.cine?.mood === 'happy' && Math.abs(m.cine.sway ?? 0) > 0.001) mo.glLaughUntil = now + 0.3;
    const cineLaugh = m.cine && now < (mo.glLaughUntil ?? -9) ? 1 : 0;
    const laugh = Math.max(busy ? 0 : hold(lu, 6.6, 7, 8.4, 8.8), cineLaugh);
    const tapK = tap * Math.max(0, Math.sin(t * 9));
    a.glTap = tap * still;
    a.glAct = { tap: tap * still, laugh: laugh * still };
    const sway = Math.sin(t * 1.2);
    const shake = laugh * Math.abs(Math.sin(t * 15));
    const armNI = 70 - laugh * 10 - Math.sin(twirl * Math.PI) * 14;
    const elbNI = -30 - laugh * 20;
    const armFI = 110 - tap * 50;
    const elbFI = -20 - tap * 100 - tapK * 10;
    const liftI = sway * 0.4 + shake * 0.8;
    const idle = {
      x: 0, lift: liftI, tilt: sway - laugh * 6, head: -2 + Math.sin(t * 1.4) * 2 + tap * 12 - laugh * 14,
      armN: armNI, elbN: elbNI, blade: aim(50 - laugh * 20, armNI, elbNI) + twirl * 360, armF: armFI, elbF: elbFI, spy: aim(100 - tap * 40, armFI, elbFI),
      ...legsAt(liftI, 2, -2), earN: Math.sin(t * 0.9) * 3 + (fr(t / 3.3) < 0.05 ? 14 : 0) - laugh * 6, earF: Math.sin(t * 0.9 + 1) * 3 + laugh * 6,
      hat: Math.sin(t * 1.4) * 1.4 - laugh * 4, rib0: Math.sin(t * 2.4) * 10, rib1: Math.sin(t * 2.4 - 1) * 12, cape: 6 + sway * 3, flap: sway * 2,
      tail0: 205 + Math.sin(t * 1.6) * 6, tail1: 38 + Math.sin(t * 1.6 - 0.8) * 10, tail2: 42 + Math.sin(t * 1.6 - 1.6) * 12,
    };
    // A captain's swagger on planted feet: chin up, the cutlass over her shoulder.
    const u = a.glU;
    const lead = ((st?.gl2V ?? 0) / (26 * 1.1)) * 0.05;
    const [dxN, upN] = pawStep(u + lead, 0, 26, 0.58, 4.4);
    const [dxF, upF] = pawStep(u + lead, 0.5, 26, 0.58, 4.4);
    const w2 = u * TAU * 2;
    const land = (1 + Math.cos(w2)) / 2;
    const sw = Math.sin(u * TAU);
    const wLift = 0.5 - land * 2;
    const wTilt = 2 + land * 1.4 + sw * 1.6;
    const [thN, shN] = legIK(dxN, HIP + wLift - SOLE - upN, wTilt * 0.3);
    const [thF, shF] = legIK(dxF, HIP + wLift - SOLE - upF, wTilt * 0.3);
    const armFW = 110 + sw * 24;
    const armNW = 72 - sw * 18;
    const walk = {
      x: 0, lift: wLift, tilt: wTilt, head: -6 + land * 1.6, armN: armNW, elbN: -34, blade: aim(34 - sw * 8, armNW, -34, wTilt), armF: armFW, elbF: -20 - Math.max(0, sw) * 16, spy: aim(100 + sw * 10, armFW, -20, wTilt),
      thighN: thN, shinN: shN, thighF: thF, shinF: shF, rollN: upN * 5, rollF: upF * 5, earN: -4 + land * 3, earF: 4 - land * 3,
      hat: Math.sin(w2 - 1) * 2, rib0: 16 + Math.sin(w2 - 1) * 12, rib1: 18 + Math.sin(w2 - 1.6) * 14, cape: 18 + Math.sin(w2 - 1) * 8, flap: 10 + Math.sin(w2 - 1) * 8,
      tail0: 200 + sw * 10, tail1: 34 + Math.sin(w2 - 1) * 12, tail2: 38 + Math.sin(w2 - 2) * 14,
    };
    const [antic, strike] = glMove(kind, idle, t);
    let base = idle;
    // (The over-the-top slash: the rest pose a turn round until the move is over.)
    if (kind === 'slash' && ph.since >= 0) mo.glWrap = 360;
    if (mo.glWrap && !active) {
      mo.glWrap = 0;
      if (st?.armN && st.armN.x > 200) st.armN.x -= 360;
    }
    base = { ...base, armN: base.armN + (mo.glWrap ?? 0) };
    walk.armN += mo.glWrap ?? 0;
    let S = stateBlend({ ...a, ph }, base, walk, antic, strike);
    // Hard to Port!: braced against the gale, everything loose thrown back, the cutlass pointing.
    if (portW > 0.01) {
      const shove = Math.sin(now * 20) * 1.4;
      const P = { tilt: 16 + shove, head: 6, armN: -10, elbN: 0, blade: aim(-6, -10, 0, 16), armF: 150, elbF: -10, spy: aim(150, 150, -10, 16), earN: 30, earF: -30, hat: 8, rib0: 50 + shove * 4, rib1: 56 - shove * 4, cape: 50 + shove * 3, flap: 30, tail0: 176, tail1: 14, tail2: 10 };
      for (const [key, v] of Object.entries(P)) S[key] = S[key] + (v - S[key]) * portW;
      if (still > 0.5) Object.assign(S, Object.fromEntries(Object.entries(legsAt(-2, 7, -7, 4.8)).map(([key, v]) => [key, S[key] + (v - S[key]) * portW])));
      S.lift += (-2 - S.lift) * portW * still;
    }
    a.glMood = glMood(a, m);
    unwind(st, 'blade', S.blade);
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
    ...glPass(false),
    ...glPass(true),
  ],
  // Sky under her: a soft pale shadow on the deck.
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.25;
    ctx.fillStyle = '#2a3a6a';
    ctx.beginPath();
    ctx.ellipse(0, -0.6, 22, 3.4, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const ph = a.glPh ?? a.ph;
    const kind = a.glKind;
    const [bx, by] = at2(mat('blade'), 30, 0);
    // The slash: a pale blue gust trailing the blade.
    if (kind === 'slash' && ph.strike > 0.15) {
      const [sx, sy] = at2(mat('upN'), 0, 0);
      ctx.lineCap = 'round';
      for (let k = 0; k < 6; k++) {
        const f0 = 1.6 - k * 0.42;
        ctx.globalAlpha = a.alpha * ph.strike * (0.25 + k * 0.13);
        ctx.strokeStyle = k % 2 ? '#a8d8ff' : '#ffffff';
        ctx.lineWidth = 1 + k * 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 30, f0 - 0.42, f0, false);
        ctx.stroke();
      }
    }
    // Broadside!: a glint on the raised blade through the cast; at FIRE, cannon smoke puffing off
    // both ways along the deck and a flash.
    if (kind === 'broadside' && ph.antic > 0.5 && ph.strike < 0.1) sparkle(ctx, a, bx, by, 3 + Math.sin(a.now * 8), a.alpha, '#ffffff');
    if (kind === 'broadside' && ph.strike > 0.1) {
      const q = 1 - ph.strike;
      for (let k = 0; k < 6; k++) {
        const sd = k % 2 ? 1 : -1;
        puff(ctx, a, sd * (20 + q * 36 + (k >> 1) * 12), -22 - (k >> 1) * 9 - q * 10, 7 + q * 8 + (k >> 1) * 2, ph.strike * 0.7, '232,232,244');
      }
      sparkle(ctx, a, bx, by, 6 * ph.strike, ph.strike, '#fff3c4');
    }
    // Hard to Port!: streaks of wind racing past her.
    if ((a.glPort ?? 0) > 0.1) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      for (let k = 0; k < 5; k++) {
        const q = fr(a.now * 2.2 + k / 5);
        const y = -60 + k * 13;
        ctx.globalAlpha = a.alpha * a.glPort * (1 - q) * 0.7;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(40 - q * 90, y);
        ctx.lineTo(24 - q * 90, y);
        ctx.stroke();
      }
    }
    // Boarders!: a glint off the raised blade.
    if (kind === 'board' && ph.strike > 0.2) sparkle(ctx, a, bx, by, 5 * ph.strike, ph.strike, '#ffffff');
    // Her idle laugh: a glint of the cutlass now and then; the compass needle twitching as she taps.
    if ((a.glAct?.tap ?? 0) > 0.5 && Math.sin(a.now * 9) > 0.7) {
      const [cx, cy] = at2(mat('chest'), 1, -19.6);
      sparkle(ctx, a, cx + 3, cy - 3, 1.8, 0.8, '#fff3c4');
    }
    ctx.globalAlpha = a.alpha;
  },
}), 1.1);
function glMood(a, m) {
  if (m.hp <= 0) return 'dead';
  const ph = a.glPh ?? a.ph;
  const kind = a.glKind;
  if (ph.strike > 0.25) return 'shout';
  if (kind === 'broadside' && ph.antic > 0.2) return 'angry';
  if ((a.glPort ?? 0) > 0.4) return 'shout';
  if (a.ph.atk || ph.antic > 0.3) return 'angry';
  if (a.mood === 'hurt' || a.face === 'hurt') return 'hurt';
  if (m.cine?.mood === 'angry') return 'angry';
  if (m.cine?.mood === 'happy') return 'laugh';
  const act = a.glAct ?? {};
  if (act.tap > 0.4) return 'hmm';
  if (act.laugh > 0.4) return 'laugh';
  const t = a.t + (a.uidOff ?? 0);
  if (t % 4.2 < 0.13) return 'blink';
  return 'idle';
}

// ---------- The still (portraits) ----------
export function galeStill(pose, f, mood) {
  const fm = GL_FACES[mood] ? mood : MOODS.has(mood) ? mood : 'idle';
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
    return { up: put(upperP(far)(), [2, 4], sx, sy, armA), fore: put(foreP(far)(), [2, 4], ex, ey, fa), paw: put(pawP(far)(), [4.5, 4.5], gx, gy, 0), grip: [gx, gy] };
  };
  const an = arm(false, 70, -30);
  const af = arm(true, 110, -20);
  const tail = [];
  let [tx, ty, ta] = [-7, hip[1] - 3, 205];
  [205, 38, 42].forEach((r, n) => {
    ta = n ? ta + r : r;
    tail.push(...put(tailP(n)(), [6, 7], tx, ty, ta));
    tx += Math.cos(ta * D2R) * TAILL[n];
    ty += Math.sin(ta * D2R) * TAILL[n];
  });
  return { w: 70, h: 96, res: 2, shapes: shift([
    ...put(capeP(), [24, 2], -1, ch[1] - 23, 6),
    ...tail,
    ...af.up, ...af.fore, ...put(spyP(), [3, 4], af.grip[0], af.grip[1], 100), ...af.paw,
    ...put(flapP(), [4, 1], -8, ch[1], 0),
    ...legAt(true), ...legAt(false), ...put(bodyP(), [14, 26], ch[0], ch[1]),
    ...an.up, ...put(epP(), [6, 3], SHN[0] + 1, ch[1] + SHN[1] - 1.4),
    ...put(earP(true)(), [6, 14], nk[0] - 11.6, nk[1] - 23, -56), ...put(earP(false)(), [6, 14], nk[0] + 12.6, nk[1] - 23.4, 54),
    ...put(headP(), [22, 38], nk[0], nk[1]), ...put((GL_FACES[fm] ?? GL_FACES.idle)(), [22, 38], nk[0], nk[1]),
    ...put(hatP(), [20, 13], nk[0] + 1, nk[1] - 27.4),
    ...an.fore, ...put(cutlassP(), [7, 6], an.grip[0], an.grip[1], 50), ...an.paw,
  ], 35, 95) };
}
