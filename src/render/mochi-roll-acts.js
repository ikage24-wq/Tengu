// Rolling a snowball up Mochitsuki Mountain's slope (world/mochi-race.js 'roll', 2026-11-16): paws to
// the ball, pushing it up the hill, each range of Power its own way (by styleOf(power), roll0-5),
// and a weak one's slip back and dig in (roll_slip). Keyed like every other act (render/mochi-anim.js
// ACTIONS: crisp, 48 drawings a second, flowing, a little bounce as each pose lands); each loops one
// push beat (world/mochi-race.js ROLL_BEAT) for as long as it pushes, kept in time with the race's
// clock by render/race.js, so the strong ones' shoves land just as the ball surges.
//
//   0  too heavy  leaning all its weight in, eyes squeezed shut, sweating, tiny steps
//   1  careful    little steady steps, set brows
//   2  steady     a bouncy step, humming
//   3  strong     a wind-up and a big shove each beat
//   4  jumping    a hop and a two-paw shove each beat
//   5  show-off   one paw on the ball, the other waving to the crowd, skipping along

const KEY = (t, o) => [t, o];
const C2 = [true, true];
const SET = [[-0.4, 0.8], [-0.4, 0.8]];
const WORRY = [[0.5, -0.7], [0.5, -0.7]];
const act = (dur, loop, keys) => ({ dur, loop, crisp: true, fps: 48, flow: true, keys });

// Paws on the ball at chest height, leaning into it; and its feet, a step at a time.
// (Chibi arms are short and the lean is what reads at race size: all in, arms at full stretch.)
const PUSH = (o = {}) => ({ front: [12.5, -9], back: [11.5, -9.5], lean: 0.38, squat: 0.8, glance: 1, ...o });
const STEP_A = (k = 1) => ({ legF: [2.6 * k, 0, 14 * k], legB: [-4 * k, -0.7 * k, -40 * k] });
const STEP_B = (k = 1) => ({ legF: [-3.6 * k, -0.7 * k, -36 * k], legB: [2.4 * k, 0, 12 * k] });
const PASS = { legF: [0.2, -1.1, 2], legB: [-0.2, -0.5, -2] };

// 0: too heavy for it - all its weight in, a tiny step, a strain, the other tiny step.
const roll0 = act(1.4, [0.2, 1.2], [
  KEY(0, {}),
  KEY(0.2, PUSH({ front: [11.5, -8], back: [10.5, -8], lean: 0.46, squat: 1.4, brows: WORRY, mouth: 'grit', extra: ['sweat0'] })),
  KEY(0.45, PUSH({ front: [11.5, -8], back: [10.5, -8], lean: 0.5, squat: 1.6, hy: 0.8, ...STEP_A(0.6), brows: WORRY, closed: C2, mouth: 'mochiflat', extra: ['sweat0'] })),
  KEY(0.7, PUSH({ front: [11.5, -8], back: [10.5, -8], lean: 0.46, squat: 1.4, hy: 0.2, ...PASS, brows: WORRY, mouth: 'grit' })),
  KEY(0.95, PUSH({ front: [11.5, -8], back: [10.5, -8], lean: 0.5, squat: 1.6, hy: 0.8, ...STEP_B(0.6), brows: WORRY, closed: C2, mouth: 'mochiflat', extra: ['sweat0'] })),
  KEY(1.2, PUSH({ front: [11.5, -8], back: [10.5, -8], lean: 0.46, squat: 1.4, brows: WORRY, mouth: 'grit', extra: ['sweat0'] })),
  KEY(1.4, {}),
]);

// 1: careful - little steady steps, a small bob on each.
const roll1 = act(1.3, [0.2, 1.1], [
  KEY(0, {}),
  KEY(0.2, PUSH({ brows: SET, mouth: 'mochio' })),
  KEY(0.425, PUSH({ ...STEP_A(0.8), lift: 0.3, brows: SET, mouth: 'mochio', ease: 'out' })),
  KEY(0.65, PUSH({ ...PASS, squat: 0.9, brows: SET, mouth: 'mochiflat', ease: 'in' })),
  KEY(0.875, PUSH({ ...STEP_B(0.8), lift: 0.3, brows: SET, mouth: 'mochio', ease: 'out' })),
  KEY(1.1, PUSH({ brows: SET, mouth: 'mochio', ease: 'in' })),
  KEY(1.3, {}),
]);

// 2: steady - a bouncy step, swaying, humming a tune as it goes.
const roll2 = act(1.2, [0.2, 1.0], [
  KEY(0, {}),
  KEY(0.2, PUSH({ mouth: 'mochiw', tilt: -2 })),
  KEY(0.4, PUSH({ ...STEP_A(), lift: 0.9, tilt: 3, mouth: 'mochiw', extra: ['note'], ease: 'out' })),
  KEY(0.6, PUSH({ ...PASS, squat: 0.9, tilt: 0, mouth: 'mochiw', closed: C2, ease: 'in' })),
  KEY(0.8, PUSH({ ...STEP_B(), lift: 0.9, tilt: -3, mouth: 'mochiw', extra: ['note'], ease: 'out' })),
  KEY(1.0, PUSH({ mouth: 'mochiw', tilt: -2, ease: 'in' })),
  KEY(1.2, {}),
]);

// 3: strong - a wind-up, and a big shove with its whole body (the ball surges), a stride after it.
const roll3 = act(1.2, [0.2, 1.0], [
  KEY(0, {}),
  KEY(0.2, PUSH({ brows: SET, mouth: 'grit' })),
  KEY(0.3, PUSH({ front: [8, -9.5], back: [7, -10], lean: 0.2, squat: 1.2, ...PASS, brows: SET, mouth: 'grit', ease: 'out' })),
  KEY(0.54, PUSH({ front: [14, -9.5], back: [13, -10], lean: 0.62, squat: 0.4, legF: [2.8, 0, 16], legB: [-5, -0.5, -50], brows: SET, mouth: 'D', extra: ['bang0'], ease: 'in' })),
  KEY(0.66, PUSH({ front: [13.5, -9.5], back: [12.5, -10], lean: 0.58, squat: 0.5, legF: [2.8, 0, 16], legB: [-5, -0.5, -50], brows: SET, mouth: 'D' })),
  KEY(0.84, PUSH({ ...STEP_B(), lean: 0.4, lift: 0.6, brows: SET, mouth: 'grit', ease: 'out' })),
  KEY(1.0, PUSH({ brows: SET, mouth: 'grit', ease: 'in' })),
  KEY(1.2, {}),
]);

// 4: jumping - down into a crouch, and a hop with a two-paw shove at the top of it; down again.
const roll4 = act(1.1, [0.2, 0.9], [
  KEY(0, {}),
  KEY(0.2, PUSH({ mouth: 'D', brows: SET })),
  KEY(0.3, PUSH({ squat: 1.8, lean: 0.28, front: [10, -8.5], back: [9, -9], ...PASS, mouth: 'mochio', brows: SET, ease: 'in' })),
  KEY(0.48, PUSH({ lift: 3.2, squat: 0, lean: 0.56, front: [14, -11], back: [13, -11.5], legF: [-1.6, -2.2, -28], legB: [-3, -1.6, -40], mouth: 'D', brows: SET, extra: ['spark0'], ease: 'out' })),
  KEY(0.66, PUSH({ lift: 0, squat: 1.2, lean: 0.42, front: [12.5, -9.5], back: [11.5, -10], ...STEP_A(), mouth: 'D', ease: 'in' })),
  KEY(0.9, PUSH({ mouth: 'D', brows: SET })),
  KEY(1.1, {}),
]);

// 5: show-off - one paw rolling it along, the other waving to the crowd, skipping and grinning.
const SHOW = (o = {}) => PUSH({ front: [13, -10.5], back: [-5, -19], lean: 0.22, squat: 0.3, glance: -1, ...o });
const roll5 = act(1.1, [0.2, 0.9], [
  KEY(0, {}),
  KEY(0.2, SHOW({ mouth: 'smirk', lid: 0.35, sprout: 'happy' })),
  KEY(0.375, SHOW({ back: [-7, -17], ...STEP_A(0.8), lift: 1.4, tilt: -5, mouth: 'grin', sprout: 'happy', extra: ['spark0'], ease: 'out' })),
  KEY(0.55, SHOW({ back: [-4, -20], ...PASS, squat: 0.6, tilt: 0, mouth: 'smirk', lid: 0.35, sprout: 'happy', ease: 'in' })),
  KEY(0.725, SHOW({ back: [-7, -17], ...STEP_B(0.8), lift: 1.4, tilt: 5, mouth: 'grin', sprout: 'happy', ease: 'out' })),
  KEY(0.9, SHOW({ mouth: 'smirk', lid: 0.35, sprout: 'happy', ease: 'in' })),
  KEY(1.1, {}),
]);

// A slip: the ball rolls back on it - skidding back, eyes wide - and it digs its heels in again.
const roll_slip = act(0.7, null, [
  KEY(0, PUSH({ brows: WORRY, mouth: 'grit' })),
  KEY(0.12, PUSH({ front: [10, -9], back: [9, -9.5], lean: -0.08, squat: 0.4, legF: [3, 0, 20], legB: [2.4, 0, 16], wide: true, mouth: 'o', brows: WORRY, extra: ['bang0'], ease: 'out' })),
  KEY(0.42, PUSH({ front: [12, -8.5], back: [11, -8.5], lean: 0.54, squat: 1.7, legF: [2.8, 0, 16], legB: [-5, -0.5, -50], closed: C2, mouth: 'grit', brows: WORRY, extra: ['sweat0'] })),
  KEY(0.7, PUSH({ brows: WORRY, mouth: 'grit' })),
]);

export const ROLL_ACTS = { roll0, roll1, roll2, roll3, roll4, roll5, roll_slip };
