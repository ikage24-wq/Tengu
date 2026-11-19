// The Star Observatory's sky-folk, remade from scratch for Chapter 7 (2026-11-18): Astraea's
// thousand-year household. Live puppets on the rig (rig.js): every part drawn once and placed each
// frame, outer outline only, faces bare; upright and chibi; no bugs (the old moth is an owlet now).
//
//   cometcourier   Comet Courier: a round sparrow postman in a cap with a satchel, a sparkly comet
//                  trail streaming behind; hops about sorting letters. Dashes in and pecks.
//   nebulawitch    Nebula Witch: a fluffy nebula-cloud puff in a pointed starry hat, a star wand;
//                  floats, twirls the wand. Casts a nebula burst at you.
//   starcarto      Telescope Crab: a hermit crab standing upright, a brass telescope for a shell, a
//                  rolled star chart; peers through it. Snaps a big claw.
//   mothlibrarian  Owl Librarian: a little owlet in a scholar's cap and gown with a lantern;
//                  flutters, reads, hoots. Bonks you with a book.
//   meteorgolem    Meteor Golem: a round rock with glowing cracks on stubby legs, little fists;
//                  stomps, smoulders. A heavy punch.
//   geminighosts   Gemini Ghosts: two little star-tipped ghosts holding hands, bobbing in turn.
//                  A twin spin.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, fr, ov, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, sparkle, puff, dot } from './rigkit.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
const STARC = '#fff3a6';
const star5 = (x, y, r, c) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return T(pts, c);
};

// =====================================================================================
// Comet Courier
// =====================================================================================
const SPAR = ramp('#a8c8ff', { step: 9, turn: 10 });
const BELLY = '#fff4e6';
const cc = pairOf('cc');
// Body: a round little bird, a cream belly. Box 18 x 18; standing at (9, 17.6).
const ccBody = () => [E(9, 10, 8, 7.4, SPAR.base), E(10.4, 12, 5, 4.6, BELLY), crescent(9, 10, 8, 7.4, SPAR.sh, { k: 0.2, a0: 120, a1: 220 }), shine(9, 10, 8, 7.4, '#ffffff', 0, 0.8)];
// Head: round, a beak, a postman's cap. Box 16 x 15; the neck at (8, 14.4).
const ccHead = () => [
  E(8, 9, 6.6, 6, SPAR.base), crescent(8, 9, 6.6, 6, SPAR.sh, { k: 0.18, a0: 100, a1: 200 }), T([[13.4, 8.6], [16.4, 9.8], [13.4, 11]], '#ffb03a'),
  T([[2, 6], [3, 1.6], [12, 1.4], [13.2, 5.6]], '#3a4a9a'), R(1.4, 5, 13.6, 2, '#2a3070'), T([[11, 5.6], [15.6, 6], [14.6, 7.4], [11, 7]], '#2a3070'), F(E(7.4, 3, 1.2, 1, GOLD.base)),
];
const ccWing = (far) => () => [T([[1, 1], [8, 2], [10, 6], [5, 8], [1, 5]], far ? SPAR.sh : SPAR.base), F(taper([[2, 4], [8, 5]], 0.6, 0.3, SPAR.deep))];
const ccFoot = (far) => () => [taper([[2, 0], [2, 3.6]], 1.4, 1.2, far ? '#d88a2a' : '#ffa03a'), T([[0, 4], [5, 4], [4.4, 5], [0.6, 5]], far ? '#d88a2a' : '#ffa03a')];
// The satchel: a little leather bag, a letter poking out. Box 9 x 9; its strap at (4.5, 0.5).
const ccBag = () => [R(1, 2, 7, 6, '#c8885a'), F(R(1, 2, 7, 1.6, '#e0a878')), R(2, 0, 5, 3, '#ffffff'), F(E(4.5, 1.4, 0.8, 0.6, '#ff7a9a')), E(4.5, 5, 1, 1, GOLD.base)];
const CC_BODY = cc('body', 18, 18, ccBody, 2);
const CC_HEAD = cc('head', 17, 15, ccHead, 2);
const CC_WING = [false, true].map((f) => cc(`wing${f ? 1 : 0}`, 11, 9, ccWing(f), 2));
const CC_FOOT = [false, true].map((f) => cc(`foot${f ? 1 : 0}`, 6, 5, ccFoot(f), 2));
const CC_BAG = cc('bag', 9, 9, ccBag, 2);
const CC_FACE = { eyes: [[10, 9.4, 1.2, 1.6, 1]], mouth: [12, 12.4, 0.8], blush: [[9.4, 12, 1.2]], iris: '#3a2d4f', lid: 0 };
const ccFace = (mood) => sm(`cc|face|${mood}`, 17, 15, () => faceShapes(mood, CC_FACE));
const ccPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (k, far) => ({ name: `foot${k}${tag}`, parent: null, s: CC_FOOT[far ? 1 : 0][i], pivot: [2, 0], at: (S, a) => { const [dx, l] = pawStep(a.ccU ?? 0, far ? 0.5 : 0, 8, 0.55, 2.4); return [S.x + (far ? -2 : 2) + dx * a.walkW, -4.6 - l * a.walkW - S.hop]; } });
  return [
    { name: `wingF${tag}`, parent: 'trunk', s: CC_WING[1][i], pivot: [1, 1], at: () => [-3, -12], rot: (S) => (-10 + S.wingF) * D2R },
    foot(1, true),
    { name: `bag${tag}`, parent: 'trunk', s: CC_BAG[i], pivot: [4.5, 0.5], at: () => [-4, -8], rot: (S) => S.bag * D2R },
    foot(0, false),
    { name: `body${tag}`, parent: 'trunk', s: CC_BODY[i], pivot: [9, 17.6] },
    { name: `head${tag}`, parent: 'nk', s: CC_HEAD[i], pivot: [8, 14.4] },
    { name: `wingN${tag}`, parent: 'trunk', s: CC_WING[0][i], pivot: [1, 1], at: () => [-2, -11], rot: (S) => (10 + S.wingN) * D2R },
  ];
};
// The comet trail: a real comet's tail, a tapered glow (lilac halo, gold body, white core) that is
// widest at the bird and thins to a point, rippling softly, with sparkles shed along it; longer as
// it runs. (2026-11-18: three stacked strokes read as a flat grey bar in the game.)
const CC_TAIL = [[6.4, '#c8b8ff', 0.4], [4.2, STARC, 0.7], [2, '#ffffff', 0.9]];
function ccTrail(ctx, m, a, S, mat) {
  if (m.hp <= 0) return;
  const [bx, by] = at2(mat('trunk'), -6, -9);
  const len = 14 + a.walkW * 16 + a.ph.strike * 16;
  const N = 12;
  const cy = by - 4 + Math.sin(a.now * 2.4) * 1.2;
  const mid = (u) => {
    const v = 1 - u;
    return [v * v * bx + 2 * v * u * (bx - len * 0.5) + u * u * (bx - len), v * v * by + 2 * v * u * cy + u * u * (by - 3) + Math.sin(a.now * 5 - u * 5) * u * 2.2];
  };
  for (const [w0, c, al] of CC_TAIL) {
    ctx.globalAlpha = a.alpha * al;
    ctx.fillStyle = c;
    ctx.beginPath();
    const lo = [];
    for (let k = 0; k <= N; k++) {
      const u = k / N;
      const [x, y] = mid(u);
      const hw = w0 * 0.5 * Math.pow(1 - u, 0.85);
      if (k) ctx.lineTo(x, y - hw);
      else ctx.moveTo(x, y - hw);
      lo.push([x, y + hw]);
    }
    for (let k = lo.length - 1; k >= 0; k--) ctx.lineTo(lo[k][0], lo[k][1]);
    ctx.closePath();
    ctx.fill();
  }
  for (let k = 0; k < 3; k++) {
    const u = fr(a.now * 1.4 + k / 3);
    sparkle(ctx, a, bx - u * len - 2, by - 2 + Math.sin(u * 9 + k) * 3, 1.4 * (1 - u) + 0.4, a.alpha * (1 - u), STARC);
  }
}
export const cometRig = makeRig({
  w: 34, h: 44, soft: true, stride: 8, recover: 0.6,
  springs: { x: [300, 20], hop: [320, 18], lift: [240, 16], tilt: [220, 14], head: [180, 10], wingN: [200, 10], wingF: [200, 10], bag: [100, 6] },
  fast: ['x', 'tilt', 'head'],
  kick: { tilt: -200, head: -260, bag: 300, wingN: 300 },
  turnKick: { bag: 260, wingN: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.ccU = stepPhase(m, a, 'cc', 8);
    const lu = t % 8;
    const sort = hold(lu, 2, 2.4, 4, 4.4);
    const flap = hold(lu, 6, 6.2, 6.8, 7);
    const br = Math.sin(t * 2.4);
    const idle = { x: 0, hop: Math.abs(Math.sin(t * 3)) * (1 - sort) * 0, lift: br * 0.4, tilt: sort * 14, head: br * 4 + sort * 18 + Math.sin(t * 7) * sort * 6, wingN: sort * 50 + flap * Math.sin(t * 30) * 40, wingF: flap * Math.sin(t * 30 + 1) * 40, bag: br * 6 - sort * 20 };
    const hp = Math.abs(Math.sin(a.ccU * Math.PI * 2));
    const walk = { x: 0, hop: hp * 2, lift: 0, tilt: 10, head: -6, wingN: -20, wingF: -16, bag: -16 };
    const antic = { x: -3, hop: 0, lift: -1, tilt: -10, head: -14, wingN: -50, wingF: -40, bag: 10 };
    const strike = { x: 6, hop: 1, lift: 0, tilt: 24, head: 26, wingN: 40, wingF: 30, bag: -30 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -4 - S.lift - S.hop], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'trunk', at: () => [1, -14], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    ...ccPass(false),
    ...ccPass(true),
    { name: 'face', parent: 'nk', s: (a) => ccFace(moodOf(a)), pivot: [8, 14.4] },
  ],
  under: ccTrail,
});
export function cometStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 34, h: 40, res: 3, shapes: shift([
    ...put(ccWing(true)(), [1, 1], -3, -16, -10), ...put(ccFoot(true)(), [2, 0], -2, -4.6), ...put(ccBag(), [4.5, 0.5], -4, -12), ...put(ccFoot(false)(), [2, 0], 2, -4.6),
    ...put(ccBody(), [9, 17.6], 0, -4), ...put(ccHead(), [8, 14.4], 1, -18), ...put(faceShapes(fm, CC_FACE), [8, 14.4], 1, -18), ...put(ccWing(false)(), [1, 1], -2, -15, 10),
  ], 17, 39) };
}

// =====================================================================================
// Nebula Witch
// =====================================================================================
const NEB = ramp('#c8a8ff', { step: 9, turn: 12 });
const HAT = ramp('#3a2a7a', { step: 9, turn: 8, lift: 16 });
const nw = pairOf('nw');
// The cloud: a fluffy round puff, lobes of pink and blue nebula, stars caught in it. Box 26 x 22;
// its bottom at (13, 21).
const nwCloud = () => [
  ...[[5, 13, 5.4], [21, 13, 5.4], [8, 17, 5], [18, 17, 5], [13, 18, 5.6]].map(([x, y, r]) => E(x, y, r, r * 0.9, NEB.base)),
  E(13, 11, 10, 9, NEB.base), F(E(9, 9, 4, 3, '#ffc8e8')), F(E(17, 14, 4, 3, '#a8d8ff')), shine(13, 11, 10, 9, '#ffffff', 0, 0.8),
  star5(7, 15, 1.4, STARC), star5(19, 9, 1.2, STARC), star5(16, 18, 1, '#ffffff'),
];
// The hat: tall, pointed, bent at the tip, a gold band, a star. Box 20 x 22; its brim at (10, 20).
const nwHat = () => [T([[0, 20], [20, 20], [18, 18], [2, 18]], HAT.base), T([[4, 18.4], [16, 18.4], [12, 6], [16, 2], [9, 4]], HAT.base), R(4.6, 15.6, 11, 2.4, GOLD.base), star5(10, 12, 2.2, STARC), F(E(7, 12, 1, 3, HAT.hi))];
const nwArm = (far) => () => [E(2.6, 2.6, 2.6, 2.4, far ? NEB.sh : NEB.base)];
const nwWand = () => [taper([[1, 12], [1, 3]], 1, 0.8, '#c89a6a'), star5(1, 2, 2.6, GOLD.base), F(E(0.4, 1.4, 0.7, 0.7, '#ffffff'))];
const NW_CLOUD = nw('cloud', 26, 22, nwCloud, 2);
const NW_HAT = nw('hat', 20, 21, nwHat, 2);
const NW_ARM = [false, true].map((f) => nw(`arm${f ? 1 : 0}`, 6, 6, nwArm(f), 2));
const NW_WAND = nw('wand', 4, 13, nwWand, 2);
const NW_FACE = { eyes: [[16, 11.4, 1.4, 1.9, 1], [10.6, 11.6, 1.2, 1.7, -1]], mouth: [13.6, 14.6, 1.4], blush: [[8.6, 14, 1.4], [18.4, 13.6, 1.2]], iris: '#7a50b8', lid: 0, lashes: 1 };
const nwFace = (mood) => sm(`nw|face|${mood}`, 26, 22, () => faceShapes(mood, NW_FACE));
const nwPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `armF${tag}`, parent: 'puff', s: NW_ARM[1][i], pivot: [2.6, 2.6], at: (S) => [-11 + S.armF * 0.04, -9 - S.armF * 0.06] },
    { name: `cloud${tag}`, parent: 'puff', s: NW_CLOUD[i], pivot: [13, 21] },
    { name: `hat${tag}`, parent: 'puff', s: NW_HAT[i], pivot: [10, 20], at: () => [-1, -17], rot: (S) => S.hat * D2R },
    { name: `wand${tag}`, parent: 'handN', s: NW_WAND[i], pivot: [1, 11], rot: (S) => S.wand * D2R },
    { name: `armN${tag}`, parent: 'puff', s: NW_ARM[0][i], pivot: [2.6, 2.6], at: (S) => [10 + S.armN * 0.03, -8 - S.armN * 0.08] },
  ];
};
export const nebulaRig = makeRig({
  w: 36, h: 52, soft: true, stride: 20, recover: 0.6,
  springs: { x: [220, 16], lift: [120, 8], tilt: [140, 9], hat: [110, 6], armN: [200, 12], armF: [200, 12], wand: [200, 12] },
  fast: ['x', 'armN', 'wand'],
  kick: { tilt: -200, hat: 400 },
  turnKick: { hat: 300 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const lu = t % 8;
    const twirl = hold(lu, 3, 3.3, 4.6, 5);
    const br = Math.sin(t * 1.6);
    const idle = { x: 0, lift: 6 + br * 2, tilt: br * 4, hat: Math.sin(t * 1.3) * 8, armN: 40 + twirl * 60, armF: 10 + br * 10, wand: Math.sin(t * 9) * 40 * twirl - 10 };
    const walk = { x: 0, lift: 7 + Math.sin(t * 4) * 1.6, tilt: 10, hat: -14, armN: 10, armF: -10, wand: -30 };
    const antic = { x: -2, lift: 9, tilt: -8, hat: 10, armN: 100, armF: 40, wand: -60 };
    const strike = { x: 3, lift: 6, tilt: 12, hat: -16, armN: -20, armF: -20, wand: 70 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'puff', parent: null, at: (S) => [S.x, -S.lift], rot: (S) => S.tilt * D2R },
    { name: 'handN', parent: 'puff', at: (S) => [10 + S.armN * 0.03, -8 - S.armN * 0.08] },
    ...nwPass(false),
    ...nwPass(true),
    { name: 'face', parent: 'puff', s: (a) => nwFace(moodOf(a)), pivot: [13, 21] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const [wx, wy] = at2(mat('wand'), 0, -9);
    sparkle(ctx, a, wx, wy, 2 + a.ph.strike * 6, a.alpha * (0.4 + a.ph.strike * 0.6), STARC);
    // A soft shadow on the floor under the floating puff.
    ctx.globalAlpha = a.alpha * 0.18;
    ctx.fillStyle = '#2a1e4a';
    ctx.beginPath();
    ctx.ellipse(S.x, -1, 10, 2, 0, 0, TAU);
    ctx.fill();
  },
});
export function nebulaStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 36, h: 52, res: 3, shapes: shift([
    ...put(nwArm(true)(), [2.6, 2.6], -11, -15), ...put(nwCloud(), [13, 21], 0, -6), ...put(nwHat(), [10, 20], -1, -23), ...put(faceShapes(fm, NW_FACE), [13, 21], 0, -6),
    ...put(nwWand(), [1, 11], 11.2, -17, -10), ...put(nwArm(false)(), [2.6, 2.6], 11.2, -17),
  ], 18, 51) };
}

// =====================================================================================
// Telescope Crab
// =====================================================================================
const CRAB = ramp('#ff8a7a', { step: 9, turn: 8 });
const BRASS = ramp('#e8b84a', { step: 10, turn: 8 });
const tc = pairOf('tc');
// The body: a round crab body, standing up, a cream tummy. Box 18 x 16; standing at (9, 15.6).
const tcBody = () => [E(9, 9, 8, 7, CRAB.base), E(9.6, 11, 5, 3.6, '#fff0e0'), crescent(9, 9, 8, 7, CRAB.sh, { k: 0.2, a0: 110, a1: 210 }), shine(9, 9, 8, 7, '#ffffff', 0, 0.8)];
// The telescope it lives in: a brass tube on its back, lens forward. Box 26 x 12; strapped on at (13, 10).
const tcScope = () => [taper([[1, 7], [24, 4]], 7, 10, BRASS.base), F(taper([[2, 5], [23, 2]], 1.6, 2, '#fff2c0')), R(8, 1.6, 2.4, 9.4, BRASS.sh), R(16, 0.4, 2.4, 10, BRASS.sh), E(24.6, 4, 2, 5, '#bfe8ff'), F(E(24.2, 2.4, 0.6, 1.4, '#ffffff')), E(1, 7, 1.6, 3.4, BRASS.deep)];
// A big claw. Box 10 x 9; its wrist at (1, 6).
const tcClaw = (far) => () => [taper([[1, 6], [4, 5]], 2.6, 2.4, far ? CRAB.sh : CRAB.base), E(6.4, 4.6, 3.6, 3.2, far ? CRAB.sh : CRAB.base), T([[6, 1], [10, 0.6], [8.6, 3.6]], far ? CRAB.deep : CRAB.sh)];
const tcLeg = (far) => () => [taper([[2, 0], [2.4, 4]], 2.4, 2, far ? CRAB.sh : CRAB.base), E(2.8, 4.6, 1.8, 1.1, far ? CRAB.deep : CRAB.sh)];
const tcChart = () => [R(0, 0, 10, 3.4, '#fff4dc'), E(0, 1.7, 1.2, 1.7, '#e8d8b8'), E(10, 1.7, 1.2, 1.7, '#e8d8b8'), F(star5(5, 1.7, 1, '#7a6ab8'))];
const TC_BODY = tc('body', 18, 16, tcBody, 2);
const TC_SCOPE = tc('scope', 26, 12, tcScope, 6);
const TC_CLAW = [false, true].map((f) => tc(`claw${f ? 1 : 0}`, 11, 8, tcClaw(f), 2));
const TC_LEG = [false, true].map((f) => tc(`leg${f ? 1 : 0}`, 5, 6, tcLeg(f), 2));
const TC_CHART = tc('chart', 11, 4, tcChart, 2);
const TC_FACE = { eyes: [[11, 7.4, 1.3, 1.7, 1], [6.6, 7.6, 1.1, 1.5, -1]], mouth: [9.4, 10.4, 1.4], blush: [[5, 9.6, 1.2], [13.4, 9.4, 1]], iris: '#3a2d4f', lid: 0 };
const tcFace = (mood) => sm(`tc|face|${mood}`, 18, 16, () => faceShapes(mood, TC_FACE));
const tcPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (k, far) => ({ name: `leg${k}${tag}`, parent: null, s: TC_LEG[far ? 1 : 0][i], pivot: [2, 0], at: (S, a) => { const [dx, l] = pawStep(a.tcU ?? 0, far ? 0.5 : 0, 7, 0.55, 2); return [S.x + (far ? -3 : 3) + dx * a.walkW, -5 - l * a.walkW]; } });
  return [
    { name: `scope${tag}`, parent: 'trunk', s: TC_SCOPE[i], pivot: [13, 10], at: () => [-4, -12], rot: (S) => (-16 + S.scope) * D2R },
    { name: `clawF${tag}`, parent: 'trunk', s: TC_CLAW[1][i], pivot: [1, 6], at: () => [-5, -9], rot: (S) => S.clawF * D2R },
    leg(1, true),
    leg(0, false),
    { name: `body${tag}`, parent: 'trunk', s: TC_BODY[i], pivot: [9, 15.6] },
    { name: `chart${tag}`, parent: 'trunk', s: TC_CHART[i], pivot: [5, 1.7], at: () => [2, -4], rot: () => -10 * D2R },
    { name: `clawN${tag}`, parent: 'trunk', s: TC_CLAW[0][i], pivot: [1, 6], at: () => [5, -8], rot: (S) => S.clawN * D2R },
  ];
};
export const crabRig = makeRig({
  w: 40, h: 40, soft: true, stride: 7, recover: 0.6,
  springs: { x: [280, 18], lift: [260, 16], tilt: [200, 13], scope: [160, 9], clawN: [260, 14], clawF: [220, 12] },
  fast: ['x', 'clawN'],
  kick: { tilt: -200, scope: 300, clawN: 300 },
  turnKick: { scope: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.tcU = stepPhase(m, a, 'tc', 7);
    const lu = t % 9;
    const peer = hold(lu, 2, 2.5, 4.5, 5);
    const br = Math.sin(t * 2);
    const idle = { x: 0, lift: br * 0.4, tilt: -peer * 10, scope: -peer * 30 + br * 3, clawN: -20 + Math.sin(t * 4) * 10 * (1 - peer), clawF: -10 + br * 6 };
    const s1 = Math.sin(a.tcU * TAU);
    const walk = { x: 0, lift: Math.abs(s1) * 1, tilt: s1 * 4, scope: s1 * 4, clawN: -30, clawF: -20 };
    const antic = { x: -2, lift: 0.6, tilt: 8, scope: 10, clawN: -100, clawF: -40 };
    const strike = { x: 5, lift: 0, tilt: -10, scope: -10, clawN: 30, clawF: 10 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -5 - S.lift], rot: (S) => S.tilt * D2R },
    ...tcPass(false),
    ...tcPass(true),
    { name: 'face', parent: 'trunk', s: (a) => tcFace(moodOf(a)), pivot: [9, 15.6] },
  ],
  fx(ctx, m, a, S, mat) {
    if (a.ph.strike > 0.2) {
      const [cx, cy] = at2(mat('clawN'), 8, -4);
      sparkle(ctx, a, cx + 2, cy, 5 * a.ph.strike, a.alpha * a.ph.strike, STARC);
    }
  },
});
export function crabStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 44, h: 40, res: 3, shapes: shift([
    ...put(tcScope(), [13, 10], -4, -17, -16), ...put(tcClaw(true)(), [1, 6], -5, -14, -10), ...put(tcLeg(true)(), [2, 0], -3, -5), ...put(tcLeg(false)(), [2, 0], 3, -5),
    ...put(tcBody(), [9, 15.6], 0, -5), ...put(faceShapes(fm, TC_FACE), [9, 15.6], 0, -5), ...put(tcChart(), [5, 1.7], 2, -9, -10), ...put(tcClaw(false)(), [1, 6], 5, -13, -20),
  ], 22, 39) };
}

// =====================================================================================
// Owl Librarian (the old moth librarian)
// =====================================================================================
const OWL = ramp('#c8a080', { step: 9, turn: 10 });
const GOWN = ramp('#4a3a7a', { step: 9, turn: 8, lift: 14 });
const ol = pairOf('ol');
// The body: a round owlet in a scholar's gown, a fluffy front. Box 18 x 18; standing at (9, 17.6).
const olBody = () => [E(9, 10, 8, 7.6, OWL.base), T([[1.4, 12], [3, 5], [6, 3.6], [6, 17.6], [1.6, 17]], GOWN.base), T([[16.6, 12], [15, 5], [12, 3.6], [12, 17.6], [16.4, 17]], GOWN.base), E(9, 12, 4, 5, '#fff2e4'), ...[0, 1, 2].map((k) => F(T([[7.4 + k * 1.6, 10 + k * 2], [8.2 + k * 1.6, 11.4 + k * 2], [7 + k * 1.6, 11.4 + k * 2]], OWL.hi)))];
// Head: round, ear tufts, a beak, round glasses, a mortarboard. Box 18 x 17; the neck at (9, 16.6).
const olHead = () => [
  T([[2.4, 5], [1.6, 0.6], [5, 3.6]], OWL.sh), T([[15.6, 5], [16.4, 0.6], [13, 3.6]], OWL.sh),
  E(9, 9.6, 7.6, 7, OWL.base), E(6.4, 9.4, 3.2, 3, '#fff2e4'), E(11.8, 9.4, 3.2, 3, '#fff2e4'), crescent(9, 9.6, 7.6, 7, OWL.sh, { k: 0.18, a0: 110, a1: 200 }),
  T([[8.4, 11.6], [9.6, 11.6], [9, 13.4]], '#ffb03a'),
  T([[1, 3.4], [9, 0.6], [17, 3.4], [9, 6.2]], '#2a2050'), R(5.6, 3.4, 6.8, 2.4, '#2a2050'), taper([[15.4, 3.4], [16.4, 8]], 0.5, 0.5, GOLD.base), E(16.4, 8.4, 0.9, 1.2, GOLD.base),
];
const olWing = (far) => () => [T([[1, 1], [7, 2], [9, 8], [4, 9], [0.6, 5]], far ? GOWN.sh : GOWN.base), F(taper([[2, 3], [7, 6]], 0.6, 0.3, OWL.base))];
const olFoot = (far) => () => [E(2.6, 1.6, 2.6, 1.4, far ? '#c8882a' : '#ffa03a')];
// The lantern: a little brass lantern, a star of light in it. Box 8 x 12; held at (4, 0.6).
const olLamp = () => [taper([[4, 0.6], [4, 3]], 0.6, 0.6, BRASS.sh), R(1, 3, 6, 1.4, BRASS.base), R(1.6, 4.4, 4.8, 5.6, '#fff2b0'), F(star5(4, 7.2, 1.6, '#ffffff')), R(1, 10, 6, 1.6, BRASS.base), R(1.6, 4.4, 0.8, 5.6, BRASS.sh), R(5.6, 4.4, 0.8, 5.6, BRASS.sh)];
const OL_BODY = ol('body', 18, 18, olBody, 2);
const OL_HEAD = ol('head', 18, 17, olHead, 2);
const OL_WING = [false, true].map((f) => ol(`wing${f ? 1 : 0}`, 10, 10, olWing(f), 2));
const OL_FOOT = [false, true].map((f) => ol(`foot${f ? 1 : 0}`, 6, 3, olFoot(f), 2));
const OL_LAMP = ol('lamp', 8, 12, olLamp, 2);
const OL_FACE = { eyes: [[11.8, 9.4, 1.4, 1.8, 1], [6.4, 9.4, 1.4, 1.8, -1]], mouth: [9, 14.4, 0.8], blush: [[4, 12, 1.2], [14, 12, 1.2]], iris: '#c87a2a', lid: 0 };
const olFace = (mood) => sm(`ol|face|${mood}`, 18, 17, () => faceShapes(mood, OL_FACE));
const olPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `wingF${tag}`, parent: 'trunk', s: OL_WING[1][i], pivot: [1, 1], at: () => [-5, -14], rot: (S) => (10 + S.wingF) * D2R },
    { name: `footF${tag}`, parent: null, s: OL_FOOT[1][i], pivot: [2.6, 2.6], at: (S) => [S.x - 3, -S.hop] },
    { name: `footN${tag}`, parent: null, s: OL_FOOT[0][i], pivot: [2.6, 2.6], at: (S) => [S.x + 3, -S.hop] },
    { name: `body${tag}`, parent: 'trunk', s: OL_BODY[i], pivot: [9, 17.6] },
    { name: `head${tag}`, parent: 'nk', s: OL_HEAD[i], pivot: [9, 16.6] },
    { name: `lamp${tag}`, parent: 'handN', s: OL_LAMP[i], pivot: [4, 0.6], rot: (S) => -S.wingN * 0.8 * D2R },
    { name: `wingN${tag}`, parent: 'trunk', s: OL_WING[0][i], pivot: [1, 1], at: () => [3, -13], rot: (S) => S.wingN * D2R },
  ];
};
export const owlRig = makeRig({
  w: 34, h: 46, soft: true, stride: 10, recover: 0.6,
  springs: { x: [260, 18], hop: [300, 16], lift: [200, 14], tilt: [180, 12], head: [160, 9], wingN: [200, 11], wingF: [200, 11] },
  fast: ['x', 'wingN'],
  kick: { tilt: -200, head: -260, wingN: 300 },
  turnKick: { head: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'ol', 10);
    const lu = t % 9;
    const turn = hold(lu, 2, 2.3, 3.4, 3.7);
    const hoot = hold(lu, 6, 6.3, 6.8, 7.1);
    const br = Math.sin(t * 2);
    a.olHoot = hoot;
    const idle = { x: 0, hop: 0, lift: br * 0.4, tilt: br * 2, head: turn * 30 - hoot * 10, wingN: 50 + br * 4, wingF: hoot * Math.sin(t * 20) * 20 };
    const hp = Math.abs(Math.sin(u * Math.PI * 2));
    const walk = { x: 0, hop: hp * 3, lift: 0, tilt: 6, head: -4, wingN: 40 + Math.sin(t * 20) * 20, wingF: -30 + Math.sin(t * 20 + 1) * 30 };
    const antic = { x: -2, hop: 0, lift: 1, tilt: -8, head: -10, wingN: -120, wingF: -20 };
    const strike = { x: 5, hop: 1, lift: 0, tilt: 16, head: 14, wingN: 40, wingF: 20 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -2.4 - S.lift - S.hop], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'trunk', at: () => [0.4, -15], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'handN', parent: 'wingN', at: () => [8, 6] },
    ...olPass(false),
    ...olPass(true),
    { name: 'face', parent: 'nk', s: (a) => olFace(moodOf(a, a.olHoot > 0.5 ? 'happy' : null)), pivot: [9, 16.6] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const [lx, ly] = at2(mat('lamp'), 0, 6.4);
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 14);
    g.addColorStop(0, `rgba(255,242,176,${0.4 * a.alpha})`);
    g.addColorStop(1, 'rgba(255,242,176,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 14, ly - 14, 28, 28);
  },
});
export function owlStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 34, h: 44, res: 3, shapes: shift([
    ...put(olWing(true)(), [1, 1], -5, -16.4, 10), ...put(olFoot(true)(), [2.6, 2.6], -3, 0), ...put(olFoot(false)(), [2.6, 2.6], 3, 0), ...put(olBody(), [9, 17.6], 0, -2.4),
    ...put(olHead(), [9, 16.6], 0.4, -17.4), ...put(faceShapes(fm, OL_FACE), [9, 16.6], 0.4, -17.4), ...put(olLamp(), [4, 0.6], 9, -10), ...put(olWing(false)(), [1, 1], 3, -15.4, 50),
  ], 17, 43) };
}

// =====================================================================================
// Meteor Golem
// =====================================================================================
const ROCK = ramp('#8a86a8', { step: 10, turn: 8, lift: 14 });
const LAVA = '#ff9a4a';
const mg = pairOf('mgol');
// The body: a round rock, glowing cracks, little craters. Box 24 x 22; standing at (12, 21.6).
const mgBody = () => [
  E(12, 12, 11, 10, ROCK.base), crescent(12, 12, 11, 10, ROCK.sh, { k: 0.2, a0: 100, a1: 220 }), shine(12, 12, 11, 10, '#ffffff', 0, 0.6),
  F(E(6, 15, 2, 1.4, ROCK.sh)), F(E(17, 17, 1.6, 1.2, ROCK.sh)), F(E(15, 5, 1.4, 1, ROCK.sh)),
  ...stroke([[4, 10], [8, 12], [7, 16], [10, 19]], 0.9, LAVA), ...stroke([[18, 8], [15, 11], [17, 14]], 0.8, LAVA),
];
const mgFist = (far) => () => [E(4, 4, 4, 3.6, far ? ROCK.sh : ROCK.base), F(E(3, 3, 1.4, 1, ROCK.hi)), ...stroke([[2, 6], [5, 4.6]], 0.6, LAVA)];
const mgFoot = (far) => () => [E(3.6, 2.6, 3.6, 2.6, far ? ROCK.sh : ROCK.base)];
const MG_BODY = mg('body', 24, 22, mgBody, 2);
const MG_FIST = [false, true].map((f) => mg(`fist${f ? 1 : 0}`, 8, 8, mgFist(f), 2));
const MG_FOOT = [false, true].map((f) => mg(`foot${f ? 1 : 0}`, 8, 5, mgFoot(f), 2));
const MG_FACE = { eyes: [[15.4, 10, 1.7, 2.2, 1], [9.6, 10.2, 1.5, 2, -1]], mouth: [13, 14.6, 1.8], blush: [[7.6, 13.6, 1.6], [18.2, 13.2, 1.4]], iris: '#ff7a3a', lid: 0 };
const mgFace = (mood) => sm(`mgol|face|${mood}`, 24, 22, () => faceShapes(mood, MG_FACE));
const mgPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (k, far) => ({ name: `foot${k}${tag}`, parent: null, s: MG_FOOT[far ? 1 : 0][i], pivot: [3.6, 4.6], at: (S, a) => { const [dx, l] = pawStep(a.mgU ?? 0, far ? 0.5 : 0, 8, 0.6, 2.6); return [S.x + (far ? -4 : 4) + dx * a.walkW, -l * a.walkW]; } });
  return [
    { name: `fistF${tag}`, parent: 'trunk', s: MG_FIST[1][i], pivot: [4, 4], at: (S) => [-11 + S.fistF * 0.1, -9 - S.fistFy] },
    foot(1, true),
    foot(0, false),
    { name: `body${tag}`, parent: 'trunk', s: MG_BODY[i], pivot: [12, 21.6] },
    { name: `fistN${tag}`, parent: 'trunk', s: MG_FIST[0][i], pivot: [4, 4], at: (S) => [9 + S.fistN, -8 - S.fistNy] },
  ];
};
export const golemRig = makeRig({
  w: 40, h: 40, soft: true, stride: 8, recover: 0.7,
  springs: { x: [240, 18], lift: [240, 16], tilt: [180, 12], fistN: [260, 14], fistNy: [260, 14], fistF: [220, 12], fistFy: [220, 12] },
  fast: ['x', 'fistN'],
  kick: { tilt: -150 },
  turnKick: { tilt: 120 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.mgU = stepPhase(m, a, 'mg', 8);
    const br = Math.sin(t * 1.8);
    a.mgGlow = 0.5 + 0.5 * Math.sin(t * 3);
    const idle = { x: 0, lift: br * 0.4, tilt: br * 2, fistN: 0, fistNy: br, fistF: 0, fistFy: -br };
    const s1 = Math.sin(a.mgU * TAU);
    const walk = { x: 0, lift: Math.abs(s1) * 1.2, tilt: s1 * 5, fistN: s1 * 3, fistNy: 0, fistF: -s1 * 3, fistFy: 0 };
    const antic = { x: -3, lift: 1, tilt: -10, fistN: -8, fistNy: 6, fistF: -4, fistFy: 2 };
    const strike = { x: 5, lift: 0, tilt: 14, fistN: 10, fistNy: 2, fistF: 0, fistFy: -2 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -6 - S.lift], rot: (S) => S.tilt * D2R },
    ...mgPass(false),
    ...mgPass(true),
    { name: 'face', parent: 'trunk', s: (a) => mgFace(moodOf(a)), pivot: [12, 21.6] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Its cracks glow and smoulder.
    const [bx, by] = at2(mat('trunk'), 0, -12);
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, 16);
    g.addColorStop(0, `rgba(255,154,74,${0.18 * a.alpha * a.mgGlow})`);
    g.addColorStop(1, 'rgba(255,154,74,0)');
    ctx.fillStyle = g;
    ctx.fillRect(bx - 16, by - 16, 32, 32);
    if (a.ph.strike > 0.2) {
      const [fx, fy] = at2(mat('fistN'), 0, 0);
      sparkle(ctx, a, fx + 6, fy, 6 * a.ph.strike, a.alpha * a.ph.strike, LAVA);
    }
  },
});
export function golemStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 40, h: 36, res: 3, shapes: shift([
    ...put(mgFist(true)(), [4, 4], -11, -15), ...put(mgFoot(true)(), [3.6, 4.6], -4, 0), ...put(mgFoot(false)(), [3.6, 4.6], 4, 0), ...put(mgBody(), [12, 21.6], 0, -6), ...put(faceShapes(fm, MG_FACE), [12, 21.6], 0, -6), ...put(mgFist(false)(), [4, 4], 9, -14),
  ], 20, 35) };
}

// =====================================================================================
// Gemini Ghosts
// =====================================================================================
const GHA = ramp('#f2eaff', { step: 7, turn: 8, lift: 3 });
const GHB = ramp('#d8f0ff', { step: 7, turn: 8, lift: 3 });
const gg = pairOf('gg');
// One ghost: a round little sheet ghost, a wavy hem, a star on its head. Box 16 x 20; floating at (8, 19).
const ggGhost = (C, tip) => () => {
  const hem = [];
  for (let k = 0; k <= 6; k++) hem.push([1 + k * 2.33, 17 + (k % 2 ? 2 : 0)]);
  return [T([[1, 17], [1, 9], ...arcP(8, 9, 7, 7.4, 180, 360, 12), [15, 17], ...hem.reverse()], C.base), crescent(8, 10, 7, 7, C.sh, { k: 0.2, a0: 10, a1: 90 }), shine(8, 9, 7, 7.4, '#ffffff', 0, 0.8), star5(8, 1.6, 2.4, tip)];
};
const GG_A = gg('a', 16, 20, ggGhost(GHA, STARC), 2);
const GG_B = gg('b', 16, 20, ggGhost(GHB, '#ffb8d8'), 2);
const GG_FACE = { eyes: [[10, 10, 1.2, 1.7, 1], [6, 10, 1.1, 1.6, -1]], mouth: [8, 13, 1.2], blush: [[4.4, 12, 1.1], [11.6, 12, 1.1]], iris: '#3a2d4f', lid: 0 };
const ggFace = (mood) => sm(`gg|face|${mood}`, 16, 20, () => faceShapes(mood, GG_FACE));
export const twinsRig = makeRig({
  w: 44, h: 40, soft: true, stride: 20, recover: 0.6,
  springs: { x: [240, 16], spin: [200, 12], aY: [120, 7], bY: [120, 7], aR: [140, 8], bR: [140, 8] },
  fast: ['x', 'spin'],
  kick: { aR: 300, bR: -300 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const idle = { x: 0, spin: 0, aY: 6 + Math.sin(t * 2) * 2, bY: 6 + Math.sin(t * 2 + Math.PI) * 2, aR: Math.sin(t * 2) * 6, bR: Math.sin(t * 2 + 1) * 6 };
    const walk = { x: 0, spin: 0, aY: 7 + Math.sin(t * 5) * 1.5, bY: 7 + Math.sin(t * 5 + 2) * 1.5, aR: 10, bR: 10 };
    const antic = { x: -2, spin: -20, aY: 10, bY: 10, aR: -10, bR: -10 };
    const strike = { x: 5, spin: 180, aY: 6, bY: 6, aR: 20, bR: 20 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'pair', parent: null, at: (S) => [S.x, -8] },
    // (The twin spin: the two of them whirl round each other, holding hands.)
    { name: 'ghA', parent: 'pair', s: (a, S) => GG_A[0](), pivot: [8, 19], at: (S) => [-7 * Math.cos(S.spin * D2R), 9 - S.aY], rot: (S) => S.aR * D2R },
    { name: 'ghB', parent: 'pair', s: (a, S) => GG_B[0](), pivot: [8, 19], at: (S) => [7 * Math.cos(S.spin * D2R), 9 - S.bY], rot: (S) => S.bR * D2R },
    { name: 'ghAb', parent: 'pair', s: (a, S) => GG_A[1](), pivot: [8, 19], at: (S) => [-7 * Math.cos(S.spin * D2R), 9 - S.aY], rot: (S) => S.aR * D2R },
    { name: 'faceA', parent: 'ghAb', s: (a) => ggFace(moodOf(a)), pivot: [8, 19] },
    { name: 'ghBb', parent: 'pair', s: (a, S) => GG_B[1](), pivot: [8, 19], at: (S) => [7 * Math.cos(S.spin * D2R), 9 - S.bY], rot: (S) => S.bR * D2R },
    { name: 'faceB', parent: 'ghBb', s: (a) => ggFace(moodOf(a, 'happy')), pivot: [8, 19] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Their joined hands, and a soft shadow under each.
    const [ax, ay] = at2(mat('ghA'), 5.4, -6);
    const [bx, by] = at2(mat('ghB'), -5.4, -6);
    ctx.globalAlpha = a.alpha;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + 2, bx, by);
    ctx.stroke();
    ctx.globalAlpha = a.alpha * 0.15;
    ctx.fillStyle = '#2a1e4a';
    ctx.beginPath();
    ctx.ellipse(S.x, -1, 16, 2, 0, 0, TAU);
    ctx.fill();
  },
});
export function twinsStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 44, h: 36, res: 3, shapes: shift([
    ...put(ggGhost(GHA, STARC)(), [8, 19], -7, -5), ...put(faceShapes(fm, GG_FACE), [8, 19], -7, -5), ...put(ggGhost(GHB, '#ffb8d8')(), [8, 19], 7, -5), ...put(faceShapes('happy', GG_FACE), [8, 19], 7, -5),
  ], 22, 35) };
}
