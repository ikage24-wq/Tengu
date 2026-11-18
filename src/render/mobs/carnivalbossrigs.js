// The Clockwork Carnival's two star acts, remade for Chapter 6 (2026-11-18): upright, chibi, rigged
// on rig.js, outer outline only, faces bare, everything that grows out of them rooted in them.
//
//   leonie      Leonie, the Lioness Acrobat: a little lioness in a sequinned leotard and a short cape,
//               a fluffy mane, a tiny fez, balancing on a big striped star ball that rolls her
//               along, a gold hoop in her paw. Spins the hoop, waves to the crowd. Hoop swipe. Her
//               pounce (m.aloft): up off the ball to the trapeze, the ball rolling across beneath,
//               and down on the mark (world/carnival.js).
//   marionetta  Madame Marionette: a tall doll lady in a purple gown and a big pink bow, ringlets,
//               a control cross in each hand, two little dancers on their strings (fewer as she
//               cuts them loose: m.mech.puppets). Glides; makes them dance. Yanks the crosses and
//               flings the dancers at you.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, ov, arcP, taper, pairOf, faceSprite, hold, stepPhase, put, shift, MOODS, moodOf, faceShapes, sparkle, puff, INK } from './rigkit.js';
import { puppetShapes } from './toyrigs.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
// A boss drawn a size up: the whole of her, evenly (nothing stretched), about her feet.
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
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });

// =====================================================================================
// Leonie, the Lioness Acrobat
// =====================================================================================
const LFUR = ramp('#ffbe6a', { step: 9, turn: 10 });
const MANE = ramp('#ff8a3a', { step: 10, turn: 10 });
const LEOT = ramp('#a86ae8', { step: 10, turn: 8 });
const CAPE = ramp('#ff5a7a', { step: 10, turn: 8 });
const BALL = ['#ff7aa8', '#fff4e0', '#7fd8ff', '#fff4e0'];
const lo = pairOf('lo');
// The star ball: stripes round it, stars on them, shiny. Box 40 x 40; its middle at (20, 20).
const loBall = () => {
  const out = [E(20, 20, 18.6, 18.6, BALL[1])];
  for (let k = 0; k < 4; k++) {
    const a0 = k * 90;
    const pts = [[20, 20]];
    for (let j = 0; j <= 8; j++) {
      const a = (a0 + j * 5.6) * D2R;
      pts.push([20 + Math.cos(a) * 18.6, 20 + Math.sin(a) * 18.6]);
    }
    out.push(T(pts, BALL[k % 2 ? 2 : 0]));
  }
  for (const [x, y] of [[12, 12], [28, 26], [26, 10], [12, 28]]) out.push(T([[x, y - 3], [x + 1, y - 1], [x + 3, y - 1], [x + 1.4, y + 0.6], [x + 2, y + 3], [x, y + 1.6], [x - 2, y + 3], [x - 1.4, y + 0.6], [x - 3, y - 1], [x - 1, y - 1]], GOLD.base));
  out.push(E(20, 20, 3, 3, GOLD.base));
  return out;
};
const loBallShine = () => [F(E(13, 11, 5, 3, '#ffffff')), crescent(20, 20, 18.6, 18.6, '#d8c8e8', { k: 0.18, a0: 30, a1: 160 })];
// A leg in gold tights, a slipper. Box 9 x 16; the hip at (4.5, 1).
const loLeg = (far) => () => [taper([[4.5, 1], [4.4, 8], [4.6, 13]], 6, 5, far ? GOLD.sh : GOLD.base), E(5.6, 14, 3.4, 2, far ? CAPE.sh : CAPE.base)];
// Her body: a sequinned leotard, a star on the chest, fur at the collar. Box 18 x 20; the hips at (9, 19).
const loBody = () => [
  T([[2.4, 19], [1.6, 8], [4, 2], [14, 2], [16.4, 8], [15.6, 19]], LEOT.base),
  ...[[5, 8], [12, 7], [7, 14], [13, 15], [4, 16]].map(([x, y]) => F(E(x, y, 0.9, 0.9, '#f0e0ff'))),
  T([[9, 6], [10.4, 9.4], [14, 9.6], [11.2, 11.8], [12.2, 15.4], [9, 13.4], [5.8, 15.4], [6.8, 11.8], [4, 9.6], [7.6, 9.4]], GOLD.base),
  E(9, 2.4, 6, 2.6, LFUR.base), F(E(8, 2, 3, 1, LFUR.hi)),
  crescent(9, 11, 7, 8, LEOT.sh, { k: 0.2, a0: 100, a1: 200 }),
];
// The cape: short, scalloped, from her shoulders. Box 18 x 18; tied on at (9, 1).
const loCape = () => {
  const hem = [];
  for (let k = 0; k <= 6; k++) hem.push([1 + k * 2.6, 16 + (k % 2 ? 1.6 : 0)]);
  return [T([[5, 1], [13, 1], [17, 16], ...hem.reverse(), [0, 16]], CAPE.base), F(T([[5, 1], [7, 1], [3, 16], [1, 16]], CAPE.hi)), crescent(9, 10, 8, 8, CAPE.sh, { k: 0.2, a0: 10, a1: 90 })];
};
// Her head: round, round ears, a muzzle; the mane is its own part behind. Box 30 x 28; the neck at (15, 27).
const loHead = () => [
  E(7.6, 6.4, 4.2, 4, LFUR.base), F(E(7.6, 6.8, 2.2, 2, '#ffd8c0')), E(22.4, 6, 4, 3.8, LFUR.base), F(E(22.4, 6.4, 2, 1.8, '#ffd8c0')),
  E(15, 15.6, 11, 10, LFUR.base), crescent(15, 15.6, 11, 10, LFUR.sh, { k: 0.18, a0: 100, a1: 200 }),
  E(19.6, 19.6, 5.4, 3.8, '#fff2e0'), E(22.4, 17.4, 1.8, 1.4, '#c0505a'), F(E(22, 17, 0.6, 0.4, '#ffffff')),
  // The tiny fez, its tassel rooted at its top.
  T([[10, 5.4], [11, 0], [18, 0], [19, 5.4]], '#e8405a'), F(R(11, 0.6, 1.6, 4.6, '#ff7a8a')), R(9.4, 4.4, 10.2, 1.4, GOLD.base),
];
// The mane: a ring of fluffy puffs round the face. Box 36 x 34; centred on the face at (18, 18).
const loMane = () => {
  const out = [];
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * TAU;
    out.push(E(18 + Math.cos(a) * 13, 18 + Math.sin(a) * 12, 5.6, 5.2, k % 2 ? MANE.base : MANE.sh));
  }
  out.push(E(18, 18, 13, 12, MANE.base));
  for (let k = 0; k < 14; k += 2) {
    const a = ((k + 0.5) / 14) * TAU;
    out.push(F(E(18 + Math.cos(a) * 13, 18 + Math.sin(a) * 12 - 1, 2.6, 1.6, MANE.hi)));
  }
  return out;
};
const loArm = (far) => () => [taper([[2, 3], [8, 3.4], [11, 3.4]], 4.6, 4, far ? LFUR.sh : LFUR.base), E(11.6, 3.4, 2.8, 2.6, far ? LFUR.sh : LFUR.base), F(E(12.4, 3.6, 1.2, 1, '#ffd8c0'))];
// The tail: a curving rope of fur, a fluffy tuft. Box 18 x 18; rooted at (1, 16).
const loTail = () => [taper([[1, 16], [6, 13], [9, 7], [12, 3]], 2.8, 2.2, LFUR.base), E(13.4, 3, 3.4, 3, MANE.base), F(E(13, 2.2, 1.4, 1, MANE.hi))];
// The hoop: a gold ring with ribbons. Box 26 x 26; held at (13, 25).
const loHoop = () => [...stroke(arcP(13, 13, 11, 11, 0, 360, 28), 2.2, GOLD.base, false), ...stroke(arcP(13, 13, 11, 11, 200, 300, 10), 0.8, '#fff2b0'), T([[13, 24], [10, 28], [12.6, 26]], '#7fd8ff'), T([[13, 24], [16, 28], [13.4, 26]], CAPE.base)];
const LO_BALL = lo('ball', 40, 40, loBall, 2);
const LO_SHINE = lo('ballshine', 40, 40, loBallShine, 2);
const LO_LEG = [false, true].map((f) => lo(`leg${f ? 1 : 0}`, 9, 16, loLeg(f), 2));
const LO_BODY = lo('body', 18, 20, loBody, 2);
const LO_CAPE = lo('cape', 18, 18, loCape, 2);
const LO_HEAD = lo('head', 30, 28, loHead, 2);
const LO_MANE = lo('mane', 36, 34, loMane, 2);
const LO_ARM = [false, true].map((f) => lo(`arm${f ? 1 : 0}`, 15, 7, loArm(f), 2));
const LO_TAIL = lo('tail', 18, 18, loTail, 2);
const LO_HOOP = lo('hoop', 26, 30, loHoop, 2);
const LO_FACE = { eyes: [[18, 13.4, 2.3, 2.9, 1], [11.4, 13.6, 1.9, 2.5, -1]], mouth: [19.6, 22.4, 2.2], blush: [[9.6, 18.4, 2], [24.6, 17, 1.3]], iris: '#ff9a2a', lid: 0, lashes: 1 };
const loFace = (mood) => sm(`lo|face|${mood}`, 30, 28, () => faceShapes(mood, LO_FACE));
// Her pounce, from world/carnival.js's m.aloft = { x, at } (1.8 s): up off the ball to the trapeze
// (`lift`), hanging there, then down onto the mark (`dx`), the ball rolling across underneath.
function leap(m, a) {
  const L = m.aloft;
  if (!L) return { lift: 0, dx: 0, ball: 0, tuck: 0 };
  const u = clamp(1 - (L.at - a.now) / 1.8, 0, 1);
  const up = smooth(clamp(u / 0.26, 0, 1));
  const down = smooth(clamp((u - 0.74) / 0.26, 0, 1));
  const dx = L.x - m.x;
  return { lift: 300 * up * (1 - down) + Math.sin(down * Math.PI) * 30, dx: dx * down, ball: dx * smooth(clamp((u - 0.3) / 0.6, 0, 1)), tuck: Math.sin(up * Math.PI) + Math.sin(down * Math.PI) };
}
const loPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `ball${tag}`, parent: 'ballj', s: LO_BALL[i], pivot: [20, 20], rot: (S) => S.roll },
    { name: `tail${tag}`, parent: 'hip', s: LO_TAIL[i], pivot: [1, 16], at: () => [-6, -3], rot: (S) => (10 + S.tail) * D2R },
    { name: `cape${tag}`, parent: 'chest', s: LO_CAPE[i], pivot: [9, 1], at: () => [-1, -17], rot: (S) => (8 + S.cape) * D2R },
    { name: `armF${tag}`, parent: 'chest', s: LO_ARM[1][i], pivot: [2, 3], at: () => [-2, -15], rot: (S) => S.armF * D2R },
    { name: `legF${tag}`, parent: 'hip', s: LO_LEG[1][i], pivot: [4.5, 1], at: () => [-2.4, -1], rot: (S) => S.legF * D2R },
    { name: `legN${tag}`, parent: 'hip', s: LO_LEG[0][i], pivot: [4.5, 1], at: () => [2.4, -1], rot: (S) => S.legN * D2R },
    { name: `body${tag}`, parent: 'chest', s: LO_BODY[i], pivot: [9, 19] },
    { name: `mane${tag}`, parent: 'nk', s: LO_MANE[i], pivot: [18, 18], at: () => [0, -12], rot: (S) => S.mane * D2R },
    { name: `head${tag}`, parent: 'nk', s: LO_HEAD[i], pivot: [15, 27] },
    { name: `hoop${tag}`, parent: 'handN', s: LO_HOOP[i], pivot: [13, 25], rot: (S, a) => (S.hoop + (a.loSpin ?? 0) * (1 - a.walkW) * (1 - a.atk)) * D2R },
    { name: `armN${tag}`, parent: 'chest', s: LO_ARM[0][i], pivot: [2, 3], at: () => [3, -14], rot: (S) => S.armN * D2R },
  ];
};
export const leonieRig = sized(makeRig({
  w: 80,
  h: 130,
  soft: true,
  stride: 40,
  recover: 0.6,
  springs: { x: [240, 18], lift: [220, 14], tilt: [160, 10], head: [130, 9], mane: [90, 6], armN: [170, 11], armF: [170, 11], legN: [220, 14], legF: [220, 14], cape: [80, 6], tail: [80, 5], hoop: [140, 8], roll: [600, 40] },
  fast: ['x', 'armN', 'hoop', 'tilt'],
  kick: { tilt: -140, mane: 300, head: -200, cape: 300, tail: 300 },
  turnKick: { cape: 300, tail: 300, mane: 160 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.loU = stepPhase(m, a, 'lo', 40);
    a.mo.loRoll = (m.odo ?? 0) / 19;
    const L = (a.leap = leap(m, a));
    const lu = t % 10;
    const wave = hold(lu, 2, 2.4, 3.6, 4);
    a.loWave = wave;
    const spinHoop = hold(lu, 5.6, 6, 8.4, 8.8);
    // (The hoop twirls round her wrist: a whole number of turns, speeding up and slowing down.)
    a.loSpin = 360 * 6 * smooth(clamp((lu - 5.6) / 3.2, 0, 1));
    const br = Math.sin(t * 2);
    const bal = Math.sin(t * 1.3);
    const angry = m.mech?.roared ? 1 : 0;
    const idle = {
      x: 0, lift: br * 0.6, tilt: bal * 4, head: -bal * 3 + br * 2, mane: br * 3 + angry * Math.sin(t * 9) * 3,
      armN: 30 - wave * 150 + wave * Math.sin(t * 10) * 16 - spinHoop * 40, armF: -40 - bal * 20,
      legN: bal * 4, legF: -bal * 4, cape: br * 4, tail: Math.sin(t * 2.6) * 14, hoop: 0, roll: a.mo.loRoll,
    };
    // Rolling along on the ball: her feet walk its top, arms out for balance.
    const s1 = Math.sin(a.loU * TAU);
    const walk = { x: 0, lift: Math.abs(s1) * 1, tilt: 6, head: -4, mane: -s1 * 4, armN: -20 + s1 * 14, armF: -60 - s1 * 14, legN: s1 * 20, legF: -s1 * 20, cape: -14, tail: -20, hoop: -20, roll: a.mo.loRoll };
    // The hoop swipe: wound back over her shoulder, then swept out in front.
    const antic = { x: -2, lift: -1.6, tilt: 10, head: 8, mane: -6, armN: -160, armF: 20, legN: 10, legF: -10, cape: 10, tail: -10, hoop: -40, roll: a.mo.loRoll };
    const strike = { x: 5, lift: 1, tilt: -14, head: -8, mane: 10, armN: 40, armF: -90, legN: -14, legF: 12, cape: -24, tail: 30, hoop: 60, roll: a.mo.loRoll };
    const S = stateBlend(a, idle, walk, antic, strike);
    // (Up to the trapeze: tucked, arms reaching up; down onto the mark: claws first.)
    if (L.tuck > 0.01) Object.assign(S, { armN: -150 * L.tuck + S.armN * (1 - L.tuck), armF: -160 * L.tuck + S.armF * (1 - L.tuck), legN: 40 * L.tuck, legF: 60 * L.tuck, cape: -30 * L.tuck, tail: -40 * L.tuck });
    return S;
  },
  parts: [
    { name: 'ballj', parent: null, at: (S, a) => [a.leap?.ball ?? 0, -19] },
    { name: 'hip', parent: null, at: (S, a) => [S.x + (a.leap?.dx ?? 0), -52 - S.lift - (a.leap?.lift ?? 0)], rot: (S) => S.tilt * D2R },
    { name: 'chest', parent: 'hip', at: () => [0, 1] },
    { name: 'nk', parent: 'chest', at: () => [1, -18], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'handN', parent: 'armN', at: () => [12, 3.4] },
    ...loPass(false),
    ...loPass(true),
    { name: 'ballShine', parent: 'ballj', s: () => LO_SHINE[1](), pivot: [20, 20] },
    { name: 'face', parent: 'nk', s: (a) => loFace(moodOf(a, m0(a))), pivot: [15, 27] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    if (a.ph.strike > 0.15) {
      const [hx, hy] = at2(mat('hoop'), 0, -12);
      sparkle(ctx, a, hx, hy, 8 * a.ph.strike, a.alpha * a.ph.strike, '#fff2b0');
    }
    // A puff of sawdust where she lands from the trapeze.
    const L = m.aloft;
    if (L && L.at - a.now < 0.2) puff(ctx, a, a.leap.dx, -2, 14, a.alpha * 0.5);
  },
}), 1.3);
const m0 = (a) => (a.ph.atk ? null : a.leap?.tuck > 0.2 ? 'shout' : a.loWave > 0.5 ? 'happy' : null);
export function leonieStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'happy';
  const hy = -52;
  return {
    w: 80, h: 120, res: 2,
    shapes: shift([
      ...put(loBall(), [20, 20], 0, -19), ...put(loTail(), [1, 16], -6, hy - 3, 10), ...put(loCape(), [9, 1], -1, hy - 16, 8), ...put(loArm(true)(), [2, 3], -2, hy - 14, -40),
      ...put(loLeg(true)(), [4.5, 1], -2.4, hy), ...put(loLeg(false)(), [4.5, 1], 2.4, hy), ...put(loBody(), [9, 19], 0, hy + 1),
      ...put(loMane(), [18, 18], 1, hy - 29), ...put(loHead(), [15, 27], 1, hy - 17), ...put(faceShapes(fm, LO_FACE), [15, 27], 1, hy - 17),
      ...put(loHoop(), [13, 25], 14, hy - 10), ...put(loArm(false)(), [2, 3], 3, hy - 13, 30),
    ], 40, 119),
  };
}

// =====================================================================================
// Madame Marionette
// =====================================================================================
const GOWN = ramp('#9a6ae0', { step: 10, turn: 8 });
const PORC = ramp('#fff0ec', { step: 7, turn: 8, lift: 3 });
const HAIR = ramp('#e8c4ff', { step: 9, turn: 10 });
const BOW = ramp('#ff8fb8', { step: 9, turn: 8 });
const ma = pairOf('ma');
// The gown: a wide bell to the floor, gold trim, a frill at the hem. Box 46 x 40; the waist at (23, 1).
const maGown = () => {
  const hem = [];
  for (let k = 0; k <= 12; k++) hem.push([1 + k * 3.67, 37 + (k % 2 ? 2 : 0)]);
  return [
    T([[15, 1], [31, 1], [40, 20], [45, 37], ...hem.reverse(), [1, 37], [6, 20]], GOWN.base),
    F(T([[15, 1], [19, 1], [8, 37], [3, 37]], GOWN.hi)), crescent(23, 22, 20, 18, GOWN.sh, { k: 0.2, a0: 10, a1: 100 }),
    R(2, 33.4, 42, 2.2, GOLD.base), ...[0, 1, 2, 3, 4, 5].map((k) => F(E(6 + k * 6.8, 26 + (k % 2) * 2, 1.6, 1.6, GOLD.base))),
    T([[18, 2], [28, 2], [30, 28], [16, 28]], '#c8a8f0'), ...[6, 12, 18, 24].map((y) => F(R(18, y, 10, 1, '#e8d8ff'))),
  ];
};
const maBodice = () => [T([[3, 14], [2, 4], [6, 1], [14, 1], [18, 4], [17, 14]], GOWN.base), T([[3, 2], [10, 6], [17, 2], [14, 0], [10, 2.4], [6, 0]], '#ffffff'), F(E(10, 8, 1.2, 1.2, BOW.base)), crescent(10, 8, 8, 6, GOWN.sh, { k: 0.2, a0: 100, a1: 200 })];
// Her head: a china face, lilac hair, a huge pink bow on top. Box 34 x 32; the neck at (17, 31).
const maHead = () => [
  E(16, 18, 13, 12, HAIR.base),
  E(17, 19.6, 10.6, 10, PORC.base), crescent(17, 19.6, 10.6, 10, PORC.sh, { k: 0.18, a0: 100, a1: 200 }),
  T([[6.4, 17], [8.6, 10], [15, 7.6], [23, 8.6], [27.6, 15], [23, 12], [19, 14], [15, 12], [10.6, 15]], HAIR.base), F(E(13, 10, 3, 1.2, HAIR.hi)),
  T([[17, 7], [5, 0.6], [4, 9], [17, 8.4]], BOW.base), T([[17, 7], [29, 0.6], [30, 9], [17, 8.4]], BOW.base), E(17, 7.4, 3, 2.6, BOW.sh), F(E(16, 6.6, 1, 0.8, '#ffffff')),
  F(T([[9, 3], [6, 2], [6, 6]], BOW.hi)), F(T([[25, 3], [28, 2], [28, 6]], BOW.hi)),
];
const maCurl = (far) => () => [taper([[3, 1], [1.6, 5], [3.4, 9], [2, 13]], 4.6, 3.6, far ? HAIR.sh : HAIR.base), E(2.4, 13.4, 2.4, 2.2, far ? HAIR.sh : HAIR.base)];
const maArm = (far) => () => [taper([[2, 2.6], [9, 3], [13, 3]], 4, 3.4, far ? GOWN.sh : GOWN.base), E(14, 3, 2.4, 2.2, far ? PORC.sh : PORC.base), T([[8, 0.6], [12, 1], [12, 5.4], [8, 5.4]], '#ffffff')];
// A control cross: two wooden bars crossed, a gold knob. Box 22 x 22; held at its middle (11, 11).
const maCross = () => [R(1, 9.6, 20, 2.8, '#b8865a'), F(R(1, 9.6, 20, 0.9, '#d8a878')), R(9.6, 1, 2.8, 20, '#a87a4e'), E(11, 11, 2.2, 2.2, GOLD.base), ...[[1, 11], [21, 11], [11, 1], [11, 21]].map(([x, y]) => E(x, y, 1.2, 1.2, '#8a6040'))];
const MA_GOWN = ma('gown', 46, 40, maGown, 2);
const MA_BOD = ma('bodice', 20, 14, maBodice, 2);
const MA_HEAD = ma('head', 34, 32, maHead, 2);
const MA_CURL = [false, true].map((f) => ma(`curl${f ? 1 : 0}`, 6, 16, maCurl(f), 2));
const MA_ARM = [false, true].map((f) => ma(`arm${f ? 1 : 0}`, 17, 6, maArm(f), 2));
const MA_CROSS = ma('cross', 22, 22, maCross, 2);
const MA_PUP = ma('puppet', 28, 34, () => puppetShapes('happy'), 2);
const MA_FACE = { eyes: [[20.6, 18.8, 2.4, 3.2, 1], [13.2, 19, 2, 2.8, -1]], mouth: [18.6, 25.4, 2.2], blush: [[11.6, 23.4, 2], [25, 23, 1.5]], iris: '#c050a8', lid: 0, lashes: 1 };
const maFace = (mood) => sm(`ma|face|${mood}`, 34, 32, () => faceShapes(mood, MA_FACE));
// How many dancers she still has on her strings.
const pups = (m) => m.mech?.puppets?.length ?? 2;
const maPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `pupF${tag}`, parent: 'crossF', s: MA_PUP[i], pivot: (a, S) => [14, -26 - S.pupY], rot: (S) => (S.pupF - S.armF - S.crossF - S.tilt) * D2R, when: (a) => a.maPups >= 2 },
    { name: `curlF${tag}`, parent: 'nk', s: MA_CURL[1][i], pivot: [3, 1], at: () => [-11, -12], rot: (S) => (14 + S.curl) * D2R },
    { name: `armF${tag}`, parent: 'chest', s: MA_ARM[1][i], pivot: [2, 2.6], at: () => [-4, -11], rot: (S) => S.armF * D2R },
    { name: `crossF${tag}`, parent: 'handF', s: MA_CROSS[i], pivot: [11, 11], rot: (S) => S.crossF * D2R },
    { name: `gown${tag}`, parent: 'waist', s: MA_GOWN[i], pivot: [23, 1], rot: (S) => S.skirt * D2R },
    { name: `bodice${tag}`, parent: 'chest', s: MA_BOD[i], pivot: [10, 14] },
    { name: `head${tag}`, parent: 'nk', s: MA_HEAD[i], pivot: [17, 31] },
    { name: `curlN${tag}`, parent: 'nk', s: MA_CURL[0][i], pivot: [3, 1], at: () => [9, -12], rot: (S) => (-10 + S.curl) * D2R },
    { name: `pupN${tag}`, parent: 'crossN', s: MA_PUP[i], pivot: (a, S) => [14, -26 - S.pupY], rot: (S) => (S.pupN - S.armN - S.crossN - S.tilt) * D2R, when: (a) => a.maPups >= 1 },
    { name: `armN${tag}`, parent: 'chest', s: MA_ARM[0][i], pivot: [2, 2.6], at: () => [4, -10], rot: (S) => S.armN * D2R },
    { name: `crossN${tag}`, parent: 'handN', s: MA_CROSS[i], pivot: [11, 11], rot: (S) => S.crossN * D2R },
  ];
};
export const madameRig = sized(makeRig({
  w: 100,
  h: 130,
  soft: true,
  stride: 30,
  recover: 0.6,
  springs: { x: [220, 16], lift: [160, 10], tilt: [140, 9], head: [120, 8], armN: [150, 10], armF: [150, 10], crossN: [140, 8], crossF: [140, 8], pupN: [70, 4], pupF: [70, 4], pupY: [120, 7], skirt: [90, 6], curl: [80, 5] },
  fast: ['x', 'armN', 'armF', 'pupN', 'pupF'],
  kick: { tilt: -120, head: -200, curl: 400, skirt: 200, pupN: 300, pupF: -300 },
  turnKick: { curl: 300, skirt: 200, pupN: 200, pupF: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.maPups = pups(m);
    const lu = t % 10;
    const curtsy = hold(lu, 6, 6.6, 7.6, 8.2);
    a.maCurtsy = curtsy;
    const br = Math.sin(t * 1.6);
    const dance = Math.sin(t * 4);
    const idle = {
      x: 0, lift: 3 + br * 1.4 - curtsy * 3, tilt: br * 2 + curtsy * 8, head: br * 3 + curtsy * 10, armN: 40 + dance * 8, armF: 146 - dance * 8,
      crossN: dance * 14, crossF: -dance * 14, pupN: Math.sin(t * 4 + 1) * 18, pupF: Math.sin(t * 4 + 2.4) * 18, pupY: Math.abs(dance) * -4, skirt: br * 2, curl: br * 8,
    };
    // A glide: she floats along, her gown swaying.
    const s1 = Math.sin(t * 3);
    const walk = { x: 0, lift: 4 + s1 * 1.6, tilt: 4, head: -2, armN: 34, armF: 150, crossN: 6, crossF: -6, pupN: -24, pupF: -28, pupY: 0, skirt: -6, curl: -10 };
    // The yank: crosses up and back, the dancers swinging up; then out at you.
    const antic = { x: -2, lift: 6, tilt: 10, head: 8, armN: -110, armF: -100, crossN: -30, crossF: -30, pupN: 40, pupF: 40, pupY: -12, skirt: 8, curl: -14 };
    const strike = { x: 4, lift: 2, tilt: -10, head: -8, armN: 30, armF: 20, crossN: 30, crossF: 30, pupN: -80, pupF: -70, pupY: 6, skirt: -8, curl: 18 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'waist', parent: null, at: (S) => [S.x, -40 - S.lift], rot: (S) => S.tilt * 0.4 * D2R },
    { name: 'chest', parent: 'waist', at: () => [0, 1], rot: (S) => S.tilt * 0.6 * D2R },
    { name: 'nk', parent: 'chest', at: () => [1, -13], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'handN', parent: 'armN', at: () => [14.6, 3] },
    { name: 'handF', parent: 'armF', at: () => [14.6, 3] },
    ...maPass(false),
    ...maPass(true),
    { name: 'face', parent: 'nk', s: (a) => maFace(moodOf(a, !a.ph.atk && a.maCurtsy > 0.5 ? 'happy' : null)), pivot: [17, 31] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // The strings from each cross down to its dancer's head and hands.
    ctx.globalAlpha = a.alpha * 0.75;
    ctx.strokeStyle = '#f6f0ff';
    ctx.lineWidth = 0.5;
    for (const [side, need] of [['F', 2], ['N', 1]]) {
      if (a.maPups < need) continue;
      const C = mat(`cross${side}`);
      const P = mat(`pup${side}`);
      const from = [at2(C, -10, 0), at2(C, 0, -10), at2(C, 10, 0)];
      const dy = 28 + S.pupY;
      const to = [at2(P, -9, 14 + dy), at2(P, 0, dy), at2(P, 9, 14 + dy)];
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(from[k][0], from[k][1]);
        ctx.lineTo(to[k][0], to[k][1]);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (a.ph.strike > 0.2) {
      const [px, py] = at2(mat('crossN'), 14, 20);
      sparkle(ctx, a, px + 20, py + 26, 7 * a.ph.strike, a.alpha * a.ph.strike, '#ffc0e0');
    }
  },
}), 1.2);
export function madameStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'happy';
  const wy = -43;
  const cy = wy + 1;
  const ny = cy - 13;
  return {
    w: 100, h: 120, res: 2,
    shapes: shift([
      ...put(puppetShapes('happy'), [14, 2], -26, wy + 26), ...put(maCurl(true)(), [3, 1], -10, ny - 12, 14), ...put(maArm(true)(), [2, 2.6], -4, cy - 11, 140), ...put(maCross(), [11, 11], -18, cy - 2),
      ...put(maGown(), [23, 1], 0, wy), ...put(maBodice(), [10, 14], 0, cy), ...put(maHead(), [17, 31], 1, ny), ...put(faceShapes(fm, MA_FACE), [17, 31], 1, ny),
      ...put(maCurl(false)(), [3, 1], 10, ny - 12, -10), ...put(puppetShapes('happy'), [14, 2], 28, wy + 26), ...put(maArm(false)(), [2, 2.6], 4, cy - 10, 40), ...put(maCross(), [11, 11], 18, cy - 2),
    ], 50, 119),
  };
}

// =====================================================================================
// Queen Gearheart, the Grand Automaton (remade 2026-11-18, Chapter 6)
// =====================================================================================
// A porcelain wind-up ringmistress who has to perform while anyone is watching: a carousel-canopy
// skirt, a red tailcoat with a clock brooch, a tiny top hat ringed with a crown of gears, golden
// ringlets, a star-tipped cane, and a great brass key in her back, spinning faster and faster as she
// overwinds (m.mech.phase 3). Performs on the tick: cane twirls, bows, a tap step. Sweeps the cane
// at you. When she winds down at last (mood 'sleep' in her ending) she sits, the key still, and
// rests for the first time.
const GRED = ramp('#e8485a', { step: 10, turn: 8 });
const GCREAM = ramp('#fff4e0', { step: 7, turn: 8 });
const GHAIR = ramp('#ffd27a', { step: 9, turn: 10 });
const gh = pairOf('gh');
// The skirt: a carousel's canopy upside down, striped panels, a scalloped gold hem. Box 54 x 36;
// the waist at (27, 1).
const ghSkirt = () => {
  const out = [];
  const n = 8;
  for (let k = 0; k < n; k++) {
    const x0 = 2 + (50 * k) / n;
    const x1 = 2 + (50 * (k + 1)) / n;
    const t0 = 27 + (x0 - 27) * 0.34;
    const t1 = 27 + (x1 - 27) * 0.34;
    out.push(T([[t0, 1], [t1, 1], [x1, 31], [x0, 31]], k % 2 ? GCREAM.base : GRED.base));
  }
  for (let k = 0; k < 10; k++) out.push(E(4.6 + k * 5.2, 32, 2.8, 2.6, GOLD.base));
  out.push(F(R(2, 29.4, 50, 2, GOLD.sh)), crescent(27, 18, 24, 16, '#c8a8b8', { k: 0.2, a0: 10, a1: 100 }));
  for (let k = 0; k < 4; k++) out.push(F(E(9 + k * 12, 22 + (k % 2) * 2, 1.8, 1.8, '#fff2b0')));
  return out;
};
const ghCoat = () => [
  T([[3, 20], [2, 6], [6, 1], [16, 1], [20, 6], [19, 20]], GRED.base), crescent(11, 10, 9, 9, GRED.sh, { k: 0.2, a0: 100, a1: 200 }),
  T([[8, 1], [11, 9], [14, 1]], '#ffffff'), ...[0, 1, 2].map((k) => E(11 + (k % 2 ? 1 : -1) * 0.6, 3 + k * 2.4, 2.2, 1.4, '#ffffff')),
  ...[8, 13, 17].map((y) => F(E(15, y, 0.9, 0.9, GOLD.base))), ...[8, 13, 17].map((y) => F(E(7, y, 0.9, 0.9, GOLD.base))),
  E(11, 12.6, 3.4, 3.4, GOLD.base), E(11, 12.6, 2.6, 2.6, '#fffaf0'), F(taper([[11, 12.6], [11, 10.6]], 0.5, 0.4, INK)), F(taper([[11, 12.6], [12.6, 12.6]], 0.5, 0.4, INK)),
];
const ghTails = () => [T([[4, 0], [14, 0], [16, 14], [12, 12], [9, 16], [6, 12], [2, 14]], GRED.sh), F(R(4, 0, 10, 1.6, GOLD.base))];
// The head: a china face, golden ringlets, a tiny top hat ringed with gear teeth, a little gold
// crown on top. Box 34 x 40; the neck at (17, 39).
const ghHead = () => {
  const out = [E(16, 27, 12.6, 11.4, GHAIR.base)];
  for (const [x, y] of [[4.6, 30], [27.4, 30], [6, 36], [26, 36]]) out.push(E(x, y, 3.6, 4.4, GHAIR.base), F(E(x - 0.6, y - 1.6, 1.2, 1.4, GHAIR.hi)));
  out.push(E(17, 28.6, 10.2, 9.6, GCREAM.base), crescent(17, 28.6, 10.2, 9.6, GCREAM.sh, { k: 0.18, a0: 100, a1: 200 }));
  out.push(T([[6.6, 26], [9, 19.6], [16, 17.6], [24, 19], [27.6, 25], [23, 22.4], [18.6, 23.6], [14, 21.6], [10, 24]], GHAIR.base), F(E(13, 19.6, 3, 1, GHAIR.hi)));
  out.push(T([[9, 17.4], [27, 15.4], [27.6, 18.4], [9.4, 20]], '#3a2d4f'));
  out.push(T([[12, 17], [12, 5], [24, 3.6], [25, 16]], '#4a3a6a'), F(R(13, 5, 2.4, 11, '#6a5a8a')));
  for (let k = 0; k < 7; k++) out.push(R(12.2 + k * 1.8, 12.6 - (k % 2) * 1.4, 1.4, 2.6 + (k % 2) * 1.4, GOLD.base));
  out.push(R(12, 13.4, 13, 2, GOLD.sh));
  out.push(T([[14, 4], [15, 0], [17, 3], [19, 0], [21, 3], [23, 0], [24, 4]], GOLD.base), F(E(19, 2.6, 0.9, 0.9, '#ff6b8a')));
  return out;
};
const ghArm = (far) => () => [taper([[2, 3], [9, 3.4], [13, 3.4]], 5, 4.4, far ? GRED.sh : GRED.base), R(11, 0.6, 3, 5.6, GOLD.base), E(15.4, 3.4, 2.8, 2.6, far ? '#e8e0f0' : '#ffffff')];
// The cane: gold, a star on top. Box 8 x 40; held at (4, 30).
const ghCane = () => [taper([[4, 39], [4, 6]], 1.6, 1.4, GOLD.sh), F(taper([[3.4, 36], [3.4, 8]], 0.5, 0.4, '#fff2b0')), T([[4, 0], [5.4, 3.6], [8, 3.8], [6, 5.8], [6.6, 9], [4, 7.4], [1.4, 9], [2, 5.8], [0, 3.8], [2.6, 3.6]], GOLD.base), F(E(3.6, 4.6, 0.9, 0.9, '#ffffff')), E(4, 39.4, 1.4, 1.4, GOLD.base)];
// Her great key: a long stem and a big bow. Box 22 x 14; the stem's root at (1, 7).
const ghKey = () => [taper([[1, 7], [9, 7]], 2.4, 2.4, GOLD.sh), ...stroke(arcP(15, 7, 6, 6, 0, 360, 18), 2.4, GOLD.base, false), E(15, 7, 1.8, 1.8, GOLD.sh), E(1.4, 7, 2, 3, GOLD.base)];
const ghShoe = (far) => () => [E(3.4, 2, 3.4, 2, far ? '#a83a4a' : '#e8485a'), F(E(2.4, 1.4, 1.2, 0.6, '#ffffff'))];
const GH_SKIRT = gh('skirt', 54, 36, ghSkirt, 2);
const GH_COAT = gh('coat', 22, 20, ghCoat, 2);
const GH_TAILS = gh('tails', 18, 17, ghTails, 2);
const GH_HEAD = gh('head', 34, 40, ghHead, 2);
const GH_ARM = [false, true].map((f) => gh(`arm${f ? 1 : 0}`, 19, 7, ghArm(f), 2));
const GH_CANE = gh('cane', 8, 40, ghCane, 2);
const GH_KEY = gh('key', 22, 14, ghKey, 2);
const GH_SHOE = [false, true].map((f) => gh(`shoe${f ? 1 : 0}`, 7, 4, ghShoe(f), 2));
const GH_FACE = { eyes: [[21, 29, 2.3, 3, 1], [13.4, 29.2, 1.9, 2.6, -1]], mouth: [19, 35, 2], blush: [[11.4, 33, 2.2], [25.4, 32.6, 1.6]], iris: '#4a9ad8', lid: 0.2, lashes: 1 };
const ghFace = (mood) => sm(`gh|face|${mood}`, 34, 40, () => faceShapes(mood, GH_FACE));
// (On the tick: a value that steps from beat to beat, easing quickly between.)
const ticked = (t, n) => {
  const s = t * n;
  const i = Math.floor(s);
  return (i + smooth(clamp((s - i) * 3, 0, 1))) / n;
};
const ghPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `key${tag}`, parent: 'chest', s: GH_KEY[i], pivot: [1, 7], at: () => [-10, -10], rot: (S) => (180 + S.key) * D2R },
    { name: `tails${tag}`, parent: 'chest', s: GH_TAILS[i], pivot: [9, 0], at: () => [-6, -2], rot: (S) => (14 + S.tails) * D2R },
    { name: `armF${tag}`, parent: 'chest', s: GH_ARM[1][i], pivot: [2, 3], at: () => [-4, -16], rot: (S) => S.armF * D2R },
    { name: `shoeF${tag}`, parent: null, s: GH_SHOE[1][i], pivot: [3.4, 3.6], at: (S) => [S.x - 5 + S.tapF * 2, -S.tapF * 3] },
    { name: `shoeN${tag}`, parent: null, s: GH_SHOE[0][i], pivot: [3.4, 3.6], at: (S) => [S.x + 5 + S.tapN * 2, -S.tapN * 3] },
    { name: `skirt${tag}`, parent: 'waist', s: GH_SKIRT[i], pivot: [27, 1], rot: (S) => S.skirt * D2R },
    { name: `coat${tag}`, parent: 'chest', s: GH_COAT[i], pivot: [11, 20] },
    { name: `head${tag}`, parent: 'nk', s: GH_HEAD[i], pivot: [17, 39] },
    { name: `cane${tag}`, parent: 'handN', s: GH_CANE[i], pivot: [4, 30], rot: (S) => S.cane * D2R },
    { name: `armN${tag}`, parent: 'chest', s: GH_ARM[0][i], pivot: [2, 3], at: () => [4, -15], rot: (S) => S.armN * D2R },
  ];
};
export const gearheartRig = sized(makeRig({
  w: 100,
  h: 130,
  soft: true,
  stride: 30,
  recover: 0.6,
  springs: { x: [240, 18], lift: [220, 14], tilt: [180, 11], head: [140, 9], armN: [200, 13], armF: [180, 12], cane: [200, 12], skirt: [100, 7], tails: [90, 6], tapN: [400, 24], tapF: [400, 24], key: [300, 18] },
  fast: ['x', 'armN', 'cane'],
  kick: { tilt: -150, head: -220, skirt: 300, tails: 300 },
  turnKick: { skirt: 260, tails: 300 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const over = m.mech?.phase === 3 ? 1 : 0;
    const rest = a.mood === 'sleep' ? 1 : 0;
    a.ghRest = rest;
    a.ghOver = over;
    const lu = t % 9;
    const bow = hold(lu, 5, 5.5, 6.4, 7);
    const twirl = hold(lu, 1.4, 1.8, 3.4, 3.8);
    // (Everything she does goes on the tick, a little stepped, like clockwork.)
    const tk = ticked(t, 2 + over * 2);
    const beat = Math.sin(tk * TAU * 0.5);
    const keyT = t * (rest ? 0 : 7 + over * 14);
    const idle = {
      x: 0, lift: 4 + beat * 1.2 - bow * 3, tilt: beat * 3 + bow * 18, head: -beat * 5 + bow * 12, armN: 40 - twirl * 70 + bow * 50, armF: -60 + beat * 20 - bow * 80,
      cane: Math.sin(t * 8) * 60 * twirl, skirt: beat * 3, tails: beat * 6, tapN: Math.max(0, beat), tapF: Math.max(0, -beat), key: Math.sin(keyT) * 40,
    };
    const s1 = Math.sin(t * 6);
    const walk = { x: 0, lift: 4 + Math.abs(s1) * 2, tilt: 6, head: -4, armN: 30, armF: -80, cane: -20, skirt: -6, tails: -14, tapN: Math.max(0, s1), tapF: Math.max(0, -s1), key: Math.sin(keyT) * 40 };
    // The cane sweep: wound back over her head, then swept down across.
    const antic = { x: -2, lift: 6, tilt: 12, head: 10, armN: -150, armF: 40, cane: -40, skirt: 8, tails: -10, tapN: 1, tapF: 0, key: 0 };
    const strike = { x: 6, lift: 3, tilt: -14, head: -10, armN: 50, armF: -110, cane: 70, skirt: -10, tails: 24, tapN: 0, tapF: 1, key: 0 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Wound down at last: she sits, the key still, her head nodding.
    if (rest) Object.assign(S, { lift: -10, tilt: 4, head: 18 + Math.sin(t * 0.8) * 4, armN: 70, armF: 80, cane: 60, skirt: 0, tails: 0, tapN: 0, tapF: 0, key: 0 });
    return S;
  },
  parts: [
    { name: 'waist', parent: null, at: (S) => [S.x, -34 - S.lift], rot: (S) => S.tilt * 0.3 * D2R },
    { name: 'chest', parent: 'waist', at: () => [0, 1], rot: (S) => S.tilt * 0.7 * D2R },
    { name: 'nk', parent: 'chest', at: () => [1, -20], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'handN', parent: 'armN', at: () => [15.4, 3.4] },
    ...ghPass(false),
    ...ghPass(true),
    { name: 'face', parent: 'nk', s: (a) => ghFace(moodOf(a, a.ghRest ? 'sleep' : null)), pivot: [17, 39] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0 && !a.ghRest) return;
    // Overwound: puffs of steam off her key.
    if (a.ghOver && !a.ghRest) {
      const [kx, ky] = at2(mat('key'), 14, 0);
      for (let k = 0; k < 2; k++) {
        const u = fr(a.now * 1.2 + k / 2);
        puff(ctx, a, kx - u * 10, ky - u * 22, 3 + u * 5, a.alpha * (1 - u) * 0.6);
      }
    }
    if (a.ph.strike > 0.15) {
      const [cx, cy] = at2(mat('cane'), 0, -28);
      sparkle(ctx, a, cx, cy, 8 * a.ph.strike, a.alpha * a.ph.strike, '#fff2b0');
    }
  },
}), 1.3);
export function gearheartStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const wy = -38;
  const cy = wy + 1;
  const ny = cy - 20;
  return {
    w: 100, h: 130, res: 2,
    shapes: shift([
      ...put(ghKey(), [1, 7], -10, cy - 10, 180), ...put(ghTails(), [9, 0], -6, cy - 2, 14), ...put(ghArm(true)(), [2, 3], -4, cy - 16, -60),
      ...put(ghShoe(true)(), [3.4, 3.6], -5, 0), ...put(ghShoe(false)(), [3.4, 3.6], 5, 0), ...put(ghSkirt(), [27, 1], 0, wy), ...put(ghCoat(), [11, 20], 0, cy),
      ...put(ghHead(), [17, 39], 1, ny), ...put(faceShapes(fm, GH_FACE), [17, 39], 1, ny), ...put(ghCane(), [4, 30], 21, cy - 12), ...put(ghArm(false)(), [2, 3], 4, cy - 15, 40),
    ], 50, 129),
  };
}

// =====================================================================================
// A Brass Mole (Queen Gearheart's whack-a-mole)
// =====================================================================================
// A little brass mole toy in goggles that pops up out of a hole in the plaza (render/carnival.js
// draws the hole), looks about, and ducks back down; whack it while it's up.
const MOLE = ramp('#e8b84a', { step: 10, turn: 8 });
const mo = pairOf('mo');
const moleBody = () => [
  E(9, 13, 8.4, 9, MOLE.base), crescent(9, 13, 8.4, 9, MOLE.sh, { k: 0.2, a0: 100, a1: 220 }), shine(9, 13, 8.4, 9, '#ffffff', 0, 0.9),
  E(15.4, 12, 3.4, 2.6, '#ffe0c8'), E(18, 11.4, 1.8, 1.5, '#ff7a9a'), F(E(17.6, 11, 0.6, 0.5, '#ffffff')),
  R(3, 6.4, 13, 2, '#6a5a8a'), E(8, 7.4, 2.8, 2.4, '#9fe6f6'), E(13.4, 7.4, 2.6, 2.2, '#9fe6f6'), F(E(7.4, 6.8, 0.8, 0.7, '#ffffff')), F(E(12.8, 6.8, 0.8, 0.7, '#ffffff')),
  E(4, 3.6, 2.4, 2.2, MOLE.sh), F(E(4, 3.8, 1.2, 1, '#ffd0a0')),
];
const molePaw = () => [E(3, 2, 3, 2, MOLE.base), ...[0, 1, 2].map((k) => F(E(1.4 + k * 1.6, 3.4, 0.6, 0.5, '#fff2d0')))];
const MOLE_B = mo('body', 18, 22, moleBody, 2);
const MOLE_P = mo('paw', 6, 4, molePaw, 2);
// How far up out of its hole it is (0..1): up in 0.3 s, down in its last 0.3 s.
const moleUp = (m, now) => {
  if (m.hp <= 0) return 0;
  const age = now - (m.popAt ?? now - 1);
  const life = m.popLife ?? 4.2;
  return Math.min(clamp(age / 0.3, 0, 1), clamp((life - age) / 0.3, 0, 1));
};
export const moleRig = makeRig({
  w: 30,
  h: 34,
  soft: true,
  stride: 10,
  springs: { up: [300, 16], look: [160, 9] },
  pose(m, a) {
    return { up: moleUp(m, a.now) * 17, look: Math.sin(a.t * 3 + m.uid) * 10 };
  },
  parts: [
    { name: 'root', parent: null, at: (S) => [0, 17 - S.up] },
    { name: 'pawF', parent: 'root', s: MOLE_P[0], pivot: [3, 2], at: () => [-6, -15], when: (a, S) => S.up > 12 },
    // (Only what's up out of the hole shows: the body is cut off at the floor.)
    { name: 'body', parent: 'root', s: MOLE_B[0], pivot: [9, 18], rot: (S) => S.look * D2R, clip: (a, S) => [-14, -26, 32, 26 - (17 - S.up)] },
    { name: 'bodyb', parent: 'root', s: MOLE_B[1], pivot: [9, 18], rot: (S) => S.look * D2R, clip: (a, S) => [-14, -26, 32, 26 - (17 - S.up)] },
    { name: 'pawN', parent: 'root', s: MOLE_P[1], pivot: [3, 2], at: () => [6, -15], when: (a, S) => S.up > 12 },
  ],
});
export function moleStill() {
  return { w: 24, h: 24, res: 3, shapes: shift([...put(moleBody(), [9, 18], 0, 0)], 12, 23) };
}
