// Mochi Sumo's moves (world/mochi-sumo.js plays them; data/mochi-sumo.js picks the finish by the
// winner's Power). Keyed like every other act (render/mochi-anim.js ACTIONS): `crisp`, 48 drawings
// a second, smooth with a little bounce in every beat. A crisp move holds its lean exactly to its
// keys, so each starts leaning just as the move before it ends (the crouch's 0.5, the push's
// 0.38, giving way at 0.15), and a move that's held - the crouch, the push - loops while it lasts.
//
//   sumohop      a hop up onto the ring (or down off it), knees tucked
//   sumoshiko    the stamp: a leg up high, stamp! - dust off the clay - and the other
//   sumosalt     a pinch of salt from its hip, tossed up over the ring
//   sumocrouch   at its line, fists down on the clay, eyes locked
//   sumocharge   off the line
//   sumopush     paws on the other, legs braced, trembling with it
//   sumobrace    giving way: leaning in, feet skidding back
//   finishes     sumobelly (Tummy Bump), sumothrust (Palm Thrusts), sumopush again (Push-Out),
//                sumodrive (Grip and Drive), sumolift (Lift-Out), sumothrow (Over-arm Throw),
//                sumoduck (Duck and Trip)
//   losing       sumolifted (carried out kicking), sumoflung (thrown, rolling), sumotumble (over
//                the bales backwards), sumotrip (tripped over the ducker), sumodazed (sat on the
//                floor, stars going round, a giggle, up)
//   sumowin      fists up, twice
//   the referee  gyojiready (his fan out level between them), gyojicall ("Hakkeyoi!", the fan
//                swept up), gyojipoint (the fan at the winner)

const KEY = (t, o) => [t, o];
// (`flow`: carried through the middle of a motion, and settling with a little bounce:
// render/mochi-anim.js idlePose.)
const act = (dur, loop, keys) => ({ dur, loop, crisp: true, fps: 48, flow: true, keys });
const TAU = Math.PI * 2;
const C2 = [true, true];
const SET = [[-0.4, 0.8], [-0.4, 0.8]];
const WORRY = [[0.5, -0.7], [0.5, -0.7]];
const WIDE = { legF: [2.6, 0, 20], legB: [-2.6, 0, -20] };
const KNEES = { front: [1.6, 2], back: [2.4, 2] };
const FISTS = { front: [5, -6], back: [-4, -5] };
const TUCK = { legF: [2.2, -3, 60], legB: [1.6, -2.6, 50] };
const SAT = { squat: 3, bob: 3, legF: [3.4, -1.6, 40], legB: [2.2, -1.2, 30] };
// The crouch at the line; the push; giving way.
const CROUCH = { squat: 3, lean: 0.5, legF: [3, 0, 26], legB: [-3, 0, -26], front: [9, 1], back: [7, 2], brows: SET, mouth: 'mochiflat', blush: 1.4 };
const PUSH = { squat: 1.4, lean: 0.38, legF: [2.6, 0, 22], legB: [-4, 0, -36], front: [11, -7], back: [9, -6], brows: SET, mouth: 'grit', blush: 1.6 };
const BRACE = { squat: 1, lean: 0.15, legF: [3.8, 0, 36], legB: [-1.4, 0, -10], front: [10, -8], back: [8, -7], brows: WORRY, mouth: 'gasp', blush: 1.7 };
// Sat down on the floor, dazed.
const DAZED = { ...SAT, tip: 6, sink: 5.4, lean: -0.2, front: [4, 0], back: [3, 0], mouth: 'wavy' };

const sumohop = act(0.42, null, [
  KEY(0, { squat: 1.4, front: [4, -6], back: [-3, -6], mouth: 'mochio' }),
  KEY(0.1, { ...TUCK, front: [7, -12], back: [-6, -11], mouth: 'mochio', ease: 'out' }),
  KEY(0.3, { ...TUCK, front: [6, -11], back: [-5, -10], mouth: 'D' }),
  KEY(0.38, { squat: 1.6, bob: 0.6, front: [5, -6], back: [-4, -6], mouth: 'mochiw', ease: 'in' }),
  KEY(0.42, { squat: 0.6, mouth: 'mochiw' }),
]);

const sumoshiko = act(2.4, null, [
  KEY(0, {}),
  KEY(0.22, { squat: 2, ...WIDE, ...KNEES, brows: SET, mouth: 'mochiflat' }),
  // Up goes the near leg, high, leaning away over the other...
  KEY(0.5, { squat: 0.6, lift: 1.2, legF: [3.4, -5, 58], legB: [-2.6, 0, -20], front: [6, -9], back: [-3, 0], tilt: -15, brows: SET, mouth: 'grit', ease: 'out' }),
  KEY(0.62, { squat: 0.5, lift: 1.5, legF: [3.6, -5.4, 62], legB: [-2.6, 0, -20], front: [6, -10], back: [-3, 0], tilt: -17, brows: SET, mouth: 'grit' }),
  // ...stamp!
  KEY(0.72, { squat: 2.8, bob: 1.2, ...WIDE, ...KNEES, brows: SET, mouth: 'yell', extra: ['bang1'], ease: 'in' }),
  KEY(0.95, { squat: 2, ...WIDE, ...KNEES, brows: SET, mouth: 'grit' }),
  KEY(1.28, { squat: 0.6, lift: 1.2, legF: [2.6, 0, 20], legB: [-3.4, -5, -58], front: [3, 0], back: [-6, -9], tilt: 15, brows: SET, mouth: 'grit', ease: 'out' }),
  KEY(1.4, { squat: 0.5, lift: 1.5, legF: [2.6, 0, 20], legB: [-3.6, -5.4, -62], front: [3, 0], back: [-6, -10], tilt: 17, brows: SET, mouth: 'grit' }),
  KEY(1.5, { squat: 2.8, bob: 1.2, ...WIDE, ...KNEES, brows: SET, mouth: 'yell', extra: ['bang1'], ease: 'in' }),
  KEY(1.75, { squat: 2, ...WIDE, ...KNEES, brows: SET, mouth: 'grit' }),
  // Up, fists ready.
  KEY(2.05, { squat: 0.6, ...FISTS, brows: SET, mouth: 'smirk', ease: 'out' }),
  KEY(2.4, {}),
]);

const sumosalt = act(1.5, null, [
  KEY(0, {}),
  // A pinch from the salt basket at its hip...
  KEY(0.22, { squat: 0.8, front: [-4, 2], back: [-2, -5], mouth: 'mochio', glance: -1 }),
  KEY(0.4, { squat: 1.1, front: [-7, -4], back: [-1, -5], tilt: -6, mouth: 'mochiflat', brows: SET, ease: 'in' }),
  // ...and up over the ring it goes.
  KEY(0.5, { lift: 0.8, front: [8, -16], back: [-3, -7], tilt: 6, mouth: 'D', look: 'up', extra: ['spark0'], ease: 'out' }),
  KEY(0.8, { front: [9, -14], back: [-3, -7], tilt: 3, mouth: 'D', look: 'up' }),
  KEY(1.2, { ...FISTS, mouth: 'smirk', brows: SET }),
  KEY(1.5, {}),
]);

const sumocrouch = act(1.6, [0.4, 1.2], [
  KEY(0, {}),
  KEY(0.4, { ...CROUCH, ease: 'out' }),
  KEY(0.8, { ...CROUCH, squat: 2.8, bob: 0.5 }),
  KEY(1.2, { ...CROUCH }),
  KEY(1.6, { ...CROUCH }),
]);

const sumocharge = act(0.4, null, [
  KEY(0, { ...CROUCH }),
  KEY(0.12, { ...PUSH, squat: 0.6, lean: 0.5, lift: 1, legB: [-3.8, -0.6, -40], front: [12, -8], back: [10, -7], mouth: 'yell', ease: 'out' }),
  KEY(0.26, { ...PUSH, lean: 0.42, squat: 1.5, ease: 'in' }),
  KEY(0.4, { ...PUSH }),
]);

// Pushing: trembling with the effort, a bead of sweat. (A tail back up to standing, for a push-out
// that's won.)
const sumopush = act(1.12, [0.1, 0.9], [
  KEY(0, { ...PUSH }),
  KEY(0.1, { ...PUSH }),
  KEY(0.32, { ...PUSH, tilt: 2, hx: 0.3, squat: 1.6, extra: ['sweat0'] }),
  KEY(0.55, { ...PUSH, tilt: -2, hx: -0.3, squat: 1.3 }),
  KEY(0.75, { ...PUSH, tilt: 1.5, squat: 1.5 }),
  KEY(0.9, { ...PUSH }),
  KEY(1.02, { ...FISTS, lean: 0.12, squat: 0.8, mouth: 'smirk', brows: SET, ease: 'out' }),
  KEY(1.12, { ...FISTS, lean: 0, mouth: 'smirk' }),
]);

const sumobrace = act(0.75, [0.15, 0.75], [
  KEY(0, { ...PUSH }),
  KEY(0.15, { ...BRACE }),
  KEY(0.35, { ...BRACE, tilt: -2, hx: -0.3, legF: [4.2, 0, 40], extra: ['sweat0'] }),
  KEY(0.55, { ...BRACE, tilt: 2, hx: 0.3, squat: 1.2 }),
  KEY(0.75, { ...BRACE }),
]);

// ---------- Finishes ----------
// Tummy Bump (the littlest): wound back... boing!
const sumobelly = act(1.15, null, [
  KEY(0, { ...PUSH }),
  KEY(0.3, { ...PUSH, lean: -0.18, squat: 1.8, front: [-6, -8], back: [-8, -7], puff: true, mouth: 'mochiflat', ease: 'in' }),
  KEY(0.45, { lean: -0.26, lift: 1.2, hx: 0.6, front: [-8, -10], back: [-9, -9], mouth: 'D', closed: C2, extra: ['bang1'], blush: 1.8, ease: 'out' }),
  KEY(0.7, { lean: -0.08, squat: 0.8, front: [-4, -8], back: [-6, -8], mouth: 'D', closed: C2 }),
  KEY(0.95, { lean: 0, front: [2, -13], back: [-4, -12], mouth: 'D', closed: C2, sprout: 'excited', extra: ['spark0'] }),
  KEY(1.15, {}),
]);
// Palm Thrusts: slap, slap, slap, stepping in.
const THRUST = { squat: 1.2, lean: 0.3, legF: [2.6, 0, 22], legB: [-3, 0, -28], brows: SET, mouth: 'yell', blush: 1.6 };
const sumothrust = act(0.78, [0.08, 0.58], [
  KEY(0, { ...PUSH }),
  KEY(0.08, { ...THRUST, front: [13, -9], back: [5, -8], ease: 'out' }),
  KEY(0.2, { ...THRUST, front: [6, -8], back: [8, -8], squat: 1, legF: [3.2, 0, 26], mouth: 'grit' }),
  KEY(0.33, { ...THRUST, front: [4, -8], back: [13, -9], ease: 'out' }),
  KEY(0.45, { ...THRUST, front: [8, -8], back: [6, -8], squat: 1, legB: [-2.4, 0, -22], mouth: 'grit' }),
  KEY(0.58, { ...THRUST, front: [13, -9], back: [5, -8] }),
  KEY(0.7, { ...FISTS, lean: 0.1, squat: 0.8, mouth: 'smirk', brows: SET, ease: 'out' }),
  KEY(0.78, { ...FISTS, lean: 0, mouth: 'smirk' }),
]);
// Grip and Drive: a low grip, and step, step, step.
const DRIVE = { squat: 1.6, lean: 0.38, front: [9, -3], back: [8, -4], brows: SET, mouth: 'grit', blush: 1.6 };
const sumodrive = act(0.82, [0.0, 0.6], [
  KEY(0, { ...DRIVE, legF: [2.4, 0, 20], legB: [-3, 0, -28] }),
  KEY(0.15, { ...DRIVE, legF: [3.2, -1, 30], legB: [-3, 0, -28], squat: 1.4 }),
  KEY(0.3, { ...DRIVE, legF: [3.4, 0, 26], legB: [-2.2, 0, -20], squat: 1.8 }),
  KEY(0.45, { ...DRIVE, legF: [2.6, 0, 22], legB: [-0.6, -1, -6], squat: 1.4 }),
  KEY(0.6, { ...DRIVE, legF: [2.4, 0, 20], legB: [-3, 0, -28] }),
  KEY(0.72, { ...FISTS, lean: 0.12, squat: 0.8, mouth: 'smirk', brows: SET, ease: 'out' }),
  KEY(0.82, { ...FISTS, lean: 0, mouth: 'smirk' }),
]);
// Lift-Out: a dip, heave it up off its feet, walk it out and set it down outside.
const UP = { front: [8, -15], back: [7, -15], brows: SET, blush: 1.7 };
const sumolift = act(1.75, null, [
  KEY(0, { ...PUSH }),
  KEY(0.2, { ...PUSH, squat: 2.2, lean: 0.3, front: [9, -4], back: [8, -4], ease: 'in' }),
  KEY(0.45, { ...UP, squat: 0.4, lean: -0.12, lift: 0.6, mouth: 'yell', extra: ['bang1'], ease: 'out' }),
  KEY(0.6, { ...UP, lean: -0.1, squat: 0.6, mouth: 'grit' }),
  KEY(0.78, { ...UP, lean: -0.1, squat: 0.8, legF: [3, -1, 30], mouth: 'grit' }),
  KEY(0.96, { ...UP, lean: -0.1, squat: 0.6, legB: [-1, -1, -10], mouth: 'grit' }),
  KEY(1.14, { ...UP, lean: -0.1, squat: 0.8, legF: [3, -1, 30], mouth: 'grit' }),
  KEY(1.32, { ...UP, lean: -0.1, squat: 0.6, legB: [-1, -1, -10], mouth: 'grit' }),
  KEY(1.5, { squat: 1.6, lean: 0.2, front: [10, -8], back: [9, -8], brows: SET, mouth: 'mochiflat' }),
  KEY(1.65, { ...FISTS, lean: 0.05, squat: 0.6, mouth: 'smirk', brows: SET, ease: 'out' }),
  KEY(1.75, { ...FISTS, lean: 0, mouth: 'smirk' }),
]);
// Over-arm Throw: a high grip, a twist - and over it goes.
const sumothrow = act(1.45, null, [
  KEY(0, { ...PUSH }),
  KEY(0.15, { ...PUSH, squat: 1.4, front: [9, -10], back: [8, -9], ease: 'in' }),
  KEY(0.32, { squat: 0.8, lean: -0.1, tilt: -14, front: [4, -14], back: [-3, -14], brows: SET, mouth: 'yell', extra: ['bang1'], ease: 'out' }),
  KEY(0.55, { squat: 1, lean: 0.12, tilt: 10, front: [-8, -12], back: [-10, -10], mouth: 'D' }),
  KEY(0.85, { squat: 1.4, lean: 0.04, tilt: 0, front: [-2, -8], back: [-4, -8], mouth: 'D' }),
  KEY(1.15, { ...FISTS, lean: 0, mouth: 'smirk', brows: SET }),
  KEY(1.45, {}),
]);
// Duck and Trip: down flat as the other charges - and up with a grin once it's sailed over.
const sumoduck = act(0.95, null, [
  KEY(0, { ...CROUCH }),
  KEY(0.1, { squat: 3, lean: 0.1, sink: 3, front: [3, -12], back: [-2, -12], closed: C2, mouth: 'mochiw', ease: 'out' }),
  KEY(0.5, { squat: 3, lean: 0.1, sink: 3.4, front: [3, -12], back: [-2, -12], closed: C2, mouth: 'mochiw' }),
  KEY(0.62, { squat: 3, lean: 0.1, sink: 3, front: [3, -11], back: [-2, -11], mouth: 'smirk', glance: -1 }),
  KEY(0.82, { squat: 1, lean: 0, ...FISTS, mouth: 'D', ease: 'out' }),
  KEY(0.95, { mouth: 'smirk' }),
]);

// ---------- Losing ----------
const sumolifted = act(1.75, null, [
  KEY(0, { ...BRACE }),
  KEY(0.3, { lean: 0.05, legF: [1.2, 1.4, 10], legB: [-1, 1.4, -10], front: [6, -14], back: [-5, -13], brows: WORRY, mouth: 'gasp', extra: ['sweat0'], ease: 'out' }),
  KEY(0.55, { lean: 0.05, legF: [2, 0.2, 30], legB: [-0.4, 1.4, -5], front: [4, -15], back: [-7, -12], brows: WORRY, mouth: 'gasp' }),
  KEY(0.8, { lean: 0.05, legF: [0.4, 1.4, -5], legB: [-2, 0.2, -30], front: [7, -12], back: [-4, -15], brows: WORRY, mouth: 'mochio' }),
  KEY(1.05, { lean: 0.05, legF: [2, 0.2, 30], legB: [-0.4, 1.4, -5], front: [4, -15], back: [-7, -12], brows: WORRY, mouth: 'gasp' }),
  KEY(1.3, { lean: 0.05, legF: [0.4, 1.4, -5], legB: [-2, 0.2, -30], front: [7, -12], back: [-4, -15], brows: WORRY, mouth: 'mochio' }),
  // Set down outside, teetering on the edge, arms going round.
  KEY(1.55, { lean: 0.12, squat: 1, front: [8, -10], back: [-8, -10], brows: WORRY, mouth: 'mochio', ease: 'in' }),
  KEY(1.75, { lean: 0.15, squat: 0.6, front: [-4, -13], back: [7, -12], brows: WORRY, mouth: 'gasp' }),
]);
// Thrown: over in an arc, tucked, and rolling out to the edge.
const sumoflung = act(1.45, null, [
  KEY(0, { ...BRACE }),
  KEY(0.3, { ...TUCK, lean: 0, tip: 6, sink: 6, front: [3, -5], back: [2, -5], mouth: 'gasp', brows: WORRY, extra: ['bang1'] }),
  KEY(0.55, { ...TUCK, lean: -Math.PI * 0.9, tip: 14, sink: 6, front: [3, -5], back: [2, -5], closed: C2, mouth: 'mochio', ease: 'out' }),
  KEY(0.8, { ...TUCK, lean: -TAU, tip: 6, sink: 9, front: [3, -5], back: [2, -5], closed: C2, mouth: 'mochio' }),
  KEY(1.0, { ...TUCK, lean: -TAU - Math.PI / 2, tip: 6, sink: 9, front: [3, -5], back: [2, -5], closed: C2, mouth: 'mochiw' }),
  KEY(1.2, { ...TUCK, lean: -TAU - Math.PI, tip: 6, sink: 8, front: [3, -5], back: [2, -5], closed: C2, mouth: 'mochiw' }),
  KEY(1.38, { ...TUCK, lean: -TAU - Math.PI * 1.6, tip: 6, sink: 8, front: [3, -5], back: [2, -5], closed: C2, mouth: 'mochiw' }),
  KEY(1.45, { lean: 0.15 - 2 * TAU, squat: 1, front: [8, -10], back: [-8, -10], brows: WORRY, mouth: 'gasp' }),
]);
// Over the bales backwards, arms going round, onto its bottom on the floor below.
const sumotumble = act(0.55, null, [
  KEY(0, { lean: 0.15, squat: 0.6, front: [6, -14], back: [-6, -12], brows: WORRY, mouth: 'gasp', extra: ['bang1'] }),
  KEY(0.1, { lean: -0.2, front: [-5, -14], back: [8, -13], legF: [2.6, -2.4, 44], brows: WORRY, mouth: 'gasp' }),
  KEY(0.22, { lean: -0.6, tip: 3, sink: 3, legF: [2.8, -3, 50], legB: [1, -2, 30], front: [6, -13], back: [-6, -14], mouth: 'mochio', ease: 'in' }),
  KEY(0.42, { ...SAT, tip: 6, lean: -0.8, sink: 9, front: [-4, -10], back: [5, -12], closed: C2, mouth: 'mochio', ease: 'in' }),
  KEY(0.55, { ...DAZED, extra: ['orbit'] }),
]);
// Tripped over the ducker: a dive, sailing over the bales, flat on its face on the floor below.
const sumotrip = act(1.27, null, [
  KEY(0, { ...CROUCH }),
  KEY(0.12, { ...PUSH, squat: 0.6, lean: 0.5, lift: 1, legB: [-3.8, -0.6, -40], front: [12, -8], back: [10, -7], mouth: 'yell', ease: 'out' }),
  KEY(0.24, { ...PUSH, lean: 0.65, front: [12, -9], back: [10, -8], mouth: 'gasp', wide: true }),
  KEY(0.34, { lean: 1.0, legB: [-1.4, -3, -60], front: [8, -14], back: [-6, -13], brows: WORRY, mouth: 'gasp', extra: ['bang1'] }),
  KEY(0.62, { lean: 1.3, tip: 5.5, sink: 5.5, legF: [-2, -2, -40], legB: [-3, -2.4, -50], front: [12, -6], back: [10, -5], mouth: 'mochio' }),
  KEY(0.95, { lean: 1.4, tip: 5.5, sink: 5.5, legF: [-2, -2, -40], legB: [-3, -2.4, -50], front: [12, -6], back: [10, -5], mouth: 'mochio', ease: 'in' }),
  KEY(1.12, { tip: 6, lean: Math.PI / 2, sink: 17.4, front: [9, -2], back: [8, -3], closed: C2, mouth: 'mochiw', ease: 'in' }),
  KEY(1.2, { tip: 6, lean: Math.PI / 2, sink: 15.6, lift: 2, front: [9, -4], back: [8, -4], legF: [1, -3, 40], legB: [1, -2.6, 30], closed: C2, mouth: 'mochiw', ease: 'out' }),
  KEY(1.27, { tip: 6, lean: Math.PI / 2, sink: 17.4, front: [9, -2], back: [8, -2], closed: C2, mouth: 'mochiw', extra: ['orbit'] }),
]);
// Sat on the floor: stars going round, a shake of the head, a sheepish giggle, and up.
const dazedKeys = (t0) => [
  KEY(t0, { ...DAZED, extra: ['orbit'], spiral: 1, tilt: 10 }),
  KEY(t0 + 0.08, { ...DAZED, sink: 6.4, extra: ['orbit'], spiral: 1, tilt: 10 }),
  KEY(t0 + 0.3, { ...DAZED, extra: ['orbit'], spiral: 2, tilt: -10 }),
  KEY(t0 + 0.6, { ...DAZED, extra: ['orbit'], spiral: 1, tilt: 8 }),
  KEY(t0 + 0.85, { ...DAZED, front: [3, -12], back: [-3, -12], mouth: 'mochio', tilt: 0 }),
  KEY(t0 + 1.05, { ...DAZED, closed: C2, mouth: 'D', blush: 1.8, extra: ['sweat0'] }),
  KEY(t0 + 1.25, { squat: 1.2, front: [4, -7], back: [3, -7], mouth: 'mochiw', ease: 'out' }),
  KEY(t0 + 1.35, { mouth: 'mochiw' }),
];
const sumodazed = act(1.35, null, dazedKeys(0));
// (Off its face first, then the same.)
const sumodazed2 = act(1.6, null, [
  KEY(0, { tip: 6, lean: Math.PI / 2, sink: 17.4, front: [9, -2], back: [8, -2], closed: C2, mouth: 'mochiw', extra: ['orbit'] }),
  KEY(0.1, { ...SAT, tip: 6, lean: 0.9, sink: 9.3, front: [6, 2], back: [5, 2], mouth: 'wavy', extra: ['orbit'], ease: 'out' }),
  KEY(0.18, { ...SAT, tip: 6, lean: 0.4, sink: 4, front: [4, 2], back: [3, 2], mouth: 'wavy', extra: ['orbit'] }),
  ...dazedKeys(0.25),
]);

const sumowin = act(1.5, null, [
  KEY(0, {}),
  KEY(0.15, { squat: 1.2, ...FISTS, brows: SET, mouth: 'smirk' }),
  KEY(0.35, { lift: 1.6, front: [5, -16], back: [-4, -8], mouth: 'D', closed: C2, extra: ['spark0'], ease: 'out' }),
  KEY(0.55, { squat: 0.8, ...FISTS, mouth: 'D', ease: 'in' }),
  KEY(0.75, { lift: 1.2, front: [5, -16], back: [-4, -15], mouth: 'D', closed: C2, extra: ['spark1'], sprout: 'excited', ease: 'out' }),
  KEY(1.0, { front: [8, -12], back: [-8, -12], mouth: 'D', closed: C2 }),
  KEY(1.5, {}),
]);

// ---------- The referee, his fan (`swing`: its angle, 0 out level, up past -1) ----------
const FAN = { hold: 'gunbai' };
const gyojiready = act(1.3, [0.3, 1.1], [
  KEY(0, { ...FAN, front: [6, -7], back: [-3, -6], swing: 0.5 }),
  KEY(0.3, { ...FAN, front: [9, -9], back: [-3, -6], swing: 0, squat: 0.6, brows: SET, mouth: 'mochiflat', ease: 'out' }),
  KEY(0.7, { ...FAN, front: [9, -9], back: [-3, -6], swing: 0, squat: 0.9, bob: 0.4, brows: SET, mouth: 'mochiflat' }),
  KEY(1.1, { ...FAN, front: [9, -9], back: [-3, -6], swing: 0, squat: 0.6, brows: SET, mouth: 'mochiflat' }),
  KEY(1.3, { ...FAN, front: [9, -9], back: [-3, -6], swing: 0, squat: 0.6, brows: SET, mouth: 'mochiflat' }),
]);
const gyojicall = act(1.0, null, [
  KEY(0, { ...FAN, front: [9, -9], back: [-3, -6], swing: 0, squat: 0.6, brows: SET, mouth: 'mochiflat' }),
  KEY(0.12, { ...FAN, front: [5, -17], back: [-4, -8], swing: -1.3, lift: 0.6, mouth: 'yell', extra: ['bang1'], ease: 'out' }),
  KEY(0.5, { ...FAN, front: [6, -15], back: [-4, -7], swing: -1.1, mouth: 'yell' }),
  KEY(1.0, { ...FAN, front: [8, -11], back: [-3, -6], swing: -0.5, mouth: 'mochio' }),
]);
const gyojipoint = act(2.4, [0.4, 2.0], [
  KEY(0, { ...FAN, front: [8, -11], back: [-3, -6], swing: -0.5 }),
  KEY(0.2, { ...FAN, front: [13, -15], back: [-4, -6], swing: -0.7, lift: 0.4, mouth: 'D', ease: 'out' }),
  KEY(0.4, { ...FAN, front: [12, -14], back: [-4, -6], swing: -0.65, mouth: 'smirk' }),
  KEY(1.2, { ...FAN, front: [12, -14], back: [-4, -6], swing: -0.65, bob: 0.4, mouth: 'smirk' }),
  KEY(2.0, { ...FAN, front: [12, -14], back: [-4, -6], swing: -0.65, mouth: 'smirk' }),
  KEY(2.4, { ...FAN, front: [6, -7], back: [-3, -6], swing: 0.4 }),
]);

// Losing a garden match (world/garden-life.js): no ring to fall from - it plops back onto its bottom
// on the grass, legs up, a bounce, a giggle, and gets up.
const sumoplop = act(1.6, null, [
  KEY(0, { ...BRACE }),
  KEY(0.12, { lean: -0.1, squat: 0.6, front: [-4, -13], back: [7, -12], brows: WORRY, mouth: 'gasp', extra: ['bang1'] }),
  KEY(0.3, { ...SAT, tip: 6, lean: -0.5, sink: 6.4, legF: [3.8, -3, 50], legB: [2.6, -2.6, 40], front: [6, -10], back: [-4, -10], mouth: 'mochio', ease: 'in' }),
  KEY(0.42, { ...SAT, tip: 6, lean: -0.3, sink: 5.4, front: [5, -4], back: [3, -4], closed: C2, mouth: 'mochiw', ease: 'out' }),
  KEY(0.52, { ...SAT, tip: 6, lean: -0.32, sink: 6, front: [5, -4], back: [3, -4], closed: C2, mouth: 'mochiw' }),
  KEY(0.8, { ...SAT, tip: 6, lean: -0.2, sink: 5.4, front: [3, -8], back: [2, -8], closed: C2, mouth: 'D', blush: 1.8, extra: ['sweat0'] }),
  KEY(1.1, { ...SAT, tip: 6, lean: -0.2, sink: 5.4, front: [3, -8], back: [2, -8], closed: C2, mouth: 'D', blush: 1.8, tilt: 6 }),
  KEY(1.35, { squat: 1.4, front: [4, -7], back: [3, -7], mouth: 'mochiw', ease: 'out' }),
  KEY(1.6, { mouth: 'mochiw' }),
]);

export const SUMO_ACTS = { sumohop, sumoshiko, sumosalt, sumocrouch, sumocharge, sumopush, sumobrace, sumobelly, sumothrust, sumodrive, sumolift, sumothrow, sumoduck, sumolifted, sumoflung, sumotumble, sumotrip, sumodazed, sumodazed2, sumowin, sumoplop, gyojiready, gyojicall, gyojipoint };

// The referee's fan (a gunbai): a lacquered gourd-shaped paddle, black with a gold rim and a gold
// sun, on a short red-wrapped handle, a purple tassel swinging under it. Held at (x, y), `d` the way
// he faces, `a` its angle (0 out level ahead of him, negative up).
export function drawGunbai(ctx, x, y, k, d, a = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(d * k, k);
  ctx.rotate(a);
  // The handle, out of his paw.
  ctx.fillStyle = '#b8402e';
  ctx.fillRect(-1, -0.8, 5, 1.6);
  ctx.fillStyle = '#e8c060';
  ctx.fillRect(3.6, -1, 0.9, 2);
  // The tassel, hanging from the handle's end.
  ctx.save();
  ctx.rotate(-a);
  ctx.fillStyle = '#8a4ab8';
  ctx.beginPath();
  ctx.moveTo(-1.2, 0.6);
  ctx.quadraticCurveTo(-1.8, 2.6, -1.2, 4.8);
  ctx.lineTo(-0.2, 4.8);
  ctx.quadraticCurveTo(-0.4, 2.6, -0.4, 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c890f0';
  ctx.fillRect(-1.2, 4.2, 1, 0.8);
  ctx.restore();
  // The paddle: a gourd shape, its neck at the handle.
  const paddle = () => {
    ctx.beginPath();
    ctx.moveTo(4.4, -1.4);
    ctx.bezierCurveTo(6.4, -2.4, 6.4, -5.6, 9.6, -5.8);
    ctx.bezierCurveTo(14.2, -6, 15.4, -2.6, 15.4, 0);
    ctx.bezierCurveTo(15.4, 2.6, 14.2, 6, 9.6, 5.8);
    ctx.bezierCurveTo(6.4, 5.6, 6.4, 2.4, 4.4, 1.4);
    ctx.closePath();
  };
  paddle();
  ctx.fillStyle = '#e2b04a';
  ctx.fill();
  ctx.save();
  ctx.translate(10, 0);
  ctx.scale(0.86, 0.84);
  ctx.translate(-10, 0);
  paddle();
  ctx.fillStyle = '#2a1e2a';
  ctx.fill();
  ctx.restore();
  // Its gold sun, and a glint along the lacquer.
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.arc(10.4, 0, 2.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(9.4, -3.4, 2.6, 0.7, -0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}
