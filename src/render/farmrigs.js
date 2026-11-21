// Your island farm's animals (world/home.js FARM), redrawn 2026-11-21 as live puppets on the boss
// rig (render/mobs/rig.js), like the game's own creatures: every part drawn once as its own crisp
// cel-shaded sprite and placed each frame, the loose bits (crest, ears, lei, bell, tail) on springs
// so they trail and settle, only the outer edge outlined (rig.js outerOutline), each with its own
// face. Nothing squashed or stretched: all motion is parts turning and moving, smooth with a light
// bounce. The island look the player picked:
//
//   hen    a round golden hen with a teal-and-pink crest and a fan of tail feathers. Walks with a
//          waddle and a real chicken's head-bob (the head holds still, then snaps forward); looks
//          about with quick tilts, pecks at the sand, ruffles her feathers; a cluck now and then;
//          sleeps settled on the sand, her head tucked down into her chest.
//   sheep  a seafoam cloud of fleece with a cream face, floppy ears and a flower lei. A bouncy little
//          trot, the fleece and lei jiggling after it; chews, flicks an ear, nibbles the grass,
//          lifts her head for a "baa"; lies down to sleep.
//   cow    a cream cow with strawberry-pink heart spots, a pink nose, little horns, a shell cowbell on
//          a ribbon. A slow swaying plod, the bell swinging; chews her cud, swishes her tail, lowers
//          her head to graze, closes her eyes for a happy "moo"; lies down to sleep.
//
// All of them: look at you when you come near and greet you with a happy bounce, and cheer when you
// collect what they made (`farm` on the animation: graze, sleep, cheer, call, watch, from
// world/home.js tickAnimal). `drawFarmAnimal(ctx, animal, x, y, time)` draws one at its feet.

import { E, T, F, stroke } from './mobs/kit.js';
import { ramp, crescent, shine } from './mobs/meadow.js';
import { part, partBare, outerOutline, makeRig, spring, smooth, clamp, TAU } from './mobs/rig.js';
import { sprite } from './pixel.js';

const D2R = Math.PI / 180;
const INK = '#3a2d4f';
const BLUSH = '#ffa8c0';
const line = (pts, w, c) => stroke(pts, w, c);
const arcPts = (cx, cy, rx, ry, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => {
  const a = (a0 + ((a1 - a0) * i) / n) * D2R;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
// A glossy eye: dark, a big highlight and a small one (fixed shapes, so they never shimmer).
const eye = (x, y, rx, ry, c = INK) => [F(E(x, y, rx, ry, c)), F(E(x - rx * 0.32, y - ry * 0.36, rx * 0.42, ry * 0.36, '#ffffff')), F(E(x + rx * 0.34, y + ry * 0.36, rx * 0.2, ry * 0.18, '#ffffff'))];
const shut = (x, y, w) => line(arcPts(x, y - 0.4, w, w * 0.55, 200, 340, 6), 0.55, INK);
const happy = (x, y, w) => line(arcPts(x, y + 0.5, w, w * 0.8, 200, 340, 6), 0.6, INK);
const blush = (x, y, r) => F(E(x, y, r, r * 0.6, BLUSH));
const hold = (u, a, b, c, d) => (u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u < c ? 1 : 1 - smooth((u - c) / (d - c)));
const mixIn = (base, over, k) => {
  if (k <= 0) return base;
  const out = { ...base };
  for (const key of Object.keys(over)) out[key] = (base[key] ?? 0) + (over[key] - (base[key] ?? 0)) * clamp(k, 0, 1);
  return out;
};
// The step phase, from the distance walked, on an eased speed (so the cycle never jumps).
const stepPhase = (m, a, stride, key) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(120, Math.abs(odo - (st[`${key}O`] ?? odo)) / dt);
  st[`${key}O`] = odo;
  st[`${key}V`] = (st[`${key}V`] ?? 0) + (raw - (st[`${key}V`] ?? 0)) * Math.min(1, dt * 5);
  st[`${key}U`] = ((st[`${key}U`] ?? 0) + (st[`${key}V`] / stride) * dt) % 1;
  return st[`${key}U`];
};
// What it's up to, eased: grazing, asleep, cheering, calling, watching you.
const doing = (a) => {
  const st = (a.mo.rig ??= {});
  const dt = Math.max(1e-3, a.dt);
  const f = a.farm ?? {};
  return {
    graze: spring(st, '_graze', f.graze ? 1 : 0, 40, 12, dt),
    sleep: spring(st, '_sleep', f.sleep ? 1 : 0, 26, 10, dt),
    cheer: f.cheer ?? 0,
    call: spring(st, '_call', f.call ? 1 : 0, 90, 14, dt),
    watch: spring(st, '_watch', f.watch ? 1 : 0, 40, 12, dt),
  };
};
// A happy bounce: two little hops over `c` (1 to 0, seconds left of a cheer), each eased up and down.
const hopOf = (c) => (c > 0 ? Math.abs(Math.sin(Math.min(1, c / 1.4) * Math.PI * 2)) : 0);
const faceKind = (a, D, blinkNow) => {
  if (D.sleep > 0.5) return 'sleep';
  if (D.cheer > 0.05) return 'happy';
  if (D.call > 0.4) return 'talk';
  return blinkNow ? 'blink' : 'idle';
};

// =====================================================================================
// The hen
// =====================================================================================
const GOLD = ramp('#ffd86a', { step: 9, turn: 18 });
const WING = ramp('#ffb070', { step: 9, turn: 16 });
const TEAL = '#5fd0c0';
const PINK = '#ff8fb4';
const BEAK = '#ff9a4a';
const HEN_LEG = 4.4;

const henBodyShapes = () => [
  E(9.5, 8.6, 8.8, 7.8, GOLD.base),
  E(13.5, 6.2, 4.4, 4.6, GOLD.base),
  crescent(9.5, 8.6, 8.8, 7.8, GOLD.sh, { k: 0.24, a0: 20, a1: 150 }),
  shine(9, 8, 8.4, 7.4, '#fff6c8', 0, 0.8),
  F(E(12, 12.4, 4, 1.6, GOLD.hi)),
];
const henTailShapes = () => [
  T([[8, 9.6], [1.4, 1.6], [4.6, 1], [8.6, 7]], TEAL),
  T([[8.4, 9.8], [0.4, 5.4], [3, 3.6], [8.8, 8]], PINK),
  T([[8.6, 10], [2.2, 9], [3.4, 7], [9, 8.8]], GOLD.sh),
  F(T([[7.6, 8.6], [3, 2.4], [4.2, 2.2]], '#bff4ea')),
];
const henWingShapes = () => [
  E(4.8, 3.4, 5, 3.4, WING.base),
  crescent(4.8, 3.4, 5, 3.4, WING.sh, { k: 0.3, a0: 20, a1: 160 }),
  ...line([[1.6, 4], [7.8, 5]], 0.5, WING.sh),
  ...line([[2.2, 2.6], [7.6, 3.4]], 0.5, WING.sh),
];
const henHeadShapes = () => [
  E(6.2, 6.6, 5.4, 5.2, GOLD.base),
  crescent(6.2, 6.6, 5.4, 5.2, GOLD.sh, { k: 0.2, a0: 30, a1: 140 }),
  F(E(4.6, 4.4, 2.2, 1.4, GOLD.hi)),
  // A little red wattle under the beak.
  E(10.4, 9.6, 1.2, 1.6, '#ff7a8a'),
];
const henCrestShapes = () => [
  T([[3, 8], [0.6, 1.4], [2.8, 0.4], [4.4, 6.6]], TEAL),
  T([[4, 8], [4.4, 0], [6.4, 0.6], [5.4, 7.6]], PINK),
  T([[5, 8], [7.6, 2.4], [8.6, 4], [6, 8.4]], TEAL),
  F(T([[1.6, 2], [2.6, 1], [3.4, 5]], '#bff4ea')),
  F(T([[4.8, 1], [5.8, 1.2], [5.2, 5]], '#ffd0e0')),
];
const henBeakShapes = (open) => open
  ? [T([[0, 1.2], [5.4, 0.4], [0.4, 2.6]], BEAK), T([[0.2, 3], [4.6, 4.4], [0, 4.4]], '#e8823a'), F(E(1.4, 2.8, 1.1, 0.9, '#a8404a'))]
  : [T([[0, 0.8], [5.6, 2.2], [0, 4]], BEAK), F(T([[0, 2.3], [5.4, 2.3], [0, 3.6]], '#e8823a'))];
const henLegShapes = () => [
  ...stroke([[2.4, 0], [2.4, HEN_LEG]], 1.6, BEAK, false),
  T([[2.4, HEN_LEG - 0.4], [5.6, HEN_LEG + 0.8], [5.4, HEN_LEG + 1.4], [2.4, HEN_LEG + 1]], BEAK),
  T([[2.4, HEN_LEG - 0.4], [0, HEN_LEG + 1.2], [0.4, HEN_LEG + 1.6], [2.6, HEN_LEG + 1]], BEAK),
];
const henFaceShapes = (mood) => {
  const out = [blush(4.2, 4.8, 1.5)];
  if (mood === 'sleep' || mood === 'blink') out.push(...shut(3.6, 2.4, 1.3));
  else if (mood === 'happy') out.push(...happy(3.6, 2.4, 1.3));
  else out.push(...eye(3.6, 2.4, 1.3, 1.7));
  return out;
};
const henPart = (k, w, h, f, pad = 3) => part(`farmhen|${k}`, w, h, f, pad);
const henBare = (k, w, h, f, pad = 3) => partBare(`farmhen|${k}`, w, h, f, pad);
const henFace = (mood) => sprite(`rig|farmhen|face|${mood}`, () => ({ w: 7, h: 6, res: 3, soft: 'cel', crisp: true, bare: true, pad: 3, shapes: henFaceShapes(mood) }));
const HEN_LOOP = 8;

export const henRig = makeRig({
  w: 26,
  h: 26,
  soft: true,
  stride: 9,
  springs: {
    x: [200, 18], lift: [260, 18], tilt: [170, 14], head: [220, 16], hx: [420, 26], legN: [300, 22], legF: [300, 22], wing: [260, 13], beak: [500, 30],
    crest: [90, 5], tail: [100, 6],
  },
  pose(m, a) {
    const t = a.t + (m.uid % 13) * 0.61;
    const D = doing(a);
    const u = stepPhase(m, a, 9, 'hn');
    const lu = t % HEN_LOOP;
    a.fBlink = (lu > 2.2 && lu < 2.36) || (lu > 6.1 && lu < 6.24);
    a.fFace = faceKind(a, D, a.fBlink);
    const look1 = hold(lu, 0.6, 0.75, 1.6, 1.75);
    const look2 = hold(lu, 3.4, 3.55, 4.3, 4.45);
    const ruffle = hold(lu, 5, 5.08, 5.5, 5.7);
    const breath = Math.sin(t * 2.2);
    let p = { x: 0, lift: breath * 0.2, tilt: ruffle * Math.sin(t * 40) * 3, head: look1 * -16 + look2 * 12 + ruffle * Math.sin(t * 40) * 6, hx: 0, legN: 0, legF: 0, wing: ruffle * -40 + breath * 2, beak: 0 };
    // Walking: a waddle side to side, legs stepping in turn, the head held then snapped forward.
    const s = Math.sin(u * TAU);
    const ph = (u * 2) % 1;
    const walk = { x: 0, lift: Math.abs(s) * 0.7, tilt: s * 5, head: -4, hx: ph < 0.55 ? -1.4 + ph * 1.2 : -0.7 + smooth((ph - 0.55) / 0.2) * 2.4, legN: s * 32, legF: -s * 32, wing: 4, beak: 0 };
    p = mixIn(p, walk, a.walkW);
    // Pecking at the sand: leaning in, three quick pecks then a look up.
    const pk = Math.max(0, Math.sin(t * 9)) ** 3 * (Math.sin(t * 1.3) > -0.3 ? 1 : 0);
    p = mixIn(p, { x: 1, lift: 0, tilt: 22, head: 34 + pk * 22, hx: 1, legN: -6, legF: 6, wing: 2, beak: 0 }, D.graze);
    // Watching you: head up and toward you, a curious tilt.
    p = mixIn(p, { head: -14 + Math.sin(t * 1.7) * 6, tilt: -3 }, D.watch * (1 - D.graze));
    // Clucking: head up, the beak working.
    p = mixIn(p, { head: -18, beak: Math.abs(Math.sin(t * 16)) }, D.call);
    // Asleep: settled down on the sand, legs tucked, head tucked into her back.
    p = mixIn(p, { x: 0, lift: -HEN_LEG - 0.4 + breath * 0.25, tilt: 4, head: 24, hx: -2.4, legN: 0, legF: 0, wing: 6, beak: 0 }, D.sleep);
    // Cheering: two flapping hops.
    const hop = hopOf(D.cheer);
    if (D.cheer > 0) p = { ...p, lift: p.lift + hop * 4, wing: -55 * Math.abs(Math.sin(t * 18)), head: -12, beak: hop > 0.5 ? 1 : 0 };
    return p;
  },
  follow(S) {
    return { crest: -S.lift * 14 - S.tilt * 1.6 + S.head * 0.4 - S.hx * 6, tail: S.lift * 10 - S.tilt * 2 };
  },
  parts: outerOutline([
    { name: 'core', parent: null, at: (S) => [S.x, -HEN_LEG - 7.6 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'legF', parent: 'core', s: () => henPart('leg', 6, 7, henLegShapes), b: () => henBare('leg', 6, 7, henLegShapes), pivot: [2.4, 0], at: () => [-1.2, 6.2], rot: (S) => S.legF * D2R, alpha: (a, S) => 1 - clamp((-S.lift / HEN_LEG) * 1.6, 0, 1) },
    { name: 'tail', parent: 'core', s: () => henPart('tail', 10, 11, henTailShapes), b: () => henBare('tail', 10, 11, henTailShapes), pivot: [8.4, 9], at: () => [-6.4, 1.6], rot: (S) => (S.tail - 8) * D2R },
    { name: 'body', parent: 'core', s: () => henPart('body', 19, 16, henBodyShapes), b: () => henBare('body', 19, 16, henBodyShapes), pivot: [9.5, 8.6] },
    { name: 'legN', parent: 'core', s: () => henPart('leg', 6, 7, henLegShapes), b: () => henBare('leg', 6, 7, henLegShapes), pivot: [2.4, 0], at: () => [1.8, 6.6], rot: (S) => S.legN * D2R, alpha: (a, S) => 1 - clamp((-S.lift / HEN_LEG) * 1.6, 0, 1) },
    { name: 'wing', parent: 'core', s: () => henPart('wing', 10, 7, henWingShapes), b: () => henBare('wing', 10, 7, henWingShapes), pivot: [8.4, 1.6], at: () => [2.4, -0.4], rot: (S) => S.wing * D2R },
    { name: 'neck', parent: 'core', at: (S) => [4.6 + S.hx, -4.6], rot: (S) => S.head * D2R },
    { name: 'crest', parent: 'neck', s: () => henPart('crest', 9, 9, henCrestShapes), b: () => henBare('crest', 9, 9, henCrestShapes), pivot: [4.4, 8], at: () => [1.6, -9.6], rot: (S) => (S.crest - 6) * D2R },
    { name: 'head', parent: 'neck', s: () => henPart('head', 12, 12, henHeadShapes), b: () => henBare('head', 12, 12, henHeadShapes), pivot: [4, 10] },
    { name: 'beak', parent: 'neck', s: (a, S) => henPart(`beak${S.beak > 0.45 ? 1 : 0}`, 6, 5, () => henBeakShapes(S.beak > 0.45)), b: (a, S) => henBare(`beak${S.beak > 0.45 ? 1 : 0}`, 6, 5, () => henBeakShapes(S.beak > 0.45)), pivot: [0.4, 2.4], at: () => [7.2, -3.8] },
    { name: 'face', parent: 'neck', top: true, s: (a) => henFace(a.fFace ?? 'idle'), pivot: [3.6, 2.8], at: () => [4.4, -4.8] },
  ]),
});

// =====================================================================================
// The sheep
// =====================================================================================
const FLEECE = ramp('#c4efe4', { step: 8, turn: 18 });
const SFACE = ramp('#fbe6d8', { step: 7, turn: 20 });
const SLEG = ramp('#e8d6cc', { step: 9, turn: 14 });
const SHEEP_LEG = 4.6;

const fleeceShapes = () => {
  const out = [E(16, 11.4, 13.4, 8.6, FLEECE.base)];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    out.push(E(16 + Math.cos(a) * 12.6, 11.4 + Math.sin(a) * 8, 3.2, 3, FLEECE.base));
  }
  out.push(crescent(16, 11.4, 14, 9.2, FLEECE.sh, { k: 0.26, a0: 25, a1: 155 }), shine(16, 11.4, 13, 8.4, '#ffffff', 0, 0.8));
  for (const [x, y, r] of [[8, 6.8, 1.9], [13, 5.4, 2], [18.6, 5.6, 2], [23.6, 7, 1.8], [6, 11, 1.8], [11, 10.4, 2], [16.4, 10, 2.1], [21.6, 10.6, 2], [26, 11.6, 1.7], [9, 15, 1.9], [14.4, 14.8, 2], [19.8, 14.8, 1.9]]) {
    out.push(crescent(x, y, r, r * 0.9, '#a8e0d4', { k: 0.42, a0: 10, a1: 200 }));
    if (y < 11) out.push(F(crescent(x, y, r * 0.9, r * 0.8, '#ffffff', { k: 0.3, a0: 200, a1: 300 })));
  }
  return out;
};
const sheepHeadShapes = () => [
  E(7.4, 7.6, 5.4, 5.4, SFACE.base),
  E(10.4, 9.6, 3.6, 3, SFACE.base),
  crescent(7.4, 7.6, 5.4, 5.4, SFACE.sh, { k: 0.2, a0: 40, a1: 160 }),
  F(E(11, 10.2, 2.2, 1.4, SFACE.hi)),
  // A topknot of seafoam fleece.
  E(4.6, 3, 2.6, 2.4, FLEECE.base), E(7.6, 2.2, 2.9, 2.6, FLEECE.base), E(10.2, 3.2, 2.2, 2, FLEECE.base),
  F(E(7, 1.6, 1.2, 0.7, '#ffffff')),
  crescent(7.6, 2.2, 1.7, 1.5, '#a8e0d4', { k: 0.42, a0: 10, a1: 200 }),
];
const sheepEarShapes = (far) => [T([[0.6, 0.6], [4, 0.2], [7.2, 1.2], [7.8, 2.2], [6.6, 3.2], [3.4, 3.4], [0.6, 2.8]], far ? SFACE.sh : SFACE.base), F(T([[1.4, 1.2], [5.8, 1.4], [6.6, 2.1], [5.4, 2.6], [1.4, 2.3]], '#f8b4c0'))];
const leiShapes = () => {
  const out = [];
  for (let k = 0; k < 6; k++) {
    const x = 1.4 + k * 2.2;
    const y = 1.6 + Math.sin((k / 5) * Math.PI) * 2.2;
    if (k % 2) out.push(...[0, 1, 2, 3, 4].map((i) => E(x + Math.cos((i / 5) * TAU) * 0.9, y + Math.sin((i / 5) * TAU) * 0.9, 0.75, 0.75, '#fff3a0')), F(E(x, y, 0.5, 0.5, '#ffb84a')));
    else out.push(...[0, 1, 2, 3, 4].map((i) => E(x + Math.cos((i / 5) * TAU) * 1, y + Math.sin((i / 5) * TAU) * 1, 0.85, 0.85, '#ff8fb4')), F(E(x, y, 0.55, 0.55, '#fff0f4')));
  }
  return out;
};
const sheepLegShapes = (far) => [
  ...stroke([[1.8, 0], [1.8, SHEEP_LEG]], 2.6, far ? SLEG.sh : SLEG.base, false),
  T([[0.4, SHEEP_LEG - 0.2], [3.2, SHEEP_LEG - 0.2], [3.4, SHEEP_LEG + 1.4], [0.2, SHEEP_LEG + 1.4]], far ? '#4a3a44' : '#6a5060'),
];
const sheepTailShapes = () => [E(3, 3, 2.8, 2.6, FLEECE.base), F(E(2.4, 2.2, 1, 0.7, '#ffffff'))];
const sheepFaceShapes = (mood) => {
  const out = [blush(2, 5.4, 1.4), blush(8.6, 5.4, 1.4)];
  if (mood === 'sleep' || mood === 'blink') out.push(...shut(3.2, 3, 1.3), ...shut(7.4, 3, 1.3));
  else if (mood === 'happy') out.push(...happy(3.2, 3, 1.3), ...happy(7.4, 3, 1.3));
  else out.push(...eye(3.2, 3, 1.3, 1.7), ...eye(7.4, 3, 1.3, 1.7));
  // The mouth: a small "w", open for a "baa", a happy open smile.
  if (mood === 'talk') out.push(F(E(6, 6.8, 1, 1.2, '#b2506c')));
  else if (mood === 'happy') out.push(F(T(arcPts(6, 6.2, 1.3, 1.2, 0, 180, 6), '#b2506c')));
  else out.push(...line([[4.9, 6.2], [5.45, 6.8], [6, 6.3], [6.55, 6.8], [7.1, 6.2]], 0.45, INK));
  return out;
};
const shPart = (k, w, h, f, pad = 3) => part(`farmsheep|${k}`, w, h, f, pad);
const shBare = (k, w, h, f, pad = 3) => partBare(`farmsheep|${k}`, w, h, f, pad);
const sheepFace = (mood) => sprite(`rig|farmsheep|face|${mood}`, () => ({ w: 11, h: 8, res: 3, soft: 'cel', crisp: true, bare: true, pad: 3, shapes: sheepFaceShapes(mood) }));
const SHEEP_LOOP = 10;
const SHEEP_BODY = SHEEP_LEG + 9.4;
const SHEEP_LEGS = [['bf', -7.6, 0.5, true], ['ff', 5.4, 0, true], ['bn', -5.8, 0, false], ['fn', 7.4, 0.5, false]];

export const sheepRig = makeRig({
  w: 38,
  h: 32,
  soft: true,
  stride: 13,
  springs: {
    x: [180, 18], lift: [240, 18], tilt: [150, 15], head: [150, 14], chew: [400, 20], legs: [300, 24], tuck: [80, 14],
    fleece: [90, 6], earN: [80, 4.5], earF: [80, 4.5], tail: [90, 4], lei: [70, 4],
  },
  pose(m, a) {
    const t = a.t + (m.uid % 11) * 0.53;
    const D = doing(a);
    const u = stepPhase(m, a, 13, 'sh');
    a.shU = u;
    const lu = t % SHEEP_LOOP;
    a.fBlink = (lu > 3 && lu < 3.16) || (lu > 7.5 && lu < 7.66);
    a.fFace = faceKind(a, D, a.fBlink);
    const look = hold(lu, 5, 5.3, 6.4, 6.8);
    const chew = Math.sin(t * 8) * (lu < 4.6 ? 1 : 0);
    const breath = Math.sin(t * 1.5);
    let p = { x: 0, lift: (breath + 1) * 0.2, tilt: 0, head: chew * 1.4 - look * 12, chew, legs: 0, tuck: 0 };
    // The trot: a light bounce over each step, a little nod.
    const v = Math.abs(Math.sin(u * TAU));
    p = mixIn(p, { x: 0, lift: v * 1.4, tilt: Math.sin(u * TAU) * 1.4, head: 3 + v * 3, chew: 0, legs: 1, tuck: 0 }, a.walkW);
    // Nibbling the grass: head down, chewing.
    p = mixIn(p, { x: 0.6, tilt: 5, head: 36 + Math.sin(t * 10) * 2, chew: Math.sin(t * 10) }, D.graze);
    p = mixIn(p, { head: -10 + Math.sin(t * 1.4) * 4, tilt: -2 }, D.watch * (1 - D.graze));
    // "Baa": head up, a little lift.
    p = mixIn(p, { head: -22, lift: p.lift + 0.6 }, D.call);
    // Asleep: lying down, legs tucked under, head resting low.
    p = mixIn(p, { x: 0, lift: -SHEEP_LEG + 0.4 + breath * 0.3, tilt: 0, head: 18, chew: 0, legs: 0, tuck: 1 }, D.sleep);
    const hop = hopOf(D.cheer);
    if (D.cheer > 0) p = { ...p, lift: p.lift + hop * 4.4, head: -12, tilt: -hop * 3 };
    return p;
  },
  follow(S, a) {
    const t = a.t;
    const wag = (t % 2.6 < 0.5 ? Math.sin(t * 28) * 20 : 0) + (a.farm?.cheer > 0 ? Math.sin(t * 24) * 26 : 0);
    const flick = (t * 0.8) % 4.1 < 0.18 ? 26 : 0;
    return {
      fleece: S.lift * 2 - S.tilt * 0.3,
      earN: -S.lift * 14 - S.tilt * 1.4 + S.head * 0.4 - flick,
      earF: -S.lift * 14 - S.tilt * 1.4 + S.head * 0.4,
      tail: -S.lift * 12 + S.tilt * 2 + wag,
      lei: -S.tilt * 2 - S.lift * 8 + S.head * 0.3,
    };
  },
  parts: outerOutline([
    { name: 'core', parent: null, at: (S) => [S.x, -SHEEP_BODY - S.lift], rot: (S) => S.tilt * D2R },
    ...sheepLegs(true),
    { name: 'tail', parent: 'core', s: () => shPart('tail', 6, 6, sheepTailShapes), b: () => shBare('tail', 6, 6, sheepTailShapes), pivot: [4.6, 3.2], at: () => [-14.4, -2.6], rot: (S) => clamp(S.tail, -35, 35) * D2R },
    { name: 'neck', parent: 'core', at: () => [11.6, -3.6], rot: (S) => S.head * D2R },
    { name: 'earF', parent: 'neck', s: () => shPart('ear1', 8, 4, () => sheepEarShapes(true)), b: () => shBare('ear1', 8, 4, () => sheepEarShapes(true)), pivot: [7.4, 1.6], at: () => [2.4, -8], rot: (S) => (-16 + S.earF) * D2R },
    ...sheepLegs(false),
    { name: 'fleece', parent: 'core', s: () => shPart('fleece', 32, 22, fleeceShapes, 4), b: () => shBare('fleece', 32, 22, fleeceShapes, 4), pivot: [16, 11.4], at: (S) => [0, clamp(S.fleece * 0.4, -1.5, 1.5)] },
    { name: 'lei', parent: 'neck', s: () => shPart('lei', 14, 6, leiShapes), b: () => shBare('lei', 14, 6, leiShapes), pivot: [7, 1.6], at: () => [0.6, 0.6], rot: (S) => clamp(S.lei, -24, 24) * D2R },
    { name: 'head', parent: 'neck', s: () => shPart('head', 15, 14, sheepHeadShapes), b: () => shBare('head', 15, 14, sheepHeadShapes), pivot: [4, 12] },
    { name: 'face', parent: 'neck', top: true, s: (a) => sheepFace(a.fFace ?? 'idle'), pivot: [5.4, 4], at: () => [4.2, -4.8] },
    { name: 'earN', parent: 'neck', s: () => shPart('ear0', 8, 4, () => sheepEarShapes(false)), b: () => shBare('ear0', 8, 4, () => sheepEarShapes(false)), pivot: [7.4, 1.6], at: () => [-0.6, -7.2], rot: (S) => (-44 + S.earN) * D2R },
  ]),
});
function sheepLegs(far) {
  return SHEEP_LEGS.filter((l) => l[3] === far).map(([k, x0, ph]) => ({
    name: `leg${k}`,
    parent: 'core',
    s: () => shPart(`leg${far ? 1 : 0}`, 4, 7, () => sheepLegShapes(far)),
    b: () => shBare(`leg${far ? 1 : 0}`, 4, 7, () => sheepLegShapes(far)),
    pivot: [1.8, 0],
    at: (S) => [x0, 5.6 - S.tuck * 3],
    rot: (S, a) => Math.sin(((a.shU ?? 0) + ph) * TAU) * 24 * S.legs * D2R,
    alpha: (a, S) => 1 - clamp(S.tuck * 1.6, 0, 1),
  }));
}

// =====================================================================================
// The cow
// =====================================================================================
const HIDE = ramp('#fff3ea', { step: 7, turn: 18 });
const SPOT = '#ff9fb8';
const NOSE = ramp('#ffbfd0', { step: 8, turn: 14 });
const COW_LEG = 6;

const heart = (x, y, k, c) => T([[x, y + 3.6 * k], [x - 3.4 * k, y + 0.2 * k], [x - 3.2 * k, y - 1.8 * k], [x - 1.6 * k, y - 2.6 * k], [x, y - 1.2 * k], [x + 1.6 * k, y - 2.6 * k], [x + 3.2 * k, y - 1.8 * k], [x + 3.4 * k, y + 0.2 * k]], c);
const cowBodyShapes = () => [
  E(20, 13, 18.6, 11.6, HIDE.base),
  crescent(20, 13, 18.6, 11.6, HIDE.sh, { k: 0.24, a0: 22, a1: 158 }),
  shine(20, 13, 17.6, 11, '#ffffff', 0, 0.8),
  F(heart(10, 9.6, 1.3, SPOT)), F(heart(23, 15.6, 1.1, SPOT)), F(heart(30, 7.6, 0.8, SPOT)), F(heart(15, 18, 0.7, SPOT)),
];
const cowHeadShapes = () => [
  E(8.6, 8.2, 7.6, 7.2, HIDE.base),
  crescent(8.6, 8.2, 7.6, 7.2, HIDE.sh, { k: 0.2, a0: 40, a1: 160 }),
  F(E(6.4, 5.4, 3, 1.8, HIDE.hi)),
  // Little horns and a pink heart on the brow.
  T([[4, 2.4], [3, -1.6], [5.6, 1.6]], '#ffe8a8'), T([[10.6, 1.6], [12.6, -2], [12.6, 2.6]], '#ffe8a8'),
  F(heart(8, 3.6, 0.6, SPOT)),
];
const cowEarShapes = (far) => [T([[0.6, 0.8], [4.4, 0], [8.2, 1.6], [7.6, 3], [3.6, 3.6], [0.6, 2.8]], far ? HIDE.sh : HIDE.base), F(T([[1.6, 1.3], [6.4, 1.6], [6.2, 2.5], [1.8, 2.4]], '#ffb8c8'))];
const cowSnoutShapes = (open) => [
  E(5.6, 4, 5.4, 3.8, NOSE.base),
  crescent(5.6, 4, 5.4, 3.8, NOSE.sh, { k: 0.26, a0: 30, a1: 150 }),
  F(E(4.4, 2.6, 2, 0.9, NOSE.hi)),
  F(E(4, 4, 0.9, 1.2, '#c86080')), F(E(7.4, 4, 0.9, 1.2, '#c86080')),
  ...(open ? [F(E(5.8, 7.2, 1.6, 1.3, '#a8405a'))] : line(arcPts(5.8, 6.4, 1.6, 0.8, 20, 160, 6), 0.5, '#a8405a')),
];
const cowLegShapes = (far) => [
  ...stroke([[2.6, 0], [2.6, COW_LEG]], 3.6, far ? HIDE.sh : HIDE.base, false),
  T([[0.6, COW_LEG - 0.4], [4.6, COW_LEG - 0.4], [4.8, COW_LEG + 2], [0.4, COW_LEG + 2]], far ? '#6a4a5a' : '#8a6070'),
  F(T([[1, COW_LEG - 0.2], [2.6, COW_LEG - 0.2], [2.6, COW_LEG + 0.4], [1, COW_LEG + 0.4]], '#b88a98')),
];
const cowTailShapes = () => [...stroke([[2, 0], [2.2, 9]], 1.4, HIDE.sh, false), E(2.2, 11, 2.2, 2.8, SPOT), F(E(1.6, 10.2, 0.8, 1, '#ffd0dc'))];
const bellShapes = () => [
  ...stroke([[0, 0.6], [8, 0.6]], 1.4, '#5fc8d8', false),
  T([[2.2, 1.4], [5.8, 1.4], [7, 6.6], [4, 7.6], [1, 6.6]], '#ffd8a8'),
  F(T([[2.6, 2], [4, 1.6], [3.2, 6.4], [2, 6]], '#fff0d8')),
  ...line([[4, 1.8], [4, 7]], 0.4, '#e8a870'), ...line([[2.8, 2.2], [1.8, 6.4]], 0.35, '#e8a870'), ...line([[5.2, 2.2], [6.2, 6.4]], 0.35, '#e8a870'),
];
const cowFaceShapes = (mood) => {
  const out = [blush(1.6, 5.6, 1.6), blush(10, 5.6, 1.6)];
  if (mood === 'sleep' || mood === 'blink' || mood === 'talk') out.push(...shut(3.2, 3, 1.5), ...shut(8.4, 3, 1.5));
  else if (mood === 'happy') out.push(...happy(3.2, 3, 1.5), ...happy(8.4, 3, 1.5));
  else out.push(...eye(3.2, 3, 1.5, 1.9), ...eye(8.4, 3, 1.5, 1.9), ...line([[1.6, 1.2], [1, 0.4]], 0.4, INK), ...line([[10, 1.2], [10.6, 0.4]], 0.4, INK));
  return out;
};
const cwPart = (k, w, h, f, pad = 3) => part(`farmcow|${k}`, w, h, f, pad);
const cwBare = (k, w, h, f, pad = 3) => partBare(`farmcow|${k}`, w, h, f, pad);
const cowFace = (mood) => sprite(`rig|farmcow|face|${mood}`, () => ({ w: 12, h: 8, res: 3, soft: 'cel', crisp: true, bare: true, pad: 3, shapes: cowFaceShapes(mood) }));
const COW_LOOP = 12;
const COW_BODY = COW_LEG + 12;
const COW_LEGS = [['bf', -12, 0.5, true], ['ff', 9, 0, true], ['bn', -9.6, 0, false], ['fn', 11.6, 0.5, false]];

export const cowRig = makeRig({
  w: 52,
  h: 42,
  soft: true,
  stride: 17,
  springs: {
    x: [160, 18], lift: [200, 18], tilt: [120, 15], head: [110, 13], legs: [260, 22], tuck: [70, 14], open: [400, 26],
    earN: [70, 4], earF: [70, 4], tail: [60, 3.6], bell: [55, 3.2],
  },
  pose(m, a) {
    const t = a.t + (m.uid % 7) * 0.83;
    const D = doing(a);
    const u = stepPhase(m, a, 17, 'cw');
    a.cwU = u;
    const lu = t % COW_LOOP;
    a.fBlink = (lu > 4 && lu < 4.18) || (lu > 9.4 && lu < 9.58);
    a.fFace = faceKind(a, D, a.fBlink);
    const look = hold(lu, 6, 6.4, 7.8, 8.3);
    const chew = Math.sin(t * 5);
    const breath = Math.sin(t * 1.2);
    let p = { x: 0, lift: (breath + 1) * 0.2, tilt: 0, head: chew * 1.2 - look * 10, legs: 0, tuck: 0, open: 0 };
    // The plod: a slow sway, the head nodding with each step.
    const s = Math.sin(u * TAU);
    p = mixIn(p, { x: 0, lift: Math.abs(s) * 0.9, tilt: s * 1.6, head: 4 + Math.abs(s) * 4, legs: 1, tuck: 0, open: 0 }, a.walkW);
    p = mixIn(p, { x: 1, tilt: 4, head: 34 + Math.sin(t * 5) * 2 }, D.graze);
    p = mixIn(p, { head: -8 + Math.sin(t * 1.1) * 4, tilt: -1.5 }, D.watch * (1 - D.graze));
    // "Moo": head lifted, eyes closed in delight, mouth open.
    p = mixIn(p, { head: -24, open: 1 }, D.call);
    p = mixIn(p, { x: 0, lift: -COW_LEG + 0.6 + breath * 0.3, tilt: 0, head: 14, legs: 0, tuck: 1, open: 0 }, D.sleep);
    const hop = hopOf(D.cheer);
    if (D.cheer > 0) p = { ...p, lift: p.lift + hop * 3, head: -14, open: hop > 0.5 ? 1 : 0 };
    return p;
  },
  follow(S, a) {
    const t = a.t;
    const swish = Math.sin(t * 2.2) * 14 + (t % 5 < 0.6 ? Math.sin(t * 18) * 16 : 0);
    const flick = (t * 0.7) % 5.3 < 0.2 ? 24 : 0;
    return {
      earN: -S.lift * 10 - S.tilt * 1.2 + S.head * 0.4 - flick,
      earF: -S.lift * 10 - S.tilt * 1.2 + S.head * 0.4,
      tail: swish + S.tilt * 2 - S.lift * 6,
      bell: -S.tilt * 2.2 - S.lift * 10 + S.head * 0.6 + S.open * 10,
    };
  },
  parts: outerOutline([
    { name: 'core', parent: null, at: (S) => [S.x, -COW_BODY - S.lift], rot: (S) => S.tilt * D2R },
    ...cowLegs(true),
    { name: 'tail', parent: 'core', s: () => cwPart('tail', 5, 14, cowTailShapes), b: () => cwBare('tail', 5, 14, cowTailShapes), pivot: [2, 0.4], at: () => [-18, -6], rot: (S) => clamp(S.tail, -40, 40) * D2R },
    { name: 'neck', parent: 'core', at: () => [15, -5], rot: (S) => S.head * D2R },
    { name: 'earF', parent: 'neck', s: () => cwPart('ear1', 9, 4, () => cowEarShapes(true)), b: () => cwBare('ear1', 9, 4, () => cowEarShapes(true)), pivot: [1, 2], at: () => [9, -9.6], rot: (S) => (-22 - S.earF) * D2R },
    ...cowLegs(false),
    { name: 'body', parent: 'core', s: () => cwPart('body', 40, 26, cowBodyShapes, 4), b: () => cwBare('body', 40, 26, cowBodyShapes, 4), pivot: [20, 13] },
    { name: 'bell', parent: 'neck', s: () => cwPart('bell', 8, 8, bellShapes), b: () => cwBare('bell', 8, 8, bellShapes), pivot: [4, 0.6], at: () => [4.6, 2.6], rot: (S) => clamp(S.bell, -30, 30) * D2R },
    { name: 'head', parent: 'neck', s: () => cwPart('head', 17, 16, cowHeadShapes), b: () => cwBare('head', 17, 16, cowHeadShapes), pivot: [4, 13] },
    { name: 'snout', parent: 'neck', s: (a, S) => cwPart(`snout${S.open > 0.45 ? 1 : 0}`, 11, 9, () => cowSnoutShapes(S.open > 0.45)), b: (a, S) => cwBare(`snout${S.open > 0.45 ? 1 : 0}`, 11, 9, () => cowSnoutShapes(S.open > 0.45)), pivot: [1.4, 4], at: () => [8.4, -3] },
    { name: 'face', parent: 'neck', top: true, s: (a) => cowFace(a.fFace ?? 'idle'), pivot: [5.8, 4], at: () => [4.4, -7.4] },
    { name: 'earN', parent: 'neck', s: () => cwPart('ear0', 9, 4, () => cowEarShapes(false)), b: () => cwBare('ear0', 9, 4, () => cowEarShapes(false)), pivot: [7.4, 2], at: () => [-1.6, -8.4], rot: (S) => (24 + S.earN) * D2R },
  ]),
});
function cowLegs(far) {
  return COW_LEGS.filter((l) => l[3] === far).map(([k, x0, ph]) => ({
    name: `leg${k}`,
    parent: 'core',
    s: () => cwPart(`leg${far ? 1 : 0}`, 6, 9, () => cowLegShapes(far)),
    b: () => cwBare(`leg${far ? 1 : 0}`, 6, 9, () => cowLegShapes(far)),
    pivot: [2.6, 0],
    at: (S) => [x0, 8.4 - S.tuck * 4],
    rot: (S, a) => Math.sin(((a.cwU ?? 0) + ph) * TAU) * 18 * S.legs * D2R,
    alpha: (a, S) => 1 - clamp(S.tuck * 1.6, 0, 1),
  }));
}

// =====================================================================================

const RIGS = { hen: henRig, sheep: sheepRig, cow: cowRig };
// Draws one animal (world/home.js: { kind, x, dir, state, walked, cheer, call, watch, seed }) with
// its feet at (x, y) on screen. Its puppet's springs live on the animal, so it moves on smoothly.
export function drawFarmAnimal(ctx, an, x, y, time) {
  const rig = RIGS[an.kind];
  if (!rig) return;
  const r = (an.rig ??= { m: { uid: an.seed ?? 0, hp: 1, def: {}, attackAt: -99, odo: 0 }, a: { mo: {} }, at: time });
  const dt = Math.min(0.05, Math.max(0, time - r.at));
  r.at = time;
  r.m.odo = an.walked ?? 0;
  Object.assign(r.a, {
    t: time, now: time, dt, moving: an.state === 'walk', mood: 'idle', flip: an.dir < 0, flash: 0, alpha: 1, hurtAgo: 99,
    farm: { graze: an.state === 'graze', sleep: an.state === 'sleep', cheer: an.cheer ?? 0, call: (an.call ?? 0) > 0, watch: Boolean(an.watch) },
  });
  ctx.save();
  ctx.translate(x, y);
  rig.draw(ctx, r.m, r.a);
  ctx.restore();
}
