// Gretel, the Gingerbread Knight (redrawn 2026-11-19, the player's pick "C, the Peppermint
// Lancer"): a light, quick gingerbread girl. Icing hair with a piped fringe and a long icing pigtail,
// a big red bow, a red-and-white striped candy tabard with a mint belt and a gumdrop buckle,
// striped socks, red boots, red mittens. Her candy-cane lance (its crook down by her boots, a mint
// pennant near the tip) stands upright in her near hand, beside her face, never across it; her
// peppermint swirl shield is slung on her back, and comes round into her far hand when she raises
// her Icing Shield.
//
// How she moves:
//   idle    a 10 s act: at attention, bouncing on her toes; a twirl of the lance; a proud salute,
//           the lance raised, nose in the air.
//   walk    a brisk little march on planted feet (knees bend to wherever each foot is, so nothing
//           slides): high steps, a bounce, the far arm swinging, pigtail, bow, tabard and pennant
//           swinging a beat behind.
//   fight   (world/volcano.js) aiming her charge (m.aim): the lance couched, a crouch, a foot
//           scraping; the charge (m.charging): leaning in, lance level, running flat out, pigtail
//           streaming; the Icing Shield (m.shieldUntil): the shield brought round in front;
//           Frosting Rain (m.rainAt): the lance raised to the sky, then swept down; a plain swing
//           is a thrust.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, blend, clamp, smooth, TAU } from './rig.js';
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
const blob = (pts, c) => T(smoothPts(pts), c);
const INK = '#2e1c26';
const line = (pts, w, c = INK) => stroke(pts, w, c).map(F);
const icing = (pts, w = 1.1) => line(pts, w, '#ffffff');
const aim = (want, arm, elb, tilt = 0) => want - arm - elb - tilt;

const GB = ramp('#c8844a', { step: 9, turn: 10 });
const MINT = ramp('#7ae0c0', { step: 8, turn: 8 });
const CANE = '#e8384a';
const gt = pairOf('gt2');

// ---------- Parts ----------
// (Chest space: the chest joint 2 above the hip, the hip 22 above the floor; shoulders at (6, -22)
// and (-8, -22); the neck at (0, -25); the head's centre 15 above it.)
const HX = 18;
const HY = 16;
// Her head: a round gingerbread face, icing cheek swirls, a tiny nose, and a fringe of piped icing
// hair. Box 36 x 32; the neck at (18, 31).
const gtHead = () => [
  blob([[HX - 13, HY + 2], [HX - 17, HY + 8], [HX - 12, HY + 8], [HX - 13, HY + 12], [HX - 7, HY + 10]], GB.base),
  E(HX, HY, 15, 14, GB.base), crescent(HX, HY, 15, 14, GB.sh, { k: 0.15, a0: 110, a1: 210 }),
  ...line(arcP(HX - 6, HY + 6, 2, 1.6, 0, 300, 8), 0.7, '#ffffff'), ...line(arcP(HX + 12, HY + 5, 1.6, 1.3, 0, 300, 8), 0.6, '#ffffff'), F(E(HX + 13, HY + 2, 1.1, 0.9, GB.sh)),
  blob([[HX - 14, HY - 3], [HX - 12, HY - 11], [HX - 2, HY - 15], [HX + 9, HY - 12], [HX + 13, HY - 6], [HX + 6, HY - 8], [HX, HY - 5], [HX - 6, HY - 8], [HX - 10, HY - 3]], '#ffffff'),
  F(blob([[HX - 8, HY - 11], [HX - 1, HY - 13.6], [HX + 4, HY - 12], [HX - 3, HY - 11]], '#f4eeff')), ...line([[HX - 10, HY - 5], [HX - 6, HY - 9]], 0.4, '#e4dcf0'), ...line([[HX + 2, HY - 8], [HX + 6, HY - 11]], 0.4, '#e4dcf0'),
];
// The bow: two red loops and a knot (box 22 x 12 about its knot (11, 7)).
const gtBow = () => [blob([[10, 6], [1, 1], [1, 10]], CANE), blob([[12, 6], [21, 0.6], [21, 10]], CANE), F(blob([[4, 3], [9, 5.6], [4, 7]], '#ff7a8a')), F(blob([[18, 3], [13, 5.6], [18, 7]], '#ff7a8a')), E(11, 6.4, 2.6, 2.6, '#c8283a')];
// The icing pigtail, two pieces (box 10 x 14 from its root (5, 1)), and a ribbon tie.
const gtPig = (k) => () => [taper([[5, 1], [5, 12]], k ? 4.6 : 5.6, k ? 2.2 : 4.6, '#ffffff'), ...line([[3.6, 4], [6.2, 6], [3.6, 8]], 0.4, '#e4dcf0'), ...(k ? [] : [E(5, 1.6, 2.6, 1.6, CANE)])];
// Her round gingerbread body. Box 32 x 30; the chest joint at (16, 27).
const gtBody = () => [blob([[3, 4], [29, 4], [31, 16], [29, 28], [3, 28], [1, 16]], GB.base), crescent(16, 16, 14, 13, GB.sh, { k: 0.14, a0: 110, a1: 220 })];
// The striped candy tabard, a mint belt with a gumdrop buckle. Box 26 x 30; hung at (13, 1).
const gtTabard = () => [
  T([[3, 1], [23, 1], [25, 27], [13, 29.4], [1, 27]], '#ffffff'),
  ...[0, 1, 2, 3, 4].map((k) => F(T([[2 + k * 5, 1], [5 + k * 5, 1], [9 + k * 5, 28], [6 + k * 5, 28]], CANE))),
  R(0.6, 14, 24.8, 3, MINT.sh), F(R(0.6, 14, 24.8, 1, MINT.base)), F(E(13, 15.4, 2, 2, '#ffd36b')), F(E(12.4, 14.8, 0.6, 0.5, '#ffffff')),
  ...line([[1, 27], [13, 29.4], [25, 27]], 0.5, '#e8d8e8'),
];
// A sleeve-less gingerbread arm: the upper (box 11 x 8 from (2, 4); the elbow 7.5 on), the forearm
// (box 11 x 8 from (2, 4); the grip 7.5 on), a red mitten (box 8 x 8 about (4, 4)).
const gtUpper = (far) => () => [taper([[2, 4], [9.5, 4]], 5.4, 5, far ? GB.sh : GB.base), ...icing([[2.4, 2], [2.4, 6]], 0.7)];
const gtFore = (far) => () => [taper([[2, 4], [9.5, 4]], 5, 4.6, far ? GB.sh : GB.base), ...icing([[8.4, 2.2], [8.4, 5.8]], 0.7)];
const gtMitt = (far) => () => [E(4, 4, 3.4, 3.2, far ? '#c8283a' : CANE), F(E(3, 3, 1.1, 0.8, '#ff8a9a'))];
// A leg: the thigh (box 8 x 10 from the hip (4, 1.5); the knee 7 down), the shin in a striped sock
// (box 8 x 10 from (4, 1); the ankle 7.6 down), the red boot (box 14 x 9 from the ankle (4.6, 2)).
const gtThigh = (far) => () => [taper([[4, 1.5], [4, 8.6]], 5.6, 5.2, far ? GB.sh : GB.base)];
const gtShin = (far) => () => [taper([[4, 1], [4, 7.6]], 5.2, 4.8, far ? '#e8dcd8' : '#ffffff'), ...[2.6, 5.2].map((y) => F(R(1.4, y, 5.2, 1.3, far ? '#c8283a' : CANE)))];
const gtBoot = (far) => () => [blob([[1, 0.4], [8.2, 0.4], [8.6, 3.4], [12.4, 4.4], [12.8, 7.8], [0.6, 7.8]], far ? '#c8283a' : CANE), F(R(0.8, 0.2, 7.6, 1.8, '#ffffff')), F(R(0.8, 7, 12, 0.8, '#2a1a1a')), F(E(10, 4.6, 1.2, 0.7, '#ff8a9a'))];
// The candy-cane lance, gripped at (8, 64): its point up top, the crook at the bottom. Box 16 x 88.
const gtLance = () => {
  const out = [taper([[8, 78], [8, 10]], 4, 2.8, '#ffffff')];
  for (let k = 0; k < 10; k++) out.push(F(taper([[6.4, 76 - k * 6.8], [9.6, 73 - k * 6.8]], 1.6, 1.4, CANE)));
  out.push(T([[5.4, 12], [8, 1], [10.6, 12]], '#ffffff'), F(T([[7.2, 10], [8, 3], [8.8, 10]], '#f4eeff')), ...line(arcP(11.6, 79, 3.8, 4.2, 180, 360, 8).map(([x, y]) => [x, y + 2]), 3.4, '#ffffff'), F(R(6.6, 60, 2.8, 8, '#c8283a')));
  return out;
};
// The pennant, from the lance (box 16 x 10 from (1, 2)).
const gtPennant = () => [T([[1, 1], [15, 4], [6, 5], [15, 9], [1, 8]], MINT.base), F(T([[1, 1], [10, 3], [1, 4]], MINT.hi))];
// The peppermint shield (box 20 x 20 about (10, 10)).
const gtShield = () => [E(10, 10, 9, 9, '#ffffff'), ...[0, 1, 2, 3, 4, 5].map((k) => F(T([[10, 10], [10 + Math.cos(k * 1.05) * 8.6, 10 + Math.sin(k * 1.05) * 8.6], [10 + Math.cos(k * 1.05 + 0.5) * 8.6, 10 + Math.sin(k * 1.05 + 0.5) * 8.6]], CANE))), E(10, 10, 2, 2, '#ffffff'), F(E(7, 6.6, 1.8, 1, '#ffffff'))];
const GT = {
  HEAD: gt('head', 36, 32, gtHead, 2), BOW: gt('bow', 22, 12, gtBow, 2), PIG: [0, 1].map((k) => gt(`pig${k}`, 10, 14, gtPig(k), 2)),
  BODY: gt('body', 32, 30, gtBody, 2), TABARD: gt('tabard', 26, 30, gtTabard, 10),
  UP: [false, true].map((f) => gt(`up${f ? 1 : 0}`, 11, 8, gtUpper(f), 2)), FORE: [false, true].map((f) => gt(`fore${f ? 1 : 0}`, 11, 8, gtFore(f), 2)), MITT: [false, true].map((f) => gt(`mitt${f ? 1 : 0}`, 8, 8, gtMitt(f), 2)),
  THIGH: [false, true].map((f) => gt(`thigh${f ? 1 : 0}`, 8, 10, gtThigh(f), 2)), SHIN: [false, true].map((f) => gt(`shin${f ? 1 : 0}`, 8, 10, gtShin(f), 2)), BOOT: [false, true].map((f) => gt(`boot${f ? 1 : 0}`, 14, 9, gtBoot(f), 2)),
  LANCE: gt('lance', 16, 88, gtLance, 6), PENNANT: gt('pennant', 16, 10, gtPennant, 2), SHIELD: gt('shield', 20, 20, gtShield, 2),
};

// ---------- Faces ----------
const EN = [HX + 6.6, HY + 0.4, 2.8];
const EF = [HX - 2.8, HY + 0.4, 2.5];
const eye = ([x, y, r], { lid = 0, small = false } = {}) => [
  F(E(x, y, r, r * 1.15, INK)), F(E(x, y + r * 0.35, r * 0.8, r * 0.7, '#3a7ad8')),
  ...(small ? [F(E(x, y, r * 0.3, r * 0.34, '#ffffff'))] : [F(E(x - r * 0.3, y - r * 0.4, r * 0.4, r * 0.42, '#ffffff')), F(E(x + r * 0.35, y + r * 0.4, r * 0.15, r * 0.15, '#ffffff'))]),
  ...(lid > 0 ? [F(T([...arcP(x, y, r * 1.12, r * 1.25, 180, 360, 8), ...arcP(x, y - r * 1.15 * (1 - lid * 2), r * 1.12, r * 0.35, 0, 180, 8)], GB.base)), ...line(arcP(x, y - r * 1.15 * (1 - lid * 2), r * 1.05, r * 0.32, 15, 165, 7), 0.6)] : []),
];
const shutE = ([x, y, r], up = false) => line(arcP(x, y + 0.6, r, r * 0.6, up ? 200 : 20, up ? 340 : 160, 7), 0.7);
const BROW = '#7a4a2a';
const brows = (n, f, c = BROW) => [F(taper(n, 1.1, 0.6, c)), F(taper(f, 1, 0.5, c))];
const BN = [[HX + 3.4, HY - 4], [HX + 9, HY - 4.4]];
const BF = [[HX - 5.4, HY - 3.6], [HX - 0.8, HY - 4]];
const up = (pts, k) => pts.map(([x, y]) => [x, y - k]);
const MOUTH = [HX + 7, HY + 7.4];
const smile = () => line(arcP(...MOUTH, 2, 1.2, 20, 160, 6), 0.7, '#a02a4a');
const openM = (k = 1) => [F(E(MOUTH[0], MOUTH[1] + 0.6, 2 * k, 1.8 * k, '#a02a4a')), F(E(MOUTH[0], MOUTH[1] + 1.4, 1.1 * k, 0.7 * k, '#ff9ab0'))];
const frown = () => line(arcP(MOUTH[0], MOUTH[1] + 1, 1.8, 0.9, 200, 340, 6), 0.7, '#a02a4a');
const blush = (k = 1) => [F(E(HX - 7, HY + 5.2, 2 * k, 1 * k, '#ff8aa8')), F(E(HX + 11.4, HY + 4.6, 1.6 * k, 0.8 * k, '#ff8aa8'))];
const GT_FACES = {
  idle: () => [...eye(EN), ...eye(EF), ...brows(BN, BF), ...smile(), ...blush()],
  blink: () => [...shutE(EN), ...shutE(EF), ...brows(BN, BF), ...smile(), ...blush()],
  happy: () => [...shutE(EN, true), ...shutE(EF, true), ...brows(up(BN, 1), up(BF, 1)), ...openM(0.9), ...blush(1.2)],
  // Proud: eyes shut, nose up, a satisfied smile.
  proud: () => [...shutE(EN, true), ...shutE(EF, true), ...brows(up(BN, 1.4), up(BF, 1.4)), ...smile(), ...blush(1.1)],
  // Aiming: one eye narrowed down the lance.
  focus: () => [...eye(EN, { lid: 0.42, small: true }), ...eye(EF, { lid: 0.2 }), ...brows([[HX + 3.2, HY - 2.6], [HX + 9.2, HY - 4.6]], BF, INK), ...frown(), ...blush(0.8)],
  angry: () => [...eye(EN, { lid: 0.2, small: true }), ...eye(EF, { lid: 0.2, small: true }), ...brows([[HX + 3.2, HY - 2.4], [HX + 9.2, HY - 4.8]], [[HX - 5.6, HY - 4.4], [HX - 0.6, HY - 2.6]], INK), ...frown(), ...blush(0.8)],
  shout: () => [...eye(EN, { small: true }), ...eye(EF, { small: true }), ...brows(up(BN, 1.6), up(BF, 1.6), INK), ...openM(1.3), ...blush(0.8)],
  hurt: () => [...line([[EN[0] - 2.4, EN[1] - 1.8], [EN[0] + 1.4, EN[1]], [EN[0] - 2.4, EN[1] + 1.8]], 0.7), ...line([[EF[0] + 2, EF[1] - 1.8], [EF[0] - 1.2, EF[1]], [EF[0] + 2, EF[1] + 1.8]], 0.7), ...brows([[HX + 3.4, HY - 5], [HX + 9, HY - 3]], [[HX - 5.4, HY - 3], [HX - 0.8, HY - 5]]), ...frown(), E(HX + 10.6, HY + 3, 0.9, 1.4, '#6ec4ff')],
  dead: () => [...line([[EN[0] - 2, EN[1] - 2], [EN[0] + 2, EN[1] + 2]], 0.7), ...line([[EN[0] + 2, EN[1] - 2], [EN[0] - 2, EN[1] + 2]], 0.7), ...line([[EF[0] - 1.8, EF[1] - 1.8], [EF[0] + 1.8, EF[1] + 1.8]], 0.6), ...line([[EF[0] + 1.8, EF[1] - 1.8], [EF[0] - 1.8, EF[1] + 1.8]], 0.6), ...openM(0.6)],
};
const gtFace = (mood) => faceSprite(`gt2|face|${mood}`, 36, 32, () => ownFace(GT_FACES, mood));

// ---------- Skeleton ----------
const HIP = 22;
const L1 = 7;
const L2 = 7.6;
const LEG_DY = 14.2;
const UA = 7.5;
const FA = 7.5;
function legIK(dx, dy, hipDeg) {
  const d = Math.min(L1 + L2 - 0.05, Math.max(3, Math.hypot(dx, dy)));
  const h = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const k = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return [(-Math.atan2(dx, dy) - h) / D2R - hipDeg, (Math.PI - k) / D2R];
}
const [ST, SS] = legIK(0, LEG_DY, 0);
const legs = (tn, sn, tf, sf) => ({ thighN: tn, shinN: sn, thighF: tf, shinF: sf, rollN: 0, rollF: 0 });
const STAND = legs(ST, SS, ST, SS);
// The lance sampled along its length (in its own space about the grip), against her head.
const LANCE_PTS = Array.from({ length: 14 }, (_, k) => [0, 12 - k * 6]);
const behind = (a, S) => {
  const ar = S.armN * D2R;
  const er = (S.armN + S.elbN) * D2R;
  const wx = 6 + UA * Math.cos(ar) + FA * Math.cos(er);
  const wy = -22 + UA * Math.sin(ar) + FA * Math.sin(er);
  const pr = (S.armN + S.elbN + S.lance) * D2R;
  const hr = (S.head - S.tilt * 0.5) * D2R;
  const hx = 15 * Math.sin(hr);
  const hy = -25 - 15 * Math.cos(hr);
  return LANCE_PTS.some(([px, py]) => {
    const x = wx + px * Math.cos(pr) - py * Math.sin(pr);
    const y = wy + px * Math.sin(pr) + py * Math.cos(pr);
    return ((x - hx) / 16.4) ** 2 + ((y - hy) / 15.6) ** 2 < 1;
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

const shieldOn = (a) => (a.gtShield ?? 0) > 0.5;
const shieldOff = (a) => !shieldOn(a);

const gtPass = (bare) => {
  const i = bare ? 1 : 0;
  const t = bare ? 'b' : '';
  const leg = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `boot${k}${t}`, parent: `ankle${k}`, s: GT.BOOT[j][i], pivot: [4.6, 2], rot: (S) => -(S.tilt * 0.3 + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
      { name: `shin${k}${t}`, parent: `knee${k}`, s: GT.SHIN[j][i], pivot: [4, 1], rot: (S) => S[`shin${k}`] * D2R },
      { name: `thigh${k}${t}`, parent: 'hip', s: GT.THIGH[j][i], pivot: [4, 1.5], at: () => [far ? -4 : 5, 0], rot: (S) => S[`thigh${k}`] * D2R },
    ];
  };
  const arm = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return {
      up: { name: `up${k}${t}`, parent: 'chest', s: GT.UP[j][i], pivot: [2, 4], at: () => (far ? [-8, -22] : [6, -22]), rot: (S) => S[`arm${k}`] * D2R },
      fore: { name: `fore${k}${t}`, parent: `elbow${k}`, s: GT.FORE[j][i], pivot: [2, 4], rot: (S) => S[`elb${k}`] * D2R },
      mitt: { name: `mitt${k}${t}`, parent: `grip${k}`, s: GT.MITT[j][i], pivot: [4, 4] },
    };
  };
  const an = arm(false);
  const af = arm(true);
  const lance = { name: `lance${t}`, parent: 'gripN', s: GT.LANCE[i], pivot: [8, 64], rot: (S) => S.lance * D2R };
  const pennant = { name: `pennant${t}`, parent: 'lance', s: GT.PENNANT[i], pivot: [1, 2], at: () => [1, -46], rot: (S) => S.pennant * D2R };
  return [
    // The shield on her back (while it's not raised), behind her.
    { name: `shieldk${t}`, parent: 'chest', s: GT.SHIELD[i], pivot: [10, 10], at: () => [-14, -12], rot: (S) => S.tilt * 0.2 * D2R, when: shieldOff },
    { name: `pig1${t}`, parent: 'pig0', s: GT.PIG[1][i], pivot: [5, 1], at: () => [0, 11], rot: (S) => S.pigB * D2R },
    { name: `pig0${t}`, parent: 'nk', s: GT.PIG[0][i], pivot: [5, 1], at: () => [-12, -16], rot: (S) => S.pigA * D2R },
    // (Her far arm, behind her; while the shield is up it reaches round in front instead: below.)
    { ...af.up, when: shieldOff }, { ...af.fore, when: shieldOff }, { ...af.mitt, when: shieldOff },
    ...leg(true),
    { name: `body${t}`, parent: 'chest', s: GT.BODY[i], pivot: [16, 27] },
    ...leg(false),
    { name: `tabard${t}`, parent: 'chest', s: GT.TABARD[i], pivot: [13, 1], at: () => [0, -22], rot: (S) => S.tab * D2R },
    // Raised, the shield in her far hand, in front of her.
    // Raised: her far arm comes round across her chest, her mitt gripping the shield's rim.
    { ...af.up, name: `upFs${t}`, when: shieldOn }, { ...af.fore, name: `foreFs${t}`, when: shieldOn },
    { name: `shield${t}`, parent: 'gripF', s: GT.SHIELD[i], pivot: [1.6, 10], rot: (S) => -(S.armF + S.elbF) * D2R, when: shieldOn },
    { ...af.mitt, name: `mittFs${t}`, when: shieldOn },
    an.up,
    { ...an.fore, name: `foreNk${t}`, when: behind }, { ...lance, name: `lancek${t}`, when: behind }, { ...pennant, name: `pennantk${t}`, parent: 'lancek', when: behind }, { ...an.mitt, name: `mittNk${t}`, when: behind },
    { name: `head${t}`, parent: 'nk', s: GT.HEAD[i], pivot: [18, 31] },
    ...(bare ? [{ name: 'face', parent: 'nk', s: (a) => gtFace(a.gtMood), pivot: [18, 31] }] : []),
    { name: `bow${t}`, parent: 'nk', s: GT.BOW[i], pivot: [11, 7], at: () => [-2, -30], rot: (S) => S.bow * D2R },
    { ...an.fore, when: before }, { ...lance, when: before }, { ...pennant, when: before }, { ...an.mitt, when: before },
  ];
};

// ---------- Moves ----------
// The lance's world angle: 0 upright (point up), 90 level forward, -90 level back.
function gtMove(kind) {
  const base = { pigA: 20, pigB: 6, bow: 0, tab: 0, pennant: 10, armF: 110, elbF: -30, shieldUp: 0 };
  if (kind === 'rain') return [
    // Frosting Rain: the lance raised straight up to the sky, up on her toes...
    { ...base, x: 0, lift: 2, tilt: -8, head: -14, armN: -70, elbN: -14, lance: aim(-4, -70, -14, -8), armF: -110, elbF: -10, pigA: 30, bow: -6, pennant: 30, ...legs(ST + 8, SS - 14, ST + 8, SS - 14) },
    // ...then swept down to point at you, the frosting falling.
    { ...base, x: 4, lift: 0, tilt: 10, head: 4, armN: -10, elbN: 0, lance: aim(70, -10, 0, 10), armF: 130, elbF: -20, pigA: 4, bow: 8, pennant: -10, ...legs(ST - 14, SS + 8, ST + 8, SS) },
  ];
  // A thrust: the lance drawn back level, then driven forward.
  return [
    { ...base, x: -3, lift: -1, tilt: -6, head: -2, armN: 140, elbN: -50, lance: aim(84, 140, -50, -6), armF: 70, elbF: -40, pigA: 30, bow: -4, pennant: 20, ...legs(ST + 8, SS + 4, ST - 6, SS + 8) },
    { ...base, x: 8, lift: -1, tilt: 14, head: 6, armN: -6, elbN: 6, lance: aim(90, -6, 6, 14), armF: 150, elbF: -10, pigA: 50, pigB: 20, bow: 10, tab: -6, pennant: -20, ...legs(ST - 28, SS + 12, ST + 20, SS - 4) },
  ];
}

export const gretelRig = sized(makeRig({
  w: 64, h: 100, soft: true, stride: 8, recover: 0.55,
  springs: {
    x: [220, 16], lift: [200, 14], tilt: [170, 12], head: [140, 10], armN: [220, 15], elbN: [230, 16], armF: [170, 12], elbF: [180, 12], lance: [220, 15],
    thighN: [300, 18], thighF: [300, 18], shinN: [300, 18], shinF: [300, 18], rollN: [300, 18], rollF: [300, 18],
    pigA: [60, 4.4], pigB: [48, 3.4], bow: [110, 6], tab: [110, 7], pennant: [70, 3.6], shieldUp: [120, 12],
  },
  fast: ['x', 'armN', 'elbN', 'lance', 'armF', 'elbF', 'thighN', 'thighF', 'shinN', 'shinF'],
  kick: { tilt: -160, head: -220, pigA: 280, pigB: 300, bow: 260, tab: 180, pennant: 300 },
  turnKick: { pigA: 300, pigB: 340, bow: 220, tab: 160, pennant: 320 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const mo = a.mo ?? {};
    const st = mo.rig;
    const now = a.now;
    const dt = a.dt;
    a.gtU = stepPhase(m, a, 'gt2', 22 * 1.1);
    // What the fight has her doing (world/volcano.js): aiming a charge, charging, the shield up.
    const ease = (key, on, rate) => (mo[key] = (mo[key] ?? 0) + ((on ? 1 : 0) - (mo[key] ?? 0)) * Math.min(1, dt * rate));
    const aimW = ease('gtAimW', Boolean(m.aim), 9);
    const chargeW = ease('gtChargeW', Boolean(m.charging), 14);
    const shieldW = ease('gtShieldW', (m.shieldUntil ?? 0) > now && !m.charging, 7);
    a.gtShield = shieldW;
    a.gtAim = aimW;
    a.gtCharge = chargeW;
    // Frosting Rain on its own clock: up, then the sweep down.
    const act = (at, wind, dur) => (at != null && now >= at - wind && now < at + dur ? { antic: now < at ? smooth(1 - (at - now) / wind) : 0, strike: now >= at ? (now - at < 0.07 ? smooth((now - at) / 0.07) : 1 - smooth(clamp((now - at - 0.25) / (dur - 0.25), 0, 1))) : 0 } : null);
    const rainA = act(m.rainAt, 0.7, 1);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    let kind = 'thrust';
    let ph = a.ph;
    if (!active && rainA) {
      kind = 'rain';
      ph = { ...a.ph, ...rainA, since: -1 };
    }
    a.gtKind = kind;
    a.gtPh = ph;
    const still = 1 - (a.walkW ?? 0);
    // Her idle, a 10 s act: at attention, bouncing on her toes; a twirl of the lance; a proud salute.
    const lu = fr(t / 10) * 10;
    const bob = Math.abs(Math.sin(t * 2.4));
    // (The twirl stops the moment she does anything else.)
    const busy = active || rainA || m.aim || m.charging || shieldW > 0.05 || (a.walkW ?? 0) > 0.05;
    const twirl = !busy && lu >= 3 && lu < 5 ? smooth(clamp((lu - 3.1) / 1.1, 0, 1)) : 0;
    const salute = hold(lu, 6.6, 7, 8.2, 8.6);
    a.gtAct = { salute: salute * still, twirl: twirl > 0 && twirl < 1 ? still : 0 };
    const armI = 56 - salute * 50 - Math.sin(twirl * Math.PI) * 20;
    const elbI = -50 - salute * 30;
    const idle = {
      x: 0, lift: bob * 1 + salute * 1, tilt: 1 + bob * 1 - salute * 4, head: -bob * 1.6 - salute * 12,
      armN: armI, elbN: elbI, lance: aim(12 - salute * 6, armI, elbI) + twirl * 360, armF: 110 - salute * 20, elbF: -30,
      ...legs(ST + bob * 3, SS - bob * 6, ST + bob * 3, SS - bob * 6), rollN: -bob * 8, rollF: -bob * 8,
      pigA: 20 + Math.sin(t * 1.4) * 4 + salute * 6, pigB: 6 + Math.sin(t * 1.4 - 0.8) * 4, bow: Math.sin(t * 2.4) * 3, tab: 0, pennant: 10 + Math.sin(t * 3.1) * 14, shieldUp: 0,
    };
    // A brisk little march on planted feet.
    const u = a.gtU;
    const lead = ((st?.gt2V ?? 0) / (22 * 1.1)) * 0.05;
    const [dxN, upN] = pawStep(u + lead, 0, 22, 0.56, 4.6);
    const [dxF, upF] = pawStep(u + lead, 0.5, 22, 0.56, 4.6);
    const w2 = u * TAU * 2;
    const land = (1 + Math.cos(w2)) / 2;
    const sw = Math.sin(u * TAU);
    const wLift = 0.7 - land * 2.4;
    const wTilt = 5 + land * 2.4;
    const [thN, shN] = legIK(dxN, LEG_DY + wLift - upN, wTilt * 0.3);
    const [thF, shF] = legIK(dxF, LEG_DY + wLift - upF, wTilt * 0.3);
    const walk = {
      x: 0, lift: wLift, tilt: wTilt, head: -wTilt * 0.4 + land * 2, armN: 56 - land * 4, elbN: -50, lance: aim(12 + land * 3, 56 - land * 4, -50, wTilt), armF: 100 + sw * 36, elbF: -30 - Math.max(0, -sw) * 24,
      thighN: thN, shinN: shN, thighF: thF, shinF: shF, rollN: upN * 4, rollF: upF * 4,
      pigA: 30 + Math.sin(w2 - 1.2) * 10, pigB: 10 + Math.sin(w2 - 2) * 10, bow: Math.sin(w2 - 1) * 8, tab: -sw * 3, pennant: 24 + Math.sin(w2 * 1.5) * 16, shieldUp: 0,
    };
    const [antic, strike] = gtMove(kind);
    let S = stateBlend({ ...a, ph }, idle, walk, antic, strike);
    // Aiming her charge: the lance couched level under her arm, a low crouch, the far foot scraping.
    if (aimW > 0.01) {
      const scrape = Math.sin(now * 12);
      const aimP = { ...S, x: -2, lift: -3, tilt: 14, head: 4, armN: 40, elbN: -40, lance: aim(90, 40, -40, 14), armF: 130, elbF: -10, ...legs(ST - 20, SS + 30, ST + 10 + scrape * 10, SS + 20), pigA: 34, bow: 6, pennant: 30 + scrape * 10 };
      S = blend([[S, 1 - aimW], [aimP, aimW]]);
    }
    // The charge: leaning right in, lance level, legs running (her walk cycle at full tilt), pigtail
    // and pennant streaming.
    if (chargeW > 0.01) {
      const chP = { ...S, x: 4, lift: S.lift - 1, tilt: 22, head: 10, armN: 30, elbN: -30, lance: aim(92, 30, -30, 22), armF: 150, elbF: 0, pigA: 70, pigB: 30, bow: 20, tab: -10, pennant: -40 };
      S = blend([[S, 1 - chargeW], [chP, chargeW]]);
    }
    // The Icing Shield: the far arm brings the shield round in front of her, a slight crouch.
    if (shieldW > 0.01) {
      const shP = { ...S, armF: 62, elbF: -62, lift: S.lift - 1.4 * shieldW, tilt: S.tilt + 4 };
      S = blend([[S, 1 - shieldW], [shP, shieldW]]);
    }
    a.gtMood = gtMood(a, m);
    unwind(st, 'lance', S.lance);
    return S;
  },
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -HIP - S.lift], rot: (S) => S.tilt * 0.3 * D2R },
    { name: 'chest', parent: 'hip', at: () => [0, -2], rot: (S) => S.tilt * 0.7 * D2R },
    { name: 'nk', parent: 'chest', at: () => [0, -25], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'elbowN', parent: 'upN', at: () => [UA, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [UA, 0] },
    { name: 'gripN', parent: 'foreN', at: () => [FA, 0] },
    { name: 'gripF', parent: 'foreF', at: () => [FA, 0] },
    { name: 'kneeN', parent: 'thighN', at: () => [0, L1] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, L1] },
    { name: 'ankleN', parent: 'shinN', at: () => [0, L2] },
    { name: 'ankleF', parent: 'shinF', at: () => [0, L2] },
    ...gtPass(false),
    ...gtPass(true),
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const ph = a.gtPh ?? a.ph;
    const [tx, ty] = at2(mat('lance'), 0, -62);
    // A thrust: a flash at the point.
    if (a.gtKind === 'thrust' && ph.strike > 0.3) sparkle(ctx, a, tx, ty, 6 * ph.strike, a.alpha * ph.strike, '#ffffff');
    // Frosting Rain: pink frosting puffing up off the point as she raises it.
    if (a.gtKind === 'rain' && (ph.antic > 0.3 || ph.strike > 0.2)) {
      const on = Math.max(ph.antic, ph.strike);
      for (let k = 0; k < 4; k++) {
        const u = fr(a.now * 1.6 + k / 4);
        puff(ctx, a, tx + Math.sin(k * 2 + u * 4) * 6, ty - u * 18, 2 + u * 3, a.alpha * on * (1 - u), '255,170,200');
      }
    }
    // The charge: speed lines behind her, a puff of dust off her heels.
    if ((a.gtCharge ?? 0) > 0.3) {
      const [cx, cy] = at2(mat('chest'), 0, -10);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 3; k++) {
        ctx.globalAlpha = a.alpha * a.gtCharge * 0.6;
        ctx.beginPath();
        ctx.moveTo(cx - 18 - k * 4, cy - 6 + k * 8);
        ctx.lineTo(cx - 40 - k * 6, cy - 6 + k * 8);
        ctx.stroke();
      }
      const [fx2, fy2] = at2(mat('hip'), -6, 22);
      puff(ctx, a, fx2, fy2, 3 + fr(a.now * 6) * 3, a.alpha * a.gtCharge * 0.5);
      ctx.globalAlpha = a.alpha;
    }
    // Aiming: a little scrape of dust under her far boot.
    if ((a.gtAim ?? 0) > 0.5 && Math.sin(a.now * 12) > 0.6) {
      const [fx2, fy2] = at2(mat('ankleF'), 0, 6);
      puff(ctx, a, fx2 - 4, fy2, 2.6, a.alpha * 0.4);
    }
    // The Icing Shield: a soft pink shine on the shield.
    if ((a.gtShield ?? 0) > 0.5) {
      const [sx, sy] = at2(mat('shield'), 8.4, 0);
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 16);
      g.addColorStop(0, `rgba(255,190,220,${0.4 * a.alpha})`);
      g.addColorStop(1, 'rgba(255,190,220,0)');
      ctx.fillStyle = g;
      ctx.fillRect(sx - 16, sy - 16, 32, 32);
      sparkle(ctx, a, sx + Math.sin(a.now * 3) * 6, sy - 6, 2, a.alpha, '#ffffff');
    }
  },
}), 1.1);
function gtMood(a, m) {
  if (m.hp <= 0) return 'dead';
  const ph = a.gtPh ?? a.ph;
  if ((a.gtCharge ?? 0) > 0.5) return 'shout';
  if ((a.gtAim ?? 0) > 0.5) return 'focus';
  if (ph.strike > 0.25) return 'shout';
  if (a.ph.atk || ph.antic > 0.3) return 'angry';
  if ((a.gtShield ?? 0) > 0.5) return 'angry';
  if (a.mood === 'hurt' || a.face === 'hurt') return 'hurt';
  const act = a.gtAct ?? {};
  if (act.salute > 0.4) return 'proud';
  if (act.twirl > 0.5) return 'happy';
  const t = a.t + (a.uidOff ?? 0);
  if (t % 3.9 < 0.13) return 'blink';
  return 'idle';
}

// ---------- The still (portraits) ----------
export function gretelStill(pose, f, mood) {
  const fm = GT_FACES[mood] ? mood : MOODS.has(mood) ? mood : 'idle';
  const hip = [0, -HIP];
  const ch = [0, -HIP - 2];
  const nk = [0, ch[1] - 25];
  const legAt = (far) => {
    const x = far ? -4 : 5;
    const tr = ST * D2R;
    const kx = x - Math.sin(tr) * L1;
    const ky = hip[1] + Math.cos(tr) * L1;
    const sr = (ST + SS) * D2R;
    return [...put(gtBoot(far)(), [4.6, 2], kx - Math.sin(sr) * L2, ky + Math.cos(sr) * L2, 0), ...put(gtShin(far)(), [4, 1], kx, ky, ST + SS), ...put(gtThigh(far)(), [4, 1.5], x, hip[1], ST)];
  };
  const arm = (far, armA, elbA) => {
    const [sx, sy] = far ? [-8, ch[1] - 22] : [6, ch[1] - 22];
    const ex = sx + Math.cos(armA * D2R) * UA;
    const ey = sy + Math.sin(armA * D2R) * UA;
    const fa = armA + elbA;
    const gx = ex + Math.cos(fa * D2R) * FA;
    const gy = ey + Math.sin(fa * D2R) * FA;
    return { up: put(gtUpper(far)(), [2, 4], sx, sy, armA), fore: put(gtFore(far)(), [2, 4], ex, ey, fa), mitt: put(gtMitt(far)(), [4, 4], gx, gy, 0), grip: [gx, gy] };
  };
  const an = arm(false, 56, -50);
  const af = arm(true, 110, -30);
  const lr = 12 * D2R;
  const pen = [an.grip[0] + Math.sin(lr) * 46 + Math.cos(lr) * 1, an.grip[1] - Math.cos(lr) * 46 + Math.sin(lr) * 1];
  return { w: 64, h: 100, res: 2, shapes: shift([
    ...put(gtShield(), [10, 10], -14, ch[1] - 12, 0),
    ...put(gtPig(0)(), [5, 1], nk[0] - 12, nk[1] - 16, 20), ...put(gtPig(1)(), [5, 1], nk[0] - 12 - Math.sin(20 * D2R) * 11, nk[1] - 16 + Math.cos(20 * D2R) * 11, 26),
    ...af.up, ...af.fore, ...af.mitt,
    ...legAt(true), ...put(gtBody(), [16, 27], ch[0], ch[1]), ...legAt(false), ...put(gtTabard(), [13, 1], 0, ch[1] - 22),
    ...an.up,
    ...put(gtHead(), [18, 31], nk[0], nk[1]), ...put((GT_FACES[fm] ?? GT_FACES.idle)(), [18, 31], nk[0], nk[1]), ...put(gtBow(), [11, 7], nk[0] - 2, nk[1] - 30, 0),
    ...an.fore, ...put(gtLance(), [8, 64], an.grip[0], an.grip[1], 12), ...put(gtPennant(), [1, 2], pen[0], pen[1], 22), ...an.mitt,
  ], 32, 99) };
}
