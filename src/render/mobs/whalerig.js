// The Whale's Dream (redrawn 2026-11-19, the player's pick "A, the Sleepy Sky Whale Pup"): the
// sleeping spirit of the Sky Whale, a round sky-blue baby whale, soft and a little see-through, a
// few stars glowing inside her, a pale belly with soft pleats. A nightcap with a cream fur trim sits
// on her head, its tip flopping back with a gold star on the end; she sleeps on a bed of cloud. Her eyes stay shut all fight.
//
// How she moves:
//   idle    a 10 s act: a snore (a puff of cloud from her blowhole, a slow breath in and out); a
//           dream-swim (flippers paddling, fluke beating, a happy smile); rolling over in her sleep
//           (a mumble).
//   swim    the fluke beating, the body pitching gently with it, flippers sweeping, the nightcap
//           and its star swinging after.
//   fight   (world/skywhale.js) a plain swing is a sleepy bonk of her nose; the Lullaby
//           (m.lullabyAt) she sways and hums, notes drifting up; the Deep Dive (m.mech.diving) she
//           noses down into the clouds and sinks (render/scene.js fades her), then breaches
//           (m.breachAt) up out of them under someone; the Starlight Song (m.songAt) she lifts her
//           head and sings, stars bursting round her; She stirs (m.stirAt) a grumpy roll, one eye
//           half open.
//   scenes  asleep (sad: a worried frown in her sleep; angry: one eye cracked open, cross); woken
//           in the end (happy) with her eyes open at last.

import { E, T, F, R, stroke } from './kit.js';
import { ramp } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, put, MOODS, faceShapes, sparkle, puff, note } from './rigkit.js';

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
const SKY = ramp('#9fd0ff', { step: 9, turn: 12 });
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
const CAP = '#4a5ab8';
const CREAM = '#f4ecd8';
const wd = pairOf('wd2');
const twinkle = (x, y, r, c = '#ffffff') => F(T([[x, y - r], [x + r * 0.28, y - r * 0.28], [x + r, y], [x + r * 0.28, y + r * 0.28], [x, y + r], [x - r * 0.28, y + r * 0.28], [x - r, y], [x - r * 0.28, y - r * 0.28]], c));
const star5 = (x, y, r, c) => T(Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5;
  const rr = i % 2 ? r * 0.45 : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c);

// ---------- Parts ----------
// (Rig space: the floor at y 0, facing right. Her body's middle floats 42 above the floor.)
// Her body (box 84 x 58 about (43, 29)): a big round head to the right, tapering back to the tail
// stock; a pale see-through glow inside with a few stars, a pale belly with soft pleats.
const bodyP = () => [
  blob([[3, 28], [15, 18], [31, 8], [51, 2], [71, 6], [82, 20], [82, 36], [74, 50], [55, 56], [33, 54], [15, 46], [4, 38]], SKY.base, 2),
  F(taper([[19, 24], [35, 12], [55, 7]], 2.4, 1.6, '#c8e8ff')), F(E(43, 26, 24, 13, '#b8e0ff')),
  F(blob([[19, 44], [35, 51], [55, 55], [73, 49], [79, 38], [61, 44], [39, 45]], '#eaf6ff', 2)), ...line(arcP(53, 40, 22, 10, 30, 150, 9), 0.6, '#b8d8f4'), ...line(arcP(53, 38, 18, 8, 40, 140, 9), 0.6, '#b8d8f4'),
  twinkle(23, 30, 2.6), twinkle(35, 20, 2, '#fff3a0'), twinkle(31, 38, 1.6), twinkle(47, 16, 1.8),
  F(E(71, 14, 5, 1.8, '#d8f0ff')),
];
// Her fluke (box 30 x 40, rooted at (28, 20.5) inside the tail stock): two wide lobes swept back.
const flukeP = () => [blob([[28, 17], [18, 12], [8, 2], [1, 2], [3, 11], [10, 20], [3, 29], [1, 38], [8, 38], [18, 28], [28, 24]], SKY.base, 2), F(taper([[24, 17.4], [10, 6]], 1.4, 0.8, '#c8e8ff'))];
// A flipper (box 26 x 22 rooted at (19, 4)): a paddle swept back.
const flipP = (far) => () => [blob([[14, 2], [24, 5], [18, 14], [6, 22], [1, 20], [8, 10]], far ? '#6aa8e8' : SKY.sh, 2), F(taper([[12, 8], [6, 17]], 1, 0.8, far ? SKY.sh : SKY.base))];
// The nightcap, one hat (redone 2026-11-19 at the player's note "the hat fur thing isn't
// connected": the fur trim and the cone were two pieces that slid apart as it swung). Its base sits
// on her head: the cream fur trim round its rim and the lower cone rising out of it, one piece (box
// 40 x 30 about the trim's middle (20, 22)). The floppy tip hangs off the base's top on a round
// hinge (box 34 x 20 hinged at (29, 11)), a cream stripe across it; the gold star on its end (box
// 12 x 12 about (6, 6)).
const hatBaseP = () => [
  blob([[6, 24], [34, 21], [31, 11], [23, 3], [13, 2], [8, 12]], CAP, 2), F(taper([[10, 14], [29, 12]], 2.8, 2.6, CREAM)), F(taper([[26, 6], [30, 16]], 0.8, 0.6, '#6a7ad8')),
  blob([[1, 23], [19, 18], [38, 20], [39, 26], [20, 24.6], [2, 29]], CREAM, 1), F(taper([[4, 25], [19, 20.4], [35, 22]], 0.8, 0.6, '#ffffff')),
];
const hatTipP = () => [E(29, 11, 6.6, 6.6, CAP), taper([[29, 11], [20, 9.4], [10, 10], [3, 13]], 13, 5.6, CAP), F(taper([[17, 4.6], [15.4, 15.6]], 2.8, 2.4, CREAM)), F(taper([[27, 7], [12, 7]], 0.8, 0.6, '#6a7ad8'))];
const starP = () => [star5(6, 6, 4.6, GOLD.base), F(E(5, 4.6, 1, 0.8, '#ffffff'))];
// A puff of the cloud bed she sleeps on (box 30 x 16 about (15, 10)).
const cloudP = (k) => () => [E(8, 10, 7, 4.6, '#ffffff'), E(22, 10, 7.6, 5, '#ffffff'), E(15, 7, 8.4, 6, '#ffffff'), F(taper([[3, 13.4], [27, 13.4]], 2, 2, k ? '#d4e6ff' : '#dcecff'))];
const WD = {
  BODY: wd('body', 84, 58, bodyP, 2), FLUKE: wd('fluke', 30, 40, flukeP, 2), FLIP: [false, true].map((f) => wd(`flip${f ? 1 : 0}`, 26, 22, flipP(f), 2)),
  HATBASE: wd('hatBase', 40, 30, hatBaseP, 2), HATTIP: wd('hatTip', 34, 20, hatTipP, 2), STAR: wd('star', 12, 12, starP, 2), CLOUD: [0, 1].map((k) => wd(`cloud${k}`, 30, 16, cloudP(k), 2)),
};

// ---------- Faces (box 34 x 24 about (17, 12), on her head) ----------
const EN = [22.6, 11, 3];
const EF = [12.6, 11.2, 2.5];
const MX = 18;
const MY = 17.4;
const LIP = '#6a3a5a';
const closed = ([x, y, r], side) => [...line(arcP(x, y, r, r * 0.6, 20, 160, 7), 0.8), ...line([[x + side * r * 0.9, y + 0.6], [x + side * r * 1.4, y + 1.6]], 0.6)];
const happyShut = ([x, y, r]) => line(arcP(x, y + 1.4, r, r * 0.7, 200, 340, 7), 0.8);
const open = ([x, y, r], side, { lid = 0 } = {}) => {
  const top = y - r * 1.1 * (1 - lid * 2);
  return [
    F(E(x, y, r, r * 1.12, INK)), F(E(x, y + r * 0.3, r * 0.78, r * 0.7, '#3a7ad8')), F(E(x - r * 0.32, y - r * 0.4, r * 0.4, r * 0.42, '#ffffff')), F(E(x + r * 0.3, y + r * 0.45, r * 0.16, r * 0.16, '#ffffff')),
    ...(lid > 0 ? [F(T([...arcP(x, y, r * 1.14, r * 1.24, 180, 360, 8), ...arcP(x, top, r * 1.14, r * 0.35, 0, 180, 8)], SKY.base)), ...line(arcP(x, top, r * 1.06, r * 0.33, 15, 165, 7), 0.6)] : []),
    ...line([[x + side * r * 0.9, y - r * 0.5], [x + side * r * 1.5, y - r * 0.95]], 0.6),
  ];
};
const blush = (k = 1) => [F(E(EN[0] + 0.8, EN[1] + 4.4, 2.2 * k, 1.1 * k, '#ffa8bc')), F(E(EF[0] - 1, EF[1] + 4.4, 1.8 * k, 1 * k, '#ffa8bc'))];
const smile = () => line(arcP(MX, MY, 1.8, 1, 20, 160, 7), 0.7, LIP);
const oh = (k = 1) => [F(E(MX, MY + 0.4, 1.1 * k, 1.3 * k, LIP))];
const worried = () => [...line([[EN[0] - 2.4, EN[1] - 4.4], [EN[0] + 1.6, EN[1] - 3.2]], 0.6), ...line([[EF[0] + 2, EF[1] - 4.2], [EF[0] - 1.6, EF[1] - 3.2]], 0.6)];
const WD_FACES = {
  // Asleep: eyes shut, lashes down, a little smile.
  sleep: () => [...closed(EN, 1), ...closed(EF, -1), ...smile(), ...blush()],
  // Snoring, humming: a little round mouth.
  snore: () => [...closed(EN, 1), ...closed(EF, -1), ...oh(), ...blush()],
  // Dreaming of swimming: a happy smile.
  dream: () => [...closed(EN, 1), ...closed(EF, -1), F(T(arcP(MX, MY - 0.4, 2.2, 2, 0, 180, 9), LIP)), ...blush(1.15)],
  mumble: () => [...closed(EN, 1), ...closed(EF, -1), ...line([[MX - 2.2, MY + 0.4], [MX - 1.1, MY - 0.4], [MX, MY + 0.4], [MX + 1.1, MY - 0.4], [MX + 2.2, MY + 0.4]], 0.6, LIP), ...blush()],
  sing: () => [...closed(EN, 1), ...closed(EF, -1), F(E(MX, MY + 0.6, 1.8, 2.2, LIP)), F(E(MX, MY + 1.6, 1, 0.6, '#ff9ab0')), ...blush(1.1)],
  // Sad in her sleep: a worried frown.
  sad: () => [...closed(EN, 1), ...closed(EF, -1), ...worried(), ...line(arcP(MX, MY + 1.4, 1.6, 0.8, 200, 340, 6), 0.7, LIP), ...blush(0.9)],
  // Cross: one eye cracked open, the other shut tight, a pout.
  cross: () => [...open(EN, 1, { lid: 0.42 }), ...line([[EF[0] - 2.4, EF[1] - 0.6], [EF[0], EF[1] + 0.6], [EF[0] + 2.4, EF[1] - 0.6]], 0.8), ...line([[EN[0] - 2.6, EN[1] - 4.6], [EN[0] + 1.6, EN[1] - 3.4]], 0.7), ...line(arcP(MX, MY + 1.4, 1.8, 0.8, 200, 340, 6), 0.7, LIP), ...blush()],
  // Woken at last: eyes open and shining.
  happy: () => [...open(EN, 1), ...open(EF, -1), F(T(arcP(MX, MY - 0.4, 2.4, 2.2, 0, 180, 9), LIP)), F(E(MX, MY + 0.8, 1.2, 0.6, '#ff9ab0')), ...blush(1.15)],
  hurt: () => [...line([[EN[0] - 2.4, EN[1] - 1.8], [EN[0] + 1.4, EN[1]], [EN[0] - 2.4, EN[1] + 1.8]], 0.8), ...line([[EF[0] + 2, EF[1] - 1.6], [EF[0] - 1.2, EF[1]], [EF[0] + 2, EF[1] + 1.6]], 0.8), ...line(arcP(MX, MY + 1.6, 1.8, 1, 200, 340, 6), 0.7, LIP), ...blush()],
  dead: () => [...[EN, EF].flatMap(([x, y, r]) => line(Array.from({ length: 16 }, (_, i) => [x + Math.cos(i * 0.85) * (0.2 + i * r * 0.07), y + Math.sin(i * 0.85) * (0.2 + i * r * 0.07)]), 0.6)), ...oh(0.9), ...blush()],
};
WD_FACES.blink = WD_FACES.sleep;
WD_FACES.idle = WD_FACES.sleep;
WD_FACES.angry = WD_FACES.cross;
const FACE_FB = { eyes: [[EN[0], EN[1], 2.8, 3, 1], [EF[0], EF[1], 2.2, 2.4, -1]], mouth: [MX, MY, 1], blush: [[EN[0] + 0.8, EN[1] + 4.4, 1.4], [EF[0] - 1, EF[1] + 4.4, 1.2]], iris: '#3a7ad8', lid: 0, lashes: 1 };
const wdFace = (mood) => faceSprite(`wd2|face|${mood}`, 34, 24, () => (WD_FACES[mood] ?? (() => faceShapes(mood, FACE_FB)))());

// ---------- Skeleton ----------
const FLOAT = 42;
const FLUKE_AT = [-36, 3.5];
const FLIP_N = [9, 17];
const FLIP_F = [-2, 15];
const FACE_AT = [22, -3];
const BAND_AT = [14, -21];
const HINGE = [-6, -16];
const HAT_TIP = [-26, 2];

const wdPass = (bare) => {
  const i = bare ? 1 : 0;
  const t = bare ? 'b' : '';
  return [
    ...[[-26, -5, 1], [0, -3, 0], [24, -5, 1]].map(([x, y, k], n) => ({ name: `cloud${n}${t}`, parent: null, s: WD.CLOUD[k][i], pivot: [15, 10], at: (S) => [x + S.x * 0.3, y + S[`c${n}`]], alpha: (a, S) => S.bed })),
    { name: `flipF${t}`, parent: 'root', s: WD.FLIP[1][i], pivot: [19, 4], at: () => FLIP_F, rot: (S) => S.flipF * D2R },
    { name: `fluke${t}`, parent: 'root', s: WD.FLUKE[i], pivot: [28, 20.5], at: () => FLUKE_AT, rot: (S) => S.fluke * D2R },
    { name: `body${t}`, parent: 'root', s: WD.BODY[i], pivot: [43, 29] },
    ...(bare ? [{ name: 'face', parent: 'root', s: (a) => wdFace(a.wdMood ?? 'sleep'), pivot: [17, 12], at: () => FACE_AT }] : []),
    // (The tip first, so the base's top covers its hinge: one hat, bending.)
    { name: `hatTip${t}`, parent: 'hatJ', s: WD.HATTIP[i], pivot: [29, 11], rot: (S) => S.cap * 0.85 * D2R },
    { name: `star${t}`, parent: 'tip', s: WD.STAR[i], pivot: [6, 6], rot: (S) => S.star * D2R },
    { name: `hatBase${t}`, parent: 'root', s: WD.HATBASE[i], pivot: [20, 22], at: () => BAND_AT, rot: (S) => (-6 + S.cap * 0.15) * D2R },
    { name: `flipN${t}`, parent: 'root', s: WD.FLIP[0][i], pivot: [19, 4], at: () => FLIP_N, rot: (S) => S.flipN * D2R },
  ];
};

export const whaleRig = sized(makeRig({
  w: 120, h: 96, soft: true, stride: 1e9, recover: 0.6,
  springs: {
    x: [160, 14], rise: [90, 10], roll: [90, 9], fluke: [120, 8], flipN: [140, 9], flipF: [140, 9], cap: [60, 4.4], star: [40, 3], bed: [60, 10], c0: [40, 6], c1: [40, 6], c2: [40, 6],
  },
  fast: ['x', 'roll', 'rise', 'fluke'],
  kick: { roll: -120, cap: 200, star: -260, fluke: 200, flipN: 200 },
  turnKick: { cap: 160, star: -240, fluke: 160, roll: -60 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.13;
    const t = a.t + a.uidOff;
    const mo = a.mo ?? {};
    const now = a.now;
    const dive = m.mech?.diving;
    const diveU = dive ? clamp(1 - (dive.at - now) / 2.2, 0, 1) : 0;
    const breach = m.breachAt != null && now >= m.breachAt && now < m.breachAt + 1.4 ? (now - m.breachAt) / 1.4 : -1;
    const lull = m.lullabyAt != null && now >= m.lullabyAt && now < m.lullabyAt + 2.4 ? hold(now - m.lullabyAt, 0, 0.4, 1.9, 2.4) : 0;
    const song = m.songAt != null && now >= m.songAt && now < m.songAt + 1.6 ? hold(now - m.songAt, 0, 0.3, 1.1, 1.6) : 0;
    const stir = m.stirAt != null && now >= m.stirAt && now < m.stirAt + 1.8 ? hold(now - m.stirAt, 0, 0.25, 1.3, 1.8) : 0;
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const busy = active || diveU > 0 || breach >= 0 || lull > 0.02 || song > 0.02 || stir > 0.02 || walkW > 0.05 || m.cine;
    // Her idle, a 10 s act: a snore; a dream-swim; rolling over in her sleep.
    const lu = fr(t / 10) * 10;
    const snore = busy ? 0 : hold(lu, 0.6, 1.2, 2.6, 3.2);
    const swim = busy ? 0 : hold(lu, 4, 4.5, 6.2, 6.7);
    const roll = busy ? 0 : hold(lu, 7.4, 8.2, 8.8, 9.6);
    const breath = Math.sin(clamp((lu - 0.6) / 2.6, 0, 1) * Math.PI);
    a.wdAct = { snore, swim, roll, lull, song, stir, breath: snore * breath };
    const beat = Math.sin(t * 1.6);
    const idle = {
      x: 0, rise: Math.sin(t * 1.4) * 2.4 + snore * breath * 2.4, roll: Math.sin(t * 0.9) * 3 - snore * breath * 3 - roll * 14,
      fluke: beat * 10 + swim * Math.sin(t * 7) * 18, flipN: 22 + Math.sin(t * 1.2) * 10 + swim * (-12 + Math.sin(t * 7 + 1) * 24), flipF: 28 + Math.sin(t * 1.2 + 1) * 8 + swim * (-10 + Math.sin(t * 7 + 2) * 18),
      cap: Math.sin(t * 1.1) * 4 + roll * 14, star: Math.sin(t * 1.1 - 1) * 10 + roll * 20, bed: 1, c0: Math.sin(t * 1.3) * 0.8, c1: Math.sin(t * 1.3 + 2) * 0.8, c2: Math.sin(t * 1.3 + 4) * 0.8,
    };
    // Swimming through the air: the fluke beating, her body pitching with it.
    const ws = t * 4.2;
    const walk = { ...idle, rise: Math.sin(ws) * 1.6, roll: Math.sin(ws - 1.2) * 4, fluke: Math.sin(ws) * 24, flipN: 16 + Math.sin(ws + 1) * 20, flipF: 22 + Math.sin(ws + 2) * 14, cap: 14 + Math.sin(ws - 1) * 6, star: 24 + Math.sin(ws - 2) * 14 };
    // A sleepy bonk of her nose: rearing back, then nodding forward into you.
    const antic = { ...idle, x: -4, rise: 3, roll: -16, fluke: 30, flipN: -30, flipF: -20, cap: -10, star: -20 };
    const strike = { ...idle, x: 10, rise: -3, roll: 18, fluke: -30, flipN: 40, flipF: 30, cap: 24, star: 40 };
    const S = stateBlend(a, idle, walk, antic, strike);
    const over = (P, w) => {
      if (w <= 0.001) return;
      for (const k of Object.keys(P)) S[k] += (P[k] - S[k]) * w;
    };
    // The Lullaby: swaying and humming.
    over({ roll: Math.sin(now * 2.2) * 7, rise: 2 + Math.sin(now * 2.2 + 1) * 1.6, flipN: 14 + Math.sin(now * 2.2) * 16, flipF: 22 - Math.sin(now * 2.2) * 12, fluke: Math.sin(now * 2.2 - 1) * 14, cap: Math.sin(now * 2.2 - 1) * 10 }, lull);
    // She stirs: a grumpy roll and a slap of her flipper.
    over({ roll: -10 + Math.sin(now * 16) * 3, rise: 1, flipN: -40 + Math.sin(now * 10) * 30, fluke: 26, cap: -14, star: -30 }, stir);
    // The Starlight Song: head up, flippers out, singing.
    over({ roll: -14, rise: 4, flipN: -50, flipF: -40, fluke: 24, cap: -16, star: -24 }, song);
    // The Deep Dive: nosing down into the clouds and sinking (the scene fades her out).
    if (diveU > 0) over({ roll: 38, rise: -34 * smooth(diveU), x: 6 * diveU, fluke: -34, flipN: -40, flipF: -30, cap: 40, star: 50, bed: 0 }, smooth(clamp(diveU / 0.3, 0, 1)));
    // The breach: up out of the clouds nose first, then settling.
    if (breach >= 0) {
      const up = smooth(clamp(breach / 0.5, 0, 1));
      const settle = smooth(clamp((breach - 0.5) / 0.9, 0, 1));
      over({ rise: -48 * (1 - up) + 8 * up * (1 - settle), roll: -34 * (1 - settle), fluke: 30 * (1 - settle), flipN: -40 * (1 - settle), flipF: -30 * (1 - settle), cap: 30 * (1 - settle), star: 40 * (1 - settle), bed: settle }, 1);
      if (breach < 0.2) a.alpha *= smooth(breach / 0.2);
    }
    a.wdBreach = breach;
    a.wdDive = diveU;
    a.wdMood = wdMood(a, m);
    return S;
  },
  parts: [
    { name: 'root', parent: null, at: (S) => [S.x, -FLOAT - S.rise], rot: (S) => S.roll * D2R },
    { name: 'hatJ', parent: 'hatBase', at: () => HINGE },
    { name: 'tip', parent: 'hatTip', at: () => HAT_TIP },
    ...wdPass(false),
    ...wdPass(true),
  ],
  under(ctx, m, a, S) {
    ctx.globalAlpha = a.alpha * 0.18 * (S.bed ?? 1);
    ctx.fillStyle = '#2a3a6a';
    ctx.beginPath();
    ctx.ellipse(0, -0.6, 44, 4, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const act = a.wdAct ?? {};
    const [bx, by] = at2(mat('root'), 6, -26);
    const [nx, ny] = at2(mat('root'), 40, -2);
    // Stars twinkling inside her, slowly.
    const R0 = mat('root');
    for (let k = 0; k < 3; k++) {
      const q = 0.5 + 0.5 * Math.sin(a.now * 1.6 + k * 2.1);
      const [sx, sy] = at2(R0, [-16, -6, 4][k], [-8, 6, -14][k]);
      sparkle(ctx, a, sx, sy, 1 + q * 1.4, 0.35 + q * 0.5, k === 1 ? '#fff3a0' : '#ffffff');
    }
    // A snore: a puff of cloud out of her blowhole, rising and fading.
    if (act.snore > 0.2) {
      const u = fr(a.now * 0.45);
      puff(ctx, a, bx - u * 4, by - u * 14, 2.4 + u * 4, act.snore * (1 - u) * 0.9, '255,255,255');
    }
    // The Lullaby and the Song: notes drifting up.
    const hum = Math.max(act.lull ?? 0, act.song ?? 0);
    if (hum > 0.1) {
      for (let k = 0; k < 3; k++) {
        const u = fr(a.now * 0.6 + k / 3);
        note(ctx, a, nx + Math.sin(u * 6 + k) * 6 + k * 4, ny - 8 - u * 26, hum * (1 - u), k % 2 ? '#fff3a0' : '#ffffff', 7);
      }
    }
    // The Song: stars bursting out round her.
    if ((act.song ?? 0) > 0.1) {
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * TAU + a.now * 0.8;
        const r = 30 + 14 * act.song;
        sparkle(ctx, a, Math.cos(ang) * r, -FLOAT + Math.sin(ang) * r * 0.6, 2.6, act.song * 0.9, k % 2 ? '#fff3a0' : '#bfeeff');
      }
    }
    // The dive and the breach: clouds billowing up off the floor round her.
    const churn = Math.max(a.wdDive > 0 ? Math.sin(Math.min(1, a.wdDive * 1.4) * Math.PI) : 0, a.wdBreach >= 0 ? 1 - a.wdBreach : 0);
    if (churn > 0.05) {
      for (let k = 0; k < 6; k++) puff(ctx, a, -34 + k * 14, -6 - (k % 2) * 6 - churn * 6, 8 + churn * 6, churn * 0.85, '255,255,255');
    }
    // The bonk: a little burst of cloud off her nose.
    if (a.ph.strike > 0.2) {
      const q = 1 - a.ph.strike;
      for (let k = 0; k < 3; k++) puff(ctx, a, nx + 4 + q * 10 + k * 3, ny - 4 + (k - 1) * 6, 3 + q * 4, a.ph.strike * 0.8, '255,255,255');
    }
    ctx.globalAlpha = a.alpha;
  },
}), 1.05);
function wdMood(a, m) {
  if (m.hp <= 0) return 'dead';
  if (m.cine?.mood === 'happy') return 'happy';
  if (m.cine?.mood === 'sad') return 'sad';
  if (m.cine?.mood === 'angry') return 'cross';
  const act = a.wdAct ?? {};
  if (act.stir > 0.3 || a.ph.antic > 0.3 || a.ph.strike > 0.3) return 'cross';
  if (a.mood === 'hurt' || a.face === 'hurt') return 'hurt';
  if (act.song > 0.3) return 'sing';
  if (act.lull > 0.3 || act.snore > 0.4) return 'snore';
  if (act.swim > 0.4) return 'dream';
  if (act.roll > 0.4) return 'mumble';
  return 'sleep';
}

// ---------- The still (portraits) ----------
export function whaleStill(pose, f, mood) {
  const fm = WD_FACES[mood] ? mood : MOODS.has(mood) ? mood : 'sleep';
  const ox = 62;
  const oy = 94;
  const R = [ox, oy - FLOAT];
  const at = ([x, y]) => [R[0] + x, R[1] + y];
  const tilt = (v) => [v[0] * Math.cos(-6 * D2R) - v[1] * Math.sin(-6 * D2R), v[0] * Math.sin(-6 * D2R) + v[1] * Math.cos(-6 * D2R)];
  const hinge = at([BAND_AT[0] + tilt(HINGE)[0], BAND_AT[1] + tilt(HINGE)[1]]);
  const tip = [hinge[0] + tilt(HAT_TIP)[0], hinge[1] + tilt(HAT_TIP)[1]];
  return { w: 124, h: 96, res: 2, shapes: [
    ...put(cloudP(1)(), [15, 10], ox - 26, oy - 5), ...put(cloudP(0)(), [15, 10], ox, oy - 3), ...put(cloudP(1)(), [15, 10], ox + 24, oy - 5),
    ...put(flipP(true)(), [19, 4], ...at(FLIP_F), 28), ...put(flukeP(), [28, 20.5], ...at(FLUKE_AT)), 
    ...put(bodyP(), [43, 29], ...R), ...put((WD_FACES[fm] ?? WD_FACES.sleep)(), [17, 12], ...at(FACE_AT)),
    ...put(hatTipP(), [29, 11], ...hinge, -6), ...put(starP(), [6, 6], ...tip), ...put(hatBaseP(), [20, 22], ...at(BAND_AT), -6), ...put(flipP(false)(), [19, 4], ...at(FLIP_N), 22),
  ] };
}
