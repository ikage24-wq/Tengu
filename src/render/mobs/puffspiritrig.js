// The Dandelion Puff, remade 2026-11-20 (the player's pick "Puff Spirit"): a floating dandelion
// clock of Petal Meadow, a ball of white seed fluff with little leaf arms and a curly stem tail, its
// small face in the middle. A flyer: drawn round its hover point. Live rig, outer outline only, the
// face bare, no squash.
//
// How it moves:
//   idle    a 9 s act: drifting on the breeze, the stem tail swaying; waving its leaf arms; a
//           seed comes loose and floats away; a big stretch.
//   walk    drifting along, leaning into the wind, the tail trailing.
//   fight   it puffs its cheeks, arms back; then blows, a spray of seeds flying at you.
//   hit     knocked back, a few seeds shaken loose.
//   dead    it droops and sinks, the arms limp, dizzy.
// Built in the concept's own units and drawn at K of them.

import { E, T, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, put, shift, MOODS, moodOf, arcP } from './rigkit.js';

const K = 0.6;
const LEAF = '#8fd07a';
const STEM = '#6ab05a';
const ps = pairOf('puffspr');

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
const at = (shapes, [px, py], [bx, by]) => shift(shapes, bx - px, by - py);
const ln = (pts, w, c) => [F(taper(pts, w, w * 0.85, c))];

// ---------- Parts ----------
// The puff: a ball of seed fluff, tufts all round, the seeds' fine stalks, a soft middle for the
// face. Box 36 x 36; its middle (18, 18) = (32, 30).
const ballP = () => at([
  E(32, 30, 15, 15, '#f4f6ff'), ...Array.from({ length: 22 }, (_, i) => E(32 + Math.cos((i / 22) * TAU) * 15, 30 + Math.sin((i / 22) * TAU) * 15, 2.6, 2.6, '#ffffff')),
  ...Array.from({ length: 11 }, (_, i) => {
    const a = (i / 11) * TAU + 0.2;
    return F(taper([[32 + Math.cos(a) * 6, 30 + Math.sin(a) * 6], [32 + Math.cos(a) * 12.6, 30 + Math.sin(a) * 12.6]], 0.4, 0.3, '#dde2f0'));
  }),
  F(E(32, 31, 7, 6.4, '#fffaf0')),
], [32, 30], [18, 18]);
// The curly stem tail with a leaf. Box 14 x 20; its root (6, 2) = (32, 44).
const stemP = () => at([taper([[32, 44], [33, 54], [30, 61]], 1.8, 1.4, STEM), blob([[33, 54], [39, 51], [37, 55]], LEAF)], [32, 44], [6, 2]);
// A leaf arm, reaching out of the fluff. Box 14 x 10; its root (12, 5) / (2, 5).
const armLP = () => [blob([[12, 5], [1, 3], [4, 9]], LEAF), ...ln([[11, 5], [3, 5.4]], 0.4, '#6ab05a')];
const armRP = () => [blob([[2, 5], [13, 3], [10, 9]], LEAF), ...ln([[3, 5], [11, 5.4]], 0.4, '#6ab05a')];
const PR = {
  BALL: ps('ball', 36, 36, ballP, 3, 3), STEM: ps('stem', 14, 20, stemP, 3, 3), ARML: ps('armL', 14, 10, armLP, 3, 3), ARMR: ps('armR', 14, 10, armRP, 3, 3),
};

// ---------- Its own face, small in the middle of the fluff: two black dot eyes, pink blush and a
// tiny "u" smile; to blow, its cheeks puff up round and its lips purse. ----------
const PDARK = '#2a2030';
const PEYES = [[15.2, 18, -1], [20.8, 18, 1]];
const puffFaceShapes = (mood) => {
  const out = [];
  const blow = mood === 'shout';
  for (const [x, y, s] of PEYES) {
    if (mood === 'blink' || mood === 'sleep' || mood === 'dead') out.push(...ln(arcP(x, y, 1.1, 0.7, 15, 165, 6), 0.45, PDARK));
    else if (mood === 'happy') out.push(...ln(arcP(x, y + 0.7, 1.1, 1, 200, 340, 6), 0.5, PDARK));
    else if (mood === 'hurt' || blow) out.push(...ln([[x + s * 1, y - 0.8], [x - s * 0.8, y], [x + s * 1, y + 0.8]], 0.5, PDARK));
    else if (mood === 'dizzy') {
      const pts = [];
      for (let i = 0; i <= 9; i++) pts.push([x + Math.cos(i * 1 * s) * (0.1 + i * 0.1), y + Math.sin(i * 1 * s) * (0.1 + i * 0.1)]);
      out.push(...ln(pts, 0.35, PDARK));
    } else {
      out.push(F(E(x, y, 0.95, 1.2, PDARK)), F(E(x + 0.3, y - 0.4, 0.3, 0.3, '#ffffff')));
      if (mood === 'angry') out.push(...ln([[x + s * 1.3, y - 2.2], [x - s * 0.9, y - 1.5]], 0.45, PDARK));
    }
  }
  const [mx, my] = [18, 20.2];
  if (blow) out.push(F(E(13.6, 21, 2, 1.6, '#ffc0d0')), F(E(22.4, 21, 2, 1.6, '#ffc0d0')), F(E(mx + 0.6, my + 0.6, 0.85, 0.85, '#8a3040')), F(E(mx + 0.6, my + 0.6, 0.45, 0.45, '#5a2030')));
  else {
    if (mood !== 'dead') out.push(F(E(13, 20.6, 1.3, 0.7, '#ffc0d0')), F(E(23, 20.6, 1.3, 0.7, '#ffc0d0')));
    if (mood === 'happy') out.push(F(T(arcP(mx, my - 0.3, 1.1, 1, 0, 180, 6), '#8a3040')));
    else if (mood === 'angry') out.push(...ln([[mx - 0.8, my + 0.4], [mx, my - 0.1], [mx + 0.8, my + 0.4]], 0.4, '#8a3040'));
    else if (mood === 'hurt' || mood === 'dizzy') out.push(...ln([[mx - 0.9, my + 0.2], [mx - 0.3, my - 0.1], [mx + 0.3, my + 0.2], [mx + 0.9, my - 0.1]], 0.35, '#8a3040'));
    else if (mood === 'dead') out.push(F(E(mx, my + 0.2, 0.45, 0.5, '#8a3040')));
    else out.push(...ln(arcP(mx, my, 0.9, 0.7, 20, 160, 6), 0.4, '#8a3040'));
  }
  return out;
};
const puffFace = (mood) => faceSprite(`puffspr|face|${mood}`, 36, 36, () => puffFaceShapes(mood));

// The ball's middle floats 20 above its hover point; the arms and tail hang off it.
const BODY_Y = 20;
const STEM_AT = [0, 13];
const ARM_L = [-12, 10];
const ARM_R = [12, 10];

// (Flyers are always "moving" to the game: go by how far it really travelled.)
const flyGait = (m, a) => {
  const st = (a.mo.fly ??= { odo: m.odo ?? 0, w: 0, calm: 1, still: 9 });
  const v = Math.abs((m.odo ?? 0) - st.odo) / Math.max(a.dt, 1e-3);
  st.odo = m.odo ?? 0;
  const going = v > 6 ? 1 : 0;
  st.w += (going - st.w) * (1 - Math.exp(-a.dt * 4));
  st.still = going ? 0 : st.still + a.dt;
  const calm = !a.ph.atk && m.hp > 0 && (a.hurtAgo ?? 9) > 3 && st.still > 0.3 ? 1 : 0;
  st.calm += (calm - st.calm) * (1 - Math.exp(-a.dt * 3));
  a.walkW = st.w;
  a.calm = st.calm;
};

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `stem${tag}`, parent: 'bodyJ', s: PR.STEM[i], pivot: [6, 2], at: () => STEM_AT, rot: (S) => S.st * D2R, soft: { key: 'stem', dir: [0, 16], k: 60, c: 4, gain: 0.9, turn: 0.6, max: 40 } },
    { name: `armL${tag}`, parent: 'bodyJ', s: PR.ARML[i], pivot: [12, 5], at: () => ARM_L, rot: (S) => S.aL * D2R },
    { name: `armR${tag}`, parent: 'bodyJ', s: PR.ARMR[i], pivot: [2, 5], at: () => ARM_R, rot: (S) => S.aR * D2R },
    { name: `ball${tag}`, parent: 'bodyJ', s: PR.BALL[i], pivot: [18, 18] },
    ...(bare ? [{ name: 'face', parent: 'bodyJ', s: (a) => puffFace(MOODS.has(a.psMood) ? a.psMood : 'idle'), pivot: [18, 18] }] : []),
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
// A dandelion seed: a stalk and its fluffy umbrella, drawn live.
const seedAt = (ctx, x, y, rot, k, al) => {
  if (al <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = al;
  ctx.strokeStyle = '#c8c0a0';
  ctx.lineWidth = 0.6 * k;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(5 * k, 0);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.5 * k;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(5 * k, 0);
    ctx.lineTo(7.6 * k, (-2.4 + i * 1.2) * k);
    ctx.stroke();
  }
  ctx.restore();
};

export const puffSpiritRig = sized(makeRig({
  w: 80, h: 90, soft: true, stride: 24, recover: 0.6,
  springs: { x: [180, 15], lift: [140, 11], tilt: [150, 12], aL: [180, 11], aR: [180, 11], st: [90, 6] },
  fast: ['x', 'aL', 'aR'],
  kick: { tilt: -160, aL: 300, aR: -300, st: 200 },
  turnKick: { tilt: 110, st: 220 },
  pose(m, a) {
    flyGait(m, a);
    a.uidOff = (m.uid % 13) * 0.69;
    const t = a.t + a.uidOff;
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: waving its leaf arms; watching a loose seed float off; a big stretch.
    const wave = hold(lu, 0.8, 1.1, 2.6, 2.9) * calm;
    const watch = hold(lu, 4, 4.3, 5.8, 6.1) * calm;
    const stretch = hold(lu, 7, 7.4, 8, 8.4) * calm;
    const drift = Math.sin(t * 1.6);
    const idle = {
      x: drift * 1.2, lift: Math.sin(t * 2) * 1.6 + stretch * 1.4, tilt: drift * 5 - watch * 6,
      aL: -20 + wave * (40 + Math.sin(t * 10) * 18) + stretch * 70 + drift * 4, aR: 20 - wave * (40 + Math.sin(t * 10 + 1) * 18) - stretch * 70 - drift * 4, st: drift * 6,
    };
    // Drifting along, leaning into the wind.
    const walk = { x: 0, lift: Math.sin(t * 3) * 1.2, tilt: 8, aL: -40, aR: 30, st: -14 };
    // Cheeks puffed, arms back; then the blow.
    const antic = { x: -2, lift: 1, tilt: -10, aL: 30, aR: -30, st: 10 };
    const strike = { x: 3, lift: 0, tilt: 10, aL: -60, aR: 50, st: -16 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: drooping and sinking, the arms limp.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -10, tilt: 22, aL: -60, aR: 60, st: 20 });
    a.psMood = m.hp <= 0 ? 'dizzy' : moodOf(a, wave > 0.4 || stretch > 0.4 ? 'happy' : null);
    a.psWatch = watch;
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    ...pass(false),
    ...pass(true),
  ],
  // A seed floating off in its act; a spray of seeds as it blows; a few shaken loose by a hit.
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const B = mat('bodyJ');
    if (a.psWatch > 0.02) {
      const t = (a.t + (a.uidOff ?? 0)) % 9;
      const p = clamp((t - 3.8) / 2.6, 0, 1);
      const [x, y] = at2(B, 10 + p * 14, -14 - p * 18 + Math.sin(p * 9) * 2);
      seedAt(ctx, x, y, -1.2 + Math.sin(p * 6) * 0.4, 1, a.alpha * Math.min(1, (1 - p) * 3));
    }
    const since = a.ph.since ?? -1;
    if (since >= 0 && since < 0.6) {
      const p = since / 0.6;
      for (const [dy, sp, r] of [[-6, 1, -0.3], [0, 1.2, 0], [5, 0.9, 0.3], [-2, 0.7, -0.1]]) {
        const [x, y] = at2(B, 10 + p * 34 * sp, dy + p * dy * 0.8);
        seedAt(ctx, x, y, r, 1, a.alpha * (1 - p));
      }
    }
    if ((a.hurtAgo ?? 9) < 0.7) {
      const p = (a.hurtAgo ?? 9) / 0.7;
      for (const [dx, dy, r] of [[-10, -10, -2], [8, -12, -1]]) {
        const [x, y] = at2(B, dx - p * 6, dy - p * 10);
        seedAt(ctx, x, y, r, 0.9, a.alpha * (1 - p));
      }
    }
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): drifting.
export function puffSpiritStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const sh = [
    ...put(stemP(), [6, 2], STEM_AT[0], by + STEM_AT[1]), ...put(armLP(), [12, 5], ARM_L[0], by + ARM_L[1], -20), ...put(armRP(), [2, 5], ARM_R[0], by + ARM_R[1], 20),
    ...put(ballP(), [18, 18], 0, by), ...put(puffFaceShapes(fm), [18, 18], 0, by),
  ];
  const ox = 18;
  const oy = 34;
  return { w: 36, h: 38, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
