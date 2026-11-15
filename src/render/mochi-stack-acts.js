// Stacking a kagami-mochi on Mochitsuki Mountain (world/mochi-race.js 'stack', 2026-11-16): down into
// the tub at its feet for a piece, up with it, and onto the offering stand ahead - the big mochi, the
// small one, the orange on top - each range of Power its own way (by styleOf(power), stack0-5), and a
// weak one rushing to steady its stack when it wobbles (stack_steady). Keyed like every other act
// (render/mochi-anim.js ACTIONS: crisp, 48 drawings a second, flowing, a little bounce as each pose
// lands); each loops one lift (world/mochi-race.js STACK_L) for as long as it's stacking, kept in time
// with the race's clock by render/race.js, so the piece leaves its paws (STACK_REL) just as the move
// lets it go. What it holds is drawn here too (drawKagamiHeld), and the pieces by render/race.js.
//
//   0  too heavy  hauled up out of the tub, teetering under it, eyes squeezed shut, and a sweaty phew
//   1  careful    lifted gently, tongue out in concentration, set down just so, a little nod
//   2  steady     a bouncy lift, humming, a happy pat on it once it's on
//   3  strong     hoisted overhead in one go and plonked down on the stand
//   4  jumping    scooped up, and a hop with it, flung up onto the stack from the top of the hop
//   5  show-off   scooped up, a turn, and tossed back over its shoulder without looking - a wink

import { STACK_L, STACK_REL, STACK_GRAB } from '../data/mochi-race.js';

const KEY = (t, o) => [t, o];
const C2 = [true, true];
const SET = [[-0.4, 0.8], [-0.4, 0.8]];
const WORRY = [[0.5, -0.7], [0.5, -0.7]];

// A lift, keyed by where in it each pose falls (0-1 of its length), looping round whole.
const lift = (tier, keys) => {
  const L = STACK_L[tier];
  return { dur: L, loop: [0, L], crisp: true, fps: 48, flow: true, keys: keys.map(([f, o]) => KEY(Math.round(f * L * 1000) / 1000, { hold: 'kagami', ...o })) };
};
const REL = (tier) => STACK_REL[tier];
const G = STACK_GRAB;

// Standing over the tub, ready; down into it, paws round the piece; carrying it low in front of its
// tummy (a chibi's paws are up by its chin - any higher and the piece would hide its face); and the
// heave up and forward that sends it onto the stack.
const READY = (o = {}) => ({ front: [3, -3], back: [2, -3], glance: 1, ...o });
const DOWN = (o = {}) => ({ front: [8, 3], back: [7, 3], lean: 0.42, squat: 1.6, look: 'down', ...o });
const CARRY = (o = {}) => ({ front: [9, 0.5], back: [8, 0.5], lean: 0.1, squat: 0.6, ...o });
const STEP = { legF: [2.6, 0, 14], legB: [-4, -0.7, -40] };
const PLACE = (o = {}) => ({ front: [13, -11], back: [12, -11], lean: 0.26, ...STEP, ...o });

// 0: too heavy for it - hauled out with its eyes shut, teetering one way and the other, a dip and a
// heave to get it up there, and a sweaty phew.
const stack0 = lift(0, [
  [0, READY({ brows: WORRY, mouth: 'mochio' })],
  [0.12, DOWN({ lean: 0.3, squat: 1.1, front: [7, 0.5], back: [6, 0.5], brows: WORRY, mouth: 'mochio' })],
  [G, DOWN({ lean: 0.46, squat: 1.9, front: [8, 3.5], back: [7, 3.5], brows: WORRY, mouth: 'grit', closed: C2 })],
  [0.36, DOWN({ lean: 0.32, squat: 2.1, front: [8, 2], back: [7, 2], tilt: -3, brows: WORRY, mouth: 'grit', closed: C2, extra: ['sweat0'], look: null })],
  [0.47, CARRY({ lean: -0.06, squat: 1, tilt: 5, brows: WORRY, mouth: 'wavy', extra: ['sweat1'], ease: 'out' })],
  [0.58, CARRY({ lean: 0.06, squat: 1.1, tilt: -4, brows: WORRY, mouth: 'grit', closed: C2, extra: ['sweat0'] })],
  [REL(0) - 0.06, CARRY({ front: [8, 1.5], back: [7, 1.5], lean: -0.04, squat: 1.6, tilt: 0, brows: WORRY, mouth: 'grit', closed: C2, ease: 'in' })],
  [REL(0), PLACE({ lift: 0.5, brows: WORRY, mouth: 'mochio', ease: 'out' })],
  [0.84, { front: [9, -6], back: [8, -6], lean: 0.12, squat: 0.6, brows: WORRY, mouth: 'mochiflat', closed: C2, extra: ['sweat0'], ease: 'in' }],
  [0.93, READY({ squat: 0.6, brows: WORRY, mouth: 'mochiflat' })],
  [1, READY({ brows: WORRY, mouth: 'mochio' })],
]);

// 1: careful - lifted out gently with its tongue out, carried steady, eased up onto the stack just
// so, and a little nod.
const stack1 = lift(1, [
  [0, READY({ brows: SET, mouth: 'mochio' })],
  [0.14, DOWN({ lean: 0.3, squat: 1.1, front: [7, 0.5], back: [6, 0.5], brows: SET, mouth: 'mochio' })],
  [G, DOWN({ lean: 0.42, squat: 1.5, brows: SET, mouth: 'tongue' })],
  [0.44, CARRY({ brows: SET, mouth: 'tongue', ease: 'out' })],
  [0.62, CARRY({ front: [10, 0], back: [9, 0], lean: 0.18, squat: 1, ...STEP, brows: SET, mouth: 'tongue', ease: 'in' })],
  [REL(1), PLACE({ brows: SET, mouth: 'tongue', ease: 'out' })],
  [0.8, PLACE({ front: [12, -11.5], back: [11, -11.5], lean: 0.2, brows: SET, mouth: 'mochio' })],
  [0.9, READY({ lift: 0.3, hy: 0.8, mouth: 'mochiw', closed: C2, ease: 'out' })],
  [1, READY({ brows: SET, mouth: 'mochio', ease: 'in' })],
]);

// 2: steady - a bouncy lift, humming, swaying it along; a dip and up it goes, and a happy hop.
const stack2 = lift(2, [
  [0, READY({ mouth: 'mochiw' })],
  [0.12, DOWN({ lean: 0.32, squat: 1.1, front: [7, 1], back: [6, 1], tilt: -2, mouth: 'mochiw' })],
  [G, DOWN({ lean: 0.4, squat: 1.4, mouth: 'mochiw' })],
  [0.4, CARRY({ lift: 0.8, squat: 0, tilt: 3, mouth: 'mochiw', extra: ['note'], ease: 'out' })],
  [0.56, CARRY({ lift: 0, squat: 1.2, tilt: -2, mouth: 'mochiw', closed: C2, ease: 'in' })],
  [REL(2), PLACE({ front: [13, -12], back: [12, -12], mouth: 'mochiw', extra: ['note'], ease: 'out' })],
  [0.8, PLACE({ front: [11, -10], back: [10, -10], lean: 0.18, squat: 0.4, mouth: 'cat', closed: C2 })],
  [0.9, READY({ lift: 0.7, mouth: 'mochiw', closed: C2, ease: 'out' })],
  [1, READY({ mouth: 'mochiw', ease: 'in' })],
]);

// 3: strong - scooped out, a coil back with it, and one big heave that swings it up onto the stack;
// it lands with a thump.
const stack3 = lift(3, [
  [0, READY({ brows: SET, mouth: 'mochio' })],
  [0.1, DOWN({ lean: 0.38, squat: 1.4, front: [8, 2.5], back: [7, 2.5], brows: SET, mouth: 'mochio' })],
  [G, DOWN({ lean: 0.3, squat: 1.2, front: [8, 2], back: [7, 2], brows: SET, mouth: 'grit' })],
  [0.46, CARRY({ front: [4, 2], back: [3, 2], lean: -0.14, squat: 1.4, brows: SET, mouth: 'grit', ease: 'out' })],
  [REL(3) - 0.04, PLACE({ front: [12, -8], back: [11, -8], lean: 0.2, squat: 0.6, brows: SET, mouth: 'D', ease: 'in' })],
  [REL(3), PLACE({ front: [14, -13], back: [13, -13], lean: 0.34, squat: 0.2, lift: 0.6, brows: SET, mouth: 'D', ease: 'out' })],
  [0.8, PLACE({ front: [12, -10], back: [11, -10], lean: 0.24, squat: 0.8, brows: SET, mouth: 'grin', extra: ['bang0'] })],
  [0.9, READY({ brows: SET, mouth: 'mochio', ease: 'in' })],
  [1, READY({ brows: SET, mouth: 'mochio' })],
]);

// 4: jumping - scooped up, down into a crouch with it, and a hop, flinging it up onto the stack from
// the top of the hop; down again, watching it land.
const stack4 = lift(4, [
  [0, READY({ mouth: 'D' })],
  [0.1, DOWN({ lean: 0.38, squat: 1.5, front: [8, 2.5], back: [7, 2.5], mouth: 'D' })],
  [G, DOWN({ lean: 0.32, squat: 1.6, front: [8, 2.5], back: [7, 2.5], mouth: 'mochio' })],
  [0.42, CARRY({ front: [6, 2], back: [5, 2], lean: 0.02, squat: 1.9, brows: SET, mouth: 'mochio', ease: 'in' })],
  [0.52, CARRY({ front: [10, -2], back: [9, -2], lean: 0.12, lift: 2.6, squat: 0, legF: [-1.6, -2.2, -28], legB: [-3, -1.6, -40], brows: SET, mouth: 'D', ease: 'out' })],
  [REL(4), PLACE({ front: [13, -10], back: [12, -10], lean: 0.2, lift: 3.2, squat: 0, legF: [-1.6, -2.2, -28], legB: [-3, -1.6, -40], mouth: 'D', extra: ['spark0'] })],
  [0.72, { front: [6, -8], back: [5, -8], lean: 0.06, lift: 0, squat: 1.3, look: 'up', mouth: 'D', ease: 'in' }],
  [0.86, READY({ look: 'up', mouth: 'D' })],
  [1, READY({ mouth: 'D' })],
]);

// 5: show-off - scooped up, a turn, and flicked back over its shoulder to the stack without even
// looking, a wink; round again, grinning.
const stack5 = lift(5, [
  [0, READY({ mouth: 'smirk', lid: 0.35, sprout: 'happy' })],
  [0.1, DOWN({ lean: 0.38, squat: 1.4, front: [8, 2.5], back: [7, 2.5], mouth: 'smirk', sprout: 'happy' })],
  [G, DOWN({ lean: 0.3, squat: 1.3, front: [8, 2], back: [7, 2], mouth: 'smirk', sprout: 'happy' })],
  [0.38, CARRY({ turned: true, front: [7, 1], back: [6, 1], lean: 0.12, lift: 1, mouth: 'grin', sprout: 'happy', ease: 'out' })],
  [0.5, { turned: true, front: [-3, -1], back: [-4, -1], lean: 0.16, squat: 0.8, closed: [false, true], mouth: 'grin', sprout: 'happy' }],
  [REL(5), { turned: true, front: [-8, -9], back: [-9, -9], lean: -0.22, lift: 1.4, closed: [false, true], mouth: 'grin', sprout: 'happy', extra: ['spark0'], ease: 'out' }],
  [0.72, { turned: false, front: [-2, -12], back: [6, -6], lift: 0.4, mouth: 'grin', sprout: 'happy', ease: 'in' }],
  [0.86, READY({ glance: -1, mouth: 'grin', sprout: 'happy' })],
  [1, READY({ mouth: 'smirk', lid: 0.35, sprout: 'happy' })],
]);

// A wobble: paws flung out to the swaying stack, eyes wide, willing it still, and a careful let-go.
const stack_steady = { dur: 1, crisp: true, fps: 48, flow: true, keys: [
  KEY(0, READY({ hold: 'kagami', brows: WORRY, mouth: 'mochio' })),
  KEY(0.12, PLACE({ front: [13, -12], back: [12, -13], lean: 0.3, wide: true, mouth: 'o', brows: WORRY, extra: ['bang0'], ease: 'out' })),
  KEY(0.3, PLACE({ front: [12.5, -12], back: [11.5, -12.5], lean: 0.26, tilt: 3, mouth: 'grit', closed: C2, brows: WORRY })),
  KEY(0.5, PLACE({ front: [12.5, -11.5], back: [11.5, -12], lean: 0.26, tilt: -3, mouth: 'grit', closed: C2, brows: WORRY })),
  KEY(0.7, PLACE({ front: [12, -11], back: [11, -11.5], lean: 0.2, mouth: 'mochiflat', closed: C2, brows: WORRY, extra: ['sweat0'] })),
  KEY(0.85, { front: [8, -7], back: [7, -7], lean: 0.08, mouth: 'mochiflat', brows: WORRY, extra: ['sweat0'] }),
  KEY(1, READY({ brows: WORRY, mouth: 'mochio' })),
] };

export const STACK_ACTS = { stack0, stack1, stack2, stack3, stack4, stack5, stack_steady };

// ---------- The pieces ----------
// Sizes at the race's own scale: the big round mochi, the smaller one, the bitter orange (its leaf
// apart). Each drawn standing on (x, y), its bottom middle; `a` turns it about its middle.
export const KAGAMI = [{ w: 10, h: 5 }, { w: 8, h: 4 }, { w: 4.4, h: 4.4 }];
export function drawKagamiPiece(ctx, i, x, y, k = 1, d = 1, a = 0) {
  const { w, h } = KAGAMI[i];
  ctx.save();
  ctx.translate(x, y - (h / 2) * k);
  if (a) ctx.rotate(a);
  ctx.scale(d * k, k);
  if (i < 2) {
    // A soft round dome, flat underneath: a warm edge, a shade low down, a shine on its shoulder.
    const dome = (g) => {
      ctx.beginPath();
      ctx.moveTo(-w / 2 - g, h / 2 - 1);
      ctx.quadraticCurveTo(-w / 2 - g, -h / 2 - g, 0, -h / 2 - g);
      ctx.quadraticCurveTo(w / 2 + g, -h / 2 - g, w / 2 + g, h / 2 - 1);
      ctx.quadraticCurveTo(w / 2 + g, h / 2 + g, w / 2 - 1, h / 2 + g);
      ctx.lineTo(-w / 2 + 1, h / 2 + g);
      ctx.quadraticCurveTo(-w / 2 - g, h / 2 + g, -w / 2 - g, h / 2 - 1);
      ctx.fill();
    };
    ctx.fillStyle = '#d8c6bc';
    dome(0.4);
    ctx.fillStyle = '#fff8f2';
    dome(0);
    ctx.fillStyle = '#f0e4e4';
    ctx.beginPath();
    ctx.ellipse(w * 0.06, h * 0.3, w * 0.42, h * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-w * 0.2, -h * 0.16, w * 0.15, h * 0.13, -0.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const r = w / 2;
    ctx.fillStyle = '#e8782a';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff9a3a';
    ctx.beginPath();
    ctx.arc(-0.2, -0.25, r - 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffc890';
    ctx.beginPath();
    ctx.ellipse(-r * 0.36, -r * 0.4, 0.8, 0.55, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Its stalk and leaf.
    ctx.fillStyle = '#6a8a40';
    ctx.fillRect(-0.4, -r - 0.4, 0.8, 0.8);
    ctx.fillStyle = '#6cb050';
    ctx.beginPath();
    ctx.ellipse(1.5, -r - 0.2, 1.6, 0.7, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// What's in its paws (`m.stackHeld`, set by the race): held between them, a little above, and where
// that is noted (`m.anchors.kagami`, on the canvas) so the race can send it on from there.
export function drawKagamiHeld(ctx, m, hand, other, flip) {
  const i = m.stackHeld;
  if (i == null) return;
  const k = m.stackK ?? 1;
  const x = (hand[0] + other[0]) / 2 + (flip ? -1 : 1) * k;
  const y = (hand[1] + other[1]) / 2 - KAGAMI[i].h * 0.08 * k;
  drawKagamiPiece(ctx, i, x, y + (KAGAMI[i].h / 2) * k, k, flip ? -1 : 1);
  const t = ctx.getTransform?.();
  if (m.anchors && t) m.anchors.kagami = [t.a * x + t.c * y + t.e, t.b * x + t.d * y + t.f];
}
