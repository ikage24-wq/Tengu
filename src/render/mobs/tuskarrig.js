// Tuskar the Behemoth (redrawn 2026-11-19, the player's pick "B, the Sumo Champ"): Rootwood Hollow's
// gate guard, a great round upright boar wrestler. Brown bristly fur, a pale belly, pointed ears with
// pink insides, a pink snout under and between his beady eyes, little ivory tusks curling up from
// his lower lip, his bristles tied up in a topknot with a gold cord, a green moss belt with a fringe
// of leaves, short stout legs on dark hooves.
//
// How he moves:
//   idle    a 10 s act: a handful of salt tossed up (it sparkles); a shiko stomp, one leg raised
//           high and stamped down; slapping his belly, proud.
//   walk    a heavy sliding sumo shuffle, low and wide, rocking side to side.
//   fight   (world/dungeon.js, world/hollow.js) a plain swing is a palm slap; the Gore (m.big) a
//           two-handed thrust from a deep crouch; lowering his tusks (m.aim) he squats fists-down
//           at the line, pawing the floor; the Charge (m.charging) a head-down rush, palms pumping;
//           crashed (m.hold 'stun') he sits down hard, dizzy, his topknot askew; the Belly Flop
//           (m.move 'flop') a leg raised, a jump, and down on his belly; his Wargs (m.callAt) a clap
//           and a roar.

import { E, T, F, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
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
const blob = (pts, c, n = 3) => T(smoothPts(pts, n), c);
const INK = '#2e1c26';
const line = (pts, w, c = INK) => stroke(pts, w, c).map(F);

const FUR = ramp('#9a6240', { step: 9, turn: 10 });
const ARM = '#865236';
const ARM_RIM = '#5e3622';
const LIGHT = '#d8a882';
const SNOUT = ramp('#f4a8a0', { step: 8, turn: 8 });
const IVORY = '#fff6e4';
const GREEN = ramp('#6aa858', { step: 9, turn: 10 });
const HOOF = '#4a3428';
const tk = pairOf('tk2');

// ---------- Parts ----------
// (Rig space: the floor at y 0, facing right. His body's middle 38 above the floor.)
// His body: round, a pale belly, the moss belt round his middle (box 52 x 44 about (26, 22)).
const bodyP = () => [
  E(26, 22, 24, 20, FUR.base), crescent(26, 22, 24, 20, FUR.sh, { k: 0.14, a0: 110, a1: 210 }), F(E(29, 26, 16, 13, LIGHT)), F(E(32, 8, 7, 2.4, '#b8805a')), F(E(30, 31, 2, 1.4, '#c08a64')),
  blob([[3.6, 28], [26, 31.4], [48.6, 28], [43.8, 35], [26, 38.6], [8.2, 35]], GREEN.base, 2), F(taper([[6, 29.6], [26, 32.6], [46, 29.6]], 1.2, 1.2, GREEN.hi)), F(taper([[10, 35.4], [26, 37.4], [42, 35.4]], 0.9, 0.9, GREEN.sh)),
];
// The fringe of leaves off the belt's front (box 30 x 12 hanging from its top middle (15, 1)).
const fringeP = () => [-12, -6, 0, 6, 12].flatMap((dx, k) => [blob([[15 + dx - 2.4, 1], [15 + dx + 2.4, 1], [15 + dx + 1.6, 7.4], [15 + dx, 10.4], [15 + dx - 1.6, 7.4]], k % 2 ? GREEN.sh : GREEN.hi, 1)]);
// His head (box 44 x 40; the neck (22, 34)): round brown fur, pointed ears with pink insides, the
// pale muzzle, the pink snout under and between his eyes, his tusks (eyes, brows and mouth are
// his face's).
const HX = 22;
const HY = 20;
const headP = () => [
  T([[HX - 13, HY - 6], [HX - 14, HY - 19], [HX - 4, HY - 12]], FUR.sh), F(T([[HX - 12, HY - 8], [HX - 12.6, HY - 16], [HX - 6.4, HY - 12]], '#e8a0a0')),
  T([[HX + 3, HY - 12], [HX + 12, HY - 20], [HX + 14, HY - 6]], FUR.base), F(T([[HX + 5, HY - 11.6], [HX + 11, HY - 17], [HX + 12.4, HY - 8]], '#f0b0b0')),
  E(HX, HY, 16, 14.4, FUR.base), crescent(HX, HY, 16, 14.4, FUR.sh, { k: 0.14, a0: 110, a1: 220 }), F(E(HX + 4, HY - 9, 5, 1.8, '#b8805a')),
  F(E(HX + 4, HY + 6, 9, 6.4, LIGHT)),
  E(HX + 4, HY + 5, 5.4, 4, SNOUT.base), F(E(HX + 3.6, HY + 4, 3.6, 2, SNOUT.hi)), F(E(HX + 2.4, HY + 5.6, 0.9, 1.3, '#a05a5a')), F(E(HX + 5.8, HY + 5.6, 1, 1.4, '#a05a5a')),
  taper([[HX + 8.6, HY + 10.4], [HX + 10.4, HY + 7], [HX + 10, HY + 3.6]], 2.2, 1.2, IVORY), taper([[HX - 0.6, HY + 10.4], [HX - 1.6, HY + 7.4], [HX - 1.2, HY + 4.6]], 2, 1.1, IVORY),
];
// The topknot (box 18 x 16; it sits on its base (8, 13), inside his head's crown).
const mageP = () => [blob([[1, 13], [8, 9.4], [15, 12], [13, 15], [3, 15]], '#5a3420', 2), blob([[6, 11], [9, 4], [16, 1.6], [14, 8]], '#5a3420', 2), F(E(8.6, 10, 2.4, 1.3, '#e8b040')), F(taper([[9, 6], [14, 3]], 0.8, 0.6, '#7a4a30'))];
// An arm (darker than his body, a rim along its underside, so it shows against him): upper (box 13
// x 9 from (2, 4.5); the elbow 9 on), forearm (box 12 x 8 from (2, 4); the wrist 8 on), a big round
// palm (box 11 x 11 about (5.5, 5.5)).
const upperP = (far) => () => [taper([[2, 4.5], [11, 4.5]], 7.4, 6.8, far ? '#74462e' : ARM), E(11, 4.5, 3.4, 3.4, far ? '#74462e' : ARM), F(taper([[2.6, 7.4], [11, 7.2]], 1, 0.9, ARM_RIM)), F(taper([[3, 2], [9, 2]], 0.8, 0.6, '#a87050'))];
const foreP = (far) => () => [E(2, 4, 3.3, 3.3, far ? '#74462e' : ARM), taper([[2, 4], [10, 4]], 6.6, 6, far ? '#74462e' : ARM), F(taper([[2.6, 6.6], [10, 6.4]], 1, 0.9, ARM_RIM))];
const palmP = (far) => () => [E(5.5, 5.5, 4.6, 4.4, far ? '#74462e' : ARM), crescent(5.5, 5.5, 4.6, 4.4, ARM_RIM, { k: 0.26, a0: 20, a1: 160 }), F(E(7.6, 3.6, 1.4, 1, HOOF)), F(E(8.4, 6.4, 1.4, 1, HOOF)), F(E(4.4, 4, 1.4, 0.9, '#a87050'))];
// A leg, short and stout: thigh (box 11 x 13 from (5.5, 2); the knee 9 down), shin (box 11 x 13 from
// (5.5, 2); the ankle 9 down), round at the knee on both; a hoof (box 12 x 7 from the ankle (6, 1)).
const thighP = (far) => () => [taper([[5.5, 2], [5.5, 11]], 9, 8.4, far ? FUR.sh : FUR.base), E(5.5, 11, 4.2, 4.2, far ? FUR.sh : FUR.base)];
const shinP = (far) => () => [E(5.5, 2, 4.2, 4.2, far ? FUR.sh : FUR.base), taper([[5.5, 2], [5.5, 10.4]], 8.4, 7.4, far ? FUR.sh : FUR.base)];
const hoofP = (far) => () => [blob([[1.4, 0.6], [10.6, 0.6], [11.4, 6.4], [0.6, 6.4]], far ? '#3a2820' : HOOF, 1), F(taper([[7, 1.6], [7, 6]], 0.8, 0.8, '#2a1c14')), F(E(4, 2.4, 1.6, 0.8, '#6a5040'))];
const TK = {
  BODY: tk('body', 52, 44, bodyP, 2), FRINGE: tk('fringe', 30, 12, fringeP, 2), HEAD: tk('head', 44, 40, headP, 2), MAGE: tk('mage', 18, 16, mageP, 2),
  UP: [false, true].map((f) => tk(`up${f ? 1 : 0}`, 13, 9, upperP(f), 2)), FORE: [false, true].map((f) => tk(`fore${f ? 1 : 0}`, 12, 8, foreP(f), 2)), PALM: [false, true].map((f) => tk(`palm${f ? 1 : 0}`, 11, 11, palmP(f), 2)),
  THIGH: [false, true].map((f) => tk(`thigh${f ? 1 : 0}`, 11, 15, thighP(f), 2)), SHIN: [false, true].map((f) => tk(`shin${f ? 1 : 0}`, 11, 14, shinP(f), 2)), HOOF: [false, true].map((f) => tk(`hoof${f ? 1 : 0}`, 12, 7, hoofP(f), 2)),
};

// ---------- Faces (on his head; box 34 x 28 about (17, 14), his head's middle) ----------
const EN = [24, 11, 2.4];
const EF = [14, 11.4, 2];
const MX = 21;
const MY = 24.4;
const LIP = '#5a2020';
const BROW = '#5a3420';
const brows = (k = 0, v = 0) => [...line([[EN[0] - 3, EN[1] - 4 + k + v], [EN[0] + 3, EN[1] - 5 + k - v]], 1.4, BROW), ...line([[EF[0] - 3, EF[1] - 4.4 + k - v * 0.6], [EF[0] + 2.4, EF[1] - 4 + k + v]], 1.2, BROW)];
const beady = ([x, y, r], { look = 0 } = {}) => [F(E(x + look, y, r, r * 1.08, INK)), F(E(x - r * 0.35 + look, y - r * 0.4, r * 0.38, r * 0.38, '#ffffff'))];
const shut = ([x, y, r], up = false) => line(arcP(x, y + 0.6, r * 1.1, r * 0.7, up ? 200 : 20, up ? 340 : 160, 7), 0.8);
const swirl = ([x, y, r]) => line(Array.from({ length: 14 }, (_, i) => [x + Math.cos(i * 0.9) * (0.2 + i * r * 0.09), y + Math.sin(i * 0.9) * (0.2 + i * r * 0.09)]), 0.6);
const blush = (k = 1) => [F(E(EN[0] + 1, EN[1] + 4.2, 2 * k, 1 * k, '#ff9a9a')), F(E(EF[0] - 1.4, EF[1] + 4.2, 1.6 * k, 0.9 * k, '#ff9a9a'))];
const grin = () => line(arcP(MX, MY, 3.2, 1.4, 20, 160, 7), 0.8, LIP);
const roar = (k = 1) => [F(E(MX, MY + 1, 2.8 * k, 2.4 * k, LIP)), F(E(MX, MY + 2.2 * k, 1.6 * k, 0.8 * k, '#ff9ab0'))];
const TK_FACES = {
  // Determined: beady eyes, bushy brows, a confident grin.
  idle: () => [...beady(EN), ...beady(EF), ...brows(0, 0.6), ...grin(), ...blush()],
  blink: () => [...shut(EN), ...shut(EF), ...brows(0, 0.6), ...grin(), ...blush()],
  // Proud (patting his belly): eyes shut, chin up, a wide grin.
  proud: () => [...shut(EN, true), ...shut(EF, true), ...brows(-1, -0.6), ...line(arcP(MX, MY - 0.4, 3.6, 2, 20, 160, 8), 0.9, LIP), ...blush(1.2)],
  // Focused (the crouch, the salt): brows low, eyes narrowed.
  focus: () => [...beady(EN), ...beady(EF), ...line([[EN[0] - 2.6, EN[1] - 1.4], [EN[0] + 2.6, EN[1] - 2.4]], 1, FUR.base), ...line([[EF[0] - 2, EF[1] - 2.2], [EF[0] + 2, EF[1] - 1.2]], 0.9, FUR.base), ...brows(2, 1.8), ...line([[MX - 2.6, MY + 0.4], [MX + 2.6, MY - 0.2]], 0.8, LIP), ...blush(0.9)],
  angry: () => [...beady(EN), ...beady(EF), ...brows(1.8, 2.2), ...line([[MX - 3, MY + 0.6], [MX - 1, MY - 0.4], [MX + 1, MY + 0.6], [MX + 3, MY - 0.4]], 0.8, LIP), ...blush(0.9)],
  shout: () => [...beady(EN), ...beady(EF), ...brows(1.4, 2), ...roar(), ...blush()],
  happy: () => [...shut(EN, true), ...shut(EF, true), ...brows(-1, 0), ...roar(0.8), ...blush(1.2)],
  dizzy: () => [...swirl(EN), ...swirl(EF), ...brows(-1.4, -1), ...line([[MX - 3, MY + 0.6], [MX - 1.4, MY - 0.2], [MX, MY + 0.6], [MX + 1.4, MY - 0.2], [MX + 3, MY + 0.6]], 0.7, LIP), ...blush()],
  hurt: () => [...line([[EN[0] - 2.2, EN[1] - 1.8], [EN[0] + 1.2, EN[1]], [EN[0] - 2.2, EN[1] + 1.8]], 0.8), ...line([[EF[0] + 1.8, EF[1] - 1.6], [EF[0] - 1.2, EF[1]], [EF[0] + 1.8, EF[1] + 1.6]], 0.8), ...brows(-1, -1.4), ...line(arcP(MX, MY + 1.6, 2.4, 1, 200, 340, 6), 0.8, LIP), ...blush()],
  dead: () => [...swirl(EN), ...swirl(EF), ...line(arcP(MX, MY + 1.8, 2.4, 1, 200, 340, 6), 0.8, LIP)],
};
const tkFace = (mood) => faceSprite(`tk2|face|${mood}`, 34, 28, () => ownFace(TK_FACES, mood));

// ---------- Skeleton ----------
const BODY_Y = 38;
const L1 = 9;
const L2 = 9;
const SOLE = 6;
const HIPS = [[11, 16], [-11, 16]];
const FEET = [15, -15];
const UA = 9;
const FA = 8;
const SHN = [17, -9];
const SHF = [-17, -9];
const NECK = [1, -16];
const FRINGE_AT = [3, 15];
function legIK(dx, dy) {
  const d = Math.min(L1 + L2 - 0.05, Math.max(3, Math.hypot(dx, dy)));
  const h = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const k = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return [(-Math.atan2(dx, dy) - h) / D2R, (Math.PI - k) / D2R];
}
// Both legs for a lift and tilt (the hips ride on his body), each foot at [x, up] (rig x).
const legsAt = (lift, tilt, n = [FEET[0], 0], f = [FEET[1], 0]) => {
  const out = {};
  const r = tilt * D2R;
  [['N', HIPS[0], n], ['F', HIPS[1], f]].forEach(([k, [hx, hy], [fx, up]]) => {
    const hipX = hx * Math.cos(r) - hy * Math.sin(r);
    const hipY = -BODY_Y - lift + hx * Math.sin(r) + hy * Math.cos(r);
    const [th, sh] = legIK(fx - hipX, -SOLE - up - hipY);
    out[`thigh${k}`] = th - tilt;
    out[`shin${k}`] = sh;
    out[`roll${k}`] = up * 4;
  });
  return out;
};
const aimed = (want, ...turns) => want - turns.reduce((v, x) => v + x, 0);

const tkPass = (bare) => {
  const i = bare ? 1 : 0;
  const t = bare ? 'b' : '';
  const leg = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `hoof${k}${t}`, parent: `ankle${k}`, s: TK.HOOF[j][i], pivot: [6, 1], rot: (S) => -(S.tilt + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
      { name: `shin${k}${t}`, parent: `knee${k}`, s: TK.SHIN[j][i], pivot: [5.5, 2], rot: (S) => S[`shin${k}`] * D2R },
      { name: `thigh${k}${t}`, parent: 'bodyJ', s: TK.THIGH[j][i], pivot: [5.5, 2], at: () => HIPS[j], rot: (S) => S[`thigh${k}`] * D2R },
    ];
  };
  const arm = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `up${k}${t}`, parent: 'bodyJ', s: TK.UP[j][i], pivot: [2, 4.5], at: () => (far ? SHF : SHN), rot: (S) => S[`arm${k}`] * D2R },
      { name: `fore${k}${t}`, parent: `elbow${k}`, s: TK.FORE[j][i], pivot: [2, 4], rot: (S) => S[`elb${k}`] * D2R },
      { name: `palm${k}${t}`, parent: `wrist${k}`, s: TK.PALM[j][i], pivot: [5.5, 5.5], rot: (S) => S[`palm${k}`] * D2R },
    ];
  };
  return [
    ...arm(true),
    ...leg(true), ...leg(false),
    { name: `body${t}`, parent: 'bodyJ', s: TK.BODY[i], pivot: [26, 22] },
    { name: `fringe${t}`, parent: 'bodyJ', s: TK.FRINGE[i], pivot: [15, 1], at: () => FRINGE_AT, rot: (S) => S.fringe * D2R },
    { name: `mage${t}`, parent: 'headJ', s: TK.MAGE[i], pivot: [8, 13], at: () => [2, -26.4], rot: (S) => S.mage * D2R },
    { name: `head${t}`, parent: 'headJ', s: TK.HEAD[i], pivot: [22, 34] },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => tkFace(a.tkMood ?? 'idle'), pivot: [17, 14], at: () => [0, -14] }] : []),
    ...arm(false),
  ];
};

export const tuskarRig = sized(makeRig({
  w: 76, h: 104, soft: true, stride: 1e9, recover: 0.55,
  springs: {
    x: [220, 16], lift: [220, 16], tilt: [160, 12], head: [140, 10], mage: [80, 5], fringe: [60, 4.4],
    armN: [240, 17], elbN: [240, 17], palmN: [240, 17], armF: [220, 16], elbF: [220, 16], palmF: [220, 16],
    thighN: [340, 20], thighF: [340, 20], shinN: [340, 20], shinF: [340, 20], rollN: [340, 20], rollF: [340, 20],
  },
  fast: ['x', 'lift', 'tilt', 'armN', 'elbN', 'armF', 'elbF', 'thighN', 'thighF', 'shinN', 'shinF'],
  kick: { tilt: -140, head: -160, mage: 240, fringe: 220 },
  turnKick: { mage: 220, fringe: 260, head: 80, tilt: -60 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 1.07;
    const t = a.t + a.uidOff;
    const now = a.now;
    const u = stepPhase(m, a, 'tk2', 16 * 1.15);
    const uc = stepPhase(m, a, 'tk2c', 64);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const big = active && m.big != null && Math.abs(now - m.big) < 1.2;
    const aim = m.aim ? 1 : 0;
    const charging = m.charging ? 1 : 0;
    const stun = m.hold === 'stun' && m.frozenUntil > now ? 1 : 0;
    const flop = m.move?.kind === 'flop' ? now - m.move.at : -1;
    const call = m.callAt != null && now >= m.callAt && now < m.callAt + 1.8 ? now - m.callAt : -1;
    const walkW = a.walkW ?? 0;
    const still = 1 - walkW;
    // His idle, a 10 s act: salt tossed up; a shiko stomp; slapping his belly.
    const lu = fr(t / 10) * 10;
    const busy = active || aim || charging || stun || flop >= 0 || call >= 0 || walkW > 0.05 || m.cine || m.aggroUntil === Infinity;
    const salt = busy ? 0 : hold(lu, 0.4, 0.9, 1.6, 2.4);
    const saltU = clamp((lu - 0.9) / 0.6, 0, 1);
    const shiko = busy ? 0 : hold(lu, 3.6, 4.4, 5.6, 6.4);
    const stomp = shiko * smooth(clamp((lu - 4.4) / 0.6, 0, 1)) * (lu < 5.4 ? 1 : 1 - smooth(clamp((lu - 5.4) / 0.25, 0, 1)));
    const pat = busy ? 0 : hold(lu, 7.2, 7.6, 8.8, 9.2);
    const patK = pat * Math.abs(Math.sin(t * 7));
    a.tkAct = { salt: salt * still, saltU, shiko: shiko * still, stompAt: lu, pat: pat * still };
    const breath = Math.sin(t * 1.3);
    // Shiko: the near leg lifted high and out, weight over the far foot, paws on his knees.
    const liftI = breath * 0.5 - shiko * 2;
    const tiltI = breath * 0.8 - shiko * 9 + pat * -4;
    const legsI = legsAt(liftI, tiltI, [FEET[0] + shiko * stomp * 6, shiko * stomp * 16], [FEET[1] + shiko * 5, 0]);
    const armNI = 70 - salt * (saltU < 1 ? 190 * saltU : 190) - pat * 40 + shiko * 10;
    const elbNI = -10 - pat * 70 - patK * 14 + shiko * 20;
    const idle = {
      x: 0, lift: liftI, tilt: tiltI, head: Math.sin(t * 1.1) * 2 - pat * 8 + salt * -4,
      armN: armNI, elbN: elbNI, palmN: 0, armF: 110 - shiko * 30, elbF: 10 - shiko * 30, palmF: 0,
      mage: Math.sin(t * 1.3 - 0.6) * 4, fringe: Math.sin(t * 1.4) * 4, ...legsI,
    };
    // A heavy sliding shuffle, low and wide.
    const steps = [pawStep(u, 0, 16, 0.66, 2), pawStep(u, 0.5, 16, 0.66, 2)];
    const sw = Math.sin(u * TAU);
    const land = (1 + Math.cos(u * TAU * 2)) / 2;
    const liftW = -1.4 - land * 1.4;
    const tiltW = 3 + sw * 4;
    const walk = {
      ...idle, lift: liftW, tilt: tiltW, head: -2, armN: 50 + sw * 14, elbN: -20, armF: 120 - sw * 14, elbF: -10, mage: -sw * 6, fringe: 8 + sw * 10,
      ...legsAt(liftW, tiltW, [FEET[0] + steps[0][0], steps[0][1]], [FEET[1] + steps[1][0], steps[1][1]]),
    };
    // A palm slap (the Gore: both palms, from a deep crouch).
    const antic = big
      ? { ...idle, x: -4, lift: -5, tilt: -8, head: -6, armN: 150, elbN: -100, armF: 160, elbF: -90, ...legsAt(-5, -8, [FEET[0] + 3, 0], [FEET[1] - 2, 0]) }
      : { ...idle, x: -2, lift: -1, tilt: -6, head: -4, armN: 160, elbN: -110, palmN: 0, armF: 120, elbF: -20, ...legsAt(-1, -6) };
    const strike = big
      ? { ...idle, x: 10, lift: -3, tilt: 16, head: 10, armN: -6, elbN: -4, palmN: -80, armF: 4, elbF: -6, palmF: -80, mage: 20, fringe: 24, ...legsAt(-3, 16, [FEET[0] + 12, 0], [FEET[1] + 2, 0]) }
      : { ...idle, x: 6, lift: -1, tilt: 10, head: 6, armN: -4, elbN: -2, palmN: -80, armF: 130, elbF: -30, mage: 14, fringe: 16, ...legsAt(-1, 10, [FEET[0] + 8, 0], [FEET[1], 0]) };
    const S = stateBlend(a, idle, walk, antic, strike);
    const over = (P, w) => {
      if (w <= 0.001) return;
      for (const k of Object.keys(P)) S[k] += (P[k] - S[k]) * w;
    };
    let kind = active ? (big ? 'big' : 'slap') : null;
    // Lowering his tusks at you: a deep squat at the line, fists down, a foot pawing the floor.
    if (aim) {
      const paw = Math.max(0, Math.sin(now * 9));
      over({ x: -2, lift: -9, tilt: 18, head: -14, armN: 70, elbN: -20, palmN: 0, armF: 76, elbF: -20, palmF: 0, mage: 6, fringe: 10, ...legsAt(-9, 18, [FEET[0] + 4 - paw * 6, paw * 3], [FEET[1] - 4, 0]) }, 1);
      kind = 'aim';
    }
    // The Charge: head down, palms pumping, legs a blur.
    if (charging) {
      const cs = [pawStep(uc, 0, 40, 0.5, 6), pawStep(uc, 0.5, 40, 0.5, 6)];
      const pump = Math.sin(uc * TAU);
      over({ lift: -2 + Math.abs(Math.sin(uc * TAU)) * 2, tilt: 22, head: -10, armN: -10 + pump * 30, elbN: -10, palmN: -70, armF: -10 - pump * 30, elbF: -10, palmF: -70, mage: 30, fringe: 40, ...legsAt(-2, 22, [FEET[0] + 4 + cs[0][0], cs[0][1]], [FEET[1] + 6 + cs[1][0], cs[1][1]]) }, 1);
      kind = 'charge';
    }
    // Crashed: sat down hard, legs out in front, dizzy, his topknot askew.
    if (stun) {
      const wob = Math.sin(now * 4);
      over({ lift: -18, tilt: -8 + wob * 4, head: wob * 8, armN: 40, elbN: 40, palmN: 30, armF: 140, elbF: 30, palmF: 0, mage: 40 + wob * 10, fringe: 30, ...legsAt(-18, -8, [FEET[0] + 16, 3], [FEET[1] + 22, 3]) }, 1);
      kind = 'stun';
    }
    // The Belly Flop: a leg raised (a wiggle), a jump, down on his belly, and up again.
    if (flop >= 0) {
      const warn = m.move.warn ?? 1.4;
      const raise = smooth(clamp(flop / 0.5, 0, 1)) * (flop < warn - 0.5 ? 1 : 0);
      const jump = flop >= warn - 0.5 && flop < warn ? smooth((flop - (warn - 0.5)) / 0.5) : 0;
      const down = flop >= warn ? 1 - smooth(clamp((flop - warn - 0.45) / 0.3, 0, 1)) : 0;
      if (raise > 0) over({ lift: -2, tilt: -10 + Math.sin(now * 14) * 3, armN: 40, elbN: -10, armF: 130, elbF: 10, ...legsAt(-2, -10, [FEET[0] + 8, 16], [FEET[1] + 4, 0]) }, raise);
      if (jump > 0) over({ lift: 18 * Math.sin(jump * Math.PI * 0.6), tilt: 70 * jump, head: -50 * jump, armN: -60, elbN: 0, armF: -40, elbF: 0, ...legsAt(18 * Math.sin(jump * Math.PI * 0.6), 70 * jump, [FEET[0] - 14 * jump, 10], [FEET[1] - 10 * jump, 10]) }, 1);
      if (down > 0) over({ lift: -18, tilt: 84, head: -70, armN: -100, elbN: 0, palmN: 0, armF: -90, elbF: 0, palmF: 0, mage: 40, fringe: 50, thighN: -90, shinN: 10, thighF: -96, shinF: 14, rollN: 0, rollF: 0 }, down);
      kind = 'flop';
    }
    // His Wargs: a clap, then a roar with a paw raised.
    if (call >= 0) {
      const clap = call < 0.6 ? Math.abs(Math.sin(call * Math.PI * 3)) : 0;
      const roar = smooth(clamp((call - 0.6) / 0.3, 0, 1)) * (1 - smooth(clamp((call - 1.4) / 0.4, 0, 1)));
      over({ armN: 20 - clap * 20, elbN: -70, armF: 30 + clap * 10, elbF: -80, tilt: -2, head: -4 }, call < 0.6 ? 1 : 0);
      // (The fist pumped up beside his head, never in front of his face.)
      over({ armN: -60, elbN: -30, palmN: 0, armF: 130, elbF: -20, tilt: -8, head: -14, lift: 2, ...legsAt(2, -8) }, roar);
      if (!kind) kind = 'call';
    }
    a.tkKind = kind;
    a.tkFlop = flop;
    a.tkMood = tkMood(a, m);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => NECK, rot: (S) => (S.head - S.tilt * 0.4) * D2R },
    { name: 'kneeN', parent: 'thighN', at: () => [0, L1] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, L1] },
    { name: 'ankleN', parent: 'shinN', at: () => [0, L2] },
    { name: 'ankleF', parent: 'shinF', at: () => [0, L2] },
    { name: 'elbowN', parent: 'upN', at: () => [UA, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [UA, 0] },
    { name: 'wristN', parent: 'foreN', at: () => [FA, 0] },
    { name: 'wristF', parent: 'foreF', at: () => [FA, 0] },
    ...tkPass(false),
    ...tkPass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.22;
    ctx.fillStyle = '#2a3a2a';
    ctx.beginPath();
    ctx.ellipse(0, -0.6, 28, 4, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const act = a.tkAct ?? {};
    const kind = a.tkKind;
    const DUST = '220,190,150';
    // Salt: a sparkling handful tossed up and forward.
    if (act.salt > 0.3 && act.saltU > 0.2) {
      const [px, py] = at2(mat('palmN'), 0, 0);
      for (let k = 0; k < 6; k++) {
        const q = clamp(act.saltU - k * 0.05, 0, 1);
        sparkle(ctx, a, px + q * (10 + k * 3), py - q * (16 - k) + q * q * 10, 1.4, act.salt * (1 - q * 0.7), '#ffffff');
      }
    }
    // Shiko: dust as the foot comes down.
    if (act.shiko > 0.3 && act.stompAt > 5.3 && act.stompAt < 5.9) {
      const q = (act.stompAt - 5.3) / 0.6;
      for (let k = 0; k < 3; k++) puff(ctx, a, 16 + (k - 1) * 8 + q * (k - 1) * 6, -3 - q * 4, 3 + q * 4, (1 - q) * 0.7, DUST);
    }
    // The slap: a push of air off his palm.
    if ((kind === 'slap' || kind === 'big') && a.ph.strike > 0.2) {
      const [px, py] = at2(mat('palmN'), 4, 0);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        ctx.globalAlpha = a.alpha * a.ph.strike * (0.7 - k * 0.2);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(px + 4 + k * 4 + (1 - a.ph.strike) * 8, py, 5 + k * 3, -1, 1);
        ctx.stroke();
      }
    }
    // The crouch and the charge: dust kicked up behind his feet.
    if (kind === 'aim' || kind === 'charge') {
      for (let k = 0; k < 3; k++) {
        const q = fr(a.now * (kind === 'charge' ? 3 : 1.4) + k / 3);
        puff(ctx, a, -14 - q * (kind === 'charge' ? 40 : 14), -4 - q * 8, 3 + q * 5, (1 - q) * 0.7, DUST);
      }
    }
    // Crashed: stars round his head.
    if (kind === 'stun') {
      const [hx, hy] = at2(mat('headJ'), 0, -30);
      for (let k = 0; k < 3; k++) {
        const ang = a.now * 4 + (k * TAU) / 3;
        sparkle(ctx, a, hx + Math.cos(ang) * 14, hy + Math.sin(ang) * 4, 2.6, 0.7 + 0.3 * Math.sin(ang), '#fff3a0');
      }
    }
    // The Belly Flop: a ring of dust where he lands.
    if (kind === 'flop' && a.tkFlop >= (m.move?.warn ?? 1.4)) {
      const q = clamp((a.tkFlop - (m.move?.warn ?? 1.4)) / 0.7, 0, 1);
      for (let k = 0; k < 8; k++) {
        const sd = k % 2 ? 1 : -1;
        puff(ctx, a, sd * (16 + q * 40 + (k >> 1) * 6), -3 - (k >> 1) * 2, 4 + q * 6, (1 - q) * 0.8, DUST);
      }
    }
    ctx.globalAlpha = a.alpha;
  },
}), 1.15);
function tkMood(a, m) {
  if (m.hp <= 0) return 'dead';
  const kind = a.tkKind;
  if (kind === 'stun') return 'dizzy';
  if (kind === 'charge' || kind === 'call' || kind === 'flop') return 'shout';
  if (kind === 'aim') return 'focus';
  if (a.ph.strike > 0.25) return 'shout';
  if (a.ph.atk || a.ph.antic > 0.3) return 'angry';
  if (a.mood === 'hurt' || a.face === 'hurt') return 'hurt';
  if (m.cine?.mood === 'angry' || m.aggroUntil === Infinity) return 'angry';
  if (m.cine?.mood === 'happy' || a.now - (m.gloatAt ?? -9) < 0.9) return 'happy';
  const act = a.tkAct ?? {};
  if (act.salt > 0.4 || act.shiko > 0.4) return 'focus';
  if (act.pat > 0.4) return 'proud';
  const t = a.t + (a.uidOff ?? 0);
  if (t % 4.2 < 0.13) return 'blink';
  return 'idle';
}

// ---------- The still (portraits) ----------
export function tuskarStill(pose, f, mood) {
  const fm = TK_FACES[mood] ? mood : MOODS.has(mood) ? mood : 'idle';
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
    return [...put(hoofP(far)(), [6, 1], ax, ay, 0), ...put(shinP(far)(), [5.5, 2], kx, ky, th + sh), ...put(thighP(far)(), [5.5, 2], hx, hy, th)];
  };
  const arm = (far, a1, a2) => {
    const [sx, sy] = at(far ? SHF : SHN);
    const ex = sx + Math.cos(a1 * D2R) * UA;
    const ey = sy + Math.sin(a1 * D2R) * UA;
    const wx = ex + Math.cos((a1 + a2) * D2R) * FA;
    const wy = ey + Math.sin((a1 + a2) * D2R) * FA;
    return [...put(upperP(far)(), [2, 4.5], sx, sy, a1), ...put(foreP(far)(), [2, 4], ex, ey, a1 + a2), ...put(palmP(far)(), [5.5, 5.5], wx, wy, 0)];
  };
  const N = at(NECK);
  return { w: 76, h: 104, res: 2, shapes: shift([
    ...arm(true, 110, 10), ...legAt(true), ...legAt(false),
    ...put(bodyP(), [26, 22], ...B), ...put(fringeP(), [15, 1], ...at(FRINGE_AT)),
    ...put(mageP(), [8, 13], N[0] + 2, N[1] - 26.4), ...put(headP(), [22, 34], ...N), ...put((TK_FACES[fm] ?? TK_FACES.idle)(), [17, 14], N[0], N[1] - 14),
    ...arm(false, 70, -10),
  ], 38, 102) };
}
