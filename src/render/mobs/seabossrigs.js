// The Sunken Aquarium Palace's bosses, remade from scratch for Chapter 5 (2026-11-18): the Twin
// Morays and Lady Abyssia. Live puppets on the rig (rig.js), chibi, outer outline only, faces bare,
// everything rooted (the neck in the coil, the head on the neck, the arms under the mantle).
//
//   moraymurri / morayena  The Twin Morays: great round-headed eels rearing up out of a coil, a
//                          snapping jaw, a frill down the back. Murri green and spotted with a coral
//                          crown; Ena gold with fin frills at her cheeks and long lashes. They sway,
//                          yawn and look about; hiding in a burrow they peek out and spit bubbles
//                          (m.spitAt); before a lunge they rear back (m.aim), then shoot across the
//                          floor jaws first (m.charging); alone, they huff bubbles in a fury.
//   abyssia                Lady Abyssia, the Sea Witch: a round violet octopus in a nautilus-shell
//                          witch hat, eight curling arms, a coral staff with a glowing pearl. She
//                          raises the staff for her ink (m.inkAt), lifts every arm and slams them
//                          down (m.armsAt, the slam 1.8 s on), and calls the anglers out of the dark
//                          (m.callAt).

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, clamp, inPart, TAU } from './rig.js';
import { simpleEye } from './faces.js';
import { D2R, INK, fr, ov, arcP, taper, pairOf, faceSprite, hold, window1, put, shift, MOODS, moodOf, faceShapes, dot, puff, sparkle } from './rigkit.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);
const blendIn = (o, k, pose) => {
  if (k <= 0) return;
  for (const key of Object.keys(pose)) o[key] = (o[key] ?? 0) + (pose[key] - (o[key] ?? 0)) * k;
};

// =====================================================================================
// The Twin Morays
// =====================================================================================
const MORAY = {
  murri: { body: ramp('#5fbf8a', { step: 9, turn: 8 }), belly: '#d8f4c8', spot: '#3f8a62', frill: '#ff9ab8', iris: '#2a6a4a' },
  ena: { body: ramp('#ffc84a', { step: 9, turn: 8 }), belly: '#fff2c8', spot: '#d8902a', frill: '#ff8a6a', iris: '#8a4a1a' },
};
// The coil on the floor: two loops of eel. Box 78 x 30; its middle on the floor at (39, 29).
const mrCoil = (c) => () => {
  const C = MORAY[c];
  // Two loops of eel, a fat ring on the floor and a smaller one on top, each a tube round a hole.
  const ring = (cx, cy, rx, ry, th, col) => [E(cx, cy, rx, ry, col), F(E(cx, cy - 1, rx - th, ry - th * 0.5, C.body.sh)), F(E(cx, cy + ry - th * 0.35, rx - th * 0.6, th * 0.3, C.belly))];
  return [
    ...ring(39, 21, 36, 8, 10, C.body.base),
    ...ring(39, 13, 26, 6.4, 8, C.body.base),
    ...[0, 1, 2, 3, 4, 5].map((k) => F(E(12 + k * 11, 24 - (k % 2) * 9, 2, 1.4, C.spot))),
  ];
};
// The neck: one S-curve, its root hidden in the coil, a frill down its back. Box 40 x 72; root at (20, 70).
// (A smooth S: the key points run through a curve, sampled finely.)
const curve = (pts, n = 24) => {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * (pts.length - 1);
    const j = Math.min(pts.length - 2, Math.floor(u));
    const f = u - j;
    const p0 = pts[Math.max(0, j - 1)], p1 = pts[j], p2 = pts[j + 1], p3 = pts[Math.min(pts.length - 1, j + 2)];
    const cr = (a, b, c2, d, t) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t * t + (-a + 3 * b - 3 * c2 + d) * t * t * t);
    out.push([cr(p0[0], p1[0], p2[0], p3[0], f), cr(p0[1], p1[1], p2[1], p3[1], f)]);
  }
  return out;
};
const mrNeck = (c) => () => {
  const C = MORAY[c];
  const path = curve([[20, 71], [26, 56], [16, 36], [24, 16], [30, 5]]);
  return [
    taper(path.map(([x, y]) => [x - 8, y + 1]), 5, 3, C.frill),
    taper(path, 21, 16, C.body.base),
    F(taper(path.map(([x, y]) => [x + 5.4, y]), 5, 4, C.belly)),
    ...[0.15, 0.35, 0.55, 0.75].map((u) => { const q = path[Math.round(u * (path.length - 1))]; return F(E(q[0] - 4, q[1], 2, 1.6, C.spot)); }),
  ];
};
// The head: big and round, a snout, the upper jaw; Murri's coral crown, Ena's cheek frills. Box 56 x
// 44; on the neck at (16, 38).
// (Drawn 1.22 times bigger about the neck joint, and moved into a bigger box: the joint is at (22, 54).)
const bigHead = (shapes) => shift(shapes.map((sh) => scaleAbout(sh, 16, 38, 1.22)), 6, 16);
const mrHead = (c) => () => bigHead(mrHeadShapes(c));
// (Scales a shape about (px, py): polygons' points, ellipses' radii, rectangles' sides.)
const scaleAbout = (sh, px, py, k) => {
  if (sh.t === 'p') return { ...sh, x: 0, y: 0, pts: sh.pts.map(([x, y]) => [px + (x + (sh.x ?? 0) - px) * k, py + (y + (sh.y ?? 0) - py) * k]) };
  const o = { ...sh, x: px + (sh.x - px) * k, y: py + (sh.y - py) * k };
  if (sh.t === 'e') Object.assign(o, { rx: sh.rx * k, ry: sh.ry * k });
  if (sh.t === 'r') Object.assign(o, { w: sh.w * k, h: sh.h * k });
  return o;
};
const mrHeadShapes = (c) => {
  const C = MORAY[c];
  const out = [
    E(24, 22, 20, 17, C.body.base),
    E(40, 27, 12, 7, C.body.base),
    T([[8, 8], [14, 1], [20, 6], [26, 0.6], [32, 6], [30, 10], [12, 12]], C.frill),
    F(E(40, 30, 9, 2.6, C.belly)),
    ...[0, 1, 2].map((k) => F(E(14 + k * 8, 12 + (k % 2) * 3, 2.2, 1.6, C.spot))),
    crescent(24, 22, 20, 17, C.body.sh, { k: 0.18, a0: 100, a1: 220 }),
    shine(24, 20, 20, 17, '#ffffff', 0, 0.6),
    F(E(49, 24, 1, 0.8, '#2a3a2a')),
  ];
  if (c === 'murri') out.push(...[0, 1, 2].map((k) => taper([[20 + k * 6, 6], [18 + k * 6, -1 + (k % 2) * 2], [21 + k * 6, -4]], 3, 1.6, '#ff8a6a')), ...[0, 1, 2].map((k) => E(21 + k * 6, -4, 1.6, 1.6, '#ffb3a0')));
  else out.push(T([[12, 28], [2, 26], [4, 36], [12, 34]], C.frill), F(taper([[11, 30], [4, 31]], 0.6, 0.4, '#ffc0a8')));
  return out;
};
// The lower jaw, hinged at the back. Box 30 x 14; hinged at (4, 3).
const mrJaw = (c) => () => {
  const C = MORAY[c];
  return [T([[4, 1], [26, 4], [29, 7], [24, 10], [6, 9]], C.body.base), F(T([[7, 4], [24, 5.4], [22, 8], [8, 7.4]], '#ff8aa8')), ...[0, 1, 2].map((k) => F(T([[10 + k * 5, 4.4], [11.6 + k * 5, 2], [13 + k * 5, 4.6]], '#ffffff')))];
};
const MR = {};
const mrSprites = (c) => {
  if (MR[c]) return MR[c];
  const p = pairOf(`mr${c}`);
  MR[c] = { coil: p('coil', 78, 30, mrCoil(c)), neck: p('neck', 40, 72, mrNeck(c)), head: p('head', 68, 62, mrHead(c)), jaw: p('jaw', 30, 14, mrJaw(c)) };
  return MR[c];
};
const mrFace = (c) => ({ eyes: [[29, 17, 3.8, 4.8, 1]], mouth: [44, 26, 0.1], blush: [[24, 25, 2.6]], iris: MORAY[c].iris, k: 2, lid: 0, lashes: c === 'ena' ? 1 : 0 });
const mrFaceS = (c, mood) => sm(`mr${c}|face|${mood}`, 68, 62, () => bigHead(faceShapes(mood, mrFace(c))));
function morayRig(c) {
  const S0 = mrSprites(c);
  const pass = (bare) => {
    const i = bare ? 1 : 0;
    const tag = bare ? 'b' : '';
    return [
      { name: `coil${tag}`, parent: 'base', s: S0.coil[i], pivot: [39, 29], rot: (S) => S.coil * D2R },
      { name: `neckp${tag}`, parent: 'neck', s: S0.neck[i], pivot: [20, 70] },
      { name: `jaw${tag}`, parent: 'head', s: S0.jaw[i], pivot: [4, 3], at: () => [17, -10], rot: (S) => S.jaw * D2R },
      { name: `headp${tag}`, parent: 'head', s: S0.head[i], pivot: [22, 54] },
    ];
  };
  return makeRig({
    w: 120, h: 130, soft: true, stride: 34, recover: 0.8,
    springs: { x: [160, 16], lift: [140, 13], coil: [120, 10], neck: [110, 10], head: [120, 10], jaw: [260, 16] },
    fast: ['x', 'neck', 'head', 'jaw'],
    kick: { neck: -160, head: -220, jaw: 300 },
    turnKick: { coil: 160, neck: 120 },
    pose(m, a) {
      a.uidOff = (m.uid % 7) * 1.7 + (c === 'ena' ? 3.1 : 0);
      const t = a.t + a.uidOff;
      const now = a.now;
      const lu = t % 12;
      const yawn = hold(lu, 3, 3.5, 4.4, 4.9) * (1 - a.walkW);
      const look = hold(lu, 7.4, 7.8, 9.4, 9.8) * (1 - a.walkW);
      const sway = Math.sin(t * 1.3);
      const idle = { x: 0, lift: 0, coil: sway * 2, neck: sway * 6 - look * 6, head: -sway * 5 + look * Math.sin(t * 2) * 16 - yawn * 14, jaw: yawn * 34 };
      // Slithering: the coil rocks, the neck rolls through an S.
      const p = a.wp;
      const walk = { x: 0, lift: 0, coil: Math.sin(p) * 6, neck: 10 + Math.sin(p - 1) * 10, head: -Math.sin(p - 2) * 8, jaw: 0 };
      // The bite: reared back, then shot forward, jaws wide, and snapped.
      const antic = { x: -3, lift: 2, coil: -4, neck: -22, head: -16, jaw: 10 };
      const strike = { x: 8, lift: 0, coil: 6, neck: 42, head: 16, jaw: a.ph.since > 0.12 ? 0 : 40 };
      const out = stateBlend(a, idle, walk, antic, strike);
      // In the burrow: low, peeking, a puff of bubbles when she spits.
      const spit = window1(now, m.spitAt, 0.8, 0.1, 0.4);
      if (m.burrowed) blendIn(out, 1, { lift: -14, coil: 0, neck: 8 + sway * 4, head: -6 + sway * 4 - spit * 12, jaw: 6 + spit * 30 });
      // Rearing back before her lunge; then the lunge itself, jaws first.
      if (m.aim) blendIn(out, 1, { x: -4, lift: 4, coil: -8, neck: -28, head: -20, jaw: 24 });
      if (m.charging) blendIn(out, 1, { x: 0, lift: 0, coil: 8, neck: 62, head: 18, jaw: 36 });
      if (m.hp <= 0) blendIn(out, 1, { neck: 50, head: 40, jaw: 20, lift: -6 });
      a.mrSpit = spit;
      a.mrMad = m.enraged ? 1 : 0;
      a.mrMood = m.aim || m.charging || m.enraged ? 'angry' : yawn > 0.5 ? 'sleep' : look > 0.5 ? 'happy' : null;
      return out;
    },
    parts: [
      { name: 'base', parent: null, at: (S) => [S.x, -S.lift] },
      { name: 'neck', parent: 'base', at: () => [6, -16], rot: (S) => S.neck * D2R },
      { name: 'head', parent: 'neck', at: () => [10, -66], rot: (S) => S.head * D2R },
      ...pass(false),
      ...pass(true),
      { name: 'face', parent: 'head', s: (a) => mrFaceS(c, moodOf(a, a.mrMood)), pivot: [22, 54] },
    ],
    fx(ctx, m, a, S, mat) {
      if (m.hp <= 0) return;
      // Bubbles spat out of the burrow, a fury of them when alone, a wake behind the lunge.
      if (a.mrSpit > 0.05 || a.mrMad) inPart(ctx, mat, 'head', () => {
        for (let k = 0; k < 4; k++) {
          const u = fr(a.now * 1.6 + k / 4);
          ctx.globalAlpha = a.alpha * (1 - u) * Math.max(a.mrSpit, a.mrMad * 0.7);
          ctx.strokeStyle = '#e8fcff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(34 + u * 22, -12 - u * 18 + Math.sin(u * 8 + k) * 3, 2 + u * 3, 0, TAU);
          ctx.stroke();
        }
      });
      if (m.charging) for (let k = 0; k < 6; k++) {
        const u = fr(a.now * 3 + k / 6);
        ctx.globalAlpha = a.alpha * (1 - u) * 0.8;
        ctx.strokeStyle = '#e8fcff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-30 - u * 50, -20 - (k % 3) * 18, 2 + u * 4, 0, TAU);
        ctx.stroke();
      }
    },
  });
}
export const murriRig = morayRig('murri');
export const enaRig = morayRig('ena');
export function morayStill(c) {
  return (pose, f, mood) => ({
    w: 120,
    h: 150,
    res: 2,
    shapes: shift([...put(mrCoil(c)(), [39, 29], 0, 0), ...put(mrNeck(c)(), [20, 70], 6, -16), ...put(mrJaw(c)(), [4, 3], 33, -92), ...put(mrHead(c)(), [22, 54], 16, -82), ...put(bigHead(faceShapes(MOODS.has(mood) ? mood : 'idle', mrFace(c))), [22, 54], 16, -82)], 50, 148),
  });
}

// =====================================================================================
// Lady Abyssia, the Sea Witch
// =====================================================================================
const ABY = ramp('#9a6ad8', { step: 9, turn: 8, lift: 10 });
const ab = pairOf('ab');
// The mantle: a big round head, paler spots. Box 66 x 56; its bottom middle at (33, 55).
const abHead = () => [
  E(33, 28, 30, 26, ABY.base), R(5, 36, 56, 18, ABY.base),
  ...[[14, 16], [24, 9], [44, 12], [52, 24], [10, 32]].map(([x, y]) => F(E(x, y, 2.6, 2, '#c8a8f0'))),
  crescent(33, 28, 30, 26, ABY.sh, { k: 0.18, a0: 100, a1: 220 }),
  shine(33, 24, 30, 26, '#ffffff', 0, 0.6),
];
// The nautilus-shell hat: a spiral shell for a crown, its tip curling back. Box 56 x 46; sits at (26, 42).
const abHat = () => [
  E(26, 40, 26, 5, '#5a2e8a'), F(E(26, 39, 22, 2.4, '#7a4aa8')),
  T([[12, 38], [40, 38], [32, 20], [22, 10], [14, 8]], '#6a3a9a'), F(T([[14, 37], [20, 37], [18, 14], [15, 10]], '#8a5ab8')),
  // The tip curls back into a nautilus shell: cream, striped, a spiral.
  E(12, 9, 8.6, 8, '#ffe8d0'), F(E(12, 9, 5.6, 5.2, '#ffd8b8')), F(E(12.6, 9.4, 2.8, 2.6, '#ffc8a0')),
  ...[0, 1, 2, 3, 4].map((k) => F(taper([[12 + Math.cos((k * 72 + 20) * D2R) * 3, 9 + Math.sin((k * 72 + 20) * D2R) * 3], [12 + Math.cos((k * 72 + 20) * D2R) * 8, 9 + Math.sin((k * 72 + 20) * D2R) * 7.6]], 0.8, 0.5, '#e8a888'))),
  R(13, 31, 27, 5, '#ff8ab8'), F(E(31, 33.4, 2.4, 2.4, '#fff6a8')), F(E(31, 33.4, 1, 1, '#ffffff')),
];
// An arm, curling at the tip, rooted under the mantle. Box 18 x 44; root at (9, 1).
const abArm = (k) => () => [taper([[9, 1], [11, 14], [6, 26], [9, 36], [15, 37], [14, 32]], 9 - (k % 2), 2.4, k < 4 ? ABY.sh : ABY.base), ...[0, 1, 2, 3].map((j) => F(E(6.6 + (j % 2), 8 + j * 7, 1.3, 1.3, '#e8d8ff')))];
// The staff: coral with a glowing pearl. Box 14 x 58; held at (7, 40).
const abStaff = () => [taper([[7, 56], [7, 14], [4, 8], [7, 4]], 2.6, 2, '#ff8a9a'), ...stroke(arcP(7, 9, 6, 6, 200, 340, 8), 1.6, '#ff8a9a', false), E(7, 7, 4.6, 4.6, '#e8fcff'), F(E(6, 6, 1.6, 1.4, '#ffffff'))];
const AB_HEAD = ab('head', 66, 56, abHead);
const AB_HAT = ab('hat', 56, 46, abHat);
const AB_ARM = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => ab(`arm${k}`, 18, 44, abArm(k)));
const AB_STAFF = ab('staff', 14, 58, abStaff);
const AB_FACE = { eyes: [[33, 29, 4.2, 5.4, -1], [47, 28.4, 3.8, 5, 1]], mouth: [40.6, 41, 3.4], blush: [[27, 37, 3], [53, 36, 2.4]], iris: '#6a2a9a', k: 2.2, lid: 0.25, lashes: 1 };
const abFace = (mood) => sm(`ab|face|${mood}`, 66, 56, () => faceShapes(mood, AB_FACE));
// Where each arm roots under the mantle (back four first).
const AB_ARMX = [-26, -12, 8, 22, -20, -6, 12, 26];
export const abyssiaRig = makeRig({
  w: 140, h: 150, soft: true, stride: 26, recover: 0.8,
  springs: { x: [140, 15], bob: [80, 8], lean: [100, 10], head: [100, 9], arms: [160, 12], staff: [140, 11], staffArm: [160, 12], hat: [70, 6] },
  fast: ['x', 'arms', 'staff', 'staffArm'],
  kick: { lean: -100, head: -160, hat: 300, arms: 200 },
  turnKick: { hat: 200, arms: 100 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.4;
    const t = a.t + a.uidOff;
    const now = a.now;
    const lu = t % 12;
    const cackle = hold(lu, 2, 2.4, 3.6, 4) * (1 - a.walkW);
    const twirl = hold(lu, 7, 7.4, 8.8, 9.2) * (1 - a.walkW);
    const idle = { x: 0, bob: Math.sin(t * 1.4) * 2 + cackle * Math.abs(Math.sin(t * 12)) * 2, lean: cackle * -6, head: Math.sin(t * 0.9) * 3, arms: Math.sin(t * 1.6) * 6, staff: twirl * Math.sin(t * 6) * 40, staffArm: -20 - twirl * 30, hat: Math.sin(t * 1.2) * 4 };
    const walk = { x: 0, bob: Math.abs(Math.sin(a.wp)) * 3, lean: 6, head: 0, arms: Math.sin(a.wp) * 12, staff: 10, staffArm: -10, hat: -6 };
    // An arm's slap.
    const antic = { x: -3, bob: 3, lean: -8, head: -6, arms: -40, staff: -10, staffArm: -30, hat: 8 };
    const strike = { x: 6, bob: 0, lean: 10, head: 6, arms: 40, staff: 20, staffArm: 0, hat: -8 };
    const out = stateBlend(a, idle, walk, antic, strike);
    // Ink: the staff raised high, the pearl glowing dark.
    const ink = window1(now, m.inkAt, 1.6, 0.2, 0.4);
    blendIn(out, ink, { staffArm: -110, staff: -10, lean: -6, head: -6 });
    // Tentacles: every arm lifted high while the floor is marked, then slammed as it lands.
    const sl = m.armsAt == null ? null : now - m.armsAt;
    if (sl != null && sl > -0.1 && sl < 2.4) blendIn(out, 1, sl < 1.6 ? { arms: -60 - Math.sin(t * 10) * 6, bob: 8, lean: -8, head: -10 } : { arms: 50, bob: -4, lean: 8, head: 8 });
    // The call: the staff held up shining, the anglers' lights answering in the dark.
    const call = window1(now, m.callAt, 2, 0.3, 0.5);
    blendIn(out, call, { staffArm: -130, staff: 0, bob: 6, head: -10 });
    if (m.hp <= 0) blendIn(out, 1, { bob: -6, lean: 8, head: 14, arms: 30, staffArm: 40, staff: 70 });
    a.abInk = ink;
    a.abCall = call;
    a.abSlam = sl != null && sl > 1.6 && sl < 2.1 ? 1 - (sl - 1.6) / 0.5 : 0;
    a.abMood = call > 0.3 || cackle > 0.4 ? 'happy' : ink > 0.3 || (sl != null && sl > 0 && sl < 2.1) ? 'angry' : null;
    return out;
  },
  follow: (S) => ({ hatLag: -S.lean * 0.6 }),
  parts: [
    { name: 'body', parent: null, at: (S) => [S.x, -38 - S.bob], rot: (S) => S.lean * D2R },
    { name: 'neck', parent: 'body', rot: (S) => S.head * D2R },
    { name: 'hand', parent: 'armS', at: () => [5, 34] },
    // Back arms, then the mantle, then the front arms, outlined, then all bare.
    ...[0, 1].flatMap((pass) => {
      const i = pass;
      const tag = pass ? 'b' : '';
      return [
        ...[0, 1, 2, 3].map((k) => ({ name: `arm${k}${tag}`, parent: 'body', s: AB_ARM[k][i], pivot: [9, 1], at: () => [AB_ARMX[k], -4], rot: (S, a) => (-AB_ARMX[k] * 1.8 + Math.sin(a.t * 2 + k) * 8 + S.arms * (AB_ARMX[k] < 0 ? -1 : 1)) * D2R })),
        { name: `headp${tag}`, parent: 'neck', s: AB_HEAD[i], pivot: [33, 55] },
        { name: `hat${tag}`, parent: 'neck', s: AB_HAT[i], pivot: [26, 42], at: () => [0, -46], rot: (S) => (S.hat + (S.hatLag ?? 0)) * D2R },
        ...[4, 5, 6, 7].map((k) => ({ name: `arm${k}${tag}`, parent: 'body', s: AB_ARM[k][i], pivot: [9, 1], at: () => [AB_ARMX[k], -2], rot: (S, a) => (-AB_ARMX[k] * 1.5 + Math.sin(a.t * 2.2 + k) * 8 + S.arms * (AB_ARMX[k] < 0 ? -1 : 1)) * D2R })),
        { name: `staff${tag}`, parent: 'hand', s: AB_STAFF[i], pivot: [7, 40], rot: (S) => (S.staff - (S.staffArm + 40) - S.lean) * D2R },
        { name: `armS${tag}`, parent: 'body', s: AB_ARM[5][i], pivot: [9, 1], at: () => [16, -14], rot: (S) => (S.staffArm + 40) * D2R },
      ];
    }),
    { name: 'face', parent: 'neck', s: (a) => abFace(moodOf(a, a.abMood)), pivot: [33, 55] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // The pearl's glow; dark ink welling off it; a bright call; the splash of the slam.
    inPart(ctx, mat, 'staff', () => {
      const g = Math.max(a.abCall, 0.3 + 0.1 * Math.sin(a.now * 2));
      const gr = ctx.createRadialGradient(0, -33, 0, 0, -33, 14 + a.abCall * 26);
      gr.addColorStop(0, `rgba(232,252,255,${g * a.alpha})`);
      gr.addColorStop(1, 'rgba(232,252,255,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(-40, -73, 80, 80);
      for (let k = 0; k < 4; k++) {
        const u = fr(a.now * 1.2 + k / 4);
        puff(ctx, a, Math.sin(u * 6 + k) * 10, -33 - u * 20, 4 + u * 8, a.abInk * 0.55 * (1 - u), '58,30,90');
      }
    });
    if (a.abSlam > 0) for (let k = 0; k < 8; k++) puff(ctx, a, -50 + k * 14, -4, 6 + (k % 3) * 3, a.abSlam * 0.5, '200,230,255');
  },
});
export function abyssiaStill(pose, f, mood) {
  const by = -38;
  return {
    w: 140,
    h: 150,
    res: 2,
    shapes: shift([
      ...[0, 1, 2, 3].flatMap((k) => put(abArm(k)(), [9, 1], AB_ARMX[k], by - 4, -AB_ARMX[k] * 1.8)),
      ...put(abHead(), [33, 55], 0, by), ...put(abHat(), [26, 42], 0, by - 46),
      ...[4, 5, 6, 7].flatMap((k) => put(abArm(k)(), [9, 1], AB_ARMX[k], by - 2, -AB_ARMX[k] * 1.5)),
      ...put(faceShapes(MOODS.has(mood) ? mood : 'idle', AB_FACE), [33, 55], 0, by),
    ], 70, 146),
  };
}

// =====================================================================================
// Queen Coralie, the Drowned Queen (remade 2026-11-18)
// =====================================================================================
// A chibi mermaid queen who keeps everything she loves in glass tanks so nothing can leave: she
// hugs a little fishbowl to her chest. Seafoam hair drifting up in the water (three locks rooted
// at her scalp), a coral crown with pearls, a teal tail curled on the floor with a fin at its tip.
// She sways; peeks lovingly into her bowl; polishes it. Her moves (stamps from world/aquarium.js):
// blowing a Keepsake Bubble (m.bubbleAt), raising the Tidal Strike (m.tideAt), hugging her
// treasures while the tanks are shut (m.mech.hugging), the Great Wave (m.slamming).
const CSKIN = ramp('#ffe6dc', { step: 7, turn: 8, lift: 3 });
const CHAIR = ramp('#9fe8d4', { step: 9, turn: 8 });
const CTAIL = ramp('#4fc0c8', { step: 9, turn: 8 });
const cr = pairOf('cr');
// The tail: from the waist, down and curling on the floor. Box 56 x 62; the waist at (26, 3).
const crTail = () => [
  taper([[26, 2], [30, 18], [24, 34], [16, 48], [22, 57], [36, 56], [44, 50]], 22, 9, CTAIL.base),
  ...[0, 1, 2, 3, 4].map((k) => F(T([[20 + (k % 2) * 6, 10 + k * 8], [24 + (k % 2) * 6, 13 + k * 8], [20 + (k % 2) * 6, 16 + k * 8], [16 + (k % 2) * 6, 13 + k * 8]], CTAIL.sh))),
  F(taper([[32, 8], [34, 20], [28, 34]], 2.4, 1.6, CTAIL.hi ?? '#8fe0e8')),
  R(16, 0.6, 20, 5, '#ffd36b'), F(E(26, 3, 2, 2, '#fff6fa')),
];
// The fin at the tail's tip. Box 24 x 18; rooted at (3, 9).
const crFin = () => [T([[3, 9], [14, 1], [23, 3], [17, 9], [23, 16], [14, 17]], '#9fe8f0'), F(taper([[4, 9], [18, 4]], 0.8, 0.4, '#d8fcff')), F(taper([[4, 9], [18, 14]], 0.8, 0.4, '#d8fcff'))];
// The torso: a seafoam bodice, a pearl necklace. Box 32 x 26; the waist at (16, 25).
const crBody = () => [
  E(16, 13, 10, 10, CSKIN.base), T([[7, 13], [25, 13], [22, 25.4], [10, 25.4]], CTAIL.base),
  T([[6, 12], [26, 12], [24, 18], [8, 18]], '#bff6f0'), F(R(8, 16.4, 16, 1.4, '#7fd8d0')),
  ...[0, 1, 2, 3, 4, 5].map((k) => F(E(10 + k * 2.4, 6 + Math.sin((k / 5) * Math.PI) * 2.6, 1.1, 1.1, '#fff6fa'))),
];
// Her head: big and round, fin ears, bangs, a coral crown. Box 52 x 48; the neck at (26, 46).
const crHead = () => [
  E(26, 26, 18, 17, CSKIN.base),
  T([[9, 26], [2.4, 21], [6, 31]], '#bff6f0'), T([[43, 26], [49.6, 21], [46, 31]], '#bff6f0'),
  // The fringe: a soft cap of hair, its edge four round scallops over the brow.
  E(26, 16, 19.4, 11, CHAIR.base),
  ...[0, 1, 2, 3].map((k) => E(13.4 + k * 8.4, 21.6 + (k % 3 ? 1 : 0), 4.8, 4.2, CHAIR.base)),
  F(taper([[13, 11], [20, 7.4], [28, 6.6]], 1.4, 0.6, '#d8fff4')),
  ...[0, 1, 2, 3, 4].map((k) => taper([[14 + k * 6, 7], [13 + k * 6 + (k % 2) * 2, 1 - (k % 2) * 2]], 3, 1.6, k % 2 ? '#ff8a9a' : '#ff6a8a')),
  ...[0, 1, 2].map((k) => E(18 + k * 8, 5, 1.6, 1.6, '#fff6fa')),
  crescent(26, 25, 18, 17, CSKIN.sh, { k: 0.16, a0: 100, a1: 220 }),
];
// The hair behind her, and a lock drifting up. Back: box 56 x 52, neck at (28, 50). Lock: box 14 x 34, rooted at (7, 32).
const crHairBack = () => [E(28, 26, 24, 22, CHAIR.sh), ...[0, 1, 2, 3, 4].map((k) => E(9 + k * 9.5, 44 + (k % 2) * 2, 5.6, 5, CHAIR.sh))];
// A lock of hair drifting up in the water: wide at the root, wavy, curling over at the tip. Box 18 x 34; rooted at (9, 32).
const crLock = (k) => () => [taper([[9, 33], [7, 27], [10, 21], [8, 16]], 13 - k, 7, k % 2 ? CHAIR.base : CHAIR.sh), E(8, 15.4, 3.6, 3.4, k % 2 ? CHAIR.base : CHAIR.sh), F(taper([[9, 31], [7.4, 26], [9, 21]], 1.4, 0.8, '#d8fff4'))];
const crArm = (far) => () => [taper([[1, 2.6], [8, 2.6]], 3.6, 3, far ? CSKIN.sh : CSKIN.base), E(8.6, 2.6, 2, 1.9, far ? CSKIN.sh : CSKIN.base)];
// The fishbowl she hugs: glass, water, a little fish, a pearl on the gravel. Box 26 x 24; held at (13, 20).
const crBowl = () => [
  E(13, 13, 11.6, 10.6, '#bff0ff'), E(13, 15, 10.4, 8, '#6ad0ec'), F(E(13, 12, 10, 3, '#9fe6f6')),
  F(E(13, 21, 7, 2, '#ffe0b8')), F(E(17, 20.4, 1.4, 1.4, '#fff6fa')),
  F(T([[8, 14], [12, 12], [12, 16]], '#ffb03a')), F(E(13.6, 14, 3, 2, '#ffb03a')), F(E(15, 13.4, 0.6, 0.6, '#2a1a2e')),
  F(taper([[5, 9], [7, 5]], 1.2, 0.6, '#ffffff')),
  R(6, 2, 14, 2.4, '#bff0ff'), ...stroke(arcP(13, 13, 11.6, 10.6, 0, 360, 22), 0.8, '#8ad0e0'),
];
const CR_TAIL = cr('tail', 56, 62, crTail);
const CR_FIN = cr('fin', 24, 18, crFin);
const CR_BODY = cr('body', 32, 26, crBody);
const CR_HEAD = cr('head', 52, 48, crHead);
const CR_BACK = cr('hairback', 56, 52, crHairBack);
const CR_LOCK = [0, 1, 2].map((k) => cr(`lock${k}`, 18, 36, crLock(k)));
const CR_ARM = [false, true].map((f) => cr(`arm${f ? 1 : 0}`, 12, 6, crArm(f)));
const CR_BOWL = cr('bowl', 26, 24, crBowl);
const CR_FACE = { eyes: [[20.4, 28.6, 4.3, 5.3, -1], [32.8, 28.2, 3.9, 4.9, 1]], mouth: [27.2, 36.2, 2.8], blush: [[15.4, 33.6, 2.6], [37.4, 33.2, 2]], iris: '#3aa8b8', k: 1.8, lid: 0, lashes: 1 };
const crFaceShapes = (mood) => {
  if (mood !== 'sad') return faceShapes(mood, CR_FACE);
  const out = [];
  for (const [x, y, w, h, sd] of CR_FACE.eyes) out.push(...simpleEye(x, y, { s: -sd, w, h, mood: 'angry', iris: CR_FACE.iris, ink: INK, wing: 1 }));
  for (const [x, y, rx] of CR_FACE.blush) out.push(F(E(x, y, rx, rx * 0.5, '#ff9fb4')));
  const [mx, my, mw] = CR_FACE.mouth;
  out.push(...stroke(arcP(mx, my + 1.4, mw * 0.45, mw * 0.3, 200, 340, 6), 0.8, INK));
  return out;
};
const crFace = (mood) => sm(`cr|face|${mood}`, 52, 48, () => crFaceShapes(mood));
const CR_LOCKX = [-15, 0, 15];
const crPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    ...[0, 1, 2].map((k) => ({ name: `lock${k}${tag}`, parent: 'neck', s: CR_LOCK[k][i], pivot: [9, 32], at: () => [CR_LOCKX[k], -28], rot: (S, a) => ((k - 1) * 48 + Math.sin(a.t * 1.6 + k * 1.3) * 8 + S.hair * (k - 1)) * D2R })),
    { name: `hairback${tag}`, parent: 'neck', s: CR_BACK[i], pivot: [28, 50] },
    { name: `fin${tag}`, parent: 'waist', s: CR_FIN[i], pivot: [3, 9], at: () => [18, 50], rot: (S, a) => (Math.sin(a.t * 2.2) * 12 + S.fin) * D2R },
    { name: `tail${tag}`, parent: 'waist', s: CR_TAIL[i], pivot: [26, 3] },
    { name: `armF${tag}`, parent: 'waist', s: CR_ARM[1][i], pivot: [1, 2.6], at: () => [-8, -18], rot: (S) => (40 + S.armF) * D2R },
    { name: `body${tag}`, parent: 'waist', s: CR_BODY[i], pivot: [16, 25] },
    { name: `head${tag}`, parent: 'neck', s: CR_HEAD[i], pivot: [26, 46] },
    { name: `bowl${tag}`, parent: 'waist', s: CR_BOWL[i], pivot: [13, 20], at: (S) => [9 + S.bowlX, 4 - S.bowlY], rot: (S) => S.bowl * D2R },
    { name: `armN${tag}`, parent: 'waist', s: CR_ARM[0][i], pivot: [1, 2.6], at: () => [8, -18], rot: (S) => (80 + S.armN) * D2R },
  ];
};
export const coralieRig = makeRig({
  w: 120, h: 160, soft: true, stride: 30, recover: 0.8,
  springs: { x: [150, 15], lift: [110, 11], lean: [110, 11], head: [110, 10], armN: [150, 12], armF: [140, 11], bowl: [120, 10], bowlX: [160, 12], bowlY: [160, 12], hair: [60, 6], fin: [100, 8] },
  fast: ['x', 'armN', 'armF', 'bowlX', 'bowlY', 'lean'],
  kick: { lean: -100, head: -160, hair: 200, fin: 300 },
  turnKick: { hair: 200, fin: 240 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.2;
    const t = a.t + a.uidOff;
    const now = a.now;
    const lu = t % 12;
    const peek = hold(lu, 1.4, 1.9, 3.6, 4.1) * (1 - a.walkW);
    const polish = hold(lu, 6.4, 6.8, 8.6, 9) * (1 - a.walkW);
    const sway = Math.sin(t * 1.3);
    const idle = {
      x: 0, lift: 4 + sway * 2, lean: sway * 3 + peek * 8, head: peek * 14 - sway * 3, armN: polish * Math.sin(t * 12) * 10, armF: -polish * 30, bowl: peek * -10 + polish * Math.sin(t * 3) * 6, bowlX: peek * 2, bowlY: peek * 4, hair: sway * 6, fin: sway * 8,
    };
    const walk = { x: 0, lift: 6 + Math.abs(Math.sin(a.wp)) * 3, lean: 8, head: -4, armN: 0, armF: 0, bowl: 0, bowlX: 0, bowlY: 0, hair: -14, fin: Math.sin(a.wp * 2) * 20 };
    // A slap of her tail's water: the bowl tucked in, a swing of the free arm.
    const antic = { x: -3, lift: 4, lean: -10, head: -8, armN: 0, armF: -100, bowl: 0, bowlX: -2, bowlY: 0, hair: 10, fin: -20 };
    const strike = { x: 6, lift: 4, lean: 12, head: 6, armN: 0, armF: 30, bowl: 0, bowlX: 2, bowlY: 0, hair: -16, fin: 30 };
    const out = stateBlend(a, idle, walk, antic, strike);
    // Blowing a Keepsake Bubble: the bowl lifted to her lips, cheeks puffed.
    const bub = window1(now, m.bubbleAt, 1.4, 0.2, 0.4);
    blendIn(out, bub, { lean: -4, head: -6, armN: -40, armF: -40, bowlX: 6, bowlY: 16, bowl: -14 });
    // The Tidal Strike: her free arm raised, calling the water up.
    const tide = window1(now, m.tideAt, 1.6, 0.25, 0.4);
    blendIn(out, tide, { lift: 10, lean: -8, head: -10, armF: -150, hair: 20 });
    // Hugging her treasures while the tanks are shut: curled round the bowl, eyes squeezed shut.
    const hug = m.mech?.hugging ? 1 : 0;
    blendIn(out, hug, { lift: 2, lean: 10, head: 16, armN: 30, armF: 60, bowlX: -2, bowlY: -2, bowl: 0, hair: -4 });
    // The Great Wave: both arms flung up, hair streaming.
    if (m.slamming > now) blendIn(out, 1, { lift: 16, lean: -12, head: -14, armN: -150, armF: -150, bowlY: 30, bowl: 0, hair: 30, fin: 30 });
    if (m.hp <= 0) blendIn(out, 1, { lift: 0, lean: 10, head: 20, armN: 30, armF: 40 });
    a.crBubble = bub;
    a.crTide = tide;
    a.crHug = hug;
    a.crMood = hug ? 'sleep' : bub > 0.3 ? 'shout' : tide > 0.3 || m.slamming > now ? 'angry' : peek > 0.4 || polish > 0.4 ? 'happy' : null;
    return out;
  },
  parts: [
    { name: 'waist', parent: null, at: (S) => [S.x, -58 - S.lift], rot: (S) => S.lean * D2R },
    { name: 'neck', parent: 'waist', at: () => [1, -22], rot: (S) => S.head * D2R },
    ...crPass(false),
    ...crPass(true),
    { name: 'face', parent: 'neck', s: (a) => crFace(a.face === 'sad' && !a.ph.atk ? 'sad' : moodOf(a, a.crMood)), pivot: [26, 46] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Bubbles drifting up off her; a stream of them as she blows; a shimmer of glass round her
    // while she hugs her treasures.
    for (let k = 0; k < 3; k++) {
      const u = fr(a.t * 0.4 + k / 3);
      ctx.globalAlpha = a.alpha * Math.sin(u * Math.PI) * 0.6;
      ctx.strokeStyle = '#e8fcff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(-14 + k * 14 + Math.sin(u * 6 + k) * 4, -100 - S.lift - u * 40, 1.6 + u * 2, 0, TAU);
      ctx.stroke();
    }
    if (a.crBubble > 0.2) inPart(ctx, mat, 'bowl', () => {
      for (let k = 0; k < 4; k++) {
        const u = fr(a.now * 1.4 + k / 4);
        ctx.globalAlpha = a.alpha * a.crBubble * (1 - u);
        ctx.strokeStyle = '#e8fcff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(8 + u * 26, -18 - u * 10, 2 + u * 6, 0, TAU);
        ctx.stroke();
      }
    });
    if (a.crHug > 0) {
      ctx.globalAlpha = a.alpha * (0.35 + 0.1 * Math.sin(a.now * 3));
      ctx.strokeStyle = '#bff0ff';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, -60, 46, 64, 0, 0, TAU);
      ctx.stroke();
      for (let k = 0; k < 4; k++) sparkle(ctx, a, Math.cos(a.now + k * 1.6) * 44, -60 + Math.sin(a.now + k * 1.6) * 60, 3, 0.8);
    }
  },
});
export function coralieStill(pose, f, mood) {
  const wy = -62;
  const [nx, ny] = [1, wy - 22];
  return {
    w: 120,
    h: 160,
    res: 2,
    shapes: shift([
      ...CR_LOCKX.flatMap((x, k) => put(crLock(k)(), [9, 32], nx + x, ny - 28, (k - 1) * 48)), ...put(crHairBack(), [28, 50], nx, ny),
      ...put(crFin(), [3, 9], 18, wy + 50), ...put(crTail(), [26, 3], 0, wy), ...put(crArm(true)(), [1, 2.6], -8, wy - 18, 40), ...put(crBody(), [16, 25], 0, wy),
      ...put(crHead(), [26, 46], nx, ny), ...put(crFaceShapes(MOODS.has(mood) || mood === 'sad' ? mood : 'idle'), [26, 46], nx, ny), ...put(crBowl(), [13, 20], 9, wy + 4), ...put(crArm(false)(), [1, 2.6], 8, wy - 18, 70),
    ], 60, 156),
  };
}

// =====================================================================================
// The Keepsake Bubble (added 2026-11-18)
// =====================================================================================
// A big wobbly bubble Queen Coralie blows. It drifts after someone; whoever it reaches floats inside
// it (world/aquarium.js) till it's popped. Drawn live (a bubble you see through), no sprite.
export const keepsakeRig = {
  w: 60,
  h: 80,
  draw(ctx, m, a) {
    if (m.hp <= 0) return;
    const t = a.t + (m.uid % 7) * 0.7;
    const held = m.heldId != null;
    const r = 19;
    const cy = -r - (held ? 22 : 12) - Math.sin(t * 2) * 3;
    const wob = Math.sin(t * 3.4) * 0.05;
    ctx.save();
    const g = ctx.createRadialGradient(-6, cy - 7, 1, 0, cy, r);
    g.addColorStop(0, `rgba(240,253,255,${0.45 * a.alpha})`);
    g.addColorStop(0.75, `rgba(159,230,246,${0.12 * a.alpha})`);
    g.addColorStop(1, `rgba(159,230,246,${0.45 * a.alpha})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, cy, r * (1 + wob), r * (1 - wob), 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
    ctx.strokeStyle = a.flash > 0 ? '#ffffff' : '#d8f8ff';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, cy, r * 0.72, r * 0.72, 0, Math.PI * 1.1, Math.PI * 1.45);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.45, cy + r * 0.4, 1.8, 0, TAU);
    ctx.fill();
    // A little bow of seafoam ribbon on top: her keepsakes are gifts.
    ctx.fillStyle = '#ff9ab8';
    ctx.beginPath();
    ctx.moveTo(0, cy - r);
    ctx.lineTo(-6, cy - r - 4);
    ctx.lineTo(-6, cy - r + 3);
    ctx.closePath();
    ctx.moveTo(0, cy - r);
    ctx.lineTo(6, cy - r - 4);
    ctx.lineTo(6, cy - r + 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
};
export function keepsakeStill() {
  return { w: 50, h: 54, res: 2, shapes: shift([...stroke(arcP(0, -24, 19, 19, 0, 360, 24), 1.6, '#d8f8ff', false), F(E(-6, -31, 3, 2, '#ffffff')), T([[0, -43], [-6, -47], [-6, -40]], '#ff9ab8'), T([[0, -43], [6, -47], [6, -40]], '#ff9ab8')], 25, 50) };
}
