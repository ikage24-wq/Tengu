// The Mochi Show's acts (2026-11-15; data/mochi-show.js ACTS has the rules, render/mochi-show-props.js
// the props, render/show.js the stage's own sparkle): six turns a Mochi can do on the stage, each in
// three ways by how good it is at it - 0 wobbly (it tries its very best, and something goes a bit
// wrong, sweetly), 1 good, 2 dazzling (bigger, bolder, more of it, a finish to bring the house
// down). Keyed like every other act (render/mochi-anim.js ACTIONS: crisp and drawn at 48 a second),
// a little bounce in every beat, each the length data/mochi-show.js ACT_LEN gives it.
//
// Props are held with `hold` (and `alt`, which kind) and turned with `swing` (the near paw's) and
// `swing2` (the far paw's); `reveal` eases what a prop is doing (what's come out of the hat, how the
// ribbon flies, how plainly the mime's invisible wall shows).
//
// SHOW_FX: what the stage does along with each (render/show.js): the notes it sings, the drum's
// strokes, the puffs and bursts of the magic, the rose thrown from the audience.

const KEY = (t, o) => [t, o];
const C2 = [true, true];
const WORRY = [[0.5, -0.7], [0.5, -0.7]];
const SET = [[-0.4, 0.8], [-0.4, 0.8]];
const OUT = (y = -12) => ({ front: [10, y], back: [-10, y] });
const HIPS = { back: [-1.4, -1.4] };
const SAT = { squat: 3, bob: 3, legF: [3.4, -1.6, 40], legB: [2.2, -1.2, 30], front: [1, 1.5], back: [1.6, 1.5] };
const act = (dur, keys) => ({ dur, crisp: true, fps: 48, keys });
// (A hop: down into it, up, and down onto bent knees - every one with its landing.)
const hop = (t, h, pose = {}, land = {}) => [
  KEY(t, { ...pose, squat: 1.2, lift: 0, ease: 'in' }),
  KEY(t + 0.14, { ...pose, squat: 0, lift: h, ease: 'out' }),
  KEY(t + 0.28, { ...pose, ...land, lift: 0, squat: 1, ease: 'in' }),
  KEY(t + 0.38, { ...pose, ...land, squat: 0 }),
];
// (A spin on the spot, a little off the ground: turned away and back round, `n` half turns.)
const spin = (t, n, h, pose = {}) => {
  const out = [KEY(t, { ...pose, squat: 1.2, lift: 0, ease: 'in' })];
  for (let i = 1; i <= n; i++) out.push(KEY(t + i * 0.16, { ...pose, lift: h * Math.sin((i / (n + 1)) * Math.PI) + 0.8, squat: 0, turned: i % 2 === 1, ease: i === 1 ? 'out' : undefined }));
  out.push(KEY(t + (n + 1) * 0.16, { ...pose, lift: 0, squat: 1.2, turned: false, ease: 'in' }), KEY(t + (n + 1) * 0.16 + 0.12, { ...pose, squat: 0, turned: false }));
  return out;
};

// ---------- Singing: the star microphone ----------
const MIC = { hold: 'mic', front: [-2, -7], over: true, swing: -0.3 };
const MICLOW = { hold: 'mic', front: [3, -4], swing: 0.15 };
const MICHIGH = { hold: 'mic', front: [4, -14], over: true, swing: 0.35 };
const sing0 = act(4.4, [
  KEY(0, {}),
  // Out it comes, nervous: a glance at the judges, a bead of sweat.
  KEY(0.2, { ...MICLOW, glance: 1, brows: WORRY, mouth: 'tiny', extra: ['sweat0'] }),
  KEY(0.45, { ...MIC, brows: WORRY, mouth: 'tiny', squat: 0.6, glance: 1 }),
  // A big breath in...
  KEY(0.7, { ...MIC, lift: 0.8, mouth: 'mochio', tilt: -4, ease: 'out' }),
  KEY(0.86, { ...MIC, lift: 0, mouth: 'mochio', tilt: -3, ease: 'in' }),
  // ...and it sings, sweetly enough.
  KEY(1.05, { ...MIC, mouth: 'o', closed: C2, tilt: 4, hx: 0.3, extra: ['note'] }),
  KEY(1.45, { ...MIC, mouth: 'mochio', closed: C2, tilt: -3, hx: -0.3, extra: ['note'] }),
  // Reaching for the high note...
  KEY(1.72, { ...MIC, mouth: 'o', tilt: -7, lift: 0.6, extra: ['note'], ease: 'out' }),
  // ...and its voice cracks! A jolt, eyes wide.
  KEY(1.9, { ...MIC, wide: true, mouth: 'gasp', lift: 2.4, tilt: 8, hx: 0.5, brows: WORRY, extra: ['bang1'], ease: 'out' }),
  KEY(2.06, { ...MIC, wide: true, mouth: 'mochiwave', lift: 0, squat: 1.2, tilt: 6, extra: ['sweat1'], ease: 'in' }),
  // So embarrassed: the mic drops to its tummy, it blushes and looks away.
  KEY(2.3, { ...MICLOW, mouth: 'mochiwave', blush: 2, look: 'down', squat: 0.4, tilt: 5, extra: ['sweat1'] }),
  // It tries again, very softly.
  KEY(2.7, { ...MIC, mouth: 'tiny', closed: C2, blush: 1.9, tilt: 3, extra: ['note'] }),
  KEY(3.05, { ...MIC, mouth: 'mochio', closed: C2, blush: 1.9, tilt: -3, extra: ['note'] }),
  KEY(3.4, { ...MIC, mouth: 'tiny', closed: C2, blush: 1.9, tilt: 3 }),
  // A shy little smile to finish, and a tiny relieved bounce.
  KEY(3.75, { ...MICLOW, mouth: 'mochiw', blush: 1.9, glance: 1, squat: 0.6, extra: ['sweat0'] }),
  KEY(3.95, { ...MICLOW, mouth: 'mochiw', blush: 1.9, lift: 0.9, closed: C2, ease: 'out' }),
  KEY(4.1, { ...MICLOW, mouth: 'mochiw', blush: 1.9, lift: 0, squat: 0.5, closed: C2, ease: 'in' }),
  KEY(4.25, { ...MICLOW, mouth: 'mochiw', blush: 1.8, squat: 0 }),
  KEY(4.4, { hold: null }),
]);
// (Swaying to the beat: one way, the other with a lift, eyes shut, the free paw out.)
const SWAY_A = { ...MIC, mouth: 'o', closed: C2, tilt: 7, hx: 0.6, back: [-6, -8], extra: ['note'] };
const SWAY_B = { ...MIC, mouth: 'mochiopen', closed: C2, tilt: -7, hx: -0.6, back: [-7, -11], extra: ['note'] };
const sing1 = act(4.6, [
  KEY(0, {}),
  KEY(0.18, { ...MIC, lift: 1.2, mouth: 'mochiw', glance: 1, sprout: 'happy', ease: 'out' }),
  KEY(0.34, { ...MIC, lift: 0, squat: 0.8, mouth: 'mochiw', ease: 'in' }),
  KEY(0.6, { ...SWAY_A, squat: 0 }),
  KEY(1.0, { ...SWAY_B, lift: 0.9, ease: 'out' }),
  KEY(1.4, { ...SWAY_A, lift: 0, ease: 'in' }),
  KEY(1.8, { ...SWAY_B, lift: 0.9, ease: 'out' }),
  KEY(2.2, { ...SWAY_A, lift: 0, ease: 'in' }),
  // The big note: leaning back into it, the free paw flung out, held with a wobble.
  KEY(2.6, { ...MIC, tilt: -11, back: [-10, -13], mouth: 'mochiopen', closed: C2, lift: 0.6, extra: ['note', 'spark0'], ease: 'out' }),
  KEY(3.0, { ...MIC, tilt: -9, back: [-10, -12], mouth: 'mochiopen', closed: C2, extra: ['note', 'spark1'] }),
  KEY(3.3, { ...MIC, tilt: -12, back: [-10, -13], mouth: 'o', closed: C2, extra: ['note', 'spark0'] }),
  // Done: mic down, paw up to the audience, a happy hop.
  KEY(3.6, { ...MICLOW, back: [-10, -12], mouth: 'D', closed: C2, sprout: 'excited', extra: ['spark0'] }),
  ...hop(3.75, 1.8, { ...MICLOW, back: [-10, -12], mouth: 'D', closed: C2, sprout: 'excited' }),
  KEY(4.3, { ...MICLOW, mouth: 'D', closed: C2 }),
  KEY(4.6, { hold: null }),
]);
const sing2 = act(4.8, [
  KEY(0, {}),
  // A power ballad: it starts low and soft, a paw on its heart...
  KEY(0.2, { ...MIC, squat: 2.2, tilt: 10, hy: 1, closed: C2, mouth: 'mochio', back: [3, -4] }),
  KEY(0.65, { ...MIC, squat: 1.2, tilt: 5, closed: C2, mouth: 'o', back: [3, -5], extra: ['note'] }),
  // ...rising with the song, the free paw opening out...
  KEY(1.05, { ...MIC, squat: 0, tilt: -4, closed: C2, mouth: 'mochiopen', back: [-8, -9], extra: ['note'] }),
  KEY(1.45, { ...MIC, tilt: 6, hx: 0.5, closed: C2, mouth: 'o', back: [-6, -12], lift: 0.8, extra: ['note'], ease: 'out' }),
  KEY(1.75, { ...MIC, tilt: 2, lift: 0, mouth: 'mochiopen', closed: C2, back: [-8, -10], ease: 'in' }),
  // ...the key change: up into a spin...
  ...spin(1.9, 3, 5, { ...MIC, back: [-10, -10], mouth: 'D', closed: C2, extra: ['spark0'] }),
  // ...and the big note, leaning right back, both arms wide, sparkling.
  KEY(2.75, { ...MIC, tilt: -13, hy: -0.4, back: [-10, -14], mouth: 'mochiopen', closed: C2, lift: 0.6, extra: ['note', 'spark0', 'spark1'], ease: 'out' }),
  KEY(3.1, { ...MIC, tilt: -11, back: [-10, -13], mouth: 'mochiopen', closed: C2, extra: ['note', 'spark1'] }),
  KEY(3.4, { ...MIC, tilt: -14, back: [-10, -14], mouth: 'o', closed: C2, extra: ['note', 'spark0'] }),
  // The finish: the mic flung up high, a jump, and a pose.
  KEY(3.75, { ...MICHIGH, back: [-10, -12], mouth: 'D', closed: C2, squat: 1.4, ease: 'in' }),
  KEY(3.92, { ...MICHIGH, back: [-10, -14], mouth: 'D', closed: C2, lift: 3, sprout: 'excited', extra: ['spark0', 'spark1'], ease: 'out' }),
  KEY(4.08, { ...MICHIGH, back: [-10, -13], mouth: 'D', closed: C2, lift: 0, squat: 1.4, ease: 'in' }),
  KEY(4.22, { ...MICHIGH, back: [-10, -12], mouth: 'D', closed: C2, squat: 0, sprout: 'excited', extra: ['spark1'] }),
  KEY(4.6, { ...MICHIGH, back: [-10, -12], mouth: 'D', closed: [false, true], sprout: 'excited', extra: ['spark0'] }),
  KEY(4.8, { hold: null }),
]);

// ---------- The taiko drum ----------
// (Its sticks at rest; each raised; each striking the drum's head ahead of it.)
const STICKS = { hold: 'bachi', front: [6, -7], back: [5, -7], swing: 0.2, swing2: 0.2 };
const UP = { F: { front: [4, -12], swing: -0.5 }, B: { back: [3, -12], swing2: -0.5 } };
const HIT = { F: { front: [10, -5], swing: 1.35 }, B: { back: [9, -5], swing2: 1.35 } };
UP.FB = { ...UP.F, ...UP.B };
HIT.FB = { ...HIT.F, ...HIT.B };
// (A stroke at `t`: up a beat before, then down onto the head. `up` and `hit`, its face and body.)
const stroke = (t, side, up = {}, hit = {}, prep = 0.13) => [
  KEY(t - prep, { ...STICKS, ...UP[side], lift: 0.7, ...up, ease: 'out' }),
  KEY(t, { ...STICKS, ...HIT[side], squat: 0.6, lift: 0, ...hit, ease: 'in' }),
];
// (A drum roll: quick little strokes, each stick in turn.)
const roll = (t0, t1, face) => {
  const out = [];
  let side = 'F';
  for (let t = t0; t < t1 - 0.01; t += 0.1) {
    out.push(KEY(t, { ...STICKS, front: side === 'F' ? [9, -6] : [7, -8], back: side === 'B' ? [8, -6] : [6, -8], swing: side === 'F' ? 1.15 : 0.55, swing2: side === 'B' ? 1.15 : 0.55, hx: side === 'F' ? 0.3 : -0.3, ...face }));
    side = side === 'F' ? 'B' : 'F';
  }
  return out;
};
const drum0 = act(4.4, [
  KEY(0, {}),
  KEY(0.25, { ...STICKS, glance: 1, brows: WORRY, mouth: 'tiny' }),
  // Two timid taps...
  ...stroke(0.5, 'F', { mouth: 'tiny', brows: WORRY, lift: 0.3 }, { mouth: 'mochio', front: [9, -6], swing: 1.15 }),
  KEY(0.68, { ...STICKS, mouth: 'tiny', brows: WORRY }),
  ...stroke(0.9, 'B', { mouth: 'tiny', brows: WORRY, lift: 0.3 }, { mouth: 'mochio', back: [8, -6], swing2: 1.15 }),
  // ...then it winds right up for a big one...
  KEY(1.12, { ...STICKS, mouth: 'mochio' }),
  KEY(1.42, { ...STICKS, ...UP.FB, front: [3, -14], back: [2, -14], over: true, swing: -0.6, swing2: -0.6, squat: 0.6, closed: C2, mouth: 'grit' }),
  KEY(1.6, { ...STICKS, ...HIT.FB, squat: 1.2, lean: 0.1, mouth: 'D', closed: C2, ease: 'in' }),
  // ...BOOM - and jumps a mile at its own noise!
  KEY(1.76, { ...STICKS, front: [2, -11], back: [-2, -11], over: true, swing: -0.9, swing2: -0.9, lift: 3.2, tilt: -8, wide: true, mouth: 'gasp', extra: ['bang1'], ease: 'out' }),
  KEY(1.95, { ...STICKS, front: [3, -8], back: [1, -8], swing: -0.3, swing2: -0.3, lift: 0, squat: 1.6, wide: true, mouth: 'mochiwave', extra: ['sweat1'], ease: 'in' }),
  KEY(2.15, { ...STICKS, front: [5, -4], back: [4, -4], swing: 0.5, swing2: 0.5, squat: 0.3, mouth: 'mochiwave', extra: ['sweat1'] }),
  // A sheepish look at the audience...
  KEY(2.4, { ...STICKS, front: [5, -3], back: [4, -3], swing: 0.6, swing2: 0.6, blush: 1.9, glance: 1, mouth: 'mochiw', extra: ['sweat0'] }),
  // ...and on it goes, very carefully.
  ...stroke(2.75, 'F', { mouth: 'tiny', blush: 1.8, lift: 0.3 }, { mouth: 'mochiw', blush: 1.8, front: [9, -6], swing: 1.1 }),
  ...stroke(3.1, 'B', { mouth: 'tiny', blush: 1.8, lift: 0.3 }, { mouth: 'mochiw', blush: 1.8, back: [8, -6], swing2: 1.1 }),
  ...stroke(3.45, 'F', { mouth: 'tiny', blush: 1.8, lift: 0.3 }, { mouth: 'mochiw', blush: 1.8, front: [9, -6], swing: 1.1 }),
  ...stroke(3.62, 'B', { mouth: 'tiny', blush: 1.8, lift: 0.2 }, { mouth: 'mochiw', blush: 1.8, back: [8, -6], swing2: 1.1 }, 0.08),
  // Done: sticks held together, a shy smile.
  KEY(3.9, { ...STICKS, front: [5, -10], back: [4, -10], swing: 0.05, swing2: -0.05, mouth: 'mochiw', blush: 1.9, closed: C2, extra: ['sweat0'] }),
  KEY(4.4, { hold: null }),
]);
const GO = { mouth: 'D', closed: C2 };
const drum1 = act(4.6, [
  KEY(0, {}),
  KEY(0.2, { ...STICKS, lift: 1, mouth: 'mochiw', glance: 1, sprout: 'happy', ease: 'out' }),
  KEY(0.36, { ...STICKS, squat: 0.8, mouth: 'mochiw', ease: 'in' }),
  // A good steady beat, a stick at a time, bouncing along with it.
  ...stroke(0.6, 'F', { mouth: 'mochio' }, GO),
  ...stroke(0.9, 'B', { mouth: 'mochio' }, GO),
  ...stroke(1.2, 'F', { mouth: 'mochio' }, GO),
  ...stroke(1.5, 'B', { mouth: 'mochio' }, GO),
  ...stroke(1.8, 'F', { mouth: 'mochio', tilt: -4 }, { ...GO, tilt: 4 }),
  ...stroke(2.1, 'B', { mouth: 'mochio', tilt: 4 }, { ...GO, tilt: -4 }),
  // A drum roll, brows set...
  ...roll(2.3, 2.9, { brows: SET, mouth: 'grit', squat: 0.5 }),
  // ...and both sticks up and down together, BOOM.
  KEY(3.1, { ...STICKS, front: [3, -14], back: [2, -14], over: true, swing: -0.6, swing2: -0.6, lift: 1.4, mouth: 'mochio', ease: 'out' }),
  KEY(3.3, { ...STICKS, ...HIT.FB, squat: 1.2, lean: 0.08, mouth: 'D', closed: C2, extra: ['spark0'], ease: 'in' }),
  KEY(3.5, { ...STICKS, ...HIT.FB, lift: 0.6, squat: 0, lean: 0, mouth: 'D', closed: C2, ease: 'out' }),
  // Sticks crossed up high, and a hop.
  KEY(3.7, { ...STICKS, front: [5, -13], back: [3, -13], over: true, swing: 0.5, swing2: -0.5, lift: 0, mouth: 'D', closed: C2, sprout: 'excited', extra: ['spark1'] }),
  ...hop(3.85, 1.6, { ...STICKS, front: [5, -13], back: [3, -13], over: true, swing: 0.5, swing2: -0.5, mouth: 'D', closed: C2, sprout: 'excited' }),
  KEY(4.6, { hold: null }),
]);
const BIG = { mouth: 'grit', brows: SET };
const drum2 = act(4.8, [
  KEY(0, {}),
  // A wide stance, sticks high behind its head, eyes blazing.
  KEY(0.2, { ...STICKS, front: [3, -14], back: [2, -14], over: true, swing: -0.8, swing2: -0.8, squat: 1, legF: [2.4, -0.4, 16], legB: [-2.2, 0, -14], ...BIG }),
  // Great sweeping strokes, the whole body in each.
  ...stroke(0.5, 'F', { ...BIG, lean: -0.08 }, { ...BIG, mouth: 'yell', lean: 0.12, squat: 1.2 }, 0.16),
  ...stroke(0.78, 'B', { ...BIG, lean: -0.08 }, { ...BIG, mouth: 'yell', lean: 0.12, squat: 1.2 }, 0.16),
  ...stroke(1.06, 'F', { ...BIG, lean: -0.08 }, { ...BIG, mouth: 'yell', lean: 0.12, squat: 1.2 }, 0.16),
  ...stroke(1.34, 'B', { ...BIG, lean: -0.08 }, { ...BIG, mouth: 'yell', lean: 0.12, squat: 1.2 }, 0.16),
  // A spin, sticks out...
  ...spin(1.4, 3, 4.5, { ...STICKS, front: [9, -10], back: [-8, -10], swing: 0.9, swing2: -0.9, mouth: 'D', closed: C2, extra: ['spark0'] }),
  // ...straight into a double stroke.
  ...stroke(2.3, 'FB', { ...BIG, lift: 1.2 }, { mouth: 'yell', squat: 1.4, lean: 0.12, extra: ['spark1'] }, 0.12),
  // A thunder of a roll...
  ...roll(2.42, 3.02, { ...BIG, squat: 0.8, extra: ['sweat0'] }),
  // ...then up in a great leap, both sticks high, and down with everything it's got.
  KEY(3.08, { ...STICKS, front: [5, -10], back: [4, -10], swing: -0.2, swing2: -0.2, squat: 2, ...BIG, ease: 'in' }),
  KEY(3.26, { ...STICKS, front: [3, -15], back: [2, -15], over: true, swing: -1.0, swing2: -1.0, lift: 8, ...BIG, mouth: 'yell', ease: 'out' }),
  KEY(3.38, { ...STICKS, front: [4, -15], back: [3, -15], over: true, swing: -0.9, swing2: -0.9, lift: 8.4, ...BIG, mouth: 'yell' }),
  KEY(3.54, { ...STICKS, ...HIT.FB, lift: 0, squat: 2, lean: 0.16, mouth: 'D', closed: C2, extra: ['bang1', 'spark0'], ease: 'in' }),
  KEY(3.68, { ...STICKS, ...HIT.FB, lift: 1, squat: 0, lean: 0.04, mouth: 'D', closed: C2, ease: 'out' }),
  KEY(3.82, { ...STICKS, front: [7, -8], back: [6, -8], swing: 0.6, swing2: 0.6, lift: 0, squat: 0.6, mouth: 'D', closed: C2, ease: 'in' }),
  // The finish: a stick pointed out at the audience, the other on its hip, a grin.
  KEY(4.02, { ...STICKS, front: [11, -11], swing: 1.0, ...HIPS, swing2: 0.3, squat: 0, mouth: 'grin', sprout: 'excited', extra: ['spark0', 'spark1'] }),
  KEY(4.5, { ...STICKS, front: [11, -11], swing: 1.0, ...HIPS, swing2: 0.3, mouth: 'grin', closed: [false, true], sprout: 'excited', extra: ['spark1'] }),
  KEY(4.8, { hold: null }),
]);

// ---------- Dancing ----------
const STEP_R = { hx: 1.4, tilt: -7, legF: [1.8, -1.6, 22], front: [8, -10], back: [-7, -6], mouth: 'D' };
const STEP_L = { hx: -1.4, tilt: 7, legB: [-1.8, -1.6, -22], front: [7, -6], back: [-8, -10], mouth: 'D' };
const CLAP = { hx: 0, tilt: 0, front: [-3, -9], back: [6, -9], over: true, closed: C2, mouth: 'D' };
const dance0 = act(4.4, [
  KEY(0, {}),
  KEY(0.2, { front: [3, -5], back: [2, -5], glance: 1, brows: WORRY, mouth: 'tiny' }),
  // Step-touch... a little late each time.
  KEY(0.45, { ...STEP_R, mouth: 'mochio', lift: 0.6, ease: 'out' }),
  KEY(0.72, { ...STEP_L, mouth: 'mochio', lift: 0, ease: 'in' }),
  KEY(1.0, { ...STEP_R, mouth: 'mochio', lift: 0.6, ease: 'out' }),
  // Which arm was it? Muddled.
  KEY(1.25, { front: [-2, -12], back: [8, -6], over: true, tilt: 6, mouth: 'mochiwave', glance: -1, extra: ['q'], lift: 0 }),
  // Trips over its own feet - arms going like windmills - and just catches itself.
  KEY(1.5, { lean: 0.3, lift: 1.2, front: [9, -10], back: [-6, -6], legB: [2.8, -1.4, 25], wide: true, mouth: 'gasp', extra: ['bang1'], ease: 'out' }),
  KEY(1.64, { lean: 0.22, lift: 0.4, front: [6, -14], back: [-9, -3], over: true, wide: true, mouth: 'mochio', extra: ['sweat1'] }),
  KEY(1.78, { lean: 0.12, lift: 0, front: [-2, -4], back: [-8, -12], wide: true, mouth: 'mochio', extra: ['sweat1'], ease: 'in' }),
  KEY(1.95, { lean: 0, squat: 1.2, front: [4, -6], back: [3, -6], mouth: 'mochiwave' }),
  KEY(2.2, { squat: 0, front: [3, -4], back: [2, -4], blush: 2, mouth: 'mochiw', glance: 1, extra: ['sweat0'] }),
  // It shakes it off and tries again, slower, smiling.
  KEY(2.5, { ...STEP_R, mouth: 'mochiw', blush: 1.8, lift: 0.6, ease: 'out' }),
  KEY(2.85, { ...STEP_L, mouth: 'mochiw', blush: 1.8, lift: 0, ease: 'in' }),
  KEY(3.2, { ...STEP_R, mouth: 'mochiw', blush: 1.8, lift: 0.8, ease: 'out' }),
  // A little twirl - a wobbly landing...
  KEY(3.45, { squat: 1, lift: 0, front: [4, -6], back: [3, -6], mouth: 'mochio', ease: 'in' }),
  KEY(3.6, { lift: 1.4, turned: true, ...OUT(-8), mouth: 'mochio', closed: C2, ease: 'out' }),
  KEY(3.76, { lift: 0.8, turned: false, ...OUT(-8), mouth: 'mochio', closed: C2 }),
  KEY(3.9, { lift: 0, squat: 1, tilt: 10, hx: 0.6, front: [7, -4], back: [-4, -10], mouth: 'mochiwave', ease: 'in' }),
  // ...and shy jazz hands.
  KEY(4.08, { squat: 0, tilt: 0, hx: 0, front: [7, -11], back: [-6, -11], mouth: 'mochiw', blush: 1.9, closed: C2 }),
  KEY(4.4, {}),
]);
const dance1 = act(4.6, [
  KEY(0, {}),
  KEY(0.15, { front: [5, -9], back: [-5, -9], lift: 1, mouth: 'D', closed: C2, sprout: 'happy', ease: 'out' }),
  KEY(0.3, { front: [5, -9], back: [-5, -9], lift: 0, squat: 0.8, ease: 'in' }),
  // Bouncy step-touch, a clap on every touch.
  KEY(0.55, { ...STEP_R, squat: 0, lift: 0.8, ease: 'out' }),
  KEY(0.7, { ...CLAP, lift: 0, squat: 0.6, extra: ['spark0'], ease: 'in' }),
  KEY(0.85, { ...STEP_L, squat: 0, lift: 0.8, ease: 'out' }),
  KEY(1.0, { ...CLAP, lift: 0, squat: 0.6, extra: ['spark1'], ease: 'in' }),
  KEY(1.15, { ...STEP_R, squat: 0, lift: 0.8, ease: 'out' }),
  KEY(1.3, { ...CLAP, lift: 0, squat: 0.6, extra: ['spark0'], ease: 'in' }),
  KEY(1.45, { ...STEP_L, squat: 0, lift: 0.8, ease: 'out' }),
  KEY(1.6, { ...CLAP, lift: 0, squat: 0.6, extra: ['spark1'], ease: 'in' }),
  // A hip sway, arms waving overhead.
  KEY(1.85, { front: [7, -15], back: [-6, -13], over: true, tilt: 8, hx: 0.6, squat: 0, mouth: 'D', closed: C2 }),
  KEY(2.05, { front: [5, -16], back: [-7, -12], over: true, tilt: -8, hx: -0.6, mouth: 'D', closed: C2 }),
  KEY(2.25, { front: [7, -15], back: [-6, -13], over: true, tilt: 8, hx: 0.6, mouth: 'D', closed: C2 }),
  // A spin...
  ...spin(2.42, 3, 3.4, { ...OUT(-9), mouth: 'D', closed: C2, extra: ['spark0'] }),
  // ...a hop with its arms up...
  ...hop(3.2, 4.5, { front: [6, -17], back: [-5, -15], over: true, mouth: 'D', closed: C2, extra: ['spark1'] }, { extra: [] }),
  // ...and a pose: an arm up, a paw on its hip, a wink.
  KEY(3.75, { front: [6, -16], over: true, ...HIPS, tilt: -6, mouth: 'D', closed: [false, true], sprout: 'excited', extra: ['spark0'] }),
  KEY(4.3, { front: [6, -16], over: true, ...HIPS, tilt: -5, mouth: 'D', closed: [false, true], sprout: 'excited' }),
  KEY(4.6, {}),
]);
const RIB = { hold: 'ribbon' };
const dance2 = act(4.8, [
  KEY(0, {}),
  KEY(0.15, { ...RIB, front: [6, -8], swing: 0.4, reveal: 0, mouth: 'mochiw', glance: 1 }),
  // The ribbon swung up and round in great loops, the body swaying with it.
  KEY(0.4, { ...RIB, front: [8, -14], over: true, swing: 0.9, reveal: 0.8, tilt: -6, mouth: 'D', closed: C2, lift: 1, ease: 'out' }),
  KEY(0.65, { ...RIB, front: [2, -16], over: true, swing: -0.5, reveal: 1, tilt: 6, lift: 0, ease: 'in' }),
  KEY(0.9, { ...RIB, front: [-3, -10], over: true, swing: -1.2, reveal: 1, tilt: 4, squat: 0.6 }),
  KEY(1.15, { ...RIB, front: [8, -12], swing: 1.2, reveal: 1, tilt: -6, squat: 0 }),
  // A leap, legs split, ribbon streaming...
  KEY(1.35, { ...RIB, front: [7, -9], swing: 0.9, reveal: 1, squat: 1.6, mouth: 'mochio', ease: 'in' }),
  KEY(1.55, { ...RIB, front: [10, -14], over: true, back: [-9, -10], swing: 0.6, reveal: 1, lift: 6, legF: [2.4, -2.6, 40], legB: [-2.6, -0.6, -70], mouth: 'D', closed: C2, extra: ['spark0'], ease: 'out' }),
  KEY(1.72, { ...RIB, front: [10, -14], over: true, back: [-9, -10], swing: 0.7, reveal: 1, lift: 6.4, legF: [2.4, -2.6, 40], legB: [-2.6, -0.6, -70], mouth: 'D', closed: C2 }),
  KEY(1.9, { ...RIB, front: [8, -10], back: [-6, -8], swing: 1.0, reveal: 1, lift: 0, squat: 1.4, mouth: 'D', ease: 'in' }),
  KEY(2.04, { ...RIB, front: [8, -10], back: [-6, -8], swing: 1.0, reveal: 1, squat: 0, mouth: 'D' }),
  // ...a double spin...
  ...spin(2.06, 4, 2.6, { ...RIB, front: [9, -11], back: [-9, -11], swing: 1.2, reveal: 1, mouth: 'D', closed: C2 }),
  // ...the ribbon spun in a spiral over its head...
  KEY(3.06, { ...RIB, front: [3, -17], over: true, swing: 0, reveal: 1.7, mouth: 'o', closed: C2, extra: ['spark0'] }),
  KEY(3.35, { ...RIB, front: [3, -17], over: true, swing: 0.1, reveal: 2, mouth: 'o', closed: C2, lift: 0.8, extra: ['spark1'], ease: 'out' }),
  KEY(3.55, { ...RIB, front: [4, -16], over: true, swing: 0.2, reveal: 2, mouth: 'D', closed: C2, lift: 0, ease: 'in' }),
  // ...and down into a curtsey, the ribbon floating down round it.
  KEY(3.85, { ...RIB, front: [10, -8], back: [-9, -12], swing: 1.3, reveal: 0.6, squat: 2.2, legF: [2.6, -0.4, 16], tilt: -6, mouth: 'D', closed: C2, sprout: 'excited', extra: ['spark0', 'spark1'] }),
  KEY(4.5, { ...RIB, front: [10, -8], back: [-9, -12], swing: 1.3, reveal: 0.3, squat: 2, legF: [2.6, -0.4, 16], tilt: -6, mouth: 'D', closed: [false, true], sprout: 'excited' }),
  KEY(4.8, { hold: null }),
]);

// ---------- Acting ----------
const SCRIPT = { hold: 'script', front: [5, -6], back: [4, -6] };
const MASK = { hold: 'mask', front: [-3, -9], over: true, swing: 0 };
const ORATE = { front: [3, -4], back: [-8, -13], tilt: -8 };
const act0 = act(4.4, [
  KEY(0, {}),
  KEY(0.2, { ...SCRIPT, look: 'down', mouth: 'mochio' }),
  // It begins grandly...
  KEY(0.55, { hold: 'script', ...ORATE, mouth: 'ah', closed: C2 }),
  KEY(0.95, { hold: 'script', ...ORATE, tilt: -6, back: [-9, -12], mouth: 'o', closed: C2 }),
  // ...and forgets its line. Frozen.
  KEY(1.3, { hold: 'script', ...ORATE, back: [-8, -12], tilt: -4, wide: true, mouth: 'mochio', extra: ['dots3'] }),
  // Back to the script, frantic, flipping through it.
  KEY(1.8, { ...SCRIPT, look: 'down', brows: WORRY, mouth: 'mochiwave', hy: 0.6, extra: ['sweat1'] }),
  KEY(2.05, { ...SCRIPT, front: [6, -7], back: [5, -5], look: 'down', brows: WORRY, tilt: 4, mouth: 'mochiwave', extra: ['sweat1'] }),
  KEY(2.3, { ...SCRIPT, front: [4, -5], back: [5, -7], look: 'down', brows: WORRY, tilt: -4, mouth: 'mochiwave', extra: ['sweat1'] }),
  // Found it!
  KEY(2.55, { ...SCRIPT, squat: 1, look: 'down', mouth: 'mochio', ease: 'in' }),
  KEY(2.7, { ...SCRIPT, lift: 1.4, sprout: 'excited', mouth: 'o', extra: ['bang0'], ease: 'out' }),
  KEY(2.84, { ...SCRIPT, lift: 0, squat: 0.6, mouth: 'o', ease: 'in' }),
  // The line, in a rush.
  KEY(3.0, { hold: 'script', ...ORATE, tilt: -6, squat: 0, mouth: 'ah', closed: C2 }),
  KEY(3.3, { hold: 'script', ...ORATE, tilt: -4, mouth: 'D', closed: C2 }),
  // A wobbly bow, blushing.
  KEY(3.6, { ...SCRIPT, lean: 0.42, tilt: -6, closed: C2, mouth: 'mochiw', blush: 2 }),
  KEY(3.95, { ...SCRIPT, lean: 0, closed: C2, mouth: 'mochiw', blush: 2, extra: ['sweat0'] }),
  KEY(4.4, { hold: null }),
]);
const act1 = act(4.6, [
  KEY(0, {}),
  // Up comes the happy mask - it laughs and laughs.
  KEY(0.2, { ...MASK, alt: 'happy', lift: 1, ease: 'out' }),
  KEY(0.35, { ...MASK, alt: 'happy', lift: 0, squat: 0.6, ease: 'in' }),
  KEY(0.55, { ...MASK, alt: 'happy', tilt: -8, back: [-7, -10], lift: 1.2, squat: 0, ease: 'out' }),
  KEY(0.75, { ...MASK, alt: 'happy', tilt: 6, back: [-4, -6], lift: 0, ease: 'in' }),
  KEY(0.95, { ...MASK, alt: 'happy', tilt: -8, back: [-7, -10], lift: 1.2, ease: 'out' }),
  KEY(1.15, { ...MASK, alt: 'happy', tilt: 4, back: [-4, -6], lift: 0, ease: 'in' }),
  // Down it goes - and up comes the sad one.
  KEY(1.38, { hold: 'mask', alt: 'happy', front: [5, -3], swing: 0.4, mouth: 'mochio', tilt: 0 }),
  KEY(1.52, { hold: 'mask', alt: 'sad', front: [5, -3], swing: 0.4, mouth: 'mochio' }),
  KEY(1.7, { ...MASK, alt: 'sad', tilt: 10, hy: 1.2, back: [-1, -3], squat: 0.8 }),
  // Sobbing, shoulders shaking.
  KEY(1.95, { ...MASK, alt: 'sad', tilt: 12, hy: 1.2, hx: 0.4, back: [0, -4], squat: 0.8 }),
  KEY(2.15, { ...MASK, alt: 'sad', tilt: 8, hy: 1.2, hx: -0.4, back: [-1, -3], squat: 0.8 }),
  KEY(2.35, { ...MASK, alt: 'sad', tilt: 12, hy: 1.2, hx: 0.4, back: [0, -4], squat: 0.8 }),
  // The mask down: the back of a paw to its brow, a great swoon.
  KEY(2.6, { hold: null, front: [2, -14], over: true, back: [-8, -10], tilt: -10, squat: 0, mouth: 'sob', closed: C2, extra: ['tear0'] }),
  KEY(2.95, { front: [2, -14], over: true, back: [-9, -9], tilt: -13, hx: -0.5, squat: 0.6, mouth: 'sob', closed: C2, extra: ['tear0'] }),
  // And it's all right after all! A jump for joy.
  KEY(3.25, { front: [4, -6], back: [3, -6], tilt: 0, hx: 0, squat: 0, wide: true, mouth: 'mochio', sprout: 'excited' }),
  ...hop(3.32, 2.4, { ...OUT(-12), mouth: 'D', closed: C2, extra: ['spark0'] }),
  KEY(3.85, { front: [9, -10], back: [-8, -10], mouth: 'D', closed: C2, sprout: 'excited', extra: ['hearts'] }),
  KEY(4.4, { front: [9, -10], back: [-8, -10], mouth: 'D', closed: C2, sprout: 'excited', extra: ['hearts'] }),
  KEY(4.6, {}),
]);
// (Laid on its back for the faint, as a fall lays it on its front: turned a quarter, tipped, set
// down so it's on the boards - measured, render/show.js tests.)
const BACK = { lean: -Math.PI / 2, tip: 6, sink: 15.65 };
const act2 = act(4.8, [
  KEY(0, {}),
  // The sad mask: weeping its heart out...
  KEY(0.2, { ...MASK, alt: 'sad', tilt: 8, hy: 1, squat: 0.6, back: [2, -5] }),
  KEY(0.48, { ...MASK, alt: 'sad', tilt: 11, hy: 1, hx: 0.4, squat: 0.6, back: [2, -5] }),
  KEY(0.74, { ...MASK, alt: 'sad', tilt: 8, hy: 1, hx: -0.4, squat: 0.6, back: [2, -5] }),
  // ...it flings the mask away...
  KEY(0.98, { hold: null, front: [10, -14], over: true, back: [-4, -6], tilt: -6, squat: 0, mouth: 'gasp', wide: true, extra: ['spark0'] }),
  // ...and speaks from the heart: a paw on its chest, the other reaching for the stars.
  KEY(1.25, { front: [-3, -6], back: [-8, -14], tilt: -10, mouth: 'ah', closed: C2 }),
  KEY(1.6, { front: [-3, -6], back: [-9, -14], tilt: -8, hx: 0.8, mouth: 'o', closed: C2 }),
  KEY(1.95, { front: [-3, -6], back: [-9, -15], tilt: -12, hx: 0.8, mouth: 'mochiopen', closed: C2, extra: ['tear0', 'spark0'] }),
  // Overcome - the back of a paw to its brow - it faints right away...
  KEY(2.25, { front: [2, -14], over: true, back: [-8, -8], tilt: -14, hx: 0.4, squat: 1, closed: C2, mouth: 'mochio' }),
  // (Laid back on the lying pivot while it's still upright - nothing moves - then falling faster and
  // faster, set down as it goes so it's on the boards the whole way: measured, 2026-11-15.)
  KEY(2.36, { front: [2, -14], over: true, back: [-8, -9], tilt: -12, lean: 0, tip: 6, sink: 4.1, squat: 0.8, closed: C2, mouth: 'mochio' }),
  KEY(2.46, { front: [2, -14], over: true, back: [-8, -10], tilt: -8, lean: -0.25, tip: 6, sink: 5.3, closed: C2, mouth: 'mochio' }),
  KEY(2.55, { front: [3, -13], back: [-7, -11], tilt: -4, lean: -0.7, tip: 6, sink: 8.7, closed: C2, mouth: 'mochio', ease: 'in' }),
  KEY(2.62, { front: [5, -10], back: [3, -10], tilt: 0, lean: -1.2, tip: 6, sink: 12.9, closed: C2, mouth: 'mochio', ease: 'in' }),
  KEY(2.67, { ...BACK, sink: 16.2, front: [6, -6], back: [5, -6], closed: C2, mouth: 'mochiw', ease: 'in' }),
  // (A little bounce as it lands.)
  KEY(2.75, { ...BACK, sink: 14.2, front: [7, -7], back: [6, -7], legF: [1, -3, 40], legB: [1, -2.6, 30], closed: C2, mouth: 'mochiw', ease: 'out' }),
  KEY(2.84, { ...BACK, front: [6, -6], back: [5, -6], closed: C2, mouth: 'mochiw', ease: 'in' }),
  // ...and lies there, still. A rose lands in its paw (render/show.js: thrown from the audience).
  KEY(3.1, { ...BACK, front: [6, -6], back: [5, -6], closed: C2, mouth: 'mochiw' }),
  KEY(3.16, { ...BACK, hold: 'rose', front: [6, -6], back: [5, -6], swing: 0.6, closed: [false, true], mouth: 'mochiw', extra: ['hearts'] }),
  // It sits up beaming...
  KEY(3.32, { ...SAT, hold: 'rose', tip: 6, lean: -0.9, sink: 6.4, front: [5, -4], swing: 0.3, mouth: 'D', ease: 'out' }),
  KEY(3.36, { ...SAT, hold: 'rose', tip: 6, lean: -0.6, sink: 3.5, front: [4, -5], swing: 0.2, mouth: 'D' }),
  KEY(3.4, { ...SAT, hold: 'rose', tip: 6, lean: -0.3, sink: 3.9, front: [4, -6], swing: 0.1, mouth: 'D' }),
  KEY(3.46, { ...SAT, hold: 'rose', tip: 0, lean: 0, sink: 0, front: [3, -7], swing: 0, mouth: 'D', sprout: 'excited', extra: ['hearts'] }),
  // ...up onto its feet with a hop...
  KEY(3.62, { hold: 'rose', squat: 1.2, front: [3, -7], swing: 0, mouth: 'D' }),
  KEY(3.76, { hold: 'rose', lift: 2, front: [5, -12], over: true, swing: 0.2, mouth: 'D', closed: C2, ease: 'out' }),
  KEY(3.9, { hold: 'rose', lift: 0, squat: 1, front: [5, -12], over: true, swing: 0.2, mouth: 'D', closed: C2, ease: 'in' }),
  // ...and holds the rose up to the audience, blushing with joy.
  KEY(4.05, { hold: 'rose', squat: 0, front: [8, -14], over: true, swing: 0.4, back: [-1.4, -1.4], mouth: 'D', closed: C2, blush: 1.9, sprout: 'excited', extra: ['hearts'] }),
  KEY(4.6, { hold: 'rose', front: [8, -14], over: true, swing: 0.4, back: [-1.4, -1.4], mouth: 'D', closed: [false, true], blush: 1.9, sprout: 'excited', extra: ['hearts'] }),
  KEY(4.8, { hold: null }),
]);

// ---------- Mime ----------
const HUSH = { mouth: 'mochidot' };
const WALL = { hold: 'mime', alt: 'wall', reveal: 1, front: [8, -9], back: [7, -7] };
const mime0 = act(4.4, [
  KEY(0, {}),
  KEY(0.2, { mouth: 'smirk', glance: 1, front: [4, -6] }),
  // The wall in front of it...
  KEY(0.45, { ...WALL, ...HUSH, hx: 0.4 }),
  KEY(0.75, { ...WALL, front: [8, -12], back: [7, -8], ...HUSH, hx: 0.4 }),
  KEY(1.05, { ...WALL, front: [8, -7], back: [7, -11], ...HUSH, hx: 0.4 }),
  // ...it strolls off - straight into its own wall. Bonk!
  KEY(1.3, { hold: 'mime', alt: null, reveal: 0, front: [5, -5], back: [-4, -5], legF: [1.6, -1.4, 20], hx: 0.6, ...HUSH }),
  KEY(1.48, { hold: 'mime', alt: null, reveal: 0, front: [6, -5], back: [-4, -5], legB: [-1.6, -1.4, -20], hx: 1, ...HUSH }),
  KEY(1.6, { hold: 'mime', alt: 'wall', reveal: 1, lean: -0.25, lift: 1, hx: -0.6, front: [6, -12], back: [-4, -8], wide: true, mouth: 'gasp', extra: ['bang1'], ease: 'out' }),
  KEY(1.76, { hold: 'mime', alt: 'wall', reveal: 0.4, lean: -0.1, lift: 0, squat: 1.2, front: [3, -6], back: [2, -6], eyes: 'hurt', mouth: 'wavy', extra: ['orbit'], ease: 'in' }),
  // Seeing stars, swaying.
  KEY(2.0, { hold: 'mime', alt: null, reveal: 0, lean: 0, squat: 0, spiral: 2, tilt: 10, hx: 0.6, mouth: 'wavy', extra: ['orbit'] }),
  KEY(2.3, { spiral: 1, tilt: -10, hx: -0.6, mouth: 'wavy', extra: ['orbit'] }),
  KEY(2.6, { tilt: 6, mouth: 'mochiwave', extra: ['sweat1'] }),
  KEY(2.8, { tilt: -6, mouth: 'mochiwave', extra: ['sweat1'] }),
  // Rubs its head, embarrassed...
  KEY(3.0, { front: [-1, -15], over: true, tilt: 0, mouth: 'mochiw', blush: 1.9, extra: ['sweat0'] }),
  // ...and very carefully tries the wall again.
  KEY(3.4, { ...WALL, ...HUSH, blush: 1.8 }),
  KEY(3.7, { ...WALL, front: [8, -11], ...HUSH, blush: 1.8 }),
  KEY(3.95, { hold: 'mime', alt: 'wall', reveal: 0, front: [3, -5], back: [2, -5], squat: 0.6, closed: C2, mouth: 'mochiw', blush: 1.9 }),
  KEY(4.4, { hold: null }),
]);
const mime1 = act(4.6, [
  KEY(0, {}),
  KEY(0.15, { ...HUSH, glance: 1 }),
  // Trapped in a box: the wall in front, palms walking over it...
  KEY(0.35, { ...WALL, ...HUSH }),
  KEY(0.6, { ...WALL, front: [8, -12], back: [7, -9], ...HUSH }),
  KEY(0.85, { ...WALL, front: [8, -8], back: [7, -11], ...HUSH }),
  // ...a ceiling, pressing down on it...
  KEY(1.1, { hold: 'mime', alt: 'roof', reveal: 1, front: [3, -17], over: true, back: [-2, -16], squat: 0.6, look: 'up', ...HUSH }),
  KEY(1.35, { hold: 'mime', alt: 'roof', reveal: 1, front: [4, -16], over: true, back: [-1, -15], squat: 1.2, look: 'up', ...HUSH }),
  // ...the wall behind it...
  KEY(1.6, { ...WALL, turned: true, squat: 0, ...HUSH }),
  KEY(1.85, { ...WALL, turned: true, front: [8, -12], back: [7, -8], ...HUSH }),
  // ...no way out? Then - the handle of a door!
  KEY(2.1, { hold: 'mime', alt: null, reveal: 0, turned: false, front: [4, -6], back: [3, -6], brows: WORRY, ...HUSH }),
  KEY(2.35, { hold: 'mime', alt: 'wall', reveal: 1, front: [8, -6], back: [3, -5], glance: 1, ...HUSH }),
  KEY(2.6, { hold: 'mime', alt: 'wall', reveal: 1, front: [8, -5], back: [3, -5], tilt: 4, mouth: 'mochio' }),
  // It opens it, and tiptoes out...
  KEY(2.85, { hold: 'mime', alt: null, reveal: 0, front: [2, -6], back: [1, -6], hx: -0.5, tilt: 0, mouth: 'mochio' }),
  KEY(3.1, { legF: [1.6, -1.6, 30], lift: 0.8, hx: 0.6, front: [5, -7], back: [-3, -6], ...HUSH, ease: 'out' }),
  KEY(3.35, { legB: [-1.6, -1.6, -30], lift: 0, hx: 0.6, front: [5, -7], back: [-3, -6], ...HUSH, ease: 'in' }),
  // ...free! Ta-da.
  ...hop(3.45, 2, { ...OUT(-12), mouth: 'D', closed: C2, sprout: 'excited', extra: ['spark0'] }),
  // A silent bow.
  KEY(3.95, { lean: 0.45, closed: C2, ...HUSH, front: [-2, -4], back: [2, -3] }),
  KEY(4.3, { lean: 0, closed: C2, mouth: 'mochiw' }),
  KEY(4.6, {}),
]);
const RUNG = (front, back, legF, legB) => ({ hold: 'mime', alt: 'rung', reveal: 1, front, back, over: true, legF, legB, look: 'up', ...HUSH });
const mime2 = act(4.8, [
  KEY(0, {}),
  KEY(0.15, { ...HUSH, glance: 1 }),
  // The box, quick as anything.
  KEY(0.3, { ...WALL, ...HUSH }),
  KEY(0.5, { ...WALL, front: [8, -12], back: [7, -8], ...HUSH }),
  KEY(0.7, { hold: 'mime', alt: 'roof', reveal: 1, front: [3, -17], over: true, back: [-2, -16], look: 'up', ...HUSH }),
  // A rope from above: it hauls on it, hand over hand, leaning right back.
  // (Leaning back on it as far as its feet keep it on the boards; its head thrown back the rest.)
  KEY(0.95, { hold: 'mime', alt: 'rope', reveal: 1, front: [7, -14], over: true, back: [5, -10], lean: -0.04, tilt: -4, ...HUSH }),
  KEY(1.15, { hold: 'mime', alt: 'rope', reveal: 1, front: [5, -6], back: [7, -13], lean: -0.08, tilt: -9, squat: 1, hx: -0.6, mouth: 'grit' }),
  KEY(1.35, { hold: 'mime', alt: 'rope', reveal: 1, front: [7, -14], over: true, back: [5, -6], lean: -0.05, tilt: -6, squat: 0.6, mouth: 'grit' }),
  KEY(1.55, { hold: 'mime', alt: 'rope', reveal: 1, front: [5, -6], back: [7, -13], lean: -0.08, tilt: -10, squat: 1.2, hx: -0.8, mouth: 'grit', extra: ['sweat0'] }),
  // It gives! It staggers back.
  KEY(1.72, { hold: 'mime', alt: null, reveal: 0, lean: -0.12, tilt: -6, lift: 1.8, hx: -1, front: [4, -10], back: [3, -10], mouth: 'gasp', extra: ['bang0'], ease: 'out' }),
  KEY(1.88, { hold: 'mime', lean: 0, lift: 0, squat: 1.2, hx: -0.6, front: [4, -6], back: [3, -6], mouth: 'mochio', ease: 'in' }),
  // Walking into a gale: leaning on it, paws up against it, going nowhere.
  KEY(2.08, { hold: 'mime', lean: 0.25, squat: 0, hx: 0, front: [6, -12], over: true, back: [4, -10], hair: -3, legF: [1.6, -1.4, 20], ...HUSH, brows: SET }),
  KEY(2.3, { hold: 'mime', lean: 0.25, front: [6, -12], over: true, back: [4, -10], hair: -2, legB: [-1.6, -1.4, -20], ...HUSH, brows: SET }),
  KEY(2.52, { hold: 'mime', lean: 0.27, front: [6, -12], over: true, back: [4, -10], hair: -3, legF: [1.6, -1.4, 20], ...HUSH, brows: SET }),
  KEY(2.74, { hold: 'mime', lean: 0.25, front: [6, -12], over: true, back: [4, -10], hair: -2, legB: [-1.6, -1.4, -20], ...HUSH, brows: SET }),
  KEY(2.92, { hold: 'mime', lean: 0, front: [4, -8], back: [3, -8], hair: 0, ...HUSH }),
  // Up an invisible ladder, rung by rung.
  KEY(3.08, RUNG([4, -16], [3, -11], [1.8, -2.4, 40], [0, 0, 0])),
  KEY(3.3, RUNG([4, -11], [3, -16], [0.8, 0, 0], [1.4, -2.4, 30])),
  KEY(3.52, RUNG([4, -16], [3, -11], [1.8, -2.4, 40], [0, 0, 0])),
  KEY(3.74, RUNG([4, -11], [3, -16], [0.8, 0, 0], [1.4, -2.4, 30])),
  // Ta-da - and a silent bow.
  ...hop(3.88, 2, { hold: 'mime', alt: null, reveal: 0, ...OUT(-13), mouth: 'D', closed: C2, sprout: 'excited', extra: ['spark0', 'spark1'] }),
  KEY(4.34, { hold: 'mime', lean: 0.45, closed: C2, ...HUSH, front: [-2, -4], back: [2, -3] }),
  KEY(4.62, { hold: 'mime', lean: 0, closed: C2, mouth: 'mochiw' }),
  KEY(4.8, { hold: null }),
]);

// ---------- Magic ----------
// (The hat held out in the far paw, the wand in the near one.)
const HAT = (way) => ({ hold: 'magic', alt: way, back: [10, -5], swing2: 0, front: [3, -8], swing: -0.4 });
const TAP = { front: [6, -9], swing: 1.4 };
const magic0 = act(4.4, [
  KEY(0, {}),
  KEY(0.2, { ...HAT(0), reveal: 0, mouth: 'mochiw', glance: 1, sprout: 'happy' }),
  // A swish of the wand, a tap - and a puff of smoke in its face. Cough!
  KEY(0.45, { ...HAT(0), front: [6, -13], over: true, swing: -0.3, mouth: 'mochio' }),
  KEY(0.7, { ...HAT(0), ...TAP, squat: 0.6, mouth: 'mochio', closed: C2 }),
  KEY(0.9, { ...HAT(0), front: [2, -6], swing: 0.4, squat: 0, tilt: 8, eyes: 'hurt', mouth: 'gasp', extra: ['sweat1'] }),
  KEY(1.1, { ...HAT(0), front: [2, -6], swing: 0.4, tilt: -4, eyes: 'hurt', mouth: 'mochiwave', extra: ['sweat1'] }),
  // It peeks in: nothing there.
  KEY(1.45, { ...HAT(0), back: [7, -5], lean: 0.25, tilt: 10, look: 'down', mouth: 'mochio', extra: ['q'] }),
  KEY(1.9, { ...HAT(0), lean: 0, tilt: 0, brows: WORRY, mouth: 'mochiwave', extra: ['dots3'] }),
  // Again, harder...
  KEY(2.25, { ...HAT(0), front: [6, -13], over: true, swing: -0.4, brows: SET, mouth: 'grit' }),
  KEY(2.45, { ...HAT(0), ...TAP, swing: 1.5, squat: 1, brows: SET, mouth: 'grit', closed: C2 }),
  // ...and up pops one little flower. Which wilts.
  KEY(2.75, { ...HAT(0), front: [5, -8], swing: 0.4, reveal: 1, squat: 0, wide: true, mouth: 'mochio', ease: 'out' }),
  KEY(3.05, { ...HAT(0), back: [8, -9], front: [6, -7], swing: 0.6, reveal: 1, mouth: 'mochiw', blush: 2, glance: 1, extra: ['sweat0'] }),
  // "Ta-da?" A tiny bounce.
  KEY(3.45, { ...HAT(0), back: [8, -9], front: [7, -10], swing: 0.8, reveal: 1, mouth: 'mochiw', blush: 2, closed: C2, lift: 0.9, ease: 'out' }),
  KEY(3.6, { ...HAT(0), back: [8, -9], front: [7, -10], swing: 0.8, reveal: 1, mouth: 'mochiw', blush: 2, closed: C2, lift: 0, squat: 0.6, ease: 'in' }),
  KEY(3.75, { ...HAT(0), back: [8, -9], front: [6, -8], swing: 0.6, reveal: 1, mouth: 'mochiw', blush: 2, closed: C2, squat: 0 }),
  KEY(4.4, { hold: null }),
]);
const magic1 = act(4.6, [
  KEY(0, {}),
  KEY(0.2, { ...HAT(1), reveal: 0, front: [5, -10], swing: 0.2, mouth: 'smirk', glance: 1 }),
  // The wand circles over the hat...
  KEY(0.45, { ...HAT(1), front: [7, -13], over: true, swing: 0.6, mouth: 'smirk' }),
  KEY(0.65, { ...HAT(1), front: [4, -14], over: true, swing: -0.2, mouth: 'smirk' }),
  KEY(0.85, { ...HAT(1), front: [7, -12], over: true, swing: 0.8, mouth: 'smirk' }),
  // ...tap, tap, tap...
  KEY(1.05, { ...HAT(1), ...TAP, squat: 0.5, mouth: 'mochio' }),
  KEY(1.2, { ...HAT(1), front: [6, -12], swing: 0.6, lift: 0.6, mouth: 'mochio', ease: 'out' }),
  KEY(1.35, { ...HAT(1), ...TAP, squat: 0.5, lift: 0, mouth: 'mochio', ease: 'in' }),
  KEY(1.5, { ...HAT(1), front: [6, -12], swing: 0.6, lift: 0.6, mouth: 'mochio', ease: 'out' }),
  KEY(1.65, { ...HAT(1), ...TAP, squat: 0.5, lift: 0, mouth: 'mochio', ease: 'in' }),
  // ...and up comes a bouquet!
  KEY(1.85, { ...HAT(1), front: [4, -10], swing: 0.2, squat: 0, reveal: 0, wide: true, mouth: 'o', sprout: 'excited' }),
  KEY(2.3, { ...HAT(1), front: [4, -10], swing: 0.2, reveal: 1, mouth: 'D', closed: C2, extra: ['spark0'], ease: 'out' }),
  // Held out to the audience, a hop...
  KEY(2.6, { ...HAT(1), back: [9, -11], front: [8, -12], over: true, swing: 0.4, reveal: 1, tilt: -6, mouth: 'D', closed: C2, extra: ['spark1'] }),
  ...hop(2.8, 1.8, { ...HAT(1), back: [9, -11], front: [8, -12], over: true, swing: 0.4, reveal: 1, mouth: 'D', closed: C2 }),
  // ...a bow...
  KEY(3.3, { ...HAT(1), back: [6, -4], front: [4, -4], swing: 0.8, reveal: 1, lean: 0.45, closed: C2, mouth: 'mochiw' }),
  // ...and the wand up, triumphant.
  KEY(3.7, { ...HAT(1), back: [8, -9], front: [9, -12], swing: 0.8, reveal: 1, lean: 0, mouth: 'D', closed: C2, sprout: 'excited', extra: ['spark0'] }),
  KEY(4.3, { ...HAT(1), back: [8, -9], front: [9, -12], swing: 0.8, reveal: 1, mouth: 'D', closed: [false, true], sprout: 'excited' }),
  KEY(4.6, { hold: null }),
]);
const magic2 = act(4.8, [
  KEY(0, {}),
  KEY(0.2, { ...HAT(2), reveal: 0, mouth: 'smirk', glance: 1 }),
  // The wand swept round in a great circle, trailing stars...
  KEY(0.45, { ...HAT(2), front: [8, -14], over: true, swing: 0.8, mouth: 'smirk' }),
  KEY(0.65, { ...HAT(2), front: [2, -17], over: true, swing: -0.6, mouth: 'smirk' }),
  KEY(0.85, { ...HAT(2), front: [-2, -12], over: true, swing: -1.4, mouth: 'smirk' }),
  KEY(1.05, { ...HAT(2), front: [8, -12], swing: 1.0, mouth: 'mochio' }),
  // ...one tap...
  KEY(1.2, { ...HAT(2), ...TAP, swing: 1.45, squat: 0.6, mouth: 'mochio', closed: C2 }),
  // ...and it pulls out a string of flags, hand over hand, and on and on...
  KEY(1.4, { ...HAT(2), front: [5, -10], swing: 0.3, squat: 0, reveal: 0.05, wide: true, mouth: 'o' }),
  KEY(1.65, { ...HAT(2), front: [6, -14], over: true, swing: -0.2, reveal: 0.3, mouth: 'D' }),
  KEY(1.9, { ...HAT(2), front: [7, -9], swing: 0.5, reveal: 0.55, mouth: 'D', closed: C2 }),
  KEY(2.15, { ...HAT(2), front: [6, -15], over: true, swing: -0.2, reveal: 0.8, mouth: 'D' }),
  KEY(2.4, { ...HAT(2), front: [8, -11], swing: 0.6, reveal: 1, mouth: 'D', closed: C2, extra: ['spark0'] }),
  // ...tips the hat to the audience - confetti! - and a bouquet comes up out of it.
  KEY(2.7, { ...HAT(2), back: [8, -10], swing2: 0.6, front: [7, -10], swing: 0.5, reveal: 1, mouth: 'o', wide: true }),
  KEY(2.95, { ...HAT(2), back: [8, -10], swing2: 0, front: [7, -10], swing: 0.5, reveal: 2, mouth: 'D', closed: C2, extra: ['spark1'] }),
  // A spin...
  ...spin(3.0, 3, 3.4, { ...HAT(2), back: [8, -10], front: [9, -12], swing: 0.8, reveal: 2, mouth: 'D', closed: C2 }),
  // ...the hat held high, the wand to the sky...
  KEY(3.82, { ...HAT(2), back: [6, -12], front: [10, -13], over: true, swing: 0.5, reveal: 2, mouth: 'D', closed: C2, sprout: 'excited', extra: ['spark0', 'spark1'] }),
  // ...and a deep bow.
  KEY(4.05, { ...HAT(2), back: [6, -4], front: [4, -4], swing: 0.8, reveal: 2, lean: 0.45, closed: C2, mouth: 'mochiw' }),
  KEY(4.45, { ...HAT(2), back: [8, -9], front: [9, -12], swing: 0.8, reveal: 2, lean: 0, mouth: 'D', closed: [false, true], sprout: 'excited', extra: ['spark0'] }),
  KEY(4.8, { hold: null }),
]);

export const SHOW_ACTS = { sing0, sing1, sing2, drum0, drum1, drum2, dance0, dance1, dance2, act0, act1, act2, mime0, mime1, mime2, magic0, magic1, magic2 };

// What the stage does along with each (render/show.js), seconds into the act:
//   notes  [t, kind]: a note floats up from its mouth (kind 0 a small pale one, 1, 2 golden)
//   crack  t: its voice cracks - a jagged broken note
//   hits   [t, size]: a stroke on the drum (0 a tap, 1 a stroke, 2 a great BOOM)
//   drum   the drum stands beside it for the act
//   poofs  [t, kind]: a puff ('smoke' grey, 'magic' pink and sparkling) from the hat
//   burst  t: confetti bursts up out of the hat
//   trail  [t0, t1]: the wand's star leaves a trail of sparkles
//   floor  [t0, t1, beat]: the boards light up under it in time
//   mask   t: the mask flung away, tumbling off
//   rose   t: a rose thrown from the audience lands in its paw
const notes = (from, to, every, kind) => {
  const out = [];
  for (let t = from; t <= to + 1e-6; t += every) out.push([Math.round(t * 100) / 100, kind]);
  return out;
};
const strokes = (keys, size = 1) => keys.map((t) => [t, size]);
export const SHOW_FX = {
  sing0: { notes: [...notes(1.05, 1.75, 0.35, 0), ...notes(2.7, 3.4, 0.35, 0)], crack: 1.9 },
  sing1: { notes: [...notes(0.6, 2.2, 0.4, 1), ...notes(2.6, 3.4, 0.27, 1)] },
  sing2: { notes: [...notes(0.65, 1.75, 0.37, 1), ...notes(2.75, 3.5, 0.18, 2), [3.92, 2], [4.0, 2]], burst: 3.92 },
  drum0: { drum: true, hits: [[0.5, 0], [0.9, 0], [1.6, 2], [2.75, 0], [3.1, 0], [3.45, 0], [3.62, 0]] },
  drum1: { drum: true, hits: [...strokes([0.6, 0.9, 1.2, 1.5, 1.8, 2.1]), ...strokes([2.3, 2.4, 2.5, 2.6, 2.7, 2.8], 0), [3.3, 2]] },
  drum2: { drum: true, hits: [...strokes([0.5, 0.78, 1.06, 1.34]), [2.3, 2], ...strokes([2.42, 2.52, 2.62, 2.72, 2.82, 2.92], 0), [3.54, 2]] },
  dance0: {},
  dance1: { floor: [0.5, 3.2, 0.3] },
  dance2: { floor: [0.3, 4.2, 0.25] },
  act0: {},
  act1: {},
  act2: { mask: 0.98, rose: 3.16 },
  mime0: {},
  mime1: {},
  mime2: {},
  magic0: { poofs: [[0.72, 'smoke'], [2.47, 'smoke']] },
  magic1: { poofs: [[1.05, 'magic'], [1.35, 'magic'], [1.65, 'magic'], [2.0, 'magic']] },
  magic2: { poofs: [[1.2, 'magic']], trail: [0.4, 1.1], burst: 2.75 },
};
