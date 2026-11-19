// The Grand Kettle (redrawn 2026-11-19, the player's pick "C, the Teapot Spirit"): the Tea Terraces'
// area boss, the oldest tanuki of all, who sat so long by the hearth he became the teapot: a round
// glazed pot with blue bands and dots, his face on its front, a spout out ahead and a handle
// behind, his lid for a hat, tanuki ears peeking up beside it, a striped tanuki tail, stubby legs
// in blue socks, one little glazed arm.
//
// How he moves:
//   idle    a 10 s act: rocking gently, steam curling off his spout; pouring a cup, tipped forward
//           and delighted; a little hop-dance.
//   walk    a rocking waddle on his stubby legs.
//   fight   his slam (m.special, world/mobs.js): as it winds up his lid rattles faster and faster
//           and steam puffs out; then a hop and down with a bump in a burst of steam.

import { E, T, F, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, puff } from './rigkit.js';
import { chibiLegs } from './chibilegs.js';

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
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

const GLAZE = ramp('#f4f0e8', { step: 7, turn: 8 });
const BLUE = ramp('#4a7ab8', { step: 8, turn: 8 });
const TAN = ramp('#b07a4a', { step: 9, turn: 10 });
const MASK = '#5a3a2a';
const tp = pairOf('tp2');

// ---------- The pieces (each facing right) ----------
// The pot: round, glazed, blue bands and dots, the spout out ahead, the handle behind. Box 76 x 52;
// its middle at (32, 26).
const potP = () => [
  taper(arcP(10, 26, 8, 12, 90, 270, 12), 3.6, 3.6, GLAZE.sh),
  taper([[50, 34], [58, 30], [64, 22], [68, 14]], 8, 4, GLAZE.base), E(68.6, 13, 3, 1.8, GLAZE.base), F(E(68.8, 12.6, 1.8, 1, BLUE.base)), F(taper([[53, 33], [62, 26]], 1, 0.8, GLAZE.sh)),
  E(32, 26, 24, 22, GLAZE.base), crescent(32, 26, 24, 22, GLAZE.sh, { k: 0.15, a0: 100, a1: 210 }),
  F(taper(arcP(32, 26, 23, 21, 200, 340, 12).map(([x, y]) => [x, y + 3]), 1.8, 1.8, BLUE.base)),
  ...[[14, 34, 2.4], [20, 44, 2], [44, 44, 2.2], [48, 36, 1.6]].map(([x, y, r]) => F(E(x, y, r, r * 0.85, BLUE.base))), F(E(24, 13, 5, 2, '#ffffff')),
];
const FACE = { eyes: [[38, 26, 3.4, 4.2, 1], [28.4, 26.4, 3, 3.8, -1]], mouth: [34, 33, 2.6], blush: [[40, 30.6, 2.4], [26.4, 31, 2]], iris: '#3a2a1a', k: 1.7, lid: 0, lashes: 0 };
const tpFace = (mood) => faceSprite(`tp2|face|${mood}`, 76, 52, () => faceShapes(mood, FACE));
// The lid: a low dome, a band, a blue knob. Box 36 x 16; its rim's middle at (18, 13).
const lidP = () => [E(18, 12, 16.4, 4.6, GLAZE.base), E(18, 8, 10.4, 4.4, GLAZE.base), F(taper([[3, 12], [33, 12]], 1.2, 1.2, BLUE.base)), E(18, 3.4, 3, 2.6, BLUE.base), F(E(17, 2.6, 1, 0.8, '#8ab0e0')), crescent(18, 10, 16, 6, GLAZE.sh, { k: 0.3, a0: 120, a1: 200 })];
// A tanuki ear peeking up by the lid. Box 10 x 11; rooted at (5, 10).
const earP = (far) => () => [E(5, 5.4, 4.2, 4.8, far ? TAN.sh : TAN.base), F(E(5, 5.8, 2.2, 2.6, MASK))];
// The tail: fluffy, two dark stripes. Box 22 x 18; rooted at (20, 4).
const tailP = () => [blob([[21, 3], [11, 1], [3, 8], [5, 16], [15, 12]], TAN.base, 2), ...[0, 1].map((k) => F(taper([[12 - k * 5, 3 + k * 2], [14 - k * 5, 11 + k * 2]], 2, 2, MASK)))];
// A stubby leg: glazed, a blue sock and foot.
const thighP = (far) => () => [taper([[4.5, 2], [4.5, 6]], 7.6, 7.2, far ? GLAZE.sh : GLAZE.base), E(4.5, 6, 3.6, 3.6, far ? GLAZE.sh : GLAZE.base)];
const shinP = (far) => () => [E(4.5, 2, 3.6, 3.6, far ? BLUE.sh : BLUE.base), taper([[4.5, 2], [4.5, 5.6]], 7.2, 7, far ? BLUE.sh : BLUE.base)];
const footP = (far) => () => [blob([[0.6, 0.4], [8, 0.4], [11, 3], [10.4, 5], [0.4, 5]], far ? BLUE.sh : BLUE.base, 1)];
// His little arm: glazed, a round hand. Box 14 x 8; the shoulder at (2, 4).
const armP = () => [taper([[2, 4], [9, 4]], 5.4, 5, GLAZE.sh), E(10.4, 4, 3.2, 3, GLAZE.base), F(E(10, 3.2, 1, 0.8, '#ffffff'))];

const SP = {
  POT: tp('pot', 76, 52, potP, 2), LID: tp('lid', 36, 16, lidP, 2), EAR: [false, true].map((f) => tp(`ear${f ? 1 : 0}`, 10, 11, earP(f), 2)), TAIL: tp('tail', 22, 18, tailP, 2),
  THIGH: [false, true].map((f) => tp(`thigh${f ? 1 : 0}`, 9, 10, thighP(f), 2)), SHIN: [false, true].map((f) => tp(`shin${f ? 1 : 0}`, 9, 9, shinP(f), 2)), FOOT: [false, true].map((f) => tp(`foot${f ? 1 : 0}`, 12, 6, footP(f), 2)),
  ARM: tp('arm', 14, 8, armP, 2),
};

// ---------- The skeleton ----------
const BODY_Y = 34;
const L1 = 5.4;
const L2 = 5.4;
const LEGS = chibiLegs({ bodyY: BODY_Y, l1: L1, l2: L2, sole: 4.6, hips: [[9, 18], [-9, 18]], feet: [10, -9] });
const FEET = [10, -9];
export const teapotRig = makeRig({
  w: 130, h: 110, soft: true, stride: 1e9, recover: 0.7,
  springs: { x: [200, 15], lift: [220, 15], tilt: [150, 11], lid: [300, 18], lidT: [260, 16], arm: [200, 14], thighN: [340, 21], thighF: [340, 21], shinN: [340, 21], shinF: [340, 21], rollN: [320, 20], rollF: [320, 20] },
  fast: ['x', 'lift', 'lid', 'lidT', 'thighN', 'thighF', 'shinN', 'shinF'],
  kick: { tilt: -100, lidT: 200 },
  turnKick: { tilt: -40 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.3;
    const t = a.t + a.uidOff;
    const now = a.now;
    const u = stepPhase(m, a, 'tp2', 14);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const warn = m.special?.warn > 0 ? 1 - m.special.warn / (m.def.special?.warn ?? 1.5) : 0;
    const lu = fr(t / 10) * 10;
    const busy = active || walkW > 0.05 || warn > 0 || m.cine || m.aggroUntil === Infinity;
    const pour = busy ? 0 : hold(lu, 3, 3.6, 5.2, 5.8);
    const dance = busy ? 0 : hold(lu, 7.4, 7.7, 9, 9.3);
    const rock = Math.sin(t * 1.3);
    const hop = dance * Math.abs(Math.sin(t * 7));
    const liftI = hop * 4;
    const tiltI = rock * 3 + pour * 22 + dance * Math.sin(t * 7) * 6;
    const idle = { x: 0, lift: liftI, tilt: tiltI, lid: Math.max(0, Math.sin(t * 1.6)) * 0.8, lidT: 0, arm: 70 - pour * 50 - dance * 110, ...LEGS.at(liftI, tiltI, [FEET[0] - pour * 2, hop * 2], [FEET[1], hop * 2]) };
    // The waddle: rocking from foot to foot.
    const steps = [pawStep(u, 0, 14, 0.6, 3), pawStep(u, 0.5, 14, 0.6, 3)];
    const sw = Math.sin(u * TAU);
    const liftW = Math.abs(Math.cos(u * TAU)) * 1.2;
    const tiltW = 3 + sw * 7;
    const walk = { ...idle, lift: liftW, tilt: tiltW, lid: 0, lidT: -sw * 4, arm: 60 + sw * 30, ...LEGS.at(liftW, tiltW, [FEET[0] + steps[0][0], steps[0][1]], [FEET[1] + steps[1][0], steps[1][1]]) };
    // The bump: a hop up, then down ahead.
    const antic = { ...idle, x: -2, lift: 12, tilt: -10, lid: 3, lidT: 10, arm: -60, ...LEGS.at(12, -10, [FEET[0], 6], [FEET[1], 6]) };
    const strike = { ...idle, x: 6, lift: -3, tilt: 16, lid: 6, lidT: -16, arm: 30, ...LEGS.at(-3, 16, [FEET[0] + 4, 0], [FEET[1] - 2, 0]) };
    const S = stateBlend(a, idle, walk, antic, strike);
    // The wind-up: crouching, the lid rattling faster and faster.
    if (warn > 0 && a.ph.antic < 0.05) {
      const f = 8 + warn * 30;
      Object.assign(S, { lid: S.lid + Math.abs(Math.sin(now * f)) * (1.4 + warn * 3), lidT: S.lidT + Math.sin(now * f * 1.3) * (4 + warn * 10) });
      const k = smooth(clamp(warn * 3, 0, 1));
      for (const [key, v] of Object.entries({ lift: -3, tilt: -4 + Math.sin(now * f * 0.5) * 2 * warn, arm: 100, ...LEGS.at(-3, -4) })) S[key] += (v - S[key]) * k;
    }
    // Down: tipped over, his lid knocked askew.
    if (m.hp <= 0) Object.assign(S, { lift: -6, tilt: -38, lid: 8, lidT: -40, arm: 140, ...LEGS.at(-6, -38, [FEET[0] + 12, 4], [FEET[1] + 6, 8]) });
    a.tpWarn = warn;
    a.tpBurst = a.ph.since >= 0.04 && a.ph.since < 0.8 ? 1 - (a.ph.since - 0.04) / 0.76 : 0;
    a.tpPour = pour;
    a.tpMood = m.hp <= 0 ? 'dizzy' : moodOf(a, warn > 0.3 ? 'angry' : pour > 0.4 || dance > 0.4 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'kneeN', parent: 'thighN', at: () => [0, L1] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, L1] },
    { name: 'ankleN', parent: 'shinN', at: () => [0, L2] },
    { name: 'ankleF', parent: 'shinF', at: () => [0, L2] },
    ...[0, 1].flatMap((pass) => {
      const i = pass;
      const tg = pass ? 'b' : '';
      const leg = (far) => {
        const k = far ? 'F' : 'N';
        const j = far ? 1 : 0;
        return [
          { name: `foot${k}${tg}`, parent: `ankle${k}`, s: SP.FOOT[j][i], pivot: [4, 1], rot: (S) => -(S.tilt + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
          { name: `shin${k}${tg}`, parent: `knee${k}`, s: SP.SHIN[j][i], pivot: [4.5, 2], rot: (S) => S[`shin${k}`] * D2R },
          { name: `thigh${k}${tg}`, parent: 'bodyJ', s: SP.THIGH[j][i], pivot: [4.5, 2], at: () => (far ? [-9, 18] : [9, 18]), rot: (S) => S[`thigh${k}`] * D2R },
        ];
      };
      return [
        { name: `tail${tg}`, parent: 'bodyJ', s: SP.TAIL[i], pivot: [20, 4], at: () => [-24, 8], soft: { key: 'tail', dir: [-10, 6], k: 90, c: 6, gain: 0.5, turn: 0.8, max: 22 } },
        ...leg(true), ...leg(false),
        { name: `earF${tg}`, parent: 'bodyJ', s: SP.EAR[1][i], pivot: [5, 10], at: () => [-13, -18], soft: { key: 'eF', dir: [0, -5], k: 170, c: 6, gain: 0.28, turn: 0.7, max: 24 } },
        { name: `earN${tg}`, parent: 'bodyJ', s: SP.EAR[0][i], pivot: [5, 10], at: () => [13, -19], soft: { key: 'eN', dir: [0, -5], k: 170, c: 6, gain: 0.28, turn: 0.7, max: 24 } },
        { name: `pot${tg}`, parent: 'bodyJ', s: SP.POT[i], pivot: [32, 26] },
        ...(pass ? [{ name: 'face', parent: 'bodyJ', s: (a) => tpFace(a.tpMood ?? 'idle'), pivot: [32, 26] }] : []),
        { name: `lid${tg}`, parent: 'bodyJ', s: SP.LID[i], pivot: [18, 13], at: (S) => [0, -19 - S.lid], rot: (S) => S.lidT * D2R },
        { name: `arm${tg}`, parent: 'bodyJ', s: SP.ARM[i], pivot: [2, 4], at: () => [18, 0], rot: (S) => S.arm * D2R },
      ];
    }),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.22;
    ctx.fillStyle = '#2a2a1a';
    ctx.beginPath();
    ctx.ellipse(0, -0.6, 26, 3.6, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const B = mat('bodyJ');
    // Steam curling off the spout; puffing hard as he winds up; a burst as he lands.
    const [sx, sy] = at2(B, 37, -14);
    const n = 2 + Math.round(a.tpWarn * 3 + a.tpPour * 2);
    for (let k = 0; k < n; k++) {
      const u = fr(a.now * (0.5 + a.tpWarn * 1.5) + k / n);
      puff(ctx, a, sx + u * 6 + Math.sin(u * 7 + k) * 3, sy - u * 22, 2 + u * 5, (1 - u) * (0.35 + a.tpWarn * 0.3), '255,255,255');
    }
    if (a.tpWarn > 0.2) {
      const [lx, ly] = at2(mat('lid'), 0, -6);
      for (let k = 0; k < 2; k++) puff(ctx, a, lx + (k ? 12 : -12), ly + 6, 3 + a.tpWarn * 3, a.tpWarn * 0.4, '255,255,255');
    }
    if (a.tpBurst > 0) for (let k = 0; k < 8; k++) {
      const q = (k / 8) * Math.PI;
      const r = 14 + (1 - a.tpBurst) * 34;
      puff(ctx, a, Math.cos(q) * r, -4 - Math.sin(q) * r * 0.35, 6 + (1 - a.tpBurst) * 6, a.tpBurst * 0.55, '255,255,255');
    }
  },
});
// A still of him (for anywhere a sprite is wanted), his mood's face.
export function teapotStill(pose, f, mood) {
  const by = -BODY_Y;
  const Lg = LEGS.at(0, 0);
  const leg = (k, far) => {
    const [hx, hy] = far ? [-9, 18] : [9, 18];
    const th = Lg[`thigh${k}`];
    const sh = Lg[`shin${k}`];
    const kx = hx - Math.sin(th * D2R) * L1;
    const ky = by + hy + Math.cos(th * D2R) * L1;
    const ax = kx - Math.sin((th + sh) * D2R) * L2;
    const ay = ky + Math.cos((th + sh) * D2R) * L2;
    return [...put(thighP(far)(), [4.5, 2], hx, by + hy, th), ...put(shinP(far)(), [4.5, 2], kx, ky, th + sh), ...put(footP(far)(), [4, 1], ax, ay, 0)];
  };
  return {
    w: 130,
    h: 110,
    res: 2,
    shapes: shift([
      ...put(tailP(), [20, 4], -24, by + 8), ...leg('F', true), ...leg('N', false), ...put(earP(true)(), [5, 10], -13, by - 18), ...put(earP(false)(), [5, 10], 13, by - 19),
      ...put(potP(), [32, 26], 0, by), ...put(faceShapes(MOODS.has(mood) ? mood : 'idle', FACE), [32, 26], 0, by), ...put(lidP(), [18, 13], 0, by - 19), ...put(armP(), [2, 4], 18, by, 70),
    ], 60, 106),
  };
}
