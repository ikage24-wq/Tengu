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

import { drawPosed } from './hero.js';
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
const REST = { lean: 0, tip: 0, sink: 0, bob: 0, lift: 0, hx: 0, hy: 1, tilt: -2, front: [0, 0], back: [0, 0], legF: [0.8, 0, 0], legB: [-0.8, 0, 0], squat: 0, hair: 0, eyes: null, mouth: null, brows: [[0.2, 0], [0.2, 0]], blush: 1.2, glance: 0 };
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
function drawWater(ctx, x, y, s, style, phase, time, dir = 1) {
  const k = s / 0.6;
  const w = 26 * k;
  ctx.save();
  ctx.fillStyle = 'rgba(96,176,232,0.62)';
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
  if (style === 0) {
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

// ---------- Standing ----------
// Breathing in its stance, and its weight shifting from foot to foot now and then.
// (A loop of 6 s on 12 frames a second, every rhythm in it a whole number of times round, so its
// 72 drawings come round again and again: speed rules.)
export const STAND_LOOP = { secs: 6, fps: 12 };
function standPose(g, time) {
  const st = STANCE[g.personality] ?? STANCE.gentle;
  const ph = hash(g.seed) * TAU;
  const t = loopTime(g, time);
  const w = TAU / STAND_LOOP.secs;
  const br = Math.sin(t * w * 2 + ph);
  const shift = Math.sin(t * w + ph) > 0.5 ? 1 : 0;
  return pose({ ...st, bob: 0.3 * br, hy: (st.hy ?? 1) + 0.25 * Math.sin(t * w * 2 + ph - 0.6), tilt: st.tilt + 1.5 * shift, hx: (st.hx ?? 0) + 0.3 * shift, hair: 0.3 * Math.sin(t * w + ph) });
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
  const table = kind === 'swim' ? SWIMS : kind === 'fly' ? FLIES : GAITS;
  const stat = kind === 'swim' ? 'swim' : kind === 'fly' ? 'fly' : 'run';
  const tier = m.tier ?? runStyle(m[`${stat}Points`] ?? g.stats?.[stat]?.points ?? 0);
  // (Swimming and flying never stop: holding still, it treads water or hovers.)
  const moving = (m.speed ?? 0) > 1 || kind !== 'run';
  // The cycle follows the distance travelled. Arms, legs and face (what's drawn) step through it on
  // fixed frames, more of them the slower the cycle (16 to 32), so every drawing
  // comes round again; how high it is, how far it leans and how deep it sits are worked out fresh
  // every frame (they only move the drawing, never repaint it), so the motion itself is smooth.
  const travelled = (m.speed ?? 0) > 1 ? (m.dist ?? 0) / (table[tier].stride * s / 0.6) : time * 0.8;
  const pc = ((travelled % 1) + 1) % 1;
  const cycle = table[tier].stride / table[tier].speed;
  // (While an act's face is on, the limbs step at half the rate: the face is what's being drawn new.)
  const N0 = kind === 'swim' ? 32 : Math.max(16, Math.min(32, Math.round((cycle * 30) / 4) * 4));
  const N = st.act && kind !== 'swim' ? N0 / 2 : N0;
  const phase = moving ? Math.floor(pc * N) / N : 0;
  const poseAt = (ph) => (kind === 'swim' ? swimPose(tier, ph) : kind === 'fly' ? flyPose(tier, ph) : gaitPose(tier, ph));
  const target = moving ? poseAt(phase) : standPose(g, time);
  const live = moving ? poseAt(pc) : target;
  // Springs only carry it from one way of moving to the next (a third of a second); once there it
  // runs on its fixed frames exactly, so every drawing comes round again.
  const mode = moving ? `${kind}${tier}` : 'stand';
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
  const blink = moving ? null : eyesAt(g, tl);
  const rig = {
    tx: 0, by: q(P.bob), hx: q(P.hx), hy: q(P.hy), tilt: Math.round(P.tilt / 2) * 2, lift: liftNow, squat: Math.round(P.squat),
    backArm: [q(P.back[0]), q(P.back[1])], frontArm: [q(P.front[0]), q(P.front[1])], armSide: moving ? 0.35 : 0.6, hipIn: moving ? 0.6 : 0,
    frontLeg: [q(P.legF[0]), q(P.legF[1]), q3(P.legF[2])], backLeg: [q(P.legB[0]), q(P.legB[1]), q3(P.legB[2])],
    air: target.lift > 1.5, hair: Math.round(P.hair * 2) / 2, hairTip: Math.round(P.hair * 2.4) / 2,
    eyes: target.eyes ?? blink ?? 'open',
    face: { brows: target.brows ?? REST.brows, extra: [], blush: target.blush ?? REST.blush, glance: target.glance ?? (moving ? 0 : glanceAt(g, tl)), look: target.look },
  };
  // Running, its tier's face, and now and then an act over it.
  let mouth = target.mouth;
  let sprout = null;
  if (moving) {
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
  const mood = m.mood ?? sprout ?? (moving && tier >= 3 ? 'excited' : null);
  let look = lookOf(g, mood, time * 0.1);
  if (mouth) look = { ...look, mouth };
  const lean = leanNow;
  // A soft shadow under the feet, smaller the higher it is (none in the water).
  if (kind !== 'swim') {
    ctx.fillStyle = 'rgba(70,40,90,0.16)';
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(2, 7 - liftNow * 0.22) * (s / 0.6), Math.max(0.8, 1.8 - liftNow * 0.04) * (s / 0.6), 0, 0, TAU);
    ctx.fill();
  }
  if (kind === 'run' && moving && tier >= 3) drawDust(ctx, x, y, dir, phase, GAITS[tier].stride * (s / 0.6), tier);
  if (kind === 'run' && moving && tier === 5) drawSpeedLines(ctx, x, y, dir, s, time);
  drawCoatBack(ctx, g, x, y, s, time);
  const tip = tipNow;
  // (A backstroke is drawn facing the other way, so tipped over its front faces the sky.)
  const opts = { scale: s, facing: target.flip ? -dir : dir, lean: Math.abs(lean) > 0.005 ? { tilt: lean, lift: tip } : null };
  // (A ninja dash leaves two fading after-images behind: the same drawing stamped again, nothing
  // painted afresh.)
  // (Swimming, it sits down in the water: its feet below the waterline at `y`.)
  // (Flying, it's drawn up at its height rather than lifted on its legs, so a loop turns round
  // its own middle.)
  const alt = kind === 'fly' ? liftNow : 0;
  if (alt) rig.lift = 0;
  const dy = kind === 'swim' ? (sinkNow + tip) * s : -alt * s;
  if (kind === 'run' && moving && tier === 5) {
    for (const [back, alpha] of [[26, 0.12], [13, 0.26]]) drawPosed(ctx, look, Math.round((x - dir * back * (s / 0.6)) * 2) / 2, Math.round((y + dy) * 2) / 2, rig, { ...opts, alpha });
  }
  drawPosed(ctx, look, Math.round(x * 2) / 2, Math.round((y + dy) * 2) / 2, rig, opts);
  if (kind === 'swim') drawWater(ctx, x, y, s, tier, pc, time, dir);
  drawCoat(ctx, g, x, y + dy, s, time);
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
