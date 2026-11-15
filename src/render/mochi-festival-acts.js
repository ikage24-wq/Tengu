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

export const FESTIVAL_ACTS = { moonsit, offerbow, festturn };

// A skewer of three white dango, the moon-viewing kind, held at (x, y) by its stick: `d` the way it
// faces, `k` its size.
export function drawDango(ctx, x, y, k, d) {
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
    ctx.fillStyle = '#e4dccc';
    ctx.beginPath();
    ctx.arc(bx + 0.2, by + 0.3, 1.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    ctx.arc(bx, by, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(bx - 0.9, by - 0.9, 0.7, 0.6);
  }
  ctx.restore();
}
