// The Dream Theatre's own folk, in its Grand Lobby (remade from scratch for Chapter 9, 2026-11-19):
// the theatre's company, still putting on the show. Live puppets on the rig (rig.js): every part
// drawn once and placed each frame, outer outline only, faces bare; upright and chibi.
//
//   understudy  Understudy Ghost: a little sheet ghost in a red bow tie, floating, its script in
//               one hand and a gold comedy mask on a stick in the other (held up beside its face,
//               never over it). Reads its lines, rehearses with a flourish, takes a bow. Lunges
//               dramatically, swatting with the script.
//   chorusgirl  Chorus Flamingo: a pink flamingo showgirl in a feather tutu, a plumed headdress
//               and white leg warmers, a feather fan in one wing. Fans herself, does the can-can.
//               Her attack is a high kick.
//   stagehand   Stagehand Mole: a chubby mole in denim overalls and a tool belt, a crew headset
//               with a red mic, big pink digging claws, a big steel wrench. Tightens a bolt, calls
//               "standby" into the headset, mops its brow. Swings the wrench over and down.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, TAU } from './rig.js';
import { D2R, ov, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, sparkle } from './rigkit.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const line = (pts, w, c) => stroke(pts, w, c).map(F);
const stillOf = (a) => !(a.ph.antic > 0.02 || a.ph.strike > 0.02) && (a.walkW ?? 0) < 0.05;
const GOLD = '#ffd36b';

// =====================================================================================
// Understudy Ghost
// =====================================================================================
const SHEET = ramp('#f4f0ff', { step: 8, turn: 8 });
const ug = pairOf('ug');
// The sheet: a round dome falling to a scalloped hem, a red bow tie. Box 24 x 26; floating at its
// hem's middle (12, 25.4).
const ugBody = () => [
  E(12, 11, 9.6, 10, SHEET.base), T([[2.4, 11], [21.6, 11], [22.6, 21.6], [1.4, 21.6]], SHEET.base),
  ...[[3.4, 22.2], [8.2, 23], [13, 23.2], [17.8, 22.8], [21.4, 22]].map(([x, y]) => E(x, y, 2.8, 2.4, SHEET.base)),
  crescent(12, 14, 10.4, 11.4, SHEET.sh, { k: 0.18, a0: 120, a1: 230 }), shine(12, 10, 9.6, 9, '#ffffff', 0, 0.8),
  F(T([[11.6, 15.4], [14.2, 16.6], [11.6, 17.8]], '#e8404e')), F(T([[16.8, 15.4], [14.2, 16.6], [16.8, 17.8]], '#e8404e')), F(E(14.2, 16.6, 1.1, 1, '#b82a3a')),
];
// A little sheet arm. Box 6 x 8; the shoulder at (3, 1).
const ugArm = (far) => () => [taper([[3, 1], [3, 6.2]], 4.2, 3.4, far ? SHEET.sh : SHEET.base)];
// The comedy mask on its stick, held at the stick's foot. Box 14 x 17; the grip at (7, 16).
const ugMask = () => [
  ...line([[7, 16], [7, 8]], 1, '#c99a3b'),
  T([[1, 4], [3.6, 1.4], [7, 2.4], [10.4, 1.4], [13, 4], [12, 8], [7, 7.2], [2, 8]], GOLD),
  F(T([[1.6, 4.2], [3.6, 2], [7, 2.8], [10.4, 2], [12.4, 4.2], [7, 3.6]], '#fff0b0')),
  ...line(arcP(4.6, 5, 1.6, 1, 200, 340, 5), 0.8, '#5a3a1a'), ...line(arcP(9.4, 5, 1.6, 1, 200, 340, 5), 0.8, '#5a3a1a'),
  F(E(13, 3.6, 1.2, 1.2, '#ff7aa8')),
];
// The script: a red cover, a gold star, white page edges. Box 9 x 11; held at (4.5, 2).
const ugScript = () => [R(0.5, 0.6, 8, 10, '#c8304a'), F(R(7, 1, 1.4, 9.2, '#fff8ee')), F(R(0.5, 0.6, 8, 1.4, '#e85a6a')), F(E(4, 5.4, 1.6, 1.6, GOLD))];
const UG_BODY = ug('body', 24, 26, ugBody, 2);
const UG_ARM = [false, true].map((f) => ug(`arm${f ? 1 : 0}`, 6, 8, ugArm(f), 2));
const UG_MASK = ug('mask', 14, 17, ugMask, 2);
const UG_SCRIPT = ug('script', 9, 11, ugScript, 2);
const UG_FACE = { eyes: [[12.6, 10, 1.5, 2, -1], [16.6, 9.8, 1.6, 2.1, 1]], mouth: [15, 13.6, 1.5], blush: [[10.6, 12.6, 1.3], [18.4, 12.4, 1.2]], iris: '#6a5aa8', lid: 0.1 };
const ugFace = (mood) => sm(`ug|face|${mood}`, 24, 26, () => faceShapes(mood, UG_FACE));
const ugPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `armF${tag}`, parent: 'trunk', s: UG_ARM[1][i], pivot: [3, 1], at: () => [-6, -14], rot: (S) => S.aF * D2R },
    { name: `script${tag}`, parent: 'armF', s: UG_SCRIPT[i], pivot: [4.5, 2], at: () => [0, 5.6], rot: (S) => -S.aF * 0.6 * D2R },
    { name: `body${tag}`, parent: 'trunk', s: UG_BODY[i], pivot: [12, 25.4] },
    { name: `armN${tag}`, parent: 'trunk', s: UG_ARM[0][i], pivot: [3, 1], at: () => [6, -13], rot: (S) => S.aN * D2R },
    { name: `mask${tag}`, parent: 'armN', s: UG_MASK[i], pivot: [7, 16], at: () => [0, 5.6], rot: (S) => (S.mk - S.aN) * D2R },
  ];
};
export const ghostRig = makeRig({
  w: 46, h: 52, soft: true, stride: 8, recover: 0.6,
  springs: { x: [260, 18], lift: [160, 12], tilt: [180, 12], aN: [220, 12], aF: [220, 12], mk: [200, 12] },
  fast: ['x', 'tilt', 'aN', 'aF'],
  kick: { tilt: -200 },
  turnKick: { tilt: 140 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    stepPhase(m, a, 'ug', 8);
    const still = stillOf(a);
    const lu = t % 10;
    // Its act: reading its lines, then rehearsing them with the mask held up high, then a bow.
    const read = still ? hold(lu, 0.4, 0.9, 3.4, 3.9) : 0;
    const rehearse = still ? hold(lu, 4.4, 4.8, 6.4, 6.9) : 0;
    const bow = still ? hold(lu, 7.4, 7.8, 8.6, 9.1) : 0;
    const bob = Math.sin(t * 2);
    a.ugMood = rehearse > 0.5 ? 'shout' : bow > 0.5 ? 'happy' : read > 0.5 ? 'blink' : null;
    // (The mask is held out in front, its stick leaning forward, so it never hides its face.)
    const idle = { x: 0, lift: 3 + bob * 1.5, tilt: bob * 2 + read * 6 - rehearse * 10 + bow * 26, aN: -40 - rehearse * 110 + bow * 20 + bob * 4, aF: 8 - read * 70 - bow * 30 - bob * 4, mk: 30 - rehearse * 20 + bow * 30 };
    // Drifting along, leaning into it, the script trailing.
    const walk = { x: 0, lift: 3 + bob * 1.2, tilt: 10, aN: -20, aF: 46, mk: 40 };
    // A dramatic lunge: leaning back, mask up high, then swooping in with the script.
    const antic = { x: -3, lift: 5, tilt: -14, aN: -160, aF: 30, mk: 10 };
    const strike = { x: 10, lift: 1, tilt: 20, aN: -40, aF: -80, mk: 50 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  under(ctx, m, a, S) {
    ctx.globalAlpha = 0.18 * a.alpha;
    ctx.fillStyle = '#2a1a3a';
    ctx.beginPath();
    ctx.ellipse(S.x, -0.6, Math.max(4, 9 - S.lift * 0.5), 2, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -4 - S.lift], rot: (S) => S.tilt * D2R },
    ...ugPass(false),
    ...ugPass(true),
    { name: 'face', parent: 'trunk', s: (a) => ugFace(moodOf(a, a.ugMood)), pivot: [12, 25.4] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0 || a.ph.strike < 0.2) return;
    // A glint off the mask as it swoops.
    const [mx, my] = at2(mat('mask'), 7, 4);
    for (let k = 0; k < 3; k++) sparkle(ctx, a, mx + 3 + k * 4, my - 2 + k * 3, 2 * a.ph.strike, a.alpha * a.ph.strike, k % 2 ? '#ffffff' : '#fff3a6');
  },
});
export function ghostStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 44, h: 48, res: 3, shapes: shift([
    ...put(ugArm(true)(), [3, 1], -6, -21, 8), ...put(ugScript(), [4.5, 2], -6.8, -15.4, -5), ...put(ugBody(), [12, 25.4], 0, -7), ...put(faceShapes(fm, UG_FACE), [12, 25.4], 0, -7),
    ...put(ugArm(false)(), [3, 1], 6, -20, -40), ...put(ugMask(), [7, 16], 9.6, -15.7, 30),
  ], 22, 47) };
}

// =====================================================================================
// Chorus Flamingo
// =====================================================================================
const FLAM = ramp('#ff8ab0', { step: 10, turn: 10 });
const BEAKC = '#ffe8d0';
const cf = pairOf('cf');
const LEG = 11;
// Body: round and pink, a paler chest, gold sequins. Box 20 x 18; sitting on the hips at (10, 17).
const cfBody = () => [E(10, 9, 8.6, 8.2, FLAM.base), F(E(12.6, 8.4, 4, 4.6, '#ffc4d8')), crescent(10, 9, 8.6, 8.2, FLAM.sh, { k: 0.2, a0: 110, a1: 230 }), shine(10, 9, 8.6, 8.2, '#ffffff', 0, 0.6), ...[[12, 6], [14.2, 9.4], [11, 11.6]].map(([x, y]) => F(E(x, y, 0.7, 0.7, GOLD)))];
// The feather tutu round her hips. Box 26 x 8; its middle at (13, 3).
const cfSkirt = () => [...[[2.4, 4.4, '#ffffff'], [6.4, 5.2, FLAM.base], [10.6, 5.6, '#ffffff'], [15, 5.6, FLAM.base], [19.2, 5.2, '#ffffff'], [23.4, 4.4, FLAM.base]].map(([x, y, c]) => ov(x, y, 3.4, 2.2, (x - 13) * 3, c)), F(R(3, 1.2, 20, 1.4, GOLD))];
// The neck: short and curved. Box 6 x 10; its root at (3, 9).
const cfNeck = () => [taper([[3, 9], [3.6, 1]], 4.2, 3.6, FLAM.base)];
// The head: round, a curved pale beak with a black tip. Box 20 x 15; the neck at (6, 13).
const cfHead = () => [
  E(8, 8, 6.4, 6, FLAM.base), crescent(8, 8, 6.4, 6, FLAM.sh, { k: 0.18, a0: 120, a1: 220 }), shine(8, 8, 6.4, 6, '#ffffff', 0, 0.6),
  T([[12.6, 5.8], [16.6, 6.6], [18, 9.2], [16.6, 12.4], [15.2, 9.8], [12.4, 9.6]], BEAKC), F(T([[16.2, 8.6], [18, 9.2], [16.6, 12.4], [15.4, 10.2]], '#3a2a3a')),
];
// The headdress: three tall plumes on a gold band with a jewel. Box 14 x 16; its foot at (7, 15).
const cfPlume = () => [
  ...[[-50, FLAM.base, 4.6], [-25, '#ffffff', 5.4], [0, FLAM.base, 6], [25, '#ffd36b', 5.4], [50, '#ffffff', 4.6]].map(([d, c, l]) => ov(7 + Math.sin(d * D2R) * (l + 1), 13 - Math.cos(d * D2R) * (l + 1), 1.9, l, d, c)),
  R(3, 12.6, 8.4, 2.6, GOLD), F(E(7.2, 13.8, 1.3, 1.2, '#7fd8ff')),
];
// A wing for an arm. Box 8 x 10; the shoulder at (2, 1).
const cfWing = (far) => () => [T([[2, 1], [6.6, 2.6], [6.4, 8.6], [3.4, 9.4], [1.4, 6]], far ? FLAM.sh : FLAM.base), ...line([[3, 5], [5.4, 7.4]], 0.5, '#ffc4d8')];
// The feather fan, held at its pivot. Box 14 x 10; the pivot at (7, 9).
const cfFan = () => [T([[7, 9], ...arcP(7, 9, 6.6, 7.4, 190, 350, 10)], '#ffffff'), ...[200, 240, 280, 320].map((d) => F(T([[7, 9], [7 + Math.cos(d * D2R) * 6.4, 9 + Math.sin(d * D2R) * 7.2], [7 + Math.cos((d + 18) * D2R) * 6.4, 9 + Math.sin((d + 18) * D2R) * 7.2]], '#ffd0e0'))), F(E(7, 9, 1.2, 1.2, GOLD))];
// A leg: pink, a white leg warmer near the foot. Box 6 x 13; the hip at (3, 1).
const cfLeg = (far) => () => [taper([[3, 1], [3, 10.6]], 3.2, 2.6, far ? FLAM.sh : FLAM.base), R(1.2, 7.6, 3.6, 2.6, far ? '#e4e0ee' : '#ffffff')];
// A foot: pointed like a dancer's. Box 7 x 4; the ankle at (2, 1.6).
const cfFoot = (far) => () => [T([[0.6, 0.4], [3.4, 0.6], [6.6, 2.4], [3.4, 3.4], [0.6, 3]], far ? FLAM.sh : FLAM.base)];
const CF_BODY = cf('body', 20, 18, cfBody, 2);
const CF_SKIRT = cf('skirt', 26, 8, cfSkirt, 2);
const CF_NECK = cf('neck', 6, 10, cfNeck, 2);
const CF_HEAD = cf('head', 20, 15, cfHead, 2);
const CF_PLUME = cf('plume', 14, 16, cfPlume, 2);
const CF_WING = [false, true].map((f) => cf(`wing${f ? 1 : 0}`, 8, 10, cfWing(f), 2));
const CF_FAN = cf('fan', 14, 10, cfFan, 2);
const CF_LEG = [false, true].map((f) => cf(`leg${f ? 1 : 0}`, 6, 13, cfLeg(f), 2));
const CF_FOOT = [false, true].map((f) => cf(`foot${f ? 1 : 0}`, 7, 4, cfFoot(f), 2));
const CF_FACE = { eyes: [[8.8, 6.6, 1.3, 1.7, -1], [11.8, 6.4, 1.4, 1.8, 1]], mouth: [13.6, 9.6, 1.1], blush: [[7, 8.8, 1.1], [12.4, 9.2, 1]], iris: '#a8306a', lid: 0.1, lashes: 1 };
const cfFace = (mood) => sm(`cf|face|${mood}`, 20, 15, () => faceShapes(mood, CF_FACE));
const cfPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (k, far) => [
    { name: `leg${k}${tag}`, parent: 'trunk', s: CF_LEG[far ? 1 : 0][i], pivot: [3, 1], at: () => [far ? -2.6 : 2.6, 0], rot: (S) => (far ? S.lF : S.lN) * D2R },
    { name: `foot${k}${tag}`, parent: `leg${k}`, s: CF_FOOT[far ? 1 : 0][i], pivot: [2, 1.6], at: () => [0, 10.6], rot: (S) => (far ? S.fF : S.fN) * D2R },
  ];
  return [
    { name: `wingF${tag}`, parent: 'trunk', s: CF_WING[1][i], pivot: [2, 1], at: () => [-4, -12], rot: (S) => S.wF * D2R },
    ...leg(1, true),
    ...leg(0, false),
    { name: `body${tag}`, parent: 'trunk', s: CF_BODY[i], pivot: [10, 17] },
    { name: `skirt${tag}`, parent: 'trunk', s: CF_SKIRT[i], pivot: [13, 3], at: () => [0, -1.4] },
    { name: `neck${tag}`, parent: 'nk', s: CF_NECK[i], pivot: [3, 9] },
    { name: `plume${tag}`, parent: 'hd', s: CF_PLUME[i], pivot: [7, 15], at: () => [1, -10], soft: { key: 'plume', dir: [0, -1], k: 90, c: 5, gain: 1, turn: 0.6, max: 24, flutter: 6, hz: 1.2 } },
    { name: `head${tag}`, parent: 'hd', s: CF_HEAD[i], pivot: [6, 13] },
    { name: `wingN${tag}`, parent: 'trunk', s: CF_WING[0][i], pivot: [2, 1], at: () => [4, -11], rot: (S) => S.wN * D2R },
    { name: `fan${tag}`, parent: 'wingN', s: CF_FAN[i], pivot: [7, 9], at: () => [2.6, 8], rot: (S) => (S.fan - S.wN * 0.5) * D2R },
  ];
};
export const flamingoRig = makeRig({
  w: 46, h: 60, soft: true, stride: 7, recover: 0.5,
  springs: { x: [300, 20], lift: [260, 16], tilt: [220, 14], neck: [200, 12], head: [180, 11], lN: [380, 20], lF: [380, 20], fN: [300, 18], fF: [300, 18], wN: [240, 13], wF: [240, 13], fan: [300, 12] },
  fast: ['x', 'lN', 'lF', 'fN', 'fF'],
  kick: { tilt: -160, neck: -200 },
  turnKick: { tilt: 120, neck: 140 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'cf', 7);
    const still = stillOf(a);
    const lu = t % 10;
    // Her act: fanning herself, very glamorous; then the can-can, a kick with each leg in turn,
    // wings up; then a little bow of the neck.
    const fanning = still ? hold(lu, 0.5, 0.9, 3.8, 4.2) : 0;
    const cancan = still ? hold(lu, 5, 5.3, 8.2, 8.6) : 0;
    const kN = Math.max(0, Math.sin(t * 4.4)) * cancan;
    const kF = Math.max(0, -Math.sin(t * 4.4)) * cancan;
    const br = Math.sin(t * 2.2);
    a.cfMood = cancan > 0.5 ? 'happy' : fanning > 0.5 ? 'blink' : null;
    a.cfFanning = fanning;
    const idle = {
      x: 0, lift: br * 0.4 + cancan * Math.abs(Math.sin(t * 4.4)) * 1.4, tilt: br * 1.5 - (kN + kF) * 6, neck: -8 + br * 3 + cancan * 6, head: br * 3,
      lN: -kN * 100, lF: -kF * 90, fN: kN * 40, fF: kF * 30,
      wN: -fanning * 80 - cancan * 140 + br * 4, wF: -cancan * 120 - br * 4, fan: fanning * Math.sin(t * 12) * 18,
    };
    // Walking: a showgirl's strut, one foot neatly before the other, hips swaying.
    const [dxN, upN] = pawStep(u, 0, 7, 0.6, 2);
    const [dxF, upF] = pawStep(u, 0.5, 7, 0.6, 2);
    const s1 = Math.sin(u * TAU);
    const walk = {
      x: 0, lift: Math.abs(s1) * 1, tilt: 4 + s1 * 3, neck: -4 + Math.abs(s1) * 6, head: -s1 * 3,
      lN: -Math.asin(Math.max(-1, Math.min(1, dxN / LEG))) / D2R, lF: -Math.asin(Math.max(-1, Math.min(1, dxF / LEG))) / D2R, fN: upN * 12, fF: upF * 12,
      wN: 20 + s1 * 10, wF: 20 - s1 * 10, fan: 0,
    };
    // The high kick: the leg drawn back, then thrown high in front, leaning back with it.
    const antic = { x: -2, lift: 0, tilt: 10, neck: 8, head: 4, lN: 40, lF: 0, fN: 10, fF: 0, wN: -40, wF: -30, fan: 0 };
    const strike = { x: 6, lift: 1, tilt: -16, neck: -14, head: -6, lN: -110, lF: 4, fN: 40, fF: 0, wN: 50, wF: 60, fan: 20 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -LEG - 2.4 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'trunk', at: () => [4, -14], rot: (S) => S.neck * D2R },
    { name: 'hd', parent: 'nk', at: () => [0.6, -8], rot: (S) => (S.head - S.neck) * D2R },
    ...cfPass(false),
    ...cfPass(true),
    { name: 'face', parent: 'hd', s: (a) => cfFace(moodOf(a, a.cfMood)), pivot: [6, 13] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Sparkles off her toe as the kick lands.
    if (a.ph.strike > 0.2) {
      const [tx, ty] = at2(mat('foot0'), 6, 2);
      for (let k = 0; k < 3; k++) sparkle(ctx, a, tx + 2 + k * 3, ty - 3 + k * 3, 2.2 * a.ph.strike, a.alpha * a.ph.strike, k % 2 ? '#ffffff' : '#fff3a6');
    }
  },
});
export function flamingoStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const hy = -LEG - 2.4;
  return { w: 44, h: 56, res: 3, shapes: shift([
    ...put(cfWing(true)(), [2, 1], -4, hy - 12, 20), ...put(cfLeg(true)(), [3, 1], -2.6, hy), ...put(cfFoot(true)(), [2, 1.6], -2.6, hy + 10.6), ...put(cfLeg(false)(), [3, 1], 2.6, hy), ...put(cfFoot(false)(), [2, 1.6], 2.6, hy + 10.6),
    ...put(cfBody(), [10, 17], 0, hy), ...put(cfSkirt(), [13, 3], 0, hy - 1.4), ...put(cfNeck(), [3, 9], 4, hy - 14, -8),
    ...put(cfPlume(), [7, 15], 4.4, hy - 32), ...put(cfHead(), [6, 13], 3.4, hy - 22), ...put(faceShapes(fm, CF_FACE), [6, 13], 3.4, hy - 22), ...put(cfWing(false)(), [2, 1], 4, hy - 11, 20),
  ], 20, 55) };
}

// =====================================================================================
// Stagehand Mole
// =====================================================================================
const MFUR = ramp('#9a7a8a', { step: 10, turn: 10 });
const DENIM = ramp('#4a6ab8', { step: 10, turn: 10 });
const CLAW = '#ffb8c8';
const STEEL = ramp('#c8ccd8', { step: 10, turn: 8 });
const sh = pairOf('sh');
// Body: a chubby mole in denim overalls (bib, straps, gold buttons, a pocket with a pencil) and a
// tool belt. Box 22 x 22; standing at (11, 21.6).
const shBody = () => [
  E(11, 12.6, 9.4, 9.4, MFUR.base), E(11, 15, 9.2, 6.8, DENIM.base), R(7, 7, 8.4, 7, DENIM.base),
  F(R(7, 3.4, 1.6, 4, DENIM.sh)), F(R(13.8, 3.4, 1.6, 4, DENIM.sh)), F(E(7.8, 7.8, 0.8, 0.8, GOLD)), F(E(14.6, 7.8, 0.8, 0.8, GOLD)),
  F(R(9, 9.2, 4.4, 3, DENIM.sh)), F(R(11.6, 7.4, 0.9, 2.6, '#ffd34a')), F(R(11.6, 7, 0.9, 0.6, '#ff9ab8')),
  F(R(1.8, 15, 18.4, 1.8, '#c88a3a')), F(R(16, 14.4, 3, 3, '#e8b84a')),
  crescent(11, 12.6, 9.4, 9.4, MFUR.sh, { k: 0.18, a0: 120, a1: 230 }), shine(11, 12, 9, 9, '#ffffff', 0, 0.4),
];
// Its head: round fur, a paler muzzle, a pink nose, whiskers; the crew headset (band, earcup, a mic
// with a red tip). Box 24 x 18; the neck at (10, 16).
const shHead = () => [
  E(10, 9.6, 8.4, 7.4, MFUR.base), crescent(10, 9.6, 8.4, 7.4, MFUR.sh, { k: 0.18, a0: 120, a1: 220 }), shine(10, 9.6, 8.4, 7.4, '#ffffff', 0, 0.4),
  F(E(14.6, 11.2, 4.6, 3.6, MFUR.hi)), E(19.2, 10.4, 2.6, 2.2, '#ff8ab0'), F(E(18.6, 9.6, 0.9, 0.6, '#ffd0e0')),
  ...line([[15, 12.6], [12.6, 13.4]], 0.4, '#5a4a5a'), ...line([[15.4, 13.6], [13.2, 15]], 0.4, '#5a4a5a'),
  ...stroke(arcP(9.6, 9.6, 8.8, 8, 200, 330, 12), 1.4, '#2e2a3a'), E(4.6, 10.4, 2.4, 2.8, '#2e2a3a'),
  ...line([[5.4, 12.4], [8.6, 15.2], [12.6, 15.6]], 0.8, '#2e2a3a'), F(E(13, 15.6, 1, 0.9, '#e8404e')),
];
// An arm: a short furry arm, a big pink digging claw. Box 9 x 12; the shoulder at (3, 1).
const shArm = (far) => () => [taper([[3, 1], [3.4, 6]], 4, 3.6, far ? MFUR.sh : MFUR.base), E(4, 8.4, 3.4, 3, far ? '#e8a0b4' : CLAW), ...[[6.4, 9.6], [7, 7.8], [6.4, 6.2]].map(([x, y]) => F(T([[x, y - 0.6], [x + 1.6, y], [x, y + 0.6]], '#ffffff')))];
// The wrench: a long steel handle with a red grip, an open jaw on top. Box 10 x 28; the grip at (5, 22).
const shWrench = () => [
  R(0.6, 0.4, 2.8, 7.4, STEEL.base), R(6.6, 0.4, 2.8, 7.4, STEEL.base), R(0.6, 5.4, 8.8, 4.4, STEEL.base), R(3.6, 9, 2.8, 18, STEEL.base),
  F(R(1, 0.8, 1, 6.4, '#ffffff')), F(R(4, 9.4, 0.8, 8, '#ffffff')), F(R(3.4, 18, 3.2, 8.6, '#e8404e')), F(R(3.4, 18, 3.2, 1, '#ff8a9a')),
];
const shFoot = (far) => () => [E(4, 2, 3.8, 1.9, far ? '#7a5a6a' : '#8a6a7a'), F(E(6.6, 2.4, 0.8, 0.6, '#ffffff'))];
const SH_BODY = sh('body', 22, 22, shBody, 2);
const SH_HEAD = sh('head', 24, 18, shHead, 2);
const SH_ARM = [false, true].map((f) => sh(`arm${f ? 1 : 0}`, 9, 12, shArm(f), 2));
const SH_WRENCH = sh('wrench', 10, 28, shWrench, 2);
const SH_FOOT = [false, true].map((f) => sh(`foot${f ? 1 : 0}`, 8, 4, shFoot(f), 2));
const SH_FACE = { eyes: [[13.4, 8.4, 1.1, 1.4, -1], [16.4, 8.4, 1.2, 1.5, 1]], mouth: [16.8, 13.6, 1.2], blush: [[12.2, 11, 1.1], [17.6, 11.8, 1]], iris: '#3a2a3a', lid: 0.15 };
const shFace = (mood) => sm(`sh|face|${mood}`, 24, 18, () => faceShapes(mood, SH_FACE));
const shPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (k, far) => ({ name: `foot${k}${tag}`, parent: null, s: SH_FOOT[far ? 1 : 0][i], pivot: [4, 3.8], at: (S, a) => { const [dx, l] = pawStep(a.shU ?? 0, far ? 0.5 : 0, 6, 0.6, 1.8); return [S.x + (far ? -3.6 : 3.6) + dx * a.walkW, -l * a.walkW]; } });
  return [
    { name: `armF${tag}`, parent: 'trunk', s: SH_ARM[1][i], pivot: [3, 1], at: () => [-6, -14], rot: (S) => S.aF * D2R },
    foot(1, true),
    foot(0, false),
    { name: `body${tag}`, parent: 'trunk', s: SH_BODY[i], pivot: [11, 21.6] },
    { name: `head${tag}`, parent: 'nk', s: SH_HEAD[i], pivot: [10, 16] },
    { name: `armN${tag}`, parent: 'trunk', s: SH_ARM[0][i], pivot: [3, 1], at: () => [6, -13], rot: (S) => S.aN * D2R },
    { name: `wrench${tag}`, parent: 'armN', s: SH_WRENCH[i], pivot: [5, 22], at: () => [1, 8], rot: (S) => (S.wr - S.aN * 0.3) * D2R },
  ];
};
export const moleRig = makeRig({
  w: 50, h: 58, soft: true, stride: 6, recover: 0.5,
  springs: { x: [300, 20], lift: [260, 16], tilt: [220, 14], head: [180, 11], aN: [240, 13], aF: [220, 12], wr: [240, 12] },
  fast: ['x', 'tilt', 'aN', 'wr'],
  kick: { tilt: -180, head: -220 },
  turnKick: { tilt: 120 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.shU = stepPhase(m, a, 'sh', 6);
    const still = stillOf(a);
    const lu = t % 10;
    // Its act: tightening a bolt with the wrench, then a call on the headset ("Standby!"), then a
    // mop of its brow with the back of its claw.
    const bolt = still ? hold(lu, 0.5, 0.9, 3.4, 3.8) : 0;
    const call = still ? hold(lu, 4.6, 4.9, 6.4, 6.8) : 0;
    const mop = still ? hold(lu, 7.6, 7.9, 8.6, 9) : 0;
    const turn = bolt * Math.sin(t * 5);
    const br = Math.sin(t * 2.1);
    a.shMood = call > 0.5 ? 'shout' : mop > 0.5 ? 'blink' : bolt > 0.5 ? 'angry' : null;
    const idle = { x: 0, lift: br * 0.4, tilt: br * 1.5 + bolt * 6 - call * 3, head: br * 2 + bolt * 8 - call * 6 + mop * 6, aN: 14 - bolt * 60 + turn * 12 - mop * 120 + br * 3, aF: 8 - call * 140 - br * 3, wr: -50 + bolt * 140 + turn * 30 + mop * 40 };
    // Walking: a chubby waddle, the wrench resting back on its shoulder.
    const s1 = Math.sin(a.shU * TAU);
    const walk = { x: 0, lift: Math.abs(s1) * 1.2, tilt: 5 + s1 * 3, head: -3, aN: 10 + s1 * 6, aF: 20 - s1 * 14, wr: -60 };
    // The wrench swung up over its head, then down.
    const antic = { x: -3, lift: 1, tilt: -10, head: -6, aN: 150, aF: 20, wr: 10 };
    const strike = { x: 8, lift: 0, tilt: 16, head: 8, aN: -70, aF: -10, wr: -10 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -3 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'trunk', at: () => [2, -18], rot: (S) => (S.head - S.tilt * 0.4) * D2R },
    ...shPass(false),
    ...shPass(true),
    { name: 'face', parent: 'nk', s: (a) => shFace(moodOf(a, a.shMood)), pivot: [10, 16] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0 || a.ph.strike < 0.2) return;
    // A clang off the wrench's jaw.
    const [wx, wy] = at2(mat('wrench'), 5, 3);
    for (let k = 0; k < 4; k++) sparkle(ctx, a, wx + Math.cos(k * 1.6) * 5 * a.ph.strike, wy + Math.sin(k * 1.6) * 5 * a.ph.strike, 2.2 * a.ph.strike, a.alpha * a.ph.strike, k % 2 ? '#ffffff' : '#fff3a6');
  },
});
export function moleStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 46, h: 52, res: 3, shapes: shift([
    ...put(shArm(true)(), [3, 1], -6, -17, 8), ...put(shFoot(true)(), [4, 3.8], -3.6, 0), ...put(shFoot(false)(), [4, 3.8], 3.6, 0), ...put(shBody(), [11, 21.6], 0, -3),
    ...put(shHead(), [10, 16], 2, -21), ...put(faceShapes(fm, SH_FACE), [10, 16], 2, -21), ...put(shArm(false)(), [3, 1], 6, -16, 14), ...put(shWrench(), [5, 22], 4.3, -8, -54),
  ], 21, 51) };
}
