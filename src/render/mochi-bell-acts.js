// Ringing a temple bell on Mochitsuki Mountain (world/mochi-race.js 'bell', 2026-11-16): paws on the
// pull-rope, the striker log hauled back and driven into the bell, each range of Power its own way (by
// styleOf(power), bell0-5). Keyed like every other act (render/mochi-anim.js ACTIONS: crisp, 48
// drawings a second, flowing, a little bounce as each pose lands); each loops one pull-and-strike
// (data/mochi-race.js BELL_L) for as long as it's ringing, kept in time with the race's clock by
// render/race.js, so the log (bellSwing, here, drawn by render/race.js) meets the bell just as the
// move drives it home. While its paws are on the rope (`hold: 'bellrope'`) where they are is noted,
// for the rope to be drawn to them.
//
//   0  too heavy  hanging off the rope with all its weight, eyes squeezed shut; a little "bonk"
//   1  careful    a careful pull, and paws to its ears for the gong
//   2  steady     pulling to its own tune, humming, a bounce on the boom
//   3  strong     hauled right back, braced, and one big heave into it
//   4  jumping    a jump to grab the rope high, riding it back down, a hop to drive it home
//   5  show-off   one paw, a fling, and it turns its back to pose as the bell booms behind it

import { BELL_L, BELL_PULL, BELL_GO, BELL_AT } from '../data/mochi-race.js';

const KEY = (t, o) => [t, o];
const C2 = [true, true];
const SET = [[-0.4, 0.8], [-0.4, 0.8]];
const WORRY = [[0.5, -0.7], [0.5, -0.7]];
const ROPE = 'bellrope';

// A pull-and-strike, keyed by where in it each pose falls (0-1 of its length), looping round whole.
const ring = (tier, keys) => {
  const L = BELL_L[tier];
  return { dur: L, loop: [0, L], crisp: true, fps: 48, flow: true, keys: [KEY(0, { hold: ROPE, ...keys[0][1] }), ...keys.slice(1).map(([f, o]) => KEY(Math.round(f * L * 1000) / 1000, o))] };
};

// Paws on the rope by its chest; up for a fresh grip; hauled back with its weight on its heels; and
// following the rope through as the log swings home.
const READY = (o = {}) => ({ front: [6, -10], back: [5, -10], glance: 1, ...o });
const REACH = (o = {}) => ({ front: [10, -14], back: [9, -14], lean: 0.12, glance: 1, ...o });
const BACK = { legF: [2.4, 0, 18], legB: [-3.4, -0.6, -30] };
const PULL = (o = {}) => ({ front: [3, -8], back: [2, -8], lean: -0.32, squat: 0.8, ...BACK, ...o });
const FWD = { legF: [2.6, 0, 14], legB: [-4, -0.7, -40] };
const DRIVE = (o = {}) => ({ front: [12, -12], back: [11, -12], lean: 0.3, ...FWD, ...o });
const EARS = (o = {}) => ({ front: [0, -16], back: [1, -16], ...o });

// 0: too heavy - it hangs off the rope with all its weight, eyes squeezed shut, and the log hardly
// moves; let go, it barely taps the bell: a little "bonk", a flinch, a sweaty sigh.
const bell0 = ring(0, [
  [0, READY({ brows: WORRY, mouth: 'mochio' })],
  [0.12, REACH({ front: [9, -13], back: [8, -13], lean: 0.06, brows: WORRY, mouth: 'mochio' })],
  [0.3, PULL({ lean: -0.42, squat: 1.6, tilt: -4, brows: WORRY, mouth: 'grit', closed: C2, extra: ['sweat0'] })],
  [BELL_PULL[0], PULL({ front: [2, -7], back: [1, -7], lean: -0.48, squat: 1.8, tilt: -6, brows: WORRY, mouth: 'grit', closed: C2, extra: ['sweat1'] })],
  [BELL_GO[0], { front: [8, -11], back: [7, -11], lean: 0.12, squat: 0.6, brows: WORRY, mouth: 'mochio', ease: 'out' }],
  [BELL_AT[0], DRIVE({ front: [10, -11], back: [9, -11], lean: 0.22, brows: WORRY, mouth: 'o', wide: true, ease: 'in' })],
  [0.76, { front: [6, -9], back: [5, -9], lean: -0.04, squat: 0.8, brows: WORRY, mouth: 'wavy', closed: C2 }],
  [0.9, READY({ brows: WORRY, mouth: 'mochiflat', extra: ['sweat0'], ease: 'in' })],
  [1, READY({ brows: WORRY, mouth: 'mochio' })],
]);

// 1: careful - a steady pull, tongue out; it sends the log on its way and claps its paws to its
// ears, eyes shut, for the gong.
const bell1 = ring(1, [
  [0, READY({ brows: SET, mouth: 'mochio' })],
  [0.12, REACH({ brows: SET, mouth: 'mochio' })],
  [BELL_PULL[1], PULL({ brows: SET, mouth: 'tongue' })],
  [BELL_GO[1], DRIVE({ lean: 0.26, brows: SET, mouth: 'mochio', ease: 'out' })],
  [BELL_GO[1] + 0.07, EARS({ hold: null, lean: 0.04, squat: 0.8, brows: SET, mouth: 'mochio', closed: C2, ease: 'in' })],
  [BELL_AT[1], EARS({ squat: 1.2, tilt: 4, hy: 0.8, brows: WORRY, mouth: 'wavy', closed: C2 })],
  [0.8, EARS({ squat: 0.8, tilt: -3, brows: WORRY, mouth: 'wavy', closed: C2 })],
  [0.92, READY({ hold: ROPE, lift: 0.3, brows: SET, mouth: 'mochio', ease: 'out' })],
  [1, READY({ brows: SET, mouth: 'mochio', ease: 'in' })],
]);

// 2: steady - pulling back to its own tune and swinging it home, humming, and a happy bounce on the
// boom.
const bell2 = ring(2, [
  [0, READY({ mouth: 'mochiw' })],
  [0.14, REACH({ tilt: -2, mouth: 'mochiw', extra: ['note'] })],
  [BELL_PULL[2], PULL({ tilt: 3, mouth: 'mochiw', closed: C2 })],
  [BELL_GO[2], DRIVE({ lean: 0.24, mouth: 'mochiw', ease: 'out' })],
  [BELL_AT[2], DRIVE({ lift: 0.8, mouth: 'D', closed: C2, extra: ['note'], ease: 'in' })],
  [0.76, DRIVE({ front: [9, -11], back: [8, -11], lean: 0.12, squat: 1, mouth: 'mochiw', closed: C2 })],
  [0.9, READY({ lift: 0.4, mouth: 'mochiw', ease: 'out' })],
  [1, READY({ mouth: 'mochiw', ease: 'in' })],
]);

// 3: strong - hauled right back with its heels dug in, then one big heave that drives the log
// home; braced as it booms.
const bell3 = ring(3, [
  [0, READY({ brows: SET, mouth: 'mochio' })],
  [0.1, REACH({ lean: 0.15, brows: SET, mouth: 'mochio' })],
  [BELL_PULL[3], PULL({ front: [1, -7], back: [0, -7], lean: -0.44, squat: 1.4, brows: SET, mouth: 'grit' })],
  [BELL_GO[3], { front: [7, -10], back: [6, -10], lean: 0.1, squat: 0.8, brows: SET, mouth: 'grit', ease: 'in' }],
  [BELL_AT[3], DRIVE({ front: [13, -12], back: [12, -12], lean: 0.44, squat: 0.4, brows: SET, mouth: 'D', extra: ['bang0'] })],
  [0.72, DRIVE({ lean: 0.34, squat: 0.6, brows: SET, mouth: 'D' })],
  [0.88, READY({ brows: SET, mouth: 'mochio', ease: 'out' })],
  [1, READY({ brows: SET, mouth: 'mochio' })],
]);

// 4: jumping - down, and a jump to grab the rope up high; it rides it back down, lands, and drives it
// home with a hop.
const bell4 = ring(4, [
  [0, READY({ mouth: 'D' })],
  [0.1, { front: [6, -8], back: [5, -8], squat: 1.6, lean: 0.06, mouth: 'D', ease: 'in' }],
  [0.2, { front: [9, -16], back: [8, -16], over: true, lift: 4, squat: 0, legF: [-1.6, -2.2, -28], legB: [-3, -1.6, -40], mouth: 'D', ease: 'out' }],
  [BELL_PULL[4], { front: [3, -12], back: [2, -12], lift: 1.6, lean: -0.36, legF: [2, -1, 20], legB: [0.6, -0.8, 10], mouth: 'D' }],
  [BELL_GO[4], PULL({ front: [5, -9], back: [4, -9], lean: -0.1, lift: 0, squat: 1.4, mouth: 'mochio', ease: 'in' })],
  [BELL_AT[4], DRIVE({ front: [13, -12], back: [12, -12], lean: 0.4, lift: 2, squat: 0, mouth: 'D', extra: ['spark0'], ease: 'out' })],
  [0.72, DRIVE({ lean: 0.2, lift: 0, squat: 1, look: 'up', mouth: 'D', ease: 'in' })],
  [0.88, READY({ mouth: 'D' })],
  [1, READY({ mouth: 'D' })],
]);

// 5: show-off - one paw on the rope, the other on its hip; a pull and a fling, and it turns its back
// on the bell, paw up, a wink, as it booms behind it.
const bell5 = ring(5, [
  [0, READY({ front: [6, -10], back: [-3, -4], mouth: 'smirk', lid: 0.35, sprout: 'happy' })],
  [0.1, REACH({ back: [-3, -4], mouth: 'smirk', lid: 0.35, sprout: 'happy' })],
  [BELL_PULL[5], PULL({ front: [3, -9], back: [-4, -4], lean: -0.3, mouth: 'smirk', sprout: 'happy' })],
  [BELL_GO[5], DRIVE({ front: [13, -13], back: [-4, -6], lean: 0.3, mouth: 'grin', sprout: 'happy', ease: 'out' })],
  [BELL_GO[5] + 0.07, { hold: null, turned: true, front: [-2, -15], back: [6, -6], lean: -0.06, closed: [false, true], mouth: 'grin', sprout: 'happy', ease: 'in' }],
  [BELL_AT[5], { turned: true, front: [-2, -16], back: [6, -6], lean: -0.08, lift: 0.4, closed: [false, true], mouth: 'grin', sprout: 'happy', extra: ['spark0'] }],
  [0.74, { turned: true, front: [-2, -15], back: [6, -6], lean: -0.06, mouth: 'smirk', lid: 0.35, sprout: 'happy' }],
  [0.88, READY({ hold: ROPE, turned: false, back: [-3, -4], mouth: 'smirk', sprout: 'happy', ease: 'out' })],
  [1, READY({ front: [6, -10], back: [-3, -4], mouth: 'smirk', lid: 0.35, sprout: 'happy' })],
]);

export const BELL_ACTS = { bell0, bell1, bell2, bell3, bell4, bell5 };

// ---------- The striker log ----------
// How far it swings (radians on its ropes; back is negative), by range: the weakest barely moves it.
const SWING = [0.26, 0.38, 0.46, 0.58, 0.62, 0.66];
// (At rest it hangs just short of the bell; at the strike it's against it.)
export const BELL_REST = -0.04;
export const BELL_HIT = 0.1;
const ease = (a, b, k, how) => a + (b - a) * (how === 'in' ? k * k : how === 'out' ? 1 - (1 - k) ** 2 : k * k * (3 - 2 * k));
// Its angle `u` (0-1) through a pull-and-strike: still while paws take the rope, hauled back, a beat
// held, let go and swinging in faster and faster to meet the bell, bouncing back off it, settling.
export function bellSwing(tier, u) {
  const A = SWING[tier];
  const grab = tier === 4 ? 0.2 : 0.1;
  const keys = [[0, BELL_REST], [grab, BELL_REST], [BELL_PULL[tier], -A], [BELL_GO[tier], -A * 0.96, 'in'], [BELL_AT[tier], BELL_HIT, 'in'], [BELL_AT[tier] + 0.12, -A * 0.22, 'out'], [0.94, BELL_REST], [1, BELL_REST]];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, how] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (u <= t1) return ease(v0, v1, Math.max(0, Math.min(1, (u - t0) / Math.max(1e-6, t1 - t0))), how);
  }
  return BELL_REST;
}

// Where its paws are on the rope (`m.anchors.bellPaw`, on the canvas), for render/race.js to draw it
// to them.
export function noteBellPaws(ctx, m, hand, other) {
  const t = ctx.getTransform?.();
  if (!m.anchors || !t) return;
  // (Both paws on it, between them; one paw on it - the other on its hip - the one out in front.)
  const [x, y] = Math.abs(hand[0] - other[0]) < 3 ? [(hand[0] + other[0]) / 2, (hand[1] + other[1]) / 2] : hand[0] > other[0] ? hand : other;
  m.anchors.bellPaw = [t.a * x + t.c * y + t.e, t.b * x + t.d * y + t.f];
}
