// Madame Marionette (redrawn 2026-11-19, the player's pick "A, the Marionette Ballerina"): a
// wooden doll ballerina who is a marionette herself: ball joints at her elbows, wrists and knees,
// painted rosy cheeks, a dark bun with a pink bow, a pink bodice and a short two-layer tutu, pink
// pointe shoes. Her strings rise to a control cross floating over her head (it tilts and bobs as
// it works her), and from her fingers two little dancers dangle on their own strings (fewer as she
// cuts them loose: m.mech.puppets).
//
// How she moves:
//   idle    a 10 s act: port de bras, swaying; an arabesque; a révérence (curtsy); the dancers
//           swinging under her hands.
//   walk    a bourrée: up on pointe, tiny quick steps.
//   fight   (world/carnival.js) a plain swing is a whip of her strings; the yank (m.yankAt,
//           2.6 s) arms reaching out at her mark, then hauled back; cutting a puppet loose
//           (m.cutAt) a snip at the string; down, she drops like a puppet whose strings are cut.

import { E, T, F, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, taper, pairOf, faceSprite, hold, window1, stepPhase, pawStep, put, shift, MOODS, moodOf, sparkle } from './rigkit.js';
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

const WOOD = ramp('#ecd0a8', { step: 8, turn: 8 });
const JOINT = '#c89868';
const PINK = ramp('#ff8ab8', { step: 8, turn: 8 });
const TUTU = ramp('#ffb4d4', { step: 7, turn: 8 });
const HAIR = ramp('#7a4a2a', { step: 8, turn: 8 });
const BAR = ramp('#8a5a3a', { step: 8, turn: 8 });
const STRING = '#f6f0ff';
const ma = pairOf('ma2');

// ---------- The pieces (each facing right) ----------
// Her head: wood, a dark bun with a pink bow on top, bangs. Box 40 x 46; the neck at (20, 42),
// the head's middle at (20, 26).
const headP = () => [
  E(20, 10, 6.4, 5.6, HAIR.base), F(E(18.6, 8.4, 2.4, 1.4, HAIR.hi)), blob([[14, 7], [8, 3], [8.6, 11]], PINK.base, 1), blob([[26, 7], [32, 3], [31.4, 11]], PINK.base, 1), E(20, 7.4, 2, 2, PINK.sh),
  E(20, 26, 14, 14, WOOD.base), crescent(20, 26, 14, 14, WOOD.sh, { k: 0.15, a0: 110, a1: 220 }),
  blob([[7, 23], [10, 15.4], [20, 12.4], [30, 15.4], [33, 23], [27, 19.6], [20, 21], [13, 19.6]], HAIR.base, 2), F(taper([[12, 17], [19, 14.4]], 1, 0.6, HAIR.hi)),
];
// Her own face, painted on the wood: glossy brown painted eyes with two dabs of light and three painted
// lashes, thin painted brows, round red cheeks and a puppet's jaw (two seams down from her mouth corners);
// her jaw drops open to shout or laugh and her carved lids clack shut to blink. Box 40 x 46.
const oLn = (pts, w, c = INK) => {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = ((-(by - ay) / d) * w) / 2;
    const ny = (((bx - ax) / d) * w) / 2;
    l.push([x + nx, y + ny]);
    r.push([x - nx, y - ny]);
  });
  return [F(T([...l, ...r.reverse()], c))];
};
const oArc = (cx, cy, rx, ry, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
const oRing = (cx, cy, rx, ry, rot = 0, n = 16) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  const x = Math.cos(a) * rx;
  const y = Math.sin(a) * ry;
  return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
});
const oCut = (pts, lid) => pts.map(([px, py]) => [px, Math.max(py, lid(px))]);
const oSquint = (x, y, s, r, w, c = INK) => oLn([[x + s * r, y - r], [x - s * r * 0.8, y], [x + s * r, y + r]], w, c);
const oSpiral = (x, y, r, w, c, s = 1) => oLn(Array.from({ length: 15 }, (_, i) => [x + Math.cos(i * 0.8 * s) * r * (0.12 + i / 15), y + Math.sin(i * 0.8 * s) * r * (0.12 + i / 15)]), w, c);
const oDrop = (x, y, r, c = '#9ad8ff') => [F(E(x, y, r * 0.7, r, c)), F(E(x - r * 0.2, y - r * 0.3, r * 0.25, r * 0.25, '#ffffff'))];
const oStar = (x, y, r, c, n = 5, k = 0.45) => F(T(Array.from({ length: n * 2 }, (_, i) => {
  const a = (i * Math.PI) / n - Math.PI / 2;
  const rr = i % 2 ? r * k : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c));
const oX = (x, y, w, h, wd, c = INK) => [...oLn([[x - w * 0.7, y - h * 0.55], [x + w * 0.7, y + h * 0.55]], wd, c), ...oLn([[x - w * 0.7, y + h * 0.55], [x + w * 0.7, y - h * 0.55]], wd, c)];
const oWave = (mx, my, hw, wd, c = INK) => oLn(Array.from({ length: 5 }, (_, i) => [mx - hw + (i * hw) / 2, my + (i % 2 ? -0.3 : 0.3)]), wd, c);
const MA_EYES = [[25.2, 26.8, 1, 3.2, 4], [15.8, 27.2, -1, 2.8, 3.6]];
const MA_PAINT = '#4a2a1e';
const MA_LIPS = '#e0506a';
const maOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of MA_EYES) {
    const inner = mood === 'angry' ? 1.1 : mood === 'hurt' ? -0.9 : 0;
    const lift = mood === 'shout' || mood === 'happy' ? -0.6 : 0;
    out.push(...oLn([[x - s * w * 0.95, y - h * 1.3 + lift + inner], [x + s * w * 0.2, y - h * 1.5 + lift], [x + s * w * 1, y - h * 1.34 + lift - inner * 0.3]], 0.6, HAIR.base));
    if (mood === 'blink' || mood === 'sleep') {
      // The carved lids clack shut: a wooden lid, its edge and painted lashes.
      const ring = oRing(x, y, w * 1.02, h * 1.02);
      out.push(F(T(ring, WOOD.sh)), ...oLn([...ring, ring[0]], 0.35, JOINT), ...oLn(oArc(x, y + h * 0.15, w * 0.95, h * 0.45, 10, 170, 8), 0.75, MA_PAINT), ...oLn([[x + s * w * 0.9, y + h * 0.3], [x + s * w * 1.4, y + h * 0.75]], 0.55, MA_PAINT));
    } else if (mood === 'happy') out.push(...oLn(oArc(x, y + h * 0.35, w, h * 0.7, 200, 340, 8), 0.95, MA_PAINT), ...oLn([[x + s * w * 0.95, y + h * 0.05], [x + s * w * 1.45, y - h * 0.3]], 0.55, MA_PAINT));
    else if (mood === 'dizzy') out.push(...oSpiral(x, y, w, 0.7, MA_PAINT, s));
    else if (mood === 'dead') out.push(...oX(x, y, w, h, 0.75, MA_PAINT));
    else {
      // Painted wide open; the carved lid comes down to glare, and sticks half-shut when she's knocked.
      const lid = mood === 'angry' ? (px) => y - h * 0.3 + (px - x) * -s * 0.5 : mood === 'hurt' && s > 0 ? () => y - h * 0.05 : () => -99;
      out.push(F(T(oRing(x, y, w * 1.02, h * 1.02), WOOD.sh)));
      out.push(F(T(oCut(oRing(x, y, w, h), lid), MA_PAINT)), F(T(oCut(oRing(x, y + h * 0.15, w * 0.78, h * 0.78), lid), '#7a4a32')), F(T(oCut(oRing(x, y + h * 0.5, w * 0.55, h * 0.32), lid), '#a8704a')));
      if (mood === 'shout') out.push(F(T(oCut(oRing(x, y + h * 0.15, w * 0.3, h * 0.32), lid), MA_PAINT)));
      out.push(F(T(oCut(oRing(x + w * 0.3, y - h * 0.3, w * 0.3, h * 0.3, 0, 10), lid), '#ffffff')), F(T(oCut(oRing(x - w * 0.35, y + h * 0.35, w * 0.15, w * 0.15, 0, 8), lid), '#ffffff')));
      out.push(...oLn(oCut(oArc(x, y, w * 1.02, h * 1.02, 190, 350, 10), (px) => lid(px) - 0.2), 0.7, MA_PAINT));
      for (const [t, l] of [[-28, 1.5], [-52, 1.3], [-76, 1.05]]) {
        const a = ((s > 0 ? t : 180 - t) * Math.PI) / 180;
        const [px, py] = [x + Math.cos(a) * w, y + Math.sin(a) * h];
        if (py >= lid(px) - 0.1) out.push(...oLn([[px, py], [px + Math.cos(a) * l, py + Math.sin(a) * l]], 0.55, MA_PAINT));
      }
    }
  }
  // Round painted cheeks.
  if (mood !== 'dead') for (const [bx, by, r] of [[27.4, 31.6, 1.7], [13.4, 31.8, 1.45]]) out.push(F(E(bx, by, r, r, '#ff7a96')), F(E(bx - r * 0.3, by - r * 0.35, r * 0.28, r * 0.24, '#ffc4d0')));
  // The puppet jaw: two seams down to the chin; the jaw drops to open her mouth.
  const [mx, my] = [21.4, 33.8];
  const jw = 2.2;
  const drop = mood === 'shout' ? 2.2 : mood === 'happy' ? 1.4 : mood === 'dead' ? 1 : 0;
  if (drop > 0) {
    out.push(F(T([[mx - jw, my - 0.3], [mx + jw, my - 0.3], [mx + jw, my + drop], [mx - jw, my + drop]], '#4a2028')));
    if (mood !== 'dead') out.push(F(T(oArc(mx, my + drop, jw * 0.6, 0.6, 180, 360, 6), '#ff8a9a')));
  }
  out.push(...oLn([[mx - jw, my - 0.6], [mx - jw * 0.92, 38.6]], 0.45, JOINT), ...oLn([[mx + jw, my - 0.6], [mx + jw * 0.92, 38.6]], 0.45, JOINT));
  if (mood === 'happy') out.push(...oLn([[mx - jw - 0.7, my - 1.1], [mx - jw, my - 0.3]], 0.5, MA_LIPS), ...oLn([[mx + jw + 0.7, my - 1.1], [mx + jw, my - 0.3]], 0.5, MA_LIPS));
  else if (mood === 'angry') out.push(...oLn([[mx - jw, my - 0.2], [mx + jw, my - 0.2]], 0.6, MA_LIPS));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my - 0.3, jw, 0.5, MA_LIPS));
  else if (drop === 0) out.push(...oLn(oArc(mx, my - 1.2, jw * 1.08, 1.5, 25, 155, 6), 0.65, MA_LIPS));
  return out;
};
const maFace = (mood) => faceSprite(`ma2|face|${mood}`, 40, 46, () => maOwnFace(mood));
// The bodice: pink, a lace edge, a little bow. Box 22 x 24; bodyJ (her waist) at (11, 22).
const bodiceP = () => [
  blob([[3, 3], [19, 3], [18, 14], [16, 23], [6, 23], [4, 14]], PINK.base, 2), crescent(11, 14, 8, 10, PINK.sh, { k: 0.2, a0: 100, a1: 200 }),
  F(taper([[4, 4], [11, 5.4], [18, 4]], 1.6, 1.6, '#ffffff')), blob([[9, 8], [7, 6], [7, 10]], '#ffffff', 0), blob([[13, 8], [15, 6], [15, 10]], '#ffffff', 0), F(E(11, 8, 1, 1, '#ffffff')),
];
// The tutu, in two layers, a short flared disc round her hips. Box 40 x 12; the waist at (20, 3).
const tutuP = (front) => () => front
  ? [blob([[6, 2], [34, 2], [39, 7], [32, 10], [20, 11], [8, 10], [1, 7]], TUTU.base, 2), ...[8, 14, 20, 26, 32].flatMap((x) => line([[x, 4], [x + (x - 20) * 0.2, 9.4]], 0.5, TUTU.sh))]
  : [blob([[4, 1], [36, 1], [40, 6], [30, 9], [10, 9], [0, 6]], TUTU.sh, 2)];
// Legs: wood, a ball at the knee; pink pointe shoes with ribbons up the ankle.
const thighP = (far) => () => [taper([[4, 2], [4, 10.6]], 6, 5.4, far ? WOOD.sh : WOOD.base), E(4, 10.6, 3, 3, JOINT)];
const shinP = (far) => () => [E(4, 2, 3, 3, JOINT), taper([[4, 2], [4, 10]], 5.2, 4.4, far ? WOOD.sh : WOOD.base)];
const shoeP = (far) => () => [blob([[1, 0.4], [7, 0.4], [6.4, 6], [5.4, 8.6], [2.6, 8.6], [1.6, 6]], far ? PINK.sh : PINK.base, 1), ...line([[1.4, 1.4], [6.6, 3.4]], 0.5, '#ffffff'), ...line([[6.6, 1.4], [1.4, 3.4]], 0.5, '#ffffff'), F(taper([[2.6, 8.2], [5.4, 8.2]], 0.8, 0.8, PINK.deep))];
// Arms: wood, a ball at the elbow and wrist, a little wooden hand. Upper: box 11 x 7 at (2, 3.5);
// fore: box 14 x 8 at (2, 4).
const upP = (far) => () => [taper([[2, 3.5], [8.4, 3.5]], 4.8, 4.2, far ? WOOD.sh : WOOD.base), E(8.4, 3.5, 2.4, 2.4, JOINT)];
const foreP = (far) => () => [taper([[2, 4], [8, 4]], 4.2, 3.6, far ? WOOD.sh : WOOD.base), E(8.4, 4, 1.7, 1.7, JOINT), E(11, 4, 2.6, 2.2, far ? WOOD.sh : WOOD.base)];
// The control cross over her head: two bars, a gold knob. Box 40 x 14; its middle at (20, 7).
const crossP = () => [taper([[2, 7], [38, 7]], 2.8, 2.8, BAR.base), taper([[20, 1], [20, 13]], 2.6, 2.6, BAR.base), E(20, 7, 2.2, 2.2, '#ffd36b'), E(2, 7, 1.8, 1.8, BAR.sh), E(38, 7, 1.8, 1.8, BAR.sh)];
// A little dancer on her string: the string, a head with a bun, a tutu, legs. Box 16 x 32; the
// string's top at (8, 9) (a short string, 2026-11-19: on a long one their feet went through the floor).
const dancerP = (c) => () => [
  ...line([[8, 9], [8, 13]], 0.45, STRING),
  taper([[6.6, 23], [6.2, 30]], 1.6, 1.2, '#f0d8c0'), taper([[9.4, 23], [9.8, 30]], 1.6, 1.2, '#f0d8c0'), E(6.2, 30.4, 1.2, 0.8, c), E(9.8, 30.4, 1.2, 0.8, c),
  blob([[2, 23], [14, 23], [11, 18], [5, 18]], c, 1), T([[5.6, 18.4], [10.4, 18.4], [9.6, 15.6], [6.4, 15.6]], '#ffe8da'),
  E(8, 13.4, 3.2, 3.2, '#ffe8da'), F(E(8, 10.6, 2.4, 1.4, '#8a5a3a')), F(E(9.2, 13.6, 0.5, 0.5, INK)), F(E(7, 13.6, 0.5, 0.5, INK)), F(E(10, 14.8, 0.8, 0.5, '#ff9fb4')),
];

const SP = {
  HEAD: ma('head', 40, 46, headP, 2), BOD: ma('bodice', 22, 24, bodiceP, 2), TUTU: [false, true].map((f) => ma(`tutu${f ? 1 : 0}`, 40, 12, tutuP(f), 2)),
  THIGH: [false, true].map((f) => ma(`thigh${f ? 1 : 0}`, 8, 14, thighP(f), 2)), SHIN: [false, true].map((f) => ma(`shin${f ? 1 : 0}`, 8, 13, shinP(f), 2)), SHOE: [false, true].map((f) => ma(`shoe${f ? 1 : 0}`, 8, 10, shoeP(f), 2)),
  UP: [false, true].map((f) => ma(`up${f ? 1 : 0}`, 11, 7, upP(f), 2)), FORE: [false, true].map((f) => ma(`fore${f ? 1 : 0}`, 14, 8, foreP(f), 2)),
  CROSS: ma('cross', 40, 14, crossP, 2), DANCER: [['#9ad8f0'], ['#ffd36b']].map(([c], k) => ma(`dancer${k}`, 16, 32, dancerP(c), 2)),
};

// ---------- The skeleton ----------
const BODY_Y = 27;
const L1 = 9;
const L2 = 9;
const LEGS = chibiLegs({ bodyY: BODY_Y, l1: L1, l2: L2, sole: 8, hips: [[3.4, 2], [-3.4, 2]], feet: [4, -4], roll: 0 });
const FEET = [4, -4];
const SHN = [6, -16];
const SHF = [-6, -16];
const NECK = [0, -20];
const UA = 6.4;
const CROSS_Y = 102;
// How many dancers she still has on her strings.
const pups = (m) => m.mech?.puppets?.length ?? 2;
export const marionetteRig = makeRig({
  w: 120, h: 140, soft: true, stride: 1e9, recover: 0.6,
  springs: {
    x: [220, 16], lift: [200, 15], tilt: [170, 13], head: [140, 10], crossX: [120, 9], crossY: [120, 9], crossT: [110, 8],
    armN: [200, 14], elbN: [200, 14], armF: [200, 14], elbF: [200, 14],
    thighN: [300, 20], thighF: [300, 20], shinN: [300, 20], shinF: [300, 20], rollN: [300, 20], rollF: [300, 20],
  },
  fast: ['x', 'lift', 'armN', 'elbN', 'armF', 'elbF', 'thighN', 'thighF', 'shinN', 'shinF'],
  kick: { tilt: -120, head: -160, crossT: 140 },
  turnKick: { crossT: 160, head: 60 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const now = a.now;
    const u = stepPhase(m, a, 'ma2', 10);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    a.maPups = pups(m);
    const lu = fr(t / 10) * 10;
    const busy = active || walkW > 0.05 || m.cine || m.aggroUntil === Infinity;
    const arab = busy ? 0 : hold(lu, 3, 3.6, 5, 5.6);
    const rev = busy ? 0 : hold(lu, 7, 7.5, 8.4, 8.9);
    const br = Math.sin(t * 1.5);
    const pdb = Math.sin(t * 1.1);
    // Port de bras: the arms float, the cross working them from above.
    const liftI = 1 + br * 0.8 + arab * 2 - rev * 5;
    const tiltI = br * 2 + arab * 22 + rev * 10;
    const idle = {
      x: 0, lift: liftI, tilt: tiltI, head: -br * 3 - arab * 18 + rev * 14, crossX: pdb * 3 + arab * 6, crossY: br * 2, crossT: pdb * 10 - arab * 6,
      armN: 30 - pdb * 18 - arab * 40 + rev * 40, elbN: -30 + pdb * 10, armF: -100 + pdb * 16 + arab * 210 - rev * 40, elbF: -30 - pdb * 10 + arab * 20,
      ...LEGS.at(liftI, tiltI, [FEET[0] + arab * 1 + rev * 2, 0], [FEET[1] - arab * 20 - rev * 8, arab * 16]),
    };
    // The bourrée: up on pointe, tiny quick steps.
    const steps = [pawStep(u, 0, 10, 0.5, 2.4), pawStep(u, 0.5, 10, 0.5, 2.4)];
    const sw = Math.sin(u * TAU);
    const liftW = 2 + Math.abs(Math.cos(u * TAU)) * 0.8;
    const walk = {
      ...idle, lift: liftW, tilt: 2, head: -4, crossX: 2 + sw * 2, crossY: 0, crossT: sw * 6, armN: 20 + sw * 6, elbN: -20, armF: -120 - sw * 6, elbF: -20,
      ...LEGS.at(liftW, 2, [FEET[0] + steps[0][0], steps[0][1]], [FEET[1] + steps[1][0], steps[1][1]]),
    };
    // A whip of her strings: arms up and out, the cross reared back; then swept down ahead.
    const antic = { ...idle, x: -2, lift: 3, tilt: -10, head: -8, crossX: -6, crossY: 4, crossT: -24, armN: -60, elbN: -40, armF: -140, elbF: -20, ...LEGS.at(3, -10) };
    const strike = { ...idle, x: 6, lift: 0, tilt: 14, head: 8, crossX: 10, crossY: -4, crossT: 26, armN: 10, elbN: 0, armF: -20, elbF: 0, ...LEGS.at(0, 14, [FEET[0] + 6, 0], [FEET[1] - 3, 0]) };
    const S = stateBlend(a, idle, walk, antic, strike);
    const over = (P, w) => {
      if (w <= 0.001) return;
      for (const k of Object.keys(P)) S[k] += (P[k] - S[k]) * w;
    };
    // The yank: reaching out at her mark while the strings tighten, then hauled back.
    const yk = m.yankAt == null ? -1 : now - m.yankAt;
    if (yk >= 0 && yk < 3.2) {
      const reach = smooth(clamp(yk / 0.4, 0, 1)) * (yk < 2.5 ? 1 : 0);
      const haul = yk >= 2.5 ? 1 - smooth(clamp((yk - 2.8) / 0.4, 0, 1)) : 0;
      over({ tilt: 10, head: 4, crossX: 8, crossT: 14, armN: -10, elbN: 0, armF: -30, elbF: 0, ...LEGS.at(1, 10, [FEET[0] + 4, 0], [FEET[1] - 2, 0]) }, reach);
      over({ lift: 2, tilt: -16, head: -10, crossX: -8, crossY: 6, crossT: -30, armN: 120, elbN: -60, armF: 150, elbF: -40, ...LEGS.at(2, -16, [FEET[0] - 2, 0], [FEET[1] - 6, 0]) }, haul);
    }
    // Cutting a dancer loose: a snip at the string by her hand.
    const cut = window1(now, m.cutAt, 1.2, 0.15, 0.4);
    over({ head: 10, armN: 20, elbN: -100, armF: -30, elbF: -40, crossT: 10 }, cut);
    // Down: her strings cut, she drops in a heap.
    const down = m.hp <= 0 ? 1 : 0;
    if (down) over({ lift: -16, tilt: -14, head: 24, crossY: -20, crossT: 30, armN: 90, elbN: 30, armF: 120, elbF: 30, ...LEGS.at(-16, -14, [FEET[0] + 12, 3], [FEET[1] + 18, 3]) }, 1);
    a.maDown = down;
    a.maYank = yk >= 0 && yk < 2.6 ? clamp(yk / 2.6, 0, 1) : 0;
    a.maMood = down ? 'dead' : moodOf(a, yk >= 0 && yk < 3 ? 'angry' : cut > 0.3 ? 'angry' : arab > 0.4 || rev > 0.4 ? 'happy' : null);
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
    { name: 'handN', parent: 'foreN', at: () => [11, 0] },
    { name: 'handF', parent: 'foreF', at: () => [11, 0] },
    ...[0, 1].flatMap((pass) => {
      const i = pass;
      const tg = pass ? 'b' : '';
      const leg = (far) => {
        const k = far ? 'F' : 'N';
        const j = far ? 1 : 0;
        return [
          { name: `shoe${k}${tg}`, parent: `ankle${k}`, s: SP.SHOE[j][i], pivot: [4, 1], rot: (S) => -(S.tilt + S[`thigh${k}`] + S[`shin${k}`]) * D2R },
          { name: `shin${k}${tg}`, parent: `knee${k}`, s: SP.SHIN[j][i], pivot: [4, 2], rot: (S) => S[`shin${k}`] * D2R },
          { name: `thigh${k}${tg}`, parent: 'bodyJ', s: SP.THIGH[j][i], pivot: [4, 2], at: () => (far ? [-3.4, 2] : [3.4, 2]), rot: (S) => S[`thigh${k}`] * D2R },
        ];
      };
      const arm = (far) => {
        const k = far ? 'F' : 'N';
        const j = far ? 1 : 0;
        return [
          { name: `up${k}${tg}`, parent: 'bodyJ', s: SP.UP[j][i], pivot: [2, 3.5], at: () => (far ? SHF : SHN), rot: (S) => S[`arm${k}`] * D2R },
          { name: `fore${k}${tg}`, parent: `elbow${k}`, s: SP.FORE[j][i], pivot: [2, 4], rot: (S) => S[`elb${k}`] * D2R },
        ];
      };
      // (Each dancer hangs from a hand on its string, swinging as she moves.)
      const dancer = (far) => ({
        name: `dancer${far ? 'F' : 'N'}${tg}`, parent: far ? 'handF' : 'handN', s: SP.DANCER[far ? 0 : 1][i], pivot: [8, 9],
        rot: (S) => -(S.tilt + S[far ? 'armF' : 'armN'] + S[far ? 'elbF' : 'elbN']) * D2R,
        soft: { key: far ? 'dF' : 'dN', dir: [0, 20], k: 50, c: 3, gain: 0.9, turn: 0.9, hang: 0.9, max: 40 },
        when: (a) => !a.maDown && a.maPups >= (far ? 2 : 1),
      });
      return [
        { name: `cross${tg}`, parent: null, s: SP.CROSS[i], pivot: [20, 7], at: (S) => [S.x + S.crossX, -CROSS_Y - S.crossY], rot: (S) => S.crossT * D2R },
        dancer(true),
        ...arm(true),
        { name: `tutuB${tg}`, parent: 'bodyJ', s: SP.TUTU[0][i], pivot: [20, 3], at: () => [0, -2] },
        ...leg(true), ...leg(false),
        { name: `bodice${tg}`, parent: 'bodyJ', s: SP.BOD[i], pivot: [11, 22] },
        { name: `tutuF${tg}`, parent: 'bodyJ', s: SP.TUTU[1][i], pivot: [20, 3], at: () => [0, -1], soft: { key: 'tutu', dir: [0, 5], k: 120, c: 6, gain: 0.35, turn: 0.6, max: 10 } },
        { name: `head${tg}`, parent: 'headJ', s: SP.HEAD[i], pivot: [20, 42] },
        ...(pass ? [{ name: 'face', parent: 'headJ', s: (a) => maFace(a.maMood ?? 'idle'), pivot: [20, 42] }] : []),
        ...arm(false),
        dancer(false),
      ];
    }),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.2;
    ctx.fillStyle = '#2a1a2a';
    ctx.beginPath();
    ctx.ellipse(0, -0.6, 20, 3, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    // Her strings: from the cross's bars to her wrists and the top of her head (cut when she's
    // down: they hang loose from the cross).
    const C = mat('cross');
    const [lx, ly] = at2(C, -18, 0);
    const [rx, ry] = at2(C, 18, 0);
    const [cx, cy] = at2(C, 0, 6);
    const [fx, fy] = at2(mat('handF'), -2, 0);
    const [nx, ny] = at2(mat('handN'), -2, 0);
    const [hx, hy] = at2(mat('headJ'), 0, -34);
    ctx.globalAlpha = a.alpha * 0.85;
    ctx.strokeStyle = STRING;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    if (a.maDown) {
      for (const [x, y] of [[lx, ly], [rx, ry], [cx, cy]]) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.sin(a.now * 1.3 + x) * 2, y + 22);
      }
    } else {
      ctx.moveTo(lx, ly);
      ctx.lineTo(fx, fy);
      ctx.moveTo(rx, ry);
      ctx.lineTo(nx, ny);
      ctx.moveTo(cx, cy);
      ctx.lineTo(hx, hy);
    }
    ctx.stroke();
    if (a.maDown) return;
    // The whip of the strings: a lash curling out ahead.
    if (a.ph.strike > 0.15) {
      ctx.globalAlpha = a.alpha * a.ph.strike * 0.9;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.quadraticCurveTo(nx + 30, ny - 24 * a.ph.strike, nx + 60 * a.ph.strike, ny + 6);
      ctx.stroke();
      sparkle(ctx, a, nx + 60 * a.ph.strike, ny + 6, 4, a.ph.strike);
    }
    // The yank's strings glint as they tighten.
    if (a.maYank > 0.6) sparkle(ctx, a, nx + 4, ny - 2, 3, (a.maYank - 0.6) * 2.5);
    ctx.globalAlpha = a.alpha;
  },
});
// A still of her (for anywhere a sprite is wanted), her mood's face.
export function marionetteStill(pose, f, mood) {
  const by = -BODY_Y;
  const [nx, ny] = [NECK[0], by + NECK[1]];
  const Lg = LEGS.at(0, 0);
  const leg = (k, far) => {
    const [hx, hy] = far ? [-3.4, 2] : [3.4, 2];
    const th = Lg[`thigh${k}`];
    const sh = Lg[`shin${k}`];
    const kx = hx - Math.sin(th * D2R) * L1;
    const ky = by + hy + Math.cos(th * D2R) * L1;
    const ax = kx - Math.sin((th + sh) * D2R) * L2;
    const ay = ky + Math.cos((th + sh) * D2R) * L2;
    return [...put(thighP(far)(), [4, 2], hx, by + hy, th), ...put(shinP(far)(), [4, 2], kx, ky, th + sh), ...put(shoeP(far)(), [4, 1], ax, ay, 0)];
  };
  const arm = (far, a1, a2) => {
    const [sx, sy] = far ? SHF : SHN;
    const ex = sx + Math.cos(a1 * D2R) * UA;
    const ey = by + sy + Math.sin(a1 * D2R) * UA;
    return [...put(upP(far)(), [2, 3.5], sx, by + sy, a1), ...put(foreP(far)(), [2, 4], ex, ey, a1 + a2)];
  };
  return {
    w: 120,
    h: 140,
    res: 2,
    shapes: shift([
      ...put(crossP(), [20, 7], 0, -CROSS_Y), ...arm(true, -100, -30), ...put(tutuP(false)(), [20, 3], 0, by - 2), ...leg('F', true), ...leg('N', false),
      ...put(bodiceP(), [11, 22], 0, by), ...put(tutuP(true)(), [20, 3], 0, by - 1), ...put(headP(), [20, 42], nx, ny),
      ...put(maOwnFace(MOODS.has(mood) ? mood : 'idle'), [20, 42], nx, ny), ...arm(false, 30, -30),
    ], 60, 136),
  };
}
