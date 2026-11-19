// Gnarlroot, the Oldest Tree (redrawn 2026-11-19, the player's pick "C, the Hollow Stump King"):
// the Heart of the Hollow, a wide old stump with a kind, sleepy face under mossy brows. Three young
// leafy sprouts grow from his flat ringed top; a cosy round door sits in his hollow with a warm lit
// window; little glowing mushrooms climb his side; he carries a lantern on his far branch arm; he
// stomps along on two short root legs.
//
// How he moves:
//   idle    a slow 14 s act: dozing off, his head of sprouts nodding; a big yawn, a leaf drifting
//           down; humming, his lantern swinging.
//   walk    a slow heavy stomp on his root legs, rocking side to side, the sprouts swaying after.
//   fight   (world/dungeon.js) he says one word a day, and each word brings a move (m.saying: kind,
//           at, dur): the Root Slam (branches raised high through the word, slammed down as it
//           lands), the Thorns (branches plunged into the floor), the Big Hug (branches spread wide,
//           swept in as the word lands); his mouth works the word as it comes. A plain swing is a
//           bonk of his near branch. At the last (m.swaying) he rocks, holding on.
//   Yomogi  Elder Yomogi sits tangled in two of his roots at his feet until freed (m.yomogiFree).

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, faceShapes, sparkle, puff, dot } from './rigkit.js';
import { drawMochiAnim } from '../mochi-anim.js';
import { rollMochi } from '../../data/mochi-genes.js';
import { YOMOGI } from './gnarlrig.js';

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

const BARK = ramp('#a8785a', { step: 9, turn: 10 });
const LIMB = '#8a5e42';
const LIMB_RIM = '#5e3c28';
const MOSS = ramp('#8cc46e', { step: 9, turn: 10 });
const LEAF = [ramp('#7fc46a', { step: 10, turn: 10 }), ramp('#a2d878', { step: 10, turn: 10 }), ramp('#62a85e', { step: 10, turn: 10 })];
const GLOW = '#7ae8d0';
const sk = pairOf('sk2');

// ---------- Parts ----------
// (Rig space: the floor at y 0, facing right. His trunk stands on its bottom middle, 18 above the floor.)
// His trunk (box 72 x 68; its bottom middle (36, 64)): a wide old stump, bark lines, his flat cut
// top with its rings, the door in his hollow and its window, mushrooms up his side.
const trunkP = () => [
  blob([[6, 64], [4, 36], [8, 10], [14, 2], [58, 2], [64, 10], [68, 36], [66, 64]], BARK.base, 2), crescent(36, 34, 30, 32, BARK.sh, { k: 0.14, a0: 110, a1: 220 }),
  ...[[10, 30, 8, 58], [18, 44, 17, 62], [56, 40, 58, 60], [62, 22, 63, 40]].map(([a, b, c, d]) => line([[a, b], [c, d]], 0.9, BARK.sh)).flat(),
  E(36, 4, 22, 5, '#d8b088'), ...line(arcP(36, 4, 16, 3.4, 0, 360, 16), 0.6, '#b08a64'), ...line(arcP(36, 4, 9, 2, 0, 360, 12), 0.6, '#b08a64'),
  F(blob([[6, 36], [10, 28], [14, 34], [9, 42]], MOSS.base, 2)), F(blob([[50, 62], [58, 56], [64, 62]], MOSS.base, 1)),
  blob([[28, 64], [28, 44], [36, 38], [44, 44], [44, 64]], '#6a4428', 2), F(taper([[29.4, 63], [29.4, 46]], 0.8, 0.8, '#7e5434')), F(E(36, 48, 3, 3, '#ffe9a0')), ...line([[36, 45], [36, 51]], 0.5, '#6a4428'), ...line([[33, 48], [39, 48]], 0.5, '#6a4428'), F(E(41, 56, 0.9, 0.9, '#ffd36b')),
  ...[[60, 40, 4], [63, 30, 3], [59, 50, 3.4]].flatMap(([x, y, r]) => [taper([[x, y], [x + 1, y + r]], 1.4, 1.4, '#f4ecd8'), blob([[x - r, y], [x, y - r * 0.8], [x + r, y], [x, y + 0.6]], GLOW, 1)]),
];
// A sprout from his top (box 24 x 24; its foot (12, 22) sunk in the top): a curving stem, three leaves.
const sproutP = (k) => () => {
  const leaf = (x, y, dir) => {
    const r = dir * D2R;
    const P = (u, v) => [x + u * Math.cos(r) - v * Math.sin(r), y + u * Math.sin(r) + v * Math.cos(r)];
    return [T([P(0, 0), P(3, -2.8), P(8, -2.4), P(11, 0), P(8, 2.4), P(3, 2.8)], LEAF[k].base), ...line([P(1, 0), P(9, 0)], 0.5, LEAF[k].sh)];
  };
  return [taper([[12, 22], [13, 14], [12, 6]], 2.4, 1.8, '#6a9a4a'), ...leaf(12, 6, -150), ...leaf(12, 6, -30), ...leaf(12, 6, -90)];
};
// A branch arm (darker than his trunk, a rim along its underside): the upper branch (box 18 x 10 from
// (2, 5); the elbow 12 on), the lower (box 16 x 9 from (2, 4.5); the wrist 10 on), a twig hand
// (box 16 x 16 about the wrist (3, 8)): three twigs and a leaf.
const upperP = (far) => () => [taper([[2, 5], [14, 5]], 8, 6.8, far ? '#7a5038' : LIMB), E(14, 5, 3.4, 3.4, far ? '#7a5038' : LIMB), F(taper([[3, 8], [14, 7.6]], 1, 0.9, LIMB_RIM)), F(taper([[4, 2.4], [11, 2.4]], 0.7, 0.6, '#b08a64'))];
const lowerP = (far) => () => [E(2, 4.5, 3.4, 3.4, far ? '#7a5038' : LIMB), taper([[2, 4.5], [12, 4.5]], 6.8, 5.4, far ? '#7a5038' : LIMB), F(taper([[3, 7], [12, 6.6]], 0.9, 0.8, LIMB_RIM))];
const handP = (far) => () => {
  const c = far ? '#7a5038' : LIMB;
  return [E(3, 8, 3.2, 3.2, c), ...[[-46, 9], [0, 10], [44, 8.4]].map(([d, l]) => taper([[3, 8], [3 + Math.cos(d * D2R) * l, 8 + Math.sin(d * D2R) * l]], 2.6, 1.4, c)), blob([[12, 3], [15.4, 1], [15, 5], [12.4, 5.6]], LEAF[1].base, 1)];
};
// A root leg, short and thick: upper (box 15 x 17 from (7.5, 2); the knee 9.6 down), lower (box 15 x
// 15 from (7.5, 2); the ankle 9.6 down), round at the knee on both; a root foot (box 24 x 8 from the
// ankle (12, 1.4)): three root toes spreading on the floor.
const thighP = (far) => () => [taper([[7.5, 2], [7.5, 11.6]], 13.4, 12.6, far ? BARK.sh : BARK.base), E(7.5, 11.6, 6.3, 6.3, far ? BARK.sh : BARK.base), F(taper([[3.4, 4], [3.4, 10]], 0.8, 0.6, far ? BARK.base : '#c0906c'))];
const shinP = (far) => () => [E(7.5, 2, 6.3, 6.3, far ? BARK.sh : BARK.base), taper([[7.5, 2], [7.5, 11.4]], 12.6, 11.4, far ? BARK.sh : BARK.base)];
const footP = (far) => () => {
  const c = far ? BARK.sh : BARK.base;
  return [E(12, 2.6, 5.2, 3, c), taper([[12, 3], [2, 6.4]], 5, 2.6, c), taper([[12, 3], [12.6, 7]], 5, 2.8, c), taper([[12, 3], [23, 6.4]], 5, 2.6, c)];
};
// The lantern on his far hand (box 12 x 20; hung from its cord's top (6, 1)).
const lanternP = () => [taper([[6, 1], [6, 6]], 0.8, 0.8, INK), R(2, 5.4, 8, 1.8, '#5a3a2a'), blob([[2, 7], [10, 7], [9.4, 17], [2.6, 17]], '#ffd36b', 1), F(E(6, 12, 2.4, 3.4, '#fff3c4')), R(2.4, 16.6, 7.2, 1.6, '#5a3a2a')];
const SK = {
  TRUNK: sk('trunk', 72, 68, trunkP, 6), SPROUT: [0, 1, 2].map((k) => sk(`sprout${k}`, 24, 24, sproutP(k), 6)),
  UP: [false, true].map((f) => sk(`up${f ? 1 : 0}`, 18, 10, upperP(f), 2)), LOW: [false, true].map((f) => sk(`low${f ? 1 : 0}`, 16, 9, lowerP(f), 2)), HAND: [false, true].map((f) => sk(`hand${f ? 1 : 0}`, 18, 16, handP(f), 2)),
  THIGH: [false, true].map((f) => sk(`thigh${f ? 1 : 0}`, 15, 17, thighP(f), 2)), SHIN: [false, true].map((f) => sk(`shin${f ? 1 : 0}`, 15, 15, shinP(f), 2)), FOOT: [false, true].map((f) => sk(`foot${f ? 1 : 0}`, 25, 9, footP(f), 2)),
  LANTERN: sk('lantern', 12, 20, lanternP, 2),
};

// ---------- Faces (on his trunk; box 34 x 28 about (17, 14)) ----------
const EN = [23.6, 14, 3.4];
const EF = [12.6, 14.2, 2.8];
const MX = 18.6;
const MY = 22;
const LIP = '#5a2a2a';
const brows = (lift = 0, knit = 0) => [
  blob([[EN[0] - 5.6, EN[1] - 8 - lift + knit], [EN[0] - 0.6, EN[1] - 10 - lift], [EN[0] + 5.4, EN[1] - 8 - lift], [EN[0] + 3.4, EN[1] - 6 - lift], [EN[0] - 3.6, EN[1] - 6.4 - lift + knit]], MOSS.base, 1),
  blob([[EF[0] - 4.6, EF[1] - 7.8 - lift], [EF[0] + 0.4, EF[1] - 9.6 - lift], [EF[0] + 4.8, EF[1] - 7.6 - lift + knit], [EF[0] + 3.4, EF[1] - 5.8 - lift + knit], [EF[0] - 3.2, EF[1] - 6.2 - lift]], MOSS.base, 1),
];
const closed = ([x, y, r], side) => [...line(arcP(x, y, r, r * 0.6, 20, 160, 7), 0.9), ...line([[x + side * r * 0.9, y + 0.6], [x + side * r * 1.4, y + 1.6]], 0.7)];
const happyShut = ([x, y, r]) => line(arcP(x, y + 1.4, r, r * 0.7, 200, 340, 7), 0.9);
const lidded = ([x, y, r], side, lid = 0.4) => {
  const top = y - r * 1.1 * (1 - lid * 2);
  return [F(E(x, y, r, r * 1.1, INK)), F(E(x, y + r * 0.3, r * 0.75, r * 0.65, '#5a8a3a')), F(E(x - r * 0.3, y - r * 0.1, r * 0.34, r * 0.34, '#ffffff')), F(T([...arcP(x, y, r * 1.14, r * 1.24, 180, 360, 8), ...arcP(x, top, r * 1.14, r * 0.35, 0, 180, 8)], BARK.base)), ...line(arcP(x, top, r * 1.06, r * 0.33, 15, 165, 7), 0.7), ...line([[x + side * r * 0.9, y - r * 0.2], [x + side * r * 1.5, y - r * 0.6]], 0.6)];
};
const blush = (k = 1) => [F(E(EN[0] + 0.8, EN[1] + 5, 2.4 * k, 1.2 * k, '#ff9ab0')), F(E(EF[0] - 1, EF[1] + 5, 2 * k, 1 * k, '#ff9ab0'))];
const smile = () => line(arcP(MX, MY, 2.6, 1.4, 20, 160, 7), 0.8, LIP);
const SK_FACES = {
  // Asleep, mostly: eyes shut, a gentle smile.
  sleep: () => [...brows(), ...closed(EN, 1), ...closed(EF, -1), ...smile(), ...blush()],
  // Awake (barely): eyes half open.
  idle: () => [...brows(), ...lidded(EN, 1), ...lidded(EF, -1), ...smile(), ...blush()],
  // Saying his word: half-awake, his mouth round on it.
  talk: () => [...brows(0.6), ...lidded(EN, 1, 0.3), ...lidded(EF, -1, 0.3), F(E(MX, MY + 0.4, 2, 2.6, LIP)), F(E(MX, MY + 1.6, 1.2, 0.7, '#ff9ab0')), ...blush()],
  yawn: () => [...brows(1), ...closed(EN, 1), ...closed(EF, -1), F(E(MX, MY + 0.8, 2.6, 3.4, LIP)), F(E(MX, MY + 2.4, 1.4, 0.8, '#ff9ab0')), ...blush()],
  hum: () => [...brows(), ...closed(EN, 1), ...closed(EF, -1), F(E(MX, MY + 0.4, 1, 1.2, LIP)), ...blush(1.1)],
  // Cross: brows knit, eyes open a crack, a frown.
  angry: () => [...brows(-0.6, 2), ...lidded(EN, 1, 0.42), ...lidded(EF, -1, 0.42), ...line(arcP(MX, MY + 1.6, 2.2, 1, 200, 340, 6), 0.8, LIP), ...blush(0.9)],
  happy: () => [...brows(1), ...happyShut(EN), ...happyShut(EF), F(T(arcP(MX, MY - 0.4, 2.8, 2.6, 0, 180, 9), LIP)), ...blush(1.2)],
  hurt: () => [...brows(0.6, -1), ...line([[EN[0] - 2.6, EN[1] - 2], [EN[0] + 1.6, EN[1]], [EN[0] - 2.6, EN[1] + 2]], 0.9), ...line([[EF[0] + 2.2, EF[1] - 1.8], [EF[0] - 1.4, EF[1]], [EF[0] + 2.2, EF[1] + 1.8]], 0.9), ...line(arcP(MX, MY + 1.8, 2.2, 1, 200, 340, 6), 0.8, LIP), ...blush()],
};
SK_FACES.blink = SK_FACES.sleep;
SK_FACES.dead = SK_FACES.sleep;
const FACE_FB = { eyes: [[EN[0], EN[1], 3, 3.2, 1], [EF[0], EF[1], 2.4, 2.6, -1]], mouth: [MX, MY, 1], blush: [[EN[0] + 0.8, EN[1] + 5, 1.4], [EF[0] - 1, EF[1] + 5, 1.2]], iris: '#5a8a3a', lid: 0.3, lashes: 1 };
const skFace = (mood) => faceSprite(`sk2|face|${mood}`, 34, 28, () => (SK_FACES[mood] ?? (() => faceShapes(mood, FACE_FB)))());

// ---------- Elder Yomogi, kept in his roots ----------
const yomogiOf = (a) => {
  const st = a.mo;
  if (!st.yomo) {
    const genes = rollMochi(YOMOGI.seed, { ...YOMOGI.force });
    genes.wear = { ...YOMOGI.wear };
    st.yomo = { genes, dir: 1, speed: 0, dist: 0, size: 'grown', runPoints: 300, easy: true, noIdle: true };
  }
  return st.yomo;
};
// What his sentence's current word is bringing (world/dungeon.js `m.saying`: kind, at, dur).
const sayingOf = (m, now) => {
  const s = m.saying;
  if (!s || now < s.at || now > s.at + s.dur + 0.6) return null;
  return { kind: s.kind, u: clamp((now - s.at) / s.dur, 0, 1), after: Math.max(0, now - s.at - s.dur) };
};

// ---------- Skeleton ----------
const BASE_Y = 18;
const L1 = 9.6;
const L2 = 9.6;
const SOLE = 4;
const HIPS = [[14, -4], [-16, -4]];
const FEET = [16, -16];
const UA = 12;
const LA = 10;
const SHN = [26, -40];
const SHF = [-26, -32];
const FACE_AT = [4, -42];
const SPROUTS = [[-12, -60, 0, -14], [0, -60, 1, 0], [12, -60, 2, 14]];
function legIK(dx, dy) {
  const d = Math.min(L1 + L2 - 0.05, Math.max(3, Math.hypot(dx, dy)));
  const h = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const k = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return [(-Math.atan2(dx, dy) - h) / D2R, (Math.PI - k) / D2R];
}
const legsAt = (lift, tilt, n = [FEET[0], 0], f = [FEET[1], 0]) => {
  const out = {};
  const r = tilt * D2R;
  [['N', HIPS[0], n], ['F', HIPS[1], f]].forEach(([k, [hx, hy], [fx, up]]) => {
    const hipX = hx * Math.cos(r) - hy * Math.sin(r);
    const hipY = -BASE_Y - lift + hx * Math.sin(r) + hy * Math.cos(r);
    const [th, sh] = legIK(fx - hipX, -SOLE - up - hipY);
    out[`thigh${k}`] = th - tilt;
    out[`shin${k}`] = sh;
    out[`roll${k}`] = up * 3;
  });
  return out;
};

const skPass = (bare) => {
  const i = bare ? 1 : 0;
  const t = bare ? 'b' : '';
  const leg = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `foot${k}${t}`, parent: `ankle${k}`, s: SK.FOOT[j][i], pivot: [12, 1.4], rot: (S) => -(S.tilt + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
      { name: `shin${k}${t}`, parent: `knee${k}`, s: SK.SHIN[j][i], pivot: [7.5, 2], rot: (S) => S[`shin${k}`] * D2R },
      { name: `thigh${k}${t}`, parent: 'trunkJ', s: SK.THIGH[j][i], pivot: [7.5, 2], at: () => HIPS[j], rot: (S) => S[`thigh${k}`] * D2R },
    ];
  };
  const arm = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `up${k}${t}`, parent: 'trunkJ', s: SK.UP[j][i], pivot: [2, 5], at: () => (far ? SHF : SHN), rot: (S) => S[`arm${k}`] * D2R },
      { name: `low${k}${t}`, parent: `elbow${k}`, s: SK.LOW[j][i], pivot: [2, 4.5], rot: (S) => S[`elb${k}`] * D2R },
      { name: `hand${k}${t}`, parent: `wrist${k}`, s: SK.HAND[j][i], pivot: [3, 8], rot: (S) => S[`hand${k}`] * D2R },
    ];
  };
  return [
    ...arm(true),
    { name: `lantern${t}`, parent: 'lanternJ', s: SK.LANTERN[i], pivot: [6, 1] },
    ...leg(true), ...leg(false),
    ...SPROUTS.map(([x, y, k], n) => ({ name: `sprout${n}${t}`, parent: 'trunkJ', s: SK.SPROUT[k][i], pivot: [12, 22], at: () => [x, y + 2], rot: (S) => (S[`sp${n}`] + SPROUTS[n][3]) * D2R })),
    { name: `trunk${t}`, parent: 'trunkJ', s: SK.TRUNK[i], pivot: [36, 64] },
    ...(bare ? [{ name: 'face', parent: 'trunkJ', s: (a) => skFace(a.skMood ?? 'sleep'), pivot: [17, 14], at: () => FACE_AT }] : []),
    ...arm(false),
  ];
};

export const stumpRig = sized(makeRig({
  w: 120, h: 112, soft: true, stride: 1e9, recover: 0.9,
  springs: {
    x: [140, 15], lift: [120, 13], tilt: [70, 9], armN: [110, 11], elbN: [110, 11], handN: [110, 10], armF: [100, 10], elbF: [100, 10], handF: [100, 10],
    lantern: [40, 3], sp0: [36, 3], sp1: [32, 2.8], sp2: [36, 3],
    thighN: [240, 18], thighF: [240, 18], shinN: [240, 18], shinF: [240, 18], rollN: [240, 18], rollF: [240, 18],
  },
  fast: ['armN', 'elbN', 'armF', 'elbF'],
  kick: { tilt: -40, sp0: 200, sp1: -160, sp2: 180, lantern: 160 },
  turnKick: { sp0: 160, sp1: -140, sp2: 150, lantern: 200, tilt: -30 },
  pose(m, a) {
    a.uidOff = (m.uid % 5) * 1.3;
    const t = a.t + a.uidOff;
    const now = a.now;
    const u = stepPhase(m, a, 'sk2', 12 * 1.3);
    const say = sayingOf(m, now);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const still = 1 - walkW;
    // His idle, a slow 14 s act: dozing off; a big yawn; humming, his lantern swinging.
    const lu = fr(t / 14) * 14;
    const busy = active || say || m.swaying || walkW > 0.05 || m.cine || m.aggroUntil === Infinity;
    const doze = busy ? 0 : hold(lu, 0.5, 1.6, 4.6, 5.8);
    const yawn = busy ? 0 : hold(lu, 7, 7.6, 8.6, 9.4);
    const hum = busy ? 0 : hold(lu, 10.4, 11, 13, 13.6);
    a.skAct = { doze: doze * still, yawn: yawn * still, hum: hum * still, lu };
    const br = Math.sin(t * 0.8);
    const nod = doze * (4 + Math.sin(t * 1.6) * 1.4);
    const liftI = br * 0.5 + yawn * 1.6;
    const tiltI = br * 0.8 + nod - yawn * 4 + hum * Math.sin(t * 1.6) * 2;
    const armFI = 100 - hum * 10;
    const elbFI = -10 + hum * Math.sin(t * 1.6) * 10;
    const idle = {
      x: 0, lift: liftI, tilt: tiltI, armN: 60 + br * 4 - yawn * 120, elbN: -10 - yawn * 30, handN: 0, armF: armFI, elbF: elbFI, handF: 0,
      lantern: Math.sin(t * 1.1) * 6 + hum * Math.sin(t * 1.6 - 1) * 12, sp0: Math.sin(t * 0.9) * 4 - nod * 1.2, sp1: Math.sin(t * 0.9 + 1) * 4 - nod, sp2: Math.sin(t * 0.9 + 2) * 4 - nod * 1.2,
      ...legsAt(liftI, tiltI),
    };
    // A slow heavy stomp, rocking side to side.
    const steps = [pawStep(u, 0, 12, 0.62, 4), pawStep(u, 0.5, 12, 0.62, 4)];
    const sw = Math.sin(u * TAU);
    const land = (1 + Math.cos(u * TAU * 2)) / 2;
    const liftW = 0.6 - land * 1.2;
    const tiltW = 2 + sw * 4;
    const walk = {
      ...idle, lift: liftW, tilt: tiltW, armN: 60 + sw * 12, elbN: -10, armF: 100 - sw * 12, elbF: -10, lantern: -sw * 14,
      sp0: 6 + Math.sin(u * TAU * 2 - 1) * 8, sp1: 4 + Math.sin(u * TAU * 2 - 1.4) * 8, sp2: 6 + Math.sin(u * TAU * 2 - 1.8) * 8,
      ...legsAt(liftW, tiltW, [FEET[0] + steps[0][0], steps[0][1]], [FEET[1] + steps[1][0], steps[1][1]]),
    };
    // His plain swing, a heavy slam (2026-11-19: it was only a raise of one branch): both branches
    // hauled up high as he rears back on his roots, then brought down hard in front, the sprouts
    // flung after.
    const antic = { ...idle, x: -3, lift: 2, tilt: -10, armN: -100, elbN: -20, handN: -20, armF: -80, elbF: -20, sp0: -14, sp1: -12, sp2: -14, ...legsAt(2, -10) };
    const strike = { ...idle, x: 6, lift: -3, tilt: 13, armN: 70, elbN: 20, handN: 20, armF: 80, elbF: 20, sp0: 20, sp1: 16, sp2: 22, ...legsAt(-3, 13, [FEET[0] + 6, 0], [FEET[1] + 2, 0]) };
    const S = stateBlend(a, idle, walk, antic, strike);
    const over = (P, w) => {
      if (w <= 0.001) return;
      for (const k of Object.keys(P)) S[k] += (P[k] - S[k]) * w;
    };
    // A word on its way, and what it brings.
    a.skTalk = say && say.after === 0 ? 1 : 0;
    let kind = active ? 'bonk' : null;
    let hit = 0;
    if (say) {
      const w = smooth(clamp(say.u / 0.3, 0, 1));
      hit = say.after > 0 ? 1 - clamp(say.after / 0.6, 0, 1) : 0;
      kind = say.kind;
      if (say.kind === 'slam') {
        // Both branches raised high through the word; slammed down to the floor as it lands.
        over({ lift: 2, tilt: -8, armN: -100, elbN: -20, handN: -20, armF: -80, elbF: -20, sp0: -12, sp1: -10, sp2: -12, ...legsAt(2, -8) }, w * (1 - hit));
        over({ lift: -3, tilt: 12, armN: 70, elbN: 20, handN: 20, armF: 80, elbF: 20, sp0: 20, sp1: 16, sp2: 22, ...legsAt(-3, 12, [FEET[0] + 6, 0], [FEET[1] + 2, 0]) }, hit);
      } else if (say.kind === 'thorns') {
        // Branches plunged down into the floor in front of him.
        over({ lift: -2, tilt: 14, armN: 80, elbN: 20, handN: 30, armF: 70, elbF: 30, handF: 30, sp0: 10, sp1: 8, sp2: 10, ...legsAt(-2, 14, [FEET[0] + 4, 0], [FEET[1], 0]) }, w);
      } else if (say.kind === 'hug') {
        // Branches spread wide through the word; swept in as it lands.
        over({ lift: 1, tilt: -4, armN: -10, elbN: -20, handN: -10, armF: 190, elbF: 20, ...legsAt(1, -4) }, w * (1 - hit));
        over({ lift: 0, tilt: 6, armN: 20, elbN: 80, handN: 40, armF: 160, elbF: -80, handF: -40, ...legsAt(0, 6) }, hit);
      }
    }
    // At the last: rocking slowly, holding on.
    if (m.swaying) {
      const rk = Math.sin(now * 1.3);
      over({ tilt: rk * 8, armN: 20 + rk * 30, elbN: -20, armF: 120 - rk * 30, elbF: -20, sp0: -rk * 12, sp1: -rk * 10, sp2: -rk * 12, lantern: -rk * 20, ...legsAt(0, rk * 8) }, 1);
      kind = 'sway';
    }
    a.skKind = kind;
    a.skHit = hit;
    a.skSay = say;
    a.skMood = skMood(a, m);
    return S;
  },
  parts: [
    { name: 'trunkJ', parent: null, at: (S) => [S.x, -BASE_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'kneeN', parent: 'thighN', at: () => [0, L1] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, L1] },
    { name: 'ankleN', parent: 'shinN', at: () => [0, L2] },
    { name: 'ankleF', parent: 'shinF', at: () => [0, L2] },
    { name: 'elbowN', parent: 'upN', at: () => [UA, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [UA, 0] },
    { name: 'wristN', parent: 'lowN', at: () => [LA, 0] },
    { name: 'wristF', parent: 'lowF', at: () => [LA, 0] },
    // (The lantern hangs from his far hand, always upright, swinging a little.)
    { name: 'lanternJ', parent: 'handF', at: () => [8, 8], rot: (S) => (S.lantern - S.tilt - S.armF - S.elbF - S.handF) * D2R },
    ...skPass(false),
    ...skPass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.22;
    ctx.fillStyle = '#2a3a2a';
    ctx.beginPath();
    ctx.ellipse(0, -0.6, 36, 4, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    const act = a.skAct ?? {};
    const kind = a.skKind;
    const T0 = mat('trunkJ');
    // The window's warm light and the lantern, glowing softly.
    const [wx, wy] = at2(T0, 0, -16);
    const glow = 0.25 + 0.1 * Math.sin(a.now * 2.3);
    puff(ctx, a, wx, wy, 7, glow, '255,233,160');
    const [lx, ly] = at2(mat('lantern'), 0, 11);
    puff(ctx, a, lx, ly, 9, 0.35 + 0.1 * Math.sin(a.now * 3.1), '255,220,140');
    // The yawn: a leaf drifting down off him.
    if (act.yawn > 0.2) {
      const q = clamp((act.lu - 7.4) / 2, 0, 1);
      const [sx, sy] = at2(T0, -10 + Math.sin(q * 9) * 6, -60 + q * 56);
      dot(ctx, a, sx, sy, 1.8, act.yawn * (1 - q * 0.6), '#a2d878');
    }
    // Humming: little notes.
    if (act.hum > 0.3) {
      const [hx, hy] = at2(T0, FACE_AT[0] + 4, FACE_AT[1] + 6);
      for (let k = 0; k < 2; k++) {
        const q = fr(a.now * 0.5 + k / 2);
        dot(ctx, a, hx + 6 + q * 8, hy - q * 18, 1.4, act.hum * (1 - q), '#ffffff');
      }
    }
    // The Root Slam and the Thorns landing: dust and bits of root along the floor.
    if ((kind === 'slam' || kind === 'thorns') && a.skHit > 0.1) {
      const q = 1 - a.skHit;
      for (let k = 0; k < 6; k++) {
        const sd = k % 2 ? 1 : -1;
        puff(ctx, a, sd * (14 + q * 40 + (k >> 1) * 10), -4 - (k >> 1) * 3, 4 + q * 6, a.skHit * 0.8, '200,170,130');
      }
    }
    // Elder Yomogi in two of his roots, at his feet (until freed).
    if (!m.yomogiFree) {
      const y = yomogiOf(a);
      const yx = S.x + 50;
      ctx.save();
      ctx.globalAlpha = a.alpha;
      drawMochiAnim(ctx, y, yx, -2, a.t);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = a.alpha;
      ctx.lineCap = 'round';
      const wob = Math.sin(a.t * 1.1) * 1.2;
      for (const [c, w] of [[INK, 4.4], [BARK.base, 2.8], [BARK.hi, 0.8]]) {
        ctx.strokeStyle = c;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(yx - 26, -2);
        ctx.bezierCurveTo(yx - 14, -4, yx - 14, -13 + wob, yx, -12 + wob);
        ctx.bezierCurveTo(yx + 12, -11 + wob, yx + 13, -6, yx + 6, -5);
        ctx.moveTo(yx - 22, -1);
        ctx.bezierCurveTo(yx - 10, 0, yx - 10, -8 - wob, yx + 2, -7 - wob);
        ctx.bezierCurveTo(yx + 10, -6, yx + 10, -1, yx + 14, -1);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.globalAlpha = a.alpha;
  },
}), 1.3);
function skMood(a, m) {
  if (m.hp <= 0) return 'sleep';
  if (m.cine?.mood && SK_FACES[m.cine.mood]) return m.cine.mood;
  if (a.skTalk) return 'talk';
  const kind = a.skKind;
  if ((kind === 'slam' || kind === 'thorns' || kind === 'hug') && a.skHit > 0.2) return 'angry';
  if (kind === 'sway') return 'sleep';
  if (a.ph.atk || a.ph.antic > 0.3 || a.ph.strike > 0.3) return 'angry';
  if (a.mood === 'hurt' || a.face === 'hurt') return 'hurt';
  if (m.aggroUntil === Infinity) return 'angry';
  if (a.now - (m.gloatAt ?? -9) < 0.9) return 'happy';
  const act = a.skAct ?? {};
  if (act.yawn > 0.4) return 'yawn';
  if (act.hum > 0.4) return 'hum';
  if (act.doze > 0.4) return 'sleep';
  return 'idle';
}

// ---------- The still (portraits) ----------
export function stumpStill(pose, f, mood) {
  const fm = SK_FACES[mood] ? mood : MOODS.has(mood) ? mood : 'sleep';
  const lg = legsAt(0, 0);
  const B = [0, -BASE_Y];
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
    return [...put(footP(far)(), [12, 1.4], ax, ay, 0), ...put(shinP(far)(), [7.5, 2], kx, ky, th + sh), ...put(thighP(far)(), [7.5, 2], hx, hy, th)];
  };
  const arm = (far, a1, a2) => {
    const [sx, sy] = at(far ? SHF : SHN);
    const ex = sx + Math.cos(a1 * D2R) * UA;
    const ey = sy + Math.sin(a1 * D2R) * UA;
    const wx = ex + Math.cos((a1 + a2) * D2R) * LA;
    const wy = ey + Math.sin((a1 + a2) * D2R) * LA;
    return { shapes: [...put(upperP(far)(), [2, 5], sx, sy, a1), ...put(lowerP(far)(), [2, 4.5], ex, ey, a1 + a2), ...put(handP(far)(), [3, 8], wx, wy, a1 + a2)], w: [wx, wy], a: a1 + a2 };
  };
  const an = arm(false, 60, -10);
  const af = arm(true, 100, -10);
  const lh = [af.w[0] + Math.cos(af.a * D2R) * 8 - Math.sin(af.a * D2R) * 0, af.w[1] + Math.sin(af.a * D2R) * 8];
  return { w: 124, h: 116, res: 2, shapes: shift([
    ...af.shapes, ...put(lanternP(), [6, 1], lh[0], lh[1], 0), ...legAt(true), ...legAt(false),
    ...SPROUTS.flatMap(([x, y, k, d]) => put(sproutP(k)(), [12, 22], ...at([x, y + 2]), d)),
    ...put(trunkP(), [36, 64], ...B), ...put((SK_FACES[fm] ?? SK_FACES.sleep)(), [17, 14], ...at(FACE_AT)),
    ...an.shapes,
  ], 60, 114) };
}
