// The Queen's dream's everyday monsters (Chapter 9, 2026-11-19): her old life in the human world,
// on the morning train and in the office (the Dream Theatre's acts I and II). Live puppets on the
// rig (rig.js): every part drawn once and placed each frame, outer outline only, faces bare;
// upright and chibi.
//
//   rushpenguin  Rush-Hour Penguin: a little penguin commuter, collar and red tie on its white
//                front, a briefcase in one flipper, earbuds in. Checks its watch (late again!),
//                taps its foot, bobs along to its music. Swings the briefcase over and down.
//   sleepysheep  Sleepy Commuter Sheep: a woolly sheep in a trench coat, a mint neck pillow, a
//                sleep mask pushed up on its wool. Nods off on its feet, sinking, sinking, and jerks
//                awake. Its attack is a big sleepy headbutt of a nod.
//   stickybird   Sticky Note Bird: a round yellow sticky-note bird, ruled lines on its side, a
//                crest of little notes, wings and tail of pink and blue notes. Preens, flutters,
//                and now and then a note peels off its tail. Flings a sticky note (a shot).
//   staplercroc  Stapler Croc: a chubby upright crocodile whose head is a red stapler, its eyes on
//                top, staples for teeth. Clacks its jaw, swishes its tail. Opens wide and fires a
//                staple (a shot).

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, TAU } from './rig.js';
import { D2R, ov, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, sparkle, puff, note } from './rigkit.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const line = (pts, w, c) => stroke(pts, w, c).map(F);
// A square turned `deg` about its middle (a sticky note).
const sq = (cx, cy, s, deg, c) => {
  const a = deg * D2R;
  return T([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => [cx + ((x * Math.cos(a) - y * Math.sin(a)) * s) / 2, cy + ((x * Math.sin(a) + y * Math.cos(a)) * s) / 2]), c);
};
// A loose sheet of paper or a sticky note, drawn live.
function liveNote(ctx, a, x, y, s, rot, c, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a.alpha * al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = c;
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(-s / 2, -s / 2, s, s * 0.22);
  ctx.restore();
}
// A little "z" floating up off a sleeper.
function zee(ctx, a, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.globalAlpha = a.alpha * al;
  ctx.strokeStyle = '#8a7ac8';
  ctx.lineWidth = Math.max(1, s * 0.28);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - s / 2, y - s / 2);
  ctx.lineTo(x + s / 2, y - s / 2);
  ctx.lineTo(x - s / 2, y + s / 2);
  ctx.lineTo(x + s / 2, y + s / 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}
// Idle acts play only while standing still and not attacking.
const stillOf = (a) => !(a.ph.antic > 0.02 || a.ph.strike > 0.02) && (a.walkW ?? 0) < 0.05;

// =====================================================================================
// Rush-Hour Penguin
// =====================================================================================
const NAVY = ramp('#3e4f86', { step: 10, turn: 10 });
const SNOW = '#fbfaf6';
const BEAK = '#ffae3a';
const CASE = ramp('#b07a42', { step: 10, turn: 8 });
const rp = pairOf('rp');
// Body: a round navy penguin, a white front, a white collar and a red tie. Box 22 x 24; standing at
// (11, 23.6).
const rpBody = () => [
  E(11, 13, 9.6, 10.6, NAVY.base), F(E(12.8, 14.6, 6.4, 8.4, SNOW)),
  crescent(11, 13, 9.6, 10.6, NAVY.sh, { k: 0.2, a0: 110, a1: 230 }), shine(11, 13, 9.6, 10.6, '#ffffff', 0, 0.5),
  F(T([[10.2, 4.8], [12.9, 7.4], [11.4, 3.8]], '#ffffff')), F(T([[15.6, 4.8], [12.9, 7.4], [14.4, 3.8]], '#ffffff')),
  F(T([[12.1, 6.6], [13.7, 6.6], [13.3, 8.4], [12.5, 8.4]], '#b82a3a')),
  F(T([[12.5, 8.4], [13.3, 8.4], [14.5, 15.6], [12.9, 17.6], [11.5, 15.6]], '#e8404e')), F(T([[12.9, 8.6], [13.3, 8.4], [14.5, 15.6], [13.6, 16.6]], '#c8303e')),
];
// Head: round, a white face patch, an orange beak, an earbud and its cable. Box 22 x 17; the neck at
// (10, 16.4).
const rpHead = () => [
  E(10, 9.4, 8.4, 7.6, NAVY.base), F(E(12.8, 10.4, 5, 4.8, SNOW)),
  crescent(10, 9.4, 8.4, 7.6, NAVY.sh, { k: 0.18, a0: 120, a1: 220 }), shine(10, 9.4, 8.4, 7.6, '#ffffff', 0, 0.5),
  T([[16.4, 9.8], [21.4, 11.4], [16.4, 13]], BEAK), F(T([[16.4, 9.8], [21.4, 11.4], [16.6, 11]], '#ffd27a')),
  F(E(4.6, 10.6, 1.3, 1.3, '#ffffff')), ...line([[4.6, 11.8], [5, 14], [6.2, 16.2]], 0.5, '#e8ecf8'),
];
// A flipper hanging from its shoulder. Box 7 x 12; the shoulder at (3.5, 1.5).
const rpFlip = (far) => () => [taper([[3.5, 1.5], [3.4, 10.6]], 4.8, 2.2, far ? NAVY.sh : NAVY.base)];
// The briefcase, held by its handle. Box 14 x 11; the handle's top at (7, 1).
const rpCase = () => [
  ...stroke(arcP(7, 3.6, 2.6, 2.4, 180, 360, 8), 1.1, '#5a3a22'),
  R(0.6, 3.4, 12.8, 7, CASE.base), F(R(0.6, 3.4, 12.8, 1.8, CASE.hi)), F(R(0.6, 8.8, 12.8, 1.6, CASE.sh)),
  F(R(2.6, 3.4, 1, 7, CASE.sh)), F(R(10.4, 3.4, 1, 7, CASE.sh)), F(R(6, 4.6, 2, 1.8, '#ffd36b')),
];
const rpFoot = (far) => () => [E(4.4, 2, 4, 1.8, far ? '#e8902a' : BEAK), F(E(3.4, 1.4, 1.4, 0.6, '#ffd890'))];
const RP_BODY = rp('body', 22, 24, rpBody, 2);
const RP_HEAD = rp('head', 22, 17, rpHead, 2);
const RP_FLIP = [false, true].map((f) => rp(`flip${f ? 1 : 0}`, 7, 12, rpFlip(f), 2));
const RP_CASE = rp('case', 14, 11, rpCase, 2);
const RP_FOOT = [false, true].map((f) => rp(`foot${f ? 1 : 0}`, 9, 4, rpFoot(f), 2));
const RP_FACE = { eyes: [[11.4, 9.2, 1.4, 1.8, -1], [14.8, 9, 1.5, 1.9, 1]], mouth: [17.6, 11.4, 1.6], blush: [[10.2, 11.6, 1.2], [15.6, 11.8, 1.1]], iris: '#2a3a6a', lid: 0.1 };
const rpFace = (mood) => sm(`rp|face|${mood}`, 22, 17, () => faceShapes(mood, RP_FACE));
const rpPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (k, far) => ({ name: `foot${k}${tag}`, parent: null, s: RP_FOOT[far ? 1 : 0][i], pivot: [4.4, 3.8], at: (S, a) => { const [dx, l] = pawStep(a.rpU ?? 0, far ? 0.5 : 0, 6, 0.6, 1.8); return [S.x + (far ? -3 : 3) + dx * a.walkW, -l * a.walkW - (far ? 0 : S.tap)]; } });
  return [
    { name: `flipF${tag}`, parent: 'trunk', s: RP_FLIP[1][i], pivot: [3.5, 1.5], at: () => [-3, -17], rot: (S) => S.fF * D2R },
    foot(1, true),
    foot(0, false),
    { name: `body${tag}`, parent: 'trunk', s: RP_BODY[i], pivot: [11, 23.6] },
    { name: `head${tag}`, parent: 'nk', s: RP_HEAD[i], pivot: [10, 16.4] },
    { name: `flipN${tag}`, parent: 'trunk', s: RP_FLIP[0][i], pivot: [3.5, 1.5], at: () => [4, -16], rot: (S) => S.fN * D2R },
    { name: `case${tag}`, parent: 'flipN', s: RP_CASE[i], pivot: [7, 1], at: () => [0, 9.6], rot: (S) => S.cs * D2R },
  ];
};
export const penguinRig = makeRig({
  w: 48, h: 52, soft: true, stride: 6, recover: 0.5,
  springs: { x: [300, 20], lift: [260, 16], tap: [400, 20], tilt: [220, 14], head: [180, 11], fN: [240, 13], fF: [200, 12], cs: [90, 6] },
  fast: ['x', 'tilt', 'fN'],
  kick: { tilt: -180, head: -220, cs: 260 },
  turnKick: { tilt: 120, cs: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.rpU = stepPhase(m, a, 'rp', 6);
    const still = stillOf(a);
    const lu = t % 10;
    // Its act: a look at its watch, late again, a hurried tap of the foot; then bobbing along to
    // whatever's in its earbuds.
    const watch = still ? hold(lu, 1, 1.4, 2.8, 3.2) : 0;
    const late = still ? hold(lu, 2.9, 3.1, 4.6, 5) : 0;
    const bop = still ? hold(lu, 6, 6.4, 9, 9.4) : 0;
    const beat = Math.sin(t * 7.5);
    const br = Math.sin(t * 2.2);
    a.rpBop = bop;
    a.rpMood = late > 0.5 ? 'shout' : bop > 0.5 ? 'happy' : null;
    const fN = 12 - watch * 118 + br * 3;
    const idle = { x: 0, lift: br * 0.4 + bop * Math.max(0, beat) * 1.2, tap: late * Math.max(0, Math.sin(t * 16)) * 1.8, tilt: br * 1.5 + watch * 4 - late * 3, head: watch * 22 + bop * beat * 6 - late * 4, fN, fF: 18 - br * 3 + late * 12 + bop * beat * 8, cs: -fN * 0.9 };
    // Walking: a brisk waddle, leaning into it, the briefcase swinging.
    const s1 = Math.sin(a.rpU * TAU);
    const wN = 10 + s1 * 12;
    const walk = { x: 0, lift: Math.abs(s1) * 1.2, tap: 0, tilt: 7 + s1 * 4, head: -4, fN: wN, fF: 30 - s1 * 10, cs: -wN * 0.8 + s1 * 6 };
    // The briefcase swung up and over, then down.
    const antic = { x: -2, lift: 0.6, tap: 0, tilt: -10, head: -8, fN: 150, fF: 34, cs: -40 };
    const strike = { x: 8, lift: 0, tap: 0, tilt: 14, head: 8, fN: -84, fF: 10, cs: 30 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -3 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'trunk', at: () => [1, -19], rot: (S) => (S.head - S.tilt * 0.4) * D2R },
    ...rpPass(false),
    ...rpPass(true),
    { name: 'face', parent: 'nk', s: (a) => rpFace(moodOf(a, a.rpMood)), pivot: [10, 16.4] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Music notes off its earbuds while it bobs.
    if (a.rpBop > 0.3) {
      const u = (a.t * 0.8) % 1;
      const [ex, ey] = at2(mat('nk'), 3, -12);
      note(ctx, a, ex - 4 - u * 6, ey - u * 12, a.rpBop * (1 - u), '#ffffff', 6);
    }
    // Papers flying out of the briefcase as it lands.
    if (a.ph.strike > 0.2) {
      const [cx, cy] = at2(mat('case'), 7, 5);
      for (let k = 0; k < 3; k++) liveNote(ctx, a, cx + (4 + k * 4) * a.ph.strike, cy - 4 - k * 4 * a.ph.strike, 4, k + a.t * 6, '#ffffff', a.ph.strike);
    }
  },
});
export function penguinStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 44, h: 44, res: 3, shapes: shift([
    ...put(rpFlip(true)(), [3.5, 1.5], -3, -20, 18), ...put(rpFoot(true)(), [4.4, 3.8], -3, 0), ...put(rpFoot(false)(), [4.4, 3.8], 3, 0), ...put(rpBody(), [11, 23.6], 0, -3),
    ...put(rpHead(), [10, 16.4], 1, -22), ...put(faceShapes(fm, RP_FACE), [10, 16.4], 1, -22), ...put(rpFlip(false)(), [3.5, 1.5], 4, -19, 12), ...put(rpCase(), [7, 1], 2.1, -10.2, -8),
  ], 22, 43) };
}

// =====================================================================================
// Sleepy Commuter Sheep
// =====================================================================================
const WOOL = ramp('#f6f1e8', { step: 8, turn: 8 });
const FACEC = ramp('#ecd4bc', { step: 9, turn: 9 });
const COAT = ramp('#d8b47a', { step: 9, turn: 9 });
const PILLOW = ramp('#9fe0c8', { step: 9, turn: 9 });
const HOOF = '#5a4a5a';
const MASK = '#b49ae8';
const ss = pairOf('ss');
// The trench coat: shoulders rounded, a belt and buckle, buttons, a lapel; wool showing at the hem.
// Box 24 x 25; standing at (12, 24.6).
const ssBody = () => [
  ...[[5, 22.6, 2.8], [9.4, 23.2, 2.8], [14.2, 23.2, 2.8], [18.8, 22.6, 2.8]].map(([x, y, r]) => E(x, y, r, r * 0.8, WOOL.base)),
  E(12, 6.4, 7.6, 4.4, COAT.base), T([[4.6, 6], [19.4, 6], [21.8, 22], [2.2, 22]], COAT.base),
  F(T([[2.2, 22], [4.6, 6], [7.4, 6], [5.4, 22]], COAT.sh)), F(T([[12.6, 3.4], [16, 3.6], [13.6, 9.6]], COAT.sh)),
  F(R(3.2, 13, 17.6, 2.2, '#a8824e')), F(R(11.4, 12.6, 2.6, 3, '#f0d49a')),
  F(E(15.2, 8.6, 0.9, 0.9, '#8a6a3a')), F(E(15.4, 11, 0.9, 0.9, '#8a6a3a')), F(E(15.8, 17.6, 0.9, 0.9, '#8a6a3a')),
  F(E(12, 4.4, 4.4, 1.6, WOOL.base)),
];
// Its head: a sheep's long face and soft muzzle, floppy ears out to the back, a woolly cap of
// curls, the sleep mask pushed up on it (a little moon on the mask). Box 26 x 20; the neck at (9, 18).
const ssHead = () => [
  ov(4.4, 11.4, 5.4, 2.2, 22, FACEC.sh),
  E(11.6, 12.4, 7, 6.4, FACEC.base), ov(17.4, 14, 5, 3.8, 14, FACEC.base),
  crescent(11.6, 12.4, 7, 6.4, FACEC.sh, { k: 0.2, a0: 110, a1: 220 }), shine(12, 12, 7, 6, '#ffffff', 0, 0.5), F(ov(19, 14.6, 3, 2.2, 14, '#f6e2d2')),
  F(E(21.2, 13.6, 1.3, 0.9, '#a86a6a')),
  ...[[4.6, 8.6, 2.8], [6, 5.6, 3.6], [10, 4, 4.2], [14.4, 4.6, 3.8], [17.4, 7, 2.4]].map(([x, y, r]) => E(x, y, r, r * 0.9, WOOL.base)), F(E(9.6, 2.8, 2.4, 1.2, '#ffffff')),
  F(R(4, 6, 14, 2.8, MASK)), F(R(4, 6, 14, 0.8, '#d4c4f8')), F(E(12.8, 7.4, 1.4, 1.4, '#ffe08a')), F(E(13.5, 7, 1.2, 1.2, MASK)),
  ov(7.6, 11.6, 5.2, 2.3, 18, FACEC.base), F(ov(7.2, 11.6, 3.4, 1.1, 18, '#f8c4c4')),
];
// The neck pillow: a fat mint U. Box 16 x 9; its middle at (8, 2).
const ssPillow = () => [taper(arcP(8, 1, 6.4, 5.4, 10, 170, 12), 4.4, 4.4, PILLOW.base), ...line(arcP(8, 1.2, 6.4, 5.4, 30, 150, 10), 0.5, '#ffffff')];
// An arm: a coat sleeve, a woolly cuff, a hoof. Box 6 x 10; the shoulder at (3, 1).
const ssArm = (far) => () => [taper([[3, 1], [3, 6.4]], 4.6, 4.2, far ? COAT.sh : COAT.base), E(3, 7, 2.6, 2.2, WOOL.base), E(3, 8.6, 2, 1.4, HOOF)];
const ssFoot = (far) => () => [E(3, 2, 2.8, 1.8, far ? '#3e3240' : HOOF)];
const SS_BODY = ss('body', 24, 25, ssBody, 2);
const SS_HEAD = ss('head', 26, 20, ssHead, 2);
const SS_PILLOW = ss('pillow', 16, 9, ssPillow, 2);
const SS_ARM = [false, true].map((f) => ss(`arm${f ? 1 : 0}`, 6, 10, ssArm(f), 2));
const SS_FOOT = [false, true].map((f) => ss(`foot${f ? 1 : 0}`, 6, 4, ssFoot(f), 2));
const SS_FACE = { eyes: [[13, 11.6, 1.4, 1.8, -1], [16.4, 11.4, 1.5, 1.9, 1]], mouth: [19.4, 16.4, 1.3], blush: [[12, 14.4, 1.2], [17.4, 14.8, 1.1]], iris: '#6a5a4a', lid: 0.5 };
const ssFace = (mood) => sm(`ss|face|${mood}`, 26, 20, () => faceShapes(mood, SS_FACE));
const ssPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (k, far) => ({ name: `foot${k}${tag}`, parent: null, s: SS_FOOT[far ? 1 : 0][i], pivot: [3, 3.6], at: (S, a) => { const [dx, l] = pawStep(a.ssU ?? 0, far ? 0.5 : 0, 5, 0.62, 1.2); return [S.x + (far ? -4 : 4) + dx * a.walkW, -l * a.walkW]; } });
  return [
    { name: `armF${tag}`, parent: 'trunk', s: SS_ARM[1][i], pivot: [3, 1], at: () => [-6, -18], rot: (S) => S.aF * D2R },
    foot(1, true),
    foot(0, false),
    { name: `body${tag}`, parent: 'trunk', s: SS_BODY[i], pivot: [12, 24.6] },
    { name: `head${tag}`, parent: 'nk', s: SS_HEAD[i], pivot: [9, 18] },
    { name: `pillow${tag}`, parent: 'trunk', s: SS_PILLOW[i], pivot: [8, 2], at: () => [2, -21], rot: (S) => S.head * 0.25 * D2R },
    { name: `armN${tag}`, parent: 'trunk', s: SS_ARM[0][i], pivot: [3, 1], at: () => [7, -17], rot: (S) => S.aN * D2R },
  ];
};
export const sleepySheepRig = makeRig({
  w: 46, h: 50, soft: true, stride: 5, recover: 0.7,
  springs: { x: [240, 18], lift: [200, 14], tilt: [150, 12], head: [110, 9], aN: [180, 11], aF: [180, 11] },
  fast: ['x', 'head'],
  kick: { tilt: -140, head: -260 },
  turnKick: { tilt: 100, head: 140 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.ssU = stepPhase(m, a, 'ss', 5);
    const still = stillOf(a);
    const lu = t % 9;
    // Its act: nodding off on its feet. The head sinks, and sinks... then it jerks awake, blinks,
    // and settles; and off it goes again.
    const sink = still ? hold(lu, 0.6, 4.4, 4.7, 4.85) : 0;
    const jerk = still ? hold(lu, 4.7, 4.85, 5.2, 5.9) : 0;
    const br = Math.sin(t * 1.6);
    a.ssSink = sink;
    a.ssMood = sink > 0.45 ? 'sleep' : jerk > 0.3 ? 'shout' : null;
    const idle = { x: 0, lift: br * 1.1 - sink * 1 + jerk * 1.4, tilt: br * 2.4 + sink * 7 - jerk * 5, head: sink * 34 - jerk * 14 + br * 5, aN: 6 + sink * 10 - jerk * 30 + br * 4, aF: -4 + sink * 8 + jerk * 20 - br * 4 };
    // Walking: a sleepy shuffle, head half down.
    const s1 = Math.sin(a.ssU * TAU);
    const walk = { x: 0, lift: Math.abs(s1) * 0.8, tilt: 4 + s1 * 2, head: 14 + s1 * 4, aN: s1 * 10, aF: -s1 * 10 };
    // A big sleepy headbutt of a nod: head pulled back, then down and forward.
    const antic = { x: -3, lift: 1, tilt: -12, head: -26, aN: -24, aF: -16 };
    const strike = { x: 7, lift: 0, tilt: 16, head: 42, aN: 30, aF: 20 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -3 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'trunk', at: () => [2, -21], rot: (S) => (S.head - S.tilt * 0.3) * D2R },
    ...ssPass(false),
    ...ssPass(true),
    { name: 'face', parent: 'nk', s: (a) => ssFace(moodOf(a, a.ssMood)), pivot: [9, 18] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Little z's drifting up while it dozes; a burst of them off its nod.
    const [hx, hy] = at2(mat('nk'), 4, -18);
    if (a.ssSink > 0.4) for (let k = 0; k < 2; k++) {
      const u = (a.t * 0.5 + k * 0.5) % 1;
      zee(ctx, a, hx - 2 - u * 6 + Math.sin(u * 6 + k) * 2, hy - u * 14, 2.6 + u * 2, a.ssSink * Math.sin(u * Math.PI));
    }
    if (a.ph.strike > 0.2) for (let k = 0; k < 3; k++) zee(ctx, a, hx + 8 + k * 4 * a.ph.strike, hy + 6 - k * 5 * a.ph.strike, 2.4 + k, a.ph.strike);
  },
});
export function sleepySheepStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 44, h: 46, res: 3, shapes: shift([
    ...put(ssArm(true)(), [3, 1], -6, -21, -4), ...put(ssFoot(true)(), [3, 3.6], -4, 0), ...put(ssFoot(false)(), [3, 3.6], 4, 0), ...put(ssBody(), [12, 24.6], 0, -3),
    ...put(ssHead(), [9, 18], 2, -24), ...put(faceShapes(fm, SS_FACE), [9, 18], 2, -24), ...put(ssPillow(), [8, 2], 2, -24), ...put(ssArm(false)(), [3, 1], 7, -20, 6),
  ], 22, 45) };
}

// =====================================================================================
// Sticky Note Bird
// =====================================================================================
const NOTE = ramp('#ffe066', { step: 9, turn: 10 });
const PINKN = '#ff9ac0';
const BLUEN = '#8fd0ff';
const MINTN = '#9ae6a0';
const sb = pairOf('sb');
// Body: a round yellow bird, its chest paler, two ruled lines on its side like a note; an orange
// beak. Box 22 x 18; standing at (10, 17.6).
const sbBody = () => [
  E(10, 10, 8.8, 7.8, NOTE.base), F(E(12.4, 12.4, 5.4, 4.2, '#fff4b8')),
  crescent(10, 10, 8.8, 7.8, NOTE.sh, { k: 0.2, a0: 110, a1: 230 }), shine(10, 10, 8.8, 7.8, '#ffffff', 0, 0.6),
  ...line([[4.4, 9.6], [8.6, 9.6]], 0.5, '#e8c040'), ...line([[3.8, 12.2], [8, 12.2]], 0.5, '#e8c040'),
  T([[17.6, 8.4], [21.4, 9.8], [17.6, 11.4]], '#ffa63a'), F(T([[17.6, 8.4], [21.4, 9.8], [17.8, 9.6]], '#ffd08a')),
];
// The crest: three little notes fanned on its head. Box 12 x 9; its root at (6, 8).
const sbCrest = () => [sq(3.4, 5.2, 4, -24, PINKN), sq(6, 3.6, 4.4, 0, BLUEN), sq(8.8, 5.2, 3.8, 26, MINTN)];
// The tail: two notes fanned behind. Box 12 x 10; its root at (10, 3).
const sbTail = () => [sq(5.4, 5, 5, -14, PINKN), sq(4, 6, 4.6, 18, BLUEN), F(T([[1.8, 7.8], [3.4, 8.6], [2.4, 6.8]], '#e8c8e8'))];
// A wing: a sticky note, its corner curling up; held at its top front corner. Box 10 x 10; the
// shoulder at (8.6, 1.4).
const sbWing = (c, cs) => () => [T([[9, 1], [1, 1], [1, 9], [6.6, 9], [9, 6.6]], c), F(T([[9, 6.6], [6.6, 9], [6.8, 6.8]], cs)), F(R(1, 1, 8, 1.6, '#ffffff'))];
const sbFoot = (far) => () => [E(3.4, 1.6, 3, 1.3, far ? '#e8902a' : '#ffa63a'), ...line([[4.6, 1.8], [6.4, 2.4]], 0.6, far ? '#e8902a' : '#ffa63a')];
const SB_BODY = sb('body', 22, 18, sbBody, 2);
const SB_CREST = sb('crest', 12, 9, sbCrest, 2);
const SB_TAIL = sb('tail', 12, 10, sbTail, 2);
const SB_WING = [sb('wing0', 10, 10, sbWing(PINKN, '#d86a94'), 2), sb('wing1', 10, 10, sbWing(BLUEN, '#5a9ac8'), 2)];
const SB_FOOT = [false, true].map((f) => sb(`foot${f ? 1 : 0}`, 8, 4, sbFoot(f), 2));
const SB_FACE = { eyes: [[12.8, 8.2, 1.3, 1.7, -1], [16.2, 8, 1.4, 1.8, 1]], mouth: [18.2, 10.4, 1.2], blush: [[11.2, 10.6, 1.1], [16.4, 11, 1]], iris: '#3a2a4a', lid: 0 };
const sbFace = (mood) => sm(`sb|face|${mood}`, 22, 18, () => faceShapes(mood, SB_FACE));
const sbPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (k, far) => ({ name: `foot${k}${tag}`, parent: null, s: SB_FOOT[far ? 1 : 0][i], pivot: [3.4, 3], at: (S, a) => { const [dx, l] = pawStep(a.sbU ?? 0, far ? 0.5 : 0, 5, 0.58, 1.4); return [S.x + (far ? -2.4 : 2.6) + dx * a.walkW, -l * a.walkW]; } });
  return [
    { name: `wingF${tag}`, parent: 'trunk', s: SB_WING[1][i], pivot: [8.6, 1.4], at: () => [-1, -12], rot: (S) => S.wF * D2R },
    { name: `tail${tag}`, parent: 'trunk', s: SB_TAIL[i], pivot: [10, 3], at: () => [-7, -8], rot: (S) => S.tail * D2R },
    foot(1, true),
    foot(0, false),
    { name: `crest${tag}`, parent: 'trunk', s: SB_CREST[i], pivot: [6, 8], at: () => [1, -15], rot: (S) => S.crest * D2R },
    { name: `body${tag}`, parent: 'trunk', s: SB_BODY[i], pivot: [10, 17.6] },
    { name: `wingN${tag}`, parent: 'trunk', s: SB_WING[0][i], pivot: [8.6, 1.4], at: () => [1, -11], rot: (S) => S.wN * D2R },
  ];
};
export const stickyBirdRig = makeRig({
  w: 42, h: 40, soft: true, stride: 5, recover: 0.5,
  springs: { x: [300, 20], lift: [280, 16], tilt: [220, 14], wN: [320, 14], wF: [300, 14], tail: [160, 9], crest: [160, 8] },
  fast: ['x', 'wN', 'wF'],
  kick: { tilt: -200, tail: 260, crest: 260 },
  turnKick: { tail: 220, crest: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.sbU = stepPhase(m, a, 'sb', 5);
    const still = stillOf(a);
    const lu = t % 9;
    // Its act: preening under its wing, a happy flutter; and now and then a note peels off its
    // tail and see-saws down to the floor (fx).
    const preen = still ? hold(lu, 1.2, 1.6, 3, 3.4) : 0;
    const flut = still ? hold(lu, 5, 5.2, 6, 6.3) : 0;
    const flap = Math.abs(Math.sin(t * 22));
    const br = Math.sin(t * 2.4);
    a.sbPeel = still ? Math.max(0, Math.min(1, (lu - 7) / 2)) : 0;
    a.sbMood = flut > 0.5 ? 'happy' : preen > 0.5 ? 'blink' : null;
    const idle = { x: 0, lift: br * 0.4 + flut * flap * 1.6, tilt: br * 2 + preen * 18, wN: br * 4 + preen * 30 + flut * flap * 60, wF: -br * 4 + flut * flap * 50, tail: br * 6 - preen * 10, crest: -br * 5 + flut * flap * 10 };
    // Walking: quick little steps, a bob, the tail flicking.
    const s1 = Math.sin(a.sbU * TAU);
    const walk = { x: 0, lift: Math.abs(s1) * 1.4, tilt: 8, wN: 6 + s1 * 6, wF: 6 - s1 * 6, tail: s1 * 12, crest: -6 };
    // Flinging a note: the near wing drawn up and back, then flicked forward.
    const antic = { x: -2, lift: 1, tilt: -12, wN: 110, wF: 20, tail: 14, crest: 10 };
    const strike = { x: 5, lift: 0, tilt: 12, wN: -64, wF: -10, tail: -12, crest: -14 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -2 - S.lift], rot: (S) => S.tilt * D2R },
    ...sbPass(false),
    ...sbPass(true),
    { name: 'face', parent: 'trunk', s: (a) => sbFace(moodOf(a, a.sbMood)), pivot: [10, 17.6] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // A note peeling off its tail and see-sawing down.
    if (a.sbPeel > 0) {
      const u = a.sbPeel;
      const [tx, ty] = at2(mat('tail'), 3, 5);
      liveNote(ctx, a, tx - 4 - u * 8 + Math.sin(u * 9) * 4, ty + u * 18, 3.6, Math.sin(u * 9) * 0.7, u < 0.5 ? '#ff9ac0' : '#8fd0ff', Math.min(1, (1 - u) * 3));
    }
  },
});
export function stickyBirdStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 40, h: 34, res: 3, shapes: shift([
    ...put(sbWing(BLUEN, '#5a9ac8')(), [8.6, 1.4], -1, -14), ...put(sbTail(), [10, 3], -7, -10), ...put(sbFoot(true)(), [3.4, 3], -2.4, 0), ...put(sbFoot(false)(), [3.4, 3], 2.6, 0),
    ...put(sbCrest(), [6, 8], 1, -17), ...put(sbBody(), [10, 17.6], 0, -2), ...put(faceShapes(fm, SB_FACE), [10, 17.6], 0, -2), ...put(sbWing(PINKN, '#d86a94')(), [8.6, 1.4], 1, -13),
  ], 20, 33) };
}

// =====================================================================================
// Stapler Croc
// =====================================================================================
const CROC = ramp('#6ac46a', { step: 10, turn: 10 });
const CBELLY = '#f4efc0';
const RED = ramp('#e8404e', { step: 10, turn: 8 });
const STEEL = '#d0d4e0';
const sc = pairOf('scroc');
// Body: chubby and upright, a pale banded belly, ridges down its back. Box 22 x 22; standing at
// (11, 21.6).
const scBody = () => [
  ...[[3.6, 7], [2.4, 11], [2.6, 15.4]].map(([x, y]) => T([[x + 1.8, y - 1.6], [x - 1.6, y], [x + 1.8, y + 1.6]], CROC.sh)),
  E(11, 12.4, 9, 9.2, CROC.base), F(E(13.6, 13.8, 5.4, 7, CBELLY)),
  ...[10, 13, 16].map((y) => F(R(10.2, y, 7, 0.6, '#ddd59a'))),
  crescent(11, 12.4, 9, 9.2, CROC.sh, { k: 0.2, a0: 110, a1: 230 }), shine(11, 12.4, 9, 9.2, '#ffffff', 0, 0.5),
];
// The tail, from its root at the back. Box 18 x 9; the root at (15.6, 3.6).
const scTail = () => [taper([[15.6, 3.6], [2, 6.4]], 7, 1.6, CROC.base), ...[[11, 1.4], [7, 2.8]].map(([x, y]) => T([[x + 1.6, y + 0.8], [x, y - 1.2], [x - 1.4, y + 1.2]], CROC.sh))];
// The stapler's top, its upper jaw: red with a steel strip, the croc's eyes in two green bumps on
// top, staples for teeth. Box 24 x 11; the hinge at (3, 7.4).
const scTop = () => [
  E(8, 3.6, 3.2, 3, CROC.base), E(13, 3.4, 3.2, 3, CROC.base),
  T([[1, 5], [21, 5.4], [23.4, 6.6], [23.4, 8.4], [2.4, 9.6], [1, 8.4]], RED.base), F(T([[1, 5], [21, 5.4], [23, 6.4], [1.6, 6.6]], RED.hi)),
  F(R(5, 7, 15, 1.2, STEEL)), F(E(22.2, 7.2, 0.6, 0.5, '#7a1a2a')),
  ...[8, 11, 14, 17, 20].map((x) => F(T([[x - 1, 9.4], [x + 1, 9.4], [x, 10.6]], '#ffffff'))),
];
// The stapler's base, its lower jaw: dark, a steel anvil plate, teeth up. Box 24 x 7; the hinge at
// (3, 1.8).
const scBase = () => [
  T([[1, 0.8], [22.6, 1.6], [23.6, 3.4], [22, 5.8], [2, 5.8], [0.8, 3.6]], '#4a4a5c'), F(R(4, 1.4, 16, 1.2, STEEL)), F(R(17, 1.2, 3.6, 1.4, '#9aa0b4')),
  ...[9, 12, 15, 18].map((x) => F(T([[x - 1, 1.2], [x + 1, 1.2], [x, 0]], '#ffffff'))),
];
const scArm = (far) => () => [taper([[3, 1], [3.6, 5]], 3.6, 3, far ? CROC.sh : CROC.base), F(E(4, 5.6, 1.6, 1, '#ffffff'))];
const scFoot = (far) => () => [E(4, 2, 3.6, 1.8, far ? CROC.sh : CROC.base), F(E(6.4, 2.6, 0.8, 0.6, '#ffffff')), F(E(4.8, 2.9, 0.8, 0.6, '#ffffff'))];
const SC_BODY = sc('body', 22, 22, scBody, 2);
const SC_TAIL = sc('tail', 18, 9, scTail, 2);
const SC_TOP = sc('top', 24, 11, scTop, 2);
const SC_BASE = sc('base', 24, 7, scBase, 2);
const SC_ARM = [false, true].map((f) => sc(`arm${f ? 1 : 0}`, 6, 7, scArm(f), 2));
const SC_FOOT = [false, true].map((f) => sc(`foot${f ? 1 : 0}`, 8, 4, scFoot(f), 2));
const SC_FACE = { eyes: [[8.2, 3.8, 1.3, 1.6, -1], [13.2, 3.6, 1.4, 1.7, 1]], mouth: [5.4, 8.2, 1.1], blush: [[10.6, 6.2, 1]], iris: '#3a5a2a', lid: 0.2 };
const scFace = (mood) => sm(`scroc|face|${mood}`, 24, 11, () => faceShapes(mood, SC_FACE));
const scPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (k, far) => ({ name: `foot${k}${tag}`, parent: null, s: SC_FOOT[far ? 1 : 0][i], pivot: [4, 3.6], at: (S, a) => { const [dx, l] = pawStep(a.scU ?? 0, far ? 0.5 : 0, 6, 0.6, 1.6); return [S.x + (far ? -3.6 : 3.6) + dx * a.walkW, -l * a.walkW]; } });
  return [
    { name: `armF${tag}`, parent: 'trunk', s: SC_ARM[1][i], pivot: [3, 1], at: () => [-2, -12], rot: (S) => S.aF * D2R },
    { name: `tail${tag}`, parent: 'trunk', s: SC_TAIL[i], pivot: [15.6, 3.6], at: () => [-7, -5], rot: (S) => S.tail * D2R },
    foot(1, true),
    foot(0, false),
    { name: `body${tag}`, parent: 'trunk', s: SC_BODY[i], pivot: [11, 21.6] },
    { name: `base${tag}`, parent: 'hd', s: SC_BASE[i], pivot: [3, 1.8], at: () => [0, 1.4] },
    { name: `top${tag}`, parent: 'jaw', s: SC_TOP[i], pivot: [3, 7.4] },
    { name: `armN${tag}`, parent: 'trunk', s: SC_ARM[0][i], pivot: [3, 1], at: () => [7, -10], rot: (S) => S.aN * D2R },
  ];
};
export const staplerCrocRig = makeRig({
  w: 52, h: 44, soft: true, stride: 6, recover: 0.5,
  springs: { x: [300, 20], lift: [260, 16], tilt: [220, 14], head: [220, 13], jaw: [420, 18], aN: [220, 12], aF: [220, 12], tail: [120, 8] },
  fast: ['x', 'jaw', 'head'],
  kick: { tilt: -160, head: -200, tail: 240 },
  turnKick: { tail: 220, head: 120 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.scU = stepPhase(m, a, 'sc', 6);
    const still = stillOf(a);
    const lu = t % 8;
    // Its act: click-click-clacking its jaw, very pleased with the sound; a slow swish of the tail.
    const clack = still ? hold(lu, 2, 2.2, 3.6, 3.8) : 0;
    const clk = clack * Math.max(0, Math.sin(t * 14)) * 22;
    const br = Math.sin(t * 2);
    a.scClack = clack;
    a.scMood = clack > 0.5 ? 'happy' : null;
    const idle = { x: 0, lift: br * 0.4, tilt: br * 1.5, head: br * 2 - clack * 6, jaw: 3 + clk, aN: br * 6, aF: -br * 6, tail: Math.sin(t * 1.6) * 10 };
    // Walking: a stubby waddle, the tail swinging behind.
    const s1 = Math.sin(a.scU * TAU);
    const walk = { x: 0, lift: Math.abs(s1) * 1.2, tilt: 5 + s1 * 2, head: -2, jaw: 5, aN: s1 * 14, aF: -s1 * 14, tail: s1 * 16 };
    // Opening wide, then CLACK: a staple fired off.
    const antic = { x: -3, lift: 1, tilt: -10, head: -16, jaw: 40, aN: -30, aF: -20, tail: 12 };
    const strike = { x: 6, lift: 0, tilt: 12, head: 8, jaw: 0, aN: 24, aF: 12, tail: -16 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -3 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'hd', parent: 'trunk', at: () => [5, -17], rot: (S) => S.head * D2R },
    { name: 'jaw', parent: 'hd', at: () => [0, 0], rot: (S) => -S.jaw * D2R },
    ...scPass(false),
    ...scPass(true),
    { name: 'face', parent: 'jaw', s: (a) => scFace(moodOf(a, a.scMood)), pivot: [3, 7.4] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // A glint off the steel as it clacks; a spark as it fires.
    const [jx, jy] = at2(mat('jaw'), 21, 8);
    if (a.scClack > 0.5 && Math.sin((a.t + (a.uidOff ?? 0)) * 14) > 0.9) sparkle(ctx, a, jx + 2, jy - 2, 2, a.alpha, '#ffffff');
    if (a.ph.strike > 0.2) for (let k = 0; k < 3; k++) sparkle(ctx, a, jx + 3 + k * 3, jy - 3 + k * 3, 2.2 * a.ph.strike, a.alpha * a.ph.strike, k % 2 ? '#ffffff' : '#d0d4e0');
  },
});
export function staplerCrocStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 50, h: 36, res: 3, shapes: shift([
    ...put(scArm(true)(), [3, 1], -2, -15), ...put(scTail(), [15.6, 3.6], -7, -8), ...put(scFoot(true)(), [4, 3.6], -3.6, 0), ...put(scFoot(false)(), [4, 3.6], 3.6, 0), ...put(scBody(), [11, 21.6], 0, -3),
    ...put(scBase(), [3, 1.8], 5, -18.6), ...put(scTop(), [3, 7.4], 5, -20, -3), ...put(faceShapes(fm, SC_FACE), [3, 7.4], 5, -20, -3), ...put(scArm(false)(), [3, 1], 7, -13),
  ], 18, 35) };
}
