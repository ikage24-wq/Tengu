// The Sky Pirate Gunner, remade 2026-11-20 (the player's pick "Seagull Gunner"): a plump seagull
// pirate in a red tricorn with a white feather and a navy sash, with a brass bell-mouthed
// blunderbuss. Live rig, outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    a 9 s act: on watch, looking out this way and that; a stretch of the wings with a little
//           hop; a tip of the hat.
//   walk    a rolling sailor's waddle, the gun on its shoulder of a wing.
//   fight   it shoulders the gun and takes aim; then fires: the kick hops it back, the gun jumps up,
//           its hat jumps on its head, a flash and a puff of smoke from the bell mouth.
//   hit     knocked back, the hat knocked askew.
//   dead    it sits down hard, the gun dropped across its lap, dizzy.
// Built in the concept's own units and drawn at K of them; the feet at y 0.

import { E, T, R, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, MOODS, moodOf, faceShapes } from './rigkit.js';

const K = 0.7;
const GULL = '#ffffff';
const GULLD = '#b9c4d6';
const LEGS = '#ffc84a';
const GOLD = '#f2c860';
const BRASS = '#e8b04a';
const HAT = '#e8584a';
const gg = pairOf('gullgun');

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
// A leg and a webbed foot. Box 10 x 10; the hip (5, 1).
const legP = () => [taper([[5, 1], [5, 4.4]], 1.6, 1.4, LEGS), T([[5, 3.6], [1.6, 8], [8.6, 8]], LEGS)];
// The body: plump and white, a grey tail, the navy sash with its gold buckle. Box 30 x 26; (17, 13).
const bodyP = () => [
  T([[7.5, 11.5], [-1.5, 15.5], [0.5, 9.5]], GULLD), blob([[8.5, 1.5], [24.5, 1.5], [27.5, 13.5], [22.5, 24.5], [11.5, 24.5], [6.5, 13.5]], GULL, 2),
  F(blob([[18.5, 7.5], [25.5, 7.5], [26.5, 15.5], [22.5, 22.5], [18.5, 17.5]], '#f4f6fb')), blob([[10.5, 8.5], [26.5, 4.5], [27.5, 6.9], [11.5, 11.5]], '#2c4a8a'), F(R(18.1, 6.1, 3, 3, GOLD)),
];
// The folded wing. Box 18 x 18; the shoulder (8, 2).
const wingP = () => [blob([[2, 2], [10, 1], [13, 10], [8, 16], [0, 11]], GULLD), F(T([[1, 10], [4, 15], [-2, 13]], '#8a96aa'))];
// The blunderbuss. Box 36 x 12; the grip (16, 6).
const gunP = () => [R(2, 4.4, 12, 3.2, '#9a6a44'), R(13, 4.2, 16, 3.6, BRASS), T([[28, 4], [33, 1.4], [33, 10.6], [28, 8]], BRASS), F(R(15, 4.8, 12, 0.8, '#fff0b0')), F(E(33, 6, 1, 4, '#8a5a2a'))];
const MUZZLE = [17, 0];
// The wing tip gripping the gun. Box 6 x 6; (3, 3).
const gripP = () => [E(3, 3, 3, 2.8, GULLD)];
// The head and beak. Box 34 x 26; its middle (13, 13).
const headP = () => [E(13, 13, 10, 9.4, GULL), blob([[20.6, 13.6], [31, 15], [31.6, 17], [21, 18]], '#ffbf3a'), F(E(29, 17.2, 1, 0.8, '#ff6a5a')), F(R(22, 15.8, 8, 0.6, '#d8962a'))];
// The tricorn, gold-trimmed, a white feather. Box 34 x 14, in the head's frame; its base (13, 7).
const hatP = () => [
  T([[-1, 8], [1.6, 2], [6, 4.4], [13, 0.4], [20, 4.4], [24.4, 2], [27, 8], [20, 6.6], [13, 7.4], [6, 6.6]], HAT), F(taper([[0.4, 7.4], [6, 5.6], [13, 6.4], [20, 5.6], [25.6, 7.4]], 1, 1, GOLD)),
  F(taper([[9, 3.6], [4, 2.6], [-0.6, 4.2], [-3, 6.4]], 2.2, 1, '#ffffff')),
];
const PR = {
  LEG: gg('leg', 10, 10, legP, 3), BODY: gg('body', 30, 26, bodyP, 3, 3), WING: gg('wing', 18, 18, wingP, 3, 3), GUN: gg('gun', 36, 12, gunP, 3, 3),
  GRIP: gg('grip', 6, 6, gripP, 3, 3), HEAD: gg('head', 34, 26, headP, 3, 3), HAT: gg('hat', 34, 14, hatP, 3, 3),
};
const FACE = { eyes: [[15.4, 12.4, 1.8, 2.3, -1], [21, 12.4, 1.6, 2.1, 1]], mouth: [24.6, 19.2, 0.1], blush: [[12.6, 16, 1.2]], iris: '#3a2a2a', lid: 0, lashes: 0 };
const gullFace = (mood) => faceSprite(`gullgun|face|${mood}`, 34, 26, () => faceShapes(mood, FACE));

// The body's middle sits 17.3 above the feet; the head 21.5 above that, a little forward.
const BODY_Y = 17.3;
const HEAD_AT = [1.5, -21.5];
const GUN_AT = [5.5, 0.5];

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (far) => ({ name: `leg${far ? 1 : 0}${tag}`, parent: 'bodyJ', s: PR.LEG[i], pivot: [5, 1], at: (S) => [far ? -3.5 : 4.5, 10.1 - S[far ? 'yF' : 'yN']], rot: (S) => (S[far ? 'lF' : 'lN'] - S.tilt) * D2R });
  return [
    leg(true),
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [17, 13] },
    leg(false),
    { name: `head${tag}`, parent: 'headJ', s: PR.HEAD[i], pivot: [13, 13] },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => gullFace(MOODS.has(a.ggMood) ? a.ggMood : 'idle'), pivot: [13, 13] }] : []),
    { name: `hat${tag}`, parent: 'hatJ', s: PR.HAT[i], pivot: [13, 7] },
    { name: `wing${tag}`, parent: 'bodyJ', s: PR.WING[i], pivot: [8, 2], at: () => [-4.5, -7.5], rot: (S) => S.wing * D2R },
    { name: `gun${tag}`, parent: 'gunJ', s: PR.GUN[i], pivot: [16, 6] },
    { name: `grip${tag}`, parent: 'gunJ', s: PR.GRIP[i], pivot: [3, 3], at: () => [-3, -1] },
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
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

export const gullGunnerRig = sized(makeRig({
  w: 100, h: 84, soft: true, stride: 22, recover: 0.7,
  springs: {
    x: [240, 18], lift: [300, 16], tilt: [180, 12], hr: [160, 11], hat: [140, 7], lN: [340, 21], lF: [340, 21], yN: [400, 24], yF: [400, 24],
    aim: [220, 13], rc: [400, 18], wing: [200, 13],
  },
  fast: ['x', 'lift', 'lN', 'lF', 'yN', 'yF', 'aim', 'rc'],
  kick: { tilt: -150, hat: -420, hr: -160 },
  turnKick: { tilt: 100, hat: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.89;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'gullgun', 22);
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: on watch, looking out; a stretch of the wings with a little hop; a tip of the hat.
    const look = Math.sin(t * 0.7);
    const stretch = hold(lu, 3, 3.3, 3.9, 4.3) * calm;
    const tip = hold(lu, 6.4, 6.7, 7.5, 7.9) * calm;
    const br = Math.sin(t * 1.6);
    const idle = {
      x: 0, lift: (br + 1) * 0.3 + stretch * Math.max(0, Math.sin((lu - 3) * 6)) * 3, tilt: br * 1.2, hr: look * 10 * (1 - tip) - tip * 8, hat: -tip * 24,
      lN: 0, lF: 0, yN: 0, yF: 0, aim: -4 + br * 1.5, rc: 0, wing: stretch * -40 + tip * -20,
    };
    // A rolling sailor's waddle.
    const s = Math.sin(u * TAU);
    const [dxN, upN] = pawStep(u, 0, 22, 0.6, 2.2);
    const [dxF, upF] = pawStep(u, 0.5, 22, 0.6, 2.2);
    const walk = {
      x: 0, lift: Math.abs(Math.cos(u * TAU)) * 1.4, tilt: s * 6, hr: -s * 4, hat: s * 6, lN: -dxN * 3, lF: -dxF * 3, yN: upN, yF: upF, aim: -8 + s * 4, rc: 0, wing: 0,
    };
    // Shouldered and aimed; then the shot, the kick hopping it back.
    const antic = { x: -1, lift: -0.6, tilt: 5, hr: -4, hat: 0, lN: 6, lF: -6, yN: 0, yF: 0, aim: -2, rc: 1, wing: 4 };
    const strike = { x: -5, lift: 3, tilt: -12, hr: -8, hat: 24, lN: -18, lF: 14, yN: 1.4, yF: 0, aim: -18, rc: 3.4, wing: -8 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: sat down hard, the gun across its lap.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -3, tilt: -16, hr: 10, hat: -30, lN: -60, lF: 56, yN: 0, yF: 0, aim: 30, rc: 0, wing: 20 });
    a.ggMood = m.hp <= 0 ? 'dizzy' : moodOf(a, stretch > 0.5 || tip > 0.5 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => HEAD_AT, rot: (S) => (S.hr - S.tilt * 0.4) * D2R },
    { name: 'hatJ', parent: 'headJ', at: () => [0, -6], rot: (S) => S.hat * D2R },
    { name: 'gunJ', parent: 'bodyJ', at: (S) => [GUN_AT[0] - S.rc, GUN_AT[1]], rot: (S) => S.aim * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.2;
    ctx.fillStyle = '#2a4a7a';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 12, 2.8, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // The shot: a flash at the bell mouth, then a puff of smoke rolling up out of it.
  fx(ctx, m, a, S, mat) {
    const since = a.ph.since ?? -1;
    if (m.hp <= 0 || since < 0 || since > 1) return;
    const [mx, my] = at2(mat('gunJ'), MUZZLE[0] + 1, MUZZLE[1]);
    ctx.save();
    if (since < 0.14) {
      const q = since / 0.14;
      ctx.globalAlpha = a.alpha * (1 - q);
      ctx.fillStyle = '#fff0a0';
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * TAU;
        const r = 4 + q * 6 + (k % 2) * 2.4;
        ctx.fillStyle = k % 2 ? '#ffe36b' : '#fff6c8';
        ctx.beginPath();
        ctx.ellipse(mx + 4 + Math.cos(ang) * r, my + Math.sin(ang) * r, 3.2, 1.2, ang, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mx + 4, my, 3.6 * (1 - q * 0.5), 0, TAU);
      ctx.fill();
    }
    const q = clamp(since / 0.9, 0, 1);
    for (let k = 0; k < 3; k++) {
      const x = mx + 4 + q * 8 + k * 3;
      const y = my - 1 - q * (8 + k * 3) - k * 2;
      const r = 2.2 + q * 3 - k * 0.4;
      ctx.globalAlpha = a.alpha * (1 - q) * 0.85;
      ctx.fillStyle = '#dfe6f0';
      ctx.beginPath();
      ctx.arc(x, y, r + 0.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): on watch.
export function gullGunnerStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const head = [HEAD_AT[0], by + HEAD_AT[1]];
  const gun = [GUN_AT[0], by + GUN_AT[1]];
  const sh = [
    ...put(legP(), [5, 1], -3.5, by + 10.1), ...put(bodyP(), [17, 13], 0, by), ...put(legP(), [5, 1], 4.5, by + 10.1),
    ...put(headP(), [13, 13], head[0], head[1]), ...put(faceShapes(fm, FACE), [13, 13], head[0], head[1]), ...put(hatP(), [13, 7], head[0], head[1] - 6),
    ...put(wingP(), [8, 2], -4.5, by - 7.5), ...put(gunP(), [16, 6], gun[0], gun[1], -4), ...put(gripP(), [3, 3], gun[0] - 3, gun[1] - 1),
  ];
  const ox = 22;
  const oy = 46;
  return { w: 50, h: 50, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
