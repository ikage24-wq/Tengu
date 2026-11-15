// The Mochi Garden's new toys (2026-11-15; world/garden-life.js has who plays and where): a kite, a
// bubble wand and a spinning top from the toy box, and the see-saw. Each played three ways, by the
// Mochi's nature (world/garden-life.js playStyle): 0 gently, 1 playfully, 2 boldly. Keyed like every
// other act (render/mochi-anim.js ACTIONS: crisp, 48 drawings a second, a little bounce in every
// beat), each with a `loop` it goes round for as long as it's kept at it.
//
// Their props are drawn live in the paws: `hold` 'kite' (its spool, the string up to the kite),
// 'bubblewand' (and the bubbles it blows), 'top' (in the paw, then spinning on the grass);
// `reveal` eases how far along each is (the kite up, the top down and spinning, the bubbles blowing).

const KEY = (t, o) => [t, o];
const C2 = [true, true];
const SET = [[-0.4, 0.8], [-0.4, 0.8]];
const OUT = (y = -12) => ({ front: [10, y], back: [-10, y] });
const SAT = { squat: 3, bob: 3, legF: [3.4, -1.6, 40], legB: [2.2, -1.2, 30] };
const act = (dur, loop, keys) => ({ dur, loop, crisp: true, fps: 48, keys });
const TAU = Math.PI * 2;

// ---------- The kite ----------
const SPOOL = { hold: 'kite', front: [5, -8] };
const kite0 = act(6, [1.4, 5.0], [
  KEY(0, {}),
  // Up goes the kite, gently, and it watches it climb...
  KEY(0.35, { ...SPOOL, reveal: 0, mouth: 'mochio', look: 'up' }),
  KEY(1.4, { ...SPOOL, front: [5, -10], reveal: 1, mouth: 'mochiw', look: 'up', sprout: 'happy' }),
  // ...and sways with it on the breeze, sighing happily.
  KEY(2.0, { ...SPOOL, front: [6, -10], reveal: 1, tilt: -5, hx: 0.4, mouth: 'mochiw', look: 'up' }),
  KEY(2.8, { ...SPOOL, front: [4, -11], reveal: 1, tilt: 4, hx: -0.4, closed: C2, mouth: 'mochiw', look: 'up' }),
  KEY(3.4, { ...SPOOL, front: [5, -10], reveal: 1, tilt: -3, lift: 0.7, mouth: 'cat', look: 'up', ease: 'out' }),
  KEY(3.6, { ...SPOOL, front: [5, -10], reveal: 1, tilt: -3, lift: 0, squat: 0.5, mouth: 'cat', look: 'up', ease: 'in' }),
  KEY(4.3, { ...SPOOL, front: [6, -10], reveal: 1, tilt: 5, hx: 0.4, squat: 0, mouth: 'mochiw', look: 'up', extra: ['hearts'] }),
  KEY(5.0, { ...SPOOL, front: [5, -10], reveal: 1, mouth: 'mochiw', look: 'up', sprout: 'happy' }),
  // Wound in, and tucked away.
  KEY(5.7, { ...SPOOL, front: [4, -6], reveal: 0, mouth: 'mochiw' }),
  KEY(6, { hold: null }),
]);
const TUG = (t, up) => [
  KEY(t, { ...SPOOL, front: [6, -5], reveal: up, squat: 1, mouth: 'D', closed: C2, ease: 'in' }),
  KEY(t + 0.16, { ...SPOOL, front: [6, -12], reveal: up, lift: 1.4, squat: 0, mouth: 'D', look: 'up', extra: ['spark0'], ease: 'out' }),
  KEY(t + 0.32, { ...SPOOL, front: [5, -10], reveal: up, lift: 0, squat: 0.6, mouth: 'mochio', look: 'up', ease: 'in' }),
];
const kite1 = act(6, [1.2, 5.1], [
  KEY(0, {}),
  KEY(0.3, { ...SPOOL, reveal: 0, mouth: 'D', glance: 1 }),
  // A run on the spot to get it up...
  KEY(0.5, { ...SPOOL, reveal: 0.3, legF: [1.8, -1.6, 22], lift: 0.8, mouth: 'D', ease: 'out' }),
  KEY(0.7, { ...SPOOL, reveal: 0.6, legB: [-1.8, -1.6, -22], lift: 0, mouth: 'D', ease: 'in' }),
  KEY(0.9, { ...SPOOL, reveal: 0.85, legF: [1.8, -1.6, 22], lift: 0.8, mouth: 'D', ease: 'out' }),
  KEY(1.1, { ...SPOOL, reveal: 1, lift: 0, mouth: 'D', look: 'up', ease: 'in' }),
  // ...and tug, tug, tug, bouncing along under it, giggling as it swoops.
  ...TUG(1.2, 1.1), ...TUG(1.9, 1.25), ...TUG(2.6, 1.1),
  KEY(3.3, { ...SPOOL, front: [5, -10], reveal: 1, tilt: -6, mouth: 'D', closed: C2, look: 'up' }),
  ...TUG(3.6, 1.3), ...TUG(4.3, 1.1),
  KEY(5.1, { ...SPOOL, front: [5, -10], reveal: 1, mouth: 'D', look: 'up' }),
  KEY(5.7, { ...SPOOL, front: [4, -6], reveal: 0, mouth: 'mochiw' }),
  KEY(6, { hold: null }),
]);
const kite2 = act(6, [1.2, 5.1], [
  KEY(0, {}),
  // Paw on its hip, the string in the other, and up it goes with one flick.
  KEY(0.3, { ...SPOOL, back: [-1.4, -1.4], reveal: 0, mouth: 'smirk', glance: 1 }),
  KEY(0.6, { ...SPOOL, back: [-1.4, -1.4], front: [6, -13], over: true, reveal: 0.8, mouth: 'grin', look: 'up', ease: 'out' }),
  KEY(1.2, { ...SPOOL, back: [-1.4, -1.4], front: [6, -12], over: true, reveal: 2, mouth: 'grin', look: 'up' }),
  // Steering it round in great loops...
  KEY(1.8, { ...SPOOL, back: [-1.4, -1.4], front: [8, -12], reveal: 2, tilt: -6, mouth: 'grin', look: 'up' }),
  KEY(2.4, { ...SPOOL, back: [-1.4, -1.4], front: [3, -14], over: true, reveal: 2, tilt: 6, mouth: 'D', closed: C2, look: 'up' }),
  // ...a spin and a cheer...
  KEY(2.8, { ...SPOOL, front: [6, -12], over: true, reveal: 2, squat: 1.2, mouth: 'D', ease: 'in' }),
  KEY(2.96, { ...SPOOL, front: [6, -12], over: true, back: [-10, -12], reveal: 2, lift: 2.6, turned: true, mouth: 'D', closed: C2, extra: ['spark0'], ease: 'out' }),
  KEY(3.12, { ...SPOOL, front: [6, -12], over: true, back: [-10, -12], reveal: 2, lift: 2.4, turned: false, mouth: 'D', closed: C2, extra: ['spark1'] }),
  KEY(3.28, { ...SPOOL, front: [6, -12], over: true, reveal: 2, lift: 0, squat: 1.2, mouth: 'D', ease: 'in' }),
  KEY(3.4, { ...SPOOL, back: [-1.4, -1.4], front: [7, -12], reveal: 2, squat: 0, mouth: 'grin', look: 'up' }),
  KEY(4.2, { ...SPOOL, back: [-1.4, -1.4], front: [3, -14], over: true, reveal: 2, tilt: 5, mouth: 'grin', look: 'up', extra: ['spark0'] }),
  KEY(5.1, { ...SPOOL, back: [-1.4, -1.4], front: [6, -12], reveal: 2, mouth: 'grin', look: 'up' }),
  KEY(5.7, { ...SPOOL, front: [4, -6], reveal: 0, mouth: 'smirk' }),
  KEY(6, { hold: null }),
]);

// ---------- The bubble wand ----------
// (Its ring up to its lips to blow - `reveal` 1 while it's blowing - or held out to watch.)
const BLOW = { hold: 'bubblewand', front: [-3, -8], over: true, swing: -0.5 };
const WATCH = { hold: 'bubblewand', front: [5, -6], swing: 0.3 };
const bubbles0 = act(6, [0.8, 5.2], [
  KEY(0, {}),
  KEY(0.3, { ...WATCH, reveal: 0, mouth: 'mochio' }),
  // A long soft breath through the ring...
  KEY(0.8, { ...BLOW, reveal: 1, mouth: 'o', closed: C2, tilt: -3 }),
  KEY(1.8, { ...BLOW, reveal: 1, mouth: 'o', closed: C2, tilt: -4 }),
  // ...then watching them float away, swaying as they go.
  KEY(2.2, { ...WATCH, reveal: 0, mouth: 'mochiw', look: 'up', tilt: 4, sprout: 'happy' }),
  KEY(2.9, { ...WATCH, reveal: 0, mouth: 'mochiw', look: 'up', tilt: -4, hx: 0.4 }),
  KEY(3.3, { ...BLOW, reveal: 1, mouth: 'o', closed: C2, tilt: -3, hx: 0 }),
  KEY(4.2, { ...BLOW, reveal: 1, mouth: 'o', closed: C2, tilt: -4 }),
  KEY(4.6, { ...WATCH, reveal: 0, mouth: 'cat', look: 'up', tilt: 4, extra: ['hearts'] }),
  KEY(5.2, { ...WATCH, reveal: 0, mouth: 'mochiw', look: 'up' }),
  KEY(6, { hold: null }),
]);
const POP = (t, h) => [
  KEY(t, { ...WATCH, reveal: 0, squat: 1.2, front: [4, -5], mouth: 'D', look: 'up', ease: 'in' }),
  KEY(t + 0.16, { ...WATCH, reveal: 0, lift: h, squat: 0, front: [6, -14], over: true, mouth: 'D', closed: C2, extra: ['spark0'], ease: 'out' }),
  KEY(t + 0.32, { ...WATCH, reveal: 0, lift: 0, squat: 1, front: [5, -8], mouth: 'D', ease: 'in' }),
  KEY(t + 0.42, { ...WATCH, reveal: 0, squat: 0, mouth: 'D', look: 'up' }),
];
const bubbles1 = act(6, [0.6, 5.2], [
  KEY(0, {}),
  KEY(0.25, { ...WATCH, reveal: 0, mouth: 'D', glance: 1 }),
  // A great stream of them, blown in puffs...
  KEY(0.6, { ...BLOW, reveal: 1, mouth: 'o', tilt: -4 }),
  KEY(0.9, { ...BLOW, reveal: 1, mouth: 'o', tilt: 4, lift: 0.6, ease: 'out' }),
  KEY(1.2, { ...BLOW, reveal: 1, mouth: 'o', tilt: -4, lift: 0, ease: 'in' }),
  KEY(1.5, { ...BLOW, reveal: 1, mouth: 'o', tilt: 4 }),
  // ...and off it hops to pop them, clapping at each.
  ...POP(1.8, 3), ...POP(2.3, 2.4), ...POP(2.8, 3.2),
  KEY(3.4, { ...BLOW, reveal: 1, mouth: 'o', tilt: -4 }),
  KEY(4.0, { ...BLOW, reveal: 1, mouth: 'o', tilt: 4 }),
  ...POP(4.3, 2.6), ...POP(4.8, 3),
  KEY(5.4, { ...WATCH, reveal: 0, mouth: 'D', closed: C2 }),
  KEY(6, { hold: null }),
]);
// (Bold: one giant bubble, blown slow and big - `swing2` its size - wobbling, until it pops in its
// face! A blink, and a laugh, and another.)
const bubbles2 = act(6.2, [0.6, 5.6], [
  KEY(0, {}),
  KEY(0.3, { ...WATCH, reveal: 0, mouth: 'smirk', glance: 1 }),
  KEY(0.6, { ...BLOW, reveal: 0, swing2: 0, mouth: 'o', brows: SET }),
  KEY(1.9, { ...BLOW, front: [-1, -8], reveal: 0, swing2: 1, mouth: 'o', closed: C2, brows: SET, lean: -0.04 }),
  KEY(2.4, { ...BLOW, front: [0, -8], reveal: 0, swing2: 1.12, mouth: 'o', closed: C2, tilt: -4 }),
  // Pop!
  KEY(2.5, { ...BLOW, front: [0, -8], reveal: 0, swing2: 0, alt: 'pop', lift: 1.6, wide: true, mouth: 'gasp', extra: ['bang1'], ease: 'out' }),
  KEY(2.66, { ...WATCH, reveal: 0, swing2: 0, alt: null, lift: 0, squat: 1, wide: true, mouth: 'mochio', extra: ['sweat0'], ease: 'in' }),
  KEY(2.95, { ...WATCH, reveal: 0, squat: 0, mouth: 'D', closed: C2, tilt: 6, extra: ['spark0'] }),
  KEY(3.2, { ...WATCH, reveal: 0, mouth: 'D', closed: C2, tilt: -6 }),
  // Another, bigger still...
  KEY(3.5, { ...BLOW, reveal: 0, swing2: 0, mouth: 'o', brows: SET }),
  KEY(4.8, { ...BLOW, front: [-1, -8], reveal: 0, swing2: 1.2, mouth: 'o', closed: C2, brows: SET }),
  // ...set free, floating up and away. Ta-da.
  KEY(5.0, { ...WATCH, front: [6, -12], over: true, reveal: 0, swing2: 0, alt: 'free', mouth: 'D', look: 'up', ease: 'out' }),
  KEY(5.6, { ...WATCH, reveal: 0, alt: null, mouth: 'D', closed: C2, sprout: 'excited', extra: ['spark1'] }),
  KEY(6.2, { hold: null }),
]);

// ---------- The spinning top ----------
// (`reveal` 0 in its paw; 1 spinning on the grass in front of it; on toward 2 it slows and wobbles;
// 2 down on its side.)
const TOP = { hold: 'top' };
const top0 = act(6, [1.6, 4.6], [
  KEY(0, {}),
  KEY(0.3, { ...TOP, front: [5, -7], reveal: 0, mouth: 'mochio', look: 'down' }),
  // Wound up, and set spinning with a gentle flick...
  KEY(0.75, { ...TOP, front: [2, -6], reveal: 0, squat: 0.6, mouth: 'mochio', look: 'down' }),
  KEY(0.95, { ...TOP, front: [8, -3], reveal: 1, squat: 1.2, lean: 0.12, mouth: 'o', look: 'down', ease: 'out' }),
  KEY(1.3, { ...TOP, front: [4, -4], reveal: 1, squat: 1.6, lean: 0.06, mouth: 'mochiw', look: 'down' }),
  // ...and crouched down watching it go round and round, paws clasped.
  KEY(1.6, { ...TOP, front: [4, -7], back: [3, -7], reveal: 1, squat: 2, mouth: 'mochiw', look: 'down', sprout: 'curious' }),
  KEY(2.4, { ...TOP, front: [4, -7], back: [3, -7], reveal: 1.1, squat: 2, tilt: 6, mouth: 'o', look: 'down' }),
  KEY(3.2, { ...TOP, front: [5, -8], back: [-5, -8], reveal: 1.2, squat: 2, tilt: -4, mouth: 'mochiw', closed: C2, extra: ['spark0'] }),
  KEY(3.8, { ...TOP, front: [4, -7], back: [3, -7], reveal: 1.25, squat: 2, tilt: 5, mouth: 'cat', look: 'down' }),
  KEY(4.6, { ...TOP, front: [4, -7], back: [3, -7], reveal: 1.3, squat: 2, mouth: 'mochiw', look: 'down' }),
  // It topples; a little clap, and it picks it up.
  KEY(5.0, { ...TOP, front: [-3, -9], back: [6, -9], over: true, reveal: 2, squat: 1.6, mouth: 'D', closed: C2 }),
  KEY(5.5, { ...TOP, front: [8, -2], reveal: 2, squat: 2, lean: 0.14, mouth: 'mochiw', look: 'down' }),
  KEY(5.75, { ...TOP, front: [5, -7], reveal: 0, squat: 0.6, lean: 0, mouth: 'mochiw' }),
  KEY(6, { hold: null }),
]);
const top1 = act(6, [1.4, 4.6], [
  KEY(0, {}),
  KEY(0.3, { ...TOP, front: [5, -7], reveal: 0, mouth: 'D', glance: 1 }),
  KEY(0.7, { ...TOP, front: [2, -8], reveal: 0, squat: 0.6, mouth: 'D', closed: C2 }),
  KEY(0.9, { ...TOP, front: [9, -3], reveal: 1, squat: 1.2, lean: 0.12, mouth: 'D', ease: 'out' }),
  KEY(1.15, { ...TOP, front: [5, -6], reveal: 1, squat: 0, lean: 0, mouth: 'D', look: 'down' }),
  // ...then has a spin itself, just like the top, round and round...
  KEY(1.4, { ...TOP, ...OUT(-9), reveal: 1, squat: 1, mouth: 'D', closed: C2, ease: 'in' }),
  KEY(1.58, { ...TOP, ...OUT(-9), reveal: 1, lift: 1.4, turned: true, mouth: 'D', closed: C2, ease: 'out' }),
  KEY(1.76, { ...TOP, ...OUT(-9), reveal: 1, lift: 1.4, turned: false, mouth: 'D', closed: C2 }),
  KEY(1.94, { ...TOP, ...OUT(-9), reveal: 1, lift: 1.4, turned: true, mouth: 'D', closed: C2 }),
  KEY(2.12, { ...TOP, ...OUT(-9), reveal: 1, lift: 0, turned: false, squat: 1, mouth: 'D', closed: C2, ease: 'in' }),
  // ...and is dizzy! Swaying, eyes spinning, giggling.
  KEY(2.4, { ...TOP, front: [3, -5], back: [2, -5], reveal: 1.1, squat: 0, spiral: 2, tilt: 10, hx: 0.6, mouth: 'wavy', extra: ['orbit'] }),
  KEY(2.8, { ...TOP, front: [3, -5], back: [2, -5], reveal: 1.15, spiral: 1, tilt: -10, hx: -0.6, mouth: 'wavy', extra: ['orbit'] }),
  KEY(3.2, { ...TOP, front: [3, -5], back: [2, -5], reveal: 1.2, spiral: 2, tilt: 8, hx: 0.4, mouth: 'D', extra: ['orbit'] }),
  KEY(3.6, { ...TOP, front: [-3, -9], back: [6, -9], over: true, reveal: 1.25, tilt: 0, hx: 0, mouth: 'D', closed: C2, extra: ['spark0'] }),
  KEY(4.0, { ...TOP, front: [5, -6], reveal: 1.3, mouth: 'D', look: 'down' }),
  KEY(4.6, { ...TOP, front: [5, -6], reveal: 1.35, mouth: 'D', look: 'down' }),
  KEY(5.0, { ...TOP, front: [5, -6], reveal: 2, mouth: 'mochio', look: 'down' }),
  KEY(5.45, { ...TOP, front: [9, -2], reveal: 2, squat: 2, lean: 0.14, mouth: 'D', look: 'down' }),
  KEY(5.72, { ...TOP, front: [5, -7], reveal: 0, squat: 0.6, lean: 0, mouth: 'D' }),
  KEY(6, { hold: null }),
]);
const top2 = act(6, [1.6, 4.6], [
  KEY(0, {}),
  KEY(0.3, { ...TOP, front: [5, -7], reveal: 0, mouth: 'smirk', glance: 1 }),
  // A big wind-up, high over its head...
  KEY(0.65, { ...TOP, front: [2, -15], over: true, reveal: 0, lean: -0.06, squat: 0.6, mouth: 'grin', brows: SET }),
  // ...and thrown down with a flourish, spinning hard.
  KEY(0.88, { ...TOP, front: [10, -3], reveal: 1, lean: 0.16, squat: 1.4, mouth: 'yell', closed: C2, ease: 'in' }),
  KEY(1.1, { ...TOP, front: [9, -6], reveal: 1, lean: 0.06, squat: 0.6, mouth: 'grin', look: 'down', extra: ['spark0'] }),
  // Arms folded, watching it go - the longest spin of all - a nod, a grin.
  KEY(1.6, { ...TOP, front: [-9.7, -5.1], back: [9.5, -5.6], reveal: 1, lean: 0, squat: 0, mouth: 'smirk', look: 'down' }),
  KEY(2.6, { ...TOP, front: [-9.7, -5.1], back: [9.5, -5.6], reveal: 1, tilt: 6, mouth: 'smirk', look: 'down' }),
  KEY(3.0, { ...TOP, front: [-9.7, -5.1], back: [9.5, -5.6], reveal: 1, tilt: -4, lift: 0.8, mouth: 'grin', ease: 'out' }),
  KEY(3.2, { ...TOP, front: [-9.7, -5.1], back: [9.5, -5.6], reveal: 1, tilt: 0, lift: 0, squat: 0.6, mouth: 'grin', ease: 'in' }),
  KEY(4.6, { ...TOP, front: [-9.7, -5.1], back: [9.5, -5.6], reveal: 1.1, squat: 0, mouth: 'smirk', look: 'down' }),
  // A victory pose as it finally falls.
  KEY(5.0, { ...TOP, ...OUT(-13), reveal: 2, lift: 2, mouth: 'D', closed: C2, sprout: 'excited', extra: ['spark0', 'spark1'], ease: 'out' }),
  KEY(5.2, { ...TOP, ...OUT(-12), reveal: 2, lift: 0, squat: 1, mouth: 'D', closed: C2, ease: 'in' }),
  KEY(5.5, { ...TOP, front: [9, -2], reveal: 2, squat: 2, lean: 0.14, mouth: 'grin', look: 'down' }),
  KEY(5.75, { ...TOP, front: [5, -7], reveal: 0, squat: 0.6, lean: 0, mouth: 'grin' }),
  KEY(6, { hold: null }),
]);

// ---------- The see-saw ----------
// Sat on its end (the ride carries it up and down: world/garden-life.js), paws on the handle in
// front. Waiting for a friend: legs swinging, looking about, a wave now and then. Riding, every
// half-beat (the board's 1.6 s swing): gently, smiling with its eyes shut at the top; playfully,
// giggling, paws up off the handle; boldly, no hands at all, cheering.
const HANDLE = { ...SAT, front: [6, -4], back: [5, -4] };
const seesawsit = act(3.6, [0.3, 3.3], [
  KEY(0, { ...HANDLE }),
  KEY(0.3, { ...HANDLE, mouth: 'mochiw', glance: 1 }),
  KEY(0.7, { ...HANDLE, legF: [3.8, -2.4, 60], legB: [2.2, -1.2, 20], mouth: 'mochiw', glance: 1 }),
  KEY(1.1, { ...HANDLE, legF: [3, -1, 30], legB: [2.6, -2, 50], mouth: 'mochio', glance: -1 }),
  KEY(1.5, { ...HANDLE, back: [-6, -13], legF: [3.8, -2.4, 60], mouth: 'D', glance: -1, sprout: 'happy' }),
  KEY(1.8, { ...HANDLE, back: [-4, -11], legF: [3, -1, 30], mouth: 'D', glance: -1 }),
  KEY(2.1, { ...HANDLE, back: [-6, -13], legF: [3.8, -2.4, 60], mouth: 'D', glance: -1 }),
  KEY(2.6, { ...HANDLE, legF: [3, -1, 30], legB: [2.6, -2, 50], tilt: 5, mouth: 'mochiw', glance: 1 }),
  KEY(3.3, { ...HANDLE, mouth: 'mochiw', glance: 1 }),
  KEY(3.6, { ...HANDLE }),
]);
const beats = (n, a, b) => {
  const out = [KEY(0, { ...HANDLE })];
  const at = (t) => Math.round(t * 100) / 100;
  for (let i = 0; i < n; i++) {
    out.push(KEY(at(0.2 + i * 0.8), a), KEY(at(0.6 + i * 0.8), b));
  }
  out.push(KEY(at(0.2 + n * 0.8), a));
  return out;
};
const seesaw0 = act(3.4, [0.2, 3.4], beats(4,
  { ...HANDLE, mouth: 'mochiw', closed: C2, tilt: 3 },
  { ...HANDLE, mouth: 'cat', closed: C2, tilt: -3, extra: ['note'] }));
const seesaw1 = act(3.4, [0.2, 3.4], beats(4,
  { ...HANDLE, front: [6, -12], back: [-5, -11], mouth: 'D', closed: C2, legF: [3.8, -2.4, 60], extra: ['spark0'] },
  { ...HANDLE, mouth: 'D', legF: [3, -1, 30], tilt: 4 }));
const seesaw2 = act(3.4, [0.2, 3.4], beats(4,
  { ...SAT, ...OUT(-13), mouth: 'yell', closed: C2, legF: [4, -2.6, 64], legB: [2.8, -2.2, 50], extra: ['spark1'] },
  { ...SAT, ...OUT(-10), mouth: 'D', legF: [3.2, -1.2, 36], tilt: -4 }));

// ---------- The garden bench (data/furniture.js garden_bench) ----------
// Up onto the seat with a hop, and sat there side by side with a friend: feet swinging, a hum, a
// lean over toward whoever's next to it, a little yawn; and a hop down again. (`lift` 18.3: its
// bottom on the seat, 11 px up: measured.)
const BENCH = 18.3;
const ON = (o = {}) => ({ ...SAT, lift: BENCH, front: [3, -2], back: [2, -2], ...o });
const benchsit = act(9.6, [1.0, 8.4], [
  KEY(0, {}),
  KEY(0.15, { squat: 1.2, mouth: 'mochio', glance: 1 }),
  KEY(0.36, { lift: BENCH + 3, squat: 0, front: [4, -8], back: [3, -8], legF: [2.2, -3, 60], legB: [1.6, -2.6, 50], mouth: 'D', ease: 'out' }),
  KEY(0.56, ON({ mouth: 'mochiw', ease: 'in' })),
  KEY(0.68, ON({ lift: BENCH + 0.8, mouth: 'mochiw', ease: 'out' })),
  KEY(0.8, ON({ mouth: 'mochiw', ease: 'in' })),
  KEY(1.0, ON({ mouth: 'mochiw', glance: 1 })),
  // Feet swinging...
  KEY(1.6, ON({ legF: [3.8, -2.4, 64], legB: [2.2, -1, 22], mouth: 'mochiw', glance: 1 })),
  KEY(2.1, ON({ legF: [3, -1, 28], legB: [2.6, -2.2, 56], mouth: 'mochiw' })),
  KEY(2.6, ON({ legF: [3.8, -2.4, 64], legB: [2.2, -1, 22], mouth: 'cat', closed: C2 })),
  // ...a hum...
  KEY(3.2, ON({ mouth: 'o', closed: C2, tilt: 5, extra: ['note'] })),
  KEY(3.9, ON({ mouth: 'mochiw', closed: C2, tilt: -4, extra: ['note'] })),
  // ...a lean over to whoever's beside it, all smiles...
  KEY(4.6, ON({ tilt: -10, hx: 0.8, mouth: 'D', glance: 1, blush: 1.8, extra: ['hearts'] })),
  KEY(5.4, ON({ tilt: -8, hx: 0.6, mouth: 'mochiw', closed: C2, blush: 1.8 })),
  // ...a little yawn and a stretch...
  KEY(6.2, ON({ tilt: 0, hx: 0, front: [5, -12], back: [-4, -12], over: true, mouth: 'yawn', closed: C2 })),
  KEY(6.9, ON({ mouth: 'mochiw', eyes: 'half' })),
  KEY(7.6, ON({ legF: [3.8, -2.4, 64], legB: [2.2, -1, 22], mouth: 'mochiw', glance: 1 })),
  KEY(8.4, ON({ mouth: 'mochiw', glance: 1 })),
  // Off it hops.
  KEY(8.6, ON({ lift: BENCH, squat: 3.4, mouth: 'mochio' })),
  KEY(8.82, { lift: BENCH + 2, squat: 0, front: [4, -8], back: [3, -8], legF: [1.6, -2, 30], mouth: 'D', ease: 'out' }),
  KEY(9.14, { lift: 0, squat: 1.4, front: [3, -5], back: [2, -5], mouth: 'D', ease: 'in' }),
  KEY(9.34, { squat: 0, mouth: 'mochiw' }),
  KEY(9.6, {}),
]);


// ---------- Together (world/garden-life.js: two Mochi's games and moments, and you) ----------
const EYES2 = { front: [-4, -16], back: [2, -15], over: true };
const FISTS = { front: [5, -6], back: [-4, -5] };
// Hide-and-seek: counting with its paws over its eyes, nodding along...
const count = act(3.2, [0.2, 3.0], [
  KEY(0, {}),
  KEY(0.2, { ...EYES2, mouth: 'o', tilt: 4 }),
  KEY(0.6, { ...EYES2, mouth: 'mochio', tilt: -3, lift: 0.5, ease: 'out' }),
  KEY(1.0, { ...EYES2, mouth: 'o', tilt: 4, lift: 0, ease: 'in' }),
  KEY(1.4, { ...EYES2, mouth: 'mochio', tilt: -3, lift: 0.5, ease: 'out' }),
  KEY(1.8, { ...EYES2, mouth: 'o', tilt: 4, lift: 0, ease: 'in' }),
  KEY(2.2, { ...EYES2, mouth: 'mochio', tilt: -3, lift: 0.5, ease: 'out' }),
  KEY(2.6, { ...EYES2, mouth: 'o', tilt: 4, lift: 0, ease: 'in' }),
  KEY(3.0, { ...EYES2, mouth: 'mochio', tilt: 0 }),
  KEY(3.2, {}),
]);
// ...and hiding: crouched low, a paw to its mouth (shh!), peeking out, trying not to giggle.
const HIDE = { squat: 2.6, front: [-5, -9], over: true, back: [3, -5] };
const hidecrouch = act(3.6, [0.3, 3.3], [
  KEY(0, {}),
  KEY(0.3, { ...HIDE, mouth: 'mochidot', glance: 1 }),
  KEY(1.0, { ...HIDE, squat: 2.8, mouth: 'mochidot', glance: -1, tilt: -6 }),
  KEY(1.6, { ...HIDE, mouth: 'mochiw', closed: C2, blush: 1.8, tilt: 4 }),
  KEY(2.2, { ...HIDE, squat: 2.8, mouth: 'mochidot', glance: 1, tilt: -6 }),
  KEY(2.8, { ...HIDE, mouth: 'mochidot', glance: -1 }),
  KEY(3.3, { ...HIDE, mouth: 'mochidot', glance: 1 }),
  KEY(3.6, {}),
]);
// A chat: its mouth going, paws talking, bobbing as it gets to the good bit.
const talk = act(2.4, [0.1, 2.2], [
  KEY(0, {}),
  KEY(0.1, { mouth: 'ah', front: [6, -9], glance: 1 }),
  KEY(0.4, { mouth: 'o', front: [9, -11], tilt: -4, lift: 0.5, ease: 'out' }),
  KEY(0.7, { mouth: 'e', front: [4, -7], back: [-6, -8], tilt: 4, lift: 0, ease: 'in' }),
  KEY(1.0, { mouth: 'ah', front: [10, -10], back: [-1, -3] }),
  KEY(1.3, { mouth: 'D', closed: C2, front: [7, -12], back: [-6, -10], tilt: -6, lift: 0.6, ease: 'out' }),
  KEY(1.6, { mouth: 'o', front: [5, -8], tilt: 2, lift: 0, ease: 'in' }),
  KEY(1.9, { mouth: 'e', front: [9, -9], glance: 1 }),
  KEY(2.2, { mouth: 'ah', front: [6, -9] }),
  KEY(2.4, {}),
]);
// A fit of giggles: paws to its mouth, eyes squeezed shut, wobbling with it.
const GIG = { front: [-5, -9], over: true, back: [3, -6], mouth: 'D', closed: C2, blush: 1.8 };
const giggle = act(1.6, [0.1, 1.4], [
  KEY(0, {}),
  KEY(0.1, { ...GIG, tilt: 6 }),
  KEY(0.3, { ...GIG, tilt: -6, lift: 0.7, ease: 'out' }),
  KEY(0.5, { ...GIG, tilt: 6, lift: 0, ease: 'in' }),
  KEY(0.7, { ...GIG, tilt: -6, lift: 0.7, ease: 'out' }),
  KEY(0.9, { ...GIG, tilt: 6, lift: 0, ease: 'in' }),
  KEY(1.4, { ...GIG, mouth: 'mochiw', tilt: 0, extra: ['spark0'] }),
  KEY(1.6, {}),
]);
// Comforting a sad friend: up on its toes to give it a pat on the head, gently.
const PAT = { over: true, back: [3, -6], mouth: 'mochiw' };
const pat = act(2.2, [0.3, 1.9], [
  KEY(0, {}),
  KEY(0.3, { ...PAT, front: [11, -15], lift: 1, glance: 1 }),
  KEY(0.6, { ...PAT, front: [11, -13], lift: 0.6, closed: C2 }),
  KEY(0.9, { ...PAT, front: [11, -15], lift: 1, closed: C2 }),
  KEY(1.2, { ...PAT, front: [11, -13], lift: 0.6, closed: C2 }),
  KEY(1.5, { ...PAT, front: [11, -15], lift: 1, glance: 1 }),
  KEY(1.9, { ...PAT, front: [11, -13], lift: 0.6, closed: C2, extra: ['hearts'] }),
  KEY(2.2, {}),
]);
// A hug: arms right round, eyes shut, rocking side to side, hearts.
const HUG = { front: [9, -8], back: [8, -9], over: true, lean: 0.12, closed: C2, blush: 1.9, mouth: 'mochiw' };
const hug = act(3, [0.3, 2.7], [
  KEY(0, {}),
  KEY(0.3, { ...HUG, tilt: 4, extra: ['hearts'] }),
  KEY(0.9, { ...HUG, tilt: -5, lift: 0.5, ease: 'out', extra: ['hearts'] }),
  KEY(1.5, { ...HUG, tilt: 5, lift: 0, ease: 'in', extra: ['hearts'] }),
  KEY(2.1, { ...HUG, tilt: -4, mouth: 'cat', extra: ['hearts'] }),
  KEY(2.7, { ...HUG, tilt: 3, extra: ['hearts'] }),
  KEY(3, {}),
]);
// A squabble: stamping, fists balled, puffed up - harrumph.
const CROSS = { front: [-9.7, -5.1], back: [9.5, -5.6] };
const stomp = act(2, [0.1, 1.8], [
  KEY(0, {}),
  KEY(0.1, { ...FISTS, squat: 1, brows: SET, mouth: 'grit', blush: 1.7 }),
  KEY(0.25, { ...FISTS, lift: 1.2, squat: 0, brows: SET, mouth: 'mochipout', legF: [1.6, -1.6, 22], extra: ['steam0'], ease: 'out' }),
  KEY(0.4, { ...FISTS, lift: 0, squat: 1.2, brows: SET, mouth: 'grit', ease: 'in' }),
  KEY(0.6, { ...FISTS, lift: 1.2, squat: 0, brows: SET, mouth: 'mochipout', legB: [-1.6, -1.6, -22], extra: ['steam1'], ease: 'out' }),
  KEY(0.75, { ...FISTS, lift: 0, squat: 1.2, brows: SET, mouth: 'grit', ease: 'in' }),
  KEY(1.2, { ...CROSS, squat: 0, brows: SET, mouth: 'mochipout', tilt: -8, extra: ['steam0'] }),
  KEY(1.8, { ...CROSS, brows: SET, mouth: 'mochipout', tilt: -10 }),
  KEY(2, {}),
]);
// No thank you: a shake of the head, arms folded.
const nope = act(1.4, null, [
  KEY(0, {}),
  KEY(0.15, { ...CROSS, tilt: 9, mouth: 'mochiflat', closed: C2 }),
  KEY(0.35, { ...CROSS, tilt: -9, mouth: 'mochiflat', closed: C2 }),
  KEY(0.55, { ...CROSS, tilt: 8, mouth: 'mochiflat', closed: C2 }),
  KEY(0.8, { ...CROSS, tilt: 0, mouth: 'mochiflat', glance: -1 }),
  KEY(1.4, {}),
]);
// You're back! A run-up bounce, arms flung wide, and a great big hug.
const missyou = act(3.2, null, [
  KEY(0, {}),
  KEY(0.12, { squat: 1.4, wide: true, mouth: 'o', sprout: 'excited', front: [3, -4], back: [2, -4], ease: 'in' }),
  KEY(0.32, { lift: 4, squat: 0, ...OUT(-14), mouth: 'D', closed: C2, sprout: 'excited', extra: ['hearts'], ease: 'out' }),
  KEY(0.52, { lift: 0, squat: 1.4, ...OUT(-12), mouth: 'D', closed: C2, extra: ['hearts'], ease: 'in' }),
  KEY(0.66, { lift: 2.4, squat: 0, ...OUT(-13), mouth: 'D', closed: C2, ease: 'out' }),
  KEY(0.82, { lift: 0, squat: 1, ...OUT(-12), mouth: 'D', closed: C2, ease: 'in' }),
  KEY(1.0, { ...HUG, squat: 0, tilt: 5, extra: ['hearts'] }),
  KEY(1.6, { ...HUG, tilt: -5, extra: ['hearts'] }),
  KEY(2.2, { ...HUG, tilt: 5, mouth: 'cat', extra: ['hearts'] }),
  KEY(2.8, { lean: 0, front: [4, -7], back: [3, -7], mouth: 'D', closed: C2, blush: 1.9, sprout: 'happy' }),
  KEY(3.2, {}),
]);
// Sat down beside you, leaning your way, eyes closed, happy as anything.
const BY = { ...SAT, front: [2, 0], back: [1.6, 0.5] };
const sitby = act(4, [0.5, 3.7], [
  KEY(0, {}),
  KEY(0.5, { ...BY, tilt: -6, mouth: 'mochiw', glance: 1, blush: 1.7 }),
  KEY(1.4, { ...BY, tilt: -9, hx: 0.4, mouth: 'cat', closed: C2, blush: 1.8, extra: ['hearts'] }),
  KEY(2.4, { ...BY, tilt: -7, mouth: 'mochiw', closed: C2, blush: 1.8 }),
  KEY(3.2, { ...BY, tilt: -9, hx: 0.4, mouth: 'mochiw', glance: 1, blush: 1.7, extra: ['hearts'] }),
  KEY(3.7, { ...BY, tilt: -6, mouth: 'mochiw', closed: C2, blush: 1.7 }),
  KEY(4, {}),
]);
// A present for you: held out in both paws, shy and blushing - then handed over with a happy hop.
const giftgive = act(3, null, [
  KEY(0, {}),
  KEY(0.3, { hold: 'gift', front: [7, -8], back: [6, -8], mouth: 'mochiw', blush: 2, glance: -1, tilt: 4 }),
  KEY(1.0, { hold: 'gift', front: [9, -9], back: [8, -9], mouth: 'mochiw', blush: 2, glance: 1, tilt: -3, lift: 0.6, ease: 'out' }),
  KEY(1.5, { hold: 'gift', front: [10, -9], back: [9, -9], mouth: 'mochio', blush: 2, lift: 0, ease: 'in' }),
  KEY(1.9, { hold: null, front: [6, -7], back: [5, -7], mouth: 'D', closed: C2, blush: 1.9, extra: ['hearts'] }),
  KEY(2.1, { squat: 1.2, front: [5, -9], back: [-5, -9], mouth: 'D', closed: C2, ease: 'in' }),
  KEY(2.3, { lift: 2, squat: 0, front: [5, -12], back: [-5, -12], mouth: 'D', closed: C2, extra: ['hearts'], ease: 'out' }),
  KEY(2.5, { lift: 0, squat: 1, mouth: 'D', closed: C2, ease: 'in' }),
  KEY(2.7, { squat: 0, mouth: 'mochiw' }),
  KEY(3, {}),
]);
// Its morning stretch (a habit): up on its toes, arms high, a yawn, a lean each way.
const UP2 = { front: [3, -17], back: [-2, -16], over: true };
const stretch = act(3.2, null, [
  KEY(0, {}),
  KEY(0.4, { ...UP2, lift: 1, mouth: 'yawn', closed: C2, ease: 'out' }),
  KEY(1.1, { ...UP2, lift: 1.2, mouth: 'yawn', closed: C2 }),
  KEY(1.6, { ...UP2, lift: 0.6, tilt: 10, mouth: 'mochio', closed: C2 }),
  KEY(2.1, { ...UP2, lift: 0.6, tilt: -10, mouth: 'mochio', closed: C2 }),
  KEY(2.6, { lift: 0, tilt: 0, front: [4, -6], back: [3, -6], mouth: 'mochiw', sprout: 'happy', ease: 'in' }),
  KEY(3.2, {}),
]);

export const TOY_ACTS = { kite0, kite1, kite2, bubbles0, bubbles1, bubbles2, top0, top1, top2, seesawsit, seesaw0, seesaw1, seesaw2, benchsit, count, hidecrouch, talk, giggle, pat, hug, stomp, nope, missyou, sitby, giftgive, stretch };

// ---------- Their props ----------
const INK = '#3a2d4f';
function inked(ctx, path, fill, line = 0.6) {
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = line * 2;
  path();
  ctx.stroke();
  ctx.fillStyle = fill;
  path();
  ctx.fill();
}
// The kite: a little wooden spool in its paw, the string running up and back to the kite - a pink and
// cream diamond with a happy mochi face on it and a tail of bows - riding the breeze (`wind` 0-1:
// higher and livelier), `up` how far it's climbed (0 in its paw, 1 flying, 2 looped round boldly).
export function drawKite(ctx, x, y, k, d, up, wind, time, seed = 0, m = null) {
  // The spool.
  inked(ctx, () => {
    ctx.beginPath();
    ctx.roundRect(x - 1.6 * k, y - 1.4 * k, 3.2 * k, 2.8 * k, 0.6 * k);
  }, '#d8a46a', 0.45);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 1.2 * k, y - 0.5 * k, 2.4 * k, 1 * k);
  // (It catches the breeze and is up in a moment: drawn from part way up, coming in as it climbs, so
  // its tail never trails along the grass.)
  const u = 0.55 + 0.45 * Math.min(1, up);
  const fade = Math.max(0, Math.min(1, (up - 0.25) / 0.35));
  const loop = Math.max(0, up - 1);
  // Where the kite is: up and behind, swaying with the wind - and, flown boldly, swung round in loops.
  const h = (62 + wind * 26) * u;
  const back = (34 + wind * 16) * u;
  const sway = Math.sin(time * (1.1 + wind) + seed) * (2 + wind * 4) * u;
  const la = time * 2.2 + seed;
  // (It flies behind the Mochi the way it's facing in the garden - not a twirl's turn - held from its
  // middle, not its paw, and eased over when it changes sides: the kite swoops across overhead,
  // never jumps from one side to the other.)
  const side = (m?.dir ?? d) < 0 ? -1 : 1;
  const [bx, by] = m?.feet ?? [x, y + 8];
  const goal = [-side * back, -(h + (by - y))];
  const st = m ? (m.kiteFly ??= { dx: goal[0], dy: goal[1], t: time }) : { dx: goal[0], dy: goal[1], t: time };
  if (fade <= 0) {
    // (Down and put away: next time it goes up, it's from where it should be.)
    Object.assign(st, { dx: goal[0], dy: goal[1], t: time });
    return;
  }
  const dt = Math.max(0, Math.min(0.1, time - st.t));
  st.t = time;
  const kk = 1 - Math.exp(-dt * 2.4);
  st.dx += (goal[0] - st.dx) * kk;
  st.dy += (goal[1] - st.dy) * kk;
  const kx = bx + st.dx + sway + Math.cos(la) * 9 * loop;
  const ky = by + st.dy + Math.sin(time * 1.6 + seed) * (1.5 + wind * 2) * u + Math.sin(la) * 7 * loop;
  ctx.save();
  ctx.globalAlpha *= fade;
  // The string, sagging a little.
  ctx.strokeStyle = 'rgba(80,60,90,0.7)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo((x + kx) / 2 + side * 4, (y + ky) / 2 + 6, kx, ky + 4);
  ctx.stroke();
  // The tail: bows on a ribbon, rippling.
  const tilt = Math.sin(time * 2.1 + seed) * 0.25 + loop * Math.sin(la) * 0.8;
  let tx = kx;
  let ty = ky + 7;
  ctx.strokeStyle = '#ff8fb4';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  const bows = [];
  for (let i = 1; i <= 8; i++) {
    tx += side * 1.2 + Math.sin(time * 5 + i * 0.9 + seed) * 0.9;
    ty += 1.6;
    ctx.lineTo(tx, ty);
    if (i % 3 === 0) bows.push([tx, ty, i]);
  }
  ctx.stroke();
  for (const [bx, by, i] of bows) {
    ctx.fillStyle = ['#ffe680', '#8fd3ff', '#ff9ec0'][(i / 3 - 1) % 3];
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 1.8, by - 1.1);
    ctx.lineTo(bx - 1.8, by + 1.1);
    ctx.closePath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 1.8, by - 1.1);
    ctx.lineTo(bx + 1.8, by + 1.1);
    ctx.closePath();
    ctx.fill();
  }
  // The kite itself.
  ctx.save();
  ctx.translate(kx, ky);
  ctx.rotate(tilt);
  // (A good size, up there against the sky, so it reads as a kite at a glance.)
  ctx.scale(1.35, 1.35);
  const diamond = () => {
    ctx.beginPath();
    ctx.moveTo(0, -6.2);
    ctx.lineTo(4.6, -0.6);
    ctx.lineTo(0, 5.4);
    ctx.lineTo(-4.6, -0.6);
    ctx.closePath();
  };
  inked(ctx, diamond, '#fff4ea', 0.55);
  ctx.save();
  diamond();
  ctx.clip();
  ctx.fillStyle = '#ff9ec0';
  ctx.beginPath();
  ctx.moveTo(0, -6.2);
  ctx.lineTo(4.6, -0.6);
  ctx.lineTo(0, -0.6);
  ctx.closePath();
  ctx.moveTo(0, 5.4);
  ctx.lineTo(-4.6, -0.6);
  ctx.lineTo(0, -0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // (Its spars, and a happy face.)
  ctx.strokeStyle = 'rgba(160,110,70,0.8)';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, 5.2);
  ctx.moveTo(-4.4, -0.6);
  ctx.lineTo(4.4, -0.6);
  ctx.stroke();
  ctx.fillStyle = INK;
  for (const ex of [-1.3, 1.3]) {
    ctx.beginPath();
    ctx.arc(ex, -0.4, 0.42, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.arc(0, 0.5, 0.7, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,150,0.55)';
  for (const ex of [-2.2, 2.2]) {
    ctx.beginPath();
    ctx.ellipse(ex, 0.6, 0.6, 0.35, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}
// The bubble wand: a pink stick and a ring with a soap film shining in it. Blowing (`blowing`),
// bubbles drift off it, each its own size, wobbling up and away and popping (kept on `m.bubbles`);
// `giant` (0-1+): a big one swelling on the ring, popped (`pop`) or set free (`free`).
export function drawBubbleWand(ctx, x, y, k, d, a, m, blowing, giant, burst, time) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const rx = x + d * k * 7 * s;
  const ry = y - k * 7 * c;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5 * k;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - d * k * 1.5 * s, y + k * 1.5 * c);
  ctx.lineTo(x + d * k * 4.6 * s, y - k * 4.6 * c);
  ctx.stroke();
  ctx.strokeStyle = '#ff8fb4';
  ctx.lineWidth = 0.7 * k;
  ctx.stroke();
  // The ring and its film.
  ctx.fillStyle = 'rgba(200,235,255,0.35)';
  ctx.beginPath();
  ctx.arc(rx, ry, 2.3 * k, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.1 * k;
  ctx.stroke();
  ctx.strokeStyle = '#8fd3ff';
  ctx.lineWidth = 0.55 * k;
  ctx.stroke();
  // Bubbles: blown off it, drifting up and away with a wobble, popping in a little ring.
  const bs = (m.bubbles ??= []);
  const last = m.bubbleAt ?? 0;
  if (blowing && time - last > 0.16) {
    m.bubbleAt = time;
    const n = bs.length + Math.floor(time * 7);
    bs.push({ t: time, x: rx, y: ry, vx: d * (10 + ((n * 37) % 11)), vy: -6 - ((n * 13) % 7), r: 1 + ((n * 29) % 10) / 9, life: 1.8 + ((n * 7) % 9) / 8 });
  }
  if (burst === 'free' && !m.freeAt) {
    m.freeAt = time;
    bs.push({ t: time, x: rx, y: ry - 6 * k, vx: d * 4, vy: -12, r: 7.2 * k, life: 3, big: true });
  }
  if (burst !== 'free') m.freeAt = 0;
  for (let i = bs.length - 1; i >= 0; i--) {
    const b = bs[i];
    const age = time - b.t;
    if (age > b.life + 0.25 || age < 0) {
      bs.splice(i, 1);
      continue;
    }
    const bx = b.x + b.vx * age + Math.sin(age * 4 + b.r * 3) * 2;
    const by = b.y + b.vy * age - age * age * 2;
    if (age > b.life) {
      const u = (age - b.life) / 0.25;
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - u)})`;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.arc(bx, by, b.r * (1 + u * 0.8), 0, TAU);
      ctx.stroke();
      continue;
    }
    bubble(ctx, bx, by, b.r * (b.big ? 1 : Math.min(1, age * 5)), time + i);
  }
  // The giant one on the ring, swelling and wobbling - or bursting.
  if (giant > 0.03) {
    const r = (2.4 + giant * 6) * k;
    bubble(ctx, rx + d * r * 0.8, ry - r * 0.7, r, time, 1 + Math.sin(time * 9) * 0.04 * giant);
  }
  if (burst === 'pop') {
    m.popAt ??= time;
    const u = Math.min(1, (time - m.popAt) / 0.3);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * TAU;
      ctx.fillStyle = `rgba(220,240,255,${0.9 * (1 - u)})`;
      ctx.beginPath();
      ctx.arc(rx + d * 5 * k + Math.cos(ang) * (4 + u * 6) * k, ry - 4 * k + Math.sin(ang) * (4 + u * 6) * k, 0.6 * k, 0, TAU);
      ctx.fill();
    }
  } else m.popAt = null;
}
function bubble(ctx, x, y, r, time, wob = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(wob, 2 - wob);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  g.addColorStop(0, 'rgba(255,255,255,0.05)');
  g.addColorStop(0.75, 'rgba(200,230,255,0.18)');
  g.addColorStop(1, 'rgba(255,190,230,0.55)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = Math.max(0.3, r * 0.08);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.28, r * 0.16, -0.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}
// The spinning top: a fat wooden top, pink and mint, a cream tip. In its paw (`on` 0) held up; on the
// grass by its feet (`ground`) spinning (1), slowing into a wobble toward 2, and at 2 down on its side.
export function drawTop(ctx, x, y, k, d, on, ground, time, m) {
  let tx = x;
  let ty = y;
  let lean = 0;
  let spin = 0;
  if (on >= 0.5 && ground) {
    const [gx, gy] = ground;
    const w = Math.max(0, on - 1);
    // (Spun hard it stands bolt upright, humming round; slowing, it leans and circles; then over it goes.)
    const fallen = w >= 0.98;
    tx = gx + d * 11 * k + (fallen ? 0 : Math.sin(time * 6) * w * 2 * k);
    lean = fallen ? d * 1.35 : Math.sin(time * 7) * w * 0.4;
    // (Leaning or down on its side, it rests on its side, not through the grass.)
    ty = gy - Math.abs(Math.sin(lean)) * 4.4 * k;
    spin = fallen ? 0 : time * (30 - w * 18);
    m.topAt = [tx, ty];
  }
  ctx.save();
  ctx.translate(tx, ty);
  ctx.scale(k, k);
  if (on >= 0.5 && ground) {
    // (Its shadow on the grass.)
    ctx.fillStyle = 'rgba(70,40,90,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, (ground[1] - ty) / k, 4, 1, 0, 0, TAU);
    ctx.fill();
  }
  ctx.rotate(lean);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-5.4, -3.2, -4.6, -5.6);
    ctx.quadraticCurveTo(0, -7.6, 4.6, -5.6);
    ctx.quadraticCurveTo(5.4, -3.2, 0, 0);
    ctx.closePath();
  };
  inked(ctx, body, '#ff9ec0', 0.5);
  ctx.save();
  body();
  ctx.clip();
  // (Its stripes, running round as it spins.)
  const ph = ((spin % 1) + 1) % 1;
  for (let i = -3; i <= 3; i++) {
    const sx = (i + ph) * 2.6;
    ctx.fillStyle = '#9fe0c0';
    ctx.fillRect(sx - 0.6, -8, 1.2, 9);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(-4, -6.2, 8, 0.8);
  ctx.restore();
  // The knob on top, and the tip.
  inked(ctx, () => {
    ctx.beginPath();
    ctx.roundRect(-0.9, -9.4, 1.8, 3, 0.6);
  }, '#d8a46a', 0.4);
  ctx.fillStyle = '#fff1d8';
  ctx.beginPath();
  ctx.moveTo(-0.6, -0.4);
  ctx.lineTo(0.6, -0.4);
  ctx.lineTo(0, 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // (Spinning hard: a hum of motion lines either side.)
  if (on >= 0.5 && ground && on < 1.4) {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 0.4;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(tx, ty - 3.4 * k, 6.4 * k, s > 0 ? -0.5 : Math.PI - 0.5, s > 0 ? 0.5 : Math.PI + 0.5);
      ctx.stroke();
    }
  }
}

// A present in its paws (data/items.js mochi_daisy, mochi_pebble, mochi_clover): a little daisy, a
// shiny pebble, a four-leaf clover.
export function drawGift(ctx, x, y, k, d, kind, time) {
  ctx.save();
  ctx.translate(x, y - 1.5 * k);
  ctx.scale(k, k);
  if (kind === 'mochi_pebble') {
    inked(ctx, () => {
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.6, 1.9, -0.2, 0, TAU);
    }, '#b9c4e8', 0.45);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1.2, -1, 0.9, 0.6);
    const tw = (Math.sin(time * 5) + 1) / 2;
    ctx.fillStyle = `rgba(255,246,200,${0.5 + 0.5 * tw})`;
    ctx.fillRect(1.6, -3.2, 0.6, 1.8);
    ctx.fillRect(1, -2.6, 1.8, 0.6);
  } else if (kind === 'mochi_clover') {
    ctx.strokeStyle = '#4a9a5a';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, 1.5);
    ctx.lineTo(d * 0.4, -2);
    ctx.stroke();
    for (const [dx, dy] of [[-1.1, -3.1], [1.1, -3.1], [-1.1, -1.1], [1.1, -1.1]]) {
      inked(ctx, () => {
        ctx.beginPath();
        ctx.arc(dx + d * 0.4, dy, 1.15, 0, TAU);
      }, '#5cbf6a', 0.35);
    }
  } else {
    ctx.strokeStyle = '#5aa85a';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, 1.5);
    ctx.lineTo(0, -2.4);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 1.5, -3.6 + Math.sin(a) * 1.5, 1, 0.55, a, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd64a';
    ctx.beginPath();
    ctx.arc(0, -3.6, 0.9, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
