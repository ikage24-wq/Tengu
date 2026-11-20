// The Myconid Queen (redrawn 2026-11-19, the player's pick "C, the Puffball Granny"): the mother of
// Rootwood Hollow's mushrooms, a round cream puffball with her face on her front, a lace mob cap with
// a frilled edge and a pink bow, a knitted pink shawl crossed and knotted at her front, stubby legs
// in pink slippers, a root cane in her near paw, and a little wicker basket of baby puffballs in her
// far paw, held at her tummy.
//
// How she moves:
//   idle    a 10 s act: leaning on her cane, rubbing her back ("oh, my back"); hugging the basket
//           up to her cheek, the babies wriggling; a big yawn and a puff of spores.
//   walk    a waddle on her stubby legs, rocking side to side, the cane a walking stick, the shawl's
//           tails and the bow swinging after her.
//   fight   (world/dungeon.js, world/hollow.js) a plain swing is a thump of the cane, overhead
//           and down, spores bursting off its foot; Spore Rain (m.castAt) the cane raised and
//           shaken, spores rising; Spore Mites (m.callAt) the babies hop out of the basket to fight
//           (back in it a while later); Lights Out (m.hideUntil) she huddles down in her shawl
//           hugging the basket, peeking, spores puffing round her; Cap Twirl (m.move 'spin', the
//           world turning her each way) she spins with her cane out and the shawl flying; Spore
//           Tide (m.tideAt) a deep breath, then a great puff of spores along the floor.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, window1, stepPhase, pawStep, put, shift, MOODS, puff, dot, ownFace } from './rigkit.js';

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
const aim = (want, ...turns) => want - turns.reduce((v, x) => v + x, 0);

const PUFF = ramp('#f6eee0', { step: 8, turn: 10 });
const SHAWL = ramp('#ff9ab8', { step: 9, turn: 10 });
const ROOT = ramp('#8a5a3a', { step: 9, turn: 8 });
const WICKER = ramp('#c8945a', { step: 9, turn: 8 });
const SLIPPER = ramp('#ffb4c8', { step: 9, turn: 8 });
const BOW = '#ff7aa0';
const mq = pairOf('mq2');

// ---------- Parts ----------
// (Rig space: the floor at y 0, facing right. Her body's middle 37 above the floor.)
// Her body: a round puffball (box 58 x 56 about (29, 28)).
const bodyP = () => [E(29, 28, 26, 25, PUFF.base), crescent(29, 28, 26, 25, PUFF.sh, { k: 0.16, a0: 100, a1: 220 }), F(E(35, 12, 9, 4, '#fffaf2')), F(E(20, 40, 8, 3, '#f0e2cc'))];
// The shawl wrapped round her back, its two ends coming forward round her sides and knotted at her
// front, low (box 56 x 36 about her body's middle (28, 18)).
const shawlP = () => [
  taper([[7, 7], [10.6, 18], [19, 27], [29, 31.4]], 4, 5.2, SHAWL.base), taper([[49, 7], [45.4, 18], [37, 27], [31, 31.4]], 4, 5.2, SHAWL.base),
  F(taper([[8.4, 10], [11.6, 19], [20, 27.6]], 0.8, 0.7, SHAWL.sh)), F(taper([[47.6, 10], [44.4, 19], [36, 27.6]], 0.8, 0.7, SHAWL.sh)), E(30, 32, 3.6, 3, '#ff8aae'), F(E(29.2, 31.2, 1.3, 0.8, '#ffc0d4')),
];
// A tail of the shawl's knot (box 6 x 12 hanging from (3, 1)).
const tailP = () => [taper([[3, 1], [3, 10]], 3, 2.2, SHAWL.base), F(taper([[3, 9], [3, 11]], 2.2, 2.2, SHAWL.sh))];
// The bonnet (redone 2026-11-19 at the player's note "the hat": it was perched on the very top of
// her ball, its sides out in the air): a puffy white mob cap pulled down over the top of her head,
// a lace frill curving across her forehead with the head's curve. Box 56 x 30 over her body (its
// sprite is her body's space moved by (28, 34)); it hangs on its middle (28, 14).
const CAP_BAND = (u) => [(1 - u) ** 2 * 3.6 + 2 * u * (1 - u) * 28 + u * u * 52.4, (1 - u) ** 2 * 22 + 2 * u * (1 - u) * 12 + u * u * 22];
const bonnetP = () => [
  blob([[3, 23], [4, 13], [12, 4], [28, 0.6], [44, 4], [52, 13], [53, 23], [42, 18.6], [28, 16.6], [14, 18.6]], '#ffffff', 2),
  F(blob([[4, 14], [9, 7], [12, 16], [6, 22]], '#ece6f2', 2)), ...line(arcP(28, 21, 19, 15, 205, 335, 9), 0.6, '#e4dcee'), ...line(arcP(28, 21, 11, 10, 220, 320, 7), 0.6, '#e4dcee'),
  taper(Array.from({ length: 9 }, (_, k) => CAP_BAND(k / 8)), 3.4, 3.4, '#ffffff'),
  ...Array.from({ length: 11 }, (_, k) => {
    const [x, y] = CAP_BAND(k / 10);
    return E(x, y + 1.8, 2.5, 1.9, '#ffffff');
  }),
  ...Array.from({ length: 11 }, (_, k) => {
    const [x, y] = CAP_BAND(k / 10);
    return F(E(x, y + 2.2, 1.1, 0.7, '#f0e8f4'));
  }),
];
// The bow on the bonnet's side (box 16 x 12 about its knot (8, 6)), sat on the lace.
const bowP = () => [blob([[8, 6], [14, 2], [16, 8], [12, 10]], BOW, 1), blob([[8, 6], [3, 2], [1, 9], [4, 10]], BOW, 1), E(8, 6, 1.6, 1.6, '#ff5a88')];
// An arm: one stubby piece in her puffball cream (box 10 x 7 from (2, 3.5); the wrist 6 on), and a
// round paw (box 8 x 8 about (4, 4)).
const ARM = '#ecdcc2';
const ARM_RIM = '#cdb894';
const armP = (far) => () => [taper([[2, 3.5], [8, 3.5]], 5, 4.6, far ? '#e4d2b4' : ARM), E(8, 3.5, 2.3, 2.3, far ? '#e4d2b4' : ARM), F(taper([[2.6, 5.4], [8.4, 5.2]], 0.9, 0.8, ARM_RIM)), F(taper([[3, 2], [7, 2]], 0.7, 0.6, '#fffaf2'))];
const pawP = (far) => () => [E(4, 4, 3.2, 3, far ? '#e4d2b4' : ARM), crescent(4, 4, 3.2, 3, ARM_RIM, { k: 0.3, a0: 20, a1: 160 }), F(E(3.2, 3, 1, 0.7, '#fffaf2'))];
// A leg, short and chunky: thigh (box 9 x 10 from (4.5, 1.5); the knee 6.6 down) and shin (box 9 x
// 10 from (4.5, 2); the ankle 6.6 down), round at the knee on both; a slipper (box 12 x 7 from the
// ankle (4, 1.4)).
const thighP = (far) => () => [taper([[4.5, 1.5], [4.5, 8.1]], 7.4, 7, far ? PUFF.sh : PUFF.base), E(4.5, 8.1, 3.5, 3.5, far ? PUFF.sh : PUFF.base)];
const shinP = (far) => () => [E(4.5, 2, 3.5, 3.5, far ? PUFF.sh : PUFF.base), taper([[4.5, 2], [4.5, 8.6]], 7, 6.4, far ? PUFF.sh : PUFF.base)];
const slipperP = (far) => () => [blob([[0.6, 0.6], [6, 0.4], [10, 2.4], [11.4, 5], [11, 6.4], [0.6, 6.4]], far ? SLIPPER.sh : SLIPPER.base, 1), F(E(8.6, 3, 1.6, 1.2, '#ffffff')), F(R(0.6, 5.6, 10.6, 0.8, '#e8889e'))];
// The root cane (box 40 x 12, gripped at (26.4, 6)), along its length from its foot: a crook curling
// forward at the top.
const caneP = () => [taper([[0.6, 6], [16, 6.6], [32, 6]], 2.8, 2.4, ROOT.base), F(taper([[2, 5.2], [30, 5]], 0.7, 0.5, ROOT.hi)), taper(arcP(32, 9, 3.4, 3.2, 270, 450, 8), 2.4, 2, ROOT.base), ...[[10, 6], [22, 6.4]].map(([x, y]) => F(E(x, y, 1, 1.4, ROOT.sh)))];
// The basket: its handle behind (box 20 x 16, hung at the handle's top (10, 1)) and its wicker front.
const handleP = () => [taper(arcP(10, 7, 7, 6, 180, 360, 9), 1.4, 1.4, WICKER.sh)];
const basketP = () => [blob([[2, 6.4], [18, 6.4], [16, 15], [4, 15]], WICKER.base, 1), ...line([[2.6, 9.4], [17.4, 9.4]], 0.6, WICKER.sh), ...line([[3.4, 12.4], [16.6, 12.4]], 0.6, WICKER.sh), F(taper([[2, 6.6], [18, 6.6]], 1.4, 1.4, WICKER.hi))];
// A baby puffball (box 10 x 10 about (5, 5)); its face is its own.
const babyP = () => [E(5, 5, 3.6, 3.3, PUFF.base), crescent(5, 5, 3.6, 3.3, PUFF.sh, { k: 0.2, a0: 30, a1: 150 })];
const BABY_FACES = {
  sleep: () => [...line(arcP(6.2, 5, 0.8, 0.5, 20, 160, 5), 0.5), ...line(arcP(3.8, 5, 0.7, 0.45, 20, 160, 5), 0.5), F(E(6.6, 6.3, 0.7, 0.4, '#ffa8bc'))],
  awake: () => [F(E(6.2, 4.8, 0.7, 0.8, INK)), F(E(3.8, 4.9, 0.6, 0.7, INK)), F(E(6, 4.5, 0.25, 0.25, '#ffffff')), ...line(arcP(5.2, 6.4, 0.7, 0.4, 20, 160, 5), 0.45), F(E(6.8, 6, 0.7, 0.4, '#ffa8bc'))],
};
const babyFace = (k) => faceSprite(`mq2|baby|${k}`, 10, 10, BABY_FACES[k]);
const MQ = {
  BODY: mq('body', 58, 56, bodyP, 2), SHAWL: mq('shawl', 56, 36, shawlP, 2), TAIL: mq('tail', 6, 12, tailP, 2), BONNET: mq('bonnet', 56, 30, bonnetP, 2), BOW: mq('bow', 16, 12, bowP, 2),
  ARM: [false, true].map((f) => mq(`arm${f ? 1 : 0}`, 10, 7, armP(f), 2)), PAW: [false, true].map((f) => mq(`paw${f ? 1 : 0}`, 8, 8, pawP(f), 2)),
  THIGH: [false, true].map((f) => mq(`thigh${f ? 1 : 0}`, 9, 12, thighP(f), 2)), SHIN: [false, true].map((f) => mq(`shin${f ? 1 : 0}`, 9, 12, shinP(f), 2)), SLIPPER: [false, true].map((f) => mq(`slipper${f ? 1 : 0}`, 12, 7, slipperP(f), 2)),
  CANE: mq('cane', 40, 12, caneP, 2), HANDLE: mq('handle', 20, 16, handleP, 2), BASKET: mq('basket', 20, 16, basketP, 2), BABY: mq('baby', 10, 10, babyP, 2),
};

// ---------- Faces (on her front; box 34 x 26 about (17, 13)) ----------
const EN = [22.4, 13, 3];
const EF = [12.6, 13.2, 2.5];
const MX = 18;
const MY = 19.2;
const LIP = '#7a2a3a';
const eye = ([x, y, r], side, { lid = 0.24, angry = 0, small = false, look = 0 } = {}) => {
  const top = y - r * 1.1 * (1 - lid * 2);
  const yIn = top + angry * r * 0.6;
  const yOut = top - angry * r * 0.2;
  const [yL, yR] = side > 0 ? [yIn, yOut] : [yOut, yIn];
  const lidShape = angry
    ? [F(T([...arcP(x, y, r * 1.16, r * 1.26, 180, 360, 8), [x + r * 1.16, yR], [x - r * 1.16, yL]], PUFF.base)), ...line([[x - r * 1.1, yL], [x + r * 1.1, yR]], 0.7)]
    : lid > 0 ? [F(T([...arcP(x, y, r * 1.14, r * 1.24, 180, 360, 8), ...arcP(x, top, r * 1.14, r * 0.35, 0, 180, 8)], PUFF.base)), ...line(arcP(x, top, r * 1.06, r * 0.33, 15, 165, 7), 0.6)] : [];
  return [
    F(E(x, y, r, r * 1.12, INK)), F(E(x + look, y + r * 0.3, r * 0.78, r * 0.7, '#7a5a3a')),
    ...(small ? [F(E(x + look, y, r * 0.3, r * 0.34, '#ffffff'))] : [F(E(x - r * 0.32 + look, y - r * 0.4, r * 0.4, r * 0.42, '#ffffff')), F(E(x + r * 0.3 + look, y + r * 0.45, r * 0.16, r * 0.16, '#ffffff'))]),
    ...lidShape, ...line([[x + side * r * 0.9, y - r * 0.5], [x + side * r * 1.5, y - r * 0.95]], 0.6),
  ];
};
const shut = ([x, y, r], up = false) => line(arcP(x, y + 0.6, r, r * 0.6, up ? 200 : 20, up ? 340 : 160, 7), 0.8);
const blush = (k = 1) => [F(E(EN[0] + 0.8, EN[1] + 4.6, 2.2 * k, 1.1 * k, '#ffa8bc')), F(E(EF[0] - 1, EF[1] + 4.4, 1.8 * k, 1 * k, '#ffa8bc'))];
const smile = () => line(arcP(MX, MY, 2, 1.1, 20, 160, 7), 0.7, LIP);
const MQ_FACES = {
  // Kindly: lids a little down, a small smile.
  idle: () => [...eye(EN, 1, { lid: 0.1 }), ...eye(EF, -1, { lid: 0.1 }), ...smile(), ...blush()],
  blink: () => [...shut(EN), ...shut(EF), ...smile(), ...blush()],
  // Fond of her babies: eyes shut happily.
  fond: () => [...shut(EN, true), ...shut(EF, true), F(T(arcP(MX, MY - 0.4, 2.2, 2, 0, 180, 9), LIP)), ...blush(1.2)],
  happy: () => [...shut(EN, true), ...shut(EF, true), F(T(arcP(MX, MY - 0.4, 2.4, 2.2, 0, 180, 9), LIP)), F(E(MX, MY + 0.8, 1.2, 0.6, '#ff9ab0')), ...blush(1.15)],
  // "Oh, my back": one eye squeezed, a wobbly mouth.
  ache: () => [...eye(EN, 1, { lid: 0.4 }), ...line([[EF[0] - 2.2, EF[1] - 0.4], [EF[0], EF[1] + 0.6], [EF[0] + 2.2, EF[1] - 0.4]], 0.8), ...line([[MX - 2, MY + 0.6], [MX - 0.6, MY - 0.2], [MX + 0.8, MY + 0.6], [MX + 2, MY - 0.2]], 0.6, LIP), ...blush()],
  yawn: () => [...shut(EN), ...shut(EF), F(E(MX, MY + 0.8, 2, 2.6, LIP)), F(E(MX, MY + 2.2, 1.1, 0.6, '#ff9ab0')), ...blush()],
  angry: () => [...eye(EN, 1, { lid: 0.1, angry: 1, small: true }), ...eye(EF, -1, { lid: 0.1, angry: 1, small: true }), ...line(arcP(MX, MY + 1.4, 2, 0.8, 200, 340, 6), 0.7, LIP), ...blush(0.9)],
  shout: () => [...eye(EN, 1, { lid: 0, small: true }), ...eye(EF, -1, { lid: 0, small: true }), F(E(MX, MY + 0.8, 2.2, 2.4, LIP)), F(E(MX, MY + 2, 1.3, 0.7, '#ff9ab0')), ...blush()],
  // Puffing out spores: cheeks round, lips pursed.
  puff: () => [...shut(EN), ...shut(EF), F(E(MX + 0.6, MY + 0.4, 1.2, 1.2, LIP)), ...blush(1.4)],
  // Lights out: eyes wide, peeking sideways.
  peek: () => [...eye(EN, 1, { lid: 0, look: 0.8 }), ...eye(EF, -1, { lid: 0, look: 0.8 }), ...line(arcP(MX, MY + 1.2, 1.4, 0.7, 200, 340, 6), 0.6, LIP), ...blush()],
  sad: () => [...eye(EN, 1, { lid: 0.3 }), ...eye(EF, -1, { lid: 0.3 }), ...line(arcP(MX, MY + 1.4, 1.8, 0.8, 200, 340, 6), 0.7, LIP), ...blush(0.9)],
  hurt: () => [...line([[EN[0] - 2.4, EN[1] - 1.8], [EN[0] + 1.4, EN[1]], [EN[0] - 2.4, EN[1] + 1.8]], 0.8), ...line([[EF[0] + 2, EF[1] - 1.6], [EF[0] - 1.2, EF[1]], [EF[0] + 2, EF[1] + 1.6]], 0.8), ...line(arcP(MX, MY + 1.6, 2, 1, 200, 340, 6), 0.8, LIP), ...blush()],
  dead: () => [...[EN, EF].flatMap(([x, y, r]) => line(Array.from({ length: 16 }, (_, i) => [x + Math.cos(i * 0.85) * (0.2 + i * r * 0.07), y + Math.sin(i * 0.85) * (0.2 + i * r * 0.07)]), 0.6)), ...line(arcP(MX, MY + 1.8, 2, 1, 200, 340, 6), 0.8, LIP)],
};
const mqFace = (mood) => faceSprite(`mq2|face|${mood}`, 34, 26, () => ownFace(MQ_FACES, mood));

// ---------- Skeleton ----------
const BODY_Y = 34;
const L1 = 6.6;
const L2 = 6.6;
const SOLE = 1.4;
const HIPS = [[8, 20], [-8, 20]];
const UA = 6;
const SHN = [17, 2];
const SHF = [-16, 2];
const FACE_AT = [6, -6];
const BONNET_AT = [0, -20];
const KNOT = [2, 15];
const BASKET_HANG = [-2, -1];
function legIK(dx, dy) {
  const d = Math.min(L1 + L2 - 0.05, Math.max(3, Math.hypot(dx, dy)));
  const h = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const k = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return [(-Math.atan2(dx, dy) - h) / D2R, (Math.PI - k) / D2R];
}
// Both legs for a lift and tilt (the hips ride on her body), each foot stepped by [dx, up].
const legsAt = (lift, tilt, n = [0, 0], f = [0, 0]) => {
  const out = {};
  const r = tilt * D2R;
  [['N', HIPS[0], 9, n], ['F', HIPS[1], -8, f]].forEach(([k, [hx, hy], foot, [dx, up]]) => {
    const hipX = hx * Math.cos(r) - hy * Math.sin(r);
    const hipY = -BODY_Y - lift + hx * Math.sin(r) + hy * Math.cos(r);
    const [th, sh] = legIK(foot + dx - hipX, -SOLE - up - hipY);
    out[`thigh${k}`] = th - tilt;
    out[`shin${k}`] = sh;
    out[`roll${k}`] = up * 6;
  });
  return out;
};

const mqPass = (bare) => {
  const i = bare ? 1 : 0;
  const t = bare ? 'b' : '';
  const leg = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `slipper${k}${t}`, parent: `ankle${k}`, s: MQ.SLIPPER[j][i], pivot: [4, 1.4], rot: (S) => -(S.tilt + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
      { name: `shin${k}${t}`, parent: `knee${k}`, s: MQ.SHIN[j][i], pivot: [4.5, 2], rot: (S) => S[`shin${k}`] * D2R },
      { name: `thigh${k}${t}`, parent: 'bodyJ', s: MQ.THIGH[j][i], pivot: [4.5, 1.5], at: () => HIPS[j], rot: (S) => S[`thigh${k}`] * D2R },
    ];
  };
  const arm = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `arm${k}${t}`, parent: 'bodyJ', s: MQ.ARM[j][i], pivot: [2, 3.5], at: () => (far ? SHF : SHN), rot: (S) => S[`arm${k}`] * D2R },
      { name: `paw${k}${t}`, parent: `wrist${k}`, s: MQ.PAW[j][i], pivot: [4, 4] },
    ];
  };
  const babies = [0, 1].flatMap((n) => [
    { name: `baby${n}${t}`, parent: 'basketJ', s: MQ.BABY[i], pivot: [5, 5], at: (S) => [(n ? 3.4 : -3.2) + S[`bx${n}`], 5.4 - S[`by${n}`]], rot: (S) => S[`br${n}`] * D2R, alpha: (a) => a.mqBaby?.[n] ?? 1 },
    ...(bare ? [{ name: `babyFace${n}`, parent: `baby${n}`, s: (a) => babyFace(a.mqBabyAwake ? 'awake' : 'sleep'), pivot: [5, 5], at: () => [0, 0], alpha: (a) => a.mqBaby?.[n] ?? 1 }] : []),
  ]);
  return [
    ...leg(true),
    ...leg(false),
    { name: `body${t}`, parent: 'bodyJ', s: MQ.BODY[i], pivot: [29, 28] },
    ...(bare ? [{ name: 'face', parent: 'bodyJ', s: (a) => mqFace(a.mqMood ?? 'idle'), pivot: [17, 13], at: () => FACE_AT }] : []),
    { name: `shawl${t}`, parent: 'bodyJ', s: MQ.SHAWL[i], pivot: [28, 18] },
    ...[0, 1].map((n) => ({ name: `tail${n}${t}`, parent: 'bodyJ', s: MQ.TAIL[i], pivot: [3, 1], at: () => [KNOT[0] + (n ? 2 : -2), KNOT[1] + 1], rot: (S) => (S[`tail${n}`] + (n ? -8 : 8)) * D2R })),
    { name: `bonnet${t}`, parent: 'bodyJ', s: MQ.BONNET[i], pivot: [28, 14], at: () => BONNET_AT, rot: (S) => S.bonnet * D2R },
    { name: `bow${t}`, parent: 'bonnet', s: MQ.BOW[i], pivot: [8, 6], at: () => [17, 4.6], rot: (S) => S.bow * 0.5 * D2R },
    // The far arm, its paw and the basket, held in front of her tummy.
    ...arm(true).slice(0, 1),
    { name: `handle${t}`, parent: 'basketJ', s: MQ.HANDLE[i], pivot: [10, 1] },
    ...babies,
    { name: `basket${t}`, parent: 'basketJ', s: MQ.BASKET[i], pivot: [10, 1] },
    ...arm(true).slice(1),
    { ...arm(false)[0] },
    { name: `cane${t}`, parent: 'gripN', s: MQ.CANE[i], pivot: [26.4, 6], rot: (S) => S.cane * D2R },
    arm(false)[1],
  ];
};

export const myconidRig = sized(makeRig({
  w: 86, h: 88, soft: true, stride: 1e9, recover: 0.55,
  springs: {
    x: [200, 16], lift: [200, 15], tilt: [160, 12], armN: [220, 16], armF: [200, 15], cane: [220, 16], basket: [60, 5], bonnet: [120, 8], bow: [70, 5], tail0: [50, 3.6], tail1: [46, 3.4],
    thighN: [320, 20], thighF: [320, 20], shinN: [320, 20], shinF: [320, 20], rollN: [320, 20], rollF: [320, 20],
    bx0: [200, 14], by0: [200, 14], br0: [160, 10], bx1: [200, 14], by1: [200, 14], br1: [160, 10],
  },
  fast: ['x', 'lift', 'tilt', 'armN', 'cane', 'thighN', 'thighF', 'shinN', 'shinF'],
  kick: { tilt: -140, bonnet: -160, bow: 220, tail0: 240, tail1: -220, basket: 200 },
  turnKick: { bonnet: 120, bow: 240, tail0: 300, tail1: -300, basket: 220, tilt: -80 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 0.97;
    const t = a.t + a.uidOff;
    const mo = a.mo ?? {};
    const now = a.now;
    const u = stepPhase(m, a, 'mq2', 14 * 1.12);
    const act = (at, wind, dur) => {
      if (at == null || now < at - wind || now >= at + dur) return null;
      if (now < at) return { antic: smooth(1 - (at - now) / wind), strike: 0 };
      const s = now - at < 0.07 ? smooth((now - at) / 0.07) : 1 - smooth(clamp((now - at - 0.3) / (dur - 0.3), 0, 1));
      return { antic: now - at < 0.07 ? 1 - s : 0, strike: s };
    };
    const rain = window1(now, m.castAt, 1.8, 0.3, 0.4);
    const call = m.callAt != null && now >= m.callAt && now < m.callAt + 9 ? now - m.callAt : -1;
    const hide = m.hideUntil > now ? 1 : 0;
    const spin = m.move?.kind === 'spin' ? clamp((now - m.move.at) / 0.25, 0, 1) * (now < m.move.at + m.move.warn + 0.4 ? 1 : 0) : 0;
    const tideA = act(m.tideAt != null ? m.tideAt + 1.2 : null, 1.2, 1.2);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const still = 1 - walkW;
    // Her idle, a 10 s act: rubbing her back; hugging the basket; a yawn and a puff of spores.
    const lu = fr(t / 10) * 10;
    // (A cutscene portrait of an angry line holds her aggro forever: cross, no idle acts.)
    const cross = m.aggroUntil === Infinity;
    const busy = cross || active || rain > 0.02 || call >= 0 && call < 1.2 || hide || spin > 0.02 || tideA || walkW > 0.05 || m.cine;
    const ache = busy ? 0 : hold(lu, 0.4, 0.9, 2.6, 3.1);
    const hug = busy ? 0 : hold(lu, 3.8, 4.3, 6, 6.5);
    const yawn = busy ? 0 : hold(lu, 7.2, 7.8, 8.8, 9.4);
    const yb = Math.sin(clamp((lu - 7.2) / 2.2, 0, 1) * Math.PI);
    a.mqAct = { ache: ache * still, hug: hug * still, yawn: yawn * still, rain, hide, spin, tide: tideA ? tideA.antic + tideA.strike : 0 };
    const sway = Math.sin(t * 1.3);
    const liftI = sway * 0.4 + yawn * yb * 1.4;
    const tiltI = sway * 1.4 + ache * 8 - yawn * yb * 7;
    const armNI = 70 - ache * 14;
    const armFI = 60 - hug * 70 + ache * 110;
    const idle = {
      x: 0, lift: liftI, tilt: tiltI, armN: armNI, armF: armFI, cane: aim(-90, tiltI, armNI) + ache * 6, basket: Math.sin(t * 1.5) * 4,
      bonnet: Math.sin(t * 1.3 - 0.6) * 2 + yawn * yb * 4, bow: Math.sin(t * 1.6) * 6, tail0: Math.sin(t * 1.4) * 6, tail1: Math.sin(t * 1.4 + 1) * 7,
      ...legsAt(liftI, tiltI),
      bx0: hug * Math.sin(t * 6) * 0.6, by0: hug * Math.abs(Math.sin(t * 6)) * 1.4, br0: hug * Math.sin(t * 6) * 10, bx1: -hug * Math.sin(t * 6 + 1) * 0.6, by1: hug * Math.abs(Math.sin(t * 6 + 1)) * 1.4, br1: hug * Math.sin(t * 6 + 1) * 10,
    };
    // A waddle, rocking side to side, the cane a walking stick.
    const steps = [pawStep(u, 0, 14, 0.6, 3.4), pawStep(u, 0.5, 14, 0.6, 3.4)];
    const sw = Math.sin(u * TAU);
    const land = (1 + Math.cos(u * TAU * 2)) / 2;
    const liftW = 0.6 - land * 1.4;
    const tiltW = sw * 5 + 1.4;
    const armNW = 60 + sw * 10;
    const walk = {
      ...idle, lift: liftW, tilt: tiltW, armN: armNW, armF: 56 - sw * 8, cane: aim(-80 + sw * 6, tiltW, armNW), basket: -sw * 10,
      bonnet: -sw * 3, bow: 14 + Math.sin(u * TAU * 2 - 1) * 10, tail0: 10 + Math.sin(u * TAU * 2 - 1) * 10, tail1: 12 + Math.sin(u * TAU * 2 - 1.6) * 12,
      ...legsAt(liftW, tiltW, steps[0], steps[1]),
    };
    // A thump of the cane: up overhead, then down hard in front of her.
    // (A thump of the cane you can see coming, 2026-11-19: it barely changed from her idle. Up on
    // her toes and rearing back, the cane hoisted over her head foot-up; then leaning right in,
    // the cane's foot brought down hard on the floor in front.)
    const antic = { ...idle, lift: 3, tilt: -12, armN: -115, armF: 40, cane: aim(40, -12, -115), ...legsAt(3, -12) };
    const strike = { ...idle, lift: -3, tilt: 14, x: 4, armN: 40, armF: 70, cane: aim(-140, 14, 40), bonnet: 8, ...legsAt(-3, 14) };
    const S = stateBlend(a, idle, walk, antic, strike);
    const over = (P, w) => {
      if (w <= 0.001) return;
      for (const k of Object.keys(P)) S[k] += (P[k] - S[k]) * w;
    };
    let kind = active ? 'thump' : null;
    let ph = active ? a.ph : { antic: 0, strike: 0 };
    // Spore Rain: the cane raised high and shaken.
    if (rain > 0.01) {
      const shake = Math.sin(now * 22) * 8;
      over({ lift: 1, tilt: -4, armN: -70, cane: aim(-80 + shake, -4, -70), armF: 40, bonnet: -3, ...legsAt(1, -4) }, rain);
      if (!active) kind = 'rain';
    }
    // Lights Out: huddled down in her shawl hugging the basket, peeking out.
    over({ lift: -3, tilt: Math.sin(now * 3) * 1.4, armN: 60, armF: -20, cane: aim(-86, 0, 60), bonnet: 6, ...legsAt(-3, 0) }, hide);
    // Cap Twirl: spinning, the cane held out, everything loose flying.
    if (spin > 0.01) {
      over({ lift: 2 + Math.abs(Math.sin(now * 20)) * 1.4, tilt: -4, armN: -10, cane: aim(-6, -4, -10), armF: -30, basket: 40, bow: 50, tail0: 60, tail1: 70, ...legsAt(2, -4, [3, 2], [-3, 0]) }, spin);
      if (!active) kind = 'spin';
    }
    // Spore Tide: a deep breath, then a great puff of spores along the floor.
    if (tideA) {
      over({ lift: 3, tilt: -10, armN: -20, armF: -10, cane: aim(-90, -10, -20), bonnet: -6, ...legsAt(3, -10) }, tideA.antic);
      over({ lift: -1, tilt: 10, armN: 40, armF: 60, cane: aim(-80, 10, 40), bonnet: 8, ...legsAt(-1, 10) }, tideA.strike);
      if (!active) {
        kind = 'tide';
        ph = tideA;
      }
    }
    // Spore Mites: the babies hop out of the basket to fight (and back in a while later).
    const baby = [1, 1];
    if (call >= 0) {
      [0, 1].forEach((n) => {
        const c = call - n * 0.15;
        const hop = clamp((c - 0.2) / 0.6, 0, 1);
        const gone = c > 0.8 && c < 8.2;
        const back = clamp((c - 8.2) / 0.5, 0, 1);
        S[`by${n}`] += c < 0.2 ? -1 : Math.sin(hop * Math.PI) * 16;
        S[`bx${n}`] += (n ? 1 : -1) * hop * 18;
        baby[n] = gone ? 0 : c >= 8.2 ? back : 1 - smooth(clamp((hop - 0.7) / 0.3, 0, 1));
      });
      if (call < 1.2) over({ armF: 20, basket: Math.sin(now * 18) * 14, tilt: -3 }, 1);
    }
    a.mqBaby = baby;
    a.mqBabyAwake = call >= 0 && call < 9;
    a.mqKind = kind;
    a.mqPh = ph;
    a.mqMood = mqMood(a, m);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'kneeN', parent: 'thighN', at: () => [0, L1] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, L1] },
    { name: 'ankleN', parent: 'shinN', at: () => [0, L2] },
    { name: 'ankleF', parent: 'shinF', at: () => [0, L2] },
    { name: 'wristN', parent: 'armN', at: () => [UA, 0] },
    { name: 'wristF', parent: 'armF', at: () => [UA, 0] },
    { name: 'gripN', parent: 'pawN', at: () => [0, 0] },
    // (The basket hangs from the far paw, always upright, swinging a little.)
    { name: 'basketJ', parent: 'pawF', at: () => BASKET_HANG, rot: (S) => (S.basket - S.tilt - S.armF) * D2R },
    ...mqPass(false),
    ...mqPass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.22;
    ctx.fillStyle = '#2a3a2a';
    ctx.beginPath();
    ctx.ellipse(0, -0.6, 26, 3.6, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const act = a.mqAct ?? {};
    const ph = a.mqPh ?? a.ph;
    const kind = a.mqKind;
    const caneM = mat('cane');
    const [cfx, cfy] = at2(caneM, -26.4, 0);
    const [ctx0, cty0] = at2(caneM, 6, 3);
    const PINK = '255,190,214';
    // The thump: spores bursting off the cane's foot.
    if (kind === 'thump' && ph.strike > 0.2) {
      const q = 1 - ph.strike;
      for (let k = 0; k < 5; k++) puff(ctx, a, cfx + (k - 2) * (4 + q * 6), cfy - 2 - Math.abs(k - 2) * 1.6 - q * 6, 3 + q * 4, ph.strike * 0.85, PINK);
    }
    // Spore Rain: spores rising off the shaken cane.
    if (act.rain > 0.1) {
      for (let k = 0; k < 4; k++) {
        const q = fr(a.now * 0.9 + k / 4);
        dot(ctx, a, ctx0 + Math.sin(q * 7 + k) * 6, cty0 - q * 30, 1.6 + q, act.rain * (1 - q), '#ffc0d4');
      }
    }
    // Lights Out: spores puffing round her as she hides.
    if (act.hide > 0.1) {
      for (let k = 0; k < 4; k++) {
        const q = fr(a.now * 0.5 + k / 4);
        puff(ctx, a, -18 + k * 12, -14 - q * 20, 5 + q * 4, (1 - q) * 0.5, PINK);
      }
    }
    // Cap Twirl: a ring of spores flung off her.
    if (act.spin > 0.2) {
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * TAU + a.now * 6;
        dot(ctx, a, Math.cos(ang) * 30, -24 + Math.sin(ang) * 8, 1.8, act.spin * 0.8, '#ffc0d4');
      }
    }
    // Spore Tide: a great puff rolling out along the floor both ways.
    if (kind === 'tide' && ph.strike > 0.1) {
      const q = 1 - ph.strike;
      for (let k = 0; k < 6; k++) {
        const sd = k % 2 ? 1 : -1;
        puff(ctx, a, sd * (16 + q * 46 + (k >> 1) * 10), -6 - (k >> 1) * 4, 7 + q * 7, ph.strike * 0.8, PINK);
      }
    }
    // The yawn: a little puff of spores.
    if ((act.yawn ?? 0) > 0.5) {
      const [fx, fy] = at2(mat('bodyJ'), FACE_AT[0] + 4, FACE_AT[1] + 8);
      const q = fr(a.now * 0.8);
      puff(ctx, a, fx + 4 + q * 8, fy - q * 8, 2 + q * 3, act.yawn * (1 - q) * 0.7, PINK);
    }
    ctx.globalAlpha = a.alpha;
  },
}), 1.12);
function mqMood(a, m) {
  if (m.hp <= 0) return 'dead';
  const ph = a.mqPh ?? a.ph;
  const kind = a.mqKind;
  const act = a.mqAct ?? {};
  if (kind === 'tide') return ph.strike > 0.1 ? 'puff' : 'angry';
  if (kind === 'spin') return 'shout';
  if (act.hide > 0.5) return 'peek';
  if (kind === 'rain') return 'shout';
  if (ph.strike > 0.25) return 'shout';
  if (a.ph.atk || ph.antic > 0.3) return 'angry';
  if (a.mood === 'hurt' || a.face === 'hurt') return 'hurt';
  if (m.cine?.mood === 'angry' || m.aggroUntil === Infinity) return 'angry';
  if (m.cine?.mood === 'happy' || a.now - (m.gloatAt ?? -9) < 0.9) return 'happy';
  if (m.cine?.mood === 'sad') return 'sad';
  if (act.ache > 0.4) return 'ache';
  if (act.hug > 0.4) return 'fond';
  if (act.yawn > 0.4) return 'yawn';
  const t = a.t + (a.uidOff ?? 0);
  if (t % 4.4 < 0.13) return 'blink';
  return 'idle';
}

// ---------- The still (portraits) ----------
export function myconidStill(pose, f, mood) {
  const fm = MQ_FACES[mood] ? mood : MOODS.has(mood) ? mood : 'idle';
  const lg = legsAt(0, 0);
  const B = [0, -BODY_Y];
  const at = ([x, y]) => [B[0] + x, B[1] + y];
  const legAt = (far) => {
    const k = far ? 'F' : 'N';
    const [hx, hy] = at(HIPS[far ? 1 : 0]);
    const th = lg[`thigh${k}`];
    const sh = lg[`shin${k}`];
    const kx = hx - Math.sin(th * D2R) * L1;
    const ky = hy + Math.cos(th * D2R) * L1;
    const ax = kx - Math.sin((th + sh) * D2R) * L2;
    const ay = ky + Math.cos((th + sh) * D2R) * L2;
    return [...put(slipperP(far)(), [4, 1.4], ax, ay, 0), ...put(shinP(far)(), [4.5, 2], kx, ky, th + sh), ...put(thighP(far)(), [4.5, 1.5], hx, hy, th)];
  };
  const arm = (far, ang) => {
    const [sx, sy] = at(far ? SHF : SHN);
    const wx = sx + Math.cos(ang * D2R) * UA;
    const wy = sy + Math.sin(ang * D2R) * UA;
    return { arm: put(armP(far)(), [2, 3.5], sx, sy, ang), paw: put(pawP(far)(), [4, 4], wx, wy, 0), w: [wx, wy] };
  };
  const an = arm(false, 70);
  const af = arm(true, 60);
  const [bx, by] = [af.w[0] + BASKET_HANG[0], af.w[1] + BASKET_HANG[1]];
  return { w: 86, h: 88, res: 2, shapes: shift([
    ...legAt(true), ...legAt(false),
    ...put(bodyP(), [29, 28], ...B), ...put((MQ_FACES[fm] ?? MQ_FACES.idle)(), [17, 13], ...at(FACE_AT)), ...put(shawlP(), [28, 18], ...B),
    ...[0, 1].flatMap((n) => put(tailP(), [3, 1], ...at([KNOT[0] + (n ? 2 : -2), KNOT[1] + 1]), n ? -8 : 8)),
    ...put(bonnetP(), [28, 14], ...at(BONNET_AT)), ...put(bowP(), [8, 6], ...at([BONNET_AT[0] + 17, BONNET_AT[1] + 4.6])),
    ...af.arm, ...put(handleP(), [10, 1], bx, by), ...put(babyP(), [5, 5], bx - 3, by + 5.4), ...put(BABY_FACES.sleep(), [5, 5], bx - 3, by + 5.4), ...put(babyP(), [5, 5], bx + 3, by + 5.4), ...put(BABY_FACES.sleep(), [5, 5], bx + 3, by + 5.4), ...put(basketP(), [10, 1], bx, by),
    ...af.paw, ...put(caneP(), [26.4, 6], an.w[0], an.w[1], -90), ...an.arm, ...an.paw,
  ], 43, 86) };
}
