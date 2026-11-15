// The Moon Viewing festival's moves (world/garden-festival.js, world/garden-life.js plays them),
// keyed like every other act (render/mochi-anim.js ACTIONS: crisp, 48 drawings a second, a little
// bounce in each beat):
//   moonsit   sat down on the grass with a skewer of dango, gazing up at the moon: a happy sigh, a
//             nibble, a slow sway, a little heart now and then - for as long as it stays
//   offerbow  paws together at the offering, a slow bow, and a pleased little smile
//   festturn  kneeling at the mortar across from the one with the mallet, turning the mochi between
//             strikes: hands back as the mallet comes down (eyes screwed shut), in to fold it over,
//             a pat, and out again in time - on the pounding moves' own beat (pound0-5: a loop of
//             0.8 s, the mallet landing 0.5 in)

const KEY = (t, o) => [t, o];
const act = (dur, loop, keys) => ({ dur, loop, crisp: true, fps: 48, keys });
const C2 = [true, true];
const SAT = { squat: 3, bob: 3, legF: [3.4, -1.6, 40], legB: [2.2, -1.2, 30] };
const DANGO = { hold: 'dango' };

const moonsit = act(9, [1.2, 7.6], [
  KEY(0, {}),
  // Down onto the grass, dango in paw.
  KEY(0.5, { ...SAT, ...DANGO, front: [4, -6], back: [3, -3], mouth: 'mochiw', ease: 'out' }),
  KEY(1.2, { ...SAT, ...DANGO, front: [4, -6], back: [3, -3], look: 'up', mouth: 'mochio' }),
  // Gazing up: a happy sigh...
  KEY(2.0, { ...SAT, ...DANGO, front: [4, -6], back: [3, -3], look: 'up', closed: C2, mouth: 'mochiw', tilt: 3, blush: 1.7 }),
  KEY(2.8, { ...SAT, ...DANGO, front: [4, -6], back: [3, -3], look: 'up', mouth: 'mochiw', tilt: 4 }),
  // ...a nibble...
  KEY(3.3, { ...SAT, ...DANGO, front: [3, -9], back: [3, -3], mouth: 'mochio', tilt: 1, ease: 'out' }),
  KEY(3.5, { ...SAT, ...DANGO, front: [3, -8.6], back: [3, -3], mouth: 'mochiw', closed: C2, blush: 1.8 }),
  KEY(3.7, { ...SAT, ...DANGO, front: [3, -9], back: [3, -3], mouth: 'mochio', closed: C2 }),
  KEY(3.9, { ...SAT, ...DANGO, front: [3, -8.6], back: [3, -3], mouth: 'mochiw', closed: C2, blush: 1.8, extra: ['hearts'] }),
  // ...and a slow sway, up at the moon again.
  KEY(4.6, { ...SAT, ...DANGO, front: [4, -6], back: [3, -3], look: 'up', mouth: 'mochiw', tilt: -4, hx: -0.3 }),
  KEY(5.6, { ...SAT, ...DANGO, front: [4, -6], back: [3, -3], look: 'up', mouth: 'mochiw', tilt: 4, hx: 0.3 }),
  KEY(6.6, { ...SAT, ...DANGO, front: [4, -6], back: [3, -3], look: 'up', closed: C2, mouth: 'mochiw', tilt: 2, blush: 1.6 }),
  KEY(7.6, { ...SAT, ...DANGO, front: [4, -6], back: [3, -3], look: 'up', mouth: 'mochio' }),
  // Up again, the skewer tucked away.
  KEY(8.4, { squat: 1.2, ...DANGO, front: [4, -6], back: [3, -5], mouth: 'mochiw', ease: 'out' }),
  KEY(9, { hold: null }),
]);

const offerbow = act(2.4, null, [
  KEY(0, {}),
  KEY(0.3, { front: [4, -8], back: [3, -8], mouth: 'mochiw', ease: 'out' }),
  KEY(0.8, { front: [4, -7], back: [3, -7], lean: 0.32, squat: 0.6, closed: C2, mouth: 'mochiw' }),
  KEY(1.3, { front: [4, -7], back: [3, -7], lean: 0.34, squat: 0.6, closed: C2, mouth: 'mochiw' }),
  KEY(1.7, { front: [4, -8], back: [3, -8], lean: 0, mouth: 'cat', closed: C2, blush: 1.7, extra: ['spark0'], ease: 'out' }),
  KEY(2.1, { front: [4, -8], back: [3, -8], mouth: 'cat', blush: 1.6 }),
  KEY(2.4, {}),
]);

// (Knelt at the mortar, leaning in to it.)
const KNEEL = { squat: 2.6, lean: 0.12, legF: [3, 0, 30], legB: [-1, 0, -10] };
const festturn = act(1.2, [0.2, 1.0], [
  KEY(0, {}),
  KEY(0.2, { ...KNEEL, front: [2, -6], back: [1, -6], mouth: 'mochio' }),
  // The mallet coming: hands well back, eyes on it...
  KEY(0.42, { ...KNEEL, lean: 0.04, front: [1, -7], back: [0, -7], look: 'up', mouth: 'mochio' }),
  // ...thump - eyes screwed shut.
  KEY(0.5, { ...KNEEL, lean: 0.02, bob: 0.6, front: [1, -7], back: [0, -7], closed: C2, mouth: 'mochiw' }),
  // In to fold it over, a pat, and out again before the next.
  KEY(0.6, { ...KNEEL, lean: 0.3, front: [9, 0], back: [8, 1], mouth: 'mochio', ease: 'out' }),
  KEY(0.72, { ...KNEEL, lean: 0.32, front: [7, -1], back: [9, 1], tilt: 4, mouth: 'cat' }),
  KEY(0.84, { ...KNEEL, lean: 0.3, front: [9, 1], back: [7, 0], tilt: -3, mouth: 'cat' }),
  KEY(0.94, { ...KNEEL, lean: 0.14, front: [3, -6], back: [2, -6], mouth: 'mochio', ease: 'out' }),
  KEY(1.0, { ...KNEEL, front: [2, -6], back: [1, -6], mouth: 'mochio' }),
  KEY(1.2, {}),
]);

// ---------- The Snow Lantern Festival ----------
//   snowthrow    a scoop of snow from the ground, patted into a ball, wound back - and thrown (the
//                ball flies across live: render/garden-festival.js), a cheeky grin after it
//   snowhit      splat! - knocked back a step with its eyes screwed shut, then a giggle
//   lightlantern crouched at a snow lantern, reaching in to its candle - and as it catches, an "oh!"
//   warmsit      sat by a lit snow lantern, paws held out to it, a little shiver, then cosy
const snowthrow = act(1.0, null, [
  KEY(0, {}),
  KEY(0.16, { squat: 2.2, lean: 0.24, front: [7, 2], back: [5, 2], mouth: 'mochio', ease: 'out' }),
  KEY(0.3, { squat: 1.2, lean: 0.1, front: [4, -6], back: [3, -6], mouth: 'cat' }),
  KEY(0.45, { squat: 0.6, lean: -0.12, tilt: -6, front: [-7, -12], back: [3, -6], brows: [[-0.4, 0.8], [-0.4, 0.8]], mouth: 'smirk', ease: 'in' }),
  KEY(0.55, { lift: 0.8, lean: 0.14, tilt: 5, front: [12, -10], back: [-4, -6], mouth: 'D', extra: ['spark0'], ease: 'out' }),
  KEY(0.75, { lean: 0.06, front: [8, -8], back: [-3, -6], mouth: 'D', closed: C2 }),
  KEY(1.0, {}),
]);
const snowhit = act(1.0, null, [
  KEY(0, {}),
  KEY(0.06, { lean: -0.18, lift: 0.6, front: [-3, -12], back: [3, -12], closed: C2, mouth: 'mochiw', extra: ['bang1'], ease: 'out' }),
  KEY(0.22, { lean: -0.1, squat: 0.8, front: [2, -11], back: [-2, -11], closed: C2, mouth: 'mochiw', tilt: 6 }),
  KEY(0.5, { lean: 0, front: [3, -8], back: [2, -8], closed: C2, mouth: 'D', blush: 1.8, tilt: -4 }),
  KEY(0.75, { front: [4, -7], back: [3, -7], closed: C2, mouth: 'D', blush: 1.7, tilt: 3 }),
  KEY(1.0, {}),
]);
const lightlantern = act(2.4, null, [
  KEY(0, {}),
  KEY(0.3, { squat: 2.6, lean: 0.22, front: [5, -4], back: [4, -4], mouth: 'mochio', ease: 'out' }),
  KEY(0.8, { squat: 2.6, lean: 0.3, front: [9, -3], back: [5, -4], mouth: 'mochio' }),
  KEY(1.1, { squat: 2.6, lean: 0.3, front: [9.4, -3.4], back: [5, -4], mouth: 'mochio', closed: C2 }),
  // It catches: "oh!"
  KEY(1.3, { squat: 1.8, lean: 0.08, front: [5, -6], back: [4, -6], mouth: 'mochio', wide: true, extra: ['spark0'], ease: 'out' }),
  KEY(1.8, { squat: 1, front: [4, -8], back: [3, -8], mouth: 'D', closed: C2, blush: 1.7, sprout: 'happy' }),
  KEY(2.4, {}),
]);
const warmsit = act(9, [1.2, 7.6], [
  KEY(0, {}),
  KEY(0.5, { ...SAT, front: [6, -4], back: [5, -4], mouth: 'mochiw', ease: 'out' }),
  KEY(1.2, { ...SAT, front: [8, -4], back: [7, -4], mouth: 'mochio' }),
  // Paws to the glow...
  KEY(2.2, { ...SAT, front: [8.4, -4.4], back: [7.4, -4], closed: C2, mouth: 'mochiw', blush: 1.7 }),
  // ...a little shiver...
  KEY(3.0, { ...SAT, front: [5, -6], back: [4, -6], mouth: 'mochiflat', tilt: 2 }),
  KEY(3.1, { ...SAT, front: [5, -6], back: [4, -6], mouth: 'mochiflat', tilt: -2 }),
  KEY(3.2, { ...SAT, front: [5, -6], back: [4, -6], mouth: 'mochiflat', tilt: 2 }),
  KEY(3.3, { ...SAT, front: [5, -6], back: [4, -6], mouth: 'mochiflat', tilt: 0 }),
  // ...and cosy again, swaying.
  KEY(4.2, { ...SAT, front: [8, -4], back: [7, -4], closed: C2, mouth: 'mochiw', blush: 1.8, tilt: -3, extra: ['hearts'] }),
  KEY(5.4, { ...SAT, front: [8, -4], back: [7, -4], closed: C2, mouth: 'cat', blush: 1.8, tilt: 3 }),
  KEY(6.6, { ...SAT, front: [8, -4], back: [7, -4], look: 'up', mouth: 'mochio' }),
  KEY(7.6, { ...SAT, front: [8, -4], back: [7, -4], mouth: 'mochio' }),
  KEY(8.4, { squat: 1.2, front: [4, -6], back: [3, -5], mouth: 'mochiw', ease: 'out' }),
  KEY(9, {}),
]);

// ---------- Blossom Day and Lantern Night ----------
//   hanamisit    sat on the picnic mat with a skewer of three-colour dango: a nibble, a happy sway, a
//                chat (a nod, a giggle), petals to watch
//   fansit       sat in the shade fanning itself with a round paper fan, a puff of "it's hot", eyes
//                closing in the breeze
//   floatlantern crouched at the bank with a little lantern boat, setting it down on the water and
//                giving it a gentle push, then up to wave it off
//   sparklesit   sat out with a sparkler fizzing in its paw, looking up at the fireworks - a "wow"
const HANAMI = { hold: 'dango3' };
const hanamisit = act(9, [1.0, 7.8], [
  KEY(0, {}),
  KEY(0.5, { ...SAT, ...HANAMI, front: [4, -6], back: [3, -3], mouth: 'mochiw', ease: 'out' }),
  KEY(1.0, { ...SAT, ...HANAMI, front: [4, -6], back: [3, -3], mouth: 'D', closed: C2 }),
  // A nibble...
  KEY(1.8, { ...SAT, ...HANAMI, front: [3, -9], back: [3, -3], mouth: 'mochio', ease: 'out' }),
  KEY(2.0, { ...SAT, ...HANAMI, front: [3, -8.6], back: [3, -3], mouth: 'mochiw', closed: C2, blush: 1.8 }),
  KEY(2.2, { ...SAT, ...HANAMI, front: [3, -9], back: [3, -3], mouth: 'mochio', closed: C2 }),
  KEY(2.4, { ...SAT, ...HANAMI, front: [3, -8.6], back: [3, -3], mouth: 'mochiw', closed: C2, blush: 1.8, extra: ['hearts'] }),
  // ...a chat across the mat: a nod, a giggle...
  KEY(3.4, { ...SAT, ...HANAMI, front: [4, -6], back: [5, -8], mouth: 'D', tilt: 4 }),
  KEY(3.7, { ...SAT, ...HANAMI, front: [4, -6], back: [5, -8], mouth: 'mochiw', tilt: -2, bob: 3.6 }),
  KEY(4.0, { ...SAT, ...HANAMI, front: [4, -6], back: [5, -8], mouth: 'D', tilt: 4 }),
  KEY(4.6, { ...SAT, ...HANAMI, front: [4, -6], back: [3, -3], mouth: 'D', closed: C2, blush: 1.8, tilt: -3 }),
  // ...and a petal watched down, swaying.
  KEY(5.6, { ...SAT, ...HANAMI, front: [4, -6], back: [3, -3], look: 'up', mouth: 'mochio', tilt: 3 }),
  KEY(6.8, { ...SAT, ...HANAMI, front: [4, -6], back: [3, -3], mouth: 'mochiw', tilt: -3, hx: -0.3 }),
  KEY(7.8, { ...SAT, ...HANAMI, front: [4, -6], back: [3, -3], mouth: 'D', closed: C2 }),
  KEY(8.4, { squat: 1.2, ...HANAMI, front: [4, -6], back: [3, -5], mouth: 'mochiw', ease: 'out' }),
  KEY(9, { hold: null }),
]);
const FAN = { hold: 'uchiwa' };
const fansit = act(8, [1.0, 6.6], [
  KEY(0, {}),
  KEY(0.5, { ...SAT, ...FAN, front: [5, -9], back: [3, -3], swing: 0, mouth: 'mochiflat', eyes: 'half', ease: 'out' }),
  KEY(1.0, { ...SAT, ...FAN, front: [5, -9], back: [3, -3], swing: 0.3, mouth: 'mochiflat', eyes: 'half' }),
  // Fan, fan, fan...
  KEY(1.25, { ...SAT, ...FAN, front: [5.4, -10], back: [3, -3], swing: -0.35, mouth: 'mochiflat', eyes: 'half' }),
  KEY(1.5, { ...SAT, ...FAN, front: [5, -9], back: [3, -3], swing: 0.3, mouth: 'mochiflat', eyes: 'half' }),
  KEY(1.75, { ...SAT, ...FAN, front: [5.4, -10], back: [3, -3], swing: -0.35, mouth: 'mochiflat', eyes: 'half' }),
  KEY(2.0, { ...SAT, ...FAN, front: [5, -9], back: [3, -3], swing: 0.3, mouth: 'mochio', eyes: 'half', extra: ['sweat0'] }),
  // ...a puff - "it's hot" - and eyes closing in the breeze.
  KEY(2.6, { ...SAT, ...FAN, front: [5, -9], back: [3, -3], swing: 0.1, mouth: 'mochio', puff: true, tilt: -4 }),
  KEY(3.4, { ...SAT, ...FAN, front: [5.4, -10], back: [3, -3], swing: -0.3, mouth: 'mochiw', closed: C2, tilt: 2 }),
  KEY(3.7, { ...SAT, ...FAN, front: [5, -9], back: [3, -3], swing: 0.3, mouth: 'mochiw', closed: C2 }),
  KEY(4.0, { ...SAT, ...FAN, front: [5.4, -10], back: [3, -3], swing: -0.3, mouth: 'mochiw', closed: C2 }),
  KEY(4.3, { ...SAT, ...FAN, front: [5, -9], back: [3, -3], swing: 0.3, mouth: 'cat', closed: C2, blush: 1.7 }),
  KEY(5.4, { ...SAT, ...FAN, front: [5, -8], back: [3, -3], swing: 0, mouth: 'cat', closed: C2, blush: 1.7, tilt: -2 }),
  KEY(6.6, { ...SAT, ...FAN, front: [5, -9], back: [3, -3], swing: 0.3, mouth: 'mochiflat', eyes: 'half' }),
  KEY(7.4, { squat: 1.2, ...FAN, front: [4, -7], back: [3, -5], swing: 0, mouth: 'mochiw', ease: 'out' }),
  KEY(8, { hold: null }),
]);
const BOAT = { hold: 'boat' };
const floatlantern = act(2.6, null, [
  KEY(0, { ...BOAT, front: [5, -6], back: [4, -6] }),
  KEY(0.35, { ...BOAT, squat: 2.6, lean: 0.3, front: [8, -1], back: [7, -1], mouth: 'mochio', ease: 'out' }),
  KEY(0.9, { ...BOAT, squat: 2.8, lean: 0.36, front: [10, 1], back: [9, 1], mouth: 'mochiw', closed: C2 }),
  // Let go - a gentle push - and it's off.
  KEY(1.4, { squat: 2.6, lean: 0.36, front: [12, 0], back: [9, 0], mouth: 'mochio', ease: 'out' }),
  KEY(1.8, { squat: 1.2, lean: 0.08, front: [5, -6], back: [4, -6], mouth: 'mochiw', look: 'up' }),
  KEY(2.1, { front: [9, -13], back: [-3, -6], mouth: 'D', closed: C2, extra: ['spark0'] }),
  KEY(2.35, { front: [7, -14], back: [-3, -6], mouth: 'D', closed: C2, tilt: 4 }),
  KEY(2.6, {}),
]);
const SPARK = { hold: 'sparkler' };
const sparklesit = act(9, [1.0, 7.8], [
  KEY(0, {}),
  KEY(0.5, { ...SAT, ...SPARK, front: [6, -7], back: [3, -3], mouth: 'mochio', ease: 'out' }),
  KEY(1.0, { ...SAT, ...SPARK, front: [6, -7], back: [3, -3], look: 'up', mouth: 'mochio' }),
  KEY(2.0, { ...SAT, ...SPARK, front: [6.4, -7.6], back: [3, -3], look: 'up', mouth: 'D', wide: true, extra: ['spark0'] }),
  KEY(2.6, { ...SAT, ...SPARK, front: [6, -7], back: [3, -3], look: 'up', mouth: 'D', closed: C2, blush: 1.7 }),
  // A look down at its own little sparkler, fizzing, and a giggle.
  KEY(3.6, { ...SAT, ...SPARK, front: [7, -6], back: [3, -3], mouth: 'mochiw', tilt: 4 }),
  KEY(4.4, { ...SAT, ...SPARK, front: [7, -6.4], back: [3, -3], mouth: 'D', closed: C2, tilt: -3 }),
  KEY(5.4, { ...SAT, ...SPARK, front: [6, -7], back: [3, -3], look: 'up', mouth: 'mochio', wide: true }),
  KEY(5.8, { ...SAT, ...SPARK, front: [6.4, -8], back: [4, -6], look: 'up', mouth: 'D', extra: ['spark1'] }),
  KEY(6.8, { ...SAT, ...SPARK, front: [6, -7], back: [3, -3], look: 'up', mouth: 'mochiw', blush: 1.7, extra: ['hearts'] }),
  KEY(7.8, { ...SAT, ...SPARK, front: [6, -7], back: [3, -3], look: 'up', mouth: 'mochio' }),
  KEY(8.4, { squat: 1.2, ...SPARK, front: [5, -6], back: [3, -5], mouth: 'mochiw', ease: 'out' }),
  KEY(9, { hold: null }),
]);

export const FESTIVAL_ACTS = { moonsit, offerbow, festturn, snowthrow, snowhit, lightlantern, warmsit, hanamisit, fansit, floatlantern, sparklesit };

// Three-colour hanami dango: pink, white, green.
export function drawDango3(ctx, x, y, k, d) {
  drawDango(ctx, x, y, k, d, ['#a8d88a', '#fffaf0', '#ffb3c8']);
}
// A round paper fan (uchiwa): a bamboo handle and a round face, pale blue with a swirl of waves and a
// little red sun, waved at angle `a`.
export function drawUchiwa(ctx, x, y, k, d, a = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(d * k, k);
  ctx.rotate(a - 0.4);
  ctx.fillStyle = '#c8a060';
  ctx.fillRect(-0.5, -1, 1, 5);
  ctx.fillStyle = '#eef6ff';
  ctx.beginPath();
  ctx.arc(0, -5.6, 4.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a8ad8';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(-1.6, -4.6, 1.8, Math.PI, Math.PI * 2);
  ctx.arc(1.6, -4.6, 1.8, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#e05a6a';
  ctx.beginPath();
  ctx.arc(1.2, -7.6, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c8a060';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(0, -5.6, 4.8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
// A little paper lantern boat, held before it's set afloat.
export function drawLanternBoat(ctx, x, y, k, d) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(d * k, k);
  ctx.fillStyle = '#c8945a';
  ctx.beginPath();
  ctx.moveTo(-4, -1);
  ctx.lineTo(4, -1);
  ctx.lineTo(3, 1);
  ctx.lineTo(-3, 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff2d6';
  ctx.fillRect(-2.4, -6, 4.8, 5);
  ctx.fillStyle = '#e05a3a';
  ctx.fillRect(-2.4, -6.4, 4.8, 0.9);
  ctx.fillStyle = 'rgba(255,200,110,0.8)';
  ctx.fillRect(-1, -4.4, 2, 2.4);
  ctx.restore();
}
// A sparkler: a thin wire stick, a glowing bead at its tip spitting little star-sparks.
export function drawSparkler(ctx, x, y, k, d, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(d * k, k);
  ctx.strokeStyle = '#8a8a9a';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(4, -7);
  ctx.stroke();
  const tx = 4;
  const ty = -7;
  ctx.fillStyle = 'rgba(255,220,140,0.35)';
  ctx.beginPath();
  ctx.arc(tx, ty, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff2c0';
  ctx.beginPath();
  ctx.arc(tx, ty, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd86a';
  ctx.lineWidth = 0.4;
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4 + Math.floor(time * 24) * 1.7;
    const r = 2 + ((i * 1.3 + time * 13) % 3);
    ctx.beginPath();
    ctx.moveTo(tx + Math.cos(a) * 1.2, ty + Math.sin(a) * 1.2);
    ctx.lineTo(tx + Math.cos(a) * r, ty + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

// A skewer of three white dango, the moon-viewing kind, held at (x, y) by its stick: `d` the way it
// faces, `k` its size.
export function drawDango(ctx, x, y, k, d, colors = null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(d * k, k);
  ctx.strokeStyle = '#d8b07a';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-0.6, 2.2);
  ctx.lineTo(1.6, -9.6);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const bx = 0.6 + i * 0.42;
    const by = -1.6 - i * 2.9;
    ctx.fillStyle = colors ? 'rgba(0,0,0,0.12)' : '#e4dccc';
    ctx.beginPath();
    ctx.arc(bx + 0.2, by + 0.3, 1.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors?.[i] ?? '#fffaf0';
    ctx.beginPath();
    ctx.arc(bx, by, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(bx - 0.9, by - 0.9, 0.7, 0.6);
  }
  ctx.restore();
}
