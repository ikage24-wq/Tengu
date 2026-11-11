// The Chickling (Clover Hills' new cast, 2026-11-11: replaced the Kitchen Brownie), built like the
// Turnip Tot as a live puppet on the boss rig (rig.js): every part drawn once and placed each
// frame, the loose bits on springs, nothing squashed, every part filtered smoothly.
//
// A round fluffy yellow chick still wearing half its eggshell like a hat, a little tuft of fluff,
// a tiny wing, an orange beak and little orange feet.
//   idle    a breath and a little fluff of its wing; every few seconds it tips forward and pecks
//           at the ground, its eggshell hat wobbling.
//   walk    a quick waddle, its feet pattering, its whole body bobbing forward with each step
//           (a chicken's head-bob), the hat and tuft wobbling on their springs.
//   attack  it rears back, wing up, then lunges in with a peck, beak open.
//   hit     knocked back on its tilt spring, hat askew, and it rights itself.
// `chickStill(pose, f, mood)` gives the still pictures (portraits, galleries) from the same parts.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, blush as cheek, deadEye, tear, vein } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, makeRig, stateBlend } from './rig.js';
import { sprite } from '../pixel.js';

const FUZZ = ramp('#ffe27a', { step: 9, turn: 14, sat: -4 });
const BELLY = '#fff4b8';
const BEAK = ramp('#ffaa4a', { step: 10, turn: 10 });
const SHELL = ramp('#fffaf0', { step: 6, turn: 30 });
const INK = '#4a3020';
const D2R = Math.PI / 180;

// ---------- The parts' shapes (each in its own box, drawn about its own origin) ----------

// The body: a fluffy round ball, a pale belly, fluff tufts round the rim, lit on its upper left.
// Centre (12, 12) in a 24 x 24 box; it stands on (12, 23).
const bodyShapes = () => {
  const out = [E(12, 12, 10.4, 10, FUZZ.base)];
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * 0.95 + (i / 8) * Math.PI * 1.1;
    out.push(E(12 + Math.cos(a) * 9.6, 12 + Math.sin(a) * 9.2, 2, 1.7, FUZZ.base));
  }
  out.push(E(14, 16, 6.6, 5.4, BELLY), crescent(12, 12, 10.4, 10, FUZZ.sh, { k: 0.24, a0: 40, a1: 170 }), shine(12, 12, 10.4, 10, '#ffffff', 0, 1.1));
  return out;
};
// The face on the front: two eyes (the near one bigger), cheeks. 14 x 10, centred (7, 5).
const faceShapes = (mood) => {
  const out = [];
  if (mood === 'dead') out.push(...deadEye(4.6, 4, 1.1, { c: INK, th: 0.5 }), ...deadEye(9.4, 4, 1.3, { c: INK, th: 0.55 }));
  else {
    const em = mood === 'shout' ? 'angry' : mood;
    const so = { iris: '#3a2418', ink: INK, lid: 0, mood: em };
    out.push(...simpleEye(4.6, 4, { ...so, s: -1, w: 1.4, h: 1.9 }), ...simpleEye(9.4, 3.9, { ...so, s: 1, w: 1.7, h: 2.2 }));
    out.push(...cheek(2.4, 6.6, 1.1, { on: FUZZ.base }), ...cheek(11.6, 6.6, 1.2, { on: FUZZ.base }));
  }
  if (mood === 'hurt') out.push(...tear(10.4, 5.6, 0.8, { type: 'stream', len: 2.4 }));
  if (mood === 'angry') out.push(...vein(1.4, 0.6, 0.7));
  return out;
};
// The beak, from its base at (0.6, 2.5) in a 7 x 5 box: closed, or open for a peck or a cheep.
const beakShapes = (open) => open
  ? [T([[0.6, 1.2], [5.4, 1.6], [0.6, 2.4]], BEAK.base), T([[0.6, 2.8], [4.6, 3.8], [0.6, 3.8]], BEAK.sh), F(E(1.2, 2.6, 0.7, 0.5, '#c0505a'))]
  : [T([[0.6, 1.4], [5.6, 2.6], [0.6, 3.6]], BEAK.base), F(T([[0.6, 2.6], [5.6, 2.6], [0.6, 3.6]], BEAK.sh))];
// The near wing, hanging from its shoulder at (6, 1) in an 8 x 7 box: a little rounded wing with
// two feather tips.
const WING = '#f6cf5e';
const wingShapes = () => [E(4, 3.6, 3.8, 3, WING), T([[0.6, 4.4], [-0.8, 6.4], [2.2, 5.6]], WING), T([[2.4, 5.8], [1.8, 7.6], [4, 6.2]], WING), F(E(4.6, 2.6, 2.2, 1.2, FUZZ.base))];
// A foot from its ankle at (2.5, 0) in a 5 x 3 box: a stubby leg and three toes.
const footShapes = () => [...stroke([[2.5, 0], [2.5, 1.6]], 0.9, BEAK.sh), T([[0.4, 2.8], [2.5, 1.4], [4.8, 2.8], [3.4, 3], [2.5, 2.4], [1.6, 3]], BEAK.base)];
// The tuft of fluff on its crown, from its root at (4, 6) in an 8 x 6 box: three little curls.
const tuftShapes = () => [E(2.6, 2.6, 1.4, 2.2, FUZZ.base), E(4.4, 1.6, 1.5, 2.6, FUZZ.hi), E(6, 2.8, 1.3, 2, FUZZ.base), E(4, 5, 2.6, 1.4, FUZZ.base)];
// Half an eggshell worn as a hat, from its middle-bottom at (7, 7) in a 14 x 7 box: a dome with a
// zigzag broken rim, lit on top, a speckle or two.
const shellShapes = () => {
  const rim = [];
  for (let i = 0; i <= 8; i++) rim.push([1 + i * 1.5, 6.4 - (i % 2 ? 1.6 : 0)]);
  return [T([[1, 6.4], [1.6, 3.2], [4, 1], [7, 0.4], [10, 1], [12.4, 3.2], [13, 6.4], ...rim.reverse()], SHELL.base), crescent(7, 4.4, 6, 4, SHELL.sh, { k: 0.3, a0: 0, a1: 90 }), F(E(5, 2.2, 2, 0.9, '#ffffff')), F(E(9.4, 3.4, 0.6, 0.5, '#e8d8c4')), F(E(4, 4.4, 0.5, 0.4, '#e8d8c4'))];
};

// ---------- The rig ----------

const bodyPart = () => part('chick|body', 24, 24, bodyShapes, 4);
const FACE_MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout']);
// (The face and beak sit on the body unoutlined: a part's own outline would ring each eye.)
const facePart = (mood) => sprite(`rig|chick|face|${mood}`, () => ({ w: 14, h: 10, res: 2, soft: 'cel', crisp: true, bare: true, pad: 4, shapes: faceShapes(mood) }));
const beakPart = (open) => part(`chick|beak|${open ? 1 : 0}`, 7, 5, () => beakShapes(open), 4);
const wingPart = () => part('chick|wing', 8, 8, wingShapes, 4);
const footPart = () => part('chick|foot', 5, 3, footShapes, 4);
const tuftPart = () => part('chick|tuft', 8, 6, tuftShapes, 4);
const shellPart = () => part('chick|shell', 14, 7, shellShapes, 4);

const faceOf = (a) => {
  if (a.face === 'dead') return 'dead';
  if (a.ph.strike > 0.4) return 'shout';
  if (a.ph.atk) return 'angry';
  return FACE_MOODS.has(a.face) ? a.face : 'idle';
};

// A waddle step every 0.42 s (two a cycle), timed by the clock: quick little steps, never frantic.
const STEP = 0.84;

export const chickRig = makeRig({
  w: 26,
  h: 34,
  soft: true,
  stride: 40,
  recover: 0.55,
  springs: {
    tilt: [170, 15],
    lift: [380, 28],
    x: [200, 18],
    wing: [120, 9],
    stepL: [300, 26],
    stepR: [300, 26],
    tuft: [70, 5.5],
    shell: [60, 5],
  },
  fast: ['tilt', 'x', 'lift'],
  kick: { tilt: -300, shell: 380 },
  pose(m, a) {
    const t = a.t;
    // Idle: a breath, a little wing fluff now and then, and every 3.4 s a peck at the ground.
    const u = (t + (m.uid % 7) * 0.41) % 3.4;
    const peck = u < 0.5 ? Math.sin((u / 0.5) * Math.PI) : 0;
    const fluff = u > 1.6 && u < 2 ? Math.sin(((u - 1.6) / 0.4) * Math.PI * 2) : 0;
    const idle = { tilt: peck * 30 + Math.sin(t * 0.9 + m.uid) * 1, lift: (Math.sin(t * 1.6 + m.uid) + 1) * 0.3, x: peck * 1.6, wing: fluff * 40, stepL: 0, stepR: 0 };
    // Walk: the waddle, a step a side, the body bobbing forward on each step.
    const p = ((t + (m.uid % 5) * 0.17) / STEP) * Math.PI * 2;
    const s = Math.sin(p);
    const bob = Math.abs(Math.sin(p));
    // (Only a little rock, the player's call: the cuteness is in a small hop on each step.)
    const walk = { tilt: s * 3 + bob * 2, lift: Math.pow(bob, 0.8) * 3.6, x: bob * 1.2 - 0.4, wing: -bob * 26, stepL: Math.max(0, s) * 2.6, stepR: Math.max(0, -s) * 2.6 };
    // The peck: reared back with the wing up, then lunged in, beak first.
    const antic = { tilt: -20, lift: 0.6, x: -2.4, wing: -60, stepL: 0, stepR: 0 };
    const strike = { tilt: 38, lift: 0.4, x: 5, wing: 30, stepL: 0, stepR: 1.4 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  // The hat and tuft trail the body: leaning against its tilt, overshooting and settling.
  follow(S) {
    return { tuft: -S.tilt * 1.3, shell: -S.tilt * 0.5 };
  },
  parts: [
    // The feet hang from the hips, which ride the body's hop and shift (never its tilt), so they
    // stay attached in every hop; each lifts a little on its own step.
    { name: 'hips', parent: null, at: (S) => [S.x * 0.6, -S.lift - 2.6] },
    { name: 'footL', parent: 'hips', s: footPart, pivot: [2.5, 0], at: (S) => [-3.4, -S.stepL] },
    { name: 'root', parent: null, at: (S) => [S.x, -S.lift - 2], rot: (S) => S.tilt * D2R },
    { name: 'tuft', parent: 'root', s: tuftPart, pivot: [4, 6], at: () => [0.6, -19.6], rot: (S) => S.tuft * D2R },
    { name: 'body', parent: 'root', s: bodyPart, pivot: [12, 22] },
    { name: 'wing', parent: 'root', s: wingPart, pivot: [6, 1], at: () => [-2.6, -12.4], rot: (S) => (S.wing - 10) * D2R },
    { name: 'face', parent: 'root', s: (a) => facePart(faceOf(a)), pivot: [7, 5], at: () => [3.6, -12.4] },
    { name: 'beak', parent: 'root', s: (a) => beakPart(faceOf(a) === 'shout'), pivot: [0.6, 2.5], at: () => [8.8, -10.6] },
    { name: 'shell', parent: 'root', s: shellPart, pivot: [7, 7], at: () => [-2.6, -18], rot: (S) => (S.shell - 14) * D2R },
    { name: 'footR', parent: 'hips', s: footPart, pivot: [2.5, 0], at: (S) => [3.2, -S.stepR] },
  ],
});

// The still pictures (portraits, galleries, anything that wants one frame): the parts laid out
// at rest, the face for the mood, the beak open at the peck.
const shift = (shapes, dx, dy) => shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: 0, y: 0, pts: s.pts.map(([x, y]) => [x + (s.x ?? 0) + dx, y + (s.y ?? 0) + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
export function chickStill(pose, f, mood) {
  const peck = pose === 'attack' && Math.floor(f) >= 1 && Math.floor(f) <= 2;
  const fm = mood === 'dead' ? 'dead' : peck ? 'shout' : FACE_MOODS.has(mood) ? mood : 'idle';
  const ox = 15;
  const oy = 29;
  return {
    w: 32,
    h: 32,
    res: 3,
    shapes: [
      ...shift(footShapes(), ox - 3.4 - 2.5, oy - 2.6),
      ...shift(tuftShapes(), ox + 0.6 - 4, oy - 2 - 19.6 - 6),
      ...shift(bodyShapes(), ox - 12, oy - 2 - 22),
      ...shift(wingShapes(), ox - 2.6 - 6, oy - 2 - 12.4 - 1),
      ...shift(faceShapes(fm), ox + 3.6 - 7, oy - 2 - 12.4 - 5),
      ...shift(beakShapes(fm === 'shout'), ox + 8.8 - 0.6, oy - 2 - 10.6 - 2.5),
      ...shift(shellShapes(), ox - 2.6 - 7, oy - 2 - 18 - 7),
      ...shift(footShapes(), ox + 3.2 - 2.5, oy - 2.6),
    ],
  };
}
