// The Kettle Tanuki, remade 2026-11-19 (the player's pick "Kettle Disguise"): a shape-shifter of the
// Tea Terraces' Kettle Steps (tanuki are). Standing about, it is an ordinary copper kettle, steaming
// from its spout; only the leaf on its lid and the striped tip of a tail give it away. On the move,
// in a fight or hurt, poof: out pop its head (the lid sitting on it like a hat), its feet, paws and
// tail, and the kettle trots about on little legs. Live rig, outer outline only, the face bare, no
// squash.
//
// How it moves:
//   still   (after standing a moment) it settles into a kettle: the head sinks inside under the lid,
//           the feet and paws tuck away; a 9 s act: steaming; the lid rattling; the tail-tip
//           twitching; the head peeking up just far enough for its eyes to show over the rim.
//   walk    revealed, it trots, the kettle rocking from foot to foot, the tail swinging.
//   fight   it leans back, the lid lifting and rattling, steam building; then charges in with a
//           burst of steam from the spout and under the lid.
//   hit     the lid jumps and rattles, the head ducks.
//   dead    it sits down hard, the lid popped off, dizzy.
// Built in the concept's own units and drawn at K of that; the feet at y 0.

import { E, T, R, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, arcP, pairOf, faceSprite, hold, stepPhase, pawStep, put, MOODS, moodOf, faceShapes, INK } from './rigkit.js';

const K = 0.85;
const COP = '#f0a060';
const COPD = '#c87444';
const COPL = '#ffd2a0';
const HANDLE = '#7a4a3a';
const LEAF = '#8fd07a';
const TFUR = '#d9a476';
const TFURD = '#b47e58';
const TMASK = '#8f6650';
const TCREAM = '#fff0dc';
const kd = pairOf('kdisg');

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
// The kettle's belly: copper, a shine, the band round its shoulder. Box 32 x 26; its middle (16, 13).
const potP = () => [E(16, 13, 15, 11.6, COP), F(E(11, 9, 5.6, 4.6, COPL)), F(R(1.4, 5.6, 29.2, 2.8, COPD)), F(E(16, 23.4, 10, 1.8, COPD))];
// The spout. Box 16 x 16; its root (2, 14) inside the belly.
const spoutP = () => [taper([[2, 14], [10, 7], [14, 2]], 5, 3, COPD)];
const SPOUT_TIP = [23.4, -14.6];
// The handle arching over the top, on its two posts. Box 34 x 18; the belly's middle at (17, 24).
const handleP = () => [taper(arcP(17, 14, 13, 13, 200, 340, 10), 2, 2, HANDLE), R(3, 12.4, 3, 4, HANDLE), R(28, 12.4, 3, 4, HANDLE)];
// The lid, with its knob and the leaf. Box 24 x 18; the middle of its rim at (12, 16).
const lidP = () => [
  blob([[2, 14.4], [12, 8.4], [22, 14.4], [20, 16], [4, 16]], COP), F(E(8.4, 12.6, 2.6, 1, COPL)), E(12, 8.6, 2.2, 1.8, COPD),
  T([[13, 7], [18, 1.4], [16, 7.4]], LEAF), F(taper([[13.4, 6.8], [17, 2.8]], 0.5, 0.4, '#5aa84a')),
];
// The head: round ears, the dark mask, the cream muzzle and nose. Box 26 x 24; its middle (13, 13).
const headP = () => [
  E(6.6, 6.4, 3.4, 3.2, TFURD), E(19.4, 6.4, 3.4, 3.2, TFUR), F(E(6.6, 6.4, 1.7, 1.5, TMASK)), F(E(19.4, 6.4, 1.7, 1.5, TMASK)),
  E(13, 13, 8.6, 7.8, TFUR), F(E(9.4, 13.4, 3.2, 2.6, TMASK)), F(E(17, 13.4, 3.2, 2.6, TMASK)), F(E(13.6, 17.4, 4.2, 2.8, TCREAM)), F(E(14, 16, 1.2, 0.9, INK)),
];
// The tail, striped. Box 14 x 14; its root (12, 12).
const tailP = () => [taper([[12, 12], [6, 9], [3, 3]], 6, 4.2, TFUR), F(taper([[8.6, 10.4], [7.4, 9.6]], 4.4, 4.2, TMASK)), F(taper([[4.6, 6], [3.8, 4.6]], 3.8, 3.4, TMASK))];
// A leg: a stub of fur and a round foot. Box 10 x 10; the hip (5, 1).
const legP = (far) => () => [R(2.6, 0, 4.8, 5, far ? TFURD : TFUR), E(5, 6, 3.6, 3.2, far ? TFURD : TFUR)];
// A paw on a stubby arm reaching round the belly. Box 10 x 8; the shoulder (2, 4).
const armP = (far) => () => [taper([[2, 4], [6, 4.4]], 3.4, 3.2, far ? TFURD : TFUR), E(6.6, 4.4, 3, 3, far ? TFURD : TFUR)];
const PR = {
  POT: kd('pot', 32, 26, potP, 3), SPOUT: kd('spout', 16, 16, spoutP, 3, 3), HANDLE: kd('handle', 34, 18, handleP, 3), LID: kd('lid', 24, 18, lidP, 3),
  HEAD: kd('head', 26, 24, headP, 3), TAIL: kd('tail', 14, 14, tailP, 3, 3),
  LEG: [false, true].map((f) => kd(`leg${f ? 1 : 0}`, 10, 10, legP(f), 3)), ARM: [false, true].map((f) => kd(`arm${f ? 1 : 0}`, 10, 8, armP(f), 3)),
};
const FACE = { eyes: [[9.6, 13.2, 1.8, 2.4, -1], [17.2, 13.2, 1.8, 2.4, 1]], mouth: [14, 18.4, 1.8], blush: [[6.6, 16.4, 1.4], [20.4, 16.4, 1.4]], iris: '#5a3a2a', lid: 0, lashes: 0 };
const headFace = (mood) => faceSprite(`kdisg|face|${mood}`, 26, 24, () => faceShapes(mood, FACE));

// The belly's middle sits 11.6 up (on the floor) or 17.2 (stood up on its feet). The head's middle
// sits 1 below the belly's middle when hidden (its lid then sitting on the kettle's rim) and 18 above
// it when out.
const SIT = 11.6;
const LEGS = 5.6;
const HEAD_IN = 1;
const HEAD_OUT = -18;
const LID_ON = -6.4;

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const hidden = (a, S) => clamp(S.stand * 2.2, 0, 1);
  const leg = (far) => ({ name: `leg${far ? 1 : 0}${tag}`, parent: 'potJ', s: PR.LEG[far ? 1 : 0][i], pivot: [5, 1], alpha: hidden, at: (S) => [far ? -7 : 7, 8 - (1 - clamp(S.stand, 0, 1)) * 5 - S[far ? 'yF' : 'yN']], rot: (S) => (S[far ? 'lF' : 'lN'] - S.tilt) * D2R });
  const arm = (far) => ({ name: `arm${far ? 1 : 0}${tag}`, parent: 'potJ', s: PR.ARM[far ? 1 : 0][i], pivot: [2, 4], alpha: (a, S) => clamp(S.rev * 2.2 - 0.6, 0, 1), at: (S) => [far ? -11 : 11, -1 + (1 - clamp(S.rev, 0, 1)) * 3], rot: (S) => (far ? 180 - S.aF : S.aN) * D2R });
  return [
    { name: `tail${tag}`, parent: 'potJ', s: PR.TAIL[i], pivot: [12, 12], at: () => [-11, 7], rot: (S) => S.tail * D2R },
    leg(true),
    arm(true),
    // (The handle is part of the disguise: it goes in the poof as the head pops out, or it would stick
    // out either side of the head like a pair of droopy ears.)
    { name: `handle${tag}`, parent: 'potJ', s: PR.HANDLE[i], pivot: [17, 24], alpha: (a, S) => 1 - clamp((S.rev - 0.76) * 5, 0, 1) },
    { name: `spout${tag}`, parent: 'potJ', s: PR.SPOUT[i], pivot: [2, 14], at: () => [9, -1] },
    { name: `head${tag}`, parent: 'headJ', s: PR.HEAD[i], pivot: [13, 13], alpha: (a, S) => clamp(S.rev * 6, 0, 1) },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => headFace(MOODS.has(a.kdMood) ? a.kdMood : 'idle'), pivot: [13, 13], alpha: (a, S) => clamp(S.rev * 6, 0, 1) }] : []),
    leg(false),
    { name: `pot${tag}`, parent: 'potJ', s: PR.POT[i], pivot: [16, 13] },
    { name: `lid${tag}`, parent: 'lidJ', s: PR.LID[i], pivot: [12, 16] },
    arm(false),
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
// A little cloud of steam: a few white puffs with a soft grey rim.
const cloud = (ctx, a, x, y, r, al) => {
  if (al <= 0.02 || r <= 0.3) return;
  ctx.globalAlpha = a.alpha * al;
  for (const [ox, oy, k] of [[0, 0, 1], [r * 0.8, -r * 0.7, 0.8], [-r * 0.7, -r * 0.6, 0.7]]) {
    ctx.fillStyle = '#dfe6f0';
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, r * k + 0.7, 0, TAU);
    ctx.fill();
  }
  for (const [ox, oy, k] of [[0, 0, 1], [r * 0.8, -r * 0.7, 0.8], [-r * 0.7, -r * 0.6, 0.7]]) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, r * k, 0, TAU);
    ctx.fill();
  }
};

export const kettleDisguiseRig = sized(makeRig({
  w: 76, h: 76, soft: true, stride: 16, recover: 0.6,
  springs: {
    x: [240, 18], lift: [300, 18], tilt: [200, 13], rev: [190, 13], stand: [190, 13], hx: [200, 14], hy: [240, 15], hr: [180, 12],
    lidY: [420, 12], lidR: [380, 10], lidX: [200, 14], lN: [360, 22], lF: [360, 22], yN: [400, 24], yF: [400, 24], aN: [220, 14], aF: [220, 14], tail: [120, 9],
  },
  fast: ['x', 'lN', 'lF', 'yN', 'yF'],
  kick: { tilt: -140, lidY: 160, lidR: 420, hy: 60, hr: -200 },
  turnKick: { tilt: 120, tail: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 1.07;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'kdisg', 16);
    // Out or in: out the moment it moves, fights or is hurt; back into a kettle only once it has
    // stood still a little while (so a pause between steps never sets it popping in and out).
    const ks = (a.mo.kd ??= { still: 0, out: 1, flipAt: -9 });
    const busy = m.hp <= 0 || (a.calm ?? 1) < 0.5;
    ks.still = busy ? 0 : ks.still + a.dt;
    const out = busy ? 1 : ks.still > 1.4 ? 0 : ks.out;
    if (out !== ks.out) {
      ks.out = out;
      ks.flipAt = a.now;
    }
    const calm = (1 - out) * (a.calm ?? 1);
    const lu = t % 9;
    // Its act as a kettle: the lid rattling (a puff from under it); the tail-tip twitching; a peek.
    const rattle = hold(lu, 1.6, 1.8, 2.8, 3) * calm;
    const twitch = hold(lu, 4.4, 4.6, 5.2, 5.6) * calm;
    const peek = hold(lu, 6.4, 6.8, 7.8, 8.2) * calm;
    const br = Math.sin(t * 1.5);
    const idle = {
      x: 0, lift: 0, tilt: br * 0.6 * out, rev: out + peek * 0.72, stand: out, hx: 0, hy: br * 0.5 * out, hr: br * 3 * out,
      lidY: rattle * (1.2 + Math.sin(t * 38) * 1.2), lidR: rattle * Math.sin(t * 31) * 7, lidX: 0,
      lN: 0, lF: 0, yN: 0, yF: 0, aN: 10 + br * 6, aF: 10 - br * 6, tail: -10 + br * 4 * out + twitch * Math.sin(t * 16) * 16,
    };
    // A trot, rocking from foot to foot.
    const s = Math.sin(u * TAU);
    const [dxN, upN] = pawStep(u, 0, 16, 0.55, 2.4);
    const [dxF, upF] = pawStep(u, 0.5, 16, 0.55, 2.4);
    const walk = {
      x: 0, lift: Math.abs(Math.cos(u * TAU)) * 1.4, tilt: 3 + s * 4, rev: 1, stand: 1, hx: 0.6, hy: -Math.abs(s) * 0.8, hr: -s * 4,
      lidY: Math.abs(s) * 0.8, lidR: -s * 5, lidX: 0, lN: -dxN * 3.2, lF: -dxF * 3.2, yN: upN, yF: upF, aN: 30 * s, aF: -30 * s, tail: -14 + s * 18,
    };
    // Steaming up (leaning back, the lid lifting and rattling), then the charge.
    const antic = {
      x: -3, lift: 0, tilt: -12, rev: 1, stand: 1, hx: -1, hy: 1.4, hr: -8,
      lidY: 4 + Math.sin(t * 40) * 1.6, lidR: Math.sin(t * 33) * 9, lidX: 0, lN: 10, lF: -6, yN: 0, yF: 0, aN: -40, aF: -40, tail: 10,
    };
    const strike = { x: 12, lift: 1.6, tilt: 14, rev: 1, stand: 1, hx: 1.6, hy: -0.6, hr: 8, lidY: 2.4, lidR: -10, lidX: 0, lN: -30, lF: 26, yN: 0, yF: 0, aN: 60, aF: 60, tail: -30 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: it sits down hard, the feet out; the lid popped off its head; dizzy.
    if (m.hp <= 0) Object.assign(S, { x: -2, lift: 0, tilt: -10, rev: 1, stand: 0, hx: -1, hy: 1, hr: 12, lidY: 12, lidR: 60, lidX: 7, lN: -70, lF: 66, yN: 0, yF: 0, aN: 70, aF: 70, tail: 10 });
    a.kdMood = m.hp <= 0 ? 'dizzy' : moodOf(a, peek > 0.4 ? 'happy' : null);
    a.kdOut = out;
    return S;
  },
  parts: [
    { name: 'potJ', parent: null, at: (S) => [S.x, -SIT - LEGS * S.stand - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'potJ', at: (S) => [S.hx * clamp(S.rev, 0, 1), HEAD_IN + (HEAD_OUT - HEAD_IN) * S.rev + S.hy * clamp(S.rev, 0, 1)], rot: (S) => S.hr * clamp(S.rev, 0, 1) * D2R },
    { name: 'lidJ', parent: 'headJ', at: (S) => [S.lidX, LID_ON - S.lidY], rot: (S) => S.lidR * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.2;
    ctx.fillStyle = '#4a3020';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 14, 3, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // Steam: a thread of little clouds rising from the spout (thicker as it steams up for a charge); a
  // gust from the spout and under the lid as it charges; and the poof as it pops out or tucks away.
  fx(ctx, m, a, S, mat) {
    const t = a.now + (m.uid % 7);
    const P = mat('potJ');
    const [sx, sy] = at2(P, SPOUT_TIP[0], SPOUT_TIP[1]);
    const heat = m.hp > 0 ? Math.max(a.ph.antic, a.ph.strike) : 0;
    ctx.save();
    for (let k = 0; k < 3; k++) {
      const q = (t * (0.5 + heat * 0.8) + k / 3) % 1;
      cloud(ctx, a, sx + q * 6 + Math.sin(q * 6 + k) * 1.4, sy - q * 16, 1.4 + q * 2.4 + heat * 1.4, (1 - q) * (0.55 + heat * 0.4) * (m.hp > 0 ? 1 : 0.3));
    }
    // The charge's gust: clouds blown out of the spout and puffing out round the lid.
    if (a.ph.strike > 0.05 && m.hp > 0) {
      const q = clamp((a.ph.since ?? 0) / 0.6, 0, 1);
      for (let k = 0; k < 4; k++) cloud(ctx, a, sx + 4 + q * 16 + k * 4, sy - 2 - k * 2 - q * 6, 2.2 + q * 3 - k * 0.3, (1 - q) * 0.9);
      const [lx, ly] = at2(mat('lidJ'), 0, 0);
      cloud(ctx, a, lx - 10 - q * 8, ly - q * 6, 2.4 + q * 2.4, (1 - q) * 0.8);
      cloud(ctx, a, lx + 10 + q * 6, ly - 2 - q * 6, 2.2 + q * 2.4, (1 - q) * 0.8);
    }
    // The poof: a ring of clouds round it as it pops out or tucks back in.
    const ks = a.mo.kd;
    const since = ks ? a.now - ks.flipAt : 9;
    if (since >= 0 && since < 0.55) {
      const q = since / 0.55;
      const [cx, cy] = at2(P, 0, -4);
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * TAU + 0.4;
        cloud(ctx, a, cx + Math.cos(ang) * (12 + q * 10), cy + Math.sin(ang) * (9 + q * 7), 3 + q * 1.6, (1 - q) * 0.9);
      }
    }
    // A puff from under the rattling lid.
    if (a.mo.kd?.out === 0 && m.hp > 0) {
      const lu = (a.t + (a.uidOff ?? 0)) % 9;
      if (lu > 1.8 && lu < 3.4) {
        const q = (lu - 1.8) / 1.6;
        const [lx, ly] = at2(mat('lidJ'), 9, -2);
        cloud(ctx, a, lx + q * 4, ly - q * 10, 1.6 + q * 2, (1 - q) * 0.7);
      }
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): out, on its feet.
export function kettleDisguiseStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const ox = 26;
  const oy = 50;
  const sc = (shapes) => shapes.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.w != null && s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) }));
  const py = -SIT - LEGS;
  const hy = py + HEAD_OUT;
  return { w: 54, h: 54, res: 3, shapes: sc([
    ...put(tailP(), [12, 12], -11, py + 7, -10), ...put(legP(true)(), [5, 1], -7, py + 8), ...put(spoutP(), [2, 14], 9, py - 1),
    ...put(headP(), [13, 13], 0, hy), ...put(faceShapes(fm, FACE), [13, 13], 0, hy), ...put(legP(false)(), [5, 1], 7, py + 8),
    ...put(potP(), [16, 13], 0, py), ...put(lidP(), [12, 16], 0, hy + LID_ON), ...put(armP(false)(), [2, 4], 11, py - 1, 10),
  ]) };
}
