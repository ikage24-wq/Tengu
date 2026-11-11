// The Turnip Tot's live rig (Clover Hills' new cast, rebuilt from scratch 2026-11-11 at the
// player's ask: smooth, slow and soft, never stepping through drawn poses). It's a cutout puppet
// on the boss rig (rig.js): the bulb, its face (one drawing per mood), three leaves and two
// rootlet arms, each drawn once and placed every frame by a skeleton. The body's motion is a set
// of eased channels and the loose bits (the leaves and arms) hang on springs, so they trail the
// body, overshoot and settle: follow-through instead of drawings swapped. Nothing is squashed or
// stretched, and every part is filtered smoothly so a tilt never stair-steps its outline.
//
// How it moves:
//   idle    a slow breath (the bulb rising a hair), a gentle lean one way then the other, the
//           leaves drifting on their springs and the arms resting.
//   walk    a slow penguin sway from foot to foot (no legs: it rocks along on its round bottom),
//           a soft rise at each side, a little lean into where it's going, the arms swinging
//           against the sway and the leaves trailing it.
//   attack  it eases back with its arms up (the wind-up), then lunges in head first for a
//           headbutt; the springs carry the leaves through, and it settles back.
//   hit     a kick on its tilt spring: knocked back, it wobbles upright again.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, simpleMouth, blush as cheek, deadEye, tear, vein } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, makeRig, stateBlend, TAU } from './rig.js';
import { sprite } from '../pixel.js';

const TOP = ramp('#d79ae0', { step: 10, turn: 12, sat: -6 });
const CREAM = ramp('#fff4ea', { step: 6, turn: 30 });
const LEAF = ramp('#86d27a', { step: 10, turn: 16, sat: -8 });
const INK = '#4a2f4a';
const D2R = Math.PI / 180;

// The bulb: cream below with the purple top blushing down, a root tail, a few rootlet marks, lit
// on its upper left. Box 24 x 26, its foot (the root tail's base) at (12, 23).
const bulb = () => part('turnip|bulb', 24, 26, () => {
  const cx = 12;
  const cy = 13;
  const out = [];
  out.push(T([[cx - 1.6, 21], [cx + 0.4, 25.4], [cx + 1.6, 21]], CREAM.sh));
  out.push(E(cx, cy, 9.6, 9, CREAM.base));
  out.push(T([[cx - 9.6, cy - 0.6], [cx - 8.4, cy - 5.6], [cx - 4, cy - 8.8], [cx + 4, cy - 8.8], [cx + 8.4, cy - 5.6], [cx + 9.6, cy - 0.6], [cx + 5, cy + 1.6], [cx, cy + 0.6], [cx - 5, cy + 1.8]], TOP.base));
  out.push(crescent(cx, cy, 9.6, 9, TOP.sh, { k: 0.26, a0: 200, a1: 300 }), crescent(cx, cy, 9.6, 9, CREAM.sh, { k: 0.26, a0: 30, a1: 150 }), shine(cx, cy, 9.6, 9, '#ffffff', 0, 1.1));
  for (const [x, y] of [[cx - 5, cy + 4], [cx + 3, cy + 6], [cx + 6.4, cy + 2.4]]) out.push(F(T([[x, y], [x + 1.2, y + 0.4], [x + 0.2, y + 0.9]], CREAM.sh)));
  return out;
}, 4);

// The face, one drawing per look: eyes, cheeks, mouth, and the marks of the mood. Box 16 x 10,
// centred on (8, 5).
const FACE_MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout']);
// (Not outlined: a part's outline wraps its own silhouette, and on a face that's a dark ring round
// each eye and cheek. The body's outline frames it as on a whole-body drawing.)
const face = (mood) => sprite(`rig|turnip|face|${mood}`, () => ({ w: 16, h: 10, res: 2, soft: 'cel', crisp: true, bare: true, pad: 4, shapes: faceShapes(mood) }));
const faceShapes = (mood) => {
  const out = [];
  const ey = 4;
  if (mood === 'dead') out.push(...deadEye(5.4, ey, 1.2, { c: INK, th: 0.5 }), ...deadEye(10.4, ey, 1.4, { c: INK, th: 0.55 }));
  else {
    const em = mood === 'shout' ? 'angry' : mood;
    const so = { iris: mood === 'angry' || mood === 'shout' ? '#d0507a' : '#8a5a7a', ink: INK, lid: 0, mood: em };
    out.push(...simpleEye(5.4, ey, { ...so, s: -1, w: 1.6, h: 2.1 }), ...simpleEye(10.4, ey - 0.1, { ...so, s: 1, w: 1.9, h: 2.4 }));
    out.push(...cheek(3, ey + 2.6, 1.1, { on: CREAM.base }), ...cheek(13, ey + 2.6, 1.2, { on: CREAM.base }));
  }
  out.push(...simpleMouth(8, ey + 3, { k: 0.95, mood: mood === 'blink' ? 'idle' : mood, lip: INK }));
  if (mood === 'hurt') out.push(...tear(11.2, ey + 1.2, 0.8, { type: 'stream', len: 2.6 }));
  if (mood === 'angry') out.push(...vein(2, ey - 3, 0.7));
  return out;
};

// A leaf on its stalk, pointing straight up from its base at (5, 12) in a 10 x 12 box: a stalk,
// then a rounded leaf with a pale midrib. Three tones for the three leaves.
const leafPart = (k) => part(`turnip|leaf|${k}`, 10, 12, () => {
  const c = [LEAF.sh, LEAF.base, LEAF.hi][k];
  const len = k === 1 ? 8.4 : 7;
  const out = [...stroke([[5, 12], [5, 12 - len * 0.45]], 0.9, '#5fae5c')];
  const by = 12 - len * 0.4;
  out.push(T([[5, by], [5 - 2.6, by - len * 0.3], [5 - 2.2, by - len * 0.7], [5, by - len], [5 + 2.2, by - len * 0.7], [5 + 2.6, by - len * 0.3]], c));
  out.push(...stroke([[5, by - 0.4], [5, by - len * 0.8]], 0.45, LEAF.hi));
  return out;
}, 4);

// A rootlet arm hanging from its shoulder at (2, 1) in a 4 x 6 box: a little tapering root with a
// round end.
const arm = () => part('turnip|arm', 4, 6, () => [...stroke([[2, 1], [2, 4.6]], 1, CREAM.sh), E(2, 4.8, 1, 1, CREAM.sh)], 4);

// The face it wears: the mood, fierce while attacking, an open shout at the blow.
const faceOf = (a) => {
  if (a.face === 'dead') return 'dead';
  if (a.ph.strike > 0.4) return 'shout';
  if (a.ph.atk) return 'angry';
  return FACE_MOODS.has(a.face) ? a.face : 'idle';
};

// One soft hop every 0.8 s while it walks: cute and bouncy, never frantic.
const HOP = 0.8;

export const turnipRig = makeRig({
  w: 26,
  h: 34,
  soft: true,
  stride: 44,
  recover: 0.6,
  springs: {
    // The body tracks its hop closely (a soft arc, not a lag); the tilt and arms ease; the leaves
    // hang loose, so they overshoot and settle.
    lift: [420, 30],
    tilt: [150, 15],
    x: [120, 14],
    arms: [110, 10],
    leaf0: [55, 5],
    leaf1: [50, 4.6],
    leaf2: [55, 5],
  },
  fast: ['tilt', 'x', 'lift'],
  kick: { tilt: -260, leaf1: 300 },
  pose(m, a) {
    const t = a.t;
    // Idle: a breath, a gentle lean, and a happy little hop every couple of seconds.
    const ui = (t + (m.uid % 7) * 0.37) % 2.6;
    const hi = ui < 0.5 ? Math.sin((ui / 0.5) * Math.PI) : 0;
    const idle = { tilt: Math.sin(t * 0.8 + m.uid) * 3 + hi * 4, lift: (Math.sin(t * 1.5 + m.uid) + 1) * 0.35 + hi * 3.6, x: 0, arms: -hi * 40 + Math.sin(t * 1.1 + m.uid) * 5 };
    // Walk: a soft hop, one after another: up in an arc, leaning forward as it rises and back as
    // it lands, arms lifting with it.
    // (Timed by the clock, one hop every 0.8 s: it has no feet to slide, and it wanders so slowly
    // that a hop per stretch walked came round only every two seconds.)
    const h = ((t + (m.uid % 5) * 0.13) / HOP) % 1;
    a.hop = h;
    const arcU = Math.sin(Math.PI * h);
    const walk = { tilt: 3 + 9 * Math.cos(Math.PI * h), lift: Math.pow(arcU, 0.85) * 7, x: 0, arms: -arcU * 44 };
    // The headbutt: eased back with arms up, then a lunge in head first.
    const antic = { tilt: -16, lift: 0.4, x: -2.4, arms: -70 };
    const strike = { tilt: 22, lift: 1.6, x: 4.6, arms: 30 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  // The loose bits trail the body: the leaves lean against its tilt, flop back as it rises and
  // flick forward as it lands (springy, so they overshoot and settle); the arms follow theirs.
  follow(S, a) {
    const h = a.hop ?? 0;
    const flop = Math.cos(Math.PI * h) * 18 * a.walkW;
    return {
      leaf0: -S.tilt * 1.1 - 14 - flop,
      leaf1: -S.tilt * 1.2 - flop,
      leaf2: -S.tilt * 1.1 + 14 - flop,
      armL: S.arms,
      armR: -S.arms,
    };
  },
  parts: [
    { name: 'root', parent: null, at: (S) => [S.x, -S.lift], rot: (S) => S.tilt * D2R },
    { name: 'armL', parent: 'root', s: arm, pivot: [2, 1], at: () => [-8.6, -10], rot: (S) => (S.armL + 25) * D2R },
    { name: 'armR', parent: 'root', s: arm, pivot: [2, 1], at: () => [8.6, -10], rot: (S) => (S.armR - 25) * D2R },
    { name: 'leaf0', parent: 'root', s: () => leafPart(0), pivot: [5, 12], at: () => [-1.4, -19.6], rot: (S) => (S.leaf0 - 26) * D2R },
    { name: 'leaf2', parent: 'root', s: () => leafPart(2), pivot: [5, 12], at: () => [1.4, -19.6], rot: (S) => (S.leaf2 + 26) * D2R },
    { name: 'body', parent: 'root', s: bulb, pivot: [12, 23] },
    { name: 'leaf1', parent: 'root', s: () => leafPart(1), pivot: [5, 12], at: () => [0, -19.8], rot: (S) => S.leaf1 * D2R },
    { name: 'face', parent: 'root', s: (a) => face(faceOf(a)), pivot: [8, 5], at: () => [2.4, -10.4] },
  ],
});
export { TAU };
