// The Beluga Lifeguard (2026-11-26, the Sunken Aquarium Palace's `pearldiver`, remade from scratch: the
// old Pearl Otter is gone): Queen Coralie's palace lifeguard, very much on duty at the bottom of the sea
// ("No running! No splashing!" in a palace that is already underwater). A chubby snow-white beluga
// calf with a big soft round melon, a short beak and a sweet upturned smile, a soft neck crease (it nods
// and turns its head), small round flippers and flukes. Its lifeguard kit: a coral-pink rescue float (a
// soft torpedo buoy) on its strap across its body, the strap done up with a PEARL clasp (the palace's
// livery), a pearl-white whistle on a cord, a pale-aqua sun visor on its melon, and a little tube of
// sunscreen tucked in the strap (there is no sun down here). It floats a hand's height over the floor,
// swimming level on a slow, heavy beat of its flukes (its phase from the distance swum). Its body is
// its own copy of the fish base's whale calf (whalebase.js).
//   idle    its act, in four pieces, each whole in itself, the next one that fits the time it has
//           (data `rest`; world/mobs.js tells it how long, `m.restUntil`):
//           - the whistle: it spots something, a sharp blast ("tweet!"), a flipper pointing hard...
//             it was only a bubble (pop); sheepish;
//           - on watch: a flipper up to its visor, scanning slowly out one way, turning to scan the
//             other, nodding; all clear;
//           - the sunscreen: a dab out of the tube in its strap, onto its head, rubbed in, satisfied;
//             a look up at the sun that isn't there;
//           - the ring trick: a deep breath, a perfect bubble ring, then a little one shot through it;
//             a proud wiggle.
//   moves   (def.moves) Rescue Ring: a deep breath, then a big bubble ring blown out like a life ring
//           (the ranged shot, `fight.shot: 'bubblering'`, drawn in flight by bubbleRingShot below).
//           Buoy Bonk: the rescue float swung round on its strap, up over its head and bonked down in
//           front, a splash of bubbles. Whistle Blast: whistle up, a sharp blast, a cone of soft sound
//           rings pushing out.
//   faces   its own: small round glossy blue-grey eyes with a big round glint and a little one, a neat
//           lash line on top (the whole iris always shows awake), soft round brows that do the acting,
//           rosy cheeks, a smile line along its beak that changes with its mood, a mouth that rounds
//           to blow rings and puckers round the whistle. Earnest, rule-bound, kind.
//   marks   all its own (`ownEmotes`): a "!" (with a whistle tweet) as it starts hunting you, a "?"
//           when it loses you, a proud flipper clap and a note after landing a hit, a wince when hit,
//           a sweat drop when low, z's in little bubbles asleep (its visor tipped, never over its
//           eyes), dizzy when beaten.
import { dressedWhale } from './whalebase.js';

// ---------- Little helpers ----------
const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const easeOut = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
// (a beat's weight: 0 before t0, eased up to 1 by t1, held to t2, eased back to 0 by t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const rgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (hex, al) => {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};
// (a colour washed toward white as the hit flash shows)
const lit = (a, hex, al = 1) => {
  const k = Math.min(0.85, Math.max(0, (a?.flash ?? 0) * 6));
  const [r, g, b] = rgb(hex);
  const f = (v) => Math.round(v + (255 - v) * k);
  return `rgba(${f(r)},${f(g)},${f(b)},${clamp(al, 0, 1)})`;
};
function glow(ctx, x, y, r, hex, al) {
  if (al <= 0.005 || r <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(hex, al));
  g.addColorStop(1, rgba(hex, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// a curvy four-point sparkle (the game's)
function sparkle(ctx, x, y, k, fill) {
  if (k <= 0.01) return;
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.quadraticCurveTo(x, y, x, y + k);
  ctx.quadraticCurveTo(x, y, x - k, y);
  ctx.quadraticCurveTo(x, y, x, y - k);
  ctx.fillStyle = fill;
  ctx.fill();
}
// a smooth stroke through [p0, c, p1, c, p2 ...]
function stroke(ctx, pts, w, col) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
  ctx.stroke();
}
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const scl = (p, k) => [p[0] * k, p[1] * k];
const lerp2 = (p, q, u) => [mix(p[0], q[0], u), mix(p[1], q[1], u)];

// ---------- Its colours ----------
const BL = {
  // (2026-11-27, the player: so pale it almost vanished on light maps. Still white and soft, with a
  // gentle blue-grey shade under the belly and fins and a stronger soft blue outline.)
  C: { lt: '#ffffff', base: '#eef2fa', sh: '#c3cee8', deep: '#9fadd4', fin: '#cdd7ef' },
  ink: '#6372aa',
  fxC: { fill: 'rgba(232,248,255,0.62)', edge: '#86c2d9', glint: '#ffffff', spark: 'rgba(120,176,206,0.85)' },
  coral: { lt: '#ffd9d4', base: '#ff9f9a', sh: '#ea8089', deep: '#cf6b7d', ink: '#c56478' },
  pearl: { lt: '#ffffff', base: '#fbf6ef', sh: '#e6dcef', ink: '#b3a6cd' },
  aqua: { lt: '#effdfc', base: '#b2eae7', sh: '#87d0cf', ink: '#5fadb2' },
  cord: '#7fc8cb',
  eye: { top: '#2e3a5b', mid: '#43557d', low: '#7a95bf', rim: '#34405f', lash: '#3a4566' },
  brow: '#a3afd6',
  blush: '#ffa6bd',
  line: '#8784b5',
  mouth: '#c06a8b',
  tongue: '#f4a6ba',
  ring: { fill: '#e8f8ff', edge: '#7cc0d6', glint: '#ffffff' },
};

// ---------- Its faces: targets for a mood ----------
// sh: shut (0 open, 1 shut) and which shut shape; bt: brow tilt (+ knit, - worried); by: brows raised;
// bx: the near brow up, the far one down (a quizzical look); ms: the smile (-1 frown, 1 smile); mw: its
// length; mo: a grin open; ro: the mouth rounded at the beak's tip (an O); pk: puckered round the
// whistle; bl: blush; ch: cheeks puffed with a breath.
const FACES = {
  calm: { sh: 0, kind: 'blink', bt: 0.1, by: 0.15, bx: 0, ms: 0.55, mw: 1, mo: 0, ro: 0, pk: 0, bl: 0.55, ch: 0 },
  duty: { sh: 0, kind: 'blink', bt: 0.55, by: 0, bx: 0, ms: 0.15, mw: 0.85, mo: 0, ro: 0, pk: 0, bl: 0.45, ch: 0 },
  spot: { sh: 0, kind: 'blink', bt: -0.1, by: 0.95, bx: 0, ms: 0, mw: 0.7, mo: 0, ro: 0.3, pk: 0, bl: 0.5, ch: 0 },
  puff: { sh: 0, kind: 'blink', bt: 0.45, by: 0.3, bx: 0, ms: 0.1, mw: 0.65, mo: 0, ro: 0, pk: 0, bl: 0.75, ch: 1 },
  blow: { sh: 0, kind: 'blink', bt: 0.25, by: 0.45, bx: 0, ms: 0, mw: 0.6, mo: 0, ro: 1, pk: 0, bl: 0.65, ch: 0.45 },
  whistle: { sh: 0, kind: 'blink', bt: 0.8, by: -0.05, bx: 0, ms: 0.05, mw: 0.55, mo: 0, ro: 0, pk: 1, bl: 0.7, ch: 0.9 },
  stern: { sh: 0, kind: 'blink', bt: 0.85, by: -0.1, bx: 0, ms: -0.25, mw: 0.75, mo: 0, ro: 0, pk: 0, bl: 0.45, ch: 0 },
  realise: { sh: 0, kind: 'blink', bt: -0.25, by: 0.85, bx: 0, ms: -0.1, mw: 0.6, mo: 0, ro: 0.35, pk: 0, bl: 0.7, ch: 0 },
  sheepish: { sh: 0, kind: 'blink', bt: -0.7, by: 0.35, bx: 0, ms: 0.35, mw: 0.8, mo: 0, ro: 0, pk: 0, bl: 1, ch: 0 },
  focus: { sh: 0, kind: 'blink', bt: 0.4, by: 0.05, bx: 0, ms: 0.25, mw: 0.8, mo: 0, ro: 0, pk: 0, bl: 0.5, ch: 0 },
  content: { sh: 1, kind: 'happy', bt: -0.2, by: 0.4, bx: 0, ms: 0.95, mw: 1.1, mo: 0, ro: 0, pk: 0, bl: 0.85, ch: 0 },
  satisfied: { sh: 1, kind: 'happy', bt: -0.1, by: 0.55, bx: 0, ms: 1, mw: 1.1, mo: 0.3, ro: 0, pk: 0, bl: 0.9, ch: 0 },
  proud: { sh: 1, kind: 'happy', bt: 0.05, by: 0.7, bx: 0, ms: 1, mw: 1.15, mo: 0.6, ro: 0, pk: 0, bl: 0.95, ch: 0 },
  fierce: { sh: 0, kind: 'blink', bt: 0.85, by: -0.15, bx: 0, ms: -0.1, mw: 0.8, mo: 0.45, ro: 0, pk: 0, bl: 0.5, ch: 0 },
  huh: { sh: 0, kind: 'blink', bt: 0, by: 0.45, bx: 0.7, ms: -0.1, mw: 0.6, mo: 0, ro: 0.2, pk: 0, bl: 0.5, ch: 0 },
  hurt: { sh: 1, kind: 'squeeze', bt: -0.6, by: 0, bx: 0, ms: -0.6, mw: 0.8, mo: 0.45, ro: 0, pk: 0, bl: 0.6, ch: 0 },
  sleep: { sh: 1, kind: 'sleep', bt: -0.1, by: 0, bx: 0, ms: 0.35, mw: 0.8, mo: 0, ro: 0, pk: 0, bl: 0.55, ch: 0 },
  dizzy: { sh: 1, kind: 'dizzy', bt: -0.45, by: 0.2, bx: 0, ms: -0.3, mw: 0.8, mo: 0.35, ro: 0, pk: 0, bl: 0.45, ch: 0 },
  sad: { sh: 0, kind: 'blink', bt: -0.75, by: 0.2, bx: 0, ms: -0.6, mw: 0.8, mo: 0, ro: 0, pk: 0, bl: 0.4, ch: 0 },
  cross: { sh: 0, kind: 'blink', bt: 0.95, by: -0.2, bx: 0, ms: -0.45, mw: 0.7, mo: 0, ro: 0, pk: 0, bl: 0.5, ch: 0 },
  worried: { sh: 0, kind: 'blink', bt: -0.6, by: 0.35, bx: 0, ms: -0.2, mw: 0.7, mo: 0, ro: 0.15, pk: 0, bl: 0.5, ch: 0 },
  talk: { sh: 0, kind: 'blink', bt: 0, by: 0.3, bx: 0, ms: 0.4, mw: 0.9, mo: 0.3, ro: 0, pk: 0, bl: 0.55, ch: 0 },
  happy: { sh: 1, kind: 'happy', bt: -0.15, by: 0.5, bx: 0, ms: 1, mw: 1.15, mo: 0.7, ro: 0, pk: 0, bl: 0.85, ch: 0 },
};
const KINDS = ['blink', 'happy', 'sleep', 'squeeze', 'dizzy'];
const FACE_KEYS = ['bt', 'by', 'bx', 'ms', 'mw', 'mo', 'ro', 'pk', 'bl', 'ch'];
// vowel mouths for talking: [round O, open, smile], each held a beat, eased into the next
const VOWELS = [[0.6, 0, 0.1], [0, 0.6, 0.5], [0, 0.35, 0.7], [0.2, 0, 0.3], [0.85, 0, 0]];

// ---------- The moves (channels: pnA/pnW the near flipper's own angle and hold, pfA/pfW the far one's,
// d1 the buoy swung round on its strap (0 at rest under its belly, 1 bonked down in front, 1.263 round
// again to rest), d2 the whistle up at its mouth) ----------
const ROUND = 360 / 285;
const MOVES = {
  // Rescue Ring: a deep breath (rearing back, flippers out, cheeks full), then out it blows.
  rescueRing: {
    anticT: 0.34,
    keys: [
      [0, { x: -0.06, rise: 0.05, pitch: -13, head: -9, fins: 0.5, spread: 0.6, pnA: 62, pnW: 0.7, pfA: 70, pfW: 0.6 }],
      [0.06, { x: 0.06, rise: 0.01, pitch: 7, head: 9, fins: 0.9, spread: 1, thrash: 0.6, pnA: 120, pnW: 0.5, pfW: 0.3 }, 'out'],
      [0.24, { x: 0.04, pitch: 4, head: 5, fins: 0.5, thrash: 0.25 }, 'io'],
      [0.52, { x: 0.01, pitch: 0, head: 0, fins: 0.2, thrash: 0, pnW: 0, pfW: 0 }, 'io'],
      [0.85, {}, 'io'],
    ],
    ring: 0.03,
  },
  // Buoy Bonk: the float swung back round behind it and up (rearing back), then over its head and
  // down in front; a bounce, held, and round again under its belly.
  buoyBonk: {
    anticT: 0.45,
    keys: [
      [0, { x: -0.08, rise: 0.06, pitch: -17, head: -11, bend: -22, d1: 0.56, pnA: -70, pnW: 1, fins: 0.4, spread: 0.6 }],
      [0.07, { x: 0.12, rise: -0.02, pitch: 17, head: 13, bend: 22, d1: 1.0, pnA: 30, pnW: 1, spread: 1, fins: 0.6 }, 'out'],
      [0.15, { x: 0.11, pitch: 13, head: 9, bend: 14, d1: 0.97 }, 'io'],
      [0.42, { x: 0.05, pitch: 4, head: 2, bend: 0, d1: 1.0, pnW: 0.5 }, 'io'],
      [0.78, { x: 0.01, pitch: 0, head: 0, d1: ROUND, pnW: 0, fins: 0.2, spread: 0.4 }, 'io'],
    ],
    bonk: 0.07,
  },
  // Whistle Blast: whistle up to its mouth with a big breath, then a sharp blast, sound rings
  // pushing out, the whistle let fall.
  whistleBlast: {
    anticT: 0.3,
    keys: [
      [0, { x: -0.05, rise: 0.03, pitch: -10, head: -6, d2: 1, pnA: 8, pnW: 1, fins: 0.3 }],
      [0.05, { x: 0.07, pitch: 4, head: 3, d2: 1, pnA: 8, pnW: 1, fins: 1, spread: 1, thrash: 0.45 }, 'out'],
      [0.32, { x: 0.06, pitch: 3, head: 2, d2: 1, fins: 0.8, thrash: 0.2 }],
      [0.52, { x: 0.02, pitch: 0, head: 0, d2: 0, pnW: 0, fins: 0.2, thrash: 0 }, 'io'],
      [0.82, {}, 'io'],
    ],
    blast: 0.05,
  },
  // Pleased with itself (after landing a hit): a proud little flipper clap, three claps.
  clap: {
    anticT: 0.08,
    keys: [
      [0, { pnW: 1, pfW: 1, pnA: 8, pfA: 56, rise: 0.02, pitch: -3 }],
      [0.1, { pnA: 32, pfA: 32, rise: 0.06, pitch: -5 }, 'in'],
      [0.2, { pnA: 8, pfA: 56 }, 'out'],
      [0.3, { pnA: 32, pfA: 32 }, 'in'],
      [0.4, { pnA: 8, pfA: 56 }, 'out'],
      [0.5, { pnA: 32, pfA: 32 }, 'in'],
      [0.75, { pnA: 30, pfA: 34, rise: 0.03, pitch: -2 }, 'io'],
      [1.05, {}, 'io'],
    ],
    claps: [0.1, 0.3, 0.5],
  },
};
const POOL = ['rescueRing', 'buoyBonk', 'whistleBlast'];
// (far: the ring; close up: the bonk and the whistle in turn; m.swingFar is set as its wind-up starts)
const pick = (m, a, st, pool) => {
  if (typeof m.move === 'string' && MOVES[m.move]) return m.move;
  const n = st.fsN ?? 0;
  if (m.swingFar === true) return 'rescueRing';
  if (m.swingFar === false) return n % 2 ? 'buoyBonk' : 'whistleBlast';
  return (pool ?? POOL)[n % (pool ?? POOL).length];
};

// ---------- Its act: four pieces, each whole in itself ----------
const PIECES = { whistle: 6.6, watch: 7.8, sunscreen: 7.2, rings: 6.4 };
const ORDER = ['whistle', 'watch', 'sunscreen', 'rings'];
const NONE = { pnA: 0, pnW: 0, d2: 0, x: 0, lift: 0, pitch: 0, head: 0, fins: 0, spread: 0, thrash: 0, gx: null, gy: null, face: 'calm', back: false };
// A piece's channels at `u` seconds into it.
function actAt(name, u) {
  const A = { ...NONE, piece: name, u };
  if (u > PIECES[name]) return A;
  if (name === 'whistle') {
    // it spots something: leaning in, peering; the whistle up; the blast; the point; it was only a
    // bubble; sheepish
    const spot = win(u, 0.8, 1.15, 2.7, 3.1);
    const up = win(u, 1.45, 1.8, 2.5, 2.85);
    const blast = win(u, 1.95, 2.02, 2.3, 2.55);
    const point = win(u, 2.8, 3.15, 4.3, 4.8);
    const shy = win(u, 4.95, 5.35, 6.1, 6.6);
    A.pnA = (8 * up - 14 * point + 120 * shy) / Math.max(1e-3, up + point + shy);
    A.pnW = Math.max(up, point, shy * 0.6);
    A.d2 = up;
    A.x = 1.2 * spot + 0.8 * point - 0.8 * shy;
    A.head = 4 * spot - 6 * blast + 3 * point + 7 * shy;
    A.pitch = -4 * blast + 2 * point + 3 * shy;
    A.lift = 0.9 * blast;
    A.fins = 0.6 * blast - 0.35 * shy;
    A.spread = 0.6 * blast;
    if (u > 0.8 && u < 4.4) [A.gx, A.gy] = [1, 0.15];
    if (u > 4.95 && u < 6.3) [A.gx, A.gy] = [-0.8, 0.7];
    A.face = u < 0.8 ? 'calm' : u < 1.6 ? 'spot' : u < 1.95 ? 'puff' : u < 2.6 ? 'whistle' : u < 4.3 ? 'stern' : u < 4.95 ? 'realise' : u < 6.4 ? 'sheepish' : 'calm';
    A.alarm = u;
  } else if (name === 'watch') {
    // a flipper up to the visor, scanning out one way, turning, the other way, a nod: all clear
    const salute = win(u, 0.3, 0.9, 6.3, 7.0);
    const nod = win(u, 2.05, 2.25, 2.3, 2.6) + win(u, 4.75, 4.95, 5.0, 5.3) + win(u, 5.85, 6.0, 6.05, 6.3) + win(u, 6.3, 6.45, 6.5, 6.75);
    A.pnA = -72;
    A.pnW = salute;
    A.head = -3 * salute + 8 * nod;
    A.pitch = (-2 + 2 * Math.sin((u - 0.9) * 1.6)) * salute;
    A.back = u >= 2.75 && u < 5.45;
    const scan = u < 2.75 ? sstep((u - 0.9) / 1.7) : sstep((u - 3.4) / 1.6);
    if (salute > 0.3 && !(u > 2.6 && u < 3.4) && u < 5.5) [A.gx, A.gy] = [mix(0.1, 1, scan), -0.45];
    A.face = u < 0.3 ? 'calm' : u < 2.75 ? 'focus' : u < 3.4 ? 'calm' : u < 5.5 ? 'focus' : u < 6.9 ? 'content' : 'calm';
  } else if (name === 'sunscreen') {
    // down to the tube in its strap; the squeeze; up to its head; the dab; rubbed in; a look up at
    // the sun that isn't there
    const reach = win(u, 0.2, 0.75, 1.2, 1.55);
    const raise = win(u, 1.35, 1.95, 4.3, 4.85);
    const rub = win(u, 2.45, 2.65, 4.05, 4.35);
    const sun = win(u, 5.0, 5.5, 6.5, 7.1);
    const nod = win(u, 6.0, 6.15, 6.2, 6.45);
    A.pnA = (202 * reach + (262 + 8 * Math.sin((u - 2.45) * 13) * rub) * raise) / Math.max(1e-3, reach + raise);
    A.pnW = Math.max(reach, raise);
    A.head = 3 * reach + 9 * raise + 6 * nod - 5 * sun;
    A.pitch = 3 * reach - 7 * raise - 8 * sun;
    A.lift = 0.6 * sun;
    if (u > 0.2 && u < 1.4) [A.gx, A.gy] = [-0.7, 0.8];
    else if (u > 1.4 && u < 2.4) [A.gx, A.gy] = [-0.4, -0.6];
    else if (u > 5.0 && u < 6.8) [A.gx, A.gy] = [0.4, -1];
    A.face = u < 0.2 ? 'calm' : u < 2.35 ? 'focus' : u < 4.4 ? 'content' : u < 5.0 ? 'calm' : u < 6.9 ? 'satisfied' : 'calm';
    // the blob: on its flipper's tip (squeezed out), then on its head, rubbed in to a sheen
    A.blobTip = u > 1.0 && u < 2.3 ? sstep((u - 1.0) / 0.3) : 0;
    A.blobHead = u >= 2.3 && u < 4.4 ? 1 - sstep((u - 2.6) / 1.8) * 0.95 : 0;
    A.sheen = u > 4.0 && u < 5.2 ? Math.sin(Math.PI * ((u - 4.0) / 1.2)) : 0;
  } else if (name === 'rings') {
    // a deep breath; a perfect ring; a little one shot through it; a proud wiggle
    const breath = win(u, 0.3, 1.05, 1.3, 1.55);
    const blow = win(u, 1.4, 1.5, 1.8, 2.1);
    const puff2 = win(u, 2.2, 2.3, 2.45, 2.7);
    const proud = win(u, 3.55, 3.8, 5.2, 5.7);
    A.lift = 1.6 * breath + 1.2 * proud;
    A.pitch = -5 * breath + 2 * blow + 1 * puff2 - 4 * proud;
    A.head = -3 * breath + 3 * blow + 2 * puff2;
    A.x = 0.5 * blow + 0.3 * puff2;
    A.fins = 0.3 * breath + 0.9 * proud;
    A.spread = 1 * proud;
    A.thrash = 0.55 * proud;
    if (u > 1.5 && u < 3.6) [A.gx, A.gy] = [1, -0.5];
    A.face = u < 0.3 ? 'calm' : u < 1.45 ? 'puff' : u < 2.05 ? 'blow' : u < 2.22 ? 'puff' : u < 2.6 ? 'blow' : u < 3.55 ? 'spot' : u < 5.7 ? 'proud' : 'calm';
  }
  return A;
}
// The two rings of the ring trick: [along ahead, up, radius, alpha] at `u` (or null).
function trickRings(u) {
  const out = [];
  if (u > 1.5 && u < 5.4) {
    const s = 3 + 4.2 * (u - 1.5) * (1 - 0.12 * clamp(u - 3.4, 0, 2));
    const al = sstep((u - 1.5) / 0.2) * (1 - sstep((u - 5.0) / 0.4));
    out.push([s, 0.35 * s, mix(1.8, 3.6, sstep((u - 1.5) / 1.6)), al, 0]);
  }
  if (u > 2.4 && u < 4.2) {
    const s = 2 + 9.8 * (u - 2.4);
    const al = sstep((u - 2.4) / 0.12) * (1 - sstep((u - 3.9) / 0.3));
    out.push([s, 0.35 * s, mix(0.9, 1.6, sstep((u - 2.4) / 0.5)), al, 1]);
  }
  return out;
}

// ---------- Where its kit is (in the body's frame, units before scale) ----------
// The float: at rest snug along its near flank under its flipper (d1 0, and 1.263 round again); swung
// round its middle on its strap: down under its belly, up behind and over its head, 1 down in front
// (pointing out like a club). `front` how much it sits on its near side (over the body, under the
// flipper) rather than swung round behind it.
const FLANK = [-3.2, 5.2];
function buoyAt(sk, d1) {
  const th = (90 + 285 * d1) * D2R;
  const c = Math.cos(th);
  const sn = Math.sin(th);
  const R = 13.5 + 7 * c - 3.5 * sn + 2.2 * Math.max(0, sn);
  const deg = 90 + 285 * d1;
  const rad = sstep((deg - 110) / 60) * (1 - sstep((deg - 400) / 40));
  const dist = Math.min(Math.abs(d1), Math.abs(d1 - ROUND));
  const onFlank = 1 - sstep(dist / 0.14);
  const phi = th + (Math.PI / 2) * (1 - rad);
  const s = sk.s;
  const P = (x, y) => add(sk.pivot, add(scl(sk.fwd, x * s), scl(sk.down, y * s)));
  const ctr = lerp2([R * c, R * sn], FLANK, onFlank);
  return { P, ctr, phi, c: P(ctr[0], ctr[1]), th, front: 1 - sstep((dist - 0.06) / 0.06) };
}
// The whistle: hanging at its throat on its cord (d2 0), up in the corner of its mouth (d2 1): its
// middle and the way its mouthpiece points, in the head's frame.
function whistleAt(d2) {
  const u = sstep(d2);
  const p0 = [-1.0, 10.2];
  const p2 = [-0.15, 4.75];
  const c = [3.2, 8.6];
  const q = [(1 - u) ** 2 * p0[0] + 2 * (1 - u) * u * c[0] + u * u * p2[0], (1 - u) ** 2 * p0[1] + 2 * (1 - u) * u * c[1] + u * u * p2[1]];
  return { p: q, an: mix(0.18, -0.62, u) };
}
// Where the mouth's corner sits for a smile length (the whistle goes in here).
const MOUTH_TIP = [6.05, 2.85];
const cornerOf = (f) => [MOUTH_TIP[0] - 4.1 * f.mw, 3.05 - 0.75 * f.ms];

// ---------- Its act, its moods and its face's easing (each frame, before drawing) ----------
function blPose(m, a, out, K, mv, mt) {
  const st = (a.mo.rig ??= {});
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const k = (rate) => 1 - Math.exp(-dt * rate);
  const now = a.now ?? 0;
  const alive = m.hp > 0;
  const napping = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now);
  // (a hit only counts once it has happened: a replay with the last hit still remembered is no hit)
  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.55;
  const fighting = (m.aggroUntil ?? 0) > now || Boolean(m.engaged);
  const swimming = (st.fsV ?? 0) > 6;
  const name = mv ? Object.keys(MOVES).find((nm) => MOVES[nm] === mv) ?? 'base' : null;
  // Calm: floating about with nothing else on (the act shows only then, fading in and out).
  const calmGoal = !mv && alive && !napping && !m.pose && !m.cine && !hurt && !fighting && !swimming ? 1 : 0;
  st.blCalm = mix(st.blCalm ?? 0, calmGoal, k(calmGoal ? 1.8 : 7));
  const cw = sstep(st.blCalm);
  // The piece it is playing: started as it settles; the next once one ends (a breath between), the
  // first in turn that fits the time it has (m.restUntil); none when nothing fits. Dropped once it's
  // no longer calm, or the clock went back (a stage's replay).
  let PC = st.blPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.4) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.blN ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.blN + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.25 };
        st.blN = (st.blN + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.blPiece = PC;
  const A = PC && PC.name ? actAt(PC.name, now - PC.t0) : { ...NONE, piece: null, u: 0 };
  // (the act on the channels, as much as it is calm)
  out.x += A.x * cw;
  out.lift += A.lift * cw;
  out.pitch += A.pitch * cw;
  out.head += A.head * cw;
  out.fins += A.fins * cw;
  out.spread += A.spread * cw;
  out.thrash += A.thrash * cw;
  if (A.pnW > 0.001) {
    out.pnA = mix(out.pnA, A.pnA, clamp(A.pnW * cw * 4, 0, 1));
    out.pnW = Math.max(out.pnW, A.pnW * cw);
  }
  out.d2 = Math.max(out.d2, A.d2 * cw);
  if (A.back && cw > 0.5) a.lookBack = true;
  // Its own marks: a "!" (and a tweet on the whistle) as it starts hunting you, a "?" when it loses you.
  if (fighting && alive && !st.blHunt) st.blBangAt = now;
  if (!fighting && st.blHunt && alive) st.blLostAt = now;
  st.blHunt = fighting && alive;
  const bang = now - (st.blBangAt ?? -9);
  const huh = now - (st.blLostAt ?? -9);
  const banging = alive && !mv && bang >= 0 && bang < 1.1;
  if (banging) {
    const up = win(bang, 0.0, 0.18, 0.6, 0.85);
    out.d2 = Math.max(out.d2, up);
    out.pnA = mix(out.pnA, 8, up);
    out.pnW = Math.max(out.pnW, up);
    out.pitch += -4 * win(bang, 0.15, 0.22, 0.45, 0.6);
    out.fins += 0.5 * win(bang, 0.15, 0.22, 0.45, 0.6);
  }
  // Hunting you (not in a move): on duty, flippers ready.
  if (fighting && alive && !mv && !hurt) {
    out.fins += 0.25;
    out.pitch += -1.5;
  }
  // Asleep: the visor tipped down a little (never over its eyes; they are shut anyway); beaten too.
  out.d3 = mix(out.d3 ?? 0, napping && alive ? 1 : !alive ? 0.6 : 0, 1);
  // Its mood: beaten, hurt, asleep, a move, its marks, a scene's mood, the act's, hunting, low, calm.
  const low = alive && m.hp < (m.def.hp ?? 1) * 0.25;
  let mood = 'calm';
  const cine = m.cine?.mood;
  if (!alive) mood = 'dizzy';
  else if (hurt || (name === 'base' && mv === K.moves.knockdown)) mood = 'hurt';
  else if (napping) mood = 'sleep';
  else if (name === 'rescueRing') mood = mt < 0 ? 'puff' : mt < 0.28 ? 'blow' : 'duty';
  else if (name === 'buoyBonk') mood = mt < 0.3 ? 'fierce' : 'duty';
  else if (name === 'whistleBlast') mood = mt < 0.4 ? 'whistle' : 'duty';
  else if (name === 'clap') mood = 'proud';
  else if (banging) mood = bang < 0.15 ? 'spot' : bang < 0.62 ? 'whistle' : 'stern';
  else if (alive && huh >= 0 && huh < 1.4) mood = 'huh';
  else if (cine === 'happy') mood = 'happy';
  else if (cine === 'sad') mood = 'sad';
  else if (cine === 'angry') mood = 'cross';
  else if (cine === 'talk' || m.talking) mood = 'talk';
  else if (cw > 0.5 && A.piece) mood = A.face;
  else if (fighting) mood = 'duty';
  else if (low) mood = 'worried';
  // (a dev page may hold a mood to look at it close up: tools/zz-pearldivercheck.html)
  if (typeof m.faceTest === 'string' && FACES[m.faceTest]) mood = m.faceTest;
  const F = FACES[mood] ?? FACES.calm;
  const f = (st.blF ??= { shut: 0, kinds: { blink: 1, happy: 0, sleep: 0, squeeze: 0, dizzy: 0 }, bt: 0, by: 0, bx: 0, ms: 0.55, mw: 1, mo: 0, ro: 0, pk: 0, bl: 0.5, ch: 0, gx: 0, gy: 0, sweat: 0 });
  let tgt = F;
  if (mood === 'talk') {
    const v = VOWELS[Math.floor((a.t ?? 0) * 7) % VOWELS.length];
    tgt = { ...F, ro: v[0], mo: v[1], ms: v[2] };
  }
  const fast = k(14);
  for (const key of FACE_KEYS) f[key] = mix(f[key], tgt[key], fast);
  // (a blink every few seconds while its eyes are open: a quick close, never a lid sliding down)
  const t = (a.t ?? 0) + ((m.uid ?? 0) % 5) * 0.9;
  const blink = F.sh < 0.5 ? win(t % 4.3, 3.9, 3.96, 4.02, 4.12) : 0;
  const shutGoal = Math.max(F.sh, blink);
  f.shut = mix(f.shut, shutGoal, k(F.sh > 0.5 || blink > 0 ? 26 : 18));
  const kind = F.sh > 0.5 ? F.kind : 'blink';
  for (const kd of KINDS) f.kinds[kd] = mix(f.kinds[kd], kd === kind ? 1 : 0, k(16));
  // where it looks: the act's, else ahead (hunting) or about it
  let gx = 0;
  let gy = 0;
  if (cw > 0.5 && A.gx !== null) [gx, gy] = [A.gx, A.gy];
  else if (fighting || mv) [gx, gy] = [1, 0];
  else if (mood === 'worried' || mood === 'sad') [gx, gy] = [-0.3, 0.6];
  f.gx = mix(f.gx, gx, k(16));
  f.gy = mix(f.gy, gy, k(16));
  f.sweat = mix(f.sweat, mood === 'sheepish' || low ? 1 : 0, k(5));
  a.blF = f;
  a.blMood = mood;
  a.blAct = { ...A, cw };
  a.blBang = banging ? bang : -1;
  a.blHuh = alive && !mv && huh >= 0 && huh < 1.4 ? huh : -1;
  a.blGloat = name === 'clap' ? mt : -1;
  a.blLow = low;
  a.blNap = napping && alive;
  a.blMove = mv ? { name, t: mt } : null;
  // (after the bonk the buoy has gone right round: its swing taken back to rest, which is the same
  // place, so the spring never swings it back over its head)
  // (going on round past the bonk, the goal and the swing are taken back a whole turn together, and
  // stay so till the move is done; a new wind-up from there starts from rest; so it never swings back
  // over its head the wrong way)
  const raw = out.d1;
  if (raw < 0.9) {
    if (!st.blD1Off && st.d1 && st.d1.x > 1.05) st.d1.x -= ROUND;
    st.blD1Off = 0;
  } else if (!st.blD1Off && raw > 1.2 && st.d1 && st.d1.x > 1.05) {
    st.blD1Off = ROUND;
    st.d1.x -= ROUND;
  }
  out.d1 = raw - (st.blD1Off ?? 0);
}

// ---------- Drawing it ----------
// Its markings on the body (clipped to it): the neck crease, the strap with its pearl clasp, the
// sunscreen tube's cap peeking out of the strap, the whistle's cord round its neck.
function blPaint(ctx, a, sk, K) {
  const s = K.s;
  const at = (along, off) => sk.along(along * s, off * s);
  // the neck crease: a soft fold behind its head, deeper as it nods down
  const nod = clamp((sk.S.head ?? 0) / 14, -1, 1);
  const cr = [at(5.2, 7.6), at(4.3, 2), at(4.2, -2.5), at(4.8, -7.8)];
  ctx.save();
  ctx.globalAlpha *= clamp(0.3 + 0.4 * nod, 0.1, 0.75);
  stroke(ctx, [cr[0], cr[1], lerp2(cr[1], cr[2], 0.5), cr[2], cr[3]], 0.9 * s, lit(a, K.C.sh));
  ctx.restore();
  // the whistle's cord round its neck (its near side)
  const cg = ctx.createLinearGradient(...at(5.2, -4.2), ...at(4.7, -8.6));
  cg.addColorStop(0, lit(a, BL.cord, 0));
  cg.addColorStop(0.5, lit(a, BL.cord, 0.9));
  ctx.save();
  ctx.strokeStyle = cg;
  ctx.lineWidth = 0.45 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...at(5.2, -4.2));
  ctx.quadraticCurveTo(...at(4.85, -6.6), ...at(4.7, -8.6));
  ctx.stroke();
  ctx.restore();
  // the strap: ONE coral band, from over its back behind its head, diagonally down to the float on
  // its flank, a soft lighter line down its middle
  const A0 = [6.2, 10.8];
  const A1 = [11.8, -3.0];
  const AM = [8.4, 3.6];
  const w = 1.2;
  ctx.beginPath();
  ctx.moveTo(...at(A0[0] - w, A0[1]));
  ctx.quadraticCurveTo(...at(AM[0] - w, AM[1]), ...at(A1[0] - w, A1[1]));
  ctx.lineTo(...at(A1[0] + w, A1[1]));
  ctx.quadraticCurveTo(...at(AM[0] + w, AM[1]), ...at(A0[0] + w, A0[1]));
  ctx.closePath();
  ctx.fillStyle = lit(a, BL.coral.base);
  ctx.fill();
  ctx.save();
  ctx.globalAlpha *= 0.55;
  stroke(ctx, [at(A0[0] - 0.3, A0[1]), at(AM[0] - 0.3, AM[1]), at(A1[0] - 0.3, A1[1])], 0.6 * s, lit(a, BL.coral.lt));
  ctx.restore();
  // the sunscreen tube tucked behind the float: its aqua cap peeking out over the float's back
  const tube = at(16.2, -1.6);
  ctx.save();
  ctx.globalAlpha *= buoyAt(sk, clamp(sk.S.d1 ?? 0, -0.3, 1.5)).front;
  ell(ctx, tube[0], tube[1], 0.95 * s, 0.75 * s);
  ctx.fillStyle = lit(a, BL.aqua.base);
  ctx.fill();
  ell(ctx, tube[0] - 0.25 * s, tube[1] - 0.25 * s, 0.4 * s, 0.25 * s);
  ctx.fillStyle = lit(a, BL.aqua.lt);
  ctx.fill();
  ctx.restore();
  // the pearl clasp: a coral rosette with a pearl in it
  const pc = at(8.6, 3.4);
  for (let i = 0; i < 6; i++) {
    const q = (i / 6) * TAU + 0.3;
    ell(ctx, pc[0] + Math.cos(q) * 1.05 * s, pc[1] + Math.sin(q) * 1.05 * s, 0.75 * s, 0.75 * s);
    ctx.fillStyle = lit(a, BL.coral.sh);
    ctx.fill();
  }
  ell(ctx, pc[0], pc[1], 1.25 * s, 1.25 * s);
  ctx.fillStyle = lit(a, BL.pearl.ink);
  ctx.fill();
  ell(ctx, pc[0], pc[1], 1.05 * s, 1.05 * s);
  const g = ctx.createRadialGradient(pc[0] - 0.4 * s, pc[1] - 0.45 * s, 0, pc[0], pc[1], 1.1 * s);
  g.addColorStop(0, lit(a, '#ffffff'));
  g.addColorStop(0.6, lit(a, BL.pearl.base));
  g.addColorStop(1, lit(a, BL.pearl.sh));
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, pc[0] - 0.38 * s, pc[1] - 0.42 * s, 0.3 * s, 0.22 * s, -0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

// Its face (in its head's frame: x ahead, y down, units).
const EYE_N = [-1.05, -0.7, 1.7, 1.7];
const EYE_F = [3.75, -0.85, 1.15, 1.55];
function blFace(ctx, a, sk, K) {
  const f = a.blF;
  if (!f) return;
  K.headFrame(ctx, a);
  const t = a.t ?? 0;
  const A = a.blAct;
  // the sunscreen on its head: a white dab, rubbed in to a sheen
  if (A && A.piece === 'sunscreen' && A.cw > 0.02) {
    const b = A.blobHead * A.cw;
    if (b > 0.01) {
      const rub = A.u > 2.45 ? Math.sin((A.u - 2.45) * 13) * 0.35 : 0;
      ctx.save();
      ctx.globalAlpha *= clamp(b * 1.4, 0, 1);
      ctx.beginPath();
      for (const [dx, dy, r] of [[0, 0, 1.0], [0.85, 0.3, 0.75], [-0.75, 0.35, 0.7], [0.1, -0.55, 0.65]]) {
        const rr = r * (0.45 + 0.55 * b);
        ctx.moveTo(-5.1 + dx + rub + rr, -5.3 + dy);
        ctx.arc(-5.1 + dx + rub, -5.3 + dy, rr, 0, TAU);
      }
      ctx.fillStyle = lit(a, '#ffffff');
      ctx.fill('nonzero');
      ctx.strokeStyle = lit(a, '#c9d3ec', 0.9);
      ctx.lineWidth = 0.3;
      ctx.stroke();
      ctx.restore();
    }
    if (A.sheen > 0.01) glow(ctx, -5.1, -5.3, 3.2, '#ffffff', 0.7 * A.sheen * A.cw);
  }
  // rosy cheeks (fuller with a breath held)
  const puff = 1 + 0.3 * f.ch;
  glow(ctx, -1.3, 2.05, 2.1 * puff, BL.blush, 0.5 * f.bl + 0.2 * f.ch);
  glow(ctx, 4.0, 1.75, 1.5 * puff, BL.blush, 0.42 * f.bl + 0.15 * f.ch);
  // the eyes
  const gx = f.gx * 0.34;
  const gy = f.gy * 0.3;
  const closedW = sstep((f.shut - 0.25) / 0.5);
  const eye = (x, y, rx, ry, far) => {
    const outer = far ? 1 : -1;
    if (closedW > 0.01) {
      ctx.save();
      ctx.globalAlpha *= closedW;
      const ink = lit(a, BL.eye.lash);
      const K2 = f.kinds;
      if (K2.happy > 0.01) {
        ctx.globalAlpha *= K2.happy;
        stroke(ctx, [[x - rx, y + 0.35], [x, y - ry * 1.25], [x + rx, y + 0.35]], 0.5, ink);
        ctx.globalAlpha /= K2.happy;
      }
      const lineW = K2.sleep + K2.blink;
      if (lineW > 0.01) {
        ctx.globalAlpha *= Math.min(1, lineW);
        stroke(ctx, [[x - rx, y - 0.15], [x, y + ry * 0.85], [x + rx, y - 0.15]], 0.5, ink);
        stroke(ctx, [[x + outer * rx * 0.95, y - 0.1], [x + outer * rx * 1.25, y - 0.2], [x + outer * rx * 1.45, y - 0.55]], 0.36, ink);
        ctx.globalAlpha /= Math.min(1, lineW);
      }
      if (K2.squeeze > 0.01) {
        ctx.globalAlpha *= K2.squeeze;
        const sg = far ? 1 : -1;
        stroke(ctx, [[x + sg * rx, y - ry * 0.65], [x - sg * rx * 0.05, y - ry * 0.12], [x - sg * rx * 0.8, y + 0.05]], 0.5, ink);
        stroke(ctx, [[x - sg * rx * 0.8, y + 0.05], [x - sg * rx * 0.05, y + ry * 0.25], [x + sg * rx, y + ry * 0.65]], 0.5, ink);
        ctx.globalAlpha /= K2.squeeze;
      }
      if (K2.dizzy > 0.01) {
        ctx.globalAlpha *= K2.dizzy;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 0.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 2 + t * 4 * (far ? 1 : -1);
          const r = (i / 26) * rx * 0.95;
          const p = [x + Math.cos(an) * r, y + Math.sin(an) * r * (ry / rx)];
          i ? ctx.lineTo(...p) : ctx.moveTo(...p);
        }
        ctx.stroke();
        ctx.globalAlpha /= K2.dizzy;
      }
      ctx.restore();
    }
    const openW = 1 - closedW;
    if (openW <= 0.01) return;
    ctx.save();
    ctx.globalAlpha *= openW;
    // a soft dark rim, then the glossy blue-grey iris (darker on top, lighter low down)
    const g = ctx.createLinearGradient(x, y - ry, x, y + ry);
    g.addColorStop(0, lit(a, BL.eye.top));
    g.addColorStop(0.5, lit(a, BL.eye.mid));
    g.addColorStop(1, lit(a, BL.eye.low));
    ell(ctx, x, y, rx, ry);
    ctx.fillStyle = g;
    ctx.fill();
    // a soft gleam low in it
    ell(ctx, x - rx * 0.05, y + ry * 0.5, rx * 0.62, ry * 0.3);
    ctx.fillStyle = 'rgba(190,214,240,0.35)';
    ctx.fill();
    // the glints: one big and round up front, one small low behind (steady)
    ell(ctx, x + rx * 0.33, y - ry * 0.38, rx * 0.4, rx * 0.4);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ell(ctx, x - rx * 0.4, y + ry * 0.4, rx * 0.17, rx * 0.17);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    // the lash line: neat, hugging the top of the eye (never over the iris), a flick at its outer end
    const ink = lit(a, BL.eye.lash);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.42;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(x, y, rx + 0.34, ry + 0.34, 0, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    const e0 = outer < 0 ? Math.PI * 1.1 : Math.PI * 1.9;
    const ex = x + Math.cos(e0) * (rx + 0.34);
    const ey = y + Math.sin(e0) * (ry + 0.34);
    stroke(ctx, [[ex, ey], [ex + outer * 0.45, ey - 0.15], [ex + outer * 0.75, ey - 0.6]], 0.36, ink);
    ctx.restore();
  };
  eye(EYE_N[0] + gx, EYE_N[1] + gy, EYE_N[2], EYE_N[3], false);
  eye(EYE_F[0] + gx * 0.8, EYE_F[1] + gy, EYE_F[2], EYE_F[3], true);
  // the brows: soft round dashes, tilted by its mood (+ knit toward the middle, - worried)
  const brow = (cx, by, inner, len, side) => {
    const lift = f.by * 0.85 + side * f.bx * 0.55;
    const yi = by - lift + f.bt * 0.7;
    const yo = by - lift - f.bt * 0.3;
    const xi = cx + (inner * len) / 2;
    const xo = cx - (inner * len) / 2;
    stroke(ctx, [[xo, yo], [cx, Math.min(yi, yo) - 0.45], [xi, yi]], 0.8, lit(a, BL.brow));
  };
  brow(EYE_N[0] + 0.1, -3.4, 1, 2.3, 1);
  brow(EYE_F[0] + 0.05, -3.5, -1, 1.7, -1);
  // the mouth: a smile line along its beak, from its width, smile and openness (so every change eases)
  const S0 = MOUTH_TIP;
  const K0 = cornerOf(f);
  const M = [(S0[0] + K0[0]) / 2, 3.25 + 0.55 * f.ms];
  if (f.mo > 0.06) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(...S0);
    ctx.quadraticCurveTo(M[0], M[1] - 0.1, ...K0);
    ctx.quadraticCurveTo(M[0] - 0.3, M[1] + 0.25 + o * 1.5, ...S0);
    ctx.fillStyle = lit(a, BL.mouth);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, M[0] - 0.2, M[1] + 0.3 + o * 1.25, 1.1, o * 0.75);
    ctx.fillStyle = lit(a, BL.tongue);
    ctx.fill();
    ctx.restore();
  }
  const lineAl = 1 - 0.8 * clamp(f.ro, 0, 1);
  if (lineAl > 0.02) {
    ctx.save();
    ctx.globalAlpha *= lineAl;
    stroke(ctx, [S0, M, K0], 0.5, lit(a, BL.line));
    // a little dimple tick at the corner while it smiles
    if (f.ms > 0.3) {
      ctx.globalAlpha *= clamp((f.ms - 0.3) / 0.4, 0, 1);
      stroke(ctx, [K0, [K0[0] - 0.3, K0[1] - 0.15], [K0[0] - 0.35, K0[1] - 0.55]], 0.4, lit(a, BL.line));
    }
    ctx.restore();
  }
  // rounded to blow (an O at the beak's tip, its lips pushed out)
  if (f.ro > 0.04) {
    const r = f.ro;
    const ox = 6.3;
    const oy = 2.85;
    ell(ctx, ox, oy, 0.45 + 0.5 * r, 0.5 + 0.62 * r);
    ctx.fillStyle = lit(a, '#f7dde7');
    ctx.fill();
    ctx.strokeStyle = lit(a, BL.line, 0.7);
    ctx.lineWidth = 0.3;
    ctx.stroke();
    ell(ctx, ox + 0.05, oy + 0.05, 0.22 + 0.32 * r, 0.26 + 0.42 * r);
    ctx.fillStyle = lit(a, '#b25f80');
    ctx.fill();
  }
  // puckered round the whistle at the corner of its mouth
  if (f.pk > 0.04) {
    ell(ctx, K0[0], K0[1], 0.62 * f.pk, 0.7 * f.pk);
    ctx.fillStyle = lit(a, '#f7dde7');
    ctx.fill();
    ctx.strokeStyle = lit(a, BL.line, 0.8 * f.pk);
    ctx.lineWidth = 0.3;
    ctx.stroke();
  }
  // a bead of sweat by its head (sheepish, or low on health)
  if (f.sweat > 0.05) {
    const u = ((a.t ?? 0) * 0.6) % 1;
    const x = -4.3;
    const y = -3.6 + sstep(u) * 1.8;
    ctx.save();
    ctx.globalAlpha *= f.sweat * Math.sin(Math.PI * u);
    ctx.beginPath();
    ctx.moveTo(x, y - 1.2);
    ctx.quadraticCurveTo(x + 0.95, y + 0.3, x, y + 0.9);
    ctx.quadraticCurveTo(x - 0.95, y + 0.3, x, y - 1.2);
    ctx.fillStyle = 'rgba(206,240,255,0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,170,212,0.85)';
    ctx.lineWidth = 0.28;
    ctx.stroke();
    ell(ctx, x - 0.25, y + 0.15, 0.2, 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
}

// The sun visor on its melon: a band hugging the top of its head and a soft brim out front; tipped
// down a little asleep (never over its eyes).
function blVisor(ctx, a, mode, K) {
  K.headFrame(ctx, a);
  const tip = clamp(a.fk.S.d3 ?? 0, 0, 1) * 7 * D2R;
  ctx.translate(-4.6, -10.2);
  ctx.rotate(tip);
  ctx.translate(4.6, 10.2);
  const band = [[-4.6, -10.25], [-1.5, -10.35], [2.0, -10.0], [4.1, -8.8], [5.35, -7.1]];
  const brim = () => {
    ctx.beginPath();
    ctx.moveTo(3.0, -8.9);
    ctx.bezierCurveTo(5.4, -9.4, 8.4, -8.0, 9.1, -6.4);
    ctx.bezierCurveTo(8.0, -5.7, 6.2, -5.9, 4.9, -6.2);
    ctx.closePath();
  };
  const bandPath = () => {
    ctx.beginPath();
    ctx.moveTo(...band[0]);
    for (let i = 1; i < band.length - 1; i++) ctx.quadraticCurveTo(...band[i], ...lerp2(band[i], band[i + 1], 0.5));
    ctx.lineTo(...band[band.length - 1]);
  };
  if (mode === 'line') {
    bandPath();
    ctx.strokeStyle = BL.aqua.ink;
    ctx.lineWidth = 2.4 + 2 / K.s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    brim();
    ctx.lineWidth = 2 / K.s;
    ctx.stroke();
    return;
  }
  bandPath();
  ctx.strokeStyle = lit(a, BL.aqua.base);
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  bandPath();
  ctx.strokeStyle = lit(a, BL.aqua.lt, 0.9);
  ctx.lineWidth = 0.7;
  ctx.translate(0, -0.55);
  ctx.stroke();
  ctx.translate(0, 0.55);
  brim();
  const g = ctx.createLinearGradient(0, -9, 0, -5.8);
  g.addColorStop(0, lit(a, BL.aqua.lt));
  g.addColorStop(0.55, lit(a, BL.aqua.base));
  g.addColorStop(1, lit(a, BL.aqua.sh));
  ctx.fillStyle = g;
  ctx.fill();
  stroke(ctx, [[4.1, -8.55], [6.6, -8.5], [8.4, -6.8]], 0.45, lit(a, '#ffffff', 0.85));
}

// The whistle (pearl-white) on its cord: at its throat, or up in the corner of its mouth.
function blWhistle(ctx, a, mode, K) {
  K.headFrame(ctx, a);
  const d2 = clamp(a.fk.S.d2 ?? 0, 0, 1);
  const sw = (1 - d2) * (Math.sin((a.t ?? 0) * 1.9) * 0.08 + clamp(a.fk.S.thrash ?? 0, 0, 1) * 0.1);
  const { p, an } = whistleAt(d2);
  const ring = [p[0] - Math.cos(an + sw) * 1.9, p[1] - Math.sin(an + sw) * 1.9];
  const knot = [-3.3, 8.7];
  // the cord down from round its neck to the whistle's ring (slack as it comes up)
  if (mode === 'fill') {
    const mid = [mix(knot[0], ring[0], 0.5) - d2 * 0.6, mix(knot[1], ring[1], 0.5) + 0.6 + d2 * 1.4];
    stroke(ctx, [knot, mid, ring], 0.5, lit(a, BL.cord));
  }
  ctx.translate(p[0], p[1]);
  ctx.rotate(an + sw);
  const shape = () => {
    ctx.beginPath();
    // the round chamber, the mouthpiece out front, the ring behind
    ctx.moveTo(1.15, 0);
    ctx.arc(0, 0.15, 1.15, 0, TAU);
    ctx.moveTo(0.3, -1.0);
    ctx.lineTo(2.7, -0.95);
    ctx.quadraticCurveTo(3.0, -0.95, 3.0, -0.6);
    ctx.lineTo(3.0, -0.25);
    ctx.lineTo(0.6, 0.0);
    ctx.closePath();
    ctx.moveTo(-1.35, -0.1);
    ctx.arc(-1.75, -0.1, 0.42, 0, TAU);
  };
  shape();
  if (mode === 'line') {
    ctx.strokeStyle = BL.pearl.ink;
    ctx.lineWidth = 1.6 / K.s;
    ctx.lineJoin = 'round';
    ctx.stroke();
    return;
  }
  ctx.fillStyle = lit(a, BL.pearl.base);
  ctx.fill('nonzero');
  ell(ctx, 0.2, 0.55, 0.85, 0.6);
  ctx.fillStyle = lit(a, BL.pearl.sh, 0.8);
  ctx.fill();
  ell(ctx, -0.3, -0.25, 0.42, 0.3, -0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, -1.75, -0.1, 0.18, 0.18);
  ctx.fillStyle = lit(a, BL.pearl.sh);
  ctx.fill();
  // a soft coral bead on its ring (the livery)
  ell(ctx, -1.75, 0.35, 0.28, 0.28);
  ctx.fillStyle = lit(a, BL.coral.base);
  ctx.fill();
}

// The rescue float on its strap: a plump torpedo buoy, rounded at both ends, one soft white band, a
// little rope loop at its front end. At rest it is drawn on its near side (`front`: over the body,
// under the flipper); swung round, behind its body (so it never covers its face), crossfading between
// the two while it is down under its belly.
const blBuoy = (front) => (ctx, a, mode, K) => {
  const sk = a.fk;
  const S = sk.S;
  const d1 = clamp(S.d1 ?? 0, -0.3, 1.5);
  const B = buoyAt(sk, d1);
  const w = front ? B.front : 1 - B.front;
  if (w <= 0.01) return;
  ctx.globalAlpha *= w;
  const s = K.s;
  const hl = 5.3;
  const r = 2.55;
  // a soft sway at rest (its breath), none while swung
  const rest = B.front;
  const sway = rest * Math.sin((a.t ?? 0) * 1.3 + 0.6) * 0.04;
  const phi = B.phi + sway;
  const ax = [Math.cos(phi), Math.sin(phi)];
  const inner = [B.ctr[0] - ax[0] * hl, B.ctr[1] - ax[1] * hl];
  // swung round: the strap's lanyard from inside its body out to the float's near end
  if (mode === 'fill' && !front) {
    const r0 = [B.ctr[0] * 0.35, B.ctr[1] * 0.35];
    const mid = lerp2(r0, inner, 0.5);
    stroke(ctx, [B.P(...r0), B.P(mid[0], mid[1] + 0.8), B.P(...inner)], 0.75 * s, lit(a, BL.coral.sh));
  }
  // (the float drawn in the body's frame, turned along its own way)
  ctx.save();
  const c = B.c;
  const fx = sk.fwd;
  const dn = sk.down;
  ctx.transform(fx[0] * s, fx[1] * s, dn[0] * s, dn[1] * s, c[0], c[1]);
  ctx.rotate(phi);
  const pts = [[-hl, 0], [-hl + 0.4, -r * 0.7], [-hl + 1.4, -r * 0.96], [0, -r], [hl - 1.4, -r * 0.96], [hl - 0.4, -r * 0.7], [hl, 0], [hl - 0.4, r * 0.7], [hl - 1.4, r * 0.96], [0, r], [-hl + 1.4, r * 0.96], [-hl + 0.4, r * 0.7]];
  const loop = [-hl - 0.85, 0];
  ctx.beginPath();
  K.loopPath(ctx, pts);
  if (mode === 'line') {
    ctx.strokeStyle = BL.coral.ink;
    ctx.lineWidth = 2 / s;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ell(ctx, loop[0], loop[1], 1.0, 0.8);
    ctx.strokeStyle = BL.aqua.ink;
    ctx.lineWidth = 0.55 + 1.6 / s;
    ctx.stroke();
    ctx.restore();
    return;
  }
  // (on its flank, over the body: its own soft edge drawn here, under its fill, so only the outer half
  // shows, as the outline pass would where nothing covers it)
  if (front) {
    ctx.strokeStyle = lit(a, BL.coral.ink);
    ctx.lineWidth = 2 / s;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ell(ctx, loop[0], loop[1], 1.0, 0.8);
    ctx.strokeStyle = lit(a, BL.aqua.ink);
    ctx.lineWidth = 0.55 + 1.6 / s;
    ctx.stroke();
    ctx.fillStyle = lit(a, BL.coral.base);
    ctx.beginPath();
    K.loopPath(ctx, pts);
    ctx.fill();
  }
  // the rope loop (a soft aqua rope), behind the float's end
  ell(ctx, loop[0], loop[1], 1.0, 0.8);
  ctx.strokeStyle = lit(a, BL.cord);
  ctx.lineWidth = 0.55;
  ctx.stroke();
  ctx.beginPath();
  K.loopPath(ctx, pts);
  ctx.save();
  ctx.clip();
  // round and plump: lit along the top, shaded below (one light: up front), a soft rim low down
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, lit(a, BL.coral.lt));
  g.addColorStop(0.4, lit(a, BL.coral.base));
  g.addColorStop(1, lit(a, BL.coral.sh));
  ctx.fillStyle = g;
  ctx.fillRect(-hl - 1, -r - 1, hl * 2 + 2, r * 2 + 2);
  glow(ctx, hl - 0.6, 0.6, 2.4, BL.coral.deep, 0.35);
  glow(ctx, -hl + 0.6, 0.6, 2.4, BL.coral.deep, 0.3);
  // one soft white band (a lifeguard's float), its edges soft
  const wb = ctx.createLinearGradient(-2.3, 0, -0.5, 0);
  wb.addColorStop(0, lit(a, '#ffffff', 0));
  wb.addColorStop(0.25, lit(a, '#ffffff', 0.9));
  wb.addColorStop(0.75, lit(a, '#ffffff', 0.9));
  wb.addColorStop(1, lit(a, '#ffffff', 0));
  ctx.fillStyle = wb;
  ctx.fillRect(-2.3, -r - 1, 1.8, r * 2 + 2);
  // a soft shine along its top
  stroke(ctx, [[-hl + 1.6, -r * 0.55], [0.4, -r * 0.72], [hl - 1.7, -r * 0.5]], 0.6, lit(a, '#ffffff', 0.7));
  ctx.restore();
  // the rope's knot on the float's nose
  ell(ctx, -hl + 0.15, 0, 0.45, 0.5);
  ctx.fillStyle = lit(a, BL.aqua.sh);
  ctx.fill();
  ctx.restore();
};

// ---------- Its effects ----------
// A bubble ring: a soft see-through torus seen a little side on (`tilt` its lean), a glint along its
// top; `stripes` its life-ring bands (the Rescue Ring's).
function ringAt(ctx, x, y, r, tilt, al, stripes = 0) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(tilt);
  const rx = r * 0.55;
  const ry = r;
  const th = r * 0.42;
  glow(ctx, 0, 0, r * 1.5, '#cfefff', 0.35);
  ctx.lineCap = 'round';
  ell(ctx, 0, 0, rx, ry);
  ctx.strokeStyle = BL.ring.edge;
  ctx.lineWidth = th + Math.max(0.5, r * 0.12);
  ctx.stroke();
  ell(ctx, 0, 0, rx, ry);
  ctx.strokeStyle = 'rgba(234,249,255,0.92)';
  ctx.lineWidth = th;
  ctx.stroke();
  if (stripes > 0.01) {
    ctx.strokeStyle = rgba(BL.coral.base, 0.85 * stripes);
    ctx.lineWidth = th * 0.92;
    for (let i = 0; i < 4; i++) {
      const q = (i / 4) * TAU + Math.PI / 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, q - 0.32, q + 0.32);
      ctx.stroke();
    }
  }
  // the inner shade and the glint
  ctx.strokeStyle = 'rgba(160,214,236,0.55)';
  ctx.lineWidth = th * 0.35;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx - th * 0.3, ry - th * 0.3, 0, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = th * 0.38;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx + th * 0.12, ry + th * 0.12, 0, Math.PI * 1.18, Math.PI * 1.55);
  ctx.stroke();
  ctx.restore();
}
function bubble(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(232,248,255,0.6)';
  ctx.fill();
  ctx.strokeStyle = BL.ring.edge;
  ctx.lineWidth = Math.max(0.3, r * 0.2);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(0.3, r * 0.24);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.6, -2.5, -1.6);
  ctx.stroke();
  ctx.restore();
}
// a soft pop: a few short white rays and a sparkle
function pop(ctx, x, y, r, u) {
  if (u <= 0 || u >= 1) return;
  ctx.save();
  ctx.globalAlpha *= 1 - u;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(0.35, r * 0.22);
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const q = (i / 5) * TAU + 0.4;
    const r0 = r * (0.5 + u * 1.3);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(q) * r0, y + Math.sin(q) * r0);
    ctx.lineTo(x + Math.cos(q) * (r0 + r * 0.55), y + Math.sin(q) * (r0 + r * 0.55));
    ctx.stroke();
  }
  ctx.restore();
  sparkle(ctx, x, y, r * 0.9 * (1 - u), rgba('#fff6c8', 1 - u));
}
// a music note (round head, a stem with a soft flag)
function note(ctx, x, y, k, al, col) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, 1.15 * k, 0.88 * k, -0.4);
  ctx.fillStyle = col;
  ctx.fill();
  stroke(ctx, [[x + 1 * k, y - 0.2 * k], [x + 1 * k, y - 2 * k], [x + 1 * k, y - 3.6 * k]], 0.48 * k, col);
  stroke(ctx, [[x + 1 * k, y - 3.6 * k], [x + 2.2 * k, y - 3.1 * k], [x + 2.1 * k, y - 1.9 * k]], 0.48 * k, col);
  ctx.restore();
}
// A soft "tweet": a little ring of sound pushing out from the whistle, a note and a sparkle off it.
let UNFLIP = false;
function tweet(ctx, c, u, big, s) {
  if (u <= 0 || u >= 1) return;
  const r = (big ? 2.5 : 1.6) * s + (big ? 9 : 6) * s * sstep(u);
  ctx.save();
  ctx.globalAlpha *= (1 - u) * 0.9;
  ctx.lineCap = 'round';
  for (const [w, col] of [[1.5 * s, BL.ring.edge], [0.9 * s, '#ffffff']]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    for (const q of [-0.5, 0.5]) {
      ctx.beginPath();
      ctx.arc(c[0], c[1], r, q - 0.55, q + 0.55);
      ctx.stroke();
    }
  }
  ctx.restore();
  upright(ctx, c[0] + r * 0.9, c[1] - r * 0.9 - u * 2 * s, UNFLIP, () => note(ctx, 0, 0, 0.55 * s, (1 - u) * 0.95, BL.coral.sh));
  sparkle(ctx, c[0] + r * 0.4, c[1] - r * 0.3, 1.6 * s * (1 - u), rgba('#fff6c8', 1 - u));
}
// A round mark over its head ("!" or "?"), popping in with a little overshoot and settling.
function mark(ctx, x, y, kind, e, len, s, unflip) {
  const inn = e < 0.25 ? easeOut(e / 0.25) * (1 + 0.18 * Math.sin(Math.PI * clamp(e / 0.25, 0, 1))) : 1;
  const k = inn * (1 - sstep((e - (len - 0.25)) / 0.25));
  if (k <= 0.01) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2 * s);
  if (unflip) ctx.scale(-1, 1);
  ctx.globalAlpha *= Math.min(1, k * 1.4);
  const R = 4.4 * s * Math.min(1, 0.6 + 0.4 * k);
  ell(ctx, 0, 0, R, R);
  ctx.fillStyle = 'rgba(244,252,255,0.96)';
  ctx.fill();
  ctx.strokeStyle = kind === '!' ? BL.coral.ink : '#8f86c4';
  ctx.lineWidth = 0.9 * s;
  ctx.stroke();
  // a glint on the bubble and a little tail bubble under it
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.7 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.72, -2.6, -1.9);
  ctx.stroke();
  bubble(ctx, -R * 0.55, R * 1.25, 0.9 * s, 1);
  const col = kind === '!' ? BL.coral.ink : '#8f86c4';
  if (kind === '!') {
    stroke(ctx, [[0, -R * 0.55], [0.05 * s, -R * 0.1], [0, R * 0.18]], 1.25 * s, col);
    ell(ctx, 0, R * 0.52, 0.72 * s, 0.72 * s);
    ctx.fillStyle = col;
    ctx.fill();
  } else {
    stroke(ctx, [[-R * 0.33, -R * 0.25], [-R * 0.3, -R * 0.62], [0, -R * 0.62], [R * 0.4, -R * 0.6], [R * 0.32, -R * 0.22], [R * 0.22, -R * 0.02], [0, R * 0.05], [-0.05 * s, R * 0.1], [0, R * 0.22]], 1.1 * s, col);
    ell(ctx, 0, R * 0.55, 0.68 * s, 0.68 * s);
    ctx.fillStyle = col;
    ctx.fill();
  }
  ctx.restore();
}
// (draws `fn` at (x, y) read the right way round, however it faces)
function upright(ctx, x, y, unflip, fn) {
  ctx.save();
  ctx.translate(x, y);
  if (unflip) ctx.scale(-1, 1);
  fn();
  ctx.restore();
}
// a soft rounded z in a little bubble
function zee(ctx, x, y, k, al, s) {
  if (al <= 0.01) return;
  bubble(ctx, x, y, 2.3 * k * s, al * 0.8);
  ctx.save();
  ctx.globalAlpha *= al;
  const w = 1.1 * k * s;
  stroke(ctx, [[x - w, y - w], [x, y - w * 1.05], [x + w, y - w], [x, y], [x - w, y + w]], 0.55 * k * s, '#8f9bd0');
  stroke(ctx, [[x - w, y + w], [x, y + w * 1.05], [x + w, y + w]], 0.55 * k * s, '#8f9bd0');
  ctx.restore();
}

function blFx(ctx, m, a, K) {
  const sk = a.fk;
  if (!sk) return;
  const s = K.s;
  const t = a.t ?? 0;
  const st = a.mo.rig ?? {};
  const A = a.blAct;
  const alive = m.hp > 0;
  const mouth = sk.nosePt;
  const tipOf = () => sk.inHead(6.35, 2.85);
  const whistleEnd = () => {
    const w = whistleAt(1);
    return sk.inHead(w.p[0] + Math.cos(w.an) * 3.2, w.p[1] + Math.sin(w.an) * 3.2);
  };
  // (the marks keep upright and read the right way round, however it faces)
  const unflip = Boolean(a.flip) !== Boolean(K.mirrored(a));
  UNFLIP = unflip;
  ctx.save();
  // ----- its act's own touches -----
  if (A && A.piece && A.cw > 0.01 && alive) {
    const u = A.u;
    const cw = A.cw;
    if (A.piece === 'whistle') {
      // the "something": a bubble drifting by out front... it pops: only a bubble
      if (u > 0.3 && u < 4.7) {
        const x = sk.pivot[0] + 27 * s + Math.sin(u * 1.3) * 1.2 * s;
        const y = sk.pivot[1] - 2 * s - u * 1.6 * s;
        const al = sstep((u - 0.3) / 0.4) * (u < 4.3 ? 1 : 0) * cw;
        bubble(ctx, x, y, 1.5 * s, al);
        if (u >= 4.3) pop(ctx, x, y, 1.5 * s, (u - 4.3) / 0.4);
      }
      if (u > 2.0 && u < 2.7) tweet(ctx, whistleEnd(), (u - 2.0) / 0.7, false, s);
    } else if (A.piece === 'sunscreen') {
      // a dab of sunscreen squeezed onto its flipper's tip
      const tip = sk.pecs.near?.tip;
      if (tip && A.blobTip > 0.01) {
        const b = A.blobTip * cw;
        ctx.save();
        ctx.beginPath();
        for (const [dx, dy, r] of [[0, -0.4, 1.0], [0.7, 0.1, 0.7], [-0.6, 0.2, 0.65]]) {
          ctx.moveTo(tip[0] + (dx + r * b) * s, tip[1] + dy * s);
          ctx.arc(tip[0] + dx * s, tip[1] + dy * s, r * b * s, 0, TAU);
        }
        ctx.fillStyle = '#ffffff';
        ctx.fill('nonzero');
        ctx.strokeStyle = 'rgba(190,202,232,0.9)';
        ctx.lineWidth = 0.3 * s;
        ctx.stroke();
        ctx.restore();
      }
      // rubbed in: a gleam on its head
      if (A.sheen > 0.05) {
        const c = sk.inHead(-5.1, -5.6);
        sparkle(ctx, c[0], c[1] - 1.5 * s, 2.2 * s * A.sheen * cw, '#ffffff');
        sparkle(ctx, c[0] + 2.4 * s, c[1] + 0.5 * s, 1.1 * s * A.sheen * cw, rgba('#fff6c8', A.sheen * cw));
      }
    } else if (A.piece === 'rings') {
      // the ring trick: a perfect ring drifting out and up, a little one shot through it
      const o = st.blRingO ?? mouth;
      if (u > 1.45 && !st.blRingO) st.blRingO = [mouth[0], mouth[1]];
      for (const [ahead, up, r, al] of trickRings(u)) ringAt(ctx, o[0] + ahead * s, o[1] - up * s, r * s, 0.12, al * cw);
      const thru = u - 3.25;
      if (thru > 0 && thru < 0.5) {
        const sx = o[0] + (3 + 4.2 * 1.75) * s;
        const sy = o[1] - 0.35 * (3 + 4.2 * 1.75) * s;
        sparkle(ctx, sx + 1.5 * s, sy - 3.5 * s, 2.2 * s * Math.sin(Math.PI * thru / 0.5) * cw, '#ffffff');
        sparkle(ctx, sx - 2 * s, sy + 3 * s, 1.2 * s * Math.sin(Math.PI * thru / 0.5) * cw, rgba('#fff6c8', cw));
      }
      if (u > 3.95 && u < 4.4) {
        const s2 = 2 + 9.8 * (3.95 - 2.4);
        pop(ctx, o[0] + s2 * s, o[1] - 0.35 * s2 * s, 1.4 * s, (u - 3.95) / 0.45);
      }
      if (u > 5.0 && u < 5.45) {
        const s1 = 3 + 4.2 * 3.5 * (1 - 0.12 * 1.6);
        pop(ctx, o[0] + s1 * s, o[1] - 0.35 * s1 * s, 2 * s, (u - 5.0) / 0.45);
      }
      // a sparkle as it wiggles, proud of itself
      if (u > 3.8 && u < 5.4) {
        const k = Math.sin(Math.PI * ((u - 3.8) / 1.6));
        const c = sk.inHead(1, -13);
        sparkle(ctx, c[0] + Math.sin(u * 3) * 2 * s, c[1], 1.8 * s * k * cw, rgba('#fff6c8', k * cw));
      }
    }
  }
  if (!(A && A.piece === 'rings')) st.blRingO = null;
  // ----- its moves -----
  const MV = a.blMove;
  if (MV && alive) {
    const mt = MV.t;
    if (MV.name === 'rescueRing') {
      // the breath in: little bubbles drawn in to its mouth
      if (mt < 0) {
        const w = clamp(1 + mt / MOVES.rescueRing.anticT, 0, 1);
        for (let i = 0; i < 3; i++) {
          const q = (((t * 1.6 + i / 3) % 1) + 1) % 1;
          const d = (1 - q) * 9 * s;
          bubble(ctx, mouth[0] + d + 1 * s, mouth[1] + (i - 1) * d * 0.4, 0.7 * s, w * Math.sin(Math.PI * q));
        }
      }
      // out of its mouth: the ring growing as it leaves (the dungeon flies it on from here)
      const k = (mt - MOVES.rescueRing.ring) / 0.16;
      if (k > 0 && k < 1) ringAt(ctx, mouth[0] + (2 + 6 * easeOut(k)) * s, mouth[1] - k * 1.2 * s, (2 + 3.6 * easeOut(k)) * s, 0.1, 1 - sstep((k - 0.6) / 0.4), 1);
      if (mt > 0.02 && mt < 0.4) for (let i = 0; i < 3; i++) bubble(ctx, mouth[0] + (1.5 + i * 1.4) * s, mouth[1] - (mt * 10 + i * 1.3) * s, (0.5 + i * 0.15) * s, 1 - mt / 0.4);
    } else if (MV.name === 'buoyBonk') {
      // a gleam on the float at the top of the wind-up
      if (mt < 0) {
        const w = clamp(1 + mt / MOVES.buoyBonk.anticT, 0, 1);
        const B = buoyAt(sk, clamp(sk.S.d1 ?? 0, 0, 1.2));
        const tipP = B.P(B.ctr[0] + Math.cos(B.phi) * 4.5, B.ctr[1] + Math.sin(B.phi) * 4.5);
        sparkle(ctx, tipP[0], tipP[1] - 1 * s, 2.4 * s * sstep((w - 0.6) / 0.4), '#ffffff');
      }
      // the bonk: a soft splash of bubbles round where it lands, a burst of sparkles
      const k = (mt - MOVES.buoyBonk.bonk) / 0.6;
      if (k > 0 && k < 1) {
        const B = buoyAt(sk, 1);
        const c = B.P(B.ctr[0] + Math.cos(B.phi) * 5, B.ctr[1] + Math.sin(B.phi) * 5);
        const e = easeOut(k);
        for (let i = 0; i < 7; i++) {
          const q = -Math.PI * 0.95 + (i / 6) * Math.PI * 0.9;
          bubble(ctx, c[0] + Math.cos(q) * (3 + 8 * e) * s, c[1] + Math.sin(q) * (2 + 6 * e) * s - e * 3 * s, (0.6 + (i % 3) * 0.35) * s, 1 - k);
        }
        if (k < 0.45) {
          const w = k / 0.45;
          sparkle(ctx, c[0], c[1] - 1 * s, 4 * s * (1 - w) * (0.6 + 0.4 * sstep(w * 4)), '#ffffff');
          sparkle(ctx, c[0], c[1] - 1 * s, 2 * s * (1 - w), rgba('#fff2a8', 1 - w));
          ctx.save();
          ctx.globalAlpha *= (1 - w) * 0.85;
          ctx.strokeStyle = '#ffffff';
          ctx.lineCap = 'round';
          ctx.lineWidth = 0.8 * s;
          for (let i = 0; i < 5; i++) {
            const q = -Math.PI * 0.9 + (i / 4) * Math.PI * 0.8;
            const r0 = (3 + 5 * w) * s;
            ctx.beginPath();
            ctx.moveTo(c[0] + Math.cos(q) * r0, c[1] + Math.sin(q) * r0);
            ctx.lineTo(c[0] + Math.cos(q) * (r0 + 2.2 * s), c[1] + Math.sin(q) * (r0 + 2.2 * s));
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      // a soft swoosh behind the float as it comes over
      if (mt >= 0 && mt < 0.16) {
        const w = mt / 0.16;
        ctx.save();
        ctx.globalAlpha *= (1 - w) * 0.7;
        ctx.strokeStyle = '#ffffff';
        ctx.lineCap = 'round';
        ctx.lineWidth = 2.2 * s * (1 - w * 0.5);
        ctx.beginPath();
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
          const d = mix(0.62, 1.0, i / steps);
          const B = buoyAt(sk, d);
          const p = B.P(B.ctr[0] + Math.cos(B.phi) * 4, B.ctr[1] + Math.sin(B.phi) * 4);
          i ? ctx.lineTo(...p) : ctx.moveTo(...p);
        }
        ctx.stroke();
        ctx.strokeStyle = rgba(BL.coral.lt, 0.9);
        ctx.lineWidth = 0.9 * s;
        ctx.stroke();
        ctx.restore();
      }
    } else if (MV.name === 'whistleBlast') {
      const c = whistleEnd();
      // the breath: a small gleam on the whistle as it comes up
      if (mt < 0) {
        const w = clamp(1 + mt / MOVES.whistleBlast.anticT, 0, 1);
        sparkle(ctx, c[0], c[1] - 1.2 * s, 1.8 * s * sstep((w - 0.5) / 0.5), '#ffffff');
      }
      // the blast: a cone of soft sound rings pushing out ahead
      for (let i = 0; i < 4; i++) {
        const k = (mt - MOVES.whistleBlast.blast - i * 0.07) / 0.42;
        if (k <= 0 || k >= 1) continue;
        const r = (3 + 24 * easeOut(k)) * s;
        ctx.save();
        ctx.globalAlpha *= (1 - k) * 0.9;
        ctx.lineCap = 'round';
        for (const [w, col] of [[2.2 * s * (1 - 0.5 * k), BL.ring.edge], [1.3 * s * (1 - 0.5 * k), '#ffffff']]) {
          ctx.strokeStyle = col;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.arc(c[0] - 2 * s, c[1], r, -0.5 - 0.15 * k, 0.5 + 0.15 * k);
          ctx.stroke();
        }
        ctx.restore();
      }
      const k0 = (mt - MOVES.whistleBlast.blast) / 0.5;
      if (k0 > 0 && k0 < 1) {
        upright(ctx, c[0] + (4 + 10 * k0) * s, c[1] - (3 + 5 * k0) * s, unflip, () => note(ctx, 0, 0, 0.7 * s, 1 - k0, BL.coral.sh));
        upright(ctx, c[0] + (6 + 12 * k0) * s, c[1] + (2 - 3 * k0) * s, unflip, () => note(ctx, 0, 0, 0.55 * s, (1 - k0) * 0.8, '#8f9bd0'));
        sparkle(ctx, c[0] + 2 * s, c[1] - 1 * s, 2.4 * s * (1 - k0), rgba('#fff6c8', 1 - k0));
      }
    }
  }
  // ----- its marks (on its drawn head) -----
  const over = sk.inHead(0.6, -16.5);
  if (a.blBang >= 0) {
    mark(ctx, over[0], over[1], '!', a.blBang, 1.1, s, unflip);
    if (a.blBang > 0.2 && a.blBang < 0.8) tweet(ctx, whistleEnd(), (a.blBang - 0.2) / 0.6, false, s);
  } else if (a.blHuh >= 0) mark(ctx, over[0], over[1], '?', a.blHuh, 1.4, s, unflip);
  // after landing a hit: a note bobbing up off its head, a sparkle (and the clap, its pose)
  if (a.blGloat >= 0 && a.blGloat < 1.05) {
    const e = a.blGloat;
    const c = sk.inHead(2.5, -13);
    upright(ctx, c[0] + e * 5 * s, c[1] - e * 7 * s - Math.abs(Math.sin(e * 10)) * 1.2 * s, unflip, () => note(ctx, 0, 0, 0.8 * s, Math.min(1, (1.05 - e) * 4) * sstep(e / 0.1), BL.coral.sh));
    sparkle(ctx, c[0] - 5 * s, c[1] + 3 * s - e * 3 * s, 1.6 * s * Math.sin(Math.PI * clamp(e, 0, 1)), rgba('#fff6c8', 1));
    for (const c0 of MOVES.clap.claps) {
      const k = (e - c0) / 0.18;
      if (k > 0 && k < 1) {
        const p = sk.pecs.near?.tip;
        if (p) sparkle(ctx, p[0] + 1 * s, p[1] - 1.5 * s, 1.5 * s * Math.sin(Math.PI * k), '#ffffff');
      }
    }
  }
  // asleep: soft z's in little bubbles drifting up
  if (a.blNap) {
    const c = sk.inHead(-1.5, -12.5);
    for (let i = 0; i < 2; i++) {
      const q = ((a.now ?? t) * 0.4 + i * 0.5) % 1;
      upright(ctx, c[0] + q * 5 * s + Math.sin(q * 5) * 1.2 * s, c[1] - q * 9 * s, unflip, () => zee(ctx, 0, 0, 0.6 + q * 0.5, Math.sin(Math.PI * q), s));
    }
  }
  // beaten: bubbles and sparkles circling over its head
  if (!alive) {
    const c = sk.inHead(0.5, -13.5);
    for (let i = 0; i < 3; i++) {
      const q = t * 3 + (i / 3) * TAU;
      const x = c[0] + Math.cos(q) * 5 * s;
      const y = c[1] + Math.sin(q) * 1.6 * s;
      if (i % 2) bubble(ctx, x, y, 0.9 * s, 0.9);
      else sparkle(ctx, x, y, 1.5 * s, '#fff6c8');
    }
  }
  ctx.restore();
}

// ---------- Its Rescue Ring in flight (the dungeon's 'spit' vfx: render/dreamfx.js dreamShot) ----------
// `p` 0..1 along its flight, `d` the way it flies. Returns true if it drew.
export function bubbleRingShot(ctx, shot, x, y, p, d) {
  if (shot !== 'bubblering') return false;
  ctx.save();
  // a trail of little bubbles behind it
  for (let i = 1; i <= 3; i++) bubble(ctx, x - d * i * 3.4, y + Math.sin(p * 20 + i) * 0.8 + i * 0.3, 0.9 - i * 0.12, 0.75 * (1 - i / 4));
  // (tipping a little with its arc: up as it rises, down as it falls)
  ringAt(ctx, x, y, 5.4, d * (p - 0.5) * 0.7, 1, 1);
  sparkle(ctx, x + d * 2.5, y - 5.5, 1.3 + Math.sin(p * 26) * 0.4, '#fff6c8');
  ctx.restore();
  return true;
}

// ---------- Its dress on the whale calf ----------
const look = {
  P: {
    scale: 0.9,
    // (a chubby calf: a big head with a round melon, a soft neck behind it, a plump middle, a short
    // tail stock to its flukes; no dorsal fin)
    spine: [[13, 0.4, 10.0, 8.6], [8, 0, 10.2, 9.2], [3, -0.2, 11.4, 10.4], [-2.6, 0, 10.8, 9.6], [-7.6, 0.4, 8.2, 6.8], [-11.8, 0.6, 5.0, 4.1], [-15.2, 0.4, 3.0, 2.6], [-17.8, 0.2, 2.1, 1.9]],
    pivot: 2,
    front: { pts: [[1.8, 8.1], [4.0, 6.7], [5.7, 5.2], [6.5, 3.8], [6.6, 2.6], [6.0, 1.6], [5.3, 0.9], [5.85, -1.2], [6.15, -3.8], [5.6, -6.4], [4.0, -8.5], [2.0, -9.7]], tip: 4 },
    dorsal: null,
    pec: { at: [8.8, -4.6], len: 9, w: 4.6, ang: 128, scull: 14, tuck: 158, out: 100 },
    tail: { kind: 'flukes', len: 8, w: 2, spread: 52, notch: 0.62 },
    swim: { amp: 12, fin: 1.8, lag: 0.75, beats: 1.4, idle: 0.3, scull: 0.5, paddle: 14, recoil: 2.5, bob: 0.9 },
    speed: 44,
    lean: 1,
    swimFins: -0.1,
    turn: [0.2, 0.6, 24],
    float: 5,
    playful: 0,
    moves: POOL,
  },
  C: BL.C,
  ink: BL.ink,
  lineW: 2.4,
  fxC: BL.fxC,
  moves: MOVES,
  pleased: 'clap',
  pick,
  paint: blPaint,
  face: blFace,
  pose: blPose,
  spot: (sk, what) => (what === 'mouth' ? sk.nosePt : null),
  under: { body: blBuoy(false) },
  over: { body: blBuoy(true), face: (ctx, a, mode, K) => {
    ctx.save();
    blVisor(ctx, a, mode, K);
    ctx.restore();
    blWhistle(ctx, a, mode, K);
  } },
  fx: blFx,
};

export const BELUGA_LIFEGUARD = dressedWhale(look);
// (`noHop`: none of the monster drawer's hops or idle notes over it; `ownEmotes`: its marks over its
// head left to it, drawn in its own style on its drawn head)
BELUGA_LIFEGUARD.art.noHop = true;
BELUGA_LIFEGUARD.art.ownEmotes = true;
// (its dress, for the dev tools that watch its parts frame by frame)
export const BELUGA_LIFEGUARD_LOOK = look;
