// The Kite Rider, remade 2026-11-20 (the player's pick "Duckling on a Kite"): a duckling too small
// to fly yet, in a leather flying cap and goggles, hanging on under a red-and-cream kite with a little
// sun on it, its tail of bows streaming in the wind. Live rig, outer outline only, the face bare, no
// squash.
//
// How it moves:
//   idle    a 9 s act: bobbing on the wind, the kite swaying, its feet paddling (they touch down at
//           the bottom of each bob); a gust lifting it up, feet kicking happily; a look down at its
//           feet.
//   walk    skipping along on the wind, feet brushing the ground, the kite leaning ahead.
//   fight   the kite climbs and rears back, feet tucked; then dives and the duckling kicks with
//           both feet.
//   hit     the kite spins round on its string, the duckling swings under it.
//   dead    the kite flops down behind it and the duckling sits in a heap, dizzy.
// Built in the concept's own units and drawn at K of them; the feet at y 0.

import { E, T, R, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, stepPhase, put, MOODS, moodOf, faceShapes } from './rigkit.js';

const K = 0.8;
const DUCK = '#ffd45a';
const DUCKD = '#f2b83a';
const BEAK = '#ff9a3a';
const LEATHER = '#8e5e3c';
const GOLD = '#f2c860';
const CORAL = '#ff7a6a';
const STICK = '#9a6a44';
const kd = pairOf('kiteduck');

const smoothPts = (pts, n = 1) => {
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
const blob = (pts, c, n = 1) => T(smoothPts(pts, n), c);

// ---------- Parts ----------
// The kite: red and cream panels, its spars, a little sun. Box 40 x 42; the bottom point (20, 40),
// where the duckling holds on.
const kiteP = () => {
  const C = [20, 20];
  const P = [[20, 3], [37, 18], [20, 40], [3, 18]];
  const out = P.map((p, i) => T([C, p, P[(i + 1) % 4]], i % 2 ? '#fff4e0' : '#ff6a6a'));
  out.push(F(taper([P[0], P[2]], 1, 1, STICK)), F(taper([P[3], P[1]], 1, 1, STICK)), F(E(20, 20, 3.6, 3.6, GOLD)));
  for (let k = 0; k < 8; k++) out.push(F(E(20 + Math.cos((k / 8) * TAU) * 5.2, 20 + Math.sin((k / 8) * TAU) * 5.2, 0.9, 0.9, GOLD)));
  return out;
};
// The kite's tail of bows. Box 36 x 16; its end at the kite's bottom (34, 2).
const bow = (x, y, c) => [T([[x, y], [x - 3, y - 2.6], [x - 3, y + 2.6]], c), T([[x, y], [x + 3, y - 2.6], [x + 3, y + 2.6]], c)];
const tailP = () => [taper([[34, 2], [26, 8], [16, 6], [8, 12], [1, 10]], 1, 1, STICK), ...bow(25, 7.4, CORAL), ...bow(13, 8, GOLD), ...bow(5, 11.2, CORAL)];
// The duckling's body and its tail. Box 24 x 14; its middle (12, 7).
const bodyP = () => [blob([[5, 2], [19, 2], [21, 8], [16, 12], [8, 12], [4, 8]], DUCK), F(blob([[6, 5], [10, 4], [9, 9], [6, 9]], '#ffe89a')), T([[4, 4], [0, 2], [3, 7]], DUCK)];
// A wing held up to the kite. Box 8 x 16; the shoulder (4, 14).
const wingP = (far) => () => [taper([[4, 14], [5, 3]], 3, 2.6, far ? DUCKD : DUCK), E(5.4, 2.4, 2, 1.8, far ? DUCKD : DUCK)];
// A leg and a webbed foot. Box 10 x 10; the hip (5, 1).
const footP = () => [taper([[5, 1], [4.6, 5]], 1, 1, BEAK), T([[4, 4], [2, 7.6], [7, 7.6]], BEAK)];
// The head: the beak, the flying cap, goggles and a tuft. Box 22 x 20; its middle (9, 10).
const headP = () => [
  E(9, 10, 7, 6.4, DUCK), blob([[14, 10], [19.6, 10.6], [19.6, 13], [14, 13]], BEAK), F(R(14.6, 11.6, 4.6, 0.6, '#d8742a')),
  blob([[2, 9], [3, 4], [9, 2], [15, 4], [16, 8], [12, 6], [5, 6]], LEATHER), E(6, 5.2, 2.6, 2.2, GOLD), E(11.6, 4.8, 2.6, 2.2, GOLD),
  F(E(6, 5.2, 1.8, 1.4, '#bfe8ff')), F(E(11.6, 4.8, 1.8, 1.4, '#bfe8ff')), F(taper([[9, 2.4], [7.6, -0.4], [10.4, -1.2]], 1.2, 0.6, DUCKD)),
];
const PR = {
  KITE: kd('kite', 40, 42, kiteP, 3, 3), TAIL: kd('tail', 36, 16, tailP, 3, 3), BODY: kd('body', 24, 14, bodyP, 3, 3),
  WING: [false, true].map((f) => kd(`wing${f ? 1 : 0}`, 8, 16, wingP(f), 3, 3)), FOOT: kd('foot', 10, 10, footP, 3), HEAD: kd('head', 22, 20, headP, 3, 3),
};
const FACE = { eyes: [[12, 9.4, 1.7, 2.2, 1]], mouth: [17.4, 14.4, 0.9], blush: [[12.6, 13, 1.2]], iris: '#3a2a2a', lid: 0, lashes: 0 };
const duckFace = (mood) => faceSprite(`kiteduck|face|${mood}`, 22, 20, () => faceShapes(mood, FACE));

// The body's middle sits 9.6 above the feet; the head 10 above that; the kite's bottom point (its
// grip) 17 above the body.
const BODY_Y = 9.6;
const HEAD_AT = [3, -10];
const GRIP = [1, -17];

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (far) => ({ name: `foot${far ? 1 : 0}${tag}`, parent: 'bodyJ', s: PR.FOOT[i], pivot: [5, 1], at: () => [far ? -3 : 3, 3], rot: (S) => (S[far ? 'lF' : 'lN'] - S.tilt * 0.5) * D2R });
  return [
    { name: `tail${tag}`, parent: 'kite', s: PR.TAIL[i], pivot: [34, 2], rot: (S) => (S.tl - S.kr + S.tilt) * D2R, soft: { key: 'ktail', dir: [-30, 6], k: 50, c: 4, gain: 0.8, turn: 0.7, max: 30, flutter: 9, hz: 1.6 } },
    { name: `kiteP${tag}`, parent: 'kite', s: PR.KITE[i], pivot: [20, 40] },
    { name: `wing1${tag}`, parent: 'bodyJ', s: PR.WING[1][i], pivot: [4, 14], at: () => [-2, -5], rot: (S) => (S.wing - S.tilt * 0.4) * D2R },
    foot(true),
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [12, 7] },
    foot(false),
    { name: `head${tag}`, parent: 'headJ', s: PR.HEAD[i], pivot: [9, 10] },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => duckFace(MOODS.has(a.kdMood) ? a.kdMood : 'idle'), pivot: [9, 10] }] : []),
    { name: `wing0${tag}`, parent: 'bodyJ', s: PR.WING[0][i], pivot: [4, 14], at: () => [3.6, -5], rot: (S) => (S.wing - S.tilt * 0.4 - 4) * D2R },
  ];
};

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

export const kiteDuckRig = sized(makeRig({
  w: 92, h: 84, soft: true, stride: 26, recover: 0.6,
  springs: {
    x: [200, 16], lift: [120, 11], tilt: [150, 11], kr: [70, 6], hr: [160, 11], lN: [260, 14], lF: [260, 14], wing: [200, 14], tl: [80, 7],
  },
  fast: ['x', 'lift', 'tilt', 'lN', 'lF'],
  kick: { kr: 520, tilt: -160, hr: -200 },
  turnKick: { kr: -260, tilt: 120 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.83;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'kiteduck', 26);
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: bobbing on the wind; a gust lifting it up, feet kicking; a look down at its feet.
    const gust = hold(lu, 2.4, 3, 4, 4.8) * calm;
    const look = hold(lu, 6.2, 6.6, 7.6, 8) * calm;
    const bob = Math.sin(t * 2.2);
    const idle = {
      x: 0, lift: (bob + 1) * 1.5 + gust * 9, tilt: bob * 2, kr: Math.sin(t * 1.3) * 7 + gust * 6, hr: look * 22 + Math.sin(t * 1.1) * 3,
      lN: Math.sin(t * 3) * 10 + gust * Math.sin(t * 14) * 22, lF: Math.sin(t * 3 + 1.6) * 10 + gust * Math.sin(t * 14 + 2) * 22, wing: 0, tl: 0,
    };
    // Skipping along on the wind, a toe touching down each stride.
    const s = Math.sin(u * TAU);
    const walk = { x: 0, lift: Math.abs(s) * 6, tilt: 6, kr: 12 + s * 4, hr: -4, lN: 16 + s * 18, lF: 16 - s * 18, wing: -6, tl: 0 };
    // The kite climbs and rears back, feet tucked; then dives and it kicks with both feet.
    const antic = { x: -3, lift: 12, tilt: 10, kr: -22, hr: -8, lN: 60, lF: 50, wing: 4, tl: 0 };
    const strike = { x: 10, lift: 3, tilt: -26, kr: 34, hr: 10, lN: -70, lF: -60, wing: -8, tl: 0 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: the kite flops down behind it; the duckling sits in a heap.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -3.4, tilt: -6, kr: -96, hr: 14, lN: -80, lF: -66, wing: 40, tl: 0 });
    a.kdMood = m.hp <= 0 ? 'dizzy' : moodOf(a, gust > 0.5 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => HEAD_AT, rot: (S) => (S.hr - S.tilt * 0.3) * D2R },
    { name: 'kite', parent: 'bodyJ', at: () => GRIP, rot: (S) => (S.kr - S.tilt) * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a, S) {
    ctx.globalAlpha = a.alpha * clamp(0.22 - (S.lift ?? 0) * 0.008, 0.08, 0.22);
    ctx.fillStyle = '#2a4a7a';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 9, 2.4, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // Wind streaks past in the dive.
  fx(ctx, m, a) {
    if (m.hp <= 0 || !(a.ph.strike > 0.2)) return;
    const al = clamp(1 - (a.ph.since ?? 0) / 0.35, 0, 1) * a.ph.strike;
    ctx.save();
    ctx.globalAlpha = a.alpha * al * 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    for (const [y, l] of [[-34, 14], [-24, 18], [-14, 12]]) {
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-8, y);
      ctx.lineTo(-8 - l, y);
      ctx.stroke();
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): riding the wind.
export function kiteDuckStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y - 1.5;
  const head = [HEAD_AT[0], by + HEAD_AT[1]];
  const grip = [GRIP[0], by + GRIP[1]];
  const sh = [
    ...put(tailP(), [34, 2], grip[0], grip[1], 0), ...put(kiteP(), [20, 40], grip[0], grip[1], 4), ...put(wingP(true)(), [4, 14], -2, by - 5),
    ...put(footP(), [5, 1], -3, by + 3, 8), ...put(bodyP(), [12, 7], 0, by), ...put(footP(), [5, 1], 3, by + 3, -6),
    ...put(headP(), [9, 10], head[0], head[1]), ...put(faceShapes(fm, FACE), [9, 10], head[0], head[1]), ...put(wingP(false)(), [4, 14], 3.6, by - 5, -4),
  ];
  const ox = 34;
  const oy = 64;
  return { w: 60, h: 66, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
