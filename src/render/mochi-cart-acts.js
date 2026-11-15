// Hauling a rice cart up Mochitsuki Mountain's slope (world/mochi-race.js 'cart', 2026-11-16): between
// the shafts, paws on the crossbar at its tummy, leaning into the haul, each range of Power its own
// way (by styleOf(power), cart0-5), and a weak one heaving a wheel free of a rut (cart_stuck). Keyed
// like every other act (render/mochi-anim.js ACTIONS: crisp, 48 drawings a second, flowing, a little
// bounce as each pose lands); each loops one step-and-tug (data/mochi-race.js CART_BEAT) for as long
// as it hauls, kept in time with the race's clock by render/race.js, so the strong ones' tugs land
// just as the cart surges.
//
//   0  too heavy  leaning all its weight in, eyes squeezed shut, sweating, tiny steps
//   1  careful    little steady steps, set brows
//   2  steady     a bouncy step, humming
//   3  strong     a lean back and a big tug each beat, striding
//   4  jumping    a hop and a tug at the top of it each beat
//   5  show-off   one paw on the crossbar, the other waving to the crowd, strolling along

const KEY = (t, o) => [t, o];
const C2 = [true, true];
const SET = [[-0.4, 0.8], [-0.4, 0.8]];
const WORRY = [[0.5, -0.7], [0.5, -0.7]];
const act = (dur, loop, keys) => ({ dur, loop, crisp: true, fps: 48, flow: true, keys });

// Paws on the crossbar in front of its tummy, leaning into the haul; and its feet, a step at a time.
const HAUL = (o = {}) => ({ front: [10, -4], back: [9, -4.5], lean: 0.4, squat: 0.8, glance: 1, ...o });
const STEP_A = (k = 1) => ({ legF: [2.6 * k, 0, 14 * k], legB: [-4 * k, -0.7 * k, -40 * k] });
const STEP_B = (k = 1) => ({ legF: [-3.6 * k, -0.7 * k, -36 * k], legB: [2.4 * k, 0, 12 * k] });
const PASS = { legF: [0.2, -1.1, 2], legB: [-0.2, -0.5, -2] };

// 0: too heavy for it - all its weight in, a tiny step, a strain, the other tiny step.
const cart0 = act(1.4, [0.2, 1.2], [
  KEY(0, {}),
  KEY(0.2, HAUL({ front: [9.5, -3.5], back: [8.5, -3.5], lean: 0.48, squat: 1.4, brows: WORRY, mouth: 'grit', extra: ['sweat0'] })),
  KEY(0.45, HAUL({ front: [9.5, -3.5], back: [8.5, -3.5], lean: 0.52, squat: 1.6, hy: 0.8, ...STEP_A(0.6), brows: WORRY, closed: C2, mouth: 'mochiflat', extra: ['sweat0'] })),
  KEY(0.7, HAUL({ front: [9.5, -3.5], back: [8.5, -3.5], lean: 0.48, squat: 1.4, hy: 0.2, ...PASS, brows: WORRY, mouth: 'grit' })),
  KEY(0.95, HAUL({ front: [9.5, -3.5], back: [8.5, -3.5], lean: 0.52, squat: 1.6, hy: 0.8, ...STEP_B(0.6), brows: WORRY, closed: C2, mouth: 'mochiflat', extra: ['sweat0'] })),
  KEY(1.2, HAUL({ front: [9.5, -3.5], back: [8.5, -3.5], lean: 0.48, squat: 1.4, brows: WORRY, mouth: 'grit', extra: ['sweat0'] })),
  KEY(1.4, {}),
]);

// 1: careful - little steady steps, a small bob on each.
const cart1 = act(1.3, [0.2, 1.1], [
  KEY(0, {}),
  KEY(0.2, HAUL({ brows: SET, mouth: 'mochio' })),
  KEY(0.425, HAUL({ ...STEP_A(0.8), lift: 0.3, brows: SET, mouth: 'mochio', ease: 'out' })),
  KEY(0.65, HAUL({ ...PASS, squat: 0.9, brows: SET, mouth: 'mochiflat', ease: 'in' })),
  KEY(0.875, HAUL({ ...STEP_B(0.8), lift: 0.3, brows: SET, mouth: 'mochio', ease: 'out' })),
  KEY(1.1, HAUL({ brows: SET, mouth: 'mochio', ease: 'in' })),
  KEY(1.3, {}),
]);

// 2: steady - a bouncy step, swaying, humming a tune as it goes.
const cart2 = act(1.2, [0.2, 1.0], [
  KEY(0, {}),
  KEY(0.2, HAUL({ mouth: 'mochiw', tilt: -2 })),
  KEY(0.4, HAUL({ ...STEP_A(), lift: 0.9, tilt: 3, mouth: 'mochiw', extra: ['note'], ease: 'out' })),
  KEY(0.6, HAUL({ ...PASS, squat: 0.9, tilt: 0, mouth: 'mochiw', closed: C2, ease: 'in' })),
  KEY(0.8, HAUL({ ...STEP_B(), lift: 0.9, tilt: -3, mouth: 'mochiw', extra: ['note'], ease: 'out' })),
  KEY(1.0, HAUL({ mouth: 'mochiw', tilt: -2, ease: 'in' })),
  KEY(1.2, {}),
]);

// 3: strong - a sit back on its heels, and a big tug with its whole body (the cart surges), a stride
// after it.
const cart3 = act(1.2, [0.2, 1.0], [
  KEY(0, {}),
  KEY(0.2, HAUL({ brows: SET, mouth: 'grit' })),
  KEY(0.3, HAUL({ front: [7, -4.5], back: [6, -5], lean: 0.18, squat: 1.2, ...PASS, brows: SET, mouth: 'grit', ease: 'out' })),
  KEY(0.54, HAUL({ front: [11, -4], back: [10, -4.5], lean: 0.64, squat: 0.4, legF: [2.8, 0, 16], legB: [-5, -0.5, -50], brows: SET, mouth: 'D', extra: ['bang0'], ease: 'in' })),
  KEY(0.66, HAUL({ front: [11, -4], back: [10, -4.5], lean: 0.6, squat: 0.5, legF: [2.8, 0, 16], legB: [-5, -0.5, -50], brows: SET, mouth: 'D' })),
  KEY(0.84, HAUL({ ...STEP_B(), lean: 0.42, lift: 0.6, brows: SET, mouth: 'grit', ease: 'out' })),
  KEY(1.0, HAUL({ brows: SET, mouth: 'grit', ease: 'in' })),
  KEY(1.2, {}),
]);

// 4: jumping - down into a crouch, and a hop with a tug at the top of it; down again.
const cart4 = act(1.1, [0.2, 0.9], [
  KEY(0, {}),
  KEY(0.2, HAUL({ mouth: 'D', brows: SET })),
  KEY(0.3, HAUL({ squat: 1.8, lean: 0.3, front: [8.5, -3.5], back: [7.5, -4], ...PASS, mouth: 'mochio', brows: SET, ease: 'in' })),
  KEY(0.48, HAUL({ lift: 3.2, squat: 0, lean: 0.56, front: [11, -5], back: [10, -5.5], legF: [-1.6, -2.2, -28], legB: [-3, -1.6, -40], mouth: 'D', brows: SET, extra: ['spark0'], ease: 'out' })),
  KEY(0.66, HAUL({ lift: 0, squat: 1.2, lean: 0.44, ...STEP_A(), mouth: 'D', ease: 'in' })),
  KEY(0.9, HAUL({ mouth: 'D', brows: SET })),
  KEY(1.1, {}),
]);

// 5: show-off - one paw hauling it along, the other waving to the crowd, strolling and grinning.
const SHOW = (o = {}) => HAUL({ front: [10.5, -4.5], back: [-5, -19], lean: 0.24, squat: 0.3, glance: -1, ...o });
const cart5 = act(1.1, [0.2, 0.9], [
  KEY(0, {}),
  KEY(0.2, SHOW({ mouth: 'smirk', lid: 0.35, sprout: 'happy' })),
  KEY(0.375, SHOW({ back: [-7, -17], ...STEP_A(0.8), lift: 1.4, tilt: -5, mouth: 'grin', sprout: 'happy', extra: ['spark0'], ease: 'out' })),
  KEY(0.55, SHOW({ back: [-4, -20], ...PASS, squat: 0.6, tilt: 0, mouth: 'smirk', lid: 0.35, sprout: 'happy', ease: 'in' })),
  KEY(0.725, SHOW({ back: [-7, -17], ...STEP_B(0.8), lift: 1.4, tilt: 5, mouth: 'grin', sprout: 'happy', ease: 'out' })),
  KEY(0.9, SHOW({ mouth: 'smirk', lid: 0.35, sprout: 'happy', ease: 'in' })),
  KEY(1.1, {}),
]);

// Stuck: the cart jerks to a stop - eyes wide - a sit back to gather itself, and a great heave that
// pulls the wheel up out of the rut.
const cart_stuck = act(0.9, null, [
  KEY(0, HAUL({ brows: WORRY, mouth: 'grit' })),
  KEY(0.12, HAUL({ front: [8, -4.5], back: [7, -5], lean: 0.08, squat: 0.4, wide: true, mouth: 'o', brows: WORRY, extra: ['bang0'], ease: 'out' })),
  KEY(0.4, HAUL({ front: [7, -4.5], back: [6, -5], lean: -0.14, squat: 1.5, ...PASS, closed: C2, mouth: 'grit', brows: WORRY, extra: ['sweat0'], ease: 'in' })),
  KEY(0.62, HAUL({ front: [11, -4], back: [10, -4.5], lean: 0.66, squat: 0.4, legF: [2.8, 0, 16], legB: [-5, -0.5, -50], mouth: 'D', brows: WORRY, extra: ['sweat1'], ease: 'out' })),
  KEY(0.9, HAUL({ brows: WORRY, mouth: 'grit' })),
]);

export const CART_ACTS = { cart0, cart1, cart2, cart3, cart4, cart5, cart_stuck };
