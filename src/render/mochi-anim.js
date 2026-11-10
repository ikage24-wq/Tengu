// The Mochi's own rig and animations (the Wagashi Sprites, 2026-11-09). Built on the hero's body
// (drawPosed, like every companion) but posed by a rig of its own: a whole-body lean that keeps the
// feet on the ground, a bob on the legs, each hand's reach, each foot's step, the head's tilt, and
// the hair and mood sprout swinging behind. Every number of a pose is carried to the next on a
// spring, so nothing snaps, and the springs' output is stepped (quarter pixels, 2 degrees) so the
// same few drawings come round again (speed rules: nothing painted afresh every frame).
//
// How they move grows with their stats, in a cute, funny way. Every stat levels from 1 to 99; each
// level adds points to it, more the better its grade (data/mochi-genes.js), so the grade decides
// how far it can grow, as in a Chao Garden. The style follows the points (six a stat). Running:
//   0 waddle      (0)     little hops from foot to foot, arms out for balance
//   1 trot        (300)   a bouncy, happy jog
//   2 run         (700)   a natural steady run: a light lean, relaxed arms, a clean float
//   3 sprint      (1100)  long bounding strides, leaning in, arms pumping hard, dust kicked up
//   4 power sprint (1600) all out: a deep lean, knees driving high, arms pumping hard
//   5 ninja dash  (2100)  bent right over, arms flung back, speed lines and after-images behind
// Standing still: its personality's stance (STANCE), breathing, shifting its weight, blinking at
// its own rhythm and glancing about now and then.

import { drawPosed, posedMouth, posedFrame } from './hero.js';
import { featureOf, budOf, drawFeature } from './mochi-features.js';
import { drawSweet, drawBall } from './mochi-sweets.js';
import { lookOf, drawCoat, drawCoatBack, MOCHI_SIZE } from './wagashi.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const TAU = Math.PI * 2;
const lerp = (a, b, k) => a + (b - a) * k;
// A seeded random for each Mochi's own rhythms (never Math.random: the same Mochi blinks the same).
const hash = (n) => {
  let h = (n | 0) * 2654435761;
  h ^= h >>> 15;
  return ((Math.imul(h, 2246822507) >>> 0) % 10000) / 10000;
};

// ---------- The pose ----------
// A Mochi pose (facing right, the hero rig's body px):
//   lean          the whole body tipped forward (+) or back (-), radians; the feet stay planted
//   tip           how far the lean pivots up from the feet to the middle (0 the upper body bends
//                 over the knees; 2-3 the whole body, legs and all, tips into a run)
//   bob           the body sinking on its legs (+) or rising (-)
//   lift          off the ground (px)
//   hx, hy, tilt  the head's offset, and its tilt (degrees)
//   front, back   the near and far hand's reach from rest [ahead, up (negative)]
//   legF, legB    the near and far foot [ahead, up (negative), tilt]
//   squat         knees bending
//   hair          the hair and the sprout swinging (negative: streaming back)
//   eyes, mouth   a held expression (null: its own, blinking)
//   brows, blush, glance   the face
const REST = { lean: 0, tip: 0, sink: 0, climb: 0, bob: 0, lift: 0, hx: 0, hy: 1, tilt: -2, front: [0, 0], back: [0, 0], legF: [0.8, 0, 0], legB: [-0.8, 0, 0], squat: 0, hair: 0, eyes: null, mouth: null, brows: [[0.2, 0], [0.2, 0]], blush: 1.2, glance: 0 };
const pose = (o) => ({ ...REST, ...o });

// Each personality's way of standing (no two alike): lean of the head, near hand, far hand, how far
// apart the feet are, and anything else.
const stance = (tilt, front, back, st, o = {}) => ({ tilt, front, back, legF: [st, 0, st * 3], legB: [-st, 0, -st * 3], ...o });
export const STANCE = {
  playful: stance(-5, [1.8, -4.6], [-1.6, -2], 1.4), shy: stance(5, [2.4, -1.4], [2.2, -1.2], 0.4, { hy: 1.4 }), proud: stance(-6, [-1.4, -1.2], [-1.2, -1], 1.8),
  sleepy: stance(7, [0.4, 0.6], [0.2, 0.4], 0.8, { hy: 1.6, hx: -0.3, eyes: 'half' }), curious: stance(-8, [2.6, -2.4], [0, 0], 1.6), bossy: stance(-3, [3.4, -5.6], [-1.4, -1.2], 2),
  gentle: stance(3, [1.6, -2.2], [1.8, -2], 0.9), showoff: stance(-7, [3, -8.2], [-2.4, -3], 1.6), clumsy: stance(9, [-2, -3], [2.6, -4], 1.2),
  brave: stance(-4, [3.8, -3], [-1.8, -1], 2.2), grumpy: stance(2, [2.6, -4.4], [2.8, -4.6], 1.2), dreamy: stance(6, [2, -7.6], [0.6, 0], 0.6, { hy: 0.6 }),
  cheeky: stance(-6, [1.2, -9], [-1, -1.4], 1), timid: stance(8, [2.8, -2.6], [2.4, -2.4], 0.3, { hy: 1.6 }), bubbly: stance(-4, [-3, -6.4], [3, -6.4], 1.6),
  stoic: stance(0, [0.2, 0.2], [0.2, 0.2], 1.4), foodie: stance(4, [2.4, -3.4], [2.2, -3], 1, { hy: 1.2 }), sassy: stance(-5, [-1.6, -1.4], [-1.4, -1.2], 1.6),
  lazy: stance(10, [0.6, 1], [0.4, 0.8], 1.4, { hy: 1.8, eyes: 'half' }), hyper: stance(-9, [-3.4, -8], [3, -7], 2), polite: stance(4, [2.4, -0.6], [2.2, -0.4], 0.4),
  mischief: stance(-7, [2.2, -6.4], [-2.2, -2.6], 1.2), clingy: stance(6, [3, -3.2], [2.8, -3.6], 0.6), loner: stance(-2, [0.8, 0.4], [0.4, 0.2], 1),
  artsy: stance(-5, [2.8, -5], [0.6, -1], 1.2), sporty: stance(-6, [-2.4, -3.6], [2.6, -4.4], 2.2), nosy: stance(-10, [2.8, -3], [0.4, -0.6], 1.8),
  dramatic: stance(-9, [3.4, -9.4], [-2.6, -5], 1.4), cool: stance(-3, [-1.2, -0.8], [0.6, 0.2], 1.4), sweet: stance(5, [2.2, -4.2], [2, -4], 0.6),
  chatty: stance(-4, [3.2, -4.2], [-1, -1.6], 1.2), sneaky: stance(8, [1.8, -1.8], [2.6, -2.6], 1.8),
};

// ---------- Running ----------
// Which way it runs: by its Run points (the style each threshold unlocks).
export const RUN_STYLES = [0, 300, 700, 1100, 1600, 2100];
export const runStyle = (points) => RUN_STYLES.reduce((t, need, i) => (points >= need ? i : t), 0);
// The acting, faces and marks for each style: struggling, happy, focused, cool.
const BAND = [0, 1, 1, 2, 2, 3];
// Each gait: how far it travels in one cycle of two steps (px of the world, at grown size), how fast
// it goes (px/s), and its name.
export const GAITS = [
  { name: 'waddle', stride: 16, speed: 34 },
  { name: 'trot', stride: 24, speed: 60 },
  { name: 'run', stride: 30, speed: 80 },
  { name: 'sprint', stride: 38, speed: 104 },
  { name: 'power sprint', stride: 44, speed: 136 },
  { name: 'ninja dash', stride: 50, speed: 168 },
];
// One foot through its cycle (φ 0-1): planted and pushing back through the first half, then
// lifted (knee up) and swung forward through the second, its toe tipping up as it reaches.
const foot = (phi, reach, lift, tilt = 20) => {
  const u = ((phi % 1) + 1) % 1;
  if (u < 0.5) {
    const k = u / 0.5;
    return [reach * (1 - 2 * k), 0, -tilt * 0.3 * k];
  }
  const k = (u - 0.5) / 0.5;
  const e = 0.5 - 0.5 * Math.cos(Math.PI * k);
  return [reach * (2 * e - 1), -lift * Math.sin(Math.PI * k), tilt * (e - 0.3)];
};
// A hand pumping against the foot on its side (as the hero's do: a forward swing that would cross
// the body lifts toward the viewer instead), rising higher the harder it runs.
const pump = (phi, out, swing, rise) => {
  const sw = Math.cos(TAU * phi);
  const along = sw * swing;
  const x = along * out >= 0 ? along : out * 0.5 * Math.abs(sw) * swing * 0.5;
  return [x, -(rise * (0.6 + 0.4 * Math.abs(sw)) + (along * out < 0 ? 1.2 * Math.abs(sw) : 0))];
};
// The pose at `p` (0-1) through a gait's cycle of two steps.
function gaitPose(tier, p) {
  const s2 = Math.sin(TAU * p * 2); // once a step
  // Every gait bounces: a springy hop up off each step (eased, fastest leaving the ground and
  // hanging at the top), a little sink as it lands, the head a beat behind, the sprout boinging.
  const u = (p * 2) % 1;
  const hop = Math.sin(Math.PI * u) ** 0.8; // up and down within each step
  const land = Math.max(0, Math.cos(Math.PI * u * 2.4)) * (u < 0.25 || u > 0.9 ? 1 : 0); // the sink at each footfall
  const lag = Math.sin(Math.PI * ((u + 0.82) % 1)); // the head a beat behind the body
  const boing = Math.sin(TAU * u - 1.2); // the sprout and hair, later still
  if (tier === 0) {
    // Waddle: little hops from foot to foot, rocking side to side, arms held out for balance and
    // flapping with each step, the head bobbing after, cheeks puffed with effort.
    return pose({
      legF: foot(p, 1.8, 1.8, 10), legB: foot(p + 0.5, 1.8, 1.8, 10), bob: 0.9 * land, lift: 1.8 * hop,
      tilt: -2 + 8 * Math.sin(TAU * p - 0.7), hx: 0.5 * Math.sin(TAU * p), hy: 1 + 0.9 * lag,
      front: [3.2, -4 - 2.2 * hop], back: [-3, -3.8 - 2.2 * hop], hair: 1.6 * boing,
      blush: 1.5,
    });
  }
  if (tier === 1) {
    // Trot: a cute, bouncy jog, upright, short quick steps, high up off every one; the hands held
    // up by the chest bobbing with each bounce, the head rocking side to side, the sprout boinging.
    return pose({
      legF: foot(p, 2.2, 2.6, 18), legB: foot(p + 0.5, 2.2, 2.6, 18), bob: 1.2 * land, lift: 4.4 * hop,
      lean: -0.02, tilt: -2 + 6 * Math.sin(TAU * p - 0.6), hy: 1 + 1.4 * lag, hx: 0.2,
      front: [1.6 + 0.5 * Math.sin(TAU * p), -4.4 - 0.8 * hop], back: [-0.8 - 0.5 * Math.sin(TAU * p), -4.2 - 0.8 * hop], hair: 2.2 * boing,
    });
  }
  if (tier === 2) {
    // Run: a natural steady run, a light lean, a medium stride with a clean float between steps,
    // the arms swinging relaxed and bent, the head steady over it all.
    return pose({
      legF: foot(p, 4, 3.2, 32), legB: foot(p + 0.5, 4, 3.2, 32), bob: 0.8 * land, lift: 2.6 * hop,
      lean: 0.2, tip: 1.6, tilt: -7 + 1.2 * boing, hy: 1.6 + 0.8 * lag, hx: 1.2,
      front: pump(p + 0.5, 1, 3.4, 3.2), back: pump(p, -1, 3.4, 3.2), hair: -2.2 + 1 * boing,
    });
  }
  if (tier === 3) {
    // Sprint: long bounding strides, the head driving forward, arms pumping hard, mouth open, hair
    // streaming and bouncing.
    return pose({
      legF: foot(p, 4.4, 4.2, 38), legB: foot(p + 0.5, 4.4, 4.2, 38), bob: 1.2 * land, lift: 4.6 * hop,
      lean: 0.28, tip: 1.6, tilt: -9 + 2 * boing, hy: 1.6 + 1.2 * lag, hx: 1.2, mouth: 'mochiopen',
      front: pump(p + 0.5, 1, 3.6, 4.4), back: pump(p, -1, 3.6, 4.4), hair: -2.6 + 1.6 * boing,
      brows: [[-0.2, 0.4], [-0.2, 0.4]],
    });
  }
  if (tier === 4) {
    // Power sprint: all out but clean: a deep lean, the knees driving high, long powerful strides,
    // the arms pumping hard and fast, jaw set, the hair streaming flat.
    return pose({
      legF: foot(p, 4.8, 4.8, 44), legB: foot(p + 0.5, 4.8, 4.8, 44), bob: 1.2 * land, lift: 4 * hop,
      lean: 0.4, tip: 2.2, tilt: -11 + 1.5 * boing, hy: 1.8 + 1 * lag, hx: 1.4, mouth: 'grit',
      front: pump(p + 0.5, 1, 4.2, 5), back: pump(p, -1, 4.2, 5), hair: -3.6 + 1.2 * boing,
      brows: [[-0.4, 0.7], [-0.4, 0.7]],
    });
  }
  // Ninja dash: bent right over, both arms flung straight out behind and held there, legs a blur
  // of long low bounds, the head thrust forward, a fierce little frown; hair and sprout flat out
  // behind, bouncing.
  return pose({
    legF: foot(p, 5, 3.8, 46), legB: foot(p + 0.5, 5, 3.8, 46), bob: 1.2 + 0.8 * land, lift: 2.8 * hop,
    lean: 0.62, tip: 2.6, tilt: -12 + 2 * boing, hx: 1.6, hy: 2 + 1 * lag, mouth: 'mochiflat',
    front: [-7.4, 3.6 + 0.4 * boing], back: [-8.2, 2.6 - 0.4 * boing], hair: -4.4 + 1 * boing,
    brows: [[-0.5, 0.9], [-0.5, 0.9]],
  });
}

// ---------- Swimming ----------
// Six styles by Swim points (the same thresholds as running), each a real stroke done a little
// better than the last; the fun is in the faces. `sink` is how deep it sits (body px under the
// waterline at its feet's level); water is laid over everything below the surface.
//   0 doggy paddle   chin up, paws churning in little circles in front, bobbing
//   1 breaststroke   arms sweeping out and round, a frog kick, the head bobbing up to breathe
//   2 easy crawl     arms reaching over by turns, head turning to breathe, a light kick
//   3 fast crawl     the same quicker and longer, spray off every hand
//   4 butterfly      both arms over together, the whole body rolling up out of the water
//   5 backstroke     on its back, arms wheeling over by turns, effortless, the fastest of all
export const SWIMS = [
  { name: 'doggy paddle', stride: 21, speed: 26 },
  { name: 'breaststroke', stride: 62, speed: 44 },
  { name: 'easy crawl', stride: 102, speed: 64 },
  { name: 'fast crawl', stride: 114, speed: 88 },
  { name: 'butterfly', stride: 157, speed: 112 },
  { name: 'backstroke', stride: 252, speed: 140 },
];
// A hand wheeling round its shoulder (a crawl's stroke): reaching ahead over the water, pulling
// down and back under, and coming round again.
const wheel = (a0, r, cx, cy) => {
  const a = a0 - 0.35 * Math.sin(a0);
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
};
function swimPose(style, p) {
  // (Swimming reads at the Mochi's size only if the head and shoulders stay up and the arms come
  // well up over the water, so every stroke is swum high, angled rather than flat, and each hand's
  // way back over the top is the big, visible part of it.)
  const a = TAU * p;
  const bob = Math.sin(TAU * p * 2);
  const ease = (v) => v - 0.3 * Math.sin(TAU * v) / TAU; // slower at the ends of each sweep
  if (style === 0) {
    // Doggy paddle: upright, chin up out of the water, paws churning fast in little circles just
    // in front, the whole head bobbing with the effort.
    const c = TAU * p * 2;
    return pose({
      lean: 0.12 + 0.05 * bob, tip: 6, sink: 19 + 2 * bob, tilt: 6 + 4 * bob, hy: 0.6 + 0.7 * bob,
      front: [3 + 1.8 * Math.cos(c), -4.4 + 1.8 * Math.sin(c)], back: [2.4 + 1.8 * Math.cos(c + Math.PI), -4.2 + 1.8 * Math.sin(c + Math.PI)],
      legF: [1.4 * Math.sin(c), -1.4, 12], legB: [-1.4 * Math.sin(c), -1.4, -12], hair: 2 * Math.sin(TAU * p * 2 - 1.2), blush: 1.5,
    });
  }
  if (style === 1) {
    // Breaststroke: hands together reaching ahead, then sweeping out and round to the chest as the
    // head lifts up to breathe, then shooting forward again into a long glide, a frog kick behind.
    const u = ease(p);
    const pull = u < 0.45 ? Math.sin((u / 0.45) * Math.PI * 0.5) : u < 0.6 ? 1 - (u - 0.45) / 0.15 : 0;
    const glide = u >= 0.6 ? Math.sin(((u - 0.6) / 0.4) * Math.PI) : 0;
    return pose({
      lean: 0.55 - 0.3 * pull, tip: 6, sink: 18.5 - 4.5 * pull, tilt: -2 + 10 * pull, hy: 1.2 - 1 * pull,
      front: [5.6 - 4.4 * pull, -5.4 + 2.8 * pull], back: [5 - 4.4 * pull, -5 + 2.8 * pull],
      legF: [-1 - 2 * glide, -1.6 * glide, -24], legB: [-1.6 - 2 * glide, -1.4 * glide, -24], hair: -0.6 + 2.4 * Math.sin(TAU * u - 1),
      mouth: pull > 0.6 ? 'mochio' : null,
    });
  }
  if (style === 2 || style === 3) {
    // Front crawl, swum high: one arm sweeping up out of the water and over the head to reach far
    // ahead while the other pulls under, the head turning up to breathe on one side; the fast crawl
    // reaches further, quicker, kicking white water up behind.
    const big = style === 3 ? 1.15 : 1;
    const arm = (ph) => {
      const v = ease(((ph % 1) + 1) % 1);
      // Over the top (0-0.5: back, up, over, and down in front), then under (0.5-1: pulling back).
      if (v < 0.5) {
        const k = v / 0.5;
        const ang = Math.PI * (1 - k);
        return [1.2 + 5.2 * big * Math.cos(ang) * 0.9, -5 - 4.2 * big * Math.sin(ang)];
      }
      const k = (v - 0.5) / 0.5;
      return [5.6 * big - 7.4 * big * k, -1.6 + 1.4 * Math.sin(Math.PI * k)];
    };
    const breathe = Math.max(0, Math.sin(a - 0.6)) ** 1.5;
    return pose({
      lean: 0.72 + 0.08 * bob, tip: 6, sink: 17.5 + 1.2 * bob, tilt: -4 + 12 * breathe, hy: 1 - 0.4 * breathe, hx: 0.4,
      front: arm(p), back: arm(p + 0.5),
      legF: [-1.8, -1.4 * Math.max(0, Math.sin(TAU * p * 3)), -36], legB: [-2.2, -1.4 * Math.max(0, Math.sin(TAU * p * 3 + Math.PI)), -36],
      hair: -2 * big + 1.6 * Math.sin(TAU * p * 2 - 1.2), mouth: breathe > 0.5 ? 'mochio' : style === 3 ? 'mochiflat' : null, glance: breathe > 0.4 ? 1 : 0,
    });
  }
  if (style === 4) {
    // Butterfly: both arms swinging up and over together while the body surges up out of the
    // water, then diving back in as the arms pull under, a strong dolphin kick.
    const v = ease(p);
    const over = v < 0.5 ? Math.sin((v / 0.5) * Math.PI) : 0;
    const surge = Math.sin(TAU * v);
    const armAt = (lag) => {
      const w = Math.min(1, Math.max(0, v - lag));
      if (w < 0.5) {
        const ang = Math.PI * (1 - w / 0.5);
        return [1 + 5.6 * Math.cos(ang) * 0.9, -5 - 4.6 * Math.sin(ang)];
      }
      const k = (w - 0.5) / 0.5;
      return [6 - 7.6 * k, -1.4 + 1.2 * Math.sin(Math.PI * k)];
    };
    return pose({
      lean: 0.55 + 0.25 * surge, tip: 6, sink: 17 - 5 * over, tilt: -4 + 6 * over, hy: 1 - 0.6 * over,
      front: armAt(0), back: armAt(0.04),
      legF: [-2, -1.8 * Math.max(0, -surge), -40], legB: [-2.4, -1.6 * Math.max(0, -surge), -40],
      hair: -2.4 + 1.2 * surge, mouth: over > 0.5 ? 'mochiopen' : 'grit',
    });
  }
  // Backstroke: lying flat on its back in the water, chest and face up to the sky, head first
  // (drawn facing the other way and tipped a quarter turn, so its front faces up); each arm swings
  // up out of the water by the hip, straight up into the air, over past the head and back in, then
  // pulls down along its side, by turns; toes up, kicking little splashes; a happy little smile.
  const arm = (ph) => {
    const v = ease(((ph % 1) + 1) % 1);
    // (As it lies: forward is up to the sky, up is ahead past the head, back is down in the water.)
    if (v < 0.5) {
      const k = v / 0.5;
      const ang = Math.PI * k; // from the hip, up, over to past the head
      return [-1 + 6.4 * Math.sin(ang), 2 - 10 * (0.5 - 0.5 * Math.cos(ang))];
    }
    const k = (v - 0.5) / 0.5;
    return [-1 - 3 * Math.sin(Math.PI * k), -8 + 10 * k];
  };
  const kick = Math.sin(TAU * p * 3);
  const roll = Math.sin(a);
  return pose({
    flip: true, lean: -1.3 + 0.05 * roll, tip: 6, sink: 21.5 + 1 * bob, tilt: -4, hy: 1, look: 'up',
    front: arm(p), back: arm(p + 0.5),
    legF: [1.8 + 0.8 * kick, -0.6, 34], legB: [1.4 - 0.8 * kick, -0.6, 30],
    hair: -2 + 0.8 * bob, mouth: 'mochiw', blush: 1.5,
  });
}

// ---------- Flying ----------
// Six styles by Fly points. `lift` is its height off the ground (body px); a full flip goes in the
// lean, which turns the whole figure (never stretched).
//   0 flap-hop    flapping its arms as hard as it can, bouncing along, barely leaving the ground
//   1 leap-glide  a big leap, arms spread, gliding down a little way, and again
//   2 float       hovering gently, legs dangling, arms out balancing, bobbing slowly
//   3 glide       flying forward lying on the air, arms spread like wings, a gentle swell
//   4 soar        fast and streamlined, arms swept back, banking a little this way and that
//   5 aerobatics  swooping along, now and then a full loop
export const FLIES = [
  { name: 'flap-hop', stride: 20, speed: 30 },
  { name: 'leap-glide', stride: 70, speed: 52 },
  { name: 'float', stride: 90, speed: 60 },
  { name: 'glide', stride: 160, speed: 92 },
  { name: 'soar', stride: 200, speed: 128 },
  { name: 'aerobatics', stride: 400, speed: 160 },
];
function flyPose(style, p) {
  const a = TAU * p;
  if (style === 0) {
    // Flap-hop: little hops, arms beating as fast as they'll go, legs kicking, determined.
    const u = (p * 2) % 1;
    const hop = Math.sin(Math.PI * u);
    const flap = Math.sin(TAU * p * 6);
    return pose({
      lift: 5 * hop, legF: [0.6, -1.6 * hop, 14 * hop], legB: [-0.8, -1.2 * hop, -14 * hop], bob: 1 * (1 - hop),
      front: [3.4, -6 + 3 * flap], back: [-3.2, -6 - 3 * flap], tilt: -4, hy: 1.2, hair: 1.2 * flap, mouth: 'grit', blush: 1.6,
    });
  }
  if (style === 1) {
    // Leap-glide: a crouch, a big leap up, then gliding down with arms out, toes pointed.
    const up = p < 0.22 ? Math.sin((p / 0.22) * Math.PI * 0.5) ** 0.7 : 0.5 + 0.5 * Math.cos(Math.PI * ((p - 0.22) / 0.78));
    const crouch = p > 0.9 ? (p - 0.9) / 0.1 : 0;
    return pose({
      lift: 14 * up, squat: Math.round(2 * crouch), legF: [1.4, -2 * up, 30 * up], legB: [-1.2, -1.6 * up, -20 * up],
      lean: 0.2 * up, tip: up > 0.4 ? 6 : 0, front: [4.6, -5 + 2 * up], back: [-4.2, -5 + 2 * up], tilt: -6, hy: 1, hair: -1.4 * up,
    });
  }
  if (style === 2) {
    // Float: hovering, legs dangling and kicking lazily, arms out to the sides waving slowly.
    const sw = Math.sin(a);
    return pose({
      lift: 16 + 2 * sw, legF: [0.6, -1 - 0.6 * sw, 20], legB: [-0.4, -0.6 + 0.6 * sw, 10], lean: 0.1, tip: 6,
      front: [4.2, -5.6 + 1.4 * sw], back: [-4, -5.6 - 1.4 * sw], tilt: 2 * sw, hy: 1, hair: -0.6 + 0.8 * sw,
    });
  }
  if (style === 3) {
    // Glide: lying on the air, arms spread back like wings, legs together, a gentle swell.
    const sw = Math.sin(a);
    return pose({
      lift: 18 + 2.4 * sw, legF: [-1.6, -1, -40], legB: [-2, -0.8, -40], lean: 0.95 + 0.05 * sw, tip: 6,
      front: [-1, -7], back: [-1.6, -7.2], tilt: -6, hy: 1.4, hair: -2.6 + 0.6 * sw,
    });
  }
  if (style === 4) {
    // Soar: streamlined, arms swept close along the sides, banking this way and that.
    const bank = Math.sin(a);
    return pose({
      lift: 20 + 3 * bank, legF: [-2, -0.8, -46], legB: [-2.4, -0.6, -46], lean: 1.2 + 0.12 * bank, tip: 6,
      front: [-5.4, 1.6], back: [-5.8, 1.2], tilt: -10 + 4 * bank, hy: 1.6, hx: 0.6, hair: -4 + 0.6 * bank, mouth: 'mochiopen',
    });
  }
  // Aerobatics: swooping along, and once a cycle a full loop: up and over and round, arms out.
  const loop = p > 0.55 && p < 0.95 ? (p - 0.55) / 0.4 : null;
  const sw = Math.sin(a * 2);
  if (loop != null) {
    const e = 0.5 - 0.5 * Math.cos(Math.PI * loop);
    return pose({
      lift: 22 + 10 * Math.sin(Math.PI * loop), lean: 1.1 - TAU * e, tip: 6, legF: [-1.4, -1, -30], legB: [-1.8, -0.8, -30],
      front: [4.6, -6.4], back: [-4.4, -6.6], tilt: -6, hy: 1.4, hair: -3, mouth: 'D', eyes: 'happy',
    });
  }
  return pose({
    lift: 22 + 3 * sw, lean: 1.1 + 0.08 * sw, tip: 6, legF: [-2, -0.8, -44], legB: [-2.4, -0.6, -44],
    front: [-5.2, 1.4], back: [-5.6, 1], tilt: -8 + 3 * sw, hy: 1.6, hx: 0.6, hair: -3.6 + 0.6 * sw,
  });
}

// Water laid over a swimming Mochi from the waterline down: a band of see-through blue, a bright
// surface line rippling, and drops flicked off the hands on the stronger strokes.
function drawWater(ctx, x, y, s, style, phase, time, dir = 1, inWater = false) {
  const k = s / 0.6;
  const w = 26 * k;
  ctx.save();
  // (In a real pond the map draws the water: just the ripples and splashes then.)
  ctx.fillStyle = inWater ? 'rgba(96,176,232,0)' : 'rgba(96,176,232,0.62)';
  ctx.fillRect(x - w, y, w * 2, 14 * k);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 0.8 * k;
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const px = x - w + (i / 12) * w * 2;
    const py = y + Math.sin(i * 1.3 + Math.floor(time * 6) * 0.9) * 0.5 * k;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  // A bow wave and rings spreading back from where it cuts through the water.
  const r = (phase * 2) % 1;
  ctx.globalAlpha = 0.9 * (1 - r);
  ctx.beginPath();
  ctx.ellipse(x - dir * r * 6 * k, y + 0.5 * k, (8 + r * 10) * k, (1.2 + r * 1.2) * k, 0, 0, TAU);
  ctx.stroke();
  // Where each hand goes in, a splash: a crown of drops thrown up and falling, a white puff on the
  // water; and white water churned up by the kick behind.
  const splash = (sx, age, size) => {
    if (age < 0 || age > 1) return;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.85 * (1 - age);
    ctx.beginPath();
    ctx.ellipse(sx, y, (2.6 + age * 4.4) * size * k, (1.2 + age * 1.2) * size * k, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8f6ff';
    for (let i = 0; i < 5; i++) {
      const ang = Math.PI * (0.15 + 0.7 * (i / 4));
      const d = age * 8 * size * k;
      ctx.beginPath();
      ctx.arc(sx + Math.cos(ang) * d, y - Math.sin(ang) * d * 1.4 + age * age * 8 * k, 1 * size * k, 0, TAU);
      ctx.fill();
    }
  };
  const ahead = x + dir * 7 * k;
  const ageAt = (at, len) => ((((phase - at) % 1) + 1) % 1) / len;
  // An arm coming over the top, shown by the water it flings: a streak of spray along its path
  // from where it left the water to where the hand is now, drops falling off behind it.
  // `from`/`to` are angles (0 ahead, PI behind, measured over the top), `k01` how far along it is.
  const flung = (cx, cy, r, from, to, k01, wide = 1) => {
    if (k01 <= 0 || k01 >= 1) return;
    const now = from + (to - from) * k01;
    const tail = from + (to - from) * Math.max(0, k01 - 0.45);
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a0 = tail + ((now - tail) * i) / 6;
      const a1 = tail + ((now - tail) * (i + 1)) / 6;
      ctx.globalAlpha = 0.25 + 0.6 * ((i + 1) / 6);
      ctx.lineWidth = (0.6 + 0.9 * ((i + 1) / 6)) * k * wide;
      ctx.beginPath();
      ctx.moveTo(cx + dir * Math.cos(a0) * r, cy - Math.sin(a0) * r * 0.8);
      ctx.lineTo(cx + dir * Math.cos(a1) * r, cy - Math.sin(a1) * r * 0.8);
      ctx.stroke();
    }
    ctx.fillStyle = '#e8f6ff';
    for (let i = 0; i < 3; i++) {
      const a0 = tail + ((now - tail) * (i + 0.5)) / 3;
      const fall = (1 - i / 3) * 3 * k;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(cx + dir * Math.cos(a0) * r, cy - Math.sin(a0) * r * 0.8 + fall, 0.8 * k, 0, TAU);
      ctx.fill();
    }
  };
  // Little bubbles bobbing up and popping on the surface.
  for (let i = 0; i < 3; i++) {
    const u = ((phase * 1.5 + i / 3) % 1);
    const bx = x + dir * (i - 1) * 6 * k + Math.sin(u * 9 + i) * 1 * k;
    const by = y + (1 - u) * 6 * k;
    ctx.globalAlpha = u > 0.85 ? (1 - u) / 0.15 : 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.4 * k;
    ctx.beginPath();
    ctx.arc(bx, by, (0.6 + 0.4 * u) * k, 0, TAU);
    ctx.stroke();
  }
  const sh = [x + dir * 1.5 * k, y - 2 * k];
  const over = (ph) => {
    const v = ((ph % 1) + 1) % 1;
    return v < 0.5 ? v / 0.5 : -1;
  };
  if (style === 2 || style === 3) {
    const r = (style === 3 ? 15 : 13.5) * k;
    flung(sh[0], sh[1], r, Math.PI, 0, over(phase));
    flung(sh[0], sh[1], r, Math.PI, 0, over(phase + 0.5));
  } else if (style === 4) {
    flung(sh[0], sh[1], 16 * k, Math.PI, 0, over(phase), 1.5);
  } else if (style === 5) {
    const r = 13 * k;
    flung(x - dir * 1 * k, y - 1 * k, r, Math.PI * 0.85, -0.1, over(phase));
    flung(x - dir * 1 * k, y - 1 * k, r, Math.PI * 0.85, -0.1, over(phase + 0.5));
  } else if (style === 1) {
    // The breaststroke's sweep: two arcs of water spreading out sideways on the surface.
    const v = ((phase % 1) + 1) % 1;
    if (v < 0.45) {
      const kk = v / 0.45;
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = 0.85 * (1 - kk * 0.6);
      ctx.lineWidth = 1.5 * k;
      ctx.beginPath();
      ctx.ellipse(ahead, y - 0.5 * k, (3 + kk * 11) * k, (1 + kk * 2.2) * k, 0, Math.PI * 0.05, Math.PI * 0.95, true);
      ctx.stroke();
    }
  }
  if (style === 'flail') {
    // Thrashing: big splashes either side, by turns, and more in between.
    for (const [at, side, big] of [[0, 1, 1.3], [0.25, -1, 1.2], [0.5, 1, 1.1], [0.75, -1, 1.3]]) splash(x + side * 7 * k, ageAt(at, 0.3), big);
  } else if (style === 0) {
    for (const at of [0, 0.25, 0.5, 0.75]) splash(x + dir * (5 + (at * 4) % 2) * k, ageAt(at, 0.3), 0.75);
  } else if (style === 1) {
    splash(ahead + dir * 2 * k, ageAt(0.55, 0.35), 0.8);
    splash(x - dir * 9 * k, ageAt(0.62, 0.4), 0.7);
  } else if (style === 2 || style === 3) {
    const big = style === 3 ? 1.25 : 0.9;
    splash(ahead + dir * 3 * k, ageAt(0.25, 0.35), big);
    splash(ahead + dir * 3 * k, ageAt(0.75, 0.35), big);
    splash(x - dir * 10 * k, ageAt(0, 0.3), 0.5 * big);
    splash(x - dir * 10 * k, ageAt(0.33, 0.3), 0.5 * big);
    splash(x - dir * 10 * k, ageAt(0.66, 0.3), 0.5 * big);
  } else if (style === 4) {
    splash(ahead + dir * 4 * k, ageAt(0.25, 0.45), 1.5);
    splash(x - dir * 10 * k, ageAt(0.75, 0.4), 0.9);
  } else {
    splash(ahead + dir * 4 * k, ageAt(0.25, 0.35), 1);
    splash(ahead + dir * 4 * k, ageAt(0.75, 0.35), 1);
    for (const at of [0, 0.16, 0.33, 0.5, 0.66, 0.83]) splash(x - dir * (12 + (at * 6) % 2) * k, ageAt(at, 0.2), 0.55);
  }
  ctx.restore();
}

// ---------- Climbing (Power) ----------
// Six styles by Power points, climbing a wall, seen from behind as the hero climbs (hand over hand,
// each knee drawing up as the hand on its side pulls, `climb` -2.5..2.5); `lift` is the extra
// rise and fall of each pull (smooth, never redrawn).
//   0 scrabble      hands grabbing and feet kicking fast, swaying, slipping back down after each
//                   bit of ground it gains
//   1 slow climb    hand over hand, a rest after every pull
//   2 steady climb  a smooth, even rhythm
//   3 fast climb    quick and light
//   4 power climb   big pulls that surge it up with each one
//   5 leap climb    crouching into the wall and springing up a body length at a time, catching
export const CLIMBS = [
  { name: 'scrabble', stride: 10, speed: 8 },
  { name: 'slow climb', stride: 22, speed: 16 },
  { name: 'steady climb', stride: 24, speed: 26 },
  { name: 'fast climb', stride: 26, speed: 40 },
  { name: 'power climb', stride: 36, speed: 56 },
  { name: 'leap climb', stride: 48, speed: 74 },
];
function climbPose(style, p) {
  const a = TAU * p;
  const s1 = Math.sin(a);
  if (style === 0) {
    const k = Math.sin(TAU * p * 3);
    const slip = p > 0.6 ? Math.sin(((p - 0.6) / 0.4) * Math.PI * 0.5) : 0;
    return pose({ view: 'back', climb: 2.2 * k, tx: 0.8 * Math.sin(TAU * p * 1.5), lift: 2 * Math.sin(Math.PI * Math.min(1, p / 0.6)) - 2.6 * slip, hair: 1 * k });
  }
  if (style === 1) {
    // A pull, then a rest hanging there, then the other hand.
    const half = (p * 2) % 1;
    const pull = half < 0.55 ? 0.5 - 0.5 * Math.cos(Math.PI * (half / 0.55)) : 1;
    const side = p < 0.5 ? 1 : -1;
    return pose({ view: 'back', climb: 2.5 * side * (pull * 2 - 1), tx: 0.3 * side, lift: 1.6 * pull, hair: 0.6 * side });
  }
  if (style === 2 || style === 3) {
    return pose({ view: 'back', climb: 2.5 * s1, tx: (style === 3 ? 0.2 : 0.4) * Math.sin(a + 0.8), lift: 1.2 * Math.abs(Math.sin(a)), hair: 0.8 * s1 });
  }
  if (style === 4) {
    // Each pull hauls it up in a surge, a hang, then the next.
    const half = (p * 2) % 1;
    const surge = half < 0.4 ? Math.sin((half / 0.4) * Math.PI * 0.5) : 1 - 0.6 * ((half - 0.4) / 0.6);
    return pose({ view: 'back', climb: 2.5 * Math.sin(a), tx: 0.3 * Math.sin(a + 1), lift: 3.4 * surge, hair: -1 + 1.4 * Math.sin(a) });
  }
  // Leap climb: crouch tight against the wall, spring up, hang at the top of the leap, catch.
  const crouch = p < 0.2 ? Math.sin((p / 0.2) * Math.PI) : 0;
  const leap = p >= 0.2 && p < 0.7 ? Math.sin(((p - 0.2) / 0.5) * Math.PI * 0.5) ** 0.7 : p >= 0.7 ? 1 - ((p - 0.7) / 0.3) * 0.15 : 0;
  return pose({ view: 'back', climb: p < 0.2 ? 2.5 : -2.5 * (1 - leap * 0.6), tx: 0, lift: 9 * leap - 1.4 * crouch, hair: -2.4 * leap + 1 });
}

// ---------- Can't yet ----------
// Below the first few points a Mochiko can't do it yet (as a Chao child crawls before it walks,
// thrashes in water before it swims, and can't take off): under CANT.run Run points it crawls
// on its hands and knees; under CANT.swim Swim points it flails in the water, splashing, eyes
// squeezed, until someone lifts it out (data/mochi-raise.js rescue); under CANT.fly Fly points
// it crouches, leaps flapping like mad, hangs a moment, and flops back down on its bottom.
export const CANT = { run: 50, swim: 100, fly: 100 };
const CANT_MOVES = { crawl: { stride: 9, speed: 6 }, flail: { stride: 10, speed: 2 }, flop: { stride: 1, speed: 0.42 } };
const SAT = { squat: 3, bob: 3, legF: [3.4, -1.6, 40], legB: [2.2, -1.2, 30], front: [1, 1.5], back: [1.6, 1.5] };
function cantPose(what, p) {
  const a = TAU * p;
  if (what === 'crawl') {
    // A crawl on hands and knees: its body tipped right over, its head held up looking where it's
    // going; a hand and the opposite knee step ahead together, then the other pair, the head
    // nodding a little with each; tongue out, concentrating. (Tipped this far the rig needs it off
    // the ground, `tip`, so `sink` sets it back down onto its hands and knees.)
    const c = Math.sin(a);
    const up1 = Math.max(0, Math.sin(a));
    const up2 = Math.max(0, -Math.sin(a));
    const nod = Math.sin(a * 2);
    return pose({ lean: 1.1 + 0.03 * nod, tip: 6, sink: 18 - 0.5 * Math.abs(c), tilt: -62 + 3 * nod, hy: 0.4 + 0.3 * nod,
      front: [9 + 2.4 * c, -1.6 - 1.8 * up1], back: [8 - 2.4 * c, -1.6 - 1.8 * up2], armOver: true,
      legF: [-2 - 2 * c, -5 - 1.4 * up2, 60], legB: [-1 + 2 * c, -5 - 1.4 * up1, 60],
      hair: 0.5 * nod, mouth: 'mochiblep', sprout: 'curious', blush: 1.5 });
  }
  if (what === 'flail') {
    // Arms thrashing up out of the water by turns, legs kicking, bobbing low, splashing.
    const b = Math.sin(a * 2);
    return pose({ sink: 14 + 1.4 * b, tilt: 10 * Math.sin(a * 2 + 0.6), hy: 0.6, hx: 0.4 * b,
      front: [8 + 2 * Math.sin(a * 2), -12 - 4 * Math.sin(a * 2)], back: [-8 + 2 * Math.sin(a * 2 + Math.PI), -12 - 4 * Math.sin(a * 2 + Math.PI)],
      legF: [1.6 * Math.sin(a * 3), -1.4, 20], legB: [-1.6 * Math.sin(a * 3), -1.4, -20], hair: 1.2 * b,
      eyes: 'hurt', mouth: 'yell', extra: ['sweat1', 'drop'], sprout: 'excited', blush: 1.7, armOver: true });
  }
  // Flop: crouch, leap flapping, hang a moment (uh oh), fall, bump down on its bottom, get up.
  const ease = (k) => 0.5 - 0.5 * Math.cos(Math.PI * k);
  const flap = Math.sin(a * 9);
  if (p < 0.15) return pose({ squat: 1, front: [5, -5], back: [-5, -5], mouth: 'mochiflat', brows: [[-0.4, 0.8], [-0.4, 0.8]], sprout: 'excited' });
  if (p < 0.45) {
    const k = (p - 0.15) / 0.3;
    return pose({ lift: 7 * (1 - (1 - k) * (1 - k)), front: [10, -10 - 4 * flap], back: [-10, -10 + 4 * flap], tilt: -6, mouth: 'grit', brows: [[-0.4, 0.8], [-0.4, 0.8]], extra: ['sweat1'], sprout: 'excited' });
  }
  if (p < 0.58) return pose({ lift: 7, front: [10, -12 - 3 * flap], back: [-10, -12 + 3 * flap], tilt: 8 * Math.sin(a * 6), wide: true, mouth: 'mochio', extra: ['sweat1'], sprout: 'excited' });
  if (p < 0.72) {
    const k = (p - 0.58) / 0.14;
    return pose({ lift: 7 * (1 - k * k), front: [8, -14], back: [-8, -14], wide: true, mouth: 'gasp', extra: ['drop'], sprout: 'excited' });
  }
  if (p < 0.9) return pose({ ...SAT, eyes: 'hurt', mouth: 'mochiwave', extra: ['sweat0'], sprout: 'sad' });
  return pose({ squat: 1, front: [2, -2], back: [2, -2], mouth: 'mochiwave', blush: 1.7, extra: ['sweat0'] });
}

// ---------- Stamina: getting tired ----------
// How long it runs before tiring and how tired it gets, by Stamina points (six steps): a low one
// soon pants, slumps and slows, and in the end stops with its hands on its knees to catch its
// breath; a high one stays fresh and bouncy the whole way, and the best are still humming.
//   tire: fatigue gained a second of running; most: as tired as it ever gets
export const STAMINAS = [
  { name: 'puffed out', tire: 1 / 5, most: 1 },
  { name: 'tires quickly', tire: 1 / 8, most: 0.85 },
  { name: 'gets winded', tire: 1 / 12, most: 0.65 },
  { name: 'steady', tire: 1 / 18, most: 0.45 },
  { name: 'fresh', tire: 1 / 30, most: 0.25 },
  { name: 'tireless', tire: 0, most: 0 },
];
// How a tired runner looks: slumping, head drooping, arms lower, panting, sweating.
function tiredPose(P, f) {
  if (f <= 0.02) return P;
  return {
    ...P,
    lean: P.lean * (1 - 0.5 * f) + 0.06 * f,
    tilt: P.tilt + 10 * f, hy: P.hy + 1.6 * f, hx: P.hx - 0.4 * f,
    front: [P.front[0] * (1 - 0.4 * f), P.front[1] * (1 - 0.5 * f) + 1.4 * f],
    back: [P.back[0] * (1 - 0.4 * f), P.back[1] * (1 - 0.5 * f) + 1.4 * f],
    lift: P.lift * (1 - 0.6 * f),
  };
}
// Stopped to catch its breath: bent over, hands on its knees, panting fast.
function restPose(time) {
  const pant = Math.sin(time * 9);
  return pose({ lean: 0.3, tilt: 12, hy: 2 + 0.3 * pant, bob: 0.4 * pant, squat: 1, front: [1.4, 4.4], back: [0.6, 4.2], legF: [1.4, 0, 6], legB: [-1.2, 0, -6], eyes: 'half', mouth: 'tongue', blush: 1.8 });
}

// ---------- Standing ----------
// Breathing in its stance, and its weight shifting from foot to foot now and then.
// (A loop of 6 s on 12 frames a second, every rhythm in it a whole number of times round, so its
// 72 drawings come round again and again: speed rules.)
export const STAND_LOOP = { secs: 6, fps: 12 };
// A Mochiko stands like the baby it is (whatever its personality): paws up at its chest, feet
// together, its head snug down on its shoulders, a rosier blush. Rounder, by pose alone.
const babyOf = (st) => ({ ...st, front: [1.4, -4.4], back: [2, -4.2], legF: [0.5, 0, 1.5], legB: [-0.5, 0, -1.5], hy: (st.hy ?? 1) + 0.6, blush: 1.6 });
function standPose(g, time, baby = false) {
  const st = baby ? babyOf(STANCE[g.personality] ?? STANCE.gentle) : STANCE[g.personality] ?? STANCE.gentle;
  const ph = hash(g.seed) * TAU;
  const t = loopTime(g, time);
  const w = TAU / STAND_LOOP.secs;
  const br = Math.sin(t * w * 2 + ph);
  const shift = Math.sin(t * w + ph) > 0.5 ? 1 : 0;
  return pose({ ...st, bob: 0.3 * br, hy: (st.hy ?? 1) + 0.25 * Math.sin(t * w * 2 + ph - 0.6), tilt: st.tilt + 1.5 * shift, hx: (st.hx ?? 0) + 0.3 * shift, hair: 0.3 * Math.sin(t * w + ph) });
}

// ---------- Idle moments ----------
// Standing about, every few seconds a Mochi plays a little moment: one of the shared ones (more
// likely the ones that suit its personality) or, often, its personality's own signature. Each is
// a few keyframes eased into one another (`[seconds, changes]`), played on 12 fixed frames a
// second from its start over a still stance, so every drawing comes round again. Faces change on
// their key and lead the body a beat (the face reacts first); `turned` faces the other way.
const KEY = (t, o) => [t, o];
// Where its little arms can go (chibi arms are short: a hand reaches the mouth, a cheek, the eyes,
// or flings out to the side, never above the big head). `over` draws the near arm on top of the
// head, for a hand at the face.
const OUT = (y = -12) => ({ front: [10, y], back: [-10, y] }); // both flung out and up
const CROSSED = { front: [-9.7, -5.1], back: [9.5, -5.6] }; // arms folded
const HIPS = { front: [-1.6, -1.6], back: [-1.4, -1.4] }; // hands on hips
const MOUTH = { front: [-5, -9], over: true }; // near hand at its mouth
const CHEEK = { front: [-1, -12], over: true }; // ...on its cheek
const EYES = { front: [-4, -16], over: true }; // ...over its eyes
const BROW = { front: [2, -18], over: true }; // ...shading its eyes / at its temple
const CHEST = { front: [-3, -6], back: [5, -6] }; // hands on its chest
export const IDLE_BITS = {
  // ---- Shared ----
  stretch: { dur: 2.8, likes: ['lazy', 'sleepy', 'sporty'], keys: [
    KEY(0, {}), KEY(0.35, { eyes: 'half', mouth: 'o', squat: 1, hy: 1.6, front: [3, -4], back: [-3, -4] }),
    KEY(0.9, { ...OUT(-13), tilt: -8, lift: 1.4, closed: [true, true], mouth: 'yawn', legF: [0.6, -0.4, 10], legB: [-0.6, -0.4, -10] }),
    KEY(1.8, { ...OUT(-14), tilt: -10, lift: 1.6, closed: [true, true], mouth: 'yawn' }),
    KEY(2.3, { tilt: 2, hy: 1.2, mouth: 'mochiw', eyes: 'half' }), KEY(2.8, {})] },
  lookaround: { dur: 3, likes: ['curious', 'nosy', 'timid', 'sneaky'], keys: [
    KEY(0, {}), KEY(0.3, { glance: -1, tilt: 4, hx: -0.6 }), KEY(1.1, { glance: -1, tilt: 6, hx: -0.8, mouth: 'mochio' }),
    KEY(1.5, { glance: 1, tilt: -6, hx: 0.6 }), KEY(2.3, { glance: 1, tilt: -6, hx: 0.8, brows: [[0.4, 0], [0.4, 0]] }), KEY(3, {})] },
  hops: { dur: 2, likes: ['playful', 'bubbly', 'hyper'], keys: [
    KEY(0, { squat: 1 }), KEY(0.2, { lift: 5, ...OUT(-10), closed: [true, true], mouth: 'D', sprout: 'happy' }), KEY(0.45, { lift: 0, squat: 1, front: [5, -5], back: [-5, -5] }),
    KEY(0.65, { lift: 5, ...OUT(-11), closed: [true, true], mouth: 'D', extra: ['spark0'] }), KEY(0.9, { lift: 0, squat: 1, front: [5, -5], back: [-5, -5] }),
    KEY(1.1, { lift: 4, ...OUT(-10), closed: [true, true], mouth: 'D' }), KEY(1.4, { lift: 0, squat: 1 }), KEY(2, {})] },
  plop: { dur: 4, likes: ['lazy', 'playful', 'dreamy'], keys: [
    KEY(0, {}), KEY(0.4, { squat: 3, hy: 1.4, mouth: 'mochio' }),
    KEY(0.7, { squat: 3, bob: 3, legF: [3.4, -2.4, 50], legB: [1.8, -2, 40], front: [1, 1.5], back: [1.6, 1.5], mouth: 'mochiw', sprout: 'happy' }),
    KEY(1.4, { squat: 3, bob: 3, legF: [3.8, -3.6, 70], legB: [1.6, -1.2, 30], front: [1, 1.5], back: [1.6, 1.5], closed: [true, true], mouth: 'D' }),
    KEY(2.1, { squat: 3, bob: 3, legF: [3, -1.6, 40], legB: [2.2, -3.4, 66], front: [1, 1.5], back: [1.6, 1.5], closed: [true, true], mouth: 'D' }),
    KEY(2.8, { squat: 3, bob: 3, legF: [3.8, -3.6, 70], legB: [1.6, -1.2, 30], front: [1, 1.5], back: [1.6, 1.5], mouth: 'mochiw' }),
    KEY(3.4, { squat: 1, hy: 1.4 }), KEY(4, {})] },
  scratch: { dur: 2.4, likes: ['clumsy', 'curious', 'dreamy'], keys: [
    KEY(0, {}), KEY(0.25, { brows: [[0.6, -0.4], [0.2, 0.2]], mouth: 'mochiside', glance: 1 }),
    KEY(0.6, { front: [3, -19], over: true, tilt: 6, brows: [[0.6, -0.4], [0.2, 0.2]], mouth: 'mochiside', extra: ['q'] }),
    KEY(0.9, { front: [4, -18], over: true, tilt: 8, extra: ['q'] }), KEY(1.2, { front: [3, -19], over: true, tilt: 6, extra: ['q'] }), KEY(1.5, { front: [4, -18], over: true, tilt: 8 }),
    KEY(1.9, { front: [3, -10], over: true, mouth: 'mochiwave' }), KEY(2.4, {})] },
  wave: { dur: 2.4, likes: ['sweet', 'polite', 'clingy', 'chatty'], keys: [
    KEY(0, {}), KEY(0.2, { closed: [true, true], mouth: 'mochiopen', front: [6, -9], over: true }),
    KEY(0.45, { front: [10, -15], over: true, tilt: -4, closed: [true, true], mouth: 'D', sprout: 'happy' }), KEY(0.75, { front: [6, -17], over: true, tilt: -2, closed: [true, true], mouth: 'D' }),
    KEY(1.05, { front: [10, -15], over: true, tilt: -4, closed: [true, true], mouth: 'D' }), KEY(1.35, { front: [6, -17], over: true, tilt: -2, closed: [true, true], mouth: 'D' }),
    KEY(1.7, { front: [8, -12], over: true, mouth: 'mochiw' }), KEY(2.4, {})] },
  twirl: { dur: 2, likes: ['showoff', 'bubbly', 'dreamy', 'sassy'], keys: [
    KEY(0, {}), KEY(0.2, { squat: 1, front: [8, -5], back: [-8, -5] }), KEY(0.5, { lift: 2, turned: true, ...OUT(-8), closed: [true, true], mouth: 'D' }),
    KEY(0.8, { lift: 2, turned: false, ...OUT(-9), closed: [true, true], mouth: 'D', extra: ['spark1'] }), KEY(1.1, { lift: 0, squat: 1 }), KEY(2, { front: [1, -1] })] },
  hum: { dur: 3.6, likes: ['gentle', 'dreamy', 'artsy', 'sweet'], keys: [
    KEY(0, {}), KEY(0.4, { closed: [true, true], mouth: 'o', tilt: 6, hx: 0.4, extra: ['note'] }), KEY(1.2, { closed: [true, true], mouth: 'mochiw', tilt: -6, hx: -0.4, extra: ['note'] }),
    KEY(2, { closed: [true, true], mouth: 'o', tilt: 6, hx: 0.4, extra: ['note'] }), KEY(2.8, { closed: [true, true], mouth: 'mochiw', tilt: -4, hx: -0.4 }), KEY(3.6, {})] },
  yawn: { dur: 3, likes: ['sleepy', 'lazy'], keys: [
    KEY(0, {}), KEY(0.3, { eyes: 'half', mouth: 'o' }), KEY(0.8, { eyes: 'half', mouth: 'yawn', ...MOUTH, tilt: -6 }),
    KEY(1.6, { closed: [true, true], mouth: 'yawn', ...MOUTH, tilt: -8, extra: ['tear0'] }),
    KEY(2.1, { eyes: 'half', mouth: 'mochiw', front: [-2, -15], over: true, tilt: 2 }), KEY(2.5, { eyes: 'half', front: [-1, -16], over: true }), KEY(3, {})] },
  clap: { dur: 2, likes: ['bubbly', 'playful', 'sweet', 'hyper'], keys: [
    KEY(0, {}), KEY(0.15, { closed: [true, true], mouth: 'D', front: [5, -9], back: [-5, -9], over: true }),
    KEY(0.3, { front: [-3, -9], back: [6, -9], over: true, lift: 1.6, closed: [true, true], mouth: 'D', extra: ['spark0'] }), KEY(0.5, { front: [5, -9], back: [-5, -9], over: true, lift: 0 }),
    KEY(0.7, { front: [-3, -9], back: [6, -9], over: true, lift: 1.6, extra: ['spark1'] }), KEY(0.9, { front: [5, -9], back: [-5, -9], over: true, lift: 0 }),
    KEY(1.1, { front: [-3, -9], back: [6, -9], over: true, lift: 1.6, extra: ['spark0'] }), KEY(2, {})] },
  sprout: { dur: 3, likes: ['curious', 'dreamy', 'playful'], keys: [
    KEY(0, {}), KEY(0.3, { look: 'up', tilt: -8, mouth: 'mochio' }), KEY(0.8, { look: 'up', tilt: -10, hy: 0.6, hair: 2, mouth: 'mochio', sprout: 'curious', ...BROW }),
    KEY(1.4, { look: 'up', tilt: -10, hair: -2, mouth: 'mochiw', sprout: 'happy', ...BROW }), KEY(2, { look: 'up', tilt: -10, hair: 2, closed: [true, true], mouth: 'D', sprout: 'excited' }), KEY(3, {})] },
  sneeze: { dur: 2.2, likes: ['clumsy', 'timid'], keys: [
    KEY(0, {}), KEY(0.3, { eyes: 'half', mouth: 'mochio', tilt: -6, hy: 0.4 }), KEY(0.7, { closed: [true, true], mouth: 'o', tilt: -10, lift: 0.6, front: [2, -8], over: true }),
    KEY(0.85, { eyes: 'hurt', mouth: 'gasp', tilt: 10, hy: 1.6, squat: 1, ...MOUTH, extra: ['bang1', 'sweat0'] }),
    KEY(1.4, { eyes: 'half', mouth: 'mochiwave', tilt: 4, front: [-2, -11], over: true }), KEY(2.2, {})] },
  shuffle: { dur: 2.8, likes: ['hyper', 'showoff', 'playful', 'chatty'], keys: [
    KEY(0, {}), KEY(0.25, { legF: [2, -1.8, 20], front: [9, -9], back: [-1, -2], tilt: -6, mouth: 'D' }), KEY(0.5, { legF: [0.8, 0, 0], legB: [-2, -1.8, -20], front: [1, -2], back: [-9, -9], tilt: 6, mouth: 'D' }),
    KEY(0.75, { legF: [2, -1.8, 20], front: [9, -9], back: [-1, -2], tilt: -6, extra: ['note'] }), KEY(1, { legF: [0.8, 0, 0], legB: [-2, -1.8, -20], front: [1, -2], back: [-9, -9], tilt: 6, extra: ['note'] }),
    KEY(1.25, { legF: [2, -1.8, 20], front: [9, -9], back: [-1, -2], tilt: -6, closed: [true, true] }), KEY(1.5, { legF: [0.8, 0, 0], legB: [-2, -1.8, -20], front: [1, -2], back: [-9, -9], tilt: 6, closed: [true, true] }),
    KEY(2, { lift: 2.4, ...OUT(-13), closed: [true, true], mouth: 'D', extra: ['spark0'] }), KEY(2.8, {})] },
  tidy: { dur: 2.6, likes: ['polite', 'stoic', 'proud'], keys: [
    KEY(0, {}), KEY(0.3, { look: 'down', tilt: 8, hy: 1.4, front: [-1, 0], back: [3, 0] }), KEY(0.6, { look: 'down', tilt: 8, hy: 1.4, front: [-3, 1], back: [4, 1] }),
    KEY(0.9, { look: 'down', tilt: 8, hy: 1.4, front: [-1, 0], back: [3, 0] }), KEY(1.2, { look: 'down', tilt: 8, hy: 1.4, front: [-3, 1], back: [4, 1] }),
    KEY(1.7, { tilt: -4, closed: [true, true], mouth: 'mochibeam', extra: ['spark1'] }), KEY(2.6, {})] },
  sigh: { dur: 2.6, likes: ['grumpy', 'loner', 'lazy', 'timid'], keys: [
    KEY(0, {}), KEY(0.3, { eyes: 'half', mouth: 'o', lift: 0.6, tilt: -4 }), KEY(1, { eyes: 'half', mouth: 'mochiflat', hy: 2, tilt: 10, front: [0.6, 1], back: [0.4, 0.8], extra: ['dots3'], sprout: 'sad' }),
    KEY(2, { eyes: 'half', mouth: 'mochiflat', hy: 1.6, tilt: 8, sprout: 'sad' }), KEY(2.6, {})] },
  peek: { dur: 2.6, likes: ['nosy', 'curious', 'sneaky', 'mischief'], keys: [
    KEY(0, {}), KEY(0.3, { squat: 2, hy: 1.2, mouth: 'mochio' }), KEY(0.7, { squat: 2, lean: 0.2, hx: 1.4, tilt: -12, glance: 1, ...BROW, mouth: 'mochio', extra: ['q'] }),
    KEY(1.6, { squat: 2, lean: 0.24, hx: 1.6, tilt: -14, glance: 1, ...BROW, mouth: 'mochiw' }), KEY(2.1, { squat: 1 }), KEY(2.6, {})] },

  // Hungry (its tummy empty a while): rubs its tummy, looks round for something to eat, sighs.
  hungry: { dur: 3, keys: [
    KEY(0, {}), KEY(0.2, { front: [-3, -1], back: [4, -1], look: 'down', mouth: 'mochiwave', brows: [[0.5, -0.7], [0.5, -0.7]], sprout: 'sad' }),
    KEY(0.6, { front: [-2, -2], back: [3, -2], look: 'down', mouth: 'mochiwave', brows: [[0.5, -0.7], [0.5, -0.7]], extra: ['dots3'] }),
    KEY(1.1, { front: [-3, -1], back: [4, -1], glance: -1, tilt: 6, mouth: 'mochio', extra: ['q'], sprout: 'curious' }),
    KEY(1.7, { front: [-3, -1], back: [4, -1], glance: 1, tilt: -6, mouth: 'mochio', extra: ['q'] }),
    KEY(2.3, { front: [-2, -2], back: [3, -2], closed: [true, true], mouth: 'mochiwave', hy: 1.6, tilt: 8, sprout: 'sad' }), KEY(3, {})] },

  // ---- Signatures, one for each personality ----
  // Playful: spins round and round after its own sprout, arms out, then wobbles, dizzy.
  sig_playful: { dur: 3, keys: [
    KEY(0, {}), KEY(0.2, { look: 'up', ...OUT(-9), mouth: 'D' }), KEY(0.5, { look: 'up', turned: true, ...OUT(-10), lift: 1, mouth: 'D' }),
    KEY(0.8, { look: 'up', turned: false, ...OUT(-9), lift: 1, mouth: 'D', sprout: 'excited' }), KEY(1.1, { look: 'up', turned: true, ...OUT(-10), lift: 1 }),
    KEY(1.4, { look: 'up', turned: false, ...OUT(-9), lift: 1 }), KEY(1.8, { spiral: 1, extra: ['orbit'], mouth: 'wavy', tilt: 10, front: [6, -4], back: [-6, -6] }), KEY(2.4, { spiral: 2, extra: ['orbit'], mouth: 'wavy', tilt: -8, front: [6, -6], back: [-6, -4] }), KEY(3, {})] },
  // Shy: hides its face behind its hand, peeks out from behind it, hides again.
  sig_shy: { dur: 3.6, keys: [
    KEY(0, {}), KEY(0.2, { blush: 2, mouth: 'tiny' }), KEY(0.5, { ...EYES, back: [2, -3], blush: 2, closed: [true, true], tilt: 6, hy: 1.4 }),
    KEY(1.4, { ...CHEEK, back: [2, -3], blush: 2, glance: 1, tilt: 4, extra: ['sweat0'] }), KEY(2, { ...EYES, back: [2, -3], blush: 2, closed: [true, true], tilt: 8 }), KEY(3.6, {})] },
  // Proud: hands on hips, chest out, chin up, a little nod to itself.
  sig_proud: { dur: 2.8, keys: [
    KEY(0, {}), KEY(0.2, { mouth: 'smirk' }), KEY(0.5, { ...HIPS, tilt: -10, hy: 0.2, lean: -0.06, closed: [true, true], mouth: 'smirk', extra: ['spark0'] }),
    KEY(1.2, { ...HIPS, tilt: -4, closed: [true, true], mouth: 'smirk' }), KEY(1.6, { ...HIPS, tilt: -10, closed: [true, true], mouth: 'D' }), KEY(2.8, {})] },
  // Sleepy: nods off where it stands, head drooping lower and lower, jolts awake, rubs an eye.
  sig_sleepy: { dur: 4.2, keys: [
    KEY(0, { eyes: 'half' }), KEY(0.6, { eyes: 'half', hy: 1.6, tilt: 8, extra: ['zzz0'], sprout: 'sleepy' }), KEY(1.6, { closed: [true, true], hy: 2.2, tilt: 14, front: [0.4, 1], back: [0.2, 0.8], extra: ['zzz1'], sprout: 'sleepy' }),
    KEY(2.6, { closed: [true, true], hy: 2.6, tilt: 18, lean: 0.12, extra: ['zzz2'], sprout: 'sleepy' }), KEY(2.9, { wide: true, mouth: 'gasp', tilt: -6, lift: 1.4, ...OUT(-8), extra: ['bang1'] }),
    KEY(3.3, { closed: [true, true], mouth: 'mochiwave', tilt: 2, front: [-2, -16], over: true }), KEY(3.7, { eyes: 'half', mouth: 'mochiwave', front: [-1, -15], over: true }), KEY(4.2, { eyes: 'half' })] },
  // Curious: crouches down to look closely at something on the ground, head tilting.
  sig_curious: { dur: 3.4, keys: [
    KEY(0, {}), KEY(0.3, { look: 'down', mouth: 'mochio', extra: ['q'] }), KEY(0.8, { squat: 3, bob: 2, lean: 0.18, look: 'down', tilt: 10, front: [3, 2], back: [2.4, 1.8], mouth: 'mochio' }),
    KEY(1.6, { squat: 3, bob: 2, lean: 0.18, look: 'down', tilt: -6, front: [5, 0], mouth: 'mochiw' }), KEY(2.3, { squat: 3, bob: 2, lean: 0.18, look: 'down', tilt: 12, closed: [true, true], mouth: 'D', extra: ['spark0'] }), KEY(3.4, {})] },
  // Bossy: points ahead and stamps a foot, telling everyone what's what.
  sig_bossy: { dur: 2.8, keys: [
    KEY(0, {}), KEY(0.2, { brows: [[-0.4, 0.8], [-0.4, 0.8]], back: [-1.4, -1.4] }), KEY(0.45, { front: [12, -8], back: [-1.4, -1.4], legF: [1.6, -2.4, 20], tilt: -6, mouth: 'yell', brows: [[-0.4, 0.8], [-0.4, 0.8]], extra: ['bang1'] }),
    KEY(0.7, { front: [12, -8], back: [-1.4, -1.4], legF: [1.6, 0, 0], tilt: -6, mouth: 'yell', bob: 0.6 }), KEY(1.2, { front: [12, -9], back: [-1.4, -1.4], legF: [1.6, -2.4, 20], tilt: -8, mouth: 'grin' }),
    KEY(1.45, { front: [12, -9], back: [-1.4, -1.4], legF: [1.6, 0, 0], bob: 0.6 }), KEY(2.8, {})] },
  // Gentle: hands over its heart, a soft smile, little hearts.
  sig_gentle: { dur: 3, keys: [
    KEY(0, {}), KEY(0.3, { closed: [true, true], mouth: 'mochibeam' }), KEY(0.7, { ...CHEST, closed: [true, true], tilt: 8, mouth: 'mochibeam', extra: ['hearts'], blush: 1.7, sprout: 'happy' }),
    KEY(2.2, { ...CHEST, closed: [true, true], tilt: 6, extra: ['hearts'] }), KEY(3, {})] },
  // Show-off: a peace sign by its face, a hand on its hip, a wink.
  sig_showoff: { dur: 2.6, keys: [
    KEY(0, {}), KEY(0.2, { squat: 1, mouth: 'grin' }), KEY(0.45, { front: [2, -15], over: true, back: [-1.6, -1.4], legF: [2, 0, 10], tilt: -8, lean: -0.08, closed: [false, true], mouth: 'D', extra: ['spark0', 'spark1'] }),
    KEY(1.6, { front: [2, -15], over: true, back: [-1.6, -1.4], legF: [2, 0, 10], tilt: -8, lean: -0.08, closed: [false, true], mouth: 'tongue', extra: ['spark1'] }), KEY(2.6, {})] },
  // Clumsy: trips over nothing, windmills its arms, wobbles, and just about stays up.
  sig_clumsy: { dur: 2.6, keys: [
    KEY(0, {}), KEY(0.2, { legF: [2.4, -1.6, 30], mouth: 'mochio' }), KEY(0.45, { lean: 0.3, tip: 2, front: [11, -11], back: [-10, -4], wide: true, mouth: 'gasp', legB: [-2.4, -2, -20], extra: ['drop'] }),
    KEY(0.75, { lean: -0.2, tip: 2, front: [9, -3], back: [-11, -11], wide: true, mouth: 'yell' }), KEY(1.05, { lean: 0.14, front: [11, -10], back: [-10, -6], mouth: 'wavy', extra: ['sweat1'] }),
    KEY(1.5, { mouth: 'mochiwave', blush: 1.8, extra: ['sweat0'], front: [3, -19], over: true }), KEY(2.2, { mouth: 'mochiwave', front: [4, -18], over: true }), KEY(2.6, {})] },
  // Brave: pumps a fist, ready for anything.
  sig_brave: { dur: 2.4, keys: [
    KEY(0, {}), KEY(0.2, { squat: 1, front: [4, -5], brows: [[-0.4, 0.8], [-0.4, 0.8]] }), KEY(0.4, { front: [7, -19], over: true, back: [-2, -3], lift: 2.4, tilt: -10, mouth: 'yell', brows: [[-0.4, 0.8], [-0.4, 0.8]], extra: ['bang1', 'spark0'] }),
    KEY(0.8, { front: [7, -18], over: true, back: [-2, -3], lift: 0, squat: 1, mouth: 'grin' }), KEY(2.4, {})] },
  // Grumpy: folds its arms, stomps, huffs a puff of steam.
  sig_grumpy: { dur: 3, keys: [
    KEY(0, {}), KEY(0.2, { brows: [[-0.4, 0.8], [-0.4, 0.8]], mouth: 'mochifrown' }), KEY(0.5, { ...CROSSED, cross: 0.5, mouth: 'mochifrown', tilt: 6 }),
    KEY(0.9, { ...CROSSED, cross: 0.5, legF: [1.4, -2.2, 20], mouth: 'mochifrown' }), KEY(1.15, { ...CROSSED, cross: 0.6, legF: [1.4, 0, 0], bob: 0.8, mouth: 'mochifrown', extra: ['steam0', 'vein'] }),
    KEY(2.2, { ...CROSSED, cross: 0.5, mouth: 'mochifrown', tilt: -4, glance: -1 }), KEY(3, {})] },
  // Dreamy: gazes up at the sky, chin on its hand, lost in a daydream.
  sig_dreamy: { dur: 3.6, keys: [
    KEY(0, {}), KEY(0.4, { look: 'up', ...MOUTH, back: [4, -6], tilt: -8, mouth: 'mochiw', blush: 1.6 }),
    KEY(1.6, { look: 'up', front: [-4, -9], over: true, back: [4, -6], tilt: -10, hx: 0.4, shine: true, mouth: 'mochiw', extra: ['hearts'], sprout: 'happy' }), KEY(2.8, { look: 'up', ...MOUTH, tilt: -8, shine: true }), KEY(3.6, {})] },
  // Cheeky: pulls down an eyelid and sticks its tongue out at you.
  sig_cheeky: { dur: 2.4, keys: [
    KEY(0, {}), KEY(0.2, { mouth: 'smirk', glance: 1 }), KEY(0.5, { front: [1, -16], over: true, mouth: 'bleh', tilt: -6, lean: 0.06, extra: ['spark0'] }),
    KEY(1.5, { front: [1, -15.5], over: true, mouth: 'bleh', tilt: -8 }), KEY(1.8, { closed: [true, true], mouth: 'D' }), KEY(2.4, {})] },
  // Timid: jumps at a sudden noise, then calms itself, a hand on its chest.
  sig_timid: { dur: 3, keys: [
    KEY(0, {}), KEY(0.15, { wide: true, mouth: 'gasp' }), KEY(0.3, { lift: 4, wide: true, mouth: 'gasp', ...OUT(-11), extra: ['shock'], sprout: 'excited' }),
    KEY(0.6, { lift: 0, squat: 1, wide: true, mouth: 'mochio', ...MOUTH, back: [3, -4], extra: ['sweat1'] }), KEY(1.6, { closed: [true, true], mouth: 'mochiw', ...CHEST, tilt: 6, extra: ['sweat0'] }), KEY(3, {})] },
  // Bubbly: bounces on its toes, clapping, sparkling.
  sig_bubbly: { dur: 2.6, keys: [
    KEY(0, {}), KEY(0.2, { lift: 2.4, front: [-3, -9], back: [6, -9], over: true, closed: [true, true], mouth: 'D', extra: ['spark0'] }), KEY(0.4, { lift: 0, front: [5, -9], back: [-5, -9], over: true }),
    KEY(0.6, { lift: 2.4, front: [-3, -9], back: [6, -9], over: true, closed: [true, true], mouth: 'D', extra: ['spark1'] }), KEY(0.8, { lift: 0, front: [5, -9], back: [-5, -9], over: true }),
    KEY(1, { lift: 2.4, front: [-3, -9], back: [6, -9], over: true, closed: [true, true], mouth: 'D', extra: ['hearts'] }), KEY(1.3, { lift: 0 }), KEY(2.6, {})] },
  // Stoic: closes its eyes and breathes slowly, perfectly still, a little calm smile.
  sig_stoic: { dur: 4, keys: [
    KEY(0, {}), KEY(0.4, { closed: [true, true], front: [-2, -2], back: [4, -2], mouth: 'mochiflat' }), KEY(1.6, { closed: [true, true], front: [-2, -2], back: [4, -2], lift: 0.6, mouth: 'mochiflat' }),
    KEY(2.8, { closed: [true, true], front: [-2, -2], back: [4, -2], lift: 0, mouth: 'mochibeam' }), KEY(4, {})] },
  // Foodie: daydreams about a snack, finger at its lip, drools, then pats its tummy.
  sig_foodie: { dur: 3.4, keys: [
    KEY(0, {}), KEY(0.3, { look: 'up', mouth: 'mochio', tilt: -6 }), KEY(0.8, { look: 'up', shine: true, mouth: 'mochidrool', tilt: -8, ...MOUTH, blush: 1.6, extra: ['hearts'] }),
    KEY(1.8, { closed: [true, true], mouth: 'mochiw', front: [-3, -1], back: [4, -1], tilt: 6 }), KEY(2.2, { closed: [true, true], mouth: 'mochiw', front: [-2, -2], back: [3, -2], tilt: 6 }),
    KEY(2.6, { closed: [true, true], mouth: 'mochiw', front: [-3, -1], back: [4, -1], tilt: 6 }), KEY(3.4, {})] },
  // Sassy: a hand on its hip and a flick of its hair, chin up.
  sig_sassy: { dur: 2.6, keys: [
    KEY(0, {}), KEY(0.2, { mouth: 'smirk' }), KEY(0.4, { back: [-1.4, -1.4], front: [4, -19], over: true, tilt: -12, hair: -2.6, lid: 0.3, mouth: 'smirk', extra: ['spark1'] }),
    KEY(0.8, { back: [-1.4, -1.4], front: [9, -13], over: true, tilt: -6, hair: 2.4, lid: 0.3, mouth: 'smirk' }), KEY(1.8, { back: [-1.4, -1.4], tilt: -8, lid: 0.35, mouth: 'smugcat' }), KEY(2.6, {})] },
  // Lazy: flops down to sit and lets out a long sigh.
  sig_lazy: { dur: 4, keys: [
    KEY(0, { eyes: 'half' }), KEY(0.5, { squat: 3, bob: 3, legF: [3.4, -1.6, 40], legB: [2.2, -1.2, 30], front: [1.4, 2], back: [1.4, 2], eyes: 'half', mouth: 'o', tilt: 8 }),
    KEY(1.4, { squat: 3, bob: 3.4, legF: [3.6, -1.6, 46], legB: [2.4, -1.2, 34], front: [1.4, 2.2], back: [1.4, 2.2], closed: [true, true], mouth: 'mochiflat', tilt: 12, extra: ['dots3'], sprout: 'sleepy' }),
    KEY(3.2, { squat: 3, bob: 3.4, legF: [3.6, -1.6, 46], legB: [2.4, -1.2, 34], front: [1.4, 2.2], back: [1.4, 2.2], eyes: 'half', mouth: 'mochiflat', tilt: 10 }), KEY(4, { eyes: 'half' })] },
  // Hyper: can't keep still: quick little bounces, arms flapping, sparkles everywhere.
  sig_hyper: { dur: 2.2, keys: [
    KEY(0, {}), KEY(0.12, { lift: 2, front: [10, -11], back: [-3, -3], mouth: 'D', shine: true }), KEY(0.24, { lift: 0, front: [3, -3], back: [-10, -11] }),
    KEY(0.36, { lift: 2, front: [10, -11], back: [-3, -3], extra: ['spark0'] }), KEY(0.48, { lift: 0, front: [3, -3], back: [-10, -11] }),
    KEY(0.6, { lift: 2, front: [10, -11], back: [-3, -3], extra: ['spark1'] }), KEY(0.72, { lift: 0, front: [3, -3], back: [-10, -11] }),
    KEY(0.84, { lift: 2, front: [10, -11], back: [-3, -3], extra: ['spark0'] }), KEY(0.96, { lift: 0 }), KEY(2.2, {})] },
  // Polite: a neat little bow, hands together in front.
  sig_polite: { dur: 2.8, keys: [
    KEY(0, {}), KEY(0.2, { closed: [true, true], mouth: 'mochibeam', front: [-3, 0], back: [5, 0] }), KEY(0.6, { lean: 0.32, front: [-3, 0], back: [5, 0], closed: [true, true], mouth: 'mochibeam', tilt: 8 }),
    KEY(1.6, { lean: 0.32, front: [-3, 0], back: [5, 0], closed: [true, true], tilt: 8 }), KEY(2.1, { closed: [true, true], mouth: 'mochibeam', extra: ['spark1'] }), KEY(2.8, {})] },
  // Mischief: rubs its hands together with a sly little giggle.
  sig_mischief: { dur: 2.8, keys: [
    KEY(0, {}), KEY(0.2, { lid: 0.35, mouth: 'slysmile', glance: -1 }), KEY(0.5, { front: [-3, -7], back: [5, -7], lid: 0.35, mouth: 'slysmile', tilt: 6, glance: -1 }),
    KEY(0.8, { front: [-4, -6], back: [6, -6], lid: 0.35, mouth: 'slysmile', tilt: 4 }), KEY(1.1, { front: [-3, -7], back: [5, -7], closed: [true, true], mouth: 'smugcat', tilt: 8, extra: ['spark0'] }),
    KEY(1.4, { front: [-4, -6], back: [6, -6], closed: [true, true], mouth: 'smugcat' }), KEY(1.7, { front: [-3, -7], back: [5, -7], closed: [true, true], mouth: 'smugcat' }), KEY(2.8, {})] },
  // Clingy: looks round for you, a bit lost, then spots you and opens its arms for a hug.
  sig_clingy: { dur: 3.4, keys: [
    KEY(0, {}), KEY(0.3, { glance: -1, mouth: 'mochiwave', brows: [[0.5, -0.7], [0.5, -0.7]], tilt: 4, ...CHEST }), KEY(1, { glance: 1, mouth: 'mochiwave', brows: [[0.5, -0.7], [0.5, -0.7]], teary: 1, tilt: -4, sprout: 'sad', ...CHEST }),
    KEY(1.6, { wide: true, mouth: 'mochio' }), KEY(1.9, { closed: [true, true], mouth: 'D', front: [11, -8], back: [-11, -8], lift: 1.6, extra: ['hearts'], sprout: 'excited' }), KEY(3.4, {})] },
  // Loner: turns away and gazes off into the distance for a while.
  sig_loner: { dur: 4, keys: [
    KEY(0, {}), KEY(0.4, { turned: true, glance: -1, mouth: 'mochiflat' }), KEY(1.2, { turned: true, look: 'up', mouth: 'mochiflat', extra: ['dots3'] }),
    KEY(3, { turned: true, eyes: 'half', mouth: 'mochiflat' }), KEY(3.4, { turned: false }), KEY(4, {})] },
  // Artsy: squints along its thumb at the view, like a painter sizing it up.
  sig_artsy: { dur: 3, keys: [
    KEY(0, {}), KEY(0.3, { lid: 0.3, mouth: 'mochio' }), KEY(0.6, { front: [4, -15], over: true, closed: [false, 'blink'], mouth: 'mochio', tilt: -6, lean: -0.06 }),
    KEY(1.6, { front: [5, -15], over: true, closed: [false, 'blink'], mouth: 'mochiw', tilt: -10, lean: -0.08 }), KEY(2.1, { shine: true, mouth: 'D', extra: ['spark0', 'spark1'] }), KEY(3, {})] },
  // Sporty: a couple of quick jumping jacks.
  sig_sporty: { dur: 2.6, keys: [
    KEY(0, {}), KEY(0.25, { ...OUT(-13), lift: 2.4, legF: [2.6, -1, 30], legB: [-2.6, -1, -30], mouth: 'mochiopen' }), KEY(0.5, { lift: 0, legF: [0.8, 0, 0], legB: [-0.8, 0, 0], front: [1, 0.4], back: [-1, 0.4] }),
    KEY(0.75, { ...OUT(-13), lift: 2.4, legF: [2.6, -1, 30], legB: [-2.6, -1, -30], mouth: 'mochiopen' }), KEY(1, { lift: 0, legF: [0.8, 0, 0], legB: [-0.8, 0, 0], front: [1, 0.4], back: [-1, 0.4] }),
    KEY(1.25, { ...OUT(-13), lift: 2.4, legF: [2.6, -1, 30], legB: [-2.6, -1, -30], closed: [true, true], mouth: 'D' }), KEY(1.6, { lift: 0 }), KEY(2.6, {})] },
  // Nosy: leans way over, a hand shading its eyes, to peek at something it shouldn't.
  sig_nosy: { dur: 3, keys: [
    KEY(0, {}), KEY(0.3, { glance: 1, mouth: 'mochio' }), KEY(0.8, { lean: 0.3, hx: 1.8, tilt: -14, glance: 1, ...BROW, mouth: 'mochio', legB: [-1.6, -1.6, -20] }),
    KEY(1.8, { lean: 0.34, hx: 2, tilt: -16, glance: 1, ...BROW, mouth: 'smirk', legB: [-1.8, -1.8, -24], extra: ['q'] }), KEY(3, {})] },
  // Dramatic: a big swoon, the back of a hand to its forehead, the other arm flung out.
  sig_dramatic: { dur: 3, keys: [
    KEY(0, {}), KEY(0.2, { mouth: 'gasp', brows: [[0.5, -0.7], [0.5, -0.7]] }), KEY(0.5, { front: [-1, -19], over: true, back: [-11, -8], lean: -0.18, tilt: 10, closed: [true, true], mouth: 'o', brows: [[0.5, -0.7], [0.5, -0.7]], legB: [-1.6, -1, -20] }),
    KEY(1.8, { front: [-1, -19], over: true, back: [-11, -9], lean: -0.22, tilt: 12, closed: [true, true], mouth: 'sob', extra: ['tear0'] }), KEY(2.4, { glance: 1, mouth: 'smirk' }), KEY(3, {})] },
  // Cool: arms folded, a slow nod, a half-lidded smirk.
  sig_cool: { dur: 3, keys: [
    KEY(0, {}), KEY(0.3, { ...CROSSED, lid: 0.4, mouth: 'smirk' }), KEY(1, { ...CROSSED, lid: 0.4, mouth: 'smirk', tilt: 6, hy: 1.4 }),
    KEY(1.4, { ...CROSSED, lid: 0.4, mouth: 'smirk', tilt: -4, hy: 0.8 }), KEY(2.2, { ...CROSSED, lid: 0.45, mouth: 'smirk', glance: 1 }), KEY(3, {})] },
  // Sweet: blows you a kiss and a heart floats off.
  sig_sweet: { dur: 2.6, keys: [
    KEY(0, {}), KEY(0.2, { closed: [true, true], mouth: 'mochiheartlip' }), KEY(0.5, { ...MOUTH, closed: [true, true], mouth: 'mochiheartlip', tilt: 6, blush: 1.8 }),
    KEY(0.9, { front: [11, -10], over: true, closed: [false, true], mouth: 'mochiw', tilt: -4, extra: ['hearts'], sprout: 'happy' }), KEY(2.6, {})] },
  // Chatty: talks away, hands going, mouth never still.
  sig_chatty: { dur: 3.2, keys: [
    KEY(0, {}), KEY(0.2, { mouth: 'ah', front: [6, -8], glance: 1 }), KEY(0.45, { mouth: 'o', front: [9, -11], tilt: -4 }), KEY(0.7, { mouth: 'e', front: [3, -7], back: [-7, -8], tilt: 4 }),
    KEY(0.95, { mouth: 'ah', front: [10, -10], back: [-1, -2], extra: ['dots2'] }), KEY(1.2, { mouth: 'o', front: [5, -8], tilt: -4 }), KEY(1.45, { mouth: 'D', closed: [true, true], front: [8, -11], back: [-8, -9], tilt: 6 }),
    KEY(1.8, { mouth: 'e', front: [9, -9], glance: 1 }), KEY(2.2, { mouth: 'ah', front: [5, -8] }), KEY(3.2, {})] },
  // Sneaky: tiptoes on the spot, glancing both ways, a finger to its lips.
  sig_sneaky: { dur: 3, keys: [
    KEY(0, {}), KEY(0.25, { ...MOUTH, mouth: 'mochidot', glance: -1, squat: 1 }), KEY(0.6, { ...MOUTH, legF: [1.6, -1.6, 30], lift: 0.8, glance: -1, squat: 1 }),
    KEY(0.95, { ...MOUTH, legF: [0.8, 0, 0], legB: [-1.6, -1.6, -30], lift: 0.8, glance: 1, squat: 1 }), KEY(1.3, { ...MOUTH, legF: [1.6, -1.6, 30], lift: 0.8, glance: 1, squat: 1 }),
    KEY(1.8, { ...MOUTH, lid: 0.35, mouth: 'slysmile', glance: -1 }), KEY(3, {})] },
};
export const SIGNATURE = Object.fromEntries(Object.keys(IDLE_BITS).filter((k) => k.startsWith('sig_')).map((k) => [k.slice(4), k]));
const SHARED = Object.keys(IDLE_BITS).filter((k) => !k.startsWith('sig_') && k !== 'hungry');
// (What a pose's numbers ease between; everything else changes on its key.)
const EASED = ['tilt', 'hx', 'hy', 'lean', 'tip', 'sink', 'lift', 'bob', 'squat', 'hair', 'front', 'back', 'legF', 'legB', 'ball', 'spin', 'flame'];
const EASE = { in: (k) => k * k, out: (k) => 1 - (1 - k) * (1 - k) };
// Idle moments and actions step through their keys at this many drawings a second (each drawn
// once, then reused): enough to read smooth.
export const MOMENT_FPS = 24;
const smooth01 = (k) => k * k * (3 - 2 * k);
// The pose `t` seconds into idle moment (or action) `bit`, over the still stance `base`.
function idlePose(bit, t, base) {
  const keys = bit.keys;
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1][0] <= t) i++;
  const [t0, a] = keys[i];
  const [t1, b] = keys[Math.min(i + 1, keys.length - 1)];
  const k = t1 > t0 ? (EASE[b.ease] ?? smooth01)(Math.min(1, (t - t0) / (t1 - t0))) : 1;
  const at = (o, key) => o[key] ?? base[key] ?? (key === 'ball' ? [0, -3] : 0);
  // (A flip or a roll goes all the way round: `lean` keeps whatever turn it's reached.)
  const out = { ...base };
  for (const key of EASED) {
    const va = at(a, key);
    const vb = at(b, key);
    out[key] = Array.isArray(va) ? va.map((v, j) => lerp(v, vb[j], k)) : lerp(va, vb, k);
  }
  out.turned = Boolean(a.turned);
  // (A hand on its way to or from the face is drawn over the head the whole way.)
  out.armOver = Boolean(a.over || b.over) || null;
  out.bubble = Boolean(a.bubble);
  // A prop in hand, and the bites out of a sweet, stay as the last key that set them.
  for (let j = 0; j <= i; j++) for (const key of ['hold', 'bites']) if (keys[j][1][key] !== undefined) out[key] = keys[j][1][key];
  // The face changes on its key, a beat (0.12 s) before the body gets there (the face reacts
  // first). Floating hearts and dizzy stars go round on their own little cycle.
  let fi = 0;
  while (fi < keys.length - 1 && keys[fi + 1][0] <= t + 0.12) fi++;
  const f = keys[fi][1];
  for (const key of ['eyes', 'mouth', 'glance', 'wide', 'shine', 'teary', 'spiral', 'cross', 'lid', 'closed', 'look', 'sprout', 'puff']) out[key] = f[key] ?? (key === 'eyes' ? base.eyes ?? null : null);
  for (const key of ['brows', 'blush']) out[key] = f[key] ?? base[key];
  out.extra = (f.extra ?? []).map((e) => (e === 'hearts' ? `hearts${Math.floor(t * 4) % 4}` : e === 'orbit' ? `orbit${Math.floor(t * 8) % 8}` : e));
  return out;
}
// The idle moment a standing Mochi is in (or null), picked from its seed: its signature often,
// otherwise a shared one, three times as likely if it suits the personality.
function idleAt(st, g, time, only) {
  if (st.idle) {
    if (time - st.idle.t0 < IDLE_BITS[st.idle.name].dur) return st.idle;
    st.idle = null;
    st.nextIdle = time + 2.4 + hash(g.seed + (st.idles ?? 0) * 5) * 3.6;
  }
  st.nextIdle ??= time + 1.5 + hash(g.seed + 21) * 2.5;
  if (time < st.nextIdle) return null;
  st.idles = (st.idles ?? 0) + 1;
  const roll = hash(g.seed * 17 + st.idles * 29 + 3);
  let name;
  if (only?.length) name = only[(st.idles - 1) % only.length];
  else if (g.hungry && roll < 0.6) name = 'hungry';
  else if (roll < 0.38 && SIGNATURE[g.personality] && st.lastIdle !== SIGNATURE[g.personality]) name = SIGNATURE[g.personality];
  else {
    const known = (n) => !g.tricks || BASIC_IDLES.includes(n) || g.tricks.includes(n);
    const pool = SHARED.filter((n) => n !== st.lastIdle && known(n));
    const glum = typeof g.mood === 'number' && g.mood < 30;
    const glad = typeof g.mood === 'number' && g.mood > 80;
    const weight = (n) => (IDLE_BITS[n].likes?.includes(g.personality) ? 3 : 1) * (glum ? (n === 'sigh' ? 5 : ['hops', 'clap', 'shuffle', 'twirl'].includes(n) ? 0.2 : 1) : glad ? (['hops', 'clap', 'hum', 'twirl', 'shuffle'].includes(n) ? 2.5 : n === 'sigh' ? 0.1 : 1) : 1);
    let r = hash(g.seed * 7 + st.idles * 11 + 9) * pool.reduce((s0, n) => s0 + weight(n), 0);
    name = pool[0];
    for (const n of pool) {
      r -= weight(n);
      if (r < 0) {
        name = n;
        break;
      }
    }
  }
  st.lastIdle = name;
  st.idle = { name, t0: time };
  return st.idle;
}

// ---------- Actions ----------
// What it does when the garden asks (`m.action = { name, t0, hold, sweet }`): keyframed like the
// idle moments, with a `loop` (from, to) that goes round for as long as it's kept at it (`hold`
// seconds) before it finishes; then `m.action` is cleared. A key can hold a prop in the near hand
// (`hold`: 'sweet' or 'ball', kept until a key changes it), how many `bites` the sweet has had,
// where the ball is from the hand (`ball`, eased like the body, `spin` turning it) and how a key
// is eased into (`ease`: 'in' speeds up into it, a fall; 'out' slows into it, a toss).
const PAT = { front: [-3, -6], back: [5, -6] };
const BITE = { front: [-5, -4], over: true }; // the sweet up at its mouth
const CHEW = { front: [-2, 3], over: true }; // ...down by its tummy, chewing
const SIT = { squat: 3, bob: 3, legF: [3.4, -1.6, 40], legB: [2.2, -1.2, 30], front: [1, 1.5], back: [1.6, 1.5] };
// Lying asleep on its side (turned over as one about its middle, `tip` 6; `sink` lays it down).
const LIE = { lean: 1.45, tip: 6, sink: 15, squat: 0, bob: 0, legF: [2, -1.4, 40], legB: [1.4, -1, 30], front: [-2, -4], back: [4, -3], closed: [true, true] };
const chomp = (t, n) => [
  KEY(t, { ...BITE, mouth: 'mochiopen', closed: [true, true] }),
  KEY(t + 0.25, { ...CHEW, bites: n, mouth: 'mochiw', closed: [true, true], blush: 1.7, extra: n === 2 ? ['hearts'] : [] }),
  KEY(t + 0.5, { ...CHEW, mouth: 'cat', closed: [true, true], blush: 1.7, hy: 1.4 }),
  KEY(t + 0.75, { ...CHEW, mouth: 'mochiw', closed: [true, true], blush: 1.7, hy: 1 }),
];
export const ACTIONS = {
  // A favourite: eyes light up, it holds it up to admire it, three happy bites (chewing, little
  // hearts), the last one gone, then pats its tummy.
  eat: { dur: 5.8, keys: [
    KEY(0, {}), KEY(0.2, { hold: 'sweet', bites: 0, front: [4, -7], shine: true, mouth: 'mochio', sprout: 'excited', extra: ['spark0'] }),
    KEY(0.8, { front: [5, -8], shine: true, mouth: 'D', lift: 1.2, extra: ['hearts'], sprout: 'excited' }),
    ...chomp(1.2, 1), ...chomp(2.2, 2), ...chomp(3.2, 3),
    KEY(4.2, { ...BITE, mouth: 'mochiopen', closed: [true, true] }), KEY(4.45, { ...CHEW, bites: 4, mouth: 'mochicrumb', closed: [true, true], blush: 1.8 }),
    KEY(4.7, { front: [-3, -1], back: [4, -1], closed: [true, true], mouth: 'D', lift: 1.6, extra: ['hearts'], sprout: 'happy' }),
    KEY(5, { front: [-2, -2], back: [3, -2], closed: [true, true], mouth: 'mochiw', lift: 0 }), KEY(5.25, { front: [-3, -1], back: [4, -1], closed: [true, true], mouth: 'mochiw' }),
    KEY(5.8, {})] },
  // One it hates: a bite, a frozen moment, a shudder, then it holds it out at arm's length, tongue
  // out, and puts it down.
  hated: { dur: 4.6, keys: [
    KEY(0, {}), KEY(0.2, { hold: 'sweet', bites: 0, front: [4, -7], mouth: 'mochio' }),
    KEY(0.7, { ...BITE, mouth: 'mochiopen' }), KEY(0.95, { ...CHEW, bites: 1, mouth: 'mochiflat' }),
    KEY(1.3, { ...CHEW, wide: true, mouth: 'mochiflat', extra: ['drop'] }),
    KEY(1.7, { ...CHEW, eyes: 'hurt', mouth: 'wavy', tilt: 10, hx: -0.4, extra: ['gloom'], sprout: 'sad' }), KEY(1.85, { ...CHEW, eyes: 'hurt', mouth: 'wavy', tilt: -8, hx: 0.4 }),
    KEY(2, { ...CHEW, eyes: 'hurt', mouth: 'wavy', tilt: 10, hx: -0.4 }), KEY(2.15, { ...CHEW, eyes: 'hurt', mouth: 'wavy', tilt: -8, hx: 0.4 }),
    KEY(2.5, { front: [12, -8], glance: -1, tilt: -12, lean: -0.08, mouth: 'bleh', brows: [[0.5, -0.7], [0.5, -0.7]], extra: ['sweat1'], sprout: 'sad' }),
    KEY(3.5, { front: [12, -8], glance: -1, tilt: -12, lean: -0.08, mouth: 'bleh', brows: [[0.5, -0.7], [0.5, -0.7]] }),
    KEY(3.9, { hold: null, front: [5, -2], mouth: 'mochiwave', extra: ['sweat0'] }), KEY(4.6, {})] },
  // Nap: a yawn, it flops down to sit, nods off and topples over onto its side, breathing slow
  // with a bubble at its nose; at the end it wakes, sits up rubbing an eye, and stretches.
  nap: { dur: 8.6, loop: [3.6, 5.6], keys: [
    KEY(0, {}), KEY(0.3, { ...MOUTH, eyes: 'half', mouth: 'yawn', tilt: -6 }), KEY(1.1, { eyes: 'half', mouth: 'mochiw' }),
    KEY(1.5, { ...SIT, eyes: 'half', mouth: 'mochiw', sprout: 'sleepy' }),
    KEY(2.3, { ...SIT, tip: 6, sink: 6, hy: 2.2, tilt: 14, closed: [true, true], extra: ['zzz0'], sprout: 'sleepy' }),
    KEY(3.1, { ...LIE, ease: 'in', mouth: 'o', sprout: 'sleepy' }),
    KEY(3.6, { ...LIE, mouth: 'o', sprout: 'sleepy', bubble: true }), KEY(4.6, { ...LIE, sink: 15.4, mouth: 'mochiw', sprout: 'sleepy', bubble: true }),
    KEY(5.6, { ...LIE, mouth: 'o', sprout: 'sleepy', bubble: true }),
    KEY(6.2, { ...LIE, closed: null, eyes: 'half', mouth: 'mochio', sprout: 'sleepy' }),
    KEY(6.8, { ...SIT, tip: 6, sink: 6, front: [-2, -16], over: true, eyes: 'half', mouth: 'mochiwave' }),
    KEY(7.4, { ...OUT(-13), tip: 0, sink: 0, closed: [true, true], mouth: 'yawn', tilt: -8, lift: 1.4 }),
    KEY(8, { closed: [true, true], mouth: 'D', sprout: 'happy', extra: ['spark0'] }), KEY(8.6, {})] },
  // Play: tosses its ball up and catches it, then a bigger toss that comes down bonk on its head,
  // sees stars, giggles, and lets it roll away.
  play: { dur: 6.4, keys: [
    KEY(0, {}), KEY(0.25, { hold: 'ball', ball: [0, -3], front: [4, -3], mouth: 'mochio', shine: true }),
    KEY(0.5, { ball: [0, -3], front: [4, -1], squat: 1, mouth: 'mochiw' }),
    KEY(0.75, { ball: [1, -6], front: [6, -9], mouth: 'D', look: 'up', spin: 2 }),
    KEY(1.25, { ball: [2, -30], front: [4, -3], look: 'up', mouth: 'mochio', spin: 6, ease: 'out' }),
    KEY(1.75, { ball: [0, -3], front: [4, -3], look: 'up', mouth: 'mochio', spin: 10, ease: 'in' }),
    KEY(1.95, { ball: [0, -3], front: [4, -2], squat: 1, closed: [true, true], mouth: 'D', spin: 10, extra: ['spark0'] }),
    KEY(2.3, { ball: [0, -3], front: [4, -1], squat: 1, mouth: 'grin', spin: 10 }),
    KEY(2.55, { ball: [1, -7], front: [7, -10], mouth: 'D', look: 'up', spin: 12 }),
    KEY(3.15, { ball: [1, -36], front: [2, -9], look: 'up', wide: true, mouth: 'mochio', spin: 17, ease: 'out' }),
    KEY(3.6, { ball: [-5, -23], front: [2, -9], eyes: 'hurt', mouth: 'gasp', squat: 1, hy: 1.6, spin: 20, ease: 'in', extra: ['bang1'] }),
    KEY(3.85, { ball: [7, -20], front: [2, -9], spiral: 1, mouth: 'wavy', squat: 1, hy: 1.4, spin: 23, ease: 'out', extra: ['orbit'] }),
    KEY(4.3, { ball: [0, -3], front: [4, -3], spiral: 2, mouth: 'wavy', tilt: 8, spin: 27, ease: 'in', extra: ['orbit'] }),
    KEY(4.6, { ball: [0, -3], front: [-3, -5], closed: [true, true], mouth: 'D', tilt: -8, spin: 27, extra: ['tear0', 'spark1'] }),
    KEY(5, { ball: [0, -3], front: [-3, -5], closed: [true, true], mouth: 'grin', tilt: 8, spin: 27, extra: ['tear0'] }),
    KEY(5.4, { ball: [3, -3], front: [5, -4], mouth: 'mochiw', spin: 27 }),
    KEY(6.4, { ball: [26, 4], front: [2, -2], mouth: 'mochiw', glance: 1, spin: 40, ease: 'out' })] },
  // Cheer: hops for joy, arms flung out, then a fist pump, round and round.
  cheer: { dur: 1.7, loop: [0.15, 1.15], keys: [
    KEY(0, {}), KEY(0.15, { squat: 1, front: [5, -5], back: [-5, -5], closed: [true, true], mouth: 'D', sprout: 'excited' }),
    KEY(0.45, { ...OUT(-13), lift: 4.5, closed: [true, true], mouth: 'D', sprout: 'excited', extra: ['spark0'], ease: 'out' }),
    KEY(0.65, { squat: 1, front: [5, -5], back: [-5, -5], closed: [true, true], mouth: 'D', sprout: 'excited', ease: 'in' }),
    KEY(0.95, { front: [7, -19], over: true, back: [-10, -12], lift: 4.5, closed: [true, true], mouth: 'yell', sprout: 'excited', extra: ['spark1', 'bang1'], ease: 'out' }),
    KEY(1.15, { squat: 1, front: [5, -5], back: [-5, -5], closed: [true, true], mouth: 'D', sprout: 'excited', ease: 'in' }),
    KEY(1.7, { closed: [true, true], mouth: 'mochiw' })] },
  // Sulk: puffs its cheeks, turns its head away, plops down hugging its knees under a little
  // gloom, looking off to the side; now and then it peeks at you, then turns its head away again,
  // hmph. At the end it gets up, a bit embarrassed.
  sulk: { dur: 5, loop: [1.6, 3.6], keys: [
    KEY(0, {}), KEY(0.2, { ...CROSSED, puff: true, brows: [[-0.4, 0.8], [-0.4, 0.8]], mouth: 'mochipout', extra: ['vein'] }),
    KEY(0.6, { ...CROSSED, turned: true, puff: true, tilt: -8, closed: [true, true], mouth: 'mochipout', extra: ['steam0'] }),
    KEY(1.1, { glance: 1, ...SIT, legF: [2.4, -3, 60], legB: [1.8, -2.6, 50], front: [3, -2], back: [4, -2], tilt: 10, hy: 1.8, eyes: 'half', puff: true, mouth: 'mochipout', extra: ['gloom'], sprout: 'sad' }),
    KEY(1.6, { glance: 1, ...SIT, legF: [2.4, -3, 60], legB: [1.8, -2.6, 50], front: [3, -2], back: [4, -2], tilt: 10, hy: 1.8, eyes: 'half', puff: true, mouth: 'mochipout', extra: ['gloom'], sprout: 'sad' }),
    KEY(2.6, { ...SIT, legF: [2.4, -3, 60], legB: [1.8, -2.6, 50], front: [3, -2], back: [4, -2], tilt: 4, hy: 1.6, glance: 0, mouth: 'mochiflat', sprout: 'sad' }),
    KEY(3.1, { turned: true, ...SIT, legF: [2.4, -3, 60], legB: [1.8, -2.6, 50], front: [3, -2], back: [4, -2], tilt: -8, hy: 1.4, closed: [true, true], puff: true, mouth: 'mochipout', extra: ['gloom', 'steam0'], sprout: 'sad' }),
    KEY(3.6, { glance: 1, ...SIT, legF: [2.4, -3, 60], legB: [1.8, -2.6, 50], front: [3, -2], back: [4, -2], tilt: 10, hy: 1.8, eyes: 'half', puff: true, mouth: 'mochipout', extra: ['gloom'], sprout: 'sad' }),
    KEY(4.1, { glance: 1, eyes: 'half', mouth: 'mochiflat' }), KEY(4.5, { glance: 0, mouth: 'mochiwave', blush: 1.9, ...PAT }), KEY(5, {})] },
  // Petted: eyes shut, it leans up into each pat with a happy wriggle, hearts floating up.
  pet: { dur: 2.4, loop: [0.3, 1.5], keys: [
    KEY(0, {}), KEY(0.2, { closed: [true, true], mouth: 'mochiw', blush: 1.7, tilt: 6, sprout: 'happy' }),
    KEY(0.3, { ...PAT, hy: 2, squat: 1, tilt: 8, closed: [true, true], mouth: 'mochiw', blush: 1.8, extra: ['hearts'], sprout: 'happy' }),
    KEY(0.6, { ...PAT, hy: 0.6, tilt: 4, closed: [true, true], mouth: 'cat', blush: 1.8, extra: ['hearts'], sprout: 'happy' }),
    KEY(0.9, { ...PAT, hy: 2, squat: 1, tilt: -6, closed: [true, true], mouth: 'mochiw', blush: 1.8, extra: ['hearts'], sprout: 'happy' }),
    KEY(1.2, { ...PAT, hy: 0.6, tilt: -2, closed: [true, true], mouth: 'D', blush: 1.8, extra: ['hearts'], sprout: 'happy' }),
    KEY(1.5, { ...PAT, hy: 2, squat: 1, tilt: 8, closed: [true, true], mouth: 'mochiw', blush: 1.8, extra: ['hearts'], sprout: 'happy' }),
    KEY(1.9, { shine: true, mouth: 'D', lift: 1.6, extra: ['hearts'], sprout: 'excited' }), KEY(2.4, {})] },
  // Tickled: a gasp, then it squirms and giggles helplessly, kicking, tears of laughter.
  tickle: { dur: 2, loop: [0.3, 1.1], keys: [
    KEY(0, {}), KEY(0.15, { wide: true, mouth: 'gasp', blush: 1.6 }),
    KEY(0.3, { ...PAT, tilt: 12, hx: -0.8, lean: -0.06, lift: 1, legF: [1.6, -1.6, 20], closed: [true, true], mouth: 'D', blush: 1.8, extra: ['tear0', 'spark0'], sprout: 'excited' }),
    KEY(0.5, { front: [9, -9], back: [-3, -3], tilt: -12, hx: 0.8, lean: 0.06, legB: [-1.6, -1.6, -20], closed: [true, true], mouth: 'grin', blush: 1.8, extra: ['tear0', 'spark1'], sprout: 'excited' }),
    KEY(0.7, { ...PAT, tilt: 10, hx: -0.6, lean: -0.05, lift: 1.2, legF: [1.6, -1.6, 20], closed: [true, true], mouth: 'D', blush: 1.8, extra: ['tear0', 'note'], sprout: 'excited' }),
    KEY(0.9, { front: [3, -3], back: [-9, -9], tilt: -10, hx: 0.6, lean: 0.06, legB: [-1.6, -1.6, -20], closed: [true, true], mouth: 'grin', blush: 1.8, extra: ['tear0', 'spark0'], sprout: 'excited' }),
    KEY(1.1, { ...PAT, tilt: 12, hx: -0.8, lean: -0.06, lift: 1, legF: [1.6, -1.6, 20], closed: [true, true], mouth: 'D', blush: 1.8, extra: ['tear0', 'spark0'], sprout: 'excited' }),
    KEY(1.5, { eyes: 'half', mouth: 'mochiwave', blush: 1.9, extra: ['sweat0'] }), KEY(2, {})] },
  // Farewell, at the end of a long happy life (render/mochi-life.js drawRebirth): it waves you
  // goodbye, then hugs its hands to its chest, content, hearts rising.
  farewell: { dur: 2, keys: [
    KEY(0, {}), KEY(0.2, { closed: [true, true], mouth: 'mochibeam', front: [6, -9], over: true, blush: 1.7 }),
    KEY(0.45, { front: [10, -15], over: true, tilt: -4, closed: [true, true], mouth: 'D', extra: ['hearts'], sprout: 'happy' }), KEY(0.75, { front: [6, -17], over: true, tilt: -2, closed: [true, true], mouth: 'D', extra: ['hearts'] }),
    KEY(1.05, { front: [10, -15], over: true, tilt: -4, closed: [true, true], mouth: 'D', extra: ['hearts'] }),
    KEY(1.4, { ...PAT, closed: [true, true], mouth: 'mochibeam', blush: 1.8, tilt: 6, extra: ['hearts'], sprout: 'happy' }),
    KEY(2, { ...PAT, closed: [true, true], mouth: 'mochibeam', blush: 1.8, tilt: 6, sprout: 'happy' })] },
  // Levelled up: a happy little hop, arms out, sparkles.
  levelup: { dur: 1.3, keys: [
    KEY(0, {}), KEY(0.12, { squat: 1, front: [5, -5], back: [-5, -5], closed: [true, true], mouth: 'D', sprout: 'excited' }),
    KEY(0.38, { ...OUT(-12), lift: 4, closed: [true, true], mouth: 'D', sprout: 'excited', extra: ['spark0', 'spark1'], ease: 'out' }),
    KEY(0.66, { squat: 1, front: [5, -5], back: [-5, -5], closed: [true, true], mouth: 'D', ease: 'in' }),
    KEY(0.9, { shine: true, mouth: 'mochiw', extra: ['spark0'], sprout: 'happy' }), KEY(1.3, {})] },
  // A new way of moving: it realises (!), leaps up, lands and strikes a pose, a wink and a V.
  newstyle: { dur: 2.3, keys: [
    KEY(0, {}), KEY(0.15, { wide: true, mouth: 'mochio', sprout: 'excited', extra: ['bang1'] }),
    KEY(0.45, { ...OUT(-13), lift: 6, closed: [true, true], mouth: 'D', sprout: 'excited', extra: ['spark0', 'spark1'], ease: 'out' }),
    KEY(0.85, { squat: 1, front: [5, -5], back: [-5, -5], closed: [true, true], mouth: 'D', ease: 'in' }),
    KEY(1.1, { front: [2, -15], over: true, back: [-1.6, -1.4], legF: [2, 0, 10], tilt: -8, closed: [false, true], mouth: 'D', sprout: 'excited', extra: ['spark0', 'spark1'] }),
    KEY(1.9, { front: [2, -15], over: true, back: [-1.6, -1.4], legF: [2, 0, 10], tilt: -8, closed: [false, true], mouth: 'tongue', extra: ['spark1'] }), KEY(2.3, {})] },
  // Full up: hands on its round tummy, it shakes its head, no thank you, and pats it.
  full: { dur: 1.9, keys: [
    KEY(0, {}), KEY(0.15, { front: [-3, -1], back: [4, -1], puff: true, mouth: 'mochiflat', blush: 1.6 }),
    KEY(0.4, { front: [-3, -1], back: [4, -1], tilt: 10, closed: [true, true], mouth: 'mochiwave' }), KEY(0.55, { front: [-3, -1], back: [4, -1], tilt: -10, closed: [true, true], mouth: 'mochiwave' }),
    KEY(0.7, { front: [-3, -1], back: [4, -1], tilt: 10, closed: [true, true], mouth: 'mochiwave' }), KEY(0.85, { front: [-3, -1], back: [4, -1], tilt: -8, closed: [true, true], mouth: 'mochiwave' }),
    KEY(1.1, { front: [-2, -2], back: [3, -2], mouth: 'mochiw', blush: 1.7, extra: ['sweat0'] }), KEY(1.35, { front: [-3, -1], back: [4, -1], mouth: 'mochiw', blush: 1.7 }),
    KEY(1.9, {})] },
  // Born (render/mochi-life.js): springs up out of the burst egg, lands, blinks round at the world,
  // spots you, and hops for joy.
  born: { dur: 4.2, keys: [
    KEY(0, { lift: 20, ...OUT(-12), closed: [true, true], mouth: 'D', sprout: 'excited', extra: ['spark0'] }),
    KEY(0.35, { lift: 30, ...OUT(-13), closed: [true, true], mouth: 'D', sprout: 'excited', extra: ['spark1'], ease: 'out' }),
    KEY(0.8, { lift: 0, squat: 1, front: [5, -5], back: [-5, -5], wide: true, mouth: 'mochio', ease: 'in' }),
    KEY(1.1, { wide: true, glance: -1, mouth: 'mochio', extra: ['q'] }), KEY(1.6, { wide: true, glance: 1, mouth: 'mochio', tilt: -6 }),
    KEY(2.1, { closed: ['blink', 'blink'], mouth: 'mochiw' }), KEY(2.3, { shine: true, mouth: 'mochiopen', sprout: 'curious' }),
    KEY(2.7, { ...OUT(-10), lift: 2.4, closed: [true, true], mouth: 'D', extra: ['hearts'], sprout: 'happy', ease: 'out' }),
    KEY(3, { lift: 0, squat: 1, closed: [true, true], mouth: 'D', extra: ['hearts'], ease: 'in' }),
    KEY(3.3, { ...OUT(-10), lift: 2, closed: [true, true], mouth: 'D', extra: ['hearts'], ease: 'out' }), KEY(3.55, { lift: 0, ease: 'in' }), KEY(4.2, {})] },
  // Evolving: its sprout starts to glow; it looks up, then puts its hands together and shuts its
  // eyes as the leaf comes down over it.
  evolving: { dur: 3, keys: [
    KEY(0, {}), KEY(0.2, { look: 'up', wide: true, mouth: 'mochio', sprout: 'excited', extra: ['spark0'] }),
    KEY(0.6, { look: 'up', shine: true, mouth: 'mochiopen', ...OUT(-9), lift: 1.4, sprout: 'excited', extra: ['spark1'] }),
    KEY(1, { look: 'up', closed: [true, true], mouth: 'mochiw', ...PAT, sprout: 'excited' }), KEY(3, { closed: [true, true], mouth: 'mochiw', ...PAT, sprout: 'excited' })] },
  // Evolved: bursts out of the leaf grown, lands, ta-da, looks itself over, and hops for joy.
  evolved: { dur: 3.3, keys: [
    KEY(0, { lift: 10, ...OUT(-13), closed: [true, true], mouth: 'D', sprout: 'excited', extra: ['spark0', 'spark1'] }),
    KEY(0.45, { lift: 0, squat: 1, front: [5, -5], back: [-5, -5], closed: [true, true], mouth: 'D', ease: 'in' }),
    KEY(0.8, { ...OUT(-12), lift: 1, tilt: -6, closed: [true, true], mouth: 'D', extra: ['spark0'], sprout: 'excited' }),
    KEY(1.5, { look: 'down', wide: true, mouth: 'mochio', front: [3, -3], back: [-1, -2] }), KEY(2, { glance: 1, shine: true, mouth: 'mochiopen', tilt: 6 }),
    KEY(2.4, { ...OUT(-11), lift: 3, closed: [true, true], mouth: 'D', extra: ['hearts'], sprout: 'happy', ease: 'out' }),
    KEY(2.75, { lift: 0, squat: 1, ease: 'in' }), KEY(3.3, {})] },
};
// ---------- Tricks ----------
// Little things a Mochi learns, each taught by a sweet the first time it eats it
// (data/mochi-raise.js TRICK_OF), and from then on part of its idle moments. A few it knows from
// the start (BASIC_IDLES); a Mochi being raised (`g.tricks`) only does those and what it's learned.
export const BASIC_IDLES = ['stretch', 'lookaround', 'scratch', 'yawn', 'sigh', 'tidy'];
const TWO = Math.PI * 2;
const TUCK = { legF: [2.2, -3, 60], legB: [1.6, -2.6, 50], front: [3, -5], back: [2, -5] };
export const TRICK_BITS = {
  // A forward roll: tucks up and rolls right over, and comes up with its arms out.
  roll: { dur: 2.4, keys: [
    KEY(0, {}), KEY(0.25, { squat: 2, tip: 6, sink: 6, closed: [true, true], mouth: 'mochio', sprout: 'excited' }),
    KEY(0.5, { ...TUCK, lean: Math.PI / 2, tip: 6, sink: 9, closed: [true, true], mouth: 'mochiw' }),
    KEY(0.75, { ...TUCK, lean: Math.PI, tip: 6, sink: 8, closed: [true, true], mouth: 'mochiw' }),
    KEY(1, { ...TUCK, lean: Math.PI * 1.5, tip: 6, sink: 9, closed: [true, true], mouth: 'D' }),
    KEY(1.25, { lean: TWO, tip: 6, sink: 6, squat: 2, closed: [true, true], mouth: 'D', ease: 'out' }),
    KEY(1.6, { lean: TWO, ...OUT(-12), closed: [true, true], mouth: 'D', extra: ['spark0', 'spark1'], sprout: 'excited' }), KEY(2.4, { lean: TWO })] },
  // Sit-ups: lies back, sits up, lies back, sits up, puffing.
  situps: { dur: 4, keys: [
    KEY(0, {}), KEY(0.3, { ...SAT, mouth: 'mochiflat', brows: [[-0.4, 0.8], [-0.4, 0.8]] }),
    KEY(0.8, { ...SAT, lean: -1.3, tip: 6, sink: 13, front: [-3, -12], back: [-1, -12], closed: [true, true], mouth: 'mochiflat' }),
    KEY(1.4, { ...SAT, lean: -0.2, tip: 6, sink: 6, front: [-3, -12], back: [-1, -12], mouth: 'grit', extra: ['sweat0'] }),
    KEY(2, { ...SAT, lean: -1.3, tip: 6, sink: 13, front: [-3, -12], back: [-1, -12], closed: [true, true], mouth: 'mochiflat' }),
    KEY(2.6, { ...SAT, lean: -0.2, tip: 6, sink: 6, front: [-3, -12], back: [-1, -12], mouth: 'grit', extra: ['sweat1'] }),
    KEY(3.2, { ...SAT, tip: 0, sink: 0, closed: [true, true], mouth: 'D', extra: ['spark0'] }), KEY(4, {})] },
  // Paddling on dry land: flat on its tummy, kicking and paddling as if it were swimming.
  paddle: { dur: 3.4, keys: [
    KEY(0, {}), KEY(0.4, { ...LIE, closed: null, mouth: 'D', front: [-1, -6], back: [5, -4], legF: [1, -1, 20], legB: [2, -2, 40], sprout: 'happy' }),
    KEY(0.8, { ...LIE, closed: null, mouth: 'D', front: [4, -6], back: [0, -4], legF: [2, -2, 40], legB: [1, -1, 20] }),
    KEY(1.2, { ...LIE, closed: null, mouth: 'mochiw', front: [-1, -6], back: [5, -4], legF: [1, -1, 20], legB: [2, -2, 40] }),
    KEY(1.6, { ...LIE, closed: null, mouth: 'D', front: [4, -6], back: [0, -4], legF: [2, -2, 40], legB: [1, -1, 20], extra: ['note'] }),
    KEY(2, { ...LIE, closed: null, mouth: 'mochiw', front: [-1, -6], back: [5, -4], legF: [1, -1, 20], legB: [2, -2, 40] }),
    KEY(2.6, { tip: 6, sink: 6, squat: 1, closed: [true, true], mouth: 'D' }), KEY(3.4, {})] },
  // Beats its chest, chin up, and lets out a little roar.
  chestbeat: { dur: 2.4, keys: [
    KEY(0, {}), KEY(0.2, { tilt: -8, brows: [[-0.4, 0.8], [-0.4, 0.8]], mouth: 'grit' }),
    KEY(0.4, { front: [-3, -6], back: [3, -4], tilt: -10, mouth: 'yell', extra: ['bang1'] }), KEY(0.6, { front: [-1, -4], back: [5, -6], tilt: -10, mouth: 'yell' }),
    KEY(0.8, { front: [-3, -6], back: [3, -4], tilt: -10, mouth: 'yell' }), KEY(1, { front: [-1, -4], back: [5, -6], tilt: -10, mouth: 'yell', extra: ['bang1'] }),
    KEY(1.4, { ...OUT(-12), lift: 1.4, tilt: -12, closed: [true, true], mouth: 'D', extra: ['spark0'] }), KEY(2.4, {})] },
  // Shadow-boxing: hops on its toes, jab, jab, a big one.
  boxing: { dur: 2.6, keys: [
    KEY(0, {}), KEY(0.2, { front: [4, -8], back: [2, -8], brows: [[-0.4, 0.8], [-0.4, 0.8]], mouth: 'grit', squat: 1 }),
    KEY(0.4, { front: [12, -8], over: true, back: [2, -8], lift: 1, mouth: 'grit', lean: 0.08 }), KEY(0.55, { front: [4, -8], back: [2, -8], lift: 0, squat: 1 }),
    KEY(0.75, { front: [12, -9], over: true, back: [2, -8], lift: 1, mouth: 'grit', lean: 0.08 }), KEY(0.9, { front: [4, -8], back: [2, -8], lift: 0, squat: 1 }),
    KEY(1.2, { front: [13, -10], over: true, back: [-4, -4], lift: 2, lean: 0.12, mouth: 'yell', extra: ['bang1', 'spark0'] }),
    KEY(1.6, { front: [4, -8], back: [2, -8], closed: [true, true], mouth: 'smirk' }), KEY(2.6, {})] },
  // Flapping practice: arms out, flap flap flap, little hops, then a proud grin.
  flaps: { dur: 2.6, keys: [
    KEY(0, {}), KEY(0.2, { ...OUT(-6), squat: 1, mouth: 'mochiflat', brows: [[-0.4, 0.8], [-0.4, 0.8]] }),
    KEY(0.4, { ...OUT(-13), lift: 2.2, mouth: 'grit' }), KEY(0.6, { ...OUT(-4), lift: 1.4 }), KEY(0.8, { ...OUT(-13), lift: 2.6, mouth: 'grit', extra: ['sweat1'] }),
    KEY(1, { ...OUT(-4), lift: 1.6 }), KEY(1.2, { ...OUT(-13), lift: 2.4 }), KEY(1.5, { ...OUT(-6), lift: 0, squat: 1, mouth: 'mochio' }),
    KEY(1.9, { closed: [true, true], mouth: 'D', extra: ['spark0'] }), KEY(2.6, {})] },
  // Meditating: sits cross-legged, shuts its eyes, and floats up off the ground a little.
  meditate: { dur: 4.4, keys: [
    KEY(0, {}), KEY(0.4, { ...SAT, ...PAT, closed: [true, true], mouth: 'mochiflat' }),
    KEY(1.4, { ...SAT, ...PAT, lift: 4, closed: [true, true], mouth: 'mochiflat', extra: ['spark1'] }),
    KEY(2.4, { ...SAT, ...PAT, lift: 4.6, closed: [true, true], mouth: 'mochibeam', extra: ['spark0'] }),
    KEY(3.3, { ...SAT, ...PAT, lift: 0, closed: [true, true], mouth: 'mochibeam', ease: 'in' }), KEY(4.4, {})] },
  // Brain freeze (it's been at the kakigori): hands to its head, shivers, shakes it off.
  brr: { dur: 2.6, keys: [
    KEY(0, {}), KEY(0.15, { wide: true, mouth: 'gasp' }), KEY(0.35, { front: [-2, -18], over: true, eyes: 'hurt', mouth: 'wavy', tilt: 4, hx: 0.4, extra: ['sweat1'] }),
    KEY(0.5, { front: [-2, -18], over: true, eyes: 'hurt', mouth: 'wavy', tilt: -4, hx: -0.4 }), KEY(0.65, { front: [-2, -18], over: true, eyes: 'hurt', mouth: 'wavy', tilt: 4, hx: 0.4 }),
    KEY(0.8, { front: [-2, -18], over: true, eyes: 'hurt', mouth: 'wavy', tilt: -4, hx: -0.4 }), KEY(0.95, { front: [-2, -18], over: true, eyes: 'hurt', mouth: 'wavy', tilt: 4, hx: 0.4 }),
    KEY(1.3, { tilt: 10, closed: [true, true], mouth: 'mochiwave' }), KEY(1.5, { tilt: -10, closed: [true, true], mouth: 'mochiwave' }), KEY(1.8, { closed: [true, true], mouth: 'D' }), KEY(2.6, {})] },
  // Sumo: a wide stance, hands on its knees, stomp, stomp, a slap of the belly.
  sumo: { dur: 3, keys: [
    KEY(0, {}), KEY(0.3, { squat: 2, legF: [2.6, 0, 20], legB: [-2.6, 0, -20], front: [1.6, 2], back: [2.4, 2], brows: [[-0.4, 0.8], [-0.4, 0.8]], mouth: 'mochiflat' }),
    KEY(0.65, { squat: 1, legF: [3, -3.4, 40], legB: [-2.6, 0, -20], front: [1.6, 2], back: [2.4, 2], tilt: 8, mouth: 'grit' }),
    KEY(0.85, { squat: 2, bob: 0.8, legF: [2.6, 0, 20], legB: [-2.6, 0, -20], front: [1.6, 2], back: [2.4, 2], mouth: 'yell', extra: ['bang1'] }),
    KEY(1.25, { squat: 1, legF: [2.6, 0, 20], legB: [-3, -3.4, -40], front: [1.6, 2], back: [2.4, 2], tilt: -8, mouth: 'grit' }),
    KEY(1.45, { squat: 2, bob: 0.8, legF: [2.6, 0, 20], legB: [-2.6, 0, -20], front: [1.6, 2], back: [2.4, 2], mouth: 'yell', extra: ['bang1'] }),
    KEY(1.9, { squat: 2, front: [-3, -2], back: [4, -2], closed: [true, true], mouth: 'D', extra: ['spark0'] }), KEY(3, {})] },
  // A puff of fire (the spicy senbei): a deep breath, cheeks full, a little burst of flame, a
  // cough of smoke, a sheepish grin.
  fire: { dur: 3, keys: [
    KEY(0, {}), KEY(0.3, { tilt: -10, lean: -0.08, puff: true, mouth: 'mochiflat', wide: true }),
    KEY(0.8, { tilt: -12, lean: -0.1, puff: true, mouth: 'mochiflat', closed: [true, true] }),
    KEY(1, { tilt: 4, lean: 0.1, mouth: 'yell', closed: [true, true], flame: 1, extra: ['spark0'] }),
    KEY(1.7, { tilt: 4, lean: 0.08, mouth: 'yell', closed: [true, true], flame: 1 }),
    KEY(1.9, { mouth: 'o', eyes: 'half', extra: ['dots3'] }), KEY(2.3, { mouth: 'mochiwave', blush: 1.9, extra: ['sweat0'] }), KEY(3, {})] },
  // A backflip: crouch, spring up and over backward, land with a ta-da.
  backflip: { dur: 2.6, keys: [
    KEY(0, {}), KEY(0.25, { squat: 2, tip: 6, sink: 6, mouth: 'grit', brows: [[-0.4, 0.8], [-0.4, 0.8]] }),
    KEY(0.55, { ...TUCK, lean: -Math.PI * 0.75, tip: 15, sink: 6, closed: [true, true], mouth: 'D', ease: 'out' }),
    KEY(0.8, { ...TUCK, lean: -Math.PI * 1.4, tip: 14, sink: 6, closed: [true, true], mouth: 'D' }),
    KEY(1.05, { lean: -TWO, tip: 6, sink: 6, squat: 2, closed: [true, true], mouth: 'D', ease: 'in' }),
    KEY(1.35, { lean: -TWO, ...OUT(-12), lift: 1, closed: [true, true], mouth: 'D', extra: ['spark0', 'spark1'], sprout: 'excited' }), KEY(2.6, { lean: -TWO })] },
};
Object.assign(IDLE_BITS, TRICK_BITS);
SHARED.push(...Object.keys(TRICK_BITS));

// ---- Racing feelings (world/mochi-race.js and ui/mochi-race.js put them on) ----
// Its brows set hard (determined) or tipped up in the middle (worried).
const SET = [[-0.4, 0.8], [-0.4, 0.8]];
const WORRY = [[0.5, -0.7], [0.5, -0.7]];
const FISTS = { front: [5, -6], back: [-4, -5] };
const CROUCH = { squat: 3, lean: 0.22, tip: 1, hx: 1.2, tilt: -10, front: [7, -2], back: [-6, -1], brows: SET, mouth: 'grit', legF: [2, -0.6, 20], legB: [-2.4, 0, -20] };
Object.assign(ACTIONS, {
  // On the line before 3-2-1, nervous: shifting from foot to foot, glancing at the others, a bead of sweat.
  race_nerves: { dur: 1.4, loop: [0.1, 1.3], keys: [
    KEY(0, {}), KEY(0.1, { hx: -0.6, tilt: 6, glance: -1, brows: WORRY, mouth: 'mochiwave', front: [2, -4], back: [-1, -4] }),
    KEY(0.4, { hx: 0.6, tilt: -6, glance: 1, brows: WORRY, mouth: 'mochiwave', front: [2, -4], back: [-1, -4], extra: ['sweat0'], lift: 0.6 }),
    KEY(0.7, { hx: -0.6, tilt: 6, glance: -1, brows: WORRY, mouth: 'tiny', front: [2, -4], back: [-1, -4], extra: ['sweat0'] }),
    KEY(1, { hx: 0.6, tilt: -6, glance: 1, brows: WORRY, mouth: 'mochiwave', front: [2, -4], back: [-1, -4], lift: 0.6 }),
    KEY(1.3, { hx: -0.6, tilt: 6, glance: -1, brows: WORRY, mouth: 'mochiwave', front: [2, -4], back: [-1, -4] }), KEY(1.4, {})] },
  // ...or pumped: bouncing on its toes, punching the air, grinning.
  race_pumped: { dur: 1.2, loop: [0.1, 1.1], keys: [
    KEY(0, {}), KEY(0.1, { squat: 1, ...FISTS, brows: SET, mouth: 'grin' }),
    KEY(0.35, { lift: 2.4, front: [8, -15], back: [-4, -5], brows: SET, mouth: 'yell', extra: ['bang1'], ease: 'out' }),
    KEY(0.6, { squat: 1, ...FISTS, brows: SET, mouth: 'grin', ease: 'in' }),
    KEY(0.85, { lift: 2, ...FISTS, tilt: -6, brows: SET, mouth: 'grin', ease: 'out' }), KEY(1.1, { squat: 1, ...FISTS, brows: SET, mouth: 'grin', ease: 'in' }), KEY(1.2, {})] },
  // 2, 1: down in a crouch, leaning at the line, teeth set, rocking a little.
  race_crouch: { dur: 1.1, loop: [0.25, 1.05], keys: [
    KEY(0, {}), KEY(0.25, { ...CROUCH, ease: 'out' }), KEY(0.65, { ...CROUCH, bob: 0.6, hx: 1.4 }), KEY(1.05, { ...CROUCH }), KEY(1.1, {})] },
  // Its face in the race (the close-up on your screen): set and ready...
  race_ready: { dur: 1.6, loop: [0.2, 1.4], keys: [
    KEY(0, {}), KEY(0.2, { ...FISTS, brows: SET, mouth: 'grit', tilt: -4 }), KEY(0.8, { ...FISTS, brows: SET, mouth: 'grit', tilt: -6, bob: 0.6 }),
    KEY(1.4, { ...FISTS, brows: SET, mouth: 'grit', tilt: -4 }), KEY(1.6, {})] },
  // ...smug in the lead: a wink, a smirk, hands on its hips...
  race_smug: { dur: 2.4, loop: [0.2, 2.2], keys: [
    KEY(0, {}), KEY(0.2, { ...HIPS, tilt: -8, mouth: 'smirk' }), KEY(0.9, { ...HIPS, tilt: -10, closed: [false, true], mouth: 'smirk', extra: ['spark0'] }),
    KEY(1.5, { ...HIPS, tilt: -8, mouth: 'smirk' }), KEY(2.2, { ...HIPS, tilt: -8, mouth: 'smirk' }), KEY(2.4, {})] },
  // ...worried, falling behind: looking back, a nervous wobble, sweating...
  race_worried: { dur: 1.6, loop: [0.2, 1.4], keys: [
    KEY(0, {}), KEY(0.2, { brows: WORRY, mouth: 'mochiwave', glance: 1, tilt: 6, front: [2, -4], back: [-1, -4], extra: ['sweat0'] }),
    KEY(0.8, { brows: WORRY, mouth: 'gasp', glance: 1, tilt: 2, front: [2, -4], back: [-1, -4], extra: ['sweat1'] }),
    KEY(1.4, { brows: WORRY, mouth: 'mochiwave', glance: 1, tilt: 6, front: [2, -4], back: [-1, -4], extra: ['sweat0'] }), KEY(1.6, {})] },
  // ...worn out: drooping, panting, sweat flying...
  race_tired: { dur: 1, loop: [0.1, 0.9], keys: [
    KEY(0, {}), KEY(0.1, { eyes: 'half', mouth: 'tongue', hy: 2, tilt: 10, squat: 1, front: [1.4, 4], back: [0.6, 4], extra: ['sweat1'], blush: 1.8 }),
    KEY(0.5, { eyes: 'half', mouth: 'mochiopen', hy: 2.4, tilt: 12, squat: 1, bob: 0.6, front: [1.4, 4], back: [0.6, 4], extra: ['sweat0'], blush: 1.8 }),
    KEY(0.9, { eyes: 'half', mouth: 'tongue', hy: 2, tilt: 10, squat: 1, front: [1.4, 4], back: [0.6, 4], extra: ['sweat1'], blush: 1.8 }), KEY(1, {})] },
  // ...and cheered on: eyes squeezed happy, sparkles, a little hop.
  race_cheered: { dur: 1.2, loop: [0.1, 1.1], keys: [
    KEY(0, {}), KEY(0.1, { closed: [true, true], mouth: 'D', ...OUT(-11), sprout: 'excited', extra: ['spark0'] }),
    KEY(0.35, { closed: [true, true], mouth: 'D', ...OUT(-13), lift: 2.4, sprout: 'excited', extra: ['spark1'], ease: 'out' }),
    KEY(0.6, { closed: [true, true], mouth: 'D', ...OUT(-11), sprout: 'excited', extra: ['spark0'], ease: 'in' }),
    KEY(0.85, { closed: [true, true], mouth: 'D', ...OUT(-13), lift: 2.4, sprout: 'excited', extra: ['spark1'], ease: 'out' }),
    KEY(1.1, { closed: [true, true], mouth: 'D', ...OUT(-11), sprout: 'excited' }), KEY(1.2, {})] },
  // On the podium: feet planted (its medal stays on its chest), swaying side to side and waving both
  // arms over its head, eyes squeezed happy, sparkles.
  podium_cheer: { dur: 1.6, loop: [0.1, 1.5], keys: [
    KEY(0, {}), KEY(0.1, { closed: [true, true], mouth: 'D', front: [9, -14], back: [-6, -16], tilt: -7, hx: -0.5, sprout: 'excited', extra: ['spark0'] }),
    KEY(0.5, { closed: [true, true], mouth: 'D', front: [6, -16], back: [-9, -14], tilt: 7, hx: 0.5, sprout: 'excited', extra: ['spark1'] }),
    KEY(0.9, { closed: [true, true], mouth: 'mochiopen', front: [9, -14], back: [-6, -16], tilt: -7, hx: -0.5, sprout: 'excited', extra: ['spark0'] }),
    KEY(1.3, { closed: [true, true], mouth: 'D', front: [6, -16], back: [-9, -14], tilt: 7, hx: 0.5, sprout: 'excited', extra: ['spark1'] }),
    KEY(1.5, { closed: [true, true], mouth: 'D', front: [9, -14], back: [-6, -16], tilt: -7, hx: -0.5 }), KEY(1.6, {})] },
  // Winning: happy tears, hopping with its arms up, sparkles.
  race_joy: { dur: 1.6, loop: [0.1, 1.5], keys: [
    KEY(0, {}), KEY(0.1, { closed: [true, true], mouth: 'D', ...OUT(-12), extra: ['tear0', 'spark0'], sprout: 'happy', blush: 1.9 }),
    KEY(0.45, { closed: [true, true], mouth: 'D', ...OUT(-14), lift: 3.4, extra: ['tear0', 'spark1'], sprout: 'excited', blush: 1.9, ease: 'out' }),
    KEY(0.8, { closed: [true, true], mouth: 'mochibeam', ...CHEST, extra: ['tear0', 'hearts'], blush: 1.9, ease: 'in' }),
    KEY(1.15, { closed: [true, true], mouth: 'D', ...OUT(-14), lift: 3, extra: ['tear0', 'spark0'], sprout: 'excited', blush: 1.9, ease: 'out' }),
    KEY(1.5, { closed: [true, true], mouth: 'D', ...OUT(-12), extra: ['tear0'], blush: 1.9 }), KEY(1.6, {})] },
});

// Where action `a` is (`{ bit, t (seconds into its keys), tq (on its 12 fixed frames) }`), or
// null once it's done (and `m.action` is cleared, or the next in `m.queue` begins).
function actionAt(m, time) {
  const a = m.action;
  // (Any idle moment or trick can be played on cue too: a trick just learned, a dance, a wave.)
  const bit = ACTIONS[a.name] ?? IDLE_BITS[a.name];
  if (!bit) return (m.action = null);
  a.t0 ??= time;
  const map = (e) => {
    if (!bit.loop) return e;
    const [l0, l1] = bit.loop;
    const len = l1 - l0;
    const turns = Math.max(1, Math.round(((a.hold ?? 0) - (bit.dur - len)) / len));
    if (e < l0) return e;
    if (e < l0 + turns * len) return l0 + ((e - l0) % len);
    return l1 + (e - l0 - turns * len);
  };
  const e = time - a.t0;
  const t = map(e);
  if (t >= bit.dur) {
    // (Next in line, if anything's queued: straight on.)
    m.action = m.queue?.length ? { ...m.queue.shift(), t0: time } : null;
    return m.action ? actionAt(m, time) : null;
  }
  return { bit, t, tq: map(Math.floor(e * MOMENT_FPS) / MOMENT_FPS) };
}

// ---------- Following: every number of the pose is carried to the next on a spring ----------
const FOLLOW = { k: 260, damp: 0.8 };
function follow(st, target, dt) {
  if (!st.P) {
    st.P = structuredClone(target);
    st.V = {};
    return st.P;
  }
  const c = 2 * Math.sqrt(FOLLOW.k) * FOLLOW.damp;
  const P = { ...target };
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  const spring = (x, v, to) => {
    for (let i = 0; i < n; i++) {
      v += ((to - x) * FOLLOW.k - v * c) * h;
      x += v * h;
    }
    return [x, v];
  };
  for (const key of Object.keys(target)) {
    const to = target[key];
    const was = st.P[key];
    if (typeof to === 'number' && typeof was === 'number') [P[key], st.V[key]] = spring(was, st.V[key] ?? 0, to);
    else if (Array.isArray(to) && Array.isArray(was) && to.length === was.length && typeof to[0] === 'number') {
      const vs = (st.V[key] ??= to.map(() => 0));
      P[key] = to.map((t, i) => {
        const [x, v] = spring(was[i], vs[i], t);
        vs[i] = v;
        return x;
      });
    }
  }
  st.P = P;
  return P;
}

// ---------- Drawing ----------
const STATE = new WeakMap();
const q = (v) => Math.round(v * 4) / 4;
const q3 = (v) => Math.round(v / 3) * 3;
// Its eyes, on its standing loop (so they come round with it): a blink at its own moment (and a
// double blink for some), and a glance aside at another, each Mochi at its own times.
const loopTime = (g, time) => Math.floor((((time + hash(g.seed + 9) * 6) % STAND_LOOP.secs) * STAND_LOOP.fps)) / STAND_LOOP.fps;
function eyesAt(g, t) {
  const at = 0.4 + hash(g.seed + 1) * 4.6;
  const twice = hash(g.seed + 2) > 0.55;
  const d = t - at;
  if (d >= 0 && d < 1 / 12) return 'half';
  if (d >= 1 / 12 && d < 2 / 12) return 'blink';
  if (twice && d >= 3 / 12 && d < 4 / 12) return 'blink';
  return null;
}
function glanceAt(g, t) {
  const at = (hash(g.seed + 3) * 6 + 3) % 6;
  return t >= at && t < at + 1 ? (hash(g.seed + 4) > 0.5 ? 1 : -1) : 0;
}

// ---------- Acting while running ----------
// Nobody runs with one stiff face. Every few seconds a running Mochi plays a little act that fits
// how good a runner it is (and leans toward ones that fit its personality), and between acts it
// wears its tier's own running face. An act is a few held beats with an in-between at each end
// (faces never snap); each beat may change the face (eyes, mouth, brows, blush, a glance, marks
// like sweat or sparkles), turn the head, move the arms, or droop or perk the sprout. Held beats
// over the stride's 16 frames: every drawing comes round again.
// (`tier` on an act is its band: 0 struggling, 1 happy, 2 focused, 3 cool; BAND maps the styles.)
//   beat: [seconds, { eyes, mouth, brows, blush, glance, wide, shine, teary, spiral, cross, lid,
//          closed, extra, tilt (added), hx (added), hy (added), front, back, sprout }]
const SAD = [[0.5, -0.7], [0.5, -0.7]];
const FIERCE = [[-0.4, 0.8], [-0.4, 0.8]];
const SMUG = [[0.1, 0.3], [0.9, -0.4]];
export const RUN_FACE = [
  // Waddling: trying hard, a bit flustered.
  { mouth: 'wavy', brows: SAD, blush: 1.6 },
  // Trotting: happy.
  { mouth: null, closed: null },
  // Sprinting: focused.
  { mouth: 'mochiopen', brows: [[-0.2, 0.4], [-0.2, 0.4]] },
  // Dashing: cool and fierce.
  { mouth: 'mochiflat', brows: FIERCE, lid: 0.2 },
];
export const RUN_ACTS = {
  // ---- Waddle (low skill): struggling, flustered, scared, a mess ----
  pant: { tier: 0, likes: ['lazy', 'sleepy', 'foodie'], beats: [
    [0.25, { eyes: 'half', mouth: 'o' }],
    [1.6, { eyes: 'half', mouth: 'tongue', extra: ['sweat1'], hy: 0.8, tilt: 6, sprout: 'sleepy' }],
    [0.25, { eyes: 'half', mouth: 'o' }]] },
  scaredback: { tier: 0, likes: ['timid', 'shy', 'clumsy'], beats: [
    [0.2, { glance: -1, mouth: 'mochio', tilt: 4 }],
    [0.9, { glance: -1, wide: true, mouth: 'gasp', extra: ['bang1'], tilt: 8, hx: -1, front: [2, -8], back: [-2, -8], sprout: 'excited' }],
    [0.7, { eyes: 'hurt', mouth: 'yell', extra: ['drop', 'sweat2'], front: [3, -7.4], back: [-1, -8.2], sprout: 'excited' }],
    [0.25, { mouth: 'wavy', extra: ['sweat0'] }]] },
  teary: { tier: 0, likes: ['timid', 'clingy', 'dramatic'], beats: [
    [0.3, { teary: 1, mouth: 'wavy', brows: SAD }],
    [1.4, { teary: 2, extra: ['tear0'], mouth: 'sob', brows: SAD, sprout: 'sad' }],
    [0.3, { teary: 1, mouth: 'wavy', brows: SAD }]] },
  dizzy: { tier: 0, likes: ['clumsy', 'dreamy'], beats: [
    [0.25, { eyes: 'half', mouth: 'wavy' }],
    [0.6, { spiral: 1, extra: ['orbit3'], mouth: 'wavy', tilt: 10 }],
    [0.6, { spiral: 2, extra: ['orbit5'], mouth: 'wavy', tilt: -8 }],
    [0.25, { eyes: 'half', mouth: 'wavy' }]] },
  tryhard: { tier: 0, likes: ['brave', 'sporty', 'bossy'], beats: [
    [0.25, { cross: 0.3, mouth: 'mochiflat' }],
    [1.5, { cross: 0.6, mouth: 'grit', extra: ['steam1'], blush: 1.8, sprout: 'excited' }],
    [0.25, { cross: 0.3, mouth: 'mochiflat' }]] },
  // ---- Trot: happy, cheery ----
  joy: { tier: 1, likes: ['playful', 'bubbly', 'sweet'], beats: [
    [0.2, { eyes: 'half', mouth: 'mochiopen' }],
    [1.4, { closed: [true, true], mouth: 'D', blush: 1.7, extra: ['spark0'], sprout: 'happy' }],
    [0.2, { eyes: 'half', mouth: 'mochiopen' }]] },
  sing: { tier: 1, likes: ['chatty', 'dreamy', 'artsy'], beats: [
    [0.5, { closed: [true, true], mouth: 'o', extra: ['note'], tilt: 4 }],
    [0.5, { closed: [true, true], mouth: 'mochiw', extra: ['note'], tilt: -4 }],
    [0.5, { closed: [true, true], mouth: 'o', extra: ['note'], tilt: 4 }],
    [0.2, { eyes: 'half' }]] },
  cheerback: { tier: 1, likes: ['gentle', 'polite', 'clingy'], beats: [
    [0.25, { glance: -1, tilt: 4 }],
    [1, { glance: -1, mouth: 'grin', tilt: 6, hx: -0.8, back: [-3, -8], blush: 1.5 }],
    [0.25, { glance: 0, mouth: 'mochiopen' }]] },
  puff: { tier: 1, likes: ['proud', 'stoic', 'grumpy'], beats: [
    [0.25, { cross: 0.2, mouth: 'mochitri' }],
    [1.3, { cross: 0.4, mouth: 'mochitri', extra: ['steam0'] }],
    [0.25, { mouth: 'mochiopen' }]] },
  // ---- Sprint: focused, confident ----
  focus: { tier: 2, likes: ['stoic', 'sporty', 'brave'], beats: [
    [0.25, { cross: 0.3, lid: 0.15 }],
    [1.6, { cross: 0.6, lid: 0.25, mouth: 'grit', tilt: -4 }],
    [0.25, { cross: 0.3, lid: 0.15 }]] },
  grin: { tier: 2, likes: ['proud', 'showoff', 'bubbly'], beats: [
    [0.2, { mouth: 'mochiopen' }],
    [1.5, { shine: true, mouth: 'grin', brows: [[0.3, 0.2], [0.3, 0.2]], extra: ['spark0'], sprout: 'happy' }],
    [0.2, { mouth: 'mochiopen' }]] },
  checkback: { tier: 2, likes: ['nosy', 'curious', 'sneaky'], beats: [
    [0.25, { glance: -1, tilt: 4 }],
    [0.7, { glance: -1, mouth: 'smirk', hx: -0.6, tilt: 6 }],
    [0.4, { glance: 1, mouth: 'grin' }]] },
  wink: { tier: 2, likes: ['cheeky', 'sassy', 'playful'], beats: [
    [0.15, { closed: [false, 'half'] }],
    [0.9, { closed: [false, true], mouth: 'tongue', extra: ['spark1'], blush: 1.5 }],
    [0.15, { closed: [false, 'half'] }]] },
  gogo: { tier: 2, likes: ['hyper', 'bossy', 'dramatic'], beats: [
    [0.2, { mouth: 'mochiopen', cross: 0.3 }],
    [1.1, { mouth: 'yell', brows: FIERCE, extra: ['bang1'], sprout: 'excited' }],
    [0.2, { mouth: 'mochiopen' }]] },
  // ---- Ninja dash: cool, smug, taunting ----
  cool: { tier: 3, likes: ['cool', 'loner', 'stoic'], beats: [
    [0.25, { lid: 0.3 }],
    [1.8, { lid: 0.4, mouth: 'smirk', brows: SMUG }],
    [0.25, { lid: 0.3 }]] },
  taunt: { tier: 3, likes: ['cheeky', 'mischief', 'sassy', 'sneaky'], beats: [
    [0.25, { glance: -1, tilt: 6, mouth: 'smirk' }],
    [1.2, { glance: -1, closed: [false, true], mouth: 'bleh', hx: -1, tilt: 8, extra: ['spark0'], brows: SMUG, sprout: 'curious' }],
    [0.25, { glance: 0, mouth: 'smirk' }]] },
  smug: { tier: 3, likes: ['proud', 'bossy', 'cool'], beats: [
    [0.25, { eyes: 'half', mouth: 'smirk' }],
    [1.6, { closed: [true, true], mouth: 'smugcat', brows: SMUG, tilt: -4 }],
    [0.25, { eyes: 'half', mouth: 'smirk' }]] },
  showoff: { tier: 3, likes: ['showoff', 'dramatic', 'bubbly'], beats: [
    [0.2, { mouth: 'grin' }],
    [1.5, { shine: true, mouth: 'D', extra: ['spark0', 'spark1'], blush: 1.4, sprout: 'excited' }],
    [0.2, { mouth: 'grin' }]] },
  yawn: { tier: 3, likes: ['lazy', 'sleepy', 'cool'], beats: [
    [0.3, { eyes: 'half', mouth: 'o' }],
    [1.2, { eyes: 'half', mouth: 'yawn', extra: ['dots3'], tilt: 4, sprout: 'sleepy' }],
    [0.3, { eyes: 'half', mouth: 'mochiflat' }]] },
};
const ACT_NAMES = Object.keys(RUN_ACTS);
// The act a running Mochi is in at `time` (or null between acts), picked in turn from its seed, so
// the same Mochi acts the same way: its personality's favourites three times as likely.
function runActAt(st, g, tier, time) {
  const band = BAND[tier];
  if (st.act && st.act.band !== band) st.act = null;
  if (st.act) {
    const len = RUN_ACTS[st.act.name].beats.reduce((a, [d]) => a + d, 0);
    if (time - st.act.t0 < len) return st.act;
    st.act = null;
    st.nextAct = time + 1.2 + hash(g.seed + (st.acts ?? 0) * 7) * 2.2;
  }
  st.nextAct ??= time + 0.8 + hash(g.seed + 11) * 1.6;
  if (time < st.nextAct) return null;
  const pool = ACT_NAMES.filter((n) => RUN_ACTS[n].tier === band && n !== st.lastAct);
  const weight = (n) => (RUN_ACTS[n].likes.includes(g.personality) ? 3 : 1);
  let r = hash(g.seed * 31 + (st.acts ?? 0) * 13 + 5) * pool.reduce((a, n) => a + weight(n), 0);
  let name = pool[0];
  for (const n of pool) {
    r -= weight(n);
    if (r < 0) {
      name = n;
      break;
    }
  }
  st.acts = (st.acts ?? 0) + 1;
  st.lastAct = name;
  st.act = { name, band, t0: time };
  return st.act;
}
// The beat an act is on, `dt` seconds in.
function beatOf(act, time) {
  let t = time - act.t0;
  for (const [d, b] of RUN_ACTS[act.name].beats) {
    if (t < d) return b;
    t -= d;
  }
  return null;
}

// ---------- In the crowd ----------
// A little Mochi in the stands (render/race.js), cheering: `beat` 0 sitting happy, paws at its chest;
// 1 paws up; 2 paws flung high; 3 a shout. Only these few drawings for each Mochi (facing either way
// is the same drawing turned), so a whole crowd is painted once, then only placed and bobbed.
const SPECTATE = [
  { front: [1.4, -4.4], back: [2, -4.2], mouth: 'mochiw', sprout: 'happy', blush: 1.6 },
  { front: [5, -5], back: [-5, -5], closed: [true, true], mouth: 'D', sprout: 'excited', blush: 1.6 },
  { ...OUT(-12), closed: [true, true], mouth: 'D', sprout: 'excited', blush: 1.8 },
  { ...OUT(-14), tilt: -6, closed: [true, true], mouth: 'yell', sprout: 'excited', blush: 1.8 },
].map((o) => ({ ...pose(o), closed: o.closed, sprout: o.sprout }));
export const SPECTATOR_BEATS = SPECTATE.length;
// (`ahead`: only asked for, for the sprite worker to paint before it's needed.)
export function drawSpectator(ctx, g, x, y, beat, facing = 1, slot = null, ahead = false) {
  const P = SPECTATE[beat] ?? SPECTATE[0];
  const rig = {
    tx: 0, by: 0, hx: P.hx, hy: P.hy + 0.6, tilt: P.tilt, lift: 0, squat: 0,
    backArm: P.back, frontArm: P.front, armSide: 0.6, hipIn: 0, frontLeg: [0.5, 0, 1.5], backLeg: [-0.5, 0, -1.5],
    air: false, hair: 0, hairTip: 0, eyes: 'open', view: 'side', climb: 0, armOver: null,
    face: { brows: P.brows, extra: [], blush: P.blush, glance: 0, ...(P.closed ? { closed: P.closed } : {}) },
  };
  let look = lookOf(g, P.sprout, 0);
  if (P.mouth) look = { ...look, mouth: P.mouth };
  drawPosed(ctx, look, Math.round(x * 2) / 2, Math.round(y * 2) / 2, rig, { scale: MOCHI_SIZE.baby, facing, slot, ahead });
}

// Draws Mochi `m` with its feet at (x, y) at `time` seconds. `m`: { genes, dir (1 right, -1 left),
// speed (px/s along the ground; 0 standing), dist (px it has travelled: the steps follow it, so feet
// never slide), mood (the sprout, optional), size ('grown' or 'baby') }.
export function drawMochiAnim(ctx, m, x, y, time) {
  const g = m.genes;
  let st = STATE.get(m);
  if (!st) STATE.set(m, (st = { last: time }));
  const dt = Math.max(0, Math.min(0.1, time - st.last));
  st.last = time;
  const s = MOCHI_SIZE[m.size ?? 'grown'];
  // What it's doing (`m.mode`: run, swim or fly) picks the stat its style comes from.
  const kind = m.mode ?? 'run';
  const table = kind === 'swim' ? SWIMS : kind === 'fly' ? FLIES : kind === 'climb' ? CLIMBS : GAITS;
  const stat = kind === 'swim' ? 'swim' : kind === 'fly' ? 'fly' : kind === 'climb' ? 'power' : 'run';
  const pts = m[`${stat}Points`] ?? g.stats?.[stat]?.points ?? 0;
  // (Out of a race, `m.easy`: it runs in the style that suits how fast it's going, up to its best,
  // so a great runner trotting after you trots instead of ninja-dashing at walking pace.)
  const fits = m.easy && kind === 'run' && (m.speed ?? 0) > 1 ? GAITS.findIndex((gt) => gt.speed >= m.speed * 0.9) : null;
  const easyTier = fits == null ? null : fits < 0 ? GAITS.length - 1 : fits;
  const tier = m.tier ?? (easyTier != null ? Math.min(runStyle(pts), easyTier) : runStyle(pts));
  // (Swimming and flying never stop: holding still, it treads water or hovers.)
  const moving = (m.speed ?? 0) > 1 || kind !== 'run';
  // (Not able to yet: crawling, flailing, flopping. `m.cant` reports which.)
  const cant0 = m.tier != null || !moving ? null : kind === 'run' && pts < CANT.run ? 'crawl' : kind === 'swim' && pts < CANT.swim ? 'flail' : kind === 'fly' && pts < CANT.fly ? 'flop' : null;
  // (A crawler turning round, or pausing for a blink, stays down on all fours: it only sits up once
  // it's been still a moment. Otherwise each turn popped it up onto its feet and back down, a hop.)
  if (cant0 === 'crawl') st.crawlAt = time;
  const cant = cant0 ?? (m.tier == null && kind === 'run' && !m.action && pts < CANT.run && time - (st.crawlAt ?? -9) < 0.45 ? 'crawl' : null);
  m.cant = cant;
  const mvT = cant ? CANT_MOVES[cant] : table[tier];
  // The cycle follows the distance travelled. Arms, legs and face (what's drawn) step through it on
  // fixed frames, more of them the slower the cycle (16 to 32), so every drawing
  // comes round again; how high it is, how far it leans and how deep it sits are worked out fresh
  // every frame (they only move the drawing, never repaint it), so the motion itself is smooth.
  const travelled = cant && cant !== 'crawl' ? time * mvT.speed : (m.speed ?? 0) > 1 ? (m.dist ?? 0) / (mvT.stride * s / 0.6) : time * 0.8;
  const pc = ((travelled % 1) + 1) % 1;
  const cycle = cant && cant !== 'crawl' ? 1 / mvT.speed : mvT.stride / mvT.speed;
  // (While an act's face is on, the limbs step at half the rate: the face is what's being drawn new.)
  const N0 = kind === 'swim' ? 32 : Math.max(16, Math.min(32, Math.round((cycle * 30) / 4) * 4));
  const N = st.act && kind !== 'swim' ? N0 / 2 : N0;
  // (Held down on all fours through a turn, it keeps the stroke it was in rather than snapping back.)
  const phase = moving ? Math.floor(pc * N) / N : cant === 'crawl' ? st.crawlPh ?? 0 : 0;
  if (cant === 'crawl') st.crawlPh = phase;
  const poseAt = (ph) => (cant ? cantPose(cant, ph) : kind === 'swim' ? swimPose(tier, ph) : kind === 'fly' ? flyPose(tier, ph) : kind === 'climb' ? climbPose(tier, ph) : gaitPose(tier, ph));
  // Running wears it out, as much as its Stamina allows (standing, it gets its breath back); the
  // most tired stop to catch their breath. (`m.fatigue` and `m.resting` tell whoever moves it.)
  const stam = STAMINAS[runStyle(m.staminaPoints ?? g.stats?.stamina?.points ?? 0)];
  st.runFor = Math.max(0, (st.runFor ?? 0) + (kind === 'run' && moving && !st.restUntil ? dt : -2 * dt));
  if (st.restUntil && time >= st.restUntil) {
    st.restUntil = null;
    st.runFor *= 0.35;
  }
  // (A race works out its runners' tiredness itself, world/mochi-race.js, and hands it over as
  // `m.tired` and `m.rest`, so the drawing shows exactly what's slowing it down.)
  let fatigue = m.tired ?? (kind === 'run' ? Math.min(stam.most, st.runFor * stam.tire) : 0);
  if (m.tired == null && kind === 'run' && moving && fatigue >= 0.98 && !st.restUntil) st.restUntil = time + 2.6;
  const resting = m.rest ?? Boolean(st.restUntil);
  if (resting) fatigue = 1;
  m.fatigue = fatigue;
  m.resting = resting;
  // (The drawing steps through tiredness in fifths; how it rides and leans follows it smoothly.)
  const fq = Math.round(fatigue * 4) / 4;
  const restT = Math.floor(time * 12) / 12;
  // Standing about, now and then an idle moment (stopped mid-way if it sets off).
  if (moving || resting) {
    st.idle = null;
    st.nextIdle = null;
  }
  // Something the garden has it doing (eating, napping, playing...) comes before idling.
  const act = !moving && !resting && m.action ? actionAt(m, time) : null;
  if (act) {
    st.idle = null;
    st.nextIdle = null;
  }
  const sweetKind = act ? m.action.sweet ?? (m.action.name === 'hated' ? g.hates : g.loves) : null;
  const idle = !act && !moving && !resting && !m.noIdle ? idleAt(st, g, time, m.idleBits) : null;
  m.idling = idle?.name ?? null;
  const posed = idle || act;
  const baby = (m.size ?? 'grown') === 'baby';
  const still = posed ? pose(baby ? babyOf(STANCE[g.personality] ?? STANCE.gentle) : STANCE[g.personality] ?? STANCE.gentle) : null;
  let target = resting ? restPose(restT) : moving ? poseAt(phase) : act ? idlePose(act.bit, act.tq, still) : idle ? idlePose(IDLE_BITS[idle.name], Math.floor((time - idle.t0) * MOMENT_FPS) / MOMENT_FPS, still) : standPose(g, time, baby);
  let live = resting ? target : moving ? poseAt(pc) : act ? idlePose(act.bit, act.t, still) : idle ? idlePose(IDLE_BITS[idle.name], time - idle.t0, still) : target;
  if (!resting && kind === 'run' && moving && !cant) {
    target = tiredPose(target, fq);
    live = tiredPose(live, fatigue);
  }
  // Springs only carry it from one way of moving to the next (a third of a second); once there it
  // runs on its fixed frames exactly, so every drawing comes round again.
  const mode = resting ? 'rest' : moving ? `${kind}${tier}` : act ? 'act' : idle ? 'idle' : 'stand';
  if (st.mode !== mode) {
    st.mode = mode;
    st.blendAt = time;
  }
  let P;
  if (st.P && time - st.blendAt < 0.33) P = follow(st, target, dt);
  else {
    P = target;
    st.P = structuredClone(target);
    st.V = {};
  }
  // The smooth part, carried on a lively spring so it overshoots a touch and settles: the bounce.
  const D = (st.D ??= { P: {}, V: {} });
  const bouncy = (key, to0) => {
    // (A lean is an angle: a whole turn more or less is the same pose, never spun back.)
    const to = key === 'lean' && D.P[key] != null ? to0 + TAU * Math.round((D.P[key] - to0) / TAU) : to0;
    if (D.P[key] == null) {
      D.P[key] = to;
      D.V[key] = 0;
      return to;
    }
    const k = 520;
    const c = 2 * Math.sqrt(k) * 0.5;
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    let x0 = D.P[key];
    let v = D.V[key];
    for (let i = 0; i < n; i++) {
      v += ((to - x0) * k - v * c) * h;
      x0 += v * h;
    }
    D.P[key] = x0;
    D.V[key] = v;
    return x0;
  };
  const blendK = st.P && time - st.blendAt < 0.33 ? Math.min(1, (time - st.blendAt) / 0.33) : 1;
  const liftNow = bouncy('lift', lerp(P.lift, live.lift, blendK));
  const leanNow = bouncy('lean', lerp(P.lean, live.lean, blendK));
  const sinkNow = bouncy('sink', lerp(P.sink, live.sink, blendK));
  const tipNow = lerp(P.tip, live.tip, blendK);
  const dir = m.dir || 1;
  const tl = loopTime(g, time);
  const blink = moving || posed ? null : eyesAt(g, tl);
  const rig = {
    tx: 0, by: q(P.bob), hx: q(P.hx), hy: q(P.hy), tilt: Math.round(P.tilt / 2) * 2, lift: liftNow, squat: Math.round(P.squat),
    backArm: [q(P.back[0]), q(P.back[1])], frontArm: [q(P.front[0]), q(P.front[1])], armSide: moving ? 0.35 : 0.6, hipIn: moving ? 0.6 : 0,
    frontLeg: [q(P.legF[0]), q(P.legF[1]), q3(P.legF[2])], backLeg: [q(P.legB[0]), q(P.legB[1]), q3(P.legB[2])],
    air: target.lift > 1.5, hair: Math.round(P.hair * 2) / 2, hairTip: Math.round(P.hair * 2.4) / 2,
    eyes: target.eyes ?? blink ?? 'open',
    view: target.view ?? 'side', climb: Math.round((P.climb ?? 0) * 4) / 4, armOver: target.armOver ?? null,
    face: { brows: target.brows ?? REST.brows, extra: [], blush: target.blush ?? REST.blush, glance: target.glance ?? (moving || posed ? 0 : glanceAt(g, tl)), look: target.look },
  };
  if (posed) {
    for (const k of ['wide', 'shine', 'teary', 'spiral', 'cross', 'lid', 'closed', 'puff']) if (target[k] != null) rig.face[k] = target[k];
    rig.face.extra = target.extra;
  }
  // Running, its tier's face, and now and then an act over it.
  let mouth = target.mouth;
  let sprout = posed ? target.sprout : null;
  if (cant) {
    // (Can't yet: the pose's own face.)
    if (target.eyes) rig.eyes = target.eyes;
    for (const k of ['wide', 'shine', 'brows', 'blush']) if (target[k] != null) rig.face[k] = target[k];
    rig.face.extra = target.extra ?? [];
    sprout = target.sprout ?? null;
  } else if (moving && !resting && kind !== 'climb') {
    const act = runActAt(st, g, tier, time);
    const beat = act ? beatOf(act, time) : null;
    m.acting = act?.name ?? null;
    const face = { ...RUN_FACE[BAND[tier]], ...(beat ?? {}) };
    if (face.mouth !== undefined) mouth = face.mouth ?? mouth;
    if (face.eyes) rig.eyes = face.eyes;
    for (const k of ['brows', 'blush', 'glance', 'wide', 'shine', 'teary', 'spiral', 'cross', 'lid', 'closed']) if (face[k] != null) rig.face[k] = face[k];
    if (face.extra) rig.face.extra = face.extra;
    if (beat && kind === 'run') {
      rig.tilt += Math.round((beat.tilt ?? 0) / 2) * 2;
      rig.hx = q(rig.hx + (beat.hx ?? 0));
      rig.hy = q(rig.hy + (beat.hy ?? 0));
      // (Not while the arms are pumping all out or flung back.)
      if (beat.front && tier < 4) rig.frontArm = beat.front;
      if (beat.back && tier < 4) rig.backArm = beat.back;
      sprout = beat.sprout ?? null;
    }
  }
  if (kind === 'run' && moving && fq >= 0.5) {
    mouth = fq >= 0.75 ? 'tongue' : 'o';
    if (fq >= 0.75) rig.eyes = 'half';
    rig.face.extra = ['sweat1'];
    rig.face.blush = 1.7;
    sprout = 'sleepy';
  }
  if (resting) {
    rig.face.extra = ['sweat0'];
    sprout = 'sad';
  }
  if (kind === 'run' && moving && stam.tire === 0 && st.runFor > 6 && (time % 6) < 2) {
    rig.face.extra = ['note'];
    rig.face.closed = [true, true];
    mouth = 'o';
  }
  // (Being raised, how it feels shows on its sprout when nothing else is: drooping when it's glum,
  // perked up when it's very happy.)
  const felt = typeof g.mood === 'number' ? (g.mood < 30 ? 'sad' : g.mood > 85 ? 'happy' : null) : null;
  const mood = m.mood ?? sprout ?? (moving && tier >= 3 ? 'excited' : felt);
  let look = lookOf(g, mood, time * 0.1);
  if (mouth) look = { ...look, mouth };
  const lean = leanNow;
  // A soft shadow under the feet, smaller the higher it is (none in the water, or gliding high
  // over it: `m.noShadow`).
  if (kind !== 'swim' && kind !== 'climb' && !m.noShadow) {
    ctx.fillStyle = 'rgba(70,40,90,0.16)';
    ctx.beginPath();
    // (Crawling, its weight sits back on its knees: the shadow goes with it.)
    const sx = x - (cant === 'crawl' ? dir * 6 * (s / 0.6) : 0);
    ctx.ellipse(sx, y, Math.max(2, 7 - liftNow * 0.22) * (s / 0.6), Math.max(0.8, 1.8 - liftNow * 0.04) * (s / 0.6), 0, 0, TAU);
    ctx.fill();
  }
  if (kind === 'run' && moving && tier >= 3) drawDust(ctx, x, y, dir, phase, GAITS[tier].stride * (s / 0.6), tier);
  if (kind === 'run' && moving && tier === 5) drawSpeedLines(ctx, x, y, dir, s, time);
  drawCoatBack(ctx, g, x, y, s, time);
  const tip = tipNow;
  // (A backstroke is drawn facing the other way, so tipped over its front faces the sky.)
  // (What it holds goes in its near hand: a sweet, bitten as it eats; its ball, moving smoothly.)
  const over = posed && target.hold ? (c, hand, flip) => {
    if (target.hold === 'sweet') drawSweet(c, sweetKind, hand[0], hand[1] + s, s * 0.75, Math.round(target.bites ?? 0));
    else if (target.hold === 'ball') drawBall(c, hand[0] + (flip ? -1 : 1) * live.ball[0] * s, hand[1] + live.ball[1] * s, s, live.spin);
  } : null;
  const leanW = ((((lean + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
  const opts = { scale: s, facing: target.flip || target.turned ? -dir : dir, lean: Math.abs(leanW) > 0.005 || Math.abs(tip) > 0.005 ? { tilt: leanW, lift: tip } : null, ...(over ? { over, hold: 'front' } : {}) };
  // (A ninja dash leaves two fading after-images behind: the same drawing stamped again, nothing
  // painted afresh.)
  // (Swimming, it sits down in the water: its feet below the waterline at `y`.)
  // (Flying, it's drawn up at its height rather than lifted on its legs, so a loop turns round
  // its own middle.)
  const alt = kind === 'fly' || kind === 'climb' ? liftNow : 0;
  if (alt) rig.lift = 0;
  // (Lying down for a nap, it's laid on the ground the same way.)
  // (Crawling, it's tipped right over, which the rig only does off the ground, so it's set back down.)
  const dy = kind === 'swim' ? (sinkNow + tip) * s : -alt * s + (posed || cant === 'crawl' ? sinkNow * s : 0);
  // (Painting ahead, `m.ahead`: only its body's drawing is asked for, for the sprite worker.)
  if (m.ahead) {
    drawPosed(ctx, look, 0, 0, rig, { ...opts, ahead: true });
    return;
  }
  // (A grown Mochi wears its feature; a Mochiko the dough buds of whatever it's growing into.)
  const feat = featureOf(g) ?? budOf(g);
  if (feat && rig.view !== 'back') {
    const Fr = posedFrame(Math.round(x * 2) / 2, Math.round((y + dy) * 2) / 2, rig, { scale: s, facing: opts.facing });
    const mvF = { mode: moving ? kind : 'stand', phase, pc, time, skin: look.skinTone, path: g.path };
    const prop = opts.over;
    opts.under = (c) => drawFeature(c, feat, 'under', Fr, mvF);
    opts.over = (c, hand, flip, other) => {
      drawFeature(c, feat, 'over', Fr, mvF, hand);
      prop?.(c, hand, flip, other);
    };
    opts.hold = 'front';
  }
  if (kind === 'run' && moving && tier === 5) {
    for (const [back, alpha] of [[26, 0.12], [13, 0.26]]) drawPosed(ctx, look, Math.round((x - dir * back * (s / 0.6)) * 2) / 2, Math.round((y + dy) * 2) / 2, rig, { ...opts, alpha, under: null, over: null });
  }
  drawPosed(ctx, look, Math.round(x * 2) / 2, Math.round((y + dy) * 2) / 2, rig, { ...opts, slot: m });
  if (posed && live.flame > 0.05) drawFlame(ctx, Math.round(x * 2) / 2, Math.round((y + dy) * 2) / 2, rig, opts, s, time, live.flame);
  if (posed && target.bubble) drawSnooze(ctx, Math.round(x * 2) / 2, Math.round((y + dy) * 2) / 2, rig, opts, s, time);
  if (kind === 'swim') drawWater(ctx, x, y, s, cant === 'flail' ? 'flail' : tier, pc, time, dir, m.inWater);
  drawCoat(ctx, g, x, y + dy, s, time);
}

// A little puff of fire from its mouth (the spicy senbei trick): flickering tongues of flame,
// yellow at the heart, licking out ahead of it.
function drawFlame(ctx, x, y, rig, opts, s, time, amount) {
  const k = (s / 0.6) * amount;
  const [mx, my] = posedMouth(x, y, rig, { scale: s, facing: opts.facing, lean: opts.lean });
  const fd = opts.facing < 0 ? -1 : 1;
  const flick = Math.floor(time * 16) % 3;
  ctx.save();
  for (const [len, wide, c, dy0] of [[9, 3, '#ff7a3a', 0], [7, 2.2, '#ffb040', -0.3], [4.4, 1.3, '#fff0a0', -0.2]]) {
    const l = (len + flick * 0.8) * k;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.quadraticCurveTo(mx + fd * l * 0.5, my - wide * k * 1.4 + dy0 * k, mx + fd * l, my - (1 + flick * 0.4) * k);
    ctx.quadraticCurveTo(mx + fd * l * 0.55, my + wide * k * 0.8, mx, my + 0.4 * k);
    ctx.fill();
  }
  ctx.restore();
}

// Asleep: a bubble at its nose swelling and shrinking with each breath, and little z's drifting up.
function drawSnooze(ctx, x, y, rig, opts, s, time) {
  const k = s / 0.6;
  const [mx, my] = posedMouth(x, y, rig, { scale: s, facing: opts.facing, lean: opts.lean });
  const th = (opts.lean?.tilt ?? 0) * (opts.facing < 0 ? -1 : 1);
  const up = [Math.sin(th), -Math.cos(th)];
  const breath = 0.5 - 0.5 * Math.cos((TAU * (time % 2)) / 2);
  const r = (0.5 + 1.4 * breath) * k;
  const fd = opts.facing < 0 ? -1 : 1;
  const side = [-fd * Math.cos(th), -fd * Math.sin(th)];
  const [nx, ny] = [mx + up[0] * 1.2 * k, my + up[1] * 1.2 * k];
  const [bx, by] = [nx + side[0] * (2.6 * k + r), ny + side[1] * (2.6 * k + r)];
  ctx.save();
  ctx.fillStyle = 'rgba(214,236,255,0.55)';
  ctx.strokeStyle = '#9cc8ee';
  ctx.lineWidth = 0.3 * k;
  ctx.beginPath();
  ctx.arc(bx, by, r, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx - r * 0.5, by - r * 0.55, 0.4 * k, 0.4 * k);
  // The z's: little pixel letters from above its head, rising and fading, bigger as they go.
  const [hx, hy] = [mx + up[0] * 9 * k, my + up[1] * 9 * k];
  ctx.fillStyle = '#8a7ac8';
  for (let i = 0; i < 3; i++) {
    const u = (time / 2.4 + i / 3) % 1;
    const c = (0.28 + 0.16 * u) * k;
    const [zx, zy] = [hx + (opts.facing < 0 ? -1 : 1) * (1 + u * 4) * k, hy - u * 7 * k];
    ctx.globalAlpha = u < 0.15 ? u / 0.15 : u > 0.75 ? (1 - u) / 0.25 : 1;
    for (const [a, b] of [[0, 0], [1, 0], [2, 0], [1, 1], [0, 2], [1, 2], [2, 2]]) ctx.fillRect(Math.round((zx + a * c) * 4) / 4, Math.round((zy + b * c) * 4) / 4, c, c);
  }
  ctx.restore();
}

// Puffs of dust kicked up at each footfall, left behind where they landed (they drift back as the
// Mochi runs on, exactly as far as it has run since).
function drawDust(ctx, x, y, dir, phase, stride, tier) {
  ctx.save();
  for (const contact of [0, 0.5]) {
    for (const back of [0, 1]) {
      const age = (((phase - contact) % 0.5) + 0.5) % 0.5 + back * 0.5;
      if (age > 0.75) continue;
      const k = age / 0.75;
      ctx.globalAlpha = (1 - k) * (tier === 5 ? 0.7 : 0.5);
      ctx.fillStyle = '#e8dcc8';
      const px = x - dir * (age * stride + 2);
      ctx.beginPath();
      ctx.arc(px, y - 1 - k * 3, 1.4 + k * 2.4, 0, TAU);
      ctx.arc(px - dir * 2.2, y - 0.6 - k * 2, 1 + k * 1.8, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}
// Speed lines streaming behind a ninja dash.
function drawSpeedLines(ctx, x, y, dir, s, time) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  [[-14, 0.1], [-22, 0.45], [-30, 0.75], [-8, 0.3]].forEach(([dy, ph]) => {
    const u = Math.floor(((time * 3 + ph) % 1) * 12) / 12;
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.85;
    ctx.lineWidth = 1.1 * (s / 0.6);
    const x0 = x - dir * (10 + u * 18) * (s / 0.6);
    ctx.beginPath();
    ctx.moveTo(x0, y + dy * (s / 0.6));
    ctx.lineTo(x0 - dir * 12 * (s / 0.6), y + dy * (s / 0.6));
    ctx.stroke();
  });
  ctx.restore();
}
