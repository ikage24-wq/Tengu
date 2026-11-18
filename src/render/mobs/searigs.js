// The Sunken Aquarium Palace's swimmers, remade from scratch for Chapter 5 (2026-11-18). Live
// puppets on the rig (rig.js): every part drawn once and placed each frame, outer outline only,
// faces bare, everything that grows out of them rooted in them (ribbons under the bell, arms under
// the head, fins on the back), no thin legs.
//
//   jellymaid      Jelly Belle: a round pink jelly bell with a face and a flower, a frilled rim, four
//                  ribbon tentacles. Drifts with a pulse; twirls; blushes. Lashes two ribbons.
//   seahorseknight Seahorse Squire: a chubby seahorse in a plumed helmet, a little lance, bouncing
//                  on the spring of its curled tail. Salutes; dozes. Lance thrust.
//   pearldiver     Pearl Otter: an otter in a glass bubble helmet hugging a big pearl, tiny feet, a
//                  flat tail. Polishes the pearl; juggles it. Throws it.
//   stardancer     Star Twirler: a starfish with a bow, skipping on tiptoe on two of its points.
//                  Pirouettes; waves. Cartwheels into a slap.
//   octoscholar    Octo Scholar: a round octopus in glasses and a mortarboard, a book in one arm,
//                  walking on curling arms. Reads; turns a page; pushes up the glasses. Flings the
//                  book in a puff of ink.
//   anglerlamp     Lantern Angler: a round little anglerfish with a cheeky grin and a glowing lure
//                  on a stalk. Bobs; the lure dims and brightens. Lure flash, then a chomp.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, clamp, inPart, TAU } from './rig.js';
import { D2R, fr, ov, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, dot, puff, sparkle } from './rigkit.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);
const st = (mood) => (MOODS.has(mood) ? mood : 'idle');

// =====================================================================================
// Jelly Belle
// =====================================================================================
const JELLY = ramp('#ffb3e0', { step: 8, turn: 8, lift: 4 });
const jb = pairOf('jb');
// The bell: a round dome, a flower on top. Box 30 x 22; its rim's middle at (15, 20).
const jbBell = () => [
  E(15, 13, 13.6, 10.6, JELLY.base),
  R(1.6, 13, 26.8, 6, JELLY.base),
  crescent(15, 13, 13.6, 10.6, JELLY.sh, { k: 0.2, a0: 100, a1: 210 }),
  shine(15, 11, 13.6, 10.6, '#ffffff', 0, 0.8),
  ...[0, 1, 2, 3, 4].map((k) => F(E(15 + Math.cos(k * 72 * D2R) * 2, 3 + Math.sin(k * 72 * D2R) * 2, 1.6, 1.6, '#fff6a8'))), F(E(15, 3, 1, 1, '#ff9a5a')),
  ...[0, 1, 2].map((k) => F(E(8 + k * 7, 8 + (k % 2) * 2, 1, 1, '#ffffff'))),
];
// The frilled rim under the bell. Box 32 x 8; hung at (16, 1).
const jbRim = () => {
  const out = [R(2, 0.6, 28, 3, JELLY.sh)];
  for (let i = 0; i <= 7; i++) out.push(E(2 + i * 4, 4, 2.4, 2.6, i % 2 ? JELLY.lit ?? '#ffd0ec' : JELLY.base));
  return out;
};
// A ribbon tentacle, wavy, hanging from its root. Box 10 x 26; root at (5, 1).
const jbRibbon = (k) => () => (k < 2
  ? [taper([[5, 1], [7.4, 4], [3.4, 7], [7, 10], [4, 13]], 5.4, 2.4, k ? '#ffb3e0' : '#ff9ac8'), ...[0, 1, 2].map((j) => E(j % 2 ? 7.6 : 2.6, 3.4 + j * 3.4, 1.6, 1.4, '#ffd6ee'))]
  : [taper([[5, 1], [6, 8], [4, 15], [6, 21], [5, 25]], 1.6, 0.8, k % 2 ? '#c8a0f0' : '#ffb3e0')]);
const JB_BELL = jb('bell', 30, 22, jbBell, 2);
const JB_RIM = jb('rim', 32, 8, jbRim, 2);
const JB_RIB = [0, 1, 2, 3, 4].map((k) => jb(`rib${k}`, 10, 26, jbRibbon(k), 2));
const JB_FACE = { eyes: [[12.4, 12.6, 2.1, 2.7, -1], [19.4, 12.4, 1.8, 2.4, 1]], mouth: [16, 16.8, 1.6], blush: [[9.8, 15.6, 1.5], [22, 15.4, 1.2]], iris: '#b04a8a', lid: 0, lashes: 1 };
const jbFace = (mood) => sm(`jb|face|${mood}`, 30, 22, () => faceShapes(mood, JB_FACE));
// (Two frilly arms under the middle; three thin tentacles from the rim's back, trailing.)
const JB_RIBX = [-2, 3, -10, -6, 8];
const jbPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    ...[2, 3, 4, 0, 1].map((k) => ({
      name: `rib${k}${tag}`, parent: 'bell', s: JB_RIB[k][i], pivot: [5, 1], at: () => [JB_RIBX[k], k < 2 ? 0 : -2],
      rot: (S, a) => ((k < 2 ? S.lash : S.drag * 1.4) + Math.sin(a.t * 2.6 - k * 0.9) * (k < 2 ? 6 : 12)) * D2R,
    })),
    { name: `rim${tag}`, parent: 'bell', s: JB_RIM[i], pivot: [16, 1], at: () => [0, -1], rot: (S, a) => Math.sin(a.t * 3) * 3 * D2R },
    { name: `bellp${tag}`, parent: 'bell', s: JB_BELL[i], pivot: [15, 20] },
  ];
};
export const jellyRig = makeRig({
  w: 34, h: 44, soft: true, stride: 22, recover: 0.6,
  springs: { x: [200, 18], bob: [90, 9], tilt: [120, 10], lash: [200, 14], drag: [60, 6] },
  fast: ['x', 'lash', 'tilt'],
  kick: { tilt: -300, lash: 300, drag: 200 },
  turnKick: { drag: 240, tilt: 120 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 1.21;
    const t = a.t + a.uidOff;
    const lu = t % 11;
    const blush = hold(lu, 2, 2.4, 3.6, 4) * (1 - a.walkW);
    a.jbBlush = blush;
    // (A pulse: a lift on each push of the bell, a sink between.)
    const pulse = Math.pow(Math.max(0, Math.sin(t * 2.4)), 2);
    const idle = { x: 0, bob: 13 + pulse * 4, tilt: Math.sin(t * 1.2) * 5, lash: 0, drag: 14 };
    const walk = { x: 0, bob: 13 + pulse * 5, tilt: 10, lash: 0, drag: 30 };
    const antic = { x: -2, bob: 14, tilt: -12, lash: 50, drag: 10 };
    const strike = { x: 5, bob: 14, tilt: 14, lash: -85, drag: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'bell', parent: null, at: (S) => [S.x, -14 - S.bob], rot: (S) => S.tilt * D2R },
    ...jbPass(false),
    ...jbPass(true),
    { name: 'face', parent: 'bell', s: (a) => jbFace(moodOf(a, a.jbBlush > 0.5 ? 'happy' : null)), pivot: [15, 20] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    if (a.ph.strike > 0.2) for (const k of [0, 1]) inPart(ctx, mat, `rib${k}`, () => sparkle(ctx, a, 0, 13, 3 + Math.sin(a.now * 30) * 1.4, a.ph.strike, '#fff6a8'));
    if (a.jbBlush > 0.4) for (let k = 0; k < 2; k++) {
      const u = fr(a.t * 0.8 + k / 2);
      ctx.globalAlpha = a.alpha * Math.sin(u * Math.PI) * a.jbBlush;
      ctx.fillStyle = '#ff7aa8';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText('♥', 6 + k * 6, -34 - S.bob - u * 10);
    }
  },
});
export function jellyStill(pose, f, mood) {
  const fm = st(mood);
  const by = -21;
  return { w: 34, h: 46, res: 3, shapes: shift([...JB_RIBX.flatMap((x, k) => put(jbRibbon(k)(), [5, 1], x, by - 2, k < 2 ? 0 : 20)), ...put(jbRim(), [16, 1], 0, by - 1), ...put(jbBell(), [15, 20], 0, by), ...put(faceShapes(fm, JB_FACE), [15, 20], 0, by)], 17, 45) };
}

// =====================================================================================
// Seahorse Squire
// =====================================================================================
const SEA = ramp('#ffb35a', { step: 9, turn: 8 });
const STEELS = ramp('#cfdcf2', { step: 8, turn: 8, lift: 4 });
const sh = pairOf('sh');
// The body and head in one: a round belly, a curved back with ridges, a snout out front. Box 30 x
// 30; the tail's root at (13, 29).
const shBody = () => [
  E(13, 20, 9, 9.6, SEA.base),
  E(15, 9, 7.6, 7, SEA.base),
  taper([[19, 9.6], [26, 10.6], [29, 10]], 4.6, 3.2, SEA.base), E(29, 10, 1.6, 2, SEA.sh),
  ...[0, 1, 2, 3, 4].map((k) => E(5.2 + k * 0.4, 9 + k * 4.4, 2, 1.6, SEA.sh)),
  F(E(15, 22, 5.6, 6.6, '#ffe2b8')), ...[0, 1, 2].map((k) => F(R(10.6, 18 + k * 3, 9, 0.8, '#ffd090'))),
  crescent(13, 20, 9, 9.6, SEA.sh, { k: 0.18, a0: 110, a1: 220 }),
  shine(15, 8, 7.6, 7, '#ffffff', 0, 0.6),
];
// The curled tail, its spiral standing on the floor. Box 18 x 16; rooted at (9, 1).
const shTail = () => [taper([[9, 1], [8, 6], [4, 10], [5, 14], [10, 14.6], [12, 11], [9, 9.6]], 6, 2.4, SEA.sh)];
// The helmet: a steel cap with a cheek guard and a red plume. Box 18 x 16; sits at (9, 14).
const shHelm = () => [
  T(arcP(9, 11, 7.6, 7.4, 180, 360, 10), STEELS.base), R(1.4, 10, 15.2, 3, STEELS.sh), F(R(4, 6, 2, 4, STEELS.lit ?? '#ffffff')),
  ...[0, 1, 2].map((k) => E(6 - k * 2.6, 3.4 - k * 0.6, 2.6, 2, k % 2 ? '#ff6a7a' : '#ff8a8a')),
];
const shFin = () => [T([[1, 6], [4, 0.6], [8, 2], [9, 7]], '#ffe08a'), F(taper([[3, 5], [5, 1.6]], 0.6, 0.3, '#ffc85a'))];
const shArm = () => [taper([[1, 2.4], [6, 2.4]], 3.4, 2.6, SEA.base), E(6.4, 2.4, 1.8, 1.8, SEA.base)];
// The lance: a little striped jousting lance. Box 6 x 30; gripped at (3, 22).
const shLance = () => [T([[3, 0.6], [5, 20], [1, 20]], '#e8eef8'), F(T([[3, 4], [4, 12], [3, 12]], '#ffffff')), R(0.4, 20, 5.2, 2, STEELS.sh), taper([[3, 22], [3, 29]], 1.6, 1.6, '#8a5a3a')];
const SH_BODY = sh('body', 30, 30, shBody, 2);
const SH_TAIL = sh('tail', 18, 16, shTail, 2);
const SH_HELM = sh('helm', 18, 16, shHelm, 2);
const SH_FIN = sh('fin', 10, 8, shFin, 2);
const SH_ARM = sh('arm', 9, 5, shArm, 2);
const SH_LANCE = sh('lance', 6, 30, shLance, 2);
const SH_FACE = { eyes: [[17.6, 9, 2.3, 2.9, 1]], mouth: [24, 13, 1], blush: [[14.8, 12.8, 1.5]], iris: '#6a3a1a', lid: 0 };
const shFace = (mood) => sm(`sh|face|${mood}`, 30, 30, () => faceShapes(mood, SH_FACE));
const shPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `tail${tag}`, parent: 'body', s: SH_TAIL[i], pivot: [9, 1], at: () => [-1, -2], rot: (S) => S.coil * D2R },
    { name: `fin${tag}`, parent: 'body', s: SH_FIN[i], pivot: [8, 7], at: () => [-8, -16], rot: (S, a) => (Math.sin(a.t * 22) * 14 - 10) * D2R },
    { name: `bodyp${tag}`, parent: 'body', s: SH_BODY[i], pivot: [13, 29] },
    { name: `helm${tag}`, parent: 'body', s: SH_HELM[i], pivot: [9, 14], at: () => [2, -20], rot: (S) => S.helm * D2R },
    { name: `lance${tag}`, parent: 'hand', s: SH_LANCE[i], pivot: [3, 22], rot: (S) => (S.lance - (S.arm + 60) - S.lean) * D2R },
    { name: `arm${tag}`, parent: 'body', s: SH_ARM[i], pivot: [1, 2.4], at: () => [4, -12], rot: (S) => (S.arm + 60) * D2R },
  ];
};
export const seahorseRig = makeRig({
  w: 40, h: 54, soft: true, stride: 20, recover: 0.6,
  springs: { x: [220, 18], lift: [200, 13], lean: [150, 12], coil: [160, 10], helm: [100, 7], arm: [180, 13], lance: [180, 13] },
  fast: ['x', 'arm', 'lance', 'lean'],
  kick: { lean: -260, helm: 400, coil: 200 },
  turnKick: { helm: 260, coil: 160 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 1.31;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'sh', 20);
    const lu = t % 12;
    const salute = hold(lu, 1.4, 1.8, 3, 3.4) * (1 - a.walkW);
    const doze = hold(lu, 7, 7.6, 9.6, 10.2) * (1 - a.walkW);
    a.shDoze = doze;
    const hop = Math.abs(Math.sin(u * Math.PI));
    const idle = { x: 0, lift: 6 + Math.abs(Math.sin(t * 2.2)) * 2.4 * (1 - doze), lean: -doze * 8 + salute * -4, coil: 0, helm: doze * 14, arm: 30 - salute * 140 + doze * 10, lance: 42 - salute * 42 + doze * 30 };
    // Bouncing along on the spring of its tail.
    const walk = { x: 0, lift: 6 + hop * 8, lean: 8 - hop * 6, coil: -hop * 14, helm: -hop * 6, arm: 30, lance: 50 };
    const antic = { x: -2, lift: 6, lean: -12, coil: 10, helm: -6, arm: 60, lance: 60 };
    const strike = { x: 6, lift: 9, lean: 16, coil: -14, helm: 8, arm: -40, lance: 90 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'body', parent: null, at: (S) => [S.x, -14 - S.lift], rot: (S) => S.lean * D2R },
    { name: 'hand', parent: 'arm', at: () => [6.4, 0] },
    ...shPass(false),
    ...shPass(true),
    { name: 'face', parent: 'body', s: (a) => shFace(moodOf(a, a.shDoze > 0.5 ? 'sleep' : null)), pivot: [13, 29] },
  ],
  fx(ctx, m, a, S) {
    if (a.shDoze > 0.6) dot(ctx, a, 12, -48 - S.lift - fr(a.t * 0.6) * 8, 1.4 + fr(a.t * 0.6) * 2, 0.6 * (1 - fr(a.t * 0.6)), '#e8fcff');
  },
});
export function seahorseStill(pose, f, mood) {
  const by = -20;
  return { w: 40, h: 54, res: 3, shapes: shift([...put(shTail(), [9, 1], -1, by - 2), ...put(shFin(), [8, 7], -8, by - 16, -10), ...put(shBody(), [13, 29], 0, by), ...put(shHelm(), [9, 14], 2, by - 20), ...put(faceShapes(st(mood), SH_FACE), [13, 29], 0, by), ...put(shLance(), [3, 22], 9, by - 8, 30), ...put(shArm(), [1, 2.4], 4, by - 12, 70)], 20, 52) };
}

// =====================================================================================
// Pearl Otter
// =====================================================================================
const OTTER = ramp('#b07a52', { step: 9, turn: 8, lift: 10 });
const po = pairOf('po');
// The otter: a round body and head, cream belly and muzzle. Box 24 x 30; the hip at (12, 29).
const poBody = () => [
  E(12, 21, 9, 8.6, OTTER.base),
  E(12, 9, 8.6, 7.6, OTTER.base),
  E(4.4, 3.6, 2.2, 2, OTTER.base), E(19.6, 3.6, 2.2, 2, OTTER.base), F(E(4.4, 3.6, 1, 1, '#e8b890')), F(E(19.6, 3.6, 1, 1, '#e8b890')),
  F(E(12, 22, 6, 6.4, '#ffe8cc')), F(E(15, 11.4, 4.4, 3, '#ffe8cc')), F(E(17.6, 10.4, 1.4, 1, '#3a2a2a')),
  crescent(12, 21, 9, 8.6, OTTER.sh, { k: 0.18, a0: 100, a1: 220 }),
];
// The glass bubble round the head: a ring and glints (the head shows through). Box 26 x 24; at (13, 22).
const poHelm = () => [
  ...stroke(arcP(13, 11.4, 11.6, 10.8, 0, 360, 24), 1.2, '#bff0ff', false),
  F(taper([[5, 8], [7, 4], [11, 2.4]], 1.2, 0.6, '#ffffff')), F(E(19, 16, 1.2, 0.8, '#ffffff')),
  R(5, 20, 16, 3, '#ffd36b'), F(R(5, 20, 16, 1, '#fff0b0')),
];
const poPearl = () => [E(5, 5, 4.6, 4.6, '#fff6fa'), F(E(3.6, 3.4, 1.6, 1.2, '#ffffff')), crescent(5, 5, 4.6, 4.6, '#e0d0e8', { k: 0.25, a0: 30, a1: 140 })];
const poArm = (far) => () => [taper([[1, 2.4], [6.4, 2.4]], 3.4, 3, far ? OTTER.sh : OTTER.base), E(6.6, 2.4, 1.8, 1.7, far ? OTTER.sh : OTTER.base)];
const poFoot = (far) => () => [E(3, 1.6, 3, 1.6, far ? '#7a4a32' : '#8a5a3a')];
const poTail = () => [taper([[1, 2], [9, 3.4], [13, 3]], 4, 3.4, OTTER.sh)];
const PO_BODY = po('body', 24, 30, poBody, 2);
const PO_HELM = po('helm', 26, 24, poHelm, 2);
const PO_PEARL = po('pearl', 10, 10, poPearl, 2);
const PO_ARM = [false, true].map((f) => po(`arm${f ? 1 : 0}`, 9, 5, poArm(f), 2));
const PO_FOOT = [false, true].map((f) => po(`foot${f ? 1 : 0}`, 6, 3, poFoot(f), 2));
const PO_TAIL = po('tail', 14, 6, poTail, 2);
const PO_FACE = { eyes: [[10.8, 8, 1.9, 2.4, -1], [16, 7.8, 1.6, 2.1, 1]], mouth: [15.6, 13, 1.2], blush: [[8.8, 11.2, 1.3], [18.6, 10.8, 1]], iris: '#3a2a1a', lid: 0 };
const poFace = (mood) => sm(`po|face|${mood}`, 24, 30, () => faceShapes(mood, PO_FACE));
const poPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (far) => ({ name: `foot${far ? 'F' : 'N'}${tag}`, parent: null, s: PO_FOOT[far ? 1 : 0][i], pivot: [3, 1.4], at: (S, a) => { const [dx, l] = pawStep(a.poU ?? 0, far ? 0.5 : 0, 8, 0.55, 1.6); return [S.x + (far ? -3 : 3) + dx * a.walkW, -1 - l * a.walkW]; } });
  return [
    foot(true),
    { name: `tail${tag}`, parent: 'hip', s: PO_TAIL[i], pivot: [1, 2], at: () => [-7, -3], rot: (S, a) => (150 + S.tail + Math.sin(a.t * 3) * 6) * D2R },
    { name: `armF${tag}`, parent: 'hip', s: PO_ARM[1][i], pivot: [1, 2.4], at: () => [-3, -17], rot: (S) => (40 + S.arms) * D2R },
    { name: `bodyp${tag}`, parent: 'hip', s: PO_BODY[i], pivot: [12, 29] },
    foot(false),
    { name: `pearl${tag}`, parent: 'hip', s: PO_PEARL[i], pivot: [5, 5], at: (S) => [3 + S.throwX, -9 - S.pearlY] },
    { name: `armN${tag}`, parent: 'hip', s: PO_ARM[0][i], pivot: [1, 2.4], at: () => [3, -16], rot: (S) => (50 + S.arms) * D2R },
    { name: `helm${tag}`, parent: 'hip', s: PO_HELM[i], pivot: [13, 22], at: () => [0, -14] },
  ];
};
export const otterRig = makeRig({
  w: 36, h: 44, soft: true, stride: 8, recover: 0.6,
  springs: { x: [220, 18], lift: [200, 15], lean: [150, 12], arms: [180, 13], pearlY: [160, 11], throwX: [260, 18], tail: [80, 7] },
  fast: ['x', 'arms', 'throwX', 'pearlY'],
  kick: { lean: -260, tail: 300, pearlY: 40 },
  turnKick: { tail: 240 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.97;
    const t = a.t + a.uidOff;
    a.poU = stepPhase(m, a, 'po', 8);
    const p = a.poU * TAU;
    const lu = t % 11;
    const polish = hold(lu, 1, 1.4, 3.4, 3.8) * (1 - a.walkW);
    const juggle = hold(lu, 6, 6.3, 8.6, 9) * (1 - a.walkW);
    a.poPolish = polish;
    const toss = Math.abs(Math.sin(t * 5)) * 12 * juggle;
    const idle = { x: 0, lift: Math.sin(t * 2) * 0.4, lean: polish * 4, arms: polish * Math.sin(t * 12) * 12 - juggle * 30, pearlY: toss, throwX: 0, tail: Math.sin(t * 1.5) * 8 };
    const walk = { x: 0, lift: Math.abs(Math.sin(p)) * 1.2, lean: 6, arms: Math.sin(p) * 6, pearlY: 0, throwX: 0, tail: -10 };
    // The throw: pearl raised overhead, then flung.
    const antic = { x: -2, lift: 0, lean: -12, arms: -120, pearlY: 18, throwX: -4, tail: 10 };
    const strike = { x: 4, lift: 1, lean: 14, arms: -40, pearlY: 8, throwX: 26, tail: -12 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -2 - S.lift], rot: (S) => S.lean * D2R },
    ...poPass(false),
    ...poPass(true),
    { name: 'face', parent: 'hip', s: (a) => poFace(moodOf(a, a.poPolish > 0.5 ? 'happy' : null)), pivot: [12, 29] },
  ],
  fx(ctx, m, a, S, mat) {
    if (a.poPolish > 0.4) inPart(ctx, mat, 'pearl', () => sparkle(ctx, a, 2, -3, 2.4 + Math.sin(a.now * 9), a.poPolish));
  },
});
export function otterStill(pose, f, mood) {
  return { w: 36, h: 46, res: 3, shapes: shift([...put(poFoot(true)(), [3, 1.4], -3, -1), ...put(poTail(), [1, 2], -7, -5, 150), ...put(poArm(true)(), [1, 2.4], -3, -19, 40), ...put(poBody(), [12, 29], 0, -2), ...put(faceShapes(st(mood), PO_FACE), [12, 29], 0, -2), ...put(poFoot(false)(), [3, 1.4], 3, -1), ...put(poPearl(), [5, 5], 3, -11), ...put(poArm(false)(), [1, 2.4], 3, -18, 50), ...put(poHelm(), [13, 22], 0, -16)], 18, 45) };
}

// =====================================================================================
// Star Twirler
// =====================================================================================
const STAR = ramp('#ffb07a', { step: 9, turn: 8 });
const sd = pairOf('sd');
// The star: five round-tipped points, standing on the two lower ones. Box 34 x 34; its middle at (17, 18).
const sdStar = () => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (-90 + i * 36) * D2R;
    const r = i % 2 ? 7.6 : 16;
    pts.push([17 + Math.cos(a) * r, 18 + Math.sin(a) * r]);
  }
  const out = [T(pts, STAR.base)];
  for (let i = 0; i < 5; i++) {
    const a = (-90 + i * 72) * D2R;
    out.push(E(17 + Math.cos(a) * 14.6, 18 + Math.sin(a) * 14.6, 2.6, 2.6, STAR.base));
    for (let k = 1; k < 4; k++) out.push(F(E(17 + Math.cos(a) * (4 + k * 3), 18 + Math.sin(a) * (4 + k * 3), 0.8, 0.8, '#ffe0c0')));
  }
  out.push(crescent(17, 18, 9, 9, STAR.sh, { k: 0.2, a0: 100, a1: 220 }));
  // A frilly pink tutu round its middle.
  for (let i = 0; i <= 8; i++) out.push(E(8.4 + i * 2.15, 24.6 + (i % 2) * 0.8, 2, 1.6, i % 2 ? '#ffd0e2' : '#ffb3cf'));
  return out;
};
const sdBow = () => [T([[6, 4], [0.6, 0.6], [0.6, 7.4]], '#ff7aa8'), T([[6, 4], [11.4, 0.6], [11.4, 7.4]], '#ff7aa8'), E(6, 4, 1.8, 1.8, '#ff5a8a')];
const SD_STAR = sd('star', 34, 34, sdStar, 2);
const SD_BOW = sd('bow', 12, 8, sdBow, 2);
const SD_FACE = { eyes: [[14.4, 16.4, 1.9, 2.5, -1], [20.6, 16.2, 1.7, 2.3, 1]], mouth: [17.6, 21, 1.6], blush: [[11.8, 19.6, 1.4], [23.2, 19.4, 1.2]], iris: '#b04a2a', lid: 0, lashes: 1 };
const sdFace = (mood) => sm(`sd|face|${mood}`, 34, 34, () => faceShapes(mood, SD_FACE));
export const starRig = makeRig({
  w: 40, h: 44, soft: true, stride: 24, recover: 0.5,
  springs: { x: [220, 18], lift: [200, 15], rock: [160, 12], bow: [90, 7] },
  fast: ['x', 'rock'],
  kick: { rock: -300, bow: 400 },
  turnKick: { bow: 300 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 1.11;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'sd', 24);
    const lu = t % 10;
    const pir = hold(lu, 2, 2.2, 3, 3.2) * (1 - a.walkW);
    const wave = hold(lu, 6, 6.3, 7.4, 7.8) * (1 - a.walkW);
    a.sdWave = wave;
    // (Whole turns, eased, straight from the clock: a pirouette now and then, and the cartwheel of
    // its slap; a full turn ends where it began, so nothing jumps.)
    const pu = lu > 2.2 && lu < 3 ? (lu - 2.2) / 0.8 : 0;
    const su = a.ph.since >= 0 ? Math.min(1, a.ph.since / 0.3) : 0;
    const ease = (q) => q * q * (3 - 2 * q);
    a.sdSpin = (ease(pu) + ease(su)) * 360 * (1 - a.walkW);
    const skip = Math.abs(Math.sin(u * TAU));
    const idle = { x: 0, lift: Math.abs(Math.sin(t * 2)) * 1.4 + pir * 4, rock: Math.sin(t * 1.6) * 5 + wave * Math.sin(t * 9) * 10, bow: Math.sin(t * 2) * 6 };
    const walk = { x: 0, lift: skip * 6, rock: Math.sin(u * TAU) * 12, bow: -skip * 14 };
    // The cartwheel slap: a lean back, then a whole turn forward.
    const antic = { x: -2, lift: 1, rock: -24, bow: 10 };
    const strike = { x: 8, lift: 6, rock: 0, bow: -20 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'hub', parent: null, at: (S) => [S.x, -15 - S.lift], rot: (S, a) => (S.rock + (a.sdSpin ?? 0)) * D2R },
    { name: 'star', parent: 'hub', s: SD_STAR[0], pivot: [17, 18] },
    { name: 'bow', parent: 'hub', s: SD_BOW[0], pivot: [6, 6], at: () => [1, -14], rot: (S) => S.bow * D2R },
    { name: 'starb', parent: 'hub', s: SD_STAR[1], pivot: [17, 18] },
    { name: 'bowb', parent: 'hub', s: SD_BOW[1], pivot: [6, 6], at: () => [1, -14], rot: (S) => S.bow * D2R },
    { name: 'face', parent: 'hub', s: (a) => sdFace(moodOf(a, a.sdWave > 0.5 ? 'happy' : null)), pivot: [17, 18] },
  ],
  fx(ctx, m, a) {
    if (a.ph.strike > 0.2) for (let k = 0; k < 5; k++) sparkle(ctx, a, Math.cos(k * 1.26 + a.now * 8) * 18, -15 + Math.sin(k * 1.26 + a.now * 8) * 18, 2.4, a.ph.strike * 0.9, k % 2 ? '#fff6a8' : '#ffffff');
  },
});
export function starStill(pose, f, mood) {
  return { w: 40, h: 46, res: 3, shapes: shift([...put(sdStar(), [17, 18], 0, -15), ...put(sdBow(), [6, 6], 1, -29), ...put(faceShapes(st(mood), SD_FACE), [17, 18], 0, -15)], 20, 44) };
}

// =====================================================================================
// Octo Scholar
// =====================================================================================
const OCTO = ramp('#ff8fb0', { step: 9, turn: 8 });
const os = pairOf('os');
// The head: a round mantle. Box 30 x 26; its bottom middle at (15, 25).
const osHead = () => [E(15, 13, 13.6, 12, OCTO.base), R(3, 16, 24, 9, OCTO.base), ...[0, 1, 2, 3].map((k) => F(E(7 + k * 5.4, 6 + (k % 2) * 3, 1.4, 1.2, '#ffc0d4'))), crescent(15, 13, 13.6, 12, OCTO.sh, { k: 0.18, a0: 100, a1: 220 }), shine(15, 11, 13.6, 12, '#ffffff', 0, 0.6)];
// An arm, curling at the tip. Box 10 x 18; rooted at (5, 1).
const osArm = (k) => () => [taper([[5, 1], [5.6, 8], [4, 13], [6, 16], [8.4, 15]], 4.6, 1.6, k % 2 ? OCTO.sh : OCTO.base), ...[0, 1, 2].map((j) => F(E(3.4, 5 + j * 4, 0.8, 0.8, '#ffe0ea')))];
const osCap = () => [T([[0.6, 4], [10, 0.6], [19.4, 4], [10, 7.4]], '#3a3058'), R(5, 5, 10, 4, '#3a3058'), F(E(10, 4, 1.2, 1, '#ffd36b'))];
const osTassel = () => [taper([[1, 1], [1, 7]], 0.8, 0.8, '#ffd36b'), E(1, 8, 1.4, 1.8, '#ffd36b')];
const osBook = () => [R(0.6, 0.6, 12, 9, '#4a7ad8'), F(R(1.6, 1.4, 10, 1.6, '#ffffff')), F(R(0.6, 0.6, 1.6, 9, '#2a4a9a')), F(E(7, 5.6, 1.8, 1.8, '#ffd36b'))];
const OS_HEAD = os('head', 30, 26, osHead, 2);
const OS_ARM = [0, 1, 2, 3, 4, 5].map((k) => os(`arm${k}`, 10, 18, osArm(k), 2));
const OS_CAP = os('cap', 20, 9, osCap, 2);
const OS_TASSEL = os('tassel', 3, 10, osTassel, 1);
const OS_BOOK = os('book', 13, 10, osBook, 2);
// (Glasses are part of the face, over the eyes.)
const OS_FACE = { eyes: [[14.6, 14.6, 1.9, 2.4, -1], [21.4, 14.4, 1.7, 2.2, 1]], mouth: [18, 19.6, 1.4], blush: [[11.4, 18, 1.4], [24.6, 17.6, 1.2]], iris: '#4a3a8a', lid: 0 };
const osFace = (mood) => sm(`os|face|${mood}`, 30, 26, () => [...faceShapes(mood, OS_FACE), ...stroke(arcP(15, 15, 3.2, 3, 0, 360, 14), 0.7, '#3a3058', false), ...stroke(arcP(21, 14.8, 2.8, 2.7, 0, 360, 14), 0.7, '#3a3058', false), ...stroke([[18.2, 14.8], [18.2, 14.6]], 0.6, '#3a3058')]);
const OS_ARMX = [-10, -6, -2, 2, 6, 10];
export const octoRig = makeRig({
  w: 40, h: 44, soft: true, stride: 18, recover: 0.6,
  springs: { x: [200, 18], lift: [180, 13], lean: [140, 11], head: [120, 10], book: [180, 13], bookX: [220, 16], cap: [90, 7] },
  fast: ['x', 'book', 'bookX', 'lean'],
  kick: { lean: -200, cap: 300, head: -200 },
  turnKick: { cap: 240 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 1.07;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'os', 18);
    a.osU = u;
    const lu = t % 12;
    const read = hold(lu, 1, 1.5, 5, 5.5) * (1 - a.walkW);
    const push = hold(lu, 7, 7.3, 7.8, 8.1) * (1 - a.walkW);
    a.osRead = read;
    const idle = { x: 0, lift: Math.sin(t * 2) * 0.6, lean: read * 6, head: read * 8 - push * 6, book: read * -40, bookX: read * 2, cap: Math.sin(t * 1.4) * 4 };
    const walk = { x: 0, lift: Math.abs(Math.sin(u * TAU)) * 1.4, lean: 6, head: 0, book: 10, bookX: 0, cap: -8 };
    const antic = { x: -2, lift: 1, lean: -12, head: -8, book: -120, bookX: -4, cap: 10 };
    const strike = { x: 5, lift: 1, lean: 14, head: 6, book: 40, bookX: 18, cap: -12 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'base', parent: null, at: (S) => [S.x, -14 - S.lift], rot: (S) => S.lean * D2R },
    { name: 'neck', parent: 'base', rot: (S) => S.head * D2R },
    ...OS_ARMX.map((x, k) => ({ name: `arm${k}`, parent: 'base', s: OS_ARM[k][0], pivot: [5, 1], at: () => [x, -2], rot: (S, a) => (x * 1.6 + Math.sin(((a.osU ?? 0) + k / 6) * TAU) * (6 + a.walkW * 16)) * D2R })),
    { name: 'headp', parent: 'neck', s: OS_HEAD[0], pivot: [15, 25] },
    ...OS_ARMX.map((x, k) => ({ name: `arm${k}b`, parent: 'base', s: OS_ARM[k][1], pivot: [5, 1], at: () => [x, -2], rot: (S, a) => (x * 1.6 + Math.sin(((a.osU ?? 0) + k / 6) * TAU) * (6 + a.walkW * 16)) * D2R })),
    { name: 'headb', parent: 'neck', s: OS_HEAD[1], pivot: [15, 25] },
    { name: 'tassel', parent: 'neck', s: OS_TASSEL[0], pivot: [1, 1], at: () => [8, -27], rot: (S, a) => (Math.sin(a.t * 3) * 14 + S.cap * 2) * D2R },
    { name: 'cap', parent: 'neck', s: OS_CAP[0], pivot: [10, 7], at: () => [0, -22], rot: (S) => S.cap * D2R },
    { name: 'capb', parent: 'neck', s: OS_CAP[1], pivot: [10, 7], at: () => [0, -22], rot: (S) => S.cap * D2R },
    { name: 'face', parent: 'neck', s: (a) => osFace(moodOf(a, a.osRead > 0.5 ? 'happy' : null)), pivot: [15, 25] },
    { name: 'book', parent: 'base', s: OS_BOOK[0], pivot: [6, 5], at: (S) => [9 + S.bookX, -4], rot: (S) => S.book * D2R },
    { name: 'bookb', parent: 'base', s: OS_BOOK[1], pivot: [6, 5], at: (S) => [9 + S.bookX, -4], rot: (S) => S.book * D2R },
  ],
  fx(ctx, m, a, S, mat) {
    if (a.ph.strike > 0.2) for (let k = 0; k < 4; k++) puff(ctx, a, 14 + k * 4, -16 + Math.sin(k * 2) * 4, 3 + k, a.ph.strike * 0.5, '74,58,138');
    if (a.osRead > 0.6 && fr(a.t * 0.5) < 0.12) inPart(ctx, mat, 'book', () => sparkle(ctx, a, 6, -2, 2, 0.8));
  },
});
export function octoStill(pose, f, mood) {
  return { w: 40, h: 46, res: 3, shapes: shift([...OS_ARMX.flatMap((x, k) => put(osArm(k)(), [5, 1], x, -16, x * 1.6)), ...put(osHead(), [15, 25], 0, -14), ...put(osCap(), [10, 7], 0, -36), ...put(faceShapes(st(mood), OS_FACE), [15, 25], 0, -14), ...put(osBook(), [6, 5], 9, -18)], 20, 45) };
}

// =====================================================================================
// Lantern Angler
// =====================================================================================
const ANG = ramp('#6a7ad8', { step: 9, turn: 8, lift: 10 });
const la = pairOf('la');
// The fish: round, a cheeky grin with little teeth, fins. Box 34 x 26; its belly's middle at (16, 25).
const laBody = () => [
  E(16, 13, 13, 11.4, ANG.base),
  T([[3.6, 12], [-0.2 + 1, 5], [1, 20]], ANG.sh),
  F(E(17, 18, 9, 5, '#a8b8f0')),
  F(T([...arcP(22, 15, 7, 4.4, 10, 170, 10), [16, 16.4], [28.6, 15]], '#3a2050')), ...[0, 1, 2].map((k) => F(T([[18.4 + k * 3, 16.2], [19.6 + k * 3, 18.2], [20.8 + k * 3, 16.1]], '#ffffff'))),
  crescent(16, 13, 13, 11.4, ANG.sh, { k: 0.18, a0: 110, a1: 220 }),
  shine(16, 11, 13, 11.4, '#ffffff', 0, 0.6),
];
const laFin = () => [T([[1, 1], [8, 3], [6, 8], [1, 6]], '#ffb3c8'), F(taper([[2, 3], [6, 5]], 0.6, 0.3, '#ff8ab0'))];
// The lure: a curving stalk with a glowing bulb. Box 16 x 16; rooted at (2, 15).
const laLure = () => [taper([[2, 15], [3, 8], [8, 3], [12, 3.4]], 1.6, 1, ANG.sh), E(13, 4, 2.6, 2.6, '#fff6a8'), F(E(12.4, 3.4, 1, 1, '#ffffff'))];
const LA_BODY = la('body', 34, 26, laBody, 2);
const LA_FIN = la('fin', 9, 9, laFin, 2);
const LA_LURE = la('lure', 16, 16, laLure, 2);
const LA_FACE = { eyes: [[18.6, 9, 2.4, 3, 1]], mouth: [24, 12, 0.1], blush: [[15, 12.8, 1.5]], iris: '#2a2a5a', lid: 0 };
const laFace = (mood) => sm(`la|face|${mood}`, 34, 26, () => faceShapes(mood, LA_FACE));
export const anglerRig = makeRig({
  w: 44, h: 44, soft: true, stride: 24, recover: 0.6,
  springs: { x: [200, 18], bob: [90, 8], tilt: [140, 11], lure: [60, 5], fin: [140, 9] },
  fast: ['x', 'tilt'],
  kick: { tilt: -260, lure: 400 },
  turnKick: { lure: 300, tilt: 100 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 1.17;
    const t = a.t + a.uidOff;
    const idle = { x: 0, bob: 10 + Math.sin(t * 1.8) * 2.4, tilt: Math.sin(t * 1.1) * 5, lure: Math.sin(t * 1.4) * 10, fin: Math.sin(t * 6) * 14 };
    const walk = { x: 0, bob: 10 + Math.sin(t * 2.6) * 2, tilt: 8, lure: -16, fin: Math.sin(t * 10) * 20 };
    const antic = { x: -3, bob: 11, tilt: -14, lure: 20, fin: 0 };
    const strike = { x: 8, bob: 9, tilt: 14, lure: -24, fin: 30 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'fish', parent: null, at: (S) => [S.x, -4 - S.bob], rot: (S) => S.tilt * D2R },
    { name: 'lure', parent: 'fish', s: LA_LURE[0], pivot: [2, 15], at: () => [4, -20], rot: (S) => S.lure * D2R },
    { name: 'lureb', parent: 'fish', s: LA_LURE[1], pivot: [2, 15], at: () => [4, -20], rot: (S) => S.lure * D2R },
    { name: 'body', parent: 'fish', s: LA_BODY[0], pivot: [16, 25] },
    { name: 'bodyb', parent: 'fish', s: LA_BODY[1], pivot: [16, 25] },
    { name: 'fin', parent: 'fish', s: LA_FIN[0], pivot: [1, 3], at: () => [-13, -6], rot: (S) => (S.fin + 150) * D2R },
    { name: 'finb', parent: 'fish', s: LA_FIN[1], pivot: [1, 3], at: () => [-13, -6], rot: (S) => (S.fin + 150) * D2R },
    { name: 'face', parent: 'fish', s: (a) => laFace(moodOf(a)), pivot: [16, 25] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const flash = a.ph.antic;
    inPart(ctx, mat, 'lure', () => {
      const g = ctx.createRadialGradient(11, -11, 0, 11, -11, 12 + flash * 14);
      g.addColorStop(0, `rgba(255,246,168,${(0.5 + 0.2 * Math.sin(a.now * 3) + flash * 0.4) * a.alpha})`);
      g.addColorStop(1, 'rgba(255,246,168,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-15, -37, 52, 52);
    });
  },
});
export function anglerStill(pose, f, mood) {
  return { w: 44, h: 46, res: 3, shapes: shift([...put(laLure(), [2, 15], 4, -34), ...put(laBody(), [16, 25], 0, -14), ...put(laFin(), [1, 3], -13, -20, 150), ...put(faceShapes(st(mood), LA_FACE), [16, 25], 0, -14)], 22, 44) };
}
